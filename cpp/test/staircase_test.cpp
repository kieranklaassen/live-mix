// Native harness for Staircase (cpp/devices/staircase). The conformance pass
// covers silence, determinism, a pile of keys and parameter abuse; the rest
// measures what makes it a staircase: partials an octave apart on the note,
// a glide at the rate Speed says with no seam where the stack wraps and no
// change of level, semitone steps on the equal-tempered grid, a chord walk
// that stays on the held notes and moves, the bell (Centre, Span), Slide,
// Shape, the second set and the width, then levels, clicks, block sizes,
// sleep and cost.

#include "../devices/staircase/staircase.h"
#include "support/test_kit.h"

#include <complex>
#include <functional>
#include <limits>

using namespace testkit;
using livemix::Staircase;
namespace p = livemix::staircase;

static Staircase device;
static Staircase other;

static const float kRate = 48000.0f;
enum { kGlide = 0, kSemitones = 1, kChord = 2 };

// One plain set, in mono, speaking and stopping at once, standing still.
static void plain(Staircase& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMotion, kGlide);
  d.set_param(p::kSpeed, 0.0f);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kSlide, 0.0f);
  d.set_param(p::kChorus, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }

// The `hz` component over [from, to), Hann-windowed, its phase counted from
// sample 0 of `x` so that two windows of a tone exactly on `hz` agree.
static std::complex<double> component(const std::vector<float>& x, double hz, double rate, size_t from,
                                      size_t to) {
  to = std::min(to, x.size());
  std::complex<double> sum = 0.0;
  double window_sum = 0.0;
  const size_t n = to - from;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    const double phase = 2.0 * kPi * hz * static_cast<double>(from + i) / rate;
    sum += w * x[from + i] * std::complex<double>(std::cos(phase), -std::sin(phase));
    window_sum += w;
  }
  return 2.0 * sum / window_sum;
}

// How far, in cents, the tone near `hz` is from `hz`, from the turn of its
// phase between two windows `hop` seconds apart (good to ±1/(2 hop) Hz).
static double cents_from(const std::vector<float>& x, double hz, double rate, double from_seconds,
                         double window_seconds = 0.2, double hop_seconds = 0.02) {
  const size_t from = at(from_seconds, rate), window = at(window_seconds, rate), hop = at(hop_seconds, rate);
  const std::complex<double> a = component(x, hz, rate, from, from + window);
  const std::complex<double> b = component(x, hz, rate, from + hop, from + hop + window);
  const double turned = std::arg(b * std::conj(a));
  const double off_hz = turned / (2.0 * kPi * static_cast<double>(hop) / rate);
  return 1200.0 * std::log2((hz + off_hz) / hz);
}

// The octave of `hz` nearest to `near`.
static double octave_near(double hz, double near) {
  return hz * std::pow(2.0, std::round(std::log2(near / hz)));
}

// Where the bell of a key is centred: on Centre at middle C, and half the
// way after the key from there (a key an octave up, half an octave up).
static double bell_of(double note, double centre = 440.0) {
  return std::min(6400.0, std::max(40.0, centre * std::sqrt(note / 261.6255653)));
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Where the power sits over log frequency: its centre (Hz) and its spread
// (octaves, one standard deviation).
static void centre_and_spread(const std::vector<float>& x, size_t from, double* centre_hz, double* spread) {
  const size_t n = 32768;
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = kRate / static_cast<double>(n);
  double total = 0.0, first = 0.0, second = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    const double octave = std::log2(static_cast<double>(i) * bin);
    total += power[i];
    first += power[i] * octave;
    second += power[i] * octave * octave;
  }
  const double mean_octave = first / total;
  *centre_hz = std::pow(2.0, mean_octave);
  *spread = std::sqrt(std::max(0.0, second / total - mean_octave * mean_octave));
}

// Share of the power further than `reach` bins from every octave of every
// pitch in `notes`, in dB (0 dB: all of it).
static double off_the_notes_db(const std::vector<float>& x, size_t from, size_t n,
                               const std::vector<double>& notes, double reach = 4.0) {
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = kRate / static_cast<double>(n);
  double off = 0.0, total = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    const double hz = static_cast<double>(i) * bin;
    bool on = false;
    for (double note : notes) {
      if (std::fabs(hz - octave_near(note, hz)) <= reach * bin) on = true;
    }
    total += power[i];
    if (!on) off += power[i];
  }
  return 10.0 * std::log10(std::max(off / total, 1.0e-20));
}

// Largest third difference: a band-limited tone leaves almost nothing in it,
// a step or a corner in the wave leaves about its own size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// How much of what an event changes is there at once: the same passage is
// rendered with and without the event, and the largest difference in the
// first 8 samples after the difference begins is held against the largest in
// the 20 ms after it. Worst of eight moments.
static double suddenness(const std::function<void(Staircase&)>& setup,
                         const std::function<void(Staircase&)>& event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float lead = 0.6f + 0.0137f * static_cast<float>(trial);
    setup(device);
    render(device, lead, kRate);
    event(device);
    Stereo with = render(device, 0.06f, kRate);
    setup(other);
    render(other, lead, kRate);
    Stereo without = render(other, 0.06f, kRate);
    size_t first = with.size();
    std::vector<double> change(with.size());
    for (size_t i = 0; i < with.size(); ++i) {
      change[i] = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                           std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (first == with.size() && change[i] > 1.0e-7) first = i;
    }
    if (first == with.size()) continue;
    double early = 0.0, all = 0.0;
    for (size_t i = first; i < std::min(with.size(), first + 960); ++i) {
      if (i < first + 8) early = std::max(early, change[i]);
      all = std::max(all, change[i]);
    }
    worst = std::max(worst, early / all);
  }
  return worst;
}

// Notes and knob moves at sample positions, rendered in blocks of `block`
// frames cut where an event falls. block 0 is a ragged mix of sizes.
struct Event {
  size_t at;
  int kind;  // 0 note on, 1 note off, 2 set param
  int id;
  float a, b;
};

static Stereo play(Staircase& d, const std::vector<Event>& events, size_t total, int block) {
  static const int kRagged[8] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0;
  int turn = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) {
      const Event& e = events[next++];
      if (e.kind == 0) d.note_on(e.id, e.a, e.b);
      if (e.kind == 1) d.note_off(e.id);
      if (e.kind == 2) d.set_param(e.id, e.a);
    }
    size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(kRagged[turn++ % 8]);
    frames = std::min(frames, total - done);
    if (next < events.size()) frames = std::min(frames, events[next].at - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static char label[240];

// --- standing still: on the note and its octaves -----------------------------------------

static void test_tuning() {
  double worst = 0.0, worst_sparse = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double note : {27.5, 82.41, 220.0, 392.0, 1046.5, 4186.0}) {
      plain(device, rate);
      device.note_on(1, static_cast<float>(note), 0.8f);
      const std::vector<float> x = mid(render(device, 0.7f, rate));
      const double near = octave_near(note, bell_of(note));
      for (double hz : {0.5 * near, near, 2.0 * near}) {
        EXPECT(tone_level(x, hz, rate, at(0.2, rate), at(0.6, rate)) > 0.01, "an octave of the note sounds");
        worst = std::max(worst, std::fabs(cents_from(x, hz, rate, 0.2)));
      }
      // Chord at rest: every third octave, the played one among them.
      plain(device, rate);
      device.set_param(p::kMotion, kChord);
      device.note_on(1, static_cast<float>(note), 0.8f);
      const std::vector<float> y = mid(render(device, 0.7f, rate));
      const double own = note * std::pow(8.0, std::round(std::log2(bell_of(note) / note) / 3.0));
      EXPECT(tone_level(y, own, rate, at(0.2, rate), at(0.6, rate)) > 0.01, "Chord: the note's own octave sounds");
      worst_sparse = std::max(worst_sparse, std::fabs(cents_from(y, own, rate, 0.2)));
    }
  }
  std::snprintf(label, sizeof label,
                "at Speed 0 the partials sit on the note and its octaves within 1 cent (worst %.4f, Chord %.4f)",
                worst, worst_sparse);
  EXPECT(worst < 1.0 && worst_sparse < 1.0, label);
  std::printf("tuning at rest: worst %.4f cents over 6 notes x 3 octaves x 3 rates (Chord: %.4f)\n", worst,
              worst_sparse);

  // Each voice has its own fraction of a cent, so that keys an octave apart
  // (the same partials) drift against each other and never cancel for good.
  plain(device);
  for (int n = 0; n < 16; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n / 16.0f), 0.8f);
  const std::vector<float> all = mid(render(device, 1.2f, kRate));
  double furthest = 0.0, closest = 1.0e9, last = 0.0;
  for (int n = 0; n < 16; ++n) {
    const double hz = octave_near(220.0 * std::pow(2.0, n / 16.0), 440.0);
    const double cents = cents_from(all, hz, kRate, 0.2, 0.9, 0.02);
    furthest = std::max(furthest, std::fabs(cents));
    if (n > 0) closest = std::min(closest, std::fabs(cents - last));
    last = cents;
  }
  std::snprintf(label, sizeof label, "sixteen voices are each within %.3f cents of the note and at least %.3f from the next",
                furthest, closest);
  EXPECT(furthest < 0.5 && closest > 0.05, label);
  std::printf("%s\n", label);

  // Between two octaves of the note there is nothing: the stack is octaves only.
  plain(device);
  device.note_on(1, 220.0f, 0.8f);
  const std::vector<float> x = mid(render(device, 0.7f, kRate));
  const double fifth = tone_level(x, 660.0, kRate, at(0.2), at(0.6));
  const double octave = tone_level(x, 440.0, kRate, at(0.2), at(0.6));
  std::snprintf(label, sizeof label, "pure tones an octave apart: a twelfth above is %.1f dB under the octave",
                db(octave / std::max(fifth, 1.0e-12)));
  EXPECT(fifth < 1.0e-4 * octave, label);
}

// --- Glide: the rate, the level over a turn, the seam ------------------------------------

static void test_glide_rate() {
  for (float speed : {1.0f, 0.5f, -0.7f, 0.3f}) {
    plain(device);
    device.set_param(p::kSpeed, speed);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 9.5f, kRate));
    // The law: the square of Speed, an octave in ten seconds at the end.
    const double per_second = 0.1 * speed * std::fabs(speed);
    const double f1 = 440.0 * std::pow(2.0, per_second * 1.0), f2 = 440.0 * std::pow(2.0, per_second * 9.0);
    const double lo = std::min(f1, f2) * 0.97, hi = std::max(f1, f2) * 1.03;
    const double m1 = dominant_frequency(x, kRate, lo, hi, at(0.95), at(1.05));
    const double m2 = dominant_frequency(x, kRate, lo, hi, at(8.95), at(9.05));
    const double measured = std::log2(m2 / m1) / 8.0 * 60.0, wanted = per_second * 60.0;
    std::snprintf(label, sizeof label, "Glide at Speed %.1f moves %.3f octaves a minute (wanted %.3f)", speed,
                  measured, wanted);
    EXPECT(std::fabs(measured - wanted) < 0.05 * std::fabs(wanted), label);
    EXPECT((measured > 0.0) == (speed > 0.0), "Glide rises for positive Speed and falls for negative");
    std::printf("%s\n", label);
  }
}

static void test_turn() {
  struct Case {
    float span, shape, width;
    const char* name;
  };
  // With Width up the mid is the same sound at a lower level; one turn later
  // the sides have changed places.
  const Case cases[] = {{5.0f, 0.25f, 0.0f, "Span 5"},
                        {2.0f, 0.0f, 0.0f, "Span 2"},
                        {8.0f, 1.0f, 0.0f, "Span 8, Shape 1"},
                        {5.0f, 0.25f, 1.0f, "Span 5, Width 1"}};
  for (const Case& c : cases) {
    plain(device);
    device.set_param(p::kSpeed, 1.0f);  // an octave in ten seconds
    device.set_param(p::kSpan, c.span);
    device.set_param(p::kShape, c.shape);
    device.set_param(p::kWidth, c.width);
    device.note_on(1, 220.0f, 0.8f);
    const Stereo out = render(device, 24.0f, kRate);
    const std::vector<float> x = mid(out);
    // Level over two turns, both channels together.
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = at(1.0); from + 12000 <= at(21.0); from += 6000) {
      const double l = rms(out.left, from, from + 12000), r = rms(out.right, from, from + 12000);
      const double level = std::sqrt(0.5 * (l * l + r * r));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    std::snprintf(label, sizeof label, "%s: the level over two turns of the stair stays within %.2f dB", c.name,
                  db(hi / lo));
    EXPECT(db(hi / lo) < 1.5, label);
    std::printf("%s\n", label);

    // One turn later every partial is where another was, at its level.
    double worst = 0.0, strongest = 0.0;
    int compared = 0;
    // From 270 Hz up: lower down, partials 0.1 s cannot tell apart leak into
    // each other at phases that are not the same a turn later.
    for (int k = 0; k <= 5; ++k) strongest = std::max(strongest, tone_level(x, 220.0 * std::pow(2.0, 0.3 + k), kRate, at(2.95), at(3.05)));
    for (int k = 0; k <= 5; ++k) {
      const double hz = 220.0 * std::pow(2.0, 0.3 + k);
      const double now = tone_level(x, hz, kRate, at(2.95), at(3.05));
      const double later = tone_level(x, hz, kRate, at(12.95), at(13.05));
      if (now < 0.003 * strongest) continue;
      worst = std::max(worst, std::fabs(db(later / now)));
      ++compared;
    }
    std::snprintf(label, sizeof label, "%s: one turn later the spectrum is the same (%d partials within %.3f dB)",
                  c.name, compared, worst);
    EXPECT(compared >= 1 && worst < 0.1, label);
    std::printf("%s\n", label);
  }

  // Each key has its own bell and climbs through it without a seam: a low
  // key and a high one, whose bells are an octave and more from Centre.
  for (double note : {55.0, 1046.5}) {
    plain(device);
    device.set_param(p::kSpeed, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, static_cast<float>(note), 0.8f);
    const Stereo out = render(device, 22.0f, kRate);
    double lo = 1.0e9, hi = 0.0, step_worst = 0.0;
    for (size_t from = at(1.0); from + 12000 <= at(21.0); from += 6000) {
      const double l = rms(out.left, from, from + 12000), r = rms(out.right, from, from + 12000);
      const double level = std::sqrt(0.5 * (l * l + r * r));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    // The largest step in any 40 ms of the two turns against the middle one.
    std::vector<double> steps;
    for (size_t from = at(1.0); from + 1920 <= at(21.0); from += 1920) steps.push_back(max_step(out.left, from, from + 1920));
    std::vector<double> sorted = steps;
    std::sort(sorted.begin(), sorted.end());
    step_worst = sorted.back() / sorted[sorted.size() / 2];
    double centre_hz = 0.0, spread = 0.0;
    centre_and_spread(mid(out), at(10.0), &centre_hz, &spread);
    std::snprintf(label, sizeof label,
                  "a key at %.0f Hz climbs two turns under its own bell (%.0f Hz, found at %.0f): level within %.2f dB, largest step %.2f of the usual",
                  note, bell_of(note), centre_hz, db(hi / lo), step_worst);
    EXPECT(db(hi / lo) < 1.5 && step_worst < 1.3 && std::fabs(std::log2(centre_hz / bell_of(note))) < 0.25, label);
    std::printf("%s\n", label);
  }

  // The seam: partial 0 passes 20 Hz when 0.4594 + 0.1 t reaches 1, and the
  // stack takes new indices. Rising and falling, nothing shows in the wave.
  for (float speed : {1.0f, -1.0f}) {
    plain(device);
    device.set_param(p::kSpeed, speed);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 7.0f, kRate));
    const double place = std::log2(220.0 / 10.0) - 4.0;
    const double wrap = speed > 0.0f ? (1.0 - place) / 0.1 : place / 0.1;
    const double step_seam = max_step(x, at(wrap - 0.02), at(wrap + 0.02));
    const double step_else = max_step(x, at(wrap - 0.5), at(wrap - 0.1));
    const double kink_seam = kink(x, at(wrap - 0.02), at(wrap + 0.02));
    const double kink_else = kink(x, at(wrap - 0.5), at(wrap - 0.1));
    std::snprintf(label, sizeof label,
                  "the wrap at %.3f s (Speed %+.0f) is seamless: step %.2f, third difference %.2f of the sound's own",
                  wrap, speed, step_seam / step_else, kink_seam / kink_else);
    EXPECT(step_seam < 1.15 * step_else && kink_seam < 1.3 * kink_else, label);
    std::printf("%s\n", label);
  }

  // The first key after a silence starts on the note again.
  plain(device);
  device.set_param(p::kSpeed, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 3.0f, kRate);  // 0.3 octaves up
  device.note_off(1);
  render(device, 1.0f, kRate);
  device.set_param(p::kSpeed, 0.0f);
  device.note_on(2, 220.0f, 0.8f);
  const std::vector<float> x = mid(render(device, 0.7f, kRate));
  const double off = cents_from(x, 440.0, kRate, 0.2);
  std::snprintf(label, sizeof label, "after a silence the climb starts from the note (%.4f cents)", off);
  EXPECT(std::fabs(off) < 1.0, label);
}

// --- Semitones -----------------------------------------------------------------------------

static void test_semitones() {
  for (float speed : {0.5f, -0.5f}) {  // one step a second
    plain(device);
    device.set_param(p::kMotion, kSemitones);
    device.set_param(p::kSpeed, speed);
    device.set_param(p::kSlide, 0.2f);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 15.0f, kRate));
    double worst = 0.0;
    for (int n = 0; n <= 14; ++n) {
      const double hz = octave_near(220.0 * std::pow(2.0, (speed > 0.0f ? n : -n) / 12.0), 440.0);
      worst = std::max(worst, std::fabs(cents_from(x, hz, kRate, n + 0.45)));
    }
    std::snprintf(label, sizeof label,
                  "Semitones (Speed %+.1f): between steps the pitch is on the equal-tempered step within %.4f cents over 14 steps",
                  speed, worst);
    EXPECT(worst < 3.0, label);
    std::printf("%s\n", label);
  }
}

// --- Chord ---------------------------------------------------------------------------------

static void test_chord() {
  // D minor ninth as the bank's chord phrase plays it.
  const std::vector<double> notes = {146.832, 220.0, 349.228, 523.251, 659.255};
  const double step_seconds = 1.0 / (4.0 * 0.35 * 0.35);  // four steps a second at Speed 1, by its square
  auto hold = [&](Staircase& d) {
    for (size_t n = 0; n < notes.size(); ++n) d.note_on(static_cast<int>(n), static_cast<float>(notes[n]), 0.8f);
  };
  plain(device);
  device.set_param(p::kMotion, kChord);
  device.set_param(p::kSpeed, 0.35f);
  device.set_param(p::kSlide, 0.1f);
  hold(device);
  const std::vector<float> x = mid(render(device, 13.0f, kRate));
  double worst = -200.0, lo = 1.0e9, hi = 0.0;
  for (int n = 0; n <= 5; ++n) {
    const size_t from = at(n * step_seconds + 0.3);
    worst = std::max(worst, off_the_notes_db(x, from, 65536, notes));
    const double level = rms(x, from, from + 65536);
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  std::snprintf(label, sizeof label,
                "Chord: between steps the energy off the held notes' pitch classes is %.1f dB down (six steps)", -worst);
  EXPECT(worst < -30.0, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label, "Chord: the level from step to step stays within %.2f dB", db(hi / lo));
  EXPECT(db(hi / lo) < 1.5, label);
  std::printf("%s\n", label);

  // The measure sees a sound that is off the notes: the same chord gliding.
  plain(device);
  device.set_param(p::kSpeed, 0.35f);
  hold(device);
  const std::vector<float> gliding = mid(render(device, 6.0f, kRate));
  const double off = off_the_notes_db(gliding, at(4.0), 65536, notes);
  std::snprintf(label, sizeof label, "the same chord in Glide is off the notes (%.1f dB down only)", -off);
  EXPECT(off > -10.0, label);

  // Two keys: each walks to the other's pitch class, up through the octaves.
  // C4 and G4 held; a key sounds every third octave, so the two come round
  // in six steps. 2 marks an octave half way out of the bell (not judged).
  const double c4 = 261.626, g4 = 391.995;
  const int up[7][6] = {{1, 0, 0, 1, 0, 0}, {0, 1, 0, 1, 0, 0}, {0, 1, 0, 0, 1, 0}, {0, 0, 1, 0, 1, 0},
                        {0, 0, 1, 0, 0, 1}, {1, 0, 0, 0, 0, 2}, {1, 0, 0, 1, 0, 0}};
  for (float speed : {0.5f, -0.5f}) {
    plain(device);
    device.set_param(p::kMotion, kChord);
    device.set_param(p::kSpeed, speed);
    device.note_on(1, static_cast<float>(c4), 0.8f);
    device.note_on(2, static_cast<float>(g4), 0.8f);
    const std::vector<float> y = mid(render(device, 7.0f, kRate));
    bool right = true;
    for (int n = 0; n <= 6; ++n) {
      const int* row = up[speed > 0.0f ? n : 6 - n];
      const double probe[6] = {c4, 2.0 * c4, 4.0 * c4, g4, 2.0 * g4, 4.0 * g4};
      for (int j = 0; j < 6; ++j) {
        const double level = tone_level(y, probe[j], kRate, at(n + 0.3), at(n + 0.8));
        if (row[j] == 2) continue;
        if (row[j] ? level < 0.03 : level > 0.0003) {
          right = false;
          std::printf("  step %d probe %d: level %g, wanted %s\n", n, j, level, row[j] ? "present" : "absent");
        }
      }
    }
    std::snprintf(label, sizeof label, "Chord (Speed %+.1f): two keys walk through each other's notes and octaves, round in six steps", speed);
    EXPECT(right, label);
  }

  // One key steps by octaves, and it reads as a climb: 220, 440, 880 Hz and
  // round again, so at each step most of the sound is found an octave higher
  // and none of it an octave lower. Falling is the same figure backwards.
  // (With every second octave sounding, the two were the same sound.)
  for (float speed : {0.5f, -0.5f}) {
    plain(device);
    device.set_param(p::kMotion, kChord);
    device.set_param(p::kSpeed, speed);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> one = mid(render(device, 7.0f, kRate));
    std::vector<std::vector<double>> held(7);
    bool figure = true;
    for (int n = 0; n <= 6; ++n) {
      for (double hz = 27.5; hz < 8000.0; hz *= 2.0) held[n].push_back(tone_level(one, hz, kRate, at(n + 0.3), at(n + 0.8)));
      // 27.5 Hz is index 0: 220, 440 and 880 Hz are 3, 4 and 5.
      const int strong = 3 + ((speed > 0.0f ? n : 6 - n) % 3);
      for (int k = 3; k <= 5; ++k) {
        if (k == strong ? held[n][k] < 0.03 : held[n][k] > 0.0003) figure = false;
      }
    }
    double higher = 0.0, lower = 0.0, total = 0.0;
    for (int n = 0; n < 6; ++n) {
      for (size_t k = 0; k < held[n].size(); ++k) {
        total += held[n][k];
        if (k + 1 < held[n].size()) higher += std::min(held[n][k], held[n + 1][k + 1]);
        if (k > 0) lower += std::min(held[n][k], held[n + 1][k - 1]);
      }
    }
    std::snprintf(label, sizeof label,
                  "Chord (Speed %+.1f): one held key steps by octaves, %.2f of the sound found an octave higher at each step and %.2f an octave lower",
                  speed, higher / total, lower / total);
    if (speed > 0.0f) {
      EXPECT(figure && higher > 0.6 * total && lower < 0.05 * total, label);
    } else {
      EXPECT(figure && lower > 0.6 * total && higher < 0.05 * total, label);
    }
    std::printf("%s\n", label);
  }

  // Span at its narrowest. A key that sounds every third octave under a bell
  // two octaves wide would be silent whenever none of them is inside it:
  // Chord keeps the bell four octaves wide, so one always is.
  plain(device);
  device.set_param(p::kMotion, kChord);
  device.set_param(p::kSpeed, 0.5f);
  device.set_param(p::kSpan, 2.0f);
  device.note_on(1, 220.0f, 0.8f);
  const std::vector<float> narrow = mid(render(device, 4.0f, kRate));
  double quiet = 1.0e9, loud = 0.0;
  for (int n = 0; n <= 3; ++n) {
    const double level = rms(narrow, at(n + 0.3), at(n + 0.8));
    quiet = std::min(quiet, level);
    loud = std::max(loud, level);
  }
  std::snprintf(label, sizeof label, "Chord at Span 2: the level from step to step stays within %.2f dB",
                db(loud / std::max(quiet, 1.0e-12)));
  EXPECT(quiet > 0.01 && db(loud / quiet) < 1.5, label);
  std::printf("%s\n", label);

  // At Slide 0 a step of an octave moves no partial: the octaves that sound
  // change places over a few milliseconds, and the wave has no corner in it.
  // Six keys, so that it does not hang on where in its cycle one was caught.
  double corner = 0.0;
  for (int n = 0; n < 6; ++n) {
    plain(device);
    device.set_param(p::kMotion, kChord);
    device.set_param(p::kSpeed, 0.5f);
    device.note_on(1, 196.0f * std::pow(2.0f, n / 6.0f), 0.8f);
    const std::vector<float> stepped = mid(render(device, 1.1f, kRate));
    // A key is one low tone here, with almost no third difference of its
    // own, so the corner is held against the size of the wave: a swap made
    // at once would leave about that size.
    corner = std::max(corner, kink(stepped, at(0.98), at(1.03)) / peak(stepped, at(0.5), at(0.9)));
  }
  std::snprintf(label, sizeof label, "an octave step at Slide 0 is a crossfade (third difference %.4f of the wave's peak)", corner);
  EXPECT(corner < 0.03, label);
  std::printf("%s\n", label);

  // Switched to from a glide that has left the notes, Chord and Semitones
  // pull the climb back onto them.
  for (int to : {kChord, kSemitones}) {
    plain(device);
    device.set_param(p::kSpeed, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 3.3f, kRate);  // 0.33 octaves up: 396 cents
    device.set_param(p::kSpeed, 0.0f);
    device.set_param(p::kMotion, static_cast<float>(to));
    const std::vector<float> landed = mid(render(device, 1.0f, kRate));
    const double hz = to == kChord ? 220.0 : 440.0 * std::pow(2.0, 4.0 / 12.0);
    const double off = cents_from(landed, hz, kRate, 0.5);
    std::snprintf(label, sizeof label, "switched to %s mid-glide, the climb lands on the %s (%.4f cents)",
                  to == kChord ? "Chord" : "Semitones", to == kChord ? "note" : "nearest semitone", off);
    EXPECT(std::fabs(off) < 1.0 && tone_level(landed, hz, kRate, at(0.5), at(0.9)) > 0.01, label);
  }

  // A key that is released keeps walking with the rest while it fades.
  plain(device);
  device.set_param(p::kMotion, kChord);
  device.set_param(p::kSpeed, 0.5f);
  device.set_param(p::kRelease, 6.0f);
  device.note_on(1, static_cast<float>(c4), 0.8f);
  device.note_on(2, static_cast<float>(g4), 0.8f);
  render(device, 0.5f, kRate);
  device.note_off(2);  // only C is held now
  const std::vector<float> fading = mid(render(device, 2.5f, kRate));
  const double off_c = off_the_notes_db(fading, at(1.0), 16384, {c4}, 6.0);
  std::snprintf(label, sizeof label, "Chord: a released key moves onto the note still held (%.1f dB off it)", -off_c);
  EXPECT(off_c < -30.0, label);
}

// --- the bell: Centre and Span -----------------------------------------------------------

static void test_bell() {
  double centre[2], spread = 0.0;
  const float wanted[2] = {150.0f, 1500.0f};
  for (int i = 0; i < 2; ++i) {
    plain(device);
    device.set_param(p::kCentre, wanted[i]);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 1.2f, kRate));
    centre_and_spread(x, at(0.3), &centre[i], &spread);
    std::snprintf(label, sizeof label, "Centre %.0f Hz: the power of A3 is centred on %.0f Hz (its bell on %.0f)",
                  wanted[i], centre[i], bell_of(220.0, wanted[i]));
    EXPECT(std::fabs(std::log2(centre[i] / bell_of(220.0, wanted[i]))) < 0.2, label);
    std::printf("%s\n", label);
  }
  EXPECT(centre[1] > 6.0 * centre[0], "Centre moves the centroid");

  // A higher key sounds higher. The C of every octave is the same stack of
  // partials; what tells them apart is the bell, which follows the key by
  // half: on Centre at middle C, an octave higher for a key two octaves up.
  double of_c[5];
  for (int octave = 0; octave < 5; ++octave) {
    plain(device);
    device.note_on(1, static_cast<float>(65.4064 * std::pow(2.0, octave)), 0.8f);
    const std::vector<float> x = mid(render(device, 1.2f, kRate));
    centre_and_spread(x, at(0.3), &of_c[octave], &spread);
  }
  bool rising = true;
  for (int octave = 1; octave < 5; ++octave) rising = rising && of_c[octave] > 1.3 * of_c[octave - 1];
  std::snprintf(label, sizeof label,
                "a higher key sounds higher: C2 to C6 are centred on %.0f, %.0f, %.0f, %.0f and %.0f Hz, two octaves up %.2f and %.2f times",
                of_c[0], of_c[1], of_c[2], of_c[3], of_c[4], of_c[4] / of_c[2], of_c[2] / of_c[0]);
  EXPECT(rising && std::fabs(std::log2(of_c[2] / 440.0)) < 0.1 && of_c[4] > 1.8 * of_c[2] && of_c[4] < 2.2 * of_c[2] &&
             of_c[2] > 1.8 * of_c[0] && of_c[2] < 2.2 * of_c[0],
         label);
  std::printf("%s\n", label);

  // The bell is the key's, not the climb's: a key that has glided half an
  // octave up is centred where it was.
  double before = 0.0, after = 0.0;
  plain(device);
  device.set_param(p::kSpeed, 1.0f);
  device.note_on(1, 1046.5f, 0.8f);
  const std::vector<float> climbing = mid(render(device, 6.0f, kRate));
  centre_and_spread(climbing, at(0.1), &before, &spread);
  centre_and_spread(climbing, at(5.0), &after, &spread);
  std::snprintf(label, sizeof label, "a gliding key keeps its bell: C6 is centred on %.0f Hz, and on %.0f Hz half an octave on (bell %.0f)",
                before, after, bell_of(1046.5));
  EXPECT(std::fabs(std::log2(after / before)) < 0.1 && std::fabs(std::log2(before / bell_of(1046.5))) < 0.15, label);
  std::printf("%s\n", label);

  // Whatever the bell says, nothing sounds under 20 Hz: with the bell as low
  // and wide as it goes, the partial at 13.75 Hz is not there.
  plain(device);
  device.set_param(p::kCentre, 80.0f);
  device.set_param(p::kSpan, 8.0f);
  device.note_on(1, 220.0f, 0.8f);
  const std::vector<float> low = mid(render(device, 2.5f, kRate));
  const double under = tone_level(low, 13.75, kRate, at(0.5), at(2.5)), lowest = tone_level(low, 55.0, kRate, at(0.5), at(2.5));
  std::snprintf(label, sizeof label, "nothing sounds under 20 Hz (13.75 Hz is %.1f dB under 55 Hz)", db(lowest / std::max(under, 1.0e-12)));
  EXPECT(lowest > 0.01 && under < 1.0e-3 * lowest, label);

  // The bell is a raised cosine over octaves: at Span 5 a partial one octave
  // from the centre is at 0.655 of the one on it, two octaves at 0.095.
  // Middle C, whose bell is on Centre, with Centre on the C above it.
  const double c5 = 2.0 * 261.6255653;
  plain(device);
  device.set_param(p::kCentre, static_cast<float>(c5));
  device.set_param(p::kSpan, 5.0f);
  device.note_on(1, 261.6255653f, 0.8f);
  const std::vector<float> bell = mid(render(device, 1.0f, kRate));
  const double on = tone_level(bell, c5, kRate, at(0.3), at(0.9));
  const double one_off = tone_level(bell, 0.5 * c5, kRate, at(0.3), at(0.9)) / on, one_up = tone_level(bell, 2.0 * c5, kRate, at(0.3), at(0.9)) / on;
  const double two_off = tone_level(bell, 0.25 * c5, kRate, at(0.3), at(0.9)) / on, three_off = tone_level(bell, 0.125 * c5, kRate, at(0.3), at(0.9)) / on;
  std::snprintf(label, sizeof label, "the bell: %.3f and %.3f one octave from the centre, %.3f two below, %.4f three below",
                one_off, one_up, two_off, three_off);
  EXPECT(std::fabs(one_off - 0.6545) < 0.01 && std::fabs(one_up - 0.6545) < 0.01 && std::fabs(two_off - 0.0955) < 0.005 &&
             three_off < 1.0e-3,
         label);
  std::printf("%s\n", label);

  double spreads[2];
  int counts[2];
  const float spans[2] = {2.0f, 8.0f};
  for (int i = 0; i < 2; ++i) {
    plain(device);
    device.set_param(p::kSpan, spans[i]);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 1.2f, kRate));
    double hz = 0.0;
    centre_and_spread(x, at(0.3), &hz, &spreads[i]);
    double strongest = 0.0;
    for (int k = -4; k <= 6; ++k) strongest = std::max(strongest, tone_level(x, 220.0 * std::pow(2.0, k), kRate, at(0.3), at(0.9)));
    counts[i] = 0;
    for (int k = -4; k <= 6; ++k) {
      if (tone_level(x, 220.0 * std::pow(2.0, k), kRate, at(0.3), at(0.9)) > 0.01 * strongest) ++counts[i];
    }
  }
  std::snprintf(label, sizeof label,
                "Span 2 sounds %d octave(s) spread over %.2f octaves, Span 8 sounds %d spread over %.2f", counts[0],
                spreads[0], counts[1], spreads[1]);
  EXPECT(counts[0] <= 2 && counts[1] >= 6 && spreads[0] < 0.3 && spreads[1] > 0.8, label);
  std::printf("%s\n", label);
}

// --- Slide ---------------------------------------------------------------------------------

static void test_slide() {
  // Semitones, one step a second, the first at 1 s. 440 Hz is the partial followed.
  auto run = [&](float slide) {
    plain(device);
    device.set_param(p::kMotion, kSemitones);
    device.set_param(p::kSpeed, 0.5f);
    device.set_param(p::kSlide, slide);
    device.note_on(1, 220.0f, 0.8f);
    return mid(render(device, 2.2f, kRate));
  };
  auto cents_at = [&](const std::vector<float>& x, double seconds) {
    const double hz = dominant_frequency(x, kRate, 425.0, 485.0, at(seconds - 0.03), at(seconds + 0.03));
    return 1200.0 * std::log2(hz / 440.0);
  };
  const std::vector<float> at_once = run(0.0f);
  const double before = cents_at(at_once, 0.96), after = cents_at(at_once, 1.04);
  std::snprintf(label, sizeof label, "Slide 0 steps at once: %.1f cents 40 ms before the step, %.1f cents 40 ms after", before, after);
  EXPECT(std::fabs(before) < 3.0 && std::fabs(after - 100.0) < 3.0, label);
  std::printf("%s\n", label);
  // The wave itself has no step where the pitch jumps.
  const double step_ratio = max_step(at_once, at(0.99), at(1.02)) / max_step(at_once, at(0.5), at(0.9));
  std::snprintf(label, sizeof label, "a step at Slide 0 leaves no jump in the wave (%.2f of the sound's own)", step_ratio);
  EXPECT(step_ratio < 1.25, label);

  const std::vector<float> half = run(0.5f);
  const double quarter = cents_at(half, 1.25), arrived = cents_at(half, 1.75);
  std::snprintf(label, sizeof label, "Slide 0.5 moves for half the step: %.1f cents at a quarter, %.1f at three quarters", quarter, arrived);
  EXPECT(std::fabs(quarter - 50.0) < 6.0 && std::fabs(arrived - 100.0) < 3.0, label);
  std::printf("%s\n", label);

  const std::vector<float> glides = run(1.0f);
  const double a = cents_at(glides, 1.25), b = cents_at(glides, 1.5), c = cents_at(glides, 1.75);
  std::snprintf(label, sizeof label, "Slide 1 glides the whole step: %.1f, %.1f and %.1f cents at 1/4, 1/2 and 3/4", a, b, c);
  EXPECT(std::fabs(a - 25.0) < 5.0 && std::fabs(b - 50.0) < 5.0 && std::fabs(c - 75.0) < 5.0, label);
  std::printf("%s\n", label);
}

// --- Shape ---------------------------------------------------------------------------------

static void test_shape() {
  auto run = [&](float shape) {
    plain(device);
    device.set_param(p::kShape, shape);
    device.note_on(1, 220.0f, 0.8f);
    return mid(render(device, 1.0f, kRate));
  };
  const std::vector<float> pure = run(0.0f), reed = run(1.0f);
  auto level = [&](const std::vector<float>& x, double hz) { return tone_level(x, hz, kRate, at(0.3), at(0.9)); };
  const double f = level(reed, 440.0);
  const double third = level(reed, 1320.0) / f, fifth = level(reed, 2200.0) / f, seventh = level(reed, 3080.0) / f;
  std::snprintf(label, sizeof label,
                "Shape 1 adds harmonics 3, 5 and 7 to a partial at %.3f, %.3f and %.3f of it (0.55, 0.35, 0.22)", third,
                fifth, seventh);
  EXPECT(std::fabs(third - 0.55) < 0.02 && std::fabs(fifth - 0.35) < 0.02 && std::fabs(seventh - 0.22) < 0.02, label);
  std::printf("%s\n", label);
  const double pure_third = level(pure, 1320.0) / level(pure, 440.0);
  std::snprintf(label, sizeof label, "Shape 0 is pure tones (harmonic 3 at %.1f dB)", db(pure_third));
  EXPECT(pure_third < 1.0e-4, label);
  const double change = db(rms(reed, at(0.3)) / rms(pure, at(0.3)));
  std::snprintf(label, sizeof label, "Shape does not change the loudness (%.2f dB)", change);
  EXPECT(std::fabs(change) < 0.2, label);
  const double bright = energy_above(reed, 1500.0, kRate, at(0.3)), dull = energy_above(pure, 1500.0, kRate, at(0.3));
  std::snprintf(label, sizeof label, "Shape brightens: %.3f of the power above 1.5 kHz at 1, %.3f at 0", bright, dull);
  EXPECT(bright > 2.0 * dull, label);
  std::printf("%s\n", label);

  // No overtone is made above the band: harmonics 5 and 7 of the 5 kHz
  // partial would fold to 19.1 and 9.1 kHz at 44.1 kHz.
  plain(device, 44100.0f);
  device.set_param(p::kShape, 1.0f);
  device.set_param(p::kCentre, 3200.0f);
  device.note_on(1, 625.0f, 0.8f);
  const std::vector<float> high = mid(render(device, 1.0f, 44100.0f));
  const double strongest = tone_level(high, 2500.0, 44100.0, 13230, 39690);
  const double folded = std::max(tone_level(high, 19100.0, 44100.0, 13230, 39690), tone_level(high, 9100.0, 44100.0, 13230, 39690));
  std::snprintf(label, sizeof label, "overtones that would pass Nyquist are left out (folded %.1f dB under the partial)",
                db(strongest / std::max(folded, 1.0e-12)));
  EXPECT(folded < 1.0e-4 * strongest, label);
  std::printf("%s\n", label);
}

// --- Chorus and Width ----------------------------------------------------------------------

static void test_chorus_and_width() {
  auto run = [&](float chorus, float width, float seconds) {
    plain(device);
    device.set_param(p::kChorus, chorus);
    device.set_param(p::kWidth, width);
    device.note_on(1, 220.0f, 0.8f);
    return render(device, seconds, kRate);
  };
  const Stereo one = run(0.0f, 0.0f, 12.0f), two = run(1.0f, 0.0f, 12.0f);
  // The second set alone: what Chorus 1 adds to the first at its level there
  // (the second set is at half the level of the first: 1 / sqrt(1.25) each).
  std::vector<float> second(one.size());
  for (size_t i = 0; i < second.size(); ++i) second[i] = two.left[i] * 1.11803399f - one.left[i];
  double lowest = 1.0e9, highest = -1.0e9;
  for (double t = 0.5; t < 11.5; t += 0.1) {
    const double cents = cents_from(second, 440.0, kRate, t, 0.1, 0.02);
    lowest = std::min(lowest, cents);
    highest = std::max(highest, cents);
  }
  std::snprintf(label, sizeof label, "Chorus: the second set drifts from %.1f to %+.1f cents around the first", lowest, highest);
  EXPECT(lowest < -3.0 && lowest > -12.0 && highest > 3.0 && highest < 12.0, label);
  std::printf("%s\n", label);
  double lo[2] = {1.0e9, 1.0e9}, hi[2] = {0.0, 0.0};
  for (size_t from = at(0.5); from + 4800 <= at(11.5); from += 2400) {
    const double levels[2] = {tone_level(one.left, 880.0, kRate, from, from + 4800), tone_level(two.left, 880.0, kRate, from, from + 4800)};
    for (int i = 0; i < 2; ++i) {
      lo[i] = std::min(lo[i], levels[i]);
      hi[i] = std::max(hi[i], levels[i]);
    }
  }
  std::snprintf(label, sizeof label, "one set is steady (%.3f dB), two beat against each other (%.1f dB)", db(hi[0] / lo[0]), db(hi[1] / lo[1]));
  EXPECT(hi[0] < 1.01 * lo[0] && hi[1] > 1.5 * lo[1], label);
  std::printf("%s\n", label);
  const double change = db(rms(two.left, at(0.5)) / rms(one.left, at(0.5)));
  std::snprintf(label, sizeof label, "Chorus keeps the level (%.2f dB)", change);
  EXPECT(std::fabs(change) < 1.0, label);
  EXPECT(two.left == two.right, "Width 0 is mono, with the second set too");

  // The two sets never cancel. One key in Chord is a single partial, the
  // barest there is: at Chorus 1 and in mono its loudness swells and sinks
  // by 9.5 dB at most (two sets at one level sank by 22 dB).
  plain(device);
  device.set_param(p::kMotion, kChord);
  device.set_param(p::kChorus, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  const std::vector<float> bare = mid(render(device, 24.0f, kRate));
  double sunk = 1.0e9, swollen = 0.0;
  for (size_t from = at(1.0); from + 9600 <= bare.size(); from += 2400) {
    const double level = rms(bare, from, from + 9600);
    sunk = std::min(sunk, level);
    swollen = std::max(swollen, level);
  }
  std::snprintf(label, sizeof label, "Chorus 1 on one bare partial: its loudness moves over %.1f dB and never cancels", db(swollen / sunk));
  EXPECT(db(swollen / sunk) < 10.0 && db(swollen / sunk) > 3.0, label);
  std::printf("%s\n", label);

  // Width: neighbouring octaves on opposite sides, half way out at most.
  const Stereo wide = run(0.0f, 1.0f, 1.0f);
  bool panned = true;
  for (double hz : {110.0, 220.0, 440.0, 880.0}) {
    const double pan = (hz == 220.0 || hz == 880.0) ? 0.5 : -0.5;
    const double ratio = tone_level(wide.left, hz, kRate, at(0.3), at(0.9)) / tone_level(wide.right, hz, kRate, at(0.3), at(0.9));
    if (std::fabs(ratio / ((1.0 + pan) / (1.0 - pan)) - 1.0) > 0.03) {
      panned = false;
      std::printf("  %.0f Hz: left/right %.3f, wanted %.3f\n", hz, ratio, (1.0 + pan) / (1.0 - pan));
    }
  }
  EXPECT(panned, "Width 1 puts neighbouring octaves on opposite sides, three to one");
  const double l = rms(wide.left, at(0.3)), r = rms(wide.right, at(0.3)), m = rms(one.left, at(0.3));
  const double total = db(std::sqrt(0.5 * (l * l + r * r)) / m);
  std::snprintf(label, sizeof label, "Width keeps the power of the two channels together (%.2f dB)", total);
  EXPECT(std::fabs(total) < 0.2, label);

  // Chord: a key is one or two partials and sits on one side, a third of
  // the way out at most (under 6 dB between the sides for a key alone), and
  // the keys of a chord are shared out between the two sides.
  double alone = 0.0, together = 0.0;
  for (int n = 0; n < 12; ++n) {
    plain(device);
    device.set_param(p::kMotion, kChord);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 196.0f * std::pow(2.0f, static_cast<float>(n) / 12.0f), 0.8f);
    const Stereo solo = render(device, 0.6f, kRate);
    alone = std::max(alone, std::fabs(db(rms(solo.left, at(0.2)) / rms(solo.right, at(0.2)))));
  }
  const float chords[3][5] = {{146.83f, 220.0f, 349.23f, 523.25f, 659.26f},
                              {261.63f, 329.63f, 392.0f, 0.0f, 0.0f},
                              {130.81f, 261.63f, 523.25f, 1046.5f, 0.0f}};
  for (const float* keys : chords) {
    plain(device);
    device.set_param(p::kMotion, kChord);
    device.set_param(p::kWidth, 1.0f);
    for (int n = 0; n < 5; ++n) {
      if (keys[n] > 0.0f) device.note_on(n, keys[n], 0.8f);
    }
    const Stereo held = render(device, 1.5f, kRate);
    together = std::max(together, std::fabs(db(rms(held.left, at(0.2)) / rms(held.right, at(0.2)))));
  }
  std::snprintf(label, sizeof label, "Chord at Width 1: a key alone is %.1f dB to one side at most, a chord %.1f dB", alone, together);
  EXPECT(alone > 3.0 && alone < 6.0 && together < 3.0, label);
  std::printf("%s\n", label);

  // As it climbs a narrow stack winds from one side to the other and back.
  plain(device);
  device.set_param(p::kSpeed, 1.0f);
  device.set_param(p::kSpan, 2.0f);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  const Stereo winding = render(device, 21.0f, kRate);
  double leftmost = 0.0, rightmost = 0.0;
  for (size_t from = at(0.5); from + 24000 <= winding.size(); from += 24000) {
    const double a = rms(winding.left, from, from + 24000), b = rms(winding.right, from, from + 24000);
    leftmost = std::max(leftmost, (a - b) / (a + b));
    rightmost = std::max(rightmost, (b - a) / (a + b));
  }
  std::snprintf(label, sizeof label, "a narrow stack sways as it climbs two octaves: balance %.2f to the left and %.2f to the right", leftmost, rightmost);
  EXPECT(leftmost > 0.3 && rightmost > 0.3, label);
  std::printf("%s\n", label);
}

// --- envelope, touch, levels ---------------------------------------------------------------

static void test_envelope_and_levels() {
  plain(device);
  device.set_param(p::kAttack, 1.0f);
  device.set_param(p::kRelease, 1.0f);
  device.note_on(1, 220.0f, 1.0f);
  Stereo rise = render(device, 2.0f, kRate);
  const double full = rms(rise.left, at(1.5), at(2.0));
  EXPECT(rms(rise.left, 0, at(0.1)) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
  EXPECT(rms(rise.left, at(1.1), at(1.2)) > 0.9 * full, "and has arrived shortly after 1 s");
  device.note_off(1);
  Stereo fall = render(device, 3.0f, kRate);
  EXPECT(rms(fall.left, at(0.4), at(0.5)) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
  EXPECT(rms(fall.left, at(1.0), at(1.1)) < 0.002 * full, "is 60 dB down after its time");
  EXPECT(peak(fall.left, at(2.0)) == 0.0 && peak(fall.right, at(2.0)) == 0.0, "and is exactly silent soon after");

  // The default patch, as the app plays it.
  double quietest = 0.0, loudest = -200.0, slowest = 0.0, level_lo = 1.0e9, level_hi = 0.0;
  for (float note : {27.5f, 65.41f, 220.0f, 659.26f, 4186.0f}) {
    device.init(kRate);
    device.note_on(1, note, 0.7f);
    Stereo out = render(device, 4.0f, kRate);
    const double p_db = db(std::max(peak(out.left), peak(out.right)));
    quietest = std::min(quietest, p_db);
    loudest = std::max(loudest, p_db);
    size_t first = 0;
    while (first < out.size() && std::fabs(out.left[first]) < 1.0e-3 && std::fabs(out.right[first]) < 1.0e-3) ++first;
    slowest = std::max(slowest, static_cast<double>(first) / kRate);
    const double level = rms(mid(out), at(1.0));
    level_lo = std::min(level_lo, level);
    level_hi = std::max(level_hi, level);
  }
  std::snprintf(label, sizeof label,
                "one key at gain 0.7 peaks between %.1f and %.1f dBFS at the default volume, from 27.5 Hz to 4.2 kHz",
                quietest, loudest);
  EXPECT(quietest > -24.0 && loudest < -10.0, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label, "a key is heard (-60 dBFS) within %.1f ms", 1000.0 * slowest);
  EXPECT(slowest < 0.03, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label, "every key is as loud as any other (%.2f dB between them)", db(level_hi / level_lo));
  EXPECT(db(level_hi / level_lo) < 1.0, label);

  // A 100 ms note makes sound.
  device.init(kRate);
  device.note_on(1, 220.0f, 0.8f);
  Stereo brief = render(device, 0.1f, kRate);
  device.note_off(1);
  EXPECT(peak(brief.left) > 0.01, "a 100 ms note is heard");

  // Touch.
  device.init(kRate);
  device.note_on(1, 220.0f, 1.0f);
  Stereo loud = render(device, 1.5f, kRate);
  device.init(kRate);
  device.note_on(1, 220.0f, 0.1f);
  Stereo soft = render(device, 1.5f, kRate);
  const double touch = rms(soft.left, at(0.7)) / rms(loud.left, at(0.7));
  std::snprintf(label, sizeof label, "a soft key is %.1f dB under a hard one", -db(touch));
  EXPECT(touch < 0.6 && touch > 0.2, label);
  std::printf("%s\n", label);

  // Ten held keys stay under the soft clip's knee at the default volume.
  double ten = 0.0;
  for (int chord = 0; chord < 2; ++chord) {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) {
      const float hz = chord == 0 ? 110.0f * std::pow(2.0f, n * 3 / 12.0f) : 98.0f * std::pow(2.0f, n * 5 / 12.0f);
      device.note_on(n, hz, 0.8f);
    }
    Stereo out = render(device, 8.0f, kRate);
    ten = std::max(ten, std::max(peak(out.left), peak(out.right)));
  }
  std::snprintf(label, sizeof label, "ten held keys peak at %.3f, under the clip knee at 0.5", ten);
  EXPECT(ten < 0.5, label);
  std::printf("%s\n", label);

  // And the clip is there when they do not.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 1.0f);
  Stereo hot = render(device, 3.0f, kRate);
  const double hot_peak = std::max(peak(hot.left), peak(hot.right));
  std::snprintf(label, sizeof label, "sixteen keys at +6 dB are held by the soft clip (peak %.3f)", hot_peak);
  EXPECT(hot_peak > 0.8 && hot_peak <= 1.0, label);
}

// --- no clicks -----------------------------------------------------------------------------

static void test_clicks() {
  // A soft chord, all controls in the middle.
  auto chord = [](Staircase& d) {
    d.init(kRate);
    d.set_param(p::kMotion, kGlide);
    d.set_param(p::kSpeed, 0.0f);
    d.set_param(p::kAttack, 0.005f);
    d.set_param(p::kRelease, 0.05f);
    d.note_on(1, 146.83f, 0.8f);
    d.note_on(2, 220.0f, 0.8f);
    d.note_on(3, 349.23f, 0.8f);
  };
  struct Throw {
    const char* name;
    int id;
    float from, to;
  };
  const Throw throws[] = {
      {"Centre", p::kCentre, 80.0f, 3200.0f}, {"Span", p::kSpan, 2.0f, 8.0f},     {"Shape", p::kShape, 0.0f, 1.0f},
      {"Chorus", p::kChorus, 0.0f, 1.0f},     {"Width", p::kWidth, 0.0f, 1.0f},   {"Volume", p::kVolume, -30.0f, 0.0f},
      {"Speed", p::kSpeed, -1.0f, 1.0f},
  };
  for (const Throw& t : throws) {
    for (int way = 0; way < 2; ++way) {
      const float from = way == 0 ? t.from : t.to, to = way == 0 ? t.to : t.from;
      const double sudden = suddenness(
          [&](Staircase& d) {
            chord(d);
            d.set_param(t.id, from);
          },
          [&](Staircase& d) { d.set_param(t.id, to); });
      std::snprintf(label, sizeof label, "%s thrown from %g to %g arrives gradually (%.3f at once)", t.name, from, to, sudden);
      EXPECT(sudden < 0.15, label);
      std::printf("%s\n", label);
    }
  }
  // Motion switched while the climb is between notes: Glide to Chord pulls
  // the stack onto the notes and thins it; back again fills it in.
  for (int to : {kChord, kSemitones}) {
    const double sudden = suddenness(
        [&](Staircase& d) {
          chord(d);
          d.set_param(p::kSpeed, 0.8f);
        },
        [&](Staircase& d) { d.set_param(p::kMotion, static_cast<float>(to)); });
    std::snprintf(label, sizeof label, "Motion switched from Glide to %s arrives gradually (%.3f at once)",
                  to == kChord ? "Chord" : "Semitones", sudden);
    EXPECT(sudden < 0.15, label);
    std::printf("%s\n", label);
  }
  const double thicken = suddenness(
      [&](Staircase& d) {
        chord(d);
        d.set_param(p::kMotion, kChord);
      },
      [&](Staircase& d) { d.set_param(p::kMotion, kGlide); });
  std::snprintf(label, sizeof label, "Motion switched from Chord to Glide arrives gradually (%.3f at once)", thicken);
  EXPECT(thicken < 0.15, label);

  // And the loudness does not jump, whichever way Motion is switched: one
  // key, climbing, both sides' power in the 300 ms before and after, and in
  // every 30 ms of the 200 ms that follow the switch.
  double level_jump = 0.0, level_dip = 0.0;
  for (int from = 0; from < 3; ++from) {
    for (int to = 0; to < 3; ++to) {
      if (from == to) continue;
      for (int moment = 0; moment < 4; ++moment) {
        plain(device);
        device.set_param(p::kMotion, static_cast<float>(from));
        device.set_param(p::kSpeed, 0.7f);
        device.set_param(p::kSlide, 0.3f);
        device.set_param(p::kWidth, 0.7f);
        device.note_on(1, 220.0f, 0.8f);
        const Stereo before = render(device, 2.0f + 0.217f * static_cast<float>(moment), kRate);
        device.set_param(p::kMotion, static_cast<float>(to));
        const Stereo after = render(device, 0.6f, kRate);
        auto power = [](const Stereo& x, size_t a, size_t b) {
          const double l = rms(x.left, a, b), r = rms(x.right, a, b);
          return std::sqrt(0.5 * (l * l + r * r));
        };
        const double was = power(before, before.size() - at(0.3), before.size());
        level_jump = std::max(level_jump, std::fabs(db(power(after, at(0.2), at(0.5)) / was)));
        for (size_t i = 0; i + 1440 <= at(0.2); i += 240) level_dip = std::max(level_dip, std::fabs(db(power(after, i, i + 1440) / was)));
      }
    }
  }
  std::snprintf(label, sizeof label, "Motion switched under a key, all six ways: the loudness stays within %.2f dB, and within %.2f dB in any 30 ms",
                level_jump, level_dip);
  EXPECT(level_jump < 0.3 && level_dip < 1.0, label);
  std::printf("%s\n", label);

  // Keys: a new one, one let go at the shortest release, one struck again,
  // and a seventeenth that takes a sounding voice.
  const double on = suddenness(chord, [](Staircase& d) { d.note_on(4, 523.25f, 0.8f); });
  const double off = suddenness(chord, [](Staircase& d) { d.note_off(2); });
  const double again = suddenness(chord, [](Staircase& d) { d.note_on(2, 220.0f, 0.8f); });
  auto full = [&](Staircase& d) {
    chord(d);
    for (int n = 0; n < 13; ++n) d.note_on(10 + n, 98.0f * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
  };
  const double steal = suddenness(full, [](Staircase& d) { d.note_on(40, 277.18f, 0.8f); });
  std::snprintf(label, sizeof label, "keys start and stop gradually: on %.3f, off %.3f, struck again %.3f, a steal %.3f", on,
                off, again, steal);
  EXPECT(on < 0.15 && off < 0.15 && again < 0.15 && steal < 0.15, label);
  std::printf("%s\n", label);

  // Speed is the knob turned while it sounds: thrown end to end under a
  // pure note, the wave has no larger step than the same render without.
  plain(device);
  device.set_param(p::kSpeed, -1.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.7f, kRate);
  device.set_param(p::kSpeed, 1.0f);
  Stereo thrown = render(device, 0.06f, kRate);
  plain(other);
  other.set_param(p::kSpeed, -1.0f);
  other.note_on(1, 220.0f, 0.8f);
  render(other, 0.7f, kRate);
  Stereo kept = render(other, 0.06f, kRate);
  const double ratio = max_step(thrown.left) / max_step(kept.left);
  std::snprintf(label, sizeof label, "Speed thrown from -1 to 1: largest step %.3f of the same render without the throw", ratio);
  EXPECT(ratio < 1.05, label);
  std::printf("%s\n", label);
  // Centre swept across its range in a second under the same note.
  plain(device);
  device.note_on(1, 220.0f, 0.8f);
  Stereo steady = render(device, 0.5f, kRate);
  double sweep_step = 0.0, sweep_kink = 0.0;
  for (int n = 0; n < 375; ++n) {
    device.set_param(p::kCentre, 80.0f * std::pow(40.0f, static_cast<float>(n) / 374.0f));
    Stereo part = render(device, 128.0f / kRate, kRate);
    sweep_step = std::max(sweep_step, max_step(part.left));
    sweep_kink = std::max(sweep_kink, kink(part.left));
  }
  // The brightest it gets is Centre at the top: the reference for the sweep.
  plain(other);
  other.set_param(p::kCentre, 3200.0f);
  other.note_on(1, 220.0f, 0.8f);
  Stereo bright = render(other, 0.5f, kRate);
  const double reference = std::max(max_step(bright.left, at(0.2)), max_step(steady.left, at(0.2)));
  const double kink_reference = std::max(kink(bright.left, at(0.2)), kink(steady.left, at(0.2)));
  std::snprintf(label, sizeof label, "Centre swept over its range in 1 s: step %.2f, third difference %.2f of the steady sound's",
                sweep_step / reference, sweep_kink / kink_reference);
  EXPECT(sweep_step < 1.2 * reference && sweep_kink < 1.5 * kink_reference, label);
  std::printf("%s\n", label);
}

// --- block sizes, sleep, determinism -------------------------------------------------------

static void test_blocks_and_sleep() {
  // Two keys, a silence that ends around the moment the device falls asleep,
  // knobs moved inside the silence and under the notes, then a key again.
  double worst = 0.0;
  for (double gap : {0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 1.0}) {
    const size_t off = at(0.25), again = at(0.25 + gap);
    const std::vector<Event> events = {
        {0, 2, p::kRelease, 0.05f, 0.0f},
        {0, 2, p::kSpeed, 1.0f, 0.0f},
        {0, 0, 1, 220.0f, 0.8f},
        {0, 0, 2, 329.63f, 0.7f},
        {5003, 2, p::kCentre, 900.0f, 0.0f},
        {off, 1, 1, 0.0f, 0.0f},
        {off, 1, 2, 0.0f, 0.0f},
        {again - 150, 2, p::kCentre, 1200.0f, 0.0f},
        {again - 150, 2, p::kVolume, -3.0f, 0.0f},
        {again - 149, 2, p::kMotion, kSemitones, 0.0f},
        {again - 149, 2, p::kChorus, 0.8f, 0.0f},
        {again, 0, 3, 261.63f, 0.8f},
        {again + 7001, 0, 4, 392.0f, 0.6f},
        {again + at(0.7), 1, 3, 0.0f, 0.0f},
        {again + at(0.7), 1, 4, 0.0f, 0.0f},
    };
    const size_t total = again + at(1.0);
    device.init(kRate);
    const Stereo reference = play(device, events, total, 128);
    EXPECT(rms(reference.left, again, again + at(0.5)) > 1.0e-3, "the phrase sounds after the silence");
    for (int block : {1, 2048, 0}) {
      device.init(kRate);
      worst = std::max(worst, worst_difference(play(device, events, total, block), reference));
    }
  }
  std::snprintf(label, sizeof label,
                "blocks of 1, 128, 2048 and ragged frames give the same audio through a silence and a wake (max difference %.2g)",
                worst);
  EXPECT(worst < 1.0e-6, label);
  std::printf("%s\n", label);

  // A second init gives the same audio, bit for bit: steps, walks, start
  // phases and all.
  auto phrase = [](Staircase& d) {
    d.init(kRate);
    d.set_param(p::kSpeed, 0.9f);
    Stereo out;
    for (int n = 0; n < 6; ++n) {
      d.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
      out = concat(out, render(d, 0.3f, kRate));
    }
    for (int n = 0; n < 6; ++n) d.note_off(n);
    return concat(out, render(d, 0.5f, kRate));
  };
  const Stereo first = phrase(device), second = phrase(device);
  EXPECT(first.left == second.left && first.right == second.right, "a second init gives bit-identical audio");

  // Knobs moved while it sleeps are in place for the next key: the same key
  // on a device that had them there all along is the same audio.
  auto moved = [](Staircase& d) {
    d.set_param(p::kMotion, kGlide);
    d.set_param(p::kSpeed, 0.5f);
    d.set_param(p::kCentre, 1200.0f);
    d.set_param(p::kSpan, 3.0f);
    d.set_param(p::kShape, 0.8f);
    d.set_param(p::kChorus, 0.9f);
    d.set_param(p::kWidth, 1.0f);
    d.set_param(p::kVolume, -3.0f);
  };
  auto first_key = [](Staircase& d) {
    d.set_param(p::kRelease, 0.05f);
    d.note_on(1, 220.0f, 0.8f);
    render(d, 0.3f, kRate);
    d.process(13);  // off the beat of the control clock
    d.note_off(1);
    render(d, 1.0f, kRate);  // asleep
  };
  device.init(kRate);
  first_key(device);
  moved(device);
  render(device, 0.05f, kRate);
  device.note_on(2, 329.63f, 0.8f);
  const Stereo woken = render(device, 0.5f, kRate);
  other.init(kRate);
  moved(other);
  first_key(other);
  render(other, 0.05f, kRate);
  other.note_on(2, 329.63f, 0.8f);
  const Stereo always = render(other, 0.5f, kRate);
  const double apart = worst_difference(woken, always);
  std::snprintf(label, sizeof label, "knobs moved while asleep are in place for the next key (difference %.2g)", apart);
  EXPECT(apart < 1.0e-6, label);
  std::printf("%s\n", label);
}

// --- voices and bad input ------------------------------------------------------------------

static void test_voices_and_abuse() {
  // Held keys on C, D, E and G, then two keys in one block. Both sound,
  // with every voice held and with one voice free (the first new key takes
  // it and is the quietest voice there is when the second arrives).
  const float held[4] = {65.41f, 73.42f, 82.41f, 98.0f};
  for (int keys : {16, 15}) {
    plain(device);
    device.set_param(p::kAttack, 0.3f);
    for (int n = 0; n < keys; ++n) device.note_on(n, held[n % 4] * static_cast<float>(1 << (n / 4)), 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(100, 369.99f, 0.8f);
    device.note_on(101, 466.16f, 0.8f);
    const std::vector<float> x = mid(render(device, 1.0f, kRate));
    const double a = tone_level(x, 369.99, kRate, at(0.6), at(1.0)), b = tone_level(x, 466.16, kRate, at(0.6), at(1.0));
    std::snprintf(label, sizeof label, "with %d voices held, two keys in one block both sound (%.1f and %.1f dBFS)", keys, db(a), db(b));
    EXPECT(a > 0.01 && b > 0.01, label);
  }
  // A key struck twice, let go once: nothing is left sounding.
  device.note_on(100, 369.99f, 0.8f);
  render(device, 0.01f, kRate);
  for (int n = 0; n < 16; ++n) device.note_off(n);
  device.note_off(100);
  device.note_off(101);
  render(device, 1.0f, kRate);
  Stereo rest = render(device, 0.2f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "after every key is let go the instrument is exactly silent");

  // Notes that are not notes.
  device.init(kRate);
  device.note_on(1, std::nanf(""), 0.8f);
  Stereo none = render(device, 0.1f, kRate);
  EXPECT(peak(none.left) == 0.0, "a key with no frequency is ignored");
  device.note_on(2, 0.0f, 0.8f);
  device.note_on(3, -50.0f, 5.0f);
  device.note_on(4, 1.0e9f, -3.0f);
  device.note_on(5, 440.0f, std::nanf(""));
  device.note_on(6, std::numeric_limits<float>::infinity(), 0.5f);
  device.note_off(999);
  Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && finite(odd.right) && peak(odd.left) < 0.5, "absurd frequencies and gains are clamped");
  for (int n = 1; n <= 6; ++n) device.note_off(n);
  render(device, 6.0f, kRate);
  Stereo after = render(device, 0.2f, kRate);
  EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and are let go like any other");
}

int main() {
  Conformance spec;
  spec.name = "staircase";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_glide_rate();
  test_turn();
  test_semitones();
  test_chord();
  test_bell();
  test_slide();
  test_shape();
  test_chorus_and_width();
  test_envelope_and_levels();
  test_clicks();
  test_blocks_and_sleep();
  test_voices_and_abuse();

  // Cost with eight keys held, at the defaults and at the dearest setting.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("staircase (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kMotion, kGlide);
  device.set_param(p::kSpeed, 0.6f);
  device.set_param(p::kSpan, 8.0f);
  device.set_param(p::kShape, 0.6f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("staircase (8 keys, Glide, Span 8)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("staircase");
}
