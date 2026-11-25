import { listAll } from './paginate.mjs';
import { isScreenshot } from './render.mjs';

export const releaseTag = 'ci-screenshots';

async function ensureRelease(client, repo) {
  const existing = `/repos/${repo}/releases/tags/${releaseTag}`;
  try {
    return await client.rest('GET', existing);
  } catch {
    const created = {
      tag_name: releaseTag,
      name: 'CI screenshots',
      body: 'Screenshots embedded in the CI report comments of pull requests. Managed by the PR report job.',
      prerelease: true,
    };
    return client.rest('POST', `/repos/${repo}/releases`, created).catch(() => client.rest('GET', existing));
  }
}

const assetsPath = (repo, release) => `/repos/${repo}/releases/${release.id}/assets`;

async function uploadOrFind({ client, transport, repo, release }, name, artifact) {
  try {
    return await transport.upload(repo, release.id, name, await transport.download(repo, artifact.id));
  } catch (error) {
    const found = (await listAll(client, assetsPath(repo, release))).find((asset) => asset.name === name);
    if (found === undefined) throw error;
    return found;
  }
}

async function publishOne(context, artifact) {
  const name = `${context.prefix}${artifact.id}-${artifact.name}`;
  try {
    const asset = context.known.get(name) ?? (await uploadOrFind(context, name, artifact));
    return [artifact.id, asset.browser_download_url];
  } catch (error) {
    process.stderr.write(`Could not embed ${artifact.name}: ${error.message}\n`);
    return [artifact.id, undefined];
  }
}

export async function publishScreenshots({ client, transport, repo, pr, sha, workflows }) {
  const wanted = workflows.flatMap((workflow) => workflow.artifacts).filter((item) => isScreenshot(item.name));
  if (wanted.length === 0) return workflows;
  const release = await ensureRelease(client, repo);
  const assets = await listAll(client, assetsPath(repo, release));
  const prefix = `pr-${pr}-${sha.slice(0, 7)}-`;
  const context = { client, transport, repo, release, prefix, known: new Map(assets.map((a) => [a.name, a])) };
  const urls = new Map(await Promise.all(wanted.map((artifact) => publishOne(context, artifact))));
  const outdated = assets.filter((asset) => asset.name.startsWith(`pr-${pr}-`) && !asset.name.startsWith(prefix));
  await Promise.all(outdated.map((asset) => client.rest('DELETE', `/repos/${repo}/releases/assets/${asset.id}`)));
  return workflows.map((workflow) => ({
    ...workflow,
    artifacts: workflow.artifacts.map((artifact) => ({ ...artifact, imageUrl: urls.get(artifact.id) })),
  }));
}
