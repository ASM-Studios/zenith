export type ProviderErrorKind = 'timeout' | 'unavailable' | 'quota';

export abstract class ProviderError extends Error {
  abstract readonly kind: ProviderErrorKind;
  readonly providerId: string;

  constructor(providerId: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.providerId = providerId;
  }
}

export class ProviderTimeoutError extends ProviderError {
  readonly kind = 'timeout';
  readonly timeoutMs: number;

  constructor(providerId: string, timeoutMs: number, options?: ErrorOptions) {
    super(providerId, `${providerId} did not answer within ${timeoutMs} ms`, options);
    this.timeoutMs = timeoutMs;
  }
}

export class ProviderUnavailableError extends ProviderError {
  readonly kind = 'unavailable';
  readonly status: number | undefined;

  constructor(providerId: string, status?: number, options?: ErrorOptions) {
    const reason = status === undefined ? 'unreachable' : `answered with status ${status}`;
    super(providerId, `${providerId} is unavailable: ${reason}`, options);
    this.status = status;
  }
}

export class ProviderQuotaError extends ProviderError {
  readonly kind = 'quota';
  readonly retryAfterSeconds: number | undefined;

  constructor(providerId: string, retryAfterSeconds?: number, options?: ErrorOptions) {
    super(providerId, `${providerId} quota exceeded`, options);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}
