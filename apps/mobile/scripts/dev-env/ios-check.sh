#!/usr/bin/env bash
set -euo pipefail

screenshot="${1:?usage: ios-check.sh <screenshot.png>}"
cd "$(dirname "$0")/../../../.."

log="$(mktemp)"
set -m
CI=1 npm run ios:simulator -w apps/mobile > >(tee "$log") 2>&1 &
pid=$!
trap 'kill -- -"$pid" 2>/dev/null || true' EXIT

fail() {
  echo "$1" >&2
  exit 1
}

deadline=$((SECONDS + 600))
until grep -q 'iOS Bundled' "$log"; do
  grep -q 'Bundling failed' "$log" && fail 'Expo could not bundle the app.'
  kill -0 "$pid" 2>/dev/null || fail 'npm run ios:simulator stopped before Expo opened the app.'
  ((SECONDS < deadline)) || fail 'Expo did not open the app in 10 minutes.'
  sleep 5
done

sleep 10
xcrun simctl io booted screenshot "$screenshot"
