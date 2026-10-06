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

// Instruments add (optional exports; the host calls them when present):
//
//   void device_note_on(int note_id, float frequency, float gain);
//   void device_note_off(int note_id);
//
// Sample devices (granular synth, sampler) add a way for the host to hand
// them one sound. The host writes up to device_sample_capacity() frames per
// channel into device_sample_buffer() (channel 0 first, channel 1 starting
// capacity frames later), then calls device_sample_commit. All three run on
// the audio thread between device_process calls.
//
//   int device_sample_capacity(void);
//   float* device_sample_buffer(void);
//   void device_sample_commit(int frames, int channels, float sample_rate);
//
// Zone devices (a multi-sample instrument) add a way to hand them many
// sounds and the zones that map them to keys. All of it runs on the audio
// thread between device_process calls, one call per message from the host:
//
//   int    device_zone_capacity(void);        zones that fit
//   int    device_zone_pool_capacity(void);   floats of sample data that fit
//   void   device_zones_begin(void);          forget the instrument; what sounds fades
//   int    device_zone_sample(int frames, int channels, float sample_rate);
//                                             room for one sound: its index, or -1
//   float* device_zone_sample_buffer(int index);
//                                             where the host writes it: channel 0,
//                                             then channel 1 `frames` later
//   float* device_zone_fields(void);          kZoneFieldCount floats the host fills
//   int    device_zone_add(void);             a zone from those fields: its index, or -1
//
// A zone plays from the moment it is added, so an instrument can also grow
// one recorded note at a time. The fields, in order (frames are positions in
// the zone's sound; src/dsp/zones/zone-map.ts writes them):
//
//    0 sample index       7 gain, dB                14 loop crossfade, frames
//    1 root key           8 pan, -1..1              15 round-robin group (0 none)
//    2 tune, cents        9 start frame             16 position in the group, from 1
//    3 low key           10 end frame (0: the end)  17 positions in the group
//    4 high key          11 loop: 0 off, 1 on,      18 pitch tracking, 0..1
//    5 low velocity         2 while held            19 reserved (0)
//    6 high velocity     12 loop start frame
//                        13 loop end frame, exclusive (0: the end)

// Devices that report on their own work (a compressor's gain reduction) add
// one reading per entry of `meters` in their manifest. The host calls it
// between device_process calls, and only while a meter is being watched.
//
//   float device_meter(int index);

#ifdef __cplusplus
}
#endif
