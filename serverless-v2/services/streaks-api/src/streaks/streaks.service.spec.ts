import { Test } from '@nestjs/testing';
import { StreaksService } from './streaks.service';
import { DynamoService } from '../dynamo/dynamo.service';
import { StreakPlayer } from '../common/types';

// Mock date utilities to control "today"
jest.mock('../common/utils/date-utils', () => ({
  ...jest.requireActual('../common/utils/date-utils'),
  getUtcToday: jest.fn(),
}));
import { getUtcToday } from '../common/utils/date-utils';
const mockGetUtcToday = getUtcToday as jest.Mock;

function makePlayer(overrides: Partial<StreakPlayer> = {}): StreakPlayer {
  return {
    playerId: 'test-player',
    displayName: 'test-player',
    loginStreak: 0,
    playStreak: 0,
    bestLoginStreak: 0,
    bestPlayStreak: 0,
    lastLoginDate: null,
    lastPlayDate: null,
    freezesAvailable: 0,
    freezesUsedThisMonth: 0,
    lastFreezeGrantDate: '2026-02', // set to current month to prevent auto-grant in tests
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('StreaksService', () => {
  let service: StreaksService;
  let dynamo: {
    get: jest.Mock;
    put: jest.Mock;
    query: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    dynamo = {
      get: jest.fn().mockResolvedValue(null),
      put: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        StreaksService,
        { provide: DynamoService, useValue: dynamo },
      ],
    }).compile();

    service = module.get(StreaksService);
    mockGetUtcToday.mockReturnValue('2026-02-20');
  });

  describe('checkIn', () => {
    it('creates a new player on first check-in', async () => {
      dynamo.get.mockResolvedValue(null);
      const result = await service.checkIn('new-player');
      expect(result.player.loginStreak).toBe(1);
      expect(result.player.lastLoginDate).toBe('2026-02-20');
      expect(result.alreadyCheckedIn).toBe(false);
    });

    it('is idempotent on same day', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastLoginDate: '2026-02-20', loginStreak: 5 }),
      );
      const result = await service.checkIn('test-player');
      expect(result.alreadyCheckedIn).toBe(true);
      expect(result.player.loginStreak).toBe(5);
    });

    it('increments streak on consecutive day', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastLoginDate: '2026-02-19', loginStreak: 5 }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.loginStreak).toBe(6);
      expect(result.alreadyCheckedIn).toBe(false);
    });

    it('resets streak when day missed with no freezes', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastLoginDate: '2026-02-18', loginStreak: 10 }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.loginStreak).toBe(1);
    });

    it('preserves streak when 1 day missed with 1 freeze', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-18',
          loginStreak: 10,
          freezesAvailable: 1,
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.loginStreak).toBe(10); // preserved, not incremented
      expect(result.player.freezesAvailable).toBe(0);
    });

    it('preserves streak when 2 days missed with 2 freezes', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-17',
          loginStreak: 8,
          freezesAvailable: 2,
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.loginStreak).toBe(8);
      expect(result.player.freezesAvailable).toBe(0);
    });

    it('resets when 3 days missed with only 2 freezes', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-16',
          loginStreak: 8,
          freezesAvailable: 2,
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.loginStreak).toBe(1);
      expect(result.player.freezesAvailable).toBe(0);
    });

    it('updates bestLoginStreak when new streak exceeds it', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-19',
          loginStreak: 10,
          bestLoginStreak: 10,
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.bestLoginStreak).toBe(11);
    });

    it('does not decrease bestLoginStreak on reset', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-18',
          loginStreak: 5,
          bestLoginStreak: 20,
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.bestLoginStreak).toBe(20);
    });

    it('detects 3-day login milestone', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastLoginDate: '2026-02-19', loginStreak: 2 }),
      );
      const result = await service.checkIn('test-player');
      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0].milestone).toBe(3);
      expect(result.milestones[0].points).toBe(50);
    });

    it('grants monthly freeze on new month', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-19',
          loginStreak: 5,
          freezesAvailable: 0,
          lastFreezeGrantDate: '2026-01',
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.freezesAvailable).toBe(1);
    });

    it('does not grant freeze twice in same month', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-19',
          loginStreak: 5,
          freezesAvailable: 0,
          lastFreezeGrantDate: '2026-02',
        }),
      );
      const result = await service.checkIn('test-player');
      expect(result.player.freezesAvailable).toBe(0);
    });

    it('writes activity record for today', async () => {
      dynamo.get.mockResolvedValue(null);
      await service.checkIn('new-player');
      const putCalls = dynamo.put.mock.calls;
      const activityWrites = putCalls.filter(
        (c: unknown[]) => c[0] === 'streaks-activity',
      );
      expect(activityWrites.length).toBeGreaterThan(0);
      const todayActivity = activityWrites.find(
        (c: unknown[]) => (c[1] as Record<string, unknown>).date === '2026-02-20',
      );
      expect(todayActivity).toBeDefined();
    });

    it('writes freeze activity records for missed days', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-18',
          loginStreak: 10,
          freezesAvailable: 1,
        }),
      );
      await service.checkIn('test-player');
      const putCalls = dynamo.put.mock.calls;
      const freezeActivity = putCalls.find(
        (c: unknown[]) =>
          c[0] === 'streaks-activity' &&
          (c[1] as Record<string, unknown>).date === '2026-02-19' &&
          (c[1] as Record<string, unknown>).freezeUsed === true,
      );
      expect(freezeActivity).toBeDefined();
    });

    it('writes streak broken records when no freezes', async () => {
      dynamo.get.mockResolvedValueOnce(
        makePlayer({ lastLoginDate: '2026-02-18', loginStreak: 10 }),
      );
      await service.checkIn('test-player');
      const putCalls = dynamo.put.mock.calls;
      const breakActivity = putCalls.find(
        (c: unknown[]) =>
          c[0] === 'streaks-activity' &&
          (c[1] as Record<string, unknown>).date === '2026-02-19' &&
          (c[1] as Record<string, unknown>).streakBroken === true,
      );
      expect(breakActivity).toBeDefined();
    });

    it('writes freeze history record', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          lastLoginDate: '2026-02-18',
          loginStreak: 10,
          freezesAvailable: 1,
        }),
      );
      await service.checkIn('test-player');
      const putCalls = dynamo.put.mock.calls;
      const freezeHistory = putCalls.find(
        (c: unknown[]) => c[0] === 'streaks-freeze-history',
      );
      expect(freezeHistory).toBeDefined();
    });

    it('writes reward record on milestone', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastLoginDate: '2026-02-19', loginStreak: 2 }),
      );
      await service.checkIn('test-player');
      const putCalls = dynamo.put.mock.calls;
      const rewardWrite = putCalls.find(
        (c: unknown[]) => c[0] === 'streaks-rewards',
      );
      expect(rewardWrite).toBeDefined();
      expect((rewardWrite![1] as Record<string, unknown>).milestone).toBe(3);
    });
  });

  describe('recordHandCompleted', () => {
    it('starts play streak at 1 on first hand', async () => {
      dynamo.get
        .mockResolvedValueOnce(makePlayer())  // getOrCreatePlayer
        .mockResolvedValueOnce(null);          // existing activity check
      const result = await service.recordHandCompleted(
        'test-player',
        '2026-02-20T14:30:00Z',
      );
      expect(result.player.playStreak).toBe(1);
      expect(result.alreadyPlayed).toBe(false);
    });

    it('is idempotent on same day', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({ lastPlayDate: '2026-02-20', playStreak: 5 }),
      );
      const result = await service.recordHandCompleted(
        'test-player',
        '2026-02-20T14:30:00Z',
      );
      expect(result.alreadyPlayed).toBe(true);
      expect(result.player.playStreak).toBe(5);
    });

    it('increments play streak on consecutive day', async () => {
      dynamo.get
        .mockResolvedValueOnce(makePlayer({ lastPlayDate: '2026-02-19', playStreak: 5 }))
        .mockResolvedValueOnce({ date: '2026-02-20', loggedIn: true }); // existing activity
      const result = await service.recordHandCompleted(
        'test-player',
        '2026-02-20T14:30:00Z',
      );
      expect(result.player.playStreak).toBe(6);
    });

    it('resets play streak when day missed', async () => {
      dynamo.get
        .mockResolvedValueOnce(makePlayer({ lastPlayDate: '2026-02-18', playStreak: 10 }))
        .mockResolvedValueOnce(null);
      const result = await service.recordHandCompleted(
        'test-player',
        '2026-02-20T14:30:00Z',
      );
      expect(result.player.playStreak).toBe(1);
    });

    it('updates existing activity record with played=true', async () => {
      dynamo.get
        .mockResolvedValueOnce(makePlayer({ lastPlayDate: '2026-02-19', playStreak: 3 }))
        .mockResolvedValueOnce({ playerId: 'test-player', date: '2026-02-20', loggedIn: true });
      await service.recordHandCompleted('test-player', '2026-02-20T14:30:00Z');
      expect(dynamo.update).toHaveBeenCalledWith(
        'streaks-activity',
        { playerId: 'test-player', date: '2026-02-20' },
        { played: true, playStreakAtDay: 4 },
      );
    });

    it('detects play milestones', async () => {
      dynamo.get
        .mockResolvedValueOnce(makePlayer({ lastPlayDate: '2026-02-19', playStreak: 2 }))
        .mockResolvedValueOnce(null);
      const result = await service.recordHandCompleted(
        'test-player',
        '2026-02-20T14:30:00Z',
      );
      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0].milestone).toBe(3);
      expect(result.milestones[0].points).toBe(100); // play reward
    });
  });

  describe('getStreakState', () => {
    it('returns null for non-existent player', async () => {
      dynamo.get.mockResolvedValue(null);
      const result = await service.getStreakState('nobody');
      expect(result).toBeNull();
    });

    it('returns current state with next milestones', async () => {
      dynamo.get.mockResolvedValue(
        makePlayer({
          loginStreak: 5,
          playStreak: 2,
          bestLoginStreak: 10,
          bestPlayStreak: 8,
          freezesAvailable: 1,
          lastLoginDate: '2026-02-20',
          lastPlayDate: '2026-02-19',
        }),
      );
      const result = await service.getStreakState('test-player');
      expect(result).not.toBeNull();
      expect(result!.loginStreak).toBe(5);
      expect(result!.playStreak).toBe(2);
      expect(result!.nextLoginMilestone).toEqual({
        days: 7,
        reward: 150,
        daysRemaining: 2,
      });
      expect(result!.nextPlayMilestone).toEqual({
        days: 3,
        reward: 100,
        daysRemaining: 1,
      });
    });
  });
});
