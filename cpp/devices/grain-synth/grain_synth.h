#pragma once

// Grain: a granular synthesizer over one loaded sound.
//
//   per key (8):  scan position ─► grain scheduler ─► up to 20 grains ─► envelope ─┐
//                 (Position + Scan)  (Size, Density)    (each: start, rate,          │
//                                                        window, pan)                ├─► tone ─► out
//   sample commit: last output ─► 8 ms fade-out tail ────────────────────────────────┘
//
// - Pitch and time are independent. A grain reads the sound at the key's
//   transposition (middle C, 261.63 Hz, is the original pitch; the stored
//   sound's own sample rate is accounted for). Where grains start moves at
//   Scan times real time whatever the key: 0 holds a moment still, 1 plays
//   the sound through in its own duration. At either end the scan wraps.
// - Density is the number of grains overlapping at once. A new grain starts
//   every Size / Density (with ±15 % jitter so a frozen moment does not buzz
//   at the grain rate), and each is scaled by 1 / sqrt(density · mean window
//   power) so the level stays put as the cloud thickens.
// - A grain that would run off the end of the sound is pulled back so its
//   whole read fits; only a sound shorter than one grain is read around its
//   seam. A reversed grain plays the same stretch backwards.
// - A key starts with a full set of grains already spread through their
//   windows, so Attack is the envelope's time, not the window's.
// - Grain budget: 64 across all keys (two Hermite reads each; that is about
//   5 % of real time in WASM). With more keys than 64 / Density the overlap
//   per key is reduced, and the level normalisation follows.
// - A sample commit overwrites the sound in place, so the grains reading it
//   cannot be faded. They are dropped; the last output value fades out over
//   8 ms instead of stepping to zero, and held keys restart on the new sound
//   under a 10 ms fade-in.
//
// Before anything is loaded the store holds a built-in sound: 4 s of a
// harmonic stack on middle C that brightens to its midpoint and darkens
// again, with a little breath noise, loopable.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class GrainSynth : public kit::DeviceBase<grain_synth::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kGrainsPerVoice = 20;
  static constexpr int kGrainBudget = 64;
  // 21.8 s at 48 kHz, stereo.
  static constexpr int kStoreFrames = 1 << 20;
  static constexpr float kMiddleC = 261.6256f;

  void init(float sample_rate) {
    using namespace grain_synth;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.rng.seed(0x6A09E667u + 0x9E3779B9u * static_cast<uint32_t>(v + 1));
    }
    for (int c = 0; c < 2; ++c) tone_[c].reset();
    tone_hz_.set_time(0.02f, sr / 32.0f);  // advanced on the control clock
    volume_.set_time(kSmoothingSeconds, sr);
    fade_in_.set_time(kCommitFadeSeconds, sr);
    fade_in_.snap(1.0f);
    tail_length_ = static_cast<int>(kTailSeconds * sr);
    tail_count_ = tail_length_;
    tail_left_ = tail_right_ = 0.0f;
    last_left_ = last_right_ = 0.0f;
    clock_.reset(kStretch);
    idle_.reset(sr, 0.1f);
    build_default_sound();
    adopt_store(true);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    control();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace grain_synth;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.02f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.ratio = frequency / kMiddleC;
    voice.gain = 0.35f + 0.65f * gain;
    voice.scan = 0.0;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    plan_grains();
    if (stolen) {
      // The grains of the note it was playing ring out under the new
      // envelope (each is at most one Size long); new ones start at once.
      voice.countdown = 0.0f;
    } else {
      voice.glide = voice.gain;
      fill(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool sounding = pool_.count_active() > 0 || tail_count_ < tail_length_;
    if (!idle_.wake(sounding)) {
      silence_output(frames);
      last_left_ = last_right_ = 0.0f;
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    // Stretches of up to 32 samples that end where the control clock next
    // fires; inside one, each key runs from grain start to grain start, so
    // everything lands on the same sample whatever the host's block size.
    for (int i = 0; i < frames;) {
      if (clock_.counter == 0) control();
      const int until_tick = clock_.period - clock_.counter;
      const int count = frames - i < until_tick ? frames - i : until_tick;
      clock_.counter += count;
      if (clock_.counter >= clock_.period) clock_.counter = 0;

      float mix_left[kStretch], mix_right[kStretch];
      for (int k = 0; k < count; ++k) mix_left[k] = mix_right[k] = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        // The envelope first: it says how many of these samples the key lives.
        float amplitude[kStretch];
        int live = 0;
        for (; live < count; ++live) {
          const float env = voice.env.next();
          if (!voice.env.active()) break;
          voice.glide += (voice.gain - voice.glide) * kLevelGlide;
          amplitude[live] = env * voice.glide;
        }
        float left[kStretch], right[kStretch];
        for (int k = 0; k < live; ++k) left[k] = right[k] = 0.0f;
        for (int done = 0; done < live;) {
          if (voice.countdown <= 0.0f) {
            spawn(voice, 0.0f);
            voice.countdown += interval_ * (1.0f + kJitter * voice.rng.bipolar());
          }
          int run = static_cast<int>(std::ceil(voice.countdown));
          if (run < 1) run = 1;
          if (run > live - done) run = live - done;
          render(voice, run, left + done, right + done);
          voice.countdown -= static_cast<float>(run);
          voice.scan += scan_step_ * run;
          if (voice.scan >= frames_d_) {
            voice.scan -= frames_d_;
          } else if (voice.scan < 0.0) {
            voice.scan += frames_d_;
          }
          done += run;
        }
        for (int k = 0; k < live; ++k) {
          mix_left[k] += left[k] * amplitude[k];
          mix_right[k] += right[k] * amplitude[k];
        }
        if (!voice.env.active()) voice.count = 0;
      }
      for (int k = 0; k < count; ++k) {
        const float fade = fade_in_.next() * kVoiceGain;
        float left = mix_left[k] * fade;
        float right = mix_right[k] * fade;
        if (tail_count_ < tail_length_) {
          const float gain = tail_gain();
          left += tail_left_ * gain;
          right += tail_right_ * gain;
          ++tail_count_;
        }
        last_left_ = left;
        last_right_ = right;
        const float volume = volume_.next();
        out_left_[i + k] = kit::soft_clip(tone_[0].lowpass(left) * volume);
        out_right_[i + k] = kit::soft_clip(tone_[1].lowpass(right) * volume);
      }
      i += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // --- sample entry points --------------------------------------------------------------

  int sample_capacity() { return store_.capacity(); }
  float* sample_buffer() { return store_.buffer(); }

  void sample_commit(int frames, int channels, float rate) {
    store_.commit(frames, channels, rate);
    adopt_store(channels >= 2);
    // The grains were reading what has just been overwritten: drop them and
    // let the last output value fade instead of stepping.
    tail_left_ = last_left_;
    tail_right_ = last_right_;
    tail_count_ = 0;
    if (pool_.count_active() > 0) {
      fade_in_.snap(0.0f);
      fade_in_.set_target(1.0f);
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.count = 0;
      voice.scan = 0.0;
      voice.countdown = 0.0f;
      if (voice.env.active()) fill(voice);
    }
  }

 private:
  // Positions are 32.32 fixed point in the stored sound's frames: the read
  // index is a shift and the fraction a mask, with no float-to-int per sample.
  struct Grain {
    int64_t position = 0;
    int64_t rate = 0;      // stored frames per output sample; negative is backwards
    int age = 0;           // output samples played
    int length = 1;        // output samples in all
    float step = 0.0f;     // 1 / length
    float edge = 0.5f;     // share of the window each fade takes
    float inverse_edge = 2.0f;
    float gain_left = 0.0f;
    float gain_right = 0.0f;
  };

  struct Voice {
    kit::Adsr env;
    kit::Rng rng;
    Grain grains[kGrainsPerVoice];
    int count = 0;           // grains[0, count) are sounding
    float countdown = 0.0f;  // samples until the next grain
    double scan = 0.0;       // how far Scan has moved from Position, in frames
    float ratio = 1.0f;      // key frequency over middle C
    float gain = 0.0f;
    float glide = 0.0f;      // gain, glided so a stolen voice does not step

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  // One key at gain 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 1.6f;
  static constexpr int kStretch = 32;  // the control period
  static constexpr float kJitter = 0.15f;
  static constexpr float kLevelGlide = 0.004f;
  static constexpr float kTailSeconds = 0.008f;
  static constexpr float kCommitFadeSeconds = 0.01f;
  // The built-in sound is made at this rate whatever the device runs at.
  static constexpr float kDefaultRate = 32000.0f;
  static constexpr int kDefaultCycles = 1046;
  static constexpr int kDefaultFrames = 127938;  // 1046 cycles of middle C at 32 kHz
  static constexpr int kDefaultPartials = 16;

  // A sine by rotation: cheap enough to fill the store on every init.
  struct Rotor {
    double c = 1.0, s = 0.0, dc = 1.0, ds = 0.0;
    void start(double phase, double step) {
      c = std::cos(phase);
      s = std::sin(phase);
      dc = std::cos(step);
      ds = std::sin(step);
    }
    double next() {
      const double out = s;
      const double turned = c * dc - s * ds;
      s = s * dc + c * ds;
      c = turned;
      return out;
    }
  };

  // The built-in sound. Every component completes a whole number of cycles
  // in the loop: partial k of middle C turns k · 1046 times on the left and
  // one turn more or fewer on the right (a 0.25 Hz drift between the
  // channels), each partial breathes on its own slow cycle, and the roll-off
  // (and the breath noise with it) opens to the midpoint and closes again.
  void build_default_sound() {
    float* left = store_.channel(0);
    float* right = store_.channel(1);
    const int n = kDefaultFrames;
    const double two_pi = 6.283185307179586;
    const double turn = two_pi / static_cast<double>(n);
    kit::Rng rng;
    rng.seed(0x1F83D9ABu);
    Rotor osc_left[kDefaultPartials], osc_right[kDefaultPartials], swell[kDefaultPartials];
    for (int k = 0; k < kDefaultPartials; ++k) {
      const double phase = two_pi * rng.uniform();
      const double cycles = static_cast<double>((k + 1) * kDefaultCycles);
      osc_left[k].start(phase, turn * cycles);
      osc_right[k].start(phase + 1.5 * rng.bipolar(), turn * (cycles + ((k & 1) ? 1.0 : -1.0)));
      swell[k].start(two_pi * rng.uniform(), turn * static_cast<double>(1 + (k * 3) % 5));
    }
    Rotor opening;
    opening.start(-0.25 * two_pi, turn);
    double low[2] = {0.0, 0.0}, lower[2] = {0.0, 0.0};
    for (int i = 0; i < n; ++i) {
      const double bright = 0.5 + 0.5 * opening.next();
      // Each partial is `rolloff` times the one below: -8 dB per partial
      // closed, -1.1 dB open.
      const double rolloff = 0.40 + 0.48 * bright;
      double level = 1.0, sum_left = 0.0, sum_right = 0.0;
      for (int k = 0; k < kDefaultPartials; ++k) {
        const double amplitude = level * (1.0 + 0.35 * swell[k].next());
        sum_left += amplitude * osc_left[k].next();
        sum_right += amplitude * osc_right[k].next();
        level *= rolloff;
      }
      // Breath: white noise band-limited to roughly 1 to 5 kHz.
      double breath[2];
      for (int c = 0; c < 2; ++c) {
        low[c] += 0.55 * (static_cast<double>(rng.bipolar()) - low[c]);
        lower[c] += 0.18 * (low[c] - lower[c]);
        breath[c] = low[c] - lower[c];
      }
      const double air = 0.05 * bright * bright;
      left[i] = static_cast<float>(kDefaultLevel * sum_left + air * breath[0]);
      right[i] = static_cast<float>(kDefaultLevel * sum_right + air * breath[1]);
    }
    store_.commit(n, 2, kDefaultRate);
  }

  static constexpr double kDefaultLevel = 0.16;
  void adopt_store(bool stereo) {
    // Anything shorter than a Hermite stencil or two is treated as empty.
    frames_ = store_.frames() >= 16 ? store_.frames() : 0;
    frames_d_ = static_cast<double>(frames_);
    stereo_ = stereo;
    rate_scale_ = kit::clamp(store_.sample_rate() / sample_rate(), 1.0f / 64.0f, 64.0f);
  }

  float tail_gain() const {
    if (tail_count_ >= tail_length_) return 0.0f;
    const float t = static_cast<float>(tail_count_) / static_cast<float>(tail_length_);
    return 1.0f - smooth(t);
  }

  // Raised-cosine lookalike for the grain fades: t²(3 - 2t).
  static float smooth(float t) { return t * t * (3.0f - 2.0f * t); }

  double wrap(double position) const {
    if (frames_ == 0) return 0.0;
    position = std::fmod(position, frames_d_);
    return position < 0.0 ? position + frames_d_ : position;
  }

  // Start one grain on `voice`, `phase` of the way through its window.
  void spawn(Voice& voice, float phase) {
    using namespace grain_synth;
    if (frames_ == 0 || voice.count >= kGrainsPerVoice) return;
    Grain& grain = voice.grains[voice.count++];
    kit::Rng& rng = voice.rng;

    float rate = voice.ratio * rate_scale_;
    const float detune = param(kDetune);
    if (detune > 0.0f) rate *= kit::cents_to_ratio(detune * rng.bipolar());
    const float octaves = param(kOctaves);
    const float octave = rng.uniform();
    if (octave < octaves) rate *= octave < 0.5f * octaves ? 2.0f : 0.5f;
    const bool reverse = rng.uniform() < param(kReverse);

    const float length = size_samples_;
    const double span = static_cast<double>(rate) * length;
    const float spray = param(kSpray);
    double start = static_cast<double>(param(kPosition)) * frames_d_ + voice.scan +
                   static_cast<double>(rng.bipolar() * spray * spray * 0.5f) * frames_d_;
    start = wrap(start);
    // Keep the whole read inside the sound when it fits.
    const double room = frames_d_ - 3.0 - span;
    if (room >= 1.0) {
      if (start > room) start = room;
      if (start < 1.0) start = 1.0;
    }
    grain.position = to_fixed(wrap(reverse ? start + span * (1.0 - phase) : start + span * phase));
    grain.rate = to_fixed(reverse ? -static_cast<double>(rate) : static_cast<double>(rate));
    grain.length = static_cast<int>(length);
    grain.age = static_cast<int>(phase * length);
    grain.step = 1.0f / length;
    grain.edge = edge_;
    grain.inverse_edge = 1.0f / edge_;
    kit::pan_gains(param(kSpread) * rng.bipolar(), &grain.gain_left, &grain.gain_right);
    grain.gain_left *= grain_gain_;
    grain.gain_right *= grain_gain_;
  }

  // A full overlap of grains already spread through their windows: what a
  // key that had been held for a while would be playing.
  void fill(Voice& voice) {
    voice.count = 0;
    const float step = 1.0f / density_;
    for (float phase = 0.0f; phase < 0.999f; phase += step) spawn(voice, phase);
    voice.countdown = interval_;
  }

  static constexpr double kFixedOne = 4294967296.0;
  static int64_t to_fixed(double frames) { return static_cast<int64_t>(frames * kFixedOne); }
  static float fraction(int64_t position) {
    return static_cast<float>(static_cast<uint32_t>(position) >> 8) * (1.0f / 16777216.0f);
  }

  // Add `count` output frames of every grain of `voice` to left/right.
  void render(Voice& voice, int count, float* left, float* right) {
    const float* data_left = store_.channel(0);
    const float* data_right = store_.channel(1);
    const int64_t end = static_cast<int64_t>(frames_) << 32;
    for (int g = 0; g < voice.count;) {
      Grain& grain = voice.grains[g];
      const int todo = grain.length - grain.age < count ? grain.length - grain.age : count;
      int64_t position = grain.position;
      const int64_t rate = grain.rate;
      // Where the read is after `todo` samples: if both ends are clear of
      // the sound's edges, nothing in between needs a bounds check.
      const int64_t final_position = position + rate * todo;
      const int64_t low = position < final_position ? position : final_position;
      const int64_t high = position < final_position ? final_position : position;
      const bool inside = (low >> 32) >= 1 && (high >> 32) < frames_ - 3;
      // Locals, so the loop keeps them in registers. The window is
      // smooth(min(phase, 1 - phase) / edge) held at 1: no branches.
      const float step = grain.step;
      const float inverse_edge = grain.inverse_edge;
      const float gain_left = grain.gain_left;
      const float gain_right = grain.gain_right;
      const bool stereo = stereo_;
      float phase = static_cast<float>(grain.age) * step;
      for (int k = 0; k < todo; ++k) {
        const int index = static_cast<int>(position >> 32);
        const float t = fraction(position);
        const float mirrored = 1.0f - phase;
        float ramp = (phase < mirrored ? phase : mirrored) * inverse_edge;
        if (ramp > 1.0f) ramp = 1.0f;
        const float window = smooth(ramp);
        // The Hermite weights depend on the fraction only: work them out
        // once and both channels are four multiplies each.
        const float t2 = t * t;
        const float t3 = t2 * t;
        const float w0 = -0.5f * t3 + t2 - 0.5f * t;
        const float w1 = 1.5f * t3 - 2.5f * t2 + 1.0f;
        const float w2 = -1.5f * t3 + 2.0f * t2 + 0.5f * t;
        const float w3 = 0.5f * (t3 - t2);
        float a, b;
        if (inside) {
          const float* p = data_left + index - 1;
          a = w0 * p[0] + w1 * p[1] + w2 * p[2] + w3 * p[3];
          b = a;
          if (stereo) {
            const float* q = data_right + index - 1;
            b = w0 * q[0] + w1 * q[1] + w2 * q[2] + w3 * q[3];
          }
          position += rate;
        } else {
          const int i0 = index >= 1 ? index - 1 : index - 1 + frames_;
          const int i2 = index + 1 < frames_ ? index + 1 : index + 1 - frames_;
          const int i3 = index + 2 < frames_ ? index + 2 : index + 2 - frames_;
          a = w0 * data_left[i0] + w1 * data_left[index] + w2 * data_left[i2] + w3 * data_left[i3];
          b = stereo ? w0 * data_right[i0] + w1 * data_right[index] + w2 * data_right[i2] + w3 * data_right[i3] : a;
          position += rate;
          if (position >= end || position < 0) {
            position %= end;
            if (position < 0) position += end;
          }
        }
        left[k] += a * window * gain_left;
        right[k] += b * window * gain_right;
        phase += step;
      }
      const int age = grain.age + todo;
      grain.position = position;
      grain.age = age;
      if (age >= grain.length) {
        voice.grains[g] = voice.grains[--voice.count];
      } else {
        ++g;
      }
    }
  }

  // Grain length, spacing and level for the keys now sounding.
  void plan_grains() {
    using namespace grain_synth;
    size_samples_ = kit::max(32.0f, param(kSize) * 0.001f * sample_rate());
    const int sounding = pool_.count_active();
    const float budget = static_cast<float>(kGrainBudget) / static_cast<float>(sounding < 1 ? 1 : sounding);
    density_ = kit::clamp(param(kDensity), 1.0f, budget);
    interval_ = size_samples_ / density_;
    // Shape 0: the two fades meet (a bell). Shape 1: 4 % fades, a flat top.
    edge_ = 0.5f * (1.0f - 0.92f * param(kShape));
    // Mean power of the window, for grains that add incoherently.
    grain_gain_ = 1.0f / std::sqrt(density_ * (1.0f - 1.2571f * edge_));
    scan_step_ = static_cast<double>(param(kScan) * rate_scale_);
  }

  // Every 32 samples.
  void control() {
    using namespace grain_synth;
    plan_grains();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.env.active()) voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
    const float hz = tone_hz_.next();
    for (int c = 0; c < 2; ++c) tone_[c].set(hz, kit::kSqrtHalf, sample_rate());
  }

  void apply(int id) {
    using namespace grain_synth;
    const float value = param(id);
    switch (id) {
      case kTone:
        tone_hz_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or when a grain starts
    }
  }

  kit::SampleStore<kStoreFrames> store_;
  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_[2];
  kit::Smoother tone_hz_, volume_;
  kit::LinearRamp fade_in_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  // What the store holds, cached for the grain reads.
  int frames_ = 0;
  double frames_d_ = 0.0;
  bool stereo_ = false;
  float rate_scale_ = 1.0f;  // stored sample rate over the device's
  // Control-rate values.
  float size_samples_ = 4800.0f;
  float density_ = 4.0f;
  float interval_ = 1200.0f;
  float edge_ = 0.5f;
  float grain_gain_ = 1.0f;
  double scan_step_ = 0.0;
  // The fade-out that replaces dropped grains after a commit.
  float tail_left_ = 0.0f, tail_right_ = 0.0f;
  float last_left_ = 0.0f, last_right_ = 0.0f;
  int tail_count_ = 0;
  int tail_length_ = 1;
};

}  // namespace livemix
