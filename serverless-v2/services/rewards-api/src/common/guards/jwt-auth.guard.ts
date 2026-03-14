import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedPlayer } from '../decorators/current-player.decorator';

/**
 * Stub JWT authentication guard.
 *
 * In production this would verify a real JWT token.
 * For the tech assignment, it accepts either:
 *   1. A Bearer token in the Authorization header (decoded as a stub)
 *   2. An X-Player-Id header (testing fallback, matching skeleton behavior)
 *
 * Both approaches attach a `player` object to the request with
 * `playerId` and `role` fields.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { player?: AuthenticatedPlayer }
    >();

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = this.decodeStubToken(token);
      if (decoded) {
        request.player = decoded;
        return true;
      }
    }

    const playerIdHeader = request.headers['x-player-id'];
    if (playerIdHeader && typeof playerIdHeader === 'string') {
      const roleHeader = request.headers['x-player-role'];
      request.player = {
        playerId: playerIdHeader,
        role: typeof roleHeader === 'string' ? roleHeader : 'player',
      };
      return true;
    }

    throw new UnauthorizedException(
      'Authentication required. Provide either a Bearer token or X-Player-Id header.',
    );
  }

  /**
   * Decode a stub JWT token. Accepts a base64-encoded JSON string
   * with { playerId, role } or a plain playerId string.
   */
  private decodeStubToken(token: string): AuthenticatedPlayer | null {
    try {
      const decoded = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8'),
      ) as { playerId?: string; role?: string; sub?: string };
      const playerId = decoded.playerId || decoded.sub;
      if (!playerId) return null;
      return { playerId, role: decoded.role || 'player' };
    } catch {
      if (token.length > 0) {
        return { playerId: token, role: 'player' };
      }
      return null;
    }
  }
}
