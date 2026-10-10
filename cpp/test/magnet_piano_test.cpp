// Native harness for Magnet Piano (cpp/devices/magnet-piano). The
// conformance pass covers silence, determinism, a pile of notes, parameter
// abuse and other sample rates; the rest measures what makes it a magnet
// piano: a note that swells out of nothing in the Bloom time, the harmonic
// the magnets feed, partials stretched sharp as a piano's are, three
// strings that beat at the rate Shimmer sets, the felt strike, the
// wandering harmonic, the damper, strings that ring along with other keys
// and the soundboard. Nobody has listened to it: every claim is a number.

#include "../devices/magnet-piano/magnet_piano.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::MagnetPiano;
namespace p = livemix::magnet_piano;

static MagnetPiano device;
static MagnetPiano other;

static const float kRate = 48000.0f;
static const double kA2 = 110.0, kA3 = 220.0, kE4 = 329.6276, kF4 = 349.2282, kA4 = 440.0;

// What the header says the strings are: 6 cents at Shimmer 1, the flat
// string 1.1 of that under the note and the sharp one 0.9 over it.
static const double kShimmerCents = 6.0, kFlat = 1.1, kSharp = 0.9, kBeatCapHz = 2.5;

// One bare string group: a single pure partial, no beating, no wandering,
// no other strings ringing along, no wood, mono.
static void bare(MagnetPiano& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBright, 0.0f);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kSweep, 0.0f);
  d.set_param(p::kSympathy, 0.0f);
  d.set_param(p::kBody, 0.0f);
  d.set_param(p::kWidth, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static double partial(double hz, int n) { return MagnetPiano::partial_hz(static_cast<float>(hz), n); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so sweeps stay fast).
static double bin_level(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * hr;
    re += window * x[from + i] * pr;
    im -= window * x[from + i] * pi;
    sum += window;
    double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
    t = hr * wr - hi * wi;
    hi = hr * wi + hi * wr;
    hr = t;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

static double level_at(const std::vector<float>& x, double rate, double hz, double t0, double seconds) {
  return bin_level(x, rate, hz, at(t0, rate), at(seconds, rate));
}

// The frequency of the strongest component within `reach` (a share) of
// `guess`, to a small fraction of a cent: scan, then narrow the span as the
// window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to,
                         double reach = 0.01) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * reach;
  for (int stage = 0; stage < 12 && span > guess * 2.0e-6; ++stage) {
    const size_t n = std::min(total, static_cast<size_t>(3.0 * rate / span));
    double best = -1.0, best_f = f;
    for (int i = -10; i <= 10; ++i) {
      const double hz = f + span * i / 10.0;
      const double level = bin_level(x, rate, hz, from, n);
      if (level > best) {
        best = level;
        best_f = hz;
      }
    }
    f = best_f;
    span *= n == total ? 0.2 : 0.3;
  }
  return f;
}

// The level of `hz` every `hop` seconds through windows of `window` seconds.
static std::vector<float> level_track(const std::vector<float>& x, double rate, double hz, double window, double hop) {
  std::vector<float> out;
  for (size_t from = 0; from + at(window, rate) <= x.size(); from += at(hop, rate)) {
    out.push_back(static_cast<float>(bin_level(x, rate, hz, from, at(window, rate))));
  }
  return out;
}

// The moment a track of levels first comes within 3 dB of `steady`.
static double time_to_half_power(const std::vector<float>& track, double steady, double window, double hop) {
  for (size_t i = 0; i < track.size(); ++i) {
    if (track[i] >= steady * std::sqrt(0.5)) {
      // Between two windows, by their levels; a window stands for its middle.
      const double before = i > 0 ? track[i - 1] : 0.0;
      const double part = (steady * std::sqrt(0.5) - before) / std::max(1.0e-12, track[i] - before);
      return (static_cast<double>(i) - 1.0 + part) * hop + 0.5 * window;
    }
  }
  return 1.0e9;
}

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const double a = level_at(x, rate, hz, t0, window);
  const double b = level_at(x, rate, hz, t1, window);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// How fast a level track rises and falls: its strongest rate in hertz.
static double beat_rate(std::vector<float> track, double hop, double lo, double hi) {
  const double average = mean(track);
  for (float& v : track) v -= static_cast<float>(average);
  return dominant_frequency(track, 1.0 / hop, lo, hi);
}

// Which of the first eight partials of `hz` is the strongest in each window.
static std::vector<int> strongest_partials(const std::vector<float>& x, double hz, double window, double hop) {
  std::vector<int> out;
  for (size_t from = 0; from + at(window) <= x.size(); from += at(hop)) {
    int best = 0;
    double most = -1.0;
    for (int n = 1; n <= 8; ++n) {
      const double level = bin_level(x, kRate, partial(hz, n), from, at(window));
      if (level > most) {
        most = level;
        best = n;
      }
    }
    out.push_back(best);
  }
  return out;
}

// Largest third difference: next to nothing under a smooth low tone, about
// the size of the jump at a discontinuity (see docs/solutions, mutation checks).
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// How much of what an event changes is there at once: the same passage is
// rendered with and without it, and the largest difference in the first 8
// samples is held against the largest in the next 20 ms. A ramp has barely
// begun after 8 samples; a jump is all there. Eight moments a little apart,
// so the event meets the control clock and the wave at different places.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float lead = 0.6f + static_cast<float>(trial) * 0.00037f;
    setup(device);
    render(device, lead, kRate);
    event(device);
    const Stereo with = render(device, 0.02f, kRate);
    setup(device);
    render(device, lead, kRate);
    const Stereo without = render(device, 0.02f, kRate);
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

static double max_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "magnet-piano";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The damper takes 1.5 s to -60 dB at the defaults and a key is given up at -120 dB.
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[240];

  // 1. A note swells out of nothing. With no hammer the first 20 ms are 30 dB
  // or more under the level the note has reached after Bloom.
  {
    bare(device);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    const std::vector<float> m = mid(render(device, 6.0f, kRate));
    const double first = rms(m, 0, at(0.02));
    const double after = rms(m, at(1.0), at(1.1));
    const double steady = rms(m, at(5.5), at(6.0));
    std::printf("swell, Bloom 1 s: first 20 ms %.1f dB under the level after Bloom, %.1f dB under the steady level\n",
                db(after / first), db(steady / first));
    EXPECT(db(after / first) > 30.0, "the first 20 ms are 30 dB or more under the level reached after Bloom");

    // A slow start is the idea, but a short tap still makes a sound.
    bare(device);
    device.set_param(p::kBloom, 10.0f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo tap = render(device, 0.1f, kRate);
    device.note_off(1);
    tap = concat(tap, render(device, 0.4f, kRate));
    std::printf("a 100 ms tap at Bloom 10 s peaks at %.1f dBFS\n", db(both_peak(tap)));
    EXPECT(both_peak(tap) > 3.0e-4, "a 100 ms note at the longest Bloom still sounds (above -70 dBFS)");
  }

  // 2. Bloom is the time the note takes to come within 3 dB of where it
  // settles, and a string's low partials arrive after its high ones.
  {
    for (float bloom : {0.3f, 1.0f, 4.0f}) {
      bare(device);
      device.set_param(p::kBloom, bloom);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      const std::vector<float> m = mid(render(device, 9.0f * bloom, kRate));
      const double window = 0.05 * bloom, hop = 0.01 * bloom;
      const std::vector<float> track = level_track(m, kRate, kA3, window, hop);
      const double steady = track.back();
      const double reached = time_to_half_power(track, steady, window, hop);
      std::snprintf(label, sizeof label, "Bloom %.1f s: within 3 dB of steady after %.3f s", bloom, reached);
      std::printf("%s\n", label);
      EXPECT(std::fabs(reached / bloom - 1.0) < 0.1, "the note is within 3 dB of steady at Bloom, within 10 % (the bar is 'about')");
    }
    bare(device);
    device.set_param(p::kBloom, 2.0f);
    device.set_param(p::kBright, 1.0f);
    device.set_param(p::kHarmonic, 4.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    const std::vector<float> m = mid(render(device, 30.0f, kRate));
    double reached[9] = {};
    for (int n : {1, 4, 8}) {
      const std::vector<float> track = level_track(m, kRate, partial(kA2, n), 0.1, 0.02);
      reached[n] = time_to_half_power(track, track.back(), 0.1, 0.02);
    }
    std::printf("Bloom 2 s, magnets on partial 4: partial 1 within 3 dB after %.2f s, partial 4 after %.2f s, partial 8 after %.2f s\n",
                reached[1], reached[4], reached[8]);
    EXPECT(std::fabs(reached[4] / 2.0 - 1.0) < 0.1, "the fed partial takes the Bloom time");
    EXPECT(reached[1] > 1.7 * reached[4] && reached[4] > 1.25 * reached[8], "lower partials arrive later, higher ones sooner");
  }

  // 3. Harmonic chooses the partial the magnets feed; between two it feeds
  // both; Bright lets the neighbours in; neither changes the loudness.
  {
    auto levels = [&](float harmonic, float bright, bool defaults, double* out) {
      if (defaults) {
        device.init(kRate);
        device.set_param(p::kShimmer, 0.0f);  // so the levels stand still
      } else {
        bare(device);
        device.set_param(p::kBright, bright);
      }
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kHarmonic, harmonic);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      const std::vector<float> m = mid(render(device, 1.5f, kRate));
      for (int n = 1; n <= 12; ++n) out[n] = level_at(m, kRate, partial(kA3, n), 1.0, 0.4);
      return rms(m, at(1.0), at(1.4));
    };
    double l[13];
    levels(3.0f, 0.0f, true, l);
    double next = 0.0;
    for (int n = 1; n <= 12; ++n) {
      if (n != 3) next = std::max(next, l[n]);
    }
    std::printf("Harmonic 3 at the default Bright: partial 3 is %.1f dB over the next strongest (partial 2 %.1f dB, partial 4 %.1f dB, partial 1 %.1f dB re it)\n",
                db(l[3] / next), db(l[2] / l[3]), db(l[4] / l[3]), db(l[1] / l[3]));
    EXPECT(db(l[3] / next) > 10.0, "Harmonic 3 makes the third partial the strongest by 10 dB or more");

    levels(1.0f, 0.0f, false, l);
    next = 0.0;
    for (int n = 2; n <= 12; ++n) next = std::max(next, l[n]);
    std::printf("Harmonic 1, Bright 0: the strongest overtone is %.1f dB under the fundamental\n", db(l[1] / next));
    EXPECT(db(l[1] / next) > 60.0, "Bright 0 on a whole harmonic is one pure tone (overtones 60 dB down)");

    levels(2.5f, 0.0f, false, l);
    next = 0.0;
    for (int n = 1; n <= 12; ++n) {
      if (n != 2 && n != 3) next = std::max(next, l[n]);
    }
    std::printf("Harmonic 2.5, Bright 0: partial 2 against partial 3 %+.2f dB, everything else %.1f dB under them\n",
                db(l[2] / l[3]), db(std::min(l[2], l[3]) / next));
    EXPECT(std::fabs(db(l[2] / l[3])) < 1.0 && db(std::min(l[2], l[3]) / next) > 40.0,
           "between two harmonics the magnets feed both, equally, and nothing else");

    levels(4.0f, 1.0f, false, l);
    std::printf("Harmonic 4, Bright 1: partials 1 to 9 at %.1f %.1f %.1f %.1f %.1f %.1f %.1f %.1f %.1f dB re partial 4\n",
                db(l[1] / l[4]), db(l[2] / l[4]), db(l[3] / l[4]), 0.0, db(l[5] / l[4]), db(l[6] / l[4]), db(l[7] / l[4]),
                db(l[8] / l[4]), db(l[9] / l[4]));
    EXPECT(l[3] > 0.7 * l[4] && l[5] > 0.7 * l[4] && l[2] > 0.4 * l[4] && l[6] > 0.4 * l[4] && l[1] > 0.2 * l[4] &&
               l[7] > 0.2 * l[4],
           "Bright 1 brings in the partials on both sides, nearest first");
    EXPECT(l[3] < l[4] && l[2] < l[3] && l[1] < l[2] && l[6] < l[5] && l[7] < l[6], "as a bell: each further one is weaker");

    double quietest = 1.0e9, loudest = 0.0;
    for (float harmonic : {1.0f, 2.5f, 4.0f, 8.0f}) {
      for (float bright : {0.0f, 0.5f, 1.0f}) {
        bare(device);
        device.set_param(p::kBloom, 0.05f);
        device.set_param(p::kHarmonic, harmonic);
        device.set_param(p::kBright, bright);
        device.note_on(1, 55.0f, 0.8f);  // low, so the string's loss of top stays out of it
        const std::vector<float> m = mid(render(device, 1.5f, kRate));
        const double level = rms(m, at(1.0), at(1.4));
        quietest = std::min(quietest, level);
        loudest = std::max(loudest, level);
      }
    }
    std::printf("an A1 over every Harmonic and Bright: loudness within %.2f dB\n", db(loudest / quietest));
    EXPECT(db(loudest / quietest) < 1.0, "Harmonic and Bright change the colour, not the loudness (within 1 dB)");
  }

  // 4. Tuning. The fundamental is the played note at every pitch and sample
  // rate; the upper partials are sharp by the stretch of a piano string.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {27.5, 55.0, 220.0, 880.0, 1760.0, 4186.0}) {
        bare(device, rate);
        device.set_param(p::kBloom, 0.05f);
        device.note_on(1, static_cast<float>(hz), 0.8f);
        const std::vector<float> m = mid(render(device, 4.0f, rate));
        const double found = fine_pitch(m, rate, hz, at(0.5, rate), m.size());
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
    std::printf("fundamental, A0 to C8 at 44.1, 48 and 96 kHz: worst %.3f cents\n", worst);
    EXPECT(worst < 0.5, "the fundamental is within half a cent of the played note (the bar is 3)");

    double off = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {55.0, kA2, kA3, kA4, 1046.5}) {
        bare(device, rate);
        device.set_param(p::kBloom, 0.05f);
        device.set_param(p::kHarmonic, 8.0f);
        device.note_on(1, static_cast<float>(hz), 0.8f);
        const std::vector<float> m = mid(render(device, 3.0f, rate));
        const double found = fine_pitch(m, rate, 8.0 * hz, at(0.5, rate), m.size(), 0.04);
        const double b = 1.0e-4 * std::pow(hz / 27.5, 0.596);
        const double model = 8.0 * hz * std::sqrt((1.0 + 64.0 * b) / (1.0 + b));
        off = std::max(off, std::fabs(cents(found, model)));
        if (rate == 48000.0f) {
          std::printf("partial 8 of %.1f Hz: %.2f cents sharp of 8 times the note (the model says %.2f)\n", hz,
                      cents(found, 8.0 * hz), cents(model, 8.0 * hz));
          EXPECT(cents(found, 8.0 * hz) > 4.0, "partial 8 is stretched sharp");
        }
      }
    }
    std::printf("partial 8 against the model, five notes at three rates: worst %.3f cents\n", off);
    EXPECT(off < 0.5, "partial 8 is sharp by the stretch the model says, within half a cent (the bar is 3)");
  }

  // 5. Shimmer: three strings that beat. The flat string sits left and the
  // sharp one right, so the left side beats at the flat string's distance
  // from the note in hertz and the right side at the sharp string's.
  {
    double rate_left[2], rate_right[2];
    const float knob[2] = {0.5f, 1.0f};
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kShimmer, knob[which]);
      device.set_param(p::kWidth, 1.0f);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      const Stereo out = render(device, 40.0f, kRate);
      const double apart = kA3 * (std::pow(2.0, kShimmerCents * knob[which] / 1200.0) - 1.0);
      rate_left[which] = beat_rate(level_track(out.left, kRate, kA3, 0.1, 0.02), 0.02, 0.05, 4.0);
      rate_right[which] = beat_rate(level_track(out.right, kRate, kA3, 0.1, 0.02), 0.02, 0.05, 4.0);
      std::printf("Shimmer %.1f on A3: left beats at %.4f Hz (strings %.4f Hz apart), right at %.4f Hz (%.4f)\n", knob[which],
                  rate_left[which], kFlat * apart, rate_right[which], kSharp * apart);
      EXPECT(std::fabs(rate_left[which] / (kFlat * apart) - 1.0) < 0.03, "the left side beats at the flat string's distance, within 3 %");
      EXPECT(std::fabs(rate_right[which] / (kSharp * apart) - 1.0) < 0.03, "the right side at the sharp string's");
    }
    EXPECT(rate_left[1] > 1.9 * rate_left[0] && rate_left[1] < 2.1 * rate_left[0], "twice the Shimmer, twice the beat rate");

    bare(device);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 8.0f, kRate);
    std::vector<float> track = level_track(out.left, kRate, kA3, 0.1, 0.02);
    double lo = 1.0e9, hi = 0.0;
    for (size_t i = 50; i < track.size(); ++i) {
      lo = std::min<double>(lo, track[i]);
      hi = std::max<double>(hi, track[i]);
    }
    std::printf("Shimmer 0: the level of a held note moves by %.4f dB\n", db(hi / lo));
    EXPECT(db(hi / lo) < 0.05, "Shimmer 0: the strings are one and the note stands still");

    // High notes are held to a slow beat instead of a flutter.
    bare(device);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 2093.0f, 0.8f);
    out = render(device, 20.0f, kRate);
    const double top = beat_rate(level_track(out.left, kRate, 2093.0, 0.05, 0.01), 0.01, 0.2, 20.0);
    std::printf("Shimmer 1 on C7: left beats at %.3f Hz (uncapped it would be %.2f Hz)\n", top,
                kFlat * 2093.0 * (std::pow(2.0, kShimmerCents / 1200.0) - 1.0));
    EXPECT(std::fabs(top / kBeatCapHz - 1.0) < 0.03, "at the top of the keyboard the beat is capped at 2.5 Hz");

    // The pitch stays the note's: the middle string is in tune.
    bare(device);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kShimmer, 1.0f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    const std::vector<float> m = mid(render(device, 20.0f, kRate));
    auto string_at = [&](double c) { return bin_level(m, kRate, kA3 * std::pow(2.0, c / 1200.0), at(1.0), at(18.0)); };
    const double middle = string_at(0.0), flat = string_at(-kFlat * kShimmerCents), sharp = string_at(kSharp * kShimmerCents);
    const double between = std::max(string_at(-0.5 * kFlat * kShimmerCents), string_at(0.5 * kSharp * kShimmerCents));
    std::printf("Shimmer 1: strings at %+.1f, 0 and %+.1f cents: %.2f and %.2f dB re the middle one, %.1f dB between them\n",
                -kFlat * kShimmerCents, kSharp * kShimmerCents, db(flat / middle), db(sharp / middle), db(between / middle));
    EXPECT(std::fabs(db(flat / middle) + 12.04) < 1.0 && std::fabs(db(sharp / middle) + 12.04) < 1.0,
           "three strings: one on the note, and 12 dB under it one 6.6 cents flat and one 5.4 cents sharp");
    EXPECT(db(between / middle) < -30.0, "and nothing between them");

    // The beating is a rise and fall, never a dropout: over a minute the
    // level of a held note moves, and its lowest 200 ms stay within 10.5 dB
    // of its highest, in the sum of left and right and (up to the default
    // Width) on each side. Three equal strings fall 20 dB and more here. At
    // Width 1 the sides move further, which is the note crossing the
    // picture, and the sum is as steady as ever.
    for (int which = 0; which < 4; ++which) {
      device.init(kRate);
      device.set_param(p::kBloom, 0.05f);
      if (which == 1) device.set_param(p::kShimmer, 1.0f);
      if (which == 2) device.set_param(p::kWidth, 0.0f);
      if (which == 3) device.set_param(p::kWidth, 1.0f);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      const Stereo held = render(device, 60.0f, kRate);
      const std::vector<float> sum = mid(held);
      double range[2] = {0.0, 0.0};  // of the sum, of the side that moves most
      int index = 0;
      for (const std::vector<float>* x : {&sum, &held.left, &held.right}) {
        double lowest = 1.0e9, highest = 0.0;
        for (size_t from = at(0.5); from + at(0.2) <= x->size(); from += at(0.1)) {
          const double level = rms(*x, from, from + at(0.2));
          lowest = std::min(lowest, level);
          highest = std::max(highest, level);
        }
        range[index > 0 ? 1 : 0] = std::max(range[index > 0 ? 1 : 0], db(highest / lowest));
        ++index;
      }
      std::printf("a held A3 for a minute (%s): the sum of left and right moves over %.1f dB, a side over %.1f dB\n",
                  which == 0 ? "defaults" : which == 1 ? "Shimmer 1" : which == 2 ? "Width 0" : "Width 1", range[0], range[1]);
      EXPECT(range[0] > 3.0, "the strings beat: the level of a held note rises and falls by 3 dB or more");
      EXPECT(range[0] < 10.5, "and never drops out: the lowest 200 ms of the sum stay within 10.5 dB of the highest");
      if (which < 3) EXPECT(range[1] < 10.5, "nor does either side, up to the default Width");
      if (which == 3) EXPECT(range[1] > range[0] + 2.0, "at Width 1 the sides move more than the sum: the note crosses the picture");
    }
  }

  // 6. Hammer: a felt strike in the first milliseconds, rolled off like a
  // softly struck string, whose partials die at their own rates.
  {
    double first[2];
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kHammer, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      const std::vector<float> m = mid(render(device, 3.0f, kRate));
      first[which] = peak(m, 0, at(0.015));
      if (which == 1) {
        size_t top = 0;
        for (size_t i = 0; i < at(0.1); ++i) {
          if (std::fabs(m[i]) > std::fabs(m[top])) top = i;
        }
        std::printf("Hammer 1: the first 100 ms peak %.1f ms after the key, at %.1f dBFS; the swell alone reaches %.1f dBFS\n",
                    1000.0 * static_cast<double>(top) / kRate, db(std::fabs(m[top])), db(peak(m, at(2.5))));
        EXPECT(top < at(0.015), "the strike peaks within 15 ms of the key");
      }
    }
    std::printf("peak of the first 15 ms: %.1f dBFS without the hammer, %.1f dBFS with it\n", db(first[0]), db(first[1]));
    EXPECT(first[1] > 10.0 * first[0], "Hammer adds a peak in the first 15 ms (20 dB over the bare swell)");

    // With the magnets up on partial 8 and slow, partials 1 to 6 are the hammer's alone.
    double level[2][7], ring[7];
    const float velocity[2] = {1.0f, 0.3f};
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kHammer, 1.0f);
      device.set_param(p::kBloom, 10.0f);
      device.set_param(p::kHarmonic, 8.0f);
      device.note_on(1, static_cast<float>(kA3), velocity[which]);
      const std::vector<float> m = mid(render(device, 2.0f, kRate));
      for (int n = 1; n <= 6; ++n) {
        level[which][n] = level_at(m, kRate, partial(kA3, n), 0.01, 0.05);
        if (which == 0) ring[n] = ring_time(m, kRate, partial(kA3, n), 0.2, 1.2, 0.2);
      }
    }
    std::printf("struck A3, partials 1 to 6 at %.1f %.1f %.1f %.1f %.1f %.1f dB re the first; they ring %.2f %.2f %.2f %.2f %.2f %.2f s\n",
                0.0, db(level[0][2] / level[0][1]), db(level[0][3] / level[0][1]), db(level[0][4] / level[0][1]),
                db(level[0][5] / level[0][1]), db(level[0][6] / level[0][1]), ring[1], ring[2], ring[3], ring[4], ring[5], ring[6]);
    bool falling = true, shorter = true;
    for (int n = 2; n <= 6; ++n) {
      falling = falling && level[0][n] < level[0][n - 1];
      shorter = shorter && ring[n] < ring[n - 1];
    }
    EXPECT(falling && db(level[0][6] / level[0][1]) < -9.0, "the strike rolls off: each partial under the one below, the sixth 9 dB down or more");
    EXPECT(shorter, "each partial dies sooner than the one below it");
    EXPECT(std::fabs(ring[1] / 7.0 - 1.0) < 0.05 && std::fabs(ring[4] / (7.0 * std::pow(4.0, -0.8)) - 1.0) < 0.05,
           "a struck A3 rings 7 s, its fourth partial 7 / 4^0.8 s, within 5 %");
    const double soft_tilt = db(level[1][6] / level[1][1]), hard_tilt = db(level[0][6] / level[0][1]);
    std::printf("the sixth partial against the first: %.1f dB struck hard, %.1f dB struck softly; the strike itself %.1f dB apart\n",
                hard_tilt, soft_tilt, db(level[0][1] / level[1][1]));
    EXPECT(hard_tilt > soft_tilt + 3.0, "a harder strike keeps more of its top");
    EXPECT(db(level[0][1] / level[1][1]) > 12.0, "and is louder: 12 dB or more between gain 0.3 and 1");
  }

  // 7. Sweep moves the fed harmonic along a slow path, each note its own.
  {
    std::vector<int> walk[3];
    for (int which = 0; which < 3; ++which) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kDamper, 0.05f);
      device.set_param(p::kHarmonic, 4.5f);
      device.set_param(p::kSweep, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kSweepRate, 1.0f);
      if (which == 2) {
        // The second note of a session takes another path than the first.
        device.note_on(7, 3000.0f, 0.1f);
        device.note_off(7);
        render(device, 0.5f, kRate);
      }
      device.note_on(1, static_cast<float>(kA2), 0.8f);
      const std::vector<float> m = mid(render(device, 24.0f, kRate));
      walk[which] = strongest_partials(m, kA2, 0.1, 0.1);
    }
    int lowest = 9, highest = 0, still_lowest = 9, still_highest = 0, changes = 0, differ = 0;
    bool seen[9] = {};
    for (size_t i = 5; i < walk[1].size(); ++i) {
      lowest = std::min(lowest, walk[1][i]);
      highest = std::max(highest, walk[1][i]);
      seen[walk[1][i]] = true;
      still_lowest = std::min(still_lowest, walk[0][i]);
      still_highest = std::max(still_highest, walk[0][i]);
      if (walk[1][i] != walk[1][i - 1]) ++changes;
      if (walk[1][i] != walk[2][i]) ++differ;
    }
    int visited = 0;
    for (int n = 1; n <= 8; ++n) visited += seen[n] ? 1 : 0;
    std::printf("Sweep 1 at 1 Hz around 4.5: the strongest partial goes from %d to %d, visits %d partials and changes %d times in 24 s; "
                "Sweep 0: it stays on %d to %d; the next note's path differs in %.0f %% of the windows\n",
                lowest, highest, visited, changes, still_lowest, still_highest,
                100.0 * differ / static_cast<double>(walk[1].size() - 5));
    EXPECT(lowest <= 2 && highest >= 7 && visited >= 6, "Sweep moves the strongest partial over time, down to 2 and up to 7");
    EXPECT(changes >= 30, "and keeps it moving");
    EXPECT(still_lowest >= 4 && still_highest <= 5, "Sweep 0 leaves it where Harmonic put it");
    EXPECT(differ > static_cast<int>(walk[1].size()) / 4, "every note takes its own path");

    // Sweep rate is how fast it goes.
    int count[2];
    const float rate[2] = {0.25f, 1.0f};
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kHarmonic, 4.5f);
      device.set_param(p::kSweep, 1.0f);
      device.set_param(p::kSweepRate, rate[which]);
      device.note_on(1, static_cast<float>(kA2), 0.8f);
      const std::vector<int> path = strongest_partials(mid(render(device, 40.0f, kRate)), kA2, 0.1, 0.1);
      count[which] = 0;
      for (size_t i = 1; i < path.size(); ++i) count[which] += path[i] != path[i - 1] ? 1 : 0;
    }
    std::printf("the strongest partial changes %d times in 40 s at 0.25 Hz and %d times at 1 Hz\n", count[0], count[1]);
    EXPECT(count[1] > 2.5 * count[0] && count[1] < 6.0 * count[0], "four times the Sweep rate, about four times the movement");

    // At Harmonic 1 the magnets have nowhere to go but up: where the path
    // points down they turn back, so every note moves. (Held at the end
    // instead, half the notes stand on the fundamental for seconds.)
    bare(device);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kDamper, 0.05f);
    device.set_param(p::kSweep, 1.0f);
    device.set_param(p::kSweepRate, 0.5f);
    double least = 1.0;
    for (int note = 0; note < 8; ++note) {
      device.note_on(note, static_cast<float>(kA2), 0.8f);
      const std::vector<int> path = strongest_partials(mid(render(device, 4.0f, kRate)), kA2, 0.1, 0.05);
      device.note_off(note);
      render(device, 0.3f, kRate);
      int away = 0;
      for (int which : path) away += which > 1 ? 1 : 0;
      least = std::min(least, static_cast<double>(away) / static_cast<double>(path.size()));
    }
    std::printf("Sweep 1 at Harmonic 1, eight notes: the one that moves least is off the fundamental %.0f %% of the time\n", 100.0 * least);
    EXPECT(least > 0.45, "Sweep moves the magnets of every note at Harmonic 1: each is off the fundamental 45 % of the time or more");
  }

  // 8. Damper is the time a let-go note takes to fall 60 dB, then it is gone.
  {
    for (float seconds : {0.3f, 3.0f}) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kDamper, seconds);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      render(device, 1.0f, kRate);
      device.note_off(1);
      const Stereo tail = render(device, 2.5f * seconds, kRate);
      const std::vector<float> m = mid(tail);
      const double fall = ring_time(m, kRate, kA3, 0.05 * seconds, 0.75 * seconds, 0.1 * seconds);
      std::snprintf(label, sizeof label, "Damper %.1f s: a released note falls 60 dB in %.3f s", seconds, fall);
      std::printf("%s\n", label);
      EXPECT(std::fabs(fall / seconds - 1.0) < 0.05, "Damper sets the release, within 5 %");
      // Partials too faint to hear are left out of the render: that must
      // not reach up into what can be heard. 75 dB down the note still
      // falls at the same rate.
      const double deep = ring_time(m, kRate, kA3, 0.05 * seconds, 1.25 * seconds, 0.1 * seconds);
      std::printf("measured down to 75 dB under the note: 60 dB in %.3f s\n", deep);
      EXPECT(std::fabs(deep / seconds - 1.0) < 0.05, "the tail is all there 75 dB down: nothing audible is cut short");
      EXPECT(both_peak(tail, at(2.2 * seconds)) == 0.0, "and the note is exactly silent a little after twice that");
    }
  }

  // 9. Sympathy. A2 is held as one pure tone. E4 comes and goes; what is
  // left at A2's third partial (a hair from E4) is what A2's strings took
  // up. F4 matches none of A2's partials, and with Sympathy 0 nothing rings.
  {
    auto taken_up = [&](float sympathy, double second) {
      bare(device);
      device.set_param(p::kBloom, 0.3f);
      device.set_param(p::kDamper, 0.05f);
      device.set_param(p::kSympathy, sympathy);
      device.note_on(1, static_cast<float>(kA2), 0.8f);
      render(device, 1.5f, kRate);
      if (second > 0.0) device.note_on(2, static_cast<float>(second), 0.8f);
      render(device, 1.5f, kRate);
      device.note_off(2);
      render(device, 0.3f, kRate);  // the second note is 300 dB down by now
      const std::vector<float> m = mid(render(device, 0.4f, kRate));
      return bin_level(m, kRate, partial(kA2, 3), 0, m.size()) / bin_level(m, kRate, kA2, 0, m.size());
    };
    const double alone = taken_up(1.0f, 0.0), off = taken_up(0.0f, kE4);
    const double full = taken_up(1.0f, kE4), half = taken_up(0.5f, kE4), wrong = taken_up(1.0f, kF4);
    std::printf("A2's third partial re its fundamental after another note has come and gone: alone %.1f dB; E4 at Sympathy 0 %.1f dB, "
                "0.5 %.1f dB, 1 %.1f dB; F4 at Sympathy 1 %.1f dB\n",
                db(alone), db(off), db(half), db(full), db(wrong));
    EXPECT(db(full) > -25.0, "Sympathy 1: A2's strings take up an E4 at their third partial (within 25 dB of the fundamental)");
    EXPECT(db(off) < -80.0 && db(alone) < -80.0, "Sympathy 0, or no other note: nothing rings there");
    EXPECT(db(wrong) < -80.0, "a note that matches no partial sets nothing ringing");
    EXPECT(half > 0.4 * full && half < 0.6 * full, "the knob sets how much: half the Sympathy, half the ring");

    // What rings along dies away over seconds once its source is gone.
    bare(device);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kDamper, 0.05f);
    device.set_param(p::kSympathy, 1.0f);
    device.note_on(1, static_cast<float>(kA2), 0.8f);
    render(device, 1.5f, kRate);
    device.note_on(2, static_cast<float>(kE4), 0.8f);
    render(device, 1.5f, kRate);
    device.note_off(2);
    const std::vector<float> m = mid(render(device, 4.0f, kRate));
    const double ring = ring_time(m, kRate, partial(kA2, 3), 0.5, 2.5, 0.4);
    std::printf("the ring falls 60 dB in %.1f s (a 1.5 s time constant is 10.4 s)\n", ring);
    EXPECT(ring > 8.0 && ring < 13.0, "the sympathetic ring dies with a time constant near 1.5 s");

    // One note alone is the same note at any Sympathy.
    Stereo one[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kSympathy, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kHammer, 0.7f);
      device.set_param(p::kBright, 0.8f);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      one[which] = render(device, 2.0f, kRate);
    }
    EXPECT(one[0].left == one[1].left && one[0].right == one[1].right, "a single note is the same samples at Sympathy 0 and 1");
  }

  // 10. Body: the soundboard lifts the low wood and takes the top off; at 0
  // the string is bare.
  {
    double l[2][13];
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kBright, 1.0f);
      device.set_param(p::kHarmonic, 6.0f);
      device.set_param(p::kBody, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(kA2), 0.8f);
      const std::vector<float> m = mid(render(device, 2.0f, kRate));
      for (int n = 1; n <= 12; ++n) l[which][n] = level_at(m, kRate, partial(kA2, n), 1.0, 0.8);
    }
    std::printf("Body 1 against 0 on an A2: 110 Hz %+.1f dB, 330 Hz %+.1f dB, 660 Hz %+.1f dB, 880 Hz %+.1f dB, 1330 Hz %+.1f dB\n",
                db(l[1][1] / l[0][1]), db(l[1][3] / l[0][3]), db(l[1][6] / l[0][6]), db(l[1][8] / l[0][8]),
                db(l[1][12] / l[0][12]));
    EXPECT(db(l[1][1] / l[0][1]) > 2.0 && db(l[1][3] / l[0][3]) > 1.0, "Body lifts the low wood, 110 and 330 Hz");
    EXPECT(db(l[1][12] / l[0][12]) < -2.5, "and takes off the top: 1.3 kHz down 2.5 dB or more");

    double top[2];
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kHarmonic, 8.0f);
      device.set_param(p::kBody, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(kA4), 0.8f);
      const std::vector<float> m = mid(render(device, 1.0f, kRate));
      top[which] = level_at(m, kRate, partial(kA4, 8), 0.5, 0.4);
    }
    std::printf("a whistle at 3.6 kHz: %.1f dB with Body 1 against Body 0\n", db(top[1] / top[0]));
    EXPECT(db(top[1] / top[0]) < -8.0, "a high whistle loses 8 dB or more to the wood");
  }

  // 11. Width: the outer strings sit left and right; at 0 the note is mono.
  {
    bare(device);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kBright, 0.6f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    EXPECT(out.left == out.right, "Width 0 is mono, sample for sample");

    double apart[2];
    const float knob[2] = {0.5f, 1.0f};
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kShimmer, 1.0f);
      device.set_param(p::kBright, 0.6f);
      device.set_param(p::kWidth, knob[which]);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      out = render(device, 30.0f, kRate);
      apart[which] = db(rms(side(out), at(2.0)) / rms(mid(out), at(2.0)));
    }
    std::printf("side against mid of a shimmering note: %.1f dB at Width 0.5, %.1f dB at Width 1\n", apart[0], apart[1]);
    EXPECT(apart[1] > apart[0] + 3.0 && apart[1] < -2.0, "Width opens the strings out, and stays mono-compatible (side under mid by 2 dB)");
  }

  // 12. Velocity, and the level rules: one note, the keyboard, ten held keys.
  {
    double soft = 0.0, loud = 0.0;
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(kA3), which == 0 ? 0.2f : 1.0f);
      const Stereo out = render(device, 4.0f, kRate);
      (which == 0 ? soft : loud) = rms(out.left, at(3.0));
    }
    std::printf("velocity 0.2 to 1: %.1f dB\n", db(loud / soft));
    EXPECT(db(loud / soft) > 5.0 && db(loud / soft) < 14.0, "a softer key is a quieter note: 5 to 14 dB between gain 0.2 and 1");

    device.init(kRate);
    device.note_on(1, static_cast<float>(kA3), 0.7f);
    Stereo out = render(device, 6.0f, kRate);
    const double seven = db(both_peak(out));
    std::snprintf(label, sizeof label, "one note at gain 0.7 peaks at %.1f dBFS at the default volume (-24 to -10)", seven);
    std::printf("%s\n", label);
    EXPECT(seven > -24.0 && seven < -10.0, label);

    double lowest = 0.0, highest = -200.0;
    for (double hz : {28.0, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 4200.0}) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      out = render(device, 6.0f, kRate);
      const double level = db(both_peak(out));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      EXPECT(finite(out.left) && finite(out.right), "every note from 28 Hz to 4.2 kHz is finite");
    }
    std::snprintf(label, sizeof label, "one note at gain 0.7 from 28 Hz to 4.2 kHz peaks from %.1f to %.1f dBFS (inside -24 to -10)",
                  lowest, highest);
    std::printf("%s\n", label);
    EXPECT(lowest > -24.0 && highest < -10.0, label);

    // The same with the hammer, which is the loudest a note gets.
    device.init(kRate);
    device.set_param(p::kHammer, 1.0f);
    device.note_on(1, static_cast<float>(kA3), 0.7f);
    out = render(device, 6.0f, kRate);
    std::printf("with Hammer 1 the same note peaks at %.1f dBFS\n", db(both_peak(out)));
    EXPECT(db(both_peak(out)) < -10.0, "a struck note at gain 0.7 still peaks under -10 dBFS");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    out = render(device, 8.0f, kRate);
    const double ten = both_peak(out);
    std::snprintf(label, sizeof label, "ten held keys peak at %.2f (under the clip knee region, 0.9)", ten);
    std::printf("%s\n", label);
    EXPECT(ten < 0.9, label);

    // The output ends in the soft clip: a pile of loud struck notes at full volume lands on it.
    device.init(kRate);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kHammer, 1.0f);
    device.set_param(p::kBloom, 0.05f);
    for (int n = 0; n < 12; ++n) device.note_on(n, 220.0f, 1.0f);
    out = render(device, 1.0f, kRate);
    std::printf("twelve unisons at full volume peak at %.4f\n", both_peak(out));
    EXPECT(both_peak(out) > 0.95 && both_peak(out) <= 1.0, "the output ends in the soft clip: it reaches full scale and never passes it");
  }

  // 13. No clicks. Every event is held against the same passage without it.
  {
    auto chord = [](MagnetPiano& d) {
      d.init(kRate);
      d.set_param(p::kBloom, 0.1f);
      d.set_param(p::kBright, 0.4f);
      d.set_param(p::kShimmer, 0.5f);
      d.note_on(1, 110.0f, 0.8f);
      d.note_on(2, 164.81f, 0.8f);
      d.note_on(3, 277.18f, 0.8f);
    };
    struct Jump {
      int id;
      float to;
      const char* name;
    };
    const Jump jumps[] = {{p::kHarmonic, 8.0f, "Harmonic 1 to 8"}, {p::kBright, 1.0f, "Bright 0.4 to 1"},
                          {p::kBright, 0.0f, "Bright 0.4 to 0"},   {p::kSweep, 1.0f, "Sweep 0 to 1"},
                          {p::kBody, 1.0f, "Body 0.4 to 1"},       {p::kWidth, 0.0f, "Width 0.6 to 0"},
                          {p::kVolume, -48.0f, "Volume -6 to -48"}, {p::kVolume, 6.0f, "Volume -6 to 6"},
                          {p::kShimmer, 1.0f, "Shimmer 0.5 to 1"},  {p::kDamper, 0.05f, "Damper 1.5 to 0.05"},
                          {p::kBloom, 10.0f, "Bloom 0.1 to 10"},    {p::kSympathy, 1.0f, "Sympathy 0.3 to 1"}};
    for (const Jump& jump : jumps) {
      const double sudden = suddenness(chord, [&](MagnetPiano& d) { d.set_param(jump.id, jump.to); });
      std::snprintf(label, sizeof label, "%s under a chord: %.3f of the change is there after 8 samples", jump.name, sudden);
      std::printf("%s\n", label);
      EXPECT(sudden < 0.15, label);
    }
    const double off = suddenness(
        [&](MagnetPiano& d) {
          chord(d);
          d.set_param(p::kDamper, 0.05f);
        },
        [](MagnetPiano& d) { d.note_off(2); });
    const double again = suddenness(chord, [](MagnetPiano& d) { d.note_on(2, 164.81f, 1.0f); });
    const double struck = suddenness(
        [&](MagnetPiano& d) {
          chord(d);
          d.set_param(p::kHammer, 1.0f);
        },
        [](MagnetPiano& d) { d.note_on(9, 440.0f, 1.0f); });
    auto full = [](MagnetPiano& d) {
      d.init(kRate);
      d.set_param(p::kBloom, 0.1f);
      for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
    };
    const double steal = suddenness(full, [](MagnetPiano& d) { d.note_on(40, 3000.0f, 0.8f); });
    std::printf("the shortest Damper falling %.3f, a held key struck again louder %.3f, a hammer strike %.3f, a stolen voice %.3f\n",
                off, again, struck, steal);
    EXPECT(off < 0.15, "the damper falls gradually even at its shortest");
    EXPECT(again < 0.15, "a held key struck again carries on without a jump");
    EXPECT(struck < 0.15, "the felt meets the string over milliseconds, not at once");
    EXPECT(steal < 0.15, "a stolen voice fades instead of being cut");

    // The same on the wave itself: Harmonic thrown back and forth under a
    // low pure note. The weights move in straight pieces between control
    // ticks, so the corners are small but not none; without the 40 ms glide
    // of the knob the same throw leaves 4.7e-3.
    double own = 0.0, thrown = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kHarmonic, 2.0f);
      device.note_on(1, 55.0f, 1.0f);
      render(device, 0.5f, kRate);
      Stereo out;
      for (int k = 0; k < 120; ++k) {
        if (pass == 1) device.set_param(p::kHarmonic, k % 2 == 0 ? 1.0f : 2.0f);
        out = concat(out, render(device, 0.0107f, kRate, 64));
      }
      (pass == 0 ? own : thrown) = kink(out.left);
    }
    std::printf("Harmonic thrown between 1 and 2 under a 55 Hz note: sharpest corner %.2e (%.2e held on 2)\n", thrown, own);
    EXPECT(thrown < 1.0e-3, "turning Harmonic under a note leaves corners under 1e-3 in the wave (4.7e-3 without the glide)");
    // max_step, as the recipe asks: Volume swept under a pure note against the same note left alone.
    double step[2];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kVolume, 0.0f);
      device.note_on(1, static_cast<float>(kA3), 1.0f);
      render(device, 0.5f, kRate);
      Stereo out;
      for (int k = 0; k < 200; ++k) {
        if (pass == 1) device.set_param(p::kVolume, k % 2 == 0 ? -48.0f : 0.0f);
        out = concat(out, render(device, 0.005f, kRate, 64));
      }
      step[pass] = max_step(out.left);
    }
    std::printf("Volume thrown between -48 and 0 dB under an A3: largest step %.5f, %.5f held at 0 dB\n", step[1], step[0]);
    EXPECT(step[1] < 1.05 * step[0], "Volume moves without a step larger than the note's own");
  }

  // 14. The output does not depend on the block size, through a silence
  // and a wake, with knobs moved in the silence; and a knob moved in
  // silence has arrived when the next note starts.
  {
    auto phrase = [&](int block, float gap, Stereo* out) {
      device.init(kRate);
      device.set_param(p::kBloom, 0.2f);
      device.set_param(p::kDamper, 0.05f);
      device.set_param(p::kHammer, 0.6f);
      device.set_param(p::kSweep, 0.7f);
      device.set_param(p::kSweepRate, 1.5f);
      device.set_param(p::kSympathy, 1.0f);
      device.note_on(1, 146.83f, 0.8f);
      *out = render(device, 0.1f, kRate, block);
      device.note_on(2, 220.0f, 0.6f);
      *out = concat(*out, render(device, 0.25f, kRate, block));
      device.note_off(1);
      device.note_off(2);
      *out = concat(*out, render(device, gap, kRate, block));
      device.set_param(p::kHarmonic, 3.0f);
      device.set_param(p::kVolume, -12.0f);
      device.set_param(p::kWidth, 1.0f);
      *out = concat(*out, render(device, 0.013f, kRate, block));
      device.note_on(3, 329.63f, 0.9f);
      device.note_on(4, 146.83f, 0.9f);
      *out = concat(*out, render(device, 0.4f, kRate, block));
    };
    double worst = 0.0;
    std::vector<float> gaps;
    for (float gap = 0.05f; gap < 0.26f; gap += 0.01f) gaps.push_back(gap);
    gaps.push_back(1.3f);
    for (float gap : gaps) {
      Stereo reference, one, big, odd;
      phrase(128, gap, &reference);
      phrase(1, gap, &one);
      phrase(2048, gap, &big);
      phrase(37, gap, &odd);
      worst = std::max(worst, std::max(max_difference(reference, one),
                                       std::max(max_difference(reference, big), max_difference(reference, odd))));
    }
    std::snprintf(label, sizeof label,
                  "blocks of 1, 37, 128 and 2048 frames give the same audio through %d silences of 50 ms to 1.3 s (max diff %g)",
                  static_cast<int>(gaps.size()), worst);
    std::printf("%s\n", label);
    EXPECT(worst < 1.0e-6, label);

    // Knobs moved while nothing sounds: the next note is the note of a
    // device that was set that way from the start. The device is put to
    // sleep off the beat of its control clock first.
    device.init(kRate);
    device.set_param(p::kDamper, 0.05f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.3f, kRate);
    device.process(13);
    device.note_off(1);
    render(device, 0.5f, kRate);
    device.set_param(p::kHarmonic, 5.0f);
    device.set_param(p::kBright, 0.9f);
    device.set_param(p::kBody, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kSweep, 0.5f);
    device.set_param(p::kVolume, 3.0f);
    render(device, 0.2f, kRate);
    // The second note of a session takes the second path: give the fresh device a first note too.
    other.init(kRate);
    other.set_param(p::kDamper, 0.05f);
    other.set_param(p::kHarmonic, 5.0f);
    other.set_param(p::kBright, 0.9f);
    other.set_param(p::kBody, 1.0f);
    other.set_param(p::kWidth, 0.0f);
    other.set_param(p::kSweep, 0.5f);
    other.set_param(p::kVolume, 3.0f);
    other.note_on(1, 220.0f, 0.8f);
    render(other, 0.3f, kRate);
    other.note_off(1);
    render(other, 0.7f, kRate);
    device.note_on(2, 330.0f, 0.8f);
    other.note_on(2, 330.0f, 0.8f);
    const Stereo moved = render(device, 0.5f, kRate);
    const Stereo set = render(other, 0.5f, kRate);
    std::snprintf(label, sizeof label, "knobs moved in silence have arrived for the next note (max diff %g, the note peaks at %.3f)",
                  max_difference(moved, set), both_peak(set));
    std::printf("%s\n", label);
    EXPECT(max_difference(moved, set) < 1.0e-6 && both_peak(set) > 0.05, label);
  }

  // 15. Two inits and the same notes give the same samples, with everything
  // that moves by itself switched on.
  {
    Stereo take[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kSweep, 1.0f);
      device.set_param(p::kSweepRate, 2.0f);
      device.set_param(p::kShimmer, 1.0f);
      device.set_param(p::kHammer, 0.5f);
      device.set_param(p::kSympathy, 1.0f);
      device.set_param(p::kBloom, 0.2f);
      device.note_on(1, 110.0f, 0.8f);
      device.note_on(2, 164.81f, 0.7f);
      take[which] = render(device, 1.5f, kRate);
      device.note_off(1);
      device.note_on(3, 329.63f, 0.9f);
      take[which] = concat(take[which], render(device, 1.5f, kRate));
    }
    EXPECT(take[0].left == take[1].left && take[0].right == take[1].right,
           "a second init and the same notes give bit-identical audio");
    EXPECT(rms(take[0].left) > 0.01, "(and there was something to compare)");
  }

  // 16. Voices: more keys than voices, a key struck twice while its voice is
  // still being taken, a note let go before it could start, bad notes.
  {
    // Twelve equal held keys, then a thirteenth struck twice at once: one
    // voice is taken, the second key of the chord is still there, and
    // letting everything go ends in silence.
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kBright, 0.0f);
    device.set_param(p::kShimmer, 0.0f);
    device.set_param(p::kVolume, -24.0f);  // under the soft clip, whose products of twelve notes land on the first
    for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) device.note_on(n, 100.0f + 37.0f * n, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(50, 2500.0f, 0.8f);
    device.note_on(50, 2500.0f, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    const std::vector<float> m = mid(out);
    const double taken = bin_level(m, kRate, 100.0, at(0.2), at(0.3)), kept = bin_level(m, kRate, 137.0, at(0.2), at(0.3));
    const double came = bin_level(m, kRate, 2500.0, at(0.2), at(0.3));
    std::printf("thirteenth key struck twice: the oldest note at %.1f dB, the next at %.1f dB, the new one at %.1f dB\n",
                db(taken), db(kept), db(came));
    EXPECT(db(taken) < db(kept) - 60.0 && db(came) > db(kept) - 12.0, "one voice is taken, the oldest; the others stay and the new note sounds");
    for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) device.note_off(n);
    device.note_off(50);
    render(device, 4.0f, kRate);
    out = render(device, 0.2f, kRate);
    EXPECT(both_peak(out) == 0.0, "after every key is let go the device is exactly silent: no voice is left behind");

    // A chord arriving on a full pool: both new notes sound.
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kBright, 0.0f);
    for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) device.note_on(n, 100.0f + 37.0f * n, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(60, 2500.0f, 0.8f);
    device.note_on(61, 3100.0f, 0.8f);
    const std::vector<float> two = mid(render(device, 0.5f, kRate));
    EXPECT(bin_level(two, kRate, 2500.0, at(0.2), at(0.3)) > 0.01 && bin_level(two, kRate, 3100.0, at(0.2), at(0.3)) > 0.01,
           "two keys arriving together on a full pool both sound");

    // Let go before its stolen start: it never sounds, and nothing sticks.
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) device.note_on(n, 100.0f + 37.0f * n, 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(70, 2500.0f, 0.8f);
    device.note_off(70);
    const std::vector<float> never = mid(render(device, 0.5f, kRate));
    EXPECT(bin_level(never, kRate, 2500.0, at(0.1), at(0.3)) < 1.0e-4, "a note let go before its stolen voice was free never sounds");
    for (int n = 0; n < MagnetPiano::kMaxVoices; ++n) device.note_off(n);
    render(device, 4.0f, kRate);
    EXPECT(both_peak(render(device, 0.2f, kRate)) == 0.0, "and the device still reaches silence");

    // The same key again while its strings ring: the same voice carries on.
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kDamper, 2.0f);
    device.set_param(p::kShimmer, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    render(device, 0.3f, kRate);
    device.note_on(1, 220.0f, 0.8f);
    out = render(device, 1.0f, kRate);
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kShimmer, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    const Stereo plain = render(device, 1.5f, kRate);
    std::printf("a key pressed again over its own tail settles at %.2f dB re the note alone\n",
                db(rms(out.left, at(0.7)) / rms(plain.left, at(1.2))));
    EXPECT(std::fabs(db(rms(out.left, at(0.7)) / rms(plain.left, at(1.2)))) < 0.5,
           "a key pressed again over its own tail is one note, not two that add or cancel");
    // ... also when the host gives the second press a new id: the new note
    // takes the ringing strings over, and the old voice ends.
    device.init(kRate);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kDamper, 6.0f);
    device.set_param(p::kShimmer, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5137f, kRate);
    device.note_off(1);
    render(device, 0.1f, kRate);
    device.note_on(2, 220.0f, 0.8f);
    out = render(device, 0.6f, kRate);
    const double together = rms(out.left, at(0.5)) / rms(plain.left, at(1.2));
    std::printf("the same pitch under a new id over a long tail: %.2f dB re the note alone (the tail was %.1f dB down)\n",
                db(together), -60.0 * 0.1 / 6.0);
    EXPECT(std::fabs(db(together)) < 0.5, "the same pitch under a new id is still one note: it takes the tail over, it does not add to it");
    const double seam = kink(out.left, 0, at(0.05));
    std::printf("the takeover leaves a corner of %.2e in the wave (the note's own, later: %.2e)\n", seam, kink(out.left, at(0.3)));
    EXPECT(seam < 3.0 * kink(out.left, at(0.3)) + 1.0e-5, "and it takes it over without a jump");

    // One pitch struck forty times is one set of strings, not forty strikes
    // or forty tails piled up: held, let go between, or under a new id each
    // time, the struck fundamental stays within 2 dB of one strike's. (The
    // magnets are sent to the eighth partial, so the fundamental is all hammer.)
    {
      double level[4] = {};
      for (int which = 0; which < 4; ++which) {
        device.init(kRate);
        device.set_param(p::kHammer, 1.0f);
        device.set_param(p::kHarmonic, 8.0f);
        device.set_param(p::kBright, 0.0f);
        device.set_param(p::kDamper, 12.0f);
        device.set_param(p::kShimmer, 0.0f);
        Stereo last;
        for (int n = 0; n < (which == 0 ? 1 : 40); ++n) {
          const int id = which == 3 ? 100 + n : 7;
          device.note_on(id, 220.0f, 0.8f);
          last = render(device, 0.1f, kRate);
          if (which >= 2) device.note_off(id);
          render(device, 0.1f, kRate);
        }
        level[which] = bin_level(mid(last), kRate, kA3, at(0.03), at(0.06));
      }
      std::printf("the struck fundamental after forty strikes of one key: held %+.2f dB, let go between %+.2f dB, a new id each time %+.2f dB re one strike\n",
                  db(level[1] / level[0]), db(level[2] / level[0]), db(level[3] / level[0]));
      for (int which = 1; which < 4; ++which) {
        EXPECT(db(level[which] / level[0]) > -1.0 && db(level[which] / level[0]) < 2.0,
               "a key struck again and again stays within 2 dB of one strike");
      }
    }

    // Bad notes and bad values.
    device.init(kRate);
    device.note_on(1, std::nanf(""), 0.8f);
    device.note_on(2, -5.0f, 0.8f);
    device.note_on(3, 1.0e9f, 5.0f);
    device.note_on(4, 220.0f, -3.0f);
    device.note_on(5, 440.0f, std::nanf(""));
    device.note_off(99);
    for (int id = -2; id < p::kNumParams + 2; ++id) {
      device.set_param(id, std::nanf(""));
      device.set_param(id, 1.0e30f);
      device.set_param(id, -1.0e30f);
    }
    out = render(device, 1.0f, kRate);
    EXPECT(finite(out.left) && finite(out.right) && both_peak(out) <= 1.0, "bad notes and bad values are survived");
  }

  // 17. Nothing folds back: at 44.1 kHz the partials of a top C stop at
  // 16 kHz, and everything that sounds is one of them.
  {
    bare(device, 44100.0f);
    device.set_param(p::kBloom, 0.05f);
    device.set_param(p::kBright, 1.0f);
    device.set_param(p::kHarmonic, 8.0f);
    device.set_param(p::kHammer, 1.0f);
    device.note_on(1, 4186.0f, 1.0f);
    const std::vector<float> m = mid(render(device, 1.0f, 44100.0f));
    double kept = 0.0;
    int count = 0;
    for (int n = 1; n <= 12; ++n) {
      const double hz = partial(4186.0, n);
      if (hz >= 16000.0) break;
      const double level = bin_level(m, 44100.0, hz, 22050, 17640);
      kept += level * level;
      ++count;
    }
    const double all = rms(m, 22050, 39690) * std::sqrt(2.0);
    std::printf("a top C at 44.1 kHz: %d partials under 16 kHz carry %.4f of everything that sounds\n", count, std::sqrt(kept) / all);
    EXPECT(count == 3 && std::sqrt(kept) / all > 0.995, "partials above 16 kHz are left out, not folded back");

    // A whistle stays where it can be heard: with the magnets on the eighth
    // harmonic and nothing else, the top two octaves sound the highest
    // partial under 10 kHz (the eighth of a C7 is past 16 kHz, its seventh
    // near 15 kHz).
    for (double hz : {1046.5, 2093.0, 4186.0}) {
      bare(device);
      device.set_param(p::kBloom, 0.05f);
      device.set_param(p::kHarmonic, 8.0f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      const std::vector<float> w = mid(render(device, 1.0f, kRate));
      const double found = dominant_frequency(w, kRate, 0.8 * hz, 20000.0, at(0.5), at(0.6));
      std::printf("Harmonic 8 on %.0f Hz sounds at %.0f Hz, %.1f dBFS\n", hz, found, db(peak(w, at(0.5))));
      EXPECT(found < 10000.0 && found > 5000.0, "the magnets feed the highest partial under 10 kHz, between 5 and 10 kHz for the top octaves");
      EXPECT(db(peak(w, at(0.5))) > -30.0, "and it is heard (over -30 dBFS)");
    }
  }

  // Cost with eight keys held: the default patch, then every partial of every key sounding.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("magnet-piano (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kBright, 1.0f);
  device.set_param(p::kHarmonic, 6.0f);
  device.set_param(p::kSweep, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("magnet-piano (8 keys, all twelve partials)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("magnet-piano");
}
