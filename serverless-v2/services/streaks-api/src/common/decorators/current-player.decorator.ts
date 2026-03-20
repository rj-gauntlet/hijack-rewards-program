import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedPlayer {
  playerId: string;
  role: string;
}

export const CurrentPlayer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPlayer => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { player: AuthenticatedPlayer }).player;
  },
);
