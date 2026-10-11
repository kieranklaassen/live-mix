// Native harness for Sift (cpp/devices/sift). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a three-way split: what each part keeps and
// what it gives up, that the parts add back up, and what each blur does to
// its own part and to no other. Every bound below stands beside the figure
// that was measured when it was set (48 kHz unless it says otherwise).

#include "../devices/sift/sift.h"

#include <algorithm>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Sift;
namespace p = livemix::sift;

static Sift device;

static const float kRate = 48000.0f;
static const size_t kLatency = Sift::kLatency;
static char label[240];

// A check whose label carries what was measured: asserted, and printed.
#define SAY(condition)            \
  do {                            \
    EXPECT(condition, label);     \
    std::printf("  %s\n", label); \
  } while (0)
// The bottom of a level's range, where its part is silent.
static const float kOff = p::kParamMin[p::kTones];
// A control's name by the control, not by its number: the order of "params" in device.json may change.
static const char* name_of(int id) {
  switch (id) {
    case p::kTones: return "tones";
    case p::kAttacks: return "attacks";
    case p::kAir: return "air";
    case p::kSharpness: return "sharpness";
    case p::kEdge: return "edge";
    case p::kHold: return "hold";
    case p::kSoften: return "soften";
    case p::kLate: return "late";
    case p::kScatter: return "scatter";
    case p::kMix: return "mix";
    default: return "?";
  }
}

// --- settings ------------------------------------------------------------------------------

// The device as it starts, at `rate`.
static void fresh(float rate = kRate) { device.init(rate); }

// No blur at all: what is left is the split and the three levels.
static void no_blur() {
  device.set_param(p::kHold, 0.0f);
  device.set_param(p::kSoften, 0.0f);
  device.set_param(p::kLate, 0.0f);
  device.set_param(p::kScatter, 0.0f);
}

// The three levels in dB.
static void levels(float tones, float attacks, float air) {
  device.set_param(p::kTones, tones);
  device.set_param(p::kAttacks, attacks);
  device.set_param(p::kAir, air);
}

// One part alone at unity (0 tones, 1 attacks, 2 air), the others silent, no blur.
static void only(int part, float rate = kRate) {
  fresh(rate);
  levels(part == 0 ? 0.0f : kOff, part == 1 ? 0.0f : kOff, part == 2 ? 0.0f : kOff);
  no_blur();
}

// --- signals -------------------------------------------------------------------------------

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

static std::vector<float> then(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// A click of one sample every `every` seconds, the first at a quarter second.
static std::vector<float> clicks(float seconds, float every, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t at = static_cast<size_t>(0.25f * rate); at < out.size();
       at += static_cast<size_t>(every * rate)) {
    out[at] = gain;
  }
  return out;
}

// A sine that fades in and out over `fade` seconds (a raised cosine), so
// that its start is a note beginning and not a click.
static std::vector<float> burst(float hz, float seconds, float fade, float gain, float rate = kRate) {
  std::vector<float> out = sine(hz, seconds, rate, gain);
  const size_t n = static_cast<size_t>(fade * rate);
  for (size_t i = 0; i < n && i < out.size(); ++i) {
    const float w =
        static_cast<float>(0.5 - 0.5 * std::cos(kPi * static_cast<double>(i) / static_cast<double>(n)));
    out[i] *= w;
    out[out.size() - 1 - i] *= w;
  }
  return out;
}

// A struck note: `harmonics` partials that die away, the higher the sooner,
// under a burst of noise 6 ms long at its start (the hammer).
static std::vector<float> struck(float hz, float seconds, float decay_seconds, int harmonics, float gain,
                                 float hammer) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (int h = 1; h <= harmonics; ++h) {
    const double f = static_cast<double>(hz) * h;
    if (f > 16000.0) break;
    const double decay = decay_seconds / std::sqrt(static_cast<double>(h));
    for (size_t i = 0; i < out.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      out[i] += static_cast<float>(gain / h * std::exp(-t / decay) * std::sin(2.0 * kPi * f * t + h));
    }
  }
  for (size_t i = 0; i < 1440 && i < out.size(); ++i) {
    out[i] += hammer * white() * static_cast<float>(std::exp(-static_cast<double>(i) / 300.0));
  }
  return out;
}

// A phrase of four struck notes over a little hiss: ordinary material.
static std::vector<float> phrase() {
  rng_state() = 0x51f7u;
  std::vector<float> out;
  for (float hz : {220.0f, 329.63f, 261.63f, 392.0f})
    out = then(out, struck(hz, 0.5f, 0.6f, 12, 0.3f, 0.25f));
  return add(out, noise(2.0f, kRate, 0.01f));
}

// --- measures ------------------------------------------------------------------------------

static double energy(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += static_cast<double>(x[i]) * x[i];
  return sum;
}

// How much of `in` is left in `out`, in dB, over [from, to) of the input:
// the output is read kLatency later.
static double kept_db(const std::vector<float>& out, const std::vector<float>& in, size_t from, size_t to) {
  return db(std::sqrt(energy(out, from + kLatency, to + kLatency) / std::max(energy(in, from, to), 1.0e-30)));
}

// The largest |out[i + delay] - in[i]| over the whole input.
static double worst_difference(const std::vector<float>& out, const std::vector<float>& in, size_t delay) {
  double worst = 0.0;
  for (size_t i = 0; i + delay < out.size() && i < in.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out[i + delay]) - in[i]));
  }
  return worst;
}

// The RMS of a - b as a share of the RMS of a, in dB.
static double difference_db(const std::vector<float>& a, const std::vector<float>& b) {
  double diff = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    const double d = static_cast<double>(a[i]) - b[i];
    diff += d * d;
  }
  return db(std::sqrt(diff / std::max(energy(a), 1.0e-30)));
}

// A signal with what lies under `hz` taken out (24 dB an octave): hiss that
// lies above the split's lean toward tones at the bottom of the spectrum.
static std::vector<float> above(std::vector<float> x, float hz, float rate = kRate) {
  for (int stage = 0; stage < 2; ++stage) {
    const double q = stage == 0 ? 0.5412 : 1.3066;
    const double w = 2.0 * kPi * hz / rate, alpha = std::sin(w) / (2.0 * q), c = std::cos(w);
    const double b0 = (1.0 + c) / 2.0 / (1.0 + alpha), b1 = -(1.0 + c) / (1.0 + alpha);
    const double a1 = -2.0 * c / (1.0 + alpha), a2 = (1.0 - alpha) / (1.0 + alpha);
    double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0;
    for (float& v : x) {
      const double y = b0 * v + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1, x1 = v, y2 = y1, y1 = y;
      v = static_cast<float>(y);
    }
  }
  return x;
}

static std::vector<float> padded(std::vector<float> x, float seconds, float rate = kRate) {
  x.resize(x.size() + static_cast<size_t>(seconds * rate), 0.0f);
  return x;
}

// --- the medians ---------------------------------------------------------------------------

static void check_medians() {
  // Every pattern of nine zeros and ones, which proves a network of
  // exchanges for every input, and random values as floats and as bits.
  int wrong = 0;
  for (int pattern = 0; pattern < 512; ++pattern) {
    int v[9];
    for (int i = 0; i < 9; ++i) v[i] = (pattern >> i) & 1;
    int sorted[9];
    std::copy(v, v + 9, sorted);
    std::sort(sorted, sorted + 9);
    if (Sift::median9(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]) != sorted[4]) ++wrong;
    if (Sift::third9(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]) != sorted[2]) ++wrong;
  }
  for (int pattern = 0; pattern < 16; ++pattern) {
    int v[4];
    for (int i = 0; i < 4; ++i) v[i] = (pattern >> i) & 1;
    int sorted[4];
    std::copy(v, v + 4, sorted);
    std::sort(sorted, sorted + 4);
    if (Sift::second4(v[0], v[1], v[2], v[3]) != sorted[2]) ++wrong;
  }
  rng_state() = 0xabcdefu;
  for (int trial = 0; trial < 2000; ++trial) {
    float v[9];
    int32_t bits[9];
    for (int i = 0; i < 9; ++i) {
      v[i] = std::fabs(white()) * (trial % 3 == 0 ? 1.0e-9f : 300.0f);
      bits[i] = Sift::bits_of(v[i]);
    }
    float sorted[9];
    std::copy(v, v + 9, sorted);
    std::sort(sorted, sorted + 9);
    if (Sift::median9(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]) != sorted[4]) ++wrong;
    if (Sift::magnitude_of(Sift::median9(bits[0], bits[1], bits[2], bits[3], bits[4], bits[5], bits[6],
                                         bits[7], bits[8])) != sorted[4]) {
      ++wrong;
    }
    if (Sift::magnitude_of(Sift::third9(bits[0], bits[1], bits[2], bits[3], bits[4], bits[5], bits[6],
                                        bits[7], bits[8])) != sorted[2]) {
      ++wrong;
    }
  }
  std::snprintf(label, sizeof label,
                "the medians agree with a sort for every pattern and on the bits (%d wrong)", wrong);
  EXPECT(wrong == 0, label);
  EXPECT(Sift::level_gain(0.0f) == 1.0f, "a level of 0 dB is a gain of exactly 1");
  EXPECT(Sift::level_gain(kOff) == 0.0f && kOff == -30.0f, "a level at the bottom of its range is silence");
  EXPECT_NEAR(Sift::level_gain(6.0f), 2.028f, 0.001f, "a level of +6 dB is a gain of 2.03");
  EXPECT_NEAR(Sift::hold_seconds(1.0f), 12.0f, 1.0e-4f, "Hold at the top is 12 s to -60 dB");
  EXPECT_NEAR(Sift::hold_seconds(p::kParamDefault[p::kHold]), 1.972f, 0.001f,
              "the default Hold is 1.97 s to -60 dB");
}

// --- the latency, Mix 0 and the sum of the parts ---------------------------------------------

static void check_sum() {
  for (float rate : {48000.0f, 96000.0f}) {
    rng_state() = 0x77u;
    const std::vector<float> left = add(noise(1.0f, rate, 0.3f), clicks(1.0f, 0.2f, 0.6f, rate));
    const std::vector<float> right = add(noise(1.0f, rate, 0.3f), sine(330.0f, 1.0f, rate, 0.4f));

    // Mix 0: the input, 4352 samples late, bit for bit, whatever else is set.
    fresh(rate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kLate, 120.0f);
    device.set_param(p::kHold, 0.8f);
    Stereo out = run(device, left, right);
    bool same = true;
    for (size_t i = 0; i + kLatency < left.size(); ++i) {
      same = same && out.left[i + kLatency] == left[i] && out.right[i + kLatency] == right[i];
    }
    for (size_t i = 0; i < kLatency; ++i) same = same && out.left[i] == 0.0f && out.right[i] == 0.0f;
    std::snprintf(label, sizeof label, "Mix 0 is the input %d samples late, bit for bit, at %.0f Hz",
                  static_cast<int>(kLatency), rate);
    SAY(same);

    // The three parts at unity with no blur add back up to the input, at any
    // Sharpness and any Edge: the split is a partition. Measured 1.8e-7.
    for (int which = 0; which < 3; ++which) {
      fresh(rate);
      levels(0.0f, 0.0f, 0.0f);
      no_blur();
      device.set_param(p::kSharpness, which == 0 ? 0.0f : which == 1 ? 0.5f : 1.0f);
      device.set_param(p::kEdge, which == 0 ? 0.0f : which == 1 ? 1.0f : 0.5f);
      out = run(device, left, right);
      const double worst =
          std::max(worst_difference(out.left, left, kLatency), worst_difference(out.right, right, kLatency));
      std::snprintf(
          label, sizeof label,
          "the three parts at unity add back up to the input at %.0f Hz, case %d (worst difference %.2g)",
          rate, which, worst);
      SAY(worst < 2.0e-6);
    }
  }
}

// --- what each part keeps -------------------------------------------------------------------

static void check_parts() {
  const float seconds = 5.0f;
  rng_state() = 42;
  const std::vector<float> tone = sine(440.0f, seconds, kRate, 0.25f);
  const std::vector<float> hits = clicks(seconds, 0.5f, 0.8f);
  const std::vector<float> hiss = noise(seconds, kRate, 0.05f);
  const std::vector<float> all = add(add(tone, hits), hiss);
  const size_t from = static_cast<size_t>(kRate), to = static_cast<size_t>(4.0f * kRate);
  // kept[part][source] in dB, each source alone through each part alone.
  double kept[3][3];
  double mixed_sine[3];
  const std::vector<float>* sources[3] = {&tone, &hits, &hiss};
  for (int part = 0; part < 3; ++part) {
    for (int s = 0; s < 3; ++s) {
      only(part);
      kept[part][s] = kept_db(run(device, *sources[s]).left, *sources[s], from, to);
    }
    only(part);
    const Stereo out = run(device, all);
    mixed_sine[part] = db(tone_level(out.left, 440.0, kRate, from + kLatency, to + kLatency) / 0.25);
  }
  std::printf("  parts alone, in dB of what went in (sine, clicks, noise | the sine inside all three):\n");
  const char* names[3] = {"tones", "attacks", "air"};
  for (int part = 0; part < 3; ++part) {
    std::printf("    %-8s %7.1f %7.1f %7.1f | %7.1f\n", names[part], kept[part][0], kept[part][1],
                kept[part][2], mixed_sine[part]);
  }
  // Measured: tones -0.0, -240, -16.0 | attacks -109.6, -0.0, -16.6 | air -99, -240, -2.2.
  EXPECT(kept[0][0] > -0.2, "the tones keep a sine whole");
  EXPECT(kept[0][1] < -80.0, "the tones hold no clicks");
  EXPECT(kept[0][2] < -13.0, "the tones hold little steady noise");
  EXPECT(kept[1][1] > -0.2, "the attacks keep clicks whole");
  EXPECT(kept[1][0] < -80.0, "the attacks hold nothing of a held sine");
  EXPECT(kept[1][2] < -13.0, "the attacks hold little steady noise");
  EXPECT(kept[2][2] > -3.5, "the air keeps steady noise");
  EXPECT(kept[2][0] < -80.0, "the air holds nothing of a held sine");
  EXPECT(kept[2][1] < -80.0, "the air holds no clicks");
  // With clicks and noise in the same signal the sine still goes to the tones.
  EXPECT(mixed_sine[0] > -0.5, "the tones keep the sine out of a mixture");
  EXPECT(mixed_sine[1] < -40.0, "the attacks hold little of the sine in a mixture");
  EXPECT(mixed_sine[2] < -40.0, "the air holds little of the sine in a mixture");
}

// --- Sharpness -------------------------------------------------------------------------------

static void check_sharpness() {
  // Hiss above 3 kHz: under 1.5 kHz the split leans toward the tones
  // whatever Sharpness says (see check_lean), and white noise has a share there.
  rng_state() = 9;
  const std::vector<float> hiss = above(noise(3.0f, kRate, 0.2f), 3000.0f);
  const size_t from = static_cast<size_t>(0.5f * kRate), to = static_cast<size_t>(2.5f * kRate);
  double in_tones[5], in_air[5];
  for (int step = 0; step < 5; ++step) {
    only(0);
    device.set_param(p::kSharpness, 0.25f * step);
    in_tones[step] = kept_db(run(device, hiss).left, hiss, from, to);
    only(2);
    device.set_param(p::kSharpness, 0.25f * step);
    in_air[step] = kept_db(run(device, hiss).left, hiss, from, to);
  }
  std::printf(
      "  noise by Sharpness 0, 0.25, 0.5, 0.75, 1: in the tones %.1f %.1f %.1f %.1f %.1f dB, in the air %.1f "
      "%.1f %.1f %.1f %.1f dB\n",
      in_tones[0], in_tones[1], in_tones[2], in_tones[3], in_tones[4], in_air[0], in_air[1], in_air[2],
      in_air[3], in_air[4]);
  // Measured: tones -11.6 ... -16.0 ... -17.8; air -7.0 ... -2.2 ... -0.9.
  for (int step = 1; step < 5; ++step) {
    std::snprintf(label, sizeof label,
                  "Sharpness %.2f leaves less noise in the tones than %.2f (%.2f against %.2f dB)",
                  0.25f * step, 0.25f * (step - 1), in_tones[step], in_tones[step - 1]);
    EXPECT(in_tones[step] < in_tones[step - 1] - 0.2, label);
    std::snprintf(label, sizeof label,
                  "Sharpness %.2f gives the air more of the noise than %.2f (%.2f against %.2f dB)",
                  0.25f * step, 0.25f * (step - 1), in_air[step], in_air[step - 1]);
    EXPECT(in_air[step] > in_air[step - 1] + 0.2, label);
  }
  EXPECT(in_tones[0] - in_tones[4] > 5.0,
         "Sharpness moves the noise in the tones by 5 dB or more over its range");
  EXPECT(in_air[4] - in_air[0] > 5.0, "Sharpness moves the noise in the air by 5 dB or more over its range");
}

// --- the lean toward tones at the bottom of the spectrum ---------------------------------------

// A held note: `harmonics` steady partials at 1/h, faded in and out over half a second.
static std::vector<float> held_note(float hz, int harmonics, float seconds, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (int h = 1; h <= harmonics; ++h) {
    const double f = static_cast<double>(hz) * h;
    if (f > 0.45 * rate) break;
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += static_cast<float>(gain / h * std::sin(2.0 * kPi * f * static_cast<double>(i) / rate + 0.9 * h));
    }
  }
  const size_t fade = static_cast<size_t>(0.5f * rate);
  for (size_t i = 0; i < fade; ++i) {
    const float w = static_cast<float>(i) / static_cast<float>(fade);
    out[i] *= w;
    out[out.size() - 1 - i] *= w;
  }
  return out;
}

static void check_lean() {
  // Partials closer than about three bins (70 Hz at 48 kHz) fill a band as
  // noise does, and the split read a low note or a close chord as half air:
  // a held A1 with 30 harmonics measured tones -5.2 dB and air -5.9 dB of
  // itself, C2 E2 G2 tones -7.7 and air -3.7, and as it starts the device
  // made the A1 2 dB louder and spread it (the two sides agreed by 0.75).
  // The lean takes the across-frequency reading down under bin 64.
  const float seconds = 4.0f;
  const size_t from = static_cast<size_t>(kRate), to = static_cast<size_t>(3.0f * kRate);
  const std::vector<float> low = held_note(55.0f, 30, seconds, 0.3f);
  const std::vector<float> chord = add(
      add(held_note(65.41f, 24, seconds, 0.15f), held_note(82.41f, 24, seconds, 0.15f)),
      held_note(98.0f, 24, seconds, 0.15f));
  double kept[2][3];
  for (int which = 0; which < 2; ++which) {
    const std::vector<float>& in = which == 0 ? low : chord;
    for (int part = 0; part < 3; ++part) {
      only(part);
      kept[which][part] = kept_db(run(device, in).left, in, from, to);
    }
  }
  std::printf("  a held A1 reads tones %.1f, attacks %.1f, air %.1f dB; C2 E2 G2 tones %.1f, attacks %.1f, air %.1f dB\n",
              kept[0][0], kept[0][1], kept[0][2], kept[1][0], kept[1][1], kept[1][2]);
  // Measured: -0.5, -36.4, -15.9 | -1.4, -15.0, -15.1 (Edge is at 1 here and
  // counts the beats between the chord's close partials as starts; at Edge 0
  // the chord reads -0.9, -37.1, -13.7).
  EXPECT(kept[0][0] > -1.5, "a low held note is tone");
  EXPECT(kept[0][2] < -12.0, "a low held note is not air");
  EXPECT(kept[1][0] > -2.5, "a low held chord is tone");
  EXPECT(kept[1][2] < -10.0, "a low held chord is not air");
  // As it starts, a low note stays where it was and as loud as it was.
  fresh();
  const Stereo out = run(device, low);
  const double level = kept_db(out.left, low, from, to);
  const double agree = correlation(out.left, out.right, from + kLatency, to + kLatency);
  std::snprintf(label, sizeof label,
                "as it starts a held A1 keeps its level (%.2f dB) and its place (the sides agree by %.2f)", level,
                agree);
  SAY(std::fabs(level) < 1.0 && agree > 0.9);  // measured 0.32 dB and 0.96; before the lean 2.06 dB and 0.75
  // The lean leaves the air above it alone: hiss over a low note still goes to the air.
  rng_state() = 77;
  const std::vector<float> hiss = above(noise(seconds, kRate, 0.03f), 3000.0f);
  only(2);
  // What the air holds above 3 kHz, where the note has nothing (its top partial is at 1650 Hz).
  const double hiss_kept = kept_db(above(run(device, add(low, hiss)).left, 3000.0f), hiss, from, to);
  std::snprintf(label, sizeof label, "hiss over a low note still goes to the air (%.1f dB of the hiss)", hiss_kept);
  SAY(hiss_kept > -3.5 && hiss_kept < 1.0);
  // It is set in bins, so at 96 kHz, where a bin is twice as wide, it reaches
  // twice as high and a chord in the middle of the keyboard is still tone
  // (measured tones -0.4 and air -19.4 dB; without it -4.0 and -6.0).
  const float fast = 96000.0f;
  const std::vector<float> middle = add(
      add(held_note(220.0f, 8, seconds, 0.15f, fast), held_note(277.18f, 8, seconds, 0.15f, fast)),
      held_note(329.63f, 8, seconds, 0.15f, fast));
  const size_t a = static_cast<size_t>(fast), b = static_cast<size_t>(3.0f * fast);
  only(0, fast);
  const double middle_tones = kept_db(run(device, middle).left, middle, a, b);
  only(2, fast);
  const double middle_air = kept_db(run(device, middle).left, middle, a, b);
  std::snprintf(label, sizeof label, "at 96 kHz a chord in the middle of the keyboard reads tones %.1f dB, air %.1f dB",
                middle_tones, middle_air);
  SAY(middle_tones > -1.5 && middle_air < -12.0);
}

// --- Edge ------------------------------------------------------------------------------------

static void check_edge() {
  // A note that begins without any click: 440 Hz fading in over 10 ms.
  const std::vector<float> note = padded(then(silence(0.5f, kRate), burst(440.0f, 1.0f, 0.01f, 0.4f)), 0.5f);
  const size_t start = static_cast<size_t>(0.5f * kRate);
  const size_t first = start + static_cast<size_t>(0.03f * kRate);  // the note's first 30 ms
  const size_t body_from = start + static_cast<size_t>(0.3f * kRate),
               body_to = start + static_cast<size_t>(0.8f * kRate);
  double attack_first[3], tone_first[3], tone_body[3];
  for (int step = 0; step < 3; ++step) {
    only(1);
    device.set_param(p::kEdge, 0.5f * step);
    attack_first[step] = kept_db(run(device, note).left, note, start, first);
    only(0);
    device.set_param(p::kEdge, 0.5f * step);
    const Stereo out = run(device, note);
    tone_first[step] = kept_db(out.left, note, start, first);
    tone_body[step] = kept_db(out.left, note, body_from, body_to);
  }
  std::printf(
      "  a note's first 30 ms by Edge 0, 0.5, 1: in the attacks %.1f %.1f %.1f dB, in the tones %.1f %.1f "
      "%.1f dB; its body in the tones %.2f %.2f %.2f dB\n",
      attack_first[0], attack_first[1], attack_first[2], tone_first[0], tone_first[1], tone_first[2],
      tone_body[0], tone_body[1], tone_body[2]);
  EXPECT(attack_first[2] > attack_first[1] + 2.0 && attack_first[1] > attack_first[0] + 2.0,
         "Edge moves the start of a note into the attacks, more the further it is turned");
  EXPECT(attack_first[2] > -6.0, "at Edge 1 the attacks hold most of a note's first 30 ms");
  EXPECT(attack_first[0] < -12.0, "at Edge 0 the attacks hold little of a note that begins without a click");
  EXPECT(tone_first[2] < tone_first[0] - 3.0, "at Edge 1 the tones begin without the note's start");
  EXPECT(std::fabs(tone_body[2]) < 0.1 && std::fabs(tone_body[0]) < 0.1,
         "Edge leaves the body of a note in the tones");
}

// --- Hold ------------------------------------------------------------------------------------

static void check_hold() {
  // A sine cut off after a second, then silence: Hold lets it ring on at its
  // pitch, 60 dB down after hold_seconds(), and touches nothing but the tones.
  const size_t cut = static_cast<size_t>(1.0f * kRate);
  const std::vector<float> note = padded(burst(440.0f, 1.0f, 0.005f, 0.4f), 7.0f);
  for (float hold : {0.3f, 0.6f, 1.0f}) {
    only(0);
    device.set_param(p::kHold, hold);
    const Stereo out = run(device, note);
    const double from_seconds = static_cast<double>(cut + kLatency) / kRate + 0.2;
    const double measured = rt60(out.left, kRate, from_seconds);
    const double expected = Sift::hold_seconds(hold);
    const size_t from = static_cast<size_t>((from_seconds + 0.1) * kRate);
    const double pitch = dominant_frequency(out.left, kRate, 400.0, 480.0, from, from + 24000);
    std::printf("  Hold %.1f: 60 dB down in %.2f s (to be %.2f s), ringing at %.2f Hz\n", hold, measured,
                expected, pitch);
    std::snprintf(label, sizeof label, "Hold %.1f rings 60 dB down in %.2f s (measured %.2f s)", hold,
                  expected, measured);
    EXPECT(std::fabs(measured / expected - 1.0) < 0.1, label);
    std::snprintf(label, sizeof label, "a held tone stays at its pitch at Hold %.1f (%.2f Hz for 440)", hold,
                  pitch);
    EXPECT(std::fabs(pitch - 440.0) < 0.5, label);
  }
  // The ring falls evenly. A partial is three or four bins wide; while each
  // bin turned on by its own turn (the side bins' is the turn of the cut,
  // not of the tone) the ring of one pure tone beat against itself: its
  // level every 50 ms strayed from the even fall by 15 dB. With the bins of
  // a sound that has ended turning by their peak's turn it strays by under
  // 0.2 dB.
  for (int which = 0; which < 4; ++which) {
    const float rate = which == 3 ? 44100.0f : kRate;
    const float hz = which == 1 ? 311.13f : which == 2 ? 1000.0f : 440.0f;
    only(0, rate);
    device.set_param(p::kHold, 0.5f);
    const Stereo out = run(device, padded(burst(hz, 1.0f, which == 2 ? 0.03f : 0.005f, 0.4f, rate), 3.0f, rate));
    const size_t end = static_cast<size_t>(rate) + kLatency + static_cast<size_t>(0.15f * rate);
    const size_t window = static_cast<size_t>(0.05f * rate);
    const double per_second = 60.0 / Sift::hold_seconds(0.5f);
    double lowest = 1.0e9, highest = -1.0e9;
    for (int n = 0; n < 40; ++n) {
      const size_t at = end + static_cast<size_t>(n) * window;
      const double over = db(rms(out.left, at, at + window)) + per_second * 0.05 * n;
      lowest = std::min(lowest, over);
      highest = std::max(highest, over);
    }
    std::snprintf(label, sizeof label,
                  "the ring of a %.0f Hz tone falls evenly at %.0f Hz (it strays %.2f dB from the fall Hold sets)",
                  hz, rate, highest - lowest);
    SAY(highest - lowest < 1.0);
  }
  // Without Hold nothing is left once the last frame has played out.
  only(0);
  Stereo bare = run(device, note);
  const size_t gone = cut + kLatency + static_cast<size_t>(Sift::Stft::kFrame) + 512;
  std::snprintf(label, sizeof label, "without Hold a tone ends with the playing (peak after it %.2g)",
                peak(bare.left, gone));
  EXPECT(peak(bare.left, gone) == 0.0, label);
  // While the note is played Hold changes nothing: the tones are driven.
  only(0);
  device.set_param(p::kHold, 1.0f);
  const Stereo rung = run(device, note);
  double worst = 0.0;
  for (size_t i = kLatency + 4800; i < cut + kLatency - 4800; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(rung.left[i]) - bare.left[i]));
  }
  // What the note's start left in the bins beside it rings on under it.
  std::snprintf(label, sizeof label,
                "Hold at the top changes a tone that is being played by under 1.5 %% of it (worst difference "
                "%.4f of 0.4)",
                worst);
  SAY(worst < 0.006);
  // The attacks and the air of a mixture are the same bit for bit with Hold up or down.
  rng_state() = 5;
  const std::vector<float> all =
      add(add(sine(440.0f, 2.0f, kRate, 0.25f), clicks(2.0f, 0.5f, 0.8f)), noise(2.0f, kRate, 0.05f));
  for (int part = 1; part < 3; ++part) {
    only(part);
    const Stereo down = run(device, all);
    only(part);
    device.set_param(p::kHold, 1.0f);
    const Stereo up = run(device, all);
    EXPECT(down.left == up.left && down.right == up.right,
           part == 1 ? "Hold does not touch the attacks" : "Hold does not touch the air");
  }
}

// Hold on a chord that is still being held. Close partials beat inside a bin,
// and a bin in the trough of a beat is let go of while the sound goes on:
// what it holds must meet the input again at the next crest. (Turning such a
// bin by its peak's turn, as the bins of a sound that has ended are, took a
// like chord of the checker's down by 0.6 dB with dips of 2.7 dB, and by
// 0.8 dB at half Mix; with each bin on its own turn there it stays within
// 0.1 dB.) Measured here, level and its range over 200 ms: at the default
// -0.23 (-0.98 to 0.50), at half Mix -0.62 (-1.43 to 0.01); with Hold at the
// top -0.45 (-1.14 to 0.20), at half Mix -1.44 (-2.61 to -0.42). Without
// Hold the split alone gives -0.50 (-1.38 to 0.14).
static void check_hold_held() {
  const float seconds = 5.0f;
  const std::vector<float> chord = add(
      add(held_note(65.41f, 24, seconds, 0.15f), held_note(82.41f, 24, seconds, 0.15f)),
      held_note(98.0f, 24, seconds, 0.15f));
  const size_t from = static_cast<size_t>(kRate), to = static_cast<size_t>(4.0f * kRate);
  const size_t window = static_cast<size_t>(0.2f * kRate);
  const double level_floor[4] = {-0.7, -1.0, -0.9, -1.9}, dip_floor[4] = {-1.5, -1.9, -1.7, -3.1};
  for (int which = 0; which < 4; ++which) {
    const float hold = which < 2 ? p::kParamDefault[p::kHold] : 1.0f;
    const float mix = which % 2 == 0 ? 1.0f : 0.5f;
    fresh();
    device.set_param(p::kHold, hold);
    device.set_param(p::kMix, mix);
    const Stereo out = run(device, chord);
    const double level = kept_db(out.left, chord, from, to);
    double lowest = 1.0e9, highest = -1.0e9;
    for (size_t at = from; at + window <= to; at += window / 2) {
      const double over = db(rms(out.left, at + kLatency, at + kLatency + window) / rms(chord, at, at + window));
      lowest = std::min(lowest, over);
      highest = std::max(highest, over);
    }
    std::snprintf(label, sizeof label,
                  "a held low chord at Hold %.1f and Mix %.1f keeps its level (%.2f dB; over 200 ms %.2f to %.2f dB)",
                  hold, mix, level, lowest, highest);
    SAY(level > level_floor[which] && level < 0.7 && lowest > dip_floor[which] && highest < 1.2);
  }
}

// --- Soften ----------------------------------------------------------------------------------

// The time in seconds that holds the middle 90 % of a signal's energy.
static double spread_seconds(const std::vector<float>& x) {
  const double total = energy(x);
  if (!(total > 0.0)) return 0.0;
  double sum = 0.0;
  size_t first = 0, last = x.size();
  bool begun = false;
  for (size_t i = 0; i < x.size(); ++i) {
    sum += static_cast<double>(x[i]) * x[i];
    if (!begun && sum >= 0.05 * total) {
      first = i;
      begun = true;
    }
    if (sum >= 0.95 * total) {
      last = i;
      break;
    }
  }
  return static_cast<double>(last - first) / kRate;
}

static void check_soften() {
  // One click through the attacks alone.
  std::vector<float> click(static_cast<size_t>(2.0f * kRate), 0.0f);
  click[12000] = 0.8f;
  double level[4], length[4], top[4];
  // The knob is the smoothing time itself (it was its square root, and its
  // lowest fifth did nothing): these are the settings the figures below were
  // measured at, 0.4 and 0.7 on the old law.
  const float settings[4] = {0.0f, 0.16f, 0.49f, 1.0f};
  for (int step = 0; step < 4; ++step) {
    only(1);
    device.set_param(p::kSoften, settings[step]);
    const Stereo out = run(device, click);
    level[step] = db(std::sqrt(energy(out.left) / energy(click)));
    length[step] = spread_seconds(out.left);
    top[step] = db(peak(out.left) / 0.8);
    EXPECT(out.left == out.right, "a mono attack stays mono when softened");
  }
  std::printf(
      "  a click by Soften 0, 0.4, 0.7, 1: energy %.1f %.1f %.1f %.1f dB, 90 %% of it within %.1f %.1f %.1f "
      "%.1f ms, peak %.1f %.1f %.1f %.1f dB\n",
      level[0], level[1], level[2], level[3], 1000.0 * length[0], 1000.0 * length[1], 1000.0 * length[2],
      1000.0 * length[3], top[0], top[1], top[2], top[3]);
  EXPECT(std::fabs(level[0]) < 0.1 && length[0] < 0.001, "without Soften a click comes through as it is");
  for (int step = 1; step < 4; ++step) {
    std::snprintf(label, sizeof label, "Soften %.2f keeps a click's energy (%.1f dB)", settings[step],
                  level[step]);
    EXPECT(std::fabs(level[step]) < 2.0, label);
    std::snprintf(label, sizeof label,
                  "Soften %.2f spreads a click further in time than %.2f (%.1f ms against %.1f ms)",
                  settings[step], settings[step - 1], 1000.0 * length[step], 1000.0 * length[step - 1]);
    EXPECT(length[step] > length[step - 1] * 1.3 + 0.005, label);
    EXPECT(top[step] < top[step - 1] - 1.0,
           "Soften takes a click's peak down, more the further it is turned");
  }
  EXPECT(length[3] > 0.15, "Soften at the top spreads a click over 150 ms or more");
  // No dead stretch at the bottom of the knob: the first tenth already takes
  // a click's peak down. Measured -2.6 dB and 41 ms (-0.1 dB and 0 ms while
  // the time was the square of the knob).
  only(1);
  device.set_param(p::kSoften, 0.1f);
  const Stereo little = run(device, click);
  std::snprintf(label, sizeof label,
                "Soften 0.1 already softens a click (peak %.1f dB, 90 %% of it within %.0f ms)",
                db(peak(little.left) / 0.8), 1000.0 * spread_seconds(little.left));
  SAY(db(peak(little.left) / 0.8) < -1.5 && spread_seconds(little.left) > 0.02);
  // The tones and the air of a mixture are the same bit for bit with Soften up or down.
  rng_state() = 5;
  const std::vector<float> all =
      add(add(sine(440.0f, 2.0f, kRate, 0.25f), clicks(2.0f, 0.5f, 0.8f)), noise(2.0f, kRate, 0.05f));
  for (int part = 0; part < 3; part += 2) {
    only(part);
    const Stereo down = run(device, all);
    only(part);
    device.set_param(p::kSoften, 1.0f);
    const Stereo up = run(device, all);
    EXPECT(down.left == up.left && down.right == up.right,
           part == 0 ? "Soften does not touch the tones" : "Soften does not touch the air");
  }
}

// --- Late ------------------------------------------------------------------------------------

static size_t peak_at(const std::vector<float>& x) {
  size_t at = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[at])) at = i;
  }
  return at;
}

static void check_late() {
  for (float rate : {48000.0f, 96000.0f}) {
    std::vector<float> click(static_cast<size_t>(1.0f * rate), 0.0f);
    click[9000] = 0.8f;
    for (float late : {0.0f, 45.0f, 300.0f}) {
      only(1, rate);
      device.set_param(p::kLate, late);
      const Stereo out = run(device, click);
      const size_t expected = 9000 + kLatency + static_cast<size_t>(late * 0.001f * rate + 0.5f);
      std::snprintf(label, sizeof label,
                    "Late %.0f ms at %.0f Hz puts a click at sample %d (found at %d, peak %.3f)", late, rate,
                    static_cast<int>(expected), static_cast<int>(peak_at(out.left)), peak(out.left));
      EXPECT(peak_at(out.left) == expected && peak_at(out.right) == expected && peak(out.left) > 0.79, label);
    }
  }
  // The tones and the air do not move.
  rng_state() = 5;
  const std::vector<float> all =
      add(add(sine(440.0f, 2.0f, kRate, 0.25f), clicks(2.0f, 0.5f, 0.8f)), noise(2.0f, kRate, 0.05f));
  for (int part = 0; part < 3; part += 2) {
    only(part);
    const Stereo down = run(device, all);
    only(part);
    device.set_param(p::kLate, 300.0f);
    const Stereo up = run(device, all);
    EXPECT(down.left == up.left && down.right == up.right,
           part == 0 ? "Late does not move the tones" : "Late does not move the air");
  }
}

// --- Scatter ---------------------------------------------------------------------------------

static void check_scatter() {
  rng_state() = 11;
  const std::vector<float> hiss = noise(4.0f, kRate, 0.2f);
  const size_t from = static_cast<size_t>(0.5f * kRate), to = static_cast<size_t>(3.5f * kRate);
  double agree[5], level[5];
  for (int step = 0; step < 5; ++step) {
    only(2);
    device.set_param(p::kScatter, 0.25f * step);
    const Stereo out = run(device, hiss);
    agree[step] = correlation(out.left, out.right, from, to);
    level[step] = db(
        std::sqrt(0.5 * (energy(out.left, from, to) + energy(out.right, from, to)) / energy(hiss, from, to)));
  }
  std::printf(
      "  the air's two sides by Scatter 0, 0.25, 0.5, 0.75, 1: agree by %.3f %.3f %.3f %.3f %.3f, level %.2f "
      "%.2f %.2f %.2f %.2f dB\n",
      agree[0], agree[1], agree[2], agree[3], agree[4], level[0], level[1], level[2], level[3], level[4]);
  EXPECT(agree[0] > 0.98, "without Scatter the air of a mono sound stays in the middle");
  for (int step = 1; step < 5; ++step) {
    std::snprintf(label, sizeof label,
                  "Scatter %.2f makes the two sides agree less than %.2f (%.3f against %.3f)", 0.25f * step,
                  0.25f * (step - 1), agree[step], agree[step - 1]);
    EXPECT(agree[step] < agree[step - 1] - 0.05, label);
    std::snprintf(label, sizeof label, "Scatter %.2f keeps the air's level (%.2f dB against %.2f dB without)",
                  0.25f * step, level[step], level[0]);
    EXPECT(std::fabs(level[step] - level[0]) < 1.0, label);
  }
  EXPECT(std::fabs(agree[4]) < 0.15, "Scatter at the top leaves the air's two sides unrelated");
  // The tones and the attacks stay where they were.
  rng_state() = 5;
  const std::vector<float> all =
      add(add(sine(440.0f, 2.0f, kRate, 0.25f), clicks(2.0f, 0.5f, 0.8f)), noise(2.0f, kRate, 0.05f));
  for (int part = 0; part < 2; ++part) {
    only(part);
    const Stereo down = run(device, all);
    only(part);
    device.set_param(p::kScatter, 1.0f);
    const Stereo up = run(device, all);
    EXPECT(down.left == up.left && down.right == up.right,
           part == 0 ? "Scatter does not touch the tones" : "Scatter does not touch the attacks");
    const double middle = correlation(up.left, up.right, 24000, 72000);
    std::snprintf(label, sizeof label,
                  "part %d of a mono sound stays in the middle (the sides agree by %.4f)", part, middle);
    EXPECT(middle > 0.99, label);
  }
}

// --- bad input -------------------------------------------------------------------------------

static void check_bad_input() {
  const std::vector<float> good = phrase();
  for (float mix : {1.0f, 0.5f}) {
    fresh();
    device.set_param(p::kMix, mix);
    device.set_param(p::kHold, 0.6f);
    std::vector<float> bad = noise(0.5f, kRate, 0.3f);
    for (size_t i = 6000; i < 12000; ++i) {
      bad[i] = (i % 3 == 0) ? std::nanf("") : (i % 3 == 1) ? INFINITY : 1.0e30f;
    }
    bad[15000] = -INFINITY;
    bad[15001] = -1.0e30f;
    const Stereo during = run(device, bad);
    // Good input returns: by the time the tail of the garbage has rung out
    // the device is where a fresh one is on the same input.
    render(device, 12.0f, kRate);
    const Stereo after = run(device, good);
    fresh();
    device.set_param(p::kMix, mix);
    device.set_param(p::kHold, 0.6f);
    render(device, 12.5f, kRate);  // so that the frames fall on the same samples
    const Stereo clean = run(device, good);
    const double off =
        std::max(difference_db(clean.left, after.left), difference_db(clean.right, after.right));
    std::snprintf(label, sizeof label,
                  "NaN, infinity and 1e30 in: finite out (peak %.2f), and the same as a fresh device "
                  "afterwards (%.0f dB apart) at Mix %.1f",
                  std::max(peak(during.left), peak(during.right)), off, mix);
    SAY(finite(during.left) && finite(during.right) && peak(during.left) < 2.01 && finite(after.left) &&
        finite(after.right) && off < -100.0);
  }
}

// A burst far over full scale (a device before this one gone wrong: the
// Stft takes samples up to 64) must not ring on at the limiter: what Hold
// keeps has a ceiling, and the ring of such a burst is no louder than the
// ring of the loudest sound there can be.
static void check_overload() {
  double ring[2];
  for (int which = 0; which < 2; ++which) {
    const float gain = which == 0 ? 1.0f : 60.0f;
    std::vector<float> burst(static_cast<size_t>(4.0f * kRate), 0.0f);
    for (size_t i = 0; i < static_cast<size_t>(0.5f * kRate); ++i) burst[i] = (i % 200 < 100) ? gain : -gain;
    fresh();
    device.set_param(p::kHold, 0.85f);
    const Stereo out = run(device, burst);
    const size_t from = static_cast<size_t>(1.5f * kRate) + kLatency;
    ring[which] = rms(out.left, from, from + static_cast<size_t>(kRate));
    EXPECT(finite(out.left) && peak(out.left) <= 2.0, "a burst far over full scale stays inside the limiter");
  }
  std::snprintf(label, sizeof label,
                "a second after a burst of 60 times full scale the ring is %.1f dB over a full-scale burst's (%.3f, %.3f)",
                db(ring[1] / ring[0]), ring[1], ring[0]);
  SAY(db(ring[1] / ring[0]) < 6.0);
}

// --- block sizes, across a sleep ---------------------------------------------------------------

// The phrase, a silence long enough to fall asleep in, knobs moved while
// asleep, and the phrase again: the same audio at every block size.
static Stereo across_sleep(int block, float hold) {
  fresh();
  device.set_param(p::kHold, hold);
  device.set_param(p::kLate, 30.0f);
  const std::vector<float> notes = phrase();
  Stereo out = run(device, notes, block);
  out = concat(out, run(device, silence(hold > 0.0f ? 5.0f : 1.5f, kRate), block));
  const double resting = std::max(peak(out.left, out.size() - 4800), peak(out.right, out.size() - 4800));
  std::snprintf(label, sizeof label, "block %d, Hold %.1f: exact silence before the knobs move (peak %.2g)",
                block, hold, resting);
  EXPECT(resting == 0.0, label);
  EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(2) == 0.0f,
         "asleep, the meters read nothing");
  device.set_param(p::kMix, 0.6f);
  device.set_param(p::kLate, 140.0f);
  device.set_param(p::kAttacks, 3.0f);
  out = concat(out, run(device, notes, block));
  return concat(out, run(device, silence(0.5f, kRate), block));
}

static void check_blocks() {
  for (float hold : {0.0f, 0.2f}) {
    const Stereo reference = across_sleep(128, hold);
    for (int block : {1, 37, 2048}) {
      const Stereo other = across_sleep(block, hold);
      double worst = 0.0;
      for (size_t i = 0; i < reference.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - reference.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - reference.right[i]));
      }
      std::snprintf(
          label, sizeof label,
          "blocks of %d give what blocks of 128 give across a sleep, Hold %.1f (worst difference %.2g)",
          block, hold, worst);
      SAY(worst < 1.0e-5);
    }
    // Knobs moved while asleep snap: the second phrase is what a device that
    // was set so from the start gives (the frames fall on the same samples).
    fresh();
    device.set_param(p::kHold, hold);
    device.set_param(p::kMix, 0.6f);
    device.set_param(p::kLate, 140.0f);
    device.set_param(p::kAttacks, 3.0f);
    const std::vector<float> notes = phrase();
    const size_t gap = notes.size() + static_cast<size_t>((hold > 0.0f ? 5.0f : 1.5f) * kRate);
    run(device, silence(static_cast<float>(gap) / kRate, kRate));
    const Stereo set_before = run(device, notes);
    double worst = 0.0;
    for (size_t i = 0; i < set_before.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(set_before.left[i]) - reference.left[gap + i]));
    }
    std::snprintf(label, sizeof label,
                  "knobs moved while asleep snap, they do not glide, Hold %.1f (worst difference %.2g)", hold,
                  worst);
    SAY(worst < 1.0e-5);
  }
}

// --- the default -----------------------------------------------------------------------------

static void check_default() {
  // On a struck note the default is plain at once: the hammer is 12 dB down
  // and softened, and the note rings on a little after it is let go.
  rng_state() = 7;
  std::vector<float> note = struck(220.0f, 1.0f, 1.2f, 16, 0.3f, 0.3f);
  for (size_t i = note.size() - 480; i < note.size(); ++i)
    note[i] *= static_cast<float>(note.size() - i) / 480.0f;
  note = padded(note, 4.0f);
  fresh();
  const Stereo out = run(device, note);
  const double hammer = kept_db(out.left, note, 0, 960);
  const double body = kept_db(out.left, note, 9600, 43200);
  const double ring =
      db(rms(out.left, 48000 + kLatency + 4800, 48000 + kLatency + 14400) / rms(note, 38400, 48000));
  std::vector<float> late(note.begin(), note.end());
  std::rotate(late.rbegin(), late.rbegin() + kLatency, late.rend());
  const double changed = difference_db(late, out.left);
  std::printf(
      "  the default on a struck note: its first 20 ms %.1f dB, its body %.2f dB, 100 to 300 ms after it is "
      "let go %.1f dB of its last 200 ms; the output differs from the input by %.1f dB of it\n",
      hammer, body, ring, changed);
  EXPECT(hammer < -5.0, "the default takes the strike of a note down by 5 dB or more");
  EXPECT(std::fabs(body) < 1.0, "the default leaves the body of a note at its level");
  // Measured -7.1 dB (-15.7 at the Hold of 0.2 it first started with, and beating then).
  EXPECT(ring > -12.0, "the default lets a note ring on after it is let go");
  EXPECT(changed > -15.0, "the default is plain on a struck note");
  // On a held chord it neither drops nor lifts the sound.
  const std::vector<float> chord = add(add(sine(220.0f, 3.0f, kRate, 0.2f), sine(277.18f, 3.0f, kRate, 0.2f)),
                                       sine(329.63f, 3.0f, kRate, 0.2f));
  fresh();
  const Stereo held = run(device, chord);
  const double level = kept_db(held.left, chord, 48000, 120000);
  std::snprintf(label, sizeof label, "the default holds the level of a held chord (%.2f dB)", level);
  SAY(std::fabs(level) < 0.5);
  // On a pad the default shows where the chords change: the one let go rings
  // on under the next. Two chords of detuned partials, each swelling in and out.
  std::vector<float> pads(static_cast<size_t>(8.0f * kRate), 0.0f);
  const float chords[2][4] = {{130.81f, 196.0f, 261.63f, 329.63f}, {146.83f, 220.0f, 293.66f, 369.99f}};
  for (int c = 0; c < 2; ++c) {
    const size_t at = static_cast<size_t>((0.2f + 3.0f * c) * kRate);
    for (float hz : chords[c]) {
      const std::vector<float> a = burst(hz, 3.2f, 0.4f, 0.06f), b = burst(hz * 1.0035f, 3.2f, 0.4f, 0.06f);
      for (size_t i = 0; i < a.size(); ++i) pads[at + i] += a[i] + b[i];
    }
  }
  fresh();
  const Stereo padded_out = run(device, pads);
  std::vector<float> pads_late(pads.begin(), pads.end());
  std::rotate(pads_late.rbegin(), pads_late.rbegin() + kLatency, pads_late.rend());
  const double pad_changed = difference_db(pads_late, padded_out.left);
  const double pad_level = kept_db(padded_out.left, pads, 9600, 300000);
  std::snprintf(label, sizeof label,
                "the default on two pad chords differs from the input by %.1f dB of it and stands %.2f dB over it",
                pad_changed, pad_level);
  SAY(pad_changed > -17.0 && std::fabs(pad_level) < 1.5);  // measured -16.5 and 0.13
}

// --- every control does something over its whole range ----------------------------------------

// Where a control is heard: the device as it starts, or the part it acts on alone.
static void context(int id) {
  fresh();
  switch (id) {
    case p::kAttacks:
      levels(kOff, 0.0f, kOff);
      break;
    case p::kAir:
    case p::kScatter:
    case p::kSharpness:
      levels(kOff, kOff, 0.0f);
      break;
    case p::kEdge:
    case p::kSoften:
    case p::kLate:
      device.set_param(p::kAttacks, 0.0f);
      break;
    default:
      break;
  }
}

static void check_controls() {
  // Ordinary material: the phrase, different on the two sides.
  const std::vector<float> left = padded(phrase(), 1.0f);
  rng_state() = 0x99u;
  const std::vector<float> right = add(left, noise(3.0f, kRate, 0.01f));
  std::printf(
      "  what a third of each control's range does to the phrase, in dB of the output (low, middle, high "
      "third; as it starts | where its part is heard):\n");
  for (int id = 0; id < p::kNumParams; ++id) {
    double moved[2][3];
    for (int where = 0; where < 2; ++where) {
      Stereo at[4];
      for (int step = 0; step < 4; ++step) {
        if (where == 0) {
          fresh();
        } else {
          context(id);
        }
        device.set_param(
            id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * static_cast<float>(step) / 3.0f);
        at[step] = run(device, left, right);
      }
      for (int step = 0; step < 3; ++step) {
        moved[where][step] = std::max(difference_db(at[step + 1].left, at[step].left),
                                      difference_db(at[step + 1].right, at[step].right));
      }
    }
    std::printf("    %-10s %6.1f %6.1f %6.1f | %6.1f %6.1f %6.1f\n", name_of(id), moved[0][0], moved[0][1],
                moved[0][2], moved[1][0], moved[1][1], moved[1][2]);
    for (int step = 0; step < 3; ++step) {
      std::snprintf(label, sizeof label,
                    "control %s does something in third %d of its range (%.1f dB of the output)", name_of(id),
                    step + 1, moved[1][step]);
      EXPECT(moved[1][step] > -24.0, label);
    }
  }
}

// --- no clicks -------------------------------------------------------------------------------

static double worst_step(const Stereo& out) { return std::max(max_step(out.left), max_step(out.right)); }

// Runs `input` in pieces of a tenth of a second, calling move(piece) before each.
template <typename Move>
static Stereo run_moving(const std::vector<float>& input, Move move) {
  Stereo out;
  const size_t piece = 4800;
  for (size_t at = 0, n = 0; at < input.size(); at += piece, ++n) {
    move(static_cast<int>(n));
    const std::vector<float> part(input.begin() + at, input.begin() + std::min(at + piece, input.size()));
    out = concat(out, run(device, part));
  }
  return out;
}

static void check_clicks() {
  // A level thrown about while a low tone is held: the tones go from unity
  // to nothing, to the top, and back. Against the same tone left alone.
  const std::vector<float> low = sine(110.0f, 3.0f, kRate, 0.5f);
  fresh();
  const Stereo still = run(device, low);
  fresh();
  const Stereo thrown = run_moving(low, [](int n) {
    if (n == 8) device.set_param(p::kTones, kOff);
    if (n == 13) device.set_param(p::kTones, 6.0f);
    if (n == 18) device.set_param(p::kTones, 0.0f);
    if (n == 23) device.set_param(p::kHold, 1.0f);
  });
  std::snprintf(
      label, sizeof label,
      "throwing the Tones level about makes no click (largest step %.4f, %.4f with the tone left alone)",
      worst_step(thrown), worst_step(still));
  // At +6 dB the tone is twice as large and so are its steps.
  SAY(worst_step(thrown) < 2.3 * worst_step(still));

  // Mix thrown about, with the wet a different level from the dry.
  fresh();
  device.set_param(p::kTones, -12.0f);
  const Stereo mixed = run_moving(low, [](int n) {
    if (n == 8) device.set_param(p::kMix, 0.0f);
    if (n == 13) device.set_param(p::kMix, 1.0f);
    if (n == 18) device.set_param(p::kMix, 0.4f);
  });
  std::snprintf(label, sizeof label,
                "throwing Mix about makes no click (largest step %.4f, %.4f for the dry tone)",
                worst_step(mixed), worst_step(still));
  SAY(worst_step(mixed) < 1.2 * worst_step(still));

  // Late moved while an attack is sounding: the attacks alone, on notes that
  // begin without a click, so that what sounds is the smooth start of each.
  std::vector<float> notes;
  for (int n = 0; n < 6; ++n) notes = then(notes, padded(burst(110.0f, 0.3f, 0.01f, 0.5f), 0.2f));
  only(1);
  const Stereo in_place = run(device, notes);
  only(1);
  // The first note's attack sounds from kLatency on: 0.09 s. Move at 0.1 s, in the middle
  // of it, and again in later ones.
  const Stereo moved = run_moving(notes, [](int n) {
    if (n == 1) device.set_param(p::kLate, 150.0f);
    if (n == 6) device.set_param(p::kLate, 0.0f);
    if (n == 11) device.set_param(p::kLate, 300.0f);
    if (n == 16) device.set_param(p::kLate, 20.0f);
  });
  std::snprintf(label, sizeof label,
                "moving Late while an attack sounds makes no click (largest step %.4f, %.4f with Late left "
                "alone; peak %.2f)",
                worst_step(moved), worst_step(in_place), peak(in_place.left));
  SAY(peak(in_place.left) > 0.1 && worst_step(moved) < 1.2 * worst_step(in_place));
}

// --- the device comes to rest ------------------------------------------------------------------

// Seconds of silence after `input` until the output is exactly zero for good, up to `limit`.
static double seconds_to_rest(float limit) {
  const Stereo tail = render(device, limit + 0.5f, kRate);
  size_t last = 0;
  for (size_t i = 0; i < tail.size(); ++i) {
    if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i + 1;
  }
  return static_cast<double>(last) / kRate;
}

static void check_rest() {
  // Every control moved while the phrase plays, then silence.
  const std::vector<float> notes = phrase();
  fresh();
  run_moving(notes, [](int n) {
    const int id = n % p::kNumParams;
    const float t = (n % 3) * 0.5f;
    device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * t);
  });
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamDefault[id]);
  double rest = seconds_to_rest(8.0f);
  std::snprintf(label, sizeof label,
                "at rest %.2f s after the playing stops, every control having been moved (as it starts)",
                rest);
  SAY(rest < 6.0 && device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(2) == 0.0f);
  // The longest it can ring: Hold, Soften and Late at the top.
  fresh();
  device.set_param(p::kHold, 1.0f);
  device.set_param(p::kSoften, 1.0f);
  device.set_param(p::kLate, 300.0f);
  run(device, notes);
  rest = seconds_to_rest(45.0f);
  std::snprintf(label, sizeof label,
                "at rest %.1f s after the playing stops with Hold, Soften and Late at the top", rest);
  SAY(rest < 40.0 && device.meter(0) == 0.0f);
  // A glide in flight when the sound stops does not keep it awake: Mix and Late moved at the last moment.
  fresh();
  device.set_param(p::kHold, 0.0f);
  run(device, notes);
  device.set_param(p::kMix, 0.37f);
  device.set_param(p::kLate, 211.0f);
  rest = seconds_to_rest(3.0f);
  std::snprintf(label, sizeof label,
                "at rest %.2f s after the playing stops with Mix and Late moved at the last moment", rest);
  SAY(rest < 1.0);
}

// --- the meters ------------------------------------------------------------------------------

static void check_meters() {
  // A sine of amplitude 0.25 is all tone: 0.177 on the tones' meter.
  only(0);
  levels(0.0f, 0.0f, 0.0f);
  run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
  std::snprintf(label, sizeof label, "a sine of 0.25 reads tones %.4f, attacks %.5f, air %.5f",
                device.meter(0), device.meter(1), device.meter(2));
  SAY(std::fabs(device.meter(0) / 0.17678 - 1.0) < 0.02 && device.meter(1) < 0.001f &&
      device.meter(2) < 0.001f);
  const float reading = device.meter(0);
  // The readings are taken before the levels and before Mix.
  only(0);
  levels(kOff, 6.0f, kOff);
  device.set_param(p::kMix, 0.0f);
  run(device, sine(1000.0f, 1.0f, kRate, 0.25f));
  EXPECT(device.meter(0) == reading, "the meters read the parts before their levels and before Mix");
  EXPECT(device.meter(-1) == 0.0f && device.meter(3) == 0.0f, "a meter that is not there reads nothing");
  // Steady noise is mostly air.
  only(0);
  rng_state() = 3;
  run(device, noise(1.0f, kRate, 0.2f));
  std::snprintf(label, sizeof label, "noise of RMS 0.115 reads tones %.4f, attacks %.4f, air %.4f",
                device.meter(0), device.meter(1), device.meter(2));
  SAY(device.meter(2) > 0.07f && device.meter(2) < 0.14f && device.meter(2) > 2.0f * device.meter(0) &&
      device.meter(2) > 2.0f * device.meter(1));
  // A click flashes on the attacks' meter and on no other; reading changes nothing.
  std::vector<float> click(24000, 0.0f);
  click[6000] = 0.8f;
  only(1);
  const Stereo unread = run(device, click);
  only(1);
  float highest[3] = {0.0f, 0.0f, 0.0f};
  int blocks_lit = 0;
  const Stereo read = run_moving(click, [&](int) {});
  only(1);
  Stereo metered;
  for (size_t at = 0; at < click.size(); at += 128) {
    const std::vector<float> part(click.begin() + at, click.begin() + std::min(at + 128, click.size()));
    metered = concat(metered, run(device, part));
    for (int m = 0; m < 3; ++m) highest[m] = std::max(highest[m], device.meter(m));
    if (device.meter(1) > 0.01f) ++blocks_lit;
  }
  std::snprintf(label, sizeof label,
                "a click of 0.8 flashes %.4f on the attacks' meter for %d blocks (tones %.5f, air %.5f)",
                highest[1], blocks_lit, highest[0], highest[2]);
  SAY(highest[1] > 0.02f && highest[0] < 0.001f && highest[2] < 0.001f && blocks_lit >= 12);
  EXPECT(metered.left == unread.left && read.left == unread.left,
         "reading the meters changes nothing that sounds");
  // Hold shows on the tones' meter: the reading stays up after the playing stops.
  only(0);
  device.set_param(p::kHold, 0.6f);
  run(device, padded(sine(440.0f, 1.0f, kRate, 0.25f), 1.0f));
  std::snprintf(label, sizeof label, "a held tone still reads %.4f a second after it is let go at Hold 0.6",
                device.meter(0));
  SAY(device.meter(0) > 0.03f && device.meter(0) < 0.17f);
}

// --- the two sides ---------------------------------------------------------------------------

static void check_sides() {
  // A click train on the left only and a sine on the right only: each side
  // is split on its own, so neither part crosses over.
  const std::vector<float> left = clicks(2.0f, 0.25f, 0.8f);
  const std::vector<float> right = sine(440.0f, 2.0f, kRate, 0.25f);
  only(1);
  Stereo out = run(device, left, right);
  std::snprintf(label, sizeof label, "the attacks of the left stay on the left (right %.1f dB of the left)",
                db(rms(out.right, 24000) / rms(out.left, 24000)));
  SAY(rms(out.left, 24000) > 0.001 && rms(out.right, 24000) < 1.0e-4 * rms(out.left, 24000));
  only(0);
  out = run(device, left, right);
  std::snprintf(label, sizeof label, "the tones of the right stay on the right (left %.1f dB of the right)",
                db(rms(out.left, 24000) / rms(out.right, 24000)));
  SAY(rms(out.right, 24000) > 0.1 && rms(out.left, 24000) < 1.0e-4 * rms(out.right, 24000));
  // A mono sound stays mono, bit for bit, while Scatter is down: the two sides do the same
  // work on the same frames.
  fresh();
  device.set_param(p::kScatter, 0.0f);
  device.set_param(p::kLate, 60.0f);
  const Stereo mono = run(device, padded(phrase(), 1.0f));
  EXPECT(mono.left == mono.right && rms(mono.left) > 0.01,
         "a mono sound stays mono, bit for bit, while Scatter is down");
  // The wet never sums the two sides: a sound in opposite phase on the two is still all there.
  const std::vector<float> notes = phrase();
  std::vector<float> turned = notes;
  for (float& v : turned) v = -v;
  fresh();
  const Stereo same = run(device, notes, notes);
  fresh();
  const Stereo opposite = run(device, notes, turned);
  const double level = db(rms(opposite.right) / rms(same.right));
  std::snprintf(label, sizeof label, "a sound in opposite phase on the two sides keeps its level (%.2f dB)",
                level);
  SAY(std::fabs(level) < 0.2);
}

// --- level -----------------------------------------------------------------------------------

// The presets as device.json has them (copied: tmp/keep/presets.py writes
// these rows from the manifest), every control in the order of kColumns.
struct Preset {
  const char* name;
  float values[p::kNumParams];
};
// Which control each column of a row is, by name: a row does not follow the order of "params".
static const int kColumns[p::kNumParams] = {p::kTones, p::kAttacks, p::kAir,  p::kSharpness, p::kEdge,
                                            p::kHold,  p::kSoften,  p::kLate, p::kScatter,   p::kMix};
static const Preset kPresets[] = {
    // PRESETS BEGIN
    {"Soft hammers", {0.0f, -12.0f, 3.0f, 0.5f, 1.0f, 0.3f, 0.16f, 0.0f, 0.6f, 1.0f}},
    {"Tones only", {0.0f, -30.0f, -30.0f, 0.7f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f}},
    {"Only the strikes", {-30.0f, 6.0f, -30.0f, 0.5f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f}},
    {"Soft puffs", {-30.0f, 6.0f, -30.0f, 0.5f, 1.0f, 0.0f, 1.0f, 0.0f, 0.6f, 1.0f}},
    {"Strikes forward", {-4.0f, 6.0f, -12.0f, 0.5f, 1.0f, 0.0f, 0.0f, 0.0f, 0.3f, 1.0f}},
    {"Strike just after", {-2.0f, 4.0f, 3.0f, 0.5f, 1.0f, 0.0f, 0.0f, 45.0f, 0.8f, 1.0f}},
    {"Late echoes", {-3.0f, 6.0f, 3.0f, 0.5f, 1.0f, 0.35f, 0.25f, 280.0f, 0.6f, 1.0f}},
    {"Pedal down", {0.0f, 0.0f, 0.0f, 0.5f, 1.0f, 0.6f, 0.0f, 0.0f, 0.2f, 1.0f}},
    {"Long wash", {-1.5f, -20.0f, 0.0f, 0.4f, 1.0f, 0.85f, 0.64f, 0.0f, 0.8f, 1.0f}},
    {"Wide air", {-2.0f, -6.0f, 6.0f, 0.3f, 1.0f, 0.1f, 0.09f, 0.0f, 1.0f, 1.0f}},
    {"Hard split", {0.0f, -30.0f, 6.0f, 1.0f, 1.0f, 0.12f, 0.16f, 0.0f, 1.0f, 1.0f}},
    {"Breath and tone", {-2.0f, -24.0f, 6.0f, 0.2f, 1.0f, 0.3f, 0.16f, 0.0f, 0.8f, 1.0f}},
    {"Felt and air", {0.0f, -17.0f, 6.0f, 0.5f, 1.0f, 0.35f, 0.81f, 0.0f, 1.0f, 1.0f}},
    {"A touch", {0.0f, -12.0f, 3.0f, 0.5f, 1.0f, 0.3f, 0.16f, 0.0f, 0.6f, 0.35f}},
    {"Bowed entries", {0.0f, -30.0f, 0.0f, 0.6f, 1.0f, 0.5f, 0.16f, 0.0f, 0.5f, 1.0f}},
    {"Ghost puffs", {-30.0f, 6.0f, -30.0f, 0.5f, 1.0f, 0.0f, 0.49f, 150.0f, 0.6f, 0.3f}},
    // PRESETS END
};
static const int kPresetCount = static_cast<int>(sizeof kPresets / sizeof kPresets[0]);

static void set_preset(int n) {
  fresh();
  for (int column = 0; column < p::kNumParams; ++column) {
    device.set_param(kColumns[column], kPresets[n].values[column]);
  }
}

// A chord at full scale held for a minute through the device as it stands:
// the highest sample, and the RMS of seconds 10 to 20 and of the last ten.
struct Minute {
  double peak, early, late;
};
static Minute hold_chord() {
  const double hz[3] = {220.0, 277.18, 329.63};
  const size_t total = static_cast<size_t>(60.0f * kRate);
  const size_t ten = static_cast<size_t>(10.0f * kRate);
  Minute m = {0.0, 0.0, 0.0};
  for (size_t done = 0; done < total; done += kBlock) {
    for (int i = 0; i < kBlock; ++i) {
      const double t = static_cast<double>(done + i) / kRate;
      double x = 0.0;
      for (double f : hz) x += std::sin(2.0 * kPi * f * t) / 3.0;
      device.in_left()[i] = device.in_right()[i] = static_cast<float>(x);
    }
    device.process(kBlock);
    for (int i = 0; i < kBlock; ++i) {
      const double l = device.out_left()[i], r = device.out_right()[i];
      m.peak = std::max(m.peak, std::max(std::fabs(l), std::fabs(r)));
      if (done >= ten && done < 2 * ten) m.early += l * l + r * r;
      if (done >= total - ten) m.late += l * l + r * r;
    }
  }
  m.early = std::sqrt(m.early / (2.0 * ten));
  m.late = std::sqrt(m.late / (2.0 * ten));
  return m;
}

static void check_level() {
  EXPECT(kPresetCount == 16, "the harness holds the sixteen presets");
  // The chord itself: peak 1.0, RMS 0.408.
  double worst_peak = 0.0, worst_growth = 0.0, loudest = 0.0, quietest = 1.0e9;
  auto measure = [&](const char* what) {
    const Minute m = hold_chord();
    worst_peak = std::max(worst_peak, m.peak);
    worst_growth = std::max(worst_growth, m.late - m.early);
    loudest = std::max(loudest, m.late);
    quietest = std::min(quietest, m.late);
    std::snprintf(label, sizeof label,
                  "a full-scale chord held for a minute, %s: peak %.3f, RMS %.3f early and %.3f at the end "
                  "(the chord: 1.000, 0.408)",
                  what, m.peak, m.early, m.late);
    // No more than 6 dB over the input, and no growth.
    EXPECT(m.peak <= 2.0 && m.late <= m.early * 1.01 + 1.0e-3, label);
  };
  fresh();
  measure("as it starts");
  char what[64];
  for (int id = 0; id < p::kNumParams; ++id) {
    for (int end = 0; end < 2; ++end) {
      fresh();
      device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
      std::snprintf(what, sizeof what, "%s at its %s", name_of(id), end == 0 ? "lowest" : "highest");
      measure(what);
    }
  }
  // Everything that adds, at once.
  fresh();
  levels(6.0f, 6.0f, 6.0f);
  device.set_param(p::kHold, 1.0f);
  device.set_param(p::kSoften, 1.0f);
  device.set_param(p::kLate, 300.0f);
  device.set_param(p::kScatter, 1.0f);
  measure("every level and blur at the top");
  for (int n = 0; n < kPresetCount; ++n) {
    set_preset(n);
    std::snprintf(what, sizeof what, "preset %s", kPresets[n].name);
    measure(what);
  }
  std::printf(
      "  a full-scale chord held for a minute at 38 settings: highest peak %.3f, RMS at the end from %.3f to "
      "%.3f (the chord: 0.408), largest rise in RMS from early to the end %.5f\n",
      worst_peak, quietest, loudest, worst_growth);
}

// --- part-way Mix ------------------------------------------------------------------------------

static void check_mix() {
  // Held tones over the piano's range through the default and every preset
  // with Mix at half: the dry half is never cancelled. Each tone a second
  // long, read over its last 0.4 s; with no wet at all it would read -6 dB.
  std::vector<float> tones;
  std::vector<double> pitches;
  for (int semitone = 0; semitone <= 87; semitone += 4) {
    const double hz = 27.5 * std::pow(2.0, semitone / 12.0);
    pitches.push_back(hz);
    tones = then(tones, burst(static_cast<float>(hz), 1.0f, 0.02f, 0.5f));
  }
  double worst = 0.0;
  for (int n = -1; n < kPresetCount; ++n) {
    if (n < 0) {
      fresh();
    } else {
      set_preset(n);
    }
    device.set_param(p::kMix, 0.5f);
    const Stereo out = run(device, padded(tones, 0.2f));
    double lowest = 100.0, highest = -100.0;
    double lowest_hz = 0.0;
    for (size_t t = 0; t < pitches.size(); ++t) {
      const size_t from = static_cast<size_t>((static_cast<double>(t) + 0.55) * kRate) + kLatency;
      const size_t to = from + static_cast<size_t>(0.4 * kRate);
      const double level = std::min(db(tone_level(out.left, pitches[t], kRate, from, to) / 0.5),
                                    db(tone_level(out.right, pitches[t], kRate, from, to) / 0.5));
      if (level < lowest) {
        lowest = level;
        lowest_hz = pitches[t];
      }
      highest = std::max(highest, level);
    }
    worst = std::min(worst, lowest);
    std::snprintf(label, sizeof label,
                  "Mix at half, %s: a held tone reads from %.2f dB (at %.1f Hz) to %.2f dB of itself over "
                  "the piano's range",
                  n < 0 ? "as it starts" : kPresets[n].name, lowest, lowest_hz, highest);
    // -6 dB is the dry half alone; under -7 dB the wet would be taking some of it away.
    EXPECT(lowest > -7.0 && highest < 3.6, label);
    if (n < 0) std::printf("  %s\n", label);
  }
  std::printf(
      "  Mix at half through the default and all sixteen presets: the lowest a held tone reads is %.2f dB "
      "(the dry half alone is -6.02)\n",
      worst);
}

// --- cost ------------------------------------------------------------------------------------

// The work comes a frame at a time: of every four blocks of 128, one holds
// the left side's frame, one the right's, and two hold none. So the worst
// block is reported beside the average.
static void report_blocks(const char* what) {
  rng_state() = 0x2468u;
  std::vector<float> input = noise(8.0f, kRate, 0.05f);
  for (size_t i = 0; i < input.size(); ++i) {
    input[i] += 0.3f * static_cast<float>(std::sin(2.0 * kPi * 330.0 * static_cast<double>(i) / kRate));
    if (i % 24000 == 0) input[i] += 0.8f;
  }
  run(device, std::vector<float>(input.begin(), input.begin() + 48000));
  std::vector<double> micros;
  for (size_t done = 48000; done + kBlock <= input.size(); done += kBlock) {
    for (int i = 0; i < kBlock; ++i) {
      device.in_left()[i] = input[done + i];
      device.in_right()[i] = 0.7f * input[done + i];
    }
    const auto start = std::chrono::steady_clock::now();
    device.process(kBlock);
    micros.push_back(
        std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
  }
  double sum = 0.0;
  for (double v : micros) sum += v;
  std::sort(micros.begin(), micros.end());
  const double average = sum / static_cast<double>(micros.size());
  std::printf(
      "sift %s cost: %.1f us per 128-frame stereo block on average, %.2f%% of real time at 48 kHz (native); "
      "by block: median %.1f, 95th of 100 %.1f, 99th %.1f us of the 2667 a block lasts\n",
      what, average, 100.0 * average / (128.0e6 / kRate), micros[micros.size() / 2],
      micros[micros.size() * 95 / 100], micros[micros.size() * 99 / 100]);
}

static void check_cost() {
  fresh();
  report_blocks("as it starts");
  fresh();
  levels(6.0f, 6.0f, 6.0f);
  device.set_param(p::kHold, 1.0f);
  device.set_param(p::kSoften, 1.0f);
  device.set_param(p::kLate, 300.0f);
  device.set_param(p::kScatter, 1.0f);
  report_blocks("with every blur at the top");
  fresh();
  no_blur();
  device.set_param(p::kEdge, 0.0f);
  report_blocks("with no blur and no Edge");
}

int main() {
  Conformance spec;
  spec.name = "sift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The default Hold rings 1.07 s to -60 dB and is exactly silent 2.9 s after the playing stops.
  spec.tail_seconds = 6.0f;
  // The wet is limited to ±2 and Mix is a crossfade.
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);
  check_medians();
  check_sum();
  check_parts();
  check_sharpness();
  check_lean();
  check_edge();
  check_hold();
  check_hold_held();
  check_soften();
  check_late();
  check_scatter();
  check_bad_input();
  check_overload();
  check_blocks();
  check_default();
  check_controls();
  check_clicks();
  check_rest();
  check_meters();
  check_sides();
  check_level();
  check_mix();
  check_cost();
  return finish("sift");
}
