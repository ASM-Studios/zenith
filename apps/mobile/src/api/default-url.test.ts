import { describe, expect, it } from 'vitest';
import { defaultApiUrl } from './default-url.ts';

describe('defaultApiUrl', () => {
  it('reaches the host through the Android emulator alias', () => {
    expect(defaultApiUrl('android')).toBe('http://10.0.2.2:3000');
  });

  it('reaches the host on localhost from the iOS simulator, which shares its network', () => {
    expect(defaultApiUrl('ios')).toBe('http://localhost:3000');
  });
});
