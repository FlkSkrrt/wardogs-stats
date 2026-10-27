import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'wardogs_session';

export function isSteamOpenIdEnabled() {
  return process.env.STEAM_OPENID_ENABLED === 'true';
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export async function createUserSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
    include: {
      user: true,
    },
  });
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
    path: '/',
    maxAge: 0,
    httpOnly: true,
  });
}

export async function getSessionUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) return null;
  return session.user;
}

export async function upsertSteamUser(steamId: string, displayName?: string) {
  const normalizedDisplay = displayName || `Steam-${steamId}`;

  return prisma.user.upsert({
    where: { steamId },
    update: {
      displayName: normalizedDisplay,
      username: normalizedDisplay,
      updatedAt: new Date(),
    },
    create: {
      steamId,
      displayName: normalizedDisplay,
      username: normalizedDisplay,
      apiToken: randomUUID(),
    },
  });
}

export async function ensureDemoData() {
  const demoSteamId = '76561198000000000';
  const user = await upsertSteamUser(demoSteamId, 'Wardog_Voltage');

  const serverNames = ['Breeze Harbor', 'Blackwater', 'South Ridge', 'Stormgate'];
  const existingMatches = await prisma.match.count({ where: { userId: user.id } });

  if (existingMatches > 0) return user;

  for (const [index, serverName] of serverNames.entries()) {
    const server = await prisma.server.upsert({
      where: { slug: serverName.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        slug: serverName.toLowerCase().replace(/\s+/g, '-'),
        name: serverName,
        region: index % 2 === 0 ? 'NA' : 'EU',
      },
    });

    await prisma.match.create({
      data: {
        userId: user.id,
        serverId: server.id,
        mapName: ['Operation: Iron Coast', 'Crossfire Ridge', 'Nightfall Bastion', 'Dust Harbor'][index],
        result: index % 2 === 0 ? 'Victory' : 'Defeat',
        kd: [2.5, 1.2, 3.1, 1.9][index],
        damage: [4120, 2440, 5680, 3980][index],
      },
    });
  }

  return user;
}
