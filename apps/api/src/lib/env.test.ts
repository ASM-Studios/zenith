import { describe, expect, it } from 'vitest';
import { authEnv, ConfigError, databaseEnv, loadConfig, loadWorkerConfig, parseEnv } from './env.ts';

const validEnv = {
  DATABASE_URL: 'postgres://zenith:zenith@db:5432/zenith',
  REDIS_URL: 'redis://redis:6379',
  PASSWORD_PEPPER: 'p'.repeat(32),
  BETTER_AUTH_SECRET: 's'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
  SMTP_URL: 'smtp://mail:1025',
  MAIL_FROM: 'Zenith <no-reply@zenith.example>',
};

describe('loadConfig', () => {
  it('builds a typed config with defaults', () => {
    expect(loadConfig(validEnv)).toEqual({
      server: { env: 'development', host: '0.0.0.0', port: 3000, logLevel: 'info' },
      database: { url: validEnv.DATABASE_URL },
      redis: { url: validEnv.REDIS_URL },
      auth: {
        passwordPepper: validEnv.PASSWORD_PEPPER,
        secret: validEnv.BETTER_AUTH_SECRET,
        url: validEnv.BETTER_AUTH_URL,
      },
      weather: { metNorwayContact: 'https://github.com/ASM-Studios/zenith' },
      mail: { smtpUrl: validEnv.SMTP_URL, from: validEnv.MAIL_FROM },
    });
  });

  it('reads the MET Norway contact from MET_NORWAY_CONTACT', () => {
    const config = loadConfig({ ...validEnv, MET_NORWAY_CONTACT: 'ops@example.org' });

    expect(config.weather.metNorwayContact).toBe('ops@example.org');
  });

  it.each(['http://mail:1025', 'not a url', ''])('rejects SMTP_URL=%s', (smtpUrl) => {
    expect(() => loadConfig({ ...validEnv, SMTP_URL: smtpUrl })).toThrow(/SMTP_URL/);
  });

  it('accepts an smtps SMTP_URL with credentials', () => {
    const smtpUrl = 'smtps://user:secret@smtp.example.com:465';
    expect(loadConfig({ ...validEnv, SMTP_URL: smtpUrl }).mail.smtpUrl).toBe(smtpUrl);
  });

  it('rejects a missing MAIL_FROM', () => {
    const { MAIL_FROM: _from, ...partial } = validEnv;
    expect(() => loadConfig(partial)).toThrow(/MAIL_FROM/);
  });

  it('coerces API_PORT and reads optional server settings', () => {
    const config = loadConfig({
      ...validEnv,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      API_PORT: '8080',
      LOG_LEVEL: 'debug',
    });
    expect(config.server).toEqual({ env: 'production', host: '127.0.0.1', port: 8080, logLevel: 'debug' });
  });

  it.each(['abc', '0', '70000', '3.5'])('rejects API_PORT=%s', (port) => {
    expect(() => loadConfig({ ...validEnv, API_PORT: port })).toThrow(ConfigError);
  });

  it('rejects an unknown LOG_LEVEL', () => {
    expect(() => loadConfig({ ...validEnv, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it.each(['http://localhost:5173,https://zenith.example', ''])('accepts BETTER_AUTH_TRUSTED_ORIGINS=%s', (origins) => {
    expect(() => loadConfig({ ...validEnv, BETTER_AUTH_TRUSTED_ORIGINS: origins })).not.toThrow();
  });

  it.each(['http://localhost:5173/', 'http://localhost:5173, http://localhost:8080', 'localhost:5173'])(
    'rejects BETTER_AUTH_TRUSTED_ORIGINS=%s',
    (origins) => {
      expect(() => loadConfig({ ...validEnv, BETTER_AUTH_TRUSTED_ORIGINS: origins })).toThrow(
        /BETTER_AUTH_TRUSTED_ORIGINS/,
      );
    },
  );

  it('rejects a short password pepper', () => {
    expect(() => loadConfig({ ...validEnv, PASSWORD_PEPPER: 'short' })).toThrow(/PASSWORD_PEPPER/);
  });

  it('reports every invalid variable in a single error', () => {
    const { REDIS_URL: _redis, BETTER_AUTH_SECRET: _secret, ...partial } = validEnv;
    const load = () => loadConfig({ ...partial, API_PORT: 'abc' });
    expect(load).toThrow(ConfigError);
    expect(load).toThrow(/REDIS_URL/);
    expect(load).toThrow(/BETTER_AUTH_SECRET/);
    expect(load).toThrow(/API_PORT/);
  });
});

describe('loadWorkerConfig', () => {
  it('needs only the Redis URL', () => {
    expect(loadWorkerConfig({ REDIS_URL: validEnv.REDIS_URL })).toEqual({
      server: { env: 'development', logLevel: 'info' },
      redis: { url: validEnv.REDIS_URL },
    });
  });

  it('reads NODE_ENV and LOG_LEVEL', () => {
    const config = loadWorkerConfig({ REDIS_URL: validEnv.REDIS_URL, NODE_ENV: 'production', LOG_LEVEL: 'warn' });
    expect(config.server).toEqual({ env: 'production', logLevel: 'warn' });
  });

  it('rejects a missing REDIS_URL', () => {
    expect(() => loadWorkerConfig({})).toThrow(/REDIS_URL/);
  });
});

describe('parseEnv', () => {
  it('only validates the requested section', () => {
    expect(parseEnv(databaseEnv, { DATABASE_URL: validEnv.DATABASE_URL })).toEqual({
      DATABASE_URL: validEnv.DATABASE_URL,
    });
  });

  it('supports picking a subset of a section', () => {
    const schema = authEnv.pick({ PASSWORD_PEPPER: true });
    expect(parseEnv(schema, { PASSWORD_PEPPER: validEnv.PASSWORD_PEPPER })).toEqual({
      PASSWORD_PEPPER: validEnv.PASSWORD_PEPPER,
    });
  });

  it('throws a ConfigError when the section is invalid', () => {
    expect(() => parseEnv(databaseEnv, {})).toThrow(ConfigError);
  });
});
