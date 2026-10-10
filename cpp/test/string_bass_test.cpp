// Native harness for String Bass (cpp/devices/string-bass). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates; the rest measures what makes it a plucked bass and
// not a synthesizer: strings in tune at the bottom of the keyboard that
// darken as they die, a pluck with a place and a hardness, a hand that mutes
// and one that stops the string, a fretless that blooms, frets that rattle,
// an upright with a body, and four strings that are taken, plucked again and
// let go without a click.
//
// Nobody has listened to this instrument. Every claim below is a number.

#include "../devices/string-bass/string_bass.h"

#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <functional>
#include <string>

#include "support/test_kit.h"

using namespace testkit;
using livemix::StringBass;
namespace p = livemix::string_bass;

static StringBass device;

static const float kRate = 48000.0f;
enum { kElectric = 0, kFretless = 1, kUpright = 2 };
static const char* kTypeNames[3] = {"Electric", "Fretless", "Upright"};

static const float kE0 = 20.6017f, kA0 = 27.5f, kE1 = 41.2034f, kA1 = 55.0f, kD2 = 73.4162f, kG2 = 97.9989f,
                   kA2 = 110.0f, kC3 = 130.813f, kE3 = 164.814f, kA3 = 220.0f, kC4 = 261.626f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The device with one type and nothing left to chance: every pluck exact.
static void bare(int type, float rate = kRate) {
  device.init(rate);
  device.set_variation(0.0f);
  device.set_param(p::kType, static_cast<float>(type));
}

// One note on the device as it stands, rendered for `seconds`.
static std::vector<float> note(float hz, float gain, float seconds, float rate = kRate) {
  device.note_on(1, hz, gain);
  return render(device, seconds, rate).left;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::min(a.size(), b.size()));
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so sweeps stay fast).
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

// Level in dB of harmonic `k` of `hz` between two moments.
static double harmonic_db(const std::vector<float>& x, double hz, int k, double from, double to, double rate = kRate) {
  return db(bin_level(x, rate, hz * k, at(from, rate), at(to - from, rate)));
}

// The frequency of the strongest component within 4 % of `guess`, to a small
// fraction of a cent: scan, then narrow the span as the window grows.
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

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const size_t n = static_cast<size_t>(window * rate);
  const double a = bin_level(x, rate, hz, at(t0, rate), n);
  const double b = bin_level(x, rate, hz, at(t1, rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// What lies between lo and hi Hz: fourth-order Butterworth each way. The
// shared energy_above splits with one pole, which lets a bass fundamental
// through 20 dB down and so cannot see the top of a bass note at all.
struct Section {
  double b0, b1, b2, a1, a2, z1 = 0.0, z2 = 0.0;
  double tick(double x) {
    const double y = b0 * x + z1;
    z1 = b1 * x - a1 * y + z2;
    z2 = b2 * x - a2 * y;
    return y;
  }
};
static Section section(bool high, double hz, double q, double rate) {
  const double w = 2.0 * kPi * hz / rate, c = std::cos(w), alpha = std::sin(w) / (2.0 * q), a0 = 1.0 + alpha;
  Section s;
  s.b0 = (high ? 1.0 + c : 1.0 - c) / (2.0 * a0);
  s.b1 = (high ? -(1.0 + c) : 1.0 - c) / a0;
  s.b2 = s.b0;
  s.a1 = -2.0 * c / a0;
  s.a2 = (1.0 - alpha) / a0;
  return s;
}
static std::vector<float> band(const std::vector<float>& x, double lo, double hi, double rate = kRate) {
  Section h1 = section(true, lo, 0.5412, rate), h2 = section(true, lo, 1.3066, rate);
  Section l1 = section(false, hi, 0.5412, rate), l2 = section(false, hi, 1.3066, rate);
  std::vector<float> y(x.size());
  for (size_t i = 0; i < x.size(); ++i) y[i] = static_cast<float>(l2.tick(l1.tick(h2.tick(h1.tick(x[i])))));
  return y;
}
// Level in dB of the band from lo to hi between two moments.
static double band_db(const std::vector<float>& x, double lo, double hi, double from, double to, double rate = kRate) {
  return db(rms(band(x, lo, hi, rate), at(from, rate), at(to, rate)));
}
// Brightness: that band against the whole sound over the same window, in dB.
static double brightness(const std::vector<float>& x, double lo, double hi, double from, double to) {
  return band_db(x, lo, hi, from, to) - db(rms(x, at(from), at(to)));
}

// How suddenly an event arrives: the same passage rendered with the event and
// without it, and the share of the change that is already there after eight
// samples, over the worst of eight moments a little apart (so a jump cannot
// hide in a zero crossing). A fade or a smoothed knob has barely begun by
// then; a step is all there at once. `window` is how long the change is
// followed for.
static double suddenness(const std::function<void()>& setup, const std::function<void()>& event, double window = 0.02,
                         double lead = 0.25) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float before = static_cast<float>(lead + 0.0017 * trial);
    setup();
    render(device, before, kRate);
    event();
    const std::vector<float> with = render(device, static_cast<float>(window), kRate).left;
    setup();
    render(device, before, kRate);
    const std::vector<float> without = render(device, static_cast<float>(window), kRate).left;
    const std::vector<float> change = minus(with, without);
    const double whole = peak(change);
    if (whole > 0.0) worst = std::max(worst, peak(change, 0, 8) / whole);
  }
  return worst;
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
  if (std::FILE* file = std::fopen("cpp/devices/string-bass/device.json", "rb")) {
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

// --- the checks -------------------------------------------------------------------------------

static void test_conformance() {
  Conformance spec;
  spec.name = "string-bass";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;  // a hand on the string at the default Release, then the body
  spec.max_peak = 1.01f;     // the soft clip's ceiling
  check_instrument(device, spec, kRate);
}

// In tune at the bottom: A0, A1, A2 and A3 on every type, as shipped and at
// two far corners of the settings, and at the other sample rates.
static void test_pitch() {
  struct Setting {
    const char* name;
    float touch, position, tone, mute, sustain, growl, resonance, gain;
  };
  const Setting settings[3] = {{"as shipped", 0.3f, 0.22f, 0.55f, 0.0f, 5.0f, 0.25f, 0.35f, 0.7f},
                               {"bright", 1.0f, 0.06f, 1.0f, 0.0f, 20.0f, 1.0f, 1.0f, 1.0f},
                               {"dark", 0.0f, 0.5f, 0.0f, 0.3f, 2.0f, 0.0f, 0.0f, 0.3f}};
  for (int type = 0; type < 3; ++type) {
    double worst = 0.0;
    for (const Setting& s : settings) {
      for (float hz : {kA0, kA1, kA2, kA3}) {
        device.init(kRate);  // with the variation of each pluck left on
        device.set_param(p::kType, static_cast<float>(type));
        device.set_param(p::kTouch, s.touch);
        device.set_param(p::kPosition, s.position);
        device.set_param(p::kTone, s.tone);
        device.set_param(p::kMute, s.mute);
        device.set_param(p::kSustain, s.sustain);
        device.set_param(p::kGrowl, s.growl);
        device.set_param(p::kResonance, s.resonance);
        // Long enough to tell 3 cents at 27.5 Hz (a twentieth of a hertz),
        // short enough that the muted note is still above the floor.
        const float ring = StringBass::ring_seconds(type, hz, s.sustain, s.mute);
        const float seconds = std::min(4.0f, std::max(1.2f, 1.5f * ring));
        const std::vector<float> out = note(hz, s.gain, seconds);
        const double error = cents(fine_pitch(out, kRate, hz, at(0.06), out.size()), hz);
        worst = std::max(worst, std::fabs(error));
        if (std::fabs(error) >= 3.0) std::printf("  pitch %s %s %.1f Hz: %+.2f cents\n", kTypeNames[type], s.name, hz, error);
      }
    }
    for (float rate : {44100.0f, 96000.0f}) {
      for (float hz : {kA0, kA1, kA2, kA3}) {
        bare(type, rate);
        const std::vector<float> out = note(hz, 0.7f, 3.0f, rate);
        worst = std::max(worst, std::fabs(cents(fine_pitch(out, rate, hz, at(0.06, rate), out.size()), hz)));
      }
    }
    std::printf("pitch %s: worst %.2f cents (A0, A1, A2, A3; as shipped, bright and dark; 44.1, 48 and 96 kHz)\n",
                kTypeNames[type], worst);
    char label[120];
    std::snprintf(label, sizeof label, "%s is within 3 cents at A0, A1, A2 and A3 at any setting", kTypeNames[type]);
    EXPECT(worst < 3.0, label);
  }
}

// Sustain is the time the fundamental takes to fall 60 dB at A1; the top of
// the note is gone long before, and the long end is long.
static void test_sustain() {
  for (float sustain : {2.0f, 8.0f}) {
    bare(kElectric);
    device.set_param(p::kSustain, sustain);
    device.set_param(p::kGrowl, 0.0f);
    const std::vector<float> out = note(kA1, 0.8f, 0.75f * sustain + 0.5f);
    const double low = ring_time(out, kRate, kA1, 0.1 * sustain, 0.6 * sustain, 0.1 * sustain);
    // The twentieth harmonic, 1100 Hz, while it is still above the floor.
    const double high = ring_time(out, kRate, 20.0 * kA1 * 1.0001, 0.03, 0.03 + 0.05 * sustain, 0.04);
    std::printf("sustain %.0f s at A1: the fundamental falls 60 dB in %.2f s, the partial at 1.1 kHz in %.2f s\n", sustain,
                low, high);
    EXPECT_NEAR(low / sustain, 1.0, 0.12, "Sustain is the fundamental's ring time at A1, within 12 %");
    EXPECT(high < 0.3 * low, "the highs fall at least three times as fast as the fundamental");
  }
  // The same string at other keys: the law the device states.
  for (float hz : {kE0, kE1, kA2, kC4}) {
    bare(kElectric);
    device.set_param(p::kSustain, 3.0f);
    const double law = StringBass::ring_seconds(kElectric, hz, 3.0f, 0.0f);
    const std::vector<float> out = note(hz, 0.8f, static_cast<float>(0.8 * law + 0.6));
    const double window = std::max(0.1 * law, 6.0 / hz);
    const double got = ring_time(out, kRate, hz, 0.1 * law, 0.7 * law, window);
    std::printf("sustain 3 s at %.1f Hz: %.2f s (the law gives %.2f s)\n", hz, got, law);
    EXPECT_NEAR(got / law, 1.0, 0.15, "other keys ring sqrt(55 Hz / f) as long, within 15 %");
  }
  // A note darkens as it rings: wound-string dullness.
  bare(kElectric);
  device.set_param(p::kGrowl, 0.0f);
  const std::vector<float> ringing = note(kA1, 0.8f, 2.2f);
  double previous = 1.0e9;
  bool falling = true;
  double first = 0.0, last = 0.0;
  for (int w = 0; w < 5; ++w) {
    const double b = brightness(ringing, 600.0, 4000.0, 0.05 + 0.4 * w, 0.25 + 0.4 * w);
    if (w == 0) first = b;
    last = b;
    falling = falling && b < previous;
    previous = b;
  }
  std::printf("darkening A1: 600 Hz to 4 kHz stands %.1f dB under the whole note at the pluck, %.1f dB after 1.7 s\n",
              -first, -last);
  EXPECT(falling && last < first - 8.0, "a note darkens all the way: 8 dB or more in under two seconds");

  // The long end: Sustain at 20 s, ten seconds on.
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  const std::vector<float> long_note = note(kA1, 0.8f, 11.0f);
  const double fall = db(bin_level(long_note, kRate, kA1, at(0.2), at(0.8))) -
                      db(bin_level(long_note, kRate, kA1, at(10.0), at(0.8)));
  std::printf("sustain 20 s: A1 has fallen %.1f dB after ten seconds\n", fall);
  EXPECT(fall > 24.0 && fall < 34.0, "at the top of Sustain a note is 30 dB down, not gone, after ten seconds");
}

// Mute: the side of the hand on the strings. Shorter and duller, down to a thud.
static void test_mute() {
  double ring[3], bright[3], onset[3];
  int which = 0;
  for (float mute : {0.0f, 0.5f, 1.0f}) {
    bare(kElectric);
    device.set_param(p::kMute, mute);
    device.set_param(p::kGrowl, 0.0f);
    const double law = StringBass::ring_seconds(kElectric, kA1, 5.0f, mute);
    const std::vector<float> out = note(kA1, 0.8f, static_cast<float>(law) + 0.6f);
    const double window = std::max(0.1 * law, 0.073);
    ring[which] = ring_time(out, kRate, kA1, 0.02 + 0.05 * law, 0.02 + 0.6 * law, window);
    bright[which] = brightness(out, 600.0, 4000.0, 0.03, 0.13);
    onset[which] = band_db(out, 1000.0, 12000.0, 0.0, 0.03);
    std::printf("mute %.1f at A1: rings %.2f s (the law gives %.2f s); 600 Hz to 4 kHz at %.1f dB re the note 30 to 130 ms in; the pluck's top at %.1f dBFS\n",
                mute, ring[which], law, bright[which], onset[which]);
    ++which;
  }
  EXPECT_NEAR(ring[0], 5.0, 0.6, "with no mute the string rings its Sustain");
  EXPECT(ring[1] > 0.5 && ring[1] < 1.0, "Mute 0.5 cuts a five second ring to under a second");
  EXPECT(ring[2] < 0.2, "Mute 1 is a thud: 60 dB down in under a fifth of a second");
  EXPECT(bright[1] < bright[0] - 5.0, "Mute 0.5 takes 5 dB or more off the top of the ringing note");
  EXPECT(bright[2] < bright[0] - 12.0, "and Mute 1 takes 12 dB or more");
  EXPECT(onset[2] < onset[0] - 5.0, "the pluck itself is duller under the hand: 5 dB or more less above 1 kHz");
}

// Where the string is plucked is a comb: a quarter of the way along, every
// fourth harmonic is missing; at the middle, every second one.
static void test_position() {
  // The upright has no pickup, so the only comb in it is the pluck's.
  bare(kUpright);
  device.set_param(p::kPosition, 0.25f);
  device.set_param(p::kTouch, 0.8f);
  device.set_param(p::kResonance, 0.0f);
  device.set_param(p::kGrowl, 0.0f);
  device.set_param(p::kSustain, 20.0f);
  std::vector<float> out = note(kA1, 0.4f, 0.4f);
  for (int missing : {4, 8}) {
    const double below = harmonic_db(out, kA1, missing - 1, 0.02, 0.32);
    const double null = harmonic_db(out, kA1, missing, 0.02, 0.32);
    const double above = harmonic_db(out, kA1, missing + 1, 0.02, 0.32);
    std::printf("plucked at 1/4 (upright A1): harmonic %d is %.1f dB under %d and %.1f dB under %d\n", missing,
                below - null, missing - 1, above - null, missing + 1);
    EXPECT(below - null > 15.0 && above - null > 15.0, "plucked a quarter of the way along, every fourth harmonic is 15 dB under its neighbours");
  }
  const double second = harmonic_db(out, kA1, 1, 0.02, 0.32) - harmonic_db(out, kA1, 2, 0.02, 0.32);
  EXPECT(second < 10.0, "and the second harmonic is there");

  bare(kUpright);
  device.set_param(p::kPosition, 0.5f);
  device.set_param(p::kTouch, 0.8f);
  device.set_param(p::kResonance, 0.0f);
  device.set_param(p::kGrowl, 0.0f);
  device.set_param(p::kSustain, 20.0f);
  out = note(kA1, 0.4f, 0.4f);
  const double even2 = std::min(harmonic_db(out, kA1, 1, 0.02, 0.32), harmonic_db(out, kA1, 3, 0.02, 0.32)) -
                       harmonic_db(out, kA1, 2, 0.02, 0.32);
  const double even4 = std::min(harmonic_db(out, kA1, 3, 0.02, 0.32), harmonic_db(out, kA1, 5, 0.02, 0.32)) -
                       harmonic_db(out, kA1, 4, 0.02, 0.32);
  std::printf("plucked at the middle: harmonic 2 is %.1f dB under its neighbours, harmonic 4 %.1f dB\n", even2, even4);
  EXPECT(even2 > 15.0 && even4 > 15.0, "plucked at the middle, the even harmonics are 15 dB under the odd ones");

  // Through the pickup the pluck's comb is still there. The pickup has one
  // of its own, which on an open string takes most of the sixth harmonic.
  bare(kElectric);
  device.set_param(p::kPosition, 0.25f);
  device.set_param(p::kTouch, 0.8f);
  device.set_param(p::kGrowl, 0.0f);
  device.set_param(p::kSustain, 20.0f);
  out = note(kA1, 0.4f, 0.4f);
  const double fourth = std::min(harmonic_db(out, kA1, 3, 0.02, 0.32), harmonic_db(out, kA1, 5, 0.02, 0.32)) -
                        harmonic_db(out, kA1, 4, 0.02, 0.32);
  const double sixth = std::min(harmonic_db(out, kA1, 5, 0.02, 0.32), harmonic_db(out, kA1, 7, 0.02, 0.32)) -
                       harmonic_db(out, kA1, 6, 0.02, 0.32);
  // Up the neck the pickup sits further along what is left of the string.
  // Where it is a quarter of the way along (between the sixth and seventh
  // fret of the G string) the harmonic it cannot hear is the fourth.
  const float high = StringBass::kOpenHz[3] * 0.25f / StringBass::pickup_fraction(kElectric, StringBass::kOpenHz[3]);
  bare(kElectric);
  device.set_param(p::kPosition, 0.1f);
  device.set_param(p::kTouch, 0.8f);
  device.set_param(p::kGrowl, 0.0f);
  device.set_param(p::kSustain, 20.0f);
  out = note(high, 0.4f, 0.4f);
  const double fretted = std::min(harmonic_db(out, high, 3, 0.02, 0.32), harmonic_db(out, high, 5, 0.02, 0.32)) -
                         harmonic_db(out, high, 4, 0.02, 0.32);
  std::printf("electric, open A plucked at 1/4: harmonic 4 is %.1f dB under its neighbours; the pickup takes %.1f dB from harmonic 6; at %.1f Hz on the G string (pickup at %.3f of what sounds) it takes %.1f dB from harmonic 4\n",
              fourth, sixth, high, StringBass::pickup_fraction(kElectric, high), fretted);
  EXPECT(fourth > 15.0, "the pluck's comb is heard through the pickup");
  EXPECT(sixth > 8.0, "the pickup, a sixth of the way along the open string, takes the sixth harmonic");
  EXPECT(fretted > 15.0, "and the fourth where the string is short enough: the pickup stays where it is as the string shortens");
}

// Touch goes from flesh to a pick, velocity does the same on top, and the
// tone control rolls the top off.
static void test_touch_and_tone() {
  // The pluck, from the sample the string is let go to the top of its first
  // swing, and the largest step between two samples on the way there.
  struct Start {
    double ms, step;
  };
  const auto start_of = [](const std::vector<float>& x) {
    size_t top = 1;
    while (top + 1 < x.size() && std::fabs(x[top + 1]) >= std::fabs(x[top])) ++top;
    double step = std::fabs(x[0]);
    for (size_t i = 1; i <= top; ++i) step = std::max(step, static_cast<double>(std::fabs(x[i] - x[i - 1])));
    return Start{1000.0 * static_cast<double>(top) / kRate, step / std::fabs(x[top])};
  };
  for (int type = 0; type < StringBass::kNumTypes; ++type) {
    double top[2], level[2];
    Start start[2];
    int which = 0;
    for (float touch : {0.0f, 1.0f}) {
      bare(type);
      device.set_param(p::kTouch, touch);
      device.set_param(p::kGrowl, 0.0f);
      device.set_param(p::kTone, 1.0f);
      const std::vector<float> out = note(kA1, 0.7f, 0.5f);
      top[which] = band_db(out, 1000.0, 12000.0, 0.0, 0.06);
      start[which] = start_of(out);
      level[which] = db(bin_level(out, kRate, kA1, at(0.05), at(0.4)));
      ++which;
    }
    // The loudest, brightest pluck there is: a pick at full velocity.
    bare(type);
    device.set_param(p::kTouch, 1.0f);
    device.set_param(p::kTone, 1.0f);
    device.set_param(p::kResonance, 1.0f);
    const Start hardest = start_of(note(kA1, 1.0f, 0.1f));
    std::printf("touch 0 to 1 (%s A1, gain 0.7, tone open): above 1 kHz %.1f to %.1f dBFS in the first 60 ms; the first swing tops out after %.2f ms and %.2f ms; the fundamental moves %+.1f dB; the hardest pick tops out after %.2f ms and its largest step is %.0f %% of that swing\n",
                kTypeNames[type], top[0], top[1], start[0].ms, start[1].ms, level[1] - level[0], hardest.ms,
                100.0 * hardest.step);
    EXPECT(top[1] > top[0] + 10.0, "a pick puts 10 dB more above 1 kHz into the pluck than a finger");
    EXPECT(start[0].ms > 1.8 * start[1].ms, "and a finger is slower to speak: its first swing takes nearly twice as long to reach its top");
    EXPECT(start[0].ms >= 0.8 && start[0].ms < 4.0, "a finger's pluck reaches its top in a millisecond or so");
    EXPECT(hardest.ms >= 0.12, "the hardest pick still takes an eighth of a millisecond or more");
    EXPECT(hardest.step < 0.4 && start[0].step < 0.1, "and no pluck is an edge: the largest step in the hardest is under 40 % of its first swing, in a finger's under 10 %");
    EXPECT(std::fabs(level[1] - level[0]) < 2.5, "the fundamental stays where it was: Touch is tone, not level");
  }

  double soft_top = 0.0, hard_top = 0.0, soft_level = 0.0, hard_level = 0.0;
  for (float gain : {0.3f, 1.0f}) {
    bare(kElectric);
    device.set_param(p::kGrowl, 0.0f);
    const std::vector<float> out = note(kA1, gain, 0.5f);
    (gain < 0.5f ? soft_top : hard_top) = brightness(out, 1000.0, 12000.0, 0.0, 0.06);
    (gain < 0.5f ? soft_level : hard_level) = db(rms(out, 0, at(0.4)));
  }
  std::printf("velocity 0.3 to 1: %.1f dB louder, and what lies above 1 kHz comes up %.1f dB against the note\n",
              hard_level - soft_level, hard_top - soft_top);
  EXPECT(hard_level > soft_level + 6.0, "harder is louder: 6 dB or more from gain 0.3 to 1");
  EXPECT(hard_top > soft_top + 3.0, "and brighter: 3 dB or more above 1 kHz against the note itself");

  double open = 0.0, closed = 0.0, bottom_open = 0.0, bottom_closed = 0.0;
  for (float tone : {0.0f, 1.0f}) {
    bare(kElectric);
    device.set_param(p::kTone, tone);
    device.set_param(p::kTouch, 0.8f);
    const std::vector<float> out = note(kA1, 0.8f, 0.5f);
    (tone < 0.5f ? closed : open) = band_db(out, 1000.0, 12000.0, 0.0, 0.2);
    (tone < 0.5f ? bottom_closed : bottom_open) = db(bin_level(out, kRate, kA1, at(0.05), at(0.4)));
  }
  std::printf("tone 1 to 0: above 1 kHz falls %.1f dB, the fundamental moves %+.2f dB\n", open - closed,
              bottom_closed - bottom_open);
  EXPECT(open - closed > 25.0, "the tone control rolls the top off: 25 dB or more above 1 kHz");
  EXPECT(std::fabs(bottom_closed - bottom_open) < 1.0, "and leaves the fundamental of A1 alone");
}

// Fretless: a softer start, and the tone blooms after the pluck by an
// amount Growl sets. Electric does not bloom.
static void test_fretless() {
  const auto bloom = [](int type, float hz, float growl, float gain) {
    bare(type);
    device.set_param(p::kGrowl, growl);
    const std::vector<float> out = note(hz, gain, 0.6f);
    return brightness(out, 600.0, 2500.0, 0.135, 0.165) - brightness(out, 600.0, 2500.0, 0.005, 0.035);
  };
  for (float hz : {kE1, kA1, kA2}) {
    const double none = bloom(kFretless, hz, 0.0f, 0.6f);
    const double some = bloom(kFretless, hz, 0.6f, 0.6f);
    const double full = bloom(kFretless, hz, 1.0f, 0.6f);
    const double fretted = bloom(kElectric, hz, 1.0f, 0.6f);
    std::printf("fretless %.1f Hz: 600 Hz to 2.5 kHz against the note, 150 ms in less 20 ms in: %+.1f dB at Growl 0, %+.1f at 0.6, %+.1f at 1; electric at Growl 1 %+.1f dB\n",
                hz, none, some, full, fretted);
    EXPECT(none < -0.5, "with Growl at zero a fretless note dies from the first instant, like any string");
    EXPECT(some > 1.5, "with Growl up the tone is brighter 150 ms in than 20 ms in");
    EXPECT(full > some + 2.5, "by an amount Growl sets");
    EXPECT(fretted < -0.5, "an electric note does not bloom, whatever Growl is");
  }
  // The bloom follows the string, so it sings on and then mellows.
  bare(kFretless);
  device.set_param(p::kGrowl, 1.0f);
  const std::vector<float> sung = note(kA1, 0.6f, 2.5f);
  const double early = brightness(sung, 600.0, 2500.0, 0.15, 0.25), late = brightness(sung, 600.0, 2500.0, 2.2, 2.4);
  std::printf("fretless A1 at Growl 1: the bloom stands %.1f dB under the note 0.2 s in and %.1f dB after 2.3 s\n", -early,
              -late);
  EXPECT(late < early - 3.0 && late > early - 20.0, "the bloom mellows as the note rings but is still there two seconds on");

  // The softer start, at the same settings.
  double start[2], top[2];
  for (int type = 0; type < 2; ++type) {
    bare(type);
    device.set_param(p::kGrowl, 0.0f);
    const std::vector<float> out = note(kA1, 0.7f, 0.3f);
    start[type] = brightness(out, 1000.0, 12000.0, 0.0, 0.03);
    size_t peak_at = 1;
    while (peak_at + 1 < out.size() && std::fabs(out[peak_at + 1]) >= std::fabs(out[peak_at])) ++peak_at;
    top[type] = 1000.0 * static_cast<double>(peak_at) / kRate;
  }
  std::printf("the pluck as shipped: electric tops out after %.2f ms with %.1f dB above 1 kHz against the note, fretless after %.2f ms with %.1f dB\n",
              top[kElectric], start[kElectric], top[kFretless], start[kFretless]);
  EXPECT(start[kFretless] < start[kElectric] - 2.0, "a fretless note starts softer: 2 dB or more less above 1 kHz in the pluck");
  EXPECT(top[kFretless] > 1.25 * top[kElectric], "and its first swing takes a quarter longer to reach its top");
}

// Growl on Electric and Upright: the string rattles on the neck when it is
// hit hard, at the start of the note. Soft notes have none.
static void test_growl() {
  const auto rattle = [](int type, float hz, float gain, float position) {
    bare(type);
    device.set_param(p::kGrowl, 0.0f);
    device.set_param(p::kPosition, position);
    const std::vector<float> clean = note(hz, gain, 1.5f);
    bare(type);
    device.set_param(p::kGrowl, 1.0f);
    device.set_param(p::kPosition, position);
    return std::make_pair(minus(note(hz, gain, 1.5f), clean), clean);
  };
  for (int type : {kElectric, kUpright}) {
    const auto soft = rattle(type, kA1, 0.3f, 0.22f);
    const auto hard = rattle(type, kA1, 1.0f, 0.22f);
    const double start = db(rms(hard.first, 0, at(0.05))) - db(rms(hard.second, 0, at(0.05)));
    const double later = db(rms(hard.first, at(1.0), at(1.4))) - db(rms(hard.second, at(1.0), at(1.4)));
    // Where the rattle sits: its share under 800 Hz against its share above.
    const double low = band_db(hard.first, 100.0, 800.0, 0.0, 0.1) - band_db(hard.first, 800.0, 8000.0, 0.0, 0.1);
    std::printf("growl %s A1: a soft note differs by %.1e; a hard one rattles %.1f dB under the note in its first 50 ms and %.1f dB under it a second later; the rattle is %+.1f dB below 800 Hz against above\n",
                kTypeNames[type], peak(soft.first), -start, -later, low);
    EXPECT(peak(soft.first) < 1.0e-9, "a soft note has no rattle at all");
    EXPECT(start > -26.0 && start < -10.0, "a hard note rattles at its start: 10 to 26 dB under the note");
    EXPECT(later < start - 30.0, "and has stopped a second later");
    if (type == kElectric) {
      EXPECT(low < -3.0, "on frets the rattle is bright: most of it above 800 Hz");
    } else {
      EXPECT(low > 3.0, "on the upright's fingerboard it is lower and woodier: most of it under 800 Hz");
    }
  }
  // Odd: a string plucked at its middle has no even harmonics, and the rattle
  // adds none. (A period of a whole, even number of samples, so that the
  // comb sits on the middle exactly.)
  const float hz = kRate / 872.0f;
  const auto odd = rattle(kElectric, hz, 1.0f, 0.5f);
  double odds = 0.0, evens = 0.0;
  for (int k = 22; k <= 38; ++k) {
    const double level = bin_level(odd.first, kRate, hz * k, at(0.01), at(0.25));
    (k % 2 == 1 ? odds : evens) += level * level;
  }
  std::printf("growl electric, plucked at the middle: in the rattle, odd harmonics 23 to 37 stand %.1f dB over the even ones between them\n",
              10.0 * std::log10(odds / evens));
  EXPECT(odds > 100.0 * evens, "the rattle is odd-harmonic: 20 dB or more over the even ones");
}

// Upright: a thump, a top that is gone at once, a shorter ring for the same
// Sustain, and a body that Resonance brings in.
static void test_upright() {
  double ring[3], top_gone[3];
  for (int type : {kElectric, kUpright}) {
    bare(type);
    device.set_param(p::kGrowl, 0.0f);
    const double law = StringBass::ring_seconds(type, kA1, 5.0f, 0.0f);
    const std::vector<float> out = note(kA1, 0.8f, static_cast<float>(0.75 * law + 0.5));
    ring[type] = ring_time(out, kRate, kA1, 0.1 * law, 0.6 * law, 0.1 * law);
    top_gone[type] = band_db(out, 500.0, 4000.0, 0.0, 0.03) - band_db(out, 500.0, 4000.0, 0.2, 0.3);
  }
  std::printf("upright A1 at Sustain 5 s: rings %.2f s against the electric's %.2f s; 500 Hz to 4 kHz falls %.1f dB in the first 250 ms against the electric's %.1f dB\n",
              ring[kUpright], ring[kElectric], top_gone[kUpright], top_gone[kElectric]);
  EXPECT(ring[kUpright] > 0.3 * ring[kElectric] && ring[kUpright] < 0.5 * ring[kElectric],
         "the upright rings for under half the time at the same Sustain");
  EXPECT(top_gone[kUpright] > top_gone[kElectric] + 10.0 && top_gone[kUpright] > 25.0,
         "and its highs die fast: 25 dB in a quarter of a second, 10 dB more than the electric's");

  // The body: what Resonance adds to a note on each of its three resonances,
  // and to the notes between them.
  const auto level = [](float hz, float resonance) {
    bare(kUpright);
    device.set_param(p::kResonance, resonance);
    device.set_param(p::kGrowl, 0.0f);
    const std::vector<float> out = note(hz, 0.5f, 0.5f);
    return db(bin_level(out, kRate, hz, at(0.08), at(0.3)));
  };
  double on[3], least_on = 1.0e9, most_off = -1.0e9;
  for (int m = 0; m < StringBass::kBodyModes; ++m) {
    on[m] = level(StringBass::kBodyHz[m], 1.0f) - level(StringBass::kBodyHz[m], 0.0f);
    least_on = std::min(least_on, on[m]);
    EXPECT(StringBass::kBodyHz[m] >= 60.0f && StringBass::kBodyHz[m] <= 250.0f, "the body's resonances lie between 60 and 250 Hz");
  }
  double off[3];
  const float between[3] = {41.2f, 86.0f, 145.0f};
  for (int k = 0; k < 3; ++k) {
    off[k] = level(between[k], 1.0f) - level(between[k], 0.0f);
    most_off = std::max(most_off, off[k]);
  }
  std::printf("upright body, Resonance 0 to 1: notes at %.0f, %.0f and %.0f Hz rise %+.1f, %+.1f and %+.1f dB; notes at %.0f, %.0f and %.0f Hz between them %+.1f, %+.1f and %+.1f dB\n",
              StringBass::kBodyHz[0], StringBass::kBodyHz[1], StringBass::kBodyHz[2], on[0], on[1], on[2], between[0],
              between[1], between[2], off[0], off[1], off[2]);
  EXPECT(least_on > 2.5, "Resonance lifts a note on any of the three body resonances by 2.5 dB or more");
  EXPECT(least_on > most_off + 2.0, "and the notes between them by 2 dB less: three humps, not a level control");

  // Even across the keys a bass line uses, E1 to E3, as shipped and with the
  // body full up. (Level: the whole note from 30 to 400 ms.)
  for (float resonance : {p::kParamDefault[p::kResonance], 1.0f}) {
    double lowest = 1.0e9, highest = -1.0e9;
    float lowest_hz = 0.0f, highest_hz = 0.0f;
    for (int key = 0; key <= 24; ++key) {
      const float hz = kE1 * std::pow(2.0f, static_cast<float>(key) / 12.0f);
      bare(kUpright);
      device.set_param(p::kResonance, resonance);
      const std::vector<float> out = note(hz, 0.7f, 0.45f);
      const double loud = db(rms(out, at(0.03), at(0.4)));
      if (loud < lowest) lowest = loud, lowest_hz = hz;
      if (loud > highest) highest = loud, highest_hz = hz;
    }
    std::printf("upright E1 to E3 at Resonance %.2f: every key within %.1f dB (quietest %.1f dBFS at %.1f Hz, loudest %.1f dBFS at %.1f Hz)\n",
                resonance, highest - lowest, lowest, lowest_hz, highest, highest_hz);
    if (resonance < 1.0f) {
      EXPECT(highest - lowest < 6.0, "as shipped every key from E1 to E3 is within 6 dB");
    } else {
      EXPECT(highest - lowest < 9.0, "and within 9 dB with the body full up");
    }
  }

  // The thump: on a high note, where the string itself has nothing down there.
  double thump[2] = {0.0, 0.0};
  for (float rate : {48000.0f, 96000.0f}) {
    bare(kUpright, rate);
    device.set_param(p::kGrowl, 0.0f);
    const std::vector<float> plucked = note(kA3, 0.7f, 0.5f, rate);
    const double early = band_db(plucked, 40.0, 130.0, 0.0, 0.04, rate);
    const double later = band_db(plucked, 40.0, 130.0, 0.2, 0.3, rate);
    const double whole = db(rms(plucked, 0, at(0.04, rate)));
    thump[rate > 50000.0f] = early;
    if (rate < 50000.0f) {
      bare(kElectric);
      device.set_param(p::kGrowl, 0.0f);
      const double none = band_db(note(kA3, 0.7f, 0.5f), 40.0, 130.0, 0.0, 0.04);
      std::printf("upright thump under A3: 40 to 130 Hz at %.1f dBFS in the first 40 ms (%.1f dB under the note), %.1f dBFS 200 ms on; the electric has %.1f dBFS there\n",
                  early, whole - early, later, none);
      EXPECT(early > none + 8.0, "the upright thumps: 8 dB more under 130 Hz at the pluck of a high note than the electric");
      EXPECT(whole - early > 3.0 && whole - early < 20.0, "the thump sits 3 to 20 dB under the note, not over it");
      EXPECT(later < early - 20.0, "and is gone 200 ms later");
    }
  }
  std::printf("the thump at 96 kHz is %+.2f dB against 48 kHz\n", thump[1] - thump[0]);
  EXPECT(std::fabs(thump[1] - thump[0]) < 1.0, "the thump is as loud at 96 kHz as at 48 kHz");
}

// Release: how fast the string is stopped at key up, without a click.
static void test_release() {
  for (float release : {0.03f, 0.3f, 3.0f}) {
    const auto held = [release] {
      bare(kElectric);
      device.set_param(p::kSustain, 20.0f);
      device.set_param(p::kRelease, release);
      device.set_param(p::kGrowl, 0.0f);
      device.note_on(1, kA1, 0.8f);
      render(device, 0.4f, kRate);
    };
    // Long enough for the string to be let go of (100 dB down) and for the
    // 2 Hz DC blocker behind it to settle.
    const float seconds = 1.7f * release + 2.0f;
    held();
    const std::vector<float> ringing = render(device, seconds, kRate).left;
    held();
    device.note_off(1);
    const std::vector<float> stopped = render(device, seconds, kRate).left;
    // Half way through Release the note should be half way to -60 dB.
    const double window = std::max(0.02, 0.1 * release);
    const size_t from = at(0.5 * release - 0.5 * window), to = at(0.5 * release + 0.5 * window);
    const double fall = db(rms(ringing, from, to)) - db(rms(stopped, from, to));
    // (At the shortest Release what is left by then is the 2 Hz DC blocker
    // settling after the stopped swing, some 70 dB down and under any pitch.)
    const double after = db(peak(stopped, at(1.2 * release), at(1.2 * release + 0.05)));
    const double end = peak(stopped, stopped.size() - at(0.2), stopped.size());
    std::printf("release %.2f s: %.1f dB down half way through, under %.1f dBFS from 1.2 times Release on, %.1e at the end of %.1f s (the held string: %.1e)\n",
                release, fall, after, end, seconds, peak(ringing, ringing.size() - at(0.2), ringing.size()));
    EXPECT(fall > 24.0 && fall < 40.0, "Release is the time a let-go string takes to fall 60 dB: 30 dB (and a little, for its top) half way");
    EXPECT(after < -66.0, "past Release there is nothing left to hear: 66 dB or more under full scale");
    EXPECT(end == 0.0, "and then the string is let go of and the instrument sleeps: exact silence");
  }
  // No click when the hand comes down, at the shortest Release and on every type.
  for (int type = 0; type < StringBass::kNumTypes; ++type) {
    const double sudden = suddenness(
        [type] {
          bare(type);
          device.set_param(p::kRelease, 0.03f);
          device.set_param(p::kTouch, 0.8f);
          device.note_on(1, kA1, 0.9f);
        },
        [] { device.note_off(1); }, 0.04, 0.12);
    std::printf("key up on %s at the shortest Release: %.2f %% of the change is there after 8 samples\n", kTypeNames[type],
                100.0 * sudden);
    EXPECT(sudden < 0.05, "a key let go does not click: under 5 % of the change in the first 8 samples");
  }
  // A key let go before its pluck has sounded is still plucked, then stopped.
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  device.note_on(1, kA1, 0.8f);
  device.note_off(1);
  const std::vector<float> tapped = render(device, 1.5f, kRate).left;
  std::printf("a key let go at once: peaks %.1f dBFS, then %.1e after 1.2 s\n", db(peak(tapped)), peak(tapped, at(1.2), tapped.size()));
  EXPECT(peak(tapped) > 0.01, "a key struck and let go in the same instant still sounds");
  EXPECT(peak(tapped, at(1.2), tapped.size()) == 0.0, "and stops: no string is left ringing");

  // The top goes first: the hand closes a low-pass as it comes down.
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  device.set_param(p::kRelease, 1.0f);
  device.set_param(p::kTouch, 0.8f);
  device.note_on(1, kA1, 0.8f);
  render(device, 0.1f, kRate);
  device.note_off(1);
  const std::vector<float> closing = render(device, 0.6f, kRate).left;
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  device.set_param(p::kTouch, 0.8f);
  device.note_on(1, kA1, 0.8f);
  render(device, 0.1f, kRate);
  const std::vector<float> open = render(device, 0.6f, kRate).left;
  const double duller = brightness(open, 1200.0, 6000.0, 0.3, 0.5) - brightness(closing, 1200.0, 6000.0, 0.3, 0.5);
  std::printf("a second's Release, 0.4 s in: 1.2 to 6 kHz is %.1f dB further under the note than on a held string\n", duller);
  EXPECT(duller > 5.0, "the top goes first under the hand: 5 dB duller than the held string by then");
}

// Four strings: a fifth key takes the quietest, which fades under the finger
// first; the note that takes it is whole.
static void test_stealing() {
  const float chord[4] = {kE1, kA1, kD2, kG2};
  const auto four = [&chord](float quiet_gain) {
    bare(kElectric);
    device.set_param(p::kSustain, 20.0f);
    device.set_param(p::kGrowl, 0.0f);
    for (int n = 0; n < 4; ++n) device.note_on(n + 1, chord[n], n == 2 ? quiet_gain : 0.8f);
    render(device, 0.3f, kRate);
  };
  four(0.8f);
  std::vector<float> out = render(device, 0.5f, kRate).left;
  double least = 1.0e9;
  for (int n = 0; n < 4; ++n) least = std::min(least, db(bin_level(out, kRate, chord[n], at(0.05), at(0.4))));
  std::printf("four keys held: the quietest fundamental of the four is at %.1f dBFS\n", least);
  EXPECT(least > -40.0, "four keys are four strings sounding together");

  // The third key was played softly: it is the one a fifth key takes.
  four(0.25f);
  const std::vector<float> kept = render(device, 0.6f, kRate).left;
  four(0.25f);
  device.note_on(5, kC3, 0.8f);
  const std::vector<float> taken = render(device, 0.6f, kRate).left;
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  device.set_param(p::kGrowl, 0.0f);
  device.note_on(5, kC3, 0.8f);
  const std::vector<float> alone = render(device, 0.6f, kRate).left;
  const size_t from = at(0.1), n = at(0.45);
  const double gone = db(bin_level(kept, kRate, kD2, from, n)) - db(bin_level(taken, kRate, kD2, from, n));
  double moved = 0.0;
  for (int k : {0, 1, 3}) {
    moved = std::max(moved, std::fabs(db(bin_level(kept, kRate, chord[k], from, n)) - db(bin_level(taken, kRate, chord[k], from, n))));
  }
  const double whole = db(bin_level(taken, kRate, kC3, from, n)) - db(bin_level(alone, kRate, kC3, from, n));
  std::printf("a fifth key: the soft string falls %.1f dB, the other three move %.2f dB at most, and the new note is %+.2f dB against the same note alone\n",
              gone, moved, whole);
  EXPECT(gone > 30.0, "the fifth key takes the quietest string");
  EXPECT(moved < 0.5, "and leaves the other three alone");
  EXPECT(std::fabs(whole) < 0.5, "the note that takes a string is as loud as on a free one");

  // The taken string fades: what changes in the 2.5 ms before the new pluck
  // is a ramp, not a cut. All four strings loud, so the quietest is not quiet.
  const double sudden = suddenness(
      [&chord] {
        bare(kElectric);
        device.set_param(p::kSustain, 20.0f);
        device.set_param(p::kTouch, 0.9f);
        for (int k = 0; k < 4; ++k) device.note_on(k + 1, chord[k], 1.0f);
      },
      [] { device.note_on(5, kC3, 0.8f); }, 0.0025, 0.05);
  std::printf("a string taken while loud: %.1f %% of its fade is there after 8 samples\n", 100.0 * sudden);
  EXPECT(sudden < 0.15, "a taken string fades out under the finger: under 15 % of the change in the first 8 samples");

  // Two more keys in the same instant, with all four strings in use: each
  // takes a string of the old chord, and neither takes the other's.
  four(0.8f);
  device.note_on(5, kC3, 0.8f);
  device.note_on(6, kE3, 0.8f);
  const std::vector<float> both = render(device, 0.6f, kRate).left;
  bare(kElectric);
  device.set_param(p::kSustain, 20.0f);
  device.set_param(p::kGrowl, 0.0f);
  device.note_on(5, kC3, 0.8f);
  device.note_on(6, kE3, 0.8f);
  const std::vector<float> pair = render(device, 0.6f, kRate).left;
  const double first = db(bin_level(both, kRate, kC3, from, n)) - db(bin_level(pair, kRate, kC3, from, n));
  const double second = db(bin_level(both, kRate, kE3, from, n)) - db(bin_level(pair, kRate, kE3, from, n));
  int left = 0;
  for (int k = 0; k < 4; ++k) {
    if (db(bin_level(both, kRate, chord[k], from, n)) > db(bin_level(kept, kRate, chord[k], from, n)) - 6.0 || k == 2) {
      if (db(bin_level(both, kRate, chord[k], from, n)) > -45.0) ++left;
    }
  }
  std::printf("two keys at once into four held strings: the new notes are %+.2f and %+.2f dB against the pair alone; %d of the old four still ring\n",
              first, second, left);
  EXPECT(std::fabs(first) < 0.5 && std::fabs(second) < 0.5, "two keys in one instant both sound whole: a string just taken is not taken again");
  EXPECT(left == 2, "and two of the old four ring on");

  // A fifth key struck twice in the same instant is still one string.
  four(0.8f);
  device.note_on(5, kC3, 0.8f);
  device.note_on(5, kC3, 0.8f);
  const std::vector<float> doubled = render(device, 0.6f, kRate).left;
  left = 0;
  for (int k = 0; k < 4; ++k) {
    if (db(bin_level(doubled, kRate, chord[k], from, n)) > db(bin_level(kept, kRate, chord[k], from, n)) - 6.0 || k == 2) {
      if (db(bin_level(doubled, kRate, chord[k], from, n)) > -45.0) ++left;
    }
  }
  const double one = db(bin_level(doubled, kRate, kC3, from, n)) - db(bin_level(alone, kRate, kC3, from, n));
  std::printf("a fifth key struck twice in one instant: %d of the old four still ring, and the note is %+.2f dB against one pluck alone\n", left, one);
  EXPECT(left == 3 && std::fabs(one) < 0.5, "a key struck twice before its pluck has sounded takes one string, not two");
}

// A key struck again plucks its own string again; the same pitch from
// another key is the same string; nothing is doubled and nothing is left on.
static void test_restrike() {
  const auto fresh = [] {
    bare(kElectric);
    device.set_param(p::kSustain, 20.0f);
    device.set_param(p::kGrowl, 0.0f);
  };
  fresh();
  device.note_on(1, kA1, 0.8f);
  const std::vector<float> once = render(device, 0.5f, kRate).left;

  // The same key twice, one key-up: the string is plucked again, as loud as a
  // first pluck (two strings would be 6 dB over), and one key-up stops it.
  fresh();
  device.note_on(1, kA1, 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(1, kA1, 0.8f);
  const std::vector<float> twice = render(device, 0.5f, kRate).left;
  device.note_off(1);
  std::vector<float> after = render(device, 3.0f, kRate).left;
  const double again = db(bin_level(twice, kRate, kA1, at(0.05), at(0.4))) - db(bin_level(once, kRate, kA1, at(0.05), at(0.4)));
  std::printf("a key struck again: the second pluck is %+.2f dB against a first, %.2f cents off; after one key-up the last 0.2 s peak at %.1e\n",
              again, cents(fine_pitch(twice, kRate, kA1, at(0.06), twice.size()), kA1), peak(after, after.size() - at(0.2), after.size()));
  EXPECT(std::fabs(again) < 1.0, "a key struck again is one string plucked again, not two");
  EXPECT(peak(after, after.size() - at(0.2), after.size()) == 0.0, "and one key-up stops it, even with Sustain at its longest");

  // The same pitch from another key lands on the same string.
  fresh();
  device.note_on(1, kA1, 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(2, kA1, 0.8f);
  const std::vector<float> other = render(device, 0.5f, kRate).left;
  const double same = db(bin_level(other, kRate, kA1, at(0.05), at(0.4))) - db(bin_level(once, kRate, kA1, at(0.05), at(0.4)));
  device.note_off(1);  // the first key no longer holds anything
  const std::vector<float> held = render(device, 0.5f, kRate).left;
  device.note_off(2);
  after = render(device, 3.0f, kRate).left;
  std::printf("the same pitch from a second key: %+.2f dB against one pluck; the first key's key-up leaves it at %.1f dBFS, the second's at %.1e\n",
              same, db(peak(held, at(0.3), held.size())), peak(after, after.size() - at(0.2), after.size()));
  EXPECT(std::fabs(same) < 1.0, "the same pitch from another key plucks the string that already rings");
  EXPECT(peak(held, at(0.3), held.size()) > 0.01, "the string now belongs to the second key: the first key's key-up does not stop it");
  EXPECT(peak(after, after.size() - at(0.2), after.size()) == 0.0, "and the second's does");

  // The finger lands on the ringing string before it plucks: a 6 ms fade.
  const double sudden = suddenness(
      [] {
        bare(kElectric);
        device.set_param(p::kSustain, 20.0f);
        device.set_param(p::kTouch, 0.9f);
        device.note_on(1, kA1, 1.0f);
      },
      [] { device.note_on(1, kA1, 1.0f); }, 0.005, 0.05);
  std::printf("a ringing string struck again: %.1f %% of its fade is there after 8 samples\n", 100.0 * sudden);
  EXPECT(sudden < 0.1, "the ringing string fades under the finger before the new pluck: under 10 % in the first 8 samples");

  // Keys struck twice, struck and let go, and struck again inside one block,
  // with every string in use: when every key is up, nothing rings.
  for (int type = 0; type < StringBass::kNumTypes; ++type) {
    bare(type);
    device.set_param(p::kSustain, 20.0f);
    const float chord[4] = {kE1, kA1, kD2, kG2};
    for (int k = 0; k < 4; ++k) device.note_on(k + 1, chord[k], 0.8f);
    render(device, 0.2f, kRate);
    device.note_on(5, kC3, 0.8f);
    device.note_on(5, kC3, 0.8f);
    device.note_on(6, kE3, 0.8f);
    device.note_off(6);
    device.note_on(6, kE3, 0.8f);
    device.note_on(7, kA1, 0.5f);
    render(device, 0.2f, kRate);
    device.note_on(5, kC3, 0.8f);
    render(device, 0.001f, kRate);
    device.note_on(5, kC3, 0.8f);
    for (int id = 1; id <= 7; ++id) device.note_off(id);
    const std::vector<float> rest = render(device, 3.0f, kRate).left;
    std::printf("keys struck twice and let go once (%s): %.1e at the output three seconds after the last key-up\n",
                kTypeNames[type], peak(rest, rest.size() - at(0.2), rest.size()));
    EXPECT(peak(rest, rest.size() - at(0.2), rest.size()) == 0.0, "no string is left ringing when every key is up");
  }
}

// Levels: where the mixer expects one note, ten keys under the knee, both
// outputs the same, nothing at DC.
static void test_levels() {
  for (int type = 0; type < StringBass::kNumTypes; ++type) {
    double lowest = 1.0e9, highest = -1.0e9;
    for (float hz : {kA0, kE1, kA1, kA2, kA3, kC4}) {
      bare(type);
      const double top = db(peak(note(hz, 0.7f, 1.0f)));
      lowest = std::min(lowest, top);
      highest = std::max(highest, top);
    }
    bare(type);
    const Stereo loud = [] {
      device.note_on(1, kA1, 1.0f);
      return render(device, 1.0f, kRate);
    }();
    bare(type);
    const std::vector<float> soft = note(kA1, 0.2f, 1.0f);
    double differ = 0.0;
    for (size_t i = 0; i < loud.left.size(); ++i) differ = std::max(differ, static_cast<double>(std::fabs(loud.left[i] - loud.right[i])));

    // Ten keys at once, and the worst four there are: the same low note
    // on every string in the same instant (four different keys a quarter
    // tone apart are four strings).
    bare(type);
    for (int k = 0; k < 10; ++k) device.note_on(k, kE1 * std::pow(2.0f, static_cast<float>(k) * 4.0f / 12.0f), 0.8f);
    const double ten = peak(render(device, 2.0f, kRate).left);
    // (As shipped, with each pluck a little different from the last: the
    // worst of a dozen such chords.)
    double stacked = 0.0;
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    for (int chord = 0; chord < 12; ++chord) {
      for (int k = 0; k < 4; ++k) device.note_on(k, kA1 * std::pow(1.04f, static_cast<float>(k)), 0.8f);
      stacked = std::max(stacked, peak(render(device, 0.5f, kRate).left));
      for (int k = 0; k < 4; ++k) device.note_off(k);
      render(device, 1.0f, kRate);
    }

    // DC: the mean of four seconds of a low note against its level.
    bare(type);
    device.set_param(p::kSustain, 20.0f);
    const std::vector<float> ring = note(kE1, 0.8f, 4.0f);
    const double dc = std::fabs(mean(ring, at(1.0), ring.size()));
    bare(type);
    const double body = db(rms(note(kA1, 0.7f, 0.5f), at(0.03), at(0.4)));

    std::printf("levels %s: gain 0.7 peaks %.1f to %.1f dBFS from A0 to C4; gain 0.2 %.1f, gain 1 %.1f dBFS at A1; the body of A1 (30 to 400 ms) at %.1f dBFS; ten keys peak at %.3f, four strings a quarter tone apart at %.3f; left and right differ by %.1e; DC %.1e against rms %.3f\n",
                kTypeNames[type], lowest, highest, db(peak(soft)), db(peak(loud.left)), body, ten, stacked, differ, dc,
                rms(ring, at(1.0), ring.size()));
    EXPECT(lowest > -24.0 && highest < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS on every key from A0 to C4");
    EXPECT(peak(loud.left) > 2.0 * peak(soft), "velocity is loudness: gain 1 is 6 dB or more over gain 0.2");
    EXPECT(ten < 0.5 && stacked < 0.5, "ten held keys, and four strings plucked together, stay under the clip knee");
    EXPECT(differ == 0.0, "both outputs carry the same signal");
    EXPECT(dc < 1.0e-4, "nothing at DC");
  }
  // The soft clip is the last thing in the chain: nothing passes full scale.
  bare(kUpright);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kResonance, 1.0f);
  device.set_param(p::kTouch, 1.0f);
  device.set_param(p::kGrowl, 1.0f);
  device.set_param(p::kTone, 1.0f);
  for (int k = 0; k < 4; ++k) device.note_on(k, 60.0f * std::pow(1.04f, static_cast<float>(k)), 1.0f);
  const double most = peak(render(device, 1.0f, kRate).left);
  std::printf("everything up, four strings at full velocity: peaks at %.3f\n", most);
  EXPECT(most > 0.5 && most <= 1.0, "the loudest thing it can do is in the soft clip and under full scale");
}

// The same sound at 44.1, 48 and 96 kHz: what is made of single samples
// (the pick's noise, the taps of the growl, the thump) is scaled by the rate.
static void test_rates() {
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  double level[3], click[3], rattle[3], wood[3], bloom[3];
  for (int r = 0; r < 3; ++r) {
    const float rate = rates[r];
    bare(kElectric, rate);
    const std::vector<float> plain = note(kA1, 0.7f, 0.5f, rate);
    level[r] = db(rms(plain, at(0.03, rate), at(0.4, rate)));
    // The pick's noise, over eight neighbouring keys (each its own noise).
    double sum = 0.0;
    for (int k = 0; k < 8; ++k) {
      bare(kElectric, rate);
      device.set_param(p::kTouch, 1.0f);
      device.set_param(p::kTone, 1.0f);
      device.set_param(p::kGrowl, 0.0f);
      const std::vector<float> picked = note(kA1 * std::pow(2.0f, static_cast<float>(k) / 12.0f), 0.8f, 0.1f, rate);
      const double in_band = rms(band(picked, 3000.0, 9000.0, rate), 0, at(0.02, rate));
      sum += in_band * in_band;
    }
    click[r] = 10.0 * std::log10(sum / 8.0);
    for (int type : {kElectric, kUpright}) {
      bare(type, rate);
      device.set_param(p::kGrowl, 0.0f);
      const std::vector<float> clean = note(kA1, 1.0f, 0.3f, rate);
      bare(type, rate);
      device.set_param(p::kGrowl, 1.0f);
      (type == kElectric ? rattle[r] : wood[r]) = db(rms(minus(note(kA1, 1.0f, 0.3f, rate), clean), 0, at(0.1, rate)));
    }
    bare(kFretless, rate);
    device.set_param(p::kGrowl, 1.0f);
    bloom[r] = band_db(note(kA1, 0.7f, 0.4f, rate), 600.0, 2500.0, 0.1, 0.3, rate);
  }
  for (int r = 0; r < 3; r += 2) {
    std::printf("at %.1f kHz against 48 kHz: the note %+.2f dB, the pick's noise %+.2f dB, the electric's rattle %+.2f dB, the upright's %+.2f dB, the fretless bloom %+.2f dB\n",
                rates[r] / 1000.0f, level[r] - level[1], click[r] - click[1], rattle[r] - rattle[1], wood[r] - wood[1],
                bloom[r] - bloom[1]);
    EXPECT(std::fabs(level[r] - level[1]) < 0.5, "a note is as loud at any sample rate");
    EXPECT(std::fabs(click[r] - click[1]) < 2.0, "the pick's noise is as loud at any sample rate, within 2 dB");
    EXPECT(std::fabs(rattle[r] - rattle[1]) < 1.5 && std::fabs(wood[r] - wood[1]) < 1.5, "the rattle is as loud at any sample rate, within 1.5 dB");
    EXPECT(std::fabs(bloom[r] - bloom[1]) < 1.5, "the bloom is as loud at any sample rate, within 1.5 dB");
  }
}

// The audio must not depend on the host's block size, whatever the length of
// a silence and whatever was moved in it.
static void test_block_size() {
  // A phrase with a silence of `gap` seconds, rendered in blocks that cycle
  // through `blocks`. Everything in it happens at fixed samples.
  const auto phrase = [](double gap, const std::vector<int>& blocks) {
    std::vector<float> out;
    size_t turn = 0;
    const auto run_for = [&](double seconds) {
      size_t left = at(seconds);
      while (left > 0) {
        const int frames = static_cast<int>(std::min(left, static_cast<size_t>(blocks[turn++ % blocks.size()])));
        device.process(frames);
        out.insert(out.end(), device.out_left(), device.out_left() + frames);
        left -= static_cast<size_t>(frames);
      }
    };
    device.init(kRate);  // as shipped: every pluck a little different
    device.set_param(p::kRelease, 0.05f);
    device.note_on(1, kA1, 0.8f);
    run_for(0.1);
    device.note_on(2, kE3, 0.6f);
    device.set_param(p::kTone, 0.8f);
    run_for(0.1);
    device.note_off(1);
    device.note_off(2);
    run_for(0.5 * gap);
    device.set_param(p::kType, 2.0f);
    device.set_param(p::kTone, 0.3f);
    device.set_param(p::kMute, 0.2f);
    device.set_param(p::kSustain, 9.0f);
    device.set_param(p::kGrowl, 0.9f);
    device.set_param(p::kResonance, 0.9f);
    device.set_param(p::kVolume, -2.0f);
    run_for(0.5 * gap);
    device.note_on(3, kD2, 0.9f);
    run_for(0.12);
    device.set_param(p::kType, 1.0f);
    device.note_on(4, kA1, 0.7f);
    device.note_on(3, kD2, 1.0f);
    run_for(0.15);
    device.note_off(3);
    device.note_off(4);
    run_for(0.1);
    return out;
  };
  const std::vector<int> ragged = {1, 7, 128, 33, 2048, 5, 512, 64};
  double worst = 0.0, worst_gap = 0.0;
  // The strings are let go 0.1 s after key up and the instrument sleeps some
  // 0.7 s later, once the DC blocker has settled: the silences step through
  // all of that, 20 ms at a time, so that a note lands in every state.
  for (int step = 0; step <= 50; ++step) {
    const double gap = step == 50 ? 2.5 : 0.04 + 0.02 * step;
    const std::vector<float> reference = phrase(gap, {128});
    for (const std::vector<int>& blocks : {std::vector<int>{1}, std::vector<int>{2048}, ragged}) {
      const double differ = peak(minus(phrase(gap, blocks), reference));
      if (differ > worst) worst = differ, worst_gap = gap;
    }
  }
  std::printf("block sizes 1, 128, 2048 and ragged over silences of 0.04 to 1.04 s and 2.5 s: they differ by %.1e at most (silence of %.2f s)\n",
              worst, worst_gap);
  EXPECT(worst < 1.0e-6, "the audio does not depend on the block size, whatever the silence between notes");

  // Two inits, the same render.
  const std::vector<float> once = phrase(0.3, {128});
  const std::vector<float> again = phrase(0.3, {128});
  EXPECT(peak(minus(once, again)) == 0.0, "init resets everything: the same phrase twice is the same samples");
}

// A knob moved while nothing sounds has arrived by the next note.
static void test_settings() {
  const auto move = [] {
    device.set_param(p::kType, 2.0f);
    device.set_param(p::kTouch, 0.8f);
    device.set_param(p::kPosition, 0.12f);
    device.set_param(p::kTone, 0.9f);
    device.set_param(p::kMute, 0.3f);
    device.set_param(p::kSustain, 12.0f);
    device.set_param(p::kGrowl, 1.0f);
    device.set_param(p::kResonance, 1.0f);
    device.set_param(p::kVolume, 0.0f);
  };
  // `wait` seconds of silence after a first note; the knobs move either 13
  // samples before the next note (off the control clock's beat) or at
  // `early` seconds into the silence (or before anything, when negative).
  const auto next_note = [&move](double wait, double early) {
    device.init(kRate);
    device.set_param(p::kRelease, 0.03f);
    if (early < 0.0) move();
    device.note_on(1, kE1, 0.8f);
    render(device, 0.2f, kRate);
    device.note_off(1);
    const size_t total = at(wait);
    const size_t when = early < 0.0 ? total : (early > 0.0 ? at(early) : total - 13);
    for (size_t i = 0; i < total;) {
      if (i == when && early >= 0.0) move();
      const size_t stop = i < when ? when : total;
      const int frames = static_cast<int>(std::min(static_cast<size_t>(128), stop - i));
      device.process(frames);
      i += static_cast<size_t>(frames);
    }
    device.note_on(2, kA1, 0.9f);
    return render(device, 0.4f, kRate).left;
  };
  // Asleep: against the same note with the knobs there from the start.
  const double asleep = peak(minus(next_note(3.0, 0.0), next_note(3.0, -1.0)));
  // Awake, but with every string let go (the DC blocker is still settling):
  // against the knobs moved at the start of that silence.
  const double awake = peak(minus(next_note(0.3, 0.0), next_note(0.3, 0.15)));
  // And what a glide would have cost: the same note with the knobs not moved.
  device.init(kRate);
  device.set_param(p::kRelease, 0.03f);
  device.note_on(1, kE1, 0.8f);
  render(device, 0.2f, kRate);
  device.note_off(1);
  render(device, 3.0f, kRate);
  device.note_on(2, kA1, 0.9f);
  const double unmoved = peak(minus(render(device, 0.4f, kRate).left, next_note(3.0, -1.0)));
  std::printf("nine knobs moved 13 samples before a note: asleep it differs by %.1e from the knobs set at the start, awake and silent by %.1e (not moved at all: %.1e)\n",
              asleep, awake, unmoved);
  EXPECT(asleep < 1.0e-6, "a knob moved while the instrument sleeps has arrived by the next note");
  EXPECT(awake < 1.0e-6, "and so has one moved while it is awake with no string sounding");
  EXPECT(unmoved > 1.0e-2, "(the knobs moved are ones that matter)");
}

// Knobs thrown from end to end under a ringing chord: smoothed, no steps.
static void test_knob_clicks() {
  struct Throw {
    const char* name;
    int id;
    float from, to;
    int type;
  };
  const Throw throws[] = {
      {"Tone down", p::kTone, 1.0f, 0.0f, kElectric},       {"Tone up", p::kTone, 0.0f, 1.0f, kElectric},
      {"Volume down", p::kVolume, 6.0f, -48.0f, kElectric}, {"Volume up", p::kVolume, -48.0f, 6.0f, kElectric},
      {"Mute on", p::kMute, 0.0f, 1.0f, kElectric},         {"Mute off", p::kMute, 1.0f, 0.0f, kElectric},
      {"Sustain down", p::kSustain, 20.0f, 0.5f, kElectric}, {"Sustain up", p::kSustain, 0.5f, 20.0f, kElectric},
      {"Resonance up", p::kResonance, 0.0f, 1.0f, kElectric}, {"Resonance down", p::kResonance, 1.0f, 0.0f, kElectric},
      {"Body up", p::kResonance, 0.0f, 1.0f, kUpright},     {"Body down", p::kResonance, 1.0f, 0.0f, kUpright},
      {"Growl up", p::kGrowl, 0.0f, 1.0f, kFretless},       {"Growl down", p::kGrowl, 1.0f, 0.0f, kFretless},
      {"Rattle up", p::kGrowl, 0.0f, 1.0f, kElectric},      {"Rattle down", p::kGrowl, 1.0f, 0.0f, kElectric},
  };
  for (const Throw& t : throws) {
    const double sudden = suddenness(
        [&t] {
          bare(t.type);
          device.set_param(p::kTouch, 0.9f);
          device.set_param(p::kSustain, 20.0f);
          device.set_param(t.id, t.from);
          device.note_on(1, kE1, 1.0f);
          device.note_on(2, kA1, 1.0f);
          device.note_on(3, kE3, 1.0f);
        },
        [&t] { device.set_param(t.id, t.to); }, 0.05, 0.06);
    std::printf("%s thrown end to end under a chord: %.2f %% of the change is there after 8 samples\n", t.name, 100.0 * sudden);
    char label[120];
    std::snprintf(label, sizeof label, "%s does not click: under 5 %% of the change in the first 8 samples", t.name);
    EXPECT(sudden < 0.05, label);
  }
  // Tone swept slowly through its range under a bright chord: no step
  // larger than the chord has anyway with Tone open.
  const auto chord = [] {
    bare(kElectric);
    device.set_param(p::kTouch, 0.9f);
    device.set_param(p::kTone, 1.0f);
    device.set_param(p::kSustain, 20.0f);
    device.note_on(1, kE1, 1.0f);
    device.note_on(2, kA1, 1.0f);
    device.note_on(3, kE3, 1.0f);
    render(device, 0.1f, kRate);
  };
  chord();
  const std::vector<float> open = render(device, 1.0f, kRate).left;
  chord();
  std::vector<float> swept;
  for (int k = 0; k < 375; ++k) {
    const float phase = static_cast<float>(k) / 375.0f;
    device.set_param(p::kTone, 0.5f + 0.5f * std::cos(4.0f * static_cast<float>(kPi) * phase));
    device.process(128);
    swept.insert(swept.end(), device.out_left(), device.out_left() + 128);
  }
  std::printf("Tone swept down and up twice in a second: the largest step is %.4f against %.4f with Tone left open\n",
              max_step(swept), max_step(open));
  EXPECT(max_step(swept) <= 1.05 * max_step(open), "Tone can be swept under a chord without zipper steps");

  // What is read at the pluck leaves a ringing string alone.
  const auto ringing = [](int id, float to) {
    bare(kElectric);
    device.note_on(1, kA1, 0.9f);
    render(device, 0.1f, kRate);
    if (id >= 0) device.set_param(id, to);
    return render(device, 0.2f, kRate).left;
  };
  const std::vector<float> untouched = ringing(-1, 0.0f);
  const double latched = std::max(std::max(peak(minus(ringing(p::kType, 2.0f), untouched)), peak(minus(ringing(p::kTouch, 1.0f), untouched))),
                                  std::max(peak(minus(ringing(p::kPosition, 0.5f), untouched)), peak(minus(ringing(p::kRelease, 3.0f), untouched))));
  std::printf("Type, Touch, Position and Release moved under a ringing string change it by %.1e\n", latched);
  EXPECT(latched == 0.0, "Type, Touch and Position wait for the next pluck, Release for the next key-up");
}

// The sixteen patches in the manifest.
static void test_presets() {
  const std::vector<Preset> presets = load_presets();
  std::printf("presets: %zu in the manifest\n", presets.size());
  EXPECT(presets.size() == 16, "the manifest has exactly sixteen presets");
  if (presets.empty()) return;

  bool first_is_default = true;
  for (const auto& value : presets[0].values) {
    first_is_default = first_is_default && value.first >= 0 && value.second == p::kParamDefault[value.first];
  }
  EXPECT(first_is_default, "the first preset is the default patch");

  // What a preset sounds like, as numbers: a low note held for 0.8 s and let
  // go, and a higher one played hard, each as the level in five bands over
  // five stretches of time. Two presets are alike if all fifty are.
  const double edges[6] = {30.0, 120.0, 400.0, 1200.0, 3500.0, 12000.0};
  const double times[6] = {0.0, 0.03, 0.2, 0.8, 1.0, 1.8};
  const size_t features = 50;
  std::vector<std::vector<double>> shape(presets.size());
  std::vector<double> loudest(presets.size());
  int gentle = 0;
  for (size_t n = 0; n < presets.size(); ++n) {
    const Preset& preset = presets[n];
    bool known = true;
    const auto load = [&] {
      device.init(kRate);
      device.set_variation(0.0f);
      for (const auto& value : preset.values) {
        known = known && value.first >= 0;
        if (value.first >= 0) device.set_param(value.first, value.second);
      }
    };
    for (int pass = 0; pass < 2; ++pass) {
      load();
      device.note_on(1, pass == 0 ? kA1 : kE3, pass == 0 ? 0.7f : 1.0f);
      std::vector<float> out = render(device, 0.8f, kRate).left;
      device.note_off(1);
      const std::vector<float> tail = render(device, 1.0f, kRate).left;
      out.insert(out.end(), tail.begin(), tail.end());
      for (int b = 0; b < 5; ++b) {
        const std::vector<float> in_band = band(out, edges[b], edges[b + 1]);
        for (int w = 0; w < 5; ++w) shape[n].push_back(std::max(-90.0, db(rms(in_band, at(times[w]), at(times[w + 1])))));
      }
    }
    // Soft, long, dark or slow, by measurement on a held A1.
    load();
    device.note_on(1, kA1, 0.7f);
    const std::vector<float> held = render(device, 4.2f, kRate).left;
    load();
    device.note_on(1, kA1, 0.7f);
    const std::vector<float> short_note = render(device, 0.5f, kRate).left;
    device.note_off(1);
    const std::vector<float> let_go = render(device, 0.6f, kRate).left;
    size_t peak_at = 1;
    while (peak_at + 1 < held.size() && std::fabs(held[peak_at + 1]) >= std::fabs(held[peak_at])) ++peak_at;
    const double speak_ms = 1000.0 * static_cast<double>(peak_at) / kRate;
    const double dark = brightness(held, 1000.0, 12000.0, 0.0, 0.2);
    const double fall = db(rms(held, at(0.05), at(0.25))) - db(rms(held, at(4.0), at(4.2)));
    const double before = db(rms(short_note, at(0.4), at(0.5)));
    const double hangs = before > -70.0 ? db(rms(let_go, at(0.45), at(0.55))) - before : -200.0;
    const double bloom = brightness(held, 600.0, 2500.0, 0.135, 0.165) - brightness(held, 600.0, 2500.0, 0.005, 0.035);
    const double top_of_note = db(peak(held, 0, at(1.0)));
    double window = 0.0;
    for (size_t from = 0; from + at(0.4) <= at(1.0); from += at(0.05)) window = std::max(window, rms(held, from, from + at(0.4)));
    loudest[n] = db(window);
    std::string kinds;
    if (speak_ms >= 1.0) kinds += " soft";
    if (fall < 20.0) kinds += " long";
    if (hangs > -25.0) kinds += " slow-to-stop";
    if (dark < -30.0) kinds += " dark";
    if (bloom > 3.0) kinds += " slow-to-open";
    if (!kinds.empty()) ++gentle;
    std::printf("preset \"%s\": A1 at gain 0.7 peaks %.1f dBFS, its loudest 400 ms at %.1f; speaks in %.2f ms; above 1 kHz %.1f dB under the note; falls %.1f dB in 4 s; half a second after key-up %.1f dB; bloom %+.1f dB;%s\n",
                preset.name.c_str(), top_of_note, loudest[n], speak_ms, -dark, fall, hangs, bloom,
                kinds.empty() ? " -" : kinds.c_str());
    char label[200];
    std::snprintf(label, sizeof label, "preset \"%s\" names parameters the device has", preset.name.c_str());
    EXPECT(known, label);
    std::snprintf(label, sizeof label, "preset \"%s\" has a name of at most 20 characters with no space at either end and no digit at the end", preset.name.c_str());
    EXPECT(!preset.name.empty() && preset.name.size() <= 20 && preset.name.front() != ' ' && preset.name.back() != ' ' &&
               !(preset.name.back() >= '0' && preset.name.back() <= '9'),
           label);
    std::snprintf(label, sizeof label, "preset \"%s\": one note at gain 0.7 peaks between -24 and -10 dBFS", preset.name.c_str());
    EXPECT(top_of_note > -24.0 && top_of_note < -10.0, label);
  }
  // Every pair: the mean difference over the fifty figures, in dB.
  double closest = 1.0e9;
  size_t closest_a = 0, closest_b = 0;
  for (size_t a = 0; a < presets.size(); ++a) {
    for (size_t b = a + 1; b < presets.size(); ++b) {
      std::string lower_a = presets[a].name, lower_b = presets[b].name;
      for (char& c : lower_a) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
      for (char& c : lower_b) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
      EXPECT(lower_a != lower_b, "no two presets share a name, whatever the case");
      double sum = 0.0;
      for (size_t f = 0; f < features; ++f) sum += std::fabs(shape[a][f] - shape[b][f]);
      const double apart = sum / static_cast<double>(features);
      if (apart < closest) closest = apart, closest_a = a, closest_b = b;
    }
  }
  std::printf("the two presets most alike are \"%s\" and \"%s\": %.1f dB apart on average over 50 band levels\n",
              presets[closest_a].name.c_str(), presets[closest_b].name.c_str(), closest);
  EXPECT(closest > 2.0, "no two presets render alike: every pair is 2 dB or more apart on average");
  // Each preset alone on a bass line: eight seconds from A1 up to A2 and
  // back, two notes a second, gains from 0.6 to 1, as shipped (every pluck
  // a little different). Its loudest 400 ms, its peak and its DC.
  std::vector<double> line_level(presets.size());
  {
    const int steps[16] = {0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, 0, 12, 7, 5, 0};
    double worst_peak = 0.0, worst_dc = 0.0;
    for (size_t n = 0; n < presets.size(); ++n) {
      device.init(kRate);
      for (const auto& value : presets[n].values) {
        if (value.first >= 0) device.set_param(value.first, value.second);
      }
      std::vector<float> line;
      for (int k = 0; k < 16; ++k) {
        device.note_on(k, kA1 * std::pow(2.0f, static_cast<float>(steps[k]) / 12.0f), 0.6f + 0.4f * static_cast<float>((k * 5) % 8) / 7.0f);
        std::vector<float> part = render(device, 0.4f, kRate).left;
        line.insert(line.end(), part.begin(), part.end());
        device.note_off(k);
        part = render(device, 0.1f, kRate).left;
        line.insert(line.end(), part.begin(), part.end());
      }
      double loudest_window = 0.0;
      for (size_t from = 0; from + at(0.4) <= line.size(); from += at(0.05)) {
        loudest_window = std::max(loudest_window, rms(line, from, from + at(0.4)));
      }
      line_level[n] = db(loudest_window);
      const double dc = std::fabs(mean(line));
      worst_peak = std::max(worst_peak, peak(line));
      worst_dc = std::max(worst_dc, dc);
      std::printf("preset \"%s\" on a bass line: its loudest 400 ms at %.1f dBFS, peak %.1f dBFS, DC %.1e\n",
                  presets[n].name.c_str(), line_level[n], db(peak(line)), dc);
    }
    std::vector<double> ordered = line_level;
    std::sort(ordered.begin(), ordered.end());
    const double centre = 0.5 * (ordered[(ordered.size() - 1) / 2] + ordered[ordered.size() / 2]);
    std::printf("on the bass line the presets' loudest 400 ms run from %.1f to %.1f dBFS, the middle one at %.1f (%.1f under it, %.1f over); the highest peak is %.1f dBFS, the most DC %.1e\n",
                ordered.front(), ordered.back(), centre, centre - ordered.front(), ordered.back() - centre, db(worst_peak), worst_dc);
    EXPECT(ordered.front() > -50.0, "every preset's loudest 400 ms of a bass line is over -50 dBFS");
    EXPECT(centre - ordered.front() < 6.0 && ordered.back() - centre < 6.0, "and within 6 dB of the middle preset's");
    EXPECT(db(worst_peak) <= -3.0, "no preset peaks over -3 dBFS on a bass line");
    EXPECT(worst_dc < 0.01, "no preset puts out DC");
  }

  // Stepping through them must not jump in level: the loudest 400 ms of
  // the same held note on each, against the middle one of the sixteen.
  std::vector<double> sorted = loudest;
  std::sort(sorted.begin(), sorted.end());
  const double middle = 0.5 * (sorted[(sorted.size() - 1) / 2] + sorted[sorted.size() / 2]);
  std::printf("A1 at gain 0.7 held a second: the presets' loudest 400 ms run from %.1f to %.1f dBFS, the middle one at %.1f (%.1f under it, %.1f over)\n",
              sorted.front(), sorted.back(), middle, middle - sorted.front(), sorted.back() - middle);
  EXPECT(middle - sorted.front() < 6.0 && sorted.back() - middle < 6.0, "on one held note every preset's loudest 400 ms is within 6 dB of the middle preset's");
  // Each preset's nearest neighbour, for whoever tunes them.
  for (size_t a = 0; a < presets.size(); ++a) {
    double nearest = 1.0e9;
    size_t who = a;
    for (size_t b = 0; b < presets.size(); ++b) {
      if (b == a) continue;
      double sum = 0.0;
      for (size_t f = 0; f < features; ++f) sum += std::fabs(shape[a][f] - shape[b][f]);
      if (sum / static_cast<double>(features) < nearest) nearest = sum / static_cast<double>(features), who = b;
    }
    std::printf("  \"%s\" is nearest \"%s\": %.1f dB\n", presets[a].name.c_str(), presets[who].name.c_str(), nearest);
  }
  std::printf("%d of the presets are soft, long, dark or slow\n", gentle);
  EXPECT(gentle >= 5, "at least five presets are soft, long, dark or slow");
}

// Eight keys held (four strings sounding, as many as there are), as the
// WASM smoke does.
static void test_cost() {
  device.init(kRate);
  device.set_param(p::kSustain, 20.0f);
  device.set_param(p::kGrowl, 1.0f);
  for (int k = 0; k < 8; ++k) device.note_on(k, kE1 * std::pow(2.0f, static_cast<float>(k) * 3.0f / 12.0f), 0.8f);
  report_cost("string-bass (8 keys held, 4 strings)", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
}

int main() {
  test_conformance();
  test_pitch();
  test_sustain();
  test_mute();
  test_position();
  test_touch_and_tone();
  test_fretless();
  test_growl();
  test_upright();
  test_release();
  test_stealing();
  test_restrike();
  test_levels();
  test_rates();
  test_block_size();
  test_settings();
  test_knob_clicks();
  test_presets();
  test_cost();
  return finish("string-bass");
}
