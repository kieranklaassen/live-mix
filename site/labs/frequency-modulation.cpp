// Frequency modulation: Glass (cpp/devices/fm-glass), struck once
// a loop and run one sample at a time, so each operator of the sounding voice
// can be read out of the device as it works.
//
//   modulator ──► × its envelope × index ──► added to the carrier's phase
//                                                      │
//                         carrier's phase ──► sine ──► × its envelope ──► pan ──► gain ──► DC block ──► soft clip
//
// The device is set to its Bell algorithm: two such pairs, the second voiced a
// little duller. The lab starts where the technique shows plainly: Detune at
// 0 and Spread at 1 (the device starts at 5 cents and 0.6), so the left
// channel is the first pair alone at the note's own pitch; Feedback at 0 (0.1);
// a short Decay (0.4 s against 2.5 s). Volume is 0 dB (the device starts at
// -9) and Velocity 0, so every key comes out at full level and full index.
// The lab's Index is not a parameter of the device, whose own is Brightness:
// the lab sets the Brightness that gives the index asked for.
//
// Read from the device: all four envelopes, every phase, each modulator's
// output, the index and its cap, both channels. The sine a carrier reads and
// its product with the envelope are locals of the device's render and are not
// kept, so the lab works them out again with the device's own expression,
// pans, scales and guards them as the device does, and reports how far that
// lands from the device's two channels (the "rebuilt" check).
//
// Every sound is written at the level one voice has at the device's output
// (kVoiceGain times the Volume), so that a stage is as loud as the note.
//
// Beside the note the lab holds one pair steady: the same two table sines,
// through the device's own operator functions, at the index the device grants
// the note at its strike, with no envelope. That is the tone the spectra and
// the close-up pictures are of. "uncapped" is the same pair at the index the
// control asks for, without the device's key scaling and band limit. "added"
// is what the lesson starts from: the same two sines, summed.
//
// The build path puts the instrument together in nine pieces, each a few
// lines of `Built` below: a carrier; a modulator into its phase; the index;
// the ratio; an envelope on the index; an envelope on the level; feedback; a
// second pair; a guard on the way out. The step chosen changes only the
// "built" taps. Each piece takes its numbers from the device's own voice as
// the key goes down (the steps of the phases, the index granted, the share
// of feedback, the envelopes as set), so what the build writes out again is
// the arithmetic, not the design. Two copies run: one at the step chosen, and
// one with every piece, whose two channels are compared on every render with
// the device's own (the "builtDifference" check).

#include "lab.h"

#include "../../cpp/devices/fm-glass/fm_glass.h"

using namespace livemix;

namespace {

FmGlass glass;

lab::Control pitch{"pitch", "Pitch", "Hz", 55.0f, 1760.0f, 220.0f, lab::kLog};
// The device's own list, FmGlass::kRatios, in its order.
lab::Control ratio{"ratio", "Ratio", "", 0.0f, 11.0f, 6.0f, lab::kLinear, "0.5|1|1.41|2|2.76|3|3.5|4|5|7|9|14"};
lab::Control index{"index", "Index", "rad", 0.0f, 8.0f, 2.0f};
lab::Control decay{"decay", "Decay", "s", 0.05f, 20.0f, 0.4f, lab::kLog};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 1.0f, 0.0f};
lab::Control attack{"attack", "Attack", "s", 0.001f, 8.0f, 0.003f, lab::kLog};
lab::Control sustain{"sustain", "Sustain", "", 0.0f, 1.0f, 0.0f};
lab::Control detune{"detune", "Detune", "cents", 0.0f, 30.0f, 0.0f};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 1.0f};

// What the lesson starts from: two sines, held, and summed.
lab::Tap added{"added", "The two sines, added", lab::kAudio, lab::kLesson, 1};

// The pair held steady. The carrier is the kit's table sine; the modulator is
// the device's own operator function (FmGlass::self_modulated), called here
// outside a running device, and the held tone and the offset are made of it.
lab::Tap steady_modulator{"steadyModulator", "Modulator, held", lab::kAudio, lab::kCalled, 1};
lab::Tap steady_carrier{"steadyCarrier", "Carrier, held, index 0", lab::kAudio, lab::kKit, 1};
lab::Tap uncapped{"uncapped", "Held tone at the index asked for", lab::kAudio, lab::kLesson, 1};
lab::Tap steady{"steady", "Held tone", lab::kAudio, lab::kCalled, 1};
lab::Tap offset{"offset", "Phase offset", lab::kCurve, lab::kCalled, 1, "rad"};

// The levels of the carrier's line and of the first three side bands against
// the index, measured from a pair of the kit's table sines, and the whole
// spectrum of that pair against the index.
lab::Tap line0{"line0", "Carrier's line", lab::kCurve, lab::kKit, 1};
lab::Tap line1{"line1", "First side band", lab::kCurve, lab::kKit, 1};
lab::Tap line2{"line2", "Second side band", lab::kCurve, lab::kKit, 1};
lab::Tap line3{"line3", "Third side band", lab::kCurve, lab::kKit, 1};
lab::Tap growth{"growth", "A held pair's spectrum as the index rises", lab::kFrames, lab::kKit, 1, "dB"};

// The note, in the signal's order.
lab::Tap modulator{"modulator", "Modulator, after its envelope", lab::kAudio, lab::kLesson, 1};
lab::Tap mod_env{"modEnv", "Modulator's envelope", lab::kControl, lab::kDevice, 1};
lab::Tap index_now{"indexNow", "Index", lab::kControl, lab::kLesson, 1, "rad"};
lab::Tap amp_env{"ampEnv", "Carrier's envelope", lab::kControl, lab::kDevice, 1};
lab::Tap carrier{"carrier", "Carrier alone", lab::kAudio, lab::kLesson, 1};
lab::Tap modulated{"modulated", "Carrier, phase modulated", lab::kAudio, lab::kLesson, 1};
lab::Tap index_b{"indexB", "Index of the second pair", lab::kControl, lab::kLesson, 1, "rad"};
lab::Tap pair_b{"pairB", "The second pair", lab::kAudio, lab::kLesson, 1};

lab::Tap strike{"strike", "Output, the first 85 ms", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap ringing{"ringing", "Output, half a second in", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap picture{"picture", "Output", lab::kFrames, lab::kDevice, 1, "dB"};
// The last sound declared on the main path is what Play starts on.
lab::Tap out{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check rebuilt{"rebuilt", "The two pairs worked out again, against the device's two channels", "dB"};
lab::Check granted{"granted", "The index the device grants this note at its strike", "rad"};
lab::Check brightness_set{"brightness", "The Brightness that gives the index asked for", ""};
lab::Check as_frequency{"asFrequency", "A sine whose frequency is swung, against the sine whose phase is", "dB"};

lab::Tap built{"built", "The instrument so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_modulator{"builtModulator", "Modulator, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_index{"builtIndex", "Index, as built", lab::kControl, lab::kLesson, 1, "rad"};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kKit, 1};
lab::Tap built_right{"builtRight", "Right channel, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_picture{"builtPicture", "The instrument so far", lab::kFrames, lab::kLesson, 1, "dB"};

// --- the side bands' levels against the index, measured once ---------------

constexpr int kLinePoints = 161;      // 0 to 8 rad in steps of 0.05
constexpr int kLineWindow = 1024;     // 128 cycles of the carrier, 8 of the modulator
constexpr float kLineCarrier = 0.125f;       // cycles a sample: 6,000 Hz
constexpr float kLineModulator = 1.0f / 128.0f;  // 375 Hz
constexpr int kLineRows = kLineWindow / 2 + 1;
float lines_[4][kLinePoints];
float growth_[kLinePoints * kLineRows];

// Each line's level is the mean of the tone times a unit sine at the line's
// own frequency, doubled: the one term of the Fourier sum (the lesson on the
// Fourier transform) that stands at that frequency. Sixteen modulators fit
// between the carrier and zero, so no side band here reaches zero or half the
// sample rate. The same window, through the kit's transform, is one column of
// the picture of the whole spectrum: bin 128 is the carrier and every eighth
// bin either side of it a side band.
void measure_lines() {
  static double reference[4][kLineWindow];
  static kit::Fft<kLineWindow> fft;
  static float re[kLineWindow];
  static float im[kLineWindow];
  fft.init();
  for (int k = 0; k < 4; ++k) {
    for (int n = 0; n < kLineWindow; ++n) {
      reference[k][n] = std::sin(2.0 * lab::kPi * n * (0.125 + k / 128.0));
    }
  }
  const double full = (kLineWindow / 4.0) * (kLineWindow / 4.0);
  for (int p = 0; p < kLinePoints; ++p) {
    const float cycles = (8.0f * p / (kLinePoints - 1)) / kit::kTwoPi;
    double sum[4] = {0.0, 0.0, 0.0, 0.0};
    for (int n = 0; n < kLineWindow; ++n) {
      const float bend = cycles * kit::SineTable::lookup(kLineModulator * static_cast<float>(n));
      const float y = kit::SineTable::lookup(kLineCarrier * static_cast<float>(n) + bend);
      for (int k = 0; k < 4; ++k) sum[k] += y * reference[k][n];
      re[n] = y * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kLineWindow));
      im[n] = 0.0f;
    }
    for (int k = 0; k < 4; ++k) lines_[k][p] = static_cast<float>(2.0 * sum[k] / kLineWindow);
    fft.forward(re, im);
    for (int k = 0; k < kLineRows; ++k) {
      const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
      growth_[p * kLineRows + k] = lab::power_to_db(static_cast<float>(power / full));
    }
  }
}

void put_lines() {
  lab::Tap* taps[4] = {&line0, &line1, &line2, &line3};
  for (int k = 0; k < 4; ++k) {
    if (!taps[k]->open(kLinePoints)) return;
    taps[k]->x0 = 0.0f;
    taps[k]->x1 = 8.0f;
    for (int p = 0; p < kLinePoints; ++p) taps[k]->set(p, lines_[k][p]);
  }
  // The picture's columns are the index, not time: 0 rad at its first, 8 at its last.
  if (!growth.open(kLinePoints * kLineRows)) return;
  growth.columns = kLinePoints;
  growth.x0 = 0.0f;
  growth.x1 = 8.0f;
  for (int i = 0; i < kLinePoints * kLineRows; ++i) growth.data[i] = growth_[i];
}

// --- frequency against phase ------------------------------------------------
//
// The held tone again, in double precision, twice. Once as the device does it:
// the modulator's sine, times the index, added to the carrier's phase. Once as
// the name says: the carrier's frequency swung by index × modulator frequency
// × the modulator's cosine, and the phase the running sum of that frequency.
// The sum is taken at the middle of each sample. How far apart the two land.
float frequency_against_phase(double carrier_step, double modulator_step, double radians) {
  constexpr int kCount = 4800;
  static float by_phase[kCount];
  static float by_frequency[kCount];
  const double turn = 2.0 * lab::kPi;
  double phase = 0.0;  // cycles
  for (int n = 0; n < kCount; ++n) {
    by_phase[n] =
        static_cast<float>(std::sin(turn * carrier_step * n + radians * std::sin(turn * modulator_step * n)));
    by_frequency[n] = static_cast<float>(std::sin(turn * phase));
    // The swing, in cycles a sample: the slope of (radians / 2π) · sin(2π · modulator · n).
    phase += carrier_step + radians * modulator_step * std::cos(turn * modulator_step * (n + 0.5));
  }
  return lab::difference_db(by_frequency, by_phase, kCount);
}

int newest_voice() {
  int choice = 0;
  for (int v = 1; v < FmGlass::kMaxVoices; ++v) {
    if (glass.pool_.stamps_[v] > glass.pool_.stamps_[choice]) choice = v;
  }
  return choice;
}


// ---------------------------------------------------------------------------
// The build part: the instrument put together a piece at a time.

// What the build takes from the device as a key goes down: the note's numbers
// as the device worked them out, and its four envelopes as it set and started
// them. Not its sound.
struct Design {
  float step[4] = {0.0f, 0.0f, 0.0f, 0.0f};  // cycles a sample: carrier, modulator; then the second pair's
  float index[2] = {0.0f, 0.0f};             // cycles: the furthest each modulator pushes its carrier
  float self[2] = {0.0f, 0.0f};              // cycles: how far each modulator pushes itself
  kit::Adsr envelope[4];                     // carrier, modulator; then the second pair's
};

Design design_of(const FmGlass::Voice& voice) {
  Design design;
  for (int op = 0; op < 4; ++op) {
    design.step[op] = voice.increment[op];
    design.envelope[op] = voice.env[op];
  }
  for (int pair = 0; pair < 2; ++pair) {
    design.index[pair] = kit::min(glass.brightness_.target * voice.index[pair], voice.cap[pair]);
    design.self[pair] = glass.feedback_.target * voice.self[pair];
  }
  return design;
}

// One note of the build: four phases, the last two outputs of each
// modulator, and the envelopes as they run.
struct Note {
  float phase[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  float last[2][2] = {{0.0f, 0.0f}, {0.0f, 0.0f}};
  kit::Adsr envelope[4];

  bool sounding() const { return envelope[0].active() || envelope[2].active(); }
};

struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int {
    kCarrier = 0,
    kModulator,
    kIndex,
    kRatio,
    kBrightness,
    kLoudness,
    kFeedback,
    kSecondPair,
    kGuard
  };
  // A key struck again: the note before it fades out in this time (note_on in fm_glass.h).
  static constexpr float kRestrikeSeconds = 0.03f;

  int pieces = 0;
  Design design;
  Note now;     // the note that sounds
  Note before;  // the note before it, while it fades under the new one
  bool struck = false;
  kit::DcBlocker guard[2];
  float gain = 0.0f;              // the level of one voice at the output
  float near = 1.0f, far = 0.0f;  // how much of a pair goes to its own side, and to the other
  float out[2] = {0.0f, 0.0f};
  // What the last call of pair_of worked out, for the lanes.
  float heard = 0.0f;       // the modulator's sine
  float pushing = 0.0f;     // how far it pushes: cycles
  float loudness = 1.0f;    // the carrier's envelope

  // A carrier: a phase that counts in cycles and wraps at 1, and the table's
  // sine of it. `step` is the note's frequency over the sample rate.
  static float turned(float phase, float step) {
    phase += step;
    return phase >= 1.0f ? phase - 1.0f : phase;
  }
  static float sine(float phase) { return kit::SineTable::lookup(phase); }

  // The ratio: the modulator has a step of its own, the note's times the
  // Ratio. Without it the modulator turns in step with its carrier.
  float modulator_step(int pair) const { return design.step[pieces >= kRatio ? 2 * pair + 1 : 2 * pair]; }

  // Feedback: the modulator is pushed in its turn, by the mean of its own
  // last two outputs, `self` cycles deep. Without it it is the table's sine.
  float modulating(Note& note, int pair) const {
    const float phase = note.phase[2 * pair + 1];
    if (pieces < kFeedback) return sine(phase);
    float* last = note.last[pair];
    const float bent = sine(phase + design.self[pair] * 0.5f * (last[0] + last[1]));
    last[1] = last[0];
    last[0] = bent;
    return bent;
  }

  // The index: how far the modulator pushes, in cycles. Without it the bare
  // sine pushes a whole cycle each way. An envelope on the index: the push is
  // deepest as the key goes down and dies away while the note rings.
  float depth(int pair, float brightness) const {
    if (pieces < kIndex) return 1.0f;
    if (pieces < kBrightness) return design.index[pair];
    return design.index[pair] * brightness;
  }

  // One pair of one note, for one sample. A modulator into the phase: its
  // sine, times its depth, is added to the carrier's phase before the table
  // is read. An envelope on the level: what the table gives is multiplied by
  // an envelope of the carrier's own.
  float pair_of(Note& note, int pair) {
    loudness = note.envelope[2 * pair].next();
    const float brightness = note.envelope[2 * pair + 1].next();
    heard = pieces >= kModulator ? modulating(note, pair) : 0.0f;
    pushing = pieces >= kModulator ? depth(pair, brightness) : 0.0f;
    float sample = sine(note.phase[2 * pair] + pushing * heard);
    if (pieces >= kLoudness) sample *= loudness;
    note.phase[2 * pair] = turned(note.phase[2 * pair], design.step[2 * pair]);
    note.phase[2 * pair + 1] = turned(note.phase[2 * pair + 1], modulator_step(pair));
    if (pieces >= kBrightness) heard *= brightness;
    if (pieces < kLoudness) loudness = 1.0f;
    return sample;
  }

  // A second pair: each note is two pairs, and the first leans to the left by
  // Spread and the second to the right by as much. `near` and `far` are the
  // cosine and the sine of the angle between them, so the two keep their power.
  void place(float first, float second, float* left, float* right) const {
    *left = (first * near + second * far) * gain;
    *right = (first * far + second * near) * gain;
  }

  // A guard on the way out: a high-pass at 12 Hz takes out an offset that
  // stands still, and a clip that is a wire below half of full scale rounds
  // off whatever many notes at once pile up.
  float guarded(int side, float sample) { return kit::soft_clip(guard[side].process(sample)); }

  // One sample of everything built so far. `lanes` take the first pair of the
  // note that sounds.
  void run(bool awake) {
    // The device has put out nothing for a quarter of a second and stopped
    // working: its output is exact silence and its guard stands as it stood.
    // The build is told, and does the same.
    if (pieces >= kLoudness && !awake) {
      out[0] = out[1] = modulator_now = index_now = level_now = 0.0f;
      return;
    }
    float first = 0.0f, second = 0.0f;
    modulator_now = index_now = level_now = 0.0f;
    // Until the level has an envelope there is one tone, and it is held.
    if (pieces >= kLoudness && before.sounding()) {
      first += pair_of(before, 0);
      second += pair_of(before, 1);
    }
    if (pieces < kLoudness || now.sounding()) {
      first += pair_of(now, 0);
      modulator_now = heard * gain;
      index_now = pushing;
      level_now = loudness;
      second += pair_of(now, 1);
    }
    if (pieces >= kSecondPair) {
      place(first, second, &out[0], &out[1]);
    } else {
      out[0] = out[1] = first * gain;
    }
    if (pieces >= kGuard) {
      out[0] = guarded(0, out[0]);
      out[1] = guarded(1, out[1]);
    }
  }

  // A key goes down. Until the level has an envelope the tone is held, and a
  // key only starts the index's envelope again. From then on a key starts a
  // new note at phase 0, and the note before it fades out under the new one.
  void strike(const Design& from) {
    design = from;
    if (struck && pieces < kLoudness) {
      now.envelope[1].gate_on();
      now.envelope[3].gate_on();
      return;
    }
    if (struck && now.sounding()) {
      before = now;
      for (kit::Adsr& envelope : before.envelope) envelope.fast_release(kRestrikeSeconds);
    }
    now = Note();
    for (int op = 0; op < 4; ++op) now.envelope[op] = design.envelope[op];
    struck = true;
  }

  void start(int pieces_, float gain_, float spread_value) {
    pieces = pieces_;
    struck = false;
    now = Note();
    before = Note();
    for (kit::DcBlocker& blocker : guard) {
      blocker.reset();
      blocker.set_cutoff(12.0f, lab::kSampleRate);
    }
    gain = gain_;
    const float angle = (1.0f - spread_value) * 0.125f;
    near = kit::SineTable::cos_lookup(angle);
    far = kit::SineTable::lookup(angle);
    out[0] = out[1] = 0.0f;
  }

  float modulator_now = 0.0f;  // the modulator of the note that sounds, as it would be heard
  float index_now = 0.0f;      // how far it pushes: cycles
  float level_now = 0.0f;      // the carrier's envelope
};

lab::Build build{
    "A carrier|A modulator into its phase|The index|The ratio|An envelope on the index|An envelope on the "
    "level|Feedback|A second pair|A guard on the way out",
    Built::kGuard, -120.0f, "The instrument as built, all nine pieces, against the device's two channels"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

}  // namespace

void lab_setup() {
  kit::SineTable::init();
  measure_lines();
}

void lab_render(int frames) {
  using namespace fm_glass;
  const float hz = pitch.value;
  const int ratio_place = kit::clamp_int(ratio.choice(), 0, FmGlass::kNumRatios - 1);

  // The device's control is Brightness: the index at the strike is
  // kMaxIndex · Brightness^1.5 · key_index_scale(pitch). The lab's control is
  // the index, so it sets the Brightness that gives it, or 1 when none does.
  const float most = FmGlass::kMaxIndex * FmGlass::key_index_scale(hz);
  const float share = index.value / most;
  const float brightness = share >= 1.0f ? 1.0f : std::pow(share, 2.0f / 3.0f);
  brightness_set.value = brightness;

  glass.init(lab::kSampleRate);
  glass.set_param(kAlgorithm, static_cast<float>(FmGlass::kBell));
  glass.set_param(kRatio, static_cast<float>(ratio_place));
  glass.set_param(kBrightness, brightness);
  glass.set_param(kDecay, decay.value);
  glass.set_param(kAttack, attack.value);
  glass.set_param(kSustain, sustain.value);
  glass.set_param(kDetune, detune.value);
  glass.set_param(kFeedback, feedback.value);
  glass.set_param(kVelocity, 0.0f);  // every strike at full level and full index
  glass.set_param(kSpread, spread.value);
  glass.set_param(kVolume, 0.0f);
  // The level of one voice at the output: every sound tap is written at it.
  const float level = glass.volume_.target * FmGlass::kVoiceGain;

  kit::DcBlocker blocker[2];
  for (kit::DcBlocker& one : blocker) one.set_cutoff(12.0f, lab::kSampleRate);
  float* device_left = lab::take(frames);
  float* built_left = lab::take(frames);
  double rebuilt_apart = 0.0, built_apart = 0.0, whole = 0.0;

  shown.start(build.at(), level, spread.value);
  held.start(build.compared_step, level, spread.value);

  // The held pair: phases of its own, the device's increments and index.
  float held_phase[2] = {0.0f, 0.0f};
  float held_z[2] = {0.0f, 0.0f};
  float free_phase[2] = {0.0f, 0.0f};
  float free_z[2] = {0.0f, 0.0f};
  float held_step[2] = {0.0f, 0.0f};
  float free_step[2] = {0.0f, 0.0f};
  float held_index = 0.0f;  // cycles
  float held_self = 0.0f;   // cycles
  const float free_index = index.value / kit::kTwoPi;
  const float free_self = feedback.value * FmGlass::kMaxFeedback / kit::kTwoPi;

  const int close_from = frames >= 30000 ? 24000 : 0;  // the close-up: 12 ms from half a second in
  constexpr int kClose = 576;
  if (offset.open(kClose + 1)) {
    offset.x0 = 1000.0f * static_cast<float>(close_from) / lab::kSampleRate;
    offset.x1 = offset.x0 + 12.0f;
  }

  // The first pass of a loop is not kept (lab.h), but the device and the
  // build both run it a sample at a time, so that each meets the second pass
  // with what the first left sounding.
  int newest = 0;
  bool before_active[FmGlass::kMaxVoices];
  float before_phase[FmGlass::kMaxVoices][2];
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    if (i % frames == 0) {
      glass.note_on(1, hz, 1.0f);
      newest = newest_voice();
      const FmGlass::Voice& voice = glass.pool_.voices[newest];
      const Design design = design_of(voice);
      shown.strike(design);
      held.strike(design);
      if (i == 0) {
        held_step[0] = voice.increment[0];
        held_step[1] = voice.increment[1];
        held_index = design.index[0];
        held_self = design.self[0];
        granted.value = held_index * kit::kTwoPi;
        // The pair with nothing held back: the note's own two frequencies, whatever the limit.
        const float flat = hz * glass.detune_flat_;
        free_step[0] = flat / lab::kSampleRate;
        free_step[1] = flat * FmGlass::kRatios[ratio_place] / lab::kSampleRate;
      }
    }
    // Whether the device works on this sample: a voice sounds, or its output
    // has not yet been silent for a quarter of a second (kit::IdleGate).
    const bool awake = glass.pool_.count_active() > 0 || !glass.idle_.asleep();
    // The device reads each phase before it steps it, and each envelope after.
    for (int v = 0; v < FmGlass::kMaxVoices; ++v) {
      const FmGlass::Voice& voice = glass.pool_.voices[v];
      before_active[v] = voice.active();
      before_phase[v][0] = voice.phase[0];
      before_phase[v][1] = voice.phase[2];
    }
    glass.process(1);

    float sum_modulator = 0.0f, sum_carrier = 0.0f, group_a = 0.0f, group_b = 0.0f;
    for (int v = 0; awake && v < FmGlass::kMaxVoices; ++v) {
      if (!before_active[v]) continue;
      const FmGlass::Voice& voice = glass.pool_.voices[v];
      const float e0 = voice.env[0].level_;
      const float e1 = voice.env[1].level_;
      const float e2 = voice.env[2].level_;
      const float e3 = voice.env[3].level_;
      const float index_a = kit::min(glass.brightness_.value * voice.index[0], voice.cap[0]);
      const float index_b = kit::min(glass.brightness_.value * voice.index[1], voice.cap[1]);
      // fm_glass.h, the default case of render(): the carriers of the two pairs.
      const float a = kit::SineTable::lookup(before_phase[v][0] + index_a * e1 * voice.z[0][0]) * e0;
      const float b = kit::SineTable::lookup(before_phase[v][1] + index_b * e3 * voice.z[1][0]) * e2;
      group_a += a * voice.gain;
      group_b += b * voice.gain * FmGlass::kShapes[FmGlass::kBell].level_b;
      sum_modulator += voice.z[0][0] * e1;
      sum_carrier += kit::SineTable::lookup(before_phase[v][0]) * e0;
    }
    // The device's way out: each pair to its side, the gain, the DC blocker, the soft clip.
    const float angle = (1.0f - glass.spread_.value) * 0.125f;
    const float own = kit::SineTable::cos_lookup(angle);
    const float other = kit::SineTable::lookup(angle);
    const float volume = glass.volume_.value * FmGlass::kVoiceGain;
    float again[2] = {0.0f, 0.0f};
    if (awake) {
      again[0] = kit::soft_clip(blocker[0].process((group_a * own + group_b * other) * volume));
      again[1] = kit::soft_clip(blocker[1].process((group_a * other + group_b * own) * volume));
    }
    const float left = glass.out_left()[0];
    const float right = glass.out_right()[0];

    // The build part, beside the device.
    shown.run(awake);
    held.run(awake);

    if (i >= frames && i < 2 * frames) {
      device_left[i - frames] = left;
      built_left[i - frames] = shown.out[0];
      const double apart[4] = {static_cast<double>(again[0]) - left, static_cast<double>(again[1]) - right,
                               static_cast<double>(held.out[0]) - left, static_cast<double>(held.out[1]) - right};
      rebuilt_apart += apart[0] * apart[0] + apart[1] * apart[1];
      built_apart += apart[2] * apart[2] + apart[3] * apart[3];
      whole += static_cast<double>(left) * left + static_cast<double>(right) * right;
    }

    const FmGlass::Voice& voice = glass.pool_.voices[newest];
    const float cycles_a = kit::min(glass.brightness_.value * voice.index[0], voice.cap[0]);
    const float cycles_b = kit::min(glass.brightness_.value * voice.index[1], voice.cap[1]);
    modulator.put(i, sum_modulator * volume);
    mod_env.put(i, voice.env[1].level_);
    index_now.put(i, kit::kTwoPi * cycles_a * voice.env[1].level_);
    amp_env.put(i, voice.env[0].level_);
    carrier.put(i, sum_carrier * volume);
    modulated.put(i, group_a * volume);
    index_b.put(i, kit::kTwoPi * cycles_b * voice.env[3].level_);
    pair_b.put(i, group_b * volume);
    out.put(i, left, right);

    built.put(i, shown.out[0], shown.out[1]);
    built_modulator.put(i, shown.modulator_now);
    built_index.put(i, kit::kTwoPi * shown.index_now);
    built_level.put(i, shown.level_now);
    built_right.put(i, shown.out[1]);

    // The held pair, through the device's own operator functions.
    const float held_mod = FmGlass::self_modulated(held_phase[1], held_self, held_z);
    const float held_sine = kit::SineTable::lookup(held_phase[0]);
    steady_modulator.put(i, level * held_mod);
    steady_carrier.put(i, level * held_sine);
    steady.put(i, level * kit::SineTable::lookup(held_phase[0] + held_index * held_mod));
    added.put(i, level * 0.5f * (held_sine + held_mod));
    const int close = i - frames - close_from;
    if (close >= 0 && close <= kClose) offset.set(close, kit::kTwoPi * held_index * held_mod);
    const float free_mod = FmGlass::self_modulated(free_phase[1], free_self, free_z);
    uncapped.put(i, level * kit::SineTable::lookup(free_phase[0] + free_index * free_mod));
    for (int op = 0; op < 2; ++op) {
      held_phase[op] = FmGlass::advance(held_phase[op], held_step[op]);
      free_phase[op] = FmGlass::advance(free_phase[op], free_step[op]);
    }
  }

  rebuilt.value = lab::ratio_db(rebuilt_apart, whole);
  build.difference.value = lab::ratio_db(built_apart, whole);
  as_frequency.value = frequency_against_phase(held_step[0], held_step[1], granted.value);
  // Not as loops: a frame at the end would read on into the next strike.
  lab::spectrum_tap(strike, device_left, frames < lab::kSpectrumSize ? frames : lab::kSpectrumSize);
  if (frames >= 24000 + 2 * lab::kSpectrumSize) {
    lab::spectrum_tap(ringing, device_left + 24000, 2 * lab::kSpectrumSize);
  } else {
    lab::spectrum_tap(ringing, device_left, frames);
  }
  lab::spectrogram_tap(picture, device_left, frames, 200, false);
  lab::spectrogram_tap(built_picture, built_left, frames, 200, false);
  put_lines();
}
