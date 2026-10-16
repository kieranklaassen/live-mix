// Equalising with biquads: the kit's Biquad (cpp/kit/filters.h) and
// the Ambient EQ (cpp/devices/ambient-eq), which is six filters in a row and
// a listener that turns narrow bands down.
//
//   in ─► low cut ─► low ─► body ─► presence ─► air ─► high cut ─┬─► Clear's cuts ─► out
//         two Svf    shelf   bell     bell     shelf   one Svf   └─► (the device listens here)
//
// Four things run here.
//
// 1. One bell by itself: the kit's Biquad with its frequency, gain and Q free
//    ("kit"). Its impulse response gives its curve, its phase and its ring.
//    The same coefficients run as the difference equation is written, four
//    remembered samples, and a check holds that to the form the kit runs.
//    Half of the coefficients at a time give the zeros' curve and the poles',
//    and the roots of the two halves are where its zeros and its poles stand.
//
// 2. The device, one sample at a time ("device"): its output, the signal it
//    hands to Clear (it keeps the last 4096 samples of that for its
//    transform), and how deep Clear is cutting.
//
// 3. The device's chain built again from the kit's own filters with the
//    device's own constants ("kit"), so the sound after each band can be
//    heard. The "rebuilt" check holds the end of that chain to the signal the
//    device kept. Each band's curve is an impulse through its filter; their
//    sum in decibels is held to the curve of an impulse through a second
//    device ("curveError"). The two part company far down a cut's slope,
//    where the biquads' rounding shows, so the check looks down to -20 dB.
//
// 4. The build part (lab::Build in lab.h): an equaliser put together a piece
//    at a time, on a path of its own beside the device. It has five pieces,
//    in the order the steps add them: one biquad, with the five numbers of a
//    wire; a bell, which is a recipe for the five numbers, used twice; the
//    shelves, another recipe, used twice; the cuts, a third recipe, in seven
//    biquads by now; and the chain as the device runs it, where the cuts are
//    the kit's state-variable filters and a band that does nothing is not in
//    circuit. The biquad and the three recipes are written out here
//    ("lesson"), the same arithmetic in the same order as the kit's. Two
//    copies of the path run: one at the step the reader chose, which the
//    "built" taps show, and one with all five pieces, whose output is
//    compared on every render with the signal the device hands to Clear (the
//    "builtDifference" check). A step before the last is the lesson's own: an
//    equaliser with a piece missing, which the device never is.
//
// Clear's listener is read too: the power it measured in each band, and (a
// local of the device, worked out again here) the level a band must pass.
// How a cut follows what Clear asks for is worked out from the device's own
// two coefficients.

#include "lab.h"

#include "../../cpp/devices/ambient-eq/ambient_eq.h"

using namespace livemix;

namespace {

AmbientEq eq;     // the loop goes through this one
AmbientEq probe;  // an impulse goes through this one

constexpr int kImpulseMax = 16384;  // 0.34 s: the longest response kept
constexpr int kPoints = 241;        // of a curve from 20 Hz to 20 kHz
constexpr int kRingPoints = 2048;   // 42.7 ms of the bell's ring
constexpr int kOctavePoints = 121;  // of a curve from 3 octaves under a centre to 1 over
constexpr float kGlideSeconds = 6.0f;  // of a cut asked for and then let go
float impulse_[kImpulseMax];

// The device's own controls, in the device's order. Clear starts at 0, so the
// plain bands show first, and Clear time at its quickest, so that a loop of
// four seconds shows it move; the device's own defaults are 0.4 and 1.5 s.
lab::Control low_cut{"lowCut", "Low cut", "Hz", 20.0f, 500.0f, 40.0f, lab::kLog};
lab::Control low{"low", "Low", "dB", -12.0f, 12.0f, 4.0f};
lab::Control body{"body", "Body", "dB", -12.0f, 12.0f, -5.0f};
lab::Control presence{"presence", "Presence", "dB", -12.0f, 12.0f, 5.0f};
lab::Control air{"air", "Air", "dB", -12.0f, 12.0f, 3.0f};
lab::Control high_cut{"highCut", "High cut", "Hz", 1000.0f, 20000.0f, 16000.0f, lab::kLog};
lab::Control clear{"clear", "Clear", "", 0.0f, 1.0f, 0.0f};
lab::Control clear_time{"clearTime", "Clear time", "s", 0.2f, 8.0f, 0.2f, lab::kLog};
// One bell of the kit's, by itself, with nothing fixed.
lab::Control bell_hz{"bellHz", "Frequency", "Hz", 100.0f, 20000.0f, 1000.0f, lab::kLog};
lab::Control bell_gain{"bellGain", "Gain", "dB", -12.0f, 12.0f, 6.0f};
lab::Control bell_q{"bellQ", "Q", "", 0.3f, 10.0f, 2.0f, lab::kLog};

// The output is the last sound of the main path: a card that names no tap plays it.
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap after_low_cut{"afterLowCut", "After the low cut", lab::kAudio, lab::kKit, 2};
lab::Tap after_low{"afterLow", "After Low", lab::kAudio, lab::kKit, 2};
lab::Tap after_body{"afterBody", "After Body", lab::kAudio, lab::kKit, 2};
lab::Tap after_presence{"afterPresence", "After Presence", lab::kAudio, lab::kKit, 2};
lab::Tap after_air{"afterAir", "After Air", lab::kAudio, lab::kKit, 2};
lab::Tap after_high_cut{"afterHighCut", "After the high cut", lab::kAudio, lab::kKit, 2};
lab::Tap bell_tap{"bell", "Through one bell", lab::kAudio, lab::kKit, 2};
lab::Tap removed{"removed", "The difference: input less output", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap bell_ring{"bellRing", "What the bell adds to one sample", lab::kCurve, lab::kKit, 1};
lab::Tap bell_response{"bellResponse", "The bell", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap bell_zeros{"bellZeros", "Its zeros alone", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap bell_poles{"bellPoles", "Its poles alone", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap bell_roots{"bellRoots", "Where the bell's zeros and poles stand", lab::kCurve, lab::kLesson, 1};
lab::Tap bell_phase{"bellPhase", "The bell's phase", lab::kCurve, lab::kKit, 1, "°"};
lab::Tap bell_at_one{"bellAtOne", "The bell at 1 kHz", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap bell_high{"bellHigh", "The same bell at 12 kHz", lab::kCurve, lab::kKit, 1, "dB"};

lab::Tap resp_low_cut{"respLowCut", "Low cut", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_low{"respLow", "Low", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_body{"respBody", "Body", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_presence{"respPresence", "Presence", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_air{"respAir", "Air", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_high_cut{"respHighCut", "High cut", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap resp_cut_biquad{"respCutBiquad", "The low cut from two biquads", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap curve_device{"curveDevice", "The device, measured", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap curve_sum{"curveSum", "The bands' curves added", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Tap band_power{"bandPower", "What Clear hears in each band", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap band_margin{"bandMargin", "What a band must rise above", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap clear_depth{"clearDepth", "Clear's deepest cut", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap resp_clear{"respClear", "Clear's cuts at their deepest", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap clear_glide{"clearGlide", "A cut asked for, then let go", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Check forms{"forms", "The equation as written against the form the kit runs", "dB"};
lab::Check pole_radius{"poleRadius", "How far from the centre the bell's poles stand (the circle is 1)", ""};
lab::Check zero_radius{"zeroRadius", "How far from the centre the bell's zeros stand", ""};
lab::Check cut_forms{"cutForms", "How far the low cut from two biquads strays from the device's pair, down to −60 dB",
                     "dB"};
lab::Check curve_error{"curveError", "The device's measured curve against the bands' curves added, down to −20 dB",
                       "dB"};
lab::Check rebuilt{"rebuilt", "The chain built from the kit's filters against the device's own signal", "dB"};

lab::Tap built{"built", "The equaliser so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_response{"builtResponse", "The curve so far", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap built_before{"builtBefore", "The curve one step back", lab::kCurve, lab::kLesson, 1, "dB"};

// One biquad, as the kit runs it (kit::Biquad::process): five numbers and two
// memories. Each output is the input times b0, and what the two memories
// already hold of the samples before it.
struct Section {
  float b0 = 1.0f, b1 = 0.0f, b2 = 0.0f, a1 = 0.0f, a2 = 0.0f;  // these five are a wire
  float z1 = 0.0f, z2 = 0.0f;

  float run(float x) {
    const float y = b0 * x + z1;
    z1 = flush_denormal(b1 * x - a1 * y + z2);
    z2 = flush_denormal(b2 * x - a2 * y);
    return y;
  }

  // A recipe gives three numbers for the input and three for the output. The
  // first of the output's is divided out, so five are left.
  void set(float nb0, float nb1, float nb2, float na0, float na1, float na2) {
    const float inverse = 1.0f / na0;
    b0 = nb0 * inverse;
    b1 = nb1 * inverse;
    b2 = nb2 * inverse;
    a1 = na1 * inverse;
    a2 = na2 * inverse;
  }

  // A bell: a centre in hertz, a width as a Q and a gain in dB become the
  // five numbers (kit::Biquad::set_peak).
  void bell(float hz, float q, float db) {
    const float w = kit::kTwoPi * hz / lab::kSampleRate;  // the centre, as an angle
    const float cosw = std::cos(w);
    const float alpha = std::sin(w) / (2.0f * q);    // the width
    const float amp = std::pow(10.0f, db / 40.0f);   // half of the gain: one half goes each way
    set(1.0f + alpha * amp, -2.0f * cosw, 1.0f - alpha * amp,  // the input's three: up by amp
        1.0f + alpha / amp, -2.0f * cosw, 1.0f - alpha / amp);  // the output's three: down by amp
  }

  // A shelf: a corner in hertz and a gain in dB. `side` is 1 for a shelf that
  // lifts the low end and -1 for one that lifts the high end: the same
  // recipe with the sign of every cosine turned (kit::Biquad::set_low_shelf
  // and set_high_shelf).
  void shelf(float hz, float db, float side) {
    const float w = kit::kTwoPi * hz / lab::kSampleRate;
    const float cosw = side * std::cos(w);
    const float alpha = std::sin(w) / (2.0f * kit::kSqrtHalf);  // the steepest slope with no bump
    const float amp = std::pow(10.0f, db / 40.0f);
    const float beta = 2.0f * std::sqrt(amp) * alpha;
    set(amp * ((amp + 1.0f) - (amp - 1.0f) * cosw + beta),
        side * 2.0f * amp * ((amp - 1.0f) - (amp + 1.0f) * cosw),
        amp * ((amp + 1.0f) - (amp - 1.0f) * cosw - beta),
        (amp + 1.0f) + (amp - 1.0f) * cosw + beta,
        side * -2.0f * ((amp - 1.0f) + (amp + 1.0f) * cosw),
        (amp + 1.0f) + (amp - 1.0f) * cosw - beta);
  }

  // A cut: a corner in hertz and a Q. `side` is 1 for a low cut, which lets
  // nothing through at 0 Hz, and -1 for a high cut, which lets nothing
  // through at half the sample rate (kit::Biquad::set_highpass and
  // set_lowpass).
  void cut(float hz, float q, float side) {
    const float w = kit::kTwoPi * hz / lab::kSampleRate;
    const float cosw = std::cos(w);
    const float alpha = std::sin(w) / (2.0f * q);
    const float edge = 1.0f + side * cosw;
    set(edge * 0.5f, -side * edge, edge * 0.5f,   // the input's three: nothing at one end
        1.0f + alpha, -2.0f * cosw, 1.0f - alpha);  // the output's three: the bell's, with no gain
  }

  void wire() {
    b0 = 1.0f;
    b1 = b2 = a1 = a2 = 0.0f;
  }
  void reset() { z1 = z2 = 0.0f; }
};

// The equaliser so far: the pieces there are, and through() to take a sample
// of one channel along them.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kBiquad = 0, kBell, kShelves, kCuts, kChain };

  int pieces = kBiquad;
  Section body_bell[2];      // the one biquad of the first step, and Body from the second
  Section presence_bell[2];
  Section low_shelf[2];
  Section air_shelf[2];
  Section low_cut_pair[2][2];  // the cuts as biquads, until the chain
  Section high_cut_one[2];
  kit::Svf low_cut_svf[2][2];  // the cuts as the device has them
  kit::Svf high_cut_svf[2];
  float out[2] = {0.0f, 0.0f};

  // The chain's rule: a band at exactly 0 dB is not in circuit, and neither
  // is a cut at the end of its range. Before the chain everything runs.
  bool live(float db) const { return pieces < kChain || db != 0.0f; }
  bool cutting_low() const { return low_cut.value > ambient_eq::kParamMin[ambient_eq::kLowCut]; }
  bool cutting_high() const { return high_cut.value < ambient_eq::kParamMax[ambient_eq::kHighCut]; }

  // The low cut: two filters in a row, 24 dB an octave between them. As the
  // device has it, the kit's state-variable filter does the work. The device
  // fades a cut in over 5 ms as it comes off its stop; here it is all the
  // way in, and the sum is written as the device writes it.
  float cut_low(int c, float x) {
    if (pieces >= kChain) {
      if (!cutting_low()) return x;
      const float cut = low_cut_svf[c][1].highpass(low_cut_svf[c][0].highpass(x));
      return x + 1.0f * (cut - x);
    }
    return pieces >= kCuts ? low_cut_pair[c][1].run(low_cut_pair[c][0].run(x)) : x;
  }

  // The high cut: one filter, 12 dB an octave.
  float cut_high(int c, float x) {
    if (pieces >= kChain) {
      if (!cutting_high()) return x;
      const float cut = high_cut_svf[c].lowpass(x);
      return x + 1.0f * (cut - x);
    }
    return pieces >= kCuts ? high_cut_one[c].run(x) : x;
  }

  // One sample of one channel through the pieces built so far, in the order
  // the device runs them. Each filter is handed what the one before it made.
  float through(int c, float x) {
    x = cut_low(c, x);
    if (pieces >= kShelves && live(low.value)) x = low_shelf[c].run(x);
    if (live(body.value)) x = body_bell[c].run(x);
    if (pieces >= kBell && live(presence.value)) x = presence_bell[c].run(x);
    if (pieces >= kShelves && live(air.value)) x = air_shelf[c].run(x);
    return cut_high(c, x);
  }

  void run(float left, float right) {
    out[0] = through(0, left);
    out[1] = through(1, right);
  }

  // Give every filter there is so far its numbers, from the controls and the
  // device's own constants.
  void start(int pieces_) {
    pieces = pieces_;
    const float sr = lab::kSampleRate;
    for (int c = 0; c < 2; ++c) {
      body_bell[c].wire();
      if (pieces >= kBell) {
        body_bell[c].bell(AmbientEq::kBodyHz, AmbientEq::kBellQ, body.value);
        presence_bell[c].bell(AmbientEq::kPresenceHz, AmbientEq::kBellQ, presence.value);
      }
      if (pieces >= kShelves) {
        low_shelf[c].shelf(AmbientEq::kLowHz, low.value, 1.0f);
        air_shelf[c].shelf(AmbientEq::kAirHz, air.value, -1.0f);
      }
      if (pieces >= kCuts) {
        low_cut_pair[c][0].cut(low_cut.value, AmbientEq::kLowCutQ[0], 1.0f);
        low_cut_pair[c][1].cut(low_cut.value, AmbientEq::kLowCutQ[1], 1.0f);
        high_cut_one[c].cut(high_cut.value, kit::kSqrtHalf, -1.0f);
      }
      if (pieces >= kChain) {
        low_cut_svf[c][0].set(low_cut.value, AmbientEq::kLowCutQ[0], sr);
        low_cut_svf[c][1].set(low_cut.value, AmbientEq::kLowCutQ[1], sr);
        high_cut_svf[c].set(high_cut.value, kit::kSqrtHalf, sr);
      }
    }
    rest();
  }

  // Nothing is sounding: forget what the filters remember, as the device does.
  void rest() {
    for (int c = 0; c < 2; ++c) {
      body_bell[c].reset();
      presence_bell[c].reset();
      low_shelf[c].reset();
      air_shelf[c].reset();
      low_cut_pair[c][0].reset();
      low_cut_pair[c][1].reset();
      high_cut_one[c].reset();
      low_cut_svf[c][0].reset();
      low_cut_svf[c][1].reset();
      high_cut_svf[c].reset();
    }
  }
};

lab::Build build{"One biquad|A bell|The shelves|The cuts|The chain", Built::kChain, -120.0f,
                 "The equaliser as built, all five pieces, against the signal the device hands to Clear"};

Built shown;   // at the step the reader chose: what the built taps hold
Built held;    // with every piece: what is compared with the device
Built struck;  // one sample goes through this one, for a step's curve

void configure(AmbientEq& device, float clear_value) {
  using namespace ambient_eq;
  device.init(lab::kSampleRate);
  device.set_param(kLowCut, low_cut.value);
  device.set_param(kLow, low.value);
  device.set_param(kBody, body.value);
  device.set_param(kPresence, presence.value);
  device.set_param(kAir, air.value);
  device.set_param(kHighCut, high_cut.value);
  device.set_param(kClear, clear_value);
  device.set_param(kClearTime, clear_time.value);
}

// A tone stage as the device designs it (AmbientEq::design_tone).
void design_tone(kit::Biquad& filter, int stage, float db) {
  if (db == 0.0f) {
    filter.set_identity();
  } else if (stage == AmbientEq::kLowStage) {
    filter.set_low_shelf(AmbientEq::kLowHz, db, lab::kSampleRate);
  } else if (stage == AmbientEq::kBodyStage) {
    filter.set_peak(AmbientEq::kBodyHz, AmbientEq::kBellQ, db, lab::kSampleRate);
  } else if (stage == AmbientEq::kPresenceStage) {
    filter.set_peak(AmbientEq::kPresenceHz, AmbientEq::kBellQ, db, lab::kSampleRate);
  } else {
    filter.set_high_shelf(AmbientEq::kAirHz, db, lab::kSampleRate);
  }
}

void copy_coefficients(const kit::Biquad& from, kit::Biquad& to) {
  to.b0 = from.b0;
  to.b1 = from.b1;
  to.b2 = from.b2;
  to.a1 = from.a1;
  to.a2 = from.a2;
  to.reset();
}

// One unit sample through `tick`, kept until the answer has died away: under
// 1e-9 for 512 samples in a row, or kImpulseMax. Returns how many were kept.
template <class Tick>
int capture(Tick&& tick) {
  int quiet = 0;
  for (int n = 0; n < kImpulseMax; ++n) {
    const float y = tick(n == 0 ? 1.0f : 0.0f);
    impulse_[n] = y;
    quiet = y > -1.0e-9f && y < 1.0e-9f ? quiet + 1 : 0;
    if (quiet >= 512) return n + 1;
  }
  return kImpulseMax;
}

int capture(kit::Biquad& filter) {
  filter.reset();
  return capture([&filter](float x) { return filter.process(x); });
}

// The same for the whole device, in blocks of 64 as a host would run it.
int capture_device(AmbientEq& device) {
  constexpr int kBlock = 64;
  int quiet = 0;
  for (int start = 0; start < kImpulseMax; start += kBlock) {
    if (start == 0) {
      device.in_left()[0] = 1.0f;
      device.in_right()[0] = 1.0f;
    }
    device.process(kBlock);
    for (int j = 0; j < kBlock; ++j) {
      const float y = device.out_left()[j];
      impulse_[start + j] = y;
      quiet = y > -1.0e-9f && y < 1.0e-9f ? quiet + 1 : 0;
    }
    if (quiet >= 512) return start + kBlock;
  }
  return kImpulseMax;
}

void curve(lab::Tap& tap, int count) { lab::response_tap(tap, impulse_, count, kPoints); }

// The curve of the build with `pieces` of its pieces: one sample through it.
void built_curve(lab::Tap& tap, int pieces) {
  struck.start(pieces);
  curve(tap, capture([](float v) { return struck.through(0, v); }));
}

// The turn a filter gives each frequency, in degrees, from its impulse
// response: the angle of the same sum lab::response_tap takes the size of.
void phase_tap(lab::Tap& tap, const float* h, int count) {
  if (!tap.open(kPoints)) return;
  tap.x0 = 20.0f;
  tap.x1 = 20000.0f;
  tap.scale = lab::kLog;
  for (int p = 0; p < kPoints; ++p) {
    const double hz = 20.0 * std::pow(1000.0, static_cast<double>(p) / (kPoints - 1));
    const lab::Bin bin = lab::fourier_at(h, count, hz);
    tap.data[p] = static_cast<float>(std::atan2(bin.im, bin.re) * 180.0 / lab::kPi);
  }
}

// A bell's curve against octaves from its own centre, from three under to one
// over: where two bells of one gain and Q would lie on each other if the
// sample rate did not matter.
void octave_curve(lab::Tap& tap, float centre_hz) {
  kit::Biquad filter;
  filter.set_peak(centre_hz, bell_q.value, bell_gain.value, lab::kSampleRate);
  const int count = capture(filter);
  lab::response_tap(tap, impulse_, count, kOctavePoints, centre_hz / 8.0f, centre_hz * 2.0f);
  tap.x0 = -3.0f;
  tap.x1 = 1.0f;
  tap.scale = lab::kLinear;
}

// The largest distance between two curves in dB, where the first is above `floor_db`.
float worst_apart(const lab::Tap& a, const lab::Tap& b, float floor_db) {
  float worst = 0.0f;
  if (!a.data || !b.data) return worst;
  for (int p = 0; p < a.length && p < b.length; ++p) {
    if (a.data[p] < floor_db) continue;
    const float d = a.data[p] - b.data[p];
    if (d > worst) worst = d;
    if (-d > worst) worst = -d;
  }
  return worst;
}

// The two roots of z^2 + p z + q, written as two points (across, up): a pair
// that mirror each other across the level line when the square root would be
// of a negative number, and two points on that line when it would not.
void roots(double p, double q, float* into) {
  const double under = p * p - 4.0 * q;
  if (under < 0.0) {
    const double up = 0.5 * std::sqrt(-under);
    into[0] = into[2] = static_cast<float>(-0.5 * p);
    into[1] = static_cast<float>(up);
    into[3] = static_cast<float>(-up);
  } else {
    const double root = std::sqrt(under);
    into[0] = static_cast<float>(0.5 * (-p + root));
    into[2] = static_cast<float>(0.5 * (-p - root));
    into[1] = into[3] = 0.0f;
  }
}

// Everything about the one bell that is not the loop.
void study_bell(const kit::Biquad& designed) {
  kit::Biquad filter;
  copy_coefficients(designed, filter);
  int count = capture(filter);
  curve(bell_response, count);
  phase_tap(bell_phase, impulse_, count);
  // What comes out less what went in: the first sample is b0 - 1, the rest
  // is the filter's own memory talking.
  if (bell_ring.open(kRingPoints)) {
    bell_ring.x0 = 0.0f;
    bell_ring.x1 = static_cast<float>(kRingPoints - 1) * 1000.0f / lab::kSampleRate;
    for (int n = 0; n < kRingPoints; ++n) {
      const float y = n < count ? impulse_[n] : 0.0f;
      bell_ring.set(n, n == 0 ? y - 1.0f : y);
    }
  }

  // The feed-forward half alone, then the feedback half alone.
  kit::Biquad half;
  half.b0 = designed.b0;
  half.b1 = designed.b1;
  half.b2 = designed.b2;
  half.a1 = half.a2 = 0.0f;
  curve(bell_zeros, capture(half));
  half.set_identity();
  half.a1 = designed.a1;
  half.a2 = designed.a2;
  curve(bell_poles, capture(half));

  // The roots of z^2 + a1 z + a2 multiply to a2: for a pair that mirror each
  // other across the real line that is the square of their distance out.
  pole_radius.value = designed.a2 > 0.0f ? std::sqrt(designed.a2) : 0.0f;
  const float zeros = designed.b2 / designed.b0;
  zero_radius.value = zeros > 0.0f ? std::sqrt(zeros) : 0.0f;

  // Where they stand: the zeros are the roots of b0 z^2 + b1 z + b2, the
  // poles the roots of z^2 + a1 z + a2. Nine numbers: two zeros and two
  // poles, each as (across, up), and then b0.
  if (bell_roots.open(9)) {
    float points[8];
    roots(static_cast<double>(designed.b1) / designed.b0, static_cast<double>(designed.b2) / designed.b0, points);
    roots(designed.a1, designed.a2, points + 4);
    bell_roots.x0 = 0.0f;
    bell_roots.x1 = 8.0f;
    for (int n = 0; n < 8; ++n) bell_roots.set(n, points[n]);
    bell_roots.set(8, designed.b0);
  }

  octave_curve(bell_at_one, 1000.0f);
  octave_curve(bell_high, 12000.0f);
}

// How a cut of Clear's follows what is asked of it (AmbientEq::listen): 12 dB
// asked for at once and held for half of the picture, then nothing asked.
// Each frame the cut goes a fixed share of the way to what is asked, a larger
// share on the way down than on the way back, and within 0.01 dB of nothing
// it lets go.
void glide() {
  const float frames_per_second = lab::kSampleRate / AmbientEq::kHop;
  const int count = static_cast<int>(kGlideSeconds * frames_per_second) + 1;
  if (!clear_glide.open(count)) return;
  clear_glide.x0 = 0.0f;
  clear_glide.x1 = static_cast<float>(count - 1) / frames_per_second;
  const float down = kit::time_to_coeff(clear_time.value, frames_per_second);
  const float back = kit::time_to_coeff(2.0f * clear_time.value, frames_per_second);
  float cut = 0.0f;
  for (int n = 0; n < count; ++n) {
    const float target = 2 * n < count ? -AmbientEq::kMaxExcessDb : 0.0f;
    cut = target + (cut - target) * (target < cut ? down : back);
    if (target == 0.0f && cut > -AmbientEq::kLetGoDb) cut = 0.0f;
    clear_glide.set(n, cut);
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  (void)frames;
  const float sr = lab::kSampleRate;

  // --- 1. One bell --------------------------------------------------------
  kit::Biquad bell[2];
  bell[0].set_peak(bell_hz.value, bell_q.value, bell_gain.value, sr);
  copy_coefficients(bell[0], bell[1]);
  study_bell(bell[0]);
  bell[0].reset();
  // The difference equation as it is written: two inputs and two outputs
  // remembered, on the left channel.
  float x1 = 0.0f, x2 = 0.0f, y1 = 0.0f, y2 = 0.0f;
  double forms_diff = 0.0, forms_ref = 0.0;

  // --- 3. The chain from the kit's filters, with the device's constants ----
  const bool cutting_low = low_cut.value > ambient_eq::kParamMin[ambient_eq::kLowCut];
  const bool cutting_high = high_cut.value < ambient_eq::kParamMax[ambient_eq::kHighCut];
  const float tone_db[AmbientEq::kStages] = {low.value, body.value, presence.value, air.value};
  kit::Svf low_cut_filter[2][2];
  kit::Svf high_cut_filter[2];
  kit::Biquad tone[2][AmbientEq::kStages];
  for (int c = 0; c < 2; ++c) {
    low_cut_filter[c][0].set(low_cut.value, AmbientEq::kLowCutQ[0], sr);
    low_cut_filter[c][1].set(low_cut.value, AmbientEq::kLowCutQ[1], sr);
    high_cut_filter[c].set(high_cut.value, kit::kSqrtHalf, sr);
    for (int s = 0; s < AmbientEq::kStages; ++s) design_tone(tone[c][s], s, tone_db[s]);
  }

  // --- 4. The build: at the reader's step, and whole -----------------------
  const bool whole = build.at() == build.compared_step;
  shown.start(build.at());
  if (!whole) held.start(build.compared_step);
  Built& compared = whole ? shown : held;
  double built_diff = 0.0, built_ref = 0.0;

  // --- 2. The device -------------------------------------------------------
  configure(eq, clear.value);
  double rebuilt_diff = 0.0, rebuilt_ref = 0.0;
  float deepest = 0.0f;
  float deepest_cuts[AmbientEq::kBands] = {};
  // What Clear's listener measured in the frame where one band stood
  // furthest above its surroundings: each band's power (the device's own
  // numbers) and the level it had to pass, which the device works out and
  // does not keep: the mean power of the bands two to four away on either
  // side, and 6 dB more (AmbientEq::listen).
  float most_excess = -1000.0f;
  float heard_db[AmbientEq::kBands];
  float margin_db[AmbientEq::kBands];
  for (int k = 0; k < AmbientEq::kBands; ++k) heard_db[k] = margin_db[k] = lab::kFloorDb;

  lab::Tap* after_tone[AmbientEq::kStages] = {&after_low, &after_body, &after_presence, &after_air};
  const int kept_from = lab::frames();
  const int kept_to = 2 * lab::frames();
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float in[2] = {lab::in_at(0, i), lab::in_at(1, i)};
    const bool kept = i >= kept_from && i < kept_to;
    in_tap.put(i, in[0], in[1]);

    // One bell, as the kit runs it and as the equation is written.
    const float kit_left = bell[0].process(in[0]);
    const float kit_right = bell[1].process(in[1]);
    bell_tap.put(i, kit_left, kit_right);
    const float written =
        bell[0].b0 * in[0] + bell[0].b1 * x1 + bell[0].b2 * x2 - bell[0].a1 * y1 - bell[0].a2 * y2;
    x2 = x1;
    x1 = in[0];
    y2 = y1;
    y1 = written;
    if (kept) {
      const double d = static_cast<double>(written) - kit_left;
      forms_diff += d * d;
      forms_ref += static_cast<double>(kit_left) * kit_left;
    }

    // The device.
    eq.in_left()[0] = in[0];
    eq.in_right()[0] = in[1];
    eq.process(1);
    out_tap.put(i, eq.out_left()[0], eq.out_right()[0]);
    removed.put(i, in[0] - eq.out_left()[0], in[1] - eq.out_right()[0]);
    clear_depth.put(i, eq.deepest_);
    if (kept && eq.deepest_ < deepest) {
      deepest = eq.deepest_;
      for (int k = 0; k < AmbientEq::kBands; ++k) deepest_cuts[k] = eq.gain_[k].value;
    }
    // The device listens once every 1024 samples, on this one.
    if (kept && (eq.position_ & (AmbientEq::kHop - 1)) == AmbientEq::kStagger + 1u) {
      float now_db[AmbientEq::kBands];
      float pass_db[AmbientEq::kBands];
      float excess = -1000.0f;
      for (int k = 0; k < eq.num_bands_; ++k) {
        float sum = 0.0f;
        int count = 0;
        for (int j = k - 4; j <= k + 4; ++j) {
          if (j < 0 || j >= eq.num_bands_ || (j > k - 2 && j < k + 2)) continue;
          sum += eq.power_[j];
          ++count;
        }
        now_db[k] = lab::power_to_db(eq.power_[k]);
        pass_db[k] = lab::power_to_db(AmbientEq::kMarginRatio * sum / static_cast<float>(count));
        // The two lowest bands have nothing below them and are never cut.
        if (k >= 2 && eq.power_[k] > 0.0f && now_db[k] - pass_db[k] > excess) excess = now_db[k] - pass_db[k];
      }
      if (excess > most_excess) {
        most_excess = excess;
        for (int k = 0; k < eq.num_bands_; ++k) {
          heard_db[k] = now_db[k];
          margin_db[k] = pass_db[k];
        }
      }
    }
    // What the device handed to Clear on this sample: the newest in its ring.
    const uint32_t newest = (eq.position_ - 1u) & AmbientEq::kRingMask;
    const float device_tone[2] = {eq.ring_[0][newest], eq.ring_[1][newest]};

    // The chain again, band by band.
    float x[2] = {in[0], in[1]};
    if (cutting_low) {
      for (int c = 0; c < 2; ++c) {
        const float cut = low_cut_filter[c][1].highpass(low_cut_filter[c][0].highpass(x[c]));
        x[c] += 1.0f * (cut - x[c]);  // as the device writes it, with its crossfade all the way in
      }
    }
    after_low_cut.put(i, x[0], x[1]);
    for (int s = 0; s < AmbientEq::kStages; ++s) {
      if (tone_db[s] != 0.0f) {
        x[0] = tone[0][s].process(x[0]);
        x[1] = tone[1][s].process(x[1]);
      }
      after_tone[s]->put(i, x[0], x[1]);
    }
    if (cutting_high) {
      for (int c = 0; c < 2; ++c) {
        const float cut = high_cut_filter[c].lowpass(x[c]);
        x[c] += 1.0f * (cut - x[c]);
      }
    }
    after_high_cut.put(i, x[0], x[1]);
    if (kept) {
      for (int c = 0; c < 2; ++c) {
        const double d = static_cast<double>(x[c]) - device_tone[c];
        rebuilt_diff += d * d;
        rebuilt_ref += static_cast<double>(device_tone[c]) * device_tone[c];
      }
    }

    // The build: the reader's step to the built tap, the whole one beside the device.
    shown.run(in[0], in[1]);
    built.put(i, shown.out[0], shown.out[1]);
    if (!whole) held.run(in[0], in[1]);
    if (kept) {
      for (int c = 0; c < 2; ++c) {
        const double d = static_cast<double>(compared.out[c]) - device_tone[c];
        built_diff += d * d;
        built_ref += static_cast<double>(device_tone[c]) * device_tone[c];
      }
    }

    // Asleep, the device clears its filters; so do the copies.
    if (eq.idle_.asleep()) {
      for (int c = 0; c < 2; ++c) {
        low_cut_filter[c][0].reset();
        low_cut_filter[c][1].reset();
        high_cut_filter[c].reset();
        for (kit::Biquad& stage : tone[c]) stage.reset();
      }
      shown.rest();
      if (!whole) held.rest();
    }
  }
  forms.value = lab::ratio_db(forms_diff, forms_ref);
  rebuilt.value = lab::ratio_db(rebuilt_diff, rebuilt_ref);
  build.difference.value = lab::ratio_db(built_diff, built_ref);

  // The build's curve at the reader's step and one step back: one sample
  // through a fresh copy of each. The first step has nothing before it.
  built_curve(built_response, build.at());
  built_curve(built_before, build.at() > 0 ? build.at() - 1 : 0);

  // --- Each band's curve: one sample through its filter --------------------
  kit::Svf cut_a, cut_b;
  if (cutting_low) {
    cut_a.set(low_cut.value, AmbientEq::kLowCutQ[0], sr);
    cut_b.set(low_cut.value, AmbientEq::kLowCutQ[1], sr);
    curve(resp_low_cut, capture([&](float v) { return cut_b.highpass(cut_a.highpass(v)); }));
  } else {
    curve(resp_low_cut, capture([](float v) { return v; }));
  }
  lab::Tap* resp_tone[AmbientEq::kStages] = {&resp_low, &resp_body, &resp_presence, &resp_air};
  for (int s = 0; s < AmbientEq::kStages; ++s) {
    kit::Biquad filter;
    design_tone(filter, s, tone_db[s]);
    curve(*resp_tone[s], capture(filter));
  }
  if (cutting_high) {
    cut_a.reset();
    cut_a.set(high_cut.value, kit::kSqrtHalf, sr);
    curve(resp_high_cut, capture([&](float v) { return cut_a.lowpass(v); }));
  } else {
    curve(resp_high_cut, capture([](float v) { return v; }));
  }

  // The low cut from the kit's biquad recipe: two high-passes with the Qs the
  // device gives its pair. At the stop the device has no filter in circuit,
  // and neither has this.
  {
    kit::Biquad first, second;
    if (cutting_low) {
      first.set_highpass(low_cut.value, AmbientEq::kLowCutQ[0], sr);
      second.set_highpass(low_cut.value, AmbientEq::kLowCutQ[1], sr);
    }
    curve(resp_cut_biquad, capture([&](float v) { return second.process(first.process(v)); }));
    cut_forms.value = worst_apart(resp_low_cut, resp_cut_biquad, -60.0f);
  }

  // Filters in a row multiply their gains, so their curves in decibels add.
  if (curve_sum.open(kPoints)) {
    curve_sum.x0 = 20.0f;
    curve_sum.x1 = 20000.0f;
    curve_sum.scale = lab::kLog;
    lab::Tap* parts[] = {&resp_low_cut, &resp_low, &resp_body, &resp_presence, &resp_air, &resp_high_cut};
    for (int p = 0; p < kPoints; ++p) {
      float sum = 0.0f;
      for (lab::Tap* part : parts) sum += part->data ? part->data[p] : 0.0f;
      curve_sum.set(p, sum);
    }
  }
  // The real thing: one sample through a second device, Clear off (one sample
  // is no bed of sound, so Clear would not move for it anyway).
  configure(probe, 0.0f);
  curve(curve_device, capture_device(probe));
  curve_error.value = worst_apart(curve_device, curve_sum, -20.0f);

  // The listener's bands as steps against frequency, from the bottom of the
  // lowest band to the top of the highest (AmbientEq::lay_out_bands).
  if (eq.num_bands_ > 0 && band_power.open(kPoints) && band_margin.open(kPoints)) {
    float lo[AmbientEq::kBands], hi[AmbientEq::kBands];
    for (int k = 0; k < eq.num_bands_; ++k) {
      const bool half = k < AmbientEq::kHalfOctaveBands;
      lo[k] = half ? AmbientEq::kFirstEdgeHz * std::exp2(0.5f * static_cast<float>(k))
                   : AmbientEq::kThirdsFromHz * std::exp2(static_cast<float>(k - AmbientEq::kHalfOctaveBands) / 3.0f);
      hi[k] = lo[k] * std::exp2(half ? 0.5f : 1.0f / 3.0f);
    }
    const float bottom = lo[0];
    const float top = hi[eq.num_bands_ - 1];
    band_power.x0 = band_margin.x0 = bottom;
    band_power.x1 = band_margin.x1 = top;
    band_power.scale = band_margin.scale = lab::kLog;
    int k = 0;
    for (int p = 0; p < kPoints; ++p) {
      const float hz = bottom * std::pow(top / bottom, static_cast<float>(p) / (kPoints - 1));
      while (k < eq.num_bands_ - 1 && hz >= hi[k]) ++k;
      band_power.set(p, heard_db[k]);
      band_margin.set(p, margin_db[k]);
    }
  }

  // Clear's cuts at the moment they were deepest, as the device designs them.
  {
    kit::Biquad cuts[AmbientEq::kBands];
    for (int k = 0; k < eq.num_bands_; ++k) {
      if (deepest_cuts[k] != 0.0f) cuts[k].set_peak(eq.centre_hz_[k], eq.band_q_[k], deepest_cuts[k], sr);
    }
    const int bands = eq.num_bands_;
    curve(resp_clear, capture([&](float v) {
            for (int k = 0; k < bands; ++k) v = cuts[k].process(v);
            return v;
          }));
  }
  glide();
}
