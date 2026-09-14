// Flat C ABI (cpp/common/device_api.h) over the Felt piano for the
// WASM/AudioWorklet boundary, plus the two instrument entry points the worklet
// host calls for note events (src/dsp/abi.ts DeviceExports.device_note_on/off).
// The single static instance is the only global.

#include "../../common/device_api.h"
#include "felt_piano_device.h"

namespace {
livemix::FeltPianoDevice g_device;
}

extern "C" {

void device_init(float sample_rate, int /*max_block_frames*/) {
  g_device.init(sample_rate);
}

void device_set_param(int param_id, float value) {
  g_device.set_param(static_cast<livemix::FeltPianoParam>(param_id), value);
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
  return livemix::FeltPianoDevice::kMaxBlockFrames;
}

void device_process(int frames) { g_device.process(frames); }

void device_note_on(int note_id, float frequency, float gain) {
  g_device.note_on(note_id, frequency, gain);
}

void device_note_off(int note_id) { g_device.note_off(note_id); }

}  // extern "C"
