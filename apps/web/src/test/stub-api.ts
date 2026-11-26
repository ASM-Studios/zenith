import { vi } from 'vitest';
import type { Fetch } from '../api/client.ts';

export type Reply = () => Response;

export function json(status: number, body: unknown): Reply {
  return () => Response.json(body, { status });
}

export function stubApi(replies: Record<string, Reply>) {
  const fetch = vi.fn<Fetch>(async (input) => {
    const reply = replies[input];
    return reply ? reply() : new Response('not stubbed', { status: 404 });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

export function sentBody(fetch: ReturnType<typeof stubApi>, path: string): unknown {
  const body = fetch.mock.calls.find(([input]) => input === path)?.[1].body;
  return typeof body === 'string' ? JSON.parse(body) : undefined;
}
