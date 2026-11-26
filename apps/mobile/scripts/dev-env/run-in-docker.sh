#!/usr/bin/env bash
set -euo pipefail

image="${1:?usage: run-in-docker.sh <image> [screenshot.png], e.g. ubuntu:24.04 or fedora:42}"
screenshot="${2:-}"
repo="$(cd "$(dirname "$0")/../../../.." && pwd)"

options=()
if [[ -n "$screenshot" ]]; then
  mkdir -p "$(dirname "$screenshot")"
  options=(-v "$(cd "$(dirname "$screenshot")" && pwd):/screenshots" -e "SCREENSHOT=/screenshots/$(basename "$screenshot")")
fi

exec docker run --rm --device /dev/kvm -v "$repo:/work:ro" "${options[@]}" -w /work "$image" \
  bash apps/mobile/scripts/dev-env/in-container.sh
