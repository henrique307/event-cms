/**
 * Falha cedo se faltar configuração crítica. Sem biblioteca extra:
 * o ConfigModule chama esta função ao iniciar.
 */
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET e JWT_REFRESH_SECRET devem ser diferentes.');
  }
  if (env.NODE_ENV === 'production' && String(env.JWT_SECRET).length < 32) {
    throw new Error('Em produção, JWT_SECRET deve ter pelo menos 32 caracteres.');
  }
  return env;
}
