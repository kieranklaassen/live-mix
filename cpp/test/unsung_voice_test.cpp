// Unsung Voice, natively: the conformance pass, then what makes it what it is.
// Where the overtones of the keys meet there is a line nobody plays; it walks,
// it is pulled to one pitch or beats, it has the vibrato and the keys do not,
// a lone key sings through its partner, and no fundamental ever moves.

#include "../devices/unsung-voice/unsung_voice.h"

#include "support/test_kit.h"

using namespace testkit;
namespace p = livemix::unsung_voice;
using livemix::UnsungVoice;

static UnsungVoice device;
static const float kSr = 48000.0f;

static float hz_of(float note) { return 440.0f * std::pow(2.0f, (note - 69.0f) / 12.0f); }
static size_t at(double seconds) { return static_cast<size_t>(seconds * kSr); }

static void chord(const std::vector<float>& notes, float gain = 0.8f) {
  int id = 1;
  for (float note : notes) device.note_on(id++, hz_of(note), gain);
}
static const std::vector<float> kChord = {50, 57, 65, 72, 76};  // D3 A3 F4 C5 E5

static std::vector<float> mid(Stereo s) {
  for (size_t i = 0; i < s.size(); ++i) s.left[i] = 0.5f * (s.left[i] + s.right[i]);
  return s.left;
}

// A key alone, steady: one singer, no drift of the section, no air, no second line.
static void plain() {
  device.init(kSr);
  device.set_param(p::kCloseness, 1.0f);
  device.set_param(p::kBreath, 0.0f);
  device.set_param(p::kSecond, 0.0f);
  device.set_param(p::kAttack, 0.02f);
}

// One meeting, held with no vibrato.
static void still() {
  device.set_param(p::kPace, 12.0f);
  device.set_param(p::kVibrato, 0.0f);
}

// The worst second difference: a click raises it, a tone does not.
static double jerk(const Stereo& s, size_t from, size_t to) {
  double worst = 0.0;
  for (const std::vector<float>* x : {&s.left, &s.right}) {
    for (size_t i = from + 2; i < std::min(to, x->size()); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>((*x)[i]) - 2.0 * (*x)[i - 1] + (*x)[i - 2]));
    }
  }
  return worst;
}

static void line_stands_out() {
  for (int body = 0; body < 5; ++body) {
    device.init(kSr);
    device.set_param(p::kBody, static_cast<float>(body));
    still();
    device.set_param(p::kSecond, 0.0f);
    chord(kChord);
    render(device, 1.5f, kSr);
    const float line = device.meter(UnsungVoice::kMeterLine);
    const std::vector<float> m = mid(render(device, 1.5f, kSr));
    EXPECT(line > 300.0f && line < 2500.0f, "the line stands under 2.5 kHz");
    const double level = tone_level(m, line, kSr);
    // The loudest thing from a quarter tone to a fourth away that is no key's own note.
    double beside = 0.0;
    for (double cents = -500.0; cents <= 500.0; cents += 4.0) {
      const double hz = line * std::pow(2.0, cents / 1200.0);
      bool skip = std::fabs(cents) < 60.0;
      for (float note : kChord) skip = skip || std::fabs(1200.0 * std::log2(hz / hz_of(note))) < 50.0;
      if (!skip) beside = std::max(beside, tone_level(m, hz, kSr));
    }
    static const double kOver[5] = {23.0, 13.0, 31.0, 18.5, 29.0};
    EXPECT(db(level / beside) > kOver[body], "the line is well over its neighbours");
    for (float note : kChord) EXPECT(std::fabs(1200.0f * std::log2(line / hz_of(note))) > 40.0f, "on no key's own note");
  }
}

static void lone_key() {
  const float key = hz_of(57);
  for (const auto& pair : {std::pair<int, int>{7, 3}, {12, 2}, {5, 4}, {4, 5}, {10, 7}}) {  // the partner, and the overtone
    plain();
    device.set_param(p::kPartner, static_cast<float>(pair.first));
    device.set_param(p::kPace, 12.0f);
    device.note_on(1, key, 0.7f);
    render(device, 1.5f, kSr);
    const float line = device.meter(UnsungVoice::kMeterLine);
    const float times = line / (key * static_cast<float>(pair.second));
    EXPECT(line > 0.0f && std::fabs(times - std::round(times)) < 0.003f, "a lone key sings on its partner's overtones");
  }
  plain();
  device.set_param(p::kPartner, 0.0f);
  device.note_on(1, key, 0.7f);
  render(device, 2.0f, kSr);
  EXPECT(device.meter(UnsungVoice::kMeterLine) == 0.0f, "with no partner a lone key has no line");
  device.note_on(2, hz_of(67), 0.7f);
  render(device, 4.0f, kSr);
  EXPECT(device.meter(UnsungVoice::kMeterLine) > 500.0f, "and two keys have one between them");
  for (float note = 36.0f; note <= 96.0f; note += 4.0f) {
    plain();
    device.note_on(1, hz_of(note), 0.7f);
    render(device, 1.5f, kSr);
    EXPECT(device.meter(UnsungVoice::kMeterLineLevel) > 0.1f, "every key from C2 to C7 has a line");
  }
}

static void fundamentals_stay() {
  for (int body = 0; body < 5; ++body) {
    plain();
    device.set_param(p::kBody, static_cast<float>(body));
    device.set_param(p::kTolerance, 60.0f);
    device.set_param(p::kVibrato, 1.0f);
    chord(kChord);
    const std::vector<float> m = mid(render(device, 4.0f, kSr));
    for (float note : kChord) {
      // How far its phase goes in two seconds, against a sine at the key.
      const double hz = hz_of(note), turn = tone_phase(m, hz, kSr, at(3.2), at(4.0)) - tone_phase(m, hz, kSr, at(1.2), at(2.0));
      const double off = std::remainder(turn, 2.0 * kPi) / (2.0 * kPi * 2.0);
      EXPECT(std::fabs(1200.0 * std::log2(1.0 + off / hz)) < 1.0, "a fundamental stays where it is");
    }
  }
}

// Two keys whose fifth and fourth overtones are 14 cents apart, and the line alone.
static std::vector<float> third(float beating, float lift, int body) {
  plain();
  still();
  const int ids[7] = {p::kPartner, p::kColour, p::kRegister, p::kBeating, p::kLift, p::kBody, p::kTolerance};
  const float to[7] = {0.0f, 0.0f, 900.0f, beating, lift, static_cast<float>(body), 60.0f};
  for (int i = 0; i < 7; ++i) device.set_param(ids[i], to[i]);
  chord({50, 54});
  return mid(render(device, 4.0f, kSr));
}

// How much its level moves, in dB, and how often it comes up past the middle.
static double swing(const std::vector<float>& m, int* times) {
  double least = 1.0e9, most = 0.0, before = 1.0e9;
  const double middle = rms(m, at(1.8), at(3.9));
  for (double t = 1.8; t < 3.9; t += 0.02) {
    const double level = rms(m, at(t), at(t + 0.02));
    *times += level > middle && before <= middle ? 1 : 0;
    before = level;
    least = std::min(least, level);
    most = std::max(most, level);
  }
  return db(most / least);
}

static void pulled_or_beating() {
  int still_times = 0, loose_times = 0;
  const double fused = swing(third(0.0f, 1.0f, 0), &still_times);
  const float line = device.meter(UnsungVoice::kMeterLine), fifth = hz_of(50) * 5.0f;
  EXPECT_NEAR(1200.0 * std::log2(line / fifth), 7.0, 5.0, "the meeting is between the two overtones");
  const double loose = swing(third(0.8f, 1.0f, 0), &loose_times);
  EXPECT(fused < 1.5 && loose > 9.0, "pulled together a meeting is one steady tone, let go it beats");
  EXPECT(loose_times >= 9 && loose_times <= 20, "at about the distance of the two overtones");
  const std::vector<float> m = third(0.0f, 0.5f, 1);
  EXPECT(db(tone_level(m, fifth, kSr, at(1.8)) / tone_level(m, line, kSr, at(1.8))) < -36.0, "what is in the line has left its key");
}

static void walking() {
  for (float lean : {1.0f, -1.0f}) {
    plain();
    device.set_param(p::kLean, lean);
    device.set_param(p::kPace, 0.35f);
    device.set_param(p::kGlide, 0.0f);
    chord(kChord);
    int with = 0, against = 0, sung = 0;
    float before = 0.0f;
    for (int i = 0; i < 80; ++i) {
      render(device, 0.1f, kSr);
      const float now = device.meter(UnsungVoice::kMeterLine);
      if (before > 0.0f && now > 0.0f && std::fabs(now / before - 1.0f) > 0.01f) ++((now > before) == (lean > 0.0f) ? with : against);
      if (now > 0.0f) before = now;
      for (float note : kChord) sung += now > 0.0f && std::fabs(now / hz_of(note) - 1.0f) < 0.02f ? 1 : 0;
    }
    EXPECT(with > against && with >= 8, "a leaning line goes its way and begins again");
    EXPECT(sung == 0, "and stands on nobody's note");
  }
  int steps[2] = {0, 0};
  for (int k = 0; k < 2; ++k) {
    plain();
    device.set_param(p::kPace, k == 0 ? 0.3f : 2.4f);
    device.set_param(p::kGlide, 0.0f);
    chord(kChord);
    float before = 0.0f;
    for (int i = 0; i < 240; ++i) {
      render(device, 0.05f, kSr);
      steps[k] += device.meter(UnsungVoice::kMeterLine) != before ? 1 : 0;
      before = device.meter(UnsungVoice::kMeterLine);
    }
  }
  EXPECT(steps[0] > 4 * steps[1] && steps[1] >= 3, "Pace is how long the line stands");
  // A slide passes between, a step does not.
  for (float glide : {0.0f, 1.0f}) {
    plain();
    device.set_param(p::kGlide, glide);
    device.set_param(p::kPace, 1.0f);
    device.note_on(1, hz_of(48), 0.8f);
    int between = 0;
    for (int i = 0; i < 400; ++i) {
      render(device, 0.02f, kSr);
      const float n = device.meter(UnsungVoice::kMeterLine) / (hz_of(48) * 3.0f);
      between += n > 0.0f && std::fabs(n - std::round(n)) > 0.02f ? 1 : 0;
    }
    EXPECT(glide > 0.5f ? between > 60 : between == 0, "Glide is how much of a step is a slide");
  }
  // The second line is another tone, and goes when its knob goes.
  plain();
  device.set_param(p::kSecond, 1.0f);
  chord(kChord);
  render(device, 4.0f, kSr);
  const float one = device.meter(UnsungVoice::kMeterLine), two = device.meter(UnsungVoice::kMeterSecond);
  EXPECT(one > 0.0f && two > 0.0f && std::fabs(one / two - 1.0f) > 0.02f, "two lines stand apart");
  device.set_param(p::kSecond, 0.0f);
  render(device, 1.0f, kSr);
  EXPECT(device.meter(UnsungVoice::kMeterSecond) == 0.0f, "and one of them can go");
}

static void line_and_keys() {
  const double key = hz_of(60), line = 3.0 * key;  // Hold: the key dies, the line sings on.
  plain();
  device.set_param(p::kHold, 0.1f);
  still();
  device.note_on(1, static_cast<float>(key), 0.8f);
  std::vector<float> m = mid(render(device, 3.0f, kSr));
  EXPECT(db(tone_level(m, key, kSr, at(0.1), at(0.3)) / tone_level(m, key, kSr, at(2.5), at(3.0))) > 40.0, "a plucked key dies");
  EXPECT(db(tone_level(m, line, kSr, at(2.5), at(3.0)) / tone_level(m, key, kSr, at(2.5), at(3.0))) > 20.0, "and the line is left");
  // Linger: a struck line dies by itself, the key does not.
  plain();
  device.set_param(p::kLinger, 0.15f);
  still();
  device.note_on(1, static_cast<float>(key), 0.8f);
  m = mid(render(device, 3.0f, kSr));
  double struck = 0.0;
  for (double t = 0.05; t < 0.6; t += 0.05) struck = std::max(struck, tone_level(m, line, kSr, at(t), at(t + 0.1)));
  EXPECT(db(struck / tone_level(m, line, kSr, at(2.0), at(3.0))) > 14.0, "a struck line dies");
  EXPECT(db(tone_level(m, key, kSr, at(2.0), at(3.0)) / tone_level(m, key, kSr, at(0.3), at(0.8))) > -3.0, "under a key that does not");
  // A knob at each end: the level of the line and of the key.
  auto ends = [&](int id, float* line_db, float* key_db) {
    for (int v = 0; v < 2; ++v) {
      plain();
      still();
      device.set_param(id, static_cast<float>(v));
      device.note_on(1, static_cast<float>(key), 0.8f);
      const std::vector<float> x = mid(render(device, 4.0f, kSr));
      line_db[v] = static_cast<float>(db(tone_level(x, line, kSr, at(2.0), at(4.0))));
      key_db[v] = static_cast<float>(db(tone_level(x, key, kSr, at(2.0), at(4.0))));
    }
  };
  float line_db[2], key_db[2];
  ends(p::kVibrato, line_db, key_db);
  EXPECT(line_db[0] - line_db[1] > 4.0f && std::fabs(key_db[0] - key_db[1]) < 0.2f, "vibrato is in the line and not in the key");
  ends(p::kLift, line_db, key_db);
  EXPECT(line_db[0] - key_db[0] < -8.0f && line_db[1] - key_db[1] > 12.0f, "Lift goes from keys alone to line alone");
}

static void touch_and_bodies() {
  auto tilt = [](int id, float value, float gain, float key, float high, float low, float lift = 0.0f) {
    plain();
    still();
    device.set_param(p::kLift, lift);
    device.set_param(id, value);
    device.note_on(1, key, gain);
    const std::vector<float> m = mid(render(device, 2.0f, kSr));
    return tone_level(m, key * high, kSr, at(0.8)) / tone_level(m, key * low, kSr, at(0.8));
  };
  for (int body = 0; body < 5; ++body) {
    const float b = static_cast<float>(body);
    EXPECT(tilt(p::kBody, b, 1.0f, 196.0f, 5.0f, 1.0f) > 1.7 * tilt(p::kBody, b, 0.25f, 196.0f, 5.0f, 1.0f), "a hard touch is brighter");
  }
  double own[2];
  for (int i = 0; i < 2; ++i) {
    plain();
    still();
    device.set_param(p::kLift, 1.0f);
    device.note_on(1, 196.0f, i == 0 ? 0.25f : 1.0f);
    const std::vector<float> m = mid(render(device, 2.5f, kSr));
    const float line = device.meter(UnsungVoice::kMeterLine);
    own[i] = tone_level(m, 2.0f * line, kSr, at(1.0)) / tone_level(m, line, kSr, at(1.0));
  }
  EXPECT(own[1] > 1.3 * own[0], "and so is its line");
  EXPECT(tilt(p::kVowel, 1.0f, 0.8f, 130.8f, 17.0f, 2.0f) > 5.0 * tilt(p::kVowel, 0.0f, 0.8f, 130.8f, 17.0f, 2.0f), "Ee has what a hum has not");
  EXPECT(tilt(p::kTilt, 1.0f, 0.8f, 130.8f, 8.0f, 1.0f) > 30.0 * tilt(p::kTilt, -1.0f, 0.8f, 130.8f, 8.0f, 1.0f), "Tilt tips the overtones");
  // Hollow has odd harmonics, reed has them all; glass rings down.
  double even[5], ring[5], rise[5];
  for (int body = 0; body < 5; ++body) {
    plain();
    device.set_param(p::kBody, static_cast<float>(body));
    device.set_param(p::kLift, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> m = mid(render(device, 3.0f, kSr));
    even[body] = db(tone_level(m, 440.0, kSr, at(1.0), at(2.0)) / tone_level(m, 660.0, kSr, at(1.0), at(2.0)));
    ring[body] = db(rms(m, at(0.05), at(0.3)) / rms(m, at(2.5), at(3.0)));
    rise[body] = db(rms(m, at(0.5), at(0.8)) / rms(m, at(0.02), at(0.06)));
  }
  plain();
  device.set_param(p::kBody, 4.0f);
  device.note_on(1, 220.0f, 0.8f);
  EXPECT(db(tone_level(mid(render(device, 2.0f, kSr)), 110.0, kSr, at(1.0))) > -50.0, "and an octave under");
  EXPECT(even[4] < -6.0 && even[1] > -3.0, "a stopped pipe has odd harmonics");
  EXPECT(ring[2] > 8.0 && std::fabs(ring[0]) < 5.0, "glass rings down, a throat does not");
  EXPECT(rise[3] > rise[1] + 5.0, "a bow takes its time");
}

static void clicks() {
  // A quiet, dark patch, so that anything sharp is an event.
  auto dark = [] {
    plain();
    for (int id : {p::kVibrato, p::kColour}) device.set_param(id, 0.0f);
    device.set_param(p::kTilt, -0.6f);
    device.set_param(p::kAttack, 0.1f);
  };
  dark();
  chord({50, 57, 65, 72}, 0.6f);
  const Stereo calm = render(device, 3.0f, kSr);
  const double reference = jerk(calm, at(1.0), at(3.0));
  dark();
  chord({50, 57, 65, 72}, 0.6f);
  render(device, 1.0f, kSr);
  Stereo busy;
  for (int step = 0; step < 24; ++step) {
    if (step == 2) device.note_on(1, hz_of(50), 0.6f);  // the same key again
    if (step == 4) device.note_off(2);
    if (step == 5) device.note_on(2, hz_of(57), 0.6f);  // inside its release
    const int ids[8] = {p::kTolerance, p::kPartner, p::kLift, p::kVowel, p::kBeating, p::kWidth, p::kCloseness, p::kVolume};
    const float to[8] = {60.0f, 12.0f, 0.2f, 1.0f, 1.0f, 0.0f, 0.2f, -20.0f};
    if (step >= 8) device.set_param(ids[(step - 8) / 2], to[(step - 8) / 2]);
    busy = concat(busy, render(device, 0.1f, kSr));
  }
  EXPECT(jerk(busy, 0, busy.size()) < 2.6 * reference, "no click when keys and knobs move");
  // Twelve keys and then twelve more: every one takes a sounding voice.
  dark();
  for (int i = 0; i < 12; ++i) device.note_on(i, hz_of(40.0f + 3.0f * static_cast<float>(i)), 0.6f);
  const Stereo full = render(device, 2.0f, kSr);
  const double before = jerk(full, at(1.0), at(2.0));
  Stereo stolen;
  for (int i = 0; i < 12; ++i) {
    device.note_on(20 + i, hz_of(41.0f + 3.0f * static_cast<float>(i)), 0.6f);
    stolen = concat(stolen, render(device, 0.03f, kSr));
  }
  EXPECT(jerk(stolen, 0, stolen.size()) < 3.0 * before, "a stolen key fades and does not click");
  // The choice of body under a held chord.
  for (int body = 1; body < 5; ++body) {
    dark();
    chord({50, 57, 65, 72}, 0.6f);
    render(device, 1.0f, kSr);
    device.set_param(p::kBody, static_cast<float>(body));
    EXPECT(jerk(render(device, 0.02f, kSr), 0, at(0.02)) < 3.0 * reference, "a body changes without a click");
  }
}

static void sweeps() {
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kSr);
    chord(kChord, 0.9f);
    render(device, 0.4f, kSr);
    bool good = true;
    for (int step = 0; step <= 30; ++step) {
      const float t = static_cast<float>(step % 2 == 0 ? step : 30 - step) / 30.0f;
      device.set_param(id, p::kParamMin[id] + t * (p::kParamMax[id] - p::kParamMin[id]));
      const Stereo out = render(device, 0.03f, kSr);
      good = good && finite(out.left) && finite(out.right) && peak(out.left) < 0.97 && peak(out.right) < 0.97;
    }
    EXPECT(good, "a knob swept while sounding stays in bounds");
  }
}

static void notes() {
  device.init(kSr);
  for (float bad : {std::nanf(""), INFINITY, -INFINITY, 0.0f, -5.0f, 1.0e9f}) {
    device.note_on(1, bad, 0.8f);
    device.note_on(2, 220.0f, bad);
    const Stereo out = render(device, 0.1f, kSr);
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) <= 1.0, "absurd notes are survived");
  }
  // One id at A, at B and at A again: one release ends it all.
  for (float gap : {0.0f, 0.002f, 0.2f}) {
    device.init(kSr);
    device.set_param(p::kRelease, 0.2f);
    for (float note : {60.0f, 67.0f, 60.0f}) {
      device.note_on(7, hz_of(note), 0.8f);
      if (gap > 0.0f) render(device, gap, kSr);
    }
    device.note_off(7);
    render(device, 1.5f, kSr);
    EXPECT(peak(render(device, 0.2f, kSr).left) == 0.0, "an id that comes back to its first pitch leaves nothing held");
  }
  plain();
  for (float hz : {220.0f, 330.0f}) device.note_on(7, hz, 0.8f);
  EXPECT(tone_level(mid(render(device, 1.0f, kSr)), 220.0, kSr, at(0.5)) < 1.0e-4, "an id has one pitch at a time");
  // Restrikes inside steals, then every key up.
  device.init(kSr);
  device.set_param(p::kRelease, 0.2f);
  for (int i = 0; i < 40; ++i) {
    device.note_on(i % 17, hz_of(40.0f + static_cast<float>((i * 7) % 40)), 0.7f);
    render(device, 0.0013f, kSr);
  }
  for (int i = 0; i < 17; ++i) device.note_off(i);
  render(device, 1.5f, kSr);
  EXPECT(peak(render(device, 0.2f, kSr).left) == 0.0, "no key is stuck after steals");
}

static void block_sizes() {
  Stereo runs[3];
  for (int n = 0; n < 3; ++n) {
    const int block = n == 0 ? 128 : (n == 1 ? 1 : 2048);
    Stereo& all = runs[n];
    device.init(kSr);
    chord({50, 57});
    all = concat(all, render(device, 0.512f, kSr, block));
    for (int id : {1, 2}) device.note_off(id);
    device.set_param(p::kRelease, 0.1f);
    device.set_param(p::kTilt, 0.5f);
    all = concat(all, render(device, 2.048f, kSr, block));
    device.set_param(p::kVowel, 0.8f);
    device.set_param(p::kVolume, -10.0f);
    device.note_on(3, 330.0f, 0.8f);
    all = concat(all, render(device, 0.512f, kSr, block));
  }
  for (int i = 1; i < 3; ++i) {
    EXPECT(runs[i].left == runs[0].left && runs[i].right == runs[0].right, "the same at any block size across a silence");
  }
}

// A line that is struck often, with more rings than it has tones.
static void many_tones() {
  for (float linger : {0.6f, 0.85f}) {
    plain();
    const int ids[9] = {p::kVibrato, p::kColour, p::kTilt, p::kSecond, p::kPace, p::kLinger, p::kTolerance, p::kLift, p::kGlide};
    const float to[9] = {0.0f, 0.0f, -0.7f, 1.0f, 0.12f, linger, 60.0f, 1.0f, 0.0f};
    for (int i = 0; i < 9; ++i) device.set_param(ids[i], to[i]);
    chord(kChord);
    const Stereo s = render(device, 4.0f, kSr);
    std::vector<double> sharp;
    for (double t = 1.0; t < 3.99; t += 0.004) sharp.push_back(jerk(s, at(t), at(t + 0.004)));
    std::sort(sharp.begin(), sharp.end());
    EXPECT(sharp.back() < 3.5 * sharp[sharp.size() / 2], "a tone is not cut off for the next");
    EXPECT(peak(s.left) < 0.285, "and rings do not pile up");
  }
}

// What one knob does to a level, measured with everything else at its default.
static double level_of(int id, float value, float lift, float from, float to, const std::vector<float>& notes) {
  device.init(kSr);
  device.set_param(p::kLift, lift);
  still();
  if (id >= 0) device.set_param(id, value);
  chord(notes);
  return db(rms(mid(render(device, to, kSr)), at(from), at(to)));
}

static void laws() {
  const std::vector<float> all = kChord, two = {50, 54}, same(12, 57.0f);
  EXPECT_NEAR(level_of(p::kHold, 0.0f, 1.0f, 2.0f, 4.0f, all), level_of(p::kHold, 1.0f, 1.0f, 2.0f, 4.0f, all), 3.5, "Hold leaves the line as loud");
  const double full = level_of(-1, 0.0f, 0.5f, 2.0f, 4.0f, all);
  EXPECT(level_of(p::kLift, 1.0f, 1.0f, 2.0f, 4.0f, all) > full - 6.5, "the line alone is not faint");
  EXPECT(level_of(p::kLift, 0.0f, 0.0f, 2.0f, 4.0f, all) > full - 3.0, "nor are the keys");
  device.init(kSr);
  device.set_param(p::kBody, 3.0f);
  device.set_param(p::kAttack, 6.0f);
  chord(all);
  const double slow = db(rms(mid(render(device, 5.0f, kSr)), at(4.0)));
  EXPECT(slow > full - 4.0, "the slowest bow is heard inside five seconds");
  // A third that Tolerance only just lets in is softer than one it lets in well.
  for (int i = 0; i < 2; ++i) {
    plain();
    still();
    const int ids[4] = {p::kPartner, p::kRegister, p::kLift, p::kTolerance};
    const float to[4] = {0.0f, 900.0f, 1.0f, i == 0 ? 15.0f : 60.0f};
    for (int k = 0; k < 4; ++k) device.set_param(ids[k], to[k]);
    chord(two);
    static double level[2];
    level[i] = db(rms(mid(render(device, 4.0f, kSr)), at(1.5)));
    if (i == 1) EXPECT(level[1] - level[0] > 2.0, "Tolerance brings the strange meetings in by degrees");
  }
  for (int body = 0; body < 5; ++body) {
    device.init(kSr);
    device.set_param(p::kBody, static_cast<float>(body));
    chord(same, 1.0f);
    EXPECT(peak(render(device, 2.0f, kSr).left) < 0.3, "twelve keys on one pitch are no pile");
  }
  // A key is the same whatever was played before the silence.
  Stereo runs[2];
  for (int i = 0; i < 2; ++i) {
    device.init(kSr);
    device.set_param(p::kRelease, 0.1f);
    if (i == 1) {
      device.set_param(p::kTilt, 1.0f);
      device.note_on(1, 110.0f, 1.0f);
      render(device, 0.6f, kSr);
      device.set_param(p::kTilt, 0.0f);
      device.note_off(1);
      render(device, 3.0f, kSr);
    }
    device.note_on(2, 330.0f, 0.7f);
    runs[i] = render(device, 1.0f, kSr);
  }
  EXPECT(runs[0].left == runs[1].left && runs[0].right == runs[1].right, "nothing is left of the key before");
  // A plucked key struck again is there again; the modes of a strike die.
  plain();
  device.set_param(p::kHold, 0.1f);
  device.set_param(p::kLift, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  std::vector<float> m = mid(render(device, 1.5f, kSr));
  device.note_on(1, 220.0f, 0.8f);
  EXPECT_NEAR(db(rms(mid(render(device, 0.4f, kSr)))), db(rms(m, 0, at(0.4))), 2.5, "a pluck struck again is there again");
  plain();
  device.set_param(p::kBody, 2.0f);
  device.set_param(p::kAttack, 0.005f);
  device.note_on(1, 220.0f, 0.8f);
  m = mid(render(device, 3.0f, kSr));
  EXPECT(db(tone_level(m, 606.3, kSr, 0, at(0.3)) / tone_level(m, 606.3, kSr, at(2.5))) > 24.0, "the glass mode dies");
  // A partner given to a sounding key gives it a line; over a low key the line begins on a plain overtone.
  plain();
  device.set_param(p::kPartner, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 1.0f, kSr);
  device.set_param(p::kPartner, 7.0f);
  render(device, 2.5f, kSr);
  EXPECT(device.meter(UnsungVoice::kMeterLine) > 400.0f, "a partner is heard at once");
  plain();
  still();
  device.note_on(1, hz_of(36), 0.8f);
  render(device, 1.5f, kSr);
  int n = static_cast<int>(device.meter(UnsungVoice::kMeterLine) / hz_of(36) + 0.5f);
  while (n > 0 && n % 2 == 0) n /= 2;
  EXPECT(n >= 1 && n <= 5, "a low key's line begins on a plain overtone");
  // The noise a bow speaks with is as loud at every rate.
  double hair[2];
  for (int i = 0; i < 2; ++i) {
    const float rate = i == 0 ? 44100.0f : 176400.0f;
    device.init(rate);
    device.set_param(p::kBody, 3.0f);
    device.set_param(p::kLift, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    hair[i] = rms(render(device, 0.04f, rate).left);
  }
  EXPECT_NEAR(db(hair[1] / hair[0]), 0.0, 1.2, "the bow's hair is as loud at every rate");
  // The same key softly under a loud one: no step.
  plain();
  for (int id : {p::kColour, p::kVibrato}) device.set_param(id, 0.0f);
  device.set_param(p::kTilt, -0.7f);
  device.note_on(1, 220.0f, 1.0f);
  const Stereo loud = render(device, 2.0f, kSr);
  device.note_on(1, 220.0f, 0.05f);
  EXPECT(jerk(render(device, 0.1f, kSr), 2, at(0.1)) < 1.3 * jerk(loud, at(1.0), at(2.0)), "a soft restrike is no click");
}

static void levels() {
  for (int body = 0; body < 5; ++body) {
    for (float note : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
      device.init(kSr);
      device.set_param(p::kBody, static_cast<float>(body));
      device.note_on(1, hz_of(note), 0.7f);
      const Stereo out = render(device, 3.0f, kSr);
      const double top = db(std::max(peak(out.left), peak(out.right)));
      EXPECT(top > -26.5 && top < -10.0, "one key peaks where an instrument should");
    }
    device.init(kSr);
    device.set_param(p::kBody, static_cast<float>(body));
    chord({36, 43, 48, 52, 55, 60, 64, 67, 72, 76}, 1.0f);
    const Stereo out = render(device, 4.0f, kSr);
    EXPECT(std::max(peak(out.left), peak(out.right)) < 0.5, "ten hard keys stay under the knee");
  }
  double level[3], where[3];
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  for (int i = 0; i < 3; ++i) {
    device.init(rates[i]);
    chord(kChord, 0.7f);
    const Stereo out = render(device, 2.0f, rates[i]);
    level[i] = db(rms(mid(out), static_cast<size_t>(rates[i])));
    where[i] = device.meter(UnsungVoice::kMeterLine);
  }
  EXPECT(std::fabs(level[0] - level[1]) < 1.0 && std::fabs(level[2] - level[1]) < 1.0, "as loud at every sample rate");
  EXPECT(std::fabs(where[0] - where[2]) < 1.0 && std::fabs(where[1] - where[2]) < 1.0, "the line takes the same way");
}

int main() {
  const Conformance spec{"unsung-voice", p::kNumParams, p::kParamMin, p::kParamMax, p::kParamDefault, 8.0f, 1.01f};
  check_instrument(device, spec, kSr);
  for (auto test : {line_stands_out, lone_key, fundamentals_stay, pulled_or_beating, walking, line_and_keys,
                    touch_and_bodies, clicks, many_tones, sweeps, notes, block_sizes, laws, levels}) test();
  device.init(kSr);
  for (int i = 0; i < 8; ++i) device.note_on(i, 110.0f * std::pow(2.0f, static_cast<float>(i * 3) / 12.0f), 0.7f);
  report_cost("unsung-voice (8 keys)", 5.0f, kSr, [] { render(device, 5.0f, kSr); });
  return finish("unsung-voice");
}
