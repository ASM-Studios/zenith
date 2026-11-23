export function issueRefsFromBranch(name) {
  const found = /^(?:refs\/heads\/)?[a-z]{3}\/#(\d+)\//.exec(name ?? '');
  return found ? [Number(found[1])] : [];
}

export function refsFromText(text) {
  return [...(text ?? '').matchAll(/(?<![\w/])#(\d+)\b/g)].map((found) => Number(found[1]));
}

export function uniqueRefs(...lists) {
  return [...new Set(lists.flat())];
}
