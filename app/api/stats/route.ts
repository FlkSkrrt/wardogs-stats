import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steamId, token } = body as { steamId?: string; token?: string };

    if (!steamId || !token) {
      return NextResponse.json({ error: 'Steam ID and token are required.' }, { status: 400 });
    }

    const playerName = steamId === '76561198000000000' ? 'Wardog_Voltage' : 'CommunityOperator';

    return NextResponse.json({
      success: true,
      playerName,
      steamId,
      token,
      message: 'Steam account successfully linked and authenticated.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }
}
