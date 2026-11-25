const selectXcode = 'sudo xcode-select -s /Applications/Xcode.app/Contents/Developer';
const installXcode = `Install Xcode from the App Store, then run: ${selectXcode}`;

export function iosHostProblem(platform: string): string | undefined {
  if (platform === 'darwin') {
    return undefined;
  }
  return 'The iOS simulator needs macOS and Xcode. On Linux, use npm run android:emulator.';
}

export function xcodeProblem(developerDir: string, hasSimctl: boolean): string | undefined {
  if (developerDir === '') {
    return `Xcode was not found. ${installXcode}`;
  }
  if (developerDir.includes('CommandLineTools')) {
    return `Only the Command Line Tools are selected. ${installXcode}`;
  }
  if (!hasSimctl) {
    return 'Xcode is not set up yet. Open it once or run: sudo xcodebuild -runFirstLaunch';
  }
  return undefined;
}
