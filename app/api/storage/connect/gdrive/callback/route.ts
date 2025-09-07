import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { exchangeCodeForTokens } from '@/lib/storage/googleDrive';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieStore.toString() }) });
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?settings=true&drive=error`);
  }
  if (!code) {
    return NextResponse.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?settings=true&drive=missing_code`);
  }

  try {
    await exchangeCodeForTokens(session.user.id, code);
    return NextResponse.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?settings=true&drive=connected`);
  } catch (e) {
    console.error('Drive token exchange failed:', e);
    return NextResponse.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/?settings=true&drive=failed`);
  }
}

