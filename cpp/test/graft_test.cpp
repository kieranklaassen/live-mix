// Native harness for Graft (cpp/devices/graft). The conformance pass covers
// silence before and after notes, voice stealing under a pile of keys,
// parameter abuse and other sample rates; the rest measures what makes it a
// crossing of four exciters and four bodies.

#include "../devices/graft/graft.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Graft;
namespace p = livemix::graft;

static Graft device;

static const float kRate = 48000.0f;
static const char* kExciterName[4] = {"Breath", "Bow", "Mallet", "Pluck"};
static const char* kBodyName[4] = {"String", "Pipe", "Bar", "Bowl"};
enum { kBreath, kBow, kMallet, kPluck };
enum { kString, kPipe, kBar, kBowl };

// A fresh device on one crossing, with the pitch still and the sound in the
// middle unless a check asks otherwise.
static void fresh(float rate, int exciter, int body, float wander = 0.0f, float width = 0.0f) {
  device.init(rate);
  device.set_param(p::kExciter, static_cast<float>(exciter));
  device.set_param(p::kBody, static_cast<float>(body));
  device.set_param(p::kWander, wander);
  device.set_param(p::kWidth, width);
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The frequency of the component near `hz`, from how far its phase moves
// between two windows `span` apart. The gap grows a little at a time so the
// turns in between are never miscounted.
static double pitch(const std::vector<float>& x, double hz, double rate, double from, double span) {
  const size_t window = at(std::max(0.05, 8.0 / hz), rate);
  double found = hz;
  for (double step = 0.002;; step = std::min(step * 1.6, span)) {
    const size_t a = at(from, rate), b = a + at(step, rate);
    const double seconds = static_cast<double>(b - a) / rate;
    double moved = tone_phase(x, found, rate, b, b + window) - tone_phase(x, found, rate, a, a + window);
    moved -= 2.0 * kPi * std::round(moved / (2.0 * kPi));
    found += moved / (2.0 * kPi * seconds);
    if (step >= span) break;
  }
  return found;
}

// A bowl's lowest pair beats; its pitch is read over one whole beat.
static double beat_hz(double hz) { return std::min(0.7 * std::sqrt(hz / 220.0), 0.006 * hz); }

// The pitch of one held or struck note on a crossing, in cents from the key.
static double note_cents(float rate, int exciter, int body, float hz) {
  fresh(rate, exciter, body);
  const bool struck = exciter >= kMallet;
  if (struck) device.set_param(p::kDecay, 20.0f);
  device.note_on(1, hz, 0.7f);
  const double from = struck ? 0.15 : 1.2;
  const double span = body == kBowl ? 1.0 / beat_hz(hz) : (struck ? 0.4 : 0.8);
  const Stereo out = render(device, static_cast<float>(from + span + 0.3), rate);
  return cents(pitch(out.left, hz, rate, from, span), hz);
}

// Level of harmonic `n` of `hz` against the fundamental, in dB.
static double harmonic_db(const std::vector<float>& x, double hz, double n, size_t from, size_t to) {
  return db(tone_level(x, n * hz, kRate, from, to) / tone_level(x, hz, kRate, from, to));
}

// Everything in the sound but its fundamental, against the fundamental, in
// dB: the fundamental is fitted and taken out 50 ms at a time.
static double upper_db(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const size_t frame = at(0.05);
  double upper = 0.0, fundamental = 0.0;
  for (size_t start = from; start + frame <= to; start += frame) {
    double re = 0.0, im = 0.0, total = 0.0;
    for (size_t i = 0; i < frame; ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
      re += x[start + i] * std::cos(phase);
      im += x[start + i] * std::sin(phase);
      total += static_cast<double>(x[start + i]) * x[start + i];
    }
    const double fitted = 2.0 * (re * re + im * im) / static_cast<double>(frame);
    fundamental += fitted;
    upper += std::max(total - fitted, 0.0);
  }
  return 10.0 * std::log10(std::max(upper, 1.0e-30) / std::max(fundamental, 1.0e-30));
}

// How much of what an event does is there within 8 samples: the largest
// difference from the same passage without the event in its first 8 samples,
// against the largest over 20 ms. Something glided or faded has gone a small
// part of the way; a jump is there at once. The worst of eight moments a
// little apart, so a jump cannot hide in a zero crossing or a control tick.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup();
      render(device, 0.6f + 0.0013f * static_cast<float>(trial), kRate);
      if (pass == 0) event();
      out[pass] = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].left.size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

// The loudest of the two channels.
static double peak_of(const Stereo& out) { return std::max(peak(out.left), peak(out.right)); }

int main() {
  Conformance spec;
  spec.name = "graft";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // 1. Tuning. Every crossing speaks at the key: within 5 cents struck and
  // within 8 held (the brief's allowance for a body that is driven), over
  // seven octaves at 48 kHz and at the other two rates.
  {
    const float notes[] = {32.7f, 110.0f, 220.0f, 880.0f, 2637.0f, 4186.0f};
    const float rates[] = {48000.0f, 44100.0f, 96000.0f};
    double worst_held = 0.0, worst_struck = 0.0;
    for (float rate : rates) {
      for (int exciter = 0; exciter < 4; ++exciter) {
        for (int body = 0; body < 4; ++body) {
          for (float hz : notes) {
            if (rate != 48000.0f && hz != 110.0f && hz != 880.0f && hz != 4186.0f) continue;
            const double off = std::fabs(note_cents(rate, exciter, body, hz));
            double& worst = exciter >= kMallet ? worst_struck : worst_held;
            worst = std::max(worst, off);
            if (off > (exciter >= kMallet ? 5.0 : 8.0)) {
              std::printf("  out of tune: %s on %s, %.1f Hz at %.0f: %.2f cents\n", kExciterName[exciter],
                          kBodyName[body], hz, rate, off);
              EXPECT(false, "a crossing is in tune");
            }
          }
        }
      }
    }
    std::printf("tuning: worst held %.2f cents, worst struck %.2f cents (16 crossings, 3 rates)\n", worst_held,
                worst_struck);
    EXPECT(worst_held < 8.0 && worst_struck < 5.0, "all sixteen crossings are in tune");
  }

  // 2. The bodies are what they say. A stopped pipe has odd harmonics only:
  // its second lies at least 20 dB under its third, blown, bowed or struck,
  // where the string's second is the stronger of the two.
  {
    double worst_gap = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      fresh(kRate, exciter, kPipe);
      device.note_on(1, 220.0f, 0.7f);
      const Stereo out = render(device, 1.5f, kRate);
      const size_t from = at(exciter >= kMallet ? 0.1 : 0.9), to = at(exciter >= kMallet ? 0.7 : 1.5);
      const double gap = harmonic_db(out.left, 220.0, 3.0, from, to) - harmonic_db(out.left, 220.0, 2.0, from, to);
      worst_gap = std::min(worst_gap, gap);
    }
    fresh(kRate, kBreath, kString);
    device.note_on(1, 220.0f, 0.7f);
    const Stereo string = render(device, 1.5f, kRate);
    const double string_gap = harmonic_db(string.left, 220.0, 3.0, at(0.9), at(1.5)) -
                              harmonic_db(string.left, 220.0, 2.0, at(0.9), at(1.5));
    std::printf("pipe: second harmonic %.1f dB under the third at least; blown string %.1f dB\n", worst_gap,
                string_gap);
    EXPECT(worst_gap > 20.0, "a pipe's second harmonic is 20 dB under its third");
    EXPECT(string_gap < 0.0, "a string has its second harmonic");
  }

  // A bar's second mode rings at 2.756 times its first, and the string has
  // nothing there.
  {
    fresh(kRate, kMallet, kBar);
    device.set_param(p::kDecay, 20.0f);
    device.set_param(p::kBright, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    const Stereo bar = render(device, 1.0f, kRate);
    const double second = pitch(bar.left, 220.0 * 2.756, kRate, 0.1, 0.4) / pitch(bar.left, 220.0, kRate, 0.1, 0.4);
    const double there = harmonic_db(bar.left, 220.0, 2.756, at(0.1), at(0.6));
    fresh(kRate, kMallet, kString);
    device.set_param(p::kDecay, 20.0f);
    device.set_param(p::kBright, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    const Stereo string = render(device, 1.0f, kRate);
    const double absent = harmonic_db(string.left, 220.0, 2.756, at(0.1), at(0.6));
    std::printf("bar: second mode at %.4f x the first, %.1f dB against it (string: %.1f dB)\n", second, there,
                absent);
    EXPECT_NEAR(second, 2.756, 0.003, "a bar's second mode is at 2.756 times the first");
    EXPECT(there > -30.0 && absent < there - 20.0, "the 2.756 partial belongs to the bar");
  }

  // A bowl beats: the level of its fundamental swings by several dB at the
  // rate its pair is tuned apart, held or struck, and a bar's does not.
  {
    auto swing = [&](int exciter, int body, double* rate_hz) {
      fresh(kRate, exciter, body);
      device.set_param(p::kDecay, 20.0f);
      device.note_on(1, 220.0f, 0.7f);
      const Stereo out = render(device, 5.5f, kRate);
      // The fundamental's level every 20 ms from 1 s on, with the slow decay
      // of a struck note taken out by comparing each beat with the next.
      std::vector<double> level;
      for (double t = 1.0; t < 5.4; t += 0.02) level.push_back(db(tone_level(out.left, 220.0, kRate, at(t), at(t + 0.05))));
      double low = 1000.0, high = -1000.0;
      int dips = 0;
      for (size_t i = 1; i + 1 < level.size(); ++i) {
        const double detrended = level[i] - (level.back() - level.front()) * static_cast<double>(i) / level.size();
        low = std::min(low, detrended);
        high = std::max(high, detrended);
        if (level[i] < level[i - 1] && level[i] <= level[i + 1] && level[i + 1] - level[i] < 3.0 &&
            level[i] < level[std::max<size_t>(i, 12) - 12] - 2.0)
          ++dips;
      }
      *rate_hz = dips / 4.4;
      return high - low;
    };
    double held_rate, struck_rate, bar_rate;
    const double held = swing(kBreath, kBowl, &held_rate), struck = swing(kMallet, kBowl, &struck_rate);
    const double bar = swing(kBreath, kBar, &bar_rate);
    std::printf("bowl: fundamental swings %.1f dB blown (%.2f Hz), %.1f dB struck (%.2f Hz); a blown bar %.2f dB\n",
                held, held_rate, struck, struck_rate, bar);
    EXPECT(held > 6.0 && struck > 6.0, "a bowl's fundamental beats, held or struck");
    EXPECT(bar < 0.5, "a bar does not beat");
    EXPECT_NEAR(held_rate, beat_hz(220.0), 0.25, "a blown bowl beats at the rate its pair is apart");
    EXPECT_NEAR(struck_rate, beat_hz(220.0), 0.25, "a struck bowl beats at the rate its pair is apart");
  }

  // 3. The exciters are what they say. Breath and Bow hold a note (the level
  // at 4 s is within 3 dB of the level at 1.5 s) on every body; Mallet and
  // Pluck let it die (20 dB down or more).
  {
    double worst_held = 0.0, least_fall = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        fresh(kRate, exciter, body);
        device.note_on(1, 220.0f, 0.7f);
        const Stereo out = render(device, 4.8f, kRate);
        // A window of whole beats, so a bowl's swing does not count as change.
        const double change = db(rms(out.left, at(3.3), at(4.73)) / rms(out.left, at(0.8), at(2.23)));
        if (exciter < kMallet) worst_held = std::max(worst_held, std::fabs(change));
        else least_fall = std::min(least_fall, -change);
      }
    }
    std::printf("sustain: held crossings change %.2f dB at most from 1.5 s to 4 s; struck fall %.1f dB at least\n",
                worst_held, least_fall);
    EXPECT(worst_held < 3.0, "Breath and Bow sustain on every body");
    EXPECT(least_fall > 20.0, "Mallet and Pluck decay on every body");
  }

  // 4. Decay is the ring time of a struck body, on all four; a held body
  // rings on by Release once the key is up, and never longer than Decay.
  {
    double least = 1000.0, worst_fit = 0.0;
    for (int body = 0; body < 4; ++body) {
      double ring[2];
      const float decay[2] = {1.0f, 6.0f};
      for (int d = 0; d < 2; ++d) {
        fresh(kRate, kMallet, body);
        device.set_param(p::kDecay, decay[d]);
        device.note_on(1, 261.63f, 0.7f);
        const Stereo out = render(device, 8.0f, kRate);
        // The fundamental alone: a second and a half of its fall, as 60 dB.
        const double fall = db(tone_level(out.left, 261.63, kRate, at(0.2), at(0.3)) /
                               tone_level(out.left, 261.63, kRate, at(0.2 + 0.25 * decay[d]), at(0.3 + 0.25 * decay[d])));
        ring[d] = 60.0 * 0.25 * decay[d] / fall;
        // A bowl's pair beats across the two windows, so it is held to less.
        if (body != kBowl) worst_fit = std::max(worst_fit, std::fabs(ring[d] / decay[d] - 1.0));
      }
      least = std::min(least, ring[1] / ring[0]);
    }
    std::printf("decay: 6 s rings %.1f times as long as 1 s at least; ring time within %.1f%% of the knob at C4\n",
                least, 100.0 * worst_fit);
    EXPECT(least > 3.0, "Decay sets the ring time of a struck body");
    EXPECT(worst_fit < 0.15, "a struck C4 rings for the time on the knob");

    auto tail = [&](int exciter, int body, float decay, float release) {
      fresh(kRate, exciter, body);
      device.set_param(p::kDecay, decay);
      device.set_param(p::kRelease, release);
      device.note_on(1, 261.63f, 0.7f);
      render(device, 1.0f, kRate);
      device.note_off(1);
      const Stereo out = render(device, 4.0f, kRate);
      const double start = rms(out.left, 0, at(0.02));
      if (start < 1.0e-6) return 0.0;  // rung out before the key came up
      for (double t = 0.05; t < 3.9; t += 0.01)
        if (rms(out.left, at(t), at(t + 0.02)) < start * 0.01) return t;  // 40 dB down
      return 4.0;
    };
    double least_ratio = 1000.0, worst_cap = 0.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        const double fast = tail(exciter, body, 20.0f, 0.2f), slow = tail(exciter, body, 20.0f, 2.0f);
        least_ratio = std::min(least_ratio, slow / fast);
        worst_cap = std::max(worst_cap, tail(exciter, body, 0.3f, 12.0f));
      }
    }
    std::printf("release: 2 s takes %.1f times as long as 0.2 s to fall 40 dB at least; with Decay 0.3 s, %.2f s at most\n",
                least_ratio, worst_cap);
    EXPECT(least_ratio > 3.0, "Release sets how long a note rings after the key");
    EXPECT(worst_cap < 0.45, "a note never rings longer after the key than Decay");
  }

  // 5. Pressure brightens every crossing: the partials over the fundamental
  // are stronger against it with Pressure up than down.
  {
    double least = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        double share[2];
        for (int k = 0; k < 2; ++k) {
          fresh(kRate, exciter, body);
          device.set_param(p::kPressure, k == 0 ? 0.1f : 0.9f);
          device.set_param(p::kAir, 0.0f);
          device.note_on(1, 220.0f, 0.7f);
          const Stereo out = render(device, 1.5f, kRate);
          const size_t from = at(exciter >= kMallet ? 0.02 : 0.9), to = at(exciter >= kMallet ? 0.4 : 1.5);
          share[k] = upper_db(out.left, 220.0, from, to);
        }
        if (share[1] - share[0] < 3.0)
          std::printf("  %s on %s: %.1f dB\n", kExciterName[exciter], kBodyName[body], share[1] - share[0]);
        least = std::min(least, share[1] - share[0]);
      }
    }
    std::printf("pressure: the partials over the fundamental rise %.1f dB at least from 0.1 to 0.9 (16 crossings)\n", least);
    EXPECT(least > 3.0, "Pressure brightens every crossing");
  }

  // 6. Position changes the balance of the partials on every crossing: one
  // of the body's upper partials moves by 6 dB or more against the
  // fundamental between the two ends of the knob. In the middle of a bar the
  // even modes are gone.
  {
    const double upper[4][3] = {{2.0, 3.0, 4.0}, {3.0, 5.0, 7.0}, {2.756, 5.404, 8.933}, {2.71, 5.15, 8.2}};
    double least = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        double level[2][3];
        for (int k = 0; k < 2; ++k) {
          fresh(kRate, exciter, body);
          device.set_param(p::kPosition, k == 0 ? 0.1f : 0.9f);
          device.set_param(p::kBright, 1.0f);
          device.note_on(1, 220.0f, 0.7f);
          const Stereo out = render(device, 2.0f, kRate);
          const size_t from = at(exciter >= kMallet ? 0.05 : 0.9), to = at(exciter >= kMallet ? 0.5 : 2.0);
          for (int n = 0; n < 3; ++n) level[k][n] = harmonic_db(out.left, 220.0, upper[body][n], from, to);
        }
        double moved = 0.0;
        for (int n = 0; n < 3; ++n) moved = std::max(moved, std::fabs(level[1][n] - level[0][n]));
        if (moved < 6.0) std::printf("  %s on %s: %.1f dB\n", kExciterName[exciter], kBodyName[body], moved);
        least = std::min(least, moved);
      }
    }
    fresh(kRate, kMallet, kBar);
    device.set_param(p::kPosition, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    const Stereo middle = render(device, 0.6f, kRate);
    const double even = harmonic_db(middle.left, 220.0, 2.756, at(0.05), at(0.5));
    const double odd = harmonic_db(middle.left, 220.0, 5.404, at(0.05), at(0.5));
    std::printf("position: a partial moves %.1f dB at least (16 crossings); bar struck in the middle: 2.756 at %.1f dB, 5.404 at %.1f dB\n",
                least, even, odd);
    EXPECT(least > 6.0, "Position changes the balance of partials on every crossing");
    EXPECT(even < odd - 20.0, "a bar struck in the middle has no even modes");
  }

  // 7. Air puts noise between the partials of a held note (1.63 and 4.4
  // times the note, where no body has one), and a burst into a strike: what
  // it adds to the first 30 ms, against the strike without it.
  {
    double least_held = 1000.0, least_struck = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        Stereo out[2];
        for (int k = 0; k < 2; ++k) {
          fresh(kRate, exciter, body);
          device.set_param(p::kAir, k == 0 ? 0.0f : 1.0f);
          device.note_on(1, 220.0f, 0.7f);
          out[k] = render(device, 2.0f, kRate);
        }
        if (exciter < kMallet) {
          double between[2];
          for (int k = 0; k < 2; ++k)
            between[k] = db(tone_level(out[k].left, 220.0 * 1.63, kRate, at(0.9), at(2.0)) +
                            tone_level(out[k].left, 220.0 * 4.4, kRate, at(0.9), at(2.0)));
          least_held = std::min(least_held, between[1] - between[0]);
        } else {
          std::vector<float> added(at(0.03));
          for (size_t i = 0; i < added.size(); ++i) added[i] = out[1].left[i] - out[0].left[i];
          least_struck = std::min(least_struck, db(rms(added) / rms(out[0].left, 0, at(0.03))));
        }
      }
    }
    std::printf("air: between the partials, up %.1f dB at least held; a strike's burst %.1f dB against the strike at least\n",
                least_held, least_struck);
    EXPECT(least_held > 20.0, "Air adds noise between the partials of a held note");
    EXPECT(least_struck > -20.0, "Air adds a burst of noise to a strike");
  }

  // 8. A change of Exciter or Body is for the next note: one already held
  // carries on sample for sample, and the next takes the new crossing.
  {
    auto phrase = [&](int then_exciter, int then_body) {
      fresh(kRate, kBow, kString, 0.2f, 0.6f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      device.set_param(p::kExciter, static_cast<float>(then_exciter));
      device.set_param(p::kBody, static_cast<float>(then_body));
      return concat(out, render(device, 1.0f, kRate));
    };
    const Stereo stays = phrase(kBow, kString), changed = phrase(kMallet, kBowl);
    size_t differing = 0;
    for (size_t i = 0; i < stays.left.size(); ++i)
      if (stays.left[i] != changed.left[i] || stays.right[i] != changed.right[i]) ++differing;
    // The next note: a second after the change, alone.
    auto next = [&](int then_exciter, int then_body) {
      fresh(kRate, kBow, kString);
      device.note_on(1, 220.0f, 0.7f);
      render(device, 0.5f, kRate);
      device.set_param(p::kExciter, static_cast<float>(then_exciter));
      device.set_param(p::kBody, static_cast<float>(then_body));
      device.note_off(1);
      render(device, 6.0f, kRate);
      device.note_on(2, 220.0f, 0.7f);
      return render(device, 3.0f, kRate);
    };
    const Stereo bowed = next(kBow, kString), struck = next(kMallet, kBar);
    const double held = db(rms(bowed.left, at(2.5), at(3.0)) / rms(bowed.left, at(0.5), at(1.0)));
    const double fell = db(rms(struck.left, at(2.5), at(3.0)) / rms(struck.left, at(0.5), at(1.0)));
    const double mode = harmonic_db(struck.left, 220.0, 2.756, at(0.05), at(0.5));
    std::printf("choice: a held note differs in %zu samples of %zu after a change; the next note falls %.1f dB (unchanged: %.1f), 2.756 partial %.1f dB\n",
                differing, stays.left.size(), -fell, -held, mode);
    EXPECT(differing == 0, "a held note is untouched by a change of Exciter and Body");
    EXPECT(fell < -15.0 && held > -1.0 && mode > -30.0, "the next note takes the new crossing");
  }

  // 9. Velocity: a harder key is louder on every crossing, and brighter
  // where it is struck.
  {
    double least = 1000.0, most = 0.0, least_brighter = 1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        double level[2], upper[2];
        for (int k = 0; k < 2; ++k) {
          fresh(kRate, exciter, body);
          device.set_param(p::kAir, 0.0f);
          device.note_on(1, 220.0f, k == 0 ? 0.3f : 0.9f);
          const Stereo out = render(device, 2.3f, kRate);
          const size_t from = at(exciter >= kMallet ? 0.02 : 0.8), to = at(exciter >= kMallet ? 0.4 : 2.23);
          level[k] = db(rms(out.left, from, to));
          upper[k] = upper_db(out.left, 220.0, from, to);
        }
        least = std::min(least, level[1] - level[0]);
        most = std::max(most, level[1] - level[0]);
        if (exciter >= kMallet) least_brighter = std::min(least_brighter, upper[1] - upper[0]);
      }
    }
    std::printf("velocity: gain 0.9 is %.1f to %.1f dB over gain 0.3; a struck note's upper partials rise %.1f dB at least\n",
                least, most, least_brighter);
    EXPECT(least > 3.0 && most < 12.0, "velocity sets the level of every crossing");
    EXPECT(least_brighter > 1.0, "a harder strike is brighter");
  }

  // 10. Level. One note at gain 0.7 peaks between -24 and -10 dBFS at the
  // default volume on every crossing, the default at three pitches.
  {
    double low = 0.0, high = -1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        for (float hz : {110.0f, 220.0f, 440.0f}) {
          if (hz != 220.0f && (exciter != kBreath || body != kString)) continue;
          device.init(kRate);
          device.set_param(p::kExciter, static_cast<float>(exciter));
          device.set_param(p::kBody, static_cast<float>(body));
          device.note_on(1, hz, 0.7f);
          const double level = db(peak_of(render(device, 2.0f, kRate)));
          low = std::min(low, level);
          high = std::max(high, level);
        }
      }
    }
    std::printf("level: one note at gain 0.7 peaks from %.1f to %.1f dBFS over the sixteen crossings\n", low, high);
    EXPECT(low > -24.0 && high < -10.0, "one note peaks between -24 and -10 dBFS on every crossing");

    // Ten keys held at the gain the app sends, and eight at full velocity:
    // the sum stays under the knee of the clip (0.5, below which it does
    // nothing) on every crossing. Eight held keys at full may touch it.
    double default_ten = 0.0, worst_ten = 0.0, worst_struck_eight = 0.0, worst_held_eight = 0.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        for (int keys : {10, 8}) {
          device.init(kRate);
          device.set_param(p::kExciter, static_cast<float>(exciter));
          device.set_param(p::kBody, static_cast<float>(body));
          for (int n = 0; n < keys; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), keys == 10 ? 0.8f : 1.0f);
          const double sum = peak_of(render(device, 3.0f, kRate));
          if (keys == 10) {
            if (exciter == kBreath && body == kString) default_ten = sum;
            worst_ten = std::max(worst_ten, sum);
          } else {
            double& worst = exciter >= kMallet ? worst_struck_eight : worst_held_eight;
            worst = std::max(worst, sum);
          }
        }
      }
    }
    std::printf("ten keys at 0.8: peak %.3f on the default sound, %.3f on the loudest crossing; eight at full: %.3f struck, %.3f held\n",
                default_ten, worst_ten, worst_struck_eight, worst_held_eight);
    EXPECT(worst_ten < 0.5, "ten held keys stay under the clip's knee on every crossing");
    EXPECT(worst_struck_eight < 0.5, "eight keys struck at full velocity stay under the clip's knee");
    EXPECT(worst_held_eight < 0.55, "eight keys held at full velocity do no more than touch the knee");
  }

  // 11. Clicks. A knob moved across its range in one step while a note
  // sounds is glided: after 8 samples it has done a small part of what it
  // does in 20 ms. Pressure first (the one turned while playing), then the
  // others, on all sixteen crossings.
  {
    int crossings[16][2];
    for (int c = 0; c < 16; ++c) {
      crossings[c][0] = c / 4;
      crossings[c][1] = c % 4;
    }
    const int knobs[] = {p::kPressure, p::kPosition, p::kBright, p::kAir, p::kWidth, p::kVolume, p::kDecay};
    double worst_pressure = 0.0, worst_other = 0.0;
    for (const auto& crossing : crossings) {
      for (int id : knobs) {
        // Pressure and Air are the strike's on a struck note: nothing to glide.
        if (crossing[0] >= kMallet && (id == p::kPressure || id == p::kAir)) continue;
        const float low = id == p::kVolume ? -12.0f : p::kParamMin[id], high = p::kParamMax[id];
        for (int way = 0; way < 2; ++way) {
          const double sudden = suddenness(
              [&] {
                fresh(kRate, crossing[0], crossing[1], 0.2f, 0.6f);
                device.set_param(id, way == 0 ? low : high);
                device.note_on(1, 220.0f, 0.8f);
              },
              [&] { device.set_param(id, way == 0 ? high : low); });
          double& worst = id == p::kPressure ? worst_pressure : worst_other;
          worst = std::max(worst, sudden);
          if (sudden > 0.15)
            std::printf("  %s on %s, param %d %s: %.2f\n", kExciterName[crossing[0]], kBodyName[crossing[1]], id,
                        way == 0 ? "up" : "down", sudden);
        }
      }
    }
    std::printf("clicks: after 8 samples Pressure is %.3f of the way at most, the other knobs %.3f\n", worst_pressure,
                worst_other);
    EXPECT(worst_pressure < 0.15, "Pressure moved in one step is glided");
    EXPECT(worst_other < 0.15, "Position, Bright, Air, Width, Volume and Decay moved in one step are glided");

    // The key coming up at the shortest Release, and a key taking a voice
    // from another, fade rather than cut.
    double off = 0.0;
    for (const auto& crossing : crossings) {
      const double sudden = suddenness(
          [&] {
            fresh(kRate, crossing[0], crossing[1], 0.2f, 0.6f);
            device.set_param(p::kRelease, p::kParamMin[p::kRelease]);
            device.note_on(1, 220.0f, 0.8f);
          },
          [&] { device.note_off(1); });
      if (sudden > 0.15) std::printf("  note off, %s on %s: %.2f\n", kExciterName[crossing[0]], kBodyName[crossing[1]], sudden);
      off = std::max(off, sudden);
    }
    const double steal = suddenness(
        [&] {
          fresh(kRate, kBreath, kString, 0.2f, 0.6f);
          for (int n = 0; n < Graft::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
        },
        [&] { device.note_on(40, 1479.98f, 0.8f); });
    // And Pressure thrown about adds no step the note does not have already.
    fresh(kRate, kBreath, kString, 0.2f, 0.6f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.0f, kRate);
    const Stereo calm = render(device, 1.0f, kRate);
    Stereo thrown;
    for (int k = 0; k < 40; ++k) {
      device.set_param(p::kPressure, (k & 1) ? 0.0f : 1.0f);
      thrown = concat(thrown, render(device, 0.025f, kRate));
    }
    const double calm_step = std::max(max_step(calm.left), max_step(calm.right));
    const double thrown_step = std::max(max_step(thrown.left), max_step(thrown.right));
    std::printf("clicks: a note off is %.3f of the way after 8 samples, a steal %.3f; Pressure thrown end to end 40 times a second steps %.4f (%.4f at rest, at Pressure 0.5)\n",
                off, steal, thrown_step, calm_step);
    EXPECT(off < 0.15 && steal < 0.15, "a note off and a steal fade");
    EXPECT(thrown_step < 3.0 * calm_step, "Pressure thrown about adds no step beyond the brighter tone's own");
  }

  // 12. Block size. The same keys and knobs give the same samples in blocks
  // of 1, 128 and 2048 frames: through a release, a silence of every length
  // from inside the tail to long after the device has gone idle, a knob
  // moved in the silence, and the note that wakes it.
  {
    const float gaps[] = {0.02f, 0.1f, 0.2f, 0.26f, 0.3f, 0.33f, 0.36f, 0.4f, 0.45f, 0.5f, 0.6f, 0.9f, 1.6f};
    size_t differing = 0, compared = 0;
    double worst = 0.0;
    for (int crossing = 0; crossing < 3; ++crossing) {
      for (float gap : gaps) {
        Stereo out[3];
        const int blocks[3] = {1, 128, 2048};
        for (int k = 0; k < 3; ++k) {
          device.init(kRate);
          device.set_param(p::kExciter, static_cast<float>(crossing == 0 ? kBreath : (crossing == 1 ? kBow : kPluck)));
          device.set_param(p::kBody, static_cast<float>(crossing == 0 ? kString : (crossing == 1 ? kBowl : kPipe)));
          device.set_param(p::kRelease, 0.05f);
          device.set_param(p::kDecay, 0.2f);
          device.note_on(1, 196.0f, 0.8f);
          out[k] = render(device, 0.1777f, kRate, blocks[k]);
          device.note_off(1);
          out[k] = concat(out[k], render(device, 0.5f * gap, kRate, blocks[k]));
          device.set_param(p::kPressure, 0.95f);
          device.set_param(p::kPosition, 0.8f);
          device.set_param(p::kBright, 0.9f);
          device.set_param(p::kWidth, 1.0f);
          device.set_param(p::kVolume, -3.0f);
          out[k] = concat(out[k], render(device, 0.5f * gap, kRate, blocks[k]));
          device.note_on(2, 293.66f, 0.8f);
          out[k] = concat(out[k], render(device, 0.25f, kRate, blocks[k]));
        }
        for (int k = 1; k < 3; ++k) {
          for (size_t i = 0; i < out[0].left.size(); ++i) {
            const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[k].left[i]),
                                               std::fabs(static_cast<double>(out[0].right[i]) - out[k].right[i]));
            if (difference > 0.0) ++differing;
            worst = std::max(worst, difference);
            ++compared;
          }
        }
      }
    }
    std::printf("block size: %zu of %zu samples differ between blocks of 1, 128 and 2048 (largest difference %.2g)\n",
                differing, compared, worst);
    EXPECT(differing == 0, "blocks of 1, 128 and 2048 frames give the same samples through a silence and a wake");
  }

  // 13. A second init is a new instrument: the same keys give the same
  // samples, with Wander and Air up so every random source is heard.
  {
    auto phrase = [&](int exciter, int body) {
      fresh(kRate, exciter, body, 1.0f, 1.0f);
      device.set_param(p::kAir, 1.0f);
      Stereo out;
      for (int n = 0; n < 6; ++n) {
        device.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 0.5f + 0.08f * n);
        out = concat(out, render(device, 0.31f, kRate));
        if (n & 1) device.note_off(n - 1);
      }
      return out;
    };
    size_t differing = 0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        const Stereo first = phrase(exciter, body);
        // In between, a different crossing leaves every voice in another state.
        phrase(3 - exciter, 3 - body);
        const Stereo second = phrase(exciter, body);
        for (size_t i = 0; i < first.left.size(); ++i)
          if (first.left[i] != second.left[i] || first.right[i] != second.right[i]) ++differing;
      }
    }
    std::printf("second init: %zu samples differ over a six-note phrase on each crossing\n", differing);
    EXPECT(differing == 0, "a second init gives the same samples");
  }

  // 14. Swell is how long a breath or bow takes to speak. At its default a
  // note is there within 30 ms; at 3 s it rises slowly, and a key held for a
  // tenth of a second is still heard.
  {
    double quickest = 0.0, slow_rise = 1000.0, short_note = 0.0;
    for (int exciter = 0; exciter < 2; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        fresh(kRate, exciter, body);
        device.note_on(1, 220.0f, 0.7f);
        Stereo out = render(device, 0.03f, kRate);
        quickest = std::min(quickest, db(peak(out.left)));
        fresh(kRate, exciter, body);
        device.set_param(p::kSwell, 3.0f);
        device.note_on(1, 220.0f, 0.7f);
        out = render(device, 6.0f, kRate);
        slow_rise = std::min(slow_rise, db(rms(out.left, at(4.5), at(5.93)) / rms(out.left, at(0.2), at(0.5))));
        fresh(kRate, exciter, body);
        device.set_param(p::kSwell, 3.0f);
        device.note_on(1, 220.0f, 0.7f);
        out = render(device, 0.1f, kRate);
        device.note_off(1);
        out = concat(out, render(device, 1.0f, kRate));
        short_note = std::min(short_note, db(peak(out.left)));
      }
    }
    std::printf("swell: at the default a note peaks %.1f dBFS at least in its first 30 ms; at 3 s it is %.1f dB up from 0.3 s to 5 s at least, and a 100 ms key peaks %.1f dBFS at least\n",
                quickest, slow_rise, short_note);
    EXPECT(quickest > -50.0, "a held crossing sounds within 30 ms at the default Swell");
    EXPECT(slow_rise > 12.0, "a long Swell rises slowly");
    EXPECT(short_note > -60.0, "a short key under a long Swell still sounds");
  }

  // 15. Width. At 0 the two sides are the same samples; at 1 they differ on
  // every crossing, and the sides never outweigh the middle.
  {
    size_t differing = 0;
    double narrowest = 1000.0, widest = -1000.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = 0; body < 4; ++body) {
        for (int k = 0; k < 2; ++k) {
          fresh(kRate, exciter, body, 0.2f, k == 0 ? 0.0f : 1.0f);
          device.note_on(1, 220.0f, 0.7f);
          device.note_on(2, 329.63f, 0.7f);
          const Stereo out = render(device, 2.0f, kRate);
          std::vector<float> mid(out.left.size()), side(out.left.size());
          for (size_t i = 0; i < mid.size(); ++i) {
            mid[i] = 0.5f * (out.left[i] + out.right[i]);
            side[i] = 0.5f * (out.left[i] - out.right[i]);
            if (k == 0 && out.left[i] != out.right[i]) ++differing;
          }
          if (k == 1) {
            const double width = db(rms(side) / rms(mid));
            narrowest = std::min(narrowest, width);
            widest = std::max(widest, width);
          }
        }
      }
    }
    std::printf("width: at 0, %zu samples differ between the sides; at 1 the sides are %.1f to %.1f dB against the middle\n",
                differing, narrowest, widest);
    EXPECT(differing == 0, "Width at 0 is mono");
    EXPECT(narrowest > -30.0, "Width at 1 is stereo on every crossing");
    EXPECT(widest < -2.0, "the sides stay under the middle");
  }

  // 16. Wander. At 0 a held note stays put; at 1 its pitch drifts a few
  // cents, and two notes of the same key do not drift together (each voice
  // has its own seed, for the drift and for the air).
  {
    auto drift = [&](float wander, int key) {
      fresh(kRate, kBow, kString, wander, 0.0f);
      device.set_param(p::kAir, 0.0f);
      // The second voice is reached by holding a silent key on the first.
      if (key > 0) {
        device.set_param(p::kExciter, static_cast<float>(kMallet));
        device.set_param(p::kDecay, 20.0f);
        device.note_on(0, 30.0f, 0.0f);
        device.set_param(p::kExciter, static_cast<float>(kBow));
      }
      device.note_on(1, 440.0f, 0.7f);
      const Stereo out = render(device, 12.5f, kRate);
      std::vector<double> off;
      for (double t = 1.0; t < 12.0; t += 0.25) off.push_back(cents(pitch(out.left, 440.0, kRate, t, 0.25), 440.0));
      return off;
    };
    const std::vector<double> still = drift(0.0f, 0), first = drift(1.0f, 0), second = drift(1.0f, 1);
    double still_range = 0.0, range = 0.0, apart = 0.0;
    for (size_t i = 0; i < still.size(); ++i) {
      still_range = std::max(still_range, std::fabs(still[i]));
      range = std::max(range, std::fabs(first[i]));
      apart = std::max(apart, std::fabs(first[i] - second[i]));
    }
    std::printf("wander: at 0 the pitch moves %.2f cents at most, at 1 %.1f cents; two voices are up to %.1f cents apart\n",
                still_range, range, apart);
    EXPECT(still_range < 0.5, "Wander at 0 leaves the pitch still");
    EXPECT(range > 2.0 && range < 8.0, "Wander at 1 drifts a few cents");
    EXPECT(apart > 1.5, "two voices drift apart, each from its own seed");

    // The air of two voices is not the same noise either: two keys on one
    // note are not one key twice as loud.
    fresh(kRate, kBreath, kPipe);
    device.set_param(p::kAir, 1.0f);
    device.note_on(1, 220.0f, 0.5f);
    const Stereo one = render(device, 1.5f, kRate);
    fresh(kRate, kBreath, kPipe);
    device.set_param(p::kAir, 1.0f);
    device.note_on(1, 220.0f, 0.5f);
    device.note_on(2, 220.0f, 0.5f);
    const Stereo two = render(device, 1.5f, kRate);
    std::vector<float> rest(one.left.size());
    for (size_t i = 0; i < rest.size(); ++i) rest[i] = two.left[i] - 2.0f * one.left[i];
    const double unlike = db(rms(rest, at(0.5)) / rms(one.left, at(0.5)));
    std::printf("seeds: two keys on one note differ from one key doubled by %.1f dB of one key\n", unlike);
    EXPECT(unlike > -30.0, "each voice has its own noise");
  }

  // 17. A dull, short string still ends. With Bright at 0 the loop's loss
  // sits low enough that what stands still in it (0 Hz) once outlived the
  // note by a minute: after the key is let go the output is exact zeros in
  // a few seconds, on all four exciters.
  {
    double slowest = 0.0;
    for (int exciter = 0; exciter < 4; ++exciter) {
      fresh(kRate, exciter, kString);
      device.set_param(p::kBright, 0.0f);
      device.set_param(p::kDecay, 0.4f);
      device.set_param(p::kRelease, 0.4f);
      device.note_on(1, 110.0f, 0.8f);
      render(device, 1.0f, kRate);
      device.note_off(1);
      const Stereo tail = render(device, 6.0f, kRate);
      size_t last = 0;
      for (size_t i = 0; i < tail.left.size(); ++i) {
        if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i + 1;
      }
      slowest = std::max(slowest, static_cast<double>(last) / kRate);
    }
    std::printf("silence: a dull string with a 0.4 s ring is exact zeros %.2f s after the key at most\n", slowest);
    EXPECT(slowest < 3.0, "a let go string with Bright at 0 reaches exact silence");
  }

  // 18. A blown or bowed bar or bowl is still a bar or a bowl while it is
  // held: the exciter's roughness keeps the partial above the driven one
  // (2.756 for a bar, 2.71 for a bowl) ringing, more with Pressure, and not
  // at all with Air at 0, when only the exciter's own harmonics are there.
  {
    // Power in a narrow band at `hz`, in 100 ms Hann frames: what rings there need not hold its phase.
    auto band = [&](const std::vector<float>& x, double hz) {
      const size_t frame = at(0.1);
      double power = 0.0;
      for (size_t start = at(1.0); start + frame <= x.size(); start += frame / 2) {
        double re = 0.0, im = 0.0;
        for (size_t i = 0; i < frame; ++i) {
          const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(frame));
          const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
          re += window * x[start + i] * std::cos(phase);
          im += window * x[start + i] * std::sin(phase);
        }
        power += re * re + im * im;
      }
      return power;
    };
    auto partial = [&](int exciter, int body, float pressure, float air) {
      fresh(kRate, exciter, body);
      device.set_param(p::kPressure, pressure);
      device.set_param(p::kAir, air);
      device.note_on(1, 220.0f, 0.7f);
      const Stereo out = render(device, 5.0f, kRate);
      const double ratio = body == kBar ? 2.7561 : 2.71;
      return 10.0 * std::log10(std::max(band(out.left, ratio * 220.0), 1.0e-30) / band(out.left, 220.0));
    };
    double least = 1000.0, least_rise = 1000.0, most_dry = -1000.0;
    for (int exciter = kBreath; exciter <= kBow; ++exciter) {
      for (int body = kBar; body <= kBowl; ++body) {
        const double usual = partial(exciter, body, 0.5f, 0.25f);
        least = std::min(least, usual);
        least_rise = std::min(least_rise, partial(exciter, body, 0.9f, 0.25f) - partial(exciter, body, 0.2f, 0.25f));
        most_dry = std::max(most_dry, partial(exciter, body, 0.5f, 0.0f));
      }
    }
    std::printf("held bar and bowl: the second partial is %.1f dB against the first at least, up %.1f dB from Pressure 0.2 "
                "to 0.9 at least, %.1f dB at most with Air at 0\n",
                least, least_rise, most_dry);
    EXPECT(least > -32.0, "a held bar or bowl keeps its own second partial");
    EXPECT(least_rise > 3.0, "Pressure brings out a held bar's or bowl's partials");
    EXPECT(most_dry < least - 15.0, "with Air at 0 only the exciter's harmonics are left");
  }

  // 19. A chord does not pile up, and one key still doubles. Neighbouring
  // keys swing opposite ways (check 10 holds eight struck keys under the
  // knee by it); two notes on one key swing the same way and add. Strings
  // and pipes sit in two ranks, a key apart on opposite sides, and one note
  // is never far to one side.
  {
    auto struck = [&](int body, float second_hz) {
      fresh(kRate, kMallet, body);
      device.set_param(p::kAir, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      if (second_hz > 0.0f) device.note_on(2, second_hz, 0.7f);
      return render(device, 0.5f, kRate);
    };
    double worst_double = -1000.0, least_cancel = 1000.0;
    for (int body = 0; body < 4; ++body) {
      const Stereo one = struck(body, 0.0f), two = struck(body, 220.0f), next = struck(body, 233.082f);
      std::vector<float> rest(one.left.size());
      for (size_t i = 0; i < rest.size(); ++i) rest[i] = two.left[i] - 2.0f * one.left[i];
      worst_double = std::max(worst_double, db(rms(rest) / rms(one.left)));
      // The first push of the neighbouring key goes the other way: the two together start smaller than one.
      least_cancel = std::min(least_cancel, db(peak(one.left, 0, at(0.0005)) / std::max(peak(next.left, 0, at(0.0005)), 1.0e-9)));
    }
    double least_side = 1000.0, most_side = 0.0;
    bool opposite = true;
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int body = kString; body <= kPipe; ++body) {
        double side[2];
        for (int key = 0; key < 2; ++key) {
          fresh(kRate, exciter, body, 0.0f, 0.6f);
          device.note_on(1, key == 0 ? 220.0f : 233.082f, 0.7f);
          const Stereo out = render(device, 1.5f, kRate);
          side[key] = db(rms(out.left, at(0.5)) / rms(out.right, at(0.5)));
          least_side = std::min(least_side, std::fabs(side[key]));
          most_side = std::max(most_side, std::fabs(side[key]));
        }
        opposite = opposite && side[0] * side[1] < 0.0;
      }
    }
    std::printf("chord: two notes on one key differ from one doubled by %.1f dB; a neighbouring key takes %.1f dB off the "
                "first push at least; a string or pipe note sits %.1f to %.1f dB to its side\n",
                worst_double, least_cancel, least_side, most_side);
    EXPECT(worst_double < -40.0, "two notes on one key add up");
    EXPECT(least_cancel > 3.0, "neighbouring keys swing opposite ways");
    EXPECT(opposite, "neighbouring string and pipe keys sit on opposite sides");
    EXPECT(least_side > 0.5 && most_side < 6.0, "one note leans to its side and no further than 6 dB");
  }

  // 20. A held note is alive as it comes: at the default Wander its level
  // and its tone move a little over ten seconds, and at 0 they do not. And
  // a hard mallet on a high key is never softer for a harder key (a pulse
  // of two or three samples once jumped 3 dB with its length).
  {
    auto life = [&](int exciter, float wander, double* tone) {
      fresh(kRate, exciter, kString, wander, 0.0f);
      device.set_param(p::kAir, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      const Stereo out = render(device, 12.0f, kRate);
      double low = 1000.0, high = -1000.0, dull = 1000.0, bright = -1000.0;
      for (double t = 2.0; t + 0.5 <= 12.0; t += 0.5) {
        const double level = db(rms(out.left, at(t), at(t + 0.5)));
        const double upper = upper_db(out.left, 220.0, at(t), at(t + 0.5));
        low = std::min(low, level), high = std::max(high, level);
        dull = std::min(dull, upper), bright = std::max(bright, upper);
      }
      *tone = bright - dull;
      return high - low;
    };
    double least_level = 1000.0, most_level = 0.0, least_tone = 1000.0, most_still = 0.0;
    for (int exciter = kBreath; exciter <= kBow; ++exciter) {
      double tone = 0.0, still_tone = 0.0;
      const double level = life(exciter, p::kParamDefault[p::kWander], &tone);
      least_level = std::min(least_level, level), most_level = std::max(most_level, level);
      least_tone = std::min(least_tone, tone);
      most_still = std::max(most_still, std::max(life(exciter, 0.0f, &still_tone), still_tone));
    }
    std::printf("life: at the default Wander a held string moves %.2f to %.2f dB in level and %.2f dB in tone at least; "
                "at 0, %.3f dB at most\n",
                least_level, most_level, least_tone, most_still);
    EXPECT(least_level > 0.3 && most_level < 4.0, "a held note at the defaults moves a little in level");
    EXPECT(least_tone > 0.5, "a held note at the defaults moves in tone");
    EXPECT(most_still < 0.1, "Wander at 0 leaves level and tone still");

    double worst_back = 0.0;
    for (int body = 0; body < 4; ++body) {
      double last = -1000.0;
      for (int step = 5; step <= 10; ++step) {
        fresh(kRate, kMallet, body);
        device.set_param(p::kPressure, 1.0f);
        device.note_on(1, 1760.0f, 0.1f * static_cast<float>(step));
        const double level = db(rms(render(device, 1.0f, kRate).left));
        worst_back = std::max(worst_back, last - level);
        last = level;
      }
    }
    std::printf("velocity: a hard mallet at 1760 Hz falls %.2f dB at most as the key gets harder\n", worst_back);
    EXPECT(worst_back < 0.2, "a harder key is never a softer high note");
  }

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("graft (8 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("graft");
}
