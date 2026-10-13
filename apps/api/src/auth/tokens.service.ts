import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens } from '@event-cms/types';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

interface RefreshTokenPayload {
  sub: string;
  /** id da linha em RefreshToken (uma por sessão). */
  jti: string;
}

const ACCESS_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

/**
 * Access token: curto, sem estado, assinado com JWT_SECRET.
 * Refresh token: longo, assinado com JWT_REFRESH_SECRET e registrado no banco
 * (só o hash SHA-256), o que permite revogar (logout) e rotacionar.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issue(user: { id: string; email: string }): Promise<AuthTokens> {
    // Geramos o id antes para usá-lo como jti dentro do próprio token.
    const sessionId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: sessionId } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret, expiresIn: REFRESH_TTL_SECONDS },
    );
    await this.prisma.refreshToken.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      },
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    } satisfies AccessTokenPayload);

    return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
  }

  /**
   * Rotação: o refresh usado é revogado e um novo par é emitido.
   * Se um token JÁ revogado for reapresentado, assumimos roubo e
   * revogamos todas as sessões do usuário (detecção de reuso).
   */
  async rotate(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefresh(refreshToken);
    const session = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!session || session.tokenHash !== sha256(refreshToken)) {
      throw new UnauthorizedException('Sessão inválida');
    }
    if (session.revokedAt) {
      await this.revokeAllForUser(session.userId);
      throw new UnauthorizedException('Sessão revogada');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessão expirada');
    }

    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issue(session.user);
  }

  /** Logout: revoga apenas a sessão deste refresh token. Idempotente. */
  async revoke(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken).catch(() => null);
    if (!payload) return;
    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private revokeAllForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyRefresh(token: string): Promise<RefreshTokenPayload> {
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(token, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }
  }

  private get refreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export { ACCESS_TTL_SECONDS };
