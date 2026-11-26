const webProtocols = new Set(['http:', 'https:']);

export function webVerificationLink(apiLink: string): string {
  const link = new URL(apiLink);
  const token = link.searchParams.get('token');
  const callback = link.searchParams.get('callbackURL');
  if (!token || !callback || !URL.canParse(callback)) {
    return apiLink;
  }
  const page = new URL(callback);
  if (!webProtocols.has(page.protocol)) {
    return apiLink;
  }
  page.searchParams.set('token', token);
  return page.toString();
}
