import { beforeEach, describe, expect, it } from 'vitest';
import { onBranchCreated, onIssue, onPullRequest } from './handlers.mjs';
import { createFake, issue, moves, setTo } from './fake-github.mjs';

let fake;

beforeEach(() => {
  fake = createFake();
  fake.statuses[82] = 'Backlog';
  fake.issues[82] = issue(82, { labels: [{ name: 'feat' }, { name: 'infra' }] });
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

const assigned = (number, ...logins) => ['POST', `/repos/o/r/issues/${number}/assignees`, { assignees: logins }];
const withSubIssues = (number) => issue(number, { sub_issues_summary: { total: 2, completed: 0 } });

describe('onIssue assigned', () => {
  it('moves a backlog issue to Ready', async () => {
    await onIssue(fake.ctx, { action: 'assigned', issue: { number: 82 } });
    expect(fake.calls).toContainEqual(setTo('Ready'));
  });

  it('does not pull an issue that is already in progress back to Ready', async () => {
    fake.statuses[82] = 'In progress';
    await onIssue(fake.ctx, { action: 'assigned', issue: { number: 82 } });
    expect(moves(fake.calls)).toEqual([]);
  });
});

describe('onBranchCreated', () => {
  it('assigns the first pusher and moves the issue to In progress', async () => {
    await onBranchCreated(fake.ctx, push());
    expect(fake.calls).toContainEqual(assigned(82, 'cma'));
    expect(fake.calls).toContainEqual(setTo('In progress'));
  });

  it('keeps an existing assignee', async () => {
    fake.issues[82].assignees = [{ login: 'mbo' }];
    await onBranchCreated(fake.ctx, push());
    expect(fake.calls.some(([method, path]) => method === 'POST' && path.endsWith('/assignees'))).toBe(false);
  });

  it('ignores later pushes to the branch', async () => {
    await onBranchCreated(fake.ctx, push({ created: false }));
    expect(fake.calls).toEqual([]);
  });
});

describe('onPullRequest', () => {
  beforeEach(() => {
    fake.issues[90] = issue(90, { pull_request: {} });
  });

  it('moves the issue to In review and syncs assignee and labels onto the PR', async () => {
    await onPullRequest(fake.ctx, pr());
    expect(fake.calls).toContainEqual(setTo('In review'));
    expect(fake.calls).toContainEqual(assigned(82, 'cma'));
    expect(fake.calls).toContainEqual(assigned(90, 'cma'));
    expect(fake.calls).toContainEqual(['POST', '/repos/o/r/issues/90/labels', { labels: ['feat', 'infra'] }]);
  });

  it('keeps a draft PR at In progress', async () => {
    await onPullRequest(fake.ctx, pr({ draft: true }));
    expect(fake.calls).toContainEqual(setTo('In progress'));
  });

  it('moves the issue back to In progress when the PR becomes a draft', async () => {
    fake.statuses[82] = 'In review';
    await onPullRequest(fake.ctx, { ...pr({ draft: true }), action: 'converted_to_draft' });
    expect(fake.calls).toContainEqual(setTo('In progress'));
  });

  it('moves the linked sub-issue and leaves its mentioned parent in progress', async () => {
    fake.issues[82] = withSubIssues(82);
    fake.statuses[82] = 'In progress';
    fake.issues[83] = issue(83);
    fake.statuses[83] = 'In progress';
    await onPullRequest(fake.ctx, pr({ body: 'Closes #83\nPart of #82', head: { ref: 'cma/#83/x' } }));
    expect(moves(fake.calls)).toEqual([setTo('In review', 83)]);
  });

  it('leaves a parent with sub-issues alone even when the PR closes it', async () => {
    fake.issues[82] = withSubIssues(82);
    await onPullRequest(fake.ctx, pr());
    expect(moves(fake.calls)).toEqual([]);
    expect(fake.calls).toContainEqual(assigned(90, 'cma'));
  });

  it('moves only the issues the PR closes, not the ones it mentions', async () => {
    fake.issues[84] = issue(84);
    fake.statuses[84] = 'In progress';
    await onPullRequest(fake.ctx, pr({ body: 'Fixes: #82, see #84', head: { ref: 'cma/feat-x' } }));
    expect(moves(fake.calls)).toEqual([setTo('In review')]);
  });

  it('gives a mentioned PR the same assignee without moving it on the board', async () => {
    fake.issues[91] = issue(91, { pull_request: {} });
    await onPullRequest(fake.ctx, pr({ body: 'Related to #91', head: { ref: 'cma/feat-x' } }));
    expect(fake.calls).toContainEqual(assigned(91, 'cma'));
    expect(moves(fake.calls)).toEqual([]);
  });

  it('ignores upstream numbers quoted in a bot PR body', async () => {
    const bot = { login: 'dependabot[bot]', type: 'Bot' };
    await onPullRequest(
      fake.ctx,
      pr({ body: 'Fixed in <a href="x">#82</a>', head: { ref: 'dependabot/npm/x' }, user: bot }),
    );
    expect(fake.calls).toEqual([]);
  });

  it('still syncs the branch issue of a bot PR', async () => {
    const bot = { login: 'dependabot[bot]', type: 'Bot' };
    await onPullRequest(fake.ctx, pr({ body: 'Fixes #91', user: bot }));
    expect(fake.calls).toContainEqual(setTo('In review'));
    expect(fake.calls.some(([, path]) => path?.endsWith('/issues/91'))).toBe(false);
  });

  it('skips closed issues', async () => {
    fake.issues[82].state = 'closed';
    await onPullRequest(fake.ctx, pr());
    expect(fake.calls.some(([method]) => method === 'POST')).toBe(false);
  });

  it('leaves the status alone when the issue is not in the project', async () => {
    delete fake.statuses[82];
    await onPullRequest(fake.ctx, pr());
    expect(moves(fake.calls)).toEqual([]);
  });
});
