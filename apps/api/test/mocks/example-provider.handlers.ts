import { http, HttpResponse } from 'msw';
import forecastOk from '../fixtures/example-provider/forecast-ok.json' with { type: 'json' };
import forecastRateLimited from '../fixtures/example-provider/forecast-rate-limited.json' with { type: 'json' };

export const exampleProviderUrl = 'https://example-provider.test/v1/forecast';

export const forecastOkHandler = http.get(exampleProviderUrl, () => HttpResponse.json(forecastOk));

export const forecastRateLimitedHandler = http.get(exampleProviderUrl, () =>
  HttpResponse.json(forecastRateLimited, { status: 429 }),
);
