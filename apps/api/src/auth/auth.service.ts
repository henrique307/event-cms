import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthResponse } from '@event-cms/types';
import { UsersService } from '../users/users.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('E-mail já cadastrado');
    }
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await this.passwords.hash(dto.password),
    });
    return { user: UsersService.toPublic(user), tokens: await this.tokens.issue(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    // Mesma mensagem para e-mail inexistente e senha errada:
    // não revela quais e-mails estão cadastrados.
    const valid = user && (await this.passwords.verify(user.passwordHash, dto.password));
    if (!user || !valid) throw new UnauthorizedException('Credenciais inválidas');

    return { user: UsersService.toPublic(user), tokens: await this.tokens.issue(user) };
  }

  refresh(refreshToken: string) {
    return this.tokens.rotate(refreshToken);
  }

  logout(refreshToken: string) {
    return this.tokens.revoke(refreshToken);
  }
}
