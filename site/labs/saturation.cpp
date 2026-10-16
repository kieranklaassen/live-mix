// Saturation and oversampling: the Saturator (cpp/devices/saturator)
// run one sample at a time, twice over: once as the reader set it, and once
// beside it with the same curve at the base rate, so the two can be compared.
//
//   in ─┬─► × drive ─► up ─► curve(u + bias) − curve(bias) ─► DC block ─► down ─► tone ─► × output ─┐
//       │              (1x, 2x or 4x; or the antiderivative's mean)                                 ├─► out
//       └─► delay 39 ───────────────────────────────────────────────────────────── dry ─► mix ──────┘
//
// Read from the devices: what the curve stage put out (the device's tone tilt
// keeps its last input, which is exactly that), what the tilt made of it (its
// last output) and the output. The driven signal is a local of the device, so
// the lab multiplies the input by the device's own gain ("lesson").
//
// Every tap is shown with the device's 39 samples of latency taken off again,
// as a host does with the latency a device reports, so in and out line up.
//
// The Saturator keeps nothing longer than its 10 Hz DC follower (16 ms) and
// its 50 ms of patience before sleeping, so the pass that is thrown away runs
// for its last fifth of a second only: by then every state is where a full
// pass would have left it.
//
// Three taps are meters of the lesson's own: how loud the sound went in and
// how loud it came out (the mean of the two channels' squares through two
// 30 ms one-poles, in dB), and where the middle of the curve's output lies
// (the mean of the two channels through the same two poles).
//
// Beside the loop, a third device measures: the transfer curve (a level held
// at each height), a probe tone whose folded partials are counted exactly, a
// click for the latency and the small-signal response, and a rising sine for
// the picture of everything at once, at the base rate and as set.
//
// The build part puts a saturator together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h). It has seven pieces, each
// a function of `Built` below, in the order the steps add them: a curve;
// drive, with the output gain that takes its loudness back; bias; oversampling;
// the mean of the curve; the DC block; tone and mix. The path writes the
// "built" taps and leaves every other tap as it was. With all seven the build
// does to a sample what the device does, in the same order, so the two are
// the same sample for sample, and the lab compares them on every render (the
// "builtDifference" check). A step before the last is the lesson's own: a
// saturator with a piece missing, which the device never is. The same struct,
// held at the base rate, is the lab's proof that it reads the device rightly:
// its curve stage against the device's at 1x (the "rebuilt" check), and its
// mean of the curve against the device's on the probe tone ("adaaRebuilt").
// One thing the build does not rebuild: when the device sleeps after a
// silence, the build is told, and forgets what the device forgets.

#include "lab.h"

#include <type_traits>

#include "../../cpp/devices/saturator/saturator.h"

using namespace livemix;

namespace {

using Channel = Saturator::Lane::Channel;
using TapeCut = decltype(Channel::tape);
using InnerHalfband = decltype(Channel::inner);
using Tilt = std::remove_extent<decltype(Saturator::tilt_)>::type;

constexpr int kLatency = Saturator::kLatency;
constexpr int kRunIn = 9600;        // a fifth of a second before the pass that is kept
constexpr int kCycle = 4800;        // a tone at a multiple of 10 Hz repeats within this many samples
constexpr int kToneSettle = 1200;
constexpr int kToneCount = kCycle;
constexpr float kToneLevel = 0.5f;  // the probe tone and the rising sine: 6 dB under full scale
constexpr float kSmall = 0.01f;     // what the click reaches at the curve: small enough to be straight
constexpr int kClickLength = 192;
constexpr float kMeterSeconds = 0.03f;

Saturator sat;    // as the reader set it
Saturator base;   // the same curve, drive and bias at 1x, no antiderivative
Saturator probe;  // for everything measured beside the loop
kit::Halfband2x outer_filter;
InnerHalfband inner_filter;
double wave_[kCycle];  // one cycle of a sine

lab::Control which_curve{"curve", "Curve", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "Soft|Hard|Tube|Tape|Fold"};
lab::Control drive{"driveDb", "Drive", "dB", 0.0f, 36.0f, 18.0f};
lab::Control bias{"bias", "Bias", "", -1.0f, 1.0f, 0.0f};
lab::Control tone{"toneDb", "Tone", "dB", -12.0f, 12.0f, 0.0f};
lab::Control output{"outputDb", "Output", "dB", -24.0f, 24.0f, -9.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control dc_block{"dcBlock", "DC Block", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Off|On"};
lab::Control oversample{"oversample", "Oversampling", "", 0.0f, 2.0f, 2.0f, lab::kLinear, "1x|2x|4x"};
lab::Control adaa{"adaa", "ADAA", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Off|On"};
lab::Control probe_hz{"probe", "Probe tone", "Hz", 1000.0f, 10000.0f, 5000.0f, lab::kLog};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap driven{"driven", "After Drive", lab::kAudio, lab::kLesson, 2};
lab::Tap shaped_1x{"shaped1x", "After the curve at 1x", lab::kAudio, lab::kDevice, 2};
lab::Tap shaped{"shaped", "After the curve as set", lab::kAudio, lab::kDevice, 2};
lab::Tap folded_sound{"foldedSound", "What 1x has that the setting has not", lab::kAudio, lab::kLesson, 2};
lab::Tap toned{"toned", "After Tone", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap reach{"reach", "How far the input reaches", lab::kControl, lab::kLesson, 1};
lab::Tap meter_in{"meterIn", "Level going in", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap meter_out{"meterOut", "Level coming out", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap offset{"offset", "The middle of the curve's output", lab::kControl, lab::kLesson, 1};

lab::Tap transfer{"transfer", "Sample out against sample in", lab::kCurve, lab::kDevice, 1};
lab::Tap soft{"soft", "Soft", lab::kCurve, lab::kDevice, 1};
lab::Tap hard{"hard", "Hard", lab::kCurve, lab::kDevice, 1};
lab::Tap tube{"tube", "Tube", lab::kCurve, lab::kDevice, 1};
lab::Tap tape{"tape", "Tape", lab::kCurve, lab::kDevice, 1};
lab::Tap fold{"fold", "Fold", lab::kCurve, lab::kDevice, 1};

lab::Tap tone_1x{"tone1x", "The probe tone at 1x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap folded_1x{"folded1x", "What folded back at 1x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap tone_set{"toneSet", "The probe tone as set", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap folded_set{"foldedSet", "What folded back as set", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap outer_response{"outerResponse", "The 63-tap half-band, at 96 kHz", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap inner_response{"innerResponse", "The 31-tap half-band, at 192 kHz", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_plain{"smallPlain", "A quiet signal through the curve", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_adaa_1x{"smallAdaa1x", "Through the mean of the curve at 1x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_adaa_2x{"smallAdaa2x", "Through the mean of the curve at 2x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_adaa_4x{"smallAdaa4x", "Through the mean of the curve at 4x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap tone_response{"toneResponse", "What Tone does to each frequency", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap arrival{"arrival", "A click through the device", lab::kCurve, lab::kDevice, 1};
lab::Tap rising_1x{"rising1x", "A rising sine through the device at 1x", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap rising{"rising", "A rising sine through the device as set", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The 1x path worked out by hand, against the device at 1x", "dB"};
lab::Check adaa_rebuilt{"adaaRebuilt", "The mean of the curve worked out by hand, against the device", "dB"};
lab::Check alias_1x{"alias1x", "Folded back below 20 kHz at 1x", "dB"};
lab::Check alias_set{"aliasSet", "Folded back below 20 kHz as set", "dB"};
lab::Check alias_drop{"aliasDrop", "How far the setting brought that down", "dB"};
lab::Check latency{"latency", "The click arrives on sample", ""};

lab::Tap built{"built", "The saturator so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_curve{"builtCurve", "Sample out against sample in, as built", lab::kCurve, lab::kLesson, 1};
lab::Tap built_offset{"builtOffset", "The middle of the built sound", lab::kControl, lab::kLesson, 1};
lab::Tap built_tone{"builtTone", "The probe tone through the build", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap built_folded{"builtFolded", "What folded back in the build", lab::kSpectrum, lab::kLesson, 1, "dB"};

lab::Check built_alias{"builtAlias", "Folded back below 20 kHz in the build so far", "dB"};

// The antiderivatives of the two curves that have one written down: a
// function whose slope at v is the curve at v.
double antiderivative(int shape, double v) {
  const double a = v < 0.0 ? -v : v;
  if (shape == 0) return a + std::log1p(std::exp(-2.0 * a)) - 0.6931471805599453;  // ln cosh v, for Soft
  return a <= 1.0 ? 0.5 * v * v : a - 0.5;                                         // for Hard
}

// The saturator so far, for one channel: one function a piece, and run() to
// take a sample through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kCurve = 0, kDrive, kBias, kOversample, kMean, kDcBlock, kBlend };

  // What the pieces are set to. One that is not there yet does nothing.
  int shape = 0;          // the curve, by its place on the Curve control
  float gain = 1.0f;      // Drive, as a number to multiply by
  float trim = 1.0f;      // Output, as a number to multiply by
  float lean = 0.0f;      // Bias
  float rest_at = 0.0f;   // what the curve makes of the bias alone
  int factor = 0;         // the curve runs at 1x, 2x or 4x: 0, 1, 2
  bool mean = false;      // the mean of the curve stands in for its value
  bool dc_piece = false;  // the DC block is built
  bool block = false;     // and is on
  bool blend = false;     // Tone and Mix are built
  float wet = 1.0f;       // Mix
  double follow = 0.0;    // how fast the DC block follows

  // What is remembered from one sample to the next.
  kit::DelayLine<64> past;  // the last samples that came in
  kit::Halfband2x outer;    // from 48 kHz to 96 kHz and back
  InnerHalfband inner;      // from 96 kHz to 192 kHz and back
  float kept = 0.0f;        // one sample at 96 kHz, waiting for its pair
  double last = 0.0;        // the mean of the curve: the last sample,
  double last_area = 0.0;   // and the antiderivative there
  double middle = 0.0;      // the DC block: the mean of what has left
  TapeCut tape_cut;
  Tilt tilt;
  bool rested = false;
  float stage = 0.0f;  // out of the curve stage
  float out = 0.0f;    // out of the whole

  // A curve: one sample in, one sample out, and nothing remembered. These
  // are the device's own five, picked by Curve.
  float curve(float v) const { return Saturator::curve_value(shape, v); }

  // Drive: gain before the curve. The curve stays where it is, and the
  // sample lands further along it.
  float pushed(float x) const { return gain * x; }

  // Output: gain after the curve, to take back the loudness Drive gave.
  float trimmed(float y) const { return trim * y; }

  // Bias: the sample is moved off centre before the curve, so the two halves
  // of a wave are bent differently. What the curve makes of the bias alone
  // is taken off again, so that silence in is still silence out.
  float off_centre(float u) const { return curve(u + lean) - rest_at; }

  // The mean of the curve: in place of the curve's value at this sample, its
  // mean along the straight line from the last sample to this one. With F
  // the antiderivative, that mean is a difference of F over a difference of
  // v. Where the two samples are nearly the same it is the curve half way.
  float mean_of_curve(float v) {
    const double now = v;
    const double area = antiderivative(shape, now);
    const double delta = now - last;
    const double y = std::abs(delta) > 1.0e-4 ? (area - last_area) / delta
                                              : static_cast<double>(curve(static_cast<float>(0.5 * (now + last))));
    last = now;
    last_area = area;
    return static_cast<float>(y);
  }

  // The DC block: a slow low-pass follows the mean of what leaves, and that
  // mean is taken off. What leaves is held inside full scale first, so the
  // follower and the ceiling agree on where the middle is. With DC Block off
  // the ceiling stands where the bias left it.
  float centred(float y) {
    if (!block) return kit::clamp(y, -1.0f - rest_at, 1.0f - rest_at);
    double leaving = static_cast<double>(y) - middle;
    if (leaving > 1.0) leaving = 1.0;
    else if (leaving < -1.0) leaving = -1.0;
    middle += follow * leaving;
    if (middle > -1.0e-30 && middle < 1.0e-30) middle = 0.0;
    return kit::clamp(y - static_cast<float>(middle), -1.0f, 1.0f);
  }

  // The curve stage on one sample, at whatever rate it is run at.
  float shaped(float u) {
    const float y = mean ? mean_of_curve(u + lean) - rest_at : off_centre(u);
    return dc_piece ? centred(y) : y;
  }

  // Oversampling, twice the rate: one sample goes up as two, the sample half
  // way to the next and the sample itself. Each goes through the curve, and
  // the half-band filter brings the two back down as one.
  float twice(float u) {
    float a, b;
    outer.up(u, &a, &b);
    a = shaped(a);
    b = shaped(b);
    return outer.down(a, b);
  }

  // Four times the rate: a second, shorter filter inside the first. Its trip
  // up and down takes 15 samples at 96 kHz; `kept` holds one more, which
  // makes that a whole number of samples at 48 kHz.
  float four_times(float u) {
    float a, b;
    outer.up(u, &a, &b);
    const float pair[2] = {kept, a};
    kept = b;
    float back[2];
    for (int k = 0; k < 2; ++k) {
      float p, q;
      inner.up(pair[k], &p, &q);
      p = shaped(p);
      q = shaped(q);
      back[k] = inner.down(p, q);
    }
    return outer.down(back[0], back[1]);
  }

  // Tone and Mix: a tilt about 1 kHz on the bent sound, and a blend of that
  // with the sound as it went in, held back by the same 39 samples.
  float blended(float y, float dry) { return dry + (trimmed(tilt.process(y)) - dry) * wet; }

  // One sample through the pieces built so far. Every path takes 39 samples,
  // the length of the 4x one: the 2x path is fed 8 samples late and the 1x
  // path 39, so that changing the rate never moves the sound.
  void run(float x) {
    rested = false;
    const float delayed = past.read(kLatency);
    const float early = past.read(kLatency - kit::Halfband2x::kLatency);
    past.write(x);
    float y = factor == 0 ? shaped(pushed(delayed)) : factor == 1 ? twice(pushed(early)) : four_times(pushed(x));
    // Tape is a curve and a high cut that closes as Drive rises.
    if (shape == Saturator::kTape) y = tape_cut.process(y);
    stage = y;
    out = blend ? blended(y, delayed) : trimmed(y);
  }

  // The curve as the build has it so far, with nothing that remembers: what
  // comes out for a level held at x.
  float held_at(float x) const { return trimmed(off_centre(pushed(x))); }

  // The curve at `rate` (0, 1, 2 for 1x, 2x, 4x), and the DC block's low-pass
  // at 10 Hz of that rate.
  void run_at(int rate) {
    factor = rate;
    follow = 1.0 - std::exp(-6.283185307179586 * static_cast<double>(10.0f) /
                            (static_cast<double>(lab::kSampleRate) * static_cast<double>(1 << factor)));
  }

  // The pieces up to `pieces`, set as the controls stand.
  void start(int pieces) {
    const float drive_db = pieces >= kDrive ? drive.value : 0.0f;
    shape = which_curve.choice();
    gain = kit::db_to_gain(drive_db);
    trim = pieces >= kDrive ? kit::db_to_gain(output.value) : 1.0f;
    lean = pieces >= kBias ? bias.value : 0.0f;
    rest_at = curve(lean);
    run_at(pieces >= kOversample ? oversample.choice() : 0);
    // The two curves with an antiderivative written down are the first two.
    mean = pieces >= kMean && adaa.on() && shape <= 1;
    dc_piece = pieces >= kDcBlock;
    block = dc_piece && dc_block.on();
    blend = pieces >= kBlend;
    wet = mix.value;
    tape_cut.setCutoff(Saturator::kTapeCutoffMaxHz * std::pow(Saturator::kTapeCutoffMinHz / Saturator::kTapeCutoffMaxHz,
                                                              drive_db / Saturator::kMaxDriveDb),
                       lab::kSampleRate);
    tilt.set(tone.value, Saturator::kTonePivotHz, lab::kSampleRate);
    tilt.reset();
    past.clear();
    outer.init();
    inner.init(Saturator::kInnerBeta);
    rested = false;
    rest();
    stage = 0.0f;
    out = 0.0f;
  }

  // Nothing is sounding: forget what the device forgets when it sleeps. The
  // mean of the curve starts again resting on the bias.
  void rest() {
    if (rested) return;
    rested = true;
    outer.reset();
    inner.reset();
    kept = 0.0f;
    last = lean;
    last_area = antiderivative(shape, lean);
    middle = 0.0;
    tape_cut.reset();
  }
};

lab::Build build{"A curve|Gain before and after|A lean to one side|A higher rate|The mean of the curve|The DC block|A tilt and a blend",
                 Built::kBlend, -120.0f,
                 "The saturator as built, all seven pieces, against the device's own output"};

Built shown[2];  // at the step the reader chose: what the built taps hold
Built held[2];   // with every piece: what is compared with the device
Built plain[2];  // with every piece at the base rate, against the device at 1x
Built toward;    // for the probe tone through the build

// The lesson's meter: how loud a sound is, as the mean of the two channels'
// squares through two 30 ms one-poles. It never reads under -80 dB.
struct Meter {
  kit::OnePole pole[2];

  void start() {
    for (kit::OnePole& stage : pole) {
      stage.set_cutoff(1.0f / (kit::kTwoPi * kMeterSeconds), lab::kSampleRate);
      stage.reset();
    }
  }
  float smooth(float x) { return pole[1].lowpass(pole[0].lowpass(x)); }
  float level(float left, float right) {
    const float power = smooth(0.5f * (left * left + right * right));
    return power > 1.0e-8f ? 10.0f * std::log10(power) : -80.0f;
  }
  // Where the middle of a sound lies: its own mean, not the mean of its squares.
  float middle(float left, float right) { return smooth(0.5f * (left + right)); }
};

Meter going_in;
Meter coming_out;
Meter curve_middle;
Meter built_middle;

void configure(Saturator& device, int factor, bool antiderivative_on, bool blocker, float bias_value, float drive_db,
               float tone_db, float output_db, float mix_value) {
  using namespace saturator;
  device.init(lab::kSampleRate);
  device.set_param(kCurve, which_curve.value);
  device.set_param(kDriveDb, drive_db);
  device.set_param(kBias, bias_value);
  device.set_param(kToneDb, tone_db);
  device.set_param(kOutputDb, output_db);
  device.set_param(kMix, mix_value);
  device.set_param(kDcBlock, blocker ? 1.0f : 0.0f);
  device.set_param(kOversample, static_cast<float>(factor));
  device.set_param(kAdaa, antiderivative_on ? 1.0f : 0.0f);
}

// One sample into a device. True when the device worked on it: asleep, with
// silence coming in, it puts out silence and does nothing else.
bool feed(Saturator& device, float left, float right) {
  const bool slept = device.idle_.asleep();
  device.in_left()[0] = left;
  device.in_right()[0] = right;
  device.process(1);
  return !slept || !device.idle_.asleep();
}

// What the curve stage of a device just put out, after the down-sampler and
// before the tone tilt, Output and Mix. The tilt keeps its last input.
float after_curve(const Saturator& device, int c) { return device.idle_.asleep() ? 0.0f : device.tilt_[c].x1; }
// And what the tilt made of it: its last output.
float after_tone(const Saturator& device, int c) { return device.idle_.asleep() ? 0.0f : device.tilt_[c].y1; }

int tone_steps() {
  // The tone stands on a multiple of 10 Hz, which is what the control shows.
  const int steps = static_cast<int>(probe_hz.value / 10.0f + 0.5f);
  return steps < 100 ? 100 : (steps > 1000 ? 1000 : steps);
}

// The static curve at these settings, measured: a level held at each height
// through a device at 1x until what comes out has stopped moving.
void measure_transfer() {
  constexpr int kPoints = 257;
  constexpr int kHold = 64;
  if (!transfer.open(kPoints)) return;
  transfer.x0 = -1.0f;
  transfer.x1 = 1.0f;
  configure(probe, 0, false, false, bias.value, drive.value, 0.0f, 0.0f, 1.0f);
  for (int p = 0; p < kPoints; ++p) {
    const float x = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kPoints - 1);
    for (int n = 0; n < kHold; ++n) feed(probe, x, x);
    transfer.set(p, after_curve(probe, 0));
  }
}

// The same picture of the build so far: what its pieces that remember
// nothing make of a level held at each height.
void draw_built_curve() {
  constexpr int kPoints = 257;
  if (!built_curve.open(kPoints)) return;
  built_curve.x0 = -1.0f;
  built_curve.x1 = 1.0f;
  for (int p = 0; p < kPoints; ++p) {
    const float x = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kPoints - 1);
    built_curve.set(p, shown[0].held_at(x));
  }
}

// The five curves as the device computes them, over four times full scale.
void draw_shapes() {
  constexpr int kPoints = 321;
  lab::Tap* taps[] = {&soft, &hard, &tube, &tape, &fold};
  for (int k = 0; k < 5; ++k) {
    if (!taps[k]->open(kPoints)) return;
    taps[k]->x0 = -4.0f;
    taps[k]->x1 = 4.0f;
    for (int p = 0; p < kPoints; ++p) {
      const float u = -4.0f + 8.0f * static_cast<float>(p) / static_cast<float>(kPoints - 1);
      taps[k]->set(p, Saturator::curve_value(k, u));
    }
  }
}

// The two half-band filters, each from what it makes of one unit sample on
// the way up. `up` puts out twice the filter's taps (the gain that makes up
// for the zeros between samples), so half of that is the filter itself.
// response_tap counts in hertz at 48 kHz; these run at 96 and at 192 kHz, so
// the same points stand at twice and at four times the frequency. The points
// are close enough to stand on the top of the narrowest ripple of a stop band.
void measure_filters() {
  constexpr int kPoints = 2881;
  float* h = lab::take(128);
  float* g = lab::take(64);
  if (!h || !g) return;
  outer_filter.init();
  for (int n = 0; n < 64; ++n) {
    float first, second;
    outer_filter.up(n == 0 ? 1.0f : 0.0f, &first, &second);
    h[2 * n] = 0.5f * first;
    h[2 * n + 1] = 0.5f * second;
  }
  lab::response_tap(outer_response, h, 128, kPoints, 500.0f, 24000.0f);
  outer_response.x0 = 1000.0f;
  outer_response.x1 = 48000.0f;
  inner_filter.init(Saturator::kInnerBeta);
  for (int n = 0; n < 32; ++n) {
    float first, second;
    inner_filter.up(n == 0 ? 1.0f : 0.0f, &first, &second);
    g[2 * n] = 0.5f * first;
    g[2 * n + 1] = 0.5f * second;
  }
  lab::response_tap(inner_response, g, 64, kPoints, 250.0f, 24000.0f);
  inner_response.x0 = 1000.0f;
  inner_response.x1 = 96000.0f;
}

// What Tone does to each frequency: one unit sample through a filter of the
// device's own class, set as the device sets its own.
void measure_tone_tilt() {
  constexpr int kRing = 4096;
  float* h = lab::take(kRing);
  if (!h) return;
  Tilt filter;
  filter.set(tone.value, Saturator::kTonePivotHz, lab::kSampleRate);
  for (int n = 0; n < kRing; ++n) h[n] = filter.process(n == 0 ? 1.0f : 0.0f);
  lab::response_tap(tone_response, h, kRing);
}

// One small click through the wet path of a device, the bias at rest: what
// comes out, scaled so that a wire would give back a single 1.
float* click_through(int factor, bool antiderivative_on) {
  float* h = lab::take(kClickLength);
  if (!h) return nullptr;
  configure(probe, factor, antiderivative_on, false, 0.0f, drive.value, 0.0f, 0.0f, 1.0f);
  const float click = kSmall / kit::db_to_gain(drive.value);
  for (int n = 0; n < kClickLength; ++n) {
    feed(probe, n == 0 ? click : 0.0f, n == 0 ? click : 0.0f);
    h[n] = after_curve(probe, 0) / kSmall;
  }
  return h;
}

// What a quiet signal meets: the response of the plain curve's path at the
// rate as set, and of the mean of the curve at each of the three rates. And
// the click itself through the path as set, with the sample it lands on.
void measure_clicks() {
  if (float* h = click_through(oversample.choice(), false)) lab::response_tap(small_plain, h, kClickLength);
  lab::Tap* at_rate[] = {&small_adaa_1x, &small_adaa_2x, &small_adaa_4x};
  for (int factor = 0; factor < 3; ++factor) {
    if (float* h = click_through(factor, true)) lab::response_tap(*at_rate[factor], h, kClickLength);
  }
  constexpr int kShown = 80;
  float* h = click_through(oversample.choice(), adaa.on());
  if (!h || !arrival.open(kShown)) return;
  arrival.x0 = 0.0f;
  arrival.x1 = static_cast<float>(kShown - 1);
  int top = 0;
  for (int n = 0; n < kShown; ++n) {
    arrival.set(n, h[n]);
    if (std::fabs(h[n]) > std::fabs(h[top])) top = n;
  }
  latency.value = static_cast<float>(top);
}

// The probe tone through a device at 1x beside the same tone through the
// build held at 1x with the mean of the curve in: how far the build's step
// lands from the device's. For the curves that have no antiderivative the
// device runs the plain curve, and so does the build.
void rebuild_mean() {
  float* y = lab::take(kToneCount);
  float* own = lab::take(kToneCount);
  if (!y || !own) return;
  configure(probe, 0, true, false, bias.value, drive.value, 0.0f, 0.0f, 1.0f);
  Built& by_hand = toward;
  by_hand.start(Built::kMean);
  by_hand.run_at(0);
  by_hand.mean = by_hand.shape <= 1;
  // The device holds its curve's output in at the ceiling whether DC Block is on or off.
  by_hand.dc_piece = true;
  const int steps = tone_steps();
  int at = 0;
  for (int n = 0; n < kToneSettle + kToneCount; ++n) {
    const float x = kToneLevel * static_cast<float>(wave_[at]);
    at = (at + steps) % kCycle;
    const bool slept = probe.idle_.asleep();
    const bool worked = feed(probe, x, x);
    if (slept) by_hand.rest();
    if (worked) by_hand.run(x);
    if (n >= kToneSettle) {
      y[n - kToneSettle] = after_curve(probe, 0);
      own[n - kToneSettle] = worked ? by_hand.stage : 0.0f;
    }
  }
  adaa_rebuilt.value = lab::difference_db(own, y, kToneCount);
}

// The probe tone through something, its spectrum, and what in it is not the
// tone or one of its harmonics: the partials that folded back. The tone and
// everything it can fold to repeat exactly within the stretch measured, so
// each harmonic is taken out by its own sine and cosine with nothing spilt.
// What is left is the folded partials alone: its spectrum is a tap, and its
// power between 20 Hz and 20 kHz is the number returned, in dB where a
// full-scale sine reads 0. A partial that folds onto a harmonic cannot be
// told from it and is not counted. `through` takes one sample of the tone
// and gives back what the curve stage made of it.
template <typename Through>
float measure_tone(Through through, lab::Tap& whole_tap, lab::Tap& folded_tap) {
  float* y = lab::take(kToneCount);
  if (!y) return lab::kFloorDb;
  const int steps = tone_steps();
  int at = 0;
  for (int n = 0; n < kToneSettle + kToneCount; ++n) {
    const float x = kToneLevel * static_cast<float>(wave_[at]);
    at = (at + steps) % kCycle;
    const float made = through(x);
    if (n >= kToneSettle) y[n - kToneSettle] = made;
  }
  lab::spectrum_tap(whole_tap, y, kToneCount);

  double sum = 0.0;
  for (int n = 0; n < kToneCount; ++n) sum += y[n];
  const float mean = static_cast<float>(sum / kToneCount);
  static double rest[kToneCount];
  for (int n = 0; n < kToneCount; ++n) rest[n] = static_cast<double>(y[n]) - mean;
  for (int harmonic = 1; harmonic * steps <= kCycle / 2; ++harmonic) {
    const int stride = (harmonic * steps) % kCycle;
    const bool at_half_rate = harmonic * steps == kCycle / 2;  // a cosine only
    double with_cos = 0.0, with_sin = 0.0;
    int place = 0;
    for (int n = 0; n < kToneCount; ++n) {
      with_sin += y[n] * wave_[place];
      with_cos += y[n] * wave_[(place + kCycle / 4) % kCycle];
      place += stride;
      if (place >= kCycle) place -= kCycle;
    }
    const double scale = at_half_rate ? 1.0 : 2.0;
    with_cos *= scale / kToneCount;
    with_sin *= scale / kToneCount;
    place = 0;
    for (int n = 0; n < kToneCount; ++n) {
      rest[n] -= with_sin * wave_[place] + with_cos * wave_[(place + kCycle / 4) % kCycle];
      place += stride;
      if (place >= kCycle) place -= kCycle;
    }
  }
  for (int n = 0; n < kToneCount; ++n) y[n] = static_cast<float>(rest[n]);
  lab::spectrum_tap(folded_tap, y, kToneCount);
  if (!folded_tap.data) return lab::kFloorDb;

  // A Hann window spreads a partial over its neighbours so that the bins sum
  // to one and a half times its power.
  const float bin_hz = lab::kSampleRate / lab::kSpectrumSize;
  double power = 0.0;
  for (int k = 0; k < lab::kSpectrumBins; ++k) {
    const float hz = static_cast<float>(k) * bin_hz;
    // A bin at the floor holds nothing: the floor is where the spectrum stops counting.
    if (hz >= 20.0f && hz < 20000.0f && folded_tap.data[k] > lab::kFloorDb + 0.5f) {
      power += std::pow(10.0, 0.1 * folded_tap.data[k]);
    }
  }
  return power > 1.5e-14 ? static_cast<float>(10.0 * std::log10(power / 1.5)) : lab::kFloorDb;
}

// The probe tone through the curve stage of a device set as the page is,
// but for its rate and its antiderivative.
float tone_through_device(int factor, bool antiderivative_on, lab::Tap& whole_tap, lab::Tap& folded_tap) {
  configure(probe, factor, antiderivative_on, false, bias.value, drive.value, 0.0f, 0.0f, 1.0f);
  return measure_tone(
      [](float x) {
        feed(probe, x, x);
        return after_curve(probe, 0);
      },
      whole_tap, folded_tap);
}

// And through the curve stage of the build so far.
float tone_through_build() {
  toward.start(build.at());
  return measure_tone(
      [](float x) {
        toward.run(x);
        return toward.stage;
      },
      built_tone, built_folded);
}

// A sine rising from nothing to 10 kHz in half a second through a device at
// `factor`: every harmonic is a line that climbs, and every folded one a line
// that comes back down.
void picture_rising(lab::Tap& picture, int factor, bool antiderivative_on) {
  constexpr int kCount = 24000;
  constexpr int kFade = 1920;
  float* y = lab::take(kCount);
  if (!y) return;
  configure(probe, factor, antiderivative_on, false, bias.value, drive.value, 0.0f, 0.0f, 1.0f);
  double phase = 0.0;
  for (int n = 0; n < kCount; ++n) {
    // The end fades over 40 ms on half a cosine, slowly enough to leave no mark of its own.
    const int left = kCount - 1 - n;
    const float fade = left < kFade ? 0.5f - 0.5f * std::cos(3.14159265f * static_cast<float>(left) / kFade) : 1.0f;
    const float x = kToneLevel * fade * static_cast<float>(std::sin(2.0 * lab::kPi * phase));
    phase += 10000.0 * (static_cast<double>(n) / kCount) / lab::kSampleRate;
    phase -= std::floor(phase);
    feed(probe, x, x);
    y[n] = after_curve(probe, 0);
  }
  lab::spectrogram_tap(picture, y, kCount, 200, false);
}

}  // namespace

void lab_setup() {
  for (int n = 0; n < kCycle; ++n) wave_[n] = std::sin(2.0 * lab::kPi * n / kCycle);
}

void lab_render(int frames) {
  configure(sat, oversample.choice(), adaa.on(), dc_block.on(), bias.value, drive.value, tone.value, output.value,
            mix.value);
  configure(base, 0, false, dc_block.on(), bias.value, drive.value, 0.0f, 0.0f, 1.0f);

  // The build part: the chosen step, and the whole build that is held to the
  // device. At the last step the two are one.
  const bool whole = build.at() == build.compared_step;
  for (int c = 0; c < 2; ++c) {
    shown[c].start(build.at());
    if (!whole) held[c].start(build.compared_step);
    // The 1x path by hand: every piece of the curve stage, at the base rate.
    plain[c].start(Built::kDcBlock);
    plain[c].run_at(0);
    plain[c].mean = false;
  }
  Built* compared = whole ? shown : held;
  double built_apart = 0.0, built_whole = 0.0;
  double plain_apart = 0.0, plain_whole = 0.0;

  going_in.start();
  coming_out.start();
  curve_middle.start();
  built_middle.start();

  float held_in[2][64] = {};  // the last 64 inputs: the device's dry delay, kept again here
  float peak = 0.0f;
  const float fall = std::exp(-1.0f / (0.05f * lab::kSampleRate));

  const int start = frames > kRunIn ? frames - kRunIn : 0;
  const int end = lab::total() + kLatency;
  for (int i = start; i < end; ++i) {
    const float in[2] = {lab::in_at(0, i), lab::in_at(1, i)};
    const bool sat_slept = sat.idle_.asleep();
    const bool sat_worked = feed(sat, in[0], in[1]);
    const bool base_slept = base.idle_.asleep();
    const bool base_worked = feed(base, in[0], in[1]);

    in_tap.put(i, in[0], in[1]);
    const float size = std::fabs(in[0]) > std::fabs(in[1]) ? std::fabs(in[0]) : std::fabs(in[1]);
    peak = size > peak * fall ? size : peak * fall;
    reach.put(i, peak);

    // The build, beside the devices. Asleep a device forgets, and waking it
    // starts from nothing; the build is told, and does the same.
    for (int c = 0; c < 2; ++c) {
      if (sat_slept) {
        shown[c].rest();
        if (!whole) held[c].rest();
      }
      if (sat_worked) {
        shown[c].run(in[c]);
        if (!whole) held[c].run(in[c]);
      } else {
        shown[c].out = shown[c].stage = 0.0f;
        if (!whole) held[c].out = held[c].stage = 0.0f;
      }
      if (base_slept) plain[c].rest();
      if (base_worked) plain[c].run(in[c]);
      else plain[c].stage = 0.0f;
    }

    // What the devices put out now answers the input of 39 samples ago.
    const int at = i - kLatency;
    float then[2], pushed[2];
    for (int c = 0; c < 2; ++c) {
      then[c] = held_in[c][at & 63];
      held_in[c][i & 63] = in[c];
      pushed[c] = base.gain_ * then[c];
    }
    if (at < 0) continue;
    const float once[2] = {after_curve(base, 0), after_curve(base, 1)};
    const float as_set[2] = {after_curve(sat, 0), after_curve(sat, 1)};
    const float left = sat.out_left()[0];
    const float right = sat.out_right()[0];
    driven.put(at, pushed[0], pushed[1]);
    shaped_1x.put(at, once[0], once[1]);
    shaped.put(at, as_set[0], as_set[1]);
    folded_sound.put(at, once[0] - as_set[0], once[1] - as_set[1]);
    toned.put(at, after_tone(sat, 0), after_tone(sat, 1));
    out_tap.put(at, left, right);
    built.put(at, shown[0].out, shown[1].out);
    const float loud_in = going_in.level(then[0], then[1]);
    const float loud_out = coming_out.level(left, right);
    const float lies = curve_middle.middle(as_set[0], as_set[1]);
    const float built_lies = built_middle.middle(shown[0].out, shown[1].out);
    if (at % lab::kControlPeriod == 0) {
      meter_in.put(at, loud_in);
      meter_out.put(at, loud_out);
      offset.put(at, lies);
      built_offset.put(at, built_lies);
    }
    if (at >= frames && at < 2 * frames) {
      const float device_out[2] = {left, right};
      for (int c = 0; c < 2; ++c) {
        const double d = static_cast<double>(compared[c].out) - device_out[c];
        built_apart += d * d;
        built_whole += static_cast<double>(device_out[c]) * device_out[c];
        const double e = static_cast<double>(plain[c].stage) - once[c];
        plain_apart += e * e;
        plain_whole += static_cast<double>(once[c]) * once[c];
      }
    }
  }
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  rebuilt.value = plain_whole > 0.0 ? lab::ratio_db(plain_apart, plain_whole) : lab::kFloorDb;

  measure_transfer();
  draw_built_curve();
  draw_shapes();
  measure_filters();
  measure_tone_tilt();
  measure_clicks();
  alias_1x.value = tone_through_device(0, false, tone_1x, folded_1x);
  alias_set.value = tone_through_device(oversample.choice(), adaa.on(), tone_set, folded_set);
  alias_drop.value = alias_1x.value - alias_set.value;
  built_alias.value = tone_through_build();
  rebuild_mean();
  picture_rising(rising_1x, 0, false);
  picture_rising(rising, oversample.choice(), adaa.on());
}
