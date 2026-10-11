// Native harness for Bowls (cpp/devices/bowls). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a table of singing bowls.

#include <cstdlib>
#include <utility>

#include "../devices/bowls/bowls.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Bowls;
namespace p = livemix::bowls;

static Bowls device;

static const float kRate = 48000.0f;

// BOWLS_SAY=1 prints every line that was measured, not only the failures.
static const bool kSay = std::getenv("BOWLS_SAY") != nullptr;
#define TOLD(condition, message)                 \
  do {                                           \
    if (kSay) std::printf("  %s\n", message);    \
    EXPECT(condition, message);                  \
  } while (0)

static double hz_of(int note) { return 440.0 * std::pow(2.0, (note - 69) / 12.0); }

// The bowls alone, on a fresh table.
static void fresh(Bowls& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
}

// RMS over both sides.
static double both(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  const double l = rms(s.left, from, to), r = rms(s.right, from, to);
  return std::sqrt(0.5 * (l * l + r * r));
}

static double peak_of(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// Sines on `notes`, together peaking at `level`.
static std::vector<float> chord(const std::vector<int>& notes, float seconds, float rate, float level) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t i = 0; i < out.size(); ++i) {
    double v = 0.0;
    for (int note : notes) v += std::sin(2.0 * kPi * hz_of(note) * static_cast<double>(i) / rate);
    out[i] = static_cast<float>(v);
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * level / top);
  return out;
}

// A sine that comes in over a tenth of a second: a held note with no attack.
static std::vector<float> swell(float hz, float seconds, float rate, float gain) {
  std::vector<float> out = sine(hz, seconds, rate, gain);
  const size_t rise = static_cast<size_t>(0.1f * rate);
  for (size_t i = 0; i < rise && i < out.size(); ++i) {
    out[i] *= static_cast<float>(0.5 - 0.5 * std::cos(kPi * static_cast<double>(i) / rise));
  }
  return out;
}

static std::vector<float> then_silence(std::vector<float> x, float seconds, float rate) {
  x.resize(x.size() + static_cast<size_t>(seconds * rate), 0.0f);
  return x;
}

// A played note: `harmonics` partials falling by k^-1.5, an attack and a
// release in seconds, and (with `decay`) dying away as a plucked string does.
static std::vector<float> played(double note, float seconds, float rate, float gain, float attack,
                                 float release = 0.0f, int harmonics = 1, double decay = 0.0) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  const double hz = hz_of(0) * std::pow(2.0, note / 12.0);
  double norm = 0.0;
  for (int k = 1; k <= harmonics; ++k) norm += 1.0 / std::pow(k, 1.5);
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double env = t < attack ? t / attack : 1.0;
    if (seconds - t < release) env *= (seconds - t) / release;
    if (decay > 0.0) env *= std::exp(-t / decay);
    double v = 0.0;
    for (int k = 1; k <= harmonics; ++k) v += std::sin(2.0 * kPi * hz * k * t) / std::pow(k, 1.5);
    out[i] = static_cast<float>(gain * env * v / norm);
  }
  return out;
}

static void add_to(std::vector<float>& to, const std::vector<float>& x, size_t at = 0) {
  if (to.size() < at + x.size()) to.resize(at + x.size(), 0.0f);
  for (size_t i = 0; i < x.size(); ++i) to[at + i] += x[i];
}

// The level of `out` against the dry path (the input `x` times `dry_gain`)
// in windows of 50 ms, half over half: the lowest and the highest, in dB.
// Windows where the input is all but silent are left out.
static void against_dry(const Stereo& out, const std::vector<float>& x, double dry_gain, size_t from, size_t to,
                        double* lowest, double* highest) {
  for (size_t at = from; at + 2400 <= to && at + 2400 <= x.size(); at += 1200) {
    const double dry = rms(x, at, at + 2400) * dry_gain;
    if (dry < 1.0e-4) continue;
    const double l = rms(out.left, at, at + 2400), r = rms(out.right, at, at + 2400);
    const double here = db(std::sqrt(0.5 * (l * l + r * r)) / dry);
    *lowest = std::min(*lowest, here);
    *highest = std::max(*highest, here);
  }
}

// The notes the table should hold, worked out here and not by the device: the
// first `count` notes of the scale (semitones above `root`, octave after
// octave from C1) at or above MIDI 36 + 36 x Register.
static std::vector<int> table(int root, const std::vector<int>& scale, int count, float reg) {
  std::vector<int> notes;
  for (int octave = 0; octave < 12 && static_cast<int>(notes.size()) < count; ++octave) {
    for (int interval : scale) {
      const int note = 24 + root + 12 * octave + interval;
      if (note >= 36.0f + 36.0f * reg - 0.5f && static_cast<int>(notes.size()) < count) {
        notes.push_back(note);
      }
    }
  }
  return notes;
}

static std::vector<int> standing(const Bowls& d) {
  std::vector<int> notes;
  for (int slot = 0; slot < Bowls::kMaxBowls; ++slot) {
    if (d.slot_note(slot) >= 0) notes.push_back(d.slot_note(slot));
  }
  std::sort(notes.begin(), notes.end());
  return notes;
}

static int slot_of(const Bowls& d, int note) {
  for (int slot = 0; slot < Bowls::kMaxBowls; ++slot) {
    if (d.slot_note(slot) == note) return slot;
  }
  return -1;
}

// The frequency of the strongest component within 0.6 % of `hz`, and its level.
static double peak_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                        double* level) {
  double best_hz = hz, best = -1.0;
  for (int i = -12; i <= 12; ++i) {
    const double f = hz * (1.0 + 0.0005 * i);
    const double l = tone_level(x, f, rate, from, to);
    if (l > best) {
      best = l;
      best_hz = f;
    }
  }
  const double centre = best_hz;
  for (int i = -9; i <= 9; ++i) {
    const double f = centre * (1.0 + 0.00005 * i);
    const double l = tone_level(x, f, rate, from, to);
    if (l > best) {
      best = l;
      best_hz = f;
    }
  }
  if (level) *level = best;
  return best_hz;
}

// A plain radix-2 transform, in place (the size a power of two).
static void transform(std::vector<double>& re, std::vector<double>& im) {
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
  for (size_t len = 2; len <= n; len <<= 1) {
    const double wr = std::cos(-2.0 * kPi / static_cast<double>(len)), wi = std::sin(-2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      double xr = 1.0, xi = 0.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const size_t a = i + k, b = a + len / 2;
        const double vr = re[b] * xr - im[b] * xi, vi = re[b] * xi + im[b] * xr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        const double next = xr * wr - xi * wi;
        xi = xr * wi + xi * wr;
        xr = next;
      }
    }
  }
}

// What in a sound is not a bowl: the power, in dB against the whole, that
// lies further than 12 Hz from every partial of every bowl of `notes`, over
// 5.5 s from `from`. Whatever the soft clip makes of the bowls is there.
static double not_a_bowl(const std::vector<float>& x, size_t from, const std::vector<int>& notes, double rate) {
  const size_t n = size_t{1} << 18;
  std::vector<double> re(n), im(n, 0.0);
  for (size_t i = 0; i < n; ++i) {
    re[i] = x[from + i] * (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n)));
  }
  transform(re, im);
  std::vector<char> own(n / 2, 0);
  for (int note : notes) {
    for (double ratio : Bowls::kRatio) {
      const double hz = hz_of(note) * ratio;
      const long low = std::lround((hz - 12.0) * static_cast<double>(n) / rate);
      const long high = std::lround((hz + 12.0) * static_cast<double>(n) / rate);
      for (long b = low; b <= high; ++b) {
        if (b >= 0 && b < static_cast<long>(n / 2)) own[static_cast<size_t>(b)] = 1;
      }
    }
  }
  double in = 0.0, out = 0.0;
  for (size_t b = 1; b < n / 2; ++b) (own[b] ? in : out) += re[b] * re[b] + im[b] * im[b];
  return 10.0 * std::log10(std::max(out, 1e-30) / std::max(in + out, 1e-30));
}

static const std::vector<int> kMajorFive = {0, 2, 4, 7, 9};
static const std::vector<int> kMinor = {0, 2, 3, 5, 7, 8, 10};
static const std::vector<int> kFifths = {0, 2, 7};

int main() {
  char label[200];
  Conformance spec;
  spec.name = "bowls";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 26.0f;  // Ring 10 s: 60 dB in ten seconds, 140 dB in twenty-three
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  // The table: the notes the knobs ask for stand on it, and a bowl keeps its
  // slot (its place and its beat) while Register moves the set past it.
  {
    fresh(device);
    run(device, noise(0.05f, kRate, 0.1f));
    TOLD(standing(device) == std::vector<int>({55, 57, 60, 62, 64, 67, 69, 72}),
           "at the defaults: eight bowls of C major pentatonic from G3");
    TOLD(standing(device) == table(0, kMajorFive, 8, 0.5f), "the harness lays the table as the device does");
    const int a3 = slot_of(device, 57), c5 = slot_of(device, 72);
    device.set_param(p::kRegister, 0.58f);
    run(device, noise(0.5f, kRate, 0.1f));
    TOLD(standing(device) == table(0, kMajorFive, 8, 0.58f) && standing(device).front() == 57,
           "Register 0.58: the set starts on A3");
    TOLD(slot_of(device, 57) == a3 && slot_of(device, 72) == c5, "a bowl that stays keeps its slot");
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kScale, 3.0f);
    device.set_param(p::kBowls, 12.0f);
    device.set_param(p::kRegister, 0.0f);
    run(device, noise(0.5f, kRate, 0.1f));
    TOLD(standing(device) == table(9, kMinor, 12, 0.0f) && standing(device).front() == 36 &&
               standing(device).size() == 12,
           "A minor, twelve bowls from the bottom: C2 up");
    device.set_param(p::kScale, 4.0f);
    device.set_param(p::kRegister, 1.0f);
    run(device, noise(0.5f, kRate, 0.1f));
    TOLD(standing(device) == table(9, kFifths, 12, 1.0f) && standing(device).back() <= 119,
           "Fifths on A at the top: the highest set there is, G8 at the most");
  }

  // A bowl's partials: an impulse gives, for every Root and two Scales at
  // three sample rates, components at 1, 2.77 and 5.17 times the note of the
  // lowest, a middle and the highest bowl (within 0.15 % or 0.3 Hz).
  {
    const double ratios[3] = {1.0, 2.77, 5.17};
    int wrong = 0, missing = 0, checked = 0;
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (int root = 0; root < 12; ++root) {
        for (int which = 0; which < 2; ++which) {
          fresh(device, rate);
          device.set_param(p::kRoot, static_cast<float>(root));
          device.set_param(p::kScale, which == 0 ? 0.0f : 3.0f);
          device.set_param(p::kBeat, 0.0f);
          device.set_param(p::kMetal, 1.0f);
          device.set_param(p::kStrike, 1.0f);
          device.set_param(p::kSpread, 0.0f);
          Stereo out = run(device, impulse(0.8f, rate, 1.0f));
          const std::vector<int> notes = table(root, which == 0 ? kMajorFive : kMinor, 8, 0.5f);
          if (standing(device) != notes) ++wrong;
          const size_t from = static_cast<size_t>(0.05f * rate), to = static_cast<size_t>(0.75f * rate);
          for (int index : {0, 4, 7}) {
            for (int k = 0; k < 3; ++k) {
              const double hz = hz_of(notes[index]) * ratios[k];
              double level = 0.0;
              const double found = peak_near(out.left, hz, rate, from, to, &level);
              const double off = std::fabs(found - hz);
              worst = std::max(worst, off / hz);
              ++checked;
              if (off > std::max(0.0015 * hz, 0.3)) ++wrong;
              if (level < 1.0e-5) ++missing;
            }
          }
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "an impulse rings each bowl at 1, 2.77 and 5.17 times its note (%d checked, %d off, %d "
                  "missing, worst %.3f %%)",
                  checked, wrong, missing, 100.0 * worst);
    TOLD(wrong == 0 && missing == 0, label);
  }

  // Sympathy: a held sine on a bowl's note rings the table 20 dB or more over
  // a sine a semitone away, while it sounds and after it stops.
  double on_level = 0.0;
  {
    fresh(device);
    Stereo on = run(device, then_silence(swell(440.0f, 3.0f, kRate, 0.25f), 1.5f, kRate));
    fresh(device);
    Stereo off = run(device, then_silence(swell(466.164f, 3.0f, kRate, 0.25f), 1.5f, kRate));
    const size_t a = 96000, b = 144000, c = 153600, e = 216000;
    on_level = both(on, a, b);
    std::snprintf(label, sizeof label, "a note on a bowl rings it 20 dB over a note a semitone off (%.1f dB held, %.1f dB after)",
                  db(both(on, a, b) / both(off, a, b)), db(both(on, c, e) / both(off, c, e)));
    TOLD(both(on, a, b) > 10.0 * both(off, a, b) && both(on, c, e) > 10.0 * both(off, c, e), label);
    TOLD(both(on, a, b) > 0.03 && both(on, a, b) < 0.25, "a held note brings its bowl to a level to hear, under its ceiling");
  }

  // A bowl rings as hard as it is played. A held note on its bowl at -40,
  // -20 and -12 dB: the bowl stands at the same level against the note within
  // 1.5 dB (it follows the playing), and that level is what Strike's drive
  // says. Only at the top is it held: a full-scale note's bowl is 4 dB or
  // more under that, and never over a peak of 0.7.
  {
    double least = 1.0e9, most = -1.0e9, at_full = 0.0, full_peak = 0.0;
    for (double level : {-40.0, -20.0, -12.0, 0.0}) {
      const float gain = static_cast<float>(std::pow(10.0, level / 20.0));
      fresh(device);
      Stereo out = run(device, played(69.0, 10.0f, kRate, gain, 0.3f));
      const double against = db(both(out, 6 * 48000, 10 * 48000) / (gain / std::sqrt(2.0)));
      if (level < 0.0) {
        least = std::min(least, against);
        most = std::max(most, against);
      } else {
        at_full = against;
        full_peak = peak_of(out);
      }
    }
    const double drive = Bowls::kDriveLowDb + (Bowls::kDriveHighDb - Bowls::kDriveLowDb) * p::kParamDefault[p::kStrike];
    std::snprintf(label, sizeof label,
                  "a bowl follows the playing: %.1f to %.1f dB against a held note from -40 to -12 dB (the drive is %.1f), %.1f dB at full scale, peak %.2f",
                  least, most, drive, at_full, full_peak);
    TOLD(most - least < 1.5 && std::fabs(most - drive) < 0.7 && at_full < most - 4.0 && at_full > most - 12.0 && full_peak < 0.7, label);
  }

  // The ear is as wide as a singer is from the note, whatever Ring is: a held
  // note 10 cents off its bowl still rings it within 4 dB, and a note a
  // semitone off rings it 20 dB or more under, at every Ring from 2 s up for
  // every bowl from C2, and down to the shortest Ring for the bowls from C4.
  {
    auto selection = [&](int note, float ring) {
      double level[2];
      for (int k = 0; k < 2; ++k) {
        fresh(device);
        device.set_param(p::kScale, 4.0f);  // C, D and G: the note under C is four semitones from any other bowl
        device.set_param(p::kBowls, 3.0f);
        device.set_param(p::kRegister, static_cast<float>(note - 36) / 36.0f);
        device.set_param(p::kRing, ring);
        Stereo out = run(device, played(note - k, 6.0f, kRate, 0.1f, 1.0f));
        level[k] = both(out, 4 * 48000, 6 * 48000);
      }
      return db(level[0] / level[1]);
    };
    double worst = 1.0e9;
    for (float ring : {2.0f, 10.0f, 40.0f}) {
      for (int note : {36, 48, 60, 72}) worst = std::min(worst, selection(note, ring));
    }
    const double shortest = std::min(selection(60, 0.5f), selection(72, 0.5f));
    const double low_short = selection(36, 0.5f);
    std::snprintf(label, sizeof label,
                  "a held note rings its bowl %.1f dB or more over a semitone off at Ring 2 to 40 s (C2 to C5), %.1f dB at Ring 0.5 s from C4 up; C2 at Ring 0.5 s only %.1f dB",
                  worst, shortest, low_short);
    TOLD(worst > 20.0 && shortest > 20.0, label);
    double near[2];
    for (int k = 0; k < 2; ++k) {
      fresh(device);
      Stereo out = run(device, played(69.0 + 0.1 * k, 6.0f, kRate, 0.1f, 0.3f));
      near[k] = both(out, 3 * 48000, 6 * 48000);
    }
    std::snprintf(label, sizeof label, "a note 10 cents off rings its bowl %.1f dB under one on the note", db(near[0] / near[1]));
    TOLD(db(near[0] / near[1]) < 4.0 && db(near[0] / near[1]) > 1.0, label);
  }

  // Played notes, not held ones: a plucked note on a bowl leaves it ringing
  // 6 dB or more over the same pluck a semitone off, low and high, at the
  // default Strike. (Driven by attacks alone, a low bowl could not tell them
  // apart: 2 dB.) And in a chord with one note of the key and two outside it,
  // no other bowl rings within 20 dB of the one that belongs.
  {
    double worst = 1.0e9;
    for (int note : {48, 60, 72}) {
      double level[2];
      for (int k = 0; k < 2; ++k) {
        fresh(device);
        device.set_param(p::kScale, 4.0f);
        device.set_param(p::kBowls, 3.0f);
        device.set_param(p::kRegister, static_cast<float>(note - 36) / 36.0f);
        Stereo out = run(device, then_silence(played(note - k, 1.5f, kRate, 0.3f, 0.002f, 0.05f, 6, 0.3), 0.5f, kRate));
        level[k] = both(out, 24000, 72000);
      }
      worst = std::min(worst, db(level[0] / level[1]));
    }
    std::snprintf(label, sizeof label, "a plucked note rings its bowl %.1f dB or more over a pluck a semitone off (C3, C4, C5)", worst);
    TOLD(worst > 6.0, label);
    std::vector<float> three;
    for (int note : {69, 73, 66}) add_to(three, played(note, 2.0f, kRate, 0.15f, 0.003f, 0.05f, 6));
    fresh(device);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kMetal, 0.0f);
    Stereo out = run(device, then_silence(three, 1.5f, kRate));
    const size_t a = 120000, b = 168000;
    double other = 0.0;
    for (int note : {55, 57, 60, 62, 64, 67, 72}) other = std::max(other, tone_level(out.left, hz_of(note), kRate, a, b));
    const double own = tone_level(out.left, hz_of(69), kRate, a, b);
    std::snprintf(label, sizeof label, "a chord of A4 (in the key), C#5 and F#4 (outside it): the loudest other bowl is %.1f dB under A4's", db(own / other));
    TOLD(own > 10.0 * other, label);
  }

  // The upper partials stay for as long as the note does: eight seconds into
  // a held note, and at the top of a four-second swell with no attack at all,
  // the second partial is within 8 dB of the share Metal strikes it with and
  // the third within 9 (a struck bowl settles; a sung one is still a bowl).
  {
    for (int slow = 0; slow < 2; ++slow) {
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      device.set_param(p::kSpread, 0.0f);
      Stereo out = run(device, played(69.0, 10.0f, kRate, 0.2f, slow ? 4.0f : 0.003f));
      const size_t a = slow ? 4 * 48000 : 8 * 48000, b = a + 9600;
      const double lowest = tone_level(out.left, 440.0, kRate, a, b);
      const double second = db(tone_level(out.left, 440.0 * 2.77, kRate, a, b) / lowest);
      const double third = db(tone_level(out.left, 440.0 * 5.17, kRate, a, b) / lowest);
      std::snprintf(label, sizeof label, "%s: the upper partials stand at %.1f and %.1f dB of the lowest (struck with -16.5 and -25)",
                    slow ? "at the top of a 4 s swell" : "8 s into a held note", second, third);
      TOLD(second > -24.5 && second < -16.0 && third > -34.0 && third < -24.5, label);
    }
  }

  // The same bowl at every sample rate: a plucked A4 with harmonics leaves
  // its bowl at the same level (within 0.5 dB) while it sounds and two
  // seconds after, the same pluck a semitone off is as far under it, and the
  // bowl of a held C2 comes up as fast (its level 0.3 s in, within 0.5 dB).
  {
    double held[3], after[3], off[3], low[3];
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (int k = 0; k < 3; ++k) {
      const float rate = rates[k];
      const size_t second = static_cast<size_t>(rate);
      fresh(device, rate);
      Stereo out = run(device, then_silence(played(69.0, 1.5f, rate, 0.3f, 0.002f, 0.05f, 6, 0.6), 3.0f, rate));
      held[k] = db(both(out, second / 2, second));
      after[k] = db(both(out, 3 * second, 4 * second));
      fresh(device, rate);
      out = run(device, then_silence(played(70.0, 1.5f, rate, 0.3f, 0.002f, 0.05f, 6, 0.6), 3.0f, rate));
      off[k] = db(both(out, 3 * second, 4 * second));
      fresh(device, rate);
      device.set_param(p::kRegister, 0.0f);
      out = run(device, played(36.0, 1.0f, rate, 0.2f, 0.05f));
      low[k] = db(both(out, static_cast<size_t>(0.25f * rate), static_cast<size_t>(0.35f * rate)));
    }
    std::snprintf(label, sizeof label,
                  "at 44.1, 48 and 96 kHz a plucked A4 leaves its bowl at %.1f, %.1f, %.1f dBFS (after: %.1f, %.1f, %.1f; a semitone off: %.1f, %.1f, %.1f); C2's bowl 0.3 s in: %.1f, %.1f, %.1f",
                  held[0], held[1], held[2], after[0], after[1], after[2], off[0], off[1], off[2], low[0], low[1], low[2]);
    bool same = true;
    for (int k = 0; k < 3; ++k) {
      same = same && std::fabs(held[k] - held[1]) < 0.5 && std::fabs(after[k] - after[1]) < 0.5 &&
             std::fabs(off[k] - off[1]) < 1.0 && std::fabs(low[k] - low[1]) < 0.5;
    }
    TOLD(same && after[1] > off[1] + 6.0, label);
  }

  // Ring is the time the lowest pair takes to fall 60 dB, and the upper
  // partials die sooner by their shares of it.
  {
    for (float ring : {1.0f, 4.0f, 16.0f}) {
      fresh(device);
      device.set_param(p::kRing, ring);
      device.set_param(p::kBeat, 0.0f);
      device.set_param(p::kMetal, 0.0f);
      Stereo out = run(device, then_silence(sine(440.0f, 0.4f, kRate, 0.25f), ring * 0.9f, kRate));
      const double measured = rt60(out.right, kRate, 0.45, ring * 0.05, -100.0);
      std::snprintf(label, sizeof label, "Ring %.0f s: the bowl falls 60 dB in %.2f s", ring, measured);
      TOLD(std::fabs(measured - ring) < 0.06 * ring, label);
    }
    fresh(device);
    device.set_param(p::kRing, 8.0f);
    device.set_param(p::kBeat, 0.0f);
    device.set_param(p::kMetal, 1.0f);
    Stereo out = run(device, then_silence(sine(440.0f, 0.2f, kRate, 0.25f), 3.0f, kRate));
    const size_t w = 24000;
    const double second = hz_of(69) * 2.77, third = hz_of(69) * 5.17;
    // dB lost over one second, from two windows a second apart.
    const double fall1 = db(tone_level(out.right, hz_of(69), kRate, w, 2 * w) / tone_level(out.right, hz_of(69), kRate, 3 * w, 4 * w));
    const double fall2 = db(tone_level(out.right, second, kRate, w, 2 * w) / tone_level(out.right, second, kRate, 3 * w, 4 * w));
    const double fall3 = db(tone_level(out.right, third, kRate, w, 2 * w) / tone_level(out.right, third, kRate, 3 * w, 4 * w));
    std::snprintf(label, sizeof label, "at Ring 8 the partials lose %.2f, %.2f and %.2f dB a second (7.5, 13.6, 25)", fall1, fall2, fall3);
    TOLD(std::fabs(fall1 - 7.5) < 0.5 && std::fabs(fall2 - 60.0 / (8.0 * 0.55)) < 1.0 &&
               std::fabs(fall3 - 60.0 / (8.0 * 0.3)) < 2.0,
           label);
  }

  // Beat: the two modes of the lowest pair are 5 Hz x Beat squared apart,
  // times the bowl's own factor, and the ring swells and sinks at that rate.
  {
    for (float beat : {0.0f, 0.5f, 1.0f}) {
      fresh(device);
      device.set_param(p::kRing, 20.0f);
      device.set_param(p::kBeat, beat);
      device.set_param(p::kMetal, 0.0f);
      device.set_param(p::kSpread, 0.0f);
      Stereo out = run(device, then_silence(sine(440.0f, 0.4f, kRate, 0.25f), 8.0f, kRate));
      const int slot = slot_of(device, 69);
      const double apart = 5.0 * beat * beat * Bowls::slot_beat(slot);
      // The level in steps of 25 ms (eleven whole cycles of the note) from
      // the end of the note, the fall of Ring taken out, as power.
      std::vector<float> power;
      const size_t step = 1200, start = static_cast<size_t>(0.5f * kRate);
      for (size_t at = start; at + step <= out.left.size(); at += step) {
        const double t = static_cast<double>(at - start) / kRate;
        const double level = rms(out.left, at, at + step) * std::pow(10.0, 3.0 * t / 20.0);
        power.push_back(static_cast<float>(level * level));
      }
      const double average = mean(power);
      double swing = 0.0;
      for (float& v : power) {
        v = static_cast<float>(v / average - 1.0);
        swing = std::max(swing, std::fabs(static_cast<double>(v)));
      }
      if (beat == 0.0f) {
        std::snprintf(label, sizeof label, "Beat 0: a bowl rings steady (level swings %.3f of its mean)", swing);
        // What is left is the ring's own length, good to a percent or so in single precision.
        TOLD(swing < 0.15, label);
      } else {
        const double rate = dominant_frequency(power, 40.0, 0.2, 12.0);
        std::snprintf(label, sizeof label, "Beat %.1f: the bowl beats at %.3f Hz (%.3f by its formula), swing %.2f",
                      beat, rate, apart, swing);
        TOLD(std::fabs(rate - apart) < 0.04 * apart && swing > 0.7, label);
      }
    }
  }

  // Level. Full-scale noise with all twelve ringing stays small (noise is on
  // no bowl's note for long), and the bowls alone never pass full scale.
  {
    fresh(device);
    device.set_param(p::kBowls, 12.0f);
    device.set_param(p::kStrike, 1.0f);
    device.set_param(p::kRing, 40.0f);
    rng_state() = 0xB0A7u;
    Stereo out = run(device, noise(10.0f, kRate, 1.0f));
    std::snprintf(label, sizeof label, "full-scale noise, twelve bowls, Strike and Ring full up: peak %.3f, %.1f dB RMS",
                  peak_of(out), db(both(out, 240000)));
    TOLD(finite(out.left) && finite(out.right) && peak_of(out) <= 1.0 && both(out, 240000) < 0.2, label);
  }

  // A full-scale chord on every bowl of the table held for a minute, at the
  // defaults and with each control at each end: never more than 6 dB over
  // the input, and no louder at the end of the minute than after ten seconds.
  auto held_minute = [&](const char* what, const float* values) {
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
    const std::vector<int> notes = table(static_cast<int>(values[p::kRoot] + 0.5f),
                                         std::vector<int>(Bowls::kScaleNotes[static_cast<int>(values[p::kScale] + 0.5f)],
                                                          Bowls::kScaleNotes[static_cast<int>(values[p::kScale] + 0.5f)] +
                                                              Bowls::kScaleSize[static_cast<int>(values[p::kScale] + 0.5f)]),
                                         static_cast<int>(values[p::kBowls] + 0.5f), values[p::kRegister]);
    Stereo out = run(device, chord(notes, 60.0f, kRate, 1.0f));
    const double early = both(out, 10 * 48000, 20 * 48000), late = both(out, 50 * 48000, 60 * 48000);
    char text[200];
    std::snprintf(text, sizeof text, "%s: a full-scale chord held a minute peaks at %.2f and ends %.2f dB from where it was",
                  what, peak_of(out), db(late / early));
    TOLD(finite(out.left) && finite(out.right) && peak_of(out) < 2.0 && late < early * 1.06, text);
    return peak_of(out);
  };
  {
    float values[p::kNumParams];
    for (int id = 0; id < p::kNumParams; ++id) values[id] = p::kParamDefault[id];
    double worst = held_minute("defaults", values);
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        for (int k = 0; k < p::kNumParams; ++k) values[k] = p::kParamDefault[k];
        values[id] = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
        std::snprintf(label, sizeof label, "param %d at its %s", id, end == 0 ? "minimum" : "maximum");
        worst = std::max(worst, held_minute(label, values));
      }
    }
    std::printf("bowls: the held chord peaks at %.2f at the most over the controls' ends\n", worst);
  }

  // What the ceilings are for. Twelve bowls, Strike full up, bright metal,
  // the bowls alone, and a chord on every bowl of the table held at full
  // scale and at half: the ears stop taking in before the sum of the bowls
  // reaches the soft clip, so what comes out is bowls. Whatever is not on a
  // bowl's partial is 35 dB or more under the whole (most of that is each
  // bowl's ear hearing a little of its neighbours, which no level changes),
  // and once the chord's start has rung off the bowls alone peak under 0.97
  // (0.92: only the tops of the sum of twelve reach into the clip's knee).
  // With the ceilings taken away the clip carries the level: 31.5 dB, 1.00.
  {
    float values[p::kNumParams];
    for (int id = 0; id < p::kNumParams; ++id) values[id] = p::kParamDefault[id];
    values[p::kBowls] = 12.0f;
    values[p::kRegister] = 0.4f;
    values[p::kRing] = 3.0f;
    values[p::kStrike] = 1.0f;
    values[p::kMetal] = 0.9f;
    values[p::kMix] = 1.0f;
    for (float level : {1.0f, 0.5f}) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
      run(device, noise(0.05f, kRate, 0.01f));
      const std::vector<int> notes = standing(device);
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
      Stereo out = run(device, chord(notes, 20.0f, kRate, level));
      const size_t from = static_cast<size_t>(12.1 * kRate);
      const double other = std::max(not_a_bowl(out.left, from, notes, kRate), not_a_bowl(out.right, from, notes, kRate));
      std::snprintf(label, sizeof label,
                    "a chord on all twelve bowls at %.1f, Strike full up, the bowls alone: %.1f dB of it is not a bowl, peak %.2f",
                    level, other, peak_of(out, from));
      TOLD(notes.size() == 12 && other < -35.0 && peak_of(out, from) < 0.97, label);
    }
  }

  // Mix 0 is the input, sample for sample; Mix 1 has none of it.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x5EEDu;
    std::vector<float> left = noise(1.0f, kRate, 0.5f), right = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    TOLD(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
    fresh(device);
    Stereo wet = run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
    TOLD(tone_level(wet.left, 1000.0, kRate, 24000, 48000) < 0.005, "Mix 1 carries none of the input");
  }

  // Part-way Mix: a held tone on every note of the piano's middle five
  // octaves, through the default and with Beat at 0. A bowl is not a copy of
  // the note (it turns a quarter turn behind it, and its pair is off it), so
  // nothing cancels: over four seconds the level never falls more than a dB
  // under the dry path alone.
  {
    for (float beat : {p::kParamDefault[p::kBeat], 0.0f}) {
      double worst = 0.0, most = 0.0;
      int at = 0;
      for (int note = 36; note <= 96; ++note) {
        device.init(kRate);
        device.set_param(p::kBeat, beat);
        device.set_param(p::kMix, 0.5f);
        const std::vector<float> tone = sine(static_cast<float>(hz_of(note)), 6.0f, kRate, 0.25f);
        Stereo out = run(device, tone);
        const double dry = 0.25 / std::sqrt(2.0) * std::cos(0.25 * kPi);
        const double change = db(both(out, 96000, 288000) / dry);
        if (change < worst) {
          worst = change;
          at = note;
        }
        most = std::max(most, change);
      }
      std::snprintf(label, sizeof label, "Mix 0.5, Beat %.1f: held tones C2 to C7 change by %.2f dB (at note %d) to +%.2f dB against the dry path",
                    beat, worst, at, most);
      TOLD(worst > -1.0 && most < 6.0, label);
    }
  }

  // The same over the whole keyboard and by the moment: every semitone from
  // C1 to C8 held six seconds, loud and quiet, read in windows of 50 ms from
  // half a second in. A bowl stays a quarter turn behind its note, so nothing
  // is ever taken from the note: never more than 1 dB under the dry path, at
  // the default Mix and at a half, beating and still.
  {
    for (float mix : {p::kParamDefault[p::kMix], 0.5f}) {
      for (float beat : {p::kParamDefault[p::kBeat], 0.0f}) {
        double lowest = 0.0, highest = 0.0;
        for (int note = 24; note <= 108; ++note) {
          const float gain = (note & 1) ? 0.25f : 0.03f;
          const std::vector<float> tone = played(note, 6.0f, kRate, gain, 0.01f);
          device.init(kRate);
          device.set_param(p::kMix, mix);
          device.set_param(p::kBeat, beat);
          Stereo out = run(device, tone);
          against_dry(out, tone, std::cos(0.5 * kPi * mix), 24000, tone.size(), &lowest, &highest);
        }
        std::snprintf(label, sizeof label, "Mix %.2f, Beat %.1f: every semitone C1 to C8, by 50 ms: %.2f to +%.2f dB against the dry path",
                      mix, beat, lowest, highest);
        TOLD(lowest > -1.0 && highest < 4.0, label);
      }
    }
  }

  // A detuned instrument is the real case. Notes 2, 5, 10 and 15 cents either
  // side of a low, a middle and a high bowl, held eight seconds at the
  // default: the bowl sings at the pitch it is played at (it is turned to
  // stay a quarter turn behind the sound), so the note does not beat against
  // it: never more than 1 dB under the dry path. (With the bowl on its own
  // pitch, a note two cents off its bowl lost 7 dB twice a second.)
  {
    double lowest = 0.0, highest = 0.0;
    for (int note : {55, 69, 72}) {
      for (double cents : {-15.0, -10.0, -5.0, -2.0, 2.0, 5.0, 10.0, 15.0}) {
        const std::vector<float> tone = played(note + cents / 100.0, 8.0f, kRate, 0.1f, 0.01f);
        device.init(kRate);
        Stereo out = run(device, tone);
        against_dry(out, tone, std::cos(0.5 * kPi * p::kParamDefault[p::kMix]), 24000, tone.size(), &lowest, &highest);
      }
    }
    std::snprintf(label, sizeof label, "notes 2 to 15 cents off their bowls, by 50 ms: %.2f to +%.2f dB against the dry path", lowest, highest);
    TOLD(lowest > -1.0 && highest < 3.0, label);
  }

  // A note struck again over its own ring: the bowl that is still singing
  // from the first is turned behind the second, wherever in its cycle the
  // second happens to start (twenty starts across a cycle of the note), loud
  // and quiet. (Left where it was it took up to 7 dB from the note.)
  {
    double lowest = 0.0, highest = 0.0;
    for (float gain : {0.25f, 0.03f}) {
      for (int gap = 0; gap < 110; gap += 6) {
        std::vector<float> twice = played(69.0, 3.0f, kRate, gain, 0.01f, 0.01f);
        twice.resize(twice.size() + 24000 + gap, 0.0f);
        const size_t second = twice.size();
        add_to(twice, played(69.0, 4.0f, kRate, gain, 0.01f, 0.01f), second);
        device.init(kRate);
        Stereo out = run(device, twice);
        against_dry(out, twice, std::cos(0.5 * kPi * p::kParamDefault[p::kMix]), second + 9600, twice.size() - 4800, &lowest,
                    &highest);
      }
    }
    std::snprintf(label, sizeof label, "a note struck again over its own ring, by 50 ms: %.2f to +%.2f dB against the dry path", lowest, highest);
    TOLD(lowest > -1.0 && highest < 3.0, label);
  }

  // Every preset (the table is device.json's, copied): the full-scale chord
  // on its own table held for a minute, and, where it has a dry path, held
  // tones on every note from C2 to C7 at its own Mix against the dry path
  // alone.
  {
    struct Preset {
      const char* name;
      std::vector<std::pair<int, float>> values;
    };
    const std::vector<Preset> presets = {
      {"Bowl table", {}},
      {"Faint halo", {{p::kMix, 0.15f}, {p::kStrike, 0.3f}, {p::kRing, 8.0f}, {p::kMetal, 0.35f}}},
      {"Bowls alone", {{p::kMix, 1.0f}, {p::kStrike, 0.8f}, {p::kRing, 12.0f}}},
      {"Low fifths", {{p::kRoot, 9.0f}, {p::kScale, 4.0f}, {p::kBowls, 5.0f}, {p::kRegister, 0.3f}, {p::kRing, 30.0f}, {p::kBeat, 0.3f}, {p::kMetal, 0.25f}, {p::kMix, 0.4f}}},
      {"Small bright set", {{p::kBowls, 10.0f}, {p::kRegister, 0.85f}, {p::kRing, 5.0f}, {p::kBeat, 0.5f}, {p::kStrike, 0.6f}, {p::kMetal, 0.85f}, {p::kMix, 0.4f}}},
      {"Every attack", {{p::kBowls, 12.0f}, {p::kRegister, 0.4f}, {p::kRing, 3.0f}, {p::kStrike, 1.0f}, {p::kMetal, 0.9f}}},
      {"Long ring", {{p::kRoot, 9.0f}, {p::kScale, 1.0f}, {p::kRing, 40.0f}, {p::kBeat, 0.25f}, {p::kStrike, 0.4f}, {p::kMetal, 0.35f}, {p::kMix, 0.4f}}},
      {"Minor table", {{p::kRoot, 9.0f}, {p::kScale, 3.0f}, {p::kBowls, 12.0f}, {p::kRegister, 0.4f}, {p::kRing, 12.0f}, {p::kMix, 0.4f}}},
      {"Whole tone glass", {{p::kScale, 5.0f}, {p::kBowls, 9.0f}, {p::kRegister, 0.6f}, {p::kRing, 7.0f}, {p::kBeat, 0.7f}, {p::kStrike, 0.55f}, {p::kMetal, 0.95f}, {p::kMix, 0.4f}}},
      {"Five dark bowls", {{p::kRoot, 9.0f}, {p::kScale, 6.0f}, {p::kBowls, 5.0f}, {p::kRegister, 0.45f}, {p::kRing, 14.0f}, {p::kBeat, 0.45f}, {p::kMetal, 0.3f}, {p::kMix, 0.45f}}},
      {"Pelog gongs", {{p::kRoot, 4.0f}, {p::kScale, 7.0f}, {p::kBowls, 7.0f}, {p::kRegister, 0.45f}, {p::kRing, 18.0f}, {p::kBeat, 0.55f}, {p::kStrike, 0.6f}, {p::kMetal, 0.2f}, {p::kSpread, 0.8f}, {p::kMix, 0.4f}}},
      {"Fast beating", {{p::kBowls, 6.0f}, {p::kRing, 8.0f}, {p::kBeat, 1.0f}, {p::kMix, 0.45f}}},
      {"Still bowls", {{p::kBeat, 0.0f}, {p::kRing, 14.0f}, {p::kMetal, 0.3f}, {p::kStrike, 0.4f}, {p::kMix, 0.4f}}},
      {"Short chime", {{p::kRing, 0.8f}, {p::kStrike, 0.8f}, {p::kMetal, 0.75f}, {p::kBowls, 10.0f}, {p::kMix, 0.4f}}},
      {"Centre three", {{p::kRoot, 9.0f}, {p::kScale, 4.0f}, {p::kBowls, 3.0f}, {p::kRegister, 0.45f}, {p::kRing, 25.0f}, {p::kBeat, 0.35f}, {p::kSpread, 0.0f}, {p::kMix, 0.4f}}},
      {"Wide and slow", {{p::kScale, 2.0f}, {p::kBowls, 12.0f}, {p::kRegister, 0.45f}, {p::kRing, 25.0f}, {p::kBeat, 0.2f}, {p::kSpread, 1.0f}, {p::kMix, 0.4f}}},
    };
    double chord_worst = 0.0, dip_worst = 0.0, rise_worst = 0.0;
    for (const Preset& preset : presets) {
      float values[p::kNumParams];
      for (int id = 0; id < p::kNumParams; ++id) values[id] = p::kParamDefault[id];
      for (const auto& [id, value] : preset.values) values[id] = value;
      std::snprintf(label, sizeof label, "preset %s", preset.name);
      chord_worst = std::max(chord_worst, held_minute(label, values));
      if (values[p::kMix] >= 1.0f) continue;
      double worst = 0.0, most = 0.0;
      int at = 0;
      for (int note = 36; note <= 96; ++note) {
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, values[id]);
        Stereo out = run(device, sine(static_cast<float>(hz_of(note)), 6.0f, kRate, 0.25f));
        const double dry = 0.25 / std::sqrt(2.0) * std::cos(0.5 * kPi * values[p::kMix]);
        const double change = db(both(out, 96000, 288000) / dry);
        if (change < worst) {
          worst = change;
          at = note;
        }
        most = std::max(most, change);
      }
      std::snprintf(label, sizeof label, "preset %s: held tones C2 to C7 change by %.2f dB (at note %d) to +%.2f dB against its dry path",
                    preset.name, worst, at, most);
      TOLD(worst > -1.0 && most < 6.0, label);
      dip_worst = std::min(dip_worst, worst);
      rise_worst = std::max(rise_worst, most);
    }
    std::printf("bowls: over the presets the held chord peaks at %.2f at the most; held tones run from %.2f to +%.2f dB against the dry path\n",
                chord_worst, dip_worst, rise_worst);
  }

  // A note held on a bowl and its bowl beat against each other (the bowl's
  // two modes are a little off the note). At the default the level, read in
  // tenths of a second, stays within 1.5 dB under and 2 dB over the dry path.
  {
    double lowest = 0.0, highest = 0.0;
    for (int note : {55, 57, 60, 64, 69, 72}) {
      device.init(kRate);
      Stereo out = run(device, sine(static_cast<float>(hz_of(note)), 14.0f, kRate, 0.25f));
      const double dry = 0.25 / std::sqrt(2.0) * std::cos(0.5 * kPi * p::kParamDefault[p::kMix]);
      for (size_t at = 96000; at + 4800 <= out.left.size(); at += 2400) {
        const double here = db(both(out, at, at + 4800) / dry);
        lowest = std::min(lowest, here);
        highest = std::max(highest, here);
      }
    }
    std::snprintf(label, sizeof label, "at the default a held note on a bowl runs from %.2f to +%.2f dB against the dry path, by tenths of a second",
                  lowest, highest);
    TOLD(lowest > -1.5 && highest < 2.0, label);
  }

  // The two sides. An anti-phase sound still rings the bowls (one ear of
  // each listens mostly to each side), a sound on one side rings that side's
  // modes, and Spread 0 puts every bowl in the middle.
  {
    const std::vector<float> tone = then_silence(sine(440.0f, 1.0f, kRate, 0.25f), 1.0f, kRate);
    std::vector<float> minus = tone, none(tone.size(), 0.0f);
    for (float& v : minus) v = -v;
    fresh(device);
    Stereo mono = run(device, tone);
    fresh(device);
    Stereo anti = run(device, tone, minus);
    fresh(device);
    Stereo one = run(device, tone, none);
    const size_t a = 52800, b = 96000;
    std::snprintf(label, sizeof label, "an anti-phase note rings the bowl %.1f dB under a mono one, a one-sided note %.1f dB",
                  db(both(mono, a, b) / both(anti, a, b)), db(both(mono, a, b) / both(one, a, b)));
    TOLD(both(anti, a, b) > 0.3 * both(mono, a, b) && both(one, a, b) > 0.3 * both(mono, a, b), label);
    fresh(device);
    device.set_param(p::kSpread, 0.0f);
    Stereo middle = run(device, tone);
    TOLD(middle.left == middle.right, "Spread 0: every bowl rings from the centre");
    // The two modes of a pair are started in step with each other whatever
    // the two sides are to each other: an anti-phase note does not cancel
    // where they meet, even with no beat and every bowl in the middle.
    for (float spread : {0.6f, 0.0f}) {
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      device.set_param(p::kSpread, spread);
      Stereo still = run(device, tone);
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      device.set_param(p::kSpread, spread);
      Stereo still_anti = run(device, tone, minus);
      std::snprintf(label, sizeof label, "Beat 0, Spread %.1f: an anti-phase note rings the bowl %.1f dB under a mono one", spread,
                    db(both(still, a, b) / both(still_anti, a, b)));
      TOLD(both(still_anti, a, b) > 0.3 * both(still, a, b), label);
    }
    fresh(device);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kBeat, 0.0f);
    Stereo wide = run(device, tone);
    // A4 stands in the slot at the far right: its two modes at 0.78 and 1 of the way.
    const double lean = db(rms(wide.right, a, b) / rms(wide.left, a, b));
    std::snprintf(label, sizeof label, "Spread 1: the bowl at the far right is %.1f dB louder on the right", lean);
    TOLD(Bowls::slot_place(slot_of(device, 69)) == 1.0f && lean > 12.0, label);
  }

  // Bad input: not a number, infinity and 1e30 are survived, the table rings
  // out to sleep, and it then answers a note as a fresh one does.
  {
    fresh(device);
    std::vector<float> bad = sine(440.0f, 0.5f, kRate, 0.25f);
    bad[1000] = std::nanf("");
    bad[2000] = INFINITY;
    bad[3000] = -INFINITY;
    for (size_t i = 4000; i < 6000; ++i) bad[i] = (i & 1) ? 1.0e30f : -1.0e30f;
    Stereo during = run(device, bad);
    Stereo after = render(device, 30.0f, kRate);
    TOLD(finite(during.left) && finite(during.right) && finite(after.left) && peak_of(during) <= 1.0,
           "NaN, infinity and 1e30 in: finite and bounded out");
    TOLD(device.asleep() && peak_of(after, after.size() - 48000) == 0.0, "after bad input the table rings out and sleeps");
    Stereo again = run(device, swell(440.0f, 3.0f, kRate, 0.25f));
    std::snprintf(label, sizeof label, "after bad input a note rings its bowl as before (%.2f dB from a fresh table)",
                  db(both(again, 96000, 144000) / on_level));
    TOLD(std::fabs(db(both(again, 96000, 144000) / on_level)) < 0.1, label);
  }

  // Block size and sleep. A burst, a silence long enough to sleep in (with
  // two knobs moved while asleep), then a chord: the same samples at blocks
  // of 1, 128 and 2048, and after the wake the same as a fresh table that was
  // given those settings from the start (the knobs snapped).
  {
    rng_state() = 0xB10Cu;
    const std::vector<float> burst = then_silence(noise(0.3f, kRate, 0.3f), 3.0f, kRate);
    const std::vector<float> gap(4099, 0.0f);
    const std::vector<float> notes = then_silence(chord({57, 64, 72}, 0.5f, kRate, 0.5f), 0.4f, kRate);
    Stereo kept[3];
    bool slept = true;
    const int blocks[3] = {1, 128, 2048};
    for (int k = 0; k < 3; ++k) {
      device.init(kRate);
      device.set_param(p::kRing, 0.5f);
      Stereo out = run(device, burst, blocks[k]);
      slept = slept && device.asleep();
      device.set_param(p::kRegister, 0.6f);
      device.set_param(p::kMix, 0.8f);
      out = concat(out, run(device, gap, blocks[k]));
      kept[k] = concat(out, run(device, notes, blocks[k]));
    }
    double worst = 0.0;
    for (int k = 1; k < 3; ++k) {
      for (size_t i = 0; i < kept[0].size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(kept[k].left[i]) - kept[0].left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(kept[k].right[i]) - kept[0].right[i]));
      }
    }
    std::snprintf(label, sizeof label, "the same at blocks of 1, 128 and 2048 across a sleep (max diff %g)", worst);
    TOLD(slept && worst < 1.0e-7, label);
    device.init(kRate);
    device.set_param(p::kRing, 0.5f);
    device.set_param(p::kRegister, 0.6f);
    device.set_param(p::kMix, 0.8f);
    Stereo straight = run(device, notes);
    double off = 0.0;
    const size_t start = burst.size() + gap.size();
    for (size_t i = 0; i < straight.size(); ++i) {
      off = std::max(off, std::fabs(static_cast<double>(straight.left[i]) - kept[1].left[start + i]));
    }
    std::snprintf(label, sizeof label, "knobs moved in the silence snap on the wake (max diff from a fresh table %g)", off);
    TOLD(off < 1.0e-7, label);
  }

  // The same with a ring still sounding when the input stops, at blocks of
  // 1, 32, 128, 512 and 2048 and at blocks of every size mixed: a note, its
  // ring left to die into sleep, a knob moved asleep, a second note. Sample
  // for sample the same. And sleep never cuts a ring that can be heard: the
  // last thing out before the silence is under -130 dBFS.
  {
    const std::vector<float> first = then_silence(chord({57, 64, 72}, 0.7f, kRate, 0.5f), 5.5f, kRate);
    const std::vector<float> gap(3001, 0.0f);
    const std::vector<float> second = then_silence(chord({55, 62, 69}, 0.4f, kRate, 0.5f), 0.5f, kRate);
    const std::vector<std::vector<int>> patterns = {{1}, {32}, {128}, {512}, {2048}, {1, 7, 64, 333, 2048, 128, 5, 1024, 31}};
    std::vector<Stereo> kept;
    bool slept = true;
    for (const std::vector<int>& pattern : patterns) {
      auto go = [&](const std::vector<float>& x) {
        Stereo out;
        out.left.resize(x.size());
        out.right.resize(x.size());
        size_t done = 0, turn = 0;
        while (done < x.size()) {
          const int frames = static_cast<int>(std::min(static_cast<size_t>(pattern[turn++ % pattern.size()]), x.size() - done));
          for (int i = 0; i < frames; ++i) device.in_left()[i] = device.in_right()[i] = x[done + i];
          device.process(frames);
          for (int i = 0; i < frames; ++i) {
            out.left[done + i] = device.out_left()[i];
            out.right[done + i] = device.out_right()[i];
          }
          done += frames;
        }
        return out;
      };
      device.init(kRate);
      device.set_param(p::kRing, 2.0f);
      device.set_param(p::kMix, 1.0f);
      Stereo out = go(first);
      slept = slept && device.asleep();
      device.set_param(p::kStrike, 0.9f);
      out = concat(out, go(gap));
      kept.push_back(concat(out, go(second)));
    }
    double worst = 0.0;
    for (size_t k = 1; k < kept.size(); ++k) {
      for (size_t i = 0; i < kept[0].size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(kept[k].left[i]) - kept[0].left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(kept[k].right[i]) - kept[0].right[i]));
      }
    }
    // The last sample that is not silence in the first part, and what came out in the 50 ms up to it.
    size_t last = first.size();
    while (last > 0 && kept[0].left[last - 1] == 0.0f && kept[0].right[last - 1] == 0.0f) --last;
    const double tail = peak_of(kept[0], last > 2400 ? last - 2400 : 0, last);
    const double before = both(kept[0], last > 48000 ? last - 48000 : 0, last > 45600 ? last - 45600 : 0);
    std::snprintf(label, sizeof label,
                  "a ring into sleep and a wake: the same at blocks of 1, 32, 128, 512, 2048 and mixed (max diff %g); the ring ends %.1f s after the note at %.0f dBFS",
                  worst, static_cast<double>(last) / kRate - 0.7, db(tail));
    TOLD(slept && worst < 1.0e-7 && last > 96000 && last < first.size() - 24000 && tail < 3.2e-7 && tail > 0.0 && before > tail, label);
  }

  // The longest ring there is does not keep the table awake for ever, and is
  // not cut short: at Ring 40 s a note's ring is still coming out a minute
  // later and the table sleeps before two.
  {
    fresh(device);
    device.set_param(p::kRing, 40.0f);
    run(device, chord({57, 64, 72}, 0.5f, kRate, 0.5f));
    Stereo minute = render(device, 60.0f, kRate);
    const bool sounding = !device.asleep() && peak_of(minute, minute.size() - 4800) > 1.0e-6;
    render(device, 55.0f, kRate);
    std::snprintf(label, sizeof label, "Ring 40 s: a minute after the note the ring is at %.0f dBFS, and the table sleeps within two",
                  db(peak_of(minute, minute.size() - 4800)));
    TOLD(sounding && device.asleep(), label);
  }

  // Clicks. Under a low held chord, every control is moved while the bowls
  // sing; the largest step in the output is no more than with the control at
  // either setting throughout (an event-free reference for both).
  {
    struct Move {
      int id;
      float from, to;
      const char* what;
    };
    const Move moves[] = {
        {p::kRoot, 0.0f, 7.0f, "Root C to G"},         {p::kScale, 0.0f, 3.0f, "Scale to Minor"},
        {p::kScale, 0.0f, 4.0f, "Scale to Fifths"},    {p::kBowls, 8.0f, 3.0f, "Bowls 8 to 3"},
        {p::kBowls, 3.0f, 12.0f, "Bowls 3 to 12"},     {p::kRegister, 0.0f, 1.0f, "Register up"},
        {p::kRegister, 0.1f, 0.0f, "Register down"},   {p::kRing, 10.0f, 0.5f, "Ring 10 to 0.5"},
        {p::kBeat, 0.4f, 1.0f, "Beat up"},             {p::kStrike, 0.4f, 1.0f, "Strike up"},
        {p::kMetal, 0.5f, 1.0f, "Metal up"},           {p::kSpread, 0.6f, 0.0f, "Spread to 0"},
        {p::kSpread, 0.0f, 1.0f, "Spread to 1"},       {p::kMix, 0.5f, 0.0f, "Mix to 0"},
        {p::kMix, 0.5f, 1.0f, "Mix to 1"},
    };
    const std::vector<float> low = chord({36, 43, 48}, 3.0f, kRate, 0.5f);
    const std::vector<float> first(low.begin(), low.begin() + 72000), second(low.begin() + 72000, low.end());
    for (const Move& move : moves) {
      auto pass = [&](float before, float after) {
        device.init(kRate);
        device.set_param(p::kRegister, 0.0f);
        device.set_param(p::kMix, 0.5f);
        device.set_param(move.id, before);
        run(device, first);
        device.set_param(move.id, after);
        Stereo out = run(device, second);
        return std::max(max_step(out.left), max_step(out.right));
      };
      const double held = std::max(pass(move.from, move.from), pass(move.to, move.to));
      const double moved = pass(move.from, move.to);
      std::snprintf(label, sizeof label, "%s while sounding: largest step %.5f against %.5f held", move.what, moved, held);
      TOLD(moved < held * 1.1 + 2.0e-4, label);
    }
  }

  // A retune does not cut the ring. C5 is played and left to ring, then Root
  // goes from C to G (whose table has no C): the bowl has left the table and
  // rings on where it stood, within 1 dB of what it does with no retune, and
  // nothing clicks. (It was damped in a tenth of a second.)
  {
    auto pass = [&](bool retune, double* tone, bool* left) {
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      run(device, played(72.0, 1.0f, kRate, 0.25f, 0.01f, 0.05f));
      const int slot = slot_of(device, 72);
      if (retune) device.set_param(p::kRoot, 7.0f);
      Stereo out = render(device, 1.5f, kRate);
      *tone = tone_level(out.left, hz_of(72), kRate, 24000, 48000);
      *left = slot >= 0 && device.slot_note(slot) != 72 && device.slot_leaving(slot) == 72;
      return std::max(max_step(out.left), max_step(out.right));
    };
    double kept = 0.0, rung = 0.0;
    bool left = false, stayed = false;
    const double held = pass(false, &rung, &stayed);
    const double moved = pass(true, &kept, &left);
    std::snprintf(label, sizeof label,
                  "Root C to G over a ringing C5: its bowl leaves the table and rings on %.2f dB from where it would be; largest step %.5f against %.5f",
                  db(kept / rung), moved, held);
    TOLD(left && !stayed && std::fabs(db(kept / rung)) < 1.0 && moved < held * 1.1 + 2.0e-4, label);
    TOLD(standing(device) == table(7, kMajorFive, 8, 0.5f), "after the retune the table is G major pentatonic");
  }

  // Two retunes in a row over ringing bowls: a slot then holds a bowl that
  // rings out, a bowl that stands and rings, and is asked for a third. The
  // quieter of the two is damped under a hand before it goes: the table
  // becomes the new one, and nothing clicks. (Swapped with no damping, or
  // with the hand's time at nought, this fails.)
  {
    auto pass = [&](bool again) {
      device.init(kRate);
      device.set_param(p::kMix, 0.5f);
      run(device, chord({55, 60}, 0.6f, kRate, 0.5f));
      device.set_param(p::kRoot, 7.0f);  // G3 and C4 leave; D4 and G4 stand where they stood
      run(device, chord({62, 67}, 0.6f, kRate, 0.5f));
      if (again) device.set_param(p::kRoot, 2.0f);  // and now A3 and D4 are asked for there
      Stereo out = run(device, chord({36, 43}, 0.5f, kRate, 0.3f));
      return std::max(max_step(out.left), max_step(out.right));
    };
    const double held = pass(false);
    const double moved = pass(true);
    const bool laid = standing(device) == table(2, kMajorFive, 8, 0.5f);
    std::snprintf(label, sizeof label, "a second retune over two ringing bowls in a slot: largest step %.5f against %.5f, the table is %s", moved,
                  held, laid ? "the new one" : "NOT the new one");
    TOLD(laid && moved < held * 1.1 + 2.0e-4, label);
  }

  // A bowl that comes back while it still rings out comes back as it is:
  // Bowls goes from 8 to 3 and back under a ringing A4, and its ring is
  // where it would have been, with no click.
  {
    auto pass = [&](bool away, double* tone) {
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      run(device, played(69.0, 1.0f, kRate, 0.25f, 0.01f, 0.05f));
      if (away) device.set_param(p::kBowls, 3.0f);
      Stereo out = render(device, 0.3f, kRate);
      if (away) device.set_param(p::kBowls, 8.0f);
      out = concat(out, render(device, 1.0f, kRate));
      *tone = tone_level(out.left, hz_of(69), kRate, 38400, 62400);
      return std::max(max_step(out.left), max_step(out.right));
    };
    double kept = 0.0, rung = 0.0;
    const double held = pass(false, &rung);
    const double moved = pass(true, &kept);
    std::snprintf(label, sizeof label, "Bowls 8 to 3 and back under a ringing A4: it rings on %.2f dB from where it would be, in its slot again; largest step %.5f against %.5f",
                  db(kept / rung), moved, held);
    TOLD(slot_of(device, 69) >= 0 && device.slot_leaving(slot_of(device, 69)) < 0 && std::fabs(db(kept / rung)) < 1.0 &&
               moved < held * 1.1 + 2.0e-4,
           label);
  }

  // Rest. After any control is thrown to both ends while the bowls sing, the
  // table still rings out and sleeps: nothing glides for ever.
  {
    for (int id = 0; id < p::kNumParams; ++id) {
      device.init(kRate);
      device.set_param(p::kRing, 1.0f);
      run(device, chord({57, 64, 72}, 0.3f, kRate, 0.5f));
      device.set_param(id, p::kParamMax[id]);
      run(device, chord({57, 64, 72}, 0.3f, kRate, 0.5f));
      device.set_param(id, p::kParamMin[id]);
      run(device, chord({57, 64, 72}, 0.3f, kRate, 0.5f));
      if (id == p::kRing) device.set_param(id, 1.0f);
      Stereo rest = render(device, 6.0f, kRate);
      std::snprintf(label, sizeof label, "param %d moved while sounding: the table comes to rest", id);
      TOLD(device.asleep() && peak_of(rest, rest.size() - 24000) == 0.0, label);
    }
  }

  // Strike: a short burst of noise (an attack with no note) leaves the table
  // ringing far more with Strike up, where a held note on a bowl gains much
  // less from it: Strike is the attacks' way in.
  {
    rng_state() = 0x57E1u;
    const std::vector<float> tick = then_silence(noise(0.03f, kRate, 0.5f), 1.0f, kRate);
    const std::vector<float> held = sine(440.0f, 2.0f, kRate, 0.1f);
    double after[3], during[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      fresh(device);
      device.set_param(p::kStrike, settings[k]);
      Stereo out = run(device, tick);
      after[k] = both(out, 4800, 48000);
      fresh(device);
      device.set_param(p::kStrike, settings[k]);
      Stereo sung = run(device, held);
      during[k] = both(sung, 48000, 96000);
    }
    std::snprintf(label, sizeof label, "Strike 0, 0.5, 1: an attack leaves %.1f, %.1f, %.1f dB; a held note %.1f, %.1f, %.1f dB",
                  db(after[0]), db(after[1]), db(after[2]), db(during[0]), db(during[1]), db(during[2]));
    TOLD(after[1] > 3.0 * after[0] && after[2] > 2.0 * after[1] && after[2] > 10.0 * after[0], label);
    TOLD(during[1] > 1.2 * during[0] && during[2] > 1.1 * during[1] && during[2] < 10.0 * during[0],
           "Strike raises a held note's bowl too, by much less than an attack's");
  }

  // Metal: how loud the upper partials are struck against the lowest pair.
  {
    double second[3], third[3];
    const float settings[3] = {0.0f, 0.5f, 1.0f};
    for (int k = 0; k < 3; ++k) {
      fresh(device);
      device.set_param(p::kBeat, 0.0f);
      device.set_param(p::kMetal, settings[k]);
      device.set_param(p::kSpread, 0.0f);
      Stereo out = run(device, then_silence(sine(440.0f, 0.1f, kRate, 0.25f), 0.4f, kRate));
      const size_t a = 5280, b = 14880;
      const double lowest = tone_level(out.left, 440.0, kRate, a, b);
      second[k] = db(tone_level(out.left, 440.0 * 2.77, kRate, a, b) / lowest);
      third[k] = db(tone_level(out.left, 440.0 * 5.17, kRate, a, b) / lowest);
    }
    std::snprintf(label, sizeof label, "Metal 0, 0.5, 1: the second partial at %.1f, %.1f, %.1f dB and the third at %.1f, %.1f, %.1f dB of the lowest",
                  second[0], second[1], second[2], third[0], third[1], third[2]);
    TOLD(std::fabs(second[0] + 30.0) < 4.0 && std::fabs(second[2] + 3.0) < 4.0 && second[1] > second[0] + 8.0 &&
               second[2] > second[1] + 8.0 && std::fabs(third[0] + 42.0) < 6.0 && std::fabs(third[2] + 8.0) < 6.0,
           label);
  }

  // The readings for the display: a slot's level is its bowl's power in dB
  // above -63, its beat reading turns at the bowl's beat rate, and asleep
  // they all read 0.
  {
    auto digit = [](float reading, int slot) {
      return (static_cast<int>(reading) >> (6 * (slot % 4))) & 63;
    };
    fresh(device);
    device.set_param(p::kBeat, 0.0f);
    device.set_param(p::kMetal, 0.0f);
    device.set_param(p::kSpread, 0.0f);
    Stereo out = run(device, sine(440.0f, 2.0f, kRate, 0.25f));
    const int slot = slot_of(device, 69);
    // In the middle with the pair together, a side carries the pair's power.
    const double expected = 63.5 + db(std::sqrt(2.0) * rms(out.left, 86400, 96000));
    const int level = digit(device.meter(slot / 4), slot);
    int others = 0;
    for (int s = 0; s < Bowls::kMaxBowls; ++s) {
      if (s != slot) others = std::max(others, digit(device.meter(s / 4), s));
    }
    std::snprintf(label, sizeof label, "the level reading of the bowl that sings is %d (%.1f from its sound), the loudest other %d",
                  level, expected, others);
    TOLD(std::abs(level - static_cast<int>(expected)) <= 1 && others < level - 20, label);

    fresh(device);
    device.set_param(p::kRing, 20.0f);
    device.set_param(p::kBeat, 0.6f);
    run(device, sine(440.0f, 0.5f, kRate, 0.25f));
    const double apart = 5.0 * 0.36 * Bowls::slot_beat(slot);
    double turned = 0.0;
    int last = digit(device.meter(3 + slot / 4), slot);
    const int steps = 150;  // of 960 samples: 3 s
    for (int k = 0; k < steps; ++k) {
      render(device, 0.02f, kRate);
      const int now = digit(device.meter(3 + slot / 4), slot);
      turned += ((now - last) & 63);
      last = now;
    }
    const double rate = turned / 64.0 / (steps * 0.02);
    std::snprintf(label, sizeof label, "the beat reading turns %.3f times a second (the bowl beats at %.3f Hz)", rate, apart);
    TOLD(std::fabs(rate - apart) < 0.03 * apart + 0.02, label);
    render(device, 60.0f, kRate);
    bool zero = device.asleep();
    for (int index = 0; index < 6; ++index) zero = zero && device.meter(index) == 0.0f;
    TOLD(zero && device.meter(-1) == 0.0f && device.meter(6) == 0.0f, "asleep, every reading is 0");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.25f));
    TOLD(peak_of(woken) > 0.01, "wakes on new input");
  }

  // Cost: the defaults on noise, then the worst there is: twelve bowls all
  // singing on a full chord with Strike, Metal and Ring full up.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("bowls", 10.0f, kRate, [&] { run(device, input); });
  for (float rate : {48000.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kBowls, 12.0f);
    device.set_param(p::kStrike, 1.0f);
    device.set_param(p::kMetal, 1.0f);
    device.set_param(p::kRing, 40.0f);
    device.set_param(p::kBeat, 1.0f);
    std::vector<float> full = chord(table(0, kMajorFive, 12, 0.5f), 10.0f, rate, 0.8f);
    rng_state() = 0xBEEFu;
    for (float& v : full) v += 0.1f * white();
    report_cost("bowls, twelve singing", 10.0f, rate, [&] { run(device, full); });
  }

  return finish("bowls");
}
