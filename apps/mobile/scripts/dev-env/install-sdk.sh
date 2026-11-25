#!/usr/bin/env bash
set -euo pipefail

sdk="${ANDROID_HOME:-$HOME/Android/Sdk}"
tools_zip="commandlinetools-linux-11076708_latest.zip"

case "$(uname -m)" in
  aarch64 | arm64) abi="arm64-v8a" ;;
  *) abi="x86_64" ;;
esac

mkdir -p "$sdk/cmdline-tools"
if [ ! -x "$sdk/cmdline-tools/latest/bin/sdkmanager" ]; then
  workdir="$(mktemp -d)"
  curl -fsSL -o "$workdir/tools.zip" "https://dl.google.com/android/repository/$tools_zip"
  unzip -q "$workdir/tools.zip" -d "$workdir"
  rm -rf "$sdk/cmdline-tools/latest"
  mv "$workdir/cmdline-tools" "$sdk/cmdline-tools/latest"
  rm -rf "$workdir"
fi

sdkmanager="$sdk/cmdline-tools/latest/bin/sdkmanager"
yes | "$sdkmanager" --sdk_root="$sdk" --licenses > /dev/null || true
"$sdkmanager" --sdk_root="$sdk" \
  "platform-tools" \
  "emulator" \
  "platforms;android-36" \
  "system-images;android-36;google_apis_playstore;$abi"

echo "Android SDK ready in $sdk"
echo "Add to your shell profile:"
echo "  export ANDROID_HOME=\"$sdk\""
echo "  export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator\""
