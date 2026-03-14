# ADR-004: Tier Reset Floor Protection

## Status
Accepted

## Context
The PRD specifies monthly tier resets with "floor protection" — players cannot drop more than one tier per reset cycle. This prevents a Platinum player who had an inactive month from crashing to Bronze.

## Decision
Implement floor protection as a pure function: `calculateTierAfterReset(currentTier, monthlyPoints)` returns a `TierChangeEvent` only if the player didn't meet their current tier's threshold, dropping exactly one tier level.

## Rationale
- **Pure function** — No side effects, no DynamoDB dependency. Takes tier + points, returns the new tier. This makes it trivially testable (40 unit tests cover all tier transitions and edge cases).
- **Composable** — The same function is used by both the `SystemService` (monthly reset batch) and can be used in future automated schedulers.
- **One-tier-max drop** — `Math.max(MIN_TIER, currentTier - 1)` ensures Bronze players never go below Bronze and every other tier drops by exactly one.
- **Threshold-based** — A player who earned enough points to maintain their tier keeps it, regardless of how much above the threshold they were.

## Algorithm
```
if monthlyPoints >= TIER_THRESHOLDS[currentTier]:
    → no change (player met their tier requirement)
else if currentTier == BRONZE:
    → no change (already at lowest tier)
else:
    → drop to currentTier - 1
```

## Consequences
- A Platinum player with 0 points drops to Gold (not Bronze). It takes 3 consecutive inactive months to reach Bronze from Platinum.
- The monthly reset must process all players — implemented as a `POST /system/monthly-reset` endpoint that scans the entire players table.
- Tier history is written before the reset so the previous month's state is preserved for the tier timeline UI.
