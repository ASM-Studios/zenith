import { createClient } from '../project-sync/github.mjs';
import { collectWorkflows } from './collect.mjs';
import { repostComment } from './comments.mjs';
import { renderReport, reportMarker } from './render.mjs';

const { GITHUB_REPOSITORY: repo, GH_TOKEN, HEAD_SHA: sha, PR_NUMBER: pr } = process.env;

const client = createClient(GH_TOKEN);
const workflows = await collectWorkflows(client, { repo, sha });
const body = renderReport({ repo, sha, workflows });
const { deleted } = await repostComment(client, { repo, pr, marker: reportMarker, body });
process.stdout.write(`Posted the report and deleted ${deleted} earlier comment(s).\n`);
