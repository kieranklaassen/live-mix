#pragma once

// Staircase: a pad that climbs, or descends, for ever and never arrives.
//
//   per key (up to 16):
//     one phasor ─► partial 0 ─►×2─► partial 1 ─►×2─► ... ─► partial 11
//                     │               │                        │
//                     ▼               ▼                        ▼
//                  each: sine + odd overtones (Shape) × bell weight, panned
//                     └───────────────┴────────────┬───────────┘
//                                                  ▼
//                                   envelope ─► mid / side bus
//
//   all keys ─► left / right ─► chorus (a second set, swept a few cents) ─► volume ─► soft clip
//
// - A key is a stack of partials exactly an octave apart, read from one
//   phasor by doubling its angle, so the octaves can never drift against each
//   other. Partial 0 always lies between 10 and 20 Hz; partial k is 2^k above.
// - The loudness of a partial depends only on where its frequency lies: a
//   raised-cosine bell over log frequency, Span octaves wide, faded out
//   under 40 Hz and above 9 kHz. As the stack rises its top partials fade
//   out and new ones fade in at the bottom. When partial 0 reaches 20 Hz
//   every partial takes the next index up and a new, silent one starts an
//   octave below (the phasor's angle is halved), which changes nothing that
//   sounds: the climb has no seam and no end.
// - Each key has its own bell, and the bell follows the key by half: it is
//   centred on Centre at middle C and half an octave higher for a key an
//   octave higher. The C of every octave is the same stack of partials, and
//   under one bell for all they would be one sound: this is what makes a
//   higher key sound higher. The bell is set by the key that was played and
//   stays there while the stack climbs through it.
// - The weights of a key are scaled to constant power, so neither the climb
//   nor Centre, Span or Shape changes the loudness.
// - Motion. Glide moves every stack without stop. Semitones moves them a
//   twelfth of an octave at each step. Both use one position for the whole
//   instrument, so a chord moves together. Chord gives each key its own
//   walk: at each step a key moves to the next pitch class above (or below)
//   that a held key is on, so every sounding pitch stays on a held note. In
//   Chord a key sounds every third octave only (and the bell is at least
//   four octaves wide, so one of them is always inside it): a full stack of
//   octaves that moved from one chord note to another would sound the same
//   chord as before, and with one key held nothing would be heard to move.
//   One key alone steps an octave at a time, and with three octaves between
//   its partials that reads as a climb: low, middle, high and round again
//   (with two octaves between them an octave up and an octave down were the
//   same step, and rising and falling the same sound).
// - A jump is taken apart into whole octaves and a rest of at most half an
//   octave. Whole octaves move nothing (the stack is the same an octave on):
//   only the weights change. The rest moves the partials.
// - Weights and pans are computed on the control clock and each one is
//   approached with a time constant of about 5 ms, so steps, wraps and knob
//   jumps never switch a partial on or off at once.
// - Shape adds harmonics 3, 5 and 7 to every partial, as a polynomial in its
//   sine, each faded out before it can reach Nyquist. Their signs are those
//   that make the crests fall together (a peaked wave, not a flattened one).
// - Width puts neighbouring partials of a stack on opposite sides, and each
//   keeps its side as it climbs, so the sound sways from side to side once
//   every two octaves of climb. In Chord, where a key is one or two partials,
//   the whole key sits on one side, not as far out, and a new key takes the
//   side that is lighter then, so a chord is spread over both. The pan is
//   mid/side: the sum of left and right does not depend on Width but for
//   its level.
// - Each voice is tuned a fixed fraction of a cent from the note (0.4
//   cents at most, none for the first), so keys an octave apart, which share
//   every partial, drift slowly against each other instead of cancelling
//   some partials for as long as they are held.
// - Chorus is the whole stack again through two short delays swept by slow
//   sines (up to about 8 cents away), mixed in at constant power, at half
//   the level of the first set at most.
//
// The instrument sleeps when no key sounds. The first key after a silence
// starts the climb from the played note.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Staircase : public kit::DeviceBase<staircase::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr int kPartials = 12;
  enum Motion : int { kGlide = 0, kSemitones = 1, kChord = 2 };

  // Partial 0 of every stack lies in [kBaseHz, 2 kBaseHz) and is silent.
  static constexpr double kBaseHz = 10.0;
  // At Speed 1: an octave in ten seconds, or four steps a second.
  static constexpr double kGlideOctavesPerSecond = 0.1;
  static constexpr double kStepsPerSecond = 4.0;
  // Where the bell is cut off whatever Centre and Span say.
  static constexpr float kLowSilentHz = 20.0f;
  static constexpr float kLowFullHz = 40.0f;
  static constexpr float kHighSilentHz = 18000.0f;
  // Chord: a key sounds every third octave, under a bell at least this wide.
  static constexpr int kSparseOctaves = 3;
  static constexpr float kSparseSpan = 4.0f;
  // How far a key's bell follows the key: half the way, from Centre at middle C.
  static constexpr double kFollow = 0.5;
  static constexpr double kMiddleHz = 261.6255653;
  // The lowest and highest a bell's centre is put, wherever the key is.
  static constexpr float kBellLowHz = 40.0f;
  static constexpr float kBellHighHz = 6400.0f;
  // Pan of a partial at Width 1: 1 would be hard left or right. In Chord a
  // key is one or two partials on one side, and is kept nearer the middle so
  // that a key alone is never more than 6 dB louder on one side.
  static constexpr float kSpread = 0.5f;
  static constexpr float kSparseSpread = 0.3f;
  // The furthest a voice is tuned from its note, in cents.
  static constexpr double kDriftCents = 0.4;

  // Speed to motion: the square keeps the middle of the knob slow.
  static double pace(float speed) { return static_cast<double>(speed) * std::fabs(speed); }

  void init(float sample_rate) {
    using namespace staircase;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(sr);
      // Golden-ratio steps keep any two voices apart; the first is on the note.
      const double step = v * 0.6180339887;
      const double cents = v == 0 ? 0.0 : kDriftCents * (2.0 * (step - std::floor(step)) - 1.0);
      pool_.voices[v].tuning = std::exp2(cents / 1200.0);
    }
    start_.seed(0x5A17CA5Eu);
    period_ = static_cast<int>(sr / 750.0f + 0.5f);
    if (period_ < 1) period_ = 1;
    tick_seconds_ = static_cast<double>(period_) / sr;
    slew_ = 1.0f / (kSlewTicks * static_cast<float>(period_));
    high_silent_hz_ = kit::min(kHighSilentHz, 0.41f * sr);
    bell_low_ = std::log2(kBellLowHz / static_cast<float>(kBaseHz));
    bell_high_ = std::log2(kBellHighHz / static_cast<float>(kBaseHz));
    volume_.set_time(kSmoothingSeconds, sr);
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    apart_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, 0.1f);
    restart();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace staircase;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 20000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // The first key after a silence starts the climb again, on the note.
    if (pool_.count_active() == 0) restart();
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.05f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.key = std::log2(static_cast<double>(frequency) / kBaseHz);
    voice.lean = static_cast<float>(kFollow * (voice.key - std::log2(kMiddleHz / kBaseHz)));
    voice.far = lighter_side_is_far(voice);
    // A pad answers touch gently, and most of it in the lower half.
    voice.gain = 0.35f + 0.65f * std::sqrt(gain);
    voice.walk = 0.0;
    voice.walk_target = 0.0;
    voice.walk_rate = 0.0;
    voice.followed = voice.key + global_;
    voice.octaves = static_cast<int>(std::floor(voice.followed));
    voice.place = voice.followed - voice.octaves;
    if (!stolen) {
      // A fresh key starts anywhere in its cycle, so stacked keys do not add
      // up in phase, and its weights come up from nothing. A stolen voice
      // keeps its phasor turning and its weights move over to the new note.
      const double angle = 6.283185307179586 * static_cast<double>(start_.uniform());
      voice.sine = std::sin(angle);
      voice.cosine = std::cos(angle);
      for (Partial& partial : voice.partial) partial = Partial();
    }
    voice.fresh = true;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    place(voice);
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
    clear_input(frames);  // an instrument ignores its input
    if (arriving_) {
      // Nothing sounded before this note: every knob is where it points.
      volume_.snap(volume_.target);
      dry_.snap(dry_.target);
      wet_.snap(wet_.target);
      apart_.snap(apart_.target);
      arriving_ = false;
    }
    const float sr = sample_rate();
    const float slow_step = kChorusSlowHz / sr;
    const float fast_step = kChorusFastHz / sr;
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      float mid = 0.0f, side = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        // Turn partial 0, then double the angle once per partial.
        double sine = voice.sine * voice.turn_cos + voice.cosine * voice.turn_sin;
        double cosine = voice.cosine * voice.turn_cos - voice.sine * voice.turn_sin;
        voice.sine = sine;
        voice.cosine = cosine;
        float own_mid = 0.0f, own_side = 0.0f;
        for (int k = 0; k <= voice.last; ++k) {
          if ((voice.sounding >> k) & 1u) {
            Partial& partial = voice.partial[k];
            const float x = static_cast<float>(sine);
            const float x2 = x * x;
            // The sine and its harmonics 3, 5 and 7 in one polynomial.
            const float y =
                x * (partial.c[0] + x2 * (partial.c[1] + x2 * (partial.c[2] + x2 * partial.c[3])));
            own_mid += y;
            own_side += y * partial.pan;
            partial.c[0] += partial.dc[0];
            partial.c[1] += partial.dc[1];
            partial.c[2] += partial.dc[2];
            partial.c[3] += partial.dc[3];
            partial.pan += partial.dpan;
          }
          const double doubled = 2.0 * sine * cosine;
          cosine = 1.0 - 2.0 * sine * sine;
          sine = doubled;
        }
        const float level = voice.env.next() * voice.gain;
        mid += own_mid * level;
        side += own_side * level;
      }
      const float left = (mid + side) * kVoiceGain;
      const float right = (mid - side) * kVoiceGain;

      // Chorus: the stack again, from two delays swept by two slow sines.
      slow_phase_ = wrap(slow_phase_ + slow_step);
      fast_phase_ = wrap(fast_phase_ + fast_step);
      float tap[2];
      for (int line = 0; line < 2; ++line) {
        const float sweep =
            kChorusSlowSeconds * kit::SineTable::lookup(slow_phase_ + kChorusSlowOffset * line) +
            kChorusFastSeconds * kit::SineTable::lookup(fast_phase_ + kChorusFastOffset * line);
        tap[line] = chorus_[line].read_linear((kChorusBaseSeconds + sweep) * sr);
      }
      chorus_[0].write(left);
      chorus_[1].write(right);
      const float dry = dry_.next();
      const float wet = wet_.next();
      const float second_right = kit::lerp(tap[0], tap[1], apart_.next());
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((left * dry + tap[0] * wet) * volume);
      out_right_[i] = kit::soft_clip((right * dry + second_right * wet) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // One partial of a key: the polynomial that makes its sine and overtones,
  // already scaled by its weight, its pan, and the step each takes per sample.
  struct Partial {
    float c[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    float pan = 0.0f;
    float dc[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    float dpan = 0.0f;
  };

  struct Voice {
    kit::Adsr env;
    Partial partial[kPartials];
    // Partial 0: its phasor and the turn it takes per sample.
    double sine = 0.0, cosine = 1.0;
    double turn_sin = 0.0, turn_cos = 1.0;
    double key = 0.0;       // the played note, in octaves above kBaseHz
    double followed = 0.0;  // key + the instrument's climb + this key's walk, at the last tick
    double place = 0.0;     // partial 0, in octaves above kBaseHz: [0, 1)
    double walk = 0.0, walk_target = 0.0, walk_rate = 0.0;  // Chord: octaves from the key
    double tuning = 1.0;  // this voice's own fraction of a cent, as a ratio
    float lean = 0.0f;    // how far the played key moves its bell from Centre, in octaves
    bool far = false;     // Chord: the side this key sits on
    // Partial k is (k - octaves) octaves above the note the key is on now.
    int octaves = 0;
    unsigned sounding = 0;  // one bit per partial with a weight or on its way to one
    int last = -1;          // the highest such partial
    float gain = 0.0f;
    bool fresh = false;  // taken, not yet rendered

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    // A voice that has just been taken is loud, whatever its envelope says:
    // the second note of a chord must not steal the first.
    float level() const { return fresh ? 2.0f : env.level(); }
  };

  // One key at gain 0.7 peaks near -21 dBFS at the default volume (near -23
  // with every octave sounding), which is about as loud as it can be with
  // ten held keys still under the soft clip's knee.
  static constexpr float kVoiceGain = 0.14f;
  // Weights approach their targets by 1 / kSlewTicks of the gap per tick.
  static constexpr float kSlewTicks = 4.0f;
  static constexpr float kSettled = 1.0e-6f;
  // How fast the climb moves onto the grid when Motion is switched.
  static constexpr double kSettleOctavesPerSecond = 4.0;
  // Keys closer than this (5 cents) are one rung of the chord.
  static constexpr double kSameNote = 0.004;
  // Levels of harmonics 3, 5 and 7 at Shape 1.
  static constexpr float kThird = 0.55f, kFifth = 0.35f, kSeventh = 0.22f;
  static constexpr float kChorusBaseSeconds = 0.009f;
  static constexpr float kChorusSlowSeconds = 0.0022f, kChorusFastSeconds = 0.0005f;
  static constexpr float kChorusSlowHz = 0.19f, kChorusFastHz = 0.73f;
  static constexpr float kChorusSlowOffset = 0.25f, kChorusFastOffset = 0.37f;

  static float wrap(float phase) { return phase >= 1.0f ? phase - 1.0f : phase; }
  static float smooth_step(float t) {
    t = kit::clamp(t, 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }
  static double approach(double value, double target, double step) {
    if (value < target) return value + step > target ? target : value + step;
    return value - step < target ? target : value - step;
  }

  // 0 above the top of the audible band, 1 an octave under it.
  float fade_high(float hz) const {
    return smooth_step((high_silent_hz_ - hz) / (0.5f * high_silent_hz_));
  }

  // Chord: which side a new key takes. The lighter of the two as the other
  // keys stand, so that a chord is spread over both; a key alone, or with
  // both sides as heavy, goes by its semitone (odd ones far).
  bool lighter_side_is_far(const Voice& taken) const {
    float near = 0.0f, far = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (&voice == &taken || !voice.env.active()) continue;
      const float weight = voice.gain * (voice.fresh ? 1.0f : voice.env.level());
      (voice.far ? far : near) += weight;
    }
    if (far < near - 1.0e-3f) return true;
    if (near < far - 1.0e-3f) return false;
    // Semitones above kBaseHz: the keys of the equal-tempered scale lie
    // half way between two whole numbers here, as far from a toss-up as can be.
    return (static_cast<long>(std::floor(taken.key * 12.0)) & 1) != 0;
  }

  // Everything that runs on through a silence, put where a first note finds it.
  void restart() {
    global_ = 0.0;
    global_target_ = 0.0;
    global_rate_ = 0.0;
    beat_ = 0.0;
    motion_ = static_cast<int>(param(staircase::kMotion) + 0.5f);
    slow_phase_ = 0.0f;
    fast_phase_ = 0.0f;
    chorus_[0].clear();
    chorus_[1].clear();
    clock_.reset(period_);
    arriving_ = true;
  }

  // Once per control period: move the climb, then put every key where it is.
  void control() {
    using namespace staircase;
    climb();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.fresh = false;
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
      voice.walk = approach(voice.walk, voice.walk_target, voice.walk_rate * tick_seconds_);
      place(voice);
    }
  }

  // The instrument's own position: a glide, or steps on the beat.
  void climb() {
    using namespace staircase;
    const int motion = static_cast<int>(param(kMotion) + 0.5f);
    const double rate = pace(param(kSpeed));
    if (motion != motion_) {
      // Switched while sounding: move onto the grid the new motion keeps.
      motion_ = motion;
      beat_ = 0.0;
      if (motion == kSemitones) global_target_ = std::floor(global_ * 12.0 + 0.5) / 12.0;
      if (motion == kChord) global_target_ = std::floor(global_ + 0.5);
      global_rate_ = kSettleOctavesPerSecond;
    }
    if (motion == kGlide) {
      global_ += kGlideOctavesPerSecond * rate * tick_seconds_;
      global_target_ = global_;
      return;
    }
    const double steps_per_second = kStepsPerSecond * std::fabs(rate);
    beat_ += steps_per_second * tick_seconds_;
    if (beat_ >= 1.0) {
      beat_ -= 1.0;
      // Slide is the share of the step spent moving.
      const double slide_seconds =
          kit::max(param(kSlide) / static_cast<float>(steps_per_second), static_cast<float>(tick_seconds_));
      const int direction = rate > 0.0 ? 1 : -1;
      if (motion == kSemitones) {
        global_target_ += direction / 12.0;
        global_rate_ = std::fabs(global_target_ - global_) / slide_seconds;
      } else {
        walk(direction, slide_seconds);
      }
    }
    global_ = approach(global_, global_target_, global_rate_ * tick_seconds_);
  }

  // Chord: every sounding key moves to the next pitch class in `direction`
  // that a held key is on; a key alone on its pitch class moves an octave.
  void walk(int direction, double slide_seconds) {
    double rung[kMaxVoices];
    int rungs = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (voice.active() && !voice.releasing()) rung[rungs++] = voice.key - std::floor(voice.key);
    }
    if (rungs == 0) return;  // nothing is held: the fading keys stay where they are
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      const double at = voice.key + voice.walk_target;
      double nearest = 1.0;
      for (int r = 0; r < rungs; ++r) {
        double distance = direction > 0 ? rung[r] - at : at - rung[r];
        distance -= std::floor(distance);
        if (distance < kSameNote || distance > 1.0 - kSameNote) distance = 1.0;
        if (distance < nearest) nearest = distance;
      }
      voice.walk_target += direction * nearest;
      voice.walk_rate = std::fabs(voice.walk_target - voice.walk) / slide_seconds;
    }
  }

  // Put a key's stack where the key is now: move partial 0, set its turn,
  // and aim every partial's weight and pan at what the bell gives it there.
  void place(Voice& voice) {
    using namespace staircase;
    const float sr = sample_rate();

    // Whole octaves move nothing; the rest moves the partials.
    const double to = voice.key + global_ + voice.walk;
    const double moved = to - voice.followed;
    voice.followed = to;
    const double whole = std::floor(moved + 0.5);
    voice.octaves += static_cast<int>(whole);
    voice.place += moved - whole;
    if (voice.place >= 1.0) {
      voice.place -= 1.0;
      voice.octaves += 1;
      shift_up(voice);
    } else if (voice.place < 0.0) {
      voice.place += 1.0;
      voice.octaves -= 1;
      shift_down(voice);
    }
    const double base_hz = kBaseHz * std::exp2(voice.place) * voice.tuning;

    // The turn per sample: under 0.006 radians, so three terms are exact.
    const double w = 6.283185307179586 * base_hz / sr;
    const double w2 = w * w;
    voice.turn_sin = w * (1.0 - w2 * (1.0 / 6.0) * (1.0 - w2 * (1.0 / 20.0)));
    voice.turn_cos = 1.0 - w2 * 0.5 * (1.0 - w2 * (1.0 / 12.0) * (1.0 - w2 * (1.0 / 30.0)));
    // Keep the phasor on the unit circle.
    const double trim = 1.5 - 0.5 * (voice.sine * voice.sine + voice.cosine * voice.cosine);
    voice.sine *= trim;
    voice.cosine *= trim;

    // The bell, the band limits and the pan, for the partials inside the bell.
    const bool sparse = motion_ == kChord;
    const float span = sparse ? kit::max(param(kSpan), kSparseSpan) : param(kSpan);
    // The bell stays where the played key put it, whatever the climb does.
    const float centre = kit::clamp(std::log2(param(kCentre) / static_cast<float>(kBaseHz)) + voice.lean,
                                    bell_low_, bell_high_);
    const float shape = param(kShape);
    const float third = kThird * shape;
    const float fifth = kFifth * shape * shape;
    const float seventh = kSeventh * shape * shape * shape;
    const float spread = (sparse ? kSparseSpread : kSpread) * param(kWidth);
    const float offset = static_cast<float>(voice.place);
    float weight[kPartials][4];
    float pan[kPartials];
    float power = 0.0f;
    float hz = static_cast<float>(base_hz);
    for (int k = 0; k < kPartials; ++k, hz *= 2.0f) {
      const float x = offset + static_cast<float>(k) - centre;
      float bell = 0.0f;
      if (x > -0.5f * span && x < 0.5f * span) bell = 0.5f + 0.5f * kit::SineTable::cos_lookup(x / span);
      // Octaves above the note the key is on: neighbours on opposite sides.
      // In Chord every third one sounds, all on the key's own side.
      const int above = k - voice.octaves;
      if (sparse && above % kSparseOctaves != 0) bell = 0.0f;
      const bool far_side = sparse ? voice.far : (above & 1) != 0;
      bell *= smooth_step((hz - kLowSilentHz) / (kLowFullHz - kLowSilentHz));
      weight[k][0] = bell * fade_high(hz);
      weight[k][1] = bell * third * fade_high(3.0f * hz);
      weight[k][2] = bell * fifth * fade_high(5.0f * hz);
      weight[k][3] = bell * seventh * fade_high(7.0f * hz);
      // A partial on its way out keeps the side it had.
      pan[k] = bell > 0.0f ? (far_side ? -spread : spread) : voice.partial[k].pan;
      power += weight[k][0] * weight[k][0] + weight[k][1] * weight[k][1] + weight[k][2] * weight[k][2] +
               weight[k][3] * weight[k][3];
    }
    // Constant power, the side's share counted in.
    const float scale = power > 1.0e-9f ? 1.0f / std::sqrt(power * (1.0f + spread * spread)) : 0.0f;

    voice.sounding = 0;
    voice.last = -1;
    for (int k = 0; k < kPartials; ++k) {
      Partial& partial = voice.partial[k];
      const float* h = weight[k];
      // sin 3x = 3s - 4s³, sin 5x = 5s - 20s³ + 16s⁵, sin 7x = 7s - 56s³ + 112s⁵ - 64s⁷.
      // Harmonics 3 and 7 are taken with the other sign, so that all four
      // crests fall together: the wave is peaked, not flattened, and one key
      // peaks higher for the same loudness (see kVoiceGain).
      const float target[4] = {
          scale * (h[0] - 3.0f * h[1] + 5.0f * h[2] - 7.0f * h[3]),
          scale * (4.0f * h[1] - 20.0f * h[2] + 56.0f * h[3]),
          scale * (16.0f * h[2] - 112.0f * h[3]),
          scale * (64.0f * h[3]),
      };
      bool sounding = false;
      for (int j = 0; j < 4; ++j) {
        const float gap = target[j] - partial.c[j];
        if (gap > -kSettled && gap < kSettled) {
          partial.c[j] = target[j];
          partial.dc[j] = 0.0f;
        } else {
          partial.dc[j] = gap * slew_;
        }
        sounding = sounding || partial.c[j] != 0.0f || partial.dc[j] != 0.0f;
      }
      const float pan_gap = pan[k] - partial.pan;
      if (!sounding || (pan_gap > -kSettled && pan_gap < kSettled)) {
        partial.pan = pan[k];
        partial.dpan = 0.0f;
      } else {
        partial.dpan = pan_gap * slew_;
      }
      if (sounding) {
        voice.sounding |= 1u << k;
        voice.last = k;
      }
    }
  }

  // Partial 0 has passed 2 kBaseHz: every partial takes the next index and a
  // silent one starts an octave below, at half the angle.
  static void shift_up(Voice& voice) {
    for (int k = kPartials - 1; k > 0; --k) voice.partial[k] = voice.partial[k - 1];
    voice.partial[0] = Partial();
    // Either half angle doubles back to the same partial 1; take the one
    // that is well conditioned.
    if (voice.cosine >= 0.0) {
      const double half_cos = std::sqrt(0.5 * (1.0 + voice.cosine));
      voice.sine = voice.sine / (2.0 * half_cos);
      voice.cosine = half_cos;
    } else {
      const double half_sin = std::sqrt(0.5 * (1.0 - voice.cosine));
      voice.cosine = voice.sine / (2.0 * half_sin);
      voice.sine = half_sin;
    }
  }

  // Partial 0 has fallen under kBaseHz: it is dropped (it was silent) and
  // partial 1 takes its place.
  static void shift_down(Voice& voice) {
    for (int k = 0; k < kPartials - 1; ++k) voice.partial[k] = voice.partial[k + 1];
    voice.partial[kPartials - 1] = Partial();
    const double doubled = 2.0 * voice.sine * voice.cosine;
    voice.cosine = 1.0 - 2.0 * voice.sine * voice.sine;
    voice.sine = doubled;
  }

  void apply(int id) {
    using namespace staircase;
    const float value = param(id);
    switch (id) {
      case kChorus: {
        // The second set joins at constant power, and at half the level of
        // the first at most: two sets as loud as each other cancel whenever
        // they come opposite, and a key that is one partial (Chord) would
        // swell and vanish.
        const float second = value / (1.0f + value);
        const float total = 1.0f / std::sqrt(1.0f + second * second);
        dry_.set(total, primed());
        wet_.set(second * total, primed());
        break;
      }
      case kWidth:
        apart_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::DelayLine<2048> chorus_[2];
  kit::Smoother volume_, dry_, wet_, apart_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  // The climb of the whole instrument, in octaves from the played notes.
  double global_ = 0.0, global_target_ = 0.0, global_rate_ = 0.0;
  double beat_ = 0.0;  // the share of a step that has passed
  double tick_seconds_ = 0.0;
  int motion_ = kChord;
  int period_ = 64;
  float slew_ = 0.0f;
  float high_silent_hz_ = kHighSilentHz;
  float bell_low_ = 2.0f, bell_high_ = 9.3f;  // the limits of a bell's centre, in octaves above kBaseHz
  float slow_phase_ = 0.0f, fast_phase_ = 0.0f;
  bool arriving_ = true;
};

}  // namespace livemix
