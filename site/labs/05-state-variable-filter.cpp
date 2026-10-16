// Lesson 5, the state-variable filter: the kit's Svf (cpp/kit/filters.h) run
// one sample at a time beside the Auto Filter (cpp/devices/auto-filter), so
// all three of its outputs can be read as it works.
//
//                  ┌──────────── k × band ◄───────────┐
//                  │  ┌──────────── low ◄─────────────┼────────────┐
//                  ▼  ▼                               │            │
//   in ──► ( in − k·band − low ) ──► integrate ───────┴─► integrate ┴─► low
//                  │                    band
//                  └─► high
//
// Which filter each stage comes from:
//
// - High, band, low and notch are the kit's Svf at the sample rate. It is
//   ticked with its own notch(), which returns low + high, and its three
//   outputs are then read out of it. Band is band × k, what its bandpass()
//   returns. Peak (low − high) is a sum the kit has no function for, so it is
//   the lesson's.
// - The output is the Auto Filter itself. That device does not use the kit's
//   Svf: it carries a filter stage of its own (SvfTptTone.h), the same
//   arithmetic with an exact tangent, and runs it at twice the sample rate
//   between two of the kit's half-band converters, 31 samples late. The
//   "sameStage" check runs the device's stage type at the kit's rate beside
//   the kit's and reports how far apart the two land.
// - The cutoff the kit's filter stands at on every sample is the device's:
//   its knob, moved by its own envelope follower and oscillator. Both start
//   at zero, so the filter stands still until the reader asks otherwise.
//
// Two more filters run for contrast. The loop written the obvious way, with
// last sample's feedback ("late"), is the lesson's, and is only measured,
// never heard: it blows up. The kit's Biquad, the same low-pass as a direct
// form, follows the same cutoff, and only its level is kept.

#include "lab.h"

#include "../../cpp/devices/auto-filter/auto_filter.h"

using namespace livemix;
namespace p = livemix::auto_filter;

namespace {

AutoFilter device;
AutoFilter probe;  // a second device, for the response to one unit sample

kit::Svf svf[2];
kit::Svf ringer;     // a third, for the kit's response to one unit sample
kit::Biquad direct;  // the same low-pass as a direct form, on the same cutoff

// The device's own filter stage and its coefficients, by the types of the
// members that hold them.
decltype(AutoFilter::stage1_) twin;
decltype(AutoFilter::coeffs_) twin_coeffs;

// The ranges and the starting values are the device's own (params.gen.h).
lab::Control cutoff{"cutoff",         "Cutoff", "Hz", p::kParamMin[p::kCutoffHz], p::kParamMax[p::kCutoffHz],
                    p::kParamDefault[p::kCutoffHz], lab::kLog};
lab::Control resonance{"resonance",  "Resonance", "Q", p::kParamMin[p::kResonance], p::kParamMax[p::kResonance],
                       p::kParamDefault[p::kResonance], lab::kLog};
lab::Control type{"type", "Type", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "Low-pass|High-pass|Band-pass|Notch|Peak"};
lab::Control slope{"slope", "Slope", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "12 dB|24 dB"};
lab::Control lfo_amount{"lfoAmount", "Oscillator amount", "%", 0.0f, 100.0f, 0.0f};
lab::Control lfo_rate{"lfoRate", "Oscillator rate", "Hz", 0.01f, 20.0f, 1.0f, lab::kLog};
// Four of the device's six shapes (it has a rising and a falling saw too).
lab::Control lfo_shape{"lfoShape", "Oscillator shape", "", 0.0f, 3.0f, 0.0f, lab::kLinear,
                       "Sine|Triangle|Square|Random"};
constexpr int kShapes[4] = {AutoFilter::kSine, AutoFilter::kTriangle, AutoFilter::kSquare, AutoFilter::kSampleHold};
lab::Control env_amount{"envAmount", "Envelope amount", "%", -100.0f, 100.0f, 0.0f};
lab::Control drive{"drive", "Drive", "dB", 0.0f, 24.0f, 0.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap lfo_tap{"lfo", "Oscillator", lab::kControl, lab::kDevice, 1};
lab::Tap envelope_tap{"envelope", "Envelope", lab::kControl, lab::kDevice, 1};
lab::Tap sweep{"sweep", "Cutoff, in octaves from the knob", lab::kControl, lab::kDevice, 1, "oct"};
lab::Tap high{"high", "High-pass", lab::kAudio, lab::kKit, 2};
lab::Tap band{"band", "Band-pass", lab::kAudio, lab::kKit, 2};
lab::Tap low{"low", "Low-pass", lab::kAudio, lab::kKit, 2};
lab::Tap notch{"notch", "Notch: low + high", lab::kAudio, lab::kKit, 2};
lab::Tap peak{"peak", "Peak: low − high", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "The device's output", lab::kAudio, lab::kDevice, 2};

lab::Tap svf_level{"svfLevel", "The kit's state-variable low-pass, largest sample", lab::kControl, lab::kKit, 1, "dB"};
lab::Tap direct_level{"directLevel", "The kit's direct-form low-pass, largest sample", lab::kControl, lab::kKit, 1, "dB"};

lab::Tap low_response{"lowResponse", "Low-pass", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap band_response{"bandResponse", "Band-pass", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap high_response{"highResponse", "High-pass", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap notch_response{"notchResponse", "Notch", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap peak_response{"peakResponse", "Peak", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap device_response{"deviceResponse", "The device", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap one_stage_response{"oneStageResponse", "One stage of the kit's filter at 48 kHz, same type", lab::kSpectrum,
                            lab::kLesson, 1, "dB"};

lab::Tap tuned{"tuned", "The kit's band-pass, Q of 4", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap plain_tuned{"plainTuned", "The kit's loop without the tangent", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap late_tuned{"lateTuned", "The late loop", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap ring{"ring", "The kit's low-pass after one unit sample", lab::kCurve, lab::kKit, 1};
lab::Tap late_ring{"lateRing", "The late loop: last sample's feedback", lab::kCurve, lab::kLesson, 1};

lab::Tap picture{"picture", "The device's output", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check sum{"sum", "Low + k × band + high, against the input", "dB"};
lab::Check formula{"formula", "The three measured responses against the formulas, at worst", "dB"};
lab::Check late_over{"lateOver", "The largest sample of the late loop's ring, over the largest of the kit's", "dB"};
lab::Check direct_apart{"directApart", "The direct form's low-pass against the state-variable one", "dB"};
lab::Check same_stage{"sameStage", "The device's own filter stage at 48 kHz, against the kit's", "dB"};

constexpr int kMaxRing = 16384;   // the longest response kept, in samples
constexpr int kMinRing = 1024;
constexpr int kDeviceExtra = 96;  // room for the device's 31 samples and its converters' tails
constexpr int kRingShown = 576;   // 12 ms: what the picture of the ringing shows
constexpr int kTunedPoints = 241; // across the two octaves around the cutoff
constexpr float kTunedQ = 4.0f;   // the Q the close-up of the band-pass is measured at
constexpr int kLevelHold = 480;   // 10 ms: how long a level trace holds its largest sample
constexpr float kBlownUp = 1.0e6f;

float ring_low[kMaxRing];
float ring_band[kMaxRing];
float ring_high[kMaxRing];
float ring_sum[kMaxRing];
float late_low[kMaxRing];
float tuned_kit[kMaxRing];
float tuned_plain[kMaxRing];
float tuned_late[kMaxRing];
float ring_device[kMaxRing + kDeviceExtra];

// Two integrators in a loop, written the obvious way: each adds its input
// times w = 2 pi f / fs, and the feedback is what last sample left behind.
struct LateLoop {
  float low = 0.0f;
  float band = 0.0f;
  float high = 0.0f;
  float w = 0.0f;
  float k = 1.0f;

  void set(float hz, float q) {
    w = kit::kTwoPi * hz / lab::kSampleRate;
    k = 1.0f / q;
  }
  void process(float x) {
    high = x - k * band - low;
    band += w * high;
    low += w * band;
  }
};

void configure(AutoFilter& d, bool moving) {
  d.init(lab::kSampleRate);
  d.set_param(p::kType, type.value);
  d.set_param(p::kSlope, slope.value);
  d.set_param(p::kCutoffHz, cutoff.value);
  d.set_param(p::kResonance, resonance.value);
  d.set_param(p::kDriveDb, moving ? drive.value : 0.0f);
  d.set_param(p::kEnvAmount, moving ? env_amount.value : 0.0f);
  d.set_param(p::kLfoAmount, moving ? lfo_amount.value : 0.0f);
  d.set_param(p::kLfoRateHz, lfo_rate.value);
  d.set_param(p::kLfoShape, static_cast<float>(kShapes[kit::clamp_int(lfo_shape.choice(), 0, 3)]));
  d.set_param(p::kMix, 1.0f);
}

// The device's oscillator and envelope as they stand. Asleep (50 ms after
// the input stops) the device keeps both on paper and catches up on waking:
// this is the same sum its meter() does.
float oscillator_now(const AutoFilter& d) {
  double phase = d.lfo_phase_ + static_cast<double>(d.lfo_rate_.target) * d.slept_ / d.sample_rate();
  phase -= std::floor(phase);
  const int shape = kit::clamp_int(static_cast<int>(d.param(p::kLfoShape) + 0.5f), 0, AutoFilter::kNumLfoShapes - 1);
  return AutoFilter::lfo_value(shape, static_cast<float>(phase), d.lfo_held_);
}

float envelope_now(const AutoFilter& d) {
  float envelope = d.envelope_;
  if (d.slept_ > 0.0) {
    envelope *= static_cast<float>(std::exp(d.slept_ * std::log1p(-static_cast<double>(d.release_coeff_))));
  }
  return kit::min(1.0f, envelope);
}

// How many samples of ringing to keep. The ring's envelope falls by a factor
// of e every Q / (pi f) seconds; 14 of those is 120 dB.
int ring_length(float hz, float q, bool* cut) {
  const float wanted = 14.0f * lab::kSampleRate * q / (kit::kPi * hz);
  *cut = wanted > static_cast<float>(kMaxRing);
  if (*cut) return kMaxRing;
  return wanted < static_cast<float>(kMinRing) ? kMinRing : static_cast<int>(wanted);
}

// The response formulas at `hz`, for a filter whose integrators have gain g:
// w is the frequency as the filter sees it, in units of its cutoff.
void formulas(float hz, float g, float k, float* low_db, float* band_db, float* high_db) {
  const double w = std::tan(lab::kPi * hz / lab::kSampleRate) / g;
  const double w2 = w * w;
  const double bottom = (1.0 - w2) * (1.0 - w2) + static_cast<double>(k) * k * w2;
  *low_db = lab::power_to_db(static_cast<float>(1.0 / bottom));
  *band_db = lab::power_to_db(static_cast<float>(static_cast<double>(k) * k * w2 / bottom));
  *high_db = lab::power_to_db(static_cast<float>(w2 * w2 / bottom));
}

// A ring too long to keep whole (a high Q at a low cutoff) is faded out over
// its last quarter, so the cut does not ripple the curves made from it. A
// peak then reads low, and the "formula" check says by how much.
void fade_out(float* ring, int count) {
  const int from = count - count / 4;
  for (int i = from; i < count; ++i) {
    ring[i] *= 0.5f + 0.5f * std::cos(kit::kPi * static_cast<float>(i - from) / static_cast<float>(count - from));
  }
}

// The band-pass close up: an octave either side of the cutoff, against
// frequency in units of the cutoff, as far up as half the sample rate. It is
// measured at a Q of 4 whatever the resonance is set to, so that there is a
// peak to see: the kit's filter, the kit's loop with the tangent left out,
// and the late loop.
void measure_tuning(float hz) {
  bool cut = false;
  const int count = ring_length(hz, kTunedQ, &cut);
  kit::Svf sharp;
  sharp.set(hz, kTunedQ, lab::kSampleRate);
  // g = pi f / fs, and the three numbers made from g worked out again as
  // Svf::set does.
  kit::Svf plain;
  plain.set(hz, kTunedQ, lab::kSampleRate);
  plain.g = kit::kPi * hz / lab::kSampleRate;
  plain.a1 = 1.0f / (1.0f + plain.g * (plain.g + plain.k));
  plain.a2 = plain.g * plain.a1;
  plain.a3 = plain.g * plain.a2;
  LateLoop late;
  late.set(hz, kTunedQ);
  bool blown = false;
  for (int i = 0; i < count; ++i) {
    const float x = i == 0 ? 1.0f : 0.0f;
    sharp.process(x);
    plain.process(x);
    tuned_kit[i] = sharp.band * sharp.k;
    tuned_plain[i] = plain.band * plain.k;
    if (!blown) late.process(x);
    if (!(std::fabs(late.band) < kBlownUp)) blown = true;
    tuned_late[i] = blown ? 0.0f : late.band * late.k;
  }
  if (cut) {
    fade_out(tuned_kit, count);
    fade_out(tuned_plain, count);
    fade_out(tuned_late, count);
  }
  const float top = kit::min(2.0f, 0.49f * lab::kSampleRate / hz);
  lab::response_tap(tuned, tuned_kit, count, kTunedPoints, 0.5f * hz, top * hz);
  lab::response_tap(plain_tuned, tuned_plain, count, kTunedPoints, 0.5f * hz, top * hz);
  lab::response_tap(late_tuned, tuned_late, count, kTunedPoints, 0.5f * hz, top * hz);
  tuned.x0 = plain_tuned.x0 = late_tuned.x0 = 0.5f;
  tuned.x1 = plain_tuned.x1 = late_tuned.x1 = top;
}

// Everything that depends on the controls alone: one unit sample through the
// kit's filter, through the late loop and through a second device, each with
// the cutoff standing still, and the responses those give.
void measure() {
  const float hz = cutoff.value;
  const float q = resonance.value;
  bool cut = false;
  const int count = ring_length(hz, q, &cut);

  ringer.reset();
  ringer.set(hz, q, lab::kSampleRate);
  LateLoop late;
  late.set(hz, q);
  bool blown = false;
  float late_peak = 0.0f;
  for (int i = 0; i < kMaxRing; ++i) {
    const float x = i == 0 ? 1.0f : 0.0f;
    if (i < count) {
      ringer.process(x);
      ring_low[i] = ringer.low;
      ring_band[i] = ringer.band * ringer.k;
      ring_high[i] = ringer.high;
    } else {
      ring_low[i] = ring_band[i] = ring_high[i] = 0.0f;
    }
    if (i < count && !blown) {
      late.process(x);
      const float size = std::fabs(late.low) > std::fabs(late.band) ? std::fabs(late.low) : std::fabs(late.band);
      if (!(size < kBlownUp)) blown = true;
      late_low[i] = kit::clamp(late.low, -kBlownUp, kBlownUp);
      if (std::fabs(late_low[i]) > late_peak) late_peak = std::fabs(late_low[i]);
    } else {
      late_low[i] = 0.0f;
    }
  }
  if (cut) {
    fade_out(ring_low, count);
    fade_out(ring_band, count);
    fade_out(ring_high, count);
  }

  lab::response_tap(low_response, ring_low, count);
  lab::response_tap(band_response, ring_band, count);
  lab::response_tap(high_response, ring_high, count);
  for (int i = 0; i < count; ++i) ring_sum[i] = ring_low[i] + ring_high[i];
  lab::response_tap(notch_response, ring_sum, count);
  for (int i = 0; i < count; ++i) ring_sum[i] = ring_low[i] - ring_high[i];
  lab::response_tap(peak_response, ring_sum, count);

  // Measured against written, wherever the formula is above -60 dB.
  float worst = 0.0f;
  if (low_response.data && band_response.data && high_response.data) {
    const int points = low_response.length;
    for (int point = 0; point < points; ++point) {
      const float at = 20.0f * std::pow(1000.0f, static_cast<float>(point) / static_cast<float>(points - 1));
      float written[3];
      formulas(at, ringer.g, ringer.k, &written[0], &written[1], &written[2]);
      const float measured[3] = {low_response.data[point], band_response.data[point], high_response.data[point]};
      for (int which = 0; which < 3; ++which) {
        if (written[which] < -60.0f) continue;
        const float error = std::fabs(measured[which] - written[which]);
        if (error > worst) worst = error;
      }
    }
  }
  formula.value = worst;

  measure_tuning(hz);

  // The first 12 ms of each low-pass. The late loop is drawn no taller than
  // four times the kit's, however far it has run away.
  const float kit_peak = lab::peak(ring_low, count);
  if (ring.open(kRingShown) && late_ring.open(kRingShown)) {
    ring.x0 = late_ring.x0 = 0.0f;
    ring.x1 = late_ring.x1 = 1000.0f * static_cast<float>(kRingShown - 1) / lab::kSampleRate;
    for (int i = 0; i < kRingShown; ++i) {
      ring.set(i, ring_low[i]);
      late_ring.set(i, kit::clamp(late_low[i], -4.0f * kit_peak, 4.0f * kit_peak));
    }
  }
  late_over.value = lab::to_db(late_peak) - lab::to_db(kit_peak);

  // One unit sample through a second device: no drive, nothing moving.
  configure(probe, false);
  const int device_count = count + kDeviceExtra;
  for (int offset = 0; offset < device_count; offset += 256) {
    const int n = device_count - offset < 256 ? device_count - offset : 256;
    if (offset == 0) {
      probe.in_left()[0] = 1.0f;
      probe.in_right()[0] = 1.0f;
    }
    probe.process(n);
    for (int i = 0; i < n; ++i) ring_device[offset + i] = probe.out_left()[i];
  }
  lab::response_tap(device_response, ring_device, device_count);

  // The same type from one stage of the kit's filter, for the device's
  // response to be drawn against.
  lab::Tap* const by_type[5] = {&low_response, &high_response, &band_response, &notch_response, &peak_response};
  const lab::Tap& same = *by_type[kit::clamp_int(type.choice(), 0, 4)];
  if (same.data && one_stage_response.open(same.length)) {
    one_stage_response.x0 = same.x0;
    one_stage_response.x1 = same.x1;
    one_stage_response.scale = same.scale;
    for (int point = 0; point < same.length; ++point) one_stage_response.set(point, same.data[point]);
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(device, true);
  for (int c = 0; c < 2; ++c) {
    svf[c].reset();
    twin[c].reset();
  }
  direct.reset();
  direct.set_identity();

  const float q = resonance.value;
  float hz = cutoff.value;
  float last_hz = -1.0f;
  float last_pitch = -1.0f;
  float svf_top = 0.0f;
  float direct_top = 0.0f;
  float svf_held = -100.0f;
  float direct_held = -100.0f;
  double sum_apart = 0.0, sum_in = 0.0;
  double direct_diff = 0.0, direct_ref = 0.0;
  double twin_diff = 0.0, twin_ref = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);

    // The cutoff the device stands at on this sample: its knob, moved by its
    // envelope and its oscillator. Every other filter here follows it.
    // (Its meter() is asked again only when the device has moved it, or is
    // asleep and keeping it on paper.)
    if (device.slept_ > 0.0 || device.last_pitch_ != last_pitch) {
      last_pitch = device.last_pitch_;
      hz = device.meter(0);
    }
    if (hz != last_hz) {
      last_hz = hz;
      svf[0].set(hz, q, lab::kSampleRate);
      svf[1].set(hz, q, lab::kSampleRate);
      direct.set_lowpass(hz, q, lab::kSampleRate);
      twin_coeffs = decltype(twin_coeffs)::make(hz, q, lab::kSampleRate);
    }

    // The kit's filter: one tick, and all three outputs are there to read.
    const float notch_left = svf[0].notch(left);
    const float notch_right = svf[1].notch(right);
    const float k = svf[0].k;

    in_tap.put(i, left, right);
    high.put(i, svf[0].high, svf[1].high);
    band.put(i, svf[0].band * k, svf[1].band * k);
    low.put(i, svf[0].low, svf[1].low);
    notch.put(i, notch_left, notch_right);
    peak.put(i, svf[0].low - svf[0].high, svf[1].low - svf[1].high);
    out_tap.put(i, device.out_left()[0], device.out_right()[0]);

    // The direct form and the device's own stage, on the left channel.
    const float direct_low = direct.process(left);
    const auto stage = twin[0].process(left, twin_coeffs);

    if (std::fabs(svf[0].low) > svf_top) svf_top = std::fabs(svf[0].low);
    if (std::fabs(direct_low) > direct_top) direct_top = std::fabs(direct_low);
    if (i % kLevelHold == kLevelHold - 1) {
      // The largest sample of the last 10 ms, in dB, held for the next 10.
      svf_held = kit::max(-100.0f, lab::to_db(svf_top));
      direct_held = kit::max(-100.0f, lab::to_db(direct_top));
      svf_top = direct_top = 0.0f;
    }
    if (i % lab::kControlPeriod == 0) {
      svf_level.put(i, svf_held);
      direct_level.put(i, direct_held);
      lfo_tap.put(i, oscillator_now(device));
      envelope_tap.put(i, envelope_now(device));
      sweep.put(i, std::log2(hz / cutoff.value));
    }

    if (i >= frames && i < 2 * frames) {
      const double apart = static_cast<double>(svf[0].low) + static_cast<double>(k) * svf[0].band + svf[0].high - left;
      sum_apart += apart * apart;
      sum_in += static_cast<double>(left) * left;
      const double from_direct = static_cast<double>(direct_low) - svf[0].low;
      direct_diff += from_direct * from_direct;
      direct_ref += static_cast<double>(svf[0].low) * svf[0].low;
      const double d_low = static_cast<double>(stage.low) - svf[0].low;
      const double d_band = static_cast<double>(stage.band) - svf[0].band;
      const double d_high = static_cast<double>(stage.high) - svf[0].high;
      twin_diff += d_low * d_low + d_band * d_band + d_high * d_high;
      twin_ref += static_cast<double>(svf[0].low) * svf[0].low + static_cast<double>(svf[0].band) * svf[0].band +
                  static_cast<double>(svf[0].high) * svf[0].high;
    }
  }

  sum.value = lab::ratio_db(sum_apart, sum_in);
  direct_apart.value = lab::ratio_db(direct_diff, direct_ref);
  same_stage.value = lab::ratio_db(twin_diff, twin_ref);

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.channel(0), frames);
  measure();
}
