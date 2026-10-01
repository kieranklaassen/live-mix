// Native harness for Bells (cpp/devices/modal-bells). The conformance pass
// covers silence, voice stealing, parameter abuse and other sample rates;
// the rest asserts what makes it a bank of modes: partials at the table's
// ratios, the decay and damping laws, the mallet, the strike point, the
// doublets' beating, the rubbed sustain and the choke.

#include "../devices/modal-bells/modal_bells.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ModalBells;
namespace p = livemix::modal_bells;

static ModalBells device;

static const float kRate = 48000.0f;

// One plain note: no doublet split, everything in the middle, unity volume.
static void plain(ModalBells& d, int material, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMaterial, static_cast<float>(material));
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kPosition, 0.0f);
  d.set_param(p::kRelease, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

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

// The frequency of the strongest component within `reach` (a share) of
// `guess`, to a small fraction of a cent: scan, then narrow the span as the
// window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to,
                         double reach = 0.04) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * reach;
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
  const double a = bin_level(x, rate, hz, static_cast<size_t>(t0 * rate), n);
  const double b = bin_level(x, rate, hz, static_cast<size_t>(t1 * rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

int main() {
  Conformance spec;
  spec.name = "modal-bells";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A released bowl rings 8.9 s to -60 dB at the defaults and is retired at
  // -120 dB, so a loud pile needs just over twice that.
  spec.tail_seconds = 20.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[200];

  // The partials are where the tables say, for every material: the strongest
  // component near each expected mode is within 2 cents of it.
  {
    struct Expect {
      int material;
      const char* name;
      int count;
      double ratios[8];
    };
    const Expect expects[] = {
        {ModalBells::kBell, "church bell", 8, {0.5, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0}},
        {ModalBells::kBowl, "singing bowl", 6, {1.0, 2.77, 5.17, 8.14, 11.64, 15.6}},
        {ModalBells::kVibraphone, "vibraphone", 5, {1.0, 4.0, 10.0, 18.2, 28.4}},
        {ModalBells::kBar, "bar", 7, {1.0, 2.757, 5.404, 8.933, 13.345, 18.64, 24.81}},
        {ModalBells::kKalimba, "kalimba", 5, {1.0, 6.263, 17.54, 34.37, 56.82}},
        {ModalBells::kGlass, "glass", 5, {1.0, 2.32, 4.25, 6.63, 9.38}},
        {ModalBells::kGong, "gong", 8, {1.0, 1.73, 2.33, 3.91, 4.11, 6.30, 6.71, 7.34}},
    };
    for (const Expect& expect : expects) {
      plain(device, expect.material);
      device.set_param(p::kHardness, 1.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kDecay, 20.0f);
      const double f0 = 220.0;
      device.note_on(1, static_cast<float>(f0), 0.9f);
      Stereo out = render(device, 3.0f, kRate);
      const size_t from = 4800, to = out.left.size();
      double worst = 0.0;
      bool present = true;
      for (int m = 0; m < expect.count; ++m) {
        const double hz = f0 * expect.ratios[m];
        const double found = fine_pitch(out.left, kRate, hz, from, to, 0.01);  // 17 cents either way
        worst = std::max(worst, std::fabs(cents(found, hz)));
        // A real partial, not the skirt of a neighbour: it stands 20 dB
        // above the level a quarter tone to either side.
        const double here = bin_level(out.left, kRate, found, from, to - from);
        const double beside = std::max(bin_level(out.left, kRate, found * 1.03, from, to - from),
                                       bin_level(out.left, kRate, found / 1.03, from, to - from));
        present = present && here > 10.0 * beside;
      }
      std::printf("%s: %d partials, worst %.2f cents from the table\n", expect.name, expect.count, worst);
      std::snprintf(label, sizeof label, "%s: partials within 2 cents of the table's ratios", expect.name);
      EXPECT(worst < 2.0, label);
      std::snprintf(label, sizeof label, "%s: every listed partial is there", expect.name);
      EXPECT(present, label);
    }
  }

  // Tuning across the keyboard and the sample rates, and nothing above the
  // top of the band: a high note keeps only the modes that fit.
  {
    double worst = 0.0;
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (float rate : rates) {
      for (double hz : {27.5, 110.0, 880.0, 3520.0}) {
        plain(device, ModalBells::kBowl, rate);
        device.set_param(p::kDecay, 20.0f);
        device.note_on(1, static_cast<float>(hz), 0.9f);
        Stereo out = render(device, 3.0f, rate);
        const double found = fine_pitch(out.left, rate, hz, 4800, out.left.size(), 0.01);
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
    std::printf("fundamental from 27.5 to 3520 Hz at three rates: worst %.3f cents\n", worst);
    EXPECT(worst < 1.0, "the fundamental is within a cent at every pitch and rate");

    plain(device, ModalBells::kKalimba);
    device.set_param(p::kHardness, 1.0f);
    device.set_param(p::kBrightness, 1.0f);
    device.note_on(1, 4000.0f, 1.0f);  // modes at 4, 25, 70, 137 and 227 kHz
    Stereo out = render(device, 1.0f, kRate);
    // 25 kHz would fold to 22.9 kHz and 70 kHz to 22 kHz: anything but the
    // fundamental in the ringing part is an alias.
    const double kept = bin_level(out.left, kRate, 4000.0, 4800, 24000);
    const double all = rms(out.left, 4800, 28800) * std::sqrt(2.0);
    const double early = bin_level(out.left, kRate, 4000.0, 4800, 2400);
    std::printf("kalimba at 4 kHz: fundamental %.1f dB, %.3f of everything that rings\n", db(early), kept / all);
    EXPECT(finite(out.left) && early > 0.01, "a note whose upper modes are out of band still sounds");
    EXPECT(std::fabs(all / kept - 1.0) < 0.05, "and they are dropped, not aliased: only the fundamental rings");
  }

  // Decay is the fundamental's ring time; Damping makes the upper modes die
  // faster by the stated law (rate grows with the frequency ratio, 0.02 per
  // unit for metal, 2 per unit for wood).
  {
    for (float seconds : {1.0f, 8.0f}) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kDecay, seconds);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 0.2f + seconds, kRate);
      const double ring = ring_time(out.left, kRate, 220.0, 0.05, 0.1 + 0.4 * seconds, 0.1);
      std::snprintf(label, sizeof label, "decay %.0f s: the fundamental rings %.2f s", seconds, ring);
      std::printf("%s\n", label);
      EXPECT(std::fabs(ring / seconds - 1.0) < 0.03, label);
    }
    double upper[2], lowest[2];
    for (int which = 0; which < 2; ++which) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kHardness, 1.0f);
      device.set_param(p::kDamping, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 2.5f, kRate);
      lowest[which] = ring_time(out.left, kRate, 220.0, 0.05, 2.0, 0.1);
      upper[which] = ring_time(out.left, kRate, 220.0 * 5.404, 0.03, which == 0 ? 2.0 : 0.2, 0.05);
    }
    std::printf("bar, decay 4 s: mode 3 rings %.2f s as metal, %.2f s as wood; fundamental %.2f and %.2f s\n", upper[0],
                upper[1], lowest[0], lowest[1]);
    EXPECT(std::fabs(lowest[0] - 4.0) < 0.12 && std::fabs(lowest[1] - 4.0) < 0.12, "damping leaves the fundamental's decay alone");
    EXPECT(std::fabs(upper[0] / (4.0 / (1.0 + 0.02 * 4.404)) - 1.0) < 0.04, "undamped, mode 3 rings nearly as long");
    EXPECT(std::fabs(upper[1] / (4.0 / (1.0 + 2.0 * 4.404)) - 1.0) < 0.06, "damped, it is gone in a tenth of the time");
  }

  // Hardness: a soft mallet lights little but the fundamental, a hard one
  // the whole bar; hitting harder is also hitting brighter.
  {
    double high[4], low[4];
    const float hardness[4] = {0.0f, 0.5f, 1.0f, 0.5f};
    const float velocity[4] = {0.8f, 0.8f, 0.8f, 0.2f};
    for (int which = 0; which < 4; ++which) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, hardness[which]);
      device.set_param(p::kDamping, 0.0f);
      device.note_on(1, 220.0f, velocity[which]);
      Stereo out = render(device, 1.0f, kRate);
      low[which] = bin_level(out.left, kRate, 220.0, 2400, 24000);
      double sum = 0.0;
      for (double ratio : {5.404, 8.933, 13.345, 18.64}) {
        const double level = bin_level(out.left, kRate, 220.0 * ratio, 2400, 24000);
        sum += level * level;
      }
      high[which] = std::sqrt(sum);
    }
    std::printf("bar modes 3 to 6 re the fundamental: soft %.0f dB, medium %.0f dB, hard %.0f dB; medium played softly %.0f dB\n",
                db(high[0] / low[0]), db(high[1] / low[1]), db(high[2] / low[2]), db(high[3] / low[3]));
    EXPECT(high[0] / low[0] < 0.03, "a soft mallet: upper modes 30 dB under the fundamental");
    EXPECT(high[1] / low[1] > 3.0 * high[0] / low[0] && high[2] / low[2] > 3.0 * high[1] / low[1], "each step harder is 10 dB brighter or more");
    EXPECT(high[2] / low[2] > 0.4, "a hard one rings the whole bar");
    EXPECT(high[3] / low[3] < 0.7 * high[1] / low[1], "a soft stroke is duller than a hard one with the same mallet");
    EXPECT(low[1] > 3.0 * low[3], "and quieter");
    EXPECT(std::fabs(low[0] / low[2] - 1.0) < 0.6, "the fundamental's level is about the same whatever the mallet");
  }

  // Position: a mode struck on its node does not sound. A bar hit dead
  // centre loses its even modes; hit a third of the way in (p = 1/3), where
  // this model's first mode has its node, it loses the fundamental.
  {
    double level[3][4];
    const float position[3] = {0.0f, 1.0f, 1.0f / 3.0f};
    for (int which = 0; which < 3; ++which) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, 0.9f);
      device.set_param(p::kPosition, position[which]);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      int m = 0;
      for (double ratio : {1.0, 2.757, 5.404, 8.933}) level[which][m++] = bin_level(out.left, kRate, 220.0 * ratio, 2400, 24000);
    }
    std::printf("bar modes 1 to 4: end %.0f %.0f %.0f %.0f dB; centre %.0f %.0f %.0f %.0f dB; at the node of mode 1 %.0f %.0f %.0f %.0f dB\n",
                db(level[0][0]), db(level[0][1]), db(level[0][2]), db(level[0][3]), db(level[1][0]), db(level[1][1]),
                db(level[1][2]), db(level[1][3]), db(level[2][0]), db(level[2][1]), db(level[2][2]), db(level[2][3]));
    EXPECT(level[1][1] < 0.003 * level[0][1] && level[1][3] < 0.003 * level[0][3], "struck in the centre the even modes are 50 dB down");
    EXPECT(level[1][0] > level[0][0] && level[1][2] > level[0][2], "and the odd ones at their strongest");
    EXPECT(level[2][0] < 0.003 * level[0][0], "struck on the first mode's node the fundamental is gone");
    EXPECT(level[2][1] > 0.5 * level[0][1], "while the second mode still rings");
  }

  // Detune splits each doublet by a number of hertz, so the bowl beats at
  // that rate whatever the pitch: the fundamental's pair at Detune itself,
  // the second pair 1.6 times faster. With no split nothing beats.
  {
    double rate_low[2], rate_high[2], swing[2];
    const float pitch[2] = {200.0f, 400.0f};
    for (int which = 0; which < 2; ++which) {
      plain(device, ModalBells::kBowl);
      device.set_param(p::kDecay, 40.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kHardness, 0.8f);
      device.set_param(p::kDetune, 2.0f);
      device.note_on(1, pitch[which], 0.8f);
      Stereo out = render(device, 8.0f, kRate);
      std::vector<float> low, high;
      for (size_t from = 4800; from + 2400 <= out.left.size(); from += 480) {
        const double undo = std::exp(6.907755 * (from / kRate) / 40.0);  // take the decay out
        low.push_back(static_cast<float>(bin_level(out.left, kRate, pitch[which], from, 2400) * undo));
        high.push_back(static_cast<float>(bin_level(out.left, kRate, pitch[which] * 2.77, from, 2400) * undo));
      }
      swing[which] = *std::max_element(low.begin(), low.end()) / *std::min_element(low.begin(), low.end());
      const double mean_low = mean(low), mean_high = mean(high);
      for (float& v : low) v -= static_cast<float>(mean_low);
      for (float& v : high) v -= static_cast<float>(mean_high);
      rate_low[which] = dominant_frequency(low, 100.0, 0.5, 10.0);
      rate_high[which] = dominant_frequency(high, 100.0, 0.5, 10.0);
    }
    plain(device, ModalBells::kBowl);
    device.set_param(p::kDecay, 40.0f);
    device.set_param(p::kDamping, 0.0f);
    device.note_on(1, 200.0f, 0.8f);
    Stereo still = render(device, 4.0f, kRate);
    std::vector<float> flat;
    for (size_t from = 4800; from + 2400 <= still.left.size(); from += 480) {
      flat.push_back(static_cast<float>(bin_level(still.left, kRate, 200.0, from, 2400) *
                                        std::exp(6.907755 * (from / kRate) / 40.0)));  // take the decay out
    }
    const double steady = *std::max_element(flat.begin(), flat.end()) / *std::min_element(flat.begin(), flat.end());
    std::printf("bowl, detune 2 Hz: fundamental beats at %.2f Hz (200 Hz note) and %.2f Hz (400 Hz), second pair at %.2f Hz; level swings %.1fx, %.3fx with no detune\n",
                rate_low[0], rate_low[1], rate_high[0], swing[0], steady);
    EXPECT(std::fabs(rate_low[0] - 2.0) < 0.05 && std::fabs(rate_low[1] - 2.0) < 0.05, "the fundamental's doublet beats at Detune, at any pitch");
    EXPECT(std::fabs(rate_high[0] - 3.2) < 0.08, "the second pair is split 1.6 times wider");
    EXPECT(swing[0] > 3.0 && swing[0] < 8.0, "a beat, not a tremolo: the halves are unequal (0.6 and 0.4)");
    EXPECT(steady < 1.01, "no split, no beating");
  }

  // Sustain: rubbing holds the low modes at a level for as long as the key
  // is down, with the mallet all but gone, and the note rings out after.
  {
    plain(device, ModalBells::kBowl);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kDecay, 3.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 12.0f, kRate);
    device.note_off(1);
    Stereo after = render(device, 4.0f, kRate);
    const double early = rms(held.left, 0, 2400), at2 = rms(held.left, 96000, 144000), at6 = rms(held.left, 288000, 336000),
                 at11 = rms(held.left, 528000, 576000);
    std::printf("rubbed bowl: rms %.4f in the first 50 ms, %.4f at 2 s, %.4f at 6 s, %.4f at 11 s; rings %.2f s after the key\n",
                early, at2, at6, at11, ring_time(after.left, kRate, 220.0, 0.1, 2.0, 0.1));
    const double rising = rms(held.left, 12000, 16800);  // 0.25 to 0.35 s
    EXPECT(early < 0.2 * at6 && rising > 0.4 * at6 && rising < 0.85 * at6,
           "a rubbed note blooms over a few tenths of a second instead of being struck");
    EXPECT(std::fabs(at2 / at6 - 1.0) < 0.02 && std::fabs(at11 / at6 - 1.0) < 0.01, "and holds its level for as long as the key is down, far past Decay");
    EXPECT(std::fabs(ring_time(after.left, kRate, 220.0, 0.1, 2.0, 0.1) / 3.0 - 1.0) < 0.04, "released, it rings out at Decay");
    EXPECT(rms(after.left, 168000, 192000) < 0.01 * at6, "to nothing");
    const double second = bin_level(held.left, kRate, 220.0 * 2.77, 288000, 48000);
    const double first = bin_level(held.left, kRate, 220.0, 288000, 48000);
    const double fourth = bin_level(held.left, kRate, 220.0 * 8.14, 288000, 48000);
    EXPECT(second > 0.15 * first && second < 0.6 * first, "the second mode sings along more quietly");
    EXPECT(fourth < 0.001 * first, "the upper modes are not rubbed");

    // Half sustain: struck, and then held where the rub can keep it.
    double level[3];
    const float sustain[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      plain(device, ModalBells::kBowl);
      device.set_param(p::kSustain, sustain[which]);
      device.set_param(p::kDecay, 2.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 8.0f, kRate);
      level[which] = rms(out.left, 336000, 384000);
    }
    std::printf("held 7 s at decay 2 s: sustain 0 %.1f dB, 0.5 %.1f dB, 1 %.1f dB\n", db(level[0]), db(level[1]), db(level[2]));
    EXPECT(level[0] < 0.001 * level[2], "without sustain the note has decayed 70 dB");
    EXPECT(std::fabs(level[1] / level[2] - 0.5) < 0.05, "the held level follows Sustain");
  }

  // Release: 0 lets a released key ring on like a bell, 1 chokes it like a
  // damper on a bar, and in between it sets how long the note may ring.
  {
    double tail[3], ring[3];
    const float release[3] = {0.0f, 1.0f, 0.5f};
    Stereo choked;
    for (int which = 0; which < 3; ++which) {
      plain(device, ModalBells::kBell);
      device.set_param(p::kRelease, release[which]);
      device.set_param(p::kDecay, 10.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo held = render(device, 0.5f, kRate);
      device.note_off(1);
      Stereo after = render(device, 3.0f, kRate);
      tail[which] = rms(after.left, 4800, 9600) / rms(held.left, 19200, 24000);  // 0.1 to 0.2 s after the key
      ring[which] = ring_time(after.left, kRate, 110.0, 0.02, which == 1 ? 0.07 : 1.5, 0.05);
      if (which == 1) choked = after;
    }
    std::printf("bell released: release 0 rings %.2f s (hum), release 1 %.3f s, release 0.5 %.2f s; level 0.1 s after the key %.1f, %.1f, %.1f dB\n",
                ring[0], ring[1], ring[2], db(tail[0]), db(tail[1]), db(tail[2]));
    EXPECT(std::fabs(ring[0] / 10.0 - 1.0) < 0.05, "release 0: the hum rings on at Decay");
    EXPECT(tail[0] > 0.5, "and the bell is still there");
    EXPECT(tail[1] < 0.001, "release 1: 60 dB down within 100 ms");
    EXPECT(std::fabs(ring[2] / 2.0 - 1.0) < 0.05, "release 0.5: 2 s");
    EXPECT(max_step(choked.left, 0, 4800) < 1.2 * max_step(choked.left, 0, 48), "the choke is a decay, not a cut");
    // A held key is not affected by Release.
    plain(device, ModalBells::kBell);
    device.set_param(p::kRelease, 1.0f);
    device.set_param(p::kDecay, 10.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 2.0f, kRate);
    EXPECT(std::fabs(ring_time(held.left, kRate, 110.0, 0.1, 1.8, 0.1) / 10.0 - 1.0) < 0.05, "while the key is down the bell rings whatever Release says");
  }

  // Stretch scales the ratios as a power: 1 is the table, above it the
  // partials move apart, below it together. The played note stays put.
  {
    for (float stretch : {0.5f, 1.5f}) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, 1.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kStretch, stretch);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      const double base = fine_pitch(out.left, kRate, 220.0, 4800, out.left.size(), 0.01);
      const double want = 220.0 * std::pow(2.757, static_cast<double>(stretch));
      const double second = fine_pitch(out.left, kRate, want, 4800, out.left.size(), 0.01);
      const double old = bin_level(out.left, kRate, 220.0 * 2.757, 4800, 48000);
      std::snprintf(label, sizeof label, "stretch %.1f: mode 2 at %.1f Hz (2.757^%.1f x 220 = %.1f), the note at %.2f Hz", stretch, second,
                    stretch, want, base);
      std::printf("%s\n", label);
      EXPECT(std::fabs(cents(second, want)) < 2.0 && std::fabs(cents(base, 220.0)) < 1.0, label);
      EXPECT(old < 0.01 * bin_level(out.left, kRate, second, 4800, 48000), "and no longer at the table's ratio");
    }
  }

  // Brightness tilts the modes about the played note (as its ratio to the
  // power +-0.75), without moving the note itself.
  {
    double mode3[3], mode1[3];
    const float brightness[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, 0.9f);
      device.set_param(p::kBrightness, brightness[which]);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out = render(device, 1.0f, kRate);
      mode1[which] = bin_level(out.left, kRate, 220.0, 2400, 24000);
      mode3[which] = bin_level(out.left, kRate, 220.0 * 5.404, 2400, 24000);
    }
    const double step = db(std::pow(5.404, 0.75));
    std::printf("brightness 0, 0.5, 1: mode 3 at %.1f, %.1f, %.1f dB re the fundamental (%.1f dB a step expected)\n",
                db(mode3[0] / mode1[0]), db(mode3[1] / mode1[1]), db(mode3[2] / mode1[2]), step);
    EXPECT(std::fabs(db(mode3[2] / mode3[1]) - step) < 0.5 && std::fabs(db(mode3[1] / mode3[0]) - step) < 0.5, "brightness tilts mode 3 by its ratio to the 0.75 each way");
    EXPECT(std::fabs(mode1[0] / mode1[2] - 1.0) < 0.01, "and leaves the fundamental where it was");
  }

  // Spread: with none the instrument is mono; with it the halves of each
  // doublet sit left and right, so a beating bowl turns between the sides.
  {
    plain(device, ModalBells::kBowl);
    device.set_param(p::kDetune, 2.0f);
    device.note_on(1, 200.0f, 0.8f);
    Stereo mono = render(device, 3.0f, kRate);
    EXPECT(mono.left == mono.right, "no spread: left and right are the same");
    plain(device, ModalBells::kBowl);
    device.set_param(p::kDetune, 2.0f);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kDecay, 40.0f);
    device.set_param(p::kHardness, 0.0f);
    device.note_on(1, 200.0f, 0.8f);
    Stereo wide = render(device, 4.0f, kRate);
    std::vector<float> left, right;
    for (size_t from = 4800; from + 2400 <= wide.left.size(); from += 480) {
      left.push_back(static_cast<float>(bin_level(wide.left, kRate, 200.0, from, 2400)));
      right.push_back(static_cast<float>(bin_level(wide.right, kRate, 200.0, from, 2400)));
    }
    const double mean_left = mean(left), mean_right = mean(right);
    for (float& v : left) v -= static_cast<float>(mean_left);
    for (float& v : right) v -= static_cast<float>(mean_right);
    const double together = correlation(left, right);
    const double sides = correlation(wide.left, wide.right, 4800);
    std::printf("spread 1: left/right correlation %.2f; the beat's envelopes on the two sides correlate %.2f\n", sides, together);
    EXPECT(sides < 0.9, "full spread: left and right differ");
    EXPECT(std::fabs(mean_left / mean_right - 1.0) < 0.35, "the note stays near the middle on average");
    // (The two envelopes have different shapes, one deep and one shallow, so
    // they cannot reach -1; in step they measure +0.9.)
    const size_t loudest_left = static_cast<size_t>(std::max_element(left.begin(), left.end()) - left.begin());
    EXPECT(together < -0.4 && right[loudest_left] < 0.0f, "and the beat turns: one side swells as the other fades");
  }

  // The same key again while its note rings strikes the same modes: no
  // second copy, no voice used up. Eleven other notes ring through twelve
  // strikes of the twelfth.
  {
    double with[11], without[11];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, 0.0f);
      device.set_param(p::kDecay, 20.0f);
      device.set_param(p::kVolume, -24.0f);  // twelve strikes pile up: keep them out of the soft clip
      for (int n = 0; n < 11; ++n) device.note_on(10 + n, 300.0f + 100.0f * n, 0.3f);
      Stereo out = render(device, 0.2f, kRate);
      for (int hit = 0; hit < 12; ++hit) {
        if (pass == 1) {
          device.note_on(1, 3000.0f, 0.5f);  // every mode above the others' fundamentals
          if (hit & 1) device.note_off(1);  // held or released, the note is the same bar
        }
        out = render(device, 0.1f, kRate);
      }
      out = render(device, 0.5f, kRate);
      for (int n = 0; n < 11; ++n) (pass == 0 ? without : with)[n] = bin_level(out.left, kRate, 300.0 + 100.0 * n, 0, 24000);
    }
    double worst = 0.0;
    for (int n = 0; n < 11; ++n) worst = std::max(worst, std::fabs(with[n] / without[n] - 1.0));
    std::snprintf(label, sizeof label, "twelve strikes of one key steal no voice from eleven ringing notes (worst change %.3f)", worst);
    EXPECT(worst < 0.02, label);

    // Two strikes add like two strikes on one bar: between nothing and
    // double, depending on where the bar is in its swing; never a restart.
    plain(device, ModalBells::kBar);
    device.set_param(p::kHardness, 0.0f);
    device.set_param(p::kDecay, 20.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo first = render(device, 0.5f, kRate);
    const double before = bin_level(first.left, kRate, 220.0, 12000, 12000);
    double least = 1.0e9, most = 0.0;
    for (int n = 0; n < 8; ++n) {
      plain(device, ModalBells::kBar);
      device.set_param(p::kHardness, 0.0f);
      device.set_param(p::kDecay, 20.0f);
      device.note_on(1, 220.0f, 0.7f);
      render(device, 0.5f + n / (8.0f * 220.0f), kRate);  // eight moments across one period
      device.note_on(1, 220.0f, 0.7f);
      Stereo second = render(device, 0.5f, kRate);
      const double after = bin_level(second.left, kRate, 220.0, 12000, 12000);
      least = std::min(least, after / before);
      most = std::max(most, after / before);
    }
    std::printf("a second equal strike on a ringing bar leaves it between %.2fx and %.2fx as loud\n", least, most);
    EXPECT(least < 0.5 && most > 1.7 && most < 2.05, "a second strike adds to the motion it finds");
  }

  // Levels: one note of each material at the default patch, the velocity
  // range, and a ten-note chord under the clip knee region.
  {
    const char* names[7] = {"church bell", "singing bowl", "vibraphone", "bar", "kalimba", "glass", "gong"};
    for (int material = 0; material < 7; ++material) {
      device.init(kRate);
      device.set_param(p::kMaterial, static_cast<float>(material));
      if (material == ModalBells::kVibraphone || material == ModalBells::kBar) device.set_param(p::kPosition, 0.9f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 2.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      std::snprintf(label, sizeof label, "%s: one note peaks at %.1f dBFS (-24 to -10)", names[material], level);
      std::printf("%s\n", label);
      EXPECT(level > -24.0 && level < -10.0, label);
    }
    device.init(kRate);
    device.set_param(p::kSustain, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo rubbed = render(device, 4.0f, kRate);
    const double rubbed_level = db(std::max(peak(rubbed.left), peak(rubbed.right)));
    std::snprintf(label, sizeof label, "a rubbed note peaks at %.1f dBFS (-24 to -10)", rubbed_level);
    std::printf("%s\n", label);
    EXPECT(rubbed_level > -24.0 && rubbed_level < -10.0, label);

    double soft = 0.0, loud = 0.0;
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.note_on(1, 220.0f, which == 0 ? 0.2f : 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      (which == 0 ? soft : loud) = rms(out.left, 0, 24000);
    }
    std::printf("velocity 0.2 to 1: %.1f dB\n", db(loud / soft));
    EXPECT(db(loud / soft) > 12.0 && db(loud / soft) < 36.0, "velocity gives 12 to 36 dB of range");

    double worst = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      if (pass == 1) device.set_param(p::kSustain, 1.0f);
      for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
      Stereo out = render(device, 4.0f, kRate);
      worst = std::max(worst, std::max(peak(out.left), peak(out.right)));
    }
    std::snprintf(label, sizeof label, "ten notes, struck or rubbed, stay under the clip knee region (peak %.2f)", worst);
    std::printf("%s\n", label);
    EXPECT(worst < 0.9, label);
  }

  // Knobs under a ringing chord: modes retune, re-decay and move without a
  // click (the largest sample step stays what the chord's own waveform has).
  {
    const int swept[6] = {p::kDetune, p::kStretch, p::kDamping, p::kBrightness, p::kSpread, p::kDecay};
    const char* names[6] = {"detune", "stretch", "damping", "brightness", "spread", "decay"};
    for (int which = 0; which < 6; ++which) {
      double step[2];
      for (int pass = 0; pass < 2; ++pass) {
        device.init(kRate);
        device.set_param(p::kHardness, 0.2f);
        device.set_param(p::kDecay, 20.0f);
        device.set_param(p::kDamping, 0.0f);
        for (int n = 0; n < 4; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 7 / 12.0f), 0.8f);
        render(device, 0.3f, kRate);
        Stereo out;
        const int id = swept[which];
        for (int k = 0; k < 200; ++k) {
          // Stretch is swept over a tenth of its range: all of it is a three-octave glissando.
          const float span = id == p::kStretch ? 0.1f : 1.0f;
          const float t = 0.5f + span * (0.5f * std::sin(k * 0.21f) + (k % 17 == 0 ? 0.3f : 0.0f) - 0.25f);
          const float value = p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * std::fmin(std::fmax(t, 0.0f), 1.0f);
          if (pass == 1) device.set_param(id, value);
          out = concat(out, render(device, 0.005f, kRate, 64));
        }
        step[pass] = std::max(max_step(out.left), max_step(out.right));
      }
      std::snprintf(label, sizeof label, "sweeping %s under a chord: largest step %.4f (%.4f held)", names[which], step[1], step[0]);
      std::printf("%s\n", label);
      EXPECT(step[1] < 2.0 * step[0], label);
    }
  }

  // The instrument rules where a bank of modes could break them: block
  // size, voice stealing, everything at once, and going back to sleep.
  {
    Stereo a, b;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kSustain, 0.6f);
      device.note_on(1, 110.0f, 0.8f);
      device.note_on(2, 277.2f, 0.5f);
      if (pass == 0) {
        a = render(device, 1.0f, kRate, 128);
      } else {
        b = render(device, 0.5f, kRate, 1);
        Stereo rest = render(device, 0.5f, kRate, 2048);
        b = concat(b, rest);
      }
    }
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    std::snprintf(label, sizeof label, "a rubbed chord does not depend on the block size (max diff %g)", worst);
    EXPECT(worst < 1.0e-6, label);

    // Stealing: eleven loud low notes and one quieter high one, which is the
    // one a thirteenth note takes. Cut dead, a 3 kHz note leaves a step of
    // up to its whole amplitude, 2.6 times its own steepest; faded over 2 ms
    // it leaves none. Eight tries, to catch it at different points of its swing.
    double own = 0.0, taken = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      plain(device, ModalBells::kVibraphone);
      device.set_param(p::kHardness, 0.0f);
      device.set_param(p::kDecay, 40.0f);
      device.set_param(p::kVolume, -18.0f);
      for (int n = 0; n < 11; ++n) device.note_on(n, 40.0f + 3.0f * n, 1.0f);
      device.note_on(11, 3000.0f, 0.9f);
      Stereo ringing = render(device, 0.3f + trial * 0.00002f, kRate);
      own = std::max(own, max_step(ringing.left, 4800));
      device.note_on(12, 80.0f, 0.2f);
      Stereo out = render(device, 0.02f, kRate);
      Stereo joined = concat(ringing, out);
      taken = std::max(taken, max_step(joined.left, ringing.size() - 2));
      const double high_left = bin_level(out.left, kRate, 3000.0, 480, 480);
      EXPECT(high_left < 0.01 * bin_level(ringing.left, kRate, 3000.0, 9600, 480), "the quietest voice is the one taken");
    }
    std::printf("stealing a 3 kHz note: largest step %.4f, %.4f while it rang\n", taken, own);
    EXPECT(taken < 1.1 * own, "stealing does not click");

    // Sixty notes over twelve voices stay bounded and all come to rest.
    device.init(kRate);
    bool bounded = true;
    for (int n = 0; n < 60; ++n) {
      device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
      Stereo out = render(device, 0.03f, kRate);
      bounded = bounded && finite(out.left) && peak(out.left) < 1.01 && peak(out.right) < 1.01;
    }
    EXPECT(bounded, "sixty notes over twelve voices stay bounded");
    for (int n = 0; n < 60; ++n) device.note_off(n);
    render(device, 20.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and every voice is freed");

    // Everything at its loudest and longest, at the top of the keyboard and
    // the bottom, at the lowest rate.
    for (int material = 0; material < 7; ++material) {
      device.init(44100.0f);
      device.set_param(p::kMaterial, static_cast<float>(material));
      device.set_param(p::kDecay, 40.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kHardness, 1.0f);
      device.set_param(p::kDetune, 8.0f);
      device.set_param(p::kStretch, 1.5f);
      device.set_param(p::kSustain, 1.0f);
      device.set_param(p::kBrightness, 1.0f);
      device.set_param(p::kVolume, 6.0f);
      for (int n = 0; n < 12; ++n) device.note_on(n, n < 6 ? 20.0f + 3.0f * n : 4000.0f + 800.0f * (n - 6), 1.0f);
      Stereo out = render(device, 3.0f, 44100.0f);
      for (int n = 0; n < 12; ++n) device.note_on(n, n < 6 ? 20.0f + 3.0f * n : 4000.0f + 800.0f * (n - 6), 1.0f);
      Stereo more = render(device, 3.0f, 44100.0f);
      std::snprintf(label, sizeof label, "material %d: twelve notes with everything at maximum stay finite and bounded", material);
      EXPECT(finite(out.left) && finite(more.right) && peak(out.left) < 1.01 && peak(more.left) < 1.01 && peak(more.right) < 1.01, label);
    }

    // A held note that has rung out frees its voice; a rubbed one does not.
    plain(device, ModalBells::kKalimba);
    device.set_param(p::kDecay, 0.2f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 1.0f, kRate);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(peak(quiet.left) == 0.0, "a held note that has rung out leaves exact silence");
  }

  // Cost with every voice ringing: the default bowl (12 modes a note) and
  // the fullest tables (16), struck and rubbed.
  {
    const int materials[3] = {ModalBells::kBowl, ModalBells::kBell, ModalBells::kGong};
    const char* names[3] = {"singing bowl", "church bell", "gong"};
    for (int which = 0; which < 3; ++which) {
      device.init(kRate);
      device.set_param(p::kMaterial, static_cast<float>(materials[which]));
      device.set_param(p::kDecay, 40.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kSustain, 0.5f);
      for (int n = 0; n < 12; ++n) device.note_on(n, 55.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "modal-bells (%s, 12 notes)", names[which]);
      report_cost(label, 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
    }
  }

  return finish("modal-bells");
}
