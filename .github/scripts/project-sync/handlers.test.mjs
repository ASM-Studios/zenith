import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onAssigned, onBranchCreated, onPullRequest } from './handlers.mjs';

const issues = {};
let calls;
let statuses;

function ctx() {
  return {
    owner: 'o',
    repo: 'r',
    projectNumber: 26,
    repoClient: {
      rest: vi.fn(async (method, path, body) => {
        calls.push([method, path, body]);
        const number = Number(/issues\/(\d+)$/.exec(path)?.[1]);
        return method === 'GET' ? issues[number] : undefined;
      }),
    },
    projectClient: {
      graphql: vi.fn(async (query, variables) => {
        if (query.includes('projectItems')) {
          const name = statuses[variables.issue];
          const node = { id: `item${variables.issue}`, project: { number: 26 }, fieldValueByName: name && { name } };
          return { repository: { issue: { projectItems: { nodes: name === undefined ? [] : [node] } } } };
        }
        if (query.includes('updateProjectV2ItemFieldValue')) {
          calls.push(['STATUS', variables.item, variables.option]);
          return {};
        }
        const options = ['Backlog', 'Ready', 'In progress', 'In review', 'To release', 'Done'].map((name) => ({
          id: `opt:${name}`,
          name,
        }));
        return { organization: { projectV2: { id: 'p', field: { id: 'f', options } } } };
      }),
    },
  };
}

const issue = (number, extra = {}) => ({ number, state: 'open', assignees: [], labels: [], ...extra });

beforeEach(() => {
  calls = [];
  statuses = { 82: 'Backlog' };
  for (const key of Object.keys(issues)) delete issues[key];
  issues[82] = issue(82, { labels: [{ name: 'feat' }, { name: 'infra' }] });
});

const push = (extra) => ({
  created: true,
  ref: 'refs/heads/cma/#82/project-sync',
  sender: { login: 'cma' },
  ...extra,
});

const pr = (extra) => ({
  action: 'opened',
  pull_request: {
    number: 90,
    draft: false,
    body: 'Closes #82',
    head: { ref: 'cma/#82/x' },
    user: { login: 'cma' },
    ...extra,
  },
});

const setTo = (name) => ['STATUS', 'item82', `opt:${name}`];
const assigned = (number, ...logins) => ['POST', `/repos/o/r/issues/${number}/assignees`, { assignees: logins }];

describe('onAssigned', () => {
  it('moves a backlog issue to Ready', async () => {
    await onAssigned(ctx(), { issue: { number: 82 } });
    expect(calls).toContainEqual(setTo('Ready'));
  });

  it('does not pull an issue that is already in progress back to Ready', async () => {
    statuses[82] = 'In progress';
    await onAssigned(ctx(), { issue: { number: 82 } });
    expect(calls.some(([kind]) => kind === 'STATUS')).toBe(false);
  });
});

describe('onBranchCreated', () => {
  it('assigns the first pusher and moves the issue to In progress', async () => {
    await onBranchCreated(ctx(), push());
    expect(calls).toContainEqual(assigned(82, 'cma'));
    expect(calls).toContainEqual(setTo('In progress'));
  });

  it('keeps an existing assignee', async () => {
    issues[82].assignees = [{ login: 'mbo' }];
    await onBranchCreated(ctx(), push());
    expect(calls.some(([method, path]) => method === 'POST' && path.endsWith('/assignees'))).toBe(false);
  });

  it('ignores later pushes to the branch', async () => {
    await onBranchCreated(ctx(), push({ created: false }));
    expect(calls).toEqual([]);
  });
});

describe('onPullRequest', () => {
  beforeEach(() => {
    issues[90] = issue(90, { pull_request: {} });
  });

  it('moves the issue to In review and syncs assignee and labels onto the PR', async () => {
    await onPullRequest(ctx(), pr());
    expect(calls).toContainEqual(setTo('In review'));
    expect(calls).toContainEqual(assigned(82, 'cma'));
    expect(calls).toContainEqual(assigned(90, 'cma'));
    expect(calls).toContainEqual(['POST', '/repos/o/r/issues/90/labels', { labels: ['feat', 'infra'] }]);
  });

  it('keeps a draft PR at In progress', async () => {
    await onPullRequest(ctx(), pr({ draft: true }));
    expect(calls).toContainEqual(setTo('In progress'));
  });

  it('moves the issue back to In progress when the PR becomes a draft', async () => {
    statuses[82] = 'In review';
    await onPullRequest(ctx(), { ...pr({ draft: true }), action: 'converted_to_draft' });
    expect(calls).toContainEqual(setTo('In progress'));
  });

  it('gives a mentioned PR the same assignee without moving it on the board', async () => {
    issues[91] = issue(91, { pull_request: {} });
    await onPullRequest(ctx(), pr({ body: 'Related to #91', head: { ref: 'cma/feat-x' } }));
    expect(calls).toContainEqual(assigned(91, 'cma'));
    expect(calls.some(([kind]) => kind === 'STATUS')).toBe(false);
  });

  it('ignores upstream numbers quoted in a bot PR body', async () => {
    const bot = { login: 'dependabot[bot]', type: 'Bot' };
    await onPullRequest(
      ctx(),
      pr({ body: 'Fixed in <a href="x">#82</a>', head: { ref: 'dependabot/npm/x' }, user: bot }),
    );
    expect(calls).toEqual([]);
  });

  it('still syncs the branch issue of a bot PR', async () => {
    const bot = { login: 'dependabot[bot]', type: 'Bot' };
    await onPullRequest(ctx(), pr({ body: 'Fixed in #91', user: bot }));
    expect(calls).toContainEqual(setTo('In review'));
    expect(calls.some(([, path]) => path?.endsWith('/issues/91'))).toBe(false);
  });

  it('skips closed issues', async () => {
    issues[82].state = 'closed';
    await onPullRequest(ctx(), pr());
    expect(calls.some(([method]) => method === 'POST')).toBe(false);
  });

  it('leaves the status alone when the issue is not in the project', async () => {
    delete statuses[82];
    await onPullRequest(ctx(), pr());
    expect(calls.some(([kind]) => kind === 'STATUS')).toBe(false);
  });
});
