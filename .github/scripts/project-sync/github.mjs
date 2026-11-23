const API = 'https://api.github.com';

export function createClient(token, fetchImpl = fetch) {
  async function request(url, method, body) {
    const response = await fetchImpl(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`${method} ${url}: ${response.status} ${await response.text()}`);
    return response.status === 204 ? undefined : response.json();
  }

  return {
    rest: (method, path, body) => request(`${API}${path}`, method, body),
    async graphql(query, variables) {
      const result = await request(`${API}/graphql`, 'POST', { query, variables });
      if (result.errors) throw new Error(JSON.stringify(result.errors));
      return result.data;
    },
  };
}
