// Native harness for FM Bass (cpp/devices/fm-bass). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it a two-operator FM bass:
// a sine at Depth 0, sidebands where Ratio and the index put them (against
// the Bessel functions), a bend that falls over Bite to Body, feedback that
// brightens and stays a wave locked to the key, velocity, the sub, the
// loudness contour, one voice with glide, strikes from rest that are the
// same samples, and what does not belong (clicks, DC, fold-back).
//
// Nobody has listened to this instrument: every claim below is a number.

#include "../devices/fm-bass/fm_bass.h"

#include <algorithm>
#include <cctype>
#include <cstring>
#include <functional>
#include <string>

#include "support/test_kit.h"

using namespace testkit;
using livemix::FmBass;
namespace p = livemix::fm_bass;

static FmBass device;
static FmBass other;

static const float kRate = 48000.0f;
static const double kA0 = 27.5, kA1 = 55.0, kA2 = 110.0, kA3 = 220.0;
static const double kC4 = 261.6256, kC5 = 523.2511, kC6 = 1046.502;
static const char* const kRatioNames[7] = {"1/2", "1", "2", "3", "4", "5", "7"};
static const double kRatios[7] = {0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 7.0};

static char label[320];

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }

// The Depth that gives an index of `radians` at full velocity.
static float depth_for(double radians) { return static_cast<float>(std::sqrt(radians / FmBass::kMaxIndex)); }

// A steady, plain voice: a held sine at the key, no bend, no sub, no glide,
// at the default Volume (under the soft clip's knee, which would add
// harmonics of its own). Each check changes only what it is about.
static void plain(FmBass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kRatio, 1.0f);
  d.set_param(p::kDepth, 0.0f);
  d.set_param(p::kBite, 0.2f);
  d.set_param(p::kBody, 1.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kDecay, 20.0f);  // hold
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kGlide, 0.0f);
}

// What tone_level measures (amplitude of the `hz` component, Hann window),
// with a rotating phasor in place of a cosine and a sine per sample.
static double level_at(const std::vector<float>& x, double hz, double rate, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = to - from;
  const double step = 2.0 * kPi * hz / rate;
  const double cr = std::cos(step), ci = std::sin(step);
  const double wstep = 2.0 * kPi / static_cast<double>(n);
  const double wr = std::cos(wstep), wi = std::sin(wstep);
  double pr = 1.0, pi = 0.0, qr = 1.0, qi = 0.0, re = 0.0, im = 0.0, window_sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * qr;
    const double v = w * x[from + i];
    re += v * pr;
    im -= v * pi;
    window_sum += w;
    const double next_pr = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = next_pr;
    const double next_qr = qr * wr - qi * wi;
    qi = qr * wi + qi * wr;
    qr = next_qr;
  }
  return 2.0 * std::sqrt(re * re + im * im) / window_sum;
}

// The strongest frequency in [lo, hi] over [from, to): the measure of
// dominant_frequency, whose first pass here steps by half the window's
// resolution, which is what a narrow band around a known pitch needs.
static double peak_frequency(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                             size_t to) {
  to = std::min(to, x.size());
  double span = 0.5 * rate / static_cast<double>(to - from);
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += span) {
    const double level = level_at(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -5; i <= 5; ++i) {
      const double hz = centre + span * i / 5.0;
      const double level = level_at(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 5.0;
  }
  return best_hz;
}

// Hann-weighted mean: the DC a window that is not a whole number of cycles
// would otherwise invent.
static double dc_offset(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weights = 0.0;
  const size_t n = to - from;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    sum += w * x[from + i];
    weights += w;
  }
  return sum / weights;
}

// Bessel function of the first kind, J_n(x), by its integral (the trapezoid
// rule on a periodic integrand is exact to rounding).
static double bessel_j(int n, double x) {
  const int steps = 2048;
  double sum = 0.0;
  for (int i = 0; i < steps; ++i) {
    const double tau = kPi * (i + 0.5) / steps;
    sum += std::cos(n * tau - x * std::sin(tau));
  }
  return sum / steps;
}

// What two sines in step make: sin(a + I·sin(r·a)) is the sum over n of
// J_n(I)·sin((1 + n·r)·a). The amplitude of the partial at `q` times the
// key, with the partials that fall under zero folded back onto it.
static double fm_partial(double q, double ratio, double index) {
  double sum = 0.0;
  for (int n = -60; n <= 60; ++n) {
    const double at_q = 1.0 + n * ratio;
    if (std::fabs(at_q - q) < 1.0e-9) sum += bessel_j(n, index);
    if (std::fabs(at_q + q) < 1.0e-9) sum -= bessel_j(n, index);
  }
  return sum;
}

// Share of the power of the harmonics of `f0` that lies above the third:
// the brightness of a note, whatever its level.
static double brightness(const std::vector<float>& x, double f0, size_t from, size_t to, double rate = kRate) {
  double above = 0.0, total = 0.0;
  for (int h = 1; h * f0 < 0.4 * rate && h <= 60; ++h) {
    const double level = level_at(x, h * f0, rate, from, to);
    total += level * level;
    if (h > 3) above += level * level;
  }
  return total > 0.0 ? above / total : 0.0;
}

// The component at the key against everything else in the note (the other
// half-harmonics up to 30 times the key, the sub among them) over
// [from, to) seconds, in dB.
static double fundamental_against_rest(const std::vector<float>& x, double f0, double from, double to,
                                       double rate = kRate) {
  double fundamental = 0.0, rest = 0.0;
  for (int half = 1; half <= 60; ++half) {
    const double level = level_at(x, 0.5 * half * f0, rate, static_cast<size_t>(from * rate + 0.5),
                                  static_cast<size_t>(to * rate + 0.5));
    if (half == 2) {
      fundamental = level;
    } else {
      rest += level * level;
    }
  }
  return db(fundamental / std::max(std::sqrt(rest), 1.0e-12));
}

// Third difference: a band-limited tone leaves almost nothing in it, a
// discontinuity about its own size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// --- what does not belong: the spectrum between the partials ---------------------------------

static const int kFftSize = 32768;
static livemix::kit::Fft<kFftSize> fft;
static const int kFrame = 4096;
static livemix::kit::Fft<kFrame> frame_fft;
static float fft_re[kFftSize], fft_im[kFftSize];

struct Stray {
  double worst_db;  // the loudest component that is not a partial, against the note
  double total_db;  // all of it together, against the note
  double at_hz;
};

// A Hann spectrum of kFftSize samples from `from`. Every partial of the note
// is a multiple of `base_hz`; whatever lies further than `guard` bins from
// one, between `lo_hz` and `hi_hz`, has folded back or is noise. "The note"
// is a sine as loud as the whole window.
static Stray stray(const std::vector<float>& x, size_t from, double rate, double base_hz, int guard = 16,
                   double lo_hz = 20.0, double hi_hz = 1.0e9) {
  double energy = 0.0;
  for (int i = 0; i < kFftSize; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * i / kFftSize);
    fft_re[i] = static_cast<float>(w * x[from + static_cast<size_t>(i)]);
    fft_im[i] = 0.0f;
    energy += static_cast<double>(x[from + static_cast<size_t>(i)]) * x[from + static_cast<size_t>(i)];
  }
  fft.forward(fft_re, fft_im);
  const double note = std::sqrt(2.0 * energy / kFftSize);
  const double bin = rate / kFftSize;
  hi_hz = std::min(hi_hz, 0.5 * rate);
  double worst = 0.0, where = 0.0, power = 0.0;
  for (int k = static_cast<int>(lo_hz / bin) + 1; k <= kFftSize / 2 && k * bin <= hi_hz; ++k) {
    const double hz = k * bin;
    if (std::fabs(hz - std::round(hz / base_hz) * base_hz) < guard * bin) continue;
    const double amplitude =
        4.0 * std::sqrt(static_cast<double>(fft_re[k]) * fft_re[k] + static_cast<double>(fft_im[k]) * fft_im[k]) /
        kFftSize;
    power += amplitude * amplitude / 1.5;  // a Hann window spreads each component over 1.5 bins
    if (amplitude > worst) {
      worst = amplitude;
      where = hz;
    }
  }
  return {db(worst / note), 0.5 * db(power / (note * note)), where};
}

// --- events at exact samples, whatever the block size ----------------------------------------

struct Event {
  size_t at;
  std::function<void(FmBass&)> what;
};

// Render `total` samples in blocks of `block` frames (0: a ragged mix),
// cutting a block short wherever an event falls.
static std::vector<float> play(FmBass& d, const std::vector<Event>& events, size_t total, int block) {
  static const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  std::vector<float> out(total);
  size_t done = 0, next = 0;
  int which = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) events[next++].what(d);
    size_t frames = static_cast<size_t>(block > 0 ? block : ragged[which++ % 8]);
    frames = std::min(frames, total - done);
    if (next < events.size()) frames = std::min(frames, events[next].at - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) out[done + i] = d.out_left()[i];
    done += frames;
  }
  return out;
}

static double max_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0,
                             size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

// How suddenly an event arrives: the same passage is rendered with and
// without it from init(), and the largest difference up to 8 samples after
// the event can first be heard (the voice comes out 34 samples late) is held
// against the largest in the 20 ms after it. A fade or a smoothed knob has
// moved a little by then; a step is all there at once. Eight moments a
// little apart, so a step cannot hide in a zero crossing; the worst counts.
// `step` gets the largest sample-to-sample jump of the render with the
// event against the largest of the one without.
static double suddenness(const std::function<void(FmBass&)>& setup, const std::function<void(FmBass&)>& event,
                         double* step = nullptr, double before = 0.3) {
  double worst = 0.0, worst_step = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const size_t when = at(before) + static_cast<size_t>(trial) * 173;
    const size_t total = when + at(0.02);
    setup(device);
    const std::vector<float> with = play(device, {{when, event}}, total, kBlock);
    setup(device);
    const std::vector<float> without = play(device, {}, total, kBlock);
    double early = 0.0, whole = 0.0;
    for (size_t i = when; i < total; ++i) {
      const double difference = std::fabs(static_cast<double>(with[i]) - without[i]);
      if (i < when + 34 + 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
    const double reference = std::max(max_step(without), 1.0e-9);
    worst_step = std::max(worst_step, max_step(with, when > 0 ? when - 1 : 0) / reference);
  }
  if (step) *step = worst_step;
  return worst;
}

// --- the manifest's presets ------------------------------------------------------------------

struct Preset {
  std::string name;
  std::vector<std::pair<int, float>> values;
};

// A reader for exactly what device.json holds: the parameter keys in order,
// then "presets": { "Name": { "key": number, ... }, ... }.
static std::vector<Preset> load_presets(std::vector<std::string>* keys) {
  std::vector<Preset> presets;
  std::string text;
  if (std::FILE* file = std::fopen("cpp/devices/fm-bass/device.json", "rb")) {
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
    keys->push_back(quoted(pos + 5, &end));
  }
  size_t pos = text.find('{', presets_at) + 1;
  while (true) {
    const size_t name_at = text.find('"', pos);
    const size_t close_at = text.find('}', pos);
    if (name_at == std::string::npos || name_at > origin_at || close_at < name_at) break;
    Preset preset;
    size_t end;
    preset.name = quoted(name_at, &end);
    const size_t body = text.find('{', end);
    const size_t body_end = text.find('}', body);
    pos = body + 1;
    while (true) {
      const size_t key_at = text.find('"', pos);
      if (key_at == std::string::npos || key_at > body_end) break;
      const std::string key = quoted(key_at, &end);
      const size_t colon = text.find(':', end);
      const float value = std::strtof(text.c_str() + colon + 1, nullptr);
      int id = -1;
      for (size_t k = 0; k < keys->size(); ++k) {
        if ((*keys)[k] == key) id = static_cast<int>(k);
      }
      preset.values.push_back({id, value});
      pos = text.find_first_of(",}", colon);
    }
    presets.push_back(preset);
    pos = body_end + 1;
  }
  return presets;
}

static void load(FmBass& d, const Preset& preset, float rate = kRate) {
  d.init(rate);
  for (const auto& value : preset.values) d.set_param(value.first, value.second);
}

// --- checks ----------------------------------------------------------------------------------

static void check_pitch();
static void check_sine_and_sidebands();
static void check_bite_and_body();
static void check_feedback();
static void check_velocity_and_sub();
static void check_loudness_contour();
static void check_voice_and_glide();
static void check_rest_and_sleep();
static void check_clicks();
static void check_fold_back_and_dc();
static void check_levels();
static void check_presets();

int main() {
  fft.init();
  frame_fft.init();

  Conformance spec;
  spec.name = "fm-bass";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  check_pitch();
  check_sine_and_sidebands();
  check_bite_and_body();
  check_feedback();
  check_velocity_and_sub();
  check_loudness_contour();
  check_voice_and_glide();
  check_rest_and_sleep();
  check_clicks();
  check_fold_back_and_dc();
  check_levels();
  check_presets();

  // Cost of the one voice, held, with everything it has switched on (the
  // default patch dies away and goes to sleep, which would time nothing).
  plain(device);
  device.set_param(p::kDepth, 0.6f);
  device.set_param(p::kBody, 0.6f);
  device.set_param(p::kFeedback, 0.6f);
  device.set_param(p::kSub, 0.5f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  report_cost("fm-bass (held note)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("fm-bass");
}

// Pitch: the component at the key is within 3 cents of it at A0, A1, A2 and
// A3 at any setting, and the wave repeats with the key.
static void check_pitch() {
  // The default patch, by dominant_frequency itself: the strongest component
  // within half an octave of the key.
  for (double hz : {kA0, kA1, kA2, kA3}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, 0.4f, kRate);
    const double found = dominant_frequency(out.left, kRate, hz * 0.7, hz * 1.45, at(0.05), at(0.35));
    std::snprintf(label, sizeof label, "default patch, %.1f Hz: the strongest component is %.2f cents from the key",
                  hz, cents(found, hz));
    EXPECT(std::fabs(cents(found, hz)) < 3.0, label);
  }

  // A plain sine from C0 to C8 at every sample rate.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (double hz : {16.3516, 27.5, 110.0, kC4, kC6, 4186.01}) {
      plain(device, rate);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      const float seconds = hz < 60.0 ? 4.5f : 1.5f;
      Stereo out = render(device, seconds, rate);
      const double found = peak_frequency(out.left, rate, hz * 0.97, hz * 1.03, at(0.5, rate), out.size());
      worst = std::max(worst, std::fabs(cents(found, hz)));
    }
    std::snprintf(label, sizeof label, "a sine from C0 to C8 at %.0f Hz sample rate is at most %.3f cents off", rate,
                  worst);
    EXPECT(worst < 3.0, label);
  }

  // Every ratio with Depth, Body and Feedback full, and half way: the
  // component at the key stays on the key, and it stays there to be found.
  double worst = 0.0, weakest = 1.0e9;
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (int setting = 0; setting < 3; ++setting) {
      for (double hz : {kA0, kA1, kA2, kA3}) {
        plain(device);
        device.set_param(p::kRatio, static_cast<float>(ratio));
        device.set_param(p::kDepth, setting == 0 ? 1.0f : (setting == 1 ? 0.6f : 0.85f));
        device.set_param(p::kFeedback, setting == 0 ? 1.0f : (setting == 1 ? 0.0f : 0.7f));
        device.set_param(p::kSub, setting == 2 ? 1.0f : 0.0f);
        device.note_on(1, static_cast<float>(hz), setting == 1 ? 0.6f : 1.0f);
        const float seconds = hz < 40.0 ? 4.5f : (hz < 80.0 ? 2.5f : 1.5f);
        Stereo out = render(device, seconds, kRate);
        const double found = peak_frequency(out.left, kRate, hz * 0.97, hz * 1.03, at(0.5), out.size());
        const double share = level_at(out.left, hz, kRate, at(0.5), out.size()) / (1.41421356 * rms(out.left, at(0.5)));
        worst = std::max(worst, std::fabs(cents(found, hz)));
        weakest = std::min(weakest, share);
        if (std::fabs(cents(found, hz)) >= 3.0) {
          std::snprintf(label, sizeof label, "Ratio %s, setting %d, %.1f Hz: %.2f cents off (fundamental %.1f dB)",
                        kRatioNames[ratio], setting, hz, cents(found, hz), db(share));
          EXPECT(false, label);
        }
      }
    }
  }
  std::printf("pitch at A0..A3, every ratio, bend and feedback up: at most %.3f cents off; the weakest fundamental "
              "is %.1f dB under the note\n",
              worst, db(weakest));
  EXPECT(worst < 3.0, "the component at the key is within 3 cents at every ratio with Depth, Body and Feedback up");
  EXPECT(db(weakest) > -40.0, "and it never falls more than 40 dB under the note");
}

// At Depth 0 the output is a sine at the key; with the bend up the partials
// are where Ratio puts them and as strong as the Bessel functions say.
static void check_sine_and_sidebands() {
  for (double hz : {kA1, kA3}) {
    plain(device);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    Stereo out = render(device, 1.5f, kRate);
    const double fundamental = level_at(out.left, hz, kRate, at(0.5));
    double other_partials = 0.0;
    for (int half = 1; half <= 40; ++half) {
      if (half == 2) continue;
      other_partials = std::max(other_partials, level_at(out.left, 0.5 * half * hz, kRate, at(0.5)));
    }
    std::snprintf(label, sizeof label,
                  "Depth 0 at %.0f Hz: a sine of %.4f, everything else on the half-harmonics %.1f dB under it", hz,
                  fundamental, db(other_partials / fundamental));
    EXPECT(fundamental > 0.1 && db(other_partials / fundamental) < -80.0, label);
    const Stray rest = stray(out.left, at(0.5), kRate, hz);
    std::snprintf(label, sizeof label, "and nothing between: %.1f dB", rest.worst_db);
    EXPECT(rest.worst_db < -80.0, label);
  }

  // The reference: the bare carrier.
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo bare = render(device, 1.5f, kRate);
  const double carrier = level_at(bare.left, kA2, kRate, at(0.5));

  // Every ratio at an index of 2 and of 5 radians: each partial up to 14
  // times the key, on the half-harmonics too, against sin(a + I·sin(r·a)).
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (double index : {2.0, 5.0}) {
      plain(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.set_param(p::kDepth, depth_for(index));
      device.note_on(1, static_cast<float>(kA2), 1.0f);
      Stereo out = render(device, 1.5f, kRate);
      double worst = 0.0, strongest_off = 0.0, weakest_on = 1.0e9;
      for (int half = 1; half <= 28; ++half) {
        const double q = 0.5 * half;
        const double expected = std::fabs(fm_partial(q, kRatios[ratio], index));
        const double measured = level_at(out.left, q * kA2, kRate, at(0.5)) / carrier;
        worst = std::max(worst, std::fabs(measured - expected));
        // On the grid of 1 ± k·ratio or off it: the first three pairs must
        // be there, and what is off the grid must not.
        bool on_grid = false, near = false;
        for (int k = -40; k <= 40; ++k) {
          if (std::fabs(std::fabs(1.0 + k * kRatios[ratio]) - q) < 1.0e-9) {
            on_grid = true;
            if (k >= -3 && k <= 3) near = true;
          }
        }
        if (!on_grid) strongest_off = std::max(strongest_off, measured);
        if (near && expected > 0.05) weakest_on = std::min(weakest_on, measured);
      }
      std::snprintf(label, sizeof label,
                    "Ratio %s, index %.0f: partials within %.4f of the Bessel sum; off the grid of 1 ± k·ratio at "
                    "most %.1f dB, on it at least %.1f dB",
                    kRatioNames[ratio], index, worst, db(strongest_off), db(weakest_on));
      EXPECT(worst < 0.005 && db(strongest_off) < -70.0 && weakest_on > 0.04, label);
    }
  }

  // Depth 1 at full velocity is an index of 8 radians (in the bass, where
  // the cap is far away): the spectrum of sin(a + 8·sin(a)).
  plain(device);
  device.set_param(p::kDepth, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo deep = render(device, 2.5f, kRate);
  plain(device);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo low = render(device, 2.5f, kRate);
  const double low_carrier = level_at(low.left, kA1, kRate, at(0.5));
  double worst_8 = 0.0, worst_7 = 0.0, worst_9 = 0.0;
  for (int h = 1; h <= 20; ++h) {
    const double measured = level_at(deep.left, h * kA1, kRate, at(0.5)) / low_carrier;
    worst_8 = std::max(worst_8, std::fabs(measured - std::fabs(fm_partial(h, 1.0, 8.0))));
    worst_7 = std::max(worst_7, std::fabs(measured - std::fabs(fm_partial(h, 1.0, 7.5))));
    worst_9 = std::max(worst_9, std::fabs(measured - std::fabs(fm_partial(h, 1.0, 8.5))));
  }
  std::snprintf(label, sizeof label,
                "Depth 1 at A1: within %.4f of an index of 8 radians (%.3f from 7.5, %.3f from 8.5)", worst_8, worst_7,
                worst_9);
  EXPECT(worst_8 < 0.006 && worst_7 > 0.05 && worst_9 > 0.05, label);
}

// The eight lowest harmonics of a note on A2 over 60 ms around `seconds`,
// against the carrier's level, held against sin(a + I·sin(a)): the largest
// difference. The output runs 34 samples behind the contours.
static double off_index(const std::vector<float>& x, double seconds, double carrier, double index,
                        double rate = kRate) {
  double worst = 0.0;
  for (int h = 1; h <= 8; ++h) {
    const double measured = level_at(x, h * kA2, rate, at(seconds - 0.03, rate), at(seconds + 0.03, rate)) / carrier;
    worst = std::max(worst, std::fabs(measured - std::fabs(fm_partial(h, 1.0, index))));
  }
  return worst;
}

// The bend falls from Depth to Body times Depth, 99 % of the way in Bite, and
// stays there: the spectrum at each moment is that of the index the law gives.
static void check_bite_and_body() {
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo bare = render(device, 1.0f, kRate);
  const double carrier = level_at(bare.left, kA2, kRate, at(0.5));

  const double top = 4.0, body = 0.25, bite = 0.8;
  const auto index_at = [&](double seconds, double fall) {
    // The fall starts when the 2 ms strike is over; the voice comes out 34 samples late.
    const double since = std::max(0.0, seconds - 0.002 - 34.25 / kRate);
    return top * (body + (1.0 - body) * std::exp(-4.605170186 * since / fall));
  };
  plain(device);
  device.set_param(p::kDepth, depth_for(top));
  device.set_param(p::kBody, static_cast<float>(body));
  device.set_param(p::kBite, static_cast<float>(bite));
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo out = render(device, 4.0f, kRate);

  double worst = 0.0;
  double bright[6];
  const double moments[6] = {0.05, 0.2, 0.4, 0.8, 1.6, 3.2};
  for (int i = 0; i < 6; ++i) {
    const double t = moments[i];
    worst = std::max(worst, off_index(out.left, t, carrier, index_at(t, bite)));
    bright[i] = brightness(out.left, kA2, at(t - 0.03), at(t + 0.03));
  }
  std::snprintf(label, sizeof label,
                "Bite 0.8 s, Body 0.25, index 4: the spectrum at 0.05..3.2 s is within %.3f of the law's index "
                "(4 falling to 1)",
                worst);
  EXPECT(worst < 0.03, label);
  // The same measured against the wrong laws must not fit: a fall that is
  // 60 dB down at Bite, and one that ends at nothing.
  const double wrong_fall = off_index(out.left, 0.2, carrier, top * (body + (1.0 - body) * std::exp(-6.9078 * 0.2 / bite)));
  const double wrong_rest = off_index(out.left, 3.2, carrier, 0.0);
  std::snprintf(label, sizeof label, "a faster law is %.3f off at 0.2 s, a fall to nothing %.3f off at 3.2 s",
                wrong_fall, wrong_rest);
  EXPECT(wrong_fall > 0.06 && wrong_rest > 0.2, label);

  std::snprintf(label, sizeof label,
                "share of the power above the third harmonic: %.3f %.3f %.3f | %.4f %.4f %.4f (falls over Bite, "
                "then stays)",
                bright[0], bright[1], bright[2], bright[3], bright[4], bright[5]);
  EXPECT(bright[0] > 1.5 * bright[1] && bright[1] > 1.5 * bright[2] && bright[2] > 1.2 * bright[3] &&
             bright[3] < 1.25 * bright[5] && std::fabs(bright[4] - bright[5]) < 0.02 * bright[5],
         label);

  // Body is where it stays: nothing, half, all of it.
  for (double stays : {0.0, 0.5, 1.0}) {
    plain(device);
    device.set_param(p::kDepth, depth_for(top));
    device.set_param(p::kBody, static_cast<float>(stays));
    device.set_param(p::kBite, 0.3f);
    device.note_on(1, static_cast<float>(kA2), 1.0f);
    Stereo held = render(device, 2.5f, kRate);
    const double late = off_index(held.left, 2.0, carrier, top * stays);
    const double early = off_index(held.left, 0.04, carrier, top * stays);
    std::snprintf(label, sizeof label, "Body %.1f: 2 s in the spectrum is within %.4f of index %.0f (%.3f at the strike)",
                  stays, late, top * stays, early);
    EXPECT(late < 0.005 && (stays == 1.0 ? early < 0.01 : early > 0.1), label);
    if (stays == 0.0) {
      EXPECT(db(level_at(held.left, 2 * kA2, kRate, at(1.9), at(2.1)) / carrier) < -80.0,
             "Body 0 settles to a sine: the second harmonic is 80 dB down");
    }
  }

  // The time is Bite's: a quarter of the time, the same spectrum four times
  // sooner; and the longest Bite is still on its way after two seconds.
  plain(device);
  device.set_param(p::kDepth, depth_for(top));
  device.set_param(p::kBody, static_cast<float>(body));
  device.set_param(p::kBite, 0.2f);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo quick = render(device, 1.0f, kRate);
  const double quick_fit = off_index(quick.left, 0.1, carrier, index_at(0.1, 0.2));
  const double quick_as_slow = off_index(quick.left, 0.1, carrier, index_at(0.1, bite));
  std::snprintf(label, sizeof label, "Bite 0.2 s: at 0.1 s within %.3f of its own law, %.3f from the 0.8 s one",
                quick_fit, quick_as_slow);
  EXPECT(quick_fit < 0.03 && quick_as_slow > 0.15, label);

  plain(device);
  device.set_param(p::kDepth, depth_for(top));
  device.set_param(p::kBody, static_cast<float>(body));
  device.set_param(p::kBite, 4.0f);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo slow = render(device, 4.5f, kRate);
  const double slow_fit = std::max(off_index(slow.left, 2.0, carrier, index_at(2.0, 4.0)),
                                   off_index(slow.left, 4.0, carrier, index_at(4.0, 4.0)));
  std::snprintf(label, sizeof label,
                "Bite 4 s: index %.2f after 2 s and %.2f after 4 s, the spectrum within %.3f of that",
                index_at(2.0, 4.0), index_at(4.0, 4.0), slow_fit);
  EXPECT(slow_fit < 0.01, label);

  // The same times at 96 kHz.
  plain(device, 96000.0f);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo bare_96 = render(device, 1.0f, 96000.0f);
  const double carrier_96 = level_at(bare_96.left, kA2, 96000.0, at(0.5, 96000.0));
  plain(device, 96000.0f);
  device.set_param(p::kDepth, depth_for(top));
  device.set_param(p::kBody, static_cast<float>(body));
  device.set_param(p::kBite, static_cast<float>(bite));
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo out_96 = render(device, 1.0f, 96000.0f);
  const double fit_96 = off_index(out_96.left, 0.4, carrier_96, index_at(0.4, bite), 96000.0);
  std::snprintf(label, sizeof label, "at 96 kHz the bend is where the law puts it at 0.4 s (within %.3f)", fit_96);
  EXPECT(fit_96 < 0.03, label);
}

// Feedback bends the modulator towards a sawtooth: its harmonics are those
// of y = sin(a + beta·y), it raises the upper harmonics of the note, and at
// full it is still a wave that repeats with the key, no louder than a sine.
static void check_feedback() {
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo bare = render(device, 1.5f, kRate);
  const double carrier = level_at(bare.left, kA2, kRate, at(0.5));

  // Under a small index I and Ratio 4 the partial at (1 + 4n) times the key
  // is I/2 times the modulator's nth harmonic, which for y = sin(a + beta·y)
  // is 2·J_n(n·beta) / (n·beta). Feedback 1 is one radian; Feedback 0.5 is
  // 0.75 (the knob is finer towards the top).
  const double index = 0.05;
  for (int setting = 0; setting < 3; ++setting) {
    const float knob = setting == 0 ? 0.0f : (setting == 1 ? 0.5f : 1.0f);
    const double beta = FmBass::kMaxFeedback * knob * (2.0 - knob);
    plain(device);
    device.set_param(p::kRatio, 4.0f);
    device.set_param(p::kDepth, depth_for(index));
    device.set_param(p::kFeedback, knob);
    device.note_on(1, static_cast<float>(kA2), 1.0f);
    Stereo out = render(device, 1.5f, kRate);
    double worst = 0.0;
    char text[160] = "";
    for (int n = 1; n <= 6; ++n) {
      const double expected = beta > 0.0 ? 2.0 * bessel_j(n, n * beta) / (n * beta) : (n == 1 ? 1.0 : 0.0);
      const double measured = 2.0 * level_at(out.left, (1 + 4 * n) * kA2, kRate, at(0.5)) / (carrier * index);
      worst = std::max(worst, std::fabs(measured - expected));
      std::snprintf(text + std::strlen(text), sizeof text - std::strlen(text), " %.3f/%.3f", measured, expected);
    }
    std::snprintf(label, sizeof label,
                  "Feedback %.1f: the modulator's harmonics 1..6, measured/sin(a + %.2f·y):%s (within %.3f)", knob, beta,
                  text, worst);
    EXPECT(worst < 0.02, label);
  }

  // It raises the upper harmonics of a bent note.
  double upper[3];
  for (int setting = 0; setting < 3; ++setting) {
    plain(device);
    device.set_param(p::kDepth, depth_for(2.0));
    device.set_param(p::kFeedback, 0.5f * static_cast<float>(setting));
    device.note_on(1, static_cast<float>(kA2), 1.0f);
    Stereo out = render(device, 1.5f, kRate);
    double sum = 0.0;
    for (int h = 8; h <= 40; ++h) {
      const double level = level_at(out.left, h * kA2, kRate, at(0.5));
      sum += level * level;
    }
    upper[setting] = db(std::sqrt(sum) / carrier);
  }
  std::snprintf(label, sizeof label,
                "harmonics 8 to 40 of an index-2 note: %.1f dB at Feedback 0, %.1f dB at 0.5, %.1f dB at 1", upper[0],
                upper[1], upper[2]);
  EXPECT(upper[1] > upper[0] + 20.0 && upper[2] > upper[1] + 3.0, label);

  // Without a bend there is nothing for it to colour.
  plain(device);
  device.set_param(p::kFeedback, 1.0f);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo unbent = render(device, 1.5f, kRate);
  EXPECT(max_difference(unbent.left, bare.left) < 1.0e-6, "at Depth 0 Feedback changes nothing");

  // Full Feedback and full Depth at every ratio: bounded (a bent sine is
  // still between -1 and 1; taking away what lies above the audio band
  // lets the peak overshoot that by up to a quarter where the bend reaches
  // the top of the band), and a wave that repeats with the key: nothing
  // between its partials. The keys are whole numbers of FFT bins, so
  // a partial stays within two bins and the rest of the spectrum is bare.
  double worst_stray = -200.0, worst_peak = 0.0;
  const double bin = kRate / kFftSize;
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (int base : {19, 37, 75}) {  // 27.8, 54.2 and 109.9 Hz
      const double period_bins = ratio == 0 ? 2.0 * base : base;  // Ratio 1/2 repeats every second cycle
      plain(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.set_param(p::kDepth, 1.0f);
      device.set_param(p::kFeedback, 1.0f);
      device.note_on(1, static_cast<float>(period_bins * bin), 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      const Stray rest = stray(out.left, at(1.5), kRate, base * bin, 3);
      worst_stray = std::max(worst_stray, rest.worst_db);
      worst_peak = std::max(worst_peak, peak(out.left, at(0.1)) / peak(bare.left, at(0.1)));
    }
  }
  std::snprintf(label, sizeof label,
                "full Feedback and Depth, every ratio, 28 to 220 Hz: the loudest thing between the partials is "
                "%.1f dB under the note, and the peak %.3f of a sine's",
                worst_stray, worst_peak);
  EXPECT(worst_stray < -80.0 && worst_peak < 1.3, label);
}

// A harder key is louder and bent further, each by its own law; the sub is a
// sine an octave under the key and nothing else.
static void check_velocity_and_sub() {
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo bare = render(device, 1.0f, kRate);
  const double carrier = level_at(bare.left, kA2, kRate, at(0.5));

  // Loudness 0.35 + 0.65·gain, index (0.4 + 0.6·gain) of Depth's: the
  // spectrum of sin(a + I·sin(a)) at that level and that index.
  const double top = 4.0;
  double levels[3], shares[3];
  int n = 0;
  for (double gain : {0.2, 0.6, 1.0}) {
    plain(device);
    device.set_param(p::kDepth, depth_for(top));
    device.note_on(1, static_cast<float>(kA2), static_cast<float>(gain));
    Stereo out = render(device, 1.0f, kRate);
    const double loudness = 0.35 + 0.65 * gain;
    const double index = top * (FmBass::kBendFloor + (1.0 - FmBass::kBendFloor) * gain);
    const double fit = off_index(out.left, 0.5, carrier * loudness, index);
    const double as_hardest = off_index(out.left, 0.5, carrier * loudness, top);
    const double as_loudest = off_index(out.left, 0.5, carrier, index);
    levels[n] = db(rms(out.left, at(0.3)));
    shares[n] = brightness(out.left, kA2, at(0.3), at(0.9));
    ++n;
    std::snprintf(label, sizeof label,
                  "gain %.1f: within %.4f of level %.2f and index %.2f (%.3f from the hardest key's bend, %.3f from "
                  "its level)",
                  gain, fit, loudness, index, as_hardest, as_loudest);
    EXPECT(fit < 0.005 && (gain == 1.0 || (as_hardest > 0.1 && as_loudest > 0.1)), label);
  }
  std::snprintf(label, sizeof label,
                "gain 0.2 / 0.6 / 1: %.1f / %.1f / %.1f dBFS, share of power above the third harmonic %.3f / %.3f / "
                "%.3f",
                levels[0], levels[1], levels[2], shares[0], shares[1], shares[2]);
  EXPECT(levels[1] > levels[0] + 1.5 && levels[2] > levels[1] + 1.5 && shares[1] > 2.0 * shares[0] &&
             shares[2] > 1.3 * shares[1],
         label);

  // The sub: what Sub adds to a bent, fed-back note is one sine at half the
  // key, as loud as the carrier at 1 and half that at 0.5. The key is a whole
  // number of FFT bins, so the sum is one bin and the rest of the spectrum.
  const double bin = kRate / kFftSize;
  const int sub_bin = 75;
  const double key = 2.0 * sub_bin * bin;  // 219.7 Hz
  const auto sounding = [&](float sub) {
    plain(device);
    device.set_param(p::kRatio, 2.0f);
    device.set_param(p::kDepth, 0.6f);
    device.set_param(p::kFeedback, 0.5f);
    device.set_param(p::kSub, sub);
    device.note_on(1, static_cast<float>(key), 1.0f);
    return render(device, 1.5f, kRate).left;
  };
  const std::vector<float> without = sounding(0.0f);
  plain(device);
  device.note_on(1, static_cast<float>(key), 1.0f);
  const double key_carrier = level_at(render(device, 1.5f, kRate).left, key, kRate, at(0.5));
  for (float sub : {0.5f, 1.0f}) {
    const std::vector<float> with = sounding(sub);
    const size_t from = at(0.5);
    for (int i = 0; i < kFftSize; ++i) {
      fft_re[i] = with[from + static_cast<size_t>(i)] - without[from + static_cast<size_t>(i)];
      fft_im[i] = 0.0f;
    }
    fft.forward(fft_re, fft_im);
    double rest = 0.0;
    for (int k = 0; k <= kFftSize / 2; ++k) {
      if (k == sub_bin) continue;
      rest = std::max(rest, 2.0 * std::hypot(static_cast<double>(fft_re[k]), static_cast<double>(fft_im[k])) / kFftSize);
    }
    const double added = 2.0 * std::hypot(static_cast<double>(fft_re[sub_bin]), static_cast<double>(fft_im[sub_bin])) /
                         kFftSize;
    std::snprintf(label, sizeof label,
                  "Sub %.1f adds a sine at half the key, %.4f of the carrier's level; everything else it adds is "
                  "%.1f dB under that",
                  sub, added / key_carrier, db(rest / added));
    EXPECT(std::fabs(added / key_carrier - sub) < 0.002 && db(rest / added) < -90.0, label);
  }
  // With Ratio 1/2 the bend puts a partial of its own an octave under the
  // key, J1 - J3 of the index: Sub adds to it, it does not take from it
  // (up to an index of 3, where that partial changes sign).
  double with_half[2];
  for (int i = 0; i < 2; ++i) {
    plain(device);
    device.set_param(p::kRatio, 0.0f);
    device.set_param(p::kDepth, depth_for(1.5));
    device.set_param(p::kSub, i == 0 ? 0.0f : 0.5f);
    device.note_on(1, static_cast<float>(key), 1.0f);
    with_half[i] = level_at(render(device, 1.5f, kRate).left, 0.5 * key, kRate, at(0.5)) / key_carrier;
  }
  std::snprintf(label, sizeof label,
                "Ratio 1/2 at index 1.5: the partial an octave under is %.3f of the carrier (J1 - J3 is %.3f), and "
                "%.3f with Sub at 0.5",
                with_half[0], std::fabs(fm_partial(0.5, 0.5, 1.5)), with_half[1]);
  EXPECT(std::fabs(with_half[0] - std::fabs(fm_partial(0.5, 0.5, 1.5))) < 0.005 &&
             std::fabs(with_half[1] - with_half[0] - 0.5) < 0.005,
         label);
  const double under = level_at(without, 0.5 * key, kRate, at(0.5)) / key_carrier;
  std::snprintf(label, sizeof label, "at Sub 0 there is nothing an octave under the key (%.1f dB)", db(under));
  EXPECT(db(under) < -90.0, label);
}

// The time a level takes to fall 60 dB, from a line through the level of
// 20 ms windows (four cycles of the 200 Hz the contour checks play).
static double fall_time(const std::vector<float>& x, double from_seconds, double rate = kRate) {
  return rt60(x, rate, from_seconds, 0.02, -72.0);
}

// Loudness: a strike of about 2 ms, 60 dB down after Decay while the key is
// held, held at the top of Decay, Release once the key is up.
static void check_loudness_contour() {
  const float hz = 200.0f;
  for (float rate : {48000.0f, 96000.0f}) {
    for (float decay : {0.05f, 0.3f, 3.0f, 15.0f}) {
      if (rate != kRate && decay > 1.0f) continue;
      plain(device, rate);
      device.set_param(p::kDecay, decay);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, decay * 1.2f + 0.5f, rate);
      const double measured = decay < 0.1f ? decay : fall_time(out.left, 0.04, rate);
      // A second measure that needs no fit: two windows half the Decay apart are 30 dB apart.
      const double first = rms(out.left, at(0.1 * decay + 0.003, rate), at(0.1 * decay + 0.008, rate));
      const double second = rms(out.left, at(0.6 * decay + 0.003, rate), at(0.6 * decay + 0.008, rate));
      std::snprintf(label, sizeof label,
                    "Decay %.2f s at %.0f Hz: 60 dB down in %.3f s while held, %.2f dB over half of it", decay, rate,
                    measured, db(second / first));
      EXPECT(std::fabs(measured / decay - 1.0) < 0.04 && std::fabs(db(second / first) + 30.0) < 0.5, label);
      // And then it is silence, not a small number: the note ends.
      const size_t quiet = at(decay * 1.7 + 0.03, rate);
      if (quiet < out.size()) {
        EXPECT(peak(out.left, quiet) == 0.0, "a note that has died away under a held key is exact silence");
      }
    }
  }

  // The top of Decay holds for as long as the key is down.
  plain(device);
  device.note_on(1, hz, 1.0f);
  Stereo held = render(device, 30.0f, kRate);
  const double early = rms(held.left, at(0.5), at(1.0)), late = rms(held.left, at(29.5), at(30.0));
  std::snprintf(label, sizeof label, "Decay at the top: after 30 s the held note is %.3f dB from where it was",
                db(late / early));
  EXPECT(std::fabs(db(late / early)) < 0.01, label);

  // Release, from a held note: 30 dB over half of it, 60 dB down when it has
  // passed (the voice comes out 0.7 ms after the key goes up). A 2 kHz sine,
  // so that the shortest Release still spans whole cycles in each window.
  for (float rate : {48000.0f, 96000.0f}) {
    const double late = (rate < 60000.0f ? 34.25 : 31.5) / rate;
    for (float release : {0.02f, 0.5f, 5.0f}) {
      if (rate != kRate && release > 1.0f) continue;
      plain(device, rate);
      device.set_param(p::kRelease, release);
      device.note_on(1, 2000.0f, 1.0f);
      Stereo on = render(device, 0.5f, rate);
      device.note_off(1);
      Stereo off = render(device, release * 1.2f + 0.3f, rate);
      const double before = rms(on.left, at(0.4, rate));
      const double window = 0.05 * release;
      const auto level = [&](double seconds) {
        return rms(off.left, at(seconds - 0.5 * window + late, rate), at(seconds + 0.5 * window + late, rate));
      };
      const double half = db(level(0.6 * release) / level(0.1 * release));
      const double left = db(level(release) / before);
      std::snprintf(label, sizeof label,
                    "Release %.2f s at %.0f Hz: %.2f dB over half of it, %.2f dB down when it has passed", release,
                    rate, half, left);
      EXPECT(std::fabs(half + 30.0) < 0.3 && std::fabs(left + 60.0) < 0.5, label);
      EXPECT(peak(off.left, at(release * 1.7 + 0.03, rate)) == 0.0, "and it ends in exact silence");
    }
  }

  // Release only shortens: a short Decay is not stretched by a long Release
  // when the key goes up, and a long Decay is cut short by a short one.
  plain(device);
  device.set_param(p::kDecay, 0.3f);
  device.set_param(p::kRelease, 5.0f);
  device.note_on(1, hz, 1.0f);
  Stereo start = render(device, 0.05f, kRate);
  device.note_off(1);
  Stereo tail = render(device, 0.6f, kRate);
  const double stretched = fall_time(tail.left, 0.0);
  plain(device);
  device.set_param(p::kDecay, 10.0f);
  device.set_param(p::kRelease, 0.2f);
  device.note_on(1, hz, 1.0f);
  render(device, 0.05f, kRate);
  device.note_off(1);
  Stereo cut = render(device, 0.6f, kRate);
  const double shortened = fall_time(cut.left, 0.0);
  std::snprintf(label, sizeof label,
                "Decay 0.3 s with Release 5 s lets go in %.3f s; Decay 10 s with Release 0.2 s in %.3f s", stretched,
                shortened);
  EXPECT(std::fabs(stretched / 0.3 - 1.0) < 0.05 && std::fabs(shortened / 0.2 - 1.0) < 0.05, label);

  // The strike: from nothing to full in 2 ms along a smooth step, never at
  // once: a tenth of full after 0.39 ms, nine tenths after 1.61 ms. The
  // envelope of a 3 kHz sine as the largest sample of the cycle before each
  // moment, timed from the first sample the voice makes.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    plain(device, rate);
    device.note_on(1, 3000.0f, 1.0f);
    Stereo out = render(device, 0.05f, rate);
    const double full = peak(out.left, at(0.02, rate));
    const size_t cycle = at(1.0 / 3000.0, rate);
    size_t first = 0;
    while (first < out.size() && std::fabs(out.left[first]) < 1.0e-4 * full) ++first;
    double tenth = 0.0, most = 0.0, all = 0.0;
    for (size_t i = first; i + cycle < out.size(); ++i) {
      const double level = peak(out.left, i, i + cycle) / full;
      const double seconds = static_cast<double>(i + cycle - first) / rate;
      if (tenth == 0.0 && level >= 0.1) tenth = seconds;
      if (most == 0.0 && level >= 0.9) most = seconds;
      if (level >= 0.98) {
        all = seconds;
        break;
      }
    }
    const double at_once = peak(out.left, first, first + at(0.0002, rate)) / full;
    const double overshoot = peak(out.left) / full;
    std::snprintf(label, sizeof label,
                  "strike at %.0f Hz: a tenth of full %.2f ms after the first sound, nine tenths after %.2f ms, all "
                  "of it after %.2f ms; %.4f of full in the first 0.2 ms, peak %.3f of the held level",
                  rate, 1000.0 * tenth, 1000.0 * most, 1000.0 * all, at_once, overshoot);
    EXPECT(tenth > 0.0003 && tenth < 0.0008 && most > 0.0013 && most < 0.002 && all > 0.0016 && all < 0.0024 &&
               at_once < 0.05 && overshoot < 1.01,
           label);
  }
  (void)start;
}

// The pitch of a sine over [from, to) seconds of `x`, between lo and hi.
static double pitch_in(const std::vector<float>& x, double from, double to, double lo = 200.0, double hi = 600.0) {
  return peak_frequency(x, kRate, lo, hi, at(from), at(to));
}

// One voice: held keys on a stack, the newest plays, pitch slides only
// between overlapping keys and arrives in the Glide time, and every new key
// strikes both envelopes again.
static void check_voice_and_glide() {
  plain(device);
  device.set_param(p::kGlide, 0.4f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo first = render(device, 0.5f, kRate);
  const double started = cents(pitch_in(first.left, 0.005, 0.055), kC4);
  std::snprintf(label, sizeof label, "a key struck from silence starts on pitch, Glide or not (%.1f cents)", started);
  EXPECT(std::fabs(started) < 5.0, label);

  device.note_on(2, static_cast<float>(kC5), 0.8f);
  Stereo slide = render(device, 1.0f, kRate);
  const double middle = cents(pitch_in(slide.left, 0.18, 0.22, 240.0, 560.0), kC4);
  const double later = cents(pitch_in(slide.left, 0.28, 0.32, 240.0, 560.0), kC4);
  const double arrived = cents(pitch_in(slide.left, 0.402, 0.452, 240.0, 560.0), kC5);
  std::snprintf(label, sizeof label,
                "an octave in 0.4 s: %.0f cents up at half the time, %.0f at three quarters, %.2f cents from the new "
                "key once it has passed",
                middle, later, arrived);
  EXPECT(std::fabs(middle - 600.0) < 30.0 && std::fabs(later - 900.0) < 30.0 && std::fabs(arrived) < 1.0, label);
  EXPECT(level_at(slide.left, kC4, kRate, at(0.6)) < 0.001 * level_at(slide.left, kC5, kRate, at(0.6)),
         "two keys held: only the newer one sounds");

  // The time is Glide's, short and long.
  for (float glide : {0.05f, 1.0f}) {
    plain(device);
    device.set_param(p::kGlide, glide);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    render(device, 0.3f, kRate);
    device.note_on(2, static_cast<float>(kC5), 0.8f);
    Stereo out = render(device, glide + 0.2f, kRate);
    const double half = cents(pitch_in(out.left, 0.5 * glide - 0.01, 0.5 * glide + 0.01, 240.0, 560.0), kC4);
    const double end = cents(pitch_in(out.left, glide + 0.005, glide + 0.055, 240.0, 560.0), kC5);
    std::snprintf(label, sizeof label, "Glide %.2f s: %.0f cents up at half the time, %.2f cents off after it", glide,
                  half, end);
    EXPECT(std::fabs(half - 600.0) < 60.0 && std::fabs(end) < 1.0, label);
  }
  plain(device);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(2, static_cast<float>(kC5), 0.8f);
  Stereo jump = render(device, 0.1f, kRate);
  EXPECT(std::fabs(cents(pitch_in(jump.left, 0.003, 0.043), kC5)) < 5.0, "Glide 0: the new key is there at once");

  // Every new key strikes both envelopes; letting it go returns to the key
  // under it without a strike. A bend that dies away to a sine and a
  // loudness that falls, so that a strike shows in both.
  const auto struck = [](FmBass& d) {
    plain(d);
    d.set_param(p::kDepth, depth_for(4.0));
    d.set_param(p::kBody, 0.0f);
    d.set_param(p::kBite, 0.3f);
    d.set_param(p::kDecay, 3.0f);
    d.set_param(p::kRelease, 3.0f);
  };
  struck(device);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo one = render(device, 1.0f, kRate);
  device.note_on(2, static_cast<float>(kA3), 1.0f);
  Stereo two = render(device, 1.0f, kRate);
  device.note_off(2);
  Stereo back = render(device, 0.5f, kRate);
  const double first_level = db(rms(one.left, at(0.01), at(0.05)));
  const double faded_level = db(rms(one.left, at(0.95), at(0.99)));
  const double second_level = db(rms(two.left, at(0.01), at(0.05)));
  const double back_level = db(rms(back.left, at(0.01), at(0.05))) - db(rms(two.left, at(0.95), at(0.99)));
  const double first_bright = brightness(one.left, kA2, at(0.005), at(0.045));
  const double faded_bright = brightness(one.left, kA2, at(0.9), at(1.0));
  const double second_bright = brightness(two.left, kA3, at(0.005), at(0.045));
  const double back_bright = brightness(back.left, kA2, at(0.005), at(0.105));
  std::snprintf(label, sizeof label,
                "a second key over a held one strikes again: level %.1f dB (first %.1f, faded to %.1f), share above "
                "the third harmonic %.3f (first %.3f, faded to %.5f)",
                second_level, first_level, faded_level, second_bright, first_bright, faded_bright);
  EXPECT(std::fabs(second_level - first_level) < 1.0 && faded_level < first_level - 15.0 && second_bright > 0.05 &&
             first_bright > 0.05 && faded_bright < 1.0e-4,
         label);
  std::snprintf(label, sizeof label,
                "letting the newer key go returns to the older without a strike: level moves %.2f dB, share above "
                "the third harmonic %.5f, %.2f cents from the older key",
                back_level, back_bright, cents(pitch_in(back.left, 0.1, 0.4, 80.0, 300.0), kA2));
  EXPECT(std::fabs(back_level) < 1.5 && back_bright < 1.0e-3 &&
             std::fabs(cents(pitch_in(back.left, 0.1, 0.4, 80.0, 300.0), kA2)) < 1.0,
         label);

  // Letting an older key go changes nothing: the same samples as without.
  struck(device);
  struck(other);
  for (FmBass* d : {&device, &other}) {
    d->note_on(1, static_cast<float>(kA2), 1.0f);
    d->process(kBlock);
    d->note_on(2, static_cast<float>(kA3), 0.7f);
    d->process(kBlock);
  }
  device.note_off(1);
  Stereo kept = render(device, 0.5f, kRate);
  Stereo alone = render(other, 0.5f, kRate);
  EXPECT(max_difference(kept.left, alone.left) == 0.0, "letting an older key go leaves the playing one alone");
  device.note_off(2);
  Stereo ending = render(device, 6.0f, kRate);
  EXPECT(rms(ending.left, 0, at(0.1)) > 0.5 * rms(kept.left, at(0.4)) && peak(ending.left, at(5.5)) == 0.0,
         "the last key up releases the note, to exact silence");

  // The stack: five keys down, let go from the top, each time the one under.
  plain(device);
  const double keys[5] = {110.0, 146.83, 196.0, 261.63, 349.23};
  for (int k = 0; k < 5; ++k) {
    device.note_on(10 + k, static_cast<float>(keys[k]), 0.8f);
    render(device, 0.05f, kRate);
  }
  double worst = 0.0;
  for (int k = 4; k >= 1; --k) {
    device.note_off(10 + k);
    Stereo out = render(device, 0.2f, kRate);
    worst = std::max(worst, std::fabs(cents(pitch_in(out.left, 0.05, 0.2, 80.0, 500.0), keys[k - 1])));
  }
  // The same key again goes back on top.
  device.note_on(12, static_cast<float>(keys[2]), 0.8f);
  Stereo again = render(device, 0.2f, kRate);
  worst = std::max(worst, std::fabs(cents(pitch_in(again.left, 0.05, 0.2, 80.0, 500.0), keys[2])));
  std::snprintf(label, sizeof label, "five keys let go from the top: each time the one under it plays (%.2f cents)",
                worst);
  EXPECT(worst < 1.0, label);

  // Keys played apart do not slide, nor do keys that land together; a held
  // key that has died away is still a key to slide from.
  plain(device);
  device.set_param(p::kGlide, 0.4f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  render(device, 0.3f, kRate);
  device.note_off(1);
  render(device, 0.5f, kRate);
  device.note_on(2, static_cast<float>(kC5), 0.8f);
  Stereo apart = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_in(apart.left, 0.005, 0.055), kC5)) < 5.0,
         "a key played after the last was let go starts on pitch");
  device.note_off(2);
  render(device, 0.5f, kRate);
  device.note_on(3, static_cast<float>(kC4), 0.8f);
  device.note_on(4, static_cast<float>(kC5), 0.8f);
  Stereo chord = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_in(chord.left, 0.005, 0.055), kC5)) < 5.0,
         "two keys in the same instant: the newer one sounds at once, without a slide");
  device.note_off(3);
  device.note_off(4);
  render(device, 0.5f, kRate);
  device.set_param(p::kDecay, 0.3f);
  device.note_on(5, static_cast<float>(kC4), 0.8f);
  render(device, 1.0f, kRate);
  Stereo faded = render(device, 0.1f, kRate);
  EXPECT(peak(faded.left) == 0.0, "a held key with a 0.3 s Decay is silent after a second");
  device.note_on(6, static_cast<float>(kC5), 0.8f);
  Stereo late = render(device, 0.2f, kRate);
  const double early = cents(pitch_in(late.left, 0.01, 0.06, 240.0, 560.0), kC5);
  std::snprintf(label, sizeof label, "a key over a held, faded one still slides: %.0f cents under it 35 ms in", -early);
  EXPECT(early < -1000.0 && early > -1200.0, label);
}

// A patch with everything switched on, for the checks that compare samples.
static void busy(FmBass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kRatio, 2.0f);
  d.set_param(p::kDepth, 0.7f);
  d.set_param(p::kBite, 0.3f);
  d.set_param(p::kBody, 0.4f);
  d.set_param(p::kFeedback, 0.6f);
  d.set_param(p::kSub, 0.5f);
  d.set_param(p::kDecay, 0.4f);
  d.set_param(p::kRelease, 0.1f);
  d.set_param(p::kGlide, 0.2f);
}

// A strike from silence is the same samples every time; knobs moved in
// silence have arrived by the next note; the output does not depend on how
// the host cuts time into blocks; both outputs are one signal.
static void check_rest_and_sleep() {
  busy(other);
  other.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo fresh = render(other, 1.0f, kRate);
  EXPECT(peak(fresh.left) > 0.05 && max_difference(fresh.left, fresh.right) == 0.0,
         "both outputs carry the same signal");

  // After a history: other keys, a slide, another ratio and knobs on the move.
  busy(device);
  device.note_on(7, 82.41f, 1.0f);
  render(device, 0.21f, kRate);
  device.note_on(8, 123.47f, 0.4f);
  device.set_param(p::kRatio, 5.0f);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kFeedback, 1.0f);
  render(device, 0.13f, kRate);
  device.note_off(8);
  device.note_off(7);
  render(device, 1.0f, kRate);
  device.set_param(p::kRatio, 2.0f);
  device.set_param(p::kDepth, 0.7f);
  device.set_param(p::kFeedback, 0.6f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo second = render(device, 1.0f, kRate);
  EXPECT(max_difference(second.left, fresh.left) == 0.0,
         "a strike from silence after other notes and knob moves is the first strike, sample for sample");

  // Struck again the moment the note has ended, before the instrument has
  // gone to sleep: find the first sample of silence, then strike there and
  // a few samples either side of where the contour reaches zero.
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  render(device, 0.1f, kRate);
  device.note_off(1);
  Stereo tail = render(device, 0.5f, kRate);
  size_t ends = tail.size();
  while (ends > 0 && tail.left[ends - 1] == 0.0f) --ends;
  for (int offset : {-30, -10, 0, 1, 40, 700, 1200}) {
    busy(device);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    render(device, 0.1f, kRate);
    device.note_off(1);
    const size_t wait = ends + static_cast<size_t>(offset);
    play(device, {}, wait, kBlock);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo again = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "struck %d samples from the note's last sample: the first strike again (%g)",
                  offset, max_difference(again.left, fresh.left));
    EXPECT(max_difference(again.left, fresh.left) == 0.0, label);
  }
  // While the note still sounds the phases carry on instead.
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  render(device, 0.1f, kRate);
  device.note_off(1);
  play(device, {}, ends - 2000, kBlock);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo carried = render(device, 1.0f, kRate);
  EXPECT(max_difference(carried.left, fresh.left) > 0.01, "a key struck while the note sounds carries on from it");

  // A knob moved in silence, also after blocks that leave the control clock
  // off its beat, is where a fresh instrument set that way is.
  for (int odd : {0, 13, 4801}) {
    device.init(kRate);
    if (odd > 0) play(device, {}, static_cast<size_t>(odd), 13);
    busy(other);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, other.param(id));
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo out = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "knobs set after %d samples of silence: the note of a fresh instrument (%g)",
                  odd, max_difference(out.left, fresh.left));
    EXPECT(max_difference(out.left, fresh.left) == 0.0, label);
  }

  // Block sizes. A phrase with an overlap and a slide, knobs moved under
  // the note, a ratio change, a note that dies under a held key in the
  // middle of a slide, a gap with a knob moved in it and a strike after; the
  // gap is stepped across the point where the instrument falls asleep.
  double worst = 0.0;
  for (int gap_ms = 0; gap_ms <= 90; gap_ms += 10) {
    const size_t gap = at(0.001 * gap_ms);
    const std::vector<Event> phrase = {
        {0, [](FmBass& d) { d.note_on(1, 55.0f, 0.9f); }},
        {at(0.050), [](FmBass& d) { d.note_on(2, 82.41f, 0.6f); }},
        {at(0.081), [](FmBass& d) { d.set_param(p::kDepth, 1.0f); }},
        {at(0.103), [](FmBass& d) { d.set_param(p::kRatio, 3.0f); }},
        {at(0.127), [](FmBass& d) { d.set_param(p::kFeedback, 0.2f); }},
        {at(0.150), [](FmBass& d) { d.note_off(2); }},
        {at(0.171), [](FmBass& d) { d.set_param(p::kVolume, -3.0f); }},
        {at(0.200), [](FmBass& d) { d.note_off(1); }},
        // 0.1 s of Release: exact silence from 0.367 s on.
        {at(0.370) + gap, [](FmBass& d) { d.set_param(p::kSub, 1.0f); }},
        {at(0.370) + gap + 7, [](FmBass& d) { d.note_on(3, 110.0f, 1.0f); }},
        {at(0.420) + gap, [](FmBass& d) { d.set_param(p::kDecay, 0.05f); }},
        {at(0.425) + gap, [](FmBass& d) { d.set_param(p::kGlide, 1.0f); }},
        {at(0.430) + gap, [](FmBass& d) { d.note_on(4, 220.0f, 1.0f); }},
        // Key 4 dies in 85 ms, a tenth of the way through its slide, under two held keys.
        {at(0.530) + 2 * gap, [](FmBass& d) { d.note_on(5, 146.83f, 0.8f); }},
        {at(0.700) + 2 * gap, [](FmBass& d) { d.note_off(5); }},
    };
    const size_t total = at(0.9) + 2 * gap;
    busy(device);
    const std::vector<float> reference = play(device, phrase, total, kBlock);
    for (int block : {1, 2048, 0}) {
      busy(device);
      const std::vector<float> out = play(device, phrase, total, block);
      const double difference = max_difference(out, reference);
      worst = std::max(worst, difference);
      if (difference != 0.0) {
        std::snprintf(label, sizeof label, "gap %d ms, blocks of %d: differs from blocks of 128 by %g", gap_ms, block,
                      difference);
        EXPECT(false, label);
      }
    }
    if (gap_ms == 0) {
      EXPECT(peak(reference, at(0.02), at(0.19)) > 0.05 && peak(reference, at(0.372), at(0.42)) > 0.05 &&
                 peak(reference, at(0.535), at(0.6)) > 0.01,
             "the phrase sounds in each of its parts");
    }
  }
  std::snprintf(label, sizeof label,
                "blocks of 1, 128, 2048 and a ragged mix render the same samples, with gaps of 0 to 90 ms (%g)", worst);
  EXPECT(worst == 0.0, label);
}

// No clicks. Each event is rendered against the same passage without it:
// what it changes must grow over milliseconds, not arrive in one sample, and
// the largest sample-to-sample step must stay near the steady note's own.
static void check_clicks() {
  struct Case {
    const char* name;
    std::function<void(FmBass&)> setup;
    std::function<void(FmBass&)> event;
    double sudden;  // most of the 20 ms change allowed within 8 samples
    double step;    // largest step against the passage without the event
    double before;
  };
  // A bright held note: index 4.5 on A1, a little feedback and sub.
  const auto held = [](FmBass& d) {
    plain(d);
    d.set_param(p::kDepth, 0.75f);
    d.set_param(p::kFeedback, 0.3f);
    d.set_param(p::kSub, 0.5f);
    d.set_param(p::kGlide, 0.05f);
    d.note_on(1, static_cast<float>(kA1), 0.9f);
  };
  // The same with Depth at zero, for a knob that opens it.
  const auto dark = [](FmBass& d) {
    plain(d);
    d.set_param(p::kSub, 0.5f);
    d.note_on(1, static_cast<float>(kA1), 0.9f);
  };
  // A note on its way down, and nothing at all.
  const auto falling = [](FmBass& d) {
    plain(d);
    d.set_param(p::kDepth, 0.75f);
    d.set_param(p::kBody, 0.3f);
    d.set_param(p::kDecay, 0.6f);
    d.set_param(p::kSub, 0.5f);
    d.note_on(1, static_cast<float>(kA1), 0.9f);
  };
  const auto nothing = [](FmBass& d) {
    plain(d);
    d.set_param(p::kDepth, 1.0f);
    d.set_param(p::kRatio, 6.0f);
    d.set_param(p::kFeedback, 1.0f);
    d.set_param(p::kSub, 1.0f);
  };
  const Case cases[] = {
      {"Depth 0.75 to 0", held, [](FmBass& d) { d.set_param(p::kDepth, 0.0f); }, 0.3, 1.5, 0.3},
      {"Depth 0.75 to 1", held, [](FmBass& d) { d.set_param(p::kDepth, 1.0f); }, 0.3, 4.0, 0.3},
      {"Depth 0 to 1", dark, [](FmBass& d) { d.set_param(p::kDepth, 1.0f); }, 0.3, 30.0, 0.3},
      {"Body 1 to 0", held, [](FmBass& d) { d.set_param(p::kBody, 0.0f); }, 0.3, 1.5, 0.3},
      {"Feedback 0.3 to 1", held, [](FmBass& d) { d.set_param(p::kFeedback, 1.0f); }, 0.3, 8.0, 0.3},
      {"Feedback 0.3 to 0", held, [](FmBass& d) { d.set_param(p::kFeedback, 0.0f); }, 0.3, 1.5, 0.3},
      {"Sub 0.5 to 1", held, [](FmBass& d) { d.set_param(p::kSub, 1.0f); }, 0.3, 1.5, 0.3},
      {"Sub 0.5 to 0", held, [](FmBass& d) { d.set_param(p::kSub, 0.0f); }, 0.3, 1.5, 0.3},
      {"Volume -9 to -48", held, [](FmBass& d) { d.set_param(p::kVolume, -48.0f); }, 0.3, 1.5, 0.3},
      {"Volume -9 to -3", held, [](FmBass& d) { d.set_param(p::kVolume, -3.0f); }, 0.3, 2.5, 0.3},
      {"Ratio 1 to 7", held, [](FmBass& d) { d.set_param(p::kRatio, 6.0f); }, 0.3, 30.0, 0.3},
      {"Ratio 1 to 1/2", held, [](FmBass& d) { d.set_param(p::kRatio, 0.0f); }, 0.3, 1.5, 0.3},
      {"Bite, Decay, Release and Glide to their ends", held,
       [](FmBass& d) {
         d.set_param(p::kBite, 0.01f);
         d.set_param(p::kDecay, 0.05f);
         d.set_param(p::kRelease, 0.02f);
         d.set_param(p::kGlide, 1.0f);
       },
       0.3, 1.5, 0.3},
      {"key up at the shortest Release", [held](FmBass& d) {
         held(d);
         d.set_param(p::kRelease, 0.02f);
       },
       [](FmBass& d) { d.note_off(1); }, 0.3, 1.5, 0.3},
      {"the same key again", held, [](FmBass& d) { d.note_on(1, static_cast<float>(kA1), 0.9f); }, 0.3, 1.5, 0.3},
      {"a harder key over a soft one, no Glide", [](FmBass& d) {
         plain(d);
         d.set_param(p::kDepth, 0.75f);
         d.set_param(p::kSub, 0.5f);
         d.note_on(1, static_cast<float>(kA1), 0.2f);
       },
       [](FmBass& d) { d.note_on(2, 82.41f, 1.0f); }, 0.3, 6.0, 0.3},
      {"a second key with Glide", held, [](FmBass& d) { d.note_on(2, 82.41f, 0.9f); }, 0.3, 1.5, 0.3},
      {"a key two octaves up, no Glide", [](FmBass& d) {
         plain(d);
         d.set_param(p::kDepth, 0.75f);
         d.set_param(p::kSub, 0.5f);
         d.note_on(1, static_cast<float>(kA1), 0.9f);
       },
       // A jump in pitch is a change of slope, there at once: the waves part
       // as fast as their phases do, and the steps are those of the higher key.
       [](FmBass& d) { d.note_on(2, 220.0f, 0.9f); }, 0.6, 4.5, 0.3},
      {"a strike on a falling note", falling, [](FmBass& d) { d.note_on(1, static_cast<float>(kA1), 0.9f); }, 0.3, 4.0,
       0.3},
      {"a strike from silence, everything up", nothing, [](FmBass& d) { d.note_on(1, static_cast<float>(kA1), 1.0f); },
       0.3, 1.0e12, 0.05},
  };
  for (const Case& c : cases) {
    double step = 0.0;
    const double sudden = suddenness(c.setup, c.event, &step, c.before);
    std::printf("click: %-46s %.3f of its change in 8 samples, largest step %.2f of the passage's\n", c.name, sudden,
                step);
    std::snprintf(label, sizeof label, "%s: %.3f of the change within 8 samples, largest step %.2f times the passage's",
                  c.name, sudden, step);
    EXPECT(sudden < c.sudden && step < c.step, label);
  }

  // A strike from silence has no passage to be held against: its largest
  // step and its largest third difference are those of the note it becomes.
  for (int ratio : {1, 6}) {
    for (double hz : {kA0, kA1, kA3}) {
      nothing(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.note_on(1, static_cast<float>(hz), 1.0f);
      Stereo out = render(device, 0.4f, kRate);
      const double step = max_step(out.left, 0, at(0.004)) / max_step(out.left, at(0.004));
      const double third = kink(out.left, 0, at(0.004)) / kink(out.left, at(0.004));
      std::snprintf(label, sizeof label,
                    "strike from silence, Ratio %s at %.1f Hz, everything up: largest step %.2f and third difference "
                    "%.2f of the held note's",
                    kRatioNames[ratio], hz, step, third);
      EXPECT(step < 1.05 && third < 1.05, label);
    }
  }
}

// Fold-back: whatever in the spectrum is not a partial of the note. Measured
// at the default Volume, under the soft clip's knee, with Depth, Body and
// Feedback up, over the whole band from 20 Hz to half the sample rate.
static void check_fold_back_and_dc() {
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    double worst = -200.0, worst_total = -200.0, worst_hz = 0.0, worst_key = 0.0;
    int worst_ratio = 0;
    for (double hz : {kC4, kC5, kC6, 2093.005}) {
      if (rate != kRate && (hz < 500.0 || hz > 1100.0)) continue;  // C5 and C6 at the other rates
      for (int ratio = 0; ratio < 7; ++ratio) {
        for (int setting = 0; setting < 4; ++setting) {
          if (rate != kRate && setting > 1) continue;
          plain(device, rate);
          device.set_param(p::kRatio, static_cast<float>(ratio));
          device.set_param(p::kDepth, setting < 2 ? 1.0f : 0.6f);
          device.set_param(p::kFeedback, (setting & 1) ? 1.0f : 0.0f);
          device.note_on(1, static_cast<float>(hz), 1.0f);
          Stereo out = render(device, 0.3f + (kFftSize + 64.0f) / rate, rate);
          const Stray rest = stray(out.left, at(0.3, rate), rate, ratio == 0 ? 0.5 * hz : hz);
          worst_total = std::max(worst_total, rest.total_db);
          if (rest.worst_db > worst) {
            worst = rest.worst_db;
            worst_hz = rest.at_hz;
            worst_key = hz;
            worst_ratio = ratio;
          }
          if ((hz == kC5 || hz == kC6) && rest.worst_db >= -50.0) {
            std::snprintf(label, sizeof label, "%.0f Hz, Ratio %s, setting %d at %.0f Hz: fold-back %.1f dB", hz,
                          kRatioNames[ratio], setting, rate, rest.worst_db);
            EXPECT(false, label);
          }
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "fold-back at %.0f Hz, %s, every ratio, Depth and Feedback full: the loudest stray component is "
                  "%.1f dB under the note (at %.0f Hz, key %.0f Hz, Ratio %s), all of it together %.1f dB",
                  rate, rate == kRate ? "C4 to C7" : "C5 and C6", worst, worst_hz, worst_key, kRatioNames[worst_ratio],
                  worst_total);
    EXPECT(worst < -56.0 && worst_total < -50.0, label);
  }

  // With the sub in, and as a preset would have it (Body under 1, a key
  // that is not the hardest).
  double worst = -200.0;
  for (double hz : {kC5, kC6}) {
    for (int ratio = 0; ratio < 7; ++ratio) {
      plain(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.set_param(p::kDepth, 0.8f);
      device.set_param(p::kBody, 0.6f);
      device.set_param(p::kFeedback, 0.5f);
      device.set_param(p::kSub, 1.0f);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      worst = std::max(worst, stray(out.left, at(0.3), kRate, 0.5 * hz).worst_db);
    }
  }
  std::snprintf(label, sizeof label, "with the sub and a softer key, C5 and C6: %.1f dB", worst);
  EXPECT(worst < -56.0, label);

  // No DC under the note: a bend made of sines in step has none, and the
  // blocker holds what rounding leaves. Every ratio, everything up.
  double worst_dc = 0.0;
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (double hz : {kA0, kA1, kA3}) {
      plain(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.set_param(p::kDepth, 1.0f);
      device.set_param(p::kFeedback, 1.0f);
      device.set_param(p::kSub, 1.0f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      worst_dc = std::max(worst_dc, std::fabs(dc_offset(out.left, at(0.5), at(2.5))) / peak(out.left, at(0.5)));
    }
  }
  std::snprintf(label, sizeof label, "DC under a held note, every ratio, everything up: at most %.1f dB against its peak",
                db(worst_dc));
  EXPECT(db(worst_dc) < -70.0, label);
}

// Levels: a key at gain 0.7 between -24 and -10 dBFS at the default Volume,
// nothing the knobs can do at that Volume reaches the soft clip's knee up to
// C4 (from B flat 4 up the loudest patch passes it by half a decibel), and
// the clip bounds the output when Volume is pushed.
static void check_levels() {
  char text[200] = "";
  bool in_range = true;
  for (double hz : {16.3516, kA0, kA1, kA2, kA3, kC5}) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    Stereo out = render(device, 1.0f, kRate);
    const double level = db(peak(out.left));
    in_range = in_range && level > -24.0 && level < -10.0;
    std::snprintf(text + std::strlen(text), sizeof text - std::strlen(text), " %.1f", level);
  }
  std::snprintf(label, sizeof label, "default patch, gain 0.7, C0 A0 A1 A2 A3 C5: peaks%s dBFS", text);
  EXPECT(in_range, label);

  // Ten keys held: one voice, so no louder than one.
  device.init(kRate);
  for (int k = 0; k < 10; ++k) device.note_on(k, static_cast<float>(kA1 * std::pow(2.0, k / 12.0)), 1.0f);
  Stereo pile = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "ten keys held at full gain: peak %.3f, under the clip's knee at 0.5",
                peak(pile.left));
  EXPECT(peak(pile.left) < 0.5 && peak(pile.left) > 0.05, label);

  // Everything full at the default Volume. (Feedback full brings the index
  // cap down on the higher keys; the loudest patch is the next check.)
  double loudest = 0.0;
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (double hz : {kA0, kA1, kA2, kA3, kC5}) {
      plain(device);
      device.set_param(p::kRatio, static_cast<float>(ratio));
      device.set_param(p::kDepth, 1.0f);
      device.set_param(p::kFeedback, 1.0f);
      device.set_param(p::kSub, 1.0f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      loudest = std::max(loudest, peak(out.left));
    }
  }
  std::snprintf(label, sizeof label,
                "Depth, Feedback and Sub full at full gain, every ratio, A0 to C5: peak %.3f, under the knee at 0.5",
                loudest);
  EXPECT(loudest < 0.5, label);

  // The loudest the knobs can make it: no Feedback, so that the cap stays
  // open, Depth near full, Sub full. A wide bend cut off at the top of the
  // band is no longer a wave of constant height: up to C4 the peak stays
  // under the knee, from B flat 4 up it passes it a little.
  double loudest_bass = 0.0, loudest_above = 0.0;
  for (int ratio = 0; ratio < 7; ++ratio) {
    for (float depth : {0.8f, 0.9f, 0.95f, 1.0f}) {
      for (int note = 24; note <= 96; note += 3) {  // C1 to C7
        plain(device);
        device.set_param(p::kRatio, static_cast<float>(ratio));
        device.set_param(p::kDepth, depth);
        device.set_param(p::kSub, 1.0f);
        device.note_on(1, 440.0f * std::pow(2.0f, static_cast<float>(note - 69) / 12.0f), 1.0f);
        const double level = peak(render(device, 0.3f, kRate).left);
        if (note <= 60) {
          loudest_bass = std::max(loudest_bass, level);
        } else {
          loudest_above = std::max(loudest_above, level);
        }
      }
    }
  }
  std::snprintf(label, sizeof label,
                "no Feedback, Depth 0.8 to 1, Sub full at full gain, every ratio: peak %.3f up to C4, under the knee at "
                "0.5; %.3f above it, less than a decibel over the knee",
                loudest_bass, loudest_above);
  std::printf("%s\n", label);
  EXPECT(loudest_bass < 0.5 && loudest_above < 0.56, label);

  // Volume is decibels, and at the top the clip holds the peak under 1.
  plain(device);
  device.set_param(p::kSub, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo at_default = render(device, 1.0f, kRate);
  plain(device);
  device.set_param(p::kSub, 1.0f);
  device.set_param(p::kVolume, -21.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo quieter = render(device, 1.0f, kRate);
  EXPECT_NEAR(db(rms(quieter.left, at(0.5)) / rms(at_default.left, at(0.5))), -12.0, 0.01,
              "12 dB less Volume is 12 dB less");
  plain(device);
  device.set_param(p::kSub, 1.0f);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kVolume, 6.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo pushed = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "Volume at the top with Sub and Depth full: the clip holds the peak at %.3f",
                peak(pushed.left));
  EXPECT(peak(pushed.left) > 0.5 && peak(pushed.left) <= 1.0 && finite(pushed.left), label);

  // The same level from C0 to C8: nothing in the voice colours a sine.
  double lo = 1.0e9, hi = 0.0;
  for (double hz : {16.3516, 32.7032, 65.4064, 130.8128, kC4, kC5, kC6, 2093.005, 4186.009}) {
    plain(device);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    const double level = level_at(out.left, hz, kRate, at(0.5));
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  std::snprintf(label, sizeof label, "a sine from C0 to C8 keeps its level within %.3f dB", db(hi / lo));
  EXPECT(db(hi / lo) < 0.25, label);
}

// What a preset sounds like, as numbers: the level in six bands (20, 70,
// 200, 600, 2000, 8000 Hz and up) in each 85 ms of a phrase, in dBFS with a
// floor 45 dB under a full note. Two presets are alike when no cell differs.
static const double kShapeFloor = -60.0;
static std::vector<float> shape(const std::vector<float>& x) {
  static float re[kFrame], im[kFrame];
  static const double edges[7] = {20.0, 70.0, 200.0, 600.0, 2000.0, 8000.0, 24000.0};
  std::vector<float> cells;
  for (size_t from = 0; from + kFrame <= x.size(); from += kFrame) {
    for (int i = 0; i < kFrame; ++i) {
      re[i] = static_cast<float>((0.5 - 0.5 * std::cos(2.0 * kPi * i / kFrame)) * x[from + static_cast<size_t>(i)]);
      im[i] = 0.0f;
    }
    frame_fft.forward(re, im);
    double power[6] = {0, 0, 0, 0, 0, 0};
    for (int k = 1; k < kFrame / 2; ++k) {
      const double hz = k * static_cast<double>(kRate) / kFrame;
      for (int band = 0; band < 6; ++band) {
        if (hz >= edges[band] && hz < edges[band + 1]) {
          power[band] += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
        }
      }
    }
    // Power of a Hann-windowed sine of amplitude a: a²·N²/16 in its bin and a quarter of that either side.
    for (int band = 0; band < 6; ++band) {
      const double amplitude = std::sqrt(power[band] / 1.5) * 4.0 / kFrame;
      cells.push_back(static_cast<float>(std::max(db(amplitude), kShapeFloor)));
    }
  }
  return cells;
}

// The presets of the manifest: sixteen, the default patch first, named in
// plain words, each in tune and at a usable level, none far from the others
// in level, no two alike, and at least five that are long, dark or slow.
static void check_presets() {
  std::vector<std::string> keys;
  const std::vector<Preset> presets = load_presets(&keys);
  std::snprintf(label, sizeof label, "device.json holds sixteen presets (%zu) over the ten parameters (%zu)",
                presets.size(), keys.size());
  EXPECT(presets.size() == 16 && keys.size() == static_cast<size_t>(p::kNumParams), label);
  if (presets.empty()) return;

  bool first_is_default = true;
  for (const auto& value : presets[0].values) {
    if (value.first < 0 || value.second != p::kParamDefault[value.first]) first_is_default = false;
  }
  EXPECT(first_is_default, "the first preset is the default patch");

  std::vector<std::vector<float>> shapes;
  std::vector<double> loudest, line_loudest;
  int gentle = 0;
  char gentle_names[320] = "";
  for (const Preset& preset : presets) {
    const char* name = preset.name.c_str();
    bool known = true;
    for (const auto& value : preset.values) {
      if (value.first < 0 || value.second < p::kParamMin[value.first] || value.second > p::kParamMax[value.first]) {
        known = false;
      }
    }
    const char last = preset.name.empty() ? '0' : preset.name.back();
    const char lead = preset.name.empty() ? ' ' : preset.name.front();
    const auto lower = [](std::string text) {
      for (char& c : text) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
      return text;
    };
    int same = 0;
    for (const Preset& twin : presets) same += lower(twin.name) == lower(preset.name) ? 1 : 0;
    std::snprintf(label, sizeof label,
                  "preset \"%s\": a name of at most 20 characters with no space at either end, that does not end in "
                  "a digit, used once whatever the case, every value a parameter within its range",
                  name);
    EXPECT(!preset.name.empty() && preset.name.size() <= 20 && lead != ' ' && last != ' ' &&
               !(last >= '0' && last <= '9') && same == 1 && known,
           label);
    if (!known) continue;

    // A phrase: a key, a second over it a second later, both let go.
    load(device, preset);
    const std::vector<float> phrase = play(device,
                                           {{0, [](FmBass& d) { d.note_on(1, 55.0f, 0.8f); }},
                                            {at(1.0), [](FmBass& d) { d.note_on(2, 82.41f, 0.8f); }},
                                            {at(1.5), [](FmBass& d) { d.note_off(1); d.note_off(2); }}},
                                           at(3.5), kBlock);
    shapes.push_back(shape(phrase));

    // A bass line of eight seconds, A1 to A2 and back, gains 0.6 to 1, one
    // pair of keys overlapping: its loudest 400 ms, its peak, its mean.
    {
      std::vector<Event> line;
      static const double steps[16] = {0, 2, 3, 5, 7, 8, 10, 12, 12, 10, 8, 7, 5, 3, 2, 0};
      for (int n = 0; n < 16; ++n) {
        const float hz = static_cast<float>(55.0 * std::pow(2.0, steps[n] / 12.0));
        const float gain = 0.6f + 0.1f * static_cast<float>(n % 5);
        const size_t on = at(0.5 * n);
        const size_t off = at(0.5 * n + (n == 6 ? 0.6 : 0.4));
        line.push_back({on, [n, hz, gain](FmBass& d) { d.note_on(n, hz, gain); }});
        line.push_back({off, [n](FmBass& d) { d.note_off(n); }});
      }
      std::sort(line.begin(), line.end(), [](const Event& a, const Event& b) { return a.at < b.at; });
      load(device, preset);
      const std::vector<float> out = play(device, line, at(8.0), kBlock);
      double most = 0.0;
      for (size_t from = 0; from + at(0.4) <= out.size(); from += at(0.05)) {
        most = std::max(most, rms(out, from, from + at(0.4)));
      }
      line_loudest.push_back(db(most));
      const double line_peak = db(peak(out));
      const double line_dc = std::fabs(mean(out));
      std::snprintf(label, sizeof label,
                    "preset \"%s\" on a bass line: loudest 400 ms %.1f dBFS, peak %.1f dBFS, mean %.5f", name,
                    db(most), line_peak, line_dc);
      EXPECT(db(most) > -50.0 && line_peak <= -3.0 && line_dc < 0.01, label);
      std::printf("%s\n", label);
    }

    // Level: a key at gain 0.7 over the bass keys, and the hardest key.
    double lo = 0.0, hi = -200.0, hardest = 0.0;
    for (double hz : {kA0, kA1, kA2, kA3}) {
      load(device, preset);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      const double level = db(peak(render(device, 0.5f, kRate).left));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
      load(device, preset);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      hardest = std::max(hardest, peak(render(device, 0.5f, kRate).left));
    }

    // Pitch, with the note held so that it lasts: the strongest component
    // within half an octave of the key.
    double off = 0.0;
    for (double hz : {kA0, kA1, kA2, kA3}) {
      load(device, preset);
      device.set_param(p::kDecay, 20.0f);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      const double seconds = hz < 40.0 ? 2.5 : (hz < 80.0 ? 1.5 : 1.0);
      Stereo out = render(device, static_cast<float>(seconds), kRate);
      const double found = peak_frequency(out.left, kRate, 0.7 * hz, 1.45 * hz, at(0.5), out.size());
      off = std::max(off, std::fabs(cents(found, hz)));
    }

    // A preset whose brightness falls slowly stays for a while where it is
    // struck, so it must not be struck where the bend takes the fundamental
    // away (with Ratio 1 an index of 1.84, where J0 = J2: Depth 0.5 on a hard
    // key). The fundamental against the rest of the note over the first
    // tenth of a second, on the harder keys.
    float bite = p::kParamDefault[p::kBite];
    for (const auto& value : preset.values) {
      if (value.first == p::kBite) bite = value.second;
    }
    if (bite >= 1.0f) {
      double weakest = 1.0e9;
      for (float gain : {0.7f, 0.8f, 0.9f, 1.0f}) {
        load(device, preset);
        device.note_on(1, static_cast<float>(kA3), gain);
        Stereo struck = render(device, 0.2f, kRate);
        weakest = std::min(weakest, fundamental_against_rest(struck.left, kA3, 0.01, 0.11));
      }
      std::snprintf(label, sizeof label,
                    "preset \"%s\" (Bite %.1f s) struck at gain 0.7 to 1: over its first tenth of a second the "
                    "fundamental is at its weakest %.1f dB against the rest of the note",
                    name, bite, weakest);
      std::printf("%s\n", label);
      EXPECT(weakest > -15.0, label);
    }

    // How it behaves under a held A1: how much of it lies above 250 Hz (the
    // fifth harmonic and up) at the strike and after, how much lies above
    // the second harmonic early and late, and what is left after 3 s.
    load(device, preset);
    device.note_on(1, 55.0f, 0.7f);
    Stereo held = render(device, 3.2f, kRate);
    loudest.push_back(db(peak(held.left, 0, at(1.0))));
    const auto above = [&](double cut_hz, double from, double to) {
      double high = 0.0, all = 0.0;
      for (int half = 1; half <= 160; ++half) {
        const double level = level_at(held.left, 27.5 * half, kRate, at(from), at(to));
        all += level * level;
        if (27.5 * half > cut_hz) high += level * level;
      }
      return all > 0.0 ? 0.5 * db(high / all) : -200.0;
    };
    const double strike_bright = above(250.0, 0.0, 0.06);
    const double body_bright = above(250.0, 0.3, 0.8);
    const double left = db(rms(held.left, at(3.0), at(3.2)) / rms(held.left, at(0.05), at(0.25)));
    const double darkening = above(120.0, 0.2, 0.5) - above(120.0, 2.2, 2.5);
    const bool is_long = left > -25.0;
    const bool is_dark = strike_bright < -40.0 && body_bright < -40.0;
    const bool is_slow = left > -40.0 && darkening > 6.0;
    if (is_long || is_dark || is_slow) {
      ++gentle;
      std::snprintf(gentle_names + std::strlen(gentle_names), sizeof gentle_names - std::strlen(gentle_names), "%s%s",
                    gentle > 1 ? ", " : "", name);
    }
    std::printf("preset %-17s peak %5.1f..%5.1f dBFS (%.3f at full gain); above 250 Hz %6.1f dB at the strike, "
                "%6.1f dB after; %6.1f dB left after 3 s%s%s%s\n",
                name, lo, hi, hardest, strike_bright, body_bright, left, is_long ? "; long" : "",
                is_dark ? "; dark" : "", is_slow ? "; slow" : "");
    std::snprintf(label, sizeof label,
                  "preset \"%s\": peak %.1f to %.1f dBFS at gain 0.7 on A0 to A3, %.3f at full gain, %.2f cents off",
                  name, lo, hi, hardest, off);
    EXPECT(lo > -24.0 && hi < -9.0 && hardest < 0.5 && off < 3.0, label);
  }
  std::snprintf(label, sizeof label,
                "%d presets are long (less than 25 dB down after 3 s), dark (nothing above 250 Hz over -40 dB on A1) "
                "or slow (still darkening after 2 s): %s",
                gentle, gentle_names);
  EXPECT(gentle >= 5, label);

  // Stepping through them does not jump in level: the loudest moment of the
  // same key (A1 at gain 0.7, its first second) is within 6 dB of the
  // middle preset's.
  if (loudest.size() == presets.size()) {
    std::vector<double> sorted = loudest;
    std::sort(sorted.begin(), sorted.end());
    const double middle = 0.5 * (sorted[(sorted.size() - 1) / 2] + sorted[sorted.size() / 2]);
    std::snprintf(label, sizeof label,
                  "A1 at gain 0.7: the presets peak from %.1f to %.1f dBFS, %.1f under to %.1f over the middle one "
                  "(%.1f dBFS)",
                  sorted.front(), sorted.back(), middle - sorted.front(), sorted.back() - middle, middle);
    std::printf("%s\n", label);
    EXPECT(middle - sorted.front() < 6.0 && sorted.back() - middle < 6.0, label);
  }

  if (line_loudest.size() == presets.size()) {
    std::vector<double> sorted = line_loudest;
    std::sort(sorted.begin(), sorted.end());
    const double middle = 0.5 * (sorted[(sorted.size() - 1) / 2] + sorted[sorted.size() / 2]);
    std::snprintf(label, sizeof label,
                  "on the bass line the loudest 400 ms of the presets runs from %.1f to %.1f dBFS, %.1f under to "
                  "%.1f over the middle one (%.1f dBFS)",
                  sorted.front(), sorted.back(), middle - sorted.front(), sorted.back() - middle, middle);
    std::printf("%s\n", label);
    EXPECT(middle - sorted.front() < 6.0 && sorted.back() - middle < 6.0, label);
  }

  // No two alike: for every pair some band differs by 10 dB at some moment.
  double nearest = 1.0e9;
  size_t nearest_a = 0, nearest_b = 0;
  for (size_t a = 0; a < shapes.size(); ++a) {
    for (size_t b = a + 1; b < shapes.size(); ++b) {
      double apart = 0.0;
      for (size_t i = 0; i < shapes[a].size(); ++i) {
        apart = std::max(apart, std::fabs(static_cast<double>(shapes[a][i]) - shapes[b][i]));
      }
      if (apart < nearest) {
        nearest = apart;
        nearest_a = a;
        nearest_b = b;
      }
    }
  }
  if (shapes.size() == presets.size() && shapes.size() > 1) {
    std::snprintf(label, sizeof label,
                  "no two presets render alike: the nearest pair, \"%s\" and \"%s\", is %.1f dB apart in some band at "
                  "some moment",
                  presets[nearest_a].name.c_str(), presets[nearest_b].name.c_str(), nearest);
    std::printf("%s\n", label);
    EXPECT(nearest > 10.0, label);
  }
}
