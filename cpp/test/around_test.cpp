// Native harness for Around (cpp/devices/around). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a source moving round a head: what each ear
// gets from a source at a known place, that the place moves by the clock on
// each path, that nothing clicks or piles up, and what is left in mono.

#include "../devices/around/around.h"
#include "support/test_kit.h"

#include <algorithm>
#include <complex>
#include <cstdlib>

using namespace testkit;
using livemix::Around;
namespace p = livemix::around;

static Around device;
static Around twin;

static const float kRate = 48000.0f;

struct Setting {
  float path, rate, radius, head, near, turn, blur, mix;
  float direction = 0;
};

static void set(Around& d, const Setting& s) {
  d.set_param(p::kPath, s.path);
  d.set_param(p::kRate, s.rate);
  d.set_param(p::kDirection, s.direction);
  d.set_param(p::kRadius, s.radius);
  d.set_param(p::kHead, s.head);
  d.set_param(p::kNear, s.near);
  d.set_param(p::kTurn, s.turn);
  d.set_param(p::kBlur, s.blur);
  d.set_param(p::kMix, s.mix);
}

static const Setting kDefault = {0, 0.2f, 0.85f, 0.7f, 0.25f, 0, 0.35f, 1};

// The field of a setting a control's id stands for, and the control's name:
// by key, so the order of the controls in device.json has no say in either.
static float& field_of(Setting& s, int id) {
  switch (id) {
    case p::kPath: return s.path;
    case p::kRate: return s.rate;
    case p::kRadius: return s.radius;
    case p::kHead: return s.head;
    case p::kNear: return s.near;
    case p::kTurn: return s.turn;
    case p::kBlur: return s.blur;
    case p::kMix: return s.mix;
    case p::kDirection: return s.direction;
  }
  std::abort();
}

static const char* name_of(int id) {
  switch (id) {
    case p::kPath: return "Path";
    case p::kRate: return "Rate";
    case p::kRadius: return "Radius";
    case p::kHead: return "Head";
    case p::kNear: return "Near";
    case p::kTurn: return "Turn";
    case p::kBlur: return "Blur";
    case p::kMix: return "Mix";
    case p::kDirection: return "Direction";
  }
  std::abort();
}

static size_t peak_index(const std::vector<float>& x) {
  size_t best = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
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

// A source held at `turn` degrees (a Circle at its start, turned there): the
// two ears' impulse responses. The slowest Rate moves it by under a hundredth
// of a degree while a response lasts.
static Stereo held(float turn, float head, float rate = kRate, float radius = 1.0f, float near = 0.0f) {
  device.init(rate);
  set(device, {0, 0.01f, radius, head, near, turn, 0, 1});
  return run(device, impulse(0.2f, rate));
}

// What a response does to a tone at `hz`: its gain and its turn of phase.
static std::complex<double> at_hz(const std::vector<float>& x, double hz, double rate = kRate) {
  std::complex<double> sum = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    sum += static_cast<double>(x[i]) * std::polar(1.0, -2.0 * kPi * hz * static_cast<double>(i) / rate);
  }
  return sum;
}

// What each ear gets from a source at a known place.
static void cues() {
  // A source at the right (90°): the left ear's bass is later by kItdSeconds,
  // the lateness fading out as the pitch rises; it is 12 dB lower in the bass
  // and 27 on top; the mirror at the left.
  for (int side = 0; side < 2; ++side) {
    const float turn = side == 0 ? 90.0f : -90.0f;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      Stereo out = held(turn, 1.0f, rate);
      const std::vector<float>& near = side == 0 ? out.right : out.left;
      const std::vector<float>& far = side == 0 ? out.left : out.right;
      auto late = [&](double hz) {
        return std::arg(at_hz(near, hz, rate) / at_hz(far, hz, rate)) / (2.0 * kPi * hz);
      };
      auto apart = [&](double hz) { return db(std::abs(at_hz(near, hz, rate) / at_hz(far, hz, rate))); };
      if (side == 0 && rate == 48000.0f) {
        std::printf("note: source at the right, Head 1: the far ear is %.3f ms late at 40 Hz, %.3f at "
                    "100, %.3f at 200, %.3f at 500, %.3f at 1 kHz, %.3f at 4 kHz\n",
                    late(40) * 1e3, late(100) * 1e3, late(200) * 1e3, late(500) * 1e3, late(1000) * 1e3,
                    late(4000) * 1e3);
        std::printf("note: and under the near ear by %.1f dB at 30 Hz, %.1f at 250, %.1f at 1 kHz, "
                    "%.1f at 8 kHz; near ear %+.2f dB at 30 Hz, %+.2f at 8 kHz\n",
                    apart(30), apart(250), apart(1000), apart(8000), db(std::abs(at_hz(near, 30, rate))),
                    db(std::abs(at_hz(near, 8000, rate))));
      }
      EXPECT_NEAR(late(40.0), Around::kItdSeconds, 0.00003, "the far ear's bass is 0.66 ms late");
      EXPECT_NEAR(late(200.0), 0.000485, 0.00002, "and 0.49 ms late at 200 Hz");
      EXPECT_NEAR(late(500.0), 0.000247, 0.00002, "0.25 ms at 500 Hz");
      EXPECT(late(4000.0) < 0.00002 && late(4000.0) > 0.0, "the lateness has faded out by 4 kHz");
      EXPECT_NEAR(apart(30.0), 12.1, 0.2, "the far ear is 12 dB lower in the bass");
      EXPECT_NEAR(apart(8000.0), 27.0, 0.5, "and 27 dB lower on top");
      EXPECT_NEAR(db(std::abs(at_hz(near, 30.0, rate))), 2.75, 0.15,
                  "the near ear is 2.75 dB up in the bass: the ears keep their summed power");
      EXPECT_NEAR(db(std::abs(at_hz(near, 8000.0, rate))), 4.31, 0.15,
                  "the near ear's top is up by what the far ear's lost");
      // No comb: going up in pitch the far ear only ever falls against the
      // near one, and the two are never far enough apart in phase to cancel.
      double before = 0.0, rise = 0.0, widest = 0.0;
      for (double hz = 30.0; hz < 16000.0; hz *= 1.02) {
        const double now = -apart(hz);
        if (hz > 30.0) rise = std::max(rise, now - before);
        before = now;
        widest = std::max(widest, std::fabs(late(hz) * 360.0 * hz));
      }
      EXPECT(rise < 0.01, "the far ear has no comb: it only falls as the pitch rises");
      EXPECT(widest < 50.0, "the ears are never 50 degrees apart in phase");
    }
    {
      // The lateness is the shadow's own lag, not a delay: a click's edge is
      // in both ears at once.
      device.init(kRate);
      set(device, {0, 0.01f, 1, 1, 0, turn, 0, 1});
      std::vector<float> click(4800, 0.0f);
      click[100] = 1.0f;
      Stereo out = run(device, click);
      EXPECT(peak_index(out.left) == 100 && peak_index(out.right) == 100,
             "a click's edge is in both ears at once");
    }
  }

  // Head 0 is plain panning: no lateness, no shadow, no colour.
  {
    Stereo out = held(90.0f, 0.0f);
    const double l100 = db(std::abs(at_hz(out.left, 100))), r100 = db(std::abs(at_hz(out.right, 100)));
    const double l8k = db(std::abs(at_hz(out.left, 8000)));
    EXPECT_NEAR(r100 - l100, 12.04, 0.05, "Head 0: the level difference stays");
    EXPECT_NEAR(l100 - l8k, 0.0, 0.01, "Head 0: the far ear is not duller");
    EXPECT(std::fabs(std::arg(at_hz(out.right, 200) / at_hz(out.left, 200))) < 1.0e-4,
           "Head 0: neither ear is late");
    Stereo back = held(180.0f, 0.0f);
    EXPECT_NEAR(db(std::abs(at_hz(back.left, 7500))), 0.0, 0.01, "Head 0: behind is not coloured");
  }

  // Front and back differ by colour alone: in front both ears gain a little
  // top over 5 kHz and a narrow band at 7.5 kHz, behind they lose the same;
  // the bass is the same.
  {
    Stereo front = held(0.0f, 1.0f), back = held(180.0f, 1.0f);
    auto level = [](const Stereo& s, double hz) { return db(std::abs(at_hz(s.left, hz))); };
    std::printf("note: Head 1, in front %+.2f dB at 7.5 kHz and %+.2f at 12 kHz, behind %+.2f and "
                "%+.2f; behind against in front %+.2f dB at 250 Hz, %+.2f at 3 kHz\n",
                level(front, 7500), level(front, 12000), level(back, 7500), level(back, 12000),
                level(back, 250) - level(front, 250), level(back, 3000) - level(front, 3000));
    EXPECT_NEAR(level(back, 250) - level(front, 250), 0.0, 0.05, "behind: the bass is as in front");
    EXPECT_NEAR(level(back, 7500) - level(front, 7500), -4.84, 0.4, "behind: 4.8 dB less at 7.5 kHz");
    EXPECT_NEAR(level(back, 12000) - level(front, 12000), -1.83, 0.3, "behind: the top is 1.8 dB down");
    EXPECT(level(back, 7500) > -3.0 && level(front, 7500) < 3.0,
           "neither is more than 3 dB from the input");
    EXPECT(std::fabs(level(front, 7500) - db(std::abs(at_hz(front.right, 7500)))) < 1.0e-3,
           "both ears are coloured alike");
  }

  // Folded to mono there is no hole anywhere round the head: every 15
  // degrees at Head 1 and Radius 1 (the most there is of every cue), the sum
  // of the two ears from 100 Hz to 12 kHz stays within 3 dB of the input, and
  // at the full sides, where there is no colour, it is flat.
  {
    double lowest = 0.0, highest = 0.0;
    for (int turn = -165; turn <= 180; turn += 15) {
      Stereo out = held(static_cast<float>(turn), 1.0f);
      std::vector<float> sum(4096);
      for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (out.left[i] + out.right[i]);
      double low = 99.0, high = -99.0;
      for (double hz = 100.0; hz <= 12000.0; hz *= 1.0293) {
        const double mono = db(std::abs(at_hz(sum, hz)));
        low = std::min(low, mono);
        high = std::max(high, mono);
      }
      lowest = std::min(lowest, low);
      highest = std::max(highest, high);
      if (turn == 90 || turn == -90) {
        EXPECT(high - low < 0.05, "at the full side the mono sum is flat");
        EXPECT_NEAR(low, -1.34, 0.05, "and 1.3 dB under the input");
      }
    }
    std::printf("note: mono sum against the input, every 15 degrees, Head 1, Radius 1, 100 Hz to "
                "12 kHz: %+.2f to %+.2f dB\n", lowest, highest);
    EXPECT(lowest > -3.0 && highest < 3.0, "the mono sum is within 3 dB of the input all the way round");
  }

  // Radius 0 is the input whatever Head and Near say, on a stereo input;
  // Mix 0 is the input bit for bit at any setting.
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

    // A stereo sound moves whole: each ear hears its own channel, so two
    // unlike channels lean as far as a mono sound does, and neither channel
    // is folded into the other.
    device.init(kRate);
    set(device, {0, 0.01f, 0.85f, 0.7f, 0, 90, 0, 1});
    Stereo wide = run(device, left, right);
    const double lean = db(rms(wide.right) / rms(wide.left));
    device.init(kRate);
    set(device, {0, 0.01f, 0.85f, 0.7f, 0, 90, 0, 1});
    Stereo narrow = run(device, left, left);
    std::printf("note: source at the right, defaults: a wide stereo noise leans %.1f dB to the right, "
                "the same noise in mono %.1f dB\n", lean, db(rms(narrow.right) / rms(narrow.left)));
    EXPECT_NEAR(lean, db(rms(narrow.right) / rms(narrow.left)), 0.3,
                "a wide stereo sound leans as far as a mono one");
    EXPECT(lean > 12.0, "and that is more than 12 dB at the defaults");
    EXPECT(correlation(wide.left, left) > 0.97 && std::fabs(correlation(wide.left, right)) < 0.05,
           "the left ear hears the left channel alone");
    EXPECT(correlation(wide.right, right) > 0.97 && std::fabs(correlation(wide.right, left)) < 0.05,
           "the right ear hears the right channel alone");
  }

  // A sound that is all side (left against right) is not lost: each ear gets
  // what it would of the same sound in mono, the right ear's turned over.
  {
    std::vector<float> left = sine(440.0f, 2.0f, kRate, 0.5f);
    std::vector<float> right = left;
    for (float& v : right) v = -v;
    device.init(kRate);
    set(device, {0, 0.2f, 0.85f, 0.7f, 0.25f, 0, 0, 1});
    Stereo out = run(device, left, right);
    device.init(kRate);
    set(device, {0, 0.2f, 0.85f, 0.7f, 0.25f, 0, 0, 1});
    Stereo mono = run(device, left, left);
    for (float& v : mono.right) v = -v;
    EXPECT(max_diff(out, mono) < 1.0e-7, "an anti-phase input gets what a mono one gets, an ear at a time");
    EXPECT(rms(out.left) > 0.1 && rms(out.right) > 0.1, "and it is there in both ears");
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
  // turn in, the circle is behind the head (duller at 7.5 kHz) and the eight
  // is passing through the middle of it (no colour at all).
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
    EXPECT(at_half[0] < -2.0 && at_half[0] > -3.0 && std::fabs(at_half[1]) < 0.3, label);
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

  // Direction is which way the clock runs: Anticlockwise goes by the left
  // first, and a change while sounding turns the source back from where it
  // is: it slows, stops and returns over kGlideSeconds (0.03 s, in which it
  // gets nowhere), and the reading comes back down as it went up.
  {
    device.init(kRate);
    set(device, {0, 1.3f, 1, 0, 0, 0, 0, 1, 1});
    Stereo out = run(device, tone);
    const double error = path_error(out, 0, out.size(), 0, -1.3, 1.0, 0.0);
    std::snprintf(label, sizeof label, "Anticlockwise: the circle runs the other way (off by %.3f)", error);
    EXPECT(error < 0.03, label);
    EXPECT(path_error(out, 0, out.size(), 0, 1.3, 1.0, 0.0) > 0.3, "and is told from Clockwise");
    for (int path = 1; path < 4; ++path) {
      device.init(kRate);
      set(device, {static_cast<float>(path), 0.9f, 1, 0, 0, 0, 0, 1, 1});
      Stereo back = run(device, tone);
      EXPECT(path_error(back, 0, back.size(), path, -0.9, 1.0, 0.0) < 0.03,
             "Anticlockwise runs every path backwards");
    }
    device.init(kRate);
    set(device, {0, 0.5f, 1, 0, 0, 0, 0, 1});
    run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
    EXPECT_NEAR(device.meter(0), 0.5 / 16.0, 1.0e-6, "a second clockwise at half a turn a second");
    device.set_param(p::kDirection, 1.0f);
    run(device, sine(1000.0f, 0.75f, kRate, 0.5f));
    EXPECT_NEAR(device.meter(0), (0.5 - 0.5 * (0.75 - 0.03)) / 16.0, 1.0e-6, "then back the way it came");
    render(device, 0.5f, kRate);
    EXPECT_NEAR(device.meter(0), (16.0 + 0.14 - 0.25) / 16.0, 1.0e-6, "and back past the start, asleep too");
  }

  // Wander is a fixed walk, the same on every load, that comes round after
  // sixteen turns and is not heard as a shorter pattern: at no lag from half
  // a turn to fifteen and a half is the walk more than three quarters like
  // itself; it spends half its time behind and half to the right.
  {
    const int count = 8192;
    std::vector<float> xs(count), ys(count);
    double energy = 0.0, behind = 0.0, to_right = 0.0;
    for (int i = 0; i < count; ++i) {
      Around::path_point(Around::kWander, Around::kPathTurns * i / count, &xs[i], &ys[i]);
      energy += xs[i] * xs[i] + ys[i] * ys[i];
      behind += ys[i] < 0.0f ? 1.0 : 0.0;
      to_right += xs[i] > 0.0f ? 1.0 : 0.0;
    }
    double most = -1.0, most_lag = 0.0;
    for (int lag = count / 32; lag <= count - count / 32; ++lag) {
      double like = 0.0;
      for (int i = 0; i < count; ++i) {
        const int j = (i + lag) % count;
        like += xs[i] * xs[j] + ys[i] * ys[j];
      }
      if (like / energy > most) {
        most = like / energy;
        most_lag = Around::kPathTurns * lag / count;
      }
    }
    std::printf("note: Wander is most like itself %.2f turns later: %.2f of the way (1 is a repeat)\n",
                most_lag, most);
    EXPECT(most < 0.75, "Wander has no pattern shorter than its sixteen turns");
    EXPECT_NEAR(behind / count, 0.5, 0.03, "Wander is behind half the time");
    EXPECT_NEAR(to_right / count, 0.5, 0.03, "and to the right half the time");
    float x0, y0, x1, y1;
    Around::path_point(Around::kWander, 3.21, &x0, &y0);
    Around::path_point(Around::kWander, 3.21 + Around::kPathTurns, &x1, &y1);
    EXPECT(std::fabs(x0 - x1) < 1.0e-4f && std::fabs(y0 - y1) < 1.0e-4f, "and repeats after sixteen");
    // The same on every load, and never moved by the sound: two devices, one
    // fed a loud noise and one a quiet tone, are at the same place after.
    device.init(kRate);
    twin.init(kRate);
    set(device, {3, 1.7f, 1, 1, 0.5f, 0, 0.5f, 1});
    set(twin, {3, 1.7f, 1, 1, 0.5f, 0, 0.5f, 1});
    rng_state() = 0xF00Du;
    run(device, noise(3.0f, kRate, 0.9f));
    run(twin, sine(100.0f, 3.0f, kRate, 0.01f));
    EXPECT(device.meter(0) == twin.meter(0), "the sound does not move the clock");
    EXPECT_NEAR(device.meter(0), 1.7 * 3.0 / 16.0, 1.0e-6, "which is where Rate has it");
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
    std::vector<Event> events = {
        {5000, p::kRadius, 0.4f},  {9001, p::kPath, 2.0f},       {12345, p::kTurn, -120.0f},
        {30000, p::kHead, 1.0f},   {30000, p::kRadius, 1.0f},    {33333, p::kPath, 3.0f},
        {40000, p::kRate, 3.0f},   {40001, p::kMix, 0.6f},       {41000, p::kBlur, 1.0f},
        {41000, p::kNear, 1.0f},   {wake + 7000, p::kPath, 1.0f}, {wake + 9000, p::kTurn, 170.0f},
        {wake + 20000, p::kRate, 0.5f}, {20000, p::kDirection, 1.0f},
        {wake - 9000, p::kDirection, 0.0f}, {wake + 12000, p::kDirection, 1.0f}};
    std::stable_sort(events.begin(), events.end(),
                     [](const Event& a, const Event& b) { return a.at < b.at; });
    Stereo reference;
    const std::vector<std::vector<int>> patterns = {
        {128}, {1}, {32}, {512}, {2048}, {1, 7, 64, 128, 33, 512, 2048, 5}};
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
      // To the bit: the clock counts a sample at a time asleep as awake.
      EXPECT(diff == 0.0, label);
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

// The widest a tone is bent in either ear, in cents, from the gaps between
// its upward zero crossings.
static double bend_cents(const Setting& s, float tone_hz = 300.0f) {
  device.init(kRate);
  set(device, s);
  Stereo out = run(device, sine(tone_hz, 3.0f, kRate, 0.5f));
  double worst = 0.0;
  for (const std::vector<float>* x : {&out.left, &out.right}) {
    double last = -1.0;
    for (size_t i = 4801; i < x->size(); ++i) {
      const float a = (*x)[i - 1], b = (*x)[i];
      if (!(a < 0.0f && b >= 0.0f)) continue;
      const double at = static_cast<double>(i - 1) + static_cast<double>(-a) / (b - a);
      if (last >= 0.0) {
        const double hz = kRate / (at - last);
        worst = std::max(worst, std::fabs(1200.0 * std::log2(hz / tone_hz)));
      }
      last = at;
    }
  }
  return worst;
}

// That nothing clicks and the pitch is not bent.
static void smoothness() {
  char label[160];
  // A corner no sharper than a step 80 dB under full scale.
  // Mix and Blur add up to 1.6e-4: the onset of the house 5 ms glide, on a
  // wet sound a few dB from the dry.
  const double kClick = 2.0e-4;
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
      {"Rate down", p::kRate, 4, 0.01f},     {"Direction over", p::kDirection, 0, 1},
      {"Direction back", p::kDirection, 1, 0}};
  double worst_jump = -1.0;
  for (const Jump& jump : jumps) {
    const double added = click_of(base, jump.id, jump.from, jump.to);
    worst_jump = std::max(worst_jump, added);
    std::snprintf(label, sizeof label, "%s does not click (adds %+.6f)", jump.name, added);
    EXPECT(added < kClick, label);
  }
  std::printf("note: sharpest corner added to a 50 Hz tone at 0.5: %+.6f by a change of Path, %+.6f by "
              "any other jump (a step of -80 dBFS is 0.0001)\n", worst_path, worst_jump);

  // Turned back at the fastest Rate, the source slows, stops and returns:
  // no corner where it turns (a clock that swapped its step at once left
  // one of 4.5e-4 here).
  {
    const Setting fast = {2, 4, 1, 1, 1, 90, 0, 1};
    double worst = 0.0;
    for (int way = 0; way < 2; ++way) {
      for (size_t at : {40000u, 40007u, 43210u}) {
        Stereo quiet, turned;
        for (int k = 0; k < 2; ++k) {
          device.init(kRate);
          set(device, fast);
          device.set_param(p::kDirection, static_cast<float>(way));
          const std::vector<Event> events = {{at, p::kDirection, static_cast<float>(1 - way)}};
          (k == 0 ? quiet : turned) =
              run_events(device, sine(50.0f, 1.4f, kRate, 0.5f), {128}, k == 0 ? std::vector<Event>{} : events);
        }
        worst = std::max(worst, max_corner(turned, 4800) - max_corner(quiet, 4800));
      }
    }
    std::snprintf(label, sizeof label, "turning back at Rate 4 adds no corner (%+.6f)", worst);
    std::printf("note: %s\n", label);
    EXPECT(worst < 1.0e-4, label);
  }

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

  // A lateness that moves bends pitch. The shadow gives way where the path
  // is fast, so that the far ear's lateness never changes by more than ten
  // cents' worth, at any Rate on any path, on a low tone or a middle one.
  double fastest = 0.0;
  for (int path = 0; path < 4; ++path) {
    for (float hz : {60.0f, 150.0f, 300.0f}) {
      const double cents = bend_cents({static_cast<float>(path), 4, 1, 1, 0, 0, 0, 1}, hz);
      fastest = std::max(fastest, cents);
      std::snprintf(label, sizeof label, "%s at the fastest Rate bends a %.0f Hz tone by %.1f cents",
                    names[path], hz, cents);
      EXPECT(cents < 10.0, label);
    }
  }
  std::printf("note: the most any path bends a 60, 150 or 300 Hz tone at Rate 4, Head 1, Radius 1: "
              "%.1f cents\n", fastest);
  EXPECT(fastest > 3.0, "the bend is there to be measured");
  const double at_default = std::max(bend_cents(kDefault, 60.0f), bend_cents(kDefault, 300.0f));
  std::printf("note: the defaults bend pitch by %.2f cents\n", at_default);
  EXPECT(at_default < 1.0, "the defaults bend pitch by under a cent");
  EXPECT(bend_cents({0, 4, 1, 0, 0, 0, 0, 1}) < 0.5, "Head 0 bends nothing");
  // What gives way: a Circle keeps the whole shadow up to 1.7 turns a second
  // and 0.44 of it at 4 (kShadeSpeed over its speed), as the far ear's top
  // against its bass shows.
  {
    auto shadow = [&](float rate) {
      device.init(kRate);
      set(device, {0, rate, 1, 1, 0, 90, 0, 1});
      Stereo out = run(device, impulse(0.05f, kRate));
      return db(std::abs(at_hz(out.left, 8000.0)) / std::abs(at_hz(out.left, 30.0)));
    };
    const double slow = shadow(0.01f), middle = shadow(1.7f), fast = shadow(4.0f);
    std::printf("note: the far ear's top against its bass at the full side: %.1f dB at Rate 0.01, "
                "%.1f at 1.7, %.1f at 4\n", slow, middle, fast);
    EXPECT_NEAR(slow, -13.4, 0.3, "the whole shadow at a slow Rate");
    EXPECT_NEAR(middle, slow, 0.3, "and still at 1.7 turns a second");
    EXPECT_NEAR(fast, db(1.0 - 0.8 * Around::shade_kept(4.0f * Around::kPathSpeed[0], 1.0f)), 0.4,
                "at 4 turns a second 0.44 of it");
  }
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
    {"Dark swing", {2, 0.1f, 0.9f, 1, 0, 180, 0.5f, 1}},
    {"Passing by", {0, 0.1f, 1, 0.9f, 0.6f, 90, 0.3f, 1, 1}},
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
    EXPECT(low > -2.0 && high < 1.2, "Mix 0.5 keeps the level of every held note");
    half.head = 1.0f;
    half.radius = 1.0f;
    half.near = 0.0f;
    power_range(half, &low, &high, &ear);
    std::printf("note: Head 1, Radius 1 at Mix 0.5: both ears %.2f to %+.2f dB, the quieter ear %.1f dB\n",
                low, high, ear);
    EXPECT(low > -1.0 && high < 1.0, "Mix 0.5 with all of the head keeps the level too");
  }

  // Every preset over the same notes: the power never falls or rises
  // further than Near, the head and the room account for.
  for (const Preset& preset : kPresets) {
    double low, high, ear;
    power_range(preset.s, &low, &high, &ear);
    // By design: Near takes up to kNearDb less kNearUpDb at the far side of
    // the path (and up to 4.5 dB more of the bass) and gives kNearUpDb at the
    // near point; the near ear's lift adds up to 1.4 dB to the two ears'
    // power over the split, the colour of front and back under 1 dB up to
    // C8; the room's comb 3 dB either way at Blur 1.
    const double reach = preset.s.near * preset.s.radius;
    const double by_design = -(reach * (Around::kNearDb - Around::kNearUpDb + 4.5) + 1.0 +
                               3.0 * preset.s.blur * preset.s.mix);
    const double over = 0.5 + 3.5 * preset.s.blur * preset.s.mix +
                        1.4 * preset.s.head * preset.s.radius + Around::kNearUpDb * reach;
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
        field_of(s, id) = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
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

  // Near: the source is 2.5 dB up at the near point and 9.5 dB down opposite
  // it (12 dB between them), where it is thinner in the bass too.
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
    EXPECT_NEAR(at_back[0], Around::kNearUpDb - Around::kNearDb, 0.3,
                "Near 1: 9.5 dB down opposite the near point");
    EXPECT_NEAR(at_back[1] - at_back[0], -4.5, 1.0, "and thinner in the bass by 4.5 dB more");
    EXPECT_NEAR(at_front[0], Around::kNearUpDb, 0.2, "at the near point the source is 2.5 dB up");
    EXPECT_NEAR(at_front[1], Around::kNearUpDb, 0.2, "bass too");
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

  // The room on held pure tones (every semitone from A0 to C8): its echoes
  // meet the source in or out of step by pitch. With the source in front
  // one ear moves by no more than 6 dB at Blur 1 and 2 dB at the default;
  // with it at a side the far ear, which is quiet there, can be met as an
  // equal and cancelled at one pitch, but the two ears' power stays within
  // 3 dB at any place. And the room does not pump: it is as loud against the
  // source at any input level and at every place of a Near 1 circle.
  {
    auto range = [&](float blur, float turn, double* ear_low, double* both_low, double* both_high) {
      *ear_low = *both_low = 99.0;
      *both_high = -99.0;
      for (int note = 21; note <= 108; ++note) {
        const float hz = 440.0f * std::pow(2.0f, static_cast<float>(note - 69) / 12.0f);
        double level[2][2];
        for (int k = 0; k < 2; ++k) {
          device.init(kRate);
          set(device, {0, 0.01f, 0.85f, 0.7f, 0, turn, k == 0 ? 0.0f : blur, 1});
          Stereo out = run(device, sine(hz, 0.5f, kRate, 0.5f));
          level[k][0] = tone_level(out.left, hz, kRate, 9600, 24000);
          level[k][1] = tone_level(out.right, hz, kRate, 9600, 24000);
        }
        for (int e = 0; e < 2; ++e) *ear_low = std::min(*ear_low, db(level[1][e] / level[0][e]));
        const double both = db(std::hypot(level[1][0], level[1][1]) / std::hypot(level[0][0], level[0][1]));
        *both_low = std::min(*both_low, both);
        *both_high = std::max(*both_high, both);
      }
    };
    double ear, low, high;
    range(0.35f, 0.0f, &ear, &low, &high);
    std::printf("note: the room on held tones, source in front: Blur 0.35 one ear down to %.2f dB, "
                "both ears %.2f to %+.2f dB", ear, low, high);
    EXPECT(ear > -2.0 && low > -1.0 && high < 1.5, "the default's room moves a held tone by under 2 dB");
    range(1.0f, 0.0f, &ear, &low, &high);
    std::printf("; Blur 1 one ear down to %.2f dB, both ears %.2f to %+.2f dB\n", ear, low, high);
    EXPECT(ear > -6.5 && low > -2.5 && high < 3.0, "Blur 1 in front: one ear within 6.5 dB, both within 3");
    range(1.0f, 90.0f, &ear, &low, &high);
    std::printf("note: Blur 1, source at the side: the far ear down to %.1f dB at its worst pitch, "
                "both ears %.2f to %+.2f dB\n", ear, low, high);
    EXPECT(low > -3.2 && high < 3.0, "Blur 1 at the side: the two ears' power within 3 dB");

    std::vector<float> chord(static_cast<size_t>(13.0f * kRate));
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      chord[i] = static_cast<float>(0.2 * (std::sin(2.0 * kPi * 440.0 * t) + std::sin(2.0 * kPi * 554.37 * t) +
                                           std::sin(2.0 * kPi * 659.26 * t)));
    }
    Stereo with, without;
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      set(device, {0, 0.08f, 1, 0.9f, 1, 0, k == 0 ? 0.0f : 0.7f, 1});
      (k == 0 ? without : with) = run(device, chord);
    }
    double least = 99.0, most = -99.0;
    for (size_t at = 4800; at + 2400 <= chord.size(); at += 2400) {
      double room = 0.0, source = 0.0;
      for (size_t i = at; i < at + 2400; ++i) {
        const double l = with.left[i] - without.left[i], r = with.right[i] - without.right[i];
        room += l * l + r * r;
        source += static_cast<double>(without.left[i]) * without.left[i] +
                  static_cast<double>(without.right[i]) * without.right[i];
      }
      least = std::min(least, 10.0 * std::log10(room / source));
      most = std::max(most, 10.0 * std::log10(room / source));
    }
    std::printf("note: Far side fades on a held chord, the whole circle: the room is %.1f to %.1f dB "
                "against the source\n", least, most);
    EXPECT(most - least < 2.5, "the room keeps its level against the source all the way round");
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
    std::snprintf(label, sizeof label, "at rest after %s was moved while sounding", name_of(id));
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
  }

  // No dead part of a knob: on a played phrase, each third of every
  // control's travel changes the output by more than 1 % of it.
  {
    const std::vector<float> played = phrase(3.0f);
    for (int id = 0; id < p::kNumParams; ++id) {
      Stereo last;
      double least = 1.0e9;
      // Direction has two places, not thirds.
      const int steps = id == p::kDirection ? 1 : 3;
      for (int step = 0; step <= steps; ++step) {
        const float t = static_cast<float>(step) / static_cast<float>(steps);
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
                    name_of(id), least);
      std::printf("note: %s\n", label);
      EXPECT(least > 0.01, label);
    }
  }
}
