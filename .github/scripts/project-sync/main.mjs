import { readFileSync } from 'node:fs';
import { createClient } from './github.mjs';
import { onAssigned, onBranchCreated, onPullRequest } from './handlers.mjs';

const { GITHUB_EVENT_NAME, GITHUB_EVENT_PATH, GITHUB_REPOSITORY, GH_TOKEN, PROJECT_TOKEN, PROJECT_NUMBER } =
  process.env;

const [owner, repo] = GITHUB_REPOSITORY.split('/');
const ctx = {
  owner,
  repo,
  projectNumber: Number(PROJECT_NUMBER),
  repoClient: createClient(GH_TOKEN),
  projectClient: PROJECT_TOKEN ? createClient(PROJECT_TOKEN) : null,
};
const event = JSON.parse(readFileSync(GITHUB_EVENT_PATH, 'utf8'));

const handlers = { issues: onAssigned, push: onBranchCreated, pull_request: onPullRequest };
await handlers[GITHUB_EVENT_NAME]?.(ctx, event);
