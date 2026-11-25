import type { FastifyReply } from 'fastify';
import { NoWeatherProviderError, WeatherSourceError, type WeatherReading } from '@zenith/weather';

export function readingBody(reading: WeatherReading) {
  return {
    data: reading.data,
    provider: reading.provider,
    updatedAt: reading.updatedAt.toISOString(),
    stale: reading.status === 'stale',
  };
}

export function sendWeatherError(reply: FastifyReply, error: unknown) {
  if (error instanceof NoWeatherProviderError) {
    return reply.status(404).send({ error: 'no_provider', dataType: error.dataType });
  }
  if (!(error instanceof WeatherSourceError)) {
    throw error;
  }
  if (error.kind === 'unsupported') {
    return reply.status(404).send({ error: 'not_supported', provider: error.providerId });
  }
  if (error.retryAfterSeconds !== null) {
    void reply.header('retry-after', String(error.retryAfterSeconds));
  }
  return reply.status(503).send({ error: 'source_unavailable', provider: error.providerId, reason: error.kind });
}
