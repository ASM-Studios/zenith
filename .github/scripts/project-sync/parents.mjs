import { moveIssue } from './sync.mjs';

const PARENT_QUERY = `query($owner:String!,$repo:String!,$issue:Int!){repository(owner:$owner,name:$repo){issue(number:$issue){
  parent{number subIssuesSummary{total completed}}}}}`;

export function hasSubIssues(issue) {
  return (issue.sub_issues_summary?.total ?? 0) > 0;
}

export async function completeParent(ctx, number) {
  const { owner, repo } = ctx;
  const data = await ctx.repoClient.graphql(PARENT_QUERY, { owner, repo, issue: number });
  const parent = data.repository.issue.parent;
  if (!parent) return;
  const { total, completed } = parent.subIssuesSummary;
  if (completed < total) return;
  await moveIssue(ctx, parent.number, 'Done');
}
