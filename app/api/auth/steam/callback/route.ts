import { NextRequest, NextResponse } from 'next/server';
import { makeSteamAuthorizationUrl } from '@/lib/steam-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || '/';
  const { authUrl } = await makeSteamAuthorizationUrl(request, redirectPath);
  return NextResponse.redirect(authUrl);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}}));
  const { steamId, token } = body as { steamId?: string; token?: string };

  if (!steamId || !token) {
    return NextResponse.json({ error: 'steamId and token are required' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user || user.apiToken !== token) {
    return NextResponse.json({ error: 'Invalid Steam account or API token.' }, { status: 401 });
  }

  const session = await prisma.session.create({
    data: {
      sessionToken: crypto.randomUUID(),
      userId: user.id,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const response = NextResponse.json({
    success: true,
    steamId,
    displayName: user.displayName,
    apiToken: user.apiToken,
    sessionToken: session.sessionToken,
  });

  response.cookies.set({
    name: 'wardogs_session',
    value: session.sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
