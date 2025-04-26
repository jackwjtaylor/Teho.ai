import { Resend } from 'resend';
import { createElement } from 'react';
import { ReminderEmail } from '@/emails/ReminderEmail';
import { WeeklyReviewEmail } from '@/emails/WeeklyReviewEmail';
import type { ComponentProps } from 'react';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'hi@agenda.dev';

export type EmailType = 'reminder' | 'weekly-review';

type EmailData = {
  reminder: ComponentProps<typeof ReminderEmail>;
  'weekly-review': ComponentProps<typeof WeeklyReviewEmail>;
};

interface SendEmailOptions<T extends EmailType> {
  to: string;
  subject: string;
  type: T;
  data: EmailData[T];
}

export async function sendEmail<T extends EmailType>({ 
  to, 
  subject, 
  type, 
  data 
}: SendEmailOptions<T>) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react: type === 'reminder'
        ? createElement(ReminderEmail, data as EmailData['reminder'])
        : createElement(WeeklyReviewEmail, data as EmailData['weekly-review']),
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
} 