#!/usr/bin/env node

/**
 * Seed rewards DynamoDB tables with realistic data.
 *
 * Creates 175 players across 6 months of history with natural tier distribution,
 * varied stakes, tier upgrades/downgrades, and milestones.
 *
 * Usage: node scripts/seed-rewards.js
 */

'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000';
const REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLES = {
  PLAYERS: 'rewards-players',
  TRANSACTIONS: 'rewards-transactions',
  NOTIFICATIONS: 'rewards-notifications',
  LEADERBOARD: 'rewards-leaderboard',
  TIER_HISTORY: 'rewards-tier-history',
};

const TIER = { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 };
const TIER_NAMES = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum' };
const TIER_THRESHOLDS = { 1: 0, 2: 500, 3: 2000, 4: 10000 };
const TIER_MULTIPLIERS = { 1: 1.0, 2: 1.25, 3: 1.5, 4: 2.0 };

const STAKES = [
  { minBB: 0.10, maxBB: 0.25, base: 1, label: '$0.10-$0.25' },
  { minBB: 0.50, maxBB: 1.00, base: 2, label: '$0.50-$1.00' },
  { minBB: 2.00, maxBB: 5.00, base: 5, label: '$2.00-$5.00' },
  { minBB: 10.00, maxBB: 25.00, base: 10, label: '$10.00+' },
];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Sage', 'River', 'Phoenix', 'Dakota', 'Skyler', 'Charlie', 'Reese', 'Drew',
  'Blake', 'Cameron', 'Hayden', 'Kendall', 'Logan', 'Parker', 'Rowan', 'Finley',
  'Emerson', 'Kai', 'Harper', 'Ellis', 'Marley', 'Oakley', 'Lennox', 'Remy',
  'Sawyer', 'Wren', 'Arden', 'Briar', 'Cypress', 'Dune', 'Everett', 'Flynn',
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Kim', 'Garcia', 'Mueller', 'Silva', 'Johnson', 'Tanaka',
  'Singh', 'Johansson', 'Costa', 'Williams', 'Novak', 'Okafor', 'Brown',
  'Anderson', 'Martinez', 'Lee', 'Smith', 'Wilson', 'Taylor', 'Thomas',
  'Moore', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams',
  'Nelson', 'Hill',
];

class SeededRandom {
  constructor(seed) {
    this.state = seed | 0 || 1;
  }
  next() {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 4294967296;
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(arr) {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

function uuid(rng) {
  const h = () => rng.nextInt(0, 15).toString(16);
  const s = (n) => Array.from({ length: n }, h).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${s(4)}-${s(12)}`;
}

function getMonthKeys(current, count) {
  const months = [];
  let [y, m] = current.split('-').map(Number);
  for (let i = 0; i < count; i++) {
    months.unshift(`${y}-${String(m).padStart(2, '0')}`);
    m--;
    if (m < 1) { m = 12; y--; }
  }
  return months;
}

function getTierForPoints(pts) {
  if (pts >= TIER_THRESHOLDS[4]) return TIER.PLATINUM;
  if (pts >= TIER_THRESHOLDS[3]) return TIER.GOLD;
  if (pts >= TIER_THRESHOLDS[2]) return TIER.SILVER;
  return TIER.BRONZE;
}

function calcPoints(bigBlind, tier) {
  let base = 1;
  for (const s of STAKES) {
    if (bigBlind >= s.minBB && bigBlind <= s.maxBB) { base = s.base; break; }
  }
  const mult = TIER_MULTIPLIERS[tier];
  return { base, mult, earned: Math.floor(base * mult) };
}

const PROFILES = [
  { name: 'whale', weight: 3, handsMin: 800, handsMax: 2000, stakes: [2, 3] },
  { name: 'grinder', weight: 32, handsMin: 300, handsMax: 800, stakes: [1, 2] },
  { name: 'casual', weight: 40, handsMin: 50, handsMax: 300, stakes: [0, 1] },
  { name: 'occasional', weight: 25, handsMin: 5, handsMax: 50, stakes: [0, 1] },
];

function pickProfile(rng) {
  const total = PROFILES.reduce((s, p) => s + p.weight, 0);
  let roll = rng.next() * total;
  for (const p of PROFILES) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return PROFILES[2];
}

async function batchWrite(tableName, items) {
  const BATCH_SIZE = 25;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: batch.map(item => ({ PutRequest: { Item: item } })),
      },
    }));
  }
}

async function seed() {
  const PLAYER_COUNT = 175;
  const MONTHS_OF_HISTORY = 6;
  const currentMonth = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const rng = new SeededRandom(42);
  const months = getMonthKeys(currentMonth, MONTHS_OF_HISTORY);

  console.log(`Seeding ${PLAYER_COUNT} players with ${MONTHS_OF_HISTORY} months of history...`);
  console.log(`Months: ${months.join(', ')}`);
  console.log(`Endpoint: ${ENDPOINT}`);

  const allPlayers = [];
  const allTransactions = [];
  const allNotifications = [];
  const allTierHistory = [];

  const usedNames = new Set();

  for (let i = 0; i < PLAYER_COUNT; i++) {
    const playerId = uuid(rng);
    let displayName;
    do {
      displayName = `${rng.pick(FIRST_NAMES)}${rng.pick(LAST_NAMES)}${rng.nextInt(1, 999)}`;
    } while (usedNames.has(displayName));
    usedNames.add(displayName);

    const email = `${displayName.toLowerCase()}@example.com`;
    const profile = pickProfile(rng);

    let currentTier = TIER.BRONZE;
    let lifetimePoints = 0;
    let monthlyPoints = 0;

    for (const monthKey of months) {
      const isCurrentMonth = monthKey === currentMonth;

      if (!isCurrentMonth && monthKey !== months[0]) {
        const required = TIER_THRESHOLDS[currentTier];
        if (monthlyPoints < required && currentTier > TIER.BRONZE) {
          const prevTier = currentTier;
          currentTier = Math.max(TIER.BRONZE, currentTier - 1);
          allNotifications.push({
            playerId,
            notificationId: uuid(rng),
            type: 'tier_downgrade',
            title: `Tier adjusted to ${TIER_NAMES[currentTier]}`,
            message: `Your tier has been adjusted to ${TIER_NAMES[currentTier]}. Keep playing!`,
            isRead: rng.next() > 0.5,
            createdAt: new Date(`${monthKey}-01T00:00:00Z`).toISOString(),
          });
        }
      }

      allTierHistory.push({
        playerId,
        monthKey,
        tier: currentTier,
        monthlyPoints: isCurrentMonth ? 0 : monthlyPoints,
      });

      monthlyPoints = 0;
      const handsThisMonth = rng.nextInt(profile.handsMin, profile.handsMax);
      const [yearStr, monthStr] = monthKey.split('-');

      for (let h = 0; h < handsThisMonth; h++) {
        const stakesIdx = rng.pick(profile.stakes);
        const bracket = STAKES[stakesIdx];
        const bigBlind = Math.round((bracket.minBB + rng.next() * (bracket.maxBB - bracket.minBB)) * 100) / 100;
        const pts = calcPoints(bigBlind, currentTier);

        const day = rng.nextInt(1, 28);
        const hour = rng.nextInt(0, 23);
        const minute = rng.nextInt(0, 59);
        const second = rng.nextInt(0, 59);
        const ts = new Date(Date.UTC(
          parseInt(yearStr), parseInt(monthStr) - 1,
          day, hour, minute, second,
        ));

        const prevMonthly = monthlyPoints;
        monthlyPoints += pts.earned;
        lifetimePoints += pts.earned;

        allTransactions.push({
          playerId,
          timestamp: ts.getTime(),
          transactionId: uuid(rng),
          handId: uuid(rng),
          tableId: `table-${rng.nextInt(1, 20)}`,
          tableStakes: bracket.label,
          bigBlind,
          basePoints: pts.base,
          multiplier: pts.mult,
          earnedPoints: pts.earned,
          playerTier: currentTier,
          monthKey,
          type: 'hand',
          reason: null,
          createdAt: ts.toISOString(),
        });

        const nextTier = currentTier + 1;
        if (nextTier <= TIER.PLATINUM &&
            prevMonthly < TIER_THRESHOLDS[nextTier] &&
            monthlyPoints >= TIER_THRESHOLDS[nextTier]) {
          currentTier = getTierForPoints(monthlyPoints);
          allNotifications.push({
            playerId,
            notificationId: uuid(rng),
            type: 'tier_upgrade',
            title: `Reached ${TIER_NAMES[currentTier]} tier!`,
            message: `Congratulations! You've reached ${TIER_NAMES[currentTier]} tier!`,
            isRead: rng.next() > 0.3,
            createdAt: new Date(ts.getTime() + 1000).toISOString(),
          });
        }
      }

      if (!isCurrentMonth) {
        allTierHistory[allTierHistory.length - 1].monthlyPoints = monthlyPoints;
      }
    }

    allPlayers.push({
      playerId,
      currentTier,
      monthlyPoints,
      lifetimePoints,
      currentMonthKey: currentMonth,
      displayName,
      email,
      tierOverride: null,
      createdAt: new Date(Date.UTC(2025, 0, 1, rng.nextInt(0, 23), rng.nextInt(0, 59))).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Assign fixed IDs for walkthrough: rank 50 and rank 150 (outside top 10, outside top 100)
  allPlayers.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  const id50 = allPlayers[49].playerId;
  const id150 = allPlayers[149].playerId;
  const replace = (id) => {
    if (id === id50) return 'walkthrough-rank-50';
    if (id === id150) return 'walkthrough-rank-150';
    return id;
  };
  allPlayers[49].playerId = 'walkthrough-rank-50';
  allPlayers[149].playerId = 'walkthrough-rank-150';
  allTransactions.forEach(t => { t.playerId = replace(t.playerId); });
  allNotifications.forEach(n => { n.playerId = replace(n.playerId); });
  allTierHistory.forEach(t => { t.playerId = replace(t.playerId); });

  // Guarantee walkthrough-rank-50 has 3 notifications: 2 unread, 1 read (for demo)
  const now = new Date().toISOString();
  allNotifications.push(
    { playerId: 'walkthrough-rank-50', notificationId: uuid(rng), type: 'milestone', title: '500 points milestone!', message: "You've earned 500 points this month!", isRead: false, createdAt: now },
    { playerId: 'walkthrough-rank-50', notificationId: uuid(rng), type: 'tier_upgrade', title: 'Reached Silver tier!', message: "Congratulations! You've reached Silver tier!", isRead: false, createdAt: now },
    { playerId: 'walkthrough-rank-50', notificationId: uuid(rng), type: 'tier_downgrade', title: 'Tier adjusted to Bronze', message: 'Your tier has been adjusted to Bronze. Keep playing!', isRead: true, createdAt: now },
  );

  const tierDist = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  allPlayers.forEach(p => tierDist[TIER_NAMES[p.currentTier]]++);

  console.log(`\nGenerated data:`);
  console.log(`  Players: ${allPlayers.length}`);
  console.log(`  Transactions: ${allTransactions.length}`);
  console.log(`  Notifications: ${allNotifications.length}`);
  console.log(`  Tier history: ${allTierHistory.length}`);
  console.log(`  Tier distribution: ${JSON.stringify(tierDist)}`);
  console.log(`  Walkthrough IDs: walkthrough-rank-50 (rank ~50), walkthrough-rank-150 (rank ~150)`);

  console.log(`\nWriting players...`);
  await batchWrite(TABLES.PLAYERS, allPlayers);

  console.log(`Writing tier history...`);
  await batchWrite(TABLES.TIER_HISTORY, allTierHistory);

  console.log(`Writing notifications...`);
  await batchWrite(TABLES.NOTIFICATIONS, allNotifications);

  console.log(`Writing transactions (${allTransactions.length} entries, this may take a moment)...`);
  const TX_SAMPLE_LIMIT = 5000;
  const txToWrite = allTransactions.length > TX_SAMPLE_LIMIT
    ? allTransactions.sort(() => 0.5 - Math.random()).slice(0, TX_SAMPLE_LIMIT)
    : allTransactions;
  console.log(`  Writing ${txToWrite.length} of ${allTransactions.length} transactions`);
  await batchWrite(TABLES.TRANSACTIONS, txToWrite);

  console.log(`\nDone! Seeded ${allPlayers.length} players with ${txToWrite.length} transactions.`);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
