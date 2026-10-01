#pragma once

// One Ember voice: a port of Tatami/Source/Devices/Instruments/EmberVoice.h
// (with the constants of EmberParams.h) on the JUCE-free Tatami DSP headers
// copied next to this file.
//
//   osc 1 ──┐ (hard sync)                       filter env, key track,
//   osc 2 ──┴─ mix ─► × unison (detune, pan) ─┐  velocity, LFO
//   sub (sine, -1 oct) ──────────────────────┼─► drive ─► SVF 12/24 dB ─► amp env ─► pan
//   noise ───────────────────────────────────┘            (left and right)
//
// The signal path is the source's, sample for sample. What changed:
// - A note is a fractional pitch (derived from the frequency the host sends)
//   instead of an integer MIDI note; pitch bend is gone.
// - Values that only change now and then are cached instead of recomputed per
//   sample: the oscillator increment (while no glide or pitch LFO runs), the
//   filter coefficients (while cutoff and resonance stand still) and the pan
//   gains. The cache compares the exact inputs.
// - Pitch to frequency and cutoff to the filter's tan() come from two tables
//   built with the source's own functions and read with linear interpolation
//   (16 points per semitone, 128 per octave). A sweeping filter or a vibrato
//   needs one of them per voice per sample, and the polynomial pair cost more
//   than the rest of the voice. The error is below 0.003 cent in pitch and
//   0.002 % in cutoff; whole semitones are exact.
// - Oscillator 2 only advances its phase while the mix is fully on
//   oscillator 1 and sync is off: its output would be multiplied by zero.
//   The sub's sine is skipped the same way while its level is zero.
// - While every unison voice sits in the centre, left and right carry the
//   same signal, so one filter runs and feeds both sides.
// - A voice that is taken over while it still sounds (stolen, or retriggered
//   in mono mode) fades to the new note's velocity over 5 ms. The source
//   switches at once, which is a step in the waveform: a click.

#include <cmath>
#include <cstdint>

#include "Adsr.h"
#include "FastMath.h"
#include "PolyBlepOsc.h"
#include "SvfTptSynth.h"

namespace livemix {
namespace ember {

namespace dsp = tatami::dsp;

constexpr int kMaxVoices = 16;
constexpr int kMaxUnison = 8;
constexpr float kLfoPitchRangeSemitones = 12.0f;
constexpr float kLfoCutoffRangeOctaves = 5.0f;
constexpr float kFilterEnvRangeOctaves = 6.0f;
constexpr float kVelFilterRangeOctaves = 4.0f;
constexpr float kMaxCutoffHz = 20000.0f;
constexpr float kMinCutoffOctaves = 4.3219281f;  // log2(20)
constexpr float kMaxCutoffOctaves = 14.287712f;  // log2(20000)

// Pitch (fractional MIDI note) to Hz.
constexpr float kPitchTableLow = -36.0f;
constexpr int kPitchTablePerSemitone = 16;
constexpr int kPitchTableSize = 200 * kPitchTablePerSemitone + 2;
// Cutoff (octaves, log2 Hz) to g = tan(pi * cutoff / voice rate).
constexpr int kCutoffTablePerOctave = 128;
constexpr int kCutoffTableSize = 10 * kCutoffTablePerOctave + 2;

// Control-rate values shared by every voice, refreshed once per sub-block.
struct VoiceControls {
  dsp::PolyBlepOsc::Shape osc1_shape = dsp::PolyBlepOsc::Shape::saw;
  dsp::PolyBlepOsc::Shape osc2_shape = dsp::PolyBlepOsc::Shape::saw;
  float osc1_ratio = 1.0f;
  float osc2_ratio = 1.0f;
  bool sync = false;

  dsp::SvfTptSynth::Type filter_type = dsp::SvfTptSynth::Type::lowpass;
  bool four_pole = true;
  float key_track = 0.0f;
  float filter_env_octaves = 0.0f;
  float vel_to_filter_octaves = 0.0f;
  float vel_to_amp = 0.7f;
  float max_cutoff_normalised = 0.245f;

  float filter_attack = 0.005f, filter_decay = 0.3f, filter_sustain = 0.5f, filter_release = 0.3f;
  float amp_attack = 0.005f, amp_decay = 0.3f, amp_sustain = 1.0f, amp_release = 0.2f;

  int unison_voices = 1;
  float unison_ratio[kMaxUnison] = {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f};
  float unison_gain_l[kMaxUnison] = {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f};
  float unison_gain_r[kMaxUnison] = {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f};
  // Every unison voice is panned to the centre: left and right are equal.
  bool centred = true;

  float glide_seconds = 0.0f;

  int lfo_dest[2] = {1, 0};
  float lfo_amount[2] = {0.0f, 0.0f};
  float sample_rate = 96000.0f;

  const float* pitch_table = nullptr;   // kPitchTableSize entries
  const float* cutoff_table = nullptr;  // kCutoffTableSize entries
};

// Fills the two tables with the source's functions: midiNoteToHz for pitch,
// and for the filter the same clamp and tan() polynomial SvfTptSynth uses.
inline void build_tables(float* pitch_table, float* cutoff_table, float voice_rate,
                         float max_cutoff_normalised) {
  for (int i = 0; i < kPitchTableSize; ++i) {
    pitch_table[i] = dsp::midiNoteToHz(kPitchTableLow +
                                       static_cast<float>(i) / static_cast<float>(kPitchTablePerSemitone));
  }
  const float inv_rate = 1.0f / voice_rate;
  for (int i = 0; i < kCutoffTableSize; ++i) {
    const float octaves =
        kMinCutoffOctaves + static_cast<float>(i) / static_cast<float>(kCutoffTablePerOctave);
    float normalised = dsp::fastExp2(octaves) * inv_rate;
    normalised = normalised > max_cutoff_normalised ? max_cutoff_normalised : normalised;
    cutoff_table[i] = dsp::SvfTptSynth::compute(normalised, 0.0f).g;
  }
}

// Per-sample modulation sources for one stretch of a sub-block (already
// smoothed at the voice rate).
struct ModBuffers {
  const float* cutoff_octaves = nullptr;  // log2(cutoff Hz)
  const float* resonance = nullptr;
  const float* drive = nullptr;
  const float* osc_mix = nullptr;
  const float* sub_level = nullptr;
  const float* noise_level = nullptr;
  const float* pw1 = nullptr;
  const float* pw2 = nullptr;
  const float* lfo[2] = {nullptr, nullptr};
};

enum LfoDestination : int { kDestPitch = 0, kDestCutoff, kDestAmp, kDestPan, kDestPw };

class Voice {
 public:
  // `phase_offset` staggers the oscillators of different voices (see ember.h).
  void prepare(double voice_sample_rate, uint32_t noise_seed, float phase_offset) {
    // Fresh envelopes, so that a second init starts from the same times.
    filter_env_ = dsp::Adsr();
    amp_env_ = dsp::Adsr();
    filter_env_.setSampleRate(voice_sample_rate);
    amp_env_.setSampleRate(voice_sample_rate);
    noise_.seed(noise_seed);
    svf_l_.reset();
    svf_r_.reset();
    linked_ = true;
    fresh_ = false;
    vel_ramp_length_ = static_cast<int>(0.005 * voice_sample_rate);
    if (vel_ramp_length_ < 1) vel_ramp_length_ = 1;
    vel_ramp_ = 0;
    vel_from_ = 0.0f;
    vel_applied_ = 0.0f;
    for (int u = 0; u < kMaxUnison; ++u) {
      float phase = static_cast<float>(u) / static_cast<float>(kMaxUnison) + phase_offset;
      phase -= std::floor(phase);
      osc1_[u].reset(phase);
      osc2_[u].reset(phase);
    }
    sub_phase_ = 0.0f;
    velocity_ = 1.0f;
    vel_to_amp_applied_ = 0.7f;
    current_pitch_ = 60.0f;
    target_pitch_ = 60.0f;
    glide_step_ = 0.0f;
    pitch_key_ = 69.0f;
    pitch_hz_ = 440.0f;
    coef_octaves_ = -1.0f;
    coef_resonance_ = -1.0f;
    coef_ = dsp::SvfTptSynth::Coefficients();
    pan_key_ = 0.0f;
    pan_l_ = std::sqrt(0.5f);
    pan_r_ = std::sqrt(0.5f);
  }

  // `from_pitch` < 0 means no glide (start on pitch).
  void start(float pitch, float velocity01, float from_pitch, float glide_seconds, float sample_rate,
             bool retrigger) {
    if (amp_env_.isActive() && !fresh_) {
      vel_from_ = vel_applied_;
      vel_ramp_ = vel_ramp_length_;
    } else {
      fresh_ = true;
      vel_ramp_ = 0;
    }
    velocity_ = velocity01;
    target_pitch_ = pitch;
    if (from_pitch >= 0.0f && glide_seconds > 0.0f) {
      current_pitch_ = from_pitch;
      glide_step_ = (target_pitch_ - current_pitch_) / (glide_seconds * sample_rate);
    } else {
      current_pitch_ = target_pitch_;
      glide_step_ = 0.0f;
    }
    if (retrigger) {
      filter_env_.noteOn();
      amp_env_.noteOn();
    }
  }

  // Legato: change pitch without retriggering the envelopes.
  void retarget(float pitch, float glide_seconds, float sample_rate) {
    target_pitch_ = pitch;
    glide_step_ =
        glide_seconds > 0.0f ? (target_pitch_ - current_pitch_) / (glide_seconds * sample_rate) : 0.0f;
    if (dsp::isZero(glide_step_)) current_pitch_ = target_pitch_;
  }

  void release() {
    filter_env_.noteOff();
    amp_env_.noteOff();
  }

  bool releasing() const { return amp_env_.isReleasing(); }
  float current_pitch() const { return current_pitch_; }
  float audible_level() const {
    return amp_env_.value() * (1.0f - vel_to_amp_applied_ + vel_to_amp_applied_ * velocity_);
  }

  // Adds `frames` of this voice into left/right. False once the amp envelope
  // has finished.
  bool render(float* out_l, float* out_r, int frames, const VoiceControls& c, const ModBuffers& m) {
    filter_env_.setTimes(c.filter_attack, c.filter_decay, c.filter_sustain, c.filter_release);
    amp_env_.setTimes(c.amp_attack, c.amp_decay, c.amp_sustain, c.amp_release);
    vel_to_amp_applied_ = c.vel_to_amp;
    const float vel_gain = 1.0f - c.vel_to_amp + c.vel_to_amp * velocity_;
    const float vel_filter_octaves = c.vel_to_filter_octaves * (velocity_ - 0.5f);
    const float key_octaves = c.key_track * (target_pitch_ - 60.0f) / 12.0f;
    const float inv_sample_rate = 1.0f / c.sample_rate;
    const int unison = c.unison_voices;
    const float unison_norm = 1.0f / std::sqrt(static_cast<float>(unison));
    const bool lfo_on[2] = {!dsp::isZero(c.lfo_amount[0]), !dsp::isZero(c.lfo_amount[1])};
    const bool any_lfo = lfo_on[0] || lfo_on[1];
    const float vel_ramp_scale = 1.0f / static_cast<float>(vel_ramp_length_);

    // One filter serves both sides while they carry the same signal. The
    // right one takes over the shared state when they part (exact), and they
    // join again when a centred voice starts from silence.
    if (fresh_) {
      fresh_ = false;
      if (c.centred && !linked_) {
        svf_r_ = svf_l_;
        linked_ = true;
      }
    }
    if (!c.centred && linked_) {
      svf_r_ = svf_l_;
      linked_ = false;
    }
    const bool mono = c.centred && linked_;

    float vel_now = vel_gain;

    for (int i = 0; i < frames; ++i) {
      const float f_env = filter_env_.next();
      const float a_env = amp_env_.next();
      if (!amp_env_.isActive()) return false;

      if (!dsp::isZero(glide_step_)) {
        current_pitch_ += glide_step_;
        if ((glide_step_ > 0.0f && current_pitch_ >= target_pitch_) ||
            (glide_step_ < 0.0f && current_pitch_ <= target_pitch_)) {
          current_pitch_ = target_pitch_;
          glide_step_ = 0.0f;
        }
      }

      float pitch_mod = 0.0f, cutoff_mod = 0.0f, amp_mod = 1.0f, pan_mod = 0.0f, pw_mod = 0.0f;
      if (any_lfo) {
        for (int l = 0; l < 2; ++l) {
          if (!lfo_on[l]) continue;
          const float amount = c.lfo_amount[l];
          const float value = m.lfo[l][i];
          switch (c.lfo_dest[l]) {
            case kDestPitch:
              pitch_mod += value * amount * kLfoPitchRangeSemitones;
              break;
            case kDestCutoff:
              cutoff_mod += value * amount * kLfoCutoffRangeOctaves;
              break;
            case kDestAmp:
              amp_mod *= 1.0f - std::abs(amount) * (0.5f - 0.5f * (amount < 0.0f ? -value : value));
              break;
            case kDestPan:
              pan_mod += value * amount;
              break;
            case kDestPw:
              pw_mod += value * amount * 0.45f;
              break;
            default:
              break;
          }
        }
      }

      const float pitch = current_pitch_ + pitch_mod;
      if (pitch != pitch_key_) {
        pitch_key_ = pitch;
        pitch_hz_ = pitch_to_hz(c.pitch_table, pitch);
      }
      const float base_inc = pitch_hz_ * inv_sample_rate;
      const float mix = m.osc_mix[i];
      const float pw1 = clamp_pw(m.pw1[i] + pw_mod);
      const float pw2 = clamp_pw(m.pw2[i] + pw_mod);
      const float inc1 = base_inc * c.osc1_ratio;
      const float inc2 = base_inc * c.osc2_ratio;
      float osc_l = 0.0f, osc_r = 0.0f;
      if (dsp::isZero(mix) && !c.sync) {
        for (int u = 0; u < unison; ++u) {
          const float s = osc1_[u].next(inc1 * c.unison_ratio[u], c.osc1_shape, pw1);
          advance_phase(osc2_[u], inc2 * c.unison_ratio[u]);
          osc_l += s * c.unison_gain_l[u];
          osc_r += s * c.unison_gain_r[u];
        }
      } else {
        for (int u = 0; u < unison; ++u) {
          const float s1 = osc1_[u].next(inc1 * c.unison_ratio[u], c.osc1_shape, pw1);
          const float sync_at = c.sync && osc1_[u].didWrap() ? osc1_[u].syncFraction() : -1.0f;
          const float s2 = osc2_[u].next(inc2 * c.unison_ratio[u], c.osc2_shape, pw2, sync_at);
          const float s = s1 + (s2 - s1) * mix;
          osc_l += s * c.unison_gain_l[u];
          osc_r += s * c.unison_gain_r[u];
        }
      }
      osc_l *= unison_norm;
      osc_r *= unison_norm;

      sub_phase_ += base_inc * 0.5f;
      if (sub_phase_ >= 1.0f) sub_phase_ -= 1.0f;
      const float sub_level = m.sub_level[i];
      // The noise generator always steps, so its sequence does not depend on
      // when the level was raised.
      const float hiss = noise_.nextBipolar() * m.noise_level[i];
      const float common =
          (dsp::isZero(sub_level) ? 0.0f : std::sin(sub_phase_ * 6.283185307f) * sub_level) + hiss;
      float sig_l = osc_l + common;
      float sig_r = osc_r + common;

      const float drive = m.drive[i];
      if (drive > 0.0f) {
        const float g = 1.0f + 15.0f * drive;
        const float comp = 1.0f / std::sqrt(g);
        sig_l += drive * (dsp::fastTanh(sig_l * g) * comp - sig_l);
        if (!mono) sig_r += drive * (dsp::fastTanh(sig_r * g) * comp - sig_r);
      }

      float cutoff_oct =
          m.cutoff_octaves[i] + key_octaves + c.filter_env_octaves * f_env + vel_filter_octaves + cutoff_mod;
      cutoff_oct = cutoff_oct < kMinCutoffOctaves
                       ? kMinCutoffOctaves
                       : (cutoff_oct > kMaxCutoffOctaves ? kMaxCutoffOctaves : cutoff_oct);
      const float resonance = m.resonance[i];
      if (cutoff_oct != coef_octaves_ || resonance != coef_resonance_) {
        coef_octaves_ = cutoff_oct;
        coef_resonance_ = resonance;
        // SvfTptSynth::compute with g read from the table.
        const float position = (cutoff_oct - kMinCutoffOctaves) * static_cast<float>(kCutoffTablePerOctave);
        const int index = static_cast<int>(position);
        const float g = c.cutoff_table[index] + (c.cutoff_table[index + 1] - c.cutoff_table[index]) *
                                                    (position - static_cast<float>(index));
        const float r = resonance < 0.0f ? 0.0f : (resonance > 1.0f ? 1.0f : resonance);
        coef_.g = g;
        coef_.k = 2.0f - 1.9f * r;
        coef_.a1 = 1.0f / (1.0f + g * (g + coef_.k));
        coef_.a2 = g * coef_.a1;
        coef_.a3 = g * coef_.a2;
      }
      sig_l = svf_l_.process(sig_l, coef_, c.filter_type, c.four_pole);
      sig_r = mono ? sig_l : svf_r_.process(sig_r, coef_, c.filter_type, c.four_pole);

      vel_now = vel_gain;
      if (vel_ramp_ > 0) {
        vel_now += (vel_from_ - vel_gain) * (static_cast<float>(vel_ramp_) * vel_ramp_scale);
        --vel_ramp_;
      }
      const float gain = a_env * vel_now * amp_mod;
      const float pan = pan_mod < -1.0f ? -1.0f : (pan_mod > 1.0f ? 1.0f : pan_mod);
      if (pan != pan_key_) {
        pan_key_ = pan;
        pan_l_ = std::sqrt(0.5f * (1.0f - pan));
        pan_r_ = std::sqrt(0.5f * (1.0f + pan));
      }
      out_l[i] += sig_l * gain * pan_l_;
      out_r[i] += sig_r * gain * pan_r_;
    }

    vel_applied_ = vel_now;
    return true;
  }

 private:
  static float pitch_to_hz(const float* table, float pitch) {
    float position = (pitch - kPitchTableLow) * static_cast<float>(kPitchTablePerSemitone);
    const float last = static_cast<float>(kPitchTableSize - 2);
    position = position > 0.0f ? (position < last ? position : last) : 0.0f;
    const int index = static_cast<int>(position);
    return table[index] + (table[index + 1] - table[index]) * (position - static_cast<float>(index));
  }

  static float clamp_pw(float pw) { return pw < 0.05f ? 0.05f : (pw > 0.95f ? 0.95f : pw); }

  // What PolyBlepOsc::next does to the phase, without the waveform.
  static void advance_phase(dsp::PolyBlepOsc& osc, float inc) {
    inc = inc < 1.0e-7f ? 1.0e-7f : (inc > 0.49f ? 0.49f : inc);
    float phase = osc.currentPhase() + inc;
    if (phase >= 1.0f) phase -= 1.0f;
    osc.reset(phase);
  }

  dsp::PolyBlepOsc osc1_[kMaxUnison];
  dsp::PolyBlepOsc osc2_[kMaxUnison];
  dsp::SvfTptSynth svf_l_, svf_r_;
  dsp::Adsr filter_env_, amp_env_;
  dsp::XorShift32 noise_;
  bool linked_ = true;  // the right filter's state is the left one's
  bool fresh_ = false;  // started from silence, not rendered yet

  float velocity_ = 1.0f;
  float vel_to_amp_applied_ = 0.7f;
  // The velocity fade of a voice taken over while sounding.
  int vel_ramp_length_ = 480;
  int vel_ramp_ = 0;
  float vel_from_ = 0.0f;
  float vel_applied_ = 0.0f;
  float current_pitch_ = 60.0f;
  float target_pitch_ = 60.0f;
  float glide_step_ = 0.0f;
  float sub_phase_ = 0.0f;

  float pitch_key_ = 69.0f, pitch_hz_ = 440.0f;
  float coef_octaves_ = -1.0f, coef_resonance_ = -1.0f;
  dsp::SvfTptSynth::Coefficients coef_;
  float pan_key_ = 0.0f, pan_l_ = 0.70710678f, pan_r_ = 0.70710678f;
};

}  // namespace ember
}  // namespace livemix
