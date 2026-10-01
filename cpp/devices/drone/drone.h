#pragma once

// Drone: sustained tones that never sit still.
//
//   per key (up to 8):
//     partial 1..8 ── sine ► triangle ► saw ──► level, pan ─┐
//       each at root × ratio[shape], with its own slow      │
//       random path for pitch, level and pan                ├─► envelope ─┐
//     sub: sine an octave below the root ───────────────────┤             │
//     air: noise L / R ─► band-pass at the root ────────────┘             │
//                                                                         ▼
//                         out ◄─ soft clip ◄─ volume ◄─ low-pass L / R ◄─ sum
//
// - A key is a root, not a note: Shape chooses the ratios of up to eight
//   partials above it (just intonation where the shape has a third or a
//   fifth). Partials brings the upper ones in one after another, and the sum
//   is held at constant power, so the control changes colour, not loudness.
// - Every partial owns three kit::Drift paths (three incommensurate sines
//   each, seeded and paced differently per partial): one bends its pitch by a
//   few cents, one moves its level, one its pan. Movement is the depth of all
//   of them and Rate their speed; with Movement at 0 the drone is static.
//   The same depth lets the low-pass wander by a third of an octave.
// - Wave morphs every partial from sine through triangle to sawtooth by
//   crossfading single cycles that are built additively at init and stored
//   band-limited per octave; each partial reads the copy whose top harmonic
//   stays under Nyquist for its own pitch, so high partials do not alias.
// - Air is noise through a band-pass on the root, scaled so it is equally
//   loud for low and high roots. Left and right are two noise sources shared
//   by all keys (each key has its own pair of filters), so the air is wide
//   without costing two generators per key.
// - Hold is the latch: with it On, releasing a key leaves its drone
//   sounding; pressing the same key again, or turning Hold Off, releases it.
//   "The same key" is the same note id or the same pitch, whichever the host
//   repeats.
//
// Levels and pans are ramped per sample between control ticks (128 samples),
// so the slow paths never zipper.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Drone : public kit::DeviceBase<drone::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kMaxPartials = 8;
  static constexpr int kShapes = 7;
  static constexpr int kWaves = 3;
  static constexpr int kLevels = 10;
  static constexpr int kSize = 2048;
  static constexpr int kHarmonics = 512;

  // Ratios to the root, in the order Partials brings them in.
  static constexpr float kRatio[kShapes][kMaxPartials] = {
      {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f},                           // Unison
      {1.0f, 2.0f, 1.0f, 4.0f, 2.0f, 8.0f, 4.0f, 16.0f},                          // Octaves
      {1.0f, 1.5f, 2.0f, 3.0f, 4.0f, 6.0f, 8.0f, 12.0f},                          // Fifths
      {1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 8.0f},                           // Harmonic series
      {1.0f, 1.25f, 1.5f, 2.0f, 2.5f, 3.0f, 4.0f, 5.0f},                          // Just major
      {1.0f, 1.2f, 1.5f, 2.0f, 2.4f, 3.0f, 4.0f, 4.8f},                           // Just minor
      {1.0f, 1.125f, 1.5f, 4.0f / 3.0f, 1.2f, 5.0f / 3.0f, 16.0f / 15.0f, 2.0f},  // Cluster
  };

  void init(float sample_rate) {
    using namespace drone;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    if (!tables_ready_) {
      build_tables();
      tables_ready_ = true;
    }
    pool_.reset();
    kit::Rng rng;
    rng.seed(0x6A09E667u);
    uint32_t stream = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      for (int k = 0; k < kMaxPartials; ++k) {
        voice.pitch_drift[k].seed(seed_for(stream++));
        voice.level_drift[k].seed(seed_for(stream++));
        voice.pan_drift[k].seed(seed_for(stream++));
        for (int d = 0; d < 3; ++d) voice.pace[d][k] = 0.6f + 0.8f * rng.uniform();
        // Alternate keys mirror the image so a chord fills both sides.
        voice.pan_base[k] = kPanBase[k] * ((v & 1) ? -1.0f : 1.0f);
      }
      voice.air_drift.seed(seed_for(stream++));
      voice.air_pace = 0.6f + 0.8f * rng.uniform();
    }
    noise_[0].seed(0x510E527Fu);
    noise_[1].seed(0x9B05688Cu);
    start_.seed(0xBB67AE85u);
    filter_drift_.seed(0x3C6EF372u);
    for (int c = 0; c < 2; ++c) filter_[c].reset();
    clock_.reset(kControlPeriod);
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    partials_.set_time(0.05f, control_rate);
    movement_.set_time(0.05f, control_rate);
    width_.set_time(0.05f, control_rate);
    air_.set_time(0.05f, control_rate);
    cutoff_.set_time(0.15f, control_rate);
    wave_.set_time(0.02f, sr);
    sub_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    air_mid_.set_time(kSmoothingSeconds, sr);
    air_side_.set_time(kSmoothingSeconds, sr);
    last_rate_ = -1.0f;
    last_shape_ = -1;
    airy_ = false;
    // Nothing outlives the envelopes but the ringing of the filters.
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace drone;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const float root = kit::min(frequency / sample_rate(), 0.45f);

    if (latching()) {
      // The second press of a key lets its drone go and starts nothing.
      const int sounding = find_key(note_id, root);
      if (sounding >= 0) {
        pool_.voices[sounding].env.gate_off();
        return;
      }
    } else {
      const int held = pool_.find_held(note_id);
      if (held >= 0) pool_.voices[held].env.fast_release(0.05f);
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.root = root;
    voice.gain = 0.35f + 0.65f * gain;
    voice.key_down = true;
    if (!stolen) {
      // A stolen voice keeps running to avoid a click.
      for (int k = 0; k < kMaxPartials; ++k) voice.phase[k] = start_.uniform();
      voice.sub_phase = start_.uniform();
      for (int c = 0; c < 2; ++c) voice.air_band[c].reset();
    }
    const float air_hz = kit::clamp(frequency, 30.0f, 0.4f * sample_rate());
    for (int c = 0; c < 2; ++c) voice.air_band[c].set(air_hz, kAirQ, sample_rate());
    // A band-pass passes π·f/(Q·sr) of white noise's power; undo that.
    voice.air_scale = 1.0f / std::sqrt(kit::kPi * air_hz / (kAirQ * sample_rate()));
    tune(voice);
    update(voice, true);
    if (voice.air_gain > 0.0f) airy_ = true;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    voice.key_down = false;
    if (!latching()) voice.env.gate_off();
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
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      // Wave: 0 sine, 0.5 triangle, 1 saw.
      const float wave = wave_.next() * 2.0f;
      const int shape = wave >= 1.0f ? 1 : 0;
      const float morph = wave - static_cast<float>(shape);
      const float(*from)[kSize + 1] = table_[shape];
      const float(*to)[kSize + 1] = table_[shape + 1];

      const float* sine = table_[0][0];
      const float noise_left = airy_ ? noise_[0].white() : 0.0f;
      const float noise_right = airy_ ? noise_[1].white() : 0.0f;
      float left = 0.0f, right = 0.0f, sub = 0.0f, air_left = 0.0f, air_right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float env = voice.env.next() * voice.gain;
        float sum_left = 0.0f, sum_right = 0.0f;
        for (int k = 0; k < voice.count; ++k) {
          float phase = voice.phase[k] + voice.increment[k];
          if (phase >= 1.0f) phase -= 1.0f;
          voice.phase[k] = phase;
          const float at = phase * scale;
          const int index = static_cast<int>(at);
          const float fraction = at - static_cast<float>(index);
          const float* a = from[voice.mip[k]];
          float sample = a[index] + (a[index + 1] - a[index]) * fraction;
          if (morph > 0.0f) {
            const float* b = to[voice.mip[k]];
            sample += (b[index] + (b[index + 1] - b[index]) * fraction - sample) * morph;
          }
          voice.gain_left[k] += voice.step_left[k];
          voice.gain_right[k] += voice.step_right[k];
          sum_left += sample * voice.gain_left[k];
          sum_right += sample * voice.gain_right[k];
        }
        left += sum_left * env;
        right += sum_right * env;

        voice.sub_phase += voice.root * 0.5f;
        if (voice.sub_phase >= 1.0f) voice.sub_phase -= 1.0f;
        const float sub_at = voice.sub_phase * scale;
        const int sub_index = static_cast<int>(sub_at);
        sub += (sine[sub_index] +
                (sine[sub_index + 1] - sine[sub_index]) * (sub_at - static_cast<float>(sub_index))) *
               env;

        voice.air_gain += voice.air_step;
        if (voice.air_gain > 0.0f || voice.air_step != 0.0f) {
          const float level = voice.air_gain * env;
          air_left += voice.air_band[0].process(noise_left) * level;
          air_right += voice.air_band[1].process(noise_right) * level;
        }
      }

      // Width folds the two noises towards their sum at constant power.
      const float air_mid = (air_left + air_right) * 0.5f * air_mid_.next();
      const float air_side = (air_left - air_right) * 0.5f * air_side_.next();
      const float centre = sub * sub_.next() * kSubGain + air_mid;
      const float volume = volume_.next();
      out_left_[i] =
          kit::soft_clip(filter_[0].lowpass((left + centre + air_side) * kVoiceGain) * volume);
      out_right_[i] =
          kit::soft_clip(filter_[1].lowpass((right + centre - air_side) * kVoiceGain) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // Band-pass biquad with unity gain at its centre (the cookbook's constant
  // peak design): three multiplies, which matters at two per key.
  struct Band {
    float b0 = 0.0f, a1 = 0.0f, a2 = 0.0f;
    float x1 = 0.0f, x2 = 0.0f, y1 = 0.0f, y2 = 0.0f;

    void reset() { x1 = x2 = y1 = y2 = 0.0f; }
    void set(float hz, float q, float sample_rate) {
      const float w = kit::kTwoPi * hz / sample_rate;
      const float alpha = std::sin(w) / (2.0f * q);
      const float inverse = 1.0f / (1.0f + alpha);
      b0 = alpha * inverse;
      a1 = -2.0f * std::cos(w) * inverse;
      a2 = (1.0f - alpha) * inverse;
    }
    float process(float x) {
      const float y = flush_denormal(b0 * (x - x2) - a1 * y1 - a2 * y2);
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    }
  };

  struct Voice {
    kit::Adsr env;
    float phase[kMaxPartials] = {};
    float increment[kMaxPartials] = {};
    float base_increment[kMaxPartials] = {};
    float rolloff[kMaxPartials] = {};
    float gain_left[kMaxPartials] = {};
    float gain_right[kMaxPartials] = {};
    float target_left[kMaxPartials] = {};
    float target_right[kMaxPartials] = {};
    float step_left[kMaxPartials] = {};
    float step_right[kMaxPartials] = {};
    float pan_base[kMaxPartials] = {};
    float pace[3][kMaxPartials] = {};
    int mip[kMaxPartials] = {};
    kit::Drift pitch_drift[kMaxPartials];
    kit::Drift level_drift[kMaxPartials];
    kit::Drift pan_drift[kMaxPartials];
    kit::Drift air_drift;
    Band air_band[2];
    float air_pace = 1.0f;
    float air_scale = 1.0f;
    float air_gain = 0.0f;
    float air_target = 0.0f;
    float air_step = 0.0f;
    float sub_phase = 0.0f;
    float root = 0.0f;
    float gain = 0.0f;
    int count = 0;
    bool key_down = false;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static constexpr int kControlPeriod = 128;
  // One key at velocity 0.7 peaks near -19 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.27f;
  static constexpr float kSubGain = 0.7f;
  static constexpr float kAirGain = 0.9f;
  static constexpr float kAirQ = 5.0f;
  static constexpr float kPitchCents = 7.0f;
  static constexpr float kLevelDepth = 0.7f;
  static constexpr float kPanDepth = 0.6f;
  static constexpr float kFilterOctaves = 0.33f;
  static constexpr float kPanBase[kMaxPartials] = {0.0f, -0.8f, 0.8f, -0.5f, 0.5f, -1.0f, 1.0f, 0.3f};

  bool latching() const { return param(drone::kHold) >= 0.5f; }

  // An unrelated seed per stream. Seeding one xorshift from the next output
  // of another would hand out the same sequence one step apart.
  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  // The sounding (not releasing) voice of this key: same id, or same pitch.
  int find_key(int note_id, float root) const {
    const int by_id = pool_.find_held(note_id);
    if (by_id >= 0) return by_id;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (!voice.active() || voice.releasing()) continue;
      if (std::fabs(voice.root - root) <= 0.0005f * root) return v;
    }
    return -1;
  }

  // Partial pitches for the current shape, and which band-limited copy each
  // reads: level k holds 512 >> k harmonics, safe up to an increment of
  // 2^k / 1024. The margin covers the pitch drift.
  void tune(Voice& voice) const {
    const int shape = kit::clamp_int(static_cast<int>(param(drone::kShape) + 0.5f), 0, kShapes - 1);
    for (int k = 0; k < kMaxPartials; ++k) {
      const float ratio = kRatio[shape][k];
      const float increment = voice.root * ratio;
      // A partial that would pass Nyquist is left out.
      voice.base_increment[k] = increment < 0.45f ? increment : 0.0f;
      voice.rolloff[k] = increment < 0.45f ? 1.0f / std::sqrt(ratio) : 0.0f;
      const float octave =
          std::log2(kit::max(increment, 1.0e-6f) * 1.01f * static_cast<float>(2 * kHarmonics));
      voice.mip[k] = kit::clamp_int(static_cast<int>(std::ceil(octave)), 0, kLevels - 1);
    }
  }

  // One control step of a voice: advance its paths and aim every partial's
  // pitch, level and pan. `snap` lands on the targets at once (note-on).
  void update(Voice& voice, bool snap) {
    const float movement = movement_.value;
    const float width = width_.value;
    // Partials 0..1 brings partials 2..8 in one at a time.
    const float reach = 1.0f + 7.0f * partials_.value;
    float power = 0.0f;
    float weight[kMaxPartials];
    for (int k = 0; k < kMaxPartials; ++k) {
      weight[k] = kit::clamp(reach - static_cast<float>(k), 0.0f, 1.0f) * voice.rolloff[k];
      power += weight[k] * weight[k];
    }
    const float norm = power > 0.0f ? 1.0f / std::sqrt(power) : 0.0f;
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    int count = 0;
    for (int k = 0; k < kMaxPartials; ++k) {
      // A partial that is out and stays out keeps its paths where they are.
      if (weight[k] <= 0.0f && voice.target_left[k] == 0.0f && voice.target_right[k] == 0.0f) {
        voice.gain_left[k] = voice.gain_right[k] = 0.0f;
        voice.step_left[k] = voice.step_right[k] = 0.0f;
        continue;
      }
      const float pitch = voice.pitch_drift[k].next(kControlPeriod);
      const float level = voice.level_drift[k].next(kControlPeriod);
      const float pan = voice.pan_drift[k].next(kControlPeriod);
      // A few cents: 2^(c/1200) is 1 + c·ln2/1200 to well under a hundredth of a cent.
      voice.increment[k] =
          voice.base_increment[k] * (1.0f + movement * kPitchCents * pitch * 0.00057762265f);
      const float gain = weight[k] * norm * kit::max(0.0f, 1.0f + movement * kLevelDepth * level);
      const float place =
          width * kit::clamp(voice.pan_base[k] + movement * kPanDepth * pan, -1.0f, 1.0f);
      const float angle = (place + 1.0f) * 0.125f;  // cycles: 0 left, 0.25 right
      const float aim_left = gain * kit::SineTable::cos_lookup(angle);
      const float aim_right = gain * kit::SineTable::lookup(angle);
      // Land exactly on the last targets before leaving for the new ones.
      voice.gain_left[k] = snap ? aim_left : voice.target_left[k];
      voice.gain_right[k] = snap ? aim_right : voice.target_right[k];
      voice.target_left[k] = aim_left;
      voice.target_right[k] = aim_right;
      voice.step_left[k] = (aim_left - voice.gain_left[k]) * per_sample;
      voice.step_right[k] = (aim_right - voice.gain_right[k]) * per_sample;
      if (gain > 0.0f || voice.gain_left[k] != 0.0f || voice.gain_right[k] != 0.0f) count = k + 1;
    }
    voice.count = count;

    const float air = air_.value * kAirGain * voice.air_scale *
                      kit::max(0.0f, 1.0f + 0.5f * movement * voice.air_drift.next(kControlPeriod));
    voice.air_gain = snap ? air : voice.air_target;
    voice.air_target = air;
    voice.air_step = (air - voice.air_gain) * per_sample;
  }

  // Every 128 samples.
  void control(float sr) {
    using namespace drone;
    partials_.next();
    movement_.next();
    width_.next();
    air_.next();

    const float rate = param(kRate);
    if (rate != last_rate_) {
      last_rate_ = rate;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        for (int k = 0; k < kMaxPartials; ++k) {
          voice.pitch_drift[k].set_rate(rate * voice.pace[0][k], sr);
          voice.level_drift[k].set_rate(rate * voice.pace[1][k], sr);
          voice.pan_drift[k].set_rate(rate * voice.pace[2][k], sr);
        }
        voice.air_drift.set_rate(rate * voice.air_pace, sr);
      }
      filter_drift_.set_rate(rate * 0.77f, sr);
    }
    const int shape = static_cast<int>(param(kShape) + 0.5f);
    const bool reshape = shape != last_shape_;
    last_shape_ = shape;

    bool airy = false;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (reshape) tune(voice);
      update(voice, false);
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
      if (voice.air_gain > 0.0f || voice.air_target > 0.0f) airy = true;
    }
    airy_ = airy;

    const float wander = movement_.value * kFilterOctaves * filter_drift_.next(kControlPeriod);
    const float hz = std::exp2(cutoff_.next() + wander);
    for (int c = 0; c < 2; ++c) filter_[c].set(hz, kit::kSqrtHalf, sr);
  }

  void apply(int id) {
    using namespace drone;
    const float value = param(id);
    switch (id) {
      case kPartials:
        partials_.set(value, primed());
        break;
      case kWave:
        wave_.set(value, primed());
        break;
      case kMovement:
        movement_.set(value, primed());
        break;
      case kSub:
        sub_.set(value, primed());
        break;
      case kAir:
        air_.set(value, primed());
        break;
      case kCutoff:
        cutoff_.set(std::log2(value), primed());
        break;
      case kWidth:
        width_.set(value, primed());
        air_mid_.set(std::sqrt(2.0f - value * value), primed());
        air_side_.set(value, primed());
        break;
      case kHold:
        // Hold Off lets every latched drone go; keys still down stay.
        if (value < 0.5f) {
          for (int v = 0; v < kMaxVoices; ++v) {
            Voice& voice = pool_.voices[v];
            if (voice.active() && !voice.releasing() && !voice.key_down) voice.env.gate_off();
          }
        }
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  // Sine, triangle and sawtooth as sine series (fundamentals in phase, so the
  // crossfades between them never cancel), band-limited per octave.
  void build_tables() {
    fft_.init();
    for (int wave = 0; wave < kWaves; ++wave) {
      for (int level = 0; level < kLevels; ++level) {
        const int top = kHarmonics >> level;
        for (int j = 0; j < kSize; ++j) {
          re_[j] = 0.0f;
          im_[j] = 0.0f;
        }
        for (int n = 1; n <= top; ++n) {
          const float fn = static_cast<float>(n);
          float amp = 0.0f;
          if (wave == 0) {
            amp = n == 1 ? 1.0f : 0.0f;
          } else if (wave == 1) {
            if (n & 1) amp = (((n - 1) / 2) & 1 ? -1.0f : 1.0f) * 8.0f / (kit::kPi * kit::kPi * fn * fn);
          } else {
            amp = ((n & 1) ? 1.0f : -1.0f) * 2.0f / (kit::kPi * fn);
          }
          // amp·sin(n·x) as the pair of bins n and N - n.
          im_[n] = -0.5f * amp;
          im_[kSize - n] = 0.5f * amp;
        }
        fft_.inverse(re_, im_);
        float* out = table_[wave][level];
        for (int j = 0; j < kSize; ++j) out[j] = re_[j];
        out[kSize] = out[0];
      }
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf filter_[2];
  kit::Drift filter_drift_;
  kit::Noise noise_[2];
  bool airy_ = false;
  kit::Smoother partials_, movement_, width_, air_, cutoff_;  // advanced on the control clock
  kit::Smoother wave_, sub_, volume_, air_mid_, air_side_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float last_rate_ = -1.0f;
  int last_shape_ = -1;

  bool tables_ready_ = false;
  kit::Fft<kSize> fft_;
  float re_[kSize] = {};
  float im_[kSize] = {};
  float table_[kWaves][kLevels][kSize + 1] = {};
};

}  // namespace livemix
