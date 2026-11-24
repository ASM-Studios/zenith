import type { WeatherDataType } from '@zenith/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';
import { auth } from '../../lib/auth.ts';
import { getSourcePreferences } from '../preferences/preferences.repository.ts';

export type SourcePreferencesLookup = (request: FastifyRequest) => Promise<Record<string, string>>;

export const WEATHER_PREFERENCE_KEY = 'weather';

export const sessionSourcePreferences: SourcePreferencesLookup = async (request) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  return session ? getSourcePreferences(session.user.id) : {};
};

export function preferredProviderIds(
  dataType: WeatherDataType,
  requested: string | undefined,
  preferences: Record<string, string>,
): string[] {
  return [requested, preferences[dataType], preferences[WEATHER_PREFERENCE_KEY]].filter(
    (id): id is string => id !== undefined,
  );
}
