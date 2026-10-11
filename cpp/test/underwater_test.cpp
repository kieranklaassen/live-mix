// Native harness for Underwater (cpp/devices/underwater). The conformance pass
// covers stability, silence when idle, block-size independence on steady
// noise and parameter abuse; the rest measures what makes it water: the highs
// that go with Depth, where the body rings, how far and how fast the surface
// bends a tone, the bubbles an attack sends up, the sides closing in, the
// squeeze, the light near the surface, and that Depth 0 is the input.
//
// The second check added what a player would have met first: that a flight of
// bubbles stays under its note and no bubble starts like a beep, that soft
// notes and notes over a held pad are heard as attacks while a fade-in is
// not, that part-way Mix neither combs nor cuts a hole at the corner, that
// the squeeze adds nothing to a low note, that no thrown knob bends the pitch
// further than the surface itself does, and that a note after a long silence
// is the same sound at every block size.

#include "../devices/underwater/underwater.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Underwater;
namespace p = livemix::underwater;

static Underwater device;
static Underwater other;

static const float kRate = 48000.0f;

// Copied from underwater.h, which keeps them private: the display's test
// holds the same numbers.
static const double kTopHz = 16000.0;
static const double kDeepHz = 300.0;
static const float kSurfaceDepth = 0.1f;
static const double kBodyTopHz = 520.0;
static const double kBodyDeepHz = 250.0;
static const double kBodyGain = 3.0;
static const double kBodyTrim = 0.3;
static const double kBendCents = 45.0;
static const double kMostBubbles = 12.0;
static const double kSmallHz = 2400.0;
static const double kLargeHz = 420.0;
static const double kBubbleCycles = 12.0;
static const double kChirp = 0.3;

static double corner_hz(double depth) { return kTopHz * std::pow(kDeepHz / kTopHz, depth); }
static double body_hz(double depth) { return kBodyTopHz * std::pow(kBodyDeepHz / kBodyTopHz, depth); }
// The pitch a bubble that starts at `hz` has climbed to, `seconds` into its chirp.
static double climbed(double hz, double seconds) { return hz * (1.0 + kChirp * hz * seconds / kBubbleCycles); }

// Only the water's filter: nothing that moves, rings, squeezes or bubbles.
static void plain(Underwater& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWaver, 0.0f);
  d.set_param(p::kBubbles, 0.0f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kSurface, 0.0f);
  d.set_param(p::kPressure, 0.0f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kMix, 1.0f);
}

struct Event {
  size_t at;
  int param;
  float value;
};

// Run in blocks of `block` frames, cut wherever a parameter is set, so the
// same event lands on the same sample at every block size.
static Stereo run_events(Underwater& d, const std::vector<float>& left, const std::vector<float>& right,
                         const std::vector<Event>& events, int block = kBlock) {
  Stereo out;
  const size_t total = left.size();
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  size_t next_event = 0;
  int which = 0;
  while (done < total) {
    while (next_event < events.size() && events[next_event].at <= done) {
      d.set_param(events[next_event].param, events[next_event].value);
      ++next_event;
    }
    size_t until = total;
    if (next_event < events.size()) until = std::min(until, events[next_event].at);
    // Block 0 is a ragged mix of sizes.
    static const int kRagged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    const int size = block > 0 ? block : kRagged[which++ % 8];
    const int frames = static_cast<int>(std::min(static_cast<size_t>(size), until - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// The frequency of a near-sine over [from, to) from its rising zero
// crossings, read between samples; 0 with fewer than two of them.
static double crossing_hz(const std::vector<float>& x, size_t from, size_t to, double rate) {
  to = std::min(to, x.size());
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to; ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]);
      if (count == 0) first = at;
      last = at;
      ++count;
    }
  }
  return count >= 2 ? (count - 1) * rate / (last - first) : 0.0;
}

// How far a tone of `hz` is bent, in cents, window by window.
static std::vector<float> bend_cents(const std::vector<float>& x, double hz, size_t from, size_t to,
                                     size_t window, double rate) {
  std::vector<float> cents;
  for (size_t at = from; at + window <= to; at += window) {
    const double measured = crossing_hz(x, at, at + window, rate);
    cents.push_back(measured > 0.0 ? static_cast<float>(1200.0 * std::log2(measured / hz)) : 0.0f);
  }
  return cents;
}

// A struck note: a tone that starts at once and dies away.
static std::vector<float> pluck(float hz, float seconds, float gain, float decay_seconds, float lead = 0.0f) {
  std::vector<float> out(static_cast<size_t>((lead + seconds) * kRate), 0.0f);
  const size_t start = static_cast<size_t>(lead * kRate);
  for (size_t i = start; i < out.size(); ++i) {
    const double t = static_cast<double>(i - start) / kRate;
    out[i] = gain * static_cast<float>(std::sin(2.0 * kPi * hz * t) * std::exp(-t / decay_seconds));
  }
  return out;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

// The first and last sample of `x` over a tenth of its peak.
static bool burst(const std::vector<float>& x, size_t* first, size_t* last) {
  const double level = 0.1 * peak(x);
  if (level <= 0.0) return false;
  *first = x.size();
  *last = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > level) {
      if (*first == x.size()) *first = i;
      *last = i;
    }
  }
  return *first < *last;
}

// A plucked string: partials at 1/n, the upper ones dying sooner, rising over 1 ms.
static void add_string(std::vector<float>& into, double at_seconds, double hz, double gain, double decay = 0.6) {
  const size_t start = static_cast<size_t>(at_seconds * kRate);
  const int partials = std::min(24, static_cast<int>(0.4 * kRate / hz));
  for (size_t i = start; i < into.size(); ++i) {
    const double t = static_cast<double>(i - start) / kRate;
    if (t > 6.0 * decay) break;
    const double rise = t < 0.001 ? 0.5 - 0.5 * std::cos(kPi * t / 0.001) : 1.0;
    double sum = 0.0;
    for (int n = 1; n <= partials; ++n) {
      sum += std::sin(2.0 * kPi * hz * n * t + 0.7 * n) / n * std::exp(-t * (1.0 + 0.35 * (n - 1)) / decay);
    }
    into[i] += static_cast<float>(gain * 0.6 * rise * sum);
  }
}

// A held pad note: two dull saws six cents either side of the pitch (a dozen
// partials rolled off over 1.2 kHz), rising over `attack` seconds and held.
static void add_pad(std::vector<float>& into, double hz, double gain, double attack) {
  const int partials = std::min(14, static_cast<int>(0.4 * kRate / hz));
  const double apart[2] = {std::pow(2.0, -6.0 / 1200.0), std::pow(2.0, 6.0 / 1200.0)};
  for (size_t i = 0; i < into.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    const double rise = t < attack ? 0.5 - 0.5 * std::cos(kPi * t / attack) : 1.0;
    double sum = 0.0;
    for (int n = 1; n <= partials; ++n) {
      const double roll = 1.0 / std::sqrt(1.0 + std::pow(hz * n / 1200.0, 4.0));
      sum += roll / n * (std::sin(2.0 * kPi * hz * n * apart[0] * t + 0.3 * n) + std::sin(2.0 * kPi * hz * n * apart[1] * t + 1.1 * n));
    }
    into[i] += static_cast<float>(gain * 0.35 * rise * sum);
  }
}

// How many bubbles `d` sends up through `sound`, read every 64 samples; with
// `marks` (sample positions, rising), also how many it had sent by each.
static int bubbles_sent(Underwater& d, const std::vector<float>& sound, const std::vector<size_t>& marks = {},
                        std::vector<int>* by_mark = nullptr) {
  size_t next = 0;
  if (by_mark) by_mark->clear();
  for (size_t done = 0; done < sound.size(); done += 64) {
    while (by_mark && next < marks.size() && marks[next] <= done) {
      by_mark->push_back(static_cast<int>(d.meter(2)));
      ++next;
    }
    const int frames = static_cast<int>(std::min<size_t>(64, sound.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = sound[done + i];
      d.in_right()[i] = sound[done + i];
    }
    d.process(frames);
  }
  return static_cast<int>(d.meter(2));
}

// How many of the notes starting at `starts` (seconds) sent a bubble up before the next one started.
static int notes_heard(Underwater& d, const std::vector<float>& sound, const std::vector<double>& starts, int* before_first) {
  std::vector<size_t> marks;
  for (double start : starts) marks.push_back(static_cast<size_t>(start * kRate));
  std::vector<int> by_mark;
  const int total = bubbles_sent(d, sound, marks, &by_mark);
  by_mark.push_back(total);
  int heard = 0;
  for (size_t n = 0; n + 1 < by_mark.size(); ++n) heard += by_mark[n + 1] > by_mark[n] ? 1 : 0;
  if (before_first) *before_first = by_mark.empty() ? 0 : by_mark[0];
  return heard;
}

// The most a tone of `hz` is bent either way over [from, to), in cents, in windows of 4 ms.
static double most_bend(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double most = 0.0;
  for (size_t at = from; at + 192 <= to; at += 96) {
    const double measured = crossing_hz(x, at, at + 192, kRate);
    if (measured > 0.0) most = std::max(most, std::fabs(1200.0 * std::log2(measured / hz)));
  }
  return most;
}

// --- what it is --------------------------------------------------------------------------

static void test_identity() {
  // Depth 0 is the input, sample for sample, wherever the other knobs stand:
  // a stereo phrase with attacks in it, every other knob up.
  rng_state() = 0xA11CEu;
  std::vector<float> left = pluck(330.0f, 1.5f, 0.6f, 0.3f, 0.1f);
  std::vector<float> right = pluck(495.0f, 1.5f, 0.5f, 0.25f, 0.35f);
  for (size_t i = 0; i < left.size(); ++i) {
    left[i] += 0.05f * white();
    right[i] += 0.05f * white();
  }
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    if (pass == 1) {
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    }
    device.set_param(p::kDepth, 0.0f);
    Stereo out = run(device, left, right);
    bool same = true;
    for (size_t i = 0; i < left.size(); ++i) same = same && out.left[i] == left[i] && out.right[i] == right[i];
    EXPECT(same, pass == 0 ? "Depth 0 is the input at the defaults" : "Depth 0 is the input with every knob up");
  }
  // And so is Mix 0, at any Depth.
  device.init(kRate);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kMix, 0.0f);
  Stereo out = run(device, left, right);
  bool same = true;
  for (size_t i = 0; i < left.size(); ++i) same = same && out.left[i] == left[i] && out.right[i] == right[i];
  EXPECT(same, "Mix 0 is the input");
  // Something does happen in between: half way down it is another sound.
  device.init(kRate);
  Stereo under = run(device, left, right);
  double worst = 0.0;
  for (size_t i = 0; i < left.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(under.left[i]) - left[i]));
  EXPECT(worst > 0.05, "the default is not the input");
}

static void test_absorption() {
  // The high end falls with every step of Depth.
  rng_state() = 0x5EAu;
  const std::vector<float> hiss = noise(2.0f, kRate, 0.25f);
  double before = 1.0e9;
  bool falls = true;
  std::printf("underwater highs over 2 kHz against Depth:");
  for (int step = 0; step <= 10; ++step) {
    plain(device);
    device.set_param(p::kDepth, 0.1f * static_cast<float>(step));
    Stereo out = run(device, hiss);
    // What is left over 2 kHz, as a level: the share of the energy times the energy.
    const size_t from = 24000;
    const double level = db(std::sqrt(energy_above(out.left, 2000.0, kRate, from)) * rms(out.left, from));
    std::printf(" %.1f", level);
    if (!(level < before - 0.2)) falls = false;
    before = level;
  }
  std::printf(" dB\n");
  EXPECT(falls, "the high end falls monotonically with Depth");

  // The corner is where the header says, and the slope past it is four poles.
  for (float depth : {0.5f, 0.75f, 1.0f}) {
    const double corner = corner_hz(depth);
    plain(device);
    device.set_param(p::kDepth, depth);
    Stereo at = run(device, sine(static_cast<float>(corner), 1.0f, kRate, 0.5f));
    plain(device);
    device.set_param(p::kDepth, depth);
    Stereo octave = run(device, sine(static_cast<float>(2.0 * corner), 1.0f, kRate, 0.5f));
    plain(device);
    device.set_param(p::kDepth, depth);
    Stereo low = run(device, sine(static_cast<float>(0.25 * corner), 1.0f, kRate, 0.5f));
    const double at_db = db(tone_level(at.left, corner, kRate, 24000) / 0.5);
    const double octave_db = db(tone_level(octave.left, 2.0 * corner, kRate, 24000) / 0.5);
    const double low_db = db(tone_level(low.left, 0.25 * corner, kRate, 24000) / 0.5);
    std::printf("underwater Depth %.1f: corner %.0f Hz %.2f dB, an octave over %.2f dB, two under %.2f dB\n",
                depth, corner, at_db, octave_db, low_db);
    EXPECT_NEAR(at_db, -3.01, 0.3, "the corner is 3 dB down where Depth puts it");
    EXPECT_NEAR(octave_db, -24.1, 1.0, "an octave past the corner is 24 dB down");
    EXPECT_NEAR(low_db, 0.0, 0.1, "under the corner the sound is whole");
  }
}

static void test_body() {
  // Body adds a hump where the header says, as tall as it says.
  for (float depth : {0.3f, 0.8f}) {
    const double centre = body_hz(depth);
    double best_hz = 0.0, best = 0.0;
    for (int step = -12; step <= 12; ++step) {
      const double hz = centre * std::pow(2.0, step / 12.0);
      plain(device);
      device.set_param(p::kDepth, depth);
      Stereo flat = run(device, sine(static_cast<float>(hz), 0.6f, kRate, 0.1f));
      plain(device);
      device.set_param(p::kDepth, depth);
      device.set_param(p::kResonance, 1.0f);
      Stereo rung = run(device, sine(static_cast<float>(hz), 0.6f, kRate, 0.1f));
      const double lift = tone_level(rung.left, hz, kRate, 14400) / tone_level(flat.left, hz, kRate, 14400);
      if (lift > best) {
        best = lift;
        best_hz = hz;
      }
    }
    // Far from the hump only the trim is left.
    const double far_hz = centre / 16.0;
    plain(device);
    device.set_param(p::kDepth, depth);
    Stereo flat = run(device, sine(static_cast<float>(far_hz), 1.0f, kRate, 0.1f));
    plain(device);
    device.set_param(p::kDepth, depth);
    device.set_param(p::kResonance, 1.0f);
    Stereo rung = run(device, sine(static_cast<float>(far_hz), 1.0f, kRate, 0.1f));
    const double around = tone_level(rung.left, far_hz, kRate, 24000) / tone_level(flat.left, far_hz, kRate, 24000);
    const double ring = kBodyGain * depth;
    std::printf("underwater Body at Depth %.1f: hump at %.0f Hz (said %.0f), %.2f dB over what is around it (said %.2f), the whole trimmed %.2f dB (said %.2f)\n",
                depth, best_hz, centre, db(best / around), db(1.0 + ring), db(around), db(1.0 / (1.0 + kBodyTrim * ring)));
    EXPECT_NEAR(best_hz, centre, centre * 0.07, "the body rings where Depth puts it");
    EXPECT_NEAR(db(best / around), db(1.0 + ring), 0.5, "the hump stands as far over the rest as Body and Depth say");
    EXPECT_NEAR(db(best), db((1.0 + ring) / (1.0 + kBodyTrim * ring)), 0.3, "and the whole is trimmed so it is not simply louder");
  }
  // And it goes with Depth: none at the surface.
  plain(device);
  device.set_param(p::kDepth, 0.0f);
  device.set_param(p::kResonance, 1.0f);
  Stereo top = run(device, sine(520.0f, 0.5f, kRate, 0.1f));
  EXPECT_NEAR(tone_level(top.left, 520.0, kRate, 12000), 0.1, 1.0e-4, "no body out of the water");
}

static void test_waver() {
  // A steady tone comes back bent by as much as Waver says, at the rate Swell says.
  const double hz = 1000.0;
  const size_t window = 480;  // 10 ms
  struct Case {
    float waver, rate, seconds;
    double most;  // cents, the most the surface can bend it
  };
  // Under 0.14 Hz the swing stops at 35 ms: 0.035 * 2 pi * 0.05 * 0.8455 of pitch.
  const double slow = 1200.0 * std::log2(1.0 + 0.035 * 2.0 * kPi * 0.05 * (0.75 + 0.25 * 0.381966));
  const Case cases[] = {{1.0f, 1.0f, 24.0f, kBendCents},
                        {0.5f, 1.0f, 24.0f, kBendCents * 0.5},
                        {1.0f, 3.0f, 12.0f, kBendCents},
                        {1.0f, 0.05f, 60.0f, slow}};
  for (const Case& c : cases) {
    plain(device);
    device.set_param(p::kDepth, 0.3f);
    device.set_param(p::kWaver, c.waver);
    device.set_param(p::kRate, c.rate);
    Stereo out = run(device, sine(static_cast<float>(hz), c.seconds, kRate, 0.25f));
    const std::vector<float> cents = bend_cents(out.left, hz, 24000, out.left.size(), window, kRate);
    const double most = peak(cents);
    // The swell is three quarters of the surface: its rate is the bend's.
    const double track_rate = kRate / static_cast<double>(window);
    const double found = dominant_frequency(cents, track_rate, c.rate * 0.5, c.rate * 2.0);
    std::printf("underwater Waver %.1f at %.2f Hz: bent %.1f cents at the most (said %.1f), at %.3f Hz\n",
                c.waver, c.rate, most, c.most, found);
    EXPECT(most < c.most * 1.04 + 0.3 && most > c.most * 0.9, "Waver bends the pitch as far as it says");
    EXPECT_NEAR(found, c.rate, c.rate * 0.03, "the bend comes and goes at the Swell rate");
    // The swell alone is 75 / 84.55 of the most.
    const double swell = tone_level(cents, c.rate, track_rate) / c.most;
    EXPECT_NEAR(swell, 0.75 / (0.75 + 0.25 * 0.381966), 0.06, "the swell's share of the bend");
  }
  // No Waver, no bend, and no delay at all.
  plain(device);
  device.set_param(p::kDepth, 0.3f);
  Stereo still = run(device, sine(1000.0f, 2.0f, kRate, 0.25f));
  EXPECT(peak(bend_cents(still.left, hz, 24000, still.left.size(), window, kRate)) < 0.2, "no Waver, no bend");
  // The right side rides the same surface later, by Width.
  plain(device);
  device.set_param(p::kDepth, 0.3f);
  device.set_param(p::kWaver, 1.0f);
  device.set_param(p::kRate, 1.0f);
  Stereo wide = run(device, sine(1000.0f, 8.0f, kRate, 0.25f));
  plain(device);
  device.set_param(p::kDepth, 0.3f);
  device.set_param(p::kWaver, 1.0f);
  device.set_param(p::kRate, 1.0f);
  device.set_param(p::kWidth, 0.0f);
  Stereo narrow = run(device, sine(1000.0f, 8.0f, kRate, 0.25f));
  EXPECT(correlation(wide.left, wide.right, 48000) < 0.9, "with Width the two sides waver apart");
  EXPECT(worst_difference(narrow, Stereo{narrow.right, narrow.left}) == 0.0,
         "with no Width a centred sound stays centred");
}

static void test_bubbles() {
  const std::vector<float> note = pluck(330.0f, 2.5f, 0.5f, 0.12f, 0.2f);
  const size_t onset = static_cast<size_t>(0.2f * kRate);

  // The same note with no bubbles: everything else in the water is the same,
  // so the difference is the bubbles alone.
  plain(device);
  device.set_param(p::kDepth, 0.6f);
  const Stereo bare = run(device, note);
  EXPECT(device.meter(2) == 0.0f, "no Bubbles, none counted");

  // The count follows Bubbles, and more of them is more sound.
  double before = 0.0;
  bool grows = true;
  std::printf("underwater bubbles after one attack:");
  for (float amount : {0.05f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, amount);
    const Stereo out = run(device, note);
    const std::vector<float> air = minus(out.left, bare.left);
    const int counted = static_cast<int>(device.meter(2));
    const int said = std::max(1, static_cast<int>(amount * kMostBubbles + 0.5));
    const double energy = rms(air) * std::sqrt(static_cast<double>(air.size()));
    std::printf(" %d (%.3f)", counted, energy);
    EXPECT(counted == said, "an attack sends up as many bubbles as Bubbles says");
    EXPECT(peak(air, 0, onset) == 0.0, "no bubble before the attack");
    if (!(energy > before * 1.05)) grows = false;
    before = energy;
  }
  std::printf("\n");
  EXPECT(grows, "more Bubbles is more sound");

  // One bubble is one chirp: it starts after the attack, its pitch climbs
  // while it dies away, and Bubble Size says how high and how long.
  double length[2] = {0.0, 0.0};
  for (int large = 0; large < 2; ++large) {
    plain(device);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, 0.05f);
    device.set_param(p::kBubbleSize, static_cast<float>(large));
    const Stereo out = run(device, note);
    const std::vector<float> air = minus(out.left, bare.left);
    size_t first = 0, last = 0;
    const bool found = burst(air, &first, &last);
    EXPECT(found, "one bubble sounds");
    if (!found) continue;
    const size_t span = last - first;
    const double early = crossing_hz(air, first, first + span * 3 / 10, kRate);
    const double late = crossing_hz(air, last - span * 3 / 10, last, kRate);
    const double centre = large ? kLargeHz : kSmallHz;
    length[large] = static_cast<double>(span) / kRate;
    std::printf("underwater one %s bubble: starts %.0f ms after the attack, %.0f Hz climbing to %.0f Hz over %.0f ms (pitch said %.0f Hz)\n",
                large ? "large" : "small", 1000.0 * (static_cast<double>(first) - onset) / kRate, early,
                late, 1000.0 * length[large], device.meter(3));
    EXPECT(first > onset + 300, "the bubble comes after the attack");
    EXPECT(late > early * 1.25 && late < early * 1.7, "the pitch climbs inside the chirp");
    // From the centre for its size: up to 0.8 octaves later in the flight, 0.35 either way.
    EXPECT(early > centre * 0.75 && early < centre * 2.5, "Bubble Size sets the pitch");
    // `early` is read over the first three tenths of the chirp, half a cycle in: the pitch has climbed by then.
    const double said = device.meter(3);
    const double middle = 0.5 / said + 0.15 * static_cast<double>(span) / kRate;
    EXPECT(std::fabs(climbed(said, middle) - early) < 0.05 * early, "the pitch reported is the pitch the chirp starts at");
    // No chirp anywhere else: past the first one's dying away there is nothing.
    EXPECT(peak(air, last + 3 * span) < 0.02 * peak(air), "one bubble, one chirp");
  }
  EXPECT(length[1] > 3.0 * length[0], "a large bubble takes several times as long as a small one");

  // Bubbles are as loud as the attack that sent them: a softer note, softer bubbles.
  {
    double level[2] = {0.0, 0.0};
    for (int soft = 0; soft < 2; ++soft) {
      const std::vector<float> struck = pluck(330.0f, 2.5f, soft ? 0.1f : 0.4f, 0.12f, 0.2f);
      plain(device);
      device.set_param(p::kDepth, 0.6f);
      const Stereo dry = run(device, struck);
      plain(device);
      device.set_param(p::kDepth, 0.6f);
      device.set_param(p::kBubbles, 1.0f);
      const Stereo out = run(device, struck);
      level[soft] = rms(minus(out.left, dry.left));
    }
    std::printf("underwater bubbles of a note 12 dB softer: %.1f dB softer\n", db(level[0] / level[1]));
    EXPECT_NEAR(db(level[0] / level[1]), 12.0, 1.5, "bubbles follow the size of the attack");
  }

  // Going under takes the first tenth of Depth, and the bubbles come in with
  // it: half way under, the same flight is half as loud.
  {
    double level[2] = {0.0, 0.0};
    int counted[2] = {0, 0};
    for (int whole = 0; whole < 2; ++whole) {
      const float depth = whole ? kSurfaceDepth : 0.5f * kSurfaceDepth;
      plain(device);
      device.set_param(p::kDepth, depth);
      const Stereo dry = run(device, note);
      plain(device);
      device.set_param(p::kDepth, depth);
      device.set_param(p::kBubbles, 1.0f);
      const Stereo out = run(device, note);
      level[whole] = rms(minus(out.left, dry.left));
      counted[whole] = static_cast<int>(device.meter(2));
    }
    std::printf("underwater bubbles half way under against just under: %.3f of the level (%d and %d sent)\n",
                level[0] / level[1], counted[0], counted[1]);
    EXPECT(counted[0] == counted[1] && counted[1] == static_cast<int>(kMostBubbles), "the same flight is sent half way under");
    EXPECT_NEAR(level[0] / level[1], 0.5, 0.01, "half way under, the bubbles are half as loud");
  }

  // A tone that swells in and holds sends none; a tone that starts at once
  // sends one flight and no more while it holds.
  {
    std::vector<float> swell = sine(330.0f, 6.0f, kRate, 0.5f);
    for (size_t i = 0; i < 96000; ++i) swell[i] *= static_cast<float>(i) / 96000.0f;
    plain(device);
    device.set_param(p::kDepth, 0.6f);
    const Stereo dry = run(device, swell);
    plain(device);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, 1.0f);
    const Stereo out = run(device, swell);
    EXPECT(device.meter(2) == 0.0f, "a swelling, steady tone sends no bubbles");
    EXPECT(worst_difference(out, dry) == 0.0, "and sounds as it does with Bubbles down");

    plain(device);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, 1.0f);
    run(device, sine(330.0f, 2.0f, kRate, 0.5f));
    const float after_onset = device.meter(2);
    run(device, sine(330.0f, 4.0f, kRate, 0.5f));
    EXPECT(after_onset == 12.0f, "a tone that starts at once sends one flight");
    EXPECT(device.meter(2) == after_onset, "a held tone sends no more");
  }

  // Bubbles are in the water: at Depth 0 there are none.
  plain(device);
  device.set_param(p::kDepth, 0.0f);
  device.set_param(p::kBubbles, 1.0f);
  run(device, note);
  EXPECT(device.meter(2) == 0.0f, "no bubbles out of the water");

  // A flight climbs: over many attacks, the later bubbles of a flight are higher.
  {
    plain(device);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, 1.0f);
    device.set_param(p::kBubbleSize, 0.5f);
    double early = 0.0, late = 0.0;
    int early_count = 0, late_count = 0;
    const std::vector<float> click = pluck(330.0f, 1.5f, 0.5f, 0.05f);
    for (int attack = 0; attack < 24; ++attack) {
      float seen = device.meter(2);
      const size_t blocks = click.size() / 64;
      for (size_t b = 0; b < blocks; ++b) {
        for (int i = 0; i < 64; ++i) {
          device.in_left()[i] = click[b * 64 + i];
          device.in_right()[i] = click[b * 64 + i];
        }
        device.process(64);
        if (device.meter(2) != seen) {
          seen = device.meter(2);
          // The flight's time constant at this size is 170 ms.
          if (b * 64 < static_cast<size_t>(0.1f * kRate)) {
            early += std::log2(device.meter(3));
            ++early_count;
          } else if (b * 64 > static_cast<size_t>(0.25f * kRate)) {
            late += std::log2(device.meter(3));
            ++late_count;
          }
        }
      }
    }
    const double climb = late / std::max(1, late_count) - early / std::max(1, early_count);
    std::printf("underwater flight: %d early bubbles, %d late, the late ones %.2f octaves higher\n", early_count,
                late_count, climb);
    EXPECT(early_count > 20 && late_count > 20 && climb > 0.2 && climb < 0.8, "the later bubbles of a flight are higher");
  }
}

static void test_bubbles_under_the_note() {
  // A flight stays under the note that sent it, however deep the note is and
  // however hard the water squeezes: the bubbles are sized by what the attack
  // added to the sound in the water, and the squeeze holds them with the note.
  double worst = -200.0;
  float worst_depth = 0.0f;
  std::printf("underwater flight against its note (peak, dB):");
  for (float depth : {0.35f, 0.7f, 0.92f, 1.0f}) {
    for (double hz : {220.0, 880.0}) {
      for (float pressure : {0.35f, 1.0f}) {
        std::vector<float> note(static_cast<size_t>(3.0f * kRate), 0.0f);
        add_string(note, 0.2, hz, 0.5);
        Stereo with[2];
        for (int bubbles = 0; bubbles < 2; ++bubbles) {
          device.init(kRate);
          device.set_param(p::kWaver, 0.0f);
          device.set_param(p::kSurface, 0.0f);
          device.set_param(p::kDepth, depth);
          device.set_param(p::kPressure, pressure);
          device.set_param(p::kBubbles, bubbles ? 1.0f : 0.0f);
          with[bubbles] = run(device, note);
        }
        const std::vector<float> air = minus(with[1].left, with[0].left);
        EXPECT(peak(air) > 0.0, "the note sends a flight");
        const double against = db(peak(air) / peak(with[0].left));
        std::printf(" %.1f", against);
        if (against > worst) {
          worst = against;
          worst_depth = depth;
        }
      }
    }
  }
  std::printf("; the worst %.1f dB at Depth %.2f\n", worst, worst_depth);
  EXPECT(worst < -3.0, "a flight of bubbles stays under the note that sent it at any Depth");

  // A bubble is soft-edged and short: it swells in over cycles of its own
  // pitch, not at once, and is gone in a few dozen of them.
  const std::vector<float> note = pluck(330.0f, 2.5f, 0.5f, 0.12f, 0.2f);
  for (int large = 0; large < 2; ++large) {
    Stereo with[2];
    for (int bubbles = 0; bubbles < 2; ++bubbles) {
      plain(device);
      device.set_param(p::kDepth, 0.6f);
      device.set_param(p::kBubbleSize, static_cast<float>(large));
      device.set_param(p::kBubbles, bubbles ? 0.05f : 0.0f);
      with[bubbles] = run(device, note);
    }
    const std::vector<float> air = minus(with[1].left, with[0].left);
    const double top = peak(air);
    size_t tenth = 0, most = 0, last = 0;
    for (size_t i = 0; i < air.size(); ++i) {
      const double size = std::fabs(air[i]);
      if (size > 0.1 * top && tenth == 0) tenth = i;
      if (size > 0.9 * top && most == 0) most = i;
      if (size > 0.1 * top) last = i;
    }
    const double hz = device.meter(3);
    const double rise = static_cast<double>(most - tenth) / kRate * hz;
    const double length = static_cast<double>(last - tenth) / kRate * hz;
    std::printf("underwater one %s bubble at %.0f Hz: a tenth to nine tenths of its peak in %.1f cycles, over a tenth for %.0f\n",
                large ? "large" : "small", hz, rise, length);
    EXPECT(top > 0.0 && rise > 1.5, "a bubble swells in over cycles of its pitch: no hard edge");
    EXPECT(length < 60.0, "a bubble is a few dozen cycles long, not a held beep");
  }
}

static void test_attacks() {
  // One bubble an attack, so the count of bubbles is the count of attacks heard.
  auto listening = [&]() {
    device.init(kRate);
    device.set_param(p::kDepth, 0.5f);
    device.set_param(p::kBubbles, 0.05f);
    device.set_param(p::kBubbleSize, 0.0f);
  };
  const double pitches[] = {220.0, 329.6, 440.0, 277.2, 659.3, 880.0, 164.8, 1318.5, 392.0, 523.3};
  const double gains[] = {0.5, 0.3, 0.45, 0.2, 0.4, 0.3, 0.5, 0.25, 0.35, 0.3};

  // Soft playing on its own: every note of a phrase, the softest 20 dB under the loudest.
  {
    std::vector<float> phrase(static_cast<size_t>(10.0f * kRate), 0.0f);
    const double soft[] = {0.5, 0.1, 0.3, 0.05, 0.2, 0.08, 0.4, 0.06, 0.1, 0.25};
    std::vector<double> starts;
    for (int n = 0; n < 10; ++n) {
      starts.push_back(0.3 + 0.9 * n);
      add_string(phrase, starts[n], pitches[n], soft[n]);
    }
    listening();
    const int heard = notes_heard(device, phrase, starts, nullptr);
    std::printf("underwater attacks: %d of 10 notes of a phrase played loud and soft\n", heard);
    EXPECT(heard >= 9, "soft notes among loud ones each send their bubbles");
  }

  // The same kind of phrase over a held pad twice as loud as it is: the pad
  // alone sends nothing, most of the notes over it do.
  {
    std::vector<float> pad(static_cast<size_t>(13.0f * kRate), 0.0f);
    for (double hz : {110.0, 164.8, 220.0, 277.2, 329.6}) add_pad(pad, hz, 0.3, 2.0);
    std::vector<float> phrase(pad.size(), 0.0f);
    std::vector<double> starts;
    for (int n = 0; n < 10; ++n) {
      starts.push_back(4.0 + 0.8 * n);
      add_string(phrase, starts[n], pitches[n], gains[n]);
    }
    const double scale = 0.5 * peak(pad) / peak(phrase);
    std::vector<float> both(pad.size());
    for (size_t i = 0; i < pad.size(); ++i) both[i] = pad[i] + static_cast<float>(scale) * phrase[i];
    listening();
    int before = -1;
    const int heard = notes_heard(device, both, starts, &before);
    listening();
    const int alone = bubbles_sent(device, pad);
    std::printf("underwater attacks: %d of 10 notes over a held pad 6 dB louder than they are (%d before the first, %d from the pad alone)\n",
                heard, before, alone);
    EXPECT(alone == 0 && before == 0, "a held pad sends no bubbles");
    EXPECT(heard >= 5, "notes played over a held pad send their bubbles");
  }

  // Nothing new played, nothing sent: a bright tone fading in, a tremolo, steady noise.
  {
    std::vector<float> fade(static_cast<size_t>(8.0f * kRate));
    std::vector<float> tremolo(fade.size());
    for (size_t i = 0; i < fade.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      double bright = 0.0, dull = 0.0;
      for (int n = 1; n <= 10; ++n) bright += 0.3 / n * std::sin(2.0 * kPi * 440.0 * n * t);
      for (int n = 1; n <= 6; ++n) dull += 0.25 / n * std::sin(2.0 * kPi * 220.0 * n * t);
      const double in = std::min(1.0, t / 2.0);
      fade[i] = static_cast<float>(in * bright);
      tremolo[i] = static_cast<float>(in * (0.6 + 0.4 * std::sin(2.0 * kPi * 6.0 * t)) * dull);
    }
    listening();
    const int from_fade = bubbles_sent(device, fade);
    listening();
    const int from_tremolo = bubbles_sent(device, tremolo);
    rng_state() = 0xF0A3u;
    std::vector<float> hiss(static_cast<size_t>(20.0f * kRate)), rumble(hiss.size());
    double low = 0.0;
    for (size_t i = 0; i < hiss.size(); ++i) {
      const double in = std::min(1.0, static_cast<double>(i) / kRate / 2.0);
      const float w = white();
      low += 0.02 * (w - low);
      hiss[i] = static_cast<float>(0.2 * in) * w;
      rumble[i] = static_cast<float>(3.0 * in * low);
    }
    listening();
    const int from_hiss = bubbles_sent(device, hiss);
    listening();
    const int from_rumble = bubbles_sent(device, rumble);
    std::printf("underwater attacks with nothing new played: a bright tone fading in %d, a tremolo %d, hiss %d, rumble %d\n",
                from_fade, from_tremolo, from_hiss, from_rumble);
    EXPECT(from_fade == 0, "a bright tone fading in sends no bubbles");
    EXPECT(from_tremolo == 0, "a tremolo sends no bubbles");
    EXPECT(from_hiss == 0 && from_rumble == 0, "steady noise sends no bubbles");
  }
}

static void test_part_way_mix() {
  // What Mix calls dry rides the same surface as the wet sound, so part-way
  // Mix is two sounds in step: a held tone keeps its level (no comb sweeping
  // through it), and is bent half as far as at full Mix.
  const double hz = 440.0;
  std::printf("underwater a held tone at part-way Mix, full Waver: its level moves by");
  for (float mix : {0.25f, 0.5f, 0.75f}) {
    plain(device);
    device.set_param(p::kDepth, 0.3f);
    device.set_param(p::kWaver, 1.0f);
    device.set_param(p::kRate, 1.0f);
    device.set_param(p::kMix, mix);
    const Stereo out = run(device, sine(static_cast<float>(hz), 8.0f, kRate, 0.25f));
    // The level in windows of 50 ms (22 cycles: a bent tone's own level does not move).
    double low = 1.0e9, high = 0.0;
    for (size_t at = 48000; at + 2400 <= out.size(); at += 1200) {
      const double level = rms(out.left, at, at + 2400);
      low = std::min(low, level);
      high = std::max(high, level);
    }
    std::printf(" %.2f dB at Mix %.2f,", db(high / low), mix);
    EXPECT(db(high / low) < 0.5, "part-way Mix with Waver up does not comb");
    if (mix == 0.5f) {
      const double most = peak(bend_cents(out.left, hz, 48000, out.left.size(), 480, kRate));
      std::printf(" bent %.1f cents (said %.1f),", most, 0.5 * kBendCents);
      EXPECT_NEAR(most, 0.5 * kBendCents, 0.06 * kBendCents, "at half Mix the surface bends the whole sound half as far");
    }
  }
  std::printf("\n");
  // Nor is there a hole at the corner. A blend of a sound with its own
  // fourth-order low-pass has one, where the two are half a turn apart (17 dB
  // deep at half Mix, a null at 0.57). Mix makes the water shallower instead:
  // part way, the response is the low-pass where Depth times Mix puts it, and
  // it only falls.
  {
    std::printf("underwater part-way Mix at Depth 0.65:");
    for (float mix : {0.25f, 0.5f, 0.57f, 0.75f}) {
      const double corner = corner_hz(0.65 * mix);
      double before = 0.0, rises = 0.0, at_corner = 0.0;
      for (int step = -12; step <= 12; ++step) {
        const double hz = corner * std::pow(2.0, step / 6.0);
        if (hz > 20000.0) break;
        plain(device);
        device.set_param(p::kDepth, 0.65f);
        device.set_param(p::kMix, mix);
        const Stereo out = run(device, sine(static_cast<float>(hz), 0.6f, kRate, 0.25f));
        const double level = db(tone_level(out.left, hz, kRate, 9600) / 0.25);
        if (step > -12) rises = std::max(rises, level - before);
        if (step == 0) at_corner = level;
        before = level;
      }
      std::printf(" Mix %.2f corner %.0f Hz %.2f dB, rises %.2f dB at the most;", mix, corner, at_corner, rises);
      EXPECT(rises < 0.05, "part-way Mix leaves no hole in the response: it only falls");
      EXPECT_NEAR(at_corner, -3.01, 0.3, "part-way Mix puts the corner where Depth times Mix says");
    }
    std::printf("\n");
  }
  // Mix thrown to 0 under a sound: the swing comes down within the bend, and
  // from then on the output is the input, sample for sample.
  rng_state() = 0x3170u;
  const std::vector<float> hiss = noise(4.0f, kRate, 0.2f);
  device.init(kRate);
  device.set_param(p::kWaver, 1.0f);
  const Stereo out = run_events(device, hiss, hiss, {{48000, p::kMix, 0.0f}});
  size_t last = 0;
  for (size_t i = 48000; i < hiss.size(); ++i) {
    if (out.left[i] != hiss[i] || out.right[i] != hiss[i]) last = i;
  }
  std::printf("underwater Mix thrown to 0 at full Waver: the output is the input from %.2f s after\n",
              (static_cast<double>(last) - 48000.0) / kRate);
  EXPECT(last > 48000 && last < 48000 + 72000, "Mix thrown to 0 is the input once the swing has come down");
}

static void test_squeeze_low_notes() {
  // The squeeze holds its gain still through a low note's cycle: it turns the
  // note down and does not bend its wave.
  std::printf("underwater squeeze at full Pressure and Depth: harmonics added to a low note");
  for (double hz : {55.0, 82.0, 110.0}) {
    plain(device);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kPressure, 1.0f);
    const Stereo out = run(device, sine(static_cast<float>(hz), 3.0f, kRate, 0.5f));
    double added = 0.0;
    for (int n = 2; n <= 12; ++n) {
      const double level = tone_level(out.left, hz * n, kRate, 48000);
      added += level * level;
    }
    const double share = std::sqrt(added) / tone_level(out.left, hz, kRate, 48000);
    std::printf(" %.3f %% at %.0f Hz,", 100.0 * share, hz);
    EXPECT(share < 0.001, "the squeeze does not distort a low note");
  }
  std::printf("\n");
  // A loud chord of five low notes, whole numbers of Hz over exactly two
  // seconds, so each partial can be taken out of the output exactly: what is
  // left more than 8 Hz from any of them is tones the squeeze made.
  const double chord[] = {55.0, 82.0, 110.0, 139.0, 165.0};
  std::vector<float> in(static_cast<size_t>(4.0f * kRate), 0.0f);
  for (double hz : chord) {
    for (size_t i = 0; i < in.size(); ++i) in[i] += static_cast<float>(0.2 * std::sin(2.0 * kPi * hz * i / kRate + hz));
  }
  plain(device);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kPressure, 1.0f);
  const Stereo out = run(device, in);
  const size_t span = 96000;
  std::vector<double> rest(span);
  double total = 0.0;
  for (size_t i = 0; i < span; ++i) {
    rest[i] = out.left[96000 + i];
    total += rest[i] * rest[i];
  }
  // Every half Hz from 10 Hz to 3 kHz is a whole number of cycles in the span.
  double made = 0.0;
  for (int bin = 20; bin <= 6000; ++bin) {
    const double at = 0.5 * bin;
    bool near = false;
    for (double hz : chord) near = near || std::fabs(at - hz) <= 8.0;
    if (near) continue;
    const double w = 2.0 * kPi * at / kRate;
    const double coeff = 2.0 * std::cos(w);
    double s1 = 0.0, s2 = 0.0;
    for (size_t i = 0; i < span; ++i) {
      const double s0 = rest[i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    const double re = s1 - s2 * std::cos(w), im = s2 * std::sin(w);
    made += 2.0 * (re * re + im * im) / static_cast<double>(span);
  }
  std::printf("underwater squeeze on a loud chord of five low notes (peak %.2f): tones it makes of its own %.2f %% of the output\n",
              peak(in), 100.0 * std::sqrt(made / total));
  EXPECT(std::sqrt(made / total) < 0.018, "the squeeze adds little of its own to a low chord");
}

static void test_thrown_knobs_bend() {
  // A knob that moves the delay is thrown under a 1 kHz tone, at three places
  // on the surface: the pitch stays within the bend of a full Waver (and the
  // tenth more the right side's lateness may add). Through the surface, and
  // with Mix, the filter coming in over 5 ms turns the tone's phase too.
  struct Throw {
    const char* name;
    int param;
    float from, to;
    float waver, rate, depth;
    double most;  // cents
  };
  const double bend = 1.15 * kBendCents;
  const Throw throws[] = {
      {"Waver up at the slowest Swell", p::kWaver, 0.0f, 1.0f, 0.0f, 0.05f, 0.3f, bend},
      {"Waver down at the slowest Swell", p::kWaver, 1.0f, 0.0f, 1.0f, 0.05f, 0.3f, bend},
      {"Waver up at the fastest Swell", p::kWaver, 0.0f, 1.0f, 0.0f, 3.0f, 0.3f, bend},
      {"Swell from slowest to fastest", p::kRate, 0.05f, 3.0f, 1.0f, 0.05f, 0.3f, bend},
      {"Swell from fastest to slowest", p::kRate, 3.0f, 0.05f, 1.0f, 3.0f, 0.3f, bend},
      {"Width closed at the fastest Swell", p::kWidth, 1.0f, 0.0f, 1.0f, 3.0f, 0.3f, bend},
      {"Depth into the water", p::kDepth, 0.0f, 0.3f, 1.0f, 0.05f, 0.0f, kBendCents + 27.0},
      {"Depth out of the water", p::kDepth, 0.3f, 0.0f, 1.0f, 0.05f, 0.3f, kBendCents + 27.0},
      {"Mix up", p::kMix, 0.0f, 1.0f, 1.0f, 0.05f, 0.3f, kBendCents + 27.0},
      {"Mix down", p::kMix, 1.0f, 0.0f, 1.0f, 0.05f, 0.3f, kBendCents + 27.0},
  };
  const std::vector<float> tone = sine(1000.0f, 9.0f, kRate, 0.25f);
  for (const Throw& t : throws) {
    double most = 0.0;
    for (size_t cut : {size_t{96000}, size_t{117600}, size_t{139200}}) {
      plain(device);
      device.set_param(p::kWaver, t.waver);
      device.set_param(p::kRate, t.rate);
      device.set_param(p::kDepth, t.depth);
      device.set_param(t.param, t.from);
      const Stereo out = run_events(device, tone, tone, {{cut, t.param, t.to}});
      most = std::max(most, most_bend(out.left, 1000.0, cut - 480, tone.size()));
      most = std::max(most, most_bend(out.right, 1000.0, cut - 480, tone.size()));
    }
    std::printf("underwater %s under a tone: bent %.1f cents at the most (allowed %.1f)\n", t.name, most, t.most);
    char label[96];
    std::snprintf(label, sizeof label, "%s thrown does not swoop past the effect's own bend", t.name);
    EXPECT(most < t.most, label);
  }
}

static void test_closing_in() {
  // Two unrelated sides: the side signal falls with Depth as far as Width lets it.
  rng_state() = 0xC105Eu;
  const std::vector<float> left = noise(1.0f, kRate, 0.2f);
  const std::vector<float> right = noise(1.0f, kRate, 0.2f);
  auto side_over_mid = [&](float depth, float width) {
    plain(device);
    device.set_param(p::kDepth, depth);
    device.set_param(p::kWidth, width);
    Stereo out = run(device, left, right);
    std::vector<float> mid(out.size()), side(out.size());
    for (size_t i = 0; i < out.size(); ++i) {
      mid[i] = 0.5f * (out.left[i] + out.right[i]);
      side[i] = 0.5f * (out.left[i] - out.right[i]);
    }
    return rms(side, 12000) / rms(mid, 12000);
  };
  // Against the same Depth at full Width, which keeps the side whole: the
  // water's filter is the same on both, so what is left is the closing in.
  double before = 1.0;
  bool falls = true;
  std::printf("underwater side against Depth at Width 0:");
  for (float depth : {0.2f, 0.4f, 0.6f, 0.8f, 1.0f}) {
    const double now = side_over_mid(depth, 0.0f) / side_over_mid(depth, 1.0f);
    std::printf(" %.3f", now);
    EXPECT_NEAR(now, 1.0 - depth, 0.005, "the side is turned down by Depth");
    if (!(now < before)) falls = false;
    before = now;
  }
  std::printf("\n");
  EXPECT(falls, "the side level falls with Depth");
  EXPECT(side_over_mid(1.0f, 0.0f) < 1.0e-4, "at the bottom with no Width the sound is mono");
  EXPECT_NEAR(side_over_mid(0.6f, 0.5f) / side_over_mid(0.6f, 1.0f), 0.7, 0.005, "Width keeps its share of the side");
  // Full Width is the two sides as they came, at any Depth: each side is its own input filtered.
  plain(device);
  device.set_param(p::kDepth, 1.0f);
  Stereo both = run(device, left, right);
  plain(device);
  device.set_param(p::kDepth, 1.0f);
  Stereo left_alone = run(device, left, left);
  EXPECT(worst_difference(Stereo{both.left, both.left}, left_alone) == 0.0, "full Width keeps left and right apart at any Depth");
}

static void test_pressure() {
  // A low tone, under every corner, so only the squeeze touches its level.
  auto level_out = [&](float gain, float pressure, float depth) {
    plain(device);
    device.set_param(p::kDepth, depth);
    device.set_param(p::kPressure, pressure);
    Stereo out = run(device, sine(60.0f, 1.5f, kRate, gain));
    return tone_level(out.left, 60.0, kRate, 36000);
  };
  // At full Pressure and Depth, 20 dB more in is 10 dB more out.
  const double loud = level_out(0.5f, 1.0f, 1.0f);
  const double soft = level_out(0.05f, 1.0f, 1.0f);
  std::printf("underwater squeeze: 20 dB of input is %.1f dB of output; -15 dBFS moves %.2f dB\n", db(loud / soft),
              db(level_out(0.1778f, 1.0f, 1.0f) / level_out(0.1778f, 0.0f, 1.0f)));
  EXPECT_NEAR(db(loud / soft), 10.0, 1.0, "full Pressure at the bottom is two to one");
  EXPECT_NEAR(db(level_out(0.1778f, 1.0f, 1.0f) / level_out(0.1778f, 0.0f, 1.0f)), 0.0, 0.8,
              "a level of -15 dBFS keeps its place");
  // Under the threshold everything comes up by the same make-up (x3).
  EXPECT_NEAR(db(level_out(0.01f, 1.0f, 1.0f) / level_out(0.01f, 0.0f, 1.0f)), 9.54, 0.3,
              "what is under the threshold comes up by the make-up");
  // The squeeze goes with Depth: half way down it is half as much.
  const double half = db(level_out(0.5f, 1.0f, 0.5f) / level_out(0.05f, 1.0f, 0.5f));
  EXPECT(half > 12.0 && half < 17.5, "half way down the squeeze is gentler");
  // No overshoot: a tone that starts at full level is never louder than it settles.
  plain(device);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kPressure, 1.0f);
  Stereo hit = run(device, sine(60.0f, 1.0f, kRate, 0.9f));
  std::printf("underwater squeeze: a full-level tone from silence peaks at %.3f, settles at %.3f\n", peak(hit.left),
              peak(hit.left, 24000));
  EXPECT(peak(hit.left, 0, 4800) < peak(hit.left, 24000) * 1.05, "the squeeze does not let an attack through louder");
  EXPECT(device.meter(4) < 0.5f && device.meter(4) > 0.1f, "the squeeze reports what it holds down");
}

static double flicker_hz = 0.0;

static void test_light() {
  // Near the surface the top end flickers; low down in pitch nothing moves.
  auto flicker = [&](float hz, float depth, float surface, double* level) {
    plain(device);
    device.set_param(p::kDepth, depth);
    device.set_param(p::kSurface, surface);
    Stereo out = run(device, sine(hz, 4.0f, kRate, 0.25f));
    // The level in windows of 5 ms.
    std::vector<float> levels;
    for (size_t at = 24000; at + 240 <= out.left.size(); at += 240) {
      levels.push_back(static_cast<float>(rms(out.left, at, at + 240)));
    }
    const double centre = mean(levels);
    if (level) *level = centre;
    double low = 1.0e9, high = 0.0;
    for (float v : levels) {
      low = std::min<double>(low, v);
      high = std::max<double>(high, v);
    }
    // The strongest of the flicker's rates in the level.
    std::vector<float> moved(levels.size());
    for (size_t i = 0; i < levels.size(); ++i) moved[i] = levels[i] - static_cast<float>(centre);
    flicker_hz = dominant_frequency(moved, 200.0, 4.0, 30.0);
    return centre > 0.0 ? (high - low) / centre : 0.0;
  };
  double level = 0.0;
  const double top = flicker(8000.0f, 0.15f, 1.0f, &level);
  std::printf("underwater light: 8 kHz near the surface moves %.2f of its level, strongest at %.2f Hz\n", top,
              flicker_hz);
  EXPECT(top > 0.8, "near the surface the top end flickers");
  EXPECT_NEAR(flicker_hz, 7.3, 0.2, "at the rate of its slowest wave");
  EXPECT(flicker(8000.0f, 0.15f, 0.0f, nullptr) < 0.01, "no Surface, no flicker");
  EXPECT(flicker(200.0f, 0.15f, 1.0f, nullptr) < 0.12, "the low end does not flicker");
  const double half = flicker(8000.0f, 0.15f, 0.5f, nullptr);
  EXPECT_NEAR(half, top * 0.5, top * 0.08, "half the Surface is half the flicker");
  // Deep down the water has taken the top end, and its flicker with it.
  double deep = 0.0;
  flicker(8000.0f, 0.9f, 1.0f, &deep);
  EXPECT(deep < level * 1.0e-3, "deep down the light is gone");
  // The two sides flicker apart.
  plain(device);
  device.set_param(p::kDepth, 0.15f);
  device.set_param(p::kSurface, 1.0f);
  Stereo out = run(device, sine(8000.0f, 3.0f, kRate, 0.25f));
  std::vector<float> l, r;
  for (size_t at = 24000; at + 240 <= out.size(); at += 240) {
    l.push_back(static_cast<float>(rms(out.left, at, at + 240)));
    r.push_back(static_cast<float>(rms(out.right, at, at + 240)));
  }
  const float ml = static_cast<float>(mean(l)), mr = static_cast<float>(mean(r));
  for (float& v : l) v -= ml;
  for (float& v : r) v -= mr;
  EXPECT(correlation(l, r) < 0.6, "the light flickers apart on the two sides");
  // The flicker it reports is the flicker it makes: read every 5 ms, it
  // follows the level of the top end on the left.
  plain(device);
  device.set_param(p::kDepth, 0.15f);
  device.set_param(p::kSurface, 1.0f);
  std::vector<float> said, heard;
  const std::vector<float> treble = sine(8000.0f, 0.005f, kRate, 0.25f);  // forty whole cycles
  for (int window = 0; window < 600; ++window) {
    Stereo piece = run(device, treble);
    if (window < 100) continue;
    heard.push_back(static_cast<float>(rms(piece.left)));
    said.push_back(device.meter(5));
  }
  const float centre = static_cast<float>(mean(heard));
  for (float& v : heard) v -= centre;
  std::printf("underwater light: the flicker reported against the level heard, correlation %.3f, between %.2f and %.2f\n",
              correlation(said, heard), *std::min_element(said.begin(), said.end()),
              *std::max_element(said.begin(), said.end()));
  EXPECT(correlation(said, heard) > 0.95, "the flicker reported is the flicker heard");
  EXPECT(peak(said) <= 1.0 && peak(said) > 0.8, "the flicker reported stays within -1..1 and uses the range");
  plain(device);
  device.set_param(p::kDepth, 0.15f);
  run(device, treble);
  EXPECT(device.meter(5) == 0.0f, "no Surface, no flicker reported");
}


static void test_clicks() {
  // A knob thrown while a tone sounds: no step between two samples larger
  // than the tone itself makes at either setting, with no event in it.
  // A low tone with a little top: its own steps are small, so a click of a
  // few thousandths shows.
  std::vector<float> tone = sine(110.0f, 2.0f, kRate, 0.4f);
  const std::vector<float> partial = sine(1500.0f, 2.0f, kRate, 0.02f);
  for (size_t i = 0; i < tone.size(); ++i) tone[i] += partial[i];
  struct Throw {
    const char* name;
    int param;
    float from, to;
    double room;  // how much steeper than the steadier of the two settings it may get
  };
  const Throw throws[] = {
      {"Depth down", p::kDepth, 0.2f, 0.95f, 1.1},
      {"Depth up", p::kDepth, 0.95f, 0.2f, 1.1},
      // Through the surface the waver's delay comes and goes, at the pace the
      // device allows itself (test_thrown_knobs_bend holds it to that).
      {"Depth out of the water", p::kDepth, 0.6f, 0.0f, 1.1},
      {"Depth into the water", p::kDepth, 0.0f, 0.6f, 1.1},
      {"Mix", p::kMix, 1.0f, 0.0f, 1.1},
      {"Mix up", p::kMix, 0.0f, 1.0f, 1.1},
      {"Body", p::kResonance, 0.0f, 1.0f, 1.1},
      {"Surface", p::kSurface, 0.0f, 1.0f, 1.1},
      {"Pressure", p::kPressure, 0.0f, 1.0f, 1.1},
      {"Width", p::kWidth, 1.0f, 0.0f, 1.1},
      // These move the delay, no faster than the surface's own bend.
      {"Waver", p::kWaver, 0.0f, 1.0f, 1.1},
      {"Waver down", p::kWaver, 1.0f, 0.0f, 1.1},
      {"Swell", p::kRate, 0.05f, 3.0f, 1.1},
      {"Swell down", p::kRate, 3.0f, 0.05f, 1.1},
  };
  const size_t at = 48000;
  for (const Throw& t : throws) {
    double steady = 0.0;
    for (float value : {t.from, t.to}) {
      device.init(kRate);
      device.set_param(p::kBubbles, 0.0f);
      device.set_param(t.param, value);
      Stereo reference = run(device, tone);
      steady = std::max(steady, std::max(max_step(reference.left, 24000), max_step(reference.right, 24000)));
    }
    device.init(kRate);
    device.set_param(p::kBubbles, 0.0f);
    device.set_param(t.param, t.from);
    Stereo out = run_events(device, tone, tone, {{at, t.param, t.to}});
    const double thrown = std::max(max_step(out.left, 24000), max_step(out.right, 24000));
    std::printf("underwater %s thrown under a tone: steepest step %.4f, steady %.4f\n", t.name, thrown, steady);
    char label[96];
    std::snprintf(label, sizeof label, "%s thrown while sounding does not click", t.name);
    EXPECT(thrown < steady * t.room + 0.0005, label);
  }
  // Bubbles and Bubble Size are read by the next attack; moving them under a
  // sounding flight changes nothing that is already in the water.
  const std::vector<float> note = pluck(330.0f, 1.5f, 0.5f, 0.12f, 0.1f);
  device.init(kRate);
  device.set_param(p::kBubbles, 1.0f);
  Stereo flight = run(device, note);
  device.init(kRate);
  device.set_param(p::kBubbles, 1.0f);
  Stereo moved = run_events(device, note, note, {{9600, p::kBubbles, 0.0f}, {9700, p::kBubbleSize, 1.0f}});
  EXPECT(worst_difference(flight, moved) == 0.0, "Bubbles moved under a flight leaves the flight as it is");
}

static void test_bad_input() {
  // Samples no device should be handed: not a number, infinite, absurd. The
  // output stays a number throughout, and once good input is back the device
  // is where one that never saw them is.
  const size_t bad = 4800;
  std::vector<float> phrase = silence(0.2f, kRate);
  const float poison[] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f};
  for (size_t i = 0; i < bad; ++i) phrase[2400 + i] = poison[(i / 7) % 5];
  std::vector<float> clean = silence(0.2f, kRate);
  const std::vector<float> after = sine(330.0f, 3.0f, kRate, 0.3f);
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    other.init(kRate);
    if (pass == 1) {
      for (int id = 0; id < p::kNumParams; ++id) {
        device.set_param(id, p::kParamMax[id]);
        other.set_param(id, p::kParamMax[id]);
      }
    }
    // No bubbles: the bad samples are an attack of their own, which the clean one never heard.
    device.set_param(p::kBubbles, 0.0f);
    other.set_param(p::kBubbles, 0.0f);
    Stereo during = run(device, phrase);
    run(other, clean);
    Stereo recovered = run(device, after);
    Stereo expected = run(other, after);
    EXPECT(finite(during.left) && finite(during.right), "bad samples in, numbers out");
    EXPECT(peak(during.left) < 64.0 && peak(during.right) < 64.0, "bad samples are held to a bound");
    EXPECT(finite(recovered.left) && finite(recovered.right), "numbers out once good input is back");
    const size_t from = recovered.size() - 24000;
    const double apart = worst_difference(recovered, expected, from);
    std::printf("underwater after bad samples (%s): %.2e from a device that never saw them, level %.3f\n",
                pass == 0 ? "defaults" : "every knob up", apart, rms(recovered.left, from));
    EXPECT(rms(recovered.left, from) > 0.01, "it sounds again");
    EXPECT(apart < 1.0e-3, "and is where a device that never saw them is");
  }
  // At Mix 0 too: the input is passed on, a sample that is not a number is not.
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  Stereo dry = run(device, phrase);
  EXPECT(finite(dry.left) && finite(dry.right), "Mix 0 does not pass on what is not a number");
}

static void test_sleep() {
  // The same phrase, a note, a silence and a note, at every block size: the
  // silences step across the 3.5 s after which arriving sound starts afresh
  // and across the moment the device falls asleep, and two knobs are moved
  // in the silence, 3 ms before the second note.
  const std::vector<float> first_left = pluck(330.0f, 0.4f, 0.5f, 0.1f);
  const std::vector<float> first_right = pluck(440.0f, 0.4f, 0.4f, 0.1f);
  const std::vector<float> second_left = pluck(392.0f, 1.0f, 0.5f, 0.2f);
  const std::vector<float> second_right = pluck(294.0f, 1.0f, 0.45f, 0.2f);
  auto phrase = [&](float gap, std::vector<float>* left, std::vector<float>* right) {
    *left = first_left;
    *right = first_right;
    const size_t still = static_cast<size_t>(gap * kRate);
    left->insert(left->end(), still, 0.0f);
    right->insert(right->end(), still, 0.0f);
    const size_t at = left->size();
    left->insert(left->end(), second_left.begin(), second_left.end());
    right->insert(right->end(), second_right.begin(), second_right.end());
    return at;
  };
  std::vector<float> gaps;
  for (float gap : {3.44f, 3.48f, 3.495f, 3.5f, 3.505f, 3.52f, 3.56f}) gaps.push_back(gap);
  for (int step = 0; step <= 16; ++step) gaps.push_back(4.0f + 0.02f * static_cast<float>(step));
  double worst = 0.0;
  float worst_gap = 0.0f;
  for (int with_bubbles = 0; with_bubbles < 2; ++with_bubbles) {
    if (with_bubbles) {
      // With bubbles the output falls silent when the last of the flight has
      // died away, 0.35 s after the note ends, and sleep comes 4 s after that.
      gaps.clear();
      for (int step = 0; step <= 16; ++step) gaps.push_back(4.26f + 0.02f * static_cast<float>(step));
    }
    for (float gap : gaps) {
      std::vector<float> left, right;
      const size_t second = phrase(gap, &left, &right);
      const std::vector<Event> events = {{second - 144, p::kDepth, 0.85f}, {second - 144, p::kWaver, 0.9f}};
      Stereo reference;
      for (int block : {128, 1, 2048, 0}) {
        device.init(kRate);
        if (!with_bubbles) device.set_param(p::kBubbles, 0.0f);
        Stereo out = run_events(device, left, right, events, block);
        if (block == 128) {
          reference = out;
          continue;
        }
        const double apart = worst_difference(out, reference);
        if (apart > worst) {
          worst = apart;
          worst_gap = gap;
        }
      }
    }
  }
  std::printf("underwater across a silence, blocks of 1, 2048 and ragged against 128: worst %.2e (silence %.3f s)\n",
              worst, worst_gap);
  EXPECT(worst < 1.0e-6, "the output is the same at every block size across a silence");

  // The knobs that glide, thrown late in a long silence, where one block size
  // has the device asleep (nothing glides) and another still awake (it does):
  // the next note is the same either way, because sound arriving after 3.5 s
  // of silence starts afresh with every knob where it was last put.
  {
    double late_worst = 0.0;
    float late_gap = 0.0f, late_at = 0.0f;
    const float cases[][2] = {{3.6f, 3.2f}, {3.6f, 3.45f}, {4.3f, 3.45f}, {4.3f, 3.9f}, {5.0f, 3.45f}, {9.0f, 3.2f}};
    for (const auto& c : cases) {
      std::vector<float> left, right;
      const size_t second = phrase(c[0], &left, &right);
      const size_t when = second - static_cast<size_t>((c[0] - c[1]) * kRate);
      const std::vector<Event> events = {{when, p::kWaver, 1.0f}, {when, p::kRate, 0.07f}, {when, p::kDepth, 0.8f},
                                         {when, p::kWidth, 0.9f}, {when, p::kMix, 0.6f},   {when, p::kPressure, 1.0f}};
      Stereo reference;
      for (int block : {128, 1, 2048, 0}) {
        device.init(kRate);
        device.set_param(p::kBubbles, 0.0f);
        Stereo out = run_events(device, left, right, events, block);
        if (block == 128) {
          reference = out;
          continue;
        }
        const double apart = worst_difference(out, reference);
        if (apart > late_worst) {
          late_worst = apart;
          late_gap = c[0];
          late_at = c[1];
        }
      }
    }
    std::printf("underwater knobs thrown late in a long silence, blocks of 1, 2048 and ragged against 128: worst %.2e (silence %.1f s, thrown %.2f s into it)\n",
                late_worst, late_gap, late_at);
    EXPECT(late_worst < 1.0e-6, "knobs thrown late in a long silence give the same next note at every block size");
  }

  // What starting afresh is for: a loud note leaves the attack detector's
  // ceilings falling for seconds, the device falls asleep with them wherever
  // they then are (the block that sees the fourth second of silence end), and
  // a soft note that swells in after it must find the same mark to jump over
  // at every block size, or its flight starts a sample apart.
  {
    double soft_worst = 0.0;
    for (int step : {0, 5, 6, 11, 13, 15}) {
      for (double rise : {0.002, 0.02}) {
        const double gap = 4.6 + 0.0937 * step;
        const size_t second = static_cast<size_t>((0.5 + gap) * kRate);
        std::vector<float> in(second + static_cast<size_t>(1.5f * kRate), 0.0f);
        for (size_t i = 2400; i < 24000; ++i) {
          const double t = static_cast<double>(i) / kRate;
          double sum = 0.0;
          for (int n = 1; n <= 20; ++n) sum += 0.5 / n * std::sin(2.0 * kPi * 220.0 * n * t);
          in[i] = static_cast<float>(sum);
        }
        for (size_t i = second; i < in.size(); ++i) {
          const double t = static_cast<double>(i - second) / kRate;
          double sum = 0.0;
          for (int n = 1; n <= 8; ++n) sum += 0.012 / n * std::sin(2.0 * kPi * 330.0 * n * t + 0.5 * n);
          in[i] = static_cast<float>(std::min(1.0, t / rise) * std::exp(-t / 0.4) * sum);
        }
        Stereo reference;
        for (int block : {128, 1, 2048, 0}) {
          device.init(kRate);
          device.set_param(p::kBubbles, 1.0f);
          Stereo out = run_events(device, in, in, {}, block);
          if (block == 128) {
            EXPECT(peak(out.left, second - 4800, second) == 0.0, "asleep before the soft note");
            reference = out;
            continue;
          }
          soft_worst = std::max(soft_worst, worst_difference(out, reference));
        }
      }
    }
    std::printf("underwater a soft note after a loud one and a long silence, blocks of 1, 2048 and ragged against 128: worst %.2e\n",
                soft_worst);
    EXPECT(soft_worst < 1.0e-6, "a soft note after a long silence sends the same flight at every block size");
  }

  // A knob moved while the device sleeps is there when the next note starts:
  // the note is the note of a device that had the knobs there all along.
  {
    std::vector<float> left, right;
    const size_t second = phrase(6.0f, &left, &right);
    const std::vector<Event> moved = {{second - 96000, p::kDepth, 0.9f},    {second - 96000, p::kWaver, 0.8f},
                                      {second - 90000, p::kResonance, 1.0f}, {second - 90000, p::kSurface, 1.0f},
                                      {second - 48000, p::kPressure, 1.0f},  {second - 48000, p::kWidth, 0.1f},
                                      {second - 240, p::kMix, 0.7f},         {second - 240, p::kRate, 1.3f}};
    device.init(kRate);
    Stereo slept = run_events(device, left, right, moved);
    other.init(kRate);
    for (const Event& event : moved) other.set_param(event.param, event.value);
    // The surface must stand where the first one's does: Swell is set at the same moment on both.
    other.set_param(p::kRate, p::kParamDefault[p::kRate]);
    Stereo always = run_events(other, left, right, {{second - 240, p::kRate, 1.3f}});
    const double apart = worst_difference(slept, always, second);
    std::printf("underwater knobs moved in its sleep: the next note is %.2e from one set that way all along\n", apart);
    EXPECT(apart < 1.0e-6, "knobs moved while asleep have arrived when the next note starts");
    EXPECT(peak(slept.left, second - 48000, second) == 0.0, "and it is asleep in the silence");
  }

  // The surface keeps time while the device sleeps.
  device.init(kRate);
  run(device, noise(1.0f, kRate, 0.2f));
  EXPECT_NEAR(device.meter(0), 0.3, 1.0e-3, "the swell is where its rate puts it");
  EXPECT_NEAR(device.meter(1), 0.3 * 0.381966, 1.0e-3, "the ripple is where its rate puts it");
  render(device, 10.0f, kRate);
  Stereo rest = render(device, 0.5f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
  EXPECT_NEAR(device.meter(0), 0.45, 2.0e-3, "the surface keeps time while the device sleeps");
  EXPECT(device.meter(4) == 1.0f, "at rest the squeeze reads 1");
  Stereo woken = run(device, sine(330.0f, 0.5f, kRate, 0.3f));
  EXPECT(rms(woken.left, 12000) > 0.05, "wakes on new input");
}

static void test_levels() {
  // The default against its input, on struck notes and on a held chord.
  std::vector<float> notes = pluck(220.0f, 4.0f, 0.4f, 0.5f);
  const std::vector<float> second = pluck(330.0f, 3.0f, 0.4f, 0.5f);
  const std::vector<float> third = pluck(494.0f, 2.0f, 0.4f, 0.5f);
  for (size_t i = 0; i < second.size(); ++i) notes[48000 + i] += second[i];
  for (size_t i = 0; i < third.size(); ++i) notes[96000 + i] += third[i];
  device.init(kRate);
  Stereo out = run(device, notes);
  const double struck = db(rms(out.left) / rms(notes));
  std::vector<float> chord = sine(220.0f, 4.0f, kRate, 0.15f);
  for (float hz : {277.2f, 329.6f, 440.0f, 880.0f, 1760.0f}) {
    const std::vector<float> part = sine(hz, 4.0f, kRate, hz > 500.0f ? 0.05f : 0.12f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += part[i];
  }
  device.init(kRate);
  Stereo held = run(device, chord);
  const double sustained = db(rms(held.left, 48000) / rms(chord, 48000));
  std::printf("underwater default against its input: struck notes %+.1f dB (peak %.2f against %.2f), a held chord %+.1f dB\n",
              struck, peak(out.left), peak(notes), sustained);
  EXPECT(struck > -6.0 && struck < 3.0, "the default is near the level of struck notes going in");
  EXPECT(sustained > -6.0 && sustained < 3.0, "the default is near the level of a held chord going in");

  // Every knob up, full-scale input of the worst kinds: bounded.
  double worst = 0.0;
  for (int kind = 0; kind < 3; ++kind) {
    std::vector<float> loud(96000);
    for (size_t i = 0; i < loud.size(); ++i) {
      if (kind == 0) loud[i] = ((i / 109) % 2) ? 1.0f : -1.0f;                      // a square at the body
      if (kind == 1) loud[i] = ((i / 2400) % 2) ? white() : 0.0f;                   // bursts of noise: attacks
      if (kind == 2) loud[i] = (i % 2400) < 24 ? 1.0f : 0.0f;                       // clicks
    }
    for (float depth : {0.3f, 1.0f}) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
      device.set_param(p::kDepth, depth);
      Stereo full = run(device, loud);
      EXPECT(finite(full.left) && finite(full.right), "finite with every knob up and full-scale input");
      worst = std::max(worst, std::max(peak(full.left), peak(full.right)));
    }
  }
  std::printf("underwater every knob up, full-scale input: peak %.2f\n", worst);
  EXPECT(worst < 4.0, "bounded with every knob up and full-scale input");
}

static void test_other_rates() {
  // The corner, the bend and a bubble's pitch do not move with the sample rate.
  for (float rate : {44100.0f, 96000.0f}) {
    const double corner = corner_hz(0.75);
    plain(device, rate);
    device.set_param(p::kDepth, 0.75f);
    Stereo at = run(device, sine(static_cast<float>(corner), 1.0f, rate, 0.5f));
    EXPECT_NEAR(db(tone_level(at.left, corner, rate, static_cast<size_t>(0.5f * rate)) / 0.5), -3.01, 0.3,
                "the corner does not move with the sample rate");
    plain(device, rate);
    device.set_param(p::kDepth, 0.3f);
    device.set_param(p::kWaver, 1.0f);
    device.set_param(p::kRate, 1.0f);
    Stereo bent = run(device, sine(1000.0f, 12.0f, rate, 0.25f));
    const size_t window = static_cast<size_t>(0.01f * rate);
    const double most = peak(bend_cents(bent.left, 1000.0, static_cast<size_t>(0.5f * rate), bent.left.size(), window, rate));
    EXPECT(most > kBendCents * 0.9 && most < kBendCents * 1.04 + 0.3, "the bend does not move with the sample rate");
    // One small bubble.
    std::vector<float> note(static_cast<size_t>(1.5f * rate), 0.0f);
    for (size_t i = static_cast<size_t>(0.1f * rate); i < note.size(); ++i) {
      const double t = (static_cast<double>(i) - 0.1 * rate) / rate;
      note[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * 330.0 * t) * std::exp(-t / 0.12));
    }
    plain(device, rate);
    device.set_param(p::kDepth, 0.6f);
    Stereo bare = run(device, note);
    plain(device, rate);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kBubbles, 0.05f);
    device.set_param(p::kBubbleSize, 0.0f);
    Stereo out = run(device, note);
    const std::vector<float> air = minus(out.left, bare.left);
    size_t first = 0, last = 0;
    const bool found = burst(air, &first, &last);
    const double early = found ? crossing_hz(air, first, first + (last - first) * 3 / 10, rate) : 0.0;
    std::printf("underwater at %.0f Hz: bend %.1f cents, one small bubble at %.0f Hz (said %.0f) for %.0f ms\n", rate,
                most, early, device.meter(3), found ? 1000.0 * (last - first) / rate : 0.0);
    const double middle = found ? 0.5 / device.meter(3) + 0.15 * static_cast<double>(last - first) / rate : 0.0;
    EXPECT(found && std::fabs(climbed(device.meter(3), middle) - early) < 0.05 * early,
           "a bubble's pitch does not move with the sample rate");
  }
}

// --- What the second reading found ------------------------------------------

// How far the waver swings the delay, in milliseconds, between 15 and 45 s of
// a 100 Hz tone just under the surface (the whole waver, hardly any of the
// water's filter): the tone's phase against the one that went in, read once
// a cycle, and the largest step of the pitch between two of those readings.
struct Swing {
  double ms;
  double step_cents;
};

static Swing swing_of(float rate, float swell) {
  plain(device, rate);
  device.set_param(p::kDepth, 0.1f);
  device.set_param(p::kWaver, 1.0f);
  device.set_param(p::kRate, swell);
  device.set_param(p::kWidth, 0.0f);
  const double hz = 100.0;
  const double w = 2.0 * kPi * hz / rate;
  const int cycle = static_cast<int>(rate / hz + 0.5f);
  const long total = static_cast<long>(45.0f * rate);
  double in_phase = 0.0, quadrature = 0.0, last_phase = 0.0, wraps = 0.0;
  double least = 1.0e9, most = -1.0e9, last_delay = 0.0, last_cents = 0.0, step = 0.0;
  int count = 0, read = 0;
  for (long n = 0; n < total; n += 128) {
    for (int i = 0; i < 128; ++i) {
      device.in_left()[i] = device.in_right()[i] = 0.5f * static_cast<float>(std::sin(w * static_cast<double>(n + i)));
    }
    device.process(128);
    for (int i = 0; i < 128; ++i) {
      const double y = device.out_left()[i];
      in_phase += y * std::sin(w * static_cast<double>(n + i));
      quadrature += y * std::cos(w * static_cast<double>(n + i));
      if (++count < cycle) continue;
      count = 0;
      const double phase = std::atan2(quadrature, in_phase);
      in_phase = quadrature = 0.0;
      if (phase - last_phase > kPi) wraps -= 1.0;
      if (phase - last_phase < -kPi) wraps += 1.0;
      last_phase = phase;
      const double delay = -(phase / (2.0 * kPi) + wraps) / hz * 1000.0;
      if (n > static_cast<long>(15.0f * rate)) {
        least = std::min(least, delay);
        most = std::max(most, delay);
        // The bend over one cycle of the tone: minus the slope of the delay.
        const double cents = -(delay - last_delay) / (1000.0 / hz) * 1200.0 / std::log(2.0);
        if (++read > 2) step = std::max(step, std::fabs(cents - last_cents));
        last_cents = cents;
      }
      last_delay = delay;
    }
  }
  return {most - least, step};
}

static void test_second_reading() {
  // The right side reads the surface a little late, so the phase its sine is
  // taken at goes under nought once a cycle. kit::SineTable::lookup takes a
  // phase into [0, 1) by its floor, and from -2^-25 up to nought that comes
  // to 1 as a float: the read was the table's last entry (sin 2 pi as a
  // float, -2.4e-16) blended with the one after it, which is not the table's.
  // It is the sine of nothing now, from the table's first.
  const float hair = Underwater::surface_sine(-1.0e-8f);
  std::printf("second reading: the surface's sine a hair under nought is %.3g\n", hair);
  EXPECT(hair == 0.0f, "the surface's sine a hair under nought is read from inside the table");
  double worst = 0.0;
  for (float phase : {-0.069f, -0.01f, -1.0e-4f, 0.0f, 1.0e-4f, 0.25f, 0.9f}) {
    worst = std::max(worst, std::abs(Underwater::surface_sine(phase) - std::sin(2.0 * kPi * phase)));
  }
  EXPECT(worst < 1.0e-6, "and it is the sine everywhere else");

  // A slow swell swings the delay by twice 35 ms, which is 13,440 samples at
  // 192 kHz. The line held 8,192: the delay ran into its end and stood there
  // for a third of every swell (no bend at all), with a step in the pitch
  // where it met it. The swing is the same at every rate now.
  const Swing at48 = swing_of(48000.0f, 0.1f);
  const Swing at192 = swing_of(192000.0f, 0.1f);
  std::printf("second reading: a 0.1 Hz swell swings the delay %.1f ms at 48 kHz and %.1f ms at 192 kHz; "
              "the pitch steps %.2f and %.2f cents at the most between two cycles of the tone\n",
              at48.ms, at192.ms, at48.step_cents, at192.step_cents);
  EXPECT(at48.ms > 64.0 && at48.ms < 70.5, "a slow swell swings the delay by nearly twice 35 ms");
  EXPECT_NEAR(at192.ms, at48.ms, 1.0, "and by as much at 192 kHz");
  EXPECT(at192.step_cents < 2.0, "with no step in the pitch where the line used to end");
}

int main() {
  Conformance spec;
  spec.name = "underwater";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  test_identity();
  test_absorption();
  test_body();
  test_waver();
  test_bubbles();
  test_bubbles_under_the_note();
  test_attacks();
  test_part_way_mix();
  test_closing_in();
  test_pressure();
  test_squeeze_low_notes();
  test_thrown_knobs_bend();
  test_light();
  test_clicks();
  test_bad_input();
  test_sleep();
  test_levels();
  test_other_rates();
  test_second_reading();

  // The cost at the defaults on noise, and at the worst: every knob up, an
  // attack every 55 ms so the pool of bubbles is full, and Depth moved every
  // block so everything that follows from it is worked out again each sample.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("underwater", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
  for (size_t i = 0; i < input.size(); ++i) {
    if (i % 2640 < 240) input[i] += 0.6f * static_cast<float>(std::sin(2.0 * kPi * 330.0 * static_cast<double>(i) / kRate));
  }
  std::vector<Event> sweep;
  for (size_t at = 0; at < input.size(); at += 128) sweep.push_back({at, p::kDepth, (at / 128) % 2 ? 1.0f : 0.5f});
  report_cost("underwater at its worst", 10.0f, kRate, [&] { run_events(device, input, input, sweep); });
  return finish("underwater");
}
