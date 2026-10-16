// Wavetables and sample playback: the Wavetable (cpp/devices/wavetable) and
// the Sampler (cpp/devices/sampler), each playing one key, a sample at a time,
// so the place each reads its sound from can be followed as it moves.
//
//   Wavetable   phase ─► one cycle, stored ─► between two entries ─► the copy for this octave
//               ─► between two frames ─► envelope, low-pass, soft clip ─► out
//   Sampler     read head ─► a whole recording, stored ─► between four frames ─► the copy for
//               this rate ─► loop and crossfade ─► envelope, low-pass, soft clip ─► sampler
//
// Nothing goes in. The lab presses a key 10 ms into the loop and lets it go
// after "Key held for": on the Wavetable at Pitch, on the Sampler at middle C,
// which Tune then moves.
//
// Read from the Wavetable: its stored cycles (the two frames either side of
// the place in the row), the place in the row and its output. Asked of the
// device's own function, called by itself ("called"): the copy a key reads,
// at 241 pitches across the Pitch control. Its motion LFO is the
// kit's sine table read at the device's phase ("kit"), and the two checks on
// that table are the table against the exact sine.
// Worked out here from the device's tables and state ("lesson"): the cycle a
// key reads, which is a blend of stored ones; the harmonics of a cycle, by the
// sum the Fourier transform is, and where each lands at the pitch played; the
// cycle between its entries, exactly, from those harmonics; the oscillator's
// own signal, which the device does not keep; and the same oscillator reading
// the full cycle at every pitch, which the device does not do.
//
// The Sampler holds a recording the lab makes once: two seconds of the
// Wavetable itself on middle C, on the table Reed to Saw, with Position moved
// from one end of the row to the other while the key is held. It is handed to
// the device through its own entry points, as a host hands over a file.
// Read from the Sampler: its output, where its read head stands, and the
// voices before the tone filter. By the device's own functions, called by
// themselves ("called"): the same voices read from the full-rate recording.
// The lab runs every voice again by the device's `play`, once on the copy the
// device reads (the "twin" check holds that run to the device's own sound on
// every render) and once on copy 0. And what a read halfway between two frames
// does to each frequency, from four weights the device's `read` gives. The
// same curve for a straight line between two frames is worked out here
// ("lesson").
//
// The build path puts the Wavetable's voice together in six pieces, each a
// few lines of `Reader` and `Built` below: one cycle in a table; a phase that
// reads it; reading between entries; a table for each octave; morphing; and
// the rest of the voice. The step chosen changes only the "built" taps. The
// build reads the device's own tables, and takes from the device as it runs
// what is not the subject here: where each oscillator starts in its cycle, the
// place in the row, the envelope, and the numbers its filter and its controls
// have glided to. The arithmetic is done again in the build's own lines. Two
// copies run: one at the step chosen, and one with every piece, whose sound is
// compared on every render with the device's output (the "builtDifference"
// check).
//
// The lab starts where the technique shows plainly, not where the device
// starts: the table Reed to Saw at the saw's end (the device starts on Glass at
// 0.3); Motion at 0 (0.45), Detune at 0 (9 cents) and Sub at 0 (0.25), so that
// one oscillator sounds alone; Cutoff at 20 kHz (4.2 kHz) and Resonance at 0
// (0.15), so that the filter hides nothing; Attack at 20 ms (1.2 s) and Release
// at 0.3 s (3.5 s), so that the note fits the loop; Volume at -3 dB (-9 dB), so
// that it is heard beside the rest. The Sampler starts with Wobble at 0 (the
// device's is 0.2) and Tone at 18 kHz (8 kHz), and its Volume is set to -3 dB
// (the device's is -9). Its Start, End, Reverse, Fine, Attack, Release and
// Velocity stay where the device starts them: the key plays the recording from
// 0.3 s to 1.7 s.

// lab-memory-mb: 96

#include "lab.h"

#include "../../cpp/devices/sampler/sampler.h"
#include "../../cpp/devices/wavetable/wavetable.h"

using namespace livemix;

namespace {

Wavetable instrument;
Sampler player;

constexpr int kSize = Wavetable::kSize;
constexpr int kFrames = Wavetable::kFrames;
constexpr int kLevels = Wavetable::kLevels;
constexpr int kHarmonics = Wavetable::kHarmonics;
constexpr int kVoices = Wavetable::kMaxVoices;

// One table of the device: a row of frames, each stored at ten levels of detail.
using Row = const float (*)[kLevels][kSize + 1];

constexpr int kKey = 1;
constexpr float kStrike = 0.8f;
constexpr int kKeyDown = 480;  // the key goes down 10 ms into the loop, so the loop's wrap is silence

lab::Control pitch{"pitch", "Pitch", "Hz", 27.5f, 4186.0f, 220.0f, lab::kLog};
lab::Control table{"table", "Table", "", 0.0f, 4.0f, 2.0f, lab::kLinear, "Glass|Vowels|Reed to Saw|Hollow|Spectral"};
lab::Control position{"position", "Position", "", 0.0f, 1.0f, 1.0f};
lab::Control motion{"motion", "Motion", "", 0.0f, 1.0f, 0.0f};
lab::Control rate{"rate", "Rate", "Hz", 0.01f, 10.0f, 0.11f, lab::kLog};
lab::Control detune{"detune", "Detune", "ct", 0.0f, 50.0f, 0.0f};
lab::Control sub{"sub", "Sub", "", 0.0f, 1.0f, 0.0f};
lab::Control cutoff{"cutoff", "Cutoff", "Hz", 80.0f, 20000.0f, 20000.0f, lab::kLog};
lab::Control resonance{"resonance", "Resonance", "", 0.0f, 1.0f, 0.0f};
lab::Control attack{"attack", "Attack", "s", 0.005f, 20.0f, 0.02f, lab::kLog};
lab::Control release{"release", "Release", "s", 0.02f, 30.0f, 0.3f, lab::kLog};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 0.7f};
lab::Control volume{"volume", "Volume", "dB", -48.0f, 6.0f, -3.0f};
lab::Control hold{"hold", "Key held for", "s", 0.25f, 3.9f, 3.0f};
// The Sampler's.
lab::Control tune{"tune", "Tune", "st", -24.0f, 24.0f, 0.0f};
lab::Control loop{"loop", "Loop", "", 0.0f, 2.0f, 1.0f, lab::kLinear, "Off|Forward|Ping-pong"};
lab::Control crossfade{"crossfade", "Crossfade", "ms", 0.0f, 500.0f, 50.0f};
lab::Control wobble{"wobble", "Wobble", "", 0.0f, 1.0f, 0.0f};
lab::Control tone{"tone", "Tone", "Hz", 200.0f, 18000.0f, 18000.0f, lab::kLog};

// One cycle, as it is stored and as it is read.
lab::Tap cycle_full{"cycleFull", "The cycle with every harmonic", lab::kCurve, lab::kLesson, 1};
lab::Tap cycle_read{"cycle", "The cycle the oscillator reads", lab::kCurve, lab::kLesson, 1};
lab::Tap frame_below{"frameBelow", "The stored frame below", lab::kCurve, lab::kDevice, 1};
lab::Tap frame_above{"frameAbove", "The stored frame above", lab::kCurve, lab::kDevice, 1};

// The harmonics of a cycle, each where it lands at the pitch played.
lab::Tap bars_kept{"barsKept", "Harmonics under half the rate", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap bars_folded{"barsFolded", "Harmonics that folded back", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap bars_read{"barsRead", "Harmonics of the cycle the oscillator reads", lab::kSpectrum, lab::kLesson, 1, "dB"};

// Sixteen entries of the full cycle where it is steepest, read three ways.
lab::Tap read_below{"readBelow", "The entry below", lab::kCurve, lab::kLesson, 1};
lab::Tap read_between{"readBetween", "Between two entries", lab::kCurve, lab::kLesson, 1};
lab::Tap read_exact{"readExact", "The cycle itself, from its harmonics", lab::kCurve, lab::kLesson, 1};

// The highest harmonic a key holds, at every pitch.
lab::Tap copy_top{"copyTop", "Top harmonic of the copy read", lab::kCurve, lab::kCalled, 1, "Hz"};

// A read halfway between two frames, against frequency.
lab::Tap two_point{"twoPoint", "Two neighbours, a straight line", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap four_point{"fourPoint", "Four neighbours, the Sampler's weights", lab::kSpectrum, lab::kCalled, 1, "dB"};

// The loop, in the lesson's order but for the last: play starts on the last of these.
lab::Tap naive_tap{"naive", "The full cycle at every pitch", lab::kAudio, lab::kLesson, 1};
lab::Tap osc_tap{"osc", "The oscillator", lab::kAudio, lab::kLesson, 1};
lab::Tap removed_tap{"removed", "What the smaller copy leaves out", lab::kAudio, lab::kLesson, 1};
lab::Tap place_tap{"place", "Place in the row", lab::kControl, lab::kDevice, 1};
lab::Tap lfo_tap{"lfo", "The motion LFO", lab::kControl, lab::kKit, 1};
lab::Tap recording_tap{"recording", "The recording", lab::kAudio, lab::kDevice, 1};
lab::Tap head_tap{"head", "The read head", lab::kControl, lab::kDevice, 1, "s"};
lab::Tap sampled_full{"sampledFull", "Read from the full-rate recording", lab::kAudio, lab::kCalled, 1};
lab::Tap sampled{"sampled", "Read from the copy the Sampler chose", lab::kAudio, lab::kDevice, 1};
lab::Tap sampler_tap{"sampler", "The Sampler's output", lab::kAudio, lab::kDevice, 2};
lab::Tap sampler_picture{"samplerPicture", "The Sampler's harmonics over the loop", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap out_picture{"outPicture", "The output's harmonics over the loop", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check fits{"fits", "Harmonics of the full cycle that fit under half the rate at this pitch", ""};
lab::Check copy_read{"copyRead", "The copy the key reads, counted from 0", ""};
lab::Check copy_holds{"copyHolds", "Harmonics that copy holds", ""};
lab::Check copy_fade{"copyFade", "How far the read has crossed into the next copy", ""};
lab::Check table_error{"tableError", "The two stored cycles either side of Position, each against the sum of its recipe's sines: the worse", "dB"};
lab::Check step_error{"stepError", "The full cycle read at the entry below, against the cycle itself", "dB"};
lab::Check line_error{"lineError", "The full cycle read between entries, against the cycle itself", "dB"};
lab::Check sine_step{"sineStep", "The kit's sine table read at the entry below, against the exact sine, at worst", "dB"};
lab::Check sine_line{"sineLine", "The kit's sine table as the kit reads it, against the exact sine, at worst", "dB"};
lab::Check twin{"twin", "The Sampler's voices run again by the lab on the copy the device reads, against the Sampler's own", "dB"};
lab::Check sampler_copy{"samplerCopy", "The copy of the recording the Sampler's key reads, counted from 0", ""};

// ---------------------------------------------------------------------------
// The harmonics of a cycle, and the cycle from its harmonics.

double turn_cos[kSize];  // one turn of a unit vector in kSize steps
double turn_sin[kSize];

// What a cycle of kSize entries holds of each harmonic from 1 to `top`: the
// sum the Fourier transform is, one harmonic at a time. Harmonic n is
// re[n] cos(2 pi n x) + im[n] sin(2 pi n x), with x the place in the cycle.
void harmonics_of(const float* cycle, int top, double* re, double* im) {
  for (int n = 1; n <= top; ++n) {
    double c = 0.0, s = 0.0;
    int turn = 0;
    for (int j = 0; j < kSize; ++j) {
      c += cycle[j] * turn_cos[turn];
      s += cycle[j] * turn_sin[turn];
      turn = (turn + n) & (kSize - 1);
    }
    re[n] = 2.0 * c / kSize;
    im[n] = 2.0 * s / kSize;
  }
}

// The cycle at any place in it, from its harmonics: no table, no rounding to an entry.
double exact_at(const double* re, const double* im, int top, double place) {
  const double w = 2.0 * lab::kPi * place;
  const double cw = std::cos(w), sw = std::sin(w);
  double c = cw, s = sw, sum = 0.0;
  for (int n = 1; n <= top; ++n) {
    sum += re[n] * c + im[n] * s;
    const double next = c * cw - s * sw;
    s = s * cw + c * sw;
    c = next;
  }
  return sum;
}

double size_of(const double* re, const double* im, int n) { return std::sqrt(re[n] * re[n] + im[n] * im[n]); }

constexpr float kBarFloor = -100.0f;  // a harmonic smaller than this is not drawn
constexpr int kBarPoints = 2401;      // a point every 10 Hz up to half the sample rate

float bar_db(double power) { return power > 1.0e-10 ? static_cast<float>(10.0 * std::log10(power)) : kBarFloor; }

// Where a frequency comes out once sampled: its distance to the nearest multiple of the rate.
double lands_at(double hz) { return std::fabs(hz - lab::kSampleRate * std::floor(hz / lab::kSampleRate + 0.5)); }

// ---------------------------------------------------------------------------
// The build path: the Wavetable's voice put together a piece at a time.

// The pieces, in the order the steps add them.
enum Piece : int { kStored = 0, kPhase = 1, kBetween = 2, kOctave = 3, kMorph = 4, kVoice = 5 };

// One oscillator of the build: a place in a cycle, and the pieces that read a table from it.
struct Reader {
  int pieces = kStored;
  int entry = 0;       // where a table read straight through has got to
  float phase = 0.0f;  // how far through its cycle the wave is, from 0 to 1
  int copy = 0;        // which of the ten copies of a frame is read
  float fade = 0.0f;   // how far the read has crossed into the next copy up, from 0 to 1

  // The stored frame nearest a place in the row.
  static int nearest(float place) {
    const int frame = static_cast<int>(place * static_cast<float>(kFrames - 1) + 0.5f);
    return frame > kFrames - 1 ? kFrames - 1 : frame;
  }

  // One cycle in a table: the next entry on every sample, and round again after the last.
  float straight(const float* stored) {
    const int now = entry;
    entry = entry + 1 < kSize ? entry + 1 : 0;
    return stored[now]; }

  // A phase that reads it: the phase moves on by the note's share of a cycle
  // on every sample and comes back by a whole cycle at the end of one, and
  // the entry it has reached is read.
  void advance(float increment) {
    phase += increment;
    if (phase >= 1.0f) phase -= 1.0f;
  }
  float below(const float* stored) const { return stored[static_cast<int>(phase * static_cast<float>(kSize))]; }

  // Reading between entries: the phase stands part of the way from one entry
  // to the next, and the read goes that part of the way between their values.
  float between(const float* stored) const {
    const float at = phase * static_cast<float>(kSize);
    const int index = static_cast<int>(at);
    const float fraction = at - static_cast<float>(index);
    return stored[index] + (stored[index + 1] - stored[index]) * fraction; }

  // A table for each octave: copy k of a frame holds 512 >> k harmonics. The
  // copy read is the first whose top harmonic stays under half the sample
  // rate at this pitch, and over the top quarter of its octave the read
  // crosses into the next copy up.
  void choose(float increment) {
    const float octave = std::log2(increment * static_cast<float>(2 * kHarmonics));
    copy = static_cast<int>(std::ceil(octave));
    fade = 0.0f;
    if (copy < 0) copy = 0;
    if (copy >= kLevels - 1) {
      copy = kLevels - 1;
      return;
    }
    const float within = octave - static_cast<float>(copy - 1);
    const float t = kit::clamp((within - 0.75f) * 4.0f, 0.0f, 1.0f);
    fade = t * t * (3.0f - 2.0f * t); }

  // Morphing: the same read from the stored frame below the place in the row
  // and from the one above it, and a share of each.
  float morphed(Row row, int from, float place) const {
    const float along = place * static_cast<float>(kFrames - 1);
    int frame = static_cast<int>(along);
    if (frame > kFrames - 2) frame = kFrames - 2;
    const float share = along - static_cast<float>(frame);
    const float a = between(row[frame][from]);
    const float b = between(row[frame + 1][from]);
    return a + (b - a) * share; }

  // The cycle at this phase, from one copy, by the pieces there are so far.
  float read(Row row, int from, float place) const {
    if (pieces >= kMorph) return morphed(row, from, place);
    const float* stored = row[nearest(place)][from];
    return pieces >= kBetween ? between(stored) : below(stored);
  }

  // One sample of the oscillator from the pieces so far.
  float tick(Row row, float increment, float place) {
    if (pieces < kPhase) return straight(row[nearest(place)][0]);
    advance(increment);
    float y = read(row, copy, place);
    if (fade > 0.0f) y += (read(row, copy + 1, place) - y) * fade;
    return y; }
};

// One key of the build: an oscillator, and with the last piece a second one and a sine under them.
struct Note {
  Reader a, b;
  float sub = 0.0f;  // the phase of the sine an octave below
};

// The voice so far, run a sample at a time beside the device.
struct Built {
  int pieces = kStored;
  Note notes[kVoices];
  kit::Svf filter[2];
  float sharp = 1.0f;  // the ratio the sharper oscillator of a key is tuned up by
  float first = 0.0f;  // oscillator A of every sounding key, under the envelope
  float left = 0.0f, right = 0.0f;

  void start(int step) {
    pieces = step;
    for (kit::Svf& one : filter) one.reset();
    sharp = 1.0f;
    first = left = right = 0.0f;
  }

  // Both oscillators of a key read the copy that is safe for the sharper of the two.
  void pick(Note& note, const Wavetable::Voice& like) const {
    if (pieces < kOctave) return;
    const float highest = pieces >= kVoice ? like.increment * sharp : like.increment;
    note.a.choose(highest);
    note.b.choose(highest);
  }

  // A key of the device starts, or is found sounding: the build's oscillators
  // start where the device's stand in their cycles.
  void adopt(int slot, const Wavetable& device) {
    const Wavetable::Voice& like = device.pool_.voices[slot];
    Note& note = notes[slot];
    note = Note();
    note.a.pieces = note.b.pieces = pieces;
    note.a.phase = like.phase[0];
    note.b.phase = like.phase[1];
    note.sub = like.sub_phase;
    sharp = device.detune_up_;
    pick(note, like);
  }

  // One sample of the sound so far. `like` has just made its own sample:
  // `sounding` says which of its keys were sounding, `awake` whether it ran.
  void run(const Wavetable& like, const bool* sounding, bool awake) {
    const Row row = like.table_[like.set_];
    const bool whole = pieces >= kVoice;
    if (like.detune_up_ != sharp) {
      // Detune was turned: the device chooses every key's copy again, and so does the build.
      sharp = like.detune_up_;
      for (int v = 0; v < kVoices; ++v) {
        if (sounding[v]) pick(notes[v], like.pool_.voices[v]);
      }
    }
    float bus_a = 0.0f, bus_b = 0.0f, bus_sub = 0.0f;
    first = 0.0f;
    for (int v = 0; v < kVoices; ++v) {
      if (!sounding[v]) continue;
      const Wavetable::Voice& voice = like.pool_.voices[v];
      Note& note = notes[v];
      const float env = voice.env.level() * voice.gain;
      if (!whole) {
        bus_a += note.a.tick(row, voice.increment, voice.position[0]) * env;
        continue;
      }
      // The rest of the voice: two oscillators a few cents either side of the
      // note, each at its own place in the row, and a sine an octave below.
      const float a = note.a.tick(row, voice.increment * like.detune_down_, voice.position[0]);
      const float b = note.b.tick(row, voice.increment * like.detune_up_, voice.position[1]);
      note.sub += voice.increment * 0.5f;
      if (note.sub >= 1.0f) note.sub -= 1.0f;
      bus_sub += kit::SineTable::lookup(note.sub) * env;
      bus_a += (voice.flip ? b : a) * env;
      bus_b += (voice.flip ? a : b) * env;
      first += a * env;
    }
    const float level = like.volume_.value * like.table_fade_.value;
    if (!whole) {
      left = right = first = bus_a * Wavetable::kVoiceGain * level;
      return;
    }
    first *= Wavetable::kVoiceGain * level;
    if (!awake) {
      left = right = 0.0f;
      return;
    }
    // Spread puts one oscillator nearer each side; then the device's low-pass,
    // at the numbers its controls have glided to, and its soft clip.
    const float near = like.near_.value, far = like.far_.value;
    const float under = bus_sub * like.sub_.value * Wavetable::kSubGain;
    const float gain = Wavetable::kVoiceGain * like.filter_gain_.value;
    for (int c = 0; c < 2; ++c) {
      filter[c].g = like.filter_[c].g;
      filter[c].k = like.filter_[c].k;
      filter[c].a1 = like.filter_[c].a1;
      filter[c].a2 = like.filter_[c].a2;
      filter[c].a3 = like.filter_[c].a3;
    }
    left = kit::soft_clip(filter[0].lowpass((near * bus_a + far * bus_b + under) * gain) * level);
    right = kit::soft_clip(filter[1].lowpass((far * bus_a + near * bus_b + under) * gain) * level);
  }
};

lab::Build build{"One cycle in a table|A phase that reads it|Reading between entries|A table for each octave|"
                 "Morphing|The rest of the voice",
                 kVoice, -120.0f,
                 "The voice as built, all six pieces, against the Wavetable's own output"};

lab::Tap built{"built", "The voice so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_cycle{"builtCycle", "The cycle the build reads", lab::kCurve, lab::kLesson, 1};

lab::Check built_error{"builtError", "The oscillator so far, against the cycle it reads worked out exactly", "dB"};
lab::Check built_hz{"builtHz", "How many times a second the oscillator so far goes round its cycle", "Hz"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// The same oscillator as the device's first, but reading the full cycle
// whatever the pitch: the device's own read without its choice of copy.
Reader unguarded[kVoices];

// ---------------------------------------------------------------------------
// Setting the two devices up.

void configure_instrument() {
  instrument.init(lab::kSampleRate);
  instrument.set_param(wavetable::kTable, table.value);
  instrument.set_param(wavetable::kPosition, position.value);
  instrument.set_param(wavetable::kMotion, motion.value);
  instrument.set_param(wavetable::kRate, rate.value);
  instrument.set_param(wavetable::kDetune, detune.value);
  instrument.set_param(wavetable::kSub, sub.value);
  instrument.set_param(wavetable::kCutoff, cutoff.value);
  instrument.set_param(wavetable::kResonance, resonance.value);
  instrument.set_param(wavetable::kAttack, attack.value);
  instrument.set_param(wavetable::kRelease, release.value);
  instrument.set_param(wavetable::kSpread, spread.value);
  instrument.set_param(wavetable::kVolume, volume.value);
}

// The recording the Sampler plays: two seconds of the Wavetable on middle C.
constexpr int kRecorded = 96000;
constexpr int kSweepEnds = 88800;  // Position reaches the far end of the row 1.85 s in
constexpr int kRecordedUp = 91200; // and the key comes up at 1.9 s
constexpr float kSamplerVolume = -3.0f;

float recording_[kRecorded];

// One key of the Wavetable, recorded as a host would record it: Position is
// moved a little before every block of 16 samples, as an automated control is.
void record() {
  instrument.init(lab::kSampleRate);
  instrument.set_param(wavetable::kTable, 2.0f);
  instrument.set_param(wavetable::kPosition, 0.0f);
  instrument.set_param(wavetable::kMotion, 0.0f);
  instrument.set_param(wavetable::kDetune, 0.0f);
  instrument.set_param(wavetable::kSub, 0.0f);
  instrument.set_param(wavetable::kCutoff, 20000.0f);
  instrument.set_param(wavetable::kResonance, 0.0f);
  instrument.set_param(wavetable::kAttack, 0.005f);
  instrument.set_param(wavetable::kRelease, 0.05f);
  instrument.set_param(wavetable::kSpread, 0.0f);
  instrument.set_param(wavetable::kVolume, 0.0f);
  instrument.note_on(kKey, Sampler::kMiddleC, 1.0f);
  constexpr int kBlock = lab::kControlPeriod;
  for (int i = 0; i < kRecorded; i += kBlock) {
    instrument.set_param(wavetable::kPosition, kit::clamp(static_cast<float>(i) / kSweepEnds, 0.0f, 1.0f));
    if (i == kRecordedUp) instrument.note_off(kKey);
    instrument.process(kBlock);
    for (int j = 0; j < kBlock; ++j) recording_[i + j] = instrument.out_left()[j];
  }
}

// The Sampler's weights for a read halfway between two frames, taken from the
// device: one frame of 1 among zeros is handed to it, and its own `read` is
// asked for the four places half a frame and a frame and a half either side.
float weights_[4];

void measure_weights() {
  player.init(lab::kSampleRate);
  float* store = player.sample_buffer();
  for (int i = 0; i < 256; ++i) store[i] = 0.0f;
  store[128] = 1.0f;
  player.sample_commit(256, 1, lab::kSampleRate);
  for (int k = 0; k < 4; ++k) {
    float left = 0.0f, right = 0.0f;
    player.read(0, 126.5 + k, Sampler::kOpen, &left, &right);
    weights_[k] = left;  // the weight of a frame 1.5 - k frames ahead of the read
  }
}

void configure_player() {
  player.init(lab::kSampleRate);
  float* store = player.sample_buffer();
  for (int i = 0; i < kRecorded; ++i) store[i] = recording_[i];
  player.sample_commit(kRecorded, 1, lab::kSampleRate);
  // The half-rate and quarter-rate copies, built now as the device builds its own at init.
  while (!player.mips_ready_) player.build_mips(1 << 20);
  player.set_param(sampler::kTune, tune.value);
  player.set_param(sampler::kLoop, loop.value);
  player.set_param(sampler::kCrossfade, crossfade.value);
  player.set_param(sampler::kWobble, wobble.value);
  player.set_param(sampler::kTone, tone.value);
  player.set_param(sampler::kVolume, kSamplerVolume);
}

// ---------------------------------------------------------------------------
// The pictures that are not sound.

// One cycle as a curve: 2,049 points, the first entry again at the end.
bool open_cycle(lab::Tap& tap) {
  if (!tap.open(kSize + 1)) return false;
  tap.x0 = 0.0f;
  tap.x1 = 1.0f;
  return true;
}

// The cycle a read makes of two stored frames: copy `from` of each, and with
// `fade` the next copy up as well, as Reader does it a sample at a time.
void blended(float* out, Row row, float place, int from, float fade, bool morph) {
  const float along = place * static_cast<float>(kFrames - 1);
  int frame = static_cast<int>(along);
  if (frame > kFrames - 2) frame = kFrames - 2;
  const float share = along - static_cast<float>(frame);
  const int nearest = Reader::nearest(place);
  for (int j = 0; j <= kSize; ++j) {
    const auto one = [&](int copy) {
      if (!morph) return row[nearest][copy][j];
      const float lower = row[frame][copy][j], upper = row[frame + 1][copy][j];
      return lower + (upper - lower) * share;
    };
    float y = one(from);
    if (fade > 0.0f) y += (one(from + 1) - y) * fade;
    out[j] = y;
  }
}

double harmonic_re[kHarmonics + 1];
double harmonic_im[kHarmonics + 1];

// A cycle read at the entry below and between entries, each against the cycle
// itself: at four places between every pair of entries in turn, the level of
// what the read gets wrong against the level of the cycle, in dB.
void read_errors(const float* cycle, int top, float* below_db, float* between_db) {
  harmonics_of(cycle, top, harmonic_re, harmonic_im);
  double below = 0.0, between = 0.0, whole = 0.0;
  for (int j = 0; j < kSize; ++j) {
    const double fraction = (2 * (j & 3) + 1) / 8.0;
    const double exact = exact_at(harmonic_re, harmonic_im, top, (j + fraction) / kSize);
    const double line = cycle[j] + (cycle[j + 1] - cycle[j]) * fraction;
    below += (cycle[j] - exact) * (cycle[j] - exact);
    between += (line - exact) * (line - exact);
    whole += exact * exact;
  }
  *below_db = lab::ratio_db(below, whole);
  *between_db = lab::ratio_db(between, whole);
}

// The harmonics a cycle holds, each drawn where it comes out at the pitch
// played: `kept` takes those under half the sample rate, `folded` the rest,
// at the frequency each lands on (the lesson on samples and aliasing).
void bars(const float* cycle, int top, float hz, lab::Tap& kept, lab::Tap* folded, int* fitting) {
  harmonics_of(cycle, top, harmonic_re, harmonic_im);
  static double under[kBarPoints], over[kBarPoints];
  for (int p = 0; p < kBarPoints; ++p) under[p] = over[p] = 0.0;
  const double per_point = 0.5 * lab::kSampleRate / (kBarPoints - 1);
  int fit = 0;
  for (int n = 1; n <= top; ++n) {
    const double at = static_cast<double>(n) * hz;
    const bool fits_under = at < 0.5 * lab::kSampleRate;
    const double lands = fits_under ? at : lands_at(at);
    int p = static_cast<int>(lands / per_point + 0.5);
    if (p > kBarPoints - 1) p = kBarPoints - 1;
    const double power = harmonic_re[n] * harmonic_re[n] + harmonic_im[n] * harmonic_im[n];
    (fits_under ? under : over)[p] += power;
    fit += fits_under ? 1 : 0;
  }
  if (fitting) *fitting = fit;
  lab::Tap* const taps[] = {&kept, folded};
  const double* const sums[] = {under, over};
  for (int t = 0; t < 2; ++t) {
    if (!taps[t] || !taps[t]->open(kBarPoints)) continue;
    taps[t]->x0 = 0.0f;
    taps[t]->x1 = 0.5f * lab::kSampleRate;
    for (int p = 0; p < kBarPoints; ++p) taps[t]->set(p, bar_db(sums[t][p]));
  }
}

// The stored cycle against its recipe: the device's own recipe for the frame
// is summed here as sines, in double precision, and the stored cycle held to
// it. The device scales each frame to an even loudness; the scale that fits
// best is taken out before the two are compared.
float recipe_error(Wavetable& device, int set, int frame) {
  device.recipe(set, static_cast<float>(frame) / static_cast<float>(kFrames - 1));
  static double sum[kSize];
  for (int j = 0; j < kSize; ++j) sum[j] = 0.0;
  for (int n = 1; n <= kHarmonics; ++n) {
    const double angle = 2.0 * lab::kPi * device.phase_[n];
    const double c = device.amp_[n] * std::cos(angle), s = device.amp_[n] * std::sin(angle);
    if (c == 0.0 && s == 0.0) continue;
    int turn = 0;
    for (int j = 0; j < kSize; ++j) {
      sum[j] += turn_sin[turn] * c + turn_cos[turn] * s;
      turn = (turn + n) & (kSize - 1);
    }
  }
  const float* stored = device.table_[set][frame][0];
  double both = 0.0, own = 0.0;
  for (int j = 0; j < kSize; ++j) {
    both += stored[j] * sum[j];
    own += sum[j] * sum[j];
  }
  const double scale = own > 0.0 ? both / own : 0.0;
  double apart = 0.0, whole = 0.0;
  for (int j = 0; j < kSize; ++j) {
    const double d = stored[j] - scale * sum[j];
    apart += d * d;
    whole += static_cast<double>(stored[j]) * stored[j];
  }
  return lab::ratio_db(apart, whole);
}

// The kit's sine table against the exact sine, at eight places between every
// pair of entries: as the kit reads it, and at the entry below. The largest
// error of each, in dB against the sine's own peak of 1. The table never
// changes, so this is worked out once.
float sine_line_db = 0.0f, sine_step_db = 0.0f;

void sine_table_errors() {
  const float* stored = kit::SineTable::data();
  double worst_line = 0.0, worst_step = 0.0;
  for (int i = 0; i < kit::SineTable::kSize; ++i) {
    for (int k = 0; k < 8; ++k) {
      const float phase = (static_cast<float>(i) + 0.125f * static_cast<float>(k)) / kit::SineTable::kSize;
      const double exact = std::sin(2.0 * lab::kPi * static_cast<double>(phase));
      const double line = std::fabs(kit::SineTable::lookup(phase) - exact);
      const double step = std::fabs(stored[i] - exact);
      if (line > worst_line) worst_line = line;
      if (step > worst_step) worst_step = step;
    }
  }
  sine_line_db = worst_line > 1.0e-10 ? static_cast<float>(20.0 * std::log10(worst_line)) : lab::kFloorDb;
  sine_step_db = worst_step > 1.0e-10 ? static_cast<float>(20.0 * std::log10(worst_step)) : lab::kFloorDb;
}

// What a read halfway between two frames does to each frequency: the size of
// the sum of its weights, each turned by how far its frame stands from the read.
void halfway_curve(lab::Tap& tap, const float* weights, int count) {
  constexpr int kPoints = 241;
  if (!tap.open(kPoints)) return;
  tap.x0 = 0.0f;
  tap.x1 = 0.5f * lab::kSampleRate;
  for (int p = 0; p < kPoints; ++p) {
    const double w = lab::kPi * p / (kPoints - 1);  // radians a frame
    double re = 0.0, im = 0.0;
    for (int k = 0; k < count; ++k) {
      const double ahead = 0.5 * (count - 1) - k;  // frames ahead of the read
      re += weights[k] * std::cos(w * ahead);
      im += weights[k] * std::sin(w * ahead);
    }
    const double size = std::sqrt(re * re + im * im);
    tap.set(p, size > 1.0e-3 ? static_cast<float>(20.0 * std::log10(size)) : -60.0f);
  }
}

}  // namespace

void lab_setup() {
  for (int j = 0; j < kSize; ++j) {
    turn_cos[j] = std::cos(2.0 * lab::kPi * j / kSize);
    turn_sin[j] = std::sin(2.0 * lab::kPi * j / kSize);
  }
  measure_weights();
  record();
  sine_table_errors();
}

void lab_render(int frames) {
  configure_instrument();
  configure_player();
  const int total = lab::total();
  constexpr int kBlock = lab::kControlPeriod;
  // Let go at the loop's end or after it, the key is never let go.
  int release_at = kKeyDown + static_cast<int>(hold.value * lab::kSampleRate);
  release_at -= release_at % kBlock;
  // The cycle is looked at half a second after the key goes down, or as the loop ends.
  const int look_at = kKeyDown + 24000 < frames ? kKeyDown + 24000 : frames - 1;

  shown.start(build.at());
  held.start(build.compared_step);
  int key = -1;      // the Wavetable's voice the lab's key plays
  int playing = -1;  // and the Sampler's
  float place_now = position.value;
  float place_seen = position.value;
  float head_now = 0.0f;
  double built_apart = 0.0, built_whole = 0.0;
  double twin_apart = 0.0, twin_whole = 0.0;
  // How far the oscillator so far has gone round its cycle, for its pitch.
  double turns = 0.0, last_turn = 0.0;
  int turned_for = 0;
  bool turning = false;

  const auto adopt = [](int slot) {
    shown.adopt(slot, instrument);
    held.adopt(slot, instrument);
    Reader& reader = unguarded[slot];
    reader = Reader();
    reader.pieces = kMorph;
    reader.phase = instrument.pool_.voices[slot].phase[0];
  };

  for (int i = 0; i < total; ++i) {
    const int at = i % frames;
    if (at == kKeyDown) {
      instrument.note_on(kKey, pitch.value, kStrike);
      player.note_on(kKey, Sampler::kMiddleC, kStrike);
      key = instrument.pool_.find_held(kKey);
      playing = player.pool_.find_held(kKey);
      if (i >= frames && key >= 0) {
        adopt(key);
        turning = false;
      }
      if (i >= frames && i < 2 * frames && playing >= 0) {
        sampler_copy.value = static_cast<float>(player.pool_.voices[playing].mip);
      }
    }
    if (at == release_at) {
      instrument.note_off(kKey);
      player.note_off(kKey);
    }
    if (i < frames) {
      // The first pass is only there so that the second starts as the tenth
      // would: nothing of it is kept, and the devices run it a block at a time.
      instrument.process(kBlock);
      player.process(kBlock);
      i += kBlock - 1;
      continue;
    }
    if (i == frames) {
      // Keys still sounding from the pass before: the build takes them up where they stand.
      for (int v = 0; v < kVoices; ++v) {
        if (instrument.pool_.voices[v].env.active()) adopt(v);
      }
      for (int c = 0; c < 2; ++c) shown.filter[c] = held.filter[c] = instrument.filter_[c];
    }
    const bool kept = i < 2 * frames;

    // The Wavetable. Which keys sound, and whether it runs at all, are noted
    // before it makes its sample, as it decides them itself.
    bool sounding[kVoices];
    bool any = false;
    for (int v = 0; v < kVoices; ++v) {
      sounding[v] = instrument.pool_.voices[v].env.active();
      any = any || sounding[v];
    }
    const bool awake = any || !instrument.idle_.asleep();
    instrument.process(1);

    // The oscillator the device does not have: the full cycle at every pitch.
    const Row row = instrument.table_[instrument.set_];
    float full = 0.0f;
    for (int v = 0; v < kVoices; ++v) {
      if (!sounding[v]) continue;
      const Wavetable::Voice& voice = instrument.pool_.voices[v];
      full += unguarded[v].tick(row, voice.increment * instrument.detune_down_, voice.position[0]) *
              (voice.env.level() * voice.gain);
    }
    full *= Wavetable::kVoiceGain * (instrument.volume_.value * instrument.table_fade_.value);

    // The build path: the step chosen, and every piece against the device.
    shown.run(instrument, sounding, awake);
    held.run(instrument, sounding, awake);
    if (kept) {
      const double out_left = instrument.out_left()[0], out_right = instrument.out_right()[0];
      built_apart += (held.left - out_left) * (held.left - out_left) + (held.right - out_right) * (held.right - out_right);
      built_whole += out_left * out_left + out_right * out_right;
    }
    if (kept && key >= 0 && sounding[key]) {
      const Reader& reader = shown.notes[key].a;
      const double turn = shown.pieces < kPhase ? static_cast<double>(reader.entry) / kSize : reader.phase;
      if (turning) {
        turns += turn - last_turn + (turn < last_turn ? 1.0 : 0.0);
        ++turned_for;
      }
      last_turn = turn;
      turning = true;
    }

    float lfo_now = 0.0f;
    if (key >= 0) {
      const Wavetable::Voice& voice = instrument.pool_.voices[key];
      if (sounding[key]) place_now = voice.position[0];
      lfo_now = kit::SineTable::lookup(instrument.lfo_phase_ + voice.lfo_offset);
      if (kept && at <= look_at && sounding[key]) place_seen = voice.position[0];
    }

    // The Sampler, and beside it a second set of its voices: each is the
    // device's voice as it stood before this sample, run by the device's own
    // `play`, once on the copy the device reads and once on the full-rate recording.
    Sampler::Voice before[Sampler::kMaxVoices];
    bool was[Sampler::kMaxVoices];
    for (int v = 0; v < Sampler::kMaxVoices; ++v) {
      was[v] = player.pool_.voices[v].env.active();
      if (was[v]) before[v] = player.pool_.voices[v];
    }
    player.process(1);
    const float motor = 0.7f * kit::SineTable::lookup(player.wow_phase_) + 0.25f * player.drift_value_ +
                        0.08f * kit::SineTable::lookup(player.flutter_phase_);
    const float speed =
        player.pitch_ratio_ * player.rate_scale_ * (1.0f + player.wobble_.value * Sampler::kWobbleDepth * motor);
    float same_sum = 0.0f, full_sum = 0.0f;
    for (int v = 0; v < Sampler::kMaxVoices; ++v) {
      if (!was[v]) continue;
      Sampler::Voice same = before[v];
      const float env = same.env.next();
      if (!same.env.active()) continue;
      Sampler::Voice whole = same;
      whole.mip = 0;
      player.play(same, env, same.ratio * speed);
      player.play(whole, env, whole.ratio * speed);
      same_sum += same.out_left;
      full_sum += whole.out_left;
    }
    const float fade = player.fade_in_.value * Sampler::kVoiceGain;
    if (kept) {
      const double apart = static_cast<double>(same_sum * fade) - player.last_left_;
      twin_apart += apart * apart;
      twin_whole += static_cast<double>(player.last_left_) * player.last_left_;
    }
    if (playing >= 0 && player.pool_.voices[playing].env.active()) {
      head_now = static_cast<float>(player.pool_.voices[playing].position / lab::kSampleRate);
    }

    naive_tap.put(i, full);
    osc_tap.put(i, held.first);
    removed_tap.put(i, full - held.first);
    place_tap.put(i, place_now);
    lfo_tap.put(i, lfo_now);
    const int recorded = at - kKeyDown;
    recording_tap.put(i, recorded >= 0 && recorded < kRecorded ? recording_[recorded] : 0.0f);
    head_tap.put(i, head_now);
    sampled_full.put(i, full_sum * fade);
    sampled.put(i, player.last_left_);
    sampler_tap.put(i, player.out_left()[0], player.out_right()[0]);
    out_tap.put(i, instrument.out_left()[0], instrument.out_right()[0]);
    built.put(i, shown.left, shown.right);
  }
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  twin.value = lab::ratio_db(twin_apart, twin_whole);
  built_hz.value = turned_for > 0 ? static_cast<float>(turns * lab::kSampleRate / turned_for) : 0.0f;
  lab::spectrogram_tap(sampler_picture, sampler_tap.channel(0), frames);
  lab::spectrogram_tap(out_picture, out_tap.channel(0), frames);

  // The copy a key at this pitch reads, by the device's own choice.
  const Row row = instrument.table_[instrument.set_];
  Wavetable::Voice asked;
  asked.increment = kit::min(kit::clamp(pitch.value, 8.0f, 12000.0f) / lab::kSampleRate, 0.49f);
  instrument.update_pitch(asked);
  const float hz = asked.increment * lab::kSampleRate;
  copy_read.value = static_cast<float>(asked.mip);
  copy_holds.value = static_cast<float>(kHarmonics >> asked.mip);
  copy_fade.value = asked.mip_mix;

  // One cycle: the two stored frames, their blend with every harmonic, and the blend that is read.
  const float along = place_seen * static_cast<float>(kFrames - 1);
  int frame = static_cast<int>(along);
  if (frame > kFrames - 2) frame = kFrames - 2;
  if (open_cycle(frame_below) && open_cycle(frame_above)) {
    for (int j = 0; j <= kSize; ++j) {
      frame_below.set(j, row[frame][0][j]);
      frame_above.set(j, row[frame + 1][0][j]);
    }
  }
  if (!open_cycle(cycle_full) || !open_cycle(cycle_read) || !open_cycle(built_cycle)) return;
  blended(cycle_full.data, row, place_seen, 0, 0.0f, true);
  blended(cycle_read.data, row, place_seen, asked.mip, asked.mip_mix, true);
  // The build's cycle: the pieces there are decide which frames and which copy.
  const Reader& reader = shown.notes[key >= 0 ? key : 0].a;
  const bool chosen = shown.pieces >= kOctave && key >= 0;
  blended(built_cycle.data, row, place_seen, chosen ? reader.copy : 0, chosen ? reader.fade : 0.0f,
          shown.pieces >= kMorph);

  // What reading does to a cycle, against the cycle itself.
  float below_db = 0.0f, between_db = 0.0f;
  if (shown.pieces >= kPhase) {
    read_errors(built_cycle.data, kHarmonics >> (chosen ? reader.copy : 0), &below_db, &between_db);
    built_error.value = shown.pieces >= kBetween ? between_db : below_db;
  } else {
    built_error.value = lab::kFloorDb;  // every entry is read as it is stored
  }
  int fitting = 0;
  bars(cycle_read.data, kHarmonics >> asked.mip, hz, bars_read, nullptr, nullptr);
  bars(cycle_full.data, kHarmonics, hz, bars_kept, &bars_folded, &fitting);
  fits.value = static_cast<float>(fitting);
  read_errors(cycle_full.data, kHarmonics, &below_db, &between_db);  // leaves the full cycle's harmonics behind
  step_error.value = below_db;
  line_error.value = between_db;

  // Sixteen entries of the full cycle about its steepest place, read three ways.
  constexpr int kAround = 8, kFine = 32;
  const float* cycle = cycle_full.data;
  int steepest = 0;
  for (int j = 1; j < kSize; ++j) {
    if (std::fabs(cycle[j + 1] - cycle[j]) > std::fabs(cycle[steepest + 1] - cycle[steepest])) steepest = j;
  }
  lab::Tap* const reads[] = {&read_below, &read_between, &read_exact};
  bool room = true;
  for (lab::Tap* tap : reads) {
    room = tap->open(2 * kAround * kFine + 1) && room;
    tap->x0 = -static_cast<float>(kAround);
    tap->x1 = static_cast<float>(kAround);
  }
  if (!room) return;
  for (int p = 0; p <= 2 * kAround * kFine; ++p) {
    const int entry = (steepest - kAround + p / kFine + kSize) & (kSize - 1);
    const double fraction = static_cast<double>(p % kFine) / kFine;
    read_below.set(p, cycle[entry]);
    read_between.set(p, static_cast<float>(cycle[entry] + (cycle[entry + 1] - cycle[entry]) * fraction));
    read_exact.set(p, static_cast<float>(exact_at(harmonic_re, harmonic_im, kHarmonics, (entry + fraction) / kSize)));
  }

  table_error.value = kit::max(recipe_error(instrument, instrument.set_, frame),
                               recipe_error(instrument, instrument.set_, frame + 1));
  sine_line.value = sine_line_db;
  sine_step.value = sine_step_db;

  // The highest harmonic the copy read holds, at every pitch of the Pitch control.
  constexpr int kPitches = 241;
  if (copy_top.open(kPitches)) {
    copy_top.x0 = pitch.min;
    copy_top.x1 = pitch.max;
    copy_top.scale = lab::kLog;
    for (int p = 0; p < kPitches; ++p) {
      const float at = pitch.min * std::pow(pitch.max / pitch.min, static_cast<float>(p) / (kPitches - 1));
      Wavetable::Voice one;
      one.increment = at / lab::kSampleRate;
      instrument.update_pitch(one);
      copy_top.set(p, static_cast<float>(kHarmonics >> one.mip) * at);
    }
  }

  // A read halfway between two frames: a straight line, and the Sampler's four weights.
  const float line_weights[2] = {0.5f, 0.5f};
  halfway_curve(two_point, line_weights, 2);
  halfway_curve(four_point, weights_, 4);
}
