#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>

#include "GhostPool.h"
#include "HammerExciter.h"
#include "ModalBank.h"
#include "ModeTable.h"
#include "VelvetNoise.h"

namespace livemix {

// kkfonie Felt's FeltVoice (Felt/Source/FeltVoice.{h,cpp} at 0c4ae88) made
// JUCE-free. The physics (ModalBank, ModeTable, HammerExciter, VelvetBurst,
// GhostPool) is the unchanged Felt source next to this file; this class is
// the voice logic with juce::SynthesiserVoice's bookkeeping inlined:
// currentlyPlayingNote (-1 = free), keyIsDown, sustainPedalDown,
// sostenutoPedalDown and the sample rate, which FeltSynth drives exactly as
// juce::Synthesiser does. Deviations: juce::AudioBuffer -> two float
// pointers, juce::jmin/jmax -> std::min/max, MathConstants::halfPi -> kHalfPi,
// plus `note_id` so the device can release a note by the host's id.
class FeltVoice {
 public:
  static constexpr int kMaxChunk = 2048;
  static constexpr float kHalfPi = 1.57079632679489661923f;

  // --- juce::SynthesiserVoice bookkeeping ---
  void set_sample_rate(double sample_rate) { current_sample_rate_ = sample_rate; }
  double sample_rate() const { return current_sample_rate_; }
  bool is_voice_active() const { return currently_playing_note_ >= 0; }
  int currently_playing_note() const { return currently_playing_note_; }
  int note_id() const { return note_id_; }
  bool is_key_down() const { return key_is_down_; }
  void set_key_down(bool down) { key_is_down_ = down; }
  bool is_sustain_pedal_down() const { return sustain_pedal_down_; }
  void set_sustain_pedal_down(bool down) { sustain_pedal_down_ = down; }
  bool is_sostenuto_pedal_down() const { return sostenuto_pedal_down_; }
  void set_sostenuto_pedal_down(bool down) { sostenuto_pedal_down_ = down; }
  void clear_current_note() {
    currently_playing_note_ = -1;
    note_id_ = -1;
  }
  // juce::Synthesiser::startVoice's assignments before startNote().
  void begin(int note_id, int midi_note, bool sustain_pedal_down) {
    note_id_ = note_id;
    currently_playing_note_ = midi_note;
    key_is_down_ = true;
    sostenuto_pedal_down_ = false;
    sustain_pedal_down_ = sustain_pedal_down;
  }

  // --- FeltVoice ---
  void prepare_to_play(double sample_rate) {
    current_sample_rate_ = sample_rate;
    exciter.prepare(sample_rate);
    thump.prepare(sample_rate);
    action.prepare(sample_rate);
    splash.prepare(sample_rate);
    bank.reset();
    released = false;
    elapsedSamples = 0;
    quietBlocks = 0;
    blockPeak = 0.0f;
    clear_current_note();
    key_is_down_ = false;
    sustain_pedal_down_ = false;
    sostenuto_pedal_down_ = false;
  }

  void start_note(int midiNoteNumber, float velocity) {
    const double fs = current_sample_rate_;

    // Deterministic per-note noise variation.
    const auto noteSeed = static_cast<uint32_t>(midiNoteNumber * 2654435761u + 17u);
    exciter.seed(noteSeed);
    thump.seed(noteSeed ^ 0x5bd1e995u);
    action.seed(noteSeed ^ 0x27d4eb2fu);
    splash.seed(noteSeed ^ 0x9e3779b9u);

    ModeTable::buildNote(bank, midiNoteNumber, character, fs);
    exciter.trigger(midiNoteNumber, velocity, character.felt, character.hardness, character.softPedal);

    // Hammer thump: low bandpassed velvet, more prominent with felt engaged.
    const float thumpAmp = thumpLevel * velocity * (0.5f + 0.8f * character.felt) * 0.6f;
    thump.trigger(22.0f + 18.0f * character.felt, 1800.0f, thumpAmp, 80.0f, 400.0f);

    // Strike splash: the broadband hammer/soundboard impact (see Felt's
    // FeltVoice.cpp:42-58 for the calibration notes).
    const float splashAmp = thumpLevel * std::pow(velocity, 1.4f) * 1.0f;
    const float splashTop = (1400.0f + 1800.0f * velocity) * (1.0f - 0.5f * character.felt);
    splash.trigger(42.0f + 25.0f * character.felt, 16000.0f, splashAmp, 110.0f, splashTop, 500.0f);

    // Key action tick: faint, wider band.
    action.trigger(6.0f, 3000.0f, actionLevel * (0.4f + 0.6f * velocity) * 0.05f, 700.0f, 6000.0f);

    // Tone bloom time constant: ~26 ms in the bass to ~8 ms in the treble.
    const float bloomTauMs = 8.0f + 18.0f * (1.0f - static_cast<float>(midiNoteNumber - 21) / 87.0f);
    bloomCoeff = 1.0f - std::exp(-1000.0f / (bloomTauMs * static_cast<float>(fs)) * 1.0f);
    bloomState = 0.0f;

    // Key-tracked equal-power pan, bass left, gentle spread.
    float pos = (static_cast<float>(midiNoteNumber - 21) / 87.0f - 0.5f) * 0.7f + 0.5f;
    pos = pos < 0.0f ? 0.0f : (pos > 1.0f ? 1.0f : pos);
    gainL = std::cos(pos * kHalfPi);
    gainR = std::sin(pos * kHalfPi);

    released = false;
    elapsedSamples = 0;
    quietBlocks = 0;
    blockPeak = 1.0f;  // don't early-kill before the attack renders
  }

  void stop_note(float /*velocity*/, bool allowTailOff) {
    if (allowTailOff) {
      // Damper falls (rate governed in render). Idempotent.
      if (!released) {
        released = true;
        // Damper felt thud: short lowpass burst scaled by how loud the
        // string still rings.
        const float thud = actionLevel * std::min(1.0f, blockPeak * 6.0f) * 0.12f;
        action.trigger(12.0f, 3000.0f, thud, 60.0f, 750.0f);
      }
    } else {
      // Hard stop (steal): swap the ringing state into the shared ghost pool
      // so the tail fades smoothly while this voice restarts immediately.
      if (is_voice_active() && ghostPool != nullptr && blockPeak > 1.0e-5f) {
        ghostPool->capture(bank, gainL, gainR);
      }
      kill_voice();
    }
  }

  // Adds this voice's stereo output to outL/outR (numSamples each).
  void render(float* outL, float* outR, int numSamples) {
    if (!is_voice_active()) return;

    const float fs = static_cast<float>(current_sample_rate_);

    // Damping radius scale for this block (FeltVoice.cpp:122-144).
    float dampScale = 1.0f;
    const bool sustained = is_sustain_pedal_down() || is_sostenuto_pedal_down();
    if (released && !sustained) {
      const float pedalFactor = std::max(0.0f, 1.0f - cc64 * 2.0f);
      if (pedalFactor > 0.0f) {
        const float tDamp = 0.6f - 0.56f * damperSpeed;  // seconds to -60 dB
        dampScale = FeltMath::fastExpNegSmall(6.907755f / (tDamp * fs) * pedalFactor);
      }
    }

    float peak = 0.0f;
    int pos = 0;
    int left = numSamples;

    while (left > 0) {
      const int chunk = left < kMaxChunk ? left : kMaxChunk;
      std::memset(bufA, 0, sizeof(float) * static_cast<size_t>(chunk));
      std::memset(bufB, 0, sizeof(float) * static_cast<size_t>(chunk));

      // Feed the hammer burst while it lasts, then run the lean loop.
      int burstCount = 0;
      const float* burst = exciter.nextChunk(chunk, burstCount);
      if (burst != nullptr && burstCount > 0) {
        bank.process(bufA, bufB, burst, burstCount, dampScale);
        if (burstCount < chunk) {
          bank.process(bufA + burstCount, bufB + burstCount, nullptr, chunk - burstCount, dampScale);
        }
      } else {
        bank.process(bufA, bufB, nullptr, chunk, dampScale);
      }

      // Mix: bloomed tone + odd/even spread, instantaneous mechanical noise,
      // equal-power pan.
      for (int s = 0; s < chunk; ++s) {
        const float e = bufA[s];
        const float o = bufB[s];
        bloomState += bloomCoeff * (1.0f - bloomState);
        const float noise = thump.process() + action.process() + splash.process();
        const float mono = ((e + o) * bloomState + noise) * kVoiceLevel;
        const float side = (e - o) * kEvenOddSpread * bloomState * kVoiceLevel;
        const float l = (mono + side) * gainL;
        const float r = (mono - side) * gainR;
        outL[pos + s] += l;
        outR[pos + s] += r;
        const float a = std::fabs(mono);
        peak = a > peak ? a : peak;
      }

      pos += chunk;
      left -= chunk;
      elapsedSamples += chunk;
    }

    blockPeak = peak;
    bank.shrinkExpired(elapsedSamples);
    flush_decayed_state();

    // Early kill: below -72 dB for 3 consecutive blocks with no excitation
    // pending.
    if (peak < 2.5e-4f && !exciter.isActive() && !thump.isActive() && !splash.isActive()) {
      if (++quietBlocks >= 3) kill_voice();
    } else {
      quietBlocks = 0;
    }
  }

  // live-mix addition. Felt runs under juce::ScopedNoDenormals (hardware
  // flush-to-zero); WASM has none, and on x86 a denormal operand costs ~100x.
  // Prompt-string and high-partial resonators decay far below audibility
  // while their strip stays active (the strip's slow string keeps it alive),
  // so once per block any mode whose state is under 1e-18 (-360 dBFS) is
  // snapped to zero, and a velvet burst whose filters have rung out below
  // isActive()'s 1e-7 is reset so its one-poles stop iterating. Measured
  // natively without FTZ: 186 % -> ~6 % of real time for a six-note chord.
  void flush_decayed_state() {
    constexpr float kFloor = 1.0e-18f;
    for (int m = 0; m < bank.activeModes; ++m) {
      if (std::fabs(bank.sRe[m]) < kFloor && std::fabs(bank.sIm[m]) < kFloor) {
        bank.sRe[m] = 0.0f;
        bank.sIm[m] = 0.0f;
      }
    }
    if (!thump.isActive()) thump.prepare(current_sample_rate_);
    if (!action.isActive()) action.prepare(current_sample_rate_);
    if (!splash.isActive()) splash.prepare(current_sample_rate_);
  }

  // --- pushed from the device at control rate ---
  void set_character(const ModeTable::CharacterParams& p) { character = p; }
  void set_noise_levels(float thumpLvl, float actionLvl) {
    thumpLevel = thumpLvl;
    actionLevel = actionLvl;
  }
  // cc64 normalised 0..1 (continuous, for half-pedal); damperSpeed 0..1.
  void set_damper(float cc64Norm, float damperSpeedNorm) {
    cc64 = cc64Norm;
    damperSpeed = damperSpeedNorm;
  }
  void set_ghost_pool(GhostPool* pool) { ghostPool = pool; }

  // --- for the steal policy and diagnostics ---
  float block_energy() const { return blockPeak; }
  bool is_tail_voice() const { return !is_key_down() && !is_sostenuto_pedal_down(); }
  bool is_released() const { return released; }
  int active_modes() const { return bank.activeModes; }

 private:
  void kill_voice() {
    bank.reset();
    released = false;
    quietBlocks = 0;
    blockPeak = 0.0f;
    clear_current_note();
  }

  int currently_playing_note_ = -1;
  int note_id_ = -1;
  bool key_is_down_ = false;
  bool sustain_pedal_down_ = false;
  bool sostenuto_pedal_down_ = false;
  double current_sample_rate_ = 48000.0;

  ModalBank bank;
  HammerExciter exciter;
  VelvetBurst thump, action, splash;
  GhostPool* ghostPool = nullptr;

  float bloomState = 1.0f;
  float bloomCoeff = 1.0f;

  ModeTable::CharacterParams character;
  float thumpLevel = 0.5f, actionLevel = 0.4f;
  float cc64 = 0.0f, damperSpeed = 0.5f;

  float gainL = 0.7f, gainR = 0.7f;
  static constexpr float kEvenOddSpread = 0.15f;  // odd/even mode L/R weighting
  static constexpr float kVoiceLevel = 0.5f;      // -6 dB: keep the bus out of the limiter

  bool released = false;
  int elapsedSamples = 0;
  int quietBlocks = 0;
  float blockPeak = 0.0f;

  alignas(64) float bufA[kMaxChunk] = {};
  alignas(64) float bufB[kMaxChunk] = {};
};

}  // namespace livemix
