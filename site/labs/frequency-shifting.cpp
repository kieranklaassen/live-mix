// Frequency shifting: the Frequency Shifter (cpp/devices/freq-shifter)
// run one sample at a time, and the kit's pair of all-pass chains
// (cpp/kit/hilbert.h) measured by itself.
//
//   in ──(+)──► pair ──► I ──× cos ──┐
//         ▲          └──► Q ──× sin ──(±)──► wet ──► mix ──► out
//         │                                  │
//         └── feedback ◄─ limit ◄─ tone ◄─ delay ◄┘
//
// Read from the device: what goes into the pair (the input plus what comes
// back, kept by the pair's first section), the pair's two outputs (the
// in-phase one is the pair's `delayed_` before the step, the quadrature one
// the last output of its second chain), the sideband the device keeps (the
// sample it has just written to its delay line), what comes back round the
// feedback loop (the tone filter's state, through the kit's limiter), the
// shift in force (the device's own meter), and the output.
// Computed by the kit: the carrier's cosine and sine (and the right side's
// cosine, which Width turns) and the LFO, looked up in the kit's table at the
// phases the device holds before the step; and the phase of each chain
// against frequency, from the impulse responses of a kit::Hilbert.
// Written for the lesson: a plain ring modulator (the input times the same
// cosine); the input played faster, which is a change of pitch, to set beside
// the shift; the two products and both sidebands; a level meter on each side
// of the output; and four pictures of harmonics on a ruler marked in hertz.
// The device keeps only the sideband its mode asks for, so the lab works
// that one out again from the pair and the carrier and reports how far it
// lands from what the device wrote (the "rebuilt" check).
//
// The lab starts with the feedback, the LFO, the width and the fine shift at
// zero and the mix fully wet, so the shift itself shows. Each is a control,
// and the controls are the device's ten parameters.
//
// The build part puts a shifter together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has six pieces, each a
// function of `Built` below, in the order the steps add them: a wire; the
// kit's pair, which makes two copies a quarter turn apart; the carrier, which
// multiplies one copy by a cosine and the other by a sine; the sum or the
// difference of the two products; the feedback path; the mix, with Width. The
// path writes the "built" taps and leaves every other tap as it was. Two
// copies of it run: one at the step the reader chose, which is what the taps
// show, and one with all six pieces, whose output is compared on every render
// with the device's own output (the "builtDifference" check). With all six
// the build does to a sample what the device does, in the same order. One
// thing the build is told and does not work out: when the device rests after
// a silence, the build stops with it.

#include "lab.h"

#include "../../cpp/devices/freq-shifter/freq_shifter.h"

using namespace livemix;

namespace {

FreqShifter shifter;
kit::Hilbert pair;  // the kit's pair by itself, for its phase against frequency

lab::Control shift{"shift", "Shift", "Hz", -1000.0f, 1000.0f, 100.0f};
lab::Control fine{"fine", "Fine", "Hz", -10.0f, 10.0f, 0.0f};
lab::Control mode{"mode", "Mode", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Up|Down|Stereo|Ring"};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 0.98f, 0.0f};
lab::Control delay{"delay", "Delay", "ms", 1.0f, 500.0f, 45.0f, lab::kLog};
lab::Control lfo_rate{"lfoRate", "LFO Rate", "Hz", 0.01f, 10.0f, 0.08f, lab::kLog};
lab::Control lfo_depth{"lfoDepth", "LFO Depth", "", 0.0f, 1.0f, 0.0f};
lab::Control tone{"tone", "Tone", "Hz", 200.0f, 16000.0f, 4500.0f, lab::kLog};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap pitched{"pitched", "Input, played faster", lab::kAudio, lab::kLesson, 1};
lab::Tap ring{"ring", "Input times a cosine", lab::kAudio, lab::kLesson, 1};
lab::Tap driven{"driven", "Input plus what comes back", lab::kAudio, lab::kDevice, 1};
lab::Tap in_phase{"inPhase", "In-phase", lab::kAudio, lab::kDevice, 1};
lab::Tap quadrature{"quadrature", "Quadrature", lab::kAudio, lab::kDevice, 1};
lab::Tap cosine_tap{"cosine", "Carrier, cosine", lab::kCurve, lab::kKit, 1};
lab::Tap sine_tap{"sine", "Carrier, sine", lab::kCurve, lab::kKit, 1};
lab::Tap cosine_right{"cosineRight", "Right carrier, cosine", lab::kCurve, lab::kKit, 1};
lab::Tap lfo_tap{"lfo", "LFO", lab::kControl, lab::kKit, 1};
lab::Tap shift_now{"shiftNow", "Shift in force", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap product_i{"productI", "In-phase times cosine", lab::kAudio, lab::kLesson, 1};
lab::Tap product_q{"productQ", "Quadrature times sine", lab::kAudio, lab::kLesson, 1};
lab::Tap upper{"upper", "Upper sideband", lab::kAudio, lab::kLesson, 1};
lab::Tap lower{"lower", "Lower sideband", lab::kAudio, lab::kLesson, 1};
lab::Tap wet_tap{"wet", "The sideband kept", lab::kAudio, lab::kDevice, 1};
lab::Tap back{"back", "Back from the delay", lab::kAudio, lab::kDevice, 1};
lab::Tap level_left{"levelLeft", "Level, left output", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level_right{"levelRight", "Level, right output", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap picture{"picture", "Output, over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Tap phase_i{"phaseI", "In-phase chain", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap phase_q{"phaseQ", "Quadrature chain", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap phase_difference{"phaseDifference", "Quadrature ahead of in-phase", lab::kCurve, lab::kKit, 1, "°"};

lab::Tap ruler_in{"rulerIn", "Input, on a ruler in hertz", lab::kCurve, lab::kSource, 1, "dB"};
lab::Tap ruler_pitched{"rulerPitched", "Played faster, on the ruler", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap ruler_ring{"rulerRing", "Times a cosine, on the ruler", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap ruler_out{"rulerOut", "Output, on the ruler", lab::kCurve, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The sideband worked out again, against what the device wrote to its delay", "dB"};
lab::Check quarter_error{"quarterError", "The pair's furthest from a quarter turn, 22 Hz to 23,978 Hz", "°"};

lab::Tap built{"built", "The shifter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_quadrature{"builtQuadrature", "The second copy, as built", lab::kAudio, lab::kKit, 1};
lab::Tap built_first{"builtFirst", "First copy times cosine", lab::kAudio, lab::kLesson, 1};
lab::Tap built_second{"builtSecond", "Second copy times sine", lab::kAudio, lab::kLesson, 1};
lab::Tap built_back{"builtBack", "Back from the delay, as built", lab::kAudio, lab::kKit, 1};

// The shifter so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kWire = 0, kPair, kCarrier, kSideBand, kFeedback, kMix };

  int pieces = kWire;
  kit::Hilbert copies[2];
  kit::DelayLine<FreqShifter::kDelaySize> line[2];
  kit::Svf darken[2];
  kit::ControlClock clock;
  double angle = 0.0;  // the carrier's, in cycles
  double sway = 0.0;   // the LFO's, in cycles
  float first[2] = {0.0f, 0.0f};    // the copy that is multiplied by the cosine
  float second[2] = {0.0f, 0.0f};   // the copy a quarter turn ahead of it
  float cosine[2] = {1.0f, 1.0f};
  float sine[2] = {0.0f, 0.0f};
  float returned[2] = {0.0f, 0.0f};  // what came back round the loop
  float wet[2] = {0.0f, 0.0f};
  float out[2] = {0.0f, 0.0f};

  // A wire: what goes in comes out.
  void wire(int side, float x) { out[side] = x; }

  // Two copies a quarter turn apart: the kit's pair of all-pass chains.
  // Neither copy is the sound that went in. Each has every frequency of it
  // at the level it had, and the second runs a quarter turn ahead of the
  // first at every frequency.
  void copy(int side, float x) { copies[side].process(x, &first[side], &second[side]); }

  // The carrier: an angle in cycles that steps on by frequency / sample
  // rate with every sample, so a frequency below zero turns it backwards.
  // Shift and Fine are added, and the LFO sways the sum by up to 50 Hz.
  // Returns the angle this sample is made from.
  float turn() {
    const double per_sample = 1.0 / static_cast<double>(lab::kSampleRate);
    const float lfo = kit::SineTable::lookup(static_cast<float>(sway));
    sway += static_cast<double>(lfo_rate.value) * per_sample;
    if (sway >= 1.0) sway -= 1.0;
    const float hz = shift.value + fine.value + lfo_depth.value * lfo_depth.value * FreqShifter::kLfoRangeHz * lfo;
    const float now = static_cast<float>(angle);
    angle += static_cast<double>(hz) * per_sample;
    angle -= std::floor(angle);
    return now;
  }

  // The cosine and the sine of the angle, from the kit's table.
  void carry(int side, float at) {
    cosine[side] = kit::SineTable::cos_lookup(at);
    sine[side] = kit::SineTable::lookup(at);
  }

  // Add or subtract: both products hold both sidebands. Added, the lower
  // ones cancel and the upper one is left; subtracted, the other way round.
  // `d` is +1 to add, -1 to subtract and 0 for the first product alone, made
  // up by the square root of 2.
  float side_band(int side) const {
    const float d = FreqShifter::kDirection[mode.choice()][side];
    const float makeup = 1.0f + (kit::kSqrtHalf * 2.0f - 1.0f) * (1.0f - d * d);
    return (first[side] * cosine[side] + d * second[side] * sine[side]) * makeup;
  }

  // Feedback: what was made a moment ago, read out of a delay line, darkened
  // by a low-pass filter and held under full scale by a limiter, is added to
  // the sound before the pair. So it is shifted again on every pass.
  float fed(int side, float x) {
    const float longest = kit::DelayLine<FreqShifter::kDelaySize>::max_delay() - 4.0f;
    const float samples = kit::clamp(delay.value * 0.001f * lab::kSampleRate, 2.0f, longest);
    returned[side] = kit::soft_clip(darken[side].lowpass(line[side].read_hermite(samples)));
    const float sum = x + feedback.value * returned[side];
    // A runaway must not lodge in the pair: the device's own guard.
    return sum > -64.0f && sum < 64.0f ? sum : 0.0f;
  }

  // Mix: the sound as it went in beside the shifted sound, crossed over so
  // that their powers add up to one.
  float blended(int side, float x) const {
    float dry_gain, wet_gain;
    kit::equal_power(mix.value, &dry_gain, &wet_gain);
    return x * dry_gain + wet[side] * wet_gain;
  }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    const float in[2] = {left, right};
    if (clock.tick()) {
      for (kit::Svf& filter : darken) filter.set(tone.value, 0.6f, lab::kSampleRate);
    }
    const float at = pieces >= kCarrier ? turn() : 0.0f;
    // Width turns the right side's carrier on by up to a quarter of a cycle.
    const float ahead = pieces >= kMix ? width.value * 0.25f : 0.0f;
    for (int side = 0; side < 2; ++side) {
      if (pieces < kPair) {
        wire(side, in[side]);
        continue;
      }
      copy(side, pieces >= kFeedback ? fed(side, in[side]) : in[side]);
      if (pieces >= kCarrier) carry(side, side == 0 ? at : at + ahead);
      wet[side] = pieces >= kSideBand ? side_band(side) : first[side] * cosine[side];
      if (pieces >= kFeedback) line[side].write(flush_denormal(wet[side]));
      out[side] = pieces >= kMix ? blended(side, in[side]) : wet[side];
    }
  }

  // Nothing is sounding and the device is at rest: nothing is stepped.
  void rest() { out[0] = out[1] = 0.0f; }

  void start(int pieces_) {
    pieces = pieces_;
    for (int side = 0; side < 2; ++side) {
      copies[side].reset();
      line[side].clear();
      darken[side] = kit::Svf();
      first[side] = second[side] = returned[side] = wet[side] = out[side] = 0.0f;
      cosine[side] = 1.0f;
      sine[side] = 0.0f;
    }
    clock.reset(16);
    angle = 0.0;
    sway = 0.0;
  }
};

lab::Build build{"A wire|Two copies|A carrier that turns|Add or subtract|Feedback|Mix and Width", Built::kMix,
                 -120.0f, "The shifter as built, all six pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// ---------------------------------------------------------------------------
// The pair by itself: its two impulse responses, and from them the phase of
// each chain at a frequency, as the sum the Fourier transform is (the lesson
// on the Fourier transform).

constexpr int kResponse = 16384;  // the slowest section has died away 178 dB by here
constexpr int kPhasePoints = 361;
constexpr float kPhaseLow = 5.0f;
constexpr float kPhaseHigh = 20000.0f;
// The band the check covers: all but the bottom and the top 22 Hz.
constexpr double kBandLow = 22.0;
constexpr double kBandHigh = 0.5 * lab::kSampleRate - kBandLow;

float response_i[kResponse];
float response_q[kResponse];
float phase_i_points[kPhasePoints];
float phase_q_points[kPhasePoints];
float difference_points[kPhasePoints];
float quarter_error_found = 0.0f;

constexpr double kDegrees = 180.0 / lab::kPi;

struct Turned {
  double i_degrees;  // the in-phase chain's phase, between -180 and 180
  double q_degrees;
  double ahead;  // how far the quadrature output is ahead of the in-phase one
};

Turned measure_at(double hz) {
  const double w = 2.0 * lab::kPi * hz / lab::kSampleRate;
  const double cw = std::cos(w), sw = std::sin(w);
  double c = 1.0, s = 0.0;
  double i_re = 0.0, i_im = 0.0, q_re = 0.0, q_im = 0.0;
  for (int n = 0; n < kResponse; ++n) {
    i_re += response_i[n] * c;
    i_im -= response_i[n] * s;
    q_re += response_q[n] * c;
    q_im -= response_q[n] * s;
    const double next = c * cw - s * sw;
    s = s * cw + c * sw;
    c = next;
  }
  Turned found;
  found.i_degrees = std::atan2(i_im, i_re) * kDegrees;
  found.q_degrees = std::atan2(q_im, q_re) * kDegrees;
  // The angle of Q times the conjugate of I.
  found.ahead = std::atan2(q_im * i_re - q_re * i_im, q_re * i_re + q_im * i_im) * kDegrees;
  return found;
}

// A phase that follows on from the last one, with no jump of a whole turn.
double follow(double degrees, double last) {
  while (degrees - last > 180.0) degrees -= 360.0;
  while (degrees - last < -180.0) degrees += 360.0;
  return degrees;
}

void measure_pair() {
  pair.reset();
  for (int n = 0; n < kResponse; ++n) pair.process(n == 0 ? 1.0f : 0.0f, &response_i[n], &response_q[n]);

  double last_i = 0.0, last_q = 0.0;
  for (int p = 0; p < kPhasePoints; ++p) {
    const double hz =
        kPhaseLow * std::pow(static_cast<double>(kPhaseHigh) / kPhaseLow, static_cast<double>(p) / (kPhasePoints - 1));
    const Turned found = measure_at(hz);
    last_i = follow(found.i_degrees, last_i);
    last_q = follow(found.q_degrees, last_q);
    phase_i_points[p] = static_cast<float>(last_i);
    phase_q_points[p] = static_cast<float>(last_q);
    difference_points[p] = static_cast<float>(found.ahead);
  }

  // The furthest from 90° over the band. Each section acts at a frequency
  // and again at its mirror about a quarter of the sample rate, so the band
  // is searched in even ratios up to that quarter, and at each point's mirror.
  constexpr int kSearch = 300;
  const double quarter = 0.25 * lab::kSampleRate;
  double worst = 0.0;
  for (int p = 0; p < kSearch; ++p) {
    const double hz = kBandLow * std::pow(quarter / kBandLow, static_cast<double>(p) / (kSearch - 1));
    const double places[2] = {hz, kBandHigh + kBandLow - hz};
    for (const double at : places) {
      const double error = std::fabs(measure_at(at).ahead - 90.0);
      if (error > worst) worst = error;
    }
  }
  quarter_error_found = static_cast<float>(worst);
}

void phase_curve(lab::Tap& tap, const float* points) {
  if (!tap.open(kPhasePoints)) return;
  tap.x0 = kPhaseLow;
  tap.x1 = kPhaseHigh;
  tap.scale = lab::kLog;
  for (int p = 0; p < kPhasePoints; ++p) tap.set(p, points[p]);
}

// ---------------------------------------------------------------------------
// Harmonics on a ruler: how much of each frequency a sound holds, from 0 Hz
// to 1,201 Hz on an axis that is even in hertz, 2.93 Hz to a point. It is the
// kit's transform of 16,384 samples under a Hann window, taken at four
// places spread over the loop and averaged, in dB where a full-scale sine
// reads 0. A change of pitch stretches the pattern along this ruler; a shift
// slides it.

constexpr int kRulerSize = 16384;
constexpr int kRulerPoints = 411;
constexpr int kRulerPlaces = 4;
// The pitch the comparison is tied to: the bench's saw, and the A two octaves under 440 Hz.
constexpr float kRulerNote = 110.0f;

kit::Fft<kRulerSize> ruler_fft;
float ruler_window[kRulerSize];
float ruler_re[kRulerSize];
float ruler_im[kRulerSize];

void ruler(lab::Tap& tap, const float* x, int count) {
  if (!x || count <= 0 || !tap.open(kRulerPoints)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(kRulerPoints - 1) * lab::kSampleRate / kRulerSize;
  static double power[kRulerPoints];
  for (int k = 0; k < kRulerPoints; ++k) power[k] = 0.0;
  const int places = count > kRulerSize ? kRulerPlaces : 1;
  for (int place = 0; place < places; ++place) {
    const int start = places > 1 ? static_cast<int>(static_cast<long long>(place) * (count - kRulerSize) / (places - 1)) : 0;
    for (int n = 0; n < kRulerSize; ++n) {
      const int i = start + n;
      ruler_re[n] = i < count ? x[i] * ruler_window[n] : 0.0f;
      ruler_im[n] = 0.0f;
    }
    ruler_fft.forward(ruler_re, ruler_im);
    for (int k = 0; k < kRulerPoints; ++k) {
      power[k] += static_cast<double>(ruler_re[k]) * ruler_re[k] + static_cast<double>(ruler_im[k]) * ruler_im[k];
    }
  }
  // As lab::spectrum: a sine of amplitude 1 leaves N / 4 in its bin.
  const double full = (kRulerSize / 4.0) * (kRulerSize / 4.0);
  for (int k = 0; k < kRulerPoints; ++k) {
    tap.set(k, lab::power_to_db(static_cast<float>(power[k] / (places * full))));
  }
}

// The loop played faster: every frequency in it times one number, which is
// a change of pitch. The number is the one that takes 110 Hz to 110 Hz plus
// the shift, so that a note at 110 Hz has its lowest partial moved to the
// same place by both. It stops at a tenth, since a pitch cannot be lowered
// through zero as a shift can.
float faster(int i, int frames) {
  const float ratio = kit::clamp((kRulerNote + shift.value + fine.value) / kRulerNote, 0.1f, 12.0f);
  const double at = std::fmod(static_cast<double>(i) * ratio, static_cast<double>(frames));
  const int whole = static_cast<int>(at);
  const float fraction = static_cast<float>(at - whole);
  const float* x = lab::in(0);
  const auto sample = [&](int n) { return x[((n % frames) + frames) % frames]; };
  return kit::hermite(sample(whole - 1), sample(whole), sample(whole + 1), sample(whole + 2), fraction);
}

// The lesson's meter: the mean square of one side of the output through two
// 30 ms one-poles, in dB. It never reads under -80 dB.
struct Meter {
  kit::OnePole smooth[2];

  void start() {
    for (kit::OnePole& stage : smooth) {
      stage.set_cutoff(1.0f / (kit::kTwoPi * 0.03f), lab::kSampleRate);
      stage.reset();
    }
  }
  float read(float x) {
    const float power = smooth[1].lowpass(smooth[0].lowpass(x * x));
    return power > 1.0e-8f ? 10.0f * std::log10(power) : -80.0f;
  }
};

Meter meter_left;
Meter meter_right;

}  // namespace

void lab_setup() {
  measure_pair();
  ruler_fft.init();
  for (int n = 0; n < kRulerSize; ++n) {
    ruler_window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kRulerSize));
  }
}

void lab_render(int frames) {
  using namespace freq_shifter;
  shifter.init(lab::kSampleRate);
  shifter.set_param(kShift, shift.value);
  shifter.set_param(kFine, fine.value);
  shifter.set_param(kMode, static_cast<float>(mode.choice()));
  shifter.set_param(kFeedback, feedback.value);
  shifter.set_param(kDelay, delay.value);
  shifter.set_param(kLfoRate, lfo_rate.value);
  shifter.set_param(kLfoDepth, lfo_depth.value);
  shifter.set_param(kTone, tone.value);
  shifter.set_param(kWidth, width.value);
  shifter.set_param(kMix, mix.value);

  // The build part: the chosen step, and the whole build that is held to the device.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;

  meter_left.start();
  meter_right.start();

  // Twenty milliseconds of the carrier, a tenth of a second into the loop
  // where the loop is long enough: the stretch the lesson's waves show.
  constexpr int kCarrierPoints = 960;
  const int carrier_points = frames < kCarrierPoints ? frames : kCarrierPoints;
  const int carrier_from = frames >= 4800 + kCarrierPoints ? 4800 : 0;
  lab::Tap* const carrier_taps[3] = {&cosine_tap, &sine_tap, &cosine_right};
  for (lab::Tap* tap : carrier_taps) {
    if (!tap->open(carrier_points)) continue;
    tap->x0 = static_cast<float>(carrier_from) * 1000.0f / lab::kSampleRate;
    tap->x1 = static_cast<float>(carrier_from + carrier_points - 1) * 1000.0f / lab::kSampleRate;
  }

  double difference = 0.0, reference = 0.0;
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    // What the device holds before the step is what it makes this sample from.
    const float phase = static_cast<float>(shifter.carrier_phase_);
    const float lfo = kit::SineTable::lookup(static_cast<float>(shifter.lfo_phase_));
    const float hz = shifter.meter(0);
    const float i_now = shifter.hilbert_[0].delayed_;
    const int written = shifter.delay_[0].write_;
    shifter.in_left()[0] = left;
    shifter.in_right()[0] = right;
    shifter.process(1);
    // Asleep on silence, the device steps nothing and writes zeros.
    const bool awake = shifter.delay_[0].write_ != written;
    const float out_left = shifter.out_left()[0];
    const float out_right = shifter.out_right()[0];

    const float cosine = kit::SineTable::cos_lookup(phase);
    const float sine = kit::SineTable::lookup(phase);
    const float in_phase_now = awake ? i_now : 0.0f;
    const float quadrature_now = awake ? shifter.hilbert_[0].b_[3].y1 : 0.0f;
    const float wrote = awake ? shifter.delay_[0].read(1) : 0.0f;

    in_tap.put(i, left, right);
    pitched.put(i, faster(i, frames));
    ring.put(i, left * cosine);
    // The first section of the pair keeps the last sample it was given.
    driven.put(i, awake ? shifter.hilbert_[0].a_[0].x1 : 0.0f);
    in_phase.put(i, in_phase_now);
    quadrature.put(i, quadrature_now);
    product_i.put(i, in_phase_now * cosine);
    product_q.put(i, quadrature_now * sine);
    upper.put(i, in_phase_now * cosine + quadrature_now * sine);
    lower.put(i, in_phase_now * cosine - quadrature_now * sine);
    wet_tap.put(i, wrote);
    back.put(i, awake ? kit::soft_clip(shifter.tone_[0].low) : 0.0f);
    const float loud_left = meter_left.read(out_left);
    const float loud_right = meter_right.read(out_right);
    out_tap.put(i, out_left, out_right);
    if (i % lab::kControlPeriod == 0) {
      lfo_tap.put(i, lfo);
      shift_now.put(i, hz);
      level_left.put(i, loud_left);
      level_right.put(i, loud_right);
    }

    const int p = i - frames - carrier_from;
    if (p >= 0 && p < carrier_points) {
      cosine_tap.set(p, cosine);
      sine_tap.set(p, sine);
      // Width turns the right side's carrier on by up to a quarter of a cycle.
      cosine_right.set(p, kit::SineTable::cos_lookup(phase + shifter.width_.value * 0.25f));
    }

    // The device's own line, freq_shifter.h, from the lab's readings.
    if (awake && i >= frames && i < 2 * frames) {
      const float d = shifter.direction_[0].value;
      const float makeup = 1.0f + (kit::kSqrtHalf * 2.0f - 1.0f) * (1.0f - d * d);
      const float wet = flush_denormal((in_phase_now * cosine + d * quadrature_now * sine) * makeup);
      const double error = static_cast<double>(wet) - static_cast<double>(wrote);
      difference += error * error;
      reference += static_cast<double>(wrote) * static_cast<double>(wrote);
    }

    // The build part, beside the device. At rest the device steps nothing
    // and puts out silence; the build stops with it.
    if (awake) {
      shown.run(left, right);
      held.run(left, right);
    } else {
      shown.rest();
      held.rest();
    }
    if (i >= frames) {
      const double apart_left = static_cast<double>(held.out[0]) - out_left;
      const double apart_right = static_cast<double>(held.out[1]) - out_right;
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
    }
    built.put(i, shown.out[0], shown.out[1]);
    built_quadrature.put(i, awake && shown.pieces >= Built::kPair ? shown.second[0] : 0.0f);
    built_first.put(i, awake && shown.pieces >= Built::kCarrier ? shown.first[0] * shown.cosine[0] : 0.0f);
    built_second.put(i, awake && shown.pieces >= Built::kCarrier ? shown.second[0] * shown.sine[0] : 0.0f);
    built_back.put(i, awake && shown.pieces >= Built::kFeedback ? shown.returned[0] : 0.0f);
  }
  rebuilt.value = lab::ratio_db(difference, reference);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.channel(0), frames);

  ruler(ruler_in, in_tap.channel(0), frames);
  ruler(ruler_pitched, pitched.channel(0), frames);
  ruler(ruler_ring, ring.channel(0), frames);
  ruler(ruler_out, out_tap.channel(0), frames);

  phase_curve(phase_i, phase_i_points);
  phase_curve(phase_q, phase_q_points);
  phase_curve(phase_difference, difference_points);
  quarter_error.value = quarter_error_found;
}
