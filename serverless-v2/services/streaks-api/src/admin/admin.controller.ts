import {
  Controller, Get, Post, Body, Param, UseGuards,
  NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { GrantFreezeDto } from './dto/grant-freeze.dto';
import { StreakPlayer, DailyActivity, StreakReward, FreezeRecord } from '../common/types';

@ApiTags('Admin')
@Controller('admin/streaks')
@UseGuards(JwtAuthGuard)
@ApiSecurity('X-Player-Id')
export class AdminController {
  constructor(private readonly dynamo: DynamoService) {}

  @Post('grant-freeze')
  @ApiOperation({ summary: 'Grant additional freezes to a player (admin only)' })
  async grantFreeze(
    @CurrentPlayer() caller: AuthenticatedPlayer,
    @Body() dto: GrantFreezeDto,
  ) {
    this.requireAdmin(caller);

    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, {
      playerId: dto.playerId,
    }) as StreakPlayer | null;

    if (!player) {
      throw new NotFoundException(`Player ${dto.playerId} not found`);
    }

    const newBalance = player.freezesAvailable + dto.count;
    await this.dynamo.update(
      TABLE_NAMES.PLAYERS,
      { playerId: dto.playerId },
      {
        freezesAvailable: newBalance,
        updatedAt: new Date().toISOString(),
      },
    );

    return {
      success: true,
      data: {
        playerId: dto.playerId,
        previousBalance: player.freezesAvailable,
        granted: dto.count,
        newBalance,
        reason: dto.reason,
      },
    };
  }

  @Get('player/:playerId')
  @ApiOperation({ summary: 'View a player\'s full streak profile (admin only)' })
  async getPlayerProfile(
    @CurrentPlayer() caller: AuthenticatedPlayer,
    @Param('playerId') playerId: string,
  ) {
    this.requireAdmin(caller);

    const player = await this.dynamo.get(TABLE_NAMES.PLAYERS, {
      playerId,
    }) as StreakPlayer | null;

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    const [activities, rewards, freezeHistory] = await Promise.all([
      this.dynamo.query(
        TABLE_NAMES.ACTIVITY,
        'playerId = :pid',
        { ':pid': playerId },
        { scanIndexForward: false, limit: 60 },
      ) as Promise<unknown> as Promise<DailyActivity[]>,
      this.dynamo.query(
        TABLE_NAMES.REWARDS,
        'playerId = :pid',
        { ':pid': playerId },
        { scanIndexForward: false },
      ) as Promise<unknown> as Promise<StreakReward[]>,
      this.dynamo.query(
        TABLE_NAMES.FREEZE_HISTORY,
        'playerId = :pid',
        { ':pid': playerId },
        { scanIndexForward: false },
      ) as Promise<unknown> as Promise<FreezeRecord[]>,
    ]);

    return {
      success: true,
      data: {
        player,
        recentActivity: activities,
        rewards,
        freezeHistory,
      },
    };
  }

  private requireAdmin(caller: AuthenticatedPlayer): void {
    if (caller.role !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }
  }
}
