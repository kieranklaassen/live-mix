#pragma once

// Warp: moves every partial by a curve. A pitch shifter multiplies every
// frequency by one number and a frequency shifter adds one number to each;
// here a partial at f goes to
//
//   g(f) = pivot × (f / pivot)^e × 2^(shift / 12),      e = 2^stretch
//
// so the spacing of the partials is stretched (e > 1) or squeezed (e < 1)
// around a pivot that stays where it was. Evenly spaced partials come out
// unevenly spaced: a string turns into a bell.
//
//   in ─┬─► kit::Stft ring ─────────────────────────────────► dry() ─┐
//       │                                                             ├─► out
//       └─► frame ─► peaks ─► move each peak's region ─► tone ─► clip ┘
//
// 4096-point frames every 1024 samples (kit::Stft<4096, 1024>): a bin is
// 11.7 Hz wide at 48 kHz, so partials 47 Hz apart are told from one another
// and a low note's harmonics move one by one. The latency is 4608 samples
// and the dry path is as late (Stft::dry()), so Mix does not comb.
//
// One frame of one channel (frame() below):
//
// 1. Peaks. A bin whose power tops its two neighbours on either side is a
//    partial. Its true frequency is read from how far its phase turned since
//    the last frame (Stft::advance_to_bin), so a partial between two bins is
//    placed to a hundredth of a hertz. Each peak owns the bins from the
//    quietest bin below it to the quietest bin above it: its region.
// 2. The move. A region is moved whole by Δ = g(b) - b bins (b the peak's
//    place in bins, not a whole number) and turned by an angle that adds up
//    Δ / 4 of a turn every frame: together that is the region multiplied by
//    exp(j 2π Δ n / Frame) in time, a frequency shift of its own. A shift
//    changes no envelope, so an attack stays an attack, and the bins of one
//    partial move and turn as one, so a sine stays a sine. The part of Δ that
//    is not a whole bin is done by weighting two neighbouring bins, with the
//    signs a frame centred on its middle needs ((-1)^d: the kit counts phases
//    from the frame's first sample); that costs up to 0.9 dB of level, which
//    kInterpolationLoss gives back.
// 3. The angle is kept per input bin, so the partial that sits there next
//    frame carries on from it. A region that is to move by less than a
//    quarter of a hertz is at rest: it stays where it is and its
//    angle falls back to nought, so a partial on the pivot, and everything
//    with Stretch in the middle and Shift at 0, lines up with the dry path
//    again, whatever was played before. Mix is an equal-power crossfade, and
//    a region at rest is turned down by (1 - cos) / sin of Mix's angle, so
//    that with its dry self it adds up to what came in: a partial that does
//    not move keeps its level at every Mix. That turning down is in the
//    frames, which are heard a latency later and four at a time, so the gains
//    of the mix are made from the Mix of the four frames in flight by their
//    weights (process() below): a partial at rest adds up to what came in at
//    every sample of a thrown Mix too, and Mix moves over a frame's length.
// 4. An attack passes as it came. A partial whose power is more than twice
//    what its bins held in the last third of a second has just been struck,
//    and its region is left where it is for that frame: cut from a frame the
//    note only partly fills and moved, it would ring before the attack. The
//    partial is in its new place 20 to 40 ms after the attack.
//
// - Lean says where the stretch bites. With o the octaves from the pivot
//   and r = (o/2)² / (1 + (o/2)²), which runs from 0 at the pivot to 1 far
//   from it, the stretch is weighted by w = 1 - lean (1 - r) for lean ≥ 0
//   (at 1 the partials near the pivot stay close to where they were and the
//   far ones move most, as on a stiff string) and by w = 1 + lean r for
//   lean < 0 (at -1 the near ones move and the far ones stay):
//
//     g(f) = pivot × 2^(o (1 + (e - 1) w) + shift / 12)
//
//   The curve rises all the way at every setting, so partials never cross.
// - Drift adds a slow wander to the stretch: three sines at 0.043 Hz and
//   two rates beside it, read from the frame's number (the Stft's sample
//   clock), so it keeps its place through silence and sleep and is the same
//   at every block size. Up to ±0.12 of the stretch's range.
// - Width moves the two sides' stretches apart, left down and right up, by
//   up to 0.04 each. At 0 a mono input stays mono, bit for bit.
// - Follow puts a pivot on every note being played (track() below, up to
//   eight, each channel from its own spectrum): each note keeps its pitch and
//   its overtones are warped from it. With Follow on a partial moves only as
//   the overtone of a note. A partial that is nobody's overtone stays where
//   it is (a soft note, a noise, what lies under the lowest note), and the
//   Pivot knob is not used. A partial on a harmonic of a note may be that
//   note's overtone or another note's fundamental, an octave or a twelfth
//   over it: it is weighed against a sawtooth's harmonic there, and what is
//   too strong for an overtone stays, in part or whole (kNoteRatio). The
//   order things come in tells the rest: a note struck on a held note's
//   harmonic is a note while it stands over what was there, and what sounded
//   before a note came is not that note's overtone, however loud the note. A
//   note that has had a pivot keeps it through anything louder and gives it
//   up only when it has itself fallen away. What cannot be told is a note
//   that starts with a louder one, on its harmonic and softer than the
//   overtone there, and a soft note within a region (47 Hz) of a louder
//   partial, which goes where that partial goes.
// - Tone is a gain per bin on the wet signal, over 500 Hz only: up to 6 dB
//   an octave of cut (turned down) or of boost (turned up, never more than
//   12 dB). What lies under 500 Hz is left as it is, so a darker tone is
//   not a louder one.
//
// The wet path sums nothing: left stays left and right stays right. Nothing
// is held and nothing feeds back; what goes above half the sample rate or
// below nought is dropped. The wet signal passes a clip that is linear up to
// ±1 and never passes ±2.
//
// Storage: two Stft<4096, 1024> (176 KB each), seven arrays of 2049 floats per
// channel, five shared, the peaks and a frame's weights (219 KB): 0.57 MB.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Warp : public kit::DeviceBase<warp::kNumParams> {
 public:
  using Stft = kit::Stft<4096, 1024>;
  static constexpr int kLatency = Stft::kLatency;  // 4608: "latencySamples" in device.json
  static constexpr int kBins = Stft::kBins;
  static constexpr int kMarks = 6;   // the strongest partials reported to the display
  static constexpr int kPivots = 8;  // Follow: the most notes that each get a pivot

  // The constants of the curve, which the display copies (src/react/components/displays/warp.ts).
  static constexpr float kDriftDepth = 0.12f;  // of stretch, at Drift 1
  static constexpr float kWidthDepth = 0.04f;  // of stretch each side, at Width 1
  static constexpr float kDriftHz = 0.043f;
  static constexpr float kLeanOctaves = 2.0f;  // where Lean's weight is a half
  // The drift's three sines: their rates against kDriftHz, their weights, and where each starts
  // (in 2^32 of a turn).
  static constexpr double kDriftRate[3] = {1.0, 0.6180339887, 1.7320508076};
  static constexpr float kDriftWeight[3] = {0.5f, 0.3f, 0.2f};
  static constexpr uint32_t kDriftStart[3] = {0x1F3A5C00u, 0x8E2B9D00u, 0xC4D17A00u};
  static constexpr float kTonePivotHz = 500.0f;
  static constexpr float kToneDbPerOctave = 6.0f;
  static constexpr float kToneMaxBoostDb = 12.0f;
  static constexpr float kToneMaxCutDb = 48.0f;

  void init(float sample_rate) {
    using namespace warp;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    for (int k = 0; k < kBins; ++k) {
      octave_[k] = std::log2(Stft::bin_to_hz(static_cast<float>(k > 0 ? k : 1), sr) / kTonePivotHz);
      tone_gain_[k] = 1.0f;
      power_[k] = 0.0f;
    }
    for (int k = 0; k <= kBins; ++k) {
      out_re_[k] = 0.0f;
      out_im_[k] = 0.0f;
    }
    peaks_ = 0;
    stretch_now_ = param(kStretch);
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      for (int k = 0; k < kBins; ++k) {
        channel.last_re[k] = 0.0f;
        channel.last_im[k] = 0.0f;
        channel.turn[k] = 0.0f;
        channel.stay_turn[k] = 0.0f;
      }
      for (int k = 0; k < kBins; ++k) channel.held[k] = channel.slow[k] = channel.mean[k] = 0.0f;
      for (int j = 0; j < kPivots; ++j) clear_pivot(channel, j);
      channel.pivot_bin = Stft::hz_to_bin(param(kPivot), sr);
      for (int m = 0; m < kMarks; ++m) {
        channel.mark_in[m] = 0.0f;
        channel.mark_out[m] = 0.0f;
        channel.mark_level[m] = 0.0f;
      }
    }
    tone_dirty_ = true;
    rest_gain_ = 1.0f;
    at_rest_ = Stft::hz_to_bin(kAtRestHz, sr);
    young_frames_ = static_cast<int>(kYoungSeconds * sr / Stft::kHop + 0.5f);
    struck_frames_ = static_cast<int>(kHeldSeconds * sr / Stft::kHop + 0.5f);
    fallen_frames_ = static_cast<int>(kFallenSeconds * sr / Stft::kHop + 0.5f);
    settled_frames_ = static_cast<int>(kPivotHeldSeconds * sr / Stft::kHop + 0.5f);
    mean_step_ = 1.0f - std::exp(-static_cast<float>(Stft::kHop) / (sr * kSteadySeconds));
    held_decay_ = std::exp(-static_cast<float>(Stft::kHop) / (sr * kHeldSeconds));
    pivot_decay_ = std::exp(-static_cast<float>(Stft::kHop) / (sr * kPivotHeldSeconds));
    // The drift's three phases per frame, as fractions of 2^32 of a turn.
    const double turns_per_frame = static_cast<double>(kDriftHz) * Stft::kHop / sr;
    for (int i = 0; i < 3; ++i) {
      drift_step_[i] = static_cast<uint32_t>(turns_per_frame * kDriftRate[i] * 4294967296.0);
    }
    // Hann² frames a hop apart, over their sum: the weight each frame has in the output, n samples
    // after its first.
    for (int n = 0; n < Stft::kFrame; ++n) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * 3.14159265358979323846 * n / Stft::kFrame);
      fade_[n] = static_cast<float>(w * w / (0.375 * Stft::kOverlap));
    }
    clock_ = 0;
    snap_mix();
    // What is in flight when the input stops: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void set_param(int id, float value) {
    using namespace warp;
    if (!store_param(id, value)) return;
    // (asleep, a knob snaps: nothing is sounding for it to glide under)
    if (id == kMix && (!primed() || idle_.asleep())) snap_mix();
    if (id == kTone) tone_dirty_ = true;
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, the stretch in use now, Drift's wander included and Width's left and
  // right offsets not (asleep, where the knob stands);
  // 1, the pivot in use now in hertz: with Follow off the knob's, with Follow
  // on the lowest note's (of the louder side), and 0 while there is no note;
  // 2 to 19, the six strongest partials of the newest frame of the louder
  // side, strongest first: where each came in and where it was sent, in
  // hertz (of a partial that is shared, where the greater share went), and
  // its level (1 is a full-scale sine). Asleep, and for a mark with no
  // partial, the level is 0.
  float meter(int index) const {
    using namespace warp;
    const bool asleep = idle_.asleep();
    if (index == 0) return asleep ? param(kStretch) : stretch_now_;
    const Channel& channel = channel_[channel_[1].mark_level[0] > channel_[0].mark_level[0] ? 1 : 0];
    if (index == 1) {
      if (asleep) return param(kFollow) >= 0.5f ? 0.0f : param(kPivot);
      return Stft::bin_to_hz(channel.pivot_bin, sample_rate());
    }
    const int mark = (index - 2) / 3;
    if (index < 2 || mark >= kMarks || asleep) return 0.0f;
    const int what = (index - 2) % 3;
    if (what == 2) return channel.mark_level[mark];
    return Stft::bin_to_hz(what == 0 ? channel.mark_in[mark] : channel.mark_out[mark], sample_rate());
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock, and the drift read from it, run on through the sleep
      stft_[1].skip(frames);
      clock_ += static_cast<uint32_t>(frames);
      snap_mix();  // a knob moved while asleep does not glide in
      for (int c = 0; c < 2; ++c) {
        for (int m = 0; m < kMarks; ++m) channel_[c].mark_level[m] = 0.0f;
      }
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      float wet[2];
      for (int c = 0; c < 2; ++c) {
        wet[c] = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
      }
      // Mix. Each frame was made for the Mix there was when it was taken (a partial at rest is
      // turned down for it, see frame()), and four frames overlap in what is heard: the tangent
      // of half Mix's angle now is theirs by their weights, so a partial at rest adds up with its
      // dry self to what came in at every sample of a throw, and Mix moves as the frames do.
      if (!mix_steady_) {
        const uint32_t q = (clock_ - Stft::kMaxStagger) & (Stft::kHop - 1);  // samples into the newest frame
        float t = 0.0f;
        for (int j = 0; j < Stft::kOverlap; ++j) t += mix_tan_[j] * fade_[q + static_cast<uint32_t>(j) * Stft::kHop];
        mix_gains(t);
      }
      ++clock_;
      // Linear up to ±1, never past ±2.
      out_left_[i] = stft_[0].dry() * dry_gain_ + 2.0f * kit::soft_clip(0.5f * wet[0]) * wet_gain_;
      out_right_[i] = stft_[1].dry() * dry_gain_ + 2.0f * kit::soft_clip(0.5f * wet[1]) * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A peak under this (in power) is not a partial: -140 dBFS for a sine.
  static constexpr float kPeakFloor = (Stft::kFullScale * 1.0e-7f) * (Stft::kFullScale * 1.0e-7f);
  // The most peaks a frame can hold: one in three bins.
  static constexpr int kMaxPeaks = kBins / 3 + 2;
  // A region moved by half a bin comes out this share quieter; in between by 4 ε (1 - ε) of it.
  static constexpr float kInterpolationLoss = 0.095f;
  // A region whose move is under a quarter of a hertz is at rest: it is left where it is and its
  // angle falls back to nought. The measure of a partial's place is good to a thousandth of a
  // hertz and worse in the frames of an attack; without a rest wider than that a partial on the
  // pivot would keep whatever angle its attack left it, and part way up Mix it would cancel
  // against the dry one, or not, by chance.
  static constexpr float kAtRestHz = 0.25f;
  static constexpr float kRestDecay = 0.75f;
  // Follow: a partial is strong within 18 dB of the strongest, the pivot stays with a partial until
  // it is 36 dB under, and a partial within 3 % (half a semitone) is the one it had.
  static constexpr float kAcquirePower = 0.01585f;
  static constexpr float kReleasePower = 2.512e-4f;
  static constexpr float kSameNote = 0.03f;
  static constexpr float kYoungSeconds = 0.25f;
  // A partial on a harmonic of a note is that note's overtone or another note's fundamental (an
  // octave, a twelfth), and one frame cannot tell which. It is weighed against the n-th harmonic of
  // a sawtooth on the pivot, which has 1 / n of the pivot's level: with rho its level over that,
  // up to kOvertoneRatio it is an overtone and is moved whole; from kNoteRatio up it is a note,
  // stays whole and gets a pivot of its own (which it keeps down to kNoteRatioOff); in between it
  // is shared, sqrt(s) of it staying and sqrt(1 - s) moving. So a doubtful partial is kept in part
  // rather than sent off whole: a bright overtone left in place is a little less effect, a note's
  // fundamental sent away is a note out of tune.
  static constexpr float kOvertoneRatio = 1.1f;
  static constexpr float kNoteRatio = 1.6f;
  static constexpr float kNoteRatioOff = 1.25f;
  // Freshly struck: a partial's power is more than this over what its bins held in the last
  // third of a second (kHeldSeconds), which a beating partial never is.
  static constexpr float kFreshRise = 2.0f;
  static constexpr float kHeldSeconds = 0.3f;
  // A pivot's own level is held for longer (the pivot of a slowly beating pad passes through
  // nulls), and a note struck on a held note's harmonic is let go a third of a second after the
  // partial has fallen back to within kStruckOver (in power) of what was there before.
  static constexpr float kPivotHeldSeconds = 1.5f;
  static constexpr float kStruckOver = 1.4f;
  // What was there first is nobody's overtone. A note keeps its pivot through a louder sound that
  // comes and goes: it is found while its partial is within 12 dB of what it held, however far
  // under the loudest, and looked for during kHeldSeconds when it is covered. Once it has been a
  // pivot for kYoungSeconds it is given up on a harmonic only when it has itself fallen, 6 dB
  // under what it held for kFallenSeconds, and is then no more than an overtone by its level: a
  // pivot that grows louder under it takes nothing from it. And a steady partial (within 1 dB of
  // what its bins held, which have averaged 70 % of it over kSteadySeconds: it has sounded for
  // half a second) on a harmonic of a note that is only now arriving was there before that note:
  // it gets a pivot from 36 dB under the loudest, and stays.
  static constexpr float kKeptPower = 0.0625f;
  static constexpr float kFallenPower = 0.25f;
  static constexpr float kFallenSeconds = 1.0f;
  static constexpr float kSteadyRise = 1.26f;
  static constexpr float kSteadyShare = 0.7f;
  static constexpr float kSteadySeconds = 0.4f;
  static constexpr float kHeldRise = 1.26f;

  struct Channel {
    float last_re[kBins], last_im[kBins];  // the previous analysis frame
    float turn[kBins];                     // each input bin's added angle, in turns, [-0.5, 0.5)
    float stay_turn[kBins];                // Follow: the same for the share of a partial that stays
    float held[kBins];                     // each bin's power, held: its recent most
    float slow[kBins];                     // the same held as long as a pivot's level is
    float mean[kBins];                     // each bin's power, averaged over kSteadySeconds
    float pivots[kPivots];                 // Follow: each note's partial in bins, 0 for a free place
    float pivot_power[kPivots];            // the power of its partial in the newest frame (0: not found)
    float pivot_held[kPivots];             // the same, held over kPivotHeldSeconds
    float struck_over[kPivots];            // struck on a harmonic: the power that was there before; else 0
    int age[kPivots];                      // the frames it has been one, up to settled_frames_
    int quiet[kPivots];                    // the frames since it stood over what was there (struck), or has been fallen
    int gone[kPivots];                     // the frames its partial has not been found
    bool on_harmonic[kPivots];             // taken on a harmonic of another pivot
    bool first[kPivots];                   // and it was there before that one came
    bool fresh[kPivots];                   // its partial was freshly struck in the newest frame
    float pivot_bin;                       // the pivot in use, in bins (Follow: the lowest)
    float mark_in[kMarks], mark_out[kMarks], mark_level[kMarks];  // for meter() only
  };

  // The tangent of half Mix's angle: what a partial at rest is turned down by in the wet signal
  // ((1 - cos) / sin), and what the gains of the mix are made from.
  float mix_tangent() const {
    const float mix = param(warp::kMix);
    return mix >= 1.0f ? 1.0f : std::tan(0.5f * kit::kHalfPi * mix);
  }
  // cos and sin of the angle whose half has the tangent t.
  void mix_gains(float t) {
    const float scale = 1.0f / (1.0f + t * t);
    dry_gain_ = (1.0f - t * t) * scale;
    wet_gain_ = 2.0f * t * scale;
  }
  // Mix as the knob stands, with nothing in flight.
  void snap_mix() {
    rest_gain_ = mix_tangent();
    for (float& tangent : mix_tan_) tangent = rest_gain_;
    mix_steady_ = true;
    mix_gains(rest_gain_);
  }

  // The slow wander Drift adds, about ±1, at frame `n`: three sines whose phases are the frame's
  // number times a step, in whole numbers that wrap with the turn.
  float wander(uint32_t n) const {
    float sum = 0.0f;
    for (int i = 0; i < 3; ++i) {
      const uint32_t phase = kDriftStart[i] + n * drift_step_[i];
      sum += kDriftWeight[i] * kit::SineTable::lookup(static_cast<float>(phase >> 8) * (1.0f / 16777216.0f));
    }
    return sum;
  }

  // Gain per bin from Tone: a slope over kTonePivotHz, nothing under it.
  void update_tone() {
    using namespace warp;
    const float slope = param(kTone) * kToneDbPerOctave;
    for (int k = 0; k < kBins; ++k) {
      const float db = kit::clamp(slope * octave_[k], -kToneMaxCutDb, kToneMaxBoostDb);
      tone_gain_[k] = (slope == 0.0f || octave_[k] <= 0.0f) ? 1.0f : std::exp(db * 0.11512925f);
    }
    tone_dirty_ = false;
  }

  static void clear_pivot(Channel& channel, int j) {
    channel.pivots[j] = 0.0f;
    channel.pivot_power[j] = 0.0f;
    channel.pivot_held[j] = 0.0f;
    channel.struck_over[j] = 0.0f;
    channel.age[j] = 0;
    channel.quiet[j] = 0;
    channel.gone[j] = 0;
    channel.on_harmonic[j] = false;
    channel.first[j] = false;
    channel.fresh[j] = false;
  }

  // Follow: the notes being played, each a pivot. From this frame's peaks (peak_bin_, peak_true_,
  // peak_fresh_, peak_before_, `peaks_` of them, lowest first) and the pivots there were:
  // - a pivot stays on its partial (the nearest peak within half a semitone) for as long as that,
  //   or any overtone that went with it in the last frame, is within 36 dB of the strongest
  //   partial; while only overtones are left it stays where it was;
  // - a strong partial (within 18 dB of the strongest) becomes a pivot when it is no harmonic of
  //   one. One that is a harmonic becomes a pivot when it is too strong for an overtone (kNoteRatio
  //   over the n-th harmonic of a sawtooth on that pivot, by the pivot's held level), or when it
  //   has just been struck while the pivot under it has not and is no longer young: a melody note
  //   on a harmonic of a held bass;
  // - a pivot taken on a harmonic, or a young one that now lies on one, is weighed again every
  //   frame: it is let go under kNoteRatioOff, and one that was struck when its partial has fallen
  //   back to what was there before it. An old pivot that was taken as a note of its own stays,
  //   so a held note keeps its pitch whatever is struck under it.
  // With every place taken, a stronger newcomer takes the weakest pivot's.
  void track(Channel& channel) const {
    float strongest = 0.0f;
    for (int i = 0; i < peaks_; ++i) strongest = kit::max(strongest, peak_power_[i]);
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = channel.pivots[j];
      if (!(pivot > 0.0f)) continue;
      float nearest = 0.0f;
      float distance = pivot * kSameNote + 0.5f;
      channel.pivot_power[j] = 0.0f;
      channel.fresh[j] = false;
      for (int i = 0; i < peaks_; ++i) {
        const float off = std::fabs(peak_true_[i] - pivot);
        if (off <= distance && peak_power_[i] >= channel.pivot_held[j] * kReleasePower &&
            (peak_power_[i] >= strongest * kReleasePower || peak_power_[i] >= channel.pivot_held[j] * kKeptPower)) {
          distance = off;
          nearest = peak_true_[i];
          channel.pivot_power[j] = peak_power_[i];
          channel.fresh[j] = peak_fresh_[i] != 0;
        }
      }
      // What it holds: its most over kPivotHeldSeconds. Once it has lasted, that rises by a decibel
      // a frame at the most: a thump that passes through its partial is not its level.
      const bool lasted = channel.age[j] >= young_frames_;
      const float rise = lasted ? kit::min(channel.pivot_power[j], channel.pivot_held[j] * kHeldRise) : channel.pivot_power[j];
      channel.pivot_held[j] = kit::max(rise, channel.pivot_held[j] * pivot_decay_);
      if (nearest > 0.0f) {
        channel.pivots[j] = nearest;
        channel.gone[j] = 0;
      } else if (lasted && ++channel.gone[j] <= struck_frames_) {
        // (covered by something louder, or between two frames: it is looked for a while longer)
      } else {
        clear_pivot(channel, j);  // the note has gone: the place is free
      }
    }
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = channel.pivots[j];
      if (!(pivot > 0.0f)) continue;
      // (it is weighed by its level until it has held for as long as a level is held: a partial
      // that beats shows what it is only once it and its note have each been through a swell)
      const bool unsettled = channel.age[j] < settled_frames_;
      if (unsettled) ++channel.age[j];
      if (!unsettled && !channel.on_harmonic[j]) continue;
      channel.pivots[j] = 0.0f;  // out of the way while it is weighed against the others
      int harmonic = 0;
      const int owner = pivot_for(channel, pivot, &harmonic);
      channel.pivots[j] = pivot;
      if (owner >= 0 && harmonic == 1) {
        clear_pivot(channel, j);  // two on one partial: one is enough
        continue;
      }
      if (owner < 0 || harmonic < 2) {
        // (no longer on anything's harmonic: a note of its own from here on)
        channel.on_harmonic[j] = false;
        channel.struck_over[j] = 0.0f;
        continue;
      }
      if (!channel.on_harmonic[j]) channel.quiet[j] = 0;
      channel.on_harmonic[j] = true;
      const float n2 = static_cast<float>(harmonic) * static_cast<float>(harmonic);
      const float line = kNoteRatioOff * kNoteRatioOff * channel.pivot_held[owner];
      const bool note = channel.pivot_held[j] * n2 >= line;
      if (channel.struck_over[j] > 0.0f) {
        // Struck on a held note's harmonic: a note while it stands over what was there before it,
        // and after that only if it is one by its level.
        channel.quiet[j] = channel.pivot_power[j] > kStruckOver * channel.struck_over[j] ? 0 : channel.quiet[j] + 1;
        if (channel.quiet[j] <= struck_frames_ || note) continue;
      } else if (unsettled) {
        if (note || channel.first[j]) continue;
      } else {
        // It has lasted: it goes only when it has fallen, and what it holds is an overtone's worth.
        channel.quiet[j] = channel.pivot_power[j] < kFallenPower * channel.pivot_held[j] ? channel.quiet[j] + 1 : 0;
        if (channel.quiet[j] <= fallen_frames_ || note) continue;
      }
      clear_pivot(channel, j);
    }
    for (int i = 0; i < peaks_; ++i) {
      const float place = peak_true_[i];
      const float power = peak_power_[i];
      if (power < strongest * kReleasePower) continue;
      int harmonic = 0;
      const int owner = pivot_for(channel, place, &harmonic);
      const bool overtone = owner >= 0 && harmonic >= 2;
      if (owner >= 0 && harmonic == 1) continue;  // it has its pivot
      float over = 0.0f;
      bool first = false;  // it was there before the note whose harmonic it lies on
      if (overtone) {
        const float n2 = static_cast<float>(harmonic) * static_cast<float>(harmonic);
        if (peak_steady_[i] != 0 && channel.fresh[owner] && channel.age[owner] < young_frames_) {
          first = true;
        } else if (peak_slow_[i] * n2 < kNoteRatio * kNoteRatio * channel.pivot_held[owner]) {
          const bool struck = peak_fresh_[i] != 0 && !channel.fresh[owner] && channel.age[owner] >= young_frames_;
          if (!struck) continue;
          over = kit::max(peak_before_[i], kPeakFloor);
        }
      }
      if (!first && power < strongest * kAcquirePower) continue;
      // A free place, or the place of the weakest that gives way: one that is new or whose partial
      // has gone gives way to any stronger partial, one that has lasted only to a partial that has
      // lasted too (a click is strong everywhere for a frame, and takes no note's pivot).
      int free = -1, weakest = -1;
      for (int j = 0; j < kPivots; ++j) {
        if (!(channel.pivots[j] > 0.0f)) {
          free = j;
          break;
        }
        const bool gives = channel.age[j] < young_frames_ || channel.gone[j] > 0 || peak_fresh_[i] == 0;
        if (gives && (weakest < 0 || channel.pivot_held[j] < channel.pivot_held[weakest])) weakest = j;
      }
      if (free < 0 && weakest >= 0 && power > channel.pivot_held[weakest]) free = weakest;
      if (free >= 0) {
        clear_pivot(channel, free);
        channel.pivots[free] = place;
        channel.pivot_power[free] = power;
        channel.pivot_held[free] = power;
        channel.on_harmonic[free] = overtone;
        channel.struck_over[free] = over;
        channel.fresh[free] = peak_fresh_[i] != 0;
        channel.first[free] = first;
      }
    }
  }

  // The pivot (its place in channel.pivots) a partial at `place` bins is warped around, with
  // Follow on: the pivot it is a harmonic of (within half a semitone; of several, the one it is
  // the lowest harmonic of), which `harmonic` then numbers; failing that the nearest pivot under
  // it, with `harmonic` 0. -1 when it lies under every pivot, or there is none: such a partial
  // is warped around the knob.
  static int pivot_for(const Channel& channel, float place, int* harmonic) {
    int fits = -1, under = -1;
    int number = 1 << 30;
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = channel.pivots[j];
      if (!(pivot > 0.0f)) continue;
      const float ratio = place / pivot;
      if (ratio < 1.0f - kSameNote) continue;
      if (under < 0 || pivot > channel.pivots[under]) under = j;
      const float n = std::floor(ratio + 0.5f);
      if (std::fabs(ratio - n) <= kSameNote * ratio && static_cast<int>(n) < number) {
        number = static_cast<int>(n);
        fits = j;
      }
    }
    *harmonic = fits >= 0 ? number : 0;
    return fits >= 0 ? fits : under;
  }

  // One frame of channel c: kBins bins, changed in place. Parameters are read here, once per
  // frame; the overlap crossfades a change.
  void frame(int c, float* re, float* im) {
    using namespace warp;
    Channel& channel = channel_[c];
    const float sr = sample_rate();
    if (c == 0 && tone_dirty_) update_tone();

    // The stretch for this side: the knob, the drift (the same for both sides), and the width.
    const float centre = param(kStretch) + param(kDrift) * kDriftDepth * wander(stft_[c].frame());
    if (c == 0) stretch_now_ = centre;
    const float stretch = centre + (c == 0 ? -1.0f : 1.0f) * param(kWidth) * kWidthDepth;
    const float lean = param(kLean);
    const float exponent = std::exp2(stretch) - 1.0f;    // e - 1
    const float shift = param(kShift) * (1.0f / 12.0f);  // octaves
    // What a region at rest is turned down by. Mix is an equal-power crossfade, which is right for
    // partials that have moved (they add to the dry ones as power) and 3 dB too much at the centre
    // for one that has not (it adds to its dry self as amplitude). With (1 - cos) / sin on those,
    // dry × cos + wet × sin is the partial as it came in, at every Mix. Read when the left side's
    // frame comes, for both sides; the right side's frame is the moment the frame begins to be
    // heard, and there its Mix joins the four in flight.
    if (c == 0) {
      rest_gain_ = mix_tangent();
    } else {
      for (int j = Stft::kOverlap - 1; j > 0; --j) mix_tan_[j] = mix_tan_[j - 1];
      mix_tan_[0] = rest_gain_;
      mix_steady_ = mix_tan_[1] == mix_tan_[0] && mix_tan_[2] == mix_tan_[0] && mix_tan_[3] == mix_tan_[0];
      if (mix_steady_) mix_gains(mix_tan_[0]);
    }

    // 1. Power, and the peaks: a bin over its two neighbours on either side.
    for (int k = 0; k < kBins; ++k) power_[k] = re[k] * re[k] + im[k] * im[k];
    peaks_ = 0;
    for (int k = 2; k < kBins - 2; ++k) {
      const float p = power_[k];
      if (p > kPeakFloor && p > power_[k - 1] && p > power_[k - 2] && p >= power_[k + 1] && p >= power_[k + 2]) {
        // Its true place in bins, from the turn since the last frame; a peak that was not there
        // a frame ago (an onset) is taken at its bin's centre.
        float place = static_cast<float>(k);
        const float lr = channel.last_re[k];
        const float li = channel.last_im[k];
        // Freshly struck: its power is more than twice what its bins have held of late (a note
        // coming into the frame grows thirty times, then three, then levels off).
        float before = channel.held[k];
        for (int j = k - 2; j <= k + 2; ++j) before = kit::max(before, channel.held[j]);
        peak_before_[peaks_] = before;
        peak_fresh_[peaks_] = p > kFreshRise * before;
        // Steady: no stronger than its bins held, and they have averaged most of it for a while.
        const float mean = kit::max(channel.mean[k], kit::max(channel.mean[k - 1], channel.mean[k + 1]));
        peak_steady_[peaks_] = p <= kSteadyRise * before && mean >= kSteadyShare * p;
        if (lr * lr + li * li > 1.0e-4f * p) {
          const float advance = kit::fast_atan2(im[k] * lr - re[k] * li, re[k] * lr + im[k] * li);
          place = kit::clamp(Stft::advance_to_bin(k, advance), place - 1.0f, place + 1.0f);
        }
        // A partial between two bins reads up to 1.4 dB low in the nearer one (the Hann window's
        // main lobe, sin(πd) / (πd (1 - d²)) at d bins off): made up, so that levels are weighed
        // as they are and not by where a partial falls among the bins.
        const float off = place - static_cast<float>(k);
        const float lobe = 1.0f - off * off * (0.645f - 0.16f * off * off);
        peak_power_[peaks_] = p / (lobe * lobe);
        float slow = peak_power_[peaks_];
        for (int j = k - 2; j <= k + 2; ++j) slow = kit::max(slow, channel.slow[j]);
        peak_slow_[peaks_] = slow;
        peak_bin_[peaks_] = static_cast<int16_t>(k);
        peak_true_[peaks_] = place;
        ++peaks_;
        k += 2;  // the next two cannot be peaks
      }
    }
    for (int k = 0; k < kBins; ++k) {
      channel.last_re[k] = re[k];
      channel.last_im[k] = im[k];
    }

    if (peaks_ == 0) {
      // A frame of silence: the angles, what the bins held and the notes Follow was on are
      // forgotten, so what comes after a silence starts as it would after init (a sleep is only
      // ever entered past such a frame, so it makes no difference whether the device slept).
      for (int k = 0; k < kBins; ++k) {
        channel.turn[k] = 0.0f;
        channel.stay_turn[k] = 0.0f;
        channel.held[k] = 0.0f;
        channel.slow[k] = 0.0f;
        channel.mean[k] = 0.0f;
      }
      for (int j = 0; j < kPivots; ++j) clear_pivot(channel, j);
    }

    // The pivot: the knob's, or with Follow on the notes being played.
    const float knob_bin = Stft::hz_to_bin(param(kPivot), sr);
    const bool follow = param(kFollow) >= 0.5f;
    if (follow) {
      track(channel);
    } else {
      for (int j = 0; j < kPivots; ++j) clear_pivot(channel, j);
    }
    if (peaks_ > 0) {
      for (int k = 0; k < kBins; ++k) {
        channel.held[k] = kit::max(power_[k], channel.held[k] * held_decay_);
        channel.slow[k] = kit::max(power_[k], channel.slow[k] * pivot_decay_);
        channel.mean[k] += (power_[k] - channel.mean[k]) * mean_step_;
      }
      for (int i = 0; i < peaks_; ++i) channel.slow[peak_bin_[i]] = kit::max(channel.slow[peak_bin_[i]], peak_power_[i]);
    }
    // (for the display: the lowest pivot there is; with Follow on and no note yet, none)
    channel.pivot_bin = follow ? 0.0f : knob_bin;
    for (const float pivot : channel.pivots) {
      if (pivot > 0.0f && (!(channel.pivot_bin > 0.0f) || pivot < channel.pivot_bin)) channel.pivot_bin = pivot;
    }
    const float log2_knob = std::log2(knob_bin);

    // 2. Each peak's region, moved whole.
    int marks = 0;
    float mark_power[kMarks];
    int low = 0;
    for (int i = 0; i < peaks_; ++i) {
      const int k = peak_bin_[i];
      // The region ends at the quietest bin before the next peak.
      int high = kBins;
      if (i + 1 < peaks_) {
        high = k + 1;
        for (int j = k + 2; j < peak_bin_[i + 1]; ++j) {
          if (power_[j] < power_[high]) high = j;
        }
      }
      const float place = peak_true_[i];
      // How far it lies from its pivot, in octaves, and how much of it stays where it is.
      float octaves = std::log2(place) - log2_knob;
      float stays = 0.0f;
      if (follow) {
        // With Follow on a partial moves only as the overtone of a note: a note's own partial and
        // one that is nobody's overtone stay, and so does the share of an overtone that is too
        // strong to be one (see kNoteRatio).
        int harmonic = 0;
        const int owner = pivot_for(channel, place, &harmonic);
        octaves = 0.0f;
        if (owner >= 0 && harmonic >= 2) {
          octaves = std::log2(place / channel.pivots[owner]);
          const float held = channel.pivot_held[owner];
          const float rho = held > 0.0f ? static_cast<float>(harmonic) * std::sqrt(peak_slow_[i] / held) : kNoteRatio;
          stays = kit::clamp((rho - kOvertoneRatio) * (1.0f / (kNoteRatio - kOvertoneRatio)), 0.0f, 1.0f);
          // A steady partial under a note that is only now arriving was there before it.
          if (peak_steady_[i] != 0 && channel.fresh[owner] && channel.age[owner] < young_frames_) stays = 1.0f;
        }
      }
      // An attack passes as it came. A partial that has just been struck lies in a frame the note
      // only partly fills, and a region cut from such a frame and moved rings before the attack
      // (the frame is 85 ms long): -6 to -30 dB in the 10 ms before it, measured. Left where it
      // is, it adds up with its neighbours to the attack itself, and the partial goes to its new
      // place over the two frames that follow: about 20 ms after the attack it is half there, by
      // 40 ms wholly, and what rings before the attack is 50 dB under it or less.
      if (peak_fresh_[i] != 0) stays = 1.0f;
      // Lean's weight: r runs from 0 at the pivot to 1 far from it (a half at kLeanOctaves).
      const float x = octaves * (1.0f / kLeanOctaves);
      const float r = x * x / (1.0f + x * x);
      const float weight = lean >= 0.0f ? 1.0f - lean * (1.0f - r) : 1.0f + lean * r;
      // g(place) = pivot × 2^(octaves × (1 + (e - 1) w) + shift) = place × 2^(octaves × (e - 1) w +
      // shift): written the second way, a region that is not to move has a move of exactly nought.
      // The share that stays is not warped; Shift still moves it, as it moves a pivot.
      const float ratio = std::exp2(octaves * exponent * weight + shift);
      const float home = shift == 0.0f ? 1.0f : std::exp2(shift);
      float lands = place * ratio;
      if (stays < 1.0f) {
        move_region(re, im, low, high, k, place * (ratio - 1.0f), lands, std::sqrt(1.0f - stays), channel.turn);
      } else {
        for (int j = low; j < high; ++j) channel.turn[j] = 0.0f;
      }
      if (stays > 0.0f) {
        move_region(re, im, low, high, k, place * (home - 1.0f), place * home, std::sqrt(stays), channel.stay_turn);
        if (stays > 0.5f) lands = place * home;
      } else {
        for (int j = low; j < high; ++j) channel.stay_turn[j] = 0.0f;
      }

      // The strongest few, for the display.
      const float p = power_[k];
      if (marks < kMarks || p > mark_power[kMarks - 1]) {
        int at = marks < kMarks ? marks++ : kMarks - 1;
        for (; at > 0 && mark_power[at - 1] < p; --at) {
          mark_power[at] = mark_power[at - 1];
          channel.mark_in[at] = channel.mark_in[at - 1];
          channel.mark_out[at] = channel.mark_out[at - 1];
        }
        mark_power[at] = p;
        channel.mark_in[at] = place;
        channel.mark_out[at] = lands;  // (of a shared partial, where the greater share goes)
      }
      low = high;
    }
    for (int m = 0; m < kMarks; ++m) {
      channel.mark_level[m] = m < marks ? std::sqrt(mark_power[m]) * (1.0f / Stft::kFullScale) : 0.0f;
    }

    // 3. Tone on the way out, and the sums emptied for the next frame.
    for (int k = 0; k < kBins; ++k) {
      re[k] = out_re_[k] * tone_gain_[k];
      im[k] = out_im_[k] * tone_gain_[k];
      out_re_[k] = 0.0f;
      out_im_[k] = 0.0f;
    }
    out_re_[kBins] = 0.0f;
    out_im_[kBins] = 0.0f;
  }

  // Bins [low, high) of this frame, the region of the peak at bin `peak`, added to the output
  // `move` bins higher (not a whole number), `gain` of it, turned by the region's angle, which is
  // kept in `turns` (the moved share's angles, or the staying share's). `target` is where the peak
  // lands: past the ends of the spectrum the region is dropped.
  void move_region(const float* re, const float* im, int low, int high, int peak, float move, float target, float gain,
                   float* turns) {
    // The angle: what the bin under the peak carried, on by a quarter of the move in turns
    // (Hop / Frame), wrapped. At rest it falls back to nought.
    float turn = turns[peak];
    if (std::fabs(move) < at_rest_) {
      move = 0.0f;
      turn *= kRestDecay;
      if (std::fabs(turn) < 1.0e-6f) turn = 0.0f;
    } else {
      turn += move * (1.0f / Stft::kOverlap);
      turn -= std::floor(turn + 0.5f);
    }
    for (int k = low; k < high; ++k) turns[k] = turn;
    if (!(target >= 0.5f && target <= static_cast<float>(kBins - 2))) return;

    const float whole = std::floor(move);
    const float part = move - whole;
    const int d = static_cast<int>(whole);
    // Two neighbouring bins share the part of a bin, with the signs of a frame centred on its
    // middle, and the level that costs is given back.
    gain *= move == 0.0f ? rest_gain_ : 1.0f / (1.0f - 4.0f * kInterpolationLoss * part * (1.0f - part));
    const float sign = (d & 1) ? -gain : gain;
    const float cosine = kit::SineTable::cos_lookup(turn);
    const float sine = kit::SineTable::lookup(turn);
    const float ar = cosine * sign * (1.0f - part), ai = sine * sign * (1.0f - part);
    const float br = -cosine * sign * part, bi = -sine * sign * part;
    // Bins that would land outside 0..kBins-1 are dropped (out_*[kBins] is a spare slot).
    const int from = low > -d ? low : -d;
    const int to = high < kBins - d ? high : kBins - d;
    float* out_re = out_re_ + d;
    float* out_im = out_im_ + d;
    for (int k = from; k < to; ++k) {
      const float xr = re[k], xi = im[k];
      out_re[k] += xr * ar - xi * ai;
      out_im[k] += xr * ai + xi * ar;
      out_re[k + 1] += xr * br - xi * bi;
      out_im[k + 1] += xr * bi + xi * br;
    }
  }

  Stft stft_[2];
  Channel channel_[2];
  float power_[kBins];
  float out_re_[kBins + 1], out_im_[kBins + 1];  // the moved spectrum, summed
  float octave_[kBins];                          // octaves from the tone's corner, per bin
  float tone_gain_[kBins];
  float peak_true_[kMaxPeaks];  // each peak's true place in bins
  int16_t peak_bin_[kMaxPeaks];
  float peak_power_[kMaxPeaks];    // its power, made up for lying between two bins
  float peak_before_[kMaxPeaks];   // what its bins held before this frame
  uint8_t peak_fresh_[kMaxPeaks];  // whether it has just been struck
  uint8_t peak_steady_[kMaxPeaks]; // whether it is what its bins held already
  float peak_slow_[kMaxPeaks];     // its power as held over kPivotHeldSeconds, this frame's with it
  int peaks_ = 0;
  uint32_t drift_step_[3] = {0, 0, 0};
  kit::IdleGate idle_;
  float fade_[Stft::kFrame];         // a frame's weight in the output, sample by sample
  float mix_tan_[Stft::kOverlap] = {1.0f, 1.0f, 1.0f, 1.0f};  // tan of half Mix's angle, the four frames in flight
  bool mix_steady_ = true;           // all four the same: the gains stand
  uint32_t clock_ = 0;               // samples since init, slept ones too (the Stft's own count)
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float at_rest_ = 0.0f;      // kAtRestHz in bins
  int young_frames_ = 12;     // kYoungSeconds in frames
  int struck_frames_ = 14;    // kHeldSeconds in frames
  int fallen_frames_ = 47;    // kFallenSeconds in frames
  int settled_frames_ = 70;   // kPivotHeldSeconds in frames
  float mean_step_ = 0.05f;   // the share of a frame in a bin's average
  float held_decay_ = 0.93f;  // what a bin's held power falls to in a frame
  float pivot_decay_ = 0.99f; // and a pivot's
  float rest_gain_ = 1.0f;    // this frame's gain for a region at rest
  float stretch_now_ = 0.0f;  // for meter() only
  bool tone_dirty_ = true;
};

}  // namespace livemix
