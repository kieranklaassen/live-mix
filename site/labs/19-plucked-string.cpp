// Lesson 19, the plucked string: the Guitar (cpp/devices/guitar) playing one
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
// partial stands, the string's pitch.
// Worked out here from the device's own numbers ("lesson"): the loop filter's
// response and the fall of each partial that follows from it, the stiff
// string's law, the pick's comb, the tuning a simpler loop would have, the
// two levels, and the pickup's signal from the two strings, which the
// "rebuilt" check holds to the device.
// The tuning at every note of the neck is measured on a second Guitar's own
// string, set up by that Guitar and ticked here ("kit").
//
// The lab starts where the technique shows plainly: Shimmer at 0 (the device
// starts at 0.3 Hz), so the note's two strings are tuned alike; no strum; and
// every pluck the same (set_variation(0), which is not a parameter). Volume is
// at +6 dB (the device starts at -6), so the output is heard beside the rest.

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
constexpr double kPiD = 3.14159265358979323846;

lab::Control note{"note", "Pitch", "Hz", 82.41f, 880.0f, 220.0f, lab::kLog};
lab::Control sustain{"sustain", "Sustain", "s", 1.0f, 30.0f, 9.0f, lab::kLog};
lab::Control position{"position", "Pick position", "", 0.05f, 0.35f, 0.14f};
lab::Control hardness{"hardness", "Hardness", "", 0.0f, 1.0f, 0.55f};
lab::Control trips{"trips", "Look again after", "trips", 2.0f, 200.0f, 20.0f, lab::kLog};
lab::Control hold{"hold", "Key held for", "s", 0.25f, 4.0f, 3.0f};
lab::Control shimmer{"shimmer", "Shimmer", "Hz", 0.0f, 1.5f, 0.0f};
lab::Control pickup{"pickup", "Pickup", "", 0.0f, 1.0f, 0.85f};

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
lab::Tap level{"level", "Both strings: the note", lab::kControl, lab::kLesson, 1, "dB"};
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
  const double w = 2.0 * kPiD * hz / lab::kSampleRate;
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
  return guess + turned * lab::kSampleRate / (2.0 * kPiD * hop);
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

// The phase delays, in samples, that PluckedString::retune takes off the line:
// the loop filter's and the stiffness all-passes', at the string's frequency.
double allpass_delay_of(double a, double w) {
  return 1.0 - 2.0 * std::atan2(a * std::sin(w), 1.0 + a * std::cos(w)) / w;
}
double loss_delay_of(const String& s) {
  const double w = 2.0 * kPiD * s.hz_ / s.sample_rate_;
  return std::atan2(s.loss_a_ * std::sin(w), 1.0 - s.loss_a_ * std::cos(w)) / w;
}
double stiff_delay_of(const String& s) {
  const double w = 2.0 * kPiD * s.hz_ / s.sample_rate_;
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
  device.set_param(kVolume, 6.0f);
  device.set_param(kPickup, pickup.value);
  device.set_param(kPosition, position.value);
  device.set_param(kHardness, hardness.value);
  device.set_param(kSustain, sustain.value);
  device.set_param(kShimmer, shimmer.value);
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
    const double w = 2.0 * kPiD * hz / lab::kSampleRate;
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
  const double w = 2.0 * kPiD * hz / lab::kSampleRate;
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
// round, partial k comes out sin(pi k M / P) of its full size.
void comb_curve(const String& s) {
  constexpr int kPoints = 2401;
  if (!comb.open(kPoints)) return;
  comb.x0 = 0.0f;
  comb.x1 = 12000.0f;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = 12000.0 * p / (kPoints - 1);
    const double size = std::fabs(std::sin(kPiD * hz * s.comb_offset_ / lab::kSampleRate));
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

}  // namespace

void lab_setup() {
  for (int n = 0; n < kWindow; ++n) {
    const double hann = 0.5 - 0.5 * std::cos(2.0 * kPiD * n / kWindow);
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
  if (!at_pickup || !worked_out) return;

  Guitar::Voice* voice = nullptr;
  int struck = -1;  // where in the kept pass the pick left the string
  int look_first = -1, look_later = -1;
  MeanSquare of_first, of_note;
  of_first.reset(static_cast<int>(lab::kSampleRate / note.value + 0.5f));
  of_note.reset(of_first.length);

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

    if (kept && struck < 0 && waiting && !voice->pending) {  // the pick left the string on this sample
      const String& s = voice->a;
      struck = at;
      // The first look is before anything has come round: the two plucks,
      // comb_offset_ apart, stand either side of a point six tenths along the line.
      look_first = struck + static_cast<int>(0.6f * static_cast<float>(s.whole_) - 0.5f * static_cast<float>(s.comb_offset_));
      const int most = static_cast<int>(static_cast<float>(frames - 2 - look_first) / s.period_);
      const int asked = static_cast<int>(trips.value + 0.5f);
      look_later = look_first + static_cast<int>(s.period_ * static_cast<float>(asked < most ? asked : most) + 0.5f);
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
      sum += x * (one.trim * one.fade);
      if (&one == voice) first_alone = heard_a * (one.trim * one.fade);
    }
    const float device_sum = instrument.idle_.asleep() ? 0.0f : instrument.dc_.x1;
    if (kept) {
      at_pickup[at] = device_sum;
      worked_out[at] = sum;
    }

    pluck.put(i, sounding ? voice->exciter.pick_ : 0.0f);
    string_tap.put(i, sounding ? newest(voice->a) : 0.0f);
    level_one.put(i, level_db(of_first.push(first_alone)));
    level.put(i, level_db(of_note.push(device_sum)));
    pickup_tap.put(i, device_sum);
    out_tap.put(i, instrument.out_left()[0], instrument.out_right()[0]);
  }
  rebuilt.value = lab::difference_db(worked_out, at_pickup, frames);

  if (!voice) return;
  const String& s = voice->a;
  // A loop too short for the looks asked for still shows the line as it ends.
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
  const double w = 2.0 * kPiD * s.hz_ / s.sample_rate_;
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
  }
  tuning_curves();
}
