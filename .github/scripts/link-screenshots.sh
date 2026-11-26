#!/usr/bin/env bash
set -euo pipefail

while (($# >= 2)); do
  name="$1"
  url="$2"
  shift 2
  if [[ -n "$url" ]]; then
    echo "$name: $url"
    echo "- [$name]($url)" >> "$GITHUB_STEP_SUMMARY"
  fi
done
