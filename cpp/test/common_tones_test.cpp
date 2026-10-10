// Native harness for Common Tones (cpp/devices/common-tones). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a gate on the sound's own
// past: what is shared passes, what is new goes, Ago sets the time, and the
// other controls each do what they say over their whole range.

#include <chrono>
#include <ctime>

#include "../devices/common-tones/common_tones.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::CommonTones;
namespace p = livemix::common_tones;

static CommonTones device;

static const float kRate = 48000.0f;
static const size_t kLatency = CommonTones::kLatency;
static const double kHopSeconds = 1024.0 / 48000.0;

// The comparison alone: one moment, the narrowest regions, no ring, nothing left of the rest, no make-up, wet only.
static void clean(CommonTones& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAgo, 400.0f);
  d.set_param(p::kKeep, 0.0f);
  d.set_param(p::kStrict, 0.6f);
  d.set_param(p::kRing, 0.0f);
  d.set_param(p::kBroad, 0.0f);
  d.set_param(p::kMemory, 0.0f);
  d.set_param(p::kFloor, p::kParamMin[p::kFloor]);
  d.set_param(p::kMakeup, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b) {
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) a[i] += b[i];
  return a;
}

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// A sine that starts at `from` seconds and lasts `seconds`, in a buffer `total` long.
static std::vector<float> tone_at(float hz, double from, double seconds, double total, float gain) {
  std::vector<float> out(at(total), 0.0f);
  const size_t start = at(from);
  const size_t end = std::min(out.size(), start + at(seconds));
  for (size_t i = start; i < end; ++i) {
    out[i] = gain * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i - start) / kRate));
  }
  return out;
}

// A chord of sines with a slow fade in and out, so no edge spreads over the spectrum.
static std::vector<float> chord(const std::vector<float>& hz, float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate), 0.0f);
  for (float f : hz) out = add(out, sine(f, seconds, kRate, gain));
  return out;
}

// The largest sample-to-sample step of both sides from `from` on.
static double worst_step(const Stereo& out, size_t from = 0) {
  return std::max(max_step(out.left, from), max_step(out.right, from));
}

// Runs `input` through the device in blocks of 128, calling `move(block)` before each.
template <typename Move>
static Stereo run_moving(CommonTones& d, const std::vector<float>& input, Move move) {
  Stereo out;
  out.left.reserve(input.size());
  out.right.reserve(input.size());
  int block = 0;
  for (size_t done = 0; done < input.size(); done += 128, ++block) {
    move(block);
    const int frames = static_cast<int>(std::min<size_t>(128, input.size() - done));
    for (int i = 0; i < frames; ++i) d.in_left()[i] = d.in_right()[i] = input[done + i];
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left.push_back(d.out_left()[i]);
      out.right.push_back(d.out_right()[i]);
    }
  }
  return out;
}

// The presets of device.json, for the level and part-way Mix checks (copied
// by tmp/presets-to-test.mjs; values in id order).
struct Setting {
  const char* name;
  float value[p::kNumParams];
};
// PRESETS BEGIN
static const Setting kPresets[] = {
    {"Common tones", {350.0f, 0.0f, 0.6f, 0.45f, 0.25f, 0.3f, -36.0f, 0.75f, 0.7f}},
    {"Only what stays", {450.0f, 0.0f, 1.0f, 0.3f, 0.1f, 0.0f, -36.0f, 0.75f, 1.0f}},
    {"Only what moves", {250.0f, 1.0f, 0.6f, 0.0f, 0.3f, 0.0f, -36.0f, 0.75f, 1.0f}},
    {"Long hold", {900.0f, 0.0f, 0.6f, 0.7f, 0.25f, 0.4f, -12.0f, 0.75f, 0.6f}},
    {"Drone finder", {4000.0f, 0.0f, 0.7f, 0.6f, 0.15f, 0.6f, -14.0f, 0.75f, 0.65f}},
    {"Attacks forward", {120.0f, 1.0f, 0.65f, 0.0f, 0.2f, 0.0f, -6.0f, 0.75f, 0.8f}},
    {"Slow ear", {200.0f, 0.0f, 0.7f, 0.3f, 0.25f, 0.8f, -36.0f, 0.75f, 0.7f}},
    {"Hanging notes", {300.0f, 0.0f, 0.5f, 0.75f, 0.25f, 0.3f, -36.0f, 0.75f, 0.6f}},
    {"Loose match", {700.0f, 0.0f, 0.0f, 0.45f, 1.0f, 0.3f, -36.0f, 0.75f, 0.85f}},
    {"New notes ring", {300.0f, 1.0f, 0.6f, 0.7f, 0.25f, 0.0f, -36.0f, 0.75f, 0.8f}},
    {"Light touch", {250.0f, 0.0f, 0.5f, 0.2f, 0.25f, 0.3f, -10.0f, 0.75f, 0.6f}},
    {"New notes up", {500.0f, 1.0f, 0.6f, 0.1f, 0.25f, 0.2f, -9.0f, 0.75f, 1.0f}},
    {"Fresh only", {1000.0f, 1.0f, 0.6f, 0.2f, 0.25f, 0.7f, -36.0f, 0.75f, 0.8f}},
    {"A bar ago", {2000.0f, 0.0f, 0.4f, 0.4f, 0.4f, 0.35f, -36.0f, 0.75f, 0.5f}},
    {"Wide vibrato", {180.0f, 0.0f, 0.9f, 0.3f, 0.75f, 0.1f, -36.0f, 0.75f, 1.0f}},
    {"Frozen ground", {800.0f, 0.0f, 0.7f, 1.0f, 0.25f, 0.5f, -12.0f, 0.75f, 0.55f}},
};
// PRESETS END

// A played phrase, 12 s: damped notes of six partials, some sharing partials,
// some short and some held, over a faint hiss.
static std::vector<float> played_phrase() {
  struct Note {
    double at, hz, gain, held;
  };
  const Note notes[] = {{0.0, 220.0, 0.25, 0.5},   {0.6, 329.63, 0.25, 0.5}, {1.2, 523.25, 0.25, 1.0}, {2.4, 440.0, 0.25, 1.4},
                        {2.4, 174.61, 0.25, 1.4},  {4.0, 659.26, 0.15, 0.3}, {4.4, 587.33, 0.15, 0.3}, {4.8, 523.25, 0.2, 1.0},
                        {6.0, 220.0, 0.25, 0.5},   {6.6, 329.63, 0.25, 0.5}, {7.2, 493.88, 0.25, 1.0}, {8.4, 392.0, 0.25, 1.4},
                        {8.4, 196.0, 0.25, 1.4},   {10.0, 220.0, 0.25, 1.5}};
  std::vector<float> phrase(at(12.0), 0.0f);
  for (const Note& n : notes) {
    const size_t start = at(n.at);
    for (size_t i = start; i < phrase.size(); ++i) {
      const double t = static_cast<double>(i - start) / kRate;
      const double damp = t > n.held ? std::exp(-(t - n.held) / 0.05) : 1.0;
      if (damp < 1.0e-5) break;
      const double env = std::min(1.0, t / 0.004) * std::exp(-t / 0.9) * damp;
      double s = 0.0;
      for (int h = 1; h <= 6; ++h) s += std::sin(2.0 * kPi * n.hz * h * t) / h * std::exp(-t * 0.6 * (h - 1));
      phrase[i] += static_cast<float>(n.gain * env * s);
    }
  }
  rng_state() = 4242;
  for (float& v : phrase) v += 0.0005f * white();
  return phrase;
}

static void set_all(CommonTones& d, const float* value) {
  d.init(kRate);
  for (int id = 0; id < p::kNumParams; ++id) d.set_param(id, value[id]);
}

int main() {
  Conformance spec;
  spec.name = "common-tones";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);

  rng_state() = 0x51DEu;
  std::vector<float> programme = noise(3.0f, kRate, 0.3f);
  programme = add(programme, add(sine(196.0f, 3.0f, kRate, 0.2f), sine(1234.5f, 3.0f, kRate, 0.2f)));

  // The latency: at Mix 0 the output is the input, 4608 samples late, bit for
  // bit, on both sides; nothing comes out before it; mono in is mono out.
  {
    EXPECT(kLatency == 4608, "the latency is the one in device.json");
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, programme);
    bool same = true;
    for (size_t i = 0; i + kLatency < programme.size(); ++i) {
      same = same && dry.left[i + kLatency] == programme[i] && dry.right[i + kLatency] == programme[i];
    }
    EXPECT(same, "Mix 0 is the input delayed by latencySamples, bit for bit");
    EXPECT(peak(dry.left, 0, kLatency) == 0.0, "nothing comes out before the latency");
    device.init(kRate);
    Stereo wet = run(device, programme);
    EXPECT(wet.left == wet.right, "mono in, mono out, bit for bit");
  }

  // What the idea says. A held sine and a second sine that jumps to another
  // frequency every half second, after a silence the device really heard.
  const float jumps[8] = {1000.0f, 1320.0f, 1760.0f, 2349.0f, 3136.0f, 1568.0f, 2794.0f, 1175.0f};
  const double lead = 0.6;
  std::vector<float> moving = silence(static_cast<float>(lead), kRate);
  {
    std::vector<float> body = sine(440.0f, 4.5f, kRate, 0.3f);
    for (int j = 0; j < 9; ++j) body = add(body, tone_at(jumps[j % 8], 0.5 * j, 0.5, 4.5, 0.3f));
    moving = join(moving, body);
  }
  // The level of jump j's sine in its first 300 ms, and in its last 80 ms (after Ago, 400 ms).
  auto early = [&](const Stereo& out, int j) {
    const size_t start = at(lead + 0.5 * j) + kLatency;
    return db(tone_level(out.left, jumps[j % 8], kRate, start + at(0.02), start + at(0.3)) / 0.3);
  };
  auto late = [&](const Stereo& out, int j) {
    const size_t start = at(lead + 0.5 * j) + kLatency;
    return db(tone_level(out.left, jumps[j % 8], kRate, start + at(0.42), start + at(0.5)) / 0.3);
  };
  auto held_db = [&](const Stereo& out) {
    return db(tone_level(out.left, 440.0, kRate, at(lead + 2.0) + kLatency, at(lead + 4.0) + kLatency) / 0.3);
  };
  {
    clean(device);
    Stereo common = run(device, moving);
    clean(device);
    device.set_param(p::kKeep, 1.0f);
    Stereo changes = run(device, moving);
    std::printf("common-tones: Common: held %.2f dB, a jump early %.1f dB, late %.2f dB; Changes: held %.1f dB, "
                "a jump early %.2f dB, late %.1f dB\n",
                held_db(common), early(common, 3), late(common, 3), held_db(changes), early(changes, 3),
                late(changes, 3));
    EXPECT(std::fabs(held_db(common)) < 0.5, "Common: the held tone passes whole");
    EXPECT(held_db(changes) < -100.0, "Changes: the held tone is gone (Floor at the bottom)");
    for (int j = 2; j < 7; ++j) {
      EXPECT(early(common, j) < -100.0, "Common: a tone that has just come is gone (Floor at the bottom)");
      EXPECT(std::fabs(late(common, j)) < 1.0, "Common: once it has sounded for Ago it passes");
      EXPECT(std::fabs(early(changes, j)) < 0.5, "Changes: a tone that has just come passes whole");
      EXPECT(late(changes, j) < -30.0, "Changes: once it has sounded for Ago it goes");
    }
    // The two are the two halves of the input: added, they are the input again.
    double error = 0.0, reference = 0.0;
    for (size_t i = at(lead + 0.5); i + kLatency < common.size(); ++i) {
      const double diff = static_cast<double>(common.left[i + kLatency]) + changes.left[i + kLatency] - moving[i];
      error += diff * diff;
      reference += static_cast<double>(moving[i]) * moving[i];
    }
    std::printf("common-tones: Common + Changes against the input: %.1f dB\n", 10.0 * std::log10(error / reference));
    EXPECT(10.0 * std::log10(error / reference) < -100.0, "Common and Changes add up to the input");

    // Floor is the gain of what is turned down, over its whole range.
    double last = -1000.0;
    for (float floor : {-36.0f, -35.0f, -27.0f, -18.0f, -9.0f, 0.0f}) {
      clean(device);
      device.set_param(p::kFloor, floor);
      Stereo out = run(device, moving);
      if (floor == -36.0f) {
        EXPECT(early(out, 3) < -100.0, "Floor at the bottom: what is turned down is gone");
      } else {
        EXPECT_NEAR(early(out, 3), floor, 0.5, "Floor: what is turned down comes out that many dB down");
      }
      EXPECT_NEAR(held_db(out), 0.0, 0.5, "Floor leaves what is kept alone");
      EXPECT(early(out, 3) > last + 5.0, "Floor: every part of its travel is heard");
      last = early(out, 3);
    }
  }

  // A steady chord passes whole once Ago has gone by, and not before.
  {
    clean(device);
    const std::vector<float> steady =
        join(silence(0.5f, kRate), chord({220.0f, 277.18f, 329.63f, 440.0f, 554.37f, 1318.5f}, 3.0f, 0.12f));
    Stereo out = run(device, steady);
    double error = 0.0, reference = 0.0;
    for (size_t i = at(0.5 + 0.6); i + kLatency < out.size(); ++i) {
      const double diff = static_cast<double>(out.left[i + kLatency]) - steady[i];
      error += diff * diff;
      reference += static_cast<double>(steady[i]) * steady[i];
    }
    std::printf("common-tones: a steady chord after Ago: error %.1f dB; in its first 300 ms: %.1f dB re the chord\n",
                10.0 * std::log10(error / reference),
                db(rms(out.left, at(0.52) + kLatency, at(0.8) + kLatency) / rms(steady, at(0.52), at(0.8))));
    EXPECT(10.0 * std::log10(error / reference) < -50.0, "a steady chord passes whole after Ago");
    EXPECT(rms(out.left, at(0.55) + kLatency, at(0.8) + kLatency) < 1.0e-5 * rms(steady, at(0.55), at(0.8)),
           "and gives nothing while it is new");
  }

  // Silence, then sound: nothing for Ago, then the sound. Ago sets the time,
  // at three sample rates (a frame is 85 ms at 48 kHz: the sound comes up
  // over the last half frame before Ago).
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    for (float ago : {100.0f, 250.0f, 700.0f, 2000.0f, 6000.0f}) {
      clean(device, rate);
      device.set_param(p::kAgo, ago);
      const size_t start = static_cast<size_t>(0.5f * rate);
      const std::vector<float> input =
          join(silence(0.5f, rate), sine(440.0f, ago * 0.001f + 0.6f, rate, 0.3f));
      Stereo out = run(device, input);
      const size_t step = static_cast<size_t>(0.01f * rate);
      double half = -1.0;
      for (size_t i = start + kLatency; i + step <= out.size() && half < 0.0; i += step / 4) {
        if (rms(out.left, i, i + step) >= 0.5 * 0.3 * 0.7071) half = static_cast<double>(i - start - kLatency) / rate;
      }
      const double frame = 4096.0 / rate;
      if (rate == 48000.0f) std::printf("common-tones: Ago %.0f ms: the sound is half up after %.0f ms\n", ago, half * 1000.0);
      EXPECT(half > ago * 0.001 - 0.75 * frame && half < ago * 0.001 + 0.25 * frame, "Ago sets the time a new sound waits");
      // (Ago is read between two frames, so the nearer of them is up to a hop less far back.)
      const double quiet = ago * 0.001 - 1.25 * frame;
      if (quiet > 0.02) {
        const size_t quiet_to = start + kLatency + static_cast<size_t>(quiet * rate);
        EXPECT(rms(out.left, start + kLatency + step, quiet_to) < 1.0e-5, "nothing comes through before Ago");
      }
      const size_t full_from = start + kLatency + static_cast<size_t>((ago * 0.001 + 0.2) * rate);
      EXPECT_NEAR(db(rms(out.left, full_from, full_from + static_cast<size_t>(0.3f * rate)) / (0.3 * 0.7071)), 0.0, 0.3,
                  "and then the sound, whole");
    }
  }

  // Put on a channel that is already sounding, it does not drop the sound out
  // for Ago: until it has heard Ago's worth it compares with the first whole
  // frame it heard. What changes after that still goes.
  {
    clean(device);
    device.set_param(p::kAgo, 2000.0f);
    const std::vector<float> input = add(sine(330.0f, 3.0f, kRate, 0.3f), tone_at(1500.0f, 1.0, 2.0, 3.0, 0.3f));
    Stereo out = run(device, input);
    const double first = db(tone_level(out.left, 330.0, kRate, at(0.2) + kLatency, at(0.6) + kLatency) / 0.3);
    const double newer = db(tone_level(out.left, 1500.0, kRate, at(1.1) + kLatency, at(2.9) + kLatency) / 0.3);
    std::printf("common-tones: switched on over a tone: the tone at %.2f dB at once, a later one at %.1f dB\n", first, newer);
    EXPECT(std::fabs(first) < 0.5, "switched on over a sounding tone, the tone passes at once");
    EXPECT(newer < -100.0, "and what comes after it is still new");
    EXPECT(peak(out.left, kLatency + 4096, at(0.2) + kLatency) > 0.25, "from the first whole frame on");
  }

  // Strict is the leeway: 24 dB at 0, none at 1. A tone that comes back 12 dB
  // louder than it was passes whole inside the leeway and is turned down 2 dB
  // for every dB past it; steady noise, whose every bin wanders, is let
  // through less and less (Common) or more and more (Changes).
  {
    const std::vector<float> swell = join(sine(500.0f, 1.0f, kRate, 0.1f), sine(500.0f, 0.35f, kRate, 0.4f));
    double last = 1.0;
    for (float strict : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      clean(device);
      device.set_param(p::kStrict, strict);
      Stereo out = run(device, swell);
      const double got = db(tone_level(out.left, 500.0, kRate, at(1.1) + kLatency, at(1.3) + kLatency) / 0.4);
      const double over = std::max(0.0, 12.04 - 24.0 * (1.0 - strict));
      EXPECT_NEAR(got, -2.0 * over, 0.5, "Strict: 2 dB down for every dB a tone has grown past the leeway");
      EXPECT(got <= last + 0.01, "Strict never lets more through as it is raised");
      last = got;
    }
    rng_state() = 0x77u;
    const std::vector<float> hiss = noise(6.0f, kRate, 0.3f);
    double common[5], changes[5];
    int n = 0;
    for (float strict : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      for (int keep = 0; keep < 2; ++keep) {
        clean(device);
        device.set_param(p::kStrict, strict);
        device.set_param(p::kKeep, static_cast<float>(keep));
        Stereo out = run(device, hiss);
        (keep ? changes : common)[n] = db(rms(out.left, at(2.0), at(6.0)) / rms(hiss, at(2.0), at(6.0)));
      }
      ++n;
    }
    std::printf("common-tones: steady noise through Common at Strict 0, .25, .5, .75, 1: %.2f %.2f %.2f %.2f %.2f dB\n",
                common[0], common[1], common[2], common[3], common[4]);
    std::printf("common-tones: steady noise through Changes:                             %.1f %.1f %.1f %.1f %.1f dB\n",
                changes[0], changes[1], changes[2], changes[3], changes[4]);
    EXPECT(common[0] > -0.1 && common[4] < -1.5 && common[4] > -5.0, "Strict changes how much of noise gets through");
    for (int i = 1; i < 5; ++i) {
      EXPECT(common[i] <= common[i - 1] + 0.01, "Common: more Strict, less noise");
      EXPECT(changes[i] >= changes[i - 1], "Changes: more Strict, more of the noise counts as new");
    }
    EXPECT(changes[4] > changes[3] + 10.0 && changes[3] > changes[2] + 10.0, "Changes: the top of Strict takes a noise's own wandering for new");
    // Steady noise is not new: with the leeway the default has, or more, Changes
    // lets none of it through (the builder's version, which compared single
    // bins of single frames, let a scatter of blips through 23 dB down), and
    // Common lets all of it through.
    EXPECT(changes[2] < -50.0 && changes[1] < -100.0, "Changes: steady noise leaves no residue while there is leeway");
    EXPECT(common[2] > -0.05, "Common: steady noise passes whole while there is leeway");
  }

  // Ring: what got through hangs on, for 20 s × Ring², at its own frequency
  // and without a line at the frame rate; at 0 nothing hangs.
  {
    for (float ring : {0.25f, 0.5f, 0.8f}) {
      clean(device);
      device.set_param(p::kRing, ring);
      const double expected = 20.0 * ring * ring;
      rng_state() = 0xB1u;
      // (switched on over the noise, so it passes from the first frame)
      Stereo out = run(device, join(noise(0.5f, kRate, 0.5f), silence(static_cast<float>(expected) + 1.0f, kRate)));
      const double measured = rt60(out.left, kRate, 0.5 + 0.2, 0.1, -70.0);
      std::printf("common-tones: Ring %.2f: the tail falls 60 dB in %.2f s (%.2f s)\n", ring, measured, expected);
      EXPECT_NEAR(measured, expected, expected * 0.1, "Ring sets how long what got through hangs on");
    }
    clean(device);
    Stereo none = run(device, join(sine(440.0f, 1.0f, kRate, 0.4f), silence(1.0f, kRate)));
    EXPECT(peak(none.left, at(1.0) + kLatency + 4096, none.size()) == 0.0, "Ring 0: nothing hangs");

    // 440 Hz lies between bins 37 (433.6 Hz) and 38 (445.3 Hz).
    clean(device);
    device.set_param(p::kRing, 0.7f);
    Stereo out = run(device, join(sine(440.0f, 1.0f, kRate, 0.4f), silence(4.0f, kRate)));
    const size_t from = at(1.5), to = at(3.5);
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 380.0, 500.0, from, to), 440.0, 0.3,
                "a ringing partial stays at its own frequency");
    EXPECT(rms(out.left, at(1.2), at(1.4)) > 0.2, "the ring starts at the level of the tone");
    const double frame_rate = kRate / 1024.0;
    const double centre = tone_level(out.left, 440.0, kRate, from, to);
    const double line = std::max(tone_level(out.left, 440.0 + frame_rate, kRate, from, to),
                                 tone_level(out.left, 440.0 - frame_rate, kRate, from, to));
    std::printf("common-tones: a ringing tone's sidebands at the frame rate: %.1f dB re the tone\n", db(line / centre));
    EXPECT(line < centre * 0.003, "no sidebands at the frame rate: a held bin goes on turning");
    Stereo during = run(device, sine(440.0f, 2.0f, kRate, 0.4f));
    EXPECT_NEAR(tone_level(during.left, 440.0, kRate, at(1.0), at(2.0)), 0.4, 0.004, "Ring leaves a steady tone as it is");
  }

  // An edge is never rung on. A click let through (Changes: it is new) is
  // one click, not one every frame length; and when a tone is cut off, what
  // rings is the tone, without the splash the cut made.
  {
    clean(device);
    device.set_param(p::kKeep, 1.0f);
    device.set_param(p::kRing, 0.8f);
    std::vector<float> click = silence(2.0f, kRate);
    click[at(0.5)] = 0.9f;
    Stereo out = run(device, click);
    const size_t heard = at(0.5) + kLatency;
    const double once = rms(out.left, heard - 64, heard + 64);
    const double after = rms(out.left, heard + 2048, out.size());
    std::printf("common-tones: a click through the ring: %.1f dB after it, re the click\n", db(after / once));
    EXPECT(once > 0.05, "a click passes as something new");
    EXPECT(after < once * 1.0e-4, "and is not rung on: it does not come round again");

    clean(device);
    device.set_param(p::kRing, 0.8f);
    out = run(device, join(sine(440.0f, 1.0f, kRate, 0.4f), silence(2.0f, kRate)));
    const size_t from = at(1.5), to = at(2.5);
    // (with the fall of the ring taken out, 60 dB in 12.8 s, so that a steady sine is what should be left)
    std::vector<float> level = out.left;
    for (size_t i = from; i < to; ++i) {
      level[i] *= static_cast<float>(std::exp(6.9077553 * static_cast<double>(i - from) / kRate / 12.8));
    }
    const double whole = rms(level, from, to);
    const double tone = tone_level(level, 440.0, kRate, from, to) * 0.7071;
    const double rest = std::sqrt(std::max(0.0, whole * whole - tone * tone));
    std::printf("common-tones: a cut tone ringing: everything but the tone %.1f dB re the tone\n", db(rest / tone));
    EXPECT(tone > 0.05 && rest < tone * 0.01, "a cut tone rings as the tone alone");
  }

  // Broad compares regions: a tone that wavers by ±35 cents six times a second
  // is the same note, though no single bin holds it for long; and at the top
  // of its travel (±3 semitones) so is a line that steps a whole tone up and
  // down, which is two notes to anything narrower.
  {
    std::vector<float> waver(at(4.0)), steps(at(4.0));
    double phase = 0.0, step_phase = 0.0;
    for (size_t i = 0; i < waver.size(); ++i) {
      const double cents = 35.0 * std::sin(2.0 * kPi * 6.0 * static_cast<double>(i) / kRate);
      phase += 2.0 * kPi * 1500.0 * std::pow(2.0, cents / 1200.0) / kRate;
      waver[i] = 0.3f * static_cast<float>(std::sin(phase));
      const bool upper = (i / at(0.17)) % 2 == 1;
      step_phase += 2.0 * kPi * (upper ? 1500.0 * std::pow(2.0, 2.0 / 12.0) : 1500.0) / kRate;
      steps[i] = 0.3f * static_cast<float>(std::sin(step_phase));
    }
    double wavering[5], stepping[5];
    int n = 0;
    for (float broad : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      for (int which = 0; which < 2; ++which) {
        const std::vector<float>& input = which ? steps : waver;
        clean(device);
        device.set_param(p::kAgo, 230.0f);  // not a whole number of wavers or of steps back
        device.set_param(p::kStrict, 1.0f);
        device.set_param(p::kBroad, broad);
        Stereo out = run(device, input);
        (which ? stepping : wavering)[n] = db(rms(out.left, at(1.0), at(4.0)) / rms(input, at(1.0), at(4.0)));
      }
      ++n;
    }
    std::printf("common-tones: Common at Broad 0, .25, .5, .75, 1: a wavering tone %.2f %.2f %.2f %.2f %.2f dB,\n"
                "              a line that steps a whole tone %.2f %.2f %.2f %.2f %.2f dB\n",
                wavering[0], wavering[1], wavering[2], wavering[3], wavering[4], stepping[0], stepping[1], stepping[2],
                stepping[3], stepping[4]);
    EXPECT(wavering[0] < -5.0 && wavering[1] > wavering[0] + 0.5 && wavering[2] > wavering[1] + 3.0 && wavering[2] > -0.5,
           "Broad: the narrowest regions lose a wavering tone, wider ones keep it");
    EXPECT(stepping[2] < -4.0 && stepping[3] > stepping[2] + 1.0 && stepping[4] > stepping[3] + 1.0 && stepping[4] > -1.5,
           "Broad at the top: a line that moves by a tone is one sound");
    for (int i = 1; i < 5; ++i) {
      EXPECT(wavering[i] + stepping[i] > wavering[i - 1] + stepping[i - 1] + 0.5, "Broad: every part of its travel is heard");
    }
  }

  // Memory compares with an average of the past: a new tone comes up over
  // 10 s × Memory² and not all at once, and a tone that has been there is
  // still counted when it comes back after a pause longer than Ago.
  {
    const std::vector<float> rise = join(silence(0.5f, kRate), sine(440.0f, 8.0f, kRate, 0.3f));
    double last = 0.0;
    for (float memory : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      clean(device);
      device.set_param(p::kStrict, 1.0f);
      device.set_param(p::kMemory, memory);
      Stereo out = run(device, rise);
      // From a tenth of the level to half of it. With no leeway the gain is then/now,
      // and then = 1 − exp(−t / τ) of now: from 0.1 to 0.5 takes 0.588 τ.
      double low = -1.0, high = -1.0;
      for (size_t i = at(0.5) + kLatency; i + 480 <= out.size() && high < 0.0; i += 120) {
        const double level = rms(out.left, i, i + 480) / (0.3 * 0.7071);
        if (low < 0.0 && level >= 0.1) low = static_cast<double>(i) / kRate;
        if (level >= 0.5) high = static_cast<double>(i) / kRate;
      }
      const double expected = 0.588 * 10.0 * memory * memory;
      std::printf("common-tones: Memory %.2f: a new tone comes up from a tenth to half in %.0f ms (%.0f ms)\n", memory,
                  (high - low) * 1000.0, expected * 1000.0);
      EXPECT_NEAR(high - low, expected, 0.05 + 0.1 * expected, "Memory sets how slowly a new tone is taken for shared");
      EXPECT(high - low > last, "Memory: every part of its travel is slower than the one before");
      last = high - low;
    }
    const std::vector<float> back =
        join(join(sine(440.0f, 3.0f, kRate, 0.3f), silence(1.0f, kRate)), sine(440.0f, 0.3f, kRate, 0.3f));
    double came[2];
    for (int n = 0; n < 2; ++n) {
      clean(device);
      device.set_param(p::kMemory, n ? 0.6f : 0.0f);
      Stereo out = run(device, back);
      came[n] = db(rms(out.left, at(4.05) + kLatency, at(4.3) + kLatency) / (0.3 * 0.7071));
    }
    std::printf("common-tones: a tone back after a pause of 1 s: %.1f dB with Memory 0, %.2f dB with Memory 0.6\n", came[0],
                came[1]);
    EXPECT(came[0] < -40.0, "Memory 0: after a pause longer than Ago the tone is new again");
    EXPECT(came[1] > -1.0, "Memory: a tone that has been there is still counted after a pause");
  }

  // Each side is worked alone and nothing is summed: left and right in
  // opposite phase come out in opposite phase, at the level a mono sound does.
  {
    const std::vector<float> input = add(sine(330.0f, 2.0f, kRate, 0.3f), tone_at(900.0f, 0.5, 1.5, 2.0, 0.2f));
    std::vector<float> flipped = input;
    for (float& v : flipped) v = -v;
    device.init(kRate);
    Stereo mono = run(device, input);
    device.init(kRate);
    Stereo anti = run(device, input, flipped);
    bool mirrored = true;
    for (size_t i = 0; i < anti.size(); ++i) mirrored = mirrored && anti.left[i] == -anti.right[i];
    EXPECT(mirrored && anti.left == mono.left && rms(anti.left) > 0.1, "an anti-phase input does not vanish");
  }

  // A NaN, an infinity or an absurd sample in the input does not stay in the
  // device: a latency and a frame later the output is what it would have been.
  {
    std::vector<float> good = programme;
    std::vector<float> bad = programme;
    bad[20000] = std::nanf("");
    bad[20001] = HUGE_VALF;
    bad[20002] = -1.0e30f;
    good[20000] = good[20001] = good[20002] = 0.0f;  // what the Stft takes them for
    device.init(kRate);
    device.set_param(p::kMemory, 0.6f);
    device.set_param(p::kRing, 0.5f);
    Stereo want = run(device, good);
    device.init(kRate);
    device.set_param(p::kMemory, 0.6f);
    device.set_param(p::kRing, 0.5f);
    Stereo got = run(device, bad);
    double off = 0.0;
    for (size_t i = 0; i < got.size(); ++i) {
      if (i >= 20000 + kLatency && i <= 20002 + kLatency) continue;  // the dry path hands them on as they came
      off = std::max(off, std::fabs(static_cast<double>(got.left[i]) - want.left[i]));
    }
    bool sane = true;
    for (size_t i = 20003 + kLatency; i < got.size(); ++i) sane = sane && std::isfinite(got.left[i]) && std::isfinite(got.right[i]);
    EXPECT(sane, "NaN, infinity and 1e30 in: finite out again once they have passed");
    EXPECT(off < 1.0e-6, "and nothing of them is kept: the same as three samples of silence");
    Stereo tail = render(device, 20.0f, kRate);  // Ring 0.5 is 5 s to -60 dB, and rest is 170 dB down
    EXPECT(finite(tail.left) && peak(tail.left, tail.size() - 4800) == 0.0, "and it still falls silent afterwards");
  }

  // Block sizes across a sleep. The gate holds for 8.27 s after the output
  // has gone quiet (0.18 s after the input does, with no ring): the silence
  // is stepped across that moment, and then made long enough to sleep
  // through more frames than the history holds (752). `then` remembers
  // (Memory 0.8 is 6.4 s) and falls through the sleep as it would awake: the
  // same render with a sample of 1e-20 in every block of the silence, which
  // is nothing to the Stft and keeps the device awake, is the same sound.
  {
    double worst = 0.0, awake_worst = 0.0;
    std::vector<float> gaps;
    for (float gap = 8.3f; gap < 9.6f; gap += 0.113f) gaps.push_back(gap);
    // 16.1 s: the history's rows for Ago before the second phrase still hold the first one, a whole
    // turn of the history (752 frames, 16.04 s) old. They were slept over and must read as silence.
    gaps.push_back(16.1f);
    gaps.push_back(16.25f);
    gaps.push_back(31.0f);
    for (float gap : gaps) {
      rng_state() = 99;
      std::vector<float> phrase = add(noise(0.4f, kRate, 0.3f), sine(700.0f, 0.4f, kRate, 0.3f));
      const size_t quiet_from = phrase.size();
      phrase = join(phrase, silence(gap, kRate));
      const size_t quiet_to = phrase.size();
      phrase = join(phrase, add(noise(0.5f, kRate, 0.3f), sine(700.0f, 0.5f, kRate, 0.3f)));
      Stereo reference;
      for (int block : {128, 1, 2048, 37, -128}) {
        if (block == 1 && gap > 10.0f) continue;
        device.init(kRate);
        device.set_param(p::kMemory, 0.8f);
        device.set_param(p::kRing, 0.0f);
        device.set_param(p::kBroad, 0.4f);
        std::vector<float> input = phrase;
        if (block < 0) {
          for (size_t i = quiet_from; i < quiet_to; i += 64) input[i] = 1.0e-20f;
        }
        const Stereo out = run(device, input, block < 0 ? -block : block);
        if (block == 128) {
          reference = out;
          continue;
        }
        for (size_t i = 0; i < out.size(); ++i) {
          double diff = std::fabs(static_cast<double>(out.left[i]) - reference.left[i]);
          diff = std::max(diff, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
          // (the dry path at Mix 0.7 hands the 1e-20 on)
          (block < 0 ? awake_worst : worst) = std::max(block < 0 ? awake_worst : worst, diff);
        }
      }
    }
    std::printf("common-tones: block sizes 1, 37, 128, 2048 across a sleep: worst difference %.3g; slept against awake: %.3g\n",
                worst, awake_worst);
    // To the bit: sleep begins and ends on a sample, whatever the block (it began on a block, and
    // the sizes differed by 1.2e-7 where the past had fallen in one step or in many).
    EXPECT(worst == 0.0, "bit for bit the same at block sizes 1, 37, 128 and 2048 across a sleep");
    EXPECT(awake_worst < 1.0e-5, "the past falls through a sleep as it does awake");
  }

  // And it does sleep: 8.27 s after the output has gone quiet (0.18 s after
  // the input does), not before, and not while anything at all comes in.
  {
    rng_state() = 99;
    const std::vector<float> phrase = add(noise(0.4f, kRate, 0.3f), sine(700.0f, 0.4f, kRate, 0.3f));
    for (int block : {128, 2048, 37}) {
      device.init(kRate);
      device.set_param(p::kRing, 0.0f);
      EXPECT(device.asleep(), "asleep until something comes in");
      run(device, phrase, block);
      EXPECT(!device.asleep(), "awake while it sounds");
      run(device, silence(8.3f, kRate), block);
      EXPECT(!device.asleep(), "still awake 8.3 s on: the past Ago can reach is not yet all silence");
      run(device, silence(0.3f, kRate), block);
      EXPECT(device.asleep(), "asleep 8.6 s after the sound");
      std::vector<float> faint = silence(1.0f, kRate);
      faint[100] = 1.0e-20f;
      run(device, faint, block);
      EXPECT(!device.asleep(), "anything at all in the input wakes it");
    }
  }

  // A knob moved while the device sleeps is there when it wakes: no glide.
  {
    const std::vector<float> input = add(sine(330.0f, 1.0f, kRate, 0.3f), tone_at(900.0f, 0.3, 0.7, 1.0, 0.2f));
    device.init(kRate);
    device.set_param(p::kKeep, 1.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAgo, 200.0f);
    render(device, 0.1f, kRate);
    Stereo want = run(device, input);
    device.init(kRate);
    render(device, 0.05f, kRate);
    device.set_param(p::kKeep, 1.0f);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kAgo, 200.0f);
    render(device, 0.05f, kRate);
    Stereo got = run(device, input);
    EXPECT(got.left == want.left && got.right == want.right, "knobs moved while asleep snap on wake");
  }

  // No clicks. A held chord whose largest step is known: switching Keep both
  // ways, sweeping Ago and moving Mix while it plays add no step to speak of.
  {
    const std::vector<float> held = chord({110.0f, 165.0f, 220.0f}, 6.0f, 0.25f);
    const double plain = max_step(held);
    clean(device);
    Stereo kept = run_moving(device, held, [&](int block) {
      if (block == 750) device.set_param(p::kKeep, 1.0f);   // 2 s in: the chord is shared, so it goes
      if (block == 1500) device.set_param(p::kKeep, 0.0f);  // 4 s in: and comes back
    });
    const double gone = db(rms(kept.left, at(3.0), at(3.9)) / rms(held));
    const double there = db(rms(kept.left, at(5.0), at(5.9)) / rms(held));
    std::printf("common-tones: Keep switched on a held chord: largest step %.4f (the chord's own %.4f); Changes %.1f dB, Common %.2f dB\n",
                worst_step(kept), plain, gone, there);
    EXPECT(worst_step(kept) < plain * 1.1, "switching Keep makes no click");
    EXPECT(gone < -60.0 && there > -0.1, "Keep switches which side is let through");

    clean(device);
    Stereo swept = run_moving(device, held, [&](int block) {
      if (block >= 400 && block < 1600) device.set_param(p::kAgo, 50.0f * std::pow(160.0f, (block - 400) / 1200.0f));
    });
    EXPECT(worst_step(swept) < plain * 1.1, "sweeping Ago over a held chord makes no click");
    EXPECT(db(rms(swept.left, at(2.0), at(5.9)) / rms(held)) > -0.1, "and the chord, shared at any Ago, stays");

    // On a line that moves, where Ago matters: no step larger than the line makes at a fixed Ago.
    double fixed = 0.0;
    for (float ago : {50.0f, 400.0f, 3000.0f}) {
      clean(device);
      device.set_param(p::kAgo, ago);
      fixed = std::max(fixed, worst_step(run(device, moving)));
    }
    clean(device);
    Stereo line = run_moving(device, moving, [&](int block) {
      device.set_param(p::kAgo, 50.0f * std::pow(160.0f, 0.5f + 0.5f * std::sin(block * 0.021f)));
    });
    std::printf("common-tones: Ago swept on a moving line: largest step %.4f (fixed Ago: %.4f)\n", worst_step(line), fixed);
    EXPECT(worst_step(line) < fixed * 1.25, "sweeping Ago on a moving line makes no click");

    clean(device);
    device.set_param(p::kKeep, 1.0f);  // the wet is nothing, so Mix is all there is to hear
    Stereo mixed = run_moving(device, held, [&](int block) {
      if (block == 750) device.set_param(p::kMix, 0.0f);
      if (block == 1100) device.set_param(p::kMix, 1.0f);
      if (block == 1500) device.set_param(p::kMix, 0.3f);
    });
    EXPECT(worst_step(mixed) < plain * 1.1, "moving Mix makes no click");
    EXPECT_NEAR(rms(mixed.left, at(4.5), at(5.5)) / rms(held), 0.7, 0.01, "Mix is a straight crossfade: 0.3 leaves 0.7 of the dry");
  }

  // It comes to rest after any control move: a phrase, then each control put
  // at each end in the silence after it. A minute on (Ring 1 is 20 s to
  // -60 dB and rest is 140 dB down) the output is exact silence and the
  // meters read 0.
  {
    rng_state() = 7;
    const std::vector<float> phrase = add(noise(1.0f, kRate, 0.3f), sine(523.25f, 1.0f, kRate, 0.3f));
    bool rested = true, dark = true;
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        run(device, phrase);
        render(device, 0.3f, kRate);
        device.set_param(id, end ? p::kParamMax[id] : p::kParamMin[id]);
        Stereo tail = render(device, 60.0f, kRate);
        rested = rested && peak(tail.left, tail.size() - 48000) == 0.0 && peak(tail.right, tail.size() - 48000) == 0.0;
        for (int m = 0; m < CommonTones::kMeters; ++m) dark = dark && device.meter(m) == 0.0f;
      }
    }
    EXPECT(rested, "exact silence a minute after any control is moved to either end");
    EXPECT(dark, "and every meter reads 0 at rest");
  }

  // The meters: 24 third octaves from 62.5 Hz, three rows (now, then, let
  // through), each the amplitude of a sine of that band's power. A sine of
  // 0.5 at 1100 Hz (band 13 of 24: 1000 to 1260 Hz) reads 0.5 in all three
  // once Ago has passed, and nothing elsewhere; a new one reads in `now` only.
  {
    const int band = 12;
    clean(device);
    device.set_param(p::kStrict, 1.0f);
    run(device, sine(1100.0f, 0.3f, kRate, 0.5f));
    const float now_early = device.meter(band), then_early = device.meter(24 + band), heard_early = device.meter(48 + band);
    run(device, sine(1100.0f, 2.0f, kRate, 0.5f));
    EXPECT_NEAR(device.meter(band), 0.5, 0.01, "meter: the level now, as the amplitude of a sine");
    EXPECT_NEAR(device.meter(24 + band), 0.5, 0.01, "meter: the level then");
    EXPECT_NEAR(device.meter(48 + band), 0.5, 0.01, "meter: the level let through");
    float elsewhere = 0.0f;
    for (int m = 0; m < CommonTones::kMeters; ++m) {
      if (m % 24 != band) elsewhere = std::max(elsewhere, device.meter(m));
    }
    EXPECT(elsewhere < 0.005f, "meter: nothing in the other bands");
    // (switched on over the tone it is primed with it, so start from silence)
    clean(device);
    device.set_param(p::kStrict, 1.0f);
    run(device, join(silence(0.3f, kRate), sine(1100.0f, 0.3f, kRate, 0.5f)));
    std::printf("common-tones: meters 0.3 s into a tone: switched on over it %.3f %.3f %.3f; after silence %.3f %.3f %.3f\n",
                now_early, then_early, heard_early, device.meter(band), device.meter(24 + band), device.meter(48 + band));
    EXPECT(device.meter(band) > 0.45f && device.meter(24 + band) < 0.01f && device.meter(48 + band) < 0.01f,
           "meter: a new tone shows now, and not yet then or let through");
    EXPECT(device.meter(-1) == 0.0f && device.meter(CommonTones::kMeters) == 0.0f, "meter: an index outside the list reads 0");
  }

  // Every control does something over its whole range on a played phrase:
  // damped notes of six partials, some sharing partials, over a faint hiss.
  // From the default (wet only), each control is stepped in quarters of its
  // travel; "moved" is the difference from the step before, re the phrase.
  {
    const std::vector<float> phrase = played_phrase();
    const double reference = rms(phrase);
    const char* names[] = {"ago", "keep", "strict", "ring", "broad", "memory", "floor", "makeup", "mix"};
    for (int keep = 0; keep < 2; ++keep) {
      for (int id = 0; id < p::kNumParams; ++id) {
        if (id == p::kKeep) continue;
        std::printf("common-tones: on a phrase, %s, %-6s:", keep ? "Changes" : "Common", names[id]);
        Stereo before;
        double least = 0.0;
        for (int step = 0; step <= 4; ++step) {
          device.init(kRate);
          device.set_param(p::kKeep, static_cast<float>(keep));
          if (id != p::kMix) device.set_param(p::kMix, 1.0f);
          const float lo = p::kParamMin[id], hi = p::kParamMax[id];
          const float value = id == p::kAgo ? lo * std::pow(hi / lo, step / 4.0f) : lo + (hi - lo) * step / 4.0f;
          device.set_param(id, value);
          Stereo out = run(device, phrase);
          if (step > 0) {
            double sum = 0.0;
            for (size_t i = 0; i < out.size(); ++i) {
              const double d = static_cast<double>(out.left[i]) - before.left[i];
              sum += d * d;
            }
            const double moved = db(std::sqrt(sum / static_cast<double>(out.size())) / reference);
            least = std::min(least, moved);
            std::printf(" %6.1f", moved);
          }
          before = out;
        }
        std::printf(" dB\n");
        EXPECT(least > -35.0, "every quarter of every control's travel changes a played phrase");
      }
    }
    // Keep itself: the two sides are different sounds, and together they are the phrase.
    clean(device);
    Stereo common = run(device, phrase);
    clean(device);
    device.set_param(p::kKeep, 1.0f);
    Stereo changes = run(device, phrase);
    std::printf("common-tones: on a phrase, wet only: Common %.1f dB, Changes %.1f dB re the phrase\n",
                db(rms(common.left) / reference), db(rms(changes.left) / reference));
    EXPECT(rms(common.left) > 0.3 * reference && rms(changes.left) > 0.3 * reference, "a played phrase has both in it");
  }

  // The make-up. The gate takes level away from playing and none from a held
  // sound, so what is kept is turned up by a share of what it is short of the
  // dry sound over the last seconds: slowly (a decibel a second up at most),
  // never past the dry sound at its loudest, and not at all on a held sound.
  {
    const std::vector<float> phrase = played_phrase();
    std::vector<float> looped;
    for (int n = 0; n < 4; ++n) looped = join(looped, phrase);
    const size_t from = at(24.0), to = at(48.0);
    const double dry_level = rms(looped, from, to), dry_peak = peak(looped);
    std::vector<float> lift;
    auto follow = [&](int) { lift.push_back(device.lift_db()); };

    device.init(kRate);
    device.set_param(p::kMakeup, 0.0f);
    Stereo bare = run_moving(device, looped, follow);
    bool none = true;
    for (float v : lift) none = none && v == 0.0f;
    EXPECT(none, "Make up at nothing: no gain at all");
    const double bare_db = db(rms(bare.left, from, to) / dry_level);

    lift.clear();
    device.init(kRate);
    Stereo made = run_moving(device, looped, follow);
    const double made_db = db(rms(made.left, from, to) / dry_level);
    float low = 100.0f, high = 0.0f, rise = 0.0f;
    for (size_t b = 0; b < lift.size(); ++b) {
      if (b >= from / 128) low = std::min(low, lift[b]), high = std::max(high, lift[b]);
      if (b >= 375) rise = std::max(rise, lift[b] - lift[b - 375]);
    }
    std::printf("common-tones: a phrase played over and over at the default: %.2f dB re the dry without the make-up, %.2f dB with it;"
                " the gain %.2f to %.2f dB, rising %.2f dB a second at most; peak %.2f dB re the dry's\n",
                bare_db, made_db, low, high, rise, db(std::max(peak(made.left), peak(made.right)) / dry_peak));
    EXPECT(bare_db < -2.0, "the gate takes level away from a played phrase");
    EXPECT(made_db > bare_db + 1.0 && made_db > -2.0 && made_db < 0.5, "the make-up brings a played phrase back to within 2 dB of the dry");
    EXPECT(high - low < 1.0, "once it has settled the gain rides the phrase by less than a decibel");
    EXPECT(rise < 1.02f, "the gain never rises faster than a decibel a second");
    EXPECT(std::max(peak(made.left), peak(made.right)) < dry_peak * 1.06, "what is made up never peaks over the dry sound's own peaks");

    // The more Make up, the more level, over the whole of its travel.
    double last = bare_db;
    for (float amount : {0.25f, 0.5f, 0.75f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kMakeup, amount);
      Stereo out = run(device, looped);
      const double level = db(rms(out.left, from, to) / dry_level);
      EXPECT(level > last + 0.2, "Make up: every part of its travel is heard");
      last = level;
    }

    // A held sound passes whole and earns none, but the gain is slow: after
    // playing, a held chord as loud as the phrase keeps what the playing had
    // earned and loses it over the next seconds. It is never out by more than
    // that, and never louder than the dry sound has been.
    lift.clear();
    const std::vector<float> held = chord({220.0f, 277.18f, 329.63f, 440.0f}, 10.0f, static_cast<float>(dry_peak) / 4.0f);
    const std::vector<float> then_held = join(join(phrase, phrase), held);
    device.init(kRate);
    device.set_param(p::kMakeup, 1.0f);
    Stereo out = run_moving(device, then_held, follow);
    const float before = lift[at(23.9) / 128];
    const double chord_peak = peak(out.left, at(24.0) + kLatency, out.size()) / peak(held);
    float most_made = 0.0f;
    for (float v : lift) most_made = std::max(most_made, v);
    std::printf("common-tones: playing, then a held chord: the gain %.2f dB before it, %.2f dB a second in, %.2f dB three seconds in,"
                " %.2f dB at its end; the chord peaks %.2f dB re its own\n",
                before, lift[at(25.0) / 128], lift[at(27.0) / 128], lift.back(), db(chord_peak));
    EXPECT(before > 2.0f, "playing brings the make-up up");
    EXPECT(most_made <= 6.0f, "the make-up is never more than 6 dB");
    EXPECT(db(chord_peak) < before && db(chord_peak) < 2.0, "a held chord after playing is out by less than the make-up the playing earned");
    EXPECT(lift[at(27.0) / 128] < 0.5f * before && lift.back() < 0.3f, "and the make-up falls away under it: half in three seconds, gone in ten");

    // A quiet held chord after loud playing has its say as soon: each frame is
    // weighed against how loud the playing has lately been, not against the
    // loudest thing in the window.
    lift.clear();
    const std::vector<float> quiet = chord({220.0f, 277.18f, 329.63f, 440.0f}, 10.0f, static_cast<float>(dry_peak) / 16.0f);
    device.init(kRate);
    device.set_param(p::kMakeup, 1.0f);
    run_moving(device, join(join(phrase, phrase), quiet), follow);
    std::printf("common-tones: playing, then a held chord 12 dB quieter: the gain %.2f dB before it, %.2f dB six seconds in, %.2f dB at its end\n",
                lift[at(23.9) / 128], lift[at(30.0) / 128], lift.back());
    EXPECT(lift[at(30.0) / 128] < 0.5f * lift[at(23.9) / 128], "a quiet held chord after loud playing brings the make-up down as a loud one does");

    // A burst of nonsense, 40 dB over full scale for half a second, weighs no
    // more than any other half second: the make-up stays where it would have been.
    {
      std::vector<float> spoiled = looped;
      for (size_t i = at(13.0); i < at(13.5); ++i) spoiled[i] = (i / 50) & 1 ? 100.0f : -100.0f;
      std::vector<float> lifts[2];
      for (int run_of = 0; run_of < 2; ++run_of) {
        lift.clear();
        device.init(kRate);
        device.set_param(p::kRing, 0.0f);
        run_moving(device, run_of ? spoiled : looped, follow);
        lifts[run_of] = lift;
      }
      float apart = 0.0f, at_once = 0.0f;
      for (size_t b = at(13.0) / 128; b < lifts[0].size(); ++b) {
        const float d = std::fabs(lifts[1][b] - lifts[0][b]);
        (b < at(33.5) / 128 ? at_once : apart) = std::max(b < at(33.5) / 128 ? at_once : apart, d);
      }
      std::printf("common-tones: half a second of nonsense in a phrase played over and over: the make-up is %.2f dB from its place at most in the"
                  " twenty seconds after, %.2f dB from there on\n", at_once, apart);
      EXPECT(at_once < 0.5f && apart < 0.1f, "a burst of nonsense does not put the make-up out of place");
    }

    // Whatever lets the whole sound through at once finds the make-up taken
    // down at once, not at its own pace: Floor thrown to the top, wet only and
    // with no ring, a fifth of a second before the phrase's loudest moment.
    // Without the ceiling that moment would come out over the dry by all the
    // make-up the playing had earned, less what two tenths of a second take off.
    {
      const std::vector<float> thrice = join(join(phrase, phrase), phrase);
      device.init(kRate);
      device.set_param(p::kMakeup, 1.0f);
      device.set_param(p::kRing, 0.0f);
      device.set_param(p::kMix, 1.0f);
      float had = 0.0f;
      Stereo thrown = run_moving(device, thrice, [&](int block) {
        if (block != static_cast<int>(at(26.2) / 128)) return;
        had = device.lift_db();
        device.set_param(p::kFloor, 0.0f);
      });
      const double over = db(peak(thrown.left, at(26.5) + kLatency, at(27.0) + kLatency) / peak(thrice, at(26.5), at(27.0)));
      std::printf("common-tones: Floor thrown to the top with %.2f dB of make-up up, 0.2 s before the loudest notes: a tenth of a second into"
                  " them the wet sound peaks %.2f dB over the dry\n", had, over);
      EXPECT(had > 2.0f && over < 1.5, "the make-up is taken down at once when the whole sound is let through");
    }

    // A held chord from the start never has any.
    lift.clear();
    device.init(kRate);
    device.set_param(p::kMakeup, 1.0f);
    out = run_moving(device, join(silence(0.5f, kRate), held), follow);
    float most = 0.0f;
    for (float v : lift) most = std::max(most, v);
    EXPECT(most < 0.6f && lift.back() < 0.05f, "a held chord gets no make-up to speak of");
    EXPECT_NEAR(db(rms(out.left, at(6.0), at(10.0)) / rms(held, at(5.0), at(9.0))), 0.0, 0.05, "and comes out at its own level");

    // It keeps its place through a silence, asleep or not, and at any block size.
    for (int block : {128, 2048, 1}) {
      device.init(kRate);
      device.set_param(p::kRing, 0.0f);
      run(device, join(phrase, silence(1.0f, kRate)), block);
      const float had = device.lift_db();
      run(device, silence(10.0f, kRate), block);
      EXPECT(device.asleep() && had > 1.0f && device.lift_db() == had, "the make-up keeps its place through silence and sleep");
    }
  }

  // The presets' level. The comparison takes level away from playing: that is
  // the effect. With the make-up every preset brings a phrase played over and
  // over out within 4 dB of the dry sound and no more than 1 dB over it (the
  // furthest under is the one that lets through only what it has not heard
  // lately, which a phrase played over and over has little of), and the
  // presets that keep what is common pass slow chords, each sharing two notes
  // with the last, within 1.5 dB.
  {
    const std::vector<float> phrase = played_phrase();
    std::vector<float> looped;
    for (int n = 0; n < 4; ++n) looped = join(looped, phrase);
    const std::vector<float> slow = join(join(chord({261.63f, 329.63f, 392.0f}, 6.0f, 0.1f), chord({220.0f, 261.63f, 329.63f}, 6.0f, 0.1f)),
                                         chord({174.61f, 220.0f, 261.63f}, 6.0f, 0.1f));
    const double played_level = rms(looped, at(24.0), at(48.0));
    const double slow_level = rms(slow, at(1.0), at(18.0) - kLatency);
    double lowest = 0.0, highest = -100.0, lowest_slow = 0.0, highest_slow = -100.0;
    for (const Setting& preset : kPresets) {
      set_all(device, preset.value);
      Stereo out = run(device, looped);
      const double level = db(rms(out.left, at(24.0), at(48.0)) / played_level);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      double held = 0.0;
      if (preset.value[p::kKeep] < 0.5f) {
        set_all(device, preset.value);
        out = run(device, slow);
        held = db(rms(out.left, at(1.0) + kLatency, at(18.0)) / slow_level);
        lowest_slow = std::min(lowest_slow, held);
        highest_slow = std::max(highest_slow, held);
      }
      std::printf("common-tones: %-16s a phrase over and over %5.2f dB re the dry; slow chords %5.2f dB\n", preset.name, level, held);
    }
    // A noise's own wandering starts to pass as change above Strict 0.65
    // (see the noise through Changes above): no preset that keeps the changes
    // is set stricter than that.
    bool calm = true;
    for (const Setting& preset : kPresets)
      if (preset.value[p::kKeep] >= 0.5f && preset.value[p::kStrict] > 0.65f) calm = false;
    EXPECT(calm, "no preset that keeps the changes is strict enough to let a steady noise flutter through");
    EXPECT(lowest > -4.0 && highest < 1.0, "every preset brings a phrase played over and over out within 4 dB of the dry and no more than 1 dB over it");
    EXPECT(lowest_slow > -1.5 && highest_slow < 0.75, "the presets that keep what is common pass slow chords within 1.5 dB");
  }

  // Level. A full-scale held chord for a minute, through every preset and
  // through the default with each control at each end: the output never
  // peaks more than 6 dB over the input and its last ten seconds are no
  // louder than its second ten. Full-scale noise, which no setting takes for
  // steady, is bounded the same way.
  {
    const std::vector<float> loud = chord({220.0f, 277.18f, 329.63f}, 60.0f, 1.0f / 3.0f);
    rng_state() = 31;
    const std::vector<float> hiss = noise(20.0f, kRate, 1.0f);
    double worst_peak = 0.0, worst_growth = 0.0, worst_noise = 0.0;
    auto measure = [&]() {
      Stereo out = run(device, loud);
      worst_peak = std::max(worst_peak, std::max(peak(out.left), peak(out.right)));
      const double early = rms(out.left, at(10.0), at(20.0)), last = rms(out.left, at(50.0), at(60.0));
      if (early > 1.0e-6) worst_growth = std::max(worst_growth, last / early);
    };
    for (const Setting& preset : kPresets) {
      set_all(device, preset.value);
      measure();
      set_all(device, preset.value);
      Stereo out = run(device, hiss);
      worst_noise = std::max(worst_noise, std::max(peak(out.left), peak(out.right)));
    }
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        device.set_param(id, end ? p::kParamMax[id] : p::kParamMin[id]);
        measure();
        device.init(kRate);
        device.set_param(id, end ? p::kParamMax[id] : p::kParamMin[id]);
        Stereo out = run(device, hiss);
        worst_noise = std::max(worst_noise, std::max(peak(out.left), peak(out.right)));
      }
    }
    // Everything that can add: the longest ring, the widest regions, wet only, either side.
    for (float keep : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kKeep, keep);
      device.set_param(p::kRing, 1.0f);
      device.set_param(p::kBroad, 1.0f);
      device.set_param(p::kStrict, 0.0f);
      device.set_param(p::kFloor, 0.0f);
      device.set_param(p::kMix, 1.0f);
      measure();
      Stereo out = run(device, hiss);
      worst_noise = std::max(worst_noise, std::max(peak(out.left), peak(out.right)));
      EXPECT(rms(out.left, at(10.0), at(20.0)) < 1.5 * rms(hiss), "noise through the longest ring is no louder than 3.5 dB over the input");
    }
    std::printf("common-tones: a full-scale chord for a minute, %d settings: worst peak %.3f (%.2f dB), last ten seconds %.4f of the second ten;"
                " full-scale noise: worst peak %.3f\n",
                static_cast<int>(sizeof(kPresets) / sizeof(kPresets[0])) + 2 * p::kNumParams + 2, worst_peak, db(worst_peak),
                worst_growth, worst_noise);
    EXPECT(worst_peak < 1.2, "a full-scale held chord never comes out more than 1.6 dB over full scale");
    EXPECT(worst_growth < 1.001, "and never grows");
    EXPECT(worst_noise <= 2.0, "full-scale noise stays under the wet guard's ceiling");
  }

  // Part-way Mix. The wet is the dry's own bins turned down, never turned in
  // phase, and the dry in the mix is as late as the wet: held tones over the
  // piano range, at part-way Mix through the default and every preset, come
  // out between the input's level and (1 - Mix) of it, and whole through the
  // default, which keeps what is held.
  {
    double worst_default = 0.0, worst_dip = 0.0, worst_over = 0.0;
    for (int semitone = 0; semitone <= 87; semitone += 7) {
      const float hz = 27.5f * std::pow(2.0f, semitone / 12.0f);
      const std::vector<float> tone = sine(hz, 2.0f, kRate, 0.5f);
      const double in = rms(tone, at(1.5), at(2.0));
      for (float mix : {0.25f, 0.5f, 0.75f}) {
        device.init(kRate);
        device.set_param(p::kMix, mix);
        Stereo out = run(device, tone);
        worst_default = std::max(worst_default, std::fabs(db(rms(out.left, at(1.5), at(2.0)) / in)));
        for (const Setting& preset : kPresets) {
          if (mix != 0.5f) continue;
          set_all(device, preset.value);
          device.set_param(p::kMix, mix);
          out = run(device, tone);
          const double level = rms(out.left, at(1.5), at(2.0)) / in;
          worst_dip = std::min(worst_dip, db(level / (1.0 - mix)));
          worst_over = std::max(worst_over, db(level));
        }
      }
    }
    std::printf("common-tones: held tones A0 to C8 at part-way Mix: default within %.3f dB of the input; presets at Mix 0.5: "
                "%.3f dB under the dry's share at worst, %.3f dB over the input at most\n",
                worst_default, worst_dip, worst_over);
    EXPECT(worst_default < 0.1, "part-way Mix leaves a held tone whole at the default, anywhere on the piano");
    EXPECT(worst_dip > -0.1 && worst_over < 0.1, "and no preset cancels the dry at part-way Mix");
  }

  // Cost: the average, and the worst single block (the one with a frame in
  // it), at the default and at the worst setting: the widest regions, the
  // longest look back (the far end of the history is cold memory), noise in
  // every bin. Wall clock for the loop's own print, and processor time over
  // 60 s of blocks, which a loaded machine does not stretch.
  {
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(10.0f, kRate, 0.25f);
    auto worst = [&]() {
      device.init(kRate);
      device.set_param(p::kAgo, 8000.0f);
      device.set_param(p::kBroad, 1.0f);
      device.set_param(p::kRing, 1.0f);
      device.set_param(p::kMemory, 1.0f);
    };
    worst();
    report_cost("common-tones", 10.0f, kRate, [&] { run(device, input); });
    for (int setting = 0; setting < 2; ++setting) {
      if (setting) {
        worst();
      } else {
        device.init(kRate);
      }
      std::vector<double> micros;
      const std::clock_t began = std::clock();
      for (int pass = 0; pass < 6; ++pass) {
        for (size_t done = 0; done + 128 <= input.size(); done += 128) {
          for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
          const auto start = std::chrono::steady_clock::now();
          device.process(128);
          micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
        }
      }
      const double cpu = static_cast<double>(std::clock() - began) / CLOCKS_PER_SEC;
      std::sort(micros.begin(), micros.end());
      // A quarter of the blocks hold a frame (each side's in its own block), so
      // the 95th percentile is one of them without the scheduler's noise.
      std::printf("common-tones %s: %.2f %% of real time in processor time over 60 s; worst block %.0f us at the 95th percentile,"
                  " %.0f us median, of %.0f us per block\n",
                  setting ? "at the worst setting" : "at the default", 100.0 * cpu / 60.0, micros[micros.size() * 95 / 100],
                  micros[micros.size() / 2], 128.0e6 / kRate);
    }
  }

  return finish("common-tones");
}
