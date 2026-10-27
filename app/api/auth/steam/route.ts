import { NextRequest, NextResponse } from 'next/server';
import { Issuer, generators } from 'openid-client';
import { fetchSteamProfile, getLocalGameStats } from '@/lib/steam';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get('redirect') || '/';

  const issuer = await Issuer.discover('https://steamcommunity.com/openid');
  const callbackUrl = new URL('/api/auth/steam/callback', APP_URL).toString();
  const client = new issuer.Client({
    client_id: callbackUrl,
    redirect_uris: [callbackUrl],
    response_types: ['id_token'],
  });

  const state = `${generators.state()}|${encodeURIComponent(redirectPath)}`;
  const nonce = generators.nonce();

  const authUrl = client.authorizationUrl({
    scope: 'openid',
    state,
    nonce,
    prompt: 'consent',
  });

  return NextResponse.redirect(authUrl);
}
