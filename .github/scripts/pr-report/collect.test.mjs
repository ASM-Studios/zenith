import { describe, expect, it } from 'vitest';
import { collectWorkflows } from './collect.mjs';

const run = (id, name, createdAt) => ({ id, name, created_at: createdAt });

function fakeClient(runs, jobs = [], artifacts = []) {
  return {
    rest: async (method, path) => {
      if (path.includes('/jobs')) return { jobs };
      if (path.includes('/artifacts')) return { artifacts };
      return { workflow_runs: runs };
    },
  };
}

const collect = (client) => collectWorkflows(client, { repo: 'o/r', sha: 'abc' });

describe('collectWorkflows', () => {
  it('keeps only the workflows the report covers', async () => {
    const workflows = await collect(fakeClient([run(1, 'CI', '1'), run(2, 'Security', '1')]));
    expect(workflows.map((workflow) => workflow.name)).toEqual(['CI']);
  });

  it('keeps the newest run of a workflow', async () => {
    const workflows = await collect(fakeClient([run(1, 'CI', '2026-01-01'), run(2, 'CI', '2026-01-02')]));
    expect(workflows.map((workflow) => workflow.runId)).toEqual([2]);
  });

  it('orders the workflows by name', async () => {
    const workflows = await collect(fakeClient([run(1, 'Dev environment', '1'), run(2, 'CI', '1')]));
    expect(workflows.map((workflow) => workflow.name)).toEqual(['CI', 'Dev environment']);
  });

  it('leaves out the report job itself and expired artifacts', async () => {
    const jobs = [{ name: 'PR report' }, { name: 'Build' }];
    const artifacts = [
      { id: 1, name: 'web-home.png', expired: false },
      { id: 2, name: 'web-old.png', expired: true },
    ];
    const [workflow] = await collect(fakeClient([run(1, 'CI', '1')], jobs, artifacts));
    expect(workflow.jobs.map((entry) => entry.name)).toEqual(['Build']);
    expect(workflow.artifacts.map((entry) => entry.id)).toEqual([1]);
  });
});
