// Native harness for Tanpura (cpp/devices/tanpura). The conformance pass
// covers silence before and after notes, voice stealing under a pile of keys,
// parameter abuse and other sample rates. The rest measures what makes it a
// tanpura, first on one string with its jawari bridge, where the pluck can be
// put exactly in the middle, then on the whole instrument. Nobody has
// listened to it: every claim below is a number.

#include "../devices/tanpura/tanpura.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::JawariString;
using livemix::Tanpura;
namespace kit = livemix::kit;
namespace p = livemix::tanpura;

static Tanpura device;
static JawariString lone;

static const float kRate = 48000.0f;
static const double kC3 = 130.8128;

// The contact strength the bridge gets from the default Jawari setting.
static float default_contact() { return Tanpura::contact_for(p::kParamDefault[p::kJawari]); }

// --- one string ---------------------------------------------------------------------------

// One pluck of one string, with the device's pluck and through the same
// decimator and DC blocker. `contact` is the bridge (0 is a plain string), `amp` the pluck.
static std::vector<float> pluck_string(double hz, float contact, float amp, float seconds, float rate = kRate,
                                       float decay = 12.0f, float position = 0.5f) {
  const float loop_rate = 2.0f * rate;
  lone.init(loop_rate, loop_rate / 32.0f);
  lone.strike(static_cast<float>(hz), decay, position);
  kit::PluckExciter exciter;
  kit::Rng rng;
  exciter.strike(amp, static_cast<float>(hz), Tanpura::kPickHarmonics * static_cast<float>(hz), 0.0f, loop_rate);
  kit::Halfband2x half;
  half.init();
  kit::DcBlocker dc;
  dc.set_cutoff(Tanpura::kDcHz, rate);
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  float touch[32], excite[32], y[32];
  for (float& v : touch) v = contact;
  for (size_t done = 0; done < out.size(); done += 16) {
    const bool plucking = exciter.active();
    if (plucking) {
      for (float& v : excite) v = exciter.next(rng);
    }
    lone.render(plucking ? excite : nullptr, touch, y, 32);
    for (size_t i = 0; i < 16 && done + i < out.size(); ++i) out[done + i] = dc.process(half.down(y[2 * i], y[2 * i + 1]));
  }
  return out;
}

static double cents(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }

// One Hann-weighted stretch of a signal, to be asked for the level of many
// frequencies: the same measure as tone_level, with the window applied once
// and Goertzel's recurrence for each frequency (the harness asks for about a
// quarter of a million levels).
struct Stretch {
  std::vector<double> weighted;
  double weight = 0.0;
  double rate = 48000.0;

  Stretch(const std::vector<float>& x, double sample_rate, size_t from, size_t to) : rate(sample_rate) {
    to = std::min(to, x.size());
    const size_t n = to > from ? to - from : 0;
    weighted.resize(n);
    for (size_t i = 0; i < n; ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
      weighted[i] = w * x[from + i];
      weight += w;
    }
  }

  // 1.0 for a full-scale sine exactly on `hz`.
  double level(double hz) const {
    if (weighted.empty()) return 0.0;
    const double turn = 2.0 * std::cos(2.0 * kPi * hz / rate);
    double s1 = 0.0, s2 = 0.0;
    for (double v : weighted) {
      const double s0 = v + turn * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    return 2.0 * std::sqrt(std::max(0.0, s1 * s1 + s2 * s2 - turn * s1 * s2)) / weight;
  }

  // The strongest line within `span` cents of `hz`.
  double partial_near(double hz, double span = 40.0) const {
    double best_hz = hz, best = -1.0;
    for (int pass = 0; pass < 4; ++pass) {
      const double centre = best_hz;
      for (int i = -10; i <= 10; ++i) {
        const double candidate = centre * std::pow(2.0, span * i / 12000.0);
        const double now = level(candidate);
        if (now > best) {
          best = now;
          best_hz = candidate;
        }
      }
      span /= 8.0;
    }
    return best_hz;
  }
};

static double partial_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                           double span = 40.0) {
  return Stretch(x, rate, from, to).partial_near(hz, span);
}

// The partials of a string in one window: each harmonic's level (following
// the stiff string's stretch), the level of harmonics 1 to 3 and of 10 to 30,
// the centroid of those above the fifth in octaves (log2 of the harmonic
// number) and the strongest of them.
struct Partials {
  double level[41];
  double low, high, centroid;
  int strongest;
};

static Partials partials(const std::vector<float>& x, double hz, double rate, double at, double window) {
  Partials out{};
  const size_t from = static_cast<size_t>(at * rate);
  const Stretch stretch(x, rate, from, from + static_cast<size_t>(window * rate));
  const double f0 = window >= 0.1 ? stretch.partial_near(hz) : hz;
  double low = 0.0, high = 0.0, weighted = 0.0, total = 0.0, most = 0.0;
  for (int n = 1; n <= 40; ++n) {
    const double centre = n * f0;
    if (centre > 0.45 * rate) break;
    double level = 0.0;
    for (double sharp : {0.0, 0.004, 0.008, 0.012, 0.016, 0.02}) {
      level = std::max(level, stretch.level(centre * (1.0 + sharp * (n / 40.0) * (n / 40.0) * 2.0)));
    }
    out.level[n] = level;
    if (n <= 3) low += level * level;
    if (n >= 10 && n <= 30) high += level * level;
    if (n > 5) {
      weighted += std::log2(static_cast<double>(n)) * level * level;
      total += level * level;
      if (level > most) {
        most = level;
        out.strongest = n;
      }
    }
  }
  out.low = std::sqrt(low);
  out.high = std::sqrt(high);
  out.centroid = total > 0.0 ? weighted / total : 0.0;
  return out;
}

// When the band of harmonics 10 to 30 is loudest in the first `until`
// seconds, and by how much it then stands over its level in the first 30 ms.
static void bloom(const std::vector<float>& x, double hz, double* at, double* rise_db, double until = 3.0) {
  const double onset = db(partials(x, hz, kRate, 0.0, 0.03).high);
  double best = onset;
  *at = 0.0;
  for (double t = 0.05; t <= until; t += 0.05) {
    const double level = db(partials(x, hz, kRate, t, 0.1).high);
    if (level > best) {
      best = level;
      *at = t;
    }
  }
  *rise_db = best - onset;
}

static void test_string() {
  const float contact = default_contact();

  // Delayed bloom: on a tanpura the upper partials are not loudest at the
  // pluck. They open over the first second. A plain string's are loudest at
  // the pluck and only fall.
  {
    double at = 0.0, rise = 0.0;
    bloom(pluck_string(kC3, contact, 1.0f, 4.0f), kC3, &at, &rise);
    std::printf("string: harmonics 10 to 30 are loudest %.2f s after the pluck, %.1f dB over the onset\n", at, rise);
    EXPECT(at >= 0.05 && at <= 1.5, "the upper partials bloom between 50 ms and 1.5 s after the pluck");
    EXPECT(rise > 6.0, "the bloom stands at least 6 dB over the onset");
    bloom(pluck_string(kC3, 0.0f, 1.0f, 4.0f), kC3, &at, &rise);
    EXPECT(at == 0.0, "with Jawari at zero the upper partials are loudest at the pluck");

    // The knob: the bloom grows all the way along it.
    double last = -1.0;
    bool grows = true;
    std::printf("string: bloom by Jawari setting:");
    for (float knob : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      bloom(pluck_string(kC3, Tanpura::contact_for(knob), 1.0f, 4.0f), kC3, &at, &rise);
      std::printf(" %.2f: %+.1f dB", knob, rise);
      if (knob > 0.0f && rise <= last) grows = false;
      last = rise;
    }
    std::printf("\n");
    EXPECT(grows, "more Jawari is more bloom over the whole knob");
  }

  // Raman's test: a string plucked in its middle has no second harmonic,
  // unless it sits on a jawari, which puts back what the pluck left out.
  {
    const Partials plain = partials(pluck_string(kC3, 0.0f, 1.0f, 1.0f), kC3, kRate, 0.3, 0.1);
    const Partials buzzing = partials(pluck_string(kC3, contact, 1.0f, 1.0f), kC3, kRate, 0.3, 0.1);
    const double missing = db(plain.level[2]) - db(plain.level[1]);
    const double restored = db(buzzing.level[2]) - db(buzzing.level[1]);
    std::printf("string: harmonic 2 against harmonic 1 at 300 ms: %.1f dB plain, %.1f dB on the jawari\n", missing,
                restored);
    EXPECT(missing < -25.0, "a plain string plucked in the middle has no second harmonic");
    EXPECT(restored > -15.0, "the jawari puts the second harmonic back");
  }

  // Level dependence: the bridge is a contact, so a softer pluck buzzes for
  // a shorter time. A second after the pluck the soft one has far less of
  // the upper band against its lower partials; a plain string does not care.
  {
    double difference[2];
    int which = 0;
    for (float touch : {contact, 0.0f}) {
      const Partials loud = partials(pluck_string(kC3, touch, 1.0f, 2.0f), kC3, kRate, 1.0, 0.2);
      const Partials soft = partials(pluck_string(kC3, touch, 0.251f, 2.0f), kC3, kRate, 1.0, 0.2);
      difference[which++] = (db(loud.high) - db(loud.low)) - (db(soft.high) - db(soft.low));
    }
    std::printf("string: a pluck 12 dB softer has %.1f dB less upper band at 1 s on the jawari, %.2f dB plain\n",
                difference[0], difference[1]);
    EXPECT(difference[0] > 6.0, "on the jawari a softer pluck is duller, not just quieter");
    EXPECT(std::fabs(difference[1]) < 1.0, "a plain string keeps its balance at any level");
  }

  // The moving band: the overtones the bridge opens slide down as the string
  // rings. The research asked for an octave of centroid movement; this
  // string does about three quarters of one (see the device's origin note),
  // and its strongest upper partial moves from above the tenth to under the
  // ninth.
  {
    const std::vector<float> x = pluck_string(kC3, contact, 1.0f, 5.0f);
    double highest = 0.0, when = 0.0;
    int early_strongest = 0;
    for (double t = 0.1; t <= 1.5; t += 0.1) {
      const Partials now = partials(x, kC3, kRate, t, 0.1);
      if (now.centroid > highest) {
        highest = now.centroid;
        when = t;
        early_strongest = now.strongest;
      }
    }
    const Partials late = partials(x, kC3, kRate, 4.0, 0.1);
    std::printf("string: centroid above the fifth harmonic falls %.2f octaves from %.1f s to 4 s; strongest upper "
                "partial %d then %d\n",
                highest - late.centroid, when, early_strongest, late.strongest);
    EXPECT(highest - late.centroid > 0.6, "the band of overtones slides down by over half an octave");
    EXPECT(early_strongest >= 10 && late.strongest <= 9, "its strongest partial moves from above the tenth to under the ninth");

    const std::vector<float> plain = pluck_string(kC3, 0.0f, 1.0f, 5.0f);
    double plain_highest = 0.0;
    for (double t = 0.1; t <= 1.5; t += 0.1) plain_highest = std::max(plain_highest, partials(plain, kC3, kRate, t, 0.1).centroid);
    EXPECT(plain_highest - partials(plain, kC3, kRate, 4.0, 0.1).centroid < 0.35, "a plain string has no such slide");
  }

  // Pitch: the bridge shortens the string while it touches, so the note
  // starts a few cents sharp and settles. Every string a key from C2 to C6
  // needs, at three sample rates, at full contact.
  {
    double worst_late = 0.0, worst_early = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (double hz : {32.7032, 49.0548, 65.4064, 98.1096, 130.8128, 261.6256, 523.2511, 784.8767, 1046.5023}) {
        if (rate != kRate && hz != 32.7032 && hz != 130.8128 && hz != 1046.5023) continue;
        const std::vector<float> x = pluck_string(hz, 1.0f, 1.0f, 3.0f, rate);
        const size_t half = static_cast<size_t>(1.5 * rate);
        const double late = cents(partial_near(x, hz, rate, half, x.size()), hz);
        if (std::fabs(late) > std::fabs(worst_late)) worst_late = late;
        const double window = hz < 90.0 ? 0.5 : 0.25;
        for (double t = 0.05; t + window <= 1.5; t += window) {
          const double early = cents(partial_near(x, hz, rate, static_cast<size_t>(t * rate),
                                                  static_cast<size_t>((t + window) * rate)),
                                     hz);
          if (std::fabs(early) > std::fabs(worst_early)) worst_early = early;
        }
      }
    }
    std::printf("string: pitch off by at most %+.2f cents in the last half of a note, %+.1f cents before\n", worst_late,
                worst_early);
    EXPECT(std::fabs(worst_late) < 3.0, "a string is within 3 cents over the last half of its note");
    EXPECT(std::fabs(worst_early) < 10.0, "and within 10 cents all through it");
  }

  // The bridge is passive: at full contact and the longest ring the string
  // only ever falls.
  {
    const std::vector<float> x = pluck_string(kC3, 1.0f, 1.0f, 60.0f, kRate, 30.0f);
    double worst_rise = -100.0, worst_mean = 0.0;
    double before = db(rms(x, 48000, 96000));
    for (int s = 2; s < 60; ++s) {
      const double now = db(rms(x, s * 48000, (s + 1) * 48000));
      worst_rise = std::max(worst_rise, now - before);
      before = now;
      // A Hann-weighted mean: a plain one over a second that is not a whole
      // number of periods reads the note itself as DC.
      worst_mean = std::max(worst_mean, 0.5 * tone_level(x, 0.0, kRate, s * 48000, (s + 1) * 48000));
    }
    std::printf("string: over 60 s at full contact the level changes by at most %+.2f dB a second; DC %.1f dB\n",
                worst_rise, db(worst_mean));
    EXPECT(worst_rise < 0.0, "the string never grows");
    EXPECT(db(worst_mean) < -60.0, "and leaves no DC");
  }

  // Fold-back: the contact is a nonlinearity inside a loop. On the highest
  // strings, at full contact, what lies between the partials stays 50 dB
  // under the strongest of them.
  {
    double worst = -200.0;
    for (double hz : {1046.5023, 1567.98, 2093.0045}) {
      const std::vector<float> x = pluck_string(hz, 1.0f, 1.0f, 1.0f);
      for (double t : {0.02, 0.1, 0.3}) {
        const size_t from = static_cast<size_t>(t * kRate);
        const Stretch stretch(x, kRate, from, from + static_cast<size_t>(0.2 * kRate));
        const double f0 = stretch.partial_near(hz);
        double strongest = 0.0;
        std::vector<double> at = {0.0};
        for (int n = 1; n * f0 < 0.42 * kRate; ++n) {
          at.push_back(stretch.partial_near(n * f0, 15.0));
          strongest = std::max(strongest, stretch.level(at.back()));
        }
        for (size_t k = 0; k + 1 < at.size(); ++k) {
          for (double share : {0.3, 0.4, 0.5, 0.6, 0.7}) {
            const double between = at[k] + share * (at[k + 1] - at[k]);
            worst = std::max(worst, db(stretch.level(between)) - db(strongest));
          }
        }
      }
    }
    std::printf("string: between the partials of the highest strings, at most %.1f dB against the strongest\n", worst);
    EXPECT(worst < -50.0, "what the bridge folds back stays 50 dB under the note");
  }
}

// --- the instrument -----------------------------------------------------------------------

// Times at which the level jumps: the plucks. For plain strings with a short
// ring, so every pluck stands well over what is left of the others.
static std::vector<double> onsets(const std::vector<float>& x, double rate) {
  std::vector<double> times;
  const size_t hop = static_cast<size_t>(0.001 * rate), window = static_cast<size_t>(0.008 * rate);
  const size_t before = static_cast<size_t>(0.04 * rate);
  size_t quiet_until = 0;
  for (size_t i = 0; i + window < x.size(); i += hop) {
    if (i < quiet_until) continue;
    const double now = rms(x, i, i + window);
    const double then = i >= before ? rms(x, i - before, i) : 0.0;
    if (now > 1.0e-4 && now > 1.8 * then) {
      times.push_back(static_cast<double>(i) / rate);
      quiet_until = i + static_cast<size_t>(0.2 * rate);
    }
  }
  return times;
}

static void plain_strings(Tanpura& d) {
  d.set_param(p::kJawari, 0.0f);
  d.set_param(p::kBody, 0.0f);
  d.set_param(p::kDetune, 0.0f);
}

static void test_instrument() {
  // The four strings: Pa, Sa, Sa and the low Sa are 3 : 4 : 4 : 2, where 4
  // is the key; Ma and Ni move the first string only. Each is measured over
  // the second half of the time before the next pluck.
  {
    const double want[3][4] = {{0.75, 1.0, 1.0, 0.5}, {2.0 / 3.0, 1.0, 1.0, 0.5}, {15.0 / 16.0, 1.0, 1.0, 0.5}};
    double worst = 0.0;
    for (int tuning = 0; tuning < 3; ++tuning) {
      device.init(kRate);
      device.set_param(p::kTuning, static_cast<float>(tuning));
      device.set_param(p::kDetune, 0.0f);
      device.set_param(p::kSpeed, 6.0f);
      device.note_on(1, static_cast<float>(kC3), 0.8f);
      Stereo out = render(device, 6.2f, kRate);
      for (int k = 0; k < (tuning == 0 ? 4 : 1); ++k) {
        // Plucks fall every 1.5 s, give or take 3 %.
        const size_t from = static_cast<size_t>((1.5 * k + 0.75) * kRate), to = static_cast<size_t>((1.5 * k + 1.4) * kRate);
        // The second Sa is the one on the left.
        const std::vector<float>& side = k == 2 ? out.left : out.right;
        const double off = cents(partial_near(side, kC3 * want[tuning][k], kRate, from, to), kC3 * want[tuning][k]);
        if (std::fabs(off) > std::fabs(worst)) worst = off;
      }
    }
    std::printf("tanpura: the strings sit within %+.2f cents of 3 : 4 : 4 : 2 (and of the Ma and the Ni)\n", worst);
    EXPECT(std::fabs(worst) < 3.0, "Pa, Sa, Sa, low Sa are 3 : 4 : 4 : 2 within 3 cents; Ma is 8/3 and Ni 15/4");
  }

  // The whole instrument does what the lone string does: the first pluck of
  // a held key (its Pa string) blooms before the second pluck arrives.
  {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo out = render(device, 1.2f, kRate);
    double at = 0.0, rise = 0.0;
    bloom(out.left, 0.75 * kC3, &at, &rise, 1.0);
    std::printf("tanpura: the first pluck's upper partials are loudest %.2f s after it, %.1f dB over the onset\n", at, rise);
    EXPECT(at >= 0.05 && rise > 6.0, "a pluck of the instrument blooms after its onset");
  }

  // The round: four plucks take the time Speed says, and no two gaps are the
  // same, because a hand plucks them.
  {
    for (float speed : {2.0f, 5.0f, 12.0f}) {
      device.init(kRate);
      plain_strings(device);
      device.set_param(p::kSpeed, speed);
      device.set_param(p::kDecay, 3.0f);
      device.set_param(p::kSpread, 0.0f);  // every string as loud in the channel read
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 3.05f * speed, kRate);
      const std::vector<double> at = onsets(out.left, kRate);
      char label[128];
      std::snprintf(label, sizeof label, "Speed %g s: twelve plucks in three rounds (found %d)", speed,
                    static_cast<int>(at.size()));
      EXPECT(at.size() == 13 || at.size() == 12, label);
      if (at.size() < 12) continue;
      double widest = 0.0, cycle_off = 0.0;
      for (size_t i = 0; i + 1 < 12; ++i) widest = std::max(widest, std::fabs((at[i + 1] - at[i]) / (0.25 * speed) - 1.0));
      for (size_t i = 0; i + 4 < 12; ++i) cycle_off = std::max(cycle_off, std::fabs((at[i + 4] - at[i]) / speed - 1.0));
      std::printf("tanpura: Speed %g s: a round is off by at most %.1f %%, one gap by at most %.1f %%\n", speed,
                  100.0 * cycle_off, 100.0 * widest);
      EXPECT(cycle_off < 0.05, "a round of four plucks takes the Speed time within 5 %");
      EXPECT(widest > 0.01 && widest < 0.05, "the gaps between plucks vary by 1 to 5 %");
    }
  }

  // A string is plucked again, not piled onto itself: with the longest ring
  // and the fastest round the peak settles instead of climbing.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kSpeed, 2.0f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo out = render(device, 12.0f, kRate);
    const double first = std::max(peak(out.left, 0, 96000), peak(out.right, 0, 96000));
    const double later = std::max(peak(out.left, 96000), peak(out.right, 96000));
    std::printf("tanpura: plucking strings that still ring raises the peak by %.1f dB\n", db(later) - db(first));
    EXPECT(db(later) - db(first) < 3.0, "re-plucking a ringing string raises the peak by under 3 dB");
  }

  // A minute of the busiest drone, at full Jawari, the longest Decay and the
  // fastest round: it settles and stays, and carries no DC.
  {
    device.init(kRate);
    device.set_param(p::kJawari, 1.0f);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kSpeed, 2.0f);
    device.note_on(1, static_cast<float>(kC3), 1.0f);
    Stereo out = render(device, 60.0f, kRate);
    double first = 0.0, second = 0.0, offset = 0.0;
    for (int s = 0; s < 60; ++s) {
      const double level = rms(out.left, s * 48000, (s + 1) * 48000);
      if (s < 30) first = std::max(first, level);
      if (s >= 30) second = std::max(second, level);
      offset = std::max(offset, 0.5 * tone_level(out.left, 0.0, kRate, s * 48000, (s + 1) * 48000));
    }
    std::printf("tanpura: a minute at full Jawari: the loudest second of the last half is %+.2f dB against the first "
                "half's; DC %.1f dBFS\n",
                db(second) - db(first), db(offset));
    EXPECT(db(second) - db(first) < 1.0, "a held drone does not grow");
    EXPECT(db(offset) < -60.0, "and carries no DC");
  }

  // Level: one key sits where the library's instruments sit, and a full pool
  // stays under the soft clip's knee.
  {
    double one[2];
    int which = 0;
    for (float gain : {0.7f, 0.8f}) {
      device.init(kRate);
      device.note_on(1, 220.0f, gain);
      Stereo out = render(device, 7.0f, kRate);
      one[which++] = db(std::max(peak(out.left), peak(out.right)));
    }
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    Stereo out = render(device, 7.0f, kRate);
    const double ten = std::max(peak(out.left), peak(out.right));
    std::printf("tanpura: one key peaks at %.1f dBFS (gain 0.7) and %.1f dBFS (gain 0.8); ten keys at %.1f dBFS\n", one[0],
                one[1], db(ten));
    EXPECT(one[0] > -24.0 && one[0] < -10.0, "one key at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(one[1] > -22.0 && one[1] < -16.0, "one key at gain 0.8 peaks between -22 and -16 dBFS");
    EXPECT(ten < 0.5, "ten held keys stay under the soft clip's knee");
  }

  // A drone, not four notes: after the first round the level over any
  // quarter second stays within 10 dB of its mean.
  {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo out = render(device, 15.0f, kRate);
    double total = 0.0, lowest = 1.0e9;
    int count = 0;
    for (size_t from = 5 * 48000; from + 12000 <= out.left.size(); from += 6000) {
      const double level = db(rms(out.left, from, from + 12000));
      total += level;
      lowest = std::min(lowest, level);
      ++count;
    }
    const double average = total / count;
    std::printf("tanpura: over two rounds the level never falls more than %.1f dB under its mean\n", average - lowest);
    EXPECT(average - lowest < 10.0, "the drone never falls more than 10 dB under its mean level");
  }

  // Decay is the time a string's fundamental takes to fall 60 dB, measured
  // on the first string before the second pluck arrives.
  {
    for (float decay : {3.0f, 30.0f}) {
      device.init(kRate);
      plain_strings(device);
      device.set_param(p::kDecay, decay);
      device.set_param(p::kSpeed, 12.0f);
      device.note_on(1, static_cast<float>(kC3), 0.8f);
      Stereo out = render(device, 2.9f, kRate);
      const double pa = 0.75 * kC3;
      const double early = db(tone_level(out.left, pa, kRate, static_cast<size_t>(0.4 * kRate), static_cast<size_t>(0.9 * kRate)));
      const double late = db(tone_level(out.left, pa, kRate, static_cast<size_t>(2.4 * kRate), static_cast<size_t>(2.9 * kRate)));
      const double ring = 60.0 * 2.0 / (early - late);
      std::printf("tanpura: Decay %g s: the first string's fundamental rings %.1f s\n", decay, ring);
      EXPECT_NEAR(ring, decay, 0.1 * decay, "Decay is the ring time of a string's fundamental");
    }
  }

  // Body: the gourd lifts what falls on its resonances (the Pa string of C3
  // sits on the lowest) and takes the top off the bare strings.
  {
    double low[2], top[2];
    int which = 0;
    for (float body : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kBody, body);
      device.note_on(1, static_cast<float>(kC3), 0.8f);
      Stereo out = render(device, 1.2f, kRate);
      low[which] = db(tone_level(out.left, 0.75 * kC3, kRate, static_cast<size_t>(0.3 * kRate), static_cast<size_t>(1.2 * kRate)));
      top[which++] = energy_above(out.left, 1500.0, kRate);
    }
    std::printf("tanpura: Body 1 lifts the first string's fundamental by %.1f dB and leaves %.0f %% of the energy above "
                "1.5 kHz\n",
                low[1] - low[0], 100.0 * top[1] / top[0]);
    EXPECT(low[1] - low[0] > 1.5 && low[1] - low[0] < 6.0, "the gourd lifts a note on its resonance by a few dB");
    EXPECT(top[1] < 0.5 * top[0], "and takes the top off the bare strings");
  }

  // The two middle strings beat at the rate their Detune says.
  {
    device.init(kRate);
    plain_strings(device);
    device.set_param(p::kDetune, 8.0f);
    device.set_param(p::kDecay, 30.0f);
    device.set_param(p::kSpeed, 12.0f);
    device.set_param(p::kSpread, 0.0f);
    const double key = 523.2511;
    device.note_on(1, static_cast<float>(key), 0.8f);
    Stereo out = render(device, 9.0f, kRate);
    // Both ring from the third pluck at 6 s to the fourth at 9 s.
    std::vector<float> envelope;
    for (size_t from = static_cast<size_t>(6.3 * kRate); from + 1920 <= static_cast<size_t>(8.6 * kRate); from += 480) {
      envelope.push_back(static_cast<float>(tone_level(out.left, key, kRate, from, from + 1920)));
    }
    const double average = mean(envelope);
    for (float& v : envelope) v -= static_cast<float>(average);
    const double beat = dominant_frequency(envelope, 100.0, 0.8, 6.0);
    const double want = key * (std::pow(2.0, 8.0 / 1200.0) - 1.0);
    std::printf("tanpura: at 8 cents the middle strings beat at %.2f Hz (%.2f Hz by the cents)\n", beat, want);
    EXPECT_NEAR(beat, want, 0.25, "Detune sets the beat between the two middle strings");
  }

  // Stereo: Spread at zero is mono; at one the strings are apart but the two
  // channels never cancel.
  {
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo mono = render(device, 6.0f, kRate);
    EXPECT(mono.left == mono.right, "Spread at zero is exactly mono");

    device.init(kRate);
    device.set_param(p::kSpread, 1.0f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo wide = render(device, 6.0f, kRate);
    std::vector<float> mid(wide.left.size()), side(wide.left.size());
    for (size_t i = 0; i < mid.size(); ++i) {
      mid[i] = 0.5f * (wide.left[i] + wide.right[i]);
      side[i] = 0.5f * (wide.left[i] - wide.right[i]);
    }
    const double together = correlation(wide.left, wide.right);
    std::printf("tanpura: Spread 1: left and right correlate %.2f, side is %.1f dB under mid\n", together,
                db(rms(side)) - db(rms(mid)));
    EXPECT(together < 0.9 && together > 0.0, "Spread at one sets the strings apart");
    EXPECT(rms(mid) > rms(side), "and the sum of the channels never cancels");
    // The sum is the same at any Spread.
    double worst = 0.0;
    for (size_t i = 0; i < mid.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(mid[i]) - mono.left[i]));
    EXPECT(worst < 1.0e-5, "the mono sum does not change with Spread");
  }

  // Block sizes: the same audio from one-sample blocks, 128 and ragged ones.
  {
    Stereo reference;
    double worst = 0.0;
    for (int pass = 0; pass < 3; ++pass) {
      device.init(kRate);
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 330.0f, 0.6f);
      Stereo out;
      if (pass == 0) {
        reference = render(device, 3.0f, kRate, 128);
        continue;
      }
      if (pass == 1) {
        out = render(device, 3.0f, kRate, 1);
      } else {
        const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
        const size_t total = reference.left.size();
        out.left.resize(total);
        out.right.resize(total);
        size_t done = 0;
        int which = 0;
        while (done < total) {
          const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), total - done));
          device.process(frames);
          for (int i = 0; i < frames; ++i) {
            out.left[done + i] = device.out_left()[i];
            out.right[done + i] = device.out_right()[i];
          }
          done += frames;
        }
      }
      for (size_t i = 0; i < reference.left.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
      }
    }
    EXPECT(worst == 0.0, "the output does not depend on the block size");
  }

  // No clicks. The yardstick is the largest step the drone makes by itself.
  {
    // A key released: the strings are damped, not cut.
    device.init(kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo before = render(device, 3.0f, kRate);
    device.note_off(1);
    Stereo after = render(device, 0.1f, kRate);
    const double own = max_step(before.left, 48000);
    std::printf("tanpura: largest step: %.5f playing, %.5f on release", own, max_step(after.left));
    EXPECT(max_step(after.left) < 1.2 * own, "releasing a key makes no click");

    // The same key struck again: a finger, then a pluck.
    device.init(kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    render(device, 3.0f, kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo again = render(device, 0.3f, kRate);
    std::printf(", %.5f struck again", max_step(again.left));
    EXPECT(max_step(again.left) < 1.5 * own, "striking a held key again makes no click");

    // Jawari thrown from end to end while the strings ring, against the
    // same half second with the knob left at its buzziest.
    double steady = 0.0;
    for (float amount : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kJawari, amount);
      device.note_on(1, static_cast<float>(kC3), 0.8f);
      render(device, 0.4f, kRate);
      Stereo out = render(device, 0.5f, kRate);
      steady = std::max(steady, max_step(out.left));
    }
    device.init(kRate);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    render(device, 0.4f, kRate);
    Stereo swept;
    for (int step = 0; step < 10; ++step) {
      device.set_param(p::kJawari, step % 2 == 0 ? 0.0f : 1.0f);
      swept = concat(swept, render(device, 0.05f, kRate));
    }
    std::printf(", %.5f against %.5f with Jawari thrown about", max_step(swept.left), steady);
    EXPECT(max_step(swept.left) < 1.2 * steady, "moving Jawari makes no click");

    // A stolen voice fades over 2 ms before the new key takes it.
    device.init(kRate);
    for (int n = 0; n < Tanpura::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo full = render(device, 2.0f, kRate);
    device.note_on(99, 196.0f, 0.8f);
    Stereo stolen = render(device, 0.004f, kRate);
    std::printf(", %.5f against %.5f when a voice is stolen\n", max_step(stolen.left), max_step(full.left, 48000));
    EXPECT(max_step(stolen.left) < 1.5 * max_step(full.left, 48000), "stealing a voice makes no click");
  }

  // Keys. One struck again keeps its tanpura and starts the round over on
  // the first string, a moment later. One that takes a voice from a full pool
  // sounds; released before the old voice has faded, it never does.
  {
    device.init(kRate);
    plain_strings(device);
    device.set_param(p::kDecay, 3.0f);
    device.set_param(p::kSpeed, 8.0f);
    device.set_param(p::kSpread, 0.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo before = render(device, 2.9f, kRate);  // plucks at 0 s (330 Hz) and 2 s (440 Hz)
    device.note_on(1, 440.0f, 0.8f);
    Stereo again = render(device, 3.0f, kRate);
    const auto level = [&](const Stereo& of, double hz, double from, double to) {
      return db(tone_level(of.left, hz, kRate, static_cast<size_t>(from * kRate), static_cast<size_t>(to * kRate)));
    };
    const double first = level(again, 330.0, 0.1, 0.6) - level(before, 330.0, 2.4, 2.9);
    // Left alone the round would have plucked a 440 Hz string 1.1 s on.
    const double waited = level(again, 440.0, 1.4, 1.9) - level(again, 440.0, 0.1, 0.6);
    const double second = level(again, 440.0, 2.2, 2.7) - level(again, 440.0, 1.4, 1.9);
    std::printf("tanpura: a key struck again: its first string comes up %.1f dB at once, the second moves %+.1f dB until "
                "its turn and then comes up %.1f dB\n",
                first, waited, second);
    EXPECT(first > 20.0, "a key struck again plucks its first string again");
    EXPECT(waited < 0.0 && second > 20.0, "and the round starts over from there");

    double heard[3];
    for (int mode = 0; mode < 3; ++mode) {
      device.init(kRate);
      plain_strings(device);
      for (int n = 0; n < Tanpura::kMaxVoices; ++n) device.note_on(n, 880.0f * std::pow(2.0f, n / 12.0f), 0.8f);
      render(device, 2.0f, kRate);
      if (mode > 0) device.note_on(99, 100.0f, 0.8f);  // its first string is at 75 Hz, under all the others
      if (mode == 2) device.note_off(99);
      Stereo out = render(device, 0.5f, kRate);
      heard[mode] = db(tone_level(out.left, 75.0, kRate, 4800, 24000));
    }
    std::printf("tanpura: a ninth key's first string: %.1f dB without it, %.1f dB held, %.1f dB released at once\n",
                heard[0], heard[1], heard[2]);
    EXPECT(heard[1] > -40.0, "a key over a full pool takes a voice and sounds");
    EXPECT(heard[2] < heard[0] + 6.0, "a key released before its stolen voice has faded never sounds");
  }

  // Released, the strings ring out in a few seconds and the device sleeps.
  {
    device.init(kRate);
    device.set_param(p::kDecay, 30.0f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo held = render(device, 3.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 8.0f, kRate);
    const double ring = rt60(tail.left, kRate, 0.2);
    Stereo after = render(device, 0.5f, kRate);
    std::printf("tanpura: with a 30 s Decay a released key rings %.1f s\n", ring);
    EXPECT(ring > 1.5 && ring < 4.5, "a released key rings out in a few seconds whatever the Decay");
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and then the device is exactly silent");
  }
}

int main() {
  Conformance spec;
  spec.name = "tanpura";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_string();
  test_instrument();

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < Tanpura::kMaxVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  char label[64];
  std::snprintf(label, sizeof label, "tanpura (%d keys, %d strings)", Tanpura::kMaxVoices,
                Tanpura::kMaxVoices * Tanpura::kStrings);
  report_cost(label, 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("tanpura");
}
