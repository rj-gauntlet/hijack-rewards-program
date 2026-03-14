import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('Leaderboard')
@Controller('api/v1/leaderboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiSecurity('X-Player-Id')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get leaderboard',
    description:
      'Returns the top N players sorted by monthly points, plus the requesting player\'s own rank.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getLeaderboard(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const result = await this.leaderboardService.getLeaderboard(
      limit,
      player.playerId,
    );
    return createSuccessResponse(result);
  }
}
