#!/usr/bin/env node

/**
 * Seed streaks DynamoDB tables with sample data matching the NestJS schema.
 *
 * Creates 10 players with 60 days of activity history, milestone rewards,
 * and freeze usage records.
 *
 * Usage: node scripts/seed-streaks.js
 */

'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

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

const MILESTONES = [
  { days: 3, loginReward: 50, playReward: 100 },
  { days: 7, loginReward: 150, playReward: 300 },
  { days: 14, loginReward: 400, playReward: 800 },
  { days: 30, loginReward: 1000, playReward: 2000 },
  { days: 60, loginReward: 2500, playReward: 5000 },
  { days: 90, loginReward: 5000, playReward: 10000 },
];

const PLAYERS = [
  { id: 'streak-001', name: 'DailyGrinder', loginRate: 0.9, playRate: 0.85 },
  { id: 'streak-002', name: 'WeekendWarrior', loginRate: 0.3, playRate: 0.7 },
  { id: 'streak-003', name: 'IronWill', loginRate: 0.95, playRate: 0.9 },
  { id: 'streak-004', name: 'CasualPlayer', loginRate: 0.2, playRate: 0.4 },
  { id: 'streak-005', name: 'StreakHunter', loginRate: 0.85, playRate: 0.65 },
  { id: 'streak-006', name: 'Newcomer', loginRate: 0.5, playRate: 0.3 },
  { id: 'streak-007', name: 'Veteran', loginRate: 0.75, playRate: 0.8 },
  { id: 'streak-008', name: 'NightOwl', loginRate: 0.6, playRate: 0.55 },
  { id: 'streak-009', name: 'EarlyBird', loginRate: 0.7, playRate: 0.7 },
  { id: 'streak-010', name: 'Perfectionist', loginRate: 1.0, playRate: 1.0 },
];

// Seeded RNG for deterministic output
let rngState = 42;
function seededRandom() {
  rngState ^= rngState << 13;
  rngState ^= rngState >> 17;
  rngState ^= rngState << 5;
  return (rngState >>> 0) / 0xffffffff;
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthKey(dateStr) {
  return dateStr.substring(0, 7);
}

async function put(table, item) {
  await docClient.send(new PutCommand({ TableName: table, Item: item }));
}

async function seed() {
  console.log(`Seeding streaks data to ${ENDPOINT}...`);
  rngState = 42; // reset RNG

  const today = new Date();
  const todayStr = formatDate(today);
  const DAYS = 60;

  let totalActivities = 0;
  let totalRewards = 0;
  let totalFreezes = 0;

  for (const player of PLAYERS) {
    let loginStreak = 0;
    let playStreak = 0;
    let bestLoginStreak = 0;
    let bestPlayStreak = 0;
    let lastLoginDate = null;
    let lastPlayDate = null;
    let freezesAvailable = 1;
    let freezesUsedThisMonth = 0;
    let lastFreezeGrantDate = null;

    for (let d = DAYS - 1; d >= 0; d--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - d);
      const dateStr = formatDate(date);
      const currentMonth = getMonthKey(dateStr);

      // Monthly freeze grant
      if (lastFreezeGrantDate !== currentMonth) {
        freezesAvailable++;
        freezesUsedThisMonth = 0;
        lastFreezeGrantDate = currentMonth;
      }

      const didLogin = seededRandom() < player.loginRate;
      const didPlay = didLogin && seededRandom() < player.playRate;

      if (didLogin) {
        // Check login gap
        if (lastLoginDate === null) {
          loginStreak = 1;
        } else {
          const lastDate = new Date(lastLoginDate + 'T00:00:00Z');
          const thisDate = new Date(dateStr + 'T00:00:00Z');
          const gap = Math.round((thisDate - lastDate) / 86400000);

          if (gap === 1) {
            loginStreak++;
          } else if (gap > 1) {
            const missed = gap - 1;
            if (freezesAvailable >= missed) {
              // Freeze covers all missed days
              for (let f = 1; f <= missed; f++) {
                const freezeDate = new Date(lastDate);
                freezeDate.setUTCDate(freezeDate.getUTCDate() + f);
                const freezeDateStr = formatDate(freezeDate);

                await put('streaks-activity', {
                  playerId: player.id,
                  date: freezeDateStr,
                  loggedIn: false,
                  played: false,
                  freezeUsed: true,
                  streakBroken: false,
                  loginStreakAtDay: loginStreak,
                  playStreakAtDay: playStreak,
                });
                await put('streaks-freeze-history', {
                  playerId: player.id,
                  date: freezeDateStr,
                  source: 'free_monthly',
                });
                freezesAvailable--;
                freezesUsedThisMonth++;
                totalFreezes++;
                totalActivities++;
              }
              // Streak preserved (not incremented)
            } else {
              // Write break record for first missed day only
              {
                const breakDate = new Date(lastDate);
                breakDate.setUTCDate(breakDate.getUTCDate() + 1);
                await put('streaks-activity', {
                  playerId: player.id,
                  date: formatDate(breakDate),
                  loggedIn: false,
                  played: false,
                  freezeUsed: false,
                  streakBroken: true,
                  loginStreakAtDay: 0,
                  playStreakAtDay: 0,
                });
                totalActivities++;
              }
              loginStreak = 1;
            }
          }
        }

        lastLoginDate = dateStr;
        if (loginStreak > bestLoginStreak) bestLoginStreak = loginStreak;

        // Check login milestones
        for (const ms of MILESTONES) {
          if (loginStreak === ms.days) {
            await put('streaks-rewards', {
              playerId: player.id,
              rewardId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'login_milestone',
              milestone: ms.days,
              points: ms.loginReward,
              streakCount: loginStreak,
              createdAt: date.toISOString(),
            });
            totalRewards++;
          }
        }
      }

      if (didPlay) {
        if (lastPlayDate === null) {
          playStreak = 1;
        } else {
          const lastDate = new Date(lastPlayDate + 'T00:00:00Z');
          const thisDate = new Date(dateStr + 'T00:00:00Z');
          const gap = Math.round((thisDate - lastDate) / 86400000);
          if (gap === 1) {
            playStreak++;
          } else if (gap > 1) {
            playStreak = 1;
          }
        }
        lastPlayDate = dateStr;
        if (playStreak > bestPlayStreak) bestPlayStreak = playStreak;

        for (const ms of MILESTONES) {
          if (playStreak === ms.days) {
            await put('streaks-rewards', {
              playerId: player.id,
              rewardId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'play_milestone',
              milestone: ms.days,
              points: ms.playReward,
              streakCount: playStreak,
              createdAt: date.toISOString(),
            });
            totalRewards++;
          }
        }
      }

      // Write activity record for this day
      if (didLogin || didPlay) {
        await put('streaks-activity', {
          playerId: player.id,
          date: dateStr,
          loggedIn: didLogin,
          played: didPlay,
          freezeUsed: false,
          streakBroken: false,
          loginStreakAtDay: loginStreak,
          playStreakAtDay: playStreak,
        });
        totalActivities++;
      }
    }

    // Write player record
    await put('streaks-players', {
      playerId: player.id,
      displayName: player.name,
      loginStreak,
      playStreak,
      bestLoginStreak,
      bestPlayStreak,
      lastLoginDate,
      lastPlayDate,
      freezesAvailable,
      freezesUsedThisMonth,
      lastFreezeGrantDate,
      createdAt: new Date(today.getTime() - DAYS * 86400000).toISOString(),
      updatedAt: today.toISOString(),
    });

    console.log(
      `  ${player.name}: login=${loginStreak} (best ${bestLoginStreak}), ` +
      `play=${playStreak} (best ${bestPlayStreak}), freezes=${freezesAvailable}`
    );
  }

  console.log(`\nSeeded 10 players, ${totalActivities} activities, ${totalRewards} rewards, ${totalFreezes} freeze records.`);
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
