#pragma once

// Howl: a loudspeaker and a pickup in one room. What is played goes round a
// loop of a short delay, a body and a level hold, and where the loop gives
// back more than it takes it sings on by itself.
//
//   in ─► band pass ─► (+) ─► hold to the ceiling ─┬─► duck ─► (+) ─► wet
//                       ▲      (never over it)      │           ▲
//                       │                           │    edge: harmonics of
//       gain ◄─ tilt ◄─ body: five taps of the ◄────┘    the tone that sings
//                        delay (Distance)
//
// One loop a side, the same on both at Width 0; the wet path sums nothing.
//
// - Distance is the loop's length, and the loop can sing only on the whole
//   multiples of 1 / Distance: every one of them, to a cent or two, because
//   the body turns no phase. It is five taps of the delay line, set either
//   side of the loop's length at -2, -1, 0, 1 and 2 half periods of the
//   body's centre and weighed 1, -4, 6, -4, 1 over 16: a band pass,
//   sin^4(pi f / 2 centre), whose only delay is the middle tap's. Two one-pole
//   low passes at three times the centre tilt it, so that the copies of the
//   pass band at 3, 5, 7.. times the centre have less gain than the first,
//   and the delay they add is taken off the loop for the overtone that sings.
// - Gain is how fast that overtone grows or dies, in dB a second: -240 at 0,
//   nothing at the middle, +240 at 1, on a curve that is finer the nearer the
//   middle (36 dB a second a quarter of the knob from it). The loop's gain is
//   set from it for the overtone the body passes best, and never more than
//   6 dB a turn, so the threshold is at the middle whatever Distance and Body
//   are. Under it the loop is a tuned ring that lasts longer the nearer the
//   middle; over it a held sound blooms into the overtone, sooner the higher.
// - The level hold is a gain that only ever turns down, set so the loop's
//   mean level is no more than the ceiling, its peaks no more than a quarter
//   over that, and no sample more than half over it. The ceiling of a side is
//   as loud as that side's playing has lately been (its RMS, reached in about
//   150 ms so that a click does not set it, and never more than its peak),
//   falling 60 dB in Hold seconds, and higher with Gain by up to 12 dB: so the
//   loop sings as loud as what was played, dies away by Hold when the playing
//   stops, and then is cleared to exact silence. What comes out of a side,
//   Edge's harmonics with it, is kept under the same half over the ceiling.
// - When the body moves on (Move, or a turn of Body or Distance) the overtone
//   that sings is kept, with the loop's gain still set for it, until the next
//   one towards the body's centre has grown as loud; then that one sings. So
//   the howl is handed from overtone to overtone and not let die between
//   them. If the body goes too far for the one that sings to be kept, the
//   best one is owed its level and grows fast until it has most of it.
// - Two sides that sing the same overtone are pulled gently into phase, so
//   that their sum is not less than either.
// - The tone that sings is read by itself: the loop's signal is turned down
//   to nothing at that overtone's frequency and averaged, which gives the
//   tone's size and phase with the playing left out. The display's readings
//   are that, and Edge adds the tone's third, fifth and seventh harmonics from
//   it, in a square wave's proportions: pure harmonics of the tone alone,
//   added on the way out and never fed back, less of each from 0.4 of the
//   sample rate and none past 0.45 of it, and faded over 5 ms when the
//   overtone that sings changes.
// - Follow turns the howl down at the output when the playing gets louder
//   than it has lately been (a new note), by up to 24 dB, and lets it come
//   back over the next fifth of a second. The loop itself is left alone, so
//   the howl is there to rise again.
// - Move and Pace: the body's centre wanders by itself, up to an octave either
//   way, on two slow sines read off a count of samples. It keeps its place
//   through silence and sleep and is the same at every block size.
// - Width sets the two bodies a half octave apart at most and a quarter of a
//   cycle apart in their wander.
//
// Storage: two delay lines of 8192 samples (the longest Distance and two
// periods of the lowest body centre at 96 kHz), 64 KB, in the default 4 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Howl : public kit::DeviceBase<howl::kNumParams> {
 public:
  // --- What the display's test and the harness copy ------------------------
  // Gain 0..1 is the rate the singing overtone grows at, dB a second:
  // rate = sign(u) * kRateMax * (exp(kRateCurve |u|) - 1) / (exp(kRateCurve) - 1), u = 2 gain - 1.
  static constexpr float kRateMax = 240.0f;
  static constexpr float kRateCurve = 3.5f;
  // The loop's gain is never more than this a turn (long Distances at high Gain).
  static constexpr float kTripMaxDb = 6.0f;
  // Where the body's centre may stand, wherever Move and Width send it; and
  // never under this many times rate / (period - 2), so the taps fit the loop.
  static constexpr float kCentreMinHz = 80.0f;
  static constexpr float kCentreMaxHz = 3000.0f;
  static constexpr float kCentreOverNote = 1.125f;
  // The tilt: two one-pole low passes at this many times the centre.
  static constexpr float kTiltRatio = 3.0f;
  // What is played reaches the loop through a band pass of this Q at the centre.
  static constexpr float kBodyQ = 2.0f;
  // Move 1 wanders an octave either way; Width 1 sets the sides half an octave apart.
  static constexpr float kMoveOctaves = 1.0f;
  static constexpr float kWidthOctaves = 0.25f;
  // The wander: two sines, the second at this ratio of Pace, in these weights.
  static constexpr float kWanderRatio = 0.6180340f;
  static constexpr float kWanderWeights[2] = {0.65f, 0.35f};
  // Width 1 puts the right side's wander this far ahead, in cycles.
  static constexpr float kWanderLead = 0.25f;
  // The howl is held this far under the playing's RMS at Gain 0, and level
  // with it at Gain 1; and how much of the playing goes into the loop.
  static constexpr float kLevelFloorDb = -12.0f;
  static constexpr float kInject = 0.5f;
  // The loop's gain trembles at the note Distance tunes, by twice this times
  // Distance in seconds: each overtone feeds the ones beside it a little, so
  // that when the body moves on the next one is already there to take over.
  static constexpr float kCouple = 0.2f;
  // While the body moves from one overtone to the next the loop's gain stays
  // set for the one that sings until the next has grown as loud, so the howl
  // is handed on and not let die; the next may grow this fast at the most.
  static constexpr float kHandRate = 1000.0f;
  // When the one that sang cannot be kept (the body went too far too fast),
  // the best is owed its level, and grows that fast until it has this much
  // of it; what is owed falls 60 dB in kOwedSeconds.
  static constexpr float kOwedShare = 0.7f;
  static constexpr float kOwedSeconds = 1.0f;
  // Two sides singing the same overtone are pulled into phase by this much
  // of a radian a trip at the most.
  static constexpr float kPull = 0.1f;
  // Follow 1 turns the howl down this far under a new note.
  static constexpr float kDuckDb = 24.0f;
  // The ceiling reaches the playing's level in about this long.
  static constexpr float kRiseSeconds = 0.15f;
  // The best overtone is looked for this many overtones either way at the most.
  static constexpr int kBestWalk = 8;
  // ------------------------------------------------------------------------

  // The rate the singing overtone grows at for a Gain setting, dB a second.
  static float rate_of(float gain) {
    const float u = 2.0f * kit::clamp(gain, 0.0f, 1.0f) - 1.0f;
    const float size = kRateMax * (std::exp(kRateCurve * std::fabs(u)) - 1.0f) /
                       (std::exp(kRateCurve) - 1.0f);
    return u < 0.0f ? -size : size;
  }

  // How high the howl is held against the playing's RMS for a Gain setting.
  static float level_of(float gain) {
    return kit::db_to_gain(kLevelFloorDb * (1.0f - kit::clamp(gain, 0.0f, 1.0f)));
  }

  // The loop's gain a turn, in dB, for a Gain setting and a loop of `seconds`.
  static float trip_db(float gain, float seconds) {
    return kit::min(rate_of(gain) * seconds, kTripMaxDb);
  }

  // Where a body asked to stand at `hz` stands in a loop of `period` samples.
  static float centre_in(float hz, float period, float sample_rate) {
    const float least = kCentreOverNote * sample_rate / (period - 2.0f);
    return kit::clamp(kit::max(hz, least), kCentreMinHz, kCentreMaxHz);
  }

  // What the body and the tilt pass of `hz` with the centre at `centre`:
  // sin^4(pi hz / 2 centre) times the two low passes; and the phase the low
  // passes turn there, in radians (a lag, positive).
  static float shape(float hz, float centre, float sample_rate, float* lag = nullptr) {
    const float w = kit::kTwoPi * hz / sample_rate;
    const float a = tilt_pole(centre, sample_rate);
    const float re = 1.0f - a * std::cos(w);
    const float im = a * std::sin(w);
    const float s = std::sin(0.5f * kit::kPi * hz / centre);
    if (lag) *lag = 2.0f * std::atan2(im, re);
    return s * s * s * s * (1.0f - a) * (1.0f - a) / (re * re + im * im);
  }

  // The overtone of `f0` the body passes best. The low passes lean the top
  // of the pass band a little under the centre, by more than one overtone
  // where they stand close, so it is walked to from the one under the centre.
  static int best_overtone(float centre, float f0, float sample_rate) {
    const int most = kit::clamp_int(static_cast<int>(0.45f * sample_rate / f0), 1, 8192);
    int best = kit::clamp_int(static_cast<int>(centre / f0), 1, most);
    float most_passed = shape(static_cast<float>(best) * f0, centre, sample_rate);
    for (int step = -1; step <= 1; step += 2) {
      for (int walked = 0; walked < kBestWalk; ++walked) {
        const int k = best + step;
        if (k < 1 || k > most) break;
        const float passed = shape(static_cast<float>(k) * f0, centre, sample_rate);
        if (passed <= most_passed) break;
        most_passed = passed;
        best = k;
      }
    }
    return best;
  }

 private:
  static constexpr int kLineSize = 8192;
  static constexpr int kTick = 32;  // control rate, a power of two
  // Under this ceiling the loop is cleared; it comes back at four times it.
  static constexpr float kDead = 3.0e-6f;
  // Air noise in the loop under the ceiling, so an overtone can start from
  // nothing when nothing played lies on it. The same on both sides.
  static constexpr float kSeed = 1.0e-4f;
  static constexpr float kEnvSeconds = 0.008f;     // the playing's level, fast
  static constexpr float kSlowSeconds = 0.3f;      // and as it has lately been
  static constexpr float kOnsetRatio = 1.25f;      // louder than lately by this is a new note
  static constexpr float kDuckAttack = 0.004f;
  static constexpr float kDuckRelease = 0.2f;
  static constexpr float kMeanSeconds = 0.01f;     // the level hold's mean follower
  static constexpr float kPeakAttack = 0.0003f;    // and its peak follower
  static constexpr float kPeakRelease = 0.03f;
  static constexpr float kPeakOver = 1.25f;        // peaks may stand this far over the mean's limit
  static constexpr float kClampOver = 1.5f;        // and nothing at all passes this
  static constexpr float kTuneSeconds = 0.12f;     // the loop length's glide
  static constexpr float kSpreadSeconds = 0.03f;   // the taps' glide
  static constexpr float kToneSeconds = 0.012f;    // the singing tone's average, twice over
  static constexpr float kFadeSeconds = 0.005f;    // Edge's harmonics, from one overtone to the next
  static constexpr float kSilent = 1.0e-15f;       // a power: -150 dBFS
  // A new note is whole at twice the level of lately.
  static constexpr float kOnsetSlope = 1.0f / (4.0f - kOnsetRatio * kOnsetRatio);
  static constexpr double kTwoToMinus64 = 1.0 / 18446744073709551616.0;

  // A reading of the loop's signal at one overtone, the playing beside it
  // left out: a phasor turning at the overtone, and the signal turned down
  // to nothing by it and averaged twice.
  struct Tone {
    float turn_re = 1.0f, turn_im = 0.0f;  // one sample's turn
    float ph_re = 1.0f, ph_im = 0.0f;      // the phasor
    float y_re = 0.0f, y_im = 0.0f;        // the signal there, averaged
    float z_re = 0.0f, z_im = 0.0f;        // and averaged again
    float harmonic[3] = {0.0f, 0.0f, 0.0f};  // Edge's weights for its 3rd, 5th and 7th
    void clear() {
      ph_re = 1.0f;
      ph_im = 0.0f;
      y_re = y_im = 0.0f;
      z_re = z_im = 0.0f;
    }
    float power() const { return z_re * z_re + z_im * z_im; }
  };

  struct Side {
    kit::DelayLine<kLineSize> line;
    kit::Svf body;             // what is played, on its way into the loop
    kit::OnePole tilt[2];
    kit::Hilbert hilbert;
    kit::Smoother delay;       // the middle tap, in samples
    kit::Smoother spread;      // half a period of the centre, in samples
    kit::Smoother gain;        // the loop's gain
    float mean = 0.0f;         // the loop's mean square before the hold
    float peak = 0.0f;         // and its peak
    float centre = 0.0f;       // the body's centre now, Hz
    int overtone = 1;          // the overtone that sings: the one that is read
    int settle = 0;            // control ticks until its frequency is read again
    int rival = 1;             // the next overtone towards the best, when that is another
    Tone tone;                 // the reading of the one that sings
    Tone next;                 // of the rival, to tell when it has grown as loud
    Tone gone;                 // and of the one that sang before, for Edge to fade out
    float fresh = 1.0f;        // how far Edge's harmonics of the tone have faded in
    float fade = 0.0f;         // and those of the one before have yet to fade out
    float owed = 0.0f;         // the level of a tone that was lost, still to be made up
    float sway_re = 1.0f, sway_im = 0.0f;  // one sample's turn at the fundamental
    float f_re = 1.0f, f_im = 0.0f;        // the phasor at the fundamental
    float was_re = 0.0f, was_im = 0.0f;    // the tone's average as it was a tick ago
    float off = 0.0f;          // how far the tone stands from the overtone, Hz
    float hz = 0.0f;           // the overtone's frequency now
    float level = 0.0f;        // the tone's size, for the meter
  };

  Side side_[2];
  kit::Smoother edge_, follow_, mix_;
  kit::Smoother rate_, level_;         // Gain as dB a second, and as the howl's level
  kit::Smoother body_, move_, width_;  // body in octaves (log2 Hz)
  uint64_t wander_[2] = {0, 0};        // the two wander sines' phases, 2^64 to a cycle
  uint64_t wander_step_[2] = {0, 0};   // and what a sample adds
  kit::Rng rng_;
  kit::IdleGate idle_;
  uint64_t clock_ = 0;        // samples since init, asleep or not
  float fast_[2] = {0.0f, 0.0f};  // each side's power over 8 ms
  float slow_ = 0.0f;         // both sides' over 300 ms
  float ceiling_[2] = {0.0f, 0.0f};
  float top_[2] = {0.0f, 0.0f};  // each side's peak, falling as the ceiling does
  kit::Smoother pull_;        // how hard the two sides' tones are pulled into phase
  float duck_ = 0.0f;         // 0..1, how far a new note has knocked the howl back
  bool alive_ = false;        // the loop holds sound
  // Coefficients, set in init.
  float fast_coeff_ = 0.0f, slow_coeff_ = 0.0f, rise_ = 0.0f;
  float duck_attack_ = 0.0f, duck_release_ = 0.0f;
  float mean_coeff_ = 0.0f, peak_attack_ = 0.0f, peak_release_ = 0.0f;
  float tone_coeff_ = 0.0f, off_coeff_ = 0.0f;
  float owed_decay_ = 1.0f;   // what is owed, a control tick on
  float fade_step_ = 1.0f;    // Edge's fade, a sample on
  float decay_ = 1.0f;        // the ceiling's fall per sample, from Hold
  float couple_ = 0.0f;       // twice kCouple times Distance
  float seed_ = 0.0f;

  static float tilt_pole(float centre, float sample_rate) {
    return std::exp(-kit::kTwoPi * kit::min(kTiltRatio * centre, 0.45f * sample_rate) / sample_rate);
  }

 public:
  void init(float sample_rate) {
    using namespace howl;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Side& s : side_) {
      s.line.clear();
      s.delay.set_time(kTuneSeconds, sr);
      s.spread.set_time(kSpreadSeconds, sr);
      s.gain.set_time(kSmoothingSeconds, sr);
      s.overtone = 1;
      s.rival = 1;
    }
    rate_.set_time(kSmoothingSeconds, sr);
    level_.set_time(kSmoothingSeconds, sr);
    edge_.set_time(kSmoothingSeconds, sr);
    follow_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    body_.set_time(kSmoothingSeconds, sr);
    move_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    pull_.set_time(kSmoothingSeconds, sr);
    wander_[0] = 0;
    wander_[1] = 0;
    fast_coeff_ = kit::time_to_coeff(kEnvSeconds, sr);
    slow_coeff_ = kit::time_to_coeff(kSlowSeconds, sr);
    rise_ = 1.0f - kit::time_to_coeff(kRiseSeconds, sr);
    duck_attack_ = kit::time_to_coeff(kDuckAttack, sr);
    duck_release_ = kit::time_to_coeff(kDuckRelease, sr);
    mean_coeff_ = kit::time_to_coeff(kMeanSeconds, sr);
    peak_attack_ = kit::time_to_coeff(kPeakAttack, sr);
    peak_release_ = kit::time_to_coeff(kPeakRelease, sr);
    tone_coeff_ = kit::time_to_coeff(kToneSeconds, sr);
    off_coeff_ = kit::time_to_coeff(0.02f, sr / static_cast<float>(kTick));
    owed_decay_ = std::pow(10.0f, -3.0f * static_cast<float>(kTick) / (kOwedSeconds * sr));
    fade_step_ = 1.0f / (kFadeSeconds * sr);
    seed_ = kSeed * std::sqrt(sr / 48000.0f);
    rng_.seed(0x48F0A11Du);
    clock_ = 0;
    alive_ = false;
    rest();
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    tune(true);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: each is a
  // value process() already keeps. 0 and 2, the size of the tone each side
  // sings as a share of full scale (the loop's signal at that overtone, the
  // playing beside it left out); 1 and 3, its frequency in Hz (0 at rest);
  // 4 and 5, where each body's centre stands now; 6, the share of Follow's
  // 24 dB a new note has taken off the howl (0 at rest).
  float meter(int index) const {
    switch (index) {
      case 0:
      case 2:
        return alive_ ? side_[index / 2].level : 0.0f;
      case 1:
      case 3:
        return alive_ ? side_[index / 2].hz + side_[index / 2].off : 0.0f;
      case 4:
      case 5:
        return side_[index - 4].centre;
      case 6:
        return alive_ ? follow_.value * duck_ : 0.0f;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool excited =
        input_present(frames) || alive_ || fast_[0] != 0.0f || fast_[1] != 0.0f || slow_ != 0.0f;
    if (!idle_.wake(excited)) {
      silence_output(frames);
      // The clock and the wander run on through the sleep.
      clock_ += static_cast<uint64_t>(frames);
      wander_[0] += wander_step_[0] * static_cast<uint64_t>(frames);
      wander_[1] += wander_step_[1] * static_cast<uint64_t>(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float heard[2] = {bearable(in[0]), bearable(in[1])};

      // How loud each side's playing is, and how loud both have lately been.
      float target[2];
      for (int c = 0; c < 2; ++c) {
        const float power = heard[c] * heard[c];
        fast_[c] = power + (fast_[c] - power) * fast_coeff_;
        if (fast_[c] < kSilent) fast_[c] = 0.0f;
        target[c] = std::sqrt(fast_[c]);
        if (target[c] > ceiling_[c]) {
          ceiling_[c] += (target[c] - ceiling_[c]) * rise_;
        } else {
          ceiling_[c] *= decay_;
        }
        top_[c] = kit::max(top_[c] * decay_, std::fabs(heard[c]));
      }
      const float both = 0.5f * (fast_[0] + fast_[1]);
      slow_ = both + (slow_ - both) * slow_coeff_;
      if (slow_ < kSilent) slow_ = 0.0f;
      const float loudest = kit::max(target[0], target[1]);
      if (!alive_ && loudest >= 4.0f * kDead) {
        alive_ = true;
        tune(true);
      } else if (alive_ && loudest < kDead && ceiling_[0] < kDead && ceiling_[1] < kDead) {
        rest();
      }

      float wet[2] = {0.0f, 0.0f};
      if (alive_) {
        if ((clock_ & (kTick - 1)) == 0) tune(false);
        // A new note: louder than lately by kOnsetRatio and more.
        const float ratio = both / (slow_ + 1.0e-20f);
        const float onset =
            kit::clamp((ratio - kOnsetRatio * kOnsetRatio) * kOnsetSlope, 0.0f, 1.0f);
        duck_ = onset + (duck_ - onset) * (onset > duck_ ? duck_attack_ : duck_release_);
        const float ducked = std::exp(-kDuckNepers * follow_.next() * duck_);
        const float edge = edge_.next();
        const float air = seed_ * rng_.bipolar();
        const float level = level_.next();
        const float pull = pull_.next();
        for (int c = 0; c < 2; ++c) {
          // The howl may be this high: a tone of it is as loud as the
          // playing, and no higher than the playing's own peaks.
          const float high = level * kit::min(kSqrtTwo * ceiling_[c], top_[c]);
          wet[c] = ducked * turn(side_[c], heard[c], high, edge, air, c == 0 ? -pull : pull);
        }
      } else {
        follow_.next();
        edge_.next();
        level_.next();
        pull_.next();
      }
      rate_.next();
      body_.next();
      move_.next();
      width_.next();
      ++clock_;
      wander_[0] += wander_step_[0];
      wander_[1] += wander_step_[1];

      const float mix = mix_.next() * 0.25f;
      const float dry_gain = kit::SineTable::cos_lookup(mix);
      const float wet_gain = kit::SineTable::lookup(mix);
      out_left_[i] = in[0] * dry_gain + wet[0] * wet_gain;
      out_right_[i] = in[1] * dry_gain + wet[1] * wet_gain;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr float kDuckNepers = kDuckDb * 0.11512925f;  // ln(10) / 20
  static constexpr float kSqrtTwo = 1.41421356f;

  // What the loop hears of a sample: twice full scale at the most, and
  // nothing at all of one that is no sound (NaN, infinite, or past 18 dB over).
  static float bearable(float x) {
    if (!(x > -8.0f && x < 8.0f)) return 0.0f;
    return kit::clamp(x, -2.0f, 2.0f);
  }

  // One sample round one side's loop: what comes back through the body and
  // the tilt, with what is played, held to the ceiling and into the delay.
  // What goes out is that, with Edge's harmonics of the tone that sings.
  float turn(Side& s, float heard, float high, float edge, float air, float pull) {
    const float most_delay = kit::DelayLine<kLineSize>::max_delay();
    const float d = s.delay.next();
    const float h = s.spread.next();
    const float near = kit::max(d - h, 2.0f), nearer = kit::max(d - 2.0f * h, 2.0f);
    const float far = kit::min(d + h, most_delay), farther = kit::min(d + 2.0f * h, most_delay);
    float back = 0.375f * s.line.read_hermite(kit::clamp(d, 2.0f, most_delay)) -
                 0.25f * (s.line.read_hermite(near) + s.line.read_hermite(far)) +
                 0.0625f * (s.line.read_hermite(nearer) + s.line.read_hermite(farther));
    back = s.tilt[1].lowpass(s.tilt[0].lowpass(back));
    // The fundamental's phasor: the loop's gain trembles with it.
    const float fr = s.f_re * s.sway_re - s.f_im * s.sway_im;
    s.f_im = s.f_re * s.sway_im + s.f_im * s.sway_re;
    s.f_re = fr;
    // The pull: a little of the tone's own quadrature, a sample on, turns
    // its phase towards the other side's; as much of the tone itself as the
    // turn would add to its size is taken off, so its size is left alone.
    float nudge = 0.0f;
    if (pull != 0.0f) {
      const Tone& t = s.tone;
      const float pr = t.ph_re * t.turn_re - t.ph_im * t.turn_im;
      const float pi = t.ph_re * t.turn_im + t.ph_im * t.turn_re;
      nudge = 2.0f * pull * ((t.z_re * pi + t.z_im * pr) - 0.5f * pull * (t.z_re * pr - t.z_im * pi));
    }
    const float pickup = kInject * s.body.bandpass(heard) +
                         s.gain.next() * (1.0f + couple_ * fr) * back + high * air + nudge;
    float i, q;
    s.hilbert.process(pickup, &i, &q);
    const float square = i * i + q * q;
    const float size = std::sqrt(square);
    s.mean = flush_denormal(square + (s.mean - square) * mean_coeff_);
    s.peak = flush_denormal(size + (s.peak - size) * (size > s.peak ? peak_attack_ : peak_release_));
    float hold = 1.0f;
    if (s.mean > high * high) hold = high / std::sqrt(s.mean);
    if (s.peak * hold > kPeakOver * high) hold = kPeakOver * high / s.peak;
    const float most = kClampOver * high;
    const float y = flush_denormal(kit::clamp(pickup * hold, -most, most));
    s.line.write(y);

    // The tone that sings is read by itself, and the rival while there is one.
    read(s.tone, y);
    if (s.rival != s.overtone) read(s.next, y);
    // Edge: the harmonics of that tone, faded in after another overtone has
    // taken over while those of the one before fade out.
    float out = y;
    if (s.fade > 0.0f) {
      const float gr = s.gone.ph_re * s.gone.turn_re - s.gone.ph_im * s.gone.turn_im;
      s.gone.ph_im = s.gone.ph_re * s.gone.turn_im + s.gone.ph_im * s.gone.turn_re;
      s.gone.ph_re = gr;
      if (edge > 0.0f) out += edge * s.fade * harmonics(s.gone, most);
      s.fade = kit::max(s.fade - fade_step_, 0.0f);
    }
    if (edge > 0.0f) out += edge * s.fresh * harmonics(s.tone, most);
    if (s.fresh < 1.0f) s.fresh = kit::min(s.fresh + fade_step_, 1.0f);
    // With its harmonics too, no more goes out than the loop itself may hold.
    return kit::clamp(out, -most, most);
  }

  // One sample of a reading: its phasor a turn on, and the loop's signal
  // turned down to nothing by it and averaged twice.
  void read(Tone& t, float y) const {
    const float pr = t.ph_re * t.turn_re - t.ph_im * t.turn_im;
    const float pi = t.ph_re * t.turn_im + t.ph_im * t.turn_re;
    t.ph_re = pr;
    t.ph_im = pi;
    t.y_re = flush_denormal(y * pr + (t.y_re - y * pr) * tone_coeff_);
    t.y_im = flush_denormal(-y * pi + (t.y_im + y * pi) * tone_coeff_);
    t.z_re = flush_denormal(t.y_re + (t.z_re - t.y_re) * tone_coeff_);
    t.z_im = flush_denormal(t.y_im + (t.z_im - t.y_im) * tone_coeff_);
  }

  // Edge's harmonics of a reading. Twice the average, turned back up, is the
  // tone as a turning point (its real part is the tone); over its size it is
  // a point on the unit circle, and that point's third, fifth and seventh
  // powers are the harmonics, here in a square wave's signs and weights.
  static float harmonics(const Tone& t, float most) {
    const float tr = 2.0f * (t.z_re * t.ph_re - t.z_im * t.ph_im);
    const float ti = 2.0f * (t.z_re * t.ph_im + t.z_im * t.ph_re);
    const float tone = std::sqrt(tr * tr + ti * ti);
    if (tone <= 1.0e-12f) return 0.0f;
    const float ur = tr / tone, ui = ti / tone;
    const float u2r = ur * ur - ui * ui, u2i = 2.0f * ur * ui;
    const float u3r = u2r * ur - u2i * ui, u3i = u2r * ui + u2i * ur;
    const float u5r = u3r * u2r - u3i * u2i, u5i = u3r * u2i + u3i * u2r;
    const float u7r = u5r * u2r - u5i * u2i;
    return kit::min(tone, most) *
           (-t.harmonic[0] * u3r + t.harmonic[1] * u5r - t.harmonic[2] * u7r);
  }

  // Another overtone takes over as the one that sings: Edge's harmonics of
  // the old one fade out as they were, and the new one's reading starts from
  // the rival's when it is the rival, and else from nothing.
  static void take_over(Side& s, int overtone, bool from_rival) {
    s.gone = s.tone;
    s.fade = s.fresh;
    s.fresh = 0.0f;
    if (from_rival) {
      const Tone old = s.tone;
      s.tone = s.next;
      s.tone.harmonic[0] = old.harmonic[0];
      s.tone.harmonic[1] = old.harmonic[1];
      s.tone.harmonic[2] = old.harmonic[2];
    } else {
      s.tone.clear();
    }
    s.next.clear();
    s.overtone = overtone;
    s.was_re = s.tone.z_re;
    s.was_im = s.tone.z_im;
    s.settle = 8;
  }

  // Control rate: where each body stands, the taps and the tilt for it, the
  // loop's gain for the overtone it passes best, the delay that puts the
  // overtone that is read on a whole multiple of 1 / Distance, and the
  // reading of that tone. `snap` when the loop starts from rest.
  void tune(bool snap) {
    using namespace howl;
    const float sr = sample_rate();
    const float f0 = 1000.0f / param(kDistance);
    const float period = sr / f0;
    const float width = width_.value;
    const double cycles[2] = {static_cast<double>(wander_[0]) * kTwoToMinus64,
                              static_cast<double>(wander_[1]) * kTwoToMinus64};
    const int most = kit::clamp_int(static_cast<int>(0.45f * sr / f0), 1, 8192);
    const float seconds = param(kDistance) * 0.001f;
    const float trip = kit::db_to_gain(kit::min(rate_.value * seconds, kTripMaxDb));
    const float most_trip =
        kit::max(trip, kit::db_to_gain(kit::min(kHandRate * seconds, kTripMaxDb)));
    couple_ = 2.0f * kCouple * seconds;
    for (int c = 0; c < 2; ++c) {
      Side& s = side_[c];
      const float lead = c == 1 ? kWanderLead * width : 0.0f;
      const float a = static_cast<float>(cycles[0]) + lead;
      const float b = static_cast<float>(cycles[1]) + lead;
      const float drift = kWanderWeights[0] * kit::SineTable::lookup(a) +
                          kWanderWeights[1] * kit::SineTable::lookup(b);
      const float octaves = body_.value + move_.value * kMoveOctaves * drift +
                            (c == 1 ? width : -width) * kWidthOctaves;
      s.centre = centre_in(std::exp2(octaves), period, sr);
      s.body.set(s.centre, kBodyQ, sr);
      const float pole = tilt_pole(s.centre, sr);
      s.tilt[0].a = pole;
      s.tilt[1].a = pole;

      // The overtone that sings (the one that is read, that the delay is
      // trimmed for and that goes round at Gain's rate) is the one the body
      // passes best. When the body has moved on, the old one stays until
      // the next one towards the best has grown as loud in the loop, and so
      // on, one at a time. An old one passed so much less that it cannot be
      // kept is left at once: for the next one if that is half as loud and
      // can be kept, and else for the best.
      const int best = best_overtone(s.centre, f0, sr);
      const float passed = shape(static_cast<float>(best) * f0, s.centre, sr);
      const float keeps = trip * passed / most_trip;  // what one that can be kept is passed
      int rival = best;
      if (snap) {
        s.overtone = best;
        s.tone.clear();
        s.next.clear();
        s.fresh = 1.0f;
        s.fade = 0.0f;
        s.settle = 8;
      } else if (s.overtone > most) {
        take_over(s, best, false);
      } else if (best != s.overtone) {
        rival = s.overtone + (best > s.overtone ? 1 : -1);
        const float sings = s.tone.power();
        const float next = rival == s.rival ? s.next.power() : 0.0f;
        const bool lost = shape(static_cast<float>(s.overtone) * f0, s.centre, sr) < keeps;
        if (lost && !(rival == s.rival && next >= 0.25f * sings &&
                      shape(static_cast<float>(rival) * f0, s.centre, sr) >= keeps)) {
          if (trip > 1.0f) s.owed = kit::max(s.owed, 2.0f * std::sqrt(sings));
          take_over(s, best, false);
          rival = best;
        } else if (rival == s.rival && (lost || next >= sings)) {
          take_over(s, rival, true);
          rival = rival == best ? best : rival + (best > rival ? 1 : -1);
        } else if (rival != s.rival) {
          s.next.clear();
        }
      }
      s.rival = rival;
      const float k = static_cast<float>(s.overtone);
      float lag;
      const float held = shape(k * f0, s.centre, sr, &lag);
      const float turned = kit::kTwoPi * k * f0 / sr;  // radians a sample at that overtone
      const float tilt_delay = lag / turned;           // what the low passes add, in samples
      const float longest = kit::DelayLine<kLineSize>::max_delay();
      s.delay.set(kit::clamp(period - tilt_delay, 2.0f, longest), !snap);
      s.spread.set(0.5f * sr / s.centre, !snap);
      // Set for the one that sings, the loop's gain lets the one passed best
      // grow faster than Gain says: by kHandRate at the most.
      if (s.owed > 0.0f) {
        s.owed *= owed_decay_;
        if (s.owed < 1.0e-7f || 2.0f * std::sqrt(s.tone.power()) >= kOwedShare * s.owed) {
          s.owed = 0.0f;
        }
      }
      s.gain.set(s.owed > 0.0f ? most_trip / passed
                               : kit::min(trip / kit::max(held, 1.0e-9f), most_trip / passed),
                 !snap);

      // The phasors turn at those overtones of the loop as long as it is now.
      const float length = s.delay.value + tilt_delay;
      const float step = kit::kTwoPi * k / length;
      s.hz = k * sr / length;
      s.tone.turn_re = std::cos(step);
      s.tone.turn_im = std::sin(step);
      const float rival_step = kit::kTwoPi * static_cast<float>(s.rival) / length;
      s.next.turn_re = std::cos(rival_step);
      s.next.turn_im = std::sin(rival_step);
      s.sway_re = std::cos(kit::kTwoPi / length);
      s.sway_im = std::sin(kit::kTwoPi / length);
      unit(&s.tone.ph_re, &s.tone.ph_im);
      unit(&s.next.ph_re, &s.next.ph_im);
      unit(&s.f_re, &s.f_im);
      // Edge's harmonics: each whole under 0.4 of the rate, and none past 0.45.
      for (int n = 0; n < 3; ++n) {
        const float harmonic = static_cast<float>(2 * n + 3);
        s.tone.harmonic[n] =
            kit::clamp((0.45f * sr - harmonic * s.hz) / (0.05f * sr), 0.0f, 1.0f) / harmonic;
      }

      // The reading: the tone's size, and how far it stands from the
      // overtone by how its average turned over the tick.
      const float now = s.tone.power();
      const float was = s.was_re * s.was_re + s.was_im * s.was_im;
      s.level = 2.0f * std::sqrt(now);
      if (s.settle > 0) {
        --s.settle;
        s.off = 0.0f;
      } else if (now > 1.0e-20f && was > 1.0e-20f) {
        const float re = s.tone.z_re * s.was_re + s.tone.z_im * s.was_im;
        const float im = s.tone.z_im * s.was_re - s.tone.z_re * s.was_im;
        const float hz = std::atan2(im, re) * sr / (kit::kTwoPi * static_cast<float>(kTick));
        s.off = hz + (s.off - hz) * off_coeff_;
      }
      s.was_re = s.tone.z_re;
      s.was_im = s.tone.z_im;
    }

    // Two sides on the same overtone are pulled into phase, so that their
    // sum in mono is not left to chance: each tone is turned towards the
    // other by kPull times the sine of the angle between them a trip, and
    // by all of kPull while they stand more than a quarter turn apart.
    float want = 0.0f;
    const Tone& l = side_[0].tone;
    const Tone& r = side_[1].tone;
    if (side_[0].overtone == side_[1].overtone) {
      const float ar = l.z_re * l.ph_re - l.z_im * l.ph_im, ai = l.z_re * l.ph_im + l.z_im * l.ph_re;
      const float br = r.z_re * r.ph_re - r.z_im * r.ph_im, bi = r.z_re * r.ph_im + r.z_im * r.ph_re;
      const float re = br * ar + bi * ai, im = bi * ar - br * ai;  // the right's lead over the left
      const float size = std::sqrt(re * re + im * im);
      if (size > 1.0e-14f) want = kPull * (re >= 0.0f ? im / size : (im >= 0.0f ? 1.0f : -1.0f));
    }
    pull_.set(want, !snap);
  }

  // A phasor back on the unit circle, after a tick's worth of turns.
  static void unit(float* re, float* im) {
    const float norm = *re * *re + *im * *im;
    if (norm > 0.25f && norm < 4.0f) {
      const float scale = 1.0f / std::sqrt(norm);
      *re *= scale;
      *im *= scale;
    } else {
      *re = 1.0f;
      *im = 0.0f;
    }
  }

  // The loop at rest: empty, every follower at zero and every knob where it
  // points, so that it starts the same way whenever it starts again.
  void rest() {
    for (Side& s : side_) {
      s.line.clear();
      s.body.reset();
      s.tilt[0].reset();
      s.tilt[1].reset();
      s.hilbert.reset();
      s.delay.snap(s.delay.target);
      s.spread.snap(s.spread.target);
      s.gain.snap(s.gain.target);
      s.mean = 0.0f;
      s.peak = 0.0f;
      s.tone.clear();
      s.next.clear();
      s.gone.clear();
      s.fresh = 1.0f;
      s.fade = 0.0f;
      s.f_re = 1.0f;
      s.f_im = 0.0f;
      s.was_re = s.was_im = 0.0f;
      s.off = 0.0f;
      s.level = 0.0f;
      s.owed = 0.0f;
      s.settle = 0;
    }
    rate_.snap(rate_.target);
    level_.snap(level_.target);
    edge_.snap(edge_.target);
    follow_.snap(follow_.target);
    mix_.snap(mix_.target);
    body_.snap(body_.target);
    move_.snap(move_.target);
    width_.snap(width_.target);
    fast_[0] = fast_[1] = 0.0f;
    slow_ = 0.0f;
    ceiling_[0] = ceiling_[1] = 0.0f;
    top_[0] = top_[1] = 0.0f;
    pull_.snap(0.0f);
    duck_ = 0.0f;
    alive_ = false;
  }

  void apply(int id) {
    using namespace howl;
    const float value = param(id);
    // A knob moved while the loop is at rest is there when it starts.
    const bool glide = primed() && alive_;
    switch (id) {
      case kGain:
        rate_.set(rate_of(value), glide);
        level_.set(level_of(value), glide);
        break;
      case kBody:
        body_.set(std::log2(value), glide);
        break;
      case kHold:
        decay_ = std::pow(10.0f, -3.0f / (value * sample_rate()));
        break;
      case kMove:
        move_.set(value, glide);
        break;
      case kPace: {
        const double step = static_cast<double>(value) / sample_rate();
        wander_step_[0] = static_cast<uint64_t>(step * 18446744073709551616.0);
        wander_step_[1] = static_cast<uint64_t>(step * kWanderRatio * 18446744073709551616.0);
        break;
      }
      case kEdge:
        edge_.set(value, glide);
        break;
      case kFollow:
        follow_.set(value, glide);
        break;
      case kWidth:
        width_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // Distance is read when the loop is tuned
    }
  }
};

}  // namespace livemix
