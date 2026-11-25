export function withEmulatorLibraries(env: Record<string, string | undefined>): Record<string, string | undefined> {
  const sdk = env['ANDROID_HOME'];
  if (!sdk) {
    return env;
  }
  const own = `${sdk}/emulator/lib64`;
  const inherited = env['LD_LIBRARY_PATH'];
  return { ...env, LD_LIBRARY_PATH: inherited ? `${own}:${inherited}` : own };
}
