import { Injectable } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { StreakReward } from '../common/types';

@Injectable()
export class RewardsService {
  constructor(private readonly dynamo: DynamoService) {}

  async getRewards(playerId: string): Promise<StreakReward[]> {
    const items = await this.dynamo.query(
      TABLE_NAMES.REWARDS,
      'playerId = :pid',
      { ':pid': playerId },
      { scanIndexForward: false },
    );
    return items as unknown as StreakReward[];
  }
}
