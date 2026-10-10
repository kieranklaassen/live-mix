#pragma once

// Stretch: an extreme time stretch, live. What is played is kept in a
// memory, and a reader goes through that memory far slower than it was
// written, resynthesising the moment it stands on from its spectrum.
//
//   in ─┬──────────────────────────────────────────────────────► dry ─┐
//       │                                                             ├─► out
//       └─► memory ─► reader (1/Stretch) ─► Hann ─► FFT ─► per bin ─► │
//                        ▲                                   │        │
//                 runs up to the present          kit::Stft: IFFT, Hann,
//                 when Memory is used up          overlap-add ─► tone ─► limit ─► wet
//
// - The reader. It stands on one moment of the memory (the middle of the
//   window it reads) and moves on by Hop / Stretch samples for every Hop
//   that is played, so it falls behind the write head by (1 - 1/Stretch)
//   seconds a second. When it is Memory behind it runs up to the present
//   again in Catch Up seconds, reading at high speed through everything it
//   had not reached (a short Catch Up is a jump, which the overlap of the
//   frames crossfades). It never stands closer to the write head than half
//   a window, and it is never further back than Memory.
// - Silence. When nothing but exact silence lies between the reader and the
//   write head the reader has nothing left to say: it waits, and the device
//   sleeps. The next sound puts it on that sound's first sample, and it
//   reads as soon as the half of its window past that sample is written:
//   the cloud comes in half a window after the first note with the attack
//   under the middle of the window, and swells as the window moves on.
// - The frames. kit::Stft does the resynthesis, the overlap-add and the
//   frame clock; it is fed silence, and the callback puts the reader's
//   spectrum in the place of the empty one. The analysis is the device's own
//   (kit::Fft::forward_real on the memory under the same Hann window),
//   because it reads where the reader stands and not where the input is.
//   Four frame sizes stand ready (Window): 2048, 4096, 8192 and 16384
//   samples, each at a quarter hop. A change of Window lets the old size
//   play its last frames out while the new one's come in.
// - Per bin. A phase vocoder with the peaks locked: each peak of the
//   spectrum is a partial, its true frequency is measured from how far its
//   phase turned between two readings, its phase goes on turning by that
//   frequency for a whole hop, and the bins around it keep their phase
//   against it, so a partial stays a partial and a sine comes out a sine at
//   its own pitch whatever the stretch. On top of that Diffuse turns every
//   bin by a fresh random angle of up to ±Diffuse × 180° each frame (at 1
//   the phases are all random, which is the classic diffuse stretch), and
//   the magnitudes are raised by what random phase costs. Every partial
//   also wanders by a small random step a frame (kWalk), so a held note in
//   the cloud never stays locked against the same note in the dry signal.
// - Freeze stops the reader and the memory: nothing is recorded, the
//   spectrum of the moment is held and each partial goes on turning at its
//   own frequency (never the same frame replayed, which would buzz at the
//   frame rate). Off, the phrase goes on from the same place.
// - Width gives the right channel its own random angles and its own wander;
//   at 0 both channels use the same ones and a mono input stays mono.
// - Tone is a shelf at 1 kHz on the wet signal that only ever takes away:
//   left of centre the highs go down by up to 12 dB, right of centre the
//   lows. The wet signal is then limited: linear up to ±1, never past ±2.
//
// Latency: none. The dry path is the input itself (Mix 0 is the input,
// sample for sample); the wet path is late by design, at least two windows.
//
// Storage: the memory is 20 s at 96 kHz for each channel plus the longest
// window (2 × 1,944,576 floats, 15.6 MB); the four pairs of kit::Stft are
// 2.6 MB, the transforms' tables 0.25 MB and what is kept per bin 0.4 MB.
// At 96 kHz a window is half as long in time and its bins twice as wide.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Stretch : public kit::DeviceBase<stretch::kNumParams> {
 public:
  static constexpr int kSizes = 4;
  static constexpr int kMaxFrame = 16384;
  static constexpr int kMaxBins = kMaxFrame / 2 + 1;
  // The frame of each Window choice; the hop is a quarter of it.
  static constexpr int kFrames[kSizes] = {2048, 4096, 8192, 16384};
  // The longest Memory at 96 kHz, the longest window and room for the half
  // hop between the two channels' readings.
  static constexpr int kRing = 20 * 96000 + kMaxFrame + 8192;
  // How far each partial's phase wanders in a frame of the Long window at
  // 48 kHz (a hop of 43 ms), in half turns: ±18°. The note in the cloud and
  // the same note in the dry signal are out of step again within a second.
  static constexpr float kWalk = 0.1f;
  // Bin magnitudes under this are dropped: a full-scale sine reads a quarter
  // of the frame, so this is under -174 dBFS a bin at every size.
  static constexpr float kFloor = 1.0e-6f;
  // For meter(): the stretch of memory the level is read over, and where the
  // recording clock goes round.
  static constexpr float kLevelSeconds = 0.04f;
  static constexpr float kClockSeconds = 64.0f;

  void init(float sample_rate) {
    using namespace stretch;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    fft0_.init();
    fft1_.init();
    fft2_.init();
    fft3_.init();
    for (int c = 0; c < 2; ++c) {
      const int stagger_of_right = c;  // 0, or half a hop
      stft0_[c].init(stagger_of_right * kit::Stft<2048>::kMaxStagger);
      stft1_[c].init(stagger_of_right * kit::Stft<4096>::kMaxStagger);
      stft2_[c].init(stagger_of_right * kit::Stft<8192>::kMaxStagger);
      stft3_[c].init(stagger_of_right * kit::Stft<16384>::kMaxStagger);
      for (int i = 0; i < kRing; ++i) memory_[c][i] = 0.0f;
      for (int k = 0; k < kMaxBins; ++k) {
        magnitude_[c][k] = 0.0f;
        phase_[c][k] = 0.0f;
        last_[c][k] = 0.0f;
        turn_[c][k] = 0.0f;
        lead_[c][k] = static_cast<uint16_t>(k);
      }
      ready_[c] = false;
      tracked_[c] = false;
      sound_[c] = false;
      fetched_[c] = false;
      shaped_[c] = false;
      for (int k = 0; k < kMaxBins; ++k) {
        out_re_[c][k] = 0.0f;
        out_im_[c][k] = 0.0f;
      }
      shelf_[c].reset();
      shelf_[c].set_identity();
    }
    const double step = 2.0 * 3.14159265358979323846 / kMaxFrame;
    for (int n = 0; n < kMaxFrame; ++n) window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(step * n));
    for (int i = 0; i < kMaxFrame; ++i) spectrum_[i] = 0.0f;
    for (int k = 0; k < kMaxBins; ++k) angle_[k] = 0.0f;
    for (int s = 0; s < kSizes; ++s) drain_[s] = 0;

    clock_ = 0;
    write_ = 0;
    written_ = 0;
    swept_ = kRing;
    quiet_ = kQuietLimit;
    reader_ = 0.0;
    whole_ = 0;
    last_whole_ = 0;
    empty_ = true;
    priming_ = false;
    catching_ = false;
    broken_ = true;
    glide_ = 0.0;
    plan_ = kSilent;
    step_ = 1;
    ratio_ = 1.0f;
    scatter_ = 0.0f;
    gain_ = 1.0f;
    walk_ = 0.0f;
    frame_number_ = 0;
    speed_seen_ = 1.0f;
    behind_seen_ = 0.0f;
    asleep_ = true;

    size_ = size_of(param(kWindow));
    wanted_ = size_;
    frozen_ = param(kFreeze) >= 0.5f;
    mix_.set_time(kSmoothingSeconds, sr);
    tone_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    tone_.snap(param(kTone));
    tone_seen_ = 0.0f;
    mix_seen_ = -1.0f;
    dry_gain_ = 1.0f;
    wet_gain_ = 0.0f;
    tone_clock_.reset(16);
    // Once the reader has nothing left to say, the frames in flight still
    // play out: the longest frame and its latency.
    idle_.reset(sr, static_cast<float>(2 * kMaxFrame + kMaxFrame / 2) / sr);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, the highest level recorded in the last 40 ms (0 asleep);
  // 1, how many seconds behind the write head the reader stood at the last
  //    frame (0 while it waits for sound);
  // 2, how fast it moves along the recording, in seconds of it a second:
  //    1/Stretch while it reads, above 1 while it runs up to the present,
  //    1 while it waits at the write head for sound, and 0 while it stands
  //    (frozen, or on a first sample whose window is still filling);
  // 3, the time recorded so far, in seconds round kClockSeconds: it stands
  //    while Freeze stops the recording, and it is -1 asleep.
  // The level is worked out here, when a display asks: nothing is kept for
  // it while the sound is made.
  float meter(int index) const {
    switch (index) {
      case 0: {
        if (asleep_) return 0.0f;
        const int count = static_cast<int>(kLevelSeconds * sample_rate());
        float peak = 0.0f;
        int at = write_;
        for (int i = 0; i < count; ++i) {
          if (--at < 0) at = kRing - 1;
          const float left = std::fabs(memory_[0][at]);
          const float right = std::fabs(memory_[1][at]);
          if (left > peak) peak = left;
          if (right > peak) peak = right;
        }
        return peak;
      }
      case 1:
        return behind_seen_ / sample_rate();
      case 2:
        return speed_seen_;
      case 3: {
        if (asleep_) return -1.0f;
        const double lap = static_cast<double>(kClockSeconds) * sample_rate();
        const double frames = static_cast<double>(written_);
        return static_cast<float>((frames - lap * std::floor(frames / lap)) / sample_rate());
      }
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace stretch;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive())) {
      silence_output(frames);
      sleep(frames);
      return;
    }
    if (asleep_) {
      // Knobs moved during the sleep are where they are, they do not glide.
      asleep_ = false;
      mix_.snap(mix_.target);
      tone_.snap(tone_.target);
      tone_seen_ = tone_.value - 1.0f;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      // A change of Window falls on the new size's own reading clock.
      if (wanted_ != size_) {
        const uint32_t hop = static_cast<uint32_t>(kFrames[wanted_] >> 2);
        if ((clock_ & (hop - 1)) == 5 * (hop >> 3)) change_size(false);
      }
      // A frame's work is spread over the hop before it is due, an eighth
      // of a hop apart, so that no block holds more than one part of it at
      // the longer windows: the reader moves and the left channel's window
      // is transformed, its partials are tracked, its bins are turned, and
      // kit::Stft resynthesises it; the right channel follows half a hop on.
      {
        const uint32_t hop = static_cast<uint32_t>(kFrames[size_] >> 2);
        if ((clock_ & ((hop >> 3) - 1)) == 0) {
          switch ((clock_ & (hop - 1)) / (hop >> 3)) {
            case 5:
              tick();
              fetch(0);
              break;
            case 6:
              track(0);
              break;
            case 7:
              shape(0);
              break;
            case 1:
              fetch(1);
              break;
            case 2:
              track(1);
              break;
            case 3:
              shape(1);
              break;
            default:
              break;  // 0 and 4: the frames themselves, in kit::Stft
          }
        }
      }

      float wet[2];
      for (int c = 0; c < 2; ++c) {
        wet[c] = run(stft0_, 0, c) + run(stft1_, 1, c) + run(stft2_, 2, c) + run(stft3_, 3, c);
      }
      for (int s = 0; s < kSizes; ++s) {
        if (drain_[s] > 0) --drain_[s];
      }
      if (!frozen_) record(in[0], in[1]);
      ++clock_;

      if (tone_clock_.tick()) {
        const float tone = tone_.value;
        if (tone != tone_seen_) {
          tone_seen_ = tone;
          for (int c = 0; c < 2; ++c) {
            if (tone == 0.0f) {
              shelf_[c].set_identity();
            } else if (tone < 0.0f) {
              shelf_[c].set_high_shelf(kShelfHz, kShelfDb * tone, sample_rate());
            } else {
              shelf_[c].set_low_shelf(kShelfHz, -kShelfDb * tone, sample_rate());
            }
          }
        }
      }
      tone_.next();
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        if (mix <= 0.0f) wet_gain_ = 0.0f;
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        // Linear up to ±1, never past ±2.
        const float shaped = 2.0f * kit::soft_clip(0.5f * shelf_[c].process(wet[c]));
        out[c] = in[c] * dry_gain_ + shaped * wet_gain_;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Plan { kSilent, kHeld, kFresh, kCoherent };

  static constexpr float kShelfHz = 1000.0f;
  static constexpr float kShelfDb = 12.0f;
  static constexpr uint32_t kQuietLimit = 1u << 30;

  static int size_of(float value) { return kit::clamp_int(static_cast<int>(value + 0.5f), 0, kSizes - 1); }

  // Whether the device still has something to say without new input.
  bool alive() const {
    for (int s = 0; s < kSizes; ++s) {
      if (drain_[s] > 0) return true;
    }
    if (frozen_) return sound_[0] || sound_[1] || !ready_[0] || !ready_[1];
    return !empty_;
  }

  // The clock goes on through a sleep, and so does the recording (of
  // silence), exactly as it would have awake.
  void sleep(int frames) {
    asleep_ = true;
    for (int c = 0; c < 2; ++c) {
      stft0_[c].skip(frames);
      stft1_[c].skip(frames);
      stft2_[c].skip(frames);
      stft3_[c].skip(frames);
    }
    if (wanted_ != size_) {
      const uint32_t hop = static_cast<uint32_t>(kFrames[wanted_] >> 2);
      const uint32_t until = (5 * (hop >> 3) - (clock_ & (hop - 1))) & (hop - 1);
      if (until < static_cast<uint32_t>(frames)) change_size(true);
    }
    clock_ += static_cast<uint32_t>(frames);
    if (frozen_) return;
    for (int i = 0; i < frames && swept_ < kRing; ++i, ++swept_) {
      int at = write_ + i;
      if (at >= kRing) at -= kRing;
      memory_[0][at] = 0.0f;
      memory_[1][at] = 0.0f;
    }
    write_ = (write_ + frames) % kRing;
    written_ += frames;
    quiet_ = quiet_ + static_cast<uint32_t>(frames) < kQuietLimit ? quiet_ + static_cast<uint32_t>(frames) : kQuietLimit;
  }

  // One sample into the memory. A sample that is not a number or is out of
  // all range goes in as silence, as kit::Stft takes its own.
  void record(float left, float right) {
    const float l = (left > -64.0f && left < 64.0f) ? flush_denormal(left) : 0.0f;
    const float r = (right > -64.0f && right < 64.0f) ? flush_denormal(right) : 0.0f;
    memory_[0][write_] = l;
    memory_[1][write_] = r;
    if (l != 0.0f || r != 0.0f) {
      quiet_ = 0;
      if (empty_) {
        // The first sound after a silence: the reader stands on it, and
        // reads once the half of its window past it is written.
        empty_ = false;
        priming_ = true;
        catching_ = false;
        broken_ = true;
        reader_ = static_cast<double>(written_);
      }
    } else if (quiet_ < kQuietLimit) {
      ++quiet_;
    }
    if (++write_ >= kRing) write_ = 0;
    ++written_;
    swept_ = 0;
  }

  // The frames of size `s` for channel `c`: the size in use is filled from
  // the reader, one that was just left plays its last frames out, and the
  // rest only keep their clocks.
  template <typename S>
  float run(S* stft, int s, int c) {
    if (s == size_) {
      return stft[c].process(0.0f, [this, c](float* re, float* im) { hand_over(c, re, im); });
    }
    if (drain_[s] > 0) return stft[c].process(0.0f, [](float*, float*) {});
    stft[c].skip(1);
    return 0.0f;
  }

  void change_size(bool asleep) {
    // What the old size has in flight: a frame and its latency.
    drain_[size_] = asleep ? 0 : 2 * kFrames[size_] + (kFrames[size_] >> 3) + 1;
    size_ = wanted_;
    drain_[size_] = 0;
    for (int c = 0; c < 2; ++c) {
      ready_[c] = false;
      tracked_[c] = false;
      fetched_[c] = false;
      shaped_[c] = false;
    }
    broken_ = true;
    plan_ = kSilent;
  }

  // What random phase costs in level, undone. A bin turned by a fresh
  // angle each frame keeps the share sinc(scatter) of itself in step with
  // the frame; the rest is spread under the synthesis window alone and
  // comes back 6 dB down at a quarter hop (measured in spectral-blur).
  static float scatter_gain(float scatter) {
    if (scatter < 1.0e-4f) return 1.0f;
    const float x = kit::kPi * scatter;
    const float kept = std::sin(x) / x;
    return 1.0f / std::sqrt(kept * kept + 0.25f * (1.0f - kept * kept));
  }

  // Once a hop, three eighths of a hop before the left frame: where the
  // reader stands for this frame of both channels, and how it is made.
  void tick() {
    using namespace stretch;
    const int frame = kFrames[size_];
    const int hop = frame >> 2;
    const double half = static_cast<double>(frame >> 1);
    const double head = static_cast<double>(written_);
    int log_hop = 0;
    while ((1 << log_hop) < hop) ++log_hop;
    // The number kit::Stft gives the frame that is due in three eighths of a hop.
    frame_number_ = (clock_ >> log_hop) + 1;
    scatter_ = param(kDiffuse);
    gain_ = scatter_gain(scatter_);
    // The wander is a random walk: by the square root of the hop's length
    // it is as fast in seconds at every Window and sample rate.
    walk_ = kWalk * kit::kPi * std::sqrt(static_cast<float>(hop) * 48000.0f / (2048.0f * sample_rate()));

    if (frozen_) {
      // Nothing is recorded and the reader stays; while a first window is
      // still filling it holds what there is of it.
      const double at = reader_ < head - half ? reader_ : head - half;
      whole_ = static_cast<int64_t>(std::floor(at));
      last_whole_ = whole_;
      plan_ = kHeld;
      speed_seen_ = 0.0f;
      behind_seen_ = static_cast<float>(head - static_cast<double>(whole_));
      return;
    }
    // Waiting for sound, the reader rides with the write head.
    plan_ = kSilent;
    speed_seen_ = 1.0f;
    behind_seen_ = 0.0f;
    if (empty_) return;
    double lag = head - reader_;
    if (priming_) {
      if (lag < half) {
        // It stands on the first sample while its window fills.
        speed_seen_ = 0.0f;
        behind_seen_ = static_cast<float>(lag);
        return;
      }
      priming_ = false;
    }
    if (lag < half) {
      // The window grew: back to where a whole one is written.
      lag = half;
      broken_ = true;
    }
    if (static_cast<double>(quiet_) > lag + half) {
      // Nothing but silence from the window's far edge to the write head.
      empty_ = true;
      catching_ = false;
      return;
    }
    double memory = static_cast<double>(param(kMemory)) * sample_rate();
    const double longest = static_cast<double>(kRing - kMaxFrame - 8192);
    if (memory > longest) memory = longest;
    if (memory < half + hop) memory = half + hop;
    const double rate = 1.0 / static_cast<double>(param(kStretch));
    if (lag > memory + hop) {
      // Memory was turned down past the reader.
      lag = memory;
      broken_ = true;
    } else if (broken_) {
      // The first frame after a break reads where the reader was put.
    } else if (catching_) {
      lag -= hop + glide_;
      if (lag <= half) {
        lag = half;
        catching_ = false;
      }
    } else if (lag - hop * rate > memory) {
      // Memory is used up: run up to the present in Catch Up seconds.
      catching_ = true;
      lag = memory;
      double hops = static_cast<double>(param(kCatchUp)) * sample_rate() / hop;
      if (hops < 1.0) hops = 1.0;
      glide_ = (lag - half) / hops;
      lag -= glide_;
      if (lag <= half) {
        lag = half;
        catching_ = false;
      }
    } else {
      lag -= hop * rate;
    }
    if (lag > memory) lag = memory;
    reader_ = head - lag;
    whole_ = static_cast<int64_t>(std::floor(reader_));
    const int64_t moved = whole_ - last_whole_;
    const bool fast = catching_ || moved > hop;
    if (!broken_ && !fast && moved >= 1) {
      plan_ = kCoherent;
      step_ = static_cast<int>(moved);
      ratio_ = static_cast<float>(hop) / static_cast<float>(moved);
    } else {
      plan_ = kFresh;
    }
    if (fast) {
      // Run through at speed, a frame has nothing to do with the last:
      // its phases are all random.
      scatter_ = 1.0f;
      gain_ = scatter_gain(1.0f);
    }
    // How far the reader moved through the memory for this hop of playing.
    speed_seen_ = broken_ ? static_cast<float>(rate) : static_cast<float>(moved) / static_cast<float>(hop);
    behind_seen_ = static_cast<float>(lag);
    last_whole_ = whole_;
    broken_ = false;
  }

  // The first part of channel c's frame: the window the reader stands on,
  // transformed. (A frozen frame has none; one that has to be measured
  // first takes its two windows in track().)
  void fetch(int c) {
    fetched_[c] = false;
    if (plan_ != kFresh && plan_ != kCoherent) return;
    spectrum_of(c, whole_);
    fetched_[c] = true;
  }

  // The second part: magnitudes and phases, each partial carried on from
  // the frame before.
  void track(int c) {
    const int frame = kFrames[size_];
    const bool fetched = fetched_[c];
    fetched_[c] = false;
    switch (plan_) {
      case kHeld:
        if (ready_[c] && tracked_[c]) {
          hold(c);
        } else {
          // Nothing measured to hold yet: two readings a sixteenth of a
          // frame apart give every partial its frequency.
          spectrum_of(c, whole_ - (frame >> 4));
          measure(c, false, 1, 1.0f);
          spectrum_of(c, whole_);
          measure(c, true, frame >> 4, 4.0f);
        }
        return;
      case kFresh:
        if (fetched) {
          measure(c, false, 1, 1.0f);
          return;
        }
        break;
      case kCoherent:
        if (fetched) {
          measure(c, ready_[c], step_, ratio_);
          return;
        }
        break;
      case kSilent:
        break;
    }
    ready_[c] = false;
    tracked_[c] = false;
    sound_[c] = false;
  }

  template <int N>
  void transform(const kit::Fft<N>& fft, int c, int start) {
    const float* memory = memory_[c];
    const float* window = window_;
    const int stride = kMaxFrame / N;
    // Bins 0..N/2 in spectrum_, the imaginary parts packed from its top down.
    fft.forward_real(
        [memory, window, start, stride](int n) {
          int at = start + n;
          if (at >= kRing) at -= kRing;
          return memory[at] * window[n * stride];
        },
        spectrum_);
  }

  // The two random sources of a frame, the same for both channels: `shared`
  // for both, `own` for what Width gives the right channel alone.
  void seed(kit::Rng* shared, kit::Rng* own, uint32_t salt) const {
    shared->seed((0x9E3779B9u + salt) ^ (frame_number_ * 2654435761u));
    own->seed((0x7F4A7C15u + salt) ^ (frame_number_ * 2246822519u));
    for (int warm = 0; warm < 4; ++warm) {
      shared->next_u32();
      own->next_u32();
    }
  }

  // One partial's wander for this frame, in radians.
  float wander(int c, kit::Rng* shared, kit::Rng* own) const {
    float angle = shared->bipolar();
    const float other = own->bipolar();
    if (c == 1) angle += param(stretch::kWidth) * (other - angle);
    return angle * walk_;
  }

  // The spectrum of the window whose middle is sample `whole` of all that
  // was recorded, into spectrum_.
  void spectrum_of(int c, int64_t whole) {
    const int frame = kFrames[size_];
    const int half = frame >> 1;
    int64_t back = written_ - (whole - half);
    if (back < frame) back = frame;
    if (back > kRing - 1) back = kRing - 1;
    int start = write_ - static_cast<int>(back);
    if (start < 0) start += kRing;
    switch (size_) {
      case 0:
        transform(fft0_, c, start);
        break;
      case 1:
        transform(fft1_, c, start);
        break;
      case 2:
        transform(fft2_, c, start);
        break;
      default:
        transform(fft3_, c, start);
        break;
    }
  }

  // The magnitudes of the spectrum in spectrum_, and its phases carried on
  // from the last reading. `coherent` says the last reading was `step`
  // samples before this one (ratio = hop / step) and can be measured
  // against; otherwise the phases are taken as they are read.
  void measure(int c, bool coherent, int step, float ratio) {
    const int frame = kFrames[size_];
    const int half = frame >> 1;
    float* magnitude = magnitude_[c];
    float* phase = phase_[c];
    float* last = last_[c];
    float* turn = turn_[c];
    uint16_t* lead = lead_[c];
    float* angle = angle_;
    bool sound = false;
    for (int k = 0; k <= half; ++k) {
      const float re = spectrum_[k];
      const float im = (k == 0 || k == half) ? 0.0f : spectrum_[frame - k];
      float size;
      kit::to_polar(re, im, &size, &angle[k]);
      if (size < kFloor) size = 0.0f;
      magnitude[k] = size;
      sound = sound || size > 0.0f;
    }
    sound_[c] = sound;

    // The peaks: bins above their two neighbours on either side.
    int peaks = 0;
    if (coherent) {
      for (int k = 1; k < half; ++k) {
        const float m = magnitude[k];
        if (m > 0.0f && m > magnitude[k - 1] && m >= magnitude[k + 1] && (k < 2 || m > magnitude[k - 2]) &&
            (k + 2 > half || m >= magnitude[k + 2])) {
          peaks_[peaks++] = static_cast<uint16_t>(k);
        }
      }
    }
    if (peaks == 0) {
      for (int k = 0; k <= half; ++k) {
        phase[k] = angle[k];
        turn[k] = kit::kHalfPi * static_cast<float>(k & 3);
        lead[k] = static_cast<uint16_t>(k);
        last[k] = angle[k];
      }
      ready_[c] = true;
      tracked_[c] = false;
      return;
    }
    kit::Rng shared, own;
    seed(&shared, &own, 0x1000u);
    const float turns_to_radians = kit::kTwoPi / static_cast<float>(frame);
    int from = 0;
    for (int i = 0; i < peaks; ++i) {
      const int p = peaks_[i];
      const int to = i + 1 < peaks ? (p + peaks_[i + 1] + 1) >> 1 : half + 1;
      // How far the phase turned beyond the bin's own share over `step`
      // samples is the partial's distance from the bin's centre.
      const float own_share = turns_to_radians * static_cast<float>((p * step) & (frame - 1));
      const float deviation = kit::princarg(angle[p] - last[p] - own_share);
      // A hop of the partial's own frequency: the bin's quarter turns and
      // the deviation carried over a hop.
      const float advance = kit::kHalfPi * static_cast<float>(p & 3) + deviation * ratio;
      const float base = kit::princarg(phase[p] + advance + wander(c, &shared, &own));
      const float anchor = angle[p];
      for (int k = from; k < to; ++k) {
        phase[k] = base + angle[k] - anchor;
        turn[k] = advance;
        lead[k] = static_cast<uint16_t>(p);
      }
      from = to;
    }
    for (int k = 0; k <= half; ++k) last[k] = angle[k];
    ready_[c] = true;
    tracked_[c] = true;
  }

  // A frozen frame: the magnitudes stay, and every partial goes on turning
  // at its own frequency (and wandering), its bins together.
  void hold(int c) {
    const int half = kFrames[size_] >> 1;
    float* phase = phase_[c];
    const float* turn = turn_[c];
    const uint16_t* lead = lead_[c];
    kit::Rng shared, own;
    seed(&shared, &own, 0x1000u);
    int k = 0;
    while (k <= half) {
      const uint16_t partial = lead[k];
      const float step = turn[k] + wander(c, &shared, &own);
      for (; k <= half && lead[k] == partial; ++k) phase[k] = kit::princarg(phase[k] + step);
    }
  }

  // The third part: every bin as it will sound, turned by its random angle.
  void shape(int c) {
    shaped_[c] = ready_[c] && sound_[c];
    if (!shaped_[c]) return;
    const int half = kFrames[size_] >> 1;
    const float* magnitude = magnitude_[c];
    const float* phase = phase_[c];
    float* re = out_re_[c];
    float* im = out_im_[c];
    const float scatter = scatter_;
    if (!(scatter > 0.0f)) {
      for (int k = 0; k <= half; ++k) kit::from_polar(magnitude[k], phase[k], &re[k], &im[k]);
      return;
    }
    // Both channels draw the same angles from `shared`; Width moves the
    // right channel towards its own.
    kit::Rng shared, own;
    seed(&shared, &own, 0x2000u);
    const float apart = c == 0 ? 0.0f : param(stretch::kWidth);
    const float reach = scatter * kit::kPi;
    const float gain = gain_;
    for (int k = 0; k <= half; ++k) {
      float angle = shared.bipolar();
      if (apart > 0.0f) angle += apart * (own.bipolar() - angle);
      kit::from_polar(magnitude[k] * gain, phase[k] + angle * reach, &re[k], &im[k]);
    }
  }

  // kit::Stft's callback for channel c: the frame it analysed is silence,
  // and the reader's goes in its place.
  void hand_over(int c, float* re, float* im) {
    if (!shaped_[c]) return;
    shaped_[c] = false;
    const int bins = (kFrames[size_] >> 1) + 1;
    const float* from_re = out_re_[c];
    const float* from_im = out_im_[c];
    for (int k = 0; k < bins; ++k) {
      re[k] = from_re[k];
      im[k] = from_im[k];
    }
  }

  void apply(int id) {
    using namespace stretch;
    switch (id) {
      case kWindow:
        wanted_ = size_of(param(id));
        if (!primed()) size_ = wanted_;
        break;
      case kFreeze:
        frozen_ = param(id) >= 0.5f;
        break;
      case kTone:
        tone_.set(param(id), primed() && !asleep_);
        break;
      case kMix:
        mix_.set(param(id), primed() && !asleep_);
        break;
      default:
        break;  // the rest is read once a frame
    }
  }

  kit::Fft<2048> fft0_;
  kit::Fft<4096> fft1_;
  kit::Fft<8192> fft2_;
  kit::Fft<16384> fft3_;
  kit::Stft<2048> stft0_[2];
  kit::Stft<4096> stft1_[2];
  kit::Stft<8192> stft2_[2];
  kit::Stft<16384> stft3_[2];
  float memory_[2][kRing];
  float window_[kMaxFrame];        // Hann over the longest frame; a shorter one reads every 2nd, 4th or 8th
  float spectrum_[kMaxFrame];      // scratch: one reading, as kit::Fft::forward_real packs it
  float angle_[kMaxBins];          // scratch: the reading's phases
  uint16_t peaks_[kMaxBins / 2 + 1];
  float magnitude_[2][kMaxBins];   // the frame the reader stands on
  float phase_[2][kMaxBins];       // the phases it is resynthesised with
  float last_[2][kMaxBins];        // the phases of the last reading
  float turn_[2][kMaxBins];        // each bin's turn a hop: its partial's
  uint16_t lead_[2][kMaxBins];     // the peak each bin turns with
  bool ready_[2] = {false, false};    // a frame of this size has been read
  bool tracked_[2] = {false, false};  // and its partials' frequencies measured
  bool sound_[2] = {false, false};    // any bin of it above the floor
  bool fetched_[2] = {false, false};  // spectrum_ holds this channel's window
  bool shaped_[2] = {false, false};   // out_re_ and out_im_ hold its frame
  float out_re_[2][kMaxBins];      // the frame as it is handed to kit::Stft
  float out_im_[2][kMaxBins];
  int drain_[kSizes] = {0, 0, 0, 0};  // samples a size that was left still has to play out

  uint32_t clock_ = 0;           // samples since init, asleep or awake: the frame clocks' own count
  int write_ = 0;                // where the next sample goes in the memory
  int64_t written_ = 0;          // how many were recorded: the write head
  int swept_ = kRing;            // memory slots emptied by a sleep since the last sample
  uint32_t quiet_ = kQuietLimit;  // exact zeros recorded since the last sound
  double reader_ = 0.0;          // the reader, on the same count as written_
  int64_t whole_ = 0;            // the sample the frame in hand is centred on
  int64_t last_whole_ = 0;       // and the one before it
  double glide_ = 0.0;           // samples of lag shed each hop while catching up
  bool empty_ = true;            // nothing but silence left to read
  bool priming_ = false;         // the first window of a new sound is still filling
  bool catching_ = false;        // running up to the present
  bool broken_ = true;           // the next frame does not follow from the last
  bool frozen_ = false;
  bool asleep_ = true;
  int size_ = 2;                 // the Window in use
  int wanted_ = 2;               // the Window asked for
  Plan plan_ = kSilent;
  int step_ = 1;
  float ratio_ = 1.0f;
  float scatter_ = 0.0f;
  float gain_ = 1.0f;
  float walk_ = 0.0f;            // a partial's wander a frame, radians at most
  uint32_t frame_number_ = 0;
  float speed_seen_ = 0.0f;      // for meter()
  float behind_seen_ = 0.0f;

  kit::Biquad shelf_[2];
  kit::Smoother mix_, tone_;
  kit::ControlClock tone_clock_;
  kit::IdleGate idle_;
  float tone_seen_ = 0.0f;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
};

}  // namespace livemix
