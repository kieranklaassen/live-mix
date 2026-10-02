#pragma once

// Pitch Shifter: two shifted voices reading one ring of recent input.
//
//   in ─(+)─► band limit ─► ring ─┬─► voice A ─► tone ─┬─► place ─┐
//        ▲                        └─► voice B ─► tone ─┼─► place ─┴─► wet
//        │                                             │
//        └── limit ◄─ Feedback ◄─ 35 Hz low cut ◄──────┘  (A + B, before placing)
//
// - A voice is a few read heads moving along the ring at the pitch ratio
//   (ShiftVoice.h): spliced where the waveform lines up (Smooth), rebuilt
//   from overlapping grains (Grain) or crossfaded blindly (Vintage).
// - Delay is not a second line: the heads simply read that much further
//   back, and it glides when moved. Feedback goes back into the ring, so
//   every pass is shifted again and the repeats climb or fall by the
//   interval; a low cut and the Tone filter are what they leave through.
// - What is recorded is band-limited to what the fastest voice can read
//   without aliasing.
// - Pitch glides (12 ms) and the heads follow it sample by sample, so a
//   sweep bends instead of stepping. Size and Jitter are read as each head
//   starts.
// - Spread places A to the left and B to the right by the level of B, so a
//   single voice stays in the middle; a voice keeps the stereo of its input
//   where it is not moved aside. In Grain it is also how far Jitter throws
//   each grain to either side of its voice.

#include "../../kit/kit.h"
#include "ChordEngine.h"
#include "ShiftVoice.h"
#include "params.gen.h"

namespace livemix {

class PitchShifter : public kit::DeviceBase<pitch_shifter::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace pitch_shifter;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    chords_.init(sr);
    chords_on_ = false;
    voices_on_ = true;
    voice_mode_ = pitch_shifter_dsp::kSmooth;
    blend_ = 0.0f;
    blend_step_ = 1.0f / (kBlendSeconds * sr);
    wait_ = 0;
    for (int v = 0; v < 2; ++v) {
      voice_[v].reset(v == 0 ? 0x3C6EF372u : 0xA54FF53Au, sr);
      pitch_[v].set_time(kGlideSeconds, sr);
      for (int c = 0; c < 2; ++c) {
        tone_[v][c].reset();
        guard_[v][c].reset();
      }
      mid_left_[v].set_time(kSmoothingSeconds, sr);
      mid_right_[v].set_time(kSmoothingSeconds, sr);
      side_[v].set_time(kSmoothingSeconds, sr);
      rumble_[v].reset();
      rumble_[v].set_cutoff(35.0f, sr);
    }
    level_b_.set_time(kSmoothingSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    base_.set_time(kDelayLagSeconds, sr);
    tone_hz_.set_time(kSmoothingSeconds, sr / kControlPeriod);
    guard_hz_.set_time(0.02f, sr / kControlPeriod);
    settle_ = true;
    clock_.reset(kControlPeriod);
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    guard_seen_ = -1.0f;
    b_active_ = false;
    loop_trim_ = 1.0f;
    // The longest silent gap: Delay, plus a head two octaves up at the
    // longest Size with full Jitter.
    idle_.reset(sr, 3.0f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    for (int v = 0; v < 2; ++v) {
      ratio_[v] = kit::semitones_to_ratio(pitch_[v].value);
      ratio_step_[v] = 0.0f;
    }
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace pitch_shifter;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const double longest = static_cast<double>(kParamMax[kDelay]) * 0.001 * sample_rate();
    float loudest = 0.0f;  // of the voices, heard or not: the loop runs on at Mix 0
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      pitch_[0].next();
      pitch_[1].next();
      if (clock_.tick()) control();
      double base = static_cast<double>(base_.next());
      if (base > longest) base = longest;

      // Each voice as mid and side, toned, then placed.
      float wet[2] = {0.0f, 0.0f};
      float back[2] = {0.0f, 0.0f};
      const float level_b = level_b_.next();
      ratio_[0] += ratio_step_[0];
      ratio_[1] += ratio_step_[1];
      float chord[2][2];
      if (chords_on_) {
        chords_.render(ring_, base, ratio_, b_active_, chord);
        if (voices_on_) cross();
      }
      for (int v = 0; v < (b_active_ ? 2 : 1); ++v) {
        float left = 0.0f, right = 0.0f;
        if (voices_on_) voice_[v].render(ring_, setup_[v], base, ratio_[v], &left, &right);
        if (chords_on_) {
          left = left * voices_gain_ + chord[v][0] * chords_gain_;
          right = right * voices_gain_ + chord[v][1] * chords_gain_;
        }
        left = tone_[v][0].lowpass(left);
        right = tone_[v][1].lowpass(right);
        const float level = v == 0 ? 1.0f : level_b;
        back[0] += level * left;
        back[1] += level * right;
        const float mid = 0.5f * level * (left + right);
        const float side = 0.5f * level * (left - right) * side_[v].next();
        wet[0] += mid * mid_left_[v].next() + side;
        wet[1] += mid * mid_right_[v].next() - side;
      }

      // Feedback. Two voices in a loop meet their own echoes (A of B is B of
      // A), which add in amplitude, so the pair is fed back at the level of
      // one; the grains likewise count as if they all agreed. That keeps
      // the loop below unity whatever the pitches.
      const float feedback = feedback_.next() * loop_trim_ / (1.0f + level_b);
      for (int c = 0; c < 2; ++c) {
        const float returned = kit::soft_clip(feedback * rumble_[c].highpass(back[c]));
        const float record = guard_[1][c].lowpass(guard_[0][c].lowpass(in[c] + returned));
        back[c] = flush_denormal(record);
        wet[c] = 2.0f * kit::soft_clip(0.5f * wet[c]);
        const float size = wet[c] < 0.0f ? -wet[c] : wet[c];
        if (size > loudest) loudest = size;
      }
      ring_.write(back[0], back[1]);
      if (chords_on_) chords_.record(back[0], back[1]);

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    idle_.settle(kit::max(output_peak(frames), loudest), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kGlideSeconds = 0.012f;
  static constexpr float kDelayLagSeconds = 0.08f;
  static constexpr float kBlendSeconds = 0.04f;
  static constexpr int kChords = pitch_shifter_dsp::kNumModes;  // the choice after the voices' own
  static constexpr float kSqrtTwo = 1.41421356f;

  void apply(int id) {
    using namespace pitch_shifter;
    const float value = param(id);
    switch (id) {
      case kPitchA:
      case kPitchB:
      case kDetune:
        pitch_[0].set(param(kPitchA) + 0.01f * param(kDetune), primed());
        pitch_[1].set(param(kPitchB) - 0.01f * param(kDetune), primed());
        break;
      case kLevelB:
        level_b_.set(value, primed());
        break;
      case kDelay:
        base_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kTone:
        tone_hz_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // Mode, Size, Jitter and Spread are read on the control clock
    }
  }

  // Per-grain gain in Grain mode. Grains that read the same sound in step
  // (no shift, no scatter) add in amplitude; otherwise they add in power.
  // `apart` is how far successive grains slip against each other, in
  // radians at 500 Hz.
  float grain_gain(float ratio, float size_seconds, float jitter) const {
    const float off_speed = ratio > 1.0f ? ratio - 1.0f : 1.0f - ratio;
    const float j2 = jitter * jitter;
    const float slip = 0.25f * size_seconds * off_speed + j2 * (size_seconds + 0.02f) +
                       0.25f * size_seconds * 0.023f * j2;
    const float apart = kit::kTwoPi * 500.0f * slip;
    const float together = std::exp(-0.5f * kit::min(apart * apart, 60.0f));
    return together * 0.5f + (1.0f - together) * 0.8165f;
  }

  // One sample of the crossing between the voices and Chords, equal in power.
  void cross() {
    if (want_chords_) {
      if (wait_ > 0) {
        --wait_;
        return;
      }
      blend_ += blend_step_;
      if (blend_ >= 1.0f) {
        blend_ = 1.0f;
        voices_on_ = false;
      }
    } else {
      blend_ -= blend_step_;
      if (blend_ <= 0.0f) {
        blend_ = 0.0f;
        chords_on_ = false;
      }
    }
    voices_gain_ = kit::SineTable::cos_lookup(0.25f * blend_);
    chords_gain_ = kit::SineTable::lookup(0.25f * blend_);
  }

  void control() {
    using namespace pitch_shifter;
    using namespace pitch_shifter_dsp;
    const float sr = sample_rate();
    const float level_b = level_b_.value;
    const bool want_b = level_b_.target > 0.0f || level_b > 0.0f;
    if (want_b && !b_active_) voice_[1].restart();
    b_active_ = want_b;

    // Chords is its own engine. Turning to it, the voices play on until it
    // has caught up (its long window and the Delay, so what was played
    // before the turn still comes out of the voices), then the two cross
    // over; turning away, the voices start at once and Chords fades under.
    const int choice = kit::clamp_int(static_cast<int>(param(kMode) + 0.5f), 0, kChords);
    want_chords_ = choice == kChords;
    if (!want_chords_) voice_mode_ = choice;
    const int mode = voice_mode_;
    if (settle_) {
      chords_on_ = want_chords_;
      voices_on_ = !want_chords_;
      blend_ = want_chords_ ? 1.0f : 0.0f;
      voices_gain_ = 1.0f - blend_;
      chords_gain_ = blend_;
      wait_ = 0;
    } else if (want_chords_ && !chords_on_) {
      chords_.reset();
      chords_on_ = true;
      wait_ = chords_.latency() + static_cast<int>(base_.target);
    } else if (!want_chords_ && !voices_on_) {
      voice_[0].restart();
      voice_[1].restart();
      voices_on_ = true;
    }
    const float size_seconds = param(kSize) * 0.001f;
    float fastest = 1.0f;
    for (int v = 0; v < 2; ++v) {
      const float next = kit::clamp(kit::semitones_to_ratio(pitch_[v].value), 0.25f, 4.0f);
      if (settle_) ratio_[v] = next;  // set before the first block: no glide
      ratio_step_[v] = (next - ratio_[v]) * (1.0f / kControlPeriod);
      VoiceSetup& setup = setup_[v];
      setup.mode = mode;
      setup.size = size_seconds * sr;
      setup.jitter = param(kJitter);
      setup.sample_rate = sr;
      setup.target_ratio = kit::clamp(kit::semitones_to_ratio(pitch_[v].target), 0.25f, 4.0f);
      setup.grain_gain = grain_gain(setup.target_ratio, size_seconds, setup.jitter);
      setup.grain_width = param(kSpread);
      if (v == 0 || b_active_) fastest = kit::max(fastest, kit::max(next, setup.target_ratio));
    }

    // Record only what the fastest voice can read back below Nyquist;
    // Chords drops what would pass it, so alone it needs no such limit.
    if (!voices_on_) fastest = 1.0f;
    if (settle_) guard_hz_.snap(0.45f * sr / fastest);
    guard_hz_.set_target(0.45f * sr / fastest);
    const float guard = guard_hz_.next();
    if (guard != guard_seen_) {
      guard_seen_ = guard;
      for (int c = 0; c < 2; ++c) {
        guard_[0][c].set(guard, 0.5412f, sr);
        guard_[1][c].set(guard, 1.3066f, sr);
      }
    }
    const float tone = tone_hz_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      for (int v = 0; v < 2; ++v) {
        for (int c = 0; c < 2; ++c) tone_[v][c].set(tone, 0.6f, sr);
      }
    }

    // A to the left by as much as B is there to balance it, B to the right.
    const float spread = param(kSpread);
    const float pan[2] = {-spread * kit::min(1.0f, level_b), spread};
    for (int v = 0; v < 2; ++v) {
      float left, right;
      kit::pan_gains(pan[v], &left, &right);
      const float away = pan[v] < 0.0f ? -pan[v] : pan[v];
      mid_left_[v].set(left * kSqrtTwo, !settle_);
      mid_right_[v].set(right * kSqrtTwo, !settle_);
      side_[v].set(1.0f - away, !settle_);
    }
    loop_trim_ = voices_on_ && mode == kGrain ? 0.5f / kit::max(setup_[0].grain_gain, setup_[1].grain_gain) : 1.0f;
    settle_ = false;
  }

  pitch_shifter_dsp::Ring ring_;
  pitch_shifter_dsp::ShiftVoice voice_[2];
  pitch_shifter_dsp::ChordEngine chords_;
  pitch_shifter_dsp::VoiceSetup setup_[2];
  kit::Smoother pitch_[2];  // semitones, detune included
  kit::Smoother mid_left_[2], mid_right_[2], side_[2];
  kit::Smoother level_b_, feedback_, mix_, base_, tone_hz_, guard_hz_;
  kit::Svf tone_[2][2];   // [voice][channel]
  kit::Svf guard_[2][2];  // [stage][channel]
  kit::OnePole rumble_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float ratio_[2] = {1.0f, 1.0f};
  float ratio_step_[2] = {0.0f, 0.0f};
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float tone_seen_ = -1.0f, guard_seen_ = -1.0f;
  float loop_trim_ = 1.0f;
  // Chords is a second engine beside the voices: `blend_` is how much of it
  // is heard (0 the voices, 1 Chords), and each runs only while it is.
  float blend_ = 0.0f, blend_step_ = 0.0f;
  float voices_gain_ = 1.0f, chords_gain_ = 0.0f;
  int wait_ = 0;        // samples until Chords, just started, has caught up
  int voice_mode_ = 0;  // the mode the voices are in, or were last
  bool chords_on_ = false, voices_on_ = true, want_chords_ = false;
  bool b_active_ = false;
  bool settle_ = true;  // the first control tick snaps what later ones glide
};

}  // namespace livemix
