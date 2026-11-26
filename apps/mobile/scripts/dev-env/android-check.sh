#!/usr/bin/env bash
set -euo pipefail

screenshot="${1:?usage: android-check.sh <screenshot.png>}"
source_dir="$(cd "$(dirname "$0")/../../../.." && pwd)"
repo="$(mktemp -d)"

tar -C "$source_dir" --exclude=node_modules --exclude=.git -cf - . | tar -C "$repo" -xf -
cd "$repo"
npm ci

log="$(mktemp)"
set -m
CI=1 node apps/mobile/scripts/emulator.ts --headless --expo > >(tee "$log") 2>&1 &
pid=$!
trap 'kill -- -"$pid" 2>/dev/null || true' EXIT

fail() {
  echo "$1" >&2
  exit 1
}

deadline=$((SECONDS + 900))
until grep -q 'Android Bundled' "$log"; do
  grep -q 'Bundling failed' "$log" && fail 'Expo could not bundle the app.'
  kill -0 "$pid" 2>/dev/null || fail 'The emulator script stopped before Expo opened the app.'
  ((SECONDS < deadline)) || fail 'Expo did not open the app in 15 minutes.'
  sleep 5
done

sleep 10
adb exec-out screencap -p > "$screenshot"
