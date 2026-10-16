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
// from the kit's sine table, or the source, by a choice. A tone is the
// default because a gain's steps are plain on a sound that does nothing else.
//
// Beside the loop the lab measures the filter at rest: one unit sample
// through it (the impulse response, and from that the response to frequency),
// a step through it, a short input that goes up and comes down again with
// the output chasing it sample by sample, and a step through each of the
// kit's two smoothers, Smoother and LinearRamp.
//
// One device is run as well: the Tremolo (cpp/devices/tremolo) splits its
// input with one OnePole per channel. The lab runs it a sample at a time,
// reads that filter's state out of the device as a tap of its own, and holds
// it against a OnePole of the lab's at the same crossover. Asleep, the device
// does not run its filter; the lab's copies wait with it. The device is set as
// the lesson's bench sets it, so that what it does with the two bands can be
// held too: its output against the one band its square wave has turned up.
//
// The build part puts the filter together a piece at a time, on a path of its
// own beside the kit's (lab::Build in lab.h). It has six pieces, each a
// function of `Built` below, in the order the steps add them: a running
// average, which keeps every sample it spans; the same average kept as one
// number, moved part of the way to each new sample; that part worked out from
// a time, as the kit works it out; the high-pass, by subtraction; a fader
// between the two halves, applied as it arrives; and the fader smoothed by
// the first line again. The path writes the "built" taps and leaves every
// other tap as it was. Two copies of it run: one at the step the reader
// chose, which is what the taps show, and one with all six pieces, whose
// output is compared on every render with the same blend made from the kit's
// own OnePole and Smoother (the "builtDifference" check). The first two
// steps and the fifth are the lesson's own: an average the kit does not
// have, a share it does not use, and a fader no device applies unsmoothed.

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
constexpr float kToneLevel = 0.5f;
constexpr int kChase = 33;       // the input that goes up and comes down: this many samples of it
constexpr int kChaseUp = 16;     // of which this many, from the second on, stand at 1
constexpr int kMaxWindow = 1024; // the most samples the build's running average may span
constexpr float kFloatSteps = 16777216.0f;  // steps of a float in one unit, just under 1: 2 to the 24th
constexpr int kTurnOver = 2400;  // 50 ms: what is left out after the Tremolo's square wave turns over

kit::OnePole low_filter[2];
kit::OnePole high_filter[2];
kit::OnePole probe;          // the same filter at rest, for the curves
kit::OnePole split_copy[2];  // the lab's own filters beside the Tremolo's
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
lab::Tap smoothed{"smoothed", "The fader, smoothed", lab::kControl, lab::kKit, 1, ""};
lab::Tap zipper{"zipper", "Under the stepped fader", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Under the smoothed fader", lab::kAudio, lab::kKit, 2};
lab::Tap device_low{"deviceLow", "The low band inside the Tremolo", lab::kAudio, lab::kDevice, 2};
// The last sound declared on the main path is the one the page plays first: the low-pass.
lab::Tap low{"low", "Low-pass", lab::kAudio, lab::kKit, 2};

lab::Tap impulse{"impulse", "One unit sample through the filter", lab::kCurve, lab::kKit, 1, ""};
lab::Tap step{"step", "A step through the filter", lab::kCurve, lab::kKit, 1, ""};
lab::Tap sixty_three{"sixtyThree", "63 % of the way", lab::kCurve, lab::kLesson, 1, ""};
lab::Tap chase{"chase", "The output, sample by sample", lab::kCurve, lab::kKit, 1, ""};
lab::Tap chase_target{"chaseTarget", "The input, sample by sample", lab::kCurve, lab::kLesson, 1, ""};
lab::Tap response{"response", "Low-pass, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap response_high{"responseHigh", "High-pass, measured", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap response_textbook{"responseTextbook", "One pole with no sample rate", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap glide{"glide", "A step through the smoother", lab::kCurve, lab::kKit, 1, ""};
lab::Tap glide_ramp{"glideRamp", "A step through the ramp", lab::kCurve, lab::kKit, 1, ""};

lab::Tap built{"built", "The filter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_low{"builtLow", "The low half, as built", lab::kAudio, lab::kLesson, 2};
lab::Tap built_fader{"builtFader", "The fader, as built", lab::kControl, lab::kLesson, 1, ""};

lab::Check impulse_error{"impulseError", "The filter's impulse response against (1 − a)·aⁿ worked out directly", ""};
lab::Check step_time{"stepTime", "Samples from the time constant to the first sample of the step at 63 %", "samples"};
lab::Check corner{"corner",
                  "Where the response measured through the filter is 3 dB down, or half the sample rate where it is not",
                  "Hz"};
lab::Check split{"split", "The low band inside the Tremolo against the lab's own one-pole", "dB"};
lab::Check trades{"trades",
                  "The Tremolo's output against one band at a time: its low band for half of each cycle, the rest of "
                  "the sound for the other half",
                  "dB"};
lab::Check same_filter{"sameFilter", "The smoother against a one-pole at the cutoff 1/(2π·time), until it lands", ""};
lab::Check landing{"landing", "The smoother stands exactly on its target after", "ms"};
lab::Check stall{"stall", "How far short of a steady 1 that one-pole stops, with nothing to land it", "float steps"};

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

// The filter so far: one function a piece, and run() to take a sample through
// the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kAverage = 0, kOneNumber, kFromTime, kHigh, kFader, kSmooth };

  int pieces = kAverage;
  int window = 1;               // how many samples the running average spans
  int oldest = 0;               // where in `kept` the oldest of them is
  float kept[2][kMaxWindow];    // the running average's memory: every sample it spans
  double sum[2] = {0.0, 0.0};   // and their sum
  float low[2] = {0.0f, 0.0f};  // the one-number average's memory: one number a channel
  float keep = 0.0f;            // the part of that number that is kept each sample
  float gain = 1.0f;            // the smoothed fader: where it has got to
  float fader = 0.0f;           // the fader's value in force on this sample
  float gain_keep = 0.0f;       // the part of the distance to a new fader value that is left each sample
  float lows[2] = {0.0f, 0.0f};
  float out[2] = {0.0f, 0.0f};

  // A running average: the mean of the last `window` samples. To take the
  // oldest sample out of the sum as the newest goes in, it has to have kept
  // every sample in between.
  float average(int c, float x) {
    sum[c] += static_cast<double>(x) - kept[c][oldest];
    kept[c][oldest] = x;
    return static_cast<float>(sum[c] / window);
  }

  // One number of memory: the average so far, moved part of the way to the
  // new sample. `keep` is the part of the distance that is left.
  float follow(int c, float x) {
    low[c] = flush_denormal(x + (low[c] - x) * keep);
    return low[c];
  }

  // How much to keep, from the length of the average it stands in for: the
  // newest sample gets the share 2 / (window + 1), and the rest is kept.
  static float keep_for_window(int window) { return 1.0f - 2.0f / static_cast<float>(window + 1); }

  // How much to keep, from a time. A cutoff of `hz` is a time constant of
  // 1 / (2π · hz) seconds, and e^(−1 / the samples in that time) is kept.
  static float keep_for_cutoff(float hz) {
    return std::exp(-kit::kTwoPi * kit::clamp(hz, 0.0f, lab::kSampleRate * 0.49f) / lab::kSampleRate);
  }

  // The high-pass by subtraction: what is left of a sample when the average
  // is taken away from it.
  static float rest(float x, float average) { return x - average; }

  // A fader between the two halves: the low half alone at 1, the high half
  // alone at 0, and half of the sample itself in the middle.
  static float blend(float lows, float highs, float fader) { return highs + fader * (lows - highs); }

  // Smoothing the fader: follow() again, on the fader's value, and put
  // exactly on that value once the distance left is too small to matter.
  float glide(float asked) {
    const float left = gain - asked;
    const float close = 1.0e-6f * (asked < 0.0f ? -asked : asked) + 1.0e-9f;
    const float moved = asked + left * gain_keep;
    gain = ((left > -close && left < close) || moved == gain) ? asked : moved;
    return gain;
  }

  // One sample through the pieces built so far. `asked` is the fader as it arrives.
  void run(float left, float right, float asked) {
    fader = pieces >= kSmooth ? glide(asked) : asked;
    for (int c = 0; c < 2; ++c) {
      const float x = c == 0 ? left : right;
      lows[c] = pieces >= kOneNumber ? follow(c, x) : average(c, x);
      const float highs = rest(x, lows[c]);
      out[c] = pieces >= kFader ? blend(lows[c], highs, fader) : pieces >= kHigh ? highs : lows[c];
    }
    oldest = (oldest + 1) % window;
  }

  // Where the fader of the built taps stands: nowhere, before there is one.
  float fader_shown() const { return pieces >= kFader ? fader : 0.0f; }

  void start(int pieces_, float first) {
    pieces = pieces_;
    window = kit::clamp_int(static_cast<int>(lab::kSampleRate / (kit::kPi * cutoff.value) + 0.5f), 1, kMaxWindow);
    keep = pieces >= kFromTime ? keep_for_cutoff(cutoff.value) : keep_for_window(window);
    gain_keep = kit::time_to_coeff(smoothing.value * 0.001f, lab::kSampleRate);
    gain = first;
    fader = first;
    oldest = 0;
    for (int c = 0; c < 2; ++c) {
      for (int n = 0; n < kMaxWindow; ++n) kept[c][n] = 0.0f;
      sum[c] = 0.0;
      low[c] = lows[c] = out[c] = 0.0f;
    }
  }
};

lab::Build build{"A running average|One number of memory|The share from a time|The high-pass|A fader between the halves|"
                 "Smooth the fader",
                 Built::kSmooth, -120.0f,
                 "The filter as built, all six pieces, against the same blend made from the kit's own filter and smoother"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the kit

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
  // An input that goes up for sixteen samples and comes down again, and the
  // output on its way after it: each point is one sample.
  if (chase.open(kChase) && chase_target.open(kChase)) {
    chase.x1 = chase_target.x1 = static_cast<float>(kChase - 1);
    probe.reset();
    for (int n = 0; n < kChase; ++n) {
      const float target = n >= 1 && n <= kChaseUp ? 1.0f : 0.0f;
      chase_target.set(n, target);
      chase.set(n, probe.lowpass(target));
    }
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

  // The bare filter, left to itself until it stops moving: how far short it
  // stops, counted in steps of a float just under 1. With no time there is no
  // filter, and nothing is short.
  stall.value = 0.0f;
  if (comparable) {
    float before = -1.0f;
    for (int n = 0; n < kPatience && probe.state != before; ++n) {
      before = probe.state;
      probe.lowpass(1.0f);
    }
    stall.value = (1.0f - probe.state) * kFloatSteps;
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
    for (kit::OnePole& copy : split_copy) {
      copy.set_cutoff(split_device.param(kCrossover), fs);
      copy.reset();
    }
  }
  double split_apart = 0.0, split_whole = 0.0;
  double trades_apart = 0.0, trades_whole = 0.0;
  bool low_turn = true;  // which band the device's square wave has turned up
  int since_turn = 0;    // samples since it last turned over

  const float seconds = smoothing.value * 0.001f;
  smoother.set_time(seconds, fs);
  smoother.snap(fader_at(0));
  const bool on_source = rides.on();

  // The build part: the chosen step, and the whole build that is held to the kit.
  shown.start(build.at(), fader_at(0));
  held.start(build.compared_step, fader_at(0));
  double built_apart = 0.0, built_whole = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const float low_left = low_filter[0].lowpass(left);
    const float low_right = low_filter[1].lowpass(right);
    const float high_left = high_filter[0].highpass(left);
    const float high_right = high_filter[1].highpass(right);

    // The device's own filter, and the lab's beside it, a sample at a time.
    // The device runs its filter only while it is awake.
    const bool awake = left != 0.0f || right != 0.0f || split_device.idle_.quiet_ < split_device.idle_.hold_;
    // The first half of the oscillator's cycle is the low band's turn. Asleep, the oscillator waits.
    const bool turn = split_device.phase_ < 0.5;
    since_turn = turn == low_turn ? since_turn + 1 : 0;
    low_turn = turn;
    split_device.in_left()[0] = left;
    split_device.in_right()[0] = right;
    split_device.process(1);
    if (awake) {
      split_copy[0].lowpass(left);
      split_copy[1].lowpass(right);
    }

    // The fader: as it arrives, and through the smoother.
    const float asked = fader_at(i);
    smoother.set_target(asked);
    const float gain = smoother.next();

    // The build part, beside the kit.
    shown.run(left, right, asked);
    held.run(left, right, asked);

    // The first pass only warms the filters up: a tap keeps nothing of it.
    if (i < lab::frames()) continue;
    for (int c = 0; c < 2; ++c) {
      const double apart = static_cast<double>(split_device.split_[c].state) - split_copy[c].state;
      split_apart += apart * apart;
      split_whole += static_cast<double>(split_copy[c].state) * split_copy[c].state;
    }
    // What the device does with its two bands: with a square shape at full depth it passes one
    // at a time. Its slew rounds each change-over, so the 50 ms after one are left out.
    if (awake && since_turn >= kTurnOver) {
      for (int c = 0; c < 2; ++c) {
        const float x = c == 0 ? left : right;
        const float band = low_turn ? split_device.split_[c].state : x - split_device.split_[c].state;
        const float out = c == 0 ? split_device.out_left()[0] : split_device.out_right()[0];
        const double apart = static_cast<double>(out) - band;
        trades_apart += apart * apart;
        trades_whole += static_cast<double>(band) * band;
      }
    }
    // The same blend from the kit's own filter and smoother: what the whole build is held to.
    const float kit_left = Built::blend(low_left, Built::rest(left, low_left), gain);
    const float kit_right = Built::blend(low_right, Built::rest(right, low_right), gain);
    const double apart_left = static_cast<double>(held.out[0]) - kit_left;
    const double apart_right = static_cast<double>(held.out[1]) - kit_right;
    built_apart += apart_left * apart_left + apart_right * apart_right;
    built_whole += static_cast<double>(kit_left) * kit_left + static_cast<double>(kit_right) * kit_right;

    const float under_left = on_source ? left : tone_at(i);
    const float under_right = on_source ? right : under_left;
    in_tap.put(i, left, right);
    low.put(i, low_left, low_right);
    high.put(i, high_left, high_right);
    device_low.put(i, split_device.split_[0].state, split_device.split_[1].state);
    fader.put(i, asked);
    smoothed.put(i, gain);
    zipper.put(i, under_left * asked, under_right * asked);
    out_tap.put(i, under_left * gain, under_right * gain);
    built.put(i, shown.out[0], shown.out[1]);
    built_low.put(i, shown.lows[0], shown.lows[1]);
    built_fader.put(i, shown.fader_shown());
  }
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  split.value = lab::ratio_db(split_apart, split_whole);
  trades.value = lab::ratio_db(trades_apart, trades_whole);

  measure_filter();
  measure_smoothers();
}
