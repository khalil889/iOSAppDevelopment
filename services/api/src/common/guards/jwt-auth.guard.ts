import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '../../users/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/** How long a user's role/active flag is trusted before re-reading it. */
const USER_STATE_TTL_MS = 30_000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly userState = new Map<string, { role: AuthUser['role']; isActive: boolean; at: number }>();

  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly db: DataSource,
  ) {}

  /**
   * Role and active flag come from the database (cached briefly), not the
   * token, so disabling a user or changing their role takes effect within
   * seconds rather than when the token expires.
   */
  private async currentState(userId: string) {
    const cached = this.userState.get(userId);
    if (cached && Date.now() - cached.at < USER_STATE_TTL_MS) return cached;
    const user = await this.db.getRepository(User).findOne({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
    const state = user ? { role: user.role, isActive: user.isActive, at: Date.now() } : null;
    if (state) this.userState.set(userId, state);
    else this.userState.delete(userId);
    if (this.userState.size > 50_000) this.userState.clear();
    return state;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const header: string | undefined = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; role: AuthUser['role'] }>(token);
        const state = await this.currentState(payload.sub);
        if (!state?.isActive) throw new Error('inactive');
        req.user = { id: payload.sub, role: state.role } satisfies AuthUser;
      } catch {
        if (!isPublic) throw new UnauthorizedException('Invalid or expired token');
      }
    }

    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException();
    return true;
  }
}
