// Native harness for Flute (cpp/devices/flute). The conformance pass covers
// silence before and after notes, voice stealing under a pile of keys,
// parameter abuse and other sample rates; the rest measures what makes it a
// blown pipe: tuning, pitch and brightness that follow the breath, air shaped
// by the bore and arriving first, slow speech low down, chiff, scoop, a late
// vibrato, and five types that differ.
//
// Two measuring tricks carry most of it. The tone and the air are
// independent, so a render with Breath up minus the same render with Breath
// at zero is the air alone (the tone cancels to the last bit while the
// output is under the soft clip's knee). And with the air off the tone has
// one upward zero crossing per period, so its pitch is a count of crossings.

#include "../devices/flute/flute.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Flute;
namespace p = livemix::flute;

static Flute device;

static const float kRate = 48000.0f;
static const double kC2 = 65.4064, kC3 = 130.813, kC4 = 261.626, kC5 = 523.251, kC6 = 1046.50, kC7 = 2093.00;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A bare tone: no air, chiff, scoop or vibrato, a tongued start, a short end.
static void bare_at(Flute& d, float rate) {
  d.init(rate);
  d.set_param(p::kBreath, 0.0f);
  d.set_param(p::kChiff, 0.0f);
  d.set_param(p::kScoop, 0.0f);
  d.set_param(p::kVibrato, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
}

static void bare(Flute& d) { bare_at(d, kRate); }

// Times of the upward zero crossings in [from, to), in samples, each placed
// by a straight line between its two neighbours.
static std::vector<double> crossings(const std::vector<float>& x, size_t from, size_t to) {
  std::vector<double> times;
  to = std::min(to, x.size());
  for (size_t i = from + 1; i < to; ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      times.push_back(static_cast<double>(i - 1) + static_cast<double>(-x[i - 1]) / (x[i] - x[i - 1]));
    }
  }
  return times;
}

// Mean frequency over [from, to) from its crossings: only for a tone alone.
static double crossing_hz(const std::vector<float>& x, double rate, size_t from, size_t to) {
  const std::vector<double> times = crossings(x, from, to);
  if (times.size() < 2) return 0.0;
  return static_cast<double>(times.size() - 1) * rate / (times.back() - times.front());
}

// Pitch of every cycle in [from, to) against `reference`, in cents.
static std::vector<float> cycle_cents(const std::vector<float>& x, double rate, double reference, size_t from,
                                      size_t to) {
  const std::vector<double> times = crossings(x, from, to);
  std::vector<float> out;
  for (size_t i = 1; i < times.size(); ++i) {
    out.push_back(static_cast<float>(cents(rate / (times[i] - times[i - 1]), reference)));
  }
  return out;
}

// Half the distance between the lowest and the highest value.
static double swing(const std::vector<float>& x) {
  if (x.empty()) return 0.0;
  const auto ends = std::minmax_element(x.begin(), x.end());
  return 0.5 * (*ends.second - *ends.first);
}

// Power of the `hz` component averaged over half-overlapping segments: a
// steady estimate for noise, where one window's reading is a lottery.
static double band_power(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                         size_t segment) {
  double sum = 0.0;
  int count = 0;
  for (size_t start = from; start + segment <= to && start + segment <= x.size(); start += segment / 2) {
    const double level = tone_level(x, hz, rate, start, start + segment);
    sum += level * level;
    ++count;
  }
  return count > 0 ? sum / count : 0.0;
}

static double harmonic_db(const std::vector<float>& x, double hz, int harmonic, size_t from, size_t to) {
  return db(tone_level(x, hz * harmonic, kRate, from, to));
}

// The ratio of two powers in dB.
static double power_db(double power, double reference) { return 10.0 * std::log10(power / reference); }

// Harmonic `harmonic` against the fundamental, in dB, read at the pitch the
// tone actually has (a soft note is a few cents flat, which is enough to slip
// out of a long window's bin). Only for a tone alone.
static double share_db(const std::vector<float>& x, int harmonic, size_t from, size_t to) {
  const double hz = crossing_hz(x, kRate, from, to);
  return harmonic_db(x, hz, harmonic, from, to) - harmonic_db(x, hz, 1, from, to);
}

// How far the loudness of `air` rises and falls once per period of `tone`,
// as a share of its mean. The component of air squared at the tone's
// frequency is summed in the tone's own phase over short segments, so only
// what keeps its place in the tone's cycle adds up; the flutter that noise
// through a pipe has anyway does not.
static double pulse_depth(const std::vector<float>& air, const std::vector<float>& tone, double hz, size_t from,
                          size_t to) {
  const size_t segment = at(0.05);
  double sum_re = 0.0, sum_im = 0.0, total = 0.0;
  for (size_t start = from; start + segment <= to && start + segment <= air.size(); start += segment) {
    double air_re = 0.0, air_im = 0.0, tone_re = 0.0, tone_im = 0.0;
    for (size_t i = start; i < start + segment; ++i) {
      const double angle = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
      const double power = static_cast<double>(air[i]) * air[i];
      air_re += power * std::cos(angle);
      air_im -= power * std::sin(angle);
      tone_re += tone[i] * std::cos(angle);
      tone_im -= tone[i] * std::sin(angle);
      total += power;
    }
    const double size = std::hypot(tone_re, tone_im);
    if (size <= 0.0) continue;
    sum_re += (air_re * tone_re + air_im * tone_im) / size;
    sum_im += (air_im * tone_re - air_re * tone_im) / size;
  }
  return total > 0.0 ? 2.0 * std::hypot(sum_re, sum_im) / total : 0.0;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::min(a.size(), b.size()));
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

// One note rendered after `setup`, left channel.
template <typename Setup>
static std::vector<float> play(Setup setup, double hz, float gain, float seconds, float rate = kRate) {
  setup(device);
  device.note_on(1, static_cast<float>(hz), gain);
  return render(device, seconds, rate).left;
}

// The air alone: the same note with Breath at `breath` and at zero, subtracted.
template <typename Setup>
static std::vector<float> air_alone(Setup setup, float breath, double hz, float gain, float seconds) {
  const std::vector<float> with = play(
      [&](Flute& d) {
        setup(d);
        d.set_param(p::kBreath, breath);
      },
      hz, gain, seconds);
  const std::vector<float> without = play(
      [&](Flute& d) {
        setup(d);
        d.set_param(p::kBreath, 0.0f);
      },
      hz, gain, seconds);
  return minus(with, without);
}

// RMS over a sliding window ending at each hop, for onset timing.
static std::vector<double> envelope(const std::vector<float>& x, size_t window, size_t hop) {
  std::vector<double> out;
  for (size_t end = window; end <= x.size(); end += hop) out.push_back(rms(x, end - window, end));
  return out;
}

// First time (seconds, by the window's end) the envelope passes `share` of `full`.
static double time_to(const std::vector<double>& env, double full, double share, size_t window, size_t hop) {
  for (size_t i = 0; i < env.size(); ++i) {
    if (env[i] >= share * full) return static_cast<double>(window + i * hop) / kRate;
  }
  return 1.0e9;
}

// Share of the energy above `hz` in dB, through a 24 dB per octave high-pass.
static double above_db(const std::vector<float>& x, double hz, size_t from, size_t to) {
  livemix::kit::Biquad stage[2];
  for (livemix::kit::Biquad& filter : stage) filter.set_highpass(static_cast<float>(hz), 0.7071f, kRate);
  double high = 0.0, total = 0.0;
  for (size_t i = 0; i < to && i < x.size(); ++i) {
    const float y = stage[1].process(stage[0].process(x[i]));
    if (i < from) continue;
    high += static_cast<double>(y) * y;
    total += static_cast<double>(x[i]) * x[i];
  }
  return 10.0 * std::log10(std::max(high, 1.0e-30) / std::max(total, 1.0e-30));
}

static void with_type(Flute& d, int type) {
  bare(d);
  d.set_param(p::kType, static_cast<float>(type));
}

int main() {
  Conformance spec;
  spec.name = "flute";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[200];

  // Tuning: a mezzo-forte note is on the key from C2 to C6 at every rate.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {kC2, kC3, kC4, kC5, kC6}) {
        const std::vector<float> out = play([&](Flute& d) { bare_at(d, rate); }, hz, 0.75f, 4.5f, rate);
        const double off = cents(crossing_hz(out, rate, at(0.5, rate), at(4.5, rate)), hz);
        worst = std::max(worst, std::fabs(off));
        std::snprintf(label, sizeof label, "%.1f Hz at %.0f Hz is in tune (%.2f cents off)", hz, rate, off);
        EXPECT(std::fabs(off) <= 3.0, label);
      }
    }
    std::printf("flute tuning: worst %.2f cents over C2..C6 at 44.1, 48 and 96 kHz\n", worst);
    // The crossing count agrees with a spectral peak search.
    const std::vector<float> out = play(bare, kC4, 0.75f, 3.0f);
    const double peak_hz = dominant_frequency(out, kRate, kC4 * 0.97, kC4 * 1.03, at(0.5), at(3.0));
    EXPECT_NEAR(cents(peak_hz, kC4), 0.0, 3.0, "the spectral peak of C4 is on the key too");
    // The top key of a piano is inside the range at the lowest common rate.
    const double c8 = 4186.01;
    const std::vector<float> top = play([](Flute& d) { bare_at(d, 44100.0f); }, c8, 0.75f, 2.0f, 44100.0f);
    EXPECT_NEAR(cents(crossing_hz(top, 44100.0, at(0.5, 44100.0), at(2.0, 44100.0)), c8), 0.0, 3.0,
                "C8 at 44.1 kHz is on the key");
  }

  // Pitch follows breath: harder is sharper, and a dying note sags flat.
  {
    const std::vector<float> hard = play(bare, kC5, 1.0f, 3.0f);
    const std::vector<float> soft = play(bare, kC5, 0.2f, 3.0f);
    const double rise = cents(crossing_hz(hard, kRate, at(0.5), at(3.0)), crossing_hz(soft, kRate, at(0.5), at(3.0)));
    std::snprintf(label, sizeof label, "a hard note is 3 to 25 cents sharper than a soft one (%.1f)", rise);
    EXPECT(rise >= 3.0 && rise <= 25.0, label);

    bare(device);
    device.set_param(p::kRelease, 2.0f);
    device.note_on(1, static_cast<float>(kC5), 0.75f);
    const Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    const Stereo tail = render(device, 2.0f, kRate);
    // A 2 s release is 20 dB down two thirds of a second in.
    const double drop = db(rms(tail.left, at(0.60), at(0.73)) / rms(held.left, at(0.5), at(1.0)));
    const double sag = cents(crossing_hz(tail.left, kRate, at(0.60), at(0.73)), kC5);
    std::snprintf(label, sizeof label, "20 dB into its release (%.1f dB) a note is 5 to 40 cents flat (%.1f)",
                  drop, sag);
    EXPECT(drop < -14.0 && drop > -26.0 && sag <= -5.0 && sag >= -40.0, label);
  }

  // Loud is brighter, inside one note: over a slow swell harmonic h rises
  // h times as many dB as the fundamental.
  {
    const std::vector<float> out = play(
        [](Flute& d) {
          bare(d);
          d.set_param(p::kAttack, 2.0f);
        },
        kC4, 1.0f, 3.0f);
    // Read at the pitch each moment has: the faint start is some cents flat.
    const double early_hz = crossing_hz(out, kRate, at(0.10), at(0.25));
    const double late_hz = crossing_hz(out, kRate, at(2.5), at(3.0));
    double rise[4];
    for (int h = 1; h <= 3; ++h) {
      rise[h] = harmonic_db(out, late_hz, h, at(2.5), at(3.0)) - harmonic_db(out, early_hz, h, at(0.10), at(0.25));
    }
    std::snprintf(label, sizeof label,
                  "over a swell the fundamental rises %.1f dB, harmonic 2 %.1f dB, harmonic 3 %.1f dB", rise[1],
                  rise[2], rise[3]);
    EXPECT(rise[1] > 6.0 && rise[2] >= 1.6 * rise[1] && rise[3] >= 2.3 * rise[1], label);
  }

  // The same law across touch, and how pure and how full the tone gets.
  {
    const std::vector<float> loud = play(bare, kC4, 1.0f, 2.0f);
    const std::vector<float> quiet = play(bare, kC4, 0.3f, 2.0f);
    const std::vector<float> softest = play(bare, kC4, 0.1f, 2.0f);
    const size_t a = at(1.0), b = at(2.0);
    const double tilt_loud = share_db(loud, 3, a, b);
    const double tilt_quiet = share_db(quiet, 3, a, b);
    std::snprintf(label, sizeof label, "harmonic 3 against the fundamental gains 8 dB or more from soft to loud (%.1f)",
                  tilt_loud - tilt_quiet);
    EXPECT(tilt_loud - tilt_quiet >= 8.0, label);
    const double pure = share_db(softest, 2, a, b);
    std::snprintf(label, sizeof label, "the softest touch is nearly a sine: harmonic 2 at %.1f dB", pure);
    EXPECT(pure <= -15.0, label);
    const double full = share_db(loud, 2, a, b);
    std::snprintf(label, sizeof label, "a forte low note is full: harmonic 2 at %.1f dB", full);
    EXPECT(full >= -12.0, label);
    // Small dynamic range: soft is quieter, but not by much.
    const double range = db(rms(quiet, a, b) / rms(loud, a, b));
    std::snprintf(label, sizeof label, "soft is 2 to 10 dB quieter than loud (%.1f)", range);
    EXPECT(range <= -2.0 && range >= -10.0, label);
  }

  // Blow adds overtones and leaves the pitch alone.
  {
    const auto blown = [](float blow) {
      return play(
          [blow](Flute& d) {
            bare(d);
            d.set_param(p::kBlow, blow);
          },
          kC4, 0.75f, 3.0f);
    };
    const std::vector<float> gentle = blown(0.0f), hard = blown(1.0f);
    const size_t a = at(1.0), b = at(3.0);
    const double gain = share_db(hard, 3, a, b) - share_db(gentle, 3, a, b);
    std::snprintf(label, sizeof label, "Blow raises harmonic 3 by 15 dB or more (%.1f)", gain);
    EXPECT(gain >= 15.0, label);
    const double moved = cents(crossing_hz(hard, kRate, at(0.5), b), crossing_hz(gentle, kRate, at(0.5), b));
    std::snprintf(label, sizeof label, "Blow does not retune the note (%.2f cents)", moved);
    EXPECT(std::fabs(moved) < 1.0, label);
  }

  // How much air: none at Breath 0, mostly air at Breath 1, part of the tone
  // at the default.
  {
    const std::vector<float> tone = play(bare, kC4, 0.75f, 5.0f);
    const size_t a = at(1.0), b = at(5.0);
    double gap = -200.0;
    for (int k = 1; k <= 4; ++k) {
      gap = std::max(gap, db(tone_level(tone, kC4 * (k + 0.5), kRate, a, b) / tone_level(tone, kC4, kRate, a, b)));
    }
    std::snprintf(label, sizeof label, "Breath 0 leaves the gaps between harmonics empty (%.1f dB)", gap);
    EXPECT(gap <= -60.0, label);

    const double full = db(rms(tone, a, b) / rms(air_alone(bare, 1.0f, kC4, 0.75f, 5.0f), a, b));
    std::snprintf(label, sizeof label, "Breath 1 is mostly air: tone over air %.1f dB", full);
    EXPECT(full >= 0.0 && full <= 15.0, label);
    const double usual = db(rms(tone, a, b) / rms(air_alone(bare, 0.4f, kC4, 0.75f, 5.0f), a, b));
    std::snprintf(label, sizeof label, "the default Breath is part of the tone: tone over air %.1f dB", usual);
    EXPECT(usual >= 15.0 && usual <= 35.0, label);

    // The air does not thin out as the sample rate rises.
    const auto at_96k = [](float breath) {
      return play(
          [breath](Flute& d) {
            bare_at(d, 96000.0f);
            d.set_param(p::kBreath, breath);
          },
          kC4, 0.75f, 5.0f, 96000.0f);
    };
    const std::vector<float> tone_96k = at_96k(0.0f);
    const std::vector<float> air_96k = minus(at_96k(1.0f), tone_96k);
    const double full_96k = db(rms(tone_96k, at(1.0, 96000.0), at(5.0, 96000.0)) /
                               rms(air_96k, at(1.0, 96000.0), at(5.0, 96000.0)));
    std::snprintf(label, sizeof label, "at 96 kHz tone over air is within 2 dB of 48 kHz (%.1f dB against %.1f)",
                  full_96k, full);
    EXPECT(std::fabs(full_96k - full) <= 2.0, label);
  }

  // The air is shaped by the pipe: peaks at the harmonics, valleys between,
  // low and high, and nothing piled up under the fundamental.
  for (double hz : {kC3, kC6}) {
    const std::vector<float> air = air_alone(bare, 1.0f, hz, 0.75f, 9.0f);
    const auto power = [&](double k) { return band_power(air, hz * k, kRate, at(1.0), at(9.0), at(0.2)); };
    double least = 1.0e9;
    for (int k = 1; k <= 4; ++k) {
      least = std::min(least, power_db(power(k), power(k + 0.5)));
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the air peaks on harmonics 1 to 4 by 6 dB or more (least %.1f)", hz,
                  least);
    EXPECT(least >= 6.0, label);
    const double below = power_db(power(0.25), power(1.0));
    std::snprintf(label, sizeof label, "at %.0f Hz the air under the fundamental stays below it (%.1f dB)", hz, below);
    EXPECT(below <= -6.0, label);
  }

  // The air pulses with the note: it is louder at one place in every cycle
  // of the tone, as a jet that swings across an edge is.
  {
    const std::vector<float> tone = play(bare, kC4, 0.75f, 9.0f);
    const std::vector<float> air = air_alone(bare, 1.0f, kC4, 0.75f, 9.0f);
    const double depth = pulse_depth(air, tone, kC4, at(1.0), at(9.0));
    std::snprintf(label, sizeof label, "the air's loudness swings with the tone's cycle (%.2f of its mean)", depth);
    EXPECT(depth >= 0.15, label);
  }

  // Air first: the breath is heard before the tone has spoken.
  {
    const size_t window = at(0.010), hop = at(0.001);
    const std::vector<float> tone = play(bare, kC3, 0.75f, 1.5f);
    const std::vector<float> air = air_alone(bare, 1.0f, kC3, 0.75f, 1.5f);
    const double tone_at = time_to(envelope(tone, window, hop), rms(tone, at(0.7), at(1.5)), 0.5, window, hop);
    const double air_at = time_to(envelope(air, window, hop), rms(air, at(0.7), at(1.5)), 0.5, window, hop);
    std::snprintf(label, sizeof label, "the air arrives 5 ms or more before the tone (air %.1f ms, tone %.1f ms)",
                  1000.0 * air_at, 1000.0 * tone_at);
    EXPECT(tone_at - air_at >= 0.005, label);
  }

  // Low notes speak slowly.
  {
    const size_t window = at(0.010), hop = at(0.001);
    double rise[2];
    int n = 0;
    for (double hz : {kC3, kC6}) {
      const std::vector<float> tone = play(bare, hz, 0.75f, 1.5f);
      const std::vector<double> env = envelope(tone, window, hop);
      const double full = rms(tone, at(0.7), at(1.5));
      rise[n++] = time_to(env, full, 0.9, window, hop) - time_to(env, full, 0.1, window, hop);
    }
    std::snprintf(label, sizeof label, "C3 takes 1.5 times as long to speak as C6 or more (%.1f ms against %.1f ms)",
                  1000.0 * rise[0], 1000.0 * rise[1]);
    EXPECT(rise[0] >= 1.5 * rise[1], label);
  }

  // Chiff: the octave flicks at the start and a puff of air goes with it.
  {
    const auto chiffed = [](float chiff, int type) {
      return play(
          [chiff, type](Flute& d) {
            with_type(d, type);
            d.set_param(p::kChiff, chiff);
          },
          kC4, 0.8f, 2.0f);
    };
    const auto upper = [](const std::vector<float>& x, int h, size_t from, size_t to) {
      return harmonic_db(x, kC4, h, from, to) - harmonic_db(x, kC4, 1, from, to);
    };
    const std::vector<float> with = chiffed(1.0f, Flute::kConcert), without = chiffed(0.0f, Flute::kConcert);
    const double flick = upper(with, 2, at(0.0), at(0.04)) - upper(with, 2, at(1.0), at(2.0));
    const double none = upper(without, 2, at(0.0), at(0.04)) - upper(without, 2, at(1.0), at(2.0));
    std::snprintf(label, sizeof label, "Chiff 1 starts on the octave: %.1f dB over its steady share (Chiff 0: %.1f)",
                  flick, none);
    EXPECT(flick >= 6.0 && none < 3.0, label);
    const std::vector<float> pipes = chiffed(1.0f, Flute::kPanPipes);
    const double twelfth = upper(pipes, 3, at(0.0), at(0.04)) - upper(pipes, 3, at(1.0), at(2.0));
    std::snprintf(label, sizeof label, "pan pipes start on the twelfth: %.1f dB over its steady share", twelfth);
    EXPECT(twelfth >= 6.0, label);
    // The puff: air between the harmonics at the start, gone once it settles.
    const auto between = [](const std::vector<float>& x, size_t from, size_t to) {
      double sum = 0.0;
      for (double k : {2.5, 3.5, 4.5}) sum += tone_level(x, kC4 * k, kRate, from, to);
      return db(sum / 3.0);
    };
    const double puff = between(with, at(0.0), at(0.06)) - between(without, at(0.0), at(0.06));
    const double later = between(with, at(1.0), at(2.0)) - harmonic_db(with, kC4, 1, at(1.0), at(2.0));
    std::snprintf(label, sizeof label, "Chiff 1 puffs air at the start (%.1f dB over Chiff 0) and then stops (%.1f dB)",
                  puff, later);
    EXPECT(puff >= 20.0 && later <= -60.0, label);
  }

  // Scoop: a note starts flat by the knob's amount and is in tune by 250 ms.
  {
    const auto scooped = [](float amount) {
      return play(
          [amount](Flute& d) {
            bare(d);
            d.set_param(p::kScoop, amount);
          },
          kC5, 0.75f, 1.0f);
    };
    const std::vector<float> bent = scooped(100.0f), straight = scooped(0.0f);
    const double start = cents(crossing_hz(bent, kRate, at(0.002), at(0.009)), kC5);
    const double arrived = cents(crossing_hz(bent, kRate, at(0.25), at(0.45)), kC5);
    const double plain = cents(crossing_hz(straight, kRate, at(0.002), at(0.009)), kC5);
    std::snprintf(label, sizeof label, "Scoop 100 starts %.1f cents off and is %.1f off after 250 ms (Scoop 0: %.1f)",
                  start, arrived, plain);
    EXPECT(start <= -80.0 && start >= -120.0 && std::fabs(arrived) <= 5.0 && plain > -20.0, label);
  }

  // Vibrato: late, at the type's speed, and deeper in the overtones.
  {
    const auto sung = [](float depth, int type) {
      return play(
          [depth, type](Flute& d) {
            with_type(d, type);
            d.set_param(p::kVibrato, depth);
          },
          kC5, 0.75f, 6.0f);
    };
    const std::vector<float> out = sung(1.0f, Flute::kConcert);
    // One reading per cycle is a signal sampled at the note's frequency.
    const std::vector<float> early = cycle_cents(out, kRate, kC5, at(0.05), at(0.2));
    const std::vector<float> late = cycle_cents(out, kRate, kC5, at(2.0), at(6.0));
    const double rate = dominant_frequency(late, kC5, 2.0, 10.0);
    EXPECT_NEAR(rate, 5.4, 0.03 * 5.4, "the concert flute's vibrato runs at 5.4 Hz");
    const double depth = swing(late);
    std::snprintf(label, sizeof label, "full vibrato swings the pitch 9 to 18 cents (%.1f)", depth);
    EXPECT(depth >= 9.0 && depth <= 18.0, label);
    std::snprintf(label, sizeof label, "in its first 200 ms a note has under a quarter of it (%.1f cents)",
                  swing(early));
    EXPECT(swing(early) < 0.25 * depth, label);

    std::vector<float> first, second;
    for (size_t from = at(2.0); from + at(0.04) <= out.size(); from += at(0.01)) {
      first.push_back(static_cast<float>(harmonic_db(out, kC5, 1, from, from + at(0.04))));
      second.push_back(static_cast<float>(harmonic_db(out, kC5, 2, from, from + at(0.04))));
    }
    std::snprintf(label, sizeof label, "it moves harmonic 2 more than the fundamental (%.1f dB against %.1f dB)",
                  2.0 * swing(second), 2.0 * swing(first));
    EXPECT(swing(first) > 0.5 && swing(second) > 1.4 * swing(first), label);

    const std::vector<float> still = cycle_cents(sung(0.0f, Flute::kConcert), kRate, kC5, at(2.0), at(6.0));
    std::snprintf(label, sizeof label, "Vibrato 0 leaves only the drift (%.1f cents)", swing(still));
    EXPECT(swing(still) < 4.0, label);

    const std::vector<float> slow = cycle_cents(sung(1.0f, Flute::kShakuhachi), kRate, kC5, at(2.0), at(6.0));
    EXPECT_NEAR(dominant_frequency(slow, kC5, 2.0, 10.0), 3.8, 0.03 * 3.8, "the shakuhachi's is slower, 3.8 Hz");
    std::snprintf(label, sizeof label, "and wider (%.1f cents against %.1f)", swing(slow), depth);
    EXPECT(swing(slow) > 1.3 * depth, label);
  }

  // The types. Pan pipes are stopped: even harmonics far under the odd ones,
  // in the tone and in the air.
  {
    const std::vector<float> tone = play([](Flute& d) { with_type(d, Flute::kPanPipes); }, kC4, 0.9f, 2.0f);
    const size_t a = at(1.0), b = at(2.0);
    for (int even : {2, 4}) {
      const double under = harmonic_db(tone, kC4, even, a, b) -
                           0.5 * (harmonic_db(tone, kC4, even - 1, a, b) + harmonic_db(tone, kC4, even + 1, a, b));
      std::snprintf(label, sizeof label, "pan pipes: harmonic %d is %.1f dB against its odd neighbours", even, under);
      EXPECT(under <= -15.0, label);
    }
    const std::vector<float> air =
        air_alone([](Flute& d) { with_type(d, Flute::kPanPipes); }, 1.0f, kC4, 0.75f, 9.0f);
    const auto power = [&](double k) { return band_power(air, kC4 * k, kRate, at(1.0), at(9.0), at(0.2)); };
    const double odd = power_db(std::min(power(1.0), power(3.0)), std::max(power(2.0), power(4.0)));
    std::snprintf(label, sizeof label, "pan pipes: the air peaks on odd harmonics only (%.1f dB over the even ones)",
                  odd);
    EXPECT(odd >= 6.0, label);
  }
  {
    // The same note on each type: tone over air at one Breath, and brightness.
    double clean[Flute::kNumTypes], top[Flute::kNumTypes];
    for (int type = 0; type < Flute::kNumTypes; ++type) {
      const auto setup = [type](Flute& d) { with_type(d, type); };
      const std::vector<float> tone = play(setup, kC4, 0.75f, 5.0f);
      clean[type] = db(rms(tone, at(1.0), at(5.0)) / rms(air_alone(setup, 0.6f, kC4, 0.75f, 5.0f), at(1.0), at(5.0)));
      const std::vector<float> whole = play(
          [type](Flute& d) {
            with_type(d, type);
            d.set_param(p::kBreath, 0.4f);
          },
          kC4, 0.75f, 3.0f);
      top[type] = above_db(whole, 2000.0, at(1.0), at(3.0));
    }
    std::printf("flute types, tone over air at Breath 0.6: %.1f %.1f %.1f %.1f %.1f dB; energy above 2 kHz: %.1f %.1f "
                "%.1f %.1f %.1f dB\n",
                clean[0], clean[1], clean[2], clean[3], clean[4], top[0], top[1], top[2], top[3], top[4]);
    EXPECT(clean[Flute::kShakuhachi] <= clean[Flute::kConcert] - 3.0, "the shakuhachi is airier than the concert flute");
    EXPECT(clean[Flute::kWoodFlute] >= clean[Flute::kConcert] + 3.0, "the wood flute is cleaner than the concert flute");
    EXPECT(top[Flute::kLowFlute] <= top[Flute::kConcert] - 3.0, "the low flute is darker than the concert flute");
    EXPECT(top[Flute::kShakuhachi] >= top[Flute::kConcert] + 2.0, "the shakuhachi is brighter than the concert flute");
  }
  {
    // Type waits for the next note: a held note does not change under it.
    bare(device);
    device.note_on(1, static_cast<float>(kC4), 0.75f);
    render(device, 0.5f, kRate);
    Stereo kept = render(device, 0.5f, kRate);
    bare(device);
    device.note_on(1, static_cast<float>(kC4), 0.75f);
    render(device, 0.5f, kRate);
    device.set_param(p::kType, static_cast<float>(Flute::kPanPipes));
    Stereo changed = render(device, 0.5f, kRate);
    EXPECT(kept.left == changed.left && kept.right == changed.right, "Type applies from the next note");
  }

  // Attack and release are the times they say.
  {
    bare(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, static_cast<float>(kC5), 0.75f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, at(1.5), at(2.0));
    EXPECT(rms(rise.left, 0, at(0.1)) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, at(1.1), at(1.2)) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, at(0.4), at(0.5)) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, at(1.05), at(1.15)) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, at(2.0), at(3.0)) == 0.0, "and is exactly silent soon after");
  }

  // A key struck again while every voice sounds takes back the voice it is
  // stopping. The note that follows still dies away in its own time.
  {
    bare(device);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(0, 110.0f, 0.8f);
    for (int n = 1; n < 8; ++n) device.note_on(n, 1000.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(0, 110.0f, 0.8f);
    Stereo held = render(device, 0.5f, kRate);
    device.note_off(0);
    Stereo tail = render(device, 0.5f, kRate);
    const double left = tone_level(tail.left, 110.0, kRate, at(0.15), at(0.35)) /
                        tone_level(held.left, 110.0, kRate, at(0.3), at(0.5));
    std::snprintf(label, sizeof label,
                  "a key struck again with every voice busy keeps its release (%.2f of its level after 250 ms)", left);
    EXPECT(left > 0.1, label);
  }

  // Levels at the default patch, low, middle and high.
  {
    for (double hz : {kC2, kC4, kC6}) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(hz), 0.7f);
      const double usual = db(peak(render(device, 2.0f, kRate).left));
      device.init(kRate);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      const double app = db(std::max(peak(out.left), peak(out.right)));
      std::snprintf(label, sizeof label, "%.0f Hz peaks at %.1f dBFS at gain 0.7 and %.1f dBFS at gain 0.8", hz, usual,
                    app);
      EXPECT(usual > -24.0 && usual < -10.0 && app > -22.0 && app < -16.0, label);
    }
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    std::snprintf(label, sizeof label, "ten held notes stay under the clip knee (peak %.2f)",
                  std::max(peak(out.left), peak(out.right)));
    EXPECT(peak(out.left) < 0.5 && peak(out.right) < 0.5, label);
  }

  // Nothing folds back. The kernel's cap first: a series at the cap has its
  // fold-back 55 dB down, and the same series without the cap does not.
  {
    const double hz = 5000.0;
    const auto fold_back = [&](float a) {
      std::vector<float> x(at(1.0));
      for (size_t i = 0; i < x.size(); ++i) {
        const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
        x[i] = p::harmonic_series(static_cast<float>(std::sin(phase)), static_cast<float>(std::cos(phase)), a);
      }
      // Harmonics 5 to 9 land above Nyquist and fold to 23, 18, 13, 8 and 3 kHz.
      double worst = -200.0;
      for (double alias : {23000.0, 18000.0, 13000.0, 8000.0, 3000.0}) {
        worst = std::max(worst, db(tone_level(x, alias, kRate) / tone_level(x, hz, kRate)));
      }
      return worst;
    };
    const float cap = p::brightness_cap(static_cast<float>(hz), kRate);
    std::snprintf(label, sizeof label, "a series at the cap (%.3f) folds back at %.1f dB, at 0.7 at %.1f dB", cap,
                  fold_back(cap), fold_back(0.7f));
    EXPECT(fold_back(cap) <= -55.0 && fold_back(0.7f) > -20.0, label);
  }
  // Then the instrument, blown as hard as it goes on high notes.
  for (double hz : {kC6, kC7}) {
    const std::vector<float> out = play(
        [](Flute& d) {
          bare(d);
          d.set_param(p::kBlow, 1.0f);
        },
        hz, 1.0f, 2.0f);
    double worst = -200.0;
    for (int h = 2; h <= 60; ++h) {
      double alias = std::fmod(hz * h, kRate);
      if (alias > 0.5 * kRate) alias = kRate - alias;
      if (hz * h < 0.5 * kRate) continue;
      // Skip a fold that lands on a true harmonic.
      const double nearest = std::round(alias / hz) * hz;
      if (std::fabs(alias - nearest) < 0.01 * hz) continue;
      const double folded = tone_level(out, alias, kRate, at(1.0), at(2.0));
      worst = std::max(worst, db(folded / tone_level(out, hz, kRate, at(1.0), at(2.0))));
    }
    std::snprintf(label, sizeof label, "%.0f Hz at full Blow: fold-back at %.1f dB", hz, worst);
    EXPECT(worst <= -50.0, label);
  }

  // No clicks: a stolen voice, a key struck again, a short release, and the
  // two knobs most likely to be moved while a note sounds.
  {
    const auto quiet_setup = [](Flute& d) {
      bare(d);
      d.set_param(p::kRelease, 0.03f);
    };
    // The steepest step of the notes themselves, for comparison.
    quiet_setup(device);
    for (int n = 0; n < 8; ++n) device.note_on(n, 220.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    Stereo chord = render(device, 1.0f, kRate);
    const double natural = max_step(chord.left, at(0.5));
    device.note_on(8, 660.0f, 0.8f);
    Stereo stolen = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label, "a ninth note steals a voice without a click (step %.4f, the chord's own %.4f)",
                  max_step(stolen.left), natural);
    EXPECT(max_step(stolen.left) < 1.5 * natural, label);

    quiet_setup(device);
    device.note_on(1, 440.0f, 0.8f);
    Stereo one = render(device, 0.5f, kRate);
    const double single = max_step(one.left, at(0.25));
    device.note_on(1, 440.0f, 0.8f);
    Stereo again = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label, "striking a held key again does not click (step %.4f, the note's own %.4f)",
                  max_step(again.left), single);
    EXPECT(max_step(again.left) < 2.5 * single, label);
    device.note_off(1);
    Stereo off = render(device, 0.2f, kRate);
    std::snprintf(label, sizeof label, "the shortest release does not click (step %.4f)", max_step(off.left));
    EXPECT(max_step(off.left) < 2.5 * single, label);

    for (int knob : {p::kBreath, p::kBlow}) {
      device.init(kRate);
      device.set_param(p::kVibrato, 0.0f);
      device.set_param(knob, 0.0f);
      device.note_on(1, 440.0f, 0.8f);
      render(device, 0.5f, kRate);
      device.set_param(knob, 1.0f);
      Stereo moved = render(device, 0.1f, kRate);
      Stereo settled = render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "moving param %d end to end does not click (step %.4f, settled %.4f)", knob,
                    max_step(moved.left), max_step(settled.left));
      EXPECT(max_step(moved.left) < 1.5 * max_step(settled.left), label);
    }
  }

  // Stereo that folds to mono: a chord's side sits under its mid, and no DC.
  {
    device.init(kRate);
    device.set_param(p::kBreath, 0.6f);
    const double chord[4] = {kC3, 164.814, 195.998, 246.942};
    for (int n = 0; n < 4; ++n) device.note_on(n, static_cast<float>(chord[n]), 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    std::vector<float> mid(out.size()), side(out.size());
    for (size_t i = 0; i < out.size(); ++i) {
      mid[i] = 0.5f * (out.left[i] + out.right[i]);
      side[i] = 0.5f * (out.left[i] - out.right[i]);
    }
    const double width = db(rms(side, at(1.0)) / rms(mid, at(1.0)));
    std::snprintf(label, sizeof label, "a chord's side is 6 dB or more under its mid, and not absent (%.1f dB)", width);
    EXPECT(width <= -6.0 && width >= -30.0, label);
    EXPECT(rms(mid, at(1.0)) > 0.7 * rms(out.left, at(1.0)), "the mono sum does not cancel");
    std::snprintf(label, sizeof label, "no DC (mean %g)", mean(out.left, at(1.0)));
    EXPECT(std::fabs(mean(out.left, at(1.0))) < 1.0e-4 && std::fabs(mean(out.right, at(1.0))) < 1.0e-4, label);
  }

  // The same notes give the same audio in blocks of 128, 7 and 2048 frames.
  {
    const auto phrase = [](int block) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 0.3f, kRate, block);
      device.note_on(2, static_cast<float>(kC5), 0.6f);
      out = concat(out, render(device, 0.3f, kRate, block));
      device.note_off(1);
      device.set_param(p::kBreath, 0.9f);
      out = concat(out, render(device, 0.4f, kRate, block));
      return out;
    };
    const Stereo usual = phrase(128), small = phrase(7), large = phrase(2048);
    double worst = 0.0;
    for (size_t i = 0; i < usual.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(usual.left[i]) - small.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(usual.right[i]) - large.right[i]));
    }
    std::snprintf(label, sizeof label, "output does not depend on block size (max diff %g)", worst);
    EXPECT(worst < 1.0e-6, label);
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("flute (8 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("flute");
}
