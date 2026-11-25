export type AndroidAbi = 'x86_64' | 'arm64-v8a';

const androidApi = '36';
const imageFlavor = 'google_apis_playstore';

export function abiForArch(arch: string): AndroidAbi {
  return arch === 'arm64' || arch === 'aarch64' ? 'arm64-v8a' : 'x86_64';
}

export function systemImageFor(arch: string): string {
  return `system-images;android-${androidApi};${imageFlavor};${abiForArch(arch)}`;
}
