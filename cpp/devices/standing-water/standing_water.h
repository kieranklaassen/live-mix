#pragma once

// Standing Water: a pool is shaken, and past a threshold a standing pattern
// rises on it at half the shaking, which is the pitch of the key.
//
//   Shake, velocity - Threshold ─► amplitude equations of up to six waves
//   key struck ─► push ───────────►   gain, loss, cross saturation by angle,
//   Unrest ─► uneven gain ────────►   noise to start from
//                                       │ amplitudes
//   Drift, Stray ─► centre of each ear ─┤
//   Circle ─► radius                    ▼
//                      the surface read on a circle, as harmonics  (water_surface.h)
//                                       │
//                      height / slope / caustic ─► pool's colour ─► two-cycle table
//                                                                        │
//   splash: a rising drop, a spray, beads that fall back ────────┐       ▼
//   foam: noise carried on the waves ────────────────────────────┴──► play at f ─► pan ─► volume
//
// - The figure is worked out about 94 times a second for each key (twice
//   as often in its first moments) and played as a table that crosses from one
//   frame to the next in a straight line, so every knob arrives without a
//   step. A frame is made of where the water will be at the end of its
//   stretch: nothing is late.
// - Below the threshold the waves die away, and what is left is the splash and
//   the octave of the shaking itself, trembling. Past it the pitch grows out
//   of the still water in the time Lag names, faster the harder it is shaken.
// - The plain tone beside the figure is a share of the figure's own loudness,
//   so no bend and no small circle hides what the pattern does.
// - A key counts its own stretches in samples, so the sound does not depend on
//   the host's block.

#include "water_surface.h"
#include "params.gen.h"

namespace livemix {

class StandingWater : public kit::DeviceBase<standing_water::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kChunk = 64;
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 12600.0f;
  // Nothing of a figure is summed over this, whatever the rate.
  static constexpr float kTopHz = 15000.0f;
  // Keys over this play from tables half as long.
  static constexpr float kShortTableHz = 250.0f;
  // A frame at rest and one of the first few of a note, in seconds.
  static constexpr float kFrameSeconds = 512.0f / 48000.0f;
  static constexpr int kEarlyFrames = 6;
  // The water is never quite still.
  static constexpr float kStill = 0.005f;
  // Under this a figure let go is over.
  static constexpr float kOver = 1.0e-5f;
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kRestrikeSeconds = 0.08f;
  static constexpr float kVoiceGain = 0.0485f;
  static constexpr float kPan[kMaxVoices] = {0.0f, -0.35f, 0.35f, -0.6f, 0.6f, -0.18f, 0.18f, -0.5f, 0.5f, -0.28f, 0.28f, 0.0f};

  void init(float sample_rate) {
    using namespace standing_water;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    surface_.init();
    const float sr = this->sample_rate();
    pool_.reset();
    for (Voice& voice : pool_.voices) {
      voice = Voice();
      for (int ear = 0; ear < 2; ++ear) {
        for (float& x : table_[ear][0][&voice - pool_.voices]) x = 0.0f;
        for (float& x : table_[ear][1][&voice - pool_.voices]) x = 0.0f;
      }
    }
    start_.seed(0x57A7E12Du);
    volume_.set_time(kSmoothingSeconds, sr);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    frame_samples_ = static_cast<int>(kFrameSeconds * sr * (1.0f / 16.0f) + 0.5f) * 16;
    steal_samples_ = kit::clamp_int(static_cast<int>(kStealSeconds * sr), 1, 100000);
    restrike_samples_ = kit::clamp_int(static_cast<int>(kRestrikeSeconds * sr), 1, 100000);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;
    frequency = kit::clamp(frequency, kMinHz, kit::min(kMaxHz, 0.3f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      fade(again, restrike_samples_);
    }
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    // Drawn as the key is struck: a key that waits on a steal starts inside a
    // block, and what it draws there would hang on the block's length.
    voice.next_seed = scatter(start_.next_u32());
    if (stolen) {
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.pending = true;
      fade(voice, steal_samples_);
      return;
    }
    start(voice, index, frequency, gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) voice.pending = false; else voice.gate = false;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    for (int i = 0; i < frames; ++i) out_left_[i] = out_right_[i] = 0.0f;
    for (int done = 0; done < frames;) {
      const int count = kit::clamp_int(frames - done, 1, kChunk);
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        int at = 0;
        while (at < count && voice.active()) {
          int length = count - at;
          if (voice.fade_left > 0 && voice.fade_left < length) length = voice.fade_left;
          if (voice.stretch_left == 0) next_frame(voice, v);
          if (!voice.sounding) break;
          if (voice.stretch_left < length) length = voice.stretch_left;
          render(voice, v, done + at, length);
          at += length;
          if (voice.fading && voice.fade_left == 0) {
            voice.fading = false;
            voice.sounding = false;
            if (voice.pending) start(voice, v, voice.next_hz, voice.next_gain);
          }
        }
      }
      for (int i = done; i < done + count; ++i) {
        const float volume = volume_.next();
        out_left_[i] = kit::soft_clip(out_left_[i] * volume);
        out_right_[i] = kit::soft_clip(out_right_[i] * volume);
      }
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    bool sounding = false, gate = false;
    float hz = 220.0f, amp = 0.0f, velocity = 0.5f;
    uint32_t phase = 0, increment = 0;   // a whole turn is two cycles
    int size = 1024, shift = 22, bins = 1;
    // The frame that is being left and the one that is being reached.
    int which = 0;
    int stretch = 1, stretch_left = 0, count = 0;
    float level_now = 0.0f;
    float norm = 0.0f, figure = 0.0f;
    // The water.
    float wave[standing_water_dsp::kMaxWaves] = {}, turn[standing_water_dsp::kMaxWaves] = {};
    float unrest[standing_water_dsp::kMaxWaves] = {}, travel[standing_water_dsp::kMaxWaves] = {};
    float age = 0.0f, gone = 0.0f, below = 0.0f, push = 0.0f, push_rate = 1.0f, burst = 0.0f, burst_keep = 0.9f;
    float whisper = 0.0f, tremble = 0.0f;
    float slosh = 0.0f, slosh_turn = 0.0f, slosh_rate = 1.0f, slosh_seconds = 1.0f, swell = 0.0f, trade_turn = 0.0f, fine = 0.0f, glint = 0.0f, glint_seen = 0.0f, glint_mean = 0.0f, surf_turn = 0.0f;
    kit::Drift east, north, other;
    kit::Rng chance, air;
    float below_turn = 0.0f, whisper_turn = 0.0f;
    float radius_scale = 1.0f;
    int colour_stamp = -1;
    float pan_left = 1.0f, pan_right = 1.0f, pan_left_to = 1.0f, pan_right_to = 1.0f;
    // The splash.
    bool drop_on = false, spray_on = false;
    float drop_ring = 0.1f, drop_level = 0.0f, drop_keep = 0.999f, drop_rise = 0.0f, drop_bend = 0.0f, drop_bend_keep = 0.99f;
    float drop_step[2] = {}, drop_gain[2] = {}, drop_phase[2] = {};
    float drop_left = 1.0f, drop_right = 1.0f;
    float spray_level = 0.0f, spray_keep = 0.99f, spray_rise = 0.0f, spray_hz = 1000.0f;
    int beads = 0;
    float bead_gap = 0.1f, bead_wait = 0.0f, bead_force = 0.0f, bead_reach = 3.0f;
    float bead_level = 0.0f, bead_keep = 0.99f, bead_rise = 0.0f, bead_bend = 0.0f, bead_bend_keep = 0.99f;
    float bead_step = 0.0f, bead_phase = 0.0f, bead_left = 1.0f, bead_right = 1.0f;
    kit::Svf spray;
    // The foam.
    float foam = 0.0f, foam_to = 0.0f;
    float side = 0.0f, side_to = 0.0f;  // how far its air differs between the ears
    float air_low = 0.0f, air_low2 = 0.0f, air_pole = 0.9f, air_gain = 1.0f;
    // Going away: fade_left samples, then the waiting note if there is one.
    bool fading = false, pending = false;
    int fade_left = 0;
    float fade_level = 1.0f, fade_step = 0.0f;
    float next_hz = 0.0f, next_gain = 0.0f;
    uint32_t next_seed = 1;

    bool active() const { return sounding || pending; }
    bool releasing() const { return !pending && (!gate || fading); }
    float level() const {
      if (pending) return 0.4f + 0.6f * next_gain;
      return (count < kEarlyFrames ? kit::max(0.4f, level_now) : level_now) * amp * fade_level;
    }
  };

  // A seed drawn from a chance and used as it is would follow in that chance's
  // own steps: every key would wander as the last one does, one draw behind.
  static uint32_t scatter(uint32_t x) {
    x = (x ^ (x >> 16)) * 0x7FEB352Du;
    x = (x ^ (x >> 15)) * 0x846CA68Bu;
    return x ^ (x >> 16);
  }

  static int choice(float value, int count) { return kit::clamp_int(static_cast<int>(value + 0.5f), 0, count - 1); }

  void fade(Voice& voice, int samples) {
    if (voice.fading && voice.fade_left <= samples) return;  // already going sooner
    voice.fading = true;
    voice.fade_left = samples;
    voice.fade_step = voice.fade_level / static_cast<float>(samples);
  }

  // A key in a pool that lies still.
  void start(Voice& voice, int index, float hz, float velocity) {
    using namespace standing_water;
    const float sr = sample_rate();
    read_knobs();
    voice.pending = voice.fading = false;
    voice.fade_left = 0;
    voice.fade_level = 1.0f;
    voice.sounding = voice.gate = true;
    voice.hz = hz;
    voice.velocity = velocity;
    voice.amp = 0.47f + 0.53f * velocity;
    const bool long_table = hz < kShortTableHz;
    voice.size = long_table ? 1024 : 512;
    voice.shift = long_table ? 22 : 23;
    const double turn = 0.5 * static_cast<double>(hz) / static_cast<double>(sr);
    voice.increment = static_cast<uint32_t>(turn * 4294967296.0 + 0.5);
    const float top = kit::min(kTopHz, 0.4f * sr);
    voice.bins = kit::clamp_int(static_cast<int>(top / (0.5f * hz)) + 1, 4, voice.size / 4);
    voice.chance.seed(voice.next_seed);
    voice.phase = voice.chance.next_u32();
    voice.which = 0;
    voice.count = 0;
    voice.stretch_left = 0;
    voice.level_now = 0.0f;
    voice.norm = voice.figure = 0.0f;
    voice.air.seed(scatter(voice.chance.next_u32()));
    for (int j = 0; j < standing_water_dsp::kMaxWaves; ++j) {
      voice.wave[j] = kStill * (1.0f + 0.8f * voice.chance.uniform());
      voice.turn[j] = 0.0f;
      voice.unrest[j] = 0.9f * voice.chance.bipolar();
      voice.travel[j] = (j & 1 ? -1.0f : 1.0f) * (0.16f + 0.5f * voice.chance.uniform());
    }
    voice.age = voice.gone = voice.fine = voice.glint = voice.glint_seen = voice.glint_mean = 0.0f;
    voice.below = 0.0f;
    voice.whisper = 0.0f;
    voice.tremble = 0.0f;
    voice.east.seed(scatter(voice.chance.next_u32()));
    voice.north.seed(scatter(voice.chance.next_u32()));
    voice.other.seed(scatter(voice.chance.next_u32()));
    voice.below_turn = voice.chance.uniform();
    voice.whisper_turn = voice.chance.uniform();
    // A high key is read on a smaller circle: its overtones are near the top.
    voice.radius_scale = kit::clamp(std::pow(300.0f / hz, 0.22f), 0.55f, 1.25f);
    voice.colour_stamp = -1;
    for (int ear = 0; ear < 2; ++ear) {
      for (float& x : table_[ear][0][index]) x = 0.0f;
    }

    // The splash: what is thrown in and how hard.
    // A key that stays under its threshold is never left without one.
    const float stone = stone_;
    const float under = kit::clamp(-2.0f * past_threshold(velocity), 0.0f, 1.0f);
    const float least = 0.28f * under;
    const float splash = least + (1.0f - least) * param(kSplash);
    const float force = std::pow(splash, 1.1f) * (0.25f + 0.75f * velocity);
    voice.push = kPush * force * (0.75f + 0.4f * stone);
    voice.push_rate = 1.0f / (0.003f + 0.07f * stone * stone);
    voice.burst = 1.3f * force;
    const float burst_seconds = 0.05f + 1.0f * stone * stone;
    voice.burst_keep = burst_seconds;
    // The pool slops after it: a pin sets off a quick short tremble, a boulder
    // a slow and heavy roll.
    voice.slosh = 1.5f * force * (0.6f + 0.75f * stone);
    voice.slosh_turn = 0.0f;
    voice.trade_turn = voice.chance.uniform() * 0.6f;
    voice.surf_turn = voice.chance.uniform() * 0.5f;
    voice.slosh_rate = (8.0f * std::pow(0.11f, stone)) * (0.92f + 0.16f * voice.chance.uniform());
    voice.slosh_seconds = (0.6f + 3.0f * stone) * (1.5f - thickness_);
    voice.swell = 0.6f * voice.chance.bipolar();
    voice.drop_on = force > 0.0f;
    voice.drop_level = 3.05f * force / (1.0f + 0.9f * force) * (1.5f - 0.5f * stone);
    const float ring = 0.05f * std::pow(11.0f, stone) * (1.5f - thickness_);
    voice.drop_ring = ring;
    voice.drop_keep = kit::time_to_coeff(ring, sr);
    voice.drop_rise = 0.0f;
    voice.drop_bend = -(0.16f + 0.34f * stone);
    voice.drop_bend_keep = kit::time_to_coeff(ring * 0.55f, sr);
    // A pin lands three octaves over the key, a boulder one under it; never
    // over 4 kHz.
    float octave = 3.0f - 4.0f * stone;
    const float highest = std::log2(4000.0f / hz);
    if (octave > highest) octave = kit::max(highest, 0.0f);
    const float low = std::floor(octave), part = octave - low;
    voice.drop_step[0] = hz * std::exp2(low) / sr;
    voice.drop_step[1] = kit::min(hz * std::exp2(low + 1.0f), 9000.0f) / sr;
    voice.drop_gain[0] = (1.0f - part);
    voice.drop_gain[1] = part * 0.8f;
    voice.drop_phase[0] = voice.chance.uniform();
    voice.drop_phase[1] = voice.chance.uniform();
    const float place = voice.chance.bipolar() * width_ * 0.7f;
    kit::pan_gains(place, &voice.drop_left, &voice.drop_right);
    voice.spray_on = force > 0.0f;
    voice.spray_level = force * (0.4f + 0.6f * velocity) * 1.1f;
    voice.spray_keep = kit::time_to_coeff(0.012f + 0.11f * stone, sr);
    voice.spray_rise = 0.0f;
    voice.spray.reset();
    voice.spray_hz = kit::clamp(hz * std::exp2(octave) * 2.0f, 400.0f, 5600.0f);

    // What was thrown up falls back: a few beads, each on an overtone of the
    // key, sparser as they go. Thick water lets go of none.
    voice.beads = static_cast<int>(7.5f * splash * (1.1f - 0.7f * stone) * (1.15f - thickness_) * (1.1f - 0.5f * thickness_) + 0.4f);
    voice.bead_gap = 0.07f + 0.3f * stone;
    voice.bead_wait = voice.bead_gap * (1.0f + voice.chance.uniform());
    voice.bead_force = kBead * force;
    voice.bead_level = 0.0f;
    voice.bead_reach = 2.0f + 4.0f * (1.0f - stone);

    const float pole_hz = kit::clamp(hz * 0.45f, 30.0f, 500.0f);
    voice.air_pole = std::exp(-kit::kTwoPi * pole_hz / sr);
    voice.air_gain = std::sqrt(7000.0f / pole_hz);
    voice.air_low = voice.air_low2 = 0.0f;
    voice.foam = voice.foam_to = 0.0f;
    float pan_left, pan_right;
    place_key(index, 0.0f, &pan_left, &pan_right);
    voice.pan_left = voice.pan_left_to = pan_left;
    voice.pan_right = voice.pan_right_to = pan_right;
  }

  void place_key(int index, float tip, float* left, float* right) const {
    kit::pan_gains((kPan[index] * (reading_ == standing_water_dsp::kSlope ? 0.3f : 1.0f) + tip) * width_, left, right);
    *left *= 1.41421356f;
    *right *= 1.41421356f;
  }

  // How a pool colours what is under `hz`: its own body, and what the water
  // swallows. Worked out again for a key when a knob of it moved.
  void colour(Voice& voice, int index) {
    using namespace standing_water_dsp;
    if (voice.colour_stamp == colour_stamp_) return;
    voice.colour_stamp = colour_stamp_;
    float* gain = colour_[index];
    const float thick = thickness_;
    // Thin water lets ripples live; oil keeps the first few. A soft hand
    // raises fewer of them than a hard one.
    const float hand = voice.velocity - 0.7f;
    static constexpr float kDull[kReadings] = {0.15f, 0.0f, 0.0f};
    static constexpr float kFigureDull[kReadings] = {0.4f, 1.0f, 1.0f};
    static constexpr float kCorner[kReadings] = {2100.0f, 3600.0f, 8000.0f};
    static constexpr float kThin[kReadings] = {0.0f, 650.0f, 0.0f};
    const float swallow = kit::max(0.0f, 0.005f - 0.35f * hand + 0.15f * thick + 0.5f * thick * thick * thick + kDull[reading_] + kFigureDull[reading_] * kFigures[pattern_].dull);
    const float corner = kCorner[reading_] * std::pow(0.2f, thick) * (1.0f + 0.7f * hand);
    const float thin = kThin[reading_];
    const int pool = pool_choice_;
    for (int k = 0; k < voice.bins; ++k) {
      const float n = 0.5f * static_cast<float>(k);
      const float hz = n * voice.hz;
      const float over = hz / corner;
      const float order = n > 1.0f ? n - 1.0f : 0.0f;
      float g = 1.0f / ((1.0f + swallow * order) * (1.0f + over * over));
      g *= 1.0f + 2.8f * layers_ * n * n / (n * n + 60.0f);
      if (thin > 0.0f) g *= hz * hz / (hz * hz + thin * thin) / (1.0f + over * over);
      if (pool == kRound) {
        g *= 0.7f + 1.0f * hump(hz, 380.0f, 0.6f) + 0.3f * hump(hz, 1500.0f, 0.5f);
      } else if (pool == kLong) {
        g *= 0.015f + 0.4f * hump(hz, 400.0f, 0.12f) + 2.0f * hump(hz, 1350.0f, 0.11f) + 1.5f * hump(hz, 3200.0f, 0.09f);
      } else {
        const float far = hz * (1.0f / 520.0f);
        g *= 2.0f / (1.0f + far * far * 0.8f) + 0.02f;
      }
      gain[k] = g;
    }
  }

  // A resonance of height 1 at `at`, `wide` octaves or so across.
  static float hump(float hz, float at, float wide) {
    const float x = (hz - at) / (wide * (hz + 0.5f * at));
    return 1.0f / (1.0f + x * x);
  }

  // One step of a slow chance with a spread of 1, kept within 2.2 of the middle.
  static void wander(Voice& voice, float* value, float step) {
    const float c = 1.0f - std::exp(-step);
    *value += (std::sqrt(3.0f * (2.0f - c) / c) * voice.chance.bipolar() - *value) * c;
    *value = kit::clamp(*value, -2.2f, 2.2f);
  }

  // How far a touch takes the shaking past the threshold, or short of it.
  float past_threshold(float velocity) const {
    const float shaken = shake_ * (0.3f + 0.7f * velocity) * 1.12f;
    return kit::clamp(2.6f * (shaken - 0.68f * threshold_), -1.8f, 2.6f);
  }

  // The water, `dt` later. Returns how far past its threshold it stands.
  float move_water(Voice& voice, float dt) {
    using namespace standing_water;
    using namespace standing_water_dsp;
    const Figure& figure = kFigures[pattern_];
    const float full = voice.gate ? past_threshold(voice.velocity) : kit::clamp(-1.77f * threshold_, -1.8f, 0.0f);
    const float grow = kit::max(0.01f, param(kLag) * (1.0f / 10.0f));  // seconds
    // The shaking takes hold over the first half of the lag.
    voice.age += dt;
    const float into = voice.age / (0.5f * param(kLag));
    const float hold_on = into * into / (1.0f + into * into);
    const float excess = voice.gate ? -0.5f + (full + 0.5f) * hold_on : full;
    const float ring = 11.0f * std::pow(0.012f, thickness_);            // to -60 dB, with no drive
    const float calm = param(kCalm);
    const float share = 1.0f + static_cast<float>(figure.waves - 1) * 0.5f * (figure.side + figure.far);
    const int steps = kit::clamp_int(static_cast<int>(dt / 0.006f + 0.5f), 1, 8);
    const float h = dt / static_cast<float>(steps);
    const float wobble = 1.0f - std::exp(-h * 11.0f * std::pow(param(kDrift), 0.5f));
    const float wobble_noise = std::sqrt(3.0f * (2.0f - wobble) / wobble);  // a spread of 1
    for (int s = 0; s < steps; ++s) {
      const float pushed = voice.push * (1.0f - std::exp(-h * voice.push_rate));
      voice.push = settle_to_zero(voice.push - pushed);
      float next[kMaxWaves];
      for (int j = 0; j < figure.waves; ++j) {
        const float a = voice.wave[j];
        voice.unrest[j] += (wobble_noise * voice.chance.bipolar() - voice.unrest[j]) * wobble;
        float hold = a * a;
        for (int m = 1; m < figure.waves; ++m) {
          const int k = j + m < figure.waves ? j + m : j + m - figure.waves;
          const float turn = figure.chase == 0.0f ? 0.0f : (m * 2 < figure.waves ? figure.chase : (m * 2 > figure.waves ? -figure.chase : 0.0f));
          hold += ((m == 1 || m == figure.waves - 1 ? figure.side : figure.far) + turn) * voice.wave[k] * voice.wave[k];
        }
        const float fed = excess + unrest_ * 0.8f * voice.unrest[j] * (excess > 0.0f ? 0.35f + excess : 0.35f);
        const float up = excess > 0.0f ? kit::max(fed, 0.0f) / grow : 0.0f;
        const float lost = voice.gate ? (excess > 0.0f ? kit::max(-fed, 0.0f) / grow : 6.9f / ring * (1.0f + 0.5f * kit::max(0.0f, -full)))
                                      : 6.9f / kit::min(calm, 20.0f);
        const float held = voice.gate && excess > 0.0f ? hold / grow : hold * 0.4f;
        next[j] = a * (1.0f + h * up) / (1.0f + h * (lost + held));
      }
      for (int j = 0; j < figure.waves; ++j) {
        const float floor = voice.gate ? kStill * (1.0f + 0.5f * voice.unrest[j] * voice.unrest[j]) : 0.0f;
        voice.wave[j] = settle_to_zero(kit::max(next[j], floor) + pushed * (1.0f + 0.35f * voice.unrest[j] * voice.unrest[j]) / std::sqrt(share));
      }
      for (int j = figure.waves; j < kMaxWaves; ++j) voice.wave[j] = settle_to_zero(voice.wave[j] * (1.0f - kit::min(0.5f, h * 8.0f)) + (voice.gate ? kStill * 0.1f : 0.0f));
    }
    float energy = 0.0f;
    for (int j = 0; j < figure.waves; ++j) energy += voice.wave[j] * voice.wave[j];
    const float strength = std::sqrt(energy * share / static_cast<float>(figure.waves));
    // The second halving wakes behind the first and goes with it.
    const float below_to = param(kBelow) * kit::clamp((strength - 0.25f) * 2.0f, 0.0f, 1.0f);
    const float below_rate = below_to > voice.below ? 1.0f / (0.15f + 3.0f * grow) : 4.0f;
    voice.below += (below_to - voice.below) * (1.0f - std::exp(-dt * below_rate));
    if (voice.below < 1.0e-5f) voice.below = 0.0f;
    // The drive's octave, heard while the figure is not.
    const float whisper_to = voice.gate ? (0.04f + 0.28f * shake_) / (1.0f + 0.9f * kit::max(0.0f, -full)) * (1.0f - kit::min(0.97f, strength * 1.5f)) : 0.0f;
    const float whisper_rate = voice.gate ? 9.0f : 6.9f / kit::min(calm, 2.0f);
    voice.whisper = settle_to_zero(voice.whisper + (whisper_to - voice.whisper) * (1.0f - std::exp(-dt * whisper_rate)));
    wander(voice, &voice.tremble, dt * 16.0f);
    wander(voice, &voice.swell, dt * 5.5f * std::pow(param(kDrift), 0.55f));
    return strength;
  }

  // The stretch is over: what was reached is left, and where the water will be
  // at the end of the next stretch is worked out.
  void next_frame(Voice& voice, int index) {
    using namespace standing_water;
    using namespace standing_water_dsp;
    const float sr = sample_rate();
    read_knobs();
    // Short stretches while the splash is new, then one odd one so that the
    // keys of a chord do not all come due in the same block.
    int length = frame_samples_;
    if (voice.count < 4) {
      length = frame_samples_ / 2;
    } else if (voice.count == 4) {
      length = frame_samples_ / 4 + (frame_samples_ / 16) * (index % 12);
    }
    // Asked here and not as it dies away, so that it falls on the same sample
    // whatever the block.
    if (voice.drop_level < 1.0e-6f) voice.drop_on = false;
    if (voice.spray_level < 1.0e-6f) voice.spray_on = false;
    const bool first = voice.count == 0;
    ++voice.count;
    const float dt = static_cast<float>(length) / sr;
    if (voice.spray_on) {
      voice.spray.set(voice.spray_hz * (1.0f + 1.4f * std::exp(-voice.age * 14.0f)), 1.1f, sr);
    }
    if (voice.beads > 0 || voice.bead_level > 0.0f) next_bead(voice, dt);
    if (!voice.gate) {
      // The splash of a key let go comes to rest with the water.
      voice.gone += dt;
      const float rest = param(kCalm);
      if (voice.drop_on) voice.drop_keep = kit::time_to_coeff(kit::min(voice.drop_ring, 0.02f + 0.14f * rest), sr);
      if (voice.gone > 0.4f * rest) voice.beads = 0;
    }

    const float strength = move_water(voice, dt);
    // A figure that dies away does so at the pace of the water, whatever the
    // bend makes of a small one.
    const bool rising = voice.gate && past_threshold(voice.velocity) > 0.0f;
    voice.burst = settle_to_zero(voice.burst * std::exp(-dt / voice.burst_keep));
    const float tone = strength <= 0.0f ? 0.0f : 1.28f * strength / (strength + 0.28f);
    voice.slosh = settle_to_zero(voice.slosh * std::exp(-dt / voice.slosh_seconds));
    voice.slosh_turn += voice.slosh_rate * dt;
    voice.slosh_turn -= std::floor(voice.slosh_turn);
    const float swung = voice.slosh * kit::SineTable::cos_lookup(voice.slosh_turn);
    // It rises as far as it was pushed and sinks half as far.
    const float roll = swung < 0.0f ? 0.5f * swung : swung;
    const Figure& figure = kFigures[pattern_];
    const bool sea = pool_choice_ == kSea;
    voice.trade_turn += 0.9f * figure.pace * std::sqrt(param(kDrift) * 3.3f) * dt;
    voice.surf_turn += 0.34f * dt;
    voice.surf_turn -= std::floor(voice.surf_turn);
    voice.trade_turn -= std::floor(voice.trade_turn);
    const float traded = figure.swing * kit::SineTable::cos_lookup(voice.trade_turn + 0.125f);
    const float surf = sea ? 0.8f * kit::SineTable::lookup(voice.surf_turn) : 0.0f;
    // A long pool tips from end to end.
    const float tip = pool_choice_ == kLong ? kit::SineTable::lookup(voice.surf_turn * 2.0f) : 0.0f;
    static constexpr float kGlint[kReadings] = {0.6f, 0.25f, 1.6f};
    // The rings behind the splash, and the sharpness of the light, come after
    // the figure itself.
    voice.fine += (1.0f - voice.fine) * (1.0f - std::exp(-dt / (0.02f + 0.9f * param(kLag))));
    voice.glint_mean += (voice.glint_seen - voice.glint_mean) * (1.0f - std::exp(-dt * (voice.age < 0.3f ? 30.0f : 0.7f)));
    voice.glint += (voice.glint_seen - voice.glint_mean - voice.glint) * (1.0f - std::exp(-dt * 25.0f));
    const float lean = 1.2f * roll + 0.9f * unrest_ * voice.swell + traded + surf - 0.4f * tip * tip + kGlint[reading_] * (0.3f + 1.0f * stray_) * voice.glint;
    const float rise = std::exp(kit::clamp(lean - 0.35f * figure.swing - (sea ? 0.2f : 0.0f), -2.4f, 0.4f)) * (1.0f + 0.25f * voice.burst);
    // Air on the waves makes them louder: they give way to it.
    voice.foam = voice.foam_to;
    voice.foam_to = 1.8f * foam_ * (0.85f + 0.5f * foam_) + figure.chop + (sea ? 0.3f : 0.0f);
    const float level = settle_to_zero(tone * rise / std::sqrt(1.0f + 0.4f * voice.foam_to * voice.foam_to));

    // The centre of the circle wanders, and so does the second ear's.
    const float reach = 4.0f * stray_ * (0.4f + 0.6f * stray_);
    voice.east.set_rate(param(kDrift), sr);
    voice.north.set_rate(param(kDrift), sr);
    voice.other.set_rate(param(kDrift), sr);
    const float east = voice.east.next(length), north = voice.north.next(length);
    const float other = voice.other.next(length);
    const float stretch_x = pool_choice_ == kLong ? 2.2f : 1.0f;
    static constexpr float kPoolWide[kPools] = {1.0f, 0.35f, 1.7f};
    static constexpr float kReadingWide[kReadings] = {0.5f, 0.2f, 1.35f};
    const float apart = kit::min(1.7f, width_ * figure.wide * kPoolWide[pool_choice_] * kReadingWide[reading_] * (0.3f + 0.9f * stray_));
    Frame& f = frame_;
    f.pattern = pattern_;
    f.reading = reading_;
    f.pool = pool_choice_;
    f.centre[0][0] = reach * east * stretch_x - apart * 0.5f;
    f.centre[0][1] = reach * north - apart * 0.4f * other;
    f.centre[1][0] = reach * east * stretch_x + apart * 0.5f;
    f.centre[1][1] = reach * north + apart * 0.4f * other;
    const float knob = circle_;
    f.radius = (figure.radius_low + (figure.radius_high - figure.radius_low) * knob * (0.45f + 0.55f * knob)) *
               voice.radius_scale * (1.0f + voice.burst) * kit::clamp(1.0f + 0.35f * roll + 0.5f * stray_ * other, 0.4f, 1.8f) * (0.66f + 0.48f * voice.velocity) *
               (0.75f + 0.25f * kit::min(strength, 1.6f));
    f.depth = kit::min(1.0f, depth_ * (0.4f + 0.6f * voice.fine) * (0.8f + 0.2f * kit::min(strength, 1.6f)));
    f.layers = layers_ * voice.fine;
    f.strength = kit::min(strength, 1.6f);
    const float run_on = sea ? 1.0f : 0.0f;
    const float waves = std::sqrt(1.0f + static_cast<float>(figure.waves - 1) * 0.5f * (figure.side + figure.far));
    for (int j = 0; j < kMaxWaves; ++j) {
      // On the open sea every wave travels on; in a pool they only lean.
      voice.turn[j] += run_on * voice.travel[j] * (0.5f + 1.5f * unrest_) * dt;
      voice.turn[j] -= std::floor(voice.turn[j]);
      f.wave[j] = kit::clamp(voice.wave[j] * waves * (1.0f + 0.6f * unrest_ * voice.unrest[j]) *
                                   (1.0f + figure.trade * ((j & 1) ? -0.95f : 0.95f) * kit::SineTable::lookup(voice.trade_turn)),
                               0.0f, 1.8f);
      f.turn[j] = voice.turn[j] + 0.06f * unrest_ * voice.unrest[j] + run_on * 0.25f * static_cast<float>(j);
    }
    f.below = voice.below;
    f.below_turn = voice.below_turn;
    static constexpr float kAnchor[kReadings] = {0.32f, 0.12f, 0.5f};
    static constexpr float kPoolAnchor[kPools] = {1.0f, 0.12f, 1.1f};
    const float flat = 1.0f - f.depth;
    f.anchor = (reading_ == kHeight ? kit::min(figure.anchor, 1.1f) : figure.anchor) * kAnchor[reading_] * kPoolAnchor[pool_choice_] * (1.0f + 1.6f * flat * flat * flat);
    f.whisper = voice.whisper * kit::max(0.05f, 1.0f + 0.6f * voice.tremble);
    f.whisper_turn = voice.whisper_turn;

    colour(voice, index);
    voice.which ^= 1;
    const int to = voice.which;
    // Quick to follow while the figure grows, slow once it stands, so that a
    // growing one does not overshoot and a standing one may still flicker.
    const bool young = voice.age < 1.2f + param(kLag);
    const float follow = first ? 0.0f : std::exp(-dt * (young ? 6.0f : (rising ? 1.6f : 4.0f)));
    surface_.build(f, colour_[index], voice.bins, voice.size, level, follow, young ? 0.82f : 0.6f, &voice.norm, &voice.figure,
                   table_[0][to][index], table_[1][to][index]);
    voice.glint_seen = surface_.glint();
    voice.level_now = kit::max(level, voice.whisper);
    static constexpr float kAirWide[kReadings] = {1.0f, 0.3f, 1.0f};
    voice.side = voice.side_to;
    voice.side_to = width_ * kAirWide[reading_];
    if (first) voice.side = voice.side_to;
    voice.pan_left = voice.pan_left_to;
    voice.pan_right = voice.pan_right_to;
    place_key(index, tip * 0.85f, &voice.pan_left_to, &voice.pan_right_to);
    voice.stretch = voice.stretch_left = length;
    // Let go, and nothing left to hear.
    if (!voice.gate && voice.level_now < kOver && !voice.drop_on && !voice.spray_on && voice.beads == 0 && voice.bead_level == 0.0f && !voice.fading) {
      fade(voice, steal_samples_);
    }
  }

  // Lets the next bead fall when it is due and the one before has rung out.
  void next_bead(Voice& voice, float dt) {
    if (voice.bead_level < 1.0e-5f) voice.bead_level = 0.0f;
    voice.bead_wait -= dt;
    if (voice.beads <= 0 || voice.bead_wait > 0.0f || voice.bead_level > 2.0e-4f) return;
    const float sr = sample_rate();
    --voice.beads;
    voice.bead_wait = voice.bead_gap * (0.8f + 1.4f * voice.chance.uniform());
    voice.bead_gap *= 1.3f;
    const float chance = voice.chance.uniform();
    float over = 1.0f + std::floor(chance * voice.bead_reach + 0.5f);
    if (over * voice.hz > 3600.0f) over = kit::max(1.0f, std::floor(3600.0f / voice.hz));
    voice.bead_step = over * voice.hz / sr;
    voice.bead_phase = 0.0f;
    voice.bead_level = voice.bead_force * (0.45f + 0.55f * voice.chance.uniform());
    voice.bead_force *= 0.8f;
    voice.bead_rise = 0.0f;
    const float ring = (0.018f + 0.03f * stone_) * (1.4f - 0.8f * thickness_);
    voice.bead_keep = kit::time_to_coeff(ring, sr);
    voice.bead_bend = -(0.1f + 0.25f * voice.chance.uniform());
    voice.bead_bend_keep = kit::time_to_coeff(0.4f * ring, sr);
    kit::pan_gains(voice.chance.bipolar() * width_, &voice.bead_left, &voice.bead_right);
  }

  // `count` samples of one key into the output from `at`. None of it crosses
  // the end of a stretch.
  void render(Voice& voice, int index, int at, int count) {
    const float* from_left = table_[0][voice.which ^ 1][index];
    const float* from_right = table_[1][voice.which ^ 1][index];
    const float* to_left = table_[0][voice.which][index];
    const float* to_right = table_[1][voice.which][index];
    const float inverse = 1.0f / static_cast<float>(voice.stretch);
    const int elapsed = voice.stretch - voice.stretch_left;
    const int shift = voice.shift;
    const uint32_t mask = (1u << shift) - 1u;
    const float unit = 1.0f / static_cast<float>(1u << shift);
    const uint32_t start_phase = voice.phase, increment = voice.increment;
    float left[kChunk], right[kChunk];
    for (int i = 0; i < count; ++i) {
      const uint32_t phase = start_phase + increment * static_cast<uint32_t>(i);
      const int p = static_cast<int>(phase >> shift);
      const float t = static_cast<float>(phase & mask) * unit;
      const float mix = static_cast<float>(elapsed + i) * inverse;
      // Cubic weights, the same for both ears and both frames.
      const float t2 = t * t, t3 = t2 * t;
      const float w0 = -0.5f * t3 + t2 - 0.5f * t;
      const float w1 = 1.5f * t3 - 2.5f * t2 + 1.0f;
      const float w2 = -1.5f * t3 + 2.0f * t2 + 0.5f * t;
      const float w3 = 0.5f * t3 - 0.5f * t2;
      const float al = from_left[p] * w0 + from_left[p + 1] * w1 + from_left[p + 2] * w2 + from_left[p + 3] * w3;
      const float ar = from_right[p] * w0 + from_right[p + 1] * w1 + from_right[p + 2] * w2 + from_right[p + 3] * w3;
      const float bl = to_left[p] * w0 + to_left[p + 1] * w1 + to_left[p + 2] * w2 + to_left[p + 3] * w3;
      const float br = to_right[p] * w0 + to_right[p + 1] * w1 + to_right[p + 2] * w2 + to_right[p + 3] * w3;
      left[i] = al + (bl - al) * mix;
      right[i] = ar + (br - ar) * mix;
    }
    voice.phase = start_phase + increment * static_cast<uint32_t>(count);

    // Air of its own: one noise for all would pile up where keys agree.
    const bool foams = voice.foam > 0.0f || voice.foam_to > 0.0f;
    float air[kChunk];
    if (foams || voice.spray_on) {
      for (int i = 0; i < count; ++i) air[i] = voice.air.bipolar() * noise_scale_;
    }
    if (foams) {
      const float step = (voice.foam_to - voice.foam) * inverse;
      float low = voice.air_low, low2 = voice.air_low2;
      const float pole = voice.air_pole, gain = voice.air_gain;
      const float side = 2.0f * voice.side, side_step = 2.0f * (voice.side_to - voice.side) * inverse;
      for (int i = 0; i < count; ++i) {
        low = air[i] + (low - air[i]) * pole;
        low2 = low + (low2 - low) * pole;
        const float foam = (voice.foam + step * static_cast<float>(elapsed + i)) * gain;
        left[i] += left[i] * low * foam;
        right[i] += right[i] * (low + (low2 - low) * (side + side_step * static_cast<float>(elapsed + i))) * foam;
      }
      voice.air_low = flush_denormal(low);
      voice.air_low2 = flush_denormal(low2);
    }
    if (voice.drop_on || voice.spray_on || voice.bead_level > 0.0f) splash(voice, air, count, left, right);

    const float amp = voice.amp * kVoiceGain;
    const float left_step = (voice.pan_left_to - voice.pan_left) * inverse;
    const float right_step = (voice.pan_right_to - voice.pan_right) * inverse;
    float fade_level = voice.fade_level;
    const float fade_step = voice.fading ? voice.fade_step : 0.0f;
    for (int i = 0; i < count; ++i) {
      const float along = static_cast<float>(elapsed + i);
      fade_level -= fade_step;
      const float g = amp * kit::max(fade_level, 0.0f);
      out_left_[at + i] += left[i] * g * (voice.pan_left + left_step * along);
      out_right_[at + i] += right[i] * g * (voice.pan_right + right_step * along);
    }
    if (voice.fading) {
      voice.fade_level = kit::max(fade_level, 0.0f);
      voice.fade_left -= count;
    }
    voice.stretch_left -= count;
  }

  // The drop that closes over what was thrown in, bending up to a note of the
  // key, and the spray.
  void splash(Voice& voice, const float* air, int count, float* left, float* right) {
    const float rise = 1.0f / (0.0025f * sample_rate());
    for (int i = 0; i < count; ++i) {
      float wet = 0.0f;
      if (voice.drop_on) {
        voice.drop_rise = kit::min(1.0f, voice.drop_rise + rise);
        voice.drop_level *= voice.drop_keep;
        voice.drop_bend *= voice.drop_bend_keep;
        const float bend = 1.0f + voice.drop_bend;
        for (int d = 0; d < 2; ++d) {
          wet += voice.drop_gain[d] * kit::SineTable::lookup(voice.drop_phase[d]);
          voice.drop_phase[d] += voice.drop_step[d] * bend;
          if (voice.drop_phase[d] >= 1.0f) voice.drop_phase[d] -= 1.0f;
        }
        wet *= voice.drop_level * voice.drop_rise * voice.drop_rise * (3.0f - 2.0f * voice.drop_rise) * kDropGain;
      }
      float spray = 0.0f;
      if (voice.spray_on) {
        voice.spray_rise = kit::min(1.0f, voice.spray_rise + rise);
        voice.spray_level *= voice.spray_keep;
        spray = voice.spray.bandpass(air[i]) * voice.spray_level * voice.spray_rise;
      }
      float bead = 0.0f;
      if (voice.bead_level > 0.0f) {
        voice.bead_rise = kit::min(1.0f, voice.bead_rise + rise);
        voice.bead_level *= voice.bead_keep;
        voice.bead_bend *= voice.bead_bend_keep;
        bead = kit::SineTable::lookup(voice.bead_phase) * voice.bead_level * voice.bead_rise;
        voice.bead_phase += voice.bead_step * (1.0f + voice.bead_bend);
        if (voice.bead_phase >= 1.0f) voice.bead_phase -= 1.0f;
      }
      left[i] += wet * voice.drop_left * 1.2f + spray + bead * voice.bead_left;
      right[i] += wet * voice.drop_right * 1.2f + spray * 0.8f + bead * voice.bead_right;
    }
  }

  // Knobs as the frames read them. Nothing here needs a smoother: a frame
  // crosses to the next in a straight line.
  void read_knobs() {
    using namespace standing_water;
    using namespace standing_water_dsp;
    const int pool = choice(param(kPool), kPools);
    const int pattern = choice(param(kPattern), kPatterns), reading = choice(param(kReading), kReadings);
    if (pool != pool_choice_ || param(kThickness) != thickness_ || param(kLayers) != layers_ || pattern != pattern_ || reading != reading_) {
      pattern_ = pattern;
      reading_ = reading;
      pool_choice_ = pool;
      thickness_ = param(kThickness);
      layers_ = param(kLayers);
      ++colour_stamp_;
    }
    shake_ = param(kShake);
    threshold_ = param(kThreshold);
    circle_ = param(kCircle);
    depth_ = param(kDepth);
    unrest_ = param(kUnrest);
    stray_ = param(kStray);
    foam_ = param(kFoam);
    width_ = param(kWidth);
    stone_ = std::pow(param(kStone), 0.6f);
  }

  void restart() {
    volume_.snap(volume_.target);
    start_.seed(0x57A7E12Du);
    read_knobs();
  }

  void apply(int id) {
    using namespace standing_water;
    if (id == kVolume) volume_.set(kit::db_to_gain(param(id)), primed());
    if (!primed() || pool_.count_active() == 0) read_knobs();
  }

  static constexpr float kDropGain = 1.1f;
  static constexpr float kPush = 2.2f;
  static constexpr float kBead = 2.4f;

  kit::VoicePool<Voice, kMaxVoices> pool_;
  standing_water_dsp::Surface surface_;
  standing_water_dsp::Frame frame_;
  alignas(16) float table_[2][2][kMaxVoices][standing_water_dsp::kBigTable + standing_water_dsp::kTableSlack] = {};
  float colour_[kMaxVoices][standing_water_dsp::kMaxBins] = {};
  kit::Smoother volume_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float noise_scale_ = 1.0f;
  int frame_samples_ = 1024, steal_samples_ = 240, restrike_samples_ = 3840;
  int pattern_ = 0, reading_ = 0, pool_choice_ = 0, colour_stamp_ = 0;
  float shake_ = 0.5f, threshold_ = 0.2f, circle_ = 0.4f, depth_ = 0.4f, layers_ = 0.3f, thickness_ = 0.3f;
  float unrest_ = 0.3f, stray_ = 0.3f, foam_ = 0.0f, width_ = 0.5f, stone_ = 0.4f;
};

}  // namespace livemix
