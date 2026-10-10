#pragma once

// Haze: a short reverb into a soft fuzz into a long reverb.
//
//   in ─┬───────────────────────────────────────────────────────────── dry ─┐
//       ▼                                                                   │
//      (+)─┬──────────────── direct ───────┐                                │
//       ▲  └─► 5 allpasses in a loop ─ smear ┴─ Blur ─► low-pass ─► FUZZ ─► Tone ─┐   │
//       │       (the first, short reverb)                                   │   │
//       │   ┌───────────────────────────────────────────────────────────────┘   │
//       │   ▼                                                                   │
//       │  2 allpasses ─┬──────────────────── early ─────────────┐              │
//       │               ▼                                        ▼              ▼
//       │              (+)─► 8 modulated delay lines ─┬─► taps ─(+)─► low cut ─► width ─► Mix ─► out
//       │               ▲                             │
//       │               └─ damping ◄─ decay gain ◄─ Hadamard     (the wall)
//       │                                             │
//       └── Feed ◄── shift up 3 Hz ◄── low cut ◄──────┘
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
//   again when Octave moves). So Haze adds overtones and not loudness, an
//   attack that outruns the level is squashed instead of spat out, and
//   nothing leaves the fuzz louder than the level that went in.
// - The floor (-40 dBFS) is what keeps quiet tails smooth: under it the
//   division stops growing, so the push into the curve falls with the level
//   and the fuzz hands a fading tail over to a clean path of gain exactly 1.
//   There is no gate and nothing is amplified.
// - Octave folds the wave before the curve (a soft rectifier with its mean
//   taken off), which is where an octave fuzz gets the octave above: folded
//   after the curve, a hard-driven wave would have nothing left to fold.
// - Blur crossfades (equal power) from the sound itself to the first reverb:
//   five allpasses with their output fed back to their input, longer as Blur
//   rises (to about 1.6 s). An allpass delays energy by its length, so the
//   smear swells in over a tenth of a second: the attacks are gone before the
//   fuzz sees them.
// - The wall is an eight-line feedback delay network (Hadamard), its lines
//   20 to 160 ms by Size, read with a slow free-running sweep each. Its wet
//   level is lowered as Decay rises so that Decay is not also a volume knob.
// - Feed returns the wall to the front, moved up by a few Hz on the way
//   (a single-sideband shift, 2.3 Hz on the left and 3.1 Hz on the right).
//   Without the shift the loop howls: one resonance of the wall feeds itself
//   and a single tone holds for good. With it, what returns never lands on
//   the frequency it left, so the loop's gain is the average over the wall's
//   resonances and not the highest of them, and what is heard is a beat
//   between the wall and what it sent round, and at the top of Feed a
//   cluster that leans sharp. The returned share is worked out from the
//   wall's own loss: at the top of Feed two thirds of what the wall loses
//   comes back, the fuzz is fed nearly twice as much by the wall as by the
//   input, and the tail is about three times as long. The loop loses on every
//   pass, and the fuzz cannot put out more than full scale, which is the
//   ceiling.
// - The sweeps run by a count of samples that goes on through silence and
//   sleep, so the output is the same at every block size.
//
// Storage: eight lines of 16384 samples, fourteen allpasses and two loop delays
// of 4096 (sized for 96 kHz), the oversampling filters: about 0.8 MB.

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

    for (int c = 0; c < 2; ++c) {
      for (int a = 0; a < kBlurStages; ++a) {
        blur_allpass_[c][a].clear();
        blur_length_[c][a] =
            kit::clamp_int(static_cast<int>(kBlurAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
      blur_loop_[c].clear();
      blur_loop_length_[c] =
          kit::clamp_int(static_cast<int>(kBlurLoopDelay[c] * scale), 1, kSmallSize - 1);
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
      feed_cut_[c].reset();
      feed_cut_[c].set_cutoff(kLowCutHz, sr);
      shifter_[c].reset();
      back_[c] = 0.0f;
    }
    // One trip: the allpasses delay energy by their lengths, then the loop's delay.
    blur_seconds_ = kBlurLoopDelay[0] / 48000.0f;
    for (int a = 0; a < kBlurStages; ++a) blur_seconds_ += kBlurAllpass[0][a] / 48000.0f;
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      damping_[n].reset();
      length_[n] = kLineSeconds[n] * sr;
      gain_[n] = 0.0f;
      sweep_[n] = 0.0f;
      sweep_step_[n] = 0.0f;
    }
    power_[0] = 0.0f;
    power_[1] = 0.0f;
    level_coeff_ = 1.0f - kit::time_to_coeff(kLevelSeconds, sr);
    fold_coeff_ = 1.0f - kit::time_to_coeff(1.0f / (kit::kTwoPi * kFoldMeanHz), sr);
    sweep_depth_ = kSweepSeconds * sr;
    shift_turn_[0] = static_cast<double>(kFeedShiftHz[0]) / sr;
    shift_turn_[1] = static_cast<double>(kFeedShiftHz[1]) / sr;

    kit::Smoother* fast[] = {&drive_, &direct_, &smear_, &loop_,       &back_gain_,
                             &width_, &dry_,    &wet_,   &width_gain_, &level_};
    for (kit::Smoother* s : fast) s->set_time(kSmoothingSeconds, sr);
    octave_.set_time(kSmoothingSeconds, sr);
    // Size moves read points: it glides slowly enough to bend, not zip.
    size_.set_time(0.15f, sr);
    // Stepped on the control clock.
    decay_.set_time(0.02f, sr / kControlPeriod);
    tone_.set_time(0.02f, sr / kControlPeriod);

    samples_ = 0;
    table_fold_ = -1.0f;
    push_ = 0.0f;
    wall_ = 0.0f;
    // The longest silent gap: one trip through the blur loop and the longest line.
    idle_.reset(sr, 0.6f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: 0, how
  // far up the fuzz's curve the peaks of the sound reach now, in the curve's
  // own input units (the drive times the level's share of level + floor);
  // 1, the peak of the wall as it leaves (before Mix), falling back over a
  // tenth of a second. Both are 0 at rest and asleep.
  float meter(int index) const {
    if (idle_.asleep()) return 0.0f;
    if (index == 0) return push_;
    if (index == 1) return wall_;
    return 0.0f;
  }

  void process(int frames) {
    using namespace haze;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      samples_ += static_cast<uint64_t>(frames);  // the sweeps' clock runs on
      return;
    }
    // Nothing is sounding: whatever moved while asleep applies at once, and
    // the sweeps stand where the clock has them.
    if (was_asleep) settle();
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    float wall_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if ((samples_ & (kControlPeriod - 1)) == 0) control();
      ++samples_;

      // The first reverb, and the blend of it with the sound itself.
      const float direct = glide(direct_);
      const float smear = glide(smear_);
      const float loop = glide(loop_);
      const float back_gain = glide(back_gain_);
      float pre[2];
      for (int c = 0; c < 2; ++c) {
        const float x = safe(in[c]) + back_gain * back_[c];
        float s = x + loop * blur_loop_[c].read(blur_loop_length_[c]);
        for (int a = 0; a < kBlurStages; ++a) {
          s = blur_allpass_[c][a].process(s, blur_length_[c][a], kBlurDiffusion);
        }
        blur_loop_[c].write(flush_denormal(s));
        pre[c] = pre_filter_[c].lowpass(direct * x + smear * s);
      }

      // The level, taken out before the curve and put back after it.
      power_[0] = flush_denormal(power_[0] + level_coeff_ * (pre[0] * pre[0] - power_[0]));
      power_[1] = flush_denormal(power_[1] + level_coeff_ * (pre[1] * pre[1] - power_[1]));
      // As a sine's peak: √2 times the RMS of the louder side. (The mean of
      // the louder sample of the two would read two sides of equal power
      // 2 dB high, and the fuzz would give that back as gain.)
      const float level = std::sqrt(2.0f * (power_[0] > power_[1] ? power_[0] : power_[1]));
      const float sum = level + kFloor;
      const float norm = 1.0f / sum;
      const float drive = glide(drive_);
      const float push = drive * level * norm;
      const float post = kit::min(sum, kCeiling) * hold(push) / drive;
      const float fold = octave_.next();
      const float keep = 1.0f - fold;

      float feed[2];
      for (int c = 0; c < 2; ++c) {
        float pair[2];
        outer_[c].up(pre[c] * norm, &pair[0], &pair[1]);
        float mean = fold_mean_[c];
        float half[2];
        for (int k = 0; k < 2; ++k) {
          float p, q;
          inner_[c].up(pair[k], &p, &q);
          p = curve(p, drive, keep, fold, &mean);
          q = curve(q, drive, keep, fold, &mean);
          half[k] = inner_[c].down(p, q);
        }
        fold_mean_[c] = mean;
        float y = dc_[c].process(outer_[c].down(half[0], half[1])) * post;

        // Tone: a tilt about 1 kHz and a low-pass that opens with it.
        const float low = tilt_[c].lowpass(y);
        y = tone_filter_[c].lowpass(tilt_low_ * low + tilt_high_ * (y - low));

        y = input_allpass_[c][0].process(y, input_length_[c][0], kInputDiffusion);
        y = input_allpass_[c][1].process(y, input_length_[c][1], kInputDiffusion);
        feed[c] = 0.5f * y;
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
        const float x = damping_[n].lowpass(v[n] * gain_[n]) + ((n & 2) ? -feed[n & 1] : feed[n & 1]);
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

      const float wet_left = low_cut_[0].highpass(lines_left + feed[0]);
      const float wet_right = low_cut_[1].highpass(lines_right + feed[1]);
      const float gain = glide(level_) * glide(width_gain_);
      const float mid = 0.5f * (wet_left + wet_right) * gain;
      const float side = 0.5f * (wet_left - wet_right) * glide(width_) * gain;
      // Exact up to ±1 and landing on ±2: the wall never leaves more than
      // 6 dB over full scale, whatever is held into it for however long.
      const float wall_left = 2.0f * kit::soft_clip(0.5f * (mid + side));
      const float wall_right = 2.0f * kit::soft_clip(0.5f * (mid - side));
      const float l = wall_left < 0.0f ? -wall_left : wall_left;
      const float r = wall_right < 0.0f ? -wall_right : wall_right;
      if (l > wall_peak) wall_peak = l;
      if (r > wall_peak) wall_peak = r;
      push_ = push;

      const float wet = glide(wet_);
      const float dry = glide(dry_);
      out_left_[i] = in[0] * dry + wall_left * wet;
      out_right_[i] = in[1] * dry + wall_right * wet;
    }
    // For meter() only: the wall's peak, falling back over a tenth of a second.
    const float fall = 1.0f - static_cast<float>(frames) / (kMeterFallSeconds * sample_rate());
    wall_ *= fall > 0.0f ? fall : 0.0f;
    if (wall_peak > wall_) wall_ = wall_peak;
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kLines = 8;
  static constexpr int kLineSize = 16384;  // 162 ms at 96 kHz plus the sweep
  static constexpr int kSmallSize = 4096;  // 37.5 ms at 96 kHz
  static constexpr int kBlurStages = 5;
  static constexpr int kInputStages = 2;
  static constexpr int kControlPeriod = 32;  // a power of two: the tick is a mask of the sample count
  static constexpr int kTableSize = 33;
  static constexpr int kTablePoints = 24;

  // Haze 0..1 is the drive into the curve, on a scale of equal ratios.
  static constexpr float kDriveMin = 0.25f;
  static constexpr float kDriveMax = 6.0f;
  // The level under which the push into the curve falls away (-40 dBFS),
  // and the most the fuzz puts the level back to.
  static constexpr float kFloor = 0.01f;
  static constexpr float kCeiling = 1.0f;
  static constexpr float kLevelSeconds = 0.025f;
  // The fold: sqrt(x² + s²) − s, its mean followed at 15 Hz, twice as loud as
  // the wave it replaces; Octave 1 leaves 15 % of the wave itself.
  static constexpr float kFoldSoft = 0.05f;
  static constexpr float kFoldGain = 2.0f;
  static constexpr float kFoldMost = 0.85f;
  static constexpr float kFoldMeanHz = 15.0f;
  static constexpr double kInnerBeta = 10.0;
  static constexpr float kPreFilterHz = 5000.0f;
  static constexpr float kDcHz = 20.0f;
  // Tone 0..1: the low-pass from 800 Hz to 12 kHz, and the tilt about 1 kHz
  // from +3 dB of lows and -6 dB of highs to the reverse.
  static constexpr float kTiltHz = 1000.0f;
  static constexpr float kToneLowHz = 800.0f;
  static constexpr float kToneHighHz = 12000.0f;
  static constexpr float kTiltLowDb = 3.0f;
  static constexpr float kTiltHighDb = 6.0f;
  // The first reverb: allpass lengths in samples at 48 kHz (7 to 37 ms, 97 ms
  // in all), the delay that closes its loop, the allpass coefficient, and the
  // loop's gain at Blur 1.
  static constexpr float kBlurAllpass[2][kBlurStages] = {{337.0f, 521.0f, 811.0f, 1259.0f, 1733.0f},
                                                         {359.0f, 547.0f, 853.0f, 1193.0f, 1801.0f}};
  static constexpr float kBlurLoopDelay[2] = {1109.0f, 1151.0f};
  static constexpr float kBlurDiffusion = 0.65f;
  static constexpr float kBlurLoop = 0.6f;
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
  static constexpr float kLowCutHz = 90.0f;
  // Each line's read point sweeps ±0.6 ms at 0.23 Hz and up, 0.09 Hz apart.
  static constexpr float kSweepSeconds = 0.0006f;
  static constexpr float kSweepHz = 0.23f;
  static constexpr float kSweepStepHz = 0.09f;
  // A line holds 1/(1 - g²) of the power fed to it and a side taps a quarter
  // of what all eight hold: kLineShare. Feed returns kFeedShare of the wall's
  // loss at its top, which makes the tail 1 / (1 - kFeedShare) as long
  // (measured: 2.2 to 3.2 times).
  static constexpr float kLineShare = 0.25f;
  static constexpr float kWetGain = 1.12f;
  static constexpr float kFeedShare = 0.65f;
  static constexpr float kFeedMost = 0.9f;
  // What Feed returns is moved up in frequency on the way, by a little less
  // on the left than on the right, so that no resonance of the wall or of the
  // first reverb can feed itself. Both sides go the same way: with one up and
  // one down the sound wandered about a resonance and stayed (measured: a
  // tone near 176 Hz held at -8 dBFS for good at the top of Feed). And far
  // enough to leave a resonance of the first reverb in a pass or two: at
  // 0.7 and 1.1 Hz the tail at the top of Feed was four to five times as
  // long and a third of its power was one tone; at these it is as long as
  // the share says and no more one tone than with no Feed at all.
  static constexpr float kFeedShiftHz[2] = {2.3f, 3.1f};
  static constexpr float kMeterFallSeconds = 0.1f;

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

  // What the wet path takes of an input sample: NaN is silence, and nothing
  // beyond ±8 goes in, so a bad sample cannot lodge in a loop.
  static float safe(float x) {
    if (x > -8.0f && x < 8.0f) return x;
    return x >= 8.0f ? 8.0f : (x <= -8.0f ? -8.0f : 0.0f);
  }

  // The curve at four times the rate: the wave `q` (level taken out, peaks
  // near 1), part of it folded for the octave, driven into tanh.
  float curve(float q, float drive, float keep, float fold, float* mean) const {
    const float folded = std::sqrt(q * q + kFoldSoft * kFoldSoft) - kFoldSoft;
    *mean += fold_coeff_ * (folded - *mean);
    return kit::fast_tanh(drive * (keep * q + fold * kFoldGain * (folded - *mean)));
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

  // Every 32 samples: the wall's gains from Decay and Size, the wet level and
  // the share Feed returns, Tone's filters, the hold table, the sweeps.
  void control() {
    using namespace haze;
    derive(decay_.next(), tone_.next());
    set_sweeps(samples_ / kControlPeriod, 0);
  }

  void derive(float decay, float tone) {
    using namespace haze;
    const float sr = sample_rate();
    const float size = size_.value;
    for (int n = 0; n < kLines; ++n) {
      // The gain that takes Decay to fall 60 dB, and a one-pole on top of it
      // that takes kDampingRatio of Decay at the top of the band (Jot's
      // absorbent filter: unity at the bottom, so Decay is the time there).
      const float exponent = -3.0f * length_[n] * size / (decay * sr);  // log10 of the gain
      gain_[n] = std::pow(10.0f, exponent);
      damping_[n].a = kit::min(kDampingSlope * exponent, kDampingMost);
    }
    const float middle = gain_[kLines / 2];
    const float loss = kit::max(1.0f - middle * middle, 1.0e-4f);
    // Feed: the gain on what returns, for the share of the wall's loss it is
    // to make good, and never over kFeedMost (a short Decay loses nearly all
    // it has each pass, and making that good would be a loop of its own).
    const float feed = param(kFeed);
    const float back = feed * kit::min(std::sqrt(kFeedShare * loss / kLineShare), kFeedMost);
    const float share = back * back * kLineShare / loss;
    back_gain_.set_target(back);
    // A side of the wall holds kLineShare / loss of the power fed to it and
    // passes a quarter straight through (the early part); Feed makes it hold
    // 1 / (1 - share) as much. All of that is taken back, so a held sound
    // leaves the wall as loud as it left the fuzz whatever Decay and Feed are.
    //
    // Tone's tilt only ever takes away on the way into the wall, and what its
    // louder side would have added is put back here, after the wall: Feed's
    // loop runs through the tilt, and a tilt that added 6 dB to one side of
    // 1 kHz made the loop's gain there more than one (measured: at the top
    // of Feed and of Tone the tail never fell).
    const float tilt_low = kit::db_to_gain((1.0f - 2.0f * tone) * kTiltLowDb);
    const float tilt_high = kit::db_to_gain((2.0f * tone - 1.0f) * kTiltHighDb);
    const float tilt_most = kit::max(tilt_low, tilt_high);
    tilt_low_ = tilt_low / tilt_most;
    tilt_high_ = tilt_high / tilt_most;
    level_.set_target(kWetGain * tilt_most *
                      std::sqrt((1.0f - share) * loss / (kLineShare * (1.0f + loss))));

    // The first reverb rings no longer than the wall: its loop's gain is
    // Blur's, held under the gain that would take Decay to die away.
    const float loop = kit::min(kBlurLoop * param(kBlur), kit::rt60_gain(blur_seconds_ * sr, decay, sr));
    loop_.set_target(loop);
    // The loop holds 1 / (1 - loop²) of the power it is fed.
    smear_.set_target(smear_share_ * std::sqrt(1.0f - loop * loop));

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
      sweep_[n] = from + sweep_step_[n] * static_cast<float>(within);
    }
  }

  // Everything at its target now: at init, and when the device wakes.
  void settle() {
    using namespace haze;
    kit::Smoother* all[] = {&drive_, &direct_, &width_, &width_gain_, &dry_, &wet_, &size_};
    for (kit::Smoother* s : all) s->snap(s->target);
    octave_.snap(octave_.target);
    decay_.snap(param(kDecay));
    tone_.snap(param(kTone));
    derive(decay_.value, tone_.value);
    level_.snap(level_.target);
    loop_.snap(loop_.target);
    smear_.snap(smear_.target);
    back_gain_.snap(back_gain_.target);
    set_sweeps(samples_ / kControlPeriod, static_cast<int>(samples_ & (kControlPeriod - 1)));
  }

  void apply(int id) {
    using namespace haze;
    const float value = param(id);
    switch (id) {
      case kHaze:
        drive_.set(kDriveMin * std::pow(kDriveMax / kDriveMin, value), primed());
        break;
      case kBlur: {
        float direct, smear;
        kit::equal_power(value, &direct, &smear);
        if (value >= 1.0f) direct = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        direct_.set(direct, primed());
        smear_share_ = smear;  // the loop and the smear's gain follow on the control clock
        break;
      }
      case kDecay:
        decay_.set(value, primed());
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;
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
  int blur_length_[2][kBlurStages] = {};
  kit::DelayLine<kSmallSize> blur_loop_[2];
  int blur_loop_length_[2] = {};
  kit::OnePole pre_filter_[2];
  float power_[2] = {};  // mean square of each side into the fuzz
  float level_coeff_ = 0.0f;
  kit::Halfband2x outer_[2];
  haze_dsp::Halfband<8> inner_[2];
  float smear_share_ = 0.0f;   // Blur's share of the smear, before the loop's gain is taken off
  float blur_seconds_ = 0.12f;  // one trip round the first reverb
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
  float sweep_[kLines] = {};
  float sweep_step_[kLines] = {};
  float sweep_depth_ = 0.0f;
  kit::Svf low_cut_[2];
  kit::OnePole feed_cut_[2];
  kit::Hilbert shifter_[2];
  double shift_turn_[2] = {};
  float back_[2] = {};

  kit::Smoother drive_, direct_, smear_, loop_, back_gain_, width_, width_gain_, dry_, wet_, level_, size_;
  kit::LinearRamp octave_;
  kit::Smoother decay_, tone_;  // stepped on the control clock
  kit::IdleGate idle_;
  uint64_t samples_ = 0;  // since init, asleep or not
  // For meter() only: never read by the sound.
  float push_ = 0.0f;
  float wall_ = 0.0f;
};

}  // namespace livemix
