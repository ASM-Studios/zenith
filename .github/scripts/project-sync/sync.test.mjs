import { beforeEach, describe, expect, it } from 'vitest';
import { assignIfNone } from './sync.mjs';
import { createFake, issue } from './fake-github.mjs';

let fake;

const rejectAssign = (message) => {
  const original = fake.ctx.repoClient.rest.getMockImplementation();
  fake.ctx.repoClient.rest.mockImplementation(async (method, path, body) => {
    if (method === 'POST' && path.endsWith('/assignees')) throw new Error(message);
    return original(method, path, body);
  });
};

beforeEach(() => {
  fake = createFake();
  fake.issues[90] = issue(90);
});

describe('assignIfNone', () => {
  it('does not fail when GitHub answers that the assignee is already taken', async () => {
    rejectAssign('POST /issues/90/assignees: 422 Assignee has already been taken');
    await expect(assignIfNone(fake.ctx, 90, ['cma'])).resolves.toEqual(['cma']);
  });

  it('still fails on any other API error', async () => {
    rejectAssign('POST /issues/90/assignees: 500 Server Error');
    await expect(assignIfNone(fake.ctx, 90, ['cma'])).rejects.toThrow('500');
  });
});
