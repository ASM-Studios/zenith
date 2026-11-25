import { listAll } from './paginate.mjs';

export async function repostComment(client, { repo, pr, marker, body }) {
  const posted = await client.rest('POST', `/repos/${repo}/issues/${pr}/comments`, { body });
  const comments = await listAll(client, `/repos/${repo}/issues/${pr}/comments`);
  const stale = comments.filter(
    (comment) => comment.id < posted.id && comment.user?.type === 'Bot' && comment.body?.includes(marker),
  );
  await Promise.all(stale.map((comment) => client.rest('DELETE', `/repos/${repo}/issues/comments/${comment.id}`)));
  return { posted, deleted: stale.length };
}
