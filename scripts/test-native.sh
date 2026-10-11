#!/bin/bash
# Compiles and runs the native C++ device harnesses with the system compiler.
# No WASM or browser involved; this is the DSP parity gate for every device.
set -euo pipefail
cd "$(dirname "$0")/.."

out_dir="tmp/native-test"
mkdir -p "$out_dir"

CXX="${CXX:-c++}"

# How many of the queued harnesses run at once (see the queue below): one a
# core, unless NATIVE_JOBS says. It is checked here, before anything is
# compiled: xargs takes 0 to mean all of them at once, which is over a
# hundred compilers side by side, and finds out that a value is not a number
# only when it gets there, after the first nine harnesses have run.
jobs="${NATIVE_JOBS:-$(getconf _NPROCESSORS_ONLN 2> /dev/null || echo 2)}"
case "$jobs" in
  '' | *[!0-9]* | 0*)
    echo "NATIVE_JOBS must be a whole number of 1 or more, not '$jobs'" >&2
    exit 2
    ;;
esac

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/plate_reverb_test.cpp \
  cpp/devices/plate-reverb/plate_reverb.cpp \
  cpp/devices/plate-reverb/plate_reverb_device.cpp \
  -o "$out_dir/plate_reverb_test"

"$out_dir/plate_reverb_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/fdn_reverb_test.cpp \
  cpp/devices/fdn-reverb/fdn_reverb_device.cpp \
  -o "$out_dir/fdn_reverb_test"

"$out_dir/fdn_reverb_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/stereo_widener_test.cpp \
  cpp/devices/stereo-widener/StereoWidener.cpp \
  cpp/devices/stereo-widener/stereo_widener_device.cpp \
  -o "$out_dir/stereo_widener_test"

"$out_dir/stereo_widener_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/true_peak_limiter_test.cpp \
  cpp/devices/true-peak-limiter/true_peak_limiter_device.cpp \
  -o "$out_dir/true_peak_limiter_test"

"$out_dir/true_peak_limiter_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/spectral_drifter_test.cpp \
  cpp/devices/spectral-drifter/SpectralDrifter.cpp \
  cpp/devices/spectral-drifter/spectral_drifter_device.cpp \
  -o "$out_dir/spectral_drifter_test"

"$out_dir/spectral_drifter_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/ether_reverb_test.cpp \
  cpp/devices/ether-reverb/ether_reverb_device.cpp \
  -o "$out_dir/ether_reverb_test"

"$out_dir/ether_reverb_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/felt_piano_test.cpp \
  cpp/devices/felt-piano/felt_piano_device.cpp \
  cpp/devices/felt-piano/SympatheticBank.cpp \
  cpp/devices/felt-piano/FeltReverb.cpp \
  cpp/devices/stereo-widener/StereoWidener.cpp \
  -o "$out_dir/felt_piano_test"

"$out_dir/felt_piano_test"

# Faust devices are header-only: the generated class plus the FaustDevice
# template. -Wno-unused-parameter covers Faust's empty classInit(sample_rate).
"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra -Wno-unused-parameter \
  cpp/test/hall_reverb_test.cpp \
  -o "$out_dir/hall_reverb_test"

"$out_dir/hall_reverb_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra -Wno-unused-parameter \
  cpp/test/fet_limiter_test.cpp \
  -o "$out_dir/fet_limiter_test"

"$out_dir/fet_limiter_test"

# native_test <name> <sources...>: compile one harness and run it. No harness
# depends on another, so each is queued here and they run several at a time
# below (NATIVE_JOBS, by default one a core): one after another they take the
# best part of an hour.
queue="$out_dir/queue.txt"
: > "$queue"
native_test() {
  echo "$*" >> "$queue"
}

# The shared DSP kit (cpp/kit) and the spec devices built on it. The device
# list is written by scripts/gen-devices.mjs from cpp/devices/*/device.json.
native_test kit_test cpp/test/kit_test.cpp
native_test stft_test cpp/test/stft_test.cpp

source scripts/devices.gen.sh
test_generated_devices

# One queued harness: what it prints is kept in a file of its own, so that the
# output of harnesses running side by side is not shuffled together.
run_native_test() {
  local name="$1"
  shift
  rm -f "$out_dir/$name.failed"
  if "$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra "$@" -o "$out_dir/$name" \
    > "$out_dir/$name.log" 2>&1 && "$out_dir/$name" >> "$out_dir/$name.log" 2>&1; then
    echo "ok     $name"
  else
    touch "$out_dir/$name.failed"
    echo "FAILED $name"
  fi
}
export -f run_native_test
export CXX out_dir

xargs -P "$jobs" -L 1 bash -c 'run_native_test "$@"' native-test < "$queue"

# Everything each harness said, in the order of the list; the failed ones come
# last, so that they are what the log ends on.
failed=0
while read -r name _; do
  [ -e "$out_dir/$name.failed" ] && continue
  echo "== $name"
  cat "$out_dir/$name.log"
done < "$queue"
while read -r name _; do
  [ -e "$out_dir/$name.failed" ] || continue
  failed=$((failed + 1))
  echo "== FAILED $name"
  cat "$out_dir/$name.log"
done < "$queue"
if [ "$failed" -ne 0 ]; then
  echo "native harnesses: $failed failed" >&2
  exit 1
fi
echo "native harnesses: $(wc -l < "$queue" | tr -d ' ') passed"
