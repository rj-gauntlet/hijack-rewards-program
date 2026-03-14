import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Tier } from '../common/constants/tiers';

const mockDynamo = {
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
  query: jest.fn(),
};

const mockNotifications = {
  createNotification: jest.fn(),
  getNotifications: jest.fn().mockResolvedValue({ notifications: [], unreadCount: 0 }),
};

const makePlayer = (overrides: Record<string, unknown> = {}) => ({
  playerId: 'player-001',
  displayName: 'TestPlayer',
  email: 'test@example.com',
  currentTier: Tier.SILVER,
  monthlyPoints: 800,
  lifetimePoints: 5000,
  currentMonthKey: '2026-03',
  tierOverride: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...overrides,
});

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: DynamoService, useValue: mockDynamo },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('getPlayerProfile', () => {
    it('returns full profile with transactions, tier history, and notifications', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.query.mockResolvedValue([]);

      const profile = await service.getPlayerProfile('player-001');

      expect(profile.player.playerId).toBe('player-001');
      expect(profile.recentTransactions).toEqual([]);
      expect(profile.tierHistory).toEqual([]);
      expect(profile.notifications).toEqual([]);
    });

    it('throws NotFoundException for unknown player', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(service.getPlayerProfile('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adjustPoints', () => {
    it('creates a ledger entry with type admin_adjust', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.adjustPoints('player-001', 200, 'Bonus');

      expect(result.ledgerEntry.type).toBe('admin_adjust');
      expect(result.ledgerEntry.reason).toBe('Bonus');
      expect(result.ledgerEntry.earnedPoints).toBe(200);
      expect(result.newMonthlyTotal).toBe(1000);
      expect(result.newLifetimeTotal).toBe(5200);
    });

    it('handles negative adjustments (point debit)', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.adjustPoints('player-001', -300, 'Correction');

      expect(result.ledgerEntry.earnedPoints).toBe(-300);
      expect(result.newMonthlyTotal).toBe(500);
      expect(result.newLifetimeTotal).toBe(4700);
    });

    it('floors totals at zero for large debits', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer({ monthlyPoints: 100, lifetimePoints: 100 }));
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.adjustPoints('player-001', -999, 'Reset');

      expect(result.newMonthlyTotal).toBe(0);
      expect(result.newLifetimeTotal).toBe(0);
    });

    it('throws NotFoundException for unknown player', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(
        service.adjustPoints('unknown', 100, 'test'),
      ).rejects.toThrow(NotFoundException);
    });

    it('writes ledger entry to TRANSACTIONS table', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.adjustPoints('player-001', 50, 'Small bonus');

      expect(mockDynamo.put).toHaveBeenCalledWith(
        TABLE_NAMES.TRANSACTIONS,
        expect.objectContaining({
          playerId: 'player-001',
          type: 'admin_adjust',
          earnedPoints: 50,
        }),
      );
    });

    it('updates player totals in PLAYERS table', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.adjustPoints('player-001', 200, 'Bonus');

      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.PLAYERS,
        { playerId: 'player-001' },
        expect.objectContaining({ monthlyPoints: 1000, lifetimePoints: 5200 }),
      );
    });
  });

  describe('setTierOverride', () => {
    it('sets tier override and updates player', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.setTierOverride(
        'player-001',
        Tier.PLATINUM,
        'VIP promo',
        '2026-04-14T00:00:00Z',
      );

      expect(result.previousTier).toBe(Tier.SILVER);
      expect(result.overrideTier).toBe(Tier.PLATINUM);
    });

    it('stores override object with reason and expiry', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.update.mockResolvedValue(undefined);

      await service.setTierOverride(
        'player-001',
        Tier.GOLD,
        'Tournament winner',
        '2026-05-01T00:00:00Z',
      );

      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.PLAYERS,
        { playerId: 'player-001' },
        expect.objectContaining({
          currentTier: Tier.GOLD,
          tierOverride: expect.objectContaining({
            tier: Tier.GOLD,
            reason: 'Tournament winner',
            expiresAt: '2026-05-01T00:00:00Z',
          }),
        }),
      );
    });

    it('creates a notification for the player', async () => {
      mockDynamo.get.mockResolvedValue(makePlayer());
      mockDynamo.update.mockResolvedValue(undefined);

      await service.setTierOverride(
        'player-001',
        Tier.PLATINUM,
        'Promo',
        '2026-04-14T00:00:00Z',
      );

      expect(mockNotifications.createNotification).toHaveBeenCalledWith(
        'player-001',
        'tier_upgrade',
        expect.stringContaining('Platinum'),
        expect.stringContaining('admin'),
      );
    });

    it('throws NotFoundException for unknown player', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(
        service.setTierOverride('unknown', Tier.GOLD, 'test', '2026-04-01T00:00:00Z'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
