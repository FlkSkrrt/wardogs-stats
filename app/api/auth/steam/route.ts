import { NextRequest, NextResponse } from 'next/server';

const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || '16E8D6E915112293A5A09D29082DF90D';
const DEFAULT_STEAM_ID = process.env.DEFAULT_STEAM_ID || '76561198000000000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || '/';

  const profileUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_WEB_API_KEY}&steamids=${DEFAULT_STEAM_ID}`;
  const profileRes = await fetch(profileUrl);
  const profileJson = await profileRes.json();
  const player = profileJson?.response?.players?.[0];

  const response = NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  response.cookies.set({
    name: 'wardogs_session',
    value: DEFAULT_STEAM_ID,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  if (player) {
    response.headers.set('x-steam-display-name', player.personaname || 'Steam User');
    response.headers.set('x-steam-avatar', player.avatarfull || '');
  }

  return response;
}
