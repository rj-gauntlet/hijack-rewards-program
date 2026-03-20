import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function createMockContext(headers: Record<string, string>): ExecutionContext {
  const request: Record<string, unknown> = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('accepts X-Player-Id header', () => {
    const ctx = createMockContext({ 'x-player-id': 'streak-001' });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.player).toEqual({ playerId: 'streak-001', role: 'player' });
  });

  it('accepts X-Player-Id with X-Player-Role', () => {
    const ctx = createMockContext({
      'x-player-id': 'streak-001',
      'x-player-role': 'admin',
    });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.player).toEqual({ playerId: 'streak-001', role: 'admin' });
  });

  it('accepts Bearer token (plain playerId)', () => {
    const ctx = createMockContext({
      authorization: 'Bearer streak-001',
    });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.player).toEqual({ playerId: 'streak-001', role: 'player' });
  });

  it('accepts base64-encoded Bearer token', () => {
    const payload = Buffer.from(
      JSON.stringify({ playerId: 'streak-002', role: 'admin' }),
    ).toString('base64');
    const ctx = createMockContext({ authorization: `Bearer ${payload}` });
    expect(guard.canActivate(ctx)).toBe(true);
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.player).toEqual({ playerId: 'streak-002', role: 'admin' });
  });

  it('throws UnauthorizedException when no auth provided', () => {
    const ctx = createMockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when X-Player-Id is empty', () => {
    const ctx = createMockContext({ 'x-player-id': '' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
