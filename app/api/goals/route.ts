import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { goals, workspaces, workspaceMembers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const createGoalSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(4000).optional().nullable(),
});

async function findOrCreatePersonalWorkspace(userId: string) {
  const existing = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaces.name, 'Personal')))
    .limit(1);
  if (existing.length > 0) return existing[0].id;

  const id = uuidv4();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({ id, name: 'Personal', ownerId: userId, createdAt: now, updatedAt: now });
    await tx.insert(workspaceMembers).values({ workspaceId: id, userId, role: 'owner' });
  });
  return id;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db.select().from(goals).where(eq(goals.ownerId, session.user.id));
    return NextResponse.json(rows);
  } catch (e) {
    console.error('Failed to list goals:', e);
    return NextResponse.json({ error: 'Failed to list goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { title, description } = parsed.data;
    const workspaceId = await findOrCreatePersonalWorkspace(session.user.id);
    const id = uuidv4();
    const now = new Date();

    await db.insert(goals).values({
      id,
      title,
      description: description ?? null,
      ownerId: session.user.id,
      workspaceId,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, title, description: description ?? null, workspaceId, status: 'draft', createdAt: now, updatedAt: now });
  } catch (e) {
    console.error('Failed to create goal:', e);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

