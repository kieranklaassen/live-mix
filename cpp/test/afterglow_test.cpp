// Native harness for Afterglow (cpp/devices/afterglow). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it this instrument: a
// strike that rings for Decay, a glow at exactly the strike's partials that
// rises over Bloom, holds with the key and falls over Fade, and what Tone,
// Halo, Evolve, Drift and Width do to it.
//
// Nobody has listened to this device. Every claim below is a measurement.

#include "../devices/afterglow/afterglow.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Afterglow;
namespace p = livemix::afterglow;

static Afterglow device;
static Afterglow other;
static char label[240];

static const float kRate = 48000.0f;
static const float kC4 = 261.6256f;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

// A still, plain voice: no beating, no wandering, no halo, mono, unity level.
static void bare(Afterglow& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kEvolve, 0.0f);
  d.set_param(p::kHalo, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}
static void strike_only(Afterglow& d, float rate = kRate) {
  bare(d, rate);
  d.set_param(p::kGlow, 0.0f);
}
static void glow_only(Afterglow& d, float rate = kRate) {
  bare(d, rate);
  d.set_param(p::kStrike, 0.0f);
}

// The strongest frequency within `span` (a share) of `expected`: a scan one
// window-resolution apart, then a ternary search on the best lobe.
static double peak_hz(const std::vector<float>& x, double expected, double rate, size_t from, size_t to,
                      double span = 0.02) {
  to = std::min(to, x.size());
  const double resolution = rate / static_cast<double>(to - from);
  const double lo = expected * (1.0 - span), hi = expected * (1.0 + span);
  double best_hz = expected, best = -1.0;
  const int steps = std::max(2, static_cast<int>(std::ceil((hi - lo) / resolution)));
  for (int i = 0; i <= steps; ++i) {
    const double hz = lo + (hi - lo) * i / steps;
    const double level = tone_level(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  double a = best_hz - resolution, b = best_hz + resolution;
  for (int pass = 0; pass < 40; ++pass) {
    const double m1 = a + (b - a) / 3.0, m2 = b - (b - a) / 3.0;
    if (tone_level(x, m1, rate, from, to) < tone_level(x, m2, rate, from, to)) {
      a = m1;
    } else {
      b = m2;
    }
  }
  return 0.5 * (a + b);
}

// The level of the `hz` component over time, in dB: one value per `hop`
// seconds from Hann windows of `window` seconds.
static std::vector<double> track(const std::vector<float>& x, double hz, double from, double to, double window,
                                 double hop, double rate = kRate) {
  std::vector<double> out;
  for (double t = from; t + window <= to + 1.0e-9; t += hop) {
    out.push_back(db(tone_level(x, hz, rate, at(t, rate), at(t + window, rate))));
  }
  return out;
}

// The same for the whole signal: RMS per window, in dB.
static std::vector<double> rms_track(const std::vector<float>& x, double from, double to, double window, double hop) {
  std::vector<double> out;
  for (double t = from; t + window <= to + 1.0e-9; t += hop) out.push_back(db(rms(x, at(t), at(t + window))));
  return out;
}

static double span_of(const std::vector<double>& values) {
  return *std::max_element(values.begin(), values.end()) - *std::min_element(values.begin(), values.end());
}

// Seconds to fall 60 dB, from a straight line through a level track in dB.
static double fall_time(const std::vector<double>& levels, double hop) {
  double n = 0, st = 0, sd = 0, stt = 0, std_ = 0;
  for (size_t i = 0; i < levels.size(); ++i) {
    const double t = static_cast<double>(i) * hop;
    n += 1;
    st += t;
    sd += levels[i];
    stt += t * t;
    std_ += t * levels[i];
  }
  const double slope = (n * std_ - st * sd) / (n * stt - st * st);
  return slope < 0.0 ? -60.0 / slope : 0.0;
}

// How fast a level track goes round, in Hz: the strongest component of the
// track itself near `expected`.
static double beat_rate(const std::vector<double>& levels_db, double hop, double expected, double span = 0.3) {
  std::vector<float> power(levels_db.size());
  double sum = 0.0;
  for (size_t i = 0; i < power.size(); ++i) {
    power[i] = static_cast<float>(std::pow(10.0, levels_db[i] / 10.0));
    sum += power[i];
  }
  for (float& v : power) v -= static_cast<float>(sum / static_cast<double>(power.size()));
  return peak_hz(power, expected, 1.0 / hop, 0, power.size(), span);
}

// How much of what an event changes is already there after 8 samples: the
// same passage rendered with and without the event, the largest difference
// in the first 8 samples over the largest in the next 20 ms. A faded or
// smoothed event has moved a small part of the way; a jump is there at once.
// The worst of eight moments a little apart.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 2.5f + 0.0013f * static_cast<float>(trial), kRate);
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

// The third difference: a band-limited tone leaves almost nothing in it, a
// step or a kink leaves about its own size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

static Stereo render_ragged(Afterglow& d, size_t total) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
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

// Render exactly `total` frames in blocks of `block` (0 = ragged).
static Stereo render_frames(Afterglow& d, size_t total, int block) {
  if (block == 0) return render_ragged(d, total);
  return run(d, std::vector<float>(total, 0.0f), block);
}

static double largest_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0e9;
}

// --- what makes it this instrument ----------------------------------------------------------

// Strike and glow both sound the played note, at three sample rates.
static void test_tuning() {
  double worst_strike = 0.0, worst_glow = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hz : {27.5f, 110.0f, 440.0f, 1760.0f, 4186.0f}) {
      strike_only(device, rate);
      device.set_param(p::kDecay, 8.0f);
      device.note_on(1, hz, 0.8f);
      Stereo struck = render(device, 1.3f, rate);
      worst_strike = std::max(
          worst_strike, std::fabs(cents(peak_hz(struck.left, hz, rate, at(0.1, rate), at(1.3, rate), 0.015), hz)));
      glow_only(device, rate);
      device.set_param(p::kBloom, 0.3f);
      device.note_on(1, hz, 0.8f);
      Stereo held = render(device, 1.6f, rate);
      worst_glow = std::max(
          worst_glow, std::fabs(cents(peak_hz(held.left, hz, rate, at(0.4, rate), at(1.6, rate), 0.015), hz)));
    }
  }
  std::snprintf(label, sizeof label,
                "strike and glow are in tune from A0 to C8 at 44.1, 48 and 96 kHz (worst %.3f and %.3f cents)",
                worst_strike, worst_glow);
  EXPECT(worst_strike < 2.0 && worst_glow < 2.0, label);
  std::printf("tuning: strike within %.3f cents, glow within %.3f cents\n", worst_strike, worst_glow);
}

// Every source's partials sit at its table's ratios, and the glow's partials
// sit exactly where the strike's do, the inharmonic ones too.
static void test_partials() {
  for (int source = 0; source < Afterglow::kNumSources; ++source) {
    const Afterglow::SourceTable& table = Afterglow::source_table(source);
    double worst_table = 0.0, worst_pair = 0.0;
    strike_only(device);
    device.set_param(p::kSource, static_cast<float>(source));
    device.set_param(p::kDecay, 8.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo struck = render(device, 1.3f, kRate);
    glow_only(device);
    device.set_param(p::kSource, static_cast<float>(source));
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kTone, 0.85f);  // the upper partials loud enough to find
    device.note_on(1, kC4, 0.8f);
    Stereo held = render(device, 1.6f, kRate);
    for (int k = 0; k < Afterglow::kPartials; ++k) {
      const double expected = kC4 * Afterglow::partial_ratio(table, k);
      const double in_strike = peak_hz(struck.left, expected, kRate, at(0.1), at(1.3), 0.01);
      const double in_glow = peak_hz(held.left, expected, kRate, at(0.4), at(1.6), 0.01);
      worst_table = std::max(worst_table, std::fabs(cents(in_strike, expected)));
      worst_pair = std::max(worst_pair, std::fabs(cents(in_glow, in_strike)));
    }
    std::snprintf(label, sizeof label,
                  "source %d: eight partials at the table's ratios (%.3f cents) and the glow's on the strike's (%.3f cents)",
                  source, worst_table, worst_pair);
    EXPECT(worst_table < 2.0 && worst_pair < 2.0, label);
    std::printf("source %d: strike partials within %.3f cents of the table, glow within %.3f cents of the strike\n",
                source, worst_table, worst_pair);
  }
  // Felt is a stiff string: its eighth partial is sharp of the eighth harmonic
  // by what the stiffness says, worked out here and not by the device.
  const Afterglow::SourceTable& felt = Afterglow::source_table(Afterglow::kFelt);
  const double stretch = 1200.0 * std::log2(std::sqrt((1.0 + felt.stiffness * 64.0) / (1.0 + felt.stiffness)));
  strike_only(device);
  device.set_param(p::kDecay, 8.0f);
  device.note_on(1, kC4, 0.8f);
  Stereo string = render(device, 1.3f, kRate);
  const double eighth = cents(peak_hz(string.left, 8.0 * kC4, kRate, at(0.1), at(1.3), 0.03), 8.0 * kC4);
  std::snprintf(label, sizeof label, "Felt's eighth partial is %.2f cents sharp of the eighth harmonic (%.2f expected)",
                eighth, stretch);
  EXPECT(stretch > 15.0 && std::fabs(eighth - stretch) < 1.0, label);
  std::printf("%s\n", label);
  // The bell is inharmonic: its fifth partial is not a harmonic of anything played.
  const double fifth = Afterglow::partial_ratio(Afterglow::source_table(Afterglow::kBell), 4);
  EXPECT(std::fabs(cents(fifth, 4.0)) > 50.0, "the bell's upper partials are off the harmonic series");
}

// With Glow at 0 a note is a strike that rings out at Decay's rate.
static void test_decay() {
  double measured[2];
  const float decays[2] = {2.0f, 6.0f};
  for (int i = 0; i < 2; ++i) {
    strike_only(device);
    device.set_param(p::kDecay, decays[i]);
    device.note_on(1, kC4, 0.7f);
    Stereo out = render(device, decays[i] * 1.5f + 0.5f, kRate);
    measured[i] = fall_time(track(out.left, kC4, 0.1, 0.1 + 0.6 * decays[i], 0.1, 0.05), 0.05);
    if (i == 0) {
      // The fourth partial rings a shorter time, by the source's damping.
      const Afterglow::SourceTable& felt = Afterglow::source_table(Afterglow::kFelt);
      const double ratio = Afterglow::partial_ratio(felt, 3);
      const double upper = fall_time(track(out.left, kC4 * ratio, 0.05, 0.65, 0.1, 0.05), 0.05);
      const double expected = 2.0 / (1.0 + felt.damping * (ratio - 1.0));
      std::snprintf(label, sizeof label, "the fourth partial rings %.2f s where the first rings 2 s (expected %.2f)",
                    upper, expected);
      EXPECT_NEAR(upper, expected, 0.08 * expected, label);
      // And then it is over, with the key still down: exact silence.
      std::snprintf(label, sizeof label, "Glow 0: still ringing at 2.5 s (%g), exactly silent from 2.8 s (%g)",
                    both_peak(out, at(2.4), at(2.5)), both_peak(out, at(2.8)));
      EXPECT(both_peak(out, at(2.4), at(2.5)) > 0.0 && both_peak(out, at(2.8)) == 0.0, label);
    }
  }
  std::snprintf(label, sizeof label, "Decay 2 s and 6 s ring for %.2f s and %.2f s at middle C", measured[0],
                measured[1]);
  EXPECT(std::fabs(measured[0] - 2.0) < 0.1 && std::fabs(measured[1] - 6.0) < 0.3, label);
  // Two octaves up the same setting rings about two thirds as long.
  strike_only(device);
  device.set_param(p::kDecay, 2.0f);
  device.note_on(1, 4.0f * kC4, 0.7f);
  Stereo high = render(device, 2.0f, kRate);
  const double up = fall_time(track(high.left, 4.0 * kC4, 0.1, 0.9, 0.1, 0.05), 0.05);
  std::snprintf(label, sizeof label, "two octaves up, Decay 2 s rings %.2f s", up);
  EXPECT(up > 1.2 && up < 1.45, label);
  std::printf("decay: 2 s -> %.2f s, 6 s -> %.2f s at C4; 2 s -> %.2f s at C6\n", measured[0], measured[1], up);
}

// With Strike at 0 there is no attack, and the glow is there at about Bloom.
static void test_bloom() {
  for (float bloom : {0.3f, 0.6f, 3.0f}) {
    glow_only(device);
    device.set_param(p::kBloom, bloom);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, bloom * 2.0f + 1.5f, kRate);
    const double steady = rms(out.left, at(bloom * 2.0 + 0.5), at(bloom * 2.0 + 1.5));
    const double first = db(rms(out.left, 0, at(0.03)) / steady);
    const double quarter = db(rms(out.left, at(0.25 * bloom - 0.01), at(0.25 * bloom + 0.01)) / steady);
    const double arrived = db(rms(out.left, at(bloom), at(bloom + 0.05)) / steady);
    std::snprintf(label, sizeof label,
                  "Bloom %.1f s: first 30 ms %.1f dB under the glow, %.1f dB a quarter of the way, %.2f dB at Bloom",
                  bloom, first, quarter, arrived);
    EXPECT(first < -30.0 && quarter < -12.0 && quarter > -20.0 && std::fabs(arrived) < 1.0, label);
    std::printf("%s\n", label);
  }
}

// The glow is the strike as it stands a moment after the hit: the level of
// each partial against the first is the strike's at kMoment into a 3 s ring.
static void test_moment() {
  strike_only(device);
  device.set_param(p::kDecay, 3.0f);
  device.note_on(1, kC4, 0.7f);
  Stereo struck = render(device, 1.0f, kRate);
  glow_only(device);
  device.set_param(p::kBloom, 0.3f);
  device.note_on(1, kC4, 0.7f);
  Stereo held = render(device, 2.0f, kRate);
  const Afterglow::SourceTable& felt = Afterglow::source_table(Afterglow::kFelt);
  double worst = 0.0, tilt = 0.0;
  for (int k = 1; k < 5; ++k) {
    const double hz = kC4 * Afterglow::partial_ratio(felt, k);
    const double in_strike = db(tone_level(struck.left, hz, kRate, at(0.2), at(0.4)) /
                                tone_level(struck.left, kC4, kRate, at(0.2), at(0.4)));
    const double in_glow =
        db(tone_level(held.left, hz, kRate, at(1.0), at(2.0)) / tone_level(held.left, kC4, kRate, at(1.0), at(2.0)));
    const double at_hit = db(tone_level(struck.left, hz, kRate, at(0.0), at(0.06)) /
                             tone_level(struck.left, kC4, kRate, at(0.0), at(0.06)));
    worst = std::max(worst, std::fabs(in_glow - in_strike));
    if (k == 4) tilt = at_hit - in_glow;
  }
  std::snprintf(label, sizeof label,
                "the glow's partials 2 to 5 stand as the strike's do 0.3 s after the hit (within %.2f dB); the fifth is %.1f dB under where the hit had it",
                worst, tilt);
  EXPECT(worst < 1.0 && tilt > 4.0, label);
  std::printf("%s\n", label);
}

// Evolve: single partials rise and fall by several dB, each on its own, the
// whole keeps its level, and the played note's own partial stays near where
// it was: the colour moves, the pitch does not.
static void test_evolve() {
  double spans[2][3], whole[2], apart = 0.0, played_fall = 0.0, overtaken = 0.0;
  const Afterglow::SourceTable& bell = Afterglow::source_table(Afterglow::kBell);
  std::vector<double> still[3];
  for (int pass = 0; pass < 2; ++pass) {
    glow_only(device);
    device.set_param(p::kSource, Afterglow::kBell);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kEvolve, pass == 0 ? 0.0f : 1.0f);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 63.0f, kRate);
    // The prime (the played note), the nominal an octave up, and the partial at 3.01.
    std::vector<double> tracks[3];
    for (int k = 0; k < 3; ++k) {
      tracks[k] = track(out.left, kC4 * Afterglow::partial_ratio(bell, k + 1), 2.0, 62.0, 1.0, 0.5);
      spans[pass][k] = span_of(tracks[k]);
    }
    whole[pass] = span_of(rms_track(out.left, 2.0, 62.0, 1.0, 0.5));
    if (pass == 0) {
      for (int k = 0; k < 3; ++k) still[k] = tracks[k];
      continue;
    }
    std::vector<double> difference(tracks[1].size());
    for (size_t i = 0; i < difference.size(); ++i) {
      difference[i] = tracks[1][i] - tracks[2][i];
      played_fall = std::max(played_fall, still[0][i] - tracks[0][i]);
      // How far Evolve lets the partial at 3.01 climb over the played note.
      overtaken = std::max(overtaken, (tracks[2][i] - tracks[0][i]) - (still[2][i] - still[0][i]));
    }
    apart = span_of(difference);
  }
  std::snprintf(label, sizeof label,
                "Evolve 1: two overtones move %.1f and %.1f dB in a minute, %.1f dB against each other, the whole %.2f dB",
                spans[1][1], spans[1][2], apart, whole[1]);
  EXPECT(spans[1][1] > 8.0 && spans[1][2] > 8.0 && apart > 8.0 && whole[1] < 1.0, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label,
                "Evolve 1: the played note's partial moves %.1f dB, is never more than %.1f dB under where it stands at Evolve 0, and an overtone gains %.1f dB on it at most",
                spans[1][0], played_fall, overtaken);
  EXPECT(spans[1][0] < 6.0 && played_fall < 5.0 && overtaken < 9.0, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label, "Evolve 0: the same partials move %.3f, %.3f and %.3f dB, the whole %.3f dB",
                spans[0][0], spans[0][1], spans[0][2], whole[0]);
  EXPECT(spans[0][0] < 0.1 && spans[0][1] < 0.1 && spans[0][2] < 0.1 && whole[0] < 0.1, label);
}

// Fade is the time the glow takes to fall 60 dB once the key is let go, and
// then the output is exact silence.
static void test_fade() {
  for (float fade : {1.0f, 4.0f}) {
    glow_only(device);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kFade, fade);
    device.note_on(1, kC4, 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, fade * 1.5f + 0.5f, kRate);
    const double level = db(rms(held.left, at(0.5), at(0.75)) / rms(held.left, at(0.75), at(1.0)));
    const double measured = fall_time(rms_track(tail.left, 0.02, 0.8 * fade, 0.05, 0.025), 0.025);
    std::snprintf(label, sizeof label,
                  "Fade %.0f s: held level steady (%.3f dB), falls 60 dB in %.2f s, sounding at %.2f s (%g), exact silence from %.2f s (%g)",
                  fade, level, measured, 1.2 * fade, both_peak(tail, at(1.2 * fade), at(1.25 * fade)), 1.4 * fade,
                  both_peak(tail, at(1.4 * fade)));
    EXPECT(std::fabs(level) < 0.05 && std::fabs(measured - fade) < 0.05 * fade &&
               both_peak(tail, at(1.2 * fade), at(1.25 * fade)) > 0.0 && both_peak(tail, at(1.4 * fade)) == 0.0,
           label);
    std::printf("%s\n", label);
  }
}

// A held glow stays where it is: the turning numbers are kept at length 1.
static void test_long_hold() {
  glow_only(device);
  device.set_param(p::kSource, Afterglow::kGlass);  // no partial of its own near the octave
  device.set_param(p::kBloom, 0.3f);
  device.set_param(p::kHalo, 1.0f);
  device.note_on(1, 1760.0f, 0.8f);
  Stereo out = render(device, 121.0f, kRate);
  const double early = db(tone_level(out.left, 1760.0, kRate, at(1.0), at(2.0)));
  const double late = db(tone_level(out.left, 1760.0, kRate, at(120.0), at(121.0)));
  const double halo = db(tone_level(out.left, 3520.0, kRate, at(120.0), at(121.0)) /
                         tone_level(out.left, 3520.0, kRate, at(1.0), at(2.0)));
  const double hz = peak_hz(out.left, 1760.0, kRate, at(119.0), at(121.0), 0.005);
  std::snprintf(label, sizeof label,
                "a note held two minutes moves %.4f dB, its halo %.4f dB, and is %.3f cents from where it began",
                late - early, halo, cents(hz, 1760.0));
  EXPECT(std::fabs(late - early) < 0.01 && std::fabs(halo) < 0.01 && std::fabs(cents(hz, 1760.0)) < 0.5, label);
  std::printf("%s\n", label);

  // And a beating one: a single partial (the note is too high for a second)
  // at Drift 1 beats three or four times a second; the top of its beat is
  // the two halves together, and stays where it was.
  glow_only(device);
  device.set_param(p::kBloom, 0.3f);
  device.set_param(p::kDrift, 1.0f);
  device.note_on(1, 11000.0f, 0.8f);
  Stereo beating = render(device, 130.0f, kRate);
  const std::vector<double> begun = track(beating.left, 11000.0, 10.0, 20.0, 0.04, 0.005);
  const std::vector<double> ended = track(beating.left, 11000.0, 120.0, 130.0, 0.04, 0.005);
  const double top_moved = *std::max_element(ended.begin(), ended.end()) - *std::max_element(begun.begin(), begun.end());
  const double bottom_moved =
      *std::min_element(ended.begin(), ended.end()) - *std::min_element(begun.begin(), begun.end());
  std::snprintf(label, sizeof label,
                "a beating note held two minutes: the top of its beat moves %.4f dB and the bottom %.4f dB", top_moved,
                bottom_moved);
  EXPECT(std::fabs(top_moved) < 0.01 && std::fabs(bottom_moved) < 0.1, label);
  std::printf("%s\n", label);
}

// Halo adds each low partial's octave: on the glass, whose own partials miss
// the octave, there is nothing at twice the note without it.
static void test_halo() {
  double level[3], hz = 0.0;
  const float halos[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    glow_only(device);
    device.set_param(p::kSource, Afterglow::kGlass);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kHalo, halos[i]);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    level[i] = db(tone_level(out.left, 2.0 * kC4, kRate, at(1.0), at(2.0)) /
                  tone_level(out.left, kC4, kRate, at(1.0), at(2.0)));
    if (i == 2) hz = peak_hz(out.left, 2.0 * kC4, kRate, at(1.0), at(2.0), 0.01);
  }
  std::snprintf(label, sizeof label,
                "Halo 0, 0.5 and 1: the octave is %.1f, %.2f and %.2f dB against the note, %.3f cents from twice it",
                level[0], level[1], level[2], cents(hz, 2.0 * kC4));
  EXPECT(level[0] < -70.0 && std::fabs(level[2]) < 1.0 && std::fabs(level[1] + 6.02) < 1.0 &&
             std::fabs(cents(hz, 2.0 * kC4)) < 2.0,
         label);
  std::printf("%s\n", label);
}

// Drift: each partial is two a little apart, centred on the partial, and
// beats at the rate the knob sets, each note at a pace of its own between
// 0.7 and 1.6 of it; the weaker half's share of the power is a third of
// Drift, so more Drift beats deeper as well as faster; the halo beats twice
// as fast.
static void test_drift() {
  const double kHz = 440.0;
  double rates[2], depths[2];
  const float drifts[2] = {0.6f, 1.0f};
  for (int i = 0; i < 2; ++i) {
    const double nominal = 3.0 * drifts[i] * drifts[i];
    const double share = 0.33 * drifts[i];  // kFarShare, worked out here and not by the device
    const double near = std::sqrt(1.0 - share), far = std::sqrt(share);
    glow_only(device);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kDrift, drifts[i]);
    device.set_param(p::kHalo, 1.0f);
    device.note_on(1, static_cast<float>(kHz), 0.8f);
    Stereo out = render(device, 13.0f, kRate);
    const std::vector<double> beats = track(out.left, kHz, 1.0, 13.0, 0.04, 0.01);
    rates[i] = beat_rate(beats, 0.01, 1.15 * nominal, 0.45);  // a pace of 0.63 to 1.67 is looked for
    depths[i] = span_of(beats);
    const double deep = db((near + far) / (near - far));
    std::snprintf(label, sizeof label,
                  "Drift %.1f: the note beats at %.3f Hz (%.3f times this note's pace of 0.7 to 1.6) and %.1f dB deep in mono (%.1f expected)",
                  drifts[i], rates[i], nominal, depths[i], deep);
    EXPECT(rates[i] > 0.7 * nominal && rates[i] < 1.6 * nominal && std::fabs(depths[i] - deep) < 1.0, label);
    std::printf("%s\n", label);
    if (i == 0) {
      const double lower = db(tone_level(out.left, kHz - 0.5 * rates[0], kRate, at(1.0), at(13.0)));
      const double upper = db(tone_level(out.left, kHz + 0.5 * rates[0], kRate, at(1.0), at(13.0)));
      const double centre = db(tone_level(out.left, kHz, kRate, at(1.0), at(13.0)));
      std::snprintf(label, sizeof label,
                    "the pair sits half the beat rate either side of the note (%.1f and %.1f dB, %.1f expected between them, %.1f dB at the note itself)",
                    lower, upper, db(near / far), centre);
      EXPECT(std::fabs(std::fabs(upper - lower) - db(near / far)) < 0.7 && centre < std::min(lower, upper) - 15.0, label);
      std::printf("%s\n", label);
      // The halo, on a glass, where nothing else sits at twice the note.
      glow_only(device);
      device.set_param(p::kSource, Afterglow::kGlass);
      device.set_param(p::kBloom, 0.3f);
      device.set_param(p::kDrift, drifts[i]);
      device.set_param(p::kHalo, 1.0f);
      device.note_on(1, static_cast<float>(kHz), 0.8f);
      Stereo glass = render(device, 13.0f, kRate);
      const double below = beat_rate(track(glass.left, kHz, 1.0, 13.0, 0.04, 0.01), 0.01, 1.15 * nominal, 0.45);
      const double above = beat_rate(track(glass.left, 2.0 * kHz, 1.0, 13.0, 0.04, 0.01), 0.01, 2.0 * below, 0.2);
      std::snprintf(label, sizeof label, "the halo beats at %.3f Hz, twice the note's %.3f", above, below);
      EXPECT_NEAR(above, 2.0 * below, 0.04 * below, label);
      std::printf("%s\n", label);
    }
  }
  // The same note at the same pace: the rate goes with the square of Drift.
  std::snprintf(label, sizeof label, "Drift 1 beats %.3f times as fast as Drift 0.6 (%.3f expected)", rates[1] / rates[0],
                1.0 / 0.36);
  EXPECT_NEAR(rates[1] / rates[0], 1.0 / 0.36, 0.06, label);
  glow_only(device);
  device.set_param(p::kBloom, 0.3f);
  device.note_on(1, static_cast<float>(kHz), 0.8f);
  Stereo still = render(device, 6.0f, kRate);
  const double moved = span_of(track(still.left, kHz, 1.0, 6.0, 0.04, 0.01));
  std::snprintf(label, sizeof label, "Drift 0 is still (the note moves %.4f dB in 5 s)", moved);
  EXPECT(moved < 0.01, label);
  // The felt string's octaves are a little wide. Its halo sits on them, not
  // at exactly twice the partial below, so with Drift at 0 nothing beats.
  glow_only(device);
  device.set_param(p::kBloom, 0.3f);
  device.set_param(p::kHalo, 1.0f);
  device.note_on(1, kC4, 0.8f);
  Stereo halo = render(device, 12.0f, kRate);
  const Afterglow::SourceTable& felt = Afterglow::source_table(Afterglow::kFelt);
  double halo_moved = 0.0;
  for (int k : {0, 1, 3, 5, 7}) {
    halo_moved = std::max(
        halo_moved, span_of(track(halo.left, kC4 * Afterglow::partial_ratio(felt, k), 1.0, 12.0, 0.2, 0.05)));
  }
  glow_only(device);
  device.set_param(p::kBloom, 0.3f);
  device.note_on(1, kC4, 0.8f);
  Stereo plain = render(device, 3.0f, kRate);
  const double second = kC4 * Afterglow::partial_ratio(felt, 1);
  const double lifted = db(tone_level(halo.left, second, kRate, at(1.0), at(3.0)) /
                           tone_level(plain.left, second, kRate, at(1.0), at(3.0)));
  std::snprintf(label, sizeof label,
                "Felt at Halo 1, Drift 0: the note and its even partials move %.4f dB in 11 s, and the second partial stands %.1f dB over where it is without the halo",
                halo_moved, lifted);
  EXPECT(halo_moved < 0.02 && lifted > 6.0, label);
  std::printf("%s\n", label);
  std::printf("drift: 0.6 -> %.3f Hz and %.1f dB deep, 1 -> %.3f Hz and %.1f dB, 0 -> still within %.4f dB\n", rates[0],
              depths[0], rates[1], depths[1], moved);
}

// A chord held for half a minute neither grows nor dies, and its keys do not
// swell and sink together: every note beats at a pace of its own, and at the
// default Drift the beat is shallow.
static void test_held_chord() {
  device.init(kRate);
  const float chord[5] = {146.83f, 220.0f, 349.23f, 523.25f, 659.26f};
  for (int n = 0; n < 5; ++n) device.note_on(n, chord[n], 0.8f);
  Stereo out = render(device, 30.0f, kRate);
  const std::vector<float> middle = mid(out);
  const std::vector<double> levels = rms_track(middle, 5.0, 30.0, 5.0, 5.0);
  const double drift = levels.back() - levels.front();
  std::snprintf(label, sizeof label,
                "a chord held 30 s: 5 s stretches from 5 s on span %.2f dB, the last against the first %.2f dB (level %.1f dBFS)",
                span_of(levels), drift, levels.back());
  EXPECT(span_of(levels) < 1.5 && std::fabs(drift) < 1.0 && levels.back() > -40.0, label);
  std::printf("%s\n", label);
  // Quarter seconds: what the ear follows as the level of the chord.
  std::vector<double> quarters;
  for (double t = 3.5; t + 0.25 <= 30.0; t += 0.125) {
    const double l = rms(out.left, at(t), at(t + 0.25)), r = rms(out.right, at(t), at(t + 0.25));
    quarters.push_back(db(std::sqrt(0.5 * (l * l + r * r))));
  }
  device.init(kRate);
  device.note_on(1, chord[1], 0.8f);
  Stereo single = render(device, 30.0f, kRate);
  const double one = span_of(rms_track(mid(single), 3.5, 30.0, 0.25, 0.125));
  std::snprintf(label, sizeof label,
                "held at the defaults, quarter seconds of the chord span %.1f dB in level, of one key %.1f dB in mono",
                span_of(quarters), one);
  EXPECT(span_of(quarters) < 4.5 && one < 7.0 && one > 3.0, label);
  std::printf("%s\n", label);
}

// A 100 ms note still glows: it goes on blooming after the key is let go, to
// the share of the glow it earned, and then fades. In power the share is the
// part of Bloom the key was held for, over the least a touch gets.
static void test_short_note() {
  const double touch = 0.3;  // kTouch, worked out here and not by the device
  Stereo held;
  double bloomed[2], expected[2], later = 0.0, silent = 1.0;
  const float holds[2] = {0.1f, 0.5f};
  for (int pass = 0; pass < 3; ++pass) {
    glow_only(device);
    device.set_param(p::kBloom, 1.0f);
    device.set_param(p::kFade, 3.0f);
    device.note_on(1, kC4, 0.8f);
    if (pass == 2) {
      held = render(device, 6.5f, kRate);
      continue;
    }
    Stereo out = render(device, holds[pass], kRate);
    device.note_off(1);
    out = concat(out, render(device, 6.5f - holds[pass], kRate));
    bloomed[pass] = rms(out.left, at(0.95), at(1.05));
    expected[pass] = db(std::sqrt(touch * touch + (1.0 - touch * touch) * holds[pass]));
    if (pass == 0) {
      later = db(rms(out.left, at(2.45), at(2.55)) / bloomed[0]);
      silent = both_peak(out, at(5.5));
    }
  }
  const double full = rms(held.left, at(0.95), at(1.05));
  for (double& v : bloomed) v = db(v / full);
  std::snprintf(label, sizeof label,
                "Bloom 1 s, Fade 3 s: a key held 0.1 s glows %.2f dB under a held one (%.2f expected), held 0.5 s %.2f dB (%.2f); the short one is %.1f dB down 1.5 s on (-30 expected) and silent at 5.5 s (%g)",
                bloomed[0], expected[0], bloomed[1], expected[1], later, silent);
  EXPECT(std::fabs(bloomed[0] - expected[0]) < 0.3 && std::fabs(bloomed[1] - expected[1]) < 0.3 &&
             bloomed[0] < -5.0 && bloomed[0] > -11.0 && std::fabs(later + 30.0) < 2.0 && silent == 0.0,
         label);
  std::printf("%s\n", label);
  // And at the defaults the glow is what is heard a second and a half after it.
  double level[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    if (pass == 1) device.set_param(p::kGlow, 0.0f);
    device.note_on(1, kC4, 0.8f);
    render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo rest = render(device, 2.0f, kRate);
    level[pass] = db(rms(mid(rest), at(1.4), at(1.9)));
  }
  std::snprintf(label, sizeof label,
                "a 100 ms note at the defaults: %.1f dBFS at 1.5 s with its glow, %.1f dBFS as a strike alone", level[0],
                level[1]);
  EXPECT(level[0] > level[1] + 6.0, label);
  std::printf("%s\n", label);
}

// The loudest stretch of `window` seconds, in dBFS, between two times.
static double loudest(const Stereo& s, double from, double to, double window = 0.4) {
  double best = -240.0;
  for (double t = from; t + window <= to + 1.0e-9; t += 0.1) {
    const double l = rms(s.left, at(t), at(t + window)), r = rms(s.right, at(t), at(t + window));
    best = std::max(best, db(std::sqrt(0.5 * (l * l + r * r))));
  }
  return best;
}

// Ten short notes in two seconds under a long Bloom: what comes up afterwards
// is not louder than the playing was.
static void test_short_run() {
  device.init(kRate);
  device.set_param(p::kBloom, 8.0f);
  const float run[10] = {220.0f, 261.63f, 293.66f, 329.63f, 349.23f, 392.0f, 440.0f, 523.25f, 587.33f, 659.26f};
  Stereo out;
  for (int n = 0; n < 10; ++n) {
    device.note_on(n, run[n], 0.8f);
    out = concat(out, render(device, 0.15f, kRate));
    device.note_off(n);
    out = concat(out, render(device, 0.05f, kRate));
  }
  out = concat(out, render(device, 12.0f, kRate));
  const double playing = loudest(out, 0.0, 2.2), after = loudest(out, 2.4, 14.0);
  std::snprintf(label, sizeof label,
                "ten 150 ms notes in 2 s at Bloom 8 s: the playing is %.1f dBFS, the loudest the glow gets afterwards %.1f dBFS",
                playing, after);
  EXPECT(after < playing - 1.0 && after > playing - 12.0, label);
  std::printf("%s\n", label);
}

// A key struck again is one string struck again: the voice that still sounds
// takes the new strike, so its glow does not stack, however often the key
// is struck and however long the Fade; and striking a glowing key again
// never takes its glow away.
static void test_restrike() {
  // Sixteen strikes a second apart at Fade 30 s: the last four are no louder
  // than the second to the fifth, and all of it is a strike on one glow.
  device.init(kRate);
  device.set_param(p::kFade, 30.0f);
  Stereo out;
  for (int n = 0; n < 16; ++n) {
    device.note_on(7, kC4, 0.8f);
    out = concat(out, render(device, 0.7f, kRate));
    device.note_off(7);
    out = concat(out, render(device, 0.3f, kRate));
  }
  device.init(kRate);
  device.set_param(p::kFade, 30.0f);
  device.note_on(7, kC4, 0.8f);
  Stereo once = render(device, 16.0f, kRate);
  const double early = loudest(out, 1.0, 5.0), late = loudest(out, 12.0, 16.0);
  const double strike = loudest(once, 0.0, 1.0), glow = loudest(once, 8.0, 16.0);
  const double both = db(std::pow(10.0, strike / 20.0) + std::pow(10.0, glow / 20.0));
  std::snprintf(label, sizeof label,
                "one key struck 16 times a second apart at Fade 30 s: strikes 2 to 5 reach %.1f dBFS, the last four %.1f dBFS; held once its strike is %.1f and its glow %.1f dBFS (%.1f together)",
                early, late, strike, glow, both);
  EXPECT(std::fabs(late - early) < 1.5 && late < both + 0.5 && late > strike - 3.0, label);
  std::printf("%s\n", label);

  // Twelve strikes in a second and a half, strike off: the glow that is
  // left is one glow, not twelve.
  double left[2];
  for (int pass = 0; pass < 2; ++pass) {
    glow_only(device);
    device.set_param(p::kBloom, 0.5f);
    device.set_param(p::kFade, 30.0f);
    for (int n = 0; n < (pass == 0 ? 12 : 1); ++n) {
      device.note_on(7, kC4, 0.8f);
      render(device, pass == 0 ? 0.08f : 1.4f, kRate);
      device.note_off(7);
      if (pass == 0) render(device, 0.04f, kRate);
    }
    Stereo rest = render(device, 1.5f, kRate);
    left[pass] = db(rms(rest.left, at(1.0), at(1.5)));
  }
  std::snprintf(label, sizeof label,
                "one key struck 12 times in 1.4 s leaves a glow of %.1f dBFS, held for as long %.1f dBFS", left[0], left[1]);
  EXPECT(left[0] < left[1] + 0.5 && left[0] > left[1] - 12.0, label);
  std::printf("%s\n", label);

  // The glow of a key that is struck again: held 3 s, let go, touched for
  // 100 ms half a second later, against the same key left alone.
  Stereo touched, alone;
  for (int pass = 0; pass < 2; ++pass) {
    glow_only(device);
    device.set_param(p::kBloom, 1.0f);
    device.set_param(p::kFade, 30.0f);
    device.note_on(1, kC4, 0.8f);
    render(device, 3.0f, kRate);
    device.note_off(1);
    render(device, 0.5f, kRate);
    if (pass == 0) device.note_on(2, kC4, 0.8f);
    Stereo rest = render(device, 0.1f, kRate);
    device.note_off(2);
    rest = concat(rest, render(device, 2.4f, kRate));
    (pass == 0 ? touched : alone) = rest;
  }
  const std::vector<double> with = rms_track(touched.left, 0.0, 2.5, 0.1, 0.05);
  const std::vector<double> without = rms_track(alone.left, 0.0, 2.5, 0.1, 0.05);
  double lowest = 0.0, highest = 0.0;
  for (size_t i = 0; i < with.size(); ++i) {
    lowest = std::min(lowest, with[i] - without[i]);
    highest = std::max(highest, with[i] - without[0]);
  }
  std::snprintf(label, sizeof label,
                "a glowing key touched again for 100 ms: its glow is never more than %.2f dB under the same key left alone, and never more than %.2f dB over where it stood",
                -lowest, highest);
  EXPECT(lowest > -0.3 && highest < 0.3, label);
  std::printf("%s\n", label);

  // A strike on a glowing key pushes the way the key is already going: at
  // eight moments of the beat the 60 ms after it are never quieter than the
  // 60 ms before, and at the end everything rings out to exact silence.
  device.init(kRate);
  device.set_param(p::kDrift, 0.7f);
  device.set_param(p::kBloom, 0.5f);
  device.set_param(p::kDecay, 1.0f);
  device.set_param(p::kFade, 2.0f);
  device.note_on(1, kC4, 0.8f);
  double least = 100.0;
  for (int n = 0; n < 8; ++n) {
    Stereo before_it = render(device, 1.0f + 0.137f * static_cast<float>(n), kRate);
    device.note_on(1, kC4, 0.8f);
    Stereo after_it = render(device, 0.06f, kRate);
    const double rise = db(rms(mid(after_it)) / rms(mid(before_it), before_it.size() - at(0.06)));
    least = std::min(least, rise);
  }
  device.note_off(1);
  render(device, 4.5f, kRate);
  Stereo end = render(device, 0.5f, kRate);
  std::snprintf(label, sizeof label,
                "a glowing key struck again at eight moments of its beat: the 60 ms after the strike are at least %+.1f dB against the 60 ms before, and it ends in silence (%g)",
                least, both_peak(end));
  EXPECT(least > 0.5 && both_peak(end) == 0.0, label);
  std::printf("%s\n", label);

  // Struck as felt, then as glass, and so on, on one key: the glow of the
  // other kind makes way each time, so eight strikes leave what two leave.
  // The third pass is the glass struck once: what one glow is.
  double kinds[3];
  for (int pass = 0; pass < 3; ++pass) {
    glow_only(device);
    device.set_param(p::kBloom, 0.5f);
    device.set_param(p::kFade, 30.0f);
    for (int n = (pass == 2 ? 1 : 0); n < (pass == 0 ? 8 : 2); ++n) {
      device.set_param(p::kSource, (n & 1) ? Afterglow::kGlass : Afterglow::kFelt);
      device.note_on(n, kC4, 0.8f);
      render(device, 1.0f, kRate);
      device.note_off(n);
    }
    Stereo rest = render(device, 1.0f, kRate);
    kinds[pass] = db(rms(rest.left, at(0.5), at(1.0)));
  }
  std::snprintf(label, sizeof label,
                "one key struck eight times as felt and glass by turns leaves %.1f dBFS of glow, struck twice %.1f dBFS, as glass alone %.1f dBFS",
                kinds[0], kinds[1], kinds[2]);
  EXPECT(std::fabs(kinds[0] - kinds[1]) < 1.5 && std::fabs(kinds[0] - kinds[2]) < 1.5 &&
             std::fabs(kinds[1] - kinds[2]) < 1.5,
         label);
  std::printf("%s\n", label);

  // The handover itself: the felt glow goes down as the glass one comes up
  // (over Bloom), with no leap between two 25 ms stretches, and a felt
  // strike while that is under way takes the felt glow back, so the key
  // held from then on still glows as one key does a few seconds later.
  glow_only(device);
  device.set_param(p::kBloom, 2.0f);
  device.set_param(p::kFade, 30.0f);
  device.note_on(1, kC4, 0.8f);
  Stereo felt_once = render(device, 9.0f, kRate);
  device.set_param(p::kSource, Afterglow::kGlass);
  device.note_on(2, kC4, 0.8f);
  Stereo over = render(device, 3.0f, kRate);
  const std::vector<double> passing = rms_track(over.left, 0.0, 3.0, 0.05, 0.025);
  double leap = 0.0;
  for (size_t i = 1; i < passing.size(); ++i) leap = std::max(leap, std::fabs(db(passing[i] / passing[i - 1])));
  const double felt_alone = db(rms(felt_once.left, at(8.0), at(9.0)));
  const double handed[2] = {db(rms(over.left, 0, at(0.25))) - felt_alone,
                            db(rms(over.left, at(1.0), at(1.25))) - felt_alone};

  glow_only(device);
  device.set_param(p::kBloom, 2.0f);
  device.set_param(p::kFade, 30.0f);
  device.note_on(1, kC4, 0.8f);
  render(device, 4.0f, kRate);
  device.set_param(p::kSource, Afterglow::kGlass);
  device.note_on(2, kC4, 0.8f);
  render(device, 0.3f, kRate);
  device.set_param(p::kSource, Afterglow::kFelt);
  device.note_on(3, kC4, 0.8f);
  Stereo back = render(device, 4.7f, kRate);
  const double taken_back = db(rms(back.left, at(3.7), at(4.7))) - felt_alone;
  std::snprintf(label, sizeof label,
                "felt handing over to glass on one key: %+.2f dB at first and %+.2f dB a second on against the felt alone, no 25 ms leap over %.2f dB; struck as felt again 0.3 s on, it glows %+.2f dB against the felt alone",
                handed[0], handed[1], leap, taken_back);
  EXPECT(std::fabs(handed[0]) < 1.0 && std::fabs(handed[1]) < 3.5 && leap < 0.5 && std::fabs(taken_back) < 1.0, label);
  std::printf("%s\n", label);

  // Struck again, the old strike gives way to the new: strikes do not pile up.
  double strikes[2];
  for (int pass = 0; pass < 2; ++pass) {
    strike_only(device);
    device.set_param(p::kDecay, 20.0f);
    for (int n = 0; n < (pass == 0 ? 12 : 1); ++n) {
      device.note_on(n, kC4, 0.8f);
      render(device, 0.5f, kRate);
    }
    Stereo out = render(device, 0.5f, kRate);
    strikes[pass] = db(rms(out.left));
  }
  std::snprintf(label, sizeof label,
                "twelve strikes of one key at Decay 20 s leave %.1f dBFS ringing, one strike %.1f dBFS", strikes[0],
                strikes[1]);
  EXPECT(std::fabs(strikes[0] - strikes[1]) < 1.0, label);
  std::printf("%s\n", label);

  // What still rings of the old strike is not cut off by the new one: it
  // gives way over the attack, so the first two milliseconds after a second
  // strike sound as they would have without it.
  Stereo twice[2];
  for (int pass = 0; pass < 2; ++pass) {
    strike_only(device);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, kC4, 0.8f);
    render(device, 0.5f, kRate);
    if (pass == 0) device.note_on(2, kC4, 0.8f);
    twice[pass] = render(device, 0.1f, kRate);
  }
  const double first_ms = db(rms(twice[0].left, 0, at(0.002)) / rms(twice[1].left, 0, at(0.002)));
  std::snprintf(label, sizeof label,
                "a ringing key struck again: its first 2 ms are %+.2f dB against the same key left to ring", first_ms);
  EXPECT(first_ms > -1.0 && first_ms < 4.0, label);
  std::printf("%s\n", label);
}

// Tone tilts the glow about the played note. The power is trimmed halfway
// toward the peak, so a bright glow is a little lower, never louder.
static void test_tone() {
  double third[3], whole[3];
  const float tones[3] = {0.0f, 0.5f, 1.0f};
  const double ratio = Afterglow::partial_ratio(Afterglow::source_table(Afterglow::kFelt), 2);
  for (int i = 0; i < 3; ++i) {
    glow_only(device);
    device.set_param(p::kBloom, 0.3f);
    device.set_param(p::kTone, tones[i]);
    device.note_on(1, kC4, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    third[i] = db(tone_level(out.left, kC4 * ratio, kRate, at(1.0), at(2.0)) /
                  tone_level(out.left, kC4, kRate, at(1.0), at(2.0)));
    whole[i] = db(rms(out.left, at(1.0), at(2.0)));
  }
  const double expected = 1.5 * std::log2(ratio) * 6.0206;
  std::snprintf(label, sizeof label,
                "Tone 0, 0.5, 1: the third partial stands %.1f, %.1f and %.1f dB against the first (steps of %.1f expected), the whole at %.2f, %.2f and %.2f dBFS",
                third[0], third[1], third[2], expected, whole[0], whole[1], whole[2]);
  EXPECT(std::fabs((third[2] - third[1]) - expected) < 0.5 && std::fabs((third[1] - third[0]) - expected) < 0.5 &&
             whole[0] - whole[2] > 0.5 && whole[0] - whole[2] < 4.5 && whole[1] < whole[0] && whole[2] < whole[1],
         label);
  std::printf("%s\n", label);

  // Tone thrown under a glowing note glides to its place: 2 ms on it is a
  // small part of the way, a tenth of a second on it is there. The measure
  // is the distance from the note left alone, against that of a note that
  // had the new Tone from its start (the same partials, turning alike).
  Stereo way[3];
  for (int pass = 0; pass < 3; ++pass) {
    glow_only(device);
    device.set_param(p::kBloom, 0.3f);
    if (pass == 2) device.set_param(p::kTone, 1.0f);
    device.note_on(1, kC4, 0.8f);
    render(device, 1.0f, kRate);
    if (pass == 1) device.set_param(p::kTone, 1.0f);
    way[pass] = render(device, 0.2f, kRate);
  }
  double gone[2];
  for (int i = 0; i < 2; ++i) {
    const size_t from = i == 0 ? at(0.001) : at(0.1), to = i == 0 ? at(0.003) : at(0.15);
    double moved = 0.0, whole_way = 0.0;
    for (size_t n = from; n < to; ++n) {
      const double a = way[1].left[n] - way[0].left[n], b = way[2].left[n] - way[0].left[n];
      moved += a * a;
      whole_way += b * b;
    }
    gone[i] = std::sqrt(moved / whole_way);
  }
  std::snprintf(label, sizeof label,
                "Tone thrown from 0.5 to 1 under a glowing note is %.3f of the way 1 to 3 ms on and %.3f of it 100 ms on",
                gone[0], gone[1]);
  EXPECT(gone[0] < 0.3 && gone[1] > 0.97 && gone[1] < 1.03, label);
  std::printf("%s\n", label);
}

// Width: mono at 0, the halves of each pair apart at 1, and never wider than
// a mono fold can take.
static void test_width() {
  double correlated[3], side_db[3];
  const float widths[3] = {0.0f, 0.6f, 1.0f};
  bool same = false;
  for (int i = 0; i < 3; ++i) {
    device.init(kRate);
    device.set_param(p::kWidth, widths[i]);
    device.set_param(p::kDrift, 0.6f);
    device.set_param(p::kHalo, 0.6f);
    const float chord[3] = {146.83f, 220.0f, 349.23f};
    for (int n = 0; n < 3; ++n) device.note_on(n, chord[n], 0.8f);
    Stereo out = render(device, 12.0f, kRate);
    correlated[i] = correlation(out.left, out.right, at(2.0));
    side_db[i] = db(rms(side(out), at(2.0)) / rms(mid(out), at(2.0)));
    if (i == 0) same = out.left == out.right;
  }
  std::snprintf(label, sizeof label,
                "Width 0, 0.6, 1: left and right correlate %.3f, %.3f, %.3f; side over mid %.1f, %.1f, %.1f dB",
                correlated[0], correlated[1], correlated[2], side_db[0], side_db[1], side_db[2]);
  EXPECT(same && correlated[1] < 0.97 && correlated[2] < correlated[1] - 0.1 && side_db[2] < -3.0 && side_db[2] > -12.0,
         label);
  std::printf("%s\n", label);
}

// --- what every instrument is held to ------------------------------------------------------

static void test_velocity() {
  double peaks[2], bright[2], glowing[2];
  const float gains[2] = {1.0f, 0.2f};
  const double fourth = kC4 * Afterglow::partial_ratio(Afterglow::source_table(Afterglow::kFelt), 3);
  for (int i = 0; i < 2; ++i) {
    device.init(kRate);
    device.note_on(1, kC4, gains[i]);
    Stereo out = render(device, 3.0f, kRate);
    peaks[i] = both_peak(out);
    strike_only(device);
    device.note_on(1, kC4, gains[i]);
    Stereo struck = render(device, 0.2f, kRate);
    bright[i] = db(tone_level(struck.left, fourth, kRate, 0, at(0.1)) / tone_level(struck.left, kC4, kRate, 0, at(0.1)));
    glow_only(device);
    device.set_param(p::kBloom, 0.3f);
    device.note_on(1, kC4, gains[i]);
    Stereo held = render(device, 1.5f, kRate);
    glowing[i] = db(tone_level(held.left, fourth, kRate, at(0.5), at(1.5)) /
                    tone_level(held.left, kC4, kRate, at(0.5), at(1.5)));
  }
  std::snprintf(label, sizeof label,
                "a soft key is %.1f dB quieter than a hard one and its fourth partial %.1f dB further under the first, in its glow %.1f dB",
                db(peaks[0] / peaks[1]), bright[0] - bright[1], glowing[0] - glowing[1]);
  EXPECT(db(peaks[0] / peaks[1]) > 6.0 && db(peaks[0] / peaks[1]) < 12.0 && bright[0] - bright[1] > 4.0 &&
             std::fabs((glowing[0] - glowing[1]) - (bright[0] - bright[1])) < 0.5,
         label);
  std::printf("%s\n", label);
}

// One key at gain 0.7 peaks between -24 and -10 dBFS at the default volume,
// for every source across the keyboard; ten held keys stay under the knee.
static void test_levels() {
  double lowest = 0.0, highest = -200.0, ten = 0.0;
  for (int source = 0; source < Afterglow::kNumSources; ++source) {
    for (float hz : {55.0f, 220.0f, 880.0f, 3520.0f}) {
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.note_on(1, hz, 0.7f);
      const double level = db(both_peak(render(device, 4.0f, kRate)));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    device.init(kRate);
    device.set_param(p::kSource, static_cast<float>(source));
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    ten = std::max(ten, both_peak(render(device, 8.0f, kRate)));
  }
  std::snprintf(label, sizeof label,
                "one key at gain 0.7 peaks between %.1f and %.1f dBFS over four sources and four octaves", lowest,
                highest);
  EXPECT(lowest > -24.0 && highest < -10.0, label);
  std::printf("%s\n", label);
  std::snprintf(label, sizeof label, "ten held keys peak at %.3f, under the knee at 0.5, for every source", ten);
  EXPECT(ten < 0.5, label);
  std::printf("%s\n", label);
}

// The output ends in the soft clip: pushed far over, it lands under 1.
static void test_soft_clip() {
  double peaks[2];
  const float volumes[2] = {-30.0f, 6.0f};
  for (int i = 0; i < 2; ++i) {
    device.init(kRate);
    device.set_param(p::kVolume, volumes[i]);
    for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 1.0f);
    peaks[i] = both_peak(render(device, 4.0f, kRate));
  }
  const double unclipped = peaks[0] * std::pow(10.0, 36.0 / 20.0);
  std::snprintf(label, sizeof label, "sixteen keys at +6 dB would peak at %.2f and come out at %.3f", unclipped,
                peaks[1]);
  EXPECT(unclipped > 1.3 && peaks[1] <= 1.0 && peaks[1] > 0.6, label);
  std::printf("%s\n", label);
}

static void soft_note(Afterglow& d) {
  d.init(kRate);
  d.set_param(p::kVolume, 0.0f);
  d.note_on(1, 130.81f, 0.8f);
}

// Knobs turned while a note sounds, a stolen voice, a second strike and the
// shortest fade all arrive gradually.
static void test_clicks() {
  struct Jump {
    int id;
    float from, to;
  };
  const Jump jumps[] = {{p::kGlow, 0.0f, 1.0f},   {p::kGlow, 1.0f, 0.0f},   {p::kTone, 0.0f, 1.0f},
                        {p::kTone, 1.0f, 0.0f},   {p::kHalo, 0.0f, 1.0f},   {p::kHalo, 1.0f, 0.0f},
                        {p::kWidth, 0.0f, 1.0f},  {p::kWidth, 1.0f, 0.0f},  {p::kEvolve, 0.0f, 1.0f},
                        {p::kStrike, 1.0f, 0.0f}, {p::kStrike, 0.0f, 1.0f}, {p::kVolume, -12.0f, 6.0f},
                        {p::kVolume, 6.0f, -12.0f}};
  // The level knobs arrive over 15 ms on the control tick, Volume over 5 ms
  // per sample: held apart, because a level knob that jumps is still drawn
  // as a line over one tick and would pass the bar Volume needs.
  double worst = 0.0, worst_volume = 0.0;
  int worst_id = -1;
  for (const Jump& jump : jumps) {
    const double sudden = suddenness(
        [&](Afterglow& d) {
          d.init(kRate);
          d.set_param(p::kDecay, 20.0f);  // the strike still rings when the knob moves
          d.set_param(jump.id, jump.from);
          d.note_on(1, 130.81f, 0.8f);
        },
        [&](Afterglow& d) { d.set_param(jump.id, jump.to); });
    if (jump.id == p::kVolume) {
      worst_volume = std::max(worst_volume, sudden);
    } else if (sudden > worst) {
      worst = sudden;
      worst_id = jump.id;
    }
  }
  std::snprintf(label, sizeof label,
                "a knob thrown across its range under a note is smoothed (after 8 samples at worst %.4f of the way, param %d; Volume %.4f)",
                worst, worst_id, worst_volume);
  EXPECT(worst < 0.03 && worst_volume < 0.08, label);
  std::printf("%s\n", label);

  auto sixteen = [](Afterglow& d) {
    d.init(kRate);
    d.set_param(p::kVolume, 0.0f);
    for (int n = 0; n < 16; ++n) d.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  };
  const double steal = suddenness(sixteen, [](Afterglow& d) { d.note_on(16, 1396.9f, 0.8f); });
  const double again = suddenness(soft_note, [](Afterglow& d) { d.note_on(1, 130.81f, 0.8f); });
  const double off = suddenness(
      [](Afterglow& d) {
        soft_note(d);
        d.set_param(p::kFade, 0.1f);
      },
      [](Afterglow& d) { d.note_off(1); });
  std::snprintf(label, sizeof label,
                "a steal, a second strike and the shortest fade start gradually (%.3f, %.3f and %.3f of the way after 8 samples)",
                steal, again, off);
  // A second strike lands on a string that is already moving and arrives over
  // the felt's 5 ms, as the first does: 3 % of the way in 8 samples, and up
  // to twice that where the string happens to stand at its widest.
  EXPECT(steal < 0.02 && again < 0.08 && off < 0.02, label);
  std::printf("%s\n", label);

  // Two more that change the glow under way: a key let go halfway up its
  // bloom goes on from where it stood, and a soft glowing key struck hard
  // gets its brighter glow over the knob time, not at once.
  const double let_go = suddenness(
      [](Afterglow& d) {
        glow_only(d);
        d.set_param(p::kBloom, 5.0f);
        d.note_on(1, 130.81f, 0.8f);
      },
      [](Afterglow& d) { d.note_off(1); });
  const double harder = suddenness(
      [](Afterglow& d) {
        glow_only(d);
        d.set_param(p::kBloom, 0.5f);
        d.note_on(1, 130.81f, 0.2f);
      },
      [](Afterglow& d) { d.note_on(1, 130.81f, 1.0f); });
  std::snprintf(label, sizeof label,
                "a key let go halfway up its bloom and a soft glowing key struck hard change gradually (%.3f and %.3f of the way after 8 samples)",
                let_go, harder);
  EXPECT(let_go < 0.02 && harder < 0.02, label);
  std::printf("%s\n", label);

  // Glow thrown up and down under a soft low note: no step and no kink
  // beyond what the same note has with the knob left at either end.
  double step[3], bend[3];
  for (int pass = 0; pass < 3; ++pass) {
    soft_note(device);
    device.set_param(p::kStrike, 0.0f);
    device.set_param(p::kHalo, 0.0f);
    device.set_param(p::kGlow, pass == 1 ? 1.0f : 0.3f);
    render(device, 2.5f, kRate);
    Stereo out;
    for (int throw_ = 0; throw_ < 8; ++throw_) {
      if (pass == 2) device.set_param(p::kGlow, (throw_ & 1) ? 0.3f : 1.0f);
      out = concat(out, render(device, 0.0617f, kRate));
    }
    step[pass] = std::max(max_step(out.left), max_step(out.right));
    bend[pass] = std::max(kink(out.left), kink(out.right));
  }
  std::snprintf(label, sizeof label,
                "Glow thrown eight times: largest step %.5f (%.5f and %.5f with the knob at rest), largest kink %.2e (%.2e and %.2e)",
                step[2], step[0], step[1], bend[2], bend[0], bend[1]);
  // (A level drawn in straight lines bends a little at every tick while a
  // knob is on its way: about ten times the note's own. Unsmoothed it is 290.)
  EXPECT(step[2] < 1.1 * std::max(step[0], step[1]) && bend[2] < 40.0 * std::max(bend[0], bend[1]), label);
  std::printf("%s\n", label);
}

// Voices change hands without losing or keeping a note.
static void test_stealing() {
  // Sixteen keys inside one octave, so no key's partial lies on another
  // key's note, and still, so every voice is as loud as the next.
  auto key = [](int n) { return 200.0 * std::pow(1.045, n); };
  auto fill = [&](Afterglow& d) {
    d.init(kRate);
    d.set_param(p::kVolume, 0.0f);
    d.set_param(p::kDrift, 0.0f);
    d.set_param(p::kEvolve, 0.0f);
    for (int n = 0; n < 16; ++n) d.note_on(n, static_cast<float>(key(n)), 0.8f);
    render(d, 3.0f, kRate);
  };
  // Two keys in one block on a full pool: both sound.
  fill(device);
  device.note_on(20, 2000.0f, 0.8f);
  device.note_on(21, 2500.0f, 0.8f);
  Stereo two = render(device, 0.5f, kRate);
  const double first = db(tone_level(mid(two), 2000.0, kRate, at(0.05), at(0.45)));
  const double second = db(tone_level(mid(two), 2500.0, kRate, at(0.05), at(0.45)));
  std::snprintf(label, sizeof label, "two keys in one block on a full pool both sound (%.1f and %.1f dBFS)", first,
                second);
  EXPECT(first > -40.0 && second > -40.0 && std::fabs(first - second) < 3.0, label);
  std::printf("%s\n", label);

  // Two keys 2 ms apart on a full pool, with no strike and a slow bloom: the
  // first has hardly begun when the second arrives, and keeps its voice.
  device.init(kRate);
  device.set_param(p::kVolume, 0.0f);
  device.set_param(p::kDrift, 0.0f);
  device.set_param(p::kEvolve, 0.0f);
  device.set_param(p::kStrike, 0.0f);
  device.set_param(p::kBloom, 2.0f);
  for (int n = 0; n < 16; ++n) device.note_on(n, static_cast<float>(key(n)), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(20, 2000.0f, 0.8f);
  render(device, 0.002f, kRate);
  device.note_on(21, 2500.0f, 0.8f);
  Stereo spread = render(device, 2.6f, kRate);
  const double early = db(tone_level(mid(spread), 2000.0, kRate, at(2.1), at(2.6)));
  const double late = db(tone_level(mid(spread), 2500.0, kRate, at(2.1), at(2.6)));
  std::snprintf(label, sizeof label,
                "two keys 2 ms apart on a full pool, strike off and Bloom 2 s: both have bloomed (%.1f and %.1f dBFS)",
                early, late);
  EXPECT(early > -40.0 && late > -40.0 && std::fabs(early - late) < 3.0, label);
  std::printf("%s\n", label);

  // One key struck twice inside the steal: one voice is taken, not two, and
  // every note off is answered.
  double before[16], after[16];
  fill(device);
  Stereo steady = render(device, 1.0f, kRate);
  for (int n = 0; n < 16; ++n) before[n] = tone_level(mid(steady), key(n), kRate, at(0.0), at(1.0));
  device.note_on(20, 2000.0f, 0.8f);
  device.note_on(20, 2000.0f, 0.8f);
  render(device, 0.1f, kRate);
  Stereo taken = render(device, 1.0f, kRate);
  int gone = 0;
  for (int n = 0; n < 16; ++n) {
    after[n] = tone_level(mid(taken), key(n), kRate, at(0.0), at(1.0));
    if (after[n] < 0.3 * before[n]) ++gone;
  }
  for (int n = 0; n < 21; ++n) device.note_off(n);
  render(device, 9.0f, kRate);
  Stereo rest = render(device, 0.5f, kRate);
  std::snprintf(label, sizeof label,
                "a key struck twice during a steal takes %d voice, and all is silent after the keys are let go (%g)",
                gone, both_peak(rest));
  EXPECT(gone == 1 && both_peak(rest) == 0.0, label);
  std::printf("%s\n", label);

  // The same with two other keys already let go: the second strike is the
  // waiting note again, and does not take the second of them as well.
  fill(device);
  device.note_off(0);
  device.note_off(1);
  render(device, 0.05f, kRate);
  device.note_on(20, 2000.0f, 0.8f);
  device.note_on(20, 2000.0f, 0.8f);
  Stereo twice = render(device, 0.5f, kRate);
  const double struck = db(tone_level(mid(twice), 2000.0, kRate, at(0.05), at(0.45)));
  int taken_keys = 0;
  for (int n = 0; n < 16; ++n) {
    if (tone_level(mid(twice), key(n), kRate, at(0.05), at(0.45)) < 0.3 * before[n]) ++taken_keys;
  }
  std::snprintf(label, sizeof label,
                "struck twice with two keys fading: %d voice taken, and the key sounds as one note does (%.1f dBFS against %.1f)",
                taken_keys, struck, first);
  EXPECT(taken_keys == 1 && std::fabs(struck - first) < 1.5, label);
  std::printf("%s\n", label);

  // A key let go while it waits for its stolen voice still sounds, and ends.
  fill(device);
  device.note_on(20, 2000.0f, 0.8f);
  device.note_off(20);
  Stereo waited = render(device, 0.5f, kRate);
  const double heard = db(tone_level(mid(waited), 2000.0, kRate, at(0.05), at(0.45)));
  for (int n = 0; n < 16; ++n) device.note_off(n);
  render(device, 9.0f, kRate);
  Stereo done = render(device, 0.5f, kRate);
  std::snprintf(label, sizeof label, "a key let go inside the steal still sounds (%.1f dBFS) and ends (%g)", heard,
                both_peak(done));
  EXPECT(heard > -40.0 && both_peak(done) == 0.0, label);
}

// The same phrase at any block size, through a silence and a wake, with
// knobs moved in the silence. Every event sits on a multiple of 2048
// samples; the silence is stepped across the moment the device falls asleep.
static Stereo phrase(Afterglow& d, int block, int gap) {
  const size_t unit = 2048;
  d.init(kRate);
  d.set_param(p::kBloom, 0.3f);
  d.set_param(p::kFade, 0.1f);
  d.set_param(p::kDecay, 0.2f);
  d.note_on(1, 220.0f, 0.8f);
  d.note_on(2, 330.0f, 0.6f);
  Stereo out = render_frames(d, unit, block);
  d.note_off(1);
  out = concat(out, render_frames(d, unit, block));
  d.note_off(2);
  out = concat(out, render_frames(d, unit * static_cast<size_t>(gap - 1), block));
  d.set_param(p::kGlow, 0.9f);
  d.set_param(p::kTone, 0.7f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kVolume, -6.0f);
  d.set_param(p::kDrift, 0.8f);
  out = concat(out, render_frames(d, unit, block));
  d.note_on(3, 261.63f, 0.8f);
  d.note_on(4, 392.0f, 0.7f);
  out = concat(out, render_frames(d, unit * 6, block));
  d.note_off(3);
  d.note_off(4);
  return concat(out, render_frames(d, unit * 12, block));
}

static void test_block_sizes() {
  double worst = 0.0;
  int gaps = 0;
  bool slept = false, woke = false;
  for (int gap = 6; gap <= 20; ++gap) {
    Stereo reference = phrase(device, 128, gap);
    for (int block : {1, 2048, 0}) worst = std::max(worst, largest_difference(phrase(other, block, gap), reference));
    // The stretch before the second pair of notes: sounding for the short
    // gaps, exact silence (asleep or about to be) for the long ones.
    const size_t arrival = static_cast<size_t>(2 + gap) * 2048;
    if (both_peak(reference, arrival - 2048, arrival) > 0.0) woke = true; else slept = true;
    if (both_peak(reference, arrival, arrival + 6 * 2048) < 0.01) worst = 1.0e9;
    ++gaps;
  }
  std::snprintf(label, sizeof label,
                "blocks of 1, 128, 2048 and ragged frames give the same audio over %d silences, some slept through and some not (largest difference %g)",
                gaps, worst);
  EXPECT(worst == 0.0 && slept && woke, label);
  std::printf("%s\n", label);
}

// A second init gives the same audio, bit for bit; the notes draw on a
// seeded generator, so this is where a lost seed shows.
static void test_second_init() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kEvolve, 1.0f);
    device.set_param(p::kDrift, 0.7f);
    for (int n = 0; n < 5; ++n) {
      device.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 0.8f);
      out[pass] = concat(out[pass], render(device, 0.4f, kRate));
    }
    for (int n = 0; n < 5; ++n) device.note_off(n);
    out[pass] = concat(out[pass], render(device, 3.0f, kRate));
  }
  EXPECT(out[0].left == out[1].left && out[0].right == out[1].right && rms(out[0].left) > 1.0e-3,
         "a second init gives bit-identical audio for a phrase of five notes");
}

// Knobs moved while the instrument sleeps are in place for the next note:
// sample for sample the note of an instrument that was set that way all along.
static void test_knobs_in_silence() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    Afterglow& d = pass == 0 ? device : other;
    auto move = [&] {
      d.set_param(p::kStrike, 0.3f);
      d.set_param(p::kGlow, 1.0f);
      d.set_param(p::kTone, 0.9f);
      d.set_param(p::kHalo, 0.8f);
      d.set_param(p::kEvolve, 1.0f);
      d.set_param(p::kWidth, 1.0f);
      d.set_param(p::kVolume, 0.0f);
    };
    d.init(kRate);
    if (pass == 1) move();
    d.note_on(1, kC4, 0.8f);
    render(d, 0.5f, kRate);
    d.note_off(1);
    d.process(13);  // off the beat of the control tick
    render(d, 12.0f, kRate);
    if (pass == 0) move();
    render(d, 0.1f, kRate);
    d.note_on(2, 196.0f, 0.8f);
    out[pass] = render(d, 1.5f, kRate);
  }
  const double difference = largest_difference(out[0], out[1]);
  std::snprintf(label, sizeof label,
                "seven knobs moved in silence are in place for the next note (largest difference %g, the note peaks at %.3f)",
                difference, both_peak(out[1]));
  EXPECT(difference == 0.0 && both_peak(out[1]) > 0.05, label);
  std::printf("%s\n", label);
}

// Every key from 28 Hz to 4.2 kHz is heard at once and ends in silence;
// absurd notes are survived.
static void test_range_and_abuse() {
  double quietest = 0.0;
  for (float hz : {28.0f, 41.2f, 110.0f, 440.0f, 1760.0f, 4200.0f}) {
    device.init(kRate);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    quietest = std::min(quietest, db(both_peak(out, 0, at(0.03))));
  }
  std::snprintf(label, sizeof label, "from 28 Hz to 4.2 kHz a key peaks at %.1f dBFS or more in its first 30 ms",
                quietest);
  EXPECT(quietest > -36.0, label);
  std::printf("%s\n", label);

  device.init(kRate);
  const float inf = std::numeric_limits<float>::infinity();
  device.note_on(1, inf, 0.8f);
  device.note_on(2, -inf, inf);
  device.note_on(3, -440.0f, -1.0f);
  device.note_on(4, 1.0e30f, 1.0e30f);
  device.note_on(5, std::nanf(""), 0.8f);
  device.note_on(6, 440.0f, std::nanf(""));
  device.note_off(99);
  Stereo abused = render(device, 1.0f, kRate);
  for (int n = 1; n <= 6; ++n) device.note_off(n);
  device.note_off(6);
  render(device, 10.0f, kRate);
  Stereo rest = render(device, 0.5f, kRate);
  EXPECT(finite(abused.left) && finite(abused.right) && both_peak(abused) < 1.0 && both_peak(rest) == 0.0,
         "infinite, negative, huge and NaN notes are survived and released to silence");
}

int main() {
  Conformance spec;
  spec.name = "afterglow";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 10.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_partials();
  test_decay();
  test_bloom();
  test_moment();
  test_evolve();
  test_fade();
  test_long_hold();
  test_halo();
  test_drift();
  test_held_chord();
  test_short_note();
  test_short_run();
  test_restrike();
  test_tone();
  test_width();

  test_velocity();
  test_levels();
  test_soft_clip();
  test_clicks();
  test_stealing();
  test_block_sizes();
  test_second_init();
  test_knobs_in_silence();
  test_range_and_abuse();

  // Cost with eight keys held and their glow up (three readings: take the best).
  for (int reading = 0; reading < 3; ++reading) {
    device.init(kRate);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    render(device, 2.0f, kRate);
    report_cost("afterglow (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }
  return finish("afterglow");
}
