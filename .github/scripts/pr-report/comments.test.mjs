import { describe, expect, it } from 'vitest';
import { repostComment } from './comments.mjs';

const marker = '<!-- marker -->';
const comment = (id, body, type = 'Bot') => ({ id, body, user: { type } });

function fakeClient(existing, postedId = 50) {
  const calls = [];
  return {
    calls,
    rest: async (method, path, body) => {
      calls.push([method, path]);
      if (method === 'POST') return { id: postedId, body: body.body };
      if (method === 'GET') return path.endsWith('page=1') ? existing : [];
      return undefined;
    },
  };
}

const repost = (client) => repostComment(client, { repo: 'o/r', pr: 4, marker, body: `${marker} new` });
const deleted = (client) => client.calls.filter(([method]) => method === 'DELETE').map(([, path]) => path);

describe('repostComment', () => {
  it('posts the new comment before deleting the previous one', async () => {
    const client = fakeClient([comment(10, `${marker} old`)]);
    await repost(client);
    expect(client.calls[0][0]).toBe('POST');
    expect(deleted(client)).toEqual(['/repos/o/r/issues/comments/10']);
  });

  it('keeps comments written by people even when they quote the marker', async () => {
    const client = fakeClient([comment(10, `${marker} quoted`, 'User')]);
    await repost(client);
    expect(deleted(client)).toEqual([]);
  });

  it('keeps bot comments that are not reports', async () => {
    const client = fakeClient([comment(10, 'coverage table')]);
    await repost(client);
    expect(deleted(client)).toEqual([]);
  });

  it('never deletes a report posted after its own so concurrent runs keep one', async () => {
    const client = fakeClient([comment(40, `${marker} older`), comment(60, `${marker} newer`)], 50);
    await repost(client);
    expect(deleted(client)).toEqual(['/repos/o/r/issues/comments/40']);
  });

  it('reads every page of comments', async () => {
    const first = Array.from({ length: 100 }, (_, index) => comment(index + 1, 'noise'));
    const client = fakeClient(first, 200);
    const second = [comment(101, `${marker} old`)];
    const rest = client.rest;
    client.rest = async (method, path, body) =>
      method === 'GET' && path.endsWith('page=2') ? second : rest(method, path, body);
    await repost(client);
    expect(deleted(client)).toEqual(['/repos/o/r/issues/comments/101']);
  });
});
