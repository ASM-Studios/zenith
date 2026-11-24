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

export const redisEnv = z.object({
  REDIS_URL: z.url(),
});

export const authEnv = z.object({
  PASSWORD_PEPPER: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
});

export const weatherEnv = z.object({
  MET_NORWAY_CONTACT: z.string().min(1).default('https://github.com/ASM-Studios/zenith'),
});

export const mailEnv = z.object({
  SMTP_URL: z.url({ protocol: /^smtps?$/ }),
  MAIL_FROM: z.string().min(3),
});

const appEnv = z.object({
  ...serverEnv.shape,
  ...databaseEnv.shape,
  ...redisEnv.shape,
  ...authEnv.shape,
  ...weatherEnv.shape,
  ...mailEnv.shape,
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
    redis: { url: parsed.REDIS_URL },
    auth: {
      passwordPepper: parsed.PASSWORD_PEPPER,
      secret: parsed.BETTER_AUTH_SECRET,
      url: parsed.BETTER_AUTH_URL,
    },
    weather: { metNorwayContact: parsed.MET_NORWAY_CONTACT },
    mail: { smtpUrl: parsed.SMTP_URL, from: parsed.MAIL_FROM },
  };
}

export type Config = ReturnType<typeof loadConfig>;

const workerEnv = z.object({
  ...serverEnv.pick({ NODE_ENV: true, LOG_LEVEL: true }).shape,
  ...redisEnv.shape,
});

export function loadWorkerConfig(env: Env) {
  const parsed = parseEnv(workerEnv, env);
  return {
    server: { env: parsed.NODE_ENV, logLevel: parsed.LOG_LEVEL },
    redis: { url: parsed.REDIS_URL },
  };
}
