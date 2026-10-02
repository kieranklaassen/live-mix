// Native harness for Aurora (cpp/devices/aurora). The conformance pass covers
// silence before and after notes, determinism, a pile of keys, parameter abuse
// and other sample rates. The rest measures what makes it this instrument:
// two layers a set gap apart and the rate they beat at, voices that are not
// tuned alike, two 12 dB filters in series, the contour's start, peak and
// rest, the swell of a held note, the ring sweep, and the levels, clicks and
// block-size independence every instrument owes.
//
// Nobody has listened to this device: these numbers are what stands in for it.

#include "../devices/aurora/aurora.h"
#include "support/test_kit.h"

#include <algorithm>
#include <complex>

using namespace testkit;
using livemix::Aurora;
namespace p = livemix::aurora;

static Aurora device;

static const float kRate = 48000.0f;

// One steady, in-tune, wide-open voice: no contour, swell, detune or ring,
// both filters out of the way, and envelopes that are over at once.
static void plain(Aurora& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBrilliance, 16000.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kResonance, 0.0f);
  d.set_param(p::kContour, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kSwell, 0.0f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kRing, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The layers lean to opposite sides; most measurements want the sum.
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

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The corner a filter is asked for at a note: half keyboard tracking around
// middle C (Aurora::kKeyTrack, kPivotHz).
static double tracked(double corner, double note_hz) {
  return corner * std::pow(note_hz / Aurora::kPivotHz, Aurora::kKeyTrack);
}

// Three refinements of a peak at `hz` by a parabola through the log level at
// three points `span` apart, the span shrinking each time.
static double refine(const std::vector<float>& x, double rate, double hz, double span, size_t from,
                     size_t to) {
  for (int pass = 0; pass < 3; ++pass) {
    const double a = std::log(tone_level(x, hz - span, rate, from, to) + 1.0e-30);
    const double b = std::log(tone_level(x, hz, rate, from, to) + 1.0e-30);
    const double c = std::log(tone_level(x, hz + span, rate, from, to) + 1.0e-30);
    const double bend = a - 2.0 * b + c;
    if (bend < 0.0) hz += std::clamp(0.5 * (a - c) / bend, -1.0, 1.0) * span;
    span *= 0.3;
  }
  return hz;
}

// The frequency of the strongest component in [lo, hi] Hz: a scan in `step`
// Hz, then the refinement above. Much cheaper than dominant_frequency when
// the answer is known to a few cents.
static double peak_frequency(const std::vector<float>& x, double rate, double lo, double hi, double step,
                             size_t from, size_t to) {
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += step) {
    const double level = tone_level(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  return refine(x, rate, best_hz, step, from, to);
}

// The two layers of one voice at the harmonic `hz`: the two strongest peaks
// within `reach` cents of it, lower first.
struct Layers {
  double low, high;
  double centre(double hz) const { return 0.5 * (cents(low, hz) + cents(high, hz)); }
  double gap() const { return cents(high, low); }
};

static Layers layer_peaks(const std::vector<float>& x, double hz, double reach, size_t from, size_t to) {
  const double lo = hz * std::pow(2.0, -reach / 1200.0), hi = hz * std::pow(2.0, reach / 1200.0);
  const double step = 0.25, guard = 4.0;
  std::vector<double> levels;
  for (double f = lo; f <= hi; f += step) levels.push_back(tone_level(x, f, kRate, from, to));
  size_t first = 0, second = SIZE_MAX;
  for (size_t i = 0; i < levels.size(); ++i) {
    if (levels[i] > levels[first]) first = i;
  }
  for (size_t i = 0; i < levels.size(); ++i) {
    if (std::fabs(static_cast<double>(i) - static_cast<double>(first)) * step < guard) continue;
    if (second == SIZE_MAX || levels[i] > levels[second]) second = i;
  }
  const double a = refine(x, kRate, lo + step * static_cast<double>(first), step, from, to);
  const double b = refine(x, kRate, lo + step * static_cast<double>(second), step, from, to);
  return {std::min(a, b), std::max(a, b)};
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Whether `f` is further than 16 bins from every multiple of `hz`: not a
// harmonic of the note, nor the skirt of one.
static bool between_harmonics(double f, double hz, double bin) {
  const double k = std::round(f / hz);
  return k < 1.0 || std::fabs(f - k * hz) > 16.0 * bin;
}

// Share of the power that is not on a harmonic of the note (ring products).
static double off_grid_share(const std::vector<float>& x, double rate, double hz, size_t from,
                             size_t n = 16384) {
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = rate / static_cast<double>(n);
  double off = 0.0, total = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    total += power[i];
    if (between_harmonics(static_cast<double>(i) * bin, hz, bin)) off += power[i];
  }
  return total > 0.0 ? off / total : 0.0;
}

// The strongest component between `lo` and `hi` Hz that is not a harmonic of
// `hz`, against the fundamental, in dB.
static double worst_alias_db(const std::vector<float>& x, double rate, double hz, double lo, double hi,
                             size_t from, size_t n = 16384) {
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = rate / static_cast<double>(n);
  double worst = 0.0, fundamental = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    const double f = static_cast<double>(i) * bin;
    if (std::fabs(f - hz) < 4.0 * bin) fundamental = std::max(fundamental, power[i]);
    if (f >= lo && f <= hi && between_harmonics(f, hz, bin)) worst = std::max(worst, power[i]);
  }
  return 10.0 * std::log10(worst / fundamental + 1.0e-30);
}

// Power in harmonics `first`..`last` of `hz` over [from, to).
static double harmonic_power(const std::vector<float>& x, double hz, int first, int last, size_t from,
                             size_t to) {
  double sum = 0.0;
  for (int n = first; n <= last; ++n) {
    const double level = tone_level(x, hz * n, kRate, from, to);
    sum += level * level;
  }
  return sum;
}

// How far the low-pass sits from where it sits in `reference`, in octaves,
// over [from, to): far above a two-pole corner the level goes with the square
// of the corner, so a band up there is 12.04 dB per octave of cutoff. Both
// renders play the same note, so the envelope and the moving pulse cancel.
static double cutoff_octaves(const std::vector<float>& x, const std::vector<float>& reference, double hz,
                             int first, int last, size_t from, size_t to) {
  const double ratio = harmonic_power(x, hz, first, last, from, to) /
                       harmonic_power(reference, hz, first, last, from, to);
  return 10.0 * std::log10(ratio) / 12.04;
}

// The same with the level taken out: the band against the fundamental, which
// sits far under the corner. For renders that differ in level too.
static double brightness_octaves(const std::vector<float>& x, const std::vector<float>& reference, double hz,
                                 int first, int last, size_t from, size_t to) {
  const double level = harmonic_power(x, hz, 1, 1, from, to) / harmonic_power(reference, hz, 1, 1, from, to);
  return cutoff_octaves(x, reference, hz, first, last, from, to) - 10.0 * std::log10(level) / 12.04;
}

// The level of the `hz` component in 50 ms steps from `from`.
static std::vector<float> level_trace(const std::vector<float>& x, double hz, size_t from, size_t to) {
  std::vector<float> trace;
  const size_t hop = 2400;
  for (size_t start = from; start + hop <= to && start + hop <= x.size(); start += hop) {
    trace.push_back(static_cast<float>(tone_level(x, hz, kRate, start, start + hop)));
  }
  return trace;
}

static std::vector<float> centred(std::vector<float> x) {
  const float centre = static_cast<float>(mean(x));
  for (float& v : x) v -= centre;
  return x;
}

// Render `samples` in blocks cut to the repeating pattern `sizes`.
static Stereo render_cut(Aurora& d, size_t samples, const std::vector<int>& sizes, size_t* which) {
  Stereo out;
  out.left.resize(samples);
  out.right.resize(samples);
  size_t done = 0;
  while (done < samples) {
    const int frames = static_cast<int>(
        std::min(static_cast<size_t>(sizes[(*which)++ % sizes.size()]), samples - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// A phrase with every kind of event in it: a chord, knobs moved while it
// sounds, more keys than there are voices, a release into sleep, knobs moved
// while asleep, a new note.
static Stereo phrase(Aurora& d, const std::vector<int>& sizes) {
  size_t which = 0;
  d.init(kRate);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kRing, 0.4f);
  d.note_on(1, 146.83f, 0.8f);
  d.note_on(2, 220.0f, 0.6f);
  Stereo out = render_cut(d, 9000, sizes, &which);
  d.set_param(p::kBrilliance, 3000.0f);
  d.set_param(p::kDetune, 20.0f);
  for (int n = 0; n < Aurora::kMaxVoices; ++n) d.note_on(3 + n, 164.81f * static_cast<float>(n + 2), 0.9f);
  out = concat(out, render_cut(d, 7001, sizes, &which));
  for (int n = 1; n < 3 + Aurora::kMaxVoices; ++n) d.note_off(n);
  out = concat(out, render_cut(d, 24000, sizes, &which));  // falls asleep in here
  d.set_param(p::kBrilliance, 700.0f);
  d.set_param(p::kVolume, -3.0f);
  d.note_on(4, 196.0f, 0.7f);
  return concat(out, render_cut(d, 9999, sizes, &which));
}

static double largest_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0;
}

int main() {
  char label[200];

  Conformance spec;
  spec.name = "aurora";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Pitch: in tune from C2 to C6 at every sample rate with Detune at 0. The
  // moving pulse leans on the phase of layer II as its width changes (a few
  // cents either way at C2, which is what pulse-width motion is), so the
  // window is two turns of the first voice's width cycle, where that is nil.
  {
    double worst = 0.0;
    const double turns = 2.0 / Aurora::kPulseHz;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {65.406, 440.0, 1046.502}) {
        plain(device, rate);
        device.note_on(1, static_cast<float>(hz), 1.0f);
        const std::vector<float> out = mid(render(device, 7.2f, rate));
        const double found = peak_frequency(out, rate, hz - 0.5, hz + 0.5, 0.1, at(0.5, rate), at(0.5 + turns, rate));
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
    std::snprintf(label, sizeof label, "C2, A4 and C6 are within 3 cents at 44.1, 48 and 96 kHz (worst %.3f)",
                  worst);
    EXPECT(worst < 3.0, label);
  }

  // Detune: the two layers sit the gap apart, half below and half above, so
  // the centre is in tune at the default setting.
  {
    plain(device);
    device.set_param(p::kDetune, 8.0f);
    device.note_on(1, 440.0f, 1.0f);
    const std::vector<float> out = mid(render(device, 3.2f, kRate));
    const Layers layers = layer_peaks(out, 3520.0, 14.0, at(1.0), at(3.0));
    EXPECT_NEAR(layers.gap(), 8.0, 1.0, "Detune 8: the layers are 8 cents apart");
    EXPECT_NEAR(layers.centre(3520.0), 0.0, 3.0, "Detune 8: their centre is within 3 cents of the note");
  }

  // The layers beat at the rate the gap gives: 220 Hz and 10 cents is
  // 220 x (2^(10/1200) - 1) = 1.27 Hz on the fundamental. Twice the gap is
  // twice the rate, and no gap is no beat.
  {
    double depth[3] = {0.0, 0.0, 0.0};
    const float gaps[3] = {10.0f, 20.0f, 0.0f};
    const double beat = 220.0 * (std::pow(2.0, 10.0 / 1200.0) - 1.0);
    for (int k = 0; k < 3; ++k) {
      plain(device);
      device.set_param(p::kDetune, gaps[k]);
      device.note_on(1, 220.0f, 1.0f);
      const std::vector<float> out = mid(render(device, 21.0f, kRate));
      const std::vector<float> trace = level_trace(out, 220.0, at(1.0), at(21.0));
      if (k < 2) {
        const double rate = dominant_frequency(centred(trace), 20.0, 0.3, 6.0);
        EXPECT_NEAR(rate, beat * (k + 1), 0.1 * (k + 1),
                    k == 0 ? "Detune 10 at A3 beats at 1.27 Hz" : "Detune 20 at A3 beats at 2.55 Hz");
      }
      // How deep the fundamental's level moves at the 1.27 Hz rate.
      depth[k] = tone_level(centred(trace), beat, 20.0) / mean(trace);
    }
    EXPECT(depth[0] > 0.3, "the beat is deep: the layers are near equal on the fundamental");
    EXPECT(depth[2] < 0.1 * depth[0], "Detune 0 does not beat");
  }

  // Voices are not tuned alike: the same key on two voices is a few cents
  // apart, and exactly together with Detune at 0.
  {
    double centre[2][2];
    const float gaps[2] = {12.0f, 0.0f};
    for (int g = 0; g < 2; ++g) {
      for (int voice = 0; voice < 2; ++voice) {
        plain(device);
        device.set_param(p::kDetune, gaps[g]);
        device.note_on(1, 440.0f, 1.0f);
        if (voice == 1) {
          // The second key takes the second voice; the first then goes.
          device.note_on(2, 440.0f, 1.0f);
          device.note_off(1);
        }
        const std::vector<float> out = mid(render(device, 3.2f, kRate));
        if (g == 0) {
          centre[g][voice] = layer_peaks(out, 3520.0, 18.0, at(1.0), at(3.0)).centre(3520.0);
        } else {
          centre[g][voice] = cents(peak_frequency(out, kRate, 3510.0, 3530.0, 0.5, at(1.0), at(3.0)), 3520.0);
        }
      }
    }
    const double apart = std::fabs(centre[0][0] - centre[0][1]);
    std::snprintf(label, sizeof label, "two voices on one key are 1 to 6 cents apart at Detune 12 (%.2f)", apart);
    EXPECT(apart > 1.0 && apart < 6.0, label);
    EXPECT(std::fabs(centre[1][0] - centre[1][1]) < 0.1 && std::fabs(centre[1][0]) < 0.1,
           "and exactly together and in tune at Detune 0");
  }

  // Two-pole filters. Against the same note with the filter out of the way,
  // the response falls 12 dB per octave above Brilliance and below Low cut.
  {
    const double hz = 55.0;
    plain(device);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    const std::vector<float> open = mid(render(device, 1.6f, kRate));

    plain(device);
    device.set_param(p::kBrilliance, 200.0f);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    const std::vector<float> dark = mid(render(device, 1.6f, kRate));
    // Layer II's corner, the higher of the two.
    const double corner = tracked(200.0, hz) * Aurora::kLayerTwoBright;
    const int two = static_cast<int>(std::round(4.0 * corner / hz));
    const int three = 2 * two;
    auto response = [&](const std::vector<float>& x, const std::vector<float>& ref, int n) {
      return db(tone_level(x, hz * n, kRate, at(0.5), at(1.5)) / tone_level(ref, hz * n, kRate, at(0.5), at(1.5)));
    };
    EXPECT_NEAR(response(dark, open, two) - response(dark, open, three), 12.0, 1.0,
                "low-pass: 12 dB per octave from two to three octaves above the corner");
    // Where the corner rests: two octaves above layer II's corner a two-pole
    // filter is 24 dB down, and layer I, a fifth lower, 31 dB down.
    const double resting = response(dark, open, two);
    std::snprintf(label, sizeof label, "low-pass: the corner rests where Brilliance and the key put it (%.1f dB)",
                  resting);
    EXPECT(resting < -23.0 && resting > -32.0, label);

    plain(device);
    device.set_param(p::kLowCut, 2000.0f);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    const std::vector<float> thin = mid(render(device, 1.6f, kRate));
    // Layer I's corner, the lower of the two: 917 Hz. 110 and 220 Hz are
    // three and two octaves below it.
    const double low_corner = tracked(2000.0, hz);
    const int below = static_cast<int>(std::round(low_corner / 4.0 / hz));
    EXPECT_NEAR(response(thin, open, below) - response(thin, open, below / 2), 12.0, 1.0,
                "high-pass: 12 dB per octave from three to two octaves below the corner");
  }

  // The two filters make a band: with the high-pass at 400 Hz and the
  // low-pass at 1.5 kHz, C2's fundamental is far below the strongest
  // harmonic. Both corners follow the keyboard by half, so two octaves under
  // middle C that is Low cut at 800 Hz and Brilliance at 3 kHz.
  {
    plain(device);
    device.set_param(p::kLowCut, static_cast<float>(400.0 / tracked(1.0, 65.406)));
    device.set_param(p::kBrilliance, static_cast<float>(1500.0 / tracked(1.0, 65.406)));
    device.set_param(p::kResonance, 0.6f);
    device.note_on(1, 65.406f, 1.0f);
    const std::vector<float> out = mid(render(device, 1.6f, kRate));
    double strongest = 0.0;
    for (int n = 2; n <= 40; ++n) {
      strongest = std::max(strongest, tone_level(out, 65.406 * n, kRate, at(0.5), at(1.5)));
    }
    const double under = db(strongest / tone_level(out, 65.406, kRate, at(0.5), at(1.5)));
    std::snprintf(label, sizeof label, "band: C2's fundamental is 18 dB under the strongest harmonic (%.1f dB)",
                  under);
    EXPECT(under > 18.0, label);
  }

  // Resonance lifts what sits on the low-pass corner.
  {
    const double hz = 110.0;
    // Put layer I's corner on the sixth harmonic.
    const float brilliance = static_cast<float>(660.0 / tracked(1.0, hz));
    double lift[2];
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kBrilliance, brilliance);
      device.set_param(p::kResonance, k == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      const std::vector<float> out = mid(render(device, 1.6f, kRate));
      lift[k] = db(tone_level(out, 660.0, kRate, at(0.5), at(1.5)) / tone_level(out, 110.0, kRate, at(0.5), at(1.5)));
    }
    std::snprintf(label, sizeof label, "Resonance lifts the harmonic on the corner by 6 dB or more (%.1f dB)",
                  lift[1] - lift[0]);
    EXPECT(lift[1] - lift[0] > 6.0, label);
  }

  // The contour: the low-pass starts below where it rests, reaches its peak
  // above it at the Attack time, and comes back. Measured against the same
  // note with Contour at 0, in octaves of cutoff, from harmonics 28 to 40 of
  // A2 (3 to 4.4 kHz, two octaves or more above the corner at its peak).
  {
    const double hz = 110.0;
    const float amount = 0.5f, attack = 1.0f;
    auto note = [&](float contour) {
      plain(device);
      device.set_param(p::kBrilliance, 400.0f);
      device.set_param(p::kAttack, attack);
      device.set_param(p::kContour, contour);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      return mid(render(device, 9.6f, kRate));
    };
    const std::vector<float> still = note(0.0f);
    const std::vector<float> moving = note(amount);
    const double start = amount * -Aurora::kContourStart, top = amount * Aurora::kContourPeak;

    // 50 to 100 ms in: 7.5 % of the way from the start to the peak.
    const double early = cutoff_octaves(moving, still, hz, 28, 40, at(0.05), at(0.1));
    EXPECT_NEAR(early, start + (top - start) * 0.075, 0.3, "contour: a note starts 1.5 octaves under its rest");

    double highest = -100.0, when = 0.0;
    for (double t = 0.1; t < 3.0; t += 0.05) {
      const double octaves = cutoff_octaves(moving, still, hz, 28, 40, at(t), at(t + 0.05));
      if (octaves > highest) {
        highest = octaves;
        when = t + 0.025;
      }
    }
    EXPECT_NEAR(highest, top, 0.3, "contour: it overshoots to an octave above its rest");
    EXPECT_NEAR(when, attack, 0.2 * attack, "contour: the peak arrives at the Attack time");
    const double late = cutoff_octaves(moving, still, hz, 28, 40, at(9.0), at(9.5));
    EXPECT_NEAR(late, 0.0, 0.15, "contour: and settles back on its rest");

    // On release it goes back towards where it started.
    plain(device);
    device.set_param(p::kBrilliance, 400.0f);
    device.set_param(p::kContour, amount);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    render(device, 6.0f, kRate);
    const std::vector<float> held = mid(render(device, 0.4f, kRate));
    device.note_off(1);
    const std::vector<float> fading = mid(render(device, 1.0f, kRate));
    // Harmonics 10 to 20 against the fundamental, 0.6 to 1 s into a 2 s
    // release: the glide has a time constant of 0.8 s and 1.5 octaves to go.
    auto tilt = [&](const std::vector<float>& x, size_t from, size_t to) {
      return 10.0 * std::log10(harmonic_power(x, hz, 10, 20, from, to) / harmonic_power(x, hz, 1, 1, from, to));
    };
    const double darker = (tilt(fading, at(0.6), at(1.0)) - tilt(held, 0, at(0.4))) / 12.04;
    EXPECT_NEAR(darker, amount * -Aurora::kContourStart * (1.0 - std::exp(-1.0)), 0.3,
                "contour: a note darkens by about an octave as it is released");

    // With Contour at 0 the filter does not move at all: against the open
    // filter the band is level from the first tenth of a second on.
    plain(device);
    device.set_param(p::kAttack, attack);
    device.note_on(1, static_cast<float>(hz), 1.0f);
    const std::vector<float> open = mid(render(device, 3.2f, kRate));
    double lowest = 100.0, highest_still = -100.0;
    for (double t = 0.1; t < 3.0; t += 0.1) {
      const double octaves = cutoff_octaves(still, open, hz, 28, 40, at(t), at(t + 0.1));
      lowest = std::min(lowest, octaves);
      highest_still = std::max(highest_still, octaves);
    }
    EXPECT(highest_still - lowest < 0.1, "Contour 0: the filter stays where it is");
  }

  // Swell: a held note keeps growing louder and brighter after its attack.
  {
    const double hz = 220.0;
    auto note = [&](float swell) {
      plain(device);
      device.set_param(p::kBrilliance, 1100.0f);
      device.set_param(p::kAttack, 0.4f);
      device.set_param(p::kSwell, swell);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      return mid(render(device, 13.0f, kRate));
    };
    const std::vector<float> flat = note(0.0f);
    const std::vector<float> grown = note(0.7f);
    const double rise = db(rms(grown, at(3.9), at(4.1)) / rms(grown, at(0.9), at(1.1)));
    std::snprintf(label, sizeof label, "Swell 0.7: louder at 4 s than at 1 s by 1.5 dB or more (%.1f dB)", rise);
    EXPECT(rise > 1.5, label);
    // Harmonics 20 to 30 (4.4 to 6.6 kHz) against the note without swell.
    const double at_one = brightness_octaves(grown, flat, hz, 20, 30, at(0.9), at(1.1));
    const double at_four = brightness_octaves(grown, flat, hz, 20, 30, at(3.9), at(4.1));
    std::snprintf(label, sizeof label, "Swell 0.7: brighter at 4 s than at 1 s (%.2f and %.2f octaves up)",
                  at_one, at_four);
    EXPECT(at_four > at_one + 0.4 && at_one > 0.1, label);
    // The plateau: Swell x 1.5 octaves, reached within a few time constants.
    EXPECT_NEAR(brightness_octaves(grown, flat, hz, 20, 30, at(12.0), at(12.5)), 0.7 * Aurora::kSwellOctaves, 0.15,
                "Swell 0.7: the low-pass ends about an octave above its rest");
    EXPECT_NEAR(db(rms(flat, at(3.9), at(4.1)) / rms(flat, at(0.9), at(1.1))), 0.0, 1.0,
                "Swell 0: a held note stays as it is");
    // More Swell starts lower; it does not end louder at the fundamental.
    EXPECT(rms(grown, at(0.9), at(1.1)) < 0.85 * rms(flat, at(0.9), at(1.1)),
           "Swell holds a note back at first");
  }

  // Ring: a sweep of sum and difference tones at the start of a note, gone
  // once its envelope has passed, and absent with Ring at 0.
  {
    const double hz = 220.0;
    auto note = [&](float ring) {
      plain(device);
      device.set_param(p::kRing, ring);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      return mid(render(device, 6.0f, kRate));
    };
    const std::vector<float> clean = note(0.0f);
    const std::vector<float> rung = note(0.8f);
    const double onset = off_grid_share(rung, kRate, hz, at(0.05));
    const double later = off_grid_share(rung, kRate, hz, at(1.0));
    const double gone = off_grid_share(rung, kRate, hz, at(5.0));
    std::snprintf(label, sizeof label, "Ring 0.8: inharmonic tones at the onset (%.1f dB of the sound)",
                  10.0 * std::log10(onset));
    EXPECT(onset > 0.05, label);
    EXPECT(later < 0.2 * onset, "Ring: they fade");
    std::snprintf(label, sizeof label, "Ring: and are 50 dB down once the sweep is over (%.1f dB)",
                  10.0 * std::log10(gone + 1.0e-30));
    EXPECT(gone < 1.0e-5, label);
    std::snprintf(label, sizeof label, "Ring 0: nothing inharmonic from the start (%.1f dB)",
                  10.0 * std::log10(off_grid_share(clean, kRate, hz, at(0.05)) + 1.0e-30));
    EXPECT(off_grid_share(clean, kRate, hz, at(0.05)) < 1.0e-5, label);
  }

  // The ring falls in pitch as it fades. With Ring under a half the voice's
  // gain never crosses zero, so the outline of a high note swings at the ring
  // frequency: 35 Hz times 2^(5.32 x its envelope), which decays with a time
  // constant of 0.35 s plus 1.2 times the Attack.
  {
    const float attack = 2.0f;
    plain(device);
    device.set_param(p::kRing, 0.4f);
    device.set_param(p::kAttack, attack);
    device.note_on(1, 3520.0f, 1.0f);
    std::vector<float> outline = mid(render(device, 3.0f, kRate));
    for (float& v : outline) v = std::fabs(v);
    const double decay = Aurora::kRingSeconds + Aurora::kRingPerAttack * attack;
    auto ring_hz = [&](double t) {
      return Aurora::kRingEndHz * std::pow(2.0, Aurora::kRingOctaves * std::exp(-t / decay));
    };
    // The search starts above the rise of the attack, which is the strongest
    // thing in so short a stretch.
    const double early = dominant_frequency(outline, kRate, 200.0, 2500.0, at(0.225), at(0.275));
    const double later = dominant_frequency(outline, kRate, 50.0, 2500.0, at(2.65), at(2.85));
    EXPECT_NEAR(early, ring_hz(0.25), 0.05 * ring_hz(0.25), "Ring: a quarter second in the sweep is near 1 kHz");
    EXPECT_NEAR(later, ring_hz(2.75), 0.05 * ring_hz(2.75), "Ring: one time constant on it has fallen to 136 Hz");
  }

  // Note gain is level and brightness together.
  {
    std::vector<float> out[2];
    const float gains[2] = {1.0f, 0.3f};
    for (int k = 0; k < 2; ++k) {
      plain(device);
      device.set_param(p::kBrilliance, 1100.0f);
      device.note_on(1, 220.0f, gains[k]);
      out[k] = mid(render(device, 1.0f, kRate));
    }
    const double quieter = db(rms(out[1], at(0.5)) / rms(out[0], at(0.5)));
    std::snprintf(label, sizeof label, "a note at gain 0.3 is 3 dB or more quieter than one at 1 (%.1f dB)", quieter);
    EXPECT(quieter < -3.0, label);
    // 0.7 of the way down the gain range closes the low-pass by 1.05 octaves.
    EXPECT_NEAR(brightness_octaves(out[1], out[0], 220.0, 20, 30, at(0.5), at(1.0)),
                -0.7 * Aurora::kVelocityOctaves, 0.15, "and an octave darker");
  }

  // No aliasing to hear: C6 with the filters wide open, the worst case, has
  // nothing between its harmonics within 50 dB of the fundamental up to
  // 20 kHz, and all of it together, over the whole band, is 50 dB under the
  // sound. At the default Brilliance the filters take the rest.
  for (float rate : {44100.0f, 48000.0f}) {
    plain(device, rate);
    device.note_on(1, 1046.502f, 1.0f);
    std::vector<float> out = mid(render(device, 1.0f, rate));
    const double open = worst_alias_db(out, rate, 1046.502, 20.0, 20000.0, at(0.3, rate));
    std::snprintf(label, sizeof label,
                  "C6 at %.1f kHz, wide open: aliases are 50 dB under the fundamental (%.1f dB)", rate / 1000.0, open);
    EXPECT(open < -50.0, label);
    const double share = 10.0 * std::log10(off_grid_share(out, rate, 1046.502, at(0.3, rate)) + 1.0e-30);
    std::snprintf(label, sizeof label,
                  "C6 at %.1f kHz, wide open: all that is not a harmonic is 50 dB under the sound (%.1f dB)",
                  rate / 1000.0, share);
    EXPECT(share < -50.0, label);
    plain(device, rate);
    device.set_param(p::kBrilliance, 1100.0f);
    device.note_on(1, 1046.502f, 1.0f);
    out = mid(render(device, 1.0f, rate));
    const double usual = worst_alias_db(out, rate, 1046.502, 20.0, 20000.0, at(0.3, rate));
    std::snprintf(label, sizeof label, "C6 at %.1f kHz, default Brilliance: 75 dB under (%.1f dB)", rate / 1000.0, usual);
    EXPECT(usual < -75.0, label);
  }

  // Attack and release are the times they say.
  {
    plain(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, at(1.5), at(2.0));
    EXPECT(rms(rise.left, 0, at(0.1)) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, at(1.1), at(1.2)) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, at(0.4), at(0.5)) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, at(1.0), at(1.1)) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, at(2.0)) == 0.0 && peak(fall.right, at(2.0)) == 0.0, "and is exactly silent soon after");
  }

  // Stereo: the layers lean apart, and the sum does not cancel.
  {
    device.init(kRate);
    device.note_on(1, 146.83f, 0.8f);
    device.note_on(2, 220.0f, 0.8f);
    device.note_on(3, 349.23f, 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const double together = correlation(out.left, out.right, at(1.0));
    const double width = db(rms(side(out), at(1.0)) / rms(mid(out), at(1.0)));
    std::snprintf(label, sizeof label,
                  "a chord is wide but mono-compatible (correlation %.3f, side %.1f dB under mid)", together, -width);
    EXPECT(together < 0.995 && together > 0.5 && width < -6.0, label);

    plain(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo narrow = render(device, 1.0f, kRate);
    EXPECT(rms(side(narrow), at(0.5)) < rms(mid(narrow), at(0.5)), "one in-tune voice still sums in mono");
  }

  // No clicks: a moved knob, a stolen voice, a re-struck key, a released key.
  {
    device.init(kRate);
    device.set_param(p::kBrilliance, 3000.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 6.0f, kRate);
    const double reference = max_step(render(device, 0.5f, kRate).left);
    Stereo moving;
    for (int block = 0; block < 100; ++block) {
      device.set_param(p::kBrilliance, block % 2 == 0 ? 400.0f : 3000.0f);
      device.set_param(p::kVolume, block % 2 == 0 ? -18.0f : -9.0f);
      moving = concat(moving, render(device, 0.01f, kRate));
    }
    EXPECT(max_step(moving.left) < 1.5 * reference, "Brilliance and Volume jumps are smoothed");

    // The other knobs, moved through the first second and a half of a note,
    // while its contour, swell and ring are all under way: against the same
    // note with the knobs left at either end (modes 0 and 1; mode 2 swaps
    // them every 10 ms).
    auto life = [&](int mode, bool with_ring) {
      device.init(kRate);
      device.note_on(1, 220.0f, 1.0f);
      Stereo out;
      for (int block = 0; block < 150; ++block) {
        const bool odd = mode == 2 ? block % 2 == 1 : mode == 1;
        device.set_param(p::kLowCut, odd ? 40.0f : 300.0f);
        device.set_param(p::kResonance, odd ? 0.7f : 0.25f);
        device.set_param(p::kContour, odd ? 0.6f : 0.0f);
        device.set_param(p::kSwell, odd ? 0.7f : 0.2f);
        device.set_param(p::kDetune, odd ? 20.0f : 8.0f);
        device.set_param(p::kRing, with_ring ? (odd ? 0.0f : 0.5f) : 0.0f);
        out = concat(out, render(device, 0.01f, kRate));
      }
      return max_step(out.left);
    };
    for (bool with_ring : {false, true}) {
      const double ends = std::max(life(0, with_ring), life(1, with_ring));
      const double moved = life(2, with_ring);
      std::snprintf(label, sizeof label, "%s jumps do not click (%.2f)",
                    with_ring ? "Ring" : "Low cut, Resonance, Contour, Swell and Detune", moved / ends);
      EXPECT(moved < 1.5 * ends, label);
    }

    device.init(kRate);
    for (int n = 0; n < Aurora::kMaxVoices; ++n) {
      device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.9f);
    }
    render(device, 6.0f, kRate);
    const double chord = max_step(render(device, 0.5f, kRate).left);
    device.note_on(20, 277.18f, 0.9f);  // steals the oldest voice
    Stereo stolen = render(device, 0.2f, kRate);
    EXPECT(max_step(stolen.left) < 1.5 * chord && max_step(stolen.right) < 1.5 * chord,
           "a stolen voice fades instead of stopping");
    device.note_on(3, 110.0f * std::pow(2.0f, 9.0f / 12.0f), 0.9f);  // a key that is held
    Stereo restruck = render(device, 0.2f, kRate);
    EXPECT(max_step(restruck.left) < 1.5 * chord, "a re-struck key does not click");
    device.set_param(p::kRelease, 0.05f);
    for (int n = 0; n < Aurora::kMaxVoices; ++n) device.note_off(n);
    device.note_off(20);
    Stereo released = render(device, 0.3f, kRate);
    EXPECT(max_step(released.left) < 1.5 * chord, "the shortest release does not click");
  }

  // A stolen voice plays its new note once the old one has faded, which
  // takes milliseconds whatever the Release (3 s here); a note released
  // before that never sounds, and nothing is left hanging.
  {
    auto fill = [&] {
      plain(device);
      device.set_param(p::kBrilliance, 1100.0f);
      device.set_param(p::kRelease, 3.0f);
      for (int n = 0; n < Aurora::kMaxVoices; ++n) device.note_on(n, 110.0f * static_cast<float>(n + 1), 1.0f);
      render(device, 0.5f, kRate);
    };
    fill();
    device.note_on(50, 1234.0f, 1.0f);
    const std::vector<float> taken = mid(render(device, 0.5f, kRate));
    fill();
    device.note_on(50, 1234.0f, 1.0f);
    device.note_off(50);
    const std::vector<float> dropped = mid(render(device, 0.5f, kRate));
    const double sounding = tone_level(taken, 1234.0, kRate, at(0.02), at(0.12));
    const double absent = tone_level(dropped, 1234.0, kRate, at(0.02), at(0.12));
    std::snprintf(label, sizeof label,
                  "a stolen voice plays its new note within 20 ms; one released during the fade does not (%.1f dB apart)",
                  db(sounding / absent));
    EXPECT(sounding > 20.0 * absent, label);
    device.set_param(p::kRelease, 0.05f);
    for (int n = 0; n < Aurora::kMaxVoices; ++n) device.note_off(n);
    render(device, 1.0f, kRate);
    Stereo after = render(device, 0.2f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and every voice is free afterwards");
  }

  // Levels at the default patch.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 8.0f, kRate);
    const double level_db = db(std::max(peak(out.left), peak(out.right)));
    std::snprintf(label, sizeof label, "one note at gain 0.7 peaks between -24 and -10 dBFS (%.1f)", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0, label);

    // The app plays at gain 0.8 and wants -22 to -16 dBFS, early in the
    // swell and once it has arrived, low and high.
    for (float hz : {65.406f, 220.0f, 1046.502f}) {
      device.init(kRate);
      device.note_on(1, hz, 0.8f);
      out = render(device, 8.0f, kRate);
      const double early = db(std::max(peak(out.left, at(1.0), at(2.0)), peak(out.right, at(1.0), at(2.0))));
      const double arrived = db(std::max(peak(out.left, at(5.0)), peak(out.right, at(5.0))));
      std::snprintf(label, sizeof label, "%.0f Hz at gain 0.8 peaks between -22 and -16 dBFS (%.1f, then %.1f)", hz,
                    early, arrived);
      EXPECT(early > -22.0 && early < -16.0 && arrived > -22.0 && arrived < -16.0, label);
    }

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.8f);
    out = render(device, 8.0f, kRate);
    std::snprintf(label, sizeof label, "ten held notes stay under the clip knee (%.3f)",
                  std::max(peak(out.left), peak(out.right)));
    EXPECT(peak(out.left) < 0.5 && peak(out.right) < 0.5, label);
  }

  // The output does not depend on how the host cuts time into blocks, also
  // across a sleep.
  {
    const Stereo usual = phrase(device, {128});
    const Stereo single = phrase(device, {1});
    const Stereo ragged = phrase(device, {1, 7, 64, 128, 33, 512, 2048, 5});
    std::snprintf(label, sizeof label, "blocks of 1 and ragged blocks render what 128-frame blocks do (%g, %g)",
                  largest_difference(usual, single), largest_difference(usual, ragged));
    EXPECT(largest_difference(usual, single) < 1.0e-6 && largest_difference(usual, ragged) < 1.0e-6, label);
    EXPECT(peak(usual.left, at(0.6), at(0.8)) == 0.0, "the phrase is silent in the middle, long enough to sleep");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < Aurora::kMaxVoices; ++n) {
    device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 2) / 12.0f), 0.8f);
  }
  report_cost("aurora (8 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("aurora");
}
