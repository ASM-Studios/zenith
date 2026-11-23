import { vi } from 'vitest';

const OPTIONS = ['Backlog', 'Ready', 'In progress', 'In review', 'To release', 'Done'].map((name) => ({
  id: `opt:${name}`,
  name,
}));

export const issue = (number, extra = {}) => ({ number, state: 'open', assignees: [], labels: [], ...extra });

export const setTo = (name, number = 82) => ['STATUS', `item${number}`, `opt:${name}`];

export const moves = (calls) => calls.filter(([kind]) => kind === 'STATUS');

export function createFake() {
  const fake = { issues: {}, statuses: {}, parents: {}, calls: [] };

  const projectItems = (number) => {
    const name = fake.statuses[number];
    const node = { id: `item${number}`, project: { number: 26 }, fieldValueByName: name && { name } };
    return { repository: { issue: { projectItems: { nodes: name === undefined ? [] : [node] } } } };
  };

  fake.ctx = {
    owner: 'o',
    repo: 'r',
    projectNumber: 26,
    repoClient: {
      rest: vi.fn(async (method, path, body) => {
        fake.calls.push([method, path, body]);
        const number = Number(/issues\/(\d+)$/.exec(path)?.[1]);
        return method === 'GET' ? fake.issues[number] : undefined;
      }),
      graphql: vi.fn(async (query, variables) => ({
        repository: { issue: { parent: fake.parents[variables.issue] ?? null } },
      })),
    },
    projectClient: {
      graphql: vi.fn(async (query, variables) => {
        if (query.includes('projectItems')) return projectItems(variables.issue);
        if (query.includes('updateProjectV2ItemFieldValue')) {
          fake.calls.push(['STATUS', variables.item, variables.option]);
          return {};
        }
        return { organization: { projectV2: { id: 'p', field: { id: 'f', options: OPTIONS } } } };
      }),
    },
  };
  return fake;
}
