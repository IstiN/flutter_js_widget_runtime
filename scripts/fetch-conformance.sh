#!/usr/bin/env bash
# Fetch the pinned cross-repository inputs of conformance.lock (section 1.6 of the family plan).
# One line per source: <owner>/<repo>@<40-hex sha>:<space-separated path prefixes>
# An empty prefix list means the whole tree. JSR_CONFORMANCE_DIR overrides the target directory.
set -euo pipefail

lock="$(dirname "$0")/../conformance.lock"
dir="${JSR_CONFORMANCE_DIR:-.conformance}"

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in ''|'#'*) continue ;; esac
  spec="${line%%:*}"
  prefixes="${line#*:}"
  repo="${spec%%@*}"
  sha="${spec#*@}"
  name="${repo##*/}"
  dest="$dir/$name"
  if [ "$(git -C "$dest" rev-parse HEAD 2>/dev/null || true)" != "$sha" ]; then
    rm -rf "$dest"
    git init -q "$dest"
    git -C "$dest" remote add origin "https://github.com/$repo.git"
    git -C "$dest" fetch --depth 1 origin "$sha"
    if [ -n "$prefixes" ]; then
      git -C "$dest" sparse-checkout init --no-cone
      # shellcheck disable=SC2086
      git -C "$dest" sparse-checkout set $prefixes
    fi
    git -C "$dest" checkout --detach FETCH_HEAD
  fi
  actual="$(git -C "$dest" rev-parse HEAD)"
  if [ "$actual" != "$sha" ]; then
    echo "conformance: $repo pin mismatch: expected $sha, got $actual" >&2
    exit 1
  fi
  echo "conformance: $repo @ $sha"
done < "$lock"
