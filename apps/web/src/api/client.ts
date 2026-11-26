import { ApiError } from './api-error.ts';

export type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export type Parse<T> = (data: unknown) => T;

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: Fetch;
};

const defaultFetch: Fetch = (input, init) => globalThis.fetch(input, init);

export function createApiClient({ baseUrl, fetch = defaultFetch }: ApiClientOptions) {
  async function request<T>(method: string, path: string, parse: Parse<T>, body?: unknown): Promise<T> {
    const hasBody = body !== undefined;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: hasBody
        ? { accept: 'application/json', 'content-type': 'application/json' }
        : { accept: 'application/json' },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      throw new ApiError(method, path, response.status, await response.text());
    }
    const data: unknown = response.status === 204 ? undefined : await response.json();
    return parse(data);
  }

  return {
    get: <T>(path: string, parse: Parse<T>) => request('GET', path, parse),
    post: <T>(path: string, body: unknown, parse: Parse<T>) => request('POST', path, parse, body),
    delete: <T>(path: string, parse: Parse<T>) => request('DELETE', path, parse),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
