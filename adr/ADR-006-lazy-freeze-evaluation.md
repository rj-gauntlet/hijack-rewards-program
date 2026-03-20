# ADR-006: Lazy Freeze Evaluation

## Status
Accepted

## Context
The spec describes two approaches for consuming streak freezes when a player misses a day:
1. **Scheduled**: A Lambda cron job at 01:00 UTC checks all players and consumes freezes
2. **Lazy**: Freeze consumption is evaluated on the player's next check-in

The spec states: "For this challenge, lazy evaluation (checking on next login) is perfectly acceptable."

## Decision
Use lazy freeze evaluation — freezes are consumed when the player next checks in, not on a schedule.

## Rationale
- **Simplicity**: No scheduled job infrastructure needed (no cron, no scanning all players)
- **Correctness**: Produces identical results to scheduled evaluation. The streak count is the same regardless of when the freeze is consumed.
- **Multi-day support**: On next check-in, the system loops through all missed days chronologically, consuming one freeze per day. If the player has enough freezes, the streak survives. If not, it resets.
- **Spec-approved**: Explicitly called out as acceptable
- **No observable difference**: A player who isn't logging in isn't viewing the dashboard, so the timing of freeze consumption is invisible to them

## Consequences
- Freeze consumption records are backdated to the missed day (correct date in `streaks-freeze-history`)
- Dashboard won't show a consumed freeze until the player returns
- Monthly freeze grant is also lazy — granted on first check-in of a new month, not on the 1st at midnight

## Key Behavior
- Freeze preserves the streak count but does **not** increment it
- Multiple freezes can cover multiple consecutive missed days (one per day)
- If freezes don't cover the full gap, the streak resets despite partial coverage
