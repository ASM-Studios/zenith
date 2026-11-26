const API = 'https://api.github.com';
const UPLOADS = 'https://uploads.github.com';

async function checked(response, label) {
  if (!response.ok) throw new Error(`${label}: ${response.status} ${await response.text()}`);
  return response;
}

export function createTransport(token, fetchImpl = fetch) {
  const headers = { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' };

  return {
    async download(repo, artifactId) {
      const url = `${API}/repos/${repo}/actions/artifacts/${artifactId}/zip`;
      const response = await checked(await fetchImpl(url, { headers }), `GET ${url}`);
      return Buffer.from(await response.arrayBuffer());
    },
    async upload(repo, releaseId, name, bytes) {
      const url = `${UPLOADS}/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`;
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'image/png' },
        body: bytes,
      });
      return (await checked(response, `POST ${url}`)).json();
    },
  };
}
