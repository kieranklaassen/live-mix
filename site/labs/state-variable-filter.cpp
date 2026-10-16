// The state-variable filter: the kit's Svf (cpp/kit/filters.h) run
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
//   its Cutoff, moved by its own envelope follower and oscillator. Both start
//   at zero, so the filter stands still until the reader asks otherwise.
// - The controls are the device's twelve parameters, with its own ranges and
//   starting values (params.gen.h).
//
// Three more filters run for contrast. The kit's one-pole low-pass, the
// filter of the lesson before this one, follows the same cutoff and is heard.
// The loop written the obvious way, with last sample's feedback ("late"), is
// the lesson's, and is only measured, never heard: it blows up. The kit's
// Biquad, the same low-pass as a direct form, follows the same cutoff, and
// only its level is kept.
//
// The build part puts the filter together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has five pieces, each a
// function of `Loop` or `Built` below, in the order the steps add them: one
// integrator in a loop; a second integrator, with a fixed brake; the brake as
// Resonance; the outputs, weighed by Type; and the cutoff moved on every
// sample by the device's own envelope and oscillator. The path writes the
// "built" taps and leaves every other tap as it was. Two copies of it run: one
// at the step the reader chose, which is what the taps show, and one with all
// five pieces, whose three outputs are compared on every render with the
// kit's Svf on the same moving cutoff (the "builtDifference" check). The
// build writes the loop's sum with its division in the line, and the kit does
// the division once when the filter is set and multiplies by what it kept, so
// the two round differently: by the last bits of a sample at most settings,
// and by more where the loop rings longest (see the bound, at `build`). A
// third copy takes one unit sample, for the curve of the step.

#include "lab.h"

#include "../../cpp/devices/auto-filter/auto_filter.h"

using namespace livemix;
namespace p = livemix::auto_filter;

namespace {

AutoFilter device;
AutoFilter probe;  // a second device, for the response to one unit sample

kit::Svf svf[2];
kit::Svf ringer;       // a third, for the kit's response to one unit sample
kit::Biquad direct;    // the same low-pass as a direct form, on the same cutoff
kit::OnePole pole[2];  // one pole on the same cutoff: the filter of the lesson before

// The device's own filter stage and its coefficients, by the types of the
// members that hold them.
decltype(AutoFilter::stage1_) twin;
decltype(AutoFilter::coeffs_) twin_coeffs;

// The device's twelve parameters. The ranges and the starting values are its
// own (params.gen.h), and so are the choices, in its order.
lab::Control cutoff{"cutoff",         "Cutoff", "Hz", p::kParamMin[p::kCutoffHz], p::kParamMax[p::kCutoffHz],
                    p::kParamDefault[p::kCutoffHz], lab::kLog};
lab::Control resonance{"resonance",  "Resonance", "Q", p::kParamMin[p::kResonance], p::kParamMax[p::kResonance],
                       p::kParamDefault[p::kResonance], lab::kLog};
lab::Control type{"type", "Type", "", 0.0f, 4.0f, 0.0f, lab::kLinear, "Low-pass|High-pass|Band-pass|Notch|Peak"};
lab::Control slope{"slope", "Slope", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "12 dB|24 dB"};
lab::Control lfo_amount{"lfoAmount",  "Oscillator amount", "%", p::kParamMin[p::kLfoAmount],
                        p::kParamMax[p::kLfoAmount], p::kParamDefault[p::kLfoAmount]};
lab::Control lfo_rate{"lfoRate",     "Oscillator rate", "Hz", p::kParamMin[p::kLfoRateHz], p::kParamMax[p::kLfoRateHz],
                      p::kParamDefault[p::kLfoRateHz], lab::kLog};
lab::Control lfo_shape{"lfoShape", "Oscillator shape", "", 0.0f, 5.0f, 0.0f, lab::kLinear,
                       "Sine|Triangle|Rising saw|Falling saw|Square|Random steps"};
lab::Control env_amount{"envAmount",  "Envelope amount", "%", p::kParamMin[p::kEnvAmount],
                        p::kParamMax[p::kEnvAmount], p::kParamDefault[p::kEnvAmount]};
lab::Control env_attack{"envAttack",    "Envelope attack", "ms", p::kParamMin[p::kEnvAttackMs],
                        p::kParamMax[p::kEnvAttackMs], p::kParamDefault[p::kEnvAttackMs], lab::kLog};
lab::Control env_release{"envRelease",    "Envelope release", "ms", p::kParamMin[p::kEnvReleaseMs],
                         p::kParamMax[p::kEnvReleaseMs], p::kParamDefault[p::kEnvReleaseMs], lab::kLog};
lab::Control drive{"drive", "Drive", "dB", p::kParamMin[p::kDriveDb], p::kParamMax[p::kDriveDb],
                   p::kParamDefault[p::kDriveDb]};
lab::Control mix{"mix", "Mix", "", p::kParamMin[p::kMix], p::kParamMax[p::kMix], p::kParamDefault[p::kMix]};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap envelope_tap{"envelope", "Envelope", lab::kControl, lab::kDevice, 1};
lab::Tap lfo_tap{"lfo", "Oscillator", lab::kControl, lab::kDevice, 1};
lab::Tap sweep{"sweep", "Cutoff, in octaves from where it is set", lab::kControl, lab::kDevice, 1, "oct"};
lab::Tap one_pole{"onePole", "One-pole low-pass", lab::kAudio, lab::kKit, 2};
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
lab::Tap one_pole_response{"onePoleResponse", "One pole", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap two_pole_response{"twoPoleResponse", "Two one-poles in a row", lab::kSpectrum, lab::kKit, 1, "dB"};
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

lab::Tap built{"built", "The filter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_high{"builtHigh", "High, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_band{"builtBand", "Band, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_low{"builtLow", "Low, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_cutoff{"builtCutoff", "The build's cutoff, in octaves from where it is set", lab::kControl,
                      lab::kLesson, 1, "oct"};
lab::Tap built_response{"builtResponse", "The filter so far", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap built_before{"builtBefore", "One step back", lab::kSpectrum, lab::kLesson, 1, "dB"};

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

// The k the kit's filter starts with (cpp/kit/filters.h): a Q of 0.7071, the
// most brake that leaves no sag at the cutoff and the least that leaves no bump.
constexpr float kFlatBrake = 1.4142f;

// One channel of the filter so far: two memories, and the three sounds the
// loop holds on this sample.
struct Loop {
  float s1 = 0.0f;  // the first integrator's total, as it stands before this sample
  float s2 = 0.0f;  // the second's
  float low = 0.0f;
  float band = 0.0f;
  float high = 0.0f;

  // One integrator in a loop. An integrator is a running total: on each
  // sample it adds g times what it is fed. Here it is fed the input less its
  // own output, so the total stops moving once it has caught the input up.
  // The output stands on both sides of that sentence, low = s1 + g * (x - low),
  // so the line is the sentence solved for it.
  void one(float x, float g) {
    low = (s1 + g * x) / (1.0f + g);
    high = x - low;
    s1 = flush_denormal(2.0f * low - s1);
  }

  // Two integrators in a loop. The first is fed what is left of the input
  // once both outputs are taken away, high = x - k * band - low, and its
  // total is band. The second is fed band, and its total is low. Each of the
  // three needs the other two, so the first line is the three solved for
  // band; low and high then follow from it.
  void two(float x, float g, float k) {
    band = (s1 + g * (x - s2)) / (1.0f + g * (g + k));
    low = s2 + g * band;
    high = x - k * band - low;
    s1 = flush_denormal(2.0f * band - s1);
    s2 = flush_denormal(2.0f * low - s2);
  }

  void reset() { s1 = s2 = low = band = high = 0.0f; }
};

// The filter so far: the pieces there are, and run() to take a sample of
// both channels through them.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kOne = 0, kTwo, kBrake, kOutputs, kMoving };

  int pieces = kOne;
  Loop loop[2];
  float g = 0.0f;          // how far an integrator's total moves for what it is fed
  float k = kFlatBrake;    // the brake: how much of band is taken away from the input
  float hz = 0.0f;         // where the cutoff stands on this sample
  float out[2] = {0.0f, 0.0f};

  // The cutoff as an integrator's gain: the kit's own tangent of the kit's
  // own angle, pi times the cutoff over the sample rate.
  void tune(float cutoff_hz) {
    if (cutoff_hz == hz) return;
    hz = cutoff_hz;
    g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, lab::kSampleRate * 0.49f) / lab::kSampleRate);
  }

  // Resonance: the brake is no longer fixed. The control is Q, and the brake
  // is one over it, as the kit has it: a large Q is a light brake.
  float brake() const { return 1.0f / kit::max(resonance.value, 0.1f); }

  // The outputs: the loop already holds three sounds on every sample. A type
  // is three weights, one for each, out of the device's own table: low, band
  // times k, and high.
  float chosen(const Loop& made) const {
    const float* weight = AutoFilter::kTypeWeights[kit::clamp_int(type.choice(), 0, 4)];
    return weight[0] * made.low + weight[1] * k * made.band + weight[2] * made.high;
  }

  // Modulation: the cutoff moves. The device's envelope and its oscillator
  // each push it by a number of octaves, the two are added, and the sum goes
  // on top of Cutoff as a power of two, kept between 20 Hz and 20 kHz.
  float moved(float envelope, float oscillator) const {
    const float octaves = env_amount.value * 0.01f * AutoFilter::kEnvOctaves * envelope +
                          lfo_amount.value * 0.01f * AutoFilter::kLfoOctaves * oscillator;
    const float pitch = std::log2(cutoff.value) + octaves;
    return kit::clamp(std::exp2(pitch), AutoFilter::kMinCutoffHz, AutoFilter::kMaxCutoffHz);
  }

  // One sample of both channels through the pieces built so far.
  void run(float left, float right, float envelope, float oscillator) {
    if (pieces >= kMoving) tune(moved(envelope, oscillator));
    const float in[2] = {left, right};
    for (int c = 0; c < 2; ++c) {
      if (pieces >= kTwo) loop[c].two(in[c], g, k);
      else loop[c].one(in[c], g);
      out[c] = pieces >= kOutputs ? chosen(loop[c]) : loop[c].low;
    }
  }

  void start(int pieces_) {
    pieces = pieces_;
    hz = 0.0f;
    tune(cutoff.value);
    k = pieces >= kBrake ? brake() : kFlatBrake;
    loop[0].reset();
    loop[1].reset();
    out[0] = out[1] = 0.0f;
  }
};

// The bound is measured. The kit multiplies each sample of the loop by a1,
// one over the loop's sum, which it worked out when the filter was set and
// which is rounded to a float's 24 bits. The build divides in the line. So
// the two differ by that rounding, which acts as a small change to the
// brake. At the starting values the build lands 126 dB or more under the
// kit's filter on the bench's loops. Where the brake takes least from each
// sample, a low cutoff at the highest Resonance, the rounding is a larger
// share of it and the two rings die at slightly different rates: 76 dB under
// on the drums with the cutoff at 59 Hz and a Q of 25, and 73.7 dB under on
// a tone at 60 Hz, at half of full scale, with the cutoff on it. That is the
// worst found in a search of the cutoffs from 20 to 130 Hz, on every loop of
// the bench and on a tone on the cutoff. Lower than that the two agree
// better again. So 70 leaves room and no more.
lab::Build build{"One integrator|A second integrator|Resonance|The outputs|A cutoff that moves", Built::kMoving,
                 -70.0f, "The filter as built, all five pieces, against the kit's filter on the same moving cutoff"};

Built shown;   // at the step the reader chose: what the built taps hold
Built held;    // with every piece: what is compared with the kit's filter
Built struck;  // one unit sample goes through this one, for a step's curve

void configure(AutoFilter& d, bool moving) {
  d.init(lab::kSampleRate);
  d.set_param(p::kType, type.value);
  d.set_param(p::kSlope, slope.value);
  d.set_param(p::kCutoffHz, cutoff.value);
  d.set_param(p::kResonance, resonance.value);
  d.set_param(p::kDriveDb, moving ? drive.value : 0.0f);
  d.set_param(p::kEnvAmount, moving ? env_amount.value : 0.0f);
  d.set_param(p::kEnvAttackMs, env_attack.value);
  d.set_param(p::kEnvReleaseMs, env_release.value);
  d.set_param(p::kLfoAmount, moving ? lfo_amount.value : 0.0f);
  d.set_param(p::kLfoRateHz, lfo_rate.value);
  d.set_param(p::kLfoShape, lfo_shape.value);
  d.set_param(p::kMix, moving ? mix.value : 1.0f);
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

// The oscillator as the device reads it on the sample that wakes it. Waking
// after its phase has gone once round or more, the device draws Random steps a
// new value before it reads one (its wake_up), so the lab draws the same value
// from a copy of the device's generator.
float oscillator_on_waking(const AutoFilter& d) {
  const double phase = d.lfo_phase_ + static_cast<double>(d.lfo_rate_.value) * d.slept_ / d.sample_rate();
  kit::Rng generator = d.random_;
  const float held = phase >= 1.0 ? generator.bipolar() : d.lfo_held_;
  const int shape = kit::clamp_int(static_cast<int>(d.param(p::kLfoShape) + 0.5f), 0, AutoFilter::kNumLfoShapes - 1);
  return AutoFilter::lfo_value(shape, static_cast<float>(phase - std::floor(phase)), held);
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

// One pole at the cutoff, and two of them in a row: what one unit sample
// leaves of each frequency.
void measure_poles(float hz) {
  kit::OnePole first, second;
  first.set_cutoff(hz, lab::kSampleRate);
  second.set_cutoff(hz, lab::kSampleRate);
  bool cut = false;
  const int count = ring_length(hz, 1.0f, &cut);
  for (int i = 0; i < count; ++i) {
    ring_sum[i] = first.lowpass(i == 0 ? 1.0f : 0.0f);
    tuned_late[i] = second.lowpass(ring_sum[i]);
  }
  if (cut) {
    fade_out(ring_sum, count);
    fade_out(tuned_late, count);
  }
  lab::response_tap(one_pole_response, ring_sum, count);
  lab::response_tap(two_pole_response, tuned_late, count);
}

// The curve of the build with `pieces` of its pieces: one unit sample through
// it, with the cutoff standing where Cutoff puts it.
void built_curve(lab::Tap& tap, int pieces) {
  struck.start(pieces);
  bool cut = false;
  const float q = pieces >= Built::kBrake ? resonance.value : 1.0f / kFlatBrake;
  const int count = ring_length(cutoff.value, q, &cut);
  for (int i = 0; i < count; ++i) {
    const float x = i == 0 ? 1.0f : 0.0f;
    struck.run(x, x, 0.0f, 0.0f);
    ring_sum[i] = struck.out[0];
  }
  if (cut) fade_out(ring_sum, count);
  lab::response_tap(tap, ring_sum, count);
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

  // One unit sample through a second device: no drive, nothing moving, all wet.
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

  measure_tuning(hz);
  measure_poles(hz);
  built_curve(built_response, build.at());
  built_curve(built_before, build.at() > 0 ? build.at() - 1 : 0);
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(device, true);
  for (int c = 0; c < 2; ++c) {
    svf[c].reset();
    twin[c].reset();
    pole[c].reset();
  }
  direct.reset();
  direct.set_identity();

  // The build part: the chosen step, and the whole build that is held to the kit's filter.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;

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
    // The oscillator as the device is about to read it, and after its tick the
    // envelope it has just used. Asleep, it keeps both on paper, and the
    // sample that wakes it reads the oscillator as waking leaves it.
    const bool asleep = device.slept_ > 0.0;
    const float on_waking = asleep ? oscillator_on_waking(device) : 0.0f;
    float oscillator = oscillator_now(device);
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    device.process(1);
    if (device.slept_ > 0.0) oscillator = oscillator_now(device);
    else if (asleep) oscillator = on_waking;
    const float envelope = envelope_now(device);

    // The cutoff the device stands at on this sample: its Cutoff, moved by its
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
      pole[0].set_cutoff(hz, lab::kSampleRate);
      pole[1].set_cutoff(hz, lab::kSampleRate);
      direct.set_lowpass(hz, q, lab::kSampleRate);
      twin_coeffs = decltype(twin_coeffs)::make(hz, q, lab::kSampleRate);
    }

    // The kit's filter: one tick, and all three outputs are there to read.
    const float notch_left = svf[0].notch(left);
    const float notch_right = svf[1].notch(right);
    const float k = svf[0].k;

    in_tap.put(i, left, right);
    one_pole.put(i, pole[0].lowpass(left), pole[1].lowpass(right));
    high.put(i, svf[0].high, svf[1].high);
    band.put(i, svf[0].band * k, svf[1].band * k);
    low.put(i, svf[0].low, svf[1].low);
    notch.put(i, notch_left, notch_right);
    peak.put(i, svf[0].low - svf[0].high, svf[1].low - svf[1].high);
    out_tap.put(i, device.out_left()[0], device.out_right()[0]);

    // The direct form and the device's own stage, on the left channel.
    const float direct_low = direct.process(left);
    const auto stage = twin[0].process(left, twin_coeffs);

    // The build part, beside the kit's filter: the reader's step to the built
    // taps, and the whole build to be compared.
    shown.run(left, right, envelope, oscillator);
    held.run(left, right, envelope, oscillator);
    built.put(i, shown.out[0], shown.out[1]);
    const bool taken = shown.pieces >= Built::kOutputs;
    built_high.put(i, taken ? shown.loop[0].high : 0.0f);
    built_band.put(i, taken ? shown.k * shown.loop[0].band : 0.0f);
    built_low.put(i, taken ? shown.loop[0].low : 0.0f);

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
      envelope_tap.put(i, envelope);
      sweep.put(i, std::log2(hz / cutoff.value));
      built_cutoff.put(i, std::log2(shown.hz / cutoff.value));
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
      // The build's three sounds against the kit's, on both channels.
      for (int c = 0; c < 2; ++c) {
        const double b_low = static_cast<double>(held.loop[c].low) - svf[c].low;
        const double b_band = static_cast<double>(held.k) * held.loop[c].band - static_cast<double>(k) * svf[c].band;
        const double b_high = static_cast<double>(held.loop[c].high) - svf[c].high;
        built_apart += b_low * b_low + b_band * b_band + b_high * b_high;
        built_whole += static_cast<double>(svf[c].low) * svf[c].low +
                       static_cast<double>(k) * k * svf[c].band * svf[c].band +
                       static_cast<double>(svf[c].high) * svf[c].high;
      }
    }
  }

  sum.value = lab::ratio_db(sum_apart, sum_in);
  direct_apart.value = lab::ratio_db(direct_diff, direct_ref);
  same_stage.value = lab::ratio_db(twin_diff, twin_ref);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.channel(0), frames);
  measure();
}
