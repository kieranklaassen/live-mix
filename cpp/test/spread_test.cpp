// Native harness for Spread (cpp/devices/spread). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it width by frequency.

#include <algorithm>
#include <complex>
#include <cstdlib>
#include <cstring>

#include "../devices/spread/spread.h"
// The dry electric piano the bank measures every chain with: its phrase is played here too.
#include "../devices/tine-piano/tine_piano.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Spread;
namespace p = livemix::spread;

static Spread device;

static const float kRate = 48000.0f;

// --- the curve as the header's notes give it, worked out apart from the device ---------------

// One stage: A at `low_hz`, B at `high_hz`, gains l, m, h (this stage's
// share of each width). Each part of a critically damped split is a real share of the two
// allpasses, P = 1 / (1 + w²) below a corner and 1 - P above it.
static double stage_gain(double hz, double low_hz, double high_hz, double l, double m, double h,
                         double rate) {
  auto share = [&](double corner) {
    const double top = 0.45 * rate;  // kTopOfRange
    const double w = std::tan(kPi * hz / rate) / std::tan(kPi * std::min(corner, top) / rate);
    return 1.0 / (1.0 + w * w);
  };
  const double pa = share(low_hz), pb = share(high_hz);
  return l * pa + (1.0 - pa) * (m * pb + h * (1.0 - pb));
}

// The gain on the sides at `hz` for the six settings of the curve.
static double curve(double hz, double low, double mid, double high, double low_hz, double high_hz,
                    double slope, double rate = kRate) {
  // Stage two gives a region 1 + slope·(sqrt(width) - 1), stage one the rest.
  double first[3], second[3];
  const double width[3] = {low, mid, high};
  for (int j = 0; j < 3; ++j) {
    second[j] = 1.0 + slope * (std::sqrt(width[j]) - 1.0);
    first[j] = second[j] > 0.0 ? width[j] / second[j] : 0.0;
  }
  return stage_gain(hz, low_hz, high_hz, first[0], first[1], first[2], rate) *
         stage_gain(hz, low_hz, high_hz, second[0], second[1], second[2], rate);
}

// What Make at 1 puts beside a mono sound at `hz`, against its middle: the
// same curve for what each width has over 1.
static double made_curve(double hz, double low, double mid, double high, double low_hz,
                         double high_hz, double slope, double rate = kRate) {
  return curve(hz, std::max(low - 1.0, 0.0), std::max(mid - 1.0, 0.0), std::max(high - 1.0, 0.0),
               low_hz, high_hz, slope, rate);
}

// --- driving it -------------------------------------------------------------------------------

struct Setting {
  float low = 1.0f, mid = 1.0f, high = 1.0f, low_hz = 180.0f, high_hz = 3200.0f, slope = 0.5f;
  float make = 0.0f, smear = 0.4f, safe = 0.0f, output = 0.0f;
};

static void set(Spread& d, const Setting& s, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kLow, s.low);
  d.set_param(p::kMid, s.mid);
  d.set_param(p::kHigh, s.high);
  d.set_param(p::kLowHz, s.low_hz);
  d.set_param(p::kHighHz, s.high_hz);
  d.set_param(p::kSlope, s.slope);
  d.set_param(p::kMake, s.make);
  d.set_param(p::kSmear, s.smear);
  d.set_param(p::kSafe, s.safe);
  d.set_param(p::kOutput, s.output);
}

static std::vector<float> negated(const std::vector<float>& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = -x[i];
  return out;
}

static std::vector<float> middle(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}

static std::vector<float> sides(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = 0.5f * (x.left[i] - x.right[i]);
  return out;
}

// RMS of `x` in a narrow band around `hz` (a band-pass run six times, so
// that what lies two octaves off is 100 dB down and a region at 0 can be
// told from its loud neighbour), after the first tenth of a second.
static double band_rms(const std::vector<float>& x, double hz, double rate = kRate) {
  livemix::kit::Svf pass[6];
  for (livemix::kit::Svf& filter : pass) {
    filter.set(static_cast<float>(hz), 2.1f, static_cast<float>(rate));
  }
  double sum = 0.0;
  size_t count = 0;
  const size_t from = static_cast<size_t>(0.1 * rate);
  for (size_t i = 0; i < x.size(); ++i) {
    float y = x[i];
    for (livemix::kit::Svf& filter : pass) y = filter.bandpass(y);
    if (i >= from) {
      sum += static_cast<double>(y) * y;
      ++count;
    }
  }
  return count > 0 ? std::sqrt(sum / static_cast<double>(count)) : 0.0;
}

// The gain on a side tone at `hz`, measured: a tone on the sides alone, half a second.
static double side_gain(Spread& d, const Setting& s, double hz, float rate = kRate) {
  set(d, s, rate);
  const std::vector<float> tone = sine(static_cast<float>(hz), 0.6f, rate, 0.5f);
  Stereo out = run(d, tone, negated(tone));
  const size_t from = static_cast<size_t>(0.3f * rate);
  return tone_level(sides(out), hz, rate, from) / 0.5;
}

// A pad for the checks that need played sound: seven notes of twelve partials
// each, mono, or with every partial leaning to one side and a little out of
// tune between the two.
static Stereo pad(float seconds, bool wide, float level = 0.25f) {
  const size_t n = static_cast<size_t>(seconds * kRate);
  Stereo s;
  s.left.assign(n, 0.0f);
  s.right.assign(n, 0.0f);
  const double notes[] = {55.0, 110.0, 164.81, 220.0, 277.18, 329.63, 440.0};
  rng_state() = 0x9AD5u;
  double norm = 0.0;
  for (double f0 : notes) {
    for (int h = 1; h <= 12; ++h) {
      const double a = 1.0 / h, f = f0 * h;
      const double detune = wide ? 1.0 + 0.002 * white() : 1.0;
      const double lean = wide ? 0.6 * white() : 0.0;
      const double phase = kPi * white();
      const double gl = a * std::sqrt(0.5 * (1.0 + lean)), gr = a * std::sqrt(0.5 * (1.0 - lean));
      norm += a * a;
      for (size_t i = 0; i < n; ++i) {
        const double t = static_cast<double>(i) / kRate;
        s.left[i] += static_cast<float>(gl * std::sin(2.0 * kPi * f * t + phase));
        s.right[i] += static_cast<float>(gr * std::sin(2.0 * kPi * f * detune * t + phase * (wide ? 1.3 : 1.0)));
      }
    }
  }
  const float gain = level / static_cast<float>(std::sqrt(norm));
  const size_t fade = static_cast<size_t>(0.2f * kRate);
  for (size_t i = 0; i < n; ++i) {
    const float in = i < fade ? static_cast<float>(i) / fade : 1.0f;
    const float out = i + fade > n ? static_cast<float>(n - i) / fade : 1.0f;
    s.left[i] *= gain * in * out;
    s.right[i] *= gain * in * out;
  }
  return s;
}

// Safe's gain in dB, sample by sample, while `in` goes through the device as it is set.
static std::vector<float> held_trace(Spread& d, const Stereo& in, Stereo* heard = nullptr) {
  std::vector<float> held(in.size());
  if (heard) {
    heard->left.resize(in.size());
    heard->right.resize(in.size());
  }
  for (size_t i = 0; i < in.size(); ++i) {
    d.in_left()[0] = in.left[i];
    d.in_right()[0] = in.right[i];
    d.process(1);
    held[i] = d.meter(0);
    if (heard) {
      heard->left[i] = d.out_left()[0];
      heard->right[i] = d.out_right()[0];
    }
  }
  return held;
}

// --- the bank's material ---------------------------------------------------------------------

// The phrase the factory bank measures with (CHAIN_PREVIEW_PHRASE on the dry
// electric piano of src/dsp/factory/phrases.ts), played as patch-render.ts
// plays it: six notes, the blocks cut at each note's start and end. Its sides
// stand 18 dB under its middle.
static Stereo bank_phrase(float seconds) {
  static livemix::TinePiano piano;
  struct Note {
    double at, dur;
    int note;
    float gain;
  };
  const Note notes[] = {{0.0, 1.2, 57, 0.8f}, {0.6, 1.2, 64, 0.8f}, {1.2, 1.2, 72, 0.8f},
                        {2.4, 1.5, 69, 0.8f}, {2.4, 1.5, 53, 0.8f}, {4.0, 1.0, 76, 0.6f}};
  struct Event {
    size_t frame;
    bool on;
    int id;
  };
  std::vector<Event> events;
  for (int id = 0; id < 6; ++id) {
    const size_t frame = static_cast<size_t>(std::llround(notes[id].at * kRate));
    events.push_back({frame, true, id});
    events.push_back({frame + static_cast<size_t>(std::llround(notes[id].dur * kRate)), false, id});
  }
  std::stable_sort(events.begin(), events.end(),
                   [](const Event& a, const Event& b) { return a.frame < b.frame; });
  const size_t total = static_cast<size_t>(seconds * kRate);
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  piano.init(kRate);
  size_t cursor = 0, next = 0;
  while (cursor < total) {
    while (next < events.size() && events[next].frame <= cursor) {
      const Event& e = events[next++];
      if (e.on) {
        const double hz = 440.0 * std::pow(2.0, (notes[e.id].note - 69) / 12.0);
        piano.note_on(e.id, static_cast<float>(hz), notes[e.id].gain);
      } else {
        piano.note_off(e.id);
      }
    }
    size_t count = std::min<size_t>(128, total - cursor);
    if (next < events.size()) count = std::min(count, events[next].frame - cursor);
    piano.process(static_cast<int>(count));
    for (size_t i = 0; i < count; ++i) {
      out.left[cursor + i] = piano.out_left()[i];
      out.right[cursor + i] = piano.out_right()[i];
    }
    cursor += count;
  }
  return out;
}

// A steady hiss, the two sides independent (as much sides as middle), `level_db` dBFS on each.
static Stereo wide_hiss(float seconds, double level_db) {
  const float gain = static_cast<float>(std::sqrt(3.0) * std::pow(10.0, level_db / 20.0));
  Stereo s;
  s.left = noise(seconds, kRate, gain);
  s.right = noise(seconds, kRate, gain);
  return s;
}

// A held chord of three notes with six partials each, nearly mono: its sides
// are the same notes with other phases, 18 dB under the middle. `level_db` dBFS.
static Stereo narrow_chord(float seconds, double level_db) {
  const size_t n = static_cast<size_t>(seconds * kRate);
  std::vector<double> mid(n, 0.0), side(n, 0.0);
  for (double f0 : {220.0, 277.18, 329.63}) {
    for (int h = 1; h <= 6; ++h) {
      for (size_t i = 0; i < n; ++i) {
        const double t = static_cast<double>(i) / kRate;
        mid[i] += std::sin(2.0 * kPi * f0 * h * t + 0.3 * h) / h;
        side[i] += std::sin(2.0 * kPi * f0 * h * t + 1.1 * h + f0) / h;
      }
    }
  }
  double sum = 0.0;
  for (double v : mid) sum += v * v;
  const double gain = std::pow(10.0, level_db / 20.0) / std::sqrt(sum / static_cast<double>(n));
  const double under = std::pow(10.0, -18.0 / 20.0);
  Stereo s;
  s.left.resize(n);
  s.right.resize(n);
  for (size_t i = 0; i < n; ++i) {
    s.left[i] = static_cast<float>(gain * (mid[i] + under * side[i]));
    s.right[i] = static_cast<float>(gain * (mid[i] - under * side[i]));
  }
  return s;
}

// `first` until `at` seconds, then `second`, crossed over 5 ms.
static Stereo joined(const Stereo& first, const Stereo& second, float at) {
  const size_t cut = static_cast<size_t>(at * kRate), fade = 240;
  Stereo s = second;
  for (size_t i = 0; i < s.size(); ++i) {
    const double w = i < cut ? 1.0 : i < cut + fade ? 1.0 - static_cast<double>(i - cut) / fade : 0.0;
    s.left[i] = static_cast<float>(w * first.left[i] + (1.0 - w) * second.left[i]);
    s.right[i] = static_cast<float>(w * first.right[i] + (1.0 - w) * second.right[i]);
  }
  return s;
}

// The level of both sides together between two seconds, in dBFS.
static double level_db(const Stereo& x, double from, double to) {
  const size_t a = static_cast<size_t>(from * kRate), b = std::min(x.size(), static_cast<size_t>(to * kRate));
  double sum = 0.0;
  for (size_t i = a; i < b; ++i) sum += static_cast<double>(x.left[i]) * x.left[i] + static_cast<double>(x.right[i]) * x.right[i];
  return 10.0 * std::log10(std::max(sum / (2.0 * static_cast<double>(b - a)), 1.0e-30));
}

// --- the presets ---------------------------------------------------------------------------

struct Preset {
  const char* name;
  float values[p::kNumParams];
};
// Which control each column of the table is, by key: the table stands in
// this order whatever the order of the controls in device.json.
static const int kColumns[p::kNumParams] = {p::kLow,   p::kMid,  p::kHigh,  p::kLowHz, p::kHighHz,
                                            p::kSlope, p::kMake, p::kSmear, p::kSafe,  p::kOutput};
static const Preset kPresets[] = {
// presets: begin (the sixteen of device.json, every control filled in; keep kColumns beside them)
// low, mid, high, lowHz, highHz, slope, make, smear, safe, output
  {"Firm and airy", {0.0f, 1.25f, 1.7f, 120.0f, 2000.0f, 1.0f, 0.7f, 0.4f, 0.5f, 0.0f}},
  {"Wide top", {0.0f, 1.0f, 2.0f, 120.0f, 1600.0f, 1.0f, 1.0f, 0.5f, 0.5f, 0.0f}},
  {"Air only", {1.0f, 1.0f, 2.0f, 120.0f, 5000.0f, 1.0f, 1.0f, 0.6f, 0.5f, 0.0f}},
  {"Open middle", {0.0f, 1.8f, 1.2f, 180.0f, 3200.0f, 1.0f, 0.9f, 0.4f, 0.5f, -0.75f}},
  {"Wide pad", {0.5f, 1.6f, 2.0f, 120.0f, 3200.0f, 0.2f, 0.9f, 0.8f, 0.4f, -1.75f}},
  {"Hazy edges", {0.0f, 1.3f, 2.0f, 180.0f, 1500.0f, 0.0f, 1.0f, 1.0f, 0.5f, -0.5f}},
  {"Tight shimmer", {1.0f, 1.0f, 2.0f, 120.0f, 2800.0f, 1.0f, 1.0f, 0.0f, 0.5f, 0.0f}},
  {"Wide ends", {2.0f, 0.6f, 2.0f, 150.0f, 3200.0f, 1.0f, 0.8f, 0.4f, 0.5f, 0.0f}},
  {"Wide bass", {2.0f, 1.0f, 1.0f, 300.0f, 3200.0f, 1.0f, 1.0f, 0.7f, 0.3f, -0.5f}},
  {"Firm bass", {0.0f, 1.0f, 1.0f, 400.0f, 3200.0f, 1.0f, 0.0f, 0.4f, 0.5f, 0.0f}},
  {"Everything wide", {2.0f, 2.0f, 2.0f, 180.0f, 3200.0f, 1.0f, 1.0f, 0.4f, 0.0f, -4.0f}},
  {"Wide but safe", {1.5f, 2.0f, 2.0f, 180.0f, 3200.0f, 1.0f, 1.0f, 0.4f, 1.0f, 0.0f}},
  {"Soft tilt", {0.5f, 1.0f, 1.5f, 300.0f, 3000.0f, 0.0f, 0.8f, 0.4f, 0.5f, 0.0f}},
  {"Narrow top", {1.0f, 1.6f, 0.0f, 180.0f, 4000.0f, 1.0f, 0.8f, 0.4f, 0.5f, -0.4f}},
  {"Narrow body", {0.0f, 0.3f, 2.0f, 250.0f, 3200.0f, 1.0f, 0.8f, 0.4f, 0.5f, 0.0f}},
  {"To the middle", {0.0f, 0.0f, 0.0f, 120.0f, 2000.0f, 1.0f, 0.0f, 0.4f, 0.5f, 0.0f}},
// presets: end
};

static float value_of(const Preset& preset, int id) {
  for (int column = 0; column < p::kNumParams; ++column) {
    if (kColumns[column] == id) return preset.values[column];
  }
  std::abort();
}

static const Preset& preset_named(const char* name) {
  for (const Preset& preset : kPresets) {
    if (std::strcmp(preset.name, name) == 0) return preset;
  }
  std::abort();
}

static void load_preset(Spread& d, const Preset& preset) {
  d.init(kRate);
  for (int column = 0; column < p::kNumParams; ++column) d.set_param(kColumns[column], preset.values[column]);
}

int main() {
  Conformance spec;
  spec.name = "spread";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  // Output at its top doubles the sound, and the turn of the middle makes the
  // harness's flat noise (every sample as likely as the next up to its peak)
  // into ordinary noise, whose peaks stand 7 dB higher at the same level.
  spec.max_peak = 6.0f;
  check_effect(device, spec, kRate);

  // 1. The gain on the sides is the curve: side tones through four settings,
  // against the formula, wherever the curve stands above -70 dB.
  {
    const Setting settings[] = {
        {0.0f, 1.25f, 1.7f, 120.0f, 2000.0f, 0.5f},  // as it starts
        {2.0f, 0.5f, 2.0f, 300.0f, 2000.0f, 1.0f},   // wide ends, sharp
        {1.0f, 0.0f, 1.0f, 120.0f, 6000.0f, 0.0f},   // the middle taken out, soft
        {0.6f, 2.0f, 0.0f, 500.0f, 1500.0f, 0.3f},   // the top in the middle
    };
    const double tones[] = {45.0, 90.0, 180.0, 400.0, 900.0, 2000.0, 3200.0, 6000.0, 11000.0, 16000.0};
    double worst = 0.0;
    for (const Setting& s : settings) {
      for (double hz : tones) {
        const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope);
        if (want < 3.0e-4) continue;
        const double got = side_gain(device, s, hz);
        worst = std::max(worst, std::fabs(db(got) - db(want)));
      }
    }
    std::printf("curve: worst error against the formula %.3f dB\n", worst);
    EXPECT(worst < 0.1, "side tones follow the curve's formula to 0.1 dB");
  }

  // 2. With correlated noise in (a middle and sides of their own), the side
  // level per band follows the curve; the middle keeps its level in every
  // band and is the same middle whatever the widths are.
  {
    const Setting settings[] = {
        {0.0f, 1.0f, 2.0f, 250.0f, 3000.0f, 1.0f},
        {2.0f, 1.0f, 0.5f, 250.0f, 3000.0f, 1.0f},
        {0.5f, 2.0f, 1.0f, 250.0f, 3000.0f, 1.0f},
    };
    rng_state() = 0x5EEDu;
    const std::vector<float> mid_in = noise(4.0f, kRate, 0.25f);
    const std::vector<float> side_in = noise(4.0f, kRate, 0.15f);
    std::vector<float> left(mid_in.size()), right(mid_in.size());
    for (size_t i = 0; i < mid_in.size(); ++i) {
      left[i] = mid_in[i] + side_in[i];
      right[i] = mid_in[i] - side_in[i];
    }
    Setting ones;
    ones.low_hz = 250.0f;
    ones.high_hz = 3000.0f;
    ones.slope = 1.0f;
    set(device, ones);
    const std::vector<float> mid_turned = middle(run(device, left, right));
    double worst = 0.0, worst_mid = 0.0, worst_level = 0.0;
    for (const Setting& s : settings) {
      set(device, s);
      Stereo out = run(device, left, right);
      const std::vector<float> side_out = sides(out);
      const std::vector<float> mid_out = middle(out);
      for (double hz : {60.0, 900.0, 9000.0}) {
        const double got = band_rms(side_out, hz) / band_rms(side_in, hz);
        const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope);
        if (want < 0.01) {
          EXPECT(got < 0.02, "a region at 0 leaves no sides in its band");
        } else {
          worst = std::max(worst, std::fabs(db(got) - db(want)));
        }
        worst_level = std::max(worst_level, std::fabs(db(band_rms(mid_out, hz) / band_rms(mid_in, hz))));
      }
      for (size_t i = 0; i < mid_in.size(); ++i) {
        worst_mid = std::max(worst_mid, std::fabs(static_cast<double>(mid_out[i]) - mid_turned[i]));
      }
    }
    std::printf("noise: side level per band within %.2f dB of the curve; middle level within %.3f dB of the input, the same to %.2g whatever the widths\n",
                worst, worst_level, worst_mid);
    EXPECT(worst < 1.0, "with noise in, the side level per band follows the curve");
    EXPECT(worst_level < 0.05, "the middle keeps its level in every band");
    EXPECT(worst_mid < 1.0e-6, "the middle is the same whatever the widths are");
  }

  // 3. Low at 0 makes everything below the split mono: at Slope 1 a side tone
  // three octaves under the split is more than 60 dB down, one octave under
  // it 28 dB, at the split 12 dB, and three octaves over it nothing is taken.
  {
    Setting s;
    s.low = 0.0f;
    s.low_hz = 400.0f;
    s.slope = 1.0f;
    const double deep = side_gain(device, s, 50.0);
    const double octave = side_gain(device, s, 200.0);
    const double at = side_gain(device, s, 400.0);
    const double above = side_gain(device, s, 3200.0);
    std::printf("Low 0, split 400 Hz, Slope 1: %.1f dB at 50 Hz, %.1f at 200, %.1f at 400, %.2f at 3200\n",
                db(deep), db(octave), db(at), db(above));
    EXPECT(db(deep) < -60.0, "Low 0: the sides three octaves under the split are under -60 dB");
    EXPECT(db(octave) < -27.0, "Low 0: an octave under the split the sides are 27 dB down");
    EXPECT_NEAR(db(at), -12.0, 0.3, "Low 0: at the split the sides are 12 dB down");
    EXPECT(std::fabs(db(above)) < 0.4, "Low 0: three octaves over the split nothing is taken");
    // Split 120 Hz with Slope at its ends and half way: the sides at 40, 80 and 120 Hz.
    double at_80[3] = {0, 0, 0};
    int k = 0;
    for (float slope : {0.0f, 0.5f, 1.0f}) {
      Setting start;
      start.low = 0.0f;
      start.low_hz = 120.0f;
      start.slope = slope;
      const double a = side_gain(device, start, 40.0), b = side_gain(device, start, 80.0);
      const double c = side_gain(device, start, 120.0);
      std::printf("Low 0, split 120 Hz, Slope %.1f: %.1f dB at 40 Hz, %.1f at 80, %.1f at 120\n", slope,
                  db(a), db(b), db(c));
      at_80[k++] = db(b);
    }
    // As it starts (Slope 1) the bass is firmly in the middle from the split down.
    Setting firm;
    firm.low = 0.0f;
    firm.low_hz = 120.0f;
    firm.slope = 1.0f;
    EXPECT(db(side_gain(device, firm, 40.0)) < -35.0 && db(side_gain(device, firm, 80.0)) < -19.0 &&
               db(side_gain(device, firm, 120.0)) < -11.5,
           "Low 0, Slope 1: the bass is in the middle from the split down");
    // Slope is a control that does something: all the way down a region at 0
    // falls half as fast (6 dB down at the split, 12 dB an octave).
    firm.slope = 0.0f;
    EXPECT_NEAR(db(side_gain(device, firm, 120.0)), -6.0, 0.3,
                "Low 0, Slope 0: at the split the sides are 6 dB down");
    EXPECT(at_80[0] - at_80[2] > 9.0,
           "Slope moves the sides half an octave under the split of a region at 0 by over 9 dB");
    EXPECT(at_80[1] < at_80[0] - 2.0 && at_80[1] > at_80[2] + 2.0,
           "Slope half way stands between its ends");
    // Where no region is near 0 Slope changes little: a step from 1 to 2 takes
    // about three octaves at either end (said in its description).
    Setting step;
    step.high = 2.0f;
    step.high_hz = 4000.0f;
    step.slope = 0.0f;
    const double soft = db(side_gain(device, step, 2000.0));
    step.slope = 1.0f;
    const double hard = db(side_gain(device, step, 2000.0));
    std::printf("High 2, split 4000 Hz: %.2f dB at 2000 Hz at Slope 0, %.2f at Slope 1\n", soft, hard);
    EXPECT(std::fabs(soft - hard) < 0.5, "between two widths over 0, Slope changes under half a dB");
  }

  // 4. Everything at 1 is the input in level, each side its own: a sound on
  // one side stays on that side to the last bit, tones keep their level at
  // every frequency, Make adds nothing, and a hair off 1 is the same to 1e-4.
  {
    Setting flat;
    flat.safe = 0.5f;
    flat.make = 1.0f;
    rng_state() = 0xF1A7u;
    const std::vector<float> a = noise(1.0f, kRate, 0.5f);
    const std::vector<float> b = noise(1.0f, kRate, 0.5f);
    const std::vector<float> nothing = silence(1.0f, kRate);
    set(device, flat);
    Stereo one = run(device, a, nothing);
    EXPECT(peak(one.right) == 0.0 && rms(one.left) > 0.2,
           "all at 1: a sound on the left alone stays on the left alone, to the last bit");
    EXPECT_NEAR(db(rms(one.left) / rms(a)), 0.0, 0.01, "all at 1: the level is the input's");
    double worst_tone = 0.0;
    for (double hz : {40.0, 127.0, 180.0, 254.0, 1000.0, 2263.0, 3200.0, 4525.0, 12000.0}) {
      const std::vector<float> tone = sine(static_cast<float>(hz), 0.5f, kRate, 0.5f);
      set(device, flat);
      Stereo heard = run(device, tone, negated(tone));
      worst_tone = std::max(worst_tone, std::fabs(tone_level(heard.left, hz, kRate, 12000) / 0.5 - 1.0));
      set(device, flat);
      heard = run(device, tone);
      worst_tone = std::max(worst_tone, std::fabs(tone_level(heard.right, hz, kRate, 12000) / 0.5 - 1.0));
    }
    set(device, flat);
    Stereo out = run(device, a, b);
    Setting near = flat;
    near.low = 0.9999f;
    near.mid = 1.0001f;
    near.high = 0.9999f;
    set(device, near);
    Stereo hair = run(device, a, b);
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(hair.left[i]) - out.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(hair.right[i]) - out.right[i]));
    }
    std::printf("all at 1: tones keep their level to %.2g; a hair off 1 is the same to %.2g\n", worst_tone,
                worst);
    EXPECT(worst_tone < 1.0e-4, "all at 1: the regions sum flat, tones keep their level to 1e-4");
    EXPECT(worst < 1.0e-4, "a hair off 1 the output is what all at 1 gives, to 1e-4");
  }

  // 5. The mono sum is the same whatever the width controls do, Make, Smear
  // and Safe included, and has the input's level at every frequency: nothing
  // here can cancel in mono.
  {
    rng_state() = 0xA11CEu;
    const std::vector<float> a = noise(2.0f, kRate, 0.4f);
    const std::vector<float> b = noise(2.0f, kRate, 0.4f);
    const Setting settings[] = {
        {0.0f, 1.25f, 1.7f, 120.0f, 2000.0f, 0.5f, 0.7f, 0.4f, 0.5f},
        {2.0f, 2.0f, 2.0f, 40.0f, 1000.0f, 0.0f, 1.0f, 1.0f, 0.0f},
        {2.0f, 2.0f, 2.0f, 800.0f, 12000.0f, 1.0f, 1.0f, 0.0f, 1.0f},
        {0.0f, 0.0f, 0.0f, 300.0f, 5000.0f, 0.5f, 1.0f, 0.5f, 1.0f},
    };
    double worst = 0.0, worst_level = 0.0;
    for (const Setting& s : settings) {
      Setting ones;
      ones.low_hz = s.low_hz;
      ones.high_hz = s.high_hz;
      ones.slope = s.slope;
      set(device, ones);
      const std::vector<float> plain = middle(run(device, a, b));
      set(device, s);
      const std::vector<float> sum = middle(run(device, a, b));
      for (size_t i = 0; i < a.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(sum[i]) - plain[i]));
      }
      for (double hz : {30.0, 80.0, 250.0, 700.0, 2000.0, 5000.0, 14000.0}) {
        const std::vector<float> tone = sine(static_cast<float>(hz), 0.5f, kRate, 0.5f);
        set(device, s);
        const std::vector<float> heard = middle(run(device, tone, silence(0.5f, kRate)));
        worst_level = std::max(worst_level, std::fabs(db(tone_level(heard, hz, kRate, 12000) / 0.25)));
      }
    }
    std::printf("mono sum: the same to %.2g whatever the widths, Make and Safe; its level off the input's by %.4f dB at most\n",
                worst, worst_level);
    EXPECT(worst < 1.0e-6, "the mono sum is unchanged by every width control, Make and Safe (1e-6)");
    EXPECT(worst_level < 0.001, "the mono sum has the input's level at every frequency");
  }

  // 6. Make gives a mono input width in the band asked for, as much as the
  // region stands over 1, and none where a region is at 1 or under; the made
  // sides are as loud as the formula says (the scatter is allpass), and every
  // part of the knob's travel makes more.
  {
    rng_state() = 0xB0A7u;
    const std::vector<float> mono = noise(4.0f, kRate, 0.25f);
    Setting s;
    s.low = 0.0f;
    s.mid = 1.5f;
    s.high = 2.0f;
    s.low_hz = 250.0f;
    s.slope = 1.0f;
    s.make = 1.0f;
    set(device, s);
    Stereo out = run(device, mono);
    const std::vector<float> made = sides(out);
    const double top = band_rms(made, 9000.0) / band_rms(mono, 9000.0);
    const double centre = band_rms(made, 900.0) / band_rms(mono, 900.0);
    const double bottom = band_rms(made, 50.0) / band_rms(mono, 50.0);
    std::printf("Make 1 on a mono sound: sides against the middle %.2f at 9 kHz, %.2f at 900 Hz, %.4f at 50 Hz\n",
                top, centre, bottom);
    EXPECT_NEAR(top, made_curve(9000.0, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope), 0.05,
                "Make 1 under High 2: the made sides are what the formula says, as loud as the middle");
    EXPECT(top > 0.9, "Make 1 under High 2: the made sides are as loud as the middle");
    EXPECT_NEAR(centre, made_curve(900.0, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope), 0.04,
                "Make 1 under Mid 1.5: the made sides are what the formula says, half the middle");
    EXPECT(bottom < 0.01, "Make makes nothing where the curve is at 0");
    {
      Setting plain = s;
      plain.mid = 1.0f;
      set(device, plain);
      Stereo as_it_came = run(device, mono);
      const double none = band_rms(sides(as_it_came), 700.0) / band_rms(mono, 700.0);
      std::printf("  Mid at 1: sides against the middle %.4f at 700 Hz\n", none);
      EXPECT(none < 0.02, "Make makes nothing in a region left as it came");
    }
    double last = 2.0;
    bool falls = true;
    for (float make : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      s.make = make;
      set(device, s);
      out = run(device, mono);
      const double c = correlation(out.left, out.right, 4800);
      std::printf("  Make %.2f: left against right %.3f\n", make, c);
      if (!(c < last - 0.03)) falls = false;
      last = c;
    }
    EXPECT(falls, "every quarter of Make's travel takes the two sides further apart");
  }

  // 7. Smear: the made sides of one click last longer as it goes up, are as
  // loud whatever it is set to, and are a tail, not a second strike: their
  // energy in 4 ms windows is highest within 8 ms of the click and after
  // that never comes up again by more than 1.5 dB.
  {
    double length[3], energy[3];
    int n = 0;
    for (float smear : {0.0f, 0.5f, 1.0f}) {
      Setting s;
      s.low = s.mid = s.high = 2.0f;
      s.make = 1.0f;
      s.smear = smear;
      set(device, s);
      Stereo out = run(device, impulse(0.5f, kRate, 0.5f));
      const std::vector<float> made = sides(out);
      double total = 0.0, moment = 0.0;
      for (size_t i = 0; i < made.size(); ++i) {
        const double e = static_cast<double>(made[i]) * made[i];
        total += e;
        moment += e * static_cast<double>(i);
      }
      length[n] = 1000.0 * moment / total / kRate;  // the energy's centre, in ms
      energy[n] = total;
      // The envelope: energy in 4 ms windows, a step of 1 ms, in dB against the click's own.
      const int window = 192, step = 48;
      std::vector<double> envelope;
      for (size_t at = 0; at + window < 4800; at += step) {
        double e = 0.0;
        for (size_t i = at; i < at + window; ++i) e += static_cast<double>(made[i]) * made[i];
        envelope.push_back(10.0 * std::log10(e / 0.25 + 1.0e-20));
      }
      size_t top = 0;
      for (size_t i = 0; i < envelope.size(); ++i) {
        if (envelope[i] > envelope[top]) top = i;
      }
      double low = envelope[top], rise = 0.0;
      for (size_t i = top; i < envelope.size(); ++i) {
        low = std::min(low, envelope[i]);
        if (envelope[i] > -40.0) rise = std::max(rise, envelope[i] - low);
      }
      std::printf("Smear %.1f: the made sides of a click are highest %zu ms after it (%.1f dB), %.1f dB at 20 ms, %.1f at 30, and come up again by %.2f dB at most\n",
                  smear, top, envelope[top], envelope[20], envelope[30], rise);
      EXPECT(top <= 8, "Smear: the made sides are highest within 8 ms of the click");
      EXPECT(rise < 1.5, "Smear: after their top the made sides only fall: a tail, not a second strike");
      EXPECT(envelope[30] < -12.0, "Smear: 30 ms after the click the made sides are 12 dB under it");
      ++n;
    }
    std::printf("Smear 0, 0.5, 1: the made sides of a click centre at %.1f, %.1f, %.1f ms\n", length[0],
                length[1], length[2]);
    EXPECT(length[1] > length[0] * 1.5 && length[2] > length[1] * 1.3, "Smear spreads the made width in time");
    EXPECT(length[2] < 15.0, "Smear at the top centres the made sides within 15 ms of the sound");
    // An impulse of 0.5 in both channels is a middle of 0.5, and under widths of 2 so are the made sides.
    EXPECT_NEAR(std::sqrt(energy[0]), 0.5, 0.01, "the scatter is allpass at Smear 0");
    EXPECT_NEAR(std::sqrt(energy[2]), 0.5, 0.01, "the scatter is allpass at Smear 1");
  }

  // 8. Safe holds the sides under a ceiling against the middle: on a mono
  // sound with Make full and every region wide, the sides stand level with
  // the middle at Safe 0, 3 dB under it at 0.5, 7.5 at 0.75 and 12 at 1; the
  // meter says by how much. Once settled, Safe never narrows what came in: a
  // sound that is all sides stays.
  {
    rng_state() = 0x5AFEu;
    const std::vector<float> mono = noise(3.0f, kRate, 0.25f);
    Setting s;
    s.low = s.mid = s.high = 2.0f;
    s.make = 1.0f;
    double ratio[4], meter[4];
    int n = 0;
    for (float safe : {0.0f, 0.5f, 0.75f, 1.0f}) {
      s.safe = safe;
      set(device, s);
      Stereo out = run(device, mono);
      ratio[n] = rms(sides(out), 48000) / rms(middle(out), 48000);
      meter[n] = device.meter(0);
      ++n;
    }
    std::printf("Safe 0, 0.5, 0.75, 1: sides against the middle %.1f, %.1f, %.1f, %.1f dB (meter %.1f, %.1f, %.1f, %.1f)\n",
                db(ratio[0]), db(ratio[1]), db(ratio[2]), db(ratio[3]), meter[0], meter[1], meter[2],
                meter[3]);
    EXPECT_NEAR(db(ratio[0]), 0.0, 0.5, "Safe 0 holds nothing: the made sides are level with the middle");
    EXPECT(meter[0] == 0.0, "Safe 0: the meter reads 0 dB");
    EXPECT_NEAR(db(ratio[1]), -3.0, 0.5, "Safe 0.5: the sides are held 3 dB under the middle");
    EXPECT_NEAR(db(ratio[2]), -7.5, 0.5, "Safe 0.75: the sides are held 7.5 dB under the middle");
    EXPECT_NEAR(db(ratio[3]), -12.0, 0.5, "Safe 1: the sides are held 12 dB under the middle");
    EXPECT_NEAR(meter[3], db(ratio[3]) - db(ratio[0]), 0.5, "the meter reads how far Safe holds the sides");

    // All sides (left and right in opposite phase), widened: held to what came in, not silenced.
    const std::vector<float> tone = sine(700.0f, 2.0f, kRate, 0.4f);
    s.make = 0.0f;
    s.safe = 1.0f;
    set(device, s);
    Stereo out = run(device, tone, negated(tone));
    const double kept = rms(sides(out), 48000) / rms(tone, 48000);
    std::printf("opposite phase in, widths 2, Safe 1: sides out against in %.2f dB\n", db(kept));
    EXPECT_NEAR(db(kept), 0.0, 0.5, "Safe holds a sound that is all sides to what came in, no lower");
    // And as it starts, a sound in opposite phase does not vanish.
    device.init(kRate);
    out = run(device, tone, negated(tone));
    EXPECT(rms(out.left, 48000) > 0.9 * rms(tone, 48000), "as it starts, a sound in opposite phase stays");
    // A source wider than its middle, narrowed a little: Safe leaves it alone.
    Setting narrow;
    narrow.mid = 0.9f;
    narrow.safe = 1.0f;
    set(device, narrow);
    out = run(device, tone, negated(tone));
    EXPECT(device.meter(0) == 0.0, "Safe does not act on sides that were not raised");
  }

  // 9. No click when a point is dragged or a knob jumps: each control from one
  // end to the other while a full chord sounds, against renders with no move;
  // once as it starts and once with every region wide, where Safe and Make
  // have the most to do.
  {
    std::vector<float> left = sine(110.0f, 1.0f, kRate, 0.3f);
    std::vector<float> right = sine(110.0f, 1.0f, kRate, 0.3f);
    const std::vector<float> a = sine(331.0f, 1.0f, kRate, 0.25f);
    const std::vector<float> b = sine(1319.0f, 1.0f, kRate, 0.2f);
    for (size_t i = 0; i < left.size(); ++i) {
      left[i] += a[i] + 0.5f * b[i];
      right[i] += 0.3f * a[i] - b[i];
    }
    const std::vector<float> first_l(left.begin(), left.begin() + 24000);
    const std::vector<float> first_r(right.begin(), right.begin() + 24000);
    const std::vector<float> rest_l(left.begin() + 24000, left.end());
    const std::vector<float> rest_r(right.begin() + 24000, right.end());
    auto worst_step = [](const Stereo& x) { return std::max(max_step(x.left), max_step(x.right)); };
    for (int wide = 0; wide < 2; ++wide) {
      auto start = [&](int id, float value) {
        device.init(kRate);
        device.set_param(p::kMake, 1.0f);
        if (wide) {
          device.set_param(p::kLow, 2.0f);
          device.set_param(p::kMid, 2.0f);
          device.set_param(p::kHigh, 2.0f);
          device.set_param(p::kSafe, 1.0f);
        }
        device.set_param(id, value);
      };
      for (int id = 0; id < p::kNumParams; ++id) {
        for (int way = 0; way < 2; ++way) {
          const float from = way == 0 ? p::kParamMin[id] : p::kParamMax[id];
          const float to = way == 0 ? p::kParamMax[id] : p::kParamMin[id];
          // The renders with no move in them: at each end, and at each end with
          // Safe off, because Safe takes a few ms to hear what a thrown knob has
          // added and until then the sides stand as they would unheld. That is a
          // swell of the sides, not a click.
          double still = 0.0;
          for (float value : {from, to}) {
            for (int unheld = 0; unheld <= 1; ++unheld) {
              start(id, value);
              if (unheld && id != p::kSafe) device.set_param(p::kSafe, 0.0f);
              run(device, first_l, first_r);
              still = std::max(still, worst_step(run(device, rest_l, rest_r)));
            }
          }
          start(id, from);
          run(device, first_l, first_r);
          device.set_param(id, to);
          const double moved = worst_step(run(device, rest_l, rest_r));
          if (!(moved < still * 1.25 + 0.002)) {
            std::printf("FAIL: param %d from %g to %g clicks%s: step %.4f against %.4f with no move\n", id,
                        from, to, wide ? " with every region wide" : "", moved, still);
            ++failures();
          }
        }
      }
    }
  }

  // 9b. A knob thrown with Safe full: Safe has heard it 60 ms later. Mid from
  // 0 to 2 under a held chord, every region wide; Safe's gain is then within
  // 1 dB of where it stands a second on. (Left alone it lets go over 1.5 s.)
  {
    Stereo chord;
    chord.left = sine(220.0f, 2.0f, kRate, 0.3f);
    const std::vector<float> third = sine(331.0f, 2.0f, kRate, 0.3f);
    for (size_t i = 0; i < third.size(); ++i) chord.left[i] += third[i];
    chord.right = chord.left;
    Setting s;
    s.low = s.high = 2.0f;
    s.mid = 0.0f;
    s.make = 1.0f;
    s.safe = 1.0f;
    set(device, s);
    const std::vector<float> before(chord.left.begin(), chord.left.begin() + 48000);
    const std::vector<float> before_r(chord.right.begin(), chord.right.begin() + 48000);
    run(device, before, before_r);
    device.set_param(p::kMid, 2.0f);
    Stereo after;
    after.left.assign(chord.left.begin() + 48000, chord.left.end());
    after.right.assign(chord.right.begin() + 48000, chord.right.end());
    const std::vector<float> held = held_trace(device, after);
    std::printf("Mid thrown from 0 to 2 with Safe 1: Safe's gain %.1f dB after 60 ms, %.1f dB after a second\n",
                held[2880], held[47999]);
    EXPECT(held[47999] < -6.0, "the thrown knob gave Safe something to hold");
    EXPECT(std::fabs(held[2880] - held[47999]) < 1.0, "Safe has heard a thrown knob 60 ms later");
  }

  // 10. Level: a full-scale chord held for a minute, with each control at
  // each end and with everything up, never peaks more than 6 dB over the
  // input and does not grow.
  {
    const float seconds = 60.0f;
    std::vector<float> chord = sine(130.81f, seconds, kRate, 0.34f);
    const std::vector<float> e = sine(329.63f, seconds, kRate, 0.33f);
    const std::vector<float> g = sine(1567.98f, seconds, kRate, 0.33f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += e[i] + g[i];
    const std::vector<float> nothing = silence(seconds, kRate);
    double highest = 0.0;
    auto hold_chord = [&](const char* what, int id, bool one_side) {
      Stereo out = one_side ? run(device, chord, nothing) : run(device, chord);
      const size_t n = out.size(), five = static_cast<size_t>(5.0f * kRate);
      const double early = std::max(peak(out.left, five, 2 * five), peak(out.right, five, 2 * five));
      const double late = std::max(peak(out.left, n - five, n), peak(out.right, n - five, n));
      const double top = std::max(peak(out.left), peak(out.right));
      highest = std::max(highest, top);
      if (!(finite(out.left) && finite(out.right) && top < 2.0 && late < early * 1.01)) {
        std::printf("FAIL: held chord, %s %d: peak %.3f, last five seconds %.3f against %.3f\n", what,
                    id, top, late, early);
        ++failures();
      }
    };
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kOutput) continue;  // a trim: it is the level
      device.init(kRate);
      device.set_param(id, p::kParamMin[id]);
      hold_chord("minimum of", id, false);
      device.init(kRate);
      device.set_param(id, p::kParamMax[id]);
      hold_chord("maximum of", id, false);
    }
    Setting all;
    all.low = all.mid = all.high = 2.0f;
    all.make = 1.0f;
    all.smear = 1.0f;
    for (int safe = 0; safe < 2; ++safe) {
      all.safe = static_cast<float>(safe);
      set(device, all);
      hold_chord("everything up, both sides, Safe", safe, false);
      set(device, all);
      hold_chord("everything up, one side, Safe", safe, true);
    }
    std::printf("held full-scale chord: highest peak %.2f dB over the input\n", db(highest));
  }

  // 11. Held tones over the piano's range through the device as it starts,
  // on a mono sound: the two sides together never fall under the input, the
  // mono sum is the input, and one side alone dips no further than stated.
  {
    double worst_total = 100.0, worst_side = 100.0, most_side = -100.0, worst_sum = 0.0;
    for (int key = 0; key < 88; key += 2) {
      const float hz = 27.5f * std::pow(2.0f, static_cast<float>(key) / 12.0f);
      const std::vector<float> tone = sine(hz, 0.5f, kRate, 0.5f);
      device.init(kRate);
      Stereo out = run(device, tone);
      // By the tone's own level, not by RMS: the tone comes out turned in phase,
      // and over a stretch that is not a whole number of cycles RMS would differ.
      const size_t from = 12000;
      const double in = 0.5;
      const double l = tone_level(out.left, hz, kRate, from), r = tone_level(out.right, hz, kRate, from);
      worst_total = std::min(worst_total, db(std::sqrt(0.5 * (l * l + r * r)) / in));
      worst_side = std::min(worst_side, db(std::min(l, r) / in));
      most_side = std::max(most_side, db(std::max(l, r) / in));
      worst_sum = std::max(worst_sum, std::fabs(db(tone_level(middle(out), hz, kRate, from) / in)));
    }
    std::printf("piano range as it starts, mono in: both sides together %.2f dB at worst, one side from %.2f to %.2f dB, mono sum off by %.4f dB\n",
                worst_total, worst_side, most_side, worst_sum);
    EXPECT(worst_total > -0.01, "held tones: the two sides together never fall under the input");
    EXPECT(worst_side > -4.5 && most_side < 3.5, "held tones: one side leans by no more than stated");
    EXPECT(worst_sum < 0.001, "held tones: the mono sum is the input");
  }

  // 12. One speaker alone: a tone on the left only, over the whole band, at
  // settings that narrow hard. With a curve gain of G each speaker carries
  // (1 ± G) / 2 of it, so the right is never the louder one; middle and sides
  // are in step at every frequency. (With the sides filtered alone, a left
  // tone near a split came out up to 17 dB louder on the right.)
  {
    const Setting settings[] = {
        {0.0f, 1.25f, 1.7f, 120.0f, 2000.0f, 0.5f},  // as it starts, Make and Safe off
        {0.0f, 1.0f, 1.0f, 400.0f, 3200.0f, 1.0f},   // firm bass
        {0.0f, 1.8f, 1.2f, 180.0f, 3200.0f, 0.5f},   // open middle
        {1.0f, 1.6f, 0.0f, 180.0f, 4000.0f, 0.5f},   // narrow top
    };
    double worst = 0.0, lean = -100.0;
    for (const Setting& s : settings) {
      for (double hz = 40.0; hz < 15000.0; hz *= 1.26) {
        const std::vector<float> tone = sine(static_cast<float>(hz), 0.5f, kRate, 0.5f);
        set(device, s);
        Stereo out = run(device, tone, silence(0.5f, kRate));
        const double l = tone_level(out.left, hz, kRate, 12000) / 0.5;
        const double r = tone_level(out.right, hz, kRate, 12000) / 0.5;
        const double g = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope);
        worst = std::max(worst, std::fabs(l - 0.5 * (1.0 + g)));
        worst = std::max(worst, std::fabs(r - 0.5 * std::fabs(1.0 - g)));
        lean = std::max(lean, db(r / l));
      }
    }
    std::printf("a tone on the left alone: each speaker within %.4f of (1 ± gain) / 2; the right over the left by %.2f dB at most\n",
                worst, lean);
    EXPECT(worst < 0.005, "one speaker alone carries what the curve says: middle and sides are in step");
    EXPECT(lean < 0.01, "a sound on the left never comes out louder on the right");
  }

  // 13. Bad input: NaN, infinity and 1e30 are taken as silence, so once good
  // input returns the output is what it would have been after a silence.
  {
    rng_state() = 0xBAD1u;
    const std::vector<float> good = noise(1.0f, kRate, 0.3f);
    std::vector<float> bad(4800, 0.0f);
    for (size_t i = 0; i < bad.size(); ++i) {
      bad[i] = i % 3 == 0 ? std::nanf("") : (i % 3 == 1 ? INFINITY : 1.0e30f);
    }
    device.init(kRate);
    run(device, good);
    Stereo during = run(device, bad, negated(bad));
    Stereo after = run(device, good);
    device.init(kRate);
    run(device, good);
    run(device, silence(0.1f, kRate));
    Stereo clean = run(device, good);
    EXPECT(finite(during.left) && finite(during.right) && finite(after.left) && finite(after.right),
           "NaN, infinite and runaway input leaves the output finite");
    EXPECT(after.left == clean.left && after.right == clean.right && rms(after.left) > 0.1,
           "after bad input the device is where a silence would have left it");
  }

  // 14. Across a sleep, with knobs moved while asleep, the output is the same
  // at block sizes 1, 128 and 2048, and the moved knobs have snapped: waking
  // is the same as starting with those settings.
  {
    rng_state() = 0x51EEu;
    const std::vector<float> a = noise(0.5f, kRate, 0.3f);
    const std::vector<float> b = noise(0.5f, kRate, 0.3f);
    Stereo first[3], last[3];
    int n = 0;
    for (int block : {1, 128, 2048}) {
      device.init(kRate);
      first[n] = run(device, a, b, block);
      Stereo quiet = run(device, silence(1.5f, kRate), block);
      EXPECT(peak(quiet.left, 48000) == 0.0 && peak(quiet.right, 48000) == 0.0,
             "asleep within a second of silence");
      device.set_param(p::kHigh, 0.3f);
      device.set_param(p::kLowHz, 600.0f);
      device.set_param(p::kSmear, 1.0f);
      device.set_param(p::kMake, 1.0f);
      last[n] = run(device, b, a, block);
      ++n;
    }
    EXPECT(first[0].left == first[1].left && first[1].left == first[2].left &&
               first[0].right == first[1].right && first[1].right == first[2].right,
           "block sizes 1, 128 and 2048 give the same output");
    EXPECT(last[0].left == last[1].left && last[1].left == last[2].left &&
               last[0].right == last[1].right && last[1].right == last[2].right,
           "block sizes 1, 128 and 2048 give the same output after a sleep");
    device.init(kRate);
    device.set_param(p::kHigh, 0.3f);
    device.set_param(p::kLowHz, 600.0f);
    device.set_param(p::kSmear, 1.0f);
    device.set_param(p::kMake, 1.0f);
    Stereo fresh = run(device, b, a);
    EXPECT(fresh.left == last[1].left && fresh.right == last[1].right,
           "knobs moved while asleep snap: waking is the same as starting");

    // Sound that comes back just as the device falls asleep: silences of
    // every length around that moment, knobs moved halfway through each
    // (Smear among them, whose glide takes longest), Safe holding hard. Sleep
    // is counted by the sample, so every block size and a mixed run of sizes
    // give the same output. (Counted by the block, the device slept at a
    // different sample for each size: one was still gliding where another
    // had started afresh, and what came next differed by a third of the
    // signal.)
    Setting hard;
    hard.low = hard.mid = hard.high = 2.0f;
    hard.make = 1.0f;
    hard.safe = 1.0f;
    hard.smear = 1.0f;
    const std::vector<float> lead_l(a.begin(), a.begin() + 16384), lead_r(b.begin(), b.begin() + 16384);
    const std::vector<float> tail_l(b.begin(), b.begin() + 9600), tail_r(a.begin(), a.begin() + 9600);
    static const int pattern[] = {1, 127, 64, 512, 3, 2048, 32, 128, 300, 17};
    auto play = [&](int gap, int block) {
      set(device, hard);
      Stereo out = run(device, lead_l, lead_r, block ? block : 77);
      const std::vector<float> half = silence(static_cast<float>(gap / 2) / kRate, kRate);
      if (block) {
        run(device, half, block);
        device.set_param(p::kSafe, 0.6f);
        device.set_param(p::kHighHz, 6000.0f);
        device.set_param(p::kSmear, 0.0f);
        run(device, half, block);
        return run(device, tail_l, tail_r, block);
      }
      // A mixed run of sizes, the knobs still moved on the same sample.
      int step = 0;
      auto feed = [&](const std::vector<float>& l, const std::vector<float>& r) {
        Stereo part;
        for (size_t at = 0; at < l.size();) {
          const size_t frames = std::min<size_t>(pattern[step++ % 10], l.size() - at);
          const std::vector<float> pl(l.begin() + at, l.begin() + at + frames);
          const std::vector<float> pr(r.begin() + at, r.begin() + at + frames);
          part = concat(part, run(device, pl, pr, static_cast<int>(frames)));
          at += frames;
        }
        return part;
      };
      feed(half, half);
      device.set_param(p::kSafe, 0.6f);
      device.set_param(p::kHighHz, 6000.0f);
      device.set_param(p::kSmear, 0.0f);
      feed(half, half);
      return feed(tail_l, tail_r);
    };
    int differ = 0;
    for (int gap = 12000; gap <= 40000; gap += 1000) {
      const Stereo one = play(gap, 1);
      for (int block : {128, 2048, 0}) {
        const Stereo other = play(gap, block);
        if (!(one.left == other.left && one.right == other.right)) ++differ;
      }
    }
    std::printf("sound back after silences of 0.25 to 0.83 s: %d of 87 runs differ from block size 1\n", differ);
    EXPECT(differ == 0, "sound that returns as the device falls asleep is the same at every block size");
  }

  // 15. The device comes to rest after every control move: each control
  // thrown from end to end in mid sound, then silence, ends in exact zeros.
  {
    rng_state() = 0x4E57u;
    const std::vector<float> a = noise(0.3f, kRate, 0.3f);
    for (int id = 0; id < p::kNumParams; ++id) {
      device.init(kRate);
      device.set_param(p::kMake, 1.0f);
      device.set_param(id, p::kParamMin[id]);
      run(device, a, negated(a));
      device.set_param(id, p::kParamMax[id]);
      run(device, a);
      device.set_param(id, p::kParamMin[id]);
      render(device, 1.5f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      if (!(peak(rest.left) == 0.0 && peak(rest.right) == 0.0)) {
        std::printf("FAIL: not at rest two seconds after param %d moved (peak %g)\n", id,
                    std::max(peak(rest.left), peak(rest.right)));
        ++failures();
      }
    }
  }

  // 16. The curve is in hertz at every sample rate, also where a stage would
  // be tuned past the top of the range; so are the scatter's times.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 96000.0f}) {
      const Setting settings[] = {
          {0.0f, 1.25f, 1.7f, 120.0f, 2000.0f, 0.5f},
          {0.5f, 1.0f, 2.0f, 800.0f, 12000.0f, 0.0f},
      };
      for (const Setting& s : settings) {
        for (double hz : {100.0, 1000.0, 5000.0, 14000.0}) {
          const double want = curve(hz, s.low, s.mid, s.high, s.low_hz, s.high_hz, s.slope, rate);
          worst = std::max(worst, std::fabs(db(side_gain(device, s, hz, rate)) - db(want)));
        }
      }
    }
    std::printf("44.1 and 96 kHz: worst error against the formula %.3f dB\n", worst);
    EXPECT(worst < 0.1, "the curve follows the formula at 44.1 and 96 kHz");
    double centre[3];
    int n = 0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      Setting s;
      s.low = s.mid = s.high = 2.0f;
      s.make = 1.0f;
      s.smear = 1.0f;
      set(device, s, rate);
      const std::vector<float> made = sides(run(device, impulse(0.5f, rate, 0.5f)));
      double total = 0.0, moment = 0.0;
      for (size_t i = 0; i < made.size(); ++i) {
        total += static_cast<double>(made[i]) * made[i];
        moment += static_cast<double>(made[i]) * made[i] * static_cast<double>(i);
      }
      centre[n++] = 1000.0 * moment / total / rate;
    }
    std::printf("Smear 1 at 44.1, 48 and 96 kHz: the made sides centre at %.2f, %.2f, %.2f ms\n", centre[0],
                centre[1], centre[2]);
    EXPECT(std::fabs(centre[0] - centre[1]) < 0.1 && std::fabs(centre[2] - centre[1]) < 0.1,
           "the scatter's times are in ms at every sample rate");
  }

  // 17. Safe does not pump. Notes with gaps between them, each at its own
  // place between the sides, every region wide and Safe full. The gain takes
  // hold when the tightest note comes (the third, in the middle) and from
  // then on stays within 4 dB while a note sounds; over the whole phrase it
  // never comes back up by 0.6 dB in a tenth of a second (letting go is a
  // one-pole of 1.5 s on one over the gain: 5.8 dB a second at the most) and
  // never falls by 1 dB in 10 ms; and on wide noise it is held from the
  // first ms after waking. (With ears of 20 ms and a release of 120 ms the
  // gain went from nothing to 11 dB and back on every note; with ears of
  // 1.5 s both ways it came back up by 0.96 dB in a tenth of a second.)
  {
    const size_t n = static_cast<size_t>(4.0f * kRate);
    Stereo notes;
    notes.left.assign(n, 0.0f);
    notes.right.assign(n, 0.0f);
    const double hz[] = {220.0, 329.63, 110.0, 440.0, 277.18, 659.26, 164.81, 880.0};
    const double pan[] = {-0.8, 0.5, 0.0, 0.9, -0.4, 0.7, -0.2, -0.9};
    for (int note = 0; note < 8; ++note) {
      const size_t from = static_cast<size_t>((0.1 + 0.45 * note) * kRate);
      const double gl = std::sqrt(0.5 * (1.0 - pan[note])), gr = std::sqrt(0.5 * (1.0 + pan[note]));
      for (size_t i = from; i < n; ++i) {
        const double t = static_cast<double>(i - from) / kRate;
        if (t > 1.2) break;
        double v = 0.0;
        for (int h = 1; h <= 8; ++h) v += std::sin(2.0 * kPi * hz[note] * h * t) * std::exp(-t * h * 1.5) / h;
        v *= 0.4 * std::min(1.0, t / 0.002) * std::exp(-t / 0.2);
        notes.left[i] += static_cast<float>(gl * v);
        notes.right[i] += static_cast<float>(gr * v);
      }
    }
    Setting hard;
    hard.low = hard.mid = hard.high = 2.0f;
    hard.make = 1.0f;
    hard.safe = 1.0f;
    set(device, hard);
    const std::vector<float> held = held_trace(device, notes);
    double low = 0.0, high = -100.0, rise = 0.0, fall = 0.0;
    const size_t tenth = static_cast<size_t>(0.1f * kRate), hundredth = tenth / 10;
    for (size_t i = static_cast<size_t>(0.45f * kRate); i < n; ++i) {
      rise = std::max<double>(rise, held[i] - held[i - tenth]);
      fall = std::max<double>(fall, held[i - hundredth] - held[i]);
      if (i < static_cast<size_t>(1.3f * kRate)) continue;  // the third note has taken hold by then
      const double side = 0.5 * (notes.left[i] - notes.right[i]);
      if (side * side < 1.0e-6) continue;  // only while there are sides to hear
      low = std::min<double>(low, held[i]);
      high = std::max<double>(high, held[i]);
    }
    rng_state() = 0x9A7Eu;
    Stereo wide;
    wide.left = noise(0.5f, kRate, 0.2f);
    wide.right = noise(0.5f, kRate, 0.2f);
    set(device, hard);
    const std::vector<float> start = held_trace(device, wide);
    std::printf("Safe 1 on notes with gaps: once it has taken hold its gain runs from %.1f to %.1f dB while they sound; it comes back up %.2f dB in a tenth of a second and falls %.2f dB in 10 ms at most; on wide noise %.1f dB 1 ms after waking, %.1f at 100 ms\n",
                low, high, rise, fall, start[48], start[4800]);
    EXPECT(low < -4.0, "Safe is at work on the phrase");
    EXPECT(high - low < 4.0, "once it has taken hold Safe's gain stays within 4 dB over a played phrase");
    EXPECT(rise < 0.6, "Safe's gain comes back up less than 0.6 dB in a tenth of a second: it does not pump");
    EXPECT(fall < 1.0, "Safe's gain falls less than 1 dB in 10 ms: taking hold is not a step");
    EXPECT(std::fabs(start[48] - start[4800]) < 2.0, "after a silence Safe holds from the first ms");
    // The low part of the knob is not dead: with every region wide on wide
    // noise, Safe at 0.2 already holds the sides.
    hard.safe = 0.2f;
    set(device, hard);
    const std::vector<float> loose = held_trace(device, wide);
    std::printf("Safe 0.2, every region wide, wide noise: %.1f dB\n", loose[19200]);
    EXPECT(loose[19200] < -2.0, "Safe at 0.2 holds sides that stand far over the middle");
  }

  // 18. As it starts the device does something to a pad that can be measured
  // and stays mild: a mono pad gets sides (left against right under 0.98,
  // over 0.9), a wide pad keeps its level within 1 dB, loses its sides under
  // 80 Hz and gains them over 4 kHz.
  {
    const Stereo mono = pad(3.0f, false), wide = pad(3.0f, true);
    device.init(kRate);
    Stereo out = run(device, mono.left, mono.right);
    const double c = correlation(out.left, out.right, 24000, 120000);
    const double made = db(rms(sides(out), 24000, 120000) / rms(middle(out), 24000, 120000));
    device.init(kRate);
    Stereo heard = run(device, wide.left, wide.right);
    const double level = db(std::sqrt(0.5 * (std::pow(rms(heard.left), 2.0) + std::pow(rms(heard.right), 2.0))) /
                            std::sqrt(0.5 * (std::pow(rms(wide.left), 2.0) + std::pow(rms(wide.right), 2.0))));
    const double bass = db(band_rms(sides(heard), 55.0) / band_rms(sides(wide), 55.0));
    const double top = db(band_rms(sides(heard), 5000.0) / band_rms(sides(wide), 5000.0));
    std::printf("as it starts: a mono pad comes out with left against right %.3f, sides %.1f dB under the middle; a wide pad %+.2f dB, its sides %.1f dB at 55 Hz and %+.1f dB at 5 kHz\n",
                c, -made, level, bass, top);
    EXPECT(c < 0.98 && c > 0.9, "as it starts a mono pad is opened a little");
    EXPECT(made > -20.0 && made < -10.0, "as it starts a mono pad gets sides 10 to 20 dB under its middle");
    EXPECT(std::fabs(level) < 1.0, "as it starts a wide pad keeps its level within 1 dB");
    EXPECT(bass < -20.0 && top > 3.0, "as it starts a wide pad has its bass in the middle and a wider top");
  }

  // 19. Every preset: a full-scale chord held for a minute peaks no more than
  // 6 dB over the input and does not grow; held tones over the piano's range
  // never come out with less power than went in, and the mono sum is the
  // input's level times the preset's own Output.
  {
    const float seconds = 60.0f;
    std::vector<float> chord = sine(130.81f, seconds, kRate, 0.34f);
    const std::vector<float> e = sine(329.63f, seconds, kRate, 0.33f);
    const std::vector<float> g = sine(1567.98f, seconds, kRate, 0.33f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += e[i] + g[i];
    int count = 0;
    double highest = 0.0, lowest_total = 100.0, worst_sum = 0.0;
    for (const Preset& preset : kPresets) {
      ++count;
      auto load = [&] { load_preset(device, preset); };
      const double trim = std::pow(10.0, value_of(preset, p::kOutput) / 20.0);
      load();
      Stereo out = run(device, chord);
      const size_t n = out.size(), five = static_cast<size_t>(5.0f * kRate);
      const double early = std::max(peak(out.left, five, 2 * five), peak(out.right, five, 2 * five));
      const double late = std::max(peak(out.left, n - five, n), peak(out.right, n - five, n));
      const double top = std::max(peak(out.left), peak(out.right));
      highest = std::max(highest, top);
      if (!(finite(out.left) && finite(out.right) && top < 2.0 && late < early * 1.01)) {
        std::printf("FAIL: preset %s, held chord: peak %.3f, last five seconds %.3f against %.3f\n",
                    preset.name, top, late, early);
        ++failures();
      }
      double total = 100.0, sum = 0.0;
      for (int key = 0; key < 88; key += 4) {
        const float hz = 27.5f * std::pow(2.0f, static_cast<float>(key) / 12.0f);
        const std::vector<float> tone = sine(hz, 0.5f, kRate, 0.5f);
        load();
        Stereo heard = run(device, tone);
        const size_t from = 12000;
        const double in = 0.5 * trim;
        const double l = tone_level(heard.left, hz, kRate, from), r = tone_level(heard.right, hz, kRate, from);
        total = std::min(total, db(std::sqrt(0.5 * (l * l + r * r)) / in));
        sum = std::max(sum, std::fabs(db(tone_level(middle(heard), hz, kRate, from) / in)));
      }
      lowest_total = std::min(lowest_total, total);
      worst_sum = std::max(worst_sum, sum);
      if (!(total > -0.01 && sum < 0.001)) {
        std::printf("FAIL: preset %s, held tones: both sides together %.3f dB at worst, mono sum off by %.4f dB\n",
                    preset.name, total, sum);
        ++failures();
      }
    }
    std::printf("%d presets: held chord peaks %.2f dB over the input at most; held tones never under %.3f dB, mono sum off by %.4f dB at most\n",
                count, db(highest), lowest_total, worst_sum);
    EXPECT(count == 16, "all sixteen presets are held to the level rules");
  }

  // 20. Safe takes hold when the sound becomes too wide, whatever came before,
  // and lets go slowly. A nearly mono chord at -20 dBFS for three seconds,
  // then a steady hiss with as much sides as middle, at the chord's level and
  // 20 and 33 dB under it, through the device as it starts: Safe's gain is
  // within 1 dB of where it ends 0.15, 0.3 and 0.4 s after the change, and
  // from half a second after it the hiss comes out within 0.5 dB of where it
  // settles. The other way round (the hiss, then the chord) the gain comes
  // back up by less than 0.6 dB in any tenth of a second. Neither way does it
  // move by 1 dB in 10 ms. (With ears that took 1.5 s both ways the hold came
  // 1.2 s after a change at one level, 7 s after a fall of 20 dB and not
  // within 9 s after a fall of 33 dB: a mean of power remembers the loud
  // passage. And it let go of 4.6 dB in a twentieth of a second.)
  {
    const float total = 12.0f, at = 3.0f;
    const Stereo chord = narrow_chord(total, -20.0);
    const size_t start = static_cast<size_t>(at * kRate);
    const double under[] = {0.0, 20.0, 33.0};
    const double allowed[] = {0.15, 0.3, 0.4};
    double arrived[3] = {0.0, 0.0, 0.0}, ends[3] = {0.0, 0.0, 0.0}, steepest = 0.0, slowest_rise = 0.0, late = 0.0;
    for (int n = 0; n < 3; ++n) {
      rng_state() = 0x4155u;
      const Stereo hiss = wide_hiss(total, -20.0 - under[n]);
      for (int way = 0; way < 2; ++way) {
        device.init(kRate);
        Stereo heard;
        const std::vector<float> held =
            held_trace(device, way == 0 ? joined(chord, hiss, at) : joined(hiss, chord, at), &heard);
        const double end = held[held.size() - 1];
        for (size_t i = start; i < held.size(); ++i) {
          steepest = std::max<double>(steepest, std::fabs(held[i] - held[i - 480]));
          if (way == 1) slowest_rise = std::max<double>(slowest_rise, held[i] - held[i - 4800]);
        }
        if (way == 1) continue;
        ends[n] = end;
        size_t within = start;
        for (size_t i = held.size(); i-- > start;) {
          if (std::fabs(held[i] - end) > 1.0) {
            within = i + 1;
            break;
          }
        }
        arrived[n] = static_cast<double>(within - start) / kRate;
        const double settled = level_db(heard, total - 2.0, total);
        for (double t = at + 0.5; t + 0.25 <= total; t += 0.25) {
          late = std::max(late, std::fabs(level_db(heard, t, t + 0.25) - settled));
        }
      }
    }
    std::printf("a narrow chord, then a wide hiss at its level, 20 and 33 dB under: Safe ends at %.1f, %.1f and %.1f dB and is within 1 dB of that %.0f, %.0f and %.0f ms after the change; from 0.5 s on the hiss stays within %.2f dB of where it settles; the gain moves %.2f dB in 10 ms at most and comes back up %.2f dB in a tenth of a second at most\n",
                ends[0], ends[1], ends[2], 1000.0 * arrived[0], 1000.0 * arrived[1], 1000.0 * arrived[2], late,
                steepest, slowest_rise);
    for (int n = 0; n < 3; ++n) {
      EXPECT(ends[n] < -3.0, "as it starts Safe holds a wide hiss, however quiet after the chord");
      EXPECT(arrived[n] < allowed[n], "Safe takes hold within a few hundred ms, whatever came before");
    }
    EXPECT(late < 0.5, "half a second after the change a steady hiss comes out steady");
    EXPECT(steepest < 1.0, "Safe's gain never moves 1 dB in 10 ms: no step");
    EXPECT(slowest_rise < 0.6, "Safe lets go slowly: under 0.6 dB in a tenth of a second");
  }

  // 21. The bank's own measurement: six seconds of its phrase and, under it
  // and for sixteen seconds after, a steady hiss at -55 dBFS with its two
  // sides independent. Through "Firm and airy" and "Hazy edges" the hiss
  // comes out at one level from the first window after the phrase. (It came
  // out 2.9 and 4.5 dB louder until eight to ten seconds after the phrase.)
  {
    rng_state() = 0x99u;
    Stereo in = wide_hiss(22.0f, -55.0);
    const Stereo phrase = bank_phrase(6.0f);
    for (size_t i = 0; i < phrase.size(); ++i) {
      in.left[i] += phrase.left[i];
      in.right[i] += phrase.right[i];
    }
    for (const char* name : {"Firm and airy", "Hazy edges"}) {
      load_preset(device, preset_named(name));
      const Stereo out = run(device, in.left, in.right);
      const double first = level_db(out, 6.0, 8.0), settled = level_db(out, 20.0, 22.0);
      std::printf("%s, the bank's phrase and then its hiss: %.1f dBFS from 6 to 8 s, %.1f from 20 to 22 s\n", name,
                  first, settled);
      EXPECT_NEAR(first, settled, 0.3, "a steady hiss after the phrase comes out steady from the start");
    }
  }

  // 22. The ends of notes do not pull Safe down. A mono chord switched on for
  // 300 ms and off for 300 (2 ms fades), every region wide, Make and Smear
  // full, Safe 1: after the first second the gain stays within 0.5 dB and no
  // deeper than half a dB under the ceiling. The made sides ring on after the
  // middle has stopped, so an ear on the middle alone hears them as too wide
  // at the end of every note (it sat 1.8 dB under the ceiling with the short
  // ears before the scattered middle was heard as well).
  {
    const size_t n = static_cast<size_t>(4.0f * kRate);
    Stereo bursts;
    bursts.left.assign(n, 0.0f);
    for (size_t i = 0; i < n; ++i) {
      const double t = static_cast<double>(i) / kRate, in_cycle = std::fmod(t, 0.6);
      const double env = in_cycle < 0.3 ? std::min(1.0, std::min(in_cycle, 0.3 - in_cycle) / 0.002) : 0.0;
      double v = 0.0;
      for (double f : {220.0, 277.18, 329.63, 880.0}) {
        v += 0.1 * std::sin(2.0 * kPi * f * t) + 0.05 * std::sin(2.0 * kPi * 3.0 * f * t);
      }
      bursts.left[i] = static_cast<float>(env * v);
    }
    bursts.right = bursts.left;
    Setting hard;
    hard.low = hard.mid = hard.high = 2.0f;
    hard.make = 1.0f;
    hard.smear = 1.0f;
    hard.safe = 1.0f;
    set(device, hard);
    const std::vector<float> held = held_trace(device, bursts);
    double low = 0.0, high = -100.0;
    for (size_t i = static_cast<size_t>(kRate); i < n; ++i) {
      low = std::min<double>(low, held[i]);
      high = std::max<double>(high, held[i]);
    }
    std::printf("a mono chord switched on and off, Smear 1, Safe 1: Safe's gain runs from %.2f to %.2f dB\n", low, high);
    EXPECT(high - low < 0.5, "the ends of notes do not move Safe's gain");
    EXPECT(low > -12.5, "the ends of notes do not pull Safe under its ceiling");
  }

  // 23. No preset passes full scale on the bank's measure: its phrase scaled
  // to peak at -1 dBFS, six seconds and two more of nothing. Width made from
  // a mono sound is added to one side and taken from the other, so it raises
  // the peak (every region wide with Make full: 3.4 dB on this phrase before
  // Output); the device does not hold peaks, and a preset's Output leaves the
  // room. ("Everything wide" at -3 dB came out at +0.4 dBFS and "Wide pad"
  // at -1 dB at +0.2.)
  {
    Stereo hot = bank_phrase(6.0f);
    const float scale = static_cast<float>(std::pow(10.0, -1.0 / 20.0) / std::max(peak(hot.left), peak(hot.right)));
    for (float& v : hot.left) v *= scale;
    for (float& v : hot.right) v *= scale;
    hot.left.resize(static_cast<size_t>(8.0f * kRate), 0.0f);
    hot.right.resize(static_cast<size_t>(8.0f * kRate), 0.0f);
    double highest = 0.0;
    const char* highest_name = "";
    for (const Preset& preset : kPresets) {
      load_preset(device, preset);
      const Stereo out = run(device, hot.left, hot.right);
      const double top = std::max(peak(out.left), peak(out.right));
      if (top > highest) {
        highest = top;
        highest_name = preset.name;
      }
      if (!(top < 1.0)) {
        std::printf("FAIL: preset %s fed the bank's phrase at -1 dBFS peaks at %+.2f dBFS\n", preset.name, db(top));
        ++failures();
      }
    }
    std::printf("the bank's phrase at -1 dBFS through every preset: the highest peak is %.2f dBFS (%s)\n", db(highest),
                highest_name);
  }

  // 24. "Everything wide" is what its name says, and Safe gives back what it
  // promises. Held notes of three partials over three octaves, the same on
  // both sides, in quarter seconds from the first second on: the mono sum
  // stands 3.0 dB under the two sides (the sides are as loud as the middle).
  // With Safe up the sides are held to its ceiling c under the middle (3, 7.5
  // and 12 dB at 0.5, 0.75 and 1) and the loss is 10·log10(1 + 10^(-c/10)):
  // 1.76, 0.71 and 0.27 dB.
  {
    const Preset& wide = preset_named("Everything wide");
    const float safes[] = {0.0f, 0.5f, 0.75f, 1.0f};
    const double ceiling_db[] = {0.0, 3.0, 7.5, 12.0};
    double loss[4] = {0.0, 0.0, 0.0, 0.0}, off = 0.0;
    for (int n = 0; n < 4; ++n) {
      for (int note : {45, 52, 57, 64, 69, 76, 81}) {
        const double f = 440.0 * std::pow(2.0, (note - 69) / 12.0);
        const size_t frames = static_cast<size_t>(4.0f * kRate);
        std::vector<float> tone(frames);
        for (size_t i = 0; i < frames; ++i) {
          double v = 0.0;
          for (int partial = 1; partial <= 3; ++partial) {
            v += std::sin(2.0 * kPi * f * partial * static_cast<double>(i) / kRate + note * 0.7 + partial) /
                 std::pow(2.0, partial - 1);
          }
          tone[i] = static_cast<float>(0.1 * v * std::min(1.0, static_cast<double>(i) / 960.0));
        }
        load_preset(device, wide);
        device.set_param(p::kSafe, safes[n]);
        const Stereo out = run(device, tone);
        const std::vector<float> mono = middle(out);
        for (size_t a = 48000; a + 12000 <= frames; a += 12000) {
          const double both = std::sqrt(0.5 * (std::pow(rms(out.left, a, a + 12000), 2.0) +
                                               std::pow(rms(out.right, a, a + 12000), 2.0)));
          const double fold = db(both / rms(mono, a, a + 12000));
          loss[n] = std::max(loss[n], fold);
          off = std::max(off, std::fabs(fold - 10.0 * std::log10(1.0 + std::pow(10.0, -ceiling_db[n] / 10.0))));
        }
      }
    }
    std::printf("\"Everything wide\" on held notes: the mono sum is %.2f dB under the two sides at worst; with Safe 0.5, 0.75 and 1 %.2f, %.2f and %.2f dB; off what the ceiling gives by %.2f dB at most\n",
                loss[0], loss[1], loss[2], loss[3], off);
    EXPECT(off < 0.15, "the mono sum loses what the sides' ceiling says, in every quarter second");
  }

  // 25. Starting is the same as waking. The phrase through "Wide but safe"
  // from a fresh start with the preset just set, and again after a burst of
  // noise and a second and a half of silence with no knob touched: the same
  // samples. (A knob set before the first sound left Safe's ears quick for
  // the first tenth of a second, as after a knob moved while sounding, and
  // a wake did not: the two differed by 0.009 on a phrase that peaks at 0.3.)
  {
    const Stereo phrase = bank_phrase(3.0f);
    load_preset(device, preset_named("Wide but safe"));
    const Stereo fresh = run(device, phrase.left, phrase.right);
    load_preset(device, preset_named("Wide but safe"));
    rng_state() = 0x51EEu;
    run(device, noise(0.5f, kRate, 0.3f));
    run(device, silence(1.5f, kRate));
    const Stereo woken = run(device, phrase.left, phrase.right);
    EXPECT(fresh.left == woken.left && fresh.right == woken.right,
           "a start with the knobs just set is the same as waking after a silence");
  }

  // 26. Safe's times are times at every sample rate: a mono chord for a
  // second, then noise with as much sides as middle at the same level,
  // through the device as it starts at 44.1, 48 and 96 kHz. The gain is
  // within 1 dB of where it ends at the same moment to 15 ms; and with the
  // two the other way round it is halfway back at the same moment to 0.1 s.
  {
    double arrived[3], halfway[3], depth[3];
    int n = 0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      const size_t total = static_cast<size_t>(6.0f * rate), cut = static_cast<size_t>(1.0f * rate);
      Stereo chord, hiss;
      chord.left = sine(220.0f, 6.0f, rate, 0.1f);
      const std::vector<float> fifth = sine(329.63f, 6.0f, rate, 0.1f);
      for (size_t i = 0; i < total; ++i) chord.left[i] += fifth[i];
      chord.right = chord.left;
      rng_state() = 0x4155u;
      hiss.left = noise(6.0f, rate, 0.17f);
      hiss.right = noise(6.0f, rate, 0.17f);
      for (int way = 0; way < 2; ++way) {
        device.init(rate);
        const Stereo& first = way == 0 ? chord : hiss;
        const Stereo& then = way == 0 ? hiss : chord;
        std::vector<float> held(total);
        for (size_t i = 0; i < total; ++i) {
          device.in_left()[0] = i < cut ? first.left[i] : then.left[i];
          device.in_right()[0] = i < cut ? first.right[i] : then.right[i];
          device.process(1);
          held[i] = device.meter(0);
        }
        const double before = held[cut - 1], end = held[total - 1];
        if (way == 0) {
          depth[n] = end;
          size_t within = cut;
          for (size_t i = total; i-- > cut;) {
            if (std::fabs(held[i] - end) > 1.0) {
              within = i + 1;
              break;
            }
          }
          arrived[n] = static_cast<double>(within - cut) / rate;
        } else {
          size_t half = total;
          for (size_t i = cut; i < total; ++i) {
            if (held[i] > 0.5 * (before + end)) {
              half = i;
              break;
            }
          }
          halfway[n] = static_cast<double>(half - cut) / rate;
        }
      }
      ++n;
    }
    std::printf("Safe at 44.1, 48 and 96 kHz: takes hold (%.1f, %.1f, %.1f dB) within 1 dB after %.0f, %.0f, %.0f ms; halfway back after %.2f, %.2f, %.2f s\n",
                depth[0], depth[1], depth[2], 1000.0 * arrived[0], 1000.0 * arrived[1], 1000.0 * arrived[2],
                halfway[0], halfway[1], halfway[2]);
    EXPECT(depth[1] < -3.0, "as it starts Safe holds noise with as much sides as middle");
    EXPECT(std::fabs(arrived[0] - arrived[1]) < 0.015 && std::fabs(arrived[2] - arrived[1]) < 0.015,
           "Safe takes hold in the same time at every sample rate");
    EXPECT(std::fabs(halfway[0] - halfway[1]) < 0.1 && std::fabs(halfway[2] - halfway[1]) < 0.1,
           "Safe lets go in the same time at every sample rate");
  }

  // 27. What the second reading found: a day of sound without a silence. The
  // count of samples since waking was 32 bits wide and came round to nought
  // after 2^32 of them (24.9 hours at 48 kHz, 6.2 at 192 kHz); the gain's
  // "mean so far" divides by that count, so Safe's gain and both outputs
  // were not numbers from that sample until the next silence. Two devices
  // hear the same wide noise; one has its count put half a second short of
  // 2^32 on the way. They stay the same, bit for bit, through it and after.
  {
    static Spread late;
    rng_state() = 0x2B32u;
    Stereo wide;
    wide.left = noise(2.0f, kRate, 0.25f);
    wide.right = noise(2.0f, kRate, 0.25f);
    const size_t half = static_cast<size_t>(0.5f * kRate);
    const std::vector<float> first_left(wide.left.begin(), wide.left.begin() + half);
    const std::vector<float> first_right(wide.right.begin(), wide.right.begin() + half);
    const std::vector<float> rest_left(wide.left.begin() + half, wide.left.end());
    const std::vector<float> rest_right(wide.right.begin() + half, wide.right.end());
    device.init(kRate);
    late.init(kRate);
    run(device, first_left, first_right);
    run(late, first_left, first_right);
    const uint64_t round = 1ull << 32;
    late.add_awake_periods((round - half - late.awake_samples()) / 16);
    const uint64_t before = late.awake_samples();
    const Stereo plain = run(device, rest_left, rest_right);
    const Stereo day = run(late, rest_left, rest_right);
    std::printf("a count of samples put at 2^32 - %llu and 1.5 s more of sound: the count is then 2^32 + %lld, Safe's gain %.2f dB (%.2f dB without the day)\n",
                static_cast<unsigned long long>(round - before),
                static_cast<long long>(late.awake_samples()) - static_cast<long long>(round), late.meter(0),
                device.meter(0));
    EXPECT(before == round - half, "the count stands half a second short of 2^32");
    EXPECT(late.awake_samples() > round, "the count goes on past 2^32");
    EXPECT(finite(day.left) && finite(day.right), "the output is finite through the 2^32nd sample awake");
    EXPECT(day.left == plain.left && day.right == plain.right,
           "a day awake changes nothing: the same output, bit for bit");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spread", 10.0f, kRate, [&] { run(device, input); });
  // The worst setting: every region wide, Make and Smear full, Safe holding.
  Setting worst;
  worst.low = worst.mid = worst.high = 2.0f;
  worst.make = 1.0f;
  worst.smear = 1.0f;
  worst.safe = 1.0f;
  set(device, worst);
  report_cost("spread, everything up", 10.0f, kRate, [&] { run(device, input); });

  return finish("spread");
}
