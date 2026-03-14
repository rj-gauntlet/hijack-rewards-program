import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { DynamoService } from '../dynamo/dynamo.service';
import { RedisService } from '../redis/redis.service';
import { Tier } from '../common/constants/tiers';

const mockDynamo = {
  scan: jest.fn(),
};

const mockRedis = {
  isEnabled: jest.fn(() => false),
  getLeaderboardCache: jest.fn(),
  setLeaderboardCache: jest.fn(),
};

const makePlayers = () => [
  { playerId: 'p1', displayName: 'Alice', email: 'alice@test.com', currentTier: Tier.GOLD, monthlyPoints: 3000, lifetimePoints: 15000 },
  { playerId: 'p2', displayName: 'Bob', email: 'bob@test.com', currentTier: Tier.PLATINUM, monthlyPoints: 12000, lifetimePoints: 50000 },
  { playerId: 'p3', displayName: 'Charlie', email: 'charlie@test.com', currentTier: Tier.SILVER, monthlyPoints: 800, lifetimePoints: 2000 },
  { playerId: 'p4', displayName: 'Diana', email: 'diana@test.com', currentTier: Tier.BRONZE, monthlyPoints: 200, lifetimePoints: 500 },
  { playerId: 'p5', displayName: 'Eve', email: 'eve@test.com', currentTier: Tier.GOLD, monthlyPoints: 5000, lifetimePoints: 20000 },
];

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.isEnabled.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: DynamoService, useValue: mockDynamo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  describe('getLeaderboard', () => {
    it('returns players sorted by monthly points descending', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(10);

      expect(result.entries[0].playerId).toBe('p2');
      expect(result.entries[0].monthlyPoints).toBe(12000);
      expect(result.entries[1].playerId).toBe('p5');
      expect(result.entries[2].playerId).toBe('p1');
    });

    it('assigns correct rank numbers', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(10);

      expect(result.entries.map((e) => e.rank)).toEqual([1, 2, 3, 4, 5]);
    });

    it('respects the limit parameter', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(3);

      expect(result.entries).toHaveLength(3);
      expect(result.totalPlayers).toBe(5);
    });

    it('includes the requesting player rank even if outside top N', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(2, 'p4');

      expect(result.entries).toHaveLength(2);
      expect(result.playerRank).not.toBeNull();
      expect(result.playerRank!.playerId).toBe('p4');
      expect(result.playerRank!.rank).toBe(5);
    });

    it('returns playerRank within top N if player is in the results', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(5, 'p2');

      expect(result.playerRank).not.toBeNull();
      expect(result.playerRank!.rank).toBe(1);
    });

    it('returns playerRank as null when no requestingPlayerId', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(5);

      expect(result.playerRank).toBeNull();
    });

    it('includes tierName for each entry', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getLeaderboard(5);

      expect(result.entries[0].tierName).toBe('Platinum');
      expect(result.entries[2].tierName).toBe('Gold');
    });

    it('handles empty player list', async () => {
      mockDynamo.scan.mockResolvedValue([]);

      const result = await service.getLeaderboard(10);

      expect(result.entries).toHaveLength(0);
      expect(result.totalPlayers).toBe(0);
      expect(result.playerRank).toBeNull();
    });

    it('returns cached leaderboard when Redis is enabled and cache hit', async () => {
      mockRedis.isEnabled.mockReturnValue(true);
      mockRedis.getLeaderboardCache.mockResolvedValue({
        entries: [
          { rank: 1, playerId: 'p2', displayName: 'Bob', currentTier: 4, tierName: 'Platinum', monthlyPoints: 12000 },
          { rank: 2, playerId: 'p5', displayName: 'Eve', currentTier: 3, tierName: 'Gold', monthlyPoints: 5000 },
          { rank: 3, playerId: 'p1', displayName: 'Alice', currentTier: 3, tierName: 'Gold', monthlyPoints: 3000 },
          { rank: 4, playerId: 'p3', displayName: 'Charlie', currentTier: 2, tierName: 'Silver', monthlyPoints: 800 },
          { rank: 5, playerId: 'p4', displayName: 'Diana', currentTier: 1, tierName: 'Bronze', monthlyPoints: 200 },
        ],
        totalPlayers: 5,
      });

      const result = await service.getLeaderboard(2, 'p4');

      expect(mockDynamo.scan).not.toHaveBeenCalled();
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].playerId).toBe('p2');
      expect(result.totalPlayers).toBe(5);
      expect(result.playerRank).not.toBeNull();
      expect(result.playerRank!.playerId).toBe('p4');
      expect(result.playerRank!.rank).toBe(5);
    });
  });

  describe('getEnrichedLeaderboard', () => {
    it('returns entries with email and lifetime points', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getEnrichedLeaderboard(5);

      expect(result[0].email).toBe('bob@test.com');
      expect(result[0].lifetimePoints).toBe(50000);
    });

    it('respects limit', async () => {
      mockDynamo.scan.mockResolvedValue(makePlayers());

      const result = await service.getEnrichedLeaderboard(2);

      expect(result).toHaveLength(2);
    });
  });
});
