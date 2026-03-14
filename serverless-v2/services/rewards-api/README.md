# Rewards API — Hijack Poker

NestJS-based rewards system implementing a four-tier loyalty program with real-time points calculation, leaderboard, and admin tools.

## Quick Start

```bash
# From the repo root
docker compose --profile core --profile rewards up -d

# Wait ~30 seconds for DynamoDB to initialize, then seed data
node scripts/seed-rewards.js

# Open the dashboard
# http://localhost:4000
```

Login with any player ID from the seed data (check Swagger at http://localhost:5000/api for the list, or use `player-001`).

## Architecture

```
┌──────────────┐     ┌────────────────────────────────────┐     ┌───────────────┐
│  React App   │────►│         NestJS Rewards API          │────►│  DynamoDB     │
│  (Vite/MUI)  │     │                                    │     │  Local        │
│  :4000       │     │  Points │ Tiers │ Leaderboard      │     │  :8000        │
│              │     │  Notifications │ Admin │ System     │     │               │
│  RTK Query   │     │                                    │     │  5 tables     │
│  Redux       │     │  JWT stub auth + X-Player-Id       │     │               │
└──────────────┘     └────────────────────────────────────┘     └───────────────┘
```

### DynamoDB Tables

| Table | PK | SK | Purpose |
|-------|----|----|---------|
| `rewards-players` | `playerId` | — | Player profile, tier, points |
| `rewards-transactions` | `playerId` | `timestamp` | Immutable points ledger |
| `rewards-notifications` | `playerId` | `notificationId` | In-app notifications |
| `rewards-tier-history` | `playerId` | `monthKey` | Monthly tier snapshots |
| `rewards-leaderboard` | `playerId` | — | Reserved (scan-on-read used instead) |

## API Endpoints

### Player-Facing (authenticated via `X-Player-Id` or Bearer token)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/player/rewards` | Current tier, points, progress |
| `GET` | `/api/v1/player/rewards/history?limit=20&offset=0` | Paginated transaction history |
| `GET` | `/api/v1/player/notifications?unread=true` | Notifications with optional unread filter |
| `PATCH` | `/api/v1/player/notifications/:id/dismiss` | Mark notification as read |
| `GET` | `/api/v1/player/tier-history` | Monthly tier snapshots |
| `GET` | `/api/v1/leaderboard?limit=10` | Top N + player's own rank |

### Server-to-Server (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/points/award` | Award points for a hand |
| `POST` | `/system/monthly-reset` | Trigger monthly tier reset |

### Admin (requires `X-Player-Role: admin` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/players/:playerId/rewards` | Full player profile with history |
| `POST` | `/admin/points/adjust` | Manual credit/debit |
| `POST` | `/admin/tier/override` | Set tier override with expiry |
| `GET` | `/admin/leaderboard` | Enriched leaderboard with emails |

Full Swagger documentation available at http://localhost:5000/api when the server is running.

### Request/Response Examples

**Award Points** (`POST /api/v1/points/award`)

```json
// Request
{
  "playerId": "abc-123",
  "tableId": "table-5",
  "tableStakes": "$2.00-$5.00",
  "bigBlind": 2.50,
  "handId": "hand-uuid-001"
}

// Response
{
  "success": true,
  "data": {
    "earnedPoints": 7,
    "basePoints": 5,
    "multiplier": 1.5,
    "newMonthlyTotal": 1507,
    "currentTier": 3,
    "tierUpgrade": null,
    "milestonesReached": []
  },
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

**Admin Adjust** (`POST /admin/points/adjust`)

```json
// Request (header: X-Player-Role: admin)
{
  "playerId": "abc-123",
  "points": -200,
  "reason": "Duplicate hand correction"
}
```

## Tier System

| Tier | Threshold | Multiplier |
|------|-----------|------------|
| Bronze | 0 pts | 1.0x |
| Silver | 500 pts/month | 1.25x |
| Gold | 2,000 pts/month | 1.5x |
| Platinum | 10,000 pts/month | 2.0x |

- **Upgrades** are instant when monthly points cross a threshold
- **Monthly reset** drops at most one tier (floor protection)
- Points formula: `floor(basePoints × tierMultiplier)`

## What's Implemented vs. Stubbed

### Fully Implemented
- Four-tier progression with instant upgrades and monthly floor protection
- Stakes-based point calculation with tier multipliers
- Immutable points ledger (audit trail)
- Notifications for tier upgrades, downgrades, and milestones (500/1000/2500/5000/10000)
- Leaderboard (scan-on-read, sorted by monthly points)
- Admin endpoints (profile, point adjust, tier override)
- React dashboard with 4 widgets (summary, history, leaderboard, tier timeline)
- Notification bell with unread badge and dismiss
- Seed data generator (175 players, 6 months of history)
- JWT auth stub with X-Player-Id fallback

### Stubbed / Not Implemented
- Real JWT verification (accepts any token, decodes as base64 stub)
- Redis-backed leaderboard cache
- WebSocket/SSE real-time notifications
- Idempotency on handId (duplicate protection)
- Lambda-compatible entry point
- Rate limiting

## Key Decisions

See `docs/adr/` for Architecture Decision Records:

1. **NestJS over Express** — PRD requires NestJS; provides DI, guards, pipes, Swagger out of the box
2. **DynamoDB multi-table design** — Separate tables per access pattern for clean partition keys
3. **Scan-on-read leaderboard** — Acceptable at demo scale (~200 players), avoids eventual consistency of materialized views
4. **Tier reset floor protection** — One-tier-max drop per month, implemented as a pure function with 40 unit tests

## Running Tests

```bash
cd serverless-v2/services/rewards-api
npm install
npm test          # 168 tests
npm run test:coverage  # with coverage report
```

## Project Structure

```
src/
├── main.ts                    # Bootstrap, CORS, Swagger, validation pipe
├── app.module.ts              # Root module
├── common/
│   ├── constants/             # Tiers, stakes, milestones
│   ├── decorators/            # @Roles, @CurrentPlayer
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── types/                 # TypeScript interfaces
│   └── utils/                 # API response builders, month key helpers
├── dynamo/                    # DynamoDB client wrapper (global module)
├── points/                    # Points engine (award, summary, history)
├── tiers/                     # Pure tier logic + milestone detection
├── notifications/             # Create, list, dismiss notifications
├── leaderboard/               # Scan-sort leaderboard with player rank
├── admin/                     # Role-guarded admin operations
├── system/                    # Monthly reset endpoint
└── health/                    # Health check
```
