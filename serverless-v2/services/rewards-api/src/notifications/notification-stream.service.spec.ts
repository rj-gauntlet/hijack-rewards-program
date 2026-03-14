import { NotificationStreamService } from './notification-stream.service';

describe('NotificationStreamService', () => {
  let service: NotificationStreamService;

  beforeEach(() => {
    service = new NotificationStreamService();
  });

  describe('register and push', () => {
    it('calls registered listener when push is called for that player', () => {
      const listener = jest.fn();
      service.register('player-001', listener);

      const notification = {
        playerId: 'player-001',
        notificationId: 'n1',
        type: 'tier_upgrade' as const,
        title: 'Silver!',
        message: 'You reached Silver.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      service.push('player-001', notification);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(notification);
    });

    it('does not call listener when push is for a different player', () => {
      const listener = jest.fn();
      service.register('player-001', listener);

      service.push('player-002', {
        playerId: 'player-002',
        notificationId: 'n2',
        type: 'milestone',
        title: '100 pts',
        message: 'Hit 100.',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('calls all listeners for the same player when push is called', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      service.register('player-001', listener1);
      service.register('player-001', listener2);

      const notification = {
        playerId: 'player-001',
        notificationId: 'n1',
        type: 'tier_upgrade' as const,
        title: 'Silver!',
        message: 'You reached Silver.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      service.push('player-001', notification);

      expect(listener1).toHaveBeenCalledWith(notification);
      expect(listener2).toHaveBeenCalledWith(notification);
    });

    it('unregister stops delivery to that listener', () => {
      const listener = jest.fn();
      const unregister = service.register('player-001', listener);

      const notification = {
        playerId: 'player-001',
        notificationId: 'n1',
        type: 'tier_upgrade' as const,
        title: 'Silver!',
        message: 'You reached Silver.',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      unregister();
      service.push('player-001', notification);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
