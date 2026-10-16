#!/bin/bash
# Everything the site is held to, in the order the Site workflow runs it. Stops at the first
# step that fails.
#
#   bash site/scripts/check.sh            the whole run, for the address in SITE_URL and SITE_BASE
#   bash site/scripts/check.sh --root     then once more, built as for a domain's root (SITE_BASE=/)
#
# Needs the repository's own packages and build (pnpm install && pnpm build in the root: the
# device benches run the library as it is published from there), the site's packages (pnpm
# install here) and Emscripten at the version scripts/build-labs.sh names.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n== %s\n' "$1"; }

if [ ! -f ../dist/dsp/index.js ]; then
  echo "The library is not built: run 'pnpm install && pnpm build' in the repository's root." >&2
  exit 1
fi

step "Labs: the engine's C++ with a tap on every stage"
pnpm labs

step "Format"
pnpm format:check

step "Types"
pnpm typecheck

step "Unit tests and lab tests"
pnpm test

step "Wording"
node scripts/check-wording.mjs

step "Build: pages, API reference, search"
pnpm build

step "Every claim is held by a test"
node scripts/check-claims.mjs

step "Wording, with the pages as built"
node scripts/check-wording.mjs

step "Links"
node scripts/check-links.mjs

step "Browser tests, on the site as built"
pnpm test:browser

if [ "${1:-}" = "--root" ]; then
  step "Once more, built for a domain's root"
  out="$(mktemp -d)"
  trap 'rm -rf "$out"' EXIT
  SITE_BASE=/ SITE_URL="${SITE_ROOT_URL:-https://example.org}" pnpm exec astro build --outDir "$out"
  # The API reference is TypeDoc's, written once above: copied in, not written again.
  SITE_API_REUSE=1 node scripts/build-api.mjs "$out"
  SITE_BASE=/ node scripts/check-links.mjs "$out"
  if grep -rl --include='*.html' 'href="/live-mix/' "$out" | head -1 | grep -q .; then
    echo "A page built for a domain's root still links under /live-mix/." >&2
    exit 1
  fi
  echo "Built for a domain's root: no link names /live-mix/."
fi

printf '\nThe site holds.\n'
