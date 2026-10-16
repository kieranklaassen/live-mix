// The plucked string: the Guitar (cpp/devices/guitar) playing one
// note, one sample at a time, so the string inside it (kit::PluckedString,
// cpp/kit/string.h) can be read as it rings.
//
//   pluck ─► (+) ──────────────────────────────────────► string ─► pickup ─► amplifier, speaker ─► out
//             ▲                                       │
//             └─ tuning ◄─ stiffness ◄─ loss ◄─ delay line
//
// Nothing goes in: the lab presses a key 10 ms into the loop and lets it go
// after "Key held for". A note of the Guitar is two strings; the taps of
// the string are of the first one, the one the pickup hears most.
//
// Read from the device: the pluck (the exciter's output), the delay line's
// contents at two instants, the string's output (the sample its loop wrote
// last), the note at the pickup (the input the DC blocker kept), the output.
// Measured on those: how fast each partial of the string falls, where each
// partial stands, the string's pitch, and the level of the note at the pickup.
// Worked out here from the device's own numbers ("lesson"): the loop filter's
// response and the fall of each partial that follows from it, the stiff
// string's law, the pick's comb, the tuning a simpler loop would have, the
// pickup's signal from the two strings, which the "rebuilt" check holds to the
// device, and from it the level of the first string alone.
// The tuning at every note of the neck is measured on a second Guitar's own
// string, set up by that Guitar and ticked here ("kit").
//
// Beside the device run two things the lesson starts from. The plain string is
// a third kit::PluckedString with no stiffness and no pick position, rung as
// long as the device's first string and fed one period of noise in place of a
// pluck ("kit"): the technique at its barest. The fixed wave is what a string
// is not: a saw at the note under one fade, falling as fast as the string's
// fundamental does ("lesson").
//
// The build path puts the string together in eight pieces, each a few lines of
// `Loop` and `Built` below: a burst of noise; a delay loop; the loss filter;
// stiffness; fine tuning; a shaped pluck; pick position; two strings and a
// pickup. The step chosen changes only the "built" taps. Each piece reads its
// numbers from the device's own strings as they run (the filter's pole and
// gain, the line's length, the all-passes' coefficients), so what the build
// writes out again is the arithmetic, not the design. Two copies run: one at
// the step chosen, and one with every piece, whose sound is compared on every
// render with the device's own signal at the pickup, from the pick onward (the
// "builtDifference" check).
//
// The lab starts where the technique shows plainly: Shimmer at 0 (the device
// starts at 0.3 Hz), so the note's two strings are tuned alike; no strum; and
// every pluck the same (set_variation(0), which is not a parameter). Volume
// starts at +6 dB (the device starts at -6), so the output is heard beside the
// rest. Strum spaces the notes of a chord and has nothing to space here.

#include "lab.h"

#include "../../cpp/devices/guitar/guitar.h"

using namespace livemix;

namespace {

Guitar instrument;
Guitar probe;  // a second device, for the tuning at every note of the neck

using String = Guitar::String;

constexpr int kKey = 1;
constexpr float kStrike = 0.8f;
constexpr int kKeyDown = 480;  // the key goes down 10 ms into the loop, so the loop's wrap is silence

lab::Control note{"note", "Pitch", "Hz", 82.41f, 880.0f, 220.0f, lab::kLog};
lab::Control sustain{"sustain", "Sustain", "s", 1.0f, 30.0f, 9.0f, lab::kLog};
lab::Control position{"position", "Pick position", "", 0.05f, 0.35f, 0.14f};
lab::Control hardness{"hardness", "Hardness", "", 0.0f, 1.0f, 0.55f};
lab::Control trips{"trips", "Look again after", "trips", 2.0f, 200.0f, 20.0f, lab::kLog};
lab::Control hold{"hold", "Key held for", "s", 0.25f, 4.0f, 3.0f};
lab::Control shimmer{"shimmer", "Shimmer", "Hz", 0.0f, 1.5f, 0.0f};
lab::Control pickup{"pickup", "Pickup", "", 0.0f, 1.0f, 0.85f};
lab::Control tone{"tone", "Tone", "Hz", 1500.0f, 5500.0f, 3600.0f, lab::kLog};
lab::Control swell{"swell", "Swell", "s", 0.0f, 3.0f, 0.0f};
lab::Control warmth{"warmth", "Warmth", "", 0.0f, 1.0f, 0.3f};
lab::Control volume{"volume", "Volume", "dB", -48.0f, 6.0f, 6.0f};

lab::Tap burst_tap{"burst", "One period of noise", lab::kAudio, lab::kLesson, 1};
lab::Tap plain_tap{"plain", "A plain string, fed the noise", lab::kAudio, lab::kKit, 1};
lab::Tap plain_start{"plainStart", "One period, the noise just in", lab::kCurve, lab::kKit, 1};
lab::Tap plain_later{"plainLater", "One period, some trips later", lab::kCurve, lab::kKit, 1};
lab::Tap plain_partials{"plainPartials", "The plain string's partials", lab::kFrames, lab::kKit, 1, "dB"};
lab::Tap fixed_tap{"fixed", "A fixed wave under one fade", lab::kAudio, lab::kLesson, 1};
lab::Tap fixed_partials{"fixedPartials", "The fixed wave's partials", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap pluck{"pluck", "The pluck", lab::kAudio, lab::kDevice, 1};
lab::Tap line_start{"lineStart", "The line just after the pluck", lab::kCurve, lab::kDevice, 1};
lab::Tap line_later{"lineLater", "The line some trips later", lab::kCurve, lab::kDevice, 1};
lab::Tap string_tap{"string", "The string", lab::kAudio, lab::kDevice, 1};
lab::Tap partials{"partials", "The string's partials", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap early{"early", "The string's first 85 ms", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap comb{"comb", "The pick's comb", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap loss{"loss", "One trip through the loop filter", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap decay_measured{"decayMeasured", "Fall of each partial, measured", lab::kCurve, lab::kDevice, 1, "dB/s"};
lab::Tap decay_formula{"decayFormula", "Fall of each partial, from the filter", lab::kCurve, lab::kLesson, 1, "dB/s"};
lab::Tap stretch_measured{"stretchMeasured", "Each partial, measured", lab::kCurve, lab::kDevice, 1, "cents"};
lab::Tap stretch_law{"stretchLaw", "The stiff string's law", lab::kCurve, lab::kLesson, 1, "cents"};
lab::Tap tune_kit{"tuneKit", "The string as the kit tunes it", lab::kCurve, lab::kKit, 1, "cents"};
lab::Tap tune_whole{"tuneWhole", "A line of whole samples", lab::kCurve, lab::kLesson, 1, "cents"};
lab::Tap tune_flat{"tuneFlat", "A line one period long", lab::kCurve, lab::kLesson, 1, "cents"};
lab::Tap level_one{"levelOne", "The first string alone", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Both strings: the note", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap pickup_tap{"pickup", "At the pickup", lab::kAudio, lab::kDevice, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check rebuilt{"rebuilt", "The pickup's signal worked out again from the two strings, against the device's", "dB"};
lab::Check loss_pole{"lossPole", "The loop filter's pole", ""};
lab::Check loss_gain{"lossGain", "The loop filter's gain", ""};
lab::Check pick_samples{"pickSamples", "The second pluck, ahead of the first", "samples"};
lab::Check loss_delay{"lossDelay", "The loop filter's delay at the note", "samples"};
lab::Check stiff_delay{"stiffDelay", "The stiffness filters' delay at the note", "samples"};
lab::Check line_length{"lineLength", "The delay line with its all-pass", "samples"};
lab::Check loop_error{"loopError", "Line, all-pass and filters added up, less one period", "samples"};
lab::Check cents{"cents", "The string's pitch, measured, against the note", "cents"};
lab::Check decay_error{"decayError", "Measured fall against the filter's, the worst of the partials measured", "%"};

// ---------------------------------------------------------------------------
// Measuring one frequency of a signal.

constexpr int kWindow = 4096;
float window_[kWindow];  // a Hann window squared: nothing leaks in from the partials either side

// The part of x[0 .. kWindow) that turns at `hz`, the window laid on it. The
// turning is counted from `first` samples earlier, so two windows can be compared.
void component(const float* x, double hz, int first, double* re, double* im) {
  const double w = 2.0 * lab::kPi * hz / lab::kSampleRate;
  const double cw = std::cos(w), sw = std::sin(w);
  double c = std::cos(w * first), s = std::sin(w * first);
  double sum_re = 0.0, sum_im = 0.0;
  for (int n = 0; n < kWindow; ++n) {
    const double v = static_cast<double>(x[n]) * window_[n];
    sum_re += v * c;
    sum_im -= v * s;
    const double next = c * cw - s * sw;
    s = s * cw + c * sw;
    c = next;
  }
  *re = sum_re;
  *im = sum_im;
}

double size_db(const float* x, double hz) {
  double re, im;
  component(x, hz, 0, &re, &im);
  const double power = re * re + im * im;
  return power > 1.0e-30 ? 10.0 * std::log10(power) : -300.0;
}

// The frequency of the tone near `guess` in x[0 .. kWindow + hop): how far its
// phase turns between two windows `hop` samples apart, beyond what `guess`
// itself would turn. Exact for one tone, dying or not.
double measure_hz(const float* x, int hop, double guess) {
  double re0, im0, re1, im1;
  component(x, guess, 0, &re0, &im0);
  component(x + hop, guess, hop, &re1, &im1);
  const double turned = std::atan2(im1 * re0 - re1 * im0, re1 * re0 + im1 * im0);
  return guess + turned * lab::kSampleRate / (2.0 * lab::kPi * hop);
}

double cents_between(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The mean square of the last `length` samples: with `length` one period, the
// level of a note with no ripple on it.
struct MeanSquare {
  float ring[1024];
  int length = 1;
  int at = 0;
  double sum = 0.0;

  void reset(int samples) {
    length = samples < 1 ? 1 : (samples > 1024 ? 1024 : samples);
    at = 0;
    sum = 0.0;
    for (int i = 0; i < length; ++i) ring[i] = 0.0f;
  }
  float push(float x) {
    const float square = x * x;
    sum += static_cast<double>(square) - static_cast<double>(ring[at]);
    ring[at] = square;
    at = at + 1 < length ? at + 1 : 0;
    return sum > 0.0 ? static_cast<float>(sum / length) : 0.0f;
  }
};

float level_db(float mean_square) { return kit::max(lab::power_to_db(mean_square), -120.0f); }

// ---------------------------------------------------------------------------
// Reading a string.

float newest(const String& s) { return s.buffer_[(s.write_ - 1) & String::kMask]; }

// |H| of the loop filter (1 - a) / (1 - a z^-1), as string.h writes it.
double loss_size(double a, double w) { return (1.0 - a) / std::sqrt(1.0 - 2.0 * a * std::cos(w) + a * a); }

// How far the string's own frequency turns in a sample, in radians.
double turn_of(const String& s) { return 2.0 * lab::kPi * s.hz_ / s.sample_rate_; }

// The phase delays, in samples, that PluckedString::retune takes off the line:
// the loop filter's and the stiffness all-passes', at the string's frequency.
double allpass_delay_of(double a, double w) {
  return 1.0 - 2.0 * std::atan2(a * std::sin(w), 1.0 + a * std::cos(w)) / w;
}
double loss_delay_of(const String& s) {
  const double w = turn_of(s);
  return std::atan2(s.loss_a_ * std::sin(w), 1.0 - s.loss_a_ * std::cos(w)) / w;
}
double stiff_delay_of(const String& s) {
  const double w = turn_of(s);
  return s.stiff_stages_ * allpass_delay_of(s.stiff_a_, w);
}

// The delay line as it lies: point 0 was written last, the last point is the
// next to be read. A wave in the line moves to the right.
void capture(lab::Tap& tap, const String& s) {
  const int points = s.whole_;
  if (tap.data || !tap.open(points)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(points - 1);
  for (int j = 0; j < points; ++j) tap.set(j, s.buffer_[(s.write_ - 1 - j) & String::kMask]);
}

void configure(Guitar& device) {
  using namespace guitar;
  device.init(lab::kSampleRate);
  device.set_variation(0.0f);
  device.set_param(kStrum, 0.0f);
  device.set_param(kPickup, pickup.value);
  device.set_param(kPosition, position.value);
  device.set_param(kHardness, hardness.value);
  device.set_param(kSustain, sustain.value);
  device.set_param(kShimmer, shimmer.value);
  device.set_param(kTone, tone.value);
  device.set_param(kSwell, swell.value);
  device.set_param(kWarmth, warmth.value);
  device.set_param(kVolume, volume.value);
}

Guitar::Voice* voice_of(Guitar& device) {
  Guitar::Voice* found = nullptr;
  for (int v = 0; v < Guitar::kMaxVoices; ++v) {
    Guitar::Voice& voice = device.voices_[v];
    if (voice.on && voice.note_id == kKey && (!found || voice.stamp > found->stamp)) found = &voice;
  }
  return found;
}

// The loop filter's gain for one trip, against frequency.
void filter_curve(const String& s) {
  constexpr int kPoints = 241;
  if (!loss.open(kPoints)) return;
  loss.x0 = 20.0f;
  loss.x1 = 20000.0f;
  loss.scale = lab::kLog;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = 20.0 * std::pow(1000.0, static_cast<double>(p) / (kPoints - 1));
    const double w = 2.0 * lab::kPi * hz / lab::kSampleRate;
    loss.set(p, static_cast<float>(20.0 * std::log10(s.loss_gain_ * loss_size(s.loss_a_, w))));
  }
}

constexpr int kPartials = 16;
constexpr int kLookFrom = 1440;   // 30 ms after the pluck: the pick has left the string
constexpr int kLookApart = 2400;  // 50 ms between the two looks at a partial's size
constexpr int kLookHop = 1024;    // and 21 ms between the two looks at its phase
constexpr double kFastest = 700.0;  // dB a second: a partial that falls faster is gone before the second look

// How long one trip round the loop takes a narrow band of sound at angular
// frequency w, in samples: the line, and the group delay of each filter.
double trip_samples(const String& s, double w) {
  const double c = std::cos(w);
  const auto allpass = [c](double a) { return (1.0 - a * a) / (1.0 + 2.0 * a * c + a * a); };
  const double a = s.loss_a_;
  const double lowpass = a * (c - a) / (1.0 - 2.0 * a * c + a * a);
  return s.whole_ + allpass(s.tune_a_) + lowpass + s.stiff_stages_ * allpass(s.stiff_a_);
}

// What a partial at `hz` loses in a second: the loop filter's gain for one
// trip, as many times as the partial goes round.
double fall_of(const String& s, double hz) {
  const double w = 2.0 * lab::kPi * hz / lab::kSampleRate;
  const double one_trip = -20.0 * std::log10(s.loss_gain_ * loss_size(s.loss_a_, w));
  return one_trip * lab::kSampleRate / trip_samples(s, w);
}

// Each partial of the string, measured where it rings freely: where it
// stands, and how fast it falls. Beside them, as lines through every place
// between the partials too, what the code says they should be: the stiff
// string's law, and the loop filter's loss. Only the partials slow enough to
// be measured are measured.
void partial_curves(const String& s, const float* x, int count) {
  constexpr int kFine = 151;  // ten points to a partial
  const double b = s.stiff_stages_ > 0 ? Guitar::stiffness(s.hz_) : 0.0;
  const auto law = [&s, b](double k) { return k * s.hz_ * std::sqrt((1.0 + b * k * k) / (1.0 + b)); };
  const bool room = count >= kLookFrom + kLookApart + kWindow;
  int measurable = 0;
  while (room && measurable < kPartials && fall_of(s, law(measurable + 1)) <= kFastest) ++measurable;

  if (!decay_formula.open(kFine) || !stretch_law.open(kFine)) return;
  decay_formula.x0 = stretch_law.x0 = 1.0f;
  decay_formula.x1 = stretch_law.x1 = static_cast<float>(kPartials);
  for (int p = 0; p < kFine; ++p) {
    const double k = 1.0 + (kPartials - 1.0) * p / (kFine - 1);
    decay_formula.set(p, static_cast<float>(fall_of(s, law(k))));
    stretch_law.set(p, static_cast<float>(cents_between(law(k), k * s.hz_)));
  }

  // With nothing to measure the two curves hold one point: the formula's, at the fundamental.
  const int points = measurable > 0 ? measurable : 1;
  if (!decay_measured.open(points) || !stretch_measured.open(points)) return;
  decay_measured.x0 = stretch_measured.x0 = 1.0f;
  decay_measured.x1 = stretch_measured.x1 = static_cast<float>(points);
  decay_measured.set(0, static_cast<float>(fall_of(s, s.hz_)));

  double sizes[kPartials], falls[kPartials], written[kPartials];
  double loudest = -400.0;
  for (int k = 1; k <= measurable; ++k) {
    const double hz = measure_hz(x + kLookFrom, kLookHop, law(k));
    sizes[k - 1] = size_db(x + kLookFrom, hz);
    falls[k - 1] = (sizes[k - 1] - size_db(x + kLookFrom + kLookApart, hz)) * lab::kSampleRate / kLookApart;
    written[k - 1] = fall_of(s, hz);  // the formula at the frequency the partial really has
    if (sizes[k - 1] > loudest) loudest = sizes[k - 1];
    stretch_measured.set(k - 1, static_cast<float>(cents_between(hz, k * s.hz_)));
    decay_measured.set(k - 1, static_cast<float>(falls[k - 1]));
  }
  // The check leaves out a partial the pick has all but silenced: 30 dB under the loudest.
  double worst = 0.0;
  for (int k = 1; k <= measurable; ++k) {
    if (sizes[k - 1] < loudest - 30.0 || written[k - 1] <= 0.0) continue;
    const double off = 100.0 * std::fabs(falls[k - 1] - written[k - 1]) / written[k - 1];
    if (off > worst) worst = off;
  }
  decay_error.value = static_cast<float>(worst);
}

// The pick's comb: with the second pluck M samples ahead in a loop P samples
// round, partial k comes out |2 sin(pi k M / P)| of its size.
void comb_curve(const String& s) {
  constexpr int kPoints = 2401;
  if (!comb.open(kPoints)) return;
  comb.x0 = 0.0f;
  comb.x1 = 12000.0f;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = 12000.0 * p / (kPoints - 1);
    const double size = 2.0 * std::fabs(std::sin(lab::kPi * hz * s.comb_offset_ / lab::kSampleRate));
    comb.set(p, size > 1.0e-3 ? static_cast<float>(20.0 * std::log10(size)) : -60.0f);
  }
}

// The tuning at every note from the low E to the A three octaves and a fourth
// above it: a second Guitar picks each one, and its first string is then
// ticked here and its pitch measured.
void tuning_curves() {
  constexpr int kNotes = 42;
  constexpr int kSkip = 1024;
  constexpr int kHop = 1024;
  lab::Tap* const curves[] = {&tune_kit, &tune_whole, &tune_flat};
  const float low = 82.407f;
  for (lab::Tap* tap : curves) {
    if (!tap->open(kNotes)) return;
    tap->x0 = low;
    tap->x1 = low * std::exp2(static_cast<float>(kNotes - 1) / 12.0f);
    tap->scale = lab::kLog;
  }
  float* x = lab::take(kWindow + kHop);
  if (!x) return;
  for (int n = 0; n < kNotes; ++n) {
    configure(probe);
    probe.note_on(kKey, low * std::exp2(static_cast<float>(n) / 12.0f), kStrike);
    probe.process(1);  // the pick leaves the string on this sample
    Guitar::Voice* voice = voice_of(probe);
    if (!voice || !voice->sounding) continue;
    String& s = voice->a;
    for (int i = 1; i < kSkip + kWindow + kHop; ++i) {
      const float y = s.tick(voice->exciter.active() ? voice->exciter.next(voice->scrape) : 0.0f);
      if (i >= kSkip) x[i - kSkip] = y;
    }
    tune_kit.set(n, static_cast<float>(cents_between(measure_hz(x, kHop, s.hz_), s.hz_)));
    // What is in the loop beside the line: the loop filter and the stiffness filters.
    const double beside = loss_delay_of(s) + stiff_delay_of(s);
    const double wanted = s.period_ - beside;
    tune_whole.set(n, static_cast<float>(cents_between(s.period_, std::floor(wanted + 0.5) + beside)));
    tune_flat.set(n, static_cast<float>(cents_between(s.period_, s.period_ + beside)));
  }
}

// ---------------------------------------------------------------------------
// The textbook case: one period of noise, a plain string, and a fixed wave.

constexpr float kBurstLevel = 0.7f;
constexpr float kFixedLevel = 0.25f;
constexpr int kLongestBurst = 1024;

float burst_[kLongestBurst];  // one period of noise, its mean taken out
int burst_length = 0;

// As many samples of noise as the note's period is long, the same every
// render. Their mean is taken out: a steady push would go round the loop too.
void make_burst(float period) {
  kit::Rng rng;
  rng.seed(0x5EED1E55u);
  burst_length = kit::clamp_int(static_cast<int>(period + 0.5f), 1, kLongestBurst);
  float sum = 0.0f;
  for (int k = 0; k < burst_length; ++k) {
    burst_[k] = kBurstLevel * rng.bipolar();
    sum += burst_[k];
  }
  const float mean = sum / static_cast<float>(burst_length);
  for (int k = 0; k < burst_length; ++k) burst_[k] -= mean;
}

String plain;  // a third string of the kit's: no stiffness, no pick position

// The last `points` samples a line was given, the newest first.
void capture_last(lab::Tap& tap, const float* line, int write, int points) {
  if (tap.data || !tap.open(points)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(points - 1);
  for (int j = 0; j < points; ++j) tap.set(j, line[(write - 1 - j) & String::kMask]);
}

// ---------------------------------------------------------------------------
// The build path: the string put together a piece at a time.

// The pieces, in the order the steps add them.
enum Piece : int { kBurst = 0, kLoop = 1, kLoss = 2, kStiff = 3, kTune = 4, kPluck = 5, kComb = 6, kPickup = 7 };

// Until the loss filter arrives nothing in the loop loses anything, and the
// note would never end: at key up the build lays a finger of its own on the
// string, and each trip then keeps this much.
constexpr float kFinger = 0.9f;

// One string of the build: a delay line, and what stands in its loop so far.
// `like` is the device's own string, read as it runs: each piece takes its
// numbers from it and does the arithmetic again.
struct Loop {
  float line[String::kMask + 1];
  int write = 0;
  float lowpass = 0.0f;
  float stiff_in[String::kMaxStiffStages];
  float stiff_out[String::kMaxStiffStages];
  float tune_in = 0.0f;
  float tune_out = 0.0f;

  void clear() {
    for (float& sample : line) sample = 0.0f;
    write = 0;
    lowpass = 0.0f;
    for (int s = 0; s < String::kMaxStiffStages; ++s) stiff_in[s] = stiff_out[s] = 0.0f;
    tune_in = tune_out = 0.0f;
  }

  // One sample: the pluck goes in, the string's newest sample comes out.
  float round(float pluck, const String& like, int step, bool finger) {
    float y = 0.0f;
    if (step >= kLoop) {
      // The delay loop: what was written one trip ago comes back.
      const int trip = step >= kTune ? like.whole_ : static_cast<int>(like.period_ + 0.5f);
      y = line[(write - trip) & String::kMask];
      if (step < kLoss && finger) y *= kFinger;
    }
    if (step >= kLoss) {
      // The loss filter: a low-pass of one pole, then a gain a little under one.
      lowpass = flush_denormal(y + (lowpass - y) * like.loss_a_);
      y = like.loss_gain_ * lowpass;
    }
    if (step >= kStiff) {
      // Stiffness: all-passes that hold the low partials back longer than the high.
      for (int s = 0; s < like.stiff_stages_; ++s) {
        const float out = flush_denormal(like.stiff_a_ * y + stiff_in[s] - like.stiff_a_ * stiff_out[s]);
        stiff_in[s] = y;
        stiff_out[s] = out;
        y = out;
      }
    }
    if (step >= kTune) {
      // Fine tuning: the line is cut to whole samples, and one all-pass is the rest.
      const float out = flush_denormal(like.tune_a_ * y + tune_in - like.tune_a_ * tune_out);
      tune_in = y;
      tune_out = out;
      y = out;
    }
    y += pluck;
    line[write] = y;
    // Pick position: the same pluck, upside down, a little further round.
    if (step >= kComb && like.comb_offset_ > 0 && pluck != 0.0f) {
      line[(write - like.comb_offset_) & String::kMask] -= pluck;
    }
    write = (write + 1) & String::kMask;
    return y;
  }

  // The string `delay` samples ago, read between two samples of the line.
  float earlier(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float a = line[(write - 1 - whole) & String::kMask];
    const float b = line[(write - 2 - whole) & String::kMask];
    return a + (b - a) * fraction;
  }
};

// The string so far: the pieces up to `step`, run a sample at a time beside
// the device, struck on the sample the device strikes.
struct Built {
  int step = 0;
  bool struck = false;
  Loop first;
  Loop second;
  int burst_at = 0;
  // The shaped pluck: one tall sample and a little noise, and two low-passes.
  float impulse = 0.0f;
  float scrape_level = 0.0f;
  float scrape_fall = 0.0f;
  float body_a = 0.0f;
  float pick_a = 0.0f;
  float body = 0.0f;
  float pick = 0.0f;
  int left = 0;
  kit::Rng scrape;
  float pluck = 0.0f;   // what went into the loop on this sample
  float string = 0.0f;  // the first string's newest sample

  void start(int at) {
    step = at;
    struck = false;
    pluck = 0.0f;
    string = 0.0f;
  }

  // The pick leaves the string. `fresh` is the device's pluck before any of it
  // has run: how tall, how noisy, and where its two low-passes stand.
  void strike(const kit::PluckExciter& fresh, const kit::Rng& rng) {
    first.clear();
    second.clear();
    struck = true;
    burst_at = 0;
    impulse = fresh.impulse_;
    scrape_level = fresh.noise_level_;
    scrape_fall = fresh.noise_decay_;
    body_a = fresh.body_a_;
    pick_a = fresh.pick_a_;
    left = fresh.remaining_;
    body = 0.0f;
    pick = 0.0f;
    scrape = rng;
  }

  // A burst of noise: one period of it, once.
  float noise() { return burst_at < burst_length ? burst_[burst_at++] : 0.0f; }

  // A shaped pluck: the tall sample falls away at the note's own frequency,
  // and the pick's low-pass rounds its corner.
  float shaped() {
    if (left <= 0) return 0.0f;
    float x = impulse;
    impulse = 0.0f;
    if (scrape_level > 1.0e-9f) {
      x += scrape_level * scrape.bipolar();
      scrape_level *= scrape_fall;
    }
    body = x + (body - x) * body_a;
    pick = body + (pick - body) * pick_a;
    if (--left == 0) {
      body = 0.0f;
      pick = 0.0f;
    }
    return pick;
  }

  // One sample of the note so far. `voice` is the device's note, and
  // `open_fraction` where its pickup stands on the open string.
  float run(const Guitar::Voice& voice, float open_fraction) {
    if (!struck) return 0.0f;
    pluck = step >= kPluck ? shaped() : noise();
    string = first.round(pluck, voice.a, step, voice.damping);
    if (step < kPickup) return string * voice.fade;
    // Two strings and a pickup: the second string, and each string less
    // itself a little earlier, as a pickup at one point of it hears it.
    const float other = second.round(pluck, voice.b, step, voice.damping);
    if (!voice.sounding) return 0.0f;
    const float q = Guitar::pickup_fraction(open_fraction, voice.ratio);
    float x = voice.first * (string - first.earlier(q * voice.a.period_)) +
              voice.second * (other - second.earlier(q * voice.b.period_));
    x += Guitar::kPickupCurve * x * x;
    float gain = voice.trim * voice.fade;
    gain *= voice.swell * voice.swell * (3.0f - 2.0f * voice.swell);
    return x * gain;
  }
};

lab::Build build{"A burst of noise|A delay loop|The loss filter|Stiffness|Fine tuning|A shaped pluck|"
                 "Pick position|Two strings and a pickup",
                 kPickup, -120.0f,
                 "The string as built, all eight pieces, against the device's own signal at the pickup, from the pick onward"};

lab::Tap built{"built", "The string so far", lab::kAudio, lab::kLesson, 1};
lab::Tap built_pluck{"builtPluck", "What goes into the loop", lab::kAudio, lab::kLesson, 1};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_start{"builtStart", "One period as built, the pluck just in", lab::kCurve, lab::kLesson, 1};
lab::Tap built_later{"builtLater", "One period as built, some trips later", lab::kCurve, lab::kLesson, 1};

lab::Check built_cents{"builtCents", "The string as built, against the note", "cents"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// The device's pluck before any of it has run: a second Guitar is set up the
// same, the same key pressed, and the strike worked out with nothing played.
bool fresh_pluck(float hz, kit::PluckExciter* exciter, kit::Rng* scrape) {
  configure(probe);
  probe.note_on(kKey, hz, kStrike);
  Guitar::Voice* voice = voice_of(probe);
  if (!voice) return false;
  probe.strike(*voice);
  *exciter = voice->exciter;
  *scrape = voice->scrape;
  return true;
}

// How long one trip round the built loop is at the note, in samples, at a step.
double built_trip(const String& s, int step) {
  if (step >= kTune) return s.period_;
  double trip = static_cast<int>(s.period_ + 0.5f);
  if (step >= kLoss) trip += loss_delay_of(s);
  if (step >= kStiff) trip += stiff_delay_of(s);
  return trip;
}

}  // namespace

void lab_setup() {
  for (int n = 0; n < kWindow; ++n) {
    const double hann = 0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kWindow);
    window_[n] = static_cast<float>(hann * hann);
  }
}

void lab_render(int frames) {
  configure(instrument);
  const int total = lab::total();
  constexpr int kBlock = lab::kControlPeriod;
  // Let go at the loop's end or after it, the key is never let go.
  int release_at = kKeyDown + static_cast<int>(hold.value * lab::kSampleRate);
  release_at -= release_at % kBlock;
  float* at_pickup = lab::take(frames);
  float* worked_out = lab::take(frames);
  float* built_string = lab::take(frames);
  if (!at_pickup || !worked_out || !built_string) return;

  Guitar::Voice* voice = nullptr;
  int struck = -1;  // where in the kept pass the pick left the string
  int look_first = -1, look_later = -1;
  MeanSquare of_first, of_note, of_built;
  of_first.reset(static_cast<int>(lab::kSampleRate / note.value + 0.5f));
  of_note.reset(of_first.length);
  of_built.reset(of_first.length);

  // The textbook case beside the device.
  plain.reset();
  bool plain_rings = false;
  int plain_first = -1, plain_later_at = -1;
  kit::BlepOsc saw;
  float fixed_gain = 0.0f, fixed_fall = 1.0f;
  const float fixed_damp = std::pow(10.0f, -3.0f / (Guitar::kDampSeconds * lab::kSampleRate));
  int burst_at = 0;
  burst_length = 0;

  // The build path beside it.
  shown.start(build.at());
  held.start(build.compared_step);
  int built_first = -1, built_later_at = -1;
  double built_apart = 0.0, built_whole = 0.0;

  for (int i = 0; i < total; ++i) {
    const int at = i % frames;
    if (at == kKeyDown) {
      instrument.note_on(kKey, note.value, kStrike);
      voice = voice_of(instrument);
    }
    if (at == release_at) instrument.note_off(kKey);
    if (i < frames) {
      // The first pass is only there so that the second starts as the tenth
      // would: nothing of it is kept, and the device runs it a block at a time.
      instrument.process(kBlock);
      i += kBlock - 1;
      continue;
    }
    const bool waiting = voice && voice->pending;
    instrument.process(1);
    const bool kept = i < 2 * frames;
    const bool sounding = voice && voice->sounding;

    if (waiting && !voice->pending) {  // the pick left the string on this sample
      const String& s = voice->a;
      // The plain string and the fixed wave start with it, and so does the build.
      make_burst(s.period_);
      burst_at = 0;
      plain.reset();
      plain.set_decay(s.decay_, s.decay_high_, s.high_hz_);
      plain.set_frequency(s.hz_, lab::kSampleRate);
      plain_rings = true;
      saw.reset(0.5f);
      fixed_gain = kFixedLevel;
      fixed_fall = static_cast<float>(std::pow(10.0, -fall_of(s, s.hz_) / (20.0 * lab::kSampleRate)));
      kit::PluckExciter fresh;
      kit::Rng scrape;
      if (fresh_pluck(voice->hz, &fresh, &scrape)) {
        shown.strike(fresh, scrape);
        held.strike(fresh, scrape);
      }
      if (kept && struck < 0) {
        struck = at;
        // The first look is before anything has come round: the two plucks,
        // comb_offset_ apart, stand either side of a point six tenths along the line.
        look_first =
            struck + static_cast<int>(0.6f * static_cast<float>(s.whole_) - 0.5f * static_cast<float>(s.comb_offset_));
        const int most = static_cast<int>(static_cast<float>(frames - 2 - look_first) / s.period_);
        const int asked = static_cast<int>(trips.value + 0.5f);
        const int round = asked < most ? asked : most;
        look_later = look_first + static_cast<int>(s.period_ * static_cast<float>(round) + 0.5f);
        // The plain string is looked at when the last of the noise has gone in,
        // and the build when its pluck has: the noise, or the pick's two plucks.
        plain_first = struck + burst_length - 1;
        plain_later_at = plain_first + static_cast<int>(s.period_ * static_cast<float>(round) + 0.5f);
        const int comb_at = shown.step >= kComb ? s.comb_offset_ : 0;
        built_first = shown.step >= kPluck
                          ? struck + static_cast<int>(0.6f * static_cast<float>(s.whole_) - 0.5f * static_cast<float>(comb_at))
                          : plain_first;
        built_later_at = built_first + static_cast<int>(built_trip(s, shown.step) * round + 0.5);
      }
    }
    if (kept && sounding) {
      if (at == look_first) capture(line_start, voice->a);
      if (at == look_later) capture(line_later, voice->a);
    }

    // The notes at the pickup, as Guitar::render adds them up.
    float sum = 0.0f;
    float first_alone = 0.0f;
    for (int v = 0; v < Guitar::kMaxVoices; ++v) {
      Guitar::Voice& one = instrument.voices_[v];
      if (!one.sounding) continue;
      const float q = Guitar::pickup_fraction(instrument.pickup_.value, one.ratio);
      const float heard_a = one.first * (newest(one.a) - one.a.tap(q * one.a.period()));
      const float heard_b = one.second * (newest(one.b) - one.b.tap(q * one.b.period()));
      float x = heard_a + heard_b;
      x += Guitar::kPickupCurve * x * x;
      float gain = one.trim * one.fade;
      gain *= one.swell * one.swell * (3.0f - 2.0f * one.swell);  // the Swell's fade-in, 1 once it is over
      sum += x * gain;
      if (&one == voice) first_alone = heard_a * gain;
    }
    const float device_sum = instrument.idle_.asleep() ? 0.0f : instrument.dc_.x1;
    if (kept) {
      at_pickup[at] = device_sum;
      worked_out[at] = sum;
    }

    // The plain string: the kit's own loop, fed the noise, rung and damped as
    // the device's first string is.
    const float fade = voice ? voice->fade : 0.0f;
    const float noise_in = plain_rings && burst_at < burst_length ? burst_[burst_at++] : 0.0f;
    float plain_out = 0.0f;
    if (plain_rings) {
      if (sounding && (voice->a.decay_ != plain.decay_ || voice->a.decay_high_ != plain.decay_high_)) {
        plain.set_decay(voice->a.decay_, voice->a.decay_high_, voice->a.high_hz_);
      }
      plain_out = plain.tick(noise_in) * fade;
    }
    if (kept && at == plain_first) capture_last(plain_start, plain.buffer_, plain.write_, burst_length);
    if (kept && at == plain_later_at) capture_last(plain_later, plain.buffer_, plain.write_, burst_length);
    burst_tap.put(i, noise_in);
    plain_tap.put(i, plain_out);

    // The fixed wave: every partial of a saw under the one fade.
    float fixed_out = 0.0f;
    if (plain_rings && voice) {
      fixed_out = fixed_gain * saw.saw(voice->a.hz_ / lab::kSampleRate) * fade;
      fixed_gain = flush_denormal(fixed_gain * (voice->damping ? fixed_damp : fixed_fall));
    }
    fixed_tap.put(i, fixed_out);

    // The build path: the step chosen, and every piece against the device.
    float built_out = 0.0f;
    if (voice) {
      built_out = shown.run(*voice, instrument.pickup_.value);
      const float whole = held.run(*voice, instrument.pickup_.value);
      if (kept && struck >= 0) {
        const double apart = static_cast<double>(whole) - static_cast<double>(device_sum);
        built_apart += apart * apart;
        built_whole += static_cast<double>(device_sum) * static_cast<double>(device_sum);
      }
    }
    if (kept) {
      built_string[at] = shown.string;
      if (at == built_first) capture_last(built_start, shown.first.line, shown.first.write, burst_length);
      if (at == built_later_at) capture_last(built_later, shown.first.line, shown.first.write, burst_length);
    }
    built.put(i, built_out);
    built_pluck.put(i, shown.struck ? shown.pluck : 0.0f);
    const float built_power = of_built.push(built_out);

    pluck.put(i, sounding ? voice->exciter.pick_ : 0.0f);
    string_tap.put(i, sounding ? newest(voice->a) : 0.0f);
    const float first_power = of_first.push(first_alone);
    const float note_power = of_note.push(device_sum);
    if (i % lab::kControlPeriod == 0) {
      level_one.put(i, level_db(first_power));
      level.put(i, level_db(note_power));
      built_level.put(i, level_db(built_power));
    }
    pickup_tap.put(i, device_sum);
    out_tap.put(i, instrument.out_left()[0], instrument.out_right()[0]);
  }
  rebuilt.value = lab::difference_db(worked_out, at_pickup, frames);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  // A loop too short for the looks asked for still shows the lines as they end.
  if (burst_length > 0) {
    capture_last(plain_start, plain.buffer_, plain.write_, burst_length);
    capture_last(plain_later, plain.buffer_, plain.write_, burst_length);
    capture_last(built_start, shown.first.line, shown.first.write, burst_length);
    capture_last(built_later, shown.first.line, shown.first.write, burst_length);
  }
  lab::spectrogram_tap(plain_partials, plain_tap.channel(0), frames);
  lab::spectrogram_tap(fixed_partials, fixed_tap.channel(0), frames);

  if (!voice) return;
  const String& s = voice->a;
  capture(line_start, s);
  capture(line_later, s);

  const float* x = string_tap.channel(0);
  if (struck < 0) struck = 0;
  const int after = frames - struck;
  lab::spectrogram_tap(partials, x, frames);
  if (early.open(lab::kSpectrumBins)) {
    early.x0 = 0.0f;
    early.x1 = lab::kSampleRate * 0.5f;
    lab::spectrum(x + struck, after < kWindow ? after : kWindow, early.data);
  }
  comb_curve(s);
  filter_curve(s);
  partial_curves(s, x + struck, after);

  // The loop's length, term by term, as PluckedString::retune adds it up.
  const double w = turn_of(s);
  const double line = s.whole_ + allpass_delay_of(s.tune_a_, w);
  loss_pole.value = s.loss_a_;
  loss_gain.value = s.loss_gain_;
  pick_samples.value = static_cast<float>(s.comb_offset_);
  loss_delay.value = static_cast<float>(loss_delay_of(s));
  stiff_delay.value = static_cast<float>(stiff_delay_of(s));
  line_length.value = static_cast<float>(line);
  loop_error.value = static_cast<float>(line + loss_delay_of(s) + stiff_delay_of(s) - s.period_);
  if (after >= kLookFrom + kWindow + 2048) {
    cents.value = static_cast<float>(cents_between(measure_hz(x + struck + kLookFrom, 2048, s.hz_), s.hz_));
    // The built string's pitch, where it has one: looked for where its loop's length puts it.
    if (shown.step >= kLoop) {
      const double guess = lab::kSampleRate / built_trip(s, shown.step);
      built_cents.value =
          static_cast<float>(cents_between(measure_hz(built_string + struck + kLookFrom, 2048, guess), s.hz_));
    }
  }
  tuning_curves();
}
