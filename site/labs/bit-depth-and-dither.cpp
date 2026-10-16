// Bit depth and dither: one sound written in fewer bits three ways, side by
// side on one loop.
//
//   in ─┬─► Vintage Digital: clip ─► (sampler, hold) ─► quantiser ─────────► rounded
//       ├─► the quantiser of Echo Memory's store: + dither ─► round ───► dithered
//       └─► the lesson's own: − the last error ─► + dither ─► round ───► shaped
//
// Read from the engine:
// - `rounded` is the output of the device Vintage Digital
//   (cpp/devices/vintage-digital), whose quantiser has a step of 2^(1 - Bits)
//   and no dither. The lab starts it with Rate at the top, which switches its
//   sampler and hold out and leaves the quantiser, so what comes out is the
//   input rounded. Rate comes back as a control. Aliasing, Filter, Jitter,
//   Drive and Mix stay where the device starts them: with Rate at the top
//   the first three do nothing, and the last two are no drive and all of the
//   converted sound. The device reports 129 samples of latency; it is fed
//   that much early, as a host does, so every tap lines up.
//
// Computed by a function of the engine that the lab calls on its own:
// - `stairs` is that device's own quantiser function, called on a ramp.
// - `dithered` is the quantiser of the 16-bit store of the device Echo Memory
//   (cpp/devices/echo-memory/memory_store.h), the one place in the engine
//   that dithers. That device does not run here: the lab calls the function
//   that writes its store. Its step is fixed at 2 / 32767, so the lab turns
//   the sound up on the way in and down by as much on the way out, so that
//   one step of the store stands for one step of Bits. The dither and the
//   rounding are the store's.
//
// Written for the lesson:
// - the errors (each output less the input) and their levels;
// - `dither`, the noise the store adds, which is a local of the store's
//   function and not kept: it is worked out again from the store's own
//   generator, and the "ditherHeld" check counts the samples on which the
//   store's answer is not the nearest step to the sound plus that noise;
// - `shaped`: noise shaping, which the engine has nowhere. The last sample's
//   error is taken off this one before it is rounded;
// - the two curves of how often each size of dither comes up.
//
// The build part (lab::Build in lab.h) puts a quantiser together in five
// pieces, each a function of `Built` below: a wire; round to the step; the
// error; add dither; shape the noise. Two copies of it run. One is at the
// step the reader chose and at the page's Bits, and is what the built taps
// hold. The other stops at the dither and runs at the store's own step: its
// output is compared on every render with a second store's ("builtDifference"),
// and the samples on which the two differ are counted ("storeApart").
// The last piece is the lesson's own and has nothing in the engine to be
// held to. The build's rounding is also held to Vintage Digital's own
// rounding function on every sample (the "rounding" check).
//
// One thing is done for the loop's sake: where the kept pass starts and where
// it ends, every generator is seated again and the shaper forgets its last
// error, so the 20 ms that are crossfaded across the wrap are the same noise
// twice and the hiss does not dip there. The kept pass therefore starts as a
// store does that has just been cleared.

#include "lab.h"

#include "../../cpp/devices/echo-memory/memory_store.h"
#include "../../cpp/devices/vintage-digital/vintage_digital.h"

using namespace livemix;

namespace {

using Store = echo_memory::Memory<64>;

VintageDigital device;
Store store;      // fed the sound turned up, so that its step stands for the page's
Store store_own;  // fed the sound as it is: the store at its own step

constexpr int kLatency = VintageDigital::kLatency;
// What is played before the pass that is kept. The device remembers its
// latency, the ring of its filters and, at most, the quarter second its idle
// gate waits; the meters remember a few hundredths of a second.
constexpr int kRunIn = 24000;
constexpr float kMeterSeconds = 0.01f;
constexpr float kMeterFloorDb = -120.0f;
constexpr uint32_t kStoreSeed = 0x6D2B79F5u;   // as Memory::clear() seeds it
constexpr uint32_t kShaperSeed = 0x2F6E2B1Du;  // the lesson's own

lab::Control level{"level", "Level in", "dB", -60.0f, 0.0f, 0.0f};
lab::Control bits{"bits", "Bits", "bit", 4.0f, 16.0f, 6.0f};
lab::Control companding{"companding", "Companding", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Linear|Mu-law"};
lab::Control rate{"rate", "Rate", "Hz", 1000.0f, 48000.0f, 48000.0f, lab::kLog};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap in_level{"inLevel", "Level of the input", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap stairs{"stairs", "Level out against level in", lab::kCurve, lab::kCalled, 1};
lab::Tap stairs_error{"stairsError", "Error against level in", lab::kCurve, lab::kLesson, 1};
lab::Tap dither_one{"ditherOne", "One random number", lab::kCurve, lab::kLesson, 1};
lab::Tap dither_spread{"ditherSpread", "One random number less another", lab::kCurve, lab::kLesson, 1};
lab::Tap dither_tap{"dither", "The dither alone", lab::kAudio, lab::kLesson, 2};
lab::Tap dithered_error{"ditheredError", "Error with dither", lab::kAudio, lab::kLesson, 2};
lab::Tap dithered_level{"ditheredLevel", "Level of the error with dither", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap dithered{"dithered", "Rounded with dither", lab::kAudio, lab::kCalled, 2};
lab::Tap shaped_error{"shapedError", "Error with dither, shaped", lab::kAudio, lab::kLesson, 2};
lab::Tap shaped_level{"shapedLevel", "Level of the shaped error", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap shaped{"shaped", "Rounded with dither and shaping", lab::kAudio, lab::kLesson, 2};
lab::Tap error{"error", "Error: rounded less input", lab::kAudio, lab::kLesson, 2};
lab::Tap error_level{"errorLevel", "Level of the error", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap rounded{"rounded", "Rounded", lab::kAudio, lab::kDevice, 2};

lab::Check rounding{"rounding", "The build's rounding, against the device's own rounding of the same samples",
                    "dB"};
lab::Check dither_held{"ditherHeld",
                       "Samples on which the store's answer is not the nearest step to the sound plus the "
                       "dither worked out again",
                       ""};
lab::Check store_floor{"storeFloor", "The error of the engine's store at its own step, against full scale", "dB"};
lab::Check store_apart{"storeApart",
                       "Samples on which the build's rounding and dither, at the store's own step, are not the "
                       "store's answer",
                       ""};

lab::Tap built{"built", "The quantiser so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_error{"builtError", "Error, as built", lab::kAudio, lab::kLesson, 2};
lab::Tap built_level{"builtLevel", "Level of the error, as built", lab::kControl, lab::kLesson, 1, "dB"};

// The quantiser so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kWire = 0, kRound, kError, kDither, kShape };

  int pieces = kWire;
  float step = 1.0f;          // the distance between two values that can be written
  float inverse_step = 1.0f;
  kit::Rng rng;
  float fed[2] = {0.0f, 0.0f};  // the last sample's error, a channel each
  float out[2] = {0.0f, 0.0f};
  float error[2] = {0.0f, 0.0f};

  // A wire: what goes in comes out, as the 32-bit float it came in as.
  static float wire(float x) { return x; }

  // To the nearest whole number, halves to the even one. A float this large
  // has no room for a fraction, so adding it and taking it off again rounds.
  static float nearest(float x) { return (x + 12582912.0f) - 12582912.0f; }

  // Round to N bits: count the sample in steps, take the nearest whole
  // number of them, and turn the count back into a level.
  float rounded(float x) const { return step * nearest(x * inverse_step); }

  // The error: what the rounding put into the sound. It is the difference
  // between what came out and what went in, and nothing else.
  static float error_of(float y, float x) { return y - x; }

  // Dither: one random number less another, each from 0 up to 1, so the
  // result lies within a step either side of zero and is most often near it.
  // Both come from the two halves of one 32-bit draw.
  float draw() {
    const uint32_t drawn = rng.next_u32();
    return (static_cast<float>(drawn & 0xFFFFu) - static_cast<float>(drawn >> 16)) * (1.0f / 65536.0f);
  }

  // Add dither: the noise goes in before the rounding, counted in steps.
  float dithered(float x) { return step * nearest(x * inverse_step + draw()); }

  // Shape the noise: take the last sample's error off this one before it is
  // rounded. Whatever the rounding and the dither add now is kept for the
  // next sample, so each error is followed by its own opposite.
  float corrected(int c, float x) const { return x - fed[c]; }
  void keep(int c, float y, float v) { fed[c] = y - v; }

  // One sample of one channel through the pieces built so far.
  void run(int c, float x) {
    const float v = pieces >= kShape ? corrected(c, x) : x;
    out[c] = pieces >= kDither ? dithered(v) : pieces >= kRound ? rounded(v) : wire(v);
    if (pieces >= kShape) keep(c, out[c], v);
    error[c] = pieces >= kError ? error_of(out[c], x) : 0.0f;
  }

  void start(int pieces_, float step_, uint32_t seed) {
    pieces = pieces_;
    step = step_;
    inverse_step = 1.0f / step_;
    seat(seed);
  }

  // The loop comes round: the same noise again, and no error remembered.
  void seat(uint32_t seed) {
    rng.seed(seed);
    fed[0] = fed[1] = 0.0f;
  }
};

lab::Build build{"A wire|Round to the step|The error|Add dither|Shape the noise", Built::kDither, -120.0f,
                 "The build's rounding and dither at the store's own step, against the engine's 16-bit store"};

Built shown;   // at the step the reader chose and the page's Bits: what the built taps hold
Built held;    // rounding and dither at the store's step: what is compared with the store
Built shaper;  // every piece, at the page's Bits: the main path's `shaped`

// How loud a signal is over the last few hundredths of a second: the mean of
// the two channels' squares through two one-poles, in dB against full scale.
struct Meter {
  kit::OnePole pole[2];

  void start() {
    for (kit::OnePole& one : pole) {
      one.set_cutoff(1.0f / (kit::kTwoPi * kMeterSeconds), lab::kSampleRate);
      one.reset();
    }
  }
  float read(float left, float right) {
    const float power = pole[1].lowpass(pole[0].lowpass(0.5f * (left * left + right * right)));
    return power > 1.0e-12f ? 10.0f * std::log10(power) : kMeterFloorDb;
  }
};

Meter meter_in, meter_error, meter_dithered, meter_shaped, meter_built;

// How often each size of dither comes up: the shares of the kept pass that
// fall in each of kSpreadBins equal parts of -1 to 1 steps, as a density, so
// a flat spread over one step stands at 1.
constexpr int kSpreadBins = 40;
double spread_one[kSpreadBins];
double spread_two[kSpreadBins];

void count(double* spread, float value) {
  const int bin = static_cast<int>((value + 1.0f) * (0.5f * kSpreadBins));
  if (bin >= 0 && bin < kSpreadBins) spread[bin] += 1.0;
}

void spread_tap(lab::Tap& tap, const double* spread, double drawn) {
  if (!tap.open(kSpreadBins)) return;
  const float width = 2.0f / kSpreadBins;
  tap.x0 = -1.0f + 0.5f * width;
  tap.x1 = 1.0f - 0.5f * width;
  for (int k = 0; k < kSpreadBins; ++k) {
    tap.set(k, drawn > 0.0 ? static_cast<float>(spread[k] / (drawn * width)) : 0.0f);
  }
}

// The device's own quantiser on a ramp from -1.25 to 1.25: what comes out for
// each level that goes in, and how far that is from the level itself.
constexpr int kStairPoints = 1001;
constexpr float kStairReach = 1.25f;

void measure_stairs() {
  if (!stairs.open(kStairPoints) || !stairs_error.open(kStairPoints)) return;
  stairs.x0 = stairs_error.x0 = -kStairReach;
  stairs.x1 = stairs_error.x1 = kStairReach;
  for (int p = 0; p < kStairPoints; ++p) {
    const float x = -kStairReach + 2.0f * kStairReach * static_cast<float>(p) / static_cast<float>(kStairPoints - 1);
    const float y = device.quantise(x);
    stairs.set(p, y);
    stairs_error.set(p, y - x);
  }
}

void configure() {
  using namespace vintage_digital;
  device.init(lab::kSampleRate);
  device.set_param(kRate, rate.value);
  device.set_param(kBits, bits.value);
  device.set_param(kCompanding, companding.value);
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure();
  store.clear();
  store_own.clear();

  const float gain = kit::db_to_gain(level.value);
  const float step = std::exp2(1.0f - bits.value);
  // One step of the store for one step of the page.
  const float up = Store::kStep / step;

  shown.start(build.at(), step, kStoreSeed);
  held.start(build.compared_step, Store::kStep, kStoreSeed);
  shaper.start(Built::kShape, step, kShaperSeed);

  meter_in.start();
  meter_error.start();
  meter_dithered.start();
  meter_shaped.start();
  meter_built.start();

  for (int k = 0; k < kSpreadBins; ++k) spread_one[k] = spread_two[k] = 0.0;
  double drawn = 0.0;
  double rounding_apart = 0.0, rounding_whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;
  double store_error = 0.0;
  double kept = 0.0;
  int unheld = 0;
  int apart_samples = 0;

  const int start = frames > kRunIn ? frames - kRunIn : 0;
  const int total = lab::total();
  for (int i = start; i < total; ++i) {
    if (i == frames || i == 2 * frames) {
      store.rng_.seed(kStoreSeed);
      store_own.rng_.seed(kStoreSeed);
      shown.seat(kStoreSeed);
      held.seat(kStoreSeed);
      shaper.seat(kShaperSeed);
    }
    const bool keeps = i >= frames && i < 2 * frames;
    const float x[2] = {gain * lab::in_at(0, i), gain * lab::in_at(1, i)};

    // The device, fed its latency early, so that what comes out now is this sample's.
    device.in_left()[0] = gain * lab::in_at(0, i + kLatency);
    device.in_right()[0] = gain * lab::in_at(1, i + kLatency);
    device.process(1);
    const float y[2] = {device.out_left()[0], device.out_right()[0]};

    float noise[2], with_dither[2];
    for (int c = 0; c < 2; ++c) {
      // The store's quantiser. Its dither is a local, so it is worked out
      // again here from a copy of the store's generator before the store draws.
      kit::Rng peek = store.rng_;
      const uint32_t halves = peek.next_u32();
      const float d = (static_cast<float>(halves & 0xFFFFu) - static_cast<float>(halves >> 16)) * (1.0f / 65536.0f);
      const float turned_up = x[c] * up;
      const int code = store.quantise(turned_up);
      if (keeps) {
        if (code != static_cast<int>(std::lrintf(turned_up * (1.0f / Store::kStep) + d))) ++unheld;
        count(spread_one, static_cast<float>(halves & 0xFFFFu) * (1.0f / 65536.0f) - 0.5f);
        count(spread_two, d);
        drawn += 1.0;
      }
      noise[c] = d * step;
      with_dither[c] = static_cast<float>(code) * step;

      // The same store at its own step, and the build's first three pieces beside it.
      const float stored = static_cast<float>(store_own.quantise(x[c])) * Store::kStep;
      held.run(c, x[c]);
      shown.run(c, x[c]);
      shaper.run(c, x[c]);
      if (keeps) {
        const double apart = static_cast<double>(held.out[c]) - stored;
        if (held.out[c] != stored) ++apart_samples;
        built_apart += apart * apart;
        built_whole += static_cast<double>(stored) * stored;
        const double off = static_cast<double>(stored) - x[c];
        store_error += off * off;
        const float device_rounds = device.quantise_linear(x[c]);
        const double differs = static_cast<double>(shown.rounded(x[c])) - device_rounds;
        rounding_apart += differs * differs;
        rounding_whole += static_cast<double>(device_rounds) * device_rounds;
        kept += 1.0;
      }
    }

    in_tap.put(i, x[0], x[1]);
    in_level.put(i, meter_in.read(x[0], x[1]));
    dither_tap.put(i, noise[0], noise[1]);
    dithered_error.put(i, with_dither[0] - x[0], with_dither[1] - x[1]);
    dithered_level.put(i, meter_dithered.read(with_dither[0] - x[0], with_dither[1] - x[1]));
    dithered.put(i, with_dither[0], with_dither[1]);
    shaped_error.put(i, shaper.out[0] - x[0], shaper.out[1] - x[1]);
    shaped_level.put(i, meter_shaped.read(shaper.out[0] - x[0], shaper.out[1] - x[1]));
    shaped.put(i, shaper.out[0], shaper.out[1]);
    error.put(i, y[0] - x[0], y[1] - x[1]);
    error_level.put(i, meter_error.read(y[0] - x[0], y[1] - x[1]));
    rounded.put(i, y[0], y[1]);

    built.put(i, shown.out[0], shown.out[1]);
    built_error.put(i, shown.error[0], shown.error[1]);
    const float built_db = meter_built.read(shown.error[0], shown.error[1]);
    built_level.put(i, shown.pieces >= Built::kError ? built_db : kMeterFloorDb);
  }

  rounding.value = lab::ratio_db(rounding_apart, rounding_whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  dither_held.value = static_cast<float>(unheld);
  store_apart.value = static_cast<float>(apart_samples);
  store_floor.value = kept > 0.0 ? lab::power_to_db(static_cast<float>(store_error / kept)) : lab::kFloorDb;

  spread_tap(dither_one, spread_one, drawn);
  spread_tap(dither_spread, spread_two, drawn);
  measure_stairs();
}
