// Frequency shifting: the Frequency Shifter (cpp/devices/freq-shifter)
// run one sample at a time, and the kit's pair of all-pass chains
// (cpp/kit/hilbert.h) measured by itself.
//
//   in ──(+)──► pair ──► I ──× cos ──┐
//         ▲          └──► Q ──× sin ──(±)──► wet ──► mix ──► out
//         │                                  │
//         └── feedback ◄─ limit ◄─ tone ◄─ delay ◄┘
//
// Read from the device: the pair's two outputs (the in-phase one is the
// pair's `delayed_` before the step, the quadrature one the last output of
// its second chain), what comes back round the feedback loop (the tone
// filter's state, through the kit's limiter), and the output.
// Computed by the kit: the carrier's cosine and sine (and the right side's
// cosine, which Width turns), looked up in the kit's table at the phase the
// device holds before the step; and the phase of each chain against
// frequency, from the impulse responses of a kit::Hilbert.
// Written for the lesson: a plain ring modulator (the input times the same
// cosine), the two products, and both side bands. The device keeps only the
// side band its mode asks for, in its delay line, so the lab works that one
// out again from the pair and the carrier and reports how far it lands from
// what the device wrote (the "rebuilt" check).
//
// The lab starts with the feedback, the LFO, the width and the fine shift at
// zero and the mix fully wet, so the shift itself shows. Each is a control.
// The LFO's rate and the tone filter stay at the device's defaults.

#include "lab.h"

#include "../../cpp/devices/freq-shifter/freq_shifter.h"

using namespace livemix;

namespace {

FreqShifter shifter;
kit::Hilbert pair;  // the kit's pair by itself, for its phase against frequency

lab::Control shift{"shift", "Shift", "Hz", -1000.0f, 1000.0f, 100.0f};
lab::Control fine{"fine", "Fine", "Hz", -10.0f, 10.0f, 0.0f};
lab::Control mode{"mode", "Mode", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Up|Down|Stereo|Ring"};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 0.98f, 0.0f};
lab::Control delay{"delay", "Delay", "ms", 1.0f, 500.0f, 45.0f, lab::kLog};
lab::Control lfo_depth{"lfoDepth", "LFO depth", "", 0.0f, 1.0f, 0.0f};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 0.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap ring{"ring", "Input times a cosine", lab::kAudio, lab::kLesson, 1};
lab::Tap in_phase{"inPhase", "In-phase", lab::kAudio, lab::kDevice, 1};
lab::Tap quadrature{"quadrature", "Quadrature", lab::kAudio, lab::kDevice, 1};
lab::Tap cosine_tap{"cosine", "Carrier, cosine", lab::kCurve, lab::kKit, 1};
lab::Tap sine_tap{"sine", "Carrier, sine", lab::kCurve, lab::kKit, 1};
lab::Tap cosine_right{"cosineRight", "Right carrier, cosine", lab::kCurve, lab::kKit, 1};
lab::Tap product_i{"productI", "In-phase times cosine", lab::kAudio, lab::kLesson, 1};
lab::Tap product_q{"productQ", "Quadrature times sine", lab::kAudio, lab::kLesson, 1};
lab::Tap upper{"upper", "Upper side band", lab::kAudio, lab::kLesson, 1};
lab::Tap lower{"lower", "Lower side band", lab::kAudio, lab::kLesson, 1};
lab::Tap back{"back", "Back from the delay", lab::kAudio, lab::kDevice, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap picture{"picture", "Output, over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Tap phase_i{"phaseI", "In-phase chain", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap phase_q{"phaseQ", "Quadrature chain", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap phase_difference{"phaseDifference", "Quadrature ahead of in-phase", lab::kCurve, lab::kKit, 1, "°"};

lab::Check rebuilt{"rebuilt", "The side band worked out again, against what the device wrote to its delay", "dB"};
lab::Check quarter_error{"quarterError", "The pair's furthest from a quarter turn, 22 Hz to 23,978 Hz", "°"};

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

}  // namespace

void lab_setup() { measure_pair(); }

void lab_render(int frames) {
  using namespace freq_shifter;
  shifter.init(lab::kSampleRate);
  shifter.set_param(kShift, shift.value);
  shifter.set_param(kFine, fine.value);
  shifter.set_param(kMode, static_cast<float>(mode.choice()));
  shifter.set_param(kFeedback, feedback.value);
  shifter.set_param(kDelay, delay.value);
  shifter.set_param(kLfoDepth, lfo_depth.value);
  shifter.set_param(kWidth, width.value);
  shifter.set_param(kMix, mix.value);

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
    const float i_now = shifter.hilbert_[0].delayed_;
    const int written = shifter.delay_[0].write_;
    shifter.in_left()[0] = left;
    shifter.in_right()[0] = right;
    shifter.process(1);
    // Asleep on silence, the device steps nothing and writes zeros.
    const bool awake = shifter.delay_[0].write_ != written;

    const float cosine = kit::SineTable::cos_lookup(phase);
    const float sine = kit::SineTable::lookup(phase);
    const float in_phase_now = awake ? i_now : 0.0f;
    const float quadrature_now = awake ? shifter.hilbert_[0].b_[3].y1 : 0.0f;

    in_tap.put(i, left, right);
    ring.put(i, left * cosine);
    in_phase.put(i, in_phase_now);
    quadrature.put(i, quadrature_now);
    product_i.put(i, in_phase_now * cosine);
    product_q.put(i, quadrature_now * sine);
    upper.put(i, in_phase_now * cosine + quadrature_now * sine);
    lower.put(i, in_phase_now * cosine - quadrature_now * sine);
    back.put(i, awake ? kit::soft_clip(shifter.tone_[0].low) : 0.0f);
    out_tap.put(i, shifter.out_left()[0], shifter.out_right()[0]);

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
      const float wrote = shifter.delay_[0].read(1);
      const double error = static_cast<double>(wet) - static_cast<double>(wrote);
      difference += error * error;
      reference += static_cast<double>(wrote) * static_cast<double>(wrote);
    }
  }
  rebuilt.value = lab::ratio_db(difference, reference);

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.channel(0), frames);

  phase_curve(phase_i, phase_i_points);
  phase_curve(phase_q, phase_q_points);
  phase_curve(phase_difference, difference_points);
  quarter_error.value = quarter_error_found;
}
