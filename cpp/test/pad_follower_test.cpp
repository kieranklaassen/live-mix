// Native harness for Pad Follower (cpp/devices/pad-follower). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a pad that follows.

#include "../devices/pad-follower/pad_follower.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::PadFollower;
namespace p = livemix::pad_follower;

static PadFollower device;

static const float kRate = 48000.0f;

// Measured numbers, printed with PAD_FOLLOWER_VERBOSE=1 (quiet otherwise).
static bool verbose() {
  static const bool on = std::getenv("PAD_FOLLOWER_VERBOSE") != nullptr;
  return on;
}
#define NOTE(...)                            \
  do {                                       \
    if (verbose()) std::printf(__VA_ARGS__); \
  } while (0)

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The pad alone, with nothing that moves: no ensemble, no drift, no octave,
// no tone shaping, summed to the centre.
static void plain(PadFollower& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kBrightness, 12000.0f);
  d.set_param(p::kLowCut, 40.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kRise, 0.6f);
  d.set_param(p::kFall, 3.0f);
}

// A sine that stops: `on` seconds of tone, silence up to `total`.
static std::vector<float> burst(float hz, float on, float total, float rate, float gain) {
  std::vector<float> x = sine(hz, on, rate, gain);
  x.resize(static_cast<size_t>(total * rate), 0.0f);
  return x;
}

static std::vector<float> chord(const std::vector<double>& notes, float seconds, float gain,
                                float rate = kRate) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t i = 0; i < x.size(); ++i) {
    double v = 0.0;
    for (double hz : notes) v += std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate);
    x[i] = gain * static_cast<float>(v);
  }
  return x;
}

// Time after `from` at which the 20 ms RMS first reaches `share` of `level`.
static double time_to_reach(const std::vector<float>& x, double from, double until, double level,
                            double share) {
  for (double t = from; t < until; t += 0.005) {
    if (rms(x, at(t), at(t + 0.02)) >= share * level) return t + 0.01 - from;
  }
  return -1.0;
}

// Material that resembles playing: plucked notes with decaying, slightly
// stretched harmonics and a click of noise at the start.
static void pluck(std::vector<float>& x, double hz, double start, double gain, float rate = kRate) {
  const size_t first = static_cast<size_t>(start * rate);
  for (int h = 1; h <= 10; ++h) {
    const double partial = hz * h * std::sqrt(1.0 + 0.0003 * h * h);
    if (partial > 0.4 * rate) break;
    const double amp = gain / std::pow(h, 1.25);
    const double tau = 2.2 * std::sqrt(220.0 / hz) / (1.0 + 0.4 * (h - 1));
    for (size_t i = first; i < x.size(); ++i) {
      const double t = static_cast<double>(i - first) / rate;
      x[i] += static_cast<float>(amp * std::exp(-t / tau) * (1.0 - std::exp(-t / 0.0015)) *
                                 std::sin(2.0 * kPi * partial * t + 0.37 * h));
    }
  }
  const size_t click = static_cast<size_t>(0.005 * rate);
  for (size_t i = first; i < first + click && i < x.size(); ++i) {
    x[i] += static_cast<float>(gain * 0.4) * white() * (1.0f - static_cast<float>(i - first) / click);
  }
}

// An arpeggio, then a chord left to ring: `seconds` long, peaks near -5 dBFS.
static std::vector<float> played(float seconds, float rate = kRate) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  rng_state() = 0xF00Du;
  const double arpeggio[5] = {110.0, 164.81, 220.0, 261.63, 329.63};
  for (int k = 0; k < 5; ++k) pluck(x, arpeggio[k], 0.1 + 0.3 * k, 0.16, rate);
  const double held[5] = {130.81, 164.81, 196.0, 261.63, 329.63};
  for (int k = 0; k < 5; ++k) pluck(x, held[k], 2.0 + 0.012 * k, 0.13, rate);
  return x;
}

int main() {
  Conformance spec;
  spec.name = "pad-follower";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  // The dry signal at full scale plus a pad held under one by its safety
  // stage: under 1.42 at any Mix (asserted below with pure notes and a square).
  spec.max_peak = 1.5f;
  check_effect(device, spec, kRate);

  // The pad plays the pitch that was played, at about its level, and keeps
  // that pitch while it hangs on after the tone has stopped.
  {
    plain(device);
    std::vector<float> x = burst(220.0f, 3.0f, 5.0f, kRate, 0.1f);
    Stereo out = run(device, x);
    const double held = dominant_frequency(out.left, kRate, 200.0, 240.0, at(1.5), at(2.9));
    const double hanging = dominant_frequency(out.left, kRate, 200.0, 240.0, at(3.2), at(4.2));
    const double level = db(tone_level(out.left, 220.0, kRate, at(2.0), at(2.9)) / 0.1);
    NOTE("220 Hz tone: pad %+.3f ct while held, %+.3f ct while hanging on, level %+.2f dB re input\n",
         cents(held, 220.0), cents(hanging, 220.0), level);
    EXPECT(std::fabs(cents(held, 220.0)) < 2.0, "the pad of a 220 Hz tone is at 220 Hz");
    EXPECT(std::fabs(cents(hanging, 220.0)) < 2.0, "the pad keeps its pitch after the tone stops");
    EXPECT(std::fabs(level) < 2.0, "the pad of a steady tone is at the tone's level");
  }

  // Octaves adds the same pitch an octave up or down, the unshifted pad stays.
  {
    for (float octaves : {1.0f, -1.0f}) {
      plain(device);
      device.set_param(p::kOctaves, octaves);
      Stereo out = run(device, sine(220.0f, 2.5f, kRate, 0.1f));
      const double target = octaves > 0.0f ? 440.0 : 110.0;
      const double other = octaves > 0.0f ? 110.0 : 440.0;
      const double found =
          dominant_frequency(out.left, kRate, target * 0.9, target * 1.1, at(1.5), at(2.4));
      const double added = db(tone_level(out.left, target, kRate, at(1.5), at(2.4)) / 0.1);
      const double base = db(tone_level(out.left, 220.0, kRate, at(1.5), at(2.4)) / 0.1);
      const double absent = db(tone_level(out.left, other, kRate, at(1.5), at(2.4)) / 0.1);
      NOTE("Octaves %+.0f: %.0f Hz at %+.3f ct, %.1f dB; 220 Hz %.1f dB; %.0f Hz %.1f dB\n", octaves,
           target, cents(found, target), added, base, other, absent);
      EXPECT(std::fabs(cents(found, target)) < 2.0, "the added octave is in tune");
      EXPECT(added > -8.0 && added < 0.0, "the added octave is nearly as loud as the pad");
      EXPECT(base > -6.0, "the unshifted pad stays under the added octave");
      EXPECT(absent < -50.0, "only the chosen octave is added");
    }
  }

  // Rise is the time to 90 % of the swell; Fall the time to fall 60 dB.
  {
    for (float rise : {0.6f, 3.0f}) {
      plain(device);
      device.set_param(p::kRise, rise);
      Stereo out = run(device, sine(330.0f, rise * 3.0f + 1.0f, kRate, 0.1f));
      const double steady = rms(out.left, at(rise * 3.0), at(rise * 3.0 + 0.9));
      const double t90 = time_to_reach(out.left, 0.0, rise * 3.0, steady, 0.9);
      NOTE("Rise %.1f s: 90 %% after %.2f s\n", rise, t90);
      EXPECT(t90 > 0.75 * rise && t90 < 1.25 * rise, "the pad swells to 90 % in about Rise");
    }
    for (float fall : {1.0f, 4.0f, 12.0f}) {
      plain(device);
      device.set_param(p::kFall, fall);
      Stereo out = run(device, burst(330.0f, 1.5f, 1.7f + fall, kRate, 0.1f));
      const double measured = rt60(out.left, kRate, 1.6, 0.05, -100.0);
      NOTE("Fall %.0f s: falls 60 dB in %.2f s\n", fall, measured);
      EXPECT(measured > 0.85 * fall && measured < 1.15 * fall, "the pad falls 60 dB in about Fall");
    }
  }

  // A three-note chord gives three pad notes and nothing else of note: the
  // strongest component that is not one of them (or, with Octaves up, one of
  // their octaves) is far below. A scan in 1.5 Hz steps finds it.
  {
    const std::vector<double> notes = {220.0, 277.18, 329.63};
    std::vector<float> x = chord(notes, 4.0f, 0.1f);
    for (float octaves : {0.0f, 0.3f}) {
      plain(device);
      device.set_param(p::kOctaves, octaves);
      Stereo out = run(device, x);
      const size_t from = at(2.0), to = at(4.0);
      double weakest = 1.0, strongest = 0.0;
      for (double hz : notes) {
        const double level = tone_level(out.left, hz, kRate, from, to);
        weakest = std::min(weakest, level);
        strongest = std::max(strongest, level);
      }
      double stray = 0.0, stray_hz = 0.0;
      for (double hz = 40.0; hz < 4000.0; hz += 1.5) {
        bool wanted = false;
        for (double note : notes) {
          for (double k : {1.0, 2.0}) {
            if (std::fabs(hz - k * note) < 8.0) wanted = true;
          }
        }
        if (wanted) continue;
        const double level = tone_level(out.left, hz, kRate, from, to);
        if (level > stray) {
          stray = level;
          stray_hz = hz;
        }
      }
      NOTE("chord, Octaves %.1f: notes %.1f to %.1f dB re input, strongest stray %.1f dB re weakest "
           "note at %.0f Hz\n",
           octaves, db(weakest / 0.1), db(strongest / 0.1), db(stray / weakest), stray_hz);
      EXPECT(db(weakest / 0.1) > -3.0 && db(strongest / 0.1) < 3.0,
             "each note of a chord becomes a pad note at about its level");
      EXPECT(db(stray / weakest) < -24.0, "intermodulation is at least 24 dB below the pad notes");
    }
  }

  // The attack is gone. A note that starts with a click and dies away fast
  // comes back as a slow swell: nothing bright in the first 30 ms, and a far
  // lower crest factor than the note had.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> x(at(2.0), 0.0f);
    rng_state() = 0xACE1u;
    for (size_t i = 0; i < x.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      double v = 0.0;
      for (int h = 1; h <= 6; ++h) v += std::sin(2.0 * kPi * 196.0 * h * t) / h;
      x[i] = static_cast<float>(0.3 * v * std::exp(-t / 0.12));
      if (i < at(0.004)) x[i] += 0.4f * white() * (1.0f - static_cast<float>(i) / at(0.004));
    }
    Stereo out = run(device, x);
    const auto bright = [](const std::vector<float>& s, size_t from, size_t to) {
      return std::sqrt(energy_above(s, 5000.0, kRate, from, to)) * rms(s, from, to);
    };
    const double dry_attack = bright(x, 0, at(0.03));
    const double pad_attack = std::max(bright(out.left, 0, at(0.03)), 1.0e-12);
    const double dry_crest = peak(x) / rms(x, 0, at(1.0));
    const double pad_crest = peak(out.left) / rms(out.left, 0, at(1.0));
    NOTE("pluck: above 5 kHz in the first 30 ms %.1f dB re the dry attack; crest factor %.1f dB "
         "(dry %.1f dB); pad peak %.1f dB re dry peak\n",
         db(pad_attack / dry_attack), db(pad_crest), db(dry_crest), db(peak(out.left) / peak(x)));
    EXPECT(db(pad_attack / dry_attack) < -20.0, "the pad has none of the attack's brightness");
    EXPECT(db(pad_crest) < db(dry_crest) - 6.0, "the pad's crest factor is far below the note's");
    EXPECT(rms(out.left, at(0.3), at(0.6)) > rms(x, at(0.3), at(0.6)) * 0.5,
           "the pad carries on where the note has died away");
  }

  // Following: when the chord changes the old notes fall and the new ones
  // rise. One note of each chord is tracked through the change.
  {
    plain(device);
    device.set_param(p::kFall, 2.0f);
    std::vector<float> first = chord({196.0, 246.94, 293.66}, 2.5f, 0.1f);
    std::vector<float> second = chord({174.61, 220.0, 261.63}, 2.5f, 0.1f);
    first.insert(first.end(), second.begin(), second.end());
    Stereo out = run(device, first);
    const double old_before = tone_level(out.left, 246.94, kRate, at(2.0), at(2.5));
    const double old_after = tone_level(out.left, 246.94, kRate, at(4.0), at(4.5));
    const double new_before = tone_level(out.left, 220.0, kRate, at(2.0), at(2.5));
    const double new_early = tone_level(out.left, 220.0, kRate, at(2.6), at(2.9));
    const double new_after = tone_level(out.left, 220.0, kRate, at(4.0), at(4.5));
    NOTE("chord change: old note %.1f -> %.1f dB, new note %.1f -> %.1f -> %.1f dB (re input)\n",
         db(old_before / 0.1), db(old_after / 0.1), db(new_before / 0.1), db(new_early / 0.1),
         db(new_after / 0.1));
    EXPECT(db(old_before / 0.1) > -3.0 && db(old_after / old_before) < -30.0,
           "the old chord's note falls after the change");
    EXPECT(db(new_before / 0.1) < -40.0 && db(new_after / 0.1) > -3.0,
           "the new chord's note rises after the change");
    EXPECT(new_early < new_after * 0.8, "the new note swells in, it does not jump");
  }

  // Sensitivity: quiet noise does not become pad.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo tone = run(device, sine(330.0f, 3.0f, kRate, 0.1f));
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0x5EEDu;
    Stereo hiss = run(device, noise(3.0f, kRate, 0.00548f));  // -50 dBFS RMS
    const double from_tone = rms(tone.left, at(2.0), at(3.0));
    const double from_hiss = rms(hiss.left, at(2.0), at(3.0));
    NOTE("pad of a -20 dBFS tone %.1f dBFS; pad of -50 dBFS noise %.1f dBFS\n", db(from_tone),
         db(from_hiss));
    EXPECT(db(from_hiss / from_tone) < -30.0, "quiet noise makes at least 30 dB less pad than a tone");
    // And the control works: at the bottom a soft note is ignored, at the top it is followed.
    double soft[2];
    int which = 0;
    for (float sensitivity : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSensitivity, sensitivity);
      Stereo out = run(device, sine(330.0f, 3.0f, kRate, 0.003f));  // -50 dBFS peak
      soft[which++] = rms(out.left, at(2.0), at(3.0));
    }
    NOTE("a -50 dBFS tone: pad %.1f dBFS at Sensitivity 0, %.1f dBFS at 1\n", db(soft[0]), db(soft[1]));
    EXPECT(db(soft[1]) > -56.0 && db(soft[0]) < db(soft[1]) - 20.0,
           "Sensitivity decides whether a soft note becomes pad");
  }

  // The ensemble: on a mono input the pad is wide but not out of phase, and
  // Width 0 puts all of it in the centre. A steady tone comes back with its
  // energy spread into sidebands by the moving taps.
  {
    std::vector<float> x = played(6.0f);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo wide = run(device, x);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    Stereo narrow = run(device, x);
    const double spread = correlation(wide.left, wide.right, at(1.0), at(6.0));
    const double centred = correlation(narrow.left, narrow.right, at(1.0), at(6.0));
    std::vector<float> mono(wide.size());
    for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (wide.left[i] + wide.right[i]);
    const double folded = db(rms(mono, at(1.0), at(6.0)) /
                             (0.5 * (rms(wide.left, at(1.0), at(6.0)) + rms(wide.right, at(1.0), at(6.0)))));
    NOTE("pad of a mono phrase: L/R correlation %.2f (%.4f at Width 0); mono sum %.1f dB re a side\n",
         spread, centred, folded);
    EXPECT(spread > -0.2 && spread < 0.6, "the pad is decorrelated between left and right");
    EXPECT(centred > 0.9999, "Width 0 is mono");
    EXPECT(folded > -4.5, "the pad survives a mono sum");
    const double dc = std::max(std::fabs(mean(wide.left, at(1.0), at(6.0))),
                               std::fabs(mean(wide.right, at(1.0), at(6.0))));
    NOTE("pad DC %.7f\n", dc);
    EXPECT(dc < 1.0e-4, "the pad carries no DC");

    plain(device);
    Stereo still = run(device, sine(440.0f, 6.0f, kRate, 0.1f));
    plain(device);
    device.set_param(p::kEnsemble, 1.0f);
    Stereo moving = run(device, sine(440.0f, 6.0f, kRate, 0.1f));
    const double carrier_still = tone_level(still.left, 440.0, kRate, at(2.0), at(6.0));
    const double carrier_moving = tone_level(moving.left, 440.0, kRate, at(2.0), at(6.0));
    const double total_moving = rms(moving.left, at(2.0), at(6.0)) * std::sqrt(2.0);
    const double sidebands = std::sqrt(std::max(0.0, total_moving * total_moving - carrier_moving * carrier_moving));
    NOTE("ensemble on a 440 Hz pad: carrier %.1f dB, sidebands %.1f dB (re the still pad)\n",
         db(carrier_moving / carrier_still), db(sidebands / carrier_still));
    EXPECT(sidebands > 0.3 * carrier_still, "the ensemble moves energy into sidebands");
    EXPECT(db(total_moving / carrier_still) > -4.0 && db(total_moving / carrier_still) < 3.0,
           "the ensemble keeps the pad's level");
  }

  // Mix 0 is the input, bit for bit; the dry signal is never delayed.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> x = played(2.0f);
    std::vector<float> other = sine(311.0f, 2.0f, kRate, 0.2f);
    Stereo out = run(device, x, other);
    EXPECT(out.left == x && out.right == other, "Mix 0 passes the input through bit-exact");
  }

  // The default patch on a played phrase: about the dry level, and left and
  // right in phase.
  {
    std::vector<float> x = played(6.0f);
    device.init(kRate);
    Stereo out = run(device, x);
    const double level = db(rms(out.left, at(2.0), at(6.0)) / rms(x, at(2.0), at(6.0)));
    const double wet_peak = db(std::max(peak(out.left), peak(out.right)) / peak(x));
    const double together = correlation(out.left, out.right, at(1.0), at(6.0));
    NOTE("default patch on a phrase: %+.1f dB re dry, peak %+.1f dB re dry peak, L/R correlation %.2f\n",
         level, wet_peak, together);
    EXPECT(std::fabs(level) < 3.0, "the default patch is within 3 dB of the dry level");
    EXPECT(wet_peak < 3.0, "the default patch peaks within 3 dB of the input");
    EXPECT(together > 0.3, "the default patch keeps left and right in phase");
  }

  // The worst input for level is one full-scale note: the ensemble's taps, a
  // register's drift, its seat and the octave can all line up on it, and the
  // partials of a square add up differently in the pad than in the input. The
  // pad's safety stage keeps the output under +3 dBFS all the same: twenty
  // seconds each of a low note, a high note and a square, on the default
  // patch and with everything that adds level at its maximum, at the Mix
  // where dry and pad add up furthest and with the pad alone.
  {
    double usual = 0.0, loudest = 0.0, alone = 0.0;
    for (int kind = 0; kind < 3; ++kind) {
      std::vector<float> x = sine(kind == 1 ? 1000.0f : 220.0f, 20.0f, kRate, 1.0f);
      if (kind == 2) {
        for (float& v : x) v = v < 0.0f ? -1.0f : 1.0f;
      }
      device.init(kRate);
      Stereo out = run(device, x);
      usual = std::max(usual, static_cast<double>(std::max(peak(out.left), peak(out.right))));
      for (float mix : {0.5f, 1.0f}) {
        device.init(kRate);
        device.set_param(p::kMix, mix);
        device.set_param(p::kOctaves, kind == 2 ? -1.0f : 1.0f);
        device.set_param(p::kEnsemble, 1.0f);
        device.set_param(p::kMovement, 1.0f);
        device.set_param(p::kSensitivity, 1.0f);
        device.set_param(p::kBrightness, 12000.0f);
        device.set_param(p::kLowCut, 40.0f);
        Stereo all = run(device, x);
        double& worst = mix < 1.0f ? loudest : alone;
        worst = std::max(worst, static_cast<double>(std::max(peak(all.left), peak(all.right))));
      }
    }
    NOTE("full-scale note: peak %+.2f dBFS on the default patch, %+.2f dBFS with everything at maximum "
         "and Mix at half, %+.2f dBFS with the pad alone\n",
         db(usual), db(loudest), db(alone));
    EXPECT(usual < 1.42, "a full-scale note peaks under +3 dBFS on the default patch");
    EXPECT(loudest < 1.42, "a full-scale note peaks under +3 dBFS at the loudest settings");
    EXPECT(alone < 1.0, "the pad alone never reaches full scale");
  }

  // That safety stage does nothing to playing at an ordinary level. The pad
  // of a phrase that peaks at -3 dBFS stays under the level where the stage
  // begins (-4.4 dBFS), and below that level the pad is linear: a held note
  // at twice the level gives twice the settled pad, sample for sample.
  {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> x = played(6.0f);
    Stereo phrase = run(device, x);
    const double pad_peak = std::max(peak(phrase.left), peak(phrase.right));
    Stereo out[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kSensitivity, 1.0f);  // the gate, which is not linear, far below both
      out[which] = run(device, sine(330.0f, 5.0f, kRate, which == 0 ? 0.3f : 0.15f));
    }
    double apart = 0.0;
    for (size_t i = at(4.0); i < out[0].size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(out[0].left[i]) - 2.0 * out[1].left[i]));
      apart = std::max(apart, std::fabs(static_cast<double>(out[0].right[i]) - 2.0 * out[1].right[i]));
    }
    const double note_peak = std::max(peak(out[0].left, at(4.0)), peak(out[0].right, at(4.0)));
    NOTE("phrase at %.1f dBFS peak: pad peak %.1f dBFS; held note: pad peak %.1f dBFS, %.1f dB from "
         "twice the pad of the note at half level\n",
         db(peak(x)), db(pad_peak), db(note_peak), db(apart / note_peak));
    EXPECT(pad_peak < 0.6, "the pad of a phrase stays under the safety stage");
    EXPECT(note_peak < 0.6 && db(apart / note_peak) < -80.0, "the pad is linear below the safety stage");
  }

  // Moving Octaves, Rise or Fall while a chord sounds neither clicks nor
  // zippers: swept across its whole range in a second, block by block, the
  // largest sample-to-sample step stays what a steady pad has.
  {
    std::vector<float> x = chord({196.0, 246.94, 293.66}, 3.0f, 0.1f);
    const auto sweep = [&](int id, float from, float to) {
      plain(device);
      device.set_param(id, from);
      Stereo out;
      const size_t blocks = x.size() / kBlock;
      for (size_t b = 0; b < blocks; ++b) {
        const double t = static_cast<double>(b * kBlock) / kRate;
        if (t >= 1.5 && t <= 2.5) {
          const float position = static_cast<float>(t - 1.5);
          device.set_param(id, p::kParamMin[id] > 0.0f ? from * std::pow(to / from, position)
                                                       : from + (to - from) * position);
        }
        std::vector<float> block(x.begin() + b * kBlock, x.begin() + (b + 1) * kBlock);
        out = concat(out, run(device, block));
      }
      return max_step(out.left, at(1.5), at(2.9));
    };
    plain(device);
    device.set_param(p::kOctaves, 1.0f);
    Stereo steady = run(device, x);
    const double natural = max_step(steady.left, at(1.5), at(2.9));
    const double octaves = sweep(p::kOctaves, -1.0f, 1.0f);
    const double rise = sweep(p::kRise, 0.02f, 6.0f);
    const double fall = sweep(p::kFall, 20.0f, 0.1f);
    NOTE("largest step: steady %.4f, sweeping Octaves %.4f, Rise %.4f, Fall %.4f\n", natural, octaves,
         rise, fall);
    EXPECT(octaves < natural * 1.3 + 0.001, "sweeping Octaves does not click");
    EXPECT(rise < natural * 1.3 + 0.001, "sweeping Rise does not click");
    EXPECT(fall < natural * 1.3 + 0.001, "sweeping Fall does not click");
    // A jump of Octaves from one end to the other is a glide too.
    plain(device);
    device.set_param(p::kOctaves, -1.0f);
    run(device, x);
    device.set_param(p::kOctaves, 1.0f);
    Stereo jumped = run(device, x);
    NOTE("largest step after Octaves jumps -1 to +1: %.4f\n", max_step(jumped.left, 0, at(0.5)));
    EXPECT(max_step(jumped.left, 0, at(0.5)) < natural * 1.3 + 0.001, "a jump of Octaves glides");
  }

  // Noise is not a note: a band's reading of it is wild and its average
  // wanders, which no partial's does. Loud hiss and a breathy band of noise
  // make next to no pad, while a soft held note still gets all of its own
  // at the default Sensitivity.
  {
    const auto both = [](const Stereo& s, size_t from, size_t to) {
      const double l = rms(s.left, from, to), r = rms(s.right, from, to);
      return std::sqrt(0.5 * (l * l + r * r));
    };
    rng_state() = 0xB0A7u;
    std::vector<float> hiss = noise(6.0f, kRate, 0.1732f);  // -20 dBFS RMS
    std::vector<float> breath(hiss.size());
    float low = 0.0f, band = 0.0f;
    for (size_t i = 0; i < hiss.size(); ++i) {  // roughly 500 Hz to 4 kHz
      low += 0.0634f * (hiss[i] - low);
      band += 0.408f * (hiss[i] - low - band);
      breath[i] = 1.5f * band;
    }
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    const double from_hiss = db(both(run(device, hiss), at(2.0), at(6.0)) / rms(hiss));
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    const double from_breath = db(both(run(device, breath), at(2.0), at(6.0)) / rms(breath));
    plain(device);
    Stereo soft = run(device, sine(330.0f, 4.0f, kRate, 0.01f));  // -40 dBFS
    const double from_soft = db(tone_level(soft.left, 330.0, kRate, at(2.0), at(4.0)) / 0.01);
    NOTE("pad of -20 dBFS white noise %.1f dB re the noise, of breath noise %.1f dB; pad of a -40 dBFS "
         "note %+.1f dB re the note\n",
         from_hiss, from_breath, from_soft);
    EXPECT(from_hiss < -25.0, "loud white noise makes a pad at least 25 dB below itself");
    EXPECT(from_breath < -25.0, "breath noise makes a pad at least 25 dB below itself");
    EXPECT(std::fabs(from_soft) < 3.0, "a soft held note is still followed at the default Sensitivity");
  }

  // A held pure note is the hardest thing for an ensemble: copies of one
  // partial that are equally loud cancel as they drift, and the pad comes and
  // goes by 15 dB several times a second. With one main tap per side it
  // breathes instead. The pad alone, twenty seconds, in 100 ms windows.
  {
    for (float hz : {220.0f, 1000.0f}) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, sine(hz, 22.0f, kRate, 0.25f));
      double sum = 0.0, squares = 0.0, power = 0.0, lowest = 1.0e9, highest = -1.0e9;
      int count = 0;
      for (double t = 2.0; t < 21.95; t += 0.1, ++count) {
        const double l = rms(out.left, at(t), at(t + 0.1)), r = rms(out.right, at(t), at(t + 0.1));
        const double level = 10.0 * std::log10(0.5 * (l * l + r * r) / (0.25 * 0.25 * 0.5));
        sum += level;
        squares += level * level;
        power += 0.5 * (l * l + r * r);
        lowest = std::min(lowest, level);
        highest = std::max(highest, level);
      }
      const double average = 10.0 * std::log10(power / count / (0.25 * 0.25 * 0.5));
      const double spread = std::sqrt(std::max(0.0, squares / count - (sum / count) * (sum / count)));
      NOTE("held %.0f Hz note, pad alone: %+.1f dB re the note on average, standard deviation %.2f dB, "
           "from %+.1f to %+.1f dB\n",
           hz, average, spread, lowest, highest);
      EXPECT(average > -5.0 && average < 0.5, "the pad of a held note is at or a little under the note's level");
      EXPECT(spread < 2.3, "the pad of a held pure note breathes by a decibel or two");
      EXPECT(lowest > average - 8.0, "the pad of a held pure note never drops out");
      EXPECT(highest < 3.5, "the pad of a held pure note never swells far past the note");
    }
  }

  // A bad sample in the input (not-a-number, an infinity, a wild value) in
  // the middle of a chord: the output stays finite, the pad carries on as if
  // nothing had happened, and the device still falls silent afterwards.
  {
    std::vector<float> x = chord({196.0, 246.94, 293.66}, 4.0f, 0.1f);
    device.init(kRate);
    Stereo clean = run(device, x);
    const float bad[3] = {std::nanf(""), HUGE_VALF, 1.0e30f};
    for (float sample : bad) {
      std::vector<float> spoiled = x;
      spoiled[at(2.0)] = sample;
      device.init(kRate);
      Stereo out = run(device, spoiled);
      const double after = db(rms(out.left, at(3.0), at(4.0)) / rms(clean.left, at(3.0), at(4.0)));
      render(device, p::kParamDefault[p::kFall] * 2.5f + 1.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      NOTE("bad input sample %g: output finite %d, peak %.2f, level a second later %+.2f dB re clean\n",
           static_cast<double>(sample), finite(out.left) && finite(out.right) ? 1 : 0,
           std::max(peak(out.left), peak(out.right)), after);
      EXPECT(finite(out.left) && finite(out.right), "a bad input sample leaves the output finite");
      EXPECT(std::max(peak(out.left), peak(out.right)) < 8.5, "a wild input sample is held to a sane size");
      EXPECT(std::fabs(after) < 0.5, "the pad carries on after a bad input sample");
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and the device still falls silent");
    }
  }

  // A section, not an organ stop. Three things a bank of bare sines would not
  // do: the upper partials swell in after the lower ones; they are a little
  // rough (the bow: fast, small changes of level that a low partial does not
  // have); and every partial's level wanders slowly by itself, further with
  // Movement.
  {
    double arrive[2], rough[2];
    int which = 0;
    for (float hz : {400.0f, 3200.0f}) {
      plain(device);
      Stereo out = run(device, sine(hz, 6.0f, kRate, 0.1f));
      const double settled = rms(out.left, at(4.0), at(6.0));
      // (in windows long enough to average the roughness out)
      arrive[which] = -1.0;
      for (double t = 0.0; t < 4.0 && arrive[which] < 0.0; t += 0.005) {
        if (rms(out.left, at(t), at(t + 0.2)) >= 0.9 * settled) arrive[which] = t + 0.1;
      }
      // Level in 10 ms windows (whole periods of both tones): the RMS of
      // its change from one window to the next, as a share of the level.
      double change = 0.0, before = rms(out.left, at(4.0), at(4.01));
      int count = 0;
      for (double t = 4.01; t < 5.985; t += 0.01, ++count) {
        const double now = rms(out.left, at(t), at(t + 0.01));
        change += (now - before) * (now - before);
        before = now;
      }
      rough[which++] = std::sqrt(change / count) / settled;
    }
    NOTE("400 Hz / 3200 Hz partial: 90 %% after %.2f / %.2f s; roughness %.4f / %.4f\n", arrive[0],
         arrive[1], rough[0], rough[1]);
    EXPECT(arrive[1] > 1.4 * arrive[0] && arrive[1] < 2.4 * arrive[0],
           "an upper partial swells in later than a lower one");
    EXPECT(rough[1] > 0.02 && rough[1] < 0.12, "an upper partial has the roughness of a bow");
    EXPECT(rough[0] < 0.25 * rough[1], "a lower partial is smooth");

    // Two notes held for twenty seconds, each partial's level in half-second
    // windows: both wander, not together, and further with Movement up.
    double wander[2] = {0.0, 0.0}, together = 0.0;
    which = 0;
    for (float movement : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kMovement, movement);
      Stereo out = run(device, chord({220.0, 554.37}, 22.0f, 0.1f));
      std::vector<float> track[2];
      for (double t = 2.0; t < 21.6; t += 0.5) {
        track[0].push_back(static_cast<float>(db(tone_level(out.left, 220.0, kRate, at(t), at(t + 0.5)))));
        track[1].push_back(static_cast<float>(db(tone_level(out.left, 554.37, kRate, at(t), at(t + 0.5)))));
      }
      double spread[2];
      for (int k = 0; k < 2; ++k) {
        const double centre = mean(track[k]);
        for (float& v : track[k]) v -= static_cast<float>(centre);
        spread[k] = rms(track[k]);
      }
      wander[which++] = std::min(spread[0], spread[1]);
      if (movement == 0.0f) together = correlation(track[0], track[1]);
    }
    NOTE("partial levels over 20 s: standard deviation %.2f dB with Movement at zero (correlation "
         "between two partials %.2f), %.2f dB at full\n",
         wander[0], together, wander[1]);
    EXPECT(wander[0] > 0.08 && wander[0] < 0.8, "every partial's level wanders a little by itself");
    EXPECT(std::fabs(together) < 0.7, "two partials do not wander together");
    EXPECT(wander[1] > 2.0 * wander[0], "Movement makes the partials wander further");
  }

  // A fast trill, eight notes a second with a gap between them: the pad is
  // the two notes, and what it sounds between them stays well under both.
  {
    std::vector<float> x(at(7.0), 0.0f);
    int note = 0;
    for (double start = 0.0; start < 6.0; start += 0.125, ++note) {
      const double hz = note % 2 ? 440.0 : 392.0;
      for (size_t i = at(start); i < at(start + 0.106); ++i) {
        const double t = static_cast<double>(i) / kRate - start;
        const double edge = std::min(1.0, std::min(t, 0.106 - t) / 0.01);
        x[i] = static_cast<float>(0.1 * edge * (std::sin(2.0 * kPi * hz * t) + 0.5 * std::sin(4.0 * kPi * hz * t)));
      }
    }
    plain(device);
    Stereo out = run(device, x);
    const double lower = tone_level(out.left, 392.0, kRate, at(3.0), at(6.0));
    const double upper = tone_level(out.left, 440.0, kRate, at(3.0), at(6.0));
    double between = 0.0;
    for (double hz = 400.0; hz <= 431.0; hz += 1.0) {
      between = std::max(between, tone_level(out.left, hz, kRate, at(3.0), at(6.0)));
    }
    NOTE("trill: pad at 392 Hz %.1f dB, at 440 Hz %.1f dB, strongest between them %.1f dB (re a note)\n",
         db(lower / 0.1), db(upper / 0.1), db(between / 0.1));
    EXPECT(db(std::min(lower, upper) / 0.1) > -16.0, "a fast trill becomes a pad of its two notes");
    EXPECT(between < 0.6 * std::min(lower, upper), "and the pad does not sound the passage between them");
  }

  // Silence: once the pad has fallen the output is exact zeros and the
  // device sleeps; it wakes for the next note.
  {
    device.init(kRate);
    run(device, played(3.0f));
    render(device, p::kParamDefault[p::kFall] * 2.5f + 1.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "exact silence after the pad has fallen");
    device.set_param(p::kMix, 1.0f);
    Stereo woken = run(device, sine(220.0f, 2.0f, kRate, 0.1f));
    EXPECT(rms(woken.left, at(1.0), at(2.0)) > 0.01, "wakes for a new note");
  }

  // The same pad at 44.1 and 96 kHz: pitch, level and times are in hertz and
  // seconds, not samples.
  {
    for (float rate : {44100.0f, 96000.0f}) {
      plain(device, rate);
      Stereo out = run(device, burst(220.0f, 2.0f, 3.5f, rate, 0.1f));
      const auto n = [rate](double seconds) { return at(seconds, rate); };
      const double hz = dominant_frequency(out.left, rate, 200.0, 240.0, n(1.0), n(1.9));
      const double level = db(tone_level(out.left, 220.0, rate, n(1.3), n(1.9)) / 0.1);
      const double steady = rms(out.left, n(1.5), n(1.9));
      const double t90 = time_to_reach(out.left, 0.0, 1.5, steady, 0.9) * kRate / rate;
      const double fall = rt60(out.left, rate, 2.1, 0.05, -100.0);
      NOTE("%.1f kHz: pad at %+.3f ct, %+.2f dB re input, 90 %% after %.2f s, falls 60 dB in %.2f s\n",
           rate / 1000.0, cents(hz, 220.0), level, t90, fall);
      EXPECT(std::fabs(cents(hz, 220.0)) < 2.0, "in tune at other sample rates");
      EXPECT(std::fabs(level) < 2.0, "same level at other sample rates");
      EXPECT(t90 > 0.45 && t90 < 0.75, "same Rise at other sample rates");
      EXPECT(fall > 2.55 && fall < 3.45, "same Fall at other sample rates");
    }
  }

  // Cost under the heaviest sensible load: six held notes of eight harmonics
  // each (most bands sounding) with the octave below, which is the dearer one.
  {
    std::vector<float> dense(at(10.0), 0.0f);
    const double notes[6] = {110.0, 164.81, 220.0, 277.18, 329.63, 440.0};
    for (size_t i = 0; i < dense.size(); ++i) {
      double v = 0.0;
      for (double hz : notes) {
        for (int h = 1; h <= 8; ++h) v += std::sin(2.0 * kPi * hz * h * static_cast<double>(i) / kRate) / h;
      }
      dense[i] = 0.05f * static_cast<float>(v);
    }
    device.init(kRate);
    device.set_param(p::kOctaves, -1.0f);
    report_cost("pad-follower", 10.0f, kRate, [&] { run(device, dense); });
  }

  return finish("pad-follower");
}
