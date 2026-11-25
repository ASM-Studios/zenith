const PAGE_SIZE = 100;

async function listComments(client, repo, pr, page = 1) {
  const batch = await client.rest('GET', `/repos/${repo}/issues/${pr}/comments?per_page=${PAGE_SIZE}&page=${page}`);
  if (batch.length < PAGE_SIZE) return batch;
  return [...batch, ...(await listComments(client, repo, pr, page + 1))];
}

export async function repostComment(client, { repo, pr, marker, body }) {
  const posted = await client.rest('POST', `/repos/${repo}/issues/${pr}/comments`, { body });
  const comments = await listComments(client, repo, pr);
  const stale = comments.filter(
    (comment) => comment.id < posted.id && comment.user?.type === 'Bot' && comment.body?.includes(marker),
  );
  await Promise.all(stale.map((comment) => client.rest('DELETE', `/repos/${repo}/issues/comments/${comment.id}`)));
  return { posted, deleted: stale.length };
}
