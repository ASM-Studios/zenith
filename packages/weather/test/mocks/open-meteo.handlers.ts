import { http, HttpResponse } from 'msw';
import currentOk from '../fixtures/open-meteo/current.json' with { type: 'json' };
import dailyOk from '../fixtures/open-meteo/daily.json' with { type: 'json' };
import hourlyOk from '../fixtures/open-meteo/hourly.json' with { type: 'json' };

export const openMeteoForecastUrl = 'https://api.open-meteo.com/v1/forecast';

export const currentOkHandler = http.get(openMeteoForecastUrl, () => HttpResponse.json(currentOk));

export const hourlyOkHandler = http.get(openMeteoForecastUrl, () => HttpResponse.json(hourlyOk));

export const dailyOkHandler = http.get(openMeteoForecastUrl, () => HttpResponse.json(dailyOk));

export { currentOk, dailyOk, hourlyOk };
