#pragma once

// The two kinds of body Graft rings: a waveguide (String, Pipe) and a bank
// of modes (Bar, Bowl). Both answer the same two calls, a chunk at a time:
//
//   body.drive(n, left, right, force)   a driver's loop: `force` is handed the
//                                       body's motion at the contact point
//                                       once a sample and returns the push
//   body.ring(force, n, ...)            a strike: pushed, then left alone
//
// and both are scaled the same way: a steady force of amplitude 1 at the
// note's frequency, pushed in step with `sense`, holds `sense` at amplitude
// 1 (`drive_norm` is the scale that does it). That is what lets one exciter
// drive any body.

#include "../../kit/filters.h"
#include "../../kit/math.h"
#include "graft_band.h"

namespace livemix {
namespace graft {

constexpr int kChunk = 32;  // control period in samples: every ramp below is this long
constexpr float kSixtyDb = 6.907755279f;

// String and Pipe: one delay loop with a loss low-pass.
//
//   force ─►(+)────────────────────────────┬─► comb (Position) ─► left, right
//            ▲                             │
//            └── ±gain ◄── loss ◄── delay ◄┘
//
// - String: the loop is one period long and comes back upright: every
//   harmonic. Pipe: half a period long and comes back inverted, a tube
//   stopped at one end: the odd harmonics only.
// - The loop's phase at the note is exact: the loss low-pass's lag and the
//   interpolated read's own error are taken off the delay. Up the keyboard
//   (a period under about forty samples) an interpolated read would lose
//   more per round than the string is allowed to, so there the line is read
//   on whole samples and a first-order allpass makes the rest, losing
//   nothing; Wander moves the allpass instead of the read.
// - `sense` is the wave coming back to the contact point, through two
//   band-passes at the note that turn no phase there: a driver pushing in
//   step with it feeds the fundamental, and feeds it in time. (With the
//   harmonics left in, a bow's curve turns them into a push that is late,
//   and the note sits up to ten cents flat.)
// - Position is heard as a comb on the way out (the wave against itself a
//   share of a period earlier), a little apart left and right for Width.
class Waveguide {
 public:
  static constexpr int kSize = 4096;
  static constexpr int kMask = kSize - 1;

  void clear() {
    for (float& value : buffer_) value = 0.0f;
    write_ = 0;
    loss_state_ = 0.0f;
    turn_x1_ = turn_y1_ = 0.0f;
    band_[0].reset();
    band_[1].reset();
    primed_ = false;
  }

  // The note. `pipe` picks the half-period, inverting loop.
  void start(bool pipe, float hz, float sample_rate) {
    clear();
    sample_rate_ = sample_rate;
    hz_ = hz;
    passes_ = pipe ? 2.0f : 1.0f;
    sign_ = pipe ? -1.0f : 1.0f;
    w_ = kit::kTwoPi * hz_ / sample_rate_;
    fine_ = w_ > kFineW;
    band_[0].set(hz_, kBandQ, sample_rate_);
    band_[1].set(hz_, kBandQ, sample_rate_);
    bend_ = 1.0f;
  }

  // How long the fundamental rings (to -60 dB) and how long a partial near
  // 3 kHz does. Also retunes: the low-pass's lag depends on its pole.
  void set_loss(float ring_seconds, float high_seconds) {
    const float w2 = kit::kTwoPi * kit::clamp(kit::max(kHighHz, 2.0f * hz_), 0.0f, 0.45f * sample_rate_) / sample_rate_;
    const float c1 = std::cos(w_), c2 = std::cos(w2);
    const float gain1 = std::pow(10.0f, -3.0f / (hz_ * passes_ * kit::max(ring_seconds, 0.001f)));
    const float gain2 = std::pow(10.0f, -3.0f / (hz_ * passes_ * kit::clamp(high_seconds, 0.0005f, ring_seconds)));
    const float wanted = (gain2 / gain1) * (gain2 / gain1);  // squared ratio of the two magnitudes
    float pole = 0.0f;
    if (w2 > w_ && wanted < 1.0f) {
      float lo = 0.0f, hi = kMaxPole;
      if (ratio_squared(hi, c1, c2) < wanted) {
        for (int i = 0; i < 22; ++i) {
          const float mid = 0.5f * (lo + hi);
          if (ratio_squared(mid, c1, c2) > wanted) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      pole = hi;
    }
    // The low-pass may not take more off the fundamental than the loop gain
    // can give back, and the gain stops short of one and of what would let
    // the loop's standing part (a string's loop passes what does not swing
    // at all) ring more than four times as long as the note: left to, it
    // kept a let-go note alive, unheard, for a minute. So up the keyboard
    // and on a damped note, where few partials are left to dull, Decay wins
    // over Bright.
    const float most = kit::min(kMaxGain, std::pow(gain1, 1.0f / kStandingRings));
    const float least = gain1 / most;
    if (least < 1.0f) {
      const float m2 = least * least;
      const float b = 1.0f - m2 * c1;
      const float limit = (b - std::sqrt(kit::max(0.0f, b * b - (1.0f - m2) * (1.0f - m2)))) / (1.0f - m2);
      pole = kit::min(pole, kit::max(limit, 0.0f));
    }
    const float magnitude = (1.0f - pole) / std::sqrt(1.0f - 2.0f * pole * c1 + pole * pole);
    const float gain = kit::min(gain1 / magnitude, most);
    const float round = gain * magnitude;  // what comes back of the fundamental, per pass
    norm_ = (1.0f - round) / round;
    // The low-pass and the gain are reached over one chunk, like the delay.
    if (primed_) {
      pole_step_ = (pole - pole_) * (1.0f / kChunk);
      gain_step_ = (gain - gain_) * (1.0f / kChunk);
    } else {
      pole_ = pole;
      gain_ = gain;
      pole_step_ = gain_step_ = 0.0f;
    }
    // Delay: the loop turns a whole (String) or half (Pipe) cycle at the note.
    const float lag = std::atan2(pole * std::sin(w_), 1.0f - pole * c1) / w_;
    const float nominal = sample_rate_ / (hz_ * passes_);
    const float want = nominal - lag;
    if (fine_) {
      // The whole samples are chosen once: a note never jumps a sample.
      if (!primed_) whole_ = kit::clamp_int(static_cast<int>(want - 0.5f), 1, kSize - 4);
      offset_ = -lag - static_cast<float>(whole_);
    } else {
      float delay = kit::max(want, 2.0f);
      for (int i = 0; i < 3; ++i) delay = kit::max(delay + want - read_lag(w_, delay), 2.0f);
      offset_ = delay - nominal;
    }
    retarget(!primed_);
    primed_ = true;
  }

  // Pitch wander: the note times `ratio`, reached over one chunk.
  void bend(float ratio) {
    bend_ = ratio;
    retarget(false);
  }

  // Where it is excited (a share of the period, 0.06 to 0.5), left and
  // right, and how much of the note goes to each side (1 and 1 in the middle).
  void set_comb(float left, float right, float left_gain, float right_gain, bool snap) {
    const float period = sample_rate_ / hz_;
    const float target[2] = {left, right};
    const float side[2] = {left_gain, right_gain};
    for (int c = 0; c < 2; ++c) {
      const float q = kit::clamp(target[c], 0.06f, 0.5f);
      const float tap = q * period;
      // Half way between holding the fundamental's level and holding the
      // level of everything else: near the end the note thins, but a strike
      // there is not three times the height.
      const float level = side[c] * 0.5f / std::sqrt(std::sin(kit::kPi * q));
      if (snap) {
        tap_[c] = tap;
        level_[c] = level;
        tap_step_[c] = level_step_[c] = 0.0f;
      } else {
        tap_step_[c] = (tap - tap_[c]) * (1.0f / kChunk);
        level_step_[c] = (level - level_[c]) * (1.0f / kChunk);
      }
    }
  }

  // The ramps of a chunk have landed.
  void settle() {
    delay_step_ = turn_step_ = pole_step_ = gain_step_ = 0.0f;
    for (int c = 0; c < 2; ++c) tap_step_[c] = level_step_[c] = 0.0f;
  }

  // `n` samples under a driver. `force(sense, i)` is called once a sample
  // with the body's motion at the contact point and returns the push.
  template <typename Force>
  void drive(int n, float* left, float* right, Force&& force) {
    Loop loop = load();
    Band first = band_[0], second = band_[1];
    for (int i = 0; i < n; ++i) {
      const float back = come_back(loop);
      const float y = back + force(second.pass(first.pass(back)), i);
      go_out(loop, y, &left[i], &right[i]);
    }
    band_[0] = first;
    band_[1] = second;
    store(loop);
  }

  // `n` samples of the body by itself, pushed by `force[i]`.
  void ring(const float* force, int n, float* left, float* right) {
    Loop loop = load();
    for (int i = 0; i < n; ++i) go_out(loop, come_back(loop) + force[i], &left[i], &right[i]);
    store(loop);
  }

  // Once a chunk, whatever the block size: nothing in the loop is left to
  // crawl through denormals.
  void flush() {
    loss_state_ = flush_denormal(loss_state_);
    turn_x1_ = flush_denormal(turn_x1_);
    turn_y1_ = flush_denormal(turn_y1_);
    band_[0].flush();
    band_[1].flush();
  }

  float drive_norm() const { return norm_; }

 private:
  static constexpr float kBandQ = 3.5f;
  static constexpr float kHighHz = 3000.0f;
  static constexpr float kMaxPole = 0.98f;
  static constexpr float kMaxGain = 0.9999f;
  static constexpr float kStandingRings = 4.0f;
  static constexpr float kFineW = 0.15f;  // about 1.1 kHz at 48 kHz

  // What a run of samples keeps in registers.
  struct Loop {
    int write, whole;
    float loss, delay, delay_step, turn, turn_step, turn_x1, turn_y1;
    float tap[2], tap_step[2], level[2], level_step[2];
    float pole, pole_step, gain, gain_step;
    bool fine;
  };

  Loop load() const {
    return {write_, whole_, loss_state_, delay_, delay_step_, turn_, turn_step_, turn_x1_, turn_y1_,
            {tap_[0], tap_[1]}, {tap_step_[0], tap_step_[1]}, {level_[0], level_[1]},
            {level_step_[0], level_step_[1]}, pole_, pole_step_, sign_ * gain_, sign_ * gain_step_, fine_};
  }

  void store(const Loop& loop) {
    write_ = loop.write;
    loss_state_ = loop.loss;
    delay_ = loop.delay;
    turn_ = loop.turn;
    turn_x1_ = loop.turn_x1;
    turn_y1_ = loop.turn_y1;
    pole_ = loop.pole;
    gain_ = sign_ * loop.gain;
    for (int c = 0; c < 2; ++c) {
      tap_[c] = loop.tap[c];
      level_[c] = loop.level[c];
    }
  }

  // The wave coming back round the loop to the contact point.
  float come_back(Loop& loop) const {
    float x;
    if (loop.fine) {
      x = buffer_[(loop.write - loop.whole) & kMask];
    } else {
      const int whole = static_cast<int>(loop.delay);
      const float fraction = loop.delay - static_cast<float>(whole);
      x = kit::hermite(buffer_[(loop.write - whole + 1) & kMask], buffer_[(loop.write - whole) & kMask],
                       buffer_[(loop.write - whole - 1) & kMask], buffer_[(loop.write - whole - 2) & kMask], fraction);
      loop.delay += loop.delay_step;
    }
    loop.loss = x + (loop.loss - x) * loop.pole;
    loop.pole += loop.pole_step;
    float y = loop.loss;
    if (loop.fine) {
      const float out = loop.turn * y + loop.turn_x1 - loop.turn * loop.turn_y1;
      loop.turn_x1 = y;
      loop.turn_y1 = out;
      loop.turn += loop.turn_step;
      y = out;
    }
    const float back = loop.gain * y;
    loop.gain += loop.gain_step;
    return back;
  }

  // The wave leaving the contact point: into the line, and out through the comb.
  void go_out(Loop& loop, float y, float* left, float* right) {
    buffer_[loop.write] = y;
    loop.write = (loop.write + 1) & kMask;
    float out[2];
    for (int c = 0; c < 2; ++c) {
      const int whole = static_cast<int>(loop.tap[c]);
      const float fraction = loop.tap[c] - static_cast<float>(whole);
      const float a = buffer_[(loop.write - 1 - whole) & kMask];
      const float b = buffer_[(loop.write - 2 - whole) & kMask];
      out[c] = (y - (a + (b - a) * fraction)) * loop.level[c];
      loop.tap[c] += loop.tap_step[c];
      loop.level[c] += loop.level_step[c];
    }
    *left = out[0];
    *right = out[1];
  }

  // (|H(w2)| / |H(w1)|)² of the loss low-pass with pole a.
  static float ratio_squared(float a, float c1, float c2) {
    return (1.0f - 2.0f * a * c1 + a * a) / (1.0f - 2.0f * a * c2 + a * a);
  }

  // The delay in samples a component at `w` really gets from the Hermite
  // read of `delay`: the four taps' weights, each at its own delay.
  static float read_lag(float w, float delay) {
    const int whole = static_cast<int>(delay);
    const float t = delay - static_cast<float>(whole);
    const float t2 = t * t, t3 = t2 * t;
    const float taps[4] = {-0.5f * t + t2 - 0.5f * t3, 1.0f - 2.5f * t2 + 1.5f * t3,
                           0.5f * t + 2.0f * t2 - 1.5f * t3, -0.5f * t2 + 0.5f * t3};
    float re = 0.0f, im = 0.0f;
    for (int k = 0; k < 4; ++k) {
      const float angle = w * static_cast<float>(k - 1);
      re += taps[k] * std::cos(angle);
      im += taps[k] * std::sin(angle);
    }
    return static_cast<float>(whole) + std::atan2(im, re) / w;
  }

  void retarget(bool snap) {
    const float length = sample_rate_ / (hz_ * bend_ * passes_) + offset_;
    if (fine_) {
      // What the line's whole samples leave (about 0.5 to 1.5) is the allpass's.
      const float rest = kit::clamp(length, 0.2f, 1.8f);
      const float turn = std::sin((1.0f - rest) * w_ * 0.5f) / std::sin((1.0f + rest) * w_ * 0.5f);
      if (snap) {
        turn_ = turn;
        turn_step_ = 0.0f;
      } else {
        turn_step_ = (turn - turn_) * (1.0f / kChunk);
      }
      return;
    }
    const float target = kit::clamp(length, 2.0f, static_cast<float>(kSize - 4));
    if (snap) {
      delay_ = target;
      delay_step_ = 0.0f;
    } else {
      delay_step_ = (target - delay_) * (1.0f / kChunk);
    }
  }

  float buffer_[kSize] = {};
  int write_ = 0;
  Band band_[2];
  float sample_rate_ = 48000.0f, hz_ = 220.0f, w_ = 0.03f;
  float passes_ = 1.0f, sign_ = 1.0f, bend_ = 1.0f;
  float pole_ = 0.0f, pole_step_ = 0.0f, gain_ = 0.0f, gain_step_ = 0.0f, norm_ = 0.0f, offset_ = 0.0f;
  float loss_state_ = 0.0f;
  float delay_ = 32.0f, delay_step_ = 0.0f;
  int whole_ = 32;
  float turn_ = 0.0f, turn_step_ = 0.0f, turn_x1_ = 0.0f, turn_y1_ = 0.0f;
  bool fine_ = false;
  float tap_[2] = {8.0f, 8.0f}, tap_step_[2] = {0.0f, 0.0f};
  float level_[2] = {1.0f, 1.0f}, level_step_[2] = {0.0f, 0.0f};
  bool primed_ = false;
};

// Bar and Bowl: five modes, each one complex number turned and shrunk a
// little every sample (z' = r·e^jw·z + force). The real part is the sound.
//
// - Bar: the five lowest bending modes of a free bar (1, 2.756, 5.404,
//   8.933, 13.34). Position weights each by its shape where it is excited:
//   in the middle the even ones vanish. Width lays the bars out in a row.
// - Bowl: five modes (1, 2.71, 5.15, 8.2, 11.9), each heard as a pair a
//   fraction of a hertz apart, one half leaning left and one right, so every
//   partial beats and turns between the speakers. The two halves of a pair
//   lose alike and are pushed alike, so one number serves both: the second
//   half is the first turned by a phase that creeps round at the rate the
//   two are apart, and that turn is done on the way out (`spin`, once a
//   chunk). Position thins the upper pairs.
// - Each mode's ring time is the lowest one's over 1 + d·(ratio - 1): `d`
//   small is metal, large is wood.
// - A driver's loop goes round the lowest mode alone (`drive_one`, sample by
//   sample); the rest go through `ring` a chunk at a time, as every mode
//   does for a strike. Under a driver the others are pushed by its
//   roughness (the noise in breath and bow), so a blown or bowed bar still
//   has a bar's partials, shimmering: `rub_norm` scales that push.
class Modes {
 public:
  static constexpr int kMaxModes = 5;

  void clear() {
    for (int k = 0; k < kMaxModes; ++k) re_[k] = im_[k] = 0.0f;
    band_.reset();
  }

  void start(bool bowl, float hz, float sample_rate) {
    clear();
    bowl_ = bowl;
    sample_rate_ = sample_rate;
    hz_ = hz;
    // The second half of each pair lies a little above the first, further
    // for the upper pairs and never over ten cents.
    const float beat = kit::min(kBeatHz * std::sqrt(hz / 220.0f), 0.006f * hz);
    for (int k = 0; k < kMaxModes; ++k) {
      ratio_[k] = bowl ? kBowlRatio[k] : kBarRatio[k];
      const float mode_hz = hz * ratio_[k];
      live_[k] = mode_hz < 0.45f * sample_rate;
      const float w = kit::kTwoPi * mode_hz / sample_rate;
      angle_[k] = w;
      cos_[k] = std::cos(w);
      sin_[k] = std::sin(w);
      radius_[k] = 0.0f;
      step_re_[k] = step_im_[k] = 0.0f;
      weight_[k] = 0.0f;
      creep_[k] = bowl ? beat * (1.0f + 0.7f * static_cast<float>(k)) * kChunk / sample_rate : 0.0f;
      phase_[k] = 0.0f;
      for (int g = 0; g < 4; ++g) gain_[k][g] = gain_step_[k][g] = 0.0f;
      for (int g = 0; g < 4; ++g) side_[k][g] = 0.0f;
    }
    band_.set(hz, kSenseQ, sample_rate);
    swing_ = 1.0f;
    swing_step_ = 0.0f;
    until_aim_ = 0;
    bend_ = 1.0f;
  }

  // `ring_seconds` for the lowest mode; `damping` is d above.
  void set_loss(float ring_seconds, float damping) {
    for (int k = 0; k < kMaxModes; ++k) {
      const float seconds = kit::max(ring_seconds, 0.001f) / (1.0f + damping * (ratio_[k] - 1.0f));
      radius_[k] = live_[k] ? std::exp(-kSixtyDb / (seconds * sample_rate_)) : 0.0f;
    }
    norm_ = 2.0f * (1.0f - radius_[0]) / radius_[0];
    rub_ = kRubNorm * std::sqrt(1.0f - radius_[0]);
    turn();
  }

  void bend(float ratio) {
    bend_ = ratio;
    turn();
  }

  // Where it is excited (0 the end or rim, 1 the middle or base) and how
  // far the modes are spread left and right.
  void set_position(float position, float width, bool snap) {
    const float x = 0.03f + 0.47f * position;
    for (int k = 0; k < kMaxModes; ++k) {
      float weight, pan;
      if (bowl_) {
        weight = std::pow(1.0f - 0.85f * position, static_cast<float>(k));
        // The halves of a pair lean to opposite sides; alternate pairs swap.
        pan = ((k & 1) ? 0.75f : -0.75f) * width;
      } else {
        const float turned = (static_cast<float>(k) + 1.5f) * kit::kPi * (x - 0.5f);
        // The lowest mode is always there; the others come and go against it.
        weight = k == 0 ? 1.0f : ((k & 1) ? std::sin(turned) : std::cos(turned));
        // Bars lie in a row, low on the left: each has its place by its
        // note, and its upper modes sit either side of that.
        const float place = kBarRow * kit::clamp(std::log2(hz_ / 261.63f), -1.6f, 1.6f);
        pan = kit::clamp((place + (k == 0 ? 0.0f : ((k & 1) ? -0.5f : 0.5f))) * width, -1.0f, 1.0f);
      }
      weight_[k] = live_[k] ? weight : 0.0f;
      const float centre = kit::kSqrtHalf * 2.0f;  // centre is 1
      kit::pan_gains(pan, &side_[k][0], &side_[k][1]);
      side_[k][0] *= centre;
      side_[k][1] *= centre;
      side_[k][2] = side_[k][3] = 0.0f;
      if (bowl_) {
        kit::pan_gains(-pan, &side_[k][2], &side_[k][3]);
        side_[k][2] *= centre * kMateLevel;
        side_[k][3] *= centre * kMateLevel;
      }
    }
    // A bowl's way out is always on its way somewhere: the new sides are
    // taken up when it is next aimed.
    if (snap || !bowl_) aim(snap);
  }

  // Once a chunk. A bowl's pairs creep on, each second half against its
  // first, and every fourth chunk the way out is aimed at where they will be
  // four chunks on (a beat is slow: a straight line that long is the turn).
  void spin() {
    if (!bowl_) return;
    for (int k = 0; k < kMaxModes; ++k) {
      phase_[k] += creep_[k];
      phase_[k] -= std::floor(phase_[k]);
    }
    if (--until_aim_ <= 0) {
      until_aim_ = kAimEvery;
      aim(false);
    }
  }

  // The ramps of a chunk have landed (a bowl's run on: `spin` sets them).
  void settle() {
    if (bowl_) return;
    for (int k = 0; k < kMaxModes; ++k) {
      for (int g = 0; g < 4; ++g) gain_step_[k][g] = 0.0f;
    }
  }

  // How much of its full swing a bowl's lowest pair has (the two halves
  // together are 1), a sample at a time, for what is heard beside it; 1 for
  // a bar.
  float swing() const { return swing_; }
  float swing_step() const { return swing_step_; }
  void keep_swing(float value) { swing_ = value; }

  // Where a bar lies in its row, for the exciter's own sound beside it. A
  // bowl's is in the middle.
  float place_left() const { return bowl_ ? 1.0f : gain_[0][0]; }
  float place_right() const { return bowl_ ? 1.0f : gain_[0][1]; }

  float drive_norm() const { return norm_; }

  // A driver's roughness (even noise between -1 and 1), times this and the
  // level wanted, holds a mode that rings as long as the driven one at that
  // level; one that rings less is that much quieter.
  float rub_norm() const { return rub_; }

  // `n` samples of the lowest mode under a driver; its sound is added to
  // left and right. `force(sense, i)` is called once a sample with where the
  // mode will be if nothing pushes it (through the same band-pass as a
  // waveguide's: a mode pushed by a force with harmonics in it moves a
  // little at those harmonics too) and returns the push.
  template <typename Force>
  void drive_one(int n, float* left, float* right, Force&& force) {
    if (bowl_) {
      drive_as<true>(n, left, right, force);
    } else {
      drive_as<false>(n, left, right, force);
    }
  }

  // `n` samples of the modes from `first` up to `last`, each pushed by
  // `force` times its weight; their sound is added to left and right. Two
  // modes a pass.
  void ring(const float* force, int n, int first, int last, float* left, float* right) {
    if (bowl_) {
      ring_as<true>(force, n, first, last, left, right);
    } else {
      ring_as<false>(force, n, first, last, left, right);
    }
  }

  // Once a chunk, whatever the block size.
  void flush() {
    for (int k = 0; k < kMaxModes; ++k) {
      re_[k] = flush_denormal(re_[k]);
      im_[k] = flush_denormal(im_[k]);
    }
    band_.flush();
  }

 private:
  static constexpr float kBarRatio[5] = {1.0f, 2.756f, 5.404f, 8.933f, 13.34f};
  static constexpr float kBowlRatio[5] = {1.0f, 2.71f, 5.15f, 8.2f, 11.9f};
  static constexpr float kSenseQ = 3.5f;
  static constexpr float kBarRow = 0.25f;     // pan per octave from middle C, Width at 1
  static constexpr float kBeatHz = 0.7f;      // the lowest pair at 220 Hz
  static constexpr float kMateLevel = 0.7f;   // the second half of each pair, against the first
  static constexpr int kAimEvery = 4;         // chunks between two aims of a bowl's way out
  static constexpr float kRubNorm = 2.4494897f;  // √2 over the deviation of even noise, 1/√3

  // A mode's way out: its two sides, and for a bowl (`Turned`) what the
  // second half's turn adds, which takes the other part of the number.
  struct Way {
    float gain[4], step[4];
    template <bool Turned>
    void out(float re, float im, float* left, float* right) {
      if (Turned) {
        *left += gain[0] * re - gain[2] * im;
        *right += gain[1] * re - gain[3] * im;
        gain[2] += step[2];
        gain[3] += step[3];
      } else {
        *left += gain[0] * re;
        *right += gain[1] * re;
      }
      gain[0] += step[0];
      gain[1] += step[1];
    }
  };

  template <bool Turned, typename Force>
  void drive_as(int n, float* left, float* right, Force&& force) {
    float re = re_[0], im = im_[0];
    const float step_re = step_re_[0], step_im = step_im_[0];
    Way way = load(0);
    Band band = band_;
    for (int i = 0; i < n; ++i) {
      const float coming = step_re * re - step_im * im;
      const float push = force(band.pass(coming), i);
      im = step_re * im + step_im * re;
      re = coming + push;
      float l = left[i], r = right[i];
      way.template out<Turned>(re, im, &l, &r);
      left[i] = l;
      right[i] = r;
    }
    re_[0] = re;
    im_[0] = im;
    store(0, way);
    band_ = band;
  }

  template <bool Turned>
  void ring_as(const float* force, int n, int first, int last, float* left, float* right) {
    const float* weight = weight_;
    int live[kMaxModes], count = 0;
    for (int k = first; k < last; ++k) {
      if (live_[k]) live[count++] = k;
    }
    for (int at = 0; at < count; at += 2) {
      const int a = live[at];
      const bool two = at + 1 < count;
      const int b = two ? live[at + 1] : a;
      float re_a = re_[a], im_a = im_[a], re_b = re_[b], im_b = im_[b];
      const float cos_a = step_re_[a], sin_a = step_im_[a], in_a = weight[a];
      const float cos_b = step_re_[b], sin_b = step_im_[b], in_b = weight[b];
      Way way_a = load(a), way_b = load(b);
      if (two) {
        for (int i = 0; i < n; ++i) {
          const float pushed = force[i];
          const float turned_a = cos_a * re_a - sin_a * im_a + in_a * pushed;
          const float turned_b = cos_b * re_b - sin_b * im_b + in_b * pushed;
          im_a = cos_a * im_a + sin_a * re_a;
          im_b = cos_b * im_b + sin_b * re_b;
          re_a = turned_a;
          re_b = turned_b;
          float l = left[i], r = right[i];
          way_a.template out<Turned>(re_a, im_a, &l, &r);
          way_b.template out<Turned>(re_b, im_b, &l, &r);
          left[i] = l;
          right[i] = r;
        }
        re_[b] = re_b;
        im_[b] = im_b;
        store(b, way_b);
      } else {
        for (int i = 0; i < n; ++i) {
          const float turned = cos_a * re_a - sin_a * im_a + in_a * force[i];
          im_a = cos_a * im_a + sin_a * re_a;
          re_a = turned;
          float l = left[i], r = right[i];
          way_a.template out<Turned>(re_a, im_a, &l, &r);
          left[i] = l;
          right[i] = r;
        }
      }
      re_[a] = re_a;
      im_[a] = im_a;
      store(a, way_a);
    }
  }

  Way load(int k) const {
    return {{gain_[k][0], gain_[k][1], gain_[k][2], gain_[k][3]},
            {gain_step_[k][0], gain_step_[k][1], gain_step_[k][2], gain_step_[k][3]}};
  }

  void store(int k, const Way& way) {
    for (int g = 0; g < 4; ++g) gain_[k][g] = way.gain[g];
  }

  // The way out of every mode: at once as its sides and its pair's turn
  // stand, or over the chunks until it is next aimed, to where the turn will
  // be by then.
  void aim(bool snap) {
    const float ramp = 1.0f / static_cast<float>((bowl_ ? kAimEvery : 1) * kChunk);
    for (int k = 0; k < kMaxModes; ++k) {
      float target[4] = {side_[k][0], side_[k][1], 0.0f, 0.0f};
      if (bowl_) {
        const float phase = phase_[k] + (snap ? 0.0f : creep_[k] * static_cast<float>(kAimEvery - 1));
        const float c = kit::SineTable::cos_lookup(phase), s = kit::SineTable::lookup(phase);
        target[0] += side_[k][2] * c;
        target[1] += side_[k][3] * c;
        target[2] = side_[k][2] * s;
        target[3] = side_[k][3] * s;
        if (k == 0) {
          const float with = 1.0f + kMateLevel * c, across = kMateLevel * s;
          const float swing = std::sqrt(with * with + across * across) * (1.0f / (1.0f + kMateLevel));
          swing_step_ = snap ? 0.0f : (swing - swing_) * ramp;
          if (snap) swing_ = swing;
        }
      }
      for (int g = 0; g < 4; ++g) {
        if (snap) {
          gain_[k][g] = target[g];
          gain_step_[k][g] = 0.0f;
        } else {
          gain_step_[k][g] = (target[g] - gain_[k][g]) * ramp;
        }
      }
    }
  }

  // Each mode's step for the note as bent: a small turn of its own step.
  void turn() {
    for (int k = 0; k < kMaxModes; ++k) {
      const float delta = angle_[k] * (bend_ - 1.0f);
      const float c = 1.0f - 0.5f * delta * delta;
      step_re_[k] = radius_[k] * (cos_[k] * c - sin_[k] * delta);
      step_im_[k] = radius_[k] * (sin_[k] * c + cos_[k] * delta);
    }
  }

  float re_[kMaxModes] = {}, im_[kMaxModes] = {};
  float step_re_[kMaxModes] = {}, step_im_[kMaxModes] = {};
  float cos_[kMaxModes] = {}, sin_[kMaxModes] = {}, angle_[kMaxModes] = {};
  float radius_[kMaxModes] = {}, ratio_[kMaxModes] = {};
  float weight_[kMaxModes] = {};
  float gain_[kMaxModes][4] = {}, gain_step_[kMaxModes][4] = {};  // left, right, and the turn's left, right
  float side_[kMaxModes][4] = {};  // first half left, right; second half left, right
  float creep_[kMaxModes] = {}, phase_[kMaxModes] = {};
  bool live_[kMaxModes] = {};
  Band band_;
  bool bowl_ = false;
  float sample_rate_ = 48000.0f, hz_ = 220.0f, bend_ = 1.0f;
  float norm_ = 0.0f, rub_ = 0.0f, swing_ = 1.0f, swing_step_ = 0.0f;
  int until_aim_ = 0;
};

}  // namespace graft
}  // namespace livemix
