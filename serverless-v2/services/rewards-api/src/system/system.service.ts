import { Injectable, Logger } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { calculateTierAfterReset, getTierDowngradeMessage } from '../tiers/tier-logic';
import { getCurrentMonthKey, getPreviousMonthKey } from '../common/utils/month-key';
import { Tier, TIER_NAMES } from '../common/constants/tiers';
import type { PlayerRewards } from '../common/types';

export interface ResetResult {
  totalPlayers: number;
  tierChanges: Array<{
    playerId: string;
    previousTier: Tier;
    newTier: Tier;
  }>;
  monthKey: string;
  previousMonthKey: string;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private readonly dynamo: DynamoService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processMonthlyReset(): Promise<ResetResult> {
    const currentMonthKey = getCurrentMonthKey();
    const previousMonthKey = getPreviousMonthKey(currentMonthKey);

    this.logger.log(`Starting monthly reset: ${previousMonthKey} -> ${currentMonthKey}`);

    const allPlayers = await this.dynamo.scan(TABLE_NAMES.PLAYERS);
    const players = allPlayers as unknown as PlayerRewards[];

    const tierChanges: ResetResult['tierChanges'] = [];

    for (const player of players) {
      await this.writeTierHistory(player, previousMonthKey);

      const resetEvent = calculateTierAfterReset(
        player.currentTier,
        player.monthlyPoints,
      );

      const updates: Record<string, unknown> = {
        monthlyPoints: 0,
        currentMonthKey: currentMonthKey,
        updatedAt: new Date().toISOString(),
      };

      if (resetEvent) {
        updates.currentTier = resetEvent.newTier;

        tierChanges.push({
          playerId: player.playerId,
          previousTier: resetEvent.previousTier,
          newTier: resetEvent.newTier,
        });

        await this.notificationsService.createNotification(
          player.playerId,
          'tier_downgrade',
          `Tier adjusted to ${TIER_NAMES[resetEvent.newTier]}`,
          getTierDowngradeMessage(resetEvent.previousTier, resetEvent.newTier),
        );

        this.logger.log(
          `${player.playerId}: ${TIER_NAMES[resetEvent.previousTier]} -> ${TIER_NAMES[resetEvent.newTier]} (floor protection)`,
        );
      }

      await this.dynamo.update(
        TABLE_NAMES.PLAYERS,
        { playerId: player.playerId },
        updates,
      );
    }

    this.logger.log(
      `Monthly reset complete: ${players.length} players processed, ${tierChanges.length} tier changes`,
    );

    return {
      totalPlayers: players.length,
      tierChanges,
      monthKey: currentMonthKey,
      previousMonthKey,
    };
  }

  private async writeTierHistory(
    player: PlayerRewards,
    monthKey: string,
  ): Promise<void> {
    await this.dynamo.put(TABLE_NAMES.TIER_HISTORY, {
      playerId: player.playerId,
      monthKey,
      tier: player.currentTier,
      monthlyPoints: player.monthlyPoints,
    });
  }
}
