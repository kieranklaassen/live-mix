#pragma once

// Haze: a short reverb into a soft fuzz into a long reverb.
//
//   in ─┬──────────────────────────────────────────────────────────────── dry ─┐
//       ▼                                                                      │
//      (+)─► Blur: 5 allpasses ─► an allpass round a delay and 2 more          │
//       ▲    (the first reverb; every length follows Blur)                     │
//       │      ─► low-pass ─► FUZZ ─► Tone ─► 2 allpasses ─┬──── early ───┐    │
//       │                                                  ▼              ▼    ▼
//       │                 8 swept delay lines (the wall) ─► low cut ─(+)─► width ─► Mix ─► out
//       │                  ▲ damping ◄ decay gain ◄ Hadamard ┘
//       └── Feed ◄── shift down a few Hz ◄── low cut ◄── the lines
//
// FUZZ, per side, at four times the sample rate:
//
//   x ─► ÷ (level + floor) ─► fold (Octave) ─► × drive ─► tanh ─► DC block ─► × level × hold ─► y
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
//   20 to 160 ms by Size, read with a slow free-running sweep each. Its low
//   end is cut (the lines' own resonances are too few down there to carry a
//   bass evenly). Beside the lines the fuzz also goes straight out ("early"):
//   a small share always, so the wall answers at once, and half the wall's
//   power as Mix nears its top, where there is no dry sound left to be even
//   and full in the bass for it. The two are scaled so the wall is as loud
//   whatever Decay, Feed and Mix are.
// - Feed returns the lines to the front, moved down by a few Hz on the way
//   (a single-sideband shift, 2.3 Hz on the left and 3.1 Hz on the right).
//   Without the shift the loop howls: one resonance of the wall feeds itself
//   and a single tone holds for good. With it, what returns never lands on
//   the frequency it left, so the loop's gain is the average over the wall's
//   resonances and not the highest of them. The price is that what has been
//   round several times is flat of where it started, so the top of Feed is
//   set where the late tail leans flat by about a quarter tone at 440 Hz and
//   no more: the returned share is worked out from the wall's own loss, 0.45
//   of it at the top, which makes the tail nearly twice as long. Only what is
//   above the bass goes round.
// - The sweeps and the shift run by a count of samples that goes on through
//   silence and sleep, and the device goes to sleep and wakes on the sample,
//   not the block, so the output is the same at every block size.
//
// Storage: eight lines of 16384 samples, eighteen allpasses and two loop delays
// of 4096 (sized for 96 kHz), the oversampling filters: about 0.9 MB.

#include "../../kit/kit.h"
#include "halfband.h"
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
        blur_length_[c][a] = kit::clamp(kBlurAllpass[c][a] * scale, 1.0f, longest);
      }
      for (int a = 0; a < kInnerStages; ++a) {
        inner_allpass_[c][a].clear();
        inner_length_[c][a] = kit::clamp(kInnerAllpass[c][a] * scale, 1.0f, longest);
      }
      blur_loop_[c].clear();
      blur_loop_length_[c] = kit::clamp(kBlurLoopDelay[c] * scale, 1.0f, longest);
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
            kit::clamp_int(static_cast<int>(kInputAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
      low_cut_[c].reset();
      low_cut_[c].set(kLowCutHz, kit::kSqrtHalf, sr);
      early_low_[c].reset();
      early_low_[c].set(kLowCutHz, kit::kSqrtHalf, sr);
      feed_cut_[c].reset();
      feed_cut_[c].set_cutoff(kFeedCutHz, sr);
      shifter_[c].reset();
      back_[c] = 0.0f;
    }
    // One trip round the first reverb's loop at full Blur: the loop's delay and
    // the two allpasses in it (an allpass delays energy by its length).
    blur_seconds_ = kBlurLoopDelay[0] / 48000.0f;
    for (int a = 0; a < kInnerStages; ++a) blur_seconds_ += kInnerAllpass[0][a] / 48000.0f;
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
      gain_to_[n] = 0.0f;
      gain_step_[n] = 0.0f;
      sweep_[n] = 0.0f;
      sweep_step_[n] = 0.0f;
    }
    power_[0] = 0.0f;
    power_[1] = 0.0f;
    for (float& value : post_) value = 0.0f;
    for (float& value : drive_ring_) value = kDriveLeast;
    post_at_ = 0;
    level_coeff_ = 1.0f - kit::time_to_coeff(kLevelSeconds, sr);
    fold_coeff_ = 1.0f - kit::time_to_coeff(1.0f / (kit::kTwoPi * kFoldMeanHz), sr);
    sweep_depth_ = kSweepSeconds * sr;
    shift_turn_[0] = static_cast<double>(kFeedShiftHz[0]) / sr;
    shift_turn_[1] = static_cast<double>(kFeedShiftHz[1]) / sr;

    kit::Smoother* fast[] = {&drive_, &loop_, &back_gain_, &width_, &dry_,
                             &wet_,   &width_gain_, &late_, &early_, &thin_};
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
        // and the sweeps stand where the clock has them.
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
      for (int c = 0; c < 2; ++c) {
        float s = safe(in[c]) + back_gain * back_[c];
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

      // The wall.
      const float size = glide(size_);
      float v[kLines];
      for (int n = 0; n < kLines; ++n) {
        sweep_[n] += sweep_step_[n];
        v[n] = line_[n].read_linear(kit::clamp(length_[n] * size + sweep_[n], 2.0f, max_line));
      }
      const float lines_left = 0.5f * (v[0] - v[2] + v[4] - v[6]);
      const float lines_right = 0.5f * (v[1] - v[3] + v[5] - v[7]);
      hadamard8(v);
      for (int n = 0; n < kLines; ++n) {
        const float feed = 0.5f * fuzz[n & 1];
        gain_[n] += gain_step_[n];
        const float x = damping_[n].lowpass(v[n] * gain_[n]) + ((n & 2) ? -feed : feed);
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        line_[n].write(flush_denormal(4.0f * kit::soft_clip(0.25f * x)));
      }
      // What Feed returns next sample: the lines alone, so the share that
      // comes back is the share control() worked out.
      const float lines[2] = {lines_left, lines_right};
      for (int c = 0; c < 2; ++c) {
        const double turns = shift_turn_[c] * static_cast<double>(samples_);
        const float turn = static_cast<float>(turns - std::floor(turns));
        float same, quarter;
        shifter_[c].process(feed_cut_[c].highpass(lines[c]), &same, &quarter);
        back_[c] = same * kit::SineTable::cos_lookup(turn) - quarter * kit::SineTable::lookup(turn);
      }

      const float late = glide(late_);
      const float early = glide(early_);
      const float thin = glide(thin_);
      const float wet_left = late * low_cut_[0].highpass(lines_left) +
                             early * (fuzz[0] + thin * (early_low_[0].highpass(fuzz[0]) - fuzz[0]));
      const float wet_right = late * low_cut_[1].highpass(lines_right) +
                              early * (fuzz[1] + thin * (early_low_[1].highpass(fuzz[1]) - fuzz[1]));
      const float gain = glide(width_gain_);
      const float mid = 0.5f * (wet_left + wet_right) * gain;
      const float side = 0.5f * (wet_left - wet_right) * glide(width_) * gain;
      // Exact up to ±1 and landing on ±2: the wall never leaves more than
      // 6 dB over full scale, whatever is held into it for however long.
      const float wall_left = 2.0f * kit::soft_clip(0.5f * (mid + side));
      const float wall_right = 2.0f * kit::soft_clip(0.5f * (mid - side));
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
  static constexpr int kLineSize = 16384;  // 162 ms at 96 kHz plus the sweep
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
  // (37 ms), the allpass coefficient, and the loop's gain at Blur 1.
  static constexpr float kBlurAllpass[2][kBlurStages] = {{337.0f, 521.0f, 811.0f, 1259.0f, 1733.0f},
                                                         {359.0f, 547.0f, 853.0f, 1193.0f, 1801.0f}};
  static constexpr float kInnerAllpass[2][kInnerStages] = {{233.0f, 421.0f}, {251.0f, 443.0f}};
  static constexpr float kBlurLoopDelay[2] = {1109.0f, 1151.0f};
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
  static constexpr float kInputAllpass[2][kInputStages] = {{229.0f, 173.0f}, {241.0f, 181.0f}};
  static constexpr float kInputDiffusion = 0.6f;
  // The top of the band dies away in 0.4 of Decay: the pole is
  // (ln 10 / 4) (1 - 1 / 0.4²) times the log of the line's gain, and no more
  // than kDampingMost (at a Decay under about a second).
  static constexpr float kDampingSlope = -3.0221f;
  static constexpr float kDampingMost = 0.6f;
  // The lines' low cut (12 dB an octave), and the gentler one on what Feed returns.
  static constexpr float kLowCutHz = 100.0f;
  static constexpr float kFeedCutHz = 200.0f;
  // Each line's read point sweeps ±0.9 ms at 0.23 Hz and up, 0.09 Hz apart.
  // Deeper evens the wall over the notes (a held note's level by semitone
  // has a spread of 1.9 dB at ±0.6 ms and 1.3 dB at ±2.4 ms) and detunes the
  // tail (its pitch is spread 10 cents at ±0.6 ms and 50 cents at ±2.4 ms a
  // fifth of a second after a note): this is between.
  static constexpr float kSweepSeconds = 0.0009f;
  static constexpr float kSweepHz = 0.23f;
  static constexpr float kSweepStepHz = 0.09f;
  // A line holds 1/(1 - g²) of the power fed to it and a side taps a quarter
  // of what all eight hold: kLineShare. Feed returns kFeedShare of the wall's
  // loss at its top, which makes the tail 1 / (1 - kFeedShare) as long.
  static constexpr float kLineShare = 0.25f;
  static constexpr float kWetGain = 1.0f;
  static constexpr float kFeedShare = 0.45f;
  static constexpr float kFeedMost = 0.9f;
  // The fuzz's own share of the wall's power, beside the lines: kEarlyLeast
  // (as an amplitude) up to a Mix of kEarlyFrom, rising to kEarlyMost at a
  // Mix of 1. With the dry sound in the mix a large share would comb against
  // it (it is the same notes, turned in phase by the first reverb).
  static constexpr float kEarlyLeast = 0.25f;
  static constexpr float kEarlyMost = 0.70710678f;
  static constexpr float kEarlyFrom = 0.75f;
  static constexpr float kBassFrom = 0.85f;
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
  struct LongGlide {
    double value = 0.0, target = 0.0, coeff = 0.0;
    void set_time(float seconds, float rate) { coeff = std::exp(-1.0 / (static_cast<double>(seconds) * rate)); }
    void snap(float v) { value = target = v; }
    void set(float v, bool primed) {
      target = v;
      if (!primed) value = v;
    }
    float next() {
      if (value != target) {
        const double delta = value - target;
        value = (delta > -1.0e-10 && delta < 1.0e-10) ? target : target + delta * coeff;
      }
      return static_cast<float>(value);
    }
  };
  static float glide(LongGlide& s) { return s.next(); }

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

  // Every 32 samples: the wall's gains from Decay and Size, the wet levels and
  // the share Feed returns, Tone's filters, the hold table, the sweeps.
  void control() {
    using namespace haze;
    derive(1.0f / decay_.next(), tone_.next());
    // The lines' gains walk to where Decay has them over the tick, a sample
    // at a time: stepped by the tick, a thrown Decay was a jump in the wall
    // each time a line came round.
    for (int n = 0; n < kLines; ++n) gain_step_[n] = (gain_to_[n] - gain_[n]) * (1.0f / kControlPeriod);
    set_sweeps(samples_ / kControlPeriod, 0);
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

    // The wall's two parts. A side of the lines holds kLineShare / loss of the
    // power fed to it, and Feed makes it hold 1 / (1 - share) as much: all of
    // that is taken back, so the lines leave as loud as the fuzz went in,
    // whatever Decay and Feed are. The fuzz itself is the early part; the two
    // share the wall's power, early² + late² = 1.
    const float mix = param(kMix);
    const float rise = kit::clamp((mix - kEarlyFrom) / (1.0f - kEarlyFrom), 0.0f, 1.0f);
    const float early = kit::lerp(kEarlyLeast, kEarlyMost, rise * rise);
    early_.set_target(kWetGain * tilt_most * early);
    // The early part's bass: none while the dry sound has the bass (two copies
    // of one low note, turned against each other, would cancel by the note),
    // all of it at the top of Mix, where the wall stands alone.
    const float bass = kit::clamp((mix - kBassFrom) / (1.0f - kBassFrom), 0.0f, 1.0f);
    thin_.set_target(1.0f - bass * bass);
    late_.set_target(kWetGain * tilt_most * std::sqrt(1.0f - early * early) *
                     std::sqrt((1.0f - share) * loss / kLineShare));

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

  // Where each line's sweep stands `within` samples after control tick
  // `tick`, and the step that takes it to the next: a function of the count
  // of samples alone, so a sleep of any length leaves it where it would be.
  // The steps within the tick are added one by one, as the running device
  // adds them, so the sum is the same to the last bit.
  void set_sweeps(uint64_t tick, int within) {
    const double period = static_cast<double>(kControlPeriod) / sample_rate();
    for (int n = 0; n < kLines; ++n) {
      const double turn = (kSweepHz + kSweepStepHz * n) * period;
      const double now = static_cast<double>(n) / kLines + turn * static_cast<double>(tick);
      const double before = now - turn;
      const float target = sweep_depth_ * kit::SineTable::lookup(static_cast<float>(now - std::floor(now)));
      const float from =
          sweep_depth_ * kit::SineTable::lookup(static_cast<float>(before - std::floor(before)));
      sweep_step_[n] = (target - from) * (1.0f / kControlPeriod);
      sweep_[n] = from;
      for (int k = 0; k < within; ++k) sweep_[n] += sweep_step_[n];
    }
  }

  // Everything at its target now: at init, and when the device wakes.
  void settle() {
    using namespace haze;
    kit::Smoother* all[] = {&drive_, &width_, &width_gain_, &dry_, &wet_};
    for (kit::Smoother* s : all) s->snap(s->target);
    reach_.value = reach_.target;
    size_.value = size_.target;
    octave_.snap(octave_.target);
    decay_.snap(1.0f / param(kDecay));
    tone_.snap(param(kTone));
    derive(1.0f / decay_.value, tone_.value);
    for (int n = 0; n < kLines; ++n) {
      gain_[n] = gain_to_[n];
      gain_step_[n] = 0.0f;
    }
    late_.snap(late_.target);
    early_.snap(early_.target);
    thin_.snap(thin_.target);
    loop_.snap(loop_.target);
    back_gain_.snap(back_gain_.target);
    set_sweeps(samples_ / kControlPeriod, static_cast<int>(samples_ & (kControlPeriod - 1)));
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
        // The two sides of the wall are unlike, so their middle alone has half
        // their power: a narrower wall is raised to stay as loud.
        width_gain_.set(std::sqrt(2.0f / (1.0f + value * value)), primed());
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
  float sweep_[kLines] = {};
  float sweep_step_[kLines] = {};
  float sweep_depth_ = 0.0f;
  kit::Svf low_cut_[2];
  kit::Svf early_low_[2];
  kit::OnePole feed_cut_[2];
  kit::Hilbert shifter_[2];
  double shift_turn_[2] = {};
  float back_[2] = {};

  kit::Smoother drive_, loop_, back_gain_, width_, width_gain_, dry_, wet_, late_, early_, thin_;
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
