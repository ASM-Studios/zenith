import { describe, expect, it } from 'vitest';
import { jobState, overallState, renderReport, reportMarker } from './render.mjs';

const job = (name, status, conclusion) => ({ name, status, conclusion, html_url: `https://example.test/${name}` });
const artifact = (id, name) => ({ id, name });
const render = (workflows) => renderReport({ repo: 'o/r', sha: 'abcdef1234567', workflows });

describe('jobState', () => {
  it('reports a job that is not completed as running', () => {
    expect(jobState(job('a', 'in_progress', null))).toBe('running');
    expect(jobState(job('a', 'queued', null))).toBe('running');
  });

  it('maps each conclusion to its state', () => {
    expect(jobState(job('a', 'completed', 'success'))).toBe('passed');
    expect(jobState(job('a', 'completed', 'skipped'))).toBe('skipped');
    expect(jobState(job('a', 'completed', 'cancelled'))).toBe('cancelled');
    expect(jobState(job('a', 'completed', 'failure'))).toBe('failed');
    expect(jobState(job('a', 'completed', 'timed_out'))).toBe('failed');
  });
});

describe('overallState', () => {
  it('lets a failure win over a running job', () => {
    expect(overallState(['passed', 'running', 'failed'])).toBe('failed');
  });

  it('reports running while a job is still running and nothing failed', () => {
    expect(overallState(['passed', 'running'])).toBe('running');
  });

  it('counts skipped jobs as passed', () => {
    expect(overallState(['passed', 'skipped'])).toBe('passed');
  });
});

describe('renderReport', () => {
  it('starts with the marker used to find the previous comment', () => {
    expect(render([]).startsWith(reportMarker)).toBe(true);
  });

  it('shows the short commit and the overall status', () => {
    const report = render([{ name: 'CI', runId: 1, jobs: [job('Build', 'completed', 'failure')], artifacts: [] }]);
    expect(report).toContain('## CI report ❌ failed');
    expect(report).toContain('`abcdef1`');
  });

  it('lists each job with its status and link', () => {
    const report = render([{ name: 'CI', runId: 1, jobs: [job('Build', 'completed', 'success')], artifacts: [] }]);
    expect(report).toContain('| [Build](https://example.test/Build) | ✅ passed |');
  });

  it('groups the screenshots by platform with a direct artifact link', () => {
    const report = render([
      {
        name: 'Dev environment',
        runId: 7,
        jobs: [],
        artifacts: [artifact(3, 'ios-home.png'), artifact(2, 'android-ubuntu-home.png'), artifact(1, 'coverage')],
      },
      { name: 'CI', runId: 9, jobs: [], artifacts: [artifact(5, 'web-home.png')] },
    ]);
    expect(report).toContain('https://github.com/o/r/actions/runs/7/artifacts/2');
    expect(report.indexOf('**Web**')).toBeLessThan(report.indexOf('**Android**'));
    expect(report.indexOf('**Android**')).toBeLessThan(report.indexOf('**iOS**'));
    expect(report).not.toContain('coverage');
  });

  it('leaves out the screenshots section when there is none', () => {
    expect(render([{ name: 'CI', runId: 1, jobs: [], artifacts: [] }])).not.toContain('Screenshots');
  });

  it('ignores artifacts whose name is not a screenshot name', () => {
    const report = render([
      { name: 'CI', runId: 1, jobs: [], artifacts: [artifact(1, 'web-x](https://evil.test).png')] },
    ]);
    expect(report).not.toContain('evil.test');
  });

  it('strips markdown from a job name so it cannot break the table', () => {
    const odd = { ...job('x', 'completed', 'success'), name: 'a | b [x](y)' };
    const report = render([{ name: 'CI', runId: 1, jobs: [odd], artifacts: [] }]);
    const row = report.split('\n').find((line) => line.includes('example.test'));
    expect(row.split('|')).toHaveLength(4);
    expect(row).toContain('[a   b  x  y](https://example.test/x)');
  });
});
