import { Injectable, Logger } from '@nestjs/common';
import type { Notification } from '../common/types';

export type SendNotification = (notification: Notification) => void;

@Injectable()
export class NotificationStreamService {
  private readonly logger = new Logger(NotificationStreamService.name);
  private readonly listeners = new Map<string, Set<SendNotification>>();

  register(playerId: string, send: SendNotification): () => void {
    if (!this.listeners.has(playerId)) {
      this.listeners.set(playerId, new Set());
    }
    this.listeners.get(playerId)!.add(send);

    return () => {
      this.listeners.get(playerId)?.delete(send);
      if (this.listeners.get(playerId)?.size === 0) {
        this.listeners.delete(playerId);
      }
    };
  }

  push(playerId: string, notification: Notification): void {
    const sends = this.listeners.get(playerId);
    if (!sends || sends.size === 0) return;

    this.logger.debug(`Pushing notification to ${sends.size} stream(s) for ${playerId}`);
    sends.forEach((send) => {
      try {
        send(notification);
      } catch (err) {
        this.logger.warn(`Stream send error for ${playerId}: ${err}`);
      }
    });
  }
}
