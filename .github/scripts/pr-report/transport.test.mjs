import { describe, expect, it } from 'vitest';
import { createTransport } from './transport.mjs';

const respond = (body, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  arrayBuffer: async () => Buffer.from(body),
  json: async () => ({ browser_download_url: body }),
  text: async () => body,
});

describe('createTransport', () => {
  it('downloads an artifact with the token', async () => {
    const seen = [];
    const transport = createTransport('tok', async (url, init) => {
      seen.push([url, init.headers.authorization]);
      return respond('png');
    });
    expect((await transport.download('o/r', 5)).toString()).toBe('png');
    expect(seen).toEqual([['https://api.github.com/repos/o/r/actions/artifacts/5/zip', 'Bearer tok']]);
  });

  it('uploads the bytes as a png asset with an encoded name', async () => {
    const seen = [];
    const transport = createTransport('tok', async (url, init) => {
      seen.push([url, init.method, init.headers['content-type']]);
      return respond('https://assets.test/a');
    });
    const asset = await transport.upload('o/r', 9, 'a b.png', Buffer.from('x'));
    expect(asset.browser_download_url).toBe('https://assets.test/a');
    expect(seen).toEqual([
      ['https://uploads.github.com/repos/o/r/releases/9/assets?name=a%20b.png', 'POST', 'image/png'],
    ]);
  });

  it('fails with the status and body when GitHub refuses', async () => {
    const transport = createTransport('tok', async () => respond('nope', false));
    await expect(transport.download('o/r', 5)).rejects.toThrow('500 nope');
  });
});
