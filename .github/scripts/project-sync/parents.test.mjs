import { beforeEach, describe, expect, it } from 'vitest';
import { onIssue } from './handlers.mjs';
import { hasSubIssues } from './parents.mjs';
import { createFake, moves, setTo } from './fake-github.mjs';

let fake;

beforeEach(() => {
  fake = createFake();
  fake.statuses[82] = 'In progress';
});

const closed = (number) => ({ action: 'closed', issue: { number } });
const parent = (completed, total = 2) => ({ number: 82, subIssuesSummary: { total, completed } });

describe('hasSubIssues', () => {
  it('is true only when the issue has at least one sub-issue', () => {
    expect(hasSubIssues({ sub_issues_summary: { total: 2, completed: 0 } })).toBe(true);
    expect(hasSubIssues({ sub_issues_summary: { total: 0, completed: 0 } })).toBe(false);
    expect(hasSubIssues({})).toBe(false);
  });
});

describe('onIssue closed', () => {
  it('moves the parent to Done when its last sub-issue is closed', async () => {
    fake.parents[83] = parent(2);
    await onIssue(fake.ctx, closed(83));
    expect(fake.calls).toContainEqual(setTo('Done'));
  });

  it('leaves the parent alone while a sub-issue is still open', async () => {
    fake.parents[83] = parent(1);
    await onIssue(fake.ctx, closed(83));
    expect(moves(fake.calls)).toEqual([]);
  });

  it('moves a parent waiting for release to Done', async () => {
    fake.statuses[82] = 'To release';
    fake.parents[83] = parent(2);
    await onIssue(fake.ctx, closed(83));
    expect(fake.calls).toContainEqual(setTo('Done'));
  });

  it('does nothing for an issue without a parent', async () => {
    await onIssue(fake.ctx, closed(83));
    expect(fake.calls).toEqual([]);
  });

  it('ignores closed pull requests', async () => {
    fake.parents[83] = parent(2);
    await onIssue(fake.ctx, { action: 'closed', issue: { number: 83, pull_request: {} } });
    expect(fake.calls).toEqual([]);
  });
});
