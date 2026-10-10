#pragma once

// Sine Shadow: the strongest partials of the sound, each replayed by one pure
// sine oscillator that swells in behind it and lingers after it.
//
//   in ──┬───────────────────────────────────────────────► dry ──┐
//        │                                                       (mix, equal power) ──► out
//        └─► spectrum ─► peaks ─► followed partials ─► sines ─► ceiling ─► wet ──┘
//            (kit::Stft,          (matched frame       (one oscillator
//             analysis only)       to frame)            per partial)
//
// - The spectrum is only measured (Stft::analyse), never resynthesised: the
//   shadow is made by oscillators, so the device adds no latency and the dry
//   path is the input itself. Both channels are measured, on the same frames,
//   and a partial is a peak of their summed power: a sound that is out of
//   phase between the sides casts the same shadow as one that is not.
// - A peak is a partial when it was there in the frame before (its frequency
//   is the turn its phase made between the two, Stft::advance_to_bin), is not
//   a side lobe of a stronger one (the Hann window's own skirt, with a margin)
//   and has lasted as long as Steady asks. The Partials strongest are
//   followed; one that is followed keeps its place until another is twice as
//   strong, so two partials of about one level do not trade places every
//   frame.
// - A sine follows its partial's level through an attack and a release of its
//   own, and its frequency through Glide. When the partial is lost the sine
//   lingers (Release) at the pitch it had; if the partial comes back while it
//   still sounds, the same sine takes it up again. A new sine starts at the
//   pitch of the nearest sine still sounding and glides from there.
// - With Transpose and Snap at zero a sine keeps a quarter turn from its
//   partial's own phase (a slow phase lock, on one side or the other by the
//   note), so sound and shadow add as powers at every Mix: a held tone can
//   neither cancel against its shadow nor double with it.
// - The ceiling holds the sum of the sines' levels on either side at
//   kCeiling, by a gain on the whole shadow and not by a waveshaper: however
//   many sines linger, the shadow's peak stays under it and stays pure.
//
// Storage: two channels of Stft<4096, 1024> (176 KB each, in use up to 60 kHz)
// and two of Stft<8192, 2048> (352 KB each, in use above: the same 12 Hz bins
// and 21 ms frames at 96 kHz), six half spectra and three per-bin tables of
// 4097 floats, and the 48 oscillators. No delay line: latency is zero.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class SineShadow : public kit::DeviceBase<sine_shadow::kNumParams> {
 public:
  // The oscillators: as many as can be followed at once, and as many again
  // to linger after their partials have gone.
  static constexpr int kPool = 48;
  // The sines reported to the display, loudest first: a frequency in hertz
  // and a level each (meters 2n and 2n + 1).
  static constexpr int kShown = 24;
  // The sum of the sines' levels on one side never passes this (+6 dB over a
  // full-scale sine; the 24 strongest partials of a full-scale saw sum to 2.4).
  static constexpr float kCeiling = 2.0f;
  // A partial keeps its place among the followed until another is this many
  // times as strong.
  static constexpr float kKeep = 2.0f;
  // A peak belongs to the sine that follows it when it is within this share
  // of its frequency (about half a semitone), or this many bins if that is
  // more.
  static constexpr float kCatchRatio = 0.03f;
  static constexpr float kCatchBins = 0.6f;
  // What Steady counts as a frame in which a partial held: its pitch within
  // kHeldBins of the frame before and its level within kHeldStep (4 dB); or,
  // for a partial with vibrato, its pitch within kSwayBins and kSwayRatio of
  // its frequency (a wide vibrato moves 1.7 % in a frame) and its level
  // within kSwayStep (0.7 dB). Measured on white noise, a peak moves more
  // than 0.8 bins from one frame to the next six times in ten and holds its
  // level to 0.5 dB two times in ten; a held note does neither.
  static constexpr float kHeldBins = 0.25f;
  static constexpr float kHeldStep = 1.585f;
  static constexpr float kSwayBins = 0.3f;
  static constexpr float kSwayRatio = 0.018f;
  static constexpr float kSwayStep = 1.084f;
  static constexpr int kSpare = 4;
  // A peak whose phase turns at a pitch further than this from its own bin
  // is a side lobe, or nothing: a moving partial's turn can be a bin off.
  static constexpr float kOffBins = 1.5f;
  // The longest Steady asks a partial to last, in seconds (at 1; it goes
  // with the square of the control).
  static constexpr float kSteadySeconds = 1.5f;
  // Tone leans by up to 6 dB an octave: above kDarkHz when it leans dark,
  // below kBrightHz when it leans bright. It never raises a partial.
  static constexpr float kDarkHz = 300.0f;
  static constexpr float kBrightHz = 2500.0f;
  // The partials looked for, in hertz of the input.
  static constexpr float kLowestHz = 21.0f;
  static constexpr float kHighestHz = 12000.0f;
  // A sine fades out below and above these (its own pitch, after Transpose).
  static constexpr float kFadeInLowHz = 16.0f;
  static constexpr float kFadeInHighHz = 22.0f;
  static constexpr float kFadeOutLowHz = 12000.0f;
  static constexpr float kFadeOutHighHz = 16000.0f;
  // The phase lock: the share of the error taken up per frame (less when
  // Glide is longer than a frame: then a frame's share of Glide), only while
  // the partial stands still to kStillBins from one frame to the next, and
  // never by bending the sine more than kLockRatio of its pitch and
  // kLockHz. A partial that moves is followed by Glide alone: a lock that
  // chased it would step the sine's pitch at the frame rate.
  static constexpr float kLock = 0.35f;
  static constexpr float kStillBins = 0.03f;
  static constexpr float kLockRatio = 0.003f;
  static constexpr float kLockHz = 0.4f;

  void init(float sample_rate) {
    using namespace sine_shadow;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    large_ = sr > 60000.0f;
    frame_ = large_ ? Large::kFrame : Small::kFrame;
    hop_ = large_ ? Large::kHop : Small::kHop;
    stagger_ = large_ ? Large::kMaxStagger : Small::kMaxStagger;
    bins_ = frame_ / 2 + 1;
    bin_hz_ = sr / static_cast<float>(frame_);
    full_scale_ = 0.25f * static_cast<float>(frame_);
    small_[0].init();
    small_[1].init(Small::kMaxStagger);
    large_stft_[0].init();
    large_stft_[1].init(Large::kMaxStagger);
    lo_ = kit::clamp_int(static_cast<int>(std::ceil(kLowestHz / bin_hz_)), 2, bins_ - 3);
    hi_ = kit::clamp_int(static_cast<int>(kit::min(kHighestHz, 0.45f * sr) / bin_hz_), lo_, bins_ - 3);
    for (int k = 0; k < kMaxBins; ++k) {
      now_re_[k] = now_im_[k] = 0.0f;
      for (int c = 0; c < 2; ++c) last_re_[c][k] = last_im_[c][k] = 0.0f;
      power_[k] = 0.0f;
      weight_[k] = 1.0f;
      log2_hz_[k] = k > 0 ? std::log2(static_cast<float>(k) * bin_hz_) : 0.0f;
    }
    for (Voice& v : voices_) v = Voice();
    active_count_ = 0;
    shown_count_ = 0;
    weight_tone_ = -1.0f;
    ceiling_gain_ = 1.0f;
    retune_ = false;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    mix_seen_ = -1.0f;
    pan_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    fade_coeff_ = 1.0f - kit::time_to_coeff(0.002f, sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    retune_ = false;
    // Two frames of silence empty the spectra this one and the one before:
    // only then is nothing left that a new sound could be measured against.
    idle_.reset(sr, 2.0f * static_cast<float>(frame_) / sr);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: the
  // kShown loudest sines as they sound now, loudest first. Meter 2n is sine
  // n's frequency in hertz and 2n + 1 its level (1 is a full-scale sine),
  // after the ceiling and before Mix. Both are 0 for a place with no sine in
  // it, and for every place while the device sleeps.
  float meter(int index) const {
    if (index < 0 || index >= 2 * kShown) return 0.0f;
    const int place = index >> 1;
    if (place >= shown_count_) return 0.0f;
    const Voice& v = voices_[shown_[place]];
    if (v.state == kFree) return 0.0f;
    return (index & 1) ? v.env * ceiling_gain_ : static_cast<float>(v.inc * sample_rate());
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || active_count_ > 0)) {
      silence_output(frames);
      // The frame clock runs on through the sleep.
      if (large_) {
        large_stft_[0].skip(frames);
        large_stft_[1].skip(frames);
      } else {
        small_[0].skip(frames);
        small_[1].skip(frames);
      }
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in
      shown_count_ = 0;
      ceiling_gain_ = 1.0f;
      retune_ = false;
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // What is not a number, or is absurd, is silence: the same rule the
      // spectrum is kept to (kit::Stft), so sound and shadow agree.
      in[0] = guarded(in[0]);
      in[1] = guarded(in[1]);
      if (retune_) {
        retune_ = false;
        for (int n = 0; n < active_count_; ++n) aim(voices_[active_[n]]);
      }
      if (large_) {
        large_stft_[0].analyse(in[0], [this](const float* re, const float* im) { keep(re, im); });
        large_stft_[1].analyse(in[1], [this](const float* re, const float* im) { track(re, im); });
      } else {
        small_[0].analyse(in[0], [this](const float* re, const float* im) { keep(re, im); });
        small_[1].analyse(in[1], [this](const float* re, const float* im) { track(re, im); });
      }
      float wet[2];
      render(&wet[0], &wet[1]);
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        if (mix >= 1.0f) dry_gain_ = 0.0f;  // equal_power(1) leaves -4e-8 there
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Small = kit::Stft<4096, 1024>;
  using Large = kit::Stft<8192, 2048>;
  static constexpr int kMaxBins = Large::kBins;
  static constexpr int kMaxPeaks = 48;
  // A sine under this is over: -120 dBFS.
  static constexpr float kSilent = 1.0e-6f;
  // Peaks under this share of the frame's strongest (-60 dB), or under this
  // level (-84 dBFS), are not looked at.
  static constexpr float kRelativeFloor = 1.0e-6f;  // of power
  static constexpr float kAbsoluteFloor = 6.0e-5f;  // of a full-scale sine
  // A peak counts once the frame before held at least a quarter of it there.
  static constexpr float kEstablished = 0.0625f;  // of power
  // The side lobes of a stronger partial are taken for it up to this margin
  // over the Hann window's own skirt, 1 / (π d (d² - 1)) at d bins.
  static constexpr float kSkirtMargin = 4.0f;

  enum State { kFree = 0, kFollowing, kLingering, kFading };

  struct Voice {
    int state = kFree;
    int age = 0;           // frames it has followed its partial
    int side = 0;          // the channel its phase is read from
    bool still = false;    // its partial stood still since the frame before
    float bin = 0.0f;      // the partial's frequency, in bins of the input
    float level = 0.0f;    // the partial's level as last measured
    float lean = 1.0f;     // what Tone makes of it
    float band = 1.0f;     // the fade at the ends of the range, at its own pitch
    float angle = 0.0f;    // where the partial lies between the sides, 0 left to π/2 right
    float place = 0.0f;    // where Spread puts the sine, -1 to 1
    float flip = 0.0f;     // 0 or half a turn: which side of its partial's phase it keeps to
    // What the oscillator runs on, sample by sample.
    float env = 0.0f, env_target = 0.0f, env_coeff = 0.0f;
    float gain_left = 1.0f, gain_right = 1.0f, left_target = 1.0f, right_target = 1.0f;
    // Pitch and phase are doubles: a float glide stalls a ten-thousandth
    // short of its pitch at 40 ms (a hundredth at 2 s) and stays there.
    double inc = 0.0, inc_target = 0.0;  // cycles per sample
    double phase = 0.0;                  // cycles
    double goal = 0.0;                   // the phase its partial asks for at the frame, cycles
    float slew = 0.0f;                   // cycles per sample, of lock
  };

  struct Peak {
    int k = 0;
    int voice = -1;
    bool chosen = false;
    float power = 0.0f;
    float bin = 0.0f;
    float left = 0.0f, right = 0.0f, level = 0.0f, score = 0.0f;
  };

  static float guarded(float x) { return (x > -64.0f && x < 64.0f) ? x : 0.0f; }

  void apply(int id) {
    using namespace sine_shadow;
    const float sr = sample_rate();
    switch (id) {
      case kTranspose:
      case kSnap:
      case kSpread:
        retune_ = true;  // every sine is aimed again before the next sample
        break;
      case kAttack:
        // The time is to nine tenths of the way.
        attack_coeff_ = 1.0f - kit::time_to_coeff(param(kAttack) * 0.001f / 2.3025851f, sr);
        break;
      case kRelease:
        // The time is to 60 dB down.
        release_coeff_ = 1.0f - kit::time_to_coeff(param(kRelease) / 6.9077553f, sr);
        break;
      case kGlide: {
        glide_coeff_ = 1.0f - kit::time_to_coeff(param(kGlide) * 0.001f, sr);
        const float share = static_cast<float>(hop_) / (param(kGlide) * 0.001f * sr);
        lock_ = share < kLock ? share : kLock;
        break;
      }
      case kMix:
        mix_.set(param(kMix), primed());
        break;
      default:
        break;  // Partials, Steady and Tone are read once per frame
    }
  }

  // What Tone makes of a partial at `hz`: 1 at the centre, and never more.
  static float lean(float tone, float log2_hz) {
    const float x = 2.0f * tone - 1.0f;
    if (x < 0.0f) {
      const float octaves = log2_hz - 8.2288187f;  // log2(kDarkHz)
      return octaves > 0.0f ? std::exp2(x * octaves) : 1.0f;
    }
    const float octaves = log2_hz - 11.287712f;  // log2(kBrightHz)
    return octaves < 0.0f ? std::exp2(x * octaves) : 1.0f;
  }

  // The fade at the two ends of what a sine may sound at.
  float band(float hz) const {
    const float top = kit::min(kFadeOutHighHz, 0.42f * sample_rate());
    const float knee = top * (kFadeOutLowHz / kFadeOutHighHz);
    if (hz <= kFadeInLowHz || hz >= top) return 0.0f;
    if (hz < kFadeInHighHz) return (hz - kFadeInLowHz) / (kFadeInHighHz - kFadeInLowHz);
    if (hz > knee) return (top - hz) / (top - knee);
    return 1.0f;
  }

  // Where a sine is heading: its pitch from its partial's, Transpose and
  // Snap; its level from the partial's, Tone and the ends of the range; its
  // place from the partial's own and Spread.
  void aim(Voice& v) {
    using namespace sine_shadow;
    // The pitch in doubles, and untouched where nothing moves it: a sine
    // in unison with its partial is at the frequency that was measured.
    double hz = static_cast<double>(kit::max(v.bin, 0.5f)) * bin_hz_;
    const double transpose = std::floor(param(kTranspose) + 0.5f);
    const double snap = param(kSnap);
    if (transpose != 0.0 || snap != 0.0) {
      double note = 69.0 + 12.0 * std::log2(hz / 440.0) + transpose;
      note += snap * (std::floor(note + 0.5) - note);
      hz = 440.0 * std::exp2((note - 69.0) / 12.0);
    }
    v.inc_target = hz / sample_rate();
    v.band = band(static_cast<float>(hz));
    const bool heard = v.state == kFollowing && v.age >= need_;
    v.env_target = heard ? v.level * v.lean * v.band : 0.0f;
    if (v.state == kFading) {
      v.env_coeff = fade_coeff_;
    } else {
      v.env_coeff = v.env_target > v.env ? attack_coeff_ : release_coeff_;
    }
    const float angle = kit::lerp(v.angle, 0.25f * kit::kPi * (1.0f + v.place), param(kSpread));
    v.left_target = 1.4142136f * std::cos(angle);
    v.right_target = 1.4142136f * std::sin(angle);
  }

  // The left channel's frame comes first (kit::Stft's stagger): it is kept
  // until the right channel's frame of the same stretch of input arrives.
  void keep(const float* re, const float* im) {
    for (int k = 0; k < bins_; ++k) {
      now_re_[k] = re[k];
      now_im_[k] = im[k];
    }
  }

  // One frame, both channels: the peaks, which of them are partials, which
  // sine follows which, and where every sine is heading until the next.
  void track(const float* re, const float* im) {
    using namespace sine_shadow;
    const float* re0 = now_re_;
    const float* im0 = now_im_;
    const float tone = param(kTone);
    if (tone != weight_tone_) {
      weight_tone_ = tone;
      for (int k = 1; k < bins_; ++k) weight_[k] = lean(tone, log2_hz_[k]);
    }
    need_ = static_cast<int>(kSteadySeconds * param(kSteady) * param(kSteady) * sample_rate() /
                             static_cast<float>(hop_) + 0.5f);

    // The power of both channels together, and its peaks, strongest first.
    float top = 0.0f;
    for (int k = lo_ - 1; k <= hi_ + 1; ++k) {
      const float p = re0[k] * re0[k] + im0[k] * im0[k] + re[k] * re[k] + im[k] * im[k];
      power_[k] = p;
      if (p > top) top = p;
    }
    int found = 0;
    const float least = 2.0f * (kAbsoluteFloor * full_scale_) * (kAbsoluteFloor * full_scale_);
    if (top > least) {
      const float floor = kit::max(least, top * kRelativeFloor);
      for (int k = lo_; k <= hi_; ++k) {
        const float p = power_[k];
        if (!(p > floor && p > power_[k - 1] && p >= power_[k + 1])) continue;
        if (found == kMaxPeaks && p <= rough_power_[found - 1]) continue;
        int at = found < kMaxPeaks ? found++ : kMaxPeaks - 1;
        for (; at > 0 && rough_power_[at - 1] < p; --at) {
          rough_power_[at] = rough_power_[at - 1];
          rough_bin_[at] = rough_bin_[at - 1];
        }
        rough_power_[at] = p;
        rough_bin_[at] = k;
      }
    }

    // Which peaks are partials: there in the frame before, turning at their
    // own bin's pitch, and clear of the skirt of anything stronger.
    int count = 0;
    for (int n = 0; n < found; ++n) {
      const int k = rough_bin_[n];
      const float p = rough_power_[n];
      const float* r1 = last_re_[1];
      const float* i1 = last_im_[1];
      const float* r0 = last_re_[0];
      const float* i0 = last_im_[0];
      const float before = r0[k] * r0[k] + i0[k] * i0[k] + r1[k] * r1[k] + i1[k] * i1[k];
      if (before < p * kEstablished) continue;
      // The turn since the frame before, both channels together: each
      // channel's own phase drops out of it, so the sides need not agree.
      const float turn_re = re0[k] * r0[k] + im0[k] * i0[k] + re[k] * r1[k] + im[k] * i1[k];
      const float turn_im = im0[k] * r0[k] - re0[k] * i0[k] + im[k] * r1[k] - re[k] * i1[k];
      const float bin = Small::advance_to_bin(k, kit::fast_atan2(turn_im, turn_re));
      const float off = bin - static_cast<float>(k);
      if (off > kOffBins || off < -kOffBins) continue;
      bool skirt = false;
      for (int m = 0; m < count && !skirt; ++m) {
        const float d = std::fabs(bin - peaks_[m].bin);
        if (d < 1.5f) {
          skirt = true;  // one lobe, two bumps
        } else if (d < 32.0f) {
          const float lobe = kSkirtMargin / (kit::kPi * d * (d * d - 1.0f));
          skirt = p < peaks_[m].power * lobe * lobe;
        }
      }
      if (skirt) continue;
      // The level: the power of the peak's bin and the two beside it. A
      // Hann-windowed sine leaves 1.5 times its own bin's full-scale power
      // over its whole lobe wherever it lies between two bins, and 98 % of
      // that or more in these three; a partial that moves within the frame
      // spreads wider and reads a little low, never high.
      const float scale = 1.0f / (1.5f * full_scale_ * full_scale_);
      const float left = (re0[k - 1] * re0[k - 1] + im0[k - 1] * im0[k - 1] + re0[k] * re0[k] + im0[k] * im0[k] +
                          re0[k + 1] * re0[k + 1] + im0[k + 1] * im0[k + 1]) * scale;
      const float right = (re[k - 1] * re[k - 1] + im[k - 1] * im[k - 1] + re[k] * re[k] + im[k] * im[k] +
                           re[k + 1] * re[k + 1] + im[k + 1] * im[k + 1]) * scale;
      Peak& peak = peaks_[count++];
      peak.k = k;
      peak.power = p;
      peak.bin = bin;
      peak.left = std::sqrt(left);
      peak.right = std::sqrt(right);
      peak.level = std::sqrt(0.5f * (left + right));
      peak.voice = -1;
      peak.chosen = false;
    }

    last_count_ = count;
    // Each partial goes to the sine nearest in pitch that follows or
    // lingers; what it scores is its level as Tone weighs it, doubled while
    // it is being followed already.
    for (int n = 0; n < active_count_; ++n) claimed_[active_[n]] = -1;
    for (int m = 0; m < count; ++m) {
      Peak& peak = peaks_[m];
      float nearest = kit::max(kCatchBins, kCatchRatio * peak.bin);
      for (int n = 0; n < active_count_; ++n) {
        const int index = active_[n];
        const Voice& v = voices_[index];
        if ((v.state != kFollowing && v.state != kLingering) || claimed_[index] >= 0) continue;
        const float d = std::fabs(v.bin - peak.bin);
        if (d < nearest) {
          nearest = d;
          peak.voice = index;
        }
      }
      bool kept = false;
      if (peak.voice >= 0) {
        claimed_[peak.voice] = m;
        kept = voices_[peak.voice].state == kFollowing;
      }
      peak.score = peak.level * weight_[peak.k] * (kept ? kKeep : 1.0f);
      int at = m;
      for (; at > 0 && peaks_[order_[at - 1]].score < peak.score; --at) order_[at] = order_[at - 1];
      order_[at] = m;
    }
    const int wanted = kit::clamp_int(static_cast<int>(param(kPartials) + 0.5f), 1, kShown);
    const int chosen = count < wanted ? count : wanted;
    for (int r = 0; r < chosen; ++r) peaks_[order_[r]].chosen = true;

    // A followed sine whose partial is gone, or is no longer among the
    // strongest, lets go and lingers.
    for (int n = 0; n < active_count_; ++n) {
      Voice& v = voices_[active_[n]];
      if (v.state != kFollowing) continue;
      const int m = claimed_[active_[n]];
      if (m < 0 || !peaks_[m].chosen) v.state = kLingering;
    }

    // The chosen partials: each keeps its sine, takes a lingering one up
    // again, or is given a new one.
    int born = 0;
    for (int r = 0; r < chosen; ++r) {
      const int m = order_[r];
      Peak& peak = peaks_[m];
      int index = peak.voice;
      const bool fresh = index < 0;
      if (fresh) {
        index = take();
        if (index < 0) continue;  // the pool is full: a lingering sine is fading to make room
        peak.voice = index;
        claimed_[index] = m;
        born_[born++] = index;
      }
      Voice& v = voices_[index];
      if (fresh) {
        v = Voice();
        v.state = kFollowing;
        const float note = std::floor(69.5f + 12.0f * (std::log2(peak.bin * bin_hz_) - 8.7813597f));
        // Every note has a spot of its own between the sides, far from its
        // neighbours' (the golden section), and its own side of the phase.
        const float spot = note * 0.61803399f;
        const float across = 2.0f * (spot - std::floor(spot)) - 1.0f;
        v.place = across < 0.0f ? -std::sqrt(-across) : std::sqrt(across);
        v.flip = ((static_cast<uint32_t>(note) * 2654435761u) >> 16) & 1u ? 0.5f : 0.0f;
        v.side = peak.right > peak.left ? 1 : 0;
      } else if (v.state == kLingering) {
        v.state = kFollowing;  // with the count it let go with: no second wait if it had none
      } else {
        // A frame counts for a partial when it held since the one before,
        // and counts two against it when it did not: noise makes peaks that
        // last, but not ones that hold. The count stops kSpare frames past
        // what Steady asks, so a sine that sounds rides out a bad frame.
        const float moved = std::fabs(peak.bin - v.bin);
        const float up = peak.level > v.level ? peak.level : v.level;
        const float down = peak.level > v.level ? v.level : peak.level;
        const bool held = (moved <= kHeldBins && up <= kHeldStep * down) ||
                          (moved <= kSwayBins + kSwayRatio * v.bin && up <= kSwayStep * down);
        v.age = held ? v.age + 1 : v.age - 2;
        if (v.age > need_ + kSpare) v.age = need_ + kSpare;
        if (v.age < 0) v.age = 0;
      }
      v.still = !fresh && std::fabs(peak.bin - v.bin) <= kStillBins;
      v.bin = peak.bin;
      v.level = peak.level;
      v.lean = weight_[peak.k];
      v.angle = peak.level > 0.0f ? std::atan2(peak.right, peak.left) : 0.25f * kit::kPi;
      // The phase is read from the louder side, and only changes sides for
      // one clearly louder.
      const float mine = v.side ? peak.right : peak.left;
      const float other = v.side ? peak.left : peak.right;
      if (other > 1.4f * mine) v.side ^= 1;
    }

    // The sines that are over leave; the rest are aimed.
    active_count_ = 0;
    for (int index = 0; index < kPool; ++index) {
      Voice& v = voices_[index];
      if (v.state == kFree) continue;
      if (v.state != kFollowing && v.env < kSilent) {
        v.state = kFree;
        continue;
      }
      active_[active_count_++] = index;
    }
    const bool unison = std::floor(param(kTranspose) + 0.5f) == 0.0f && param(kSnap) == 0.0f;
    for (int n = 0; n < active_count_; ++n) {
      const int index = active_[n];
      Voice& v = voices_[index];
      aim(v);
      v.slew = 0.0f;
      if (v.state != kFollowing) continue;
      // Where the partial's phase stands at the sample about to be made:
      // the bin's phase is the partial's at the frame's first sample plus
      // half a turn per bin between them (the Hann window is centred), and
      // the frame began a frame and the stagger ago.
      const Peak& peak = peaks_[claimed_[index]];
      const float* side_re = v.side ? re : re0;
      const float* side_im = v.side ? im : im0;
      const double at_start = kit::fast_atan2(side_im[peak.k], side_re[peak.k]) * (0.5 / 3.14159265358979323846) -
                              0.5 * (static_cast<double>(peak.bin) - peak.k);
      const double now = at_start + static_cast<double>(peak.bin) * (frame_ + stagger_) / frame_ + v.flip;
      v.goal = now - std::floor(now);
      if (!unison || !v.still) continue;
      // The lock, once the sine is at its partial's pitch.
      if (std::fabs(v.inc - v.inc_target) * frame_ > 0.3) continue;
      double error = v.goal - v.phase;
      error -= std::floor(error + 0.5);
      const float most = static_cast<float>(kLockRatio * v.inc_target) + kLockHz / sample_rate();
      v.slew = kit::clamp(static_cast<float>(lock_ * error / hop_), -most, most);
    }
    // A new sine starts on its partial's phase, at the pitch of the nearest
    // sine still sounding within an octave (its own where there is none).
    for (int b = 0; b < born; ++b) {
      Voice& v = voices_[born_[b]];
      v.phase = v.goal;
      v.slew = 0.0f;
      v.inc = v.inc_target;
      v.gain_left = v.left_target;
      v.gain_right = v.right_target;
      float nearest = 1.0f;  // octaves
      for (int n = 0; n < active_count_; ++n) {
        const Voice& other = voices_[active_[n]];
        if (active_[n] == born_[b] || other.env < 1.0e-3f) continue;
        const float apart = std::fabs(std::log2(static_cast<float>(other.inc / v.inc_target)));
        if (apart < nearest) {
          nearest = apart;
          v.inc = other.inc;
        }
      }
    }

    // The frame is the one before, from here on.
    for (int k = 0; k < bins_; ++k) {
      last_re_[0][k] = re0[k];
      last_im_[0][k] = im0[k];
      last_re_[1][k] = re[k];
      last_im_[1][k] = im[k];
    }

    // For the display: the loudest sines, loudest first.
    shown_count_ = 0;
    for (int n = 0; n < active_count_; ++n) {
      const int index = active_[n];
      const Voice& v = voices_[index];
      const float size = kit::max(v.env, v.env_target);
      if (!(size > 0.0f)) continue;
      int at = kShown - 1;
      if (shown_count_ < kShown) {
        at = shown_count_++;
      } else if (size <= shown_size_[at]) {
        continue;
      }
      for (; at > 0 && shown_size_[at - 1] < size; --at) {
        shown_size_[at] = shown_size_[at - 1];
        shown_[at] = shown_[at - 1];
      }
      shown_size_[at] = size;
      shown_[at] = index;
    }
  }

  // A free oscillator, or -1 when there is none: then the quietest of the
  // lingering sines is faded out (2 ms) and its place is free by the next
  // frame.
  int take() {
    int quietest = -1;
    for (int index = 0; index < kPool; ++index) {
      const Voice& v = voices_[index];
      if (v.state == kFree) return index;
      if (v.state == kLingering && (quietest < 0 || v.env < voices_[quietest].env)) quietest = index;
    }
    if (quietest >= 0) voices_[quietest].state = kFading;
    return -1;
  }

  // One sample of every sine, and the ceiling over their sum.
  void render(float* left, float* right) {
    float sum_left = 0.0f, sum_right = 0.0f;
    float most_left = 0.0f, most_right = 0.0f;
    const double glide = glide_coeff_;
    const float pan = pan_coeff_;
    for (int n = 0; n < active_count_; ++n) {
      Voice& v = voices_[active_[n]];
      v.env += (v.env_target - v.env) * v.env_coeff;
      v.gain_left += (v.left_target - v.gain_left) * pan;
      v.gain_right += (v.right_target - v.gain_right) * pan;
      v.inc += (v.inc_target - v.inc) * glide;
      const float sine = kit::SineTable::lookup(static_cast<float>(v.phase)) * v.env;
      v.phase += v.inc + v.slew;
      if (v.phase >= 1.0) v.phase -= 1.0;
      sum_left += sine * v.gain_left;
      sum_right += sine * v.gain_right;
      most_left += v.env * v.gain_left;
      most_right += v.env * v.gain_right;
    }
    const float most = most_left > most_right ? most_left : most_right;
    const float gain = most > kCeiling ? kCeiling / most : 1.0f;
    ceiling_gain_ = gain;
    *left = sum_left * gain;
    *right = sum_right * gain;
  }

  Small small_[2];
  Large large_stft_[2];
  bool large_ = false;
  int frame_ = Small::kFrame;
  int hop_ = Small::kHop;
  int stagger_ = Small::kMaxStagger;
  int bins_ = Small::kBins;
  int lo_ = 2, hi_ = 2;  // the bins looked through for peaks
  float bin_hz_ = 1.0f;
  float full_scale_ = 1.0f;

  float now_re_[kMaxBins] = {}, now_im_[kMaxBins] = {};          // the left channel's frame, kept for the right's
  float last_re_[2][kMaxBins] = {}, last_im_[2][kMaxBins] = {};  // the frame before, both channels
  float power_[kMaxBins] = {};
  float weight_[kMaxBins] = {};   // what Tone makes of a partial in each bin
  float log2_hz_[kMaxBins] = {};  // each bin's pitch, for that table
  float weight_tone_ = -1.0f;     // the Tone the table was made for

  float rough_power_[kMaxPeaks] = {};
  int rough_bin_[kMaxPeaks] = {};
  Peak peaks_[kMaxPeaks];
  int order_[kMaxPeaks] = {};

  Voice voices_[kPool];
  int active_[kPool] = {};
  int claimed_[kPool] = {};  // the peak each sine was given this frame, or -1
  int born_[kPool] = {};
  int active_count_ = 0;
  int need_ = 0;  // frames a partial must last (Steady)
 public:
  int last_count_ = 0;
 private:

  int shown_[kShown] = {};
  float shown_size_[kShown] = {};
  int shown_count_ = 0;

  float attack_coeff_ = 1.0f, release_coeff_ = 1.0f, glide_coeff_ = 1.0f;
  float pan_coeff_ = 1.0f, fade_coeff_ = 1.0f;
  float lock_ = kLock;  // the share of the phase error the lock takes up per frame
  float ceiling_gain_ = 1.0f;
  bool retune_ = false;

  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
};

}  // namespace livemix
