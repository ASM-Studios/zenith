import { describe, expect, it } from 'vitest';
import { authEnv, ConfigError, databaseEnv, loadConfig, parseEnv } from './env.ts';

const validEnv = {
  DATABASE_URL: 'postgres://zenith:zenith@db:5432/zenith',
  REDIS_URL: 'redis://redis:6379',
  PASSWORD_PEPPER: 'p'.repeat(32),
  BETTER_AUTH_SECRET: 's'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
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
    });
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
