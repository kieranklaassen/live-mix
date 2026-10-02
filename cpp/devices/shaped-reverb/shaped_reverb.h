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
// - Tail is a small feedback delay network fed by the shaped signal: what is
//   left in it when the shape stops is the soft decay after a gate.
// - The taps are summed a control period (32 samples) at a time, one tap
//   after another, which is several times cheaper than visiting every tap
//   for every sample. No tap is closer than a period, so the result does not
//   depend on where the host's blocks fall.
//
// After velvet-noise reverberation: Karjalainen and Järveläinen,
// "Reverberation Modeling Using Velvet Noise" (AES 30th Conference, 2007);
// Välimäki, Holm-Rasmussen, Alary and Lehtonen, "Late Reverberation
// Synthesis Using Filtered Velvet Noise" (Applied Sciences, 2017).

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
constexpr int kTailSize = 16384;

// The delay line the taps read. `add_tap` adds `gain` times the sample
// `delay` behind each of the next `frames` writes, before any of them has
// been made: delay must be at least `frames`.
class TapLine {
 public:
  static constexpr int kMask = kLineSize - 1;

  void clear() {
    for (int i = 0; i < kLineSize; ++i) buffer_[i] = 0.0f;
    write_ = 0;
  }
  void write(float x) {
    buffer_[write_] = x;
    write_ = (write_ + 1) & kMask;
  }
  void add_tap(float* sum, int frames, int delay, float gain) const {
    const int start = (write_ - delay) & kMask;
    int first = kLineSize - start;
    if (first > frames) first = frames;
    const float* source = buffer_ + start;
    for (int j = 0; j < first; ++j) sum[j] += gain * source[j];
    for (int j = first; j < frames; ++j) sum[j] += gain * buffer_[j - first];
  }

 private:
  float buffer_[kLineSize] = {};
  int write_ = 0;
};

// One side's taps: where each reads, how loud, from which line and into
// which colour group.
struct Taps {
  int count = 0;
  int delay[kMaxTaps] = {};
  float gain[kMaxTaps] = {};
  unsigned char line[kMaxTaps] = {};
  unsigned char group[kMaxTaps] = {};
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
  kit::DelayLine<kStageSize> line;
  float length = 8.0f;
  int whole = 7;
  float eta = 0.0f;
  float eta_step = 0.0f;
  float state = 0.0f;
  float share = 0.2f;  // of the smear
  float phase = 0.0f;
  float rate = 0.5f;   // Hz

  void reset() {
    line.clear();
    length = 8.0f;
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

  float process(float x, float gain) {
    eta += eta_step;
    const float newer = line.read(whole);
    const float older = line.read(whole + 1);
    state = flush_denormal(older + eta * (newer - state));
    const float v = flush_denormal(x + gain * state);
    line.write(v);
    return state - gain * v;
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
      low_cut_[c][0].reset();
      low_cut_[c][1].reset();
      loop_high_[c].reset();
      loop_low_[c].reset();
      for (int j = 0; j < kPeriod; ++j) {
        early_[c][j] = 0.0f;
        late_[c][j] = 0.0f;
        loop_[c][j] = 0.0f;
      }
    }
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
    tail_mean_ = 0.0f;
    for (int n = 0; n < kTailLines; ++n) {
      tail_[n].clear();
      tail_length_[n] = kit::clamp_int(lengths[n], 8, kTailSize - 8);
      tail_mean_ += static_cast<float>(tail_length_[n]) / kTailLines;
      tail_damp_[n].reset();
      tail_damp_[n].set_cutoff(kTailDampHz, sr);
      tail_gain_[n] = 0.0f;
    }
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

    counter_ = 0;
    started_ = false;
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
    idle_.settle(output_peak(frames), frames);
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
  // Allpass lengths as shares of the smear; each row sums to 1.
  static constexpr float kStageShare[2][kStages] = {{0.137f, 0.163f, 0.191f, 0.227f, 0.282f},
                                                    {0.143f, 0.157f, 0.199f, 0.221f, 0.280f}};
  static constexpr float kDiffusion = 0.66f;
  // Peak sweep of an allpass length at Modulation 1.
  static constexpr float kSweepSeconds = 0.0005f;
  static constexpr float kTailShortest = 0.0431f;
  static constexpr float kTailLongest = 0.1373f;
  static constexpr float kTailDampHz = 5200.0f;
  static constexpr float kColourHz = 900.0f;

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
      float energy = 0.0f;
      for (int k = 0; k < count; ++k) {
        const float u = (static_cast<float>(k) + jitter_[c][k]) / static_cast<float>(count);
        const float gain = shape_gain(shape, u);
        taps.delay[k] = kit::clamp_int(static_cast<int>(base + u * span + 0.5f), floor_delay, limit);
        taps.gain[k] = sign_[c][k] * gain;
        taps.line[k] = static_cast<unsigned char>(cross_[c][k] ? 1 - c : c);
        // The odds of the late group: none in the first tenth, all in the
        // last, a smooth step between.
        const float along = kit::clamp((u - 0.1f) * 1.25f, 0.0f, 1.0f);
        const float late = along * along * (3.0f - 2.0f * along);
        taps.group[k] = static_cast<unsigned char>(dither_[c][k] < late ? 1 : 0);
        energy += gain * gain;
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
        // A short stage sweeps less, so the pitch change stays even.
        const float sweep = kit::min(depth, 0.2f * base);
        const float wanted =
            kit::clamp(base + sweep * kit::SineTable::lookup(stage.phase), 3.0f, longest);
        stage.aim(wanted, !started_);
      }
    }

    if (param(kHighCut) != seen_high_ || param(kLowCut) != seen_low_) {
      seen_high_ = param(kHighCut);
      seen_low_ = param(kLowCut);
      for (int c = 0; c < 2; ++c) {
        high_cut_[c].set(seen_high_, kit::kSqrtHalf, sr);
        low_cut_[c][0].set_cutoff(seen_low_, sr);
        low_cut_[c][1].set_cutoff(seen_low_, sr);
        loop_high_[c].set_cutoff(seen_high_, sr);
        loop_low_[c].set_cutoff(seen_low_, sr);
      }
    }
    if (param(kTail) != seen_tail_) {
      seen_tail_ = param(kTail);
      const float rt60 = 0.6f * std::pow(10.0f, seen_tail_);
      float mean_gain = 0.0f;
      for (int n = 0; n < kTailLines; ++n) {
        tail_gain_[n] = kit::rt60_gain(static_cast<float>(tail_length_[n]), rt60, sr);
        mean_gain += tail_gain_[n] / kTailLines;
      }
      // A network fed with unit power settles at 1 / (4 (1 - g²)) per output.
      tail_norm_ = 2.0f * std::sqrt(1.0f - mean_gain * mean_gain);
    }
  }

  // Sum the taps (and the Repeat tap) for the next `frames` samples.
  void read_taps(int frames) {
    for (int c = 0; c < 2; ++c) {
      for (int j = 0; j < frames; ++j) {
        early_[c][j] = 0.0f;
        late_[c][j] = 0.0f;
        loop_[c][j] = 0.0f;
      }
    }
    if (!fading_) {
      const TapSet& set = sets_[current_];
      for (int c = 0; c < 2; ++c) {
        const Taps& taps = set.side[c];
        float* sums[2] = {early_[c], late_[c]};
        for (int k = 0; k < taps.count; ++k) {
          line_[taps.line[k]].add_tap(sums[taps.group[k]], frames, taps.delay[k], taps.gain[k]);
        }
        line_[c].add_tap(loop_[c], frames, set.loop, 1.0f);
      }
      return;
    }
    const float ramp = 1.0f / kPeriod;
    for (int which = 0; which < 2; ++which) {
      const TapSet& set = sets_[which == 0 ? current_ : current_ ^ 1];
      const float from = which == 0 ? old_from_ : new_from_;
      const float to = which == 0 ? old_to_ : new_to_;
      for (int c = 0; c < 2; ++c) {
        const Taps& taps = set.side[c];
        float part[3][kPeriod];
        for (int j = 0; j < frames; ++j) part[0][j] = part[1][j] = part[2][j] = 0.0f;
        for (int k = 0; k < taps.count; ++k) {
          line_[taps.line[k]].add_tap(part[taps.group[k]], frames, taps.delay[k], taps.gain[k]);
        }
        line_[c].add_tap(part[2], frames, set.loop, 1.0f);
        for (int j = 0; j < frames; ++j) {
          const float weight = from + (to - from) * static_cast<float>(counter_ + j + 1) * ramp;
          early_[c][j] += weight * part[0][j];
          late_[c][j] += weight * part[1][j];
          loop_[c][j] += weight * part[2][j];
        }
      }
    }
  }

  void render(int offset, int frames) {
    const float diffusion = diffusion_.value;
    for (int j = 0; j < frames; ++j) {
      float in[2];
      take_input(offset + j, &in[0], &in[1]);

      const float repeat = repeat_.next();
      for (int c = 0; c < 2; ++c) {
        const float back = loop_low_[c].highpass(loop_high_[c].lowpass(loop_[c][j]));
        // Exactly linear to ±1, landing on ±2: what bounds the loop when a
        // held tone lines up with its own repeats.
        float x = 2.0f * kit::soft_clip(0.5f * (in[c] + repeat * back));
        for (int s = 0; s < kStages; ++s) x = diffuser_[c][s].process(x, diffusion);
        line_[c].write(flush_denormal(x));
      }

      const float early_mix = colour_early_.next();
      const float late_mix = colour_late_.next();
      float shaped[2];
      for (int c = 0; c < 2; ++c) {
        float early = early_[c][j];
        float late = late_[c][j];
        early += early_mix * (colour_filter_[c][0].lowpass(early) - early);
        late += late_mix * (colour_filter_[c][1].lowpass(late) - late);
        shaped[c] = early + late;
      }

      float wet[2] = {shaped[0], shaped[1]};
      const float tail_level = tail_level_.next();
      if (tail_level != 0.0f || tail_level_.target != 0.0f) {
        float v[kTailLines];
        for (int n = 0; n < kTailLines; ++n) {
          v[n] = tail_damp_[n].lowpass(tail_[n].read(tail_length_[n]));
        }
        const float amount = tail_level * tail_norm_ * 0.5f;
        wet[0] += amount * (v[0] - v[2] + v[4] - v[6]);
        wet[1] += amount * (v[1] - v[3] + v[5] - v[7]);
        kit::hadamard<kTailLines>(v);
        for (int n = 0; n < kTailLines; ++n) {
          const float feed = 0.5f * shaped[n & 1];
          tail_[n].write(flush_denormal(v[n] * tail_gain_[n] + ((n & 2) ? -feed : feed)));
        }
        tail_clear_ = false;
      } else if (!tail_clear_) {
        for (int n = 0; n < kTailLines; ++n) {
          tail_[n].clear();
          tail_damp_[n].reset();
        }
        tail_clear_ = true;
      }

      for (int c = 0; c < 2; ++c) {
        wet[c] = low_cut_[c][1].highpass(low_cut_[c][0].highpass(high_cut_[c].lowpass(wet[c])));
      }

      const float width = width_.next();
      const float level = level_.next() * wet_.next();
      const float mid = 0.5f * (wet[0] + wet[1]);
      const float side = 0.5f * (wet[0] - wet[1]) * width;
      const float dry = dry_.next();
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
      case kTail:
        tail_level_.set(tail_level_for(value), primed());
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

  static float tail_level_for(float tail) { return tail <= 0.0f ? 0.0f : 0.75f * std::sqrt(tail); }

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
  // Two one-poles rather than a kit::Svf: at 20 Hz the Svf's second state
  // is left decaying for half a minute at 1e-13 once the flush has zeroed
  // its first, and the shape has to end in exact zeros.
  kit::OnePole low_cut_[2][2];
  kit::OnePole loop_high_[2];
  kit::OnePole loop_low_[2];

  kit::DelayLine<kTailSize> tail_[kTailLines];
  kit::OnePole tail_damp_[kTailLines];
  int tail_length_[kTailLines] = {};
  float tail_gain_[kTailLines] = {};
  float tail_mean_ = 0.0f;
  float tail_norm_ = 0.0f;
  bool tail_clear_ = true;

  kit::Smoother dry_, wet_, width_, repeat_, level_, tail_level_, colour_early_, colour_late_;
  kit::Smoother diffusion_, depth_, smear_;
  float seen_high_ = -1.0f, seen_low_ = -1.0f, seen_tail_ = -1.0f;
  int counter_ = 0;
  bool started_ = false;
  kit::IdleGate idle_;
};

}  // namespace livemix
