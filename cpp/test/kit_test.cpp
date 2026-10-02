// Native checks of the shared DSP kit (cpp/kit): the primitives the ambient
// devices are built from are verified here once, so a device harness can
// assert behaviour instead of re-proving its filters. Compiled with the
// system C++ compiler by scripts/test-native.sh.

#include "../kit/kit.h"
#include <cstdlib>

#include "support/test_kit.h"

using namespace livemix;
using namespace testkit;

namespace {

constexpr float kRate = 48000.0f;

void test_sine_table() {
  kit::SineTable::init();
  double worst = 0.0;
  for (int i = 0; i < 20000; ++i) {
    const float phase = static_cast<float>(i) / 20000.0f * 3.0f - 1.0f;
    worst = std::max(worst, std::fabs(kit::SineTable::lookup(phase) - std::sin(2.0 * kPi * phase)));
  }
  EXPECT(worst < 2.0e-6, "sine table matches sin() to -114 dB");
}

void test_smoothers() {
  kit::Smoother s;
  s.set_time(0.005f, kRate);
  s.snap(0.0f);
  s.set_target(1.0f);
  float v = 0.0f;
  for (int i = 0; i < 240; ++i) v = s.next();
  EXPECT_NEAR(v, 1.0 - std::exp(-1.0), 0.01, "one-pole smoother covers 63 % in its time constant");
  for (int i = 0; i < 48000; ++i) v = s.next();
  EXPECT(v == 1.0f && s.settled(), "one-pole smoother lands exactly on its target");

  kit::LinearRamp r;
  r.set_time(0.01f, kRate);
  r.snap(0.0f);
  r.set_target(1.0f);
  for (int i = 0; i < 480; ++i) v = r.next();
  EXPECT(v == 1.0f, "linear ramp reaches the target in its time");

  kit::ControlClock clock;
  clock.reset(32);
  int fires = 0;
  for (int i = 0; i < 320; ++i) fires += clock.tick() ? 1 : 0;
  EXPECT(fires == 10, "control clock fires every period");
}

void test_delay() {
  static kit::DelayLine<1024> line;
  line.clear();
  std::vector<float> out;
  for (int i = 0; i < 400; ++i) {
    out.push_back(line.read(100));
    line.write(i == 0 ? 1.0f : 0.0f);
  }
  EXPECT(out[100] == 1.0f && out[99] == 0.0f && out[101] == 0.0f, "integer read delays by exactly d");

  line.clear();
  // A fractional read of a slow sine equals the sine evaluated d samples ago.
  double worst_linear = 0.0, worst_hermite = 0.0;
  for (int i = 0; i < 2000; ++i) {
    const float lin = line.read_linear(50.5f);
    const float her = line.read_hermite(50.5f);
    line.write(static_cast<float>(std::sin(2.0 * kPi * 440.0 * i / kRate)));
    if (i > 200) {
      const double expected = std::sin(2.0 * kPi * 440.0 * (i - 50.5) / kRate);
      worst_linear = std::max(worst_linear, std::fabs(lin - expected));
      worst_hermite = std::max(worst_hermite, std::fabs(her - expected));
    }
  }
  EXPECT(worst_linear < 1.0e-3, "linear read interpolates between samples");
  EXPECT(worst_hermite < 2.0e-5, "hermite read is two orders more exact than linear");

  static kit::AllpassDelay<1024> allpass;
  allpass.clear();
  std::vector<float> x = noise(1.0f, kRate, 0.5f);
  std::vector<float> y(x.size());
  for (size_t i = 0; i < x.size(); ++i) y[i] = allpass.process(x[i], 113, 0.6f);
  EXPECT_NEAR(rms(y) / rms(x), 1.0, 0.02, "Schroeder allpass preserves energy");
}

void test_filters() {
  kit::Svf svf;
  svf.set(1000.0f, 0.7071f, kRate);
  auto level_at = [&](float hz, int which) {
    svf.reset();
    std::vector<float> in = sine(hz, 0.5f, kRate);
    std::vector<float> out(in.size());
    for (size_t i = 0; i < in.size(); ++i) {
      svf.process(in[i]);
      out[i] = which == 0 ? svf.low : (which == 1 ? svf.high : svf.band * svf.k);
    }
    return db(tone_level(out, hz, kRate, in.size() / 2));
  };
  EXPECT_NEAR(level_at(1000.0f, 0), -3.01, 0.1, "SVF lowpass is -3 dB at the cutoff (Butterworth)");
  EXPECT_NEAR(level_at(100.0f, 0), 0.0, 0.05, "SVF lowpass passes the passband");
  EXPECT_NEAR(level_at(8000.0f, 0), -36.9, 1.5, "SVF lowpass falls 12 dB per octave");
  EXPECT_NEAR(level_at(1000.0f, 1), -3.01, 0.1, "SVF highpass is -3 dB at the cutoff");
  EXPECT_NEAR(level_at(1000.0f, 2), 0.0, 0.1, "SVF bandpass has unity gain at the centre");

  kit::Biquad bq;
  bq.set_peak(1000.0f, 1.0f, 6.0f, kRate);
  auto biquad_at = [&](float hz) {
    bq.reset();
    std::vector<float> in = sine(hz, 0.5f, kRate);
    std::vector<float> out(in.size());
    for (size_t i = 0; i < in.size(); ++i) out[i] = bq.process(in[i]);
    return db(tone_level(out, hz, kRate, in.size() / 2));
  };
  EXPECT_NEAR(biquad_at(1000.0f), 6.0, 0.05, "biquad peak has its gain at the centre");
  EXPECT_NEAR(biquad_at(50.0f), 0.0, 0.1, "biquad peak leaves the far band alone");
  bq.set_low_shelf(200.0f, -9.0f, kRate);
  EXPECT_NEAR(biquad_at(20.0f), -9.0, 0.3, "biquad low shelf reaches its gain below the corner");
  EXPECT_NEAR(biquad_at(5000.0f), 0.0, 0.1, "biquad low shelf is flat above the corner");
  bq.set_high_shelf(4000.0f, 6.0f, kRate);
  EXPECT_NEAR(biquad_at(18000.0f), 6.0, 0.3, "biquad high shelf reaches its gain above the corner");
  bq.set_lowpass(1000.0f, 0.7071f, kRate);
  EXPECT_NEAR(biquad_at(1000.0f), -3.01, 0.1, "biquad lowpass is -3 dB at the cutoff");
  bq.set_highpass(1000.0f, 0.7071f, kRate);
  EXPECT_NEAR(biquad_at(1000.0f), -3.01, 0.1, "biquad highpass is -3 dB at the cutoff");

  kit::OnePole pole;
  pole.set_cutoff(1000.0f, kRate);
  std::vector<float> in = sine(1000.0f, 0.5f, kRate);
  std::vector<float> out(in.size());
  for (size_t i = 0; i < in.size(); ++i) out[i] = pole.lowpass(in[i]);
  EXPECT_NEAR(db(tone_level(out, 1000.0, kRate, in.size() / 2)), -3.0, 0.35,
              "one-pole lowpass is near -3 dB at its cutoff");

  kit::Allpass1 ap;
  ap.set_corner(1000.0f, kRate);
  for (size_t i = 0; i < in.size(); ++i) out[i] = ap.process(in[i]);
  EXPECT_NEAR(db(tone_level(out, 1000.0, kRate, in.size() / 2)), 0.0, 0.02,
              "first-order allpass has unity magnitude");
  const double shift = tone_phase(out, 1000.0, kRate, in.size() / 2, in.size()) -
                       tone_phase(in, 1000.0, kRate, in.size() / 2, in.size());
  EXPECT_NEAR(std::fabs(std::remainder(shift, 2.0 * kPi)), kPi / 2.0, 0.02,
              "first-order allpass turns 90 degrees at its corner");

  kit::DcBlocker dc;
  dc.set_cutoff(10.0f, kRate);
  std::vector<float> offset(48000, 0.5f);
  for (size_t i = 0; i < offset.size(); ++i) out.resize(offset.size()), out[i] = dc.process(offset[i]);
  EXPECT(std::fabs(out.back()) < 1.0e-3, "DC blocker removes a constant");

  kit::Ladder ladder;
  auto ladder_at = [&](float hz, float reso) {
    ladder.reset();
    ladder.set(1000.0f, reso, kRate);
    std::vector<float> tone = sine(hz, 0.5f, kRate, 0.05f);
    std::vector<float> filtered(tone.size());
    for (size_t i = 0; i < tone.size(); ++i) filtered[i] = ladder.process(tone[i]);
    return db(tone_level(filtered, hz, kRate, tone.size() / 2) / 0.05);
  };
  EXPECT_NEAR(ladder_at(100.0f, 0.0f), 0.0, 0.2, "ladder passes the passband with no resonance");
  EXPECT_NEAR(ladder_at(1000.0f, 0.0f), -12.0, 0.5, "ladder is four one-poles: -12 dB at the cutoff");
  EXPECT(ladder_at(8000.0f, 0.0f) < -65.0, "ladder falls 24 dB per octave");
  EXPECT(ladder_at(1000.0f, 0.9f) > ladder_at(1000.0f, 0.0f) + 12.0, "ladder resonance peaks at the cutoff");
  ladder.reset();
  ladder.set(1000.0f, 1.0f, kRate);
  double worst = 0.0;
  for (int i = 0; i < 96000; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(ladder.process(i < 100 ? 1.0f : 0.0f))));
  }
  EXPECT(worst < 4.0, "ladder stays bounded at full resonance");
}

void test_oscillators() {
  kit::SineTable::init();
  kit::BlepOsc osc;
  // Aliasing of a 1244.5 Hz saw: energy at a frequency no harmonic lands on.
  auto render_shape = [&](int shape, float hz, std::vector<float>* out) {
    osc.reset();
    out->resize(96000);
    for (float& v : *out) {
      v = shape == 0 ? osc.saw(hz / kRate) : (shape == 1 ? osc.pulse(hz / kRate, 0.5f) : osc.triangle(hz / kRate));
    }
  };
  std::vector<float> wave;
  render_shape(0, 1244.5f, &wave);
  EXPECT_NEAR(tone_level(wave, 1244.5, kRate), 2.0 / kPi, 0.02, "saw fundamental is 2/pi");
  EXPECT_NEAR(tone_level(wave, 2489.0, kRate), 1.0 / kPi, 0.02, "saw second harmonic is 1/pi");
  // The 39th harmonic (48535.5 Hz) folds to 535.5 Hz, between the first two
  // partials where nothing masks it. A naive saw leaves it at -35.7 dB.
  const double alias = tone_level(wave, 39.0 * 1244.5 - 48000.0, kRate);
  EXPECT(db(alias) < -90.0, "PolyBLEP saw keeps a harmonic folded into the low band below -90 dB");
  EXPECT(std::fabs(mean(wave)) < 2.0e-3, "saw has no DC");

  render_shape(1, 220.0f, &wave);
  EXPECT_NEAR(tone_level(wave, 220.0, kRate), 4.0 / kPi, 0.03, "square fundamental is 4/pi");
  EXPECT(tone_level(wave, 440.0, kRate) < 0.01, "square has no even harmonics");
  render_shape(2, 220.0f, &wave);
  EXPECT_NEAR(tone_level(wave, 220.0, kRate), 8.0 / (kPi * kPi), 0.02, "triangle fundamental is 8/pi^2");
  EXPECT_NEAR(tone_level(wave, 660.0, kRate), 8.0 / (9.0 * kPi * kPi), 0.01, "triangle third harmonic is 1/9");

  kit::Noise noise_source;
  noise_source.seed(7);
  std::vector<float> white_noise(96000), pink_noise(96000), brown_noise(96000);
  for (size_t i = 0; i < white_noise.size(); ++i) {
    white_noise[i] = noise_source.white();
    pink_noise[i] = noise_source.pink();
    brown_noise[i] = noise_source.brown();
  }
  EXPECT_NEAR(rms(white_noise), 1.0 / std::sqrt(3.0), 0.02, "white noise is uniform in [-1, 1)");
  const double white_tilt = energy_above(white_noise, 2000.0, kRate);
  const double pink_tilt = energy_above(pink_noise, 2000.0, kRate);
  const double brown_tilt = energy_above(brown_noise, 2000.0, kRate);
  EXPECT(pink_tilt < white_tilt * 0.6 && brown_tilt < pink_tilt * 0.2,
         "pink is darker than white and brown darker than pink");
  EXPECT(peak(pink_noise) < 1.0 && peak(brown_noise) <= 1.0, "coloured noise stays inside full scale");
}

void test_lfo_and_env() {
  kit::SineTable::init();
  kit::Lfo lfo;
  lfo.seed(3);
  lfo.set_rate(2.0f, kRate);
  for (int shape = 0; shape < kit::Lfo::kNumShapes; ++shape) {
    lfo.reset();
    float lo = 1.0f, hi = -1.0f;
    for (int i = 0; i < 96000; ++i) {
      const float v = lfo.next(shape);
      lo = std::min(lo, v);
      hi = std::max(hi, v);
    }
    EXPECT(lo >= -1.0001f && hi <= 1.0001f && hi - lo > 0.5f, "every LFO shape is bipolar and moves");
  }
  // Smooth random has no steps.
  lfo.reset();
  float previous = lfo.next(kit::Lfo::kSmooth);
  float worst = 0.0f;
  for (int i = 0; i < 96000; ++i) {
    const float v = lfo.next(kit::Lfo::kSmooth);
    worst = std::max(worst, std::fabs(v - previous));
    previous = v;
  }
  EXPECT(worst < 1.0e-3f, "smooth random LFO is continuous");

  kit::Drift drift;
  drift.seed(11);
  drift.set_rate(0.1f, kRate);
  float lo = 1.0f, hi = -1.0f;
  for (int i = 0; i < 48000 * 60; i += 32) {
    const float v = drift.next(32);
    lo = std::min(lo, v);
    hi = std::max(hi, v);
  }
  EXPECT(lo >= -1.0f && hi <= 1.0f && hi - lo > 1.0f, "drift wanders within ±1");

  kit::Adsr env;
  env.set_sample_rate(kRate);
  env.set(0.1f, 0.2f, 0.5f, 0.3f);
  env.gate_on();
  int attack_samples = 0;
  while (env.stage() == kit::Adsr::kAttack && attack_samples < 100000) {
    env.next();
    ++attack_samples;
  }
  EXPECT_NEAR(attack_samples, 4800, 10, "attack reaches the peak in the attack time");
  for (int i = 0; i < 48000; ++i) env.next();
  EXPECT_NEAR(env.level(), 0.5, 1.0e-3, "decay settles on the sustain level");
  env.gate_off();
  for (int i = 0; i < static_cast<int>(0.3f * kRate); ++i) env.next();
  EXPECT_NEAR(db(env.level() / 0.5), -60.0, 0.5, "release covers 60 dB in the release time");
  for (int i = 0; i < 48000; ++i) env.next();
  EXPECT(!env.active() && env.level() == 0.0f, "envelope goes idle at exact zero");

  // A fast release cut short by the next note: that note releases at the set
  // time. (A voice stolen while it is being faded for a steal.)
  for (int restart = 0; restart < 2; ++restart) {
    env.gate_on();
    for (int i = 0; i < 48000; ++i) env.next();
    env.fast_release(0.03f);
    for (int i = 0; i < 48; ++i) env.next();
    if (restart == 1) env.reset();
    env.gate_on();
    for (int i = 0; i < 48000; ++i) env.next();
    env.gate_off();
    for (int i = 0; i < static_cast<int>(0.15f * kRate); ++i) env.next();
    EXPECT_NEAR(db(env.level() / 0.5), -30.0, 0.5,
                restart == 0 ? "a note after a cut-short fast release keeps the set release"
                             : "reset clears a fast release");
    for (int i = 0; i < 48000; ++i) env.next();
  }
  env.gate_on();
  for (int i = 0; i < 48000; ++i) env.next();
  env.fast_release(0.03f);
  for (int i = 0; i < static_cast<int>(0.03f * kRate); ++i) env.next();
  EXPECT_NEAR(db(env.level() / 0.5), -60.0, 0.5, "a fast release covers 60 dB in its own time");
  for (int i = 0; i < 4800; ++i) env.next();

  kit::Follower follower;
  follower.set(0.001f, 0.1f, kRate);
  float level = 0.0f;
  for (float v : sine(1000.0f, 0.2f, kRate, 0.5f)) level = follower.process(v);
  EXPECT(level > 0.4f && level <= 0.5f, "follower tracks a sine's peak");
}

struct TestVoice {
  bool on = false;
  bool rel = false;
  float lvl = 0.0f;
  bool active() const { return on; }
  bool releasing() const { return rel; }
  float level() const { return lvl; }
};

void test_voices() {
  static kit::VoicePool<TestVoice, 4> pool;
  pool.reset();
  bool stolen = false;
  for (int n = 0; n < 4; ++n) {
    const int v = pool.note_on(60 + n, &stolen);
    pool.voices[v].on = true;
    pool.voices[v].lvl = 1.0f - 0.1f * static_cast<float>(n);
    EXPECT(!stolen, "free voices are taken before any is stolen");
  }
  EXPECT(pool.count_active() == 4, "four notes use four voices");
  pool.voices[pool.find_held(61)].rel = true;
  const int taken = pool.note_on(70, &stolen);
  EXPECT(stolen && pool.note_id_of(taken) == 70, "a full pool steals");
  EXPECT(pool.find_held(61) < 0, "the releasing voice is stolen first");
  pool.voices[taken].rel = false;
  const int second = pool.note_on(71, &stolen);
  EXPECT(stolen && pool.voices[second].lvl == 0.7f, "then the quietest held voice");
  pool.set_limit(2);
  for (TestVoice& voice : pool.voices) voice.on = false;
  int highest = 0;
  for (int n = 0; n < 6; ++n) {
    const int v = pool.note_on(n, &stolen);
    pool.voices[v].on = true;
    highest = std::max(highest, v);
  }
  EXPECT(highest == 1, "the limit caps which voices new notes may take");
}

void test_fdn() {
  float v[8] = {1, 2, 3, 4, 5, 6, 7, 8};
  double before = 0.0, after = 0.0;
  for (float x : v) before += x * x;
  kit::hadamard<8>(v);
  for (float x : v) after += x * x;
  EXPECT_NEAR(after, before, 1.0e-3, "Hadamard mixing is lossless");
  kit::hadamard<8>(v);
  EXPECT_NEAR(v[0], 1.0, 1.0e-5, "Hadamard is its own inverse");
  kit::householder<8>(v);
  after = 0.0;
  for (float x : v) after += x * x;
  EXPECT_NEAR(after, before, 1.0e-3, "Householder mixing is lossless");

  int lengths[8];
  kit::spread_lengths<8>(1000.0f, 4000.0f, lengths);
  bool ordered = true;
  for (int i = 1; i < 8; ++i) ordered = ordered && lengths[i] > lengths[i - 1];
  EXPECT(ordered && lengths[0] >= 1000 && lengths[7] <= 4100, "delay lengths spread between the bounds");
  EXPECT_NEAR(db(std::pow(kit::rt60_gain(4800.0f, 2.0f, kRate), 20.0)), -60.0, 0.01,
              "rt60 gain loses 60 dB over the decay time");
}

void test_hilbert() {
  static kit::Hilbert hilbert;
  double worst_phase = 0.0, worst_gain = 0.0;
  for (float hz : {60.0f, 150.0f, 440.0f, 1000.0f, 4000.0f, 10000.0f, 16000.0f}) {
    hilbert.reset();
    std::vector<float> in = sine(hz, 1.0f, kRate);
    std::vector<float> a(in.size()), b(in.size());
    for (size_t i = 0; i < in.size(); ++i) hilbert.process(in[i], &a[i], &b[i]);
    const size_t from = in.size() / 2;
    const double difference = std::remainder(
        tone_phase(a, hz, kRate, from, in.size()) - tone_phase(b, hz, kRate, from, in.size()), 2.0 * kPi);
    worst_phase = std::max(worst_phase, std::fabs(std::fabs(difference) - kPi / 2.0));
    if (std::getenv("KIT_VERBOSE")) std::printf("  hilbert %7.0f Hz: phase difference %.4f rad\n", hz, difference);
    worst_gain = std::max(worst_gain, std::fabs(db(tone_level(a, hz, kRate, from) / tone_level(b, hz, kRate, from))));
    worst_gain = std::max(worst_gain, std::fabs(db(tone_level(a, hz, kRate, from))));
  }
  std::printf("  hilbert: worst phase error %.4f rad, worst gain error %.4f dB (60 Hz..16 kHz)\n", worst_phase,
              worst_gain);
  EXPECT(worst_phase < 0.02, "Hilbert pair stays within 1.2 degrees of quadrature from 60 Hz to 16 kHz");
  EXPECT(worst_gain < 0.05, "Hilbert pair has unity gain on both outputs");
}

void test_fft() {
  static kit::Fft<1024> fft;
  fft.init();
  static float re[1024], im[1024], original[1024];
  for (int i = 0; i < 1024; ++i) {
    original[i] = re[i] = static_cast<float>(std::sin(2.0 * kPi * 16.0 * i / 1024.0)) + 0.25f * white();
    im[i] = 0.0f;
  }
  fft.forward(re, im);
  const double bin16 = std::sqrt(static_cast<double>(re[16]) * re[16] + static_cast<double>(im[16]) * im[16]);
  EXPECT_NEAR(bin16 / 512.0, 1.0, 0.05, "a sine on bin 16 lands in bin 16");
  fft.inverse(re, im);
  double worst = 0.0;
  for (int i = 0; i < 1024; ++i) worst = std::max(worst, std::fabs(re[i] / 1024.0 - original[i]));
  EXPECT(worst < 1.0e-5, "forward then inverse returns the signal");
}

// forward_real against forward on one real signal, every bin from 0 to N/2.
// `worst` is the largest difference as a fraction of the largest bin;
// `unequal` counts the bins that are not the same floats.
enum RealFftSignal { kNoiseSignal, kTonesSignal, kOffsetSignal, kBinToneSignal, kClicksSignal };

template <int N>
void compare_real_fft(RealFftSignal signal, double* worst, int* unequal, int* bins) {
  static kit::Fft<N> fft;
  static float x[N], re[N], im[N], packed[N];
  fft.init();
  rng_state() = 0x5EEDu + static_cast<uint32_t>(N);
  for (int n = 0; n < N; ++n) {
    if (signal == kNoiseSignal) {
      x[n] = white();
    } else if (signal == kTonesSignal || signal == kBinToneSignal) {
      // Two tones under a Hann window, so most bins hold leakage far below
      // the peaks: both between bins, or the stronger one on a bin.
      const double hann = 0.5 - 0.5 * std::cos(2.0 * kPi * n / N);
      const double bin = signal == kBinToneSignal ? N / 8 : N / 8 + 0.31;
      x[n] = static_cast<float>(
          hann * (std::sin(2.0 * kPi * bin * n / N) + 0.3 * std::sin(2.0 * kPi * 2.37 * n / N + 0.4)));
    } else if (signal == kOffsetSignal) {
      x[n] = 0.25f + ((n & 1) ? -0.5f : 0.5f) + 0.01f * white();  // bins 0 and N/2
    } else {
      x[n] = n == 5 ? -0.5f : (n == N / 2 + 3 ? 1.0f : 0.0f);  // two clicks in silence
    }
    re[n] = x[n];
    im[n] = 0.0f;
  }
  fft.forward(re, im);
  fft.forward_real([](int n) { return x[n]; }, packed);
  double largest = 0.0;
  for (int k = 0; k <= N / 2; ++k) {
    largest = std::max(largest, std::hypot(static_cast<double>(re[k]), static_cast<double>(im[k])));
  }
  for (int k = 0; k <= N / 2; ++k) {
    const float real_re = packed[k];
    const float real_im = (k == 0 || k == N / 2) ? 0.0f : packed[N - k];
    const double off_re = std::fabs(static_cast<double>(real_re) - re[k]);
    const double off_im = std::fabs(static_cast<double>(real_im) - im[k]);
    *worst = std::max(*worst, std::max(off_re, off_im) / largest);
    if (real_re != re[k] || real_im != im[k]) ++*unequal;
    ++*bins;
  }
}

void test_real_fft() {
  // The tone on a bin and the clicks cancel exactly in places, the other
  // signals nowhere.
  double worst = 0.0, worst_exact = 0.0;
  int unequal = 0, unequal_exact = 0, bins = 0, bins_exact = 0;
  for (RealFftSignal signal : {kNoiseSignal, kTonesSignal, kOffsetSignal, kBinToneSignal, kClicksSignal}) {
    const bool exact = signal == kBinToneSignal || signal == kClicksSignal;
    double* w = exact ? &worst_exact : &worst;
    int* u = exact ? &unequal_exact : &unequal;
    int* b = exact ? &bins_exact : &bins;
    // 8, 32 and 2048 have an odd number of stages after the first pass, the
    // others an even one; 4096 is the frame of the analysers.
    compare_real_fft<8>(signal, w, u, b);
    compare_real_fft<16>(signal, w, u, b);
    compare_real_fft<32>(signal, w, u, b);
    compare_real_fft<64>(signal, w, u, b);
    compare_real_fft<1024>(signal, w, u, b);
    compare_real_fft<2048>(signal, w, u, b);
    compare_real_fft<4096>(signal, w, u, b);
    compare_real_fft<8192>(signal, w, u, b);
  }
  std::printf("  real fft: %d of %d bins differ from forward() on noise and tones (worst %.3g of the largest bin),"
              " %d of %d on a tone on a bin and on clicks (worst %.3g)\n",
              unequal, bins, worst, unequal_exact, bins_exact, worst_exact);
  EXPECT(worst < 1.0e-6, "forward_real matches forward on a real signal in every bin");
  // Where a real part cancels exactly, all that is left of it is the 6e-17
  // the table holds for the cosine of a quarter turn, and forward() carries
  // that into its mirrored half with the other sign.
  EXPECT(worst_exact < 1.0e-12, "forward_real matches forward where the signal cancels exactly");
#if !defined(__FP_FAST_FMAF) && !defined(FP_FAST_FMAF)
  // With no fused multiply-add for the compiler to contract into (x86-64,
  // WASM) the two do the same arithmetic, so the floats are the same.
  EXPECT(unequal == 0, "forward_real gives the floats forward gives");
#endif
}

void test_pitch_shifter() {
  kit::SineTable::init();
  static kit::DelayPitchShifter<8192> shifter;
  for (float ratio : {2.0f, 0.5f, 1.4983f}) {
    shifter.clear();
    shifter.set_window(4096.0f);
    std::vector<float> in = sine(440.0f, 2.0f, kRate, 0.5f);
    std::vector<float> out(in.size());
    for (size_t i = 0; i < in.size(); ++i) out[i] = shifter.process(in[i], ratio);
    const double found = dominant_frequency(out, kRate, 100.0, 2000.0, in.size() / 2);
    // The two heads splice at the window rate, so the line spectrum sits on
    // multiples of it around the target; allow one and a half of them.
    const double splice_hz = std::fabs(1.0 - ratio) * kRate / 4096.0;
    EXPECT_NEAR(found, 440.0 * ratio, 1.5 * splice_hz + 1.0, "delay pitch shifter moves a tone by its ratio");
    EXPECT_NEAR(rms(out, in.size() / 2) / rms(in), 1.0, 0.25, "delay pitch shifter keeps the level");
  }
  shifter.clear();
  std::vector<float> in = sine(440.0f, 0.5f, kRate, 0.5f);
  std::vector<float> out(in.size());
  for (size_t i = 0; i < in.size(); ++i) out[i] = shifter.process(in[i], 1.0f);
  EXPECT_NEAR(tone_level(out, 440.0, kRate, in.size() / 2), 0.5, 0.01, "ratio 1 passes the signal");
}

void test_oversampler() {
  static kit::Halfband2x halfband;
  halfband.init();
  auto round_trip = [&](float hz) {
    halfband.reset();
    std::vector<float> in = sine(hz, 0.5f, kRate, 0.5f);
    std::vector<float> out(in.size());
    for (size_t i = 0; i < in.size(); ++i) {
      float a, b;
      halfband.up(in[i], &a, &b);
      out[i] = halfband.down(a, b);
    }
    return db(tone_level(out, hz, kRate, in.size() / 2) / 0.5);
  };
  EXPECT_NEAR(round_trip(100.0f), 0.0, 0.02, "2x round trip is flat in the bass");
  EXPECT_NEAR(round_trip(10000.0f), 0.0, 0.05, "2x round trip is flat at 10 kHz");
  EXPECT_NEAR(round_trip(18000.0f), 0.0, 0.3, "2x round trip is flat to 18 kHz");

  // Latency: an impulse comes back kLatency samples later.
  halfband.reset();
  int at = -1;
  float best = 0.0f;
  for (int i = 0; i < 200; ++i) {
    float a, b;
    halfband.up(i == 0 ? 1.0f : 0.0f, &a, &b);
    const float y = halfband.down(a, b);
    if (std::fabs(y) > best) {
      best = std::fabs(y);
      at = i;
    }
  }
  EXPECT(at == kit::Halfband2x::kLatency, "2x round trip delays by kLatency samples");

  // Images: the upsampled stream of a 20 kHz tone carries its image at 76 kHz
  // (96 kHz - 20 kHz) 60 dB down or better.
  halfband.reset();
  std::vector<float> in = sine(20000.0f, 0.5f, kRate, 0.5f);
  std::vector<float> up(in.size() * 2);
  for (size_t i = 0; i < in.size(); ++i) halfband.up(in[i], &up[2 * i], &up[2 * i + 1]);
  const double wanted = tone_level(up, 20000.0, 96000.0, up.size() / 2);
  const double image = tone_level(up, 28000.0, 96000.0, up.size() / 2);
  std::printf("  halfband: 20 kHz image at 28 kHz is %.1f dB below the tone\n", db(wanted / image));
  EXPECT(db(image / wanted) < -40.0, "upsampling suppresses the image of a 20 kHz tone by 40 dB or more");
  halfband.reset();
  in = sine(15000.0f, 0.5f, kRate, 0.5f);
  for (size_t i = 0; i < in.size(); ++i) halfband.up(in[i], &up[2 * i], &up[2 * i + 1]);
  EXPECT(db(tone_level(up, 33000.0, 96000.0, up.size() / 2) / tone_level(up, 15000.0, 96000.0, up.size() / 2)) < -75.0,
         "upsampling suppresses the image of a 15 kHz tone by 75 dB or more");
}

struct RingSource {
  const kit::DelayLine<65536>* line;
  float read(int, double position) const { return line->at_hermite(static_cast<float>(position)); }
};

void test_grains() {
  kit::SineTable::init();
  static kit::DelayLine<65536> line;
  line.clear();
  for (float v : sine(440.0f, 1.0f, kRate, 0.5f)) line.write(v);
  static kit::GrainPool<16> pool;
  pool.reset();
  RingSource source{&line};
  // One octave up: the grain reads at rate 2.
  std::vector<float> left(9600, 0.0f), right(9600, 0.0f);
  EXPECT(pool.spawn(1000.0, 2.0f, 9600.0f, 0.0f, 1.0f, 1.0f), "a grain starts");
  for (size_t i = 0; i < left.size(); ++i) pool.render(source, &left[i], &right[i]);
  EXPECT(pool.active() == 0, "a grain ends after its length");
  EXPECT_NEAR(dominant_frequency(left, kRate, 200.0, 2000.0), 880.0, 9.0, "a grain at rate 2 plays an octave up");
  EXPECT_NEAR(rms(left), rms(right), 1.0e-6, "a centred grain is equal in both channels");
  EXPECT(std::fabs(left.front()) < 1.0e-3 && std::fabs(left.back()) < 1.0e-3, "the window starts and ends at zero");

  pool.reset();
  for (int i = 0; i < 16; ++i) EXPECT(pool.spawn(0.0, 1.0f, 100.0f, -1.0f, 1.0f, 0.5f), "the pool fills");
  EXPECT(!pool.spawn(0.0, 1.0f, 100.0f, 0.0f, 1.0f, 0.5f), "a full pool refuses another grain");
  std::fill(left.begin(), left.end(), 0.0f);
  std::fill(right.begin(), right.end(), 0.0f);
  for (size_t i = 0; i < 200; ++i) pool.render(source, &left[i], &right[i]);
  EXPECT(pool.active() == 0, "all grains retire");
  EXPECT(rms(right, 0, 200) < 1.0e-6 * (rms(left, 0, 200) + 1.0), "a hard-left grain is silent on the right");
}

void test_math() {
  EXPECT_NEAR(kit::midi_to_hz(69.0f), 440.0, 1.0e-3, "A4 is 440 Hz");
  EXPECT_NEAR(kit::hz_to_midi(261.6256f), 60.0, 1.0e-3, "middle C is note 60");
  EXPECT_NEAR(kit::db_to_gain(-6.0206f), 0.5, 1.0e-4, "-6.02 dB is half");
  EXPECT_NEAR(kit::semitones_to_ratio(12.0f), 2.0, 1.0e-5, "twelve semitones is an octave");
  double worst = 0.0;
  for (float x = -3.0f; x <= 3.0f; x += 0.01f) {
    worst = std::max(worst, std::fabs(static_cast<double>(kit::fast_tanh(x)) - std::tanh(static_cast<double>(x))));
  }
  EXPECT(worst < 0.025, "fast_tanh stays within 2.5 % of tanh");
  EXPECT(kit::fast_tanh(100.0f) == 1.0f && kit::fast_tanh(-100.0f) == -1.0f, "fast_tanh clamps");
  EXPECT(kit::soft_clip(0.4f) == 0.4f && kit::soft_clip(-0.5f) == -0.5f, "soft_clip is linear to 0.5");
  EXPECT(kit::soft_clip(100.0f) == 1.0f && kit::soft_clip(-100.0f) == -1.0f, "soft_clip lands on 1");
  {
    bool monotonic = true;
    for (float x = -4.0f; x < 4.0f; x += 0.01f) {
      if (kit::soft_clip(x + 0.01f) < kit::soft_clip(x)) monotonic = false;
    }
    EXPECT(monotonic, "soft_clip is monotonic");
  }
  {
    kit::SampleStore<1024>* store = new kit::SampleStore<1024>();
    for (int i = 0; i < 100; ++i) store->buffer()[i] = 0.01f * static_cast<float>(i);
    store->buffer()[7] = std::nanf("");
    store->commit(100, 1, 44100.0f);
    EXPECT(store->frames() == 100 && store->loaded(), "sample store keeps what was committed");
    EXPECT(store->at(1, 50) == 0.01f * 50.0f, "a mono sound is copied to the right channel");
    EXPECT(store->at(0, 7) == 0.0f, "non-finite samples are zeroed on commit");
    EXPECT_NEAR(store->read(0, 20.5), 0.205f, 1.0e-5, "sample store reads between frames");
    EXPECT(store->read(0, -5.0) == 0.0f && store->read(0, 100.0) == 0.0f, "silence outside the sound");
    EXPECT_NEAR(store->read_wrapped(0, 61.5, 20, 60), 0.215f, 1.0e-5, "wrapped reads fold into the loop");
    store->commit(5000, 2, 48000.0f);
    EXPECT(store->frames() == 1024, "a commit past capacity is clamped");
    delete store;

    kit::IdleGate gate;
    gate.reset(48000.0f, 0.01f);
    EXPECT(!gate.wake(false), "an idle gate starts asleep");
    EXPECT(gate.wake(true), "excitation wakes it");
    gate.settle(0.5f, 128);
    EXPECT(gate.wake(false), "it stays awake while there is output");
    for (int i = 0; i < 4; ++i) gate.settle(0.0f, 128);
    EXPECT(!gate.wake(false), "it sleeps after the hold of silence");
  }
  float dry, wet;
  kit::equal_power(0.5f, &dry, &wet);
  EXPECT_NEAR(dry * dry + wet * wet, 1.0, 1.0e-6, "equal-power mix keeps the power");
  kit::Rng rng;
  rng.seed(99);
  double sum = 0.0, squares = 0.0;
  for (int i = 0; i < 100000; ++i) {
    const float g = rng.gaussian();
    sum += g;
    squares += static_cast<double>(g) * g;
  }
  EXPECT_NEAR(sum / 100000.0, 0.0, 0.02, "gaussian has zero mean");
  EXPECT_NEAR(squares / 100000.0, 1.0, 0.03, "gaussian has unit variance");
}

// One plucked note, rendered: the exciter into the string.
template <int Size>
std::vector<float> pluck_note(kit::PluckedString<Size>& string, float hz, float rate, float seconds,
                              float position, float pick_hz = 6000.0f, float noise = 0.0f) {
  kit::PluckExciter exciter;
  kit::Rng rng;
  rng.seed(7);
  string.set_pluck_position(position);
  exciter.strike(1.0f, hz, pick_hz, noise, rate);
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (float& v : out) v = string.tick(exciter.next(rng));
  return out;
}

double cents_off(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }

// The strongest frequency within a quarter tone of `hz`, to a hundredth of a
// cent: a coarse scan and three finer ones (dominant_frequency's 600-step
// scan is for when the pitch is not known).
double partial_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  double best_hz = hz, best = -1.0;
  double span = 50.0;  // cents either side
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double candidate = centre * std::pow(2.0, span * i / 12000.0);
      const double level = tone_level(x, candidate, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = candidate;
      }
    }
    span /= 8.0;
  }
  return best_hz;
}

void test_plucked_string() {
  using String = kit::PluckedString<8192>;
  static String string;

  // In tune from C1 to C7 at every rate, bright and dull, in both tunings.
  {
    double worst = 0.0;
    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      for (String::Tuning tuning : {String::Tuning::Allpass, String::Tuning::Interpolated}) {
        for (float high : {0.05f, 3.0f}) {
          for (int midi : {24, 45, 64, 84, 96}) {
            const float hz = kit::midi_to_hz(static_cast<float>(midi));
            string.reset();
            string.set_tuning(tuning);
            string.set_frequency(hz, rate);
            string.set_decay(6.0f, high, 3000.0f);
            // The dull string's top notes are over in a few tenths of a second.
            const std::vector<float> out = pluck_note(string, hz, rate, 0.6f, 0.0f);
            const size_t from = static_cast<size_t>(0.05f * rate);
            const double got = partial_near(out, hz, rate, from, out.size());
            worst = std::max(worst, std::fabs(cents_off(got, hz)));
          }
        }
      }
    }
    std::printf("  string: worst tuning error %.2f cents (C1..C7, 44.1/48/96 kHz, both tunings)\n", worst);
    EXPECT(worst < 1.5, "a plucked string is in tune to 1.5 cents whatever its loss");
  }

  // The fundamental rings as long as it was asked to, and a high partial as
  // short as it was asked to.
  for (float hz : {82.41f, 220.0f, 659.26f}) {
    string.reset();
    string.set_frequency(hz, kRate);
    string.set_decay(4.0f, 0.8f, 3000.0f);
    const std::vector<float> out = pluck_note(string, hz, kRate, 3.0f, 0.0f);
    const size_t window = 12000;
    const double early = tone_level(out, hz, kRate, 12000, 12000 + window);
    const double late = tone_level(out, hz, kRate, 108000, 108000 + window);
    const double t60 = 60.0 * 2.0 / (db(early) - db(late));
    EXPECT_NEAR(t60, 4.0, 0.4, "the fundamental's decay time is the one set");
    // The partial nearest 3 kHz.
    const double n = std::round(3000.0 / hz);
    const double high_early = tone_level(out, n * hz, kRate, 2400, 2400 + 9600);
    const double high_late = tone_level(out, n * hz, kRate, 2400 + 9600, 2400 + 19200);
    const double high_t60 = 60.0 * 0.2 / (db(high_early) - db(high_late));
    EXPECT_NEAR(high_t60, 0.8, 0.2, "a partial at the high frequency decays in the time set for it");
  }

  // It darkens as it dies.
  {
    string.reset();
    string.set_frequency(110.0f, kRate);
    string.set_decay(5.0f, 0.4f, 2500.0f);
    const std::vector<float> out = pluck_note(string, 110.0f, kRate, 1.0f, 0.0f, 9000.0f);
    const double low_fall = db(tone_level(out, 110.0, kRate, 0, 12000)) - db(tone_level(out, 110.0, kRate, 24000, 36000));
    const double mid_fall = db(tone_level(out, 1100.0, kRate, 0, 12000)) - db(tone_level(out, 1100.0, kRate, 24000, 36000));
    const double high_fall = db(tone_level(out, 2530.0, kRate, 0, 12000)) - db(tone_level(out, 2530.0, kRate, 24000, 36000));
    EXPECT(low_fall < 8.0 && mid_fall > 2.0 * low_fall && high_fall > 2.0 * mid_fall,
           "the highs go first: the string darkens as it rings");
  }

  // Plucked at a fifth of its length, every fifth partial is missing.
  {
    string.reset();
    string.set_frequency(110.0f, kRate);
    string.set_decay(6.0f, 3.0f, 3000.0f);
    const std::vector<float> out = pluck_note(string, 110.0f, kRate, 1.0f, 0.2f);
    const double fourth = tone_level(out, 440.0, kRate, 0, 24000);
    const double fifth = tone_level(out, 550.0, kRate, 0, 24000);
    const double sixth = tone_level(out, 660.0, kRate, 0, 24000);
    EXPECT(db(fifth) < db(fourth) - 20.0 && db(fifth) < db(sixth) - 20.0,
           "a pluck at 1/5 leaves the 5th partial 20 dB under its neighbours");
    // 24000 samples are 55 whole periods, so the mean is the string's DC.
    EXPECT(std::fabs(mean(out, 0, 24000)) < 0.02, "and the comb leaves no DC on the string");
    string.reset();
    string.set_frequency(110.0f, kRate);
    string.set_decay(6.0f, 3.0f, 3000.0f);
    const std::vector<float> whole = pluck_note(string, 110.0f, kRate, 1.0f, 0.0f);
    EXPECT(std::fabs(mean(whole, 0, 24000)) > 0.2, "which a pluck with the comb off does");
  }

  // A stiff string: partial n at n·f0·sqrt((1 + B·n²) / (1 + B)).
  {
    const float hz = 82.41f;
    const double b = 2.0e-4;
    string.reset();
    string.set_frequency(hz, kRate);
    string.set_decay(8.0f, 4.0f, 3000.0f);
    string.set_stiffness(static_cast<float>(b), 4);
    const std::vector<float> out = pluck_note(string, hz, kRate, 2.0f, 0.0f, 9000.0f);
    double worst = 0.0;
    for (int n = 1; n <= 8; ++n) {
      const double wanted = n * hz * std::sqrt((1.0 + b * n * n) / (1.0 + b));
      const double got = partial_near(out, wanted, kRate, 4800, out.size());
      worst = std::max(worst, std::fabs(cents_off(got, wanted)));
    }
    std::printf("  string: stiff partials 1..8 within %.2f cents of the law (B = 2e-4, E2)\n", worst);
    EXPECT(worst < 3.0, "a stiff string's first eight partials follow the inharmonicity law");
    const double eighth = partial_near(out, 8.0 * hz * 1.0063, kRate, 4800, out.size());
    EXPECT(cents_off(eighth, 8.0 * hz) > 7.0, "and its 8th partial is audibly sharp of a harmonic");

    // Without stiffness the partials are harmonic.
    string.reset();
    string.set_frequency(hz, kRate);
    string.set_decay(8.0f, 4.0f, 3000.0f);
    const std::vector<float> plain = pluck_note(string, hz, kRate, 2.0f, 0.0f, 9000.0f);
    double plain_worst = 0.0;
    for (int n = 1; n <= 8; ++n) {
      const double got = partial_near(plain, n * hz, kRate, 4800, plain.size());
      plain_worst = std::max(plain_worst, std::fabs(cents_off(got, n * hz)));
    }
    EXPECT(plain_worst < 1.5, "a string with no stiffness has harmonic partials");
  }

  // The same level at every pitch, and near the amplitude asked for.
  {
    double lo = 1.0e9, hi = 0.0;
    for (int midi = 28; midi <= 88; midi += 12) {
      const float hz = kit::midi_to_hz(static_cast<float>(midi));
      string.reset();
      string.set_frequency(hz, kRate);
      string.set_decay(8.0f, 4.0f, 3000.0f);
      const std::vector<float> out = pluck_note(string, hz, kRate, 0.5f, 0.0f, 12000.0f);
      const double level = tone_level(out, hz, kRate, 2400, 21600);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi < 1.5 * lo, "the exciter gives the fundamental the same level from E1 to E6");
    EXPECT(lo > 0.4 && hi < 1.0, "which is about 0.7 of the amplitude asked for");
  }

  // A pitch that moves: no step, and it arrives in tune.
  {
    string.reset();
    string.set_tuning(String::Tuning::Interpolated);
    string.set_frequency(220.0f, kRate);
    string.set_decay(8.0f, 2.0f, 3000.0f);
    std::vector<float> out = pluck_note(string, 220.0f, kRate, 0.5f, 0.3f, 3000.0f);
    const double before = max_step(out, 12000, 24000);
    // Up a whole tone over 100 ms, a control tick at a time.
    const size_t start = out.size();
    for (int tick = 0; tick < 150; ++tick) {
      const float t = static_cast<float>(tick + 1) / 150.0f;
      string.set_frequency(220.0f * std::pow(2.0f, t * 2.0f / 12.0f), kRate);
      for (int i = 0; i < 32; ++i) out.push_back(string.tick(0.0f));
    }
    const size_t arrived = out.size();
    for (int i = 0; i < 48000; ++i) out.push_back(string.tick(0.0f));
    EXPECT(max_step(out, start, arrived) < 1.3 * before, "a slide makes no step larger than the note's own");
    const double hz = partial_near(out, 246.94, kRate, arrived + 4800, out.size());
    EXPECT(std::fabs(cents_off(hz, 246.94)) < 1.5, "and lands in tune");
  }

  // A pickup a quarter of the way along hears no 4th partial.
  {
    string.reset();
    string.set_frequency(110.0f, kRate);
    string.set_decay(6.0f, 3.0f, 3000.0f);
    kit::PluckExciter exciter;
    kit::Rng rng;
    exciter.strike(1.0f, 110.0f, 9000.0f, 0.0f, kRate);
    std::vector<float> out(24000);
    for (float& v : out) {
      const float direct = string.tick(exciter.next(rng));
      v = direct - string.tap(0.25f * string.period());
    }
    EXPECT(db(tone_level(out, 440.0, kRate)) < db(tone_level(out, 330.0, kRate)) - 20.0,
           "a tap at 1/4 of the period nulls the 4th partial");
  }

  // Reset is complete, silence stays silence, and nothing runs away.
  {
    string.reset();
    string.set_frequency(98.0f, kRate);
    string.set_decay(30.0f, 30.0f, 3000.0f);
    string.set_stiffness(1.0e-4f, 2);
    const std::vector<float> first = pluck_note(string, 98.0f, kRate, 0.5f, 0.13f, 5000.0f, 0.5f);
    string.reset();
    string.set_frequency(98.0f, kRate);
    string.set_decay(30.0f, 30.0f, 3000.0f);
    string.set_stiffness(1.0e-4f, 2);
    const std::vector<float> second = pluck_note(string, 98.0f, kRate, 0.5f, 0.13f, 5000.0f, 0.5f);
    EXPECT(first == second, "two strings reset and plucked alike sound alike, bit for bit");

    string.reset();
    string.set_frequency(98.0f, kRate);
    string.set_decay(30.0f, 30.0f, 3000.0f);
    double loudest = 0.0;
    for (int i = 0; i < 48000; ++i) loudest = std::max(loudest, std::fabs(static_cast<double>(string.tick(0.0f))));
    EXPECT(loudest == 0.0, "an unplucked string is exactly silent");
    // Ten seconds of full-scale noise into the longest decay there is.
    for (int i = 0; i < 480000; ++i) {
      loudest = std::max(loudest, std::fabs(static_cast<double>(string.tick(white()))));
    }
    EXPECT(std::isfinite(loudest) && loudest < 2000.0, "driven hard for ten seconds it stays bounded");
    string.damp(0.0f);
    EXPECT(string.tick(0.0f) == 0.0f, "and damp(0) stops it dead");
  }

  // The exciter ends, and exactly.
  {
    kit::PluckExciter exciter;
    kit::Rng rng;
    exciter.strike(1.0f, 55.0f, 800.0f, 1.0f, kRate);
    int length = 0;
    while (exciter.active() && length < 48000) {
      exciter.next(rng);
      ++length;
    }
    EXPECT(length > 480 && length < 12000, "a pluck is over in a fraction of a second");
    EXPECT(exciter.next(rng) == 0.0f, "and is exactly zero afterwards");
  }
}

}  // namespace

int main() {
  test_math();
  test_sine_table();
  test_smoothers();
  test_delay();
  test_filters();
  test_oscillators();
  test_lfo_and_env();
  test_voices();
  test_fdn();
  test_hilbert();
  test_fft();
  test_real_fft();
  test_pitch_shifter();
  test_oversampler();
  test_grains();
  test_plucked_string();
  if (failures() == 0) {
    std::printf("dsp kit tests: all passed\n");
    return 0;
  }
  std::printf("dsp kit tests: %d FAILED\n", failures());
  return 1;
}
