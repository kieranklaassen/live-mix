// Native harness for Clarinet (cpp/devices/clarinet). The kernel is checked
// first (the series against explicit sums, the brightness cap, the pipe
// comb), then the conformance pass covers silence, voice stealing, parameter
// abuse and other sample rates. The rest asserts what makes it a soft reed:
// tuning, the hollow low register and the cone's full one, brightness that
// follows the breath, the subtone, air that carries the pipe, how a note
// speaks, vibrato and growl, levels, aliasing, clicks and cost.

#include "../devices/clarinet/clarinet.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Clarinet;
namespace p = livemix::clarinet;

static Clarinet device;
static p::PipeComb<4096> comb;

static const float kRate = 48000.0f;
static const float kC2 = 65.406f, kC3 = 130.813f, kC4 = 261.626f, kC5 = 523.251f, kC6 = 1046.502f;
static const float kA6 = 1760.0f, kC7 = 2093.005f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so scans stay fast).
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

// The frequency of the strongest component within 4 % of `guess`, to a
// small fraction of a cent: scan, then narrow the span as the window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * 0.04;
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

// Harmonic `h` of `f0` in dB over n samples from `from`.
static double harmonic_db(const std::vector<float>& x, double f0, int h, size_t from, size_t n) {
  return db(bin_level(x, kRate, f0 * h, from, n));
}

// The level of noise around `hz` in dB: the mean power of 13 bins across
// ±`width` Hz.
static double noise_db(const std::vector<float>& x, double hz, double width, size_t from, size_t n) {
  double power = 0.0;
  for (int i = -6; i <= 6; ++i) {
    const double level = bin_level(x, kRate, hz + width * i / 6.0, from, n);
    power += level * level;
  }
  return db(std::sqrt(power / 13.0));
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

static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

static double both_step(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(max_step(s.left, from, to), max_step(s.right, from, to));
}

// The pitch of the fundamental over time in cents from `f0`, one value per
// millisecond. The signal is shifted down by f0 and averaged twice over two
// whole periods, which nulls every other harmonic; how fast the phase of
// what is left turns is the deviation.
static std::vector<float> pitch_track(const std::vector<float>& x, double f0) {
  const size_t n = x.size();
  const size_t box = static_cast<size_t>(std::lround(2.0 * kRate / f0));
  const size_t hop = static_cast<size_t>(kRate / 1000.0);
  std::vector<double> re(n), im(n);
  for (size_t i = 0; i < n; ++i) {
    const double phase = 2.0 * kPi * f0 * static_cast<double>(i) / kRate;
    re[i] = x[i] * std::cos(phase);
    im[i] = -x[i] * std::sin(phase);
  }
  for (int pass = 0; pass < 2; ++pass) {
    for (std::vector<double>* part : {&re, &im}) {
      std::vector<double>& v = *part;
      std::vector<double> sum(n + 1, 0.0);
      for (size_t i = 0; i < n; ++i) sum[i + 1] = sum[i] + v[i];
      for (size_t i = 0; i < n; ++i) v[i] = i + 1 >= box ? sum[i + 1] - sum[i + 1 - box] : 0.0;
    }
  }
  // Both averages together lag by box - 1 samples.
  std::vector<float> track;
  for (size_t centre = 0; centre + box - 1 + hop < n; centre += hop) {
    const size_t i = centre + box - 1;
    float value = 0.0f;
    if (centre >= box) {
      const double turn = std::atan2(im[i + hop] * re[i] - re[i + hop] * im[i], re[i + hop] * re[i] + im[i + hop] * im[i]);
      const double hz = f0 + turn * kRate / (2.0 * kPi * static_cast<double>(hop));
      value = static_cast<float>(1200.0 * std::log2(std::max(hz, 1.0) / f0));
    }
    track.push_back(value);
  }
  return track;
}

// Standard deviation of a stretch of a track.
static double spread(const std::vector<float>& x, size_t from, size_t to) {
  const double m = mean(x, from, to);
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += (x[i] - m) * (x[i] - m);
  return std::sqrt(sum / static_cast<double>(to - from));
}

// How often a track swings around its mean, in Hz, ignoring wobbles smaller
// than `dead` either side of it.
static double swing_rate(const std::vector<float>& x, size_t from, size_t to, double dead, double track_rate) {
  const double m = mean(x, from, to);
  int crossings = 0, state = 0;
  for (size_t i = from; i < to; ++i) {
    const int now = x[i] > m + dead ? 1 : (x[i] < m - dead ? -1 : 0);
    if (now != 0 && now != state) {
      if (state != 0) ++crossings;
      state = now;
    }
  }
  return 0.5 * crossings * track_rate / static_cast<double>(to - from);
}

// The level of the fundamental in dB once a millisecond, over four periods.
static std::vector<float> level_track(const std::vector<float>& x, double f0, size_t from, size_t to) {
  const size_t window = static_cast<size_t>(4.0 * kRate / f0);
  std::vector<float> track;
  for (size_t start = from; start + window < to; start += 48) {
    track.push_back(static_cast<float>(db(bin_level(x, kRate, f0, start, window))));
  }
  return track;
}

// The median, over 50 ms stretches, of how far a level track swings.
static double fast_swing(const std::vector<float>& track) {
  std::vector<double> swings;
  for (size_t start = 0; start + 50 <= track.size(); start += 50) {
    const auto range = std::minmax_element(track.begin() + start, track.begin() + start + 50);
    swings.push_back(*range.second - *range.first);
  }
  std::sort(swings.begin(), swings.end());
  return swings.empty() ? 0.0 : swings[swings.size() / 2];
}

// Seconds until a note first reaches half the peak it holds after 1 s. Read
// off the wave itself: a window as long as a few periods would add a delay
// of its own that grows with the period.
static double speech_time(const std::vector<float>& x) {
  const double held = peak(x, at(1.0), at(1.5));
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(static_cast<double>(x[i])) >= 0.5 * held) return static_cast<double>(i) / kRate;
  }
  return 1.0e9;
}

// The tone alone, tongued: no air, vibrato or growl.
static void plain(Clarinet& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kGrowl, 0.0f);
  d.set_param(p::kAttack, 0.015f);
  d.set_param(p::kRelease, 0.05f);
}

// One note held for `held` seconds and then let go for `tail`.
static Stereo play(float hz, float gain, float held, float tail = 0.0f, float rate = kRate) {
  device.note_on(1, hz, gain);
  Stereo out = render(device, held, rate);
  if (tail > 0.0f) {
    device.note_off(1);
    out = concat(out, render(device, tail, rate));
  }
  return out;
}

// The same note twice, without air and with Breath at `breath`: the first
// render is the tone, the difference between them is the air. This works
// because nothing in the tone's path reads Breath and the sum stays under
// the clip knee.
template <typename Patch>
static void split(Patch patch, float breath, float hz, float gain, float held, float tail,
                  std::vector<float>* tone, std::vector<float>* air, float rate = kRate) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(rate);
    patch(device);
    device.set_param(p::kBreath, pass == 0 ? 0.0f : breath);
    out[pass] = play(hz, gain, held, tail, rate);
  }
  *tone = mid(out[0]);
  *air = mid(out[1]);
  for (size_t i = 0; i < air->size(); ++i) (*air)[i] -= (*tone)[i];
}

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight
// moments a little apart, so a jump cannot hide in a zero crossing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      setup(device);
      render(device, 0.5f + 0.0013f * static_cast<float>(trial), kRate);
      if (pass == 0) event(device);
      out[pass] = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

static void no_patch(Clarinet&) {}
static void cone(Clarinet& d) { d.set_param(p::kBore, 1.0f); }

// Tone against air in dB over [from, to).
static double tone_to_air(const std::vector<float>& tone, const std::vector<float>& air, size_t from, size_t to) {
  return db(rms(tone, from, to) / rms(air, from, to));
}

// The impulse response of the pipe comb at `hz`.
static std::vector<float> ring(float hz, float open, float stopped, float seconds) {
  comb.clear();
  comb.tune(hz, 4000.0f, kRate);
  std::vector<float> out(at(seconds));
  for (size_t i = 0; i < out.size(); ++i) out[i] = comb.process(i == 0 ? 1.0f : 0.0f, open, stopped);
  return out;
}

// Magnitude of a response at `hz` (no window: the response starts at once).
static double response(const std::vector<float>& h, double hz) {
  const double w = 2.0 * kPi * hz / kRate;
  const double cr = std::cos(w), ci = std::sin(w);
  double pr = 1.0, pi = 0.0, re = 0.0, im = 0.0;
  for (float v : h) {
    re += v * pr;
    im -= v * pi;
    const double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
  }
  return std::sqrt(re * re + im * im);
}

// The driven-pipe kernel by itself (driven_pipe.h).
static void check_kernel() {
  char label[200];

  // Both halves of the series against the sums they stand for.
  {
    double worst = 0.0;
    for (float a : {0.1f, 0.5f, 0.8f}) {
      for (int step = 0; step < 64; ++step) {
        const double x = 2.0 * kPi * (step + 0.37) / 64.0;
        double odd = 0.0, even = 0.0, weight = 1.0;
        for (int h = 1; h <= 400; ++h) {
          if (h % 2 == 1) {
            odd += weight * std::cos(h * x);
          } else {
            even += weight * std::sin(h * x);
          }
          weight *= a;
        }
        const p::PipeTone tone = p::pipe_tone(static_cast<float>(std::sin(x)), static_cast<float>(std::cos(x)), a);
        worst = std::max(worst, std::fabs(tone.odd - odd));
        worst = std::max(worst, std::fabs(tone.even - even));
      }
    }
    std::snprintf(label, sizeof label, "the closed forms equal the sums of a^(h-1) cos(hx) over odd h and a^(h-1) sin(hx) over even h (worst error %.2g)", worst);
    EXPECT(worst < 1.0e-4, label);
  }

  // The cap puts the first harmonic above Nyquist 60 dB under the fundamental.
  for (float rate : {44100.0f, 96000.0f}) {
    for (float hz : {kC4, kC6, kC7}) {
      const float a = p::brightness_limit(hz, rate);
      const int first_above = static_cast<int>(std::floor(0.5f * rate / hz)) + 1;
      std::snprintf(label, sizeof label, "at %.0f Hz and %.0f Hz the cap %.3f leaves harmonic %d at -60 dB or less", hz, rate, a, first_above);
      EXPECT(a > 0.0f && a < 1.0f && std::pow(a, first_above - 1) <= 0.00101, label);
    }
  }
  EXPECT(p::brightness_limit(30000.0f, 44100.0f) == 0.0f, "a note above Nyquist gets no harmonics at all");
  EXPECT_NEAR(p::speech_seconds(100.0f, 25.0f) * 100.0f, 25.0 / kPi, 1.0e-3, "a quality of 25 is eight periods of speech time");

  // The comb as a pipe closed at one end: resonant on the note and its odd
  // multiples, a dip at the even ones.
  {
    const std::vector<float> stopped = ring(kC3, 0.0f, 0.9f, 1.0f);
    double best = 0.0, best_hz = 0.0;
    for (double hz = 100.0; hz <= 170.0; hz += 0.05) {
      const double level = response(stopped, hz);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    std::snprintf(label, sizeof label, "the stopped pipe's first resonance is on the note (%.2f Hz for %.2f)", best_hz, kC3);
    EXPECT(std::fabs(best_hz / kC3 - 1.0) < 0.01, label);
    const double one = db(response(stopped, kC3)), two = db(response(stopped, 2.0 * kC3)), three = db(response(stopped, 3.0 * kC3));
    std::snprintf(label, sizeof label, "the stopped pipe dips at twice the note (%.1f dB against %.1f and %.1f)", two, one, three);
    EXPECT(two < one - 6.0 && two < three - 6.0, label);
    std::printf("pipe comb, stopped: %.1f dB at f, %.1f at 2f, %.1f at 3f, first resonance %.2f Hz\n", one, two, three, best_hz);
  }
  // As an open pipe or a cone: resonant on every multiple.
  {
    const std::vector<float> open = ring(kC3, 0.9f, 0.0f, 1.0f);
    const double one = db(response(open, kC3)), two = db(response(open, 2.0 * kC3));
    const double between = db(response(open, 1.5 * kC3));
    std::snprintf(label, sizeof label, "the open pipe resonates at twice the note too (%.1f dB against %.1f, %.1f between)", two, one, between);
    EXPECT(std::fabs(two - one) < 4.0 && between < two - 6.0, label);
    std::printf("pipe comb, open: %.1f dB at f, %.1f at 1.5f, %.1f at 2f\n", one, between, two);
  }
  // Passive whatever the split between the two taps.
  for (float split_at : {0.0f, 0.5f, 1.0f}) {
    comb.clear();
    comb.tune(kC3, 4000.0f, kRate);
    rng_state() = 0x1234567u;
    double worst = 0.0;
    bool is_finite = true;
    for (size_t i = 0; i < at(2.0); ++i) {
      const float y = comb.process(white(), 0.9f * split_at, 0.9f * (1.0f - split_at));
      is_finite = is_finite && !std::isnan(y) && !std::isinf(y);
      worst = std::max(worst, std::fabs(static_cast<double>(y)));
    }
    std::snprintf(label, sizeof label, "the pipe stays bounded on full-scale noise with %.0f %% open (peak %.1f)", 100.0 * split_at, worst);
    EXPECT(is_finite && worst < 12.0, label);
  }
}

int main() {
  check_kernel();

  Conformance spec;
  spec.name = "clarinet";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A released note ends once its breath is 60 dB down: twice Release.
  spec.tail_seconds = 2.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[200];

  // Tuning: the default patch at the gain the app plays, five octaves and
  // the bass clarinet's bottom B flat, at three sample rates.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (float hz : {58.27f, kC2, kC3, kC4, kC5, kC6}) {
      device.init(rate);
      Stereo out = play(hz, 0.8f, 3.0f, 0.0f, rate);
      const double error = cents(fine_pitch(out.left, rate, hz, at(1.0, rate), at(3.0, rate)), hz);
      worst = std::max(worst, std::fabs(error));
    }
    std::snprintf(label, sizeof label, "in tune within 3 cents from B flat 1 to C6 at %.0f Hz (worst %.2f)", rate, worst);
    EXPECT(worst < 3.0, label);
    std::printf("tuning at %.1f kHz: worst %.2f cents\n", rate / 1000.0, worst);
  }

  // The hollow low register: on C3 the default patch has the odd harmonics
  // and next to nothing between them.
  {
    device.init(kRate);
    Stereo out = play(kC3, 0.8f, 3.0f);
    double h[6];
    for (int k = 1; k <= 5; ++k) h[k] = harmonic_db(out.left, kC3, k, at(1.0), at(2.0));
    const double odd = (h[1] + h[3] + h[5]) / 3.0;
    std::snprintf(label, sizeof label, "harmonics 2 and 4 of C3 are 20 dB under the mean of 1, 3 and 5 (%.1f and %.1f under)", odd - h[2], odd - h[4]);
    EXPECT(h[2] < odd - 20.0 && h[4] < odd - 20.0, label);
    EXPECT(h[3] < h[1] && h[5] < h[3], "and the odd harmonics fall away from the fundamental");
    std::printf("C3, default patch, harmonics 1 to 5: %.1f %.1f %.1f %.1f %.1f dB\n", h[1], h[2], h[3], h[4], h[5]);
  }
  // Above the tone-hole cutoff the even harmonics are back: blown hard, the
  // even harmonics between 2 and 3 kHz sit near their odd neighbours.
  {
    plain(device);
    device.set_param(p::kBlow, 1.0f);
    Stereo out = play(kC3, 0.8f, 3.0f);
    double worst = 0.0;
    for (int k = 16; k <= 22; k += 2) {
      const double neighbours = 0.5 * (harmonic_db(out.left, kC3, k - 1, at(1.0), at(2.0)) + harmonic_db(out.left, kC3, k + 1, at(1.0), at(2.0)));
      worst = std::max(worst, std::fabs(harmonic_db(out.left, kC3, k, at(1.0), at(2.0)) - neighbours));
    }
    std::snprintf(label, sizeof label, "even harmonics above 2 kHz are within 8 dB of their odd neighbours (worst %.1f)", worst);
    EXPECT(worst < 8.0, label);
    const double low_even = harmonic_db(out.left, kC3, 2, at(1.0), at(2.0)) - harmonic_db(out.left, kC3, 3, at(1.0), at(2.0));
    std::snprintf(label, sizeof label, "while harmonic 2 stays far under harmonic 3 (%.1f dB)", low_even);
    EXPECT(low_even < -20.0, label);
  }
  // The cone: every harmonic, the second close to the first.
  {
    plain(device);
    device.set_param(p::kBore, 1.0f);
    device.set_param(p::kAttack, 0.1f);
    Stereo out = play(kC3, 0.8f, 3.0f);
    double h[6];
    for (int k = 1; k <= 5; ++k) h[k] = harmonic_db(out.left, kC3, k, at(1.0), at(2.0));
    std::snprintf(label, sizeof label, "at the cone end harmonic 2 of C3 is within 10 dB of harmonic 1 (%.1f under)", h[1] - h[2]);
    EXPECT(h[2] > h[1] - 10.0, label);
    EXPECT(std::fabs(h[2] - 0.5 * (h[1] + h[3])) < 3.0 && std::fabs(h[4] - 0.5 * (h[3] + h[5])) < 3.0,
           "and the even harmonics lie on the line through the odd ones");
    std::printf("C3, cone, harmonics 1 to 5: %.1f %.1f %.1f %.1f %.1f dB\n", h[1], h[2], h[3], h[4], h[5]);
  }
  // Between the ends Bore brings the even harmonics up steadily.
  {
    double second[5];
    bool rising = true;
    for (int step = 0; step < 5; ++step) {
      plain(device);
      device.set_param(p::kBore, 0.25f * static_cast<float>(step));
      Stereo out = play(kC3, 0.8f, 2.0f);
      second[step] = harmonic_db(out.left, kC3, 2, at(1.0), at(0.9)) - harmonic_db(out.left, kC3, 1, at(1.0), at(0.9));
      rising = rising && (step == 0 || second[step] > second[step - 1] + 1.0);
    }
    std::snprintf(label, sizeof label, "harmonic 2 against harmonic 1 rises with every quarter of Bore (%.1f %.1f %.1f %.1f %.1f dB)", second[0], second[1], second[2], second[3], second[4]);
    EXPECT(rising, label);
  }

  // Brightness follows the breath inside one note. Through a slow attack
  // harmonic 3 rises three times as fast as harmonic 1 (in dB).
  {
    plain(device);
    device.set_param(p::kAttack, 2.0f);
    Stereo out = play(kC4, 0.8f, 2.2f);
    double n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (double t = 0.1; t < 1.8; t += 0.05) {
      const double h1 = harmonic_db(out.left, kC4, 1, at(t), at(0.05));
      const double h3 = harmonic_db(out.left, kC4, 3, at(t), at(0.05));
      n += 1;
      sx += h1;
      sy += h3;
      sxx += h1 * h1;
      sxy += h1 * h3;
    }
    const double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    std::snprintf(label, sizeof label, "through a slow attack harmonic 3 rises about 3 dB for each dB of harmonic 1 (slope %.2f)", slope);
    EXPECT(slope > 2.5 && slope < 3.5, label);
    std::printf("power law inside one note: harmonic 3 against harmonic 1, slope %.2f\n", slope);
  }
  // And it falls with it: a fading note darkens.
  {
    plain(device);
    device.set_param(p::kAttack, 0.1f);
    device.set_param(p::kRelease, 2.0f);
    Stereo out = play(kC4, 0.8f, 1.5f, 1.0f);
    const double held = harmonic_db(out.left, kC4, 3, at(1.0), at(0.4)) - harmonic_db(out.left, kC4, 1, at(1.0), at(0.4));
    // The tone covers 60 dB in 2 s, so a third of a second is 10 dB.
    const size_t from = at(1.5 + 0.333 - 0.025);
    const double fallen = harmonic_db(out.left, kC4, 1, at(1.0), at(0.4)) - harmonic_db(out.left, kC4, 1, from, at(0.05));
    const double late = harmonic_db(out.left, kC4, 3, from, at(0.05)) - harmonic_db(out.left, kC4, 1, from, at(0.05));
    std::snprintf(label, sizeof label, "with the fundamental %.1f dB down in the release, harmonic 3 against it has fallen %.1f dB", fallen, held - late);
    EXPECT(fallen > 7.0 && fallen < 13.0 && late < held - 6.0, label);
  }
  // Across velocities: a soft note is nearly a sine, a hard one is reedy.
  {
    double ratio[2];
    int which = 0;
    for (float gain : {0.2f, 1.0f}) {
      plain(device);
      Stereo out = play(kC4, gain, 2.0f);
      // A short window: the pitch leans with the level, off a long one's bin.
      ratio[which++] = harmonic_db(out.left, kC4, 3, at(1.0), at(0.2)) - harmonic_db(out.left, kC4, 1, at(1.0), at(0.2));
    }
    std::snprintf(label, sizeof label, "harmonic 3 against harmonic 1 is %.1f dB at gain 0.2 and %.1f dB at gain 1.0", ratio[0], ratio[1]);
    EXPECT(ratio[0] < -25.0 && ratio[1] > ratio[0] + 15.0, label);
    std::printf("%s\n", label);
  }
  // No chiff: nothing in the onset stands higher against the fundamental
  // than it does in the held note. C5, so that 10 ms holds five periods.
  for (float bore : {0.0f, 1.0f}) {
    plain(device);
    device.set_param(p::kBore, bore);
    Stereo out = play(kC5, 0.8f, 1.0f);
    double worst = -1.0e9;
    for (int k = 2; k <= 3; ++k) {
      const double held = harmonic_db(out.left, kC5, k, at(0.5), at(0.4)) - harmonic_db(out.left, kC5, 1, at(0.5), at(0.4));
      for (int window = 0; window < 4; ++window) {
        const size_t from = at(0.01 * window);
        const double now = harmonic_db(out.left, kC5, k, from, at(0.01)) - harmonic_db(out.left, kC5, 1, from, at(0.01));
        worst = std::max(worst, now - held);
      }
    }
    std::snprintf(label, sizeof label, "Bore %.0f: no harmonic stands higher in the first 40 ms than in the held note (at most %+.1f dB)", bore, worst);
    EXPECT(worst < 2.0, label);
  }
  // The same with the air on: the default patch never starts brighter than
  // it holds.
  {
    device.init(kRate);
    Stereo out = play(kC5, 0.8f, 1.0f);
    const double held = energy_above(out.left, 2000.0, kRate, at(0.5), at(0.9)) * rms(out.left, at(0.5), at(0.9)) * rms(out.left, at(0.5), at(0.9));
    double worst = 0.0;
    for (int window = 0; window < 10; ++window) {
      const size_t from = at(0.01 * window), to = at(0.01 * (window + 1));
      worst = std::max(worst, energy_above(out.left, 2000.0, kRate, from, to) * rms(out.left, from, to) * rms(out.left, from, to));
    }
    std::snprintf(label, sizeof label, "the onset never has more above 2 kHz than the held note (%.1f dB against it)", 10.0 * std::log10(worst / held));
    EXPECT(worst < held * 1.6, label);
  }

  // The subtone. The air falls half as fast as the tone, so the softer the
  // note, the more of it is breath.
  {
    std::vector<float> tone, air;
    split(no_patch, 1.0f, kC3, 0.8f, 3.0f, 0.0f, &tone, &air);
    std::vector<float> tone_half, air_half;
    split(no_patch, 0.5f, kC3, 0.8f, 3.0f, 0.0f, &tone_half, &air_half);
    double residual = 0.0;
    for (size_t i = 0; i < air.size(); ++i) residual = std::max(residual, std::fabs(static_cast<double>(air[i]) - 4.0 * air_half[i]));
    std::snprintf(label, sizeof label, "the tone does not depend on Breath: the air at 1 is four times the air at 0.5 (residual %.2g)", residual);
    EXPECT(tone == tone_half && residual < 1.0e-5 && rms(air) > 1.0e-4, label);

    double share[2];
    int which = 0;
    for (float gain : {0.2f, 1.0f}) {
      split(no_patch, p::kParamDefault[p::kBreath], kC3, gain, 3.0f, 0.0f, &tone, &air);
      share[which++] = tone_to_air(tone, air, at(1.0), at(3.0));
    }
    std::snprintf(label, sizeof label, "tone against air is %.1f dB at gain 0.2 and %.1f dB at gain 1.0", share[0], share[1]);
    EXPECT(share[0] < share[1] - 5.0, label);
    std::printf("default patch, C3: %s\n", label);
  }
  // The same share of breath whatever the host's sample rate: the noise is
  // scaled so that what falls in the heard band does not thin out as the
  // rate rises.
  {
    double share[2];
    int which = 0;
    for (float rate : {48000.0f, 96000.0f}) {
      std::vector<float> tone, air;
      split(no_patch, 1.0f, kC3, 0.8f, 3.0f, 0.0f, &tone, &air, rate);
      share[which++] = tone_to_air(tone, air, at(1.0, rate), at(3.0, rate));
    }
    std::snprintf(label, sizeof label, "tone against air is the same at 48 and 96 kHz (%.1f and %.1f dB)", share[0], share[1]);
    EXPECT(std::fabs(share[0] - share[1]) < 1.0, label);
    std::printf("%s\n", label);
  }
  // Through the release the air outlasts the tone.
  {
    std::vector<float> tone, air;
    split([](Clarinet& d) { d.set_param(p::kRelease, 2.0f); }, p::kParamDefault[p::kBreath], kC3, 0.8f, 1.5f, 1.0f, &tone, &air);
    const double held = tone_to_air(tone, air, at(0.5), at(1.5));
    const double late = tone_to_air(tone, air, at(2.0), at(2.4));
    std::snprintf(label, sizeof label, "tone against air falls from %.1f dB held to %.1f dB half a second into a 2 s release", held, late);
    EXPECT(late < held - 6.0, label);
  }
  // The subtone preset, played softly: more breath than a clarinet ever
  // has, and next to no overtones. (Its vibrato is left off so the
  // harmonics can be read.)
  {
    std::vector<float> tone, air;
    split(
        [](Clarinet& d) {
          d.set_param(p::kBore, 1.0f);
          d.set_param(p::kBlow, 0.2f);
          d.set_param(p::kAttack, 0.18f);
          d.set_param(p::kRelease, 0.5f);
        },
        0.85f, kC3, 0.6f, 3.0f, 0.0f, &tone, &air);
    const double ratio = tone_to_air(tone, air, at(1.0), at(3.0));
    std::snprintf(label, sizeof label, "the subtone preset has a harmonic-to-noise ratio between 5 and 20 dB (%.1f)", ratio);
    EXPECT(ratio > 5.0 && ratio < 20.0, label);
    double highest = -1.0e9;
    for (int k = 4; k <= 10; ++k) {
      highest = std::max(highest, harmonic_db(tone, kC3, k, at(1.0), at(0.2)) - harmonic_db(tone, kC3, 1, at(1.0), at(0.2)));
    }
    std::snprintf(label, sizeof label, "and its harmonics above the third are 30 dB under the fundamental (%.1f)", highest);
    EXPECT(highest < -30.0, label);
    std::printf("subtone preset, C3 at gain 0.6: tone against air %.1f dB, harmonics above the third at most %.1f dB\n", ratio, highest);
  }

  // The air carries the pipe. Cylinder: peaks at the odd multiples of the
  // note, dips at the even ones.
  {
    std::vector<float> tone, air;
    split(no_patch, 1.0f, kC3, 0.8f, 5.0f, 0.0f, &tone, &air);
    const double width = 0.06 * kC3;
    double level[6];
    for (int k = 1; k <= 5; ++k) level[k] = noise_db(air, kC3 * k, width, at(1.0), at(4.0));
    const double peaks = std::min(level[1], std::min(level[3], level[5]));
    const double dips = std::max(level[2], level[4]);
    std::snprintf(label, sizeof label, "cylinder: air at 1, 3 and 5 times the note stands 6 dB over air at 2 and 4 times (%.1f dB)", peaks - dips);
    EXPECT(peaks > dips + 6.0, label);
    std::printf("air on C3, cylinder, at 1 to 5 times the note: %.1f %.1f %.1f %.1f %.1f dB\n", level[1], level[2], level[3], level[4], level[5]);
  }
  // Cone: a peak at every multiple.
  {
    std::vector<float> tone, air;
    split(cone, 1.0f, kC3, 0.8f, 5.0f, 0.0f, &tone, &air);
    const double width = 0.06 * kC3;
    double worst = 1.0e9;
    for (int k = 1; k <= 4; ++k) {
      const double on = noise_db(air, kC3 * k, width, at(1.0), at(4.0));
      const double off = std::max(noise_db(air, kC3 * (k - 0.5), width, at(1.0), at(4.0)), noise_db(air, kC3 * (k + 0.5), width, at(1.0), at(4.0)));
      worst = std::min(worst, on - off);
    }
    std::snprintf(label, sizeof label, "cone: air at every multiple of the note stands 6 dB over air between them (%.1f dB)", worst);
    EXPECT(worst > 6.0, label);
  }

  // Speech: at the shortest Attack a low note still takes its time.
  {
    double seconds[2];
    int which = 0;
    for (float hz : {kC2, kC5}) {
      plain(device);
      Stereo out = play(hz, 0.8f, 1.6f);
      seconds[which++] = speech_time(out.left);
    }
    std::snprintf(label, sizeof label, "C2 speaks in %.0f ms and C5 in %.0f ms at the shortest Attack", 1000.0 * seconds[0], 1000.0 * seconds[1]);
    EXPECT(seconds[0] > 3.0 * seconds[1] && seconds[0] < 0.25, label);
    std::printf("%s\n", label);
  }
  // Pitch leans flat as a note gets louder.
  {
    double pitch[2];
    int which = 0;
    for (float gain : {0.2f, 1.0f}) {
      plain(device);
      Stereo out = play(kC4, gain, 3.0f);
      pitch[which++] = cents(fine_pitch(out.left, kRate, kC4, at(1.0), at(3.0)), kC4);
    }
    std::snprintf(label, sizeof label, "gain 1.0 is 2 to 8 cents under gain 0.2 (%+.2f against %+.2f cents)", pitch[1], pitch[0]);
    EXPECT(pitch[0] - pitch[1] > 2.0 && pitch[0] - pitch[1] < 8.0, label);
    std::printf("pitch against level: %+.2f cents at gain 0.2, %+.2f at gain 1.0\n", pitch[0], pitch[1]);
  }
  // Vibrato: about 5 Hz, and late.
  {
    plain(device);
    device.set_param(p::kVibrato, 1.0f);
    Stereo out = play(kC4, 0.8f, 5.0f);
    const std::vector<float> track = pitch_track(out.left, kC4);
    const auto range = std::minmax_element(track.begin() + 1500, track.begin() + 4500);
    const double swing = 0.5 * (*range.second - *range.first);
    const double rate = swing_rate(track, 1500, 4500, 3.0, 1000.0);
    double early = 0.0;
    for (size_t i = 80; i < 200; ++i) early = std::max(early, std::fabs(static_cast<double>(track[i])));
    std::snprintf(label, sizeof label, "full vibrato swings ±%.1f cents at %.2f Hz, ±%.1f in the first 200 ms, mean %+.2f", swing, rate, early, mean(track, 1500, 4500));
    EXPECT(swing > 15.0 && swing < 60.0 && std::fabs(rate - 5.0) < 0.4, label);
    EXPECT(early < 0.25 * swing, "vibrato arrives after the note has spoken");
    EXPECT(std::fabs(mean(track, 1500, 4500)) < 3.0, "vibrato swings around the note");
    std::printf("%s\n", label);

    plain(device);
    Stereo straight = play(kC4, 0.8f, 5.0f);
    const std::vector<float> flat = pitch_track(straight.left, kC4);
    std::snprintf(label, sizeof label, "with Vibrato at zero the pitch is steady (spread %.2f cents)", spread(flat, 300, 4900));
    EXPECT(spread(flat, 300, 4900) < 1.0, label);
  }
  // Growl: a fast flutter in the level.
  {
    double swing[2], rate = 0.0;
    int which = 0;
    for (float growl : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kGrowl, growl);
      Stereo out = play(kC5, 0.8f, 2.0f);
      const std::vector<float> track = level_track(out.left, kC5, at(0.5), at(1.5));
      swing[which++] = fast_swing(track);
      if (growl > 0.0f) rate = swing_rate(track, 0, track.size(), 1.0, 1000.0);
    }
    std::snprintf(label, sizeof label, "full Growl swings the level by %.1f dB at %.1f Hz; without it the level moves %.2f dB", swing[1], rate, swing[0]);
    EXPECT(swing[1] > 3.0 && rate > 20.0 && rate < 45.0 && swing[0] < 0.5, label);
    std::printf("%s\n", label);
  }

  // Attack: a slow one rises all the way and starts from nearly nothing.
  {
    plain(device);
    device.set_param(p::kAttack, 2.0f);
    Stereo out = play(kC4, 0.8f, 2.6f);
    const double held = db(rms(out.left, at(2.2), at(2.6)));
    bool rising = true;
    double before = -200.0;
    for (int window = 0; window < 16; ++window) {
      const double now = db(rms(out.left, at(0.1 * window), at(0.1 * (window + 1))));
      rising = rising && now > before - 0.2;
      before = now;
    }
    const double early = db(rms(out.left, at(0.15), at(0.25))) - held;
    std::snprintf(label, sizeof label, "an Attack of 2 s rises throughout and is %.1f dB under the held level at 0.2 s", -early);
    EXPECT(rising && early < -20.0, label);
    std::snprintf(label, sizeof label, "and it starts without a step (largest %.2g in the first 100 ms)", both_step(out, 0, at(0.1)));
    EXPECT(both_step(out, 0, at(0.1)) < 0.001, label);
  }
  // Release: the tone is 60 dB down after it, and the voice is freed.
  {
    plain(device);
    device.set_param(p::kRelease, 1.0f);
    Stereo out = play(kC4, 0.8f, 1.0f, 2.6f);
    const double fallen = db(rms(out.left, at(0.5), at(1.0))) - db(rms(out.left, at(1.975), at(2.025)));
    std::snprintf(label, sizeof label, "a Release of 1 s leaves the tone 60 dB down after 1 s (%.1f dB)", fallen);
    EXPECT(fallen > 54.0 && fallen < 68.0, label);
    EXPECT(both_peak(out, at(1.0 + 2.35)) == 0.0, "and the voice is silent and freed soon after twice the Release");
  }
  // The longest Release still lets go.
  {
    device.init(kRate);
    device.set_param(p::kRelease, 5.0f);
    play(kC3, 1.0f, 0.5f, 10.4f);
    Stereo after = render(device, 0.2f, kRate);
    EXPECT(both_peak(after) == 0.0, "a 5 s Release is exactly silent 10.4 s after the key is let go");
  }

  // Voices. A ninth note takes the oldest of eight, which goes quickly.
  {
    plain(device);
    device.set_param(p::kAttack, 0.1f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    device.note_on(8, 987.77f, 0.8f);
    Stereo after = render(device, 0.6f, kRate);
    const double stolen = db(bin_level(after.left, kRate, 110.0, at(0.3), at(0.3))) - db(bin_level(before.left, kRate, 110.0, at(0.6), at(0.3)));
    const double added = db(bin_level(after.left, kRate, 987.77, at(0.3), at(0.3)));
    std::snprintf(label, sizeof label, "a ninth note sounds (%.1f dBFS) and the oldest is gone (%.1f dB)", added, stolen);
    EXPECT(added > -40.0 && stolen < -30.0, label);
    // Letting go of a note that is still waiting for its voice ends it.
    device.note_on(9, 1174.66f, 0.8f);
    device.note_off(9);
    Stereo cancelled = render(device, 0.5f, kRate);
    EXPECT(db(bin_level(cancelled.left, kRate, 1174.66, at(0.2), at(0.3))) < -80.0, "a stolen voice let go before it starts never sounds");
    for (int n = 0; n < 9; ++n) device.note_off(n);
    render(device, 0.4f, kRate);
    EXPECT(both_peak(render(device, 0.2f, kRate)) == 0.0, "and every voice is freed afterwards");
  }
  // The same key twice, one release.
  {
    plain(device);
    device.note_on(1, kC4, 0.8f);
    render(device, 0.3f, kRate);
    device.note_on(1, kC4, 0.8f);
    Stereo both = render(device, 0.3f, kRate);
    device.note_off(1);
    render(device, 0.4f, kRate);
    EXPECT(rms(both.left, at(0.2)) > 1.0e-3 && both_peak(render(device, 0.2f, kRate)) == 0.0, "a key struck twice sounds once and is silenced by one release");
  }

  // Levels at the default patch.
  {
    device.init(kRate);
    Stereo one = play(220.0f, 0.7f, 3.0f);
    const double soft_db = db(both_peak(one));
    std::snprintf(label, sizeof label, "one note at gain 0.7 peaks between -24 and -10 dBFS (%.1f)", soft_db);
    EXPECT(soft_db > -24.0 && soft_db < -10.0, label);
    double lowest = 0.0, highest = -200.0;
    for (float hz : {kC2, kC3, 220.0f, kC4, kC5, kC6}) {
      device.init(kRate);
      Stereo out = play(hz, 0.8f, 3.0f);
      lowest = std::min(lowest, db(both_peak(out)));
      highest = std::max(highest, db(both_peak(out)));
    }
    std::snprintf(label, sizeof label, "one note at gain 0.8 peaks between -22 and -16 dBFS from C2 to C6 (%.1f to %.1f)", lowest, highest);
    EXPECT(lowest > -22.0 && highest < -16.0, label);
    std::printf("levels: %.1f dBFS at gain 0.7; %.1f to %.1f dBFS at gain 0.8\n", soft_db, lowest, highest);

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 12.0f, kRate);
    std::snprintf(label, sizeof label, "ten held notes stay under the clip knee (peak %.3f over 12 s)", both_peak(ten));
    EXPECT(both_peak(ten) < 0.5, label);
    std::printf("ten held notes peak at %.3f over 12 s\n", both_peak(ten));
  }

  // Aliasing: the highest notes at 44.1 kHz, blown as hard as they go.
  // Nothing between the harmonics comes within 50 dB of the fundamental,
  // which covers every frequency a harmonic above Nyquist would fold to.
  for (float hz : {kA6, kC7}) {
    for (float bore : {0.0f, 1.0f}) {
      const float rate = 44100.0f;
      plain(device, rate);
      device.set_param(p::kBlow, 1.0f);
      device.set_param(p::kBore, bore);
      Stereo out = play(hz, 1.0f, 1.0f, 0.0f, rate);
      const size_t from = at(0.5, rate), n = at(0.4, rate);
      const double f1 = fine_pitch(out.left, rate, hz, from, from + n);
      const double fundamental = bin_level(out.left, rate, f1, from, n);
      double worst = 0.0, worst_hz = 0.0;
      for (double scan = 30.0; scan < 0.5 * rate; scan += 2.5) {
        const double nearest = std::round(scan / f1) * f1;
        if (nearest > 0.0 && std::fabs(scan - nearest) < 60.0) continue;
        const double level = bin_level(out.left, rate, scan, from, n);
        if (level > worst) {
          worst = level;
          worst_hz = scan;
        }
      }
      std::snprintf(label, sizeof label, "%.0f Hz at 44.1 kHz, Bore %.0f: nothing between the harmonics within 50 dB of the fundamental (%.1f dB at %.0f Hz)", hz, bore, db(worst / fundamental), worst_hz);
      EXPECT(db(worst / fundamental) < -50.0, label);
      std::printf("aliasing, %.0f Hz, Bore %.0f: strongest stray component %.1f dB at %.0f Hz\n", hz, bore, db(worst / fundamental), worst_hz);
    }
  }

  // Clicks. Whatever an event changes, it changes gradually: a third of a
  // millisecond in, the sound has moved a small part of the way.
  {
    const auto eight = [](Clarinet& d) {
      d.set_param(p::kAttack, 0.1f);
      for (int n = 0; n < 8; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    };
    const auto one = [](Clarinet& d) {
      d.set_param(p::kAttack, 0.1f);
      d.note_on(1, kC3, 0.8f);
    };
    const double steal = suddenness(eight, [](Clarinet& d) { d.note_on(8, 987.77f, 0.8f); });
    const double again = suddenness(one, [](Clarinet& d) { d.note_on(1, kC3, 0.8f); });
    const double off = suddenness(one, [](Clarinet& d) { d.note_off(1); });
    std::snprintf(label, sizeof label, "a steal, a second strike and the shortest release start gradually (%.2f, %.2f and %.2f of the way)", steal, again, off);
    EXPECT(steal < 0.15 && again < 0.15 && off < 0.15, label);
    std::printf("after 8 samples: a steal is %.2f of the way, a second strike %.2f, a note off %.2f\n", steal, again, off);
  }
  // Blow, Bore and Volume moved across their range in one step.
  for (int id : {p::kBlow, p::kBore, p::kVolume}) {
    const float low = id == p::kVolume ? -12.0f : p::kParamMin[id];
    const double up = suddenness(
        [&](Clarinet& d) {
          d.set_param(id, low);
          d.note_on(1, kC3, 0.8f);
        },
        [&](Clarinet& d) { d.set_param(id, p::kParamMax[id]); });
    const double down = suddenness(
        [&](Clarinet& d) {
          d.set_param(id, p::kParamMax[id]);
          d.note_on(1, kC3, 0.8f);
        },
        [&](Clarinet& d) { d.set_param(id, low); });
    std::snprintf(label, sizeof label, "param %d moved across its range in one step is smoothed (%.2f and %.2f of the way after 8 samples)", id, up, down);
    EXPECT(up < 0.15 && down < 0.15, label);
  }
  // And nothing steps further than the sound itself does.
  {
    plain(device);
    device.set_param(p::kAttack, 0.1f);
    device.note_on(1, kC3, 0.8f);
    Stereo before = render(device, 1.0f, kRate);
    const double steady = both_step(before, at(0.5));
    device.note_on(1, kC3, 0.8f);
    Stereo struck = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "striking a held key again adds no step (%.4f against %.4f)", both_step(struck), steady);
    EXPECT(both_step(struck) < 1.3 * steady, label);
    device.set_param(p::kRelease, 0.03f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo released = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label, "the shortest Release adds no step (%.4f against %.4f)", both_step(released), steady);
    EXPECT(both_step(released) < 1.3 * steady, label);
  }

  // Stereo: a little width from the air, never at the cost of mono.
  for (float hz : {kC2, kC4, kC6}) {
    device.init(kRate);
    device.set_param(p::kBreath, 1.0f);
    Stereo out = play(hz, 0.8f, 3.0f);
    const double width = db(rms(side(out), at(1.0)) / rms(mid(out), at(1.0)));
    std::snprintf(label, sizeof label, "at %.0f Hz the side sits %.1f dB under the mid with Breath at 1", hz, -width);
    EXPECT(width < -10.0 && rms(side(out), at(1.0)) > 0.0, label);
  }

  // The same chord whatever the host's block size.
  {
    Stereo renders[3];
    const int blocks[3] = {128, 1, 2048};
    for (int which = 0; which < 3; ++which) {
      device.init(kRate);
      device.set_param(p::kVibrato, 0.5f);
      device.set_param(p::kGrowl, 0.3f);
      device.note_on(1, kC3, 0.8f);
      device.note_on(2, 196.0f, 0.6f);
      device.note_on(3, 329.63f, 0.9f);
      renders[which] = render(device, 1.0f, kRate, blocks[which]);
      device.note_off(2);
      device.set_param(p::kBore, 1.0f);
      renders[which] = concat(renders[which], render(device, 0.5f, kRate, blocks[which]));
    }
    double worst = 0.0;
    for (int which = 1; which < 3; ++which) {
      for (size_t i = 0; i < renders[0].size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(renders[which].left[i]) - renders[0].left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(renders[which].right[i]) - renders[0].right[i]));
      }
    }
    std::snprintf(label, sizeof label, "blocks of 1, 128 and 2048 frames give the same audio (max difference %.2g)", worst);
    EXPECT(worst < 1.0e-4, label);
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("clarinet (8 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("clarinet");
}
