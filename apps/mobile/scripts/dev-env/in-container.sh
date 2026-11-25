#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../../../.." && pwd)"
node_version="v24.11.1"

. /etc/os-release

case "$ID" in
  ubuntu | debian)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl unzip xz-utils ca-certificates openjdk-17-jre-headless \
      libpulse0 libgl1 libnss3 libxcomposite1 libxdamage1 libxkbfile1 libxcursor1 libxi6 libasound2t64
    ;;
  fedora)
    dnf install -y -q unzip xz which java-21-openjdk-headless \
      pulseaudio-libs mesa-libGL nss libXcomposite libXdamage libxkbfile libXcursor libXi alsa-lib
    ;;
  *)
    echo "Unsupported distribution: $ID" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  aarch64 | arm64) node_arch="arm64" ;;
  *) node_arch="x64" ;;
esac
curl -fsSL "https://nodejs.org/dist/$node_version/node-$node_version-linux-$node_arch.tar.xz" | tar -xJ -C /opt
export PATH="/opt/node-$node_version-linux-$node_arch/bin:$PATH"

export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
bash "$here/install-sdk.sh"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"

cd "$repo"
node apps/mobile/scripts/emulator.ts --headless

if [[ -n "${SCREENSHOT:-}" ]]; then
  sleep 20
  adb exec-out screencap -p > "$SCREENSHOT"
fi
