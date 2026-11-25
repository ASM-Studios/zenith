const androidEmulatorHost = 'http://10.0.2.2:3000';
const sharedHost = 'http://localhost:3000';

export function defaultApiUrl(os: string): string {
  return os === 'android' ? androidEmulatorHost : sharedHost;
}
