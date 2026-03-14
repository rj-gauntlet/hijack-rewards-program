import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PointsService } from './points.service';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { Tier } from '../common/constants/tiers';
import type { AwardPointsInput } from '../common/types';

const mockDynamo = {
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
  query: jest.fn(),
};

describe('PointsService', () => {
  let service: PointsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: DynamoService, useValue: mockDynamo },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
  });

  const makeInput = (overrides: Partial<AwardPointsInput> = {}): AwardPointsInput => ({
    playerId: 'player-001',
    tableId: 'table-001',
    tableStakes: '$1.00-$2.00',
    bigBlind: 1.0,
    handId: 'hand-001',
    ...overrides,
  });

  const makeBronzePlayer = (overrides: Record<string, unknown> = {}) => ({
    playerId: 'player-001',
    currentTier: Tier.BRONZE,
    monthlyPoints: 0,
    lifetimePoints: 0,
    currentMonthKey: '2026-03',
    displayName: 'player-001',
    email: 'player-001@example.com',
    tierOverride: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  });

  describe('awardPoints', () => {
    it('creates a new player if not found and awards points', async () => {
      mockDynamo.get.mockResolvedValue(null);
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput());

      expect(result.basePoints).toBe(2);
      expect(result.multiplier).toBe(1.0);
      expect(result.earnedPoints).toBe(2);
      expect(result.newMonthlyTotal).toBe(2);
      expect(result.currentTier).toBe(Tier.BRONZE);
      expect(result.tierUpgrade).toBeNull();
      expect(result.milestonesReached).toEqual([]);

      expect(mockDynamo.put).toHaveBeenCalledTimes(2);
    });

    it('awards points to an existing player', async () => {
      mockDynamo.get.mockResolvedValue(makeBronzePlayer({ monthlyPoints: 100, lifetimePoints: 500 }));
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput());

      expect(result.earnedPoints).toBe(2);
      expect(result.newMonthlyTotal).toBe(102);
      expect(result.currentTier).toBe(Tier.BRONZE);
    });

    it('writes an immutable ledger entry to the transactions table', async () => {
      mockDynamo.get.mockResolvedValue(makeBronzePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.awardPoints(makeInput());

      const ledgerCall = mockDynamo.put.mock.calls.find(
        (call: unknown[]) => call[0] === TABLE_NAMES.TRANSACTIONS,
      );
      expect(ledgerCall).toBeDefined();
      const entry = ledgerCall![1];
      expect(entry.playerId).toBe('player-001');
      expect(entry.handId).toBe('hand-001');
      expect(entry.tableId).toBe('table-001');
      expect(entry.basePoints).toBe(2);
      expect(entry.earnedPoints).toBe(2);
      expect(entry.type).toBe('hand');
      expect(entry.monthKey).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.transactionId).toBeDefined();
    });

    it('updates the player totals in the players table', async () => {
      mockDynamo.get.mockResolvedValue(makeBronzePlayer({ monthlyPoints: 50, lifetimePoints: 200 }));
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      await service.awardPoints(makeInput());

      expect(mockDynamo.update).toHaveBeenCalledWith(
        TABLE_NAMES.PLAYERS,
        { playerId: 'player-001' },
        expect.objectContaining({
          monthlyPoints: 52,
          lifetimePoints: 202,
          currentTier: Tier.BRONZE,
        }),
      );
    });

    it('triggers tier upgrade when threshold is crossed', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({ monthlyPoints: 499, lifetimePoints: 499 }),
      );
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput({ bigBlind: 1.0 }));

      expect(result.newMonthlyTotal).toBe(501);
      expect(result.currentTier).toBe(Tier.SILVER);
      expect(result.tierUpgrade).toEqual({
        previousTier: Tier.BRONZE,
        newTier: Tier.SILVER,
      });
    });

    it('applies tier multiplier for Silver players', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({ currentTier: Tier.SILVER, monthlyPoints: 600 }),
      );
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput({ bigBlind: 2.0 }));

      expect(result.basePoints).toBe(5);
      expect(result.multiplier).toBe(1.25);
      expect(result.earnedPoints).toBe(6);
    });

    it('detects milestone crossings', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({ monthlyPoints: 498, lifetimePoints: 498 }),
      );
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput({ bigBlind: 1.0 }));

      expect(result.newMonthlyTotal).toBe(500);
      expect(result.milestonesReached).toEqual([500]);
    });

    it('detects multiple milestones when jumping across several thresholds', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({
          currentTier: Tier.PLATINUM,
          monthlyPoints: 490,
          lifetimePoints: 490,
        }),
      );
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const result = await service.awardPoints(makeInput({ bigBlind: 10.0 }));

      expect(result.basePoints).toBe(10);
      expect(result.multiplier).toBe(2.0);
      expect(result.earnedPoints).toBe(20);
      expect(result.newMonthlyTotal).toBe(510);
      expect(result.milestonesReached).toEqual([500]);
    });

    it('handles different stakes brackets correctly', async () => {
      mockDynamo.get.mockResolvedValue(makeBronzePlayer());
      mockDynamo.put.mockResolvedValue(undefined);
      mockDynamo.update.mockResolvedValue(undefined);

      const r1 = await service.awardPoints(makeInput({ bigBlind: 0.10 }));
      expect(r1.basePoints).toBe(1);

      const r2 = await service.awardPoints(makeInput({ bigBlind: 5.00 }));
      expect(r2.basePoints).toBe(5);

      const r3 = await service.awardPoints(makeInput({ bigBlind: 25.00 }));
      expect(r3.basePoints).toBe(10);
    });
  });

  describe('getRewardsSummary', () => {
    it('returns full rewards summary for an existing player', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({ monthlyPoints: 300, lifetimePoints: 1500 }),
      );

      const result = await service.getRewardsSummary('player-001');

      expect(result.playerId).toBe('player-001');
      expect(result.currentTier).toBe(Tier.BRONZE);
      expect(result.tierName).toBe('Bronze');
      expect(result.monthlyPoints).toBe(300);
      expect(result.lifetimePoints).toBe(1500);
      expect(result.pointsToNextTier).toBe(200);
      expect(result.nextTierName).toBe('Silver');
      expect(result.progressPercent).toBe(60);
    });

    it('returns null pointsToNextTier for Platinum players', async () => {
      mockDynamo.get.mockResolvedValue(
        makeBronzePlayer({ currentTier: Tier.PLATINUM, monthlyPoints: 15000 }),
      );

      const result = await service.getRewardsSummary('player-001');

      expect(result.currentTier).toBe(Tier.PLATINUM);
      expect(result.tierName).toBe('Platinum');
      expect(result.pointsToNextTier).toBeNull();
      expect(result.nextTierName).toBeNull();
      expect(result.progressPercent).toBe(100);
    });

    it('throws NotFoundException for unknown player', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(
        service.getRewardsSummary('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPointsHistory', () => {
    it('returns paginated transaction history', async () => {
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        playerId: 'player-001',
        timestamp: Date.now() - i * 1000,
        earnedPoints: 2,
        type: 'hand',
      }));

      mockDynamo.get.mockResolvedValue(makeBronzePlayer());
      mockDynamo.query.mockResolvedValue(transactions);

      const result = await service.getPointsHistory('player-001', 20, 0);

      expect(result.total).toBe(50);
      expect(result.items).toHaveLength(20);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('handles offset pagination correctly', async () => {
      const transactions = Array.from({ length: 50 }, (_, i) => ({
        playerId: 'player-001',
        timestamp: Date.now() - i * 1000,
        earnedPoints: 2,
        type: 'hand',
        index: i,
      }));

      mockDynamo.get.mockResolvedValue(makeBronzePlayer());
      mockDynamo.query.mockResolvedValue(transactions);

      const result = await service.getPointsHistory('player-001', 10, 20);

      expect(result.items).toHaveLength(10);
      expect(result.offset).toBe(20);
      expect((result.items[0] as Record<string, unknown>).index).toBe(20);
    });

    it('returns empty items when offset exceeds total', async () => {
      mockDynamo.get.mockResolvedValue(makeBronzePlayer());
      mockDynamo.query.mockResolvedValue([
        { playerId: 'player-001', timestamp: 1, earnedPoints: 2 },
      ]);

      const result = await service.getPointsHistory('player-001', 20, 100);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(1);
    });

    it('throws NotFoundException for unknown player', async () => {
      mockDynamo.get.mockResolvedValue(null);

      await expect(
        service.getPointsHistory('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
