#pragma once

// Chorus: two or three voices reading one modulated delay line per channel,
// their LFOs spaced evenly round one cycle. Ported from kkfonie Tatami
// (Source/Devices/Effects/ChorusDevice).
//
//   in ──(+)──► delay line ──► voice reads (Hermite) ──┬─ pan, sum ─► high-pass ─► wet ─┐
//         ▲                                            │                                ├─ mix ─► out
//         └── soft limit ◄── feedback (±) ◄── mean ◄───┘                           in ──┘
//
//   voice v read point = Delay + sin(lfo + v / voices) · Depth · min(5 ms, Delay − 1 ms)
//   right channel      = the same voices read Spread · 90° later
//
// - Spread does two things at once: it pans the voices from centre out to
//   hard left and right (equal power), and it offsets the right channel's
//   LFO, so even the centre voice differs between the sides.
// - The wet sum is scaled by 1/√voices: voices that have drifted apart add in
//   power, so two and three voices are equally loud once Depth is up.
// - Feedback taps the plain mean of the voices, before panning, so the loop
//   gain is the Feedback setting whatever Spread does. The recirculated
//   signal is linear up to 0 dBFS and lands on ±2 above it.
// - The mix is a linear crossfade, as in the source.
// - Changing Voices crossfades between the two-voice and three-voice sets
//   (their LFO phases differ, so a hard switch would jump every read point).
// - The LFO is a sine only, so one sine and cosine of its phase are rotated
//   to each voice and to the right channel's offset instead of looking up six
//   sines per sample. The phase is a double: a float cannot hold the
//   increment of 0.01 Hz at 96 kHz.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Chorus : public kit::DeviceBase<chorus::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace chorus;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      high_pass_[c].reset();
    }
    delay_.set_time(kGlideSeconds, sr);
    deviation_.set_time(kGlideSeconds, sr);
    three_.set_time(kVoiceFadeSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    high_pass_amount_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    lfo_phase_ = 0.0;
    geometry_spread_ = -1.0f;
    // The longest silent gap is the longest read point, 35 ms.
    idle_.reset(sr, 0.15f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for a display to draw:
  // where the LFO is in its cycle (0..1). Voice v reads v / voices of a cycle
  // ahead of it, and the right side Spread · 90° later still.
  float meter(int index) const { return index == 0 ? static_cast<float>(lfo_phase_) : 0.0f; }

  void process(int frames) {
    using namespace chorus;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Free-running: the LFO keeps its place in the cycle while asleep.
      advance_lfo(frames);
      silence_output(frames);
      return;
    }
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      const float base = delay_.next();
      const float deviation = deviation_.next();
      const float spread = spread_.next();
      const float feedback = feedback_.next();
      const float three = three_.next();
      const float high_pass = high_pass_amount_.next();
      const float mix = mix_.next();

      advance_lfo(1);
      if (spread != geometry_spread_) set_geometry(spread);
      // Sine and cosine of the LFO for the left channel, then turned
      // Spread * 90 degrees on for the right.
      const float turn = static_cast<float>(lfo_phase_);
      Lfo lfo;
      lfo.sin[0] = kit::SineTable::lookup(turn);
      lfo.cos[0] = kit::SineTable::cos_lookup(turn);
      lfo.sin[1] = lfo.sin[0] * offset_cos_ + lfo.cos[0] * offset_sin_;
      lfo.cos[1] = lfo.cos[0] * offset_cos_ - lfo.sin[0] * offset_sin_;

      float wet[2], tap[2];
      if (three <= 0.0f) {
        read_voices(kTwo, lfo, base, deviation, wet, tap);
      } else if (three >= 1.0f) {
        read_voices(kThree, lfo, base, deviation, wet, tap);
      } else {
        float wet_three[2], tap_three[2];
        read_voices(kTwo, lfo, base, deviation, wet, tap);
        read_voices(kThree, lfo, base, deviation, wet_three, tap_three);
        for (int c = 0; c < 2; ++c) {
          wet[c] = kit::lerp(wet[c], wet_three[c], three);
          tap[c] = kit::lerp(tap[c], tap_three[c], three);
        }
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        line_[c].write(flush_denormal(in[c] + loop_limit(tap[c] * feedback)));
        // The filter always runs so its state is ready when High-pass leaves 20 Hz.
        const float shaped = wet[c] - high_pass * high_pass_[c].lowpass(wet[c]);
        out[c] = in[c] + (shaped - in[c]) * mix;
        const float magnitude = shaped < 0.0f ? -shaped : shaped;
        if (magnitude > wet_peak) wet_peak = magnitude;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    // The wet path counts too: at Mix 0 the loop still rings out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  // 30 ms + 5 ms at 96 kHz.
  static constexpr int kLineSize = 4096;
  static constexpr float kMaxDeviationMs = 5.0f;
  // Delay and Depth move the read points, so they glide rather than ramp in
  // 5 ms: a knob turn bends the pitch instead of zipping.
  static constexpr float kGlideSeconds = 0.05f;
  static constexpr float kVoiceFadeSeconds = 0.02f;

  // Linear up to ±1, a smooth knee to ±2.
  static float loop_limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  struct Lfo {
    float sin[2];
    float cos[2];
  };

  // The two voice sets. A voice's LFO runs v / voices of a cycle ahead; these
  // are the cosine and sine of that angle.
  struct VoiceSet {
    int voices;
    float norm;   // 1 / sqrt(voices): the wet sum
    float share;  // 1 / voices: the feedback mean
    float ahead_cos[3];
    float ahead_sin[3];
  };
  static constexpr int kTwo = 0;
  static constexpr int kThree = 1;
  static constexpr VoiceSet kSets[2] = {
      {2, 0.70710678119f, 0.5f, {1.0f, -1.0f, 0.0f}, {0.0f, 0.0f, 0.0f}},
      {3, 0.57735026919f, 1.0f / 3.0f, {1.0f, -0.5f, -0.5f}, {0.0f, 0.86602540378f, -0.86602540378f}},
  };

  void advance_lfo(int frames) {
    lfo_phase_ += lfo_increment_ * static_cast<double>(frames);
    lfo_phase_ -= std::floor(lfo_phase_);
  }

  // What Spread sets: the right channel's LFO offset and each voice's
  // equal-power pan, scaled so a centred voice has gain 1 on both sides.
  // Recomputed only while Spread is moving.
  void set_geometry(float spread) {
    geometry_spread_ = spread;
    offset_sin_ = kit::SineTable::lookup(spread * 0.25f);
    offset_cos_ = kit::SineTable::cos_lookup(spread * 0.25f);
    for (int set = 0; set < 2; ++set) {
      const int voices = kSets[set].voices;
      for (int v = 0; v < voices; ++v) {
        const float pan =
            spread * (static_cast<float>(v) / static_cast<float>(voices - 1) * 2.0f - 1.0f);
        const float turn = (pan + 1.0f) * 0.125f;
        pan_gain_[set][v][0] = kit::SineTable::cos_lookup(turn) * kSqrt2;
        pan_gain_[set][v][1] = kit::SineTable::lookup(turn) * kSqrt2;
      }
    }
  }

  // One set of voices: the panned, normalised wet sum and the unpanned mean
  // the feedback takes.
  void read_voices(int set, const Lfo& lfo, float base, float deviation, float* wet,
                   float* tap) const {
    const VoiceSet& voices = kSets[set];
    const float max_delay = kit::DelayLine<kLineSize>::max_delay();
    for (int c = 0; c < 2; ++c) {
      float sum = 0.0f;
      float mean = 0.0f;
      for (int v = 0; v < voices.voices; ++v) {
        const float sweep = lfo.sin[c] * voices.ahead_cos[v] + lfo.cos[c] * voices.ahead_sin[v];
        const float read =
            line_[c].read_hermite(kit::clamp(base + sweep * deviation, 2.0f, max_delay));
        sum += read * pan_gain_[set][v][c];
        mean += read;
      }
      wet[c] = sum * voices.norm;
      tap[c] = mean * voices.share;
    }
  }

  void apply(int id) {
    using namespace chorus;
    const bool ramp = primed() && !idle_.asleep();
    const float samples_per_ms = 0.001f * sample_rate();
    switch (id) {
      case kVoices:
        three_.set(param(kVoices) >= 0.5f ? 1.0f : 0.0f, ramp);
        break;
      case kRate:
        lfo_increment_ = static_cast<double>(param(kRate)) / static_cast<double>(sample_rate());
        break;
      case kDepth:
      case kDelayMs: {
        const float delay_ms = param(kDelayMs);
        delay_.set(delay_ms * samples_per_ms, ramp);
        deviation_.set(param(kDepth) * 0.01f * kit::min(kMaxDeviationMs, delay_ms - 1.0f) *
                           samples_per_ms,
                       ramp);
        break;
      }
      case kSpread:
        spread_.set(param(kSpread) * 0.01f, ramp);
        break;
      case kFeedback:
        feedback_.set(param(kFeedback) * 0.01f, ramp);
        break;
      case kHpHz: {
        // 20 Hz, the bottom of the range, is off: the wet signal passes untouched.
        const float hz = param(kHpHz);
        for (kit::OnePole& filter : high_pass_) filter.set_cutoff(hz, sample_rate());
        high_pass_amount_.set(hz > kParamMin[kHpHz] ? 1.0f : 0.0f, ramp);
        break;
      }
      case kMix:
        mix_.set(param(kMix), ramp);
        break;
      default:
        break;
    }
  }

  static constexpr float kSqrt2 = 1.41421356237f;

  kit::DelayLine<kLineSize> line_[2];
  kit::OnePole high_pass_[2];
  kit::Smoother delay_, deviation_, three_, spread_, feedback_, high_pass_amount_, mix_;
  kit::IdleGate idle_;
  double lfo_phase_ = 0.0;
  double lfo_increment_ = 0.0;
  float geometry_spread_ = -1.0f;
  float offset_sin_ = 0.0f;
  float offset_cos_ = 1.0f;
  float pan_gain_[2][3][2] = {};
};

}  // namespace livemix
