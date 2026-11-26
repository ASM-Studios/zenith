import { vi } from 'vitest';
import type { Fetch } from '../api/client.ts';

export type Reply = () => Response;

export function json(status: number, body: unknown): Reply {
  return () => Response.json(body, { status });
}

export function stubApi(replies: Record<string, Reply>) {
  const fetch = vi.fn<Fetch>(async (input, init) => {
    const reply = replies[`${init.method} ${input}`] ?? replies[input];
    return reply ? reply() : new Response('not stubbed', { status: 404 });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

export function sentBody(fetch: ReturnType<typeof stubApi>, path: string): unknown {
  const body = fetch.mock.calls.find(([input, init]) => input === path && init.body !== undefined)?.[1].body;
  return typeof body === 'string' ? JSON.parse(body) : undefined;
}
