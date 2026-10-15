// The bench: the sounds a lesson can put through its lab.
//
// Every loop here is played by the engine's own instruments, and every test
// signal comes from the kit's oscillators, so the sources are the engine too.
// The bench is a lab like any other: each source is a tap, and the page
// renders it once for the loop's length and keeps the taps.
//
//   drums    a two-bar pattern on the Drum Kit (cpp/devices/drum-kit)
//   guitar   a picked line on the Guitar (cpp/devices/guitar)
//   chords   the same guitar, strummed and left to ring
//   sine     440 Hz, 12 dB under full scale (kit::SineOsc)
//   saw      110 Hz, band-limited (kit::BlepOsc)
//   noise    white noise (kit::Noise)
//   clicks   one unit sample at the start of each half bar
//   sweep    a sine rising from 20 Hz to 20 kHz, an octave in equal time
//
// The tempo is 120: a bar is two seconds, so a four-second loop is two bars.

#include "lab.h"

#include "../../cpp/devices/drum-kit/drum_kit.h"
#include "../../cpp/devices/guitar/guitar.h"

using namespace livemix;

namespace {

DrumKit drums_device;
Guitar guitar_device;

lab::Tap drums{"drums", "Drums", lab::kAudio, lab::kSource, 2};
lab::Tap guitar_tap{"guitar", "Guitar", lab::kAudio, lab::kSource, 2};
lab::Tap chords{"chords", "Guitar chords", lab::kAudio, lab::kSource, 2};
lab::Tap sine{"sine", "Sine, 440 Hz", lab::kAudio, lab::kSource, 2};
lab::Tap saw{"saw", "Saw, 110 Hz", lab::kAudio, lab::kSource, 2};
lab::Tap noise{"noise", "White noise", lab::kAudio, lab::kSource, 2};
lab::Tap clicks{"clicks", "Clicks", lab::kAudio, lab::kSource, 2};
lab::Tap sweep{"sweep", "Sine sweep", lab::kAudio, lab::kSource, 2};

constexpr int kStep = 6000;  // a sixteenth at 120, in samples
constexpr int kBar = 16 * kStep;
constexpr int kBlock = 16;

// MIDI 60 to 71 is the octave the kit is written in: the key picks the drum.
float key_hz(int key) { return kit::midi_to_hz(60.0f + static_cast<float>(key)); }

struct Hit {
  int step;  // sixteenths from the start of the two bars
  int key;   // DrumKit::Drum
  float gain;
};

constexpr Hit kPattern[] = {
    {0, DrumKit::kKick, 0.9f},       {0, DrumKit::kClosedHat, 0.5f},  {2, DrumKit::kClosedHat, 0.35f},
    {4, DrumKit::kSnare, 0.8f},      {4, DrumKit::kClosedHat, 0.5f},  {6, DrumKit::kClosedHat, 0.35f},
    {7, DrumKit::kKick, 0.6f},       {8, DrumKit::kKick, 0.85f},      {8, DrumKit::kClosedHat, 0.5f},
    {10, DrumKit::kClosedHat, 0.35f}, {12, DrumKit::kSnare, 0.8f},     {12, DrumKit::kClosedHat, 0.5f},
    {14, DrumKit::kOpenHat, 0.45f},  {16, DrumKit::kKick, 0.9f},      {16, DrumKit::kClosedHat, 0.5f},
    {18, DrumKit::kClosedHat, 0.35f}, {20, DrumKit::kSnare, 0.8f},     {20, DrumKit::kClosedHat, 0.5f},
    {22, DrumKit::kClosedHat, 0.35f}, {23, DrumKit::kKick, 0.55f},     {24, DrumKit::kKick, 0.85f},
    {24, DrumKit::kClosedHat, 0.5f}, {26, DrumKit::kKick, 0.6f},      {26, DrumKit::kClosedHat, 0.35f},
    {28, DrumKit::kClap, 0.75f},     {28, DrumKit::kClosedHat, 0.5f}, {30, DrumKit::kLowTom, 0.6f},
    {31, DrumKit::kHighTom, 0.55f},
};

// A minor, F, C, G: one chord a bar, picked low to high in eighths.
constexpr float kLine[4][8] = {
    {110.00f, 164.81f, 220.00f, 261.63f, 329.63f, 261.63f, 220.00f, 164.81f},
    {87.31f, 130.81f, 174.61f, 220.00f, 261.63f, 220.00f, 174.61f, 130.81f},
    {130.81f, 164.81f, 196.00f, 261.63f, 329.63f, 261.63f, 196.00f, 164.81f},
    {98.00f, 146.83f, 196.00f, 246.94f, 293.66f, 246.94f, 196.00f, 146.83f},
};
constexpr float kChord[4][4] = {
    {110.00f, 164.81f, 220.00f, 261.63f},
    {87.31f, 174.61f, 220.00f, 261.63f},
    {130.81f, 164.81f, 196.00f, 261.63f},
    {98.00f, 146.83f, 196.00f, 246.94f},
};

void render_drums() {
  using namespace drum_kit;
  drums_device.init(lab::kSampleRate);
  drums_device.set_param(kKit, 2.0f);        // Tight: short, clear hits
  drums_device.set_param(kVariation, 0.0f);  // every bar the same, sample for sample
  drums_device.set_param(kVolume, 5.0f);
  const int total = lab::total();
  for (int i = 0; i < total; i += kBlock) {
    const int at = i % lab::frames();
    if (at % kStep == 0) {
      const int step = (at / kStep) % 32;
      for (const Hit& hit : kPattern) {
        if (hit.step == step) drums_device.note_on(step, key_hz(hit.key), hit.gain);
      }
    }
    drums_device.process(kBlock);
    for (int j = 0; j < kBlock; ++j) drums.put(i + j, drums_device.out_left()[j], drums_device.out_right()[j]);
  }
}

void render_guitar(bool strummed) {
  using namespace guitar;
  lab::Tap& tap = strummed ? chords : guitar_tap;
  guitar_device.init(lab::kSampleRate);
  guitar_device.set_variation(0.0f);
  guitar_device.set_param(kStrum, strummed ? 18.0f : 0.0f);
  guitar_device.set_param(kSustain, strummed ? 6.0f : 3.0f);
  guitar_device.set_param(kVolume, strummed ? 3.0f : 6.0f);
  const int total = lab::total();
  const int eighth = 2 * kStep;
  for (int i = 0; i < total; i += kBlock) {
    const int at = i % lab::frames();
    const int bar = (at / kBar) % 4;
    if (strummed) {
      if (at % kBar == 0) {
        for (int n = 0; n < 4; ++n) guitar_device.note_off(n);
        for (int n = 0; n < 4; ++n) guitar_device.note_on(n, kChord[bar][n], 0.7f);
      }
    } else if (at % eighth == 0) {
      const int step = (at % kBar) / eighth;
      guitar_device.note_off(0);
      guitar_device.note_on(0, kLine[bar][step], step == 0 ? 0.8f : 0.6f);
    }
    guitar_device.process(kBlock);
    for (int j = 0; j < kBlock; ++j) tap.put(i + j, guitar_device.out_left()[j], guitar_device.out_right()[j]);
  }
}

void render_signals(int frames) {
  if (!sine.open(frames) || !saw.open(frames) || !noise.open(frames) || !clicks.open(frames) ||
      !sweep.open(frames)) {
    return;
  }
  kit::SineOsc sine_osc;
  kit::BlepOsc saw_osc;
  kit::Noise noise_source;
  noise_source.seed(0x2545F491u);
  const float sine_step = 440.0f / lab::kSampleRate;
  const float saw_step = 110.0f / lab::kSampleRate;
  const float level = kit::db_to_gain(-12.0f);

  // The sweep: phase is the integral of a frequency that doubles in equal times.
  const double octaves = std::log2(20000.0 / 20.0);
  const double duration = static_cast<double>(frames) / lab::kSampleRate;
  const int edge = 480;  // 10 ms in and out, so the wrap from 20 kHz back to 20 Hz is silent
  for (int i = 0; i < frames; ++i) {
    // Both run a whole number of cycles a second. Seated again each second, the
    // small errors of adding a step 48,000 times do not pile up into a step at the wrap.
    if (i % 48000 == 0) {
      sine_osc.reset();
      saw_osc.reset();
    }
    sine.set(i, level * sine_osc.next(sine_step));
    saw.set(i, level * saw_osc.saw(saw_step));
    const float n = 0.25f * noise_source.white();
    noise.set(i, n, 0.25f * noise_source.white());
    (void)n;
    clicks.set(i, i % kBar == 0 || i % kBar == kBar / 2 ? 1.0f : 0.0f);
    const double t = static_cast<double>(i) / lab::kSampleRate;
    const double phase = 20.0 * duration / (octaves * std::log(2.0)) * (std::exp2(octaves * t / duration) - 1.0);
    float fade = 1.0f;
    if (i < edge) fade = static_cast<float>(i) / edge;
    if (i >= frames - edge) fade = static_cast<float>(frames - 1 - i) / edge;
    sweep.set(i, level * fade * static_cast<float>(std::sin(2.0 * 3.14159265358979323846 * phase)));
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  render_drums();
  render_guitar(false);
  render_guitar(true);
  render_signals(frames);
}
