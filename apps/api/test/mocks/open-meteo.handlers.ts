import { http, HttpResponse } from 'msw';
import airQualityEurope from '../fixtures/open-meteo/air-quality-europe.json' with { type: 'json' };
import airQualityOutsideEurope from '../fixtures/open-meteo/air-quality-outside-europe.json' with { type: 'json' };
import current from '../fixtures/open-meteo/current.json' with { type: 'json' };
import daily from '../fixtures/open-meteo/daily.json' with { type: 'json' };
import hourly from '../fixtures/open-meteo/hourly.json' with { type: 'json' };

export const openMeteoForecastUrl = 'https://open-meteo.test/v1/forecast';
export const openMeteoAirQualityUrl = 'https://open-meteo-air.test/v1/air-quality';

export const forecastHandler = http.get(openMeteoForecastUrl, ({ request }) => {
  const params = new URL(request.url).searchParams;
  if (params.has('hourly')) {
    return HttpResponse.json(hourly);
  }
  if (params.has('daily')) {
    return HttpResponse.json(daily);
  }
  return HttpResponse.json(current);
});

export const airQualityEuropeHandler = http.get(openMeteoAirQualityUrl, () => HttpResponse.json(airQualityEurope));

export const airQualityOutsideEuropeHandler = http.get(openMeteoAirQualityUrl, () =>
  HttpResponse.json(airQualityOutsideEurope),
);

export { airQualityEurope, current, daily, hourly };
