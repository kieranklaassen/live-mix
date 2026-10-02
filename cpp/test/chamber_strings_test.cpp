// Native harness for Chamber Strings (cpp/devices/chamber-strings). It starts
// with the body bank on its own, then the conformance pass (silence before
// and after notes, a pile of keys, parameter abuse, other sample rates), then
// what makes the device a bowed section and not a string machine: players
// that disagree, modulation that never repeats and is never shared between
// notes, resonances that stay put, a bow, a mute and hiss.
//
// Two of the checks are the ones a string machine fails. They are run on a
// string machine too (reference_ensemble below) and must fail there: a check
// that passes on both is not measuring the difference.

#include "../devices/chamber-strings/chamber_strings.h"

#include <cstdlib>
#include <string>
#include <utility>

#include "support/test_kit.h"

using namespace testkit;
using livemix::ChamberStrings;
namespace body = livemix::chamber_strings_dsp;
namespace p = livemix::chamber_strings;

static ChamberStrings device;

static const float kRate = 48000.0f;
static const size_t kSecond = 48000;

// --- driving the device ---------------------------------------------------------------------

// One steady player: no section, vibrato, hiss or mute in the way, and an
// envelope that is out of the way at once.
static void solo(ChamberStrings& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kPlayers, 1.0f);
  d.set_param(p::kScatter, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kMute, 0.0f);
  d.set_param(p::kAttack, 0.05f);
  d.set_param(p::kRelease, 0.1f);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

// The larger peak of the two channels, and the mean of their levels.
static double peak_of(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static double level_of(const Stereo& s, size_t from) { return 0.5 * (rms(s.left, from) + rms(s.right, from)); }

static double worst_step(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(max_step(s.left, from, to), max_step(s.right, from, to));
}

// The peak of what a render holds above 8 kHz. The body's low-pass rounds a
// jump in a voice's output until the step from one sample to the next shows
// nothing; up here, where a held chord has next to nothing, it still does.
static double sharpest(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  double worst = 0.0;
  for (const std::vector<float>* side : {&s.left, &s.right}) {
    livemix::kit::Biquad high_pass[2];
    for (auto& stage : high_pass) stage.set_highpass(8000.0f, 0.7071f, kRate);
    for (size_t i = 0; i < side->size(); ++i) {
      const double v = std::fabs(high_pass[1].process(high_pass[0].process((*side)[i])));
      if (i >= from && i < to) worst = std::max(worst, v);
    }
  }
  return worst;
}

// --- measuring ------------------------------------------------------------------------------

// One component of a signal followed over time: the signal shifted down by
// `hz` and averaged twice over one period of `null_hz`, which nulls
// everything at a multiple of null_hz from it (the note's other harmonics).
// One complex value per millisecond; entry m is the component at m ms. Its
// length is the component's amplitude, how fast it turns is how far the
// component is from `hz`.
static const double kTrackRate = 1000.0;

struct Track {
  std::vector<double> re, im;
  size_t size() const { return re.size(); }
  double amplitude(size_t m) const { return 2.0 * std::hypot(re[m], im[m]); }
};

static Track follow(const std::vector<float>& x, double hz, double null_hz, double rate = kRate) {
  const size_t n = x.size();
  const size_t box = static_cast<size_t>(std::lround(rate / null_hz));
  std::vector<double> part[2] = {std::vector<double>(n), std::vector<double>(n)};
  for (size_t i = 0; i < n; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    part[0][i] = x[i] * std::cos(phase);
    part[1][i] = -x[i] * std::sin(phase);
  }
  std::vector<double> sum(n + 1);
  for (int pass = 0; pass < 2; ++pass) {
    for (std::vector<double>& v : part) {
      sum[0] = 0.0;
      for (size_t i = 0; i < n; ++i) sum[i + 1] = sum[i] + v[i];
      for (size_t i = 0; i < n; ++i) {
        v[i] = i + 1 >= box ? (sum[i + 1] - sum[i + 1 - box]) / static_cast<double>(box) : 0.0;
      }
    }
  }
  // Both averages together lag by box - 1 samples.
  Track track;
  for (size_t m = 0;; ++m) {
    const size_t i = static_cast<size_t>(static_cast<double>(m) * rate / kTrackRate) + box - 1;
    if (i >= n) break;
    track.re.push_back(part[0][i]);
    track.im.push_back(part[1][i]);
  }
  return track;
}

static std::vector<float> amplitude_of(const Track& track) {
  std::vector<float> out(track.size());
  for (size_t m = 0; m < out.size(); ++m) out[m] = static_cast<float>(track.amplitude(m));
  return out;
}

// The component's pitch in cents from `hz`, per millisecond.
static std::vector<float> cents_of(const Track& track, double hz) {
  std::vector<float> out(track.size(), 0.0f);
  for (size_t m = 0; m + 1 < track.size(); ++m) {
    const double turn = std::atan2(track.im[m + 1] * track.re[m] - track.re[m + 1] * track.im[m],
                                   track.re[m + 1] * track.re[m] + track.im[m + 1] * track.im[m]);
    const double at = hz + turn * kTrackRate / (2.0 * kPi);
    out[m] = static_cast<float>(1200.0 * std::log2(std::max(at, 1.0) / hz));
  }
  return out;
}

// The pitch a listener would name, in cents from `hz`: the track averaged by
// power, which is the centre of gravity of the component's spectrum (so
// players a few cents apart count equally).
static double mean_cents(const std::vector<float>& x, double hz, double rate, size_t from_ms) {
  const Track track = follow(x, hz, 0.5 * hz, rate);
  const std::vector<float> cents = cents_of(track, hz);
  double sum = 0.0, weight = 0.0;
  for (size_t m = from_ms; m + 1 < track.size(); ++m) {
    const double power = track.amplitude(m) * track.amplitude(m);
    sum += power * cents[m];
    weight += power;
  }
  return weight > 0.0 ? sum / weight : 0.0;
}

// The power spectrum around a followed component: offsets from -span to
// +span Hz in `count` steps, Hann window over [from, to) ms.
static std::vector<double> spectrum_around(const Track& track, size_t from, size_t to, double span, int count) {
  to = std::min(to, track.size());
  std::vector<double> power(static_cast<size_t>(count));
  for (int k = 0; k < count; ++k) {
    const double hz = -span + 2.0 * span * k / (count - 1);
    double re = 0.0, im = 0.0, window_sum = 0.0;
    for (size_t m = from; m < to; ++m) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(m - from) / static_cast<double>(to - from));
      const double phase = 2.0 * kPi * hz * static_cast<double>(m) / kTrackRate;
      const double c = std::cos(phase), s = std::sin(phase);
      re += w * (track.re[m] * c + track.im[m] * s);
      im += w * (track.im[m] * c - track.re[m] * s);
      window_sum += w;
    }
    power[static_cast<size_t>(k)] = (re * re + im * im) / (window_sum * window_sum);
  }
  return power;
}

// How wide that spectrum is: its standard deviation in Hz about its own centre.
static double width_hz(const std::vector<double>& power, double span) {
  const int count = static_cast<int>(power.size());
  double total = 0.0, first = 0.0, second = 0.0;
  for (int k = 0; k < count; ++k) {
    const double hz = -span + 2.0 * span * k / (count - 1);
    total += power[static_cast<size_t>(k)];
    first += power[static_cast<size_t>(k)] * hz;
    second += power[static_cast<size_t>(k)] * hz * hz;
  }
  const double centre = first / total;
  return std::sqrt(std::max(second / total - centre * centre, 0.0));
}

// Separate lines in that spectrum: peaks within 12 dB of the strongest.
static int lines_in(const std::vector<double>& power) {
  double top = 0.0;
  for (double value : power) top = std::max(top, value);
  int lines = 0;
  for (size_t k = 1; k + 1 < power.size(); ++k) {
    if (power[k] > top / 16.0 && power[k] > power[k - 1] && power[k] >= power[k + 1]) ++lines;
  }
  return lines;
}

// The spectrum of a slow track (one value per millisecond) from `lo` to `hi`
// Hz in `step`s: the power at each, averaged over half-overlapping Hann
// segments with their means removed.
static std::vector<double> modulation_spectrum(const std::vector<float>& track, size_t from, size_t segment,
                                               double lo, double hi, double step) {
  const int count = static_cast<int>(std::lround((hi - lo) / step)) + 1;
  std::vector<double> power(static_cast<size_t>(count), 0.0);
  int segments = 0;
  std::vector<float> piece(segment);
  for (size_t start = from; start + segment <= track.size(); start += segment / 2) {
    const double average = mean(track, start, start + segment);
    for (size_t m = 0; m < segment; ++m) piece[m] = track[start + m] - static_cast<float>(average);
    for (int k = 0; k < count; ++k) {
      const double level = tone_level(piece, lo + step * k, kTrackRate);
      power[static_cast<size_t>(k)] += level * level;
    }
    ++segments;
  }
  for (double& value : power) value /= std::max(segments, 1);
  return power;
}

// How far the tallest line of a spectrum stands above what surrounds it, in
// dB: each bin against the median of the bins within `reach` of it. The
// median is local because players beating against each other give a broad
// hump, whose top is far above the median of the whole band without holding
// a line; a chorus gives lines, which stand above their own neighbourhood.
static double tallest_line_db(const std::vector<double>& power, int reach) {
  const int count = static_cast<int>(power.size());
  double tallest = 0.0;
  std::vector<double> near;
  for (int k = 0; k < count; ++k) {
    near.clear();
    for (int j = std::max(0, k - reach); j <= std::min(count - 1, k + reach); ++j) {
      near.push_back(power[static_cast<size_t>(j)]);
    }
    std::nth_element(near.begin(), near.begin() + static_cast<long>(near.size() / 2), near.end());
    const double median = std::max(near[near.size() / 2], 1.0e-30);
    tallest = std::max(tallest, 10.0 * std::log10(power[static_cast<size_t>(k)] / median));
  }
  return tallest;
}

// Level of the harmonics of `f0` that fall in [lo, hi) Hz, over the window.
static double harmonic_band(const std::vector<float>& x, double f0, double lo, double hi, size_t from, size_t to) {
  double sum = 0.0;
  for (int h = 1; h * f0 < hi; ++h) {
    if (h * f0 < lo) continue;
    const double level = tone_level(x, h * f0, kRate, from, to);
    sum += level * level;
  }
  return std::sqrt(sum);
}

// Level of one component that drifts by a cycle or two a second: the root
// of its mean power over eight quarter-second windows from `from`.
static double steady_level(const std::vector<float>& x, double hz, size_t from, double rate = kRate) {
  const size_t window = static_cast<size_t>(rate / 4.0);
  double power = 0.0;
  for (int w = 0; w < 8; ++w) {
    const double level = tone_level(x, hz, rate, from + w * window, from + (w + 1) * window);
    power += level * level / 8.0;
  }
  return std::sqrt(power);
}

// What lies between the harmonics of `f0` in [lo, hi): a component every
// `step` Hz that keeps `guard` Hz clear of every harmonic, each measured as
// steady_level does. Returns their mean power, and where the strongest one
// and their centre of gravity are.
struct Floor {
  double power = 0.0;
  double strongest = 0.0;
  double peak_hz = 0.0;
  double centre_hz = 0.0;
};

static Floor floor_between(const std::vector<float>& x, double f0, double lo, double hi, size_t from, double step,
                           double guard, double rate = kRate) {
  Floor result;
  double total = 0.0, moment = 0.0;
  int counted = 0;
  for (double hz = lo; hz < hi; hz += step) {
    if (std::fabs(hz - f0 * std::round(hz / f0)) < guard) continue;
    const double level = steady_level(x, hz, from, rate);
    const double power = level * level;
    total += power;
    moment += power * hz;
    ++counted;
    if (power > result.strongest) {
      result.strongest = power;
      result.peak_hz = hz;
    }
  }
  if (counted > 0) {
    result.power = total / counted;
    result.centre_hz = moment / total;
  }
  return result;
}

// How loud both channels are together over time: the root of their mean
// power over `window_ms` around each millisecond.
static std::vector<float> loudness_track(const Stereo& s, size_t window_ms) {
  const size_t n = s.size();
  std::vector<double> sum(n + 1, 0.0);
  for (size_t i = 0; i < n; ++i) {
    sum[i + 1] = sum[i] + 0.5 * (static_cast<double>(s.left[i]) * s.left[i] + static_cast<double>(s.right[i]) * s.right[i]);
  }
  const size_t per_ms = kSecond / 1000;
  const size_t half = window_ms * per_ms / 2;
  std::vector<float> out;
  for (size_t m = 0; m * per_ms + half < n; ++m) {
    const size_t centre = m * per_ms;
    const size_t from = centre > half ? centre - half : 0;
    out.push_back(static_cast<float>(std::sqrt((sum[centre + half] - sum[from]) / static_cast<double>(centre + half - from))));
  }
  return out;
}

// The time a rising track takes from 10 % to 90 % of `full`, in seconds.
static double rise_time(const std::vector<float>& track, double full) {
  size_t low = 0, high = 0;
  for (size_t m = 0; m < track.size(); ++m) {
    if (low == 0 && track[m] >= 0.1 * full) low = m;
    if (track[m] >= 0.9 * full) {
      high = m;
      break;
    }
  }
  return static_cast<double>(high - low) / kTrackRate;
}

// --- a string machine, to fail the checks a section passes ---------------------------------
//
// One sawtooth per note into one chorus: three delay lines whose sweeps sit
// 120 degrees apart, each a slow (0.6 Hz) and a fast (6 Hz) sine, the left
// output taking mostly the first line. Every note goes through the same
// modulation and the modulation repeats, which is what the two checks below
// are written to catch.
static std::vector<float> reference_ensemble(const std::vector<double>& notes, float seconds) {
  livemix::kit::SineTable::init();
  static livemix::kit::DelayLine<2048> line[3];
  for (auto& l : line) l.clear();
  std::vector<livemix::kit::BlepOsc> osc(notes.size());
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  float slow = 0.0f, fast = 0.0f;
  for (size_t i = 0; i < out.size(); ++i) {
    float dry = 0.0f;
    for (size_t n = 0; n < notes.size(); ++n) dry += 0.2f * osc[n].saw(static_cast<float>(notes[n]) / kRate);
    slow += 0.6f / kRate;
    slow -= std::floor(slow);
    fast += 6.0f / kRate;
    fast -= std::floor(fast);
    float tap[3];
    for (int k = 0; k < 3; ++k) {
      const float offset = static_cast<float>(k) / 3.0f;
      const float sweep = 0.0012f * livemix::kit::SineTable::lookup(slow + offset) +
                          0.00018f * livemix::kit::SineTable::lookup(fast + offset);
      tap[k] = line[k].read_linear((0.006f + sweep) * kRate);
      line[k].write(dry);
    }
    out[i] = 0.62f * tap[0] + 0.38f * tap[1];
  }
  return out;
}

// How alike the pitch movements of two held notes are: the correlation of
// their fundamentals' pitch tracks over ten seconds, each instant weighted by
// the power of both. When the players of a note cancel for a moment its
// track swings by hundreds of cents; the weight keeps those moments from
// deciding the answer, as they do not decide what is heard.
static double shared_pitch_movement(const std::vector<float>& x, double first_hz, double second_hz, double null_hz) {
  const Track first = follow(x, first_hz, null_hz), second = follow(x, second_hz, null_hz);
  const std::vector<float> a = cents_of(first, first_hz), b = cents_of(second, second_hz);
  const size_t from = 2000, to = 12000;
  std::vector<double> weight(to);
  double total = 0.0, mean_a = 0.0, mean_b = 0.0;
  for (size_t m = from; m < to; ++m) {
    const double power_a = first.amplitude(m) * first.amplitude(m), power_b = second.amplitude(m) * second.amplitude(m);
    weight[m] = power_a * power_b;
    total += weight[m];
    mean_a += weight[m] * a[m];
    mean_b += weight[m] * b[m];
  }
  mean_a /= total;
  mean_b /= total;
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t m = from; m < to; ++m) {
    sab += weight[m] * (a[m] - mean_a) * (b[m] - mean_b);
    saa += weight[m] * (a[m] - mean_a) * (a[m] - mean_a);
    sbb += weight[m] * (b[m] - mean_b) * (b[m] - mean_b);
  }
  return sab / std::sqrt(saa * sbb);
}

// The tallest line in how a harmonic's amplitude moves between 0.2 and 10 Hz
// over a minute: twenty-second segments, 0.05 Hz apart, each bin against the
// 1.5 Hz either side of it.
static double periodic_movement_db(const std::vector<float>& x, double harmonic_hz, double f0) {
  const std::vector<float> amplitude = amplitude_of(follow(x, harmonic_hz, 0.5 * f0));
  return tallest_line_db(modulation_spectrum(amplitude, 2000, 20000, 0.2, 10.0, 0.05), 30);
}

// --- the manifest's presets -----------------------------------------------------------------

struct Preset {
  std::string name;
  std::vector<std::pair<int, float>> values;
};

// A reader for exactly what device.json holds: the parameter keys in order,
// then "presets": { "Name": { "key": number, ... }, ... }.
static std::vector<Preset> load_presets() {
  std::vector<Preset> presets;
  std::vector<std::string> keys;
  std::string text;
  if (std::FILE* file = std::fopen("cpp/devices/chamber-strings/device.json", "rb")) {
    char buffer[4096];
    size_t got;
    while ((got = std::fread(buffer, 1, sizeof buffer, file)) > 0) text.append(buffer, got);
    std::fclose(file);
  }
  const size_t params_at = text.find("\"params\"");
  const size_t presets_at = text.find("\"presets\"");
  const size_t origin_at = text.find("\"origin\"");
  if (params_at == std::string::npos || presets_at == std::string::npos || origin_at == std::string::npos) {
    return presets;
  }
  const auto quoted = [&](size_t from, size_t* end) {
    const size_t open = text.find('"', from);
    const size_t close = text.find('"', open + 1);
    *end = close + 1;
    return text.substr(open + 1, close - open - 1);
  };
  for (size_t pos = text.find("\"key\"", params_at); pos != std::string::npos && pos < presets_at;
       pos = text.find("\"key\"", pos + 1)) {
    size_t end;
    keys.push_back(quoted(pos + 5, &end));
  }
  size_t pos = text.find('{', presets_at) + 1;
  while (true) {
    const size_t name_at = text.find('"', pos);
    const size_t close_at = text.find('}', pos);
    if (name_at == std::string::npos || name_at > origin_at || close_at < name_at) break;
    Preset preset;
    size_t end;
    preset.name = quoted(name_at, &end);
    const size_t open = text.find('{', end);
    const size_t close = text.find('}', open);
    pos = open + 1;
    while (true) {
      const size_t key_at = text.find('"', pos);
      if (key_at == std::string::npos || key_at > close) break;
      const std::string key = quoted(key_at, &end);
      const size_t colon = text.find(':', end);
      const float value = std::strtof(text.c_str() + colon + 1, nullptr);
      int id = -1;
      for (size_t k = 0; k < keys.size(); ++k) {
        if (keys[k] == key) id = static_cast<int>(k);
      }
      preset.values.push_back({id, value});
      pos = text.find_first_of(",}", colon);
    }
    presets.push_back(preset);
    pos = close + 1;
  }
  return presets;
}

// --- the body bank on its own ---------------------------------------------------------------

// A sine through a bank, flushed on the control clock as the device does.
static std::vector<float> through(body::BodyBank& bank, const std::vector<float>& x) {
  std::vector<float> y(x.size());
  for (size_t i = 0; i < x.size(); ++i) {
    if (i % 32 == 0) bank.flush();
    y[i] = bank.process(x[i]);
  }
  return y;
}

// Gain of a bank at `hz`, measured with a sine once the resonators have settled.
static double measured_gain(const body::BodyModes& modes, float tuning, double hz, float rate) {
  body::BodyBank bank;
  bank.set(modes, tuning, rate);
  const std::vector<float> y = through(bank, sine(static_cast<float>(hz), 1.0f, rate));
  return rms(y, y.size() / 2) * std::sqrt(2.0);
}

// The same from the closed form the device levels its notes with.
static double formula_gain(const body::BodyModes& modes, float tuning, double hz, float rate) {
  body::BodyBank bank;
  bank.set(modes, tuning, rate);
  float re = 0.0f, im = 0.0f;
  bank.response(static_cast<float>(std::tan(kPi * hz / rate)), &re, &im);
  return std::sqrt(static_cast<double>(re) * re + static_cast<double>(im) * im);
}

static void body_tests() {
  // Resonances where the table puts them, and dips between: the three
  // signature modes of the high body stand clear of what lies beside them.
  {
    const double beside[] = {222.0, 363.0, 508.0, 693.0};
    double lowest_peak = 1.0e9, highest_dip = 0.0;
    for (double hz : {280.0, 470.0, 550.0}) {
      lowest_peak = std::min(lowest_peak, measured_gain(body::kHighBody, 1.0f, hz, kRate));
    }
    for (double hz : beside) {
      highest_dip = std::max(highest_dip, measured_gain(body::kHighBody, 1.0f, hz, kRate));
    }
    std::printf("high body: weakest signature mode %.1f dB, strongest neighbour %.1f dB\n",
                db(lowest_peak), db(highest_dip));
    EXPECT(lowest_peak > 2.0 * highest_dip,
           "the 280, 470 and 550 Hz modes stand 6 dB clear of the frequencies beside them");
    // The bridge hill, and the fall above it.
    double hill = 0.0;
    for (double hz : {2300.0, 2700.0, 3200.0}) hill += measured_gain(body::kHighBody, 1.0f, hz, kRate) / 3.0;
    const double valley = measured_gain(body::kHighBody, 1.0f, 1450.0, kRate);
    const double above = measured_gain(body::kHighBody, 1.0f, 9000.0, kRate);
    std::printf("high body: bridge hill %.1f dB, 1450 Hz %.1f dB, 9 kHz %.1f dB\n", db(hill), db(valley),
                db(above));
    EXPECT(hill > 1.25 * valley, "the bridge hill at 2.3 to 3.2 kHz stands above the valley below it");
    EXPECT(above < 0.25 * hill, "the body falls away above its rolloff");
    // The low body's air and wolf resonances.
    const double air = measured_gain(body::kLowBody, 1.0f, 100.0, kRate);
    const double wolf = measured_gain(body::kLowBody, 1.0f, 180.0, kRate);
    const double between = measured_gain(body::kLowBody, 1.0f, 134.0, kRate);
    EXPECT(air > 2.0 * between && wolf > 2.0 * between,
           "the low body's 100 and 180 Hz modes stand 6 dB clear of the dip between them");
  }

  // The closed form is the response: the device levels notes with it.
  {
    double worst = 0.0;
    for (float rate : {48000.0f, 96000.0f}) {
      for (const body::BodyModes* modes : {&body::kLowBody, &body::kHighBody}) {
        for (double hz : {80.0, 100.0, 134.0, 180.0, 280.0, 363.0, 470.0, 508.0, 550.0, 1000.0, 2700.0, 4500.0, 6000.0}) {
          const double measured = measured_gain(*modes, 1.0f - body::kBodySkew, hz, rate);
          const double formula = formula_gain(*modes, 1.0f - body::kBodySkew, hz, rate);
          worst = std::max(worst, std::fabs(db(measured) - db(formula)));
        }
      }
    }
    std::printf("body: closed form against a measured sine, worst %.3f dB\n", worst);
    EXPECT(worst < 0.5, "the closed-form response matches a measured sine within 0.5 dB at 48 and 96 kHz");
  }

  // Left and right are the same body a little apart, and add without a hole.
  {
    const float left = 1.0f - body::kBodySkew, right = 1.0f + body::kBodySkew;
    double best_left = 0.0, best_right = 0.0, hz_left = 0.0, hz_right = 0.0;
    for (double hz = 260.0; hz <= 300.0; hz += 0.25) {
      const double l = formula_gain(body::kHighBody, left, hz, kRate);
      const double r = formula_gain(body::kHighBody, right, hz, kRate);
      if (l > best_left) best_left = l, hz_left = hz;
      if (r > best_right) best_right = r, hz_right = hz;
    }
    std::printf("body: air resonance at %.1f Hz left, %.1f Hz right\n", hz_left, hz_right);
    EXPECT_NEAR(hz_right / hz_left, 1.024, 0.006, "the two bodies are tuned 2.4 % apart");
    double worst = 0.0;
    for (const body::BodyModes* modes : {&body::kLowBody, &body::kHighBody}) {
      for (int k = 0; k < body::kBodyModes; ++k) {
        body::BodyBank a, b;
        a.set(*modes, left, kRate);
        b.set(*modes, right, kRate);
        const std::vector<float> x = sine(modes->hz[k], 1.0f, kRate);
        const std::vector<float> ya = through(a, x), yb = through(b, x);
        std::vector<float> mid(x.size());
        for (size_t i = 0; i < x.size(); ++i) mid[i] = 0.5f * (ya[i] + yb[i]);
        const size_t from = x.size() / 2;
        const double louder = std::max(rms(ya, from), rms(yb, from));
        worst = std::max(worst, db(louder) - db(rms(mid, from)));
      }
    }
    std::printf("body: left plus right at a mode, at worst %.2f dB under the louder side\n", worst);
    EXPECT(worst < 3.0, "summing the two bodies loses under 3 dB at every mode");
  }

  // The ring ends: under -140 dBFS in two seconds, exact zero in five.
  {
    for (const body::BodyModes* modes : {&body::kLowBody, &body::kHighBody}) {
      body::BodyBank bank;
      bank.set(*modes, 1.0f, kRate);
      const std::vector<float> y = through(bank, impulse(5.5f, kRate));
      EXPECT(peak(y, 0, 4800) > 1.0e-3, "the body rings when struck");
      EXPECT(peak(y, static_cast<size_t>(2.0f * kRate)) < 1.0e-7, "the ring is under -140 dBFS after two seconds");
      EXPECT(peak(y, static_cast<size_t>(5.0f * kRate)) == 0.0, "the ring reaches exact zero within five seconds");
    }
  }
}

static void check_playing();
static void check_section();
static void check_body_and_bow();
static void check_levels();

int main() {
  body_tests();

  Conformance spec;
  spec.name = "chamber-strings";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  check_playing();
  check_section();
  check_body_and_bow();
  check_levels();

  report_cost("chamber-strings (8 notes, 4 players each)", 10.0f, kRate, [&] {
    device.init(kRate);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    render(device, 10.0f, kRate);
  });
  report_cost("chamber-strings (12 notes, 6 players each)", 10.0f, kRate, [&] {
    device.init(kRate);
    device.set_param(p::kPlayers, 6.0f);
    for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.7f);
    render(device, 10.0f, kRate);
  });

  return finish("chamber-strings");
}

// It plays the note it is given, starts and stops as the knobs say, and
// does not click or fold back.
static void check_playing() {
  // In tune from C2 to C6 at every sample rate.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (float hz : {65.406f, 130.813f, 261.626f, 523.251f, 1046.502f}) {
        solo(device, rate);
        device.note_on(1, hz, 0.8f);
        const std::vector<float> out = mid(render(device, 2.5f, rate));
        worst = std::max(worst, std::fabs(mean_cents(out, hz, rate, 500)));
      }
    }
    std::printf("tuning: one player, C2 to C6 at 44.1, 48 and 96 kHz, worst %.2f cents\n", worst);
    EXPECT(worst < 3.0, "one player is within 3 cents from C2 to C6 at 44.1, 48 and 96 kHz");

    // The section disagrees, but about the note that was played.
    device.init(kRate);
    device.set_param(p::kAir, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    const double centre = mean_cents(mid(render(device, 4.5f, kRate)), 220.0, kRate, 500);
    std::printf("tuning: the default section's centre is %.2f cents from the note\n", centre);
    EXPECT(std::fabs(centre) < 3.0, "the default section is centred within 3 cents of the note");
  }

  // Attack is the time from 10 % to 90 %, and Release the time to -60 dB.
  {
    for (float attack : {0.3f, 2.0f}) {
      solo(device);
      device.set_param(p::kAttack, attack);
      device.note_on(1, 220.0f, 0.8f);
      const std::vector<float> track = amplitude_of(follow(mid(render(device, 2.5f * attack + 1.0f, kRate)), 220.0, 110.0));
      const size_t done = static_cast<size_t>(1000.0f * (2.0f * attack));
      const double rise = rise_time(track, mean(track, done, done + 400));
      std::printf("attack %.1f s: 10 to 90 %% in %.3f s\n", attack, rise);
      EXPECT_NEAR(rise, attack, 0.2 * attack, "one player rises from 10 % to 90 % in the Attack time");
    }

    solo(device);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.0f, kRate);
    device.note_off(1);
    const std::vector<float> fall = amplitude_of(follow(mid(render(device, 2.5f, kRate)), 220.0, 110.0));
    const double start = fall[30];
    size_t gone = 0;
    for (size_t m = 30; m < fall.size() && gone == 0; ++m) {
      if (fall[m] < start * 1.0e-3) gone = m;
    }
    std::printf("release 1.0 s: -60 dB after %.3f s\n", static_cast<double>(gone) / kTrackRate);
    EXPECT_NEAR(static_cast<double>(gone) / kTrackRate, 1.0, 0.25, "a note is 60 dB down after the Release time");
  }

  // A section's bows start raggedly: the players come in one after another,
  // so the section is at half level 15 ms or more after a soloist would be.
  // The tone cannot show it, since players a few cents apart beat and how
  // loud they are together half a second in is a matter of phase. The hiss
  // can: its power is the mean of the players' envelopes, with nothing to
  // interfere. Notes at 12 kHz leave everything below to the hiss, and
  // eight strikes of four notes average its grain.
  {
    double half[2] = {0.0, 0.0}, rise[2] = {0.0, 0.0};
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kPlayers, pass == 0 ? 1.0f : 6.0f);
      device.set_param(p::kScatter, 1.0f);
      device.set_param(p::kAir, 1.0f);
      device.set_param(p::kAttack, 0.3f);
      device.set_param(p::kRelease, 0.1f);
      std::vector<float> power(1400, 0.0f);
      for (int strike = 0; strike < 8; ++strike) {
        for (int n = 0; n < 4; ++n) device.note_on(n, 12000.0f, 0.8f);
        Stereo hiss = render(device, 1.5f, kRate);
        for (int n = 0; n < 4; ++n) device.note_off(n);
        render(device, 0.5f, kRate);
        for (std::vector<float>* side : {&hiss.left, &hiss.right}) {
          livemix::kit::Biquad low_pass[4];
          for (auto& stage : low_pass) stage.set_lowpass(5000.0f, 0.7071f, kRate);
          for (float& v : *side) {
            for (auto& stage : low_pass) v = stage.process(v);
          }
        }
        const std::vector<float> loud = loudness_track(hiss, 40);
        for (size_t m = 0; m < power.size(); ++m) power[m] += loud[m] * loud[m] / 8.0f;
      }
      const double full = mean(power, 900, 1400);
      for (size_t m = 0; m < power.size() && half[pass] == 0.0; ++m) {
        if (power[m] >= 0.5 * full) half[pass] = static_cast<double>(m) / kTrackRate;
      }
      rise[pass] = rise_time(power, full);
    }
    std::printf("attack 0.3 s, by the hiss: one player is at half level after %.3f s (10 to 90 %% in %.3f s), six players after %.3f s (%.3f s)\n",
                half[0], rise[0], half[1], rise[1]);
    EXPECT_NEAR(rise[0], 0.3, 0.06, "the hiss follows one player's bow in");
    EXPECT(half[1] > half[0] + 0.015, "six players are at half level 15 ms or more after one would be");
  }

  // The same notes whatever the host's block size: the control clock, not
  // the block, paces every player.
  {
    auto sequence = [&](int block) {
      device.init(kRate);
      device.set_param(p::kAir, 0.5f);
      device.set_param(p::kVibrato, 20.0f);
      device.note_on(1, 146.83f, 0.7f);
      device.note_on(2, 220.0f, 0.8f);
      device.note_on(3, 277.18f, 0.6f);
      Stereo out = render(device, 0.4f, kRate, block);
      device.set_param(p::kBow, 0.9f);
      device.set_param(p::kPlayers, 6.0f);
      device.note_on(2, 220.0f, 0.9f);
      out = concat(out, render(device, 0.4f, kRate, block));
      device.note_off(1);
      for (int n = 0; n < 12; ++n) device.note_on(10 + n, 98.0f * std::pow(2.0f, n * 5 / 12.0f), 0.7f);
      out = concat(out, render(device, 0.3f, kRate, block));
      for (int n = 0; n < 24; ++n) device.note_off(n);
      return concat(out, render(device, 0.3f, kRate, block));
    };
    const Stereo usual = sequence(128);
    double worst = 0.0;
    for (int block : {1, 2048}) {
      const Stereo other = sequence(block);
      for (size_t i = 0; i < usual.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(usual.left[i]) - other.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(usual.right[i]) - other.right[i]));
      }
    }
    EXPECT(worst < 1.0e-4, "blocks of 1, 128 and 2048 frames give the same audio");
  }

  // Nothing that happens to a note clicks: the largest step from one sample
  // to the next stays what it is in the held chord.
  {
    auto chord = [&](int notes) {
      device.init(kRate);
      device.set_param(p::kAttack, 0.05f);
      for (int n = 0; n < notes; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
      return worst_step(render(device, 1.5f, kRate), kSecond / 2);
    };
    // A thirteenth note takes a voice that is sounding: the oldest, which
    // here is a high note over eleven low ones, the only one with anything
    // above 8 kHz. That is where its going can be followed: still there a
    // millisecond after the steal, gone after five. Cut off at once it would
    // be gone in the first; the step from sample to sample cannot tell the
    // two apart, because the body's low-pass rounds the cut.
    device.init(kRate);
    device.set_param(p::kAttack, 0.05f);
    device.note_on(0, 880.0f, 0.8f);
    for (int n = 1; n < 12; ++n) device.note_on(n, 55.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    render(device, 1.0f, kRate);
    const Stereo before = render(device, 0.5f, kRate);
    device.note_on(12, 82.41f, 0.8f);
    // One render, so that the filter in sharpest() is settled at the steal.
    const Stereo both = concat(before, render(device, 0.3f, kRate));
    const size_t steal = before.size();
    double held = worst_step(before);
    double moved = worst_step(both, steal);
    const double usual = sharpest(both, kSecond / 10, steal);
    const double fading = sharpest(both, steal + 24, steal + 72);
    const double gone = sharpest(both, steal + 240, steal + 2400);
    std::printf("clicks: stolen voice, step %.4f against %.4f held; above 8 kHz %.5f held, %.5f a millisecond into the fade, %.5f after it\n",
                moved, held, usual, fading, gone);
    EXPECT(moved < 1.5 * held, "a stolen voice does not click");
    EXPECT(gone < 0.5 * usual, "the thirteenth note takes the oldest voice");
    EXPECT(fading > 1.5 * gone && fading < usual, "the stolen voice fades over a couple of milliseconds");

    // A key struck again, and a key let go.
    held = chord(4);
    device.note_on(1, 110.0f * std::pow(2.0f, 2.0f / 12.0f), 0.8f);
    moved = worst_step(render(device, 0.3f, kRate));
    EXPECT(moved < 1.5 * held, "a key struck again does not click");
    device.note_off(2);
    device.note_off(3);
    moved = worst_step(render(device, 0.3f, kRate));
    EXPECT(moved < 1.5 * held, "a note off does not click");

    // The knobs most likely to be moved while a chord sounds, thrown from
    // one end to the other and back.
    struct Jump {
      int id;
      float to, back;
      const char* message;
    };
    const Jump jumps[] = {
        {p::kBow, 1.0f, 0.0f, "Bow thrown end to end does not click"},
        {p::kMute, 1.0f, 0.0f, "Mute thrown end to end does not click"},
        {p::kPlayers, 1.0f, 6.0f, "Players thrown end to end does not click"},
        {p::kWidth, 0.0f, 1.0f, "Width thrown end to end does not click"},
        {p::kAir, 1.0f, 0.0f, "Air thrown end to end does not click"},
    };
    for (const Jump& jump : jumps) {
      held = chord(4);
      device.set_param(jump.id, jump.to);
      const Stereo there = render(device, 0.5f, kRate);
      device.set_param(jump.id, jump.back);
      const Stereo back = render(device, 0.5f, kRate);
      // What the chord steps by once it has settled at either end.
      const double settled = std::max(held, std::max(worst_step(there, kSecond / 4), worst_step(back, kSecond / 4)));
      moved = std::max(worst_step(there, 0, kSecond / 4), worst_step(back, 0, kSecond / 4));
      std::printf("clicks: %s: %.4f against %.4f settled\n", jump.message, moved, settled);
      EXPECT(moved < 1.5 * settled, jump.message);
    }
    held = chord(4);
    device.set_param(p::kVolume, 3.0f);
    const Stereo louder = render(device, 0.5f, kRate);
    EXPECT(worst_step(louder, 0, kSecond / 4) < 1.5 * worst_step(louder, kSecond / 4),
           "Volume thrown up does not click");
  }

  // A note let go while its voice is still fading the stolen one out never
  // sounds and leaves nothing behind. 1021 Hz is 26 Hz or more from every
  // harmonic of the chord; what the chord itself has there is the floor.
  {
    auto full_pool = [&]() {
      device.init(kRate);
      for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
      render(device, 1.0f, kRate);
      device.note_on(12, 1021.0f, 0.8f);
    };
    full_pool();
    const double sounding = tone_level(render(device, 0.5f, kRate).left, 1021.0, kRate, kSecond / 4);
    for (float wait : {0.0f, 0.001f}) {
      full_pool();
      if (wait > 0.0f) render(device, wait, kRate);
      device.note_off(12);
      const double released = tone_level(render(device, 0.5f, kRate).left, 1021.0, kRate, kSecond / 4);
      std::printf("steal: a note released %.0f ms into the fade leaves %.1f dB of what it would have been\n",
                  1000.0f * wait, db(released / sounding));
      EXPECT(released < 0.1 * sounding, "a note released during a steal never sounds");
      for (int n = 0; n < 12; ++n) device.note_off(n);
      render(device, 6.0f, kRate);
      const Stereo rest = render(device, 0.5f, kRate);
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "a note released during a steal leaves no voice stuck");
    }
  }

  // A key struck twice before the stolen note has faded is still one note:
  // it takes one voice and one note off ends it. The chord is held until
  // every voice is equally loud, so the pool has no reason to pick the same
  // voice twice; the second voice in line is the chord's second note.
  {
    device.init(kRate);
    for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    render(device, 3.0f, kRate);
    const double second_hz = 110.0 * std::pow(2.0, 2.0 / 12.0);
    const double before = steady_level(render(device, 2.0f, kRate).left, second_hz, 0);
    device.note_on(12, 1021.0f, 0.8f);
    device.note_on(12, 1021.0f, 0.8f);
    const double after = steady_level(render(device, 2.5f, kRate).left, second_hz, kSecond / 2);
    std::printf("steal: a key struck twice leaves the chord's second note at %+.1f dB of what it was\n", db(after / before));
    EXPECT(after > 0.25 * before, "a key struck twice during a steal takes one voice, not two");
    for (int n = 0; n <= 12; ++n) device.note_off(n);
    render(device, 6.0f, kRate);
    const Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "a key struck twice during a steal is let go by one note off");
  }

  // High notes do not fold back: between the harmonics of C6 and C7 at
  // 44.1 kHz, with the bow at the bridge where the filter is open, nothing
  // comes within 50 dB of the note.
  {
    const float rate = 44100.0f;
    double worst = -200.0;
    for (float hz : {1046.502f, 2093.005f}) {
      for (float bow : {0.4f, 1.0f}) {
        solo(device, rate);
        device.set_param(p::kBow, bow);
        device.note_on(1, hz, 1.0f);
        const std::vector<float> out = mid(render(device, 1.0f, rate));
        const size_t from = 22050, to = from + 16384;
        double loudest = 0.0;
        for (int h = 1; h * hz < 20000.0f; ++h) loudest = std::max(loudest, tone_level(out, h * hz, rate, from, to));
        double folded = 0.0;
        for (double at = 100.0; at < 20000.0; at += 25.0) {
          if (std::fabs(at - hz * std::round(at / hz)) < 80.0) continue;
          folded = std::max(folded, tone_level(out, at, rate, from, to));
        }
        std::printf("fold-back: %.0f Hz at 44.1 kHz, Bow %.1f: %.1f dB under the note\n", hz, bow, db(loudest / folded));
        worst = std::max(worst, db(folded / loudest));
      }
    }
    EXPECT(worst < -50.0, "nothing between the harmonics of C6 and C7 comes within 50 dB of the note");
  }
}

// What makes it a section: players who disagree, each in their own way, and
// nothing that repeats or is shared.
static void check_section() {
  auto note = [&](float players, float scatter, float seconds) {
    device.init(kRate);
    device.set_param(p::kPlayers, players);
    device.set_param(p::kScatter, scatter);
    device.set_param(p::kVibrato, 0.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kAttack, 0.05f);
    device.note_on(1, 220.0f, 0.8f);
    return mid(render(device, seconds, kRate));
  };

  // Each player has a pitch of their own. Around the sixteenth harmonic of
  // A3, where a cent is two hertz, four players are separate lines and one
  // player is one; how far apart they are is what Scatter sets.
  {
    const double h16 = 16.0 * 220.0;
    const double cent = h16 * (std::pow(2.0, 1.0 / 1200.0) - 1.0);
    auto spread = [&](const std::vector<float>& x) {
      return width_hz(spectrum_around(follow(x, h16, 220.0), 1000, 9000, 70.0, 281), 70.0) / cent;
    };
    auto lines = [&](const std::vector<float>& x) {
      const Track track = follow(x, h16, 220.0);
      std::vector<int> counts;
      for (size_t w = 0; w < 8; ++w) {
        counts.push_back(lines_in(spectrum_around(track, 1000 + 1000 * w, 2000 + 1000 * w, 70.0, 281)));
      }
      std::sort(counts.begin(), counts.end());
      return counts[counts.size() / 2];
    };
    const std::vector<float> one = note(1.0f, 0.35f, 9.5f);
    const std::vector<float> tight = note(4.0f, 0.0f, 9.5f);
    const std::vector<float> usual = note(4.0f, 0.35f, 9.5f);
    const std::vector<float> loose = note(4.0f, 1.0f, 9.5f);
    std::printf("scatter: harmonic 16 is %.2f cents wide for one player; for four, %.2f, %.2f and %.2f cents at Scatter 0, 0.35 and 1\n",
                spread(one), spread(tight), spread(usual), spread(loose));
    std::printf("scatter: separate lines at harmonic 16: %d for one player, %d for four at Scatter 1\n", lines(one),
                lines(loose));
    EXPECT(spread(one) < 2.0, "one player is one line, under 2 cents wide");
    EXPECT(spread(usual) > 2.0 * spread(one) && spread(usual) > 3.0, "four players are spread over several cents");
    EXPECT(spread(tight) < spread(usual) && spread(usual) < spread(loose), "Scatter sets how far apart the players are");
    EXPECT(lines(one) == 1, "one player is a single line");
    EXPECT(lines(loose) >= 3 && lines(loose) <= 4, "four players stand apart as separate lines");
  }

  // The spread is in pitch, so it widens with harmonic number: the eighth
  // harmonic is about eight times as wide in hertz as the first.
  {
    const std::vector<float> x = note(4.0f, 0.35f, 18.5f);
    const double first = width_hz(spectrum_around(follow(x, 220.0, 110.0), 2000, 18000, 6.0, 241), 6.0);
    const double eighth = width_hz(spectrum_around(follow(x, 1760.0, 110.0), 2000, 18000, 48.0, 241), 48.0);
    std::printf("width: harmonic 1 is %.3f Hz wide, harmonic 8 is %.3f Hz (%.1f times)\n", first, eighth, eighth / first);
    EXPECT(eighth > 6.0 * first && eighth < 10.0 * first, "harmonic 8 is 6 to 10 times as wide as harmonic 1");
  }

  // No two notes move together. Through a string machine's chorus the pitch
  // of every held note moves as one; here they have nothing in common, with
  // vibrato or without.
  {
    const double reference = shared_pitch_movement(reference_ensemble({220.0, 329.63}, 13.0f), 220.0, 329.63, 55.0);
    std::printf("independent notes: a string machine's two notes move together, correlation %.2f\n", reference);
    EXPECT(reference > 0.6, "the check catches a string machine: its notes share their pitch movement");
    for (float vibrato : {20.0f, 0.0f}) {
      device.init(kRate);
      device.set_param(p::kVibrato, vibrato);
      device.set_param(p::kAir, 0.0f);
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 329.63f, 0.8f);
      const double shared = shared_pitch_movement(mid(render(device, 13.0f, kRate)), 220.0, 329.63, 55.0);
      std::printf("independent notes: Vibrato %.0f, correlation %.2f\n", vibrato, shared);
      EXPECT(std::fabs(shared) < 0.3, "two held notes do not share their pitch movement");
    }
  }

  // Nothing repeats. A chorus moves a harmonic's level at its own rates and
  // their multiples, which are lines in how that level moves; four players
  // beating against each other give no line.
  {
    const double reference = periodic_movement_db(reference_ensemble({220.0}, 64.0f), 1760.0, 220.0);
    const double section = periodic_movement_db(note(4.0f, 0.35f, 64.0f), 1760.0, 220.0);
    std::printf("no periodic chorus: tallest line %.1f dB above its surroundings; a string machine's is %.1f dB\n",
                section, reference);
    EXPECT(reference > 10.0, "the check catches a string machine: its chorus is a line");
    EXPECT(section < 10.0, "a harmonic's level moves without any line 10 dB above its surroundings");
  }

  // Vibrato belongs to a player: 5 to 6.5 Hz, late, and as wide as the knob.
  {
    solo(device);
    device.set_param(p::kVibrato, 20.0f);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> x = mid(render(device, 6.0f, kRate));
    const std::vector<float> cents = cents_of(follow(x, 220.0, 110.0), 220.0);
    const double rate = dominant_frequency(cents, kTrackRate, 3.0, 9.0, 1500, 5500);
    const double full = tone_level(cents, rate, kTrackRate, 1500, 5500);
    // The same note without vibrato is the same in every other respect, so
    // the difference between the two is the vibrato alone.
    solo(device);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> still = cents_of(follow(mid(render(device, 1.0f, kRate)), 220.0, 110.0), 220.0);
    double early = 0.0;
    for (size_t m = 40; m < 150; ++m) early = std::max(early, std::fabs(static_cast<double>(cents[m]) - still[m]));
    const double arrived = tone_level(cents, rate, kTrackRate, 1200, 2200);
    std::printf("vibrato: %.2f Hz, %.1f cents either way; %.2f cents in the first 150 ms, %.1f from 1.2 s\n", rate, full,
                early, arrived);
    EXPECT(rate > 5.0 && rate < 6.5, "one player's vibrato is between 5 and 6.5 Hz");
    EXPECT(full > 0.55 * 20.0 && full < 1.05 * 20.0, "its depth is 60 to 100 % of the knob");
    EXPECT(early < 0.2 * full, "vibrato has not started in the first 150 ms");
    EXPECT(arrived > 0.9 * full, "vibrato is at full depth after 1.2 s");

    // It becomes timbre: the pitch moves every harmonic along a different
    // slope of the body, so their levels shake by different amounts.
    double least = 1.0e9, most = -1.0e9;
    for (int h = 1; h <= 8; ++h) {
      const std::vector<float> level = amplitude_of(follow(x, h * 220.0, 110.0));
      const double depth = db(tone_level(level, rate, kTrackRate, 1500, 5500) / mean(level, 1500, 5500));
      std::printf("vibrato: harmonic %d shakes in level by %.1f dB of itself\n", h, depth);
      least = std::min(least, depth);
      most = std::max(most, depth);
    }
    EXPECT(most - least > 3.0, "vibrato shakes the harmonics' levels by amounts 3 dB or more apart");

    // In a section no vibrato leads: the fundamental's pitch movement, which
    // one player keeps inside a third of a hertz, is spread over six rates.
    double share[2] = {0.0, 0.0};
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kPlayers, pass == 0 ? 1.0f : 6.0f);
      device.set_param(p::kScatter, 0.0f);
      device.set_param(p::kVibrato, 20.0f);
      device.set_param(p::kAir, 0.0f);
      device.note_on(1, 220.0f, 0.8f);
      const Track track = follow(mid(render(device, 23.0f, kRate)), 220.0, 110.0);
      // Weighted by power, so the moments the players cancel count for little.
      std::vector<float> movement = cents_of(track, 220.0);
      double power = 0.0;
      for (size_t m = 2000; m < 22000; ++m) power += track.amplitude(m) * track.amplitude(m) / 20000.0;
      for (size_t m = 0; m < movement.size(); ++m) {
        movement[m] *= static_cast<float>(track.amplitude(m) * track.amplitude(m) / power);
      }
      const std::vector<double> spectrum = modulation_spectrum(movement, 2000, 20000, 4.5, 7.5, 0.05);
      double total = 0.0, best = 0.0;
      for (double value : spectrum) total += value;
      for (size_t k = 0; k + 7 <= spectrum.size(); ++k) {
        double window = 0.0;
        for (size_t j = 0; j < 7; ++j) window += spectrum[k + j];
        best = std::max(best, window);
      }
      share[pass] = best / total;
    }
    std::printf("vibrato: the strongest 0.3 Hz holds %.0f %% of the pitch movement for one player, %.0f %% for six\n",
                100.0 * share[0], 100.0 * share[1]);
    EXPECT(share[0] > 0.8, "one player's vibrato is one line");
    EXPECT(share[1] < 0.6, "with six players no vibrato holds more than 60 % of the pitch movement");
  }

  // One player is steady: no beating. What does happen is a change of bow
  // every few seconds, a short dip.
  {
    solo(device);
    device.set_param(p::kScatter, 0.35f);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> level = amplitude_of(follow(mid(render(device, 31.0f, kRate)), 220.0, 110.0));
    const double usual = mean(level, 300, 2900);
    double lowest = 1.0e9, highest = 0.0;
    for (size_t m = 300; m < 2900; ++m) {
      lowest = std::min(lowest, static_cast<double>(level[m]));
      highest = std::max(highest, static_cast<double>(level[m]));
    }
    std::printf("solo: before the first bow change the fundamental stays within %+.2f and %+.2f dB\n",
                db(highest / usual), db(lowest / usual));
    EXPECT(db(highest / usual) < 1.5 && db(lowest / usual) > -1.5, "one player holds a note within 1.5 dB");

    int dips = 0;
    double shallowest = 1.0e9, deepest = 0.0, longest = 0.0;
    std::vector<float> near;
    size_t m = 1000;
    while (m + 1000 < level.size()) {
      near.assign(level.begin() + static_cast<long>(m - 700), level.begin() + static_cast<long>(m + 700));
      std::nth_element(near.begin(), near.begin() + 700, near.end());
      const double around = near[700];
      if (level[m] > around * 0.7071) {
        ++m;
        continue;
      }
      double bottom = level[m];
      const size_t began = m;
      while (m + 1000 < level.size() && level[m] < around * 0.7071) bottom = std::min(bottom, static_cast<double>(level[m++]));
      ++dips;
      shallowest = std::min(shallowest, db(around / bottom));
      deepest = std::max(deepest, db(around / bottom));
      longest = std::max(longest, static_cast<double>(m - began) / kTrackRate);
    }
    std::printf("solo: %d bow changes in 30 s, %.1f to %.1f dB deep, at most %.0f ms under -3 dB\n", dips, shallowest,
                deepest, 1000.0 * longest);
    EXPECT(dips >= 3 && dips <= 10, "one player changes bow three to ten times in thirty seconds");
    EXPECT(shallowest > 3.0 && deepest < 9.0, "a bow change is a dip of 3 to 9 dB");
    EXPECT(longest < 0.1, "a bow change is over in under a tenth of a second");
  }

  // Wide without a chorus, and safe in mono.
  {
    auto chord = [&](float width) {
      device.init(kRate);
      device.set_param(p::kWidth, width);
      int id = 0;
      for (float hz : {146.83f, 220.0f, 277.18f, 392.0f}) device.note_on(++id, hz, 0.8f);
      return render(device, 8.0f, kRate);
    };
    const Stereo usual = chord(p::kParamDefault[p::kWidth]);
    const double alike = correlation(usual.left, usual.right, 2 * kSecond);
    const double summed = db(rms(mid(usual), 2 * kSecond) / level_of(usual, 2 * kSecond));
    std::printf("stereo: channels correlate %.2f at the default Width; summed to mono the chord is %.2f dB down\n", alike,
                summed);
    EXPECT(alike > 0.3 && alike < 0.85, "left and right correlate between 0.3 and 0.85 at the default Width");
    EXPECT(summed > -3.0, "summed to mono the chord loses under 3 dB");
    const Stereo narrow = chord(0.0f);
    EXPECT(correlation(narrow.left, narrow.right, 2 * kSecond) > 0.999, "Width 0 is mono");
    const Stereo wide = chord(1.0f);
    EXPECT(correlation(wide.left, wide.right, 2 * kSecond) < alike, "Width 1 is wider than the default");
  }
}

// The wood, the bow, the mute and the hiss.
static void check_body_and_bow() {
  // The body's resonances stay where they are when the note moves. Harmonic
  // 2n of C4 and harmonic n of C5 are the same frequency, so they meet the
  // same resonance: across n the two differ by a constant (the sawtooth's
  // 6 dB and the notes' levelling), though the body pushes those harmonics
  // up and down by far more. A filter that followed the note would give
  // each harmonic number the same colour instead, and the difference would
  // follow the body's shape.
  {
    double lower[6], upper[6];
    for (int pass = 0; pass < 2; ++pass) {
      solo(device);
      device.set_param(p::kBow, 0.5f);
      const double hz = pass == 0 ? 261.626 : 523.251;
      device.note_on(1, static_cast<float>(hz), 1.0f);
      const std::vector<float> x = mid(render(device, 3.0f, kRate));
      for (int n = 1; n <= 6; ++n) {
        (pass == 0 ? lower : upper)[n - 1] = steady_level(x, 523.251 * n, kSecond / 2);
      }
    }
    double least = 1.0e9, most = -1.0e9, low_colour = 1.0e9, high_colour = -1.0e9;
    for (int n = 1; n <= 6; ++n) {
      const double difference = db(lower[n - 1] / upper[n - 1]);
      const double colour = db(upper[n - 1] * n);
      std::printf("fixed formants: %4.0f Hz, C4 against C5 %+.2f dB; the body's colour there %+.1f dB\n", 523.251 * n,
                  difference, colour);
      least = std::min(least, difference);
      most = std::max(most, difference);
      low_colour = std::min(low_colour, colour);
      high_colour = std::max(high_colour, colour);
    }
    EXPECT(high_colour - low_colour > 6.0, "the body colours those six harmonics by more than 6 dB");
    EXPECT(most - least < 3.0, "a harmonic meets the same resonance whichever note it belongs to (within 1.5 dB)");
  }

  // The hiss goes through the same wood: between the harmonics of G4 and of
  // G5 it shows the air resonance near 280 Hz and the bridge hill above the
  // valley under it, in the same places for both notes.
  {
    double air[2], hill[2];
    int i = 0;
    for (float hz : {392.0f, 783.99f}) {
      device.init(kRate);
      device.set_param(p::kAir, 1.0f);
      device.set_param(p::kMute, 0.0f);
      device.set_param(p::kVibrato, 0.0f);
      device.set_param(p::kAttack, 0.05f);
      device.note_on(1, hz, 0.8f);
      const std::vector<float> left = render(device, 3.5f, kRate).left;
      const Floor low = floor_between(left, hz, 200.0, 340.0, kSecond, 2.0, 40.0);
      const Floor top = floor_between(left, hz, 2200.0, 3300.0, kSecond, 20.0, 60.0);
      const Floor valley = floor_between(left, hz, 1350.0, 1550.0, kSecond, 20.0, 60.0);
      const Floor range = floor_between(left, hz, 1800.0, 4000.0, kSecond, 20.0, 60.0);
      std::printf("hiss under %.0f Hz: air resonance at %.0f Hz (%.1f dB over 200 to 340 Hz), bridge hill %.1f dB over the valley, centred at %.0f Hz\n",
                  hz, low.peak_hz, 10.0 * std::log10(low.strongest / low.power),
                  10.0 * std::log10(top.power / valley.power), range.centre_hz);
      EXPECT_NEAR(low.peak_hz, 280.0, 0.08 * 280.0, "the hiss shows the air resonance near 280 Hz");
      EXPECT(low.strongest > 2.0 * low.power, "the air resonance stands out of the hiss");
      EXPECT(top.power > 3.16 * valley.power, "the hiss shows the bridge hill 5 dB above the valley under it");
      EXPECT(range.centre_hz > 2200.0 && range.centre_hz < 3300.0, "the top of the hiss is centred on the bridge hill");
      air[i] = low.peak_hz;
      hill[i] = range.centre_hz;
      ++i;
    }
    EXPECT_NEAR(air[1] / air[0], 1.0, 0.08, "the air resonance is in the same place an octave up");
    EXPECT_NEAR(hill[1] / hill[0], 1.0, 0.08, "the bridge hill is in the same place an octave up");
  }

  // Bow: from the fingerboard to the bridge the tenth harmonic gains 18 dB
  // or more on the first, and the note stays as loud.
  {
    double tilt[3], level[3];
    int i = 0;
    for (float bow : {0.0f, 0.5f, 1.0f}) {
      solo(device);
      device.set_param(p::kBow, bow);
      device.note_on(1, 220.0f, 1.0f);
      const std::vector<float> x = mid(render(device, 3.0f, kRate));
      tilt[i] = db(steady_level(x, 2200.0, kSecond / 2) / steady_level(x, 220.0, kSecond / 2));
      level[i] = db(rms(x, kSecond / 2));
      std::printf("bow %.1f: harmonic 10 is %+.1f dB against the fundamental, level %.1f dB\n", bow, tilt[i], level[i]);
      ++i;
    }
    EXPECT(tilt[2] - tilt[0] > 18.0, "Bow moves harmonic 10 against harmonic 1 by 18 dB or more");
    EXPECT(tilt[0] < tilt[1] && tilt[1] < tilt[2], "Bow brightens all the way");
    EXPECT(std::fabs(level[0] - level[1]) < 3.0 && std::fabs(level[2] - level[1]) < 3.0,
           "Bow changes the colour of a note, not its loudness (within 3 dB)");
  }

  // Mute veils the top: 2 to 5 kHz falls 6 dB or more against 300 Hz to 1 kHz.
  {
    double balance[2];
    for (int pass = 0; pass < 2; ++pass) {
      solo(device);
      device.set_param(p::kBow, 0.6f);
      device.set_param(p::kMute, pass == 0 ? 0.0f : 1.0f);
      device.note_on(1, 220.0f, 1.0f);
      const std::vector<float> x = mid(render(device, 2.0f, kRate));
      balance[pass] = db(harmonic_band(x, 220.0, 2000.0, 5000.0, kSecond / 2, 3 * kSecond / 2) /
                         harmonic_band(x, 220.0, 300.0, 1000.0, kSecond / 2, 3 * kSecond / 2));
    }
    std::printf("mute: 2 to 5 kHz against 300 Hz to 1 kHz, %.1f dB open and %.1f dB muted\n", balance[0], balance[1]);
    EXPECT(balance[0] - balance[1] > 6.0, "Mute takes 6 dB or more off 2 to 5 kHz");
  }

  // Air is hiss between the harmonics: none at zero, 12 dB or more from a
  // quarter to full, and in the upper half the tone gives way.
  {
    double hiss[4], top[4];
    int i = 0;
    for (float air : {0.0f, 0.25f, 0.5f, 1.0f}) {
      solo(device);
      device.set_param(p::kAir, air);
      device.note_on(1, 220.0f, 0.8f);
      const std::vector<float> left = render(device, 3.5f, kRate).left;
      hiss[i] = 10.0 * std::log10(std::max(floor_between(left, 220.0, 2000.0, 6000.0, kSecond, 20.0, 50.0).power, 1.0e-30));
      top[i] = db(harmonic_band(left, 220.0, 2000.0, 5000.0, kSecond, 2 * kSecond));
      std::printf("air %.2f: hiss between the harmonics at 2 to 6 kHz %.1f dB, harmonics at 2 to 5 kHz %.1f dB\n", air,
                  hiss[i], top[i]);
      ++i;
    }
    EXPECT(hiss[0] < hiss[1] - 40.0, "Air 0 has no hiss: the tone alone is clean between its harmonics");
    EXPECT(hiss[3] - hiss[1] > 12.0, "the hiss rises 12 dB or more from Air 0.25 to 1");
    EXPECT(top[3] < top[2] - 3.0, "the upper half of Air takes the top off the tone");
  }
}

// How loud it is, what velocity does, and the patches it ships with.
static void check_levels() {
  // One note sits where the app expects it.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 6.0f, kRate);
    const double softer = db(peak_of(one));
    device.init(kRate);
    device.note_on(1, 220.0f, 0.8f);
    one = render(device, 6.0f, kRate);
    const double usual = db(peak_of(one));
    std::printf("levels: A3 peaks at %.1f dBFS at gain 0.7 and %.1f dBFS at gain 0.8\n", softer, usual);
    EXPECT(softer > -24.0 && softer < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(usual > -22.0 && usual < -16.0, "one note at gain 0.8 peaks between -22 and -16 dBFS");
  }

  // Every key is as loud as its neighbours: none falls into a dip of the
  // body or jumps out on a resonance.
  {
    std::vector<double> levels;
    double lowest_peak = 0.0, highest_peak = -200.0;
    for (int key = 36; key <= 84; ++key) {
      device.init(kRate);
      device.note_on(1, 440.0f * std::pow(2.0f, static_cast<float>(key - 69) / 12.0f), 0.8f);
      const Stereo out = render(device, 4.0f, kRate);
      levels.push_back(db(level_of(out, 2 * kSecond)));
      const double top = db(peak_of(out));
      lowest_peak = std::min(lowest_peak, top);
      highest_peak = std::max(highest_peak, top);
    }
    std::vector<double> sorted = levels;
    std::sort(sorted.begin(), sorted.end());
    const double median = sorted[sorted.size() / 2];
    std::printf("levels: C2 to C6 by semitone, level %.1f to %.1f dB about a median of %.1f dB; peaks %.1f to %.1f dBFS\n",
                sorted.front(), sorted.back(), median, lowest_peak, highest_peak);
    EXPECT(sorted.front() > median - 3.0 && sorted.back() < median + 3.0, "every key from C2 to C6 is within 3 dB of the median");
    EXPECT(lowest_peak > -24.0 && highest_peak < -14.0, "every key from C2 to C6 peaks between -24 and -14 dBFS");
  }

  // Ten notes stay clear of the soft clip.
  {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    const Stereo chord = render(device, 12.0f, kRate);
    std::printf("levels: ten held notes peak at %.3f and %.3f\n", peak(chord.left), peak(chord.right));
    EXPECT(peak(chord.left) < 0.5 && peak(chord.right) < 0.5, "ten held notes stay under the clip knee");
  }

  // A soft bow is quieter and darker.
  {
    double level[2], bright[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kAir, 0.0f);
      device.note_on(1, 220.0f, pass == 0 ? 0.2f : 1.0f);
      const std::vector<float> x = mid(render(device, 4.0f, kRate));
      level[pass] = rms(x, 2 * kSecond);
      bright[pass] = harmonic_band(x, 220.0, 2000.0, 5000.0, 2 * kSecond, 3 * kSecond) /
                     harmonic_band(x, 220.0, 200.0, 1000.0, 2 * kSecond, 3 * kSecond);
    }
    std::printf("velocity: gain 0.2 is %.1f dB under gain 1, and its 2 to 5 kHz is %.1f dB lower against its 200 Hz to 1 kHz\n",
                db(level[1] / level[0]), db(bright[1] / bright[0]));
    EXPECT(level[0] < 0.6 * level[1], "a soft note is quieter");
    EXPECT(bright[0] < 0.7 * bright[1], "a soft note is darker, by 3 dB or more");
  }

  // The patches in the manifest: the default first, and each one a chord
  // that sounds and stays clear of the clip.
  {
    const std::vector<Preset> presets = load_presets();
    EXPECT(presets.size() >= 5, "the manifest has at least five presets");
    EXPECT(!presets.empty() && presets[0].values.empty(), "the first preset is the default patch");
    for (const Preset& preset : presets) {
      device.init(kRate);
      bool known = true;
      for (const auto& value : preset.values) {
        known = known && value.first >= 0;
        device.set_param(value.first, value.second);
      }
      int id = 0;
      for (float hz : {146.83f, 220.0f, 329.63f}) device.note_on(++id, hz, 0.8f);
      const Stereo out = render(device, 8.0f, kRate);
      const double level = db(level_of(out, 6 * kSecond));
      const double top = peak_of(out);
      std::printf("preset \"%s\": a chord at %.1f dB, peak %.3f\n", preset.name.c_str(), level, top);
      char label[160];
      std::snprintf(label, sizeof label, "preset \"%s\" names parameters the device has", preset.name.c_str());
      EXPECT(known, label);
      std::snprintf(label, sizeof label, "preset \"%s\" sounds and stays under the clip knee", preset.name.c_str());
      EXPECT(finite(out.left) && finite(out.right) && level > -45.0 && top < 0.5, label);
    }
  }
}
