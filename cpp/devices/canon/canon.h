#pragma once

// Canon: the musical canon as an effect. What is played goes down one line;
// up to four followers read it, each one Gap later than the one before, and
// play it again at an interval of their own.
//
//   in ─┬───────────────────────────────────────────────────────── dry ─┐
//       └─(+)─► line ─┬─► follower 1 ─► shift ─► place ─┐               │
//          ▲          ├─► follower 2 ─► shift ─► place ─┤               │
//          │          ├─► follower 3 ─► shift ─► place ─┼─► tone ─► limit ─► wet ─┴─► out
//          │          └─► follower 4 ─► shift ─► place ─┘
//          └─ limit ◄─ hold ◄─ × Round ◄─ 30 Hz low cut ◄─ tone ◄─ the last follower, before placing
//
// - The line is one stereo float ring of 37.5 s at 96 kHz (28.9 MB of the
//   device's 29.7, under the 32 it is given; line.h):
//   four gaps of 7.5 s, and one more for a crab that reads back through its
//   own gap. A follower reads it on whole frames, so follower k at unison is
//   the line k gaps ago, bit for bit.
// - A crab follower plays each gap's worth backwards. The gaps are counted
//   from the first note after a rest: the first sample over -60 dBFS after
//   the input has stayed under that for as long as the furthest follower
//   reaches back. (Not from the first sample that is not exact silence: a
//   hiss under the playing would put the joins anywhere.) Inside gap number
//   m follower k starts k - 1 gaps back at the gap's last frame and walks
//   back two frames of delay a sample. So what a forward follower would play
//   at place a of a gap, the crab plays at its mirror, Gap - 1 - a.
// - Where a crab's gap runs out, the reader of the next gap takes over in a
//   crossing. Two pieces of one held sound meet there, in step or out of it
//   as chance has it, which under a plain equal-power crossing is a dip of
//   up to 10 dB or a bump of 5. So where the two are one sound the new
//   reader starts up to 10 ms further back, where the line best agrees with
//   what the old one goes on to play, and the crossing is scaled by how
//   well the two agree: a held note keeps its level through the join.
//   Unrelated sound (two notes, noise) crosses on the sample, at equal
//   power. The followers' joins come 1.7 ms apart, so no block looks for
//   more than one.
// - A follower's reader never glides. When Gap, Crab or an interval moves it,
//   or a crab's gap runs out, a new reader starts at the new place and the
//   two cross over (equal power, 30 ms or a quarter of the gap), one
//   crossing at a time: a move made during a crossing waits for its end.
// - Transposing is a stage after the reader (shifter.h): one head on a
//   short ring, spliced where the wave lines up and only as often as the
//   interval needs, and put a fixed way behind every attack. How late it
//   plays an attack (11 ms an octave up, 4 ms an octave down) is taken off
//   the reader's delay, so the attack of a transposed forward follower
//   falls on the gap. A crab plays no attacks (it comes to each note from
//   its end) and is not corrected: what a transposed crab plays is 6 to 24
//   ms late by its interval, the most a fifth down. At zero the shifter is
//   out of the path; turning an interval to or from zero crosses the two
//   over in 30 ms, and between two intervals the pitch glides (12 ms).
// - Fade makes each follower 12 dB times Fade quieter than the one before,
//   and the followers together are scaled to the power of one, so a count of
//   four is no louder than one. Spread puts them left and right in turn (a
//   single follower stays in the middle), narrowing each as it moves aside.
// - Tone is one 6 dB low-pass per follower, in a chain: the first follower
//   passes one, the fourth four. At the top of its range it is out of the
//   path altogether.
// - Round writes the last follower back into the line (after one more Tone
//   pole and a low cut), so the canon comes round again one gap later, with
//   the last follower's interval and crab applied once more per lap. The
//   loop gain is Round, under one, and a held sound would still pile up lap
//   on lap (16 dB at Round 0.85 where it is in step with the lap), so the
//   return passes a level hold: while something is played the line carries
//   no more than 2 dB over the loudest that was played, and a round that is
//   dying away or no louder than the playing passes it exactly (see steady);
//   once the playing stops the hold lets go. What returns is also
//   limited (exactly linear up to full scale, never past twice that), and
//   the followers together never pass 1.73, so with the dry beside them at
//   any Mix a full-scale input comes out at most 6 dB over itself.
// - Rest: once nothing above -140 dBFS has been written for as long as the
//   furthest reader reaches, the device sleeps from the next sample of exact
//   silence on, and it wakes with a blank line on the first sample that is
//   not silence. Both are settled sample by sample, so where the host's
//   blocks fall changes nothing.

#include "../../kit/kit.h"
#include "line.h"
#include "params.gen.h"
#include "shifter.h"

namespace livemix {

class Canon : public kit::DeviceBase<canon::kNumParams> {
 public:
  static constexpr int kVoices = 4;

  void init(float sample_rate) {
    using namespace canon;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    line_.clear();
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.shifter.prepare(sr);
      f.semis.set_time(kGlideSeconds, sr);
      f.blend.set_time(kCrossSeconds, sr);
      f.gain_left.set_time(kSmoothingSeconds, sr);
      f.gain_right.set_time(kSmoothingSeconds, sr);
      f.narrow.set_time(kSmoothingSeconds, sr);
      f.feed.set_time(kSmoothingSeconds, sr);
      f.blend.snap(0.0f);
      f.semis.snap(0.0f);
      f.ratio = 1.0f;
      f.ratio_step = 0.0f;
      f.target_ratio = 1.0f;
      f.interval = 0;
      f.lead = 0;
    }
    round_.set_time(kSmoothingSeconds, sr);
    level_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kHoldSeconds * sr));
    rise_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kHoldRiseSeconds * sr));
    down_coeff_ = 1.0f - std::exp(-1.0f / (kHoldFallSeconds * sr));
    up_coeff_ = 1.0f - std::exp(-1.0f / (kHoldFreeSeconds * sr));
    mix_.set_time(kSmoothingSeconds, sr);
    tone_.set_time(kSmoothingSeconds, sr / kControlPeriod);
    meter_window_ = static_cast<int>(kMeterSeconds * sr);
    if (meter_window_ < 1) meter_window_ = 1;
    const float held = kit::min(sr, 96000.0f);  // the line is sized for 96 kHz
    slip_most_ = static_cast<int>(kSlipSeconds * held);
    stagger_ = static_cast<int>(kStaggerSeconds * held);
    count_ = 1;
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, how long the device has run since it woke, in seconds, going round at
  // 64, and -1 while it sleeps (when the line is forgotten); 1, the highest
  // sample written to the line in the last 20 to 40 ms; 2, how far into the
  // gap the crabs count the device is, in seconds; 3 to 6, the highest sample
  // each follower played in the last 20 to 40 ms, as loud as Fade and the
  // count make it and before Mix. All of them are kept while the sound is
  // made and only handed over here.
  float meter(int index) const {
    if (asleep_) return index == 0 ? -1.0f : 0.0f;
    const float sr = sample_rate();
    switch (index) {
      case 0: {
        const long long lap = static_cast<long long>(kClockSeconds * sr);
        return static_cast<float>(run_ % lap) / sr;
      }
      case 1:
        return kit::max(line_peak_[0], line_peak_[1]);
      case 2:
        return static_cast<float>(chunk_) / sr;
      default:
        if (index >= 3 && index < 3 + kVoices) {
          const Follower& f = followers_[index - 3];
          return kit::max(f.peak[0], f.peak[1]);
        }
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace canon;
    frames = begin_block(frames);
    if (asleep_ && !input_present(frames)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const bool silent = in[0] == 0.0f && in[1] == 0.0f;
      if (asleep_) {
        if (silent) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        // The device starts on the first sample that is not silence, wherever
        // in the block that is, so the block size does not move anything.
        asleep_ = false;
        line_.forget();
        restart();
      }
      // A bad sample from upstream (not a number, infinite, absurdly large)
      // must not sit in the line for half a minute.
      in[0] = sane(in[0]);
      in[1] = sane(in[1]);

      if (clock_.tick()) control();
      // A first note after a rest: the crabs count their gaps from here.
      const float heard = kit::max(in[0] < 0.0f ? -in[0] : in[0], in[1] < 0.0f ? -in[1] : in[1]);
      if (heard > kNote) {
        if (quiet_ > rest_) chunk_ = 0;
        quiet_ = 0;
      } else if (quiet_ < kLongEnough) {
        ++quiet_;
      }
      if (chunk_ >= gap_) chunk_ = 0;

      // The followers, last to first: each adds itself to what the later
      // ones left and the sum passes one more Tone pole.
      float wet[2] = {0.0f, 0.0f};
      float back[2] = {0.0f, 0.0f};
      for (int k = kVoices - 1; k >= 0; --k) {
        Follower& f = followers_[k];
        float left = 0.0f, right = 0.0f;
        const bool live = k < count_ || f.gain_left.value != 0.0f || f.gain_right.value != 0.0f ||
                          f.feed.value != 0.0f;
        if (!live) {
          // Silent and not asked for: it stands ready at its settings, so it
          // comes back at its own interval and not on the way to it.
          f.fresh = true;
          f.shifting = false;
          f.semis.snap(f.semis.target);
          f.blend.snap(f.blend.target);
          f.shifter.write(0.0f, 0.0f);
        } else {
          read(f, k, &left, &right);
          f.shifter.write(left, right);
          shift(f, k, &left, &right);

          const float feed = f.feed.next();
          back[0] += feed * left;
          back[1] += feed * right;

          // Placed: narrowed towards its middle as it moves aside, so a
          // stereo line does not lose a side there.
          const float narrow = f.narrow.next();
          if (narrow != 0.0f) {
            const float mid = 0.5f * (left + right);
            left = kit::lerp(left, mid, narrow);
            right = kit::lerp(right, mid, narrow);
          }
          left *= f.gain_left.next();
          right *= f.gain_right.next();
          const float played = kit::max(left < 0.0f ? -left : left, right < 0.0f ? -right : right);
          if (played > f.peak[1]) f.peak[1] = played;
        }
        wet[0] = tone_pole_[k][0].lowpass(left + wet[0]);
        wet[1] = tone_pole_[k][1].lowpass(right + wet[1]);
      }

      // The round: the last follower goes back into the line, held in level
      // (see steady): `hold_` is exactly one while the line carries no more
      // than a couple of dB over what was played.
      const float round = round_.next();
      float sent[2];
      for (int c = 0; c < 2; ++c) {
        sent[c] = round * rumble_[c].highpass(back_pole_[c].lowpass(back[c]));
      }
      const float left_power = in[0] * in[0], right_power = in[1] * in[1];
      const float loud = left_power > right_power ? left_power : right_power;
      if (loud > loud_) loud_ = loud;
      if (loud > wake_) {
        // The playing is back after a rest, and the hold with it.
        wake_ = kNever;
        going_ = true;
        want_ = need_;
      }
      played_sum_ += left_power + right_power;
      sent_sum_ += sent[0] * sent[0] + sent[1] * sent[1];
      both_sum_ += in[0] * sent[0] + in[1] * sent[1];
      if (hold_ != want_) {
        // The hold goes where it is wanted: up in 50 ms; down in 5 ms, and
        // faster wherever that moves the line by no more than a two
        // hundredth of the playing per sample, which is at once where what
        // returns was next to nothing a sample ago. So a beat in step with
        // the lap meets its own return already held, and a held sound that
        // is coming round is turned down without a step.
        const float off = want_ - hold_;
        if (off > 0.0f) {
          hold_ = off < kHoldThere ? want_ : hold_ + off * up_coeff_;
        } else {
          const float size = -off;
          float step = size * down_coeff_;
          if (step * sent_before_ < soft_) step = size * sent_before_ <= soft_ ? size : soft_ / sent_before_;
          hold_ = size - step < kHoldThere ? want_ : hold_ - step;
        }
      }
      const float sent_left = sent[0] < 0.0f ? -sent[0] : sent[0];
      const float sent_right = sent[1] < 0.0f ? -sent[1] : sent[1];
      sent_before_ = sent_left > sent_right ? sent_left : sent_right;
      float write[2];
      for (int c = 0; c < 2; ++c) {
        write[c] = flush_denormal(in[c] + limit(hold_ * sent[c]));
      }
      line_.write(write[0], write[1]);
      const float written = kit::max(write[0] < 0.0f ? -write[0] : write[0],
                                     write[1] < 0.0f ? -write[1] : write[1]);
      if (written > kFloor) {
        blank_ = 0;
      } else if (blank_ < kLongEnough) {
        ++blank_;
      }
      if (written > line_peak_[1]) line_peak_[1] = written;
      if (++meter_count_ >= meter_window_) turn_meters();

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        // The ends are exact: all dry is the input, all wet has none of it.
        if (mix <= 0.0f) {
          dry_gain_ = 1.0f;
          wet_gain_ = 0.0f;
        } else if (mix >= 1.0f) {
          dry_gain_ = 0.0f;
          wet_gain_ = 1.0f;
        } else {
          dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
          wet_gain_ = kit::SineTable::lookup(0.25f * mix);
        }
      }
      out_left_[i] = in[0] * dry_gain_ + ceiling(wet[0]) * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + ceiling(wet[1]) * wet_gain_;

      ++chunk_;
      ++run_;
      // Asleep from the next sample on, once nothing comes in and nothing
      // above the floor has been written for as long as any reader reaches:
      // by then every follower has played its last.
      if (silent && blank_ > reach_) asleep_ = true;
    }
  }

  bool asleep() const { return asleep_; }
  // What the level hold lets through of the round now, 0..1 (harness).
  float hold() const { return hold_; }
  // How alike the two heads of follower `k` were at their last splice (harness).
  float splice_match(int k) const { return followers_[k].shifter.match(); }

 private:
  // The longest Gap at 96 kHz, and the line: five of them (a crab at the
  // fourth place reaches back that far) and what its old reader reads on
  // through a join: 5 ms of waiting its turn, 10 ms of slip and a crossing
  // of 30 ms, at two frames a sample (7680 frames).
  static constexpr int kMaxGap = 720000;
  static constexpr int kMinGap = 64;
  static constexpr int kLineFrames = 5 * kMaxGap + 8192;
  static constexpr int kControlPeriod = 16;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kFloor = kit::IdleGate::kFloor;
  static constexpr float kInputLimit = 8.0f;  // +18 dBFS
  static constexpr float kGlideSeconds = 0.012f;
  // A reader's crossing to a new place, and the shifter's to and from the path.
  static constexpr float kCrossSeconds = 0.03f;
  // A crossing takes at most this share of the gap.
  static constexpr float kCrossShare = 0.25f;
  // Each follower is this much quieter than the one before at Fade 1.
  static constexpr float kFadeDb = 12.0f;
  static constexpr float kRumbleHz = 30.0f;
  // A note, for the crabs' count of gaps: anything over -60 dBFS.
  static constexpr float kNote = 0.001f;
  // The furthest a crab's new reader starts back from its place to take over
  // in step, and how long after the one before each follower's join comes.
  static constexpr float kSlipSeconds = 0.01f;
  static constexpr float kStaggerSeconds = 1.0f / 600.0f;
  static constexpr int kJoinPoints = 32;   // compared for every slip
  static constexpr int kCheckPoints = 96;  // and for the one chosen
  static constexpr float kSlipAlike = 0.5f;   // a slip is taken only where the two agree this well
  static constexpr float kSlipGain = 0.1f;    // and better than at the reader's own place by this
  static constexpr float kJoinQuiet = 1.0e-7f;  // the old reader's stretch under about -85 dBFS
  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr float kWetRoom = 0.7320508f;  // the square root of three, less one (see ceiling)
  // The level hold of the round (see steady): the line may carry this much
  // more power than what was played (2 dB), and the times it works in.
  static constexpr float kHoldOver = 1.5848932f;
  static constexpr float kHoldSeconds = 0.1f;        // the powers are taken over this
  static constexpr float kHoldFallSeconds = 0.005f;  // the hold comes down in this, or faster (see process)
  static constexpr float kHoldRiseSeconds = 8.0f;    // what it has to be lets up in this while the playing goes on
  static constexpr float kHoldFreeSeconds = 0.05f;   // the hold lets go in this once the playing has stopped
  static constexpr float kHoldGone = 256.0f;  // the playing has stopped: 24 dB under its loudest
  static constexpr float kHoldBack = 4.0f;    // and is back: 18 dB under it
  static constexpr float kHoldRestLaps = 2.0f;  // in a rest what the hold has to be is forgotten in this many laps
  static constexpr float kHoldSoft = 0.005f;  // of the playing: as far as the hold may move the line in a sample
  static constexpr float kHoldThere = 5.0e-4f;  // as near as the hold is taken to be there
  static constexpr float kNever = 3.0e38f;  // no squared sample is over this
  static constexpr float kHoldNear = 1.06f;  // within half a dB of the hold: still needed
  static constexpr float kHoldInStep = 2.0f;
  // The loudest that was played falls by Round to this power every lap, in
  // power: three quarters as fast as the round itself (Round squared).
  static constexpr float kHoldFall = 1.5f;
  static constexpr float kHoldStopLeast = 0.05f;
  static constexpr float kHoldStopMost = 0.5f;
  static constexpr float kHoldFloor = 1.0e-13f;
  // For a display (see meter): the length of one of the two stretches a level
  // is the highest sample of, and where the clock goes round.
  static constexpr float kMeterSeconds = 0.02f;
  static constexpr float kClockSeconds = 64.0f;
  // Where each follower sits at Spread 1, by how many there are: left and
  // right in turn, the odd one in the middle.
  static constexpr float kPlaces[kVoices][kVoices] = {
      {0.0f, 0.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, -1.0f / 3.0f, 1.0f / 3.0f},
  };

  // A place on the line: how many frames back, and how much further back
  // every sample (0 forwards, 2 for a crab, which walks away from the newest
  // frame as fast as that comes on).
  struct Reader {
    int delay = 1;
    int step = 0;
  };

  struct Follower {
    Reader now, old;
    float cross = 1.0f, cross_step = 0.0f;  // the old reader sounds while cross < 1
    int slip = 0;        // frames a crab's reader stands behind its place (see align)
    float agree = 0.0f;  // how alike the two readers of a crab's join are, 0..1
    bool fresh = true;                      // nothing to cross over from
    bool crab = false;
    bool shifting = false;
    int interval = 0;  // semitones
    int lead = 0;      // samples taken off a forward reader's delay for the shifter's own
    float ratio = 1.0f, ratio_step = 0.0f, target_ratio = 1.0f;
    canon_dsp::Shifter shifter;
    kit::Smoother semis;
    kit::LinearRamp blend;  // 0 the reader alone, 1 the shifter
    kit::Smoother gain_left, gain_right, narrow, feed;
    // For meter() only: the highest sample of the stretch before, and of this one.
    float peak[2] = {0.0f, 0.0f};
  };

  // Not-a-number and infinity become silence; anything else is held to the limit.
  static float sane(float x) {
    if (x >= -kInputLimit && x <= kInputLimit) return x;
    if (x > kInputLimit && x <= 3.0e38f) return kInputLimit;
    if (x < -kInputLimit && x >= -3.0e38f) return -kInputLimit;
    return 0.0f;
  }

  // Exactly linear up to ±1, never past ±2: what returns to the line.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // The followers together: exactly linear up to ±1, never past ±1.73. With
  // the dry beside it at any Mix that is at most twice full scale (0.5 and
  // 0.87 of the two at the worst Mix, two thirds), so whatever is set, a
  // full-scale input comes out no more than 6 dB over itself.
  static float ceiling(float x) {
    const float size = x < 0.0f ? -x : x;
    if (size <= 1.0f) return x;
    const float held = 1.0f + kWetRoom * kit::fast_tanh((size - 1.0f) * (1.0f / kWetRoom));
    return x < 0.0f ? -held : held;
  }

  // What follower `k` reads from the line now. Its reader is held to where
  // the settings put it: when they part, a new reader starts there and the
  // two cross over.
  void read(Follower& f, int k, float* left, float* right) {
    Reader want;
    if (f.crab) {
      want.step = 2;
      want.delay = k * gap_ + 2 * chunk_ + 1 + f.slip;
    } else {
      want.step = 0;
      want.delay = (k + 1) * gap_ - f.lead;
      if (want.delay < 1) want.delay = 1;
    }
    if (f.fresh) {
      f.fresh = false;
      if (f.crab) want.delay -= f.slip;
      f.slip = 0;
      f.now = want;
      f.cross = 1.0f;
    } else if (f.cross >= 1.0f && (f.now.delay != want.delay || f.now.step != want.step) &&
               !(f.crab && f.now.step == 2 && chunk_ < k * stagger_)) {
      // (A crab whose gap has just run out waits its turn: see stagger_.)
      f.old = f.now;
      f.agree = 0.0f;
      if (f.crab) {
        want.delay -= f.slip;
        f.slip = align(f.old, want.delay, &f.agree);
        want.delay += f.slip;
      } else {
        f.slip = 0;
      }
      f.now = want;
      f.cross = 0.0f;
      f.cross_step = 1.0f / static_cast<float>(cross_samples_);
    }
    line_.read(f.now.delay, left, right);
    f.now.delay += f.now.step;
    if (f.cross < 1.0f) {
      float old_left, old_right;
      line_.read(f.old.delay, &old_left, &old_right);
      f.old.delay += f.old.step;
      float in_gain = kit::SineTable::lookup(0.25f * f.cross);
      float out_gain = kit::SineTable::cos_lookup(0.25f * f.cross);
      if (f.agree > 0.0f) {
        // The two are alike by `agree`: equal power would add them up to
        // 3 dB over. Scaled back to the level of one.
        const float level = 1.0f / std::sqrt(1.0f + 2.0f * in_gain * out_gain * f.agree);
        in_gain *= level;
        out_gain *= level;
      }
      *left = *left * in_gain + old_left * out_gain;
      *right = *right * in_gain + old_right * out_gain;
      f.cross += f.cross_step;
    }
  }

  // The two sides of the line as one, `delay` frames back.
  float heard(int delay) const {
    float left, right;
    line_.read(delay, &left, &right);
    return left + right;
  }

  // A crab's join: how many frames behind `start` its new reader should
  // begin so that it takes over in step with what the old reader (`old`,
  // also walking backwards) goes on to play, and how alike the two then are.
  // Both walk back a frame of the line a sample, so sample n of the crossing
  // is the frame n further back for each: the two stretches are compared as
  // they lie in the line now, at 32 unevenly spaced points under a Hann bell,
  // for every slip up to 10 ms (an eighth of the gap at the most).
  int align(const Reader& old, int start, float* agree) const {
    *agree = 0.0f;
    if (old.step != 2) return 0;
    const int most = slip_most_ < gap_ / 8 ? slip_most_ : gap_ / 8;
    if (most < 1) return 0;
    const float stride = static_cast<float>(cross_samples_) / kJoinPoints;
    int offset[kJoinPoints];
    float reference[kJoinPoints];
    float weight[kJoinPoints];
    float energy = 0.0f;
    for (int i = 0; i < kJoinPoints; ++i) {
      const float wander = static_cast<float>(i) * 0.6180340f;
      offset[i] = static_cast<int>((static_cast<float>(i) + wander - std::floor(wander)) * stride);
      weight[i] = 0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(i) + 0.5f) / kJoinPoints);
      const float sample = heard(old.delay + offset[i]);
      reference[i] = weight[i] * sample;
      energy += reference[i] * sample;
    }
    if (energy < kJoinQuiet) return 0;  // nothing there to be in step with
    const float scale = 1.0f / std::sqrt(energy);
    const auto score = [&](int slip) {
      float match = 0.0f;
      float power = 1.0e-20f;
      for (int i = 0; i < kJoinPoints; ++i) {
        const float sample = heard(start + slip + offset[i]);
        match += reference[i] * sample;
        power += weight[i] * sample * sample;
      }
      return match * scale / std::sqrt(power);
    };
    // Among equal matches (a held note gives one per cycle) the nearest.
    const auto biased = [&](int slip) {
      return score(slip) - 0.02f * static_cast<float>(slip) / static_cast<float>(most);
    };
    const int coarse = most / 128 + 1;
    int best = 0;
    float best_score = biased(0);
    for (int slip = coarse; slip <= most; slip += coarse) {
      const float value = biased(slip);
      if (value > best_score) {
        best_score = value;
        best = slip;
      }
    }
    const int centre = best;
    for (int slip = centre - coarse + 1; slip < centre + coarse; ++slip) {
      if (slip == centre || slip < 0 || slip > most) continue;
      const float value = biased(slip);
      if (value > best_score) {
        best_score = value;
        best = slip;
      }
    }
    // How alike the two are there, measured again at other points: the
    // best of many slips reads too high at the points that chose it, and
    // unrelated sound (noise, two different notes) would be turned down.
    // The reader stays at its own place unless the slip is plainly one sound
    // meeting itself and plainly better: unrelated sound, which a slip does
    // nothing for, stays on the sample.
    const float found = alike(old.delay, start + best);
    const float plain = best == 0 ? found : alike(old.delay, start);
    if (found < kSlipAlike || plain >= found - kSlipGain) {
      *agree = kit::clamp(plain, 0.0f, 1.0f);
      return 0;
    }
    *agree = kit::clamp(found, 0.0f, 1.0f);
    return best;
  }

  // How alike what two backward readers go on to play is, -1..1, over one
  // crossing: the stretches behind `a` and `b` frames back, at 96 points.
  float alike(int a, int b) const {
    float match = 0.0f, power_a = 1.0e-20f, power_b = 1.0e-20f;
    const float stride = static_cast<float>(cross_samples_) / kCheckPoints;
    for (int i = 0; i < kCheckPoints; ++i) {
      const float wander = static_cast<float>(i) * 0.7548777f;
      const int at = static_cast<int>((static_cast<float>(i) + wander - std::floor(wander)) * stride);
      const float bell =
          0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(i) + 0.5f) / kCheckPoints);
      const float x = heard(a + at);
      const float y = heard(b + at);
      match += bell * x * y;
      power_a += bell * x * x;
      power_b += bell * y * y;
    }
    return match / std::sqrt(power_a * power_b);
  }

  // The follower's interval: nothing at zero, the shifter otherwise, and the
  // two crossed over while one takes the other's place.
  void shift(Follower& f, int k, float* left, float* right) {
    f.semis.next();
    const float blend = f.blend.next();
    if (!(blend > 0.0f || f.blend.target > 0.0f)) {
      f.shifting = false;
      return;
    }
    if (!f.shifting) {
      f.shifting = true;
      f.ratio = kit::semitones_to_ratio(f.semis.value);
      f.ratio_step = 0.0f;
      // Each follower's head starts a quarter of its room after the one
      // before, so followers at one interval do not splice together.
      f.shifter.restart(0.25f * static_cast<float>(k));
    }
    f.ratio += f.ratio_step;
    float shifted_left, shifted_right;
    f.shifter.render(f.ratio, &shifted_left, &shifted_right);
    if (blend >= 1.0f) {
      *left = shifted_left;
      *right = shifted_right;
    } else {
      const float in_gain = kit::SineTable::lookup(0.25f * blend);
      const float out_gain = kit::SineTable::cos_lookup(0.25f * blend);
      *left = *left * out_gain + shifted_left * in_gain;
      *right = *right * out_gain + shifted_right * in_gain;
    }
  }

  // The two stretches a display's levels are taken over move on.
  void turn_meters() {
    meter_count_ = 0;
    line_peak_[0] = line_peak_[1];
    line_peak_[1] = 0.0f;
    for (Follower& f : followers_) {
      f.peak[0] = f.peak[1];
      f.peak[1] = 0.0f;
    }
  }

  // Everything settled, nothing sounding (init and wake).
  void restart() {
    clock_.reset(kControlPeriod);
    chunk_ = 0;
    run_ = 0;
    blank_ = 0;
    quiet_ = kLongEnough;
    rest_ = 0;
    meter_count_ = 0;
    line_peak_[0] = line_peak_[1] = 0.0f;
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.fresh = true;
      f.cross = 1.0f;
      f.slip = 0;
      f.agree = 0.0f;
      f.shifting = false;
      f.shifter.clear();
      f.semis.snap(f.semis.target);
      f.blend.snap(f.blend.target);
      f.gain_left.snap(f.gain_left.target);
      f.gain_right.snap(f.gain_right.target);
      f.narrow.snap(f.narrow.target);
      f.feed.snap(f.feed.target);
      f.peak[0] = f.peak[1] = 0.0f;
      tone_pole_[k][0].reset();
      tone_pole_[k][1].reset();
    }
    for (int c = 0; c < 2; ++c) {
      back_pole_[c].reset();
      rumble_[c].reset();
      rumble_[c].set_cutoff(kRumbleHz, sample_rate());
    }
    round_.snap(round_.target);
    played_sum_ = sent_sum_ = both_sum_ = 0.0f;
    played_ = sent_ = both_ = heard_ = 0.0f;
    loud_ = peak_ = 0.0f;
    hold_ = want_ = need_ = 1.0f;
    going_ = false;
    wake_ = soft_ = sent_before_ = 0.0f;
    fall_round_ = -1.0f;
    fall_lap_ = 0;
    unneeded_ = 0;
    mix_.snap(mix_.target);
    tone_.snap(tone_.target);
    tone_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    gap_ = kMinGap;
    reach_ = kLongEnough;
  }

  void control() {
    using namespace canon;
    const float sr = sample_rate();
    gap_ = kit::clamp_int(static_cast<int>(param(kGap) * sr + 0.5f), kMinGap, kMaxGap);
    cross_samples_ = static_cast<int>(kit::min(kCrossSeconds * sr, kCrossShare * static_cast<float>(gap_)));
    if (cross_samples_ < 8) cross_samples_ = 8;

    // Which followers are crabs, and how far back the furthest reader gets.
    const int crab = kit::clamp_int(static_cast<int>(param(kCrab) + 0.5f), 0, 3);
    int furthest = 0;
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.crab = crab == 3 || (crab == 2 && (k & 1) == 1) || (crab == 1 && k == count_ - 1);
      if (k < count_) furthest = (k + (f.crab ? 2 : 1)) * gap_;
      if (f.shifting) {
        const float next = kit::semitones_to_ratio(f.semis.value);
        f.ratio_step = (next - f.ratio) * (1.0f / kControlPeriod);
      }
    }
    // A crossing reads on behind a crab (which may wait its turn and stand a
    // slip further back), and a shifter holds its own ring's worth.
    rest_ = static_cast<long>(furthest) + 2 * (cross_samples_ + kVoices * stagger_) + slip_most_;
    reach_ = rest_ + canon_dsp::Shifter::kSize + static_cast<long>(0.05f * sr);

    steady();

    // Tone: one pole per follower; at the top of its range the pole is gone.
    const float tone = tone_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      const float pole =
          tone >= open_tone_ ? 0.0f : std::exp(-kit::kTwoPi * std::exp(tone) / sr);
      for (int k = 0; k < kVoices; ++k) {
        tone_pole_[k][0].a = pole;
        tone_pole_[k][1].a = pole;
      }
      back_pole_[0].a = pole;
      back_pole_[1].a = pole;
    }
  }

  // The level hold of the round, once a control period. A sound held while
  // it comes round adds to itself lap after lap: at Round 0.85 a note in step
  // with the lap would stand 16 dB over what is played, and anything steady
  // 5.6. So the line is held to 2 dB over what was played: when the played
  // sound and what returns would together carry more power than that, the
  // return is turned down by just as much as brings them back to it. The
  // three powers (played, returning, the two together) are taken over a tenth
  // of a second. "What was played" is the loudest the input has been, let
  // fall three quarters as fast as the round itself dies away: a round that
  // is dying away, or one no louder than the playing, never reaches it, and
  // the hold then passes it exactly.
  //
  // The hold is only there while something is played. Once the playing
  // stops it lets go, so the round dies away at its own rate from where the
  // line stood; what it had to be is remembered (for a lap and a quarter,
  // then fading over two laps more), and it is back there with the next note
  // (see process), so a beat in step with the lap does not pile up either.
  // All of it is counted in samples from where the device woke, so the
  // host's blocks change nothing.
  void steady() {
    played_ = flush_denormal(played_ + (played_sum_ - played_) * level_coeff_);
    sent_ = flush_denormal(sent_ + (sent_sum_ - sent_) * level_coeff_);
    both_ = flush_denormal(both_ + (both_sum_ - both_) * level_coeff_);
    played_sum_ = sent_sum_ = both_sum_ = 0.0f;

    const float round = round_.target;
    const int lap = count_ * gap_;
    if (round != fall_round_ || lap != fall_lap_) {
      fall_round_ = round;
      fall_lap_ = lap;
      heard_fall_ = round > 0.0f
                        ? std::exp(kHoldFall * std::log(round) * static_cast<float>(kControlPeriod) /
                                   static_cast<float>(lap))
                        : 0.0f;
      // The playing has stopped once its highest sample has stayed 24 dB
      // under its loudest for a quarter of a lap (a twentieth to half a
      // second): the highest sample is let fall that far in that time.
      const float sr = sample_rate();
      const float stop = kit::clamp(0.25f * static_cast<float>(lap), kHoldStopLeast * sr, kHoldStopMost * sr);
      peak_fall_ = std::exp(-std::log(kHoldGone) * static_cast<float>(kControlPeriod) / stop);
      rest_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kHoldRestLaps * static_cast<float>(lap)));
    }
    heard_ = kit::max(played_, flush_denormal(heard_ * heard_fall_));
    peak_ = kit::max(loud_, flush_denormal(peak_ * peak_fall_));
    loud_ = 0.0f;
    // (A control period of a steady tone sums to as many times the square of
    // its highest sample as the period has samples: two sides, half each.)
    // It counts as back 6 dB higher than that, so that a note dying away
    // through the one mark is not back and gone again with every swing.
    going_ = peak_ * (kHoldGone * kControlPeriod) > (going_ ? heard_ : kHoldBack * heard_);
    wake_ = going_ ? kNever : heard_ * (kHoldBack / (kHoldGone * kControlPeriod));
    soft_ = kHoldSoft * std::sqrt(heard_ * (1.0f / kControlPeriod));

    // What the line can take of the return now.
    float goal = 1.0f;
    const float most = kHoldOver * heard_;
    // What returns in step with the playing counts twice: that is what piles
    // up, and at the output it meets the dry once more.
    const float cross = both_ > 0.0f ? kHoldInStep * both_ : both_;
    if (sent_ > kHoldFloor && played_ + 2.0f * cross + sent_ > most) {
      // played + 2 g cross + g g sent = most, for g.
      const float root = cross * cross + sent_ * (most - played_);
      goal = kit::clamp((std::sqrt(root > 0.0f ? root : 0.0f) - cross) / sent_, 0.0f, 1.0f);
    }

    // What the hold has to be while the playing goes on: down to the goal at
    // once, and up again only after a lap and a quarter has gone by without
    // its being needed (what needed it comes round again a lap later), then
    // slowly: in 8 s while the playing goes on, so that neither its own rise
    // and fall nor the turn of the round moves the hold about, and in two
    // laps through a rest, so that a beat that falls on every second or
    // third lap still finds it.
    if (goal < need_) {
      need_ = goal;
      unneeded_ = 0;
    } else {
      if (goal < 1.0f && goal < need_ * kHoldNear) {
        unneeded_ = 0;
      } else if (unneeded_ < kLongEnough) {
        unneeded_ += kControlPeriod;
      }
      if (unneeded_ > lap + lap / 4) need_ += (goal - need_) * (going_ ? rise_coeff_ : rest_coeff_);
    }
    if (goal == 1.0f && need_ > 0.9999f) need_ = 1.0f;

    // The hold itself goes there sample by sample (see process): that while
    // the playing goes on, and nothing once it has stopped (in 50 ms), so
    // that a round left to itself dies away at its own rate from where the
    // line stood.
    want_ = going_ ? need_ : 1.0f;
  }

  // How loud each follower is and where it sits: Followers, Fade and Spread.
  void place(bool glide) {
    using namespace canon;
    count_ = kit::clamp_int(static_cast<int>(std::floor(param(kFollowers) + 0.5f)), 1, kVoices);
    const float step_db = -kFadeDb * param(kFade);
    float gains[kVoices];
    float power = 0.0f;
    for (int k = 0; k < count_; ++k) {
      gains[k] = kit::db_to_gain(step_db * static_cast<float>(k));
      power += gains[k] * gains[k];
    }
    // Together as loud as one: followers a gap apart add in power.
    const float together = 1.0f / std::sqrt(power);
    const float spread = param(kSpread);
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      if (k >= count_) {
        f.gain_left.set(0.0f, glide);
        f.gain_right.set(0.0f, glide);
        f.feed.set(0.0f, glide);
        continue;
      }
      const float gain = gains[k] * together;
      const float pan = spread * kPlaces[count_ - 1][k];
      float left = 1.0f, right = 1.0f;
      if (pan != 0.0f) {
        kit::pan_gains(pan, &left, &right);
        left *= kSqrtTwo;
        right *= kSqrtTwo;
      }
      f.gain_left.set(gain * left, glide);
      f.gain_right.set(gain * right, glide);
      f.narrow.set(pan < 0.0f ? -pan : pan, glide);
      f.feed.set(k == count_ - 1 ? 1.0f : 0.0f, glide);
    }
  }

  // A follower's interval. From unison the shifter comes in at the interval;
  // between two intervals the pitch glides.
  void tune(int k, bool glide) {
    using namespace canon;
    Follower& f = followers_[k];
    f.interval = static_cast<int>(std::floor(param(kInterval1 + k) + 0.5f));
    if (f.interval == 0) {
      f.blend.set(0.0f, glide);
      f.lead = 0;
      return;
    }
    const float semis = static_cast<float>(f.interval);
    f.semis.set(semis, glide && f.shifting);
    f.blend.set(1.0f, glide);
    f.target_ratio = kit::semitones_to_ratio(semis);
    f.lead = static_cast<int>(f.shifter.latency(f.target_ratio) + 0.5f);
  }

  void apply(int id) {
    using namespace canon;
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kFollowers:
      case kFade:
      case kSpread:
        place(glide);
        break;
      case kInterval1:
      case kInterval2:
      case kInterval3:
      case kInterval4:
        tune(id - kInterval1, glide);
        break;
      case kTone:
        open_tone_ = std::log(kParamMax[kTone]);
        tone_.set(std::log(param(kTone)), glide);
        break;
      case kRound:
        round_.set(param(kRound), glide);
        break;
      case kMix:
        mix_.set(param(kMix), glide);
        break;
      default:
        break;  // Gap and Crab are read on the control clock
    }
  }

  canon_dsp::Line<kLineFrames> line_;
  Follower followers_[kVoices];
  kit::OnePole tone_pole_[kVoices][2];
  kit::OnePole back_pole_[2];
  kit::OnePole rumble_[2];
  kit::Smoother round_, mix_, tone_;
  kit::ControlClock clock_;
  int count_ = 1;          // followers that are asked for
  int gap_ = kMinGap;      // the gap in samples
  int chunk_ = 0;          // samples into the gap the crabs count
  int cross_samples_ = 8;
  long long run_ = 0;      // samples since the device woke
  long blank_ = 0;         // samples since anything above the floor was written
  long reach_ = kLongEnough;
  long quiet_ = kLongEnough;  // samples since the input was last a note
  long rest_ = 0;          // how long a rest lasts: as far back as any reader reads
  int slip_most_ = 480;    // the furthest a crab's new reader stands back (see align)
  int stagger_ = 80;       // samples between one follower's join and the next one's
  // The level hold (see steady): this control period's power of what is
  // played, of what returns and of the two together; those taken slowly, and
  // the loudest the playing has been, falling.
  float played_sum_ = 0.0f, sent_sum_ = 0.0f, both_sum_ = 0.0f;
  float played_ = 0.0f, sent_ = 0.0f, both_ = 0.0f, heard_ = 0.0f;
  float loud_ = 0.0f, peak_ = 0.0f;  // the highest squared sample played: this period, and held
  bool going_ = false;               // the playing goes on
  float wake_ = 0.0f;                // a squared sample over this: the playing is back
  float soft_ = 0.0f;                // as far as the hold may move the line in a sample
  float sent_before_ = 0.0f;         // the size of what returned a sample ago
  float need_ = 1.0f;                // the hold while the playing goes on
  float want_ = 1.0f, hold_ = 1.0f;  // where the hold is going, and the hold
  float level_coeff_ = 0.0f, rise_coeff_ = 0.0f, rest_coeff_ = 1.0f;  // by the control period
  float down_coeff_ = 0.0f, up_coeff_ = 0.0f;                         // by the sample
  float heard_fall_ = 0.0f, peak_fall_ = 0.0f, fall_round_ = -1.0f;
  int fall_lap_ = 0;
  long unneeded_ = 0;  // samples since the hold was last needed where it stands
  float open_tone_ = 0.0f;
  float tone_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool asleep_ = true;
  // For meter() only: never read by the sound.
  float line_peak_[2] = {0.0f, 0.0f};
  int meter_count_ = 0;
  int meter_window_ = 960;
};

}  // namespace livemix
