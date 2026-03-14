import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const LEADERBOARD_CACHE_KEY = 'rewards:leaderboard';
const LEADERBOARD_CACHE_TTL_SEC = 30;

export interface LeaderboardCachePayload {
  entries: Array<{
    rank: number;
    playerId: string;
    displayName: string;
    currentTier: number;
    tierName: string;
    monthlyPoints: number;
  }>;
  totalPlayers: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private enabled = false;

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    if (!host) {
      this.logger.warn('REDIS_HOST not set; leaderboard cache disabled.');
      return;
    }
    try {
      this.client = new Redis({ host, port, maxRetriesPerRequest: 2 });
      this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
      await this.client.ping();
      this.enabled = true;
      this.logger.log(`Redis connected at ${host}:${port}`);
    } catch (err) {
      this.logger.warn(`Redis connection failed: ${err instanceof Error ? err.message : String(err)}. Leaderboard cache disabled.`);
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  async getLeaderboardCache(): Promise<LeaderboardCachePayload | null> {
    if (!this.client || !this.enabled) return null;
    try {
      const raw = await this.client.get(LEADERBOARD_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LeaderboardCachePayload;
      return parsed.entries && Array.isArray(parsed.entries) ? parsed : null;
    } catch {
      return null;
    }
  }

  async setLeaderboardCache(payload: LeaderboardCachePayload): Promise<void> {
    if (!this.client || !this.enabled) return;
    try {
      await this.client.set(
        LEADERBOARD_CACHE_KEY,
        JSON.stringify(payload),
        'EX',
        LEADERBOARD_CACHE_TTL_SEC,
      );
    } catch (err) {
      this.logger.warn(`Redis set failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
