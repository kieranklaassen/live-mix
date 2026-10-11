#pragma once

// Haze: a short reverb into a soft fuzz into a long reverb.
//
//   in ─┬──────────────────────────────────────────────────────────────── dry ─┐
//       ▼                                                                      │
//      (+)─► Blur: 5 allpasses ─► an allpass round a delay and 2 more          │
//       ▲    (the first reverb; every length follows Blur)                     │
//       │      ─► low-pass ─► FUZZ ─► Tone ─► 2 allpasses ─┬─── the fuzz ───┐  │
//       │                              a quarter turn on   ▼                ▼  ▼
//       │                  8 delay lines (the wall) ─► low cut ─► HOLD ─► TURN ─► Mix ─► out
//       │                  ▲ damping ◄ decay gain ◄ Hadamard ┘
//       └── Feed ◄── shift down a few Hz ◄── low cut ◄── the lines
//
// FUZZ, per side, at four times the sample rate:
//
//   x ─► ÷ (level + floor) ─► fold (Octave) ─► × drive ─► tanh ─► ÷ drive ─► DC block ─► × level × hold ─► y
//
// - The fuzz works on the sound with its level taken out and puts the level
//   back afterwards. The level is the RMS of the louder side over 25 ms, as
//   a sine's peak; the wave is divided by it, driven into the curve, and
//   multiplied by it again times a hold that makes a sine come out at the RMS
//   it went in with, at every drive (a table of the curve's own RMS, made
//   again when Octave moves). So Haze adds overtones and not loudness.
// - The drive follows the playing. Haze sets the drive a full-scale wave is
//   given; a softer one is given less, by the square root of its level over
//   most of the range (half the drive 24 dB down), so soft playing stays
//   cleaner than loud and a tail cleans up as it dies. At the bottom of Haze
//   the drive is nothing and the fuzz is a wire: the wall is then two clean
//   reverbs (Octave, which is a fold and not the curve, still adds its own).
//   An attack arrives before the level has risen, so it meets little drive and
//   passes nearly as it came; the fuzz then grows in over the 25 ms.
// - Octave folds the wave before the curve (a soft rectifier with its mean
//   taken off), which is where an octave fuzz gets the octave above.
// - Blur is the first reverb, and it is an allpass at every setting: five
//   allpasses in a row, then one more whose delay holds two further allpasses
//   (a nested allpass: its gain is the loop's). All lengths are multiplied by
//   Blur, so at 0 it is a sample or two of phase and the sound itself, and as
//   it rises the attacks are spread over up to a tenth of a second and then
//   round the loop. Because it is all allpasses, no note is stronger or weaker
//   in it than its neighbour: a crossfade from the sound to a smeared copy
//   (which is what this was first) combs, and held single notes stood up to
//   25 dB apart. Under a Decay of a second the lengths shrink with Decay, so
//   the first reverb does not outlast the second.
// - The wall is an eight-line feedback delay network (Hadamard), its lines
//   20 to 160 ms by Size, and it stands still. Its lines were once swept, each
//   at its own slow rate, to even the wall over the notes; but the tank's
//   resonances are a couple of Hz apart and a third of a Hz wide at a long
//   Decay, and the sweeps walked them through a held note: the wall under one
//   note came and went by 9 dB on average and 13 at the worst, and its phase
//   against the dry sound wandered, so that part-way up Mix a held note fell
//   7 dB at its worst quarter second (9 folded to mono). A still tank answers
//   each note differently instead, and for good; HOLD and TURN are what make
//   a still tank even.
// - HOLD (hold_wall()). What is heard of the tank is what comes back round it
//   (the lines after the Hadamard, the decay gain and the damping, in the
//   sense each side is fed), and beside it the fuzz itself. The tank is fed
//   the fuzz a quarter turn on, so the two have little in common. The wall's
//   middle is the two together at a set share of the fuzz's own power: what
//   comes back is turned down where it is over the share, and the fuzz fills
//   what is missing. Both gains are worked out from powers read over a
//   hundredth of a second, with nothing going round a loop, so a held note
//   holds: the wall alone stays within 1.2 dB of itself. The wall's side is the
//   difference between what came back on the left and on the right, filled
//   up to its share by the middle's quarter turn, and kept clear of the
//   middle of the mix, so the two sides of the output are as loud as each
//   other (a held note used to sit up to 9 dB to one side at the default,
//   and wander).
// - TURN (turn_wall()). The whole wall is turned in phase, by one angle at
//   every pitch, to where it has nothing in common with the dry sound. Part
//   way up Mix the two are the same notes; by their phase they added for one
//   note and cancelled for the next. A quarter turn apart, the power of the
//   mix is the sum of its parts, in stereo and folded to mono alike.
// - What that leaves: each partial of a held note still has its own level in
//   the wall (one angle and one gain serve all of a note's partials, and the
//   tank answers each differently), so a note's colour differs from the next
//   note's; it no longer moves in time.
// - The wall's low end is cut (the lines' own resonances are too few down
//   there to carry a bass evenly); the fuzz beside it is not, so the wall
//   keeps its bass at every Mix.
// - Feed returns the middle of the lines to the front, moved down by a few
//   Hz on the way (a single-sideband shift, 2.3 Hz on the left and 3.1 Hz on
//   the right). Without the shift the loop howls: one resonance of the wall
//   feeds itself and a single tone holds for good. With it, what returns
//   never lands on the frequency it left. The price is that what has been
//   round several times is flat of where it started, so the top of Feed is
//   set where the tail of a 440 Hz note leans about three quarters of a
//   semitone flat when it is 40 dB down, and no more: the returned share is
//   worked out from the wall's own loss, 0.45 of it at the top, which makes
//   the tail half as long again to twice as long (measured: twice at a Decay
//   of 2 s, 1.4 times at 6 s). Only what is above the bass goes round. Under
//   a played note the return is held to the level the playing calls for
//   (kFeedLevel), and what has come round still beats against the note a few
//   times a second: at the top of Feed a held note moves by about 2 dB.
// - The shift runs by a count of samples that goes on through silence and
//   sleep, the control tick is a mask of the same count, and the device goes
//   to sleep and wakes on the sample, not the block, so the output is the
//   same at every block size.
// - Nothing that a thrown control moves is stepped: the lines' gains walk to
//   where Decay has them a sample at a time (and Decay is glided as 1 / Decay,
//   which is what they go by), the curve's 1 / drive is taken on the very
//   samples the drive shaped, and Size and Blur's lengths glide in double (a
//   float stalls short of where it is going and is landed there, which on a
//   delay of thousands of samples is a jump).
//
// Storage: eight lines of 16384 samples, eighteen allpasses and two loop delays
// of 4096 (sized for 96 kHz), the oversampling filters: about 0.9 MB.
//
// The two sides have the same lengths throughout the first reverb and the
// allpasses after the fuzz: with different ones a sound in the middle left
// the fuzz as two different sounds, and their sum came and went by the note.

#include "../../kit/kit.h"
#include "halfband.h"
#include "quadrature.h"
#include "params.gen.h"

namespace livemix {

class Haze : public kit::DeviceBase<haze::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace haze;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float scale = sr / 48000.0f;
    const float longest = static_cast<float>(kSmallSize - 8);

    for (int c = 0; c < 2; ++c) {
      for (int a = 0; a < kBlurStages; ++a) {
        blur_allpass_[c][a].clear();
        blur_length_[c][a] = kit::clamp(kBlurAllpass[a] * scale, 1.0f, longest);
      }
      for (int a = 0; a < kInnerStages; ++a) {
        inner_allpass_[c][a].clear();
        inner_length_[c][a] = kit::clamp(kInnerAllpass[a] * scale, 1.0f, longest);
      }
      blur_loop_[c].clear();
      blur_loop_length_[c] = kit::clamp(kBlurLoopDelay * scale, 1.0f, longest);
      pre_filter_[c].reset();
      pre_filter_[c].set_cutoff(kPreFilterHz, sr);
      outer_[c].init();
      inner_[c].init(kInnerBeta);
      fold_mean_[c] = 0.0f;
      dc_[c].reset();
      dc_[c].set_cutoff(kDcHz, sr);
      tilt_[c].reset();
      tilt_[c].set_cutoff(kTiltHz, sr);
      tone_filter_[c].reset();
      for (int a = 0; a < kInputStages; ++a) {
        input_allpass_[c][a].clear();
        input_length_[c][a] =
            kit::clamp_int(static_cast<int>(kInputAllpass[a] * scale), 1, kSmallSize - 1);
      }
      low_cut_[c].reset();
      low_cut_[c].set(kLowCutHz, kit::kSqrtHalf, sr);
      pair_[c].init(sr);
      turn_[c].init(sr);
      feed_cut_[c].reset();
      feed_cut_[c].set_cutoff(kFeedCutHz, sr);
      shifter_[c].reset();
      back_[c] = 0.0f;
    }
    // One trip round the first reverb's loop at full Blur: the loop's delay and
    // the two allpasses in it (an allpass delays energy by its length).
    blur_seconds_ = kBlurLoopDelay / 48000.0f;
    for (int a = 0; a < kInnerStages; ++a) blur_seconds_ += kInnerAllpass[a] / 48000.0f;
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
      gain_to_[n] = 0.0f;
      gain_step_[n] = 0.0f;
    }
    power_[0] = 0.0f;
    power_[1] = 0.0f;
    for (float& value : post_) value = 0.0f;
    for (float& value : drive_ring_) value = kDriveLeast;
    post_at_ = 0;
    level_coeff_ = 1.0f - kit::time_to_coeff(kLevelSeconds, sr);
    fold_coeff_ = 1.0f - kit::time_to_coeff(1.0f / (kit::kTwoPi * kFoldMeanHz), sr);
    follow_ = 1.0f - kit::time_to_coeff(kFollowSeconds, sr);
    tick_seconds_ = static_cast<float>(kControlPeriod) / sr;
    settle_ = 1.0f - kit::time_to_coeff(kSettleSeconds, sr / kControlPeriod);
    relax_ = 1.0f - kit::time_to_coeff(kRelaxSeconds, sr / kControlPeriod);
    shift_turn_[0] = static_cast<double>(kFeedShiftHz[0]) / sr;
    shift_turn_[1] = static_cast<double>(kFeedShiftHz[1]) / sr;

    kit::Smoother* fast[] = {&drive_, &loop_, &back_gain_, &width_, &dry_, &wet_, &late_, &make_};
    for (kit::Smoother* s : fast) s->set_time(kSmoothingSeconds, sr);
    octave_.set_time(kSmoothingSeconds, sr);
    // Size and Blur move read points: they glide slowly enough to bend, not zip.
    size_.set_time(0.15f, sr);
    reach_.set_time(0.15f, sr);
    // Stepped on the control clock.
    decay_.set_time(0.02f, sr / kControlPeriod);
    tone_.set_time(0.02f, sr / kControlPeriod);

    samples_ = 0;
    table_fold_ = -1.0f;
    push_ = 0.0f;
    wall_ = 0.0f;
    // Asleep until something sounds. The longest silent gap the device can
    // make is one trip through the blur's loop and the longest line.
    hold_ = static_cast<long>(kHoldSeconds * sr);
    quiet_ = hold_;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: 0, how
  // far up the fuzz's curve the peaks of the sound reach now, in the curve's
  // own input units (the drive it is given times the level's share of
  // level + floor); 1, the peak of the wall as it leaves (before Mix), falling
  // back over a tenth of a second. Both are 0 at rest and asleep.
  float meter(int index) const {
    if (quiet_ >= hold_) return 0.0f;
    if (index == 0) return push_;
    if (index == 1) return wall_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    float wall_peak = 0.0f;
    int rendered = 0;
    int i = 0;
    while (i < frames) {
      if (quiet_ >= hold_) {
        // Asleep: exact silence, and the clock runs on, until a sample of
        // input comes. Sleeping and waking are by the sample, so where a
        // block's edges fall makes no difference to what is heard.
        while (i < frames && in_left_[i] == 0.0f && in_right_[i] == 0.0f) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          ++i;
          ++samples_;
        }
        if (i == frames) break;
        // Nothing is sounding: whatever moved while asleep applies at once,
        // and the wall is read afresh.
        settle();
        quiet_ = 0;
      }
      const int from = i;
      i = render(i, frames, &wall_peak);
      rendered += i - from;
    }
    // For meter() only: the wall's peak, falling back over a tenth of a second.
    const float fall = 1.0f - static_cast<float>(rendered) / (kMeterFallSeconds * sample_rate());
    wall_ *= fall > 0.0f ? fall : 0.0f;
    if (wall_peak > wall_) wall_ = wall_peak;
    if (quiet_ >= hold_) wall_ = 0.0f;
  }

 private:
  // Renders from sample `i` to the end of the block, or to the sample on which
  // the device falls asleep; returns the next sample to do.
  int render(int i, int frames, float* wall_peak) {
    using namespace haze;
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    for (; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if ((samples_ & (kControlPeriod - 1)) == 0) control();
      ++samples_;

      // The first reverb: allpasses all the way, their lengths by Blur.
      const float loop = glide(loop_);
      const float back_gain = glide(back_gain_);
      const float reach = glide(reach_);
      float pre[2];
      float front[2];
      for (int c = 0; c < 2; ++c) {
        float s = safe(in[c]) + back_gain * back_[c];
        front[c] = s;
        for (int a = 0; a < kBlurStages; ++a) {
          s = blur_allpass_[c][a].process_modulated(s, kit::max(1.0f, blur_length_[c][a] * reach),
                                                    kBlurDiffusion);
        }
        float w = blur_loop_[c].read_linear(kit::max(1.0f, blur_loop_length_[c] * reach));
        for (int a = 0; a < kInnerStages; ++a) {
          w = inner_allpass_[c][a].process_modulated(w, kit::max(1.0f, inner_length_[c][a] * reach),
                                                     kBlurDiffusion);
        }
        const float v = flush_denormal(s + loop * w);
        blur_loop_[c].write(v);
        pre[c] = pre_filter_[c].lowpass(w - loop * v);
      }

      // The level, taken out before the curve and put back after it.
      power_[0] = flush_denormal(power_[0] + level_coeff_ * (pre[0] * pre[0] - power_[0]));
      power_[1] = flush_denormal(power_[1] + level_coeff_ * (pre[1] * pre[1] - power_[1]));
      // As a sine's peak: √2 times the RMS of the louder side. (The mean of
      // the louder sample of the two would read two sides of equal power
      // 2 dB high, and the fuzz would give that back as gain.)
      const float level = std::sqrt(2.0f * (power_[0] > power_[1] ? power_[0] : power_[1]));
      // What the wave is divided by: the level and the floor, and for a sample
      // that stands far over the level (an attack the 25 ms has not caught up
      // with) the sample itself, so that it reaches kAttackReach on the curve
      // and no further. Such a sample then leaves in proportion to itself: an
      // attack is turned down by the drive it meets, not flattened to the
      // level of what came before it.
      const float left = pre[0] < 0.0f ? -pre[0] : pre[0];
      const float right = pre[1] < 0.0f ? -pre[1] : pre[1];
      const float sum = kit::max(level + kFloor, kit::max(left, right) * (1.0f / kAttackReach));
      const float norm = 1.0f / sum;
      // The drive this level is given: all of Haze's at full scale, less
      // below, and never quite nothing (the curve is a wire by then).
      const float follow = std::sqrt((1.0f + kFollowLevel) * level / (level + kFollowLevel));
      const float drive = kit::max(glide(drive_) * kit::min(follow, kFollowMost), kDriveLeast);
      const float push = drive * level * norm;
      // The gain that puts the level back, kept until the sample it was taken
      // from comes out of the oversampler (39.5 samples later: between two).
      // Taken at once, the 25 ms level's own ripple would be a gain that moves
      // at twice the note, which is a third harmonic 42 dB under it. The
      // curve's own 1 / drive is not in it: that is taken at the curve, on the
      // very samples the drive shaped, so a Haze thrown from one end to the
      // other never meets a gain worked out for another drive.
      post_[post_at_] = kit::min(sum, kCeiling) * hold(push);
      const float post = 0.5f * (post_[(post_at_ - kFuzzDelay) & (kPostSize - 1)] +
                                 post_[(post_at_ - kFuzzDelay - 1) & (kPostSize - 1)]);
      // And the drive is kept until the wave it was worked out for reaches the
      // curve, on its way up (18.5 samples).
      drive_ring_[post_at_] = drive;
      const float curve_drive = 0.5f * (drive_ring_[(post_at_ - kCurveDelay) & (kPostSize - 1)] +
                                        drive_ring_[(post_at_ - kCurveDelay - 1) & (kPostSize - 1)]);
      const float curve_gain = 1.0f / curve_drive;
      post_at_ = (post_at_ + 1) & (kPostSize - 1);
      const float fold = octave_.next();
      const float keep = 1.0f - fold;

      float fuzz[2];
      for (int c = 0; c < 2; ++c) {
        float pair[2];
        outer_[c].up(pre[c] * norm, &pair[0], &pair[1]);
        float mean = fold_mean_[c];
        float half[2];
        for (int k = 0; k < 2; ++k) {
          float p, q;
          inner_[c].up(pair[k], &p, &q);
          p = curve(p, curve_drive, curve_gain, keep, fold, &mean);
          q = curve(q, curve_drive, curve_gain, keep, fold, &mean);
          half[k] = inner_[c].down(p, q);
        }
        fold_mean_[c] = mean;
        float y = dc_[c].process(outer_[c].down(half[0], half[1])) * post;

        // Tone: a tilt about 1 kHz and a low-pass that opens with it.
        const float low = tilt_[c].lowpass(y);
        y = tone_filter_[c].lowpass(tilt_low_ * low + tilt_high_ * (y - low));

        y = input_allpass_[c][0].process(y, input_length_[c][0], kInputDiffusion);
        fuzz[c] = input_allpass_[c][1].process(y, input_length_[c][1], kInputDiffusion);
      }

      // The fuzz and its quarter turn.
      float same[2], quarter[2];
      pair_[0].process(fuzz[0], &same[0], &quarter[0]);
      pair_[1].process(fuzz[1], &same[1], &quarter[1]);

      // The wall: a tank that stands still, fed the quarter turn.
      const float size = glide(size_);
      const float more = more_.next();
      float v[kLines];
      for (int n = 0; n < kLines; ++n) {
        v[n] = line_[n].read_linear(kit::clamp(length_[n] * size, 2.0f, max_line));
      }
      const float lines_left = 0.5f * (v[0] - v[2] + v[4] - v[6]);
      const float lines_right = 0.5f * (v[1] - v[3] + v[5] - v[7]);
      hadamard8(v);
      // What comes back round, heard where it goes in again and in the sense
      // each side is fed: the tank's answer with no wait.
      float round[2] = {0.0f, 0.0f};
      for (int n = 0; n < kLines; ++n) {
        const float feed = 0.5f * more * quarter[n & 1];
        gain_[n] += gain_step_[n];
        const float back = damping_[n].lowpass(v[n] * gain_[n]);
        round[n & 1] += (n & 2) ? -back : back;
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        line_[n].write(flush_denormal(4.0f * kit::soft_clip(0.25f * (back + ((n & 2) ? -feed : feed)))));
      }
      // The wall's middle has two parts: what comes back round, and the fuzz
      // itself. The fuzz's middle is the sum of its sides and the quarter
      // turn of their difference, so a sound that is out of phase between
      // left and right has a middle too.
      const float back_left = low_cut_[0].highpass(0.5f * round[0]);
      const float back_right = low_cut_[1].highpass(0.5f * round[1]);
      const float late = glide(late_);
      const float back_mid = late * 0.5f * (back_left + back_right);
      const float fuzz_mid = 0.5f * (same[0] + same[1]) + 0.5f * (quarter[0] - quarter[1]);
      // Their powers and what they have in common, over kFollowSeconds twice.
      const float dry_left = safe(in[0]);
      const float dry_right = safe(in[1]);
      in_power_.add(dry_left * dry_left + dry_right * dry_right, follow_);
      front_power_.add(front[0] * front[0] + front[1] * front[1], follow_);
      fuzz_power_.add(same[0] * same[0] + same[1] * same[1], follow_);
      mid_fuzz_.add(fuzz_mid * fuzz_mid, follow_);
      mid_both_.add(fuzz_mid * back_mid, follow_);
      mid_back_.add(back_mid * back_mid, follow_);
      // The middle, held at its share of the playing's power (hold_wall()).
      const float make = glide(make_);
      const float kept = keep_mid_.next();
      const float mid = make * (top_mid_.next() * fuzz_mid + kept * back_mid);

      // What Feed returns next sample: the middle of the lines, as far as it
      // is kept (hold_wall()), and no more of it for the tank being fed more.
      // Both sides are returned the same and shifted apart: returned a side
      // each, the two sides of the fuzz drifted apart under a held note and
      // the wall came and went with them (2.8 dB down at the worst where this
      // is 1.0). The middle of two unlike sides has half their power, which
      // the root of two puts back.
      const float returned = keep_feed_.next() * kit::kSqrtHalf * (lines_left + lines_right);
      const float less = 1.0f / more;
      for (int c = 0; c < 2; ++c) {
        const double turns = shift_turn_[c] * static_cast<double>(samples_);
        const float turn = static_cast<float>(turns - std::floor(turns));
        float same_back, quarter_back;
        shifter_[c].process(feed_cut_[c].highpass(returned), &same_back, &quarter_back);
        back_[c] = less * (same_back * kit::SineTable::cos_lookup(turn) -
                           quarter_back * kit::SineTable::lookup(turn));
      }

      // The wall's side has two parts as well: the difference between what
      // came back round on the left and on the right (the tank's own width),
      // less whatever of it is the middle over again, and the middle's
      // quarter turn to fill the rest of its share (hold_side()). Neither has
      // anything in common with the middle, so the two sides of the wall are
      // as loud as each other whatever note is held.
      const float wide = glide(width_);
      float mid_same, mid_quarter, across_same, across_quarter;
      turn_[0].process(mid, &mid_same, &mid_quarter);
      turn_[1].process(make * late * 0.5f * (back_left - back_right) * wide, &across_same, &across_quarter);
      wall_mid_.add(mid_same * mid_same, follow_);
      side_with_.add(mid_same * across_same, follow_);
      side_turned_.add(mid_quarter * across_same, follow_);
      side_back_.add(across_same * across_same, follow_);
      // And what the dry sound's middle has in common with each of them.
      const float dry_mid = 0.5f * (dry_left + dry_right);
      with_same_.add(dry_mid * mid_same, follow_);
      with_quarter_.add(dry_mid * mid_quarter, follow_);
      across_with_same_.add(dry_mid * across_same, follow_);
      across_with_quarter_.add(dry_mid * across_quarter, follow_);
      const float top_side = top_side_.next();
      const float keep_side = keep_side_.next();
      const float lean = lean_.next();
      const float side_same = top_side * mid_quarter + keep_side * across_same - lean * mid_same;
      const float side_quarter = keep_side * across_quarter - top_side * mid_same - lean * mid_quarter;

      // The whole wall turned by one angle, the one at which it has nothing in
      // common with the dry sound (turn_wall()).
      const float left_same = mid_same + side_same;
      const float right_same = mid_same - side_same;
      const float left_quarter = mid_quarter + side_quarter;
      const float right_quarter = mid_quarter - side_quarter;
      const float cosine = cosine_.next();
      const float sine = sine_.next();
      // Exact up to ±1 and landing on ±2: the wall never leaves more than
      // 6 dB over full scale, whatever is held into it for however long.
      const float wall_left = 2.0f * kit::soft_clip(0.5f * (cosine * left_same - sine * left_quarter));
      const float wall_right = 2.0f * kit::soft_clip(0.5f * (cosine * right_same - sine * right_quarter));
      const float l = wall_left < 0.0f ? -wall_left : wall_left;
      const float r = wall_right < 0.0f ? -wall_right : wall_right;
      if (l > *wall_peak) *wall_peak = l;
      if (r > *wall_peak) *wall_peak = r;
      push_ = push;

      const float out_left = in[0] * glide(dry_) + wall_left * glide(wet_);
      const float out_right = in[1] * dry_.value + wall_right * wet_.value;
      out_left_[i] = out_left;
      out_right_[i] = out_right;

      // Asleep once nothing has come in and nothing over the floor has left
      // for kHoldSeconds: counted by the sample.
      if (in[0] != 0.0f || in[1] != 0.0f || out_left > kQuiet || out_left < -kQuiet || out_right > kQuiet ||
          out_right < -kQuiet) {
        quiet_ = 0;
      } else if (++quiet_ >= hold_) {
        return i + 1;
      }
    }
    return i;
  }

  static constexpr int kLines = 8;
  static constexpr int kLineSize = 16384;  // 162 ms at 96 kHz
  static constexpr int kSmallSize = 4096;  // 37.5 ms at 96 kHz
  static constexpr int kBlurStages = 5;
  static constexpr int kInnerStages = 2;
  static constexpr int kInputStages = 2;
  static constexpr int kControlPeriod = 32;  // a power of two: the tick is a mask of the sample count
  // The oversampler's delay in whole samples (it is 39.5: measured, as the
  // delay at which a wave at Haze 0 comes out cleanest), and the ring the
  // level's gain waits in.
  static constexpr int kFuzzDelay = 39;
  static constexpr int kCurveDelay = 18;
  static constexpr int kPostSize = 64;
  static constexpr int kTableSize = 33;
  static constexpr int kTablePoints = 24;

  // Haze 0..1 is the drive a full-scale wave is given: none at 0, kDriveMax
  // at 1, and in between kDriveMax (c^Haze - 1) / (c - 1), which is nearly a
  // scale of equal ratios over the upper two thirds and runs down to nothing.
  static constexpr float kDriveMax = 8.0f;
  static constexpr float kDriveCurve = 24.0f;
  // The least the curve is ever driven: a wire to the last bit of a float.
  static constexpr float kDriveLeast = 1.0e-3f;
  // The drive follows the level: the share sqrt((1 + k) L / (L + k)) of it for
  // a level L (1 at full scale, 0.79 at -12 dB, a half at -24 dB), never more
  // than all of it.
  static constexpr float kFollowLevel = 0.25f;
  static constexpr float kFollowMost = 1.0f;
  // The level under which the push into the curve falls away (-40 dBFS),
  // and the most the fuzz puts the level back to (over any wave at full
  // scale: a square's level is 1.4).
  static constexpr float kFloor = 0.01f;
  static constexpr float kCeiling = 2.0f;
  static constexpr float kLevelSeconds = 0.025f;
  // How far over the level a sample may reach on the curve: a chord of three
  // notes peaks at 1.7 times its level and never gets there.
  static constexpr float kAttackReach = 2.0f;
  // The fold: sqrt(x² + s²) − s, its mean followed at 15 Hz, twice as loud as
  // the wave it replaces; Octave 1 leaves 15 % of the wave itself.
  static constexpr float kFoldSoft = 0.05f;
  static constexpr float kFoldGain = 2.0f;
  static constexpr float kFoldMost = 0.85f;
  static constexpr float kFoldMeanHz = 15.0f;
  static constexpr double kInnerBeta = 10.0;
  static constexpr float kPreFilterHz = 5000.0f;
  static constexpr float kDcHz = 20.0f;
  // Tone 0..1: the low-pass from 800 Hz to 12 kHz, and the tilt about 1 kHz.
  // Below the middle the highs are taken down (by 9 dB at 0) and the lows are
  // left; above it the highs come up 6 dB and the lows go down 3.
  static constexpr float kTiltHz = 1000.0f;
  static constexpr float kToneLowHz = 800.0f;
  static constexpr float kToneHighHz = 12000.0f;
  static constexpr float kTiltLowDb = 3.0f;
  static constexpr float kTiltHighDb = 6.0f;
  // The first reverb at full Blur: allpass lengths in samples at 48 kHz (7 to
  // 37 ms, 97 ms in all), the two allpasses and the delay inside its loop
  // (37 ms), the allpass coefficient, and the loop's gain at Blur 1. The two
  // sides have the same lengths: with different ones a sound in the middle
  // left the fuzz as two different sounds, and their sum (the fold to mono)
  // came and went note by note.
  static constexpr float kBlurAllpass[kBlurStages] = {337.0f, 521.0f, 811.0f, 1259.0f, 1733.0f};
  static constexpr float kInnerAllpass[kInnerStages] = {233.0f, 421.0f};
  static constexpr float kBlurLoopDelay = 1109.0f;
  static constexpr float kBlurDiffusion = 0.65f;
  static constexpr float kBlurLoop = 0.6f;
  // Under this Decay the first reverb's lengths shrink in proportion.
  static constexpr float kBlurDecay = 1.0f;
  // The wall: line lengths at Size 0.5, mutually prime in samples at 48 kHz;
  // Size 0..1 scales them by 0.5..1.5.
  static constexpr float kLineSeconds[kLines] = {0.041354f, 0.047896f, 0.055104f, 0.062313f,
                                                 0.071938f, 0.083271f, 0.094729f, 0.108104f};
  static constexpr float kMinScale = 0.5f;
  static constexpr float kMaxScale = 1.5f;
  static constexpr float kInputAllpass[kInputStages] = {229.0f, 173.0f};
  static constexpr float kInputDiffusion = 0.6f;
  // The top of the band dies away in 0.4 of Decay: the pole is
  // (ln 10 / 4) (1 - 1 / 0.4²) times the log of the line's gain, and no more
  // than kDampingMost (at a Decay under about a second).
  static constexpr float kDampingSlope = -3.0221f;
  static constexpr float kDampingMost = 0.6f;
  // The lines' low cut (12 dB an octave), and the gentler one on what Feed returns.
  static constexpr float kLowCutHz = 100.0f;
  static constexpr float kFeedCutHz = 200.0f;
  // A line holds 1/(1 - g²) of the power fed to it and a side taps a quarter
  // of what all eight hold: kLineShare. Feed returns kFeedShare of the wall's
  // loss at its top, which makes the tail 1 / (1 - kFeedShare) as long.
  static constexpr float kLineShare = 0.25f;
  static constexpr float kWetGain = 1.0f;
  static constexpr float kFeedShare = 0.45f;
  static constexpr float kFeedMost = 0.9f;
  // How the wall is held to the playing. Everything is read over
  // kFollowSeconds, twice (two one-pole means in a row), and the gains worked
  // out from the readings settle over kSettleSeconds, twice. Slower held a
  // note less well: at 30 ms and 15 ms the wall alone moved 1.8 dB under a
  // held note at the worst, at these 0.8.
  static constexpr float kFollowSeconds = 0.01f;
  static constexpr float kSettleSeconds = 0.01f;
  // Under a played note Feed returns no more than what comes back round at
  // kFeedLevel of the playing's power (as hold_wall() reads it: the average
  // over the notes; a note on a resonance of the tank comes back several
  // times as strong, and returned whole it went round and round: the front
  // of the device stood 4 to 11 dB over its input and the wall 5 dB over the
  // note). Once the playing stops it is let go over kRelaxSeconds, so the
  // tail has all of Feed.
  static constexpr float kFeedLevel = 0.15f;
  static constexpr float kRelaxSeconds = 0.25f;
  // The side's share of the playing's power at full Width, by Width squared.
  // The middle gives up half of what the side is given: a wider wall is then
  // a little louder in stereo and a little softer folded to mono, by about
  // the same (0.8 dB up and 1.0 dB down at full Width), and not all one way.
  static constexpr float kSideShare = 0.4f;
  // The fuzz counts as playing while its power is over this share of the most
  // it has been (that most falling at the wall's own rate): under it the wall
  // is ringing on, and is left to.
  static constexpr float kPlayingShare = 0.25f;
  // The most the fuzz itself is turned up to fill a part of the wall.
  static constexpr float kTopMost = 2.0f;
  // The tank is fed more (up to kMoreMost times, at kMoreRate a second) while
  // what comes back is under kBackShare of the playing's power.
  static constexpr float kBackShare = 0.6f;
  static constexpr float kMoreMost = 2.0f;
  static constexpr float kMoreRate = 2.0f;
  // The wall's turn: how fast its angle goes to where the wall and the dry
  // sound have nothing in common, and the least the step is divided by (a
  // share of the two powers' product, so noise does not spin it).
  static constexpr float kTurnRate = 40.0f;
  static constexpr float kTurnFloor = 0.02f;
  // The least Mix's wet share counts as, where the side is held clear of the
  // dry sound (under it there is next to no wall to lean).
  static constexpr float kWetLeast = 0.05f;
  // What Feed returns is moved in frequency on the way, by a little less on
  // the left than on the right, so that no resonance of the wall or of the
  // first reverb can feed itself. Both sides go the same way: with one up and
  // one down the sound wandered about a resonance and stayed. And far enough
  // to leave a resonance in a pass or two: at 0.7 and 1.1 Hz the tail at the
  // top of Feed was four to five times as long and a third of its power was
  // one tone. A swing to and fro (a phase wobble in place of the shift, which
  // would leave the pitch where it was) was tried and does not hold: at the
  // top of Feed a low tone stayed for over half a minute.
  static constexpr float kFeedShiftHz[2] = {2.3f, 3.1f};
  static constexpr float kMeterFallSeconds = 0.1f;
  // Asleep after this long with nothing in and nothing over kQuiet out.
  static constexpr float kHoldSeconds = 0.6f;
  static constexpr float kQuiet = 1.0e-7f;

  // kit::hadamard<8> written out (the loop form is several times slower).
  static void hadamard8(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    const float a4 = v[4] + v[5], a5 = v[4] - v[5], a6 = v[6] + v[7], a7 = v[6] - v[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    constexpr float scale = 0.35355339059f;
    v[0] = (b0 + b4) * scale;
    v[1] = (b1 + b5) * scale;
    v[2] = (b2 + b6) * scale;
    v[3] = (b3 + b7) * scale;
    v[4] = (b0 - b4) * scale;
    v[5] = (b1 - b5) * scale;
    v[6] = (b2 - b6) * scale;
    v[7] = (b3 - b7) * scale;
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // The same in double, for what scales a delay of thousands of samples. A
  // float that glides over 0.15 s stalls 4e-4 short of where it is going (its
  // step falls under half a float step) and is landed there: on Size that was
  // a jump of two or three samples in every line, 1.2 s after the knob moved.
  // It goes in two stages of half the time each, so it sets off from rest:
  // in one, a thrown Size had every line's read point at full speed from the
  // first sample, and the wave bent there (a corner three times the largest
  // the note has of its own).
  struct LongGlide {
    double value = 0.0, lag = 0.0, target = 0.0, coeff = 0.0;
    void set_time(float seconds, float rate) { coeff = std::exp(-2.0 / (static_cast<double>(seconds) * rate)); }
    void snap(float v) { value = lag = target = v; }
    void set(float v, bool primed) {
      target = v;
      if (!primed) value = lag = v;
    }
    float next() {
      if (value != target) {
        lag = target + (lag - target) * coeff;
        value = lag + (value - lag) * coeff;
        const double delta = value - target;
        const double behind = lag - target;
        if (delta > -1.0e-10 && delta < 1.0e-10 && behind > -1.0e-10 && behind < 1.0e-10) value = lag = target;
      }
      return static_cast<float>(value);
    }
  };
  static float glide(LongGlide& s) { return s.next(); }

  // A mean over kFollowSeconds, taken twice over (the second of the first), so
  // a power read from it has little of the wave's own ripple left. It never
  // quite reaches nothing, so it never lands on a denormal.
  struct Mean {
    float first = 0.0f, value = 0.0f;
    void clear() { first = value = 0.0f; }
    void add(float x, float k) {
      first += k * (x + 1.0e-25f - first);
      value += k * (first - value);
    }
  };

  // A gain that goes to where the control tick has it in a straight line.
  // follow() takes what the tick worked out through two more means first
  // (kSettleSeconds each): the means it was worked out from still carry a
  // little of the wave at twice the note, and a gain that moved with that
  // would be a third harmonic on a clean note.
  struct Ramp {
    float value = 1.0f, target = 1.0f, step = 0.0f, first = 1.0f, second = 1.0f;
    void snap(float x) {
      value = target = first = second = x;
      step = 0.0f;
    }
    void follow(float x, float k) {
      first += k * (x - first);
      second += k * (first - second);
      to(second);
    }
    void to(float x) {
      target = x;
      step = (x - value) * (1.0f / kControlPeriod);
    }
    float next() {
      value += step;
      return value;
    }
  };

  // The gain g, 0 to kTopMost, on a part of power `part` that brings it and a
  // second part of power `rest` (with `both` in common) to the power `aim`:
  // g² part + 2 g both + rest = aim, or the nearest to it.
  static float solve(float part, float both, float rest, float aim, float alone) {
    if (part <= 1.0e-14f) return alone;
    const float under = both * both - part * (rest - aim);
    return kit::clamp(((under > 0.0f ? std::sqrt(under) : 0.0f) - both) / part, 0.0f, kTopMost);
  }

  // What the wet path takes of an input sample: NaN is silence, and nothing
  // beyond ±8 goes in, so a bad sample cannot lodge in a loop.
  static float safe(float x) {
    if (x > -8.0f && x < 8.0f) return x;
    return x >= 8.0f ? 8.0f : (x <= -8.0f ? -8.0f : 0.0f);
  }

  // The curve at four times the rate: the wave `q` (level taken out, peaks
  // near 1), part of it folded for the octave, driven into tanh.
  float curve(float q, float drive, float gain, float keep, float fold, float* mean) const {
    const float folded = std::sqrt(q * q + kFoldSoft * kFoldSoft) - kFoldSoft;
    *mean += fold_coeff_ * (folded - *mean);
    return gain * kit::fast_tanh(drive * (keep * q + fold * kFoldGain * (folded - *mean)));
  }

  // The gain that puts a sine back at the RMS it had, for peaks that reach
  // `push` on the curve: push / (√2 × the curve's RMS), read from the table
  // as hold / (1 + push) over push / (1 + push), which is smooth and bounded.
  float hold(float push) const {
    const float position = push / (1.0f + push) * static_cast<float>(kTableSize - 1);
    int index = static_cast<int>(position);
    if (index > kTableSize - 2) index = kTableSize - 2;
    const float fraction = position - static_cast<float>(index);
    return (table_[index] + (table_[index + 1] - table_[index]) * fraction) * (1.0f + push);
  }

  // The table for hold(), from one cycle of a sine through the fold and the
  // curve as they stand at this Octave.
  void build_table(float fold) {
    const float keep = 1.0f - fold;
    float mixed[kTablePoints];
    float folded[kTablePoints];
    float mean = 0.0f;
    for (int j = 0; j < kTablePoints; ++j) {
      const float n = kit::SineTable::lookup((static_cast<float>(j) + 0.5f) / kTablePoints);
      mixed[j] = n;
      folded[j] = std::sqrt(n * n + kFoldSoft * kFoldSoft) - kFoldSoft;
      mean += folded[j];
    }
    mean /= kTablePoints;
    for (int j = 0; j < kTablePoints; ++j) {
      mixed[j] = keep * mixed[j] + fold * kFoldGain * (folded[j] - mean);
    }
    for (int i = 0; i < kTableSize; ++i) {
      const float w = static_cast<float>(i) / static_cast<float>(kTableSize - 1);
      // The two ends are limits: a push of nothing and a push without end.
      const float push = i == 0 ? 1.0e-3f : (i == kTableSize - 1 ? 1.0e4f : w / (1.0f - w));
      float sum = 0.0f;
      float squares = 0.0f;
      for (int j = 0; j < kTablePoints; ++j) {
        const float s = kit::fast_tanh(push * mixed[j]);
        sum += s;
        squares += s * s;
      }
      sum /= kTablePoints;
      const float rms = std::sqrt(kit::max(squares / kTablePoints - sum * sum, 1.0e-20f));
      const float held = push * kit::kSqrtHalf / rms;
      table_[i] = i == 0 ? held : held / (1.0f + push);
    }
    table_fold_ = fold;
  }

  // Holds the wall to the playing: its middle at its share of the fuzz's own
  // power, whatever note is played, and its side at its share of the middle.
  //
  // A tank that stands still answers each note differently (its resonances
  // are a couple of Hz apart and a third of a Hz wide at a long Decay): what
  // comes back round for a held note is anything from nothing to several
  // times the fuzz. Nothing here goes round a loop to even that. What comes
  // back is turned down where it is over its share (a gain worked out from
  // its power and the playing's, and left where it is once the playing
  // stops, so a tail dies at the tank's own rate), and the fuzz itself is
  // turned up to fill what is missing (the gain that makes the sum of the two
  // the share, knowing their powers and what they have in common). The tank
  // is fed the fuzz a quarter turn on, so for most notes the two have little
  // in common and the sum of their powers is the power of their sum.
  void hold_wall() {
    // The playing's power: the fuzz's, less the share of it Feed brought round.
    const float front = front_power_.value;
    const float playing =
        front > 1.0e-14f ? fuzz_power_.value * kit::min(1.0f, in_power_.value / front) : 0.0f;
    held_ = kit::max(playing, held_ * fall_);
    const bool sounding = playing > kPlayingShare * held_ && playing > 1.0e-12f;
    const float side_share = kSideShare * width_.value * width_.value;
    const float mid_share = 1.0f - 0.5f * side_share;
    if (sounding) {
      const float most = 0.5f * mid_share * held_;
      keep_mid_.follow(mid_back_.value > most ? std::sqrt(most / mid_back_.value) : 1.0f, settle_);
    } else {
      keep_mid_.to(keep_mid_.target);
    }
    // What Feed may return of it, under a played note and after.
    if (sounding) {
      const float most = kFeedLevel * playing;
      keep_feed_.follow(mid_back_.value > most ? std::sqrt(most / mid_back_.value) : 1.0f, settle_);
    } else {
      keep_feed_.follow(1.0f, relax_);
    }
    const float keep = keep_mid_.target;
    top_mid_.follow(solve(mid_fuzz_.value, keep * mid_both_.value, keep * keep * mid_back_.value,
                          0.5f * mid_share * playing, std::sqrt(mid_share)),
                    settle_);
    // The tank is fed more while too little comes back (a note between its
    // resonances), slowly, and Feed's return is turned down by as much, so the
    // loop round the front is the one control() worked out.
    float more = more_.target;
    if (sounding) more += kMoreRate * tick_seconds_ * (kBackShare - 4.0f * mid_back_.value / playing);
    more_.to(kit::clamp(more, 1.0f, kMoreMost));

    // The side, at its share of the middle's power as it now is: what came
    // back round as a difference between the sides (the tank's own width), as
    // far as it fits, and the middle's quarter turn to fill the rest. One side
    // of the output is louder than the other by what its middle and its side
    // have in common, and its middle is the dry sound and the wall's middle
    // together: so a third part, the wall's middle itself, is taken off the
    // side by as much as leaves the side with nothing in common with that
    // sum. (Without it a held note sat 3 dB to one side of a played phrase:
    // the middle's quarter turn is the dry sound over again, the middle
    // having been turned a quarter from it.)
    const float middle = wall_mid_.value;
    if (middle > 1.0e-16f) {
      const float aim = middle * side_share / mid_share;
      const float dry = dry_.value / kit::max(wet_.value, kWetLeast);
      // The dry sound with the middle's quarter turn and with the tank's
      // side, as the wall now stands turned; then with the mix's middle.
      const float turned = dry * (with_same_.value * sine_.target + with_quarter_.value * cosine_.target) / middle;
      const float across = (dry * (across_with_same_.value * cosine_.target -
                                   across_with_quarter_.value * sine_.target) +
                            side_with_.value) /
                           middle;
      // The side is top * quarter + kept * tank - lean * middle, with
      // lean = turned * top + kept * across. Its power as a square in top:
      const float square = middle * (1.0f + turned * turned);
      const float cross = turned * across * middle + side_turned_.value - turned * side_with_.value;
      const float tank = across * across * middle - 2.0f * across * side_with_.value + side_back_.value;
      const float least = kit::max(tank - cross * cross / square, 0.0f);
      float kept = 1.0f;
      float top;
      if (least > aim) {
        // The tank's side alone is over the share: less of it, and no more.
        kept = std::sqrt(aim / least);
        top = -kept * cross / square;
      } else {
        const float under = cross * cross - square * (tank - aim);
        top = ((under > 0.0f ? std::sqrt(under) : 0.0f) - cross) / square;
      }
      top = kit::clamp(top, -kTopMost, kTopMost);
      keep_side_.follow(kept, settle_);
      top_side_.follow(top, settle_);
      lean_.follow(kit::clamp(turned * top + kept * across, -kTopMost, kTopMost), settle_);
    } else {
      keep_side_.to(keep_side_.target);
      lean_.to(lean_.target);
      top_side_.to(top_side_.target);
    }
  }

  // Turns the whole wall to the angle at which its middle and the dry
  // sound's have nothing in common. Part-way up Mix the two are the same
  // notes, and by their phase they added for one note and cancelled for the
  // next: a quarter turn apart, the power of the mix is the sum of its parts,
  // in stereo and folded to mono alike. The angle is walked there on the two
  // means of the dry sound with the wall's middle and with its quarter turn
  // (either of the two angles half a turn apart will do, and it settles on
  // the nearer).
  void turn_wall() {
    const float same = with_same_.value;
    const float quarter = with_quarter_.value;
    const float meet = same * cosine_.target - quarter * sine_.target;
    const float slope = same * sine_.target + quarter * cosine_.target;
    const float span =
        same * same + quarter * quarter + kTurnFloor * 0.5f * in_power_.value * wall_mid_.value + 1.0e-20f;
    angle_ += kTurnRate * tick_seconds_ * meet * slope / span;
    if (angle_ > kit::kPi) angle_ -= kit::kTwoPi;
    if (angle_ < -kit::kPi) angle_ += kit::kTwoPi;
    cosine_.to(std::cos(angle_));
    sine_.to(std::sin(angle_));
  }

  // Every 32 samples: the wall's gains from Decay and Size, the wet levels and
  // the share Feed returns, Tone's filters, the hold table, and the gains and
  // the angle that hold the wall to the playing.
  void control() {
    using namespace haze;
    derive(1.0f / decay_.next(), tone_.next());
    // The lines' gains walk to where Decay has them over the tick, a sample
    // at a time: stepped by the tick, a thrown Decay was a jump in the wall
    // each time a line came round.
    for (int n = 0; n < kLines; ++n) gain_step_[n] = (gain_to_[n] - gain_[n]) * (1.0f / kControlPeriod);
    hold_wall();
    turn_wall();
  }

  void derive(float decay, float tone) {
    using namespace haze;
    const float sr = sample_rate();
    const float size = static_cast<float>(size_.value);
    for (int n = 0; n < kLines; ++n) {
      // The gain that takes Decay to fall 60 dB, and a one-pole on top of it
      // that takes 0.4 of Decay at the top of the band (Jot's absorbent
      // filter: unity at the bottom, so Decay is the time there).
      const float exponent = -3.0f * length_[n] * size / (decay * sr);  // log10 of the gain
      gain_to_[n] = std::pow(10.0f, exponent);
      damping_[n].a = kit::min(kDampingSlope * exponent, kDampingMost);
    }
    const float middle = gain_to_[kLines / 2];
    const float loss = kit::max(1.0f - middle * middle, 1.0e-4f);
    // Feed: the gain on what returns, for the share of the wall's loss it is
    // to make good, and never over kFeedMost (a short Decay loses nearly all
    // it has each pass, and making that good would be a loop of its own).
    const float feed = param(kFeed);
    const float back = feed * kit::min(std::sqrt(kFeedShare * loss / kLineShare), kFeedMost);
    const float share = back * back * kLineShare / loss;
    back_gain_.set_target(back);

    // Tone's tilt only ever takes away on the way into the wall, and what its
    // louder side would have added is put back after the wall: Feed's loop
    // runs through the tilt, and a tilt that added to one side of 1 kHz made
    // the loop's gain there more than one. Below the middle of Tone nothing
    // is added at all (the lows stay and the highs go), so a dark wall is not
    // a louder one.
    const float turn = 2.0f * tone - 1.0f;
    const float tilt_low = kit::db_to_gain(-kit::max(turn, 0.0f) * kTiltLowDb);
    const float tilt_high =
        kit::db_to_gain(turn > 0.0f ? turn * kTiltHighDb : turn * (kTiltHighDb + kTiltLowDb));
    const float tilt_most = kit::max(tilt_low, tilt_high);
    tilt_low_ = tilt_low / tilt_most;
    tilt_high_ = tilt_high / tilt_most;

    // What comes back round: a side of the lines holds kLineShare / loss of
    // the power fed to it, and Feed makes it hold 1 / (1 - share) as much. All
    // of that is taken back, so what comes back is about as loud as the fuzz
    // went in whatever Decay and Feed are, before hold_wall() sees to the rest.
    late_.set_target(kWetGain * std::sqrt((1.0f - share) * loss / kLineShare));
    make_.set_target(tilt_most);
    // How fast the most the playing has been is let fall: as the wall dies.
    fall_ = std::exp(-13.8155f * kControlPeriod * (1.0f - share) / (decay * sr));

    // The first reverb's loop: its gain is Blur's, held under the gain that
    // would take Decay to die away.
    const float reach = static_cast<float>(reach_.target);
    const float loop =
        kit::min(kBlurLoop * param(kBlur), kit::rt60_gain(kit::max(blur_seconds_ * reach * sr, 1.0f), decay, sr));
    loop_.set_target(loop);

    const float cutoff = kToneLowHz * std::pow(kToneHighHz / kToneLowHz, tone);
    tone_filter_[0].set(cutoff, kit::kSqrtHalf, sr);
    tone_filter_[1].g = tone_filter_[0].g;
    tone_filter_[1].k = tone_filter_[0].k;
    tone_filter_[1].a1 = tone_filter_[0].a1;
    tone_filter_[1].a2 = tone_filter_[0].a2;
    tone_filter_[1].a3 = tone_filter_[0].a3;

    if (octave_.value != table_fold_) build_table(octave_.value);
  }

  // Everything at its target now: at init, and when the device wakes.
  void settle() {
    using namespace haze;
    kit::Smoother* all[] = {&drive_, &width_, &dry_, &wet_};
    for (kit::Smoother* s : all) s->snap(s->target);
    reach_.value = reach_.lag = reach_.target;
    size_.value = size_.lag = size_.target;
    octave_.snap(octave_.target);
    decay_.snap(1.0f / param(kDecay));
    tone_.snap(param(kTone));
    derive(1.0f / decay_.value, tone_.value);
    for (int n = 0; n < kLines; ++n) {
      gain_[n] = gain_to_[n];
      gain_step_[n] = 0.0f;
    }
    late_.snap(late_.target);
    make_.snap(make_.target);
    loop_.snap(loop_.target);
    back_gain_.snap(back_gain_.target);
    // Nothing is sounding, so nothing has been read: the wall starts as the
    // fuzz alone at its two shares, the tank fed as it stands, no turn.
    Mean* means[] = {&in_power_,   &front_power_, &fuzz_power_, &mid_fuzz_,         &mid_both_,
                     &mid_back_,   &wall_mid_,    &side_with_,  &side_turned_,      &side_back_,
                     &with_same_,  &with_quarter_, &across_with_same_, &across_with_quarter_};
    for (Mean* mean : means) mean->clear();
    const float side_share = kSideShare * width_.value * width_.value;
    top_mid_.snap(std::sqrt(1.0f - 0.5f * side_share));
    top_side_.snap(std::sqrt(side_share / (1.0f - 0.5f * side_share)));
    keep_mid_.snap(1.0f);
    keep_feed_.snap(1.0f);
    keep_side_.snap(1.0f);
    lean_.snap(0.0f);
    more_.snap(1.0f);
    held_ = 0.0f;
    angle_ = 0.0f;
    cosine_.snap(1.0f);
    sine_.snap(0.0f);
  }

  // Blur's reach: the share of their full length the first reverb's delays
  // have. Under a Decay of kBlurDecay it shrinks with Decay.
  void set_reach() {
    using namespace haze;
    reach_.set(param(kBlur) * kit::min(1.0f, param(kDecay) / kBlurDecay), primed());
  }

  void apply(int id) {
    using namespace haze;
    const float value = param(id);
    switch (id) {
      case kHaze:
        drive_.set(kDriveMax * (std::pow(kDriveCurve, value) - 1.0f) / (kDriveCurve - 1.0f), primed());
        break;
      case kBlur:
        set_reach();
        break;
      case kDecay:
        decay_.set(1.0f / value, primed());
        set_reach();
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kSize:
        size_.set(kit::lerp(kMinScale, kMaxScale, value), primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kOctave:
        octave_.set(value * kFoldMost, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;  // Feed is read on the control clock
    }
  }

  kit::AllpassDelay<kSmallSize> blur_allpass_[2][kBlurStages];
  float blur_length_[2][kBlurStages] = {};
  kit::AllpassDelay<kSmallSize> inner_allpass_[2][kInnerStages];
  float inner_length_[2][kInnerStages] = {};
  kit::DelayLine<kSmallSize> blur_loop_[2];
  float blur_loop_length_[2] = {};
  kit::OnePole pre_filter_[2];
  float power_[2] = {};  // mean square of each side into the fuzz
  float level_coeff_ = 0.0f;
  float post_[kPostSize] = {};
  float drive_ring_[kPostSize] = {};
  int post_at_ = 0;
  kit::Halfband2x outer_[2];
  haze_dsp::Halfband<8> inner_[2];
  float blur_seconds_ = 0.04f;  // one trip round the first reverb's loop at full Blur
  float fold_mean_[2] = {};
  float fold_coeff_ = 0.0f;
  kit::DcBlocker dc_[2];
  kit::OnePole tilt_[2];
  kit::Svf tone_filter_[2];
  float tilt_low_ = 1.0f;
  float tilt_high_ = 1.0f;
  float table_[kTableSize] = {};
  float table_fold_ = -1.0f;

  kit::AllpassDelay<kSmallSize> input_allpass_[2][kInputStages];
  int input_length_[2][kInputStages] = {};
  kit::DelayLine<kLineSize> line_[kLines];
  kit::OnePole damping_[kLines];
  float length_[kLines] = {};
  float gain_[kLines] = {};
  float gain_to_[kLines] = {};
  float gain_step_[kLines] = {};
  kit::Svf low_cut_[2];
  haze_dsp::Quadrature pair_[2];  // the fuzz and its quarter turn
  haze_dsp::Quadrature turn_[2];  // the wall and its quarter turn
  kit::OnePole feed_cut_[2];
  kit::Hilbert shifter_[2];
  double shift_turn_[2] = {};
  float back_[2] = {};

  // What hold_wall() and turn_wall() read, and what they set.
  Mean in_power_, front_power_, fuzz_power_;
  Mean mid_fuzz_, mid_both_, mid_back_, wall_mid_, side_with_, side_turned_, side_back_;
  Mean with_same_, with_quarter_, across_with_same_, across_with_quarter_;
  Ramp top_mid_, keep_mid_, keep_feed_, top_side_, keep_side_, lean_, more_, cosine_, sine_;
  float follow_ = 0.0f;        // the means' coefficient
  float settle_ = 0.0f;        // the gains' own, a control tick at a time
  float relax_ = 0.0f;         // and the slower one Feed's return is let go by
  float tick_seconds_ = 0.0f;  // one control tick
  float fall_ = 1.0f;          // what held_ keeps of itself a tick
  float held_ = 0.0f;          // the most the playing's power has been, falling as the wall does
  float angle_ = 0.0f;         // the wall's turn

  kit::Smoother drive_, loop_, back_gain_, width_, dry_, wet_, late_, make_;
  LongGlide reach_, size_;
  kit::LinearRamp octave_;
  // Stepped on the control clock. decay_ holds 1 / Decay: the lines' gains
  // are 10 to a power that goes as 1 / Decay, so a thrown Decay moves them
  // evenly (gliding Decay itself took the gain of a line from 0.44 to 0.75 in
  // the first tick of a throw from the bottom to the top).
  kit::Smoother decay_, tone_;
  long hold_ = 1;   // samples of quiet before sleep
  long quiet_ = 1;  // samples of quiet so far; asleep at hold_
  uint64_t samples_ = 0;  // since init, asleep or not
  // For meter() only: never read by the sound.
  float push_ = 0.0f;
  float wall_ = 0.0f;
};

}  // namespace livemix
