import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { PrismaService } from '../prisma/prisma.service';
import { TokensService } from './tokens.service';

/** Prisma falso em memória: só o necessário para a tabela RefreshToken. */
function fakePrisma() {
  const rows = new Map<string, any>();
  const user = { id: 'u1', email: 'a@b.com' };
  return {
    rows,
    refreshToken: {
      create: jest.fn(async ({ data }) => rows.set(data.id, { ...data, revokedAt: null, userId: data.userId })),
      findUnique: jest.fn(async ({ where }) => {
        const r = rows.get(where.id);
        return r ? { ...r, user } : null;
      }),
      update: jest.fn(async ({ where, data }) => Object.assign(rows.get(where.id), data)),
      updateMany: jest.fn(async ({ where, data }) => {
        for (const r of rows.values()) if (r.userId === where.userId || r.id === where.id) Object.assign(r, data);
      }),
    },
  };
}

describe('TokensService', () => {
  const config = new ConfigService({ JWT_REFRESH_SECRET: 'refresh-secret' });
  const jwt = new JwtService({ secret: 'access-secret' });
  let prisma: ReturnType<typeof fakePrisma>;
  let service: TokensService;

  beforeEach(() => {
    prisma = fakePrisma();
    service = new TokensService(jwt, config, prisma as unknown as PrismaService);
  });

  it('guarda apenas o hash do refresh token', async () => {
    const { refreshToken } = await service.issue({ id: 'u1', email: 'a@b.com' });
    const [row] = [...prisma.rows.values()];
    expect(row.tokenHash).toBe(createHash('sha256').update(refreshToken).digest('hex'));
    expect(row.tokenHash).not.toBe(refreshToken);
  });

  it('rotaciona: o refresh antigo deixa de funcionar', async () => {
    const first = await service.issue({ id: 'u1', email: 'a@b.com' });
    const second = await service.rotate(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
  });

  it('reuso de token revogado derruba todas as sessões', async () => {
    const first = await service.issue({ id: 'u1', email: 'a@b.com' });
    const second = await service.rotate(first.refreshToken);

    await expect(service.rotate(first.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.rotate(second.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token assinado com outro segredo', async () => {
    const forged = await jwt.signAsync({ sub: 'u1', jti: 'x' }, { secret: 'outro' });
    await expect(service.rotate(forged)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
