// Native harness for Coloured Noise (cpp/devices/coloured-noise). The
// conformance pass covers silence before and after notes, a pile of keys,
// parameter abuse and other sample rates. The rest measures what makes it
// this device: the slope Colour names, the cuts, one bed whatever the number
// of keys, the band Tint puts at each key, the Width law, the drift, and that
// nothing it plays depends on the block size, on a silence or on when a knob
// was moved. The noise itself (the generator and the colour filter) is proved
// in cpp/test/colour_test.cpp.

#include <ctime>

#include "../devices/coloured-noise/coloured_noise.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ColouredNoise;
namespace p = livemix::coloured_noise;
namespace kit = livemix::kit;

static ColouredNoise device;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// --- measuring ---------------------------------------------------------------------------------

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

// The largest difference between two renders, either side.
static double apart(const Stereo& a, const Stereo& b) {
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static void fft(std::vector<double>& re, std::vector<double>& im) {
  const size_t n = re.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      std::swap(re[i], re[j]);
      std::swap(im[i], im[j]);
    }
  }
  for (size_t size = 2; size <= n; size <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(size);
    const double wr = std::cos(angle), wi = std::sin(angle);
    for (size_t start = 0; start < n; start += size) {
      double cr = 1.0, ci = 0.0;
      for (size_t k = 0; k < size / 2; ++k) {
        const size_t a = start + k, b = a + size / 2;
        const double tr = re[b] * cr - im[b] * ci;
        const double ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const double next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
}

// The power of `x` from `from` on, bin by bin: Hann frames of `size` half
// overlapped and averaged, scaled so that the bins of a band add up to the
// mean square the signal has in that band, whatever the size and the rate.
static std::vector<double> spectrum(const std::vector<float>& x, size_t from = 0, size_t size = 16384) {
  std::vector<double> power(size / 2, 0.0), re(size), im(size), window(size);
  double window_power = 0.0;
  for (size_t i = 0; i < size; ++i) {
    window[i] = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(size));
    window_power += window[i] * window[i];
  }
  size_t frames = 0;
  for (size_t start = from; start + size <= x.size(); start += size / 2) {
    for (size_t i = 0; i < size; ++i) {
      re[i] = window[i] * x[start + i];
      im[i] = 0.0;
    }
    fft(re, im);
    for (size_t k = 1; k < size / 2; ++k) power[k] += re[k] * re[k] + im[k] * im[k];
    ++frames;
  }
  const double scale = frames > 0 ? 2.0 / (static_cast<double>(frames) * static_cast<double>(size) * window_power) : 0.0;
  for (double& value : power) value *= scale;
  return power;
}

// The mean square between `lo` and `hi` hertz, in dB.
static double band_db(const std::vector<double>& power, double rate, double lo, double hi) {
  const double bin = rate / static_cast<double>(2 * power.size());
  double sum = 0.0;
  for (size_t k = 1; k < power.size(); ++k) {
    const double hz = static_cast<double>(k) * bin;
    if (hz >= lo && hz < hi) sum += power[k];
  }
  return 10.0 * std::log10(std::max(sum, 1.0e-30));
}

// The slope of a spectrum in dB an octave: a line through the level in each
// hertz of the six octaves from 100 Hz to 6.4 kHz.
static double slope_per_octave(const std::vector<double>& power, double rate) {
  double n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (int octave = 0; octave < 6; ++octave) {
    const double lo = 100.0 * std::pow(2.0, octave);
    const double density = band_db(power, rate, lo, 2.0 * lo) - 10.0 * std::log10(lo);
    n += 1;
    sx += octave;
    sy += density;
    sxx += octave * octave;
    sxy += octave * density;
  }
  return (n * sxy - sx * sy) / (n * sxx - sx * sx);
}

// The RMS of the loudest 400 ms, as the preset bench reads a level.
static double loudest_400ms(const std::vector<float>& x, double rate) {
  const size_t hop = at(0.4, rate);
  double loudest = 0.0;
  for (size_t start = 0; start + hop <= x.size(); start += hop) loudest = std::max(loudest, rms(x, start, start + hop));
  return loudest;
}

// --- driving -----------------------------------------------------------------------------------

static Stereo render_ragged(ColouredNoise& d, float seconds, float rate = kRate) {
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

// Block 0 is the ragged mix.
static Stereo render_blocks(ColouredNoise& d, float seconds, int block, float rate = kRate) {
  return block > 0 ? render(d, seconds, rate, block) : render_ragged(d, seconds, rate);
}

// A steady bed: no drift, a quick envelope, unlike noise on the two sides, and
// a Volume that keeps every peak under the soft clip's knee, so one side
// reads the kit's own RMS less 12 dB (kFull) and nothing measured is bent.
static const float kSteadyDb = -12.0f;
static const double kFull = 20.0 * std::log10(static_cast<double>(kit::kColourRms)) + kSteadyDb;

static void steady(ColouredNoise& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kVolume, kSteadyDb);
}

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight moments
// 0.31 s apart, which with the swells `setup` asks for (2 s on average) are
// eight places in the drift.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 0.5f + 0.31f * static_cast<float>(trial), kRate);
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

static void test_colour();
static void test_cuts();
static void test_keys();
static void test_tint();
static void test_width();
static void test_drift();
static void test_envelope();
static void test_sleep();
static void test_clicks();
static void test_voices();
static void test_levels();
static void test_rates();

int main() {
  Conformance spec;
  spec.name = "coloured-noise";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;  // a release of 4 s is silent after 6.7 s
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_colour();
  test_cuts();
  test_keys();
  test_tint();
  test_width();
  test_drift();
  test_envelope();
  test_sleep();
  test_clicks();
  test_voices();
  test_levels();
  test_rates();

  // Cost, as CPU time (the machine is shared): the default patch on one key,
  // then every voice with a band of its own and the drift at work.
  for (int load = 0; load < 2; ++load) {
    device.init(kRate);
    if (load == 1) {
      device.set_param(p::kTint, 1.0f);
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kDriftTime, 2.0f);
      device.set_param(p::kLowCut, 100.0f);
      device.set_param(p::kHighCut, 8000.0f);
    }
    for (int n = 0; n < (load == 1 ? ColouredNoise::kMaxVoices : 1); ++n) {
      device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 0.8f);
    }
    const char* label = load == 1 ? "coloured-noise, ten keys with Tint" : "coloured-noise, one key at the defaults";
    const std::clock_t before = std::clock();
    report_cost(label, 20.0f, kRate, [] { render(device, 20.0f, kRate); });
    const double cpu = static_cast<double>(std::clock() - before) / CLOCKS_PER_SEC;
    std::printf("%s: %.2f%% of real time at 48 kHz by CPU time (native)\n", label, 100.0 * cpu / 20.0);
  }
  return finish("coloured-noise");
}

// --- colour ------------------------------------------------------------------------------------

static void test_colour() {
  char label[200];
  // White, pink and brown by their slope, each side, at the three rates; and
  // one RMS for all of them, the kit's, which is also one level in each hertz
  // at every rate.
  double level[3][3], mid_band[3][3];
  for (int r = 0; r < 3; ++r) {
    const float rate = kRates[r];
    for (int c = 0; c < 3; ++c) {
      steady(device, rate);
      device.set_param(p::kColour, 0.5f * static_cast<float>(c));
      device.note_on(1, 220.0f, 1.0f);
      Stereo out = render(device, 20.5f, rate);
      const size_t from = at(0.5, rate);
      const std::vector<double> left = spectrum(out.left, from), right = spectrum(out.right, from);
      const double slope_left = slope_per_octave(left, rate), slope_right = slope_per_octave(right, rate);
      level[r][c] = db(rms(out.left, from));
      mid_band[r][c] = band_db(left, rate, 500.0, 1000.0);
      std::printf("  colour %.1f at %.1f kHz: %.2f and %.2f dB an octave, RMS %.2f dBFS, 500 Hz to 1 kHz %.2f dB\n",
                  0.5 * c, rate / 1000.0, slope_left, slope_right, level[r][c], mid_band[r][c]);
      std::snprintf(label, sizeof label, "Colour %.1f falls by %.0f dB an octave at %.1f kHz", 0.5 * c, 6.0 * 0.5 * c,
                    rate / 1000.0);
      EXPECT_NEAR(slope_left, -6.0 * 0.5 * c, 0.5, label);
      EXPECT_NEAR(slope_right, -6.0 * 0.5 * c, 0.5, label);
      std::snprintf(label, sizeof label, "Colour %.1f plays at the kit's RMS at %.1f kHz", 0.5 * c, rate / 1000.0);
      EXPECT_NEAR(level[r][c], kFull, 0.5, label);
    }
  }
  for (int c = 0; c < 3; ++c) {
    std::snprintf(label, sizeof label, "Colour %.1f has one level in each hertz at 44.1, 48 and 96 kHz", 0.5 * c);
    EXPECT(std::fabs(mid_band[0][c] - mid_band[1][c]) < 1.0 && std::fabs(mid_band[2][c] - mid_band[1][c]) < 1.0, label);
  }

  // What the preset bench reads: the loudest 400 ms of the mid in 8 seconds.
  // Brown has few independent moments in 400 ms, so its loudest stretch
  // stands further over its own RMS than white's does.
  double loudest[3];
  for (int c = 0; c < 3; ++c) {
    steady(device);
    device.set_param(p::kColour, 0.5f * static_cast<float>(c));
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 8.0f, kRate);
    loudest[c] = db(loudest_400ms(mid(out), kRate));
  }
  std::printf("  loudest 400 ms of the mid in 8 s: white %.2f, pink %.2f, brown %.2f dBFS\n", loudest[0], loudest[1],
              loudest[2]);
  const double spread = std::max(loudest[0], std::max(loudest[1], loudest[2])) -
                        std::min(loudest[0], std::min(loudest[1], loudest[2]));
  EXPECT(spread < 1.0, "the loudest 400 ms is within 1 dB across Colour");

  // Brown for 8 seconds leaves no offset on either side.
  {
    device.init(kRate);
    device.set_param(p::kColour, 1.0f);
    device.set_param(p::kVolume, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 8.0f, kRate);
    std::printf("  brown for 8 s: mean %.5f left, %.5f right\n", mean(out.left), mean(out.right));
    EXPECT(std::fabs(mean(out.left)) < 0.01 && std::fabs(mean(out.right)) < 0.01,
           "brown noise has a mean under 0.01 on each side over 8 seconds");
    EXPECT(rms(out.left, at(4.0)) > 0.05, "(and it is sounding)");
  }
}

// --- the cuts ----------------------------------------------------------------------------------

// The spectrum of one side of a steady white bed with the cuts as given.
static std::vector<double> cut_spectrum(float low_cut, float high_cut, float rate) {
  steady(device, rate);
  device.set_param(p::kColour, 0.0f);
  device.set_param(p::kLowCut, low_cut);
  device.set_param(p::kHighCut, high_cut);
  device.note_on(1, 220.0f, 1.0f);
  Stereo out = render(device, 20.5f, rate);
  return spectrum(out.left, at(0.5, rate));
}

static void test_cuts() {
  char label[200];
  for (float rate : kRates) {
    const std::vector<double> open = cut_spectrum(20.0f, 20000.0f, rate);
    const std::vector<double> cut = cut_spectrum(200.0f, 2000.0f, rate);
    auto change = [&](double lo, double hi) { return band_db(cut, rate, lo, hi) - band_db(open, rate, lo, hi); };
    const double below = change(50.0, 100.0), above = change(4000.0, 8000.0), inside = change(400.0, 1000.0);
    const double at_low = change(190.0, 210.0), at_high = change(1900.0, 2100.0);
    const double octave_under = change(95.0, 105.0), octave_over = change(3800.0, 4200.0);
    std::printf("  cuts 200 Hz and 2 kHz at %.1f kHz: 50 to 100 Hz %.1f dB, 4 to 8 kHz %.1f dB, 400 Hz to 1 kHz %.2f dB;"
                " at the cuts %.1f and %.1f dB, an octave out %.1f and %.1f dB\n",
                rate / 1000.0, below, above, inside, at_low, at_high, octave_under, octave_over);
    std::snprintf(label, sizeof label, "the bands outside the cuts are at least 12 dB down at %.1f kHz", rate / 1000.0);
    EXPECT(below < -12.0 && above < -12.0, label);
    std::snprintf(label, sizeof label, "the band between the cuts is untouched at %.1f kHz", rate / 1000.0);
    EXPECT(std::fabs(inside) < 1.0, label);
    std::snprintf(label, sizeof label, "each cut is 3 dB down at its own pitch at %.1f kHz", rate / 1000.0);
    EXPECT_NEAR(at_low, -3.0, 1.5, label);
    EXPECT_NEAR(at_high, -3.0, 1.5, label);
    std::snprintf(label, sizeof label, "each cut falls by 24 dB an octave at %.1f kHz", rate / 1000.0);
    EXPECT(octave_under < -20.0 && octave_over < -20.0, label);
  }
  // The cuts follow their knobs.
  {
    const std::vector<double> open = cut_spectrum(20.0f, 20000.0f, kRate);
    const std::vector<double> high = cut_spectrum(800.0f, 20000.0f, kRate);
    const std::vector<double> low = cut_spectrum(20.0f, 500.0f, kRate);
    const double under = band_db(high, kRate, 200.0, 400.0) - band_db(open, kRate, 200.0, 400.0);
    const double over = band_db(low, kRate, 1000.0, 2000.0) - band_db(open, kRate, 1000.0, 2000.0);
    std::printf("  low cut at 800 Hz: 200 to 400 Hz %.1f dB; high cut at 500 Hz: 1 to 2 kHz %.1f dB\n", under, over);
    EXPECT(under < -12.0 && over < -12.0, "a cut moved to another pitch cuts there");
    // Wide open, the cuts leave the colour's own slope alone.
    EXPECT(std::fabs(band_db(open, kRate, 100.0, 200.0) - band_db(open, kRate, 3200.0, 6400.0) + 10.0 * std::log10(32.0)) < 0.5,
           "wide open, the cuts leave white noise flat from 100 Hz to 6.4 kHz");
  }
}

// --- one bed, however many keys ----------------------------------------------------------------

// The RMS of the left side, in dB, of whatever `keys` plays on a steady bed.
template <typename Keys>
static double bed_level(Keys keys, float from = 0.5f, float seconds = 2.5f) {
  steady(device);
  keys(device);
  Stereo out = render(device, seconds, kRate);
  return db(rms(out.left, at(from)));
}

static void test_keys() {
  const double one = bed_level([](ColouredNoise& d) { d.note_on(1, 220.0f, 1.0f); });
  const double ten = bed_level([](ColouredNoise& d) {
    for (int n = 0; n < 10; ++n) d.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 1.0f);
  });
  std::printf("  one key %.2f dBFS, ten keys %.2f dBFS\n", one, ten);
  EXPECT_NEAR(one, kFull, 0.5, "one key at full gain opens the bed at the kit's RMS");
  EXPECT(std::fabs(ten - one) < 0.5, "ten keys are as loud as one");

  // The bed's level is the loudest open key's: a key's gain is its level, a
  // softer key beside a louder one adds nothing, and when the louder one is
  // let go the bed comes down to the softer.
  const double soft = bed_level([](ColouredNoise& d) { d.note_on(1, 220.0f, 0.5f); });
  const double both = bed_level([](ColouredNoise& d) {
    d.note_on(1, 220.0f, 1.0f);
    d.note_on(2, 330.0f, 0.5f);
  });
  steady(device);
  device.note_on(1, 220.0f, 1.0f);
  device.note_on(2, 330.0f, 0.5f);
  render(device, 0.5f, kRate);
  device.note_off(1);
  Stereo after = render(device, 2.5f, kRate);
  const double left = db(rms(after.left, at(0.5)));
  std::printf("  a key at gain 0.5: %.2f dB under full; with a full key beside it %.2f dB; the full key let go %.2f dB\n",
              soft - one, both - one, left - one);
  EXPECT_NEAR(soft - one, -6.02, 0.3, "a key's gain is the bed's level");
  EXPECT(std::fabs(both - one) < 0.2, "a softer key beside a louder one adds nothing");
  EXPECT_NEAR(left - one, -6.02, 0.3, "when the louder key is let go the bed comes down to the softer one");
}

// --- tint --------------------------------------------------------------------------------------

// The spectrum of the left side of a steady pink bed with `keys` held.
template <typename Keys>
static std::vector<double> tint_spectrum(float tint, Keys keys, float rate = kRate, float seconds = 20.5f,
                                         size_t size = 16384) {
  steady(device, rate);
  device.set_param(p::kTint, tint);
  keys(device);
  Stereo out = render(device, seconds, rate);
  return spectrum(out.left, at(0.5, rate), size);
}

static void test_tint() {
  char label[200];
  const float chord[3] = {220.0f, 554.37f, 1318.5f};
  auto play_chord = [&](ColouredNoise& d) {
    for (int n = 0; n < 3; ++n) d.note_on(n, chord[n], 1.0f);
  };
  const std::vector<double> bare = tint_spectrum(0.0f, play_chord);
  const std::vector<double> full = tint_spectrum(1.0f, play_chord);
  auto rise = [&](const std::vector<double>& with, const std::vector<double>& without, double hz, double span,
                  double rate = kRate) {
    return band_db(with, rate, hz / span, hz * span) - band_db(without, rate, hz / span, hz * span);
  };
  for (float hz : chord) {
    const double peak = rise(full, bare, hz, 1.02);
    std::snprintf(label, sizeof label, "at Tint 1 a peak stands at the held key of %.0f Hz (%.1f dB over the bed)", hz, peak);
    EXPECT(peak > 6.0, label);
  }
  // Between the keys the bed is as it was.
  for (double hz : {350.0, 850.0, 3000.0}) {
    const double change = rise(full, bare, hz, 1.06);
    std::snprintf(label, sizeof label, "between the keys, at %.0f Hz, the bed is as it was (%.2f dB)", hz, change);
    EXPECT(std::fabs(change) < 1.5, label);
  }

  // One key: how high the peak stands, that half the knob is less of it, and
  // that the whole sound is not much louder for it.
  auto one_key = [](ColouredNoise& d) { d.note_on(1, 440.0f, 1.0f); };
  const std::vector<double> none = tint_spectrum(0.0f, one_key);
  const std::vector<double> half = tint_spectrum(0.5f, one_key);
  const std::vector<double> whole = tint_spectrum(1.0f, one_key);
  const double peak_half = rise(half, none, 440.0, 1.015), peak_whole = rise(whole, none, 440.0, 1.015);
  const double louder = band_db(whole, kRate, 20.0, 20000.0) - band_db(none, kRate, 20.0, 20000.0);
  std::printf("  one key at 440 Hz: the peak stands %.1f dB over the bed at Tint 0.5 and %.1f dB at Tint 1;"
              " the whole is %.2f dB louder at Tint 1\n", peak_half, peak_whole, louder);
  // (1 + 4.6) is 15.0 dB and (1 + 2.3) is 10.4 dB at the key itself; the 1.5 % either side read a little under that.
  EXPECT_NEAR(peak_whole, 14.7, 1.0, "one key's peak stands 15 dB over the bed at Tint 1");
  EXPECT_NEAR(peak_half, 10.1, 1.0, "and 10 dB at Tint 0.5");
  EXPECT_NEAR(louder, 1.95, 0.5, "Tint 1 on one key makes pink noise 2 dB louder");
  EXPECT(rise(none, tint_spectrum(0.0f, [](ColouredNoise& d) { d.note_on(1, 880.0f, 1.0f); }), 440.0, 1.015) == 0.0,
         "at Tint 0 the key played changes nothing");

  // Ten keys share what one key has: the level does not grow with them, and
  // each still has a peak.
  auto ten_keys = [](ColouredNoise& d) {
    for (int n = 0; n < 10; ++n) d.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 1.0f);
  };
  const std::vector<double> ten_bare = tint_spectrum(0.0f, ten_keys);
  const std::vector<double> ten = tint_spectrum(1.0f, ten_keys);
  const double ten_louder = band_db(ten, kRate, 20.0, 20000.0) - band_db(ten_bare, kRate, 20.0, 20000.0);
  double lowest_peak = 1.0e9;
  for (int n = 0; n < 10; ++n) {
    lowest_peak = std::min(lowest_peak, rise(ten, ten_bare, 110.0 * std::pow(2.0, n * 5.0 / 12.0), 1.02));
  }
  std::printf("  ten keys at Tint 1: %.2f dB louder than at Tint 0, the lowest of the ten peaks %.1f dB over the bed\n",
              ten_louder, lowest_peak);
  EXPECT(std::fabs(ten_louder - louder) < 0.5, "ten keys at Tint 1 are as loud as one");
  // Each of ten equal keys adds sqrt(1 + 30.36 / 10) - 1 = 1.01 of its band: 6.1 dB at the key.
  EXPECT(lowest_peak > 4.5 && lowest_peak < 7.5, "and each of the ten has its peak, 6 dB over the bed");

  // The band is on the key at the bottom, in the middle and near the top of
  // the range, at each rate. With and without Tint the noise is the same
  // noise, so the power Tint adds is read bin by bin; its centre (by the
  // logarithm of the frequency, over a sixth either side) is the key, and
  // the level in each hertz within a semitone of the key stands over the
  // level a third either side.
  for (float rate : kRates) {
    for (float hz : {27.5f, 440.0f, 3520.0f}) {
      const bool low = hz < 100.0f;
      const float seconds = low ? 90.5f : 20.5f;
      const size_t size = low ? 131072 : 16384;
      auto key = [hz](ColouredNoise& d) { d.note_on(1, hz, 1.0f); };
      const std::vector<double> without = tint_spectrum(0.0f, key, rate, seconds, size);
      const std::vector<double> power = tint_spectrum(1.0f, key, rate, seconds, size);
      const double bin = rate / static_cast<double>(size);
      double added = 0.0, weighted = 0.0;
      for (size_t k = 1; k < power.size(); ++k) {
        const double at_hz = static_cast<double>(k) * bin;
        if (at_hz < hz / 1.167 || at_hz > hz * 1.167) continue;
        added += power[k] - without[k];
        weighted += (power[k] - without[k]) * std::log(at_hz);
      }
      const double centre = added > 0.0 ? std::exp(weighted / added) : 0.0;
      auto density = [&](double lo, double hi) { return band_db(power, rate, lo, hi) - 10.0 * std::log10(hi - lo); };
      const double on = density(hz / 1.06, hz * 1.06);
      const double under = density(hz / 1.26, hz / 1.06), over = density(hz * 1.06, hz * 1.26);
      std::snprintf(label, sizeof label, "the band of a key at %.1f Hz is centred on the key at %.1f kHz (at %.2f Hz, %.1f dB over below, %.1f over above)",
                    hz, rate / 1000.0, centre, on - under, on - over);
      std::printf("  %s\n", label);
      EXPECT(std::fabs(centre / hz - 1.0) < 0.01 && on - under > 5.0 && on - over > 5.0, label);
    }
  }
}

// --- width -------------------------------------------------------------------------------------

static Stereo width_render(float width, float tint, float seconds) {
  steady(device);
  device.set_param(p::kWidth, width);
  device.set_param(p::kTint, tint);
  device.note_on(1, 220.0f, 1.0f);
  device.note_on(2, 660.0f, 0.7f);
  return render(device, seconds, kRate);
}

static double side_over_mid(const Stereo& s, size_t from) { return db(rms(side(s), from) / rms(mid(s), from)); }

static void test_width() {
  char label[200];
  const size_t from = at(0.5);
  for (float tint : {0.0f, 1.0f}) {
    Stereo narrow = width_render(0.0f, tint, 10.5f);
    Stereo part = width_render(0.8f, tint, 10.5f);
    Stereo wide = width_render(1.0f, tint, 10.5f);
    double differ = 0.0;
    for (size_t i = 0; i < narrow.size(); ++i) {
      differ = std::max(differ, std::fabs(static_cast<double>(narrow.left[i]) - narrow.right[i]));
    }
    std::snprintf(label, sizeof label, "at Width 0 the two sides are the same to the sample at Tint %.0f (apart by %g)", tint, differ);
    EXPECT(differ == 0.0 && rms(narrow.left, from) > 0.02, label);
    const double at_08 = side_over_mid(part, from), at_1 = side_over_mid(wide, from);
    const double together = correlation(wide.left, wide.right, from);
    std::printf("  Tint %.0f: side over mid %.2f dB at Width 0.8 and %.2f dB at Width 1, the sides correlate by %.3f at Width 1;"
                " one side at Width 0 is %.2f dB under one at Width 1\n",
                tint, at_08, at_1, together, db(rms(narrow.left, from) / rms(wide.left, from)));
    std::snprintf(label, sizeof label, "at Width 0.8 side over mid is -1.9 dB at Tint %.0f", tint);
    EXPECT_NEAR(at_08, 20.0 * std::log10(0.8), 0.5, label);
    std::snprintf(label, sizeof label, "at Width 1 the sides are unlike noises, side equal to mid, at Tint %.0f", tint);
    EXPECT(std::fabs(at_1) < 0.5 && std::fabs(together) < 0.05, label);
    // The mono fold is the same sound at every Width.
    const std::vector<float> fold_narrow = mid(narrow), fold_part = mid(part), fold_wide = mid(wide);
    double fold = 0.0;
    for (size_t i = 0; i < fold_narrow.size(); ++i) {
      fold = std::max(fold, std::fabs(static_cast<double>(fold_narrow[i]) - fold_wide[i]));
      fold = std::max(fold, std::fabs(static_cast<double>(fold_part[i]) - fold_wide[i]));
    }
    std::snprintf(label, sizeof label, "the mono fold is the same at Width 0, 0.8 and 1 at Tint %.0f (apart by %g)", tint, fold);
    EXPECT(fold < 1.0e-6, label);
  }
}

// --- drift -------------------------------------------------------------------------------------

// The level of `x` in dB in hops of 50 ms from `from` seconds on.
static std::vector<double> level_track(const std::vector<float>& x, double rate, double from) {
  const size_t hop = at(0.05, rate);
  std::vector<double> out;
  for (size_t start = at(from, rate); start + hop <= x.size(); start += hop) out.push_back(db(rms(x, start, start + hop)));
  return out;
}

// One band of `x`: a fourth-order low pass (below `hz`) or high pass.
static std::vector<float> split(const std::vector<float>& x, bool high, float hz, float rate) {
  kit::Svf first, second;
  first.set(hz, 0.5412f, rate);
  second.set(hz, 1.3066f, rate);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) {
    out[i] = high ? second.highpass(first.highpass(x[i])) : second.lowpass(first.lowpass(x[i]));
  }
  return out;
}

struct Swells {
  std::vector<double> times;   // seconds from the start of the track to each swell's lowest moment
  std::vector<double> depths;  // dB under the crest there
  double crest = -200.0;       // the highest level of the track, dB
};

// The swells of a level track: each stretch that sinks 1.5 dB under the
// crest and comes back to within 0.8 dB of it.
static Swells find_swells(const std::vector<double>& track) {
  Swells out;
  for (double level : track) out.crest = std::max(out.crest, level);
  bool sunk = false;
  double lowest = 0.0, when = 0.0;
  for (size_t i = 0; i < track.size(); ++i) {
    const double under = track[i] - out.crest;
    if (!sunk && under < -1.5) {
      sunk = true;
      lowest = under;
      when = 0.05 * static_cast<double>(i);
    } else if (sunk && under < lowest) {
      lowest = under;
      when = 0.05 * static_cast<double>(i);
    } else if (sunk && under > -0.8) {
      sunk = false;
      out.times.push_back(when);
      out.depths.push_back(lowest);
    }
  }
  return out;
}

// A steady white bed with the drift as given, one side.
static std::vector<float> drift_render(float drift, float drift_time, float seconds, float rate = kRate) {
  steady(device, rate);
  device.set_param(p::kColour, 0.0f);
  device.set_param(p::kDrift, drift);
  device.set_param(p::kDriftTime, drift_time);
  device.note_on(1, 220.0f, 1.0f);
  return render(device, seconds, rate).left;
}

static double mean_gap(const std::vector<double>& times) {
  return times.size() > 1 ? (times.back() - times.front()) / static_cast<double>(times.size() - 1) : 0.0;
}

static void test_drift() {
  const double full = kFull;
  // Drift 0: steady.
  {
    const std::vector<double> track = level_track(drift_render(0.0f, 2.0f, 30.0f), kRate, 0.2);
    const double high = *std::max_element(track.begin(), track.end()), low = *std::min_element(track.begin(), track.end());
    std::printf("  Drift 0: the level stays between %.2f and %.2f dBFS over 30 s\n", low, high);
    EXPECT(high - low < 1.0 && std::fabs(high - full) < 0.6, "at Drift 0 the bed is steady");
  }
  // Drift 1 with swells of 2 s on average.
  const std::vector<float> deep = drift_render(1.0f, 2.0f, 60.5f);
  const std::vector<double> track = level_track(deep, kRate, 0.05);
  const Swells swells = find_swells(track);
  {
    double deepest = 0.0, shallowest = -100.0, longest = 0.0, shortest = 1.0e9;
    for (double depth : swells.depths) {
      deepest = std::min(deepest, depth);
      shallowest = std::max(shallowest, depth);
    }
    for (size_t i = 1; i < swells.times.size(); ++i) {
      longest = std::max(longest, swells.times[i] - swells.times[i - 1]);
      shortest = std::min(shortest, swells.times[i] - swells.times[i - 1]);
    }
    std::printf("  Drift 1, Drift time 2 s: begins at %.2f dBFS, crest %.2f dBFS, %zu swells in 60 s, %.2f s apart on average"
                " (%.2f to %.2f s), %.1f to %.1f dB deep\n",
                track[0], swells.crest, swells.times.size(), mean_gap(swells.times), shortest, longest, shallowest, deepest);
    EXPECT(std::fabs(track[0] - full) < 1.0, "the drift begins at its crest: the first 50 ms are at the full level");
    EXPECT(std::fabs(swells.crest - full) < 0.6, "the crest of a swell is the level the bed has without drift: a swell only sinks");
    EXPECT(deepest < -12.0 && deepest > -16.0, "at Drift 1 the deepest swell of white noise sinks 12 to 16 dB");
    EXPECT_NEAR(mean_gap(swells.times), 2.0, 0.4, "the swells are Drift time long on average");
    EXPECT(swells.times.size() > 20 && longest > 1.5 * shortest, "the swells are unpaced: the longest gap is over half as long again as the shortest");
    EXPECT(shallowest - deepest > 2.0, "the swells are irregular in depth");
  }
  // Brightness: at the lowest moment of the deepest swell the top of the
  // band has sunk further than the bottom.
  EXPECT(!swells.times.empty(), "at Drift 1 there are swells");
  if (!swells.times.empty()) {
    size_t which = 0;
    for (size_t i = 1; i < swells.depths.size(); ++i) {
      if (swells.depths[i] < swells.depths[which]) which = i;
    }
    const std::vector<double> lows = level_track(split(deep, false, 250.0f, kRate), kRate, 0.05);
    const std::vector<double> highs = level_track(split(deep, true, 4000.0f, kRate), kRate, 0.05);
    const std::vector<double> lows_steady = level_track(split(drift_render(0.0f, 2.0f, 10.0f), false, 250.0f, kRate), kRate, 0.05);
    const std::vector<double> highs_steady = level_track(split(drift_render(0.0f, 2.0f, 10.0f), true, 4000.0f, kRate), kRate, 0.05);
    auto average = [](const std::vector<double>& x, size_t from, size_t to) {
      double sum = 0.0;
      for (size_t i = from; i < to; ++i) sum += x[i];
      return sum / static_cast<double>(to - from);
    };
    const size_t middle = std::max<size_t>(1, static_cast<size_t>(swells.times[which] / 0.05));
    const double low_sink = average(lows, middle - 1, middle + 2) - average(lows_steady, 20, lows_steady.size());
    const double high_sink = average(highs, middle - 1, middle + 2) - average(highs_steady, 20, highs_steady.size());
    std::printf("  the deepest swell: under 250 Hz %.1f dB down, over 4 kHz %.1f dB down\n", low_sink, high_sink);
    EXPECT(low_sink < -7.5 && low_sink > -9.6, "the deepest swell at Drift 1 takes the bottom of the band about 9 dB down");
    EXPECT_NEAR(high_sink - low_sink, -6.0, 1.5, "a swell darkens as it sinks: the top falls about 6 dB further than the bottom");
  }
  // Half the depth, and four times the length.
  {
    const Swells half = find_swells(level_track(drift_render(0.5f, 2.0f, 60.5f), kRate, 0.05));
    double deepest = 0.0;
    for (double depth : half.depths) deepest = std::min(deepest, depth);
    const Swells slow = find_swells(level_track(drift_render(1.0f, 8.0f, 160.5f), kRate, 0.05));
    std::printf("  Drift 0.5: the deepest swell %.1f dB; Drift time 8 s: %zu swells in 160 s, %.2f s apart on average\n", deepest,
                slow.times.size(), mean_gap(slow.times));
    EXPECT(deepest < -4.0 && deepest > -7.0, "at Drift 0.5 the deepest swell of white noise sinks 4 to 7 dB");
    EXPECT_NEAR(mean_gap(slow.times), 8.0, 1.6, "Drift time sets how long the swells are");
  }
}

// --- the envelope ------------------------------------------------------------------------------

static void test_envelope() {
  const double full = kFull;
  // Attack: a second to arrive, and part of the way at a quarter of it.
  {
    steady(device);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kAttack, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    const double early = db(rms(out.left, at(0.2), at(0.3))) - full, there = db(rms(out.left, at(1.05), at(1.5))) - full;
    std::printf("  Attack 1 s: %.1f dB at a quarter of a second, %.2f dB after it\n", early, there);
    EXPECT(early < -5.0 && early > -11.0, "an attack of 1 s is 8 dB under at a quarter of a second");
    EXPECT(std::fabs(there) < 0.5, "and has arrived after a second");
  }
  // Release: 60 dB in the time set, then exact silence.
  {
    steady(device);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 4.5f, kRate);
    const double half = db(rms(tail.left, at(0.95), at(1.05))) - full, quarter = db(rms(tail.left, at(0.45), at(0.55))) - full;
    std::printf("  Release 2 s: %.1f dB after half a second, %.1f dB after a second\n", quarter, half);
    EXPECT_NEAR(quarter, -15.0, 1.5, "a release of 2 s is 15 dB down after half a second");
    EXPECT_NEAR(half, -30.0, 1.5, "and 30 dB down after a second");
    EXPECT(peak(tail.left, at(3.6)) == 0.0 && peak(tail.right, at(3.6)) == 0.0, "exact zero once the release has ended");
    EXPECT(peak(tail.left, at(3.0), at(3.2)) > 0.0, "(which it has not at 3 s)");
  }
}

// --- silences, sleep and block sizes -----------------------------------------------------------

static void test_sleep() {
  char label[200];
  // The output does not depend on the block size, across silences of every
  // length around the moment the device falls asleep (which block that is
  // depends on the block size) and one long after it. Controls are moved in
  // the silence, 10 ms before the next key: asleep or not, they are there
  // when the key arrives. The release of 50 ms is silent after 83 ms and the
  // device sleeps 50 ms later, so the silences run from 40 to 260 ms.
  {
    auto phrase = [](int block, float silence) {
      device.init(kRate);
      device.set_param(p::kRelease, 0.05f);
      device.set_param(p::kAttack, 0.05f);
      device.set_param(p::kTint, 0.6f);
      device.set_param(p::kDrift, 0.8f);
      device.set_param(p::kDriftTime, 2.0f);
      Stereo out;
      auto run_for = [&](float seconds) { out = concat(out, render_blocks(device, seconds, block)); };
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 329.63f, 0.6f);
      run_for(0.7f);
      device.note_off(1);
      device.note_off(2);
      run_for(silence - 0.01f);
      device.set_param(p::kColour, 0.9f);
      device.set_param(p::kLowCut, 300.0f);
      device.set_param(p::kWidth, 0.2f);
      device.set_param(p::kTint, 1.0f);
      device.set_param(p::kDriftTime, 5.0f);
      device.set_param(p::kVolume, -3.0f);
      run_for(0.01f);
      device.note_on(3, 277.18f, 0.8f);
      run_for(0.6f);
      device.set_param(p::kHighCut, 2000.0f);
      device.set_param(p::kDrift, 0.3f);
      run_for(0.3f);
      return out;
    };
    {
      Stereo asleep = phrase(128, 1.3f);
      EXPECT(peak(asleep.left, at(1.0), at(1.95)) == 0.0, "the phrase holds a silence in which the device sleeps");
      EXPECT(rms(asleep.left, at(2.2)) > 1.0e-3, "and a note after it");
    }
    double worst = 0.0;
    float worst_silence = 0.0f;
    const char* worst_block = "";
    for (float silence : {0.04f, 0.06f, 0.08f, 0.10f, 0.12f, 0.14f, 0.16f, 0.18f, 0.20f, 0.22f, 0.24f, 0.26f, 1.3f}) {
      Stereo reference = phrase(128, silence);
      for (int block : {1, 0, 2048}) {
        const double diff = apart(phrase(block, silence), reference);
        if (diff > worst) {
          worst = diff;
          worst_silence = silence;
          worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
        }
      }
    }
    std::snprintf(label, sizeof label, "output does not depend on block size (worst %g, %s blocks, %.2f s silence)", worst,
                  worst_block, worst_silence);
    EXPECT(worst < 1.0e-6, label);
  }

  // A knob moved in silence is simply there for the next key: the note is
  // the one a device set that way from init plays, sample for sample. The
  // device is put to sleep off the beat of its control clock (one block of
  // 13 while the first note rings), and the knob is moved once asleep and
  // once in the 50 ms between the last voice ending and sleep.
  {
    const struct {
      int id;
      float from, to;
      const char* name;
    } moves[] = {
        {p::kColour, 0.1f, 0.9f, "Colour"},        {p::kLowCut, 20.0f, 600.0f, "Low cut"},
        {p::kHighCut, 20000.0f, 1500.0f, "High cut"}, {p::kTint, 0.0f, 1.0f, "Tint"},
        {p::kDrift, 0.0f, 1.0f, "Drift"},          {p::kDriftTime, 30.0f, 2.0f, "Drift time"},
        {p::kWidth, 0.0f, 1.0f, "Width"},          {p::kAttack, 0.01f, 0.3f, "Attack"},
        {p::kRelease, 0.05f, 0.5f, "Release"},     {p::kVolume, -30.0f, 0.0f, "Volume"},
    };
    auto base = [](ColouredNoise& d) {
      d.init(kRate);
      d.set_param(p::kRelease, 0.05f);
      d.set_param(p::kAttack, 0.05f);
      d.set_param(p::kTint, 0.5f);
      d.set_param(p::kDrift, 0.6f);
      d.set_param(p::kDriftTime, 2.0f);
    };
    auto note = [](ColouredNoise& d) {
      d.note_on(2, 330.0f, 0.8f);
      Stereo out = render(d, 0.7f, kRate);
      d.note_off(2);
      return concat(out, render(d, 0.3f, kRate));
    };
    for (const auto& move : moves) {
      base(device);
      device.set_param(move.id, move.to);
      const Stereo fresh = note(device);
      for (float wait : {1.0f, 0.1f}) {
        base(device);
        device.set_param(move.id, move.from);
        // (Ten keys, so that the next key's voice is one that has played.)
        for (int n = 0; n < 10; ++n) device.note_on(10 + n, 110.0f * std::pow(2.0f, static_cast<float>(n) / 3.0f), 0.8f);
        render(device, 0.4f, kRate);
        device.process(13);
        for (int n = 0; n < 10; ++n) device.note_off(10 + n);
        Stereo gap = render(device, wait, kRate);
        device.set_param(move.id, move.to);
        Stereo last = render(device, 0.02f, kRate);
        const Stereo moved = note(device);
        const double diff = apart(moved, fresh);
        std::snprintf(label, sizeof label, "%s moved %s is there for the next key (apart by %g)", move.name,
                      wait > 0.5f ? "while asleep" : "in the silence before sleep", diff);
        EXPECT(diff < 1.0e-6 && peak(last.left) == 0.0 && rms(gap.left, 0, at(0.05)) > 0.0, label);
      }
    }
  }
}

// --- clicks ------------------------------------------------------------------------------------

// Two keys on a bed that swells every 2 s or so, with a band at each key.
static void moving(ColouredNoise& d) {
  d.init(kRate);
  d.set_param(p::kDrift, 1.0f);
  d.set_param(p::kDriftTime, 2.0f);
  d.set_param(p::kTint, 0.7f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kVolume, 0.0f);
  d.note_on(1, 220.0f, 0.9f);
  d.note_on(2, 554.37f, 0.7f);
}

static void test_clicks() {
  char label[200];
  // Every smoothed control thrown from one end to the other, both ways.
  const struct {
    int id;
    const char* name;
  } controls[] = {{p::kColour, "Colour"}, {p::kLowCut, "Low cut"}, {p::kHighCut, "High cut"}, {p::kTint, "Tint"},
                  {p::kDrift, "Drift"},   {p::kDriftTime, "Drift time"}, {p::kWidth, "Width"},  {p::kVolume, "Volume"}};
  for (const auto& control : controls) {
    for (int way = 0; way < 2; ++way) {
      const int id = control.id;
      const float from = way == 0 ? p::kParamMin[id] : p::kParamMax[id], to = way == 0 ? p::kParamMax[id] : p::kParamMin[id];
      const double sudden = suddenness(
          [id, from](ColouredNoise& d) {
            moving(d);
            d.set_param(id, from);
          },
          [id, to](ColouredNoise& d) { d.set_param(id, to); });
      std::snprintf(label, sizeof label, "%s thrown %s is gradual (%.3f of the change in its first 8 samples)", control.name,
                    way == 0 ? "up" : "down", sudden);
      EXPECT(sudden < 0.15, label);
    }
  }
  // Keys: let go at the shortest release, struck again at another gain, a
  // new key at the shortest attack, and an eleventh key that has to take a
  // voice.
  {
    auto shortest = [](ColouredNoise& d) {
      moving(d);
      d.set_param(p::kRelease, p::kParamMin[p::kRelease]);
    };
    const double off = suddenness(shortest, [](ColouredNoise& d) {
      d.note_off(1);
      d.note_off(2);
    });
    const double again = suddenness(shortest, [](ColouredNoise& d) { d.note_on(1, 220.0f, 0.2f); });
    const double on = suddenness(shortest, [](ColouredNoise& d) { d.note_on(3, 880.0f, 1.0f); });
    const double steal = suddenness(
        [](ColouredNoise& d) {
          moving(d);
          d.set_param(p::kTint, 1.0f);
          for (int n = 0; n < 8; ++n) d.note_on(10 + n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 0.5f + 0.05f * n);
        },
        [](ColouredNoise& d) { d.note_on(99, 1318.5f, 1.0f); });
    std::printf("  in the first 8 samples: note off %.3f, a key struck again %.3f, a new key %.3f, a steal %.3f of the change\n",
                off, again, on, steal);
    EXPECT(off < 0.15, "letting go at the shortest release is gradual");
    EXPECT(again < 0.15, "a key struck again at another gain is gradual");
    EXPECT(on < 0.15, "a new key at the shortest attack is gradual");
    EXPECT(steal < 0.15, "an eleventh key takes a voice gradually");
    EXPECT(off > 0.0 && again > 0.0 && on > 0.0 && steal > 0.0, "(each of those events changes the sound)");
  }
}

// --- voices ------------------------------------------------------------------------------------

static const float kTen[10] = {110.0f,  146.83f, 196.0f,  261.63f,  349.23f,
                               466.16f, 622.25f, 830.61f, 1108.73f, 1479.98f};

// Ten keys held on a steady pink bed at Tint 1, for long enough that all are
// equally loud.
static void hold_ten(ColouredNoise& d, float gain = 0.8f) {
  steady(d);
  d.set_param(p::kTint, 1.0f);
  for (int n = 0; n < 10; ++n) d.note_on(n, kTen[n], gain);
  render(d, 1.0f, kRate);
}

// The spectrum of the left side of a steady pink bed with no Tint, one key at `gain`.
static std::vector<double> bare_bed(float gain) {
  steady(device);
  device.note_on(1, 220.0f, gain);
  Stereo out = render(device, 10.5f, kRate);
  return spectrum(out.left, at(0.5));
}

// How far the level within 2 % of `hz` stands over the bare bed's there, in dB.
static double stands_out(const std::vector<double>& power, const std::vector<double>& bare, double hz) {
  return band_db(power, kRate, hz / 1.02, hz * 1.02) - band_db(bare, kRate, hz / 1.02, hz * 1.02);
}

static void test_voices() {
  const std::vector<double> bare = bare_bed(0.8f), bare_full = bare_bed(1.0f);
  // Two keys back to back into a full pool: each takes a voice of its own.
  {
    hold_ten(device);
    device.note_on(98, 1975.53f, 0.8f);
    device.note_on(99, 2637.02f, 0.8f);
    Stereo out = render(device, 10.5f, kRate);
    const std::vector<double> power = spectrum(out.left, at(0.5));
    const double first = stands_out(power, bare, 1975.53), second = stands_out(power, bare, 2637.02);
    std::printf("  two keys into a full pool: their bands stand %.1f and %.1f dB out\n", first, second);
    EXPECT(first > 3.0 && second > 3.0, "two keys that both have to take a voice both sound");
    int still = 0;
    for (int n = 0; n < 10; ++n) still += stands_out(power, bare, kTen[n]) > 3.0 ? 1 : 0;
    EXPECT(still == 8, "and eight of the ten held keys are still there");
  }
  // The same two keys 2 ms apart: the second arrives while the first still
  // waits for its voice to fade, and must not take that voice from it.
  {
    hold_ten(device);
    device.note_on(98, 1975.53f, 0.8f);
    render(device, 0.002f, kRate);
    device.note_on(99, 2637.02f, 0.8f);
    Stereo out = render(device, 10.5f, kRate);
    const std::vector<double> power = spectrum(out.left, at(0.5));
    const double first = stands_out(power, bare, 1975.53), second = stands_out(power, bare, 2637.02);
    std::printf("  the same two keys 2 ms apart: their bands stand %.1f and %.1f dB out\n", first, second);
    EXPECT(first > 3.0 && second > 3.0, "a key waiting for its voice is not pushed out by the next key");
    for (int n = 0; n < 10; ++n) device.note_off(n);
    device.note_off(98);
    device.note_off(99);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left, at(0.3)) == 0.0, "and both are ended by their note offs");
  }
  // Nine keys held, then two at once: the first of the two takes the free
  // voice and counts at its gain from that moment, so the second takes the
  // oldest of the nine, not the voice that has only just begun.
  {
    steady(device);
    device.set_param(p::kTint, 1.0f);
    for (int n = 0; n < 9; ++n) device.note_on(n, kTen[n], 0.8f);
    render(device, 1.0f, kRate);
    device.note_on(98, 1975.53f, 0.8f);
    device.note_on(99, 2637.02f, 0.8f);
    Stereo out = render(device, 10.5f, kRate);
    const std::vector<double> power = spectrum(out.left, at(0.5));
    const double first = stands_out(power, bare, 1975.53), second = stands_out(power, bare, 2637.02);
    std::printf("  nine keys held and two at once: their bands stand %.1f and %.1f dB out, the oldest key's %.1f dB\n", first,
                second, stands_out(power, bare, kTen[0]));
    EXPECT(first > 3.0 && second > 3.0, "a key that has only just begun is not the voice the next key takes");
    EXPECT(stands_out(power, bare, kTen[0]) < 2.5 && stands_out(power, bare, kTen[1]) > 3.0, "the oldest held key gives way instead");
  }
  // The extra key struck twice in one block, with every voice equally loud:
  // one voice holds it, so letting everything go ends everything.
  {
    hold_ten(device);
    device.note_on(50, 1975.53f, 0.8f);
    device.note_on(50, 1975.53f, 0.8f);
    Stereo out = render(device, 10.5f, kRate);
    const std::vector<double> power = spectrum(out.left, at(0.5));
    EXPECT(stands_out(power, bare, 1975.53) > 3.0, "a key struck twice while it waits for a voice sounds");
    EXPECT(stands_out(power, bare, kTen[1]) > 3.0 && stands_out(power, bare, kTen[2]) > 3.0, "and took only one voice: the chord's next notes are still there");
    for (int n = 0; n < 10; ++n) device.note_off(n);
    device.note_off(50);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left, at(0.3)) == 0.0 && peak(rest.right, at(0.3)) == 0.0, "and one note off ends it: exact silence after every key is let go");
    // Let go before its voice was free, it never sounds.
    hold_ten(device);
    device.note_on(50, 1975.53f, 0.8f);
    device.note_off(50);
    Stereo never = render(device, 10.5f, kRate);
    const double absent = stands_out(spectrum(never.left, at(0.5)), bare, 1975.53);
    std::printf("  a key let go before its voice was free: %.1f dB at its pitch (the skirts of the keys beside it)\n", absent);
    EXPECT(absent < 2.5, "a key let go before its voice was free stays silent");
  }
  // A held key struck again plays on in its own voice: the bed does not dip,
  // a softer strike brings the level down to it, and one note off ends it.
  {
    steady(device);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kAttack, 2.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo before = render(device, 3.0f, kRate);
    device.note_on(1, 220.0f, 1.0f);
    Stereo after = render(device, 0.5f, kRate);
    const double held = db(rms(before.left, at(2.5)));
    double lowest = 0.0;
    for (double level : level_track(after.left, kRate, 0.0)) lowest = std::min(lowest, level - held);
    device.note_on(1, 220.0f, 0.5f);
    Stereo softer = render(device, 0.5f, kRate);
    const double soft = db(rms(softer.left, at(0.3))) - held;
    std::printf("  a held key struck again: the bed's lowest 50 ms is %.2f dB from where it was; struck at half the gain it settles %.2f dB down\n",
                lowest, soft);
    EXPECT(lowest > -0.5, "a held key struck again does not dip the bed");
    EXPECT_NEAR(soft, -6.02, 0.4, "struck again at half the gain, the bed comes down to it");
    device.note_off(1);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left, at(0.3)) == 0.0, "and one note off ends a key struck three times");
  }
  // A key struck again while it fades joins its own voice: its band is not
  // doubled, and one note off ends it.
  {
    auto once = [](ColouredNoise& d) {
      steady(d);
      d.set_param(p::kTint, 1.0f);
      d.set_param(p::kRelease, 15.0f);
      d.note_on(1, 440.0f, 1.0f);
    };
    once(device);
    Stereo single = render(device, 10.6f, kRate);
    once(device);
    render(device, 0.05f, kRate);
    device.note_off(1);
    render(device, 0.05f, kRate);
    device.note_on(1, 440.0f, 1.0f);
    Stereo twice = render(device, 10.5f, kRate);
    const double one = stands_out(spectrum(single.left, at(0.6)), bare_full, 440.0), two = stands_out(spectrum(twice.left, at(0.5)), bare_full, 440.0);
    std::printf("  a fading key struck again: its band stands %.1f dB out, %.1f dB for a key struck once\n", two, one);
    EXPECT(std::fabs(two - one) < 1.0, "a key struck again while it fades does not double its band");
    device.set_param(p::kRelease, 0.05f);
    render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left, at(0.3)) == 0.0, "and one note off ends it");
  }
  // A key struck again with every voice busy keeps its release.
  {
    hold_ten(device);
    device.set_param(p::kRelease, 1.0f);
    render(device, 0.1f, kRate);
    device.note_on(3, kTen[3], 0.8f);
    Stereo held = render(device, 0.5f, kRate);
    for (int n = 0; n < 10; ++n) device.note_off(n);
    Stereo tail = render(device, 0.5f, kRate);
    const double quarter = db(rms(tail.left, at(0.2), at(0.3)) / rms(held.left, at(0.2)));
    std::printf("  a key struck again in a full pool, then all let go: %.1f dB a quarter of the release later\n", quarter);
    EXPECT_NEAR(quarter, -15.0, 2.0, "a key struck again with every voice busy keeps its release");
  }
  // One note id sent at a new pitch while held: the old voice is let go, so one note off ends both.
  {
    steady(device);
    device.set_param(p::kTint, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.3f, kRate);
    device.note_on(1, 660.0f, 1.0f);
    Stereo out = render(device, 10.5f, kRate);
    const std::vector<double> power = spectrum(out.left, at(0.5));
    EXPECT(stands_out(power, bare_full, 660.0) > 6.0 && stands_out(power, bare_full, 220.0) < 1.0, "a note id sent at a new pitch moves to it");
    device.note_off(1);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left, at(0.3)) == 0.0, "and one note off ends it");
  }
  // What a key may ask for is held to the range: pitch to 20 Hz and 12 kHz, gain to 0..1.
  {
    auto key = [](float hz, float gain) {
      steady(device);
      device.set_param(p::kTint, 1.0f);
      device.note_on(1, hz, gain);
      return render(device, 1.0f, kRate);
    };
    EXPECT(apart(key(5.0f, 1.0f), key(20.0f, 1.0f)) == 0.0 && apart(key(40.0f, 1.0f), key(20.0f, 1.0f)) > 1.0e-3,
           "a key under 20 Hz plays at 20 Hz");
    EXPECT(apart(key(30000.0f, 1.0f), key(12000.0f, 1.0f)) == 0.0 && apart(key(6000.0f, 1.0f), key(12000.0f, 1.0f)) > 1.0e-3,
           "a key over 12 kHz plays at 12 kHz");
    EXPECT(apart(key(440.0f, 2.0f), key(440.0f, 1.0f)) == 0.0 && apart(key(440.0f, -1.0f), key(440.0f, 0.0f)) == 0.0,
           "a gain outside 0..1 is held to it");
    EXPECT(apart(key(440.0f, std::nanf("")), key(440.0f, 0.5f)) == 0.0, "a gain that is not a number plays at a half");
    EXPECT(peak(key(440.0f, 0.0f).left) == 0.0, "a key at no gain is silent");
  }
}

// --- levels ------------------------------------------------------------------------------------

static void test_levels() {
  char label[200];
  // One key at gain 0.7 on the default patch, at the default volume.
  {
    device.init(kRate);
    device.note_on(1, 261.63f, 0.7f);
    Stereo out = render(device, 8.0f, kRate);
    const double high = db(std::max(peak(out.left), peak(out.right)));
    std::printf("  one key at gain 0.7, defaults: peak %.1f dBFS, RMS %.1f dBFS a side from 3 s on\n", high, db(rms(out.left, at(3.0))));
    EXPECT(high > -24.0 && high < -10.0, "one key at gain 0.7 peaks between -24 and -10 dBFS at the default volume");
    device.init(kRate);
    device.note_on(1, 261.63f, 0.8f);
    Stereo bench = render(device, 5.5f, kRate);
    device.note_off(1);
    bench = concat(bench, render(device, 2.5f, kRate));
    std::printf("  as the preset bench hears the defaults: loudest 400 ms of the mid %.1f dBFS, peak %.1f dBFS\n",
                db(loudest_400ms(mid(bench), kRate)), db(std::max(peak(bench.left), peak(bench.right))));
  }
  // A full pool of keys at full gain stays under the clip's knee, with a
  // band at every key and unlike noise on the two sides, at any Colour. The
  // keys are low, where brown has most to give a band.
  for (int c = 0; c < 3; ++c) {
    for (float tint : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kColour, 0.5f * static_cast<float>(c));
      device.set_param(p::kTint, tint);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kDrift, 0.0f);
      device.set_param(p::kAttack, 0.01f);
      for (int n = 0; n < 10; ++n) device.note_on(n, 55.0f * std::pow(2.0f, static_cast<float>(n) / 3.0f), 1.0f);
      Stereo out = render(device, 30.0f, kRate);
      const double high = std::max(peak(out.left), peak(out.right));
      std::snprintf(label, sizeof label, "ten keys at full gain stay under the clip's knee at Colour %.1f, Tint %.0f (peak %.3f, RMS %.1f dBFS)",
                    0.5 * c, tint, high, db(rms(out.left, at(1.0))));
      std::printf("  %s\n", label);
      EXPECT(high < 0.5, label);
    }
  }
  // Noise has no ceiling, so "never" is a count: the loudest case above
  // (brown, a band at each of ten low keys) held for ten minutes, every
  // sample of both sides looked at.
  {
    device.init(kRate);
    device.set_param(p::kColour, 1.0f);
    device.set_param(p::kTint, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDrift, 0.0f);
    device.set_param(p::kAttack, 0.01f);
    for (int n = 0; n < 10; ++n) device.note_on(n, 55.0f * std::pow(2.0f, static_cast<float>(n) / 3.0f), 1.0f);
    const long blocks = 600L * 48000L / kBlock;
    long over = 0;
    double high = 0.0;
    for (long b = 0; b < blocks; ++b) {
      device.process(kBlock);
      for (int i = 0; i < kBlock; ++i) {
        const double l = std::fabs(device.out_left()[i]), r = std::fabs(device.out_right()[i]);
        over += (l > 0.5 ? 1 : 0) + (r > 0.5 ? 1 : 0);
        high = std::max(high, std::max(l, r));
      }
    }
    std::snprintf(label, sizeof label, "ten low keys on brown at Tint 1 for ten minutes: no sample past the knee (peak %.3f, %ld past it)", high, over);
    std::printf("  %s\n", label);
    EXPECT(over == 0 && high < 0.45, label);
  }
  // Counted at its worst: ten keys of one pitch from ten sources add in step.
  {
    device.init(kRate);
    device.set_param(p::kTint, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDrift, 0.0f);
    for (int n = 0; n < 10; ++n) device.note_on(n, 220.0f, 1.0f);
    Stereo out = render(device, 30.0f, kRate);
    const double high = std::max(peak(out.left), peak(out.right));
    std::printf("  ten keys of one pitch at Tint 1: peak %.3f, RMS %.1f dBFS\n", high, db(rms(out.left, at(3.0))));
    EXPECT(high < 1.0, "ten keys of one pitch stay inside full scale");
  }
  // The last stage is the kit's soft clip of the sound times Volume: what
  // 0 dB plays is the clip of what -6 dB plays (which stays under the knee)
  // made that much louder, and never over 1 at any Volume.
  {
    Stereo out[3];
    const float volumes[3] = {-6.0f, 0.0f, 6.0f};
    for (int pass = 0; pass < 3; ++pass) {
      device.init(kRate);
      device.set_param(p::kVolume, volumes[pass]);
      device.set_param(p::kTint, pass == 2 ? 1.0f : 0.0f);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kDrift, 0.0f);
      device.set_param(p::kAttack, 0.01f);
      for (int n = 0; n < (pass == 2 ? 10 : 1); ++n) device.note_on(n, 220.0f, 1.0f);
      out[pass] = render(device, 10.0f, kRate);
    }
    const float louder = 1.0f / kit::db_to_gain(-6.0f);
    double worst = 0.0, over = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(kit::soft_clip(out[0].left[i] * louder)) - out[1].left[i]));
      over = std::max(over, std::fabs(static_cast<double>(out[0].left[i] * louder)));
    }
    std::printf("  Volume 0 dB on one key: peak %.3f where the bare sound reaches %.3f; +6 dB on ten keys of one pitch at Tint 1: peak %.4f\n",
                peak(out[1].left), over, std::max(peak(out[2].left), peak(out[2].right)));
    EXPECT(peak(out[0].left) < 0.5 && over > 0.6, "(the test drives the sound past the knee)");
    EXPECT(worst < 1.0e-5, "the output ends in the kit's soft clip");
    EXPECT(peak(out[2].left) <= 1.0 && peak(out[2].right) <= 1.0 && peak(out[2].left) > 0.9, "and never passes full scale");
  }
}

// --- sample rates ------------------------------------------------------------------------------

static void test_rates() {
  char label[200];
  double level[3], peak_height[3], attack[3], release[3], first_swell[3], darkening[3], glide[3];
  for (int r = 0; r < 3; ++r) {
    const float rate = kRates[r];
    // The default patch on one key: its level once the attack is over.
    device.init(rate);
    device.set_param(p::kDrift, 0.0f);
    device.note_on(1, 261.63f, 0.7f);
    Stereo out = render(device, 12.0f, rate);
    level[r] = db(rms(out.left, at(3.0, rate)));
    // A band at 440 Hz against the bed.
    const std::vector<double> bare = tint_spectrum(0.0f, [](ColouredNoise& d) { d.note_on(1, 440.0f, 1.0f); }, rate);
    const std::vector<double> with = tint_spectrum(1.0f, [](ColouredNoise& d) { d.note_on(1, 440.0f, 1.0f); }, rate);
    peak_height[r] = band_db(with, rate, 440.0 / 1.015, 440.0 * 1.015) - band_db(bare, rate, 440.0 / 1.015, 440.0 * 1.015);
    // The envelope.
    steady(device, rate);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 1.5f, rate);
    device.note_off(1);
    Stereo fall = render(device, 1.5f, rate);
    attack[r] = db(rms(rise.left, at(0.2, rate), at(0.3, rate))) - kFull;
    release[r] = db(rms(fall.left, at(0.95, rate), at(1.05, rate))) - kFull;
    // The drift: when the first swell is at its lowest.
    const Swells swells = find_swells(level_track(drift_render(1.0f, 2.0f, 12.0f, rate), rate, 0.05));
    first_swell[r] = swells.times.empty() ? -1.0 : swells.times[0];
    // A key struck again at half the gain: how far the bed has come down
    // 10 to 30 ms later, against the same noise with no second strike.
    {
      Stereo out[2];
      for (int pass = 0; pass < 2; ++pass) {
        steady(device, rate);
        device.note_on(1, 220.0f, 1.0f);
        render(device, 0.5f, rate);
        if (pass == 0) device.note_on(1, 220.0f, 0.5f);
        out[pass] = render(device, 0.05f, rate);
      }
      glide[r] = db(rms(out[0].left, at(0.01, rate), at(0.03, rate)) / rms(out[1].left, at(0.01, rate), at(0.03, rate)));
    }
    // How much further the swells take 1 to 2 kHz down than 100 to 300 Hz,
    // over a minute of them: what the corner of the darkening decides.
    {
      const std::vector<double> still = spectrum(drift_render(0.0f, 2.0f, 60.5f, rate), at(0.5, rate));
      const std::vector<double> moved = spectrum(drift_render(1.0f, 2.0f, 60.5f, rate), at(0.5, rate));
      darkening[r] = (band_db(moved, rate, 1000.0, 2000.0) - band_db(still, rate, 1000.0, 2000.0)) -
                     (band_db(moved, rate, 100.0, 300.0) - band_db(still, rate, 100.0, 300.0));
    }
    std::printf("  at %.1f kHz: default patch %.2f dBFS, the band at 440 Hz %.2f dB over the bed, attack %.2f dB at 0.25 s,"
                " release %.2f dB at 1 s, first swell lowest at %.2f s, a minute of swells takes 1 to 2 kHz %.2f dB further down than 100 to 300 Hz,"
                " a key struck again at half the gain is %.2f dB down after 10 to 30 ms\n",
                rate / 1000.0, level[r], peak_height[r], attack[r], release[r], first_swell[r], darkening[r], glide[r]);
    // A second init is the first, with everything at work.
    Stereo twice[2];
    for (Stereo& one : twice) {
      device.init(rate);
      device.set_param(p::kTint, 0.8f);
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kDriftTime, 2.0f);
      device.set_param(p::kLowCut, 80.0f);
      device.set_param(p::kHighCut, 6000.0f);
      device.note_on(1, 220.0f, 0.9f);
      device.note_on(2, 330.0f, 0.6f);
      one = render(device, 3.0f, rate);
      device.note_off(1);
      device.note_off(2);
      render(device, 8.0f, rate);
    }
    std::snprintf(label, sizeof label, "a second init gives the first render again at %.1f kHz", rate / 1000.0);
    EXPECT(twice[0].left == twice[1].left && twice[0].right == twice[1].right && rms(twice[0].left) > 1.0e-3, label);
  }
  for (int r : {0, 2}) {
    std::snprintf(label, sizeof label, "the default patch is as loud at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(level[r] - level[1]) < 0.5, label);
    std::snprintf(label, sizeof label, "a key's band stands as high over the bed at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(peak_height[r] - peak_height[1]) < 1.0 && peak_height[1] > 6.0, label);
    std::snprintf(label, sizeof label, "attack and release take as long at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(attack[r] - attack[1]) < 0.5 && std::fabs(release[r] - release[1]) < 0.5 && release[1] < -25.0, label);
    std::snprintf(label, sizeof label, "the drift's first swell falls at the same moment at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(first_swell[r] - first_swell[1]) < 0.06 && first_swell[1] > 0.0, label);
    std::snprintf(label, sizeof label, "a key's gain glides as fast at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(glide[r] - glide[1]) < 0.3 && glide[1] < -2.5 && glide[1] > -4.0, label);
    std::snprintf(label, sizeof label, "a swell darkens from the same pitch up at %.1f kHz as at 48 kHz", kRates[r] / 1000.0);
    EXPECT(std::fabs(darkening[r] - darkening[1]) < 0.2 && darkening[1] < -0.5, label);
  }
}
