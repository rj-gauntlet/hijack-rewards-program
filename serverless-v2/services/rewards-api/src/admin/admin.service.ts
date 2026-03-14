import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TIER_NAMES, Tier } from '../common/constants/tiers';
import { getCurrentMonthKey } from '../common/utils/month-key';
import type {
  PlayerRewards,
  PointsLedgerEntry,
  Notification,
  TierOverride,
} from '../common/types';
import { randomUUID } from 'crypto';

export interface PlayerFullProfile {
  player: PlayerRewards;
  recentTransactions: PointsLedgerEntry[];
  tierHistory: Array<{ monthKey: string; tier: Tier; monthlyPoints: number }>;
  notifications: Notification[];
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dynamo: DynamoService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPlayerProfile(playerId: string): Promise<PlayerFullProfile> {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const [transactions, tierHistory, notificationsResult] = await Promise.all([
      this.dynamo.query(
        TABLE_NAMES.TRANSACTIONS,
        'playerId = :pid',
        { ':pid': playerId },
        { scanIndexForward: false, limit: 50 },
      ),
      this.dynamo.query(
        TABLE_NAMES.TIER_HISTORY,
        'playerId = :pid',
        { ':pid': playerId },
        { scanIndexForward: false },
      ),
      this.notificationsService.getNotifications(playerId),
    ]);

    return {
      player: player as unknown as PlayerRewards,
      recentTransactions: transactions as unknown as PointsLedgerEntry[],
      tierHistory: tierHistory as unknown as Array<{ monthKey: string; tier: Tier; monthlyPoints: number }>,
      notifications: notificationsResult.notifications,
    };
  }

  async adjustPoints(
    playerId: string,
    points: number,
    reason: string,
  ): Promise<{ ledgerEntry: PointsLedgerEntry; newMonthlyTotal: number; newLifetimeTotal: number }> {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const playerData = player as unknown as PlayerRewards;
    const monthKey = getCurrentMonthKey();
    const now = new Date();

    const ledgerEntry: PointsLedgerEntry = {
      playerId,
      timestamp: now.getTime(),
      transactionId: randomUUID(),
      handId: 'admin',
      tableId: 'admin',
      tableStakes: 'N/A',
      bigBlind: 0,
      basePoints: Math.abs(points),
      multiplier: 1,
      earnedPoints: points,
      playerTier: playerData.currentTier,
      monthKey,
      type: 'admin_adjust',
      reason,
      createdAt: now.toISOString(),
    };

    await this.dynamo.put(
      TABLE_NAMES.TRANSACTIONS,
      ledgerEntry as unknown as Record<string, unknown>,
    );

    const newMonthlyTotal = Math.max(0, playerData.monthlyPoints + points);
    const newLifetimeTotal = Math.max(0, playerData.lifetimePoints + points);

    await this.dynamo.update(
      TABLE_NAMES.PLAYERS,
      { playerId },
      {
        monthlyPoints: newMonthlyTotal,
        lifetimePoints: newLifetimeTotal,
        updatedAt: now.toISOString(),
      },
    );

    this.logger.log(
      `Admin adjusted ${playerId}: ${points > 0 ? '+' : ''}${points} points (reason: ${reason})`,
    );

    return { ledgerEntry, newMonthlyTotal, newLifetimeTotal };
  }

  async setTierOverride(
    playerId: string,
    tier: Tier,
    reason: string,
    expiresAt: string,
  ): Promise<{ previousTier: Tier; overrideTier: Tier }> {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const playerData = player as unknown as PlayerRewards;
    const override: TierOverride = { tier, reason, expiresAt };

    await this.dynamo.update(
      TABLE_NAMES.PLAYERS,
      { playerId },
      {
        currentTier: tier,
        tierOverride: override as unknown as Record<string, unknown>,
        updatedAt: new Date().toISOString(),
      },
    );

    await this.notificationsService.createNotification(
      playerId,
      'tier_upgrade',
      `Tier set to ${TIER_NAMES[tier]}`,
      `An admin has set your tier to ${TIER_NAMES[tier]}. Reason: ${reason}`,
    );

    this.logger.log(
      `Admin tier override for ${playerId}: ${TIER_NAMES[playerData.currentTier]} -> ${TIER_NAMES[tier]} (reason: ${reason}, expires: ${expiresAt})`,
    );

    return { previousTier: playerData.currentTier, overrideTier: tier };
  }
}
