#!/bin/bash
# Builds the committed WASM device artefacts from the C++ sources.
#
# Requires Emscripten (EMSDK_VERSION below; `brew install emscripten` or
# emsdk). Output has no JS glue: the worklet instantiates the raw module with
# an empty import object. Consumers never run this — the .wasm files are
# committed and CI verifies that rebuilding reproduces them byte for byte.
set -euo pipefail
cd "$(dirname "$0")/.."

# Keep in sync with .github/workflows/ci.yml (setup-emsdk version).
EMSDK_VERSION="4.0.15"

if ! command -v emcc >/dev/null 2>&1; then
  echo "emcc not found. Install Emscripten ${EMSDK_VERSION} (see README)." >&2
  exit 1
fi

out_dir="${1:-src/dsp/wasm}"
mkdir -p "$out_dir"

exports=(
  device_init
  device_set_param
  device_in_left
  device_in_right
  device_out_left
  device_out_right
  device_max_block_frames
  device_process
)
exported_functions=$(printf ",_%s" "${exports[@]}")
exported_functions=${exported_functions:1}

build_device() {
  local name="$1"
  shift
  emcc "$@" \
    -I cpp/common \
    -std=c++17 -O3 -fno-exceptions -fno-rtti --no-entry \
    -s "EXPORTED_FUNCTIONS=${exported_functions}" \
    -s INITIAL_MEMORY=4194304 \
    -s ALLOW_MEMORY_GROWTH=0 \
    -s STACK_SIZE=131072 \
    -o "$out_dir/$name.wasm"
  echo "Built $out_dir/$name.wasm ($(wc -c < "$out_dir/$name.wasm") bytes)"
}

build_device dattorro \
  cpp/devices/dattorro/dattorro_reverb.cpp \
  cpp/devices/dattorro/dattorro_device.cpp \
  cpp/devices/dattorro/device_api.cpp

build_device fdn-reverb \
  cpp/devices/fdn-reverb/fdn_reverb_device.cpp \
  cpp/devices/fdn-reverb/device_api.cpp

build_device stereo-widener \
  cpp/devices/stereo-widener/StereoWidener.cpp \
  cpp/devices/stereo-widener/stereo_widener_device.cpp \
  cpp/devices/stereo-widener/device_api.cpp

# Faust devices: the C++ under cpp/faust/generated is produced by
# scripts/build-faust.sh and committed; no Faust toolchain is needed here.
build_device zita-rev1 cpp/faust/zita-rev1.device.cpp
build_device limiter-1176 cpp/faust/limiter-1176.device.cpp
