// Saturation and oversampling: the Saturator (cpp/devices/saturator)
// run one sample at a time, twice over: once as the reader set it, and once
// beside it with the same curve at the base rate, so the two can be compared.
//
//   in ─┬─► × drive ─► up ─► curve(u + bias) − curve(bias) ─► down ─► × output ─┐
//       │              (1x, 2x or 4x; or the antiderivative's mean)             ├─► out
//       └─► delay 39 ───────────────────────────────────────── dry ─► mix ──────┘
//
// Read from the devices: what the curve stage put out (the device's tone tilt
// keeps its last input, which is exactly that) and the output. The driven
// signal is a local of the device, so the lab multiplies the input by the
// device's own gain ("lesson") and then proves it has the path right: it runs
// that through the device's curve, its offset, its DC follower and its tape
// cut by hand and reports how far the result lands from the device at 1x (the
// "rebuilt" check). The antiderivative step is rebuilt the same way from the
// formulas in Adaa.h ("adaaRebuilt").
//
// Every tap is shown with the device's 39 samples of latency taken off again,
// as a host does with the latency a device reports, so in and out line up.
//
// The Saturator keeps nothing longer than its 10 Hz DC follower (16 ms) and
// its 50 ms of patience before sleeping, so the pass that is thrown away runs
// for its last fifth of a second only: by then every state is where a full
// pass would have left it.
//
// Beside the loop, a third device measures: the transfer curve (a level held
// at each height), a probe tone whose folded partials are counted exactly, a
// click for the latency and the small-signal response, and a rising sine for
// the picture of everything at once.

#include "lab.h"

#include "../../cpp/devices/saturator/saturator.h"

using namespace livemix;

namespace {

using Channel = Saturator::Lane::Channel;
using DcFollower = decltype(Channel::dc);
using TapeCut = decltype(Channel::tape);
using InnerHalfband = decltype(Channel::inner);

constexpr int kLatency = Saturator::kLatency;
constexpr int kRunIn = 9600;        // a fifth of a second before the pass that is kept
constexpr int kCycle = 4800;        // a tone at a multiple of 10 Hz repeats within this many samples
constexpr int kToneSettle = 1200;
constexpr int kToneCount = kCycle;
constexpr float kToneLevel = 0.5f;  // the probe tone and the rising sine: 6 dB under full scale
constexpr float kSmall = 0.01f;     // what the click reaches at the curve: small enough to be straight
constexpr int kClickLength = 192;

Saturator sat;    // as the reader set it
Saturator base;   // the same curve, drive and bias at 1x, no antiderivative
Saturator probe;  // for everything measured beside the loop
kit::Halfband2x outer_filter;
InnerHalfband inner_filter;
double wave_[kCycle];  // one cycle of a sine

lab::Control curve{"curve", "Curve", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "Soft|Hard|Tube|Tape|Fold"};
lab::Control drive{"drive", "Drive", "dB", 0.0f, 36.0f, 18.0f};
lab::Control bias{"bias", "Bias", "", -1.0f, 1.0f, 0.0f};
lab::Control dc_block{"dcBlock", "DC Block", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Off|On"};
lab::Control oversample{"oversample", "Oversampling", "", 0.0f, 2.0f, 2.0f, lab::kLinear, "1x|2x|4x"};
lab::Control adaa{"adaa", "Antiderivative (ADAA)", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Off|On"};
lab::Control output{"output", "Output", "dB", -24.0f, 24.0f, -9.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control probe_hz{"probe", "Probe tone", "Hz", 1000.0f, 10000.0f, 5000.0f, lab::kLog};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap driven{"driven", "After drive", lab::kAudio, lab::kLesson, 2};
lab::Tap shaped_1x{"shaped1x", "After the curve at 1x", lab::kAudio, lab::kDevice, 2};
lab::Tap shaped{"shaped", "After the curve as set", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap reach{"reach", "How far the input reaches", lab::kControl, lab::kLesson, 1};

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
lab::Tap small_adaa_1x{"smallAdaa1x", "Through the antiderivative at 1x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_adaa_2x{"smallAdaa2x", "Through the antiderivative at 2x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap small_adaa_4x{"smallAdaa4x", "Through the antiderivative at 4x", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap arrival{"arrival", "A click through the device", lab::kCurve, lab::kDevice, 1};
lab::Tap rising{"rising", "A rising sine through the device", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The 1x path worked out by hand, against the device at 1x", "dB"};
lab::Check adaa_rebuilt{"adaaRebuilt", "The antiderivative step worked out by hand, against the device", "dB"};
lab::Check alias_1x{"alias1x", "Folded back below 20 kHz at 1x", "dB"};
lab::Check alias_set{"aliasSet", "Folded back below 20 kHz as set", "dB"};
lab::Check alias_drop{"aliasDrop", "How far the setting brought that down", "dB"};
lab::Check latency{"latency", "The click arrives on sample", ""};

void configure(Saturator& device, int factor, bool antiderivative, bool blocker, float bias_value, float drive_db,
               float output_db, float mix_value) {
  using namespace saturator;
  device.init(lab::kSampleRate);
  device.set_param(kCurve, curve.value);
  device.set_param(kDriveDb, drive_db);
  device.set_param(kBias, bias_value);
  device.set_param(kToneDb, 0.0f);
  device.set_param(kOutputDb, output_db);
  device.set_param(kMix, mix_value);
  device.set_param(kDcBlock, blocker ? 1.0f : 0.0f);
  device.set_param(kOversample, static_cast<float>(factor));
  device.set_param(kAdaa, antiderivative ? 1.0f : 0.0f);
}

void feed(Saturator& device, float left, float right) {
  device.in_left()[0] = left;
  device.in_right()[0] = right;
  device.process(1);
}

// What the curve stage of a device just put out, after the down-sampler and
// before the tone tilt, Output and Mix. The tilt keeps its last input.
float after_curve(const Saturator& device, int c) { return device.idle_.asleep() ? 0.0f : device.tilt_[c].x1; }

// The antiderivatives as Adaa.h is handed them, and its step, written out.
double antiderivative(int which, double x) {
  const double a = x < 0.0 ? -x : x;
  if (which == 0) return a + std::log1p(std::exp(-2.0 * a)) - 0.6931471805599453;  // ln cosh x
  return a <= 1.0 ? 0.5 * x * x : a - 0.5;                                         // of the clip
}

struct MeanOfCurve {
  double last = 0.0;
  double last_area = 0.0;
  void rest_on(int which, double x) {
    last = x;
    last_area = antiderivative(which, x);
  }
  float step(int which, float x) {
    const double now = x;
    const double area = antiderivative(which, now);
    const double delta = now - last;
    const double size = delta < 0.0 ? -delta : delta;
    const double y = size > 1.0e-4 ? (area - last_area) / delta
                                   : Saturator::curve_value(which, static_cast<float>(0.5 * (now + last)));
    last = now;
    last_area = area;
    return static_cast<float>(y);
  }
};

int tone_steps() {
  // The tone stands on a multiple of 10 Hz, which is what the slider shows.
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
  configure(probe, 0, false, false, bias.value, drive.value, 0.0f, 1.0f);
  for (int p = 0; p < kPoints; ++p) {
    const float x = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kPoints - 1);
    for (int n = 0; n < kHold; ++n) feed(probe, x, x);
    transfer.set(p, after_curve(probe, 0));
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
// the same points stand at twice and at four times the frequency.
void measure_filters() {
  constexpr int kPoints = 721;
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

// One small click through the wet path of a device, the bias at rest: what
// comes out, scaled so that a wire would give back a single 1.
float* click_through(int factor, bool antiderivative) {
  float* h = lab::take(kClickLength);
  if (!h) return nullptr;
  configure(probe, factor, antiderivative, false, 0.0f, drive.value, 0.0f, 1.0f);
  const float click = kSmall / kit::db_to_gain(drive.value);
  for (int n = 0; n < kClickLength; ++n) {
    feed(probe, n == 0 ? click : 0.0f, n == 0 ? click : 0.0f);
    h[n] = after_curve(probe, 0) / kSmall;
  }
  return h;
}

// What a quiet signal meets: the response of the plain curve's path at the
// rate as set, and of the antiderivative's at each of the three rates. And
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

// The probe tone through a device, its spectrum, and what in it is not the
// tone or one of its harmonics: the partials that folded back. The tone and
// everything it can fold to repeat exactly within the stretch measured, so
// each harmonic is taken out by its own sine and cosine with nothing spilt.
// What is left is the folded partials alone: its spectrum is a tap, and its
// power between 20 Hz and 20 kHz is the number returned, in dB where a
// full-scale sine reads 0. A partial that folds onto a harmonic cannot be
// told from it and is not counted.
float measure_tone(int factor, bool antiderivative, lab::Tap& whole_tap, lab::Tap& folded_tap) {
  float* y = lab::take(kToneCount);
  if (!y) return lab::kFloorDb;
  configure(probe, factor, antiderivative, false, bias.value, drive.value, 0.0f, 1.0f);
  const int steps = tone_steps();
  int at = 0;
  for (int n = 0; n < kToneSettle + kToneCount; ++n) {
    const float x = kToneLevel * static_cast<float>(wave_[at]);
    at = (at + steps) % kCycle;
    feed(probe, x, x);
    if (n >= kToneSettle) y[n - kToneSettle] = after_curve(probe, 0);
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

// The antiderivative step by hand on the probe tone, against a device at 1x
// with the switch on. For the curves that have no antiderivative the device
// runs the plain curve, and so does this.
void rebuild_antiderivative() {
  float* y = lab::take(kToneCount);
  float* own = lab::take(kToneCount);
  if (!y || !own) return;
  configure(probe, 0, true, false, bias.value, drive.value, 0.0f, 1.0f);
  const int which = curve.choice();
  const int steps = tone_steps();
  float held[64] = {};
  MeanOfCurve mean;
  TapeCut own_tape;
  bool resting = true;
  int at = 0;
  for (int n = 0; n < kToneSettle + kToneCount; ++n) {
    const float x = kToneLevel * static_cast<float>(wave_[at]);
    at = (at + steps) % kCycle;
    feed(probe, x, x);
    const float then = held[(n - kLatency) & 63];
    held[n & 63] = x;
    float mine = 0.0f;
    if (!probe.idle_.asleep()) {
      const Saturator::Lane& lane = probe.lanes_[probe.active_];
      // The device starts the step resting on the bias, so its first answer is the offset.
      if (resting) mean.rest_on(which, probe.bias_.value);
      resting = false;
      const float v = probe.gain_ * then + probe.bias_.value;
      mine = (which <= 1 ? mean.step(which, v) : Saturator::curve_value(which, v)) - lane.offset;
      mine = kit::clamp(mine, -Saturator::kCeiling - lane.offset, Saturator::kCeiling - lane.offset);
      own_tape.a = lane.channel[0].tape.a;
      if (which == Saturator::kTape) mine = own_tape.process(mine);
    }
    if (n >= kToneSettle) {
      y[n - kToneSettle] = after_curve(probe, 0);
      own[n - kToneSettle] = mine;
    }
  }
  adaa_rebuilt.value = lab::difference_db(own, y, kToneCount);
}

// A sine rising from nothing to 10 kHz in half a second through the device as
// set: every harmonic is a line that climbs, and every folded one a line that
// comes back down.
void picture_rising() {
  constexpr int kCount = 24000;
  constexpr int kFade = 1920;
  float* y = lab::take(kCount);
  if (!y) return;
  configure(probe, oversample.choice(), adaa.on(), false, bias.value, drive.value, 0.0f, 1.0f);
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
  lab::spectrogram_tap(rising, y, kCount, 200, false);
}

}  // namespace

void lab_setup() {
  for (int n = 0; n < kCycle; ++n) wave_[n] = std::sin(2.0 * lab::kPi * n / kCycle);
}

void lab_render(int frames) {
  configure(sat, oversample.choice(), adaa.on(), dc_block.on(), bias.value, drive.value, output.value, mix.value);
  configure(base, 0, false, dc_block.on(), bias.value, drive.value, 0.0f, 1.0f);

  // The lab's own copy of the 1x path: the device's curve and offset, with a
  // DC follower and a tape cut of the device's own classes beside them.
  DcFollower own_dc[2];
  TapeCut own_tape[2];
  float held[2][64] = {};  // the last 64 inputs: the device's dry delay, kept again here
  double off = 0.0, whole = 0.0;
  float peak = 0.0f;
  const float fall = std::exp(-1.0f / (0.05f * lab::kSampleRate));

  const int start = frames > kRunIn ? frames - kRunIn : 0;
  const int end = lab::total() + kLatency;
  for (int i = start; i < end; ++i) {
    const float in[2] = {lab::in_at(0, i), lab::in_at(1, i)};
    feed(sat, in[0], in[1]);
    feed(base, in[0], in[1]);

    in_tap.put(i, in[0], in[1]);
    const float size = std::fabs(in[0]) > std::fabs(in[1]) ? std::fabs(in[0]) : std::fabs(in[1]);
    peak = size > peak * fall ? size : peak * fall;
    reach.put(i, peak);

    // What the devices put out now answers the input of 39 samples ago.
    const int at = i - kLatency;
    const Saturator::Lane& lane = base.lanes_[base.active_];
    float pushed[2], mine[2];
    for (int c = 0; c < 2; ++c) {
      const float then = held[c][at & 63];
      held[c][i & 63] = in[c];
      pushed[c] = base.gain_ * then;
      if (base.idle_.asleep()) {
        // Asleep the device forgets; waking, it starts its followers from nothing.
        own_dc[c].reset();
        own_tape[c].reset();
        mine[c] = 0.0f;
        continue;
      }
      own_dc[c].a = lane.channel[c].dc.a;
      own_tape[c].a = lane.channel[c].tape.a;
      const float amount = base.dc_amount_.value;
      const float shift = (1.0f - amount) * lane.offset;
      float y = Saturator::curve_value(lane.setup.curve, pushed[c] + base.bias_.value) - lane.offset;
      y = kit::clamp(y - amount * own_dc[c].lowpassBounded(y, Saturator::kCeiling), -Saturator::kCeiling - shift,
                     Saturator::kCeiling - shift);
      mine[c] = lane.setup.curve == Saturator::kTape ? own_tape[c].process(y) : y;
    }
    if (at < 0) continue;
    const float plain[2] = {after_curve(base, 0), after_curve(base, 1)};
    driven.put(at, pushed[0], pushed[1]);
    shaped_1x.put(at, plain[0], plain[1]);
    shaped.put(at, after_curve(sat, 0), after_curve(sat, 1));
    out_tap.put(at, sat.out_left()[0], sat.out_right()[0]);
    if (at >= frames && at < 2 * frames) {
      for (int c = 0; c < 2; ++c) {
        const double d = static_cast<double>(mine[c]) - plain[c];
        off += d * d;
        whole += static_cast<double>(plain[c]) * plain[c];
      }
    }
  }
  rebuilt.value = whole > 0.0 ? lab::ratio_db(off, whole) : lab::kFloorDb;

  measure_transfer();
  draw_shapes();
  measure_filters();
  measure_clicks();
  alias_1x.value = measure_tone(0, false, tone_1x, folded_1x);
  alias_set.value = measure_tone(oversample.choice(), adaa.on(), tone_set, folded_set);
  alias_drop.value = alias_1x.value - alias_set.value;
  rebuild_antiderivative();
  picture_rising();
}
