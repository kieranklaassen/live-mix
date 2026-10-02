// Native harness for Mallets (cpp/devices/mallets). The conformance pass
// covers silence, voice stealing under a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it a set of tuned bars
// over tubes: the partials each instrument is carved to, tuning, the decay
// each material has, the mallet, the damper and the stage, then the three
// things Bells does not have (the tube, the motor, the roll), then levels,
// clicks and cost. Nobody has listened to it: every claim here is a number.

#include "../devices/mallets/mallets.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Mallets;
namespace p = livemix::mallets;

static Mallets device;

static const float kRate = 48000.0f;
static const double kC2 = 65.40639, kC3 = 130.8128, kC4 = 261.6256, kC5 = 523.2511, kC6 = 1046.502, kC7 = 2093.005,
                    kC8 = 4186.009;

// One instrument as its presets leave the defaults: unity volume.
static void fresh(Mallets& d, int instrument, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kInstrument, static_cast<float>(instrument));
  d.set_param(p::kVolume, 0.0f);
}

// The bar alone, in the middle: no tube, no stage.
static void bare(Mallets& d, int instrument, float rate = kRate) {
  fresh(d, instrument, rate);
  d.set_param(p::kResonator, 0.0f);
  d.set_param(p::kWidth, 0.0f);
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
                         double reach = 0.01) {
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

// The level of the `hz` component every `hop` samples, in windows of `n`.
static std::vector<float> envelope(const std::vector<float>& x, double rate, double hz, size_t from, size_t n,
                                   size_t hop) {
  std::vector<float> out;
  for (size_t at = from; at + n <= x.size(); at += hop) out.push_back(static_cast<float>(bin_level(x, rate, hz, at, n)));
  return out;
}

// The amplitude of a component whose period is exactly `period` samples,
// sample by sample: the mean over the last period of the signal turned back
// by that component (the other half of the product averages out exactly).
static std::vector<float> follow(const std::vector<float>& x, int period) {
  std::vector<double> re(x.size() + 1, 0.0), im(x.size() + 1, 0.0);
  for (size_t i = 0; i < x.size(); ++i) {
    const double phase = 2.0 * kPi * static_cast<double>(i % static_cast<size_t>(period)) / period;
    re[i + 1] = re[i] + x[i] * std::cos(phase);
    im[i + 1] = im[i] - x[i] * std::sin(phase);
  }
  std::vector<float> out(x.size(), 0.0f);
  for (size_t i = static_cast<size_t>(period); i <= x.size(); ++i) {
    const double a = re[i] - re[i - period], b = im[i] - im[i - period];
    out[i - 1] = static_cast<float>(2.0 * std::sqrt(a * a + b * b) / period);
  }
  return out;
}

// Where the energy of the first `n` samples sits, in Hz (a DFT every 50 Hz up to 12 kHz).
static double centroid(const std::vector<float>& x, double rate, size_t n) {
  double weighted = 0.0, total = 0.0;
  for (double hz = 50.0; hz <= 12000.0; hz += 50.0) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < n && i < x.size(); ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      re += x[i] * std::cos(phase);
      im -= x[i] * std::sin(phase);
    }
    const double power = re * re + im * im;
    weighted += hz * power;
    total += power;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// A line through `y` (in dB) against its index, taken out: what is left is
// the swing about the decay.
static std::vector<float> about_the_decay(const std::vector<float>& level) {
  const size_t n = level.size();
  double st = 0, sd = 0, stt = 0, std_ = 0;
  std::vector<double> d(n);
  for (size_t i = 0; i < n; ++i) {
    d[i] = db(level[i]);
    st += static_cast<double>(i);
    sd += d[i];
    stt += static_cast<double>(i) * i;
    std_ += static_cast<double>(i) * d[i];
  }
  const double slope = (n * std_ - st * sd) / (n * stt - st * st), offset = (sd - slope * st) / n;
  std::vector<float> out(n);
  for (size_t i = 0; i < n; ++i) out[i] = static_cast<float>(d[i] - (offset + slope * i));
  return out;
}

static double swing(const std::vector<float>& x) {
  return *std::max_element(x.begin(), x.end()) - *std::min_element(x.begin(), x.end());
}

// Stroke onsets, in seconds: the moments the sound above 1.5 kHz (the knock
// of a stroke; the hum is far below) climbs over `share` of its largest
// 4 ms frame after `skip` seconds, having first fallen to a quarter of that.
static std::vector<double> onsets(const std::vector<float>& x, double rate, double skip, double share = 0.05) {
  const double seconds = 0.004;
  const size_t frame = static_cast<size_t>(seconds * rate);
  const double a = std::exp(-2.0 * kPi * 1500.0 / rate);
  std::vector<double> energy;
  double low[4] = {0.0, 0.0, 0.0, 0.0}, sum = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    double high = x[i];
    for (double& stage : low) {  // four one-poles: the hum is 80 dB down, a knock passes
      stage = high + (stage - high) * a;
      high -= stage;
    }
    sum += high * high;
    if ((i + 1) % frame == 0) {
      energy.push_back(sum);
      sum = 0.0;
    }
  }
  double top = 0.0;
  for (size_t f = static_cast<size_t>(skip / seconds); f < energy.size(); ++f) top = std::max(top, energy[f]);
  std::vector<double> found;
  bool armed = true;
  for (size_t f = 0; f < energy.size(); ++f) {
    if (armed && energy[f] > share * top) {
      found.push_back(static_cast<double>(f) * seconds);
      armed = false;
    } else if (energy[f] < 0.25 * share * top) {
      armed = true;
    }
  }
  return found;
}

int main() {
  Conformance spec;
  spec.name = "mallets";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A released low marimba bar rings 4.4 s to -60 dB at the defaults and is
  // retired at -120 dB, so a loud pile needs just over twice that.
  spec.tail_seconds = 14.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  char label[240];

  // --- The bars ---------------------------------------------------------------------------

  // Each instrument sounds the partials its bars are carved to: marimba and
  // vibraphone 1 : 4 : 10 (the marimba's third a little under), xylophone
  // the twelfth 1 : 3 : 6, glockenspiel and celesta the uncut bar.
  {
    struct Expect {
      int instrument;
      const char* name;
      int count;
      double ratios[5];
    };
    const Expect expects[] = {
        {Mallets::kMarimba, "marimba", 3, {1.0, 4.0, 9.9}},
        {Mallets::kVibraphone, "vibraphone", 5, {1.0, 4.0, 10.0, 18.2, 28.4}},
        {Mallets::kXylophone, "xylophone", 3, {1.0, 3.0, 6.0}},
        {Mallets::kGlockenspiel, "glockenspiel", 5, {1.0, 2.757, 5.404, 8.933, 13.345}},
        {Mallets::kCelesta, "celesta", 3, {1.0, 2.757, 5.404}},
    };
    for (const Expect& expect : expects) {
      bare(device, expect.instrument);
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      const double f0 = 220.0;
      device.note_on(1, static_cast<float>(f0), 0.9f);
      Stereo out = render(device, 1.5f, kRate);
      const size_t from = 240, to = out.left.size();
      double worst = 0.0;
      bool present = true;
      for (int m = 0; m < expect.count; ++m) {
        const double hz = f0 * expect.ratios[m];
        const double found = fine_pitch(out.left, kRate, hz, from, to);  // 17 cents either way
        worst = std::max(worst, std::fabs(cents(found, hz)));
        // A real partial, not the skirt of a neighbour: it stands 14 dB
        // above the level a quarter tone to either side.
        const double here = bin_level(out.left, kRate, found, from, to - from);
        const double beside = std::max(bin_level(out.left, kRate, found * 1.03, from, to - from),
                                       bin_level(out.left, kRate, found / 1.03, from, to - from));
        present = present && here > 5.0 * beside;
      }
      std::printf("%s: %d partials, worst %.2f cents from its ratios\n", expect.name, expect.count, worst);
      std::snprintf(label, sizeof label, "%s: partials within 2 cents of its ratios", expect.name);
      EXPECT(worst < 2.0, label);
      std::snprintf(label, sizeof label, "%s: every listed partial is there", expect.name);
      EXPECT(present, label);
    }
    // The carved bar is not the free bar: no partial where the other kind has one.
    bare(device, Mallets::kMarimba);
    device.set_param(p::kMallet, 1.0f);
    device.note_on(1, 220.0f, 0.9f);
    Stereo carved = render(device, 0.5f, kRate);
    EXPECT(bin_level(carved.left, kRate, 220.0 * 2.757, 240, 9600) < 0.1 * bin_level(carved.left, kRate, 880.0, 240, 9600),
           "a marimba bar has its second partial at 4, not at the free bar's 2.757");
  }

  // Tuning: the fundamental is where the key says from C2 to C7 at three
  // sample rates, with the tube on and the motor turning.
  {
    double worst = 0.0;
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (float rate : rates) {
      for (double hz : {kC2, kC3, kC4, kC5, kC6, kC7}) {
        fresh(device, Mallets::kVibraphone, rate);
        device.set_param(p::kResonator, 1.0f);
        device.set_param(p::kMotor, 0.5f);
        device.note_on(1, static_cast<float>(hz), 0.8f);
        Stereo out = render(device, 2.0f, rate);
        const double found = fine_pitch(out.left, rate, hz, static_cast<size_t>(0.05 * rate), out.left.size());
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
    std::printf("vibraphone with tube and motor, C2 to C7 at three rates: worst %.3f cents\n", worst);
    EXPECT(worst < 1.0, "the fundamental is within a cent at every pitch and rate");

    worst = 0.0;
    for (float rate : rates) {
      for (double hz : {kC2, kC3, kC4, kC5, kC6}) {
        device.init(rate);  // the default patch: a marimba, short at the top
        device.note_on(1, static_cast<float>(hz), 0.8f);
        Stereo out = render(device, 1.0f, rate);
        const double ring = 2.2 * kC3 / hz;  // about what it rings
        const double found = fine_pitch(out.left, rate, hz, static_cast<size_t>(0.1 * ring * rate),
                                        static_cast<size_t>(std::min(1.0, 0.1 * ring + 0.5 * ring) * rate));
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
    std::printf("the default marimba, C2 to C6 at three rates: worst %.3f cents\n", worst);
    EXPECT(worst < 3.0, "the default patch is within 3 cents from C2 to C6");
  }

  // Wood: the fundamental's ring time halves with every octave, and the
  // knock is over long before the hum.
  {
    double ring[4];
    const double notes[4] = {kC3, kC4, kC5, kC6};
    for (int which = 0; which < 4; ++which) {
      fresh(device, Mallets::kMarimba);
      device.note_on(1, static_cast<float>(notes[which]), 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      const double about = 2.2 * kC3 / notes[which];
      ring[which] = ring_time(out.left, kRate, notes[which], 0.15 * about, 0.6 * about, 0.05 * about);
    }
    std::printf("marimba fundamental rings %.2f s at C3, %.2f s at C4, %.2f s at C5, %.2f s at C6\n", ring[0], ring[1],
                ring[2], ring[3]);
    for (int which = 0; which < 3; ++which) {
      const double step = ring[which] / ring[which + 1];
      std::snprintf(label, sizeof label, "wood: an octave up rings %.2f times shorter (1.7 to 2.3)", step);
      EXPECT(step > 1.7 && step < 2.3, label);
    }
    EXPECT(ring[1] > 0.8 && ring[1] < 2.0, "a marimba's middle C rings between 0.8 and 2 s at the defaults");

    // Tok, then hum: at C3 the 4x partial starts within 12 dB of the
    // fundamental and is 20 dB under it 150 ms later.
    fresh(device, Mallets::kMarimba);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    const double early = db(bin_level(out.left, kRate, 4.0 * kC3, 0, 960) / bin_level(out.left, kRate, kC3, 0, 960));
    const double later = db(bin_level(out.left, kRate, 4.0 * kC3, 7200, 1920) / bin_level(out.left, kRate, kC3, 7200, 1920));
    const double knock = ring_time(out.left, kRate, 4.0 * kC3, 0.02, 0.12, 0.02);
    const double hum = ring_time(out.left, kRate, kC3, 0.3, 1.3, 0.1);
    std::printf("marimba C3: 4x partial %.1f dB re the fundamental in the first 20 ms, %.1f dB at 150 ms; it rings %.2f s, the fundamental %.2f s\n",
                early, later, knock, hum);
    EXPECT(early > -12.0, "the knock is there: the 4x partial starts within 12 dB of the fundamental");
    EXPECT(later < -20.0, "and is gone: 20 dB under the fundamental after 150 ms");
    EXPECT(knock < 0.3 * hum, "a marimba's upper partial rings less than a third as long as its fundamental");
  }

  // Metal: a vibraphone bar sings for seconds, overtones and all.
  {
    fresh(device, Mallets::kVibraphone);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    const double low = ring_time(out.left, kRate, kC4, 0.3, 2.5, 0.1);
    const double upper = ring_time(out.left, kRate, 4.0 * kC4, 0.3, 2.5, 0.1);
    std::printf("vibraphone C4: fundamental rings %.2f s, 4x partial %.2f s\n", low, upper);
    EXPECT(low > 4.0, "a vibraphone's middle C rings more than 4 s");
    EXPECT(upper > low / 3.0, "and its 4x partial at least a third as long");
    EXPECT(upper < low, "but not longer than the fundamental");

    // Decay scales the ring; the material keeps its law.
    double scaled[2];
    for (int which = 0; which < 2; ++which) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kDecay, which == 0 ? 0.25f : 1.0f);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo ringing = render(device, 3.0f, kRate);
      scaled[which] = ring_time(ringing.left, kRate, kC4, 0.2, which == 0 ? 1.2 : 2.5, 0.1);
    }
    std::printf("vibraphone bar alone at C4: %.2f s at Decay 0.25, %.2f s at Decay 1\n", scaled[0], scaled[1]);
    EXPECT(std::fabs(scaled[1] / scaled[0] / 4.0 - 1.0) < 0.05, "Decay scales the ring time");
  }

  // Mallet: harder and louder strokes are brighter in their first 20 ms,
  // and the mallet does not change how loud the note itself is.
  {
    double bright[5], low[5];
    for (int which = 0; which < 5; ++which) {
      bare(device, Mallets::kMarimba);
      device.set_param(p::kMallet, 0.25f * which);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      bright[which] = centroid(out.left, kRate, 960);
      low[which] = bin_level(out.left, kRate, kC4, 480, 2400);
    }
    std::printf("marimba C4, mallet 0 to 1: centroid of the first 20 ms %.0f, %.0f, %.0f, %.0f, %.0f Hz; fundamental %.1f to %.1f dB\n",
                bright[0], bright[1], bright[2], bright[3], bright[4], db(*std::min_element(low, low + 5)),
                db(*std::max_element(low, low + 5)));
    for (int which = 0; which < 4; ++which) {
      EXPECT(bright[which + 1] > 1.05 * bright[which], "each step harder is brighter");
    }
    EXPECT(bright[4] > 2.5 * bright[0], "a hard mallet is more than an octave brighter than a soft one");
    EXPECT(db(*std::max_element(low, low + 5) / *std::min_element(low, low + 5)) < 3.0,
           "the fundamental is as loud whatever the mallet");

    double velocity[3];
    const float gains[3] = {0.3f, 0.65f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      bare(device, Mallets::kMarimba);
      device.set_param(p::kMallet, 0.5f);
      device.note_on(1, static_cast<float>(kC4), gains[which]);
      Stereo out = render(device, 0.3f, kRate);
      velocity[which] = centroid(out.left, kRate, 960);
    }
    std::printf("marimba C4, velocity 0.3, 0.65, 1: centroid %.0f, %.0f, %.0f Hz\n", velocity[0], velocity[1], velocity[2]);
    EXPECT(velocity[1] > 1.05 * velocity[0] && velocity[2] > 1.05 * velocity[1], "a harder stroke is a brighter stroke");
  }

  // Damper: zero lets a released bar ring as if the key were down; full
  // stops a vibraphone within 0.4 s.
  {
    double ring[3], gone = 0.0;
    const float damper[3] = {0.0f, 1.0f, 0.5f};
    Stereo stopped;
    for (int which = 0; which < 3; ++which) {
      fresh(device, Mallets::kVibraphone);
      device.set_param(p::kDamper, damper[which]);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo held = render(device, 0.5f, kRate);
      device.note_off(1);
      Stereo after = render(device, 3.0f, kRate);
      ring[which] = ring_time(after.left, kRate, kC4, 0.03, which == 1 ? 0.1 : 2.0, 0.03);
      if (which == 1) {
        gone = db(rms(after.left, 19200, 21600) / rms(held.left, 21600, 24000));
        stopped = after;
      }
    }
    fresh(device, Mallets::kVibraphone);
    device.set_param(p::kDamper, 1.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo held = render(device, 3.5f, kRate);
    const double untouched = ring_time(held.left, kRate, kC4, 0.53, 2.5, 0.03);
    std::printf("vibraphone C4 released: damper 0 rings %.2f s (held: %.2f s), damper 1 %.3f s and is %.1f dB down 0.4 s after the key, damper 0.5 %.2f s\n",
                ring[0], untouched, ring[1], gone, ring[2]);
    EXPECT(std::fabs(ring[0] / untouched - 1.0) < 0.05, "damper 0: letting go changes nothing");
    EXPECT(gone < -60.0, "damper 1: 60 dB down within 0.4 s of the key");
    EXPECT(ring[2] > 3.0 * ring[1] && ring[2] < 0.6 * ring[0], "in between, the damper sets how long a released bar may ring");
    EXPECT(max_step(stopped.left, 0, 4800) < 1.2 * max_step(stopped.left, 0, 96), "the damper is a decay, not a cut");
  }

  // Stage: the keyboard lies across the speakers, low to the left; without
  // Width it is mono, and at any width the two sides add.
  {
    double balance[2];
    const double notes[2] = {kC2, kC7};
    for (int which = 0; which < 2; ++which) {
      fresh(device, Mallets::kVibraphone);
      device.set_param(p::kWidth, 1.0f);
      device.note_on(1, static_cast<float>(notes[which]), 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      balance[which] = db(rms(out.right) / rms(out.left));
    }
    std::printf("width 1: C2 sits %.1f dB to the left, C7 %.1f dB to the right\n", -balance[0], balance[1]);
    EXPECT(balance[0] < -6.0 && balance[1] > 6.0, "at full width the ends of the keyboard lean 6 dB or more to their sides");

    fresh(device, Mallets::kVibraphone);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, static_cast<float>(kC2), 0.8f);
    device.note_on(2, static_cast<float>(kC6), 0.8f);
    Stereo mono = render(device, 0.5f, kRate);
    EXPECT(mono.left == mono.right, "no width: left and right are the same");

    fresh(device, Mallets::kVibraphone);
    device.set_param(p::kWidth, 1.0f);
    const double chord[5] = {kC2, kC3 * 1.4983, kC4 * 1.2599, kC5 * 1.4983, kC7};
    for (int n = 0; n < 5; ++n) device.note_on(n, static_cast<float>(chord[n]), 0.8f);
    Stereo wide = render(device, 2.0f, kRate);
    std::vector<float> mid(wide.size()), side(wide.size());
    for (size_t i = 0; i < wide.size(); ++i) {
      mid[i] = 0.5f * (wide.left[i] + wide.right[i]);
      side[i] = 0.5f * (wide.left[i] - wide.right[i]);
    }
    std::printf("a chord across five octaves at width 1: side %.1f dB re mid, left/right correlation %.2f\n",
                db(rms(side) / rms(mid)), correlation(wide.left, wide.right));
    EXPECT(rms(side) < 0.9 * rms(mid), "left plus right does not cancel: the mid is above the side at full width");
    EXPECT(correlation(wide.left, wide.right) < 0.95, "and the sides do differ");
  }

  // Nothing that does not belong: a glockenspiel's top C has its fourth and
  // fifth modes at 37 and 56 kHz, which would fold to 10607 and 7862 Hz at
  // 48 kHz. They are dropped, with everything else above 16 kHz.
  {
    bare(device, Mallets::kGlockenspiel);
    device.set_param(p::kMallet, 1.0f);
    device.set_param(p::kDecay, 4.0f);
    device.note_on(1, static_cast<float>(kC8), 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const size_t from = 2400, n = 24000;
    const double own = bin_level(out.left, kRate, kC8, from, n);
    const double second = bin_level(out.left, kRate, 2.757 * kC8, from, n);
    double stray = 0.0;
    double stray_hz = 0.0;
    for (double hz = 200.0; hz < 23800.0; hz += 20.0) {
      if (std::fabs(hz / kC8 - 1.0) < 0.08 || std::fabs(hz / (2.757 * kC8) - 1.0) < 0.08) continue;
      const double level = bin_level(out.left, kRate, hz, from, n);
      if (level > stray) {
        stray = level;
        stray_hz = hz;
      }
    }
    const double folded = std::max(bin_level(out.left, kRate, 48000.0 - 8.933 * kC8, from, n),
                                   bin_level(out.left, kRate, 13.345 * kC8 - 48000.0, from, n));
    std::printf("glockenspiel C8: fundamental %.1f dB, 2.757x %.1f dB, where modes 4 and 5 would fold %.1f dB, strongest other component %.1f dB at %.0f Hz\n",
                db(own), db(second), db(folded), db(stray), stray_hz);
    EXPECT(own > 0.01 && second > 0.001, "the two modes that fit under 16 kHz sound");
    EXPECT(folded < own * 0.003, "nothing folds back: 50 dB down where the dropped modes would land");
    EXPECT(stray < own * 0.003, "and nothing else stands within 50 dB of the fundamental");
  }

  // --- The tube ---------------------------------------------------------------------------

  // Resonator: with the tube the fundamental is louder, blooms after the
  // stroke instead of starting at its loudest, and dies sooner. The 4x
  // partial gets nothing from a tube that resonates at 1, 3, 5.
  {
    const int period = 184;  // a C4 of exactly 184 samples: 260.87 Hz
    const double hz = kRate / period;
    std::vector<float> level[2];
    double ring[2], upper[2];
    for (int which = 0; which < 2; ++which) {
      bare(device, Mallets::kMarimba);
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kResonator, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      level[which] = follow(out.left, period);
      ring[which] = ring_time(out.left, kRate, hz, 0.2, 0.8, 0.05);
      upper[which] = bin_level(out.left, kRate, 4.0 * hz, 0, 1440);
    }
    const size_t top_bare = static_cast<size_t>(std::max_element(level[0].begin(), level[0].end()) - level[0].begin());
    const size_t top_tube = static_cast<size_t>(std::max_element(level[1].begin(), level[1].end()) - level[1].begin());
    // The follower's window is one period long; a level belongs to its middle.
    const double at_bare = (static_cast<double>(top_bare) - 0.5 * period) / kRate;
    const double at_tube = (static_cast<double>(top_tube) - 0.5 * period) / kRate;
    const double lift = db(level[1][top_tube] / level[0][top_bare]);
    std::printf("marimba C4 with the tube: fundamental %.1f dB louder at its peak, which comes %.1f ms after the stroke (%.1f ms without); it rings %.2f s (%.2f s without); 4x partial %+.2f dB\n",
                lift, 1000.0 * at_tube, 1000.0 * at_bare, ring[1], ring[0], db(upper[1] / upper[0]));
    EXPECT(lift > 6.0, "the tube lifts the fundamental's peak by more than 6 dB");
    EXPECT(at_tube > 0.005 && at_tube < 0.080, "the fundamental blooms: its peak comes 5 to 80 ms after the stroke");
    EXPECT(at_bare < 0.5 * at_tube && at_bare < 1.5 * period / kRate, "without the tube it is loudest as soon as it has swung once");
    EXPECT(ring[0] / ring[1] > 1.3 && ring[0] / ring[1] < 3.0, "the tube shortens the fundamental's ring by 1.3 to 3 times");
    EXPECT(std::fabs(db(upper[1] / upper[0])) < 1.0, "the tube leaves the 4x partial as it was");

    // Three milliseconds is less than one swing of middle C; two octaves up
    // it is three, and there the bar alone is at its loudest inside it.
    const int high_period = 46;  // 1043.5 Hz
    double when[2];
    for (int which = 0; which < 2; ++which) {
      bare(device, Mallets::kMarimba);
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kResonator, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, kRate / high_period, 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      std::vector<float> high = follow(out.left, high_period);
      when[which] = (static_cast<double>(std::max_element(high.begin(), high.end()) - high.begin()) - 0.5 * high_period) / kRate;
    }
    std::printf("marimba C6: the fundamental peaks %.2f ms after the stroke without the tube, %.1f ms with it\n",
                1000.0 * when[0], 1000.0 * when[1]);
    EXPECT(when[0] < 0.003, "the bar alone peaks within 3 ms");
    EXPECT(when[1] > 0.005 && when[1] < 0.080, "with the tube, 5 to 80 ms after the stroke");

    // Half the knob is half the tube.
    double peak_at[3];
    const float amount[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kResonator, amount[which]);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 0.5f, kRate);
      peak_at[which] = bin_level(out.left, kRate, kC4, 2400, 4800);
    }
    std::printf("vibraphone C4 fundamental at Resonator 0, 0.5, 1: %.1f, %.1f, %.1f dB\n", db(peak_at[0]), db(peak_at[1]),
                db(peak_at[2]));
    EXPECT(peak_at[1] > 1.3 * peak_at[0] && peak_at[2] > 1.2 * peak_at[1], "Resonator raises the fundamental all the way up its travel");
  }

  // --- The motor --------------------------------------------------------------------------

  // Motor: the fundamental throbs at the knob's rate, the overtones do not,
  // and every bar throbs together (one shaft).
  {
    for (float rate : {3.0f, 7.0f}) {
      fresh(device, Mallets::kVibraphone);
      device.set_param(p::kResonator, 1.0f);
      device.set_param(p::kMotor, 1.0f);
      device.set_param(p::kMotorRate, rate);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 4.5f, kRate);
      std::vector<float> low = about_the_decay(envelope(out.left, kRate, kC4, 9600, 960, 240));
      std::vector<float> high = about_the_decay(envelope(out.left, kRate, 4.0 * kC4, 9600, 960, 240));
      const double found = dominant_frequency(low, 200.0, 1.0, 15.0);
      std::snprintf(label, sizeof label,
                    "motor at %.0f Hz: the fundamental pulses at %.3f Hz and swings %.1f dB; the 4x partial swings %.2f dB",
                    rate, found, swing(low), swing(high));
      std::printf("%s\n", label);
      EXPECT(std::fabs(found / rate - 1.0) < 0.02, "the fundamental pulses at Motor rate within 2 %");
      EXPECT(swing(low) > 4.0, "by more than 4 dB at full depth");
      EXPECT(swing(high) < 1.0, "while the 4x partial moves less than 1 dB");
    }
    double depth[3];
    const float amount[3] = {0.0f, 0.5f, 1.0f};
    for (int which = 0; which < 3; ++which) {
      fresh(device, Mallets::kVibraphone);
      device.set_param(p::kResonator, 1.0f);
      device.set_param(p::kMotor, amount[which]);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      depth[which] = swing(about_the_decay(envelope(out.left, kRate, kC4, 9600, 960, 240)));
    }
    std::printf("motor depth 0, 0.5, 1: the fundamental swings %.2f, %.1f, %.1f dB\n", depth[0], depth[1], depth[2]);
    EXPECT(depth[0] < 0.5, "motor off: the note is still");
    EXPECT(depth[1] > 1.5 && depth[1] < 0.7 * depth[2], "half depth is a gentler throb");

    // A shut tube rings longer: with the motor on the note outlasts the same note with the tube always open.
    double ring[2];
    for (int which = 0; which < 2; ++which) {
      fresh(device, Mallets::kVibraphone);
      device.set_param(p::kResonator, 1.0f);
      device.set_param(p::kMotor, which == 0 ? 0.0f : 1.0f);
      device.set_param(p::kMotorRate, 6.0f);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      Stereo out = render(device, 3.5f, kRate);
      // Whole motor turns apart, so the throb is at the same point in both windows.
      ring[which] = ring_time(out.left, kRate, kC4, 0.5, 3.0, 1.0 / 6.0);
    }
    std::printf("vibraphone C4 rings %.2f s with the tubes open, %.2f s with the motor shutting them half the time\n", ring[0], ring[1]);
    EXPECT(ring[1] > 1.15 * ring[0], "a note under a turning disc rings longer");

    // One shaft: two bars struck at different moments throb in step.
    fresh(device, Mallets::kVibraphone);
    device.set_param(p::kResonator, 1.0f);
    device.set_param(p::kMotor, 1.0f);
    device.set_param(p::kMotorRate, 4.0f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo lead = render(device, 0.13f, kRate);
    device.note_on(2, static_cast<float>(kC4 * 1.4983), 0.8f);
    Stereo both = concat(lead, render(device, 3.0f, kRate));
    std::vector<float> first = about_the_decay(envelope(both.left, kRate, kC4, 14400, 960, 240));
    std::vector<float> second = about_the_decay(envelope(both.left, kRate, kC4 * 1.4983, 14400, 960, 240));
    const double together = correlation(first, second);
    std::printf("two bars struck 130 ms apart: their throbs correlate %.2f\n", together);
    EXPECT(together > 0.9, "all bars pulse together");

    // No tube, no motor: Motor needs Resonator, as its description says.
    Stereo with, without;
    for (int which = 0; which < 2; ++which) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kMotor, which == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(kC4), 0.8f);
      (which == 0 ? without : with) = render(device, 1.0f, kRate);
    }
    EXPECT(with.left == without.left, "with Resonator at 0 the motor changes nothing");
  }

  // --- The roll ---------------------------------------------------------------------------

  // Roll: a held key is struck again at the knob's rate, a little unevenly,
  // and holds its level; with Roll at zero a key is one stroke.
  {
    for (float rate : {8.0f, 12.0f}) {
      fresh(device, Mallets::kMarimba);
      device.set_param(p::kMallet, 0.7f);
      device.set_param(p::kRoll, rate);
      device.note_on(1, static_cast<float>(kC3), 0.8f);
      Stereo out = render(device, 6.2f, kRate);
      std::vector<double> at = onsets(out.left, kRate, 0.3);
      double sum = 0.0, squares = 0.0;
      const size_t gaps = at.size() > 1 ? at.size() - 1 : 1;
      for (size_t i = 1; i < at.size(); ++i) {
        const double gap = at[i] - at[i - 1];
        sum += gap;
        squares += gap * gap;
      }
      const double mean_gap = sum / gaps;
      const double spread = std::sqrt(std::max(0.0, squares / gaps - mean_gap * mean_gap)) / mean_gap;
      double loudest = -200.0, quietest = 200.0, total = 0.0;
      int windows = 0;
      for (size_t from = 48000; from + 12000 <= out.left.size(); from += 6000) {
        const double level = db(rms(out.left, from, from + 12000));
        loudest = std::max(loudest, level);
        quietest = std::min(quietest, level);
        total += level;
        ++windows;
      }
      const double middle = total / windows;
      std::snprintf(label, sizeof label,
                    "roll %.0f at C3: %zu strokes in 6.2 s, %.2f a second, gaps vary %.1f %%; level from 1 s on within %+.1f / %+.1f dB",
                    rate, at.size(), 1.0 / mean_gap, 100.0 * spread, loudest - middle, quietest - middle);
      std::printf("%s\n", label);
      EXPECT(std::fabs(1.0 / mean_gap / rate - 1.0) < 0.05, "strokes come at the knob's rate within 5 %");
      EXPECT(spread > 0.05 && spread < 0.20, "unevenly, by 5 to 20 %");
      EXPECT(loudest - middle < 2.0 && middle - quietest < 2.0, "and the roll holds its level within 2 dB");
    }

    // Higher bars are rolled faster: 12 % per octave above C3.
    fresh(device, Mallets::kMarimba);
    device.set_param(p::kMallet, 0.7f);
    device.set_param(p::kRoll, 8.0f);
    device.note_on(1, static_cast<float>(kC5), 0.8f);
    Stereo high = render(device, 6.2f, kRate);
    std::vector<double> at = onsets(high.left, kRate, 0.3);
    const double high_rate = (static_cast<double>(at.size()) - 1.0) / (at.back() - at.front());
    std::printf("roll 8 at C5: %.2f strokes a second\n", high_rate);
    EXPECT(std::fabs(high_rate / (8.0 * 1.24) - 1.0) < 0.05, "two octaves up the roll is 24 % faster");

    // Off: one key, one stroke.
    fresh(device, Mallets::kMarimba);
    device.set_param(p::kMallet, 0.7f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo single = render(device, 3.0f, kRate);
    std::vector<double> once = onsets(single.left, kRate, 0.0, 1.0e-4);
    std::printf("roll 0: %zu stroke in 3 s\n", once.size());
    EXPECT(once.size() == 1, "with Roll at zero a held key is struck exactly once");

    // The hands take turns at two places on the bar: the 9.9x partial, which
    // one hand finds nearer its node, comes out at two levels in turn.
    fresh(device, Mallets::kMarimba);
    device.set_param(p::kMallet, 0.7f);
    device.set_param(p::kRoll, 8.0f);
    device.note_on(1, static_cast<float>(kC3), 0.8f);
    Stereo rolled = render(device, 8.2f, kRate);
    std::vector<double> strokes = onsets(rolled.left, kRate, 0.3);
    double hand[2] = {0.0, 0.0};
    int count[2] = {0, 0};
    for (size_t i = 1; i + 1 < strokes.size(); ++i) {
      const size_t from = static_cast<size_t>(strokes[i] * kRate);
      hand[i & 1] += db(bin_level(rolled.left, kRate, 9.9 * kC3, from, 960));
      ++count[i & 1];
    }
    const double apart = std::fabs(hand[0] / count[0] - hand[1] / count[1]);
    std::printf("the two hands differ by %.1f dB in the 9.9x partial\n", apart);
    EXPECT(apart > 2.0, "the hands alternate between two strike points");

    // A chord becomes a pad: held with Roll it is still there after 4 s;
    // without, it has died. Letting go stops the roll.
    double held_level[2], start_level[2];
    const double chord[4] = {kC3, kC3 * 1.4983, kC4 * 1.2599, kC4 * 1.7818};
    Stereo let_go;
    for (int which = 0; which < 2; ++which) {
      fresh(device, Mallets::kMarimba);
      device.set_param(p::kRoll, which == 0 ? 0.0f : 11.0f);
      for (int n = 0; n < 4; ++n) device.note_on(n, static_cast<float>(chord[n]), 0.8f);
      Stereo out = render(device, 4.5f, kRate);
      start_level[which] = rms(out.left, 19200, 28800);
      held_level[which] = rms(out.left, 192000, 216000);
      if (which == 1) {
        for (int n = 0; n < 4; ++n) device.note_off(n);
        let_go = render(device, 8.0f, kRate);
      }
    }
    std::printf("a held marimba chord after 4 s: %.1f dB re its level at 0.5 s with Roll 11, %.1f dB without\n",
                db(held_level[1] / start_level[1]), db(held_level[0] / start_level[0]));
    EXPECT(db(held_level[1] / start_level[1]) > -6.0, "rolled, a held chord keeps its level");
    EXPECT(db(held_level[0] / start_level[0]) < -30.0, "struck once, it has died away");
    std::vector<double> late = onsets(let_go.left, kRate, 0.0);
    EXPECT(late.empty() || late.back() < 0.2, "no stroke later than a moment after the keys are let go");
    EXPECT(peak(let_go.left, 336000) == 0.0 && peak(let_go.right, 336000) == 0.0, "and the bars ring out to exact silence");

    // Bars that ring for a long time do not pile up: a roll tops the bar up, it does not add to it.
    fresh(device, Mallets::kVibraphone);
    device.set_param(p::kRoll, 9.0f);
    device.set_param(p::kMallet, 0.2f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo sung = render(device, 8.0f, kRate);
    const double first_stroke = rms(sung.left, 2400, 12000), settled = rms(sung.left, 288000, 384000);
    std::printf("a rolled vibraphone bar: %.1f dB re its first stroke after 6 s\n", db(settled / first_stroke));
    EXPECT(std::fabs(db(settled / first_stroke)) < 6.0, "a rolled metal bar settles near the level it was struck at");
  }

  // --- Levels, clicks, rules, cost --------------------------------------------------------

  // Levels: one note of each instrument at the default volume, what the app
  // plays (gain 0.8) across the keyboard, the velocity range, and ten notes
  // under the clip knee region, struck or rolled.
  {
    const char* names[5] = {"marimba", "vibraphone", "xylophone", "glockenspiel", "celesta"};
    for (int instrument = 0; instrument < 5; ++instrument) {
      device.init(kRate);
      device.set_param(p::kInstrument, static_cast<float>(instrument));
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 2.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      std::snprintf(label, sizeof label, "%s: one note at gain 0.7 peaks at %.1f dBFS (-24 to -10)", names[instrument], level);
      std::printf("%s\n", label);
      EXPECT(level > -24.0 && level < -10.0, label);
    }
    double quietest = 0.0, loudest = -200.0;
    for (double hz : {kC2, kC3, 220.0, kC4, kC5, kC6}) {
      device.init(kRate);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      const double level = db(std::max(peak(out.left), peak(out.right)));
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    std::snprintf(label, sizeof label, "the default patch at gain 0.8 peaks between %.1f and %.1f dBFS from C2 to C6 (-22 to -16)", quietest, loudest);
    std::printf("%s\n", label);
    EXPECT(quietest > -22.0 && loudest < -16.0, label);

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
    for (int pass = 0; pass < 3; ++pass) {
      device.init(kRate);
      if (pass == 1) device.set_param(p::kRoll, 11.0f);
      if (pass == 2) {
        device.set_param(p::kInstrument, static_cast<float>(Mallets::kVibraphone));
        device.set_param(p::kRoll, 16.0f);
        device.set_param(p::kDecay, 4.0f);
      }
      for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      Stereo out = render(device, pass == 2 ? 10.0f : 4.0f, kRate);
      const double here = std::max(peak(out.left), peak(out.right));
      std::printf("ten notes %s: peak %.2f\n", pass == 0 ? "struck" : pass == 1 ? "rolled" : "rolled at 16 on long-ringing vibraphone bars", here);
      worst = std::max(worst, here);
    }
    EXPECT(worst < 0.9, "ten notes, struck or rolled, stay under the clip knee region");
  }

  // Clicks. A stolen voice fades over 2 ms; a key struck again adds to its
  // bar; knobs move under a ringing chord without a step.
  {
    // Stealing: fifteen loud low notes and one quieter high one, which is the
    // one a seventeenth note takes. Eight tries, to catch it at different
    // points of its swing.
    double own = 0.0, taken = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kMallet, 0.0f);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kVolume, -18.0f);
      for (int n = 0; n < 15; ++n) device.note_on(n, 40.0f + 3.0f * n, 1.0f);
      device.note_on(15, 3000.0f, 0.9f);
      Stereo ringing = render(device, 0.3f + trial * 0.00002f, kRate);
      own = std::max(own, max_step(ringing.left, 4800));
      device.note_on(16, 80.0f, 0.2f);
      Stereo out = render(device, 0.02f, kRate);
      Stereo joined = concat(ringing, out);
      taken = std::max(taken, max_step(joined.left, ringing.size() - 2));
      const double high_left = bin_level(out.left, kRate, 3000.0, 480, 480);
      EXPECT(high_left < 0.01 * bin_level(ringing.left, kRate, 3000.0, 9600, 480), "the quietest voice is the one taken");
    }
    std::printf("stealing a 3 kHz note: largest step %.4f, %.4f while it rang\n", taken, own);
    EXPECT(taken < 1.1 * own, "stealing does not click");

    // The same key again while its bar rings: no second copy, no cancelling,
    // no step. Eight moments across one period of the note.
    bare(device, Mallets::kVibraphone);
    device.note_on(1, 220.0f, 0.7f);
    Stereo first = render(device, 0.5f, kRate);
    const double before = bin_level(first.left, kRate, 220.0, 12000, 12000);
    const double first_step = max_step(first.left);
    double least = 1.0e9, most = 0.0, again_step = 0.0;
    for (int n = 0; n < 8; ++n) {
      bare(device, Mallets::kVibraphone);
      device.note_on(1, 220.0f, 0.7f);
      render(device, 0.5f + n / (8.0f * 220.0f), kRate);
      device.note_on(1, 220.0f, 0.7f);
      Stereo second = render(device, 0.5f, kRate);
      const double after = bin_level(second.left, kRate, 220.0, 12000, 12000);
      least = std::min(least, after / before);
      most = std::max(most, after / before);
      again_step = std::max(again_step, max_step(second.left));
    }
    std::printf("a second equal stroke on a ringing bar leaves it between %.2fx and %.2fx as loud; largest step %.4f (%.4f for a first stroke)\n",
                least, most, again_step, first_step);
    EXPECT(least > 0.95 && most < 1.25, "a second stroke tops the bar up whenever it lands: it neither cancels nor doubles");
    EXPECT(again_step < 1.3 * first_step, "and makes no larger step than a first stroke");

    double with[15], without[15];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kMallet, 0.0f);
      device.set_param(p::kVolume, -12.0f);
      for (int n = 0; n < 15; ++n) device.note_on(10 + n, 300.0f + 100.0f * n, 0.3f);
      Stereo out = render(device, 0.2f, kRate);
      for (int hit = 0; hit < 12; ++hit) {
        if (pass == 1) {
          device.note_on(1, 3000.0f, 0.5f);
          if (hit & 1) device.note_off(1);  // held or released, the note is the same bar
        }
        out = render(device, 0.1f, kRate);
      }
      out = render(device, 0.5f, kRate);
      for (int n = 0; n < 15; ++n) (pass == 0 ? without : with)[n] = bin_level(out.left, kRate, 300.0 + 100.0 * n, 0, 24000);
    }
    double changed = 0.0;
    for (int n = 0; n < 15; ++n) changed = std::max(changed, std::fabs(with[n] / without[n] - 1.0));
    std::snprintf(label, sizeof label, "twelve strokes of one key take no voice from fifteen ringing notes (worst change %.3f)", changed);
    EXPECT(changed < 0.02, label);

    // Two notes in one block over a full pool of held notes: each takes its
    // own voice. (The second must not take the voice the first just took.)
    for (int held = 15; held <= 16; ++held) {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kMallet, 0.0f);
      for (int n = 0; n < held; ++n) device.note_on(n, 200.0f + 40.0f * n, 0.8f);
      render(device, 0.5f, kRate);
      device.note_on(100, 2130.0f, 0.8f);  // clear of every partial of the held notes
      device.note_on(101, 2630.0f, 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      const double first = db(bin_level(out.left, kRate, 2130.0, 2400, 9600));
      const double second = db(bin_level(out.left, kRate, 2630.0, 2400, 9600));
      std::snprintf(label, sizeof label, "%d held notes, then two in one block: both sound (%.1f and %.1f dB)", held, first, second);
      std::printf("%s\n", label);
      EXPECT(first > -40.0 && second > -40.0, label);
    }

    // A key let go before the voice it took has finished fading never sounds.
    {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kMallet, 0.0f);
      for (int n = 0; n < 16; ++n) device.note_on(n, 200.0f + 40.0f * n, 0.8f);
      Stereo ringing = render(device, 0.5f, kRate);
      device.note_on(100, 2130.0f, 0.8f);
      device.note_off(100);
      Stereo out = render(device, 0.3f, kRate);
      Stereo joined = concat(ringing, out);
      std::snprintf(label, sizeof label, "a key released before its stolen voice starts never sounds (its pitch at %.1f dB)",
                    db(bin_level(out.left, kRate, 2130.0, 2400, 9600)));
      EXPECT(bin_level(out.left, kRate, 2130.0, 2400, 9600) < 1.0e-4, label);
      EXPECT(max_step(joined.left, ringing.size() - 2) < 1.1 * max_step(ringing.left, 4800), "and the voice it took leaves without a click");
    }

    // A key press on a ringing bar is not kept waiting: the stroke goes with
    // the bar's swing, up or down, so at most half a period away.
    for (double hz : {kC2, kC4}) {
      double latest = 0.0;
      for (int n = 0; n < 24; ++n) {
        Stereo out[2];
        for (int pass = 0; pass < 2; ++pass) {
          bare(device, Mallets::kVibraphone);
          device.note_on(1, static_cast<float>(hz), 0.8f);
          render(device, 0.4f + n / (24.0f * static_cast<float>(hz)), kRate, 1);
          if (pass == 1) device.note_on(1, static_cast<float>(hz), 0.8f);
          out[pass] = render(device, 0.05f, kRate, 1);
        }
        size_t at = out[0].size();
        for (size_t i = 0; i < out[0].size() && at == out[0].size(); ++i) {
          if (std::fabs(out[1].left[i] - out[0].left[i]) > 1.0e-7f) at = i;
        }
        latest = std::max(latest, at / static_cast<double>(kRate));
      }
      std::snprintf(label, sizeof label, "a second stroke at %.0f Hz starts at most %.2f ms after its key (half a period is %.2f ms)", hz,
                    latest * 1000.0, 500.0 / hz);
      std::printf("%s\n", label);
      EXPECT(latest < 0.5 / hz + 3.0 / kRate, label);
    }

    // The instrument is read when a bar is struck: a ringing bar keeps what
    // it is, the next note is the new instrument, and the same key again
    // starts a new bar and lets the old one go.
    {
      bare(device, Mallets::kVibraphone);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.3f, kRate);
      device.set_param(p::kInstrument, static_cast<float>(Mallets::kGlockenspiel));
      device.note_on(2, 330.0f, 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      const double old_fourth = bin_level(out.left, kRate, 880.0, 0, 9600);
      const double new_partial = bin_level(out.left, kRate, 330.0 * 2.757, 0, 9600);
      const double new_fourth = bin_level(out.left, kRate, 1320.0, 0, 9600);
      std::snprintf(label, sizeof label, "after Instrument moves, the ringing bar keeps its 4x (%.1f dB) and the next note is uncut (2.757x %.1f dB, 4x %.1f dB)",
                    db(old_fourth), db(new_partial), db(new_fourth));
      std::printf("%s\n", label);
      EXPECT(old_fourth > 10.0 * new_fourth && new_partial > 10.0 * new_fourth, label);
      device.set_param(p::kDamper, 1.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo again = render(device, 1.0f, kRate);
      const double glock = bin_level(again.left, kRate, 220.0 * 2.757, 24000, 12000);
      const double vibes = bin_level(again.left, kRate, 880.0, 24000, 12000);
      std::snprintf(label, sizeof label, "the same key on the new instrument is a new bar (2.757x %.1f dB) and the old one is damped (4x %.1f dB)",
                    db(glock), db(vibes));
      std::printf("%s\n", label);
      EXPECT(glock > 30.0 * vibes, label);
    }

    // One long-ringing bar under the fastest roll does not pile up.
    {
      bare(device, Mallets::kVibraphone);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kRoll, 16.0f);
      device.note_on(1, static_cast<float>(kC2), 0.8f);
      Stereo out = render(device, 16.0f, kRate);
      const double first = bin_level(out.left, kRate, kC2, 2400, 9600);
      const double late = bin_level(out.left, kRate, kC2, 15 * 48000, 24000);
      std::snprintf(label, sizeof label, "a vibraphone C2 that rings a minute, rolled at 16 for 15 s: %.1f dB re its first stroke", db(late / first));
      std::printf("%s\n", label);
      EXPECT(db(late / first) < 4.0, label);
    }

    // At a low sample rate the modes that would pass Nyquist are left out.
    {
      device.init(22050.0f);
      device.set_param(p::kInstrument, static_cast<float>(Mallets::kGlockenspiel));
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kWidth, 0.0f);
      device.note_on(1, static_cast<float>(kC7), 0.9f);
      Stereo out = render(device, 0.5f, 22050.0f);
      const double fundamental = bin_level(out.left, 22050.0, kC7, 0, 4410);
      const double folded = bin_level(out.left, 22050.0, 22050.0 - 5.404 * kC7, 0, 4410);
      std::snprintf(label, sizeof label, "glockenspiel C7 at 22.05 kHz: the 5.404x partial folded back is %.1f dB under the fundamental", db(fundamental / folded));
      std::printf("%s\n", label);
      EXPECT(db(fundamental / folded) > 50.0, label);
    }

    // Knobs under a ringing chord.
    const int swept[6] = {p::kResonator, p::kMotor, p::kMotorRate, p::kDecay, p::kWidth, p::kDamper};
    const char* names[6] = {"resonator", "motor", "motor rate", "decay", "width", "damper"};
    for (int which = 0; which < 6; ++which) {
      double step[2];
      for (int pass = 0; pass < 2; ++pass) {
        fresh(device, Mallets::kVibraphone);
        device.set_param(p::kMallet, 0.2f);
        device.set_param(p::kMotor, 0.6f);
        device.set_param(p::kMotorRate, 6.0f);
        for (int n = 0; n < 4; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 7 / 12.0f), 0.8f);
        render(device, 0.3f, kRate);
        device.note_off(3);  // the damper has a released bar to work on
        Stereo out;
        const int id = swept[which];
        for (int k = 0; k < 200; ++k) {
          const float t = 0.5f + (0.5f * std::sin(k * 0.21f) + (k % 17 == 0 ? 0.3f : 0.0f) - 0.25f);
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
    // Roll is its own case: a stroke is steeper than a ringing bar, so the
    // chord it is compared with rolls too, at a fixed rate.
    double rolled[2];
    for (int pass = 0; pass < 2; ++pass) {
      fresh(device, Mallets::kMarimba);
      device.set_param(p::kRoll, 10.0f);
      for (int n = 0; n < 4; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 7 / 12.0f), 0.8f);
      render(device, 0.3f, kRate);
      Stereo out;
      for (int k = 0; k < 400; ++k) {
        if (pass == 1) device.set_param(p::kRoll, 10.0f + 6.0f * std::sin(k * 0.21f));
        out = concat(out, render(device, 0.005f, kRate, 64));
      }
      rolled[pass] = std::max(max_step(out.left), max_step(out.right));
    }
    std::snprintf(label, sizeof label, "sweeping roll under a rolling chord: largest step %.4f (%.4f at a fixed rate)", rolled[1], rolled[0]);
    std::printf("%s\n", label);
    EXPECT(rolled[1] < 2.0 * rolled[0], label);
  }

  // The instrument rules where a roll and a motor could break them: block
  // size, a pile of notes, everything at once, and going back to sleep.
  {
    Stereo a, b;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kInstrument, static_cast<float>(Mallets::kVibraphone));
      device.set_param(p::kRoll, 11.0f);
      device.set_param(p::kMotor, 0.8f);
      device.note_on(1, 110.0f, 0.8f);
      device.note_on(2, 277.2f, 0.5f);
      device.note_on(3, 1661.2f, 0.6f);
      if (pass == 0) {
        a = render(device, 1.5f, kRate, 128);
      } else {
        b = render(device, 0.75f, kRate, 1);
        Stereo rest = render(device, 0.75f, kRate, 2048);
        b = concat(b, rest);
      }
    }
    double worst = 0.0;
    for (size_t i = 0; i < a.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    std::snprintf(label, sizeof label, "a rolled chord under the motor does not depend on the block size (max diff %g)", worst);
    EXPECT(worst < 1.0e-6, label);

    // Sixty notes over sixteen voices stay bounded and all come to rest.
    device.init(kRate);
    device.set_param(p::kRoll, 12.0f);
    bool bounded = true;
    for (int n = 0; n < 60; ++n) {
      device.note_on(n, 65.4f * std::pow(2.0f, static_cast<float>(n % 37) / 12.0f), 1.0f);
      Stereo out = render(device, 0.03f, kRate);
      bounded = bounded && finite(out.left) && peak(out.left) < 1.01 && peak(out.right) < 1.01;
    }
    EXPECT(bounded, "sixty rolled notes over sixteen voices stay bounded");
    for (int n = 0; n < 60; ++n) device.note_off(n);
    render(device, 14.0f, kRate);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "and every voice is freed");

    // Everything at its loudest and longest, at the top of the keyboard and
    // the bottom, at the lowest rate.
    for (int instrument = 0; instrument < 5; ++instrument) {
      device.init(44100.0f);
      device.set_param(p::kInstrument, static_cast<float>(instrument));
      device.set_param(p::kMallet, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      device.set_param(p::kResonator, 1.0f);
      device.set_param(p::kMotor, 1.0f);
      device.set_param(p::kMotorRate, 12.0f);
      device.set_param(p::kRoll, 16.0f);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kVolume, 6.0f);
      for (int n = 0; n < 16; ++n) device.note_on(n, n < 8 ? 20.0f + 3.0f * n : 4000.0f + 500.0f * (n - 8), 1.0f);
      Stereo out = render(device, 3.0f, 44100.0f);
      for (int n = 0; n < 16; ++n) device.note_on(n, n < 8 ? 20.0f + 3.0f * n : 4000.0f + 500.0f * (n - 8), 1.0f);
      Stereo more = render(device, 3.0f, 44100.0f);
      std::snprintf(label, sizeof label, "instrument %d: sixteen notes with everything at maximum stay finite and bounded", instrument);
      EXPECT(finite(out.left) && finite(more.right) && peak(out.left) < 1.01 && peak(more.left) < 1.01 && peak(more.right) < 1.01, label);
    }

    // A held note that has rung out frees its voice; a rolled one keeps sounding.
    bare(device, Mallets::kXylophone);
    device.set_param(p::kDecay, 0.25f);
    device.note_on(1, 880.0f, 0.8f);
    render(device, 2.0f, kRate);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(peak(quiet.left) == 0.0, "a held note that has rung out leaves exact silence");
    bare(device, Mallets::kXylophone);
    device.set_param(p::kDecay, 0.25f);
    device.set_param(p::kRoll, 6.0f);
    device.note_on(1, 880.0f, 0.8f);
    render(device, 10.0f, kRate);
    Stereo still = render(device, 0.5f, kRate);
    EXPECT(rms(still.left) > 1.0e-3, "a rolled key sounds for as long as it is held");
  }

  // Cost with every voice in use: sixteen bars rolled under the motor, and
  // sixteen long-ringing bars left to ring.
  {
    device.init(kRate);
    device.set_param(p::kInstrument, static_cast<float>(Mallets::kVibraphone));
    device.set_param(p::kRoll, 12.0f);
    device.set_param(p::kMotor, 0.7f);
    for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    render(device, 0.5f, kRate);
    report_cost("mallets (16 bars rolled under the motor)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
    device.init(kRate);
    device.set_param(p::kInstrument, static_cast<float>(Mallets::kVibraphone));
    device.set_param(p::kDecay, 4.0f);
    for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
    render(device, 0.5f, kRate);
    report_cost("mallets (16 bars ringing)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
  }

  return finish("mallets");
}
