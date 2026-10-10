// Native harness for Weather (cpp/devices/weather). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes each weather that weather, by
// measurement of the sound: the gusts' sudden rise and slow fall, the rain's
// drops per second, the surf's period, how far a cloud dims the top end, and
// that the weather is exactly nothing at Force 0, at Exposure 0 with Voice 0
// and at Mix 0.

#include "../devices/weather/weather.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Weather;
namespace p = livemix::weather;
namespace wm = livemix::weather_models;

static Weather device;

static const float kRate = 48000.0f;

enum Meter : int { kLevel = 0, kGain, kDropCount, kGate, kRollCount };

static const char* kKindNames[Weather::kKinds] = {"Wind", "Clouds", "Rain", "Surf", "Storm"};

// Run with any argument to have every measurement printed, not only the ones that fail.
static bool verbose = false;
#define MEASURED(condition, message)                 \
  do {                                               \
    if (verbose) std::printf("  %s\n", message);     \
    EXPECT(condition, message);                      \
  } while (0)

static void set(std::initializer_list<std::pair<int, float>> values) {
  for (const auto& value : values) device.set_param(value.first, value.second);
}

// A device set to do one thing and nothing else: no weather sound, all of its
// effect on the sound, nothing from side to side.
static void bare(int kind) {
  device.init(kRate);
  set({{p::kKind, static_cast<float>(kind)},
       {p::kForce, 1.0f},
       {p::kExposure, 1.0f},
       {p::kVoice, 0.0f},
       {p::kSway, 0.0f},
       {p::kCalm, 0.0f}});
}

// The level of `x` in dB against `reference`, in windows of `window` samples.
static std::vector<double> envelope_db(const std::vector<float>& x, size_t window, double reference) {
  std::vector<double> out;
  for (size_t at = 0; at + window <= x.size(); at += window) {
    out.push_back(db(rms(x, at, at + window) / reference));
  }
  return out;
}

// The level of the tone at `hz` in `x`, in dB against an amplitude of
// `reference`, in windows of `window` samples (a whole number of periods).
// Unlike the plain level this does not count what the sheen adds.
static std::vector<double> tone_db(const std::vector<float>& x, double hz, size_t window, double reference) {
  std::vector<double> out;
  for (size_t at = 0; at + window <= x.size(); at += window) {
    out.push_back(db(tone_level(x, hz, kRate, at, at + window) / reference));
  }
  return out;
}

// How many times a series goes down through `below` after having been above `above`.
static int dips(const std::vector<double>& series, double below, double above) {
  int count = 0;
  bool up = true;
  for (double value : series) {
    if (up && value < below) {
      ++count;
      up = false;
    } else if (!up && value > above) {
      up = true;
    }
  }
  return count;
}

// The share of the energy above (or below) `hz`, through four one-pole
// filters in a row: steep enough that a tone two octaves away does not count.
static double steep_share(const std::vector<float>& x, double hz, double rate, bool above) {
  const double a = std::exp(-2.0 * kPi * hz / rate);
  double low[4] = {0.0, 0.0, 0.0, 0.0};
  double kept = 0.0, total = 0.0;
  for (float sample : x) {
    double value = sample;
    for (double& state : low) {
      state = value + (state - value) * a;
      value = above ? value - state : state;
    }
    kept += value * value;
    total += static_cast<double>(sample) * sample;
  }
  return total > 0.0 ? kept / total : 0.0;
}

// The largest share of a window's energy that is not the tone at `hz`, over
// windows of `window` samples (a whole number of the tone's periods).
static double off_tone(const std::vector<float>& x, double hz, double rate, size_t window) {
  double worst = 0.0;
  for (size_t at = window; at + window <= x.size(); at += window) {
    const double all = rms(x, at, at + window);
    const double tone = tone_level(x, hz, rate, at, at + window) / std::sqrt(2.0);
    if (all > 1.0e-6) worst = std::max(worst, 1.0 - (tone * tone) / (all * all));
  }
  return worst;
}

// The skew of the steps of a series: below zero when it falls in jumps and climbs back slowly.
static double step_skew(const std::vector<double>& series) {
  double mean = 0.0, second = 0.0, third = 0.0;
  const double count = static_cast<double>(series.size() - 1);
  for (size_t i = 1; i < series.size(); ++i) mean += (series[i] - series[i - 1]) / count;
  for (size_t i = 1; i < series.size(); ++i) {
    const double step = series[i] - series[i - 1] - mean;
    second += step * step / count;
    third += step * step * step / count;
  }
  return third / std::pow(std::max(second, 1.0e-12), 1.5);
}

// The mean of the largest `share` of the values.
static double top_mean(std::vector<double> values, double share) {
  if (values.empty()) return 0.0;
  std::sort(values.begin(), values.end());
  const size_t count = std::max<size_t>(1, static_cast<size_t>(share * values.size()));
  double sum = 0.0;
  for (size_t i = values.size() - count; i < values.size(); ++i) sum += values[i];
  return sum / static_cast<double>(count);
}

// One of the device's two shade stages at `hz` for a shelf of depth `k`, as a
// gain: kit::OnePole is y = x + (y - x) a with a = exp(-2 pi corner / rate),
// and a stage is x - k (x - lowpass(x)).
static double shade_stage(double k, double hz, double corner, double rate) {
  const double a = std::exp(-2.0 * kPi * corner / rate);
  const double w = 2.0 * kPi * hz / rate;
  const double den_re = 1.0 - a * std::cos(w), den_im = a * std::sin(w);
  const double den = den_re * den_re + den_im * den_im;
  const double lp_re = (1.0 - a) * den_re / den, lp_im = -(1.0 - a) * den_im / den;
  const double re = (1.0 - k) + k * lp_re, im = k * lp_im;
  return std::sqrt(re * re + im * im);
}

// What a cover of `cover` does to a tone at `hz` under one layer at Force 1
// and Exposure 1, in dB (a negative number): the level and the two shelves.
static double covered_db(int layer, double cover, double hz, double colour) {
  const double corner = Weather::kShadeLowHz * std::pow(Weather::kShadeHighHz / Weather::kShadeLowHz, colour);
  const double k = 1.0 - std::pow(10.0, -Weather::kShadeDb[layer] * cover / 40.0);
  return -Weather::kDipDb[layer] * cover + 2.0 * db(shade_stage(k, hz, corner, kRate));
}

// The same input run through with and without one change made at `at`
// samples; the largest step after the change against the largest anywhere in
// two runs that have no change in them.
template <typename Before, typename After>
static void click_check(const char* what, Before before, After after, const std::vector<float>& input,
                        size_t at) {
  const std::vector<float> head(input.begin(), input.begin() + at);
  const std::vector<float> rest(input.begin() + at, input.end());
  before();
  Stereo steady_before = run(device, input);
  before();
  after();
  Stereo steady_after = run(device, input);
  before();
  run(device, head);
  after();
  Stereo changed = run(device, rest);
  const double reference = std::max({max_step(steady_before.left), max_step(steady_before.right),
                                     max_step(steady_after.left), max_step(steady_after.right)});
  const double moved = std::max(max_step(changed.left), max_step(changed.right));
  char label[200];
  std::snprintf(label, sizeof label, "%s does not click (largest step %g against %g with no change)", what,
                moved, reference);
  MEASURED(moved <= reference * 1.25 + 1.0e-4, label);
}

int main(int argc, char**) {
  verbose = argc > 1;
  Conformance spec;
  spec.name = "weather";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;  // Linger starts at 10 s, and the fade takes 0.8
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  char label[240];

  // Force 0, Mix 0, and Exposure 0 with Voice 0 are each the input, sample for sample, in every weather.
  {
    rng_state() = 0xA11CEu;
    const std::vector<float> left = noise(2.0f, kRate, 0.5f);
    const std::vector<float> right = noise(2.0f, kRate, 0.5f);
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      const std::pair<int, float> nothing[3][2] = {
          {{p::kForce, 0.0f}, {p::kVoice, 1.0f}},
          {{p::kMix, 0.0f}, {p::kVoice, 1.0f}},
          {{p::kExposure, 0.0f}, {p::kVoice, 0.0f}},
      };
      const char* names[3] = {"Force 0", "Mix 0", "Exposure 0 with Voice 0"};
      for (int which = 0; which < 3; ++which) {
        device.init(kRate);
        set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f}});
        set({nothing[which][0], nothing[which][1]});
        Stereo out = run(device, left, right);
        std::snprintf(label, sizeof label, "%s: %s is the input, sample for sample", kKindNames[kind],
                      names[which]);
        MEASURED(out.left == left && out.right == right, label);
      }
    }
  }

  // Voice 0 adds no sound of its own: nothing in silence, and under a tone
  // nothing but the tone (Clouds and Rain, which have no sheen).
  {
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      bare(kind);
      Stereo quiet = render(device, 2.0f, kRate);
      std::snprintf(label, sizeof label, "%s: Voice 0 in silence is silence", kKindNames[kind]);
      MEASURED(peak(quiet.left) == 0.0 && peak(quiet.right) == 0.0, label);
    }
    for (int kind : {Weather::kClouds, Weather::kRain}) {
      double hiss[2] = {0.0, 0.0};
      for (int which = 0; which < 2; ++which) {
        bare(kind);
        device.set_param(p::kVoice, which == 0 ? 0.0f : 1.0f);
        Stereo out = run(device, sine(200.0f, 20.0f, kRate, 0.5f));
        hiss[which] = 10.0 * std::log10(std::max(steep_share(out.left, 6000.0, kRate, true), 1.0e-20));
      }
      std::snprintf(label, sizeof label,
                    "%s: Voice 0 adds nothing to a 200 Hz tone (%.0f dB of it above 6 kHz; %.0f dB with Voice up)",
                    kKindNames[kind], hiss[0], hiss[1]);
      MEASURED(hiss[0] < -70.0 && hiss[1] > hiss[0] + 25.0, label);
    }
    // Under a cloud a tone is that tone and nothing else, window by window.
    {
      bare(Weather::kClouds);
      Stereo out = run(device, sine(200.0f, 60.0f, kRate, 0.5f));
      const double off = off_tone(out.left, 200.0, kRate, 4800);
      std::snprintf(label, sizeof label, "Clouds: Voice 0 leaves a tone a tone (%.5f of a window is anything else)",
                    off);
      MEASURED(off < 0.002, label);
    }
    // And Voice is what adds it: the same in silence after a note, with Voice up.
    bare(Weather::kWind);
    device.set_param(p::kVoice, 1.0f);
    run(device, sine(200.0f, 0.5f, kRate, 0.5f));
    Stereo wind = render(device, 4.0f, kRate);
    MEASURED(rms(wind.left) > 0.01, "Wind: Voice up is heard after the note, through Linger");
  }

  // Exposure 0 leaves the sound's level alone, with the weather's own sound on top.
  {
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 0.0f}, {p::kVoice, 0.5f},
           {p::kCalm, 0.0f}});
      const float seconds = 20.0f;
      Stereo out = run(device, sine(1000.0f, seconds, kRate, 0.5f));
      // In windows: the tone is at its level in every one of them.
      double worst = 0.0;
      const size_t window = 4800;
      for (size_t at = 0; at + window <= out.left.size(); at += window) {
        worst = std::max(worst, std::fabs(db(tone_level(out.left, 1000.0, kRate, at, at + window) / 0.5)));
      }
      std::snprintf(label, sizeof label, "%s: Exposure 0 leaves the level alone (off by %.2f dB at the most)",
                    kKindNames[kind], worst);
      MEASURED(worst < 0.5, label);
      MEASURED(energy_above(out.left, 4000.0, kRate) > 1.0e-7 || kind == Weather::kClouds,
             "the weather's own sound is there with Exposure 0");
    }
  }

  // Wind: a gust comes up fast and dies away slowly. Under a steady tone the
  // level falls in a moment and comes back over seconds.
  double gust_rise = 0.0, gust_fall = 0.0;
  {
    bare(Weather::kWind);
    device.set_param(p::kCalm, 0.6f);
    Stereo out = run(device, sine(440.0f, 240.0f, kRate, 0.5f));
    // Quarter-second windows take most of the flutter out.
    const std::vector<double> level = envelope_db(out.left, 12000, 0.5 / std::sqrt(2.0));
    std::vector<double> falls, rises;
    for (size_t i = 1; i < level.size(); ++i) {
      const double step = level[i] - level[i - 1];
      (step < 0.0 ? falls : rises).push_back(std::fabs(step));
    }
    gust_rise = top_mean(falls, 0.05);  // the gust rising is the level falling
    gust_fall = top_mean(rises, 0.05);
    // The flutter on a gust goes both ways alike; the gust itself does not,
    // and that is the skew of the steps.
    const double skew = step_skew(level);
    std::snprintf(label, sizeof label,
                  "Wind: gusts rise fast and fall slowly (largest steps %.2f dB down, %.2f dB back up, skew %.2f)",
                  gust_rise, gust_fall, skew);
    MEASURED(gust_rise > 1.7 * gust_fall && skew < -1.0, label);
    const double deepest = *std::min_element(level.begin(), level.end());
    std::snprintf(label, sizeof label, "Wind: a full gust takes the level down by about %.0f dB (%.1f)",
                  Weather::kDipDb[Weather::kGusts], -deepest);
    MEASURED(-deepest > 0.7 * Weather::kDipDb[Weather::kGusts] && -deepest < Weather::kDipDb[Weather::kGusts] + 0.5,
           label);
    // And there are lulls: the level is back within half a dB for a good part of the time.
    size_t open = 0;
    for (double value : level) open += value > -0.5 ? 1 : 0;
    const double share = static_cast<double>(open) / static_cast<double>(level.size());
    std::snprintf(label, sizeof label, "Wind: lulls leave the sound alone (%.0f%% of the time at Calm 0.6)",
                  100.0 * share);
    MEASURED(share > 0.15 && share < 0.9, label);
  }

  // Wind: Pace is the speed of the same weather. Twice the Pace, twice as many gusts.
  {
    int gusts[2] = {0, 0};
    for (int which = 0; which < 2; ++which) {
      bare(Weather::kWind);
      set({{p::kCalm, 0.6f}, {p::kPace, which == 0 ? 1.0f : 2.0f}});
      Stereo out = run(device, sine(440.0f, 240.0f, kRate, 0.5f));
      gusts[which] = dips(envelope_db(out.left, 4800, 0.5 / std::sqrt(2.0)), -3.0, -1.0);
    }
    std::snprintf(label, sizeof label, "Wind: Pace 2 has twice the gusts of Pace 1 (%d against %d in four minutes)",
                  gusts[1], gusts[0]);
    MEASURED(gusts[0] > 15 && gusts[1] > 1.5 * gusts[0] && gusts[1] < 2.6 * gusts[0], label);
  }

  // Clouds: the top end dims by what the two shelves say, for whatever cover
  // the level shows. A low and a high tone together: the low one tells the
  // cover, the high one must then be where the formula puts it.
  {
    bare(Weather::kClouds);
    device.set_param(p::kPace, 2.0f);
    const float seconds = 120.0f;
    std::vector<float> two = sine(300.0f, seconds, kRate, 0.25f);
    const std::vector<float> high = sine(8000.0f, seconds, kRate, 0.25f);
    for (size_t i = 0; i < two.size(); ++i) two[i] += high[i];
    Stereo out = run(device, two);
    const size_t window = 4800;
    double worst = 0.0, deepest_cover = 0.0, deepest_high = 0.0;
    for (size_t at = 0; at + window <= out.left.size(); at += window) {
      const double low_db = db(tone_level(out.left, 300.0, kRate, at, at + window) / 0.25);
      const double high_db = db(tone_level(out.left, 8000.0, kRate, at, at + window) / 0.25);
      // The cover that puts the low tone there (it only falls as the cover grows).
      double lo = 0.0, hi = 1.0;
      for (int i = 0; i < 40; ++i) {
        const double mid = 0.5 * (lo + hi);
        (covered_db(Weather::kShadows, mid, 300.0, 0.5) > low_db ? lo : hi) = mid;
      }
      const double cover = 0.5 * (lo + hi);
      const double predicted = covered_db(Weather::kShadows, cover, 8000.0, 0.5);
      worst = std::max(worst, std::fabs(high_db - predicted));
      deepest_cover = std::max(deepest_cover, cover);
      deepest_high = std::min(deepest_high, high_db);
    }
    std::snprintf(label, sizeof label,
                  "Clouds: 8 kHz dims by the predicted amount under every cover (off by %.2f dB at the most)",
                  worst);
    MEASURED(worst < 0.6, label);
    const double full = covered_db(Weather::kShadows, 1.0, 8000.0, 0.5);
    std::snprintf(label, sizeof label,
                  "Clouds: the deepest shadow (cover %.2f) takes 8 kHz down %.1f dB; a whole one would take %.1f",
                  deepest_cover, -deepest_high, -full);
    MEASURED(deepest_cover > 0.8 && deepest_cover <= 1.001 && deepest_high > full - 0.3 &&
               deepest_high < 0.75 * full,
           label);
    // And far more than the low end, which is why it is a shadow and not a fader.
    const double low_most = db(tone_level(out.left, 300.0, kRate, 0, out.left.size()) / 0.25);
    double low_deepest = 0.0;
    for (size_t at = 0; at + window <= out.left.size(); at += window) {
      low_deepest = std::min(low_deepest, db(tone_level(out.left, 300.0, kRate, at, at + window) / 0.25));
    }
    (void)low_most;
    std::snprintf(label, sizeof label,
                  "Clouds: a shadow is on the top end (%.1f dB off 8 kHz where 300 Hz loses %.1f)", -deepest_high,
                  -low_deepest);
    MEASURED(deepest_high < 2.5 * low_deepest && low_deepest > -Weather::kDipDb[Weather::kShadows] - 1.5, label);
  }

  // Clouds: a shadow lies for seconds and passes, and Calm sets how long the sun is out between two.
  {
    double shadowed[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      bare(Weather::kClouds);
      device.set_param(p::kCalm, which == 0 ? 0.0f : 0.8f);
      Stereo out = run(device, sine(8000.0f, 300.0f, kRate, 0.25f));
      const std::vector<double> level = envelope_db(out.left, 4800, 0.25 / std::sqrt(2.0));
      size_t under = 0;
      for (double value : level) under += value < -3.0 ? 1 : 0;
      shadowed[which] = static_cast<double>(under) / static_cast<double>(level.size());
    }
    std::snprintf(label, sizeof label,
                  "Clouds: Calm lengthens the sun between shadows (shadowed %.0f%% of the time at 0, %.0f%% at 0.8)",
                  100.0 * shadowed[0], 100.0 * shadowed[1]);
    MEASURED(shadowed[0] > 0.6 && shadowed[1] < 0.5 * shadowed[0] && shadowed[1] > 0.05, label);
  }

  // Rain: drops per second follow Force and Pace. The device counts them; the
  // ticks are counted in the sound too, where they are sparse enough to tell apart.
  {
    const float seconds = 120.0f;
    const auto count = [&](float force, float pace) {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(Weather::kRain)}, {p::kForce, force}, {p::kPace, pace},
           {p::kCalm, 0.0f}});
      run(device, sine(220.0f, seconds, kRate, 0.1f));
      return static_cast<double>(device.meter(kDropCount));
    };
    const double half = count(0.5f, 1.0f), full = count(1.0f, 1.0f), fast = count(0.5f, 2.0f);
    const double none = count(0.0f, 1.0f);
    // Between showers the rain is at kFloor of its thickest; in them, all of it.
    const double most = wm::Rain::kRate * 0.5 * seconds, least = wm::Rain::kFloor * most;
    std::snprintf(label, sizeof label,
                  "Rain: Force 0.5 at Pace 1 drops %.1f a second (between %.1f and %.1f by the model)",
                  half / seconds, least / seconds, most / seconds);
    MEASURED(half > least && half < most, label);
    std::snprintf(label, sizeof label, "Rain: twice the Force is twice the drops (%.0f against %.0f)", full, half);
    MEASURED(full > 1.8 * half && full < 2.2 * half, label);
    std::snprintf(label, sizeof label, "Rain: twice the Pace is twice the drops (%.0f against %.0f)", fast, half);
    MEASURED(fast > 1.7 * half && fast < 2.3 * half, label);
    MEASURED(none == 0.0, "Rain: Force 0 drops nothing");

    // Heard: bright ticks over next to no input, counted by their onsets.
    device.init(kRate);
    set({{p::kKind, static_cast<float>(Weather::kRain)}, {p::kForce, 0.2f}, {p::kVoice, 1.0f}, {p::kColour, 1.0f},
         {p::kSway, 0.0f}, {p::kCalm, 0.0f}});
    Stereo out = run(device, sine(100.0f, 60.0f, kRate, 0.0005f));
    const double counted = device.meter(kDropCount);
    int heard = 0;
    {
      // Above 3 kHz, the size of the signal with 0.5 ms of smoothing; an
      // onset is a rise through a third of the loudest, 10 ms after the last.
      const double a = std::exp(-2.0 * kPi * 3000.0 / kRate), keep = std::exp(-1.0 / (0.0005 * kRate));
      std::vector<double> size(out.left.size());
      double low = 0.0, env = 0.0, most_heard = 0.0;
      for (size_t i = 0; i < out.left.size(); ++i) {
        low = out.left[i] + (low - out.left[i]) * a;
        const double magnitude = std::fabs(out.left[i] - low);
        env = magnitude > env ? magnitude : env * keep;
        size[i] = env;
        most_heard = std::max(most_heard, env);
      }
      size_t last = 0;
      bool up = false;
      for (size_t i = 0; i < size.size(); ++i) {
        if (!up && size[i] > 0.3 * most_heard && i - last > 480) {
          ++heard;
          up = true;
          last = i;
        } else if (up && size[i] < 0.12 * most_heard) {
          up = false;
        }
      }
    }
    std::snprintf(label, sizeof label, "Rain: the drops are heard as ticks (%d onsets for %.0f drops)", heard,
                  counted);
    MEASURED(counted > 100.0 && heard > 0.6 * counted && heard < 1.1 * counted, label);
  }

  // Rain: each drop is a tiny duck, there and gone. At a slow Pace the drops
  // stand apart: as many dips in the level as drops, near enough, each back
  // up within a tenth of a second.
  {
    bare(Weather::kRain);
    device.set_param(p::kPace, 0.25f);
    Stereo out = run(device, sine(1000.0f, 60.0f, kRate, 0.5f));
    const std::vector<double> level = envelope_db(out.left, 240, 0.5 / std::sqrt(2.0));  // 5 ms
    const int ducks = dips(level, -2.0, -0.7);
    const double drops = device.meter(kDropCount);
    std::snprintf(label, sizeof label, "Rain: a duck for each drop (%d ducks, %.0f drops)", ducks, drops);
    MEASURED(drops > 100.0 && ducks > 0.6 * drops && ducks <= drops, label);
    size_t down = 0;
    for (double value : level) down += value < -2.0 ? 1 : 0;
    const double each = 0.005 * static_cast<double>(down) / std::max(1, ducks);
    std::snprintf(label, sizeof label, "Rain: a duck is short (%.0f ms under 2 dB each)", 1000.0 * each);
    MEASURED(each > 0.01 && each < 0.1, label);
    const double deepest = *std::min_element(level.begin(), level.end());
    MEASURED(deepest > -Weather::kDipDb[Weather::kDrops] - 4.5 && deepest < -4.0,
           "Rain: a duck is no deeper than the layer allows");
  }

  // Surf: one wave after another, and the period follows Pace. Under a tone
  // every break is a dip of at least kHeightMin of the layer's depth.
  {
    double period[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      bare(Weather::kSurf);
      const float pace = which == 0 ? 1.0f : 2.0f;
      device.set_param(p::kPace, pace);
      const float seconds = 280.0f;
      Stereo out = run(device, sine(440.0f, seconds, kRate, 0.5f));
      const std::vector<double> level = envelope_db(out.left, 2400, 0.5 / std::sqrt(2.0));
      const int waves = dips(level, -6.0, -3.0);
      period[which] = seconds / std::max(1, waves);
      std::snprintf(label, sizeof label, "Surf: at Pace %.0f a wave every %.2f s (the model says %.2f)", pace,
                    period[which], wm::Surf::kWave / pace);
      MEASURED(std::fabs(period[which] - wm::Surf::kWave / pace) < 0.08 * wm::Surf::kWave / pace, label);
    }
    // A wave gathers for a long time and then breaks: the first half of the
    // way down takes seconds, the second half is the break and is over in
    // kBreak of the wave. Each wave is as deep as its height says.
    bare(Weather::kSurf);
    Stereo out = run(device, sine(440.0f, 140.0f, kRate, 0.5f));
    const double step = 0.05;
    const std::vector<double> level = tone_db(out.left, 440.0, 2400, 0.5);
    double gathering = 0.0, breaking = 0.0, shallowest = -100.0, deepest = 0.0;
    int waves = 0;
    for (size_t i = 1; i + 1 < level.size(); ++i) {
      if (!(level[i] < -4.0 && level[i - 1] >= -4.0)) continue;
      // The bottom of this wave: the lowest point before the level is back up.
      size_t bottom = i;
      size_t end = i;
      while (end + 1 < level.size() && level[end] < -1.5) {
        if (level[end] < level[bottom]) bottom = end;
        ++end;
      }
      size_t half = bottom;
      while (half > 0 && level[half] < 0.5 * level[bottom]) --half;
      size_t open = half;
      while (open > 0 && level[open] < -1.0) --open;
      if (open == 0 || end + 1 >= level.size()) continue;
      gathering += step * static_cast<double>(half - open);
      breaking += step * static_cast<double>(bottom - half);
      shallowest = std::max(shallowest, level[bottom]);
      deepest = std::min(deepest, level[bottom]);
      ++waves;
      i = end;
    }
    gathering /= std::max(1, waves);
    breaking /= std::max(1, waves);
    std::snprintf(label, sizeof label,
                  "Surf: a wave gathers for %.2f s and breaks in %.2f s (the model's break is %.2f s), over %d waves",
                  gathering, breaking, wm::Surf::kBreak * wm::Surf::kWave, waves);
    MEASURED(waves >= 15 && gathering > 2.5 * breaking && breaking > 0.3 && breaking < 0.9, label);
    std::snprintf(label, sizeof label, "Surf: waves are between %.1f and %.1f dB deep (the model says %.1f to %.1f)",
                  -shallowest, -deepest, wm::Surf::kHeightMin * Weather::kDipDb[Weather::kWaves],
                  Weather::kDipDb[Weather::kWaves]);
    MEASURED(-shallowest > wm::Surf::kHeightMin * Weather::kDipDb[Weather::kWaves] - 1.0 &&
                 -deepest < Weather::kDipDb[Weather::kWaves] + 1.0 && deepest < shallowest - 2.0,
             label);
  }

  // Surf washes a noisy sheen through the sound: under a wave a tone grows
  // sidebands of noise, and in silence there is nothing to wash through.
  {
    bare(Weather::kSurf);
    Stereo out = run(device, sine(3000.0f, 60.0f, kRate, 0.5f));
    const double sheen = off_tone(out.left, 3000.0, kRate, 2400);
    bare(Weather::kClouds);
    Stereo plain = run(device, sine(3000.0f, 60.0f, kRate, 0.5f));
    const double none = off_tone(plain.left, 3000.0, kRate, 2400);
    std::snprintf(label, sizeof label,
                  "Surf: the sheen roughens a tone under a wave (%.3f of a window is not the tone; %.5f under Clouds)",
                  sheen, none);
    MEASURED(sheen > 0.05 && sheen < 0.5 && none < 0.005, label);
  }

  // Storm: the wind, with the rain coming in sheets on its gusts, and thunder underneath.
  {
    device.init(kRate);
    set({{p::kKind, static_cast<float>(Weather::kStorm)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kCalm, 0.5f}});
    const std::vector<float> input = sine(1000.0f, 180.0f, kRate, 0.001f);
    std::vector<double> drops, gust;
    Stereo out;
    out.left.resize(input.size());
    out.right.resize(input.size());
    double before = 0.0;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      device.process(128);
      for (int i = 0; i < 128; ++i) {
        out.left[done + i] = device.out_left()[i];
        out.right[done + i] = device.out_right()[i];
      }
      if ((done / 128) % 188 == 187) {  // half a second
        drops.push_back(device.meter(kDropCount) - before);
        before = device.meter(kDropCount);
        gust.push_back(device.meter(kLevel));
      }
    }
    double mean_d = 0.0, mean_g = 0.0, dd = 0.0, gg = 0.0, dg = 0.0;
    for (size_t i = 0; i < drops.size(); ++i) {
      mean_d += drops[i] / drops.size();
      mean_g += gust[i] / gust.size();
    }
    for (size_t i = 0; i < drops.size(); ++i) {
      dd += (drops[i] - mean_d) * (drops[i] - mean_d);
      gg += (gust[i] - mean_g) * (gust[i] - mean_g);
      dg += (drops[i] - mean_d) * (gust[i] - mean_g);
    }
    const double together = dg / std::sqrt(std::max(1.0e-12, dd * gg));
    std::snprintf(label, sizeof label, "Storm: the rain comes with the gusts (correlation %.2f)", together);
    MEASURED(together > 0.6, label);
    const double rolls = device.meter(kRollCount);
    std::snprintf(label, sizeof label, "Storm: thunder rolls now and then (%.0f in three minutes)", rolls);
    MEASURED(rolls >= 5.0 && rolls <= 30.0, label);
    // Thunder is low: far more of the storm is under 150 Hz than of wind and rain apart.
    const double low_storm = steep_share(out.left, 150.0, kRate, false);
    device.init(kRate);
    set({{p::kKind, static_cast<float>(Weather::kWind)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kCalm, 0.5f}});
    Stereo wind = run(device, input);
    const double low_wind = steep_share(wind.left, 150.0, kRate, false);
    std::snprintf(label, sizeof label, "Storm: thunder is its low end (%.3f of it under 150 Hz, %.4f of the wind)",
                  low_storm, low_wind);
    MEASURED(low_storm > 0.03 && low_storm > 8.0 * low_wind, label);
  }

  // Colour: dark weather to bright, in every weather's own sound.
  {
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      double bright[2] = {0.0, 0.0};
      for (int which = 0; which < 2; ++which) {
        device.init(kRate);
        set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kCalm, 0.0f},
             {p::kColour, which == 0 ? 0.0f : 1.0f}});
        Stereo out = run(device, sine(50.0f, 60.0f, kRate, 0.0005f));
        bright[which] = energy_above(out.left, 1500.0, kRate);
      }
      std::snprintf(label, sizeof label, "%s: Colour brightens the weather (%.3f of it above 1.5 kHz, then %.3f)",
                    kKindNames[kind], bright[0], bright[1]);
      MEASURED(bright[1] > 1.5 * bright[0], label);
    }
    // And what it takes from the sound: dark weather dulls from lower down.
    double mid[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      bare(Weather::kClouds);
      device.set_param(p::kColour, which == 0 ? 0.0f : 1.0f);
      Stereo out = run(device, sine(2000.0f, 60.0f, kRate, 0.25f));
      const std::vector<double> level = envelope_db(out.left, 4800, 0.25 / std::sqrt(2.0));
      mid[which] = *std::min_element(level.begin(), level.end());
    }
    std::snprintf(label, sizeof label, "Clouds: dark weather dulls 2 kHz more than bright (%.1f dB against %.1f)",
                  mid[0], mid[1]);
    MEASURED(mid[0] < mid[1] - 6.0, label);
  }

  // Sway: at 0 the two sides are the same; turned up, the weather leans and its own sound spreads.
  {
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f}, {p::kVoice, 1.0f},
           {p::kSway, 0.0f}, {p::kCalm, 0.0f}});
      Stereo same = run(device, sine(330.0f, 30.0f, kRate, 0.25f));
      std::snprintf(label, sizeof label, "%s: Sway 0 is the same on both sides", kKindNames[kind]);
      MEASURED(same.left == same.right, label);

      device.init(kRate);
      set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f}, {p::kVoice, 0.0f},
           {p::kSway, 1.0f}, {p::kCalm, 0.0f}});
      Stereo leaning = run(device, sine(330.0f, 60.0f, kRate, 0.25f));
      const std::vector<double> l = envelope_db(leaning.left, 2400, 0.25 / std::sqrt(2.0));
      const std::vector<double> r = envelope_db(leaning.right, 2400, 0.25 / std::sqrt(2.0));
      double apart = 0.0;
      for (size_t i = 0; i < l.size(); ++i) apart = std::max(apart, std::fabs(l[i] - r[i]));
      std::snprintf(label, sizeof label, "%s: Sway 1 leans the sound to a side (%.1f dB apart at the most)",
                    kKindNames[kind], apart);
      MEASURED(apart > 2.0, label);

      device.init(kRate);
      set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kSway, 1.0f},
           {p::kCalm, 0.0f}});
      Stereo wide = run(device, sine(50.0f, 30.0f, kRate, 0.0005f));
      const double alike = correlation(wide.left, wide.right);
      std::snprintf(label, sizeof label, "%s: Sway 1 spreads the weather's own sound (correlation %.2f)",
                    kKindNames[kind], alike);
      MEASURED(alike < 0.6, label);
    }
  }

  // Linger: the weather carries on for Linger after the sound stops, fades, and the device is silent.
  {
    device.init(kRate);
    set({{p::kKind, static_cast<float>(Weather::kRain)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kCalm, 0.0f},
         {p::kLinger, 2.0f}});
    run(device, sine(220.0f, 1.0f, kRate, 0.25f));
    Stereo after = render(device, 5.0f, kRate);
    const size_t s = static_cast<size_t>(kRate);
    const double during = rms(after.left, s / 2, 2 * s - s / 10);
    const double fading = rms(after.left, 2 * s + s / 2, 2 * s + (7 * s) / 10);
    std::snprintf(label, sizeof label, "Linger: the rain goes on for 2 s (rms %.4f), fades (%.4f) and stops", during,
                  fading);
    MEASURED(during > 0.01 && fading < 0.5 * during && fading > 0.0, label);
    MEASURED(peak(after.left, 3 * s, 5 * s) == 0.0 && peak(after.right, 3 * s, 5 * s) == 0.0,
           "Linger: exact silence once the fade is over");
    MEASURED(device.meter(kGate) == 0.0f && device.meter(kLevel) == 0.0f && device.meter(kGain) == 1.0f,
           "asleep, the readings are at rest");
  }

  // A change of Kind crosses over without a click, from every weather to every other.
  {
    rng_state() = 0x5EEDu;
    const std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.25f);
    for (int from = 0; from < Weather::kKinds; ++from) {
      for (int to = 0; to < Weather::kKinds; ++to) {
        if (from == to) continue;
        std::snprintf(label, sizeof label, "Kind from %s to %s", kKindNames[from], kKindNames[to]);
        click_check(
            label,
            [&] {
              device.init(kRate);
              set({{p::kKind, static_cast<float>(from)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f},
                   {p::kVoice, 0.0f}, {p::kCalm, 0.0f}});
            },
            [&] { device.set_param(p::kKind, static_cast<float>(to)); }, tone,
            from < to ? 96000 : 61000);
      }
    }
  }

  // And it crosses over in kKindFadeSeconds, not at once. Surf at Calm 0 is
  // one wave after another; at a slow Pace a wave stands for seconds, and
  // Clouds at that Pace has nothing to show for over half a second. So a
  // change from one to the other at the top of a wave is the wave letting go.
  {
    const auto prepare = [&] {
      bare(Weather::kSurf);
      device.set_param(p::kPace, 0.25f);
    };
    const std::vector<float> tone = sine(1000.0f, 20.0f, kRate, 0.5f);
    prepare();
    Stereo whole = run(device, tone);
    const std::vector<double> before = tone_db(whole.left, 1000.0, 960, 0.5);  // 20 ms
    size_t top = 0;
    for (size_t i = 0; i < before.size(); ++i) {
      if (before[i] < before[top]) top = i;
    }
    const size_t at = top * 960;
    prepare();
    run(device, std::vector<float>(tone.begin(), tone.begin() + at));
    device.set_param(p::kKind, static_cast<float>(Weather::kClouds));
    Stereo after = run(device, std::vector<float>(tone.begin() + at, tone.begin() + at + 48000));
    const std::vector<double> level = tone_db(after.left, 1000.0, 960, 0.5);
    size_t back = 0;
    while (back < level.size() && level[back] < -1.0) ++back;
    std::snprintf(label, sizeof label,
                  "Kind crosses over in %.1f s: a wave %.1f dB deep is %.1f dB deep 50 ms on and gone in %.2f s",
                  Weather::kKindFadeSeconds, -before[top], -level[2], 0.02 * static_cast<double>(back));
    MEASURED(before[top] < -8.0 && level[2] < 0.6 * before[top] && back >= 10 && back <= 17, label);
  }

  // Force, Exposure, Voice and Mix moved while sounding do not click.
  {
    const std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.25f);
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      const std::pair<int, const char*> moved[4] = {
          {p::kForce, "Force"}, {p::kExposure, "Exposure"}, {p::kMix, "Mix"}, {p::kVoice, "Voice"}};
      for (const auto& control : moved) {
        std::snprintf(label, sizeof label, "%s: %s from 1 to 0.1", kKindNames[kind], control.second);
        click_check(
            label,
            [&] {
              device.init(kRate);
              set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f},
                   {p::kVoice, control.first == p::kVoice ? 1.0f : 0.0f}, {p::kCalm, 0.0f}});
            },
            [&] { device.set_param(control.first, 0.1f); }, tone, 96000);
      }
    }
  }

  // Bad input: a sample that is not a number, an infinite one and an absurd
  // one are survived, and the weather is where it would have been without them.
  {
    const auto prepare = [&] {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(Weather::kStorm)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f},
           {p::kVoice, 0.5f}});
    };
    std::vector<float> clean = sine(330.0f, 2.0f, kRate, 0.25f);
    std::vector<float> bad = clean;
    for (size_t i = 24000; i < 24100; ++i) {
      clean[i] = 0.0f;
      bad[i] = i % 3 == 0 ? std::nanf("") : (i % 3 == 1 ? INFINITY : -1.0e30f);
    }
    prepare();
    Stereo reference = run(device, clean);
    prepare();
    Stereo out = run(device, bad);
    MEASURED(finite(out.left) && finite(out.right), "bad input: the output stays finite");
    MEASURED(peak(out.left) <= Weather::kInputLimit + 1.0, "bad input: an absurd sample is held to +18 dBFS");
    double worst = 0.0;
    for (size_t i = 26400; i < out.left.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
    }
    std::snprintf(label, sizeof label,
                  "bad input: 50 ms after it the output is what it would have been (off by %g)", worst);
    MEASURED(worst < 1.0e-3, label);
  }

  // Block size, across a sleep: a note, a silence long enough to sleep in
  // with knobs moved in it, a note again. One, 128 and 2048 frames at a time
  // give the same samples, and what was moved in the sleep is there on the
  // first sample after it.
  {
    const size_t s = static_cast<size_t>(kRate);
    std::vector<float> input(8 * s, 0.0f);
    const std::vector<float> note = sine(330.0f, 1.0f, kRate, 0.25f);
    std::copy(note.begin(), note.end(), input.begin());
    std::copy(note.begin(), note.end(), input.begin() + 6 * s);
    // The moves land on a boundary of every block size.
    const size_t move_at = (4 * s / 2048) * 2048;
    Stereo first;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(Weather::kStorm)}, {p::kVoice, 0.6f}, {p::kLinger, 1.0f}});
      const std::vector<float> head(input.begin(), input.begin() + move_at);
      const std::vector<float> rest(input.begin() + move_at, input.end());
      Stereo out = run(device, head, block);
      MEASURED(peak(out.left, 3 * s, move_at) == 0.0, "asleep after the note, its Linger and the fade");
      set({{p::kKind, static_cast<float>(Weather::kSurf)}, {p::kForce, 0.9f}, {p::kExposure, 0.2f}});
      out = concat(out, run(device, rest, block));
      if (block == 128) {
        first = out;
        continue;
      }
      double worst = 0.0;
      for (size_t i = 0; i < out.left.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - first.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - first.right[i]));
      }
      std::snprintf(label, sizeof label, "%d frames at a time is the same sound as 128, across a sleep (off by %g)",
                    block, worst);
      MEASURED(worst < 1.0e-6, label);
    }
    // A knob moved in the sleep snaps: Mix to 0 there, and the first sample after is the input.
    device.init(kRate);
    set({{p::kKind, static_cast<float>(Weather::kWind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f},
         {p::kLinger, 1.0f}});
    run(device, std::vector<float>(input.begin(), input.begin() + move_at));
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> rest(input.begin() + move_at, input.end());
    Stereo woken = run(device, rest);
    MEASURED(woken.left == rest && woken.right == rest, "a knob moved while asleep is there on the first sample");
  }

  // The weather's own sound is as loud at 96 kHz as at 48 kHz.
  {
    for (int kind : {Weather::kClouds, Weather::kRain, Weather::kSurf}) {
      double loud[2] = {0.0, 0.0};
      for (int which = 0; which < 2; ++which) {
        const float rate = which == 0 ? 48000.0f : 96000.0f;
        device.init(rate);
        set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kVoice, 1.0f}, {p::kCalm, 0.0f},
             {p::kSway, 0.0f}});
        Stereo out = run(device, sine(50.0f, 120.0f, rate, 0.0005f));
        loud[which] = db(rms(out.left));
      }
      std::snprintf(label, sizeof label, "%s: as loud at 96 kHz as at 48 kHz (%.1f dB against %.1f)",
                    kKindNames[kind], loud[1], loud[0]);
      MEASURED(std::fabs(loud[1] - loud[0]) < 1.5, label);
    }
  }

  // Level: with everything up the weather never makes the sound louder than
  // it came in by more than the weather's own sound adds, and never clips a
  // full-scale input by itself.
  {
    rng_state() = 0xF00Du;
    const std::vector<float> loud = noise(20.0f, kRate, 0.25f);
    for (int kind = 0; kind < Weather::kKinds; ++kind) {
      device.init(kRate);
      set({{p::kKind, static_cast<float>(kind)}, {p::kForce, 1.0f}, {p::kExposure, 1.0f}, {p::kVoice, 1.0f},
           {p::kCalm, 0.0f}});
      Stereo out = run(device, loud);
      const double gain = db(rms(out.left) / rms(loud));
      std::snprintf(label, sizeof label, "%s: with everything up the sound comes out %.1f dB from how it came in",
                    kKindNames[kind], gain);
      MEASURED(gain < 3.0 && gain > -14.0, label);
    }
    device.init(kRate);
    Stereo out = run(device, loud);
    const double gain = db(rms(out.left) / rms(loud));
    std::snprintf(label, sizeof label, "at its defaults the sound comes out %.1f dB from how it came in", gain);
    MEASURED(gain < 0.5 && gain > -4.0, label);
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("weather", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  set({{p::kKind, static_cast<float>(Weather::kStorm)}, {p::kForce, 1.0f}, {p::kPace, 4.0f}, {p::kExposure, 1.0f},
       {p::kVoice, 1.0f}, {p::kSway, 1.0f}, {p::kCalm, 0.0f}});
  report_cost("weather at its heaviest (Storm, everything up)", 10.0f, kRate, [&] { run(device, input); });

  return finish("weather");
}
