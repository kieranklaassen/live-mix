#pragma once

// Grain Delay: the repeats are rebuilt from short overlapping grains of the
// delayed signal, each with its own pitch, place in time, direction and pan.
//
//   in ──(+)──► anti-alias ──► limit ──► ring ──► grains ──► limit ─► tone ─► 30 Hz ──┬─► wet
//         ▲                                 (kit::GrainPool)                           │
//         └───────────────────────────── feedback ◄────────────────────────────────────┘
//
// - Grains start on a sample counter, Size / Density apart. A grain is placed
//   so that the middle of it is exactly Time old (plus up to Spray later);
//   one that reads faster than real time, or backwards, starts further back
//   so it never reaches the write point. That sets a floor under Time of
//   |ratio - 1| x Size / 2 forwards and (1 + ratio) x Size / 2 reversed.
// - Pitch is the grain's read speed, so it goes round the feedback loop:
//   every repeat is shifted again (the rising or falling "crystals").
// - Level. When every grain reads the same audio at the same speed (Pitch 0,
//   no sprays, no reverse) the windows add in amplitude and the device is a
//   plain delay at unity. Otherwise grains are unrelated and add in power.
//   The grain gain follows whichever applies, so the level holds as Density
//   and the sprays move. Unrelated grains also start at jittered intervals:
//   evenly spaced, a pitch-shifted tone would lock to the grain rate instead
//   of landing on the shifted pitch.
// - Spray and Pitch Spray are square-law amounts: up to 1 s later, and up to
//   an octave either way.
// - What is recorded is low-passed to what the pitch can carry, which keeps
//   upward shifts from aliasing.
// - Pitch, Time, Size and the sprays are read as each grain starts, so
//   moving them cannot click.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class GrainDelay : public kit::DeviceBase<grain_delay::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace grain_delay;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) line_[c].clear();
    written_ = 0;
    valid_from_ = 0;
    feedback_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    level_fall_ = std::exp(-1.0f / (kLevelSeconds * sr));
    rng_.seed(0x6A09E667u);
    asleep_ = true;
    quiet_ = 0;
    restart();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // the level being recorded (a peak that sinks back over 30 ms, 0 while
  // asleep), how many grains have started (it wraps at 4096), and for the
  // newest grain and the one before it where on the ring it started, in
  // seconds behind the write point as that is now, and its read speed
  // (negative backwards).
  float meter(int index) const {
    switch (index) {
      case 0:
        return asleep_ ? 0.0f : level_;
      case 1:
        return static_cast<float>(started_);
      case 2:
      case 4:
        return static_cast<float>((static_cast<double>(written_) - started_at_[index / 2 - 1]) /
                                  sample_rate());
      case 3:
      case 5:
        return started_ratio_[index / 2 - 1];
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace grain_delay;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      // Whatever the ring holds is from before the silence: never replay it.
      asleep_ = false;
      valid_from_ = written_;
      restart();
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (clock_.tick()) control();
      if (until_grain_ <= 0.0f) spawn_grain();
      until_grain_ -= 1.0f;

      float wet[2] = {0.0f, 0.0f};
      pool_.render(Tape{line_, written_, valid_from_}, &wet[0], &wet[1]);

      const float feedback = feedback_.next();
      for (int c = 0; c < 2; ++c) {
        // Linear up to full scale: only a pile-up of grains in phase is held.
        wet[c] = 2.0f * kit::soft_clip(0.5f * wet[c]);
        wet[c] = rumble_[c].highpass(tone_[c].lowpass(wet[c]));
        const float record = guard_[c].lowpass(in[c] + feedback * wet[c]);
        const float recorded = flush_denormal(kit::soft_clip(record));
        line_[c].write(recorded);
        // For the display only: nothing below reads it.
        level_ = kit::max(recorded < 0.0f ? -recorded : recorded,
                          c == 0 ? level_ * level_fall_ - 1.0e-12f : level_);
      }
      ++written_;

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    if (excited || output_peak(frames) > kit::IdleGate::kFloor) {
      quiet_ = 0;
    } else {
      quiet_ += frames;
      if (quiet_ >= hold_) asleep_ = true;
    }
  }

 private:
  // 10.9 s at 96 kHz. The farthest a grain reaches back is Time + Spray plus
  // a reversed four-octave grain's run: under 6 s.
  static constexpr int kRingSize = 1 << 20;
  static constexpr int kMaxGrains = 20;
  static constexpr float kMaxSpraySeconds = 1.0f;
  static constexpr float kMaxPitchSpraySemitones = 12.0f;
  static constexpr float kMaxRatio = 8.0f;
  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr float kAlikeSeconds = 0.0002f;
  static constexpr float kPitchOffset = 0.33f;
  static constexpr float kSprayOffset = 0.45f;
  static constexpr float kDetuneOffset = 0.01f;
  // How fast the level reported to a display sinks back.
  static constexpr float kLevelSeconds = 0.03f;

  // The ring as kit::GrainPool reads it: absolute positions, Hermite, and
  // silence for anything from before the last wake or not yet written.
  struct Tape {
    const kit::DelayLine<kRingSize>* lines;
    long long written;
    long long valid_from;

    float read(int channel, double position) const {
      const double floored = std::floor(position);
      const long long whole = static_cast<long long>(floored);
      const kit::DelayLine<kRingSize>& line = lines[channel];
      const float t = static_cast<float>(position - floored);
      if (whole - 1 >= valid_from && whole + 2 < written && written - whole < kRingSize - 2) {
        const int index = static_cast<int>(whole & (kRingSize - 1));
        return kit::hermite(line.at(index - 1), line.at(index), line.at(index + 1), line.at(index + 2),
                            t);
      }
      // At an edge of what the ring holds: sample by sample.
      float y[4];
      for (int k = 0; k < 4; ++k) {
        const long long index = whole - 1 + k;
        const bool held = index >= valid_from && index < written && written - index <= kRingSize;
        y[k] = held ? line.at(static_cast<int>(index & (kRingSize - 1))) : 0.0f;
      }
      return kit::hermite(y[0], y[1], y[2], y[3], t);
    }
  };

  // No grains, a grain due on the next sample (init and wake).
  void restart() {
    pool_.reset();
    for (int c = 0; c < 2; ++c) {
      tone_[c].reset();
      rumble_[c].reset();
      rumble_[c].set_cutoff(30.0f, sample_rate());
      guard_[c].reset();
    }
    clock_.reset(16);
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    guard_seen_ = -1.0f;
    until_grain_ = 0.0f;
    hold_ = 1;
    level_ = 0.0f;
  }

  float spray_seconds() const {
    const float amount = param(grain_delay::kSpray);
    return amount * amount * kMaxSpraySeconds;
  }

  float pitch_spray_semitones() const {
    const float amount = param(grain_delay::kPitchSpray);
    return amount * amount * kMaxPitchSpraySemitones;
  }

  // 1 when all grains read the same audio at the same speed, falling to 0 as
  // overlapping grains come to read places further apart than the signal
  // stays like itself (taken as 0.2 ms, a cycle of 800 Hz over 2π). Pitch
  // and Pitch Spray pull grains apart in proportion to their length, Spray
  // directly; a reversed grain is unrelated to the rest. The three factors
  // were fitted to band-limited noise (see the harness).
  float coherence(float size_seconds) const {
    using namespace grain_delay;
    const float off_speed = kit::semitones_to_ratio(param(kPitch)) - 1.0f;
    const float by_pitch = kPitchOffset * size_seconds * off_speed;
    const float by_spray = kSprayOffset * spray_seconds();
    const float by_detune = kDetuneOffset * size_seconds * pitch_spray_semitones();
    const float apart = (by_pitch * by_pitch + by_spray * by_spray + by_detune * by_detune) /
                        (kAlikeSeconds * kAlikeSeconds);
    return std::exp(-0.5f * kit::min(apart, 60.0f)) * (1.0f - param(kReverse));
  }

  // Mean power of a unit signal under `density` overlapping Hann windows:
  // added in amplitude (a periodic window sum: its mean and its first
  // harmonic, which vanishes from two-fold overlap up) or in power.
  static float coherent_power(float density) {
    const float off_one = 1.0f - density * density;
    const float ripple = off_one > -1.0e-3f
                             ? 0.5f
                             : kit::SineTable::lookup(0.5f * density) / (kit::kPi * density * off_one);
    return 0.25f * density * density * (1.0f + 2.0f * ripple * ripple);
  }
  static float scattered_power(float density) { return 0.375f * density; }

  void spawn_grain() {
    using namespace grain_delay;
    const float sr = sample_rate();
    const float size = param(kSize) * 0.001f * sr;
    const float density = param(kDensity);
    const float together = coherence(param(kSize) * 0.001f);

    const float semitones = param(kPitch) + pitch_spray_semitones() * rng_.bipolar();
    float ratio = kit::clamp(kit::semitones_to_ratio(semitones), 1.0f / kMaxRatio, kMaxRatio);
    const bool reversed = rng_.uniform() < param(kReverse);
    float delay = (param(kTime) * 0.001f + spray_seconds() * rng_.uniform()) * sr;
    const float pan = param(kSpread) * rng_.bipolar();
    const float jitter = 0.5f * (1.0f - together) * rng_.bipolar();

    // The grain's middle reads the sample that is `delay` old.
    const double now = static_cast<double>(written_);
    double start;
    if (reversed) {
      delay = kit::max(delay, 0.5f * (1.0f + ratio) * size + 4.0f);
      start = now - delay + 0.5 * size * (1.0f + ratio);
      ratio = -ratio;
    } else {
      const float lead = 0.5f * (ratio - 1.0f) * size;
      delay = kit::max(delay, (lead < 0.0f ? -lead : lead) + 4.0f);
      start = now - delay - lead;
    }
    const float power =
        together * coherent_power(density) + (1.0f - together) * scattered_power(density);
    // √2 undoes the -3 dB of the pool's constant-power pan at centre.
    if (pool_.spawn(start, ratio, size, pan, kSqrtTwo / std::sqrt(power), 1.0f)) {
      // For the display only (see meter).
      started_at_[1] = started_at_[0];
      started_ratio_[1] = started_ratio_[0];
      started_at_[0] = start;
      started_ratio_[0] = ratio;
      started_ = (started_ + 1) & 4095;
    }
    until_grain_ += kit::max(8.0f, size / density * (1.0f + jitter));
  }

  void control() {
    using namespace grain_delay;
    const float sr = sample_rate();
    const float pitch = param(kPitch);
    const float fastest = kit::min(
        kMaxRatio, kit::semitones_to_ratio((pitch < 0.0f ? -pitch : pitch) + pitch_spray_semitones()));
    const float fastest_up =
        kit::clamp(kit::semitones_to_ratio(pitch + pitch_spray_semitones()), 1.0f, kMaxRatio);
    if (param(kTone) != tone_seen_ || fastest_up != guard_seen_) {
      tone_seen_ = param(kTone);
      guard_seen_ = fastest_up;
      for (int c = 0; c < 2; ++c) {
        tone_[c].set(tone_seen_, 0.6f, sr);
        guard_[c].set(0.45f * sr / fastest_up, 0.7071f, sr);
      }
    }
    // Sound written now can still be read this much later: the gate waits
    // that long, measured over the settings in use since it last woke.
    const float size = param(kSize) * 0.001f;
    const float run = 0.5f * (1.0f + fastest) * size;
    const float reach = kit::max(param(kTime) * 0.001f + spray_seconds(), run) + run + size + 0.05f;
    const long hold = static_cast<long>(reach * sr);
    if (hold > hold_) hold_ = hold;
  }

  void apply(int id) {
    using namespace grain_delay;
    const float value = param(id);
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kFeedback:
        feedback_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // grain parameters are read per grain; the filters on the control clock
    }
  }

  kit::DelayLine<kRingSize> line_[2];
  kit::GrainPool<kMaxGrains> pool_;
  kit::Svf tone_[2];
  kit::Svf guard_[2];
  kit::OnePole rumble_[2];
  kit::Smoother feedback_, mix_;
  kit::ControlClock clock_;
  kit::Rng rng_;
  long long written_ = 0;
  long long valid_from_ = 0;
  float until_grain_ = 0.0f;
  // Gains and filter settings, worked out again only when a control moves.
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float tone_seen_ = -1.0f, guard_seen_ = -1.0f;
  long hold_ = 1;
  long quiet_ = 0;
  bool asleep_ = true;
  // For a display (see meter): what is being recorded, and the last two grains.
  float level_ = 0.0f;
  float level_fall_ = 0.0f;
  int started_ = 0;
  double started_at_[2] = {0.0, 0.0};
  float started_ratio_[2] = {1.0f, 1.0f};
};

}  // namespace livemix
