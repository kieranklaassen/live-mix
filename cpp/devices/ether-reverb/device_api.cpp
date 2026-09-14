// Flat C ABI (cpp/common/device_api.h) over the Ether reverb device for the
// WASM/AudioWorklet boundary. The single static instance is the only global.

#include "../../common/device_api.h"
#include "ether_reverb_device.h"

namespace {
livemix::EtherReverbDevice g_device;
}

extern "C" {

void device_init(float sample_rate, int /*max_block_frames*/) {
  g_device.init(sample_rate);
}

void device_set_param(int param_id, float value) {
  g_device.set_param(static_cast<livemix::EtherReverbParam>(param_id), value);
}

float* device_in_left(void) { return g_device.in_left(); }

float* device_in_right(void) { return g_device.in_right(); }

float* device_out_left(void) {
  return const_cast<float*>(g_device.out_left());
}

float* device_out_right(void) {
  return const_cast<float*>(g_device.out_right());
}

int device_max_block_frames(void) {
  return livemix::EtherReverbDevice::kMaxBlockFrames;
}

void device_process(int frames) { g_device.process(frames); }

}  // extern "C"
