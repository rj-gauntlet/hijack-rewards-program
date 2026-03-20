import { Injectable } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { FreezeRecord, FreezeStatus } from '../common/types';
import { StreakPlayer } from '../common/types';

@Injectable()
export class FreezesService {
  constructor(private readonly dynamo: DynamoService) {}

  async getFreezeStatus(playerId: string): Promise<{
    status: FreezeStatus;
    history: FreezeRecord[];
  } | null> {
    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, { playerId }) as StreakPlayer | null;
    if (!player) return null;

    const items = await this.dynamo.query(
      TABLE_NAMES.FREEZE_HISTORY,
      'playerId = :pid',
      { ':pid': playerId },
      { scanIndexForward: false },
    );

    return {
      status: {
        freezesAvailable: player.freezesAvailable,
        freezesUsedThisMonth: player.freezesUsedThisMonth,
        lastGrantDate: player.lastFreezeGrantDate,
      },
      history: items as unknown as FreezeRecord[],
    };
  }
}
