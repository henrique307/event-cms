import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CORS restrito a origens explícitas (nunca '*' com credenciais).
  const origins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',');
  app.enableCors({ origin: origins, credentials: true });

  // whitelist: remove campos fora do DTO; forbidNonWhitelisted: rejeita-os com 400.
  // Impede, por exemplo, alguém enviar "passwordHash" ou "role" no corpo.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableShutdownHooks();

  const port = config.get<number>('API_PORT', 3333);
  await app.listen(port);
  Logger.log(`API rodando em http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
