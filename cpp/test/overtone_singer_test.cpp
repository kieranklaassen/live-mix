// Native harness for Overtone Singer (cpp/devices/overtone-singer). The
// conformance pass covers stability, silence when idle, block-size
// independence on continuous input and parameter abuse; the rest asserts what
// makes it an overtone singer: where the resonance stands, in what order and
// when it moves, how long a move takes, how wide and how strong it is, what
// is left around it, and that no setting and no input can make it run away.

#include <functional>
#include <initializer_list>
#include <utility>

#include "../devices/overtone-singer/overtone_singer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::OvertoneSinger;
namespace p = livemix::overtone_singer;

static OvertoneSinger device;
static OvertoneSinger twin;

static const float kRate = 48000.0f;

using Settings = std::initializer_list<std::pair<int, float>>;

// Every check starts from the same four settings, so that what it expects
// does not move when a default is retuned: the root on C in octave 3, a move
// every two seconds, 300 ms to make it.
static void setup(OvertoneSinger& d, float rate, Settings settings) {
  d.init(rate);
  d.set_param(p::kRoot, 0.0f);
  d.set_param(p::kOctave, 3.0f);
  d.set_param(p::kPace, 0.5f);
  d.set_param(p::kGlide, 300.0f);
  for (const auto& setting : settings) d.set_param(setting.first, setting.second);
}

// Pink noise (Kellet's filter), about `gain` in peak.
static std::vector<float> pink(float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    v = static_cast<float>(gain * 0.16 * (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362));
    b6 = w * 0.115926;
  }
  return out;
}

// A drone on `hz`: sixteen harmonics falling 6 dB an octave, peak near `gain`.
static std::vector<float> drone_of(float hz, float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    double sum = 0.0;
    for (int n = 1; n <= 16; ++n) {
      sum += std::sin(2.0 * kPi * hz * n * static_cast<double>(i) / rate + 0.7 * n) / n;
    }
    out[i] = static_cast<float>(gain * 0.5 * sum);
  }
  return out;
}

static double root_of(int root, int octave) { return 440.0 * std::pow(2.0, (12 * (octave + 1) + root - 69) / 12.0); }

static double width_of(double focus) { return 2.0 * std::pow(0.05 / 2.0, focus); }
static double lift_of(double focus) { return 14.142136 / std::sqrt(width_of(focus)); }

// What the bilinear transform leaves of a band-pass's width, as the header has it.
static double width_kept(double turn) {
  const double t2 = turn * turn;
  return 1.0 - t2 / 6.0 * (1.0 - t2 / 20.0 * (1.0 - t2 / 42.0));
}

// What the header says the device does to a frequency, as a gain: two peaks
// in series, each the drone and a band-pass (the analog one at the warped
// frequency) lifted to make up the rest, and the dry sound added by Mix.
static double expected_gain(double hz, double harmonic, double root, double focus, double drone, double mix,
                            double rate) {
  const double centre = root * harmonic;
  const double g = std::tan(kPi * centre / rate);
  const double k = width_of(focus) / (0.6435943 * harmonic * width_kept(2.0 * kPi * centre / rate));
  const double w = std::tan(kPi * hz / rate) / g;
  // H = j·k·w / (1 − w² + j·k·w)
  const double den_re = 1.0 - w * w, den_im = k * w;
  const double den = den_re * den_re + den_im * den_im;
  const double h_re = (k * w * den_im) / den, h_im = (k * w * den_re) / den;
  // One peak is drone + (√lift − drone)·H; the pair is its square.
  const double reach = std::sqrt(lift_of(focus)) - drone;
  const double peak_re = drone + reach * h_re, peak_im = reach * h_im;
  const double wet_re = peak_re * peak_re - peak_im * peak_im;
  const double wet_im = 2.0 * peak_re * peak_im;
  return std::hypot(1.0 - mix + mix * wet_re, mix * wet_im);
}

// The device's gain at each of `probes` (Hz), measured the way it is meant
// to be heard: small tones beside a loud one far below the resonance. The
// loud one is what the ceiling takes its measure from, so the small ones get
// the resonance's whole lift. The device is set up by the caller.
static std::vector<double> measure_gains(OvertoneSinger& d, float rate, double carrier_hz,
                                         const std::vector<double>& probes, float seconds, float window) {
  const double kCarrier = 0.4, kProbe = 0.0001;
  std::vector<float> in(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < in.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double sum = kCarrier * std::sin(2.0 * kPi * carrier_hz * t);
    for (size_t n = 0; n < probes.size(); ++n) sum += kProbe * std::sin(2.0 * kPi * probes[n] * t + 1.3 * n);
    in[i] = static_cast<float>(sum);
  }
  Stereo out = run(d, in);
  const size_t from = in.size() - static_cast<size_t>(window * rate);
  std::vector<double> gains;
  for (double hz : probes) gains.push_back(tone_level(out.left, hz, rate, from, in.size()) / kProbe);
  return gains;
}

// The harmonic of `root` with the most level in [from, to).
static int strongest_harmonic(const std::vector<float>& x, double root, float rate, size_t from, size_t to) {
  int best = 0;
  double level = -1.0;
  for (int n = 2; n <= 16; ++n) {
    const double here = tone_level(x, root * n, rate, from, to);
    if (here > level) {
      level = here;
      best = n;
    }
  }
  return best;
}

// The harmonic sung in each of `steps` steps of the melody, read off the
// sound: the last 60 % of each step, after the glide.
static std::vector<int> sung(const std::vector<float>& out, double root, float rate, double pace, int steps) {
  std::vector<int> harmonics;
  const double step = rate / pace;
  for (int k = 0; k < steps; ++k) {
    harmonics.push_back(strongest_harmonic(out, root, rate, static_cast<size_t>((k + 0.4) * step),
                                           static_cast<size_t>((k + 0.97) * step)));
  }
  return harmonics;
}

static void print_list(const char* label, const std::vector<int>& values) {
  std::printf("  %s:", label);
  for (int v : values) std::printf(" %d", v);
  std::printf("\n");
}

// How much of what an event does to the sound is there in its first eight
// samples: near 1 for a jump, small for a change that comes in gradually.
// `settle` seconds of `input` run first; the event is made at eight moments
// a little apart and the worst is kept. The reference has no event in it.
static double suddenness(float rate, Settings settings, const std::vector<float>& input, float settle,
                         const std::function<void(OvertoneSinger&)>& event) {
  double worst = 0.0;
  const size_t look = static_cast<size_t>(1.0f * rate);
  const size_t window = static_cast<size_t>(0.02f * rate);
  for (int moment = 0; moment < 8; ++moment) {
    const size_t at = static_cast<size_t>(settle * rate) + static_cast<size_t>(moment) * 37;
    const std::vector<float> before(input.begin(), input.begin() + static_cast<long>(at));
    const std::vector<float> after(input.begin() + static_cast<long>(at),
                                   input.begin() + static_cast<long>(at + look));
    setup(device, rate, settings);
    run(device, before);
    Stereo plain = run(device, after);
    setup(device, rate, settings);
    run(device, before);
    event(device);
    Stereo moved = run(device, after);
    std::vector<double> diff(look);
    size_t first = look;
    for (size_t i = 0; i < look; ++i) {
      diff[i] = std::max(std::fabs(static_cast<double>(moved.left[i]) - plain.left[i]),
                         std::fabs(static_cast<double>(moved.right[i]) - plain.right[i]));
      if (first == look && diff[i] > 1.0e-7) first = i;
    }
    if (first == look) continue;  // the event changed nothing in a second
    double early = 0.0, whole = 0.0;
    for (size_t i = first; i < std::min(look, first + window); ++i) {
      if (i < first + 8) early = std::max(early, diff[i]);
      whole = std::max(whole, diff[i]);
    }
    if (whole > 1.0e-5) worst = std::max(worst, early / whole);
  }
  return worst;
}

static double max_diff(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Run `input` in blocks cut by `sizes` in turn, calling `between(done)`
// before every block.
static Stereo run_blocks(OvertoneSinger& d, const std::vector<float>& input, const std::vector<int>& sizes,
                         const std::function<void(OvertoneSinger&, size_t, size_t)>& between) {
  Stereo out;
  out.left.resize(input.size());
  out.right.resize(input.size());
  size_t done = 0, which = 0;
  while (done < input.size()) {
    const int frames =
        static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % sizes.size()]), input.size() - done));
    if (between) between(d, done, done + static_cast<size_t>(frames));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = input[done + i];
      d.in_right()[i] = input[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += static_cast<size_t>(frames);
  }
  return out;
}

// --- the checks -----------------------------------------------------------------------------

// Where the band a noise comes out in is centred: the mean frequency of its
// power within three widths of `want`, over six stretches of the sound each
// long enough to tell a third of a width apart.
static double noise_centre(const std::vector<float>& x, float rate, double want, double width, size_t from) {
  const size_t stretch = static_cast<size_t>(3.0 / width * rate);
  double weighted = 0.0, total = 0.0;
  for (int n = -12; n <= 12; ++n) {
    const double hz = want + n * width / 4.0;
    double power = 0.0;
    for (int k = 0; k < 6; ++k) {
      const double level = tone_level(x, hz, rate, from + k * stretch, from + (k + 1) * stretch);
      power += level * level;
    }
    weighted += hz * power;
    total += power;
  }
  return weighted / total;
}

// The series stands on Root, in Octave, times the harmonic, at every rate.
static void test_series() {
  struct Case {
    int root, octave, harmonic;
  };
  const Case cases[] = {{0, 3, 8}, {9, 2, 7}, {6, 1, 16}, {11, 4, 2}, {4, 4, 16}};
  const float focus = 0.8f;
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (const Case& c : cases) {
      const double root = root_of(c.root, c.octave);
      const double width = width_of(focus) * root;
      setup(device, rate,
            {{p::kRoot, c.root}, {p::kOctave, c.octave}, {p::kLow, c.harmonic}, {p::kHigh, c.harmonic},
             {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, focus}, {p::kDrone, 0.0f}});
      rng_state() = 0xA11CEu;
      Stereo out = run(device, pink(static_cast<float>(0.5 + 18.5 / width), rate, 0.5f));
      const double want = root * c.harmonic;
      const double got = noise_centre(out.left, rate, want, width, static_cast<size_t>(0.4f * rate));
      worst = std::max(worst, std::fabs(got - want) / width);
      char label[160];
      std::snprintf(label, sizeof label,
                    "pink noise comes out centred on root %d octave %d times %d at %.0f Hz: %.2f Hz for %.2f", c.root,
                    c.octave, c.harmonic, rate, got, want);
      // Within a quarter of the resonance's own width, which is a tenth of the root here.
      EXPECT(std::fabs(got - want) < 0.25 * width, label);
    }
  }
  std::printf("  pink noise through five roots, octaves and harmonics at three rates: centred within %.3f of the "
              "resonance's width (a tenth of a root) of root times harmonic\n",
              worst);
  EXPECT_NEAR(root_of(9, 3), 220.0, 1.0e-9, "A in octave 3 is 220 Hz");
  EXPECT_NEAR(root_of(0, 4), 261.6256, 1.0e-3, "C in octave 4 is middle C");
}

// Each Pattern visits the harmonics from Low to High in its own order.
static void test_patterns() {
  const double root = root_of(0, 3);
  const float pace = 5.0f;
  const int steps = 40;
  auto melody = [&](int pattern, int low, int high) {
    setup(device, kRate,
          {{p::kLow, low}, {p::kHigh, high}, {p::kPattern, pattern}, {p::kPace, pace}, {p::kGlide, 20.0f},
           {p::kFocus, 0.9f}, {p::kDrone, 0.0f}});
    rng_state() = 0xD06u;
    Stereo out = run(device, pink(static_cast<float>(steps) / pace, kRate, 0.5f));
    return sung(out.left, root, kRate, pace, steps);
  };

  {
    const std::vector<int> got = melody(OvertoneSinger::kUpAndDown, 5, 9);
    bool ok = true;
    const int want[8] = {5, 6, 7, 8, 9, 8, 7, 6};
    for (int k = 0; k < steps; ++k) ok = ok && got[k] == want[k % 8];
    if (!ok) print_list("up and down", got);
    EXPECT(ok, "Up and down climbs from Low to High and comes back, without sounding an end twice");
  }
  {
    const std::vector<int> got = melody(OvertoneSinger::kUp, 5, 9);
    bool ok = true;
    for (int k = 0; k < steps; ++k) ok = ok && got[k] == 5 + k % 5;
    if (!ok) print_list("up", got);
    EXPECT(ok, "Up climbs from Low to High and starts again at Low");
  }
  {
    const std::vector<int> got = melody(OvertoneSinger::kDown, 5, 9);
    bool ok = true;
    for (int k = 0; k < steps; ++k) ok = ok && got[k] == 9 - k % 5;
    if (!ok) print_list("down", got);
    EXPECT(ok, "Down starts on High, falls to Low and starts again at High");
  }
  {
    const std::vector<int> got = melody(OvertoneSinger::kWander, 5, 9);
    bool neighbours = true, inside = true, up = false, down = false, stays = false;
    bool seen[17] = {};
    for (int k = 0; k < steps; ++k) {
      inside = inside && got[k] >= 5 && got[k] <= 9;
      seen[got[k]] = true;
      if (k == 0) continue;
      const int move = got[k] - got[k - 1];
      neighbours = neighbours && move >= -1 && move <= 1;
      up = up || move == 1;
      down = down || move == -1;
      stays = stays || move == 0;
    }
    int distinct = 0;
    for (bool s : seen) distinct += s ? 1 : 0;
    print_list("wander sings", got);
    EXPECT(got[0] == 5, "Wander starts on Low");
    EXPECT(neighbours && inside, "Wander only ever moves to a neighbour, inside Low to High");
    EXPECT(up && down && stays && distinct >= 4, "Wander goes both ways, rests now and then, and gets about");
    EXPECT(melody(OvertoneSinger::kWander, 5, 9) == got, "Wander is the same melody after every init");
  }
  {
    const std::vector<int> got = melody(OvertoneSinger::kLeap, 5, 9);
    bool inside = true, moves = true, leaps = false;
    bool seen[17] = {};
    for (int k = 0; k < steps; ++k) {
      inside = inside && got[k] >= 5 && got[k] <= 9;
      seen[got[k]] = true;
      if (k == 0) continue;
      moves = moves && got[k] != got[k - 1];
      leaps = leaps || std::abs(got[k] - got[k - 1]) >= 2;
    }
    print_list("leap sings", got);
    EXPECT(inside && moves, "Leap lands somewhere else inside Low to High on every move");
    EXPECT(leaps && seen[5] && seen[6] && seen[7] && seen[8] && seen[9], "Leap jumps, and reaches every harmonic");
  }
  {
    const std::vector<int> got = melody(OvertoneSinger::kHold, 7, 11);
    bool ok = true;
    for (int k = 0; k < steps; ++k) ok = ok && got[k] == 7;
    EXPECT(ok, "Hold stays on the harmonic it is on");
  }
  {
    // Low over High is the same range.
    const std::vector<int> got = melody(OvertoneSinger::kUp, 9, 5);
    bool ok = true;
    for (int k = 0; k < steps; ++k) ok = ok && got[k] == 5 + k % 5;
    EXPECT(ok, "Low set above High is the same range");
  }
  {
    // The readings a display draws from say what the sound does.
    setup(device, kRate, {{p::kLow, 5}, {p::kHigh, 9}, {p::kPace, pace}, {p::kGlide, 20.0f}});
    const int want[8] = {5, 6, 7, 8, 9, 8, 7, 6};
    bool ok = true;
    const std::vector<float> most = noise(0.9f / pace, kRate, 0.1f);
    const std::vector<float> rest = noise(0.1f / pace, kRate, 0.1f);
    for (int k = 0; k < 16; ++k) {
      run(device, most);
      // Nine tenths through step k: the glide of 20 ms is long over.
      ok = ok && device.meter(0) == static_cast<float>(want[k % 8]) && device.meter(2) == device.meter(0) &&
           device.meter(1) == device.meter(0);
      run(device, rest);
    }
    EXPECT(ok, "the readings name the harmonic that is sung");
  }
}

// A move every 1 / Pace seconds, each taking Glide, at every rate.
static void test_timing() {
  for (float rate : {44100.0f, 96000.0f}) {
    for (float pace : {2.0f, 0.37f}) {
      setup(device, rate, {{p::kPace, pace}, {p::kGlide, 30.0f}});
      const int block = 16;
      std::vector<float> in(block, 0.05f);
      std::vector<double> moves;
      float last = device.meter(2);
      const size_t total = static_cast<size_t>(4.4 * rate / pace);
      for (size_t done = 0; done < total; done += block) {
        run(device, in, block);
        if (device.meter(2) != last) {
          last = device.meter(2);
          moves.push_back(static_cast<double>(done + block) / rate);
        }
      }
      bool ok = moves.size() == 4;
      for (size_t n = 0; n < moves.size(); ++n) {
        ok = ok && std::fabs(moves[n] - static_cast<double>(n + 1) / pace) <= 1.5 * block / rate;
      }
      char label[120];
      std::snprintf(label, sizeof label, "moves fall every 1 / Pace seconds (Pace %.2f at %.0f Hz)", pace, rate);
      EXPECT(ok, label);
    }
    for (float glide : {80.0f, 1500.0f}) {
      setup(device, rate, {{p::kPace, 0.5f}, {p::kGlide, glide}, {p::kLow, 6}, {p::kHigh, 12}});
      const int block = 8;
      std::vector<float> in(block, 0.05f);
      double left = -1.0, arrived = -1.0, half = -1.0;
      for (size_t done = 0; done < static_cast<size_t>(3.9 * rate); done += block) {
        run(device, in, block);
        const double t = static_cast<double>(done + block) / rate;
        const float at = device.meter(0);
        if (left < 0.0 && at != 6.0f) left = t;
        if (half < 0.0 && at >= 6.5f) half = t;
        if (arrived < 0.0 && at == 7.0f) arrived = t;
      }
      const double tolerance = 2.0 * block / rate;
      char label[160];
      std::snprintf(label, sizeof label,
                    "a move takes Glide (%.0f ms at %.0f Hz): leaves at %.4f s, half way at %.4f, there at %.4f", glide,
                    rate, left, half, arrived);
      // The first and the last three parts in ten thousand of a glide are under a float's step from its ends.
      EXPECT(std::fabs(left - 2.0) <= tolerance + glide * 0.001 * 0.0003 &&
                 std::fabs(arrived - (2.0 + glide * 0.001)) <= tolerance + glide * 0.001 * 0.0003 &&
                 std::fabs(half - (2.0 + glide * 0.0005)) <= tolerance,
             label);
    }
  }

  // Half way through a long glide the sound itself is half way.
  {
    const double root = root_of(0, 3);
    setup(device, kRate,
          {{p::kLow, 6}, {p::kHigh, 9}, {p::kPace, 0.5f}, {p::kGlide, 1600.0f}, {p::kFocus, 0.9f}, {p::kDrone, 0.0f}});
    rng_state() = 0x5EEDu;
    Stereo out = run(device, pink(4.0f, kRate, 0.5f));
    // 6 until 2 s, then 1.6 s on the way to 7; the middle is at 2.8 s.
    const double before = dominant_frequency(out.left, kRate, root * 4.0, root * 10.0, 72000, 93600);
    const double middle = dominant_frequency(out.left, kRate, root * 4.0, root * 10.0, 132000, 136800);
    const double after = dominant_frequency(out.left, kRate, root * 4.0, root * 10.0, 177600, 192000);
    std::printf("  a glide of 1.6 s from 6 to 7: %.2f, %.2f, %.2f times the root\n", before / root, middle / root,
                after / root);
    EXPECT(std::fabs(before / root - 6.0) < 0.05 && std::fabs(after / root - 7.0) < 0.05,
           "the resonance stands on a harmonic before and after a glide");
    EXPECT(std::fabs(middle / root - 6.5) < 0.12, "half way through a glide the resonance is half way between");
  }

  // A glide longer than a step never arrives: the resonance keeps moving.
  {
    setup(device, kRate, {{p::kPace, 2.0f}, {p::kGlide, 3000.0f}, {p::kLow, 4}, {p::kHigh, 12}});
    std::vector<float> in(64, 0.05f);
    int whole = 0, readings = 0;
    float lowest = 99.0f, highest = 0.0f;
    for (int n = 0; n < 6000; ++n) {
      run(device, in, 64);
      if (n < 1500) continue;
      const float at = device.meter(0);
      ++readings;
      if (at == std::floor(at)) ++whole;
      lowest = std::min(lowest, at);
      highest = std::max(highest, at);
    }
    EXPECT(whole < readings / 50 && lowest >= 4.0f && highest <= 12.0f && highest - lowest > 1.0f,
           "with Glide longer than a step the resonance never rests, and keeps inside Low to High");
  }
}

// Focus sets how wide the resonance is, as a share of the root and the same
// on every harmonic, and how strong.
static void test_focus() {
  const double root = root_of(0, 4);
  for (float focus : {0.0f, 0.4f, 0.8f, 1.0f}) {
    const double width_hz = width_of(focus) * root;
    const double centre = 8.0 * root;
    std::vector<double> probes;
    for (int n = -14; n <= 14; ++n) probes.push_back(centre + n * width_hz / 12.0);
    setup(device, kRate,
          {{p::kOctave, 4}, {p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, focus},
           {p::kDrone, 0.0f}});
    const float window = static_cast<float>(std::max(0.3, 50.0 / width_hz));
    std::vector<double> gains = measure_gains(device, kRate, 0.283 * root, probes, window + 0.6f, window);
    const double peak = gains[14];
    double lower = 0.0, upper = 0.0;
    for (size_t n = 1; n < gains.size(); ++n) {
      const double half = peak * std::sqrt(0.5);
      if (gains[n - 1] < half && gains[n] >= half) {
        lower = probes[n - 1] + (probes[n] - probes[n - 1]) * (half - gains[n - 1]) / (gains[n] - gains[n - 1]);
      }
      if (gains[n - 1] >= half && gains[n] < half) {
        upper = probes[n - 1] + (probes[n] - probes[n - 1]) * (half - gains[n - 1]) / (gains[n] - gains[n - 1]);
      }
    }
    double worst = 0.0;
    for (size_t n = 0; n < gains.size(); ++n) {
      worst = std::max(worst, std::fabs(db(gains[n]) - db(expected_gain(probes[n], 8.0, root, focus, 0.0, 1.0, kRate))));
    }
    std::printf("  Focus %.1f: lift %.2f dB (said %.2f), width %.2f Hz (said %.2f), worst of 29 points %.3f dB off\n",
                focus, db(peak), db(lift_of(focus)), upper - lower, width_hz, worst);
    char label[120];
    std::snprintf(label, sizeof label, "Focus %.1f lifts the centre by 14.14 / sqrt(width)", focus);
    EXPECT_NEAR(db(peak), db(lift_of(focus)), 0.25, label);
    std::snprintf(label, sizeof label, "Focus %.1f makes the resonance its share of the root wide", focus);
    EXPECT_NEAR((upper - lower) / width_hz, 1.0, 0.06, label);
    std::snprintf(label, sizeof label, "Focus %.1f: the resonance is the curve the header says", focus);
    EXPECT(worst < 0.3, label);
  }
  // The width is what Focus says at the top of the range at every rate: the
  // highest centre there is (B in octave 4 times 16, 7902 Hz) is a sixth of
  // the way round at 44.1 kHz, where a band-pass set by its analog Q comes
  // out a fifth narrower.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    const double top_root = root_of(11, 4);
    const double centre = 16.0 * top_root, width_hz = width_of(0.6) * top_root;
    setup(device, rate,
          {{p::kRoot, 11.0f}, {p::kOctave, 4}, {p::kLow, 16}, {p::kHigh, 16}, {p::kPattern, OvertoneSinger::kHold},
           {p::kFocus, 0.6f}, {p::kDrone, 0.0f}});
    std::vector<double> probes = {centre - 0.5 * width_hz, centre, centre + 0.5 * width_hz};
    std::vector<double> gains = measure_gains(device, rate, 40.0, probes, 1.2f, 0.6f);
    char label[200];
    std::snprintf(label, sizeof label,
                  "at %.0f Hz the resonance on 7902 Hz is 3 dB down half its width either side (%.2f and %.2f dB)", rate,
                  db(gains[0] / gains[1]), db(gains[2] / gains[1]));
    EXPECT(std::fabs(db(gains[0] / gains[1]) + 3.01) < 0.25 && std::fabs(db(gains[2] / gains[1]) + 3.01) < 0.25, label);
  }
  EXPECT_NEAR(db(lift_of(0.0)), 20.0, 0.01, "the lift at Focus 0 is 20 dB");
  EXPECT_NEAR(db(lift_of(1.0)), 36.02, 0.01, "the lift at Focus 1 is 36 dB");

  // The same width in Hz on the 4th harmonic as on the 16th, and the
  // harmonics either side as far down on both.
  {
    const double low_root = root_of(0, 2);
    const float focus = 0.5f;
    const double width_hz = width_of(focus) * low_root;
    double widths[2] = {0.0, 0.0}, sides[2] = {0.0, 0.0};
    int which = 0;
    for (int harmonic : {4, 16}) {
      const double centre = harmonic * low_root;
      std::vector<double> probes;
      for (int n = -10; n <= 10; ++n) probes.push_back(centre + n * width_hz / 12.0);
      probes.push_back(centre - low_root);
      probes.push_back(centre + low_root);
      setup(device, kRate,
            {{p::kOctave, 2}, {p::kLow, harmonic}, {p::kHigh, harmonic}, {p::kPattern, OvertoneSinger::kHold},
             {p::kFocus, focus}, {p::kDrone, 0.0f}});
      const float window = static_cast<float>(50.0 / width_hz);
      std::vector<double> gains = measure_gains(device, kRate, 0.283 * low_root, probes, window + 0.6f, window);
      const double half = gains[10] * std::sqrt(0.5);
      double lower = 0.0, upper = 0.0;
      for (size_t n = 1; n <= 20; ++n) {
        const double t = (half - gains[n - 1]) / (gains[n] - gains[n - 1]);
        if (gains[n - 1] < half && gains[n] >= half) lower = probes[n - 1] + (probes[n] - probes[n - 1]) * t;
        if (gains[n - 1] >= half && gains[n] < half) upper = probes[n - 1] + (probes[n] - probes[n - 1]) * t;
      }
      widths[which] = upper - lower;
      sides[which] = db(std::max(gains[21], gains[22]) / gains[10]);
      ++which;
    }
    std::printf("  Focus 0.5 on the 4th and the 16th harmonic: %.2f and %.2f Hz wide (said %.2f); the harmonic next "
                "door is %.1f and %.1f dB down\n",
                widths[0], widths[1], width_hz, sides[0], sides[1]);
    EXPECT_NEAR(widths[0] / width_hz, 1.0, 0.06, "the width on the 4th harmonic is its share of the root");
    EXPECT_NEAR(widths[1] / width_hz, 1.0, 0.06, "the width on the 16th harmonic is the same share of the root");
    EXPECT(sides[0] < -22.0 && sides[1] < -22.0 && std::fabs(sides[0] - sides[1]) < 3.0,
           "the harmonics either side are left as far behind on the 16th as on the 4th");
  }
}

// Drone sets what is left around the resonance and leaves its top alone.
static void test_drone() {
  const double root = root_of(0, 3);
  const float focus = 0.6f;
  for (float drone : {1.0f, 0.5f, 0.25f, 0.0f}) {
    std::vector<double> probes = {2.5 * root, 30.0 * root, 10.0 * root, 9.0 * root, 11.0 * root};
    // From the top out to the next harmonic: the skirt.
    for (int n = 1; n <= 24; ++n) probes.push_back((10.0 + 0.08 * n) * root);
    setup(device, kRate,
          {{p::kLow, 10}, {p::kHigh, 10}, {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, focus}, {p::kDrone, drone}});
    std::vector<double> gains = measure_gains(device, kRate, 0.283 * root, probes, 1.4f, 0.8f);
    const double around = drone * drone;
    double worst = 0.0, least = 1.0e9;
    for (size_t n = 0; n < gains.size(); ++n) {
      // With no drone the far points are the skirt alone, 50 dB down and under what the loud tone leaves there.
      if (n < 2 && drone == 0.0f) continue;
      worst = std::max(worst, std::fabs(db(gains[n]) - db(expected_gain(probes[n], 10.0, root, focus, drone, 1.0, kRate))));
      if (n >= 2) least = std::min(least, gains[n]);
    }
    std::printf("  Drone %.2f: %.2f and %.2f dB far from the resonance (said %.2f), %.2f dB on it, %.2f and %.2f dB on "
                "the harmonics next door, %.2f dB at the least out to the next one; worst of 29 points %.3f dB off the curve\n",
                drone, db(gains[0]), db(gains[1]), db(around), db(gains[2]), db(gains[3]), db(gains[4]), db(least),
                worst);
    char label[120];
    if (drone > 0.0f) {
      std::snprintf(label, sizeof label, "Drone %.2f leaves its square of the sound below the resonance", drone);
      // The resonance's skirt is still a few hundredths of the drone a few harmonics off.
      EXPECT_NEAR(db(gains[0]), db(around), 1.0, label);
      std::snprintf(label, sizeof label, "Drone %.2f leaves its square of the sound above the resonance", drone);
      EXPECT_NEAR(db(gains[1]), db(around), 1.0, label);
    } else {
      EXPECT(db(gains[0]) < -40.0 && db(gains[1]) < -40.0, "Drone 0 leaves only the resonance");
    }
    std::snprintf(label, sizeof label, "Drone %.2f leaves the top of the resonance where Focus put it", drone);
    EXPECT_NEAR(db(gains[2]), db(lift_of(focus)), 0.25, label);
    std::snprintf(label, sizeof label, "Drone %.2f: the skirt is the curve the header says", drone);
    EXPECT(worst < 0.3, label);
    if (drone > 0.0f) {
      // No dip beside the peak: the drone is whole from the top out to the
      // harmonics either side and beyond.
      std::snprintf(label, sizeof label,
                    "Drone %.2f: nothing from the top of the resonance to the next harmonic is under the drone (least "
                    "%.2f dB for %.2f)",
                    drone, db(least), db(around));
      EXPECT(db(least) > db(around) - 0.1, label);
    }
    if (drone == 1.0f) {
      EXPECT(db(gains[3]) > -0.1 && db(gains[4]) > -0.1 && db(gains[3]) < 8.0 && db(gains[4]) < 8.0,
             "with all the drone the harmonics next door are not turned down");
    }
  }
  // Mix adds the dry sound to that, in phase.
  {
    std::vector<double> probes = {2.5 * root, 10.0 * root, 10.2 * root, 9.7 * root};
    setup(device, kRate,
          {{p::kLow, 10}, {p::kHigh, 10}, {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 0.3f}, {p::kDrone, 0.3f},
           {p::kMix, 0.4f}});
    std::vector<double> gains = measure_gains(device, kRate, 0.283 * root, probes, 1.4f, 0.8f);
    double worst = 0.0;
    for (size_t n = 0; n < probes.size(); ++n) {
      worst = std::max(worst, std::fabs(db(gains[n]) - db(expected_gain(probes[n], 10.0, root, 0.3, 0.3, 0.4, kRate))));
    }
    EXPECT(worst < 0.2, "Mix crossfades between the dry sound and the wet, with their phases");
  }
}

// The ceiling: no setting makes a loud partial run away, and the device does
// the same at every level.
static void test_ceiling() {
  const double root = root_of(0, 3);
  const float centre = static_cast<float>(8.0 * root);
  for (float drone : {0.0f, 0.5f, 1.0f}) {
    double ratio[2] = {0.0, 0.0};
    int which = 0;
    for (float level : {1.0f, 0.01f}) {
      setup(device, kRate,
            {{p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 1.0f}, {p::kDrone, drone}});
      Stereo out = run(device, sine(centre, 6.0f, kRate, level));
      const double all = peak(out.left);
      const double early = peak(out.left, 24000, 72000);
      const double late = peak(out.left, 240000, 288000);
      const double most = (1.0 + 0.5 * drone * drone) * level;
      char label[200];
      std::snprintf(label, sizeof label,
                    "a tone of %.2f on the centre at Focus 1, Drone %.1f, never passes %.3f (peak %.4f) and holds (%.4f "
                    "then %.4f)",
                    level, drone, most, all, early, late);
      EXPECT(finite(out.left) && all <= most * 1.001 && late <= early * 1.01, label);
      std::snprintf(label, sizeof label, "a tone on the centre at Drone %.1f comes out at 1 + Drone squared / 2", drone);
      EXPECT_NEAR(late / level, 1.0 + 0.5 * drone * drone, 0.03, label);
      ratio[which++] = late / level;
      if (level == 1.0f) {
        std::snprintf(label, sizeof label, "the reading says how far the ceiling holds the resonance at Drone %.1f", drone);
        // The resonant part is the lift less the drone's own share.
        const double held = (1.0 - 0.5 * drone * drone) / (lift_of(1.0) - drone * drone);
        EXPECT_NEAR(device.meter(3), db(held), 0.5, label);
      }
    }
    EXPECT_NEAR(ratio[0] / ratio[1], 1.0, 0.01, "the device does the same to a tone 40 dB quieter");
  }
  // A full-scale square on the root at the fiercest settings.
  {
    setup(device, kRate,
          {{p::kLow, 2}, {p::kHigh, 16}, {p::kPattern, OvertoneSinger::kLeap}, {p::kPace, 8.0f}, {p::kGlide, 5.0f},
           {p::kFocus, 1.0f}, {p::kSpread, 1.0f}});
    std::vector<float> square(static_cast<size_t>(4.0f * kRate));
    for (size_t i = 0; i < square.size(); ++i) {
      square[i] = std::fmod(static_cast<double>(i) * root / kRate, 1.0) < 0.5 ? 1.0f : -1.0f;
    }
    Stereo out = run(device, square);
    // The resonant part is under half of the peak of a sine as strong as the
    // square (root 2), sample by sample, over the square itself.
    char label[160];
    std::snprintf(label, sizeof label,
                  "a full-scale square under a leaping melody at Focus 1 stays under 1 + half of root 2 (peak %.4f and %.4f)",
                  peak(out.left), peak(out.right));
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) <= 1.7072 && peak(out.right) <= 1.7072, label);
  }
  // At rest the reading is 0 dB, and a partial far under the ceiling is not held.
  {
    setup(device, kRate, {{p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold}});
    EXPECT(device.meter(3) == 0.0f, "nothing is held before any sound");
    std::vector<double> probes = {8.0 * root};
    measure_gains(device, kRate, 0.283 * root, probes, 1.0f, 0.5f);
    EXPECT(device.meter(3) == 0.0f, "a quiet partial in a loud sound is not held");
  }
}

// Sixteen harmonics of `hz` at the amplitudes `amp` gives.
static std::vector<float> partials(double hz, float seconds, float rate, const std::function<double(int)>& amp) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    double sum = 0.0;
    for (int n = 1; n <= 16; ++n) sum += amp(n) * std::sin(2.0 * kPi * hz * n * static_cast<double>(i) / rate + 0.7 * n);
    out[i] = static_cast<float>(sum);
  }
  return out;
}

// The ceiling goes with the sound: something loud that has passed does not
// leave it open, a note that dies away takes its whistle with it, and a loud
// partial under the melody does not duck the note after it.
static void test_ceiling_follows() {
  const double root = root_of(9, 2);
  const float hz = static_cast<float>(root);

  // A loud hit over a quiet pad: 0.4 s later the whistle is what it was.
  for (float drone : {1.0f, 0.0f}) {
    const Settings held = {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 8}, {p::kHigh, 8},
                           {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 0.6f}, {p::kDrone, drone}};
    const std::vector<float> pad = drone_of(hz, 5.0f, kRate, 0.02f);
    std::vector<float> hit = pad;
    rng_state() = 0x417u;
    const size_t at = static_cast<size_t>(2.0f * kRate);
    for (size_t i = 0; i < 1440; ++i) {
      hit[at + i] += static_cast<float>(0.9 * white() * std::exp(-(static_cast<double>(i) / kRate) / 0.008));
    }
    setup(device, kRate, held);
    Stereo plain = run(device, pad);
    setup(device, kRate, held);
    Stereo struck = run(device, hit);
    const size_t from = at + static_cast<size_t>(0.4f * kRate), to = at + static_cast<size_t>(0.5f * kRate);
    const double whistle = db(tone_level(struck.left, 8.0 * root, kRate, from, to) /
                              tone_level(plain.left, 8.0 * root, kRate, from, to));
    const size_t later = at + static_cast<size_t>(0.3f * kRate);
    const double most = db(peak(struck.left, later, pad.size()) / peak(plain.left, later, pad.size()));
    char label[220];
    std::snprintf(label, sizeof label,
                  "Drone %.0f: 0.4 s after a loud hit over a quiet pad the whistle is where it was (%+.2f dB), and "
                  "from 0.3 s on the output's peak too (%+.2f dB)",
                  drone, whistle, most);
    EXPECT(std::fabs(whistle) < 1.0 && std::fabs(most) < 1.0, label);
  }

  // A burst near the limit of what counts as sound, then a drone. The burst
  // rings in the resonance for a while, but a fifth of a second on it is
  // under the ceiling of the drone that is there now, and half a second on
  // nothing is left of it.
  {
    const Settings held = {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 8}, {p::kHigh, 8},
                           {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 1.0f}};
    const std::vector<float> after = drone_of(hz, 1.0f, kRate, 0.4f);
    rng_state() = 0xB0057u;
    setup(device, kRate, held);
    run(device, noise(0.03f, kRate, 3.9f));
    Stereo hot = run(device, after);
    setup(twin, kRate, held);
    run(twin, silence(0.03f, kRate));
    Stereo cold = run(twin, after);
    const double soon = peak(hot.left, 9600, 24000), bound = 1.5 * peak(after);
    const double ratio = peak(hot.left, 24000, 48000) / peak(cold.left, 24000, 48000);
    char label[220];
    std::snprintf(label, sizeof label,
                  "after a burst of 3.9 a drone stays under one and a half times its own peak from 0.2 s on (%.3f for "
                  "%.3f), and half a second on comes out as with nothing before it (%.4f of that)",
                  soon, bound, ratio);
    EXPECT(soon < bound && std::fabs(ratio - 1.0) < 0.02, label);
  }

  // A note dying away: the whistle does not rise against it.
  for (float drone : {1.0f, 0.0f}) {
    setup(device, kRate,
          {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold},
           {p::kFocus, 0.6f}, {p::kDrone, drone}});
    std::vector<float> note = drone_of(hz, 4.0f, kRate, 0.4f);
    for (size_t i = 48000; i < note.size(); ++i) {
      note[i] *= static_cast<float>(std::exp(-(static_cast<double>(i) - 48000.0) / (0.5 * kRate)));
    }
    Stereo out = run(device, note);
    auto over_note = [&](size_t from) {
      const size_t to = from + 2400;
      return db(tone_level(out.left, 8.0 * root, kRate, from, to) / rms(note, from, to));
    };
    const double held = over_note(38400), dying = over_note(48000 + 57600);
    char label[200];
    std::snprintf(label, sizeof label,
                  "Drone %.0f: the whistle stands %.2f dB against a held note and %.2f dB against the same note 1.2 s "
                  "into dying away",
                  drone, held, dying);
    EXPECT(dying - held < 2.0 && dying - held > -2.0, label);
  }

  // A fast melody over one strong partial (the 8th, 40 dB over the others it
  // sings): each note as loud as when the melody rests on it.
  {
    auto amp = [](int n) { return n == 1 ? 0.3 : (n == 8 ? 0.1 : 0.001); };
    for (float pace : {2.0f, 6.0f}) {
      const std::vector<float> in = partials(root, 15.0f / pace + 0.2f, kRate, amp);
      const Settings moving = {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 8}, {p::kHigh, 12},
                               {p::kPattern, OvertoneSinger::kUp}, {p::kPace, pace}, {p::kGlide, 20.0f},
                               {p::kFocus, 0.75f}};
      setup(device, kRate, moving);
      Stereo out = run(device, in);
      double worst = 0.0;
      int worst_harmonic = 0;
      for (int step = 5; step < 15; ++step) {
        const int harmonic = 8 + step % 5;
        const size_t from = static_cast<size_t>((step + 0.5) / pace * kRate);
        const size_t to = static_cast<size_t>((step + 0.95) / pace * kRate);
        setup(twin, kRate,
              {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, harmonic}, {p::kHigh, harmonic},
               {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 0.75f}});
        Stereo rest = run(twin, in);
        const double apart = db(tone_level(out.left, root * harmonic, kRate, from, to) /
                                tone_level(rest.left, root * harmonic, kRate, from, to));
        if (std::fabs(apart) > std::fabs(worst)) {
          worst = apart;
          worst_harmonic = harmonic;
        }
      }
      char label[200];
      std::snprintf(label, sizeof label,
                    "at Pace %.0f every note sung after a strong partial is as loud as when held (worst %+.2f dB, on "
                    "the %dth)",
                    pace, worst, worst_harmonic);
      EXPECT(std::fabs(worst) < (pace > 4.0f ? 3.0 : 0.5), label);
    }
  }
}

// With all the Drone the drone is whole while the ceiling holds the whistle
// too: no harmonic of a rich drone is turned down, with the melody held or
// passing.
static void test_whole_drone() {
  const double root = root_of(9, 2);
  const std::vector<float> in = drone_of(static_cast<float>(root), 4.0f, kRate, 0.4f);
  for (float focus : {0.3f, 0.6f, 1.0f}) {
    setup(device, kRate,
          {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold},
           {p::kFocus, focus}});
    Stereo out = run(device, in);
    double least = 99.0, sung = 0.0;
    int where = 0;
    for (int n = 1; n <= 16; ++n) {
      const double gain = db(tone_level(out.left, root * n, kRate, 96000, in.size()) /
                             tone_level(in, root * n, kRate, 96000, in.size()));
      if (n == 8) sung = gain;
      if (n != 8 && gain < least) {
        least = gain;
        where = n;
      }
    }
    char label[200];
    std::snprintf(label, sizeof label,
                  "Focus %.1f on a drone of sixteen harmonics, the ceiling holding (%.1f dB): the sung one %+.1f dB, the "
                  "least of the others %+.2f dB (the %dth)",
                  focus, device.meter(3), sung, least, where);
    EXPECT(device.meter(3) < -3.0f && sung > 6.0 && least > -0.6, label);
  }
  {
    const std::vector<float> longer = drone_of(static_cast<float>(root), 13.0f, kRate, 0.4f);
    setup(device, kRate,
          {{p::kRoot, 9.0f}, {p::kOctave, 2.0f}, {p::kLow, 6}, {p::kHigh, 12}, {p::kPace, 1.0f}, {p::kGlide, 250.0f},
           {p::kFocus, 0.6f}});
    Stereo out = run(device, longer);
    double least = 99.0;
    int where = 0;
    for (int n = 4; n <= 14; ++n) {
      for (size_t from = 24000; from + 9600 <= longer.size(); from += 4800) {
        const double gain = db(tone_level(out.left, root * n, kRate, from, from + 9600) /
                               tone_level(longer, root * n, kRate, from, from + 9600));
        if (gain < least) {
          least = gain;
          where = n;
        }
      }
    }
    char label[200];
    std::snprintf(label, sizeof label,
                  "as the melody passes over a drone no harmonic is ever turned down (least %+.2f dB, the %dth, in a "
                  "fifth of a second)",
                  least, where);
    EXPECT(least > -1.0, label);
  }
}

// Level: about what came in, at the defaults, on the two things it is for.
static void test_level() {
  const float root = static_cast<float>(root_of(9, 2));
  device.init(kRate);
  rng_state() = 0xF00Du;
  std::vector<float> hiss = pink(8.0f, kRate, 0.5f);
  Stereo out = run(device, hiss);
  const double on_noise = db(rms(out.left, 48000) / rms(hiss, 48000));
  device.init(kRate);
  std::vector<float> saws = drone_of(root, 8.0f, kRate, 0.5f);
  out = run(device, saws);
  const double on_drone = db(rms(out.left, 48000) / rms(saws, 48000));
  const double drone_peak = db(peak(out.left) / peak(saws));
  std::printf("  at the defaults: pink noise comes out %.2f dB over itself, a drone on the root %.2f dB (peak %.2f dB)\n",
              on_noise, on_drone, drone_peak);
  EXPECT(on_noise > -0.5 && on_noise < 3.5, "the defaults leave pink noise within a few dB of how it came");
  EXPECT(on_drone > -0.5 && on_drone < 3.5, "the defaults leave a drone on the root within a few dB of how it came");

  // And they do sing: on the drone, the harmonic the melody is on stands out
  // of the ones either side by more than it did.
  device.init(kRate);
  out = run(device, saws);
  // Step 1 is the 7th harmonic (1 s to 2 s; the move there takes the first quarter second).
  const double before = db(tone_level(saws, 7.0 * root, kRate, 64000, 94000) /
                           tone_level(saws, 6.0 * root, kRate, 64000, 94000));
  const double after = db(tone_level(out.left, 7.0 * root, kRate, 64000, 94000) /
                          tone_level(out.left, 6.0 * root, kRate, 64000, 94000));
  std::printf("  the 7th harmonic of the drone against the 6th: %.1f dB in, %.1f dB out\n", before, after);
  EXPECT(after - before > 12.0, "at the defaults the sung harmonic stands 12 dB further out of a drone");
}

// Mix 0 is the input, sample for sample, while the melody runs.
static void test_dry() {
  setup(device, kRate, {{p::kMix, 0.0f}, {p::kPace, 6.0f}, {p::kPattern, OvertoneSinger::kLeap}, {p::kSpread, 0.5f}});
  rng_state() = 0xD27u;
  std::vector<float> in = noise(2.0f, kRate, 0.7f);
  Stereo out = run(device, in);
  EXPECT(out.left == in && out.right == in, "Mix 0 is the input, sample for sample");
}

// Spread: the right side takes each note late, a whole step late at 1.
static void test_spread() {
  const double root = root_of(0, 3);
  const float pace = 5.0f;
  const int steps = 12;
  setup(device, kRate,
        {{p::kLow, 5}, {p::kHigh, 9}, {p::kPattern, OvertoneSinger::kUp}, {p::kPace, pace}, {p::kGlide, 20.0f},
         {p::kFocus, 0.9f}, {p::kDrone, 0.0f}, {p::kSpread, 1.0f}});
  rng_state() = 0x57EEu;
  Stereo out = run(device, pink(static_cast<float>(steps) / pace, kRate, 0.5f));
  const std::vector<int> left = sung(out.left, root, kRate, pace, steps);
  const std::vector<int> right = sung(out.right, root, kRate, pace, steps);
  bool ok = right[0] == left[0];
  for (int k = 1; k < steps; ++k) ok = ok && right[k] == left[k - 1];
  if (!ok) {
    print_list("left", left);
    print_list("right", right);
  }
  EXPECT(ok, "at Spread 1 the right side sings what the left sang a step ago");

  setup(device, kRate, {{p::kPace, pace}, {p::kGlide, 20.0f}, {p::kPattern, OvertoneSinger::kLeap}, {p::kSpread, 0.0f}});
  rng_state() = 0x57EEu;
  out = run(device, pink(3.0f, kRate, 0.5f));
  EXPECT(out.left == out.right, "at Spread 0 the two sides are the same, sample for sample");

  // At 0.3 the right side leaves 0.3 of a step after the left.
  setup(device, kRate, {{p::kPace, 2.0f}, {p::kGlide, 30.0f}, {p::kSpread, 0.3f}});
  std::vector<float> in(16, 0.05f);
  double left_at = -1.0, right_at = -1.0;
  for (size_t done = 0; done < 48000; done += 16) {
    run(device, in, 16);
    const double t = static_cast<double>(done + 16) / kRate;
    if (left_at < 0.0 && device.meter(0) != 6.0f) left_at = t;
    if (right_at < 0.0 && device.meter(1) != 6.0f) right_at = t;
  }
  EXPECT(std::fabs(left_at - 0.5) < 0.001 && std::fabs(right_at - 0.65) < 0.001,
         "at Spread 0.3 the right side moves 0.3 of a step after the left");
}

// Samples that are not sound do not stick.
static void test_bad_input() {
  const float centre = static_cast<float>(8.0 * root_of(0, 3));
  for (float mix : {1.0f, 0.5f}) {
    const Settings settings = {{p::kLow, 8}, {p::kHigh, 8}, {p::kPattern, OvertoneSinger::kHold}, {p::kFocus, 1.0f},
                               {p::kDrone, 0.0f}, {p::kMix, mix}};
    setup(device, kRate, settings);
    setup(twin, kRate, settings);
    std::vector<float> start = sine(centre, 0.5f, kRate, 0.25f);
    run(device, start);
    run(twin, start);
    std::vector<float> bad(4800, 0.0f);
    const float values[6] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f, 1.0e-39f};
    for (size_t i = 0; i < bad.size(); ++i) bad[i] = values[(i / 7) % 6];
    Stereo during = run(device, bad);
    run(twin, silence(0.1f, kRate));
    std::vector<float> good = sine(centre, 2.0f, kRate, 0.25f);
    Stereo after = run(device, good);
    Stereo reference = run(twin, good);
    char label[200];
    std::snprintf(label, sizeof label,
                  "Mix %.1f: bad samples give numbers (peak %.2f), and the first good sample too", mix,
                  std::max(peak(during.left), peak(during.right)));
    EXPECT(finite(during.left) && finite(during.right) && finite(after.left) && finite(after.right) &&
               peak(during.left) <= 12.0,
           label);
    std::snprintf(label, sizeof label,
                  "Mix %.1f: 0.25 s after bad input the tone comes out under 0.5 again (peak %.3f), and after a second "
                  "as from a device that never had it (%.4f against %.4f)",
                  mix, peak(after.left, 12000, 24000), rms(after.left, 72000), rms(reference.left, 72000));
    EXPECT(peak(after.left, 12000, 24000) < 0.5 &&
               std::fabs(rms(after.left, 72000) / rms(reference.left, 72000) - 1.0) < 0.01,
           label);
  }
}

// The same sound at every block size, across a silence of any length, with
// a knob moved in the silence and the melody running through it.
static void test_blocks_and_sleep() {
  const Settings settings = {{p::kPattern, OvertoneSinger::kWander}, {p::kPace, 7.3f}, {p::kGlide, 120.0f},
                             {p::kLow, 4}, {p::kHigh, 13}, {p::kSpread, 0.4f}, {p::kFocus, 0.8f}, {p::kDrone, 0.6f}};
  const float root = static_cast<float>(root_of(0, 3));
  const std::vector<std::vector<int>> shapes = {{128}, {1}, {2048}, {1, 7, 64, 128, 33, 512, 2048, 5}, {32}, {512}};
  double worst = 0.0;
  int slept = 0, rested = 0, cases = 0;
  // When, after the first sound, the device is at rest and when it sleeps.
  setup(device, kRate, settings);
  run(device, drone_of(root, 0.6f, kRate, 0.4f));
  int rests_ms = 0, sleeps_ms = 0;
  for (int ms = 1; ms <= 2000 && sleeps_ms == 0; ++ms) {
    render(device, 0.001f, kRate, 48);
    if (rests_ms == 0 && device.at_rest()) rests_ms = ms;
    if (device.asleep()) sleeps_ms = ms;
  }
  // Silences from before the one to after the other, 20 ms apart: a knob
  // moved in them glides, lands at rest, or lands asleep, and the sound that
  // follows finds the device awake or asleep by the block size.
  for (int gap_ms = rests_ms - 100; gap_ms <= sleeps_ms + 120; gap_ms += 20) {
    for (int extra : {0, 1}) {
      const size_t first = static_cast<size_t>(0.6f * kRate);
      const size_t gap = static_cast<size_t>(gap_ms * 0.001f * kRate) + (extra ? 61 : 0);
      std::vector<float> input = drone_of(root, 0.6f, kRate, 0.4f);
      input.resize(first + gap, 0.0f);
      const std::vector<float> second = drone_of(root * 1.5f, 0.7f, kRate, 0.4f);
      input.insert(input.end(), second.begin(), second.end());
      // Three knobs move 2 ms before the sound returns.
      const size_t knob_at = first + gap - 96;
      auto between = [&](OvertoneSinger& d, size_t from, size_t to) {
        if (knob_at >= from && knob_at < to) {
          d.set_param(p::kMix, 0.55f);
          d.set_param(p::kFocus, 0.3f);
          d.set_param(p::kOctave, 2.0f);
          d.set_param(p::kHigh, 6.0f);
        }
      };
      Stereo reference;
      for (size_t shape = 0; shape < shapes.size(); ++shape) {
        setup(device, kRate, settings);
        // The knob lands on a block edge in the reference; every other shape
        // gets it at the first edge after, so cut the input there.
        std::vector<int> sizes = shapes[shape];
        Stereo out;
        {
          const std::vector<float> head(input.begin(), input.begin() + static_cast<long>(knob_at));
          const std::vector<float> tail(input.begin() + static_cast<long>(knob_at), input.end());
          Stereo a = run_blocks(device, head, sizes, nullptr);
          if (shape == 0) {
            ++cases;
            slept += device.asleep() ? 1 : 0;
            rested += device.at_rest() ? 1 : 0;
          }
          between(device, knob_at, knob_at + 1);
          Stereo b = run_blocks(device, tail, sizes, nullptr);
          out = concat(a, b);
        }
        if (shape == 0) {
          reference = out;
        } else {
          worst = std::max(worst, max_diff(out, reference));
        }
      }
    }
  }
  std::printf("  block sizes 1, 32, 128, 512, 2048 and ragged over %d silences (at the knob: gliding in %d, at rest "
              "and awake in %d, asleep in %d): worst difference %.3g\n",
              cases, cases - rested, rested - slept, slept, worst);
  EXPECT(cases - rested >= 6 && rested - slept >= 6 && slept >= 6,
         "the silences fall before the device is at rest, between that and sleep, and after");
  EXPECT(worst < 1.0e-6, "the sound is the same at every block size, across a silence with knobs moved in it");
}

// A knob moved in a silence is in place for the next sound, and the melody
// went on through the silence.
static void test_rest() {
  const float centre = static_cast<float>(9.0 * root_of(9, 2));
  const std::vector<float> note = drone_of(centre / 9.0f, 0.5f, kRate, 0.4f);
  const Settings before = {{p::kPattern, OvertoneSinger::kHold}, {p::kLow, 5}, {p::kHigh, 5}};
  const Settings after = {{p::kPattern, OvertoneSinger::kHold}, {p::kLow, 9}, {p::kHigh, 9}, {p::kRoot, 9.0f},
                          {p::kOctave, 2.0f}, {p::kFocus, 0.95f}, {p::kDrone, 0.2f}, {p::kMix, 0.7f},
                          {p::kSpread, 0.5f}};
  setup(twin, kRate, after);
  const Stereo fresh = run(twin, note);

  // How long after the sound stops the device is at rest, and asleep.
  setup(device, kRate, before);
  run(device, note);
  size_t rests_after = 0, sleeps_after = 0;
  for (size_t done = 0; done < 96000 && sleeps_after == 0; done += 16) {
    render(device, 16.0f / kRate, kRate, 16);
    if (rests_after == 0 && device.at_rest()) rests_after = done + 16;
    if (device.asleep()) sleeps_after = done + 16;
  }
  std::printf("  at the defaults, at rest %.3f s after the sound stops and asleep after %.3f s\n",
              static_cast<double>(rests_after) / kRate, static_cast<double>(sleeps_after) / kRate);
  EXPECT(rests_after > 9600 && sleeps_after < 48000, "the device sleeps once the resonance has rung out, within a second");
  EXPECT(sleeps_after - rests_after >= 9600 - 16 && sleeps_after - rests_after <= 9600 + 16,
         "asleep comes 0.2 s after at rest, so every smoother has landed by then");
  Stereo rest = render(device, 0.5f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep is exact silence");

  // Asleep: put there off the beat of any block.
  setup(device, kRate, before);
  run(device, note);
  device.process(13);
  render(device, 2.0f, kRate);
  EXPECT(device.asleep(), "asleep two seconds after the sound");
  for (const auto& setting : after) device.set_param(setting.first, setting.second);
  Stereo woken = run(device, note);
  const double apart = max_diff(woken, fresh);
  std::printf("  nine knobs moved in a silence: the next sound is %.3g from a device set that way from the start\n",
              apart);
  EXPECT(apart < 1.0e-6, "knobs moved in a silence have landed when the sound returns");
  EXPECT(peak(woken.left) > 0.01 && !device.asleep(), "wakes on new input");

  // Awake but at rest: a tenth of a second before the gate fires.
  setup(device, kRate, before);
  run(device, note);
  run(device, std::vector<float>(sleeps_after - 4800, 0.0f));
  EXPECT(device.at_rest() && !device.asleep(), "a tenth of a second before it sleeps the device is at rest and awake");
  for (const auto& setting : after) device.set_param(setting.first, setting.second);
  woken = run(device, note);
  EXPECT(max_diff(woken, fresh) < 1.0e-6, "knobs moved at rest, before the gate has fired, have landed too");

  // Not yet at rest (the resonance has only just rung out): a knob still glides.
  setup(device, kRate, before);
  run(device, note);
  run(device, std::vector<float>(rests_after - 2400, 0.0f));
  EXPECT(!device.at_rest(), "a twentieth of a second earlier it is not at rest");

  // Under sound a knob glides: the same move made in a held drone is not there at once.
  setup(device, kRate, before);
  const std::vector<float> held = drone_of(centre / 9.0f, 1.0f, kRate, 0.4f);
  run(device, held);
  device.set_param(p::kMix, 0.0f);
  Stereo moving = run(device, std::vector<float>(held.begin(), held.begin() + 64));
  double away = 0.0;
  for (size_t i = 0; i < 8; ++i) away = std::max(away, std::fabs(static_cast<double>(moving.left[i]) - held[i]));
  EXPECT(away > 1.0e-3, "under sound a knob glides to its place");

  // The melody is counted through a sleep: a device that slept is where one
  // that was kept awake is.
  const Settings melody = {{p::kPattern, OvertoneSinger::kWander}, {p::kPace, 3.1f}, {p::kGlide, 700.0f},
                           {p::kSpread, 0.6f}};
  setup(device, kRate, melody);
  setup(twin, kRate, melody);
  run(device, note);
  run(twin, note);
  Stereo asleep = render(device, 7.3f, kRate);
  run(twin, std::vector<float>(asleep.size(), 1.0e-4f));
  EXPECT(device.asleep() && !twin.asleep() && peak(asleep.left, 96000) == 0.0, "the device sleeps through the silence");
  EXPECT(device.meter(0) == twin.meter(0) && device.meter(1) == twin.meter(1) && device.meter(2) == twin.meter(2),
         "the melody is where it would be after a sleep, glide and all");
}

// Nothing clicks: every control moved across its range under a held drone
// comes in gradually, measured against the same passage with no move in it.
static void test_clicks() {
  const float root = static_cast<float>(root_of(0, 3));
  rng_state() = 0xC11Cu;
  std::vector<float> input = drone_of(root, 3.0f, kRate, 0.4f);
  const std::vector<float> hiss = pink(3.0f, kRate, 0.1f);
  for (size_t i = 0; i < input.size(); ++i) input[i] += hiss[i];
  const Settings base = {{p::kPace, 1.0f}, {p::kFocus, 0.7f}, {p::kDrone, 0.7f}};
  struct Move {
    const char* name;
    int id;
    float value;
  };
  const Move moves[] = {
      {"Root", p::kRoot, 6.0f},       {"Root to its top", p::kRoot, 11.0f}, {"Octave down", p::kOctave, 1.0f},
      {"Octave up", p::kOctave, 4.0f}, {"Low", p::kLow, 12.0f},              {"High", p::kHigh, 2.0f},
      {"Pattern to Up", p::kPattern, 1.0f}, {"Pattern to Down", p::kPattern, 2.0f},
      {"Pattern to Wander", p::kPattern, 3.0f}, {"Pattern to Leap", p::kPattern, 4.0f},
      {"Pattern to Hold", p::kPattern, 5.0f}, {"Pace", p::kPace, 8.0f},    {"Glide", p::kGlide, 5.0f},
      {"Focus up", p::kFocus, 1.0f},  {"Focus down", p::kFocus, 0.0f},      {"Drone", p::kDrone, 0.0f},
      {"Spread", p::kSpread, 1.0f},   {"Mix", p::kMix, 0.0f},
  };
  double worst = 0.0;
  const char* worst_name = "";
  for (const Move& move : moves) {
    // 1.3 s in: a glide of the melody is under way (it left at 1 s).
    const double sudden =
        suddenness(kRate, base, input, 1.1f, [&](OvertoneSinger& d) { d.set_param(move.id, move.value); });
    if (sudden > worst) {
      worst = sudden;
      worst_name = move.name;
    }
    char label[160];
    std::snprintf(label, sizeof label, "%s moved under a drone comes in gradually (%.3f of the change in 8 samples)",
                  move.name, sudden);
    EXPECT(sudden < 0.15, label);
  }
  std::printf("  the most sudden of %d knob moves under a drone: %s, %.3f of its change in the first 8 samples\n",
              static_cast<int>(sizeof moves / sizeof moves[0]), worst_name, worst);

  // The melody's own moves at the shortest Glide, against the same passage
  // held on its first note: what a move does comes in gradually too.
  {
    const Settings leaping = {{p::kPattern, OvertoneSinger::kLeap}, {p::kPace, 4.0f}, {p::kGlide, 5.0f}, {p::kLow, 2},
                              {p::kHigh, 16}, {p::kFocus, 0.8f}, {p::kSpread, 0.5f}};
    setup(device, kRate, leaping);
    Stereo moved = run(device, input);
    setup(device, kRate, leaping);
    device.set_param(p::kPattern, OvertoneSinger::kHold);
    Stereo stayed = run(device, input);
    size_t first = 0;
    while (first < moved.size() && std::fabs(moved.left[first] - stayed.left[first]) <= 1.0e-7) ++first;
    double early = 0.0, whole = 0.0;
    for (size_t i = first; i < first + 960 && i < moved.size(); ++i) {
      const double diff = std::fabs(static_cast<double>(moved.left[i]) - stayed.left[i]);
      if (i < first + 8) early = std::max(early, diff);
      whole = std::max(whole, diff);
    }
    std::printf("  the melody's first move at the shortest Glide (at %.4f s): %.4f of its change in the first 8 samples\n",
                static_cast<double>(first) / kRate, early / whole);
    EXPECT(std::fabs(static_cast<double>(first) / kRate - 0.25) < 0.002, "the first move falls a step after the start");
    EXPECT(whole > 0.01 && early / whole < 0.15, "a move of the melody at the shortest Glide comes in gradually");

    // And on a pure tone nothing steps further than a tone as loud on the
    // highest harmonic could: a coarse bound, for a jump the above missed.
    setup(device, kRate, leaping);
    device.set_param(p::kPace, 8.0f);
    std::vector<float> tone = sine(8.0f * root, 3.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    const double own = 2.0 * kPi * 16.0 * root / kRate * std::max(peak(out.left), peak(out.right));
    std::printf("  a tone under a leaping melody at the shortest Glide: largest step %.4f (bound %.4f)\n",
                std::max(max_step(out.left), max_step(out.right)), own);
    EXPECT(max_step(out.left) < own && max_step(out.right) < own,
           "the melody's own moves at the shortest Glide add no step");
  }
}

// Reading the meters changes nothing.
static void test_readings() {
  const Settings settings = {{p::kPattern, OvertoneSinger::kLeap}, {p::kPace, 6.0f}, {p::kSpread, 0.5f}};
  rng_state() = 0x3E7Eu;
  const std::vector<float> in = pink(2.0f, kRate, 0.5f);
  setup(device, kRate, settings);
  Stereo plain = run(device, in);
  setup(device, kRate, settings);
  Stereo read = run_blocks(device, in, {128}, [](OvertoneSinger& d, size_t, size_t) {
    for (int index = -1; index < 6; ++index) (void)d.meter(index);
  });
  EXPECT(read.left == plain.left && read.right == plain.right, "reading the meters changes no sample");
  const OvertoneSinger& fixed = device;
  EXPECT(fixed.meter(7) == 0.0f && fixed.meter(-1) == 0.0f, "an unknown reading is 0");
}

int main() {
  Conformance spec;
  spec.name = "overtone-singer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  // The device's own bound on the kit's noise of 0.9: the noise itself and
  // half of root 2 times its root mean square (0.52) on top, 1.27.
  spec.max_peak = 1.36f;
  check_effect(device, spec, kRate);

  test_series();
  test_patterns();
  test_timing();
  test_focus();
  test_drone();
  test_ceiling();
  test_ceiling_follows();
  test_whole_drone();
  test_level();
  test_dry();
  test_spread();
  test_bad_input();
  test_blocks_and_sleep();
  test_rest();
  test_clicks();
  test_readings();

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("overtone-singer", 10.0f, kRate, [&] { run(device, input); });
  // The worst there is: both sides gliding all the time, on different notes.
  setup(device, kRate,
        {{p::kPattern, OvertoneSinger::kLeap}, {p::kPace, 8.0f}, {p::kGlide, 4000.0f}, {p::kSpread, 0.5f},
         {p::kLow, 2}, {p::kHigh, 16}});
  report_cost("overtone-singer, both sides gliding", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  run(device, noise(0.1f, kRate, 0.25f));
  render(device, 3.0f, kRate);
  report_cost("overtone-singer, asleep", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("overtone-singer");
}
