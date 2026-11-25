export const reportMarker = '<!-- zenith-ci-report -->';

const ICONS = { passed: '✅', failed: '❌', cancelled: '⚪', skipped: '⏭️', running: '⏳' };
const PLATFORMS = { web: 'Web', android: 'Android', ios: 'iOS' };
const SCREENSHOT = /^(web|android|ios)-[a-z0-9-]+\.png$/;

export const isScreenshot = (name) => SCREENSHOT.test(name);

const plain = (value) => value.replace(/[|\r\n[\]()<>`*_]/g, ' ').trim();

export function jobState(job) {
  if (job.status !== 'completed') return 'running';
  if (job.conclusion === 'success') return 'passed';
  if (job.conclusion === 'skipped') return 'skipped';
  if (job.conclusion === 'cancelled') return 'cancelled';
  return 'failed';
}

export function overallState(states) {
  for (const state of ['failed', 'running', 'cancelled']) {
    if (states.includes(state)) return state;
  }
  return 'passed';
}

function jobsTable(workflow) {
  const rows = workflow.jobs.map((job) => {
    const state = jobState(job);
    return `| [${plain(job.name)}](${job.html_url}) | ${ICONS[state]} ${state} |`;
  });
  return [`### ${plain(workflow.name)}`, '', '| Job | Status |', '| --- | --- |', ...rows].join('\n');
}

function screenshotLinks(repo, workflows) {
  const byPlatform = new Map();
  for (const workflow of workflows) {
    for (const artifact of workflow.artifacts) {
      const platform = SCREENSHOT.exec(artifact.name)?.[1];
      if (platform === undefined) continue;
      const url = `https://github.com/${repo}/actions/runs/${workflow.runId}/artifacts/${artifact.id}`;
      const image = artifact.imageUrl === undefined ? '' : `\n\n  ![${artifact.name}](${artifact.imageUrl})`;
      byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), `- [${artifact.name}](${url})${image}`]);
    }
  }
  return Object.entries(PLATFORMS)
    .filter(([platform]) => byPlatform.has(platform))
    .map(([platform, label]) => `**${label}**\n\n${byPlatform.get(platform).toSorted().join('\n')}`);
}

export function renderReport({ repo, sha, workflows }) {
  const states = workflows.flatMap((workflow) => workflow.jobs.map(jobState));
  const overall = overallState(states);
  const sections = [
    `${reportMarker}\n## CI report ${ICONS[overall]} ${overall}\n\nCommit \`${sha.slice(0, 7)}\``,
    ...workflows.map(jobsTable),
  ];
  const screenshots = screenshotLinks(repo, workflows);
  if (screenshots.length > 0) sections.push(['### Screenshots', ...screenshots].join('\n\n'));
  return `${sections.join('\n\n')}\n`;
}
