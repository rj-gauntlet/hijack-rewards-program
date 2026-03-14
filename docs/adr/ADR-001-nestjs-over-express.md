# ADR-001: NestJS over Express

## Status
Accepted

## Context
The skeleton repo provided a rewards-api stub built with Express + Serverless Framework. The PRD explicitly requires NestJS as the backend framework. We needed to decide whether to extend the Express skeleton or migrate to NestJS.

## Decision
Migrate the rewards-api from Express to NestJS while keeping the same Docker Compose service definition and port (5000).

## Rationale
- **PRD compliance** — The product requirements document explicitly specifies NestJS.
- **Dependency injection** — NestJS's DI container simplifies testing (mock DynamoService, NotificationsService) and module composition.
- **Built-in validation** — `class-validator` + `ValidationPipe` provides declarative DTO validation without manual middleware.
- **Guards and decorators** — `@UseGuards(JwtAuthGuard)`, `@Roles('admin')`, `@CurrentPlayer()` express authentication and authorization intent declaratively.
- **Swagger generation** — `@nestjs/swagger` auto-generates API documentation from decorators, keeping docs in sync with code.

## Consequences
- Lost the Serverless Framework offline plugin (replaced with standard `npm run start:dev` for local development).
- Need to maintain both `tsconfig.json` and `nest-cli.json`.
- Slightly larger bundle than vanilla Express, but irrelevant at demo scale.
- `serverless-offline` start script preserved as a fallback but not actively used.
