import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('Points')
@Controller('api/v1')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post('points/award')
  @ApiOperation({
    summary: 'Award points for a hand',
    description:
      'Called by the game processor after a hand completes. ' +
      'Calculates points based on table stakes and player tier, ' +
      'writes to immutable ledger, updates totals, checks tier upgrade.',
  })
  async awardPoints(@Body() dto: AwardPointsDto) {
    const result = await this.pointsService.awardPoints(dto);
    return createSuccessResponse(result);
  }

  @Get('player/rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('X-Player-Id')
  @ApiOperation({
    summary: 'Get current rewards summary',
    description:
      'Returns the authenticated player\'s current tier, monthly/lifetime points, ' +
      'progress to next tier, and tier name.',
  })
  async getRewardsSummary(@CurrentPlayer() player: AuthenticatedPlayer) {
    const result = await this.pointsService.getRewardsSummary(player.playerId);
    return createSuccessResponse(result);
  }

  @Get('player/rewards/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('X-Player-Id')
  @ApiOperation({
    summary: 'Get paginated points history',
    description: 'Returns the authenticated player\'s point transactions, newest first.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async getPointsHistory(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const result = await this.pointsService.getPointsHistory(
      player.playerId,
      limit,
      offset,
    );
    return createSuccessResponse(result);
  }

  @Get('player/tier-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiSecurity('X-Player-Id')
  @ApiOperation({
    summary: 'Get tier history',
    description: 'Returns the authenticated player\'s tier history (monthly snapshots).',
  })
  async getTierHistory(@CurrentPlayer() player: AuthenticatedPlayer) {
    const result = await this.pointsService.getTierHistory(player.playerId);
    return createSuccessResponse(result);
  }
}
