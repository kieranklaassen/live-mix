#pragma once

// The live-mix WASM device ABI. Every device module (Emscripten build of a
// C++ processor) exports exactly these symbols; the TypeScript host
// (src/dsp/worklets/wasm-device.processor.ts) is device-agnostic and drives
// any module that implements them. A native host (JUCE, AUv3) can implement
// the same contract against the same C++ source.
//
// Contract:
// - One static device instance per module; one WebAssembly.Instance per
//   AudioWorkletNode.
// - Memory is fixed-size (ALLOW_MEMORY_GROWTH=0) so heap views taken once
//   stay valid; device_process() never allocates.
// - The host writes up to device_max_block_frames() samples into the input
//   buffers before each device_process(frames) call and reads the output
//   buffers after it. Inputs are consumed once: the device clears them, so a
//   block with nothing written is silence rather than a repeat.
// - Parameter ids and ranges are documented per device in TypeScript next to
//   the device factory; values arrive unsmoothed and any smoothing is the
//   device's responsibility.

#ifdef __cplusplus
extern "C" {
#endif

void device_init(float sample_rate, int max_block_frames);
void device_set_param(int param_id, float value);
float* device_in_left(void);
float* device_in_right(void);
float* device_out_left(void);
float* device_out_right(void);
int device_max_block_frames(void);
void device_process(int frames);

#ifdef __cplusplus
}
#endif
