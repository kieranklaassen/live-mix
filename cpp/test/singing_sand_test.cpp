// Native harness for Singing Sand (cpp/devices/singing-sand). Conformance
// first; the rest measures what makes it what it is: 24 grains a key that fall
// into step, a tone held on its note whatever they do, clusters and a layer
// that are heard as overtones of the key, and surges that cross the keys.
// Nobody has listened to it: every claim below is a number.

#include "../devices/singing-sand/singing_sand.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SingingSand;
namespace p = livemix::singing_sand;

static SingingSand device;
static const float kRate = 48000.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }
// One key down, and what it sounds like.
static Stereo play(float seconds, float hz = 220.0f, float gain = 0.7f) {
  device.note_on(1, hz, gain);
  return render(device, seconds, kRate);
}
static double both_peak(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(x.left, from, to), peak(x.right, from, to));
}
static double both_rms(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  const double l = rms(x.left, from, to), r = rms(x.right, from, to);
  return std::sqrt(0.5 * (l * l + r * r));
}
static void add(std::vector<float>& a, const std::vector<float>& b) { a.insert(a.end(), b.begin(), b.end()); }

// An even slide of clean grains: no surge, hiss, layer, boom or sand over it.
static void plain(float lock, float rate = kRate) {
  device.init(rate);
  device.set_param(p::kLockstep, lock);
  device.set_param(p::kGrit, 0.1f);
  device.set_param(p::kSpread, 4.0f);
  device.set_param(p::kFlow, 1.0f);
  device.set_param(p::kOnset, 0.05f);
  for (int id : {p::kLayer, p::kBury, p::kBoom, p::kDry, p::kSlope, p::kWidth}) device.set_param(id, 0.0f);
}

static double harmonic(const Stereo& x, double hz, double from = 1.0, double to = 3.0, double rate = kRate) {
  return tone_level(x.left, hz, rate, at(from, rate), at(to, rate));
}

// What is on the harmonics of `hz` against what is between them, in dB.
static double clarity(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double tone = 0.0, between = 1.0e-18;
  for (int h = 1; h <= 12; ++h) {
    const double on = tone_level(x, hz * h, kRate, from, to);
    tone += on * on;
    for (double off : {0.31, 0.43, 0.57, 0.69}) {
      const double level = tone_level(x, hz * (h + off), kRate, from, to);
      between += level * level;
    }
  }
  return 10.0 * std::log10(tone / between);
}

static double mean_coherence(double seconds) {
  double sum = 0.0;
  const int steps = static_cast<int>(seconds * 50.0);
  for (int i = 0; i < steps; ++i) render(device, 0.02f, kRate), sum += device.coherence(0);
  return sum / steps;
}

static void check_coherence() {
  for (float hz : {65.4f, 130.8f, 261.6f, 523.3f, 1046.5f}) {
    device.init(kRate);
    play(1.0f, hz);
    const double r = mean_coherence(5.0);
    char label[120];
    std::snprintf(label, sizeof label, "over 0.8 of the grains are in step at the defaults (%.1f Hz: %.2f)", hz, r);
    EXPECT(r > 0.8, label);
  }
  // Lockstep is what it says, all the way along.
  double last = 0.0;
  const double wanted[5] = {0.2, 0.4, 0.68, 0.89, 0.98};
  for (int i = 0; i < 5; ++i) {
    plain(0.25f * i);
    play(1.0f);
    const double r = mean_coherence(3.0);
    EXPECT_NEAR(r, wanted[i], 0.12, "Lockstep sets how many are in step");
    EXPECT(r > last, "more Lockstep is more grains in step");
    last = r;
  }
  // And Grit does not undo it.
  for (float grit : {0.0f, 0.5f, 1.0f}) {
    plain(0.75f);
    device.set_param(p::kGrit, grit);
    play(2.0f);
    EXPECT_NEAR(mean_coherence(3.0), 0.89, 0.1, "Grit leaves Lockstep as it is");
  }
}

static void check_tone() {
  // Noise with a pitch in it, to a clear note.
  double last = -100.0;
  for (float lock : {0.0f, 0.5f, 1.0f}) {
    plain(lock);
    Stereo out = play(4.0f);
    const double clear = clarity(out.left, 220.0, at(1.0), at(4.0));
    EXPECT(clear > last + 4.0, "the note comes out of the noise as the grains fall into step");
    if (lock == 1.0f) EXPECT(clear > 18.0, "at the top of Lockstep the note is clear");
    last = clear;
  }
  // On its note within 3 cents, at the defaults.
  for (float hz : {65.41f, 110.0f, 220.0f, 440.0f, 1046.5f}) {
    device.init(kRate);
    Stereo out = play(7.0f, hz);
    const double found = dominant_frequency(out.left, kRate, hz * 0.98, hz * 1.02, at(1.0), at(7.0));
    EXPECT_NEAR(cents(found, hz), 0.0, 3.0, "in tune at the defaults");
  }
  // The hiss is under the tone at rest, at the defaults and with Dry at the top.
  for (float dry : {0.25f, 1.0f}) {
    Stereo with, without;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kDry, pass == 0 ? dry : 0.0f);
      (pass == 0 ? with : without) = play(4.0f);
    }
    const double tone = rms(without.left, at(1.0), at(4.0));
    for (size_t i = 0; i < with.left.size(); ++i) with.left[i] -= without.left[i];
    const double hiss = rms(with.left, at(1.0), at(4.0));
    EXPECT(db(hiss / tone) < (dry < 0.5f ? -14.0 : -1.0), "the hiss stays under the tone");
    EXPECT(hiss > 0.0, "there is a hiss");
  }
}

static void check_formants() {
  // Clusters are heard as overtones: the group's harmonic is the strongest.
  for (int groups : {2, 3, 5}) {
    Stereo one, many;
    for (int pass = 0; pass < 2; ++pass) {
      plain(1.0f);
      device.set_param(p::kGrain, 0.8f);
      device.set_param(p::kCluster, pass == 0 ? 1.0f : static_cast<float>(groups));
      (pass == 0 ? one : many) = play(3.0f, 147.0f);
    }
    const auto over = [&](const Stereo& x) { return db(harmonic(x, 147.0 * groups) / harmonic(x, 147.0)); };
    const double before = over(one), after = over(many);
    EXPECT(after > before + 5.0, "a cluster of n raises the n-th overtone over the note");
    EXPECT(after > 0.0 || groups == 5, "and it is the stronger of the two");
    EXPECT(harmonic(many, 147.0) > 0.04 * harmonic(one, 147.0), "the key's own note stays");
  }
  // And with some of the grains astray: they lie in narrower places.
  plain(0.8f);
  device.set_param(p::kGrain, 0.6f);
  device.set_param(p::kCluster, 5.0f);
  Stereo loose = play(3.0f, 147.0f);
  EXPECT(harmonic(loose, 147.0 * 5) > 2.2 * harmonic(loose, 147.0), "a cluster is heard with grains astray");
  // The layer sings the overtone it is set to.
  for (int order : {2, 4, 6}) {
    plain(0.95f);
    device.set_param(p::kGrain, 0.8f);
    device.set_param(p::kLayer, 0.8f);
    device.set_param(p::kLayerOrder, static_cast<float>(order));
    Stereo out = play(3.0f, 147.0f);
    const double picked = harmonic(out, 147.0 * order);
    EXPECT(picked > 2.0 * harmonic(out, 147.0 * (order - 1)) && picked > 2.0 * harmonic(out, 147.0 * (order + 1)),
           "the layer lifts its overtone out");
  }
  // The boom is an octave down and goes when the grains come apart.
  double booms[2];
  for (double& boom : booms) {
    plain(&boom == booms ? 1.0f : 0.2f);
    device.set_param(p::kBoom, 0.8f);
    boom = harmonic(play(3.0f), 110.0);
  }
  EXPECT(booms[0] > 5.0 * booms[1], "the slope booms only while the grains are in step");
  // Five kinds of sand, far apart: where their energy sits.
  double bright[5];
  for (int kind = 0; kind < 5; ++kind) {
    plain(0.9f);
    device.set_param(p::kPulse, static_cast<float>(kind));
    bright[kind] = energy_above(play(2.0f).left, 900.0, kRate, at(0.5), at(2.0));
  }
  EXPECT(bright[1] > 2.0 * bright[0] && bright[2] > 1.2 * bright[1] && bright[3] < bright[1] && bright[4] > bright[0],
         "flint is brighter than round sand and squeaking sand brighter still");
}

// Patches drawn from a seed, five keys down: none of them silent, none near the rails.
static void check_random() {
  livemix::kit::Rng rng;
  rng.seed(77u);
  int silent = 0, hot = 0;
  for (int n = 0; n < 24; ++n) {
    device.init(kRate);
    for (int id = 0; id < p::kVolume; ++id) {
      const float u = rng.uniform();
      const float low = p::kParamMin[id], high = p::kParamMax[id];
      device.set_param(id, id == p::kOnset ? 0.004f + 0.8f * u * u : low > 0.0f ? low * std::pow(high / low, u) : low + (high - low) * u);
    }
    device.set_param(p::kFlow, 0.3f + 0.7f * rng.uniform());
    const float keys[5] = {146.8f, 220.0f, 349.2f, 523.3f, 659.3f};
    for (int k = 0; k < 5; ++k) device.note_on(k, keys[k], 0.8f);
    Stereo out = render(device, 2.5f, kRate);
    silent += both_rms(out) < 0.002 ? 1 : 0;
    hot += both_peak(out) > 0.6 ? 1 : 0;
  }
  EXPECT(silent <= 1, "patches drawn at random can be heard");
  EXPECT(hot <= 2, "and keep away from the rails");
}

// What Dry and Width and Grain do to the loose sand.
static void check_loose() {
  // With no Width all of it is in the middle, the hiss and its ticks too.
  device.init(kRate);
  device.set_param(p::kDry, 1.0f);
  device.set_param(p::kWidth, 0.0f);
  Stereo flat = play(1.0f);
  EXPECT(flat.left == flat.right, "no Width is mono, the hiss too");
  // Finer sand hisses higher.
  double top[2];
  for (double& share : top) {
    plain(0.0f);
    device.set_param(p::kDry, 1.0f);
    device.set_param(p::kGrain, &share == top ? 0.1f : 0.9f);
    Stereo out = play(2.0f);
    share = energy_above(out.left, 3000.0, kRate, at(0.5)) / rms(out.left, at(0.5), out.left.size());
  }
  EXPECT(top[1] > 1.5 * top[0], "finer sand hisses higher");
  // The note goes back to a hiss: after a key is let go there is more above it.
  device.init(kRate);
  device.set_param(p::kSlope, 0.0f);
  Stereo held = play(2.0f);
  device.note_off(1);
  Stereo tail = render(device, 2.0f, kRate);
  const auto airy = [](const Stereo& x, double from, double to) {
    return energy_above(x.left, 1500.0, kRate, at(from), at(to)) / rms(x.left, at(from), at(to));
  };
  EXPECT(airy(tail, 0.8, 1.4) > 1.3 * airy(held, 1.0, 2.0), "let go, the note goes back to a hiss");
  // The loudest of the loose sand stays a texture: slips, a thin layer, all of Dry.
  device.init(kRate);
  for (auto set : {std::make_pair(p::kPulse, 1.0f), {p::kSurge, 1.0f}, {p::kSlope, 0.8f}, {p::kDry, 1.0f},
                   {p::kLayer, 0.7f}, {p::kLayerOrder, 7.0f}, {p::kLockstep, 0.3f}, {p::kPace, 1.5f}})
    device.set_param(set.first, set.second);
  EXPECT(both_peak(play(3.0f, 220.0f, 0.8f)) < 0.32, "loose sand is thrown only so hard");
}

static void check_touch() {
  Stereo soft, hard;
  for (int pass = 0; pass < 2; ++pass) {
    plain(0.9f);
    device.set_param(p::kGrain, 0.55f);
    (pass == 0 ? soft : hard) = play(2.0f, 220.0f, pass == 0 ? 0.25f : 1.0f);
  }
  EXPECT(db(both_rms(hard, at(0.5)) / both_rms(soft, at(0.5))) > 7.0, "a harder touch is louder");
  EXPECT(energy_above(hard.left, 800.0, kRate, at(0.5)) > 1.5 * energy_above(soft.left, 800.0, kRate, at(0.5)),
         "and brighter");
  // The grains meet without a thump, however many of them do.
  device.init(kRate);
  device.set_param(p::kLockstep, 1.0f);
  device.set_param(p::kSlope, 0.0f);
  device.set_param(p::kFlow, 1.0f);
  Stereo met = play(3.0f, 147.0f);
  EXPECT(db(both_rms(met, at(0.2), at(0.6)) / both_rms(met, at(2.0))) < 3.0, "grains that meet do not thump");
  // Level is roughly even over the keyboard, and one note sits where it should.
  double lo = 1.0e9, hi = -1.0e9;
  for (float hz : {65.4f, 130.8f, 261.6f, 523.3f, 1046.5f}) {
    device.init(kRate);
    Stereo out = play(4.0f, hz);
    const double level = db(both_rms(out, at(0.5))), top = db(both_peak(out));
    lo = std::min(lo, level), hi = std::max(hi, level);
    EXPECT(top > -26.0 && top < -10.0, "one note peaks where an instrument's should");
  }
  EXPECT(hi - lo < 7.0, "level is even from C2 to C6");
  // Ten keys at full touch stay under the knee of the clip.
  device.init(kRate);
  const int keys[10] = {38, 45, 50, 53, 57, 60, 64, 69, 72, 76};
  for (int i = 0; i < 10; ++i) device.note_on(i, 440.0f * std::pow(2.0f, (keys[i] - 69) / 12.0f), 1.0f);
  EXPECT(both_peak(render(device, 5.0f, kRate)) < 0.5, "ten keys stay under the knee");
}

// Level of a held key in windows of `window` seconds, dB.
static std::vector<double> contour(const Stereo& x, double window) {
  std::vector<double> out;
  const size_t n = at(window);
  for (size_t from = 0; from + n <= x.size(); from += n) out.push_back(db(both_rms(x, from, from + n)));
  return out;
}

static void check_surges() {
  // Waves: with Front at zero two keys two octaves apart swell together, and
  // with more the upper one's crest comes at another time.
  for (float front : {0.0f, 1.0f}) {
    double best[2];
    for (int key = 0; key < 2; ++key) {
      plain(0.9f);
      device.set_param(p::kSlope, 0.8f);
      device.set_param(p::kPace, 0.5f);
      device.set_param(p::kFront, front);
      const std::vector<double> level = contour(play(4.0f, key == 0 ? 110.0f : 220.0f * 1.5f), 0.05);
      size_t top = 20;
      for (size_t i = 20; i < 60; ++i) top = level[i] > level[top] ? i : top;
      best[key] = 0.05 * static_cast<double>(top);
    }
    if (front == 0.0f) EXPECT(std::fabs(best[0] - best[1]) < 0.25, "with no Front the keys surge together");
    else EXPECT(std::fabs(best[0] - best[1]) > 0.3, "with Front the surge takes time across the keys");
  }
  // Slips come one after another at Pace, and between two it falls away. A
  // shock has aftershocks, and the gaps between them grow.
  for (int surge : {1, 2}) {
    plain(0.9f);
    device.set_param(p::kSurge, static_cast<float>(surge));
    device.set_param(p::kSlope, 0.9f);
    device.set_param(p::kPace, surge == 1 ? 2.0f : 1.0f);
    device.set_param(p::kFront, 0.0f);
    const std::vector<double> level = contour(play(surge == 1 ? 6.0f : 4.0f), 0.02);
    std::vector<double> times;
    for (size_t i = 5; i < level.size(); ++i) {
      const bool apart = times.empty() || 0.02 * i - times.back() > 0.1;
      if (apart && level[i] - level[i - 2] > (surge == 1 ? 5.0 : 3.0)) times.push_back(0.02 * static_cast<double>(i));
    }
    const size_t n = times.size();
    if (surge == 1) EXPECT(n >= 9 && n <= 13, "slips come at Pace");
    else EXPECT(n >= 4 && times[n - 1] - times[n - 2] > 1.5 * (times[1] - times[0]), "aftershocks grow rarer");
  }
  // At Slope zero the slide is even whatever the kind.
  for (int kind = 0; kind < 3; ++kind) {
    plain(1.0f);
    device.set_param(p::kGrit, 0.0f);
    device.set_param(p::kSurge, static_cast<float>(kind));
    const std::vector<double> level = contour(play(4.0f), 0.25);
    double lo = 100.0, hi = -200.0;
    for (size_t i = 4; i < level.size(); ++i) lo = std::min(lo, level[i]), hi = std::max(hi, level[i]);
    EXPECT(hi - lo < 1.5, "an even slope is an even slide");
  }
}

static void check_times() {
  // Onset: the grains gather in the time it says, and the note with them.
  for (float onset : {0.1f, 1.6f}) {
    device.init(kRate);
    device.set_param(p::kOnset, onset);
    device.set_param(p::kSlope, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    double met = 0.0;
    for (double t = 0.0; t < 4.0 && met == 0.0; t += 0.02) {
      render(device, 0.02f, kRate);
      if (device.coherence(0) > 0.7f) met = t;
    }
    EXPECT(met > (onset > 1.0f ? 0.3 : 0.0) && met < 1.1 * onset + 0.1, "the grains gather within Onset");
  }
  // Slump: 60 dB in the time it says, and the grains fall out of step with it.
  for (float slump : {0.4f, 2.0f}) {
    device.init(kRate);
    device.set_param(p::kSlope, 0.0f);
    device.set_param(p::kSlump, slump);
    play(1.5f);
    const double held = mean_coherence(0.5);
    device.note_off(1);
    Stereo tail = render(device, 0.75f * slump, kRate);
    const double fallen = device.coherence(0);
    Stereo rest = render(device, 2.0f * slump, kRate);
    EXPECT(fallen < 0.75 * held, "let go, the grains fall out of step");
    const double drop = db(both_rms(tail, 0, at(0.05)) / both_rms(tail, at(0.7 * slump), at(0.75 * slump)));
    EXPECT(drop > 30.0 && drop < 62.0, "Slump is how long it takes to come to rest");
    EXPECT(both_peak(rest, rest.size() - 2000) == 0.0, "and then there is nothing at all");
  }
  // Flow at zero: the sand runs out by itself.
  device.init(kRate);
  device.set_param(p::kFlow, 0.0f);
  device.set_param(p::kRun, 0.5f);
  device.set_param(p::kOnset, 0.01f);
  EXPECT(both_peak(play(2.5f), at(2.0)) == 0.0, "with no Flow a held key ends");
}

static const float kChord[4] = {146.83f, 220.0f, 349.23f, 523.25f};

// The largest second difference: what a click is, against the same sound with
// no event in it.
static double bend(const Stereo& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = std::max<size_t>(from, 2); i < std::min(to, x.size()); ++i) {
    worst = std::max(worst, static_cast<double>(std::fabs(x.left[i] - 2.0f * x.left[i - 1] + x.left[i - 2])));
    worst = std::max(worst, static_cast<double>(std::fabs(x.right[i] - 2.0f * x.right[i - 1] + x.right[i - 2])));
  }
  return worst;
}

static void check_clicks() {
  // Each knob thrown from end to end in a soft, dark, slow chord: no step in it
  // is sharper than the sharpest of the settled sound on either side.
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    device.set_param(p::kDry, 0.0f);
    device.set_param(p::kGrain, 0.2f);
    device.set_param(p::kSlope, 0.15f);
    for (int n = 0; n < 4; ++n) device.note_on(n, kChord[n], 0.6f);
    render(device, 1.5f, kRate);
    double sharpest = 0.0, struck = 0.0;
    for (float to : {p::kParamMin[id], p::kParamMax[id], p::kParamMin[id]}) {
      device.set_param(id, to);
      Stereo turned = render(device, 0.9f, kRate);
      struck = std::max(struck, bend(turned, 0, at(0.06)));
      sharpest = std::max(sharpest, bend(turned, at(0.3), at(0.9)));
      EXPECT(finite(turned.left) && both_peak(turned) < 1.0, "a knob thrown while sounding stays bounded");
    }
    char label[120];
    std::snprintf(label, sizeof label, "knob %d thrown makes no click (%g against %g)", id, struck, sharpest);
    EXPECT(struck < 1.6 * sharpest + 0.0012, label);
  }
  // Keys stolen and struck again: no sharper than a key going down.
  device.init(kRate);
  device.set_param(p::kDry, 0.0f);
  device.set_param(p::kOnset, 0.03f);
  double played = 0.0;
  for (int n = 0; n < 12; ++n) {
    device.note_on(n, 110.0f * std::pow(2.0f, n / 6.0f), 0.6f);
    played = std::max(played, bend(render(device, 0.15f, kRate), 0, SIZE_MAX));
  }
  played = std::max(played, bend(render(device, 1.5f, kRate), 0, SIZE_MAX));
  double stolen = 0.0;
  for (int n = 0; n < 12; ++n) {
    device.note_on(20 + n, 120.0f * std::pow(2.0f, n / 6.0f), 0.6f);
    stolen = std::max(stolen, bend(render(device, 0.1f, kRate), 0, SIZE_MAX));
    device.note_on(20 + n, 120.0f * std::pow(2.0f, n / 6.0f), 0.6f);
    stolen = std::max(stolen, bend(render(device, 0.004f, kRate), 0, SIZE_MAX));
  }
  EXPECT(stolen < 1.5 * played, "a key stolen or struck again makes no click");
  // A full slope of dark slow keys, and one of them taken by a key nobody hears.
  device.init(kRate);
  for (auto set : {std::make_pair(p::kDry, 0.0f), {p::kGrain, 0.1f}, {p::kSlope, 0.0f}, {p::kOnset, 1.0f}, {p::kBury, 0.6f}})
    device.set_param(set.first, set.second);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.7f);
  render(device, 4.0f, kRate);
  const double settled = bend(render(device, 1.0f, kRate), 0, SIZE_MAX);
  double taken = 0.0;
  for (int n = 0; n < 4; ++n) {
    render(device, 0.0107f, kRate);  // between two ticks, so the first sample hides nothing
    device.note_on(40 + n, 110.0f, 0.01f);
    taken = std::max(taken, bend(render(device, 0.1f, kRate), 0, SIZE_MAX));
  }
  EXPECT(taken < 1.5 * settled, "a key taken fades before the next begins");
}

static void check_faults() {
  // One id at one pitch, another and the first again, then one note off.
  for (float gap : {0.0f, 0.002f, 0.1f}) {
    device.init(kRate);
    device.set_param(p::kSlump, 0.1f);
    for (float hz : {220.0f, 330.0f, 220.0f}) {
      device.note_on(7, hz, 0.7f);
      if (gap > 0.0f) render(device, gap, kRate);
    }
    device.note_off(7);
    render(device, 3.0f, kRate);
    EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "an id played at three pitches ends with one note off");
  }
  // The same with the pool full, inside a steal.
  device.init(kRate);
  device.set_param(p::kSlump, 0.1f);
  for (int n = 0; n < 12; ++n) device.note_on(100 + n, 200.0f + 30.0f * n, 0.5f);
  render(device, 0.3f, kRate);
  for (float hz : {220.0f, 330.0f, 220.0f}) device.note_on(7, hz, 0.7f);
  render(device, 0.001f, kRate);
  device.note_off(7);
  for (int n = 0; n < 12; ++n) device.note_off(100 + n);
  render(device, 3.0f, kRate);
  EXPECT(both_peak(render(device, 0.3f, kRate)) == 0.0, "nothing hangs when a stolen key is let go before it began");
  // Notes nobody plays.
  device.init(kRate);
  for (float hz : {0.0f, -5.0f, 5.0f, 20000.0f, 1.0e9f, std::nanf(""), INFINITY}) device.note_on(1, hz, 2.0f);
  for (float gain : {0.0f, -1.0f, 2.0f, std::nanf(""), INFINITY}) device.note_on(2, 220.0f, gain);
  Stereo odd = render(device, 1.0f, kRate);
  EXPECT(finite(odd.left) && finite(odd.right) && both_peak(odd) < 1.0, "absurd notes are survived");
  // Block size: the same samples at 1, 128 and 2048 across a silence.
  std::vector<float> first;
  for (int block : {1, 7, 128, 2048}) {
    device.init(kRate);
    device.set_param(p::kSlump, 0.2f);
    device.set_param(p::kSurge, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    device.note_on(2, 330.0f, 0.7f);
    std::vector<float> all = render(device, 0.2988f, kRate, block).left;
    // The kind of sand, its grain and its groups, changed under held keys.
    for (auto set : {std::make_pair(p::kPulse, 2.0f), {p::kGrain, 0.2f}, {p::kCluster, 3.0f}}) {
      device.set_param(set.first, set.second);
      add(all, render(device, 0.2988f, kRate, block).left);
    }
    device.note_off(1);
    device.note_off(2);
    add(all, render(device, 2.0912f, kRate, block).left);
    device.set_param(p::kGrain, 0.9f);
    device.note_on(3, 247.0f, 0.7f);
    add(all, render(device, 0.5974f, kRate, block).left);
    if (first.empty()) first = all;
    EXPECT(first == all, "block size changes no sample, across a silence too");
  }
  // A knob moved in the silence has arrived when the next key goes down.
  for (int id = 0; id < p::kNumParams; ++id) {
    std::vector<float> fresh, moved;
    for (int pass = 0; pass < 2; ++pass) {
      plain(0.9f);
      device.set_param(p::kSlump, 0.1f);
      if (pass == 0) device.set_param(id, p::kParamMax[id]);
      play(0.1f);
      device.note_off(1);
      for (int s = 0; s < 40 && both_peak(render(device, 1.0f, kRate)) > 0.0; ++s) {
      }
      device.set_param(id, p::kParamMax[id]);
      (pass == 0 ? fresh : moved) = play(0.1f).left;
    }
    EXPECT(fresh == moved, "a knob moved while asleep does not glide under the next note");
  }
  // The same sound at other sample rates.
  double level[3], bright[3];
  int i = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 6.0f, rate);
    level[i] = db(both_rms(out, at(0.5, rate)));
    bright[i++] = db(energy_above(out.left, 1000.0, rate, at(0.5, rate)));
  }
  for (int other : {0, 2}) {
    EXPECT_NEAR(level[other], level[1], 1.5, "as loud at 44.1 and 96 kHz");
    EXPECT_NEAR(bright[other], bright[1], 2.5, "as bright at 44.1 and 96 kHz");
  }
}

int main() {
  Conformance spec;
  spec.name = "singing-sand";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  check_coherence();
  check_tone();
  check_formants();
  check_loose();
  check_random();
  check_touch();
  check_surges();
  check_times();
  check_clicks();
  check_faults();
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 0.25f), 0.7f);
  report_cost("singing-sand, 8 keys", 4.0f, kRate, [] { render(device, 4.0f, kRate); });
  return finish("singing-sand");
}
