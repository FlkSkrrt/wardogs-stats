import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/steam-auth';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/prisma');
  const matches = await prisma.match.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { server: true },
  });

  const totals = matches.reduce(
    (acc, match) => {
      acc.matches += 1;
      acc.wins += match.result === 'Victory' ? 1 : 0;
      acc.losses += match.result === 'Defeat' ? 1 : 0;
      acc.kills += match.kd ? Math.round(match.kd * 10) : 0;
      acc.damage += match.damage ?? 0;
      return acc;
    },
    { matches: 0, wins: 0, losses: 0, kills: 0, damage: 0 }
  );

  const leaderboard = [
    { rank: 1, player: user.displayName || user.username || 'Anonymous', server: 'Breeze Harbor', kd: '2.14', wins: 31 },
    { rank: 2, player: 'MirePhantom', server: 'South Ridge', kd: '1.98', wins: 28 },
    { rank: 3, player: 'BlitzHound', server: 'Blackwater', kd: '1.91', wins: 26 },
  ];

  const recentMatches = matches.map((match) => ({
    id: match.id,
    server: match.server.name,
    map: match.mapName,
    result: match.result,
    kd: match.kd?.toFixed(1) ?? '0.0',
    damage: (match.damage ?? 0).toLocaleString(),
    createdAt: match.createdAt,
  }));

  const kd = totals.matches > 0 ? (totals.kills / totals.matches / 10).toFixed(2) : '0.00';

  return NextResponse.json({
    steamId: user.steamId,
    totals: {
      matches: totals.matches,
      wins: totals.wins,
      losses: totals.losses,
      kd,
      avgDamage: totals.matches > 0 ? Math.round(totals.damage / totals.matches).toLocaleString() : '0',
    },
    leaderboard,
    recentMatches,
  });
}
