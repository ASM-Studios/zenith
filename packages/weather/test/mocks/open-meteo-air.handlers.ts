import { http, HttpResponse } from 'msw';
import airQualityOk from '../fixtures/open-meteo/air-quality.json' with { type: 'json' };
import pollenParis from '../fixtures/open-meteo/pollen-paris.json' with { type: 'json' };
import pollenSydney from '../fixtures/open-meteo/pollen-sydney.json' with { type: 'json' };

export const openMeteoAirUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const airQualityOkHandler = http.get(openMeteoAirUrl, () => HttpResponse.json(airQualityOk));

export const pollenParisHandler = http.get(openMeteoAirUrl, () => HttpResponse.json(pollenParis));

export const pollenSydneyHandler = http.get(openMeteoAirUrl, () => HttpResponse.json(pollenSydney));

export { airQualityOk };
