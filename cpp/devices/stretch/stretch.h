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
//   and starts with the phase it is read with. On top of that
//   Diffuse turns every bin by a fresh random angle of up to ±Diffuse × 180°
//   each frame (at 1 the phases are all random, which is the classic diffuse
//   stretch), and the magnitudes are raised by what random phase costs.
//   Every partial also wanders by a small random step a frame (kWalk).
// - The two sides. A partial is looked for in the two sides together (the
//   sum of their powers), its turn between two readings is each side's,
//   weighed by how much of it that side holds, and what all of the above
//   comes to is one angle a bin, `spin`: how far the bin is turned from the
//   phase it was read with. Both sides are turned by that same angle, each
//   from its own reading and at its own level. So the angle and the level
//   between the two sides of a partial are the ones that were played: a
//   stereo source keeps its image, a mono one stays mono to the bit, and an
//   anti-phase one stays anti-phase. (Each side used to carry its own phases
//   on, and a played stereo source came out with its sides unrelated.)
//   Beside the spin each side has a turn of its own (`own`), for a note
//   that stands at two pitches on the two sides, a chorused or detuned
//   stereo source. That is a partial whose sides have gone half a turn
//   against each other in the reading since it began (`gone`), each side
//   being one steady partial all the while: its peak one partial's shape
//   (single()) and its level what it was (kEven). From then on `own` takes
//   out what the reading turns each side by itself, so the angle between
//   the sides no longer follows the reader (a run up to the present would
//   move it by seconds at once), and each side goes on at its own pitch, by
//   the smoothed difference between them (`beat`, from kSame bins up): each
//   side's frames follow on from one another and its cloud is the pitch
//   that side was played at. Everything else keeps the angle it is read
//   with. Less than half a turn is the sway of two notes at two places
//   under one peak, which comes back; and two such notes that each lead on
//   one side do go round, but then a side is two partials under its peak or
//   its level rises and falls as they go, and they are not taken for one
//   note. (Taken for one, each side was given a pitch of its own and the
//   two notes' image was lost.)
// - The cloud and the note being played. A note in the cloud and the same
//   note held now are one frequency: left alone they drift in and out of
//   step, and at a part-way Mix the note swells and then vanishes for
//   seconds. So each of the cloud's stronger partials is turned, frame by
//   frame, to lie a quarter turn from that partial in the input (read from
//   kit::Stft's own analysis on both sides, carried on to where the frame
//   will sound), on both sides by the same angle: the
//   two then add as power, neither doubling nor cancelling. Fully diffuse,
//   every frame is turned freely; with Diffuse lower only partials within
//   kNearHz of the played one are turned, by kPull a frame at most, so the
//   cloud is never pulled off its pitch. Where the played note's two sides
//   are not in step (most of all at two pitches) one angle cannot serve
//   both: each side is then turned the rest of the way by itself (`aside`,
//   by kPull a frame at most again), measured about where that side's note
//   lies, and the turn is let go again (kLetGo a frame) once the note is no
//   longer played. That is done only where each side of the played partial
//   has been one steady partial for kCalm hops, and fully diffuse only for
//   a note at two pitches: two notes at two places that share a peak pass
//   through opposite phase between the sides as they beat, and the cloud
//   would be turned to that at its own, other, level.
// - Freeze stops the reader and the memory: nothing is recorded, the
//   spectrum of the moment is held and each partial goes on turning at its
//   own frequency (never the same frame replayed, which would buzz at the
//   frame rate). Off, the phrase goes on from the same place; the cut in the
//   recording is faded over kSpliceSeconds either side.
// - Window. A change lets the size that is left hold its last frame and fade
//   while the new size's frames come in under it, over the longer of the two
//   windows, each of the new size's partials starting in step with the same
//   partial of the old (joined()), so the cloud neither drops out nor jumps.
// - Width leans the partials to the sides: the left side of a partial is
//   turned one way and the right side the other, by half of an angle that
//   is Width × 75° at the most (kWidest), less for a partial that stands
//   more on one side than the other, none for one that is on one side only.
//   Which way and how far is read off a pattern along the partial's
//   frequency (sway(): 2.7 turns of it an octave, bent so that it stands near
//   one end or the other most of the way), and the pattern drifts upwards
//   by a turn in 50 s, by the sample clock. The lean is not carried on from
//   frame to frame: it is put on each frame as it is made, so the angle
//   between the sides never adds up. At 75° a partial folds to mono 2.0 dB
//   under itself, and that is the worst any note or chord does at any
//   Width, Window or Diffuse; the side comes up steadily along the knob
//   (15.8, 9.6, 5.7 and 2.6 dB under the middle at 0.25, 0.5, 0.75 and 1 on
//   a source that is the same on both sides). With the dry signal in, a
//   partial that leans would stand a quarter turn less half the lean from
//   the played note on one side and plus half the lean on the other, the
//   note up to 2.1 dB up on one side and 4.1 dB down on the other: so a
//   partial of the cloud that is being played now leans less, by how alike
//   cloud and note are in level in the mix (keep_apart()), and comes back
//   to its lean as the note stops. (The right side used to
//   draw its own random angles and its own wander, which added up frame by
//   frame with nothing to bound them: the two sides of a note passed through
//   opposite phase and, the longer the frame and the lower Diffuse and
//   Width, the longer they stayed there.)
// - Tone splits the wet signal at 1 kHz (one pole) and only ever takes
//   away: left of centre the highs go down by up to 12 dB, right of centre
//   the lows. The mix then meets its ceiling: while the played sound
//   and the cloud together stay within ±0.75 they go out as they are; past
//   that only what the cloud adds is bent, so that the cloud never takes
//   the output past full scale, alone (Mix 1) or on top of the played sound.
//
// Latency: none. The dry path is the input itself (Mix 0 is the input,
// sample for sample); the wet path is late by design, at least a window and
// a quarter. Delaying the dry signal to "match" would line it up with
// nothing and only make the instrument late under the hands.
//
// Storage: the memory is 20 s at 96 kHz for each channel plus the longest
// window (2 × 1,944,576 floats, 15.6 MB); the four pairs of kit::Stft are
// 2.6 MB, the transforms' tables 0.25 MB and what is kept per bin 2.1 MB.
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
  // Width. The widest angle between the two sides of a partial, at full
  // Width, in radians (75°): at that angle the partial folds to mono 2.0 dB
  // under itself and never lower. Which way a partial leans is read off a
  // pattern along its frequency, kLeanCycles turns of it an octave from
  // kLeanFromHz up, which drifts upwards by kLeanDrift turns a second.
  static constexpr float kWidest = 75.0f * 3.14159265f / 180.0f;
  static constexpr float kLeanCycles = 2.7f;
  static constexpr float kLeanFromHz = 20.0f;
  static constexpr float kLeanDrift = 0.02f;
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
        Kept& kept = kept_[set];
        for (int k = 0; k < kMaxBins; ++k) {
          kept.magnitude[c][k] = 0.0f;
          kept.angle[c][k] = 0.0f;
          out_re_[set][c][k] = 0.0f;
          out_im_[set][c][k] = 0.0f;
        }
        sound_[set][c] = false;
        shaped_[set][c] = false;
      }
      for (int k = 0; k < kMaxBins; ++k) {
        read_magnitude_[c][k] = 0.0f;
        read_angle_[c][k] = 0.0f;
        now_re_[c][k] = 0.0f;
        now_im_[c][k] = 0.0f;
        now_phase_[c][k] = 0.0f;
        now_off_[c][k] = 0.0f;
        now_gone_[k] = 0.0f;
        now_calm_[k] = 0;
        now_even_[c][k] = 0.0f;
      }
      fetched_[c] = false;
      tone_low_[c] = 0.0f;
    }
    for (int set = 0; set < 2; ++set) {
      Kept& kept = kept_[set];
      for (int k = 0; k < kMaxBins; ++k) {
        kept.spin[k] = 0.0f;
        kept.turn[k] = 0.0f;
        kept.scatter[k] = 0.0f;
        kept.lean[k] = 0.0f;
        kept.aside[0][k] = 0.0f;
        kept.aside[1][k] = 0.0f;
        kept.own[0][k] = 0.0f;
        kept.own[1][k] = 0.0f;
        kept.beat[k] = 0.0f;
        kept.gone[k] = 0.0f;
        kept.even[0][k] = 0.0f;
        kept.even[1][k] = 0.0f;
        kept.lead[k] = static_cast<uint16_t>(k);
      }
      aside_[set] = false;
      ready_[set] = false;
      scattered_[set] = false;
      leaning_[set] = false;
      number_[set] = 0;
      dressed_[set] = kNever;
    }
    strong_count_ = 0;
    forget_now();
    const double step = 2.0 * 3.14159265358979323846 / kMaxFrame;
    for (int n = 0; n < kMaxFrame; ++n) window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(step * n));
    for (int i = 0; i < kMaxFrame; ++i) spectrum_[i] = 0.0f;
    // Where each bin of the longest frame lies along Width's pattern, in
    // turns: so many to the octave, whatever the sample rate.
    for (int k = 0; k < kMaxBins; ++k) {
      const float hz = static_cast<float>(k) * sr / static_cast<float>(kMaxFrame);
      place_[k] = hz > kLeanFromHz ? kLeanCycles * std::log2(hz / kLeanFromHz) : 0.0f;
      power_[k] = 0.0f;
    }
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
      // A frame's work is spread over the hop before it is due, a sixteenth
      // of a hop apart, so that no block holds more than one part of it at
      // the longer windows: the reader moves and the left side's window is
      // transformed, then the right side's, the partials of the two are
      // tracked together, the frame is dressed, the left side's bins are
      // made and kit::Stft resynthesises them; the right side's are made
      // and resynthesised half a hop on.
      {
        const uint32_t hop = static_cast<uint32_t>(kFrames[size_] >> 2);
        if ((clock_ & ((hop >> 4) - 1)) == 0) {
          switch ((clock_ & (hop - 1)) / (hop >> 4)) {
            case 10:
              tick();
              fetch(0);
              break;
            case 11:
              fetch(1);
              break;
            case 12:
              track();
              break;
            case 13:
              prepare();
              break;
            case 14:
              shape(0);
              break;
            case 6:
              shape(1);
              break;
            default:
              break;  // 0 and 8: the frames themselves, in kit::Stft
          }
        }
      }
      // The size that was left holds its last frame and fades, on its own clock.
      if (leaving_ >= 0) {
        const uint32_t hop = static_cast<uint32_t>(kFrames[leaving_] >> 2);
        if ((clock_ & ((hop >> 4) - 1)) == 0) {
          const uint32_t part = (clock_ & (hop - 1)) / (hop >> 4);
          if (part == 14) fade_out(0);
          if (part == 6) fade_out(1);
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
        // The played sound as it is, and the cloud under the ceiling.
        out[c] = under_ceiling(in[c] * dry_gain_, toned * wet_gain_);
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Plan { kSilent, kHeld, kFresh, kCoherent };

  // One frame as it is kept from hop to hop: each side as it was read where
  // the reader stands, and what the two sides share. A bin of a side sounds
  // at its own phase as read, turned by `spin` (and this frame's `scatter`,
  // and `lean` one way or the other): the angle between the two sides of a
  // partial is the one that was played, and Width's lean on top.
  struct Kept {
    float magnitude[2][kMaxBins];  // the frame the reader stands on, left and right
    float angle[2][kMaxBins];      // its phases as read
    float spin[kMaxBins];          // how far each bin is turned from its reading: its partial's
    float turn[kMaxBins];          // each bin's turn a hop: its partial's
    float scatter[kMaxBins];       // each bin's random angle for this frame (Diffuse)
    float lean[kMaxBins];          // half the angle between the sides at this bin (Width): its partial's
    float own[2][kMaxBins];        // each side's own turn beside the spin, where the sides differ in pitch: its partial's
    float beat[kMaxBins];          // how far apart in pitch the two sides hold the bin's partial, bins (smoothed)
    float gone[kMaxBins];          // how far the reading's sides have turned against each other since it began, radians
    float even[2][kMaxBins];       // each side's level at the peak when that turning began
    float aside[2][kMaxBins];      // each side's turn towards its own played note, while that is played: its partial's
    uint16_t lead[kMaxBins];       // the peak each bin turns with
  };

  static constexpr float kKnee = 0.75f;
  static constexpr float kLetGo = 0.8f;
  static constexpr float kBeat = 0.25f;
  static constexpr float kSame = 0.05f;
  static constexpr float kTwo = kit::kPi;
  static constexpr float kGone = 1.5f * kit::kPi;
  // A note at two pitches on the two sides is one steady partial on each:
  // how far apart the bins beside a side's peak may say that partial lies
  // (bins), how far a side's level may move while the sides go their half
  // turn (a ratio: 1 dB), and the most of that half turn one frame may
  // count for (so it takes four frames, a window's length, at the least).
  // And for how many hops a played partial must have been that before each
  // side of the cloud is kept apart from its own side of it (keep_apart()).
  static constexpr float kOne = 0.1f;
  static constexpr float kEven = 1.12f;
  static constexpr float kAtOnce = 0.25f * kit::kPi;
  static constexpr uint8_t kCalm = 3;
  static constexpr float kSharedBins = 0.1f;
  static constexpr float kFaint = 1.0e-4f;
  static constexpr float kSplitHz = 1000.0f;
  static constexpr float kShelfDb = 12.0f;
  static constexpr uint32_t kQuietLimit = 1u << 30;
  static constexpr uint32_t kNever = 0xFFFFFFFFu;

  static int size_of(float value) { return kit::clamp_int(static_cast<int>(value + 0.5f), 0, kSizes - 1); }

  // How far apart in pitch the two sides of a partial count as being, bins:
  // nothing up to kSame, where they are one pitch, and all of it from twice that.
  static float apart(float beat) {
    const float size = beat < 0.0f ? -beat : beat;
    if (size <= kSame) return 0.0f;
    if (size >= 2.0f * kSame) return beat;
    return beat < 0.0f ? 2.0f * (kSame - size) : 2.0f * (size - kSame);
  }

  // Whether a level is what it was, within kEven either way (and the same of a power).
  static bool even(float now, float then) { return now <= kEven * then && then <= kEven * now; }
  static bool even_power(float now, float then) {
    return now <= kEven * kEven * then && then <= kEven * kEven * now;
  }

  // Whether the three bins `down`, `here` and `up` read as one partial
  // under a Hann window. A partial `off` bins above the middle one reads
  // (1 + off) / (2 - off) of it in the bin above and (1 - off) / (2 + off) in
  // the bin below: each says where the partial lies, and for one partial the
  // two agree (within kOne bins). Two partials under one peak do not.
  static bool one_partial(float down, float here, float up) {
    if (!(here > 0.0f)) return false;
    const float by_up = (2.0f * up - here) / (up + here);
    const float by_down = (here - 2.0f * down) / (down + here);
    const float between = by_up - by_down;
    return between < kOne && between > -kOne;
  }

  // Whether a side of the reading holds one partial about peak p: looked at
  // about its own largest bin within two of the peak (a note at two pitches
  // on the two sides may lie a bin or two from the peak the sides share).
  static bool single(const float* side, int p, int half) {
    int at = p;
    const int from = p > 2 ? p - 2 : 1;
    const int to = p + 2 < half ? p + 2 : half - 1;
    for (int k = from; k <= to; ++k) {
      if (side[k] > side[at]) at = k;
    }
    return one_partial(side[at - 1], side[at], side[at + 1]);
  }

  // The same of a side of the input as kit::Stft last read it.
  bool single_now(int c, int p, int half) const {
    const float* re = now_re_[c];
    const float* im = now_im_[c];
    if (p < 4 || p + 3 > half) return false;
    float power[7];
    int at = 3;
    for (int k = 0; k < 7; ++k) {
      power[k] = re[p - 3 + k] * re[p - 3 + k] + im[p - 3 + k] * im[p - 3 + k];
      if (k >= 1 && k <= 5 && power[k] > power[at]) at = k;
    }
    return one_partial(std::sqrt(power[at - 1]), std::sqrt(power[at]), std::sqrt(power[at + 1]));
  }

  // The ceiling. What goes out is the played sound's share of the mix, as it
  // is, plus the cloud's; while the two together stay within kKnee nothing is
  // bent, and past it only what the cloud adds is, so that the cloud never
  // takes the output past full scale: the bending starts at kKnee, or at the
  // played sound if that stands higher already, and lands on full scale.
  // (Scattered phases stand higher over their level than the sound they were
  // read from, and at part-way Mix the cloud's peaks fall on the played
  // sound's: a sound played near full scale came out past it.) With no cloud
  // the played sound goes through untouched however loud it is.
  static float under_ceiling(float played, float cloud) {
    const float sum = played + cloud;
    const float size = sum < 0.0f ? -sum : sum;
    if (!(size > kKnee)) return sum;
    // How far the played sound stands the way the sum points, and where the bending starts.
    const float along = sum < 0.0f ? -played : played;
    const float from = along > kKnee ? along : kKnee;
    const float over = size - from;
    if (!(over > 0.0f)) return sum;  // the cloud pulls the sum in: nothing to hold back
    const float room = 1.0f - from;
    if (!(room > 0.0f)) return played;  // the played sound is past full scale alone
    const float bent = from + room * kit::fast_tanh(over / room);
    return sum < 0.0f ? -bent : bent;
  }

  // Whether the device still has something to say without new input.
  bool alive() const {
    if (leaving_ >= 0) return true;
    for (int s = 0; s < kSizes; ++s) {
      if (drain_[s] > 0) return true;
    }
    if (frozen_) return sound_[set_][0] || sound_[set_][1] || !ready_[set_];
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
    ready_[set_] = false;
    dressed_[set_] = kNever;
    for (int c = 0; c < 2; ++c) {
      sound_[set_][c] = false;
      shaped_[set_][c] = false;
      fetched_[c] = false;
    }
    strong_count_ = 0;
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

  // The first part of a frame, one side at a time: the window the reader
  // stands on, transformed, as magnitudes and phases in read_. (A frozen
  // frame has none, unless nothing was read at this size yet.)
  void fetch(int c) {
    fetched_[c] = false;
    if (plan_ == kSilent) return;
    if (plan_ == kHeld && ready_[set_]) return;
    spectrum_of(c, whole_);
    const int frame = kFrames[size_];
    const int half = frame >> 1;
    float* magnitude = read_magnitude_[c];
    float* angle = read_angle_[c];
    for (int k = 0; k <= half; ++k) {
      const float re = spectrum_[k];
      const float im = (k == 0 || k == half) ? 0.0f : spectrum_[frame - k];
      float size;
      kit::to_polar(re, im, &size, &angle[k]);
      magnitude[k] = size < kFloor ? 0.0f : size;
    }
    fetched_[c] = true;
  }

  // The second part, for both sides at once: the partials of the frame and
  // how far each is turned from its reading, carried on from the frame
  // before.
  void track() {
    const bool fetched = fetched_[0] && fetched_[1];
    fetched_[0] = false;
    fetched_[1] = false;
    switch (plan_) {
      case kHeld:
        if (ready_[set_]) {
          hold(set_, frame_number_, walk_);
          return;
        }
        if (fetched) {
          measure(false, 1, 1.0f);
          return;
        }
        break;
      case kFresh:
        if (fetched) {
          measure(false, 1, 1.0f);
          return;
        }
        break;
      case kCoherent:
        if (fetched) {
          measure(true, step_, ratio_);
          return;
        }
        break;
      case kSilent:
        break;
    }
    ready_[set_] = false;
    sound_[set_][0] = false;
    sound_[set_][1] = false;
    strong_count_ = 0;
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

  // The random source of frame `number`: one for both sides.
  static void seed(kit::Rng* shared, uint32_t salt, uint32_t number) {
    shared->seed((0x9E3779B9u + salt) ^ (number * 2654435761u));
    for (int warm = 0; warm < 4; ++warm) shared->next_u32();
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

  // The reading in read_ becomes the frame: its partials, and how far each
  // is turned from its reading (spin), which is one angle for both sides.
  // `follows` says the last reading was `step` samples before this one
  // (ratio = hop / step), so each partial's frequency is measured from how
  // far its phase turned between the two; otherwise it is read from the
  // shape of its peak. With no frame before (the first after silence or at a
  // new size) nothing is turned: the phases are as read.
  void measure(bool follows, int step, float ratio) {
    const int frame = kFrames[size_];
    const int half = frame >> 1;
    Kept& kept = kept_[set_];
    const float* left = read_magnitude_[0];
    const float* right = read_magnitude_[1];
    float* power = power_;
    const bool carried = ready_[set_];
    // The first frame of a new Window, while the old one still sounds.
    const bool joins = !carried && leaving_ >= 0 && ready_[set_ ^ 1] && (sound_[set_ ^ 1][0] || sound_[set_ ^ 1][1]);
    number_[set_] = frame_number_;
    float top = 0.0f;
    float tops[2] = {0.0f, 0.0f};
    for (int k = 0; k <= half; ++k) {
      // A partial is looked for in the two sides together.
      power[k] = left[k] * left[k] + right[k] * right[k];
      if (power[k] > top) top = power[k];
      if (left[k] > tops[0]) tops[0] = left[k];
      if (right[k] > tops[1]) tops[1] = right[k];
    }
    sound_[set_][0] = tops[0] > 0.0f;
    sound_[set_][1] = tops[1] > 0.0f;
    ready_[set_] = true;

    // The peaks: bins above their two neighbours on either side. The
    // stronger ones are the partials kept apart from the input.
    int peaks = 0;
    int strong = 0;
    const float least = kStrongShare * kStrongShare * top;
    for (int k = 1; k < half; ++k) {
      const float m = power[k];
      if (m > 0.0f && m > power[k - 1] && m >= power[k + 1] && (k < 2 || m > power[k - 2]) &&
          (k + 2 > half || m >= power[k + 2])) {
        peaks_[peaks++] = static_cast<uint16_t>(k);
        if (m >= least && strong < kStrong) strong_[strong++] = static_cast<uint16_t>(k);
      }
    }
    strong_count_ = strong;
    if (peaks == 0) {
      for (int k = 0; k <= half; ++k) {
        kept.spin[k] = 0.0f;
        kept.own[0][k] = 0.0f;
        kept.own[1][k] = 0.0f;
        kept.beat[k] = 0.0f;
        kept.gone[k] = 0.0f;
        kept.even[0][k] = 0.0f;
        kept.even[1][k] = 0.0f;
        kept.turn[k] = kit::kHalfPi * static_cast<float>(k & 3);
        kept.lead[k] = static_cast<uint16_t>(k);
      }
      keep_reading(half);
      return;
    }
    kit::Rng shared;
    seed(&shared, 0x1000u, frame_number_);
    const float turns_to_radians = kit::kTwoPi / static_cast<float>(frame);
    const float walk = fading_ ? 0.0f : walk_;
    int from = 0;
    int next_strong = 0;
    for (int i = 0; i < peaks; ++i) {
      const int p = peaks_[i];
      const int to = i + 1 < peaks ? (p + peaks_[i + 1] + 1) >> 1 : half + 1;
      // One partial's wander for this frame, in radians.
      const float drift = shared.bipolar() * walk;
      // A partial goes on from the frame before where there was one: a peak
      // that stands kOnset times above what its bin held then (or where it
      // held nothing, or nothing on the side it is on now) is a note
      // beginning, and starts with the phases it is read with.
      float before = 0.0f;
      float weight[2] = {0.0f, 0.0f};
      if (carried) {
        before = kept.magnitude[0][p] * kept.magnitude[0][p] + kept.magnitude[1][p] * kept.magnitude[1][p];
        weight[0] = left[p] * kept.magnitude[0][p];
        weight[1] = right[p] * kept.magnitude[1][p];
      }
      const bool goes_on = before * (kOnset * kOnset) >= power[p] && weight[0] + weight[1] > 0.0f;
      // How far the partial's phase turned since the last reading, beyond
      // the bin's own share of `step` samples: each side's reading, weighed
      // by how much of the partial that side holds.
      float share = 0.0f;
      float turned = 0.0f;
      float on_left = 0.0f;
      float on_right = 0.0f;
      if (goes_on) {
        if (follows) share = turns_to_radians * static_cast<float>((p * step) & (frame - 1));
        on_left = kit::princarg(read_angle_[0][p] - kept.angle[0][p] - share);
        on_right = kit::princarg(read_angle_[1][p] - kept.angle[1][p] - share);
        turned = on_left;
        if (on_right != on_left && weight[1] > 0.0f) {
          turned = weight[0] > 0.0f
                       ? on_left + kit::princarg(on_right - on_left) * weight[1] / (weight[0] + weight[1])
                       : on_right;
        }
      }
      // How far the partial lies from its peak's centre, in bins.
      float off;
      if (follows && goes_on) {
        off = turned * ratio * (2.0f / kit::kPi);
      } else {
        // Under a Hann window a partial `off` bins above its peak's centre
        // reads (1 + off) / (2 - off) of the peak in the bin above: each
        // side's reading by itself (a note that stands at two pitches on the
        // two sides is two partials under one peak, and one of them may lie
        // past the next bin's edge: up to a bin away), weighed by its power.
        float lies[2] = {0.0f, 0.0f};
        float shares[2] = {0.0f, 0.0f};
        for (int c = 0; c < 2; ++c) {
          const float* side = read_magnitude_[c];
          if (!(side[p] > 0.0f)) continue;
          const float up = side[p + 1];
          const float down = side[p - 1];
          const float beside = (up >= down ? up : down) / side[p];
          lies[c] = kit::clamp((2.0f * beside - 1.0f) / (beside + 1.0f), -0.5f, 1.0f);
          if (down > up) lies[c] = -lies[c];
          shares[c] = side[p] * side[p];
        }
        // (One side alone, or two that agree, to the bit.)
        if (!(shares[1] > 0.0f) || (shares[0] > 0.0f && lies[0] == lies[1])) {
          off = lies[0];
        } else if (!(shares[0] > 0.0f)) {
          off = lies[1];
        } else {
          off = (lies[0] * shares[0] + lies[1] * shares[1]) / (shares[0] + shares[1]);
        }
      }
      // A hop of the partial's own frequency: a quarter turn a bin.
      const float advance = kit::kHalfPi * (static_cast<float>(p & 3) + off);
      float spin = 0.0f;
      float beat = 0.0f;
      float gone = 0.0f;
      bool two = false;
      float own[2] = {0.0f, 0.0f};
      float aside[2] = {0.0f, 0.0f};  // how far each side's pitch lies from the one they share, bins
      float level[2] = {left[p], right[p]};
      if (goes_on) {
        // Its phase goes on by a hop of its own frequency from where it was
        // resynthesised; the reading has moved on by `turned` and the share.
        spin = kit::princarg(kept.spin[p] - turned - share + advance + drift);
        // The reading has also turned each side by itself, away from what
        // the two turned together. Where the sides hold the partial at two
        // pitches (a chorused or detuned stereo source) that goes into the
        // side's own turn, so the angle between the sides stays where it
        // was however the reader moves, and each side goes on at its own
        // pitch (more than kSame bins apart), a quarter turn a bin a hop
        // either way from the pitch they share.
        const float both = weight[0] + weight[1];
        if (weight[0] > kFaint * both && weight[1] > kFaint * both) {
          const float between = kit::princarg(on_right - on_left);
          beat = kept.beat[p];
          gone = kept.gone[p];
          if (follows) {
            beat += kBeat * (between * ratio * (2.0f / kit::kPi) - beat);
            gone = kit::clamp(gone + kit::clamp(between, -kAtOnce, kAtOnce), -kGone, kGone);
          }
          // Two pitches only once the sides have gone half a turn against
          // each other: partials of notes at different places between the
          // sides, under one peak, sway against each other and come back.
          // And only as one note would: two notes at two places whose
          // partials share the peak, each the stronger on one side, go round
          // against each other as well, but then a side is two partials
          // (its peak is not one partial's shape) or its level rises and
          // falls as they go round. Either starts the count again: the
          // shape always (unless the note is heard to be one as it is
          // played: a note's beginning is read for many frames, and its
          // shape is not one steady partial's), the level until the half
          // turn is reached.
          const bool was_two = kept.gone[p] >= kTwo || kept.gone[p] <= -kTwo;
          if (!(single(left, p, half) && single(right, p, half)) && !heard_two(p)) gone = 0.0f;
          if (!was_two && !(even(left[p], kept.even[0][p]) && even(right[p], kept.even[1][p]))) gone = 0.0f;
          if (gone != 0.0f) {
            level[0] = kept.even[0][p];
            level[1] = kept.even[1][p];
          }
          two = gone >= kTwo || gone <= -kTwo;
          // (Otherwise the angle between the sides is the reading's own: a
          // sway is played back as it was read.)
          own[0] = kept.own[0][p];
          own[1] = kept.own[1][p];
          if (two) {
            const float split = apart(beat);
            aside[0] = -split * weight[1] / both;
            aside[1] = split * weight[0] / both;
            own[0] = kit::princarg(own[0] + between * weight[1] / both + kit::kHalfPi * aside[0]);
            own[1] = kit::princarg(own[1] - between * weight[0] / both + kit::kHalfPi * aside[1]);
          }
        }
      } else if (joins) {
        // Each side starts in step with the old Window's: the stronger side by the spin, the other by its own turn.
        const int c = right[p] > left[p] ? 1 : 0;
        spin = kit::princarg(joined(c, p, off, read_angle_[c][p]) - read_angle_[c][p]);
        const float* other = c == 0 ? right : left;
        if (other[p] > 0.0f) {
          own[c ^ 1] = kit::princarg(joined(c ^ 1, p, off, read_angle_[c ^ 1][p] + spin) - read_angle_[c ^ 1][p] - spin);
        }
      }
      // Each side's own pitch, for the stronger partials (keep_apart()).
      if (next_strong < strong && strong_[next_strong] == p) {
        lone_[0][next_strong] = off + aside[0];
        lone_[1][next_strong] = off + aside[1];
        two_[next_strong] = two;
        ++next_strong;
      }
      for (int k = from; k < to; ++k) {
        kept.spin[k] = spin;
        kept.own[0][k] = own[0];
        kept.own[1][k] = own[1];
        kept.beat[k] = beat;
        kept.gone[k] = gone;
        kept.even[0][k] = level[0];
        kept.even[1][k] = level[1];
        kept.turn[k] = advance;
        kept.lead[k] = static_cast<uint16_t>(p);
      }
      // A note beginning has no turn of its own on either side yet.
      if (!goes_on && aside_[set_]) {
        for (int k = from; k < to; ++k) {
          kept.aside[0][k] = 0.0f;
          kept.aside[1][k] = 0.0f;
        }
      }
      from = to;
    }
    keep_reading(half);
  }

  // The reading becomes the frame's own: each side's magnitudes and phases.
  void keep_reading(int half) {
    Kept& kept = kept_[set_];
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k <= half; ++k) {
        kept.magnitude[c][k] = read_magnitude_[c][k];
        kept.angle[c][k] = read_angle_[c][k];
      }
    }
  }

  // The phase side c's peak in bin p (the partial `off` bins above its
  // centre) of the new Window's first frame is to sound with, so that it
  // starts in step with the same partial in the frame the old Window still
  // holds: that partial's phase at its frame's first sample, carried on at
  // its own frequency to this frame's first sample. (A peak's phase lies
  // half a turn a bin ahead of its partial's, the Hann window being centred
  // on the frame.) `as_read` where the old frame has no such partial.
  float joined(int c, int p, float off, float as_read) const {
    const int old = set_ ^ 1;
    const Kept& left = kept_[old];
    const int old_frame = kFrames[leaving_];
    const int new_frame = kFrames[size_];
    const float at = (static_cast<float>(p) + off) * static_cast<float>(old_frame) / static_cast<float>(new_frame);
    const int k = static_cast<int>(at + 0.5f);
    if (k < 1 || k >= (old_frame >> 1)) return as_read;
    const int lead = left.lead[k];
    if (!(left.magnitude[c][lead] > 0.0f)) return as_read;
    const float lead_off =
        kit::princarg(left.turn[lead] - kit::kHalfPi * static_cast<float>(lead & 3)) * (2.0f / kit::kPi);
    if (std::fabs(static_cast<float>(lead) + lead_off - at) > 0.5f) return as_read;
    const uint32_t old_hop = static_cast<uint32_t>(old_frame >> 2);
    const uint32_t new_hop = static_cast<uint32_t>(new_frame >> 2);
    const int32_t apart = static_cast<int32_t>(new_hop * frame_number_ + (new_hop >> 1) -
                                               (old_hop * number_[old] + (old_hop >> 1)));
    const double cycles = (static_cast<double>(lead) + lead_off) * apart / old_frame;
    const float turned = kit::kTwoPi * static_cast<float>(cycles - std::floor(cycles));
    return kit::princarg(left.spin[lead] + left.own[c][lead] + left.angle[c][lead] - kit::kPi * lead_off + turned +
                         kit::kPi * off);
  }

  // A held frame: the readings stay, and every partial goes on turning at
  // its own frequency (and wandering), its bins together, both sides alike.
  void hold(int set, uint32_t number, float walk) {
    Kept& kept = kept_[set];
    const int half = kFrames[set == set_ ? size_ : leaving_] >> 1;
    kit::Rng shared;
    seed(&shared, 0x1000u, number);
    int k = 0;
    while (k <= half) {
      const uint16_t partial = kept.lead[k];
      const float step = kept.turn[k] + shared.bipolar() * walk;
      // (Each side at its own pitch where the two differ: the reading stands still, so all of it.)
      const float more = kept.gone[k] >= kTwo || kept.gone[k] <= -kTwo ? apart(kept.beat[k]) : 0.0f;
      float aside[2] = {0.0f, 0.0f};
      if (more != 0.0f) {
        const float on_left = kept.magnitude[0][partial] * kept.magnitude[0][partial];
        const float on_right = kept.magnitude[1][partial] * kept.magnitude[1][partial];
        if (on_left + on_right > 0.0f) {
          aside[0] = -kit::kHalfPi * more * on_right / (on_left + on_right);
          aside[1] = kit::kHalfPi * more * on_left / (on_left + on_right);
        }
      }
      for (; k <= half && kept.lead[k] == partial; ++k) {
        kept.spin[k] = kit::princarg(kept.spin[k] + step);
        if (more != 0.0f) {
          kept.own[0][k] = kit::princarg(kept.own[0][k] + aside[0]);
          kept.own[1][k] = kit::princarg(kept.own[1][k] + aside[1]);
        }
      }
    }
    number_[set] = number;
  }

  // Where a partial `turn` a hop (a quarter turn a bin) in bin p lies along
  // the pattern Width leans the sides by, in turns: place_ is laid out over
  // the longest frame's bins, and a shorter frame reads every `stride`th.
  float place_of(int p, float turn, int stride) const {
    const float off = kit::princarg(turn - kit::kHalfPi * static_cast<float>(p & 3)) * (2.0f / kit::kPi);
    float at = (static_cast<float>(p) + off) * static_cast<float>(stride);
    at = kit::clamp(at, 0.0f, static_cast<float>(kMaxBins - 2));
    const int whole = static_cast<int>(at);
    return place_[whole] + (at - static_cast<float>(whole)) * (place_[whole + 1] - place_[whole]);
  }

  // The pattern itself, -1 to 1 at `turns` along it: a sine bent twice, so
  // that it stands near one end or the other most of the way.
  static float sway(float turns) {
    float cosine, sine;
    kit::from_polar(1.0f, kit::kTwoPi * turns, &cosine, &sine);
    return kit::quarter_sine(kit::kHalfPi * kit::quarter_sine(kit::kHalfPi * sine));
  }

  // What frame `number` of the set wears besides its partials' own phases:
  // every bin's random angle for this frame (Diffuse), and how far each
  // partial leans to one side (Width).
  void dress(int set, int frame, uint32_t number) {
    Kept& kept = kept_[set];
    const int half = frame >> 1;
    dressed_[set] = number;
    scattered_[set] = scatter_ > 0.0f;
    if (scattered_[set]) {
      kit::Rng shared;
      seed(&shared, 0x2000u, number);
      const float reach = scatter_ * kit::kPi;
      for (int k = 0; k <= half; ++k) kept.scatter[k] = shared.bipolar() * reach;
    }
    const float width = param(stretch::kWidth);
    leaning_[set] = width > 0.0f;
    if (!leaning_[set]) return;
    // The pattern drifts along the frequencies by the sample clock.
    const double drifted = static_cast<double>(number) * (frame >> 2) / sample_rate() * kLeanDrift;
    const float base = static_cast<float>(drifted - std::floor(drifted));
    const float depth = 0.5f * kWidest * width;
    const int stride = kMaxFrame / frame;
    int k = 0;
    while (k <= half) {
      const uint16_t partial = kept.lead[k];
      // A partial leans by as much as it stands on both sides: one that is
      // on one side only has nothing to lean against and stays as it is.
      const float left = kept.magnitude[0][partial];
      const float right = kept.magnitude[1][partial];
      const float both = left * left + right * right;
      float lean = 0.0f;
      if (both > 0.0f) {
        lean = depth * (2.0f * left * right / both) * sway(place_of(partial, kept.turn[partial], stride) - base);
      }
      for (; k <= half && kept.lead[k] == partial; ++k) kept.lean[k] = lean;
    }
  }

  // The third part, once for both sides: the frame is dressed, and its
  // stronger partials are turned away from the note being played.
  void prepare() {
    if (!ready_[set_] || !(sound_[set_][0] || sound_[set_][1])) return;
    if (fading_ && fade_at(size_, frame_number_) >= 1.0f) fading_ = false;
    dress(set_, kFrames[size_], frame_number_);
    // (Not while two sizes cross: the new one's partials stay in step with the old one's.)
    if (!fading_) hear_two();
    if (apart_ && !fading_) {
      keep_apart();
    } else {
      let_go(set_, kFrames[size_] >> 1);
    }
  }

  // Each side's own turn dies away, a fifth a frame: it is only there while
  // the note it follows is played (keep_apart() writes it again after this).
  void let_go(int set, int half) {
    if (!aside_[set]) return;
    Kept& kept = kept_[set];
    float most = 0.0f;
    for (int c = 0; c < 2; ++c) {
      float* aside = kept.aside[c];
      for (int k = 0; k <= half; ++k) {
        const float less = kLetGo * aside[k];
        const float size = less < 0.0f ? -less : less;
        aside[k] = size > 1.0e-4f ? less : 0.0f;
        if (size > most) most = size;
      }
    }
    aside_[set] = most > 1.0e-4f;
  }

  // The last part, for one side: every bin as it will sound. While a Window
  // change is being played out the new size's frames come in under the old
  // one's.
  void shape(int c) {
    float level = 1.0f;
    if (fading_) {
      const float along = fade_at(size_, frame_number_);
      level = (1.0f - scatter_) * along + scatter_ * std::sin(kit::kHalfPi * along);
    }
    shape_into(set_, c, kFrames[size_], level);
  }

  // The size that was left: its last frame held, turned on by a hop and
  // faded out, until the crossfade is over and its frames in flight have
  // played out. `c` is the side whose frame is due next.
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
    if (!ready_[set] || !sound_[set][c]) {
      shaped_[set][c] = false;
      return;
    }
    // A frame that was read for this number when the change came goes out as it is.
    // Otherwise it turns on without wandering, so the new size stays in step with it.
    if (number_[set] != number) hold(set, number, 0.0f);
    if (dressed_[set] != number) dress(set, frame, number);
    // Scattered, the two sizes have nothing to do with each other and cross
    // at equal power; pure, the new one's partials start in step with the
    // old one's (joined()) and the two cross on a straight line.
    shape_into(set, c, frame, (1.0f - scatter_) * (1.0f - along) + scatter_ * std::cos(kit::kHalfPi * along));
  }

  // Side c of the frame in `set` as it is handed to kit::Stft: each bin's
  // own magnitude and phase as read, turned by the spin both sides share,
  // by the frame's random angle, and half of Width's lean, the left side
  // one way and the right side the other. The angle between the two sides
  // of a partial is therefore what was played plus that lean, and no more.
  void shape_into(int set, int c, int frame, float level) {
    shaped_[set][c] = ready_[set] && sound_[set][c] && level > 0.0f;
    if (!shaped_[set][c]) return;
    const int half = frame >> 1;
    const Kept& kept = kept_[set];
    const float* magnitude = kept.magnitude[c];
    const float* angle = kept.angle[c];
    float* re = out_re_[set][c];
    float* im = out_im_[set][c];
    const bool scattered = scattered_[set];
    const bool leaning = leaning_[set];
    const bool turned = aside_[set];
    const float* aside = kept.aside[c];
    const float* own = kept.own[c];
    // (The magnitudes are raised by what random phase costs.)
    const float gain = scattered ? gain_ * level : level;
    const float side = c == 0 ? -1.0f : 1.0f;
    for (int k = 0; k <= half; ++k) {
      float phase = kept.spin[k] + own[k] + angle[k];
      if (scattered) phase += kept.scatter[k];
      if (leaning) phase += side * kept.lean[k];
      if (turned) phase += aside[k];
      kit::from_polar(magnitude[k] * gain, phase, &re[k], &im[k]);
    }
  }

  // Whether the partial being played in bin p is heard to stand at two
  // pitches on the two sides (hear_two()).
  bool heard_two(int p) const {
    const uint32_t before = frame_number_ - 1;
    return now_good_[0][p] == before && now_good_[1][p] == before &&
           (now_gone_[p] >= kTwo || now_gone_[p] <= -kTwo);
  }

  // A note played at two pitches on the two sides shows it in the input hop
  // by hop, where the reader sees it 1/Stretch as fast: once a played
  // partial's sides have gone half a turn against each other (one steady
  // partial on each side meanwhile, as in measure()), the same partial in
  // the cloud (the same pitch, its sides drifting apart the same way) is
  // taken to stand at two pitches as well, as far apart as the played one
  // where the reading still says less (while a note begins it does). Where
  // the cloud's sides are too near one pitch to be split, each side of it
  // is still kept apart from its own side of the played note.
  void hear_two() {
    Kept& kept = kept_[set_];
    const int half = kFrames[size_] >> 1;
    const uint32_t before = frame_number_ - 1;
    for (int i = 0; i < strong_count_; ++i) {
      const int p = strong_[i];
      if (now_good_[0][p] != before || now_good_[1][p] != before) continue;
      const float left = now_re_[0][p] * now_re_[0][p] + now_im_[0][p] * now_im_[0][p];
      const float right = now_re_[1][p] * now_re_[1][p] + now_im_[1][p] * now_im_[1][p];
      const float played = left + right;
      if (!(left > kFaint * played && right > kFaint * played)) continue;
      // (One steady partial on either side, as in measure().)
      if (!(single_now(0, p, half) && single_now(1, p, half))) {
        now_gone_[p] = 0.0f;
        now_calm_[p] = 0;
        continue;
      }
      const bool was_two = now_gone_[p] >= kTwo || now_gone_[p] <= -kTwo;
      if (!was_two && !(even_power(left, now_even_[0][p]) && even_power(right, now_even_[1][p]))) {
        now_gone_[p] = 0.0f;
        now_calm_[p] = 0;
      } else if (now_calm_[p] < kCalm) {
        ++now_calm_[p];
      }
      if (now_gone_[p] == 0.0f) {
        now_even_[0][p] = left;
        now_even_[1][p] = right;
      }
      const float live = now_off_[1][p] - now_off_[0][p];
      const float more = kit::clamp(kit::princarg(kit::kHalfPi * live), -kAtOnce, kAtOnce);
      now_gone_[p] = kit::clamp(now_gone_[p] + more, -kGone, kGone);
      if (two_[i] || (now_gone_[p] < kTwo && now_gone_[p] > -kTwo)) continue;
      const float beat = kept.beat[p];
      const float own = kit::princarg(kept.turn[p] - kit::kHalfPi * static_cast<float>(p & 3)) * (2.0f / kit::kPi);
      const float shared = (now_off_[0][p] * left + now_off_[1][p] * right) / played;
      if (std::fabs(own - shared) > kSharedBins + 0.25f * std::fabs(live)) continue;
      if (!(std::fabs(beat) > kSame)) {
        // (For this frame only: keep_apart() then turns each side by itself.)
        two_[i] = true;
        continue;
      }
      if (!(beat * now_gone_[p] > 0.0f)) continue;
      const float all = now_gone_[p] > 0.0f ? kGone : -kGone;
      const bool seed = std::fabs(live) < 2.0f && std::fabs(live) > std::fabs(beat);
      for (int k = p; k >= 0 && kept.lead[k] == p; --k) {
        kept.gone[k] = all;
        if (seed) kept.beat[k] = live;
      }
      for (int k = p + 1; k <= half && kept.lead[k] == p; ++k) {
        kept.gone[k] = all;
        if (seed) kept.beat[k] = live;
      }
      two_[i] = true;
    }
  }

  // Keeps the cloud apart from the note being played. For each stronger
  // partial of the frame: the same three bins of the input as kit::Stft
  // last read them on either side, carried on to where this frame will
  // sound (11/8 of a frame after that reading began, at the played
  // partial's own frequency), and the partial turned as a whole, on both
  // sides alike, so that cloud and input are a quarter turn apart. Over the
  // frame they then add as power: the cloud neither doubles the note nor
  // cancels it. Fully diffuse a frame's phases are free and it is turned
  // all the way, for this frame only; otherwise only a partial within near_
  // bins of the played one is turned, by kPull at most, and its phase goes
  // on from where it was turned to.
  void keep_apart() {
    Kept& kept = kept_[set_];
    const int half = kFrames[size_] >> 1;
    const uint32_t before = frame_number_ - 1;
    const bool free = scatter_ >= 0.999f;
    const float limit = kPull + scatter_ * (kit::kHalfPi - kPull);
    const bool scattered = scattered_[set_];
    const bool turned = aside_[set_];
    // How loud the played note and the cloud each come out of the mix (as powers).
    float dry_share, wet_share;
    kit::equal_power(param(stretch::kMix), &dry_share, &wet_share);
    dry_share *= dry_share;
    wet_share *= scattered ? gain_ : 1.0f;
    wet_share *= wet_share;
    // Each side's own turn where its note is played, written once the rest is let go.
    float own_turn[2][kStrong];
    bool has_turn[2][kStrong];
    for (int i = 0; i < strong_count_; ++i) {
      has_turn[0][i] = false;
      has_turn[1][i] = false;
      const int p = strong_[i];
      // The side that holds more of the played partial says where it lies.
      float played = 0.0f;
      float heard[2] = {-1.0f, -1.0f};
      int main = -1;
      for (int c = 0; c < 2; ++c) {
        if (now_good_[c][p] != before) continue;
        heard[c] = now_re_[c][p] * now_re_[c][p] + now_im_[c][p] * now_im_[c][p];
        played += heard[c];
        if (main < 0 || heard[c] > heard[main]) main = c;
      }
      if (main < 0) continue;
      const float off = now_off_[main][p];
      const float own = kit::princarg(kept.turn[p] - kit::kHalfPi * static_cast<float>(p & 3)) * (2.0f / kit::kPi);
      // Is it the same note? The partial as both sides turn it, and each
      // side's share of it by its own frequency (a note that stands at two
      // pitches on the two sides is one partial here and two there).
      const bool near = free || !(std::fabs(own - off) > near_);
      bool side_near[2];
      for (int c = 0; c < 2; ++c) {
        // (A side whose partial lies bins away under the other's peak is read by its skirt, where
        // its turn a hop is known to a whole turn, four bins, only.)
        float away = lone_[c][i] - now_off_[c][p];
        away -= 4.0f * std::floor(0.25f * away + 0.5f);
        side_near[c] = heard[c] > 0.0f && (free || !(std::fabs(away) > near_));
      }
      if (!near && !side_near[0] && !side_near[1]) continue;
      // Only where the played partial is at least a tenth of the cloud's.
      const float cloud = kept.magnitude[0][p] * kept.magnitude[0][p] + kept.magnitude[1][p] * kept.magnitude[1][p];
      if (played < 0.01f * cloud) continue;
      // A quarter turn from the played note is where the two add as power,
      // and Width leans the sides either way from there: one side would
      // take the note up and the other down, most when cloud and note are
      // as loud as each other. So such a partial leans less, by how alike
      // the two are in level, and each side keeps its level too.
      if (leaning_[set_]) {
        const float note = played * dry_share;
        const float mist = cloud * wet_share;
        const float ease = 1.0f - 2.0f * std::sqrt(note * mist) / (note + mist);
        for (int k = p; k >= 0 && kept.lead[k] == p; --k) kept.lean[k] *= ease;
        for (int k = p + 1; k <= half && kept.lead[k] == p; ++k) kept.lean[k] *= ease;
      }
      // The cloud's partial against the played one, side by side: the
      // peak's three bins, or for a note at two pitches the three about
      // where that side's note lies (a bin or two up or down from the peak
      // where the sides stand that far apart).
      float across[2][2] = {{0.0f, 0.0f}, {0.0f, 0.0f}};
      for (int c = 0; c < 2; ++c) {
        if (heard[c] < 0.0f) continue;
        const float* now_re = now_re_[c];
        const float* now_im = now_im_[c];
        const int centre = two_[i] ? p + static_cast<int>(std::floor(kit::clamp(lone_[c][i], -2.0f, 2.0f) + 0.5f)) : p;
        for (int k = centre - 1; k <= centre + 1; ++k) {
          if (k < 1 || k >= half || kept.lead[k] != p) continue;
          float phase = kept.spin[k] + kept.own[c][k] + kept.angle[c][k];
          if (scattered) phase += kept.scatter[k];
          if (turned) phase += kept.aside[c][k];
          float re, im;
          kit::from_polar(kept.magnitude[c][k], phase, &re, &im);
          across[c][0] += re * now_re[k] + im * now_im[k];
          across[c][1] += im * now_re[k] - re * now_im[k];
        }
      }
      const float fixed = 0.25f * kit::kPi * static_cast<float>((11 * p) & 7);
      const float carried = fixed + 2.75f * kit::kPi * off;
      // (Where the played note stands at two pitches on the two sides, each
      // side's is carried on at its own: the other side's as far as it
      // falls behind the leading one's by then.)
      const int other = main ^ 1;
      if (heard[other] >= 0.0f && now_off_[other][p] != off) {
        float re, im;
        kit::from_polar(1.0f, 2.75f * kit::kPi * (off - now_off_[other][p]), &re, &im);
        const float was_re = across[other][0];
        const float was_im = across[other][1];
        across[other][0] = was_re * re - was_im * im;
        across[other][1] = was_im * re + was_re * im;
      }
      const float angle =
          kit::princarg(kit::fast_atan2(across[0][1] + across[1][1], across[0][0] + across[1][0]) - carried);
      // Both sides together, by one angle: where that leaves them is where each side is to stand.
      float turn = 0.0f;
      float aim;
      if (near) {
        turn = angle >= 0.0f ? kit::kHalfPi - angle : -kit::kHalfPi - angle;
        turn = kit::clamp(turn, -limit, limit);
        aim = angle + turn;
        int k = p - kReach > 1 ? p - kReach : 1;
        const int end = p + kReach < half - 1 ? p + kReach : half - 1;
        for (; k <= end; ++k) {
          if (kept.lead[k] != p) continue;
          if (free) {
            kept.scatter[k] += turn;
          } else {
            kept.spin[k] = kit::princarg(kept.spin[k] + turn);
          }
        }
      } else {
        // The two sides are too far apart in pitch to be turned as one: the
        // side that holds more of the note says which way the quarter turn lies.
        const float lead_angle = kit::princarg(kit::fast_atan2(across[main][1], across[main][0]) - carried);
        aim = lead_angle >= 0.0f ? kit::kHalfPi : -kit::kHalfPi;
      }
      // Then each side by itself the rest of the way, where its own share
      // of the note is being played (one steady partial on either side for
      // kCalm hops, or a note at two pitches), and no further a frame than
      // the partial may be pulled.
      for (int c = 0; c < 2; ++c) {
        if (!side_near[c] || !(two_[i] || (!free && now_calm_[p] >= kCalm))) continue;
        const float mine = kept.magnitude[c][p] * kept.magnitude[c][p];
        if (!(mine > 0.0f) || heard[c] < 0.01f * mine) continue;
        // (Both sides' partials now stand as the leading side's is carried.)
        const float here = kit::princarg(kit::fast_atan2(across[c][1], across[c][0]) - carried) + turn;
        float need = kit::princarg(aim - here);
        if (!free) {
          need = kit::clamp(need, -limit, limit);
        }
        own_turn[c][i] = kit::princarg((turned ? kept.aside[c][p] : 0.0f) + need);
        has_turn[c][i] = true;
      }
    }
    let_go(set_, half);
    for (int i = 0; i < strong_count_; ++i) {
      const int p = strong_[i];
      for (int c = 0; c < 2; ++c) {
        if (!has_turn[c][i]) continue;
        float value = own_turn[c][i];
        if (std::fabs(value) > 1.0e-4f) {
          aside_[set_] = true;
        } else {
          value = 0.0f;
        }
        int k = p - kReach > 1 ? p - kReach : 1;
        const int end = p + kReach < half - 1 ? p + kReach : half - 1;
        for (; k <= end; ++k) {
          if (kept.lead[k] == p) kept.aside[c][k] = value;
        }
      }
    }
  }

  // kit::Stft's callback for side c of the size in use: the frame it
  // analysed is the input as it is played, of which the stronger partials'
  // bins are kept for keep_apart(), and the reader's frame goes in its place.
  void hand_over(int c, float* re, float* im, uint32_t number) {
    float* now_re = now_re_[c];
    float* now_im = now_im_[c];
    for (int i = 0; i < strong_count_; ++i) {
      const int p = strong_[i];
      // (Three bins either way: a side's note may lie two bins from the peak the two sides share.)
      const int half = kFrames[size_] >> 1;
      for (int k = p > 3 ? p - 3 : 0; k <= p + 3 && k <= half; ++k) {
        now_re[k] = re[k];
        now_im[k] = im[k];
      }
      // How far the played partial lies from the bin's centre, in bins, from
      // how far its phase turned since the frame before.
      const float phase = kit::fast_atan2(im[p], re[p]);
      if (c == 0 && !(number != 0 && now_stamp_[c][p] == number - 1)) {
        now_gone_[p] = 0.0f;
        now_calm_[p] = 0;
      }
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

  // The frame shaped for side c in `set`, into kit::Stft's bins; silence
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
  float power_[kMaxBins];      // scratch: the reading's power, both sides together
  float place_[kMaxBins];      // where each bin of the longest frame lies along Width's pattern, turns
  uint16_t peaks_[kMaxBins / 2 + 1];
  // One reading of each side, as magnitudes and phases, until track() takes it.
  float read_magnitude_[2][kMaxBins];
  float read_angle_[2][kMaxBins];
  bool fetched_[2] = {false, false};  // read_ holds this side's window
  // Two sets of bins: the size in use works in kept_[set_], and the size a
  // Window change left holds its last frame in the other while it fades.
  Kept kept_[2];
  float out_re_[2][2][kMaxBins];  // a frame as it is handed to kit::Stft, by set and side
  float out_im_[2][2][kMaxBins];
  bool ready_[2] = {};        // a frame of this size has been read
  bool sound_[2][2] = {};     // any bin of that side of it above the floor
  bool shaped_[2][2] = {};    // out_re_ and out_im_ hold that side of it
  bool scattered_[2] = {};    // its bins wear random angles
  bool leaning_[2] = {};      // its partials lean to the sides
  bool aside_[2] = {};        // some of its partials have a side turned by itself
  bool two_[kStrong] = {};    // whether each stronger partial stands at two pitches on the two sides
  float lone_[2][kStrong];    // each stronger partial's distance from its peak's centre on each side alone, bins
  uint32_t number_[2] = {};   // the frame (kit::Stft's count) its spin is for
  uint32_t dressed_[2] = {};  // and the one its random angles and its lean are for
  uint16_t strong_[kStrong];  // the frame's stronger partials: their peaks' bins
  int strong_count_ = 0;
  // The input as kit::Stft last read it, at those partials: seven bins each,
  // the peak's phase and how far the played partial lies from the bin's
  // centre (bins), with the frame each was read in and last measured in, and
  // how far its two sides have turned against each other while it was
  // followed (radians), each side's level (as a power) when that began, and
  // for how many hops each side has been one steady partial (to kCalm).
  float now_re_[2][kMaxBins];
  float now_im_[2][kMaxBins];
  float now_phase_[2][kMaxBins];
  float now_off_[2][kMaxBins];
  float now_gone_[kMaxBins];
  float now_even_[2][kMaxBins];
  uint8_t now_calm_[kMaxBins];
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
