#pragma once

// Overtone Singer: a narrow resonance that stands on one harmonic of a root
// note and moves from harmonic to harmonic, the way an overtone singer picks
// a whistled melody out of a drone by shaping the mouth.
//
//             melody (free-running, seeded) ──► harmonic now, per side
//                                                │
//                                                ▼  centre = Root · harmonic
//   in ─┬─► [band-pass] ─┬─► [band-pass] ─► × (g·r)² ──────┐
//       │                └─► × 2·a·(g·r) ─────────────────(+)─► wet
//       ├─► × a² (the drone) ──────────────────────────────┘
//       └─► dry ───────────────────────────────── Mix ─► out
//                          a = Drone, r = √lift − a, g = the ceiling (1 or less)
//
// - The harmonic series is Root (C to B, in Octave 1 to 4) times 2 to 16.
//   The melody visits the harmonics from Low to High by Pattern, one move
//   every 1 / Pace seconds, and every move is a glide of Glide length, eased
//   at both ends as a mouth moves. A glide is a straight line in harmonic
//   number (so in Hz) under a raised cosine. Moves are counted in samples
//   from init and never look at the sound.
// - The resonance is two peaks in series on the same centre (the two
//   formants an overtone singer brings together). Each is P = a + r·H, with
//   a the Drone knob, H a band-pass of unity gain on the centre and
//   r = √lift − a, so the pair is (a + r·H)² = a² + 2·a·r·H + r²·H², which is
//   what the three paths above add up to, and does to a frequency exactly
//   a² + (lift − a²)·|H|²: the drone's share and the resonance's two-stage
//   curve ADDED, the lift on the centre and a² far from it whatever Drone
//   is, and never less than a² anywhere. With all the Drone the sound around
//   the resonance is whole: no harmonic is turned down as the melody passes.
//   (A sum a²·x + lift·H²(x) would turn the harmonics either side down by 8
//   or 9 dB, the resonance having turned half a turn against the drone there.)
// - Its width is a share of the ROOT, not of its centre: Focus 0 is two
//   roots wide (a broad vowel colour over three harmonics), Focus 1 a
//   twentieth of a root (one harmonic, ringing), the same on every harmonic
//   and at every sample rate (the band-pass's Q is set for the width the
//   bilinear transform leaves it). The lift depends on Focus alone,
//   14.14 / √width, +20 dB at Focus 0 to +36 dB at Focus 1, which keeps a
//   whistle drawn out of noise as loud while Focus narrows it.
// - The ceiling. A lift that size is there for the partials of a dull sound,
//   which lie 30 or 40 dB under its level; on a partial that is already loud
//   it would be a runaway. So the resonant part (everything but the drone's
//   a²·x) is held to a share of the level of the sound coming in NOW: its
//   amplitude to 1 − a²/2 of √2 times the input's root mean square. A lone
//   tone on the centre therefore comes out between unity (Drone 0) and
//   +3.5 dB (Drone 1), whatever Focus is, and a whistle is never louder than
//   the sound it is drawn from (half as loud with all the Drone); a partial
//   30 dB down in a rich sound gets the whole lift.
//   What the ceiling turns down is r, the reach of each peak, to g·r: the
//   pair is then (a + g·r·H)², still a² plus a two-stage curve and still
//   never less than a², only with less lift. (One gain on the whole resonant
//   part would let the harmonics beside the peak dip while it held.) g is
//   the largest that keeps 2·a·g·r·|one stage| + (g·r)²·|two stages| under
//   the share, so the resonant part is under it sample by sample.
//   All the measures are quick, so the ceiling goes with the sound: the
//   input's mean square through two poles of 20 ms (as fast down as up: after
//   a loud hit over a quiet pad it is back in a fifth of a second, and it
//   follows a note that dies away), and the envelope of each band-pass taken
//   from the filter's own three outputs (band squared less low times high),
//   which has no ripple on a single partial and so needs no slow release to
//   keep the gain from buzzing: it is held only 20 ms, so a loud partial
//   under the melody does not duck the note after it. The gain is the
//   same for both sides. Nothing here knows an absolute level: the device
//   does the same at -40 dBFS as at full scale.
// - Spread makes the right side take each note that share of a step after
//   the left: at 1 it is always one note behind, a canon between the sides.
// - Mix is a linear crossfade: wet and dry are in time and coherent. At 0
//   the output is the input, sample for sample.
//
// Sleep and block size. The melody is counted on every sample, asleep too
// (a few integer steps a sample and nothing else), so it is where it would
// be whatever the block size and however long the silence. What the device
// does with a knob moved in a silence is decided on something exact to the
// sample, not on whether the gate had fired: once the input has been exact
// zero and the resonators under the floor for 0.2 s the device is "at rest",
// a knob moved then lands at once, and the first sample of sound after it
// starts from empty filters and followers. The gate sleeps 0.2 s later than
// that, so asleep is always at rest and every smoother has landed.
//
// Storage: four state-variable filters and a few counters. No delay lines.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class OvertoneSinger : public kit::DeviceBase<overtone_singer::kNumParams> {
 public:
  enum Pattern : int { kUpAndDown = 0, kUp, kDown, kWander, kLeap, kHold, kNumPatterns };

  // The resonance's width in roots at Focus 0 and at Focus 1 (-3 dB, both
  // stages), and the lift on its centre: kLift / √width.
  static constexpr float kWidthWide = 2.0f;
  static constexpr float kWidthNarrow = 0.05f;
  static constexpr float kLift = 14.142136f;
  // Two equal band-passes in series are -3 dB at √(√2 − 1) of one's width.
  static constexpr float kStageShare = 0.6435943f;
  // The resonant part's amplitude may reach 1 − kCeilingDrone·a² of √2 times
  // the input's root mean square (of a sine's peak, that is).
  static constexpr float kCeilingDrone = 0.5f;
  // The input's mean square goes through two poles of this, up and down alike.
  static constexpr float kLevelSeconds = 0.02f;
  // The band-passes' envelopes: at once up, this long down.
  static constexpr float kResonanceReleaseSeconds = 0.02f;
  // The reading of how far the ceiling holds is a mean over this.
  static constexpr float kReadingSeconds = 0.03f;
  static constexpr float kRootGlideSeconds = 0.010f;
  // Input past this is not sound: clamped (and what is not a number, dropped).
  // And the ceiling does not take its measure from a sample past
  // kLevelLimit, so a burst of absurd samples does not leave it open.
  static constexpr float kInputLimit = 8.0f;
  static constexpr float kLevelLimit = 4.0f;
  // At rest after this long with no input and the resonators under the
  // floor; the gate sleeps kRestSeconds + kRestMargin after the same moment.
  static constexpr float kRestSeconds = 0.2f;
  static constexpr float kRestMargin = 0.2f;
  // The output is never more than this times the larger filter state.
  static constexpr float kStateGuard = 512.0f;

  static float width_of(float focus) {
    return kWidthWide * std::exp(focus * std::log(kWidthNarrow / kWidthWide));
  }
  static float root_hz(int root, int octave) {
    return kit::midi_to_hz(static_cast<float>(12 * (octave + 1) + root));
  }
  // What the bilinear transform leaves of a band-pass's width on `turn`
  // radians a sample: sin(turn) / turn, as a series (within 0.0005 up to
  // 1.2 radians; the highest centre there is, B in octave 4 times 16, is 1.13
  // at 44.1 kHz). A stage's Q is multiplied by it, so the width in Hz is what
  // Focus says at every sample rate and not a fifth less at the top of 44.1 kHz.
  static float width_kept(float turn) {
    const float t2 = turn * turn;
    return 1.0f - t2 * (1.0f / 6.0f) * (1.0f - t2 * (1.0f / 20.0f) * (1.0f - t2 * (1.0f / 42.0f)));
  }

  void init(float sample_rate) {
    using namespace overtone_singer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      for (kit::Svf& stage : stage_[c]) stage.reset();
      last_position_[c] = -1.0f;
    }
    root_log2_.set_time(kRootGlideSeconds, sr);
    focus_.set_time(kSmoothingSeconds, sr);
    drone_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    level_coeff_ = 1.0f - std::exp(-1.0f / (kLevelSeconds * sr));
    // The envelopes are kept squared, so they fall twice as fast in that measure.
    resonance_decay_ = std::exp(-2.0f / (kResonanceReleaseSeconds * sr));
    reading_coeff_ = 1.0f - std::exp(-1.0f / (kReadingSeconds * sr));
    power_[0] = power_[1] = 0.0f;
    one_power_ = two_power_ = 0.0f;
    held_ = 1.0f;
    rest_samples_ = static_cast<long>(kRestSeconds * sr);
    rest_run_ = rest_samples_;
    resting_ = true;
    idle_.reset(sr, kRestSeconds + kRestMargin);
    random_.seed(0x0E57A1C5u);
    glide_[0] = Glide();
    glide_[1] = Glide();
    glide_samples_ = 1;
    phase_ = 0;
    increment_ = 1;
    lag_ = 0;
    direction_ = 1;
    last_root_log2_ = last_focus_ = kUnset;
    retune_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart_melody();
    held_db_seen_ = 0.0f;
    note_positions();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0 and 1, the harmonic the left and the right resonance stand on now (a
  // fraction while one glides); 2, the harmonic the left one is going to;
  // 3, how far the ceiling holds the resonance down, in dB: what is left of
  // the lift over the drone on the centre, so the pair of peaks does
  // a² + reading·(lift − a²)·|H|² (0 when it holds nothing; a mean over the
  // last 30 ms). All four are kept by process().
  float meter(int index) const {
    if (index == 0) return position_seen_[0];
    if (index == 1) return position_seen_[1];
    if (index == 2) return static_cast<float>(target_);
    if (index == 3) return held_db_seen_;
    return 0.0f;
  }

  // For the harness: whether the gate has fired, and whether a knob moved
  // now would land at once.
  bool asleep() const { return idle_.asleep(); }
  bool at_rest() const { return resting_; }

  void process(int frames) {
    using namespace overtone_singer;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Asleep is at rest: nothing sounds, and only the melody is counted on.
      skip(frames);
      silence_output(frames);
      held_ = 1.0f;
      held_db_seen_ = 0.0f;
      note_positions();
      return;
    }
    const float sr = sample_rate();
    float ring_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = clean(in[0]);
      in[1] = clean(in[1]);
      const bool sound = in[0] != 0.0f || in[1] != 0.0f;
      if (sound && resting_) arrive();

      tick();

      const float root_log2 = root_log2_.next();
      if (root_log2 != last_root_log2_) {
        last_root_log2_ = root_log2;
        root_hz_ = std::exp2(root_log2);
        retune_ = true;
      }
      const float focus = focus_.next();
      if (focus != last_focus_) {
        last_focus_ = focus;
        width_ = width_of(focus);
        root_lift_ = std::sqrt(kLift / std::sqrt(width_));
        retune_ = true;
      }
      for (int c = 0; c < 2; ++c) {
        const float position = glide_[c].value();
        if (position == last_position_[c] && !retune_) continue;
        last_position_[c] = position;
        // The centre as the filter will have it, for the width it keeps there.
        const float centre = kit::clamp(root_hz_ * position, 5.0f, 0.49f * sr);
        stage_[c][0].set(centre, kStageShare * position / width_ * width_kept(kit::kTwoPi * centre / sr), sr);
        stage_[c][1].g = stage_[c][0].g;
        stage_[c][1].k = stage_[c][0].k;
        stage_[c][1].a1 = stage_[c][0].a1;
        stage_[c][1].a2 = stage_[c][0].a2;
        stage_[c][1].a3 = stage_[c][0].a3;
      }
      retune_ = false;

      // Two band-passes in series. A filter's band output squared, less its
      // low output times its high, is the square of the band's envelope: on
      // one partial exactly, wherever it lies (low is the band a quarter turn
      // behind and high a quarter turn ahead, one divided and one multiplied
      // by the same ratio), so there is no ripple to smooth away.
      float one[2];
      float two[2];
      float ring = 0.0f;
      float one_now = 0.0f;
      float two_now = 0.0f;
      for (int c = 0; c < 2; ++c) {
        kit::Svf& first = stage_[c][0];
        kit::Svf& second = stage_[c][1];
        first.process(in[c]);
        one[c] = first.k * first.band;
        second.process(one[c]);
        two[c] = second.k * second.band;
        const float k2 = first.k * first.k;
        const float one_band = first.band * first.band;
        const float two_band = second.band * second.band;
        one_now = kit::max(one_now, k2 * kit::max(one_band, one_band - first.low * first.high));
        two_now = kit::max(two_now, k2 * kit::max(two_band, two_band - second.low * second.high));
        ring = kit::max(ring, kit::max(kit::max(std::fabs(first.ic1), std::fabs(first.ic2)),
                                       kit::max(std::fabs(second.ic1), std::fabs(second.ic2))));
      }

      // The level of the sound coming in, as a mean square, and the two
      // envelopes, squared: at once up, kResonanceReleaseSeconds down.
      float level = kit::max(std::fabs(in[0]), std::fabs(in[1]));
      if (level > kLevelLimit) level = 0.0f;
      power_[0] = flush_denormal(power_[0] + level_coeff_ * (level * level - power_[0]));
      power_[1] = flush_denormal(power_[1] + level_coeff_ * (power_[0] - power_[1]));
      one_power_ = flush_denormal(kit::max(one_now, one_power_ * resonance_decay_));
      two_power_ = flush_denormal(kit::max(two_now, two_power_ * resonance_decay_));

      // The pair of peaks (a + r·H)² is a²·x and, on top of it, the resonant
      // part 2·a·r·H(x) + r²·H²(x). The ceiling is on that part, and what it
      // turns down is the reach r: to g·r, with g the largest for which
      // 2·a·g·r·|H(x)| + (g·r)²·|H²(x)| stays under the share.
      const float a = drone_.next();
      const float through = a * a;
      const float reach = root_lift_ - a;
      const float cross = 2.0f * a * reach;
      const float square = reach * reach;
      const float share = 1.0f - kCeilingDrone * through;
      const float ceiling = share * std::sqrt(2.0f * power_[1]);
      const float one_level = cross * std::sqrt(one_power_);
      const float two_level = square * std::sqrt(two_power_);
      float gain = 1.0f;
      if (one_level + two_level > ceiling) {
        gain = ceiling > 0.0f
                   ? 2.0f * ceiling / (one_level + std::sqrt(one_level * one_level + 4.0f * two_level * ceiling))
                   : 0.0f;
      }
      const float cross_held = gain * cross;
      const float square_held = gain * gain * square;
      // The reading: what is left of the lift over the drone, on the centre.
      held_ += reading_coeff_ * ((cross_held + square_held) / (cross + square) - held_);

      const float mix = mix_.next();
      out_left_[i] = in[0] + mix * (through * in[0] + cross_held * one[0] + square_held * two[0] - in[0]);
      out_right_[i] = in[1] + mix * (through * in[1] + cross_held * one[1] + square_held * two[1] - in[1]);

      // At rest once there has been no input, and nothing ringing that could
      // be heard at any setting, for kRestSeconds. Only sound ends it.
      const float guarded = kStateGuard * ring;
      if (guarded > ring_peak) ring_peak = guarded;
      if (sound) {
        rest_run_ = 0;
      } else if (guarded <= kit::IdleGate::kFloor) {
        if (rest_run_ < rest_samples_ && ++rest_run_ >= rest_samples_) resting_ = true;
      } else if (!resting_) {
        rest_run_ = 0;
      }
    }
    // A gain within a ten-thousandth of one holds nothing: 0 dB, exactly.
    held_db_seen_ = held_ > 0.9999f ? 0.0f : kit::gain_to_db(held_);
    note_positions();
    idle_.settle(kit::max(output_peak(frames), ring_peak), frames);
  }

 private:
  static constexpr float kUnset = -1.0e30f;
  static constexpr uint64_t kStep = uint64_t{1} << 40;

  // One side's place in the series: on its way from `from` to harmonic `to`,
  // `n` samples into a move of `length`.
  struct Glide {
    float from = 2.0f;
    int to = 2;
    int n = 0;
    int length = 1;

    float value() const {
      const float end = static_cast<float>(to);
      if (n >= length) return end;
      const float u = static_cast<float>(n) / static_cast<float>(length);
      return from + (end - from) * (0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * u));
    }
    void land(int harmonic) {
      from = static_cast<float>(harmonic);
      to = harmonic;
      n = length;
    }
    void move(int harmonic, int samples) {
      from = value();
      to = harmonic;
      n = 0;
      length = samples;
    }
  };

  static float clean(float x) {
    if (!(x == x)) return 0.0f;
    return kit::clamp(x, -kInputLimit, kInputLimit);
  }

  int low() const {
    using namespace overtone_singer;
    return to_harmonic(kit::min(param(kLow), param(kHigh)));
  }
  int high() const {
    using namespace overtone_singer;
    return to_harmonic(kit::max(param(kLow), param(kHigh)));
  }
  static int to_harmonic(float value) {
    using namespace overtone_singer;
    return kit::clamp_int(static_cast<int>(std::floor(value + 0.5f)), static_cast<int>(kParamMin[kLow]),
                          static_cast<int>(kParamMax[kHigh]));
  }
  int pattern() const {
    return kit::clamp_int(static_cast<int>(param(overtone_singer::kPattern) + 0.5f), 0, kNumPatterns - 1);
  }
  // A knob moved before the first block, or at rest, lands at once.
  bool lands() const { return !primed() || resting_; }

  // The harmonic the right side is to be on: the left's, taken `spread` of
  // a step late.
  int right_target() const { return phase_ >= lag_ ? target_ : previous_; }

  // One sample of the melody's clock: asleep or awake, the same.
  void tick() {
    phase_ += increment_;
    if (phase_ >= kStep) {
      phase_ -= kStep;
      previous_ = target_;
      target_ = next_harmonic();
      if (target_ != glide_[0].to) glide_[0].move(target_, glide_samples_);
    }
    const int right = right_target();
    if (right != glide_[1].to) glide_[1].move(right, glide_samples_);
    for (Glide& glide : glide_) {
      if (glide.n < glide.length) ++glide.n;
    }
  }

  // `frames` samples of the clock at once, to the same end as that many
  // ticks: the samples on which nothing happens are counted in one go, and
  // each on which a side takes a new note is a tick. The clock is a whole
  // number, so the two ways agree to the sample.
  void skip(int frames) {
    long left = frames;
    while (left > 0) {
      // Ticks until the left side moves, and until the right one takes the
      // left's note if it has not yet.
      uint64_t next = (kStep - phase_ + increment_ - 1) / increment_;
      if (phase_ < lag_ && glide_[1].to != target_) {
        const uint64_t right = (lag_ - phase_ + increment_ - 1) / increment_;
        if (right < next) next = right;
      }
      long plain = next > 0 ? static_cast<long>(next - 1) : 0;
      if (plain > left) plain = left;
      if (plain > 0) {
        phase_ += increment_ * static_cast<uint64_t>(plain);
        for (Glide& glide : glide_) {
          const long n = glide.n + plain;
          glide.n = n < glide.length ? static_cast<int>(n) : glide.length;
        }
        left -= plain;
      }
      if (left > 0) {
        tick();
        --left;
      }
    }
  }

  int next_harmonic() {
    const int lo = low();
    const int hi = high();
    int next = target_;
    switch (pattern()) {
      case kUpAndDown:
        if (next + direction_ > hi) direction_ = -1;
        if (next + direction_ < lo) direction_ = 1;
        next += direction_;
        break;
      case kUp:
        next = next >= hi ? lo : next + 1;
        break;
      case kDown:
        next = next <= lo ? hi : next - 1;
        break;
      case kWander: {
        // To a neighbour, nine times in ten; turned back at either end.
        const float draw = random_.uniform();
        int move = draw < 0.45f ? 1 : (draw < 0.9f ? -1 : 0);
        if (next + move > hi || next + move < lo) move = -move;
        next += move;
        break;
      }
      case kLeap: {
        // Anywhere in the range but where it is.
        const int others = hi - lo;
        if (others > 0) {
          int pick = lo + kit::clamp_int(static_cast<int>(random_.uniform() * static_cast<float>(others)), 0,
                                         others - 1);
          if (pick >= next) ++pick;
          next = pick;
        }
        break;
      }
      default:
        break;
    }
    return kit::clamp_int(next, lo, hi);
  }

  // Where the melody starts: the lowest harmonic, or the highest going Down.
  void restart_melody() {
    target_ = pattern() == kDown ? high() : low();
    previous_ = target_;
    direction_ = 1;
    phase_ = 0;
    glide_[0].land(target_);
    glide_[1].land(target_);
  }

  // Low or High moved: the melody keeps to the new range.
  void keep_to_range() {
    const int lo = low();
    const int hi = high();
    target_ = kit::clamp_int(target_, lo, hi);
    previous_ = kit::clamp_int(previous_, lo, hi);
    place();
  }

  // Send each side where it belongs after a knob moved it there.
  void place() {
    const int wanted[2] = {target_, right_target()};
    for (int c = 0; c < 2; ++c) {
      if (lands()) {
        glide_[c].land(wanted[c]);
      } else if (wanted[c] != glide_[c].to) {
        glide_[c].move(wanted[c], glide_samples_);
      }
    }
  }

  // The first sample of sound after a rest: nothing is left of what was.
  void arrive() {
    for (int c = 0; c < 2; ++c) {
      for (kit::Svf& stage : stage_[c]) stage.reset();
    }
    power_[0] = power_[1] = 0.0f;
    one_power_ = two_power_ = 0.0f;
    held_ = 1.0f;
    resting_ = false;
    rest_run_ = 0;
  }

  void note_positions() {
    position_seen_[0] = glide_[0].value();
    position_seen_[1] = glide_[1].value();
  }

  void apply(int id) {
    using namespace overtone_singer;
    const float value = param(id);
    switch (id) {
      case kRoot:
      case kOctave: {
        const int root = kit::clamp_int(static_cast<int>(param(kRoot) + 0.5f), 0, 11);
        const int octave = kit::clamp_int(static_cast<int>(std::floor(param(kOctave) + 0.5f)),
                                          static_cast<int>(kParamMin[kOctave]), static_cast<int>(kParamMax[kOctave]));
        const float log2 = std::log2(root_hz(root, octave));
        if (lands()) {
          root_log2_.snap(log2);
        } else {
          root_log2_.set_target(log2);
        }
        break;
      }
      case kLow:
      case kHigh:
        if (primed()) {
          keep_to_range();
        } else {
          restart_melody();
        }
        break;
      case kPattern:
        if (!primed()) restart_melody();
        break;
      case kPace: {
        const double steps = static_cast<double>(value) / static_cast<double>(sample_rate());
        increment_ = static_cast<uint64_t>(steps * static_cast<double>(kStep) + 0.5);
        if (increment_ < 1) increment_ = 1;
        break;
      }
      case kGlide: {
        const int samples = static_cast<int>(value * 0.001f * sample_rate() + 0.5f);
        glide_samples_ = samples < 1 ? 1 : samples;
        // A move under way keeps its place and takes the new time for the rest.
        for (Glide& glide : glide_) {
          if (glide.n >= glide.length) continue;
          const float u = static_cast<float>(glide.n) / static_cast<float>(glide.length);
          glide.length = glide_samples_;
          glide.n = kit::clamp_int(static_cast<int>(u * static_cast<float>(glide_samples_)), 0, glide_samples_);
        }
        break;
      }
      case kFocus:
        if (lands()) {
          focus_.snap(value);
        } else {
          focus_.set_target(value);
        }
        break;
      case kDrone:
        if (lands()) {
          drone_.snap(value);
        } else {
          drone_.set_target(value);
        }
        break;
      case kSpread:
        lag_ = static_cast<uint64_t>(static_cast<double>(value) * static_cast<double>(kStep) + 0.5);
        if (primed()) place();
        break;
      case kMix:
        if (lands()) {
          mix_.snap(value);
        } else {
          mix_.set_target(value);
        }
        break;
      default:
        break;
    }
  }

  kit::Svf stage_[2][2];
  kit::Smoother root_log2_, focus_, drone_, mix_;
  kit::Rng random_;
  kit::IdleGate idle_;
  Glide glide_[2];
  // The melody's clock, in whole numbers so that it can be counted on by
  // any number of samples at once: `phase_` of kStep is how far through its
  // step it is, `increment_` what a sample adds, `lag_` how far through a
  // step the right side takes the left's note. `target_` is the harmonic of
  // this step, `previous_` the one before.
  uint64_t phase_ = 0;
  uint64_t increment_ = 1;
  uint64_t lag_ = 0;
  int target_ = 2;
  int previous_ = 2;
  int direction_ = 1;
  int glide_samples_ = 1;
  long rest_samples_ = 1;
  long rest_run_ = 1;
  bool resting_ = true;
  bool retune_ = true;
  float root_hz_ = 130.8f;
  float width_ = 0.2f;
  float root_lift_ = 4.0f;
  float level_coeff_ = 1.0f;
  float resonance_decay_ = 0.0f;
  float reading_coeff_ = 1.0f;
  // The input's mean square after one pole and after two, and the envelopes
  // of one band-pass and of the two in series, squared.
  float power_[2] = {0.0f, 0.0f};
  float one_power_ = 0.0f;
  float two_power_ = 0.0f;
  float last_root_log2_ = kUnset;
  float last_focus_ = kUnset;
  float last_position_[2] = {-1.0f, -1.0f};
  // For meter() only: never read by the sound.
  float position_seen_[2] = {2.0f, 2.0f};
  float held_ = 1.0f;
  float held_db_seen_ = 0.0f;
};

}  // namespace livemix
