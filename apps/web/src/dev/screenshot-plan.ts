export interface ScreenshotTarget {
  path: string;
  file: string;
}

export function screenshotFile(screen: string): string {
  return `web-${screen}.png`;
}

export const screenshotTargets: ScreenshotTarget[] = [
  { path: '/en', file: screenshotFile('home') },
  { path: '/fr', file: screenshotFile('home-fr') },
  { path: '/en/unknown', file: screenshotFile('not-found') },
];
