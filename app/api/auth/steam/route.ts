import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'wardogs_session';
const DEMO_STEAM_ID = '76561198000000000';
const DEMO_TOKEN = 'demo-token-wardogs';

function setSessionCookie(response: NextResponse, value: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || '/';
  const response = NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  setSessionCookie(response, DEMO_STEAM_ID);
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { steamId, token } = body as { steamId?: string; token?: string };

  if (!steamId || !token) {
    return NextResponse.json({ error: 'steamId and token are required' }, { status: 400 });
  }

  if (steamId !== DEMO_STEAM_ID || token !== DEMO_TOKEN) {
    return NextResponse.json({ error: 'Invalid Steam account or API token.' }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    steamId,
    displayName: 'Wardog_Voltage',
    apiToken: token,
    sessionToken: DEMO_STEAM_ID,
  });

  setSessionCookie(response, DEMO_STEAM_ID);
  return response;
}
