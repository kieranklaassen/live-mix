#pragma once

// Sine Shadow: the strongest partials of the sound, each replayed by one pure
// sine oscillator that swells in behind it and lingers after it.
//
//   in ──┬───────────────────────────────────────────────► dry ──┐
//        │                                                       (mix: the shadow under the sound) ──► out
//        └─► spectra ─► peaks ─► followed partials ─► sines ─► ceiling ─► wet ──┘
//            (kit::Stft,         (matched frame       (one oscillator
//             analysis only)      to frame)            per partial)
//
// - The spectrum is only measured (Stft::analyse), never resynthesised: the
//   shadow is made by oscillators, so the device adds no latency and the dry
//   path is the input itself. Both channels are measured, on the same frames,
//   and a partial is a peak of their summed power: a sound that is out of
//   phase between the sides casts the same shadow as one that is not.
// - Three frames look at the sound, because no one length sees everything.
//   The middle one (85 ms, bins 12 Hz wide) is where partials are looked for
//   first. Two tones nearer than three of its bins are one lump there (a
//   second or a third in the low octaves): the fine frame (a third of a
//   second, bins 3 Hz wide, of the sound below 1.2 kHz taken down to an
//   eighth of the rate) tells tones apart from 9 Hz. A partial that moves
//   faster than the middle frame can hold still (wide vibrato, a glide) is
//   smeared over many of its bins: the quick frame (21 ms, bins 47 Hz wide,
//   from 300 Hz up) follows it. What the middle frame is sure of it keeps;
//   the other two speak where it is not, and the fine one where it is sure
//   of a lump that is two tones (merge()); the fine one keeps quiet about
//   one tone on its own, whose movement it shows late and as lines. Tones
//   nearer than 9 Hz are one sine at the pitch between them, that swells
//   and falls as they beat.
// - Each peak is gathered over a stretch of bins as wide as its pitch asks
//   (a partial with vibrato spreads over more bins the higher it lies). It is
//   a partial when it was there in the frame before: its frequency is the
//   turn its phase made between the two (Stft::advance_to_bin), summed over
//   the stretch and both channels. How far those turns agree says how sure
//   the pitch is: a sine is born only from a sure peak, and Steady counts the
//   sure frames a partial has had. That, and not a mask, is what keeps noise
//   and the splash of an attack out. The Partials strongest are followed; one
//   that is followed keeps its place until another is kKeep times as strong,
//   so two partials of about one level do not trade places every frame.
// - A sine follows its partial's level through an attack and a release of its
//   own, and its frequency through Glide (after its first few frames, in
//   which it takes the pitch as measured). When the partial is lost the sine
//   lingers (Release) at the pitch it had; if the partial comes back while it
//   still sounds, the same sine takes it up again. A new sine starts at the
//   pitch of the nearest sine still sounding and glides from there.
// - A sine at its partial's own pitch (Transpose at zero, and Snap at zero or
//   the partial within 3 cents of its note) keeps a quarter turn from the
//   partial's phase (a slow phase lock, on one side or the other by the
//   note), so sound and shadow add as powers at every Mix: a held tone can
//   neither cancel against its shadow nor double with it. A sine that
//   Transpose has put on another partial of the sound (an octave up is the
//   second harmonic) takes that partial's pitch and keeps a quarter turn
//   from it in the same way. A sine that Snap has pulled off its partial
//   beats against it, as two tones do.
// - Mix brings the shadow in under the sound (mix_gains): the sound is whole
//   up to half way, so a note starts as it was played and the shadow swells
//   in behind it; past half way the sound gives way to the sines.
// - The ceiling holds the sum of the sines' levels on either side at
//   kCeiling less the room the sound itself takes at this Mix, by a gain on
//   the whole shadow and not by a waveshaper: however many sines linger, a
//   full-scale sound and its shadow together stay under kCeiling, the shadow
//   stays pure, and every sine keeps its place among the others (a quiet one
//   under forty loud ones is taken down by what they all are).
// - Above 60 kHz the sound is taken down to half the rate before it is
//   measured (partials are looked for up to 12 kHz only), so the frames are
//   the same lengths in time, the bins the same widths in hertz and a
//   frame's work the same at 96 kHz as at 48.
//
// Storage: two channels each of Stft<4096, 1024> (176 KB), Stft<2048, 512>
// (88 KB) and Stft<1024, 256> (44 KB), the frames before (three spectra a
// channel), four per-bin tables of 2049 floats, the delay in front of the
// quick frame (2432 samples a channel), the two decimators' rings, the
// record of where the middle frame has been (1 KB) and of the quick frame's
// power (1 KB), and the 48 oscillators. No delay in the sound's path: latency is zero.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class SineShadow : public kit::DeviceBase<sine_shadow::kNumParams> {
 public:
  // The oscillators: as many as can be followed at once, and as many again
  // to linger after their partials have gone.
  static constexpr int kPool = 48;
  // The sines reported to the display, loudest first: a frequency in hertz
  // and a level each (meters 2n and 2n + 1).
  static constexpr int kShown = 24;
  // The sum of the sines' levels on one side never passes this (+6 dB over a
  // full-scale sine; the 24 strongest partials of a full-scale saw sum to 2.4).
  static constexpr float kCeiling = 2.0f;
  // A partial keeps its place among the followed until another is this many
  // times as strong.
  static constexpr float kKeep = 1.4f;
  // A peak belongs to the sine that follows it when it is within this share
  // of its frequency (three quarters of a semitone), or this many bins if that is
  // more.
  static constexpr float kCatchRatio = 0.045f;
  static constexpr float kCatchBins = 0.6f;
  static constexpr float kLeftBehind = 0.5f;
  // What Steady counts as a frame in which a partial held, and what a new
  // sine needs to be born: the turns of its bins agree to kSure (every bin
  // a sine reaches turns by the sine's own advance; on white noise the
  // turns of a peak's bins agree that far once in twenty frames, on a held
  // note nearly always, on a note with vibrato in most).
  static constexpr float kSure = 0.6f;
  // Under this the turns say nothing of the pitch, and from twice this up
  // they are taken at their word.
  static constexpr float kUnsure = 0.2f;
  // The frames a new sine takes its partial's pitch as measured, before
  // Glide begins to smooth it (an eighth of a second).
  static constexpr int kYoung = 6;
  // Snap leaves a partial alone that is within this of its note, in
  // semitones (3 cents).
  static constexpr double kInTune = 0.03;
  static constexpr int kSpare = 4;
  // The longest Steady asks a partial to last, in seconds (at 1; it goes
  // with the square of the control).
  static constexpr float kSteadySeconds = 1.5f;
  // Tone leans by up to 6 dB an octave: above kDarkHz when it leans dark,
  // below kBrightHz when it leans bright. It never raises a partial.
  static constexpr float kDarkHz = 300.0f;
  static constexpr float kBrightHz = 2500.0f;
  // The partials looked for, in hertz of the input.
  static constexpr float kLowestHz = 21.0f;
  static constexpr float kHighestHz = 12000.0f;
  // The fine frame looks up to here, the quick frame from here.
  static constexpr float kFineTopHz = 1200.0f;
  static constexpr float kQuickLowHz = 300.0f;
  // A sine fades out below and above these (its own pitch, after Transpose).
  static constexpr float kFadeInLowHz = 16.0f;
  static constexpr float kFadeInHighHz = 22.0f;
  static constexpr float kFadeOutLowHz = 12000.0f;
  static constexpr float kFadeOutHighHz = 16000.0f;
  // A sine moved by Transpose lands on a partial of the sound that is within
  // this share of its pitch (6 cents: a tempered fifth or fourth is 2 cents
  // from a harmonic, a tempered third 14).
  static constexpr double kLand = 0.0035;
  // The phase lock: the share of the error taken up per frame (less when
  // Glide is longer than a frame: then a frame's share of Glide), only while
  // the partial stands still to kStillBins from one frame to the next, and
  // never by bending the sine more than kLockRatio of its pitch and
  // kLockHz. A partial that moves is followed by Glide alone: a lock that
  // chased it would step the sine's pitch at the frame rate.
  static constexpr float kLock = 0.35f;
  static constexpr float kStillBins = 0.03f;
  static constexpr float kLockRatio = 0.003f;
  static constexpr float kLockHz = 0.4f;

  void init(float sample_rate) {
    using namespace sine_shadow;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // What is measured is the sound at `sr / div_`: the sound itself up to
    // 60 kHz, every other sample of it (after a low-pass) above.
    div_ = sr > 60000.0f ? 2 : 1;
    period_ = Mid::kFrame * div_;
    hop_ = Mid::kHop * div_;
    bin_hz_ = sr / static_cast<float>(period_);
    for (int c = 0; c < 2; ++c) {
      mid_[c].init(c * Mid::kMaxStagger);
      quick_[c].init(c * Quick::kMaxStagger);
      fine_[c].init(c * Fine::kMaxStagger);
      // The fine frames' work is put where no middle frame's is.
      fine_[c].skip(kFineStart);
      for (int k = 0; k < Mid::kBins; ++k) last_re_[c][k] = last_im_[c][k] = 0.0f;
      for (int k = 0; k < kTwoBack; ++k) two_re_[c][k] = two_im_[c][k] = 0.0f;
      for (int k = 0; k < Fine::kBins; ++k) fine_last_re_[c][k] = fine_last_im_[c][k] = 0.0f;
      for (int f = 0; f < 2; ++f) {
        for (int k = 0; k < Quick::kBins; ++k) quick_re_[c][f][k] = quick_im_[c][f][k] = 0.0f;
      }
      for (int n = 0; n < kQuickDelay; ++n) delay_[c][n] = 0.0f;
      for (int n = 0; n < 2 * kFrontTaps; ++n) front_ring_[c][n] = 0.0f;
      for (int n = 0; n < 2 * kFineTaps; ++n) fine_ring_[c][n] = 0.0f;
      mid_re_[c] = mid_im_[c] = last_re_[c];  // all zeros until the first frame
      fine_re_[c] = fine_im_[c] = fine_last_re_[c];
      quick_now_[c] = 0;
    }
    windowed_sinc(front_taps_, kFrontTaps, 2);
    windowed_sinc(fine_taps_, kFineTaps, kFineStep);
    // What a decimator's ring holds back, in samples of the sound: the
    // middle of its taps.
    front_delay_ = div_ == 2 ? 0.5 * (kFrontTaps - 1) : 0.0;
    fine_delay_ = 0.5 * (kFineTaps - 1) * div_ + front_delay_;
    front_at_ = fine_at_ = delay_at_ = 0;
    front_phase_ = fine_phase_ = 0;
    track_in_ = 0;
    clock_ = 0.0;
    mid_start_ = fine_start_ = 0.0;

    mid_band_ = {Mid::kFullScale, 1.0f, kReach, 0, kMostReach,
                 kit::clamp_int(static_cast<int>(std::ceil(kLowestHz / bin_hz_)), 2, Mid::kBins - 3), 0};
    mid_band_.hi = kit::clamp_int(static_cast<int>(kit::min(kHighestHz, 0.45f * sr) / bin_hz_), mid_band_.lo,
                                  Mid::kBins - kMostReach - 3);
    fine_band_ = {Fine::kFullScale, 1.0f / kFinePerMid, 0.0f, 0, 1,
                  kit::clamp_int(static_cast<int>(std::ceil(kLowestHz * kFinePerMid / bin_hz_)), 3, Fine::kBins - 4), 0};
    fine_band_.hi = kit::clamp_int(static_cast<int>(kFineTopHz * kFinePerMid / bin_hz_), fine_band_.lo, Fine::kBins - 4);
    quick_band_ = {Quick::kFullScale, static_cast<float>(kMidPerQuick), kQuickReach, 0, kMostQuickReach,
                   kit::clamp_int(static_cast<int>(std::ceil(kQuickLowHz / (kMidPerQuick * bin_hz_))), 4, Quick::kBins - 8), 0};
    quick_band_.hi = kit::clamp_int(mid_band_.hi / kMidPerQuick, quick_band_.lo, Quick::kBins - kMostQuickReach - 3);
    for (int k = 0; k < Mid::kBins; ++k) {
      power_[k] = 0.0f;
      gathered_[k] = 0.0f;
      weight_[k] = 1.0f;
      log2_hz_[k] = k > 0 ? std::log2(static_cast<float>(k) * bin_hz_) : 0.0f;
    }
    fine_count_ = 0;
    for (int s = 0; s < kSweptCells; ++s) swept_[s] = 0;
    swept_before_count_ = 0;
    for (int l = 0; l < kLevels; ++l) {
      for (int q = 0; q < kQuickSeen; ++q) quick_power_[l][q] = 0.0f;
    }
    for (Voice& v : voices_) v = Voice();
    active_count_ = 0;
    shown_count_ = 0;
    weight_tone_ = -1.0f;
    ceiling_gain_ = 1.0f;
    retune_ = false;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    mix_seen_ = -1.0f;
    ceiling_ = kCeiling;
    slept_ = false;
    pan_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    fade_coeff_ = 1.0f - kit::time_to_coeff(0.002f, sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    retune_ = false;
    // Two and a half fine frames of silence empty every spectrum, this one
    // and the one before: only then is nothing left that a new sound could
    // be measured against, and a sleep leaves nothing behind that waking
    // through the same silence would not.
    idle_.reset(sr, 2.5f * static_cast<float>(Fine::kFrame * kFineStep * div_) / sr);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display: the
  // kShown loudest sines as they sound now, loudest first. Meter 2n is sine
  // n's frequency in hertz and 2n + 1 its level (1 is a full-scale sine),
  // after the ceiling and before Mix. Both are 0 for a place with no sine in
  // it, and for every place while the device sleeps.
  float meter(int index) const {
    if (index < 0 || index >= 2 * kShown) return 0.0f;
    const int place = index >> 1;
    if (place >= shown_count_) return 0.0f;
    const Voice& v = voices_[shown_[place]];
    if (v.state == kFree) return 0.0f;
    return (index & 1) ? v.env * ceiling_gain_ : static_cast<float>(v.inc * sample_rate());
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || active_count_ > 0)) {
      silence_output(frames);
      sleep_through(frames);  // every frame clock runs on through the sleep
      slept_ = true;
      shown_count_ = 0;
      ceiling_gain_ = 1.0f;
      retune_ = false;
      return;
    }
    if (slept_) {
      slept_ = false;
      mix_.snap(mix_.target);  // a knob moved while asleep does not glide in under the first sound
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // What is not a number, or is absurd, is silence: the same rule the
      // spectrum is kept to (kit::Stft), so sound and shadow agree.
      in[0] = guarded(in[0]);
      in[1] = guarded(in[1]);
      if (retune_) {
        retune_ = false;
        for (int n = 0; n < active_count_; ++n) aim(voices_[active_[n]]);
      }
      measure(in[0], in[1]);
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        mix_gains(mix, &dry_gain_, &wet_gain_);
        // The ceiling leaves the sound itself its room: a full-scale sound
        // and its shadow together stay under kCeiling at every Mix.
        const float room = wet_gain_ > 0.0f ? (kCeiling - dry_gain_) / wet_gain_ : kCeiling;
        ceiling_ = room < kCeiling ? room : kCeiling;
      }
      float wet[2];
      render(&wet[0], &wet[1]);
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
      clock_ += 1.0;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Mid = kit::Stft<4096, 1024>;
  using Fine = kit::Stft<2048, 512>;   // of the sound at an eighth of the rate: 16384 samples long
  using Quick = kit::Stft<1024, 256>;
  static constexpr int kFineStep = 8;      // the fine frame takes every eighth sample
  static constexpr int kFinePerMid = 4;    // fine bins in a middle bin
  static constexpr int kMidPerQuick = 4;   // middle bins in a quick bin
  // The decimators: windowed sincs (Blackman), 74 dB down where they must
  // be. In front of the fine frame, 96 taps: flat to 1.6 kHz, down from
  // 4.4 kHz, and what folds onto the band it looks at lies above 4.8 kHz.
  // In front of everything at 96 kHz, 32 taps: flat to 15 kHz, down from
  // 33 kHz, and what folds onto the 12 kHz looked at lies above 36 kHz.
  static constexpr int kFineTaps = 96;
  static constexpr int kFrontTaps = 32;
  // The fine frames' clocks start this many of their samples on, so that
  // their transforms fall between the middle frame's (see measure()).
  static constexpr int kFineStart = 28;
  // The middle frame's tracking is done this many samples after its second
  // transform, in the block after it.
  static constexpr int kDefer = 128;
  // The quick frame sees the sound this much late, so that the turn between
  // its two newest frames is centred where the middle frame's is: a partial
  // handed from one frame to the other keeps its pitch.
  static constexpr int kQuickDelay = Mid::kFrame / 2 + Mid::kHop / 2 + Mid::kMaxStagger + kDefer -
                                     (Quick::kFrame / 2 + Quick::kHop / 2 + Quick::kMaxStagger);  // 2432
  // The middle frame's bins that are kept from two frames back: up to
  // where the fine frame looks (1.5 kHz at 48 kHz).
  static constexpr int kTwoBack = 128;
  static constexpr int kMidPeaks = 48;
  static constexpr int kFinePeaks = 24;
  static constexpr int kQuickPeaks = 24;
  static constexpr int kMaxPeaks = kMidPeaks + kFinePeaks + kQuickPeaks;
  // A sine under this is over: -120 dBFS.
  static constexpr float kSilent = 1.0e-6f;
  // Peaks under this share of the frame's strongest (-60 dB), or under this
  // level (-84 dBFS), are not looked at.
  static constexpr float kRelativeFloor = 1.0e-6f;  // of power
  static constexpr float kAbsoluteFloor = 6.0e-5f;  // of a full-scale sine
  // A peak counts once the frame before held at least a quarter of it there.
  static constexpr float kEstablished = 0.0625f;  // of power
  // A partial's reach in the middle frame: the bins either side of its peak
  // that are gathered into it, this share of the bin's number (12 cents
  // either way, rounded down: none below 1 kHz, where two notes of a chord
  // can be three bins apart) and never more than kMostReach. In the quick
  // frame a bin is four times as wide and a partial moves a sixteenth as
  // far across the bins in a frame: a reach there is for the fastest only.
  static constexpr float kReach = 0.012f;
  static constexpr int kMostReach = 12;
  static constexpr float kQuickReach = 0.02f;
  static constexpr int kMostQuickReach = 4;
  // merge(): a fine peak belongs to the nearest middle peak within this many
  // middle bins (the half width of the middle frame's lobe and a bin).
  static constexpr float kFineNear = 3.0f;
  // It speaks once it has been in doubt this many trackings more than not.
  static constexpr int kFineWait = 4;
  // Fine peaks whose bins are nearer than kFineApart, or that were measured
  // nearer than kFineClear (middle bins: three of the fine frame's, 9 Hz),
  // run into each other and neither is read right, unless the weaker is no
  // more than a side lobe (25 dB down).
  static constexpr int kFineApart = 3;
  static constexpr float kFineClear = 0.75f;
  static constexpr float kNoSideLobe = 0.003f;  // of power
  // The fine peaks of a middle peak may speak for it when they hold this
  // share of its power, and are in doubt when it has not lately passed
  // peaks that hold this share.
  static constexpr float kFineShare = 0.3f;
  // A middle peak passes a fine peak when, sure to kVerySure, it stands
  // within kFineReached middle bins of it or beyond; that counts for kPassed
  // trackings (a quarter of a second: half a turn of a 2 Hz sway).
  static constexpr float kVerySure = 0.7f;
  static constexpr float kFineReached = 0.25f;
  static constexpr int kPassed = 12;
  // The fine frame is a third of a second long and comes late: of a tone
  // that sways slowly it shows where the tone dwelt a moment ago, by when
  // the middle peak has moved on. So the middle frame also keeps where one
  // tone on its own has been in the last kSwept trackings (half a second:
  // the fine frame's length and its lateness), in eighths of a bin: a peak
  // sure to kSweptSure that had one as sure within kSweptStep bins of it
  // the tracking before (tones that beat in the middle frame throw peaks
  // about that are neither). A fine peak that has such places within
  // kSweptNear bins on either side of it (or at it) has been passed as well.
  static constexpr int kSweptPerBin = 8;
  static constexpr int kSweptBins = 128;
  static constexpr int kSweptCells = kSweptBins * kSweptPerBin;
  static constexpr int kSwept = 24;
  static constexpr float kSweptNear = 1.0f;
  static constexpr float kSweptSure = 0.95f;
  static constexpr float kSweptStep = 0.5f;
  // Tones the fine frame tells apart beat in the quick frame, which is too
  // short to hold one beat of them: the power it finds there swings. Where
  // that power (over kOneWide quick bins either side) has kept within
  // kOneTone (2 dB) for the last kLevels trackings (a sixth of a second: one
  // beat of two tones the fine frame can just tell apart) there is one tone
  // on its own, however it moves, and the fine frame's lines about it are
  // that movement's: no doubt of the middle peak. Kept for the quick bins up
  // to kQuickSeen, which is past the fine frame's top.
  static constexpr int kLevels = 8;
  static constexpr float kOneTone = 1.6f;
  static constexpr int kOneWide = 3;
  static constexpr int kQuickSeen = 40;
  // A middle peak is crowded by another within kCrowd bins (the width of its
  // lobe) that is no more than 12 dB weaker: its pitch is pulled, and a fine
  // peak within kFineAgree bins of it (5 Hz) is the better word.
  static constexpr float kCrowd = 4.0f;
  static constexpr float kFineMatch = 0.25f;  // of level
  static constexpr float kFineAgree = 0.4f;
  // A fine peak lasts when it is within this many middle bins (a third of a
  // fine bin) of a sure one in the fine frame before.
  static constexpr float kFineSame = 0.08f;
  // A quick peak is a partial on its own when its stretch holds this many
  // times the power of the bins two beyond it on either side (noise never
  // does; a partial with a neighbour nearer than 230 Hz does not either).
  static constexpr float kStandsOut = 100.0f;
  // A quick peak takes the place of the middle peaks within this many middle
  // bins of it (the half width of its own lobe).
  static constexpr float kQuickNear = 2.0f * kMidPerQuick;
  // The fine frame's peaks stand whole while the middle frame still holds
  // this share of their power over the same stretch (two tones that beat in
  // it dip to half and under), and fall with it below that.
  static constexpr float kThere = 0.3f;
  // The quick frame keeps quiet where the middle frame is sure of this
  // share of what it reads, or the fine frame speaks for that share: tones
  // the fine frame tells apart beat in the quick one, and read up to twice
  // their power there, three of them up to three times.
  static constexpr float kMostly = 0.6f;
  static constexpr float kFineMostly = 0.2f;

  enum State { kFree = 0, kFollowing, kLingering, kFading };
  enum Source { kMid = 0, kFineFrame, kQuickFrame };

  struct Voice {
    int state = kFree;
    int age = 0;           // frames it has followed its partial
    int young = 0;         // frames left in which it takes its partial's pitch as measured
    bool unison = true;    // its pitch is its partial's own: the lock holds its phase
    bool may_land = false; // moved by Transpose and not by Snap: it may land on a partial of the sound
    bool landed = false;   // it has landed on one: it takes that partial's pitch and keeps to its phase
    float land_bin = 0.0f; // that partial's frequency, in bins of the middle frame
    double land_inc = 0.0; // and in cycles per sample
    double aim_inc = 0.0;  // where Transpose and Snap alone would put it, cycles per sample
    int side = 0;          // the channel its phase is read from
    bool still = false;    // its partial stood still since the frame before
    float bin = 0.0f;      // the partial's frequency, in bins of the middle frame
    float step = 0.0f;     // how far it moved since the frame before, in those bins
    float level = 0.0f;    // the partial's level as last measured
    float lean = 1.0f;     // what Tone makes of it
    float band = 1.0f;     // the fade at the ends of the range, at its own pitch
    float angle = 0.0f;    // where the partial lies between the sides, 0 left to π/2 right
    float place = 0.0f;    // where Spread puts the sine, -1 to 1
    float flip = 0.0f;     // 0 or half a turn: which side of its partial's phase it keeps to
    // What the oscillator runs on, sample by sample.
    float env = 0.0f, env_target = 0.0f, env_coeff = 0.0f;
    float gain_left = 1.0f, gain_right = 1.0f, left_target = 1.0f, right_target = 1.0f;
    // Pitch and phase are doubles: a float glide stalls a ten-thousandth
    // short of its pitch at 40 ms (a hundredth at 2 s) and stays there.
    double inc = 0.0, inc_target = 0.0;  // cycles per sample
    double phase = 0.0;                  // cycles
    double goal = 0.0;                   // the phase its partial asks for at the frame, cycles
    float slew = 0.0f;                   // cycles per sample, of lock
  };

  struct Peak {
    int k = 0;       // the bin it peaks in, of its own frame
    int reach = 1;   // bins either side of k that are taken as this partial
    int source = kMid;
    int voice = -1;
    bool chosen = false;
    bool out = false;   // merge(): another frame speaks for it
    bool used = false;  // merge(): this one speaks
    bool lasting = false;  // fine peaks: it stood here, sure, in the fine frame before as well
    bool crowded = false;  // fine peaks: another stands too near for either to be read right
    float power = 0.0f;
    float bin = 0.0f;   // its frequency in bins of the middle frame, whichever frame measured it
    float left = 0.0f, right = 0.0f, level = 0.0f, score = 0.0f;
    float sure = 0.0f;  // how far the turns of its bins agree, 0 to 1
    float away = 0.0f;  // how far the sine that follows it stood from it, in bins of the middle frame
    // Fine peaks only: the partial's phase at the frame's first sample, each
    // side, in cycles.
    float start[2] = {0.0f, 0.0f};
  };

  // One frame's way of looking: its scale, and where and how wide it looks.
  struct Band {
    float full_scale;   // what a full-scale sine reads on a bin's centre
    float to_mid;       // middle bins in one of its bins
    float reach_share;  // a peak's reach, as a share of its bin's number
    int least_reach;    // and at the least (to gather; what is measured is one bin either side at least)
    int most_reach;
    int lo, hi;         // the bins looked through for peaks
  };

  static float guarded(float x) { return (x > -64.0f && x < 64.0f) ? x : 0.0f; }

  // Mix. The shadow comes in under the sound: up to half way the sound is
  // whole (so a note's start is the note's own, to the sample, and the
  // shadow swells in behind it), and the shadow rises to 3 dB under its
  // partials; past half way the sound gives way, and at the top only the
  // sines are left. The shadow's own curve is the equal-power one all the
  // way. A sine keeps a quarter turn from its partial, so the two add as
  // powers: a held note is at most 1.9 dB over itself (at Mix 0.6).
  static void mix_gains(float mix, float* dry_gain, float* wet_gain) {
    const float m = kit::clamp(mix, 0.0f, 1.0f);
    *wet_gain = m > 0.0f ? std::sin(m * kit::kHalfPi) : 0.0f;
    *dry_gain = m <= 0.5f ? 1.0f : (m >= 1.0f ? 0.0f : std::cos((m - 0.5f) * kit::kPi));
  }

  // A low-pass for taking every `step`th sample: a sinc that passes half of
  // what the lower rate can hold, under a Blackman window, with a gain of 1.
  static void windowed_sinc(float* taps, int count, int step) {
    const double pi = 3.14159265358979323846;
    const double centre = 0.5 * (count - 1);
    double sum = 0.0;
    for (int n = 0; n < count; ++n) {
      const double x = (n - centre) / step;
      const double sinc = x == 0.0 ? 1.0 : std::sin(pi * x) / (pi * x);
      const double w = 0.42 - 0.5 * std::cos(2.0 * pi * n / (count - 1)) + 0.08 * std::cos(4.0 * pi * n / (count - 1));
      taps[n] = static_cast<float>(sinc * w);
      sum += sinc * w;
    }
    for (int n = 0; n < count; ++n) taps[n] = static_cast<float>(taps[n] / sum);
  }

  void apply(int id) {
    using namespace sine_shadow;
    const float sr = sample_rate();
    switch (id) {
      case kTranspose:
      case kSnap:
      case kSpread:
        retune_ = true;  // every sine is aimed again before the next sample
        break;
      case kAttack:
        // The time is to nine tenths of the way.
        attack_coeff_ = 1.0f - kit::time_to_coeff(param(kAttack) * 0.001f / 2.3025851f, sr);
        break;
      case kRelease:
        // The time is to 60 dB down.
        release_coeff_ = 1.0f - kit::time_to_coeff(param(kRelease) / 6.9077553f, sr);
        break;
      case kGlide: {
        glide_coeff_ = 1.0f - kit::time_to_coeff(param(kGlide) * 0.001f, sr);
        const float share = static_cast<float>(hop_) / (param(kGlide) * 0.001f * sr);
        lock_ = share < kLock ? share : kLock;
        break;
      }
      case kMix:
        mix_.set(param(kMix), primed());
        break;
      default:
        break;  // Partials, Steady and Tone are read once per frame
    }
  }

  // What Tone makes of a partial at `hz`: 1 at the centre, and never more.
  static float lean(float tone, float log2_hz) {
    const float x = 2.0f * tone - 1.0f;
    if (x < 0.0f) {
      const float octaves = log2_hz - 8.2288187f;  // log2(kDarkHz)
      return octaves > 0.0f ? std::exp2(x * octaves) : 1.0f;
    }
    const float octaves = log2_hz - 11.287712f;  // log2(kBrightHz)
    return octaves < 0.0f ? std::exp2(x * octaves) : 1.0f;
  }

  // The fade at the two ends of what a sine may sound at.
  float band(float hz) const {
    const float top = kit::min(kFadeOutHighHz, 0.42f * sample_rate());
    const float knee = top * (kFadeOutLowHz / kFadeOutHighHz);
    if (hz <= kFadeInLowHz || hz >= top) return 0.0f;
    if (hz < kFadeInHighHz) return (hz - kFadeInLowHz) / (kFadeInHighHz - kFadeInLowHz);
    if (hz > knee) return (top - hz) / (top - knee);
    return 1.0f;
  }

  // Where a sine is heading: its pitch from its partial's, Transpose and
  // Snap; its level from the partial's, Tone and the ends of the range; its
  // place from the partial's own and Spread.
  void aim(Voice& v) {
    using namespace sine_shadow;
    // The pitch in doubles, and untouched where nothing moves it: a sine
    // in unison with its partial is at the frequency that was measured.
    double hz = static_cast<double>(kit::max(v.bin, 0.5f)) * bin_hz_;
    const double transpose = std::floor(param(kTranspose) + 0.5f);
    const double snap = param(kSnap);
    v.unison = true;
    v.may_land = false;
    if (transpose != 0.0 || snap != 0.0) {
      double note = 69.0 + 12.0 * std::log2(hz / 440.0) + transpose;
      // A partial that is on its note already (to kInTune) is left where
      // it is: pulled the last cent or two, its sine would beat against it
      // once in many seconds, and the two would cancel for a second of each.
      const double pull = snap * (std::floor(note + 0.5) - note);
      const bool pulled = std::fabs(pull) > kInTune;
      if (transpose != 0.0 || pulled) {
        if (pulled) note += pull;
        hz = 440.0 * std::exp2((note - 69.0) / 12.0);
        v.unison = false;
        v.may_land = transpose != 0.0 && !pulled;
      }
    }
    v.aim_inc = hz / sample_rate();
    // A sine that has landed on a partial of the sound (see track) stays on
    // it for as long as its own aim is within kLand of it.
    if (v.landed && !(v.may_land && std::fabs(v.aim_inc - v.land_inc) <= kLand * v.land_inc)) v.landed = false;
    v.inc_target = v.landed ? v.land_inc : v.aim_inc;
    hz = v.inc_target * sample_rate();
    v.band = band(static_cast<float>(hz));
    const bool heard = v.state == kFollowing && v.age >= need_;
    v.env_target = heard ? v.level * v.lean * v.band : 0.0f;
    if (v.state == kFading) {
      v.env_coeff = fade_coeff_;
    } else {
      v.env_coeff = v.env_target > v.env ? attack_coeff_ : release_coeff_;
    }
    const float angle = kit::lerp(v.angle, 0.25f * kit::kPi * (1.0f + v.place), param(kSpread));
    v.left_target = 1.4142136f * std::cos(angle);
    v.right_target = 1.4142136f * std::sin(angle);
  }

  // One sample of the sound into the three frames. Their transforms are
  // spread over the samples so that no 128-sample block holds two of the
  // large ones: in a stretch of 1024 samples the middle frame's two fall at
  // 0 and 512, its tracking at 640, the fine frame's at 807 (once in four
  // such stretches a channel) and the quick frame's small ones every 128.
  void measure(float left, float right) {
    float sample[2] = {left, right};
    if (div_ == 2) {
      for (int c = 0; c < 2; ++c) front_ring_[c][front_at_] = front_ring_[c][front_at_ + kFrontTaps] = sample[c];
      front_at_ = (front_at_ + 1) & (kFrontTaps - 1);
      if (++front_phase_ < 2) return;
      front_phase_ = 0;
      for (int c = 0; c < 2; ++c) sample[c] = dot(front_taps_, &front_ring_[c][front_at_], kFrontTaps);
    }
    for (int c = 0; c < 2; ++c) {
      const float late = delay_[c][delay_at_];
      delay_[c][delay_at_] = sample[c];
      quick_[c].analyse(late, [this, c](const float* re, const float* im) { quick_frame(c, re, im); });
      fine_ring_[c][fine_at_] = fine_ring_[c][fine_at_ + kFineTaps] = sample[c];
    }
    if (++delay_at_ == kQuickDelay) delay_at_ = 0;
    if (++fine_at_ == kFineTaps) fine_at_ = 0;
    // The left channel's frame comes first (kit::Stft's stagger). It stays
    // where it is, in the transform's own storage, until the right
    // channel's frame of the same stretch of sound arrives, and both until
    // they have been tracked.
    mid_[0].analyse(sample[0], [this](const float* re, const float* im) {
      mid_re_[0] = re;
      mid_im_[0] = im;
    });
    mid_[1].analyse(sample[1], [this](const float* re, const float* im) {
      mid_re_[1] = re;
      mid_im_[1] = im;
      // The sample of the sound the frame began at: a frame and the stagger
      // ago, and what the decimator in front holds back.
      mid_start_ = clock_ - ((Mid::kMaxStagger + Mid::kFrame) * div_ + front_delay_);
      track_in_ = kDefer + 1;
    });
    if (++fine_phase_ == kFineStep) {
      fine_phase_ = 0;
      for (int c = 0; c < 2; ++c) {
        const float low = dot(fine_taps_, &fine_ring_[c][fine_at_], kFineTaps);
        fine_[c].analyse(low, [this, c](const float* re, const float* im) { fine_frame(c, re, im); });
      }
    }
    if (track_in_ > 0 && --track_in_ == 0) track();
  }

  static float dot(const float* taps, const float* ring, int count) {
    float sum = 0.0f;
    for (int n = 0; n < count; ++n) sum += taps[n] * ring[n];
    return sum;
  }

  // The device slept through `frames` samples of silence: every clock moves
  // on as if they had been measured. By then every ring and every spectrum
  // kept here holds nothing but zeros (the idle hold sees to that), so only
  // the clocks need moving.
  void sleep_through(int frames) {
    clock_ += static_cast<double>(frames);
    const int measured = (front_phase_ + frames) / div_;
    front_phase_ = (front_phase_ + frames) % div_;
    const int fine_samples = (fine_phase_ + measured) / kFineStep;
    fine_phase_ = (fine_phase_ + measured) % kFineStep;
    for (int c = 0; c < 2; ++c) {
      mid_[c].skip(measured);
      quick_[c].skip(measured);
      fine_[c].skip(fine_samples);
    }
    track_in_ = 0;
    fine_count_ = 0;
    for (int s = 0; s < kSweptCells; ++s) swept_[s] = 0;
    swept_before_count_ = 0;
    for (int l = 0; l < kLevels; ++l) {
      for (int q = 0; q < kQuickSeen; ++q) quick_power_[l][q] = 0.0f;
    }
  }

  // A quick frame: kept, with the one before it, for the next tracking.
  void quick_frame(int c, const float* re, const float* im) {
    const int at = quick_now_[c] ^ 1;
    float* keep_re = quick_re_[c][at];
    float* keep_im = quick_im_[c][at];
    for (int k = 0; k < Quick::kBins; ++k) {
      keep_re[k] = re[k];
      keep_im[k] = im[k];
    }
    quick_now_[c] = at;
  }

  // A fine frame. The left channel's comes first and waits for the right's;
  // then the frame's peaks are found, to stand until the next one.
  void fine_frame(int c, const float* re, const float* im) {
    fine_re_[c] = re;
    fine_im_[c] = im;
    if (c == 0) return;
    fine_start_ = clock_ - ((Fine::kMaxStagger + Fine::kFrame) * kFineStep * div_ + fine_delay_);
    // What stood in the frame before, to tell what lasts: a tone that holds
    // is a peak in the same place frame after frame; noise, and the lines a
    // vibrato draws, are not.
    const int before = fine_count_;
    for (int f = 0; f < before; ++f) {
      before_bin_[f] = fine_peaks_[f].bin;
      before_sure_[f] = fine_peaks_[f].sure > kSure;
      before_doubt_[f] = fine_doubt_[f];
      before_above_[f] = fine_above_[f];
      before_below_[f] = fine_below_[f];
    }
    fine_count_ = find_peaks(fine_band_, fine_re_[0], fine_im_[0], fine_re_[1], fine_im_[1], fine_last_re_[0],
                             fine_last_im_[0], fine_last_re_[1], fine_last_im_[1], kFineFrame, kFinePeaks, fine_peaks_);
    for (int f = 0; f < fine_count_; ++f) {
      Peak& peak = fine_peaks_[f];
      fine_doubt_[f] = 0;
      fine_above_[f] = 0;
      fine_below_[f] = 0;
      for (int b = 0; b < before; ++b) {
        if (std::fabs(before_bin_[b] - peak.bin) > kFineSame) continue;
        peak.lasting = peak.lasting || before_sure_[b];
        if (before_doubt_[b] > fine_doubt_[f]) fine_doubt_[f] = before_doubt_[b];
        if (before_above_[b] > fine_above_[f]) fine_above_[f] = before_above_[b];
        if (before_below_[b] > fine_below_[f]) fine_below_[f] = before_below_[b];
      }
      // Two that stand nearer than kFineClear run into each other: neither
      // is read right (find_peaks has seen to those whose bins are nearer
      // than kFineApart; this is the same by where they were measured).
      for (int g = 0; g < f; ++g) {
        Peak& other = fine_peaks_[g];
        if (std::fabs(other.bin - peak.bin) >= kFineClear) continue;
        if (peak.power > kNoSideLobe * other.power) other.crowded = true;
        if (other.power > kNoSideLobe * peak.power) peak.crowded = true;
      }
    }
    for (int k = 0; k < Fine::kBins; ++k) {
      fine_last_re_[0][k] = fine_re_[0][k];
      fine_last_im_[0][k] = fine_im_[0][k];
      fine_last_re_[1][k] = fine_re_[1][k];
      fine_last_im_[1][k] = fine_im_[1][k];
    }
  }

  static int reach_of(const Band& band, int k) {
    return kit::clamp_int(static_cast<int>(band.reach_share * static_cast<float>(k)), band.least_reach, band.most_reach);
  }

  // The peaks of one frame of both channels (re0, im0 the left's and re1,
  // im1 the right's; r0, i0, r1, i1 the same of the frame before), strongest
  // first, `most` at the most. Returns how many.
  int find_peaks(const Band& band, const float* re0, const float* im0, const float* re1, const float* im1,
                 const float* r0, const float* i0, const float* r1, const float* i1, int source, int most,
                 Peak* peaks) {
    // The power of both channels together, bin by bin, and gathered over
    // each bin's reach: a partial that moves within the frame (vibrato) is
    // smeared over a share of its frequency, so the higher the bin the wider
    // the stretch that is taken as one partial. The peaks of that, strongest
    // first.
    const int lo = band.lo, hi = band.hi;
    const int from = lo - band.most_reach - 1 > 0 ? lo - band.most_reach - 1 : 0;
    const int to = hi + band.most_reach + 1;
    for (int k = from; k <= to; ++k) {
      power_[k] = re0[k] * re0[k] + im0[k] * im0[k] + re1[k] * re1[k] + im1[k] * im1[k];
    }
    float top = 0.0f;
    for (int k = lo - 1; k <= hi + 1; ++k) {
      float sum = power_[k];
      const int reach = reach_of(band, k);
      for (int j = 1; j <= reach; ++j) sum += power_[k - j] + power_[k + j];
      gathered_[k] = sum;
      if (sum > top) top = sum;
    }
    // The floor: -84 dBFS, 60 dB under this frame's strongest, and (for the
    // fine and the quick frame) what the middle frame's floor is.
    const float full = 2.0f * band.full_scale * band.full_scale;  // the power of a full-scale sine, both sides
    const float least = full * kAbsoluteFloor * kAbsoluteFloor;
    if (source == kMid) floor_ = top > least ? kit::max(least, top * kRelativeFloor) / full : 1.0e30f;
    int found = 0;
    if (top > least) {
      const float floor = kit::max(kit::max(least, top * kRelativeFloor), floor_ * full);
      for (int k = lo; k <= hi; ++k) {
        const float p = gathered_[k];
        if (!(p > floor)) continue;
        // A peak: its stretch holds more than the same stretch a bin either
        // side. Where the stretch grows by a bin, the next bin's own (wider)
        // stretch is no measure: one bin under the step it always holds
        // more, and at the step it holds a partial two bins below as well,
        // which was then found twice.
        const int reach = reach_of(band, k);
        float below = gathered_[k - 1], above = gathered_[k + 1];
        if (reach_of(band, k - 1) != reach) below = p - power_[k + reach] + power_[k - reach - 1];
        if (reach_of(band, k + 1) != reach) above = p - power_[k - reach] + power_[k + reach + 1];
        if (!(p > below && p >= above)) continue;
        if (found == most && p <= rough_power_[found - 1]) continue;
        int at = found < most ? found++ : most - 1;
        for (; at > 0 && rough_power_[at - 1] < p; --at) {
          rough_power_[at] = rough_power_[at - 1];
          rough_bin_[at] = rough_bin_[at - 1];
        }
        rough_power_[at] = p;
        rough_bin_[at] = k;
      }
    }

    // Which peaks are partials, and what each measures over its stretch of
    // bins (its own and one either side at least: a Hann-windowed sine
    // leaves 1.5 times a bin's full-scale power over its whole lobe wherever
    // it lies between two bins, and 98 % of that or more in three).
    int count = 0;
    const float scale = 1.0f / (1.5f * band.full_scale * band.full_scale);
    for (int n = 0; n < found; ++n) {
      const int k = rough_bin_[n];
      const int own = reach_of(band, k);
      const int reach = own > 1 ? own : 1;
      // A stretch that runs into a stronger partial's is that partial again.
      bool again = false;
      for (int m = 0; m < count && !again; ++m) {
        const int apart = k > peaks[m].k ? k - peaks[m].k : peaks[m].k - k;
        again = apart < reach + peaks[m].reach;
        // The fine frame: a second peak nearer than kFineApart bins that is
        // no side lobe (those lie 31 dB down and more) is a second tone
        // whose lobe runs into the first's, and neither is read right.
        if (source == kFineFrame && apart < kFineApart && rough_power_[n] > kNoSideLobe * peaks[m].power) {
          peaks[m].crowded = true;
          again = true;
        }
      }
      if (again) continue;
      float left = 0.0f, right = 0.0f, before = 0.0f, centre = 0.0f;
      float turn_re = 0.0f, turn_im = 0.0f, turn_size = 0.0f;
      // The middle frame, low down, also looks two frames back (see below).
      const bool far_back = source == kMid && k + reach < kTwoBack;
      float far_re = 0.0f, far_im = 0.0f, far_size = 0.0f, far_before = 0.0f;
      for (int j = k - reach; j <= k + reach; ++j) {
        const float pl = re0[j] * re0[j] + im0[j] * im0[j];
        const float pr = re1[j] * re1[j] + im1[j] * im1[j];
        const float bl = r0[j] * r0[j] + i0[j] * i0[j];
        const float br = r1[j] * r1[j] + i1[j] * i1[j];
        left += pl;
        right += pr;
        before += bl + br;
        centre += static_cast<float>(j - k) * (pl + pr);
        // The turn since the frame before. Every bin a partial reaches
        // turns by the partial's own advance, whatever the bin, and each
        // channel's own phase drops out of it: the turns of the stretch and
        // of both channels add up to one.
        turn_re += re0[j] * r0[j] + im0[j] * i0[j] + re1[j] * r1[j] + im1[j] * i1[j];
        turn_im += im0[j] * r0[j] - re0[j] * i0[j] + im1[j] * r1[j] - re1[j] * i1[j];
        turn_size += std::sqrt(pl * bl) + std::sqrt(pr * br);
        if (far_back) {
          const float fl = two_re_[0][j] * two_re_[0][j] + two_im_[0][j] * two_im_[0][j];
          const float fr = two_re_[1][j] * two_re_[1][j] + two_im_[1][j] * two_im_[1][j];
          far_before += fl + fr;
          far_re += re0[j] * two_re_[0][j] + im0[j] * two_im_[0][j] + re1[j] * two_re_[1][j] + im1[j] * two_im_[1][j];
          far_im += im0[j] * two_re_[0][j] - re0[j] * two_im_[0][j] + im1[j] * two_re_[1][j] - re1[j] * two_im_[1][j];
          far_size += std::sqrt(pl * fl) + std::sqrt(pr * fr);
        }
      }
      const float both = left + right;
      // There in the frame before: its frequency is that turn.
      if (!(both > 0.0f) || before < both * kEstablished) continue;
      // The pitch: the stretch's centre of power says which bins, the turn
      // says where between them (Stft::advance_to_bin, from a place between
      // two bins: a quarter turn per bin at a quarter hop). Where the bins'
      // turns do not agree at all (under kUnsure) the turn says nothing and
      // the centre of power is the better word: a sine that follows such a
      // peak for a frame or two keeps near it and does not jump.
      const float middle = static_cast<float>(k) + centre / both;
      const float within = middle - 4.0f * std::floor(0.25f * middle);  // four bins are a whole turn
      const float turned =
          middle + kit::princarg(kit::fast_atan2(turn_im, turn_re) - kit::kHalfPi * within) * (2.0f / kit::kPi);
      float sure = turn_size > 0.0f ? std::sqrt(turn_re * turn_re + turn_im * turn_im) / turn_size : 0.0f;
      // Two tones in one lobe turn its bins apart, but over one hop tones
      // under 14 Hz apart have not turned far enough apart to show, and
      // ones near 47 Hz apart have come round again. Over two hops those
      // show: a peak that was there two frames back is only as sure as the
      // less sure of the two turns. (Looked at up to where the fine frame
      // looks, which is what tells such tones apart.)
      if (far_back && far_before >= both * kEstablished && far_size > 0.0f) {
        sure = kit::min(sure, std::sqrt(far_re * far_re + far_im * far_im) / far_size);
      }
      const float trust = kit::clamp((sure - kUnsure) / kUnsure, 0.0f, 1.0f);
      const float bin = middle + trust * (turned - middle);
      Peak& peak = peaks[count++];
      peak = Peak();
      peak.k = k;
      peak.reach = reach;
      peak.source = source;
      peak.power = rough_power_[n];
      peak.bin = bin * band.to_mid;
      peak.sure = sure;
      peak.left = std::sqrt(left * scale);
      peak.right = std::sqrt(right * scale);
      peak.level = std::sqrt(0.5f * both * scale);
      if (source == kFineFrame) {
        // Where its phase stood at the frame's first sample, each side: the
        // bin's phase less half a turn per bin between the two (the Hann
        // window is centred).
        const float off = 0.5f * (bin - static_cast<float>(k));
        peak.start[0] = kit::fast_atan2(im0[k], re0[k]) * (0.5f / kit::kPi) - off;
        peak.start[1] = kit::fast_atan2(im1[k], re1[k]) * (0.5f / kit::kPi) - off;
      }
    }
    return count;
  }

  // Whether what sounds about a (middle) bin is one tone on its own: the
  // quick frame's power there has kept steady.
  bool one_tone(float bin) const {
    const int q = static_cast<int>(bin / static_cast<float>(kMidPerQuick) + 0.5f);
    if (q < 0 || q >= kQuickSeen) return false;
    float lowest = quick_power_[0][q], highest = lowest;
    for (int l = 1; l < kLevels; ++l) {
      lowest = kit::min(lowest, quick_power_[l][q]);
      highest = kit::max(highest, quick_power_[l][q]);
    }
    return lowest > 0.0f && highest <= kOneTone * lowest;
  }

  // Whether the middle frame has lately been very sure of a peak anywhere
  // from one bin to another.
  bool swept(float from, float to) const {
    const int lo = kit::clamp_int(static_cast<int>(from * static_cast<float>(kSweptPerBin)), 0, kSweptCells - 1);
    const int hi = kit::clamp_int(static_cast<int>(to * static_cast<float>(kSweptPerBin)), 0, kSweptCells - 1);
    for (int s = lo; s <= hi; ++s) {
      if (swept_[s] > 0) return true;
    }
    return false;
  }

  // The middle frame's peaks (the first `count` of peaks_), put together
  // with what the other two frames have to say. Returns how many peaks
  // stand in peaks_ afterwards.
  //
  // The fine frame's peaks that can be read (sure of their pitch, in the
  // same place as in the fine frame before, and clear of each other) each
  // belong to the nearest middle peak within kFineNear. They speak in its
  // place when they are in doubt of it for kFineWait trackings more than
  // not: while it is not sure of its pitch (two tones a bin or two apart,
  // whose bins turn apart), or while it has not lately passed them. Two
  // tones under a bin apart beat as one in the middle frame, which is sure
  // of that one and reads it between the two; a tone with vibrato draws
  // side lines in the fine frame as well, but the middle peak sways back and
  // forth past those. And they speak for a middle peak they agree with that
  // has another close by: its pitch is pulled by the neighbour in the middle
  // frame and not in the fine one. A fine frame is a third of a second long
  // and still shows a tone that has stopped, so its peaks are only as strong
  // as the middle frame says they still are; and they speak only if they
  // hold a fair share of what the middle peak holds.
  //
  // Two things more keep the fine frame from speaking out of turn. It comes
  // late: of a tone that sways slowly it shows where the tone dwelt a moment
  // ago, and a sine sent back there loses its partial. The middle frame
  // keeps where a lone, steady peak of its own has lately been (swept_),
  // and a fine peak with such places at it or on both sides has been passed
  // as well. And one tone on its own, however wide its vibrato, draws lines
  // in the fine frame that hold still and hold a fair share: but its power
  // in the quick frame holds steady, where tones the fine frame tells apart
  // beat (one_tone()), and then there is no doubt of the middle peak.
  //
  // The quick frame: a sure peak of its own that stands out speaks wherever
  // the middle frame has nothing sure that holds most of its power and the
  // fine frame does not speak, which is where a partial moves too fast for
  // them; the middle frame's smear of that partial goes.
  int merge(int count) {
    level_at_ = (level_at_ + 1) % kLevels;
    for (int q = 0; q < kQuickSeen; ++q) {
      float sum = 0.0f;
      if (q >= quick_band_.lo && q > kOneWide) {
        for (int c = 0; c < 2; ++c) {
          const float* re = quick_re_[c][quick_now_[c]];
          const float* im = quick_im_[c][quick_now_[c]];
          for (int j = q - kOneWide; j <= q + kOneWide; ++j) sum += re[j] * re[j] + im[j] * im[j];
        }
      }
      quick_power_[level_at_][q] = sum;
    }
    for (int s = 0; s < kSweptCells; ++s) {
      if (swept_[s] > 0) --swept_[s];
    }
    float sure_at[kMidPeaks];
    int sure_count = 0;
    for (int m = 0; m < count; ++m) {
      const float bin = peaks_[m].bin;
      const int cell = static_cast<int>(bin * static_cast<float>(kSweptPerBin));
      if (!(peaks_[m].sure > kSweptSure) || cell >= kSweptCells) continue;
      for (int b = 0; b < swept_before_count_; ++b) {
        if (std::fabs(swept_before_[b] - bin) <= kSweptStep) swept_[cell] = kSwept;
      }
      sure_at[sure_count++] = bin;
    }
    for (int b = 0; b < sure_count; ++b) swept_before_[b] = sure_at[b];
    swept_before_count_ = sure_count;
    bool speaks[kFinePeaks];
    int belongs[kFinePeaks];
    for (int f = 0; f < fine_count_; ++f) {
      const Peak& fine = fine_peaks_[f];
      speaks[f] = false;
      belongs[f] = -1;
      fine_there_[f] = 0.0f;
      if (!(fine.sure > kSure && fine.lasting && !fine.crowded)) continue;
      float nearest = kFineNear;
      for (int m = 0; m < count; ++m) {
        const float d = std::fabs(peaks_[m].bin - fine.bin);
        if (d <= nearest) {
          nearest = d;
          belongs[f] = m;
        }
      }
      if (fine_above_[f] > 0) --fine_above_[f];
      if (fine_below_[f] > 0) --fine_below_[f];
      if (belongs[f] < 0) {
        fine_doubt_[f] = 0;
        continue;
      }
      const Peak& mid = peaks_[belongs[f]];
      if (mid.sure > kVerySure) {
        if (mid.bin >= fine.bin - kFineReached) fine_above_[f] = kPassed;
        if (mid.bin <= fine.bin + kFineReached) fine_below_[f] = kPassed;
      }
    }
    // What the fine peaks of each middle peak hold together, and what those
    // hold that the middle peak has not lately passed both ways.
    float all[kMidPeaks], unpassed[kMidPeaks];
    for (int m = 0; m < count; ++m) all[m] = unpassed[m] = 0.0f;
    for (int f = 0; f < fine_count_; ++f) {
      if (belongs[f] < 0) continue;
      const float power = fine_peaks_[f].level * fine_peaks_[f].level;
      all[belongs[f]] += power;
      const float bin = fine_peaks_[f].bin;
      const bool passed = (fine_above_[f] > 0 && fine_below_[f] > 0) ||
                          (swept(bin - kFineReached, bin + kSweptNear) && swept(bin - kSweptNear, bin + kFineReached));
      if (!passed) unpassed[belongs[f]] += power;
    }
    for (int f = 0; f < fine_count_; ++f) {
      if (belongs[f] < 0) continue;
      const Peak& fine = fine_peaks_[f];
      const Peak& mid = peaks_[belongs[f]];
      // They may speak for it only if they hold a fair share of what it
      // holds: a few weak lines do not stand for a strong partial.
      const float least = kFineShare * mid.level * mid.level;
      const bool enough = all[belongs[f]] >= least;
      // Doubt: the middle peak is not sure of its pitch, or it has not
      // lately passed fine peaks that hold a fair share of it. Two tones
      // under a bin apart beat as one in the middle frame, which is sure of
      // that one, and its pitch stays between them; a tone that sways draws
      // side lines in the fine frame, and passes them back and forth.
      const bool doubt = enough && !one_tone(fine.bin) && (!(mid.sure > kSure) || unpassed[belongs[f]] >= least);
      if (!doubt) {
        if (fine_doubt_[f] > 0) --fine_doubt_[f];
      } else if (fine_doubt_[f] < 2 * kFineWait) {
        ++fine_doubt_[f];
      }
      speaks[f] = enough && fine_doubt_[f] >= kFineWait;
      if (!speaks[f] && enough && std::fabs(mid.bin - fine.bin) <= kFineAgree) {
        for (int m = 0; m < count && !speaks[f]; ++m) {
          speaks[f] = m != belongs[f] && std::fabs(peaks_[m].bin - mid.bin) <= kCrowd &&
                      peaks_[m].level > kFineMatch * mid.level;
        }
      }
    }
    for (int m = 0; m < count; ++m) {
      // Where one speaks for a middle peak, all that belong to it do: the
      // middle peak goes, and what it held is theirs together.
      bool any = false;
      for (int f = 0; f < fine_count_ && !any; ++f) any = speaks[f] && belongs[f] == m;
      if (!any) continue;
      float held = 0.0f;
      for (int f = 0; f < fine_count_; ++f) {
        if (belongs[f] != m) continue;
        speaks[f] = true;
        held += fine_peaks_[f].level * fine_peaks_[f].level;
      }
      peaks_[m].out = true;
      const float there = kit::min(1.0f, std::sqrt(peaks_[m].level * peaks_[m].level / (kThere * held)));
      for (int f = 0; f < fine_count_; ++f) {
        if (speaks[f] && belongs[f] == m) fine_there_[f] = there;
      }
    }
    for (int f = 0; f < fine_count_; ++f) fine_peaks_[f].used = speaks[f];

    const int quick = find_peaks(quick_band_, quick_re_[0][quick_now_[0]], quick_im_[0][quick_now_[0]],
                                 quick_re_[1][quick_now_[1]], quick_im_[1][quick_now_[1]], quick_re_[0][quick_now_[0] ^ 1],
                                 quick_im_[0][quick_now_[0] ^ 1], quick_re_[1][quick_now_[1] ^ 1],
                                 quick_im_[1][quick_now_[1] ^ 1], kQuickFrame, kQuickPeaks, quick_peaks_);
    for (int q = 0; q < quick; ++q) {
      Peak& fast = quick_peaks_[q];
      if (fast.sure <= kSure) continue;
      float held = 0.0f, told = 0.0f;
      for (int m = 0; m < count; ++m) {
        const Peak& mid = peaks_[m];
        if (!mid.out && mid.sure > kSure && std::fabs(mid.bin - fast.bin) <= kQuickNear) held += mid.level * mid.level;
      }
      for (int f = 0; f < fine_count_; ++f) {
        const Peak& fine = fine_peaks_[f];
        if (fine.used && std::fabs(fine.bin - fast.bin) <= kQuickNear) {
          told += fine.level * fine.level * fine_there_[f] * fine_there_[f];
        }
      }
      const float all = fast.level * fast.level;
      if (held >= kMostly * all || told >= kFineMostly * all) continue;
      // power_ is the quick frame's here (find_peaks left it so).
      float own = 0.0f;
      for (int j = fast.k - fast.reach; j <= fast.k + fast.reach; ++j) own += power_[j];
      const float beyond = kit::max(power_[fast.k - fast.reach - 2], power_[fast.k + fast.reach + 2]);
      if (own < kStandsOut * beyond) continue;
      fast.used = true;
      for (int m = 0; m < count; ++m) {
        if (std::fabs(peaks_[m].bin - fast.bin) <= kQuickNear) peaks_[m].out = true;
      }
      for (int f = 0; f < fine_count_; ++f) {
        if (std::fabs(fine_peaks_[f].bin - fast.bin) <= kQuickNear) fine_peaks_[f].used = false;
      }
    }

    int kept = 0;
    for (int m = 0; m < count; ++m) {
      if (!peaks_[m].out) peaks_[kept++] = peaks_[m];
    }
    for (int f = 0; f < fine_count_; ++f) {
      if (!fine_peaks_[f].used) continue;
      Peak& peak = peaks_[kept++];
      peak = fine_peaks_[f];
      peak.out = false;
      peak.left *= fine_there_[f];
      peak.right *= fine_there_[f];
      peak.level *= fine_there_[f];
#ifdef SINE_SHADOW_PROBE
      ++probe_fine_;
#endif
    }
    for (int q = 0; q < quick; ++q) {
      if (!quick_peaks_[q].used) continue;
      peaks_[kept++] = quick_peaks_[q];
#ifdef SINE_SHADOW_PROBE
      ++probe_quick_;
#endif
    }
    return kept;
  }

  // What Tone makes of a partial at `bin` of the middle frame.
  float weight_at(float bin) const { return weight_[kit::clamp_int(static_cast<int>(bin + 0.5f), 1, Mid::kBins - 1)]; }

  // Where a partial's phase stands at the sample about to be made, in
  // cycles: its bin's phase is the partial's at the frame's first sample
  // plus half a turn per bin between them (the Hann window is centred), and
  // the frame began `clock_ - start` samples ago.
  double phase_now(const Peak& peak, int side) const {
    const double per_sample = static_cast<double>(peak.bin) / period_;
    if (peak.source == kFineFrame) return peak.start[side] + per_sample * (clock_ - fine_start_);
    const double at_start = kit::fast_atan2(mid_im_[side][peak.k], mid_re_[side][peak.k]) * (0.5 / 3.14159265358979323846) -
                            0.5 * (static_cast<double>(peak.bin) - peak.k);
    return at_start + per_sample * (clock_ - mid_start_);
  }

  // One frame, both channels: the peaks, which of them are partials, which
  // sine follows which, and where every sine is heading until the next.
  void track() {
    using namespace sine_shadow;
    const float tone = param(kTone);
    if (tone != weight_tone_) {
      weight_tone_ = tone;
      for (int k = 1; k < Mid::kBins; ++k) weight_[k] = lean(tone, log2_hz_[k]);
    }
    need_ = static_cast<int>(kSteadySeconds * param(kSteady) * param(kSteady) * sample_rate() /
                             static_cast<float>(hop_) + 0.5f);

    int count = find_peaks(mid_band_, mid_re_[0], mid_im_[0], mid_re_[1], mid_im_[1], last_re_[0], last_im_[0],
                           last_re_[1], last_im_[1], kMid, kMidPeaks, peaks_);
#ifdef SINE_SHADOW_PROBE
    probe_mid_count_ = count;
    for (int m = 0; m < count; ++m) probe_mid_[m] = peaks_[m];
#endif
    count = merge(count);
#ifdef SINE_SHADOW_PROBE
    probe_count_ = count;
    ++probe_tracks_;
#endif

    // Each sine that follows keeps to its own partial: the peak nearest to
    // where the partial was, or to where it was going (a partial on the
    // move), if that is within reach; two sines after one peak, the nearer
    // has it. A peak that is left goes to the nearest sine within reach that
    // lingers or has lost its own. (The other way about, each peak taking the nearest sine, a
    // sine left lingering where a swaying partial turns takes the partial
    // from the sine that follows it, every time it comes by.)
    for (int n = 0; n < active_count_; ++n) claimed_[active_[n]] = -1;
    for (int n = 0; n < active_count_; ++n) {
      const int index = active_[n];
      const Voice& v = voices_[index];
      if (v.state != kFollowing) continue;
      // (Of the peaks within reach, those under half the strongest are
      // left: what a moving partial leaves behind in a long frame is not
      // the partial.)
      float most = 0.0f;
      for (int m = 0; m < count; ++m) {
        const float bin = peaks_[m].bin;
        const float d = kit::min(std::fabs(v.bin - bin), std::fabs(v.bin + v.step - bin));
        reach_[m] = d < kit::max(kCatchBins, kCatchRatio * bin) ? d : -1.0f;
        if (reach_[m] >= 0.0f && peaks_[m].level > most) most = peaks_[m].level;
      }
      int best = -1;
      float nearest = 1.0e30f;
      for (int m = 0; m < count; ++m) {
        if (reach_[m] < 0.0f || reach_[m] >= nearest || peaks_[m].level < kLeftBehind * most) continue;
        nearest = reach_[m];
        best = m;
      }
      if (best < 0) continue;
      Peak& peak = peaks_[best];
      if (peak.voice >= 0) {
        if (peak.away <= nearest) continue;
        claimed_[peak.voice] = -1;
      }
      peak.voice = index;
      peak.away = nearest;
      claimed_[index] = best;
    }
    // What a partial scores is its level as Tone weighs it, raised while it
    // is being followed already.
    int standing = 0;
    for (int m = 0; m < count; ++m) {
      Peak& peak = peaks_[m];
      if (peak.voice < 0) {
        float nearest = kit::max(kCatchBins, kCatchRatio * peak.bin);
        for (int n = 0; n < active_count_; ++n) {
          const int index = active_[n];
          const Voice& v = voices_[index];
          if ((v.state != kLingering && v.state != kFollowing) || claimed_[index] >= 0) continue;
          const float d = std::fabs(v.bin - peak.bin);
          if (d < nearest) {
            nearest = d;
            peak.voice = index;
          }
        }
        if (peak.voice >= 0) claimed_[peak.voice] = m;
      }
      const bool kept = peak.voice >= 0 && voices_[peak.voice].state == kFollowing;
      peak.score = peak.level * weight_at(peak.bin) * (kept ? kKeep : 1.0f);
      // A partial nothing follows yet stands for choosing once its bins
      // agree about its pitch: the first frame of a new sound has peaks
      // whose turns say nothing, and a sine born there would start wrong.
      if (peak.voice < 0 && peak.sure <= kSure) continue;
      int at = standing++;
      for (; at > 0 && peaks_[order_[at - 1]].score < peak.score; --at) order_[at] = order_[at - 1];
      order_[at] = m;
    }
    const int wanted = kit::clamp_int(static_cast<int>(param(kPartials) + 0.5f), 1, kShown);
    const int chosen = standing < wanted ? standing : wanted;
    for (int r = 0; r < chosen; ++r) peaks_[order_[r]].chosen = true;

    // A followed sine whose partial is gone, or is no longer among the
    // strongest, lets go and lingers.
    for (int n = 0; n < active_count_; ++n) {
      Voice& v = voices_[active_[n]];
      if (v.state != kFollowing) continue;
      const int m = claimed_[active_[n]];
      if (m < 0 || !peaks_[m].chosen) v.state = kLingering;
    }

    // The chosen partials: each keeps its sine, takes a lingering one up
    // again, or is given a new one.
    int born = 0;
    for (int r = 0; r < chosen; ++r) {
      const int m = order_[r];
      Peak& peak = peaks_[m];
      int index = peak.voice;
      const bool fresh = index < 0;
      if (fresh) {
        index = take();
        if (index < 0) continue;  // the pool is full: a lingering sine is fading to make room
        peak.voice = index;
        claimed_[index] = m;
        born_[born++] = index;
      }
      Voice& v = voices_[index];
      if (fresh) {
        v = Voice();
        v.state = kFollowing;
        v.young = kYoung;
        const float note = std::floor(69.5f + 12.0f * (std::log2(peak.bin * bin_hz_) - 8.7813597f));
        // Every note has a spot of its own between the sides, far from its
        // neighbours' (the golden section), and its own side of the phase.
        const float spot = note * 0.61803399f;
        const float across = 2.0f * (spot - std::floor(spot)) - 1.0f;
        v.place = across < 0.0f ? -std::sqrt(-across) : std::sqrt(across);
        v.flip = ((static_cast<uint32_t>(note) * 2654435761u) >> 16) & 1u ? 0.5f : 0.0f;
        v.side = peak.right > peak.left ? 1 : 0;
      } else if (v.state == kLingering) {
        v.state = kFollowing;  // with the count it let go with: no second wait if it had none
      } else {
        // A frame counts for a partial when its bins agree about its pitch
        // and against it when they do not: noise makes peaks that last, but
        // not ones that turn as one. The count stops kSpare frames past what
        // Steady asks, so a sine that sounds rides out a few bad frames.
        v.age = peak.sure > kSure ? v.age + 1 : v.age - 1;
        if (v.age > need_ + kSpare) v.age = need_ + kSpare;
        if (v.age < 0) v.age = 0;
      }
      v.still = !fresh && std::fabs(peak.bin - v.bin) <= kStillBins;
      v.step = fresh ? 0.0f : peak.bin - v.bin;
      v.bin = peak.bin;
      v.level = peak.level;
      v.lean = weight_at(peak.bin);
      v.angle = peak.level > 0.0f ? std::atan2(peak.right, peak.left) : 0.25f * kit::kPi;
      // The phase is read from the louder side, and only changes sides for
      // one clearly louder.
      const float mine = v.side ? peak.right : peak.left;
      const float other = v.side ? peak.left : peak.right;
      if (other > 1.4f * mine) v.side ^= 1;
    }

    // The sines that are over leave; the rest are aimed.
    active_count_ = 0;
    for (int index = 0; index < kPool; ++index) {
      Voice& v = voices_[index];
      if (v.state == kFree) continue;
      if (v.state != kFollowing && v.env < kSilent) {
        v.state = kFree;
        continue;
      }
      active_[active_count_++] = index;
    }
    for (int n = 0; n < active_count_; ++n) aim_and_lock(voices_[active_[n]], claimed_[active_[n]], count);

    // A new sine starts on its partial's phase, at the pitch of the nearest
    // sine still sounding within an octave (its own where there is none).
    for (int b = 0; b < born; ++b) {
      Voice& v = voices_[born_[b]];
      v.phase = v.goal;
      v.slew = 0.0f;
      v.inc = v.inc_target;
      v.gain_left = v.left_target;
      v.gain_right = v.right_target;
      float nearest = 1.0f;  // octaves
      for (int n = 0; n < active_count_; ++n) {
        const Voice& other = voices_[active_[n]];
        if (active_[n] == born_[b] || other.env < 1.0e-3f) continue;
        const float apart = std::fabs(std::log2(static_cast<float>(other.inc / v.inc_target)));
        if (apart < nearest) {
          nearest = apart;
          v.inc = other.inc;
          v.young = 0;  // it slides in from there: Glide's from its first sample
        }
      }
    }

    // The frame is the one before, from here on, and that one the one
    // before it.
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kTwoBack; ++k) {
        two_re_[c][k] = last_re_[c][k];
        two_im_[c][k] = last_im_[c][k];
      }
      for (int k = 0; k < Mid::kBins; ++k) {
        last_re_[c][k] = mid_re_[c][k];
        last_im_[c][k] = mid_im_[c][k];
      }
    }

    // For the display: the loudest sines, loudest first.
    shown_count_ = 0;
    for (int n = 0; n < active_count_; ++n) {
      const int index = active_[n];
      const Voice& v = voices_[index];
      const float size = kit::max(v.env, v.env_target);
      if (!(size > 0.0f)) continue;
      int at = kShown - 1;
      if (shown_count_ < kShown) {
        at = shown_count_++;
      } else if (size <= shown_size_[at]) {
        continue;
      }
      for (; at > 0 && shown_size_[at - 1] < size; --at) {
        shown_size_[at] = shown_size_[at - 1];
        shown_[at] = shown_[at - 1];
      }
      shown_size_[at] = size;
      shown_[at] = index;
    }
  }

  // Where one sine is heading until the next frame, and the lock that holds
  // its phase to its partial's. `claimed` is the peak it follows (peaks_),
  // or -1; `count` is how many peaks stand.
  void aim_and_lock(Voice& v, int claimed, int count) {
    aim(v);
    v.slew = 0.0f;
    if (v.state != kFollowing) return;
    // A sine's first frames: its partial's pitch is still being found (the
    // first frames of a sound measure it a little off), so the sine takes
    // each measure as it comes and Glide waits. A long Glide would
    // otherwise carry the first, wrong one for seconds, and the sine's
    // phase with it.
    const bool young = v.young > 0;
    if (young) {
      --v.young;
      v.inc = v.inc_target;
    }
    const Peak* partial = &peaks_[claimed];
    bool steady = v.still || young;
    if (!v.unison) {
      // A sine that Transpose has moved lands, more often than not, on
      // another partial of the same sound (an octave up is the second
      // harmonic, a fifth up is two cents from the third). Left to run free
      // the two drift past each other and that harmonic swells and thins
      // over seconds. So a sine within kLand of a partial that is sure of
      // its pitch takes that partial's pitch and keeps a quarter turn from
      // it, as a sine in unison does from its own.
      const Peak* land = nullptr;
      if (v.may_land) {
        const float at = static_cast<float>(v.aim_inc * period_);
        float nearest = static_cast<float>(kLand) * at;
        for (int m = 0; m < count; ++m) {
          const float d = std::fabs(peaks_[m].bin - at);
          if (d < nearest && peaks_[m].sure > kSure && peaks_[m].source != kQuickFrame) {
            nearest = d;
            land = &peaks_[m];
          }
        }
      }
      if (land == nullptr) {
        v.landed = false;
        v.inc_target = v.aim_inc;
        return;
      }
      steady = v.landed && std::fabs(land->bin - v.land_bin) <= kStillBins;
      v.landed = true;
      v.land_bin = land->bin;
      v.land_inc = static_cast<double>(land->bin) / period_;
      v.inc_target = v.land_inc;
      partial = land;
    }
    // A partial the quick frame follows is on the move: no lock to keep.
    if (partial->source == kQuickFrame) return;
    const int side = v.unison ? v.side : (partial->right > partial->left ? 1 : 0);
    const double now = phase_now(*partial, side) + v.flip;
    v.goal = now - std::floor(now);
    if (!steady) return;
    // The lock, once the sine is at its partial's pitch.
    if (std::fabs(v.inc - v.inc_target) * period_ > 0.3) return;
    double error = v.goal - v.phase;
    error -= std::floor(error + 0.5);
    const float most = static_cast<float>(kLockRatio * v.inc_target) + kLockHz / sample_rate();
    v.slew = kit::clamp(static_cast<float>((young ? kLock : lock_) * error / hop_), -most, most);
  }

  // A free oscillator, or -1 when there is none: then the quietest of the
  // lingering sines is faded out (2 ms) and its place is free by the next
  // frame.
  int take() {
    int quietest = -1;
    for (int index = 0; index < kPool; ++index) {
      const Voice& v = voices_[index];
      if (v.state == kFree) return index;
      if (v.state == kLingering && (quietest < 0 || v.env < voices_[quietest].env)) quietest = index;
    }
    if (quietest >= 0) voices_[quietest].state = kFading;
    return -1;
  }

  // One sample of every sine, and the ceiling over their sum.
  void render(float* left, float* right) {
    float sum_left = 0.0f, sum_right = 0.0f;
    float most_left = 0.0f, most_right = 0.0f;
    const double glide = glide_coeff_;
    const float pan = pan_coeff_;
    for (int n = 0; n < active_count_; ++n) {
      Voice& v = voices_[active_[n]];
      v.env += (v.env_target - v.env) * v.env_coeff;
      v.gain_left += (v.left_target - v.gain_left) * pan;
      v.gain_right += (v.right_target - v.gain_right) * pan;
      v.inc += (v.inc_target - v.inc) * glide;
      const float sine = kit::SineTable::lookup(static_cast<float>(v.phase)) * v.env;
      v.phase += v.inc + v.slew;
      if (v.phase >= 1.0) v.phase -= 1.0;
      sum_left += sine * v.gain_left;
      sum_right += sine * v.gain_right;
      most_left += v.env * v.gain_left;
      most_right += v.env * v.gain_right;
    }
    const float most = most_left > most_right ? most_left : most_right;
    const float gain = most > ceiling_ ? ceiling_ / most : 1.0f;
    ceiling_gain_ = gain;
    *left = sum_left * gain;
    *right = sum_right * gain;
  }

  Mid mid_[2];
  Fine fine_[2];
  Quick quick_[2];
  int div_ = 1;        // samples of the sound per sample measured
  int period_ = Mid::kFrame;  // samples of the sound in a middle frame
  int hop_ = Mid::kHop;       // and between two of them
  float bin_hz_ = 1.0f;       // a middle bin, in hertz
  Band mid_band_ = {}, fine_band_ = {}, quick_band_ = {};

  // The decimators' taps and rings (each ring twice over, so a stretch of it is always in one piece).
  float front_taps_[kFrontTaps] = {}, fine_taps_[kFineTaps] = {};
  float front_ring_[2][2 * kFrontTaps] = {}, fine_ring_[2][2 * kFineTaps] = {};
  float delay_[2][kQuickDelay] = {};  // the sound on its way to the quick frame
  int front_at_ = 0, fine_at_ = 0, delay_at_ = 0;
  int front_phase_ = 0, fine_phase_ = 0;
  double front_delay_ = 0.0, fine_delay_ = 0.0;  // what the decimators hold back, in samples of the sound
  int track_in_ = 0;                             // measured samples until the middle frame is tracked, 0 for none due
  double clock_ = 0.0;                           // the sample of the sound being made, counted from init
  double mid_start_ = 0.0, fine_start_ = 0.0;    // the samples the newest middle and fine frames began at

  const float* mid_re_[2] = {nullptr, nullptr};  // the newest frames, in the transforms' own storage
  const float* mid_im_[2] = {nullptr, nullptr};
  const float* fine_re_[2] = {nullptr, nullptr};
  const float* fine_im_[2] = {nullptr, nullptr};
  float last_re_[2][Mid::kBins] = {}, last_im_[2][Mid::kBins] = {};  // the frames before, both channels
  float two_re_[2][kTwoBack] = {}, two_im_[2][kTwoBack] = {};        // and the ones before those, low down
  float fine_last_re_[2][Fine::kBins] = {}, fine_last_im_[2][Fine::kBins] = {};
  float quick_re_[2][2][Quick::kBins] = {}, quick_im_[2][2][Quick::kBins] = {};  // the quick frame's two newest
  int quick_now_[2] = {0, 0};                                                    // which of the two is the newer
  float power_[Mid::kBins] = {};
  float gathered_[Mid::kBins] = {};  // the power within each bin's reach
  float weight_[Mid::kBins] = {};    // what Tone makes of a partial in each bin
  float log2_hz_[Mid::kBins] = {};   // each bin's pitch, for that table
  float weight_tone_ = -1.0f;        // the Tone the table was made for
  float floor_ = 1.0e30f;            // the middle frame's floor, as a share of a full-scale sine's power

  float rough_power_[kMidPeaks] = {};
  int rough_bin_[kMidPeaks] = {};
  Peak peaks_[kMaxPeaks];
  Peak fine_peaks_[kFinePeaks];
  Peak quick_peaks_[kQuickPeaks];
  float fine_there_[kFinePeaks] = {};  // how far each fine peak is still there, 0 to 1
  float before_bin_[kFinePeaks] = {};  // the fine frame before: where its peaks stood,
  bool before_sure_[kFinePeaks] = {};  // which were sure of their pitch
  int before_doubt_[kFinePeaks] = {};  // and their doubt
  int fine_doubt_[kFinePeaks] = {};    // each fine peak: trackings its middle peak was unsure, less those it was sure
  // Each fine peak: trackings left since a very sure middle peak stood at or
  // above it, and at or below it (a tone that sways passes its own side
  // lines both ways; two tones that hold do not).
  int fine_above_[kFinePeaks] = {}, fine_below_[kFinePeaks] = {};
  int before_above_[kFinePeaks] = {}, before_below_[kFinePeaks] = {};
  // Trackings left since the middle frame was very sure of a peak in each
  // eighth of a bin, up to the fine frame's top.
  unsigned char swept_[kSweptCells] = {};
  float swept_before_[kMidPeaks] = {};  // where it was that sure the tracking before
  // The quick frame's power about each of its lower bins over the last
  // trackings (nothing under where it looks).
  float quick_power_[kLevels][kQuickSeen] = {};
  int level_at_ = 0;
  int swept_before_count_ = 0;
  int fine_count_ = 0;
  int order_[kMaxPeaks] = {};

  Voice voices_[kPool];
  int active_[kPool] = {};
  int claimed_[kPool] = {};  // the peak each sine was given this frame, or -1
  float reach_[kMaxPeaks] = {};  // track(): how far each peak is from the sine being matched, or -1 out of reach
  int born_[kPool] = {};
  int active_count_ = 0;
  int need_ = 0;  // frames a partial must last (Steady)

  int shown_[kShown] = {};
  float shown_size_[kShown] = {};
  int shown_count_ = 0;

  float attack_coeff_ = 1.0f, release_coeff_ = 1.0f, glide_coeff_ = 1.0f;
  float pan_coeff_ = 1.0f, fade_coeff_ = 1.0f;
  float lock_ = kLock;  // the share of the phase error the lock takes up per frame
  float ceiling_ = kCeiling;  // what the sum of the sines' levels is held to at this Mix
  float ceiling_gain_ = 1.0f;
  bool retune_ = false;
  bool slept_ = false;  // the block before this one was slept through

  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;

#ifdef SINE_SHADOW_PROBE
 public:
  long probe_fine_ = 0, probe_quick_ = 0;  // peaks the fine and the quick frame spoke for (the checker's probes)
  int probe_count_ = 0;                    // the peaks that stood at the last tracking
  long probe_tracks_ = 0;
  const Peak* probe_peaks() const { return peaks_; }
  Peak probe_mid_[kMidPeaks];
  int probe_mid_count_ = 0;
  const Peak* probe_fine_peaks() const { return fine_peaks_; }
  int probe_fine_count() const { return fine_count_; }
  const int* probe_doubt() const { return fine_doubt_; }
  const Voice* probe_voices() const { return voices_; }
#endif
};

}  // namespace livemix
