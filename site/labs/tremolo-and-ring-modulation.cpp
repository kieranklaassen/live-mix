// Tremolo and ring modulation: the Tremolo (cpp/devices/tremolo) and the Ring
// (cpp/devices/ring), each run one sample at a time on the same loop. Both do
// one thing to the sound: they multiply it by a wave.
//
//   in ──┬──► × (1 − depth·(1 − m)/2) ──► tremolo      m: a slow wave, −1 to 1
//        │
//        └──► × carrier ──► low cut ──► tone ──► mix with in ──► ring
//
// Read from the Tremolo: where its oscillator is in its cycle and the
// modulator each side hears (its own meters), the low band its Harmonic mode
// splits off, and its output. The shape before the slew and the gain on each
// side are locals of its loop and are not kept, so the lab works them out
// again ("lesson"): the shape from the device's own function at the device's
// own phase, through a slew with the device's coefficient, into the four
// modes as the device writes them. How far that lands from the output the
// device wrote is the "tremoloRebuilt" check. One sound more is the lesson's
// own: the tremolo with the shape used as it is, the slew left out
// ("unslewed"), to hear what the slew is for.
//
// Read from the Ring: its carrier's frequency (its own meter), the ringing
// sound after its two filters (the state of the second of them), and its
// output. The carrier's value and the product are locals too, so the lab
// works them out again from the device's phases, weights, tables and gains,
// puts the product through two kit filters with the device's coefficients,
// mixes as the device mixes, and reports how far that lands from the output
// the device wrote (the "ringRebuilt" check). The Ring's carrier is held on
// Free here, so it is set in hertz by Frequency and not by a note.
//
// Three small pictures are 20 ms of the loop, taken where the input is at its
// largest: the input, the carrier, and the two multiplied.
//
// One more sound is not the loop. A steady tone of the lab's own goes through
// a second Ring while that Ring's Frequency climbs from 1 Hz to 660 Hz and
// then holds: "sweep" is what comes out, and "fan" is its spectrum over time.
// It answers to Wave and Ring Mix and to nothing else.
//
// The build part puts the two together a piece at a time, on a path of its
// own (lab::Build in lab.h): a wire; a slow wave to multiply by; depth and
// shape; a phase between the ears; the wave at audio rate; the offset taken
// away. Two copies of it run: one at the step the reader chose, which is what
// the "built" taps show, and one held at the fourth step, which is the
// engine's tremolo. That one is compared on every render with a third
// Tremolo, held in Tremolo mode with no drift and nothing of the dry sound
// beside it, which is all the build builds. The last two steps are the
// lesson's own: no device of the engine runs the tremolo's law at audio rate.

#include "lab.h"

#include "../../cpp/devices/ring/ring.h"
#include "../../cpp/devices/tremolo/tremolo.h"

using namespace livemix;

namespace {

Tremolo trem;
Tremolo trem_plain;  // a second Tremolo, held to what the build builds
Ring ring_device;
Ring probe;  // a second Ring, for the sweep

// The Tremolo's nine parameters, by the device's own ids.
lab::Control mode{"mode", "Mode", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Tremolo|Pan|Harmonic|Vibrato"};
lab::Control rate{"rate", "Rate", "Hz", 0.05f, 20.0f, 4.5f, lab::kLog};
lab::Control depth{"depth", "Depth", "", 0.0f, 1.0f, 1.0f};
lab::Control shape{"shape", "Shape", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Sine|Triangle|Square|Random"};
lab::Control stereo_phase{"phase", "Stereo Phase", "deg", 0.0f, 180.0f, 0.0f};
lab::Control crossover{"crossover", "Crossover", "Hz", 100.0f, 4000.0f, 700.0f, lab::kLog};
lab::Control drift{"drift", "Tremolo Drift", "", 0.0f, 1.0f, 0.0f};
lab::Control smooth{"smooth", "Smooth", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Tremolo Mix", "", 0.0f, 1.0f, 1.0f};

// Eight of the Ring's twelve. Root, Octave, Fine and Tune are left out: the
// carrier is set in hertz.
lab::Control frequency{"frequency", "Frequency", "Hz", 0.5f, 4000.0f, 100.0f, lab::kLog};
lab::Control wave{"wave", "Wave", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Sine|Triangle|Soft square|Diode"};
lab::Control second{"second", "Second", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Off|Fifth|Octave|Octave below"};
lab::Control ring_drift{"ringDrift", "Ring Drift", "", 0.0f, 1.0f, 0.0f};
lab::Control low_cut{"lowCut", "Low Cut", "Hz", 20.0f, 2000.0f, 20.0f, lab::kLog};
lab::Control tone{"tone", "Tone", "Hz", 300.0f, 16000.0f, 16000.0f, lab::kLog};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 0.0f};
lab::Control ring_mix{"ringMix", "Ring Mix", "", 0.0f, 1.0f, 0.5f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap carrier_hz{"carrierHz", "The carrier's frequency", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap product{"product", "Input times carrier", lab::kAudio, lab::kLesson, 2};
lab::Tap wet_tap{"wet", "The ringing sound, filtered", lab::kAudio, lab::kDevice, 2};
lab::Tap ring_out{"ring", "Ring", lab::kAudio, lab::kDevice, 2};
lab::Tap zoom_in{"zoomIn", "The input, close up", lab::kCurve, lab::kSource, 1};
lab::Tap zoom_carrier{"zoomCarrier", "The carrier, close up", lab::kCurve, lab::kLesson, 1};
lab::Tap zoom_product{"zoomProduct", "Input times carrier, close up", lab::kCurve, lab::kLesson, 1};
lab::Tap sweep{"sweep", "A steady tone, its modulator speeding up", lab::kAudio, lab::kDevice, 1};
lab::Tap fan{"fan", "The tone's spectrum as its modulator speeds up", lab::kFrames, lab::kDevice, 1, "dB"};
// The page opens on the last sound declared here, so the Ring's taps and the
// sweep come first and the Tremolo's last: the page opens on the Tremolo.
lab::Tap phase_tap{"lfoPhase", "Where the oscillator is in its cycle", lab::kControl, lab::kDevice, 1, "cycles"};
lab::Tap raw_tap{"raw", "The shape, before the slew", lab::kControl, lab::kLesson, 1};
lab::Tap unslewed{"unslewed", "The tremolo with the slew left out", lab::kAudio, lab::kLesson, 2};
lab::Tap lfo{"lfo", "The modulator, left", lab::kControl, lab::kDevice, 1};
lab::Tap lfo_right{"lfoRight", "The modulator, right", lab::kControl, lab::kDevice, 1};
lab::Tap gain_tap{"gain", "The gain, left", lab::kControl, lab::kLesson, 1};
lab::Tap gain_right{"gainRight", "The gain, right", lab::kControl, lab::kLesson, 1};
lab::Tap gain_high{"gainHigh", "The gain Harmonic puts on the highs", lab::kControl, lab::kLesson, 1};
lab::Tap lows{"lows", "The low band", lab::kAudio, lab::kDevice, 2};
lab::Tap tremolo_out{"tremolo", "Tremolo", lab::kAudio, lab::kDevice, 2};

lab::Check tremolo_rebuilt{"tremoloRebuilt",
                           "The shape, the slew and the four modes worked out again, against the Tremolo's own output",
                           "dB"};
lab::Check ring_rebuilt{"ringRebuilt",
                        "The carrier, the product, the filters and the mix worked out again, against the Ring's own output",
                        "dB"};

lab::Tap built{"built", "The sound so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_gain{"builtGain", "The gain so far, left", lab::kControl, lab::kLesson, 1};
lab::Tap built_gain_right{"builtGainRight", "The gain so far, right", lab::kControl, lab::kLesson, 1};

constexpr float kSqrt2 = 1.41421356f;

// The build: one function a piece, and run() to take a sample through the
// pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kWire = 0, kSlow, kDepthShape, kEars, kFast, kNoOffset };

  int pieces = kWire;
  double phase = 0.0;  // where the wave is in its cycle, 0 to 1
  double step = 0.0;   // how far it moves each sample
  kit::Rng rng;
  float walk[3] = {0.0f, 0.0f, 0.0f};  // Random: where it was, where it is going, where it goes next
  float slew_a[2] = {0.0f, 0.0f};
  float slew_b[2] = {0.0f, 0.0f};
  float slew_coeff = 0.0f;
  bool started = false;
  float gain[2] = {1.0f, 1.0f};  // what each side is multiplied by
  float out[2] = {0.0f, 0.0f};

  // A wire: what goes in comes out, times one number a side, and the number
  // is 1. Every piece after this one is a way of moving that number.
  void wire(float left, float right) {
    out[0] = left * gain[0];
    out[1] = right * gain[1];
  }

  // A slow wave: the phase goes from 0 to 1 once a cycle, and the sine of it
  // swings from -1 to 1. Halved and lifted by a half it runs from 0 to 1,
  // which is a gain: silence at the bottom, the sound as it was at the top.
  float slow(float at) const { return 0.5f + 0.5f * kit::SineTable::lookup(at); }

  // The phase moves on by frequency / sample rate each sample, and starts
  // again at 1. Random takes a new level to glide to each time it does.
  void turn() {
    phase += step;
    if (phase >= 1.0) {
      phase -= 1.0;
      walk[0] = walk[1];
      walk[1] = walk[2];
      walk[2] = rng.bipolar();
    }
  }

  // Shape: the wave at `at` cycles, -1 to 1. Sine, Triangle and Square all
  // rise through zero at 0; Random glides from one level to the next.
  float shaped(float at) const {
    const bool next_cycle = at >= 1.0f;
    if (next_cycle) at -= 1.0f;
    switch (shape.choice()) {
      case 1:
        return at < 0.25f ? 4.0f * at : (at < 0.75f ? 2.0f - 4.0f * at : 4.0f * at - 4.0f);
      case 2:
        return at < 0.5f ? 1.0f : -1.0f;
      case 3: {
        const float from = walk[next_cycle ? 1 : 0];
        const float to = walk[next_cycle ? 2 : 1];
        return from + (to - from) * (0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * at));
      }
      default:
        return kit::SineTable::lookup(at);
    }
  }

  // The slew: two one-pole smoothers, one after the other. A square jumps
  // from 1 to -1 in one sample, and a gain that jumps is a click. After the
  // slew it takes a few milliseconds to get there, and longer with Smooth.
  float slewed(int side, float raw) {
    slew_a[side] = raw + (slew_a[side] - raw) * slew_coeff;
    slew_b[side] = slew_a[side] + (slew_b[side] - slew_a[side]) * slew_coeff;
    return slew_b[side];
  }

  // Depth: how far the gain falls at the bottom of the wave. At the top of
  // the wave, m = 1, the gain is 1 whatever the depth: this only turns down.
  float dipped(float m) const {
    const float half = 0.5f * depth.value;
    return 1.0f - half * (1.0f - m);
  }

  // No offset: the gain is the wave alone, so it spends half its time below
  // zero. The square root of two makes up the power the offset carried.
  float ringing(float m) const { return kSqrt2 * m; }

  // One sample through the pieces built so far.
  void run(float left, float right) {
    if (pieces >= kSlow) {
      const float at = static_cast<float>(phase);
      // A phase between the ears: the right side reads the wave further on.
      const float ahead = pieces >= kEars ? stereo_phase.value * (1.0f / 360.0f) : 0.0f;
      const float where[2] = {at, at + ahead};
      if (pieces >= kFast) {
        // Audio rate: the same sine, turning at Frequency, with no slew.
        for (int side = 0; side < 2; ++side) {
          const float m = kit::SineTable::lookup(where[side]);
          gain[side] = pieces >= kNoOffset ? ringing(m) : dipped(m);
        }
      } else if (pieces >= kDepthShape) {
        const float raw[2] = {shaped(where[0]), shaped(where[1])};
        if (!started) {
          for (int side = 0; side < 2; ++side) slew_a[side] = slew_b[side] = raw[side];
          started = true;
        }
        for (int side = 0; side < 2; ++side) gain[side] = dipped(slewed(side, raw[side]));
      } else {
        gain[0] = gain[1] = slow(at);
      }
      turn();
    }
    wire(left, right);
  }

  void start(int pieces_) {
    pieces = pieces_;
    phase = 0.0;
    // The wave's speed: Rate, as the Tremolo holds it, until the wave is let
    // up to audio rate; from then on, Frequency.
    const float hz = pieces >= kFast ? frequency.value : rate.value;
    step = static_cast<double>(hz) / lab::kSampleRate;
    // The seed the Tremolo gives its own Random, so the two glide alike.
    rng.seed(0x7E3A11C5u);
    for (float& value : walk) value = rng.bipolar();
    // Never less than 1 ms a pole; Smooth adds a share of the wave's period.
    const float slew_seconds = Tremolo::kMinSlewSeconds + smooth.value * Tremolo::kSmoothPeriods / rate.value;
    slew_coeff = kit::time_to_coeff(slew_seconds, lab::kSampleRate);
    started = false;
    for (int side = 0; side < 2; ++side) {
      slew_a[side] = slew_b[side] = 0.0f;
      gain[side] = 1.0f;
      out[side] = 0.0f;
    }
  }
};

lab::Build build{"A wire|A slow wave|Depth and shape|A phase between the ears|Audio rate|Take away the offset",
                 Built::kEars, -120.0f,
                 "The tremolo as built, the first four pieces, against a Tremolo of the engine held to the same four"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // at the fourth step: what is compared with the device

// ---------------------------------------------------------------------------
// The sweep: one steady tone through a second Ring whose Frequency climbs.

constexpr float kToneHz = 880.0f;       // the tone that goes in
constexpr float kTonePeak = 0.25f;      // and its size
constexpr float kSweepFromHz = 1.0f;    // where the Ring's Frequency starts
constexpr float kSweepToHz = 660.0f;    // where it ends, and holds
constexpr float kSweepShare = 0.85f;    // the share of the loop the climb takes
constexpr int kFanSize = 2048;          // samples in a frame of the picture: 43 ms
constexpr int kFanRows = kFanSize / 2 + 1;
constexpr int kFanColumns = 200;

// The sweep as it was last made, and the three things that reach it. It is
// made again only when one of them has moved.
float sweep_kept[lab::kMaxFrames];
float sweep_settings[3];
bool sweep_made = false;

void make_sweep(int frames) {
  using namespace ring;
  const float settings[3] = {wave.value, ring_mix.value, static_cast<float>(frames)};
  if (sweep_made && settings[0] == sweep_settings[0] && settings[1] == sweep_settings[1] &&
      settings[2] == sweep_settings[2]) {
    return;
  }
  probe.init(lab::kSampleRate);
  probe.set_param(kTune, 1.0f);
  probe.set_param(kFrequency, kSweepFromHz);
  probe.set_param(kWave, wave.value);
  probe.set_param(kSecond, 0.0f);
  probe.set_param(kDrift, 0.0f);
  probe.set_param(kLowCut, 20.0f);
  probe.set_param(kTone, 16000.0f);
  probe.set_param(kWidth, 0.0f);
  probe.set_param(kMix, ring_mix.value);
  const double turn = static_cast<double>(kToneHz) / lab::kSampleRate;
  const int climb = static_cast<int>(kSweepShare * static_cast<float>(frames));
  double tone_phase = 0.0;
  for (int i = 0; i < frames; i += lab::kControlPeriod) {
    // The Frequency climbs by the same ratio in every instant, then holds.
    const float along = i < climb ? static_cast<float>(i) / static_cast<float>(climb) : 1.0f;
    probe.set_param(kFrequency, kSweepFromHz * std::pow(kSweepToHz / kSweepFromHz, along));
    for (int j = 0; j < lab::kControlPeriod; ++j) {
      const float x = kTonePeak * kit::SineTable::lookup(static_cast<float>(tone_phase));
      tone_phase += turn;
      tone_phase -= std::floor(tone_phase);
      probe.in_left()[j] = x;
      probe.in_right()[j] = x;
    }
    probe.process(lab::kControlPeriod);
    for (int j = 0; j < lab::kControlPeriod; ++j) sweep_kept[i + j] = probe.out_left()[j];
  }
  // It is played as a loop: faded in and out over 20 ms, so the end meets the start.
  const int fade = lab::kFadeFrames < frames / 2 ? lab::kFadeFrames : frames / 2;
  for (int n = 0; n < fade; ++n) {
    const float up = static_cast<float>(n) / static_cast<float>(fade);
    sweep_kept[n] *= up;
    sweep_kept[frames - 1 - n] *= up;
  }
  sweep_settings[0] = settings[0];
  sweep_settings[1] = settings[1];
  sweep_settings[2] = settings[2];
  sweep_made = true;
}

// The sweep's spectrum over time: 200 Hann-windowed frames of 2,048 samples
// spread evenly over it, each transformed by the kit, in dB where a
// full-scale sine reads 0. Rows are the 1,025 bins from 0 Hz to half the
// sample rate, 23.4 Hz apart.
void picture_sweep(int frames) {
  static kit::Fft<kFanSize> fft;
  static float window[kFanSize];
  static float re[kFanSize];
  static float im[kFanSize];
  static bool ready = false;
  if (!ready) {
    fft.init();
    for (int n = 0; n < kFanSize; ++n) {
      window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kFanSize));
    }
    ready = true;
  }
  if (frames < kFanSize || !fan.open(kFanColumns * kFanRows)) return;
  fan.columns = kFanColumns;
  fan.x0 = 0.0f;
  fan.x1 = static_cast<float>(frames) / lab::kSampleRate;
  const double full = (kFanSize / 4.0) * (kFanSize / 4.0);
  for (int c = 0; c < kFanColumns; ++c) {
    // A frame is centred on its column's instant, and stops at the sweep's ends.
    const int centre = static_cast<int>(static_cast<long long>(c) * frames / kFanColumns);
    for (int n = 0; n < kFanSize; ++n) {
      const int i = centre - kFanSize / 2 + n;
      re[n] = i >= 0 && i < frames ? sweep_kept[i] * window[n] : 0.0f;
      im[n] = 0.0f;
    }
    fft.forward(re, im);
    float* column = fan.data + c * kFanRows;
    for (int k = 0; k < kFanRows; ++k) {
      const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
      column[k] = lab::power_to_db(static_cast<float>(power / full));
    }
  }
}

// ---------------------------------------------------------------------------
// The two devices on the loop.

void configure_tremolo(Tremolo& device, float mode_value, float drift_value, float mix_value) {
  using namespace tremolo;
  device.init(lab::kSampleRate);
  device.set_param(kMode, mode_value);
  device.set_param(kRate, rate.value);
  device.set_param(kDepth, depth.value);
  device.set_param(kShape, shape.value);
  device.set_param(kPhase, stereo_phase.value);
  device.set_param(kCrossover, crossover.value);
  device.set_param(kDrift, drift_value);
  device.set_param(kSmooth, smooth.value);
  device.set_param(kMix, mix_value);
}

void configure_ring() {
  using namespace ring;
  ring_device.init(lab::kSampleRate);
  ring_device.set_param(kTune, 1.0f);  // Free: the carrier is Frequency, in hertz
  ring_device.set_param(kFrequency, frequency.value);
  ring_device.set_param(kWave, wave.value);
  ring_device.set_param(kSecond, second.value);
  ring_device.set_param(kDrift, ring_drift.value);
  ring_device.set_param(kLowCut, low_cut.value);
  ring_device.set_param(kTone, tone.value);
  ring_device.set_param(kWidth, width.value);
  ring_device.set_param(kMix, ring_mix.value);
}

// True while a Tremolo will work on a sample: something goes in, or it has
// not yet been silent for the tenth of a second after which it sleeps. Asleep
// it writes silence and its oscillator stands still.
bool awake(const Tremolo& device, float left, float right) {
  return left != 0.0f || right != 0.0f || device.idle_.quiet_ < device.idle_.hold_;
}

// The Tremolo's shape, slew and four modes, worked out again beside it.
struct TremoloAgain {
  float slew_a[2] = {0.0f, 0.0f};
  float slew_b[2] = {0.0f, 0.0f};
  bool started = false;
  float raw = 0.0f;                  // the shape the left side reads, before the slew
  float gain[2] = {1.0f, 1.0f};      // what each side is multiplied by, the mix in it
  float high = 1.0f;                 // what Harmonic multiplies the left side's highs by
  float out[2] = {0.0f, 0.0f};
  float sudden[2] = {0.0f, 0.0f};    // the tremolo with the shape used as it is, unslewed

  void start() { *this = TremoloAgain{}; }

  // `shapes` is the device's own shape for each side, read where its
  // oscillator stood before it took this sample (Random moves on to its next
  // level as the oscillator comes round); everything else is read after.
  void run(const Tremolo& device, const float* shapes, const float* in) {
    const float sr = lab::kSampleRate;
    if (!started) {
      for (int c = 0; c < 2; ++c) slew_a[c] = slew_b[c] = shapes[c];
      started = true;
    }
    float m[2];
    for (int c = 0; c < 2; ++c) {
      slew_a[c] = shapes[c] + (slew_a[c] - shapes[c]) * device.slew_coeff_;
      slew_b[c] = slew_a[c] + (slew_b[c] - slew_a[c]) * device.slew_coeff_;
      m[c] = slew_b[c];
    }
    raw = shapes[0];

    const float depth_now = device.depth_.value;
    const float half = 0.5f * depth_now;
    const float w_tremolo = device.weight_[Tremolo::kModeTremolo].value;
    const float w_pan = device.weight_[Tremolo::kModePan].value;
    const float w_harmonic = device.weight_[Tremolo::kModeHarmonic].value;
    const float w_vibrato = device.weight_[Tremolo::kModeVibrato].value;
    const float swing = device.swing_.value * sr;
    const float mix_now = device.mix_.value;

    float pan[2] = {1.0f, 1.0f};
    if (w_pan > 0.0f) {
      const float angle = (depth_now * m[0] + 1.0f) * 0.125f;
      pan[0] = kSqrt2 * kit::SineTable::cos_lookup(angle);
      pan[1] = kSqrt2 * kit::SineTable::lookup(angle);
    }
    for (int c = 0; c < 2; ++c) {
      const float x = in[c];
      const float low = device.split_[c].state;
      const float down = 1.0f - half * (1.0f - m[c]);
      const float up = 1.0f - half * (1.0f + m[c]);
      float wet = w_tremolo * x * down + w_pan * x * pan[c];
      if (w_harmonic > 0.0f) wet += w_harmonic * (low * down + (x - low) * up);
      // The device has written this sample into its line: the same read.
      if (w_vibrato > 0.0f) wet += w_vibrato * device.line_[c].read_hermite(2.0f + swing * (1.0f + m[c]));
      out[c] = x + (wet - x) * mix_now;
      // The one number a side is multiplied by, where the mode has one.
      const float one = w_tremolo * down + w_pan * pan[c] + w_harmonic * down + w_vibrato;
      gain[c] = 1.0f + (one - 1.0f) * mix_now;
      if (c == 0) high = 1.0f + (up - 1.0f) * mix_now;
      // The same law on the shape before the slew: what the slew is there to prevent.
      sudden[c] = x * (1.0f - half * (1.0f - shapes[c]) * mix_now);
    }
  }
};

// The Ring's carrier, product, filters and mix, worked out again beside it.
struct RingAgain {
  kit::Svf low_cut[2];
  kit::Svf tone[2];
  float carrier[2] = {0.0f, 0.0f};  // what each side is multiplied by
  float product[2] = {0.0f, 0.0f};  // the sound times it, before the filters
  float out[2] = {0.0f, 0.0f};

  void start() { *this = RingAgain{}; }

  void rest() {
    for (int c = 0; c < 2; ++c) {
      low_cut[c].reset();
      tone[c].reset();
      carrier[c] = product[c] = out[c] = 0.0f;
    }
  }

  // `where` is where the device's two carriers stood when it took this
  // sample; everything else is read after it has.
  void run(const Ring& device, const float* where, const float* in) {
    using ring::Waves;
    const float hz = device.hz_now_ * device.drift_ratio_;
    const float ratio = device.ratio_.value;
    const float gain[2] = {device.first_gain_.value, device.second_gain_.value};
    float weight[Ring::kNumWaves];
    for (int w = 0; w < Ring::kNumWaves; ++w) weight[w] = device.weight_[w].value;
    const float offset = device.width_.value * 0.25f;
    const float mix_now = device.mix_.value;

    // A slow carrier is a gain on the sound: the device's own law, as it writes it.
    float dry_gain = device.dry_gain_;
    float wet_gain = device.wet_gain_;
    float level[2][Ring::kNumWaves];
    const float slowness[2] = {Ring::slow(hz), Ring::slow(hz * ratio)};
    for (int k = 0; k < 2; ++k) {
      for (int w = 0; w < Ring::kNumWaves; ++w) level[k][w] = weight[w];
    }
    if (slowness[0] > 0.0f || (slowness[1] > 0.0f && gain[1] > 0.0f)) {
      for (int k = 0; k < 2; ++k) {
        if (slowness[k] <= 0.0f) continue;
        for (int w = 0; w < Ring::kNumWaves; ++w) level[k][w] *= 1.0f + slowness[k] * (device.tame_[w] - 1.0f);
      }
      const float both = kit::min(1.0f, gain[0] * gain[0] * slowness[0] + gain[1] * gain[1] * slowness[1]);
      dry_gain += both * ((1.0f - mix_now) - dry_gain);
      wet_gain += both * (mix_now - wet_gain);
      wet_gain *= 1.0f + both * (1.0f / (gain[0] + gain[1]) - 1.0f);
    }

    const bool diode = weight[Ring::kWaveDiode] > 0.0f;
    const float diode_gain = Waves::diode_gain();
    for (int c = 0; c < 2; ++c) {
      const float body = diode ? device.body_[c].state : 0.0f;
      float multiplier = 0.0f;
      float wet = 0.0f;
      for (int k = 0; k < 2; ++k) {
        if (gain[k] == 0.0f) continue;
        const float phase = c == 0 ? where[k] : where[k] + offset;
        const float m = Ring::shape(level[k], device.cut_[k], phase);
        float ringing = in[c] * m;
        if (diode && device.lean_[k] > 0.0f) {
          const float gate = Waves::read(Waves::kDiode, Waves::kCuts - 1, phase);
          ringing += level[k][Ring::kWaveDiode] * device.lean_[k] *
                     (diode_gain * Ring::swing(kit::SineTable::lookup(phase), body) - body * gate);
        }
        multiplier += gain[k] * m;
        wet += gain[k] * ringing;
      }
      carrier[c] = multiplier;
      product[c] = wet;
      // Two kit filters, set to the numbers the device's own two are set to.
      low_cut[c].g = device.low_cut_[c].g;
      low_cut[c].k = device.low_cut_[c].k;
      low_cut[c].a1 = device.low_cut_[c].a1;
      low_cut[c].a2 = device.low_cut_[c].a2;
      low_cut[c].a3 = device.low_cut_[c].a3;
      tone[c].g = device.tone_[c].g;
      tone[c].k = device.tone_[c].k;
      tone[c].a1 = device.tone_[c].a1;
      tone[c].a2 = device.tone_[c].a2;
      tone[c].a3 = device.tone_[c].a3;
      const float filtered = tone[c].lowpass(low_cut[c].highpass(wet));
      out[c] = in[c] * dry_gain + filtered * wet_gain;
    }
  }
};

TremoloAgain tremolo_again;
RingAgain ring_again;

constexpr int kZoomFrames = 960;  // 20 ms

// Twenty milliseconds of the loop, close up, taken round the largest sample
// that goes in: the input, the carrier, and the two multiplied.
void zoom(const float* input, const float* carrier, const float* multiplied, int frames) {
  if (!input || !carrier || !multiplied || frames < 4 * kZoomFrames) return;
  if (!zoom_in.open(kZoomFrames) || !zoom_carrier.open(kZoomFrames) || !zoom_product.open(kZoomFrames)) return;
  int at = kZoomFrames;
  float most = 0.0f;
  // Not in the first 20 ms, which two passes of the loop are crossfaded over.
  for (int n = kZoomFrames; n < frames - kZoomFrames; ++n) {
    const float size = input[n] < 0.0f ? -input[n] : input[n];
    if (size > most) {
      most = size;
      at = n;
    }
  }
  int from = at - kZoomFrames / 2;
  if (from < kZoomFrames) from = kZoomFrames;
  if (from > frames - kZoomFrames) from = frames - kZoomFrames;
  zoom_in.x0 = zoom_carrier.x0 = zoom_product.x0 = 0.0f;
  zoom_in.x1 = zoom_carrier.x1 = zoom_product.x1 = 1000.0f * (kZoomFrames - 1) / lab::kSampleRate;
  for (int n = 0; n < kZoomFrames; ++n) {
    zoom_in.set(n, input[from + n]);
    zoom_carrier.set(n, carrier[from + n]);
    zoom_product.set(n, multiplied[from + n]);
  }
}

}  // namespace

void lab_setup() {
  kit::SineTable::init();
  ring::Waves::init();
}

void lab_render(int frames) {
  configure_tremolo(trem, mode.value, drift.value, mix.value);
  // What the build builds: Tremolo mode, no drift, none of the dry sound.
  configure_tremolo(trem_plain, 0.0f, 0.0f, 1.0f);
  configure_ring();
  tremolo_again.start();
  ring_again.start();
  shown.start(build.at());
  held.start(build.compared_step);

  double tremolo_apart = 0.0, tremolo_whole = 0.0;
  double ring_apart = 0.0, ring_whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;
  const double inverse_sr = 1.0 / static_cast<double>(lab::kSampleRate);

  // The pass that is kept, for the close-up: what went in, the carrier, the product.
  float* kept_in = lab::take(frames);
  float* kept_carrier = lab::take(frames);
  float* kept_product = lab::take(frames);

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float in[2] = {lab::in_at(0, i), lab::in_at(1, i)};
    const bool keep = i >= frames && i < 2 * frames;
    in_tap.put(i, in[0], in[1]);

    // The Tremolo. Its phase is read before it takes the sample, as its own
    // loop reads it before stepping on.
    const bool works = awake(trem, in[0], in[1]);
    const float phase_now = static_cast<float>(trem.phase_);
    const float shapes_now[2] = {trem.wave(phase_now), trem.wave(phase_now + trem.offset_.value)};
    trem.in_left()[0] = in[0];
    trem.in_right()[0] = in[1];
    trem.process(1);
    const float tremolo_now[2] = {trem.out_left()[0], trem.out_right()[0]};
    if (works) {
      tremolo_again.run(trem, shapes_now, in);
    } else {
      tremolo_again.out[0] = tremolo_again.out[1] = 0.0f;
      tremolo_again.sudden[0] = tremolo_again.sudden[1] = 0.0f;
    }
    if (i >= frames) {
      for (int c = 0; c < 2; ++c) {
        const double apart = static_cast<double>(tremolo_again.out[c]) - tremolo_now[c];
        tremolo_apart += apart * apart;
        tremolo_whole += static_cast<double>(tremolo_now[c]) * tremolo_now[c];
      }
    }
    unslewed.put(i, tremolo_again.sudden[0], tremolo_again.sudden[1]);
    lows.put(i, trem.split_[0].state, trem.split_[1].state);
    tremolo_out.put(i, tremolo_now[0], tremolo_now[1]);

    // The Ring. Its carriers' phases are read before it takes the sample.
    const bool silent = flush_denormal(in[0]) == 0.0f && flush_denormal(in[1]) == 0.0f;
    const bool was_resting = ring_device.resting_;
    double where[2] = {ring_device.phase_[0], ring_device.phase_[1]};
    ring_device.in_left()[0] = in[0];
    ring_device.in_right()[0] = in[1];
    ring_device.process(1);
    const float ring_now[2] = {ring_device.out_left()[0], ring_device.out_right()[0]};
    if (was_resting && silent) {
      ring_again.rest();
    } else {
      if (was_resting) {
        // It woke on this sample and turned its carriers by the time it had
        // rested before it read them: where they stood is one step back.
        const float hz = ring_device.hz_now_ * ring_device.drift_ratio_;
        where[0] = ring_device.phase_[0] - static_cast<double>(hz) * inverse_sr;
        where[1] = ring_device.phase_[1] - static_cast<double>(hz * ring_device.ratio_.value) * inverse_sr;
        where[0] -= std::floor(where[0]);
        where[1] -= std::floor(where[1]);
      }
      const float stood[2] = {static_cast<float>(where[0]), static_cast<float>(where[1])};
      ring_again.run(ring_device, stood, in);
    }
    if (i >= frames) {
      for (int c = 0; c < 2; ++c) {
        const double apart = static_cast<double>(ring_again.out[c]) - ring_now[c];
        ring_apart += apart * apart;
        ring_whole += static_cast<double>(ring_now[c]) * ring_now[c];
      }
    }
    // With the sample that ends its hold the device goes to rest and clears
    // its filters; the copies are cleared with them.
    if (ring_device.resting_) ring_again.rest();
    product.put(i, ring_again.product[0], ring_again.product[1]);
    wet_tap.put(i, ring_device.tone_[0].low, ring_device.tone_[1].low);
    ring_out.put(i, ring_now[0], ring_now[1]);
    if (keep && kept_in && kept_carrier && kept_product) {
      kept_in[i - frames] = in[0];
      kept_carrier[i - frames] = ring_again.carrier[0];
      kept_product[i - frames] = ring_again.product[0];
    }

    // The build part, beside a Tremolo held to what it builds. Asleep, that
    // device writes silence and its oscillator stands still; the build stands
    // still with it.
    const bool plain_works = awake(trem_plain, in[0], in[1]);
    trem_plain.in_left()[0] = in[0];
    trem_plain.in_right()[0] = in[1];
    trem_plain.process(1);
    if (plain_works) {
      shown.run(in[0], in[1]);
      held.run(in[0], in[1]);
    } else {
      shown.out[0] = shown.out[1] = 0.0f;
      held.out[0] = held.out[1] = 0.0f;
    }
    if (i >= frames) {
      const double apart_left = static_cast<double>(held.out[0]) - trem_plain.out_left()[0];
      const double apart_right = static_cast<double>(held.out[1]) - trem_plain.out_right()[0];
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_whole += static_cast<double>(trem_plain.out_left()[0]) * trem_plain.out_left()[0] +
                     static_cast<double>(trem_plain.out_right()[0]) * trem_plain.out_right()[0];
    }
    built.put(i, shown.out[0], shown.out[1]);

    if (i % lab::kControlPeriod == 0) {
      phase_tap.put(i, trem.meter(0));
      raw_tap.put(i, tremolo_again.raw);
      lfo.put(i, trem.meter(1));
      lfo_right.put(i, trem.meter(2));
      gain_tap.put(i, tremolo_again.gain[0]);
      gain_right.put(i, tremolo_again.gain[1]);
      gain_high.put(i, tremolo_again.high);
      carrier_hz.put(i, ring_device.meter(0));
      built_gain.put(i, shown.gain[0]);
      built_gain_right.put(i, shown.gain[1]);
    }
  }
  tremolo_rebuilt.value = lab::ratio_db(tremolo_apart, tremolo_whole);
  ring_rebuilt.value = lab::ratio_db(ring_apart, ring_whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  zoom(kept_in, kept_carrier, kept_product, frames);

  make_sweep(frames);
  if (sweep.open(frames)) {
    for (int n = 0; n < frames; ++n) sweep.set(n, sweep_kept[n]);
  }
  picture_sweep(frames);
}
