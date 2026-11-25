import { describe, expect, it } from 'vitest';
import { publishScreenshots } from './release.mjs';

const release = { id: 9 };

function fakeClient({ assets = [], missingRelease = false } = {}) {
  const calls = [];
  return {
    calls,
    rest: async (method, path) => {
      calls.push([method, path]);
      if (path.includes('/releases/tags/')) {
        if (missingRelease && calls.filter(([, p]) => p.includes('/tags/')).length === 1) throw new Error('404');
        return release;
      }
      if (method === 'POST') return release;
      if (method === 'GET') return path.endsWith('page=1') ? assets : [];
      return undefined;
    },
  };
}

function fakeTransport({ failing = [] } = {}) {
  const uploads = [];
  return {
    uploads,
    download: async (repo, id) => Buffer.from(`bytes-${id}`),
    upload: async (repo, releaseId, name) => {
      if (failing.some((part) => name.includes(part))) throw new Error('upload failed');
      uploads.push(name);
      return { browser_download_url: `https://assets.test/${name}` };
    },
  };
}

const workflows = [{ name: 'CI', runId: 1, jobs: [], artifacts: [{ id: 5, name: 'web-home.png' }] }];
const publish = (client, transport, input = workflows) =>
  publishScreenshots({ client, transport, repo: 'o/r', pr: 4, sha: 'abcdef1234567', workflows: input });

describe('publishScreenshots', () => {
  it('uploads each screenshot and hands back its public url', async () => {
    const transport = fakeTransport();
    const [workflow] = await publish(fakeClient(), transport);
    expect(transport.uploads).toEqual(['pr-4-abcdef1-5-web-home.png']);
    expect(workflow.artifacts[0].imageUrl).toBe('https://assets.test/pr-4-abcdef1-5-web-home.png');
  });

  it('does not upload a screenshot that is already a release asset', async () => {
    const name = 'pr-4-abcdef1-5-web-home.png';
    const asset = { id: 1, name, browser_download_url: 'https://assets.test/old' };
    const transport = fakeTransport();
    const [workflow] = await publish(fakeClient({ assets: [asset] }), transport);
    expect(transport.uploads).toEqual([]);
    expect(workflow.artifacts[0].imageUrl).toBe('https://assets.test/old');
  });

  it('deletes the assets of earlier commits of the same pull request only', async () => {
    const assets = [
      { id: 1, name: 'pr-4-1111111-3-web-home.png' },
      { id: 2, name: 'pr-44-1111111-3-web-home.png' },
    ];
    const client = fakeClient({ assets });
    await publish(client, fakeTransport());
    const deleted = client.calls.filter(([method]) => method === 'DELETE').map(([, path]) => path);
    expect(deleted).toEqual(['/repos/o/r/releases/assets/1']);
  });

  it('creates the release when it does not exist yet', async () => {
    const client = fakeClient({ missingRelease: true });
    await publish(client, fakeTransport());
    expect(client.calls.some(([method, path]) => method === 'POST' && path === '/repos/o/r/releases')).toBe(true);
  });

  it('keeps going without an image when one upload fails', async () => {
    const input = [
      {
        name: 'CI',
        runId: 1,
        jobs: [],
        artifacts: [
          { id: 5, name: 'web-home.png' },
          { id: 6, name: 'web-home-fr.png' },
        ],
      },
    ];
    const [workflow] = await publish(fakeClient(), fakeTransport({ failing: ['home-fr'] }), input);
    expect(workflow.artifacts.map((artifact) => artifact.imageUrl === undefined)).toEqual([false, true]);
  });

  it('uses the asset a concurrent report uploaded when its own upload is refused', async () => {
    const name = 'pr-4-abcdef1-5-web-home.png';
    const client = fakeClient();
    let listings = 0;
    const rest = client.rest;
    client.rest = async (method, path) => {
      const isAssetListing = method === 'GET' && path.includes('/assets') && path.endsWith('page=1');
      if (isAssetListing)
        return ++listings === 1 ? [] : [{ id: 1, name, browser_download_url: 'https://assets.test/other' }];
      return rest(method, path);
    };
    const transport = { ...fakeTransport({ failing: ['web-home'] }) };
    const [workflow] = await publish(client, transport);
    expect(workflow.artifacts[0].imageUrl).toBe('https://assets.test/other');
  });

  it('touches nothing when there is no screenshot', async () => {
    const client = fakeClient();
    const input = [{ name: 'CI', runId: 1, jobs: [], artifacts: [{ id: 1, name: 'coverage' }] }];
    expect(await publish(client, fakeTransport(), input)).toBe(input);
    expect(client.calls).toEqual([]);
  });
});
