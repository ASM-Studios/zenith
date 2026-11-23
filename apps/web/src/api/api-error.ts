export class ApiError extends Error {
  override name = 'ApiError';
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly body: string;

  constructor(method: string, path: string, status: number, body: string) {
    super(`${method} ${path} failed with status ${status}`);
    this.method = method;
    this.path = path;
    this.status = status;
    this.body = body;
  }
}
