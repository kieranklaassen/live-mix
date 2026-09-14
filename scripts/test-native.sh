#!/bin/bash
# Compiles and runs the native C++ device harnesses with the system compiler.
# No WASM or browser involved; this is the DSP parity gate for every device.
set -euo pipefail
cd "$(dirname "$0")/.."

out_dir="tmp/native-test"
mkdir -p "$out_dir"

CXX="${CXX:-c++}"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra \
  cpp/test/dattorro_test.cpp \
  cpp/devices/dattorro/dattorro_reverb.cpp \
  cpp/devices/dattorro/dattorro_device.cpp \
  -o "$out_dir/dattorro_test"

"$out_dir/dattorro_test"

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
  cpp/test/zita_rev1_test.cpp \
  -o "$out_dir/zita_rev1_test"

"$out_dir/zita_rev1_test"

"$CXX" -std=c++17 -O2 -fno-exceptions -fno-rtti -Wall -Wextra -Wno-unused-parameter \
  cpp/test/limiter_1176_test.cpp \
  -o "$out_dir/limiter_1176_test"

"$out_dir/limiter_1176_test"
