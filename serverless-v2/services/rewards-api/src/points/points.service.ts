import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { calculatePoints } from './points-calculator';
import { checkTierUpgrade, getTierUpgradeMessage } from '../tiers/tier-logic';
import { detectMilestones } from '../tiers/milestone-detector';
import { getCurrentMonthKey } from '../common/utils/month-key';
import { getMilestoneMessage, type MilestoneThreshold } from '../common/constants/milestones';
import {
  Tier,
  TIER_NAMES,
  getNextTier,
  getPointsToNextTier,
  getProgressToNextTier,
} from '../common/constants/tiers';
import type { AwardPointsInput, AwardPointsResult, PointsLedgerEntry } from '../common/types';
import type { PlayerRewards } from '../common/types';
import { randomUUID } from 'crypto';

@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(
    private readonly dynamo: DynamoService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async awardPoints(input: AwardPointsInput): Promise<AwardPointsResult> {
    const monthKey = getCurrentMonthKey();

    let player = await this.getOrCreatePlayer(input.playerId, monthKey);

    if (player.currentMonthKey !== monthKey) {
      player = await this.rolloverMonth(player, monthKey);
    }

    const calculation = calculatePoints(input.bigBlind, player.currentTier);

    const previousMonthlyTotal = player.monthlyPoints;
    const newMonthlyTotal = player.monthlyPoints + calculation.earnedPoints;
    const newLifetimeTotal = player.lifetimePoints + calculation.earnedPoints;

    const timestamp = Date.now();
    const transactionId = randomUUID();

    const ledgerEntry: PointsLedgerEntry = {
      playerId: input.playerId,
      timestamp,
      transactionId,
      handId: input.handId,
      tableId: input.tableId,
      tableStakes: input.tableStakes,
      bigBlind: input.bigBlind,
      basePoints: calculation.basePoints,
      multiplier: calculation.multiplier,
      earnedPoints: calculation.earnedPoints,
      playerTier: player.currentTier,
      monthKey,
      type: 'hand',
      reason: null,
      createdAt: new Date(timestamp).toISOString(),
    };

    await this.dynamo.put(TABLE_NAMES.TRANSACTIONS, ledgerEntry);

    const tierUpgrade = checkTierUpgrade(player.currentTier, newMonthlyTotal);
    const currentTier = tierUpgrade ? tierUpgrade.newTier : player.currentTier;

    await this.dynamo.update(
      TABLE_NAMES.PLAYERS,
      { playerId: input.playerId },
      {
        monthlyPoints: newMonthlyTotal,
        lifetimePoints: newLifetimeTotal,
        currentTier: currentTier,
        updatedAt: new Date().toISOString(),
      },
    );

    const milestonesReached = detectMilestones(previousMonthlyTotal, newMonthlyTotal);

    if (tierUpgrade) {
      await this.notificationsService.createNotification(
        input.playerId,
        'tier_upgrade',
        `Reached ${TIER_NAMES[tierUpgrade.newTier]} tier!`,
        getTierUpgradeMessage(tierUpgrade.previousTier, tierUpgrade.newTier),
      );
    }

    for (const milestone of milestonesReached) {
      await this.notificationsService.createNotification(
        input.playerId,
        'milestone',
        `${milestone.toLocaleString()} points milestone!`,
        getMilestoneMessage(milestone as MilestoneThreshold),
      );
    }

    this.logger.log(
      `Awarded ${calculation.earnedPoints} pts to ${input.playerId} ` +
      `(${calculation.basePoints} base x ${calculation.multiplier} multiplier). ` +
      `Monthly: ${newMonthlyTotal}, Tier: ${TIER_NAMES[currentTier]}` +
      (tierUpgrade ? ` [UPGRADED from ${TIER_NAMES[tierUpgrade.previousTier]}]` : '') +
      (milestonesReached.length > 0 ? ` [MILESTONES: ${milestonesReached.join(', ')}]` : ''),
    );

    return {
      earnedPoints: calculation.earnedPoints,
      basePoints: calculation.basePoints,
      multiplier: calculation.multiplier,
      newMonthlyTotal,
      currentTier,
      tierUpgrade,
      milestonesReached,
    };
  }

  async getRewardsSummary(playerId: string) {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const currentTier = player.currentTier as Tier;
    const monthlyPoints = player.monthlyPoints as number;
    const nextTier = getNextTier(currentTier);

    return {
      playerId: player.playerId as string,
      currentTier,
      tierName: TIER_NAMES[currentTier],
      monthlyPoints,
      lifetimePoints: player.lifetimePoints as number,
      pointsToNextTier: getPointsToNextTier(currentTier, monthlyPoints),
      nextTierName: nextTier ? TIER_NAMES[nextTier] : null,
      progressPercent: getProgressToNextTier(currentTier, monthlyPoints),
      currentMonthKey: player.currentMonthKey as string,
    };
  }

  async getPointsHistory(
    playerId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const allTransactions = await this.dynamo.query(
      TABLE_NAMES.TRANSACTIONS,
      'playerId = :pid',
      { ':pid': playerId },
      { scanIndexForward: false },
    );

    const total = allTransactions.length;
    const items = allTransactions.slice(offset, offset + limit);

    return { items, total, limit, offset };
  }

  private async getOrCreatePlayer(
    playerId: string,
    monthKey: string,
  ): Promise<PlayerRewards> {
    const existing = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId });

    if (existing) {
      return existing as unknown as PlayerRewards;
    }

    const now = new Date().toISOString();
    const newPlayer: PlayerRewards = {
      playerId,
      currentTier: Tier.BRONZE,
      monthlyPoints: 0,
      lifetimePoints: 0,
      currentMonthKey: monthKey,
      displayName: playerId,
      email: `${playerId}@example.com`,
      tierOverride: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put(TABLE_NAMES.PLAYERS, newPlayer as unknown as Record<string, unknown>);
    this.logger.log(`Created new player: ${playerId}`);
    return newPlayer;
  }

  private async rolloverMonth(
    player: PlayerRewards,
    newMonthKey: string,
  ): Promise<PlayerRewards> {
    await this.dynamo.update(
      TABLE_NAMES.PLAYERS,
      { playerId: player.playerId },
      {
        monthlyPoints: 0,
        currentMonthKey: newMonthKey,
        updatedAt: new Date().toISOString(),
      },
    );

    this.logger.log(
      `Month rollover for ${player.playerId}: ${player.currentMonthKey} -> ${newMonthKey}, ` +
      `reset monthlyPoints from ${player.monthlyPoints} to 0`,
    );

    return {
      ...player,
      monthlyPoints: 0,
      currentMonthKey: newMonthKey,
    };
  }

  async getTierHistory(
    playerId: string,
  ): Promise<Array<{ monthKey: string; tier: Tier; monthlyPoints: number }>> {
    const items = await this.dynamo.query(
      TABLE_NAMES.TIER_HISTORY,
      'playerId = :pid',
      { ':pid': playerId },
      { scanIndexForward: false },
    );

    return items as unknown as Array<{ monthKey: string; tier: Tier; monthlyPoints: number }>;
  }
}
