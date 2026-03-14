import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('Notifications')
@Controller('api/v1/player/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiSecurity('X-Player-Id')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get player notifications',
    description: 'Returns notifications for the authenticated player, with optional unread-only filter.',
  })
  @ApiQuery({ name: 'unread', required: false, type: Boolean, example: false })
  async getNotifications(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Query('unread') unread?: string,
  ) {
    const unreadOnly = unread === 'true';
    const result = await this.notificationsService.getNotifications(
      player.playerId,
      unreadOnly,
    );
    return createSuccessResponse(result);
  }

  @Patch(':id/dismiss')
  @ApiOperation({
    summary: 'Dismiss a notification',
    description: 'Marks a notification as read.',
  })
  async dismissNotification(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.dismissNotification(
      player.playerId,
      notificationId,
    );
    return createSuccessResponse({ success: true });
  }
}
