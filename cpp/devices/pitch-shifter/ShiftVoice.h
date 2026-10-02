#pragma once

// One pitch-shifted voice of the Pitch Shifter: a small pool of read heads
// on a ring of recent input shared with the other voice. A head reads the
// ring at `ratio` samples per sample under a window, so its delay shrinks
// (shifting up) or grows (shifting down) while it sounds; before it runs out
// of room another head takes over further back or further forward. How the
// next head is placed and windowed is the mode:
//
//   Smooth   two Hann heads half a window apart. Each new head starts where
//            the ring best matches what the old head is playing
//            (normalised cross-correlation over one search range), the
//            de-glitched splice of the studio harmonizers: a single note
//            comes out as a steady tone, and a chord gets the closest
//            agreement its notes allow. Where the two heads still disagree
//            the pair is lifted to constant power.
//   Grain    four-fold overlapping Hann grains at regular intervals; Jitter
//            scatters their spacing, their place in time, their pitch and
//            their pan.
//   Vintage  two heads half a window apart sweeping a fixed stretch of the
//            ring under Hann gains, with no alignment: the plain delay-line
//            shifter. It splices once per window divided by the pitch
//            offset, so a small detune is nearly seamless and a wide
//            interval flutters.
//
// A change of mode starts a new generation of heads, already in full swing,
// and crossfades the generations with equal power.

#include "../../kit/kit.h"

namespace livemix {
namespace pitch_shifter_dsp {

constexpr int kRingSize = 1 << 18;  // 2.7 s at 96 kHz
constexpr int kRingMask = kRingSize - 1;

enum Mode : int { kSmooth = 0, kGrain, kVintage, kNumModes };

// The recent input (plus feedback), left, right and their mean (what the
// splice search listens to, so both channels splice at the same place and
// the stereo image holds).
struct Ring {
  kit::DelayLine<kRingSize> left, right, mono;

  void clear() {
    left.clear();
    right.clear();
    mono.clear();
  }
  void write(float l, float r) {
    left.write(l);
    right.write(r);
    mono.write(0.5f * (l + r));
  }
  // Index of the next sample to be written; the newest sample is now() - 1.
  int now() const { return left.write_position(); }
};

// What a voice needs to know when it starts a head, refreshed by the device
// on its control clock.
struct VoiceSetup {
  int mode = kSmooth;
  float size = 3840.0f;         // samples
  float jitter = 0.0f;          // 0..1
  float sample_rate = 48000.0f;
  float target_ratio = 1.0f;    // where the ratio is heading (head room for a sweep)
  float grain_gain = 0.5f;      // per-grain gain in Grain mode
};

class ShiftVoice {
 public:
  void reset(uint32_t seed, float sample_rate) {
    for (Head& head : heads_) head.active = false;
    rng_.seed(seed);
    generation_ = 0;
    blend_ = 1.0f;
    blend_step_ = 1.0f / (kModeFadeSeconds * sample_rate);
    until_spawn_ = 0.0f;
    match_ = 1.0f;
    newest_ = -1;
    started_ = false;
    mode_ = -1;
    sweeping_ = false;
    sweep_generation_ = 0;
    sweep_phase_ = 0.0f;
    sweep_window_ = 0.0f;
    sweep_lag_ = 1.0f - kit::time_to_coeff(0.05f, sample_rate);
    for (int k = 0; k < 2; ++k) {
      sweep_offset_[k] = 0.0f;
      sweep_stretch_[k] = 1.0f;
      sweep_seen_[k] = 0.5f * static_cast<float>(k);
    }
  }

  // Drop every head; the next render starts the mode again in full swing.
  void restart() {
    for (Head& head : heads_) head.active = false;
    blend_ = 1.0f;
    started_ = false;
    newest_ = -1;
    sweeping_ = false;
    sweep_window_ = 0.0f;
  }

  // One output frame. `base` is the extra delay (the Delay control) in
  // samples, `ratio` the smoothed pitch ratio.
  void render(const Ring& ring, const VoiceSetup& setup, double base, float ratio, float* left,
              float* right) {
    if (!started_ || (setup.mode != mode_ && blend_ >= 1.0f)) begin_mode(ring, setup, base, ratio);
    if (until_spawn_ <= 0.0f) until_spawn_ += spawn(ring, setup, base, ratio, 0.0f);
    until_spawn_ -= 1.0f;

    float gain[2] = {1.0f, 0.0f};  // this generation, the one before
    if (blend_ < 1.0f) {
      blend_ += blend_step_;
      if (blend_ >= 1.0f) {
        blend_ = 1.0f;
        for (Head& head : heads_) {
          if (head.generation != generation_) head.active = false;
        }
        if (sweep_generation_ != generation_) sweeping_ = false;
      }
      gain[0] = kit::SineTable::lookup(0.25f * blend_);
      gain[1] = kit::SineTable::cos_lookup(0.25f * blend_);
    }

    const double origin = static_cast<double>(ring.now()) - base;
    const double limit = static_cast<double>(kMaxDelay) - base;
    float sum_left = 0.0f, sum_right = 0.0f;
    float join_left = 0.0f, join_right = 0.0f;  // the Smooth heads, normalised below
    float product = 1.0f;
    int joined = 0;
    for (Head& head : heads_) {
      if (!head.active) continue;
      const float window = window_at(head.phase, head.edge);
      const double position = origin - head.delay;
      const double floored = std::floor(position);
      const int index = static_cast<int>(static_cast<long long>(floored) & kRingMask);
      const float t = static_cast<float>(position - floored);
      const float l = kit::hermite(ring.left.at(index - 1), ring.left.at(index),
                                   ring.left.at(index + 1), ring.left.at(index + 2), t);
      const float r = kit::hermite(ring.right.at(index - 1), ring.right.at(index),
                                   ring.right.at(index + 1), ring.right.at(index + 2), t);
      const float g = window * gain[head.generation == generation_ ? 0 : 1];
      if (head.mode == kSmooth && head.generation == generation_) {
        join_left += window * l;
        join_right += window * r;
        product *= window;
        ++joined;
      } else {
        sum_left += g * head.gain_left * l;
        sum_right += g * head.gain_right * r;
      }
      head.delay += 1.0 - static_cast<double>(ratio * head.detune);
      if (head.delay < kMinDelay) head.delay = kMinDelay;
      if (head.delay > limit) head.delay = limit;
      head.phase += head.phase_step;
      if (head.phase >= 1.0f) head.active = false;
    }
    if (joined > 0) {
      // Two heads in a join add to 1 in amplitude; when they do not agree
      // (match < 1) that dips in power, so lift it back.
      float lift = gain[0];
      if (joined == 2 && match_ < 0.999f) {
        lift /= std::sqrt(kit::max(0.25f, 1.0f - 2.0f * product * (1.0f - match_)));
      }
      sum_left += lift * join_left;
      sum_right += lift * join_right;
    }
    if (sweeping_) {
      const float g = gain[sweep_generation_ == generation_ ? 0 : 1];
      sweep(ring, setup, origin, limit, ratio, g, &sum_left, &sum_right);
    }
    *left = sum_left;
    *right = sum_right;
  }

  static constexpr float kMinDelay = 4.0f;
  static constexpr float kMaxDelay = static_cast<float>(kRingSize - 8);

 private:
  static constexpr int kMaxHeads = 12;
  static constexpr float kModeFadeSeconds = 0.04f;
  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr float kFloorSeconds = 0.0015f;   // the closest a head starts to the write point
  static constexpr int kGrainOverlap = 4;
  // Smooth: time between splices and length of the join, as shares of Size.
  static constexpr float kSmoothHop = 0.5f;
  static constexpr float kSmoothFade = 0.5f;
  // Jitter at full: each head's own detune, in cents either way.
  static constexpr float kSmoothCents = 20.0f;
  static constexpr float kGrainCents = 40.0f;
  // Vintage: the stretch of ring a head sweeps, as a share of Size (a steady
  // tone comes out as lines |1 - ratio| / stretch apart around the pitch: the
  // flutter, slower and closer to the pitch as Size grows); at full Jitter
  // each pass starts up to this much later and sweeps this much more
  // or less (its pitch offset is that much wide or narrow).
  static constexpr float kSweepShare = 1.0f;
  static constexpr float kSweepScatterSeconds = 0.02f;
  static constexpr float kSweepStretch = 0.03f;
  // The splice search: how far it looks, over what length it compares.
  static constexpr float kSearchSeconds = 0.02f;
  static constexpr float kSpanSeconds = 0.016f;
  static constexpr int kPoints = 48;
  static constexpr int kMaxScan = 512;  // lags tried in the first pass
  static constexpr float kNearBias = 0.03f;

  struct Head {
    bool active = false;
    int generation = 0;
    int mode = kSmooth;
    double delay = 0.0;       // behind the write point, less the base delay
    float detune = 1.0f;      // this head's own factor on the ratio (Jitter)
    float phase = 0.0f;       // 0..1 over its life
    float phase_step = 0.0f;
    float edge = 0.5f;        // share of the life each fade takes (0.5 = Hann)
    float gain_left = 1.0f, gain_right = 1.0f;
  };

  // Start (or switch to) the mode in setup, with its heads already in full
  // swing so the level is there from the first sample.
  void begin_mode(const Ring& ring, const VoiceSetup& setup, double base, float ratio) {
    if (started_) {
      generation_ ^= 1;
      blend_ = 0.0f;
      for (Head& head : heads_) {
        if (head.generation == generation_) {
          head.active = false;       // silent leftovers of the switch before last
        } else {
          head.phase_step = 0.0f;    // holds its weight; the blend fades it out
        }
      }
    }
    if (sweeping_ && sweep_generation_ == generation_) sweeping_ = false;
    started_ = true;
    mode_ = setup.mode;
    newest_ = -1;
    switch (mode_) {
      case kGrain:
        for (int k = kGrainOverlap - 1; k >= 1; --k) {
          spawn(ring, setup, base, ratio, static_cast<float>(k) / kGrainOverlap);
        }
        until_spawn_ = 0.0f;
        break;
      case kVintage:
        sweeping_ = true;
        sweep_generation_ = generation_;
        until_spawn_ = 1.0e30f;  // the sweep has no heads to start
        break;
      default: {
        const float fade = setup.size * kSmoothFade;
        until_spawn_ = spawn(ring, setup, base, ratio, -1.0f) - fade;
        break;
      }
    }
  }

  // Start one head; returns the time to the next one in samples. `pre_age`
  // starts it part-way through its life (negative: at the end of its fade
  // in), placed where a head of that age would be.
  float spawn(const Ring& ring, const VoiceSetup& setup, double base, float ratio, float pre_age) {
    const float j = setup.jitter;
    const float j2 = j * j;
    const float size = kit::max(setup.size, 64.0f);
    float life = size, edge = 0.5f, interval = size, scatter = 0.0f, pan = 0.0f, gain = 1.0f;
    float cents = 0.0f;
    switch (mode_) {
      case kGrain:
        interval = size * (1.0f / kGrainOverlap) * (1.0f + 0.6f * j * rng_.bipolar());
        scatter = j2 * (size + 0.02f * setup.sample_rate) * rng_.uniform();
        cents = kGrainCents * j2 * rng_.bipolar();
        pan = 0.8f * j * rng_.bipolar();
        gain = setup.grain_gain;
        break;
      default: {
        const float fade = size * kSmoothFade;
        interval = kit::max(fade, size * kSmoothHop * (1.0f + 0.5f * j * rng_.bipolar()));
        life = interval + fade;
        edge = fade / life;
        cents = kSmoothCents * j2 * rng_.bipolar();
        break;
      }
    }
    Head* head = nullptr;
    int slot = 0;
    for (int i = 0; i < kMaxHeads && head == nullptr; ++i) {
      if (!heads_[i].active) {
        head = &heads_[i];
        slot = i;
      }
    }
    if (head == nullptr) return interval;

    const float detune = kit::cents_to_ratio(cents);
    const float floor_delay = kit::max(kMinDelay, kFloorSeconds * setup.sample_rate);
    // Shifting up, a head closes on the write point: it starts far enough
    // back for its whole life at the faster of the ratio now and where the
    // ratio is heading.
    const float fastest = kit::max(ratio, setup.target_ratio) * detune;
    const float room = fastest > 1.0f ? (fastest - 1.0f) * life : 0.0f;
    double delay = static_cast<double>(floor_delay + room + scatter);

    const float age = pre_age < 0.0f ? edge : pre_age;
    if (mode_ == kSmooth && pre_age == 0.0f && newest_ >= 0 && heads_[newest_].active &&
        heads_[newest_].generation == generation_) {
      delay = find_splice(ring, setup, base, heads_[newest_].delay, delay);
    } else {
      match_ = 1.0f;
      delay += static_cast<double>((1.0f - ratio * detune) * age * life);
    }

    head->active = true;
    head->generation = generation_;
    head->mode = mode_;
    head->delay = delay;
    head->detune = detune;
    head->phase = age;
    head->phase_step = 1.0f / life;
    head->edge = edge;
    // A balance, so a grain leans to one side without leaving the other.
    kit::pan_gains(pan, &head->gain_left, &head->gain_right);
    head->gain_left *= gain * kSqrtTwo;
    head->gain_right *= gain * kSqrtTwo;
    newest_ = slot;
    return interval;
  }

  // Vintage: two heads half a window apart sweep the same stretch of ring,
  // towards the write point to shift up and away from it to shift down, and
  // jump back to the other end where their Hann gain is zero. The gains
  // always add to one.
  void sweep(const Ring& ring, const VoiceSetup& setup, double origin, double limit, float ratio,
             float gain, float* left, float* right) {
    const float target = kit::max(64.0f, kSweepShare * setup.size);
    if (sweep_window_ <= 0.0f) sweep_window_ = target;
    sweep_window_ += (target - sweep_window_) * sweep_lag_;  // a Size change bends, it does not jump
    sweep_phase_ += (1.0f - ratio) / sweep_window_;
    sweep_phase_ -= std::floor(sweep_phase_);
    const float floor_delay = kit::max(kMinDelay, kFloorSeconds * setup.sample_rate);
    for (int k = 0; k < 2; ++k) {
      float phase = sweep_phase_ + 0.5f * static_cast<float>(k);
      if (phase >= 1.0f) phase -= 1.0f;
      const float jump = phase - sweep_seen_[k];
      sweep_seen_[k] = phase;
      if (jump > 0.5f || jump < -0.5f) {
        // A new pass, silent at this moment: Jitter moves it and bends it.
        const float j2 = setup.jitter * setup.jitter;
        sweep_offset_[k] = j2 * kSweepScatterSeconds * setup.sample_rate * rng_.uniform();
        sweep_stretch_[k] = 1.0f + kSweepStretch * j2 * rng_.bipolar();
      }
      const float weight = gain * (0.5f - 0.5f * kit::SineTable::cos_lookup(phase));
      double delay = static_cast<double>(floor_delay + sweep_offset_[k] +
                                         phase * sweep_window_ * sweep_stretch_[k]);
      if (delay > limit) delay = limit;
      const double position = origin - delay;
      const double floored = std::floor(position);
      const int index = static_cast<int>(static_cast<long long>(floored) & kRingMask);
      const float t = static_cast<float>(position - floored);
      *left += weight * kit::hermite(ring.left.at(index - 1), ring.left.at(index),
                                     ring.left.at(index + 1), ring.left.at(index + 2), t);
      *right += weight * kit::hermite(ring.right.at(index - 1), ring.right.at(index),
                                      ring.right.at(index + 1), ring.right.at(index + 2), t);
    }
  }

  // Where a new Smooth head should start: at or behind `nominal`, within one
  // search range, where the ring best matches what the old head (at
  // `old_delay`) is playing. Both heads then move along the ring at the same
  // speed, so a match now is a match for the whole join. Sets match_ to the
  // correlation found (1 = the two are alike). Delays are less the base.
  double find_splice(const Ring& ring, const VoiceSetup& setup, double base, double old_delay,
                     double nominal) {
    const float sr = setup.sample_rate;
    const int now = ring.now();
    // No further than one window: a short Size splices often and looks less far.
    const int range = static_cast<int>(kit::min(kSearchSeconds * sr, kit::max(setup.size, 64.0f)));
    const float span = kSpanSeconds * sr;
    const float stride = span / kPoints;
    // Compared on whole samples; the old head's fraction is given back at the end.
    const double old_total = base + old_delay;
    const int old_whole = static_cast<int>(old_total + 0.5);
    const double residue = old_total - static_cast<double>(old_whole);
    const int coarse = range / kMaxScan + 1;
    // Lag 0 sits one coarse step behind the nominal start, so the step
    // before it can be looked at too.
    const int first = static_cast<int>(base + nominal + 0.5) + coarse + 1;
    // The comparison straddles the join as far as the ring already holds
    // what lies ahead of both heads, and looks back for the rest.
    const float ahead =
        kit::clamp(static_cast<float>(old_whole < first ? old_whole : first) - 4.0f, 0.0f, 0.5f * span);
    // Points are weighted by a Hann bell: with a hard-edged comparison the
    // best lag of a steady tone leans by where the edges fall in its cycle.
    int offset[kPoints];
    float reference[kPoints];
    float weight[kPoints];
    float energy = 0.0f;
    for (int i = 0; i < kPoints; ++i) {
      // Unevenly spaced (golden-ratio steps inside each stride): on an even
      // grid a tone at a multiple of the grid's rate looks the same at
      // every lag.
      const float wander = static_cast<float>(i) * 0.6180340f;
      const float place = static_cast<float>(i) + wander - std::floor(wander);
      offset[i] = static_cast<int>(ahead - place * stride);
      weight[i] = 0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(i) + 0.5f) / kPoints);
      const float sample = ring.mono.at(now - old_whole + offset[i]);
      reference[i] = weight[i] * sample;
      energy += reference[i] * sample;
    }
    if (energy < 1.0e-14f) {
      match_ = 1.0f;
      return nominal;
    }
    const float scale = std::sqrt(energy);
    const auto score = [&](int lag) {
      const int origin = now - first - lag;
      float match = 0.0f;
      float power = 1.0e-20f;
      for (int i = 0; i < kPoints; ++i) {
        const float sample = ring.mono.at(origin + offset[i]);
        match += reference[i] * sample;
        power += weight[i] * sample * sample;
      }
      // Among equal matches (a steady tone gives one per cycle) take the nearest.
      return match / std::sqrt(power) - kNearBias * scale * static_cast<float>(lag) / static_cast<float>(range);
    };
    // Scan the range (one step beyond each end, so an end can be told from
    // a peak) and take the best lag that is a peak: the highest point at an
    // end is the side of a peak outside the range, and splicing there would
    // be off by part of a sample.
    const int count = range / coarse;
    float scores[kMaxScan + 2];
    for (int i = 0; i <= count + 2; ++i) scores[i] = score((i - 1) * coarse);
    int best = -1;
    float best_score = -1.0e30f;
    for (int i = 1; i <= count + 1; ++i) {
      if (scores[i] > best_score && scores[i] >= scores[i - 1] && scores[i] >= scores[i + 1]) {
        best_score = scores[i];
        best = (i - 1) * coarse;
      }
    }
    if (best < 0) {
      best = 0;
      best_score = scores[1];
    }
    const int centre = best;
    for (int lag = centre - coarse + 1; lag < centre + coarse; ++lag) {
      if (lag == centre) continue;
      const float value = score(lag);
      if (value > best_score) {
        best_score = value;
        best = lag;
      }
    }
    // The top of the parabola through the best lag and its neighbours: the
    // fraction of a sample that keeps a pure tone free of sidebands.
    float fraction = 0.0f;
    {
      const float before = score(best - 1);
      const float after = score(best + 1);
      const float curve = before - 2.0f * best_score + after;
      if (curve < -1.0e-12f) fraction = kit::clamp(0.5f * (before - after) / curve, -0.5f, 0.5f);
    }
    const float found = best_score + kNearBias * scale * static_cast<float>(best) / static_cast<float>(range);
    match_ = kit::clamp(found / scale, 0.0f, 1.0f);
#ifdef PS_DEBUG
    std::printf("splice now %d old %.2f first %d best %d frac %.3f match %.4f energy %g\n", now, old_total, first, best, fraction, match_, energy);
#endif
    return static_cast<double>(first + best) + static_cast<double>(fraction) + residue - base;
  }

  static float window_at(float phase, float edge) {
    if (phase < edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * phase / edge);
    if (phase > 1.0f - edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * (1.0f - phase) / edge);
    return 1.0f;
  }

  Head heads_[kMaxHeads];
  kit::Rng rng_;
  int generation_ = 0;
  int mode_ = -1;
  int newest_ = -1;
  float blend_ = 1.0f, blend_step_ = 0.0f;
  float until_spawn_ = 0.0f;
  float match_ = 1.0f;
  bool started_ = false;
  // Vintage: one phase for the pair of heads, and per head what Jitter drew
  // for its current pass.
  bool sweeping_ = false;
  int sweep_generation_ = 0;
  float sweep_phase_ = 0.0f;
  float sweep_window_ = 0.0f, sweep_lag_ = 0.0f;
  float sweep_offset_[2] = {0.0f, 0.0f};
  float sweep_stretch_[2] = {1.0f, 1.0f};
  float sweep_seen_[2] = {0.0f, 0.5f};
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
