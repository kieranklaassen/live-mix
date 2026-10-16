// Oscillators and the subtractive voice: the Ladder Bass
// (cpp/devices/ladder-bass) playing a note, one sample at a time, so the
// sound can be read at every block of its one voice.
//
//   oscillator A ─┐
//   oscillator B ─┼─► mix ─► four-pole low-pass ─► × contour ─► out
//   sine, octave ─┘               ▲                    ▲
//   under                      cutoff ◄──── contour ───┘
//
// Nothing goes in. The lab presses a key 30 ms into the loop, past the 20 ms
// the loop's wrap is crossfaded over, and lets it go after "Key held for".
// With Plays on "A line" it presses sixteen steps of a bass line instead.
//
// Read from the device: the sound after the filter (the input its DC blocker
// kept), the contour, the output, and the filter's own coefficient.
// By the device's own oscillator, called on its own ("called"): one
// oscillator, and the mix of the oscillators and the sub. The device does not
// keep them: they are locals of its loop. The lab runs a second copy of the
// voice, piece for piece (`Built` below), whose output is held to the
// device's on every render; the two taps are read out of that copy and
// brought down to the page's rate by the kit's half-band filter, as the
// device brings its own sound down.
// Worked out here from the device's numbers ("lesson"): the cutoff in hertz,
// which the "cutoffError" check holds to the coefficient the device's filter
// holds.
// From the kit: an oscillator by itself (kit::BlepOsc), switched on by the key
// and off with it, in four shapes; and what the filter passes at the moment
// looked at, measured on a second kit::Ladder set as the device's is.
//
// Beside the loop are pictures that are not the loop: two cycles of each
// block's sound from the moment "Look at" names, and the size of each
// harmonic of the note in the four cycles from that moment; the same two
// pictures of each of the kit oscillator's four shapes at Pitch; and the
// kit's oscillator and the output as spectra over the loop.
//
// A second instrument plays beside the first: Dusk (cpp/devices/dusk), three
// keys of a chord held as long as the bass's one. Read from it: the envelope
// of its first key's voice, its output, and how many voices its keys hold.
// The cutoff of that voice is the device's own function, called here.
//
// The lab starts where the technique shows plainly: Beat at 0 (the device
// starts at 6 cents), so the two oscillators are one shape; Sub at 0 (0.3)
// and Drive at 0 (0.3), so every line of a spectrum is a harmonic of the
// note and the filter is close to clean; Volume at 0 dB (-9). Glide is left
// out: it slides between overlapping keys, and the lab's keys do not overlap.
//
// The build path puts the voice together in six pieces, each a few lines of
// `Built`: an oscillator; a second, detuned; a sine an octave under; a
// filter; the contour on the level; the contour on the filter. The step
// chosen changes only the "built" taps. Two copies run: one at the step
// chosen, and one with every piece, whose output is compared on every render
// with the device's own (the "builtDifference" check). Both take up each loop
// where the device stands after the pass that is thrown away: the places of
// its oscillators, and what its filter and its contour still hold.

#include "lab.h"

#include "../../cpp/devices/dusk/dusk.h"
#include "../../cpp/devices/ladder-bass/ladder_bass.h"

using namespace livemix;

namespace {

LadderBass bass;
Dusk pad;

constexpr int kKey = 1;
constexpr float kStrike = 1.0f;       // how hard every key is struck
constexpr int kKeyDown = 1440;        // the key goes down 30 ms into the loop
constexpr float kInnerRate = 4.0f * lab::kSampleRate;  // the rate the device's voice runs at
constexpr float kRawLevel = 0.25f;    // the peak of the kit's oscillator by itself

// The line: sixteen steps of 11,872 samples, a quarter of a second each. A
// step is so many semitones over Pitch, or a rest.
constexpr int kRest = -99;
constexpr int kLineSteps = 16;
constexpr int kLineStep = 11872;
constexpr float kLineHeld = 0.2f;  // the longest a key of the line stays down, in seconds
constexpr int kLine[kLineSteps] = {0, kRest, 0, 12, kRest, 0, 10, 12, 0, kRest, 0, 12, 7, kRest, 3, kRest};

// The pad's chord: an octave over Pitch, then a fifth and a tenth over that.
constexpr int kPadKeys = 3;
constexpr int kPadKey = 11;
constexpr int kPadSemitones[kPadKeys] = {12, 19, 28};
constexpr float kPadStrike = 0.8f;

lab::Control note{"note", "Pitch", "Hz", 32.70f, 523.25f, 110.0f, lab::kLog};
lab::Control hold{"hold", "Key held for", "s", 0.05f, 3.5f, 1.0f};
lab::Control pattern{"pattern", "Plays", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "One note|A line"};
lab::Control shape{"shape", "Shape", "", 0.0f, 3.0f, 3.0f, lab::kLinear, "Sine|Triangle|Square|Saw"};
lab::Control wave{"wave", "Wave", "", 0.0f, 1.0f, 0.0f};
lab::Control beat{"beat", "Beat", "cents", 0.0f, 25.0f, 0.0f};
lab::Control sub{"sub", "Sub", "", 0.0f, 1.0f, 0.0f};
lab::Control cutoff{"cutoff", "Cutoff", "Hz", 30.0f, 12000.0f, 500.0f, lab::kLog};
lab::Control emphasis{"emphasis", "Emphasis", "", 0.0f, 1.0f, 0.3f};
lab::Control contour{"contour", "Contour", "", 0.0f, 1.0f, 0.6f};
lab::Control decay{"decay", "Decay", "s", 0.03f, 10.0f, 0.6f, lab::kLog};
lab::Control drive{"drive", "Drive", "", 0.0f, 1.0f, 0.0f};
lab::Control volume{"volume", "Volume", "dB", -48.0f, 6.0f, 0.0f};
lab::Control look{"look", "Look at", "s", 0.0f, 2.0f, 0.02f};
lab::Control pad_cutoff{"padCutoff", "Pad cutoff", "Hz", 40.0f, 18000.0f, 2500.0f, lab::kLog};
lab::Control pad_envelope{"padEnvelope", "Pad envelope", "", -1.0f, 1.0f, 0.25f};
lab::Control pad_attack{"padAttack", "Pad attack", "s", 0.001f, 8.0f, 0.6f, lab::kLog};
lab::Control pad_release{"padRelease", "Pad release", "s", 0.002f, 12.0f, 2.5f, lab::kLog};
lab::Control pad_chorus{"padChorus", "Pad chorus", "", 0.0f, 3.0f, 1.0f, lab::kLinear, "Off|I|II|I + II"};

// The taps stand in the order of the signal, the bass's output last of the
// sounds: it is what the page opens on. The pad's taps come before the bass's.
lab::Tap raw_tap{"raw", "The kit's oscillator alone", lab::kAudio, lab::kKit, 1};
lab::Tap pad_env{"padEnv", "The pad's envelope", lab::kControl, lab::kDevice, 1};
lab::Tap pad_corner{"padCorner", "The pad's cutoff", lab::kControl, lab::kCalled, 1, "Hz"};
lab::Tap pad_tap{"pad", "The pad: three keys", lab::kAudio, lab::kDevice, 2};
lab::Tap osc_tap{"osc", "One oscillator", lab::kAudio, lab::kCalled, 1};
lab::Tap mix_tap{"mix", "The oscillators, mixed", lab::kAudio, lab::kCalled, 1};
lab::Tap filtered_tap{"filtered", "After the filter", lab::kAudio, lab::kDevice, 1};
lab::Tap contour_tap{"env", "The contour", lab::kControl, lab::kDevice, 1};
lab::Tap corner_tap{"corner", "The filter's cutoff", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap osc_wave{"oscWave", "One oscillator", lab::kCurve, lab::kCalled, 1};
lab::Tap mix_wave{"mixWave", "The oscillators, mixed", lab::kCurve, lab::kCalled, 1};
lab::Tap filtered_wave{"filteredWave", "After the filter", lab::kCurve, lab::kDevice, 1};
lab::Tap out_wave{"outWave", "Output", lab::kCurve, lab::kDevice, 1};
lab::Tap osc_parts{"oscHarmonics", "Harmonics of one oscillator", lab::kCurve, lab::kCalled, 1, "dB"};
lab::Tap mix_parts{"mixHarmonics", "Harmonics of the mix", lab::kCurve, lab::kCalled, 1, "dB"};
lab::Tap filtered_parts{"filteredHarmonics", "Harmonics after the filter", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap out_parts{"outHarmonics", "Harmonics of the output", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap response{"response", "What the filter passes", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap sine_wave{"sineWave", "Sine", lab::kCurve, lab::kKit, 1};
lab::Tap triangle_wave{"triangleWave", "Triangle", lab::kCurve, lab::kKit, 1};
lab::Tap square_wave{"squareWave", "Square", lab::kCurve, lab::kKit, 1};
lab::Tap saw_wave{"sawWave", "Saw", lab::kCurve, lab::kKit, 1};
lab::Tap sine_parts{"sineHarmonics", "Harmonics of the sine", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap triangle_parts{"triangleHarmonics", "Harmonics of the triangle", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap square_parts{"squareHarmonics", "Harmonics of the square", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap saw_parts{"sawHarmonics", "Harmonics of the saw", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap raw_picture{"rawPicture", "The kit's oscillator alone, over the loop", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap out_picture{"outPicture", "The output, over the loop", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check cutoff_error{"cutoffError", "The cutoff worked out again, against the coefficient the device's filter holds",
                        "%"};
lab::Check cutoff_now{"cutoffNow", "The filter's cutoff at the moment looked at", "Hz"};
lab::Check contour_now{"contourNow", "The contour at the moment looked at", ""};
lab::Check pad_held{"padHeld", "Voices the pad's three keys hold at once", "voices"};

lab::Tap built{"built", "The voice so far", lab::kAudio, lab::kLesson, 1};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kLesson, 1};
lab::Tap built_corner{"builtCorner", "Cutoff, as built", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap built_wave{"builtWave", "The voice so far", lab::kCurve, lab::kLesson, 1};
lab::Tap built_parts{"builtHarmonics", "Harmonics of the voice so far", lab::kCurve, lab::kLesson, 1, "dB"};

// ---------------------------------------------------------------------------
// The voice, a piece at a time: one function a piece, and run() to make a
// sample from the pieces there are. With every piece it does what the device
// does to make a sample, in the same order.

struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kOscillator = 0, kSecond, kSub, kFilter, kLevel, kSweep };

  int pieces = kOscillator;

  LadderBass::WaveOsc osc_a, osc_b;
  double sub_phase = 0.0;
  kit::Ladder ladder;
  kit::Halfband2x down[2];
  kit::DcBlocker dc;
  kit::Drift drift_common, drift_apart;
  kit::ControlClock clock;
  kit::IdleGate idle;

  float frequency = LadderBass::kPivotHz;  // of the key, in hertz
  float ratio_a = 1.0f, ratio_b = 1.0f;    // each oscillator's tuning against the key
  double apart_step = 0.0;
  double step_a = 0.0, step_b = 0.0, step_sub = 0.0;  // cycles a step, at four times the page's rate
  float saw = 0.0f, square = 0.0f;         // the oscillators' two readings, added up
  float saw_gain = 0.0f, square_gain = 0.0f, sub_gain = 0.0f;
  float push = 1.0f;                       // Drive, as a number to multiply by
  float back = 1.0f;                       // what is given back after the filter
  float loud = 1.0f;                       // Volume, as a number to multiply by
  float struck = 1.0f;                     // how hard the key was struck
  float contour_level = 0.0f;
  float strike_rate = 0.0f, decay_coeff = 0.0f, release_coeff = 0.0f;
  bool striking = false;
  bool holds = false;                      // Decay at the top: no fall while a key is down
  bool key_down = false;
  bool awake = false;
  float corner = 0.0f;                     // the filter's cutoff, in hertz
  float level = 0.0f;                      // what the sound is multiplied by
  float alone[4] = {};                     // the first oscillator by itself
  float sum[4] = {};                       // everything that goes to the filter
  float out = 0.0f;

  // An oscillator: a phase that climbs from 0 to 1 once in every cycle of
  // the note and starts again, read two ways at once (the device's own
  // WaveOsc): as a sawtooth, which is the phase itself stretched to run from
  // -1 to 1, and as a square, which is 1 for the first half of the cycle and
  // -1 for the second.
  void oscillator() { osc_a.next(step_a, &saw, &square); }

  // Wave shares the level between the two readings: all sawtooth at 0, all
  // square at 1.
  float blend() const { return saw_gain * saw + square_gain * square; }

  // A second, detuned: the same oscillator again, a few cents from the
  // first, added to it reading for reading.
  void second() {
    float saw_b, square_b;
    osc_b.next(step_b, &saw_b, &square_b);
    saw += saw_b;
    square += square_b;
  }

  // A sine an octave under: a third phase at half the speed, read from the
  // kit's sine table.
  float under() {
    sub_phase += step_sub;
    if (sub_phase >= 1.0) sub_phase -= 1.0;
    return sub_gain * kit::SineTable::lookup(static_cast<float>(sub_phase));
  }

  // Where the filter stands: Cutoff, moved half as far as the key is from
  // the C two octaves under middle C.
  float tuned() const {
    const float tracking = std::sqrt(frequency * (1.0f / LadderBass::kPivotHz));
    return cutoff.value * tracking;
  }

  // A filter: the kit's four-pole low-pass, with Drive as gain on the way in.
  float filter(float x) { return ladder.process(x * push); }

  // The contour: a strike that reaches 1 in 2 ms from wherever it stands,
  // then a fall that is 60 dB down after Decay. With the key up it falls at
  // the release's speed.
  float advance_contour() {
    if (striking) {
      contour_level += strike_rate * (LadderBass::kStrikeTarget - contour_level);
      if (contour_level >= 1.0f) {
        contour_level = 1.0f;
        striking = false;
      }
      return contour_level;
    }
    if (!key_down) {
      contour_level *= release_coeff;
    } else if (!holds) {
      contour_level *= decay_coeff;
    }
    if (contour_level < LadderBass::kSilent) contour_level = 0.0f;
    return contour_level;
  }

  // The contour on the filter: the same number opens the cutoff by up to
  // five octaves times Contour, and lets it close again as it falls.
  float swept(float contour_value) const {
    return tuned() * std::exp2(contour.value * LadderBass::kContourOctaves * contour_value);
  }

  // One sample of the voice from the pieces built so far. Everything up to
  // the filter runs four times for each sample that comes out, as the device
  // runs it, and two half-band filters bring the four down to one.
  float run() {
    // Like the device, the voice does nothing at all while nothing sounds.
    awake = idle.wake(contour_level > 0.0f || striking || (pieces < kLevel && key_down));
    if (!awake) {
      for (int k = 0; k < 4; ++k) alone[k] = sum[k] = 0.0f;
      level = pieces >= kLevel ? 0.0f : (key_down ? 1.0f : 0.0f);
      out = 0.0f;
      return out;
    }
    if (clock.tick()) control();
    const float contour_value = advance_contour();
    corner = pieces >= kSweep ? swept(contour_value) : tuned();
    if (pieces >= kFilter) ladder.set(kit::min(corner, LadderBass::kMaxCutoffHz), emphasis.value, kInnerRate);
    const double step = static_cast<double>(frequency) / kInnerRate;
    step_a = step * ratio_a - apart_step;
    step_b = step * ratio_b + apart_step;
    step_sub = step * 0.5;

    float y[4];
    for (int k = 0; k < 4; ++k) {
      oscillator();
      alone[k] = blend();
      if (pieces >= kSecond) second();
      float sound = blend();
      if (pieces >= kSub) sound += under();
      sum[k] = sound;
      y[k] = pieces >= kFilter ? filter(sound) : sound;
    }
    const float brought_down = down[1].down(down[0].down(y[0], y[1]), down[0].down(y[2], y[3]));

    level = pieces >= kLevel ? contour_value : (key_down ? 1.0f : 0.0f);
    const float given_back = pieces >= kFilter ? back : LadderBass::kOutGain;
    out = kit::soft_clip(dc.process(brought_down) * level * struck * given_back * loud);
    idle.settle(out < 0.0f ? -out : out, 1);
    return out;
  }

  // Every 32 samples: the slow drift of the two oscillators, as the device
  // draws it, and how far Beat sets them apart.
  void control() {
    const float common = LadderBass::kCommonDriftCents * drift_common.next(32);
    const float apart = 0.5f * beat.value;
    ratio_a = kit::cents_to_ratio(common - apart);
    ratio_b = kit::cents_to_ratio(common + apart);
    apart_step = static_cast<double>(LadderBass::kApartDriftHz * drift_apart.next(32)) / kInnerRate;
  }

  void key_on(float hz) {
    frequency = std::exp2(std::log2(kit::clamp(hz, 8.0f, 12000.0f)));
    key_down = true;
    striking = true;
  }
  void key_off() { key_down = false; }

  // The controls as the numbers the pieces use.
  void start(int pieces_) {
    pieces = pieces_;
    const float sr = lab::kSampleRate;
    saw_gain = LadderBass::kOscGain * (1.0f - wave.value);
    square_gain = LadderBass::kOscGain * LadderBass::kSquareLevel * wave.value;
    sub_gain = LadderBass::kSubGain * sub.value;
    const float db = drive.value * LadderBass::kMaxDriveDb;
    push = kit::db_to_gain(db);
    back = LadderBass::kOutGain * kit::db_to_gain(-0.5f * db);
    loud = kit::db_to_gain(volume.value);
    const float gain = kStrike;
    struck = 0.35f + 0.65f * gain;
    strike_rate =
        1.0f - std::exp(std::log((LadderBass::kStrikeTarget - 1.0f) / LadderBass::kStrikeTarget) /
                        kit::max(1.0f, LadderBass::kStrikeSeconds * sr));
    holds = decay.value >= LadderBass::kHoldFromSeconds;
    decay_coeff = std::exp(-LadderBass::kSixtyDb / (decay.value * sr));
    release_coeff = std::exp(-LadderBass::kSixtyDb / (kit::min(decay.value, LadderBass::kMaxReleaseSeconds) * sr));
    for (int k = 0; k < 4; ++k) alone[k] = sum[k] = 0.0f;
    corner = tuned();
    level = 0.0f;
    out = 0.0f;
    awake = false;
  }

  // Take the loop up where the device stands: the places of its oscillators,
  // its drift, and whatever its filter and its contour still hold.
  void adopt(const LadderBass& device) {
    osc_a = device.osc_a_;
    osc_b = device.osc_b_;
    sub_phase = device.sub_phase_;
    ladder = device.ladder_;
    down[0] = device.down_[0];
    down[1] = device.down_[1];
    dc = device.dc_;
    drift_common = device.drift_common_;
    drift_apart = device.drift_apart_;
    clock = device.clock_;
    idle = device.idle_;
    frequency = device.frequency_;
    ratio_a = device.ratio_a_;
    ratio_b = device.ratio_b_;
    apart_step = device.apart_step_;
    contour_level = device.contour_level_;
    striking = device.striking_;
    key_down = device.held_ > 0;
  }
};

lab::Build build{"An oscillator|A second, detuned|A sine an octave under|A filter|The contour on the level|"
                 "The contour on the filter",
                 Built::kSweep, -120.0f, "The voice as built, all six pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// Four samples at the device's inner rate brought down to one, by the kit's
// half-band filter twice over, as the device brings its own sound down.
struct BroughtDown {
  kit::Halfband2x stage[2];

  void start() {
    for (kit::Halfband2x& one : stage) one.init();
  }
  float one(const float* y) { return stage[1].down(stage[0].down(y[0], y[1]), stage[0].down(y[2], y[3])); }
};

BroughtDown osc_down, mix_down;

// ---------------------------------------------------------------------------
// The keys the lab presses.

struct Press {
  int down;
  int up;
  float hz;
};

Press presses[kLineSteps];
int press_count = 0;

int whole_blocks(float seconds) {
  const int samples = static_cast<int>(seconds * lab::kSampleRate);
  return samples - samples % lab::kControlPeriod;
}

void schedule() {
  press_count = 0;
  if (!pattern.on()) {
    presses[press_count++] = {kKeyDown, kKeyDown + whole_blocks(hold.value), note.value};
    return;
  }
  const int length = whole_blocks(kit::min(hold.value, kLineHeld));
  for (int n = 0; n < kLineSteps; ++n) {
    if (kLine[n] == kRest) continue;
    const int at = kKeyDown + n * kLineStep;
    presses[press_count++] = {at, at + length, note.value * kit::semitones_to_ratio(static_cast<float>(kLine[n]))};
  }
}

// ---------------------------------------------------------------------------
// Pictures that are not the loop.

// `length` samples of a sound from `from`, against cycles of the note.
void wave_tap(lab::Tap& tap, const float* x, int from, int length, float cycles) {
  if (!x || !tap.open(length)) return;
  tap.x0 = 0.0f;
  tap.x1 = cycles;
  for (int n = 0; n < length; ++n) tap.set(n, x[from + n]);
}

constexpr int kHarmonics = 32;
constexpr float kHarmonicFloorDb = -120.0f;

// The size of each harmonic of a note at `hz` in `length` samples of a sound
// from `from`, under a Hann window, in dB where a full-scale sine reads 0:
// the sum the Fourier transform is, at each harmonic's own frequency.
void harmonics_tap(lab::Tap& tap, const float* x, int from, int length, double hz, const float* window) {
  int count = kHarmonics;
  while (count > 1 && count * hz > 20000.0) --count;
  if (!x || !window || !tap.open(count)) return;
  tap.x0 = 1.0f;
  tap.x1 = static_cast<float>(count);
  for (int k = 1; k <= count; ++k) {
    const double w = 2.0 * lab::kPi * hz * k / lab::kSampleRate;
    const double cw = std::cos(w), sw = std::sin(w);
    double c = 1.0, s = 0.0;
    double re = 0.0, im = 0.0;
    for (int n = 0; n < length; ++n) {
      const double v = static_cast<double>(x[from + n]) * window[n];
      re += v * c;
      im -= v * s;
      const double next = c * cw - s * sw;
      s = s * cw + c * sw;
      c = next;
    }
    const double size = std::sqrt(re * re + im * im) / (length / 4.0);
    const float db = size > 1.0e-7 ? static_cast<float>(20.0 * std::log10(size)) : lab::kFloorDb;
    tap.set(k - 1, db < kHarmonicFloorDb ? kHarmonicFloorDb : db);
  }
}

// The kit's oscillator in one of its four shapes, by itself and steady: two
// cycles of it at Pitch, and its harmonics over four.
void shape_taps(lab::Tap& wave_of, lab::Tap& parts_of, int which, double hz, int two_cycles, int four_cycles,
                const float* window) {
  float* x = lab::take(four_cycles);
  if (!x) return;
  kit::BlepOsc tone;
  tone.reset(0.0f);
  const float increment = static_cast<float>(hz / lab::kSampleRate);
  for (int n = 0; n < four_cycles; ++n) {
    x[n] = kRawLevel * (which == 0   ? tone.sine(increment)
                        : which == 1 ? tone.triangle(increment)
                        : which == 2 ? tone.pulse(increment, 0.5f)
                                     : tone.saw(increment));
  }
  wave_tap(wave_of, x, 0, two_cycles, static_cast<float>(two_cycles * hz / lab::kSampleRate));
  harmonics_tap(parts_of, x, 0, four_cycles, hz, window);
}

// What the device's filter passes at each frequency: one small sample through
// a second kit::Ladder that holds the device's own coefficient and feedback,
// at the device's inner rate, and the level of what rings out. The sample is
// small enough for the filter's saturation to leave it alone.
constexpr int kRing = 16384;
constexpr int kResponsePoints = 121;
constexpr float kSmall = 1.0e-4f;
float ring[kRing];
float response_kept[kResponsePoints];
float response_g = -1.0f, response_feedback = -1.0f;

void measure_response(float g, float feedback) {
  if (!response.open(kResponsePoints)) return;
  response.x0 = 20.0f;
  response.x1 = 20000.0f;
  response.scale = lab::kLog;
  if (g != response_g || feedback != response_feedback) {
    kit::Ladder probe;
    probe.g = g;
    probe.resonance = feedback;
    for (int n = 0; n < kRing; ++n) ring[n] = probe.process(n == 0 ? kSmall : 0.0f);
    for (int p = 0; p < kResponsePoints; ++p) {
      const double hz = 20.0 * std::pow(1000.0, static_cast<double>(p) / (kResponsePoints - 1));
      // A frequency at the inner rate is a quarter of it at the page's, which is what fourier_at counts in.
      const double power = lab::fourier_at(ring, kRing, hz * lab::kSampleRate / kInnerRate).power();
      response_kept[p] = lab::power_to_db(static_cast<float>(power / (static_cast<double>(kSmall) * kSmall)));
    }
    response_g = g;
    response_feedback = feedback;
  }
  for (int p = 0; p < kResponsePoints; ++p) response.set(p, response_kept[p]);
}

void configure() {
  {
    using namespace ladder_bass;
    bass.init(lab::kSampleRate);
    bass.set_param(kWave, wave.value);
    bass.set_param(kBeat, beat.value);
    bass.set_param(kSub, sub.value);
    bass.set_param(kCutoff, cutoff.value);
    bass.set_param(kEmphasis, emphasis.value);
    bass.set_param(kContour, contour.value);
    bass.set_param(kDecay, decay.value);
    bass.set_param(kDrive, drive.value);
    bass.set_param(kVolume, volume.value);
  }
  {
    using namespace dusk;
    pad.init(lab::kSampleRate);
    pad.set_param(kCutoff, pad_cutoff.value);
    pad.set_param(kEnvelope, pad_envelope.value);
    pad.set_param(kAttack, pad_attack.value);
    pad.set_param(kRelease, pad_release.value);
    pad.set_param(kChorus, pad_chorus.value);
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure();
  schedule();
  shown.start(build.at());
  held.start(build.compared_step);
  const bool both = build.at() != build.compared_step;
  osc_down.start();
  mix_down.start();

  constexpr int kBlock = lab::kControlPeriod;
  const int total = lab::total();
  // The pad's keys go down with the bass's first key and come up after "Key held for".
  const int pad_up = kKeyDown + whole_blocks(hold.value);
  Dusk::Voice* pad_voice = nullptr;
  int most_held = 0;

  // The moment looked at, in the pass that is kept: the pictures begin where
  // the first oscillator next starts a cycle.
  const double hz = note.value;
  const int two_cycles = static_cast<int>(2.0 * lab::kSampleRate / hz + 0.5);
  const int four_cycles = static_cast<int>(4.0 * lab::kSampleRate / hz + 0.5);
  int look_at = kKeyDown + static_cast<int>(look.value * lab::kSampleRate);
  if (look_at > frames - four_cycles - two_cycles) look_at = frames - four_cycles - two_cycles;
  if (look_at < 0) look_at = 0;
  int cycle_at = -1;
  float look_g = 0.0f, look_feedback = 0.0f;

  kit::BlepOsc tone;
  int next_press = 0;
  bool pressed = false;
  double apart = 0.0, whole = 0.0;
  float worst = 0.0f;

  for (int i = 0; i < total; i += kBlock) {
    const int at = i % frames;
    if (at == 0) {
      next_press = 0;
      pressed = false;
    }
    if (i == frames) {
      shown.adopt(bass);
      held.adopt(bass);
    }

    // The keys: all of them go down and come up on a whole block.
    if (!pressed && next_press < press_count && at == presses[next_press].down) {
      bass.note_on(kKey, presses[next_press].hz, kStrike);
      if (i >= frames) {
        shown.key_on(presses[next_press].hz);
        held.key_on(presses[next_press].hz);
      }
      tone.reset(0.0f);
      pressed = true;
    } else if (pressed && at == presses[next_press].up) {
      bass.note_off(kKey);
      if (i >= frames) {
        shown.key_off();
        held.key_off();
      }
      pressed = false;
      ++next_press;
    }
    if (at == kKeyDown) {
      for (int k = 0; k < kPadKeys; ++k) {
        pad.note_on(kPadKey + k, note.value * kit::semitones_to_ratio(static_cast<float>(kPadSemitones[k])),
                    kPadStrike);
      }
      const int first = pad.pool_.find_held(kPadKey);
      if (first >= 0) pad_voice = &pad.pool_.voices[first];
    }
    if (at == pad_up) {
      for (int k = 0; k < kPadKeys; ++k) pad.note_off(kPadKey + k);
    }

    pad.process(kBlock);
    if (i < frames) {
      // The first pass is only there so that the second starts as the tenth
      // would: nothing of it is kept, and the devices run it a block at a time.
      bass.process(kBlock);
      continue;
    }

    int holding = 0;
    for (int v = 0; v < Dusk::kMaxVoices; ++v) {
      const Dusk::Voice& voice = pad.pool_.voices[v];
      holding += voice.env.active() && !voice.env.releasing() ? 1 : 0;
    }
    if (holding > most_held) most_held = holding;
    pad_env.put(i, pad_voice ? pad_voice->env.level() : 0.0f);
    pad_corner.put(i, pad_voice ? pad.cutoff_hz(*pad_voice, pad_voice->env.level())
                                : std::exp2(pad.cutoff_octave_.value));

    for (int j = 0; j < kBlock; ++j) {
      const int n = i + j;
      const bool kept = n < 2 * frames;
      pad_tap.put(n, pad.out_left()[j], pad.out_right()[j]);

      // The kit's oscillator by itself: on with the key, off with it.
      float raw = 0.0f;
      if (pressed) {
        const float increment = presses[next_press].hz / lab::kSampleRate;
        const int which = shape.choice();
        raw = kRawLevel * (which == 0   ? tone.sine(increment)
                           : which == 1 ? tone.triangle(increment)
                           : which == 2 ? tone.pulse(increment, 0.5f)
                                        : tone.saw(increment));
      }
      raw_tap.put(n, raw);

      // The device: it renders this sample when something sounds or it has not yet fallen asleep.
      const bool awake = bass.contour_level_ > 0.0f || bass.striking_ || !bass.idle_.asleep();
      bass.process(1);
      const float device_out = bass.out_left()[0];

      // The voice with every piece, and the voice at the step chosen.
      const double phase_before = held.osc_a.phase;
      const float held_out = held.run();
      const float shown_out = both ? shown.run() : held_out;
      const Built& chosen = both ? shown : held;
      if (kept && cycle_at < 0 && n - frames >= look_at && held.awake && held.osc_a.phase < phase_before) {
        cycle_at = n - frames;
      }
      const double difference = static_cast<double>(held_out) - device_out;
      apart += difference * difference;
      whole += static_cast<double>(device_out) * device_out;

      osc_tap.put(n, held.awake ? osc_down.one(held.alone) : 0.0f);
      mix_tap.put(n, held.awake ? mix_down.one(held.sum) : 0.0f);
      filtered_tap.put(n, awake ? bass.dc_.x1 : 0.0f);

      // The cutoff as the device works it out, from the numbers it keeps.
      const float tracking = std::sqrt(bass.frequency_ * (1.0f / LadderBass::kPivotHz));
      const float device_corner = bass.cutoff_.value * tracking *
                                  std::exp2(bass.contour_.value * LadderBass::kContourOctaves * bass.contour_level_);
      if (awake) {
        const float g = kit::tan_prewarp(
            kit::kPi * kit::clamp(kit::min(device_corner, LadderBass::kMaxCutoffHz), 10.0f, kInnerRate * 0.45f) /
            kInnerRate);
        const float error = 100.0f * (g > bass.ladder_.g ? g - bass.ladder_.g : bass.ladder_.g - g) / bass.ladder_.g;
        if (error > worst) worst = error;
      }
      if (kept && n - frames == look_at) {
        look_g = bass.ladder_.g;
        look_feedback = bass.ladder_.resonance;
        cutoff_now.value = kit::min(device_corner, LadderBass::kMaxCutoffHz);
        contour_now.value = bass.contour_level_;
      }
      if (j == 0) {
        contour_tap.put(n, bass.contour_level_);
        corner_tap.put(n, kit::min(device_corner, LadderBass::kMaxCutoffHz));
        built_level.put(n, chosen.level);
        built_corner.put(n, chosen.pieces >= Built::kFilter ? kit::min(chosen.corner, LadderBass::kMaxCutoffHz)
                                                             : 0.0f);
      }
      out_tap.put(n, device_out, bass.out_right()[0]);
      built.put(n, shown_out);
    }
  }
  cutoff_error.value = worst;
  pad_held.value = static_cast<float>(most_held);
  build.difference.value = lab::ratio_db(apart, whole);
  measure_response(look_g, look_feedback);
  lab::spectrogram_tap(raw_picture, raw_tap.channel(0), frames);
  lab::spectrogram_tap(out_picture, out_tap.channel(0), frames);

  // The pictures at the moment looked at. With no cycle starting after it
  // (the device asleep), they begin at the moment itself.
  int from = cycle_at >= 0 ? cycle_at : look_at;
  if (from > frames - four_cycles) from = frames - four_cycles;
  if (from < 0 || four_cycles > frames) return;
  const float cycles = static_cast<float>(two_cycles * hz / lab::kSampleRate);
  wave_tap(osc_wave, osc_tap.channel(0), from, two_cycles, cycles);
  wave_tap(mix_wave, mix_tap.channel(0), from, two_cycles, cycles);
  wave_tap(filtered_wave, filtered_tap.channel(0), from, two_cycles, cycles);
  wave_tap(out_wave, out_tap.channel(0), from, two_cycles, cycles);
  wave_tap(built_wave, built.channel(0), from, two_cycles, cycles);
  float* window = lab::take(four_cycles);
  if (window) {
    for (int n = 0; n < four_cycles; ++n) {
      window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / four_cycles));
    }
  }
  harmonics_tap(osc_parts, osc_tap.channel(0), from, four_cycles, hz, window);
  harmonics_tap(mix_parts, mix_tap.channel(0), from, four_cycles, hz, window);
  harmonics_tap(filtered_parts, filtered_tap.channel(0), from, four_cycles, hz, window);
  harmonics_tap(out_parts, out_tap.channel(0), from, four_cycles, hz, window);
  harmonics_tap(built_parts, built.channel(0), from, four_cycles, hz, window);
  shape_taps(sine_wave, sine_parts, 0, hz, two_cycles, four_cycles, window);
  shape_taps(triangle_wave, triangle_parts, 1, hz, two_cycles, four_cycles, window);
  shape_taps(square_wave, square_parts, 2, hz, two_cycles, four_cycles, window);
  shape_taps(saw_wave, saw_parts, 3, hz, two_cycles, four_cycles, window);
}
