import { WEATHER_DATA_TYPES } from '@zenith/core';
import type { FastifyPluginAsync } from 'fastify';
import { preferredProviderIds, type SourcePreferencesLookup } from './weather.preferences.ts';
import { readingBody, sendWeatherError } from './weather.replies.ts';
import { describeIssues, WEATHER_ROUTE_PATHS, weatherQuery } from './weather.schema.ts';
import type { WeatherService } from '@zenith/weather';

export interface WeatherRoutesOptions {
  service: WeatherService;
  sourcePreferences: SourcePreferencesLookup;
}

export const weatherRoutes: FastifyPluginAsync<WeatherRoutesOptions> = async (app, { service, sourcePreferences }) => {
  for (const dataType of WEATHER_DATA_TYPES) {
    app.route({
      method: 'GET',
      url: WEATHER_ROUTE_PATHS[dataType],
      async handler(request, reply) {
        const query = weatherQuery.safeParse(request.query);
        if (!query.success) {
          return reply
            .status(400)
            .send({ error: 'invalid_query', message: describeIssues(query.error.issues), issues: query.error.issues });
        }
        const { latitude, longitude, provider } = query.data;
        const preferredIds = preferredProviderIds(dataType, provider, await sourcePreferences(request));
        try {
          return readingBody(await service.get(dataType, { latitude, longitude }, preferredIds));
        } catch (error) {
          return sendWeatherError(reply, error);
        }
      },
    });
  }
};
