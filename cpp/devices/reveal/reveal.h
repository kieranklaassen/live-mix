#pragma once

// Reveal: turns up what is quiet inside a sound, frequency by frequency. An
// upward compressor of the spectrum.
//
//   in ─┬─► frames of 2048, every 512 ─► gain per bin ─► overlap-add ─► ceiling ─► trim ─┬─► out
//       │            │                        ▲                            ▲            │
//       │            └─► bands ─► compare ─► lift ─► level hold            │            │
//       ├─► the loudest sample of late ────────────────────────────────────┘            │
//       └─► the same samples, a latency late (dry) ────────────────────────── mix ──────┘
//
// Built on kit::Stft<2048, 512>. The gains are real and positive, so no
// phase is turned: what comes out is the input through a filter that moves,
// 2304 samples late (kLatency, "latencySamples" in device.json), and the dry
// path is the input that many samples late, so Mix crossfades two signals
// that are in step and in phase.
//
// Bands. From 40 Hz to 20 kHz (or 0.45 of the sample rate): one bin wide
// where a twelfth of an octave is narrower than a bin (under about 400 Hz at
// 48 kHz) and a twelfth of an octave above, 85 bands at 48 kHz, 88 at most.
// The frame is 2048 at every sample rate, so at 96 kHz the single bins reach
// up to 800 Hz and there are 74 bands: a quiet partial has to lie twice as
// far in hertz from a loud one to be told from it.
//
// Compare, once per frame, when the left channel's frame comes (the right
// channel's power is that of its frame before, a hop earlier; both channels
// then take the same gains, so the image does not move and mono stays mono):
//
// - Whose each bin is. A partial fills the bin it peaks in and the one
//   either side, and its window spills on from there. A bin that holds less
//   than the most another bin could have spilled into it (the Hann window's
//   worst case with a few dB to spare) belongs to that bin, or to the bin
//   that one belongs to. An owned bin takes its owner's gain, so a partial
//   is lifted whole, and beyond its owner's neighbours it counts for
//   nothing: what a loud partial spills is not a quiet sound.
// - Level. A band's level is the power of the bins in it that are their own
//   and of the bin either side of each, left and right together, against a
//   full-scale sine on both channels: a sine of amplitude 1 reads 0 dB
//   wherever it lies. It jumps up at once and falls back over 60 ms.
// - The loud around it. Every band is held against the loudest there is in
//   this frame, less 3 dB for every octave between the two: a tent over the
//   peaks. The deficit is how far the band lies under that. Only what sounds
//   now is compared: nothing is lifted towards a sound that has stopped, so
//   a bed of noise does not come up in the pause after a note, and what
//   follows a loud sound is not lifted towards it.
// - The lift asked for is Amount times the deficit, Range at most, weighted
//   by Focus, which takes the lift away towards one end of the spectrum
//   (none at 60 Hz with Focus full up, none at 12 kHz full down).
// - Detail. Under Detail 1 the lift asked for is the mean over the sounding
//   bands within 12^-Detail octaves either way (an octave at 0), the nearer
//   counting more, so that low Detail lifts regions and high Detail single
//   partials and what lies between them.
// - Floor. Floor is counted down from the loudest band of late: the highest
//   level any band has had, held for 5 s after anything was last as loud,
//   then falling 3 dB a second until it meets what sounds. So
//   the same sound 30 dB quieter is treated the same, and Floor keeps its
//   place through the gaps of a phrase. A band under it gets no lift and
//   counts for nothing in Detail's mean; the lift fades in over the 6 dB
//   above it. Nothing under -96 dB is lifted whatever Floor says. A band
//   that sinks under Floor is let go of: the lift it holds is taken off it
//   over a fifth of a second (and is back when the band is over Floor
//   again), so what a note leaves standing does not hold a bed of noise up
//   through the pause that follows, however long Rise is.
// - Rise. The lift held moves up towards what is asked over Rise, in dB.
//   When less is asked it falls back 3 dB a second divided by Rise in
//   seconds (10 dB a second at 300 ms; never slower than 3 nor faster than
//   150), and by as much as the band itself has grown louder at once: a
//   band that has grown loud is never thrown forward by a lift that stood
//   there.
// - Level hold. The frame is turned down by what the lifts add to its power
//   as it will be heard, Mix counted in, so Reveal changes the balance
//   inside a sound and not its level. The hold lets go at once when
//   something loud comes in (an attack is never turned down for what stood
//   lifted before it) and takes hold again no faster than the lifts fall
//   back, from where it stood before if the loud sound was short: what
//   stays lifted when a note stops glides down (after one step of a
//   decibel) and does not drop, and a short loud sound leaves everything
//   after it as it was. Within a decibel of where it has settled it follows
//   every frame exactly. It remembers no level, only how far it was
//   turning down.
//
// A bin's gain is its band's (its owner's band's); bins under the first
// band and over the last pass as they are. Gains are read once per frame;
// the overlap of the frames crossfades every change over 43 ms.
//
// Ceiling. The level is held, the crests are not: many quiet partials
// lifted make a denser wave. So the lifted sound is bent under a ceiling
// that follows the input: up to 4.5 dB over the loudest sample that came in
// of late (falling 3 dB a second) it passes as it is, and above that it
// bends towards 5.9 dB over it, which it never reaches. It is a curve, not a
// gain that moves, so it cannot pump; at the default it is never reached on
// a full-scale chord. What it costs is where one bright held note with all
// its partials in step is levelled right out: that wave's crests would stand
// 8 dB over the input's, and bending them takes up to 0.8 dB off its level.
//
// Listen plays only what is added: every bin by its gain less one, at full
// whatever Mix says.
//
// meter(0) is the largest lift in force in dB. The rest are for the display:
// 1 the level hold in dB, 2 to 23 the lift of every band and 24 to 45 its
// level, four bands to a reading, six bits each, the level counted down
// from the loudest band of late; 46 that loudest level in dB.
//
// Storage: two kit::Stft<2048, 512> (88 KB each) and about 20 KB of tables
// and state per bin and per band. Nothing is sized by the sample rate.
//
// It sleeps once nothing comes in, the frames in flight have played out and
// no band holds a level or a lift: about a second after the sound. What it
// remembers longer (the loudest band and the loudest sample of late) is
// worked out from the sample clock, which runs on through the sleep
// (Stft::skip), so neither the sleep nor the block size can be heard.

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
  static constexpr float kLiftStepDb = 0.5f;   // a lift is reported in half decibels
  static constexpr float kLevelStepDb = 1.5f;  // a level in steps of 1.5 dB up from kLevelFootDb
  static constexpr float kLevelFootDb = -91.5f;  // under the loudest band of late
  static constexpr int kTopMeter = 2 + 2 * kReadings;  // meter 46: the loudest band of late, dB
  // The loudest band of late, which Floor is counted down from: held this
  // long after anything was last as loud, then falling.
  static constexpr float kTopHoldSeconds = 5.0f;
  static constexpr float kTopFallDbPerSecond = 3.0f;
  static constexpr float kTopMostDb = 6.0f;      // no band counts for louder than this
  static constexpr float kLowestFloorDb = -96.0f;  // nothing under this is lifted, whatever Floor says
  // The ceiling over the lifted sound, as gains on the loudest sample of late.
  static constexpr float kCeilingKnee = 1.6788040f;  // +4.5 dB: under this it passes as it is
  static constexpr float kCeilingTop = 1.9724227f;   // +5.9 dB: what it bends towards
  static constexpr float kCeilingFallDbPerSecond = 3.0f;
  static_assert(kReadings * kBandsPerReading == kMaxBands, "whole readings");

  // How the bands lie, for the harness and the display's test.
  int bands() const { return bands_; }
  float band_hz(int band) const { return centre_bin_[band] * sample_rate() * (1.0f / Stft::kFrame); }
  float lift_db(int band) const { return applied_[band]; }
  // The loudest band of late, in dB against a full-scale sine, and where Floor stands under it.
  float top_db() const { return top_now_; }
  float floor_db() const { return floor_now_; }
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
    top_hold_frames_ = static_cast<uint32_t>(kTopHoldSeconds * frames_per_second + 0.5f);
    top_fall_ = kTopFallDbPerSecond / frames_per_second;
    ceiling_fall_ = kCeilingFallDbPerSecond / frames_per_second;
    close_step_ = 1.0f / (kCloseSeconds * frames_per_second);
    rest_after_ = Stft::kLatency + Stft::kFrame + Stft::kHop;
    mix_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    listen_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    output_.snap(kit::db_to_gain(param(kOutput)));
    listen_.snap(param(kListen) >= 0.5f ? 1.0f : 0.0f);
    rest();
    clock_ = 0;
    quiet_run_ = rest_after_;
    top_db_ = kNoneDb;
    top_frame_ = 0;
    top_now_ = 0.0f;
    floor_now_ = param(kFloor);
    peak_ = 0.0f;
    peak_frame_ = 0;
    ceiling_ = 0.0f;
    detail_seen_ = -1.0f;
    idle_.reset(sr, static_cast<float>(rest_after_) / sr);
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
  // their levels under the loudest band of late, six bits a band with the
  // lowest band in the lowest bits, which a float holds exactly; 46 the
  // loudest band of late in dB (0 at rest).
  float meter(int index) const {
    if (index == 0) return most_lift_;
    if (index == 1) return hold_db_;
    if (index >= 2 && index < 2 + kReadings) return lift_reading_[index - 2];
    if (index >= 2 + kReadings && index < 2 + 2 * kReadings) return level_reading_[index - 2 - kReadings];
    if (index == kTopMeter) return top_reading_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive_)) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      clock_ += static_cast<uint32_t>(frames);
      forget_old();
      quiet_run_ = rest_after_;
      // A knob moved while asleep does not glide in.
      mix_.snap(mix_.target);
      output_.snap(output_.target);
      listen_.snap(listen_.target);
      // Asleep, the readings are at rest.
      top_reading_ = 0.0f;
      return;
    }
    // The ceiling as the clock has it now: the same whether the samples
    // since the last frame were worked through or slept through.
    forget_old();
    ceiling_ = ceiling_at(clock_ / Stft::kHop);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // At rest (nothing held, and nothing but silence for as long as a
      // sound takes to pass through) a knob that is moved does not glide
      // in. Counted in samples, so that it is the same at every block size.
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (quiet_run_ < rest_after_) ++quiet_run_;
      } else {
        quiet_run_ = 0;
      }
      if (quiet_run_ >= rest_after_ && !alive_) {
        mix_.snap(mix_.target);
        output_.snap(output_.target);
        listen_.snap(listen_.target);
      }
      const float mix = mix_.next();
      const float trim = output_.next();
      const float listen = listen_.next();
      // Listen all the way over: the dry sound gone, and what is added at
      // full whatever Mix says.
      const float dry_gain = (1.0f - mix) * (1.0f - listen);
      const float wet_gain = (mix + listen * (1.0f - mix)) * trim;
      // The loudest sample of late, which the ceiling follows. A sample the
      // frames take as nothing (not a number, or absurd) counts for nothing.
      if ((clock_ & (Stft::kHop - 1)) == 0) ceiling_ = ceiling_at(clock_ / Stft::kHop);
      for (int c = 0; c < 2; ++c) {
        const float size = in[c] < 0.0f ? -in[c] : in[c];
        if (size < kInputLimit && size > ceiling_) {
          ceiling_ = size;
          peak_ = size;
          peak_frame_ = clock_ / Stft::kHop;
        }
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        const float dry = stft_[c].dry();
        // With nothing of the wet side in it the output is the dry sound to the last bit.
        out[c] = wet_gain == 0.0f ? dry : dry * dry_gain + bent(wet) * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
      ++clock_;
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
  // A lift that is no longer asked for falls back this many dB a second: 3
  // over Rise in seconds, between these.
  static constexpr float kSlowestFall = 3.0f;
  static constexpr float kFastestFall = 150.0f;
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
  static constexpr float kCloseSeconds = 0.2f;       // a band under Floor is let go of over this
  static constexpr float kHoldNearDb = 1.0f;         // the level hold follows exactly this far under where it has settled
  // A band's power under this is nothing: -180 dB against a full-scale sine.
  static constexpr float kNothing = 1.0e-18f;
  // The power of a full-scale sine on both channels, over the three bins it fills.
  static constexpr float kSinePower = 2.0f * 1.5f * Stft::kFullScale * Stft::kFullScale;
  // A sample at or over this the frames take as nothing (Stft's own guard).
  static constexpr float kInputLimit = 64.0f;
  // Frames are numbered by the sample clock, which wraps: 2^32 samples, so 2^23 frames of 512.
  static constexpr uint32_t kFrameMask = 0xffffffffu / Stft::kHop;
  static constexpr float kCeilingNone = 1.0e-12f;  // with no input to speak of there is no ceiling

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
      applied_[b] = 0.0f;
      open_[b] = 0.0f;
      level_db_[b] = kNoneDb;
      band_gain_[b] = 1.0f;
    }
    band_gain_[kNoBand] = 1.0f;
    for (int r = 0; r < kReadings; ++r) {
      lift_reading_[r] = 0.0f;
      level_reading_[r] = 0.0f;
    }
    hold_ = 1.0f;
    settled_db_ = 0.0f;
    hold_db_ = 0.0f;
    most_lift_ = 0.0f;
    top_reading_ = 0.0f;
    listen_frame_ = 0.0f;
    alive_ = false;
  }

  // The loudest sample of late as it stands at frame `frame` of the sample
  // clock: what it was when it came, 3 dB a second down since. Worked out
  // from the clock alone, so it needs no work while the device sleeps.
  float ceiling_at(uint32_t frame) const {
    if (!(peak_ > 0.0f)) return 0.0f;
    const uint32_t since = (frame - peak_frame_) & kFrameMask;
    const float fallen = static_cast<float>(since) * ceiling_fall_;
    return fallen < 400.0f ? peak_ * std::exp(-0.11512925f * fallen) : 0.0f;
  }

  // The lifted sound under its ceiling: as it is up to kCeilingKnee times
  // the loudest sample of late, bending from there towards kCeilingTop times
  // it. A curve with the slope of a straight wire where it begins.
  float bent(float wet) const {
    const float knee = kCeilingKnee * ceiling_;
    const float size = wet < 0.0f ? -wet : wet;
    if (size <= knee || ceiling_ < kCeilingNone) return wet;
    const float room = (kCeilingTop - kCeilingKnee) * ceiling_;
    const float over = (size - knee) / room;
    const float shaped = knee + room * over / (1.0f + over);
    return wet < 0.0f ? -shaped : shaped;
  }

  // The loudest band of late as it stands at frame `frame`: held for
  // kTopHoldSeconds, then 3 dB a second down. kNoneDb when there is none.
  float top_at(uint32_t frame) const {
    if (top_db_ <= kNoneDb) return kNoneDb;
    const uint32_t since = (frame - top_frame_) & kFrameMask;
    if (since <= top_hold_frames_) return top_db_;
    const float fallen = static_cast<float>(since - top_hold_frames_) * top_fall_;
    return fallen < 400.0f ? top_db_ - fallen : kNoneDb;
  }

  // What has fallen all the way is forgotten, once a block. The two ages
  // above are counted on a clock that comes round (2^32 samples: a day at
  // 48 kHz, six hours at 192), and a loudest sample or band a whole round
  // old read as new again: a sound that came back just then, after a day's
  // sleep, was held to the ceiling and the Floor of the day before.
  void forget_old() {
    const uint32_t frame = clock_ / Stft::kHop;
    if (peak_ > 0.0f && !(ceiling_at(frame) > 0.0f)) peak_ = 0.0f;
    if (top_db_ > kNoneDb && !(top_at(frame) > kNoneDb)) top_db_ = kNoneDb;
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
    // How fast a lift that is no longer asked for falls back, per frame, in
    // dB; and the same as a power, for what the level hold remembers.
    const float fall_db = kit::clamp(3.0f / rise_seconds, kSlowestFall, kFastestFall) / frames_per_second_;
    // This frame's number on the sample clock (the frame comes before its sample is counted).
    const uint32_t now = clock_ / Stft::kHop;

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
    float loudest = kNoneDb;
    bool alive = false;
    for (int b = 0; b < bands_; ++b) {
      float held = level_[b] * level_fall_;
      if (sum[b] > held) held = sum[b];
      if (held < kNothing * kSinePower) held = 0.0f;
      level_[b] = held;
      alive = alive || held > 0.0f;
      level_db[b] = held > 0.0f ? 10.0f * std::log10(held * (1.0f / kSinePower)) : kNoneDb;
      if (level_db[b] > loudest) loudest = level_db[b];
    }
    for (int b = bands_; b < kMaxBands; ++b) level_db[b] = kNoneDb;

    // The loudest band of late, which Floor is counted down from. It goes up
    // at once, stays for 5 s after anything was last as loud, and then falls
    // until it meets what sounds.
    if (loudest > kTopMostDb) loudest = kTopMostDb;
    float top = top_at(now);
    if (loudest > kNoneDb && loudest >= top) {
      top = loudest;
      top_db_ = top;
      top_frame_ = now;
    }
    top_now_ = top > kNoneDb ? top : 0.0f;
    top_reading_ = top_now_;
    const float floor_db = kit::max(top_now_ + param(kFloor), kLowestFloorDb);
    floor_now_ = floor_db;

    // The loud around each band: a tent over what is loud in this frame, 3 dB down per octave.
    float around_db[kMaxBands];
    around_db[0] = level_db[0];
    for (int b = 1; b < bands_; ++b) around_db[b] = kit::max(level_db[b], around_db[b - 1] - around_step_[b]);
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

    // The lift held moves up towards that over Rise. When less is asked it
    // falls back steadily, and at once by as much as the band itself has
    // grown louder since the frame before: a band that has grown loud is not
    // thrown forward. A band with nothing in it holds no lift.
    float most = 0.0f;
    for (int b = 0; b < bands_; ++b) {
      const float target = ask[b];
      float held = lift_[b];
      if (target >= held) {
        held = target + (held - target) * rise;
      } else {
        const float grown = level_db[b] - level_db_[b];
        held -= fall_db + (grown > 0.0f ? grown : 0.0f);
        if (held < target) held = target;
      }
      if (held < kRestDb) held = target < kRestDb ? 0.0f : held;
      if (!(level_[b] > 0.0f)) held = 0.0f;
      lift_[b] = held;
      level_db_[b] = level_db[b];
      alive = alive || held > 0.0f;
      // A band under Floor is let go of: what it holds comes off it, and is
      // back once it is over Floor again.
      float open = open_[b];
      if (level_db[b] >= floor_db) {
        open = 1.0f;
      } else {
        open -= close_step_;
        if (open < 0.0f) open = 0.0f;
      }
      open_[b] = open;
      const float applied = held * open;
      applied_[b] = applied;
      if (applied > most) most = applied;
      band_gain_[b] = applied > 0.0f ? std::exp(applied * 0.11512925f) : 1.0f;  // 10^(dB / 20)
    }
    most_lift_ = most;

    // A bin's gain is its band's, and an owned bin takes its owner's; bins
    // under the first band and over the last pass as they are. Then the
    // power the frame comes in with, and what the gains make of it once and twice.
    band_gain_[kNoBand] = 1.0f;
    float power_in = 0.0f;
    float power_once = 0.0f;
    float power_out = 0.0f;
    for (int k = 0; k < kBins; ++k) {
      const float gain = band_gain_[bin_band_[owner_[k]]];
      gain_[k] = gain;
      const float lifted = power_[k] * gain;
      power_in += power_[k];
      power_once += lifted;
      power_out += lifted * gain;
    }

    // Level hold: the frame is turned down by what the lifts add to its
    // power as it is heard. With Mix part-way that is the power of
    // (1 - mix) + mix x gain x hold in every bin, a quadratic in the hold.
    float exact_db = 0.0f;
    if (power_out > power_in && power_in > 0.0f) {
      const float mix = listen_frame_ > 0.5f ? 1.0f : param(kMix);
      const float came = (2.0f - mix) * power_in;
      const float once = 2.0f * (1.0f - mix) * power_once;
      const float twice = mix * power_out;
      const float exact = 2.0f * came / (once + std::sqrt(once * once + 4.0f * twice * came));
      if (exact < 1.0f) exact_db = 20.0f * std::log10(exact);
    }
    // It lets go at once and takes hold again no faster than a lift falls
    // back: `settled_db_` goes after what the frame asks at that pace, both
    // ways, and the hold is never more than a decibel below it. So the hold
    // follows a sound's own flutter exactly, a short loud sound leaves it
    // where it was, and after a long one it glides.
    float settled = settled_db_;
    if (exact_db > settled + fall_db) settled += fall_db;
    else if (exact_db < settled - fall_db) settled -= fall_db;
    else settled = exact_db;
    settled_db_ = alive ? settled : 0.0f;
    float hold_db = exact_db > settled - kHoldNearDb ? exact_db : settled - kHoldNearDb;
    if (hold_db > -0.001f) hold_db = 0.0f;
    hold_db_ = hold_db;
    hold_ = hold_db < 0.0f ? std::exp(hold_db * 0.11512925f) : 1.0f;
    alive_ = alive;

    // What the display reads: four bands to a number, six bits each, the
    // levels counted down from the loudest band of late.
    for (int r = 0; r < kReadings; ++r) {
      int lifts = 0;
      int levels = 0;
      for (int b = r * kBandsPerReading + kBandsPerReading - 1; b >= r * kBandsPerReading; --b) {
        int lift_steps = 0;
        int level_steps = 0;
        if (b < bands_) {
          lift_steps = kit::clamp_int(static_cast<int>(applied_[b] * (1.0f / kLiftStepDb) + 0.5f), 0, kSteps - 1);
          level_steps = kit::clamp_int(
              static_cast<int>((level_db[b] - top_now_ - kLevelFootDb) * (1.0f / kLevelStepDb) + 0.5f), 0,
              kSteps - 1);
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
  float level_[kMaxBands] = {};     // power, held
  float level_db_[kMaxBands] = {};  // the same in dB, as the frame before left it
  float lift_[kMaxBands] = {};      // dB, held
  float open_[kMaxBands] = {};      // 0 to 1: how much of it a band is given (none under Floor)
  float applied_[kMaxBands] = {};   // dB: the lift in force
  float band_gain_[kNoBand + 1] = {};  // the last is kNoBand's: 1
  float lift_reading_[kReadings] = {};
  float level_reading_[kReadings] = {};
  kit::Smoother mix_, output_, listen_;
  kit::IdleGate idle_;
  int bands_ = 2;
  int rest_after_ = 1;  // samples of silence after which nothing is in flight
  int quiet_run_ = 0;   // samples of silence in a row, up to rest_after_
  uint32_t clock_ = 0;  // samples since init, slept through or not
  float frames_per_second_ = 93.75f;
  float level_fall_ = 0.0f;
  float settled_db_ = 0.0f;  // where the level hold has settled, dB: it goes after what each frame asks
  float top_db_ = kNoneDb;      // the loudest band of late, as it was at frame top_frame_
  uint32_t top_frame_ = 0;
  uint32_t top_hold_frames_ = 0;
  float top_fall_ = 0.0f;       // dB per frame, once the hold is over
  float top_now_ = 0.0f;        // as the last frame had it (0 with none)
  float floor_now_ = 0.0f;      // where Floor stood in the last frame, dB
  float top_reading_ = 0.0f;
  float peak_ = 0.0f;           // the loudest sample of late, as it was at frame peak_frame_
  uint32_t peak_frame_ = 0;
  float ceiling_fall_ = 0.0f;   // dB per frame
  float close_step_ = 0.0f;     // per frame: how fast a band under Floor is let go of
  float ceiling_ = 0.0f;        // the loudest sample of late as it stands now
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
