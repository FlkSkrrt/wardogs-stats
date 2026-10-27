import { NextRequest, NextResponse } from 'next/server';
import { Issuer } from 'openid-client';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || '';
  const nonce = searchParams.get('nonce') || '';

  if (!state || !nonce) {
    return NextResponse.redirect(new URL('/?steam_error=missing_openid_state', APP_URL));
  }

  const redirect = state.includes('|') ? decodeURIComponent(state.split('|')[1]) : '/';
  const normalizedState = state.includes('|') ? state.split('|')[0] : state;

  try {
    const issuer = await Issuer.discover('https://steamcommunity.com/openid');
    const callbackUrl = new URL('/api/auth/steam/callback', APP_URL).toString();
    const client = new issuer.Client({
      client_id: callbackUrl,
      redirect_uris: [callbackUrl],
      response_types: ['id_token'],
    });

    const params = client.callbackParams(request.url);
    const tokenSet = await client.callback(callbackUrl, params, {
      state: normalizedState,
      nonce,
    });

    const claimedId = tokenSet.claims.sub;
    const steamId = claimedId?.replace('https://steamcommunity.com/openid/id/', '');

    if (!steamId) {
      throw new Error('Steam authentication returned no user id.');
    }

    const response = NextResponse.redirect(new URL(redirect.startsWith('/') ? redirect : '/', APP_URL));
    response.cookies.set({
      name: 'wardogs_session',
      value: steamId,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(new URL(`/?steam_error=${encodeURIComponent((error as Error).message)}`, APP_URL));
  }
}
