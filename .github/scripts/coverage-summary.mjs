import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const dir = process.argv[2] ?? 'coverage';
const summaryPath = `${dir}/coverage-summary.json`;
const finalPath = `${dir}/coverage-final.json`;
const metrics = ['statements', 'branches', 'functions', 'lines'];

function write(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  } else {
    process.stdout.write(markdown);
  }
}

function toRanges(lines) {
  const sorted = [...lines].toSorted((a, b) => a - b);
  const ranges = [];
  for (const line of sorted) {
    const last = ranges.at(-1);
    if (last && line <= last[1] + 1) {
      last[1] = line;
    } else {
      ranges.push([line, line]);
    }
  }
  return ranges;
}

function uncoveredLines(file) {
  const lines = new Set();
  for (const [id, count] of Object.entries(file.s)) {
    if (count === 0) {
      const { start, end } = file.statementMap[id];
      for (let line = start.line; line <= end.line; line++) lines.add(line);
    }
  }
  for (const [id, count] of Object.entries(file.f)) {
    if (count === 0) lines.add(file.fnMap[id].decl.start.line);
  }
  for (const [id, counts] of Object.entries(file.b)) {
    counts.forEach((count, index) => {
      if (count === 0) {
        const location = file.branchMap[id].locations[index] ?? file.branchMap[id].loc;
        lines.add(location.start.line);
      }
    });
  }
  return new Set([...lines].filter(Number.isInteger));
}

function blobUrl(path, [start, end]) {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY } = process.env;
  const sha = process.env.HEAD_SHA || process.env.GITHUB_SHA;
  if (!GITHUB_SERVER_URL || !GITHUB_REPOSITORY || !sha) return undefined;
  const anchor = start === end ? `L${start}` : `L${start}-L${end}`;
  return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/blob/${sha}/${path}#${anchor}`;
}

function formatRange(path, range) {
  const label = range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`;
  const url = blobUrl(path, range);
  return url ? `[${label}](${url})` : label;
}

if (!existsSync(summaryPath) || !existsSync(finalPath)) {
  write('## Coverage\n\nNo coverage report was generated.\n');
  process.exit(0);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const final = JSON.parse(readFileSync(finalPath, 'utf8'));

let markdown = '## Coverage\n\n| Metric | Covered | Total | % |\n| --- | ---: | ---: | ---: |\n';
for (const metric of metrics) {
  const { covered, total, pct } = summary.total[metric];
  markdown += `| ${metric} | ${covered} | ${total} | ${pct}% |\n`;
}

const rows = Object.values(final)
  .map((file) => {
    const path = relative(process.cwd(), file.path);
    const fileSummary = summary[file.path];
    return { path, pct: fileSummary?.lines.pct ?? 0, ranges: toRanges(uncoveredLines(file)) };
  })
  .filter((row) => row.ranges.length > 0)
  .toSorted((a, b) => a.pct - b.pct || a.path.localeCompare(b.path));

if (rows.length === 0) {
  markdown += '\nAll files are fully covered.\n';
} else {
  markdown += '\n### Uncovered code\n\n| File | Lines % | Uncovered lines |\n| --- | ---: | --- |\n';
  for (const row of rows) {
    const ranges = row.ranges.map((range) => formatRange(row.path, range)).join(', ');
    markdown += `| \`${row.path}\` | ${row.pct}% | ${ranges} |\n`;
  }
}

write(markdown);
