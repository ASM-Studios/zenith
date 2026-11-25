#!/usr/bin/env bash
set -euo pipefail

image="${1:?usage: run-in-docker.sh <image>, e.g. ubuntu:24.04 or fedora:42}"
repo="$(cd "$(dirname "$0")/../../../.." && pwd)"

exec docker run --rm --device /dev/kvm -v "$repo:/work:ro" -w /work "$image" \
  bash apps/mobile/scripts/dev-env/in-container.sh
