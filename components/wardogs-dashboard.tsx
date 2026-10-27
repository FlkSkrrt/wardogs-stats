import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get('steamId') || '76561198000000000';

  const stats = {
    steamId,
    totals: {
      matches: 184,
      wins: 121,
      losses: 63,
      kd: '1.92',
      avgDamage: '2,840',
    },
    leaderboard: [
      { rank: 1, player: 'Wardog_Voltage', server: 'Breeze Harbor', kd: '2.14', wins: 31 },
      { rank: 2, player: 'MirePhantom', server: 'South Ridge', kd: '1.98', wins: 28 },
      { rank: 3, player: 'BlitzHound', server: 'Blackwater', kd: '1.91', wins: 26 },
      { rank: 4, player: 'RiftEcho', server: 'Cinder Valley', kd: '1.86', wins: 23 },
      { rank: 5, player: 'PyreWolf', server: 'Stormgate', kd: '1.81', wins: 21 }
    ],
    recentMatches: [
      { id: 1, server: 'Breeze Harbor', map: 'Operation: Iron Coast', result: 'Victory', kd: '2.5', damage: '4,120' },
      { id: 2, server: 'Blackwater', map: 'Crossfire Ridge', result: 'Defeat', kd: '1.2', damage: '2,440' },
      { id: 3, server: 'South Ridge', map: 'Nightfall Bastion', result: 'Victory', kd: '3.1', damage: '5,680' },
      { id: 4, server: 'Stormgate', map: 'Dust Harbor', result: 'Victory', kd: '1.9', damage: '3,980' },
      { id: 5, server: 'Cinder Valley', map: 'Freshwater Run', result: 'Victory', kd: '2.6', damage: '4,710' }
    ]
  };

  return NextResponse.json(stats);
}

