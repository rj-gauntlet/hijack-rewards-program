# ADR-003: Scan-on-Read Leaderboard

## Status
Accepted

## Context
The leaderboard needs to return the top N players sorted by monthly points. DynamoDB doesn't support cross-partition sorting. Options:
1. **Scan-on-read** — Scan the entire players table, sort in application code.
2. **Materialized view** — Maintain a sorted leaderboard table updated on every point award.
3. **GSI** — Create a Global Secondary Index on monthly points.
4. **Redis cache** — Cache sorted leaderboard with a TTL.

## Decision
Use scan-on-read: scan `rewards-players`, sort by `monthlyPoints` descending in the application layer, return the top N.

## Rationale
- **Simplest implementation** — No additional infrastructure, no consistency lag, no cache invalidation.
- **Acceptable performance at demo scale** — 175 players is well within DynamoDB's 1MB scan limit. A full scan returns in <50ms locally.
- **Always fresh** — No eventual consistency delay. Leaderboard reflects the latest state on every request.
- **Player rank** — Finding the requesting player's rank is trivial when all data is in memory.

## Trade-offs
- Does not scale to thousands of players. At production scale, a Redis sorted set (ZADD/ZRANK) or DynamoDB GSI with sparse index would be needed.
- Scan consumes read capacity proportional to table size (irrelevant with DynamoDB Local, important in production).

## Migration Path
For production: add a Redis sorted set updated on each point award, with a 30-second TTL fallback to scan. The `LeaderboardService` interface is already structured to support this swap transparently.
