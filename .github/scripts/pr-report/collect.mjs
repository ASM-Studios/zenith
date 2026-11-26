export const reportedWorkflows = ['CI', 'Dev environment'];
export const reportJobName = 'PR report';

function latestRuns(runs) {
  const latest = new Map();
  for (const run of runs) {
    const known = latest.get(run.name);
    if (reportedWorkflows.includes(run.name) && (known === undefined || run.created_at > known.created_at)) {
      latest.set(run.name, run);
    }
  }
  return [...latest.values()].toSorted((a, b) => a.name.localeCompare(b.name));
}

async function describeRun(client, repo, run) {
  const base = `/repos/${repo}/actions/runs/${run.id}`;
  const [{ jobs }, { artifacts }] = await Promise.all([
    client.rest('GET', `${base}/jobs?per_page=100`),
    client.rest('GET', `${base}/artifacts?per_page=100`),
  ]);
  return {
    name: run.name,
    runId: run.id,
    jobs: jobs.filter((job) => job.name !== reportJobName),
    artifacts: artifacts.filter((artifact) => !artifact.expired),
  };
}

export async function collectWorkflows(client, { repo, sha }) {
  const { workflow_runs: runs } = await client.rest('GET', `/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`);
  return Promise.all(latestRuns(runs).map((run) => describeRun(client, repo, run)));
}
