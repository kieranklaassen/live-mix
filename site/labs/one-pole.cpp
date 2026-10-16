// The one-pole filter and smoothing: the kit's OnePole
// (cpp/kit/filters.h) and its two smoothers (cpp/kit/smooth.h), each run by
// itself so that everything it does can be read sample by sample.
//
//   the filter on a sound      in ──┬─► OnePole::lowpass ──► low
//                                   └─► OnePole::highpass ─► high   (in − low)
//
//   the filter on a control    fader ─┬─────────────────► × ──► zipper
//                                     └─► Smoother ──────► × ──► out
//
// The fader is a hand pulling a gain from full down to nothing in a second
// and pushing it back up in the next, as a host delivers it: a new value so
// many times a second, held in between. What it rides is a steady 220 Hz tone
// from the kit's sine table, or the source, by a switch. A tone is the
// default because a gain's steps are plain on a sound that does nothing else.
//
// Beside the loop the lab measures the filter at rest: one unit sample
// through it (the impulse response, and from that the response to frequency),
// a step through it, and a step through each of the kit's two smoothers,
// Smoother and LinearRamp.
//
// One device is run as well, for a check: the Tremolo (cpp/devices/tremolo)
// splits its input with one OnePole per channel. The lab reads that filter's
// state out of the device and holds it against a OnePole of its own at the
// same crossover, where each block of 16 samples ends. Asleep, the device
// does not run its filter; the lab's copy waits with it.

#include "lab.h"

#include "../../cpp/devices/tremolo/tremolo.h"

using namespace livemix;

namespace {

constexpr int kWindow = 96;      // 2 ms: an impulse and a step, sample by sample
constexpr int kGlide = 1440;     // 30 ms: a smoothed step, sample by sample
constexpr int kLongest = 8192;   // the most of an impulse response the curves are worked out from
constexpr int kPatience = 480000;  // ten seconds: how long a thing is waited for
constexpr float kSixtyThree = 0.63212056f;  // 1 − 1/e
constexpr int kBottom = 24000;   // the sample at which the fader reaches nothing: half a second in
constexpr int kToneHz = 220;
constexpr int kBlock = 16;       // the Tremolo is run in blocks of this many samples
constexpr float kToneLevel = 0.5f;

kit::OnePole low_filter[2];
kit::OnePole high_filter[2];
kit::OnePole probe;       // the same filter at rest, for the curves
kit::OnePole split_copy;  // the lab's own filter beside the Tremolo's
kit::Smoother smoother;
kit::LinearRamp ramp;
Tremolo split_device;
float response_[kLongest];

lab::Control cutoff{"cutoff", "Cutoff", "Hz", 20.0f, 20000.0f, 500.0f, lab::kLog};
lab::Control updates{"updates", "Fader values", "a second", 2.0f, 200.0f, 10.0f, lab::kLog};
lab::Control smoothing{"smoothing", "Smoothing", "ms", 0.0f, 20.0f, 5.0f};
lab::Control rides{"rides", "The fader rides", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "A tone|The source"};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap high{"high", "High-pass", lab::kAudio, lab::kKit, 2};
lab::Tap fader{"fader", "The fader, as it arrives", lab::kControl, lab::kLesson, 1, ""};
lab::Tap smoothed{"smoothed", "Smoothed", lab::kControl, lab::kKit, 1, ""};
lab::Tap zipper{"zipper", "Under the stepped fader", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Under the smoothed fader", lab::kAudio, lab::kKit, 2};
// The last sound declared is the one the page plays first: the low-pass.
lab::Tap low{"low", "Low-pass", lab::kAudio, lab::kKit, 2};

lab::Tap impulse{"impulse", "One unit sample through the filter", lab::kCurve, lab::kKit, 1, ""};
lab::Tap step{"step", "A step through the filter", lab::kCurve, lab::kKit, 1, ""};
lab::Tap sixty_three{"sixtyThree", "63 % of the way", lab::kCurve, lab::kLesson, 1, ""};
lab::Tap response{"response", "Low-pass, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap response_high{"responseHigh", "High-pass, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap response_textbook{"responseTextbook", "One pole with no sample rate", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap glide{"glide", "A step through the smoother", lab::kCurve, lab::kKit, 1, ""};
lab::Tap glide_ramp{"glideRamp", "A step through the ramp", lab::kCurve, lab::kKit, 1, ""};

lab::Check impulse_error{"impulseError", "The filter's impulse response against (1 − a)·aⁿ worked out directly", ""};
lab::Check step_time{"stepTime", "Samples from the time constant to the first sample of the step at 63 %", "samples"};
lab::Check corner{"corner", "Where the response measured through the filter is 3 dB down", "Hz"};
lab::Check split{"split", "The low band inside the Tremolo against the lab's own one-pole", "dB"};
lab::Check same_filter{"sameFilter", "The smoother against a one-pole at the cutoff 1/(2π·time), until it lands", ""};
lab::Check landing{"landing", "The smoother stands exactly on its target after", "ms"};
lab::Check stall{"stall", "How far short of a steady 1 that one-pole stops, with nothing to land it", ""};

// The fader at sample `i` of the loop, 0 to 1: the place of a triangle, two
// seconds a cycle, at the last moment a value was sent. The moments are
// counted from the bottom, so one always falls there.
float fader_at(int i) {
  const double since = static_cast<double>(i % lab::frames() - kBottom) / lab::kSampleRate;
  const double rate = updates.value;
  double held = std::floor(since * rate) / rate;
  held -= 2.0 * std::floor(held * 0.5);  // into one cycle, 0 to 2
  return static_cast<float>(held < 1.0 ? held : 2.0 - held);
}

// The tone the fader rides: a cosine from the kit's table, at its peak when
// the fader reaches the bottom, so the last step down cuts it where it is
// furthest from zero.
float tone_at(int i) {
  const int turns = (i % lab::frames()) * kToneHz % static_cast<int>(lab::kSampleRate);
  return kToneLevel * kit::SineTable::lookup(static_cast<float>(turns) / lab::kSampleRate + 0.25f);
}

// The filter at rest: an impulse, a step, and the response to frequency.
void measure_filter() {
  const float fs = lab::kSampleRate;
  probe.set_cutoff(cutoff.value, fs);
  const double a = probe.a;
  const float last_ms = static_cast<float>(kWindow - 1) * 1000.0f / fs;

  // One unit sample in. What comes out is the weight the filter gives a
  // sample that is n samples old.
  if (impulse.open(kWindow)) {
    impulse.x1 = last_ms;
    probe.reset();
    double worst = 0.0;
    for (int n = 0; n < kWindow; ++n) {
      const float y = probe.lowpass(n == 0 ? 1.0f : 0.0f);
      impulse.set(n, y);
      const double written = (1.0 - a) * std::pow(a, n);
      const double error = std::fabs(static_cast<double>(y) - written);
      if (error > worst) worst = error;
    }
    impulse_error.value = static_cast<float>(worst);
  }

  // A step in: point p is the output once p samples of the step have gone in.
  if (step.open(kWindow)) {
    step.x1 = last_ms;
    probe.reset();
    for (int p = 1; p < kWindow; ++p) step.set(p, probe.lowpass(1.0f));
  }
  if (sixty_three.open(2)) {
    sixty_three.x1 = static_cast<float>(kGlide - 1) * 1000.0f / fs;
    sixty_three.set(0, kSixtyThree);
    sixty_three.set(1, kSixtyThree);
  }
  // How many samples of the step it takes to stand at 63 %, against the time
  // constant 1/(2π·cutoff) in samples.
  probe.reset();
  int taken = 1;
  while (taken < kPatience && probe.lowpass(1.0f) < kSixtyThree) ++taken;
  // The cutoff the filter was really given: set_cutoff stops at 0.49 of the rate.
  const double set_hz = kit::clamp(cutoff.value, 0.0f, fs * 0.49f);
  step_time.value = static_cast<float>(taken - fs / (2.0 * lab::kPi * set_hz));

  // The response to frequency, from the impulse response: sixteen time
  // constants of it, by when it has fallen 139 dB.
  int count = static_cast<int>(16.0 * fs / (2.0 * lab::kPi * set_hz)) + 16;
  count = kit::clamp_int(count, 256, kLongest);
  probe.reset();
  for (int n = 0; n < count; ++n) response_[n] = probe.lowpass(n == 0 ? 1.0f : 0.0f);
  lab::response_tap(response, response_, count);

  // Where that response is 3 dB down, found by halving. It only ever falls as
  // the frequency rises; when it has not fallen 3 dB by half the sample rate,
  // half the sample rate is the answer.
  double below = 1.0, above = 0.5 * fs;
  if (lab::fourier_at(response_, count, above).power() < 0.5) {
    for (int k = 0; k < 40; ++k) {
      const double middle = std::sqrt(below * above);
      if (lab::fourier_at(response_, count, middle).power() > 0.5) {
        below = middle;
      } else {
        above = middle;
      }
    }
  }
  corner.value = static_cast<float>(above);

  // The same pole as a textbook draws it, with no sample rate to bend it:
  // 1/√(1 + (f/fc)²).
  constexpr int kPoints = 241;
  if (response_textbook.open(kPoints)) {
    response_textbook.x0 = 20.0f;
    response_textbook.x1 = 20000.0f;
    response_textbook.scale = lab::kLog;
    for (int p = 0; p < kPoints; ++p) {
      const double hz = 20.0 * std::pow(1000.0, static_cast<double>(p) / (kPoints - 1));
      const double ratio = hz / cutoff.value;
      response_textbook.set(p, static_cast<float>(-10.0 * std::log10(1.0 + ratio * ratio)));
    }
  }

  probe.reset();
  for (int n = 0; n < count; ++n) response_[n] = probe.highpass(n == 0 ? 1.0f : 0.0f);
  lab::response_tap(response_high, response_, count);
}

// A step from 0 to 1 through each smoother. Point p is the value once next()
// has been called p times.
void measure_smoothers() {
  const float fs = lab::kSampleRate;
  const float seconds = smoothing.value * 0.001f;
  const float last_ms = static_cast<float>(kGlide - 1) * 1000.0f / fs;

  smoother.set_time(seconds, fs);
  smoother.snap(0.0f);
  smoother.set_target(1.0f);
  ramp.set_time(seconds, fs);
  ramp.snap(0.0f);
  ramp.set_target(1.0f);
  // The bare filter with the same pole. A time of zero is no pole at all,
  // which a cutoff cannot ask for, so there is nothing to compare.
  const bool comparable = seconds > 0.0f;
  if (comparable) probe.set_cutoff(1.0f / (kit::kTwoPi * seconds), fs);
  probe.reset();

  const bool room = glide.open(kGlide) && glide_ramp.open(kGlide);
  if (room) glide.x1 = glide_ramp.x1 = last_ms;
  double worst = 0.0;
  int calls = 0;
  while (calls < kPatience && !smoother.settled()) {
    const float value = smoother.next();
    ++calls;
    if (room && calls < kGlide) {
      glide.set(calls, value);
      glide_ramp.set(calls, ramp.next());
    }
    if (comparable && !smoother.settled()) {
      const double distance = std::fabs(static_cast<double>(value) - probe.lowpass(1.0f));
      if (distance > worst) worst = distance;
    }
  }
  for (int p = calls + 1; room && p < kGlide; ++p) {
    glide.set(p, smoother.next());
    glide_ramp.set(p, ramp.next());
  }
  same_filter.value = static_cast<float>(worst);
  landing.value = static_cast<float>(calls) * 1000.0f / fs;

  // The bare filter, left to itself until it stops moving.
  if (comparable) {
    float before = -1.0f;
    for (int n = 0; n < kPatience && probe.state != before; ++n) {
      before = probe.state;
      probe.lowpass(1.0f);
    }
    stall.value = 1.0f - probe.state;
  }
}

}  // namespace

void lab_setup() { kit::SineTable::init(); }

void lab_render(int frames) {
  (void)frames;
  const float fs = lab::kSampleRate;
  for (int c = 0; c < 2; ++c) {
    low_filter[c].set_cutoff(cutoff.value, fs);
    low_filter[c].reset();
    high_filter[c].set_cutoff(cutoff.value, fs);
    high_filter[c].reset();
  }

  // The Tremolo as the lesson's bench has it: Harmonic, a square, full depth.
  // Its crossover is the cutoff, as far as its range of 100 Hz to 4 kHz goes.
  {
    using namespace tremolo;
    split_device.init(fs);
    split_device.set_param(kMode, 2.0f);
    split_device.set_param(kRate, 0.5f);
    split_device.set_param(kDepth, 1.0f);
    split_device.set_param(kShape, 2.0f);
    split_device.set_param(kCrossover, cutoff.value);
    split_device.set_param(kDrift, 0.0f);
    split_device.set_param(kSmooth, 0.0f);
    split_copy.set_cutoff(split_device.param(kCrossover), fs);
    split_copy.reset();
  }
  double split_apart = 0.0, split_whole = 0.0;
  float block_left[kBlock] = {};
  bool heard = false;

  const float seconds = smoothing.value * 0.001f;
  smoother.set_time(seconds, fs);
  smoother.snap(fader_at(0));
  const bool on_source = rides.on();

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const float low_left = low_filter[0].lowpass(left);
    const float low_right = low_filter[1].lowpass(right);
    const float high_left = high_filter[0].highpass(left);
    const float high_right = high_filter[1].highpass(right);

    // The device's own filter, and the lab's beside it: a block at a time,
    // the two compared where each block ends.
    const int at = i % kBlock;
    block_left[at] = left;
    split_device.in_left()[at] = left;
    split_device.in_right()[at] = right;
    heard = heard || left != 0.0f || right != 0.0f;
    if (at == kBlock - 1) {
      const bool awake = heard || split_device.idle_.quiet_ < split_device.idle_.hold_;
      split_device.process(kBlock);
      for (int j = 0; awake && j < kBlock; ++j) split_copy.lowpass(block_left[j]);
      heard = false;
      if (i >= lab::frames()) {
        const double apart = static_cast<double>(split_device.split_[0].state) - split_copy.state;
        split_apart += apart * apart;
        split_whole += static_cast<double>(split_copy.state) * split_copy.state;
      }
    }

    // The fader: as it arrives, and through the smoother.
    const float asked = fader_at(i);
    smoother.set_target(asked);
    const float gain = smoother.next();

    // The first pass only warms the filters up: a tap keeps nothing of it.
    if (i < lab::frames()) continue;
    const float under_left = on_source ? left : tone_at(i);
    const float under_right = on_source ? right : under_left;
    in_tap.put(i, left, right);
    low.put(i, low_left, low_right);
    high.put(i, high_left, high_right);
    fader.put(i, asked);
    smoothed.put(i, gain);
    zipper.put(i, under_left * asked, under_right * asked);
    out_tap.put(i, under_left * gain, under_right * gain);
  }
  split.value = lab::ratio_db(split_apart, split_whole);

  measure_filter();
  measure_smoothers();
}
