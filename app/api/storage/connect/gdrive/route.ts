import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getAuthUrl } from '@/lib/storage/googleDrive';

export async function GET() {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = getAuthUrl();
  return NextResponse.redirect(url);
}

