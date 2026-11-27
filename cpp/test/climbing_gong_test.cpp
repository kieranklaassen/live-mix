// Climbing Gong: conformance, then what makes it what it is.

#include <array>
#include <functional>
#include <initializer_list>
#include <utility>

#include "../devices/climbing-gong/climbing_gong.h"
#include "support/test_kit.h"

using namespace testkit;
using namespace livemix;
namespace cg = livemix::climbing_gong;

namespace {

using Set = std::initializer_list<std::pair<int, float>>;
constexpr float kRate = 48000.0f;
ClimbingGong gong;

void fresh(Set set = {}, float rate = kRate) {
  gong.init(rate);
  for (const auto& p : set) gong.set_param(p.first, p.second);
}
// Plain: one stroke, nothing that moves.
void plain(Set set = {}, float rate = kRate) {
  fresh({{cg::kRoll, 0.0f}, {cg::kSympathy, 0.0f}, {cg::kFallBack, 0.0f}}, rate);
  for (const auto& p : set) gong.set_param(p.first, p.second);
}
Stereo play(float seconds, float rate = kRate, int block = kBlock) { return render(gong, seconds, rate, block); }
std::vector<float> mid(const Stereo& a) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (a.left[i] + a.right[i]);
  return out;
}
double top(const Stereo& a) { return std::max(peak(a.left), peak(a.right)); }
float hz(int key) { return 440.0f * std::pow(2.0f, static_cast<float>(key - 69) / 12.0f); }
// One key struck and heard.
Stereo struck(float frequency, float gain, float seconds, float rate = kRate) {
  gong.note_on(1, frequency, gain);
  return play(seconds, rate);
}
Stereo heard(Set set, float frequency, float gain, float seconds) {
  plain(set);
  return struck(frequency, gain, seconds);
}
double cents(double is, double was) { return 1200.0 * std::log2(is / was); }
// Strikes a key and reads its four registers every 64 samples.
using Ladder = std::vector<std::array<float, 4>>;
Ladder ladder(Set set, int key, float gain, float seconds) {
  plain(set);
  Ladder out;
  gong.note_on(1, hz(key), gain);
  for (int i = 0; i < static_cast<int>(seconds * kRate / 64.0f); ++i) {
    gong.process(64);
    out.push_back({gong.meter(0), gong.meter(1), gong.meter(2), gong.meter(3)});
  }
  return out;
}
double ladder_at(const Ladder& l, int r, double from, double to) {
  double sum = 0.0;
  int n = 0;
  for (size_t i = static_cast<size_t>(from * 750.0); i < l.size() && i < static_cast<size_t>(to * 750.0); ++i, ++n) sum += l[i][r];
  return n ? sum / n : 0.0;
}
double most_of(const Ladder& l, int r) {
  double most = 0.0;
  for (const auto& s : l) most = std::max<double>(most, s[r]);
  return most;
}
// The same thing with a knob one way and the other.
std::array<double, 2> two(const std::function<double(int)>& of) { return {of(0), of(1)}; }
// The largest second difference: what a click leaves and a tone does not.
double bend_of(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}
bool same_audio(const Stereo& a, const Stereo& b) { return a.left == b.left && a.right == b.right; }

void check_pitch() {
  for (int metal = 0; metal < 6; ++metal) {
    for (int key : {38, 57, 76}) {
      const auto x = mid(heard({{cg::kMetal, static_cast<float>(metal)}}, hz(key), key == 57 ? 0.3f : 1.0f, 2.5f));
      const double off = cents(dominant_frequency(x, kRate, hz(key) * 0.97, hz(key) * 1.03, 24000), hz(key));
      if (std::fabs(off) >= 3.0) std::printf("  metal %d key %d: %.1f cents\n", metal, key, off);
      EXPECT(std::fabs(off) < 3.0, "the key is in tune on every metal");
    }
  }
  fresh({{cg::kRoll, 1.0f}, {cg::kRollSwell, 0.2f}, {cg::kShimmer, 0.0f}});
  auto x = mid(struck(hz(57), 0.8f, 6.0f));
  EXPECT(std::fabs(cents(dominant_frequency(x, kRate, 210.0, 230.0, 48000), 220.0)) < 3.0, "a roll does not pull the pitch");
  x = mid(heard({{cg::kBend, 150.0f}, {cg::kClimb, 0.0f}}, 220.0f, 1.0f, 8.0f));
  const double early = cents(dominant_frequency(x, kRate, 205.0, 250.0, 2400, 12000), 220.0);
  const double late = cents(dominant_frequency(x, kRate, 205.0, 250.0, 336000, 384000), 220.0);
  std::printf("  bend: %.0f cents early, %.1f late\n", early, late);
  EXPECT(early > 60.0 && late < 25.0 && late >= -3.0, "Bend pulls the pitch by force and it comes home");
}

void check_climb() {
  // Rung by rung, and back from the top.
  auto l = ladder({{cg::kClimb, 0.8f}, {cg::kRoar, 0.2f}}, 50, 0.9f, 12.0f);
  double reached[4] = {}, gone[4] = {};
  for (int r = 1; r < 4; ++r) {
    const double most = most_of(l, r);
    for (size_t i = 0; i < l.size(); ++i) {
      if (reached[r] == 0.0 && l[i][r] > 0.3 * most) reached[r] = static_cast<double>(i) / 750.0;
      if (l[i][r] > 0.1 * most) gone[r] = static_cast<double>(i) / 750.0;
    }
    std::printf("  rung %d: at 30 %% of %.3f after %.2f s, under 10 %% after %.2f s\n", r, most, reached[r], gone[r]);
    EXPECT(most > 0.03, "every rung is lit by a hard stroke");
  }
  EXPECT(reached[1] < reached[2] && reached[2] < reached[3], "the rungs are lit one after another");
  EXPECT(reached[3] > 0.25 && reached[3] < 3.0, "and within three seconds at the default Climb time");
  EXPECT(gone[3] <= gone[1] + 0.05, "it darkens from the top");
  l = ladder({{cg::kClimb, 0.0f}}, 50, 0.9f, 3.0f);
  EXPECT(ladder_at(l, 2, 1.0, 3.0) < 0.001, "with no Climb nothing climbs");
  // Threshold is a gate on force, velocity is colour and not only level.
  const auto lit = two([](int i) {
    const auto l = ladder({{cg::kThreshold, 0.55f}}, 50, i ? 1.0f : 0.3f, 2.0f);
    return ladder_at(l, 1, 0.5, 2.0) / ladder_at(l, 0, 0.5, 2.0);
  });
  EXPECT(lit[1] > 6.0 * lit[0], "a soft stroke stays under Threshold and a hard one climbs");
  // Climb time is the time.
  const auto half = two([](int i) {
    const auto l = ladder({{cg::kClimbTime, i ? 2.0f : 0.5f}, {cg::kLowRing, 40.0f}}, 50, 0.9f, 6.0f);
    size_t k = 0;
    while (k + 1 < l.size() && l[k][2] < 0.5 * most_of(l, 2)) ++k;
    return static_cast<double>(k);
  });
  EXPECT(half[1] > 1.6 * half[0], "Climb time sets how fast");
  // Fall back: the low tone is spent and given back.
  l = ladder({{cg::kFallBack, 1.0f}, {cg::kClimb, 0.8f}, {cg::kLowRing, 40.0f}}, 57, 0.9f, 6.0f);
  double lowest = 9.0, back = 0.0;
  for (size_t i = 200; i < l.size(); ++i) back = std::max(back, l[i][0] / (lowest = std::min<double>(lowest, l[i][0])));
  std::printf("  fall back: the ground comes back by %.1f dB\n", db(back));
  EXPECT(back > 1.25, "what climbed comes down again");
  l = ladder({{cg::kFallBack, 1.0f}, {cg::kClimb, 0.9f}, {cg::kBeater, 4.0f}, {cg::kThreshold, 0.1f}}, 45, 0.9f, 16.0f);
  double dark = 9.0, light = 0.0;
  for (size_t i = 2250; i < l.size(); ++i) light = std::max<double>(light, l[i][1]), dark = std::min<double>(dark, l[i][1]);
  EXPECT(dark < 0.05 * light, "and goes up again in waves");
  // Bounded by the stroke, whatever the knobs.
  for (int beater = 0; beater < 5; ++beater) {
    l = ladder({{cg::kClimb, 1.0f}, {cg::kThreshold, 0.0f}, {cg::kClimbTime, 0.2f}, {cg::kRoar, 1.0f}, {cg::kFallBack, 1.0f},
           {cg::kLowRing, 40.0f}, {cg::kHighRing, 20.0f}, {cg::kRoll, 1.0f}, {cg::kRollSpeed, 16.0f}, {cg::kHardness, 1.0f}, {cg::kPlace, 1.0f},
           {cg::kBeater, static_cast<float>(beater)}}, 45, 1.0f, 10.0f);
    for (int r = 0; r < 4; ++r) {
      const double most = most_of(l, r);
      if (most > 1.6) std::printf("  beater %d register %d: %.2f\n", beater, r, most);
      EXPECT(most < 3.2, "no register runs away");
      EXPECT(ladder_at(l, r, 7.5, 10.0) < 2.0 * ladder_at(l, r, 3.0, 6.0) + 0.1, "and none creeps up");
    }
  }
}

// How much of the sound between 4.2 and 19 times the key is on the tones of Fifths.
double on_tones(const std::vector<float>& x, double key) {
  double on = 0.0, off = 0.0;
  for (double q : {4.5, 6.0, 8.0, 9.0, 12.0, 13.5, 16.0, 18.0}) on += std::pow(tone_level(x, key * q, kRate, 48000, 96000), 2.0);
  for (double q : {4.75, 5.2, 7.1, 8.5, 10.4, 12.8, 14.7, 17.1}) off += std::pow(tone_level(x, key * q, kRate, 48000, 96000), 2.0);
  return 10.0 * std::log10(on / (off + 1.0e-15));
}

void check_matter() {
  const auto tones = two([](int i) {
    return on_tones(mid(heard({{cg::kRoar, i ? 1.0f : 0.0f}, {cg::kShimmer, 0.0f}, {cg::kClimb, 0.8f}}, hz(57), 0.9f, 2.1f)), 220.0);
  });
  EXPECT(tones[0] > 30.0, "what climbs lands on the metal");
  EXPECT(tones[1] < tones[0] - 15.0 && tones[1] > 2.0, "Roar is a rush that still keeps to the tones");
  const auto share = two([](int i) {
    const auto x = mid(heard({{cg::kClimb, 0.0f}, {cg::kShimmer, 0.0f}, {cg::kPlace, i ? 1.0f : 0.0f}}, 220.0f, 0.8f, 1.0f));
    return tone_level(x, 660.0, kRate, 4800) / tone_level(x, 220.0, kRate, 4800);
  });
  EXPECT(share[1] > 5.0 * share[0], "Place tilts the stroke to the rim");
  // The bow holds, a stroke does not; the brush is slow to come.
  double kept[5], rise[5];
  for (int b = 0; b < 5; ++b) {
    const auto x = mid(heard({{cg::kBeater, static_cast<float>(b)}, {cg::kLowRing, 6.0f}}, 220.0f, 0.8f, 5.0f));
    kept[b] = rms(x, 192000, 240000) / rms(x, 24000, 48000);
    double most = 0.0;
    size_t at = 0;
    for (size_t i = 0; i < 96000; i += 480) most = std::max(most, rms(x, i, i + 480));
    while (rms(x, at, at + 480) <= 0.5 * most) at += 480;
    rise[b] = static_cast<double>(at) / kRate;
  }
  EXPECT(kept[4] > 0.6 && kept[0] < 0.3, "the bow holds and felt dies away");
  EXPECT(rise[2] < 0.03 && rise[3] > 0.03 && rise[4] > 0.1, "wood is at once, the brush and the bow come in");
  // A roll holds the level and grows over its swell.
  fresh({{cg::kRoll, 0.8f}, {cg::kRollSwell, 6.0f}});
  auto x = mid(struck(220.0f, 0.8f, 10.0f));
  EXPECT(rms(x, 384000, 480000) > 1.4 * rms(x, 24000, 72000), "a roll swells");
  // Ring, choke, sympathy, width, ground.
  const auto ring = two([](int i) { return rt60(heard({{cg::kLowRing, i ? 12.0f : 3.0f}, {cg::kClimb, 0.0f}, {cg::kShimmer, 0.0f}}, 220.0f, 0.8f, 4.0f).left, kRate, 0.5); });
  EXPECT(ring[0] > 2.4 && ring[0] < 3.6 && ring[1] > 9.5 && ring[1] < 14.0, "Low ring is the ring");
  const auto after = two([](int i) {
    heard({{cg::kChoke, 1.0f}, {cg::kSympathy, i ? 0.6f : 0.0f}}, 220.0f, 0.8f, 1.5f);
    gong.note_off(1);
    return rms(play(1.0f).left, 24000);
  });
  EXPECT(after[0] < 1.0e-4 && after[1] > 30.0 * after[0] + 1.0e-4, "Choke stops the key and Sympathy hangs on");
  const auto together = two([](int i) {
    const auto a = heard({{cg::kWidth, i ? 1.0f : 0.0f}, {cg::kRoar, 0.0f}}, 220.0f, 0.8f, 2.0f);
    return correlation(a.left, a.right);
  });
  EXPECT(together[0] > 0.999 && together[1] < 0.97, "Width is width, and none is mono");
  x = mid(heard({{cg::kGround, 0.0f}}, 220.0f, 0.8f, 1.0f));
  EXPECT(tone_level(x, 220.0, kRate, 4800) < 0.2 * tone_level(x, 330.0, kRate, 4800), "Ground takes the key's own tone away");
}

// How much of the sound lies above each octave from 120 Hz, early and late; and how near the nearest two are.
std::vector<double> profile(const Stereo& a) {
  const auto x = mid(a);
  std::vector<double> out;
  for (const auto& part : {std::vector<float>(x.begin(), x.begin() + 28800), std::vector<float>(x.begin() + 28800, x.end())}) {
    for (double f = 120.0; f < 9000.0; f *= 2.0) out.push_back(std::max(10.0 * std::log10(energy_above(part, f, kRate) + 1.0e-9), -50.0));
  }
  for (size_t i = 0; i + 9600 <= x.size(); i += 9600) out.push_back(std::max(db(rms(x, i, i + 9600)), -60.0));
  return out;
}
double nearest_of(const std::vector<std::vector<double>>& all) {
  double nearest = 99.0;
  for (size_t i = 1; i < all.size(); ++i) {
    for (size_t j = 0; j < i; ++j) {
      double sum = 0.0;
      for (size_t k = 0; k < all[i].size(); ++k) sum += std::fabs(all[i][k] - all[j][k]) / static_cast<double>(all[i].size());
      nearest = std::min(nearest, sum);
    }
  }
  return nearest;
}

// Every metal under every beater: it climbs, it is a sound of its own, nothing
// of it is lost with the key, and ten keys at full force stay under the knee.
void check_choices() {
  std::vector<std::vector<double>> metals, beaters;
  for (int metal = 0; metal < 6; ++metal) {
    const float m = static_cast<float>(metal);
    for (int beater = 0; beater < 5; ++beater) {
      const float b = static_cast<float>(beater);
      const auto lit = two([=](int i) {
        const auto l = ladder({{cg::kMetal, m}, {cg::kBeater, b}, {cg::kThreshold, 0.1f}, {cg::kClimb, i ? 0.9f : 0.0f}}, 50, 0.8f, 1.6f);
        return ladder_at(l, 1, 0.6, 1.6) + ladder_at(l, 2, 0.6, 1.6) + ladder_at(l, 3, 0.6, 1.6);
      });
      if (lit[1] < 1.25 * lit[0] || lit[1] < 0.08) std::printf("  metal %d beater %d: climb %.3f against %.3f\n", metal, beater, lit[1], lit[0]);
      EXPECT(lit[1] > 1.25 * lit[0] && lit[1] > 0.08, "Climb climbs on every metal under every beater");
      fresh({{cg::kMetal, m}, {cg::kBeater, b}});
      for (int i = 0; i < 10; ++i) gong.note_on(i, hz(38 + 4 * i), 1.0f);
      const double ten = top(play(1.5f));
      if (ten >= 0.5) std::printf("  metal %d beater %d: ten keys %.3f\n", metal, beater, ten);
      EXPECT(ten < 0.5, "ten keys on any metal hardly touch the knee");
    }
    EXPECT(ladder_at(ladder({{cg::kMetal, m}, {cg::kRoar, 0.0f}, {cg::kClimb, 0.9f}}, 50, 0.9f, 2.0f), 2, 1.0, 2.0) > 0.03, "with no Roar the products alone carry the climb");
    double loud[3];
    for (int i = 0; i < 3; ++i) {
      const auto a = heard({{cg::kMetal, m}, {cg::kGround, i == 1 ? 0.0f : 0.5f}, {cg::kLowRing, i == 2 ? 0.5f : 18.0f}, {cg::kClimb, 0.2f}}, hz(57), 0.8f, 0.5f);
      loud[i] = i == 2 ? db(top(a)) : db(rms(a.left));
    }
    EXPECT(loud[1] > loud[0] - 12.0, "with the key gone the rest is still a sound");
    EXPECT(loud[2] > -26.0, "a short ring is not a quiet one");
    metals.push_back(profile(heard({{cg::kMetal, m}}, hz(50), 0.8f, 3.0f)));
  }
  for (float b : {0.0f, 1.0f, 2.0f, 3.0f, 4.0f}) beaters.push_back(profile(heard({{cg::kBeater, b}}, hz(50), 0.8f, 3.0f)));
  std::printf("  nearest metals %.2f dB, beaters %.2f dB\n", nearest_of(metals), nearest_of(beaters));
  EXPECT(nearest_of(metals) > 0.8 && nearest_of(beaters) > 1.2, "no two metals and no two beaters are one sound");
  // No knob is dead: its two ends are two sounds.
  for (int p = cg::kHardness; p < cg::kNumParams; ++p) {
    std::vector<std::vector<double>> ends;
    for (float v : {cg::kParamMin[p], cg::kParamMax[p]}) {
      fresh({{cg::kRoll, 0.4f}, {cg::kThreshold, 0.1f}, {p, v}});
      struck(hz(50), 0.8f, 1.5f);
      gong.note_off(1);
      ends.push_back(profile(struck(hz(57), 0.8f, 2.5f)));
    }
    EXPECT(nearest_of(ends) > 0.12, "every knob changes the sound");
  }
  const auto roar = two([](int i) {
    return energy_above(mid(heard({{cg::kMetal, 5.0f}, {cg::kRoar, i ? 1.0f : 0.0f}, {cg::kClimb, 0.8f}}, hz(50), 0.8f, 2.0f)), 1500.0, kRate);
  });
  EXPECT(roar[1] > 1.15 * roar[0], "Roar works on Plate");
  const auto high = two([](int i) {
    return energy_above(mid(heard({{cg::kLowRing, 2.0f}, {cg::kHighRing, i ? 20.0f : 7.0f}, {cg::kClimb, 0.9f}, {cg::kThreshold, 0.0f}}, hz(50), 0.9f, 1.5f)), 900.0, kRate);
  });
  EXPECT(high[1] > 1.1 * high[0], "High ring works over a short Low ring");
  const auto ripple = two([](int i) {
    heard({{cg::kRoll, 0.8f}, {cg::kRollSpeed, i ? 12.0f : 2.0f}, {cg::kRollSwell, 0.1f}, {cg::kLowRing, 2.0f}}, hz(50), 0.8f, 1.0f);
    const auto x = mid(play(2.0f));
    double least = 9.0, most = 0.0;
    for (size_t k = 0; k + 2400 <= x.size(); k += 2400) {
      least = std::min(least, rms(x, k, k + 2400));
      most = std::max(most, rms(x, k, k + 2400));
    }
    return db(most / least);
  });
  EXPECT(ripple[0] > ripple[1] + 1.5, "a slow roll is heard stroke by stroke");
}

void check_levels() {
  double least = 99.0, most = -99.0;
  for (int key = 36; key <= 84; key += 4) {
    fresh();
    const double p = db(top(struck(hz(key), 0.7f, 2.5f)));
    if (p < -24.0 || p > -10.0) std::printf("  key %d: %.1f dBFS\n", key, p);
    EXPECT(p > -24.0 && p < -10.0, "one note at 0.7 peaks between -24 and -10 dBFS");
    least = std::min(least, p);
    most = std::max(most, p);
  }
  EXPECT(most - least < 4.0, "the keyboard is level");
  fresh();
  for (int key : {38, 45, 50, 53, 57, 60, 64, 69, 72, 76}) gong.note_on(key, hz(key), 1.0f);
  EXPECT(top(play(4.0f)) < 0.5, "ten keys stay under the knee");
  const auto at = two([](int i) {
    plain({}, i ? 96000.0f : 44100.0f);
    return db(rms(mid(struck(220.0f, 0.8f, 3.0f, i ? 96000.0f : 44100.0f))));
  });
  EXPECT_NEAR(at[0], at[1], 0.6, "the level is the same at 44.1 and 96 kHz");
  const auto a = heard({{cg::kRoll, 0.2f}}, 220.0f, 0.8f, 3.0f);
  EXPECT(std::fabs(mean(a.left)) < 1.0e-3, "no steady offset");
  EXPECT(energy_above(a.left, 9000.0, kRate) < 0.01, "nothing that hisses on top");
}

// A block of sound with an event in it against the same without.
void check_clicks() {
  const auto worst = [](Set set, const std::function<void()>& event) {
    double loud[2];
    for (int i = 0; i < 2; ++i) {
      plain({{cg::kClimb, 0.3f}, {cg::kRoar, 0.0f}});
      for (const auto& p : set) gong.set_param(p.first, p.second);
      gong.note_on(1, 110.0f, 0.8f);
      gong.note_on(2, 165.0f, 0.8f);
      play(1.0f);
      if (i) event();
      const auto a = play(0.5f);
      loud[i] = std::max(bend_of(a.left), bend_of(a.right));
    }
    return loud[1] / loud[0];
  };
  for (int p = 0; p < cg::kNumParams; ++p) {
    if (p == cg::kVolume) continue;
    for (float v : {cg::kParamMin[p], cg::kParamMax[p]}) {
      const double ratio = worst({}, [&] { gong.set_param(p, v); });
      // A roll turned on strikes, and Roar and Climb bring in what is brighter than the ring.
      const double room = p == cg::kRoll || p == cg::kRoar || p == cg::kClimb || p == cg::kBend ? 60.0 : 3.0;
      if (ratio > room) std::printf("  param %d to %g: %.1f\n", p, v, ratio);
      EXPECT(ratio < room, "a knob that jumps does not click");
    }
  }
  EXPECT(worst({}, [] { gong.set_param(cg::kVolume, -48.0f); }) < 2.0, "Volume does not click");
  const auto again = worst({}, [] { gong.note_on(3, 110.0f, 0.7f); }), first = worst({}, [] { gong.note_on(3, 220.0f, 0.7f); });
  const double stopped = worst({{cg::kChoke, 1.0f}}, [] { gong.note_off(1); });
  std::printf("  clicks: restrike %.1f, new key %.1f, choke %.1f times the ring\n", again, first, stopped);
  EXPECT(again < 1.5 * first && stopped < 2.0, "a restrike and a choke do not click");
  // Six new keys where six are taken from twelve, against six where there is room.
  const auto bend = two([](int i) {
    plain({{cg::kClimb, 0.0f}});
    for (int k = 0; k < (i ? 12 : 6); ++k) gong.note_on(k, hz(40 + k), 0.8f);
    play(1.0f);
    for (int k = 0; k < 6; ++k) gong.note_on(20 + k, hz(52 + k), 0.8f);
    return bend_of(play(0.25f).left);
  });
  std::printf("  steal: %.2f times the same strokes with room\n", bend[1] / bend[0]);
  EXPECT(bend[1] < 1.5 * bend[0], "a stolen key does not click");
}

void check_notes() {
  // A, B, A under one id, then one release: nothing is left held.
  fresh({{cg::kChoke, 1.0f}, {cg::kSympathy, 0.0f}});
  for (float f : {220.0f, 330.0f, 220.0f}) {
    gong.note_on(7, f, 0.8f);
    play(0.1f);
  }
  gong.note_off(7);
  play(3.0f);
  EXPECT(top(play(0.2f)) == 0.0, "an id back at its first pitch leaves no key held");
  plain({{cg::kChoke, 1.0f}});
  for (float f : {220.0f, 311.0f}) gong.note_on(7, f, 0.8f);
  EXPECT(tone_level(play(1.5f).left, 220.0, kRate, 36000) < 1.0e-4, "an id gone to another pitch lets its first key go");
  // The same inside a steal.
  fresh({{cg::kChoke, 1.0f}, {cg::kSympathy, 0.0f}, {cg::kBeater, 4.0f}});
  for (int i = 0; i < 12; ++i) gong.note_on(i, hz(40 + i), 0.8f);
  play(0.3f);
  for (float f : {880.0f, 990.0f, 880.0f}) gong.note_on(30, f, 0.8f);
  for (int i = 0; i <= 30; ++i) gong.note_off(i);
  play(4.0f);
  EXPECT(top(play(0.2f)) == 0.0, "a key struck twice inside a steal is let go with it");
  fresh();
  for (float f : {0.0f, -5.0f, 5.0f, 20000.0f, std::nanf(""), INFINITY}) gong.note_on(1, f, 0.8f);
  for (float g : {0.0f, 2.0f, -1.0f, std::nanf(""), INFINITY}) gong.note_on(2, 220.0f, g);
  const auto a = play(1.0f);
  EXPECT(finite(a.left) && finite(a.right) && top(a) <= 1.0, "absurd notes are survived");
  // Every knob through its range under a chord, every choice.
  fresh();
  for (int p = 0; p < cg::kNumParams; ++p) {
    for (int step = 0; step <= 6; ++step) {
      gong.note_on(step, hz(45 + 3 * step), 0.8f);
      gong.set_param(p, cg::kParamMin[p] + (cg::kParamMax[p] - cg::kParamMin[p]) * static_cast<float>(step) / 6.0f);
      const auto s = play(0.08f);
      EXPECT(finite(s.left) && finite(s.right) && top(s) <= 1.0, "every knob swept while sounding stays in bounds");
    }
    gong.set_param(p, cg::kParamDefault[p]);
  }
}

void check_blocks() {
  const auto take = [](int block, int beater) {
    fresh({{cg::kRoll, 0.5f}, {cg::kBeater, static_cast<float>(beater)}, {cg::kChoke, 1.0f}, {cg::kLowRing, 1.0f}, {cg::kHighRing, 0.3f}, {cg::kSympathy, 0.4f}});
    gong.note_on(1, 220.0f, 0.8f);
    gong.note_on(2, 277.0f, 0.5f);
    Stereo all = play(2048.0f * 20 / kRate, kRate, block);
    for (int id : {1, 2}) gong.note_off(id);
    all = concat(all, play(2048.0f * 200 / kRate, kRate, block));
    gong.set_param(cg::kWidth, 0.1f);
    gong.set_param(cg::kGround, 0.9f);
    gong.note_on(3, 330.0f, 0.7f);
    return concat(all, play(2048.0f * 20 / kRate, kRate, block));
  };
  for (int beater : {0, 3, 4}) {
    const Stereo a = take(128, beater), b = take(1, beater), c = take(2048, beater);
    EXPECT(same_audio(a, b) && same_audio(a, c), "block sizes 1, 128 and 2048 are one sound across a silence");
    EXPECT(peak(a.left, 2048 * 217, 2048 * 219) == 0.0, "and it slept to exact silence between");
  }
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "climbing-gong";
  spec.num_params = cg::kNumParams;
  spec.mins = cg::kParamMin;
  spec.maxs = cg::kParamMax;
  spec.defaults = cg::kParamDefault;
  spec.tail_seconds = 24.0f;
  spec.max_peak = 1.01f;
  check_instrument(gong, spec, kRate);
  check_pitch();
  check_climb();
  check_matter();
  check_choices();
  check_levels();
  check_clicks();
  check_notes();
  check_blocks();
  report_cost("climbing-gong (8 held)", 5.0f, kRate, [] {
    fresh();
    for (int i = 0; i < 8; ++i) gong.note_on(i, hz(45 + 3 * i), 0.7f);
    play(5.0f);
  });
  return finish("climbing-gong");
}
