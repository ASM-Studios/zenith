import { http, HttpResponse } from 'msw';
import currentOk from '../fixtures/meteo-france/current.json' with { type: 'json' };
import dailyOk from '../fixtures/meteo-france/daily.json' with { type: 'json' };
import hourlyOk from '../fixtures/meteo-france/hourly.json' with { type: 'json' };

export const meteoFranceForecastUrl = 'https://api.open-meteo.com/v1/meteofrance';

export const currentOkHandler = http.get(meteoFranceForecastUrl, () => HttpResponse.json(currentOk));

export const hourlyOkHandler = http.get(meteoFranceForecastUrl, () => HttpResponse.json(hourlyOk));

export const dailyOkHandler = http.get(meteoFranceForecastUrl, () => HttpResponse.json(dailyOk));

export { currentOk, hourlyOk };
