import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';

const mockDynamo = {
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
  query: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: DynamoService, useValue: mockDynamo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createNotification', () => {
    it('creates a notification and writes to DynamoDB', async () => {
      mockDynamo.put.mockResolvedValue(undefined);

      const result = await service.createNotification(
        'player-001',
        'tier_upgrade',
        'Reached Silver!',
        'Congratulations!',
      );

      expect(result.playerId).toBe('player-001');
      expect(result.type).toBe('tier_upgrade');
      expect(result.title).toBe('Reached Silver!');
      expect(result.message).toBe('Congratulations!');
      expect(result.isRead).toBe(false);
      expect(result.notificationId).toBeDefined();
      expect(result.createdAt).toBeDefined();

      expect(mockDynamo.put).toHaveBeenCalledWith(
        TABLE_NAMES.NOTIFICATIONS,
        expect.objectContaining({ playerId: 'player-001', type: 'tier_upgrade' }),
      );
    });
  });

  describe('getNotifications', () => {
    const makeNotifications = () => [
      { playerId: 'p1', notificationId: 'n1', type: 'tier_upgrade', isRead: false, createdAt: '2026-03-14T10:00:00Z' },
      { playerId: 'p1', notificationId: 'n2', type: 'milestone', isRead: true, createdAt: '2026-03-13T10:00:00Z' },
      { playerId: 'p1', notificationId: 'n3', type: 'tier_downgrade', isRead: false, createdAt: '2026-03-12T10:00:00Z' },
    ];

    it('returns all notifications with unread count', async () => {
      mockDynamo.query.mockResolvedValue(makeNotifications());

      const result = await service.getNotifications('p1');

      expect(result.notifications).toHaveLength(3);
      expect(result.unreadCount).toBe(2);
    });

    it('returns only unread notifications when filtered', async () => {
      mockDynamo.query.mockResolvedValue(makeNotifications());

      const result = await service.getNotifications('p1', true);

      expect(result.notifications).toHaveLength(2);
      expect(result.notifications.every((n) => !n.isRead)).toBe(true);
      expect(result.unreadCount).toBe(2);
    });

    it('returns empty list for player with no notifications', async () => {
      mockDynamo.query.mockResolvedValue([]);

      const result = await service.getNotifications('p1');

      expect(result.notifications).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('dismissNotification', () => {
    it('marks a notification as read', async () => {
      mockDynamo.get.mockResolvedValue({
        playerId: 'p1',
        notificationId: 'n1',
        isRead: false,
      });
      mockDynamo.update.mockResolvedValue(undefined);

      await service.dismissNotification('p1', 'n1');

      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.NOTIFICATIONS,
        { playerId: 'p1', notificationId: 'n1' },
        { isRead: true },
      );
    });

    it('throws NotFoundException for non-existent notification', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(
        service.dismissNotification('p1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
