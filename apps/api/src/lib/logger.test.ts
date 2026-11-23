import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createLogger, stripQuery } from './logger.ts';

const logLine = z.record(z.string(), z.unknown());

function capture(level: 'info' | 'warn' = 'info') {
  const lines: Record<string, unknown>[] = [];
  const logger = createLogger(
    { level },
    {
      write(line: string) {
        lines.push(logLine.parse(JSON.parse(line)));
      },
    },
  );
  return { logger, lines };
}

describe('stripQuery', () => {
  it('removes the query string', () => {
    expect(stripQuery('/weather?lat=48.85&lon=2.35')).toBe('/weather');
  });

  it('keeps urls without a query string', () => {
    expect(stripQuery('/ping')).toBe('/ping');
  });

  it('passes undefined through', () => {
    expect(stripQuery(undefined)).toBeUndefined();
  });
});

describe('createLogger', () => {
  it('logs requests without their query string', () => {
    const { logger, lines } = capture();
    logger.info(
      { req: { method: 'GET', url: '/weather?lat=48.85&lon=2.35', host: 'localhost', ip: '10.0.0.1' } },
      'incoming request',
    );
    expect(lines[0]?.req).toEqual({
      method: 'GET',
      url: '/weather',
      host: 'localhost',
      remoteAddress: '10.0.0.1',
    });
    expect(JSON.stringify(lines[0])).not.toContain('48.85');
  });

  it('logs only the status code of replies', () => {
    const { logger, lines } = capture();
    logger.info({ res: { statusCode: 200, headers: { 'set-cookie': 'session=abc' } } }, 'done');
    expect(lines[0]?.res).toEqual({ statusCode: 200 });
  });

  it('redacts credentials', () => {
    const { logger, lines } = capture();
    logger.info(
      {
        req: { headers: { authorization: 'Bearer token', cookie: 'session=abc' } },
        res: { headers: { 'set-cookie': 'x' } },
      },
      'raw',
    );
    const output = JSON.stringify(lines[0]);
    expect(output).not.toContain('Bearer token');
    expect(output).not.toContain('session=abc');
  });

  it('honours the configured level', () => {
    const { logger, lines } = capture('warn');
    logger.info('hidden');
    logger.warn('shown');
    expect(lines.map((line) => line.msg)).toEqual(['shown']);
  });
});
