import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { NotificationStreamService } from './notification-stream.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentPlayer, AuthenticatedPlayer } from '../common/decorators/current-player.decorator';
import { createSuccessResponse } from '../common/utils/api-response';

@ApiTags('Notifications')
@Controller('api/v1/player/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiSecurity('X-Player-Id')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly streamService: NotificationStreamService,
  ) {}

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

  @Get('stream')
  @ApiOperation({
    summary: 'SSE stream for real-time notifications',
    description: 'Server-Sent Events stream. New notifications are pushed as they are created.',
  })
  streamNotifications(
    @CurrentPlayer() player: AuthenticatedPlayer,
    @Res() res: Response,
  ): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const unregister = this.streamService.register(player.playerId, (notification) => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });

    res.on('close', () => unregister());
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
