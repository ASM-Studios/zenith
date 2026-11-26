const PAGE_SIZE = 100;

export async function listAll(client, path, page = 1) {
  const separator = path.includes('?') ? '&' : '?';
  const batch = await client.rest('GET', `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`);
  if (batch.length < PAGE_SIZE) return batch;
  return [...batch, ...(await listAll(client, path, page + 1))];
}
