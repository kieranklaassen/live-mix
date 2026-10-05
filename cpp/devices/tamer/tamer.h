#pragma once

// Tamer: an ear that finds whatever stands out of the bed of sound around it,
// tone by tone as it happens, and turns exactly that down.
//
//   in ─┬──────────────────────────────► up to 48 narrow cuts ─┬─► out
//       │                                        ▲             │
//       │                                        │ gain per    └─► in − out (Listen)
//       │                                        │ band
//       ├─► FFT 4096 ─► bands under 1.6 kHz ─┐   │
//       └─► FFT 1024 ─► bands above ─────────┴─► compare ─► hold ─► solve
//
// The audio only ever passes peaking filters that cut, so there is no
// latency, the output is never louder than the input at any frequency, and
// with nothing to cut the output is the input, sample for sample. The two
// FFTs are a side path that listens.
//
// Bands. From 30 Hz to 20 kHz (or 0.45 of the sample rate), a twelfth of an
// octave wide where the analysis can tell that apart and, below that (394 Hz
// at 48 kHz), two bins of the long transform wide (23 Hz at 48 kHz): about
// 83 bands. A band's level is the power in its bins of both channels per
// octave of width, so pink noise reads the same in every band.
//
// - Bands at least two bins of the short transform wide (from 1.6 kHz at
//   48 kHz) are judged from 1024 points, Hann, every 256 samples, left and
//   right taking turns: 21 ms of sound, so they answer fast. Their power is
//   smoothed over 40 ms.
// - The bands below are judged from 4096 points, Hann, every 1024 samples,
//   left and right taking turns. Their power is smoothed over 120 ms.
// - Each transform reads every band, not only its own: a band is judged in
//   the view of the transform that answers for it, its sides and all. The
//   two take different times to fill and to forget, so a level from one set
//   against a level from the other would read a start or a stop as a peak.
// - A transform and the comparing never land in the same 64 samples.
//
// Compare, every 256 samples:
//
// - Sharpness sets a width, an octave at 0 and a twelfth at 1. Every band's
//   level is the mean over that width around it.
// - What a band stands out of is the sound on both sides: the octave below
//   and the octave above, starting the width and a twelfth away. Each side
//   speaks with one level: the middle one of its tops, the bands no quieter
//   than both their neighbours (those within 30 dB of its loudest; of two
//   middle ones, the lower). In a bed of noise that is the bed, a little
//   high; one more loud tone in the octave does not move it, so two tones do
//   not hide each other; and among the partials of a note it is a partial.
//   A side with no top, a slope, speaks with the level that seven in ten of
//   its bands lie under.
// - The excess is the band's level over the mean of the two sides, in dB (a
//   tilt cancels), less a margin of 4 dB at Depth 0 falling to 1 dB at 1.
//   Only 24 dB of it counts.
// - There has to be a bed to stand out of. How far a side's dips lie under
//   its tops, band by band whatever the width, tells a bed from bare notes:
//   noise dips a few dB, and between the partials of clean notes there is
//   next to nothing. The cut fades out as the deeper side's dips go from
//   4 dB to 8, so a note played over other notes is not taken for a peak.
// - The bed has to last: 0.15 s under the long transform, 0.05 s under the
//   short, with the mean power of each side within 36 dB of the band. A
//   transform takes its length to fill, and while a sound that starts at
//   once is filling it, what it spills reads as a bed; so does the knock a
//   note starts with. (A bed changes slowly and reading it is the dearest
//   thing here, so each comparison reads it for every fourth band.)
// - A band more than 36 dB above either side stands out of nothing: it is the
//   sound itself, and is left alone. From 24 dB the cut fades out. Nor is a
//   band a peak of its own while one between it and its sides is louder:
//   3 dB under that one it is its slope, or what a loud tone spills into the
//   bands next to it.
// - A band with fewer than two bands below it to compare with (under about
//   90 Hz) is never cut, and one with none above lets the lower side speak
//   for both.
// - The cut asked for is Depth times the excess, 18 dB at most, and only
//   between From and To (fading over a third of an octave outside).
// - The cut held moves towards that with Time going down and four times
//   Time coming back.
//
// Solve. Every band has a peaking filter at its centre, twice as wide as
// Sharpness's width (or as the band, where that is wider), so that a tone at
// the edge of what the filter answers for still gets four fifths of the cut.
// Only the bands holding a cut take part, and since only the top of a peak
// holds one they are few: 48 at most, and with that many held a new cut
// waits. Their gains are worked out together (projected Gauss-Seidel, four
// sweeps on from the last comparison's answer, each filter's skirt taken as
// 1 / (1 + Q²(r − 1/r)²) of its depth), so that where two overlap the sum is
// the cut held, and no filter ever boosts.
//
// Each gain is ramped across the 256 samples to the next comparison and its
// filter redesigned every 64, the same on both channels so the image does not
// move. A filter at 0 dB is skipped.
//
// Listen swaps the output for what is taken away: the input less the output.
//
// meter(0) is the deepest cut in force, in dB. Meters 1 to 12 are for the
// display: the cut at 48 points from 40 Hz to 20 kHz.
//
// Asleep nothing is sounding, so the filters, the band powers, the cuts and
// the FFTs' input are cleared: waking is the same as starting.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Tamer : public kit::DeviceBase<tamer::kNumParams> {
 public:
  static constexpr int kLongFrame = 4096;
  static constexpr int kShortFrame = 1024;
  static constexpr int kMaxBands = 96;
  static constexpr int kDisplayPoints = 48;
  static constexpr float kDisplayFromHz = 40.0f;
  static constexpr float kDisplayToHz = 20000.0f;

  void init(float sample_rate) {
    using namespace tamer;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    long_fft_.init();
    short_fft_.init();
    const double turn = 2.0 * 3.14159265358979323846;
    for (int n = 0; n < kLongFrame; ++n) {
      long_window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(turn * n / kLongFrame));
    }
    for (int n = 0; n < kShortFrame; ++n) {
      short_window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(turn * n / kShortFrame));
    }
    lay_out_bands(sr);
    const float looks_per_second = sr / kLookPeriod;
    short_coeff_ = kit::time_to_coeff(kShortSeconds, looks_per_second);
    long_coeff_ = kit::time_to_coeff(kLongSeconds, looks_per_second);
    width_coeff_ = kit::time_to_coeff(kWidthSeconds, looks_per_second);
    long_stay_ = kit::clamp_int(static_cast<int>(kLongStay * looks_per_second + 0.5f), 1, 1 << 20);
    short_stay_ =
        kit::clamp_int(static_cast<int>(kShortStay * looks_per_second + 0.5f), 1, long_stay_);
    listen_.set_time(kSmoothingSeconds, sr);
    // The longest ring here is the lowest filter's: under 0.1 s to -60 dB.
    idle_.reset(sr, kHoldSeconds);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by meters[index] in device.json. 0 is the deepest cut
  // in force right now, in dB (0 or below). 1 to 12 are for the display, which
  // draws the cut at 48 points spaced evenly in pitch from 40 Hz to 20 kHz:
  // four points to a reading, each six bits of a whole number (the lowest
  // point in the lowest bits), which a float holds exactly (2^24).
  //
  // A cut is in half decibels, read off the filters as they stand: the sum of
  // every live filter's skirt at that point, by the rule the gains were
  // solved with.
  float meter(int index) const {
    if (index == 0) return deepest_;
    if (index < 1 || index > kCutReadings) return 0.0f;
    const int first = (index - 1) * kPointsPerReading;
    int packed = 0;
    for (int p = first + kPointsPerReading - 1; p >= first; --p) {
      float db = 0.0f;
      for (int n = 0; n < live_count_; ++n) {
        const int k = live_bands_[n];
        db -= gain_[k].value * skirt(display_hz_[p] / centre_hz_[k], q_[k]);
      }
      packed = packed * kSteps + kit::clamp_int(static_cast<int>(2.0f * db + 0.5f), 0, kSteps - 1);
    }
    return static_cast<float>(packed);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float x[2];
      take_input(i, &x[0], &x[1]);
      // A NaN or runaway sample would otherwise stay in every filter it met.
      for (int c = 0; c < 2; ++c) {
        if (!(x[c] > -kSaneInput && x[c] < kSaneInput)) x[c] = 0.0f;
      }

      ring_[0][position_ & kRingMask] = x[0];
      ring_[1][position_ & kRingMask] = x[1];
      const uint32_t phase = position_ & (kLookPeriod - 1);
      if (phase == 0) analyse_short((position_ / kLookPeriod) & 1);
      if (phase == 192) look();
      if ((position_ & (kLongHop - 1)) == 64) analyse_long((position_ >> kLongHopBits) & 1);
      if ((position_ & (kTick - 1)) == 0) update_filters();

      float y[2] = {x[0], x[1]};
      for (int n = 0; n < live_count_; ++n) {
        const int k = live_bands_[n];
        y[0] = filter_[0][k].process(y[0]);
        y[1] = filter_[1][k].process(y[1]);
      }
      ++position_;

      // Listen: all the way over, the input less the output.
      const float taken = listen_.next();
      if (taken == 0.0f) {
        out_left_[i] = y[0];
        out_right_[i] = y[1];
      } else {
        out_left_[i] = y[0] + taken * (x[0] - 2.0f * y[0]);
        out_right_[i] = y[1] + taken * (x[1] - 2.0f * y[1]);
      }
    }
    idle_.settle(output_peak(frames), frames);
    if (idle_.asleep()) rest();
  }

 private:
  static constexpr uint32_t kRingMask = kLongFrame - 1;
  static constexpr int kLookPeriod = 256;  // samples between comparisons, and the short hop
  static constexpr int kLongHop = 1024;    // one channel's long transform
  static constexpr int kLongHopBits = 10;
  static constexpr int kTick = 64;         // samples between filter updates
  static constexpr int kTicksPerLook = kLookPeriod / kTick;
  static_assert((1 << kLongHopBits) == kLongHop, "the channels take turns by this bit");
  // How meter() packs the display's points.
  static constexpr int kPointsPerReading = 4;
  static constexpr int kCutReadings = kDisplayPoints / kPointsPerReading;
  static constexpr int kSteps = 64;
  static_assert(kCutReadings * kPointsPerReading == kDisplayPoints, "whole readings");

  static constexpr float kFirstHz = 30.0f;
  static constexpr float kTopHz = 20000.0f;
  static constexpr float kTopOfRange = 0.45f;  // of the sample rate
  static constexpr float kTwelfth = 1.0f / 12.0f;
  static constexpr float kSaneInput = 64.0f;  // +36 dBFS; beyond it is a fault upstream
  static constexpr float kHoldSeconds = 0.3f;
  static constexpr float kShortSeconds = 0.04f;
  static constexpr float kLongSeconds = 0.12f;
  static constexpr float kWidthSeconds = 0.12f;  // Sharpness glides over this
  static constexpr float kLongStay = 0.15f;      // seconds of sound round a band make it a bed
  static constexpr float kShortStay = 0.05f;     // the same under the short transform
  static constexpr float kSideOctaves = 1.0f;    // how far each side is heard
  static constexpr float kShare = 0.7f;          // of a side's bands lie under its level
  static constexpr float kTopsWithinDb = 30.0f;  // of a side's loudest top: the tops that count
  static constexpr int kMaxSide = 24;            // bands a side can hold
  static constexpr float kMarginAtZero = 4.0f;   // dB, at Depth 0
  static constexpr float kMarginAtFull = 1.0f;   // and at Depth 1
  static constexpr float kMaxExcessDb = 24.0f;
  static constexpr float kMaxCutDb = 18.0f;
  static constexpr float kLoneFromDb = 24.0f;  // above a side: the cut starts to fade
  static constexpr float kLoneDb = 36.0f;      // and is gone
  static constexpr float kLoneRatio = 3981.0717f;  // 36 dB as a power ratio
  static constexpr float kTopDb = 3.0f;        // under a louder neighbour: no peak of its own
  static constexpr float kBedDb = 4.0f;        // a side that dips no more than this is a bed
  static constexpr float kBareDb = 8.0f;       // and one that dips this much is bare notes
  static constexpr float kBedShare = 0.4f;     // of a new reading of the bed in what the cut goes by
  static constexpr int kBedTurns = 4;          // comparisons between two readings of a band's bed
  static constexpr float kQuiet = 1.0e-9f;     // -90 dB per octave
  static constexpr float kQuietDb = -90.0f;
  static constexpr float kFloor = 1.0e-12f;
  static constexpr float kEdgeOctaves = 1.0f / 3.0f;  // From and To fade over this
  static constexpr float kFilterWidths = 2.0f;  // a filter's width over what it answers for
  static constexpr int kMaxActive = 48;  // cuts held at once
  static constexpr int kSweeps = 4;
  static constexpr float kReleaseRatio = 4.0f;
  // A cut closer to 0 dB than this with nothing asking for it is let go, so
  // the band's filter can be skipped. The last step is ramped like any other.
  static constexpr float kLetGoDb = 0.01f;

  static constexpr float kFloorDb = -120.0f;  // 10 log10(kFloor)

  // Every band as one transform hears it. A band is judged in the view of the
  // transform that answers for it, its sides and all: the two transforms take
  // different times to fill and to forget, so a level from one set against a
  // level from the other would read a start or a stop as a peak.
  struct View {
    int first_bin[kMaxBands] = {};
    int last_bin[kMaxBands] = {};
    float octaves_before[kMaxBands + 1] = {};  // running sum of what those bins cover
    float energy[2][kMaxBands] = {};           // the newest frame, per channel
    float power[kMaxBands] = {};               // both channels, smoothed
    float power_before[kMaxBands + 1] = {};
    float density[kMaxBands] = {};   // mean power per octave over the width
    float level_db[kMaxBands] = {};  // the same in dB
    bool top[kMaxBands] = {};        // no quieter than both its neighbours
    float own_db[kMaxBands] = {};    // the band by itself, whatever the width, in dB
    bool own_top[kMaxBands] = {};
  };
  static constexpr int kSlow = 0;  // the long transform's view
  static constexpr int kFast = 1;  // the short one's

  // The view band k is judged in.
  const View& own(int k) const { return view_[k < first_short_ ? kSlow : kFast]; }

  // What a peaking filter of quality q does at r times its centre, as a share
  // of its depth in dB: exact for a shallow one, a little wide for a deep one.
  static float skirt(float r, float q) {
    const float d = q * (r - 1.0f / r);
    return 1.0f / (1.0f + d * d);
  }

  // True when a new value should glide: once a block has run and while the
  // device is awake. Asleep there is nothing sounding to glide.
  bool gliding() const { return primed() && !idle_.asleep(); }

  // Sharpness as a width in octaves: 1 at 0, a twelfth at 1.
  static float width_for(float sharpness) { return std::exp2(-sharpness * 3.5849625f); }

  void apply(int id) {
    using namespace tamer;
    if (id == kListen) {
      listen_.set(param(kListen) >= 0.5f ? 1.0f : 0.0f, gliding());
    } else if (id == kSharpness && !gliding()) {
      width_ = width_for(param(kSharpness));
    }
    // The rest is read at each comparison.
  }

  // Band edges, centres and the bins each band sums, for this sample rate.
  void lay_out_bands(float sr) {
    const float long_bin = sr / kLongFrame;
    const float short_bin = sr / kShortFrame;
    const float top = kit::min(kTopHz, kTopOfRange * sr);
    // A full-scale sine in both channels reads 1: Hann² sums to 3/8 of the
    // frame, a sine puts a quarter of its N·Σw² into the positive bins, and
    // the two channels are averaged.
    long_scale_ = 16.0f / (3.0f * static_cast<float>(kLongFrame) * static_cast<float>(kLongFrame));
    short_scale_ =
        16.0f / (3.0f * static_cast<float>(kShortFrame) * static_cast<float>(kShortFrame));
    num_bands_ = 0;
    first_short_ = kMaxBands;
    float lo = kFirstHz;
    while (num_bands_ < kMaxBands) {
      const int k = num_bands_;
      const float width = kit::max(lo * (std::exp2(kTwelfth) - 1.0f), 2.0f * long_bin);
      const float hi = lo + width;
      if (hi > top) break;
      const bool is_short = k >= first_short_ || width >= 2.0f * short_bin;
      if (is_short && first_short_ == kMaxBands) first_short_ = k;
      const float bin = is_short ? short_bin : long_bin;
      // The bins whose centre lies in [lo, hi): at least one, and never one
      // the band below has taken.
      int first = static_cast<int>(std::ceil(lo / bin));
      int last = static_cast<int>(std::ceil(hi / bin)) - 1;
      if (first < 1) first = 1;
      if (k > 0 && k != first_short_ && first <= view_[is_short ? kFast : kSlow].last_bin[k - 1]) {
        first = view_[is_short ? kFast : kSlow].last_bin[k - 1] + 1;
      }
      if (last < first) last = first;
      View& mine = view_[is_short ? kFast : kSlow];
      mine.first_bin[k] = first;
      mine.last_bin[k] = last;
      // What those bins cover is the band, so noise reads true per octave.
      const float from = (static_cast<float>(first) - 0.5f) * bin;
      const float to = (static_cast<float>(last) + 0.5f) * bin;
      octaves_[k] = std::log2(to / from);
      // The same band as the other transform hears it: its bins centred in
      // the band, or where it has none (the short one, low down) the nearest.
      const float other_bin = is_short ? long_bin : short_bin;
      const int other_top = (is_short ? kLongFrame : kShortFrame) / 2 - 1;
      View& theirs = view_[is_short ? kSlow : kFast];
      int other_first = static_cast<int>(std::ceil(from / other_bin));
      int other_last = static_cast<int>(std::ceil(to / other_bin)) - 1;
      if (other_last < other_first) {
        other_first = other_last = static_cast<int>(std::sqrt(from * to) / other_bin + 0.5f);
      }
      theirs.first_bin[k] = kit::clamp_int(other_first, 1, other_top);
      theirs.last_bin[k] = kit::clamp_int(other_last, theirs.first_bin[k], other_top);
      centre_hz_[k] = std::sqrt(from * to);
      place_[k] = std::log2(centre_hz_[k]);
      w_[k] = kit::kTwoPi * centre_hz_[k] / sr;
      cos_w_[k] = std::cos(w_[k]);
      sin_w_[k] = std::sin(w_[k]);
      num_bands_ = k + 1;
      lo = hi;
    }
    if (first_short_ > num_bands_) first_short_ = num_bands_;
    for (int v = 0; v < 2; ++v) {
      View& view = view_[v];
      view.octaves_before[0] = 0.0f;
      for (int k = 0; k < num_bands_; ++k) {
        const float covered = std::log2((static_cast<float>(view.last_bin[k]) + 0.5f) /
                                        (static_cast<float>(view.first_bin[k]) - 0.5f));
        view.octaves_before[k + 1] = view.octaves_before[k] + covered;
      }
    }
    const float step = std::log2(kDisplayToHz / kDisplayFromHz) / (kDisplayPoints - 1);
    for (int p = 0; p < kDisplayPoints; ++p) {
      display_hz_[p] = kDisplayFromHz * std::exp2(step * static_cast<float>(p));
    }
    laid_width_ = 0.0f;  // nothing is laid out for a width yet
  }

  // Everything that follows from Sharpness's width: what each band's level is
  // the mean of, what it is compared with, and how wide its filter is.
  void lay_out_width(float width) {
    laid_width_ = width;
    const float half = 0.5f * width;
    // A side starts where its bands' means no longer share a band with this
    // one's mean.
    const float guard = width + kTwelfth;
    for (int k = 0; k < num_bands_; ++k) {
      int lo = k;
      while (lo > 0 && place_[k] - place_[lo - 1] <= half) --lo;
      int hi = k;
      while (hi < num_bands_ - 1 && place_[hi + 1] - place_[k] <= half) ++hi;
      mean_first_[k] = lo;
      mean_last_[k] = hi;

      // Each side: from the guard to an octave beyond it, never the band
      // next door, never more than kMaxSide bands (the nearest are kept).
      int last = k - 2;
      while (last >= 0 && place_[k] - place_[last] < guard) --last;
      int first = last;
      while (first > 0 && place_[k] - place_[first - 1] <= guard + kSideOctaves) --first;
      if (last - first + 1 > kMaxSide) first = last - kMaxSide + 1;
      below_first_[k] = first;
      below_last_[k] = last;  // below first when the side is empty
      first = k + 2;
      while (first < num_bands_ && place_[first] - place_[k] < guard) ++first;
      last = first;
      while (last < num_bands_ - 1 && place_[last + 1] - place_[k] <= guard + kSideOctaves) ++last;
      if (last > num_bands_ - 1) last = num_bands_ - 1;
      if (last - first + 1 > kMaxSide) last = first + kMaxSide - 1;
      above_first_[k] = first;
      above_last_[k] = last;

      // A filter is twice as wide as what it answers for, so that a tone at
      // the edge of that still gets four fifths of the cut. Its width is
      // kept in octaves up to the top (RBJ's correction for the bilinear
      // transform, which would narrow it by w / sin w).
      const float wide = kFilterWidths * kit::max(width, octaves_[k]);
      wide_[k] = wide;
      q_[k] = 1.0f / (2.0f * std::sinh(0.5f * 0.69314718f * wide));
      alpha_[k] = sin_w_[k] * std::sinh(0.5f * 0.69314718f * wide * w_[k] / sin_w_[k]);
    }
    alpha_ticks_ = gliding() ? kTicksPerLook : 0;
    if (alpha_ticks_ == 0) {
      for (int k = 0; k < num_bands_; ++k) alpha_now_[k] = alpha_[k];
    }
    redesign_ = true;
  }

  // Nothing is sounding: put every moving thing where a fresh start has it.
  void rest() {
    using namespace tamer;
    for (int c = 0; c < 2; ++c) {
      for (kit::Biquad& filter : filter_[c]) {
        filter.reset();
        filter.set_identity();
      }
      for (int n = 0; n < kLongFrame; ++n) ring_[c][n] = 0.0f;
      for (View& view : view_) {
        for (int k = 0; k < kMaxBands; ++k) view.energy[c][k] = 0.0f;
      }
    }
    for (View& view : view_) {
      for (int k = 0; k < kMaxBands; ++k) {
        view.power[k] = 0.0f;
        view.density[k] = 0.0f;
        view.level_db[k] = kFloorDb;
        view.top[k] = false;
      }
    }
    for (int k = 0; k < kMaxBands; ++k) {
      bed_[k] = 0.0f;
      surrounded_[k] = 0;
      held_[k] = 0.0f;
      wanted_[k] = 0.0f;
      gain_[k].length = kTicksPerLook;
      gain_[k].snap(0.0f);
      live_[k] = false;
    }
    live_count_ = 0;
    held_count_ = 0;
    at_rest_ = true;
    holding_ = false;
    deepest_ = 0.0f;
    position_ = 0;
    listen_.snap(listen_.target);
    width_ = width_for(param(kSharpness));
    if (width_ != laid_width_) lay_out_width(width_);
    for (int k = 0; k < num_bands_; ++k) alpha_now_[k] = alpha_[k];
    alpha_ticks_ = 0;
    redesign_ = false;
  }

  // Every 64 samples: step each moving filter's gain along its ramp, redesign
  // it, and note which filters still have work to do. With none, there is
  // nothing to do until the next comparison has set its cuts.
  void update_filters() {
    if (at_rest_) return;
    // Sharpness on its way: every filter's width moves a tick's worth, and
    // the live ones are designed again.
    const bool widening = alpha_ticks_ > 0;
    if (widening) {
      const float share = 1.0f / static_cast<float>(alpha_ticks_);
      for (int k = 0; k < num_bands_; ++k) alpha_now_[k] += (alpha_[k] - alpha_now_[k]) * share;
      --alpha_ticks_;
    }
    float deepest = 0.0f;
    int live = 0;
    for (int k = 0; k < num_bands_; ++k) {
      kit::LinearRamp& gain = gain_[k];
      if (gain.remaining > 0 || ((widening || redesign_) && live_[k])) {
        design(k, gain.next());
        live_[k] = true;
      } else if (live_[k] && gain.value == 0.0f && drained(filter_[0][k]) &&
                 drained(filter_[1][k])) {
        live_[k] = false;
      }
      if (gain.value < deepest) deepest = gain.value;
      if (live_[k]) live_bands_[live++] = k;
    }
    redesign_ = false;
    live_count_ = live;
    deepest_ = deepest;
    at_rest_ = live == 0 && alpha_ticks_ == 0;
  }

  static bool drained(const kit::Biquad& filter) { return filter.z1 == 0.0f && filter.z2 == 0.0f; }

  // A peaking cut of `db` at band k's centre, kit::Biquad::set_peak with the
  // sine and cosine of the centre already worked out. At exactly 0 dB the
  // filter becomes a wire: its state runs out in two samples and it can be
  // skipped.
  void design(int k, float db) {
    kit::Biquad& filter = filter_[0][k];
    if (db == 0.0f) {
      filter.set_identity();
    } else {
      const float amp = std::exp(db * 0.057564627f);  // 10^(db / 40)
      const float up = alpha_now_[k] * amp;
      const float down = alpha_now_[k] / amp;
      const float norm = 1.0f / (1.0f + down);
      filter.b0 = (1.0f + up) * norm;
      filter.b1 = -2.0f * cos_w_[k] * norm;
      filter.b2 = (1.0f - up) * norm;
      filter.a1 = filter.b1;
      filter.a2 = (1.0f - down) * norm;
    }
    kit::Biquad& other = filter_[1][k];
    other.b0 = filter.b0;
    other.b1 = filter.b1;
    other.b2 = filter.b2;
    other.a1 = filter.a1;
    other.a2 = filter.a2;
  }

  // One long transform of one channel: the last 4096 samples under a Hann
  // window, summed into the bands that are read from it.
  void analyse_long(int c) {
    const uint32_t start = position_ + 1;  // the oldest sample in the ring
    const float* ring = ring_[c];
    const float* window = long_window_;
    long_fft_.forward_real(
        [ring, window, start](int n) { return ring[(start + n) & kRingMask] * window[n]; },
        spectrum_);
    sum_bands(c, &view_[kSlow], kLongFrame, long_scale_);
  }

  // One short transform of one channel: the last 1024 samples.
  void analyse_short(int c) {
    const uint32_t start = position_ + 1 + (kLongFrame - kShortFrame);
    const float* ring = ring_[c];
    const float* window = short_window_;
    short_fft_.forward_real(
        [ring, window, start](int n) { return ring[(start + n) & kRingMask] * window[n]; },
        spectrum_);
    sum_bands(c, &view_[kFast], kShortFrame, short_scale_);
  }

  void sum_bands(int c, View* view, int frame, float scale) {
    for (int k = 0; k < num_bands_; ++k) {
      float sum = 0.0f;
      for (int bin = view->first_bin[k]; bin <= view->last_bin[k]; ++bin) {
        const float re = spectrum_[bin];
        const float im = spectrum_[frame - bin];
        sum += re * re + im * im;
      }
      view->energy[c][k] = sum * scale;
    }
  }

  // What one side has to say, from bands first..last: the middle one of its
  // tops (the bands no quieter than both their neighbours), leaving out any
  // more than 30 dB under the loudest of them; of two middle ones the lower,
  // so one tone and one top of the bed speak as the bed. A side with no top
  // (a slope, or nothing but what a tone spills) speaks with the level that
  // kShare of its bands lie under.
  static float side_level(const View& view, int first, int last) {
    float sorted[kMaxSide];
    int tops = 0;
    float loudest = kFloorDb;
    for (int j = first; j <= last; ++j) {
      if (view.top[j] && view.level_db[j] > loudest) loudest = view.level_db[j];
    }
    for (int j = first; j <= last; ++j) {
      if (!view.top[j] || view.level_db[j] < loudest - kTopsWithinDb) continue;
      tops = insert(sorted, tops, view.level_db[j]);
    }
    if (tops > 0) return sorted[(tops - 1) / 2];
    int count = 0;
    for (int j = first; j <= last; ++j) count = insert(sorted, count, view.level_db[j]);
    return sorted[static_cast<int>(kShare * static_cast<float>(count - 1) + 0.5f)];
  }

  // How far the dips of one side lie under its tops, in dB: the middle one of
  // the tops (those within 30 dB of the loudest), each band by itself, less
  // the middle one of the bands that are not tops, from the band below the
  // lowest top to the band above the highest. A bed of noise dips a few dB;
  // between the partials of clean notes there is next to nothing. A side
  // with no top is a slope and dips by nothing.
  static float dips(const View& view, int first, int last) {
    float sorted[kMaxSide];
    int tops = 0;
    float loudest = kFloorDb;
    for (int j = first; j <= last; ++j) {
      if (view.own_top[j] && view.own_db[j] > loudest) loudest = view.own_db[j];
    }
    int lowest = last + 1;
    int highest = first - 1;
    for (int j = first; j <= last; ++j) {
      if (!view.own_top[j] || view.own_db[j] < loudest - kTopsWithinDb) continue;
      tops = insert(sorted, tops, view.own_db[j]);
      if (j < lowest) lowest = j;
      highest = j;
    }
    if (tops == 0) return 0.0f;
    const float top = sorted[(tops - 1) / 2];
    if (lowest > first) --lowest;
    if (highest < last) ++highest;
    int between = 0;
    for (int j = lowest; j <= highest; ++j) {
      if (view.own_top[j] && view.own_db[j] >= loudest - kTopsWithinDb) continue;
      between = insert(sorted, between, view.own_db[j]);
    }
    if (between == 0) return 0.0f;
    return kit::max(top - sorted[(between - 1) / 2], 0.0f);
  }

  // The mean power per octave of bands first..last, nothing for fewer than two.
  static float side_mean(const View& view, int first, int last) {
    if (last - first + 1 < 2) return 0.0f;
    return kit::max(view.power_before[last + 1] - view.power_before[first], 0.0f) /
           (view.octaves_before[last + 1] - view.octaves_before[first]);
  }

  // Put `value` into sorted[0..count), lowest first; the new count.
  static int insert(float* sorted, int count, float value) {
    int at = count;
    while (at > 0 && sorted[at - 1] > value) {
      sorted[at] = sorted[at - 1];
      --at;
    }
    sorted[at] = value;
    return count + 1;
  }

  // How much of band k lies between From and To: 1 inside, fading to 0 a
  // third of an octave outside.
  static float in_range(float place, float from_place, float to_place) {
    const float below = (from_place - place) / kEdgeOctaves;
    const float above = (place - to_place) / kEdgeOctaves;
    const float out = kit::clamp(kit::max(below, above), 0.0f, 1.0f);
    return 1.0f - out * out * (3.0f - 2.0f * out);
  }

  // Every 256 samples: smooth the band powers, decide how far each band
  // stands out of the sound on both sides of it, move each cut towards what
  // Depth asks for, and share the cuts out among the filters.
  void look() {
    using namespace tamer;
    // Sharpness on its way: the width glides, and what follows from it is
    // laid out again while it moves.
    const float width_wanted = width_for(param(kSharpness));
    if (width_ != width_wanted) {
      width_ = width_wanted + (width_ - width_wanted) * width_coeff_;
      if (std::fabs(width_ - width_wanted) < 0.002f * width_wanted) width_ = width_wanted;
    }
    if (width_ != laid_width_) lay_out_width(width_);

    // As each transform hears it: power per band, both channels, smoothed;
    // the running sum the means are taken from; each band's level, the mean
    // over the width; and which bands are tops.
    for (int v = 0; v < 2; ++v) {
      View& view = view_[v];
      const float coeff = v == kSlow ? long_coeff_ : short_coeff_;
      view.power_before[0] = 0.0f;
      for (int k = 0; k < num_bands_; ++k) {
        const float now = view.energy[0][k] + view.energy[1][k];
        view.power[k] = flush_denormal(now + (view.power[k] - now) * coeff);
        view.power_before[k + 1] = view.power_before[k] + view.power[k];
      }
      for (int k = 0; k < num_bands_; ++k) {
        const int lo = mean_first_[k];
        const int hi = mean_last_[k];
        const float power = view.power_before[hi + 1] - view.power_before[lo];
        view.density[k] =
            kit::max(power, 0.0f) / (view.octaves_before[hi + 1] - view.octaves_before[lo]);
        view.level_db[k] = 10.0f * std::log10(view.density[k] + kFloor);
      }
      for (int k = 0; k < num_bands_; ++k) {
        const float level = view.level_db[k];
        view.top[k] = view.density[k] >= kQuiet && (k == 0 || level >= view.level_db[k - 1]) &&
                      (k == num_bands_ - 1 || level >= view.level_db[k + 1]);
      }
      for (int k = 0; k < num_bands_; ++k) {
        const float covered = view.octaves_before[k + 1] - view.octaves_before[k];
        view.own_db[k] = 10.0f * std::log10(view.power[k] / covered + kFloor);
      }
      for (int k = 0; k < num_bands_; ++k) {
        const float level = view.own_db[k];
        view.own_top[k] = level >= kQuietDb && (k == 0 || level >= view.own_db[k - 1]) &&
                          (k == num_bands_ - 1 || level >= view.own_db[k + 1]);
      }
    }

    // There has to be a bed to stand out of. Where a side is tops with next
    // to nothing between them, it is the partials of clean notes, and a band
    // above those is one more note, not a peak: the cut fades out as a
    // side's dips go from 4 dB to 8.
    //
    // And the bed has to last. A transform takes its length to fill (85 ms
    // the long one, 21 ms the short), and while a sound that starts at once
    // is filling it, what it spills reads as a bed all round it; so does the
    // knock a note starts with. So a band is only cut once both sides have
    // been a bed, with their mean power within 36 dB of the band, for 0.15 s
    // or 0.05 s on end.
    //
    // A bed changes slowly and reading it is the dearest thing here, so each
    // comparison reads it for every fourth band, taking turns.
    const int turn = static_cast<int>((position_ / kLookPeriod) % kBedTurns);
    for (int k = turn; k < num_bands_; k += kBedTurns) {
      const View& view = own(k);
      const bool both = above_last_[k] - above_first_[k] + 1 >= 2;
      float least = side_mean(view, below_first_[k], below_last_[k]);
      float dip = dips(view, below_first_[k], below_last_[k]);
      if (both) {
        least = kit::min(least, side_mean(view, above_first_[k], above_last_[k]));
        dip = kit::max(dip, dips(view, above_first_[k], above_last_[k]));
      }
      // One reading in a hundred of plain noise dips further than a bed is
      // allowed to; the cut goes by the last few readings together.
      const float bed = kit::clamp((kBareDb - dip) / (kBareDb - kBedDb), 0.0f, 1.0f);
      bed_[k] += (bed - bed_[k]) * kBedShare;
      if (view.density[k] >= least * kLoneRatio || bed == 0.0f) {
        surrounded_[k] = 0;
      } else if (surrounded_[k] < long_stay_) {
        surrounded_[k] += kBedTurns;
      }
    }

    const float depth = param(kDepth);
    const float margin = kit::lerp(kMarginAtZero, kMarginAtFull, depth);
    const float from_place = std::log2(param(kFrom));
    const float to_place = std::log2(param(kTo));
    const float looks_per_second = sample_rate() / kLookPeriod;
    const float seconds = param(kTime) * 0.001f;
    const float down = kit::time_to_coeff(seconds, looks_per_second);
    const float back = kit::time_to_coeff(kReleaseRatio * seconds, looks_per_second);

    int active = 0;
    for (int k = 0; k < num_bands_; ++k) {
      float target = 0.0f;
      const View& view = own(k);
      const float level = view.level_db[k];
      const float range = depth > 0.0f ? in_range(place_[k], from_place, to_place) : 0.0f;
      const int below = below_last_[k] - below_first_[k] + 1;
      if (range > 0.0f && below >= 2 && view.density[k] >= kQuiet) {
        // Only the top of a peak is one. The bands between this one and its
        // sides: with one of them louder, this is the slope of that one (or
        // what a loud tone spills into its neighbours).
        float highest = level;
        for (int j = below_last_[k] + 1; j < above_first_[k]; ++j) {
          if (j >= 0 && j < num_bands_ && view.level_db[j] > highest) highest = view.level_db[j];
        }
        const float top = kit::clamp(1.0f - (highest - level) / kTopDb, 0.0f, 1.0f);
        if (top > 0.0f && surrounded_[k] >= (k < first_short_ ? long_stay_ : short_stay_)) {
          const bool both = above_last_[k] - above_first_[k] + 1 >= 2;
          const float under = side_level(view, below_first_[k], below_last_[k]);
          float around = under;
          float least = under;
          if (both) {
            const float over = side_level(view, above_first_[k], above_last_[k]);
            around = 0.5f * (under + over);
            least = kit::min(under, over);
          }
          const float excess = level - around - margin;
          if (excess > 0.0f) {
            const float alone =
                kit::clamp((kLoneDb - (level - least)) / (kLoneDb - kLoneFromDb), 0.0f, 1.0f);
            target = -kit::min(
                depth * alone * bed_[k] * top * range * kit::min(excess, kMaxExcessDb), kMaxCutDb);
          }
        }
      }
      // No more than 48 cuts at once: with that many held, a new one waits
      // for one of them to be let go.
      float cut = held_[k];
      if (cut == 0.0f && target < 0.0f && held_count_ >= kMaxActive) target = 0.0f;
      const bool was_held = cut != 0.0f;
      cut = target + (cut - target) * (target < cut ? down : back);
      if (target == 0.0f && cut > -kLetGoDb) cut = 0.0f;
      held_[k] = cut;
      if (cut != 0.0f) {
        if (!was_held) ++held_count_;
        active_[active++] = k;
      } else if (was_held) {
        --held_count_;
      }
    }

    // Share the held cuts out among the filters that hold one. With none
    // held, and none last time, every gain is already on its way to nothing.
    if (active > 0 || holding_) {
      for (int i = 0; i < active; ++i) {
        const int k = active_[i];
        solved_[i] = wanted_[k];
        for (int j = 0; j < active; ++j) {
          const int other = active_[j];
          skirts_[i][j] = i == j ? 0.0f : skirt(centre_hz_[k] / centre_hz_[other], q_[other]);
        }
      }
      for (int sweep = 0; sweep < kSweeps; ++sweep) {
        for (int i = 0; i < active; ++i) {
          const float* skirts = skirts_[i];
          float others = 0.0f;
          for (int j = 0; j < active; ++j) others += skirts[j] * solved_[j];
          solved_[i] = kit::clamp(held_[active_[i]] - others, -kMaxCutDb, 0.0f);
        }
      }
      for (int k = 0; k < num_bands_; ++k) wanted_[k] = 0.0f;
      for (int i = 0; i < active; ++i) wanted_[active_[i]] = solved_[i];
      for (int k = 0; k < num_bands_; ++k) {
        gain_[k].set_target(wanted_[k] > -kLetGoDb ? 0.0f : wanted_[k]);
      }
      at_rest_ = false;
    } else if (redesign_ || alpha_ticks_ > 0) {
      at_rest_ = false;
    }
    holding_ = active > 0;
  }

  kit::Fft<kLongFrame> long_fft_;
  kit::Fft<kShortFrame> short_fft_;
  float long_window_[kLongFrame];
  float short_window_[kShortFrame];
  float ring_[2][kLongFrame];   // what was heard, per channel
  float spectrum_[kLongFrame];  // of one frame, as kit::Fft::forward_real packs it

  kit::Biquad filter_[2][kMaxBands];
  kit::LinearRamp gain_[kMaxBands];  // each filter's cut on its way, per tick
  kit::LinearRamp listen_;           // 0 the output, 1 what is taken away
  kit::IdleGate idle_;

  // The bands, for this sample rate.
  int num_bands_ = 0;
  int first_short_ = 0;  // the first band the short transform answers for
  float octaves_[kMaxBands] = {};  // how wide
  float centre_hz_[kMaxBands] = {};
  float place_[kMaxBands] = {};  // log2 of the centre
  float w_[kMaxBands] = {};  // the centre in radians per sample
  float cos_w_[kMaxBands] = {};
  float sin_w_[kMaxBands] = {};
  float long_scale_ = 0.0f;
  float short_scale_ = 0.0f;
  float display_hz_[kDisplayPoints] = {};

  // What follows from Sharpness's width.
  float width_ = 0.0f;       // octaves, gliding
  float laid_width_ = 0.0f;  // what the tables below were made for
  int mean_first_[kMaxBands] = {};
  int mean_last_[kMaxBands] = {};
  int below_first_[kMaxBands] = {};
  int below_last_[kMaxBands] = {};
  int above_first_[kMaxBands] = {};
  int above_last_[kMaxBands] = {};
  float wide_[kMaxBands] = {};   // the filter's width in octaves
  float q_[kMaxBands] = {};
  float alpha_[kMaxBands] = {};      // sin(w) / 2Q, with the width kept to the top
  float alpha_now_[kMaxBands] = {};  // the same on its way there, per tick
  int alpha_ticks_ = 0;              // ticks until it is there

  // What is heard, by each transform.
  View view_[2];
  float bed_[kMaxBands] = {};       // how much of a bed a band's sides are, 0 to 1
  int surrounded_[kMaxBands] = {};  // looks in a row a band has had a bed on both sides
  int long_stay_ = 1;               // how many it takes under the long transform
  int short_stay_ = 1;              // and under the short

  // What is done about it.
  float held_[kMaxBands] = {};    // the cut asked for at each band, dB, 0 or below
  float wanted_[kMaxBands] = {};  // each filter's gain, once shared out
  int held_count_ = 0;            // how many bands hold a cut
  int active_[kMaxActive] = {};   // the bands holding a cut, low to high
  float solved_[kMaxActive] = {};
  float skirts_[kMaxActive][kMaxActive] = {};  // what each of them does at the others' centres
  bool live_[kMaxBands] = {};
  int live_bands_[kMaxBands] = {};
  int live_count_ = 0;
  bool at_rest_ = true;   // no filter live and no gain on its way
  bool holding_ = false;  // a cut was held at the last comparison
  bool redesign_ = false;  // the widths moved: every live filter is designed again
  float short_coeff_ = 0.0f;
  float long_coeff_ = 0.0f;
  float width_coeff_ = 0.0f;
  float deepest_ = 0.0f;
  uint32_t position_ = 0;  // samples since waking; every period is counted from it
};

}  // namespace livemix
