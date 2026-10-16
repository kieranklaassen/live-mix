#!/bin/bash
# One lesson, checked alone: its own files and its page, and nothing of any other lesson. A
# lesson is done when this exits 0 (LESSONS.md). The steps, in order, stopping at the first
# that fails, one line each with its result and how long it took:
#
#   format    the lesson's own files, as the formatter wants them
#   lab       its lab, built (site/public/labs/<id>.wasm)
#   test      its lab test (tests/labs/<id>.test.ts)
#   tile      the level of its tile on the home map, on every loop the tile takes
#   build     a site that holds the home page and this lesson, in site/.lesson/<id>/
#   claims    every claim is held by a test; in a long lesson, with its number as written
#   wording   no name and no comparison, in its own files and its page
#   shape     a long lesson holds its packet
#   browser   its browser tests (tests/browser/lessons.spec.ts), on that build at its own port
#   map       its tile on the map of that build with scripts off: a link and a drawn picture
#
#   bash site/scripts/lesson.sh <id>
#
# Exits 0 when the lesson holds; 1 when a step failed; 2 when it could not start (no such
# lesson, the library or the bench not built); 3 when a step failed in a file that is not the
# lesson's own, which it names: run again later, and change nothing.
#
# SITE_SLOTS names a folder of locks that everyone working in one tree shares. With it a step
# waits its turn: the heavy ones (lab, test, browser) run one at a time, or as many at a time as
# SITE_HEAVY_SLOTS says, the others two at a time. The build runs one at a time whatever is
# said: two builds in one tree share what a build keeps of the lessons' text (site/.astro), and
# one of them would write the other's page. A lock is let go when its step ends, however it
# ends. Without it the steps run straight.
#
# Needs what scripts/check.sh needs, and the labs built once (pnpm labs) for the bench.
set -uo pipefail
cd "$(dirname "$0")/.."

id="${1:-}"
if [ -z "$id" ] || [ ! -f "src/content/lessons/$id.mdx" ]; then
  echo "usage: bash site/scripts/lesson.sh <id>     a lesson of site/src/content/lessons" >&2
  exit 2
fi
if [ ! -f ../dist/dsp/index.js ]; then
  echo "The library is not built: run 'pnpm install && pnpm build' in the repository's root." >&2
  exit 2
fi
if [ ! -f public/labs/bench.wasm ]; then
  echo "The bench is not built: run 'pnpm labs' in site/ once." >&2
  exit 2
fi

folder=".lesson/$id"
log="$(mktemp)"
trap 'rm -f "$log"' EXIT

# step <name> <heavy|light|build> <command...>: runs the command in a slot of its pool, says how it
# went, and ends the script when it failed.
step() {
  local name="$1" pool="$2"
  shift 2
  local slots="${SITE_HEAVY_SLOTS:-1}" slot lock queued=$SECONDS
  [ "$pool" = light ] && slots=2
  [ "$pool" = build ] && slots=1
  if [ -n "${SITE_SLOTS:-}" ]; then
    mkdir -p "$SITE_SLOTS"
    # The first lock of the pool that nobody holds; when all are held, look again in a second.
    while true; do
      for slot in $(seq 1 "$slots"); do
        exec {lock}>"$SITE_SLOTS/$pool.$slot.lock"
        flock -n "$lock" && break 2
        exec {lock}>&-
      done
      sleep 1
    done
  fi
  local began=$SECONDS from
  from="$(date +%T)"
  "$@" >"$log" 2>&1
  local code=$?
  [ -n "${SITE_SLOTS:-}" ] && exec {lock}>&-
  local line
  line="$(printf '%-8s %-7s %4s s   %s to %s' "$name" "$([ $code -eq 0 ] && echo ok || echo failed)" \
    "$((SECONDS - began))" "$from" "$(date +%T)")"
  [ "$began" -gt "$queued" ] && line="$line   after $((began - queued)) s in the queue"
  echo "$line"
  [ $code -eq 0 ] && return
  cat "$log" >&2
  local outside
  outside="$(node scripts/check-lessons.mjs --outside "$id" "$log")"
  if [ -n "$outside" ]; then
    printf '\n%s: "%s" failed in a file that is not this lesson'"'"'s own: %s\nRun again later, and change nothing.\n' \
      "$id" "$name" "$outside" >&2
    exit 3
  fi
  printf '\n%s does not hold: "%s" failed.\n' "$id" "$name" >&2
  exit 1
}

mapfile -t own < <(node scripts/check-lessons.mjs --packet "$id")

step format light pnpm exec prettier --check --ignore-unknown "${own[@]}"
step lab heavy bash scripts/build-labs.sh "$id"
step test heavy npx vitest run --no-file-parallelism "tests/labs/$id.test.ts"
# The level of its tile on the home map, on every loop the tile takes.
step tile heavy npx vitest run --no-file-parallelism tests/labs/tiles.test.ts -t "$id:"
# SITE_PORT is left to the lesson: the build is served at a port that only this lesson has.
step build build env -u SITE_PORT SITE_ONLY_LESSON="$id" pnpm exec astro build
step claims light node scripts/check-claims.mjs "$id"
step wording light node scripts/check-wording.mjs "$id" "$folder"
step shape light node scripts/check-lessons.mjs "$id" "$folder"
step browser heavy env -u SITE_PORT SITE_ONLY_LESSON="$id" LESSONS="$id" \
  pnpm exec playwright test tests/browser/lessons.spec.ts
# Its tile on the map, as the page is with scripts off: a link and a picture that is drawn.
step map light env -u SITE_PORT SITE_ONLY_LESSON="$id" \
  pnpm exec playwright test tests/browser/home.spec.ts -g 'scripts off\W+/ is the map'

printf '\n%s holds.\n' "$id"
