import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { comments, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { todoId, text } = await req.json();
  if (!todoId || !text) {
    return NextResponse.json({ error: 'Todo ID and text are required' }, { status: 400 });
  }

  const now = new Date();
  const comment = await db.insert(comments).values({
    id: uuidv4(),
    text,
    todoId,
    userId: session.user.id,
    createdAt: now,
  }).returning();

  // Get user info
  const user = await db.select({
    name: users.name,
    image: users.image
  })
  .from(users)
  .where(eq(users.id, session.user.id))
  .then(rows => rows[0]);

  return NextResponse.json({
    ...comment[0],
    createdAt: now.toISOString(),
    user: user || null
  });
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { todoId, commentId } = await req.json();
  if (!todoId || !commentId) {
    return NextResponse.json({ error: 'Todo ID and comment ID are required' }, { status: 400 });
  }

  await db.delete(comments)
    .where(
      and(
        eq(comments.id, commentId),
        eq(comments.todoId, todoId),
        eq(comments.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
} 