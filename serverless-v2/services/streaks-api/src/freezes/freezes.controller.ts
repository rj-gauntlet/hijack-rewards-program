import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { FreezesService } from './freezes.service';

@ApiTags('Freezes')
@Controller('api/v1/player/streaks')
export class FreezesController {
  constructor(private readonly freezesService: FreezesService) {}

  @Get('freezes')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('X-Player-Id')
  @ApiOperation({ summary: 'Get freeze balance and usage history' })
  async getFreezes(@CurrentPlayer() player: AuthenticatedPlayer) {
    const result = await this.freezesService.getFreezeStatus(player.playerId);
    if (!result) {
      return { success: true, data: null, message: 'Player not found' };
    }
    return { success: true, data: result };
  }
}
