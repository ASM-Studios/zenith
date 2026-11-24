import type { FastifyPluginAsync } from 'fastify';
import { requireSession } from '../auth/session.ts';
import { locationParams, postLocationsBody } from './locations.schema.ts';
import { deleteLocation, listLocations, upsertLocations } from './locations.repository.ts';

export const locationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireSession);

  app.route({
    method: 'GET',
    url: '/api/me/locations',
    async handler(request) {
      return { locations: await listLocations(request.userId) };
    },
  });

  app.route({
    method: 'POST',
    url: '/api/me/locations',
    async handler(request, reply) {
      const body = postLocationsBody.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'invalid_body', issues: body.error.issues });
      }
      return { locations: await upsertLocations(request.userId, body.data.locations) };
    },
  });

  app.route({
    method: 'DELETE',
    url: '/api/me/locations/:id',
    async handler(request, reply) {
      const params = locationParams.safeParse(request.params);
      if (!params.success || !(await deleteLocation(request.userId, params.data.id))) {
        return reply.status(404).send({ error: 'not_found' });
      }
      return reply.status(204).send();
    },
  });
};
