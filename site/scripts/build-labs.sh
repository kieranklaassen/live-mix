#!/bin/bash
# Builds the lesson labs: every site/labs/*.cpp becomes site/public/labs/<name>.wasm.
#
# A lab is the engine's own C++ (cpp/kit, cpp/devices) with a tap on every
# stage (site/labs/lab.h). The modules are built, never committed: a lesson
# always shows the engine as it is at this commit. The flags are the ones
# scripts/build-wasm.sh builds the library's devices with, plus
# -fno-access-control so a lab can read a device's state as it runs.
#
# A lab file may carry two directives in comments:
#   // lab-sources: cpp/devices/x/a.cpp cpp/devices/x/b.cpp   (more files to compile, from the repo root)
#   // lab-memory-mb: 128                                     (linear memory, default 64)
#   // lab-arena-mb: 96                                       (room for taps, default 40)
#
# Usage: bash site/scripts/build-labs.sh [name ...]   (no names: all labs)
set -euo pipefail
cd "$(dirname "$0")/../.."

# Keep in sync with scripts/build-wasm.sh and .github/workflows/site.yml.
EMSDK_VERSION="4.0.15"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found. Install Emscripten ${EMSDK_VERSION} (docs/site.md)." >&2
  exit 1
fi
if ! emcc --version | head -1 | grep -q "${EMSDK_VERSION}"; then
  echo "emcc is not ${EMSDK_VERSION}: $(emcc --version | head -1)" >&2
  exit 1
fi

out_dir="site/public/labs"
mkdir -p "$out_dir"

exports=(
  lab_init lab_sample_rate lab_max_frames lab_input lab_set lab_run
  lab_control_count lab_control_id lab_control_name lab_control_unit lab_control_choices
  lab_control_min lab_control_max lab_control_default lab_control_scale
  lab_tap_count lab_tap_id lab_tap_name lab_tap_unit lab_tap_kind lab_tap_origin lab_tap_channels
  lab_tap_data lab_tap_length lab_tap_x0 lab_tap_x1 lab_tap_columns lab_tap_scale
  lab_check_count lab_check_id lab_check_name lab_check_unit lab_check_value
  lab_spectrum lab_spectrum_bins
)
exported_functions=$(printf ",_%s" "${exports[@]}")
exported_functions=${exported_functions:1}

directive() {
  # directive <file> <name>: the words after "// <name>:" in the file, if any.
  sed -n "s|^// $2:[[:space:]]*||p" "$1" | tr '\n' ' '
}

build_lab() {
  local file="$1"
  local name
  name="$(basename "$file" .cpp)"
  local sources memory arena
  sources="$(directive "$file" lab-sources)"
  memory="$(directive "$file" lab-memory-mb)"
  arena="$(directive "$file" lab-arena-mb)"
  memory="${memory:-64}"
  arena="${arena:-40}"
  # shellcheck disable=SC2086
  emcc "$file" $sources \
    -I cpp/common \
    -std=c++17 -O3 -fno-exceptions -fno-rtti -fno-access-control --no-entry \
    -DLAB_ARENA_MB="$((arena))" \
    -s "EXPORTED_FUNCTIONS=${exported_functions}" \
    -s "INITIAL_MEMORY=$((memory * 1024 * 1024))" \
    -s ALLOW_MEMORY_GROWTH=0 \
    -s STACK_SIZE=262144 \
    -o "$out_dir/$name.wasm"
  echo "Built $out_dir/$name.wasm ($(wc -c < "$out_dir/$name.wasm") bytes)"
}

if [ "$#" -gt 0 ]; then
  for name in "$@"; do build_lab "site/labs/$name.cpp"; done
else
  pids=()
  for file in site/labs/*.cpp; do
    build_lab "$file" &
    pids+=("$!")
    # Four at a time: a lab takes a few seconds and the runners have four cores.
    if [ "${#pids[@]}" -ge 4 ]; then
      wait "${pids[0]}"
      pids=("${pids[@]:1}")
    fi
  done
  for pid in "${pids[@]}"; do wait "$pid"; done
fi
