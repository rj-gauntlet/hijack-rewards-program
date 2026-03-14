import { Injectable } from '@nestjs/common';
import { DynamoService, TABLE_NAMES } from '../dynamo/dynamo.service';
import { TIER_NAMES, Tier } from '../common/constants/tiers';
import type { PlayerRewards } from '../common/types';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  currentTier: Tier;
  tierName: string;
  monthlyPoints: number;
}

export interface EnrichedLeaderboardEntry extends LeaderboardEntry {
  email: string;
  lifetimePoints: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  playerRank: LeaderboardEntry | null;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly dynamo: DynamoService) {}

  async getLeaderboard(
    limit: number = 10,
    requestingPlayerId?: string,
  ): Promise<LeaderboardResult> {
    const allPlayers = await this.dynamo.scan(TABLE_NAMES.PLAYERS);
    const players = allPlayers as unknown as PlayerRewards[];

    const sorted = players.sort((a, b) => b.monthlyPoints - a.monthlyPoints);

    const ranked = sorted.map((p, index) => ({
      rank: index + 1,
      playerId: p.playerId,
      displayName: p.displayName,
      currentTier: p.currentTier,
      tierName: TIER_NAMES[p.currentTier] || 'Unknown',
      monthlyPoints: p.monthlyPoints,
    }));

    const topN = ranked.slice(0, limit);

    let playerRank: LeaderboardEntry | null = null;
    if (requestingPlayerId) {
      const playerEntry = ranked.find((e) => e.playerId === requestingPlayerId);
      if (playerEntry) {
        playerRank = playerEntry;
      }
    }

    return {
      entries: topN,
      totalPlayers: players.length,
      playerRank,
    };
  }

  async getEnrichedLeaderboard(limit: number = 100): Promise<EnrichedLeaderboardEntry[]> {
    const allPlayers = await this.dynamo.scan(TABLE_NAMES.PLAYERS);
    const players = allPlayers as unknown as PlayerRewards[];

    return players
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .slice(0, limit)
      .map((p, index) => ({
        rank: index + 1,
        playerId: p.playerId,
        displayName: p.displayName,
        email: p.email,
        currentTier: p.currentTier,
        tierName: TIER_NAMES[p.currentTier] || 'Unknown',
        monthlyPoints: p.monthlyPoints,
        lifetimePoints: p.lifetimePoints,
      }));
  }
}
