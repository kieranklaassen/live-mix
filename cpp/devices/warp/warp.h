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
// The two sides are read as one. Both sides' frames are looked at together
// (plan() below: their powers added, their turns weighed by power), which
// gives one set of peaks, one place for each, one reading of what has just
// been struck and of which partial is a note, and one angle. Each side's
// bins are then moved by that one plan (write()), so with Width at 0 the
// two sides go through the very same operation, and what they were to one
// another going in (a level, a phase, a pan that moves) they are coming out.
// Read apart, the sides took the same partial for struck a frame apart now
// and then, and from there on turned it by angles a whole frame's step
// apart, up to opposite phase, for as long as it sounded: a played stereo
// sound came out wider than it went in. Three transforms a frame: the right
// side is heard ahead (listen_, analysis only, when the frame ends), the plan
// is made and the left side written a quarter hop later, the right side
// written at the half hop, so no block of 128 holds two of them.
//
// One frame (plan() below):
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
// - Width gives the two sides different stretches, the left's under and the
//   right's over by up to 0.04 each, around each note: a partial that is the
//   overtone of a note (track() below, which runs with Follow on and off) is
//   sent a little lower on the left and a little higher on the right than
//   the middle stretch sends it, by its distance from its own note, so it
//   beats between the speakers. A note's own partial, and what is nobody's
//   overtone, goes to one place on both sides and is steady when the sides
//   are summed, wherever the stretch has sent it. (With Follow off the two
//   stretches used to be about the knob, as the stretch is: every note off
//   the knob then stood at two pitches, left and right, and fell out of the
//   sum once a beat.) What the knob sets is how far apart in pitch the two
//   sides' overtones stand (at 1, with the stretch at 0.3, the second partial
//   82 cents), so how fast they beat: over a held sound the side is as strong
//   from a twentieth of the knob up as at the top, only sooner there (a bright
//   note: 6.7 dB under the middle at any Width over a whole note, and in its
//   first quarter second 12 dB under at a hundredth, 7 at a quarter).
//   The angle of a partial is kept as what the sides share
//   and half of what they are apart; while its two moves are the same, what
//   they are apart falls back to nought, so at Width 0 the sides are in step
//   again a fifth of a second after the knob gets there, and a sound that is
//   the same on both sides comes out the same on both, bit for bit.
// - Follow puts a pivot on every note being played (track() below, up to
//   eight, from both sides together): each note keeps its pitch and
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
//   up only when it has itself fallen away. What cannot be told: a note on
//   a harmonic of a louder one that is softer than the overtone there, when
//   the two start together; one struck there later that is less than twice
//   the overtone (its partial has to double in power from one frame to the
//   next to count as struck); and a soft note within a region (47 Hz) of a
//   louder partial, which goes where that partial goes. More than eight
//   notes: a ninth waits for a place, and until then stays if it is nobody's
//   overtone.
// - Tone is a gain per bin on the wet signal, over 500 Hz only: up to 6 dB
//   an octave of cut (turned down) or of boost (turned up, never more than
//   12 dB). What lies under 500 Hz is left as it is, so a darker tone is
//   not a louder one.
//
// The wet path sums nothing: the plan is made from both sides, but each
// side's bins only ever go to that side, so a silent side stays silent.
// Nothing is held and nothing feeds back; what goes above half the sample
// rate or below nought is dropped. The wet signal passes a clip that is
// linear up to ±1 and never passes ±2.
//
// Storage: three Stft<4096, 1024> (176 KB each), seventeen arrays of 2049
// floats, the peaks, the plan and a frame's weights: 0.72 MB.

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
  // The plan is made a quarter hop after the frame ends, between the right side's being heard and
  // its being written.
  static constexpr int kPlanStagger = Stft::kMaxStagger / 2;

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
    listen_.init();
    stft_[0].init(kPlanStagger);
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
    Heard& heard = heard_;
    for (int k = 0; k < kBins; ++k) {
      heard.last_re[0][k] = heard.last_re[1][k] = 0.0f;
      heard.last_im[0][k] = heard.last_im[1][k] = 0.0f;
      right_re_[k] = right_im_[k] = 0.0f;
      heard.turn[k] = heard.apart[k] = heard.stay_turn[k] = 0.0f;
      heard.held[k] = heard.slow[k] = heard.mean[k] = 0.0f;
    }
    for (int j = 0; j < kPivots; ++j) clear_pivot(heard, j);
    heard.pivot_bin = Stft::hz_to_bin(param(kPivot), sr);
    heard.note_bin = 0.0f;
    for (int m = 0; m < kMarks; ++m) {
      heard.mark_in[m] = 0.0f;
      heard.mark_out[m] = 0.0f;
      heard.mark_level[m] = 0.0f;
    }
    tone_dirty_ = true;
    rest_gain_ = 1.0f;
    at_rest_ = Stft::hz_to_bin(kAtRestHz, sr);
    settled_frames_ = static_cast<int>(kPivotHeldSeconds * sr / Stft::kHop + 0.5f);
    young_frames_ = static_cast<int>(kYoungSeconds * sr / Stft::kHop + 0.5f);
    struck_frames_ = static_cast<int>(kHeldSeconds * sr / Stft::kHop + 0.5f);
    fallen_frames_ = static_cast<int>(kFallenSeconds * sr / Stft::kHop + 0.5f);
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
  // 2 to 19, the six strongest partials of the newest frame, strongest
  // first: where each came in and where it was sent, in hertz (the middle of
  // where the two sides send it; of a partial that is shared, where the
  // greater share went), and its level (1 is a full-scale sine on both
  // sides). Asleep, and for a mark with no partial, the level is 0;
  // 20, the lowest note being played now in hertz, with Follow on or off
  // (Width works around it either way), and 0 while there is none.
  float meter(int index) const {
    using namespace warp;
    const bool asleep = idle_.asleep();
    if (index == 0) return asleep ? param(kStretch) : stretch_now_;
    const Heard& heard = heard_;
    if (index == 1) {
      if (asleep) return param(kFollow) >= 0.5f ? 0.0f : param(kPivot);
      return Stft::bin_to_hz(heard.pivot_bin, sample_rate());
    }
    if (index == 2 + 3 * kMarks) return asleep ? 0.0f : Stft::bin_to_hz(heard.note_bin, sample_rate());
    const int mark = (index - 2) / 3;
    if (index < 2 || mark >= kMarks || asleep) return 0.0f;
    const int what = (index - 2) % 3;
    if (what == 2) return heard.mark_level[mark];
    return Stft::bin_to_hz(what == 0 ? heard.mark_in[mark] : heard.mark_out[mark], sample_rate());
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      listen_.skip(frames);   // the frame clock, and the drift read from it, run on through the sleep
      stft_[0].skip(frames);
      stft_[1].skip(frames);
      clock_ += static_cast<uint32_t>(frames);
      snap_mix();  // a knob moved while asleep does not glide in
      for (int m = 0; m < kMarks; ++m) heard_.mark_level[m] = 0.0f;
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A frame's three pieces of work, each a quarter hop after the last: the right side heard,
      // the plan made from both sides and the left side written, the right side written.
      listen_.analyse(in[1], [this](const float* re, const float* im) { hear(re, im); });
      float wet[2];
      wet[0] = stft_[0].process(in[0], [this](float* re, float* im) {
        plan(re, im);
        write(0, re, im);
      });
      wet[1] = stft_[1].process(in[1], [this](float* re, float* im) {
        next_mix();
        write(1, re, im);
      });
      // Mix. Each frame was made for the Mix there was when it was taken (a partial at rest is
      // turned down for it, see plan()), and four frames overlap in what is heard: the tangent
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
  // comes and goes: its partial is looked for during kHeldSeconds when it is covered, and while it
  // sounds its place is given up to nothing (a click is strong everywhere for a frame). A pivot is
  // weighed by its level for as long as a level is held (kPivotHeldSeconds: a partial that beats
  // shows what it is only once it and its note have been through a swell). After that it is given
  // up on a harmonic only when it has itself fallen, 6 dB under what it held for kFallenSeconds,
  // and is then no more than an overtone by its level: a note that grows louder under it takes
  // nothing from it. And a steady partial (not freshly struck, its bins having averaged 70 % of
  // what they held over kSteadySeconds: it has sounded for half a second) on a harmonic of a note
  // that is only now arriving was there before that note: it gets a pivot from 36 dB under the
  // loudest, and stays.
  static constexpr float kFallenPower = 0.25f;
  static constexpr float kFallenSeconds = 1.0f;
  static constexpr float kSteadyShare = 0.7f;
  static constexpr float kSteadySeconds = 0.4f;

  // What has been heard, of both sides together, and what has been made of it so far.
  struct Heard {
    float last_re[2][kBins], last_im[2][kBins];  // each side's previous frame
    float turn[kBins];                     // each input bin's added angle, in turns, [-0.5, 0.5): what the sides share
    float apart[kBins];                    // Width: the right side is this much further on and the left as much back
    float stay_turn[kBins];                // the same as `turn` for the share of a partial that stays
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
    float note_bin;                        // the lowest note being played, in bins (0: none)
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

  static void clear_pivot(Heard& heard, int j) {
    heard.pivots[j] = 0.0f;
    heard.pivot_power[j] = 0.0f;
    heard.pivot_held[j] = 0.0f;
    heard.struck_over[j] = 0.0f;
    heard.age[j] = 0;
    heard.quiet[j] = 0;
    heard.gone[j] = 0;
    heard.on_harmonic[j] = false;
    heard.first[j] = false;
    heard.fresh[j] = false;
  }

  // The notes being played, each a pivot (with Follow on what the stretch is about, and with Follow
  // on or off what Width works around). From this frame's peaks (peak_bin_, peak_true_,
  // peak_power_, peak_before_, peak_fresh_, peak_steady_, peak_slow_, `peaks_` of them, lowest
  // first) and the pivots there were, in three passes:
  // 1. Every pivot goes to its partial: the nearest peak within half a semitone that is within
  //    36 dB of the strongest partial and of what the pivot has held (so it does not wander off
  //    onto noise when its note has stopped). One that has lasted kYoungSeconds and finds none is
  //    looked for during kHeldSeconds more (it is covered, or between two frames); then the
  //    place is free.
  // 2. A pivot that lies on a harmonic of another is weighed. It is a note by its level when it
  //    holds kNoteRatioOff over the n-th harmonic of a sawtooth on that pivot. One that was struck
  //    on the harmonic stays while its partial stands kStruckOver over what was there before it,
  //    and kHeldSeconds more; a new one stays if it is a note by its level, or was there first;
  //    one that has lasted kPivotHeldSeconds stays until it has itself fallen. A pivot that is on
  //    no harmonic when it has lasted that long is a note of its own, and is not weighed again:
  //    a held note keeps its pitch whatever is played under it.
  // 3. A partial without a pivot gets one: when it is no harmonic of a pivot and within 18 dB of
  //    the strongest; on a harmonic, when it is too strong for an overtone (kNoteRatio, by the
  //    levels both have held), when it has just been struck and the pivot under it has not (a
  //    melody note on a harmonic of a held bass), or when it is steady and the pivot under it is
  //    only now arriving (it was there first). It takes a free place, or the place of the weakest
  //    pivot that is new or whose partial has gone.
  void track(Heard& heard) const {
    float strongest = 0.0f;
    for (int i = 0; i < peaks_; ++i) strongest = kit::max(strongest, peak_power_[i]);
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = heard.pivots[j];
      if (!(pivot > 0.0f)) continue;
      float nearest = 0.0f;
      float distance = pivot * kSameNote + 0.5f;
      heard.pivot_power[j] = 0.0f;
      heard.fresh[j] = false;
      for (int i = 0; i < peaks_; ++i) {
        const float off = std::fabs(peak_true_[i] - pivot);
        const bool sounds = peak_power_[i] >= strongest * kReleasePower && peak_power_[i] >= heard.pivot_held[j] * kReleasePower;
        if (off <= distance && sounds) {
          distance = off;
          nearest = peak_true_[i];
          heard.pivot_power[j] = peak_power_[i];
          heard.fresh[j] = peak_fresh_[i] != 0;
        }
      }
      const bool lasted = heard.age[j] >= young_frames_;
      heard.pivot_held[j] = kit::max(heard.pivot_power[j], heard.pivot_held[j] * pivot_decay_);
      if (nearest > 0.0f) {
        heard.pivots[j] = nearest;
        heard.gone[j] = 0;
      } else if (lasted && ++heard.gone[j] <= struck_frames_) {
        // (covered by something louder, or between two frames: it is looked for a while longer)
      } else {
        clear_pivot(heard, j);  // the note has gone: the place is free
      }
    }
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = heard.pivots[j];
      if (!(pivot > 0.0f)) continue;
      // (it is weighed by its level until it has held for as long as a level is held: a partial
      // that beats shows what it is only once it and its note have each been through a swell)
      const bool unsettled = heard.age[j] < settled_frames_;
      if (unsettled) ++heard.age[j];
      if (!unsettled && !heard.on_harmonic[j]) continue;
      heard.pivots[j] = 0.0f;  // out of the way while it is weighed against the others
      int harmonic = 0;
      const int owner = pivot_for(heard, pivot, &harmonic);
      heard.pivots[j] = pivot;
      if (owner >= 0 && harmonic == 1) {
        clear_pivot(heard, j);  // two on one partial: one is enough
        continue;
      }
      if (owner < 0 || harmonic < 2) {
        // (no longer on anything's harmonic: a note of its own from here on)
        heard.on_harmonic[j] = false;
        heard.struck_over[j] = 0.0f;
        continue;
      }
      if (!heard.on_harmonic[j]) heard.quiet[j] = 0;
      heard.on_harmonic[j] = true;
      const float n2 = static_cast<float>(harmonic) * static_cast<float>(harmonic);
      const float line = kNoteRatioOff * kNoteRatioOff * heard.pivot_held[owner];
      const bool note = heard.pivot_held[j] * n2 >= line;
      if (heard.struck_over[j] > 0.0f) {
        // Struck on a held note's harmonic: a note while it stands over what was there before it,
        // and after that only if it is one by its level.
        heard.quiet[j] = heard.pivot_power[j] > kStruckOver * heard.struck_over[j] ? 0 : heard.quiet[j] + 1;
        if (heard.quiet[j] <= struck_frames_ || note) continue;
      } else if (unsettled) {
        if (note || heard.first[j]) continue;
      } else {
        // It has lasted: it goes only when it has fallen, and what it holds is an overtone's worth.
        heard.quiet[j] = heard.pivot_power[j] < kFallenPower * heard.pivot_held[j] ? heard.quiet[j] + 1 : 0;
        if (heard.quiet[j] <= fallen_frames_ || note) continue;
      }
      clear_pivot(heard, j);
    }
    for (int i = 0; i < peaks_; ++i) {
      const float place = peak_true_[i];
      const float power = peak_power_[i];
      if (power < strongest * kReleasePower) continue;
      int harmonic = 0;
      const int owner = pivot_for(heard, place, &harmonic);
      const bool overtone = owner >= 0 && harmonic >= 2;
      if (owner >= 0 && harmonic == 1) continue;  // it has its pivot
      float over = 0.0f;
      bool first = false;  // it was there before the note whose harmonic it lies on
      if (overtone) {
        const float n2 = static_cast<float>(harmonic) * static_cast<float>(harmonic);
        if (peak_steady_[i] != 0 && heard.fresh[owner] && heard.age[owner] < young_frames_) {
          first = true;
        } else if (peak_slow_[i] * n2 < kNoteRatio * kNoteRatio * heard.pivot_held[owner]) {
          const bool struck = peak_fresh_[i] != 0 && !heard.fresh[owner] && heard.age[owner] >= young_frames_;
          if (!struck) continue;
          over = kit::max(peak_before_[i], kPeakFloor);
        }
      }
      if (!first && power < strongest * kAcquirePower) continue;
      // A free place, or the place of the weakest that gives way to a stronger partial: one that
      // is new, or whose partial has gone. A pivot that has lasted and still sounds gives way to
      // nothing: a ninth note waits for a place. (A click is strong everywhere for a frame and
      // throws every reading of pitch out by a few hertz, so that for a frame a held note's own
      // overtone looks like a new note: it must not take the place of a soft note.)
      int free = -1, weakest = -1;
      for (int j = 0; j < kPivots; ++j) {
        if (!(heard.pivots[j] > 0.0f)) {
          free = j;
          break;
        }
        const bool gives = heard.age[j] < young_frames_ || heard.gone[j] > 0;
        if (gives && (weakest < 0 || heard.pivot_held[j] < heard.pivot_held[weakest])) weakest = j;
      }
      if (free < 0 && weakest >= 0 && power > heard.pivot_held[weakest]) free = weakest;
      if (free >= 0) {
        clear_pivot(heard, free);
        heard.pivots[free] = place;
        heard.pivot_power[free] = power;
        heard.pivot_held[free] = power;
        heard.on_harmonic[free] = overtone;
        heard.struck_over[free] = over;
        heard.fresh[free] = peak_fresh_[i] != 0;
        heard.first[free] = first;
      }
    }
  }

  // The pivot (its place in heard.pivots) a partial at `place` bins is warped around, with
  // Follow on: the pivot it is a harmonic of (within half a semitone; of several, the one it is
  // the lowest harmonic of), which `harmonic` then numbers; failing that the nearest pivot under
  // it, with `harmonic` 0. -1 when it lies under every pivot, or there is none: such a partial
  // is warped around the knob.
  static int pivot_for(const Heard& heard, float place, int* harmonic) {
    int fits = -1, under = -1;
    int number = 1 << 30;
    for (int j = 0; j < kPivots; ++j) {
      const float pivot = heard.pivots[j];
      if (!(pivot > 0.0f)) continue;
      const float ratio = place / pivot;
      if (ratio < 1.0f - kSameNote) continue;
      if (under < 0 || pivot > heard.pivots[under]) under = j;
      const float n = std::floor(ratio + 0.5f);
      if (std::fabs(ratio - n) <= kSameNote * ratio && static_cast<int>(n) < number) {
        number = static_cast<int>(n);
        fits = j;
      }
    }
    *harmonic = fits >= 0 ? number : 0;
    return fits >= 0 ? fits : under;
  }

  // The right side's frame, heard when it ends: kept for the plan, which is made a quarter hop
  // later when the left side's own work comes.
  void hear(const float* re, const float* im) {
    for (int k = 0; k < kBins; ++k) {
      right_re_[k] = re[k];
      right_im_[k] = im[k];
    }
  }

  // The right side's work is the moment a frame begins to be heard: there its Mix joins the four
  // in flight (see process()).
  void next_mix() {
    for (int j = Stft::kOverlap - 1; j > 0; --j) mix_tan_[j] = mix_tan_[j - 1];
    mix_tan_[0] = rest_gain_;
    mix_steady_ = mix_tan_[1] == mix_tan_[0] && mix_tan_[2] == mix_tan_[0] && mix_tan_[3] == mix_tan_[0];
    if (mix_steady_) mix_gains(mix_tan_[0]);
  }

  // Lean's weight on the stretch for a partial `octaves` from what it is stretched about: r runs
  // from 0 there to 1 far from it (a half at kLeanOctaves).
  static float lean_weight(float octaves, float lean) {
    const float x = octaves * (1.0f / kLeanOctaves);
    const float r = x * x / (1.0f + x * x);
    return lean >= 0.0f ? 1.0f - lean * (1.0f - r) : 1.0f + lean * r;
  }

  // One frame of both sides, read together: the left side's bins in `re` and `im`, the right
  // side's as hear() kept them. Makes the plan write() carries out on each side: every peak's
  // region, how far each side moves it and by what angle it is turned. Parameters are read here,
  // once per frame; the overlap crossfades a change.
  void plan(const float* re, const float* im) {
    using namespace warp;
    Heard& heard = heard_;
    const float sr = sample_rate();
    if (tone_dirty_) update_tone();

    // The stretch: the knob and the drift; and what Width puts each side's exponent under or over
    // the middle one.
    const float centre = param(kStretch) + param(kDrift) * kDriftDepth * wander(stft_[0].frame());
    stretch_now_ = centre;
    const float half = param(kWidth) * kWidthDepth;
    const float lean = param(kLean);
    const float exponent = std::exp2(centre) - 1.0f;     // e - 1
    const float wider[2] = {half > 0.0f ? std::exp2(centre - half) - 1.0f - exponent : 0.0f,
                            half > 0.0f ? std::exp2(centre + half) - 1.0f - exponent : 0.0f};
    const float shift = param(kShift) * (1.0f / 12.0f);  // octaves
    // What a region at rest is turned down by. Mix is an equal-power crossfade, which is right for
    // partials that have moved (they add to the dry ones as power) and 3 dB too much at the centre
    // for one that has not (it adds to its dry self as amplitude). With (1 - cos) / sin on those,
    // dry × cos + wet × sin is the partial as it came in, at every Mix. Read here for both sides;
    // it joins the four in flight when the right side is written (next_mix()).
    rest_gain_ = mix_tangent();

    // 1. Power, the two sides' mean (a sound that is the same on both sides reads as either side
    //    alone would), and the peaks: a bin over its two neighbours on either side.
    const float* const lre = heard.last_re[0];
    const float* const lim = heard.last_im[0];
    const float* const rre = heard.last_re[1];
    const float* const rim = heard.last_im[1];
    for (int k = 0; k < kBins; ++k) {
      power_[k] = 0.5f * (re[k] * re[k] + im[k] * im[k] + (right_re_[k] * right_re_[k] + right_im_[k] * right_im_[k]));
    }
    peaks_ = 0;
    for (int k = 2; k < kBins - 2; ++k) {
      const float p = power_[k];
      if (p > kPeakFloor && p > power_[k - 1] && p > power_[k - 2] && p >= power_[k + 1] && p >= power_[k + 2]) {
        // Its true place in bins, from the turn since the last frame, the two sides' turns
        // weighed by their power; a peak that was not there a frame ago (an onset) is taken at
        // its bin's centre.
        float place = static_cast<float>(k);
        // Freshly struck: its power is more than twice what its bins have held of late (a note
        // coming into the frame grows thirty times, then three, then levels off).
        float before = heard.held[k];
        for (int j = k - 2; j <= k + 2; ++j) before = kit::max(before, heard.held[j]);
        peak_before_[peaks_] = before;
        peak_fresh_[peaks_] = p > kFreshRise * before;
        // Steady: not freshly struck, and its bins have averaged most of what they held for a while.
        const float mean = kit::max(heard.mean[k], kit::max(heard.mean[k - 1], heard.mean[k + 1]));
        peak_steady_[peaks_] = p <= kFreshRise * before && mean >= kSteadyShare * before;
        if (0.5f * (lre[k] * lre[k] + lim[k] * lim[k] + (rre[k] * rre[k] + rim[k] * rim[k])) > 1.0e-4f * p) {
          const float sine = im[k] * lre[k] - re[k] * lim[k] + (right_im_[k] * rre[k] - right_re_[k] * rim[k]);
          const float cosine = re[k] * lre[k] + im[k] * lim[k] + (right_re_[k] * rre[k] + right_im_[k] * rim[k]);
          place = kit::clamp(Stft::advance_to_bin(k, kit::fast_atan2(sine, cosine)), place - 1.0f, place + 1.0f);
        }
        // A partial between two bins reads up to 1.4 dB low in the nearer one (the Hann window's
        // main lobe, sin(πd) / (πd (1 - d²)) at d bins off): made up, so that levels are weighed
        // as they are and not by where a partial falls among the bins.
        const float off = place - static_cast<float>(k);
        const float lobe = 1.0f - off * off * (0.645f - 0.16f * off * off);
        peak_power_[peaks_] = p / (lobe * lobe);
        float slow = peak_power_[peaks_];
        for (int j = k - 2; j <= k + 2; ++j) slow = kit::max(slow, heard.slow[j]);
        peak_slow_[peaks_] = slow;
        peak_bin_[peaks_] = static_cast<int16_t>(k);
        peak_true_[peaks_] = place;
        ++peaks_;
        k += 2;  // the next two cannot be peaks
      }
    }
    for (int k = 0; k < kBins; ++k) {
      heard.last_re[0][k] = re[k];
      heard.last_im[0][k] = im[k];
      heard.last_re[1][k] = right_re_[k];
      heard.last_im[1][k] = right_im_[k];
    }

    if (peaks_ == 0) {
      // A frame of silence: the angles, what the bins held and the notes that were followed are
      // forgotten, so what comes after a silence starts as it would after init (a sleep is only
      // ever entered past such a frame, so it makes no difference whether the device slept).
      for (int k = 0; k < kBins; ++k) {
        heard.turn[k] = 0.0f;
        heard.apart[k] = 0.0f;
        heard.stay_turn[k] = 0.0f;
        heard.held[k] = 0.0f;
        heard.slow[k] = 0.0f;
        heard.mean[k] = 0.0f;
      }
      for (int j = 0; j < kPivots; ++j) clear_pivot(heard, j);
    }

    // The notes being played. With Follow on they are the pivots; with it off the knob is, and the
    // notes are still what Width works around.
    const float knob_bin = Stft::hz_to_bin(param(kPivot), sr);
    const bool follow = param(kFollow) >= 0.5f;
    track(heard);
    if (peaks_ > 0) {
      for (int k = 0; k < kBins; ++k) {
        heard.held[k] = kit::max(power_[k], heard.held[k] * held_decay_);
        heard.slow[k] = kit::max(power_[k], heard.slow[k] * pivot_decay_);
        heard.mean[k] += (power_[k] - heard.mean[k]) * mean_step_;
      }
      for (int i = 0; i < peaks_; ++i) heard.slow[peak_bin_[i]] = kit::max(heard.slow[peak_bin_[i]], peak_power_[i]);
    }
    // (for the display: the lowest note there is, and with no note yet, none; the pivot in use is
    // the knob with Follow off and that note with it on)
    heard.note_bin = 0.0f;
    for (const float pivot : heard.pivots) {
      if (pivot > 0.0f && (!(heard.note_bin > 0.0f) || pivot < heard.note_bin)) heard.note_bin = pivot;
    }
    heard.pivot_bin = follow ? heard.note_bin : knob_bin;
    const float log2_knob = std::log2(knob_bin);
    const float home = shift == 0.0f ? 1.0f : std::exp2(shift);

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
      region_end_[i] = static_cast<int16_t>(high);
      const float place = peak_true_[i];
      // The note this partial is an overtone of, how far over it in octaves, and how much of the
      // partial is a note itself: one on a harmonic that is too strong for an overtone (see
      // kNoteRatio), or a steady one under a note that is only now arriving (it was there before
      // it). A note's own partial and one that is nobody's overtone are no octaves over anything.
      int harmonic = 0;
      const int owner = pivot_for(heard, place, &harmonic);
      float over = 0.0f;
      float note = 0.0f;
      if (owner >= 0 && harmonic >= 2) {
        over = std::log2(place / heard.pivots[owner]);
        const float held = heard.pivot_held[owner];
        const float rho = held > 0.0f ? static_cast<float>(harmonic) * std::sqrt(peak_slow_[i] / held) : kNoteRatio;
        note = kit::clamp((rho - kOvertoneRatio) * (1.0f / (kNoteRatio - kOvertoneRatio)), 0.0f, 1.0f);
        if (peak_steady_[i] != 0 && heard.fresh[owner] && heard.age[owner] < young_frames_) note = 1.0f;
      }
      // What the stretch is about. With Follow on a partial moves only as the overtone of a note,
      // by its distance from that note, and the share of it that is a note itself stays. With
      // Follow off every partial moves by its distance from the knob.
      const float about = follow ? over : std::log2(place) - log2_knob;
      float stays = follow ? note : 0.0f;
      // An attack passes as it came. A partial that has just been struck lies in a frame the note
      // only partly fills, and a region cut from such a frame and moved rings before the attack
      // (the frame is 85 ms long): -6 to -30 dB in the 10 ms before it, measured. Left where it
      // is, it adds up with its neighbours to the attack itself, and the partial goes to its new
      // place over the two frames that follow: about 20 ms after the attack it is half there, by
      // 40 ms wholly, and what rings before the attack is 50 dB under it or less.
      if (peak_fresh_[i] != 0) stays = 1.0f;
      // g(place) = pivot × 2^(octaves × (1 + (e - 1) w) + shift) = place × 2^(octaves × (e - 1) w +
      // shift): written the second way, a region that is not to move has a move of exactly nought.
      const float middle = about * exponent * lean_weight(about, lean) + shift;
      // Width: each side's exponent differs from the middle one, and that difference works on an
      // overtone's distance from its own note, whatever the stretch is about. So an overtone lands
      // lower on the left and higher on the right, and a note's own partial (and with Follow off
      // the share of a partial that is a note itself) lands in one place on both.
      const float spread = half > 0.0f ? over * lean_weight(over, lean) * (follow ? 1.0f : 1.0f - note) : 0.0f;
      const float left_ratio = std::exp2(middle + spread * wider[0]);
      const float right_ratio = spread != 0.0f ? std::exp2(middle + spread * wider[1]) : left_ratio;
      float lands = place * (0.5f * (left_ratio + right_ratio));
      if (stays < 1.0f) {
        turn_moved(i, low, high, k, place, left_ratio, right_ratio, std::sqrt(1.0f - stays));
      } else {
        moved_gain_[0][i] = moved_gain_[1][i] = 0.0f;
        for (int j = low; j < high; ++j) heard.turn[j] = heard.apart[j] = 0.0f;
      }
      // The share that stays is not warped; Shift still moves it, as it moves a pivot.
      if (stays > 0.0f) {
        turn_staying(i, low, high, k, place * (home - 1.0f), place * home, std::sqrt(stays));
        if (stays > 0.5f) lands = place * home;
      } else {
        stays_gain_[i] = 0.0f;
        for (int j = low; j < high; ++j) heard.stay_turn[j] = 0.0f;
      }

      // The strongest few, for the display.
      const float p = power_[k];
      if (marks < kMarks || p > mark_power[kMarks - 1]) {
        int at = marks < kMarks ? marks++ : kMarks - 1;
        for (; at > 0 && mark_power[at - 1] < p; --at) {
          mark_power[at] = mark_power[at - 1];
          heard.mark_in[at] = heard.mark_in[at - 1];
          heard.mark_out[at] = heard.mark_out[at - 1];
        }
        mark_power[at] = p;
        heard.mark_in[at] = place;
        heard.mark_out[at] = lands;  // (the middle of the two sides; of a shared partial, where the greater share goes)
      }
      low = high;
    }
    for (int m = 0; m < kMarks; ++m) {
      heard.mark_level[m] = m < marks ? std::sqrt(mark_power[m]) * (1.0f / Stft::kFullScale) : 0.0f;
    }
  }

  // The angle a region is turned by: what the bin under the peak carried, on by a quarter of the
  // move in turns (Hop / Frame), wrapped. At rest it falls back to nought.
  float turned(float turn, float move) const {
    if (move == 0.0f) {
      turn *= kRestDecay;
      return std::fabs(turn) < 1.0e-6f ? 0.0f : turn;
    }
    turn += move * (1.0f / Stft::kOverlap);
    return turn - std::floor(turn + 0.5f);
  }

  // Whether a region whose peak lands at `target` bins is written at all: past the ends of the
  // spectrum it is dropped.
  static bool on_spectrum(float target) { return target >= 0.5f && target <= static_cast<float>(kBins - 2); }

  // The moved share of peak `i` (bins [low, high), its peak at bin `peak` and truly at `place`),
  // `gain` of it: how far each side moves it and the angle each side turns it by, into the plan.
  // The angle is kept as what the sides share (the mean of their moves, added up) and half of what
  // they are apart (half the difference of their moves, added up): while the two moves are the
  // same, what they are apart falls back to nought, so the sides are in step again a few frames
  // after Width has come to 0, and a note's own partial is never out of step at all.
  void turn_moved(int i, int low, int high, int peak, float place, float left_ratio, float right_ratio, float gain) {
    Heard& heard = heard_;
    float left = place * (left_ratio - 1.0f);
    float right = place * (right_ratio - 1.0f);
    // At rest when neither side moves it by a quarter of a hertz.
    if (std::fabs(left) < at_rest_ && std::fabs(right) < at_rest_) left = right = 0.0f;
    const float turn = turned(heard.turn[peak], 0.5f * (left + right));
    const float apart = turned(heard.apart[peak], 0.5f * (right - left));
    for (int k = low; k < high; ++k) {
      heard.turn[k] = turn;
      heard.apart[k] = apart;
    }
    moved_move_[0][i] = left;
    moved_move_[1][i] = right;
    moved_turn_[0][i] = turn - apart;
    moved_turn_[1][i] = turn + apart;
    moved_gain_[0][i] = on_spectrum(place * left_ratio) ? gain : 0.0f;
    moved_gain_[1][i] = on_spectrum(place * right_ratio) ? gain : 0.0f;
  }

  // The share of peak `i` that stays, `gain` of it: moved by Shift alone (`move` bins, to land at
  // `target`), the same on both sides, with an angle of its own.
  void turn_staying(int i, int low, int high, int peak, float move, float target, float gain) {
    Heard& heard = heard_;
    if (std::fabs(move) < at_rest_) move = 0.0f;
    const float turn = turned(heard.stay_turn[peak], move);
    for (int k = low; k < high; ++k) heard.stay_turn[k] = turn;
    stays_move_[i] = move;
    stays_turn_[i] = turn;
    stays_gain_[i] = on_spectrum(target) ? gain : 0.0f;
  }

  // The plan carried out on one side's frame: kBins bins, changed in place.
  void write(int side, float* re, float* im) {
    int low = 0;
    for (int i = 0; i < peaks_; ++i) {
      const int high = region_end_[i];
      if (moved_gain_[side][i] > 0.0f) put(re, im, low, high, moved_move_[side][i], moved_turn_[side][i], moved_gain_[side][i]);
      if (stays_gain_[i] > 0.0f) put(re, im, low, high, stays_move_[i], stays_turn_[i], stays_gain_[i]);
      low = high;
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

  // Bins [low, high) of this frame added to the output `move` bins higher (not a whole number),
  // `gain` of them, turned by `turn`.
  void put(const float* re, const float* im, int low, int high, float move, float turn, float gain) {
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

  Stft stft_[2];                    // the two sides: analysis, the plan carried out, resynthesis
  Stft listen_;                     // the right side heard ahead of the plan: analysis only
  Heard heard_;
  float right_re_[kBins], right_im_[kBins];  // the right side's newest frame, for the plan
  float power_[kBins];              // the two sides' mean power
  int16_t region_end_[kMaxPeaks];   // the plan: where each peak's region ends (the next begins there)
  float moved_move_[2][kMaxPeaks];  // how far each side moves the moved share, in bins (0: at rest)
  float moved_turn_[2][kMaxPeaks];  // the angle each side turns it by, in turns
  float moved_gain_[2][kMaxPeaks];  // how much of the partial it is (0: none of it, or thrown off the spectrum)
  float stays_move_[kMaxPeaks];     // the same for the share that stays, one for both sides
  float stays_turn_[kMaxPeaks];
  float stays_gain_[kMaxPeaks];
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
  int settled_frames_ = 70;   // kPivotHeldSeconds in frames
  int struck_frames_ = 14;    // kHeldSeconds in frames
  int fallen_frames_ = 47;    // kFallenSeconds in frames
  float mean_step_ = 0.05f;   // the share of a frame in a bin's average
  float held_decay_ = 0.93f;  // what a bin's held power falls to in a frame
  float pivot_decay_ = 0.99f; // and a pivot's
  float rest_gain_ = 1.0f;    // this frame's gain for a region at rest
  float stretch_now_ = 0.0f;  // for meter() only
  bool tone_dirty_ = true;
};

}  // namespace livemix
