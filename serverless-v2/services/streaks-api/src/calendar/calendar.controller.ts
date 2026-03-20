import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { CalendarService } from './calendar.service';
import { getMonthKey, getUtcToday } from '../common/utils/date-utils';

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

@ApiTags('Calendar')
@Controller('api/v1/player/streaks')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('calendar')
  @UseGuards(JwtAuthGuard)
  @ApiSecurity('X-Player-Id')
  @ApiOperation({ summary: 'Get calendar heat map data for a month' })
  @ApiQuery({ name: 'month', required: false, example: '2026-02' })
  async getCalendar(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Query('month') month?: string,
  ) {
    if (month && !MONTH_REGEX.test(month)) {
      throw new BadRequestException('Invalid month format. Use YYYY-MM (e.g., 2026-02).');
    }
    const targetMonth = month || getMonthKey(getUtcToday());
    const calendar = await this.calendarService.getCalendar(
      player.playerId,
      targetMonth,
    );
    return { success: true, data: calendar };
  }
}
