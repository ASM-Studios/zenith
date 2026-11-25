import { describe, expect, it } from 'vitest';
import { abiForArch, systemImageFor } from './system-image.ts';

describe('abiForArch', () => {
  it('picks arm64-v8a on an ARM machine', () => {
    expect(abiForArch('arm64')).toBe('arm64-v8a');
    expect(abiForArch('aarch64')).toBe('arm64-v8a');
  });

  it('picks x86_64 on an Intel or AMD machine', () => {
    expect(abiForArch('x64')).toBe('x86_64');
    expect(abiForArch('x86_64')).toBe('x86_64');
  });
});

describe('systemImageFor', () => {
  it('names the Play Store image of the machine ABI', () => {
    expect(systemImageFor('arm64')).toBe('system-images;android-36;google_apis_playstore;arm64-v8a');
    expect(systemImageFor('x64')).toBe('system-images;android-36;google_apis_playstore;x86_64');
  });
});
