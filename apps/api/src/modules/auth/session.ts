import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';
import { auth } from '../../lib/auth.ts';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
  }
}

export async function requireSession(request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    throw Object.assign(new Error('unauthorized'), { statusCode: 401 });
  }
  if (!session.user.emailVerified) {
    throw Object.assign(new Error('email not verified'), { statusCode: 403 });
  }
  request.userId = session.user.id;
}
