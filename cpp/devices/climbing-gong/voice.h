#pragma once

// One key of the Climbing Gong: its 36 modes, what drives them, and the loop
// that turns them every sample. What it is told to do is decided once a tick,
// in climbing_gong.h.

#include "../../kit/kit.h"
#include "metals.h"

namespace livemix {
namespace climbing_gong_voice {

// Four modes at once; plain arithmetic where the build has no vectors.
typedef float Four __attribute__((vector_size(16)));

constexpr int kTones = climbing_gong_metal::kTones;
constexpr int kGroundTones = climbing_gong_metal::kGroundTones;
constexpr int kModes = 2 * kTones;   // 36: a pair for each tone
constexpr int kGroups = kModes / 4;  // nine groups of four
constexpr int kRegisters = 4;        // the ground and three rungs
constexpr int kHolders = 16;
constexpr int kRegisterGroup[kRegisters + 1] = {0, 3, 5, 7, 9};
constexpr float kBowFeed = 0.02f;

inline float across(Four x) { return (x[0] + x[2]) + (x[1] + x[3]); }
inline float shaped(float x) { return kit::clamp(x, -2.6f, 2.6f); }

struct Voice {
  alignas(16) Four re[kGroups] = {}, im[kGroups] = {};
  alignas(16) Four step_re[kGroups] = {}, step_im[kGroups] = {};
  alignas(16) Four turn_re[kGroups] = {}, turn_im[kGroups] = {};
  alignas(16) Four natural[kGroups] = {};  // nepers a sample
  alignas(16) Four feed[kGroups] = {};     // how much of the register's drive a mode takes
  alignas(16) Four left[kGroups] = {}, right[kGroups] = {};
  alignas(16) Four left_step[kGroups] = {}, right_step[kGroups] = {};
  alignas(16) Four left_to[kGroups] = {}, right_to[kGroups] = {};
  alignas(16) Four push_re[kGroups] = {}, push_im[kGroups] = {};
  float hz[kModes] = {};      // at rest, with the split
  float edge[kModes] = {};
  float reach[kRegisters] = {};
  float weight[kModes] = {};  // how a rung's energy is shared inside it
  float share[kModes] = {};   // of the last stroke, for the bow
  float rms[kRegisters] = {};
  float target[kRegisters] = {};  // the law's level of each register
  float bare[kRegisters] = {};    // what the strokes themselves gave it
  float servo[kRegisters] = {};
  float drive_tone[kRegisters] = {}, drive_noise[kRegisters] = {};
  float tone_step[kRegisters] = {}, noise_step[kRegisters] = {};
  float norm[kRegisters] = {}, norm_step[kRegisters] = {};
  float sum[kRegisters] = {};     // last sample's, what the drives are made of
  float sweep[kRegisters] = {};   // the brush's noise into each register
  float sweep_level = 0.0f, sweep_from = 0.0f, sweep_step = 0.0f;
  float sweep_at = 0.0f, sweep_seconds = 0.0f;
  float rush = 0.0f, rush_step = 0.0f;
  kit::Svf rushing;
  float purse = 0.0f;             // energy the climb took and Fall back keeps
  float bow_level = 0.0f, bow_air = 0.0f, air_from = 0.0f, air_step = 0.0f;
  float cents = 0.0f, force = 0.0f;
  float frequency = 440.0f, gain = 0.0f, turned = 0.0f;
  float age = 0.0f, next_roll = 0.0f;
  int metal = 0, beater = 0;
  float shut = 0.0f;
  bool falling = false;
  bool lit = false, lively[kRegisters] = {};
  kit::Rng rng, hand;
  kit::Svf contact, air;
  float knock = 0.0f, knock_decay = 0.0f;
  int pulse_at = 0, pulse_length = 0;
  float queued = 0.0f;
  bool queued_roll = false;
  float follow = 0.0f, steal = 1.0f;
  float lift = 1.0f;
  float coming = 0.0f;            // what the ground will have once the stroke is in
  float pending_hz = 440.0f, pending_gain = 0.0f;
  int pending_metal = 0;
  uint32_t stamp = 0, tuned = 0, gained = 0;
  bool tuned_released = false, ramping = false;
  bool sounding = false, pending = false;
  int holders = 0;
  int ids[kHolders] = {};

  bool struck() const { return pulse_at < pulse_length; }
  bool released() const { return holders == 0; }
  void hold(int id) {
    drop(id);
    if (holders == kHolders) {
      for (int i = 1; i < kHolders; ++i) ids[i - 1] = ids[i];
      --holders;
    }
    ids[holders++] = id;
  }
  bool drop(int id) {
    for (int i = 0; i < holders; ++i) {
      if (ids[i] != id) continue;
      for (int j = i + 1; j < holders; ++j) ids[j - 1] = ids[j];
      --holders;
      return true;
    }
    return false;
  }

  template <bool kStruck>
  void run(int n, int groups, float* out_left, float* out_right) {
    const bool third = groups > kRegisterGroup[3], second = groups > kRegisterGroup[2], first = groups > kRegisterGroup[1];
    float now[kRegisters];
    for (int r = 0; r < kRegisters; ++r) now[r] = sum[r];
    const float share = kStruck ? 1.0f / static_cast<float>(pulse_length) : 0.0f;
    for (int i = 0; i < n; ++i) {
      const float x0 = shaped(now[0] * norm[0]), x1 = shaped(now[1] * norm[1]);
      const float x2 = shaped(now[2] * norm[2]);
      const float w = rng.bipolar();
      const float swept = sweep_level * w;
      const float breath = bow_air * w;
      float drive[kRegisters];
      drive[0] = swept * sweep[0] + breath * kBowFeed;
      // The products of what sounds below: pairs of tones of the register
      // under a rung, of it and the one under that, and of three.
      drive[1] = drive_tone[1] * x0 * (0.75f * x0 + 0.25f * x0 * x0) + (drive_noise[1] * w + swept * sweep[1]);
      drive[2] = drive_tone[2] * x1 * (0.55f * x0 + 0.35f * x1 + 0.15f * x0 * x1) + (drive_noise[2] * w + swept * sweep[2]);
      drive[3] = drive_tone[3] * x2 * (0.50f * x1 + 0.35f * x2 + 0.15f * x0 * x0) + (drive_noise[3] * w + swept * sweep[3]);
      for (int r = 1; r < kRegisters; ++r) {
        drive_tone[r] += tone_step[r];
        drive_noise[r] += noise_step[r];
      }
      for (int r = 0; r < kRegisters; ++r) norm[r] += norm_step[r];
      sweep_level += sweep_step;
      bow_air += air_step;
      float pulse = 0.0f;
      if (kStruck) {
        if (struck()) {
          pulse = share * (1.0f - kit::SineTable::cos_lookup((static_cast<float>(pulse_at) + 0.5f) * share));
          ++pulse_at;
        }
      }
      Four sums_left = {}, sums_right = {};
      const auto ring = [&](int from, int to, float push) {
        Four total = {};
        for (int g = from; g < to; ++g) {
          const Four a = step_re[g], b = step_im[g];
          const Four x = re[g], y = im[g];
          Four next_re = a * x - b * y;
          Four next_im = a * y + b * x + feed[g] * push;
          if (kStruck) {
            const Four p = push_re[g], q = push_im[g];
            const Four along = a * p - b * q, ahead = a * q + b * p;
            push_re[g] = along;
            push_im[g] = ahead;
            next_re += along * pulse;
            next_im += ahead * pulse;
          }
          re[g] = next_re;
          im[g] = next_im;
          total += next_im;
          sums_left += left[g] * next_im;
          sums_right += right[g] * next_im;
        }
        return across(total);
      };
      now[0] = ring(0, kRegisterGroup[1], drive[0]);
      if (first) now[1] = ring(kRegisterGroup[1], kRegisterGroup[2], drive[1]);
      if (second) now[2] = ring(kRegisterGroup[2], kRegisterGroup[3], drive[2]);
      if (third) now[3] = ring(kRegisterGroup[3], kRegisterGroup[4], drive[3]);
      float breeze = 0.0f, wide = 0.0f;
      if (bow_air > 0.0f || sweep_level > 0.0f) {
        breeze = air.bandpass(w * (bow_air + sweep_level * sweep[3] * 9.0f));
      }
      if (rush > 1.0e-7f) {
        rushing.process(w * rush);
        breeze += rushing.band;
        wide = rushing.low - rushing.band;
      }
      rush += rush_step;
      out_left[i] = across(sums_left) + breeze + 0.35f * wide;
      out_right[i] = across(sums_right) + breeze - 0.35f * wide;
      if (ramping) {
        for (int g = 0; g < groups; ++g) {
          left[g] += left_step[g];
          right[g] += right_step[g];
        }
      }
    }
    if (!first) now[1] = 0.0f;
    if (!second) now[2] = 0.0f;
    if (!third) now[3] = 0.0f;
    for (int r = 0; r < kRegisters; ++r) sum[r] = now[r];
  }
};

}  // namespace climbing_gong_voice
}  // namespace livemix
