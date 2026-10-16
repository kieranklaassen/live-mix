// Spring reverb: Spring (cpp/devices/spring-reverb) run one sample at a time,
// so what its tank holds can be read out of the device as it works.
//
//   in ─► drive circuit ─► low-pass ─► one sample in five ─► the tank ─► low-pass ─► Tone ─► limit ─► width, mix ─► out
//
//   each spring of the tank, at a fifth of the page's rate:
//
//        x ─►(+)─► 100 all-passes ─► delay line ─┬─ half way ──────────► pickup
//             ▲                                  └─ far end, drifting ─┐
//             └──────────── × −gain ◄── damping ◄──────────────────────┘
//
// Read from the device: its output, and what leaves the tank once it is back
// at the page's rate and through Tone (the state of the device's own filter).
//
// Worked out here ("lesson"): what leaves the drive circuit, which is a local
// of the device's process(). The lab takes the device's own numbers after
// each sample (the pre-delay's line, what its two one-poles hold, Drip and
// Drive as it smoothed them) and writes the same four lines. "What the
// springs add" is the output less the dry sound the device mixed in.
//
// Computed by the kit ("kit"): the low-pass on the way down to the tank's
// rate, which is a copy of the device's own eight sections fed what the lab
// worked out. The "rebuilt" check holds its every fifth sample to what the
// device's tank took in on that sample, which the tank's own state gives
// back. The first spring's pickup and what comes back from its far end are
// the device's state too, once for every sample of the tank; a copy of the
// device's low-pass on the way up brings them to the page's rate so they can
// be heard. The drift of the far end is the kit's own oscillator, seeded and
// stepped as the device seeds and steps its own.
//
// A second device (`struck`) is given one sample and nothing more, with its
// Mix at 1 and the other controls as the lab has them, so that the springs'
// answer to a click can be drawn whatever source plays: the answer on each
// side, and the left side's spectrum over time through a window short enough
// to show each echo as a chirp.
//
// A third (`opened`) never runs its process(). The lab calls its tank by
// itself, one sample of the tank at a time: once with the loop cut (every
// spring's gain set to nothing), which leaves the hundred all-passes and
// nothing else, to measure how long they hold each frequency back; and once
// as it is, to draw how the tank's energy dies away below 1 kHz and above
// 2.5 kHz.
//
// The build part puts the tank together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has six pieces, each a
// function of `Built` below, in the order the steps add them: a delay line
// with a pickup half way along; the all-passes; feedback from the far end;
// damping; drift; several springs. The build is the tank and nothing else. It
// is fed what the device's tank is fed, and what its pickups hear is brought
// back to the page's rate by copies of the device's low-pass. Two copies of
// it run: one at the step the reader chose, which is what the "built" taps
// show, and one with all six pieces, whose three pickups are compared on
// every render with the pickups of the device's three springs (the
// "builtDifference" check). With all six the build does to a sample what the
// device's tank does, in the same order. A step before the last is the
// lesson's own: a tank with a piece missing, which the device never is.
//
// The device sleeps once nothing has gone in and its output has stayed under
// its floor for half a second; asleep, its tank and its filters stand still.
// Everything here that runs beside it stands still with it. The first time
// round the loop is there only so that a tail from the end is sounding at the
// start: no more of its end is played than the springs can remember.

#include "lab.h"

#include "../../cpp/devices/spring-reverb/spring_reverb.h"

using namespace livemix;

namespace {

SpringReverb spring;  // the loop goes through this one
SpringReverb struck;  // this one is given a single sample
SpringReverb opened;  // this one's tank is called by itself

constexpr int kCoils = SpringReverb::kSprings;
constexpr int kStages = SpringReverb::kStages;

lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control decay{"decay", "Decay", "s", 0.5f, 6.0f, 2.5f, lab::kLog};
lab::Control tension{"tension", "Tension", "", 0.0f, 1.0f, 0.5f};
lab::Control springs{"springs", "Springs", "", 0.0f, 2.0f, 1.0f, lab::kLinear, "One|Two|Three"};
lab::Control tone{"tone", "Tone", "Hz", 500.0f, 6000.0f, 6000.0f, lab::kLog};
lab::Control drip{"drip", "Drip", "", 0.0f, 1.0f, 0.0f};
lab::Control predelay{"predelay", "Pre-delay", "ms", 0.0f, 200.0f, 0.0f};
lab::Control drive{"drive", "Drive", "", 0.0f, 1.0f, 0.0f};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 1.0f};

// The loop, stage by stage.
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap driven{"driven", "After the drive circuit", lab::kAudio, lab::kLesson, 1};
lab::Tap lowered{"lowered", "Going into the tank", lab::kAudio, lab::kKit, 1};
lab::Tap returned{"returned", "Back from the far end", lab::kAudio, lab::kKit, 1};
lab::Tap wander{"wander", "The far end's drift", lab::kControl, lab::kKit, 1, "samples"};
lab::Tap pickup{"pickup", "The first spring, at its pickup", lab::kAudio, lab::kKit, 1};
lab::Tap toned{"toned", "Out of the tank, after Tone", lab::kAudio, lab::kDevice, 2};
lab::Tap added{"added", "What the springs add: the output less the dry sound", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

// One click through the springs alone.
lab::Tap chirps{"chirps", "One click through the springs, left side", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap hit_left{"hitLeft", "One click, at the left output", lab::kCurve, lab::kDevice, 1};
lab::Tap hit_right{"hitRight", "One click, at the right output", lab::kCurve, lab::kDevice, 1};

// The tank by itself.
lab::Tap held_back{"heldBack", "How long the all-passes hold each frequency back, measured", lab::kCurve,
                   lab::kDevice, 1, "ms"};
lab::Tap held_back_formula{"heldBackFormula", "The same, by the formula", lab::kCurve, lab::kLesson, 1, "ms"};
lab::Tap fall_low{"fallLow", "Energy still to come, below 1 kHz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap fall_high{"fallHigh", "Energy still to come, above 2.5 kHz", lab::kCurve, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt",
                   "The drive circuit and the low-pass worked out again, against what the device's tank took in",
                   "dB"};
lab::Check held_back_error{"heldBackError", "The measured hold against the formula: the largest difference", "ms"};
lab::Check fall_low_time{"fallLowTime", "Time to fall 60 dB below 1 kHz", "s"};
lab::Check fall_high_time{"fallHighTime", "Time to fall 60 dB above 2.5 kHz", "s"};

// The build part's taps.
lab::Tap built{"built", "The tank so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_back{"builtBack", "Back from the far end, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_wander{"builtWander", "The far end's drift, as built", lab::kControl, lab::kLesson, 1,
                      "samples"};
lab::Tap built_second{"builtSecond", "The second spring, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_third{"builtThird", "The third spring, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_chirps{"builtChirps", "One click through the tank so far, both sides together", lab::kFrames,
                      lab::kLesson, 1, "dB"};

// One spring of the tank so far.
struct Coil {
  kit::DelayLine<SpringReverb::kLineSize> line;
  float stage[kStages] = {};   // what each all-pass holds
  kit::OnePole damping;
  kit::Drift drift;
  float interpolator = 0.0f;   // what the read between two samples holds
  float a = 0.6f;              // the all-passes' coefficient
  float length = 256.0f;       // from the line's start to its far end, in the tank's samples
  float gain = 0.0f;           // what one round trip keeps
  int half = 128;              // where the pickup sits
  float feed = 0.0f;           // how much of the sound this spring is given
  float pan = 0.0f;            // where it is heard: -1 left, 1 right
  float wander = 0.0f;         // how far the far end has drifted, in samples
  float back = 0.0f;           // what came back in from the far end
  float pickup = 0.0f;         // what the pickup hears
};

// The tank so far: one function a piece, and run() to take one sample of the
// tank through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kLine = 0, kDisperse, kFeedBack, kDamp, kDrift, kSeveral };

  int pieces = kLine;
  Coil coil[kCoils];
  float left = 0.0f;
  float right = 0.0f;

  // A delay line with a pickup half way along it: what goes in at one end is
  // heard `half` samples later, once, and is gone.
  float along(Coil& c, float y) {
    c.line.write(flush_denormal(y));
    return c.line.read(c.half);
  }

  // Dispersion: a hundred first-order all-passes in a row, ahead of the line.
  // Each passes every frequency at full level and holds the high ones back
  // longer than the low ones, so a click comes out as a chirp.
  float disperse(Coil& c, float y) {
    const float rest = 1.0f - c.a * c.a;
    for (int m = 0; m < kStages; ++m) {
      const float held = c.stage[m];
      c.stage[m] = y - c.a * held;
      y = c.a * y + rest * held;
    }
    return y;
  }

  // Feedback: what reaches the far end of the line. The line's length is not
  // a whole number of samples, so the far end is read between two of them,
  // through a first-order all-pass whose delay is the fraction.
  float far_end(Coil& c) {
    float delay = c.length;
    if (pieces >= kDrift) delay += drifted(c);
    const int whole = static_cast<int>(delay - 0.2f);
    const float fraction = delay - static_cast<float>(whole);
    const float eta = (1.0f - fraction) / (1.0f + fraction);
    const float back = c.line.read(whole + 1) + eta * (c.line.read(whole) - c.interpolator);
    c.interpolator = flush_denormal(back);
    return pieces >= kDamp ? damped(c, back) : back;
  }

  // Damping: a one-pole low-pass on what comes back, so that every trip costs
  // the high notes a little more than the low ones.
  float damped(Coil& c, float back) { return c.damping.lowpass(back); }

  // Drift: the far end wanders by a third of a sample, slowly, so that no two
  // trips are quite the same length.
  float drifted(Coil& c) {
    c.wander = SpringReverb::kDriftSamples * c.drift.next();
    return c.wander;
  }

  // One sample of the tank through the pieces built so far, in the order it
  // meets them: `x` goes in, `left` and `right` are what the pickups hear.
  void run(float x) {
    left = 0.0f;
    right = 0.0f;
    const int count = pieces >= kSeveral ? kCoils : 1;
    for (int n = 0; n < count; ++n) {
      Coil& c = coil[n];
      if (c.feed == 0.0f) continue;  // a spring that is given nothing has nothing to say
      float y = x * c.feed;
      if (pieces >= kFeedBack) {
        c.back = -c.gain * far_end(c);
        y += c.back;
      }
      if (pieces >= kDisperse) y = disperse(c, y);
      c.pickup = along(c, y);
      left += c.pickup * (1.0f - c.pan);
      right += c.pickup * (1.0f + c.pan);
    }
    left *= 0.5f;
    right *= 0.5f;
  }

  // What Tension, Decay and its own round trip make of one spring.
  void tune(Coil& c, int n, float low_rate) {
    // One round trip, in the tank's samples, and the pickup half way round.
    const float trip = SpringReverb::kRoundTrip[n] * low_rate;
    c.half = kit::clamp_int(static_cast<int>(0.5f * trip + 0.5f), 1, SpringReverb::kLineSize - 8);
    // Tension is the all-passes' coefficient, a little apart from spring to spring.
    c.a = kit::lerp(SpringReverb::kSlack, SpringReverb::kTaut, tension.value) + SpringReverb::kCoefficientOffset[n];
    // The all-passes hold the lowest notes back (1 - a) / (1 + a) of a sample
    // each. The line is the rest of the trip, so the echoes stay a trip apart.
    const float held = static_cast<float>(kStages) * (1.0f - c.a) / (1.0f + c.a);
    c.length = kit::clamp(trip - held, 4.0f, static_cast<float>(SpringReverb::kLineSize - 8));
    // What one trip keeps, so that a sound falls 60 dB in Decay seconds.
    c.gain = kit::rt60_gain(trip, decay.value, low_rate);
    // How much of its last answer the damping keeps: more as a trip keeps less.
    c.damping.a = kit::clamp(1.0f - std::pow(c.gain, SpringReverb::kTrebleLoss), 0.0f, 0.5f);
  }

  // Several springs: which are fed, how much, and where each is heard. Until
  // this piece there is one spring, in the middle.
  void place(Coil& c, int n) {
    const int mode = springs.choice();
    c.feed = pieces >= kSeveral ? SpringReverb::kFeed[mode][n] : (n == 0 ? 1.0f : 0.0f);
    c.pan = pieces >= kSeveral ? SpringReverb::kPan[mode][n] : 0.0f;
  }

  void start(int pieces_, float low_rate) {
    pieces = pieces_;
    left = 0.0f;
    right = 0.0f;
    for (int n = 0; n < kCoils; ++n) {
      Coil& c = coil[n];
      c.line.clear();
      for (float& held : c.stage) held = 0.0f;
      c.damping.reset();
      c.interpolator = 0.0f;
      c.wander = 0.0f;
      c.back = 0.0f;
      c.pickup = 0.0f;
      // Seeded and paced as spring_reverb.h seeds and paces its own.
      c.drift.seed(0x243F6A88u + 0x9E3779B9u * static_cast<uint32_t>(n));
      c.drift.set_rate(SpringReverb::kDriftHz[n], low_rate);
      tune(c, n, low_rate);
      place(c, n);
    }
  }
};

lab::Build build{"A line and a pickup|A hundred all-passes|Feedback|Damping|Drift|Several springs", Built::kSeveral,
                 -120.0f, "The tank as built, all six pieces, against the pickups of the device's own three springs"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device
Built rung;   // at the step the reader chose, given one sample: the build's answer to a click

// The device's low-pass on the way down to the tank's rate or back up from it:
// copies of its own sections, with a state of their own.
template <int Sections>
struct Chain {
  kit::Biquad section[Sections];

  void copy(const kit::Biquad* from) {
    for (int k = 0; k < Sections; ++k) {
      section[k] = from[k];
      section[k].reset();
    }
  }
  float process(float x) {
    for (int k = 0; k < Sections; ++k) x = section[k].process(x);
    return x;
  }
};

using Down = Chain<SpringReverb::kDownSections>;
using Up = Chain<SpringReverb::kUpSections>;

Down down;            // the main path: what the drive circuit sends down to the tank
Up up_pickup;         // the first spring's pickup, brought up
Up up_returned;       // what came back from its far end, brought up
Up up_built[kCoils];  // the build's three pickups, brought up
Up up_built_back;     // what came back from the build's far end, brought up
kit::Drift drifting;  // the first spring's drift again

void configure(SpringReverb& device, float mix_value) {
  using namespace spring_reverb;
  device.init(lab::kSampleRate);
  device.set_param(kMix, mix_value);
  device.set_param(kDecay, decay.value);
  device.set_param(kTension, tension.value);
  device.set_param(kSprings, static_cast<float>(springs.choice()));
  device.set_param(kTone, tone.value);
  device.set_param(kDrip, drip.value);
  device.set_param(kPredelay, predelay.value);
  device.set_param(kDrive, drive.value);
  device.set_param(kWidth, width.value);
}

// A device renders a sample when something goes in or it is not yet asleep
// (kit::IdleGate::wake). Asleep, it writes zeros and nothing in it moves.
bool renders(const SpringReverb& device, float left, float right) {
  return left != 0.0f || right != 0.0f || !device.idle_.asleep();
}

// The first time round the loop is there only so that what still rings at the
// loop's end is sounding at its start. The springs remember no further back
// than the pre-delay and the time their echoes take to fall 100 dB, which at
// 60 dB in Decay seconds is five thirds of Decay. Only that much of the end
// is played into the device; before it nothing goes in and the device sleeps.
// The playing begins on a sample where the device's control clock and its
// count of five would have stood anyway. Returns where it begins.
int sleep_through(SpringReverb& device, int frames) {
  const float remembered = predelay.value * 0.001f + decay.value * (100.0f / 60.0f) + 0.25f;
  int wake = frames - static_cast<int>(remembered * lab::kSampleRate);
  wake = wake > 0 ? wake - wake % 160 : 0;
  int i = 0;
  while (i < wake) {
    const int n = wake - i < SpringReverb::kMaxBlockFrames ? wake - i : SpringReverb::kMaxBlockFrames;
    device.process(n);  // the input is already silence
    i += n;
  }
  return i;
}

// A value over time as it stood the second time round the loop, kept as it
// was: the drift does not come round with the loop, and a crossfade from one
// place in it to another would draw a kink that no spring made.
void keep(lab::Tap& tap, int i, float value) {
  if (!tap.data && !tap.open(lab::frames() / lab::kControlPeriod)) return;
  tap.set((i - lab::frames()) / lab::kControlPeriod, value);
}

// A sound's spectrum as it changes, through a window short enough to tell an
// echo's low notes from its high ones in time: `columns` frames of `window`
// samples under a Hann window, each set in a transform of 1,024 points by the
// kit, in dB where a full-scale sine reads 0. Rows are the 513 bins from 0 Hz
// to half the sample rate; a column stands at the middle of its frame.
constexpr int kShortSize = 1024;
constexpr int kShortRows = kShortSize / 2 + 1;

void short_picture(lab::Tap& tap, const float* x, int count, int columns, int window) {
  static kit::Fft<kShortSize> fft;
  static float shape[kShortSize];
  static float re[kShortSize];
  static float im[kShortSize];
  static int shaped = 0;
  if (shaped != window) {
    if (shaped == 0) fft.init();
    for (int n = 0; n < window; ++n) {
      shape[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / window));
    }
    shaped = window;
  }
  if (count <= 0 || !tap.open(columns * kShortRows)) return;
  tap.columns = columns;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(count) / lab::kSampleRate;
  const double full = (window / 4.0) * (window / 4.0);
  for (int c = 0; c < columns; ++c) {
    const int middle = static_cast<int>((2LL * c + 1) * count / (2 * columns));
    const int start = middle - window / 2;
    for (int n = 0; n < kShortSize; ++n) {
      const int i = start + n;
      re[n] = n < window && i >= 0 && i < count ? x[i] * shape[n] : 0.0f;
      im[n] = 0.0f;
    }
    fft.forward(re, im);
    float* column = tap.data + c * kShortRows;
    for (int k = 0; k < kShortRows; ++k) {
      const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
      column[k] = lab::power_to_db(static_cast<float>(power / full));
    }
  }
}

constexpr float kClick = 0.1f;   // a tenth of full scale, where the drive circuit is all but a wire
constexpr int kStruck = 16800;   // 0.35 s: the stretch of a click's answer that is drawn
constexpr int kHit = 6720;       // 140 ms: the stretch drawn as a wave
constexpr int kColumns = 280;    // a column every 1.25 ms
constexpr int kWindow = 240;     // 5 ms

// What the last of `points` samples stands at, in milliseconds after the first.
float span_ms(int points) { return 1000.0f * static_cast<float>(points - 1) / lab::kSampleRate; }

// One click into the second device, with its Mix at 1: the springs' answer,
// written as the answer to a click of full scale.
void strike() {
  configure(struck, 1.0f);
  float* left = lab::take(kStruck);
  float* right = lab::take(kStruck);
  if (!left || !right || !hit_left.open(kHit) || !hit_right.open(kHit)) return;
  for (int i = 0; i < kStruck; ++i) {
    struck.in_left()[0] = i == 0 ? kClick : 0.0f;
    struck.in_right()[0] = i == 0 ? kClick : 0.0f;
    struck.process(1);
    left[i] = struck.out_left()[0] / kClick;
    right[i] = struck.out_right()[0] / kClick;
  }
  hit_left.x0 = hit_right.x0 = 0.0f;
  hit_left.x1 = hit_right.x1 = span_ms(kHit);
  for (int i = 0; i < kHit; ++i) {
    hit_left.data[i] = left[i];
    hit_right.data[i] = right[i];
  }
  short_picture(chirps, left, kStruck, kColumns, kWindow);
}

// One click into the tank so far: a single sample at the page's rate, sent
// down to the tank's rate through the low-pass the device sends its sound
// down through, and what the pickups hear brought back up.
void ring(float low_rate, int factor) {
  rung.start(build.at(), low_rate);
  Down going_down;
  Up coming_up;
  going_down.copy(spring.down_);
  coming_up.copy(spring.up_[0]);
  float* both = lab::take(kStruck);
  if (!both) return;
  for (int i = 0; i < kStruck; ++i) {
    const float x = going_down.process(i == 0 ? 1.0f : 0.0f);
    const bool ticks = i % factor == 0;
    if (ticks) rung.run(x);
    both[i] = coming_up.process(ticks ? static_cast<float>(factor) * 0.5f * (rung.left + rung.right) : 0.0f);
  }
  short_picture(built_chirps, both, kStruck, kColumns, kWindow);
}

// How long the hundred all-passes hold each frequency back, measured on the
// device's own tank with the loop cut: one sample goes in, nothing comes back
// from the far end, and what the all-passes hand the first spring's line is
// their answer and nothing else. The time a frequency is held is the middle,
// in time, of that answer's share at the frequency: the real part of
// sum(n h[n] e^-jwn) over sum(h[n] e^-jwn).
constexpr int kHeldPoints = 97;  // 0 Hz to the top of the tank's band, in steps of 50 Hz
constexpr int kRing = 8192;      // samples of the tank: the all-passes have rung out by here

float held_measured_[kHeldPoints];
float held_written_[kHeldPoints];
float held_worst_ = 0.0f;
float held_for_ = -1.0f;  // the coefficient the last measurement was made at

void measure_hold() {
  configure(opened, 1.0f);
  opened.control();
  const float low_rate = opened.low_rate_;
  const float a = opened.spring_[0].coefficient;
  if (a != held_for_) {
    static float h[kRing];
    for (int n = 0; n < kCoils; ++n) opened.spring_[n].gain = 0.0f;  // the loop, cut
    const float feed = opened.spring_[0].feed.value;
    for (int i = 0; i < kRing; ++i) {
      float left = 0.0f, right = 0.0f;
      opened.tank(i == 0 ? 1.0f : 0.0f, &left, &right);
      h[i] = opened.spring_[0].line.read(1) / feed;
    }
    held_worst_ = 0.0f;
    for (int p = 0; p < kHeldPoints; ++p) {
      const double w = lab::kPi * p / (kHeldPoints - 1);
      const double cw = std::cos(w), sw = std::sin(w);
      double c = 1.0, s = 0.0;
      double re = 0.0, im = 0.0, late_re = 0.0, late_im = 0.0;
      for (int n = 0; n < kRing; ++n) {
        re += h[n] * c;
        im -= h[n] * s;
        late_re += n * (h[n] * c);
        late_im -= n * (h[n] * s);
        const double next = c * cw - s * sw;
        s = s * cw + c * sw;
        c = next;
      }
      const double samples = (late_re * re + late_im * im) / (re * re + im * im);
      // The formula: each all-pass holds a frequency (1 - a^2) / (1 + 2a cos w + a^2) samples.
      const double written = kStages * (1.0 - a * a) / (1.0 + 2.0 * a * std::cos(w) + a * a);
      held_measured_[p] = static_cast<float>(1000.0 * samples / low_rate);
      held_written_[p] = static_cast<float>(1000.0 * written / low_rate);
      const float error = std::fabs(held_measured_[p] - held_written_[p]);
      if (error > held_worst_) held_worst_ = error;
    }
    held_for_ = a;
  }
  if (!held_back.open(kHeldPoints) || !held_back_formula.open(kHeldPoints)) return;
  held_back.x0 = held_back_formula.x0 = 0.0f;
  held_back.x1 = held_back_formula.x1 = 0.5f * low_rate;
  for (int p = 0; p < kHeldPoints; ++p) {
    held_back.data[p] = held_measured_[p];
    held_back_formula.data[p] = held_written_[p];
  }
  held_back_error.value = held_worst_;
}

// When a decay curve first stands at `level` dB, in seconds. Negative when it never does.
float time_at(const lab::Tap& curve, float level) {
  if (!curve.data || curve.length < 2) return -1.0f;
  const float step = (curve.x1 - curve.x0) / static_cast<float>(curve.length - 1);
  for (int p = 1; p < curve.length; ++p) {
    if (curve.data[p] <= level) {
      const float above = curve.data[p - 1];
      const float part = above > curve.data[p] ? (above - level) / (above - curve.data[p]) : 0.0f;
      return curve.x0 + (static_cast<float>(p - 1) + part) * step;
    }
  }
  return -1.0f;
}

// The time to fall 60 dB as it is read off a decay curve: three times the
// time from -5 dB to -25 dB. The first 5 dB hold the first uneven echoes, and
// the foot of the curve bends down where the listening stopped.
float fall_time(const lab::Tap& curve) {
  const float from = time_at(curve, -5.0f);
  const float to = time_at(curve, -25.0f);
  return from >= 0.0f && to > from ? 3.0f * (to - from) : 0.0f;
}

// How the tank's energy dies away at the two ends of its band: one sample
// into the device's own tank, as it is, and what its pickups hear through a
// fourth-order low-pass at 1 kHz and a fourth-order high-pass at 2.5 kHz.
constexpr int kFallMost = 48000;  // the longest the tank is listened to: 5 s of its own samples
constexpr int kFallPoints = 400;

// The two curves as they were last measured, and the three settings that
// reach them. They are measured again only when one of them has moved.
float fall_low_[kFallPoints];
float fall_high_[kFallPoints];
float fall_seconds_ = 0.0f;
float fall_for_[3] = {-1.0f, -1.0f, -1.0f};

void measure_fall() {
  const float settings[3] = {decay.value, tension.value, static_cast<float>(springs.choice())};
  if (settings[0] != fall_for_[0] || settings[1] != fall_for_[1] || settings[2] != fall_for_[2]) {
    configure(opened, 1.0f);
    opened.control();
    const float low_rate = opened.low_rate_;
    // Long enough for the echoes to fall some 45 dB.
    int listen = static_cast<int>((0.75f * decay.value + 0.3f) * low_rate);
    if (listen > kFallMost) listen = kFallMost;
    float* low = lab::take(listen);
    float* high = lab::take(listen);
    if (!low || !high) return;
    kit::Svf low_band[2], high_band[2];
    low_band[0].set(1000.0f, 0.54f, low_rate);
    low_band[1].set(1000.0f, 1.31f, low_rate);
    high_band[0].set(2500.0f, 0.54f, low_rate);
    high_band[1].set(2500.0f, 1.31f, low_rate);
    for (int i = 0; i < listen; ++i) {
      float left = 0.0f, right = 0.0f;
      opened.tank(i == 0 ? 1.0f : 0.0f, &left, &right);
      const float both = 0.5f * (left + right);
      low[i] = low_band[1].lowpass(low_band[0].lowpass(both));
      high[i] = high_band[1].highpass(high_band[0].highpass(both));
    }
    lab::energy_decay_tap(fall_low, low, listen, kFallPoints);
    lab::energy_decay_tap(fall_high, high, listen, kFallPoints);
    if (!fall_low.data || !fall_high.data) return;
    for (int p = 0; p < kFallPoints; ++p) {
      fall_low_[p] = fall_low.data[p];
      fall_high_[p] = fall_high.data[p];
    }
    fall_seconds_ = static_cast<float>(listen) / low_rate;
    for (int k = 0; k < 3; ++k) fall_for_[k] = settings[k];
  } else {
    if (!fall_low.open(kFallPoints) || !fall_high.open(kFallPoints)) return;
    for (int p = 0; p < kFallPoints; ++p) {
      fall_low.data[p] = fall_low_[p];
      fall_high.data[p] = fall_high_[p];
    }
  }
  fall_low.x0 = fall_high.x0 = 0.0f;
  fall_low.x1 = fall_high.x1 = fall_seconds_;
  fall_low_time.value = fall_time(fall_low);
  fall_high_time.value = fall_time(fall_high);
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(spring, mix.value);
  const float low_rate = spring.low_rate_;
  const int factor = spring.factor_;
  const float up_gain = static_cast<float>(factor);
  const float most_predelay = kit::DelayLine<SpringReverb::kPredelaySize>::max_delay() - 2.0f;

  down.copy(spring.down_);
  up_pickup.copy(spring.up_[0]);
  up_returned.copy(spring.up_[0]);
  up_built_back.copy(spring.up_[0]);
  for (Up& one : up_built) one.copy(spring.up_[0]);
  drifting.seed(0x243F6A88u);
  drifting.set_rate(SpringReverb::kDriftHz[0], low_rate);

  // The build part: the chosen step, and the whole build that is held to the device.
  // When the reader is on the last step the two are one.
  shown.start(build.at(), low_rate);
  const bool both = build.at() != build.compared_step;
  if (both) held.start(build.compared_step, low_rate);
  const Built& compared = both ? held : shown;
  const int coils = shown.pieces >= Built::kSeveral ? kCoils : 1;
  // The low-passes on the way up remember a few milliseconds. The first time
  // round they are run only for the last tenth of a second.
  const int listening = frames - 4800;

  double apart = 0.0, whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;
  // The first spring's, as of the tank's last sample.
  float came_back = 0.0f;
  float heard = 0.0f;
  float drifted = 0.0f;

  const int total = lab::total();
  for (int i = sleep_through(spring, frames); i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const bool kept = i >= frames;
    const bool awake = renders(spring, left, right);
    const bool ticks = awake && spring.phase_ == 0;  // the tank takes a sample on this one
    const float first_before = spring.stage_[0][0];
    spring.in_left()[0] = left;
    spring.in_right()[0] = right;
    spring.process(1);
    const float out_left = spring.out_left()[0];
    const float out_right = spring.out_right()[0];

    float sent = 0.0f, fed = 0.0f, back_up = 0.0f, heard_up = 0.0f;
    float ups[kCoils] = {0.0f, 0.0f, 0.0f};
    float built_left = 0.0f, built_right = 0.0f, built_back_up = 0.0f;
    if (awake) {
      // The drive circuit again, from the device's own numbers after this
      // sample: the pre-delay's line, the 60 Hz high-pass, Drip, Drive.
      float x = spring.predelay_.read_linear(kit::min(1.0f + spring.predelay_time_.value, most_predelay));
      x -= spring.rumble_.state;
      x += spring.drip_.value * SpringReverb::kDripGain * (x - spring.emphasis_.state);
      x = kit::fast_tanh(x * spring.drive_.value) / spring.drive_.value;
      sent = x;
      fed = down.process(x);

      if (ticks) {
        const SpringReverb::Spring& first = spring.spring_[0];
        // What the tank took in: its first all-pass wrote `y - a s`, and y
        // was `x feed - gain damped`.
        const float into_first = spring.stage_[0][0] + first.coefficient * first_before;
        const float taken = (into_first + first.gain * first.damping.state) / first.feed.value;
        if (kept) {
          const double d = static_cast<double>(fed) - taken;
          apart += d * d;
          whole += static_cast<double>(taken) * taken;
        }
        came_back = -first.gain * first.damping.state;
        heard = first.line.read(first.half);
        drifted = SpringReverb::kDriftSamples * drifting.next();

        // The build part, beside the device's tank.
        shown.run(fed);
        if (both) held.run(fed);
        if (kept) {
          for (int n = 0; n < kCoils; ++n) {
            const double own = spring.spring_[n].line.read(spring.spring_[n].half);
            const double d = static_cast<double>(compared.coil[n].pickup) - own;
            built_apart += d * d;
            built_whole += own * own;
          }
        }
      }

      // Back up to the page's rate: one sample of the tank, times five, then
      // four zeros, through the device's low-pass.
      if (i >= listening) {
        back_up = up_returned.process(ticks ? up_gain * came_back : 0.0f);
        heard_up = up_pickup.process(ticks ? up_gain * heard : 0.0f);
        for (int n = 0; n < coils; ++n) {
          if (shown.coil[n].feed == 0.0f) continue;
          ups[n] = up_built[n].process(ticks ? up_gain * shown.coil[n].pickup : 0.0f);
          built_left += ups[n] * (1.0f - shown.coil[n].pan);
          built_right += ups[n] * (1.0f + shown.coil[n].pan);
        }
        built_left *= 0.5f;
        built_right *= 0.5f;
        if (shown.pieces >= Built::kFeedBack) {
          built_back_up = up_built_back.process(ticks ? up_gain * shown.coil[0].back : 0.0f);
        }
      }
    }
    if (!kept) continue;

    in_tap.put(i, left, right);
    driven.put(i, sent);
    lowered.put(i, fed);
    returned.put(i, back_up);
    pickup.put(i, heard_up);
    toned.put(i, awake ? spring.tone_[0].low : 0.0f, awake ? spring.tone_[1].low : 0.0f);
    added.put(i, out_left - spring.dry_.value * left, out_right - spring.dry_.value * right);
    out_tap.put(i, out_left, out_right);
    built.put(i, built_left, built_right);
    built_back.put(i, built_back_up);
    built_second.put(i, ups[1]);
    built_third.put(i, ups[2]);
    if (i % lab::kControlPeriod == 0 && i < 2 * frames) {
      keep(wander, i, drifted);
      keep(built_wander, i, shown.coil[0].wander);
    }
  }
  rebuilt.value = lab::ratio_db(apart, whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  strike();
  ring(low_rate, factor);
  measure_hold();
  measure_fall();
}
