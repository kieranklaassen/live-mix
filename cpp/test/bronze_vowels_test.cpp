#include "../devices/bronze-vowels/bronze_vowels.h"

#include "support/test_kit.h"
using namespace testkit;
using namespace livemix::bronze_vowels;
namespace {
constexpr float kRate = 48000.0f;
livemix::BronzeVowels device;
enum Word { kAhOhOo, kWe };

float hz(float midi) { return 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f); }
size_t at(float seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

std::vector<float> mid(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}

using Knobs = std::initializer_list<std::pair<int, double>>;
void set(Knobs knobs) {
  for (const auto& k : knobs) device.set_param(k.first, static_cast<float>(k.second));
}
void fresh(Knobs knobs = {}, float rate = kRate) {
  device.init(rate);
  set(knobs);
}
void plain(Knobs knobs = {}) {
  fresh({{kStagger, 0}, {kAir, 0}, {kKnock, 0}, {kBeat, 0}});
  set(knobs);
}

// Power between two frequencies, by two pairs of one-pole-squared filters: a
// plain DFT would be dear, and only ratios of it are read.
double band(const std::vector<float>& x, double lo, double hi, size_t from, size_t to, double rate = kRate) {
  livemix::kit::Biquad low[2], high[2];
  for (auto& f : low) f.set_lowpass(static_cast<float>(hi), 0.75f, static_cast<float>(rate));
  for (auto& f : high) f.set_highpass(static_cast<float>(lo), 0.75f, static_cast<float>(rate));
  double sum = 0.0;
  const size_t lead = std::min<size_t>(from, 4800);
  for (size_t i = from - lead; i < std::min(to, x.size()); ++i) {
    float y = x[i];
    for (auto& f : low) y = f.process(y);
    for (auto& f : high) y = f.process(y);
    if (i >= from) sum += static_cast<double>(y) * y;
  }
  return sum;
}
double share_db(const std::vector<float>& x, double lo, double hi, size_t from, size_t to, double rate = kRate) {
  double all = 1e-20;
  for (size_t i = from; i < std::min(to, x.size()); ++i) all += static_cast<double>(x[i]) * x[i];
  return 10.0 * std::log10(band(x, lo, hi, from, to, rate) / all + 1e-12);
}

double worst_bend(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

Stereo note(float midi, float gain, float held, float rest, float rate = kRate) {
  device.note_on(1, hz(midi), gain);
  Stereo a = render(device, held, rate);
  device.note_off(1);
  return rest > 0.0f ? concat(a, render(device, rest, rate)) : a;
}

void chord(float gain) {
  int id = 0;
  for (float key : {50.0f, 57.0f, 65.0f, 72.0f, 76.0f}) device.note_on(++id, hz(key), gain);
}

// --- what it says
// A slow word stands on its first vowel: Ah against Oo, measured where they
// differ, up to C5; then Ee at the end of We.
void vowels() {
  for (float key : {45.0f, 52.0f, 60.0f, 67.0f, 72.0f}) {
    double ah[2], oo[2], ee[2];
    for (int w = 0; w < 2; ++w) {
      plain({{kWord, w == 0 ? kAhOhOo : kWe}, {kSpeak, 20.0f}});
      const auto x = mid(note(key, 0.7f, 2.5f, 0.0f));
      ah[w] = share_db(x, 680, 1500, at(1), at(2.5f));
      oo[w] = share_db(x, 40, 420, at(1), at(2.5f));
    }
    std::printf("key %.0f: Ah has %.1f dB at 680 to 1500 Hz where Oo has %.1f\n", key, ah[0], ah[1]);
    EXPECT(ah[0] - ah[1] > 9.0, "Ah is open where Oo is not");
    if (key < 70.0f) EXPECT(oo[1] - oo[0] > 3.0, "Oo sits low where Ah does not");
    for (int w = 0; w < 2; ++w) {
      plain({{kWord, w == 0 ? kWe : kAhOhOo}, {kSpeak, 1.5f}});
      ee[w] = share_db(mid(note(key, 0.7f, 2.0f, 0.0f)), 1900, 3600, at(1.3f), at(1.9f));
    }
    std::printf("Ee %.1f, Oo %.1f at 1900 to 3600 Hz\n", ee[0], ee[1]);
    EXPECT(ee[0] - ee[1] > 12.0 && ee[0] > -21.0, "We ends on a bright Ee, Ah oh oo on a dark Oo");
  }
}

// The word travels in its speaking time and comes back.
void travel() {
  double bright[2][4];
  for (int s = 0; s < 2; ++s) {
    plain({{kSpeak, s == 0 ? 2.0f : 4.0f}, {kSing, 1.0f}});
    const auto x = mid(note(50, 0.7f, 8.0f, 0.0f));
    for (int q = 0; q < 4; ++q) bright[s][q] = share_db(x, 600, 1500, at(1.7f + 2.0f * q), at(2.2f + 2.0f * q));
  }
  EXPECT(bright[0][1] - bright[0][0] > 8.0, "after twice the speaking time the word is back at Ah");
  EXPECT(bright[0][2] < bright[0][1] - 8.0 && bright[0][3] > bright[0][2] + 8.0, "and goes on");
  EXPECT(bright[1][1] < bright[0][1] - 8.0, "a longer speaking time is later");
}

// Dying, not filtering: the strike has what the vowel does not want, and it
// dies while the vowel rings. With Clarity down it rings.
void dying() {
  double fall[2];
  for (int c = 0; c < 2; ++c) {
    plain({{kMetal, 0}, {kStray, 0.0f}, {kHardness, 1.0f}, {kClarity, c == 0 ? 1.0f : 0.0f}, {kSpeak, 20.0f}});
    const auto x = mid(note(45, 1.0f, 2.0f, 0.0f));
    fall[c] = db(tone_level(x, 16.0 * 110.0, kRate, at(0.01f), at(0.11f))) -
              db(tone_level(x, 16.0 * 110.0, kRate, at(1.0f), at(1.6f)));
  }
  std::printf("1760 Hz under Ah falls %.1f dB in a second, %.1f with Clarity down\n", fall[0], fall[1]);
  EXPECT(fall[0] > 24.0 && fall[1] < 13.0, "the mouth kills what it does not want");
}

// Above C5 the word is bright and dark.
void high_keys() {
  plain({{kWord, kWe}, {kSpeak, 6.0f}});
  const auto x = mid(note(86, 0.7f, 5.0f, 0.0f));
  const double f = hz(86);
  const double dark = share_db(x, 2.1 * f, 9000, at(0.7f), at(1.3f)), bright = share_db(x, 2.1 * f, 9000, at(4), at(5));
  std::printf("D6: %.1f dB above the octave on Oo, %.1f on Ee\n", dark, bright);
  EXPECT(bright - dark > 8.0, "on D6 Oo is dark and Ee is bright");
}

// The last one struck teaches.
void contagion() {
  double ee[3];
  const float c[3] = {0.0f, 1.0f, -1.0f};
  for (int k = 0; k < 3; ++k) {
    plain({{kWord, kWe}, {kSpeak, 2.0f}, {kSing, 1.0f}, {kContagion, c[k]}});
    device.note_on(1, 110.0f, 0.7f);
    render(device, 1.6f, kRate);
    device.note_on(2, hz(86), 0.02f);  // almost silent, and at Oo
    const auto x = mid(render(device, 1.0f, kRate));
    ee[k] = share_db(x, 1900, 3600, at(0.35f), at(0.7f));
  }
  std::printf("the old bell's Ee: %.1f dB alone, %.1f taught Oo, %.1f opposed to it\n", ee[0], ee[1], ee[2]);
  EXPECT(ee[0] - ee[1] > 10.0, "a taught bell comes round to the new one");
  EXPECT(ee[2] > ee[1] + 10.0, "an opposed one does not");
}

// --- the bell
// How far a tone near `f` is from it, in cents, by the turn of its phase over
// two seconds.
double cents_off(const std::vector<float>& x, double f) {
  double turn[2];
  for (int w = 0; w < 2; ++w) {
    double re = 0.0, im = 0.0;
    const size_t from = at(1.0f + 2.0f * static_cast<float>(w)), n = at(2);
    for (size_t i = 0; i < n; ++i) {
      const double hann = 1.0 - std::cos(6.283185307179586 * static_cast<double>(i) / static_cast<double>(n));
      const double phase = 6.283185307179586 * std::fmod(f * static_cast<double>(from + i) / kRate, 1.0);
      re += hann * x[from + i] * std::cos(phase);
      im -= hann * x[from + i] * std::sin(phase);
    }
    turn[w] = std::atan2(im, re);
  }
  double d = (turn[1] - turn[0]) / 6.283185307179586;
  d -= std::floor(d + 0.5);
  return 1731.2 * d / (2.0 * f);
}

void tuning() {
  double worst = 0.0;
  for (int metal = 0; metal < 5; ++metal) {
    for (float key : {38.0f, 50.0f, 62.0f, 74.0f, 84.0f}) {
      plain({{kMetal, metal}, {kStray, 1.0f}, {kSing, 1.0f}, {kHum, 1.0f}});
      const auto x = mid(note(key, 0.7f, 5.0f, 0.0f));
      for (double ratio : {0.5, 1.0}) {
        const double f = hz(key) * ratio;
        if (f > 60.0) worst = std::max(worst, std::fabs(cents_off(x, f)));
      }
    }
  }
  std::printf("the note and its hum are %.2f cents off at most\n", worst);
  EXPECT(worst < 1.0, "the note and its hum are in tune whatever the metal");
  // A bell tuned by Stray has its second harmonic in tune as well.
  plain({{kStray, 0.0f}, {kSing, 1.0f}});
  EXPECT(std::fabs(cents_off(mid(note(50, 0.7f, 5.0f, 0.0f)), 2.0 * hz(50))) < 1.0, "Stray 0 is in tune");
}

void ring_and_sing() {
  double fall[3];
  for (int k = 0; k < 3; ++k) {
    plain({{kClarity, 0.0f}, {kSing, k == 2 ? 1.0f : 0.0f}, {kRing, k == 0 ? 4.0f : 16.0f}});
    const auto x = mid(note(57, 0.7f, 5.0f, 0.0f));
    fall[k] = db(tone_level(x, 220.0, kRate, at(1), at(1.5f))) - db(tone_level(x, 220.0, kRate, at(4), at(4.5f)));
  }
  std::printf("the note falls %.1f dB in 3 s at Ring 4, %.1f at 16, %.1f sung\n", fall[0], fall[1], fall[2]);
  EXPECT(fall[0] > 2.8 * fall[1] && fall[0] < 5.5 * fall[1], "Ring is how long it rings");
  EXPECT(std::fabs(fall[2]) < 1.0, "a sung bell holds");
  double after[2];
  for (int k = 0; k < 2; ++k) {
    plain({{kRelease, k}});
    const auto x = mid(note(57, 0.7f, 1.0f, 1.0f));
    after[k] = db(rms(x, at(1.4f), at(1.8f))) - db(rms(x, at(0.6f), at(1)));
  }
  EXPECT(after[0] > -12.0 && after[1] < -50.0, "Damp on release rings on or stops");
}

// A hand on a bell stops it, whatever its metal and even while it comes up.
void damping() {
  for (int metal = 0; metal < 5; ++metal) {
    for (float swell : {0.03f, 3.0f}) {
      plain({{kMetal, metal}, {kRelease, 1.0f}, {kSwell, swell}});
      const auto x = mid(note(57, 0.8f, 0.8f, 1.0f));
      EXPECT(rms(x, at(0.6f), at(0.8f)) > 1e-4 && rms(x, at(1.1f), at(1.8f)) < 1e-5, "Damp on release stops a bell at once");
      EXPECT(peak(std::vector<float>(x.end() - 4800, x.end())) == 0.0, "and lets it sleep");
    }
  }
  // With Damp at the bottom a swell goes on when the key is let go.
  plain({{kRelease, 0.0f}, {kSwell, 2.0f}});
  const auto x = mid(note(57, 0.8f, 0.5f, 2.0f));
  EXPECT(rms(x, at(1.8f), at(2.2f)) > 2.5 * rms(x, at(0.3f), at(0.5f)), "a swell let go undamped goes on");
}

// A strike rings the held bells awake, as far as Contagion goes, and no
// further than they were struck.
void waking() {
  double got[2], struck = 0.0;
  for (int k = 0; k < 2; ++k) {
    plain({{kSing, 0.0f}, {kRing, 4.0f}, {kContagion, k}});
    device.note_on(1, 220.0f, 0.7f);
    const auto a = mid(render(device, 3.0f, kRate));
    struck = tone_level(a, 220.0, kRate, at(0.05f), at(0.25f));
    device.note_on(2, hz(89), 0.7f);
    got[k] = tone_level(mid(render(device, 1.0f, kRate)), 220.0, kRate, at(0.3f), at(0.6f));
  }
  std::printf("a strike rings a held bell awake by %.1f dB\n", db(got[1]) - db(got[0]));
  EXPECT(got[1] > 4.0 * got[0] && got[1] < 1.2 * struck, "a strike rings held bells awake");
}

void touch() {
  double level[2], bright[2];
  for (int k = 0; k < 2; ++k) {
    plain();
    const auto x = mid(note(52, k == 0 ? 0.25f : 1.0f, 1.0f, 0.0f));
    level[k] = db(peak(x));
    bright[k] = share_db(x, 1200, 9000, at(0.0f), at(0.3f));
  }
  EXPECT(level[1] - level[0] > 10.0 && bright[1] - bright[0] > 3.0, "a harder touch is louder and brighter");
}

void levels() {
  double low = 1e9, high = -1e9;
  for (float key = 36.0f; key <= 84.5f; key += 6.0f) {
    fresh();
    const auto x = note(key, 0.7f, 2.0f, 0.0f);
    const double p = db(std::max(peak(x.left), peak(x.right)));
    EXPECT(p > -24.6 && p < -10.0, "one note peaks between -24 and -10 dBFS");
    const double r = db(rms(mid(x)));
    low = std::min(low, r);
    high = std::max(high, r);
  }
  std::printf("level over C2 to C6: %.1f to %.1f dBFS\n", low, high);
  EXPECT(high - low < 5.0, "level is even over the keys");
  for (int metal = 0; metal < 5; ++metal) {
    for (int mallet = 0; mallet < 4; ++mallet) {
      fresh({{kMetal, metal}, {kMallet, mallet}});
      const float keys[10] = {36, 43, 48, 52, 55, 60, 64, 67, 72, 76};
      for (int i = 0; i < 10; ++i) device.note_on(i, hz(keys[i]), 1.0f);
      const Stereo x = render(device, 2.5f, kRate);
      const double p = std::max(peak(x.left), peak(x.right));
      if (p >= 0.5) std::printf("metal %d mallet %d peaks at %.3f\n", metal, mallet, p);
      EXPECT(p < 0.5, "ten keys at full gain stay under the knee");
    }
  }
}

void places() {
  fresh({{kWidth, 0.0f}});
  chord(0.7f);
  Stereo x = render(device, 1.5f, kRate);
  EXPECT(x.left == x.right, "Width 0 is mono");
  fresh({{kWidth, 1.0f}});
  chord(0.7f);
  x = render(device, 3.0f, kRate);
  const auto m = mid(x);
  const double lost = db(std::sqrt(0.5 * (std::pow(rms(x.left), 2) + std::pow(rms(x.right), 2)))) - db(rms(m));
  EXPECT(correlation(x.left, x.right) < 0.97 && lost < 2.0, "wide, and whole in mono");
}

void rates() {
  std::vector<double> loud;
  for (float rate : {44100.0f, 48000.0f, 88200.0f, 96000.0f}) {
    fresh({{kAir, 0.6f}, {kKnock, 0.8f}}, rate);
    chord(0.7f);
    const auto x = mid(render(device, 3.0f, rate));
    loud.push_back(db(rms(x, at(0.1f, rate), at(3, rate))));
    loud.push_back(share_db(x, 2500, 7000, at(0.1f, rate), at(3, rate), rate));
  }
  for (size_t i = 2; i < loud.size(); ++i) EXPECT_NEAR(loud[i], loud[i & 1], i & 1 ? 1.5 : 0.8, "the same at every rate");
}

// --- faults
void clicks() {
  auto hold = [] {
    fresh({{kSwell, 0.3f}, {kSing, 1.0f}, {kKnock, 0.0f}, {kAir, 0.0f}});
    chord(0.7f);
    render(device, 1.0f, kRate);
  };
  hold();
  const double calm = worst_bend(render(device, 3.0f, kRate).left);
  for (int p = 0; p < kNumParams; ++p) {
    if (p == kVolume || p == kAir || p == kKnock) continue;
    hold();
    double worst = 0.0;
    for (int k = 0; k < 8; ++k) {
      device.set_param(p, k & 1 ? kParamMin[p] : kParamMax[p]);
      worst = std::max(worst, worst_bend(render(device, 0.1f, kRate).left));
    }
    char label[96];
    std::snprintf(label, sizeof label, "param %d jumped while it sounds: bend %.5f against %.5f", p, worst, calm);
    EXPECT(worst < 5.0 * calm + 0.002, label);
  }
  // Steals and restrikes with a slow mallet make no step either.
  hold();
  double worst = 0.0;
  for (int k = 0; k < 24; ++k) {
    device.note_on(40 + k, hz(48.0f + static_cast<float>((k * 7) % 25)), 0.7f);
    worst = std::max(worst, worst_bend(render(device, 0.03f, kRate).left));
  }
  std::printf("bend: calm %.5f, stealing %.5f\n", calm, worst);
  EXPECT(worst < 6.0 * calm + 0.004, "a taken voice fades");
  hold();
  worst = 0.0;
  for (int k = 0; k < 12; ++k) {
    device.note_on(1 + (k % 5), hz(50), 0.7f);
    worst = std::max(worst, worst_bend(render(device, 0.05f, kRate).left));
  }
  EXPECT(worst < 5.0 * calm + 0.002, "a bell struck again does not jump");
  // What the mallet and the air ring is faded as well: by a steal, and by the
  // same bell struck with another mallet, against the same with no event.
  for (int mallet = 0; mallet < 4; ++mallet) {
    double bend[3];
    for (int k = 0; k < 3; ++k) {
      fresh({{kMallet, mallet}, {kKnock, 1.0f}, {kSwell, 0.3f}, {kAir, 0.0f}});
      for (int i = 0; i < 10; ++i) device.note_on(i, hz(40.0f + 3.0f * static_cast<float>(i)), 0.8f);
      render(device, 0.015f, kRate);
      if (k == 2) device.set_param(kMallet, static_cast<float>((mallet + 1) & 3));
      for (int i = 0; i < 10 && k; ++i) device.note_on(20 + i, hz(k == 2 ? 40.0f + 3.0f * static_cast<float>(i) : 41.5f + 3.0f * static_cast<float>(i)), 0.0f);
      bend[k] = worst_bend(render(device, 0.05f, kRate).left);
    }
    EXPECT(bend[1] < 1.15 * bend[0] && bend[2] < 1.25 * bend[0], "a knock taken away fades");
  }
}

void sweeps() {
  for (int p = 0; p < kNumParams; ++p) {
    fresh();
    chord(0.9f);
    bool good = true;
    for (int k = 0; k <= 20; ++k) {
      const float t = static_cast<float>(k) * 0.05f;
      device.set_param(p, kParamMin[p] + (kParamMax[p] - kParamMin[p]) * t);
      const Stereo x = render(device, 0.05f, kRate);
      good = good && finite(x.left) && finite(x.right) && peak(x.left) <= 1.0;
    }
    EXPECT(good, "every knob swept while a chord sounds");
  }
}

void one_id() {
  fresh({{kSing, 1.0f}, {kRing, 2.0f}, {kRelease, 0.6f}});
  for (float key : {50.0f, 57.0f, 50.0f}) {
    device.note_on(7, hz(key), 0.7f);
    render(device, 0.2f, kRate);
  }
  device.note_off(7);
  render(device, 8.0f, kRate);
  EXPECT(peak(render(device, 0.5f, kRate).left) == 0.0, "an id back at its first pitch is one bell, and one off ends it");
  // The same inside a steal's fade.
  for (int n = 0; n < 10; ++n) device.note_on(20 + n, hz(40.0f + 3.0f * static_cast<float>(n)), 0.8f);
  render(device, 0.1f, kRate);
  for (float key : {80.0f, 82.0f, 80.0f}) device.note_on(7, hz(key), 0.7f);
  for (int n = 0; n < 10; ++n) device.note_off(20 + n);
  device.note_off(7);
  render(device, 8.0f, kRate);
  EXPECT(peak(render(device, 0.5f, kRate).left) == 0.0, "nothing is left from a steal");
  for (float gain : {std::nanf(""), -1.0f, 5.0f}) device.note_on(3, 0.0f, gain);
  for (float f : {std::nanf(""), INFINITY, -5.0f, 1e9f, 5.0f}) device.note_on(4, f, 0.5f);
  EXPECT(finite(render(device, 0.5f, kRate).left), "absurd notes");
}

void blocks() {
  std::vector<float> first;
  for (int block : {128, 1, 2048, 7}) {
    fresh({{kRing, 0.5f}, {kAir, 0.5f}});
    std::vector<float> all;
    auto take = [&](float seconds) {
      const auto x = render(device, seconds, kRate, block);
      all.insert(all.end(), x.left.begin(), x.left.end());
      all.insert(all.end(), x.right.begin(), x.right.end());
    };
    chord(0.8f);
    take(0.4f);
    for (int i = 1; i <= 5; ++i) device.note_off(i);
    take(3.0f);
    device.set_param(kTract, 5.0f);  // turned in its sleep: there at once
    device.note_on(9, hz(55), 0.6f);
    take(0.4f);
    if (first.empty()) first = all;
    EXPECT(all == first, "the same to the bit at every block size, across a silence");
  }
}

void asleep() {
  std::vector<float> got[2];
  for (int k = 0; k < 2; ++k) {
    fresh({{kRing, 0.4f}});
    if (k == 1) note(60, 0.7f, 0.2f, 4.0f);
    device.set_param(kTract, -6.0f);
    device.note_on(1, hz(50), 0.7f);
    got[k] = render(device, 0.3f, kRate).left;
  }
  EXPECT(got[0] == got[1], "a knob turned while it sleeps is where it points");
}

}  // namespace
int main() {
  Conformance spec;
  spec.name = "bronze-vowels";
  spec.num_params = kNumParams;
  spec.mins = kParamMin;
  spec.maxs = kParamMax;
  spec.defaults = kParamDefault;
  spec.tail_seconds = 30.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (auto* check : {vowels, travel, dying, high_keys, contagion, tuning, ring_and_sing, touch, levels, places, rates,
                      damping,
                      waking, clicks, sweeps, one_id, blocks, asleep}) {
    check();
  }
  fresh();
  for (int n = 0; n < 8; ++n) device.note_on(n, hz(40.0f + 5.0f * static_cast<float>(n)), 0.7f);
  report_cost("bronze-vowels (8 notes)", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("bronze-vowels");
}
