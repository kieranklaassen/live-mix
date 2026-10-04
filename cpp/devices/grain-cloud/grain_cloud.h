#pragma once

// Cloud: a live granular processor.
//
//   in ──┬─────────────────────────────────────────────► dry ─┐
//        └─(+)─► × record ─► ring buffer (8 s) ─► grains ─► limit ─┬─► wet ─┴─► out
//           ▲                                                      │
//           └── feedback ◄─ 9 kHz low-pass ◄─ DC block ◄───────────┘
//
// - The input is always being recorded; a sample counter starts grains at
//   Density per second (each interval jittered ±50 %, so a cloud never
//   buzzes at its grain rate). A grain copies Position, Size, Pitch and the
//   rest when it starts and keeps them, so every control is click-free.
// - Every grain reads a stretch of buffer that was already written when it
//   started (it begins at least rate × size behind the record head) and that
//   the head will not reach while it plays. Nothing ever reads across the
//   head, which is the one discontinuity in the ring, so Freeze can stop the
//   head at any moment. At extreme Pitch a long grain is shortened to fit.
// - Position 0 is the newest audio a grain can use, 1 the oldest. Spray adds
//   a random offset of up to Spray² × the whole buffer (reflected at the
//   ends), so the lower half of the control stays within two seconds.
// - Freeze fades the record gain to zero over 30 ms and then stops the head;
//   unfreezing fades it back in. The seam between old and new audio is
//   therefore silence on both sides.
// - Level: grains are summed with gain 1/√(overlap × mean square of the
//   window), the gain that keeps the power of a sum of unrelated grains equal
//   to the source, capped at 1 so sparse grains play at the source level.
//   Grains are kept unrelated by a 30 ms random offset on where each one
//   reads even with Spray at 0; without it a dense cloud of a steady tone
//   would add up in phase and come out √overlap too loud.
// - Scatter detunes each grain by up to ±24 cents; above half, a growing
//   share of grains also jump by an octave or a fifth.
// - The device sleeps once the buffer holds nothing above -140 dBFS. A frozen
//   buffer with sound in it never does: it plays until Freeze is released.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class GrainCloud : public kit::DeviceBase<grain_cloud::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace grain_cloud;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      feedback_cut_[c].reset();
      feedback_cut_[c].set_cutoff(kFeedbackCutHz, sr);
      feedback_dc_[c].reset();
      feedback_dc_[c].set_cutoff(20.0f, sr);
    }
    for (int i = 0; i < kBufferSize; ++i) tape_.data[i][0] = tape_.data[i][1] = 0.0f;
    tape_.cached_position = -1.0;
    tape_.cached_right = 0.0f;
    pool_.reset();
    rng_.seed(0xC10D5EEDu);
    length_ = static_cast<long>(kBufferSeconds * sr);
    if (length_ > kBufferSize - 64) length_ = kBufferSize - 64;
    head_ = kBufferSize;
    quiet_written_ = length_;
    until_next_ = 0.0f;
    interval_ = sr;
    mix_seen_ = -1.0f;
    record_.set_time(kFreezeFadeSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    clock_.reset(32);
    idle_.reset(sr, 0.05f);
    spawned_ = 0;
    spawn_place_ = 0.0f;
    spawn_rate_ = 1.0f;
    spawn_pan_ = 0.0f;
    record_peak_ = 0.0f;
    record_peak_fall_ = kit::time_to_coeff(kRecordPeakSeconds, sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw the
  // cloud: how many grains have started, where the newest one began (seconds
  // behind the record head, the old end of the stretch it reads), at what
  // speed (negative backwards) and where from left (-1) to right (1), and
  // the level being recorded.
  float meter(int index) const {
    switch (index) {
      case 0:
        return static_cast<float>(spawned_ & 0xFFFFFF);
      case 1:
        return spawn_place_;
      case 2:
        return spawn_rate_;
      case 3:
        return spawn_pan_;
      case 4:
        return record_peak_;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace grain_cloud;
    frames = begin_block(frames);
    // Awake while anything audible is in the buffer: frozen, that is forever.
    if (!idle_.wake(input_present(frames) || quiet_written_ < length_)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (clock_.tick()) schedule();
      until_next_ -= 1.0f;
      if (until_next_ <= 0.0f) {
        spawn();
        until_next_ += interval_ * (0.5f + rng_.uniform());
      }

      float cloud[2] = {0.0f, 0.0f};
      pool_.render(tape_, &cloud[0], &cloud[1]);
      // Linear up to ±1, never past ±2.
      const float wet[2] = {2.0f * kit::soft_clip(0.5f * cloud[0]), 2.0f * kit::soft_clip(0.5f * cloud[1])};

      const float record = record_.next();
      if (record > 0.0f) {
        const float feedback = feedback_.next();
        float loudest = 0.0f;
        for (int c = 0; c < 2; ++c) {
          const float back = feedback_dc_[c].process(feedback_cut_[c].lowpass(wet[c]));
          float written = flush_denormal(record * (in[c] + feedback * back));
          // A NaN or runaway input must not stay in the buffer for 8 s.
          if (!(written > -8.0f && written < 8.0f)) written = 0.0f;
          tape_.data[head_ & kMask][c] = written;
          loudest = kit::max(loudest, written < 0.0f ? -written : written);
        }
        ++head_;
        // For the display only: the level going onto the tape, falling over 50 ms.
        record_peak_ = loudest > record_peak_ ? loudest : flush_denormal(record_peak_ * record_peak_fall_);
        if (loudest > kit::IdleGate::kFloor) {
          quiet_written_ = 0;
        } else if (quiet_written_ < length_) {
          ++quiet_written_;
        }
      } else {
        feedback_.next();
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kBufferSize = 1 << 20;  // per channel; 8 s at 96 kHz is 768000
  static constexpr int kMask = kBufferSize - 1;
  static constexpr float kBufferSeconds = 8.0f;
  static constexpr int kMaxGrains = 32;
  // More grains than this at once add CPU, not density: past it the grain
  // rate is held back (2 s grains at 100 per second would need 200).
  static constexpr float kMaxOverlap = 24.0f;
  static constexpr float kFreezeFadeSeconds = 0.03f;
  static constexpr float kMinSpraySeconds = 0.03f;
  static constexpr float kScatterCents = 24.0f;
  static constexpr float kFeedbackCutHz = 9000.0f;
  static constexpr float kMargin = 16.0f;  // samples kept clear of the record head
  static constexpr float kRecordPeakSeconds = 0.05f;
  static constexpr float kJumps[8] = {12.0f, -12.0f, 7.0f, -5.0f, 12.0f, -12.0f, 19.0f, 24.0f};

  // The ring buffer as a GrainPool source, both channels side by side so a
  // grain touches one stretch of memory. Positions count recorded samples
  // (the head's own count, which starts one buffer length up so that no
  // position is negative and truncation is floor); they wrap by the mask.
  // GrainPool asks for channel 0 and then channel 1 at the same position;
  // the second answer is worked out with the first.
  struct Tape {
    float data[kBufferSize][2];
    mutable double cached_position = -1.0;
    mutable float cached_right = 0.0f;

    float read(int channel, double position) const {
      if (channel == 1 && position == cached_position) return cached_right;
      const long long index = static_cast<long long>(position);
      const float fraction = static_cast<float>(position - static_cast<double>(index));
      const float* a = data[(index - 1) & kMask];
      const float* b = data[index & kMask];
      const float* c = data[(index + 1) & kMask];
      const float* d = data[(index + 2) & kMask];
      cached_position = position;
      cached_right = kit::hermite(a[1], b[1], c[1], d[1], fraction);
      const float left = kit::hermite(a[0], b[0], c[0], d[0], fraction);
      return channel == 0 ? left : cached_right;
    }
  };

  void apply(int id) {
    using namespace grain_cloud;
    const float value = param(id);
    switch (id) {
      case kFreeze:
        record_.set(value >= 0.5f ? 0.0f : 1.0f, primed());
        break;
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // everything else is read when a grain starts
    }
  }

  // Grain size in samples at `rate`, shortened so its source stretch
  // (rate × size) and the head's travel while it plays (size) fit the buffer.
  float grain_length(float rate) const {
    const float wanted = param(grain_cloud::kSize) * 0.001f * sample_rate();
    const float room = static_cast<float>(length_) - 2.0f * kMargin - kMinSpraySeconds * sample_rate();
    return kit::min(wanted, room / (rate + 1.0f));
  }

  // Control rate: the interval between grains, and a countdown that follows
  // Density at once instead of finishing a long wait first.
  void schedule() {
    const float seconds = grain_length(1.0f) / sample_rate();
    rate_ = kit::min(param(grain_cloud::kDensity), kMaxOverlap / seconds);
    interval_ = sample_rate() / rate_;
    if (until_next_ > interval_ * 1.5f) until_next_ = interval_ * 1.5f;
  }

  void spawn() {
    using namespace grain_cloud;
    const float sr = sample_rate();

    float semitones = param(kPitch);
    const float scatter = param(kScatter);
    if (scatter > 0.0f) {
      semitones += scatter * kScatterCents * 0.01f * rng_.bipolar();
      const float jump_chance = (scatter - 0.5f) * 1.4f;
      const float pick = rng_.uniform();
      const float interval = kJumps[rng_.next_u32() & 7u];
      if (pick < jump_chance) semitones += interval;
    }
    const float rate = kit::semitones_to_ratio(kit::clamp(semitones, -36.0f, 36.0f));
    const float length = grain_length(rate);

    // Where it reads: `delay` samples behind the head, between the nearest
    // stretch that is already written and the oldest one that will last.
    const float nearest = rate * length + kMargin;
    const float oldest = static_cast<float>(length_) - length - kMargin;
    const float min_spray = kMinSpraySeconds * sr;
    const float spray = param(kSpray);
    float place = param(kPosition) + spray * spray * rng_.bipolar();
    if (place < 0.0f) place = -place;
    if (place > 1.0f) place = 2.0f - place;
    const float delay = nearest + kit::clamp(place, 0.0f, 1.0f) * (oldest - nearest - min_spray) +
                        min_spray * rng_.uniform();
    double start = static_cast<double>(head_) - static_cast<double>(delay);
    const bool reversed = rng_.uniform() < param(kReverse);
    if (reversed) start += static_cast<double>(rate * length);
    // For the display only: where this grain reads and how fast.
    ++spawned_;
    spawn_place_ = delay / sr;
    spawn_rate_ = reversed ? -rate : rate;

    // Constant-power pan with most grains away from the centre, so Spread 1
    // is properly wide rather than a uniform smear.
    const float side = rng_.bipolar();
    const float depth = rng_.uniform();
    const float pan = param(kSpread) * (side < 0.0f ? -1.0f : 1.0f) * (1.0f - depth * depth * depth);
    spawn_pan_ = pan;  // for the display only

    const float shape = 1.0f - 0.96f * param(kTexture);
    const float mean_square = 1.0f - 0.625f * shape;  // of the window: 3/8 for a Hann bell
    const float overlap = rate_ * length / sr;
    const float gain = kit::min(1.0f, 1.0f / std::sqrt(overlap * mean_square));
    // √2 undoes the centre attenuation of the pan law: Spread 0 is unity.
    pool_.spawn(start, reversed ? -rate : rate, length, pan, gain * (kit::kSqrtHalf * 2.0f), shape);
  }

  Tape tape_;
  kit::GrainPool<kMaxGrains> pool_;
  kit::Rng rng_;
  kit::OnePole feedback_cut_[2];
  kit::DcBlocker feedback_dc_[2];
  kit::LinearRamp record_;
  kit::Smoother feedback_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;   // the mix the two gains below were worked out for
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  long long head_ = 0;       // samples recorded since init, plus kBufferSize
  long length_ = 0;          // samples of buffer in use: 8 s
  long quiet_written_ = 0;   // samples recorded since the last one above the floor
  float until_next_ = 0.0f;  // samples until the next grain starts
  float interval_ = 48000.0f;
  float rate_ = 1.0f;        // grains per second after the overlap ceiling
  // Kept for the display (meter()); nothing that sounds reads them.
  long spawned_ = 0;           // grains started since init
  float spawn_place_ = 0.0f;   // the newest grain: seconds behind the head,
  float spawn_rate_ = 1.0f;    // its speed, negative backwards,
  float spawn_pan_ = 0.0f;     // and its place from left to right
  float record_peak_ = 0.0f;   // level being recorded, with a 50 ms fall
  float record_peak_fall_ = 0.0f;
};

}  // namespace livemix
