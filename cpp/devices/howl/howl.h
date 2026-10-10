#pragma once

// Howl: a loudspeaker and a pickup in one room. What is played goes round a
// loop of a short delay, a resonance and a level hold, and where the loop's
// gain is over one it sings on by itself.
//
//   in ──► (+) ──► body ──► hold to the ceiling ──┬──► edge ──► wet
//           ▲      (band pass)   (never over it)   │
//           └── gain × duck ◄── delay (Distance) ◄─┘
//
// One loop a side, the same on both at Width 0; the wet path sums nothing.
//
// - Distance is the loop's delay, and the loop is tuned by it: the delay read
//   is the Distance less the phase the body turns at the overtone that is
//   singing (or, while nothing sings, at the one nearest the body), so the
//   feedback stands on whole multiples of 1 / Distance and nowhere else. A
//   player tunes Distance to a low note and every howl is one of its overtones.
// - Gain is the loop's gain at the body's centre, -18 to +12 dB. Under 0 dB at
//   every overtone the loop only rings; over it the overtone with the most
//   gain grows until the level hold stops it.
// - The level hold is a gain that only ever turns down, set so the loop's
//   level (the size of its analytic signal) is no more than the ceiling. The
//   ceiling is the loudest the playing has lately been (its RMS over 8 ms),
//   falling 60 dB in Hold seconds: so the loop sings as loud as what was
//   played, dies away by Hold when the playing stops, and then is cleared to
//   exact silence. Nothing in the loop can pass twice the ceiling.
// - Edge adds the third, fifth and seventh harmonics of the loop's signal, in
//   a square wave's proportions, from Chebyshev polynomials of the signal over
//   its own size: on a sine they are those harmonics and nothing else, at any
//   level. They are added on the way out and not fed back, so Edge changes
//   neither the loop's gain, nor its level, nor its pitch.
// - Follow turns the loop's gain down when the playing gets louder than it has
//   lately been (a new note), and lets it come back over the next fifth of a
//   second: the howl gives way to an attack and blooms again as the note rings.
// - Move and Pace: the body's centre wanders by itself, up to an octave either
//   way, on two slow sines read off a count of samples. It keeps its place
//   through silence and sleep and is the same at every block size.
// - Width sets the two bodies a half octave apart at most and a quarter of a
//   cycle apart in their wander.
//
// Storage: two delay lines of 8192 samples (the longest Distance and a quarter
// period more at 96 kHz), 64 KB, in the default 4 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Howl : public kit::DeviceBase<howl::kNumParams> {
 public:
  // --- What the display's test copies -------------------------------------
  // Gain 0..1 is the loop's gain in dB at the body's centre.
  static constexpr float kGainFloorDb = -18.0f;
  static constexpr float kGainSpanDb = 30.0f;
  // The body: a band pass of this Q, unity at its centre.
  static constexpr float kBodyQ = 2.0f;
  // Where the body's centre may stand, wherever Move and Width send it.
  static constexpr float kCentreMinHz = 80.0f;
  static constexpr float kCentreMaxHz = 3000.0f;
  // Move 1 wanders an octave either way; Width 1 sets the sides half an octave apart.
  static constexpr float kMoveOctaves = 1.0f;
  static constexpr float kWidthOctaves = 0.25f;
  // The wander: two sines, the second at this ratio of Pace, in these weights.
  static constexpr float kWanderRatio = 0.6180340f;
  static constexpr float kWanderWeights[2] = {0.65f, 0.35f};
  // Width 1 puts the right side's wander this far ahead, in cycles.
  static constexpr float kWanderLead = 0.25f;
  // The ceiling over the playing's RMS, and how much of the playing goes
  // into the loop (the harness copies these).
  static constexpr float kLevel = 1.0f;
  static constexpr float kInject = 0.5f;
  // ------------------------------------------------------------------------

 private:
  static constexpr int kLineSize = 8192;
  static constexpr int kTick = 32;  // control rate, a power of two
  // Under this ceiling the loop is cleared; it comes back at four times it.
  static constexpr float kDead = 3.0e-6f;
  // Air noise in the loop under the ceiling, so an overtone that has died
  // out can start again when the body comes round to it.
  static constexpr float kSeed = 1.0e-4f;
  static constexpr float kEnvSeconds = 0.008f;     // the playing's level, fast
  static constexpr float kSlowSeconds = 0.3f;      // and as it has lately been
  static constexpr float kOnsetRatio = 1.25f;      // louder than lately by this is a new note
  static constexpr float kDuckAttack = 0.004f;
  static constexpr float kDuckRelease = 0.2f;
  static constexpr float kHoldAttack = 0.0003f;    // the level hold's follower
  static constexpr float kHoldRelease = 0.03f;
  static constexpr float kTuneSeconds = 0.04f;     // the delay's glide
  static constexpr float kPitchSeconds = 0.02f;    // the measured pitch's smoothing

  struct Side {
    kit::DelayLine<kLineSize> line;
    kit::Svf body;
    kit::Hilbert hilbert;
    kit::Smoother delay;      // the delay read, in samples
    float follower = 0.0f;    // the loop's level before the hold
    float level = 0.0f;       // and after it, for the meter
    float i1 = 0.0f, q1 = 0.0f;  // the analytic signal one sample ago
    float turn_re = 0.0f, turn_im = 0.0f;  // its turn summed over a tick
    float pitch = 0.0f;       // the loop's frequency as measured, Hz
    float centre = 0.0f;      // the body's centre now, Hz
    int overtone = 1;         // the overtone the delay is tuned for
  };

  Side side_[2];
  kit::Smoother gain_, edge_, follow_, mix_;
  kit::Smoother body_, move_, width_;  // body in octaves (log2 Hz)
  uint64_t wander_[2] = {0, 0};        // the two wander sines' phases, 2^64 to a cycle
  uint64_t wander_step_[2] = {0, 0};   // and what a sample adds
  kit::Rng rng_;
  kit::IdleGate idle_;
  uint64_t clock_ = 0;        // samples since init, asleep or not
  float fast_ = 0.0f;         // the playing's power over 8 ms
  float slow_ = 0.0f;         // and over 300 ms
  float ceiling_ = 0.0f;
  float duck_ = 0.0f;         // 0..1, how far a new note has knocked the loop back
  bool alive_ = false;        // the loop holds sound
  // Coefficients, set in init.
  float fast_coeff_ = 0.0f, slow_coeff_ = 0.0f;
  float duck_attack_ = 0.0f, duck_release_ = 0.0f;
  float hold_attack_ = 0.0f, hold_release_ = 0.0f;
  float pitch_coeff_ = 0.0f;
  float decay_ = 1.0f;        // the ceiling's fall per sample, from Hold
  float seed_ = 0.0f;

 public:
  void init(float sample_rate) {
    using namespace howl;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Side& s : side_) {
      s.line.clear();
      s.delay.set_time(kTuneSeconds, sr);
    }
    gain_.set_time(kSmoothingSeconds, sr);
    edge_.set_time(kSmoothingSeconds, sr);
    follow_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    body_.set_time(kSmoothingSeconds, sr);
    move_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    wander_[0] = 0;
    wander_[1] = 0;
    fast_coeff_ = kit::time_to_coeff(kEnvSeconds, sr);
    slow_coeff_ = kit::time_to_coeff(kSlowSeconds, sr);
    duck_attack_ = kit::time_to_coeff(kDuckAttack, sr);
    duck_release_ = kit::time_to_coeff(kDuckRelease, sr);
    hold_attack_ = kit::time_to_coeff(kHoldAttack, sr);
    hold_release_ = kit::time_to_coeff(kHoldRelease, sr);
    pitch_coeff_ = kit::time_to_coeff(kPitchSeconds, sr / static_cast<float>(kTick));
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
  // value process() already keeps. 0 and 2, the loop's level left and right
  // as a share of full scale; 1 and 3, the frequency each side sings at in Hz
  // (0 while it holds nothing); 4 and 5, where each body's centre stands now;
  // 6, the share of the loop's gain a new note has taken off (0 at rest).
  float meter(int index) const {
    switch (index) {
      case 0:
      case 2:
        return alive_ ? side_[index / 2].level : 0.0f;
      case 1:
      case 3:
        return alive_ ? side_[index / 2].pitch : 0.0f;
      case 4:
      case 5:
        return side_[index - 4].centre;
      case 6:
        return alive_ ? follow_.value * duck_ : 0.0f;
      default:
        return 0.0f;
    }
  }

  // The loop's gain for a Gain setting.
  static float loop_gain(float gain) {
    return kit::db_to_gain(kGainFloorDb + kGainSpanDb * gain);
  }

  // The body's gain and the phase it turns, at `hz` with its centre at
  // tan(pi fc / sr) = g: the band pass (s / Q) / (s^2 + s / Q + 1) at
  // s = j tan(pi hz / sr) / g, which is what kit::Svf computes.
  static void body_at(float hz, float g, float sample_rate, float* gain, float* phase) {
    const float w = std::tan(kit::kPi * kit::min(hz, 0.49f * sample_rate) / sample_rate) / g;
    const float re = 1.0f - w * w;
    const float im = w / kBodyQ;
    *gain = im / std::sqrt(re * re + im * im);
    *phase = kit::kHalfPi - std::atan2(im, re);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool excited = input_present(frames) || alive_ || fast_ != 0.0f || slow_ != 0.0f;
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

      // How loud the playing is, and how loud it has lately been.
      const float power = 0.5f * (heard[0] * heard[0] + heard[1] * heard[1]);
      fast_ = power + (fast_ - power) * fast_coeff_;
      slow_ = power + (slow_ - power) * slow_coeff_;
      if (fast_ < kSilent) fast_ = 0.0f;
      if (slow_ < kSilent) slow_ = 0.0f;
      const float target = kLevel * std::sqrt(fast_);
      ceiling_ *= decay_;
      if (target > ceiling_) ceiling_ = target;
      if (!alive_ && target >= 4.0f * kDead) {
        alive_ = true;
        tune(true);
      } else if (alive_ && ceiling_ < kDead) {
        rest();
      }

      float wet[2] = {0.0f, 0.0f};
      if (alive_) {
        if ((clock_ & (kTick - 1)) == 0) tune(false);
        // A new note: louder than lately by kOnsetRatio and more.
        const float ratio = fast_ / (slow_ + 1.0e-20f);
        const float onset =
            kit::clamp((ratio - kOnsetRatio * kOnsetRatio) * kOnsetSlope, 0.0f, 1.0f);
        duck_ = onset + (duck_ - onset) * (onset > duck_ ? duck_attack_ : duck_release_);
        const float loop = gain_.next() * (1.0f - follow_.next() * duck_);
        const float edge = edge_.next();
        for (int c = 0; c < 2; ++c) wet[c] = turn(side_[c], heard[c], loop, edge);
      } else {
        gain_.next();
        follow_.next();
        edge_.next();
      }
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
  static constexpr float kSilent = 1.0e-15f;  // a power: -150 dBFS
  // A new note is whole at twice the level of lately.
  static constexpr float kOnsetSlope = 1.0f / (4.0f - kOnsetRatio * kOnsetRatio);

  // What the loop hears of a sample: twice full scale at the most, and
  // nothing at all of one that is no sound (NaN, infinite, or past 18 dB over).
  static float bearable(float x) {
    if (!(x > -8.0f && x < 8.0f)) return 0.0f;
    return kit::clamp(x, -2.0f, 2.0f);
  }

  // One sample round one side's loop: what the pickup hears, through the
  // body, held to the ceiling and into the delay; what comes back is that
  // with Edge's harmonics.
  float turn(Side& s, float heard, float loop, float edge) {
    const float back = s.line.read_hermite(s.delay.next());
    const float pickup = kInject * heard + loop * back + ceiling_ * seed_ * rng_.bipolar();
    const float b = s.body.bandpass(pickup);
    float i, q;
    s.hilbert.process(b, &i, &q);
    const float size = std::sqrt(i * i + q * q);
    s.follower = flush_denormal(
        size + (s.follower - size) * (size > s.follower ? hold_attack_ : hold_release_));
    const float hold = s.follower > ceiling_ ? ceiling_ / s.follower : 1.0f;
    const float most = 2.0f * ceiling_;
    const float y = kit::clamp(b * hold, -most, most);
    s.line.write(flush_denormal(y));
    // Edge, on the way out only: the loop's signal over its own size is a
    // wave between -1 and 1, and of a sine the Chebyshev polynomials of that
    // are its harmonics. (Fed back, they turned the tone's phase in the loop
    // and pulled it 6 cents off its overtone.)
    const float held = kit::min(size * hold, most);
    const float u = kit::clamp(y / (held + 1.0e-20f), -1.0f, 1.0f);
    const float u2 = u * u;
    const float third = u * (4.0f * u2 - 3.0f);
    const float fifth = u * ((16.0f * u2 - 20.0f) * u2 + 5.0f);
    const float seventh = u * (((64.0f * u2 - 112.0f) * u2 + 56.0f) * u2 - 7.0f);
    const float out =
        y + edge * held * (-third * (1.0f / 3.0f) + fifth * 0.2f - seventh * (1.0f / 7.0f));
    // How far the analytic signal turned in this sample, summed for the pitch.
    s.turn_re += s.i1 * i + s.q1 * q;
    s.turn_im += s.i1 * q - s.q1 * i;
    s.i1 = i;
    s.q1 = q;
    s.level = s.follower * hold;
    return out;
  }

  // Control rate: where each body stands, which overtone each loop is tuned
  // for, and the delay that puts that overtone on a whole multiple of
  // 1 / Distance. `snap` when the loop starts from rest.
  void tune(bool snap) {
    using namespace howl;
    const float sr = sample_rate();
    const float f0 = 1000.0f / param(kDistance);
    const float width = width_.value;
    const double cycles[2] = {static_cast<double>(wander_[0]) * kTwoToMinus64,
                              static_cast<double>(wander_[1]) * kTwoToMinus64};
    const int most = kit::clamp_int(static_cast<int>(0.4f * sr / f0), 1, 4096);
    for (int c = 0; c < 2; ++c) {
      Side& s = side_[c];
      const float lead = c == 1 ? kWanderLead * width : 0.0f;
      const float a = static_cast<float>(cycles[0]) + lead;
      const float b = static_cast<float>(cycles[1]) + lead;
      const float drift = kWanderWeights[0] * kit::SineTable::lookup(a) +
                          kWanderWeights[1] * kit::SineTable::lookup(b);
      const float octaves = body_.value + move_.value * kMoveOctaves * drift +
                            (c == 1 ? width : -width) * kWidthOctaves;
      s.centre = kit::clamp(std::exp2(octaves), kCentreMinHz, kCentreMaxHz);
      s.body.set(s.centre, kBodyQ, sr);

      // The loop's pitch, from the turn of its analytic signal over the tick.
      const float turned = s.turn_re * s.turn_re + s.turn_im * s.turn_im;
      if (turned > 1.0e-30f) {
        const float hz = std::fabs(std::atan2(s.turn_im, s.turn_re)) * sr * (0.5f / kit::kPi);
        s.pitch = s.pitch > 0.0f ? hz + (s.pitch - hz) * pitch_coeff_ : hz;
      }
      s.turn_re = 0.0f;
      s.turn_im = 0.0f;

      // The overtone nearest the body, unless one is singing already.
      float gain, phase;
      int overtone = kit::clamp_int(static_cast<int>(s.centre / f0), 1, most);
      if (overtone < most) {
        float above;
        body_at(static_cast<float>(overtone) * f0, s.body.g, sr, &gain, &phase);
        body_at(static_cast<float>(overtone + 1) * f0, s.body.g, sr, &above, &phase);
        if (above > gain) ++overtone;
      }
      if (!snap && s.pitch > 0.0f && s.follower > kSinging * ceiling_) {
        overtone = kit::clamp_int(static_cast<int>(s.pitch / f0 + 0.5f), 1, most);
      }
      s.overtone = overtone;
      body_at(static_cast<float>(overtone) * f0, s.body.g, sr, &gain, &phase);
      const float period = sr / f0;
      const float delay = kit::clamp(
          period * (1.0f + phase / (kit::kTwoPi * static_cast<float>(overtone))), 2.0f,
          kit::DelayLine<kLineSize>::max_delay() - 4.0f);
      s.delay.set(delay, !snap);
    }
  }

  static constexpr double kTwoToMinus64 = 1.0 / 18446744073709551616.0;
  // The loop counts as singing from this share of the ceiling.
  static constexpr float kSinging = 0.25f;

  // The loop at rest: empty, every follower at zero and every knob where it
  // points, so that it starts the same way whenever it starts again.
  void rest() {
    for (Side& s : side_) {
      s.line.clear();
      s.body.reset();
      s.hilbert.reset();
      s.delay.snap(s.delay.target);
      s.follower = 0.0f;
      s.level = 0.0f;
      s.i1 = s.q1 = 0.0f;
      s.turn_re = s.turn_im = 0.0f;
      s.pitch = 0.0f;
    }
    gain_.snap(gain_.target);
    edge_.snap(edge_.target);
    follow_.snap(follow_.target);
    mix_.snap(mix_.target);
    body_.snap(body_.target);
    move_.snap(move_.target);
    width_.snap(width_.target);
    fast_ = 0.0f;
    slow_ = 0.0f;
    ceiling_ = 0.0f;
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
        gain_.set(loop_gain(value), glide);
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
