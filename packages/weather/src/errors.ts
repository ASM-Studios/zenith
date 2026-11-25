import type { ProviderErrorKind, WeatherDataType } from '@zenith/core';

export class NoWeatherProviderError extends Error {
  readonly dataType: WeatherDataType;

  constructor(dataType: WeatherDataType) {
    super(`no weather provider offers ${dataType} at this location`);
    this.name = 'NoWeatherProviderError';
    this.dataType = dataType;
  }
}

export class WeatherSourceError extends Error {
  readonly status = 'unavailable' as const;
  readonly providerId: string;
  readonly kind: ProviderErrorKind;
  readonly retryAfterSeconds: number | null;

  constructor(providerId: string, kind: ProviderErrorKind, retryAfterSeconds: number | null, cause: unknown) {
    super(`weather provider ${providerId} failed: ${kind}`, { cause });
    this.name = 'WeatherSourceError';
    this.providerId = providerId;
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
