import type { FastifyPluginAsync } from 'fastify';
import { requireSession } from '../auth/session.ts';
import { putPreferencesBody } from './preferences.schema.ts';
import { getSourcePreferences, saveSourcePreferences } from './preferences.repository.ts';

export const preferenceRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireSession);

  app.route({
    method: 'GET',
    url: '/api/me/preferences',
    async handler(request) {
      return { sourcePreferences: await getSourcePreferences(request.userId) };
    },
  });

  app.route({
    method: 'PUT',
    url: '/api/me/preferences',
    async handler(request, reply) {
      const body = putPreferencesBody.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'invalid_body', issues: body.error.issues });
      }
      return { sourcePreferences: await saveSourcePreferences(request.userId, body.data.sourcePreferences) };
    },
  });
};
