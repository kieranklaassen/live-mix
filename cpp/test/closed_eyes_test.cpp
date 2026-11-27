// Native harness for Closed Eyes (cpp/devices/closed-eyes). The conformance
// pass covers silence, a pile of keys, parameter abuse and other sample rates;
// the rest measures the idea: a note that tires partial by partial, an
// opposite in another register or family when it is let go, a memory that
// belongs to the pitch, blinks, and an opposite that moves to a safe tone.
//
// Nobody has listened to this device. Every claim below is a measurement.

#include "../devices/closed-eyes/closed_eyes.h"
#include <initializer_list>
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::ClosedEyes;
namespace p = livemix::closed_eyes;

static ClosedEyes device;
static ClosedEyes other;
static char label[240];
static const float kRate = 48000.0f;
static const float kD4 = 293.6648f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static float key(double note) { return static_cast<float>(440.0 * std::pow(2.0, (note - 69.0) / 12.0)); }
static double both_peak(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static std::vector<float> side(const Stereo& s) {
  std::vector<float> out = mid(s);
  for (size_t i = 0; i < s.size(); ++i) out[i] -= s.right[i];
  return out;
}
// Cents from `hz`, by how far the phase of that component turns in half a second.
static double cents_off(const std::vector<float>& x, double hz, double from) {
  const double a = tone_phase(x, hz, kRate, at(from), at(from + 0.5));
  double turn = tone_phase(x, hz, kRate, at(from + 0.5), at(from + 1.0)) - a;
  turn -= 2.0 * kPi * std::floor(turn / (2.0 * kPi) + 0.5);
  return 1200.0 * std::log2(1.0 + turn / (2.0 * kPi * 0.5 * hz));
}
static double level_db(const std::vector<float>& x, double hz, double from, double to) {
  return db(tone_level(x, hz, kRate, at(from), at(to)));
}
static double rms_db(const std::vector<float>& x, double from, double to) { return db(rms(x, at(from), at(to))); }

// A still, plain instrument at unity level: nothing floats, no air, no seep.
struct Set { int id; float value; };
static void bare(std::initializer_list<Set> more) {
  device.init(kRate);
  for (int id : {p::kDrift, p::kAir, p::kSeep, p::kVolume}) device.set_param(id, 0.0f);
  for (Set s : {Set{p::kAttack, 0.05f}, Set{p::kRelease, 0.1f}, Set{p::kRise, 0.05f}}) device.set_param(s.id, s.value);
  for (Set s : more) device.set_param(s.id, s.value);
}
static Stereo one_key(float hz, float held, float after, float gain = 0.7f) {
  device.note_on(1, hz, gain);
  Stereo out = render(device, held, kRate);
  device.note_off(1);
  return concat(out, render(device, after, kRate));
}

static void check_tiring() {
  double fall[2][2];
  for (int deep = 0; deep < 2; ++deep) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, deep ? 1.0f : 0.0f}, {p::kTire, 1.0f}});
    const auto x = mid(one_key(kD4, 5.0f, 0.1f));
    for (int k = 0; k < 2; ++k) {
      const double hz = kD4 * (k == 0 ? 1.0 : 5.0);
      fall[deep][k] = level_db(x, hz, 0.1, 0.5) - level_db(x, hz, 4.4, 4.9);
    }
  }
  std::printf("tiring: depth 0 falls %.1f / %.1f dB, depth 1 %.1f / %.1f dB (first, fifth partial)\n", fall[0][0],
              fall[0][1], fall[1][0], fall[1][1]);
  EXPECT(std::fabs(fall[0][0]) < 1.0, "with Depth at zero a held note keeps its level");
  EXPECT(fall[1][0] > 6.0, "with Depth up the strongest partial sinks");
  EXPECT(fall[1][1] < fall[1][0] - 4.0, "a faint partial sinks less: the note pales");

  double half[2];
  for (int slow = 0; slow < 2; ++slow) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, 1.0f}, {p::kTire, slow ? 4.0f : 0.4f}, {p::kRecover, 40.0f}});
    const auto x = mid(one_key(kD4, 1.2f, 0.1f));
    half[slow] = level_db(x, kD4, 0.08, 0.2) - level_db(x, kD4, 0.9, 1.1);
  }
  EXPECT(half[0] > half[1] + 4.0, "Tire says how soon a note tires");

  double rested[2];
  for (int soon = 0; soon < 2; ++soon) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, 1.0f}, {p::kRecover, soon ? 0.2f : 40.0f}});
    rested[soon] = level_db(mid(one_key(kD4, 4.0f, 0.1f)), kD4, 3.0, 3.9);
  }
  EXPECT(rested[1] > rested[0] + 5.0, "what recovers at once never tires far");
}

static void check_opposites() {
  double held_rms[6], after_rms[6], high[6], wide[6], own[6];
  for (int o = 0; o < 6; ++o) {
    bare({{p::kOpposite, static_cast<float>(o)}});
    const Stereo out = one_key(kD4, 3.0f, 2.0f);
    const auto x = mid(out), s = side(out);
    held_rms[o] = rms_db(x, 2.6, 2.9);
    after_rms[o] = rms_db(x, 3.3, 3.9);
    high[o] = energy_above(x, 1000.0, kRate, at(3.3), at(3.9));
    wide[o] = rms_db(s, 3.3, 3.9) - after_rms[o];
    own[o] = level_db(x, kD4, 3.3, 3.9) - after_rms[o];
    std::snprintf(label, sizeof label, "opposite %d: within 8 dB of the note (%.1f against %.1f dB)", o, after_rms[o],
                  held_rms[o]);
    EXPECT(std::fabs(after_rms[o] - held_rms[o]) < 8.0, label);
    if (o == p::kEven) {
      EXPECT(level_db(x, 2 * kD4, 3.3, 3.9) > level_db(x, kD4, 3.3, 3.9) + 30.0, "Even: an octave up, the note gone");
      EXPECT(level_db(x, 4 * kD4, 3.3, 3.9) > level_db(x, 3 * kD4, 3.3, 3.9) + 12.0, "Even: no odd partials");
    }
    if (o == p::kMirror) {
      EXPECT(level_db(x, 4 * kD4, 3.3, 3.9) > level_db(x, kD4, 3.3, 3.9) + 30.0, "Mirror: a low key leaves a high bell");
    }
    if (o == p::kBelow) {
      EXPECT(level_db(x, 0.5 * kD4, 3.3, 3.9) > level_db(x, kD4, 3.3, 3.9) + 25.0, "Below: an octave down and hollow");
    }
    if (o == p::kSides) EXPECT(own[o] < -15.0, "Sides: the note itself is in neither side");
    if (o == p::kRough) EXPECT(level_db(x, kD4, 3.3, 3.9) < after_rms[o] + 3.0 - 6.0, "Rough: no line left in the band");
  }
  EXPECT(wide[p::kSides] > -5.0 && wide[p::kSides] > wide[p::kEven] + 8.0, "Sides is the wide one");
  EXPECT(high[p::kBreath] > 0.4 && high[p::kBreath] > 5.0 * high[p::kBelow], "Breath is high air");

  bare({});
  const auto low = mid(one_key(key(84), 3.0f, 1.0f));
  EXPECT(level_db(low, key(84) / 8, 3.3, 3.9) > level_db(low, key(84), 3.3, 3.9) + 15.0, "Mirror: a high key leaves a low one");
}

static void check_gesture() {
  double after[3];
  const float looks[3] = {0.15f, 0.8f, 4.0f};
  for (int i = 0; i < 3; ++i) {
    bare({{p::kOpposite, p::kEven}});
    const auto x = mid(one_key(kD4, looks[i], 1.0f));
    after[i] = level_db(x, 2 * kD4, looks[i] + 0.3, looks[i] + 0.8);
  }
  std::printf("after a look of 0.15, 0.8, 4 s: %.1f, %.1f, %.1f dB\n", after[0], after[1], after[2]);
  EXPECT(after[1] > after[0] + 4.0 && after[2] > after[1] + 0.5, "the longer the look, the stronger the opposite");

  double fall[2], seep[2], slow[2];
  for (int i = 0; i < 2; ++i) {
    bare({{p::kOpposite, p::kBelow}, {p::kLength, i ? 12.0f : 3.0f}});
    const auto x = mid(one_key(kD4, 3.0f, 3.0f));
    fall[i] = level_db(x, kD4 / 2, 3.4, 3.9) - level_db(x, kD4 / 2, 5.4, 5.9);
    bare({{p::kOpposite, p::kEven}, {p::kDepth, 0.0f}, {p::kRise, i ? 3.0f : 0.02f}});
    const auto y = mid(one_key(kD4, 3.0f, 1.0f));
    slow[i] = rms_db(y, 3.2, 3.5);
    bare({{p::kOpposite, p::kBelow}, {p::kSeep, i ? 0.8f : 0.0f}});
    seep[i] = level_db(mid(one_key(kD4, 3.0f, 0.1f)), kD4 / 2, 2.4, 2.9);
  }
  EXPECT(fall[0] > 2.5 * fall[1] && fall[1] > 3.0, "After Length says how soon the opposite fades");
  EXPECT(slow[0] > slow[1] + 6.0, "After Rise says how soon it comes");
  EXPECT(seep[1] > seep[0] + 25.0, "with Seep it shows while the key is held, and without it not");

  bare({{p::kSource, p::kStruck}, {p::kForm, 0.0f}, {p::kOpposite, p::kBelow}, {p::kTire, 0.3f}});
  const auto x = mid(one_key(kD4, 4.0f, 0.1f));
  EXPECT(level_db(x, kD4 / 2, 0.8, 1.6) > level_db(x, kD4 / 2, 0.0, 0.12) + 6.0,
         "under a held struck key the opposite appears as the note dies");
}

static void check_memory() {
  // The same key, its octave or another key, a second after a long look.
  auto again = [](int memory, float hz, float gap, float recover) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, 1.0f}, {p::kMemory, static_cast<float>(memory)}, {p::kRecover, recover}});
    device.note_on(1, kD4, 0.7f);
    render(device, 3.0f, kRate);
    device.note_off(1);
    render(device, gap, kRate);
    device.note_on(2, hz, 0.7f);
    return rms_db(mid(render(device, 0.3f, kRate)), 0.08, 0.28);
  };
  const double fresh = again(0, kD4, 90.0f, 2.0f);
  const double same = again(0, kD4, 1.0f, 10.0f), same_soon = again(0, kD4, 1.0f, 0.3f);
  const double fresh_octave = again(0, 2 * kD4, 1.0f, 10.0f), octave = again(1, 2 * kD4, 1.0f, 10.0f);
  const double fresh_fifth = again(1, 1.5f * kD4, 1.0f, 10.0f), fifth = again(2, 1.5f * kD4, 1.0f, 10.0f);
  std::printf("a key that returns: fresh %.1f, tired %.1f, rested %.1f; octave %.1f to %.1f; fifth %.1f to %.1f\n", fresh,
              same, same_soon, fresh_octave, octave, fresh_fifth, fifth);
  EXPECT(same < fresh - 4.0, "a key that returns soon comes back tired");
  EXPECT(same_soon > same + 3.0, "and rested when Recover is short");
  EXPECT(octave < fresh_octave - 3.0, "Octave remembers the note in other octaves, Note does not");
  EXPECT(fifth < fresh_fifth - 3.0, "Chord remembers every key, Octave does not");

  // Asleep in between: the time still counts, and the sleep is exact silence.
  bare({{p::kAfter, 0.0f}, {p::kRecover, 3.0f}});
  device.note_on(1, kD4, 0.7f);
  render(device, 2.0f, kRate);
  device.note_off(1);
  render(device, 2.0f, kRate);
  EXPECT(both_peak(render(device, 1.0f, kRate)) == 0.0, "a voice without an opposite ends in exact silence");
  auto after_sleep = [](float sleep) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, 1.0f}, {p::kRecover, 4.0f}});
    one_key(kD4, 3.0f, sleep);
    device.note_on(2, kD4, 0.7f);
    return rms_db(mid(render(device, 0.3f, kRate)), 0.08, 0.28);
  };
  const double short_sleep = after_sleep(1.5f), long_sleep = after_sleep(24.0f);
  EXPECT(long_sleep > short_sleep + 6.0 && std::fabs(long_sleep - fresh) < 1.5, "a pitch rests while the device sleeps");

  double even[2];
  for (int again = 0; again < 2; ++again) {
    bare({{p::kAfter, 0.0f}, {p::kDepth, 0.0f}, {p::kRecover, 20.0f}});
    if (again) one_key(kD4, 3.0f, 2.0f);
    even[again] = level_db(mid(one_key(kD4, 0.6f, 0.1f)), kD4, 0.1, 0.5);
  }
  EXPECT(even[1] < even[0] - 2.0 && even[1] > even[0] - 7.0, "even with Depth at zero a tired key comes back quieter");

  // At the default Depth: paler, not gone, and its opposite comes with it.
  double note[2], shows[2];
  for (int again = 0; again < 2; ++again) {
    bare({{p::kOpposite, p::kEven}, {p::kRecover, 20.0f}, {p::kLength, 0.4f}});
    if (again) {
      one_key(kD4, 3.0f, 2.5f);
      EXPECT(both_peak(render(device, 0.2f, kRate)) == 0.0, "the first opposite is gone before the key returns");
    }
    const auto x = mid(one_key(kD4, 0.6f, 0.1f));
    note[again] = level_db(x, kD4, 0.1, 0.5);
    shows[again] = level_db(x, 4 * kD4, 0.1, 0.5);
  }
  std::printf("a tired key: %.1f dB against %.1f fresh, its opposite %.1f against %.1f\n", note[1], note[0], shows[1], shows[0]);
  EXPECT(note[1] < note[0] - 4.0 && note[1] > note[0] - 16.0, "a tired key comes back paler, and still speaks");
  EXPECT(shows[1] > shows[0] + 1.0, "and its opposite is there already");
}

static void check_blink() {
  bare({{p::kOpposite, p::kEven}, {p::kBlink, 1.0f}, {p::kBlinkRate, 0.5f}, {p::kRise, 8.0f}});
  device.note_on(1, kD4, 0.7f);
  const auto x = mid(render(device, 8.0f, kRate));
  // A turn is 2 s; the lids are down about two thirds through it.
  const double open = level_db(x, kD4, 6.2, 6.6), shut = level_db(x, kD4, 7.22, 7.42);
  const double flash = level_db(x, 2 * kD4, 7.22, 7.42), none = level_db(x, kD4, 5.22, 5.42);
  std::printf("blink: note open %.1f shut %.1f, opposite in the blink %.1f dB\n", open, shut, flash);
  EXPECT(shut < open - 25.0 && none < open - 25.0, "in a blink the note is gone, every turn");
  EXPECT(flash > open - 8.0, "and its opposite flashes");
  bare({{p::kAfter, 0.0f}, {p::kDepth, 0.0f}, {p::kBlink, 0.25f}, {p::kBlinkRate, 0.5f}});
  device.note_on(1, kD4, 0.7f);
  const auto y = mid(render(device, 4.0f, kRate));
  const double dim = level_db(y, kD4, 2.2, 2.6) - level_db(y, kD4, 3.22, 3.42);
  EXPECT(dim > 2.5 && dim < 8.0, "a quarter of Blink is already heard, and no more than a dimming");
}

static void check_safe() {
  double stays[2], moves[2];
  for (int safe = 0; safe < 2; ++safe) {
    bare({{p::kOpposite, p::kBelow}, {p::kLength, 40.0f}, {p::kSafe, static_cast<float>(safe)}});
    one_key(key(62), 3.0f, 0.5f);  // D leaves a low D
    device.note_on(2, key(84), 0.1f);      // and only a C is held now
    const auto x = mid(render(device, 2.0f, kRate));
    stays[safe] = level_db(x, key(50), 1.2, 1.9);
    moves[safe] = level_db(x, key(48), 1.2, 1.9);
  }
  EXPECT(stays[0] > moves[0] + 15.0, "Stay: the opposite keeps its own tone");
  EXPECT(moves[1] > stays[1] + 15.0 && moves[1] > stays[0] - 8.0, "Move: it crosses to the nearest tone that is held");
}

static void check_tuning_and_levels() {
  for (int source = 0; source < 6; ++source) {
    double quiet = 0.0, loud = -200.0, worst_cents = 0.0;
    for (int octave = 0; octave < 5; ++octave) {
      const float hz = key(36 + 12 * octave);
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      const Stereo out = one_key(hz, 2.5f, 0.1f);
      const double top = db(both_peak(out));
      std::snprintf(label, sizeof label, "source %d, C%d: peak between -24 and -10 dBFS (%.1f)", source, octave + 2, top);
      EXPECT(top > -24.0 && top < -10.0, label);
      const double now = rms_db(mid(out), 0.4, 2.4);
      quiet = std::min(quiet, now);
      loud = std::max(loud, now);
      bare({{p::kSource, static_cast<float>(source)}, {p::kAfter, 0.0f}, {p::kDepth, 0.0f}});
      if (source == p::kBowl) device.set_param(p::kForm, 0.0f);  // the rim's pairs closest
      const auto x = mid(one_key(hz, 2.5f, 0.1f));
      worst_cents = std::max(worst_cents, std::fabs(cents_off(x, hz, 0.6)));
    }
    std::printf("source %d: %.1f to %.1f dB over C2 to C6, at most %.2f cents off\n", source, quiet, loud, worst_cents);
    std::snprintf(label, sizeof label, "source %d: level even along the keyboard", source);
    EXPECT(loud - quiet < 6.5, label);
    std::snprintf(label, sizeof label, "source %d: in tune", source);
    EXPECT(worst_cents < 3.0, label);

    double bright[2];
    for (int hard = 0; hard < 2; ++hard) {
      bare({{p::kSource, static_cast<float>(source)}, {p::kAfter, 0.0f}});
      const auto x = mid(one_key(220.0f, 1.0f, 0.1f, hard ? 1.0f : 0.15f));
      bright[hard] = energy_above(x, 900.0, kRate, at(0.1), at(0.9));
    }
    std::snprintf(label, sizeof label, "source %d: a hard touch is brighter (%.4f, %.4f)", source, bright[0], bright[1]);
    EXPECT(bright[1] > 1.12 * bright[0], label);

    for (int opposite = 0; opposite < 6; ++opposite) {
      device.init(kRate);
      device.set_param(p::kSource, static_cast<float>(source));
      device.set_param(p::kOpposite, static_cast<float>(opposite));
      const int keys[10] = {38, 45, 48, 53, 57, 60, 64, 67, 72, 76};
      for (int i = 0; i < 10; ++i) device.note_on(i, key(keys[i]), 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      for (int i = 0; i < 10; ++i) device.note_off(i);
      out = concat(out, render(device, 1.5f, kRate));
      std::snprintf(label, sizeof label, "ten hard keys, source %d opposite %d: under the knee (%.3f)", source, opposite,
                    both_peak(out));
      EXPECT(both_peak(out) < 0.48, label);
    }
  }
}

// A step or a corner shows above 7 kHz, where these notes have next to nothing:
// the largest sample after three second-order high-passes.
static double kink(const Stereo& s) {
  const double k = std::tan(kPi * 7000.0 / kRate), n = 1.0 / (1.0 + k * 1.4142 + k * k);
  const double b1 = 2.0 * (k * k - 1.0) * n, b2 = (1.0 - k * 1.4142 + k * k) * n;
  double worst = 0.0;
  for (const auto* x : {&s.left, &s.right}) {
    double z[3][2] = {};
    for (size_t i = 0; i < x->size(); ++i) {
      double v = (*x)[i];
      for (auto& m : z) {
        const double out = v * n + m[0];
        m[0] = -2.0 * n * v + m[1] - b1 * out;
        m[1] = n * v - b2 * out;
        v = out;
      }
      if (i > 240) worst = std::max(worst, std::fabs(v));
    }
  }
  return worst;
}

static void check_clicks() {
  // An event against the same passage without it.
  auto against = [](const char* what, double limit, auto event) {
    double worst = 0.0;
    for (int trial = 0; trial < 4; ++trial) {
      double found[2];
      for (int pass = 0; pass < 2; ++pass) {
        device.init(kRate);
        for (Set s : {Set{p::kAir, 0.0f}, Set{p::kOpposite, p::kBelow}, Set{p::kColour, 0.2f}, Set{p::kRelease, 0.15f}}) {
          device.set_param(s.id, s.value);
        }
        device.note_on(1, kD4, 0.8f);
        device.note_on(2, kD4 * 1.5f, 0.8f);
        render(device, 2.0f + 0.0007f * static_cast<float>(trial), kRate);
        const Stereo lead = render(device, 0.01f, kRate);  // a step at the event itself is seen too
        if (pass == 0) event(device);
        found[pass] = kink(concat(lead, render(device, 0.12f, kRate)));
      }
      worst = std::max(worst, found[0] - found[1]);
    }
    std::snprintf(label, sizeof label, "%s makes no click (%.6f over the passage)", what, worst);
    EXPECT(worst < limit, label);
  };
  against("letting go", 0.0001, [](ClosedEyes& d) { d.note_off(1); });
  against("another opposite", 0.0001, [](ClosedEyes& d) { d.set_param(p::kOpposite, 0.0f); });
  against("the same key again", 0.0001, [](ClosedEyes& d) { d.note_on(1, kD4, 0.8f); });
  against("the same key softly", 0.0001, [](ClosedEyes& d) { d.note_on(1, kD4, 0.1f); });
  against("volume", 0.0001, [](ClosedEyes& d) { d.set_param(p::kVolume, -40.0f); });
  against("colour", 0.0001, [](ClosedEyes& d) { d.set_param(p::kColour, 0.0f); });
  against("depth", 0.0001, [](ClosedEyes& d) { d.set_param(p::kDepth, 0.0f); });
  against("seep", 0.0001, [](ClosedEyes& d) { d.set_param(p::kSeep, 1.0f); });
  against("a blink begun", 0.0001, [](ClosedEyes& d) { d.set_param(p::kBlink, 1.0f); });
  against("a full house", 0.0001, [](ClosedEyes& d) {
    for (int i = 0; i < 34; ++i) d.note_on(50 + i, key(40 + i), 1.0f);
  });
}

static void check_sweeps() {
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    for (int n = 0; n < 4; ++n) device.note_on(n, key(50 + 7 * n), 0.9f);
    double worst = 0.0;
    bool fine = true;
    for (int step = 0; step < 60; ++step) {
      const float t = 0.5f - 0.5f * std::cos(0.37f * static_cast<float>(step));
      device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * t);
      if (step == 30) device.note_off(1);
      if (step == 40) device.note_on(1, key(57), 0.5f);
      const Stereo out = render(device, 0.05f, kRate);
      fine = fine && finite(out.left) && finite(out.right);
      worst = std::max(worst, both_peak(out));
    }
    std::snprintf(label, sizeof label, "param %d swept while sounding: finite and bounded (%.2f)", id, worst);
    EXPECT(fine && worst < 1.0, label);
  }
}

static void check_bad_notes_and_keys() {
  device.init(kRate);
  const float bad[] = {std::nanf(""), 0.0f, 5.0f, -100.0f, 20000.0f, 1.0e30f, std::numeric_limits<float>::infinity()};
  int id = 0;
  for (float hz : bad) device.note_on(id++, hz, 0.8f);
  for (float gain : {std::nanf(""), 0.0f, -1.0f, 5.0f, std::numeric_limits<float>::infinity()}) device.note_on(id++, 330.0f, gain);
  Stereo out = render(device, 1.0f, kRate);
  EXPECT(finite(out.left) && finite(out.right) && both_peak(out) <= 1.0, "absurd notes are survived");
  for (int i = 0; i < id; ++i) device.note_off(i);
  device.note_off(999);

  // One id at one pitch, another and the first again, then one note off.
  bare({{p::kAfter, 0.0f}});
  for (float hz : {220.0f, 330.0f, 220.0f}) {
    device.note_on(7, hz, 0.7f);
    render(device, 0.3f, kRate);
  }
  device.note_off(7);
  render(device, 2.0f, kRate);
  EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "key A, B, A with one id and one off leaves nothing held");

  // Struck again inside a steal, and let go there.
  bare({});
  for (int i = 0; i < 16; ++i) device.note_on(i, key(40 + i), 0.6f);
  render(device, 0.5f, kRate);
  for (int i = 0; i < 3; ++i) device.note_on(40, key(80), 0.6f);
  device.note_off(40);
  for (int i = 0; i < 16; ++i) device.note_off(i);
  device.set_param(p::kAfter, 0.0f);
  render(device, 3.0f, kRate);
  EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "a key struck twice inside a steal is not left sounding");
}

static Stereo passage(ClosedEyes& d, int block, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kSource, 3.0f);
  d.set_param(p::kBlink, 0.4f);
  d.set_param(p::kLength, 0.4f);
  d.set_param(p::kRelease, 0.05f);
  auto frames = [&](size_t count) { return run(d, std::vector<float>(count, 0.0f), block); };
  d.note_on(1, 220.0f, 0.8f);
  d.note_on(2, 331.0f, 0.5f);
  Stereo out = frames(24576);
  d.note_off(1);
  d.note_off(2);
  out = concat(out, frames(40960 * 3));
  d.set_param(p::kOpposite, 4.0f);
  d.set_param(p::kVolume, -12.0f);
  out = concat(out, frames(40960));
  d.note_on(3, 220.0f, 0.6f);
  return concat(out, frames(24576));
}

static void check_blocks_and_rates() {
  const Stereo reference = passage(device, 128);
  for (int block : {1, 2048}) {
    const Stereo again = passage(other, block);
    double worst = 0.0;
    for (size_t i = 0; i < reference.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(reference.left[i]) - again.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(reference.right[i]) - again.right[i]));
    }
    std::snprintf(label, sizeof label, "block size %d gives the same across a silence (%g)", block, worst);
    EXPECT(worst < 1.0e-6, label);
  }
  EXPECT(peak(reference.left, 24576 + 2 * 40960, 24576 + 3 * 40960) == 0.0, "the silence between is exact");

  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  double level[3][3];
  for (int i = 0; i < 3; ++i) {
    device.init(rates[i]);
    device.set_param(p::kAir, 0.6f);
    device.set_param(p::kOpposite, 4.0f);
    device.note_on(1, kD4, 0.7f);
    const Stereo held = render(device, 2.0f, rates[i]);
    device.note_off(1);
    const Stereo after = render(device, 2.0f, rates[i]);
    level[i][0] = db(rms(held.left, at(1.5, rates[i]), at(2.0, rates[i])));
    level[i][1] = db(rms(after.left, at(0.5, rates[i]), at(1.0, rates[i])));
    level[i][2] = db(rms(after.left, at(1.5, rates[i]), at(2.0, rates[i])));
  }
  for (int k = 0; k < 3; ++k) {
    EXPECT_NEAR(level[0][k], level[1][k], 1.2, "44.1 kHz sounds as 48 does");
    EXPECT_NEAR(level[2][k], level[1][k], 1.2, "96 kHz sounds as 48 does");
  }

  // A knob moved in the silence has arrived by the next note.
  bare({});
  one_key(kD4, 0.2f, 30.0f);
  device.set_param(p::kVolume, -48.0f);
  device.note_on(2, kD4 * 1.3f, 1.0f);
  EXPECT(both_peak(render(device, 0.01f, kRate)) < 0.004, "a knob moved while it slept does not glide under the note");
}

// What a check of the first version found.
static void check_findings() {
  // A quick key speaks with a bright accent; a slow one does not.
  double accent[2];
  for (int slow = 0; slow < 2; ++slow) {
    bare({{p::kAttack, slow ? 0.3f : 0.02f}, {p::kDepth, 0.0f}, {p::kAfter, 0.0f}});
    const auto x = mid(one_key(220.0f, 1.2f, 0.1f));
    const double from = slow ? 0.3 : 0.03;
    accent[slow] = (level_db(x, 880.0, from, from + 0.1) - level_db(x, 220.0, from, from + 0.1)) -
                   (level_db(x, 880.0, 0.9, 1.1) - level_db(x, 220.0, 0.9, 1.1));
  }
  EXPECT(accent[0] > 2.0 && std::fabs(accent[1]) < 1.0, "a quick Attack speaks with an accent");

  // Length is seconds: 60 dB, within a half either way.
  for (int o : {p::kEven, p::kSides, p::kBelow}) {
    bare({{p::kOpposite, static_cast<float>(o)}, {p::kLength, 8.0f}});
    const auto x = mid(one_key(kD4, 3.0f, 14.0f));
    const double begin = rms_db(x, 3.3, 3.8);
    double fallen = 14.0;
    for (int i = 138; i > 0; --i) {
      if (rms_db(x, 3.0 + 0.1 * i, 3.1 + 0.1 * i) > begin - 60.0) break;
      fallen = 0.1 * i;
    }
    std::snprintf(label, sizeof label, "opposite %d: 60 dB down %.1f s after the key at a Length of 8", o, fallen);
    EXPECT(fallen > 5.0 && fallen < 12.0, label);
  }

  // Width at zero is one middle; at one it is wide.
  for (int o = 0; o < 6; ++o) {
    device.init(kRate);
    device.set_param(p::kOpposite, static_cast<float>(o));
    device.set_param(p::kAir, 0.5f);
    device.set_param(p::kWidth, 0.0f);
    if (o % 2) device.set_param(p::kSource, p::kBowl);
    const Stereo narrow = one_key(kD4, 1.0f, 1.0f);
    std::snprintf(label, sizeof label, "opposite %d: Width at zero is mono", o);
    EXPECT(peak(side(narrow)) < 1.0e-5, label);
  }

  // The level is watched: the loudest mixture of ten hard keys stays under the knee.
  for (int source : {p::kReed, p::kBowl, p::kVowel}) {
    for (int o : {p::kSides, p::kBreath, p::kEven}) {
      device.init(kRate);
      for (Set s : {Set{p::kSource, static_cast<float>(source)}, Set{p::kOpposite, static_cast<float>(o)}, Set{p::kAfter, 1.0f},
                    Set{p::kSeep, 1.0f}, Set{p::kAir, 1.0f}, Set{p::kDrift, 1.0f}, Set{p::kDepth, 0.0f}, Set{p::kColour, 0.8f},
                    Set{p::kAttack, 0.2f}}) device.set_param(s.id, s.value);
      for (int i = 0; i < 10; ++i) device.note_on(i, key(38 + 4 * i), 1.0f);
      const double top = both_peak(render(device, 4.0f, kRate));
      std::snprintf(label, sizeof label, "everything up, source %d opposite %d: %.3f", source, o, top);
      EXPECT(top < 0.48, label);
    }
  }

  // The whole of a note goes on moving however long it is held.
  bare({{p::kSource, p::kVowel}, {p::kAfter, 0.0f}});
  device.note_on(1, 220.0f, 0.7f);
  for (int i = 0; i < 62; ++i) render(device, 10.0f, kRate);
  const auto x = mid(render(device, 1.5f, kRate));
  double least = 99.0, most = -99.0, before = tone_phase(x, 220.0, kRate, 0, at(0.05));
  for (int i = 1; i < 28; ++i) {
    const double now = tone_phase(x, 220.0, kRate, at(0.05 * i), at(0.05 * i + 0.05));
    double turn = now - before;
    turn -= 2.0 * kPi * std::floor(turn / (2.0 * kPi) + 0.5);
    least = std::min(least, turn);
    most = std::max(most, turn);
    before = now;
  }
  EXPECT(most - least > 0.02, "after ten minutes a vowel still has its vibrato");

  // Seep dissolves the note into its opposite.
  double left[2];
  for (int i = 0; i < 2; ++i) {
    bare({{p::kOpposite, p::kEven}, {p::kSeep, i ? 1.0f : 0.0f}});
    left[i] = level_db(mid(one_key(kD4, 4.0f, 0.1f)), kD4, 3.0, 3.8);
  }
  EXPECT(left[1] < left[0] - 3.0, "a tired note gives way to what seeps through");
}

int main() {
  Conformance spec;
  spec.name = "closed-eyes", spec.num_params = p::kNumParams, spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 22.0f, spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  for (auto check : {check_tiring, check_opposites, check_gesture, check_memory, check_blink, check_safe,
                     check_tuning_and_levels, check_clicks, check_sweeps, check_bad_notes_and_keys, check_blocks_and_rates, check_findings}) {
    check();
  }

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, key(45 + 5 * n), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("closed-eyes, eight keys", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("closed-eyes");
}
