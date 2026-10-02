#pragma once

// Shaped Reverb: a reverb whose level over time is drawn, not decayed.
//
//   in ─(+)─► limit ─► 5 modulated allpasses ─► line ─┬─► sparse taps, early group ─► colour ─┐
//        ▲            (Density, Modulation)           ├─► sparse taps, late group  ─► colour ─┼─(+)─► high cut ─► low cut ─► width ─► wet
//        │                                            │                                       │  ▲
//        └─ Repeat ◄─ low cut ◄─ high cut ◄─ one tap at Time                                  └─► 8-line tail ─┘
//
// - The line is read by up to 256 taps per side at velvet-noise positions:
//   one tap in each of N equal cells of the span, at a random place in its
//   cell, with a random sign. A tap's gain is the Shape at its position, and
//   the gains are scaled so their squares sum to 1: the wet energy for a
//   steady input is the same whatever the Shape, Time and Density. Left and
//   right use different seeded positions and signs, and one tap in four
//   reads the other side's line.
// - The allpasses in front turn each tap into a short dense burst. Their
//   total length (the smear) follows the spacing of the taps, so the bursts
//   overlap into a wash without ringing on long after the shape has ended.
//   Density sets both the number of taps and the allpass coefficient: at 0
//   the allpasses are plain delays and the shape is a handful of clean
//   echoes.
// - Time, Shape, Density and Pre-delay each need a new set of taps. The new
//   set fades in over 40 ms while the old one fades out, with the two gains
//   chosen from how alike the sets are so the level holds through the fade.
// - Colour: every tap belongs to an early or a late group, picked by a
//   dither whose odds follow the tap's position in the span, so the two
//   groups cross over along the shape. One of them goes through a treble
//   shelf: the late group below the centre, the early one above it.
// - Repeat is a loop around the line with a period of Time, so the whole
//   shape comes round again, quieter and (through the allpasses and the cut
//   filters) more blurred and darker each time. The loop gain is the Repeat
//   setting at every frequency, so it cannot ring.
// - The two sides are unrelated above 160 Hz; below that the difference
//   between them is rolled off, so the bottom of the wash is mono.
// - Tail is a small feedback delay network fed by the shaped signal: what is
//   left in it when the shape stops is the soft decay after a gate.
// - Modulation sweeps each allpass length on its own slow LFO. The lengths
//   are read through first-order allpass interpolators, so the diffuser
//   stays flat while it moves; taps at different delays hear it at different
//   moments, which is what keeps a held note from sitting on one fixed comb.
// - The taps are summed a control period (32 samples) at a time, eight taps
//   to a pass, which is several times cheaper than visiting every tap for
//   every sample. No tap is closer than a period, so the result does not
//   depend on where the host's blocks fall.
//
// The sparse tap layout is after the approach of Karjalainen and
// Järveläinen, "Reverberation Modeling Using Velvet Noise", and of Välimäki,
// Holm-Rasmussen, Alary and Lehtonen, "Late Reverberation Synthesis Using
// Filtered Velvet Noise". No constants or details were taken from either.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

namespace shaped_reverb_detail {

// 4 s of shape, 250 ms of pre-delay and the tap floor at 96 kHz, rounded up.
constexpr int kLineSize = 524288;
constexpr int kMaxTaps = 256;
constexpr int kPeriod = 32;
constexpr int kStages = 5;
constexpr int kStageSize = 2048;
constexpr int kTailLines = 8;
constexpr int kTailSize = 32768;
constexpr int kTailSwept = 4;  // of the tail's lines move with Modulation

// The delay line the taps read. Its first kPeriod samples are kept a second
// time past the end, so the samples one tap needs for a whole control period
// are always in one run: `behind(delay)` points at the sample `delay` behind
// the next write, and the kPeriod samples from there on are that tap's input
// for the next kPeriod writes (delay must be at least kPeriod).
class TapLine {
 public:
  static constexpr int kMask = kLineSize - 1;

  void clear() {
    for (int i = 0; i < kLineSize + kPeriod; ++i) buffer_[i] = 0.0f;
    write_ = 0;
  }
  void write(float x) {
    buffer_[write_] = x;
    if (write_ < kPeriod) buffer_[write_ + kLineSize] = x;
    write_ = (write_ + 1) & kMask;
  }
  const float* behind(int delay) const { return buffer_ + ((write_ - delay) & kMask); }

 private:
  float buffer_[kLineSize + kPeriod] = {};
  int write_ = 0;
};

// One side's taps: where each reads, how loud and from which line. The
// first `early` of them belong to the early colour group, the rest to the
// late one.
struct Taps {
  int count = 0;
  int early = 0;
  int delay[kMaxTaps] = {};
  float gain[kMaxTaps] = {};
  unsigned char line[kMaxTaps] = {};
};

struct TapSet {
  Taps side[2];
  int loop = kPeriod;  // the Repeat tap
};

// A diffuser allpass whose length can move. The length is read through a
// first-order allpass interpolator, which is flat at every frequency: the
// stage stays a true allpass while it moves (an interpolating FIR read would
// lose treble on every trip round the stage). At rest on a whole number of
// samples the read is exact. The length moves at most one sample per control
// period.
struct Stage {
  static constexpr int kMask = kStageSize - 1;
  float buffer[kStageSize] = {};
  int write = 0;
  float length = 8.0f;
  float rest = 8.0f;  // the length without the Modulation sweep
  int whole = 7;
  float eta = 0.0f;
  float eta_step = 0.0f;
  float state = 0.0f;
  float share = 0.2f;  // of the smear
  float phase = 0.0f;
  float rate = 0.5f;   // Hz

  void reset() {
    for (int i = 0; i < kStageSize; ++i) buffer[i] = 0.0f;
    write = 0;
    length = 8.0f;
    rest = 8.0f;
    whole = 7;
    eta = eta_step = state = 0.0f;
  }

  // Head for `wanted` samples over the next control period.
  void aim(float wanted, bool snap) {
    if (snap) length = wanted;
    const float from = length;
    const float to = kit::clamp(wanted, from - 1.0f, from + 1.0f);
    // The fractional part stays in [0.5, 2.5) over the period.
    whole = static_cast<int>((from < to ? from : to) - 0.5f);
    const float d0 = from - static_cast<float>(whole);
    const float d1 = to - static_cast<float>(whole);
    eta = (1.0f - d0) / (1.0f + d0);
    eta_step = ((1.0f - d1) / (1.0f + d1) - eta) * (1.0f / kPeriod);
    length = to;
  }

  // Run `frames` samples of `x` through the stage, in place.
  void process(float* x, int frames, float gain) {
    float e = eta;
    float held = state;
    int w = write;
    for (int j = 0; j < frames; ++j) {
      e += eta_step;
      const float newer = buffer[(w - whole) & kMask];
      const float older = buffer[(w - whole - 1) & kMask];
      held = older + e * (newer - held);
      const float v = flush_denormal(x[j] + gain * held);
      buffer[w] = v;
      w = (w + 1) & kMask;
      x[j] = held - gain * v;
    }
    eta = e;
    state = held;
    write = w;
  }
};

}  // namespace shaped_reverb_detail

class ShapedReverb : public kit::DeviceBase<shaped_reverb::kNumParams> {
 public:
  enum Shape : int { kGate = 0, kReverse, kBloom, kFall, kPulse, kNumShapes };

  void init(float sample_rate) {
    using namespace shaped_reverb;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();

    kit::Rng rng;
    rng.seed(0x3C6EF372u);
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      for (int k = 0; k < kMaxTaps; ++k) {
        jitter_[c][k] = rng.uniform();
        sign_[c][k] = rng.uniform() < 0.5f ? -1.0f : 1.0f;
        dither_[c][k] = rng.uniform();
        cross_[c][k] = rng.uniform() < kCrossShare;
      }
      for (int s = 0; s < kStages; ++s) {
        Stage& stage = diffuser_[c][s];
        stage.reset();
        stage.share = kStageShare[c][s];
        stage.phase = rng.uniform();
        stage.rate = 0.23f + 0.83f * rng.uniform();
      }
      for (int g = 0; g < 2; ++g) {
        colour_filter_[c][g].reset();
        colour_filter_[c][g].set_cutoff(kColourHz, sr);
      }
      high_cut_[c].reset();
      low_cut_[c].reset();
      loop_high_[c].reset();
      loop_low_[c].reset();
      for (int j = 0; j < kPeriod; ++j) {
        early_[c][j] = 0.0f;
        late_[c][j] = 0.0f;
        loop_[c][j] = 0.0f;
      }
    }
    side_cut_.reset();
    side_cut_.set_cutoff(kSideCutHz, sr);
    sets_[0] = TapSet();
    sets_[1] = TapSet();
    current_ = 0;
    fading_ = false;
    fade_ = 0.0f;
    fade_step_ = static_cast<float>(kPeriod) / (kFadeSeconds * sr);
    likeness_ = 0.0f;
    old_from_ = old_to_ = 1.0f;
    new_from_ = new_to_ = 0.0f;
    built_shape_ = -1;
    built_time_ = built_density_ = built_pre_ = -1.0f;

    int lengths[kTailLines];
    kit::spread_lengths<kTailLines>(kTailShortest * sr, kTailLongest * sr, lengths);
    for (int n = 0; n < kTailLines; ++n) {
      tail_[n].clear();
      // Primes share no factor, so no two lines' echoes ever line up.
      int length = kit::clamp_int(lengths[n], 8, kTailSize - 256);
      while (!is_prime(length) || (n > 0 && length <= tail_length_[n - 1])) ++length;
      tail_length_[n] = length;
      tail_damp_[n].reset();
      tail_gain_[n] = 0.0f;
    }
    for (int m = 0; m < kTailSwept; ++m) {
      tail_phase_[m] = rng.uniform();
      tail_rate_[m] = 0.31f + 0.58f * rng.uniform();
      tail_delay_[m] = 0.0f;
      tail_delay_step_[m] = 0.0f;
    }
    tail_low_[0].reset();
    tail_low_[1].reset();
    tail_low_[0].set_cutoff(kTailLowHz, sr);
    tail_low_[1].set_cutoff(kTailLowHz, sr);
    tail_still_ = true;
    tail_clear_ = true;
    tail_norm_ = 0.0f;

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    repeat_.set_time(kSmoothingSeconds, sr);
    level_.set_time(kSmoothingSeconds, sr);
    tail_level_.set_time(0.02f, sr);
    colour_early_.set_time(0.02f, sr);
    colour_late_.set_time(0.02f, sr);
    const float control_rate = sr / kPeriod;
    diffusion_.set_time(0.03f, control_rate);
    depth_.set_time(0.05f, control_rate);
    smear_.set_time(kSmearGlideSeconds, control_rate);
    high_glide_.set_time(kKnobGlideSeconds, control_rate);
    low_glide_.set_time(kKnobGlideSeconds, control_rate);
    tail_glide_.set_time(kKnobGlideSeconds, control_rate);
    tail_level_.snap(0.0f);

    counter_ = 0;
    started_ = false;
    active_ = 0.0f;
    seen_high_ = seen_low_ = seen_tail_ = -1.0e9f;
    // The longest silent gap: the pre-delay and a whole shape whose start is
    // too quiet to see, plus the diffuser.
    idle_.reset(sr, kParamMax[kPreDelay] * 0.001f + kParamMax[kTime] + 0.5f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    active_ = 0.0f;
    int done = 0;
    while (done < frames) {
      if (counter_ == 0) {
        control();
        started_ = true;
      }
      int chunk = kPeriod - counter_;
      if (chunk > frames - done) chunk = frames - done;
      read_taps(chunk);
      render(done, chunk);
      counter_ += chunk;
      if (counter_ >= kPeriod) counter_ = 0;
      done += chunk;
    }
    // The gate goes by the reverb itself as well as by the output: with Mix
    // at zero the output is silent while repeats or a tail still go round,
    // and a device that slept on them would play them back on waking.
    idle_.settle(kit::max(output_peak(frames), active_), frames);
  }

 private:
  using TapLine = shaped_reverb_detail::TapLine;
  using Taps = shaped_reverb_detail::Taps;
  using TapSet = shaped_reverb_detail::TapSet;
  using Stage = shaped_reverb_detail::Stage;
  static constexpr int kMaxTaps = shaped_reverb_detail::kMaxTaps;
  static constexpr int kPeriod = shaped_reverb_detail::kPeriod;
  static constexpr int kStages = shaped_reverb_detail::kStages;
  static constexpr int kTailLines = shaped_reverb_detail::kTailLines;
  static constexpr int kTailSize = shaped_reverb_detail::kTailSize;
  static constexpr int kTailSwept = shaped_reverb_detail::kTailSwept;

  // Taps per second of Time at Density 0 and 1.
  static constexpr float kRateSparse = 8.0f;
  static constexpr float kRateDense = 260.0f;
  // No tap is nearer than this (and never nearer than a control period).
  static constexpr float kFloorSeconds = 0.001f;
  static constexpr float kFadeSeconds = 0.04f;
  static constexpr float kCrossShare = 0.25f;
  // The smear is this many tap spacings, within limits.
  static constexpr float kSmearSpacings = 1.8f;
  static constexpr float kSmearMin = 0.008f;
  static constexpr float kSmearMax = 0.045f;
  static constexpr float kSmearGlideSeconds = 0.12f;
  // High Cut, Low Cut and Tail move to a new setting over about this long.
  static constexpr float kKnobGlideSeconds = 0.03f;
  // Allpass lengths as shares of the smear; each row sums to 1.
  static constexpr float kStageShare[2][kStages] = {{0.137f, 0.163f, 0.191f, 0.227f, 0.282f},
                                                    {0.143f, 0.157f, 0.199f, 0.221f, 0.280f}};
  static constexpr float kDiffusion = 0.66f;
  // The most an allpass's resting length moves in one control period, in
  // samples: an eighth of a percent of the period, 2 cents of pitch for
  // each trip round a stage. The longest move takes about eight seconds.
  static constexpr float kDriftSamples = 0.04f;
  // Peak sweep of an allpass length at Modulation 1.
  static constexpr float kSweepSeconds = 0.0005f;
  // The tail's eight lines, 1.5 s between them: enough modes that none
  // rings on its own. Each is a prime number of samples.
  static constexpr float kTailShortest = 0.0991f;
  static constexpr float kTailLongest = 0.3167f;
  // The tail loses treble on every pass above this share of High Cut.
  static constexpr float kTailDampShare = 0.5f;
  // What feeds the tail is thinned below this, so low notes do not pile up.
  static constexpr float kTailLowHz = 140.0f;
  // Peak sweep of a tail line at Modulation 1.
  static constexpr float kTailSweepSeconds = 0.0003f;
  static constexpr float kColourHz = 900.0f;
  static constexpr float kSideCutHz = 160.0f;

  // The Shape as an amplitude at `u` in [0, 1] along the span.
  static float shape_gain(int shape, float u) {
    switch (shape) {
      case kReverse:
        // A reversed decay: a straight line in dB, 28 dB below its end at the
        // start, with the first twelfth faded in so it does not begin on a step.
        return std::exp(-3.22f * (1.0f - u)) * kit::min(1.0f, 12.0f * u);
      case kBloom:
        // A little quicker in than out: the top is at 0.42 of the span.
        return std::pow(std::sin(kit::kPi * std::pow(u, 0.8f)), 1.2f);
      case kFall:
        return 1.0f - u;
      case kPulse: {
        const float wave = std::sin(3.0f * kit::kPi * u);
        return std::pow(wave * wave, 0.75f) * (1.0f - 0.3f * u);
      }
      case kGate:
      default:
        return 1.0f;
    }
  }

  // The tail lines that move: 2, 3, 6 and 7, two on each side.
  static int swept_line(int m) { return 2 + (m & 1) + 4 * (m >> 1); }

  static bool is_prime(int n) {
    if (n < 4) return n > 1;
    if ((n & 1) == 0) return false;
    for (int d = 3; d * d <= n; d += 2) {
      if (n % d == 0) return false;
    }
    return true;
  }

  static int taps_for(float density, float seconds) {
    const float rate = kRateSparse * std::pow(kRateDense / kRateSparse, density);
    const int wanted = static_cast<int>(rate * seconds + 0.5f);
    const int fewest = 4 + static_cast<int>(44.0f * density);
    return kit::clamp_int(wanted, fewest, kMaxTaps);
  }

  static float smear_for(float seconds, int taps) {
    const float smear = kit::clamp(kSmearSpacings * seconds / static_cast<float>(taps), kSmearMin, kSmearMax);
    return kit::min(smear, 0.25f * seconds);
  }

  void build(TapSet& set, int shape, float seconds, float density, float pre_seconds) {
    const float sr = sample_rate();
    const int count = taps_for(density, seconds);
    const float smear = smear_for(seconds, count);
    // The allpasses delay energy by the smear on average, so the taps stop
    // that much short of Time.
    const float span = (seconds - smear) * sr;
    const int floor_delay = floor_samples();
    const float base = static_cast<float>(floor_delay) + pre_seconds * sr;
    const int limit = shaped_reverb_detail::kLineSize - 2 * kPeriod;
    for (int c = 0; c < 2; ++c) {
      Taps& taps = set.side[c];
      taps.count = count;
      taps.early = 0;
      float energy = 0.0f;
      int filled = 0;
      // Two passes: the early group's taps first, then the late group's.
      for (int group = 0; group < 2; ++group) {
        for (int k = 0; k < count; ++k) {
          const float u = (static_cast<float>(k) + jitter_[c][k]) / static_cast<float>(count);
          // The odds of the late group: none in the first tenth, all in the
          // last, a smooth step between.
          const float along = kit::clamp((u - 0.1f) * 1.25f, 0.0f, 1.0f);
          const float late = along * along * (3.0f - 2.0f * along);
          if ((dither_[c][k] < late ? 1 : 0) != group) continue;
          const float gain = shape_gain(shape, u);
          taps.delay[filled] = kit::clamp_int(static_cast<int>(base + u * span + 0.5f), floor_delay, limit);
          taps.gain[filled] = sign_[c][k] * gain;
          taps.line[filled] = static_cast<unsigned char>(cross_[c][k] ? 1 - c : c);
          energy += gain * gain;
          ++filled;
        }
        if (group == 0) taps.early = filled;
      }
      const float scale = energy > 0.0f ? 1.0f / std::sqrt(energy) : 0.0f;
      for (int k = 0; k < count; ++k) taps.gain[k] *= scale;
    }
    set.loop = kit::clamp_int(static_cast<int>(span + 0.5f), floor_delay, limit);
    built_shape_ = shape;
    built_time_ = seconds;
    built_density_ = density;
    built_pre_ = pre_seconds;
    smear_target_ = smear;
  }

  int floor_samples() const {
    const int samples = static_cast<int>(kFloorSeconds * sample_rate());
    return samples < kPeriod ? kPeriod : samples;
  }

  // How alike two sets are: the correlation of their outputs for a white
  // input, from the taps that read the same sample.
  static float likeness(const TapSet& a, const TapSet& b) {
    float sum = 0.0f;
    for (int c = 0; c < 2; ++c) {
      const Taps& x = a.side[c];
      const Taps& y = b.side[c];
      const int count = x.count < y.count ? x.count : y.count;
      for (int k = 0; k < count; ++k) {
        if (x.delay[k] == y.delay[k] && x.line[k] == y.line[k]) sum += x.gain[k] * y.gain[k];
      }
    }
    return kit::clamp(0.5f * sum, 0.0f, 1.0f);
  }

  // Every 32 samples: tap sets and their fade, allpass lengths, filters.
  void control() {
    using namespace shaped_reverb;
    const float sr = sample_rate();
    const int shape = kit::clamp_int(static_cast<int>(param(kShape) + 0.5f), 0, kNumShapes - 1);
    const float seconds = param(kTime);
    const float density = param(kDensity);
    const float pre = param(kPreDelay) * 0.001f;

    if (fading_ && fade_ >= 1.0f) {
      current_ ^= 1;
      fading_ = false;
      old_from_ = old_to_ = 1.0f;
      new_from_ = new_to_ = 0.0f;
    }
    const bool changed = shape != built_shape_ || seconds != built_time_ ||
                         density != built_density_ || pre != built_pre_;
    if (!started_) {
      build(sets_[current_], shape, seconds, density, pre);
    } else if (changed && !fading_) {
      build(sets_[current_ ^ 1], shape, seconds, density, pre);
      likeness_ = likeness(sets_[current_], sets_[current_ ^ 1]);
      fading_ = true;
      fade_ = 0.0f;
    }
    if (fading_) {
      old_from_ = old_to_;
      new_from_ = new_to_;
      fade_ = kit::min(1.0f, fade_ + fade_step_);
      float out = kit::SineTable::cos_lookup(0.25f * fade_);
      float in = kit::SineTable::lookup(0.25f * fade_);
      if (fade_ >= 1.0f) {
        out = 0.0f;
        in = 1.0f;
      }
      const float norm = 1.0f / std::sqrt(1.0f + 2.0f * likeness_ * out * in);
      old_to_ = out * norm;
      new_to_ = in * norm;
    }

    // Allpass lengths: the smear glides, each stage sweeps on its own LFO.
    smear_.set(smear_target_, started_);
    const float smear = smear_.next() * sr;
    diffusion_.set(kDiffusion * (1.0f - (1.0f - density) * (1.0f - density)), started_);
    diffusion_.next();
    depth_.set(param(kModulation), started_);
    const float depth = depth_.next() * kSweepSeconds * sr;
    const float turn = static_cast<float>(kPeriod) / sr;
    const float longest = static_cast<float>(shaped_reverb_detail::kStageSize - 8);
    for (int c = 0; c < 2; ++c) {
      for (int s = 0; s < kStages; ++s) {
        Stage& stage = diffuser_[c][s];
        stage.phase += turn * stage.rate;
        if (stage.phase >= 1.0f) stage.phase -= 1.0f;
        // Whole samples at rest, so an unmodulated stage is exact.
        const float base = std::floor(stage.share * smear + 0.5f);
        // A new length is approached slowly: a moving allpass bends the pitch
        // of what is in it, and at full speed a turn of Density or Time
        // dipped the whole wash by two semitones for half a second. At this
        // rate the five stages together stay within about a quarter of one.
        const float gap = base - stage.rest;
        if (!started_ || (gap <= kDriftSamples && gap >= -kDriftSamples)) {
          stage.rest = base;
        } else {
          stage.rest += gap > 0.0f ? kDriftSamples : -kDriftSamples;
        }
        // A short stage sweeps less, so the pitch change stays even.
        const float sweep = kit::min(depth, 0.2f * stage.rest);
        const float wanted =
            kit::clamp(stage.rest + sweep * kit::SineTable::lookup(stage.phase), 3.0f, longest);
        stage.aim(wanted, !started_);
      }
    }

    // A kit::Svf set to a few tens of Hz does not ring out to zero: once the
    // flush has zeroed its first state the second is left at 1e-13, decaying
    // for half a minute. Finish it by hand at -200 dB, so that the shape ends
    // in exact zeros.
    for (int c = 0; c < 2; ++c) {
      kit::Svf& cut = low_cut_[c];
      if (cut.ic1 > -1.0e-10f && cut.ic1 < 1.0e-10f && cut.ic2 > -1.0e-10f && cut.ic2 < 1.0e-10f) {
        cut.ic1 = 0.0f;
        cut.ic2 = 0.0f;
      }
    }

    // The cut frequencies glide (in octaves), so a jump of either knob, or
    // a preset that moves them, retunes the filters without a tick.
    high_glide_.set(std::log(param(kHighCut)), started_);
    low_glide_.set(std::log(param(kLowCut)), started_);
    if (!started_ || !high_glide_.settled() || !low_glide_.settled()) {
      seen_high_ = std::exp(high_glide_.next());
      seen_low_ = std::exp(low_glide_.next());
      for (int c = 0; c < 2; ++c) {
        high_cut_[c].set(seen_high_, kit::kSqrtHalf, sr);
        low_cut_[c].set(seen_low_, kit::kSqrtHalf, sr);
        loop_high_[c].set_cutoff(seen_high_, sr);
        loop_low_[c].set_cutoff(seen_low_, sr);
      }
      // The tail's damping follows High Cut: a bright setting leaves air in
      // the decay, a dark one closes it quickly.
      tail_damp_[0].set_cutoff(kTailDampShare * seen_high_, sr);
      for (int n = 1; n < kTailLines; ++n) tail_damp_[n].a = tail_damp_[0].a;
    }

    // Four of the tail's lines drift a little, each on its own slow LFO,
    // which keeps a long decay from settling on a few fixed modes. With
    // Modulation at zero they stand still and are read on whole samples.
    const float tail_depth = depth_.value * kTailSweepSeconds * sr;
    bool still = true;
    for (int m = 0; m < kTailSwept; ++m) {
      tail_phase_[m] += turn * tail_rate_[m];
      if (tail_phase_[m] >= 1.0f) tail_phase_[m] -= 1.0f;
      const float rest = static_cast<float>(tail_length_[swept_line(m)]);
      const float wanted = rest + tail_depth * kit::SineTable::lookup(tail_phase_[m]);
      const float gap = wanted - tail_delay_[m];
      if (!started_ || (gap < 1.0e-3f && gap > -1.0e-3f)) {
        tail_delay_[m] = wanted;
        tail_delay_step_[m] = 0.0f;
      } else {
        tail_delay_step_[m] = gap * (1.0f / kPeriod);
      }
      if (tail_delay_step_[m] != 0.0f || tail_delay_[m] != rest) still = false;
    }
    tail_still_ = still;
    // Tail glides too: its decay and its level move together, a little at
    // a time, instead of stepping what is already ringing in the network.
    tail_glide_.set(param(kTail), started_);
    if (!started_ || !tail_glide_.settled()) {
      seen_tail_ = tail_glide_.next();
      const float rt60 = 0.6f * std::pow(10.0f, seen_tail_);
      float mean_gain = 0.0f;
      for (int n = 0; n < kTailLines; ++n) {
        const float gain = kit::rt60_gain(static_cast<float>(tail_length_[n]), rt60, sr);
        mean_gain += gain / kTailLines;
        // hadamard8 leaves out its 1/sqrt(8); it is folded in here.
        tail_gain_[n] = gain * 0.35355339f;
      }
      // Fed with unit power the network settles at 1 / (4 (1 - g²)) in each
      // output; this brings it back to the level of what feeds it.
      tail_norm_ = 2.0f * std::sqrt(1.0f - mean_gain * mean_gain);
      tail_level_.set(tail_level_for(seen_tail_) * tail_norm_, started_);
    }
  }

  // Add taps [from, to) of one side into `sum`, eight taps to a pass (then
  // four, then one): the fewer trips through `sum`, the cheaper each tap.
  void add_taps(const Taps& taps, int from, int to, int frames, float* sum) const {
    const float* x[8];
    float g[8];
    int k = from;
    for (; k + 8 <= to; k += 8) {
      for (int t = 0; t < 8; ++t) {
        x[t] = line_[taps.line[k + t]].behind(taps.delay[k + t]);
        g[t] = taps.gain[k + t];
      }
      for (int j = 0; j < frames; ++j) {
        sum[j] += (g[0] * x[0][j] + g[1] * x[1][j] + g[2] * x[2][j] + g[3] * x[3][j]) +
                  (g[4] * x[4][j] + g[5] * x[5][j] + g[6] * x[6][j] + g[7] * x[7][j]);
      }
    }
    for (; k + 4 <= to; k += 4) {
      for (int t = 0; t < 4; ++t) {
        x[t] = line_[taps.line[k + t]].behind(taps.delay[k + t]);
        g[t] = taps.gain[k + t];
      }
      for (int j = 0; j < frames; ++j) {
        sum[j] += g[0] * x[0][j] + g[1] * x[1][j] + g[2] * x[2][j] + g[3] * x[3][j];
      }
    }
    for (; k < to; ++k) {
      const float* a = line_[taps.line[k]].behind(taps.delay[k]);
      const float ga = taps.gain[k];
      for (int j = 0; j < frames; ++j) sum[j] += ga * a[j];
    }
  }

  // Sum the taps (and read the Repeat tap) for the next `frames` samples.
  void read_taps(int frames) {
    const bool fading = fading_;
    const float ramp = 1.0f / kPeriod;
    for (int which = 0; which < (fading ? 2 : 1); ++which) {
      const TapSet& set = sets_[which == 0 ? current_ : current_ ^ 1];
      for (int c = 0; c < 2; ++c) {
        const Taps& taps = set.side[c];
        float early[kPeriod], late[kPeriod];
        for (int j = 0; j < frames; ++j) early[j] = late[j] = 0.0f;
        add_taps(taps, 0, taps.early, frames, early);
        add_taps(taps, taps.early, taps.count, frames, late);
        const float* loop = line_[c].behind(set.loop);
        if (!fading) {
          for (int j = 0; j < frames; ++j) {
            early_[c][j] = early[j];
            late_[c][j] = late[j];
            loop_[c][j] = loop[j];
          }
          continue;
        }
        // Mid-fade: each set by its gain, which moves in a straight line
        // over the control period.
        const float from = which == 0 ? old_from_ : new_from_;
        const float to = which == 0 ? old_to_ : new_to_;
        for (int j = 0; j < frames; ++j) {
          const float weight = from + (to - from) * static_cast<float>(counter_ + j + 1) * ramp;
          if (which == 0) early_[c][j] = late_[c][j] = loop_[c][j] = 0.0f;
          early_[c][j] += weight * early[j];
          late_[c][j] += weight * late[j];
          loop_[c][j] += weight * loop[j];
        }
      }
    }
  }

  void render(int offset, int frames) {
    const float diffusion = diffusion_.value;
    // What goes into the line: the input plus the Repeat tap, through the
    // allpasses, a channel and a stage at a time.
    float dry_in[2][kPeriod];
    float feed[2][kPeriod];
    for (int j = 0; j < frames; ++j) {
      take_input(offset + j, &dry_in[0][j], &dry_in[1][j]);
      const float repeat = glide(repeat_);
      if (repeat == 0.0f) {
        // No loop: its filters rest, empty.
        for (int c = 0; c < 2; ++c) {
          loop_high_[c].state = 0.0f;
          loop_low_[c].state = 0.0f;
          feed[c][j] = 2.0f * kit::soft_clip(0.5f * dry_in[c][j]);
        }
        continue;
      }
      for (int c = 0; c < 2; ++c) {
        const float back = loop_low_[c].highpass(loop_high_[c].lowpass(loop_[c][j]));
        // Exactly linear to ±1, landing on ±2: what bounds the loop when a
        // held tone lines up with its own repeats.
        feed[c][j] = 2.0f * kit::soft_clip(0.5f * (dry_in[c][j] + repeat * back));
      }
    }
    for (int c = 0; c < 2; ++c) {
      for (int s = 0; s < kStages; ++s) diffuser_[c][s].process(feed[c], frames, diffusion);
      for (int j = 0; j < frames; ++j) line_[c].write(flush_denormal(feed[c][j]));
    }

    for (int j = 0; j < frames; ++j) {
      const float in[2] = {dry_in[0][j], dry_in[1][j]};

      if (!tail_still_) {
        for (int m = 0; m < kTailSwept; ++m) tail_delay_[m] += tail_delay_step_[m];
      }

      const float early_mix = glide(colour_early_);
      const float late_mix = glide(colour_late_);
      float shaped[2];
      for (int c = 0; c < 2; ++c) {
        float early = early_[c][j];
        float late = late_[c][j];
        // Each shelf follows its group all the time, so it has no start-up
        // step when Colour brings it in; at 0 it is exactly out of the path.
        const float early_low = colour_filter_[c][0].lowpass(early);
        const float late_low = colour_filter_[c][1].lowpass(late);
        early += early_mix * (early_low - early);
        late += late_mix * (late_low - late);
        shaped[c] = early + late;
      }

      float wet[2] = {shaped[0], shaped[1]};
      const float tail_level = glide(tail_level_);
      if (tail_level != 0.0f || tail_level_.target != 0.0f) {
        float v[kTailLines];
        for (int n = 0; n < kTailLines; ++n) v[n] = tail_[n].read(tail_length_[n]);
        if (!tail_still_) {
          for (int m = 0; m < kTailSwept; ++m) v[swept_line(m)] = tail_[swept_line(m)].read_hermite(tail_delay_[m]);
        }
        for (int n = 0; n < kTailLines; ++n) v[n] = tail_damp_[n].lowpass(v[n]);
        const float amount = tail_level * 0.5f;
        // The signs in and out are chosen against the Hadamard matrix: with
        // the same alternating pattern at both ends every pass through one
        // line lined up, and the tail fluttered at that line's length. These
        // two patterns spread that evenly over a side's four lines, with
        // opposite signs at the two ends, so it cancels.
        wet[0] += amount * (v[0] + v[2] + v[4] - v[6]);
        wet[1] += amount * (v[1] + v[3] + v[5] - v[7]);
        hadamard8(v);
        const float thinned[2] = {0.5f * tail_low_[0].highpass(shaped[0]), 0.5f * tail_low_[1].highpass(shaped[1])};
        for (int n = 0; n < kTailLines; ++n) {
          const float inject = thinned[n & 1];
          tail_[n].write(flush_denormal(v[n] * tail_gain_[n] + (n < 2 ? -inject : inject)));
        }
        tail_clear_ = false;
      } else if (!tail_clear_) {
        for (int n = 0; n < kTailLines; ++n) {
          tail_[n].clear();
          tail_damp_[n].reset();
        }
        tail_low_[0].reset();
        tail_low_[1].reset();
        tail_clear_ = true;
      }

      for (int c = 0; c < 2; ++c) wet[c] = low_cut_[c].highpass(high_cut_[c].lowpass(wet[c]));

      const float loud0 = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float loud1 = wet[1] < 0.0f ? -wet[1] : wet[1];
      if (loud0 > active_) active_ = loud0;
      if (loud1 > active_) active_ = loud1;

      const float width = glide(width_);
      const float level = glide(level_) * glide(wet_);
      const float mid = 0.5f * (wet[0] + wet[1]);
      // The bottom of the wash stays in the middle: what differs between
      // the sides is kept only above kSideCutHz.
      const float side = side_cut_.highpass(0.5f * (wet[0] - wet[1])) * width;
      const float dry = glide(dry_);
      // The wet signal is exact up to ±1 and lands on ±2.
      out_left_[offset + j] = in[0] * dry + 2.0f * kit::soft_clip(0.5f * (mid + side) * level);
      out_right_[offset + j] = in[1] * dry + 2.0f * kit::soft_clip(0.5f * (mid - side) * level);
    }
  }

  void apply(int id) {
    using namespace shaped_reverb;
    const float value = param(id);
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kWidth:
        width_.set(value, primed());
        break;
      case kRepeat:
        repeat_.set(value, primed());
        // Repeats store more energy for the same input; take half of that
        // back (in dB).
        level_.set(std::sqrt(std::sqrt(1.0f - value * value)), primed());
        break;
      case kColour: {
        // A treble shelf on one group: up to 24 dB down above kColourHz.
        const float amount = 1.0f - std::pow(10.0f, -1.2f * (value < 0.0f ? -value : value));
        colour_early_.set(value > 0.0f ? amount : 0.0f, primed());
        colour_late_.set(value < 0.0f ? amount : 0.0f, primed());
        break;
      }
      default:
        break;  // everything else is read on the control clock
    }
  }

  // The 8-point Walsh-Hadamard transform without its 1/sqrt(8) scale, written
  // out (the kit's loop form costs four times as much here).
  static void hadamard8(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    const float a4 = v[4] + v[5], a5 = v[4] - v[5], a6 = v[6] + v[7], a7 = v[6] - v[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    v[0] = b0 + b4;
    v[1] = b1 + b5;
    v[2] = b2 + b6;
    v[3] = b3 + b7;
    v[4] = b0 - b4;
    v[5] = b1 - b5;
    v[6] = b2 - b6;
    v[7] = b3 - b7;
  }

  // A smoother that is at rest costs one comparison.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // (0.92: what rings on after a gate is as loud as it was before the
  // network's signs were changed, when the gain here was 0.75.)
  static float tail_level_for(float tail) { return tail <= 0.0f ? 0.0f : 0.92f * std::sqrt(tail); }

  TapLine line_[2];
  Stage diffuser_[2][kStages];
  TapSet sets_[2];
  float jitter_[2][kMaxTaps] = {};
  float sign_[2][kMaxTaps] = {};
  float dither_[2][kMaxTaps] = {};
  bool cross_[2][kMaxTaps] = {};
  float early_[2][kPeriod] = {};
  float late_[2][kPeriod] = {};
  float loop_[2][kPeriod] = {};

  int current_ = 0;
  bool fading_ = false;
  float fade_ = 0.0f;
  float fade_step_ = 0.0f;
  float likeness_ = 0.0f;
  float old_from_ = 1.0f, old_to_ = 1.0f, new_from_ = 0.0f, new_to_ = 0.0f;
  int built_shape_ = -1;
  float built_time_ = -1.0f, built_density_ = -1.0f, built_pre_ = -1.0f;
  float smear_target_ = 0.01f;

  kit::OnePole colour_filter_[2][2];
  kit::Svf high_cut_[2];
  kit::Svf low_cut_[2];
  kit::OnePole loop_high_[2];
  kit::OnePole loop_low_[2];
  kit::OnePole side_cut_;

  kit::DelayLine<kTailSize> tail_[kTailLines];
  kit::OnePole tail_damp_[kTailLines];
  kit::OnePole tail_low_[2];
  float tail_phase_[kTailSwept] = {};
  float tail_rate_[kTailSwept] = {};  // Hz
  float tail_delay_[kTailSwept] = {};
  float tail_delay_step_[kTailSwept] = {};
  bool tail_still_ = true;  // no line is moving: whole-sample reads
  int tail_length_[kTailLines] = {};
  float tail_gain_[kTailLines] = {};
  float tail_norm_ = 0.0f;
  bool tail_clear_ = true;

  kit::Smoother dry_, wet_, width_, repeat_, level_, tail_level_, colour_early_, colour_late_;
  kit::Smoother diffusion_, depth_, smear_, high_glide_, low_glide_, tail_glide_;
  float seen_high_ = -1.0f, seen_low_ = -1.0f, seen_tail_ = -1.0f;
  int counter_ = 0;
  bool started_ = false;
  float active_ = 0.0f;  // the wet signal's peak in this block, before Mix
  kit::IdleGate idle_;
};

}  // namespace livemix
