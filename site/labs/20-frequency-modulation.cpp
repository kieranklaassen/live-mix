// Lesson 20, frequency modulation: Glass (cpp/devices/fm-glass), struck once
// a loop and run one sample at a time, so each operator of the sounding voice
// can be read out of the device as it works.
//
//   modulator ──► × its envelope × index ──► added to the carrier's phase
//                                                      │
//                         carrier's phase ──► sine ──► × its envelope ──► gain ──► DC block ──► soft clip
//
// The device is set to its Bell algorithm (two such pairs, A and B) with
// Detune 0, Velocity 0 and Spread 1, so the left channel is pair A alone and
// the right is pair B alone. Read from the device: both envelopes, every
// phase, the modulator's output, the index and its cap, both channels. The
// sine the carrier reads and its product with the envelope are locals of the
// device's render and are not kept, so the lab works them out again with the
// device's own expression and reports how far that lands from the left
// channel (the "rebuilt" check).
//
// Beside the note the lab holds one pair steady: the same two table sines,
// through the device's own operator functions, at the index the device grants
// the note at its strike, with no envelope. That is the tone the spectra and
// the close-up pictures are of. "uncapped" is the same pair at the index the
// slider asks for, without the device's key scaling and band limit.

#include "lab.h"

#include "../../cpp/devices/fm-glass/fm_glass.h"

using namespace livemix;

namespace {

FmGlass glass;

lab::Control pitch{"pitch", "Pitch", "Hz", 55.0f, 1760.0f, 220.0f, lab::kLog};
// Eight of the device's twelve ratios, by their place in FmGlass::kRatios: a
// row of twelve does not fit a phone's width.
constexpr int kOffered[8] = {0, 1, 2, 3, 4, 5, 6, 11};
lab::Control ratio{"ratio", "Ratio", "", 0.0f, 7.0f, 6.0f, lab::kLinear, "0.5|1|1.41|2|2.76|3|3.5|14"};
lab::Control index{"index", "Index", "rad", 0.0f, 8.0f, 2.0f};
lab::Control decay{"decay", "Decay", "s", 0.05f, 20.0f, 0.4f, lab::kLog};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 1.0f, 0.0f};

// The note, in the signal's order.
lab::Tap modulator{"modulator", "Modulator, after its envelope", lab::kAudio, lab::kLesson, 1};
lab::Tap mod_env{"modEnv", "Modulator's envelope", lab::kControl, lab::kDevice, 1};
lab::Tap index_now{"indexNow", "Index", lab::kControl, lab::kLesson, 1, "rad"};
lab::Tap amp_env{"ampEnv", "Carrier's envelope", lab::kControl, lab::kDevice, 1};
lab::Tap carrier{"carrier", "Carrier alone", lab::kAudio, lab::kLesson, 1};
lab::Tap modulated{"modulated", "Carrier, phase modulated", lab::kAudio, lab::kLesson, 1};
lab::Tap index_b{"indexB", "Index of the second pair", lab::kControl, lab::kLesson, 1, "rad"};
lab::Tap out_b{"outB", "Output of the second pair", lab::kAudio, lab::kDevice, 1};

// The pair held steady.
lab::Tap steady_modulator{"steadyModulator", "Modulator, held", lab::kAudio, lab::kKit, 1};
lab::Tap steady_carrier{"steadyCarrier", "Carrier, held, index 0", lab::kAudio, lab::kKit, 1};
lab::Tap uncapped{"uncapped", "Held tone at the index asked for", lab::kAudio, lab::kLesson, 1};
lab::Tap steady{"steady", "Held tone", lab::kAudio, lab::kKit, 1};
lab::Tap offset{"offset", "Phase offset", lab::kCurve, lab::kKit, 1, "rad"};

// The levels of the carrier's line and of the first three side bands against
// the index, measured from a pair of the kit's table sines.
lab::Tap line0{"line0", "Carrier's line", lab::kCurve, lab::kKit, 1};
lab::Tap line1{"line1", "First side band", lab::kCurve, lab::kKit, 1};
lab::Tap line2{"line2", "Second side band", lab::kCurve, lab::kKit, 1};
lab::Tap line3{"line3", "Third side band", lab::kCurve, lab::kKit, 1};

lab::Tap picture{"picture", "Output", lab::kFrames, lab::kDevice, 1, "dB"};
// The last sound declared is what Play starts on.
lab::Tap out{"out", "Output", lab::kAudio, lab::kDevice, 1};

lab::Check rebuilt{"rebuilt", "The pair worked out again, against the device's left channel", "dB"};
lab::Check granted{"granted", "The index the device grants this note at its strike", "rad"};
lab::Check as_frequency{"asFrequency", "A sine whose frequency is swung, against the sine whose phase is", "dB"};

// --- the side bands' levels against the index, measured once ---------------

constexpr int kLinePoints = 161;      // 0 to 8 rad in steps of 0.05
constexpr int kLineWindow = 1024;     // 128 cycles of the carrier, 8 of the modulator
constexpr float kLineCarrier = 0.125f;       // cycles a sample: 6,000 Hz
constexpr float kLineModulator = 1.0f / 128.0f;  // 375 Hz
float lines_[4][kLinePoints];

// Each line's level is the mean of the tone times a unit sine at the line's
// own frequency, doubled: the one term of the Fourier sum (lesson 2) that
// stands at that frequency. Sixteen modulators fit between the carrier and
// zero, so no side band here reaches zero or half the sample rate.
void measure_lines() {
  static double reference[4][kLineWindow];
  for (int k = 0; k < 4; ++k) {
    for (int n = 0; n < kLineWindow; ++n) {
      reference[k][n] = std::sin(2.0 * 3.14159265358979323846 * n * (0.125 + k / 128.0));
    }
  }
  for (int p = 0; p < kLinePoints; ++p) {
    const float cycles = (8.0f * p / (kLinePoints - 1)) / kit::kTwoPi;
    double sum[4] = {0.0, 0.0, 0.0, 0.0};
    for (int n = 0; n < kLineWindow; ++n) {
      const float bend = cycles * kit::SineTable::lookup(kLineModulator * static_cast<float>(n));
      const float y = kit::SineTable::lookup(kLineCarrier * static_cast<float>(n) + bend);
      for (int k = 0; k < 4; ++k) sum[k] += y * reference[k][n];
    }
    for (int k = 0; k < 4; ++k) lines_[k][p] = static_cast<float>(2.0 * sum[k] / kLineWindow);
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
}

// --- frequency against phase ------------------------------------------------
//
// The held tone again, in double precision, twice. Once as the device does it:
// the modulator's sine, times the index, added to the carrier's phase. Once as
// the name says: the carrier's frequency swung by index × modulator frequency
// × the modulator's cosine, and the phase the running sum of that frequency.
// The sum is taken at the middle of each sample. How far apart the two land.
float frequency_against_phase(double carrier, double modulator, double radians) {
  constexpr int kCount = 4800;
  static float by_phase[kCount];
  static float by_frequency[kCount];
  const double turn = 2.0 * 3.14159265358979323846;
  double phase = 0.0;  // cycles
  for (int n = 0; n < kCount; ++n) {
    by_phase[n] = static_cast<float>(std::sin(turn * carrier * n + radians * std::sin(turn * modulator * n)));
    by_frequency[n] = static_cast<float>(std::sin(turn * phase));
    // The swing, in cycles a sample: the slope of (radians / 2π) · sin(2π · modulator · n).
    phase += carrier + radians * modulator * std::cos(turn * modulator * (n + 0.5));
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

}  // namespace

void lab_setup() {
  kit::SineTable::init();
  measure_lines();
}

void lab_render(int frames) {
  using namespace fm_glass;
  const float hz = pitch.value;
  const int ratio_place = kOffered[kit::clamp_int(ratio.choice(), 0, 7)];

  // The device's knob is Brightness: the index at the strike is
  // kMaxIndex · Brightness^1.5 · key_index_scale(pitch). The lab's slider is
  // the index, so it sets the Brightness that gives it, or 1 when none does.
  const float most = FmGlass::kMaxIndex * FmGlass::key_index_scale(hz);
  const float share = index.value / most;
  const float brightness = share >= 1.0f ? 1.0f : std::pow(share, 2.0f / 3.0f);

  glass.init(lab::kSampleRate);
  glass.set_param(kAlgorithm, static_cast<float>(FmGlass::kBell));
  glass.set_param(kRatio, static_cast<float>(ratio_place));
  glass.set_param(kBrightness, brightness);
  glass.set_param(kDecay, decay.value);
  glass.set_param(kSustain, 0.0f);
  glass.set_param(kDetune, 0.0f);    // both pairs at the note's own pitch
  glass.set_param(kFeedback, feedback.value);
  glass.set_param(kVelocity, 0.0f);  // every strike at full level and full index
  glass.set_param(kSpread, 1.0f);    // pair A to the left, pair B to the right
  glass.set_param(kVolume, 0.0f);

  kit::DcBlocker blocker;
  blocker.set_cutoff(12.0f, lab::kSampleRate);
  float* device_left = lab::take(frames);
  float* rebuilt_left = lab::take(frames);

  // The held pair: phases of its own, the device's increments and index.
  float held_phase[2] = {0.0f, 0.0f};
  float held_z[2] = {0.0f, 0.0f};
  float free_phase[2] = {0.0f, 0.0f};
  float free_z[2] = {0.0f, 0.0f};
  float held_step[2] = {0.0f, 0.0f};
  float held_index = 0.0f;  // cycles
  float held_self = 0.0f;   // cycles
  const float free_step[2] = {hz / lab::kSampleRate, hz * FmGlass::kRatios[ratio_place] / lab::kSampleRate};
  const float free_index = index.value / kit::kTwoPi;
  const float free_self = feedback.value * FmGlass::kMaxFeedback / kit::kTwoPi;

  const int close_from = frames >= 30000 ? 24000 : 0;  // the close-up: 12 ms from half a second in
  constexpr int kClose = 576;
  if (offset.open(kClose + 1)) {
    offset.x0 = 1000.0f * static_cast<float>(close_from) / lab::kSampleRate;
    offset.x1 = offset.x0 + 12.0f;
  }

  // The first pass of a loop is not kept (lab.h), so the device runs it in
  // blocks with nothing read. From the second pass on it runs a sample at a
  // time, and the lab's own DC blocker starts from the device's.
  glass.note_on(1, hz, 1.0f);
  int newest = newest_voice();
  {
    const FmGlass::Voice& voice = glass.pool_.voices[newest];
    held_step[0] = voice.increment[0];
    held_step[1] = voice.increment[1];
    held_index = kit::min(glass.brightness_.target * voice.index[0], voice.cap[0]);
    held_self = glass.feedback_.target * voice.self[0];
    granted.value = held_index * kit::kTwoPi;
  }
  for (int done = 0; done < frames; done += 64) glass.process(frames - done < 64 ? frames - done : 64);
  blocker.x1 = glass.dc_[0].x1;
  blocker.y1 = glass.dc_[0].y1;

  bool before_active[FmGlass::kMaxVoices];
  float before_phase[FmGlass::kMaxVoices];
  const int total = lab::total();
  for (int i = frames; i < total; ++i) {
    if (i % frames == 0) {
      glass.note_on(1, hz, 1.0f);
      newest = newest_voice();
    }
    // The device reads each phase before it steps it, and each envelope after.
    for (int v = 0; v < FmGlass::kMaxVoices; ++v) {
      const FmGlass::Voice& voice = glass.pool_.voices[v];
      before_active[v] = voice.active();
      before_phase[v] = voice.phase[0];
    }
    glass.process(1);

    float sum_modulator = 0.0f, sum_carrier = 0.0f, group_a = 0.0f;
    for (int v = 0; v < FmGlass::kMaxVoices; ++v) {
      if (!before_active[v]) continue;
      const FmGlass::Voice& voice = glass.pool_.voices[v];
      const float e0 = voice.env[0].level_;
      const float e1 = voice.env[1].level_;
      const float index_a = kit::min(glass.brightness_.value * voice.index[0], voice.cap[0]);
      // fm_glass.h, the default case of render(): the carrier of pair A.
      const float a = kit::SineTable::lookup(before_phase[v] + index_a * e1 * voice.z[0][0]) * e0;
      group_a += a * voice.gain;
      sum_modulator += voice.z[0][0] * e1;
      sum_carrier += kit::SineTable::lookup(before_phase[v]) * e0;
    }
    // Spread 1 puts pair A alone on the left: gain, DC block, soft clip.
    const float again = kit::soft_clip(blocker.process(group_a * (glass.volume_.value * FmGlass::kVoiceGain)));
    const float left = glass.out_left()[0];
    if (i < 2 * frames) {
      device_left[i - frames] = left;
      rebuilt_left[i - frames] = again;
    }

    const FmGlass::Voice& voice = glass.pool_.voices[newest];
    const float cycles_a = kit::min(glass.brightness_.value * voice.index[0], voice.cap[0]);
    const float cycles_b = kit::min(glass.brightness_.value * voice.index[1], voice.cap[1]);
    modulator.put(i, sum_modulator);
    mod_env.put(i, voice.env[1].level_);
    index_now.put(i, kit::kTwoPi * cycles_a * voice.env[1].level_);
    amp_env.put(i, voice.env[0].level_);
    carrier.put(i, sum_carrier);
    modulated.put(i, group_a);
    index_b.put(i, kit::kTwoPi * cycles_b * voice.env[3].level_);
    out_b.put(i, glass.out_right()[0]);
    out.put(i, left);

    // The held pair, through the device's own operator functions.
    const float held_mod = FmGlass::self_modulated(held_phase[1], held_self, held_z);
    steady_modulator.put(i, held_mod);
    steady_carrier.put(i, kit::SineTable::lookup(held_phase[0]));
    steady.put(i, kit::SineTable::lookup(held_phase[0] + held_index * held_mod));
    const int close = i - frames - close_from;
    if (close >= 0 && close <= kClose) offset.set(close, kit::kTwoPi * held_index * held_mod);
    const float free_mod = FmGlass::self_modulated(free_phase[1], free_self, free_z);
    uncapped.put(i, kit::SineTable::lookup(free_phase[0] + free_index * free_mod));
    for (int op = 0; op < 2; ++op) {
      held_phase[op] = FmGlass::advance(held_phase[op], held_step[op]);
      free_phase[op] = FmGlass::advance(free_phase[op], free_step[op]);
    }
  }

  rebuilt.value = lab::difference_db(rebuilt_left, device_left, frames);
  as_frequency.value = frequency_against_phase(held_step[0], held_step[1], granted.value);
  // Not as a loop: a frame at the end would read on into the next strike.
  lab::spectrogram_tap(picture, device_left, frames, 200, false);
  put_lines();
}
