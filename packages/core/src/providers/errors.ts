export const PROVIDER_ERROR_KINDS = ['timeout', 'unavailable', 'quota', 'invalid-response', 'unsupported'] as const;

export type ProviderErrorKind = (typeof PROVIDER_ERROR_KINDS)[number];

export interface ProviderErrorOptions {
  cause?: unknown;
}

export interface ProviderQuotaErrorOptions extends ProviderErrorOptions {
  retryAfterSeconds?: number;
}

export abstract class ProviderError extends Error {
  abstract readonly kind: ProviderErrorKind;
  readonly providerId: string;

  constructor(providerId: string, message: string, options?: ProviderErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.providerId = providerId;
  }
}

export class ProviderTimeoutError extends ProviderError {
  readonly kind = 'timeout';
}

export class ProviderUnavailableError extends ProviderError {
  readonly kind = 'unavailable';
}

export class ProviderQuotaError extends ProviderError {
  readonly kind = 'quota';
  readonly retryAfterSeconds: number | null;

  constructor(providerId: string, message: string, options?: ProviderQuotaErrorOptions) {
    super(providerId, message, options);
    this.retryAfterSeconds = options?.retryAfterSeconds ?? null;
  }
}

export class ProviderInvalidResponseError extends ProviderError {
  readonly kind = 'invalid-response';
}

export class ProviderUnsupportedError extends ProviderError {
  readonly kind = 'unsupported';
}
