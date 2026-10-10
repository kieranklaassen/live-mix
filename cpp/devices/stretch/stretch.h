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
//   under the middle of the window, and thins out as the window moves on.
// - The frames. kit::Stft does the resynthesis, the overlap-add and the
//   frame clock. It is fed the input as it is played, and its callback puts
//   the reader's spectrum in the place of the one it analysed; that one, the
//   spectrum of what is played now, is what the cloud is kept apart from
//   (below). The reader's analysis is the device's own (kit::Fft::
//   forward_real on the memory under the same Hann window), because it reads
//   where the reader stands and not where the input is. Four frame sizes
//   stand ready (Window): 2048, 4096, 8192 and 16384 samples, each at a
//   quarter hop.
// - Per bin. A phase vocoder with the peaks locked: each peak of the
//   spectrum is a partial, its true frequency is measured from how far its
//   phase turned between two readings, its phase goes on turning by that
//   frequency for a whole hop, and the bins around it keep their phase
//   against it, so a partial stays a partial and a sine comes out a sine at
//   its own pitch whatever the stretch. Where a frame does not follow from
//   the last one (the first after a jump, every frame of a run up to the
//   present) there is nothing to measure against, and each partial's
//   frequency is read from the shape of its peak instead (the two bins
//   beside it, under a Hann window), so its phase is carried on all the
//   same: a held note goes through a catch-up unbroken. A peak that stands
//   kOnset times above what its bin held a frame before is a note beginning
//   and starts with the phase it is read with, so each side keeps its own
//   and an anti-phase source stays anti-phase. On top of that
//   Diffuse turns every bin by a fresh random angle of up to ±Diffuse × 180°
//   each frame (at 1 the phases are all random, which is the classic diffuse
//   stretch), and the magnitudes are raised by what random phase costs.
//   Every partial also wanders by a small random step a frame (kWalk).
// - The cloud and the note being played. A note in the cloud and the same
//   note held now are one frequency: left alone they drift in and out of
//   step, and at a part-way Mix the note swells and then vanishes for
//   seconds. So each of the cloud's stronger partials is turned, frame by
//   frame, to lie a quarter turn from that partial in the input (read from
//   kit::Stft's own analysis, carried on to where the frame will sound): the
//   two then add as power, neither doubling nor cancelling. Fully diffuse,
//   every frame is turned freely; with Diffuse lower only partials within
//   kNearHz of the played one are turned, by kPull a frame at most, so the
//   cloud is never pulled off its pitch.
// - Freeze stops the reader and the memory: nothing is recorded, the
//   spectrum of the moment is held and each partial goes on turning at its
//   own frequency (never the same frame replayed, which would buzz at the
//   frame rate). Off, the phrase goes on from the same place; the cut in the
//   recording is faded over kSpliceSeconds either side.
// - Window. A change lets the size that is left hold its last frame and fade
//   while the new size's frames come in under it, over the longer of the two
//   windows, each of the new size's partials starting in step with the same
//   partial of the old (joined()), so the cloud neither drops out nor jumps.
// - Width gives the right channel its own random angles and its own wander;
//   at 0 both channels use the same ones and a mono input stays mono.
// - Tone splits the wet signal at 1 kHz (one pole) and only ever takes
//   away: left of centre the highs go down by up to 12 dB, right of centre
//   the lows. The wet signal is then limited: linear up to ±1, never past ±2.
//
// Latency: none. The dry path is the input itself (Mix 0 is the input,
// sample for sample); the wet path is late by design, at least a window and
// a quarter. Delaying the dry signal to "match" would line it up with
// nothing and only make the instrument late under the hands.
//
// Storage: the memory is 20 s at 96 kHz for each channel plus the longest
// window (2 × 1,944,576 floats, 15.6 MB); the four pairs of kit::Stft are
// 2.6 MB, the transforms' tables 0.25 MB and what is kept per bin 1.3 MB.
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
  // 48 kHz (a hop of 43 ms), in half turns: ±18°.
  static constexpr float kWalk = 0.1f;
  // Bin magnitudes under this are dropped: a full-scale sine reads a quarter
  // of the frame, so this is under -174 dBFS a bin at every size.
  static constexpr float kFloor = 1.0e-6f;
  // Keeping the cloud apart from the note being played: the partials looked
  // at (those within 40 dB of the frame's strongest, the first kStrong of
  // them), how near in frequency one must be to the played one to be turned
  // while Diffuse is under 1, the most it is turned in a frame then, and how
  // many bins either side of a peak turn with it.
  static constexpr int kStrong = 160;
  static constexpr float kStrongShare = 0.01f;
  static constexpr float kNearHz = 0.75f;
  static constexpr float kPull = 0.5f;
  static constexpr int kReach = 8;
  // How far towards its own angles the right side goes at full Width when
  // fully scattered: beyond this the sides are no further apart.
  static constexpr float kWidest = 0.8f;
  // How far above what its bin held a frame before a peak must stand to be
  // a note beginning rather than one going on.
  static constexpr float kOnset = 4.0f;
  // The fade either side of the cut Freeze leaves in the recording.
  static constexpr float kSpliceSeconds = 0.01f;
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
      for (int set = 0; set < 2; ++set) {
        Kept& kept = kept_[set][c];
        for (int k = 0; k < kMaxBins; ++k) {
          kept.magnitude[k] = 0.0f;
          kept.phase[k] = 0.0f;
          kept.turn[k] = 0.0f;
          kept.lead[k] = static_cast<uint16_t>(k);
          out_re_[set][c][k] = 0.0f;
          out_im_[set][c][k] = 0.0f;
        }
        ready_[set][c] = false;
        sound_[set][c] = false;
        shaped_[set][c] = false;
        unsent_[set][c] = false;
        number_[set][c] = 0;
      }
      for (int k = 0; k < kMaxBins; ++k) {
        last_[c][k] = 0.0f;
        now_re_[c][k] = 0.0f;
        now_im_[c][k] = 0.0f;
        now_phase_[c][k] = 0.0f;
        now_off_[c][k] = 0.0f;
      }
      strong_count_[c] = 0;
      fetched_[c] = false;
      tone_low_[c] = 0.0f;
    }
    forget_now();
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
    near_ = 0.1f;
    apart_ = false;
    frame_number_ = 0;
    speed_seen_ = 1.0f;
    behind_seen_ = 0.0f;
    asleep_ = true;

    size_ = size_of(param(kWindow));
    wanted_ = size_;
    set_ = 0;
    leaving_ = -1;
    fading_ = false;
    fade_from_ = 0;
    fade_span_ = 1;
    frozen_ = param(kFreeze) >= 0.5f;
    splice_length_ = static_cast<int>(kSpliceSeconds * sr);
    if (splice_length_ < 1) splice_length_ = 1;
    splice_ = 0;
    mix_.set_time(kSmoothingSeconds, sr);
    high_.set_time(kSmoothingSeconds, sr);
    low_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    set_tone(false);
    // One pole, made by the trapezoid rule: nothing of the highs is left in
    // the low half at the top of the band, so a cut is a whole cut there.
    const float warped = std::tan(kit::kPi * kSplitHz / sr);
    split_ = warped / (1.0f + warped);
    mix_seen_ = -1.0f;
    dry_gain_ = 1.0f;
    wet_gain_ = 0.0f;
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
      high_.snap(high_.target);
      low_.snap(low_.target);
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      // A change of Window falls on the new size's own reading clock, once
      // the last change has been played out.
      if (wanted_ != size_ && leaving_ < 0 && !fading_) {
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
      // The size that was left holds its last frame and fades, on its own clock.
      if (leaving_ >= 0) {
        const uint32_t hop = static_cast<uint32_t>(kFrames[leaving_] >> 2);
        if ((clock_ & ((hop >> 3) - 1)) == 0) {
          const uint32_t part = (clock_ & (hop - 1)) / (hop >> 3);
          if (part == 7) fade_out(0);
          if (part == 3) fade_out(1);
        }
      }

      float wet[2];
      for (int c = 0; c < 2; ++c) {
        wet[c] = run(stft0_, 0, c, in[c]) + run(stft1_, 1, c, in[c]) + run(stft2_, 2, c, in[c]) +
                 run(stft3_, 3, c, in[c]);
      }
      for (int s = 0; s < kSizes; ++s) {
        if (drain_[s] > 0) --drain_[s];
      }
      if (!frozen_) record(in[0], in[1]);
      ++clock_;

      const float high = high_.next();
      const float low = low_.next();
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        if (mix <= 0.0f) wet_gain_ = 0.0f;
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        // Tone: the wet signal below and above the split, each with its gain.
        const float step = (wet[c] - tone_low_[c]) * split_;
        const float under = step + tone_low_[c];
        tone_low_[c] = flush_denormal(under + step);
        const float toned = under * low + (wet[c] - under) * high;
        // Linear up to ±1, never past ±2.
        const float shaped = 2.0f * kit::soft_clip(0.5f * toned);
        out[c] = in[c] * dry_gain_ + shaped * wet_gain_;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Plan { kSilent, kHeld, kFresh, kCoherent };

  // One frame as it is kept from hop to hop: what a partial is made of.
  struct Kept {
    float magnitude[kMaxBins];  // the frame the reader stands on
    float phase[kMaxBins];      // the phases it is resynthesised with
    float turn[kMaxBins];       // each bin's turn a hop: its partial's
    uint16_t lead[kMaxBins];    // the peak each bin turns with
  };

  static constexpr float kSplitHz = 1000.0f;
  static constexpr float kShelfDb = 12.0f;
  static constexpr uint32_t kQuietLimit = 1u << 30;
  static constexpr uint32_t kNever = 0xFFFFFFFFu;

  static int size_of(float value) { return kit::clamp_int(static_cast<int>(value + 0.5f), 0, kSizes - 1); }

  // Whether the device still has something to say without new input.
  bool alive() const {
    if (leaving_ >= 0) return true;
    for (int s = 0; s < kSizes; ++s) {
      if (drain_[s] > 0) return true;
    }
    if (frozen_) return sound_[set_][0] || sound_[set_][1] || !ready_[set_][0] || !ready_[set_][1];
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
      tone_low_[c] = 0.0f;
    }
    fading_ = false;
    if (wanted_ != size_) {
      const uint32_t hop = static_cast<uint32_t>(kFrames[wanted_] >> 2);
      const uint32_t until = (5 * (hop >> 3) - (clock_ & (hop - 1))) & (hop - 1);
      if (until < static_cast<uint32_t>(frames)) change_size(true);
    }
    clock_ += static_cast<uint32_t>(frames);
    if (frozen_) return;
    splice_ = splice_ > frames ? splice_ - frames : 0;
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
    float l = (left > -64.0f && left < 64.0f) ? flush_denormal(left) : 0.0f;
    float r = (right > -64.0f && right < 64.0f) ? flush_denormal(right) : 0.0f;
    if (splice_ > 0) {
      // Freeze was just let go: the recording comes in under a fade.
      const float gain = splice_gain(splice_length_ - splice_);
      l *= gain;
      r *= gain;
      --splice_;
    }
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

  // The fade either side of the cut Freeze leaves: 0 at the cut, 1 a splice
  // length away (`away` counts samples from the cut).
  float splice_gain(int away) const {
    const float along = (static_cast<float>(away) + 0.5f) / static_cast<float>(splice_length_);
    return 0.5f - 0.5f * std::cos(kit::kPi * along);
  }

  // Freeze let go: what was recorded last is faded out towards the cut, and
  // what is recorded next fades in from it.
  void splice() {
    int at = write_;
    for (int i = 0; i < splice_length_; ++i) {
      if (--at < 0) at = kRing - 1;
      const float gain = splice_gain(i);
      memory_[0][at] *= gain;
      memory_[1][at] *= gain;
    }
    splice_ = splice_length_;
  }

  // The frames of size `s` for channel `c`. The size in use is given the
  // input, so that its callback sees what is played now, and hands over the
  // reader's frame; the size that is being left hands over its fading frame;
  // one that was left plays its last frames out; the rest only keep their
  // clocks.
  template <typename S>
  float run(S* stft, int s, int c, float x) {
    if (s == size_) {
      S* own = &stft[c];
      return own->process(x, [this, c, own](float* re, float* im) { hand_over(c, re, im, own->frame()); });
    }
    if (s == leaving_) {
      return stft[c].process(0.0f, [this, c](float* re, float* im) { send(set_ ^ 1, c, S::kBins, re, im); });
    }
    if (drain_[s] > 0) {
      return stft[c].process(0.0f, [](float* re, float* im) {
        for (int k = 0; k < S::kBins; ++k) {
          re[k] = 0.0f;
          im[k] = 0.0f;
        }
      });
    }
    stft[c].skip(1);
    return 0.0f;
  }

  // Window changes: the size in use becomes the one that is left, with the
  // frame it holds, and the new size starts in the other set of bins.
  void change_size(bool asleep) {
    const int old = size_;
    size_ = wanted_;
    set_ ^= 1;
    for (int c = 0; c < 2; ++c) {
      ready_[set_][c] = false;
      sound_[set_][c] = false;
      shaped_[set_][c] = false;
      unsent_[set_][c] = false;
      fetched_[c] = false;
      strong_count_[c] = 0;
    }
    broken_ = true;
    plan_ = kSilent;
    forget_now();
    leaving_ = -1;
    fading_ = false;
    // The new size goes on from whatever it still had in flight.
    drain_[size_] = 0;
    if (asleep) {
      for (int s = 0; s < kSizes; ++s) drain_[s] = 0;
      return;
    }
    leaving_ = old;
    fading_ = true;
    // The crossfade is counted from one hop before the middle of the new
    // size's first frame, or from the middle of the last frame the old size
    // has already made whole if that is later, and lasts as long as the
    // longer window.
    const uint32_t hop = static_cast<uint32_t>(kFrames[size_] >> 2);
    const uint32_t old_hop = static_cast<uint32_t>(kFrames[old] >> 2);
    fade_from_ = (clock_ / hop + 1) * hop + hop + (hop >> 1);
    const uint32_t made = ((clock_ + (old_hop >> 3)) / old_hop) * old_hop + 2 * old_hop + (old_hop >> 1);
    if (static_cast<int32_t>(made - fade_from_) > 0) fade_from_ = made;
    fade_span_ = kFrames[size_] > kFrames[old] ? kFrames[size_] : kFrames[old];
  }

  // How far the crossfade of a Window change has come at the middle of frame
  // `frame` of size `s`: 0 before it, 1 after.
  float fade_at(int s, uint32_t frame) const {
    const uint32_t hop = static_cast<uint32_t>(kFrames[s] >> 2);
    const int32_t since = static_cast<int32_t>(hop * frame + 2 * hop + (hop >> 1) - fade_from_);
    if (since <= 0) return 0.0f;
    if (since >= fade_span_) return 1.0f;
    return static_cast<float>(since) / static_cast<float>(fade_span_);
  }

  // Nothing read of the input so far is to be trusted (a new size, a start).
  void forget_now() {
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kMaxBins; ++k) {
        now_stamp_[c][k] = kNever;
        now_good_[c][k] = kNever;
      }
    }
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
    // The number kit::Stft gives the frame that is due in three eighths of a hop.
    frame_number_ = clock_ / static_cast<uint32_t>(hop) + 1;
    scatter_ = param(kDiffuse);
    gain_ = scatter_gain(scatter_);
    // The wander is a random walk: by the square root of the hop's length
    // it is as fast in seconds at every Window and sample rate.
    walk_ = walk_of(hop);
    // How near the played partial must be, in bins, and whether the cloud
    // is heard beside the input at all.
    near_ = kNearHz * static_cast<float>(frame) / sample_rate();
    if (near_ < 0.03f) near_ = 0.03f;
    apart_ = param(kMix) > 0.001f && param(kMix) < 0.999f;

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
    // A frame that follows the last one by a short step is measured against
    // it; one that does not (after a break, or run through at speed) has its
    // partials' frequencies read from the shape of their peaks.
    const bool fast = catching_ || moved > hop;
    if (!broken_ && !fast && moved >= 1) {
      plan_ = kCoherent;
      step_ = static_cast<int>(moved);
      ratio_ = static_cast<float>(hop) / static_cast<float>(moved);
    } else {
      plan_ = kFresh;
    }
    // How far the reader moved through the memory for this hop of playing.
    speed_seen_ = broken_ ? static_cast<float>(rate) : static_cast<float>(moved) / static_cast<float>(hop);
    behind_seen_ = static_cast<float>(lag);
    last_whole_ = whole_;
    broken_ = false;
  }

  // A partial's wander a frame at a hop of `hop` samples, radians at most.
  float walk_of(int hop) const {
    return kWalk * kit::kPi * std::sqrt(static_cast<float>(hop) * 48000.0f / (2048.0f * sample_rate()));
  }

  // The first part of channel c's frame: the window the reader stands on,
  // transformed. (A frozen frame has none, unless nothing was read at this
  // size yet.)
  void fetch(int c) {
    fetched_[c] = false;
    if (plan_ == kSilent) return;
    if (plan_ == kHeld && ready_[set_][c]) return;
    spectrum_of(c, whole_);
    fetched_[c] = true;
  }

  // The second part: magnitudes and phases, each partial carried on from
  // the frame before.
  void track(int c) {
    const bool fetched = fetched_[c];
    fetched_[c] = false;
    switch (plan_) {
      case kHeld:
        if (ready_[set_][c]) {
          hold(set_, c, frame_number_, walk_);
          return;
        }
        if (fetched) {
          measure(c, false, 1, 1.0f);
          return;
        }
        break;
      case kFresh:
        if (fetched) {
          measure(c, false, 1, 1.0f);
          return;
        }
        break;
      case kCoherent:
        if (fetched) {
          measure(c, true, step_, ratio_);
          return;
        }
        break;
      case kSilent:
        break;
    }
    ready_[set_][c] = false;
    sound_[set_][c] = false;
    unsent_[set_][c] = false;
    strong_count_[c] = 0;
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

  // The two random sources of frame `number`, the same for both channels:
  // `shared` for both, `own` for what Width gives the right channel alone.
  static void seed(kit::Rng* shared, kit::Rng* own, uint32_t salt, uint32_t number) {
    shared->seed((0x9E3779B9u + salt) ^ (number * 2654435761u));
    own->seed((0x7F4A7C15u + salt) ^ (number * 2246822519u));
    for (int warm = 0; warm < 4; ++warm) {
      shared->next_u32();
      own->next_u32();
    }
  }

  // One partial's wander for this frame, in radians.
  float wander(int c, float walk, kit::Rng* shared, kit::Rng* own) const {
    float angle = shared->bipolar();
    const float other = own->bipolar();
    if (c == 1) angle += param(stretch::kWidth) * (other - angle);
    return angle * walk;
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
  // from the frame before. `follows` says the last reading was `step`
  // samples before this one (ratio = hop / step), so each partial's
  // frequency is measured from how far its phase turned between the two;
  // otherwise it is read from the shape of its peak. With no frame before
  // (the first after silence or at a new size) the phases are taken as read.
  void measure(int c, bool follows, int step, float ratio) {
    const int frame = kFrames[size_];
    const int half = frame >> 1;
    Kept& kept = kept_[set_][c];
    float* magnitude = kept.magnitude;
    float* phase = kept.phase;
    float* last = last_[c];
    float* turn = kept.turn;
    uint16_t* lead = kept.lead;
    float* angle = angle_;
    const bool carried = ready_[set_][c];
    // The first frame of a new Window, while the old one still sounds.
    const bool joins = !carried && leaving_ >= 0 && ready_[set_ ^ 1][c] && sound_[set_ ^ 1][c];
    number_[set_][c] = frame_number_;
    float top = 0.0f;
    for (int k = 0; k <= half; ++k) {
      const float re = spectrum_[k];
      const float im = (k == 0 || k == half) ? 0.0f : spectrum_[frame - k];
      float size;
      kit::to_polar(re, im, &size, &angle[k]);
      if (size < kFloor) size = 0.0f;
      before_[k] = carried ? magnitude[k] : 0.0f;
      magnitude[k] = size;
      if (size > top) top = size;
    }
    sound_[set_][c] = top > 0.0f;
    ready_[set_][c] = true;
    unsent_[set_][c] = true;

    // The peaks: bins above their two neighbours on either side. The
    // stronger ones are the partials kept apart from the input.
    int peaks = 0;
    int strong = 0;
    const float least = kStrongShare * top;
    for (int k = 1; k < half; ++k) {
      const float m = magnitude[k];
      if (m > 0.0f && m > magnitude[k - 1] && m >= magnitude[k + 1] && (k < 2 || m > magnitude[k - 2]) &&
          (k + 2 > half || m >= magnitude[k + 2])) {
        peaks_[peaks++] = static_cast<uint16_t>(k);
        if (m >= least && strong < kStrong) strong_[c][strong++] = static_cast<uint16_t>(k);
      }
    }
    strong_count_[c] = strong;
    if (peaks == 0) {
      for (int k = 0; k <= half; ++k) {
        phase[k] = angle[k];
        turn[k] = kit::kHalfPi * static_cast<float>(k & 3);
        lead[k] = static_cast<uint16_t>(k);
        last[k] = angle[k];
      }
      return;
    }
    kit::Rng shared, own;
    seed(&shared, &own, 0x1000u, frame_number_);
    const float turns_to_radians = kit::kTwoPi / static_cast<float>(frame);
    int from = 0;
    for (int i = 0; i < peaks; ++i) {
      const int p = peaks_[i];
      const int to = i + 1 < peaks ? (p + peaks_[i + 1] + 1) >> 1 : half + 1;
      // A partial goes on from the frame before where there was one: a peak
      // that stands kOnset times above what its bin held then (or where it
      // held nothing) is a note beginning, and starts with the phase it is
      // read with, so each side keeps its own and the two keep their
      // relation (an anti-phase source stays anti-phase).
      const bool goes_on = before_[p] * kOnset >= magnitude[p];
      const float drift = wander(c, fading_ ? 0.0f : walk_, &shared, &own);
      // How far the partial lies from its peak's centre, in bins.
      float off;
      if (follows && goes_on) {
        // How far the phase turned beyond the bin's own share over `step`
        // samples, carried over a hop.
        const float own_share = turns_to_radians * static_cast<float>((p * step) & (frame - 1));
        off = kit::princarg(angle[p] - last[p] - own_share) * ratio * (2.0f / kit::kPi);
      } else {
        // Under a Hann window a partial `off` bins above its peak's centre
        // reads (1 + off) / (2 - off) of the peak in the bin above.
        const float up = magnitude[p + 1];
        const float down = magnitude[p - 1];
        const float beside = (up >= down ? up : down) / magnitude[p];
        off = kit::clamp((2.0f * beside - 1.0f) / (beside + 1.0f), -0.5f, 0.5f);
        if (down > up) off = -off;
      }
      // A hop of the partial's own frequency: a quarter turn a bin.
      const float advance = kit::kHalfPi * (static_cast<float>(p & 3) + off);
      float base = angle[p];
      if (goes_on) {
        base = kit::princarg(phase[p] + advance + drift);
      } else if (joins) {
        base = joined(c, p, off, angle[p]);
      }
      const float anchor = angle[p];
      for (int k = from; k < to; ++k) {
        phase[k] = base + angle[k] - anchor;
        turn[k] = advance;
        lead[k] = static_cast<uint16_t>(p);
      }
      from = to;
    }
    for (int k = 0; k <= half; ++k) last[k] = angle[k];
  }

  // The phase for the peak in bin p (the partial `off` bins above its centre)
  // of the new Window's first frame, so that it starts in step with the same
  // partial in the frame the old Window still holds: that partial's phase at
  // its frame's first sample, carried on at its own frequency to this
  // frame's first sample. (A peak's phase lies half a turn a bin ahead of
  // its partial's, the Hann window being centred on the frame.) `as_read`
  // where the old frame has no such partial.
  float joined(int c, int p, float off, float as_read) const {
    const int old = set_ ^ 1;
    const Kept& left = kept_[old][c];
    const int old_frame = kFrames[leaving_];
    const int new_frame = kFrames[size_];
    const float at = (static_cast<float>(p) + off) * static_cast<float>(old_frame) / static_cast<float>(new_frame);
    const int k = static_cast<int>(at + 0.5f);
    if (k < 1 || k >= (old_frame >> 1)) return as_read;
    const int lead = left.lead[k];
    if (!(left.magnitude[lead] > 0.0f)) return as_read;
    const float lead_off =
        kit::princarg(left.turn[lead] - kit::kHalfPi * static_cast<float>(lead & 3)) * (2.0f / kit::kPi);
    if (std::fabs(static_cast<float>(lead) + lead_off - at) > 0.5f) return as_read;
    const uint32_t old_hop = static_cast<uint32_t>(old_frame >> 2);
    const uint32_t new_hop = static_cast<uint32_t>(new_frame >> 2);
    const int32_t apart = static_cast<int32_t>(new_hop * frame_number_ + (new_hop >> 1) -
                                               (old_hop * number_[old][c] + (old_hop >> 1)));
    const double cycles = (static_cast<double>(lead) + lead_off) * apart / old_frame;
    const float turned = kit::kTwoPi * static_cast<float>(cycles - std::floor(cycles));
    return kit::princarg(left.phase[lead] - kit::kPi * lead_off + turned + kit::kPi * off);
  }

  // A held frame of size `frame`: the magnitudes stay, and every partial
  // goes on turning at its own frequency (and wandering), its bins together.
  void hold(int set, int c, uint32_t number, float walk) {
    Kept& kept = kept_[set][c];
    const int half = kFrames[set == set_ ? size_ : leaving_] >> 1;
    float* phase = kept.phase;
    const float* turn = kept.turn;
    const uint16_t* lead = kept.lead;
    kit::Rng shared, own;
    seed(&shared, &own, 0x1000u, number);
    int k = 0;
    while (k <= half) {
      const uint16_t partial = lead[k];
      const float step = turn[k] + wander(c, walk, &shared, &own);
      for (; k <= half && lead[k] == partial; ++k) phase[k] = kit::princarg(phase[k] + step);
    }
    number_[set][c] = number;
    unsent_[set][c] = true;
  }

  // The third part: every bin as it will sound, turned by its random angle,
  // and its stronger partials turned away from the note being played. While
  // a Window change is being played out the new size's frames come in under
  // the old one's.
  void shape(int c) {
    float level = 1.0f;
    if (fading_) {
      const float along = fade_at(size_, frame_number_);
      level = (1.0f - scatter_) * along + scatter_ * std::sin(kit::kHalfPi * along);
      if (along >= 1.0f && c == 1) fading_ = false;
    }
    shape_into(set_, c, kFrames[size_], frame_number_, level);
    // (Not while two sizes cross: the new one's partials stay in step with the old one's.)
    if (shaped_[set_][c] && apart_ && !fading_) keep_apart(c, out_re_[set_][c], out_im_[set_][c]);
  }

  // The size that was left: its last frame held, turned on by a hop and
  // faded out, until the crossfade is over and its frames in flight have
  // played out. `c` is the channel whose frame is due next.
  void fade_out(int c) {
    const int set = set_ ^ 1;
    const int frame = kFrames[leaving_];
    const int hop = frame >> 2;
    // The number kit::Stft gives that frame: the left one is due in an
    // eighth of a hop, the right one half a hop after its own number began.
    const uint32_t number = clock_ / static_cast<uint32_t>(hop) + (c == 0 ? 1u : 0u);
    const float along = fade_at(leaving_, number);
    if (along >= 1.0f) {
      shaped_[set][c] = false;
      if (c == 1) {
        drain_[leaving_] = 2 * frame + (frame >> 3) + 1;
        leaving_ = -1;
      }
      return;
    }
    if (!ready_[set][c] || !sound_[set][c]) {
      shaped_[set][c] = false;
      return;
    }
    // A frame that was read but not yet shaped when the change came goes out as it is.
    // It turns on without wandering, so the new size stays in step with it.
    if (!unsent_[set][c]) hold(set, c, number, 0.0f);
    // Scattered, the two sizes have nothing to do with each other and cross
    // at equal power; pure, the new one's partials start in step with the
    // old one's (joined()) and the two cross on a straight line.
    shape_into(set, c, frame, number, (1.0f - scatter_) * (1.0f - along) + scatter_ * std::cos(kit::kHalfPi * along));
  }

  void shape_into(int set, int c, int frame, uint32_t number, float level) {
    unsent_[set][c] = false;
    shaped_[set][c] = ready_[set][c] && sound_[set][c] && level > 0.0f;
    if (!shaped_[set][c]) return;
    const int half = frame >> 1;
    const float* magnitude = kept_[set][c].magnitude;
    const float* phase = kept_[set][c].phase;
    float* re = out_re_[set][c];
    float* im = out_im_[set][c];
    const float scatter = scatter_;
    if (!(scatter > 0.0f)) {
      for (int k = 0; k <= half; ++k) kit::from_polar(magnitude[k] * level, phase[k], &re[k], &im[k]);
      return;
    }
    // Both channels draw the same angles from `shared`; Width moves the
    // right channel towards its own. Fully scattered the two sides have
    // nothing in common once the right is kWidest of the way there, so the
    // knob's whole travel ends at that point and its top is not dead.
    kit::Rng shared, own;
    seed(&shared, &own, 0x2000u, number);
    const float widest = scatter > kWidest ? kWidest / scatter : 1.0f;
    const float apart = c == 0 ? 0.0f : param(stretch::kWidth) * widest;
    const float reach = scatter * kit::kPi;
    const float gain = gain_ * level;
    for (int k = 0; k <= half; ++k) {
      float angle = shared.bipolar();
      if (apart > 0.0f) angle += apart * (own.bipolar() - angle);
      kit::from_polar(magnitude[k] * gain, phase[k] + angle * reach, &re[k], &im[k]);
    }
  }

  // Keeps the cloud apart from the note being played. For each stronger
  // partial of the frame in `re` and `im`: the same three bins of the input
  // as kit::Stft last read them, carried on to where this frame will sound
  // (11/8 of a frame after that reading began, at the played partial's own
  // frequency), and the partial turned as a whole so that the two are a
  // quarter turn apart. Over the frame they then add as power: the cloud
  // neither doubles the note nor cancels it. Fully diffuse a frame's phases
  // are free and it is turned all the way; otherwise only a partial within
  // near_ bins of the played one is turned, by kPull at most, and its phase
  // goes on from where it was turned to.
  void keep_apart(int c, float* re, float* im) {
    Kept& kept = kept_[set_][c];
    const int half = kFrames[size_] >> 1;
    const uint32_t before = frame_number_ - 1;
    const bool free = scatter_ >= 0.999f;
    const float limit = kPull + scatter_ * (kit::kHalfPi - kPull);
    const float* now_re = now_re_[c];
    const float* now_im = now_im_[c];
    for (int i = 0; i < strong_count_[c]; ++i) {
      const int p = strong_[c][i];
      if (now_good_[c][p] != before) continue;
      const float off = now_off_[c][p];
      if (!free) {
        const float own = kit::princarg(kept.turn[p] - kit::kHalfPi * static_cast<float>(p & 3)) * (2.0f / kit::kPi);
        if (std::fabs(own - off) > near_) continue;
      }
      // Only where the played partial is at least a tenth of the cloud's.
      const float played = now_re[p] * now_re[p] + now_im[p] * now_im[p];
      if (played < 0.01f * kept.magnitude[p] * kept.magnitude[p]) continue;
      float across_re = 0.0f;
      float across_im = 0.0f;
      for (int k = p - 1; k <= p + 1; ++k) {
        across_re += re[k] * now_re[k] + im[k] * now_im[k];
        across_im += im[k] * now_re[k] - re[k] * now_im[k];
      }
      const float carried = 0.25f * kit::kPi * static_cast<float>((11 * p) & 7) + 2.75f * kit::kPi * off;
      const float angle = kit::princarg(kit::fast_atan2(across_im, across_re) - carried);
      float turn = angle >= 0.0f ? kit::kHalfPi - angle : -kit::kHalfPi - angle;
      turn = kit::clamp(turn, -limit, limit);
      float cosine, sine;
      kit::from_polar(1.0f, turn, &cosine, &sine);
      int k = p - kReach > 1 ? p - kReach : 1;
      const int end = p + kReach < half - 1 ? p + kReach : half - 1;
      for (; k <= end; ++k) {
        if (kept.lead[k] != p) continue;
        const float real = re[k] * cosine - im[k] * sine;
        im[k] = re[k] * sine + im[k] * cosine;
        re[k] = real;
        if (!free) kept.phase[k] = kit::princarg(kept.phase[k] + turn);
      }
    }
  }

  // kit::Stft's callback for channel c of the size in use: the frame it
  // analysed is the input as it is played, of which the stronger partials'
  // bins are kept for keep_apart(), and the reader's frame goes in its place.
  void hand_over(int c, float* re, float* im, uint32_t number) {
    float* now_re = now_re_[c];
    float* now_im = now_im_[c];
    for (int i = 0; i < strong_count_[c]; ++i) {
      const int p = strong_[c][i];
      for (int k = p - 1; k <= p + 1; ++k) {
        now_re[k] = re[k];
        now_im[k] = im[k];
      }
      // How far the played partial lies from the bin's centre, in bins, from
      // how far its phase turned since the frame before.
      const float phase = kit::fast_atan2(im[p], re[p]);
      if (number != 0 && now_stamp_[c][p] == number - 1) {
        now_off_[c][p] =
            kit::princarg(phase - now_phase_[c][p] - kit::kHalfPi * static_cast<float>(p & 3)) * (2.0f / kit::kPi);
        now_good_[c][p] = number;
      }
      now_phase_[c][p] = phase;
      now_stamp_[c][p] = number;
    }
    send(set_, c, (kFrames[size_] >> 1) + 1, re, im);
  }

  // The frame shaped for channel c in `set`, into kit::Stft's bins; silence
  // when there is none.
  void send(int set, int c, int bins, float* re, float* im) {
    if (!shaped_[set][c]) {
      for (int k = 0; k < bins; ++k) {
        re[k] = 0.0f;
        im[k] = 0.0f;
      }
      return;
    }
    shaped_[set][c] = false;
    const float* from_re = out_re_[set][c];
    const float* from_im = out_im_[set][c];
    for (int k = 0; k < bins; ++k) {
      re[k] = from_re[k];
      im[k] = from_im[k];
    }
  }

  // The gains of the wet signal above and below the split for Tone.
  void set_tone(bool glide) {
    const float tone = param(stretch::kTone);
    const float cut = std::pow(10.0f, -kShelfDb * std::fabs(tone) / 20.0f);
    high_.set(tone < 0.0f ? cut : 1.0f, glide);
    low_.set(tone > 0.0f ? cut : 1.0f, glide);
  }

  void apply(int id) {
    using namespace stretch;
    switch (id) {
      case kWindow:
        wanted_ = size_of(param(id));
        if (!primed()) size_ = wanted_;
        break;
      case kFreeze: {
        const bool on = param(id) >= 0.5f;
        if (frozen_ && !on) splice();
        frozen_ = on;
        break;
      }
      case kTone:
        set_tone(primed() && !asleep_);
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
  float window_[kMaxFrame];    // Hann over the longest frame; a shorter one reads every 2nd, 4th or 8th
  float spectrum_[kMaxFrame];  // scratch: one reading, as kit::Fft::forward_real packs it
  float angle_[kMaxBins];      // scratch: the reading's phases
  float before_[kMaxBins];     // scratch: the magnitudes of the frame before
  uint16_t peaks_[kMaxBins / 2 + 1];
  // Two sets of bins: the size in use works in kept_[set_], and the size a
  // Window change left holds its last frame in the other while it fades.
  Kept kept_[2][2];
  float out_re_[2][2][kMaxBins];  // a frame as it is handed to kit::Stft
  float out_im_[2][2][kMaxBins];
  bool ready_[2][2] = {};   // a frame of this size has been read
  bool sound_[2][2] = {};   // any bin of it above the floor
  bool unsent_[2][2] = {};  // it has been read or turned on, and not shaped yet
  bool shaped_[2][2] = {};  // out_re_ and out_im_ hold it
  uint32_t number_[2][2] = {};  // the frame (kit::Stft's count) its phases are for
  float last_[2][kMaxBins];        // the phases of the last reading
  bool fetched_[2] = {false, false};  // spectrum_ holds this channel's window
  uint16_t strong_[2][kStrong];    // the frame's stronger partials: their peaks' bins
  int strong_count_[2] = {0, 0};
  // The input as kit::Stft last read it, at those partials: three bins each,
  // the peak's phase and how far the played partial lies from the bin's
  // centre (bins), with the frame each was read in and last measured in.
  float now_re_[2][kMaxBins];
  float now_im_[2][kMaxBins];
  float now_phase_[2][kMaxBins];
  float now_off_[2][kMaxBins];
  uint32_t now_stamp_[2][kMaxBins];
  uint32_t now_good_[2][kMaxBins];
  int drain_[kSizes] = {0, 0, 0, 0};  // samples a size that was left still has to play out

  uint32_t clock_ = 0;            // samples since init, asleep or awake: the frame clocks' own count
  int write_ = 0;                 // where the next sample goes in the memory
  int64_t written_ = 0;           // how many were recorded: the write head
  int swept_ = kRing;             // memory slots emptied by a sleep since the last sample
  uint32_t quiet_ = kQuietLimit;  // exact zeros recorded since the last sound
  double reader_ = 0.0;           // the reader, on the same count as written_
  int64_t whole_ = 0;             // the sample the frame in hand is centred on
  int64_t last_whole_ = 0;        // and the one before it
  double glide_ = 0.0;            // samples of lag shed each hop while catching up
  bool empty_ = true;             // nothing but silence left to read
  bool priming_ = false;          // the first window of a new sound is still filling
  bool catching_ = false;         // running up to the present
  bool broken_ = true;            // the next frame does not follow from the last
  bool frozen_ = false;
  bool asleep_ = true;
  int size_ = 2;                  // the Window in use
  int wanted_ = 2;                // the Window asked for
  int set_ = 0;                   // the set of bins the size in use works in
  int leaving_ = -1;              // the size that is fading out after a change, or -1
  bool fading_ = false;           // the new size is still coming in
  uint32_t fade_from_ = 0;        // where on the clock the crossfade begins
  int fade_span_ = 1;             // and how many samples it lasts
  int splice_length_ = 1;         // the fade either side of a Freeze cut, samples
  int splice_ = 0;                // samples of that fade still to record
  Plan plan_ = kSilent;
  int step_ = 1;
  float ratio_ = 1.0f;
  float scatter_ = 0.0f;
  float gain_ = 1.0f;
  float walk_ = 0.0f;             // a partial's wander a frame, radians at most
  float near_ = 0.1f;             // how near a played partial must be to be turned from, bins
  bool apart_ = false;            // the cloud is heard beside the input
  uint32_t frame_number_ = 0;
  float speed_seen_ = 0.0f;       // for meter()
  float behind_seen_ = 0.0f;

  float tone_low_[2] = {0.0f, 0.0f};  // the state of the split's one pole
  float split_ = 0.0f;
  kit::Smoother mix_, high_, low_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
};

}  // namespace livemix
