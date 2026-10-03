// Flat C ABI (cpp/common/device_api.h) over the generated hall reverb DSP, the
// Faust counterpart of cpp/devices/plate-reverb/device_api.cpp. The single static
// instance is the only global.

#include "../common/device_api.h"
#include "common/faust_device.h"
#include "generated/hall-reverb.h"

namespace {
// The hold: Mix can be 0 over a ringing reverb, and then the output shows
// nothing of the tail, so the hold has to outlast the tail itself. 20 s is
// 150 dB at the longest decay there is (8 s).
livemix::faust::FaustDevice<livemix::faust::HallReverb, 20> g_device;
}

extern "C" {

void device_init(float sample_rate, int /*max_block_frames*/) {
  g_device.init(sample_rate);
}

void device_set_param(int param_id, float value) { g_device.set_param(param_id, value); }

float* device_in_left(void) { return g_device.in_left(); }

float* device_in_right(void) { return g_device.in_right(); }

float* device_out_left(void) { return const_cast<float*>(g_device.out_left()); }

float* device_out_right(void) { return const_cast<float*>(g_device.out_right()); }

int device_max_block_frames(void) { return g_device.kMaxBlockFrames; }

void device_process(int frames) { g_device.process(frames); }

}  // extern "C"
