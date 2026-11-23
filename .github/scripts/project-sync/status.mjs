export const STATUSES = ['Backlog', 'Ready', 'In progress', 'In review', 'To release', 'Done'];

const RELEASED = STATUSES.indexOf('To release');

export function nextStatus(current, target, force = false) {
  const to = STATUSES.indexOf(target);
  if (to < 0) throw new Error(`Unknown status: ${target}`);
  const from = STATUSES.indexOf(current ?? '');
  if (from === to || from >= RELEASED) return null;
  return to > from || force ? target : null;
}
