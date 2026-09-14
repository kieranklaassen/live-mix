#!/bin/bash
# Runs the complete CI equivalent locally, on the current checkout, and prints
# a Markdown summary suitable for a PR body. Used while GitHub Actions is
# unavailable (private-repo billing) and handy before pushing anyway.
#
# Mirrors .github/workflows/ci.yml: typecheck, lint, unit tests, build,
# pack:check, native C++ tests, Faust regeneration diffed against the committed
# sources (builds the pinned compiler into tmp/ on first run), emsdk rebuild
# diffed against the committed .wasm, and the github: install path (needs git
# access to the repo: a token via GITHUB_TOKEN/GH_TOKEN, or an ssh key).
#
# Usage: bash scripts/ci-local.sh [--skip-git-install]
set -uo pipefail
cd "$(dirname "$0")/.."

skip_git_install=0
for arg in "$@"; do
  [ "$arg" = "--skip-git-install" ] && skip_git_install=1
done

sha=$(git rev-parse --short HEAD)
branch=$(git rev-parse --abbrev-ref HEAD)
results=()
status=0

run_step() {
  local name="$1"
  shift
  local log
  log=$(mktemp)
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    results+=("| $name | pass | $((SECONDS - start))s |")
    echo "✓ $name"
  else
    results+=("| $name | **fail** | $((SECONDS - start))s |")
    status=1
    echo "✗ $name"
    tail -40 "$log" | sed 's/^/    /'
  fi
  rm -f "$log"
}

wasm_reproduce() {
  if ! command -v emcc >/dev/null 2>&1; then
    [ -f "$HOME/emsdk/emsdk_env.sh" ] && source "$HOME/emsdk/emsdk_env.sh" >/dev/null 2>&1
  fi
  command -v emcc >/dev/null 2>&1 || { echo "emcc not found"; return 1; }
  local out
  out=$(mktemp -d)
  bash scripts/build-wasm.sh "$out" || return 1
  local ok=0
  for committed in src/dsp/wasm/*.wasm; do
    local name
    name=$(basename "$committed")
    if [ ! -f "$out/$name" ]; then
      echo "$name committed but not produced"
      ok=1
    elif ! cmp -s "$committed" "$out/$name"; then
      echo "$name differs"
      sha256sum "$committed" "$out/$name"
      ok=1
    else
      echo "$name reproduces ($(sha256sum "$committed" | cut -c1-16))"
    fi
  done
  rm -rf "$out"
  return $ok
}

git_install() {
  local token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
  local consumer
  consumer=$(mktemp -d)
  local home
  home=$(mktemp -d)
  if [ -n "$token" ]; then
    HOME="$home" git config --global url."https://x-access-token:${token}@github.com/".insteadOf "https://github.com/"
    HOME="$home" git config --global --add url."https://x-access-token:${token}@github.com/".insteadOf "ssh://git@github.com/"
    HOME="$home" git config --global --add url."https://x-access-token:${token}@github.com/".insteadOf "git@github.com:"
  fi
  (
    cd "$consumer" &&
      npm init -y >/dev/null &&
      HOME="$home" npm install "github:kieranklaassen/live-mix#$(git -C "$OLDPWD" rev-parse HEAD)" &&
      test -f node_modules/@kieranklaassen/live-mix/dist/index.js &&
      for wasm in "$OLDPWD"/src/dsp/wasm/*.wasm; do test -f "node_modules/@kieranklaassen/live-mix/dist/wasm/$(basename "$wasm")" || exit 1; done &&
      for worklet in wasm-device ducker meter; do test -f "node_modules/@kieranklaassen/live-mix/dist/worklets/$worklet.js" || exit 1; done &&
      node --input-type=module -e "
        import { LIVE_MIX_VERSION } from '@kieranklaassen/live-mix'
        import { DATTORRO_PARAMS, ZITA_REV1_PARAMS, LIMITER_1176_PARAMS } from '@kieranklaassen/live-mix/dsp'
        import { MockAudioContext } from '@kieranklaassen/live-mix/testing'
        console.log('live-mix', LIVE_MIX_VERSION, DATTORRO_PARAMS.mix.id, ZITA_REV1_PARAMS.mix.id, LIMITER_1176_PARAMS.inputGain.id, new MockAudioContext().sampleRate)
      "
  )
  local rc=$?
  rm -rf "$consumer" "$home"
  return $rc
}

native_tests() {
  # On some machines `c++` is a clang without libstdc++ headers; prefer g++ then.
  if [ -z "${CXX:-}" ] && command -v g++ >/dev/null 2>&1; then
    CXX=g++ bash scripts/test-native.sh
  else
    bash scripts/test-native.sh
  fi
}

faust_reproduce() {
  if [ -z "${CXX:-}" ] && command -v g++ >/dev/null 2>&1; then
    CC=gcc CXX=g++ bash scripts/build-faust.sh || return 1
  else
    bash scripts/build-faust.sh || return 1
  fi
  if git diff --exit-code --stat -- cpp/faust/generated src/dsp/devices/faust; then
    echo "Faust output reproduces"
  else
    echo "cpp/faust/generated or src/dsp/devices/faust differ from what scripts/build-faust.sh produces"
    return 1
  fi
}

echo "live-mix local CI on $branch @ $sha"
run_step "pnpm install --frozen-lockfile" pnpm install --frozen-lockfile
run_step "pnpm typecheck" pnpm typecheck
run_step "pnpm lint" pnpm lint
run_step "pnpm test" pnpm test
run_step "pnpm build" pnpm build
run_step "pnpm pack:check" pnpm pack:check
run_step "native C++ tests" native_tests
run_step "faust reproduce (Faust 2.88.0)" faust_reproduce
run_step "wasm reproduce (emsdk)" wasm_reproduce
if [ "$skip_git_install" = 1 ]; then
  results+=("| github: install path | skipped | — |")
else
  run_step "github: install path" git_install
fi

echo
echo "### CI blocked (billing); local verification"
echo
echo "\`scripts/ci-local.sh\` on \`$branch\` @ \`$sha\` ($(date -u +%Y-%m-%dT%H:%MZ), node $(node --version), pnpm $(pnpm --version), emsdk $(emcc --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo n/a)):"
echo
echo "| Step | Result | Time |"
echo "|---|---|---|"
printf '%s\n' "${results[@]}"
echo
if [ $status -eq 0 ]; then echo "All steps passed."; else echo "**Some steps failed.**"; fi
exit $status
