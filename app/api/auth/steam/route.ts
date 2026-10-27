import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie, createUserSession, setSessionCookie } from '@/lib/steam-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || '/';

  if (process.env.STEAM_OPENID_ENABLED !== 'true') {
    const user = await prisma.user.upsert({
      where: { steamId: '76561198000000000' },
      update: { displayName: 'Wardog_Voltage' },
      create: {
        steamId: '76561198000000000',
        displayName: 'Wardog_Voltage',
        username: 'wardog_voltage',
        apiToken: 'demo-token-wardogs',
      },
    });

    const session = await createUserSession(user.id);
    const response = NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    setSessionCookie(response, session.sessionToken);
    return response;
  }

  const callback = new URL('/api/auth/steam/callback', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  callback.searchParams.set('redirect', redirectPath);
  return NextResponse.redirect(callback.toString());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { steamId, token } = body as { steamId?: string; token?: string };

  if (!steamId || !token) {
    return NextResponse.json({ error: 'steamId and token are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user || user.apiToken !== token) {
    return NextResponse.json({ error: 'Invalid Steam account or API token.' }, { status: 401 });
  }

  const session = await createUserSession(user.id);
  const response = NextResponse.json({
    success: true,
    steamId,
    displayName: user.displayName,
    apiToken: user.apiToken,
    sessionToken: session.sessionToken,
  });

  setSessionCookie(response, session.sessionToken);
  return response;
}
