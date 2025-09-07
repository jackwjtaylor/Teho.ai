import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { goals, artifacts } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { ensureGoalFolder, uploadTextFile } from '@/lib/storage/googleDrive';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goalId = params.id;
    const goal = await db.query.goals.findFirst({ where: and(eq(goals.id, goalId), eq(goals.ownerId, session.user.id)) });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const folderName = `Teho - ${goal.title}`;
    const { folderId } = await ensureGoalFolder(session.user.id, folderName);

    const toUpload = await db.select().from(artifacts).where(and(eq(artifacts.goalId, goalId), isNull(artifacts.externalId)));

    const uploaded: Array<{ id: string; name: string }> = [];
    for (const art of toUpload) {
      const fileId = await uploadTextFile(session.user.id, folderId, art.name, art.content || '');
      await db.update(artifacts).set({ externalId: fileId, path: `/${folderName}/${art.name}` }).where(eq(artifacts.id, art.id));
      uploaded.push({ id: art.id, name: art.name });
    }

    return NextResponse.json({ success: true, uploaded });
  } catch (e) {
    console.error('Sync storage failed:', e);
    return NextResponse.json({ error: 'Failed to sync storage' }, { status: 500 });
  }
}

