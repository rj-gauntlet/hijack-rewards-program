import { Controller, Get, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { StreaksService } from './streaks.service';
import { HandCompletedDto } from './dto/hand-completed.dto';

@ApiTags('Streaks')
@Controller()
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Post('api/v1/player/streaks/check-in')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('X-Player-Id')
  @ApiOperation({ summary: 'Record daily login check-in (idempotent)' })
  async checkIn(@CurrentPlayer() player: AuthenticatedPlayer) {
    const result = await this.streaksService.checkIn(player.playerId);
    return {
      success: true,
      data: {
        loginStreak: result.player.loginStreak,
        playStreak: result.player.playStreak,
        bestLoginStreak: result.player.bestLoginStreak,
        bestPlayStreak: result.player.bestPlayStreak,
        freezesAvailable: result.player.freezesAvailable,
        lastLoginDate: result.player.lastLoginDate,
        alreadyCheckedIn: result.alreadyCheckedIn,
        milestonesEarned: result.milestones,
      },
    };
  }

  @Get('api/v1/player/streaks')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('X-Player-Id')
  @ApiOperation({ summary: 'Get current streak state with next milestones' })
  async getStreaks(@CurrentPlayer() player: AuthenticatedPlayer) {
    const state = await this.streaksService.getStreakState(player.playerId);
    if (!state) {
      throw new NotFoundException(`Player ${player.playerId} not found`);
    }
    return { success: true, data: state };
  }

  @Post('internal/streaks/hand-completed')
  @ApiTags('Internal')
  @ApiOperation({ summary: 'Record hand completion (internal, idempotent)' })
  async handCompleted(@Body() dto: HandCompletedDto) {
    const result = await this.streaksService.recordHandCompleted(
      dto.playerId,
      dto.completedAt,
    );
    return {
      success: true,
      data: {
        playStreak: result.player.playStreak,
        bestPlayStreak: result.player.bestPlayStreak,
        lastPlayDate: result.player.lastPlayDate,
        alreadyPlayed: result.alreadyPlayed,
        milestonesEarned: result.milestones,
      },
    };
  }
}
