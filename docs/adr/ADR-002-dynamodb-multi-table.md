# ADR-002: DynamoDB Multi-Table Design

## Status
Accepted

## Context
DynamoDB supports two design approaches: single-table design (all entities in one table with overloaded keys) and multi-table design (one table per access pattern). The rewards system has 5 distinct entity types with different access patterns.

## Decision
Use a separate DynamoDB table for each entity type: `rewards-players`, `rewards-transactions`, `rewards-notifications`, `rewards-tier-history`, and `rewards-leaderboard`.

## Rationale
- **Clarity over optimization** — Each table has a clear schema. No composite key gymnastics (e.g., `PK=PLAYER#123, SK=TX#timestamp`) that obscure intent.
- **Independent scaling** — Transactions table (high write volume) can scale independently from the player profile table (low write, high read).
- **Simpler queries** — Each access pattern maps to one table's partition key. No filter expressions needed to separate entity types.
- **Matches the skeleton** — The Docker Compose `init-dynamodb.sh` already creates separate tables; we extended rather than replaced.
- **Demo scale** — At 175 players with ~50K transactions, single-table optimization (reducing table count for provisioned capacity) provides no measurable benefit.

## Consequences
- More tables to manage in infrastructure scripts.
- Cannot perform cross-entity transactions atomically (acceptable — rewards system has no ACID requirements across entities).
- The `rewards-leaderboard` table is created but not actively used (leaderboard uses scan-on-read from `rewards-players`).
