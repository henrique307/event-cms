import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('retorna ok quando o banco responde', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: jest.fn().mockResolvedValue(1) } }],
    }).compile();

    const result = await moduleRef.get(HealthController).check();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
  });
});
