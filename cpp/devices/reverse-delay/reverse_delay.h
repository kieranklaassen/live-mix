#pragma once

// Reverse Delay: what you just played, backwards, one chunk after another.
//
//   in ──(+)──► soft limit ──► ring ──► reader A ─► tone ─► low cut ─┬─► left side ─┐
//         ▲                        └──► reader B ─► tone ─► low cut ─┼─► right side ┴─► wet
//         └────────────── feedback ◄──────────────────────────────── ┘
//
// - Every Time a new reader starts at the newest sample and walks backwards,
//   so the chunk that was just recorded comes back reversed during the next
//   one. The previous reader fades out while the new one fades in (equal
//   power, because two chunks are unrelated audio); Smooth sets how much of
//   the chunk that crossfade takes, from a 4 ms splice to the whole chunk.
// - Pitch reads at double or half speed. The chunk still lasts Time; Octave
//   up reaches back over twice as much audio, Octave down over half.
// - Readers alternate between two buses. Spread pans the buses apart, so
//   chunks alternate sides; the feedback is taken before the pan and does
//   not change with it. Every pass through the loop is reversed again, so
//   the second repeat plays forwards.
// - Time, Smooth and Pitch are read when a chunk starts, so moving them
//   cannot click. Shortening Time cuts the wait for the next chunk short.
// - On waking from sleep the ring is forgotten and a chunk starts at once:
//   the chunk grid lines up with the first note after a silence.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "ring.h"

namespace livemix {

class ReverseDelay : public kit::DeviceBase<reverse_delay::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace reverse_delay;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    feedback_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    asleep_ = true;
    quiet_ = 0;
    restart();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // the level that was just recorded (the highest sample of the last 40 ms),
  // for each of the two readers how far behind the newest sample it is, in
  // seconds, and the gain of its fade, and how long the device has run, in
  // seconds, going round at 64: it moves on with every block the device
  // works, so a display can tell a device that runs from one that stands.
  // Asleep, when the ring is forgotten and nothing reads it, that is -1 and
  // the rest 0. All of it is worked out here, when a display asks: nothing is
  // kept for it while the sound is made.
  float meter(int index) const {
    if (asleep_) return index == 5 ? -1.0f : 0.0f;
    switch (index) {
      case 0:
        return ring_.peak(static_cast<int>(kLevelSeconds * sample_rate()));
      case 1:
      case 3: {
        const Reader& reader = readers_[index / 2];
        return reader.active ? static_cast<float>((ring_.written() - reader.position) / sample_rate())
                             : 0.0f;
      }
      case 2:
      case 4: {
        const Reader& reader = readers_[index / 2 - 1];
        if (!reader.active) return 0.0f;
        float gain = reader.in_phase < 1.0f ? kit::SineTable::lookup(0.25f * reader.in_phase) : 1.0f;
        if (reader.releasing) gain *= kit::SineTable::cos_lookup(0.25f * reader.out_phase);
        return gain;
      }
      case 5: {
        const double lap = static_cast<double>(kClockSeconds) * sample_rate();
        const double frames = ring_.written();
        return static_cast<float>((frames - lap * std::floor(frames / lap)) / sample_rate());
      }
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace reverse_delay;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      ring_.forget();
      restart();
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (clock_.tick()) control();
      if (until_next_ <= 0) launch();
      --until_next_;

      // Bus gains: both 1 with no spread, √2 and 0 when fully apart.
      const float spread = spread_.next();
      if (spread != spread_seen_) {
        spread_seen_ = spread;
        const float angle = 0.125f * (1.0f - spread);
        near_gain_ = kSqrtTwo * kit::SineTable::cos_lookup(angle);
        far_gain_ = kSqrtTwo * kit::SineTable::lookup(angle);
      }

      float back[2] = {0.0f, 0.0f};
      float wet[2] = {0.0f, 0.0f};
      for (int side = 0; side < 2; ++side) {
        Reader& reader = readers_[side];
        float left = 0.0f, right = 0.0f;
        if (reader.active) {
          float gain = 1.0f;
          if (reader.in_phase < 1.0f) {
            gain = kit::SineTable::lookup(0.25f * reader.in_phase);
            reader.in_phase = kit::min(1.0f, reader.in_phase + reader.in_step);
          }
          if (reader.releasing) {
            gain *= kit::SineTable::cos_lookup(0.25f * reader.out_phase);
            reader.out_phase += reader.out_step;
            if (reader.out_phase >= 1.0f) reader.active = false;
          }
          ring_.read(reader.position, &left, &right);
          reader.position -= reader.rate;
          left *= gain;
          right *= gain;
        }
        // The bus filters run on, so a finished chunk's filter tail rings out.
        left = low_cut_[side][0].highpass(tone_[side][0].lowpass(left));
        right = low_cut_[side][1].highpass(tone_[side][1].lowpass(right));
        back[0] += left;
        back[1] += right;
        // Narrow the bus towards mono as it is panned, so a stereo source
        // does not lose a channel on the far side.
        const float mid = 0.5f * (left + right);
        const float bus_left = kit::lerp(left, mid, spread);
        const float bus_right = kit::lerp(right, mid, spread);
        wet[0] += bus_left * (side == 0 ? near_gain_ : far_gain_);
        wet[1] += bus_right * (side == 0 ? far_gain_ : near_gain_);
      }

      // Recorded through a limiter that is exactly linear below -6 dBFS: it
      // bounds the loop when two chunks of a steady tone add in phase.
      const float feedback = feedback_.next();
      ring_.write(flush_denormal(kit::soft_clip(in[0] + feedback * back[0])),
                  flush_denormal(kit::soft_clip(in[1] + feedback * back[1])));

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
  // The farthest a reader gets behind the write point is (1 + rate) times
  // its life, and it lives for its own chunk plus the next one's fade:
  // 3 x 2 x 4 s at 96 kHz for Octave up with Smooth at 1.
  static constexpr int kMaxChunk = 384000;
  static constexpr int kRingFrames = 6 * kMaxChunk + 64;
  static constexpr float kMinFadeSeconds = 0.004f;
  static constexpr float kSqrtTwo = 1.41421356f;
  static constexpr float kRates[3] = {1.0f, 2.0f, 0.5f};
  // For a display (see meter): how much of the newest sound its level is
  // taken from, a little more than the time between two readings, and where
  // its clock goes round.
  static constexpr float kLevelSeconds = 0.04f;
  static constexpr float kClockSeconds = 64.0f;

  struct Reader {
    bool active = false;
    bool releasing = false;
    double position = 0.0;
    float rate = 1.0f;
    float in_phase = 0.0f, in_step = 0.0f;
    float out_phase = 0.0f, out_step = 0.0f;
  };

  // Empty buses and a chunk due on the next sample (init and wake).
  void restart() {
    for (int side = 0; side < 2; ++side) {
      readers_[side] = Reader();
      for (int c = 0; c < 2; ++c) {
        tone_[side][c].reset();
        low_cut_[side][c].reset();
      }
    }
    clock_.reset(16);
    spread_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    low_cut_seen_ = -1.0f;
    newest_ = 1;
    until_next_ = 0;
    longest_chunk_ = 0;
    fastest_ = 0.0f;
    hold_ = 1;
  }

  int chunk_samples() const {
    const int samples = static_cast<int>(param(reverse_delay::kTime) * 0.001f * sample_rate());
    return kit::clamp_int(samples, 64, kMaxChunk);
  }

  // Start the next chunk on the other bus and let the current one go.
  void launch() {
    using namespace reverse_delay;
    const int chunk = chunk_samples();
    const float fade = kit::clamp(param(kSmooth) * static_cast<float>(chunk),
                                  kit::min(kMinFadeSeconds * sample_rate(), static_cast<float>(chunk)),
                                  static_cast<float>(chunk));
    Reader& old = readers_[newest_];
    if (old.active) {
      old.releasing = true;
      old.out_phase = 0.0f;
      old.out_step = 1.0f / fade;
    }
    newest_ ^= 1;
    Reader& reader = readers_[newest_];
    reader = Reader();
    reader.active = true;
    reader.position = ring_.written() - 3.0;
    reader.rate = kRates[kit::clamp_int(static_cast<int>(param(kPitch) + 0.5f), 0, 2)];
    reader.in_step = 1.0f / fade;
    until_next_ = chunk;

    // Sound written now can come back as late as (1 + rate) x (this chunk +
    // the next one's fade): the gate must wait at least that long.
    if (chunk > longest_chunk_) longest_chunk_ = chunk;
    if (reader.rate > fastest_) fastest_ = reader.rate;
    hold_ = static_cast<long>((1.0f + fastest_) * 2.0f * static_cast<float>(longest_chunk_) +
                              0.1f * sample_rate());
  }

  void control() {
    using namespace reverse_delay;
    const float sr = sample_rate();
    if (param(kTone) != tone_seen_ || param(kLowCut) != low_cut_seen_) {
      tone_seen_ = param(kTone);
      low_cut_seen_ = param(kLowCut);
      for (int side = 0; side < 2; ++side) {
        for (int c = 0; c < 2; ++c) {
          tone_[side][c].set(tone_seen_, 0.6f, sr);
          low_cut_[side][c].set_cutoff(low_cut_seen_, sr);
        }
      }
    }
    // Time turned down: do not sit out the rest of a long chunk. The fade
    // still running on the other bus is hurried so its reader is free.
    const int chunk = chunk_samples();
    if (until_next_ > chunk) {
      until_next_ = chunk;
      Reader& fading = readers_[newest_ ^ 1];
      if (fading.active && fading.releasing) {
        fading.out_step =
            kit::max(fading.out_step, 1.001f * (1.0f - fading.out_phase) / static_cast<float>(chunk));
      }
    }
  }

  void apply(int id) {
    using namespace reverse_delay;
    const float value = param(id);
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kFeedback:
        feedback_.set(value, glide);
        break;
      case kSpread:
        spread_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // Time, Pitch and Smooth are read per chunk; the filters on the control clock
    }
  }

  reverse_delay::StereoRing<kRingFrames> ring_;
  Reader readers_[2];
  kit::Svf tone_[2][2];
  kit::OnePole low_cut_[2][2];
  kit::Smoother feedback_, spread_, mix_;
  kit::ControlClock clock_;
  // Gains and filter settings, worked out again only when a control moves.
  float spread_seen_ = -1.0f, near_gain_ = 1.0f, far_gain_ = 1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float tone_seen_ = -1.0f, low_cut_seen_ = -1.0f;
  int newest_ = 1;
  int until_next_ = 0;
  int longest_chunk_ = 0;
  float fastest_ = 0.0f;
  long hold_ = 1;
  long quiet_ = 0;
  bool asleep_ = true;
};

}  // namespace livemix
