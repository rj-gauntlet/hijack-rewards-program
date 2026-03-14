import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import type { Notification, NotificationType } from '../common/types';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly dynamo: DynamoService) {}

  async createNotification(
    playerId: string,
    type: NotificationType,
    title: string,
    message: string,
  ): Promise<Notification> {
    const notification: Notification = {
      playerId,
      notificationId: randomUUID(),
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await this.dynamo.put(TABLE_NAMES.NOTIFICATIONS, notification as unknown as Record<string, unknown>);

    this.logger.log(`Notification created for ${playerId}: [${type}] ${title}`);
    return notification;
  }

  async getNotifications(
    playerId: string,
    unreadOnly: boolean = false,
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const items = await this.dynamo.query(
      TABLE_NAMES.NOTIFICATIONS,
      'playerId = :pid',
      { ':pid': playerId },
      { scanIndexForward: false },
    );

    const notifications = items as unknown as Notification[];
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (unreadOnly) {
      return {
        notifications: notifications.filter((n) => !n.isRead),
        unreadCount,
      };
    }

    return { notifications, unreadCount };
  }

  async dismissNotification(
    playerId: string,
    notificationId: string,
  ): Promise<void> {
    const existing = await this.dynamo.get(TABLE_NAMES.NOTIFICATIONS, {
      playerId,
      notificationId,
    });

    if (!existing) {
      throw new NotFoundException(
        `Notification ${notificationId} not found for player ${playerId}`,
      );
    }

    await this.dynamo.update(
      TABLE_NAMES.NOTIFICATIONS,
      { playerId, notificationId },
      { isRead: true },
    );

    this.logger.log(`Notification ${notificationId} dismissed for ${playerId}`);
  }
}
