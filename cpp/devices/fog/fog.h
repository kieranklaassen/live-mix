#pragma once

// Fog: the front half of a reverb with the back half taken away. A chain of
// allpasses spreads every transient into a short dense cloud and then stops:
// no tank, no feedback path, no decay time.
//
//   in ─┬─► soften ─► 4 short allpasses ─► 6 long ─┬─► 6 long ─┬─► 6 long ─┐
//       │  (ducks the   (Density)        (layer 1) │ (layer 2) │ (layer 3) │
//       │   attack)                                ▼           ▼           ▼
//       │                                       Layers picks one of the three
//       │                                                │
//       │                                    damp ─► low cut ─► wet
//       └─► dry (its attack ducked as far as Mix is up) ─────────► mix ─► out
//
// - Every stage is a Schroeder allpass, so each side of the wet signal is
//   flat at every frequency whatever the settings: a held note comes out at
//   the level it went in, and only where things are in time is changed.
// - Every length is a share of one time, the Size (kRatio), so Size scales
//   the cloud and nothing else. An allpass delays energy by its length on
//   average whatever its coefficient, so the middle of the cloud arrives
//   after the sum of the lengths (0.68 of Size with one layer), and the
//   coefficients set how far around that the energy is spread. With one
//   layer at the default Density nine tenths of a click's energy is out
//   after Size, and what is left 2.7 Sizes on is 60 dB down.
// - The coefficients alternate in sign down the chain. A stage holds back
//   what lies under its first resonance by four lengths with a positive
//   coefficient and lets it through in a quarter of one with a negative.
//   All one sign, the bottom of the cloud trails the rest: a low note comes
//   2.5 Sizes on instead of 1.6, and three layers leave 40 dB more behind.
// - Density is how many stages diffuse and how hard: it brings the four
//   short stages in one after another (they turn each echo of the long
//   stages into a small burst) and raises the long stages' coefficient from
//   0.45 to 0.6. At 0 the cloud is a spray of separate echoes.
// - Layers sends the cloud through six more stages, and six more: each layer
//   delays and spreads it again, so it grows longer and its onset rounder.
//   A layer that is not heard does not run; it starts empty when it is
//   called for, and the heard tap crossfades to it while it fills.
// - Width is how far the right side's lengths lie from the left's (up to a
//   tenth, kSkew), and how far its drift goes its own way. At 0 the two
//   sides are the same chain and a mono sound stays mono. The sides part
//   above a frequency that falls as the lengths part, so the knob runs over
//   the lengths on a curve (`spread`): the highs first, the bass last, about
//   two octaves to a quarter of the knob. Summed to mono, two sides that
//   differ cancel at some pitches; that is what Width costs.
// - Drift sweeps every length on a slow sine of its own, a quarter of a
//   millisecond at most. Lengths are read through a first-order allpass
//   interpolator, which is flat at every frequency, so the stage is still an
//   allpass while it moves (an interpolating read would lose treble on every
//   trip round every stage). At rest on a whole sample the read is exact.
//   A chain whose lengths move is not flat for all that: a moving length
//   bends the pitch of what passes it, and the stages after it ring for
//   about a Size, so a note whose pitch moves across their resonances faster
//   than that wavers in level. The drift is therefore the slower the longer
//   the cloud (kDriftPace): as built, a 4 kHz note keeps within 1.5 dB of
//   its level in every twentieth of a second with Drift full up, at any Size.
// - Size and Width move the lengths, which bends the pitch of what is in the
//   chain for a moment, as a tape delay's time does. While a length moves by
//   more than a sample per control period it is read by straight
//   interpolation instead, which has no state to upset.
// - Soften is a gain that follows the attack of the input: the top of the
//   level (its peak, kept up through the dips between the beats of a held
//   chord) against a slower copy of it. While the top has just jumped, the
//   gain is the slower copy over the jump, so the note fades in from where
//   the sound was before it. It works on what feeds the cloud, and on the
//   dry sound as far as Mix brings the cloud up (so Mix 0 is the input).
// - Mix is equal power. Dry sound and an allpassed copy of it add at some
//   pitches and cancel at others, wholly where the two are as loud as each
//   other: within a fifth of either end of Mix a held note loses 3.9 dB at
//   the most, at the middle it can vanish. No mixing law avoids that.
// - What goes out is bounded: the cloud bends over at twice full scale and
//   never passes four times (`ceiling`), since a length or a coefficient
//   that jumps lets out at once what a stage had stored.
// - The device sleeps and wakes to the sample on its own clock, never on
//   the host's blocks (see `process`).
// - Storage: 22 stages a side on slices of one pool, sized for the longest
//   Size at 96 kHz with the right side's skew and the drift: 313,344 floats,
//   1.25 MB. Above 96 kHz the longest Sizes are held to what fits.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

namespace fog_layout {

constexpr int kShortStages = 4;
constexpr int kLongStages = 6;
constexpr int kLayerCount = 3;
constexpr int kStageCount = kShortStages + kLayerCount * kLongStages;
constexpr float kMaxSizeSeconds = 0.6f;  // the top of Size
constexpr float kPoolRate = 96000.0f;
constexpr float kDriftSeconds = 0.00025f;

// Each stage's length as a share of Size: the four short ones, then six for
// each layer. The eighteen long ones are 0.1197 times 0.62^(i/17), dealt to
// the layers in turn, so each layer spans the same range and no two lengths
// are in a simple ratio.
constexpr float kRatio[kStageCount] = {
    0.0393f, 0.0260f, 0.0159f, 0.0092f,
    0.1197f, 0.1100f, 0.1011f, 0.0929f, 0.0854f, 0.0785f,
    0.1164f, 0.1070f, 0.0983f, 0.0904f, 0.0830f, 0.0763f,
    0.1132f, 0.1040f, 0.0956f, 0.0879f, 0.0807f, 0.0742f,
};

// How far the right side's length lies from the left's at Width 1.
constexpr float kSkew[kStageCount] = {
    0.0871f, -0.0642f, 0.1012f,  -0.0783f, 0.0554f, -0.0925f, 0.0696f,  -0.1067f,
    0.0837f, -0.0608f, 0.0979f,  -0.0750f, 0.0521f, -0.0891f, 0.0662f,  -0.1033f,
    0.0804f, -0.0575f, 0.0946f,  -0.0716f, 0.1087f, -0.0858f,
};

constexpr int next_power_of_two(int n) {
  int p = 1;
  while (p < n) p <<= 1;
  return p;
}

// Samples a stage's line needs: its longest length at 96 kHz with the skew
// and the drift, and the two samples the interpolator reads past it.
constexpr int capacity(int stage) {
  const float skew = kSkew[stage] < 0.0f ? -kSkew[stage] : kSkew[stage];
  const float longest =
      kRatio[stage] * (1.0f + skew) * kMaxSizeSeconds * kPoolRate + kDriftSeconds * kPoolRate;
  return next_power_of_two(static_cast<int>(longest) + 8);
}

constexpr int pool_size() {
  int total = 0;
  for (int s = 0; s < kStageCount; ++s) total += capacity(s);
  return 2 * total;
}

}  // namespace fog_layout

class Fog : public kit::DeviceBase<fog::kNumParams> {
 public:
  // The Density law, for the harness and the display to hold the device to.
  static constexpr float kShortGain = 0.62f;
  static constexpr float kLongGainLow = 0.45f;
  static constexpr float kLongGainHigh = 0.60f;
  // The time a meter reads when no attack is on its way through the cloud.
  static constexpr float kRestAge = 60.0f;

  void init(float sample_rate) {
    using namespace fog;
    using namespace fog_layout;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();

    for (int i = 0; i < kPoolSize; ++i) pool_[i] = 0.0f;
    int offset = 0;
    for (int c = 0; c < 2; ++c) {
      for (int s = 0; s < kStages; ++s) {
        Stage& stage = stage_[c][s];
        stage = Stage();
        stage.data = pool_ + offset;
        stage.mask = capacity(s) - 1;
        stage.limit = static_cast<float>(capacity(s) - 4);
        offset += capacity(s);
        // 0.05 to 0.25 Hz, no two alike: the golden ratio spreads them.
        const float spread = 0.6180340f * static_cast<float>(s + 1) + (c == 0 ? 0.0f : 0.4142136f);
        stage.rate = 0.05f + 0.2f * (spread - std::floor(spread));
      }
      damp_[c].reset();
      low_cut_[c].reset();
    }

    const float control_rate = sr / kPeriod;
    glide_ = 1.0f - kit::time_to_coeff(kGlideSeconds, control_rate);
    width_.set_time(kGlideSeconds, control_rate);
    density_.set_time(kDensitySeconds, control_rate);
    density_size_ = -1.0f;
    drift_.set_time(0.05f, control_rate);
    damp_hz_.set_time(0.03f, control_rate);
    open_.set_time(0.03f, control_rate);
    low_cut_hz_.set_time(0.03f, control_rate);
    soften_.set_time(kSmoothingSeconds, sr);
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);

    hold_samples_ = static_cast<int>(kHoldSeconds * sr);
    release_ = kit::time_to_coeff(kReleaseSeconds, sr);
    beat_samples_ = static_cast<int>(kBeatSeconds * sr);
    fall_ = kit::time_to_coeff(kFallSeconds, sr);
    onset_ = kit::time_to_coeff(kOnsetSeconds, sr);
    rest_age_ = static_cast<long>(kRestAge * sr);

    // The longest silent gap is the wait for a cloud of three layers at the
    // longest Size: the sum of every length, with the skew.
    float longest = 0.0f;
    for (int s = 0; s < kStages; ++s) longest += kRatio[s];
    hold_ = static_cast<long>((1.15f * longest * kMaxSizeSeconds + 0.3f) * sr);
    quiet_ = hold_;
    dormant_ = true;

    for (int l = 0; l < kTaps; ++l) {
      weight_[l] = 0.0f;
      weight_target_[l] = 0.0f;
    }
    layers_ = 1;
    running_ = 0;
    fade_step_ = 1.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, seconds since the last attack came in (kRestAge when none is on its
  // way, and asleep); 1, how loud that attack was (a peak, 1 is full scale);
  // 2, the share of the gain Soften has taken off the sound now (0 is none).
  float meter(int index) const {
    const bool asleep = dormant_;
    switch (index) {
      case 0:
        return asleep ? kRestAge : static_cast<float>(age_) / sample_rate();
      case 1:
        return asleep ? 0.0f : hit_;
      case 2:
        return asleep ? 0.0f : 1.0f - duck_;
      default:
        return 0.0f;
    }
  }

  // The device sleeps and wakes on its own clock, to the sample, so that the
  // host's block size is never heard: it dozes off at the first turn of the
  // control clock after kFloor has not been passed for hold_ samples, writes
  // exact zeros while no sound comes in, and at the first sample that is not
  // silence starts again from the settings of now (what moved during the
  // sleep snaps, the drift and the control clock start over). A gate that
  // looked at whole blocks would start the clock at the top of the block the
  // sound came in, and the same notes would come out differently at another
  // block size.
  void process(int frames) {
    frames = begin_block(frames);
    int done = 0;
    while (done < frames) {
      if (dormant_) {
        int next = done;
        while (next < frames && in_left_[next] == 0.0f && in_right_[next] == 0.0f) ++next;
        for (int i = done; i < next; ++i) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
        }
        done = next;
        if (done == frames) break;
        dormant_ = false;
        quiet_ = 0;
        restart();
      }
      if (clock_ == 0) {
        if (quiet_ >= hold_) {
          dormant_ = true;
          continue;
        }
        control();
      }
      const int count = kit::clamp_int(frames - done, 1, kPeriod - clock_);
      render(done, count);
      clock_ += count;
      if (clock_ >= kPeriod) clock_ = 0;
      done += count;
    }
  }

 private:
  static constexpr int kShort = fog_layout::kShortStages;
  static constexpr int kLong = fog_layout::kLongStages;
  static constexpr int kTaps = fog_layout::kLayerCount;
  static constexpr int kStages = fog_layout::kStageCount;
  static constexpr int kPoolSize = fog_layout::pool_size();
  static constexpr int kPeriod = 32;
  // How fast a length follows Size and Width.
  static constexpr float kGlideSeconds = 0.2f;
  // Drift moves a stage by this share of its length at most.
  static constexpr float kDriftShare = 0.2f;
  // The fastest a length moves with Drift full up, in seconds a second (the
  // quickest sine, 0.25 Hz, at its steepest), and the most that speed times
  // the Size may be, in seconds: what keeps a held note at 4 kHz within
  // about 1.5 dB of its level through three layers.
  static constexpr float kDriftFastest = 6.2831853f * 0.25f * fog_layout::kDriftSeconds;
  static constexpr float kDriftPace = 1.0e-5f;
  // The shortest a stage may be: the interpolator reads two samples back.
  static constexpr float kShortest = 2.0f;
  // Damp runs the high cut from here down to kDampLowHz; under kDampOpen it
  // is blended out, so Damp 0 leaves the cloud untouched.
  static constexpr float kDampHighHz = 18000.0f;
  static constexpr float kDampLowHz = 1000.0f;
  static constexpr float kDampOpen = 0.1f;
  // Soften: the peak is held for kHoldSeconds (half a cycle of 42 Hz, so a
  // steady low note is a steady level), then falls with kReleaseSeconds. A
  // jump of less than kSlack is not an attack. The fade in takes
  // kSoftenFast at the bottom of the knob and kSoftenSlow at the top.
  static constexpr float kHoldSeconds = 0.012f;
  static constexpr float kReleaseSeconds = 0.06f;
  static constexpr float kSlack = 1.15f;
  static constexpr float kSoftenFast = 0.006f;
  static constexpr float kSoftenSlow = 0.05f;
  // What Soften measures a rise against is the top of the sound, not the
  // level of the moment: a level that has come back up by kBeatRise from its
  // low, to kBeatShare of the top or more, keeps the top where it was for
  // kBeatSeconds, and then the top falls to the level with kFallSeconds.
  // Two held notes a fifth apart at the bottom of a piano beat 27 times a
  // second and the level between them drops by half; without this every
  // one of those returns was softened, 14 dB of ripple on a held low chord.
  static constexpr float kBeatRise = 1.05f;
  static constexpr float kBeatShare = 0.3f;
  static constexpr float kBeatSeconds = 0.15f;
  static constexpr float kFallSeconds = 0.02f;
  // For the meters: an attack is a level twice what a 20 ms follower has
  // reached, over -60 dBFS, and the next one counts once that follower is
  // within a fifth of the level again.
  static constexpr float kOnsetSeconds = 0.02f;
  static constexpr float kOnsetRatio = 2.0f;
  static constexpr float kRearmRatio = 1.2f;
  static constexpr float kOnsetFloor = 0.001f;
  static constexpr float kWidthCurve = 5.0f;
  // Density glides over this long at least, and this many Sizes.
  static constexpr float kDensitySeconds = 0.02f;
  static constexpr float kDensitySizes = 1.0f;
  static constexpr float kInputBound = 16.0f;
  static constexpr float kCeilingKnee = 2.0f;
  static constexpr float kCeiling = 4.0f;
  // Under this the output counts as silence (-140 dBFS).
  static constexpr float kFloor = 1.0e-7f;

  // A Schroeder allpass whose length can move. At rest, or moving by a
  // sample a period or less, the length is read through a first-order
  // allpass interpolator whose coefficient ramps across the period; moving
  // faster, by straight interpolation between two samples.
  struct Stage {
    static constexpr float kLeast = 0.02f;
    float* data = nullptr;
    int mask = 0;
    int write = 0;
    float limit = 8.0f;
    double rest = 8.0;     // where Size and Width put it, gliding
    float length = 8.0f;   // where it is at the end of this period, with the drift
    float gain = 0.0f;
    float gain_step = 0.0f;
    float state = 0.0f;    // the interpolator's last output
    // Slow: the whole part of the length, and the interpolator's coefficient.
    int whole = 7;
    float eta = 0.0f;
    float eta_step = 0.0f;
    // Fast: the length sample by sample.
    bool fast = false;
    float position = 8.0f;
    float step = 0.0f;
    // The drift's own sine.
    float phase = 0.0f;
    float rate = 0.1f;
    // Just emptied: its length and coefficient snap at the next aim.
    bool fresh = true;

    void clear() {
      for (int i = 0; i <= mask; ++i) data[i] = 0.0f;
      state = 0.0f;
      fresh = true;
    }

    // Head for `wanted` samples over the next `period` samples.
    void aim(float wanted, bool snap, int period) {
      if (snap) length = wanted;
      const float from = length;
      const float distance = wanted - from;
      if (distance <= 1.0f && distance >= -1.0f) {
        fast = false;
        // The part past `whole` stays in [kLeast, kLeast + 2) over the
        // period. A first-order allpass set for a delay of d samples gives a
        // high note a little more or less than d, so when `whole` steps and
        // d with it the note's phase steps: at 10 kHz by a third of a radian
        // where d goes between 0.5 and 1.5, by a hundredth where it goes
        // between kLeast and one more. (The smaller kLeast, the nearer the
        // interpolator's pole lies to -1: at 0.02 it rings for 3 ms.)
        whole = static_cast<int>((from < wanted ? from : wanted) - kLeast);
        const float d0 = from - static_cast<float>(whole);
        const float d1 = wanted - static_cast<float>(whole);
        eta = (1.0f - d0) / (1.0f + d0);
        eta_step = ((1.0f - d1) / (1.0f + d1) - eta) * (1.0f / static_cast<float>(period));
      } else {
        fast = true;
        position = from;
        step = distance * (1.0f / static_cast<float>(period));
      }
      length = wanted;
    }

    // Run `frames` samples through the stage, in place.
    void process(float* x, int frames) {
      float held = state;
      float g = gain;
      int w = write;
      if (!fast) {
        float e = eta;
        for (int j = 0; j < frames; ++j) {
          e += eta_step;
          g += gain_step;
          const float newer = data[(w - whole) & mask];
          const float older = data[(w - whole - 1) & mask];
          held = older + e * (newer - held);
          const float v = flush_denormal(x[j] + g * held);
          data[w] = v;
          w = (w + 1) & mask;
          x[j] = held - g * v;
        }
        eta = e;
      } else {
        float p = position;
        for (int j = 0; j < frames; ++j) {
          p += step;
          g += gain_step;
          const int back = static_cast<int>(p);
          const float fraction = p - static_cast<float>(back);
          const float newer = data[(w - back) & mask];
          const float older = data[(w - back - 1) & mask];
          held = newer + (older - newer) * fraction;
          const float v = flush_denormal(x[j] + g * held);
          data[w] = v;
          w = (w + 1) & mask;
          x[j] = held - g * v;
        }
        position = p;
      }
      state = flush_denormal(held);
      gain = g;
      write = w;
    }
  };

  // How far the right side's lengths lie from the left's, of kSkew, for a
  // setting of Width. The two sides part above a frequency that falls as the
  // lengths part (at Size 150 they are apart over 2.4 kHz at 0.01 of kSkew,
  // over 600 Hz at 0.1 and over 150 Hz at 1), so a knob that ran evenly over
  // the lengths did all its work in its first twentieth. This runs evenly
  // over the frequency: every quarter of the knob is about two octaves.
  static float spread(float width) {
    if (width <= 0.0f) return 0.0f;
    if (width >= 1.0f) return 1.0f;
    return (std::exp(kWidthCurve * width) - 1.0f) / (std::exp(kWidthCurve) - 1.0f);
  }

  // What may come in: a sample that is not a number is silence, and nothing
  // is larger than kInputBound. One such sample would otherwise go down
  // every line of the chain.
  static float sane(float x) {
    if (!(x - x == 0.0f)) return 0.0f;  // not a number, or infinite
    return kit::clamp(x, -kInputBound, kInputBound);
  }

  // The cloud as it goes out: itself up to kCeilingKnee, and never past
  // kCeiling. A length that moves fast (Size, Width) or a coefficient that
  // drops (Density) lets out at once what a stage had stored, up to three
  // times a full-scale note's level for a moment; this is the bound on it.
  static float ceiling(float x) {
    const float size = x < 0.0f ? -x : x;
    if (size <= kCeilingKnee) return x;
    const float over = size - kCeilingKnee;
    const float room = kCeiling - kCeilingKnee;
    const float bent = kCeilingKnee + room * over / (room + over);
    return x < 0.0f ? -bent : bent;
  }

  // The settings as they are now, with nothing on its way: after init and
  // after a sleep.
  void restart() {
    using namespace fog;
    kit::Rng phases;
    phases.seed(0x7F4A7C15u);
    for (int c = 0; c < 2; ++c) {
      for (int s = 0; s < kStages; ++s) stage_[c][s].phase = phases.uniform();
    }
    width_.snap(width_.target);
    density_.snap(density_.target);
    drift_.snap(drift_.target);
    damp_hz_.snap(damp_hz_.target);
    open_.snap(open_.target);
    low_cut_hz_.snap(low_cut_hz_.target);
    soften_.snap(soften_.target);
    dry_.snap(dry_.target);
    wet_.snap(wet_.target);
    for (int l = 0; l < kTaps; ++l) weight_[l] = weight_target_[l];
    fast_ = 0.0f;
    slow_ = 0.0f;
    top_ = 0.0f;
    low_ = 0.0f;
    beat_left_ = 0;
    heard_ = 0.0f;
    hold_left_ = 0;
    armed_ = true;
    age_ = rest_age_;
    hit_ = 0.0f;
    duck_ = 1.0f;
    clock_ = 0;
    snap_ = true;
  }

  // Every 32 samples: where every length is going, the coefficients, the
  // filters, and which layers run.
  void control() {
    using namespace fog;
    using namespace fog_layout;
    const float sr = sample_rate();
    const bool snap = snap_;
    snap_ = false;

    // Which layers are heard, and so which run. One that starts, starts empty.
    int needed = 1;
    for (int l = 0; l < kTaps; ++l) {
      if (weight_[l] > 0.0f || weight_target_[l] > 0.0f) needed = l + 1;
    }
    for (int l = running_; l < needed; ++l) {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < kLong; ++k) stage_[c][kShort + l * kLong + k].clear();
      }
    }
    running_ = needed;

    // A coefficient that drops lets out what the stage had stored (2.5 times
    // a note's level at a resonance), so Density moves no faster than the
    // long stages empty: over a Size.
    if (param(kSize) != density_size_ || snap) {
      density_size_ = param(kSize);
      density_.set_time(kit::max(kDensitySeconds, kDensitySizes * density_size_ * 0.001f),
                        sr / kPeriod);
    }
    const float width = width_.next();
    const float density = density_.next();
    const float drift = drift_.next();
    const float size = param(kSize) * 0.001f * sr;
    const float turn = static_cast<float>(kPeriod) / sr;
    const float sweep = kDriftSeconds * sr;
    // A length that moves bends the pitch of what passes, and the stages
    // after it ring for about a Size: a note whose pitch moves across their
    // resonances in less time than that changes level. So the longer the
    // cloud, the slower every length drifts, and as far.
    const float pace =
        kit::min(1.0f, kDriftPace / (kDriftFastest * param(kSize) * 0.001f));
    const float long_gain = kit::lerp(kLongGainLow, kLongGainHigh, density);
    const float step = 1.0f / static_cast<float>(kPeriod);

    for (int s = 0; s < kShort + running_ * kLong; ++s) {
      const float magnitude =
          s < kShort ? kShortGain * kit::clamp(density * 5.0f - static_cast<float>(s), 0.0f, 1.0f)
                     : long_gain;
      const float gain = (s & 1) ? -magnitude : magnitude;
      float left_sine = 0.0f;
      for (int c = 0; c < 2; ++c) {
        Stage& stage = stage_[c][s];
        const bool jump = snap || stage.fresh;
        stage.fresh = false;
        // The left side rests on a whole sample. The right lies off it by
        // its skew, to a fraction of a sample, so that the bottom of Width
        // moves the sides apart evenly (rounded to whole samples, nothing
        // moved until one stage jumped by a sample, and then the highs
        // parted at once).
        const float whole = std::floor(kRatio[s] * size + 0.5f);
        const float share = c == 0 ? whole : whole + kRatio[s] * size * width * kSkew[s];
        const double target = kit::clamp(share, kShortest, std::floor(stage.limit));
        if (jump) {
          stage.rest = target;
        } else {
          stage.rest += (target - stage.rest) * glide_;
          if (stage.rest - target < 0.01 && target - stage.rest < 0.01) stage.rest = target;
        }
        const float rest = static_cast<float>(stage.rest);
        const float reach = kit::min(sweep, kDriftShare * rest);
        stage.phase += stage.rate * pace * turn;
        if (stage.phase >= 1.0f) stage.phase -= 1.0f;
        // The right side's drift is the left's at Width 0 and its own at 1.
        float sine = kit::SineTable::lookup(stage.phase);
        if (c == 0) {
          left_sine = sine;
        } else {
          sine = kit::lerp(left_sine, sine, width);
        }
        stage.aim(kit::clamp(rest + drift * reach * sine, kShortest, stage.limit), jump, kPeriod);
        if (jump) {
          stage.gain = gain;
          stage.gain_step = 0.0f;
        } else {
          stage.gain_step = (gain - stage.gain) * step;
        }
      }
    }

    open_.next();
    if (damp_hz_.next() != damp_set_ || snap) {
      damp_set_ = damp_hz_.value;
      for (int c = 0; c < 2; ++c) damp_[c].set(damp_set_, kit::kSqrtHalf, sr);
    }
    if (low_cut_hz_.next() != low_cut_set_ || snap) {
      low_cut_set_ = low_cut_hz_.value;
      for (int c = 0; c < 2; ++c) low_cut_[c].set(low_cut_set_, kit::kSqrtHalf, sr);
    }
    // Soften's fade in: longer the further the knob is up.
    if (param(kSoften) != attack_set_ || snap) {
      attack_set_ = param(kSoften);
      attack_ = kit::time_to_coeff(kit::lerp(kSoftenFast, kSoftenSlow, attack_set_), sr);
    }
  }

  void render(int offset, int count) {
    float in[2][kPeriod];
    float feed[kPeriod];
    float dry_gain[kPeriod];
    float wet_gain[kPeriod];
    float tap_gain[kTaps][kPeriod];
    float wet[2][kPeriod];

    for (int j = 0; j < count; ++j) {
      float left, right;
      take_input(offset + j, &left, &right);
      left = sane(left);
      right = sane(right);
      in[0][j] = left;
      in[1][j] = right;

      // The level, its peak held, and two slower copies of the peak: one for
      // Soften, one for the meters.
      const float level = kit::max(std::fabs(left), std::fabs(right));
      if (level >= fast_) {
        fast_ = level;
        hold_left_ = hold_samples_;
      } else if (level >= 0.9f * fast_) {
        hold_left_ = hold_samples_;
      } else if (hold_left_ > 0) {
        --hold_left_;
      } else {
        fast_ = flush_denormal(fast_ * release_);
      }
      // The top of the sound: the peak, kept up through a dip that the
      // sound comes back out of. Held notes beat against each other, and
      // each return from a beat's low is a rise like an attack's; it counts
      // as the same sound when the level is back up within kBeatSeconds.
      if (fast_ < low_) low_ = fast_;
      if (fast_ >= kBeatRise * low_ && fast_ >= kBeatShare * top_) {
        beat_left_ = beat_samples_;
        low_ = fast_;
      }
      if (fast_ >= top_) {
        top_ = fast_;
      } else if (beat_left_ > 0) {
        --beat_left_;
      } else {
        top_ = kit::max(fast_, flush_denormal(top_ * fall_));
      }
      slow_ = top_ < slow_ ? top_ : top_ + (slow_ - top_) * attack_;
      heard_ = fast_ < heard_ ? fast_ : fast_ + (heard_ - fast_) * onset_;

      const float soften = soften_.next();
      float duck = 1.0f;
      if (soften > 0.0f && top_ > 1.0e-9f) {
        const float kept = kit::min(1.0f, kSlack * slow_ / top_);
        duck = 1.0f - soften * (1.0f - kept);
      }
      duck_ = duck;
      feed[j] = duck;
      // The dry sound is ducked only as far as the cloud is up, so that at
      // Mix 0 it is the input.
      wet_gain[j] = wet_.next();
      dry_gain[j] = dry_.next() * (1.0f + (duck - 1.0f) * wet_gain[j]);

      if (armed_ && fast_ > kOnsetFloor && fast_ > kOnsetRatio * heard_) {
        armed_ = false;
        age_ = 0;
        hit_ = fast_;
      } else {
        if (!armed_ && fast_ <= kRearmRatio * heard_) armed_ = true;
        if (age_ < rest_age_) ++age_;
        if (age_ < hold_samples_ && fast_ > hit_) hit_ = fast_;
      }

      // The heard tap moves to the layer that was asked for, at equal power.
      for (int l = 0; l < kTaps; ++l) {
        const float distance = weight_target_[l] - weight_[l];
        if (distance != 0.0f) {
          weight_[l] += kit::clamp(distance, -fade_step_, fade_step_);
        }
        const float weight = weight_[l];
        tap_gain[l][j] = weight <= 0.0f ? 0.0f : (weight >= 1.0f ? 1.0f : std::sqrt(weight));
      }
    }

    for (int c = 0; c < 2; ++c) {
      float line[kPeriod];
      for (int j = 0; j < count; ++j) {
        line[j] = in[c][j] * feed[j];
        wet[c][j] = 0.0f;
      }
      int s = 0;
      for (; s < kShort; ++s) stage_[c][s].process(line, count);
      for (int l = 0; l < running_; ++l) {
        for (int k = 0; k < kLong; ++k, ++s) stage_[c][s].process(line, count);
        for (int j = 0; j < count; ++j) wet[c][j] += tap_gain[l][j] * line[j];
      }
    }

    const float open = open_.value;
    for (int j = 0; j < count; ++j) {
      for (int c = 0; c < 2; ++c) {
        const float cloud = wet[c][j];
        const float damped = damp_[c].lowpass(cloud);
        const float shaped = low_cut_[c].highpass(damped + (cloud - damped) * open);
        const float out = in[c][j] * dry_gain[j] + ceiling(shaped) * wet_gain[j];
        (c == 0 ? out_left_ : out_right_)[offset + j] = out;
        if (in[c][j] != 0.0f || out > kFloor || out < -kFloor) quiet_ = -1;
      }
      ++quiet_;
    }
  }

  void apply(int id) {
    using namespace fog;
    const float value = param(id);
    switch (id) {
      case kLayers: {
        const int wanted = kit::clamp_int(static_cast<int>(value + 0.5f), 1, kTaps);
        if (wanted == layers_ && weight_target_[wanted - 1] == 1.0f) break;
        // Up, the new layer has to fill before it can take over: the fade
        // lasts as long as the cloud takes to get through it. Down, the tap
        // is already full.
        const int more = wanted - layers_;
        const float seconds =
            more > 0 ? 0.06f + static_cast<float>(more) * param(kSize) * 0.001f : 0.06f;
        fade_step_ = 1.0f / (seconds * sample_rate());
        layers_ = wanted;
        for (int l = 0; l < kTaps; ++l) weight_target_[l] = l == wanted - 1 ? 1.0f : 0.0f;
        break;
      }
      case kWidth:
        width_.set_target(spread(value));
        break;
      case kDensity:
        density_.set_target(value);
        break;
      case kDrift:
        drift_.set_target(value);
        break;
      case kSoften:
        soften_.set_target(value);
        break;
      case kDamp:
        damp_hz_.set_target(kDampHighHz * std::pow(kDampLowHz / kDampHighHz, value));
        open_.set_target(kit::clamp(1.0f - value / kDampOpen, 0.0f, 1.0f));
        break;
      case kLowCut:
        low_cut_hz_.set_target(value);
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        if (value <= 0.0f) wet = 0.0f;
        dry_.set_target(dry);
        wet_.set_target(wet);
        break;
      }
      default:
        break;  // Size is read on the control clock
    }
  }

  float pool_[kPoolSize];
  Stage stage_[2][kStages];
  kit::Svf damp_[2];
  kit::Svf low_cut_[2];
  kit::Smoother width_, density_, drift_, damp_hz_, open_, low_cut_hz_;
  kit::Smoother soften_, dry_, wet_;
  // Asleep, and for how many samples nothing has come in or gone out.
  bool dormant_ = true;
  long quiet_ = 0;
  long hold_ = 1;
  float glide_ = 0.0f;
  float density_size_ = -1.0f;
  float damp_set_ = 0.0f;
  float low_cut_set_ = 0.0f;
  int clock_ = 0;
  bool snap_ = true;

  // Layers: which tap is heard, how much of each, and how many layers run.
  float weight_[kTaps] = {};
  float weight_target_[kTaps] = {};
  float fade_step_ = 1.0f;
  int layers_ = 1;
  int running_ = 0;

  // Soften.
  float fast_ = 0.0f;
  float slow_ = 0.0f;
  float top_ = 0.0f;
  float low_ = 0.0f;
  float fall_ = 0.0f;
  int beat_samples_ = 7200;
  int beat_left_ = 0;
  float attack_ = 0.0f;
  float attack_set_ = 0.0f;
  float release_ = 0.0f;
  int hold_samples_ = 576;
  int hold_left_ = 0;

  // For meter() only: never read by the sound.
  float heard_ = 0.0f;
  float onset_ = 0.0f;
  bool armed_ = true;
  long age_ = 0;
  long rest_age_ = 0;
  float hit_ = 0.0f;
  float duck_ = 1.0f;
};

}  // namespace livemix
