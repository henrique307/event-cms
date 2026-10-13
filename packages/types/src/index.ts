/**
 * Contratos compartilhados entre web e api (formatos de resposta HTTP).
 * Regra: apenas tipos/DTOs de transporte. Nada de lógica nem tipos do Prisma.
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ---------- Auth ----------

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Validade do access token, em segundos. */
  expiresIn: number;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}
