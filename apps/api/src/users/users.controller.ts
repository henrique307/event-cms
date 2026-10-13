import { Controller, Get } from '@nestjs/common';
import type { PublicUser } from '@event-cms/types';
import { CurrentUser, type AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Rota protegida (guard global): retorna o usuário do token. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.users.getPublicById(user.id);
  }
}
