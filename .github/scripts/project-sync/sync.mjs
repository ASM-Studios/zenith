import { setStatus } from './project.mjs';

const log = (message) => process.stdout.write(`${message}\n`);

export function getIssue(ctx, number) {
  return ctx.repoClient.rest('GET', `/repos/${ctx.owner}/${ctx.repo}/issues/${number}`);
}

export async function assignIfNone(ctx, number, logins) {
  const current = await getIssue(ctx, number);
  if (current.assignees.length > 0 || logins.length === 0) return current.assignees.map((user) => user.login);
  await ctx.repoClient.rest('POST', `/repos/${ctx.owner}/${ctx.repo}/issues/${number}/assignees`, {
    assignees: logins,
  });
  log(`#${number}: assigned ${logins.join(', ')}`);
  return logins;
}

export async function moveIssue(ctx, number, target, force = false) {
  if (!ctx.projectClient) {
    log(`#${number}: PROJECT_TOKEN missing, status left as is`);
    return;
  }
  const result = await setStatus(ctx.projectClient, ctx, number, target, force);
  log(`#${number}: ${result.skipped ?? `${result.from} -> ${result.to}`}`);
}

export async function copyLabels(ctx, issue, prNumber) {
  const labels = issue.labels.map((label) => label.name);
  if (labels.length === 0) return;
  await ctx.repoClient.rest('POST', `/repos/${ctx.owner}/${ctx.repo}/issues/${prNumber}/labels`, { labels });
}

export async function syncMention(ctx, number, actor) {
  const mentioned = await getIssue(ctx, number);
  if (mentioned.state !== 'open') return null;
  const assignees = await assignIfNone(ctx, number, [actor]);
  return { mentioned, assignees, isPullRequest: Boolean(mentioned.pull_request) };
}
