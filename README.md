# WARDOGS Stats

A web-based stat-tracking platform for WARDOGS communities. This MVP includes:

- Steam account linking flow
- token-based authentication simulation
- historical across-server combat metrics
- leaderboard and match summaries
- modern dashboard UI

## Features

- Player dashboard for linked Steam accounts
- Token authentication endpoint for secure session bootstrap
- Aggregated combat stats across community servers
- Recent battle history with wins, losses, K/D ratios, and damage output
- Community leaderboards and server crossovers

## Getting started

1. Install dependencies:
   npm install
2. Run the app:
   npm run dev
3. Open http://localhost:3000

## API overview

- POST /api/auth/steam
  - Accepts `{ steamId, token }`
  - Returns a mock authenticated session record
- GET /api/stats?steamId=76561198000000000
  - Returns aggregated combat stats and recent matches

## Notes

This is a frontend-focused MVP designed to demonstrate the platform workflow and stat model. It uses mock data in-memory rather than a persistent data store or real Steam API integration.
