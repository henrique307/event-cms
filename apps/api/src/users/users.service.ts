import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@event-cms/database';
import type { PublicUser } from '@event-cms/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return UsersService.toPublic(user);
  }

  /** Único ponto que converte User -> resposta HTTP. Nunca expõe passwordHash. */
  static toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
