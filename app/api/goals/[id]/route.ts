import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { goals, milestones, todos, artifacts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.id;

    const goal = await db.query.goals.findFirst({ where: and(eq(goals.id, goalId), eq(goals.ownerId, session.user.id)) });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const mls = await db.select().from(milestones).where(eq(milestones.goalId, goalId));
    const tsks = await db.select().from(todos).where(eq(todos.goalId, goalId));
    const arts = await db.select().from(artifacts).where(eq(artifacts.goalId, goalId));

    return NextResponse.json({ goal, milestones: mls, tasks: tsks, artifacts: arts });
  } catch (e) {
    console.error('Failed to fetch goal:', e);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

