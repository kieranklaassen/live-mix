// Native harness for Around (cpp/devices/around). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a source moving round a head: what each ear
// gets from a source at a known place, that the place moves by the clock on
// each path, that nothing clicks or piles up, and what is left in mono.

#include "../devices/around/around.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Around;
namespace p = livemix::around;

static Around device;
static Around twin;

static const float kRate = 48000.0f;

struct Setting {
  float path, rate, radius, head, near, turn, blur, mix;
};

static void set(Around& d, const Setting& s) {
  d.set_param(p::kPath, s.path);
  d.set_param(p::kRate, s.rate);
  d.set_param(p::kRadius, s.radius);
  d.set_param(p::kHead, s.head);
  d.set_param(p::kNear, s.near);
  d.set_param(p::kTurn, s.turn);
  d.set_param(p::kBlur, s.blur);
  d.set_param(p::kMix, s.mix);
}

static const Setting kDefault = {0, 0.2f, 0.85f, 0.7f, 0.25f, 0, 0.35f, 1};

// The source held (as near as the slowest Rate holds it: under two degrees
// in 0.3 s) at `turn` degrees: the middle of a Pendulum's swing.
static void park(Around& d, float turn, float head, float rate = kRate) {
  d.init(rate);
  set(d, {2, 0.01f, 1, head, 0, turn, 0, 1});
}

static size_t peak_index(const std::vector<float>& x) {
  size_t best = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// A parked source's level in each ear at `hz`, in dB against the input.
static void ear_levels(float turn, float head, float hz, double* left, double* right) {
  park(device, turn, head);
  Stereo out = run(device, sine(hz, 0.3f, kRate, 0.5f));
  *left = db(tone_level(out.left, hz, kRate, 4800, 14400) / 0.5);
  *right = db(tone_level(out.right, hz, kRate, 4800, 14400) / 0.5);
}

static double max_diff(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// What the device should make of a source at (x, y) with Head 0 and Near 0:
// the balance between the ears, (R² − L²) / (R² + L²).
static double balance_of(double x) {
  const double c = Around::kPan;
  return 2.0 * c * x / (1.0 + c * c * x * x);
}

static std::vector<float> phrase(float seconds);
static void cues();
static void movement();
static void smoothness();
static void levels();
static void rest();

int main() {
  Conformance spec;
  spec.name = "around";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  cues();
  movement();
  smoothness();
  levels();
  rest();

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("around", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  set(device, {3, 4, 1, 1, 1, 135, 1, 0.5f});
  report_cost("around, worst (Wander, everything up)", 10.0f, kRate, [&] { run(device, input); });

  return finish("around");
}

// What each ear gets from a source at a known place.
static void cues() {
  // A source at the right (90°): the left ear is later by kItdSeconds, lower
  // by 12 dB in the bass and duller on top of that; the mirror at the left.
  for (int side = 0; side < 2; ++side) {
    const float turn = side == 0 ? 90.0f : -90.0f;
    for (float rate : {48000.0f, 96000.0f}) {
      // The low band carries the time: a 100 Hz tone's phase in each ear.
      park(device, turn, 1.0f, rate);
      Stereo out = run(device, sine(100.0f, 0.3f, rate, 0.5f));
      const size_t from = static_cast<size_t>(0.1f * rate), to = static_cast<size_t>(0.3f * rate);
      const double near_phase = tone_phase(side == 0 ? out.right : out.left, 100.0, rate, from, to);
      const double far_phase = tone_phase(side == 0 ? out.left : out.right, 100.0, rate, from, to);
      const double in_phase = -0.5 * kPi;  // a sine against the cosine it is measured by
      EXPECT_NEAR(near_phase, in_phase, 0.002, "the near ear hears the sound when it happens");
      const double late = (near_phase - far_phase) / (2.0 * kPi * 100.0);
      if (side == 0 && rate == 48000.0f) {
        std::printf("note: source at the right, Head 1: the far ear is %.3f ms late at 100 Hz\n",
                    late * 1000.0);
      }
      EXPECT_NEAR(late, Around::kItdSeconds, 0.00003, "the far ear hears it 0.66 ms later");
    }
    {
      // The high band is not delayed: a click's edge is in both ears at once.
      park(device, turn, 1.0f);
      std::vector<float> click(4800, 0.0f);
      click[100] = 1.0f;
      Stereo out = run(device, click);
      EXPECT(peak_index(out.left) == 100 && peak_index(out.right) == 100,
             "the high band is in both ears at once");
    }
    double l100, r100, l1k, r1k;
    ear_levels(turn, 1.0f, 100.0f, &l100, &r100);
    ear_levels(turn, 1.0f, 1000.0f, &l1k, &r1k);
    const double near100 = side == 0 ? r100 : l100, far100 = side == 0 ? l100 : r100;
    const double far1k = side == 0 ? l1k : r1k;
    // The top, as the mean power of nine tones from 4 to 12 kHz (the far
    // ear's top ripples: what is left of its two bands meets out of step).
    double near_top = 0.0, far_top = 0.0;
    for (int k = 0; k <= 8; ++k) {
      double l, r;
      ear_levels(turn, 1.0f, 4000.0f + 1000.0f * static_cast<float>(k), &l, &r);
      near_top += std::pow(10.0, 0.1 * (side == 0 ? r : l)) / 9.0;
      far_top += std::pow(10.0, 0.1 * (side == 0 ? l : r)) / 9.0;
    }
    const double near8k = 10.0 * std::log10(near_top), far8k = 10.0 * std::log10(far_top);
    if (side == 0) {
      std::printf("note: source at the right, Head 1: far ear %.1f dB under the near at 100 Hz, "
                  "%.1f at 1 kHz, %.1f from 4 to 12 kHz; near ear %+.2f dB\n",
                  near100 - far100, near100 - far1k, near8k - far8k, near100);
    }
    EXPECT_NEAR(near100 - far100, 12.04, 0.3, "the far ear is 12 dB lower in the bass");
    EXPECT_NEAR(far100 - far8k, 14.0, 3.0, "the far ear is duller: 14 dB more off over 4 kHz");
    EXPECT_NEAR(near100 - near8k, 0.0, 0.3, "the near ear keeps its top");
    EXPECT_NEAR(near100, 2.75, 0.15, "the near ear is 2.75 dB up: the ears keep their summed power");
  }

  // Head 0 is plain panning: no delay, no shadow.
  {
    park(device, 90.0f, 0.0f);
    std::vector<float> click(4800, 0.0f);
    click[100] = 1.0f;
    Stereo out = run(device, click);
    EXPECT(peak_index(out.left) == 100 && peak_index(out.right) == 100,
           "Head 0: both ears hear the click at once");
    double l100, r100, l8k, r8k;
    ear_levels(90.0f, 0.0f, 100.0f, &l100, &r100);
    ear_levels(90.0f, 0.0f, 8000.0f, &l8k, &r8k);
    EXPECT_NEAR(r100 - l100, 12.04, 0.3, "Head 0: the level difference stays");
    EXPECT_NEAR(l100 - l8k, 0.0, 0.1, "Head 0: the far ear is not duller");
  }

  // Front and back differ by the outer ear's colour: from behind both ears
  // lose top above 5 kHz and have a notch at 7.5 kHz; the bass is the same.
  {
    double front[4], back[4], unused;
    const float at[4] = {250.0f, 7500.0f, 12000.0f, 3000.0f};
    for (int k = 0; k < 4; ++k) {
      ear_levels(0.0f, 1.0f, at[k], &unused, &front[k]);
      ear_levels(180.0f, 1.0f, at[k], &back[k], &unused);
    }
    std::printf("note: behind against in front, Head 1: %+.2f dB at 250 Hz, %+.2f at 3 kHz, "
                "%+.2f at 7.5 kHz, %+.2f at 12 kHz\n",
                back[0] - front[0], back[3] - front[3], back[1] - front[1], back[2] - front[2]);
    EXPECT_NEAR(back[0] - front[0], 0.0, 0.2, "behind: the bass is as in front");
    EXPECT_NEAR(back[1] - front[1], -8.4, 1.0, "behind: a notch at 7.5 kHz");
    EXPECT_NEAR(back[2] - front[2], -3.6, 1.0, "behind: the top is down");
    EXPECT(back[1] - front[1] < back[2] - front[2] - 3.0, "the notch is deeper than the shelf");
    park(device, 180.0f, 0.0f);
    Stereo plain = run(device, sine(7500.0f, 0.3f, kRate, 0.5f));
    EXPECT_NEAR(db(tone_level(plain.left, 7500.0, kRate, 4800, 14400) / 0.5), 0.0, 0.2,
                "Head 0: behind is not coloured");
  }

  // Radius 0 is the input whatever Head says (and so with Head 0), on a
  // stereo input; Mix 0 is the input bit for bit at any setting.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> left = noise(1.0f, kRate, 0.5f);
    std::vector<float> right = noise(1.0f, kRate, 0.5f);
    Stereo in{left, right};
    for (float head : {0.0f, 1.0f}) {
      device.init(kRate);
      set(device, {0, 2, 0, head, 1, 40, 0, 1});
      Stereo out = run(device, left, right);
      EXPECT(max_diff(out, in) < 1.0e-6, "Radius 0 with no Blur is the input");
    }
    device.init(kRate);
    set(device, {3, 4, 1, 1, 1, 135, 1, 0});
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // A sound that is all side (left against right) does not vanish: the side
  // is passed as it is and only the middle moves.
  {
    device.init(kRate);
    set(device, kDefault);
    std::vector<float> left = sine(440.0f, 2.0f, kRate, 0.5f);
    std::vector<float> right = left;
    for (float& v : right) v = -v;
    Stereo out = run(device, left, right);
    EXPECT_NEAR(db(rms(out.left) / rms(left)), 0.0, 0.01, "an anti-phase input keeps its level");
    EXPECT(correlation(out.left, out.right) < -0.999, "and stays anti-phase");
  }
}

struct Event {
  size_t at;
  int id;
  float value;
};

// Run with blocks of the sizes in `sizes` (in turn), cut where an event falls.
static Stereo run_events(Around& d, const std::vector<float>& in, const std::vector<int>& sizes,
                         const std::vector<Event>& events) {
  Stereo out;
  out.left.resize(in.size());
  out.right.resize(in.size());
  size_t done = 0, next = 0, which = 0;
  while (done < in.size()) {
    while (next < events.size() && events[next].at <= done) {
      d.set_param(events[next].id, events[next].value);
      ++next;
    }
    size_t frames = std::min(static_cast<size_t>(sizes[which++ % sizes.size()]), in.size() - done);
    if (next < events.size()) frames = std::min(frames, events[next].at - done);
    for (size_t i = 0; i < frames; ++i) {
      d.in_left()[i] = in[done + i];
      d.in_right()[i] = in[done + i];
    }
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// The balance between the ears in windows of 5 ms against the one the path
// gives at that time by the clock: the largest difference.
static double path_error(const Stereo& out, size_t from, size_t to, int path, double rate,
                         double radius, double turn_degrees) {
  const size_t window = 240;
  double worst = 0.0;
  const double turn = turn_degrees * kPi / 180.0;
  for (size_t at = from; at + window <= to; at += window) {
    const double l = rms(out.left, at, at + window), r = rms(out.right, at, at + window);
    if (l + r < 1.0e-6) continue;
    const double heard = (r * r - l * l) / (r * r + l * l);
    const double seconds = (static_cast<double>(at) + 0.5 * window) / kRate;
    float x, y;
    Around::path_point(path, std::fmod(seconds * rate, Around::kPathTurns), &x, &y);
    const double turned = radius * (x * std::cos(turn) + y * std::sin(turn));
    worst = std::max(worst, std::fabs(heard - balance_of(turned)));
  }
  return worst;
}

// That the place moves by the clock.
static void movement() {
  const std::vector<float> tone = sine(1000.0f, 4.0f, kRate, 0.5f);
  const char* names[4] = {"Circle", "Figure of eight", "Pendulum", "Wander"};
  char label[160];

  // On each path the source is where the path's formula has it at Rate
  // turns a second (heard as the balance between the ears, Head 0).
  for (int path = 0; path < 4; ++path) {
    device.init(kRate);
    set(device, {static_cast<float>(path), 1.3f, 1, 0, 0, 0, 0, 1});
    Stereo out = run(device, tone);
    const double error = path_error(out, 0, out.size(), path, 1.3, 1.0, 0.0);
    std::snprintf(label, sizeof label, "%s: the source is where the path has it at Rate (off by %.3f)",
                  names[path], error);
    EXPECT(error < 0.03, label);
    // Another rate, or another path, is told from it.
    const double wrong_rate = path_error(out, 0, out.size(), path, 1.2, 1.0, 0.0);
    const double wrong_path = path_error(out, 0, out.size(), (path + 2) % 4, 1.3, 1.0, 0.0);
    std::snprintf(label, sizeof label, "%s is told from another rate (%.2f) and path (%.2f)",
                  names[path], wrong_rate, wrong_path);
    EXPECT(wrong_rate > 0.3 && wrong_path > 0.15, label);
  }

  // Circle and Figure of eight go across alike but not front to back: half a
  // turn in, the circle is behind the head (the outer ear's notch) and the
  // eight is passing through the middle of it (no colour at all).
  {
    double at_half[2];
    for (int path = 0; path < 2; ++path) {
      device.init(kRate);
      set(device, {static_cast<float>(path), 1, 1, 1, 0, 0, 0, 1});
      Stereo out = run(device, sine(7500.0f, 0.6f, kRate, 0.5f));
      at_half[path] = db(tone_level(out.left, 7500.0, kRate, 24000 - 480, 24000 + 480) / 0.5);
    }
    std::snprintf(label, sizeof label,
                  "half a turn in, 7.5 kHz: Circle %.1f dB (behind), Figure of eight %.1f dB (the middle)",
                  at_half[0], at_half[1]);
    std::printf("note: %s\n", label);
    EXPECT(at_half[0] < -6.0 && std::fabs(at_half[1]) < 0.5, label);
  }

  // Radius scales the path and Turn turns it.
  {
    device.init(kRate);
    set(device, {1, 0.9f, 0.6f, 0, 0, 50, 0, 1});
    Stereo out = run(device, tone);
    const double error = path_error(out, 0, out.size(), 1, 0.9, 0.6, 50.0);
    EXPECT(error < 0.03, "Radius scales the path and Turn turns it");
    EXPECT(path_error(out, 0, out.size(), 1, 0.9, 1.0, 50.0) > 0.15, "another Radius is told");
    EXPECT(path_error(out, 0, out.size(), 1, 0.9, 0.6, 0.0) > 0.15, "another Turn is told");
  }

  // The clock keeps its place through silence, short and long, asleep or
  // not, and the reading for the display is that clock.
  for (float gap : {0.05f, 0.7f, 2.3f, 31.0f}) {
    device.init(kRate);
    set(device, {0, 0.37f, 1, 0, 0, 0, 0, 1});
    std::vector<float> in = sine(1000.0f, 0.5f, kRate, 0.5f);
    const size_t first = in.size();
    in.resize(first + static_cast<size_t>(gap * kRate), 0.0f);
    const size_t second = in.size();
    in.resize(second + 24000);
    for (size_t i = second; i < in.size(); ++i) {
      in[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * 1000.0 * static_cast<double>(i) / kRate));
    }
    Stereo out = run(device, in);
    const double error = path_error(out, second, out.size(), 0, 0.37, 1.0, 0.0);
    std::snprintf(label, sizeof label,
                  "after %.2f s of silence the source is where the clock has it (off by %.3f)", gap,
                  error);
    EXPECT(error < 0.03, label);
    if (gap > 0.5f) {
      EXPECT(peak(out.left, second - 4800, second) == 0.0, "asleep in the silence");
    }
    const double turns = std::fmod(0.37 * static_cast<double>(in.size()) / kRate, Around::kPathTurns);
    EXPECT_NEAR(device.meter(0), turns / Around::kPathTurns, 2.0e-5, "the reading is the clock");
  }
  {
    device.init(kRate);
    set(device, {0, 4, 1, 1, 0, 0, 0, 1});
    render(device, 99.0f, kRate);  // 396 turns: 24 times round the clock and 12 more
    EXPECT_NEAR(device.meter(0), 12.0 / 16.0, 2.0e-5, "the clock wraps at sixteen turns, asleep too");
    render(device, 1.0f / 3.0f, kRate, 2048);
    EXPECT_NEAR(device.meter(0), (12.0 + 4.0 / 3.0) / 16.0, 2.0e-5, "and counts on, whatever the block");
  }

  // The same output at block sizes 1, 128, 2048 and ragged, across two
  // sleeps, with knobs moved while sounding and while asleep.
  {
    std::vector<float> in = sine(330.0f, 0.4f, kRate, 0.5f);
    in.resize(in.size() + 28800, 0.0f);  // 0.6 s: asleep
    const size_t wake = in.size();
    for (int i = 0; i < 19200; ++i) in.push_back(0.4f * static_cast<float>(std::sin(i * 0.05)));
    in.resize(in.size() + 2400, 0.0f);  // 0.05 s: not asleep
    for (int i = 0; i < 14400; ++i) in.push_back(0.4f * static_cast<float>(std::sin(i * 0.11)));
    in.resize(in.size() + 24000, 0.0f);
    const std::vector<Event> events = {
        {5000, p::kRadius, 0.4f},  {9001, p::kPath, 2.0f},       {12345, p::kTurn, -120.0f},
        {30000, p::kHead, 1.0f},   {30000, p::kRadius, 1.0f},    {33333, p::kPath, 3.0f},
        {40000, p::kRate, 3.0f},   {40001, p::kMix, 0.6f},       {41000, p::kBlur, 1.0f},
        {41000, p::kNear, 1.0f},   {wake + 7000, p::kPath, 1.0f}, {wake + 9000, p::kTurn, 170.0f},
        {wake + 20000, p::kRate, 0.5f}};
    Stereo reference;
    const std::vector<std::vector<int>> patterns = {{128}, {1}, {2048}, {1, 7, 64, 128, 33, 512, 2048, 5}};
    for (size_t k = 0; k < patterns.size(); ++k) {
      device.init(kRate);
      set(device, kDefault);
      Stereo out = run_events(device, in, patterns[k], events);
      if (k == 0) {
        reference = out;
        EXPECT(peak(out.left, wake - 4800, wake) == 0.0, "asleep before the second sound");
        continue;
      }
      const double diff = max_diff(out, reference);
      std::snprintf(label, sizeof label,
                    "the same at any block size across sleeps and knob moves (pattern %zu: %g)", k, diff);
      EXPECT(diff < 1.0e-6, label);
    }
  }

  // Knobs moved while asleep are there on the first sample: the same as a
  // device that was set so from the start.
  {
    const Setting later = {2, 0.2f, 1.0f, 1.0f, 0.8f, -75.0f, 0.9f, 0.7f};
    device.init(kRate);
    set(device, kDefault);
    run(device, sine(330.0f, 0.4f, kRate, 0.5f));
    render(device, 0.6f, kRate);
    set(device, later);
    Stereo woken = run(device, sine(330.0f, 0.3f, kRate, 0.5f));
    twin.init(kRate);
    set(twin, later);
    render(twin, 1.0f, kRate);
    Stereo fresh = run(twin, sine(330.0f, 0.3f, kRate, 0.5f));
    const double diff = max_diff(woken, fresh);
    std::snprintf(label, sizeof label, "a knob moved while asleep is there on the first sample (%g)",
                  diff);
    EXPECT(diff < 1.0e-6, label);
  }
}

// The sharpest corner in a signal: the largest second difference. A 50 Hz
// tone at 0.5 has corners of 2e-5; a step of any size shows whole, so this
// sees a click a hundred times smaller than the largest step does.
static double max_corner(const Stereo& out, size_t from) {
  double worst = 0.0;
  for (const std::vector<float>* x : {&out.left, &out.right}) {
    for (size_t i = from + 2; i < x->size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>((*x)[i]) - 2.0 * (*x)[i - 1] + (*x)[i - 2]));
    }
  }
  return worst;
}

// The sharpest corner of a 50 Hz tone through the device when `id` jumps
// from `from` to `to` 0.7 s in, less the sharpest with no jump at either
// value: what the jump adds.
static double click_of(Setting base, int id, float from, float to) {
  const std::vector<float> tone = sine(50.0f, 1.4f, kRate, 0.5f);
  double steady = 0.0;
  for (float value : {from, to}) {
    device.init(kRate);
    set(device, base);
    device.set_param(id, value);
    steady = std::max(steady, max_corner(run(device, tone), 4800));
  }
  device.init(kRate);
  set(device, base);
  device.set_param(id, from);
  return max_corner(run_events(device, tone, {128}, {{33600, id, to}}), 4800) - steady;
}

// The widest a 300 Hz tone is bent in either ear, in cents, from the gaps
// between its upward zero crossings.
static double bend_cents(const Setting& s) {
  device.init(kRate);
  set(device, s);
  Stereo out = run(device, sine(300.0f, 3.0f, kRate, 0.5f));
  double worst = 0.0;
  for (const std::vector<float>* x : {&out.left, &out.right}) {
    double last = -1.0;
    for (size_t i = 4801; i < x->size(); ++i) {
      const float a = (*x)[i - 1], b = (*x)[i];
      if (!(a < 0.0f && b >= 0.0f)) continue;
      const double at = static_cast<double>(i - 1) + static_cast<double>(-a) / (b - a);
      if (last >= 0.0) {
        const double hz = kRate / (at - last);
        worst = std::max(worst, std::fabs(1200.0 * std::log2(hz / 300.0)));
      }
      last = at;
    }
  }
  return worst;
}

// That nothing clicks and the delay's bend is bounded.
static void smoothness() {
  char label[160];
  // A corner no sharper than a step 80 dB under full scale.
  const double kClick = 1.5e-4;  // Mix and Blur add 1.2e-4: the onset of their 5 ms glide
  const Setting base = {0, 0.5f, 1, 1, 0.5f, 0, 0.5f, 1};
  const char* names[4] = {"Circle", "Figure of eight", "Pendulum", "Wander"};

  // Path is a choice: every change from one to another glides.
  double worst_path = -1.0;
  for (int from = 0; from < 4; ++from) {
    for (int to = 0; to < 4; ++to) {
      if (from == to) continue;
      const double added = click_of(base, p::kPath, static_cast<float>(from), static_cast<float>(to));
      worst_path = std::max(worst_path, added);
      std::snprintf(label, sizeof label, "%s to %s does not click (adds %+.6f)", names[from],
                    names[to], added);
      EXPECT(added < kClick, label);
    }
  }

  // Every other control, jumped across its range while sounding.
  struct Jump {
    const char* name;
    int id;
    float from, to;
  };
  const Jump jumps[] = {
      {"Radius up", p::kRadius, 0, 1},     {"Radius down", p::kRadius, 1, 0},
      {"Head up", p::kHead, 0, 1},         {"Head down", p::kHead, 1, 0},
      {"Near up", p::kNear, 0, 1},         {"Near down", p::kNear, 1, 0},
      {"Turn half round", p::kTurn, 0, 180}, {"Turn across the back", p::kTurn, -170, 170},
      {"Turn a quarter", p::kTurn, 0, -90}, {"Blur up", p::kBlur, 0, 1},
      {"Blur down", p::kBlur, 1, 0},       {"Mix up", p::kMix, 0, 1},
      {"Mix down", p::kMix, 1, 0},         {"Rate up", p::kRate, 0.01f, 4},
      {"Rate down", p::kRate, 4, 0.01f}};
  double worst_jump = -1.0;
  for (const Jump& jump : jumps) {
    const double added = click_of(base, jump.id, jump.from, jump.to);
    worst_jump = std::max(worst_jump, added);
    std::snprintf(label, sizeof label, "%s does not click (adds %+.6f)", jump.name, added);
    EXPECT(added < kClick, label);
  }
  std::printf("note: sharpest corner added to a 50 Hz tone at 0.5: %+.6f by a change of Path, %+.6f by "
              "any other jump (a step of -80 dBFS is 0.0001)\n", worst_path, worst_jump);

  // No stairs: the source's movement reaches the ears as straight lines
  // between the control clock's ticks, not as steps at them. A 50 Hz tone
  // going round at the fastest Rate keeps corners as small as its own.
  {
    device.init(kRate);
    set(device, {0, 4, 1, 1, 1, 0, 0, 1});
    const double moving = max_corner(run(device, sine(50.0f, 1.0f, kRate, 0.5f)), 4800);
    std::printf("note: sharpest corner of a 50 Hz tone going round at 4 Hz: %.6f\n", moving);
    EXPECT(moving < kClick, "the movement makes no stairs at the control rate");
  }

  // The far ear's delay bends pitch as the source crosses: bounded at the
  // fastest Rate on every path, and next to nothing at a slow one.
  double fastest = 0.0;
  for (int path = 0; path < 4; ++path) {
    const double cents = bend_cents({static_cast<float>(path), 4, 1, 1, 0, 0, 0, 1});
    fastest = std::max(fastest, cents);
    std::snprintf(label, sizeof label, "%s at the fastest Rate bends pitch by %.1f cents", names[path],
                  cents);
    std::printf("note: %s\n", label);
    EXPECT(cents < 50.0, label);
  }
  EXPECT(fastest > 15.0, "the bend is there to be measured");
  const double slow = bend_cents({2, 0.2f, 1, 1, 0, 0, 0, 1});
  std::printf("note: Pendulum at 0.2 Hz bends pitch by %.2f cents\n", slow);
  EXPECT(slow < 3.0, "at a slow Rate the bend is under three cents");
  EXPECT(bend_cents({0, 4, 1, 0, 0, 0, 0, 1}) < 0.5, "Head 0 bends nothing");
}

struct Preset {
  const char* name;
  Setting s;
};

// The presets of device.json, in its order (kept by hand: the level checks
// below run through every one).
static const Preset kPresets[] = {
    {"Slow circle", {0, 0.2f, 0.85f, 0.7f, 0.25f, 0, 0.35f, 1}},
    {"Barely moving", {3, 0.03f, 0.4f, 0.5f, 0, 60, 0.2f, 1}},
    {"Gentle sway", {2, 0.07f, 0.7f, 0.6f, 0, 0, 0.35f, 1}},
    {"Wide pendulum", {2, 0.25f, 1, 0.8f, 0, 0, 0.3f, 1}},
    {"Slow eight", {1, 0.15f, 0.9f, 0.7f, 0, 0, 0.3f, 1}},
    {"Slow wander", {3, 0.12f, 0.9f, 0.7f, 0.4f, 0, 0.4f, 1}},
    {"Drone drift", {3, 0.05f, 1, 1, 0.2f, -90, 0.5f, 1}},
    {"Behind you", {2, 0.1f, 0.9f, 1, 0, 180, 0.5f, 1}},
    {"Passing by", {0, 0.1f, 1, 0.9f, 0.6f, 90, 0.3f, 1}},
    {"Far side fades", {0, 0.08f, 1, 0.9f, 1, 0, 0.7f, 1}},
    {"Ear to ear", {2, 1.5f, 1, 0.3f, 0, 0, 0, 1}},
    {"Fast spin", {0, 4, 0.6f, 0.5f, 0, 0, 0.15f, 1}},
    {"Plain pan", {2, 0.5f, 1, 0, 0, 0, 0, 1}},
    {"Mostly room", {0, 0.1f, 0.25f, 0.6f, 0, 0, 1, 1}},
    {"Half stays put", {0, 0.3f, 1, 0.8f, 0, 0, 0.2f, 0.5f}},
    {"Dizzy", {1, 2.7f, 1, 1, 0.5f, 90, 0.8f, 1}},
};

// The lowest and highest the two ears' summed power goes against the input,
// in dB, for held tones over the piano range (every whole tone from A0 to
// C8) while the source goes once round its path. The path is run at 0.5 Hz
// whatever the setting says: the places are what matter here, not the speed.
static float low_hz = 0.0f;
static double low_seconds = 0.0;
static void power_range(Setting s, double* lowest, double* highest, double* lowest_ear) {
  s.rate = 0.5f;
  *lowest = 1.0e9;
  *highest = -1.0e9;
  *lowest_ear = 1.0e9;
  const double turns = static_cast<int>(s.path) == Around::kWander ? 4.0 : 1.0;
  for (int note = 21; note <= 108; note += 2) {
    const float hz = 440.0f * std::pow(2.0f, static_cast<float>(note - 69) / 12.0f);
    device.init(kRate);
    set(device, s);
    Stereo out = run(device, sine(hz, static_cast<float>(turns * 2.0 + 0.3), kRate, 0.5f));
    const size_t window = std::max<size_t>(1920, static_cast<size_t>(3.0f * kRate / hz));
    for (size_t at = 4800; at + window <= out.size(); at += window / 2) {
      const double l = tone_level(out.left, hz, kRate, at, at + window) / 0.5;
      const double r = tone_level(out.right, hz, kRate, at, at + window) / 0.5;
      const double both = db(std::sqrt(0.5 * (l * l + r * r)));
      if (both < *lowest) {
        low_hz = hz;
        low_seconds = static_cast<double>(at) / kRate;
      }
      *lowest = std::min(*lowest, both);
      *highest = std::max(*highest, both);
      *lowest_ear = std::min(*lowest_ear, db(std::min(l, r)));
    }
  }
}

// That nothing piles up or drops out, and what is left in mono.
static void levels() {
  char label[200];

  // Folded to mono: the sum of the two ears against the input, for a source
  // held every 30 degrees round the head, third-octave tones from 100 Hz to
  // 12.5 kHz, Head 1 and Radius 1 (the worst case for the fold).
  {
    double front_low = 0.0, front_high = -99.0, back_low = 0.0;
    for (int turn = -150; turn <= 180; turn += 30) {
      for (int third = 0; third <= 21; ++third) {
        const float hz = 100.0f * std::pow(2.0f, static_cast<float>(third) / 3.0f);
        park(device, static_cast<float>(turn), 1.0f);
        Stereo out = run(device, sine(hz, 0.3f, kRate, 0.5f));
        std::vector<float> sum(out.size());
        for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (out.left[i] + out.right[i]);
        const double mono = db(tone_level(sum, hz, kRate, 4800, 14400) / 0.5);
        if (std::abs(turn) <= 90) {
          front_low = std::min(front_low, mono);
          front_high = std::max(front_high, mono);
        } else {
          back_low = std::min(back_low, mono);
        }
      }
    }
    std::printf("note: mono sum against the input, Head 1, Radius 1: %.1f to %+.1f dB with the source "
                "in front or at a side, down to %.1f dB behind (the outer ear's notch)\n",
                front_low, front_high, back_low);
    EXPECT(front_low > -6.0 && front_high < 0.5, "the mono sum has no hole: within 6 dB in front");
    EXPECT(back_low > -9.0, "the mono sum behind is no lower than the notch");
  }

  // Part-way Mix does not cancel the sound: at the default with Mix a half,
  // the two ears' power stays near the input for every held note and place.
  {
    Setting half = kDefault;
    half.mix = 0.5f;
    double low, high, ear;
    power_range(half, &low, &high, &ear);
    std::printf("note: default at Mix 0.5, tones A0 to C8 round the path: both ears %.2f to %+.2f dB "
                "of the input (lowest at %.0f Hz, %.2f s in), the quieter ear down to %.1f dB\n",
                low, high, low_hz, low_seconds, ear);
    EXPECT(low > -3.8 && high < 1.5, "Mix 0.5 keeps the level of every held note");
    half.head = 1.0f;
    half.radius = 1.0f;
    half.near = 0.0f;
    power_range(half, &low, &high, &ear);
    std::printf("note: Head 1, Radius 1 at Mix 0.5: both ears %.2f to %+.2f dB, the quieter ear %.1f dB\n",
                low, high, ear);
    EXPECT(low > -2.8 && high < 1.5, "Mix 0.5 with all of the head keeps the level too");
  }

  // Every preset over the same notes: the power never falls further than
  // Near and the colour from behind take it by design, and never rises.
  for (const Preset& preset : kPresets) {
    double low, high, ear;
    power_range(preset.s, &low, &high, &ear);
    // By design: Near takes up to kNearDb at the far side of the path (and up
    // to 4.5 dB more of the bass), the colour from behind 1 dB, the shadow on
    // the far ear 1.5 dB of the two ears' power, the room's comb 3 dB either
    // way at Blur 1.
    const double by_design =
        -(preset.s.near * preset.s.radius * (Around::kNearDb + 4.5) + 1.0 +
          1.5 * preset.s.head * preset.s.radius + 3.0 * preset.s.blur * preset.s.mix);
    const double over = 0.5 + 3.5 * preset.s.blur * preset.s.mix;
    std::snprintf(label, sizeof label,
                  "%s: held notes stay within %.1f and %+.1f dB (%.2f at %.0f Hz, to %+.2f)", preset.name,
                  by_design, over, low, low_hz, high);
    std::printf("note: %s\n", label);
    EXPECT(low > by_design && high < over, label);
  }

  // A full-scale held chord for a minute at every preset and at both ends of
  // every control: never more than 6 dB over the input, and no louder in
  // the second half minute than in the first (there is no feedback).
  {
    std::vector<float> chord(static_cast<size_t>(60.0f * kRate));
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      chord[i] = static_cast<float>((std::sin(2.0 * kPi * 220.0 * t) + std::sin(2.0 * kPi * 277.18 * t) +
                                     std::sin(2.0 * kPi * 329.63 * t)) / 3.0);
    }
    const double in_peak = peak(chord);
    std::vector<Preset> settings(std::begin(kPresets), std::end(kPresets));
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        Setting s = kDefault;
        s.rate = 1.0f;
        float* fields[] = {&s.path, &s.rate, &s.radius, &s.head, &s.near, &s.turn, &s.blur, &s.mix};
        *fields[id] = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
        settings.push_back({end == 0 ? "a control at its least" : "a control at its most", s});
      }
    }
    settings.push_back({"everything up", {3, 4, 1, 1, 1, 180, 1, 1}});
    settings.push_back({"everything up, Circle", {0, 4, 1, 1, 0, 180, 1, 1}});
    double loudest = 0.0;
    for (const Preset& preset : settings) {
      device.init(kRate);
      set(device, preset.s);
      Stereo out = run(device, chord);
      const size_t half = chord.size() / 2;
      const double first = std::max(peak(out.left, 0, half), peak(out.right, 0, half));
      const double second = std::max(peak(out.left, half), peak(out.right, half));
      loudest = std::max(loudest, std::max(first, second));
      std::snprintf(label, sizeof label, "%s: a full-scale chord peaks %+.2f dB over itself", preset.name,
                    db(std::max(first, second) / in_peak));
      EXPECT(finite(out.left) && finite(out.right) && std::max(first, second) < 2.0 * in_peak, label);
      if (preset.s.rate >= 0.1f) {
        std::snprintf(label, sizeof label, "%s: no louder in the second half minute (%.3f then %.3f)",
                      preset.name, first, second);
        EXPECT(second < first * 1.02, label);
      }
    }
    std::printf("note: a full-scale held chord for a minute, every preset and control end: at most "
                "%+.2f dB over the input\n", db(loudest / in_peak));
  }

  // Near: opposite the near point the source is 12 dB down and thinner in
  // the bass; at the near point it is as it came in.
  {
    double at_back[2], at_front[2];
    const float tones[2] = {1000.0f, 100.0f};
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      set(device, {0, 0.5f, 1, 0, 1, 0, 0, 1});
      Stereo out = run(device, sine(tones[k], 2.2f, kRate, 0.5f));
      // Half a turn is at 1 s, a whole one at 2 s.
      auto both = [&](size_t at) {
        const double l = tone_level(out.left, tones[k], kRate, at - 1440, at + 1440) / 0.5;
        const double r = tone_level(out.right, tones[k], kRate, at - 1440, at + 1440) / 0.5;
        return db(std::sqrt(0.5 * (l * l + r * r)));
      };
      at_back[k] = both(48000);
      at_front[k] = both(96000);
    }
    std::printf("note: Near 1, opposite the near point: %.2f dB at 1 kHz, %.2f dB at 100 Hz; at the near "
                "point %+.2f dB\n", at_back[0], at_back[1], at_front[0]);
    EXPECT_NEAR(at_back[0], -Around::kNearDb, 0.5, "Near 1: 12 dB down opposite the near point");
    EXPECT_NEAR(at_back[1] - at_back[0], -4.5, 1.0, "and thinner in the bass by 4.5 dB more");
    EXPECT_NEAR(at_front[0], 0.0, 0.2, "at the near point the source is as it came in");
    EXPECT_NEAR(at_front[1], 0.0, 0.2, "bass too");
  }

  // Blur: a room of eight echoes that stands still: between 7 and 38 ms,
  // different in each ear, 10 dB under the sound at most, and in step with
  // the knob. (Radius 0 leaves the source alone, so out − in is the room.)
  {
    device.init(kRate);
    set(device, {0, 0.2f, 0, 0.7f, 0, 0, 1, 1});
    std::vector<float> click(9600, 0.0f);
    click[0] = 1.0f;
    Stereo out = run(device, click);
    EXPECT(peak(out.left, 1, 300) < 1.0e-6 && peak(out.right, 1, 300) < 1.0e-6,
           "no echo before 7 ms");
    EXPECT(peak(out.left, 340, 1700) > 0.02 && peak(out.right, 400, 1900) > 0.02, "echoes from 7 ms");
    EXPECT(peak(out.left, 1920) < 1.0e-3 && peak(out.right, 1920) < 1.0e-3, "60 dB down after 40 ms");
    EXPECT(peak(out.left, 2880) < 1.0e-7 && peak(out.right, 2880) < 1.0e-7, "gone after 60 ms");
    double level[2];
    const float amounts[2] = {1.0f, 0.5f};
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      set(device, {0, 0.2f, 0, 0.7f, 0, 0, amounts[k], 1});
      std::vector<float> hiss = phrase(1.0f);
      Stereo wet = run(device, hiss);
      for (size_t i = 0; i < hiss.size(); ++i) {
        wet.left[i] -= hiss[i];
        wet.right[i] -= hiss[i];
      }
      level[k] = db(rms(wet.left, 4800) / rms(hiss, 4800));
      if (k == 0) {
        std::printf("note: Blur 1 on a played phrase: the room is %.1f dB under it, left and right correlate %.2f\n",
                    level[0], correlation(wet.left, wet.right, 4800));
        EXPECT(std::fabs(correlation(wet.left, wet.right, 4800)) < 0.3, "the room differs in each ear");
      }
    }
    EXPECT(level[0] > -14.0 && level[0] < -9.0, "Blur 1: the room is 9 to 14 dB under a played phrase");
    EXPECT_NEAR(level[0] - level[1], 6.02, 0.1, "Blur scales the room");
  }
}

// A played phrase: four notes, each struck and dying, with a little breath.
static std::vector<float> phrase(float seconds) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  const float notes[4] = {220.0f, 329.63f, 440.0f, 659.26f};
  rng_state() = 0x51DEu;
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    const int which = static_cast<int>(t / 0.25);
    const double since = t - 0.25 * which;
    const double hz = notes[which % 4];
    out[i] = static_cast<float>(0.4 * std::exp(-since * 6.0) *
                                (std::sin(2.0 * kPi * hz * t) + 0.3 * std::sin(2.0 * kPi * 3.0 * hz * t))) +
             0.01f * white();
  }
  return out;
}

static void rest() {
  char label[200];
  const char* names[] = {"Path", "Rate", "Radius", "Head", "Near", "Turn", "Blur", "Mix"};

  // Not a number, infinity and absurd samples: the output stays finite, and
  // 50 ms after the last of them it is what a device that got silence in
  // their place puts out.
  {
    std::vector<float> good = sine(440.0f, 1.0f, kRate, 0.5f);
    std::vector<float> bad = good, quiet = good;
    const float poison[4] = {std::nanf(""), INFINITY, 1.0e30f, -INFINITY};
    for (size_t i = 9600; i < 9664; ++i) {
      bad[i] = poison[i % 4];
      quiet[i] = 0.0f;
    }
    device.init(kRate);
    set(device, {0, 2, 1, 1, 1, 0, 1, 1});
    Stereo hurt = run(device, bad, good);
    twin.init(kRate);
    set(twin, {0, 2, 1, 1, 1, 0, 1, 1});
    Stereo well = run(twin, quiet, good);
    EXPECT(finite(hurt.left) && finite(hurt.right), "bad samples in: finite out");
    EXPECT(peak(hurt.left) < 2.0 * Around::kInputCeiling, "bad samples in: bounded out");
    const double diff = max_diff(hurt, well, 9664 + 2400);
    std::snprintf(label, sizeof label, "50 ms after bad samples the output is as if they never came (%g)",
                  diff);
    EXPECT(diff < 1.0e-5, label);
    EXPECT(rms(hurt.left, 24000) > 0.05, "and it is sounding");
  }

  // After any control is moved while sounding the device still comes to
  // rest: exact silence 0.2 s after the input stops.
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    set(device, kDefault);
    run(device, sine(330.0f, 0.3f, kRate, 0.5f));
    device.set_param(id, p::kParamMax[id]);
    run(device, sine(330.0f, 0.1f, kRate, 0.5f));
    device.set_param(id, p::kParamMin[id]);
    run(device, sine(330.0f, 0.05f, kRate, 0.5f));
    device.set_param(id, 0.5f * (p::kParamMin[id] + p::kParamMax[id]) + 0.123f);
    render(device, 0.2f, kRate);
    Stereo after = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label, "at rest after %s was moved while sounding", names[id]);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
  }

  // No dead part of a knob: on a played phrase, each third of every
  // control's travel changes the output by more than 1 % of it.
  {
    const std::vector<float> played = phrase(3.0f);
    for (int id = 0; id < p::kNumParams; ++id) {
      Stereo last;
      double least = 1.0e9;
      for (int step = 0; step <= 3; ++step) {
        const float t = static_cast<float>(step) / 3.0f;
        float value = p::kParamMin[id] + t * (p::kParamMax[id] - p::kParamMin[id]);
        if (id == p::kRate) value = p::kParamMin[id] * std::pow(p::kParamMax[id] / p::kParamMin[id], t);
        device.init(kRate);
        set(device, kDefault);
        device.set_param(id, value);
        Stereo out = run(device, played);
        if (step > 0) {
          double difference = 0.0, size = 0.0;
          for (size_t i = 0; i < out.size(); ++i) {
            const double dl = static_cast<double>(out.left[i]) - last.left[i];
            const double dr = static_cast<double>(out.right[i]) - last.right[i];
            difference += dl * dl + dr * dr;
            size += static_cast<double>(out.left[i]) * out.left[i] +
                    static_cast<double>(out.right[i]) * out.right[i];
          }
          least = std::min(least, std::sqrt(difference / std::max(size, 1.0e-12)));
        }
        last = out;
      }
      std::snprintf(label, sizeof label, "%s does something over each third of its travel (least %.3f)",
                    names[id], least);
      std::printf("note: %s\n", label);
      EXPECT(least > 0.01, label);
    }
  }
}
