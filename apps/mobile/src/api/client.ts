import { ApiError } from './api-error.ts';

export type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export type Parse<T> = (data: unknown) => T;

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: Fetch;
  getToken?: () => Promise<string | null>;
};

export const defaultFetch: Fetch = (input, init) => globalThis.fetch(input, init);

export function createApiClient({ baseUrl, fetch = defaultFetch, getToken }: ApiClientOptions) {
  async function requestHeaders(hasBody: boolean) {
    const token = getToken ? await getToken() : null;
    return {
      accept: 'application/json',
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
  }

  async function send(method: string, path: string, body?: unknown): Promise<Response> {
    const hasBody = body !== undefined;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: await requestHeaders(hasBody),
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      throw new ApiError(method, path, response.status, await response.text());
    }
    return response;
  }

  async function request<T>(method: string, path: string, parse: Parse<T>, body?: unknown): Promise<T> {
    const response = await send(method, path, body);
    const data: unknown = await response.json();
    return parse(data);
  }

  return {
    get: <T>(path: string, parse: Parse<T>) => request('GET', path, parse),
    post: <T>(path: string, body: unknown, parse: Parse<T>) => request('POST', path, parse, body),
    delete: async (path: string): Promise<void> => {
      await send('DELETE', path);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
