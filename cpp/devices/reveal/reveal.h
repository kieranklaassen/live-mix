#pragma once

// Reveal: turns up what is quiet inside a sound, frequency by frequency. An
// upward compressor of the spectrum.
//
//   in ─┬─► frames of 2048, every 512 ─► gain per bin ─► overlap-add ─► trim ─┬─► out
//       │            │                        ▲                              │
//       │            └─► bands ─► compare ─► lift ─► level hold              │
//       └─► the same samples, a latency late (dry) ───────────────── mix ────┘
//
// Built on kit::Stft<2048, 512>. The gains are real and positive, so no
// phase is turned: what comes out is the input through a filter that moves,
// 2304 samples late (kLatency, "latencySamples" in device.json), and the dry
// path is the input that many samples late, so Mix crossfades two signals
// that are in step and in phase.
//
// Bands. From 40 Hz to 20 kHz (or 0.45 of the sample rate): one bin wide
// where a twelfth of an octave is narrower than a bin (under about 400 Hz at
// 48 kHz) and a twelfth of an octave above, 83 bands at 48 kHz, 88 at most.
// A band's level is the power in its bins, left and right together, against
// that of a full-scale sine (1.5 × kFullScale² over the three bins a sine
// fills): a sine of amplitude 1 inside one band reads 0 dB whatever the
// band's width. The level jumps up at once and falls back over 60 ms, so a
// noise does not flicker.
//
// Compare, once per frame, when the left channel's frame comes (the right
// channel's power is that of its frame before, a hop earlier; both channels
// then take the same gains, so the image does not move and mono stays mono):
//
// - Skirt. A partial is three or four bins wide and its window spills
//   further. A band is never read lower than its neighbour less 12 dB for
//   every bin between their centres beyond the first, so what one partial
//   spills is not taken for a quiet sound of its own and the bins of one
//   partial are lifted together.
// - The loud around it. Every band is held against the loudest there is,
//   less 3 dB for every octave between the two: a tent over the peaks. The
//   deficit is how far the band lies under that.
// - The lift asked for is Amount times the deficit, Range at most; nothing
//   where the band is under Floor (fading in over the 6 dB above it); and
//   weighted by Focus, which takes the lift away towards one end of the
//   spectrum (none at 60 Hz with Focus full up, none at 12 kHz full down).
// - Detail. The lift is then averaged over pitch, over two octaves at
//   Detail 0 and not at all at 1, so that low Detail lifts regions and high
//   Detail single partials and the valleys between them. Bands under Floor
//   still get none.
// - Rise. The lift held moves towards that in dB: up over Rise, down six
//   times faster (15 ms at the least), so a note that starts where a lift
//   was is not thrown forward.
// - Level hold. The power the frame would come out with is set against the
//   power it came in with, and all of it is turned down by the difference:
//   at once on the way down, over 40 ms on the way back. Reveal changes the
//   balance inside a sound and never its level.
//
// A bin's gain is its band's, read between band centres; bins under the
// first band and over the last pass as they are.
//
// Listen plays only what is added: every bin by its gain less one.
//
// meter(0) is the largest lift in force in dB. The rest are for the display:
// 1 the level hold in dB, 2 to 23 the lift of every band and 24 to 45 its
// level, four bands to a reading, six bits each.
//
// Storage: two kit::Stft<2048, 512> (88 KB each) and under 20 KB of tables
// and state per bin and per band. Nothing is sized by the sample rate.
//
// It sleeps once nothing comes in, the frames in flight have played out and
// every level and lift it holds is exactly at rest; the frame clock runs on
// through the sleep (Stft::skip), so the block size cannot be heard.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Reveal : public kit::DeviceBase<reveal::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;
  static constexpr int kLatency = Stft::kLatency;  // 2304: "latencySamples" in device.json
  static constexpr int kMaxBands = 88;
  static constexpr int kNoBand = 255;  // a bin under the first band or over the last
  static constexpr int kBandsPerReading = 4;
  static constexpr int kReadings = kMaxBands / kBandsPerReading;  // 22 of lift, 22 of level
  static constexpr int kSteps = 64;                               // six bits a band
  static constexpr float kLiftStepDb = 0.5f;    // a lift is reported in half decibels
  static constexpr float kLevelStepDb = 1.5f;   // a level in steps of 1.5 dB up from kLevelFootDb
  static constexpr float kLevelFootDb = -94.5f;
  static_assert(kReadings * kBandsPerReading == kMaxBands, "whole readings");

  // How the bands lie, for the harness and the display's test.
  int bands() const { return bands_; }
  float band_hz(int band) const { return centre_bin_[band] * sample_rate() * (1.0f / Stft::kFrame); }
  float lift_db(int band) const { return lift_[band]; }
  // True once it holds nothing and has stopped working.
  bool asleep() const { return idle_.asleep(); }

  void init(float sample_rate) {
    using namespace reveal;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    lay_out_bands(sr);
    const float frames_per_second = sr / static_cast<float>(Stft::kHop);
    // Power falls twice as fast as amplitude.
    level_fall_ = kit::time_to_coeff(0.5f * kLevelFallSeconds, frames_per_second);
    frames_per_second_ = frames_per_second;
    mix_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    listen_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    output_.snap(kit::db_to_gain(param(kOutput)));
    listen_.snap(param(kListen) >= 0.5f ? 1.0f : 0.0f);
    rest();
    detail_seen_ = -1.0f;
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void set_param(int id, float value) {
    using namespace reveal;
    if (!store_param(id, value)) return;
    if (id == kMix) mix_.set(param(id), primed());
    if (id == kOutput) output_.set(kit::db_to_gain(param(id)), primed());
    if (id == kListen) listen_.set(param(id) >= 0.5f ? 1.0f : 0.0f, primed());
  }

  // The readings named by "meters" in device.json, each a number the last
  // frame left behind: 0 the largest lift in force, in dB; 1 the level hold
  // in dB (0 or below); 2 to 23 the lift of four bands each, and 24 to 45
  // their levels, six bits a band with the lowest band in the lowest bits,
  // which a float holds exactly.
  float meter(int index) const {
    if (index == 0) return most_lift_;
    if (index == 1) return hold_db_;
    if (index >= 2 && index < 2 + kReadings) return lift_reading_[index - 2];
    if (index >= 2 + kReadings && index < 2 + 2 * kReadings) return level_reading_[index - 2 - kReadings];
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive_)) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      // A knob moved while asleep does not glide in.
      mix_.snap(mix_.target);
      output_.snap(output_.target);
      listen_.snap(listen_.target);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      const float trim = output_.next();
      const float listen = listen_.next();
      // Listen all the way over: the dry sound gone, and what is added at
      // full whatever Mix says.
      const float dry_gain = (1.0f - mix) * (1.0f - listen);
      const float wet_gain = (mix + listen * (1.0f - mix)) * trim;
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        const float dry = stft_[c].dry();
        // With nothing of the wet side in it the output is the dry sound to the last bit.
        out[c] = wet_gain == 0.0f ? dry : dry * dry_gain + wet * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kBins = Stft::kBins;
  static constexpr float kFirstHz = 40.0f;
  static constexpr float kTopHz = 20000.0f;
  static constexpr float kTopOfRange = 0.45f;        // of the sample rate
  static constexpr double kTwelfth = 1.0594630943592953;  // 2^(1/12)
  static constexpr float kLevelFallSeconds = 0.06f;  // a band's level falls back over this
  // What was loud is remembered, falling this many dB a second: 3 over Rise
  // in seconds, between these.
  static constexpr float kSlowestMemory = 3.0f;
  static constexpr float kFastestMemory = 150.0f;
  static constexpr float kForgottenDb = -110.0f;  // under this a memory is none
  static constexpr float kForgotten = 1.0e-11f;   // the same as a power against a full-scale sine
  static constexpr float kNoneDb = -300.0f;       // what a band holding nothing reads
  // What a partial spills, as the most a bin d bins away can hold of it
  // (the Hann window's worst, between two bins, with a few dB to spare):
  // all of it at 1 bin and 11 dB less for each bin on; 35 + 2.5 d dB down;
  // 72 + 0.6 d dB down. The most of the three.
  static constexpr int kSpills = 3;
  static constexpr float kSpillFirst[kSpills] = {1.0f, 1.7782794e-4f, 5.4954087e-8f};  // at one bin
  static constexpr float kSpillRatio[kSpills] = {0.079432823f, 0.56234133f, 0.87096359f};  // per bin on
  static constexpr float kAroundDbPerOctave = 3.0f;  // the loud around a band counts less by distance
  static constexpr float kKneeDb = 6.0f;             // over Floor: the lift fades in
  static constexpr float kFocusFromHz = 60.0f;       // Focus takes the lift away towards one of these
  static constexpr float kFocusToHz = 12000.0f;
  static constexpr float kDetailOctaves = 3.5849625f;  // log2(12): Detail 0 to 1 is an octave to a twelfth
  static constexpr float kTwelfthOctave = 1.0f / 12.0f + 1.0e-4f;
  static constexpr float kRestDb = 0.02f;            // a lift under this with nothing asked is none
  // A band's power under this is nothing: -180 dB against a full-scale sine.
  static constexpr float kNothing = 1.0e-18f;
  // The power of a full-scale sine on both channels, over the three bins it fills.
  static constexpr float kSinePower = 2.0f * 1.5f * Stft::kFullScale * Stft::kFullScale;

  // Everything a frame leaves behind, as it is after init: nothing held.
  void rest() {
    for (int k = 0; k < kBins; ++k) {
      power_[k] = 0.0f;
      power_right_[k] = 0.0f;
      gain_[k] = 1.0f;
    }
    for (int b = 0; b < kMaxBands; ++b) {
      level_[b] = 0.0f;
      lift_[b] = 0.0f;
      loud_db_[b] = kNoneDb;
      band_gain_[b] = 1.0f;
    }
    band_gain_[kNoBand] = 1.0f;
    for (int r = 0; r < kReadings; ++r) {
      lift_reading_[r] = 0.0f;
      level_reading_[r] = 0.0f;
    }
    hold_ = 1.0f;
    heard_ = 0.0f;
    hold_db_ = 0.0f;
    most_lift_ = 0.0f;
    listen_frame_ = 0.0f;
    alive_ = false;
  }

  // The bands, from the sample rate: where each begins, its centre in bins
  // and in octaves, how far Focus reaches it, and for every bin the two band
  // centres it lies between.
  void lay_out_bands(float sr) {
    const double bin_hz = static_cast<double>(sr) / Stft::kFrame;
    const double top_hz = kTopHz < kTopOfRange * sr ? kTopHz : kTopOfRange * sr;
    const int top_bin = kit::clamp_int(static_cast<int>(top_hz / bin_hz), 2, kBins - 2);
    int k = static_cast<int>(std::ceil(kFirstHz / bin_hz));
    if (k < 1) k = 1;
    bands_ = 0;
    while (k <= top_bin && bands_ < kMaxBands) {
      int next = static_cast<int>(std::floor(k * kTwelfth + 0.5));
      if (next < k + 1) next = k + 1;
      if (next > top_bin + 1) next = top_bin + 1;
      first_[bands_] = static_cast<int16_t>(k);
      centre_bin_[bands_] = 0.5f * static_cast<float>(k + next - 1);
      const float hz = centre_bin_[bands_] * static_cast<float>(bin_hz);
      octave_[bands_] = std::log2(hz);
      focus_at_[bands_] =
          kit::clamp(std::log2(hz / kFocusFromHz) / std::log2(kFocusToHz / kFocusFromHz), 0.0f, 1.0f);
      ++bands_;
      k = next;
    }
    first_[bands_] = static_cast<int16_t>(k);
    for (int b = bands_; b < kMaxBands; ++b) {
      centre_bin_[b] = centre_bin_[bands_ - 1];
      octave_[b] = octave_[bands_ - 1];
      focus_at_[b] = focus_at_[bands_ - 1];
    }
    around_step_[0] = 0.0f;
    for (int b = 1; b < kMaxBands; ++b) {
      around_step_[b] = kAroundDbPerOctave * (octave_[b] - octave_[b - 1]);
    }
    for (int bin = 0; bin < kBins; ++bin) bin_band_[bin] = kNoBand;
    for (int b = 0; b < bands_; ++b) {
      for (int bin = first_[b]; bin < first_[b + 1]; ++bin) bin_band_[bin] = static_cast<uint8_t>(b);
    }
  }

  // The bands a band's lift is averaged with: those whose centres lie
  // within `reach` octaves either way.
  void lay_out_spans(float reach) {
    int low = 0;
    int high = 0;
    for (int b = 0; b < bands_; ++b) {
      while (octave_[low] < octave_[b] - reach) ++low;
      if (high < b) high = b;
      while (high + 1 < bands_ && octave_[high + 1] <= octave_[b] + reach) ++high;
      span_low_[b] = static_cast<uint8_t>(low);
      span_high_[b] = static_cast<uint8_t>(high);
    }
    reach_ = reach;
    averaged_ = reach > kTwelfthOctave;
  }

  // One frame of channel c. The left channel's frame comes first and does
  // the comparing; the right channel's frame of the same number takes the
  // gains that left behind.
  void frame(int c, float* re, float* im) {
    if (c == 0) {
      compare(re, im);
    } else {
      for (int k = 0; k < kBins; ++k) power_right_[k] = re[k] * re[k] + im[k] * im[k];
    }
    const float listen = listen_frame_;
    const float hold = hold_;
    for (int k = 0; k < kBins; ++k) {
      const float gain = (gain_[k] - listen) * hold;
      re[k] *= gain;
      im[k] *= gain;
    }
  }

  // The comparing, once per frame: the gain of every bin and the level hold
  // for this frame of both channels, from the left channel's spectrum now
  // and the right channel's of a hop before.
  void compare(const float* re, const float* im) {
    using namespace reveal;
    const float amount = param(kAmount);
    const float range = param(kRange);
    const float floor_db = param(kFloor);
    const float focus = param(kFocus);
    const float detail = param(kDetail);
    const float rise_seconds = param(kRise) * 0.001f;
    listen_frame_ = param(kListen) >= 0.5f ? 1.0f : 0.0f;
    if (detail != detail_seen_) {
      detail_seen_ = detail;
      // An octave either way at 0, a twelfth (the next band, which then counts nothing) at 1.
      lay_out_spans(std::exp2(-detail * kDetailOctaves));
    }
    const float rise = kit::time_to_coeff(rise_seconds, frames_per_second_);
    // How fast what was loud is forgotten, per frame, in dB and as power.
    const float memory_db = kit::clamp(3.0f / rise_seconds, kSlowestMemory, kFastestMemory) / frames_per_second_;
    const float memory_fall = std::exp(-0.23025851f * memory_db);

    for (int k = 0; k < kBins; ++k) power_[k] = re[k] * re[k] + im[k] * im[k] + power_right_[k];

    // Whose each bin is. A partial fills the bin it peaks in, the one either
    // side, and spills on from there as the window does. A bin holding less
    // than the most any other bin could have spilled into it belongs to that
    // bin: it counts for nothing in its band's level and takes its owner's
    // gain, so a partial is lifted whole.
    float spill[kBins];
    for (int k = 0; k < kBins; ++k) {
      spill[k] = 0.0f;
      owner_[k] = static_cast<uint16_t>(k);
    }
    for (int t = 0; t < kSpills; ++t) {
      const float first = kSpillFirst[t];
      const float ratio = kSpillRatio[t];
      float carried = 0.0f;
      int from = 0;
      for (int k = 1; k < kBins; ++k) {
        const float direct = power_[k - 1] * first;
        carried *= ratio;
        if (direct >= carried) {
          carried = direct;
          from = k - 1;
        }
        if (carried > spill[k]) {
          spill[k] = carried;
          owner_[k] = static_cast<uint16_t>(from);
        }
      }
      carried = 0.0f;
      from = kBins - 1;
      for (int k = kBins - 2; k >= 0; --k) {
        const float direct = power_[k + 1] * first;
        carried *= ratio;
        if (direct >= carried) {
          carried = direct;
          from = k + 1;
        }
        if (carried > spill[k]) {
          spill[k] = carried;
          owner_[k] = static_cast<uint16_t>(from);
        }
      }
    }
    for (int k = 0; k < kBins; ++k) {
      if (power_[k] >= spill[k]) owner_[k] = static_cast<uint16_t>(k);
    }
    // An owner may have an owner of its own: follow to the bin that has
    // none. An owner always holds more than what it owns, so this ends.
    for (int k = 0; k < kBins; ++k) {
      int own = owner_[k];
      while (owner_[own] != own) own = owner_[own];
      owner_[k] = static_cast<uint16_t>(own);
    }

    // Each band's level: the power of the bins that are their own and of
    // the bin either side of each, which is the whole of a partial. Up at
    // once, back over 60 ms, in dB against a full-scale sine on both channels.
    float sum[kMaxBands];
    for (int b = 0; b < bands_; ++b) sum[b] = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      const int own = owner_[k];
      const int band = bin_band_[own];
      if (band != kNoBand && own - k <= 1 && k - own <= 1) sum[band] += power_[k];
    }
    float level_db[kMaxBands];
    bool alive = false;
    for (int b = 0; b < bands_; ++b) {
      float held = level_[b] * level_fall_;
      if (sum[b] > held) held = sum[b];
      if (held < kNothing * kSinePower) held = 0.0f;
      level_[b] = held;
      alive = alive || held > 0.0f;
      level_db[b] = 10.0f * std::log10(held * (1.0f / kSinePower) + 1.0e-30f);
    }
    for (int b = bands_; b < kMaxBands; ++b) level_db[b] = kNoneDb;

    // What was loud is remembered for a while: a band's level, or what it
    // was, falling steadily.
    for (int b = 0; b < bands_; ++b) {
      float kept = loud_db_[b] - memory_db;
      if (level_db[b] > kept) kept = level_db[b];
      if (kept < kForgottenDb) kept = kNoneDb;
      loud_db_[b] = kept;
      alive = alive || kept > kNoneDb;
    }

    // The loud around each band: a tent over what is loud or was, 3 dB down per octave.
    float around_db[kMaxBands];
    around_db[0] = loud_db_[0];
    for (int b = 1; b < bands_; ++b) around_db[b] = kit::max(loud_db_[b], around_db[b - 1] - around_step_[b]);
    for (int b = bands_ - 2; b >= 0; --b) {
      around_db[b] = kit::max(around_db[b], around_db[b + 1] - around_step_[b + 1]);
    }

    // The lift asked for, band by band: Amount of the deficit, Range at most,
    // weighted by Focus; and how far the band is over Floor, 0 to 1.
    float ask[kMaxBands];
    float over[kMaxBands];
    for (int b = 0; b < bands_; ++b) {
      const float deficit = around_db[b] - level_db[b];
      const float weight = focus >= 0.0f ? 1.0f - focus * (1.0f - focus_at_[b]) : 1.0f + focus * focus_at_[b];
      float lift = amount * deficit;
      if (lift > range) lift = range;
      ask[b] = lift * weight;
      over[b] = kit::clamp((level_db[b] - floor_db) * (1.0f / kKneeDb), 0.0f, 1.0f);
    }
    // Detail: the mean over the bands around it that hold sound, each
    // counted by how far it is over Floor and by how near it is in pitch.
    if (averaged_) {
      float asked[kMaxBands];
      for (int b = 0; b < bands_; ++b) asked[b] = ask[b] * over[b];
      const float per_octave = 1.0f / reach_;
      for (int b = 0; b < bands_; ++b) {
        float sum = 0.0f;
        float count = 0.0f;
        for (int n = span_low_[b]; n <= span_high_[b]; ++n) {
          const float apart = octave_[n] - octave_[b];
          const float near = 1.0f - (apart < 0.0f ? -apart : apart) * per_octave;
          sum += near * asked[n];
          count += near * over[n];
        }
        ask[b] = count > 1.0e-6f ? sum / count : 0.0f;
      }
    }
    // Nothing under Floor, fading in over the 6 dB above it.
    for (int b = 0; b < bands_; ++b) ask[b] *= over[b];

    // The lift held moves up towards that over Rise, and comes down to it
    // at once: a band that has grown loud is not thrown forward.
    float most = 0.0f;
    for (int b = 0; b < bands_; ++b) {
      const float target = ask[b];
      float held = lift_[b];
      held = target < held ? target : target + (held - target) * rise;
      if (held < kRestDb) held = target < kRestDb ? 0.0f : held;
      lift_[b] = held;
      alive = alive || held > 0.0f;
      if (held > most) most = held;
      band_gain_[b] = held > 0.0f ? std::exp(held * 0.11512925f) : 1.0f;  // 10^(dB / 20)
    }
    most_lift_ = most;

    // A bin's gain is its band's, and an owned bin takes its owner's; bins
    // under the first band and over the last pass as they are. Then the
    // power the frame comes in with and would go out with.
    band_gain_[kNoBand] = 1.0f;
    float power_in = 0.0f;
    float power_out = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      const float gain = band_gain_[bin_band_[owner_[k]]];
      gain_[k] = gain;
      power_in += power_[k];
      power_out += power_[k] * gain * gain;
    }

    // Level hold: the frame is turned down by what the lifts add to its
    // power. What was loud a moment ago counts as still there (a remembered
    // power that passes at unity), so the quiet that is left when a note
    // stops stays lifted, and comes back to its own level as that fades.
    float remembered = heard_ * memory_fall;
    if (power_in > remembered) remembered = power_in;
    if (remembered < kForgotten * kSinePower) remembered = 0.0f;
    heard_ = remembered;
    const float still = remembered - power_in;
    hold_ = power_out > power_in ? std::sqrt((power_in + still) / (power_out + still)) : 1.0f;
    if (hold_ > 0.9999f) hold_ = 1.0f;
    hold_db_ = hold_ < 1.0f ? 20.0f * std::log10(hold_) : 0.0f;
    alive_ = alive || remembered > 0.0f;

    // What the display reads: four bands to a number, six bits each.
    for (int r = 0; r < kReadings; ++r) {
      int lifts = 0;
      int levels = 0;
      for (int b = r * kBandsPerReading + kBandsPerReading - 1; b >= r * kBandsPerReading; --b) {
        int lift_steps = 0;
        int level_steps = 0;
        if (b < bands_) {
          lift_steps = kit::clamp_int(static_cast<int>(lift_[b] * (1.0f / kLiftStepDb) + 0.5f), 0, kSteps - 1);
          level_steps = kit::clamp_int(
              static_cast<int>((level_db[b] - kLevelFootDb) * (1.0f / kLevelStepDb) + 0.5f), 0, kSteps - 1);
        }
        lifts = lifts * kSteps + lift_steps;
        levels = levels * kSteps + level_steps;
      }
      lift_reading_[r] = static_cast<float>(lifts);
      level_reading_[r] = static_cast<float>(levels);
    }
  }

  Stft stft_[2];
  float power_[kBins] = {};        // this frame, both channels
  float power_right_[kBins] = {};  // the right channel's newest frame
  float gain_[kBins] = {};         // per bin, for both channels
  uint16_t owner_[kBins] = {};     // the bin each bin belongs to
  uint8_t bin_band_[kBins] = {};   // the band each bin lies in, or kNoBand
  int16_t first_[kMaxBands + 1] = {};
  float centre_bin_[kMaxBands] = {};
  float octave_[kMaxBands] = {};
  float focus_at_[kMaxBands] = {};
  float around_step_[kMaxBands] = {};
  uint8_t span_low_[kMaxBands] = {};
  uint8_t span_high_[kMaxBands] = {};
  float level_[kMaxBands] = {};  // power, held
  float loud_db_[kMaxBands] = {};  // what is loud or was, dB
  float lift_[kMaxBands] = {};   // dB, held
  float band_gain_[kNoBand + 1] = {};  // the last is kNoBand's: 1
  float lift_reading_[kReadings] = {};
  float level_reading_[kReadings] = {};
  kit::Smoother mix_, output_, listen_;
  kit::IdleGate idle_;
  int bands_ = 2;
  float frames_per_second_ = 93.75f;
  float level_fall_ = 0.0f;
  float heard_ = 0.0f;  // the power of the loudest frame of late, falling
  float detail_seen_ = -1.0f;
  float hold_ = 1.0f;
  float hold_db_ = 0.0f;
  float most_lift_ = 0.0f;
  float listen_frame_ = 0.0f;
  float reach_ = 0.0f;  // octaves either way that Detail averages over
  bool averaged_ = false;
  bool alive_ = false;
};

}  // namespace livemix
