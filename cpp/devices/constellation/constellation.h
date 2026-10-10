#pragma once

// Constellation: up to twelve echoes of what was played, placed in one span
// of time by a pattern and not by a grid.
//
//   in ─┬──────────────────────────────────────────────────────────────────► dry ─┐
//       └ L, R ─► one signal ─► share ─(+)─► limit ─► line ─┬─► star 1 ─► low-pass ─► level, side ─┐   │
//                                       ▲                   ├─► star 2 ─► low-pass ─► level, side ─(+)─► limit ─► wet ─┴─► out
//                                       │                   ┆      (up to twelve)                  │
//                                       │                   └─► last star (at Span) ───────────────┘
//                                       └── Again ◄─ low cut ◄─ low-pass (Tone) ◄─┘
//
// - The line is one signal for the two sides: their middle, and a quarter turn
//   from it their difference (kit::Hilbert: the middle down one chain of
//   all-passes, the difference down the other). A sound in the middle is the
//   sum it always was; a sound on one side, two unrelated sides and two sides
//   in opposite phase all go in at the mean power of the two sides, where a
//   plain sum would lose 3 dB of a wide sound and all of an anti-phase one.
//   (The harness holds a tone on one side to 3 dB under the same tone in the
//   middle from 40 Hz to 12 kHz.) The all-passes turn the phase and delay
//   next to nothing: an echo of a 2 kHz burst is centred a fifth of a
//   millisecond late, the lowest bass a few milliseconds.
// - Every star is one read of the line at its own share of Span (sky.h has
//   the patterns), through a low-pass of its own, at a level and a side of
//   its own. The levels are scaled so that their powers add to one whatever
//   Stars is: a held sound comes back as loud with twelve stars as with one,
//   and each star is the fainter the more of them there are.
// - Fade makes a star quieter and darker by its time: 2^(-3 Fade time) on its
//   level and on its low-pass corner. Tone is the corner of a star at the
//   start of the span; a star the pattern made dim is up to an octave darker.
// - Again records the last star's read (what was played one Span ago) back
//   into the line through Tone's low-pass and a low cut at 90 Hz, so the
//   whole sky sounds again one Span later, quieter by Again and thinner. The
//   passes share the level as the stars do: what goes into the line is scaled
//   by sqrt(1 - (0.97 Again)^2), so the passes of a held sound add to about
//   the level of one sky with no Again (unscaled they add to 6.5 dB more at
//   0.93 and 12 dB at the top), and one pass is the fainter the longer the
//   sky hangs on: 0.5 dB at the default, 7.3 dB at 0.93, 12.3 dB at the top.
//   The record path is limited (exactly linear up to ±1, never past ±2),
//   which bounds the loop at Again 1.
// - Span moved by up to 50 ms glides there (a 120 ms lag), so a nudge bends
//   every echo the way a tape's speed does, by its share of the span: the
//   read never runs slower than 0.58 of the speed or faster than 1.42. A
//   larger move would read the line backwards or at three times the speed
//   for seconds: it lays the sky at the new span beside the old one and
//   crosses to it in 60 ms, as a new Pattern or Shuffle does. Stars fades a
//   star in or out. A crossing keeps the power: the stars of the two skies
//   are different moments of the line, so they cross on a quarter of a sine;
//   the last star, when the span is the same, is the same read in both and
//   crosses in a straight line.
// - Drift moves each star's read by up to 6 ms (never more than half the
//   star's own time) on three slow sines of its own (sky.h), so the echoes
//   detune against each other by a few cents (under 9 at the most) and a
//   held note swells and fades in them over seconds. Its clock counts every
//   sample from the moment the device is made, asleep or awake, and nothing
//   the sound does sets it back.
// - Rest: the device counts the samples since anything above -140 dBFS was
//   written to the line. Once that is longer than the longest Span it is at
//   rest, and sleeps. The first sound after a rest, on either side, starts it
//   again from a known state on that very sample (every knob where it was
//   last put, the wander where its clock has it), so what comes out does not
//   depend on the block size or on when the sleep began.
//
// Storage: one line of 2^20 samples (4 MB): 10.9 s at 96 kHz, which holds the
// longest Span and the wander. At 176.4 and 192 kHz the line is 5.4 s and a
// longer Span stops there. `memoryMb` is 8. No latency.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "sky.h"

namespace livemix {

class Constellation : public kit::DeviceBase<constellation::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace constellation;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    line_.clear();
    mid_turn_.reset();
    side_turn_.reset();
    fade_.set_time(kSmoothingSeconds, control_rate);
    width_.set_time(kSmoothingSeconds, control_rate);
    tone_.set_time(0.02f, control_rate);
    drift_.set_time(0.02f, control_rate);
    for (kit::Smoother& lit : lit_) lit.set_time(kLightSeconds, control_rate);
    again_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    glide_ = 1.0 - std::exp(-1.0 / (static_cast<double>(kMotorLagSeconds) * sr));
    glide_most_ = static_cast<double>(kGlideMostSeconds) * sr;
    cross_step_ = static_cast<float>(kControlPeriod) / (kCrossSeconds * sr);
    low_cut_.set_cutoff(kLoopLowCutHz, sr);
    drift_period_ = static_cast<long long>(std::llround(static_cast<double>(kDriftPeriodSeconds) * sr));
    rest_ = static_cast<long>((kParamMax[kSpan] * 0.001f + 0.5f) * sr);
    blank_ = rest_;
    asleep_ = true;
    current_ = 0;
    pattern_[0] = pattern_[1] = -1;
    seed_[0] = seed_[1] = -1;
    share_fade_[0] = share_fade_[1] = -1.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    drift_n_ = 0;
    starts_ = 0;
    restart();
    span_seen_ = span_[current_];
    clock_seen_ = 0.0f;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, where the span stands now, in milliseconds (Span, or on its way there
  // while it glides; the span of the sky being crossed to; asleep, where it
  // will stand);
  // 1, the clock the wander is worked out from (sky.h): seconds since the
  // device was made, wrapping at kDriftPeriodSeconds.
  float meter(int index) const {
    if (index == 0) {
      return static_cast<float>((asleep_ ? span_target_ : span_seen_) * 1000.0 / sample_rate());
    }
    if (index == 1) return clock_seen_;
    return 0.0f;
  }

  void process(int frames) {
    using namespace constellation;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        // The wander's clock runs on through a sleep.
        drift_n_ = (drift_n_ + frames) % drift_period_;
        clock_seen_ = static_cast<float>(static_cast<double>(drift_n_) / sample_rate());
        return;
      }
      asleep_ = false;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or a runaway sample on either side must not sit in the line for
      // eight seconds, nor in the all-passes for good: it is taken as silence.
      float left = in[0];
      float right = in[1];
      if (!(left > -kInputLimit && left < kInputLimit)) left = 0.0f;
      if (!(right > -kInputLimit && right < kInputLimit)) right = 0.0f;
      // The first sound after a rest, on either side (two sides in opposite
      // phase are a sound too): start from a known state, on this sample.
      if (blank_ >= rest_ && (left > kFloor || left < -kFloor || right > kFloor || right < -kFloor)) {
        restart();
        // The rest is over with this sample, whatever of it has reached the
        // line yet (the all-passes hold the middle back by a sample).
        blank_ = 0;
      }
      if (clock_.tick()) control();

      // The one signal the line takes: the middle of the two sides and, a
      // quarter turn from it, their difference.
      float mid, side, unused;
      mid_turn_.process(0.5f * (left + right), &mid, &unused);
      side_turn_.process(0.5f * (left - right), &unused, &side);
      const float send = mid + side;

      // Span is the distance to the last star. A small move glides there with
      // a motor's lag; a larger one is a new sky (control()). A double: the
      // lag's last steps are smaller than a float of this size can hold.
      if (!fading_ && span_[current_] != span_target_) {
        const double gap = span_target_ - span_[current_];
        if (gap <= glide_most_ && gap >= -glide_most_) {
          span_[current_] += gap * glide_;
          if (std::fabs(span_target_ - span_[current_]) < 1.0e-3) span_[current_] = span_target_;
        }
      }

      float wet[2] = {0.0f, 0.0f};
      // What Again records: the last star's read of the sky that is lit, or
      // of the two while one crosses into the other.
      float last = 0.0f;
      float anchor = 0.0f;
      const int skies = fading_ ? 2 : 1;
      for (int which = 0; which < skies; ++which) {
        const int s = which == 0 ? current_ : current_ ^ 1;
        // The last star's read. Two skies of one span share it.
        if (which == 0 || !same_span_) {
          anchor_off_[s] += anchor_off_step_[s];
          anchor = read_at(span_[s] + anchor_off_[s]);
        }
        loop_gain_[s] += loop_gain_step_[s];
        last += loop_gain_[s] * anchor;
        Star* stars = stars_[s];
        const float* times = sky_[s].time;
        const double span = span_[s];
        for (int k = 0; k < kPlaces; ++k) {
          Star& star = stars[k];
          if (!star.on) continue;
          star.left += star.left_step;
          star.right += star.right_step;
          float heard = anchor;
          if (k > 0) {
            star.off += star.off_step;
            heard = read_at(static_cast<double>(times[k]) * span + star.off);
          }
          heard = star.tone.lowpass(heard);
          wet[0] += heard * star.left;
          wet[1] += heard * star.right;
        }
      }

      // The passes share the level: the more is fed back, the less goes in.
      const float again = again_.next();
      if (again != again_seen_) {
        again_seen_ = again;
        send_gain_ = again_share(again);
      }
      const float back = low_cut_.highpass(loop_tone_.lowpass(last));
      const float record = flush_denormal(limit(send_gain_ * send + again * back));
      line_.write(record);
      if (record > kFloor || record < -kFloor) {
        blank_ = 0;
      } else if (blank_ < kLongEnough) {
        ++blank_;
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + limit(wet[0]) * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + limit(wet[1]) * wet_gain_;

      if (++drift_n_ >= drift_period_) drift_n_ = 0;
    }
    span_seen_ = span_[fading_ ? current_ ^ 1 : current_];
    clock_seen_ = static_cast<float>(static_cast<double>(drift_n_) / sample_rate());
    // Asleep once nothing comes in, the whole line has been blank for longer
    // than the longest span, and what the filters still hold has died away.
    if (!excited && blank_ >= rest_ && output_peak(frames) <= kFloor) asleep_ = true;
  }

  bool asleep() const { return asleep_; }
  // How many times it has started from rest (init is the first), for the harness.
  int starts() const { return starts_; }
  // The sky that is lit (or being crossed to), for the harness.
  const constellation::Sky& sky() const { return sky_[fading_ ? current_ ^ 1 : current_]; }

 private:
  // 8 s at 96 kHz, the wander's reach and room to read around a place.
  static constexpr int kLineSize = 1048576;
  static constexpr int kControlPeriod = 32;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kFloor = kit::IdleGate::kFloor;
  static constexpr float kInputLimit = 8.0f;
  static constexpr float kMotorLagSeconds = 0.12f;
  // The furthest Span glides. With the lag this is the fastest the span
  // moves, 0.05 / 0.12 of a sample a sample: the last star is read at 0.58 to
  // 1.42 of the speed at the worst, the others nearer to it.
  static constexpr float kGlideMostSeconds = 0.05f;
  // The Q of every star's low-pass and of the loop's.
  static constexpr float kToneQ = 0.6f;
  static constexpr float kLoopLowCutHz = 90.0f;
  // How long a star takes to light or go out (a time constant), and how long
  // one sky takes to cross into another.
  static constexpr float kLightSeconds = 0.015f;
  static constexpr float kCrossSeconds = 0.06f;
  static constexpr float kSqrt2 = 1.41421356f;

  // One star of one sky: its low-pass, and the gains and the wander it is on
  // its way to, a straight line from one control tick to the next.
  struct Star {
    kit::Svf tone;
    float left = 0.0f, right = 0.0f;
    float left_to = 0.0f, right_to = 0.0f;
    float left_step = 0.0f, right_step = 0.0f;
    float off = 0.0f, off_to = 0.0f, off_step = 0.0f;
    // The corner its low-pass is set to (0: not set).
    float corner = 0.0f;
    bool on = false;

    void rest() {
      tone.reset();
      left = right = left_to = right_to = left_step = right_step = 0.0f;
      off = off_to = off_step = 0.0f;
      corner = 0.0f;
      on = false;
    }
  };

  // Exactly linear up to ±1, never past ±2.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // The line `delay` samples ago. Whole samples and the fraction are split
  // from a double, so a read is as fine at eight seconds as at ten
  // milliseconds.
  float read_at(double delay) const {
    const double longest = kit::DelayLine<kLineSize>::max_delay() - 8.0;
    if (delay < 4.0) delay = 4.0;
    if (delay > longest) delay = longest;
    const int whole = static_cast<int>(delay);
    const float fraction = static_cast<float>(delay - whole);
    return kit::hermite(line_.read(whole - 1), line_.read(whole), line_.read(whole + 1),
                        line_.read(whole + 2), fraction);
  }

  // Everything settled and nothing sounding: at init, and on the first sound
  // after a rest. The line is left as it is: what it holds is under the floor.
  void restart() {
    using namespace constellation;
    clock_.reset(kControlPeriod);
    ++starts_;
    span_[current_] = span_target_;
    fade_.snap(fade_.target);
    width_.snap(width_.target);
    tone_.snap(tone_.target);
    drift_.snap(drift_.target);
    again_.snap(again_.target);
    mix_.snap(mix_.target);
    for (kit::Smoother& lit : lit_) lit.snap(lit.target);
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    again_seen_ = -1.0f;
    fading_ = false;
    same_span_ = true;
    cross_ = 0.0f;
    if (want_pattern_ != pattern_[current_] || want_seed_ != seed_[current_]) {
      lay_out(want_pattern_, want_seed_, &sky_[current_]);
      share_fade_[current_] = -1.0f;
      pattern_[current_] = want_pattern_;
      seed_[current_] = want_seed_;
    }
    for (int s = 0; s < 2; ++s) {
      for (int k = 0; k < kPlaces; ++k) stars_[s][k].rest();
      anchor_off_[s] = anchor_off_to_[s] = anchor_off_step_[s] = 0.0f;
      loop_gain_[s] = loop_gain_to_[s] = loop_gain_step_[s] = 0.0f;
    }
    loop_tone_.reset();
    low_cut_.reset();
    mid_turn_.reset();
    side_turn_.reset();
    // The control tick that follows puts every gain where it belongs at once.
    settle_ = true;
  }

  // Every kControlPeriod samples: the knobs' smoothed values, a sky on its
  // way in, and from them where each star's gains, corner and wander go next.
  void control() {
    using namespace constellation;
    const bool settle = settle_;
    settle_ = false;
    const float sr = sample_rate();
    const float period = 1.0f / static_cast<float>(kControlPeriod);

    if (fading_) {
      if (cross_ >= 1.0f) {
        // The old sky reached silence over the last period.
        for (int k = 0; k < kPlaces; ++k) stars_[current_][k].rest();
        loop_gain_[current_] = loop_gain_to_[current_] = loop_gain_step_[current_] = 0.0f;
        current_ ^= 1;
        fading_ = false;
        same_span_ = true;
        cross_ = 0.0f;
      } else {
        cross_ = kit::min(1.0f, cross_ + cross_step_);
      }
    }
    // A sky begins to cross in on this tick: another pattern or seed, or a
    // span further off than a glide goes.
    bool begun = false;
    if (!fading_) {
      const double gap = span_target_ - span_[current_];
      const bool far = gap > glide_most_ || gap < -glide_most_;
      if (far || want_pattern_ != pattern_[current_] || want_seed_ != seed_[current_]) {
        const int next = current_ ^ 1;
        if (want_pattern_ != pattern_[next] || want_seed_ != seed_[next]) {
          lay_out(want_pattern_, want_seed_, &sky_[next]);
          pattern_[next] = want_pattern_;
          seed_[next] = want_seed_;
        }
        share_fade_[next] = -1.0f;
        // A far span is where the new sky stands; a near one is still glided
        // to, by the new sky once it is in.
        span_[next] = far ? span_target_ : span_[current_];
        same_span_ = !far;
        fading_ = true;
        begun = true;
        cross_ = 0.0f;
      }
    }

    const float fade = fade_.next();
    const float width = width_.next();
    const float drift = drift_.next();
    const float tone = tone_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      tone_hz_ = std::exp(tone);
      loop_tone_.set(tone_hz_, kToneQ, sr);
    }
    float lit[kPlaces];
    for (int k = 0; k < kPlaces; ++k) lit[k] = lit_[k].next();
    const double clock = static_cast<double>(drift_n_) / static_cast<double>(drift_period_);
    const float reach = kDriftSeconds * sr;

    // How much of each sky sounds. Two skies are different moments of the
    // line, so their stars cross on a quarter of a sine and the power holds;
    // what the two share (the last star, when the span is the same) is one
    // signal and crosses in a straight line.
    float apart[2] = {1.0f, 0.0f};  // the sky that leads, the sky coming in
    float same[2] = {1.0f, 0.0f};
    if (fading_) {
      const bool done = cross_ >= 1.0f;
      apart[0] = done ? 0.0f : kit::SineTable::cos_lookup(0.25f * cross_);
      apart[1] = done ? 1.0f : kit::SineTable::lookup(0.25f * cross_);
      same[0] = 1.0f - cross_;
      same[1] = cross_;
    }

    for (int s = 0; s < 2; ++s) {
      const bool lead = s == current_;
      if (!lead && !fading_) continue;
      const float weight = apart[lead ? 0 : 1];
      const float shared = same_span_ ? same[lead ? 0 : 1] : weight;
      const Sky& sky = sky_[s];
      const float span = static_cast<float>(span_[s]);

      // The last star's wander, and how much of this sky's last star the loop takes.
      anchor_off_[s] = anchor_off_to_[s];
      loop_gain_[s] = loop_gain_to_[s];
      anchor_off_to_[s] = drift > 0.0f ? drift * kit::min(reach, kDriftShare * span) * drift_at(0, clock) : 0.0f;
      loop_gain_to_[s] = shared;
      if (settle || (begun && !lead)) anchor_off_[s] = anchor_off_to_[s];
      if (settle) loop_gain_[s] = loop_gain_to_[s];
      anchor_off_step_[s] = (anchor_off_to_[s] - anchor_off_[s]) * period;
      loop_gain_step_[s] = (loop_gain_to_[s] - loop_gain_[s]) * period;

      // Each star's level before the whole sky is scaled to a power of one.
      float level[kPlaces];
      float power = 0.0f;
      // What Fade leaves of each star, worked out again only when Fade or the
      // sky has moved.
      float* share = share_[s];
      if (fade != share_fade_[s]) {
        share_fade_[s] = fade;
        for (int k = 0; k < kPlaces; ++k) share[k] = fade_share(fade, sky.time[k]);
      }
      for (int k = 0; k < kPlaces; ++k) {
        level[k] = lit[k] * sky.mag[k] * share[k];
        power += level[k] * level[k];
      }
      const float scale = power > 0.0f ? 1.0f / std::sqrt(power) : 0.0f;
      for (int k = 0; k < kPlaces; ++k) {
        Star& star = stars_[s][k];
        const float gain = level[k] * scale * (k == 0 ? shared : weight);
        float left = 0.0f, right = 0.0f;
        if (gain > 0.0f) {
          // Constant power across the sides, unity in the centre.
          const float turn = (width * sky.pan[k] + 1.0f) * 0.125f;
          left = gain * kSqrt2 * kit::SineTable::cos_lookup(turn);
          right = gain * kSqrt2 * kit::SineTable::lookup(turn);
        }
        // Land on what the last tick aimed at, then aim again.
        star.left = star.left_to;
        star.right = star.right_to;
        star.off = star.off_to;
        const bool was_on = star.on;
        star.on = left != 0.0f || right != 0.0f || star.left != 0.0f || star.right != 0.0f;
        if (!star.on) {
          if (was_on) star.rest();
          continue;
        }
        const float off = drift > 0.0f && k > 0
                              ? drift * kit::min(reach, kDriftShare * sky.time[k] * span) * drift_at(k, clock)
                              : 0.0f;
        if (settle) {
          star.left = left;
          star.right = right;
        }
        // A star that lights starts where its wander is now.
        if (settle || !was_on) star.off = off;
        star.left_to = left;
        star.right_to = right;
        star.off_to = off;
        star.left_step = (left - star.left) * period;
        star.right_step = (right - star.right) * period;
        star.off_step = (off - star.off) * period;
        const float corner = star_corner(tone_hz_, share[k], sky.mag[k]);
        if (corner != star.corner) {
          star.corner = corner;
          star.tone.set(corner, kToneQ, sr);
        }
      }
    }
  }

  void apply(int id) {
    using namespace constellation;
    const float value = param(id);
    switch (id) {
      case kSpan:
        span_target_ = static_cast<double>(value) * 0.001 * sample_rate();
        if (!primed()) span_[current_] = span_target_;
        break;
      case kStars: {
        const int stars = kit::clamp_int(static_cast<int>(value + 0.5f), 1, kPlaces);
        for (int k = 0; k < kPlaces; ++k) lit_[k].set(k < stars ? 1.0f : 0.0f, primed());
        break;
      }
      case kPattern:
        want_pattern_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kPatterns - 1);
        break;
      case kShuffle:
        want_seed_ = static_cast<int>(value + 0.5f);
        break;
      case kFade:
        fade_.set(value, primed());
        break;
      case kAgain:
        again_.set(value, primed());
        break;
      case kTone:
        tone_.set(std::log(value), primed());
        break;
      case kDrift:
        drift_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  kit::DelayLine<kLineSize> line_;
  // The quarter turn between the middle of the two sides and their difference.
  kit::Hilbert mid_turn_, side_turn_;
  constellation::Sky sky_[2];
  Star stars_[2][constellation::kPlaces];
  // What Fade leaves of each star of each sky, and the Fade that was for.
  float share_[2][constellation::kPlaces] = {};
  float share_fade_[2] = {-1.0f, -1.0f};
  int pattern_[2] = {-1, -1};
  int seed_[2] = {-1, -1};
  int want_pattern_ = 0;
  int want_seed_ = 1;
  int current_ = 0;
  bool fading_ = false;
  // While one sky crosses into the other: whether the two stand on one span
  // (another pattern or seed), and so share the last star's read.
  bool same_span_ = true;
  float cross_ = 0.0f, cross_step_ = 0.0f;
  kit::Svf loop_tone_;
  kit::OnePole low_cut_;
  kit::Smoother fade_, width_, tone_, drift_, again_, mix_;
  kit::Smoother lit_[constellation::kPlaces];
  kit::ControlClock clock_;
  bool asleep_ = true;
  bool settle_ = true;
  float tone_seen_ = -1.0f, tone_hz_ = 7000.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float again_seen_ = -1.0f, send_gain_ = 1.0f;
  // The last star of each sky: its wander, and how much of its read the loop
  // takes, each a straight line from one control tick to the next.
  float anchor_off_[2] = {}, anchor_off_to_[2] = {}, anchor_off_step_[2] = {};
  float loop_gain_[2] = {}, loop_gain_to_[2] = {}, loop_gain_step_[2] = {};
  double span_[2] = {115200.0, 115200.0};  // samples to the last star of each sky (double: see process)
  double span_target_ = 115200.0;
  double glide_ = 0.0;
  double glide_most_ = 2400.0;
  long long drift_n_ = 0;       // samples since init, wrapping at drift_period_
  int starts_ = 0;
  long long drift_period_ = 1;
  long blank_ = 0;              // samples since anything above the floor was written
  long rest_ = 1;
  // For meter() only: never read by the sound.
  double span_seen_ = 0.0;
  float clock_seen_ = 0.0f;
};

}  // namespace livemix
