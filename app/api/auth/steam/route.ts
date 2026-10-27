import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Issuer, generators } from 'openid-client';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'wardogs_session';

export function getBaseUrl(request?: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function makeSteamAuthorizationUrl(request: NextRequest, redirectPath = '/') {
  const issuer = await Issuer.discover('https://steamcommunity.com/openid');
  const callbackUrl = new URL('/api/auth/steam/callback', getBaseUrl(request));
  const client = new issuer.Client({
    client_id: callbackUrl.toString(),
    redirect_uris: [callbackUrl.toString()],
    response_types: ['id_token'],
  });

  const state = generators.state();
  const nonce = generators.nonce();

  const authUrl = client.authorizationUrl({
    scope: 'openid',
    state,
    nonce,
    prompt: 'consent',
  });

  return {
    authUrl: `${authUrl}&redirect=${encodeURIComponent(redirectPath)}`,
    state,
    nonce,
    callbackUrl: callbackUrl.toString(),
  };
}

export async function verifySteamCallback(requestUrl: string, expectedState: string, expectedNonce: string) {
  const issuer = await Issuer.discover('https://steamcommunity.com/openid');
  const callbackUrl = new URL('/api/auth/steam/callback', getBaseUrl());
  const client = new issuer.Client({
    client_id: callbackUrl.toString(),
    redirect_uris: [callbackUrl.toString()],
    response_types: ['id_token'],
  });

  const params = client.callbackParams(requestUrl);
  const tokenSet = await client.callback(callbackUrl.toString(), params, {
    state: expectedState,
    nonce: expectedNonce,
  });

  const claimedId = tokenSet.claims.sub;
  if (!claimedId || typeof claimedId !== 'string') {
    throw new Error('Steam authentication returned an invalid identity.');
  }

  const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '');
  return { steamId, displayName: `Steam-${steamId}` };
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    maxAge: 0,
    path: '/',
  });
}

export async function createUserSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
    include: { user: true },
  });

  return session;
}

export async function getSessionUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return session.user;
}

export async function upsertSteamUser(steamId: string, displayName?: string) {
  const normalizedDisplayName = displayName || `Steam-${steamId}`;

  const user = await prisma.user.upsert({
    where: { steamId },
    update: {
      displayName: normalizedDisplayName,
      username: normalizedDisplayName,
      updatedAt: new Date(),
    },
    create: {
      steamId,
      displayName: normalizedDisplayName,
      username: normalizedDisplayName,
      apiToken: randomUUID(),
    },
  });

  return user;
}
