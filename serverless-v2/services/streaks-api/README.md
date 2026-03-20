# Hijack Poker — Daily Streaks

Daily engagement system that tracks consecutive login and play activity, awards milestone-based bonus points, provides streak freeze protection, and displays everything on a React dashboard with a 30-day calendar heat map.

## Quick Start

```bash
# Start infrastructure + services
docker compose --profile streaks up -d

# Seed test data (10 players, 60 days of history)
npm run seed:streaks

# Open the dashboard
open http://localhost:4001    # React dashboard
open http://localhost:5001/api # Swagger UI
```

Enter a Player ID (e.g., `streak-001` through `streak-010`) to view the dashboard.

### Sample Players

| ID          | Name           | Profile                                |
|-------------|----------------|----------------------------------------|
| streak-001  | DailyGrinder   | 90% login, 85% play — long streaks     |
| streak-004  | CasualPlayer   | 20% login, 40% play — short streaks    |
| streak-010  | Perfectionist  | 100% both — 60-day perfect streak      |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  React Dashboard │────▶│  NestJS API      │────▶│  DynamoDB    │
│  port 4001       │     │  port 5001       │     │  Local       │
│                  │     │                  │     │              │
│  StreakCounters   │     │  /streaks/*      │     │  4 tables:   │
│  CalendarHeatMap  │     │  /calendar       │     │  - players   │
│  MilestoneProgress│     │  /rewards        │     │  - activity  │
│  FreezeStatus     │     │  /freezes        │     │  - rewards   │
│  RewardHistory    │     │  /internal/*     │     │  - freeze-   │
│  PersonalBest     │     │  Swagger at /api │     │    history   │
└─────────────────┘     └─────────────────┘     └──────────────┘
```

**Tech stack:** NestJS + TypeScript (strict) / React 18 + MUI + RTK Query / DynamoDB / Docker Compose

## What's Implemented

### Must-Have (Complete)
- Login and play streak tracking (independent, UTC calendar days)
- Idempotent check-in endpoint (multiple calls per day = one check-in)
- Milestone rewards at 3, 7, 14, 30, 60, 90 days (auto-awarded)
- Calendar heat map API (5 activity types: none, login_only, played, freeze, streak_broken)
- React dashboard with all components
- Streak freeze protection (lazy evaluation on next check-in)
- Monthly free freeze grant (lazy, on 1st of each month)
- Multi-day freeze consumption (one freeze per missed day)
- Personal best tracking
- Internal hand-completed endpoint for game processor
- Seed script with 10 players and 60 days of realistic history
- JWT auth guard (stubbed)

### Should-Have (Complete)
- Freeze balance and usage history endpoint
- Reward history endpoint
- Dashboard freeze status display
- Dashboard reward history table
- Switch Player button for evaluator convenience

### Could-Have / Stretch (Complete)
- Admin endpoint to grant freezes
- Admin endpoint to view player streak history
- Lambda-compatible entry point
- Dynamic flame icon (grows with streak length)
- Check-in button on dashboard

### Out of Scope
- Production deployment
- Real JWT authentication (stubbed)
- Payment for freeze purchases (balance tracking only)
- Unity client (REST endpoints only)
- Push notification delivery (stored only)

## API Documentation

### Player Endpoints (require `X-Player-Id` header)

#### `POST /api/v1/player/streaks/check-in`
Record a daily login. Idempotent — multiple calls on the same day return the same result.

**Response:**
```json
{
  "success": true,
  "data": {
    "loginStreak": 6,
    "playStreak": 4,
    "bestLoginStreak": 33,
    "bestPlayStreak": 9,
    "freezesAvailable": 1,
    "lastLoginDate": "2026-03-20",
    "alreadyCheckedIn": false,
    "milestonesEarned": [
      { "milestone": 7, "type": "login_milestone", "points": 150 }
    ]
  }
}
```

#### `GET /api/v1/player/streaks`
Current streak state with next milestone info.

**Response:**
```json
{
  "success": true,
  "data": {
    "loginStreak": 12,
    "playStreak": 5,
    "bestLoginStreak": 45,
    "bestPlayStreak": 22,
    "freezesAvailable": 2,
    "nextLoginMilestone": { "days": 14, "reward": 400, "daysRemaining": 2 },
    "nextPlayMilestone": { "days": 7, "reward": 300, "daysRemaining": 2 },
    "lastLoginDate": "2026-03-20",
    "lastPlayDate": "2026-03-19"
  }
}
```

#### `GET /api/v1/player/streaks/calendar?month=2026-03`
Calendar heat map data for a given month. Defaults to current month.

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "2026-03",
    "days": [
      { "date": "2026-03-01", "activity": "played", "loginStreak": 8, "playStreak": 3 },
      { "date": "2026-03-02", "activity": "login_only", "loginStreak": 9, "playStreak": 0 },
      { "date": "2026-03-03", "activity": "freeze", "loginStreak": 9, "playStreak": 0 },
      { "date": "2026-03-04", "activity": "streak_broken", "loginStreak": 0, "playStreak": 0 },
      { "date": "2026-03-05", "activity": "none", "loginStreak": 0, "playStreak": 0 }
    ]
  }
}
```

Activity types: `none` | `login_only` | `played` | `freeze` | `streak_broken`

#### `GET /api/v1/player/streaks/rewards`
Milestone rewards history.

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "playerId": "streak-001",
        "rewardId": "abc123",
        "type": "login_milestone",
        "milestone": 7,
        "points": 150,
        "streakCount": 7,
        "createdAt": "2026-03-10T12:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/v1/player/streaks/freezes`
Freeze balance and usage history.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "freezesAvailable": 2,
      "freezesUsedThisMonth": 1,
      "lastGrantDate": "2026-03"
    },
    "history": [
      { "playerId": "streak-001", "date": "2026-03-05", "source": "free_monthly" }
    ]
  }
}
```

### Internal Endpoints (no auth)

#### `POST /internal/streaks/hand-completed`
Notify that a player completed a hand. Idempotent per calendar day.

**Request:**
```json
{
  "playerId": "streak-001",
  "tableId": 456,
  "handId": "hand-789",
  "completedAt": "2026-03-20T14:30:00Z"
}
```

### Admin Endpoints (require `X-Player-Role: admin` header)

#### `POST /admin/streaks/grant-freeze`
Grant additional freezes to a player.

**Request:**
```json
{ "playerId": "streak-001", "count": 2, "reason": "Support compensation" }
```

#### `GET /admin/streaks/player/:playerId`
View a player's full streak profile.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | NestJS + TypeScript | Consistency with Rewards implementation; DI, guards, Swagger |
| Freeze evaluation | Lazy (on next check-in) | Simpler, spec explicitly allows it, no scheduled job needed |
| Calendar heat map | Custom build | Full control over 5-color scheme and responsive grid |
| State management | RTK Query | Cache invalidation after check-in, consistent with Rewards |
| Multi-day freeze | Supported | Natural extension; one freeze per missed day, streak preserved but not incremented |

## Trade-offs

- **Lazy freeze evaluation** means the dashboard won't show a freeze consumed until the player returns. Since absent players aren't viewing the dashboard, this is acceptable.
- **Scan-based calendar queries** work fine at demo scale (1 player's month of data). At production scale, a GSI on date would be more efficient.
- **No scheduled Lambda for freeze consumption** — lazy evaluation handles all cases correctly. A cron job would only add real-time dashboard accuracy for absent players.

## Running Tests

```bash
# Backend tests (NestJS)
cd serverless-v2/services/streaks-api
npm test                    # 33 tests

# Pure business logic tests
cd ../../daily-streaks
npm test                    # 129 tests

# Total: 162 tests
```

## What I'd Do Next

- Add React Testing Library tests for CalendarHeatMap and StreakCounter
- Add integration tests hitting real DynamoDB Local
- Implement SSE for real-time streak updates on dashboard
- Add streak sharing (generate shareable image/card)
- GitHub Actions CI pipeline
- Production deployment with Pulumi IaC
