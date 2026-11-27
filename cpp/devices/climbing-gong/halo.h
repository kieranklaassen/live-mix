#pragma once

// The metals that ring along: a small bank tuned to the low tones of the keys
// played last, rung by everything the Climbing Gong plays. It is heard and
// goes nowhere else, so it cannot feed itself.

#include "voice.h"

namespace livemix {

class ClimbingGongHalo {
 public:
  using Four = climbing_gong_voice::Four;
  static constexpr int kSlots = 8;  // keys it remembers

  void init(float sample_rate, int chunk) {
    for (Slot& slot : slots_) slot = Slot();
    rate_ = sample_rate;
    chunk_ = chunk;
    gain_ = gain_from_ = gain_step_ = 0.0f;
    on_ = alive_ = false;
  }

  // The first stroke after a silence: the bank is still and stands where the knob does.
  void restart(float amount) {
    gain_ = gain_from_ = gain_of(amount);
    gain_step_ = 0.0f;
    for (Slot& slot : slots_) {
      slot.re = slot.im = Four{};
      if (slot.next_hz > 0.0f) set(slot);
    }
  }

  // A key was played: the slot that was used longest ago is given to it.
  void tune(float frequency, int metal, uint32_t stamp) {
    Slot* choice = nullptr;
    for (Slot& slot : slots_) {
      const float hz = slot.next_hz > 0.0f ? slot.next_hz : slot.hz;
      const int of = slot.next_hz > 0.0f ? slot.next_metal : slot.metal;
      if (std::fabs(hz - frequency) < 0.001f * frequency && of == metal) {
        slot.stamp = stamp;
        return;
      }
      if (!choice || slot.stamp < choice->stamp) choice = &slot;
    }
    choice->stamp = stamp;
    choice->next_hz = frequency;
    choice->next_metal = metal;
  }

  bool on() const { return on_; }
  bool alive() const { return alive_; }

  // Once a tick. `keys` says whether any key still sounds.
  void control(float amount, float low_ring, bool keys) {
    using climbing_gong_voice::across;
    on_ = amount > 0.0f || alive_;
    if (!on_) {
      for (Slot& slot : slots_) {
        if (slot.next_hz > 0.0f) set(slot);
      }
      return;
    }
    gain_from_ = gain_;
    gain_ = gain_of(amount);
    gain_step_ = (gain_ - gain_from_) / static_cast<float>(chunk_);
    float total = 0.0f;
    const float ring = kit::clamp(low_ring * 0.5f, 1.2f, 16.0f);
    for (Slot& slot : slots_) {
      float power = across(slot.re * slot.re + slot.im * slot.im);
      if (slot.next_hz > 0.0f && power < 1.0e-14f) {
        set(slot);
        power = 0.0f;
      }
      if (power < 1.0e-18f) slot.re = slot.im = Four{};
      total += power;
      if (slot.hz <= 0.0f) continue;
      // Given to another key: out in a few milliseconds first.
      const float now = slot.next_hz > 0.0f ? -1.0f : ring;
      if (now != slot.ring) pace(slot, now);
    }
    alive_ = total > 1.0e-13f && amount > 0.0f;
    // Rung out with no key left: exactly nothing, so that sleep comes at the same sample whatever the block.
    if (!alive_ && (!keys || (amount <= 0.0f && gain_ <= 0.0f && gain_from_ <= 0.0f))) {
      for (Slot& slot : slots_) slot.re = slot.im = Four{};
    }
  }

  // `at` is where in the tick the stretch begins.
  void render(int n, int at, float* left, float* right, const float* bus) {
    for (int i = 0; i < n; ++i) {
      Four out_left = {}, out_right = {};
      for (Slot& slot : slots_) {
        if (slot.hz <= 0.0f) continue;
        const Four re = slot.step_re * slot.re - slot.step_im * slot.im;
        const Four im = slot.step_re * slot.im + slot.step_im * slot.re + slot.feed * bus[i];
        slot.re = re;
        slot.im = im;
        out_left += slot.left * im;
        out_right += slot.right * im;
      }
      const float gain = gain_from_ + gain_step_ * static_cast<float>(at + i + 1);
      left[i] += climbing_gong_voice::across(out_left) * gain;
      right[i] += climbing_gong_voice::across(out_right) * gain;
    }
  }

 private:
  struct Slot {
    alignas(16) Four re = {}, im = {}, step_re = {}, step_im = {}, feed = {}, left = {}, right = {};
    float hz = 0.0f, next_hz = 0.0f;
    float ring = 0.0f;  // what its steps were worked out for; below zero while it leaves
    int metal = 0, next_metal = 0;
    uint32_t stamp = 0;
  };

  static float gain_of(float amount) { return 0.9f * amount * (0.5f + 0.5f * amount); }

  void set(Slot& slot) {
    slot.hz = slot.next_hz;
    slot.metal = slot.next_metal;
    slot.next_hz = 0.0f;
    slot.ring = 0.0f;
    slot.re = slot.im = Four{};
    slot.left = Four{0.5f, 0.92f, 0.25f, 0.80f};
    slot.right = Four{0.86f, 0.25f, 0.92f, 0.30f};
  }

  // The key's own tone and three above it, each a little away, so that the bank moves against the keys.
  void pace(Slot& slot, float ring) {
    static const float kAway[4] = {0.07f, -0.11f, 0.15f, -0.19f};
    const climbing_gong_metal::Spec& spec = climbing_gong_metal::spec(slot.metal);
    const bool leaving = ring < 0.0f;
    slot.ring = ring;
    for (int lane = 0; lane < 4; ++lane) {
      const float ratio = lane == 0 ? 1.0f : spec.ratio[lane == 3 ? 4 : lane];
      const float hz = slot.hz * ratio + kAway[lane];
      const float seconds = leaving ? 0.02f : ring / (1.0f + 0.35f * static_cast<float>(lane));
      const float loss = 6.907755279f / (seconds * rate_);
      const float radius = std::exp(-loss);
      const float w = kit::kTwoPi * hz / rate_;
      const bool there = hz < kit::min(11000.0f, 0.45f * rate_);
      slot.step_re[lane] = there ? radius * std::cos(w) : 0.0f;
      slot.step_im[lane] = there ? radius * std::sin(w) : 0.0f;
      slot.feed[lane] = leaving ? 0.0f : kit::min(4.0f * loss, 9.0f / rate_);
    }
  }

  Slot slots_[kSlots];
  float rate_ = 48000.0f;
  int chunk_ = 32;
  float gain_ = 0.0f, gain_from_ = 0.0f, gain_step_ = 0.0f;
  bool on_ = false, alive_ = false;
};

}  // namespace livemix
