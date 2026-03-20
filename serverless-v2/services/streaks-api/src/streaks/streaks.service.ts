import { Injectable } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { StreakPlayer, StreakState, DailyActivity, MilestoneHit } from '../common/types';
import { calculateStreakUpdate, getMissedDatesBetween } from '../streak/streak-calculator';
import { detectMilestones, getNextMilestone } from '../streak/milestone-detector';
import { tryConsumeFreezes, checkMonthlyFreezeGrant } from '../streak/freeze-logic';
import { getUtcToday, formatDate } from '../common/utils/date-utils';

@Injectable()
export class StreaksService {

  constructor(private readonly dynamo: DynamoService) {}

  async getPlayer(playerId: string): Promise<StreakPlayer | null> {
    const item = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    return item as StreakPlayer | null;
  }

  async getOrCreatePlayer(playerId: string): Promise<StreakPlayer> {
    const existing = await this.getPlayer(playerId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const player: StreakPlayer = {
      playerId,
      displayName: playerId,
      loginStreak: 0,
      playStreak: 0,
      bestLoginStreak: 0,
      bestPlayStreak: 0,
      lastLoginDate: null,
      lastPlayDate: null,
      freezesAvailable: 0,
      freezesUsedThisMonth: 0,
      lastFreezeGrantDate: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.dynamo.put(TABLE_NAMES.PLAYERS, player as unknown as Record<string, unknown>);
    return player;
  }

  async checkIn(playerId: string): Promise<{
    player: StreakPlayer;
    milestones: MilestoneHit[];
    alreadyCheckedIn: boolean;
  }> {
    const today = getUtcToday();
    let player = await this.getOrCreatePlayer(playerId);

    // Monthly freeze grant (lazy)
    const grant = checkMonthlyFreezeGrant(player, today);
    if (grant) {
      player = { ...player, ...grant };
    }

    // Idempotent — already checked in today
    if (player.lastLoginDate === today) {
      return { player, milestones: [], alreadyCheckedIn: true };
    }

    // Calculate streak update
    const result = calculateStreakUpdate(
      player.lastLoginDate,
      today,
      player.loginStreak,
      player.freezesAvailable,
    );

    // Handle freeze consumption for missed days
    let freezesAvailable = player.freezesAvailable;
    let freezesUsedThisMonth = player.freezesUsedThisMonth;

    if (player.lastLoginDate && result.freezesConsumed > 0) {
      const missedDates = getMissedDatesBetween(player.lastLoginDate, today);
      const freezeResult = tryConsumeFreezes(freezesAvailable, missedDates);

      // Write freeze activity records for protected days
      for (const freezeDate of freezeResult.freezeDates) {
        await this.writeActivity({
          playerId,
          date: freezeDate,
          loggedIn: false,
          played: false,
          freezeUsed: true,
          streakBroken: false,
          loginStreakAtDay: player.loginStreak,
          playStreakAtDay: player.playStreak,
        });
        await this.writeFreezeHistory(playerId, freezeDate);
      }

      // Write streak broken record for the first unprotected day only
      if (!freezeResult.streakSurvived) {
        const firstUnprotectedDate = missedDates[freezeResult.daysProtected];
        await this.writeActivity({
          playerId,
          date: firstUnprotectedDate,
          loggedIn: false,
          played: false,
          freezeUsed: false,
          streakBroken: true,
          loginStreakAtDay: 0,
          playStreakAtDay: 0,
        });
      }

      freezesAvailable -= freezeResult.daysProtected;
      freezesUsedThisMonth += freezeResult.daysProtected;
    } else if (player.lastLoginDate && result.streakReset) {
      // No freezes but streak reset — mark only the first missed day as broken
      const missedDates = getMissedDatesBetween(player.lastLoginDate, today);
      if (missedDates.length > 0) {
        await this.writeActivity({
          playerId,
          date: missedDates[0],
          loggedIn: false,
          played: false,
          freezeUsed: false,
          streakBroken: true,
          loginStreakAtDay: 0,
          playStreakAtDay: 0,
        });
      }
    }

    // Detect milestones
    const milestones = detectMilestones(result.previousStreak, result.newStreak, 'login');

    // Write milestone rewards
    for (const hit of milestones) {
      await this.writeReward(playerId, hit, result.newStreak);
    }

    // Update best streak
    const bestLoginStreak = Math.max(player.bestLoginStreak, result.newStreak);

    // Write today's activity
    await this.writeActivity({
      playerId,
      date: today,
      loggedIn: true,
      played: false,
      freezeUsed: false,
      streakBroken: false,
      loginStreakAtDay: result.newStreak,
      playStreakAtDay: player.playStreak,
    });

    // Update player record
    const updatedPlayer: StreakPlayer = {
      ...player,
      loginStreak: result.newStreak,
      bestLoginStreak,
      lastLoginDate: today,
      freezesAvailable,
      freezesUsedThisMonth,
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.put(TABLE_NAMES.PLAYERS, updatedPlayer as unknown as Record<string, unknown>);

    return { player: updatedPlayer, milestones, alreadyCheckedIn: false };
  }

  async recordHandCompleted(
    playerId: string,
    completedAt: string,
  ): Promise<{
    player: StreakPlayer;
    milestones: MilestoneHit[];
    alreadyPlayed: boolean;
  }> {
    const playDate = formatDate(new Date(completedAt));
    let player = await this.getOrCreatePlayer(playerId);

    // Idempotent — already played today
    if (player.lastPlayDate === playDate) {
      return { player, milestones: [], alreadyPlayed: true };
    }

    // Calculate play streak update (freezes already handled by check-in)
    const result = calculateStreakUpdate(
      player.lastPlayDate,
      playDate,
      player.playStreak,
      0, // Don't consume freezes for play — handled by check-in
    );

    // Detect play milestones
    const milestones = detectMilestones(result.previousStreak, result.newStreak, 'play');
    for (const hit of milestones) {
      await this.writeReward(playerId, hit, result.newStreak);
    }

    const bestPlayStreak = Math.max(player.bestPlayStreak, result.newStreak);

    // Update today's activity record (merge with login activity if exists)
    const existingActivity = await this.dynamo.get(TABLE_NAMES.ACTIVITY, {
      playerId,
      date: playDate,
    }) as DailyActivity | null;

    if (existingActivity) {
      await this.dynamo.update(
        TABLE_NAMES.ACTIVITY,
        { playerId, date: playDate },
        { played: true, playStreakAtDay: result.newStreak },
      );
    } else {
      await this.writeActivity({
        playerId,
        date: playDate,
        loggedIn: false,
        played: true,
        freezeUsed: false,
        streakBroken: false,
        loginStreakAtDay: player.loginStreak,
        playStreakAtDay: result.newStreak,
      });
    }

    const updatedPlayer: StreakPlayer = {
      ...player,
      playStreak: result.newStreak,
      bestPlayStreak,
      lastPlayDate: playDate,
      updatedAt: new Date().toISOString(),
    };
    await this.dynamo.put(TABLE_NAMES.PLAYERS, updatedPlayer as unknown as Record<string, unknown>);

    return { player: updatedPlayer, milestones, alreadyPlayed: false };
  }

  async getStreakState(playerId: string): Promise<StreakState | null> {
    const player = await this.getPlayer(playerId);
    if (!player) return null;

    return {
      loginStreak: player.loginStreak,
      playStreak: player.playStreak,
      bestLoginStreak: player.bestLoginStreak,
      bestPlayStreak: player.bestPlayStreak,
      freezesAvailable: player.freezesAvailable,
      nextLoginMilestone: getNextMilestone(player.loginStreak, 'login'),
      nextPlayMilestone: getNextMilestone(player.playStreak, 'play'),
      lastLoginDate: player.lastLoginDate,
      lastPlayDate: player.lastPlayDate,
    };
  }

  private async writeActivity(activity: DailyActivity): Promise<void> {
    await this.dynamo.put(TABLE_NAMES.ACTIVITY, activity as unknown as Record<string, unknown>);
  }

  private async writeFreezeHistory(playerId: string, date: string): Promise<void> {
    await this.dynamo.put(TABLE_NAMES.FREEZE_HISTORY, {
      playerId,
      date,
      source: 'free_monthly',
    });
  }

  private async writeReward(playerId: string, hit: MilestoneHit, streakCount: number): Promise<void> {
    const now = new Date();
    const rewardId = `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await this.dynamo.put(TABLE_NAMES.REWARDS, {
      playerId,
      rewardId,
      type: hit.type,
      milestone: hit.milestone,
      points: hit.points,
      streakCount,
      createdAt: now.toISOString(),
    });
  }
}
