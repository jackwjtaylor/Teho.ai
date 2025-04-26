import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reminders, users } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

// Vercel cron job handler for checking and sending reminders
export async function GET(req: Request) {
  try {
    // Verify that this is a cron job request from Vercel
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('🔍 Checking for pending reminders...');
    
    // Get all pending reminders that are due
    const pendingReminders = await db
      .select({
        reminder: reminders,
        user: {
          email: users.email,
          name: users.name
        }
      })
      .from(reminders)
      .leftJoin(users, eq(reminders.userId, users.id))
      .where(
        and(
          eq(reminders.status, 'pending'),
          lte(reminders.reminderTime, new Date())
        )
      );

    console.log(`📬 Found ${pendingReminders.length} reminders to send`);

    // Send emails for each reminder
    const results = await Promise.allSettled(
      pendingReminders.map(async ({ reminder, user }) => {
        // Skip reminders for users without email
        if (!user?.email) {
          console.warn(`Skipping reminder ${reminder.id}: No email found for user ${reminder.userId}`);
          return reminder.id;
        }

        // Send the email
        await sendEmail({
          to: user.email,
          subject: `Reminder: ${reminder.title}`,
          type: 'reminder',
          data: {
            todoTitle: reminder.title,
            dueDate: reminder.reminderTime.toLocaleString(),
            userName: user.name ?? 'there'
          }
        });

        // Update reminder status to sent
        await db
          .update(reminders)
          .set({
            status: 'sent',
            updatedAt: new Date()
          })
          .where(eq(reminders.id, reminder.id));

        return reminder.id;
      })
    );

    // Count successes and failures
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Successfully sent ${succeeded} reminders`);
    if (failed > 0) {
      console.error(`❌ Failed to send ${failed} reminders`);
    }

    return NextResponse.json({
      success: true,
      sent: succeeded,
      failed
    });
  } catch (error) {
    console.error('Error in reminder check cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
} 