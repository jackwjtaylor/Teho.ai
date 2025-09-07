import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { storageAccounts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const gdrive = await db.query.storageAccounts.findFirst({
    where: and(eq(storageAccounts.userId, session.user.id), eq(storageAccounts.provider, 'gdrive')),
  });

  return NextResponse.json({ providers: [
    { provider: 'gdrive', connected: !!gdrive?.accessToken },
  ]});
}

