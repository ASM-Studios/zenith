import { describe, expect, it } from 'vitest';
import { nextStatus } from './status.mjs';

describe('nextStatus', () => {
  it('moves an item forward', () => {
    expect(nextStatus('Backlog', 'Ready')).toBe('Ready');
    expect(nextStatus(null, 'In progress')).toBe('In progress');
  });

  it('never moves an item backward without force', () => {
    expect(nextStatus('In review', 'Ready')).toBeNull();
    expect(nextStatus('In progress', 'Ready')).toBeNull();
  });

  it('moves backward only when forced', () => {
    expect(nextStatus('In review', 'In progress', true)).toBe('In progress');
  });

  it('never moves a released or done item backward, even when forced', () => {
    expect(nextStatus('To release', 'In progress', true)).toBeNull();
    expect(nextStatus('Done', 'In review', true)).toBeNull();
  });

  it('moves a released item forward to Done', () => {
    expect(nextStatus('To release', 'Done')).toBe('Done');
  });

  it('does nothing when the status is already the target', () => {
    expect(nextStatus('Ready', 'Ready')).toBeNull();
  });

  it('rejects an unknown target status', () => {
    expect(() => nextStatus('Backlog', 'Blocked')).toThrow('Unknown status');
  });
});
