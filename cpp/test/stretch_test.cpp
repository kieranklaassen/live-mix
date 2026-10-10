// Native harness for Stretch (cpp/devices/stretch). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a time stretch: the pitch stays, time
// goes N times slower, the reader keeps inside Memory and runs up to the
// present, Freeze holds without a buzz, and the level stays the input's.

#include "../devices/stretch/stretch.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Stretch;
namespace p = livemix::stretch;

static Stretch device;

static const float kRate = 48000.0f;
static const int kFrames[4] = {2048, 4096, 8192, 16384};  // stretch.h kFrames, by Window

static double cents(double a, double b) { return 1200.0 * std::log2(a / b); }

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// All wet, mono phases, the longest Memory: the stretch alone.
static void wet(Stretch& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMemory, 20.0f);
}

// The power-weighted mean frequency of `x` between lo and hi Hz.
static double centroid(const std::vector<float>& x, double lo, double hi, size_t from, size_t to) {
  double sum = 0.0, moment = 0.0;
  for (double hz = lo; hz <= hi; hz += 0.5) {
    const double level = tone_level(x, hz, kRate, from, to);
    sum += level * level;
    moment += level * level * hz;
  }
  return sum > 0.0 ? moment / sum : 0.0;
}

// Three notes that add up to full scale.
static std::vector<float> chord(float seconds, float rate = kRate) {
  std::vector<float> out = sine(220.0f, seconds, rate, 0.34f);
  const std::vector<float> b = sine(277.18f, seconds, rate, 0.33f);
  const std::vector<float> c = sine(329.63f, seconds, rate, 0.33f);
  for (size_t i = 0; i < out.size(); ++i) out[i] += b[i] + c[i];
  return out;
}

// Runs `input` in blocks and reads a meter after each: the highest and the
// lowest reading from `from_seconds` on.
struct Range {
  double low = 1.0e9, high = -1.0e9;
};
static Range watch(Stretch& d, const std::vector<float>& input, int meter, double from_seconds,
                   std::vector<float>* readings = nullptr) {
  Range range;
  for (size_t done = 0; done + kBlock <= input.size(); done += kBlock) {
    for (int i = 0; i < kBlock; ++i) d.in_left()[i] = d.in_right()[i] = input[done + i];
    d.process(kBlock);
    const double reading = d.meter(meter);
    if (readings) readings->push_back(static_cast<float>(reading));
    if (static_cast<double>(done) >= from_seconds * kRate) {
      range.low = std::min(range.low, reading);
      range.high = std::max(range.high, reading);
    }
  }
  return range;
}

// PRESETS-BEGIN
// The presets of device.json, in its order: the controls each one sets (-1 ends the list).
struct Preset {
  const char* name;
  struct {
    int id;
    float value;
  } set[10];
};
static const Preset kPresets[] = {
    {"Slow cloud", {{-1, 0.0f}}},
    {"Half time haze", {{p::kStretch, 2.0f}, {p::kWindow, 1.0f}, {p::kMemory, 4.0f}, {p::kMix, 0.45f}, {-1, 0.0f}}},
    {"Glass", {{p::kStretch, 12.0f}, {p::kWindow, 3.0f}, {p::kDiffuse, 0.05f}, {p::kMix, 0.9f}, {-1, 0.0f}}},
    {"Distant memory", {{p::kStretch, 20.0f}, {p::kWindow, 3.0f}, {p::kMemory, 20.0f}, {p::kTone, -0.4f}, {p::kMix, 0.6f}, {-1, 0.0f}}},
    {"Near shadow", {{p::kStretch, 3.0f}, {p::kWindow, 0.0f}, {p::kMemory, 1.5f}, {p::kCatchUp, 0.3f}, {p::kMix, 0.35f}, {-1, 0.0f}}},
    {"Faint halo", {{p::kStretch, 14.0f}, {p::kTone, -0.3f}, {p::kMix, 0.18f}, {-1, 0.0f}}},
    {"Hundred times", {{p::kStretch, 100.0f}, {p::kWindow, 3.0f}, {p::kMemory, 20.0f}, {p::kMix, 0.7f}, {-1, 0.0f}}},
    {"Dark drift", {{p::kStretch, 10.0f}, {p::kTone, -1.0f}, {p::kWidth, 1.0f}, {p::kMix, 0.6f}, {-1, 0.0f}}},
    {"Bright mist", {{p::kStretch, 6.0f}, {p::kWindow, 1.0f}, {p::kTone, 0.5f}, {p::kMix, 0.35f}, {-1, 0.0f}}},
    {"Grainy trail", {{p::kStretch, 5.0f}, {p::kWindow, 0.0f}, {p::kMemory, 3.0f}, {p::kMix, 0.5f}, {-1, 0.0f}}},
    {"Catching up", {{p::kStretch, 3.0f}, {p::kWindow, 1.0f}, {p::kMemory, 1.2f}, {p::kCatchUp, 1.2f}, {p::kMix, 0.6f}, {-1, 0.0f}}},
    {"Narrow column", {{p::kStretch, 8.0f}, {p::kTone, 0.2f}, {p::kWidth, 0.0f}, {-1, 0.0f}}},
    {"Cloud alone", {{p::kWidth, 1.0f}, {p::kMix, 1.0f}, {-1, 0.0f}}},
    {"Pure and slow", {{p::kStretch, 16.0f}, {p::kDiffuse, 0.25f}, {p::kMix, 0.85f}, {-1, 0.0f}}},
    {"Jump cuts", {{p::kStretch, 2.0f}, {p::kWindow, 0.0f}, {p::kMemory, 1.0f}, {p::kCatchUp, 0.05f}, {p::kMix, 0.55f}, {-1, 0.0f}}},
    {"Long glass pad", {{p::kStretch, 40.0f}, {p::kWindow, 3.0f}, {p::kMemory, 20.0f}, {p::kDiffuse, 0.4f}, {p::kTone, -0.2f}, {p::kMix, 0.9f}, {-1, 0.0f}}},
};
// PRESETS-END

static void load(Stretch& d, const Preset& preset) {
  d.init(kRate);
  for (int i = 0; preset.set[i].id >= 0; ++i) d.set_param(preset.set[i].id, preset.set[i].value);
}

int main() {
  Conformance spec;
  spec.name = "stretch";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the input, sample for sample: there is no latency to report.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x51u;
    const std::vector<float> programme = join(sine(440.0f, 1.0f, kRate, 0.5f), noise(1.0f, kRate, 0.5f));
    Stereo out = run(device, programme);
    bool same = true;
    for (size_t i = 0; i < programme.size(); ++i) same = same && out.left[i] == programme[i] && out.right[i] == programme[i];
    EXPECT(same, "Mix 0 is the input, bit for bit");
  }

  // Pitch: a sine comes out at its own frequency at every Stretch and every
  // Window. Pure (Diffuse 0) and half scattered it is one line, within two
  // cents; all scattered it is a narrow band whose middle is the note.
  {
    for (int window = 0; window < 4; ++window) {
      for (float stretch : {2.0f, 8.0f, 100.0f}) {
        for (float diffuse : {0.0f, 0.5f, 1.0f}) {
          wet(device);
          device.set_param(p::kWindow, static_cast<float>(window));
          device.set_param(p::kStretch, stretch);
          device.set_param(p::kDiffuse, diffuse);
          Stereo out = run(device, sine(440.0f, 9.0f, kRate, 0.5f));
          const size_t from = 3 * 48000, to = 9 * 48000;
          char label[160];
          if (diffuse < 1.0f) {
            const double hz = dominant_frequency(out.left, kRate, 400.0, 480.0, from, to);
            std::snprintf(label, sizeof label, "pitch holds: window %d, stretch %.0f, diffuse %.1f: %.3f Hz (%+.2f ct)",
                          window, stretch, diffuse, hz, cents(hz, 440.0));
            EXPECT(std::fabs(cents(hz, 440.0)) < 2.0, label);
          } else {
            const double band = 3.0 * kRate / kFrames[window];
            const double hz = centroid(out.left, 440.0 - band, 440.0 + band, from, to);
            std::snprintf(label, sizeof label, "scattered, the band lies on the note: window %d, stretch %.0f: %.2f Hz (%+.1f ct)",
                          window, stretch, hz, cents(hz, 440.0));
            EXPECT(std::fabs(cents(hz, 440.0)) < 20.0, label);
          }
          const double level = db(rms(out.left, from, to) / (0.5 / std::sqrt(2.0)));
          std::snprintf(label, sizeof label, "level holds: window %d, stretch %.0f, diffuse %.1f: %+.2f dB", window,
                        stretch, diffuse, level);
          // The cloud swells from half level while the first window moves
          // off the first sample, which takes Stretch × half a window.
          const bool swelling = stretch * (kFrames[window] / 2) / kRate > 2.5;
          EXPECT(level < 1.0 && level > (swelling ? -6.5 : -1.0), label);
        }
      }
    }
  }

  // Time: a rising sweep comes out as the same sweep N times slower. What
  // sounds at output time t is what the input was where the reader stood:
  // it starts on the first sample, reads from half a window in, and moves
  // 1/N of a second a second; a frame sounds a window and seven eighths of
  // a hop after it was read (kit::Stft's latency and the three eighths of
  // a hop the reading is early by).
  {
    const int frame = kFrames[1];
    const double late = (frame + 0.875 * frame / 4 + 0.5 * frame / 4) / kRate;  // ± half a hop
    std::vector<float> sweep(static_cast<size_t>(16.0f * kRate));
    double phase = 0.0;
    for (size_t i = 0; i < sweep.size(); ++i) {
      const double hz = 220.0 * std::pow(2.0, static_cast<double>(i) / kRate / 8.0);  // an octave in 8 s
      phase += 2.0 * kPi * hz / kRate;
      sweep[i] = 0.5f * static_cast<float>(std::sin(phase));
    }
    for (float stretch : {2.0f, 4.0f}) {
      wet(device);
      device.set_param(p::kWindow, 1.0f);
      device.set_param(p::kStretch, stretch);
      device.set_param(p::kDiffuse, 0.0f);
      Stereo out = run(device, sweep);
      for (double t : {3.0, 6.0, 9.0, 12.0, 15.0}) {
        const double at = (t - late) / stretch;  // where the reader stood, in seconds of input
        const double expected = 220.0 * std::pow(2.0, at / 8.0);
        const size_t from = static_cast<size_t>((t - 0.25) * kRate), to = static_cast<size_t>((t + 0.25) * kRate);
        const double hz = dominant_frequency(out.left, kRate, 200.0, 900.0, from, to);
        char label[160];
        std::snprintf(label, sizeof label, "a sweep comes out %.0f times slower: at %.0f s %.2f Hz, the input's at %.3f s is %.2f Hz (%+.1f ct)",
                      stretch, t, hz, at, expected, cents(hz, expected));
        EXPECT(std::fabs(cents(hz, expected)) < 10.0, label);
      }
    }
  }

  // A click in the middle of the playing comes out as a swell N times later
  // and N windows long: its level follows the Hann window as the reader's
  // window passes over it.
  {
    const float stretch = 4.0f;
    double spans[2] = {0.0, 0.0};
    for (int which = 0; which < 2; ++which) {
      const int window = which == 0 ? 0 : 2;
      const int frame = kFrames[window];
      wet(device);
      device.set_param(p::kWindow, static_cast<float>(window));
      device.set_param(p::kStretch, stretch);
      rng_state() = 0xC11Cu;
      std::vector<float> in = noise(7.0f, kRate, 1.0e-4f);  // a floor, so the reader is on its way
      in[48000] = 0.9f;
      Stereo out = run(device, in);
      // Where 5 %, 50 % and 95 % of the energy have come out.
      double total = 0.0;
      for (float v : out.left) total += static_cast<double>(v) * v;
      double sum = 0.0;
      size_t marks[3] = {0, 0, 0};
      const double shares[3] = {0.05, 0.5, 0.95};
      int next = 0;
      for (size_t i = 0; i < out.left.size() && next < 3; ++i) {
        sum += static_cast<double>(out.left[i]) * out.left[i];
        while (next < 3 && sum >= shares[next] * total) marks[next++] = i;
      }
      // The reader reaches the click's second when N of them have passed,
      // and the frame sounds `late` after that.
      const double late = (frame + 0.875 * frame / 4 + 0.5 * frame / 4) / kRate;
      const double expected = stretch * 1.0 + late;
      const double centre = marks[1] / kRate;
      spans[which] = (marks[2] - marks[0]) / kRate;
      // Hann² holds its middle 90 % of energy in 0.455 of its length.
      const double span = 0.455 * stretch * frame / kRate;
      char label[160];
      std::snprintf(label, sizeof label, "a click swells N times later: window %d, centre %.3f s, expected %.3f s", window, centre, expected);
      EXPECT(std::fabs(centre - expected) < 0.15 * stretch * frame / kRate + 0.02, label);
      std::snprintf(label, sizeof label, "the swell is N windows long: window %d, 90 %% of it in %.3f s, expected %.3f s", window, spans[which], span);
      EXPECT(std::fabs(spans[which] / span - 1.0) < 0.25, label);
    }
    EXPECT(spans[1] > 3.0 * spans[0] && spans[1] < 5.0 * spans[0], "Window sets the length of the swell: four times the frame, four times as long");
  }

  // The reader: it falls behind by (1 - 1/Stretch) seconds a second, it is
  // never further back than Memory, and when Memory is used up it runs up to
  // the present (half a window behind) in Catch Up seconds, at more than
  // real time.
  {
    const double half = 0.5 * kFrames[1] / kRate;
    device.init(kRate);
    device.set_param(p::kWindow, 1.0f);
    device.set_param(p::kStretch, 8.0f);
    device.set_param(p::kMemory, 2.0f);
    device.set_param(p::kCatchUp, 0.5f);
    rng_state() = 0x1A6u;
    const std::vector<float> in = noise(9.0f, kRate, 0.2f);
    std::vector<float> behind;
    Range range = watch(device, in, 1, 0.0, &behind);
    const double per_block = kBlock / kRate;
    char label[160];
    std::snprintf(label, sizeof label, "the reader is never further back than Memory (%.4f s of 2 s)", range.high);
    EXPECT(range.high <= 2.0 + 1.0e-4, label);
    const double fell = behind[static_cast<size_t>(1.5 / per_block)] - behind[static_cast<size_t>(0.5 / per_block)];
    std::snprintf(label, sizeof label, "it falls behind by 1 - 1/Stretch a second (%.4f s in 1 s at Stretch 8)", fell);
    EXPECT_NEAR(fell, 0.875, 0.03, label);
    size_t full = 0, back = 0;
    while (full < behind.size() && behind[full] < 1.95) ++full;
    back = full;
    while (back < behind.size() && behind[back] > half + 0.01) ++back;
    const double took = (back - full) * per_block;
    std::snprintf(label, sizeof label, "Memory is used up after %.2f s and the reader is back in %.3f s (Catch Up 0.5 s)", full * per_block, took);
    EXPECT(full < behind.size() && back < behind.size() && std::fabs(took - 0.5) < 0.06, label);
    EXPECT_NEAR(behind[back], half, 0.01, "caught up, the reader stands half a window behind the write head");
    // And then it falls behind again.
    EXPECT(behind[back + static_cast<size_t>(1.0 / per_block)] > 0.8, "after catching up it reads on and falls behind again");

    // While it runs up, it moves faster than the playing: 1 + (Memory - half a window) / Catch Up.
    device.init(kRate);
    device.set_param(p::kWindow, 1.0f);
    device.set_param(p::kStretch, 8.0f);
    device.set_param(p::kMemory, 2.0f);
    device.set_param(p::kCatchUp, 0.5f);
    Range speed = watch(device, in, 2, 0.0);
    std::snprintf(label, sizeof label, "running up to the present it moves at %.2f times real time", speed.high);
    EXPECT_NEAR(speed.high, 1.0 + (2.0 - half) / 0.5, 0.15, label);
    EXPECT_NEAR(speed.low, 0.0, 1.0e-6, "while its first window fills the reader stands on the first sample");

    // Memory turned down under the reader: it is brought inside at once.
    device.init(kRate);
    device.set_param(p::kStretch, 8.0f);
    device.set_param(p::kMemory, 20.0f);
    watch(device, in, 1, 0.0);
    EXPECT(device.meter(1) > 6.0, "with a long Memory the reader is far behind after 9 s");
    device.set_param(p::kMemory, 1.0f);
    Range after = watch(device, std::vector<float>(in.begin(), in.begin() + 48000), 1, 0.2);
    std::snprintf(label, sizeof label, "Memory turned down brings the reader inside it (%.3f s of 1 s)", after.high);
    EXPECT(after.high <= 1.0 + 1.0e-4, label);
  }

  // Freeze holds the moment: the level and the pitch stay for as long as it
  // is on, nothing at the frame rate shows (a frame replayed would put lines
  // a hop rate either side of the note), the device never sleeps, and the
  // reader and the memory stand still.
  {
    for (int window : {0, 2}) {
      const double hop_hz = kRate / (kFrames[window] / 4);
      wet(device);
      device.set_param(p::kWindow, static_cast<float>(window));
      device.set_param(p::kDiffuse, 0.0f);
      run(device, sine(440.0f, 3.0f, kRate, 0.5f));
      const double before = device.meter(1);
      device.set_param(p::kFreeze, 1.0f);
      rng_state() = 0xF2u;
      run(device, noise(0.5f, kRate, 0.3f));
      const double behind = device.meter(1);
      const double clock = device.meter(3);
      EXPECT(behind - before >= 0.0 && behind - before < 0.5 * kFrames[window] / kRate, "Freeze stops the reader where it is");
      Stereo held = run(device, noise(30.0f, kRate, 0.3f));  // what is played meanwhile is not heard
      const size_t n = held.left.size();
      char label[200];
      double low = 1.0e9, high = 0.0;
      for (size_t s = 1; s < 30; ++s) {
        const double level = rms(held.left, s * 48000, (s + 1) * 48000);
        low = std::min(low, level);
        high = std::max(high, level);
      }
      std::snprintf(label, sizeof label, "frozen, the level stays: window %d, %.2f to %.2f dB of the note for 30 s", window,
                    db(low / 0.35355), db(high / 0.35355));
      EXPECT(db(low / 0.35355) > -0.5 && db(high / 0.35355) < 0.5, label);
      const double hz = dominant_frequency(held.left, kRate, 400.0, 480.0, n - 10 * 48000, n);
      std::snprintf(label, sizeof label, "frozen, the pitch stays: window %d, %.3f Hz (%+.2f ct)", window, hz, cents(hz, 440.0));
      EXPECT(std::fabs(cents(hz, 440.0)) < 2.0, label);
      const double carrier = tone_level(held.left, hz, kRate, n - 4 * 48000, n);
      const double side = std::max(tone_level(held.left, hz + hop_hz, kRate, n - 4 * 48000, n),
                                   tone_level(held.left, hz - hop_hz, kRate, n - 4 * 48000, n));
      std::snprintf(label, sizeof label, "frozen, no buzz at the frame rate: window %d, lines %.1f Hz either side are %.1f dB under the note",
                    window, hop_hz, db(carrier / std::max(side, 1.0e-12)));
      EXPECT(side < carrier * 0.01, label);
      EXPECT_NEAR(device.meter(1), behind, 1.0e-4, "frozen, the reader stays where it was");
      EXPECT_NEAR(device.meter(3), clock, 1.0e-6, "frozen, nothing is recorded: the recording clock stands");
      EXPECT_NEAR(device.meter(2), 0.0, 1.0e-9, "frozen, the reader's speed reads 0");
      // Off again, the phrase goes on from the same place.
      device.set_param(p::kFreeze, 0.0f);
      run(device, sine(440.0f, 1.0f, kRate, 0.5f));
      std::snprintf(label, sizeof label, "Freeze off, the reader goes on from where it stood (%.3f s behind, was %.3f s)",
                    device.meter(1), behind);
      EXPECT_NEAR(device.meter(1), behind + 0.875, 0.05, label);
    }
    // All scattered, a frozen moment is a steady band of noise, not a loop.
    wet(device);
    device.set_param(p::kDiffuse, 1.0f);
    run(device, chord(3.0f));
    device.set_param(p::kFreeze, 1.0f);
    Stereo held = render(device, 40.0f, kRate);
    double low = 1.0e9, high = 0.0;
    for (size_t s = 1; s < 40; ++s) {
      const double level = rms(held.left, s * 48000, (s + 1) * 48000);
      low = std::min(low, level);
      high = std::max(high, level);
    }
    char label[160];
    std::snprintf(label, sizeof label, "frozen and scattered, a chord holds its level for 40 s with no input (%.2f to %.2f dB)",
                  db(low / rms(chord(1.0f))), db(high / rms(chord(1.0f))));
    EXPECT(db(low / rms(chord(1.0f))) > -2.5 && db(high / rms(chord(1.0f))) < 2.5, label);
  }

  // Diffuse: at 0 a sine is one pure line, at 1 its energy is spread over
  // the band a window is wide; in between it is some of each.
  {
    double line[3];
    int i = 0;
    for (float diffuse : {0.0f, 0.5f, 1.0f}) {
      wet(device);
      device.set_param(p::kDiffuse, diffuse);
      Stereo out = run(device, sine(440.0f, 9.0f, kRate, 0.5f));
      // The share of the level within a hertz of the note, over a second at a time.
      double sum = 0.0;
      for (size_t s = 3; s < 9; ++s) sum += tone_level(out.left, 440.0, kRate, s * 48000, (s + 1) * 48000) / 0.5;
      line[i++] = sum / 6.0;
    }
    char label[160];
    std::snprintf(label, sizeof label, "Diffuse dissolves a sine: the line holds %.2f, %.2f and %.2f of the level at 0, 0.5 and 1", line[0], line[1], line[2]);
    EXPECT(line[0] > 0.85 && line[1] < line[0] - 0.1 && line[1] > line[2] + 0.1 && line[2] < 0.4, label);
  }

  // Width: at 0 a mono input stays mono, bit for bit; turned up the two
  // sides are scattered apart, and even pure notes drift apart in phase.
  {
    wet(device);
    rng_state() = 0x3Du;
    const std::vector<float> in = noise(6.0f, kRate, 0.3f);
    Stereo mono = run(device, in);
    EXPECT(mono.left == mono.right && rms(mono.left) > 0.05, "Width 0: mono in is mono out");
    wet(device);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDiffuse, 1.0f);
    Stereo wide = run(device, in);
    const double apart = correlation(wide.left, wide.right, 48000, wide.left.size());
    char label[160];
    std::snprintf(label, sizeof label, "Width 1, all scattered: the sides are unrelated (correlation %.3f)", apart);
    EXPECT(std::fabs(apart) < 0.2, label);
    wet(device);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kDiffuse, 0.0f);
    Stereo pure = run(device, chord(20.0f));
    const double drift = correlation(pure.left, pure.right, 2 * 48000, pure.left.size());
    std::snprintf(label, sizeof label, "Width 1, pure: the sides still drift apart (correlation %.3f over 18 s)", drift);
    EXPECT(drift < 0.8, label);
    const double level = db(rms(pure.right, 2 * 48000, pure.right.size()) / rms(pure.left, 2 * 48000, pure.left.size()));
    EXPECT(std::fabs(level) < 0.5, "Width leaves the two sides equally loud");
  }

  // Tone is a shelf at 1 kHz on the cloud that only takes away: at -1 the
  // highs are 12 dB down and the lows stay, at 1 the lows are 12 dB down
  // and the highs stay, and the middle is flat.
  {
    std::vector<float> two = sine(200.0f, 6.0f, kRate, 0.15f);
    const std::vector<float> high = sine(5000.0f, 6.0f, kRate, 0.15f);
    for (size_t i = 0; i < two.size(); ++i) two[i] += high[i];
    double low_db[3], high_db[3];
    int i = 0;
    for (float tone : {-1.0f, 0.0f, 1.0f}) {
      wet(device);
      device.set_param(p::kDiffuse, 0.0f);
      device.set_param(p::kWindow, 1.0f);
      device.set_param(p::kTone, tone);
      Stereo out = run(device, two);
      low_db[i] = db(tone_level(out.left, 200.0, kRate, 2 * 48000, 3 * 48000) / 0.15);
      high_db[i] = db(tone_level(out.left, 5000.0, kRate, 2 * 48000, 3 * 48000) / 0.15);
      ++i;
    }
    char label[200];
    std::snprintf(label, sizeof label, "Tone at -1, 0 and 1: 5 kHz comes out at %+.1f, %+.1f and %+.1f dB, 200 Hz at %+.1f, %+.1f and %+.1f dB",
                  high_db[0], high_db[1], high_db[2], low_db[0], low_db[1], low_db[2]);
    EXPECT(std::fabs(high_db[0] - high_db[1] + 12.0) < 1.5 && std::fabs(high_db[2] - high_db[1]) < 1.5 &&
               std::fabs(low_db[0] - low_db[1]) < 1.5 && std::fabs(low_db[2] - low_db[1] + 12.0) < 1.5 &&
               std::fabs(high_db[1]) < 2.0 && std::fabs(low_db[1]) < 2.0,
           label);
  }

  // Level. A full-scale chord held for a minute, at the defaults and with
  // every control at each end: the output never peaks more than 6 dB over
  // the input and is no louder in the second half minute than in the first.
  {
    const std::vector<float> held = chord(60.0f);
    const double in_peak = peak(held);
    for (int id = -1; id < p::kNumParams; ++id) {
      for (int end = 0; end < (id < 0 ? 1 : 2); ++end) {
        device.init(kRate);
        if (id >= 0) device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        Stereo out = run(device, held);
        const double top = std::max(peak(out.left), peak(out.right));
        const double early = rms(out.left, 5 * 48000, 30 * 48000);
        const double late = rms(out.left, 30 * 48000, 60 * 48000);
        char label[200];
        std::snprintf(label, sizeof label, "a held full-scale chord, param %d at its %s: peak %+.2f dB over the input, level %+.2f dB of it, %+.2f dB from the first half minute to the second",
                      id, id < 0 ? "default" : end == 0 ? "minimum" : "maximum", db(top / in_peak), db(late / rms(held)), db(late / early));
        EXPECT(finite(out.left) && top < 2.0 * in_peak && db(late / early) < 1.0 && db(late / rms(held)) < 3.0 &&
                   db(late / rms(held)) > -4.0,
               label);
      }
    }
  }

  // Part-way Mix. The cloud is late and scattered, not a copy of the dry
  // note in step with it. At the defaults (all scattered) held tones over
  // the piano's range keep their level second by second: what moves it is
  // only the cloud's own shimmer. With Diffuse at 0 the cloud is the
  // pure note itself, and against the same note in the dry signal it adds
  // and cancels by turns as the two wander apart (a slow breathing, by
  // kWalk): over half a minute the level is the input's, and no note stays
  // cancelled.
  {
    double worst = 0.0, best = -100.0, worst_hz = 0.0;
    for (int k = 0; k < 30; ++k) {
      const float hz = 27.5f * std::pow(2.0f, static_cast<float>(k) / 4.0f);
      device.init(kRate);
      const std::vector<float> tone = sine(hz, 14.0f, kRate, 0.5f);
      Stereo out = run(device, tone);
      for (size_t second = 2; second < 14; ++second) {
        const double level = db(rms(out.left, second * 48000, (second + 1) * 48000) / rms(tone));
        if (level < worst) {
          worst = level;
          worst_hz = hz;
        }
        best = std::max(best, level);
      }
    }
    char label[200];
    std::snprintf(label, sizeof label, "Mix 0.5 at the defaults: held tones from 27.5 Hz to 4.2 kHz stay between %+.2f dB (at %.1f Hz) and %+.2f dB of the input, second by second",
                  worst, worst_hz, best);
    EXPECT(worst > -4.0 && best < 3.0, label);
    for (float hz : {27.5f, 440.0f, 1760.0f, 4186.0f}) {
      device.init(kRate);
      device.set_param(p::kDiffuse, 0.0f);
      const std::vector<float> tone = sine(hz, 40.0f, kRate, 0.5f);
      Stereo out = run(device, tone);
      const double level = db(rms(out.left, 2 * 48000, out.left.size()) / rms(tone));
      int low_seconds = 0, longest = 0, run_of_low = 0;
      for (size_t second = 2; second < 40; ++second) {
        const bool low = rms(out.left, second * 48000, (second + 1) * 48000) < 0.5 * rms(tone);
        low_seconds += low ? 1 : 0;
        run_of_low = low ? run_of_low + 1 : 0;
        longest = std::max(longest, run_of_low);
      }
      std::snprintf(label, sizeof label, "Mix 0.5, Diffuse 0: a held %.1f Hz is %+.2f dB of the input over 38 s; %d of its seconds are 6 dB down or more, %d in a row at most",
                    hz, level, low_seconds, longest);
      EXPECT(level > -2.0 && level < 2.5 && low_seconds <= 19, label);
    }
  }

  // Bad input: samples that are not numbers, infinite or absurd do not get
  // into the memory, and the cloud is itself again when good input returns.
  {
    wet(device);
    device.set_param(p::kStretch, 2.0f);
    device.set_param(p::kMemory, 1.0f);
    device.set_param(p::kCatchUp, 0.05f);
    std::vector<float> bad = sine(440.0f, 0.6f, kRate, 0.5f);
    for (size_t i = 4800; i < 9600; ++i) bad[i] = std::nanf("");
    for (size_t i = 9600; i < 14400; ++i) bad[i] = (i & 1) ? INFINITY : -INFINITY;
    for (size_t i = 14400; i < 19200; ++i) bad[i] = (i & 1) ? 1.0e30f : -1.0e30f;
    run(device, bad);
    Stereo good = run(device, sine(440.0f, 6.0f, kRate, 0.5f));
    const size_t n = good.left.size();
    const double level = db(rms(good.left, n - 2 * 48000, n) / 0.35355);
    char label[160];
    std::snprintf(label, sizeof label, "after NaN, infinite and 1e30 input the cloud is the note again (%+.2f dB, peak %.2f)", level,
                  peak(good.left, 48000, n));
    EXPECT(finite(good.left) && finite(good.right) && std::fabs(level) < 1.0 && peak(good.left, 3 * 48000, n) < 1.5, label);
  }

  // Every preset: the held full-scale chord for a minute stays within 6 dB
  // of the input's peak and near its level, and held tones over the piano's
  // range keep their level over a quarter of a minute.
  {
    const std::vector<float> held = chord(60.0f);
    for (const Preset& preset : kPresets) {
      load(device, preset);
      Stereo out = run(device, held);
      const double top = std::max(peak(out.left), peak(out.right));
      const double early = rms(out.left, 5 * 48000, 30 * 48000);
      const double late = rms(out.left, 30 * 48000, 60 * 48000);
      double worst = 0.0, best = -100.0, worst_hz = 0.0;
      for (int k = 0; k < 8; ++k) {
        const float hz = 27.5f * std::pow(2.0f, static_cast<float>(k)) * (k & 1 ? 1.26f : 1.0f);
        load(device, preset);
        const std::vector<float> tone = sine(hz, 16.0f, kRate, 0.5f);
        Stereo sung = run(device, tone);
        const double level = db(rms(sung.left, 4 * 48000, sung.left.size()) / rms(tone));
        if (level < worst) {
          worst = level;
          worst_hz = hz;
        }
        best = std::max(best, level);
      }
      // The least a held tone can come out at: the dry part, and the cloud
      // with all that Tone can take from it.
      float tone = 0.0f, mix = p::kParamDefault[p::kMix];
      for (int i = 0; preset.set[i].id >= 0; ++i) {
        if (preset.set[i].id == p::kTone) tone = preset.set[i].value;
        if (preset.set[i].id == p::kMix) mix = preset.set[i].value;
      }
      const double taken = std::pow(10.0, -12.0 * std::fabs(tone) / 20.0);
      const double least = db(std::sqrt(std::pow(std::cos(0.5 * kPi * mix), 2.0) + std::pow(std::sin(0.5 * kPi * mix) * taken, 2.0)));
      char label[240];
      std::snprintf(label, sizeof label, "preset \"%s\": chord peak %+.2f dB over the input, level %+.2f dB of it, %+.2f dB between half minutes; held tones %+.2f dB (at %.0f Hz) to %+.2f dB",
                    preset.name, db(top / peak(held)), db(late / rms(held)), db(late / early), worst, worst_hz, best);
      EXPECT(finite(out.left) && top < 2.0 * peak(held) && std::fabs(db(late / early)) < 1.5 && db(late / rms(held)) < 3.0 &&
                 db(late / rms(held)) > -4.0 && worst > least - 1.5 && best < 3.0,
             label);
    }
  }

  // Rest after every move: with each control at each end, a second of
  // sound and then silence, the device has finished and sleeps within the
  // time the reader needs (Memory / (1 - 1/Stretch), Catch Up and the
  // frames in flight).
  {
    rng_state() = 0x4E57u;
    const std::vector<float> burst = noise(1.0f, kRate, 0.3f);
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        run(device, burst);
        render(device, 27.0f, kRate);
        Stereo rest = render(device, 1.0f, kRate);
        char label[160];
        std::snprintf(label, sizeof label, "param %d at its %s: at rest 27 s after the playing stops (peak %g, clock %g)", id,
                      end == 0 ? "minimum" : "maximum", peak(rest.left), static_cast<double>(device.meter(3)));
        EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0 && device.meter(3) == -1.0f, label);
      }
    }
  }

  // Block size and silence. The reader runs by the sample clock: a phrase,
  // a silence long enough for the device to finish and sleep, knobs moved
  // in the sleep and a second phrase come out the same at block sizes 1,
  // 128 and 2048.
  {
    rng_state() = 0xB10Cu;
    const std::vector<float> first = join(noise(0.5f, kRate, 0.3f), silence(6.0f, kRate));
    const std::vector<float> second = join(sine(330.0f, 1.0f, kRate, 0.4f), silence(2.0f, kRate));
    Stereo reference;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kStretch, 4.0f);
      device.set_param(p::kMemory, 1.5f);
      device.set_param(p::kCatchUp, 0.3f);
      Stereo a = run(device, first, block);
      device.set_param(p::kWindow, 1.0f);
      device.set_param(p::kMix, 0.8f);
      device.set_param(p::kStretch, 3.0f);
      Stereo b = run(device, second, block);
      Stereo out = concat(a, b);
      if (block == 128) {
        reference = out;
        const size_t n = a.left.size();
        EXPECT(peak(a.left, n - 48000, n) == 0.0 && rms(a.left, 0, 48000) > 0.05, "the phrase is over and the device asleep before the knobs move");
        EXPECT(rms(b.left, 24000, 72000) > 0.05, "the second phrase sounds");
        continue;
      }
      double worst = 0.0;
      for (size_t i = 0; i < out.left.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - reference.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - reference.right[i]));
      }
      char label[160];
      std::snprintf(label, sizeof label, "the same at a block size of %d as at 128, across a sleep and a change of Window (max diff %g)", block, worst);
      EXPECT(worst < 1.0e-5, label);
    }
  }

  // Rest. When the playing stops the reader reads on to the end of what it
  // has, runs up to the present and the device sleeps: exact silence. A
  // knob moved in the sleep is where it is on waking (no glide), and a new
  // note is in the cloud within two windows.
  {
    device.init(kRate);
    device.set_param(p::kStretch, 8.0f);
    device.set_param(p::kMemory, 2.0f);
    device.set_param(p::kCatchUp, 0.5f);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(220.0f, 3.0f, kRate, 0.5f));
    Stereo tail = render(device, 6.0f, kRate);
    EXPECT(rms(tail.left, 0, 48000) > 0.1, "the cloud goes on after the playing stops");
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0 && device.meter(3) == -1.0f, "asleep once the reader has nothing left");
    EXPECT(device.meter(1) == 0.0f, "asleep, the reader waits at the write head");
    device.set_param(p::kMix, 0.0f);
    const std::vector<float> note = sine(220.0f, 1.0f, kRate, 0.5f);
    Stereo dry = run(device, note);
    bool same = true;
    for (size_t i = 0; i < note.size(); ++i) same = same && dry.left[i] == note[i];
    EXPECT(same, "Mix moved to 0 in the sleep is 0 on waking: the first samples are the input");
    render(device, 8.0f, kRate);
    device.set_param(p::kMix, 1.0f);
    Stereo woken = run(device, note);
    const size_t two_windows = 2 * 8192 + 3072;
    char label[160];
    std::snprintf(label, sizeof label, "a new note is in the cloud two windows on (%.1f dB of it)", db(rms(woken.left, two_windows, two_windows + 9600) / 0.35355));
    EXPECT(rms(woken.left, two_windows, two_windows + 9600) > 0.3 * 0.35355, label);
  }

  // Clicks. Mix, Window and Freeze moved while a note sounds: the largest
  // step between two samples is no larger than without the move.
  {
    const std::vector<float> note = sine(220.0f, 3.0f, kRate, 0.5f);
    auto start = [&]() {
      device.init(kRate);
      device.set_param(p::kMix, 0.7f);
      run(device, note);
    };
    start();
    const double plain = max_step(run(device, note).left);
    start();
    device.set_param(p::kMix, 0.1f);
    Stereo down = run(device, note);
    device.set_param(p::kMix, 1.0f);
    Stereo up = run(device, note);
    char label[160];
    std::snprintf(label, sizeof label, "Mix moved while sounding: steps %.4f and %.4f against %.4f unmoved", max_step(down.left), max_step(up.left), plain);
    EXPECT(max_step(down.left) < plain * 1.2 && max_step(up.left) < plain * 1.5, label);
    for (int window = 0; window < 4; ++window) {
      if (window == 2) continue;
      start();
      device.set_param(p::kWindow, static_cast<float>(window));
      Stereo changed = run(device, note);
      // The reference is the new Window from the start, unmoved.
      device.init(kRate);
      device.set_param(p::kMix, 0.7f);
      device.set_param(p::kWindow, static_cast<float>(window));
      run(device, note);
      const double unmoved = std::max(plain, max_step(run(device, note).left));
      std::snprintf(label, sizeof label, "Window changed to %d while sounding: step %.4f against %.4f unmoved, level %+.2f dB of the note over the change",
                    window, max_step(changed.left), unmoved, db(rms(changed.left, 0, 48000) / 0.35355));
      EXPECT(max_step(changed.left) < unmoved * 1.3 && rms(changed.left, 0, 24000) > 0.2, label);
    }
    start();
    device.set_param(p::kFreeze, 1.0f);
    Stereo frozen = run(device, note);
    device.set_param(p::kFreeze, 0.0f);
    Stereo thawed = run(device, note);
    std::snprintf(label, sizeof label, "Freeze on and off while sounding: steps %.4f and %.4f against %.4f unmoved", max_step(frozen.left), max_step(thawed.left), plain);
    EXPECT(max_step(frozen.left) < plain * 1.3 && max_step(thawed.left) < plain * 1.3, label);
  }

  // At 96 kHz the frames are half as long in time and the pitch holds.
  {
    wet(device, 96000.0f);
    device.set_param(p::kDiffuse, 0.0f);
    Stereo out = run(device, sine(440.0f, 6.0f, 96000.0f, 0.5f));
    const double hz = dominant_frequency(out.left, 96000.0, 400.0, 480.0, 2 * 96000, 6 * 96000);
    char label[160];
    std::snprintf(label, sizeof label, "at 96 kHz a sine holds its pitch (%.3f Hz, %+.2f ct) and level (%+.2f dB)", hz, cents(hz, 440.0),
                  db(rms(out.left, 2 * 96000, 6 * 96000) / 0.35355));
    EXPECT(std::fabs(cents(hz, 440.0)) < 2.0 && std::fabs(db(rms(out.left, 2 * 96000, 6 * 96000) / 0.35355)) < 1.0, label);
    device.init(kRate);
  }

  // Cost: the average at the defaults and at the longest Window, and the
  // worst single block (one with a reading or a frame in it).
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  for (int window : {2, 0, 3}) {
    device.init(kRate);
    device.set_param(p::kWindow, static_cast<float>(window));
    char label[64];
    std::snprintf(label, sizeof label, window == 2 ? "stretch" : "stretch, window %d", window);
    report_cost(label, 10.0f, kRate, [&] { run(device, input); });
    device.init(kRate);
    device.set_param(p::kWindow, static_cast<float>(window));
    std::vector<double> micros;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      const auto begin = std::chrono::steady_clock::now();
      device.process(128);
      micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - begin).count());
    }
    std::sort(micros.begin(), micros.end());
    std::printf("stretch, window %d, worst block: %.0f us at the 99th percentile, %.0f us maximum, of %.0f us per block\n", window,
                micros[micros.size() * 99 / 100], micros.back(), 128.0e6 / kRate);
  }

  return finish("stretch");
}
