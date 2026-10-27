import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, createUserSession, setSessionCookie, upsertSteamUser, verifySteamCallback } from '@/lib/steam-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const nonce = searchParams.get('nonce');
  const redirectTo = searchParams.get('redirect') || '/';

  if (!state || !nonce) {
    const response = NextResponse.redirect(new URL('/?error=steam_auth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    clearSessionCookie(response);
    return response;
  }

  try {
    const authResult = await verifySteamCallback(request.url, state, nonce);
    const user = await upsertSteamUser(authResult.steamId, authResult.displayName);
    const session = await createUserSession(user.id);

    const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    setSessionCookie(response, session.sessionToken);
    return response;
  } catch (error) {
    const response = NextResponse.redirect(new URL('/?error=steam_auth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    clearSessionCookie(response);
    return response;
  }
}
