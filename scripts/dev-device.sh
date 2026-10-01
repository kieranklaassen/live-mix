#!/bin/bash
# The inner loop for one spec device (cpp/devices/<id>/device.json with a
# `params` array): regenerate its own files, compile and run its native
# harness, then build its .wasm into src/dsp/wasm. Touches nothing shared, so
# several devices can be in flight in one checkout; run
# `node scripts/gen-devices.mjs` once at the end to refresh the shared lists.
#
# Usage: bash scripts/dev-device.sh <id> [--native-only]
set -euo pipefail
cd "$(dirname "$0")/.."

id="${1:?usage: dev-device.sh <id> [--native-only]}"
mode="${2:-}"
node scripts/gen-devices.mjs --only "$id"
npx prettier --log-level warn --write "cpp/devices/$id/device.json"

manifest="cpp/devices/$id/device.json"
snake="${id//-/_}"
sources=$(node -e "const m=require('./$manifest');console.log((m.sources??[]).join(' '))")
memory_mb=$(node -e "const m=require('./$manifest');console.log(m.memoryMb??4)")
exports=$(node -e "
const m=require('./$manifest');
const e=[];
if(m.category==='instrument')e.push('_device_note_on','_device_note_off');
if(m.samples===true)e.push('_device_sample_capacity','_device_sample_buffer','_device_sample_commit');
console.log(e.length?','+e.join(','):'')")

out_dir="tmp/native-test"
mkdir -p "$out_dir"
CXX="${CXX:-c++}"
# shellcheck disable=SC2086
"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  "cpp/test/${snake}_test.cpp" $sources -o "$out_dir/${snake}_test"
"$out_dir/${snake}_test"

if [ "$mode" = "--native-only" ]; then exit 0; fi

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found: native harness passed, .wasm not built." >&2
  exit 1
fi
# Same flags as scripts/build-wasm.sh build_device.
# shellcheck disable=SC2086
emcc "cpp/devices/$id/device_api.gen.cpp" $sources \
  -I cpp/common \
  -std=c++17 -O3 -fno-exceptions -fno-rtti --no-entry \
  -s "EXPORTED_FUNCTIONS=_device_init,_device_set_param,_device_in_left,_device_in_right,_device_out_left,_device_out_right,_device_max_block_frames,_device_process${exports}" \
  -s "INITIAL_MEMORY=$((memory_mb * 1024 * 1024))" \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s STACK_SIZE=131072 \
  -o "src/dsp/wasm/$id.wasm"
echo "Built src/dsp/wasm/$id.wasm ($(wc -c < "src/dsp/wasm/$id.wasm") bytes)"
node scripts/smoke-wasm-device.mjs "$id"
