import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { TierOverrideDto } from './dto/tier-override.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Tier } from '../common/constants/tiers';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
@ApiSecurity('X-Player-Id')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get('players/:playerId/rewards')
  @ApiOperation({
    summary: 'Get full player profile (admin)',
    description: 'Returns complete player data including transactions, tier history, and notifications.',
  })
  async getPlayerProfile(@Param('playerId') playerId: string) {
    const profile = await this.adminService.getPlayerProfile(playerId);
    return createSuccessResponse(profile);
  }

  @Post('points/adjust')
  @ApiOperation({
    summary: 'Adjust player points (admin)',
    description: 'Manually credit or debit points with an audit trail in the ledger.',
  })
  async adjustPoints(@Body() dto: AdjustPointsDto) {
    const result = await this.adminService.adjustPoints(
      dto.playerId,
      dto.points,
      dto.reason,
    );
    return createSuccessResponse(result);
  }

  @Post('tier/override')
  @ApiOperation({
    summary: 'Override player tier (admin)',
    description: 'Set a temporary tier override with an expiry date.',
  })
  async tierOverride(@Body() dto: TierOverrideDto) {
    const result = await this.adminService.setTierOverride(
      dto.playerId,
      dto.tier as Tier,
      dto.reason,
      dto.expiresAt,
    );
    return createSuccessResponse(result);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get enriched leaderboard (admin)',
    description: 'Returns leaderboard with email and lifetime points.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100 })
  async getEnrichedLeaderboard(@Query('limit') limitStr?: string) {
    const limit = limitStr ? parseInt(limitStr, 10) : 100;
    const entries = await this.leaderboardService.getEnrichedLeaderboard(limit);
    return createSuccessResponse({ entries });
  }
}
