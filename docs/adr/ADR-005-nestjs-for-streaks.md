# ADR-005: NestJS for Streaks API

## Status
Accepted

## Context
The skeleton repo provides an Express + JavaScript stub for the streaks API. The challenge spec says "your choice — Express, Fastify, NestJS, or a Lambda handler." The Rewards system (Option A) was built with NestJS + TypeScript.

## Decision
Use NestJS + TypeScript for the Streaks API, replacing the Express stub.

## Rationale
- **Consistency**: Same framework as Rewards demonstrates pattern reuse and team-level consistency
- **Type safety**: TypeScript strict mode catches bugs at compile time, especially important for date arithmetic and streak logic
- **Structure**: NestJS modules provide clear separation (Streaks, Calendar, Rewards, Freezes) with dependency injection
- **Swagger**: Auto-generated API documentation from decorators — evaluator can explore endpoints immediately
- **Guards/decorators**: `@UseGuards(JwtAuthGuard)` and `@CurrentPlayer()` provide clean auth patterns
- **Validation**: `class-validator` DTOs with `ValidationPipe` validate all API inputs

## Consequences
- Old Express stubs remain in the directory but are excluded from TypeScript compilation
- Docker Compose command changed from `serverless offline` to `npm run build && npm run start:prod`
- Slightly longer cold start due to NestJS bootstrap, but acceptable for a demo
