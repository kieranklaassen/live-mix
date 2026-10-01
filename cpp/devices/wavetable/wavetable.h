#pragma once

// Wavetable: a pad synthesizer that travels through tables of waveforms.
//
//   per key:  osc A (-detune/2) ─┐                    ┌─► low-pass L ─┐
//             osc B (+detune/2) ─┼─► envelope ─► spread                ├─► soft clip ─► out
//             sub sine (8vb)   ──┘                    └─► low-pass R ─┘
//             (up to 16 keys)
//
//   motion LFO ─► table position of every oscillator, at its own phase
//
// - A table is a row of nine frames. Each frame is one cycle built additively
//   from a harmonic recipe at init (no sample data) and stored ten times,
//   band-limited to 512, 256, ... 1 harmonics. An oscillator reads the level
//   whose top harmonic stays under Nyquist for its pitch, and fades into the
//   next one over the top quarter of each octave so the timbre does not step
//   between neighbouring notes. Frames keep one phase per harmonic across the
//   row, so a crossfade between two frames moves amplitudes only and never
//   cancels.
// - Position picks the place in the row; reading interpolates between the two
//   nearest frames every sample. Motion moves the position with a sine LFO
//   that reflects at the ends of the row. The LFO runs once for the whole
//   instrument, but every key reads it at its own phase and oscillator B a
//   quarter cycle after A: a chord shimmers instead of pumping, and the
//   motion is stereo even with Detune at 0.
// - Both oscillators of a key start at the same phase, so the beating that
//   Detune causes always opens from its loudest point.
// - All keys share one low-pass per channel (there is no filter envelope, so
//   a filter per key would give the same result at sixteen times the cost).
//   Resonance trades passband level for the peak, as analogue filters do.
// - Changing Table while keys sound dips the output for 16 ms around the
//   switch instead of jumping from one waveform to another.
//
// The tables do not depend on the sample rate, so they are built once per
// instance (about 4 MB, 450 inverse FFTs); later init() calls only reset the
// playing state.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Wavetable : public kit::DeviceBase<wavetable::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kSets = 5;
  static constexpr int kFrames = 9;
  static constexpr int kLevels = 10;
  static constexpr int kSize = 2048;
  static constexpr int kHarmonics = 512;

  void init(float sample_rate) {
    using namespace wavetable;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    if (!tables_ready_) {
      build_tables();
      tables_ready_ = true;
    }
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      // Golden-ratio steps keep any two keys far apart on the LFO.
      voice.lfo_offset = static_cast<float>(v) * 0.6180340f;
      voice.lfo_offset -= std::floor(voice.lfo_offset);
      voice.flip = (v & 1) != 0;
    }
    start_.seed(0x3C6EF372u);
    for (int c = 0; c < 2; ++c) filter_[c].reset();
    clock_.reset(kControlPeriod);
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    position_.set_time(0.03f, control_rate);
    motion_.set_time(0.03f, control_rate);
    cutoff_.set_time(0.02f, control_rate);
    resonance_.set_time(0.02f, control_rate);
    sub_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    near_.set_time(kSmoothingSeconds, sr);
    far_.set_time(kSmoothingSeconds, sr);
    filter_gain_.set_time(kSmoothingSeconds, sr);
    table_fade_.set_time(0.008f, sr);
    table_fade_.snap(1.0f);
    lfo_phase_ = 0.0f;
    detune_up_ = 1.0f;
    detune_down_ = 1.0f;
    last_detune_ = -1.0f;
    filter_primed_ = false;
    set_ = static_cast<int>(param(kTable) + 0.5f);
    pending_set_ = set_;
    // Nothing outlives the envelopes but the ringing of the filter.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace wavetable;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.02f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.increment = kit::min(frequency / sample_rate(), 0.49f);
    voice.gain = 0.35f + 0.65f * gain;
    if (!stolen) {
      // A stolen voice keeps running to avoid a click.
      const float start = start_.uniform();
      voice.phase[0] = start;
      voice.phase[1] = start;
      voice.sub_phase = start_.uniform();
    }
    update_pitch(voice);
    for (int o = 0; o < 2; ++o) {
      voice.position[o] = position_target(voice, o);
      voice.position_step[o] = 0.0f;
    }
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    const float sr = sample_rate();
    const float scale = static_cast<float>(kSize);
    const float frame_scale = static_cast<float>(kFrames - 1);
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      const float(*row)[kLevels][kSize + 1] = table_[set_];
      float bus_a = 0.0f, bus_b = 0.0f, bus_sub = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float env = voice.env.next() * voice.gain;
        float osc[2];
        for (int o = 0; o < 2; ++o) {
          voice.position[o] += voice.position_step[o];
          const float frame_position = voice.position[o] * frame_scale;
          int frame = static_cast<int>(frame_position);
          if (frame > kFrames - 2) frame = kFrames - 2;
          const float frame_mix = frame_position - static_cast<float>(frame);

          float phase = voice.phase[o] + voice.increment * (o == 0 ? detune_down_ : detune_up_);
          if (phase >= 1.0f) phase -= 1.0f;
          voice.phase[o] = phase;
          const float at = phase * scale;
          const int index = static_cast<int>(at);
          const float fraction = at - static_cast<float>(index);

          const float* lo = row[frame][voice.mip];
          const float* hi = row[frame + 1][voice.mip];
          const float a = lo[index] + (lo[index + 1] - lo[index]) * fraction;
          const float b = hi[index] + (hi[index + 1] - hi[index]) * fraction;
          float sample = a + (b - a) * frame_mix;
          if (voice.mip_mix > 0.0f) {
            const float* lo2 = row[frame][voice.mip + 1];
            const float* hi2 = row[frame + 1][voice.mip + 1];
            const float a2 = lo2[index] + (lo2[index + 1] - lo2[index]) * fraction;
            const float b2 = hi2[index] + (hi2[index + 1] - hi2[index]) * fraction;
            sample += (a2 + (b2 - a2) * frame_mix - sample) * voice.mip_mix;
          }
          osc[o] = sample;
        }
        voice.sub_phase += voice.increment * 0.5f;
        if (voice.sub_phase >= 1.0f) voice.sub_phase -= 1.0f;
        bus_sub += kit::SineTable::lookup(voice.sub_phase) * env;
        // Alternate keys swap sides so the sharp oscillator is not always right.
        bus_a += osc[voice.flip ? 1 : 0] * env;
        bus_b += osc[voice.flip ? 0 : 1] * env;
      }

      const float near = near_.next();
      const float far = far_.next();
      const float sub = bus_sub * sub_.next() * kSubGain;
      const float gain = kVoiceGain * filter_gain_.next();
      const float left = filter_[0].lowpass((near * bus_a + far * bus_b + sub) * gain);
      const float right = filter_[1].lowpass((far * bus_a + near * bus_b + sub) * gain);
      const float volume = volume_.next() * table_fade_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    float phase[2] = {0.0f, 0.0f};
    float sub_phase = 0.0f;
    float increment = 0.0f;
    float gain = 0.0f;
    float position[2] = {0.0f, 0.0f};
    float position_step[2] = {0.0f, 0.0f};
    float lfo_offset = 0.0f;
    float mip_mix = 0.0f;
    int mip = 0;
    bool flip = false;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static constexpr int kControlPeriod = 16;
  // One key at velocity 0.7 peaks near -21 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.55f;
  static constexpr float kSubGain = 0.5f;
  static constexpr float kTableRms = 0.25f;
  static constexpr float kMaxQ = 12.0f;

  // The table position an oscillator is heading for: Position plus the LFO,
  // reflected back into the row at both ends.
  float position_target(const Voice& voice, int osc) const {
    const float lfo =
        kit::SineTable::lookup(lfo_phase_ + voice.lfo_offset + 0.25f * static_cast<float>(osc));
    float position = position_.value + 0.5f * motion_.value * lfo;
    if (position < 0.0f) position = -position;
    if (position > 1.0f) position = 2.0f - position;
    return kit::clamp(position, 0.0f, 1.0f);
  }

  // Which band-limited copy the voice reads. Level k holds 512 >> k
  // harmonics, safe up to an increment of 2^k / 1024.
  void update_pitch(Voice& voice) const {
    const float highest = voice.increment * detune_up_;
    const float octave = std::log2(highest * static_cast<float>(2 * kHarmonics));
    int level = static_cast<int>(std::ceil(octave));
    if (level < 0) level = 0;
    if (level >= kLevels - 1) {
      voice.mip = kLevels - 1;
      voice.mip_mix = 0.0f;
      return;
    }
    const float within = octave - static_cast<float>(level - 1);  // (0, 1] inside the level's octave
    const float t = kit::clamp((within - 0.75f) * 4.0f, 0.0f, 1.0f);
    voice.mip = level;
    voice.mip_mix = t * t * (3.0f - 2.0f * t);
  }

  // Every 16 samples: the LFO, table positions, pitch and the shared filter.
  void control(float sr) {
    using namespace wavetable;
    lfo_phase_ += param(kRate) * static_cast<float>(kControlPeriod) / sr;
    lfo_phase_ -= std::floor(lfo_phase_);
    position_.next();
    motion_.next();

    const float detune = param(kDetune);
    const bool retune = detune != last_detune_;
    if (retune) {
      last_detune_ = detune;
      detune_up_ = kit::cents_to_ratio(0.5f * detune);
      detune_down_ = 1.0f / detune_up_;
    }
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (retune) update_pitch(voice);
      for (int o = 0; o < 2; ++o) {
        voice.position_step[o] = (position_target(voice, o) - voice.position[o]) * per_sample;
      }
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }

    const float q = kit::kSqrtHalf * std::pow(kMaxQ / kit::kSqrtHalf, resonance_.next());
    const float hz = std::exp2(cutoff_.next());
    for (int c = 0; c < 2; ++c) filter_[c].set(hz, q, sr);
    filter_gain_.set(q > kit::kSqrtHalf ? std::sqrt(kit::kSqrtHalf / q) : 1.0f, filter_primed_);
    filter_primed_ = true;

    // A table change waits for the dip to reach silence.
    if (pending_set_ != set_) {
      if (table_fade_.value <= 0.0f && table_fade_.remaining == 0) {
        set_ = pending_set_;
        table_fade_.set_target(1.0f);
      } else {
        table_fade_.set_target(0.0f);
      }
    }
  }

  void apply(int id) {
    using namespace wavetable;
    const float value = param(id);
    switch (id) {
      case kTable:
        pending_set_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kSets - 1);
        if (!primed()) set_ = pending_set_;
        break;
      case kPosition:
        position_.set(value, primed());
        break;
      case kMotion:
        motion_.set(value, primed());
        break;
      case kCutoff:
        cutoff_.set(std::log2(value), primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kSub:
        sub_.set(value, primed());
        break;
      case kSpread: {
        // Equal power: 0 puts both oscillators in the centre, 1 one per side.
        const float angle = (1.0f - value) * kit::kHalfPi * 0.5f;
        near_.set(std::cos(angle), primed());
        far_.set(std::sin(angle), primed());
        break;
      }
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  // --- table generation ---------------------------------------------------------------

  // One frame's harmonics: amplitude (signed) and phase in cycles of
  // amp * sin(2π(n·x + phase)), for n = 1..512.
  void recipe(int set, float t) {
    for (int n = 0; n <= kHarmonics; ++n) {
      amp_[n] = 0.0f;
      phase_[n] = 0.0f;
    }
    switch (set) {
      case 0: {  // Glass: a sine that grows bell-like partials, the high ones last.
        static constexpr int kPartial[18] = {2,  3,  4,  5,  7,  9,  11, 12, 15,
                                             16, 19, 21, 24, 27, 32, 39, 48, 64};
        static constexpr float kLevel[18] = {0.16f, 0.10f, 0.04f, 0.34f, 0.38f,  0.26f,
                                             0.14f, 0.22f, 0.12f, 0.18f, 0.10f,  0.07f,
                                             0.09f, 0.06f, 0.07f, 0.04f, 0.035f, 0.02f};
        amp_[1] = 1.0f;
        for (int k = 0; k < 18; ++k) {
          const int n = kPartial[k];
          const float rank = std::log2(static_cast<float>(n)) * (1.0f / 6.0f);
          const float x = kit::clamp((t - 0.6f * rank) * 2.5f, 0.0f, 1.0f);
          amp_[n] = kLevel[k] * x * x * (3.0f - 2.0f * x);
          const float turn = static_cast<float>(n) * 0.3819660f;
          phase_[n] = turn - std::floor(turn);
        }
        break;
      }
      case 1: {  // Vowels: a, e, i, o, u on frames 0, 2, 4, 6, 8; formants glide between.
        static constexpr float kFormant[5][3] = {{730.0f, 1090.0f, 2440.0f},
                                                 {530.0f, 1840.0f, 2480.0f},
                                                 {270.0f, 2290.0f, 3010.0f},
                                                 {570.0f, 840.0f, 2410.0f},
                                                 {300.0f, 870.0f, 2240.0f}};
        static constexpr float kGain[3] = {1.0f, 0.5f, 0.3f};
        static constexpr float kWidth[3] = {90.0f, 110.0f, 170.0f};
        const float at = t * 4.0f;
        int vowel = static_cast<int>(at);
        if (vowel > 3) vowel = 3;
        const float mix = at - static_cast<float>(vowel);
        for (int n = 1; n <= kHarmonics; ++n) {
          const float hz = kVowelPitch * static_cast<float>(n);
          float gain = 0.02f / (1.0f + (hz / 6000.0f) * (hz / 6000.0f));
          for (int f = 0; f < 3; ++f) {
            const float centre = kit::lerp(kFormant[vowel][f], kFormant[vowel + 1][f], mix);
            const float d = (hz - centre) / kWidth[f];
            gain += kGain[f] / (1.0f + d * d);
          }
          amp_[n] = gain * std::pow(static_cast<float>(n), -0.8f);
        }
        break;
      }
      case 2: {  // Reed to Saw: odd harmonics with a soft top fill in to 1/n.
        for (int n = 1; n <= kHarmonics; ++n) {
          const float fn = static_cast<float>(n);
          const float soft = 1.0f / (1.0f + (fn / 14.0f) * (fn / 14.0f));
          const float reed = ((n & 1) ? 1.0f : 0.08f) * soft / fn;
          amp_[n] = kit::lerp(reed, 1.0f / fn, t);
        }
        break;
      }
      case 3: {  // Hollow: a square whose pulse narrows from 50 % to 12 %.
        const float duty = 0.5f - 0.38f * t;
        for (int n = 1; n <= kHarmonics; ++n) {
          const float fn = static_cast<float>(n);
          amp_[n] =
              std::sin(kit::kPi * fn * duty) / (fn * std::sqrt(1.0f + (fn / 48.0f) * (fn / 48.0f)));
          phase_[n] = 0.25f;
        }
        break;
      }
      default: {  // Spectral: four clusters of harmonics that wander and trade places.
        static constexpr float kCentre[4] = {4.0f, 9.0f, 15.0f, 26.0f};
        static constexpr float kPeak[4] = {1.0f, 0.8f, 0.6f, 0.45f};
        static constexpr float kTurns[4] = {1.0f, 1.0f, 2.0f, 1.0f};
        static constexpr float kStart[4] = {0.10f, 0.55f, 0.30f, 0.80f};
        for (int n = 1; n <= kHarmonics; ++n) {
          const float fn = static_cast<float>(n);
          float gain = 0.0f;
          for (int k = 0; k < 4; ++k) {
            const float centre =
                kCentre[k] *
                (1.0f + 0.45f * std::sin(kit::kTwoPi * (t * kTurns[k] * 0.75f + kStart[k])));
            const float width = 0.2f * kCentre[k] + 0.5f;
            const float level =
                kPeak[k] * (0.55f + 0.45f * std::sin(kit::kTwoPi * (t * 1.25f + kStart[3 - k])));
            const float d = (fn - centre) / width;
            gain += level * std::exp(-d * d);
          }
          amp_[n] = gain * std::pow(fn, -0.3f) * spectral_weight_[n];
          phase_[n] = spectral_phase_[n];
        }
        amp_[1] += 0.6f;  // keeps the pitch anchored
        break;
      }
    }
  }

  void build_tables() {
    fft_.init();
    kit::Rng rng;
    rng.seed(0xC0FFEE11u);
    for (int n = 0; n <= kHarmonics; ++n) {
      spectral_phase_[n] = rng.uniform();
      spectral_weight_[n] = 0.45f + 0.55f * rng.uniform();
    }
    for (int set = 0; set < kSets; ++set) {
      for (int frame = 0; frame < kFrames; ++frame) {
        recipe(set, static_cast<float>(frame) / static_cast<float>(kFrames - 1));
        float power = 0.0f;
        for (int n = 1; n <= kHarmonics; ++n) {
          power += 0.5f * amp_[n] * amp_[n];
          // amp·sin(θ + φ) as the pair of bins n and N - n.
          const float angle = kit::kTwoPi * phase_[n];
          bin_re_[n] = 0.5f * amp_[n] * std::sin(angle);
          bin_im_[n] = -0.5f * amp_[n] * std::cos(angle);
        }
        // Equal loudness along the row, with a ceiling on the peak.
        float gain = power > 0.0f ? kTableRms / std::sqrt(power) : 0.0f;
        for (int level = 0; level < kLevels; ++level) {
          const int top = kHarmonics >> level;
          for (int j = 0; j < kSize; ++j) {
            re_[j] = 0.0f;
            im_[j] = 0.0f;
          }
          for (int n = 1; n <= top; ++n) {
            re_[n] = bin_re_[n];
            im_[n] = bin_im_[n];
            re_[kSize - n] = bin_re_[n];
            im_[kSize - n] = -bin_im_[n];
          }
          fft_.inverse(re_, im_);
          if (level == 0) {
            float peak = 0.0f;
            for (int j = 0; j < kSize; ++j) peak = kit::max(peak, std::fabs(re_[j]));
            if (peak * gain > 0.95f) gain = 0.95f / peak;
          }
          float* out = table_[set][frame][level];
          for (int j = 0; j < kSize; ++j) out[j] = re_[j] * gain;
          out[kSize] = out[0];
        }
      }
    }
  }

  static constexpr float kVowelPitch = 110.0f;

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf filter_[2];
  kit::Smoother position_, motion_, cutoff_, resonance_;  // advanced on the control clock
  kit::Smoother sub_, volume_, near_, far_, filter_gain_;
  kit::LinearRamp table_fade_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float lfo_phase_ = 0.0f;
  float detune_up_ = 1.0f, detune_down_ = 1.0f;
  float last_detune_ = -1.0f;
  int set_ = 0;
  int pending_set_ = 0;
  bool filter_primed_ = false;

  bool tables_ready_ = false;
  kit::Fft<kSize> fft_;
  float re_[kSize] = {};
  float im_[kSize] = {};
  float bin_re_[kHarmonics + 1] = {};
  float bin_im_[kHarmonics + 1] = {};
  float amp_[kHarmonics + 1] = {};
  float phase_[kHarmonics + 1] = {};
  float spectral_phase_[kHarmonics + 1] = {};
  float spectral_weight_[kHarmonics + 1] = {};
  float table_[kSets][kFrames][kLevels][kSize + 1] = {};
};

}  // namespace livemix
