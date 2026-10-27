import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const servers = [
    { slug: 'breeze-harbor', name: 'Breeze Harbor', region: 'NA-East' },
    { slug: 'blackwater', name: 'Blackwater', region: 'EU-Central' },
    { slug: 'south-ridge', name: 'South Ridge', region: 'APAC' },
    { slug: 'stormgate', name: 'Stormgate', region: 'NA-West' },
  ];

  for (const server of servers) {
    await prisma.server.upsert({
      where: { slug: server.slug },
      update: {},
      create: server,
    });
  }

  const testUser = await prisma.user.upsert({
    where: { steamId: '76561198000000000' },
    update: {
      displayName: 'Wardog_Voltage',
      username: 'wardog_voltage',
      apiToken: 'demo-token-wardogs',
    },
    create: {
      steamId: '76561198000000000',
      displayName: 'Wardog_Voltage',
      username: 'wardog_voltage',
      apiToken: 'demo-token-wardogs',
    },
  });

  const serverIds = await prisma.server.findMany({ select: { id: true, slug: true } });
  const serverMap = new Map(serverIds.map((server) => [server.slug, server.id]));

  const sampleMatches = [
    { mapName: 'Operation: Iron Coast', result: 'Victory', kd: 2.5, damage: 4120, serverId: serverMap.get('breeze-harbor')!, userId: testUser.id },
    { mapName: 'Crossfire Ridge', result: 'Defeat', kd: 1.2, damage: 2440, serverId: serverMap.get('blackwater')!, userId: testUser.id },
    { mapName: 'Nightfall Bastion', result: 'Victory', kd: 3.1, damage: 5680, serverId: serverMap.get('south-ridge')!, userId: testUser.id },
    { mapName: 'Dust Harbor', result: 'Victory', kd: 1.9, damage: 3980, serverId: serverMap.get('stormgate')!, userId: testUser.id },
    { mapName: 'Freshwater Run', result: 'Victory', kd: 2.6, damage: 4710, serverId: serverMap.get('south-ridge')!, userId: testUser.id }
  ];

  for (const match of sampleMatches) {
    await prisma.match.upsert({
      where: {
        id: randomUUID(),
      },
      update: {},
      create: {
        ...match,
        id: randomUUID(),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
