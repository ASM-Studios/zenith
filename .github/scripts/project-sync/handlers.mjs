import { issueRefsFromBranch, refsFromText, uniqueRefs } from './refs.mjs';
import { assignIfNone, copyLabels, moveIssue, syncMention } from './sync.mjs';

export async function onAssigned(ctx, event) {
  if (event.issue.pull_request) return;
  await moveIssue(ctx, event.issue.number, 'Ready');
}

export async function onBranchCreated(ctx, event) {
  if (!event.created) return;
  const sync = async (number) => {
    const synced = await syncMention(ctx, number, event.sender.login);
    if (synced && !synced.isPullRequest) await moveIssue(ctx, number, 'In progress');
  };
  await Promise.all(issueRefsFromBranch(event.ref).map(sync));
}

export async function onPullRequest(ctx, event) {
  const { pull_request: pr, action } = event;
  const refs = uniqueRefs(issueRefsFromBranch(pr.head.ref), refsFromText(pr.body)).filter((n) => n !== pr.number);
  const draft = pr.draft || action === 'converted_to_draft';
  const sync = async (number) => {
    const synced = await syncMention(ctx, number, pr.user.login);
    if (!synced) return;
    await assignIfNone(ctx, pr.number, synced.assignees);
    if (synced.isPullRequest) return;
    await copyLabels(ctx, synced.mentioned, pr.number);
    await moveIssue(ctx, number, draft ? 'In progress' : 'In review', action === 'converted_to_draft');
  };
  await Promise.all(refs.map(sync));
}
