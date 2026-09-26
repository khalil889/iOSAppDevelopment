import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { DataSource, IsNull } from 'typeorm';
import { User } from '../users/user.entity';
import { AuthSession } from './auth-session.entity';

export interface TokenPair {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  refreshToken: string;
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class TokenService {
  constructor(
    private readonly db: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessTtl() {
    return this.config.get<number>('jwt.accessTtlSeconds') ?? 900;
  }

  private get refreshTtl() {
    return this.config.get<number>('jwt.refreshTtlDays') ?? 30;
  }

  /** Starts a new session family (sign-in). */
  async issue(user: Pick<User, 'id' | 'role'>, userAgent?: string): Promise<TokenPair> {
    return (await this.mint(user, randomUUID(), userAgent)).pair;
  }

  /** Rotates a refresh token. Reuse of a spent token revokes the whole family. */
  async refresh(refreshToken: string, userAgent?: string): Promise<TokenPair & { userId: string }> {
    const invalid = new UnauthorizedException('Session expired, please sign in again');
    const repo = this.db.getRepository(AuthSession);
    const session = await repo.findOne({ where: { tokenHash: hashToken(refreshToken) } });
    if (!session) throw invalid;

    if (session.revokedAt) {
      // A rotated-out token came back: someone else has a copy. Kill the chain.
      await repo.update({ familyId: session.familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
      throw invalid;
    }
    if (session.expiresAt <= new Date()) throw invalid;

    const user = await this.db.getRepository(User).findOneBy({ id: session.userId });
    if (!user || !user.isActive) throw invalid;

    // Conditional update so two concurrent refreshes can't both succeed.
    const claimed = await repo.update({ id: session.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    if (!claimed.affected) throw invalid;
    const next = await this.mint(user, session.familyId, userAgent);
    await repo.update({ id: session.id }, { replacedById: next.sessionId });
    return { ...next.pair, userId: user.id };
  }

  /** Revokes the family the given refresh token belongs to (sign out on this device). */
  async revoke(refreshToken: string): Promise<void> {
    const repo = this.db.getRepository(AuthSession);
    const session = await repo.findOne({ where: { tokenHash: hashToken(refreshToken) } });
    if (session) await repo.update({ familyId: session.familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /** Revokes every session of the user (sign out everywhere). */
  async revokeAll(userId: string): Promise<number> {
    const res = await this.db.getRepository(AuthSession).update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return res.affected ?? 0;
  }

  private async mint(
    user: Pick<User, 'id' | 'role'>,
    familyId: string,
    userAgent?: string,
  ): Promise<{ pair: TokenPair; sessionId: string }> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role }, { expiresIn: this.accessTtl });
    const refreshToken = randomBytes(32).toString('base64url');
    const inserted = await this.db.getRepository(AuthSession).insert({
      userId: user.id,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTtl * 86_400_000),
      userAgent: userAgent?.slice(0, 200) ?? null,
    });
    return {
      pair: { accessToken, expiresIn: this.accessTtl, refreshToken },
      sessionId: inserted.identifiers[0].id as string,
    };
  }
}
