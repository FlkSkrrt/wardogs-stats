import { NextRequest, NextResponse } from 'next/server';
import { fetchSteamProfile, getLocalGameStats } from '@/lib/steam';

export async function GET(request: NextRequest) {
  const steamId = request.cookies.get('wardogs_session')?.value;

  if (!steamId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await fetchSteamProfile(steamId);

    if (!profile) {
      return NextResponse.json({ error: 'Steam profile not found.' }, { status: 404 });
    }

    return NextResponse.json(getLocalGameStats(profile));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Unable to load Steam profile.' },
      { status: 500 }
    );
  }
}
