const headlessArgs = ['-no-window', '-no-audio', '-no-boot-anim', '-no-snapshot', '-gpu', 'swiftshader_indirect'];

export function emulatorArgs(avdName: string, headless: boolean): string[] {
  return headless ? ['-avd', avdName, ...headlessArgs] : ['-avd', avdName];
}
