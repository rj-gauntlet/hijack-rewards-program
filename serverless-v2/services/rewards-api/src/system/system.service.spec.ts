import { Test, TestingModule } from '@nestjs/testing';
import { SystemService } from './system.service';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Tier } from '../common/constants/tiers';

const mockDynamo = {
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
  scan: jest.fn(),
};

const mockNotifications = {
  createNotification: jest.fn(),
};

describe('SystemService', () => {
  let service: SystemService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,
        { provide: DynamoService, useValue: mockDynamo },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<SystemService>(SystemService);
  });

  const makePlayer = (overrides: Record<string, unknown> = {}) => ({
    playerId: 'player-001',
    currentTier: Tier.BRONZE,
    monthlyPoints: 100,
    lifetimePoints: 500,
    currentMonthKey: '2026-02',
    displayName: 'TestPlayer',
    email: 'test@example.com',
    tierOverride: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-28T00:00:00Z',
    ...overrides,
  });

  describe('processMonthlyReset', () => {
    it('resets monthly points to 0 for all players', async () => {
      mockDynamo.scan.mockResolvedValue([makePlayer()]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.processMonthlyReset();

      expect(result.totalPlayers).toBe(1);
      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.PLAYERS,
        { playerId: 'player-001' },
        expect.objectContaining({ monthlyPoints: 0 }),
      );
    });

    it('writes tier history snapshot before reset', async () => {
      mockDynamo.scan.mockResolvedValue([makePlayer({ monthlyPoints: 300 })]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.processMonthlyReset();

      expect(mockDynamo.put).toHaveBeenCalledWith(
        TABLE_NAMES.TIER_HISTORY,
        expect.objectContaining({
          playerId: 'player-001',
          tier: Tier.BRONZE,
          monthlyPoints: 300,
        }),
      );
    });

    it('drops tier by one with floor protection for underperforming players', async () => {
      mockDynamo.scan.mockResolvedValue([
        makePlayer({
          playerId: 'gold-player',
          currentTier: Tier.GOLD,
          monthlyPoints: 500,
        }),
      ]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.processMonthlyReset();

      expect(result.tierChanges).toHaveLength(1);
      expect(result.tierChanges[0]).toEqual({
        playerId: 'gold-player',
        previousTier: Tier.GOLD,
        newTier: Tier.SILVER,
      });

      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.PLAYERS,
        { playerId: 'gold-player' },
        expect.objectContaining({ currentTier: Tier.SILVER }),
      );
    });

    it('creates downgrade notification for tier-dropped players', async () => {
      mockDynamo.scan.mockResolvedValue([
        makePlayer({
          playerId: 'silver-player',
          currentTier: Tier.SILVER,
          monthlyPoints: 100,
        }),
      ]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.processMonthlyReset();

      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        'silver-player',
        'tier_downgrade',
        expect.stringContaining('Bronze'),
        expect.any(String),
      );
    });

    it('does not downgrade Bronze players', async () => {
      mockDynamo.scan.mockResolvedValue([
        makePlayer({ currentTier: Tier.BRONZE, monthlyPoints: 0 }),
      ]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.processMonthlyReset();

      expect(result.tierChanges).toHaveLength(0);
      expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    });

    it('does not downgrade players who met their tier threshold', async () => {
      mockDynamo.scan.mockResolvedValue([
        makePlayer({
          currentTier: Tier.GOLD,
          monthlyPoints: 2000,
        }),
      ]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.processMonthlyReset();

      expect(result.tierChanges).toHaveLength(0);
      expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    });

    it('handles multiple players with mixed tier scenarios', async () => {
      mockDynamo.scan.mockResolvedValue([
        makePlayer({ playerId: 'p1', currentTier: Tier.PLATINUM, monthlyPoints: 5000 }),
        makePlayer({ playerId: 'p2', currentTier: Tier.GOLD, monthlyPoints: 3000 }),
        makePlayer({ playerId: 'p3', currentTier: Tier.SILVER, monthlyPoints: 100 }),
        makePlayer({ playerId: 'p4', currentTier: Tier.BRONZE, monthlyPoints: 0 }),
      ]);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.processMonthlyReset();

      expect(result.totalPlayers).toBe(4);
      expect(result.tierChanges).toHaveLength(2);
      expect(result.tierChanges.map((tc) => tc.playerId)).toEqual(['p1', 'p3']);
    });

    it('returns empty results for no players', async () => {
      mockDynamo.scan.mockResolvedValue([]);

      const result = await service.processMonthlyReset();

      expect(result.totalPlayers).toBe(0);
      expect(result.tierChanges).toHaveLength(0);
    });
  });
});
