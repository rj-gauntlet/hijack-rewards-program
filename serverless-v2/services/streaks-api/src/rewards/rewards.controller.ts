import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { RewardsService } from './rewards.service';

@ApiTags('Rewards')
@Controller('api/v1/player/streaks')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('X-Player-Id')
  @ApiOperation({ summary: 'Get streak milestone rewards history' })
  async getRewards(@CurrentPlayer() player: AuthenticatedPlayer) {
    const rewards = await this.rewardsService.getRewards(player.playerId);
    return { success: true, data: { rewards } };
  }
}
