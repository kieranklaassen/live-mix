// Native harness for Overtone (cpp/devices/overtone). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it this instrument: one
// harmonic of the held note singled out, gliding, and walking by itself.

#include <complex>

#include "../devices/overtone/overtone.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Overtone;
namespace p = livemix::overtone;

static Overtone device;
static Overtone other;

static const float kRate = 48000.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// --- measuring ----------------------------------------------------------------------------

// Hann-windowed amplitude spectrum of 2^log2n samples from `from`: a
// full-scale sine reads 1.0 at its peak when it sits on a bin.
struct Spectrum {
  std::vector<double> amp;
  double bin_hz = 1.0;
};

static Spectrum spectrum(const std::vector<float>& x, size_t from, int log2n, double rate) {
  const size_t n = static_cast<size_t>(1) << log2n;
  std::vector<std::complex<double>> a(n);
  double window_sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = (from + i < x.size() ? x[from + i] : 0.0f) * w;
    window_sum += w;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> turn = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= turn;
      }
    }
  }
  Spectrum out;
  out.bin_hz = rate / static_cast<double>(n);
  out.amp.resize(n / 2);
  for (size_t i = 0; i < n / 2; ++i) out.amp[i] = 2.0 * std::abs(a[i]) / window_sum;
  return out;
}

// Amplitude of the component at `hz`, wherever it falls between bins: the
// power of the Hann main lobe (±2 bins), which is 1.5 times the peak's.
static double level_at(const Spectrum& s, double hz) {
  const long centre = std::lround(hz / s.bin_hz);
  double power = 0.0;
  for (long b = centre - 2; b <= centre + 2; ++b) {
    if (b >= 0 && b < static_cast<long>(s.amp.size())) power += s.amp[static_cast<size_t>(b)] * s.amp[static_cast<size_t>(b)];
  }
  return std::sqrt(power / 1.5);
}

// The frequency of the strongest component in [lo, hi], between bins by a
// parabola through the logs of the peak and its neighbours.
static double peak_hz(const Spectrum& s, double lo, double hi) {
  size_t best = static_cast<size_t>(lo / s.bin_hz) + 1;
  for (size_t b = best; b < s.amp.size() - 1 && b * s.bin_hz <= hi; ++b) {
    if (s.amp[b] > s.amp[best]) best = b;
  }
  const double l = std::log(s.amp[best - 1] + 1.0e-30), c = std::log(s.amp[best] + 1.0e-30),
               r = std::log(s.amp[best + 1] + 1.0e-30);
  const double shift = 0.5 * (l - r) / (l - 2.0 * c + r);
  return (static_cast<double>(best) + shift) * s.bin_hz;
}

// RMS of everything between lo and hi Hz.
static double band_rms(const Spectrum& s, double lo, double hi) {
  double power = 0.0;
  for (size_t b = static_cast<size_t>(lo / s.bin_hz); b < s.amp.size() && b * s.bin_hz <= hi; ++b) {
    power += s.amp[b] * s.amp[b];
  }
  // A sine of amplitude 1 has power 1/2 and fills 1.5 bins' worth.
  return std::sqrt(power / 3.0);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The largest third difference: what a band-limited sound leaves almost
// nothing in and a discontinuity leaves about its own size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- setting up ---------------------------------------------------------------------------

// The whistle alone on its harmonic: no walk, vibrato, breath or growl, in
// the middle, speaking at once.
static void steady(Overtone& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kWander, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kGrowl, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.1f);
}

// Harmonic k of `hz` against its two neighbours, in dB (the smaller margin).
static double stands_out(const Spectrum& s, double hz, int k) {
  const double level = level_at(s, k * hz);
  return std::min(db(level / level_at(s, (k - 1) * hz)), db(level / level_at(s, (k + 1) * hz)));
}

// The harmonic (lo..hi) of `hz` that is strongest in the spectrum.
static int strongest_harmonic(const Spectrum& s, double hz, int lo, int hi) {
  int best = lo;
  for (int k = lo; k <= hi; ++k) {
    if (level_at(s, k * hz) > level_at(s, best * hz)) best = k;
  }
  return best;
}

// The harmonic the whistle sits on in each stretch of 4096 samples, from
// `from_seconds` on (the drone's low harmonics are left out of the search).
// A stretch in which no harmonic stands 9 dB clear holds a glide from one to
// the next: it reads 0.
static std::vector<int> whistle_path(const std::vector<float>& x, double hz, double from_seconds, int lo = 4,
                                     int hi = 17) {
  std::vector<int> path;
  for (size_t from = at(from_seconds); from + 4096 <= x.size(); from += 4096) {
    const Spectrum s = spectrum(x, from, 12, kRate);
    const int k = strongest_harmonic(s, hz, lo, hi);
    path.push_back(stands_out(s, hz, k) >= 9.0 ? k : 0);
  }
  return path;
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

// Render a phrase of notes at exact sample positions in blocks of `block`
// frames (0: a ragged mix of sizes).
struct Event {
  size_t sample;
  int kind;  // 0 note on, 1 note off, 2 set param
  int id;
  float a, b;
};

static Stereo play(Overtone& d, const std::vector<Event>& events, size_t total, int block) {
  static const int kRagged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0;
  int which = 0;
  while (done < total) {
    while (next < events.size() && events[next].sample <= done) {
      const Event& e = events[next++];
      if (e.kind == 0) d.note_on(e.id, e.a, e.b);
      if (e.kind == 1) d.note_off(e.id);
      if (e.kind == 2) d.set_param(e.id, e.a);
    }
    size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(kRagged[which++ % 8]);
    frames = std::min(frames, total - done);
    if (next < events.size()) frames = std::min(frames, events[next].sample - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// --- the checks ---------------------------------------------------------------------------

// The played note, and the whistle on its harmonic, are in tune at every
// rate and across the keyboard.
static void test_tuning() {
  double worst_note = 0.0, worst_whistle = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hz : {27.5f, 55.0f, 130.81f, 261.63f, 440.0f, 1046.5f, 2093.0f, 4186.0f}) {
      steady(device, rate);
      device.set_param(p::kFocus, 1.0f);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 6.5f, rate);
      const int log2n = rate > 50000.0f ? 19 : 18;
      const Spectrum s = spectrum(out.left, at(0.5, rate), log2n, rate);
      const double note = peak_hz(s, hz * 0.94, hz * 1.06);
      worst_note = std::max(worst_note, std::fabs(cents(note, hz)));
      // The whistle: harmonic 8, or the highest of 4, 2 and 1 that stays
      // under 4 kHz.
      int k = 8;
      while (k > 1 && static_cast<float>(k) * hz > 4000.0f) k /= 2;
      const double whistle = peak_hz(s, k * hz * 0.97, k * hz * 1.03);
      worst_whistle = std::max(worst_whistle, std::fabs(cents(whistle, k * hz)));
      if (k > 1) {
        char label[120];
        std::snprintf(label, sizeof label, "at %.1f Hz and %.0f Hz the whistle stands on harmonic %d", hz, rate, k);
        EXPECT(strongest_harmonic(s, hz, std::min(4, k), 18) == k, label);
      }
    }
  }
  std::printf("tuning: the note within %.2f cents, the whistle within %.2f cents (8 notes, 3 rates)\n", worst_note,
              worst_whistle);
  EXPECT(worst_note < 5.0, "the played note is within 5 cents at 44.1, 48 and 96 kHz");
  EXPECT(worst_whistle < 5.0, "the whistle is within 5 cents of its harmonic at 44.1, 48 and 96 kHz");
}

// Focus: full, harmonic 8 stands 12 dB over 7 and 9; at 0 it is among them.
static void test_focus() {
  double least_sharp = 1.0e9, most_open = -1.0e9, least_default = 1.0e9, least_loud = 1.0e9, least_loud_a4 = 1.0e9;
  for (int voice = 0; voice < 3; ++voice) {
    for (float hz : {55.0f, 110.0f, 220.0f, 440.0f}) {
      for (int pass = 0; pass < 3; ++pass) {
        steady(device);
        device.set_param(p::kVoice, static_cast<float>(voice));
        if (pass < 2) device.set_param(p::kFocus, pass == 0 ? 1.0f : 0.0f);
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 2.0f, kRate);
        const Spectrum s = spectrum(out.left, at(0.5), 16, kRate);
        const double margin = stands_out(s, hz, 8);
        if (pass == 0) least_sharp = std::min(least_sharp, margin);
        if (pass == 2) {
          least_default = std::min(least_default, margin);
          // The whistle is not only clear of its neighbours but loud: at
          // the defaults it is the loudest harmonic a low note has, and on
          // A4, where it sits at 3.5 kHz, about as loud as the note.
          double other = 0.0;
          for (int h = 1; h <= 24; ++h) {
            if (h != 8) other = std::max(other, level_at(s, h * hz));
          }
          double& least = hz < 300.0f ? least_loud : least_loud_a4;
          least = std::min(least, db(level_at(s, 8 * hz) / other));
        }
        // The pipe's own even harmonics are weak (10 dB under the odd
        // ones) and the open mouth fills most of that in: harmonic 8 of
        // the pipe is a few dB under 7 and 9, never over them.
        if (pass == 1) {
          most_open = std::max(most_open, std::fabs(db(level_at(s, 8 * hz) / level_at(s, 7 * hz))));
          most_open = std::max(most_open, std::fabs(db(level_at(s, 8 * hz) / level_at(s, 9 * hz))));
        }
      }
    }
  }
  std::printf("focus: at 1 harmonic 8 stands %.1f dB over 7 and 9 at least, at the default %.1f dB; at 0 it is "
              "within %.1f dB of them (3 voices, 4 notes)\n",
              least_sharp, least_default, most_open);
  EXPECT(least_sharp >= 12.0, "Focus 1: harmonic 8 is 12 dB or more over harmonics 7 and 9, in every voice");
  EXPECT(least_default >= 9.0, "the default Focus already lifts harmonic 8 well clear of 7 and 9");
  std::printf("focus: at the default the whistle is %.1f dB over the loudest other harmonic at least (A1 to A3), "
              "%.1f dB on A4\n",
              least_loud, least_loud_a4);
  EXPECT(least_loud >= 3.0, "at the defaults the whistle is the loudest harmonic of a low note, by 3 dB or more");
  EXPECT(least_loud_a4 >= -3.0, "and on A4 it is within 3 dB of the loudest");
  EXPECT(most_open <= 6.0, "Focus 0: harmonic 8 is within 6 dB of harmonics 7 and 9");

  // The same holds wherever the knob puts the whistle.
  double least = 1.0e9;
  for (int k : {3, 5, 12, 16}) {
    steady(device);
    device.set_param(p::kFocus, 1.0f);
    device.set_param(p::kOvertone, static_cast<float>(k));
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    least = std::min(least, stands_out(spectrum(out.left, at(0.5), 16, kRate), 110.0, k));
  }
  std::printf("focus: harmonics 3, 5, 12 and 16 stand %.1f dB over their neighbours at least\n", least);
  EXPECT(least >= 12.0, "Overtone 3 to 16: the chosen harmonic stands 12 dB over its neighbours at Focus 1");
}

// The note itself is always there, whatever the mouth does.
static void test_note_stays() {
  double weakest = 1.0e9;
  for (int voice = 0; voice < 3; ++voice) {
    for (float focus : {0.0f, 1.0f}) {
      for (float k : {3.0f, 8.0f, 16.0f}) {
        for (float hz : {55.0f, 220.0f, 880.0f}) {
          steady(device);
          device.set_param(p::kVoice, static_cast<float>(voice));
          device.set_param(p::kFocus, focus);
          device.set_param(p::kOvertone, k);
          device.note_on(1, hz, 0.7f);
          Stereo out = render(device, 1.5f, kRate);
          const Spectrum s = spectrum(out.left, at(0.4), 15, kRate);
          double loudest = 0.0;
          for (int h = 1; h <= 20 && h * hz < 20000.0; ++h) loudest = std::max(loudest, level_at(s, h * hz));
          const double note = std::max(level_at(s, hz), level_at(s, 2.0 * hz));
          weakest = std::min(weakest, db(note / loudest));
        }
      }
    }
  }
  // At the defaults (the walk on, every voice, low to high): the leanest
  // voice still carries its key, and from C6 up, where few harmonics fit
  // under 4 kHz, the key is the loudest thing or close to it.
  double weakest_default = 1.0e9, weakest_high = 1.0e9;
  for (int voice = 0; voice < 3; ++voice) {
    for (float hz : {41.2f, 110.0f, 220.0f, 440.0f, 1046.5f, 1318.5f, 1568.0f, 1975.5f, 2093.0f, 4186.0f}) {
      device.init(kRate);
      device.set_param(p::kVoice, static_cast<float>(voice));
      device.set_param(p::kVibrato, 0.0f);
      device.set_param(p::kPace, 2.0f);
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 8.0f, kRate);
      for (size_t from = at(0.5); from + 16384 <= out.left.size(); from += 16384) {
        const Spectrum s = spectrum(out.left, from, 14, kRate);
        double loudest = 0.0;
        for (int h = 1; h <= 20 && h * hz < 20000.0; ++h) loudest = std::max(loudest, level_at(s, h * hz));
        const double octave = 2.0 * hz < 20000.0 ? level_at(s, 2.0 * hz) : 0.0;
        weakest_default = std::min(weakest_default, db(std::max(level_at(s, hz), octave) / loudest));
        if (hz > 1000.0f) weakest_high = std::min(weakest_high, db(level_at(s, hz) / loudest));
      }
    }
  }
  std::printf("the note: its fundamental or octave is never more than %.1f dB under the loudest harmonic (%.1f dB at "
              "the defaults); from C6 up the key itself is within %.1f dB of the loudest\n",
              -weakest, -weakest_default, -weakest_high);
  EXPECT(weakest > -20.0, "the fundamental or its octave is always there, within 20 dB of the loudest harmonic");
  EXPECT(weakest_default > -17.0, "at the defaults it is within 17 dB in every voice: a chord reads as its keys");
  EXPECT(weakest_high > -6.0, "from C6 up the key itself is within 6 dB of the loudest harmonic: it sounds its own pitch");
}

// Overtone moved from 8 to 9: the peak moves to 9·f0, gliding, with no click.
static void test_overtone_glide() {
  const double hz = 220.0;
  auto setup = [&](Overtone& d) {
    steady(d);
    d.set_param(p::kFocus, 1.0f);
    d.note_on(1, static_cast<float>(hz), 0.7f);
  };
  setup(device);
  render(device, 1.0f, kRate);
  device.set_param(p::kOvertone, 9.0f);
  Stereo moved = render(device, 1.0f, kRate);
  setup(other);
  render(other, 1.0f, kRate);
  Stereo stayed = render(other, 1.0f, kRate);

  const Spectrum s = spectrum(moved.left, at(0.5), 14, kRate);
  const double margin = stands_out(s, hz, 9);
  const double whistle = peak_hz(spectrum(moved.left, at(0.3), 15, kRate), 8.5 * hz, 9.5 * hz);
  EXPECT(strongest_harmonic(s, hz, 2, 18) == 9, "after Overtone moves from 8 to 9 the peak is harmonic 9");
  EXPECT(margin >= 12.0, "and harmonic 9 stands 12 dB over 8 and 10");
  EXPECT(std::fabs(cents(whistle, 9.0 * hz)) < 5.0, "at 9 times the note, within 5 cents");

  // It glides: harmonic 9 comes up over some tens of milliseconds, not at once.
  const double arrived = tone_level(moved.left, 9.0 * hz, kRate, at(0.5), at(0.6));
  const double early = tone_level(moved.left, 9.0 * hz, kRate, at(0.004), at(0.014));
  const double later = tone_level(moved.left, 9.0 * hz, kRate, at(0.14), at(0.16));
  EXPECT(early < 0.3 * arrived, "10 ms after the move harmonic 9 has less than a third of its level: it glides");
  EXPECT(later > 0.9 * arrived, "and 150 ms after it has arrived");

  // No click: the move adds no step and no kink to what the held note has
  // anyway, and nothing of it is there in its first samples.
  const double step = std::max(max_step(moved.left, 0, at(0.2)), max_step(moved.right, 0, at(0.2)));
  const double reference = std::max(max_step(stayed.left, 0, at(0.2)), max_step(stayed.right, 0, at(0.2)));
  const double bend = kink(moved.left, 0, at(0.2)) / kink(stayed.left, 0, at(0.2));
  const double sudden = suddenness(setup, [](Overtone& d) { d.set_param(p::kOvertone, 9.0f); });
  const double sudden_far = suddenness(setup, [](Overtone& d) { d.set_param(p::kOvertone, 16.0f); });
  std::printf("overtone 8 to 9: harmonic 9 stands %.1f dB clear at %.2f cents; %.0f%% there after 10 ms, %.0f%% after "
              "150 ms; step %.2f and kink %.2f of the held note's; suddenness %.3f (to 16: %.3f)\n",
              margin, cents(whistle, 9.0 * hz), 100.0 * early / arrived, 100.0 * later / arrived, step / reference,
              bend, sudden, sudden_far);
  EXPECT(step < 1.3 * reference, "moving Overtone adds no step to the held note");
  EXPECT(bend < 1.5, "and no kink");
  EXPECT(sudden < 0.02 && sudden_far < 0.02, "and nothing of the move is there in its first 8 samples");
}

// Wander: at 0 the whistle stays for 20 s; at 1 it visits four harmonics or
// more, on the ladder (harmonics that land on a key), the same ones on a
// second run; a chord moves as one.
static void test_wander() {
  const double hz = 220.0;
  auto walk = [&](Overtone& d, float wander, float pace, float seconds) {
    steady(d);
    d.set_param(p::kFocus, 1.0f);
    d.set_param(p::kWander, wander);
    d.set_param(p::kPace, pace);
    d.note_on(1, static_cast<float>(hz), 0.7f);
    return render(d, seconds, kRate);
  };
  auto visited = [](const std::vector<int>& path) {
    std::vector<int> seen;
    for (int k : path) {
      if (k != 0 && std::find(seen.begin(), seen.end(), k) == seen.end()) seen.push_back(k);
    }
    std::sort(seen.begin(), seen.end());
    return seen;
  };

  Stereo still = walk(device, 0.0f, 2.0f, 20.0f);
  const std::vector<int> stay = whistle_path(still.left, hz, 0.2);
  EXPECT(stay.size() > 200 && std::count(stay.begin(), stay.end(), 8) == static_cast<long>(stay.size()),
         "Wander 0 holds harmonic 8 for 20 s");

  Stereo first = walk(device, 1.0f, 2.0f, 20.0f);
  Stereo second = walk(device, 1.0f, 2.0f, 20.0f);
  const std::vector<int> path = whistle_path(first.left, hz, 0.2);
  const std::vector<int> seen = visited(path);
  int changes = 0, last_seen = 0;
  bool on_ladder = true;
  for (int k : path) {
    if (k == 0) continue;  // on the way
    if (last_seen != 0 && k != last_seen) ++changes;
    last_seen = k;
    on_ladder &= (k == 4 || k == 5 || k == 6 || k == 8 || k == 9 || k == 10 || k == 12);
  }
  std::printf("wander 1 at 2 Hz for 20 s visits");
  for (int k : seen) std::printf(" %d", k);
  std::printf(" (%d moves)\n", changes);
  EXPECT(seen.size() >= 4, "Wander 1 visits at least four harmonics in 20 s");
  EXPECT(on_ladder, "all of them rungs of the ladder within three of harmonic 8 (4 5 6 8 9 10 12)");
  // 40 steps, about one in eight a rest, some walked back inside one stretch.
  EXPECT(changes >= 24 && changes <= 44, "it steps about as often as Pace says");
  EXPECT(whistle_path(second.left, hz, 0.2) == path, "the same harmonics in the same order on a second run");
  EXPECT(first.left == second.left && first.right == second.right, "and the same audio, bit for bit");

  // Half the knob reaches two rungs, a little of it one.
  const std::vector<int> two = visited(whistle_path(walk(device, 0.5f, 4.0f, 20.0f).left, hz, 0.2));
  const std::vector<int> one = visited(whistle_path(walk(device, 0.2f, 4.0f, 20.0f).left, hz, 0.2));
  EXPECT(!two.empty() && two.front() == 5 && two.back() == 10, "Wander 0.5 walks from harmonic 5 to 10");
  EXPECT(!one.empty() && one.front() == 6 && one.back() == 9, "Wander 0.2 walks from harmonic 6 to 9");

  // The walk rests only on harmonics that land on a key: wherever the knob
  // is, never on 7, 11, 13, 14 or 15, which are 31 to 49 cents (15: 12) off
  // one. The knob itself reaches them, with Wander at 0.
  bool on_a_key = true;
  int rests = 0;
  for (float home : {3.0f, 5.0f, 7.0f, 11.0f, 13.0f, 14.0f, 16.0f}) {
    steady(device);
    device.set_param(p::kFocus, 1.0f);
    device.set_param(p::kOvertone, home);
    device.set_param(p::kWander, 1.0f);
    device.set_param(p::kPace, 3.0f);
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 12.0f, kRate);
    // A rest is the same harmonic in two stretches running (170 ms): a
    // glide from 6 to 8 passes 7 and is through it in half that.
    int before = 0;
    for (int k : whistle_path(out.left, 110.0, 0.2, 2, 18)) {
      const bool rest = k != 0 && k == before;
      before = k;
      if (!rest) continue;
      ++rests;
      const double off_key = std::fabs(1200.0 * std::log2(static_cast<double>(k)) -
                                       100.0 * std::round(12.0 * std::log2(static_cast<double>(k))));
      on_a_key &= off_key < 15.0;
    }
  }
  EXPECT(rests > 300 && on_a_key, "the walk rests only on harmonics within 15 cents of a key, wherever the knob is");
  for (float between : {7.0f, 11.0f}) {
    steady(device);
    device.set_param(p::kFocus, 1.0f);
    device.set_param(p::kOvertone, between);
    device.note_on(1, 110.0f, 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    EXPECT(strongest_harmonic(spectrum(out.left, at(0.4), 14, kRate), 110.0, 2, 18) == static_cast<int>(between),
           "with Wander at 0 the knob still reaches the harmonics between the keys");
  }

  // Pace: four times slower, a quarter of the moves.
  const std::vector<int> slow = whistle_path(walk(device, 1.0f, 0.5f, 20.0f).left, hz, 0.2);
  int slow_changes = 0, slow_last = 0;
  for (int k : slow) {
    if (k == 0) continue;
    slow_changes += (slow_last != 0 && k != slow_last) ? 1 : 0;
    slow_last = k;
  }
  EXPECT(slow_changes >= 5 && slow_changes <= 11, "Pace 0.5 Hz makes about ten steps in 20 s");

  // A chord moves as one: two notes whose harmonics keep clear of each
  // other whistle on the same harmonic at every moment.
  steady(device);
  device.set_param(p::kFocus, 1.0f);
  device.set_param(p::kWander, 1.0f);
  device.set_param(p::kPace, 2.0f);
  device.note_on(1, 110.0f, 0.7f);
  render(device, 1.3f, kRate);  // the second note joins late: the walk is the instrument's
  device.note_on(2, 286.0f, 0.7f);
  Stereo chord = render(device, 12.0f, kRate);
  int apart = 0, moves = 0;
  int last = 0;
  for (size_t from = at(0.3); from + 8192 <= chord.left.size(); from += 4096) {
    const Spectrum s = spectrum(chord.left, from, 13, kRate);
    const int low = strongest_harmonic(s, 110.0, 4, 13), high = strongest_harmonic(s, 286.0, 4, 13);
    // A stretch that holds a step has both whistles on the way: skip it.
    if (stands_out(s, 110.0, low) < 9.0 || stands_out(s, 286.0, high) < 9.0) continue;
    apart += low != high ? 1 : 0;
    moves += (last != 0 && low != last) ? 1 : 0;
    last = low;
  }
  std::printf("a chord: its two whistles are on different harmonics in %d stretches (%d moves seen)\n", apart, moves);
  EXPECT(apart == 0 && moves >= 6, "two held notes whistle on the same harmonic at every moment");
}

// Breath adds noise between the harmonics, most of it where the whistle is.
static void test_breath() {
  const double hz = 220.0;
  double ratio[2] = {0.0, 0.0};
  int which = 0;
  for (float rate : {48000.0f, 96000.0f}) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      steady(device, rate);
      device.set_param(p::kFocus, 1.0f);
      device.set_param(p::kBreath, pass == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      out[pass] = render(device, 3.5f, rate);
    }
    const int log2n = rate > 50000.0f ? 18 : 17;
    const Spectrum dry = spectrum(out[0].left, at(0.5, rate), log2n, rate);
    const Spectrum wet = spectrum(out[1].left, at(0.5, rate), log2n, rate);
    // Between harmonics: the middle half of each gap.
    auto between = [&](const Spectrum& s, int from_k, int to_k) {
      double power = 0.0;
      for (int k = from_k; k < to_k; ++k) {
        const double part = band_rms(s, (k + 0.25) * hz, (k + 0.75) * hz);
        power += part * part;
      }
      return std::sqrt(power);
    };
    const double tone = level_at(dry, 8.0 * hz) / std::sqrt(2.0);
    const double air_dry = between(dry, 1, 30), air = between(wet, 1, 30);
    const double near = between(wet, 7, 9), far = between(wet, 14, 16);
    ratio[which++] = db(air / tone);
    if (rate == 48000.0f) {
      std::printf("breath 1: noise between the harmonics %.1f dB under the whistle (%.1f dB without it); the two gaps "
                  "beside the whistle hold %.1f dB more than two an octave up\n",
                  -db(air / tone), -db(air_dry / tone), db(near / far));
      EXPECT(db(air / tone) > -30.0, "Breath 1 puts noise between the harmonics, within 30 dB of the whistle");
      EXPECT(db(air_dry / tone) < -90.0, "with Breath at 0 there is nothing between them");
      EXPECT(db(near / far) > 6.0, "the air whistles: most of the noise sits beside the chosen harmonic");
      EXPECT(std::fabs(db(level_at(wet, 8.0 * hz) / level_at(dry, 8.0 * hz))) < 1.5, "the whistle itself keeps its level");
    }
  }
  std::printf("breath: air against the whistle is %.2f dB at 48 kHz and %.2f dB at 96 kHz\n", ratio[0], ratio[1]);
  EXPECT(std::fabs(ratio[0] - ratio[1]) < 1.0, "the air is as loud against the tone at 96 kHz as at 48 kHz");
}

// Pipe weights the odd harmonics; Growl fills the gaps and the octave below;
// the three voices are three spectra, not three levels.
static void test_voices() {
  const double hz = 110.0;
  Spectrum voice_spectrum[3];
  double odd_over_even[3] = {0.0, 0.0, 0.0};
  for (int voice = 0; voice < 3; ++voice) {
    steady(device);
    device.set_param(p::kVoice, static_cast<float>(voice));
    device.set_param(p::kOvertone, 16.0f);  // the whistle out of the way of the low harmonics
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, 2.0f, kRate);
    voice_spectrum[voice] = spectrum(out.left, at(0.5), 16, kRate);
    const Spectrum& s = voice_spectrum[voice];
    // Each even harmonic against the mean of the odd ones either side.
    double sum = 0.0;
    for (int k = 2; k <= 10; k += 2) {
      sum += db(std::sqrt(level_at(s, (k - 1) * hz) * level_at(s, (k + 1) * hz)) / level_at(s, k * hz));
    }
    odd_over_even[voice] = sum / 5.0;
  }
  std::printf("voices: odd harmonics over even ones (2 to 10): throat %.1f dB, pipe %.1f dB, reed %.1f dB\n",
              odd_over_even[0], odd_over_even[1], odd_over_even[2]);
  EXPECT(odd_over_even[1] > 8.0, "Pipe: the odd harmonics stand 8 dB over the even ones between them");
  EXPECT(std::fabs(odd_over_even[0]) < 2.0 && std::fabs(odd_over_even[2]) < 2.0, "Throat and Reed weigh them alike");

  // The shapes: harmonics 1 to 14 in dB, each voice with its own mean taken
  // off, so a difference in level alone would read 0.
  double shape[3][14];
  for (int voice = 0; voice < 3; ++voice) {
    double mean = 0.0;
    for (int k = 1; k <= 14; ++k) mean += (shape[voice][k - 1] = db(level_at(voice_spectrum[voice], k * hz))) / 14.0;
    for (int k = 0; k < 14; ++k) shape[voice][k] -= mean;
  }
  double nearest = 1.0e9;
  for (int a = 0; a < 3; ++a) {
    for (int b = a + 1; b < 3; ++b) {
      double sum = 0.0;
      for (int k = 0; k < 14; ++k) sum += (shape[a][k] - shape[b][k]) * (shape[a][k] - shape[b][k]);
      nearest = std::min(nearest, std::sqrt(sum / 14.0));
    }
  }
  // Reed is bright and thin, Pipe dark: where the energy sits.
  const double reed_top = db(band_rms(voice_spectrum[2], 2000.0, 8000.0) / band_rms(voice_spectrum[2], 50.0, 500.0));
  const double throat_top = db(band_rms(voice_spectrum[0], 2000.0, 8000.0) / band_rms(voice_spectrum[0], 50.0, 500.0));
  const double pipe_top = db(band_rms(voice_spectrum[1], 2000.0, 8000.0) / band_rms(voice_spectrum[1], 50.0, 500.0));
  std::printf("voices: the nearest two differ by %.1f dB RMS in shape; 2-8 kHz against 50-500 Hz: pipe %.1f, throat "
              "%.1f, reed %.1f dB\n",
              nearest, pipe_top, throat_top, reed_top);
  EXPECT(nearest > 4.0, "the three voices differ in the shape of their spectrum by more than 4 dB RMS, level aside");
  EXPECT(reed_top > throat_top + 10.0 && throat_top > pipe_top + 5.0, "Reed is the brightest and Pipe the darkest");

  // Growl.
  for (int voice = 0; voice < 3; ++voice) {
    Spectrum s[2];
    for (int pass = 0; pass < 2; ++pass) {
      steady(device);
      device.set_param(p::kVoice, static_cast<float>(voice));
      device.set_param(p::kGrowl, pass == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      Stereo out = render(device, 2.0f, kRate);
      s[pass] = spectrum(out.left, at(0.5), 16, kRate);
    }
    double gaps = 0.0, gaps_plain = 0.0, harmonics = 0.0;
    for (int k = 0; k < 6; ++k) {
      gaps += level_at(s[1], (k + 0.5) * hz) * level_at(s[1], (k + 0.5) * hz);
      gaps_plain += level_at(s[0], (k + 0.5) * hz) * level_at(s[0], (k + 0.5) * hz);
      harmonics += level_at(s[1], (k + 1.0) * hz) * level_at(s[1], (k + 1.0) * hz);
    }
    const double under = db(level_at(s[1], 0.5 * hz) / level_at(s[1], hz));
    std::printf("growl 1, voice %d: the gaps under harmonic 6 hold %.1f dB against the harmonics (%.1f dB at Growl 0); "
                "the octave below is %.1f dB against the note\n",
                voice, 10.0 * std::log10(gaps / harmonics), 10.0 * std::log10(gaps_plain / harmonics + 1.0e-30), under);
    EXPECT(10.0 * std::log10(gaps / harmonics) > -12.0, "Growl 1 fills the gaps between the low harmonics");
    EXPECT(10.0 * std::log10(gaps_plain / harmonics + 1.0e-30) < -80.0, "which are empty at Growl 0");
    EXPECT(under > -14.0, "and sounds the octave under the note");
    EXPECT(stands_out(s[1], hz, 8) > 9.0, "while the whistle still stands clear");
  }
}

// High notes: the mouth stays under 4 kHz, and nothing folds back.
static void test_high_notes() {
  double worst_fold = -1.0e9, highest = 0.0;
  for (float rate : {44100.0f, 48000.0f}) {
    for (float hz : {523.25f, 1046.5f, 1567.98f, 2093.0f, 3135.96f, 4186.0f}) {
      for (int voice = 0; voice < 3; ++voice) {
        steady(device, rate);
        device.set_param(p::kVoice, static_cast<float>(voice));
        device.set_param(p::kFocus, 1.0f);
        device.set_param(p::kOvertone, 16.0f);
        device.note_on(1, hz, 0.7f);
        Stereo out = render(device, 2.0f, rate);
        const Spectrum s = spectrum(out.left, at(0.4, rate), 16, rate);
        // Everything that is not on a harmonic counts as folded. A harmonic
        // is 24 bins either way (the skirt of the window), or 7 cents where
        // that is more (each voice drifts by a cent or so).
        double on = 0.0, off = 0.0;
        for (size_t b = 24; b < s.amp.size(); ++b) {
          const double multiple = b * s.bin_hz / hz;
          const double away = std::fabs(multiple - std::round(multiple)) * hz / s.bin_hz;
          (away <= std::max(24.0, 0.004 * static_cast<double>(b)) ? on : off) += s.amp[b] * s.amp[b];
        }
        worst_fold = std::max(worst_fold, 10.0 * std::log10(off / on + 1.0e-30));
        if (voice == 0) {
          // Harmonic 16 does not fit: it comes down by octaves to the
          // highest of 8, 4, 2 and 1 that stays under 4 kHz. (Looked for
          // above the key itself, which on a high note is the loudest thing.)
          int fits = 16;
          while (fits > 1 && static_cast<float>(fits) * hz > 4000.0f) fits /= 2;
          const int k = strongest_harmonic(s, hz, fits > 1 ? 2 : 1, 8);
          highest = std::max(highest, static_cast<double>(k) * hz);
          char label[120];
          std::snprintf(label, sizeof label, "at %.0f Hz harmonic 16 comes down by octaves to harmonic %d, under 4 kHz", hz, fits);
          EXPECT(k == fits, label);
        }
      }
    }
  }
  std::printf("high notes: the whistle is never above %.0f Hz; what is not on a harmonic is %.1f dB down at worst "
              "(C5 to C8, 3 voices, 44.1 and 48 kHz)\n",
              highest, -worst_fold);
  EXPECT(highest < 4200.0, "the whistle stays under about 4 kHz");
  EXPECT(worst_fold < -70.0, "nothing folds back: off the harmonics the whole band is 70 dB down");

  // A rung the note cannot reach comes down by octaves: at G5 (784 Hz, five
  // harmonics fit) the walk still finds more than one harmonic.
  steady(device);
  device.set_param(p::kFocus, 1.0f);
  device.set_param(p::kWander, 1.0f);
  device.set_param(p::kPace, 4.0f);
  device.note_on(1, 783.99f, 0.7f);
  Stereo out = render(device, 12.0f, kRate);
  std::vector<int> seen;
  for (int k : whistle_path(out.left, 783.99, 0.2, 2, 8)) {
    if (std::find(seen.begin(), seen.end(), k) == seen.end()) seen.push_back(k);
  }
  int top = 0;
  for (int k : seen) top = std::max(top, k);
  EXPECT(seen.size() >= 3 && top == 5, "on a high note the walk folds down by octaves and stays under 4 kHz");

  // The knob too: a key too high for it whistles the same pitch an octave
  // or two lower, not the harmonic just under 4 kHz, which would be one
  // between the keys that nobody asked for (the 15th on C4, the 11th on F4).
  struct Case {
    float knob, hz;
    int wanted, capped;
  };
  for (const Case& c : {Case{16.0f, 261.63f, 8, 15}, Case{12.0f, 349.23f, 6, 11}, Case{10.0f, 493.88f, 5, 8},
                        Case{9.0f, 523.25f, 6, 7}}) {
    steady(device);
    device.set_param(p::kFocus, 1.0f);
    device.set_param(p::kOvertone, c.knob);
    device.note_on(1, c.hz, 0.7f);
    Stereo held = render(device, 1.5f, kRate);
    const int k = strongest_harmonic(spectrum(held.left, at(0.4), 15, kRate), c.hz, 2, 17);
    char label[140];
    std::snprintf(label, sizeof label, "Overtone %.0f at %.0f Hz whistles on harmonic %d (not %d, the highest that fits)",
                  c.knob, c.hz, c.wanted, c.capped);
    EXPECT(k == c.wanted, label);
  }
}

// Loudness: velocity, one note's level across the keyboard and the voices,
// ten held keys, the soft clip, and a key that is heard at once.
static void test_levels() {
  double lowest = 1.0e9, highest = -1.0e9;
  for (int voice = 0; voice < 3; ++voice) {
    for (float hz : {27.5f, 55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f, 4186.0f}) {
      device.init(kRate);
      device.set_param(p::kVoice, static_cast<float>(voice));
      device.note_on(1, hz, 0.7f);
      Stereo out = render(device, 4.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
  }
  std::printf("level: one note at gain 0.7 peaks between %.1f and %.1f dBFS (A0 to C8, 3 voices, default volume)\n",
              lowest, highest);
  EXPECT(lowest > -24.0 && highest < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS at the default volume");

  steady(device);
  device.note_on(1, 220.0f, 1.0f);
  Stereo loud = render(device, 0.6f, kRate);
  steady(device);
  device.note_on(1, 220.0f, 0.1f);
  Stereo soft = render(device, 0.6f, kRate);
  const double velocity = db(rms(soft.left, at(0.2)) / rms(loud.left, at(0.2)));
  std::printf("velocity: gain 0.1 is %.1f dB under gain 1\n", -velocity);
  EXPECT(velocity < -6.0 && velocity > -14.0, "a soft key is 6 to 14 dB quieter than a hard one");

  device.init(kRate);
  for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  Stereo ten = render(device, 6.0f, kRate);
  const double ten_peak = std::max(peak(ten.left), peak(ten.right));
  std::printf("ten held keys peak at %.3f\n", ten_peak);
  EXPECT(ten_peak < 0.5, "ten held keys stay under the clip knee (0.5)");

  // The soft clip is there: turned all the way up under a pile of loud low
  // notes the output passes the knee and never passes full scale.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kGrowl, 1.0f);
  device.set_param(p::kBreath, 1.0f);
  for (int n = 0; n < 6; ++n) device.note_on(n, 55.0f * static_cast<float>(n + 1), 1.0f);
  Stereo hot = render(device, 2.0f, kRate);
  const double hot_peak = std::max(peak(hot.left), peak(hot.right));
  std::printf("six loud notes at +6 dB peak at %.3f\n", hot_peak);
  EXPECT(hot_peak > 0.6 && hot_peak <= 1.0, "the output ends in the soft clip: over the knee, never over full scale");

  // A key is heard at once, at the default attack.
  double quietest = 1.0e9;
  for (float hz : {27.5f, 110.0f, 440.0f, 4186.0f}) {
    device.init(kRate);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 0.03f, kRate);
    quietest = std::min(quietest, db(std::max(peak(out.left), peak(out.right))));
  }
  std::printf("onset: within 30 ms of note on the output reaches %.1f dBFS at least\n", quietest);
  EXPECT(quietest > -40.0, "something sounds within 30 ms of a key press");
  // And a 100 ms note at the slowest attack still makes sound.
  device.init(kRate);
  device.set_param(p::kAttack, 6.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo brief = render(device, 0.1f, kRate);
  EXPECT(peak(brief.left) > 1.0e-4, "a 100 ms note at the slowest attack still sounds");
}

// Attack and release are the times they say; vibrato bends the note and the
// whistle with it; width spreads the whistle and folds to the middle at 0.
static void test_shape() {
  steady(device);
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

  // Vibrato: the whistle's frequency swings, by the same interval as the note's.
  steady(device);
  device.set_param(p::kFocus, 1.0f);
  device.set_param(p::kVibrato, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo wavering = render(device, 3.0f, kRate);
  double lo = 1.0e9, hi = 0.0, early_lo = 1.0e9, early_hi = 0.0;
  for (size_t from = at(1.0); from + 2048 <= wavering.left.size(); from += 512) {
    const double hz = peak_hz(spectrum(wavering.left, from, 11, kRate), 1650.0, 1870.0);
    lo = std::min(lo, hz);
    hi = std::max(hi, hz);
  }
  for (size_t from = at(0.02); from + 2048 <= at(0.2); from += 512) {
    const double hz = peak_hz(spectrum(wavering.left, from, 11, kRate), 1650.0, 1870.0);
    early_lo = std::min(early_lo, hz);
    early_hi = std::max(early_hi, hz);
  }
  const double swing = cents(hi, lo), early_swing = cents(early_hi, early_lo);
  std::printf("vibrato 1: the whistle swings %.0f cents peak to peak (%.1f in the first 0.2 s)\n", swing, early_swing);
  EXPECT(swing > 50.0 && swing < 90.0, "Vibrato 1 bends the whistle about 80 cents peak to peak, with the note");
  EXPECT(early_swing < 8.0, "it waits until the note has settled");

  // Width.
  steady(device);
  device.set_param(p::kWidth, 0.0f);
  device.note_on(1, 220.0f, 0.7f);
  device.note_on(2, 330.0f, 0.7f);
  Stereo mono = render(device, 2.0f, kRate);
  EXPECT(mono.left == mono.right, "Width 0 is mono");
  steady(device);
  device.set_param(p::kFocus, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo wide = render(device, 24.0f, kRate);
  // The whistle drifts: its balance between left and right moves over time,
  // while the drone's fundamental stays in the middle.
  double left_most = 1.0e9, right_most = -1.0e9, drone_off = 0.0;
  for (size_t from = at(0.5); from + 16384 <= wide.left.size(); from += 16384) {
    const Spectrum l = spectrum(wide.left, from, 14, kRate), r = spectrum(wide.right, from, 14, kRate);
    const double balance = db(level_at(r, 1760.0) / level_at(l, 1760.0));
    left_most = std::min(left_most, balance);
    right_most = std::max(right_most, balance);
    drone_off = std::max(drone_off, std::fabs(db(level_at(r, 220.0) / level_at(l, 220.0))));
  }
  std::printf("width 1: one note's whistle drifts from %.1f dB (left) to %.1f dB (right) in 24 s; its drone stays "
              "within %.2f dB of the middle\n",
              left_most, right_most, drone_off);
  EXPECT(left_most < -3.0 && right_most > 3.0, "Width 1: the whistle drifts to both sides of the drone");
  EXPECT(drone_off < 0.5, "the drone of a single note stays in the middle");
  // A chord's drones stand apart.
  steady(device);
  device.set_param(p::kFocus, 0.0f);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, 110.0f, 0.7f);
  device.note_on(2, 146.83f, 0.7f);
  device.note_on(3, 196.0f, 0.7f);
  Stereo chord = render(device, 2.0f, kRate);
  const Spectrum cl = spectrum(chord.left, at(0.5), 15, kRate), cr = spectrum(chord.right, at(0.5), 15, kRate);
  const double second = db(level_at(cr, 146.83) / level_at(cl, 146.83));
  const double third = db(level_at(cr, 196.0) / level_at(cl, 196.0));
  EXPECT(second < -3.0 && third > 3.0, "Width 1: the second and third notes of a chord stand left and right");
  double side = 0.0, mid = 0.0;
  for (size_t i = at(0.5); i < chord.size(); ++i) {
    side += 0.25 * (chord.left[i] - chord.right[i]) * (chord.left[i] - chord.right[i]);
    mid += 0.25 * (chord.left[i] + chord.right[i]) * (chord.left[i] + chord.right[i]);
  }
  EXPECT(side < 0.6 * mid, "and the side stays under the mid");
}

// Clicks: every knob that changes what sounds, thrown across its range under
// a held note; a stolen voice; a key struck again; the shortest release.
static void test_clicks() {
  auto held = [](Overtone& d) {
    steady(d);
    d.set_param(p::kWidth, 0.6f);
    d.set_param(p::kGrowl, 0.3f);
    d.set_param(p::kBreath, 0.3f);
    d.note_on(1, 110.0f, 0.8f);
    d.note_on(2, 164.81f, 0.8f);
  };
  struct Throw {
    const char* name;
    int id;
    float to;
  };
  const Throw throws[] = {{"Volume up", p::kVolume, 6.0f},   {"Volume down", p::kVolume, -48.0f},
                          {"Focus up", p::kFocus, 1.0f},     {"Focus down", p::kFocus, 0.0f},
                          {"Voice", p::kVoice, 2.0f},        {"Breath", p::kBreath, 1.0f},
                          {"Growl", p::kGrowl, 1.0f},        {"Width", p::kWidth, 0.0f},
                          {"Wander", p::kWander, 1.0f},      {"Overtone", p::kOvertone, 3.0f}};
  double worst = 0.0;
  const char* worst_name = "";
  for (const Throw& t : throws) {
    const double sudden = suddenness(held, [&](Overtone& d) { d.set_param(t.id, t.to); });
    if (sudden > worst) {
      worst = sudden;
      worst_name = t.name;
    }
  }
  std::printf("clicks: a knob thrown across its range is %.3f there after 8 samples at worst (%s)\n", worst, worst_name);
  EXPECT(worst < 0.05, "no knob thrown across its range arrives at once");

  auto full = [](Overtone& d) {
    steady(d);
    d.set_param(p::kRelease, 1.0f);
    for (int n = 0; n < 6; ++n) d.note_on(n, 110.0f * static_cast<float>(n + 2) * 0.5f, 0.8f);
  };
  const double steal = suddenness(full, [](Overtone& d) { d.note_on(9, 987.77f, 0.8f); });
  const double again = suddenness(full, [](Overtone& d) { d.note_on(2, 220.0f, 0.8f); });
  auto quick = [](Overtone& d) {
    steady(d);
    d.set_param(p::kRelease, 0.05f);
    d.note_on(1, 110.0f, 0.8f);
  };
  const double off = suddenness(quick, [](Overtone& d) { d.note_off(1); });
  std::printf("clicks: a steal %.3f, a key struck again %.3f, the shortest release %.3f\n", steal, again, off);
  EXPECT(steal < 0.1, "a stolen voice fades: the steal starts gradually");
  EXPECT(again < 0.1, "a key struck again starts gradually");
  EXPECT(off < 0.05, "the shortest release is a fade, not a cut");
}

// Voices: a full pool, chords arriving in one block, keys struck twice.
static void test_stealing() {
  // Six held, then two more at once: both sound, and two of the old ones go.
  steady(device);
  for (int n = 0; n < 6; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(10, 1479.98f, 0.8f);
  device.note_on(11, 1975.53f, 0.8f);
  Stereo both = render(device, 1.0f, kRate);
  const Spectrum s = spectrum(both.left, at(0.3), 14, kRate);
  const double first = db(level_at(s, 1479.98)), second = db(level_at(s, 1975.53));
  std::printf("stealing: two notes into a full pool sound at %.1f and %.1f dBFS\n", first, second);
  EXPECT(first > -50.0 && second > -50.0, "six held notes, then two in one block: both sound");

  // Five held and one voice free, then two at once: the first takes the
  // free voice and is not taken again by the second while it is still rising.
  steady(device);
  device.set_param(p::kAttack, 0.3f);
  for (int n = 0; n < 5; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(10, 1479.98f, 0.8f);
  device.note_on(11, 1975.53f, 0.8f);
  Stereo pair = render(device, 1.5f, kRate);
  const Spectrum pair_spectrum = spectrum(pair.left, at(0.8), 14, kRate);
  const double third = db(level_at(pair_spectrum, 1479.98)), fourth = db(level_at(pair_spectrum, 1975.53));
  std::printf("stealing: two notes into five held sound at %.1f and %.1f dBFS\n", third, fourth);
  EXPECT(third > -50.0 && fourth > -50.0, "five held notes, then two in one block: both sound");

  // A note that starts in a stolen voice has its own attack: it does not
  // begin at the level the old note had.
  steady(device);
  device.set_param(p::kAttack, 1.0f);
  for (int n = 0; n < 6; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(12, 3000.0f, 0.8f);
  Stereo rising = render(device, 2.5f, kRate);
  const double soon = tone_level(rising.left, 3000.0, kRate, at(0.02), at(0.07));
  const double arrived = tone_level(rising.left, 3000.0, kRate, at(2.0), at(2.4));
  std::printf("stealing: a note in a stolen voice is at %.2f of its level after 45 ms of a 1 s attack\n", soon / arrived);
  EXPECT(soon < 0.3 * arrived && arrived > 1.0e-3, "a note started in a stolen voice swells in with its own attack");

  // A key struck twice inside the steal fade takes one voice, and leaves none stuck.
  steady(device);
  for (int n = 0; n < 6; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);  // levels tie
  device.note_on(20, 2093.0f, 0.8f);
  device.note_on(20, 2093.0f, 0.8f);
  Stereo twice = render(device, 1.0f, kRate);
  const Spectrum t = spectrum(twice.left, at(0.3), 14, kRate);
  int still = 0;
  for (int n = 0; n < 6; ++n) still += level_at(t, 110.0 * std::pow(2.0, n * 2 / 12.0)) > 1.0e-3 ? 1 : 0;
  EXPECT(still == 5, "a key struck twice during a steal takes one voice only");
  for (int n = 0; n < 6; ++n) device.note_off(n);
  device.note_off(20);
  render(device, 1.5f, kRate);
  Stereo after = render(device, 0.5f, kRate);
  EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and every voice ends when the keys are let go");

  // A note let go while it waits for a stolen voice never sounds.
  steady(device);
  for (int n = 0; n < 6; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  Stereo before_it = render(device, 0.5f, kRate);
  device.note_on(30, 3000.0f, 0.8f);
  device.note_off(30);
  Stereo cancelled = render(device, 0.5f, kRate);
  // The chord's own high harmonics are all there is at 3 kHz, and one voice less of them.
  EXPECT(level_at(spectrum(cancelled.left, at(0.1), 14, kRate), 3000.0) <
             1.5 * level_at(spectrum(before_it.left, at(0.1), 14, kRate), 3000.0),
         "a note let go before its voice was free never sounds");
  device.note_on(31, 3000.0f, 0.8f);
  Stereo sounding = render(device, 0.5f, kRate);
  EXPECT(level_at(spectrum(sounding.left, at(0.1), 14, kRate), 3000.0) >
             20.0 * level_at(spectrum(before_it.left, at(0.1), 14, kRate), 3000.0),
         "(the same note, held, is heard there)");

  // A key struck again with every voice busy keeps its release.
  steady(device);
  device.set_param(p::kRelease, 1.0f);
  device.note_on(0, 55.0f, 0.8f);
  for (int n = 1; n < 6; ++n) device.note_on(n, 880.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(0, 55.0f, 0.8f);
  Stereo restruck = render(device, 1.0f, kRate);
  const double before = tone_level(restruck.left, 55.0, kRate, at(0.5), at(1.0));
  device.note_off(0);
  Stereo tail = render(device, 0.5f, kRate);
  const double later = tone_level(tail.left, 55.0, kRate, at(0.2), at(0.3));
  std::printf("stealing: a restruck key is at %.2f of its level 250 ms into a 1 s release\n", later / before);
  EXPECT(later > 0.1 * before, "a key struck again with every voice busy keeps its release");

  // A key struck again while it sounds, then let go once: the first strike
  // is not left held.
  steady(device);
  device.set_param(p::kRelease, 0.1f);
  device.note_on(0, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(0, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.note_off(0);
  render(device, 1.0f, kRate);
  Stereo left_over = render(device, 0.2f, kRate);
  EXPECT(peak(left_over.left) == 0.0 && peak(left_over.right) == 0.0,
         "a key struck twice and let go once leaves nothing sounding");
}

// The same audio whatever the host's block size, through a silence and a
// wake, with knobs moved in the silence; and the same again after init.
static void test_blocks_and_sleep() {
  double worst = 0.0;
  // The silence is stepped across the moment the instrument falls asleep
  // (a 0.1 s release, then the 50 ms hold).
  for (double gap : {0.10, 0.13, 0.15, 0.17, 0.19, 0.21, 0.23, 0.26, 0.30, 1.3}) {
    const size_t off = at(0.6), on = off + at(gap);
    std::vector<Event> events = {
        {0, 2, p::kRelease, 0.1f, 0.0f},      {0, 0, 1, 110.0f, 0.8f},
        {at(0.21), 0, 2, 164.81f, 0.7f},      {off, 1, 1, 0.0f, 0.0f},
        {off, 1, 2, 0.0f, 0.0f},              {on - 331, 2, p::kVolume, -3.0f, 0.0f},
        {on - 331, 2, p::kVoice, 1.0f, 0.0f}, {on - 331, 2, p::kFocus, 0.3f, 0.0f},
        {on - 331, 2, p::kOvertone, 5.0f, 0.0f}, {on, 0, 3, 146.83f, 0.8f},
        {on + 77, 0, 4, 220.0f, 0.6f},
    };
    const size_t total = on + at(1.5);
    device.init(kRate);
    Stereo reference = play(device, events, total, 128);
    for (int block : {1, 2048, 0}) {
      device.init(kRate);
      Stereo out = play(device, events, total, block);
      worst = std::max(worst, worst_difference(out, reference));
    }
  }
  std::printf("block size: 1, 2048 and ragged blocks differ from 128 by %g at most (10 silences, knobs moved in them)\n",
              worst);
  EXPECT(worst < 1.0e-6, "the output does not depend on the block size, through a silence and a wake");

  // A second init gives the same audio, bit for bit, walk and breath included.
  Stereo run[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kPace, 3.0f);
    device.set_param(p::kWander, 1.0f);
    device.set_param(p::kBreath, 0.6f);
    device.set_param(p::kGrowl, 0.5f);
    device.set_param(p::kVibrato, 0.5f);
    device.note_on(1, 110.0f, 0.8f);
    device.note_on(2, 164.81f, 0.8f);
    run[pass] = render(device, 6.0f, kRate);
    device.note_off(1);
    render(device, 0.7f, kRate);
  }
  EXPECT(run[0].left == run[1].left && run[0].right == run[1].right, "a second init gives bit-identical audio");

  // Knobs moved while it sleeps (put to sleep off the beat of its control
  // clock) are simply there for the next note.
  device.init(kRate);
  device.set_param(p::kRelease, 0.1f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.process(13);
  device.note_off(1);
  render(device, 1.0f, kRate);
  device.set_param(p::kVoice, 2.0f);
  device.set_param(p::kOvertone, 12.0f);
  device.set_param(p::kFocus, 1.0f);
  device.set_param(p::kBreath, 0.5f);
  device.set_param(p::kGrowl, 0.6f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kVolume, 0.0f);
  render(device, 0.2f, kRate);
  device.note_on(2, 146.83f, 0.8f);
  Stereo woken = render(device, 0.5f, kRate);
  // The same note on an instrument that was set that way from the start,
  // brought to the same place in its random sources by the same first note.
  other.init(kRate);
  other.set_param(p::kRelease, 0.1f);
  other.set_param(p::kVoice, 2.0f);
  other.set_param(p::kOvertone, 12.0f);
  other.set_param(p::kFocus, 1.0f);
  other.set_param(p::kBreath, 0.5f);
  other.set_param(p::kGrowl, 0.6f);
  other.set_param(p::kWidth, 1.0f);
  other.set_param(p::kVolume, 0.0f);
  other.note_on(1, 220.0f, 0.8f);
  render(other, 0.3f, kRate);
  other.process(13);
  other.note_off(1);
  render(other, 1.2f, kRate);
  other.note_on(2, 146.83f, 0.8f);
  Stereo fresh = render(other, 0.5f, kRate);
  const double apart = worst_difference(woken, fresh);
  std::printf("sleep: a note after knobs were moved in silence differs from one set that way from the start by %g\n", apart);
  EXPECT(apart < 1.0e-6, "knobs moved while asleep have arrived when the next note starts");
}

int main() {
  Conformance spec;
  spec.name = "overtone";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_focus();
  test_note_stays();
  test_overtone_glide();
  test_wander();
  test_breath();
  test_voices();
  test_high_notes();
  test_levels();
  test_shape();
  test_clicks();
  test_stealing();
  test_blocks_and_sleep();

  // Cost with eight keys held (six sound), at the defaults and at the most
  // the instrument does per voice.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("overtone (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kVoice, 1.0f);
  device.set_param(p::kGrowl, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("overtone (8 keys, Pipe with Growl)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("overtone");
}
