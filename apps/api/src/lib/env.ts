import { z } from 'zod';

export const serverEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export const databaseEnv = z.object({
  DATABASE_URL: z.url(),
});

export const authEnv = z.object({
  PASSWORD_PEPPER: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

const appEnv = z.object({
  ...serverEnv.shape,
  ...databaseEnv.shape,
  ...authEnv.shape,
});

export type Env = Record<string, string | undefined>;

export class ConfigError extends Error {
  override name = 'ConfigError';
}

export function parseEnv<S extends z.ZodType>(schema: S, env: Env): z.output<S> {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function loadConfig(env: Env) {
  const parsed = parseEnv(appEnv, env);
  return {
    server: {
      env: parsed.NODE_ENV,
      host: parsed.HOST,
      port: parsed.API_PORT,
      logLevel: parsed.LOG_LEVEL,
    },
    database: { url: parsed.DATABASE_URL },
    auth: {
      passwordPepper: parsed.PASSWORD_PEPPER,
      secret: parsed.BETTER_AUTH_SECRET,
      url: parsed.BETTER_AUTH_URL,
    },
  };
}

export type Config = ReturnType<typeof loadConfig>;
