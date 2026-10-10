// Native harness for Flock (cpp/devices/flock). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest measures what makes it a flock: birds that fly in
// from the side From says and land on the note, roam around it as far as
// Stray says, call, sit an octave off, and scatter when the key is let go.
// Nobody can listen where this is built, so every figure is printed.

#include <cstdarg>
#include <functional>

#include "../devices/flock/flock.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Flock;
namespace p = livemix::flock;

static Flock device;
static Flock other;

static const float kRate = 48000.0f;
// A note whose period is a whole number of samples at 48 kHz (100), for the
// measures that average over periods.
static const float kNote = 480.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static void figure(const char* format, ...) {
  va_list args;
  va_start(args, format);
  std::printf("  ");
  std::vprintf(format, args);
  std::printf("\n");
  va_end(args);
}

// One steady whistle per key, in the centre, there at once and gone at once.
static void plain(Flock& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBirds, 1.0f);
  d.set_param(p::kGather, 0.02f);
  d.set_param(p::kStray, 0.0f);
  d.set_param(p::kTone, 0.0f);
  d.set_param(p::kChirp, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kLeave, 0.05f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

// Level of both channels together, in dB.
static double level_db(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  const double l = rms(s.left, from, to), r = rms(s.right, from, to);
  return 10.0 * std::log10(std::max(l * l + r * r, 1.0e-24));
}

static double peak_of(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// How alike left and right are from moment to moment: the mean correlation
// of stretches of 50 ms. A voice that only moves from side to side scores 1.
static double alike_lr(const Stereo& s, size_t from) {
  double sum = 0.0;
  int count = 0;
  for (size_t start = from; start + at(0.05) <= s.size(); start += at(0.05)) {
    sum += correlation(s.left, s.right, start, start + at(0.05));
    ++count;
  }
  return count > 0 ? sum / count : 0.0;
}

// The pitch of one voice from its rising zero crossings over [from, to):
// whole cycles over the time they took. Exact for anything periodic.
static double pitch(const std::vector<float>& x, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  double first = -1.0, last = -1.0;
  int crossings = 0;
  for (size_t i = from + 1; i < to; ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double when = static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (first < 0.0) first = when;
      last = when;
      ++crossings;
    }
  }
  return crossings > 1 ? (crossings - 1) * rate / (last - first) : 0.0;
}

// Where the energy near `hz` sits and how wide it is, in cents: the signal
// is brought down to 0 Hz, two running means of one period each take away
// everything at the harmonics of `hz`, and the first and second moments of
// what is left are those of its spectrum. `hz` must have a whole period.
struct Spread {
  double offset;  // centre against `hz`
  double width;   // RMS distance from that centre
};
static Spread spread(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  const size_t period = static_cast<size_t>(std::llround(rate / hz));
  const size_t n = to - from;
  std::vector<double> re(n), im(n);
  for (size_t i = 0; i < n; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re[i] = x[from + i] * std::cos(phase);
    im[i] = -x[from + i] * std::sin(phase);
  }
  for (int pass = 0; pass < 2; ++pass) {
    double sum_re = 0.0, sum_im = 0.0;
    std::vector<double> out_re(n, 0.0), out_im(n, 0.0);
    for (size_t i = 0; i < n; ++i) {
      sum_re += re[i];
      sum_im += im[i];
      if (i >= period) {
        sum_re -= re[i - period];
        sum_im -= im[i - period];
      }
      out_re[i] = sum_re / static_cast<double>(period);
      out_im[i] = sum_im / static_cast<double>(period);
    }
    re.swap(out_re);
    im.swap(out_im);
  }
  double power = 0.0, turning = 0.0, moving = 0.0;
  for (size_t i = 2 * period; i + 1 < n; ++i) {
    power += re[i] * re[i] + im[i] * im[i];
    turning += re[i] * im[i + 1] - im[i] * re[i + 1];
    const double dr = re[i + 1] - re[i], di = im[i + 1] - im[i];
    moving += dr * dr + di * di;
  }
  if (power <= 0.0) return {0.0, 0.0};
  const double mean_hz = turning / power * rate / (2.0 * kPi);
  const double rms_hz = std::sqrt(moving / power) * rate / (2.0 * kPi);
  const double wide_hz = std::sqrt(std::max(0.0, rms_hz * rms_hz - mean_hz * mean_hz));
  return {cents(hz + mean_hz, hz), cents(hz + wide_hz, hz)};
}

// The loudest single frequency between lo and hi, on a 1 % grid.
static double strongest(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  double best = 0.0;
  for (double hz = lo; hz <= hi; hz *= 1.01) best = std::max(best, tone_level(x, hz, rate, from, to));
  return best;
}

// The level over time: RMS of stretches of `window` samples.
static std::vector<double> envelope(const std::vector<float>& x, size_t from, size_t to, size_t window) {
  std::vector<double> out;
  for (size_t start = from; start + window <= to && start + window <= x.size(); start += window) {
    out.push_back(rms(x, start, start + window));
  }
  return out;
}

// How an event arrives: the same passage is rendered twice from init(),
// once with the event, and the difference is the event alone, measured
// against its largest value over the next 40 ms. `early` is how much of it
// is there after 2 ms and `quick` after 0.5 ms (a smoothed knob or a faded
// voice has gone a small part of the way, a jump is all there). `kink` is
// its largest third difference: a tone and a ramp leave next to nothing in
// it, a level set in one go leaves about its own size. The worst of eight
// moments a little apart, so a jump cannot hide in a zero crossing.
struct Arrival {
  double early = 0.0;
  double quick = 0.0;
  double kink = 0.0;
  double size = 0.0;
};
static Arrival arrival(const std::function<void(Flock&)>& setup, const std::function<void(Flock&)>& event) {
  Arrival worst;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 0.6f + 0.0013f * static_cast<float>(trial), kRate);
      if (pass == 0) event(device);
      out[pass] = render(device, 0.04f, kRate);
    }
    std::vector<double> difference(out[0].size());
    double early = 0.0, quick = 0.0, whole = 0.0, kink = 0.0;
    for (int channel = 0; channel < 2; ++channel) {
      const std::vector<float>& with = channel == 0 ? out[0].left : out[0].right;
      const std::vector<float>& without = channel == 0 ? out[1].left : out[1].right;
      for (size_t i = 0; i < difference.size(); ++i) {
        difference[i] = static_cast<double>(with[i]) - without[i];
        if (i < at(0.0005)) quick = std::max(quick, std::fabs(difference[i]));
        if (i < at(0.002)) early = std::max(early, std::fabs(difference[i]));
        whole = std::max(whole, std::fabs(difference[i]));
        if (i >= 3) {
          kink = std::max(kink, std::fabs(difference[i] - 3.0 * difference[i - 1] + 3.0 * difference[i - 2] -
                                          difference[i - 3]));
        }
      }
    }
    if (whole > 0.0) {
      worst.early = std::max(worst.early, early / whole);
      worst.quick = std::max(worst.quick, quick / whole);
      worst.kink = std::max(worst.kink, kink / whole);
      worst.size = std::max(worst.size, whole);
    }
  }
  return worst;
}

// A phrase with a silence in it, rendered in blocks of `block` frames (0: a
// ragged mix): a key, a gap in which the knobs move, a chord.
static Stereo phrase(Flock& d, float gap, int block) {
  d.init(kRate);
  d.set_param(p::kLeave, 0.06f);
  d.set_param(p::kGather, 0.05f);
  d.set_param(p::kChirp, 0.3f);
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  int which = 0;
  auto run_for = [&](float seconds) {
    Stereo out;
    size_t left = at(seconds);
    while (left > 0) {
      const int want = block > 0 ? block : sizes[which++ % 8];
      const int frames = static_cast<int>(std::min(static_cast<size_t>(want), left));
      d.process(frames);
      out.left.insert(out.left.end(), d.out_left(), d.out_left() + frames);
      out.right.insert(out.right.end(), d.out_right(), d.out_right() + frames);
      left -= frames;
    }
    return out;
  };
  d.note_on(1, 220.0f, 0.8f);
  Stereo out = run_for(0.25f);
  d.note_off(1);
  out = concat(out, run_for(gap - 0.004f));
  d.set_param(p::kVolume, -3.0f);
  d.set_param(p::kTone, 0.8f);
  d.set_param(p::kWidth, 0.2f);
  d.set_param(p::kStray, 0.6f);
  out = concat(out, run_for(0.004f));
  d.note_on(2, 330.0f, 0.7f);
  d.note_on(3, 495.0f, 0.6f);
  out = concat(out, run_for(0.3f));
  d.note_off(2);
  d.note_off(3);
  return concat(out, run_for(0.2f));
}

static double largest_difference(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "flock";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.5f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // --- Tuning: with Stray at 0 a landed flock is the note --------------------------------
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (float hz : {27.5f, 110.0f, 440.0f, 1760.0f, 4186.0f}) {
        plain(device, rate);
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 2.5f, rate);
        worst = std::max(worst, std::fabs(cents(pitch(out.left, rate, at(0.5, rate), out.size()), hz)));
      }
      // Eight birds that flew in from both sides and landed on one pitch.
      plain(device, rate);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kGather, 0.4f);
      device.set_param(p::kFrom, 2.0f);
      device.set_param(p::kWidth, 0.7f);
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 2.5f, rate);
      worst = std::max(worst, std::fabs(cents(pitch(out.left, rate, at(0.5, rate), out.size()), 440.0)));
    }
    figure("tuning, Stray 0, five notes and a flock of eight at 44.1, 48 and 96 kHz: worst %.4f cents", worst);
    EXPECT(worst < 2.0, "long after Gather with Stray at 0 the pitch is the note within 2 cents");

    // The default patch roams, but around the note: the centre of its energy.
    device.init(kRate);
    device.note_on(1, kNote, 0.8f);
    Stereo roaming = render(device, 33.0f, kRate);
    const Spread centre = spread(mid(roaming), kNote, kRate, at(3.0), roaming.size());
    figure("default patch, 30 s: centre of the energy %.2f cents from the note, spread %.1f cents", centre.offset,
           centre.width);
    EXPECT(std::fabs(centre.offset) < 5.0, "the default flock is centred on the note within 5 cents");
  }

  // --- Stray: the spread of energy around the note ---------------------------------------
  {
    double width[3] = {};
    const float strays[3] = {0.0f, 0.3f, 1.0f};
    for (int s = 0; s < 3; ++s) {
      plain(device);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kGather, 0.3f);
      device.set_param(p::kStray, strays[s]);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 33.0f, kRate);
      width[s] = spread(out.left, kNote, kRate, at(3.0), out.size()).width;
    }
    figure("Stray 0 / 0.3 / 1: bandwidth %.3f / %.1f / %.1f cents", width[0], width[1], width[2]);
    EXPECT(width[0] < 0.5, "Stray 0 is one clean unison (no bandwidth)");
    EXPECT(width[1] > 6.0 && width[1] < 18.0, "Stray 0.3 spreads the flock by about 11 cents");
    EXPECT(width[2] > 70.0 && width[2] < 170.0, "Stray 1 smears it by about a semitone");

    // Stray brought down to 0 under held keys: the birds have roamed to
    // anywhere in the cycle, and they come back to the places they landed
    // on, so the flock is the clean unison of a new key and as loud. (Left
    // where they were, eight birds read anything from 14 dB under to 6 dB
    // over, for as long as the key was held.)
    plain(device);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kGather, 0.3f);
    device.set_param(p::kVolume, -18.0f);  // twelve keys stay far under the clip
    device.note_on(1, kNote, 0.8f);
    const double fresh = db(rms(render(device, 2.0f, kRate).left, at(1.0)));
    double worst_level = 0.0, worst_width = 0.0, most_off = 0.0;
    for (int key = 0; key < Flock::kMaxVoices; ++key) {
      plain(device);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kGather, 0.3f);
      device.set_param(p::kStray, 0.6f);
      device.set_param(p::kVolume, -18.0f);
      // Another voice each time, so another flight.
      for (int n = 0; n < key; ++n) device.note_on(100 + n, 60.0f, 0.1f);
      device.note_on(1, kNote, 0.8f);
      render(device, 3.0f, kRate);
      device.set_param(p::kStray, 0.0f);
      Stereo out = render(device, 5.0f, kRate);
      for (int n = 0; n < key; ++n) device.note_off(100 + n);
      // The other keys are far below and soft: what is read at the note is this key.
      const double level = db(tone_level(out.left, kNote, kRate, at(4.0)) / std::sqrt(2.0));
      worst_level = std::max(worst_level, std::fabs(level - fresh));
      if (key == 0) {
        worst_width = spread(out.left, kNote, kRate, at(4.0), out.size()).width;
        most_off = level_db(out, at(0.0), at(0.5)) - level_db(out, at(4.0));
      }
    }
    figure("Stray 0.6 brought to 0 under a held key, twelve flights: 4 s later within %.3f dB of a new unison, bandwidth %.3f cents (first half second: %+.1f dB)",
           worst_level, worst_width, most_off);
    EXPECT(worst_level < 0.1, "a flock that has roamed is the clean unison again once Stray is at 0");
    EXPECT(worst_width < 0.5, "and holds still there");
    // One bird on its way home is never more than eight cents off the note,
    // at the bottom of the keyboard as in the middle.
    for (float hz : {40.0f, 480.0f}) {
      plain(device);
      device.set_param(p::kStray, 0.6f);
      device.note_on(1, hz, 0.8f);
      render(device, 3.0f, kRate);
      device.set_param(p::kStray, 0.0f);
      render(device, 0.1f, kRate);
      Stereo out = render(device, 12.0f, kRate);
      double furthest = 0.0;
      for (size_t from = 0; from + at(0.5) <= at(4.0); from += at(0.25)) {
        furthest = std::max(furthest, std::fabs(cents(pitch(out.left, kRate, from, from + at(0.5)), hz)));
      }
      const double home = cents(pitch(out.left, kRate, at(8.0), out.size()), hz);
      figure("one bird at %.0f Hz going home: at most %.2f cents off the note on the way, %.4f cents once there", hz, furthest, home);
      EXPECT(furthest < 8.5, "a bird going home stays within eight cents of the note");
      EXPECT(std::fabs(home) < 0.05, "and is on the note once it is home");
    }

    // Flutter: how fast one bird's pitch moves, in cents per second.
    double speed[2] = {};
    const float flutters[2] = {0.2f, 2.0f};
    for (int f = 0; f < 2; ++f) {
      plain(device);
      device.set_param(p::kStray, 0.5f);
      device.set_param(p::kFlutter, flutters[f]);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 31.0f, kRate);
      double travelled = 0.0, before = 0.0;
      int windows = 0;
      for (size_t from = at(1.0); from + at(0.1) <= out.size(); from += at(0.1)) {
        const double now = cents(pitch(out.left, kRate, from, from + at(0.1)), kNote);
        if (windows > 0) travelled += std::fabs(now - before);
        before = now;
        ++windows;
      }
      speed[f] = travelled / (0.1 * (windows - 1));
    }
    figure("Flutter 0.2 / 2 Hz: one bird's pitch moves %.1f / %.1f cents per second", speed[0], speed[1]);
    EXPECT(speed[1] > 4.0 * speed[0], "Flutter sets how fast the birds roam");
  }

  // --- From and Gather: where they come from and when they are there ---------------------
  {
    double early[2] = {}, halfway[2] = {}, landed[2] = {};
    for (int from = 0; from < 2; ++from) {
      plain(device);
      device.set_param(p::kGather, 4.0f);
      device.set_param(p::kFrom, static_cast<float>(from));
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 4.6f, kRate);
      early[from] = cents(pitch(out.left, kRate, at(0.03), at(0.07)), 440.0);
      halfway[from] = cents(pitch(out.left, kRate, at(1.95), at(2.05)), 440.0);
      landed[from] = cents(pitch(out.left, kRate, at(4.0), at(4.6)), 440.0);
    }
    figure("From Below, Gather 4 s: %.0f cents at 50 ms, %.1f at 2 s, %.4f after 4 s", early[0], halfway[0], landed[0]);
    figure("From Above, Gather 4 s: %+.0f cents at 50 ms, %+.1f at 2 s, %.4f after 4 s", early[1], halfway[1], landed[1]);
    EXPECT(early[0] < -200.0, "From Below: the bird starts 200 cents or more under the note");
    EXPECT(early[1] > 200.0, "From Above: the bird starts 200 cents or more over the note");
    EXPECT(halfway[0] < -20.0 && halfway[1] > 20.0, "half way through Gather it is still on its way");
    EXPECT(std::fabs(landed[0]) < 2.0 && std::fabs(landed[1]) < 2.0, "it has arrived by Gather");

    // A shorter Gather is a shorter flight.
    plain(device);
    device.set_param(p::kGather, 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo quick = render(device, 1.5f, kRate);
    const double quick_landed = cents(pitch(quick.left, kRate, at(1.0), at(1.5)), 440.0);
    const double quick_half = cents(pitch(quick.left, kRate, at(0.48), at(0.52)), 440.0);
    figure("Gather 1 s: %.1f cents at 0.5 s, %.4f after 1 s", quick_half, quick_landed);
    EXPECT(std::fabs(quick_landed) < 2.0 && quick_half < -20.0, "Gather is the time of the flight");

    // It gets louder as it comes.
    const double far = rms(quick.left, at(0.05), at(0.15)), near = rms(quick.left, at(1.2), at(1.5));
    figure("level on the way in: %.1f dB under the landed level at 0.1 s", db(near / far));
    EXPECT(far < 0.6 * near && far > 0.2 * near, "a bird is quieter while it is far off, and heard");

    // Around: a flock comes from both sides, Below and Above from one.
    double under[3] = {}, over[3] = {};
    for (int from = 0; from < 3; ++from) {
      plain(device);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kGather, 6.0f);
      device.set_param(p::kFrom, static_cast<float>(from));
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 0.2f, kRate);
      under[from] = strongest(out.left, kRate, 200.0, 400.0, at(0.03), at(0.18));
      over[from] = strongest(out.left, kRate, 480.0, 960.0, at(0.03), at(0.18));
    }
    figure("eight birds at 30 to 180 ms, loudest under / over the note: Below %.4f / %.4f, Above %.4f / %.4f, Around %.4f / %.4f",
           under[0], over[0], under[1], over[1], under[2], over[2]);
    EXPECT(over[0] < 0.1 * under[0], "From Below: nothing comes from above");
    EXPECT(under[1] < 0.1 * over[1], "From Above: nothing comes from below");
    EXPECT(under[2] > 0.4 * over[2] && over[2] > 0.4 * under[2], "From Around: birds on both sides");

    // Gather is the time of the whole flock, not only of its first bird: at
    // a quarter of it nobody is on the note yet (the nearest a bird can be
    // by then is half a semitone off), and once it is up they all are.
    plain(device);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kGather, 4.0f);
    device.note_on(1, kNote, 0.8f);
    Stereo flock = render(device, 4.7f, kRate);
    const double there = tone_level(flock.left, kNote, kRate, at(4.2), at(4.6));
    const double on_the_way = tone_level(flock.left, kNote, kRate, at(0.6), at(1.0));
    const double settled = db(rms(flock.left, at(4.05), at(4.35)) / rms(flock.left, at(4.35), at(4.65)));
    figure("eight birds, Gather 4 s: on the note %.4f at 0.6 to 1 s against %.4f after 4.2 s; level after 4 s steady within %.4f dB",
           on_the_way, there, settled);
    EXPECT(on_the_way < 0.15 * there, "at a quarter of Gather no bird of the flock has landed");
    EXPECT(std::fabs(settled) < 0.01 && std::fabs(cents(pitch(flock.left, kRate, at(4.05), flock.size()), kNote)) < 2.0,
           "and when Gather is up the whole flock is on the note");
  }

  // --- Birds: the same level, a wider picture --------------------------------------------
  {
    double level[2][2] = {}, alike[2] = {};
    for (int s = 0; s < 2; ++s) {
      for (int b = 0; b < 2; ++b) {
        plain(device);
        device.set_param(p::kBirds, b == 0 ? 1.0f : 8.0f);
        device.set_param(p::kGather, 0.3f);
        device.set_param(p::kStray, s == 0 ? 0.5f : 0.0f);
        device.set_param(p::kWidth, 1.0f);
        device.note_on(1, kNote, 0.8f);
        Stereo out = render(device, 32.0f, kRate);
        level[s][b] = level_db(out, at(2.0));
        if (s == 0) alike[b] = alike_lr(out, at(2.0));
      }
    }
    figure("Birds 1 / 8, Stray 0.5, 30 s: level %.2f / %.2f dB, left against right %.3f / %.3f", level[0][0],
           level[0][1], alike[0], alike[1]);
    figure("Birds 1 / 8, Stray 0: level %.2f / %.2f dB", level[1][0], level[1][1]);
    EXPECT(std::fabs(level[0][1] - level[0][0]) < 2.0, "eight birds are within 2 dB of one");
    EXPECT(std::fabs(level[1][1] - level[1][0]) < 2.0, "and in a unison too, where the phases they land on decide");
    EXPECT(alike[0] > 0.999, "one bird is the same left and right but for its level");
    EXPECT(alike[1] < 0.75, "eight birds are far less alike left to right");

    // Every count, in the centre, where nothing but the landing phases is left.
    double lowest = 1.0e9, highest = -1.0e9;
    for (int birds = 1; birds <= 8; ++birds) {
      plain(device);
      device.set_param(p::kBirds, static_cast<float>(birds));
      device.set_param(p::kGather, 0.3f);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      const double here = level_db(out, at(1.0));
      lowest = std::min(lowest, here);
      highest = std::max(highest, here);
    }
    figure("a landed unison of 1 to 8 birds in the centre: levels within %.3f dB", highest - lowest);
    EXPECT(highest - lowest < 0.1, "a unison is as loud whatever Birds is");

    // Each bird has its place and drifts: one bird's balance moves over time,
    // and faster with Flutter.
    double swing[2] = {}, turns[2] = {};
    const float flutters[2] = {0.2f, 4.0f};
    for (int f = 0; f < 2; ++f) {
      plain(device);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kFlutter, flutters[f]);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 61.0f, kRate);
      double lowest_balance = 1.0e9, highest_balance = -1.0e9, before = 0.0;
      int windows = 0;
      for (size_t from = at(1.0); from + at(0.5) <= out.size(); from += at(0.5)) {
        const double balance = db(rms(out.right, from, from + at(0.5)) / rms(out.left, from, from + at(0.5)));
        lowest_balance = std::min(lowest_balance, balance);
        highest_balance = std::max(highest_balance, balance);
        if (windows > 0) turns[f] += std::fabs(balance - before);
        before = balance;
        ++windows;
      }
      swing[f] = highest_balance - lowest_balance;
    }
    figure("one bird at Width 1, a minute: its balance swings over %.1f dB at Flutter 0.2 Hz and %.1f dB at 4 Hz, travelling %.0f and %.0f dB",
           swing[0], swing[1], turns[0], turns[1]);
    EXPECT(swing[0] > 1.0 && swing[1] > 1.0 && swing[1] < 9.0, "a bird drifts from side to side, a little");
    EXPECT(turns[1] > 2.0 * turns[0], "and faster with Flutter");

    // Flocks are mirrored at random, so a chord fills both sides: the first
    // bird of a pair lands left for some keys and right for others.
    int leaning_left = 0, leaning_right = 0;
    plain(device);
    device.set_param(p::kBirds, 2.0f);
    device.set_param(p::kOctaves, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    for (int key = 0; key < 16; ++key) {
      device.note_on(key, 220.0f, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      device.note_off(key);
      render(device, 0.2f, kRate);
      // The bird on the note against the one an octave up, in the left channel.
      const double here = tone_level(out.left, 220.0, kRate, at(0.3)) / tone_level(out.right, 220.0, kRate, at(0.3));
      (here > 1.0 ? leaning_left : leaning_right) += 1;
    }
    figure("sixteen keys of two birds: the bird on the note sits left %d times and right %d times", leaning_left,
           leaning_right);
    EXPECT(leaning_left >= 3 && leaning_right >= 3, "flocks are mirrored from key to key");

    // Width 0 is mono.
    device.init(kRate);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, kNote, 0.8f);
    Stereo mono = render(device, 2.0f, kRate);
    EXPECT(mono.left == mono.right, "Width 0 puts every bird in the centre");
  }

  // --- Chirp: the level becomes calls ----------------------------------------------------
  {
    double depth[3] = {};
    int calls[2] = {};
    double level[2] = {};
    const float chirps[3] = {0.0f, 0.5f, 1.0f};
    for (int c = 0; c < 3; ++c) {
      plain(device);
      device.set_param(p::kChirp, chirps[c]);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 21.0f, kRate);
      const std::vector<double> env = envelope(out.left, at(1.0), out.size(), 500);
      const auto range = std::minmax_element(env.begin(), env.end());
      depth[c] = 1.0 - *range.first / *range.second;
      if (c != 1) level[c / 2] = db(rms(out.left, at(1.0)));
      if (c == 2) {
        for (size_t i = 1; i < env.size(); ++i) {
          if (env[i - 1] < 0.5 * *range.second && env[i] >= 0.5 * *range.second) ++calls[0];
        }
      }
    }
    plain(device);
    device.set_param(p::kChirp, 1.0f);
    device.set_param(p::kFlutter, 8.0f);
    device.note_on(1, kNote, 0.8f);
    Stereo fast = render(device, 21.0f, kRate);
    {
      const std::vector<double> env = envelope(fast.left, at(1.0), fast.size(), 500);
      const double top = *std::max_element(env.begin(), env.end());
      for (size_t i = 1; i < env.size(); ++i) {
        if (env[i - 1] < 0.5 * top && env[i] >= 0.5 * top) ++calls[1];
      }
    }
    figure("Chirp 0 / 0.5 / 1, one bird: depth of the level %.3f / %.3f / %.3f; %d calls in 20 s (%d at Flutter 8 Hz)",
           depth[0], depth[1], depth[2], calls[0], calls[1]);
    figure("Chirp 1 against 0: %.1f dB in level", level[1] - level[0]);
    EXPECT(depth[0] < 0.02, "Chirp 0 is a steady voice");
    EXPECT(depth[1] > 0.3 && depth[1] < 0.8, "Chirp 0.5 makes the level pulse");
    EXPECT(depth[2] > 0.97, "Chirp 1 leaves silence between the calls");
    EXPECT(calls[0] >= 12 && calls[0] <= 40, "a bird calls every 0.5 to 1.6 s");
    EXPECT(calls[1] > 1.6 * calls[0], "Flutter paces the calls");
    EXPECT(std::fabs(level[1] - level[0]) < 4.0, "calls are about as loud as the steady voice");

    // Each bird has its own train: eight are rarely all silent at once.
    double quiet_share[2] = {};
    for (int b = 0; b < 2; ++b) {
      plain(device);
      device.set_param(p::kBirds, b == 0 ? 1.0f : 8.0f);
      device.set_param(p::kStray, 0.3f);
      device.set_param(p::kChirp, 1.0f);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 21.0f, kRate);
      const std::vector<double> env = envelope(out.left, at(1.0), out.size(), 500);
      const double top = *std::max_element(env.begin(), env.end());
      int quiet = 0;
      for (double v : env) quiet += v < 0.05 * top ? 1 : 0;
      quiet_share[b] = static_cast<double>(quiet) / static_cast<double>(env.size());
    }
    figure("Chirp 1: silent %.0f %% of the time with one bird, %.1f %% with eight", 100.0 * quiet_share[0],
           100.0 * quiet_share[1]);
    EXPECT(quiet_share[0] > 0.25 && quiet_share[1] < 0.05, "the birds of a flock call at their own times");
  }

  // --- Octaves: birds an octave off -------------------------------------------------------
  {
    double note[2] = {}, above[2] = {}, below[2] = {};
    for (int o = 0; o < 2; ++o) {
      plain(device);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kGather, 0.3f);
      device.set_param(p::kOctaves, o == 0 ? 0.0f : 1.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      note[o] = tone_level(out.left, 220.0, kRate, at(0.5));
      above[o] = tone_level(out.left, 440.0, kRate, at(0.5));
      below[o] = tone_level(out.left, 110.0, kRate, at(0.5));
    }
    figure("Octaves 0 / 1, eight birds: note %.4f / %.4f, octave above %.5f / %.4f, octave below %.5f / %.4f", note[0],
           note[1], above[0], above[1], below[0], below[1]);
    EXPECT(above[0] < 0.001 * note[0] && below[0] < 0.001 * note[0], "Octaves 0: every bird is on the note");
    EXPECT(above[1] > 0.3 * note[0] && below[1] > 0.3 * note[0], "Octaves adds energy an octave above and below");
    EXPECT(note[1] > 0.4 * note[0], "and the note is still there");
    // Three stay, three go up at 0.7 of the level and two go down, and each
    // group lands as loud as that many unrelated voices.
    const double total = std::sqrt(3.0 + 3.0 * 0.49 + 2.0);
    EXPECT_NEAR(note[1] / note[0], std::sqrt(3.0) / total, 0.02, "the birds left on the note add up as three");
    EXPECT_NEAR(above[1] / note[0], 0.7 * std::sqrt(3.0) / total, 0.02, "the birds above add up as three");
    EXPECT_NEAR(below[1] / note[0], std::sqrt(2.0) / total, 0.02, "the birds below add up as two");

    // The default seats one bird in five above. At the bottom of the keyboard
    // nobody sits below the note, and at the top nobody above.
    device.init(kRate);
    device.set_param(p::kStray, 0.0f);
    device.set_param(p::kTone, 0.0f);
    device.set_param(p::kGather, 0.3f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo usual = render(device, 1.5f, kRate);
    const double up_share = tone_level(usual.left, 440.0, kRate, at(0.5)) / tone_level(usual.left, 220.0, kRate, at(0.5));
    plain(device);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kOctaves, 1.0f);
    device.note_on(1, 40.0f, 0.8f);
    Stereo low = render(device, 2.5f, kRate);
    const double sub = tone_level(low.left, 20.0, kRate, at(0.5)) / tone_level(low.left, 40.0, kRate, at(0.5));
    plain(device, 44100.0f);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kOctaves, 1.0f);
    device.note_on(1, 6000.0f, 0.8f);
    Stereo high = render(device, 1.5f, 44100.0f);
    const double top = tone_level(high.left, 12000.0, 44100.0, at(0.5, 44100.0)) /
                       tone_level(high.left, 6000.0, 44100.0, at(0.5, 44100.0));
    // A bird that roams past what the sample rate can carry is faded out
    // there instead of being parked just under Nyquist.
    plain(device, 44100.0f);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kOctaves, 1.0f);
    device.set_param(p::kFrom, 1.0f);
    device.set_param(p::kGather, 12.0f);
    device.set_param(p::kStray, 1.0f);
    device.set_param(p::kFlutter, 8.0f);
    device.set_param(p::kVolume, -12.0f);
    for (int n = 0; n < Flock::kMaxVoices; ++n) device.note_on(n, 12000.0f, 0.8f);
    Stereo edge = render(device, 1.0f, 44100.0f);
    double parked = 0.0;
    for (size_t from = 0; from + 2205 <= edge.size(); from += 2205) {
      parked = std::max(parked, tone_level(edge.left, 0.49 * 44100.0, 44100.0, from, from + 2205));
    }
    figure("twelve 12 kHz keys from above with Stray 1 at 44.1 kHz: loudest 50 ms at 0.49 of the sample rate %.6f", parked);
    EXPECT(parked < 2.0e-4, "no bird is parked under Nyquist");

    figure("default Octaves: octave above at %.2f of the note; at 40 Hz the octave below reads %.5f, at 6 kHz the one above %.5f",
           up_share, sub, top);
    EXPECT(up_share > 0.15 && up_share < 0.6, "the default flock has one bird an octave up");
    EXPECT(sub < 0.001, "no bird sits below the note where that would be under hearing");
    EXPECT(top < 0.001, "no bird sits above the note where that would crowd Nyquist");
  }

  // --- Leave: they drift off the note as they fade ---------------------------------------
  {
    plain(device);
    device.set_param(p::kLeave, 2.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo gone = render(device, 3.0f, kRate);
    const double full = rms(held.left, at(0.5));
    const double held_cents = cents(pitch(held.left, kRate, at(0.5), held.size()), 440.0);
    const double quarter_cents = cents(pitch(gone.left, kRate, at(0.45), at(0.55)), 440.0);
    const double half_cents = cents(pitch(gone.left, kRate, at(0.95), at(1.05)), 440.0);
    const double quarter_level = rms(gone.left, at(0.45), at(0.55)) / full;
    const double half_level = rms(gone.left, at(0.95), at(1.05)) / full;
    figure("Leave 2 s, one bird: held %.3f cents; 0.5 s after the key %+.0f cents at %.1f dB; 1 s after %+.0f cents at %.1f dB",
           held_cents, quarter_cents, db(quarter_level), half_cents, db(half_level));
    EXPECT(std::fabs(held_cents) < 2.0, "while the key is down the bird is on the note");
    EXPECT(std::fabs(quarter_cents) > 10.0, "a quarter of the way out the bird has left the note");
    EXPECT(std::fabs(half_cents) > 40.0 && std::fabs(half_cents) > 2.0 * std::fabs(quarter_cents),
           "and it goes faster the further it is");
    EXPECT(quarter_level < 0.7 && quarter_level > 0.4, "it has faded by a few dB by then");
    EXPECT(half_level < 0.35 && half_level > 0.15, "and by 12 dB half way");
    EXPECT(peak(gone.left, at(1.7), at(1.95)) > 0.0, "it is still there just before Leave is up");
    EXPECT(peak(gone.left, at(2.05)) == 0.0 && peak(gone.right, at(2.05)) == 0.0, "and at exact zero once it is");

    // Leave is the time at every setting: the flock's slowest bird is gone
    // when it is up and not before, and half way through it is 12 dB down.
    for (float leave : {0.5f, 6.0f, 15.0f}) {
      plain(device);
      device.set_param(p::kBirds, 5.0f);
      device.set_param(p::kLeave, leave);
      device.note_on(1, 440.0f, 0.8f);
      Stereo before = render(device, 0.5f, kRate);
      device.note_off(1);
      Stereo after = render(device, leave + 0.5f, kRate);
      size_t last = after.size();
      while (last > 0 && after.left[last - 1] == 0.0f && after.right[last - 1] == 0.0f) --last;
      const double ended = static_cast<double>(last) / kRate;
      figure("Leave %.1f s, five birds: exact silence %.3f s after the key", leave, ended);
      char label[120];
      std::snprintf(label, sizeof label, "Leave %.1f s is how long the flock takes to go", leave);
      EXPECT(ended > 0.97 * leave && ended < leave + 0.01, label);
      // No bird goes in less than 0.6 of Leave: at 0.3 of it each of the
      // five is between 6 and 12 dB down, and at 0.55 of it 14 dB or more.
      const double early = db(rms(after.left, at(0.28 * leave), at(0.32 * leave)) / rms(before.left, at(0.3)));
      const double late = db(rms(after.left, at(0.53 * leave), at(0.57 * leave)) / rms(before.left, at(0.3)));
      figure("  %.1f dB at 0.3 of Leave, %.1f dB at 0.55 of it", early, late);
      std::snprintf(label, sizeof label, "Leave %.1f s: the level falls over the whole of it", leave);
      EXPECT(early < -4.0 && early > -16.0 && late < -10.0 && late > -50.0, label);
    }

    // A flock scatters both ways.
    plain(device);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kLeave, 2.0f);
    device.note_on(1, 440.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo scattered = render(device, 2.0f, kRate);
    const double fell = strongest(scattered.left, kRate, 300.0, 430.0, at(0.9), at(1.2));
    const double rose = strongest(scattered.left, kRate, 450.0, 640.0, at(0.9), at(1.2));
    figure("eight birds 0.9 to 1.2 s after the key: loudest under / over the note %.4f / %.4f", fell, rose);
    EXPECT(fell > 0.2 * rose && rose > 0.2 * fell, "a flock scatters up and down");
  }

  // --- Tone: from a whistle to a reed ----------------------------------------------------
  {
    double third[3] = {}, fifth[3] = {}, seventh[3] = {}, second[3] = {}, level[3] = {};
    const float tones[3] = {0.0f, 0.5f, 1.0f};
    for (int t = 0; t < 3; ++t) {
      plain(device);
      device.set_param(p::kTone, tones[t]);
      device.note_on(1, 240.0f, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      const double first = tone_level(out.left, 240.0, kRate, at(0.5));
      second[t] = tone_level(out.left, 480.0, kRate, at(0.5)) / first;
      third[t] = tone_level(out.left, 720.0, kRate, at(0.5)) / first;
      fifth[t] = tone_level(out.left, 1200.0, kRate, at(0.5)) / first;
      seventh[t] = tone_level(out.left, 1680.0, kRate, at(0.5)) / first;
      level[t] = db(rms(out.left, at(0.5)));
    }
    figure("Tone 0 / 0.5 / 1: third harmonic %.5f / %.3f / %.3f, fifth %.5f / %.3f / %.3f, seventh %.5f / %.3f / %.3f of the first",
           third[0], third[1], third[2], fifth[0], fifth[1], fifth[2], seventh[0], seventh[1], seventh[2]);
    figure("Tone 0 / 0.5 / 1: second harmonic %.5f / %.5f / %.5f, level %.2f / %.2f / %.2f dB", second[0], second[1],
           second[2], level[0], level[1], level[2]);
    EXPECT(third[0] < 0.001 && fifth[0] < 0.001 && seventh[0] < 0.001, "Tone 0 is a pure whistle");
    EXPECT(third[1] > 0.2 && third[1] < 0.35 && seventh[1] < 0.02, "Tone 0.5 is hollow: a third harmonic, hardly a seventh");
    EXPECT(third[2] > 0.45 && third[2] < 0.65 && fifth[2] > 0.25 && fifth[2] < 0.4 && seventh[2] > 0.13 && seventh[2] < 0.27,
           "Tone 1 is reedy: third, fifth and seventh");
    EXPECT(second[2] < 0.001, "only odd harmonics");
    EXPECT(std::fabs(level[2] - level[0]) < 0.3 && std::fabs(level[1] - level[0]) < 0.3, "Tone does not change the level");

    // At the top of the keyboard the harmonics that would pass Nyquist are
    // left out instead of folding back.
    plain(device, 44100.0f);
    device.set_param(p::kTone, 1.0f);
    device.note_on(1, 4186.0f, 0.8f);
    Stereo high = render(device, 1.0f, 44100.0f);
    const double first = tone_level(high.left, 4186.0, 44100.0, 22050);
    const double kept = tone_level(high.left, 3.0 * 4186.0, 44100.0, 22050) / first;
    const double folded_seventh = tone_level(high.left, 44100.0 - 7.0 * 4186.0, 44100.0, 22050) / first;
    const double fading_fifth = tone_level(high.left, 5.0 * 4186.0, 44100.0, 22050) / first;
    figure("C8 at 44.1 kHz, Tone 1: third harmonic %.3f, fifth (20.9 kHz) %.6f, seventh folded to 14.8 kHz %.6f", kept,
           fading_fifth, folded_seventh);
    EXPECT(kept > 0.4, "the harmonic that fits is there");
    EXPECT(folded_seventh < 1.0e-4 && fading_fifth < 1.0e-4, "the ones that do not fit are left out, not folded");
  }

  // --- A held chord for half a minute ----------------------------------------------------
  {
    device.init(kRate);
    const float chord[5] = {146.83f, 220.0f, 349.23f, 523.25f, 659.26f};
    for (int n = 0; n < 5; ++n) device.note_on(n, chord[n], 0.8f);
    Stereo out = render(device, 30.0f, kRate);
    const double early = level_db(out, at(5.0), at(10.0)), late = level_db(out, at(25.0), at(30.0));
    figure("a chord of five keys held 30 s: %.2f dB at 5 to 10 s, %.2f dB at 25 to 30 s, peak %.3f", early, late,
           peak_of(out));
    EXPECT(std::fabs(late - early) < 1.5, "a held chord neither grows nor fades");
    EXPECT(peak_of(out) < 0.5, "and stays under the knee of the clip");
  }

  // --- Velocity, level, ten keys ---------------------------------------------------------
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 3.0f, kRate);
    const double one_peak = db(peak_of(one));
    figure("one key at gain 0.7, default volume: peak %.1f dBFS", one_peak);
    EXPECT(one_peak > -24.0 && one_peak < -10.0, "one key peaks between -24 and -10 dBFS");

    double level[2] = {};
    for (int v = 0; v < 2; ++v) {
      plain(device);
      device.note_on(1, 220.0f, v == 0 ? 1.0f : 0.1f);
      Stereo out = render(device, 0.5f, kRate);
      level[v] = db(rms(out.left, at(0.25)));
    }
    figure("gain 1.0 against 0.1: %.1f dB", level[0] - level[1]);
    EXPECT(level[0] - level[1] > 6.0 && level[0] - level[1] < 14.0, "a soft key is quieter by 6 to 14 dB");

    // Volume is in decibels, above the default as below it.
    double at_volume[3] = {};
    const float volumes[3] = {-21.0f, -9.0f, 3.0f};
    for (int v = 0; v < 3; ++v) {
      plain(device);
      device.set_param(p::kVolume, volumes[v]);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 0.5f, kRate);
      at_volume[v] = db(rms(out.left, at(0.25)));
    }
    figure("Volume -21 / -9 / 3 dB: %.2f / %.2f / %.2f dB", at_volume[0], at_volume[1], at_volume[2]);
    EXPECT_NEAR(at_volume[1] - at_volume[0], 12.0, 0.05, "12 dB of Volume below the default is 12 dB");
    EXPECT_NEAR(at_volume[2] - at_volume[1], 12.0, 0.05, "12 dB of Volume above the default is 12 dB");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo ten = render(device, 6.0f, kRate);
    figure("ten held keys, 6 s: peak %.3f", peak_of(ten));
    EXPECT(peak_of(ten) < 0.5, "ten held keys stay under the clip knee");

    // The clip is there when it is needed: everything at once, loud.
    device.init(kRate);
    device.set_param(p::kVolume, 6.0f);
    device.set_param(p::kStray, 0.0f);
    for (int n = 0; n < 12; ++n) device.note_on(n, 220.0f, 1.0f);
    Stereo loud = render(device, 3.0f, kRate);
    figure("twelve keys on one note at +6 dB: peak %.3f", peak_of(loud));
    EXPECT(peak_of(loud) > 0.8 && peak_of(loud) <= 1.0, "the output ends in the soft clip");
  }

  // --- A key is heard at once, and across the keyboard -----------------------------------
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo usual = render(device, 0.03f, kRate);
    plain(device);
    device.set_param(p::kGather, 12.0f);
    device.set_param(p::kChirp, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo slow = render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo after = render(device, 0.2f, kRate);
    figure("first 30 ms: peak %.1f dBFS at the defaults, %.1f dBFS with Gather 12 s and Chirp 1", db(peak_of(usual)),
           db(peak_of(slow, 0, at(0.03))));
    EXPECT(peak_of(usual) > 0.003, "something sounds within 30 ms");
    EXPECT(peak_of(slow, 0, at(0.03)) > 0.003, "also with the longest Gather and all Chirp");
    EXPECT(peak_of(after, at(0.1)) == 0.0, "and a 100 ms note is over when its Leave is");

    double lowest = 1.0e9, highest = -1.0e9;
    for (float hz : {28.0f, 440.0f, 4200.0f}) {
      plain(device);
      device.note_on(1, hz, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      const double here = db(rms(out.left, at(0.5)));
      lowest = std::min(lowest, here);
      highest = std::max(highest, here);
    }
    figure("28 Hz, 440 Hz and 4.2 kHz: levels within %.2f dB", highest - lowest);
    EXPECT(highest - lowest < 0.5, "the level is the same across the keyboard");

    // A note outside any keyboard is brought inside, not played as asked.
    plain(device);
    device.note_on(1, 30000.0f, 0.8f);
    Stereo wild = render(device, 0.5f, kRate);
    EXPECT_NEAR(pitch(wild.left, kRate, at(0.1), wild.size()), 12000.0, 5.0, "a note above 12 kHz plays at 12 kHz");
  }

  // --- Knobs thrown while a note sounds --------------------------------------------------
  {
    auto low_note = [](Flock& d) {
      plain(d);
      d.set_param(p::kBirds, 3.0f);
      d.set_param(p::kWidth, 0.5f);
      d.set_param(p::kVolume, -6.0f);
      d.note_on(1, 55.0f, 0.8f);
    };
    struct Throw {
      const char* name;
      int id;
      float from, to;
      double early;
    };
    const Throw throws[] = {
        {"Tone", p::kTone, 0.0f, 1.0f, 0.4},     {"Tone", p::kTone, 1.0f, 0.0f, 0.4},
        {"Width", p::kWidth, 0.0f, 1.0f, 0.4},   {"Width", p::kWidth, 1.0f, 0.0f, 0.4},
        {"Chirp", p::kChirp, 0.0f, 1.0f, 0.4},   {"Volume", p::kVolume, -6.0f, 6.0f, 0.5},
        {"Volume", p::kVolume, 6.0f, -48.0f, 0.5},
    };
    for (const Throw& t : throws) {
      const Arrival a = arrival(
          [&](Flock& d) {
            low_note(d);
            d.set_param(t.id, t.from);
          },
          [&](Flock& d) { d.set_param(t.id, t.to); });
      figure("%s thrown from %g to %g under a low note: %.2f of the change in 2 ms, kink %.5f of it", t.name, t.from,
             t.to, a.early, a.kink);
      char label[120];
      std::snprintf(label, sizeof label, "%s thrown across its range arrives gradually", t.name);
      EXPECT(a.size > 0.0 && a.early < t.early, label);
      std::snprintf(label, sizeof label, "%s thrown across its range leaves no step", t.name);
      EXPECT(a.kink < 0.01, label);
    }

    // The raw step of the output, against the same passage with no event.
    plain(device);
    device.set_param(p::kTone, 1.0f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo before = render(device, 0.5f, kRate);
    device.set_param(p::kTone, 0.0f);
    Stereo during = render(device, 0.1f, kRate);
    figure("Tone thrown from 1 to 0: largest step %.5f against %.5f before the throw", max_step(during.left),
           max_step(before.left, at(0.2)));
    EXPECT(max_step(during.left) < 1.02 * max_step(before.left, at(0.2)), "no click when Tone is thrown");

    // Stray thrown: the pitch leaves the note, the level does not jump.
    const Arrival stray = arrival([&](Flock& d) { low_note(d); }, [](Flock& d) { d.set_param(p::kStray, 1.0f); });
    figure("Stray thrown from 0 to 1: %.3f of the change in 2 ms, kink %.5f of it", stray.early, stray.kink);
    EXPECT(stray.early < 0.2 && stray.kink < 0.01, "Stray thrown across its range does not click");
  }

  // --- Keys: a key let go, struck again, and more keys than voices -----------------------
  {
    auto chord = [](Flock& d, int keys) {
      plain(d);
      d.set_param(p::kLeave, 1.0f);
      d.set_param(p::kGather, 0.05f);
      d.set_param(p::kVolume, -12.0f);
      for (int n = 0; n < keys; ++n) d.note_on(n, 55.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    };
    const Arrival off = arrival(
        [](Flock& d) {
          plain(d);
          d.note_on(1, 55.0f, 0.8f);
        },
        [](Flock& d) { d.note_off(1); });
    const Arrival again = arrival([&](Flock& d) { chord(d, 6); },
                                  [](Flock& d) { d.note_on(3, 55.0f * std::pow(2.0f, 6 / 12.0f), 0.8f); });
    const Arrival steal = arrival([&](Flock& d) { chord(d, Flock::kMaxVoices); },
                                  [](Flock& d) { d.note_on(40, 98.0f, 0.8f); });
    const Arrival on = arrival([&](Flock& d) { chord(d, 2); }, [](Flock& d) { d.note_on(30, 82.4f, 1.0f); });
    figure("a new key at the shortest Gather: %.3f of its first 40 ms in 0.5 ms, kink %.5f", on.quick, on.kink);
    EXPECT(on.quick < 0.05 && on.kink < 0.01, "a key starts quickly but not with a click");
    figure("a key let go at the shortest Leave: %.3f of the change in 2 ms, kink %.5f", off.early, off.kink);
    figure("a held key struck again: %.3f in 2 ms, kink %.5f; a thirteenth key: %.3f in 0.5 ms, kink %.5f", again.early,
           again.kink, steal.quick, steal.kink);
    EXPECT(off.early < 0.2 && off.kink < 0.01, "a key let go at the shortest Leave does not click");
    EXPECT(again.early < 0.2 && again.kink < 0.01, "a held key struck again does not click");
    EXPECT(steal.quick < 0.3 && steal.kink < 0.01, "a stolen voice is faded out, not cut");

    // Every voice held, quietly enough that the twelve stay under the clip
    // (its bends would put a little of every key on every other).
    auto house = [](Flock& d, int soft_key) {
      plain(d);
      d.set_param(p::kVolume, -12.0f);
      for (int n = 0; n < Flock::kMaxVoices; ++n) d.note_on(n, 100.0f + 31.0f * n, n == soft_key ? 0.2f : 0.8f);
    };
    auto key_level = [](const Stereo& s, int n) { return tone_level(s.left, 100.0 + 31.0 * n, kRate, at(0.2)); };
    auto all_off = [](Flock& d) {
      for (int n = 0; n < Flock::kMaxVoices; ++n) d.note_off(n);
      d.note_off(50);
      d.note_off(51);
      render(d, 0.2f, kRate);
      return render(d, 0.2f, kRate);
    };
    house(device, -1);
    Stereo out = render(device, 1.0f, kRate);
    const double one = tone_level(out.left, 100.0, kRate, at(0.2));

    // Two keys in one block both sound, each on a voice of its own. One of
    // the twelve is soft: it goes first, and the voice it gives up counts as
    // the new, loud key from that moment, so the second key takes another.
    house(device, 4);
    render(device, 1.0f, kRate);
    device.note_on(50, 2000.0f, 0.8f);
    device.note_on(51, 2500.0f, 0.8f);
    out = render(device, 0.5f, kRate);
    const double a = tone_level(out.left, 2000.0, kRate, at(0.2)), b = tone_level(out.left, 2500.0, kRate, at(0.2));
    int left_over = 0;
    for (int n = 0; n < Flock::kMaxVoices; ++n) left_over += key_level(out, n) > 0.25 * one ? 1 : 0;
    figure("twelve held keys (one at %.4f) and two more in one block: the new ones at %.4f and %.4f, the soft key at %.6f, %d of the twelve left",
           one, a, b, key_level(out, 4), left_over);
    EXPECT(a > 0.8 * one && b > 0.8 * one, "two keys in one block both sound when every voice is held");
    EXPECT(key_level(out, 4) < 0.01 * one, "the softest held key is the one that goes");
    EXPECT(left_over == Flock::kMaxVoices - 2, "and each new key takes one voice");
    EXPECT(peak_of(all_off(device)) == 0.0, "every voice is freed when the keys are let go");

    // A key struck twice while the voice it took is still fading: one voice,
    // and one note off ends it.
    house(device, -1);
    render(device, 1.0f, kRate);
    device.note_on(50, 2000.0f, 0.8f);
    device.note_on(50, 2000.0f, 0.8f);
    out = render(device, 0.5f, kRate);
    left_over = 0;
    for (int n = 0; n < Flock::kMaxVoices; ++n) left_over += key_level(out, n) > 0.25 * one ? 1 : 0;
    EXPECT(left_over == Flock::kMaxVoices - 1, "a key struck twice during a steal takes one voice");
    EXPECT(peak_of(all_off(device)) == 0.0, "and leaves nothing sounding after its note off");

    // A key let go before the voice it took has finished fading never sounds.
    house(device, -1);
    render(device, 1.0f, kRate);
    device.note_on(50, 2000.0f, 0.8f);
    device.note_off(50);
    out = render(device, 0.5f, kRate);
    EXPECT(tone_level(out.left, 2000.0, kRate) < 0.01 * one, "a key let go during the steal fade does not start");
    EXPECT(peak_of(all_off(device)) == 0.0, "and the voice it took is freed");

    // A key that takes a voice whose last bird is leaving in that very
    // moment still sounds: the waiting note is not lost with the flock.
    double weakest = 1.0e9;
    for (int trial = 0; trial < 12; ++trial) {
      house(device, -1);
      render(device, 0.3f, kRate);
      device.note_off(0);
      // Leave is 50 ms: the bird is gone 75 or 76 ticks later (2400 or 2432 samples).
      device.process(2048);
      device.process(312 + 8 * trial);
      device.note_on(50, 2000.0f, 0.8f);
      Stereo late = render(device, 0.3f, kRate);
      weakest = std::min(weakest, tone_level(late.left, 2000.0, kRate, at(0.1)));
    }
    figure("a key taking a voice as its last bird leaves, twelve moments: the new note at %.4f at least", weakest);
    EXPECT(weakest > 0.8 * one, "a note waiting in a voice that ends by itself still starts");

    // The key that was struck again leaves over Leave, not at once.
    plain(device);
    device.set_param(p::kLeave, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(1, 660.0f, 0.8f);
    out = render(device, 1.5f, kRate);
    const double old_early = tone_level(out.left, 220.0, kRate, at(0.0), at(0.1));
    EXPECT(old_early > 0.02, "a key struck again lets its old flock leave over Leave");
    EXPECT(peak_of(out, at(1.1)) > 0.0, "and the new one holds");
    device.note_off(1);
    render(device, 1.1f, kRate);
    EXPECT(peak_of(render(device, 0.2f, kRate)) == 0.0, "until its key is let go");
  }

  // --- Birds, Gather, From and Octaves belong to the key press -----------------------------
  {
    // Moved under held keys (and Leave too, which is read when a key is let
    // go) they change nothing at all: the same samples as with no move.
    auto held = [](Flock& d, bool move) {
      d.init(kRate);
      d.set_param(p::kStray, 0.5f);
      d.set_param(p::kChirp, 0.3f);
      d.set_param(p::kGather, 2.0f);
      d.note_on(1, 220.0f, 0.8f);
      d.note_on(2, 330.0f, 0.7f);
      Stereo out = render(d, 0.4f, kRate);  // the birds are still on their way in
      if (move) {
        d.set_param(p::kBirds, 8.0f);
        d.set_param(p::kGather, 0.02f);
        d.set_param(p::kFrom, 1.0f);
        d.set_param(p::kOctaves, 1.0f);
        d.set_param(p::kLeave, 15.0f);
      }
      out = concat(out, render(d, 3.0f, kRate));
      if (move) d.set_param(p::kLeave, 2.5f);
      d.note_off(1);
      d.note_off(2);
      return concat(out, render(d, 3.0f, kRate));
    };
    const Stereo still = held(device, false);
    const Stereo moved = held(other, true);
    EXPECT(still.left == moved.left && still.right == moved.right,
           "Birds, Gather, From, Octaves and Leave moved under held keys change nothing");
    EXPECT(peak_of(still, at(6.0)) == 0.0 && peak_of(still, at(4.0), at(5.5)) > 0.0, "(and the keys left over Leave)");

    // The next key is called with what the knobs say now.
    plain(device);
    device.set_param(p::kGather, 4.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.set_param(p::kBirds, 8.0f);
    device.set_param(p::kGather, 0.3f);
    device.set_param(p::kFrom, 1.0f);
    device.set_param(p::kOctaves, 1.0f);
    device.note_on(2, 1000.0f, 0.8f);
    Stereo next = render(device, 1.0f, kRate);
    const double note = tone_level(next.left, 1000.0, kRate, at(0.5)), upper = tone_level(next.left, 2000.0, kRate, at(0.5));
    figure("a key pressed after the four knobs moved: landed by 0.5 s, its octave at %.2f of the note", upper / note);
    EXPECT(upper > 0.5 * note && note > 0.02, "the next key gets the new Birds, Gather and Octaves");
    plain(device);
    device.set_param(p::kGather, 4.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    device.set_param(p::kFrom, 1.0f);
    device.set_param(p::kGather, 1.0f);
    device.note_on(2, 3000.0f, 0.8f);
    next = render(device, 0.1f, kRate);
    // The new key is far above the old one, so the crossings that count are its own once the old one is taken away.
    plain(other);
    other.set_param(p::kGather, 4.0f);
    other.note_on(1, 220.0f, 0.8f);
    render(other, 0.5f, kRate);
    Stereo alone = render(other, 0.1f, kRate);
    std::vector<float> only(next.size());
    for (size_t i = 0; i < only.size(); ++i) only[i] = next.left[i] - alone.left[i];
    const double starts = cents(pitch(only, kRate, at(0.03), at(0.07)), 3000.0);
    figure("a key pressed after From went to Above: %+.0f cents at 50 ms", starts);
    EXPECT(starts > 200.0, "the next key flies in from where From says now");
  }

  // --- Knobs moved in silence are there for the next key ---------------------------------
  {
    // Both devices play the same keys, so both draw the same flights; one is
    // set before its first block, the other while it sleeps.
    // Every voice is used first, so the next key gets one that has sounded
    // under the old settings.
    auto first_key = [](Flock& d) {
      for (int n = 0; n < Flock::kMaxVoices; ++n) d.note_on(n, 110.0f + 40.0f * n, 0.5f);
      render(d, 0.2f, kRate);
      d.process(13);  // off the beat of everything
      for (int n = 0; n < Flock::kMaxVoices; ++n) d.note_off(n);
      render(d, 0.5f, kRate);
    };
    auto settings = [](Flock& d) {
      d.set_param(p::kVolume, 3.0f);
      d.set_param(p::kTone, 0.9f);
      d.set_param(p::kWidth, 1.0f);
      d.set_param(p::kStray, 0.7f);
      d.set_param(p::kChirp, 0.6f);
    };
    device.init(kRate);
    device.set_param(p::kLeave, 0.05f);
    device.set_param(p::kVolume, -30.0f);
    first_key(device);
    settings(device);
    render(device, 0.05f, kRate);
    device.note_on(20, 220.0f, 0.8f);
    Stereo moved = render(device, 0.5f, kRate);

    other.init(kRate);
    other.set_param(p::kLeave, 0.05f);
    settings(other);
    first_key(other);
    render(other, 0.05f, kRate);
    other.note_on(20, 220.0f, 0.8f);
    Stereo set = render(other, 0.5f, kRate);
    const double apart = largest_difference(moved, set);
    figure("five knobs moved in silence, then a key: %.2g from a device set that way from the start (peak %.3f)", apart,
           peak_of(set));
    EXPECT(apart < 1.0e-6, "a knob moved while nothing sounds is in place for the next key");
  }

  // --- The output does not depend on the block size --------------------------------------
  {
    double worst = 0.0;
    int compared = 0;
    for (float gap = 0.07f; gap < 0.215f; gap += 0.01f) {
      const Stereo reference = phrase(device, gap, 128);
      for (int block : {1, 2048, 0}) {
        worst = std::max(worst, largest_difference(reference, phrase(device, gap, block)));
        ++compared;
      }
    }
    const Stereo reference = phrase(device, 1.3f, 128);
    worst = std::max(worst, largest_difference(reference, phrase(device, 1.3f, 1)));
    worst = std::max(worst, largest_difference(reference, phrase(device, 1.3f, 2048)));
    figure("blocks of 1, 2048 and ragged against 128, silences of 70 to 210 ms and 1.3 s (%d renders): largest difference %.2g",
           compared + 2, worst);
    EXPECT(worst < 1.0e-6, "1, 128 and 2048 frames give the same audio through a silence and a wake");
    EXPECT(peak_of(reference) > 0.02, "(and the phrase is not silence)");
  }

  // --- Two runs are the same run ---------------------------------------------------------
  {
    auto piece = [](Flock& d) {
      d.init(kRate);
      d.set_param(p::kBirds, 8.0f);
      d.set_param(p::kStray, 0.6f);
      d.set_param(p::kChirp, 0.5f);
      d.set_param(p::kFrom, 2.0f);
      d.set_param(p::kOctaves, 0.7f);
      d.note_on(1, 220.0f, 0.8f);
      d.note_on(2, 330.0f, 0.8f);
      Stereo out = render(d, 2.0f, kRate);
      d.note_off(1);
      d.note_on(3, 440.0f, 0.6f);
      return concat(out, render(d, 2.0f, kRate));
    };
    const Stereo first = piece(device);
    const Stereo second = piece(device);
    const Stereo third = piece(other);
    EXPECT(first.left == second.left && first.right == second.right, "a second init() gives bit-identical audio");
    EXPECT(first.left == third.left && first.right == third.right, "and so does another instance");
    // The flights are drawn per key: two keys on one pitch are two flocks.
    plain(device);
    device.set_param(p::kStray, 0.5f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, kNote, 0.8f);
    Stereo one = render(device, 4.0f, kRate);
    plain(device);
    device.set_param(p::kStray, 0.5f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 30.0f, 0.0f);
    device.note_on(2, kNote, 0.8f);
    Stereo two = render(device, 4.0f, kRate);
    const double same = std::fabs(correlation(one.left, two.left, at(2.0)));
    figure("the same key on the first and on the second voice: correlation %.3f", same);
    EXPECT(same < 0.9, "each voice draws its own flights");
  }

  // --- The motion is the same at every sample rate ---------------------------------------
  {
    double width[2] = {}, landing[2] = {};
    int calls[2] = {};
    const float rates[2] = {48000.0f, 96000.0f};
    for (int r = 0; r < 2; ++r) {
      const float rate = rates[r];
      plain(device, rate);
      device.set_param(p::kBirds, 8.0f);
      device.set_param(p::kStray, 0.5f);
      device.set_param(p::kGather, 0.3f);
      device.note_on(1, kNote, 0.8f);
      Stereo out = render(device, 23.0f, rate);
      width[r] = spread(out.left, kNote, rate, at(3.0, rate), out.size()).width;

      plain(device, rate);
      device.set_param(p::kGather, 2.0f);
      device.set_param(p::kChirp, 1.0f);
      device.note_on(1, 440.0f, 0.8f);
      out = render(device, 21.0f, rate);
      const std::vector<double> env = envelope(out.left, at(1.0, rate), out.size(), at(0.0125, rate));
      const double top = *std::max_element(env.begin(), env.end());
      for (size_t i = 1; i < env.size(); ++i) {
        if (env[i - 1] < 0.5 * top && env[i] >= 0.5 * top) ++calls[r];
      }
      plain(device, rate);
      device.set_param(p::kGather, 2.0f);
      device.note_on(1, 440.0f, 0.8f);
      out = render(device, 1.1f, rate);
      landing[r] = cents(pitch(out.left, rate, at(0.95, rate), at(1.05, rate)), 440.0);
    }
    figure("48 / 96 kHz: Stray 0.5 spreads %.1f / %.1f cents, %d / %d calls in 20 s, half way in %.1f / %.1f cents",
           width[0], width[1], calls[0], calls[1], landing[0], landing[1]);
    EXPECT(std::fabs(width[1] / width[0] - 1.0) < 0.3, "Stray spreads as far at 96 kHz");
    EXPECT(std::abs(calls[1] - calls[0]) <= 4, "the calls come as often at 96 kHz");
    EXPECT(std::fabs(landing[1] - landing[0]) < 3.0, "the flight is the same at 96 kHz");
  }

  // --- Cost ------------------------------------------------------------------------------
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("flock (8 keys, default 5 birds)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kBirds, 8.0f);
  device.set_param(p::kTone, 1.0f);
  device.set_param(p::kChirp, 0.5f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("flock (8 keys, 8 birds, reedy, calling)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("flock");
}
