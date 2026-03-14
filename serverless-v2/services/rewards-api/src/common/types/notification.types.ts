export type NotificationType = 'tier_upgrade' | 'tier_downgrade' | 'milestone';

export interface Notification {
  playerId: string;
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
