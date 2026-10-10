// Native harness for Glints (cpp/devices/glints). The conformance pass covers
// stability, silence when idle, block-size independence on continuous sound
// and parameter abuse; the rest asserts what makes it Glints: each spark is a
// piece of the input on one of its harmonics, as long as Size, as late as
// its head start and Scatter make it, thrown at the pace Density and Follow
// set, somewhere between the speakers, with an echo of its own.

#include "../devices/glints/glints.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Glints;
namespace p = livemix::glints;

static Glints device;
static Glints other;

static const float kRate = 48000.0f;

// The sparks alone, with nothing that hides one of them: no dry sound, no
// trail, all in the centre, at a steady pace, with Sparkle's high-pass down
// at 150 Hz.
static void bare(Glints& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kFollow, 0.0f);
  d.set_param(p::kTrail, 0.0f);
  d.set_param(p::kSparkle, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kScatter, 0.0f);
}

// How much of `hz` there is in a sound whose pieces come at any phase: the
// root mean square of the component's level over windows of 43 ms.
static double band(const std::vector<float>& x, double hz, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const size_t window = 2048;
  double sum = 0.0;
  int count = 0;
  for (size_t at = from; at + window <= to; at += window) {
    const double level = tone_level(x, hz, kRate, at, at + window);
    sum += level * level;
    ++count;
  }
  return count > 0 ? std::sqrt(sum / count) : 0.0;
}

// The outline of a sound: the largest magnitude within half a millisecond.
static std::vector<float> outline(const std::vector<float>& x) {
  const int reach = 24;
  std::vector<float> out(x.size(), 0.0f);
  for (size_t i = 0; i < x.size(); ++i) {
    float most = 0.0f;
    const size_t lo = i >= static_cast<size_t>(reach) ? i - reach : 0;
    const size_t hi = std::min(x.size(), i + reach + 1);
    for (size_t k = lo; k < hi; ++k) most = std::max(most, std::fabs(x[k]));
    out[i] = most;
  }
  return out;
}

struct Burst {
  size_t from, to;  // where the outline is above the floor
  double peak;
};

// Every stretch of `shape` above `floor`, with nothing above it for `apart`
// samples on either side: sparks that stand alone.
static std::vector<Burst> bursts(const std::vector<float>& shape, float floor, size_t apart) {
  std::vector<Burst> found;
  size_t i = 0;
  while (i < shape.size()) {
    if (shape[i] <= floor) {
      ++i;
      continue;
    }
    Burst burst{i, i, 0.0};
    while (i < shape.size() && shape[i] > floor) {
      burst.peak = std::max(burst.peak, static_cast<double>(shape[i]));
      ++i;
    }
    burst.to = i;
    found.push_back(burst);
  }
  std::vector<Burst> alone;
  for (size_t n = 0; n < found.size(); ++n) {
    const bool before = n == 0 ? found[n].from > apart : found[n].from - found[n - 1].to > apart;
    const bool after = n + 1 == found.size() ? shape.size() - found[n].to > apart
                                             : found[n + 1].from - found[n].to > apart;
    if (before && after) alone.push_back(found[n]);
  }
  return alone;
}

// How long a burst is above `share` of its own peak, in samples.
static double width_at(const std::vector<float>& shape, const Burst& burst, double share) {
  size_t first = burst.to, last = burst.from;
  for (size_t i = burst.from; i < burst.to; ++i) {
    if (shape[i] > share * burst.peak) {
      first = std::min(first, i);
      last = std::max(last, i);
    }
  }
  return last >= first ? static_cast<double>(last - first + 1) : 0.0;
}

static double median(std::vector<double> values) {
  if (values.empty()) return 0.0;
  std::sort(values.begin(), values.end());
  return values[values.size() / 2];
}

// What the device says of its newest spark (meter 2), unpacked.
struct Told {
  int row;
  double pan;
  double late;  // seconds
  int loud;
};
static Told told(const Glints& d, int index = 2) {
  const uint32_t code = static_cast<uint32_t>(d.meter(index));
  return Told{static_cast<int>(code & 7u), ((code >> 3) & 63u) / 31.5 - 1.0, ((code >> 9) & 4095u) * 0.002,
              static_cast<int>(code >> 21)};
}

// How much of a change is there at once: two renders from the same start, one
// with `event` applied at `at` seconds, the largest difference in the first
// 8 samples after it against the largest in the 20 ms after it. A smoothed
// change has hardly begun after 8 samples; a jump is all there. The worst of
// eight moments, so that a jump cannot hide in a zero crossing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, const std::vector<float>& input) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const size_t at = static_cast<size_t>((1.5 + 0.0173 * trial) * kRate);
    const size_t span = static_cast<size_t>(0.02 * kRate);
    std::vector<float> head(input.begin(), input.begin() + at);
    std::vector<float> rest(input.begin() + at, input.begin() + at + span);
    setup(device);
    run(device, head, 64);
    Stereo with_event;
    event(device);
    with_event = run(device, rest, 64);
    setup(other);
    run(other, head, 64);
    Stereo without = run(other, rest, 64);
    double first = 0.0, whole = 0.0;
    for (size_t i = 0; i < span; ++i) {
      const double diff = std::max(std::fabs(static_cast<double>(with_event.left[i]) - without.left[i]),
                                   std::fabs(static_cast<double>(with_event.right[i]) - without.right[i]));
      if (i < 8) first = std::max(first, diff);
      whole = std::max(whole, diff);
    }
    if (whole > 1.0e-9) worst = std::max(worst, first / whole);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "glints";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 9.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // --- Pitch: a sine in gives sparks on its 2nd, 3rd and 4th harmonic per the choice, and on up to
  // the 8th for Overtones; nothing at the sine itself and nothing between or above the rows.
  {
    const double base = 220.0;
    double level[5][10];
    for (int choice = 0; choice < 5; ++choice) {
      bare(device);
      device.set_param(p::kPitch, static_cast<float>(choice));
      device.set_param(p::kDensity, 10.0f);
      Stereo out = run(device, sine(220.0f, 30.0f, kRate, 0.3f));
      for (int h = 1; h <= 9; ++h) level[choice][h] = band(out.left, base * h, 48000);
    }
    auto only = [&](int choice, int wanted, const char* message) {
      bool good = level[choice][wanted] > 0.01;
      for (int h = 1; h <= 9; ++h) {
        if (h != wanted && level[choice][h] > 0.02 * level[choice][wanted]) good = false;
      }
      EXPECT(good, message);
    };
    only(0, 2, "Octave: a sine comes back at twice its frequency and nowhere else");
    only(1, 3, "Octave and fifth: a sine comes back at three times its frequency and nowhere else");
    only(2, 4, "Two octaves: a sine comes back at four times its frequency and nowhere else");
    const double mixed = std::max(level[3][2], std::max(level[3][3], level[3][4]));
    EXPECT(level[3][2] > 0.3 * mixed && level[3][3] > 0.3 * mixed && level[3][4] > 0.3 * mixed,
           "Mixed: sparks at x2, x3 and x4");
    EXPECT(level[3][1] < 0.02 * mixed && level[3][5] < 0.02 * mixed && level[3][6] < 0.02 * mixed,
           "Mixed: nothing at the sine itself or above x4");
    double series = 0.0;
    for (int h = 2; h <= 8; ++h) series = std::max(series, level[4][h]);
    bool every = true;
    for (int h = 2; h <= 8; ++h) every = every && level[4][h] > 0.2 * series;
    EXPECT(every, "Overtones: sparks on every harmonic from the 2nd to the 8th");
    EXPECT(level[4][1] < 0.02 * series && level[4][9] < 0.02 * series,
           "Overtones: nothing at the sine itself or on the 9th harmonic");
    EXPECT(level[4][2] > level[4][8], "Overtones: the lower harmonics come more often");
  }

  // --- No fold-back: what a spark would shift past Nyquist is not there to shift, and the
  // fractional reads leave no images.
  {
    bare(device);
    device.set_param(p::kPitch, 2.0f);
    device.set_param(p::kDensity, 10.0f);
    Stereo passed = run(device, sine(3000.0f, 10.0f, kRate, 0.3f));
    bare(device);
    device.set_param(p::kPitch, 2.0f);
    device.set_param(p::kDensity, 10.0f);
    Stereo folded = run(device, sine(9000.0f, 10.0f, kRate, 0.3f));
    EXPECT(rms(passed.left, 48000) > 0.02, "x4 of 3 kHz is 12 kHz: it sounds");
    EXPECT(rms(folded.left, 48000) < 0.001 * rms(passed.left, 48000),
           "x4 of 9 kHz would fold back to 12 kHz: the decimated ring has none of it");
    // x3 moves through the ÷4 ring by three quarters of a sample. 3.5 kHz comes back at 10.5 kHz;
    // its image in the ring (8.5 kHz) would come back at 25.5 kHz, folded to 22.5 kHz.
    bare(device);
    device.set_param(p::kPitch, 1.0f);
    device.set_param(p::kDensity, 10.0f);
    Stereo third = run(device, sine(3500.0f, 10.0f, kRate, 0.3f));
    const double wanted = band(third.left, 10500.0, 48000);
    const double image = band(third.left, 22500.0, 48000);
    EXPECT(wanted > 0.01 && image < 0.006 * wanted, "x3: the image of a fractional read is 45 dB down");
    // x5 and x7 move by five and seven eighths through the ÷8 ring (6 kHz): 1.5 kHz comes back at
    // 7.5 and 10.5 kHz, and its image (4.5 kHz in the ring) at 22.5 kHz and at 31.5 folded to 16.5 kHz.
    bare(device);
    device.set_param(p::kPitch, 4.0f);
    device.set_param(p::kDensity, 20.0f);
    Stereo series = run(device, sine(1500.0f, 20.0f, kRate, 0.3f));
    const double fifth = band(series.left, 7500.0, 48000);
    const double seventh = band(series.left, 10500.0, 48000);
    EXPECT(fifth > 0.003 && seventh > 0.003, "Overtones: 1.5 kHz comes back at 7.5 and 10.5 kHz");
    EXPECT(band(series.left, 16500.0, 48000) < 0.006 * seventh &&
               band(series.left, 22500.0, 48000) < 0.006 * fifth,
           "x5 and x7: the images of their fractional reads are 45 dB down");
  }

  // --- Density: sparks a second, counted in the sound and by the device's own count.
  {
    bare(device);
    device.set_param(p::kPitch, 0.0f);
    device.set_param(p::kDensity, 2.0f);
    device.set_param(p::kSize, 20.0f);
    Stereo out = run(device, sine(1000.0f, 60.0f, kRate, 0.3f));
    const std::vector<float> shape = outline(out.left);
    const size_t heard = bursts(shape, 1.0e-4f, 0).size();
    const double counted = device.meter(0);
    EXPECT_NEAR(counted, 120.0, 24.0, "Density 2 throws about 120 sparks in a minute");
    // Two sparks that fall on one another are one burst in the sound: a few of 120.
    EXPECT(heard <= counted && heard >= counted - 12.0, "each spark the device counts is a burst in the sound");
    for (float density : {0.5f, 5.0f, 20.0f, 40.0f}) {
      bare(device);
      device.set_param(p::kDensity, density);
      run(device, sine(1000.0f, 60.0f, kRate, 0.3f));
      char label[96];
      std::snprintf(label, sizeof label, "Density %g: %g sparks in a minute", density, device.meter(0));
      EXPECT(std::fabs(device.meter(0) - 60.0 * density) < 0.1 * 60.0 * density + 10.0, label);
    }
  }

  // --- Size: each spark is as long as Size, with a fast front edge and a fall by the square.
  {
    for (float size : {20.0f, 80.0f, 250.0f}) {
      bare(device);
      device.set_param(p::kPitch, 0.0f);
      device.set_param(p::kDensity, 0.5f);
      device.set_param(p::kSize, size);
      Stereo out = run(device, sine(1000.0f, 120.0f, kRate, 0.3f));
      const std::vector<float> shape = outline(out.left);
      const std::vector<Burst> alone = bursts(shape, 1.0e-5f, static_cast<size_t>(0.05 * kRate));
      std::vector<double> whole, half;
      for (const Burst& burst : alone) {
        whole.push_back(width_at(shape, burst, 0.003) / kRate * 1000.0);
        half.push_back(width_at(shape, burst, 0.5) / kRate * 1000.0);
      }
      char label[120];
      std::snprintf(label, sizeof label, "Size %g ms: a spark is %.1f ms long down to -50 dB (%zu measured)",
                    size, median(whole), alone.size());
      EXPECT(alone.size() >= 10 && median(whole) > 0.9 * size && median(whole) < 1.01 * size, label);
      // (1 - v)² is at half after 29 % of the fall; a straight fall would be at half after 50 %.
      std::snprintf(label, sizeof label, "Size %g ms: above half its peak for %.1f ms, a quick fall", size,
                    median(half));
      EXPECT(median(half) > 0.24 * size && median(half) < 0.4 * size, label);
    }
    // The front edge: 6 ms at Sparkle 0, 0.3 ms at Sparkle 1 (measured from a tenth of the peak to
    // nine tenths of it, with the high-pass out of the way of a 6 kHz spark).
    double rise[2];
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kPitch, 0.0f);
      device.set_param(p::kDensity, 0.5f);
      device.set_param(p::kSize, 120.0f);
      device.set_param(p::kSparkle, which == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(3000.0f, 120.0f, kRate, 0.3f));
      const std::vector<float> shape = outline(out.left);
      const std::vector<Burst> alone = bursts(shape, 1.0e-5f, static_cast<size_t>(0.05 * kRate));
      std::vector<double> rises;
      for (const Burst& burst : alone) {
        size_t low = burst.from, high = burst.from;
        while (low < burst.to && shape[low] < 0.1 * burst.peak) ++low;
        while (high < burst.to && shape[high] < 0.9 * burst.peak) ++high;
        rises.push_back(static_cast<double>(high - low) / kRate * 1000.0);
      }
      rise[which] = median(rises);
    }
    EXPECT(rise[0] > 2.0 && rise[0] < 6.0, "Sparkle 0: a soft front edge of a few milliseconds");
    EXPECT(rise[1] < 0.8, "Sparkle 1: a front edge under a millisecond");
  }

  // --- How late: a spark reads faster than the sound arrives, so it starts (speed - 1) x Size
  // behind the present; Scatter lets it start later still.
  {
    // One 20 ms blip. Whatever of it a spark plays, it plays between the blip and the blip plus
    // the furthest a spark may start back. The pace is by chance and only a few sparks catch a
    // blip, so it is tried at a dozen moments of the pace and the latest is taken: a tone too soft
    // to throw a spark (-100 dBFS) starts the pace a little sooner each time.
    auto latest_sound = [&](float scatter, float pitch) {
      double latest = 0.0;
      for (int trial = 0; trial < 12; ++trial) {
        bare(device);
        device.set_param(p::kPitch, pitch);
        device.set_param(p::kDensity, 40.0f);
        device.set_param(p::kSize, 40.0f);
        device.set_param(p::kScatter, scatter);
        std::vector<float> input = silence(4.0f, kRate);
        for (int i = 24000 - 577 * trial; i < 48000; ++i) input[i] = (i & 1) ? 1.0e-5f : -1.0e-5f;
        for (int i = 0; i < 960; ++i) {
          input[48000 + i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * 1000.0 * i / kRate));
        }
        Stereo out = run(device, input);
        size_t last = 0;
        for (size_t i = 0; i < out.left.size(); ++i) {
          if (std::fabs(out.left[i]) > 1.0e-4f) last = i;
        }
        latest = std::max(latest, static_cast<double>(last) / kRate - 1.02);  // seconds after the blip ended
      }
      return latest;
    };
    const double near2 = latest_sound(0.0f, 0.0f);
    const double near4 = latest_sound(0.0f, 2.0f);
    const double far2 = latest_sound(1000.0f, 0.0f);
    // Octave, 40 ms: a spark starts 41 ms back, so the last of the blip is over 41 ms after it
    // ended, and what the 150 Hz high-pass rings on after it a few ms more.
    EXPECT(near2 > 0.03 && near2 < 0.048, "Scatter 0, Octave: the blip sparks for 41 ms and no later");
    // Two octaves: three lengths of head start, 123 ms.
    EXPECT(near4 > 0.1 && near4 < 0.13, "Scatter 0, Two octaves: the blip sparks for 123 ms and no later");
    EXPECT(far2 > 0.5 && far2 < 1.048, "Scatter 1 s: the blip still sparks most of a second later, never past it");
    // And the device says of each spark how late it is: its head start, then up to Scatter.
    bare(device);
    device.set_param(p::kPitch, 2.0f);
    device.set_param(p::kSize, 50.0f);
    device.set_param(p::kDensity, 10.0f);
    run(device, sine(500.0f, 2.0f, kRate, 0.3f));
    EXPECT_NEAR(told(device).late, 0.150 + (93.0 + 48.0) / kRate, 0.0021, "Two octaves, 50 ms: 150 ms late");
    EXPECT(told(device).row == 2, "the device names the row of its newest spark");
    device.set_param(p::kScatter, 800.0f);
    double least = 10.0, most = 0.0;
    for (int n = 0; n < 200; ++n) {
      run(device, sine(500.0f, 0.1f, kRate, 0.3f));
      for (int index = 2; index < 6; ++index) {
        least = std::min(least, told(device, index).late);
        most = std::max(most, told(device, index).late);
      }
    }
    EXPECT(least > 0.15 && least < 0.17 && most > 0.75 && most < 0.955,
           "Scatter 800 ms: sparks from 150 ms to most of 950 ms late");
  }

  // --- Follow: at 0 a steady pace whatever is played; at 1 only while playing, in proportion.
  {
    auto thrown = [&](float follow, float hz, float gain) {
      bare(device);
      device.set_param(p::kFollow, follow);
      device.set_param(p::kDensity, 10.0f);
      run(device, sine(hz, 30.0f, kRate, gain));
      return static_cast<double>(device.meter(0));
    };
    const double steady_loud = thrown(0.0f, 220.0f, 0.5f);
    const double steady_soft = thrown(0.0f, 220.0f, 0.01f);
    EXPECT(std::fabs(steady_loud - 300.0) < 40.0 && std::fabs(steady_soft - 300.0) < 40.0,
           "Follow 0: the pace is Density, loud or soft");
    // A spark of nothing is not thrown: what it would read has to be over -72 dBFS.
    EXPECT(thrown(0.0f, 220.0f, 0.0001f) == 0.0, "Follow 0: of sound under -72 dBFS no spark is thrown");
    EXPECT(std::fabs(thrown(0.0f, 220.0f, 0.001f) - 300.0) < 40.0, "Follow 0: at -60 dBFS the pace is Density");
    const double loud = thrown(1.0f, 220.0f, 0.5f);
    const double soft = thrown(1.0f, 220.0f, 0.03f);
    const double bright = thrown(1.0f, 5000.0f, 0.03f);
    EXPECT(loud > 180.0 && loud <= 310.0, "Follow 1: loud playing throws most of Density");
    EXPECT(soft > 20.0 && soft < 0.6 * loud, "Follow 1: soft playing throws fewer");
    EXPECT(bright > 1.4 * soft, "Follow 1: bright playing throws more than dull playing as loud");
    EXPECT(thrown(1.0f, 220.0f, 0.0015f) == 0.0, "Follow 1: under -48 dB nothing is thrown");
    // After the sound is gone: none at Follow 1, and at Follow 0 the rain goes on off what was played.
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kFollow, which == 0 ? 1.0f : 0.0f);
      device.set_param(p::kDensity, 20.0f);
      device.set_param(p::kScatter, 2000.0f);
      run(device, sine(440.0f, 3.0f, kRate, 0.3f));
      Stereo after = render(device, 3.0f, kRate);
      if (which == 0) {
        EXPECT(rms(after.left, 24000) == 0.0, "Follow 1: no spark half a second after the sound is gone");
      } else {
        EXPECT(rms(after.left, 24000, 72000) > 0.001, "Follow 0: sparks go on off the sound that was played");
      }
    }
    // The pace the device reports is what it throws by.
    bare(device);
    device.set_param(p::kDensity, 12.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.3f));
    EXPECT_NEAR(device.meter(1), 12.0, 1.0e-3, "Follow 0: the reported pace is Density");
    device.set_param(p::kFollow, 1.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.25f));
    // A 0.25 sine: 0.3 of it and 3 x what a 3 kHz high-pass leaves of 440 Hz, about -17 dB; (−17 + 48) / 42.
    EXPECT(device.meter(1) > 0.6 * 12.0 && device.meter(1) < 0.85 * 12.0,
           "Follow 1: the reported pace is in proportion to the level");
  }

  // --- Spread: 0 is the centre; 1 throws sparks to both sides, one at a time.
  {
    bare(device);
    device.set_param(p::kDensity, 10.0f);
    Stereo centre = run(device, sine(440.0f, 10.0f, kRate, 0.3f));
    EXPECT(centre.left == centre.right && rms(centre.left) > 0.01, "Spread 0: the two sides are the same");
    bare(device);
    device.set_param(p::kDensity, 2.0f);
    device.set_param(p::kSize, 20.0f);
    device.set_param(p::kSpread, 1.0f);
    Stereo wide = run(device, sine(440.0f, 30.0f, kRate, 0.3f));
    int lefts = 0, rights = 0, middles = 0;
    const std::vector<float> ls = outline(wide.left), rs = outline(wide.right);
    std::vector<float> both(ls.size());
    for (size_t i = 0; i < both.size(); ++i) both[i] = std::max(ls[i], rs[i]);
    for (const Burst& burst : bursts(both, 1.0e-4f, 480)) {
      const double l = peak(wide.left, burst.from, burst.to), r = peak(wide.right, burst.from, burst.to);
      if (l > 3.0 * r) ++lefts;
      else if (r > 3.0 * l) ++rights;
      else ++middles;
    }
    EXPECT(lefts >= 8 && rights >= 8, "Spread 1: sparks on the left and sparks on the right");
    EXPECT(middles < (lefts + rights) / 2, "Spread 1: most sparks are well to one side");
    // The same sparks in the centre have the same power over the two sides, and a spark hard to
    // one side is on that side as loud as what it reads.
    bare(device);
    device.set_param(p::kDensity, 2.0f);
    device.set_param(p::kSize, 20.0f);
    Stereo middle = run(device, sine(440.0f, 30.0f, kRate, 0.3f));
    const double wide_power = rms(wide.left) * rms(wide.left) + rms(wide.right) * rms(wide.right);
    const double middle_power = 2.0 * rms(middle.left) * rms(middle.left);
    EXPECT(std::fabs(10.0 * std::log10(wide_power / middle_power)) < 0.1, "Spread keeps the power of a spark");
    EXPECT_NEAR(std::max(peak(wide.left), peak(wide.right)), 0.3, 0.02,
                "a spark hard to one side peaks at the level of what it reads");
  }

  // --- Trail: an echo on the sparks only, on the other side, a Trail Time later, 0.85 x Trail as loud.
  {
    // The first spark that has a second to itself and its trail: how loud each side is in it, and
    // 200 ms and 400 ms after it, against its own peak.
    struct Echoes {
      bool found = false;
      double left[3] = {0, 0, 0}, right[3] = {0, 0, 0};
    };
    auto echoes = [&](float trail, float spread) {
      bare(device);
      device.set_param(p::kPitch, 0.0f);
      device.set_param(p::kDensity, 0.2f);
      device.set_param(p::kSize, 30.0f);
      device.set_param(p::kSpread, spread);
      device.set_param(p::kTrail, trail);
      device.set_param(p::kTrailTime, 200.0f);
      Stereo out = run(device, sine(400.0f, 90.0f, kRate, 0.3f));
      const std::vector<float> ls = outline(out.left), rs = outline(out.right);
      std::vector<float> both(ls.size());
      for (size_t i = 0; i < both.size(); ++i) both[i] = std::max(ls[i], rs[i]);
      Echoes result;
      // A burst after two seconds of nothing is a spark and not an echo, and at this pace the
      // next spark is a second and a half away at the least.
      const std::vector<Burst> all = bursts(both, 0.001f, 0);
      for (size_t n = 0; n < all.size() && !result.found; ++n) {
        const Burst& burst = all[n];
        if (burst.from < 96000 || burst.to + 48000 > both.size()) continue;
        if (n > 0 && burst.from - all[n - 1].to < 96000) continue;
        const double l = peak(out.left, burst.from, burst.to), r = peak(out.right, burst.from, burst.to);
        if (spread > 0.0f && std::max(l, r) < 3.0 * std::min(l, r)) continue;  // not well to one side
        for (int k = 0; k < 3; ++k) {
          const size_t at = burst.from + k * 9600;
          result.left[k] = peak(out.left, at - 240, at + 1680) / burst.peak;
          result.right[k] = peak(out.right, at - 240, at + 1680) / burst.peak;
        }
        result.found = true;
      }
      return result;
    };
    const Echoes centre = echoes(0.5f, 0.0f);
    EXPECT(centre.found, "a spark with a second to itself");
    EXPECT_NEAR(centre.left[1], 0.425, 0.03, "Trail 0.5: an echo 200 ms later, 0.85 x 0.5 as loud");
    EXPECT_NEAR(centre.left[2], 0.18, 0.03, "Trail 0.5: and again 400 ms later, by the same again");
    const Echoes none = echoes(0.0f, 0.0f);
    EXPECT(none.found && none.left[1] == 0.0 && none.left[2] == 0.0, "Trail 0: no echo");
    const Echoes thrown = echoes(0.5f, 1.0f);
    const bool on_left = thrown.left[0] > thrown.right[0];
    const double* near = on_left ? thrown.left : thrown.right;
    const double* far = on_left ? thrown.right : thrown.left;
    EXPECT(thrown.found && far[1] > 3.0 * near[1] && near[2] > 3.0 * far[2],
           "the echo of a spark on one side is on the other side, and the next is back on its own");
    EXPECT_NEAR(far[1] / near[0], 0.425, 0.03, "crossing over, the echo is as loud as in the centre");
    // Each time round it is darker: 5 kHz low-pass in the loop.
    bare(device);
    device.set_param(p::kPitch, 2.0f);
    device.set_param(p::kDensity, 20.0f);
    device.set_param(p::kTrail, 1.0f);
    device.set_param(p::kTrailTime, 100.0f);
    rng_state() = 0x51CAu;
    run(device, noise(1.0f, kRate, 0.3f));
    Stereo ringing = render(device, 4.0f, kRate);
    const double early = energy_above(ringing.left, 4000.0, kRate, 24000, 48000);
    const double late = energy_above(ringing.left, 4000.0, kRate, 96000, 144000);
    EXPECT(rms(ringing.left, 96000, 144000) > 1.0e-4 && late < 0.7 * early,
           "the trail loses its top on every repeat");
    EXPECT(rt60(ringing.left, kRate, 0.6) > 2.0, "Trail 1 rings on for seconds");
  }

  // --- Sparkle: thins the body of a spark and gives a little of it back in level.
  {
    double low[2], high[2];
    for (int which = 0; which < 2; ++which) {
      bare(device);
      device.set_param(p::kPitch, 0.0f);
      device.set_param(p::kDensity, 10.0f);
      device.set_param(p::kSparkle, which == 0 ? 0.0f : 1.0f);
      std::vector<float> input = sine(150.0f, 20.0f, kRate, 0.2f);
      const std::vector<float> top = sine(3000.0f, 20.0f, kRate, 0.02f);
      for (size_t i = 0; i < input.size(); ++i) input[i] += top[i];
      Stereo out = run(device, input);
      low[which] = band(out.left, 300.0, 48000);
      high[which] = band(out.left, 6000.0, 48000);
    }
    EXPECT(db(low[1] / low[0]) < -25.0, "Sparkle 1 takes the body out of a spark: 300 Hz falls by 25 dB or more");
    EXPECT(db(high[1] / high[0]) > 4.0 && db(high[1] / high[0]) < 6.1,
           "Sparkle 1 gives back 6 dB, less what its high-pass takes at 6 kHz");
  }

  // --- Mix: 0 is the input, sample for sample; 1 has none of it.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kDensity, 40.0f);
    rng_state() = 0xFEEDu;
    std::vector<float> left = noise(3.0f, kRate, 0.5f), right = noise(3.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
    // Too soft for Follow 1 to throw anything: with Mix 1 nothing at all comes out.
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFollow, 1.0f);
    Stereo none = run(device, sine(220.0f, 2.0f, kRate, 0.001f));
    EXPECT(peak(none.left) == 0.0 && peak(none.right) == 0.0, "Mix 1 has none of the dry sound");
  }

  // --- Level: at the defaults no louder than the input, and a full glitter is held.
  {
    device.init(kRate);
    std::vector<float> tone = sine(330.0f, 10.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    EXPECT(db(rms(out.left, 48000) / rms(tone)) < 1.0 && db(rms(out.left, 48000) / rms(tone)) > -4.0,
           "defaults: within a few dB of the input, and not louder");
    EXPECT(peak(out.left) < 1.0 && peak(out.right) < 1.0, "defaults: a spark on top of the sound peaks under 6 dB over it");
    // Density and Size at the top, all wet: about as loud as one spark after another, not twelve.
    bare(device);
    device.set_param(p::kDensity, 3.0f);
    device.set_param(p::kSize, 300.0f);
    Stereo sparse = run(device, sine(330.0f, 20.0f, kRate, 0.3f));
    bare(device);
    device.set_param(p::kDensity, 40.0f);
    device.set_param(p::kSize, 300.0f);
    Stereo dense = run(device, sine(330.0f, 20.0f, kRate, 0.3f));
    const double denser = db(rms(dense.left, 48000) / rms(sparse.left, 48000));
    EXPECT(denser > -3.0 && denser < 4.0,
           "thirteen times the sparks is within a few dB as loud: overlapping sparks are turned down");
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kDensity, 40.0f);
    device.set_param(p::kSize, 300.0f);
    device.set_param(p::kSparkle, 1.0f);
    device.set_param(p::kTrail, 1.0f);
    device.set_param(p::kFollow, 0.0f);
    rng_state() = 0xB16u;
    Stereo loud = run(device, noise(10.0f, kRate, 1.0f));
    EXPECT(finite(loud.left) && finite(loud.right) && peak(loud.left) <= 2.0 && peak(loud.right) <= 2.0,
           "full-scale noise, everything up: the wet side never passes 2");
  }

  // --- No clicks: a control moved while sparks sound arrives gradually.
  {
    const std::vector<float> tone = sine(330.0f, 2.0f, kRate, 0.4f);
    auto dense = [](Glints& d) {
      d.init(kRate);
      d.set_param(p::kDensity, 40.0f);
      d.set_param(p::kSize, 150.0f);
      d.set_param(p::kFollow, 0.0f);
      d.set_param(p::kTrail, 0.6f);
      d.set_param(p::kMix, 0.5f);
    };
    const double mix_up = suddenness(dense, [](Glints& d) { d.set_param(p::kMix, 1.0f); }, tone);
    const double mix_down = suddenness(dense, [](Glints& d) { d.set_param(p::kMix, 0.0f); }, tone);
    EXPECT(mix_up < 0.15 && mix_down < 0.15, "Mix moved from 0.5 to either end arrives gradually");
    const double pitch = suddenness(dense, [](Glints& d) { d.set_param(p::kPitch, 0.0f); }, tone);
    const double pitch_up = suddenness(dense, [](Glints& d) { d.set_param(p::kPitch, 4.0f); }, tone);
    EXPECT(pitch < 0.15 && pitch_up < 0.15, "a Pitch choice changes with the next sparks, not under these");
    const double sparkle = suddenness(dense, [](Glints& d) { d.set_param(p::kSparkle, 1.0f); }, tone);
    const double sparkle_down = suddenness(dense, [](Glints& d) { d.set_param(p::kSparkle, 0.0f); }, tone);
    EXPECT(sparkle < 0.15 && sparkle_down < 0.15, "Sparkle moved end to end arrives gradually");
    const double trail = suddenness(dense, [](Glints& d) { d.set_param(p::kTrail, 0.0f); }, tone);
    const double trail_time = suddenness(dense, [](Glints& d) { d.set_param(p::kTrailTime, 40.0f); }, tone);
    EXPECT(trail < 0.15 && trail_time < 0.15, "Trail and Trail Time moved arrive gradually");
    const double others = std::max(
        std::max(suddenness(dense, [](Glints& d) { d.set_param(p::kSize, 8.0f); }, tone),
                 suddenness(dense, [](Glints& d) { d.set_param(p::kDensity, 0.2f); }, tone)),
        std::max(suddenness(dense, [](Glints& d) { d.set_param(p::kSpread, 0.0f); }, tone),
                 suddenness(dense, [](Glints& d) { d.set_param(p::kScatter, 2000.0f); }, tone)));
    EXPECT(others < 0.15, "Size, Density, Spread and Scatter change with the next sparks, not under these");
  }

  // --- Bad input: NaN, infinity and runaway samples go by on the dry side while they last and
  // leave nothing behind: not in the rings, not in the level that sets the pace, not in the trail.
  {
    std::vector<float> bad = sine(330.0f, 0.3f, kRate, 0.3f);
    for (size_t i = 0; i < bad.size(); i += 3) bad[i] = std::nanf("");
    for (size_t i = 1; i < bad.size(); i += 7) bad[i] = INFINITY;
    for (size_t i = 2; i < bad.size(); i += 11) bad[i] = -INFINITY;
    for (size_t i = 5; i < bad.size(); i += 13) bad[i] = 1.0e30f;
    for (float mix : {1.0f, 0.4f}) {
      device.init(kRate);
      device.set_param(p::kMix, mix);
      device.set_param(p::kDensity, 20.0f);
      device.set_param(p::kFollow, 0.5f);
      device.set_param(p::kTrail, 0.8f);
      run(device, sine(330.0f, 1.0f, kRate, 0.3f));
      run(device, bad);
      const double before = device.meter(0);
      Stereo after = run(device, sine(330.0f, 3.0f, kRate, 0.3f));
      EXPECT(finite(after.left) && finite(after.right), "good input after bad: finite from its first sample");
      EXPECT(peak(after.left) < 1.2 && peak(after.right) < 1.2, "good input after bad: nothing runaway was kept");
      EXPECT(device.meter(0) - before > 20.0 && rms(after.left, 48000) > 0.003,
             "good input after bad: sparks are thrown as before");
      EXPECT(std::isfinite(device.meter(1)) && device.meter(1) > 5.0 && device.meter(1) <= 20.0,
             "good input after bad: the level that sets the pace has recovered");
      render(device, 40.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and it falls asleep after its trail");
    }
    // Bad samples and nothing else, from a fresh start.
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, std::vector<float>(4800, std::nanf("")));
    run(device, std::vector<float>(4800, INFINITY));
    run(device, std::vector<float>(4800, 1.0e30f));
    Stereo sound = run(device, sine(330.0f, 3.0f, kRate, 0.3f));
    EXPECT(finite(sound.left) && finite(sound.right) && peak(sound.left) < 1.2 && rms(sound.left, 24000) > 0.001,
           "after nothing but bad samples the sparks are of the sound that follows");
  }

  // --- Seeded, and the same at any block size, across a silence too. The first sound after the
  // device has nothing left to throw starts it from one known state.
  {
    auto phrase = [](float gap) {
      std::vector<float> input = sine(330.0f, 0.6f, kRate, 0.3f);
      const std::vector<float> rest = silence(gap, kRate);
      input.insert(input.end(), rest.begin(), rest.end());
      const std::vector<float> again = sine(392.0f, 1.2f, kRate, 0.3f);
      input.insert(input.end(), again.begin(), again.end());
      return input;
    };
    // Rendered in blocks of `block`, with knobs moved in the silence, 5 ms before the sound comes back.
    auto play = [](Glints& d, const std::vector<float>& input, float gap, int block) {
      d.init(kRate);
      d.set_param(p::kDensity, 20.0f);
      d.set_param(p::kTrail, 0.4f);
      d.set_param(p::kMix, 0.3f);
      const size_t turn = static_cast<size_t>((0.6f + gap - 0.005f) * kRate);
      const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
      Stereo out;
      out.left.resize(input.size());
      out.right.resize(input.size());
      size_t done = 0;
      int which = 0;
      bool turned = false;
      while (done < input.size()) {
        if (!turned && done >= turn) {
          d.set_param(p::kMix, 0.9f);
          d.set_param(p::kPitch, 4.0f);
          d.set_param(p::kSparkle, 0.9f);
          d.set_param(p::kTrailTime, 90.0f);
          turned = true;
        }
        size_t frames = block > 0 ? block : ragged[which++ % 8];
        frames = std::min(frames, input.size() - done);
        if (!turned) frames = std::min(frames, turn - done);
        for (size_t i = 0; i < frames; ++i) d.in_left()[i] = d.in_right()[i] = input[done + i];
        d.process(static_cast<int>(frames));
        for (size_t i = 0; i < frames; ++i) {
          out.left[done + i] = d.out_left()[i];
          out.right[done + i] = d.out_right()[i];
        }
        done += frames;
      }
      return out;
    };
    double worst = 0.0;
    // Nothing is thrown 4.5 s after the sound (by then the trail is long under the idle floor) and
    // the hold is a second: asleep 5.5 s into the silence, a block sooner or later. Step across it,
    // and across the 4.5 s themselves.
    std::vector<float> gaps;
    for (float gap = 5.38f; gap < 5.65f; gap += 0.02f) gaps.push_back(gap);
    gaps.push_back(3.0f);
    gaps.push_back(4.49f);
    gaps.push_back(4.51f);
    gaps.push_back(12.0f);
    for (float gap : gaps) {
      const std::vector<float> input = phrase(gap);
      const Stereo reference = play(device, input, gap, 128);
      for (int block : {1, 2048, 0}) {
        const Stereo out = play(other, input, gap, block);
        for (size_t i = 0; i < input.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
        }
      }
    }
    char label[120];
    std::snprintf(label, sizeof label, "blocks of 1, 128, 2048 and ragged give the same sound across a silence (max diff %g)",
                  worst);
    EXPECT(worst < 1.0e-6, label);

    // A knob moved in the silence is there from the first sample, not gliding in under it: the
    // same as a device that was set that way from the start.
    {
      const float gap = 9.0f;
      const std::vector<float> input = phrase(gap);
      const Stereo moved = play(device, input, gap, 128);
      other.init(kRate);
      other.set_param(p::kDensity, 20.0f);
      other.set_param(p::kTrail, 0.4f);
      other.set_param(p::kMix, 0.9f);
      other.set_param(p::kPitch, 4.0f);
      other.set_param(p::kSparkle, 0.9f);
      other.set_param(p::kTrailTime, 90.0f);
      const std::vector<float> again = sine(392.0f, 1.2f, kRate, 0.3f);
      const Stereo fresh = run(other, again);
      const size_t start = input.size() - again.size();
      double apart = 0.0;
      for (size_t i = 0; i < again.size(); ++i) {
        apart = std::max(apart, std::fabs(static_cast<double>(moved.left[start + i]) - fresh.left[i]));
      }
      std::snprintf(label, sizeof label,
                    "after a long silence the device is as if new: knobs moved meanwhile have arrived (max diff %g)", apart);
      EXPECT(apart < 1.0e-6, label);
    }
  }

  // --- The trail rings on whatever Mix lets through: with Mix at 0 it is not put to sleep under
  // the dry silence and found again, stopped where it was, when Mix comes back.
  {
    for (Glints* d : {&device, &other}) {
      d->init(kRate);
      d->set_param(p::kDensity, 20.0f);
      d->set_param(p::kTrail, 1.0f);
      d->set_param(p::kTrailTime, 500.0f);
      d->set_param(p::kMix, d == &device ? 0.0f : 1.0f);
      run(*d, sine(330.0f, 0.5f, kRate, 0.3f));
      render(*d, 7.5f, kRate);
    }
    device.set_param(p::kMix, 1.0f);
    Stereo back = render(device, 1.0f, kRate);
    Stereo all_along = render(other, 1.0f, kRate);
    double apart = 0.0;
    for (size_t i = 2400; i < back.left.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(back.left[i]) - all_along.left[i]));
    }
    EXPECT(rms(all_along.left) > 1.0e-4 && apart < 1.0e-6,
           "Mix back up after 8 s at 0: the trail is where it would have been");
  }

  // --- Asleep after the tail, awake on new sound.
  {
    device.init(kRate);
    run(device, sine(330.0f, 0.5f, kRate, 0.3f));
    render(device, 9.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    EXPECT(device.meter(1) == 0.0, "asleep: the reported pace is none");
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFollow, 0.0f);
    device.set_param(p::kDensity, 20.0f);
    Stereo woken = run(device, sine(330.0f, 1.0f, kRate, 0.3f));
    EXPECT(rms(woken.left, 12000) > 0.005, "wakes on new sound");
  }

  // --- Other sample rates: the same pitch, the same length, the same pace.
  for (float rate : {44100.0f, 96000.0f}) {
    bare(device, rate);
    device.set_param(p::kPitch, 1.0f);
    device.set_param(p::kDensity, 5.0f);
    device.set_param(p::kSize, 100.0f);
    Stereo out = run(device, sine(500.0f, 30.0f, rate, 0.3f));
    char label[96];
    const double found = dominant_frequency(out.left, rate, 300.0, 4000.0, static_cast<size_t>(rate),
                                            static_cast<size_t>(5 * rate));
    std::snprintf(label, sizeof label, "%g Hz: Octave and fifth of 500 Hz is 1500 Hz (found %.1f)", rate, found);
    EXPECT(std::fabs(found - 1500.0) < 15.0, label);
    std::snprintf(label, sizeof label, "%g Hz: Density 5 throws %g sparks in 30 s", rate, device.meter(0));
    EXPECT(std::fabs(device.meter(0) - 150.0) < 30.0, label);
    EXPECT_NEAR(told(device).late, 0.2 + (93.0 + 48.0) / rate, 0.0021, "x3 of 100 ms is 200 ms late at any rate");
  }

  // --- Cost, at the defaults and at the worst setting: forty sparks a second of 300 ms each
  // (twelve sounding at once), every one at three times the speed, which reads through the 16-tap
  // kernel, with the trail.
  device.init(kRate);
  std::vector<float> input = sine(330.0f, 10.0f, kRate, 0.3f);
  report_cost("glints", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kDensity, 40.0f);
  device.set_param(p::kSize, 300.0f);
  device.set_param(p::kPitch, 1.0f);
  device.set_param(p::kFollow, 0.0f);
  device.set_param(p::kTrail, 1.0f);
  report_cost("glints, worst setting", 10.0f, kRate, [&] { run(device, input); });

  return finish("glints");
}
