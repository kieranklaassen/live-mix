// Native harness for Isochronic (cpp/devices/isochronic). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates. The rest measures what makes it this instrument:
// one even pulse shared by every key, read from a clock that restarts on a
// key from silence, the right ear Offset behind the left, a tone or a band of
// noise at the key, a rate that glides by a closed form, and a pool of eight
// voices scaled by the root of their number.
//
// Nobody has listened to this device. Every claim below is a measurement.
//
// ISOCHRONIC_REPORT=1 prints every figure, passing or not.

#include <cstdlib>
#include <cstring>
#include <ctime>
#include <utility>

#include "../devices/isochronic/isochronic.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Isochronic;
namespace p = livemix::isochronic;

static Isochronic device;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static bool report() {
  static const bool on = std::getenv("ISOCHRONIC_REPORT") != nullptr;
  return on;
}
#define MEASURED(...)                 \
  do {                                \
    if (report()) {                   \
      std::printf("  measured: ");    \
      std::printf(__VA_ARGS__);       \
      std::printf("\n");              \
    }                                 \
  } while (0)

// A pure tone with a quick envelope and the pulse as the manifest has it:
// what most checks start from.
static void plain(Isochronic& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWarmth, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static Stereo render_ragged(Isochronic& d, float seconds, float rate = kRate) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  const size_t total = static_cast<size_t>(seconds * rate);  // as testkit::render counts
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  int which = 0;
  while (done < total) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), total - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// `block` frames at a time; 0 is the ragged mix.
static Stereo render_in(Isochronic& d, float seconds, int block, float rate = kRate) {
  return block > 0 ? render(d, seconds, rate, block) : render_ragged(d, seconds, rate);
}

// Runs of exact zeros at least `least` samples long: (start, length).
typedef std::vector<std::pair<size_t, size_t>> Runs;
static Runs zero_runs(const std::vector<float>& x, size_t least, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  Runs runs;
  size_t start = from;
  bool in_run = false;
  for (size_t i = from; i <= to; ++i) {
    const bool zero = i < to && x[i] == 0.0f;
    if (zero && !in_run) {
      start = i;
      in_run = true;
    } else if (!zero && in_run) {
      if (i - start >= least) runs.push_back({start, i - start});
      in_run = false;
    }
  }
  return runs;
}

// The pulse law as the family note states it, written again here in double:
// how far open the pulse is at `phase` (in periods) for a Duty and an edge
// given as a part of the period.
static double law(double phase, double duty, double edge) {
  phase -= std::floor(phase);
  if (phase < edge) return 0.5 - 0.5 * std::cos(kPi * phase / edge);
  if (phase < duty) return 1.0;
  if (phase < duty + edge) return 0.5 + 0.5 * std::cos(kPi * (phase - duty) / edge);
  return 0.0;
}

// Edge in seconds as a part of the period, held to half of the shorter of
// the on time and the gap.
static double edge_part(double hz, double duty, double edge_seconds) {
  return std::min(edge_seconds * hz, 0.5 * std::min(duty, 1.0 - duty));
}

// The gain the pulse applied, sample by sample: the pulsed render over the
// same render at Depth 0, wherever that one is far enough from zero to
// divide by. Elsewhere -1 (not measured).
static std::vector<float> gain_of(const std::vector<float>& pulsed, const std::vector<float>& bare) {
  const double floor = 0.05 * peak(bare);
  std::vector<float> gain(pulsed.size(), -1.0f);
  for (size_t i = 0; i < pulsed.size(); ++i) {
    if (std::fabs(bare[i]) > floor) gain[i] = pulsed[i] / bare[i];
  }
  return gain;
}

// One held key on a patch, from init: `setup` after plain().
template <typename Setup>
static Stereo held(Setup setup, float hz, float seconds, float rate = kRate, float gain = 0.7f) {
  plain(device, rate);
  setup(device);
  device.note_on(1, hz, gain);
  return render(device, seconds, rate);
}

// The same key with and without the pulse, as the gain the pulse applied to
// each ear. The carrier is a whole number of samples a period at every rate
// here, so a quarter of the samples are never near zero.
template <typename Setup>
static void pulse_gains(Setup setup, float hz, float seconds, float rate, std::vector<float>* left,
                        std::vector<float>* right) {
  Stereo pulsed = held(setup, hz, seconds, rate);
  Stereo bare = held(
      [&](Isochronic& d) {
        setup(d);
        d.set_param(p::kDepth, 0.0f);
      },
      hz, seconds, rate);
  *left = gain_of(pulsed.left, bare.left);
  *right = gain_of(pulsed.right, bare.right);
}

// The worst distance of a measured gain from the law at Depth 1, from sample
// `from` on, with the ear `offset` periods behind the clock.
static double worst_from_law(const std::vector<float>& gain, double hz, double duty, double edge_seconds,
                             double offset, double rate, size_t from, size_t to = SIZE_MAX) {
  const double edge = edge_part(hz, duty, edge_seconds);
  double worst = 0.0;
  for (size_t i = from; i < std::min(to, gain.size()); ++i) {
    if (gain[i] < 0.0f) continue;
    const double phase = static_cast<double>(i) * hz / rate - offset;
    worst = std::max(worst, std::fabs(gain[i] - law(phase, duty, edge)));
  }
  return worst;
}

static double cpu_seconds() { return static_cast<double>(std::clock()) / CLOCKS_PER_SEC; }

static void test_pulse();
static void test_mid_pulse();
static void test_first_pulse();
static void test_offset();
static void test_slow_pulse();
static void test_keys_together();
static void test_silences();
static void test_voices();
static void test_levels();
static void test_tone();
static void test_air();
static void test_glide();
static void test_clicks();
static void test_cost();

int main() {
  Conformance spec;
  spec.name = "isochronic";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_pulse();
  test_mid_pulse();
  test_first_pulse();
  test_offset();
  test_slow_pulse();
  test_keys_together();
  test_silences();
  test_voices();
  test_levels();
  test_tone();
  test_air();
  test_glide();
  test_clicks();
  test_cost();
  return finish("isochronic");
}

// --- the pulse -------------------------------------------------------------------------------

static void no_change(Isochronic&) {}

static void test_pulse() {
  char label[200];

  // Rate 10, Duty 0.5, Edge 8 ms, Depth 1, at the three sample rates: ten
  // pulses a second, exact zeros between, and the gain is the law.
  for (float rate : kRates) {
    const float hz = rate / 100.0f;
    Stereo out = held(no_change, hz, 10.0f, rate);
    const Runs gaps = zero_runs(out.left, 64);
    std::snprintf(label, sizeof label, "%.0f Hz: ten pulses a second, each followed by exact zeros (%zu gaps in 10 s)",
                  rate, gaps.size());
    EXPECT(gaps.size() == 100, label);
    const double period = rate / 10.0;
    double worst_start = 0.0, worst_length = 0.0;
    for (size_t k = 0; k < gaps.size(); ++k) {
      // The fall ends at 0.5 + 0.08 of the period; the next rise begins at 1.
      worst_start = std::max(worst_start, std::fabs(gaps[k].first - (k + 0.58) * period));
      worst_length = std::max(worst_length, std::fabs(gaps[k].second - 0.42 * period));
    }
    MEASURED("%.0f Hz: gaps begin within %.1f samples of the law, lengths within %.1f", rate, worst_start, worst_length);
    std::snprintf(label, sizeof label, "%.0f Hz: the gaps fall where the law puts them (start %.1f, length %.1f samples)",
                  rate, worst_start, worst_length);
    EXPECT(gaps.size() == 100 && worst_start <= 2.0 && worst_length <= 3.0, label);
    EXPECT(worst_difference(out, Stereo{out.right, out.left}) == 0.0, "at Offset 0 the two ears are the same to the sample");

    std::vector<float> left, right;
    pulse_gains(no_change, hz, 2.0f, rate, &left, &right);
    const double worst = worst_from_law(left, 10.0, 0.5, 0.008, 0.0, rate, 0);
    std::snprintf(label, sizeof label, "%.0f Hz: the gain is the pulse law (worst %.2g)", rate, worst);
    EXPECT(worst < 2.0e-3, label);
  }

  // The law at the ends of the controls. At 40 Hz an Edge of 50 ms is held to
  // 6.25 ms; at Duty 0.9 and 10 Hz to 5 ms.
  struct Case {
    float rate, duty, edge_ms;
    const char* name;
  };
  const Case cases[] = {{40.0f, 0.5f, 50.0f, "40 Hz, Edge 50 ms asked"},
                        {40.0f, 0.1f, 2.0f, "40 Hz, Duty 0.1"},
                        {0.5f, 0.1f, 2.0f, "0.5 Hz, Duty 0.1, Edge 2 ms"},
                        {10.0f, 0.9f, 8.0f, "10 Hz, Duty 0.9"},
                        {3.0f, 0.3f, 50.0f, "3 Hz, Duty 0.3, Edge 50 ms"}};
  for (const Case& c : cases) {
    std::vector<float> left, right;
    auto setup = [&](Isochronic& d) {
      d.set_param(p::kRate, c.rate);
      d.set_param(p::kDuty, c.duty);
      d.set_param(p::kEdge, c.edge_ms);
    };
    pulse_gains(setup, 480.0f, 4.5f, kRate, &left, &right);
    const double worst = worst_from_law(left, c.rate, c.duty, 0.001 * c.edge_ms, 0.0, kRate, 0);
    double most = 0.0;
    size_t measured = 0;
    for (float g : left) {
      if (g < 0.0f) continue;
      most = std::max(most, static_cast<double>(g));
      ++measured;
    }
    std::snprintf(label, sizeof label, "%s: the gain is the pulse law (worst %.2g) and never over 1 (most %.6f)", c.name,
                  worst, most);
    EXPECT(measured > 1000 && worst < 2.0e-3 && most <= 1.0 + 1.0e-6, label);
  }

  // Depth: the gap stands at (1 - Depth)^2, and at 0 there is no pulse at all.
  for (float depth : {0.25f, 0.5f, 0.75f}) {
    std::vector<float> left, right;
    pulse_gains([&](Isochronic& d) { d.set_param(p::kDepth, depth); }, 480.0f, 2.0f, kRate, &left, &right);
    const double floor = (1.0 - depth) * (1.0 - depth);
    const double edge = edge_part(10.0, 0.5, 0.008);
    double worst = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      if (left[i] < 0.0f) continue;
      const double expected = floor + (1.0 - floor) * law(static_cast<double>(i) * 10.0 / kRate, 0.5, edge);
      worst = std::max(worst, std::fabs(left[i] - expected));
    }
    std::snprintf(label, sizeof label, "Depth %.2f: the gap stands at %.4f of the top (worst from the law %.2g)", depth,
                  floor, worst);
    EXPECT(worst < 2.0e-3, label);
  }
  {
    Stereo slow = held([](Isochronic& d) { d.set_param(p::kDepth, 0.0f); }, 480.0f, 1.0f);
    Stereo fast = held(
        [](Isochronic& d) {
          d.set_param(p::kDepth, 0.0f);
          d.set_param(p::kRate, 37.0f);
          d.set_param(p::kDuty, 0.2f);
          d.set_param(p::kOffset, 180.0f);
        },
        480.0f, 1.0f);
    EXPECT(worst_difference(slow, fast) == 0.0, "at Depth 0 the pulse changes nothing, whatever Rate, Duty and Offset say");
    EXPECT(zero_runs(slow.left, 8, at(0.1)).empty(), "at Depth 0 there are no gaps");
  }
}

// --- a control moved in the middle of a pulse ------------------------------------------------

// The gain the pulse applied to the left ear over `seconds`, with `event`
// carried out `when` seconds in.
template <typename Setup, typename Event>
static std::vector<float> gain_through(Setup setup, Event event, float when, float seconds) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    setup(device);
    if (pass == 1) device.set_param(p::kDepth, 0.0f);
    device.note_on(1, 480.0f, 0.7f);
    out[pass] = render(device, when, kRate);
    event(device);
    out[pass] = concat(out[pass], render(device, seconds - when, kRate));
  }
  return gain_of(out[0].left, out[1].left);
}

// The largest move of a measured gain from one sample to the next.
static double steepest(const std::vector<float>& gain, size_t from = 0, size_t to = SIZE_MAX) {
  double worst = 0.0;
  for (size_t i = from + 1; i < std::min(to, gain.size()); ++i) {
    if (gain[i] < 0.0f || gain[i - 1] < 0.0f) continue;
    worst = std::max(worst, std::fabs(static_cast<double>(gain[i]) - gain[i - 1]));
  }
  return worst;
}

static void test_mid_pulse() {
  char label[240];

  // Duty and Edge: a pulse under way finishes as it began, and the next one
  // is the new shape. At 2 Hz a period is half a second; the control is
  // thrown on the top of the first pulse, in the gap after it where the new
  // setting would have the ear open, and in the gap where it would not.
  struct Move {
    int id;
    float from, to, when;
    const char* name;
  };
  const Move moves[] = {{p::kDuty, 0.5f, 0.2f, 0.1f, "Duty 0.5 to 0.2 on the top"},
                        {p::kDuty, 0.2f, 0.8f, 0.3f, "Duty 0.2 to 0.8 in the gap, where 0.8 would be open"},
                        {p::kDuty, 0.8f, 0.2f, 0.47f, "Duty 0.8 to 0.2 in the gap"},
                        {p::kEdge, 50.0f, 2.0f, 0.02f, "Edge 50 to 2 ms half way up the rise"},
                        {p::kEdge, 2.0f, 50.0f, 0.0005f, "Edge 2 to 50 ms a quarter of the way up the rise"},
                        {p::kEdge, 2.0f, 50.0f, 0.1f, "Edge 2 to 50 ms on the top"}};
  for (const Move& m : moves) {
    const std::vector<float> gain = gain_through(
        [&](Isochronic& d) {
          d.set_param(p::kRate, 2.0f);
          d.set_param(m.id, m.from);
        },
        [&](Isochronic& d) { d.set_param(m.id, m.to); }, m.when, 1.5f);
    const double duty_before = m.id == p::kDuty ? m.from : 0.5, duty_after = m.id == p::kDuty ? m.to : 0.5;
    const double edge_before = 0.001 * (m.id == p::kEdge ? m.from : 8.0), edge_after = 0.001 * (m.id == p::kEdge ? m.to : 8.0);
    const double before = worst_from_law(gain, 2.0, duty_before, edge_before, 0.0, kRate, 0, at(0.5));
    const double after = worst_from_law(gain, 2.0, duty_after, edge_after, 0.0, kRate, at(0.5));
    std::snprintf(label, sizeof label, "%s: the pulse under way finishes as it began (worst %.2g) and the next is the new shape (worst %.2g)",
                  m.name, before, after);
    EXPECT(before < 2.0e-3 && after < 2.0e-3, label);
  }

  // Rate is taken up at once, and a pulse it catches part way becomes one
  // more edge, never a jump: the gain moves no faster than a quarter over
  // the steepest step of the edge it has after the throw.
  struct Jump {
    float from, to, edge_ms, own_ms;  // own: the edge after the throw, as it is held
    const char* name;
  };
  const Jump jumps[] = {{2.0f, 40.0f, 8.0f, 6.25f, "Rate 2 to 40 Hz"},
                        {40.0f, 2.0f, 8.0f, 8.0f, "Rate 40 to 2 Hz"},
                        {0.5f, 40.0f, 50.0f, 6.25f, "Rate 0.5 to 40 Hz at Edge 50 ms"},
                        {40.0f, 0.5f, 2.0f, 2.0f, "Rate 40 to 0.5 Hz at Edge 2 ms"}};
  for (const Jump& j : jumps) {
    const double own = 0.5 * kPi / (0.001 * j.own_ms * kRate);
    double worst = 0.0, largest_move = 0.0;
    for (int place = 0; place < 16; ++place) {
      const float when = 0.5f + (place + 0.31f) / (16.0f * j.from);
      const std::vector<float> gain = gain_through(
          [&](Isochronic& d) {
            d.set_param(p::kRate, j.from);
            d.set_param(p::kEdge, j.edge_ms);
          },
          [&](Isochronic& d) { d.set_param(p::kRate, j.to); }, when, when + 0.1f);
      worst = std::max(worst, steepest(gain, at(when)));
      float lo = 2.0f, hi = -1.0f;
      for (size_t i = at(when); i < std::min(gain.size(), at(when) + at(0.02)); ++i) {
        if (gain[i] < 0.0f) continue;
        lo = std::min(lo, gain[i]);
        hi = std::max(hi, gain[i]);
      }
      largest_move = std::max(largest_move, static_cast<double>(hi - lo));
    }
    std::snprintf(label, sizeof label, "%s at sixteen places: the gain's steepest step is %.2f of its own edge's (and it does move: %.2f)",
                  j.name, worst / own, largest_move);
    EXPECT(worst < 1.3 * own && largest_move > 0.5, label);
  }
}

// --- the first pulse -------------------------------------------------------------------------

static void test_first_pulse() {
  char label[200];
  auto turns = [](Isochronic& d) {
    d.set_param(p::kRate, 0.5f);
    d.set_param(p::kOffset, 180.0f);
  };
  // One pulse in two seconds, the ears taking turns: the left has the first
  // second and the right the next.
  Stereo out = held(turns, 480.0f, 2.5f);
  size_t first = 0;
  while (first < out.size() && out.left[first] == 0.0f) ++first;
  std::snprintf(label, sizeof label, "the first pulse begins at once on the left (first sound at sample %zu, rms %.4f)", first,
                rms(out.left, 0, at(0.5)));
  EXPECT(first <= 3 && rms(out.left, 0, at(0.5)) > 1.0e-4, label);
  EXPECT(peak(out.right, 0, at(0.99)) == 0.0, "at Offset 180 the right ear is shut until its own first pulse");
  EXPECT(rms(out.right, at(1.01), at(1.5)) > 1.0e-3 && peak(out.left, at(1.01), at(1.5)) == 0.0,
         "then the right ear has the second half of the period alone");

  // A key from silence starts the pulse again, wherever the old one stood and
  // whether or not the device fell asleep between: the same render again.
  for (float silence : {0.09f, 0.737f}) {
    plain(device);
    turns(device);
    device.note_on(1, 480.0f, 0.7f);
    render(device, 1.37f, kRate);
    device.note_off(1);
    render(device, 0.05f * (100.0f / 60.0f) + silence, kRate);  // past the release, then the silence
    device.note_on(2, 480.0f, 0.7f);
    Stereo again = render(device, 2.5f, kRate);
    std::snprintf(label, sizeof label, "a key after %.3f s of silence starts the pulse again, the same to the sample (worst %g)",
                  silence, worst_difference(out, again));
    EXPECT(worst_difference(out, again) < 1.0e-6, label);
  }

  // Offset 90 at 2 Hz: the right ear's pulse begins a quarter period later.
  {
    Stereo quarter = held(
        [](Isochronic& d) {
          d.set_param(p::kRate, 2.0f);
          d.set_param(p::kOffset, 90.0f);
        },
        480.0f, 1.0f);
    size_t right_first = 0;
    while (right_first < quarter.size() && quarter.right[right_first] == 0.0f) ++right_first;
    std::snprintf(label, sizeof label, "at Offset 90 and 2 Hz the right ear begins 125 ms after the left (%.2f ms)",
                  1000.0 * right_first / kRate);
    EXPECT(std::fabs(static_cast<double>(right_first) - 0.125 * kRate) <= 3.0, label);
  }

  // Duty 0.75 at Offset 180: the clock starts with the right ear in what would
  // be the middle of a pulse. It stays shut until its own first pulse, half a
  // period after the left's, and is the law from there on.
  {
    auto long_pulse = [](Isochronic& d) {
      d.set_param(p::kRate, 2.0f);
      d.set_param(p::kDuty, 0.75f);
      d.set_param(p::kOffset, 180.0f);
    };
    Stereo out = held(long_pulse, 480.0f, 1.5f);
    size_t right_first = 0;
    while (right_first < out.size() && out.right[right_first] == 0.0f) ++right_first;
    std::vector<float> left, right;
    pulse_gains(long_pulse, 480.0f, 1.5f, kRate, &left, &right);
    const double worst = worst_from_law(right, 2.0, 0.75, 0.008, 0.5, kRate, at(0.25));
    std::snprintf(label, sizeof label,
                  "a right ear that would start in mid pulse waits for its own first pulse (%.2f ms, 250 expected) and is the law after (worst %.2g)",
                  1000.0 * right_first / kRate, worst);
    EXPECT(std::fabs(static_cast<double>(right_first) - 0.25 * kRate) <= 3.0 && worst < 2.0e-3, label);
  }
}

// --- the offset ------------------------------------------------------------------------------

// RMS of each whole carrier period (100 samples at 480 Hz and 48 kHz).
static std::vector<double> period_levels(const std::vector<float>& x, size_t from, size_t to) {
  std::vector<double> levels;
  for (size_t start = from; start + 100 <= to; start += 100) levels.push_back(rms(x, start, start + 100));
  return levels;
}

static void test_offset() {
  char label[200];
  // Offset 180 at half Duty: each ear pulses fully and the mono sum does not.
  {
    Stereo out = held([](Isochronic& d) { d.set_param(p::kOffset, 180.0f); }, 480.0f, 3.0f);
    const std::vector<double> levels = period_levels(mid(out), at(0.5), at(3.0));
    double lo = 1.0e9, hi = 0.0;
    for (double level : levels) {
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    const double ripple = db(hi / lo);
    const size_t left_gaps = zero_runs(out.left, 64, at(1.0), at(3.0)).size();
    const size_t right_gaps = zero_runs(out.right, 64, at(1.0), at(3.0)).size();
    const double width = db(rms(out.left, at(1.0)) / rms(mid(out), at(1.0))) - 3.0;  // side over mid when the ears never overlap
    std::snprintf(label, sizeof label,
                  "Offset 180, Duty 0.5: the mono sum ripples by %.3f dB while each ear has its gaps (%zu and %zu in 2 s)",
                  ripple, left_gaps, right_gaps);
    EXPECT(ripple < 1.0 && left_gaps >= 19 && left_gaps <= 21 && right_gaps >= 19 && right_gaps <= 21, label);
    MEASURED("Offset 180, Duty 0.5: one ear over the mono sum %.2f dB above equal power", width);
  }
  // At Duty 0.25 the two ears do not fill each other's gaps: mono pulses at
  // twice Rate.
  {
    Stereo out = held(
        [](Isochronic& d) {
          d.set_param(p::kOffset, 180.0f);
          d.set_param(p::kDuty, 0.25f);
        },
        480.0f, 3.0f);
    const size_t gaps = zero_runs(mid(out), 64, at(1.0), at(3.0)).size();
    std::snprintf(label, sizeof label, "Offset 180, Duty 0.25: the mono sum pulses at twice Rate (%zu gaps in 2 s)", gaps);
    EXPECT(gaps >= 39 && gaps <= 41, label);
  }
  // The right ear is the same pulse, Offset behind.
  for (float degrees : {45.0f, 90.0f, 180.0f}) {
    std::vector<float> left, right;
    pulse_gains(
        [&](Isochronic& d) {
          d.set_param(p::kOffset, degrees);
          d.set_param(p::kDuty, 0.3f);
        },
        480.0f, 1.5f, kRate, &left, &right);
    const double worst_left = worst_from_law(left, 10.0, 0.3, 0.008, 0.0, kRate, 0);
    const double worst_right = worst_from_law(right, 10.0, 0.3, 0.008, degrees / 360.0, kRate, at(0.1));
    std::snprintf(label, sizeof label, "Offset %.0f: the right ear is the law %.3f of a period behind (worst %.2g, left %.2g)",
                  degrees, degrees / 360.0, worst_right, worst_left);
    EXPECT(worst_left < 2.0e-3 && worst_right < 2.0e-3, label);
  }
}

// --- a slow, short pulse ---------------------------------------------------------------------

static void test_slow_pulse() {
  char label[200];
  auto phrase = [](int block) {
    plain(device);
    device.set_param(p::kRate, 0.5f);
    device.set_param(p::kDuty, 0.1f);
    device.note_on(1, 480.0f, 0.7f);
    return render_in(device, 7.0f, block);
  };
  Stereo reference = phrase(128);
  const Runs gaps = zero_runs(reference.left, at(1.0));
  const double length = gaps.empty() ? 0.0 : gaps[0].second / static_cast<double>(kRate);
  std::snprintf(label, sizeof label, "at 0.5 Hz and Duty 0.1 a held key is silent for 1.792 s between pulses (%zu gaps, the first %.4f s)",
                gaps.size(), length);
  EXPECT(gaps.size() == 3 && std::fabs(length - 1.792) < 0.002, label);
  EXPECT(rms(reference.left, at(2.0), at(2.2)) > 1.0e-3 && rms(reference.left, at(4.0), at(4.2)) > 1.0e-3 &&
             rms(reference.left, at(6.0), at(6.2)) > 1.0e-3,
         "and the next three pulses come: the silence did not put the device to sleep");
  for (int block : {1, 2048, 0}) {
    const double worst = worst_difference(reference, phrase(block));
    std::snprintf(label, sizeof label, "the slow pulse is the same in %s blocks (worst %g)",
                  block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frame", worst);
    EXPECT(worst < 1.0e-6, label);
  }
}

// --- keys share the pulse --------------------------------------------------------------------

static void test_keys_together() {
  char label[200];
  Stereo one = held(no_change, 480.0f, 3.0f);
  plain(device);
  device.note_on(1, 480.0f, 0.7f);
  Stereo three = render(device, 0.1f, kRate);
  device.note_on(2, 600.0f, 0.7f);
  three = concat(three, render(device, 0.1f, kRate));
  device.note_on(3, 720.0f, 0.7f);
  three = concat(three, render(device, 2.8f, kRate));
  const Runs alone = zero_runs(one.left, 64);
  const Runs together = zero_runs(three.left, 64);
  size_t apart = alone.size() == together.size() ? 0 : 1000000;
  for (size_t k = 0; k < std::min(alone.size(), together.size()); ++k) {
    apart = std::max(apart, static_cast<size_t>(std::llabs(static_cast<long long>(alone[k].first) -
                                                            static_cast<long long>(together[k].first))));
    apart = std::max(apart, static_cast<size_t>(std::llabs(static_cast<long long>(alone[k].second) -
                                                            static_cast<long long>(together[k].second))));
  }
  std::snprintf(label, sizeof label,
                "three keys struck 100 ms apart pulse together: %zu gaps on the samples one key's fall on (worst %zu samples apart)",
                together.size(), apart);
  EXPECT(alone.size() >= 29 && apart <= 1, label);
  EXPECT(tone_level(three.left, 720.0, kRate, at(1.0)) > 0.25 * tone_level(three.left, 480.0, kRate, at(1.0)),
         "and the third key sounds");
}

// --- silences, block sizes and knobs moved while nothing sounds ------------------------------

static void test_silences() {
  char label[220];

  // The output does not depend on the block size across silences of every
  // length around the moment the device falls asleep (the release is over
  // 83 ms after the keys are let go and the hold is 50 ms more; which block
  // that is depends on the block size), a shorter one in which the old notes
  // are still ringing, and one long after. Controls are moved in the silence,
  // 10 ms before the next key. With `rearm` the Rate is among them, so the
  // glide starts again at the next key; without, the glide that began at the
  // first key runs on through the silence.
  auto phrase = [](int block, float silence, bool rearm) {
    plain(device);
    device.set_param(p::kOffset, 60.0f);
    device.set_param(p::kAir, 0.3f);
    device.set_param(p::kWarmth, 0.5f);
    device.set_param(p::kTarget, 25.0f);
    device.set_param(p::kGlide, 0.05f);  // three seconds
    Stereo out;
    auto run_for = [&](float seconds) { out = concat(out, render_in(device, seconds, block)); };
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 329.63f, 0.8f);
    run_for(0.7f);
    device.note_off(1);
    device.note_off(2);
    run_for(silence - 0.01f);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kDuty, 0.3f);
    device.set_param(p::kOffset, 150.0f);
    device.set_param(p::kAir, 0.6f);
    device.set_param(p::kVolume, -3.0f);
    if (rearm) device.set_param(p::kRate, 7.0f);
    run_for(0.01f);
    device.note_on(3, 277.18f, 0.8f);
    run_for(0.6f);
    device.set_param(p::kDuty, 0.7f);
    device.set_param(p::kEdge, 20.0f);
    device.set_param(p::kWarmth, 1.0f);
    run_for(0.3f);
    return out;
  };
  {
    Stereo asleep = phrase(128, 1.3f, false);
    EXPECT(peak(asleep.left, at(0.9), at(1.95)) == 0.0 && peak(asleep.right, at(0.9), at(1.95)) == 0.0,
           "the phrase holds a silence in which the device sleeps");
    EXPECT(rms(asleep.left, at(2.1)) > 1.0e-3, "and a note after it");
  }
  for (bool rearm : {false, true}) {
    double worst = 0.0;
    float worst_silence = 0.0f;
    const char* worst_block = "none";
    for (float silence : {0.04f, 0.08f, 0.10f, 0.12f, 0.14f, 0.16f, 0.18f, 0.20f, 0.22f, 1.3f}) {
      Stereo reference = phrase(128, silence, rearm);
      for (int block : {1, 0, 2048}) {
        const double diff = worst_difference(reference, phrase(block, silence, rearm));
        if (diff > worst) {
          worst = diff;
          worst_silence = silence;
          worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "output does not depend on block size across a silence, %s (worst %g, %s blocks, %.2f s silence)",
                  rearm ? "Rate moved in it" : "the glide running through it", worst, worst_block, worst_silence);
    EXPECT(worst < 1.0e-6, label);
  }

  // A knob moved while nothing sounds is simply there at the next key: the
  // note is the one a device set that way from init plays. The device is
  // sent into the silence off any beat of its own (an odd block while the
  // first note rings), and the knob is moved both before it sleeps and after.
  auto base = [](Isochronic& d, bool gliding) {
    plain(d);
    d.set_param(p::kOffset, 90.0f);
    d.set_param(p::kAir, 0.4f);
    d.set_param(p::kWarmth, 0.4f);
    if (gliding) {
      d.set_param(p::kTarget, 30.0f);
      d.set_param(p::kGlide, 0.02f);
    }
  };
  for (bool gliding : {false, true}) {
    double worst = 0.0;
    int worst_id = -1;
    float worst_wait = 0.0f;
    for (int id = 0; id < p::kNumParams; ++id) {
      // With a glide under way only the three controls that arm it give the
      // fresh device's note: anything else leaves the glide where it has got to.
      if (gliding && id != p::kRate && id != p::kTarget && id != p::kGlide) continue;
      const float value = p::kParamMin[id] + 0.37f * (p::kParamMax[id] - p::kParamMin[id]);
      base(device, gliding);
      device.set_param(id, value);
      device.note_on(2, 330.0f, 0.8f);
      Stereo fresh = render(device, 0.5f, kRate);
      for (float wait : {0.1f, 0.5f}) {
        base(device, gliding);
        device.note_on(1, 220.0f, 0.8f);
        render(device, 0.3f, kRate);
        device.process(13);
        device.note_off(1);
        render(device, wait, kRate);
        device.set_param(id, value);
        device.note_on(2, 330.0f, 0.8f);
        const double diff = worst_difference(fresh, render(device, 0.5f, kRate));
        if (diff > worst) {
          worst = diff;
          worst_id = id;
          worst_wait = wait;
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "a knob moved in silence is there at the next key%s (worst %g, param %d, %.1f s after the key was let go)",
                  gliding ? ", and one that arms the glide starts it at that key" : "", worst, worst_id, worst_wait);
    EXPECT(worst < 1.0e-6, label);
  }

  // A second init is the first, after anything.
  {
    auto piece = []() {
      device.set_param(p::kAir, 0.7f);
      device.set_param(p::kOffset, 120.0f);
      device.set_param(p::kTarget, 3.0f);
      device.set_param(p::kGlide, 0.01f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 0.4f, kRate);
      device.note_on(2, 330.0f, 0.5f);
      device.note_off(1);
      return concat(out, render(device, 0.6f, kRate));
    };
    device.init(kRate);
    Stereo first = piece();
    for (int n = 0; n < 12; ++n) device.note_on(10 + n, 100.0f + 37.0f * n, 1.0f);
    device.set_param(p::kRate, 33.0f);
    render(device, 0.3f, kRate);
    device.init(kRate);
    Stereo second = piece();
    EXPECT(first.left == second.left && first.right == second.right, "a second init gives the first render, bit for bit");
  }
}

// --- the voices ------------------------------------------------------------------------------

static const float kEight[8] = {200.0f, 230.0f, 260.0f, 290.0f, 320.0f, 350.0f, 380.0f, 410.0f};

static void test_voices() {
  char label[220];

  // A ninth key takes the quietest voice by its envelope and its key's
  // strength, not by what is coming out: here every voice is in the pulse's
  // gap and the output is exact zero. The first key is the oldest, which is
  // the one a tie would take.
  {
    plain(device);
    device.set_param(p::kRate, 0.5f);
    device.set_param(p::kDuty, 0.1f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kEight[n], n == 5 ? 0.2f : 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    EXPECT(peak(before.left, at(0.9)) == 0.0, "a second in, every voice is in the gap");
    device.note_on(8, 470.0f, 0.8f);
    device.set_param(p::kDepth, 0.0f);
    Stereo after = render(device, 0.6f, kRate);
    const double held_level = tone_level(after.left, kEight[1], kRate, at(0.2));
    const double oldest = tone_level(after.left, kEight[0], kRate, at(0.2)) / held_level;
    const double quiet = tone_level(after.left, kEight[5], kRate, at(0.2)) / held_level;
    const double ninth = tone_level(after.left, 470.0, kRate, at(0.2)) / held_level;
    std::snprintf(label, sizeof label,
                  "a ninth key in the gap takes the softest key's voice (against a held key: oldest %.2f, softest %.3f, ninth %.2f)",
                  oldest, quiet, ninth);
    EXPECT(held_level > 1.0e-3 && oldest > 0.8 && ninth > 0.8 && quiet < 0.05, label);
  }

  // Two keys into a full pool with no block between: both are there, and two
  // of the eight have gone.
  {
    plain(device);
    device.set_param(p::kDepth, 0.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kEight[n], 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(100, 500.0f, 0.8f);
    device.note_on(101, 560.0f, 0.8f);
    Stereo out = render(device, 0.6f, kRate);
    const double first = tone_level(out.left, 500.0, kRate, at(0.2));
    const double second = tone_level(out.left, 560.0, kRate, at(0.2));
    int left_of_eight = 0;
    for (float hz : kEight) left_of_eight += tone_level(out.left, hz, kRate, at(0.2)) > 0.5 * second ? 1 : 0;
    std::snprintf(label, sizeof label, "two keys into a full pool in one block both sound (%.4f and %.4f) and six of the eight stay (%d)",
                  first, second, left_of_eight);
    EXPECT(second > 1.0e-3 && first > 0.8 * second && first < 1.25 * second && left_of_eight == 6, label);
  }

  // A key struck twice in one block while every voice is held at the same
  // level: one voice is taken, not two, and after every key is let go the
  // device comes to exact silence.
  {
    plain(device);
    device.set_param(p::kDepth, 0.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kEight[n], 0.8f);
    render(device, 3.0f, kRate);
    device.note_on(200, 500.0f, 0.8f);
    device.note_on(200, 500.0f, 0.8f);
    Stereo out = render(device, 0.6f, kRate);
    const double struck = tone_level(out.left, 500.0, kRate, at(0.2));
    int left_of_eight = 0;
    for (float hz : kEight) left_of_eight += tone_level(out.left, hz, kRate, at(0.2)) > 0.5 * struck ? 1 : 0;
    const double second_key = tone_level(out.left, kEight[1], kRate, at(0.2));
    for (int n = 0; n < 8; ++n) device.note_off(n);
    device.note_off(200);
    render(device, 0.3f, kRate);
    Stereo rest = render(device, 0.3f, kRate);
    std::snprintf(label, sizeof label,
                  "a key struck twice in one block takes one voice (seven of eight stay: %d; the second key at %.4f) and all end (peak %g)",
                  left_of_eight, second_key, std::max(peak(rest.left), peak(rest.right)));
    EXPECT(struck > 1.0e-3 && left_of_eight == 7 && second_key > 0.5 * struck && peak(rest.left) == 0.0 && peak(rest.right) == 0.0, label);
  }

  // A key struck again while every voice is busy still has its own release:
  // a quarter of the release time after it is let go it is about 15 dB down.
  {
    plain(device);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kRelease, 2.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, kEight[n], 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(3, kEight[3], 0.8f);
    Stereo on = render(device, 0.4f, kRate);
    device.note_off(3);
    Stereo off = render(device, 0.6f, kRate);
    const double fall = db(tone_level(off.left, kEight[3], kRate, at(0.4), at(0.6)) /
                           tone_level(on.left, kEight[3], kRate, at(0.2), at(0.4)));
    std::snprintf(label, sizeof label, "a key struck again with every voice busy keeps its release (%.1f dB after a quarter of it)", fall);
    EXPECT(fall < -10.0 && fall > -20.0, label);
  }

  // Keys under 80 Hz sound an octave or more up; every other key where it is.
  {
    struct Fold {
      float key, sounds;
    };
    const Fold folds[] = {{32.70f, 130.81f}, {41.20f, 82.41f}, {79.0f, 158.0f}, {80.0f, 80.0f}, {2093.0f, 2093.0f}, {8.0f, 128.0f}};
    for (const Fold& fold : folds) {
      Stereo out = held([](Isochronic& d) { d.set_param(p::kDepth, 0.0f); }, fold.key, 1.0f);
      const double found = dominant_frequency(out.left, kRate, 20.0, 5000.0, at(0.2));
      std::snprintf(label, sizeof label, "a key at %.2f Hz sounds at %.2f Hz (%.2f)", fold.key, fold.sounds, found);
      EXPECT(std::fabs(found - fold.sounds) < 0.002 * fold.sounds, label);
    }
  }

  // Notes that are not notes.
  {
    plain(device);
    device.note_on(1, std::nanf(""), 0.7f);
    Stereo nothing = render(device, 0.1f, kRate);
    EXPECT(peak(nothing.left) == 0.0, "a key with no pitch is not played");
    device.note_on(2, 440.0f, std::nanf(""));
    device.note_off(77);
    Stereo something = render(device, 0.3f, kRate);
    EXPECT(finite(something.left) && rms(something.left) > 1.0e-3, "a key with no strength is played at a middling one");
  }
}

// --- levels ----------------------------------------------------------------------------------

static void test_levels() {
  char label[220];

  // One key at gain 0.7 on the default patch, at the three rates.
  for (float rate : kRates) {
    device.init(rate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 3.0f, rate);
    const double level = db(std::max(peak(out.left), peak(out.right)));
    std::snprintf(label, sizeof label, "%.0f Hz: one key at gain 0.7 peaks near -18 dBFS at the default volume (%.2f)", rate, level);
    EXPECT(std::fabs(level + 18.0) < 1.0, label);
  }

  // A full pool at full gain. The worst case there can be is eight keys on
  // one pitch struck together, every carrier in step: it reaches the edge of
  // the clip's knee and no further. Eight keys of a chord stay well inside.
  auto full_pool = [](bool one_pitch, float warmth, float air, float seconds) {
    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kWarmth, warmth);
    device.set_param(p::kAir, air);
    device.set_param(p::kAttack, 0.005f);
    const float chord[8] = {110.0f, 146.83f, 196.0f, 261.63f, 329.63f, 440.0f, 587.33f, 783.99f};
    for (int n = 0; n < 8; ++n) device.note_on(n, one_pitch ? 220.0f : chord[n], 1.0f);
    Stereo out = render(device, seconds, kRate);
    return std::max(peak(out.left), peak(out.right));
  };
  for (float warmth : {0.0f, 0.3f, 1.0f}) {
    const double together = full_pool(true, warmth, 0.0f, 2.0f);
    const double chord = full_pool(false, warmth, 0.0f, 60.0f);
    std::snprintf(label, sizeof label,
                  "Warmth %.1f: eight keys at full gain stay at or under the knee (one pitch in step %.4f, a chord for a minute %.4f)",
                  warmth, together, chord);
    EXPECT(together > 0.45 && together <= 0.5005 && chord < 0.5, label);
  }
  {
    const double noise = full_pool(false, 0.3f, 1.0f, 60.0f);
    const double half = full_pool(false, 0.3f, 0.5f, 60.0f);
    std::snprintf(label, sizeof label, "eight keys of noise at full gain for a minute stay under the knee (Air 1: %.4f, Air 0.5: %.4f)",
                  noise, half);
    EXPECT(noise < 0.5 && half < 0.5, label);
  }

  // Four keys held, three let go at the longest release: the key that stays
  // comes up by the root of four as the others die, as slowly as they die
  // (under 1 dB in any 100 ms), with no step where a tail ends.
  {
    plain(device);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kRelease, 15.0f);
    for (int n = 0; n < 4; ++n) device.note_on(n, kEight[2 * n], 0.8f);
    Stereo before = render(device, 0.5f, kRate);
    for (int n = 1; n < 4; ++n) device.note_off(n);
    Stereo out = render(device, 27.0f, kRate);
    const double start = db(tone_level(before.left, kEight[0], kRate, at(0.3)));
    double worst = 0.0, last = start;
    for (size_t from = 0; from + at(0.1) <= out.size(); from += at(0.1)) {
      const double level = db(tone_level(out.left, kEight[0], kRate, from, from + at(0.1)));
      worst = std::max(worst, std::fabs(level - last));
      last = level;
    }
    std::snprintf(label, sizeof label,
                  "as three of four keys die away the held key moves by %.2f dB at most in 100 ms and ends %.2f dB up (6.02 is the root of four)",
                  worst, last - start);
    MEASURED("%s", label);
    EXPECT(worst < 1.0 && std::fabs(last - start - 6.02) < 0.1 && std::max(peak(out.left), peak(out.right)) < 0.5, label);
  }

  // Volume is in decibels.
  {
    Stereo low = held([](Isochronic& d) { d.set_param(p::kVolume, -12.0f); }, 480.0f, 1.0f);
    Stereo high = held([](Isochronic& d) { d.set_param(p::kVolume, 0.0f); }, 480.0f, 1.0f);
    EXPECT_NEAR(db(rms(high.left) / rms(low.left)), 12.0, 0.05, "Volume moves the level by its decibels");
  }
}

// --- the tone --------------------------------------------------------------------------------

static void test_tone() {
  char label[220];
  auto bare = [](float warmth) {
    return [warmth](Isochronic& d) {
      d.set_param(p::kDepth, 0.0f);
      d.set_param(p::kWarmth, warmth);
    };
  };

  // The key's own pitch, to a hundredth of a hertz.
  {
    Stereo out = held(bare(0.0f), 440.0f, 5.0f);
    const double found = dominant_frequency(out.left, kRate, 400.0, 480.0, at(0.5));
    std::snprintf(label, sizeof label, "a key at 440 Hz sounds at 440 Hz (%.4f)", found);
    EXPECT(std::fabs(found - 440.0) < 0.01, label);
  }

  // Warmth adds the second and third partials: none at 0, 6 and 12 dB under
  // the first at 1, at every sample rate.
  for (float rate : kRates) {
    Stereo pure = held(bare(0.0f), 220.0f, 1.5f, rate);
    Stereo half = held(bare(0.5f), 220.0f, 1.5f, rate);
    Stereo warm = held(bare(1.0f), 220.0f, 1.5f, rate);
    const size_t from = at(0.3, rate);
    auto partial = [&](const Stereo& s, int n) {
      return db(tone_level(s.left, 220.0 * n, rate, from) / tone_level(s.left, 220.0, rate, from));
    };
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Warmth 0 is a sine (partials %.0f and %.0f dB), 0.5 has %.2f and %.2f dB, 1 has %.2f and %.2f dB",
                  rate, partial(pure, 2), partial(pure, 3), partial(half, 2), partial(half, 3), partial(warm, 2), partial(warm, 3));
    EXPECT(partial(pure, 2) < -80.0 && partial(pure, 3) < -80.0, label);
    EXPECT(std::fabs(partial(half, 2) + 12.04) < 0.3 && std::fabs(partial(half, 3) + 18.06) < 0.3, label);
    EXPECT(std::fabs(partial(warm, 2) + 6.02) < 0.3 && std::fabs(partial(warm, 3) + 12.04) < 0.3, label);
  }

  // The peak of a key does not move with Warmth: the wave is scaled to it.
  {
    double lo = 1.0e9, hi = 0.0;
    for (float warmth : {0.0f, 0.15f, 0.3f, 0.5f, 0.7f, 0.85f, 1.0f}) {
      Stereo out = held(bare(warmth), 220.0f, 1.0f);
      const double level = peak(out.left, at(0.3));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    std::snprintf(label, sizeof label, "a key's peak is the same at any Warmth (%.3f dB between the least and the most)", db(hi / lo));
    EXPECT(db(hi / lo) < 0.1, label);
  }

  // At the top a partial that would pass half the sample rate is left out,
  // not folded back: 8 kHz at 44.1 kHz has its second partial at 16 kHz and
  // would have its third at 24 kHz, which folds to 20.1 kHz.
  {
    const float rate = 44100.0f;
    Stereo out = held(bare(1.0f), 8000.0f, 1.0f, rate);
    const size_t from = at(0.3, rate);
    const double first = tone_level(out.left, 8000.0, rate, from);
    const double second = db(tone_level(out.left, 16000.0, rate, from) / first);
    const double folded = db(tone_level(out.left, 20100.0, rate, from) / first);
    std::snprintf(label, sizeof label, "8 kHz at 44.1 kHz: the second partial is there (%.1f dB) and the third does not fold back (%.0f dB)",
                  second, folded);
    EXPECT(std::fabs(second + 6.02) < 0.5 && folded < -80.0, label);
  }
}

// --- the band of noise -----------------------------------------------------------------------

// Mean power of the `hz` component over `segments` stretches of a quarter second.
static double band_power(const std::vector<float>& x, double hz, double rate, size_t from, int segments) {
  const size_t length = at(0.25, rate);
  double sum = 0.0;
  for (int s = 0; s < segments; ++s) {
    const double level = tone_level(x, hz, rate, from + s * length, from + (s + 1) * length);
    sum += level * level;
  }
  return sum / segments;
}

static void test_air() {
  char label[240];
  auto airy = [](float air) {
    return [air](Isochronic& d) {
      d.set_param(p::kDepth, 0.0f);
      d.set_param(p::kAir, air);
    };
  };

  // Air 0 is the tone alone; Air 1 is noise alone, 3 dB under the tone in
  // RMS (half the tone's peak), the same at the three sample rates.
  double noise_db[3], tone_db[3];
  for (int r = 0; r < 3; ++r) {
    const float rate = kRates[r];
    Stereo tone = held(airy(0.0f), 220.0f, 8.5f, rate);
    Stereo noise = held(airy(1.0f), 220.0f, 8.5f, rate);
    const size_t from = at(0.5, rate);
    tone_db[r] = db(rms(tone.left, from));
    noise_db[r] = db(rms(noise.left, from));
    const double off_key = tone_level(tone.left, 300.0, rate, from);
    std::snprintf(label, sizeof label, "%.0f Hz: at Air 0 there is no noise beside the tone (%.1f dB at 300 Hz)", rate, db(off_key));
    EXPECT(off_key < 1.0e-5, label);
    EXPECT(worst_difference(noise, Stereo{noise.right, noise.left}) == 0.0, "at Offset 0 the noise is the same in both ears");

    // The band is centred on the key: a semitone at a time over two octaves.
    double weighted = 0.0, total = 0.0, centre = 0.0, octave_down = 0.0, octave_up = 0.0, third_down = 0.0, third_up = 0.0;
    for (int k = -12; k <= 12; ++k) {
      const double power = band_power(noise.left, 220.0 * std::pow(2.0, k / 12.0), rate, from, 32);
      weighted += k * power;
      total += power;
      if (k == 0) centre = power;
      if (k == -12) octave_down = power;
      if (k == 12) octave_up = power;
      if (k == -3) third_down = power;
      if (k == 3) third_up = power;
    }
    // It is a band, not a tone: three semitones either side it is about
    // 3.4 dB down (two sections of Q 2), not gone.
    const double skirt_down = 10.0 * std::log10(third_down / centre), skirt_up = 10.0 * std::log10(third_up / centre);
    std::snprintf(label, sizeof label, "%.0f Hz: the band is about 3.4 dB down three semitones either side (%.1f and %.1f dB)", rate,
                  skirt_down, skirt_up);
    EXPECT(skirt_down < -1.0 && skirt_down > -6.5 && skirt_up < -1.0 && skirt_up > -6.5, label);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: the noise is a band centred on the key (centre of weight %.2f semitones off; an octave down %.1f dB, up %.1f dB)",
                  rate, weighted / total, 10.0 * std::log10(octave_down / centre), 10.0 * std::log10(octave_up / centre));
    EXPECT(std::fabs(weighted / total) < 1.0 && octave_down < 0.05 * centre && octave_up < 0.05 * centre, label);
  }
  std::snprintf(label, sizeof label,
                "the noise of Air 1 is %.2f, %.2f and %.2f dBFS at 44.1, 48 and 96 kHz, against a tone of %.2f, %.2f and %.2f",
                noise_db[0], noise_db[1], noise_db[2], tone_db[0], tone_db[1], tone_db[2]);
  EXPECT(std::fabs(noise_db[0] - noise_db[1]) < 1.0 && std::fabs(noise_db[2] - noise_db[1]) < 1.0, label);
  EXPECT(std::fabs(noise_db[1] - tone_db[1] + 3.01) < 0.7, "at Air 1 the noise is 3 dB under the tone of Air 0 in RMS");

  // The level does not follow the key: the band is as wide in octaves at any
  // key and is scaled for its width.
  {
    double lo = 1.0e9, hi = -1.0e9;
    char figures[120] = "";
    for (float key : {110.0f, 440.0f, 880.0f, 2093.0f}) {
      Stereo noise = held(airy(1.0f), key, 8.5f);
      const double level = db(rms(noise.left, at(0.5)));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
      std::snprintf(figures + std::strlen(figures), sizeof figures - std::strlen(figures), " %.2f", level);
    }
    std::snprintf(label, sizeof label, "the noise is as loud on any key (110, 440, 880 and 2093 Hz:%s dBFS)", figures);
    EXPECT(hi - lo < 1.0 && std::fabs(0.5 * (hi + lo) - noise_db[1]) < 1.0, label);
  }

  // Half way the two cross with their powers added.
  {
    Stereo both = held(airy(0.5f), 220.0f, 8.5f);
    const double measured = db(rms(both.left, at(0.5)));
    const double expected = 10.0 * std::log10(0.5 * std::pow(10.0, tone_db[1] / 10.0) + 0.5 * std::pow(10.0, noise_db[1] / 10.0));
    std::snprintf(label, sizeof label, "at Air 0.5 tone and noise add as power (%.2f dBFS, %.2f expected)", measured, expected);
    EXPECT(std::fabs(measured - expected) < 0.5, label);
    const double tone_part = db(tone_level(both.left, 220.0, kRate, at(0.5)) * std::sqrt(0.5)) - tone_db[1];
    std::snprintf(label, sizeof label, "and the tone in it is 3 dB under the tone alone (%.2f dB)", tone_part);
    EXPECT(std::fabs(tone_part + 3.01) < 0.5, label);
  }

  // The noise is pulsed like the tone: exact zeros in the gaps.
  {
    Stereo out = held([](Isochronic& d) { d.set_param(p::kAir, 1.0f); }, 220.0f, 2.0f);
    const size_t gaps = zero_runs(out.left, 64, at(1.0)).size();
    std::snprintf(label, sizeof label, "at Air 1 the noise has the pulse's gaps (%zu in a second)", gaps);
    EXPECT(gaps >= 9 && gaps <= 11, label);
  }
}

// --- the glide -------------------------------------------------------------------------------

// The phase a glide from `base` to `target` over `seconds` has turned
// through `t` seconds after it began: the integral of
// base · (target / base)^(t / seconds), then of the target.
static double glide_turns(double base, double target, double seconds, double t) {
  const double log_ratio = std::log(target / base);
  auto integral = [&](double time) {
    return std::fabs(log_ratio) < 1.0e-12 ? base * time : base * seconds / log_ratio * (std::exp(log_ratio * time / seconds) - 1.0);
  };
  return t <= seconds ? integral(t) : integral(seconds) + target * (t - seconds);
}

// The samples at which each pulse begins: the end of every gap from `from` on.
static std::vector<size_t> pulse_starts(const std::vector<float>& x, size_t from = 0) {
  std::vector<size_t> starts;
  for (const auto& gap : zero_runs(x, 48, from)) {
    if (gap.first + gap.second < x.size()) starts.push_back(gap.first + gap.second);
  }
  return starts;
}

static void test_glide() {
  char label[240];

  // Rate 12 to Target 6 over one minute, a key held: every pulse begins where
  // the closed form puts it, and after the minute the rate is the Target.
  {
    plain(device);
    device.set_param(p::kRate, 12.0f);
    device.set_param(p::kTarget, 6.0f);
    device.set_param(p::kGlide, 1.0f);
    const float before = device.meter(0);
    device.note_on(1, 480.0f, 0.7f);
    Stereo out = render(device, 30.0f, kRate);
    const float half_way = device.meter(0);
    out = concat(out, render(device, 31.0f, kRate));
    const float after = device.meter(0);
    out = concat(out, render(device, 19.0f, kRate));
    const std::vector<size_t> starts = pulse_starts(out.left);
    double worst = 0.0;
    for (size_t k = 0; k < starts.size(); ++k) {
      // The gap before pulse k + 1 ends one sample into it: the first sample
      // of a pulse is still exactly shut.
      const double turns = glide_turns(12.0, 6.0, 60.0, (starts[k] - 1) / static_cast<double>(kRate));
      worst = std::max(worst, std::fabs(turns - static_cast<double>(k + 1)));
    }
    auto rate_at = [&](double seconds) {
      for (size_t k = 0; k + 1 < starts.size(); ++k) {
        if (starts[k] >= at(seconds)) return kRate / static_cast<double>(starts[k + 1] - starts[k]);
      }
      return 0.0;
    };
    std::snprintf(label, sizeof label,
                  "a glide from 12 to 6 Hz over a minute puts every pulse on the closed form (%zu pulses, worst %.4f of a period; %.3f, %.3f, %.3f, %.3f Hz at 0, 30, 60 and 75 s)",
                  starts.size(), worst, rate_at(0.0), rate_at(30.0), rate_at(60.0), rate_at(75.0));
    EXPECT(starts.size() > 600 && worst < 0.01, label);
    EXPECT(std::fabs(rate_at(30.0) / (12.0 * std::pow(0.5, 0.5)) - 1.0) < 0.01, "half way it is half way by ratio");
    EXPECT(std::fabs(rate_at(61.0) / 6.0 - 1.0) < 0.001 && std::fabs(rate_at(75.0) / 6.0 - 1.0) < 0.001,
           "after its time the rate is the Target within 0.1 %");
    std::snprintf(label, sizeof label, "the reading of the glide's place is 0 before the key, 0.5 half way and 1 at the end (%.3f, %.3f, %.3f)",
                  before, half_way, after);
    EXPECT(before == 0.0f && std::fabs(half_way - 0.5f) < 0.001f && after == 1.0f, label);
  }

  // The same at each sample rate, on a short glide upward.
  for (float rate : kRates) {
    plain(device, rate);
    device.set_param(p::kRate, 5.0f);
    device.set_param(p::kTarget, 20.0f);
    device.set_param(p::kGlide, 0.1f);
    device.note_on(1, rate / 100.0f, 0.7f);
    Stereo out = render(device, 8.0f, rate);
    const std::vector<size_t> starts = pulse_starts(out.left);
    double worst = 0.0;
    for (size_t k = 0; k < starts.size(); ++k) {
      worst = std::max(worst, std::fabs(glide_turns(5.0, 20.0, 6.0, (starts[k] - 1) / static_cast<double>(rate)) - (k + 1.0)));
    }
    std::snprintf(label, sizeof label, "%.0f Hz: a glide from 5 to 20 Hz over six seconds is on the closed form (%zu pulses, worst %.4f of a period)",
                  rate, starts.size(), worst);
    EXPECT(starts.size() > 70 && worst < 0.01, label);
  }

  // Letting go and striking again does not start the glide again, and neither
  // does the sleep between: the new key's pulse begins at once (the clock
  // restarts) at the rate the glide has reached.
  for (int block : {128, 2048, 1}) {
    plain(device);
    device.set_param(p::kRate, 12.0f);
    device.set_param(p::kTarget, 3.0f);
    device.set_param(p::kGlide, 0.1f);
    device.note_on(1, 480.0f, 0.7f);
    render_in(device, 1.5f, block);
    device.note_off(1);
    render_in(device, 1.5f, block);
    device.note_on(2, 480.0f, 0.7f);
    Stereo out = render_in(device, 2.0f, block);
    const std::vector<size_t> starts = pulse_starts(out.left);
    const double since = glide_turns(12.0, 3.0, 6.0, 3.0);
    double worst = 0.0;
    for (size_t k = 0; k < starts.size(); ++k) {
      const double turns = glide_turns(12.0, 3.0, 6.0, 3.0 + (starts[k] - 1) / static_cast<double>(kRate)) - since;
      worst = std::max(worst, std::fabs(turns - (k + 1.0)));
    }
    std::snprintf(label, sizeof label,
                  "a key struck again after a silence meets the glide where it has got to, in blocks of %d (%zu pulses, worst %.4f of a period)",
                  block, starts.size(), worst);
    EXPECT(starts.size() > 8 && worst < 0.01, label);
  }

  // Moving Rate, Target or Glide with a key held starts it again at that
  // sample, from Rate.
  {
    plain(device);
    device.set_param(p::kRate, 12.0f);
    device.set_param(p::kTarget, 3.0f);
    device.set_param(p::kGlide, 0.1f);
    device.note_on(1, 480.0f, 0.7f);
    render(device, 4.0f, kRate);
    const float before = device.meter(0);
    device.set_param(p::kTarget, 24.0f);
    const float armed = device.meter(0);
    Stereo out = render(device, 3.0f, kRate);
    const float half_way = device.meter(0);
    const std::vector<size_t> starts = pulse_starts(out.left, at(0.2));
    double worst = 0.0;
    for (size_t k = 0; k + 1 < starts.size(); ++k) {
      const double turns = glide_turns(12.0, 24.0, 6.0, (starts[k + 1] - 1) / static_cast<double>(kRate)) -
                           glide_turns(12.0, 24.0, 6.0, (starts[k] - 1) / static_cast<double>(kRate));
      worst = std::max(worst, std::fabs(turns - 1.0));
    }
    std::snprintf(label, sizeof label,
                  "Target moved with a key held starts the glide again from Rate at that sample (place %.3f, then %.3f, then %.3f; worst %.4f of a period)",
                  before, armed, half_way, worst);
    EXPECT(std::fabs(before - 0.6667f) < 0.001f && armed == 0.0f && std::fabs(half_way - 0.5f) < 0.001f && starts.size() > 20 && worst < 0.01,
           label);
  }

  // Armed with no key held it waits for the first key; a Glide of 0 is off.
  {
    plain(device);
    device.set_param(p::kTarget, 30.0f);
    device.set_param(p::kGlide, 0.05f);
    render(device, 1.0f, kRate);
    const float waiting = device.meter(0);
    device.note_on(1, 480.0f, 0.7f);
    render(device, 1.5f, kRate);
    const float half_way = device.meter(0);
    std::snprintf(label, sizeof label, "a glide armed in silence waits for the first key (place %.3f after a second, %.3f half way through)",
                  waiting, half_way);
    EXPECT(waiting == 0.0f && std::fabs(half_way - 0.5f) < 0.001f, label);

    Stereo off = held([](Isochronic& d) { d.set_param(p::kTarget, 30.0f); }, 480.0f, 4.0f);
    const size_t gaps = zero_runs(off.left, 64, at(2.0)).size();
    std::snprintf(label, sizeof label, "at Glide 0 the Target is not gone to (%zu gaps in two seconds at Rate 10)", gaps);
    EXPECT(gaps == 20 && device.meter(0) == 0.0f, label);
  }
}

// --- clicks ----------------------------------------------------------------------------------

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of sixteen
// places spread over one period of the pulse (ISOCHRONIC_PLACES=64 tries
// more), so a jump cannot hide in a gap or in a zero crossing. `setup`
// starts from init and strikes the keys.
//
// On a pulsed device an event that lands where a pulse is about to end has
// little left to change: its whole effect over the 20 ms is small, and a
// ratio against it reads the end of the pulse, not the event. A place where
// the event's whole effect is under a quarter of its largest effect at any
// place is therefore measured against that quarter. `plain`, if given,
// takes the ratio without that rule, each place against its own effect:
// Volume, a 5 ms smoothed gain and nothing else, reads 0.53 that way at one
// place in 64.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, double period, float rate = kRate, double* plain = nullptr) {
  static const int places = std::getenv("ISOCHRONIC_PLACES") ? std::atoi(std::getenv("ISOCHRONIC_PLACES")) : 16;
  std::vector<double> early(places, 0.0), whole(places, 0.0);
  double size = 0.0;
  for (int trial = 0; trial < places; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, static_cast<float>(0.5 + period * (trial + 0.37) / places + 0.0013 * (trial % 8)), rate);
      if (pass == 0) event(device);
      out[pass] = render(device, 0.02f, rate);
    }
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early[trial] = std::max(early[trial], difference);
      whole[trial] = std::max(whole[trial], difference);
    }
    size = std::max(size, whole[trial]);
  }
  double worst = 0.0, worst_plain = 0.0;
  for (int trial = 0; trial < places; ++trial) {
    if (whole[trial] <= 1.0e-6) continue;
    worst = std::max(worst, early[trial] / std::max(whole[trial], 0.25 * size));
    worst_plain = std::max(worst_plain, early[trial] / whole[trial]);
  }
  if (plain) *plain = worst_plain;
  return worst;
}

static void test_clicks() {
  char label[240];

  // Each control thrown from end to end and back while a low, pure key
  // sounds, at eight places in the pulse.
  struct Throw {
    int id;
    float from, to;
    const char* name;
  };
  const Throw throws[] = {
      {p::kRate, 0.5f, 40.0f, "Rate up"},        {p::kRate, 40.0f, 0.5f, "Rate down"},
      {p::kDuty, 0.1f, 0.9f, "Duty up"},         {p::kDuty, 0.9f, 0.1f, "Duty down"},
      {p::kEdge, 2.0f, 50.0f, "Edge up"},        {p::kEdge, 50.0f, 2.0f, "Edge down"},
      {p::kDepth, 0.0f, 1.0f, "Depth up"},       {p::kDepth, 1.0f, 0.0f, "Depth down"},
      {p::kOffset, 0.0f, 180.0f, "Offset up"},   {p::kOffset, 180.0f, 0.0f, "Offset down"},
      {p::kWarmth, 0.0f, 1.0f, "Warmth up"},     {p::kWarmth, 1.0f, 0.0f, "Warmth down"},
      {p::kAir, 0.0f, 1.0f, "Air up"},           {p::kAir, 1.0f, 0.0f, "Air down"},
      {p::kVolume, -48.0f, 6.0f, "Volume up"},   {p::kVolume, 6.0f, -48.0f, "Volume down"},
  };
  for (float rate : {48000.0f, 44100.0f}) {
    for (const Throw& t : throws) {
      const double period = t.id == p::kRate ? 1.0 / t.from : 0.1;
      double plain_ratio = 0.0;
      const double sudden = suddenness(
          [&](Isochronic& d) {
            plain(d, rate);
            d.set_param(p::kAttack, 0.05f);
            d.set_param(t.id, t.from);
            d.note_on(1, 110.0f, 0.5f);
          },
          [&](Isochronic& d) { d.set_param(t.id, t.to); }, period, rate, &plain_ratio);
      std::snprintf(label, sizeof label, "%.0f Hz: %s is not a click (%.3f of it in the first 8 samples; %.3f with each place against its own effect)",
                    rate, t.name, sudden, plain_ratio);
      MEASURED("%s", label);
      EXPECT(sudden < 0.15, label);
    }
  }

  // A glide armed again in mid flight sends the rate back to Rate at once:
  // half a second into three from 40 Hz down, the pulse is near 19 Hz.
  {
    const double sudden = suddenness(
        [](Isochronic& d) {
          plain(d);
          d.set_param(p::kAttack, 0.05f);
          d.set_param(p::kRate, 40.0f);
          d.set_param(p::kTarget, 0.5f);
          d.set_param(p::kGlide, 0.05f);
          d.note_on(1, 110.0f, 0.5f);
        },
        [](Isochronic& d) { d.set_param(p::kTarget, 1.0f); }, 0.05);
    std::snprintf(label, sizeof label, "a glide armed again in mid flight is not a click (%.3f)", sudden);
    MEASURED("%s", label);
    EXPECT(sudden < 0.15, label);
  }

  // A key let go at the shortest release, a key struck again, and a ninth
  // key that takes a voice.
  auto eight = [](Isochronic& d) {
    plain(d);
    d.set_param(p::kAttack, 0.05f);
    d.set_param(p::kDepth, 0.5f);
    for (int n = 0; n < 8; ++n) d.note_on(n, 110.0f + 13.0f * n, 0.5f);
  };
  auto one = [](Isochronic& d) {
    plain(d);
    d.set_param(p::kAttack, 0.05f);
    d.set_param(p::kDepth, 0.5f);
    d.note_on(1, 110.0f, 0.5f);
  };
  const double let_go = suddenness(one, [](Isochronic& d) { d.note_off(1); }, 0.1);
  const double again = suddenness(one, [](Isochronic& d) { d.note_on(1, 110.0f, 0.5f); }, 0.1);
  const double taken = suddenness(eight, [](Isochronic& d) { d.note_on(9, 97.0f, 0.5f); }, 0.1);
  const double again_full = suddenness(eight, [](Isochronic& d) { d.note_on(3, 149.0f, 0.5f); }, 0.1);
  std::snprintf(label, sizeof label,
                "no click when a key is let go (%.3f), struck again (%.3f), struck again in a full pool (%.3f) or takes a voice (%.3f)",
                let_go, again, again_full, taken);
  MEASURED("%s", label);
  EXPECT(let_go < 0.15 && again < 0.15 && again_full < 0.15 && taken < 0.15, label);
}

// --- cost ------------------------------------------------------------------------------------

static void test_cost() {
  char label[200];
  for (float rate : {48000.0f, 96000.0f}) {
    const float seconds = 20.0f;
    auto work = [&]() {
      device.init(rate);
      device.set_param(p::kWarmth, 1.0f);
      device.set_param(p::kAir, 0.5f);
      device.set_param(p::kOffset, 90.0f);
      device.set_param(p::kTarget, 4.0f);
      device.set_param(p::kGlide, 1.0f);
      for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
      const int blocks = static_cast<int>(seconds * rate / 128.0f);
      for (int b = 0; b < blocks; ++b) device.process(128);
    };
    const double started = cpu_seconds();
    report_cost(rate > 50000.0f ? "isochronic, 8 keys, tone and noise, 96 kHz" : "isochronic, 8 keys, tone and noise", seconds, rate, work);
    const double share = 100.0 * (cpu_seconds() - started) / seconds;
    std::printf("isochronic, 8 keys, tone and noise: %.2f%% of real time at %.0f kHz by CPU time (native)\n", share, rate / 1000.0);
    std::snprintf(label, sizeof label, "eight keys cost under 5 %% of real time at %.0f kHz by CPU time (%.2f %%)", rate / 1000.0, share);
    if (rate < 50000.0f) EXPECT(share < 5.0, label);
  }
}
