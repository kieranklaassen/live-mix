#pragma once

// Ember: the poly pad synth of the Tatami DAW (tatami.ember), ported from
// kkfonie/Tatami/Source/Devices/Instruments/EmberDevice.{h,cpp}.
//
//   note ─► voice 1..16 ─┐   (ember_voice.h: two oscillators with hard sync,
//                        │    sub, noise, drive, 12/24 dB filter, two envelopes,
//   LFO 1, LFO 2 ───────►│    up to 8 unison copies spread across the field)
//   (shared, free-running)
//                        └─► sum ─► volume ─► soft clip ─► 2:1 half-band ─► out
//                            └──────── twice the sample rate ────────┘
//
// - The whole voice engine runs at twice the sample rate and the stereo sum
//   is decimated once. Oscillator edges, the drive stage, the filter near
//   Nyquist and the master soft clip all alias into the band the decimator
//   removes, so no voice needs its own oversampler.
// - Control values are refreshed every 32 oversampled samples (a sub-block)
//   on a counter that runs across host blocks; continuous parameters ramp
//   linearly over 5 ms as in the source, nine of them per sample (cutoff,
//   resonance, drive, mix, sub, noise, both pulse widths, volume).
// - Notes arrive as (id, frequency, gain). The pitch is the fractional MIDI
//   note of the frequency and the gain is the velocity; voices and the
//   mono/legato held-note stack are keyed by id.
// - The source sums voices at full level: one note reaches -12 dBFS at the
//   default volume and a chord sits in the clipper. kOutputTrim puts 8.9 dB
//   of headroom under the Volume control so a ten-note chord stays under the
//   knee; the soft clip is still the last stage and still catches a pile of
//   notes.
// - The decimator is the kit's 63-tap FIR half-band (the source used JUCE's
//   polyphase IIR). One 2x sample of delay in front of it makes the latency a
//   whole number: 16 samples, reported in the manifest.
// - The instrument sleeps 50 ms after the last voice has finished. Asleep it
//   renders nothing but keeps its clock: the sub-block counter, the parameter
//   ramps and the LFO phases move exactly as they do awake, so the LFOs stay
//   free-running and the output never depends on when the sleep began.
//
// Nothing here recirculates on its own: the filters only run while a voice
// sounds and are fed by oscillators that never stop, so there is no decaying
// feedback path to flush.

#include <cmath>
#include <cstdint>

#include "../../kit/device.h"
#include "../../kit/idle.h"
#include "../../kit/math.h"
#include "../../kit/oversample.h"
#include "VoiceAllocator.h"
#include "ember_lfo.h"
#include "ember_voice.h"
#include "params.gen.h"

namespace livemix {

class Ember : public kit::DeviceBase<ember::kNumParams> {
 public:
  static constexpr int kSubBlock = 32;  // oversampled samples per control update
  static constexpr int kLatencySamples = 16;

  void init(float sample_rate) {
    using namespace ember;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    voice_rate_ = this->sample_rate() * 2.0f;
    ramp_length_ = static_cast<int>(std::floor(0.005 * static_cast<double>(voice_rate_)));
    for (int id = 0; id < kNumParams; ++id) ramps_[id].snap(kParamDefault[id]);

    for (int v = 0; v < kMaxVoices; ++v) {
      // Golden-ratio steps: no two voices start their oscillators together.
      const float offset = static_cast<float>(v) * 0.61803399f;
      voices_[v].prepare(voice_rate_, 0x1234567u + static_cast<uint32_t>(v) * 7919u,
                         offset - std::floor(offset));
    }
    allocator_.reset();
    num_held_ = 0;
    last_note_pitch_ = -1.0f;
    last_velocity_ = 1.0f;
    for (Lfo& lfo : lfos_) {
      lfo.set_sample_rate(voice_rate_);
      lfo.reset();
    }

    controls_ = VoiceControls();
    controls_.sample_rate = voice_rate_;
    controls_.max_cutoff_normalised = kit::min(0.245f, kMaxCutoffHz / voice_rate_);
    build_tables(pitch_table_, cutoff_table_, voice_rate_, controls_.max_cutoff_normalised);
    controls_.pitch_table = pitch_table_;
    controls_.cutoff_table = cutoff_table_;
    mod_.cutoff_octaves = cutoff_octaves_;
    mod_.resonance = resonance_;
    mod_.drive = drive_;
    mod_.osc_mix = osc_mix_;
    mod_.sub_level = sub_level_;
    mod_.noise_level = noise_level_;
    mod_.pw1 = pw1_;
    mod_.pw2 = pw2_;
    mod_.lfo[0] = lfo_values_[0];
    mod_.lfo[1] = lfo_values_[1];
    for (bool& filled : filled_) filled = false;
    for (int i = 0; i < kSubBlock; ++i) {
      lfo_values_[0][i] = 0.0f;
      lfo_values_[1][i] = 0.0f;
    }

    for (int c = 0; c < 2; ++c) {
      down_[c].init();
      carry_[c] = 0.0f;
    }
    sub_pos_ = 0;
    pending_ = true;
    settled_ = false;
    // Longer than the decimator's 16 samples; nothing else outlives a voice.
    idle_.reset(this->sample_rate(), 0.05f);
    sync_controls();
  }

  void set_param(int id, float value) {
    if (!store_param(id, value)) return;
    float stored = param(id);
    if (discrete(id)) stored = std::round(stored);
    // Nothing has sounded before the first block: snap.
    ramps_[id].set(stored, primed() ? ramp_length_ : 0);
    pending_ = true;
    settled_ = false;
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace ember;
    if (!(frequency == frequency)) return;  // NaN
    // MIDI notes 0..127, the range the source could be played over.
    const float pitch = kit::clamp(kit::hz_to_midi(kit::clamp(frequency, 8.0f, 13000.0f)), 0.0f, 127.0f);
    if (!(gain == gain)) gain = 0.7f;
    const float velocity = kit::clamp(gain, 0.0f, 1.0f);
    const int mode = choice(kVoiceMode);
    const float glide = value(kGlide);

    if (mode == kPoly) {
      // The same note struck again while held: let the old voice go.
      const int same = allocator_.findHeld(note_id, kMaxVoices);
      if (same != Allocator::kNoVoice) release_voice(same);
      float levels[kMaxVoices];
      for (int v = 0; v < kMaxVoices; ++v) {
        levels[v] = allocator_.isActive(v) ? voices_[v].audible_level() : 0.0f;
      }
      const int v = allocator_.allocate(note_id, levels, kMaxVoices);
      voices_[v].start(pitch, velocity, glide > 0.0f ? last_note_pitch_ : -1.0f, glide, voice_rate_, true);
    } else {
      push_held(note_id, pitch);
      Voice& voice = voices_[0];
      if (allocator_.isActive(0) && !allocator_.isReleasing(0)) {
        if (mode == kLegato) {
          voice.retarget(pitch, glide, voice_rate_);
        } else {
          voice.start(pitch, velocity, voice.current_pitch(), glide, voice_rate_, true);
        }
      } else {
        const float from = allocator_.isActive(0) ? voice.current_pitch() : last_note_pitch_;
        voice.start(pitch, velocity, glide > 0.0f ? from : -1.0f, glide, voice_rate_, true);
      }
      allocator_.start(0, note_id);
    }
    last_note_pitch_ = pitch;
    last_velocity_ = velocity;
  }

  void note_off(int note_id) {
    using namespace ember;
    const int mode = choice(kVoiceMode);
    if (mode == kPoly) {
      for (int v = 0; v < kMaxVoices; ++v) {
        if (allocator_.isActive(v) && !allocator_.isReleasing(v) && allocator_.noteOf(v) == note_id) {
          release_voice(v);
        }
      }
      return;
    }

    remove_held(note_id);
    // Voices 1.. only sound in poly mode; if the mode changed while a chord
    // was held their note-offs still have to land here.
    for (int v = 1; v < kMaxVoices; ++v) {
      if (allocator_.isActive(v) && !allocator_.isReleasing(v) && allocator_.noteOf(v) == note_id) {
        release_voice(v);
      }
    }
    if (!allocator_.isActive(0) || allocator_.noteOf(0) != note_id) return;
    if (num_held_ > 0) {
      // Fall back to the note held before this one.
      const Held previous = held_[num_held_ - 1];
      const float glide = value(kGlide);
      if (mode == kLegato) {
        voices_[0].retarget(previous.pitch, glide, voice_rate_);
      } else {
        voices_[0].start(previous.pitch, last_velocity_, voices_[0].current_pitch(), glide, voice_rate_,
                         true);
      }
      allocator_.start(0, previous.id);
      last_note_pitch_ = previous.pitch;
    } else {
      release_voice(0);
    }
  }

  void process(int frames) {
    using namespace ember;
    frames = begin_block(frames);
    if (!idle_.wake(allocator_.countActive(kMaxVoices) > 0)) {
      run_clock(frames * 2);
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input

    const int total = frames * 2;
    int done = 0;
    int out = 0;
    while (done < total) {
      if (sub_pos_ == 0) begin_sub_block();
      // Both are even: host blocks hand over whole pairs of 2x samples.
      const int n = kit::clamp_int(total - done, 0, kSubBlock - sub_pos_);
      fill_mod_buffers(n);
      for (int i = 0; i < n; ++i) {
        bus_l_[i] = 0.0f;
        bus_r_[i] = 0.0f;
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        if (!allocator_.isActive(v)) continue;
        if (!voices_[v].render(bus_l_, bus_r_, n, controls_, mod_)) allocator_.free(v);
      }
      for (int i = 0; i < n; i += 2) {
        const float l0 = kit::soft_clip(bus_l_[i] * volume_[i]);
        const float l1 = kit::soft_clip(bus_l_[i + 1] * volume_[i + 1]);
        const float r0 = kit::soft_clip(bus_r_[i] * volume_[i]);
        const float r1 = kit::soft_clip(bus_r_[i + 1] * volume_[i + 1]);
        // The pair is taken one 2x sample late (see the header). The clamp
        // only acts on the filter's overshoot of an already clipped master.
        out_left_[out] = kit::clamp(down_[0].down(carry_[0], l0), -1.0f, 1.0f);
        out_right_[out] = kit::clamp(down_[1].down(carry_[1], r0), -1.0f, 1.0f);
        carry_[0] = l1;
        carry_[1] = r1;
        ++out;
      }
      sub_pos_ = (sub_pos_ + n) & (kSubBlock - 1);
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // Test hook: voices currently sounding (held or in their release).
  int active_voices() const { return allocator_.countActive(ember::kMaxVoices); }

 private:
  using Allocator = tatami::dsp::VoiceAllocator<ember::kMaxVoices>;
  using Lfo = ember::Lfo;
  using Voice = ember::Voice;

  enum VoiceMode : int { kPoly = 0, kMono, kLegato };

  // Headroom under Volume (see the header).
  static constexpr float kOutputTrim = 0.36f;
  static constexpr int kMaxHeld = 32;

  // The source's SmoothedParam: a linear ramp that restarts from wherever it
  // is whenever the target moves.
  struct Ramp {
    float value = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    int remaining = 0;

    void snap(float v) {
      value = v;
      target = v;
      remaining = 0;
    }
    void set(float v, int length) {
      if (length <= 0) {
        snap(v);
      } else if (v != target) {
        target = v;
        remaining = length;
        step = (target - value) / static_cast<float>(length);
      }
    }
    float next() {
      if (remaining > 0) {
        if (--remaining > 0) {
          value += step;
        } else {
          value = target;
        }
      }
      return value;
    }
    void advance(int samples) {
      if (remaining > samples) {
        value += step * static_cast<float>(samples);
        remaining -= samples;
      } else if (remaining > 0) {
        value = target;
        remaining = 0;
      }
    }
  };

  struct Held {
    int id;
    float pitch;
  };

  // Stepped parameters: rounded when set and read from the target, so a
  // switch never passes through the values in between.
  static bool discrete(int id) {
    using namespace ember;
    switch (id) {
      case kOsc1Shape:
      case kOsc1Coarse:
      case kOsc2Shape:
      case kOsc2Coarse:
      case kOsc2Sync:
      case kFilterType:
      case kFilterSlope:
      case kLfo1Shape:
      case kLfo1Dest:
      case kLfo2Shape:
      case kLfo2Dest:
      case kVoiceMode:
      case kUnisonVoices:
        return true;
      default:
        return false;
    }
  }

  float value(int id) const { return ramps_[id].value; }
  int choice(int id) const { return static_cast<int>(std::lround(ramps_[id].target)); }

  // LFO shape and rate, then everything the voices read at control rate.
  void sync_controls() {
    using namespace ember;
    lfos_[0].set_shape(static_cast<Lfo::Shape>(kit::clamp_int(choice(kLfo1Shape), 0, Lfo::kNumShapes - 1)));
    lfos_[1].set_shape(static_cast<Lfo::Shape>(kit::clamp_int(choice(kLfo2Shape), 0, Lfo::kNumShapes - 1)));
    lfos_[0].set_rate_hz(value(kLfo1Rate));
    lfos_[1].set_rate_hz(value(kLfo2Rate));
    refresh_controls();
  }

  // Start of a sub-block. As in the source the LFO rate is the value before
  // this sub-block's smoothing and the voice controls are the values after it.
  // All of it is a function of the parameters, so it is skipped while none
  // has moved; because the LFO rate lags the smoothing by one sub-block, the
  // work runs once more after the last ramp has landed.
  void begin_sub_block() {
    using namespace ember;
    if (!pending_) return;
    lfos_[0].set_shape(static_cast<Lfo::Shape>(kit::clamp_int(choice(kLfo1Shape), 0, Lfo::kNumShapes - 1)));
    lfos_[1].set_shape(static_cast<Lfo::Shape>(kit::clamp_int(choice(kLfo2Shape), 0, Lfo::kNumShapes - 1)));
    lfos_[0].set_rate_hz(value(kLfo1Rate));
    lfos_[1].set_rate_hz(value(kLfo2Rate));
    bool moving = false;
    for (int id = 0; id < kNumParams; ++id) {
      if (per_sample(id)) continue;
      ramps_[id].advance(kSubBlock);
      if (ramps_[id].remaining > 0) moving = true;
    }
    refresh_controls();
    if (moving) {
      settled_ = false;
    } else if (settled_) {
      pending_ = false;
    } else {
      settled_ = true;
    }
  }

  // The nine parameters smoothed per sample (fill_mod_buffers).
  static bool per_sample(int id) {
    using namespace ember;
    switch (id) {
      case kCutoff:
      case kResonance:
      case kFilterDrive:
      case kOscMix:
      case kSubLevel:
      case kNoiseLevel:
      case kOsc1Pw:
      case kOsc2Pw:
      case kVolume:
        return true;
      default:
        return false;
    }
  }

  void refresh_controls() {
    using namespace ember;
    namespace dsp = tatami::dsp;
    VoiceControls& c = controls_;
    c.osc1_shape = static_cast<dsp::PolyBlepOsc::Shape>(kit::clamp_int(choice(kOsc1Shape), 0, 3));
    c.osc2_shape = static_cast<dsp::PolyBlepOsc::Shape>(kit::clamp_int(choice(kOsc2Shape), 0, 3));
    c.osc1_ratio = dsp::semitonesToRatio(value(kOsc1Coarse) + value(kOsc1Fine) * 0.01f);
    c.osc2_ratio = dsp::semitonesToRatio(value(kOsc2Coarse) + value(kOsc2Fine) * 0.01f);
    c.sync = choice(kOsc2Sync) != 0;

    c.filter_type = static_cast<dsp::SvfTptSynth::Type>(kit::clamp_int(choice(kFilterType), 0, 2));
    c.four_pole = choice(kFilterSlope) != 0;
    c.key_track = value(kKeyTrack);
    c.filter_env_octaves = value(kFilterEnvAmount) * kFilterEnvRangeOctaves;
    c.vel_to_filter_octaves = value(kVelToFilter) * kVelFilterRangeOctaves;
    c.vel_to_amp = value(kVelToAmp);

    c.filter_attack = value(kFilterAttack);
    c.filter_decay = value(kFilterDecay);
    c.filter_sustain = value(kFilterSustain);
    c.filter_release = value(kFilterRelease);
    c.amp_attack = value(kAmpAttack);
    c.amp_decay = value(kAmpDecay);
    c.amp_sustain = value(kAmpSustain);
    c.amp_release = value(kAmpRelease);

    c.unison_voices = kit::clamp_int(choice(kUnisonVoices), 1, kMaxUnison);
    const float detune = value(kUnisonDetune);
    const float spread = value(kUnisonSpread);
    c.centred = true;
    for (int u = 0; u < c.unison_voices; ++u) {
      const float pos = c.unison_voices > 1
                            ? (static_cast<float>(u) / static_cast<float>(c.unison_voices - 1) - 0.5f) * 2.0f
                            : 0.0f;
      c.unison_ratio[u] = dsp::fastExp2(pos * detune / 1200.0f);
      const float pan = pos * spread;
      c.unison_gain_l[u] = std::sqrt(0.5f * (1.0f - pan));
      c.unison_gain_r[u] = std::sqrt(0.5f * (1.0f + pan));
      if (c.unison_gain_l[u] != c.unison_gain_r[u]) c.centred = false;
    }

    c.glide_seconds = value(kGlide);
    c.lfo_dest[0] = choice(kLfo1Dest);
    c.lfo_dest[1] = choice(kLfo2Dest);
    c.lfo_amount[0] = value(kLfo1Amount);
    c.lfo_amount[1] = value(kLfo2Amount);
  }

  // One per-sample parameter into its buffer. A parameter at rest fills the
  // whole sub-block once and is then left alone.
  template <typename Map>
  void fill(int slot, int id, int n, float* buffer, Map map) {
    Ramp& ramp = ramps_[id];
    if (ramp.remaining == 0) {
      if (filled_[slot] && filled_value_[slot] == ramp.value) return;
      const float mapped = map(ramp.value);
      for (int i = 0; i < kSubBlock; ++i) buffer[i] = mapped;
      filled_[slot] = true;
      filled_value_[slot] = ramp.value;
      return;
    }
    filled_[slot] = false;
    for (int i = 0; i < n; ++i) buffer[i] = map(ramp.next());
  }

  void fill_mod_buffers(int n) {
    using namespace ember;
    const auto same = [](float v) { return v; };
    fill(0, kCutoff, n, cutoff_octaves_, [](float hz) { return std::log2(hz < 1.0f ? 1.0f : hz); });
    fill(1, kResonance, n, resonance_, same);
    fill(2, kFilterDrive, n, drive_, same);
    fill(3, kOscMix, n, osc_mix_, same);
    fill(4, kSubLevel, n, sub_level_, same);
    fill(5, kNoiseLevel, n, noise_level_, same);
    fill(6, kOsc1Pw, n, pw1_, same);
    fill(7, kOsc2Pw, n, pw2_, same);
    // Volume at its minimum is silence, as in the source.
    fill(8, kVolume, n, volume_,
         [](float db) { return db > -60.0f ? std::pow(10.0f, db * 0.05f) * kOutputTrim : 0.0f; });
    for (int l = 0; l < 2; ++l) {
      // The voices only read an LFO whose amount is not zero.
      if (controls_.lfo_amount[l] != 0.0f) {
        for (int i = 0; i < n; ++i) lfo_values_[l][i] = lfos_[l].next();
      } else {
        for (int i = 0; i < n; ++i) lfos_[l].skip();
      }
    }
  }

  // Asleep: what `process` does to the clock, without the audio. Every piece
  // of state that outlives a voice moves as it would awake.
  void run_clock(int total) {
    using namespace ember;
    static constexpr int kPerSample[9] = {kCutoff,     kResonance, kFilterDrive, kOscMix, kSubLevel,
                                          kNoiseLevel, kOsc1Pw,    kOsc2Pw,      kVolume};
    int done = 0;
    while (done < total) {
      if (sub_pos_ == 0) begin_sub_block();
      const int n = kit::clamp_int(total - done, 0, kSubBlock - sub_pos_);
      for (int slot = 0; slot < 9; ++slot) {
        Ramp& ramp = ramps_[kPerSample[slot]];
        if (ramp.remaining == 0) continue;
        filled_[slot] = false;
        for (int i = 0; i < n; ++i) ramp.next();
      }
      for (int i = 0; i < n; ++i) {
        lfos_[0].skip();
        lfos_[1].skip();
      }
      sub_pos_ = (sub_pos_ + n) & (kSubBlock - 1);
      done += n;
    }
  }

  void release_voice(int voice) {
    voices_[voice].release();
    allocator_.release(voice);
  }

  void push_held(int note_id, float pitch) {
    remove_held(note_id);
    if (num_held_ == kMaxHeld) {
      for (int i = 1; i < kMaxHeld; ++i) held_[i - 1] = held_[i];
      --num_held_;
    }
    held_[num_held_++] = Held{note_id, pitch};
  }

  void remove_held(int note_id) {
    for (int i = 0; i < num_held_; ++i) {
      if (held_[i].id != note_id) continue;
      for (int j = i + 1; j < num_held_; ++j) held_[j - 1] = held_[j];
      --num_held_;
      return;
    }
  }

  Ramp ramps_[ember::kNumParams];
  Voice voices_[ember::kMaxVoices];
  Allocator allocator_;
  ember::VoiceControls controls_;
  ember::ModBuffers mod_;
  Lfo lfos_[2];

  float cutoff_octaves_[kSubBlock], resonance_[kSubBlock], drive_[kSubBlock], osc_mix_[kSubBlock];
  float sub_level_[kSubBlock], noise_level_[kSubBlock], pw1_[kSubBlock], pw2_[kSubBlock];
  float volume_[kSubBlock];
  float lfo_values_[2][kSubBlock];
  bool filled_[9] = {};
  float filled_value_[9] = {};
  float bus_l_[kSubBlock], bus_r_[kSubBlock];

  float pitch_table_[ember::kPitchTableSize];
  float cutoff_table_[ember::kCutoffTableSize];

  kit::Halfband2x down_[2];
  float carry_[2] = {0.0f, 0.0f};
  kit::IdleGate idle_;

  float voice_rate_ = 96000.0f;
  int ramp_length_ = 480;
  int sub_pos_ = 0;
  // Sub-block control work is due (a parameter moved); settled_ marks the
  // extra pass after the ramps have landed.
  bool pending_ = true;
  bool settled_ = false;

  Held held_[kMaxHeld] = {};
  int num_held_ = 0;
  float last_note_pitch_ = -1.0f;
  float last_velocity_ = 1.0f;
};

}  // namespace livemix
