// Binaural beats: the engine's three beat devices, each holding a key for the
// whole loop and run one sample at a time, so that what each ear's signal
// holds can be read out and measured.
//
//   Binaural    key ─► a phase ─► sine and cosine ─┐
//               half-beat clock ───────────────────┴─► the pair, hi and lo ─► Ears ─► + bed ─► out
//   Ear Shift   the keys' tone, the same in both ears ─► a band of it moved up in the left
//               ear and down in the right ─► shifted
//   Isochronic  the key's tone ─► × one pulse for both ears ─► pulsed
//
// Nothing goes in. The lab presses its keys on the first sample and never
// lets them go: one key at Key, or three (Key, and the keys a major third and
// a fifth above it, in the ratios 4 to 5 to 6).
//
// Read from the Binaural: its output, each ear by itself, and its half-beat
// clock. The pair of tones is a local of its sample loop and is not kept, so
// the lab works it out again from the device's own carrier phases and clock,
// with the same sums ("lesson"), and the "pair" check holds that, put through
// the Ears law and added to the bed, to the device's output. The bed alone is
// the kit's noise through the kit's colour filter, seeded as the device seeds
// its own ("kit"), and the build path's check holds the two together to the
// device.
//
// The lab has a meter of its own, on each ear and on the two ears added: the
// mean of the squares over one cycle of the key (four cycles for the chord,
// which is the chord's own period), taken twice, in dB. It is how the page
// shows whether a level moves. Two more pictures are not the loop: what each
// ear holds within 25 Hz of the key, from one second of the output under a
// Hann window, a frequency at a time, since the page's own spectrum cannot
// tell two tones 6 Hz apart.
//
// The Ear Shift is given the keys' tone with no pair, the same in both ears,
// at the lab's Beat and Ears. The Isochronic plays Key alone, a bare sine
// (Warmth and Air at 0), pulsed at the lab's Beat.
//
// The build path puts the Binaural together in five pieces and then sets one
// more against it, each a few lines of `Built` below: one tone; two tones in
// the air; one tone to each ear; warmth; the bed; and a pulse, for contrast.
// With the first five the build does to a sample what the Binaural does, in
// the same order, and the "builtDifference" check compares the two on every
// render. The sixth is no part of the Binaural: it is the first piece again,
// switched on and off, written for the lesson, and the lab's test holds it to
// the Isochronic's own output.
//
// The lab starts where the technique shows plainly, not where the devices
// start. Binaural: Warmth at 0 (the device's own is 0.3), so that each ear is
// one sine; Attack at its shortest, 10 ms (1.5 s), so that every key is at
// full level before the pass that is kept begins; Layout stays on Pair,
// Target, Glide, Release and Volume where the device starts them. Isochronic:
// Rate is the lab's Beat (10 Hz), Warmth at 0 (0.3), Attack at its shortest,
// 5 ms (0.3 s). Ear Shift: as the device starts.

#include "lab.h"

#include "../../cpp/devices/binaural/binaural.h"
#include "../../cpp/devices/ear-shift/ear_shift.h"
#include "../../cpp/devices/isochronic/isochronic.h"

using namespace livemix;

namespace {

Binaural tones;
EarShift shifter;
Isochronic pulser;

lab::Control key{"key", "Key", "Hz", 80.0f, 1000.0f, 220.0f, lab::kLog};
lab::Control keys{"keys", "Keys", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "One key|A chord"};
lab::Control beat{"beat", "Beat", "Hz", 0.5f, 40.0f, 6.0f, lab::kLog};
lab::Control ears{"ears", "Ears", "", 0.0f, 1.0f, 1.0f};
lab::Control warmth{"warmth", "Warmth", "", 0.0f, 1.0f, 0.0f};
lab::Control bed{"bed", "Bed", "", 0.0f, 1.0f, 0.0f};
lab::Control colour{"colour", "Colour", "", 0.0f, 1.0f, 0.6f};
lab::Control low{"low", "Low", "Hz", 60.0f, 400.0f, 60.0f, lab::kLog};
lab::Control high{"high", "High", "Hz", 400.0f, 2000.0f, 1000.0f, lab::kLog};
lab::Control duty{"duty", "Duty", "", 0.1f, 0.9f, 0.5f};
lab::Control edge{"edge", "Edge", "ms", 2.0f, 50.0f, 8.0f, lab::kLog};
lab::Control depth{"depth", "Depth", "", 0.0f, 1.0f, 1.0f};
lab::Control offset{"offset", "Offset", "deg", 0.0f, 180.0f, 0.0f};

lab::Tap carrier_tap{"carrier", "The key's tone", lab::kAudio, lab::kLesson, 1};
lab::Tap clock_tap{"clock", "The half-beat clock", lab::kControl, lab::kDevice, 1, "cycles"};
lab::Tap voice_tap{"voice", "The keys, before the pair", lab::kAudio, lab::kLesson, 1};
lab::Tap high_tap{"high", "The higher tone", lab::kAudio, lab::kLesson, 1};
lab::Tap low_tap{"low", "The lower tone", lab::kAudio, lab::kLesson, 1};
lab::Tap bed_tap{"bedOnly", "The bed alone", lab::kAudio, lab::kKit, 2};
lab::Tap left_tap{"left", "Left ear", lab::kAudio, lab::kDevice, 1};
lab::Tap right_tap{"right", "Right ear", lab::kAudio, lab::kDevice, 1};
lab::Tap mid_tap{"mid", "The two ears added", lab::kAudio, lab::kLesson, 1};
lab::Tap level_left{"levelLeft", "Level in the left ear", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level_right{"levelRight", "Level in the right ear", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level_mid{"levelMid", "Level of the two added", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap fine_left{"fineLeft", "What the left ear holds", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap fine_right{"fineRight", "What the right ear holds", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap shifted_tap{"shifted", "Ear Shift output", lab::kAudio, lab::kDevice, 2};
lab::Tap shifted_mid{"shiftedMid", "Ear Shift, the two ears added", lab::kAudio, lab::kLesson, 1};
lab::Tap level_shifted{"levelShifted", "Level in the Ear Shift's left ear", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level_shifted_mid{"levelShiftedMid", "Level of the Ear Shift's two added", lab::kControl, lab::kLesson, 1,
                           "dB"};
lab::Tap gate_tap{"gate", "The pulse's gate", lab::kControl, lab::kDevice, 1};
lab::Tap pulsed_tap{"pulsed", "Isochronic output", lab::kAudio, lab::kDevice, 2};
lab::Tap pulsed_mid{"pulsedMid", "Isochronic, the two ears added", lab::kAudio, lab::kLesson, 1};
lab::Tap level_pulsed{"levelPulsed", "Level in the Isochronic's left ear", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level_pulsed_mid{"levelPulsedMid", "Level of the Isochronic's two added", lab::kControl, lab::kLesson, 1,
                          "dB"};
lab::Tap out_tap{"out", "Binaural output", lab::kAudio, lab::kDevice, 2};

lab::Check pair_check{"pair", "The pair worked out again from the device's phases, with the bed, against its output",
                      "dB"};

lab::Tap built{"built", "The sound so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_right{"builtRight", "Right ear, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_mid{"builtMid", "The two ears added, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_level{"builtLevel", "Level in the left ear, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_level_mid{"builtLevelMid", "Level of the two added, as built", lab::kControl, lab::kLesson, 1, "dB"};

constexpr int kMostKeys = 3;
// A chord's keys against its lowest: 4 to 5 to 6.
constexpr float kChord[kMostKeys] = {1.0f, 1.25f, 1.5f};

int key_count() { return keys.on() ? kMostKeys : 1; }
// The pitch key `v` sounds at, as the Binaural folds it.
float key_hz(int v) { return Binaural::fold(key.value * kChord[v]); }

// The lesson's meter: the mean of the squares over one cycle of the key, in
// dB against full scale. One cycle is the window, so the wave's own swing
// from sample to sample is averaged out and a level that moves is the level
// moving. The mean is taken twice, the second time of the first's answers,
// because the two tones of a pair are not exactly a cycle of the key long and
// one pass leaves a tenth of a decibel of their ripple. A full-scale sine
// reads -3 dB.
struct Meter {
  static constexpr int kMost = 2400;  // four cycles of 80 Hz

  // The mean of the last `window` values, kept as a running sum.
  struct Mean {
    float ring[kMost];
    int window = 1;
    int at = 0;
    double sum = 0.0;

    void start(int samples) {
      window = samples < 1 ? 1 : (samples > kMost ? kMost : samples);
      at = 0;
      sum = 0.0;
      for (int i = 0; i < window; ++i) ring[i] = 0.0f;
    }

    float next(float x) {
      sum += static_cast<double>(x) - static_cast<double>(ring[at]);
      ring[at] = x;
      if (++at >= window) at = 0;
      if (sum < 0.0) sum = 0.0;
      return static_cast<float>(sum / window);
    }
  };

  Mean once;
  Mean twice;

  void start(int samples) {
    once.start(samples);
    twice.start(samples);
  }

  float read(float x) { return lab::power_to_db(twice.next(once.next(x * x))); }
};

// The sound so far: one function a piece, and run() to make a sample from
// the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kTone = 0, kTwo, kEars, kWarmth, kBed, kPulse };

  int pieces = kTone;
  int count = 1;
  double carrier[kMostKeys] = {};    // each key's phase, in cycles
  double increment[kMostKeys] = {};  // cycles a sample
  bool split_second[kMostKeys] = {};
  bool split_third[kMostKeys] = {};
  kit::SlowClock half_beat;          // turns at half of Beat
  double half_step = 0.0;
  kit::StreamRng noise[2];
  kit::ColourFilter colour_filter[2];
  float bed_gain = 0.0f;
  float bed_out[2] = {0.0f, 0.0f};
  kit::SlowClock pulse;              // turns at Beat
  kit::PulseGate gate[2];
  kit::PulseShape shape = {0.5f, 0.1f};
  double pulse_step = 0.0;
  double offset_turns = 0.0;
  float gap = 0.0f;                  // the level between pulses
  bool right_waits = false;
  float out[2] = {0.0f, 0.0f};

  // One tone: a phase that goes round once for every cycle of the key, read
  // as a sine. The cosine is read with it, for the piece after this one.
  kit::SinCos tone(int v) {
    const kit::SinCos turn = kit::sin_cos(carrier[v]);
    carrier[v] = kit::wrap_phase(carrier[v] + increment[v]);
    return turn;
  }

  // Two tones: the key plus half of Beat and the key less half of Beat. They
  // are made from the one phase above and a second, slow one that turns at
  // half of Beat, by the rule for the sine of a sum.
  void pair(kit::SinCos turn, kit::SinCos slow, float* hi, float* lo) {
    const float together = turn.s * slow.c;
    const float apart = turn.c * slow.s;
    *hi = together + apart;  // sin(c + h)
    *lo = together - apart;  // sin(c - h)
  }

  // In the air: both tones reach both ears, half of each.
  void in_air(float hi, float lo) {
    out[0] = 0.5f * hi + 0.5f * lo;
    out[1] = 0.5f * hi + 0.5f * lo;
  }

  // One tone to each ear. Ears says how much of its own tone an ear gets and
  // how much of the other's: at 1 all of its own, at 0 half of each.
  void to_ears(float hi, float lo) {
    const float same = 0.5f + 0.5f * ears.value;
    const float other = 0.5f - 0.5f * ears.value;
    out[0] = same * hi + other * lo;
    out[1] = other * hi + same * lo;
  }

  // Warmth: the second and third partials of a key, from its sine and cosine
  // with no further sine. A partial at or under 1 kHz joins what is split
  // between the ears; one above it is the same in both.
  void warm(int v, kit::SinCos turn, float second, float third, float* s, float* c, float* whole) {
    const kit::SinCos two = {2.0f * turn.s * turn.c, turn.c * turn.c - turn.s * turn.s};
    const kit::SinCos three = {turn.s * (3.0f - 4.0f * turn.s * turn.s), turn.c * (4.0f * turn.c * turn.c - 3.0f)};
    if (split_second[v]) {
      *s += second * two.s;
      *c += second * two.c;
    } else {
      *whole += second * two.s;
    }
    if (split_third[v]) {
      *s += third * three.s;
      *c += third * three.c;
    } else {
      *whole += third * three.s;
    }
  }

  // The bed: two unlike noises, one to an ear, coloured and added under the
  // tones. Bed is squared, and at 1 the noise is as loud as one bare key.
  void add_bed() {
    bed_out[0] = bed_gain * colour_filter[0].process(noise[0].bipolar());
    bed_out[1] = bed_gain * colour_filter[1].process(noise[1].bipolar());
    out[0] += bed_out[0];
    out[1] += bed_out[1];
  }

  // A pulse, for contrast: the one tone of the first piece, with nothing of
  // the pair, switched on and off evenly Beat times a second. The right ear
  // reads the same clock Offset later.
  void pulsed() {
    const kit::SinCos turn = tone(0);
    const double right_phase = kit::wrap_phase(pulse.phase - offset_turns);
    const float open_left = gate[0].next(pulse.phase, shape, pulse_step);
    float open_right = gate[1].next(right_phase, shape, pulse_step);
    if (right_waits) {
      // The right ear stays shut until its own first pulse begins.
      if (kit::pulse_open(right_phase, shape) > 0.0f) {
        gate[1].reset();
        open_right = 0.0f;
      } else {
        right_waits = false;
      }
    }
    pulse.step(pulse_step);
    const float level = turn.s * (kit::db_to_gain(-6.0f) * Isochronic::kVoiceAmp);
    out[0] = level * (gap + (1.0f - gap) * open_left);
    out[1] = level * (gap + (1.0f - gap) * open_right);
  }

  // One sample from the pieces built so far, in the order it meets them.
  void run() {
    bed_out[0] = bed_out[1] = 0.0f;
    if (pieces == kPulse) {
      pulsed();
      return;
    }
    const kit::SinCos slow = kit::sin_cos(half_beat.phase);
    half_beat.step(half_step);
    const float second = pieces >= kWarmth ? Binaural::kSecond * warmth.value : 0.0f;
    const float third = pieces >= kWarmth ? Binaural::kThird * warmth.value : 0.0f;
    float s = 0.0f, c = 0.0f, whole = 0.0f;
    for (int v = 0; v < count; ++v) {
      const kit::SinCos turn = tone(v);
      s += turn.s;
      c += turn.c;
      if (second > 0.0f) warm(v, turn, second, third, &s, &c, &whole);
    }
    float hi = s, lo = s;
    if (pieces >= kTwo) pair({s, c}, slow, &hi, &lo);
    if (pieces >= kEars) to_ears(hi, lo);
    else in_air(hi, lo);
    // One level for any number of keys, and a peak that Warmth does not move.
    const float norm = Binaural::kVoiceAmp / ((1.0f + second + third) * std::sqrt(static_cast<float>(count)));
    out[0] = (out[0] + whole) * norm;
    out[1] = (out[1] + whole) * norm;
    if (pieces >= kBed && bed_gain > 0.0f) add_bed();
    // The device's guard: nothing passes it under half of full scale.
    out[0] = kit::soft_clip(out[0]);
    out[1] = kit::soft_clip(out[1]);
  }

  void start(int pieces_) {
    pieces = pieces_;
    count = pieces == kPulse ? 1 : key_count();
    for (int v = 0; v < kMostKeys; ++v) {
      const float hz = key_hz(v);
      carrier[v] = 0.0;
      increment[v] = static_cast<double>(hz) / static_cast<double>(lab::kSampleRate);
      split_second[v] = 2.0f * hz <= Binaural::kSplitTopHz;
      split_third[v] = 3.0f * hz <= Binaural::kSplitTopHz;
    }
    const double rate = static_cast<double>(beat.value);
    half_beat.reset();
    half_step = kit::SlowClock::increment(0.5 * rate, static_cast<double>(lab::kSampleRate));
    for (int ear = 0; ear < 2; ++ear) {
      noise[ear].seed(Binaural::kNoiseSeed + static_cast<uint64_t>(ear));
      colour_filter[ear].init(lab::kSampleRate);
      colour_filter[ear].set_colour(colour.value);
      gate[ear].reset();
    }
    bed_gain = bed.value * bed.value * Binaural::kBedLevel;
    pulse.reset();
    pulse_step = kit::SlowClock::increment(rate, static_cast<double>(lab::kSampleRate));
    shape = kit::pulse_shape(static_cast<float>(rate), duty.value, 0.001f * edge.value);
    offset_turns = static_cast<double>(offset.value * (1.0f / 360.0f));
    gap = kit::pulse_floor(depth.value);
    right_waits = offset.value > 0.0f;
    out[0] = out[1] = 0.0f;
  }
};

lab::Build build{"One tone|Two tones in the air|One tone to each ear|Warmth|The bed|A pulse, for contrast",
                 Built::kBed, -120.0f, "The first five pieces as built, against the Binaural's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with the first five pieces: what is compared with the device

Meter meter_left, meter_right, meter_mid;
Meter meter_shifted, meter_shifted_mid;
Meter meter_pulsed, meter_pulsed_mid;
Meter meter_built, meter_built_mid;

// What one ear holds within 25 Hz of the key: one second of it from the
// middle of the loop, under a Hann window, at a frequency every hertz. A
// full-scale sine reads 0 dB.
constexpr int kFinePoints = 51;
constexpr float kFineSpan = 25.0f;

void fine_tap(lab::Tap& tap, const float* x, int frames) {
  if (!x || !tap.open(kFinePoints)) return;
  const int count = frames < 48000 ? frames : 48000;
  const int from = (frames - count) / 2;
  float* windowed = lab::take(count);
  if (!windowed) return;
  for (int n = 0; n < count; ++n) {
    windowed[n] = x[from + n] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / count));
  }
  tap.x0 = key.value - kFineSpan;
  tap.x1 = key.value + kFineSpan;
  const double full = (count / 4.0) * (count / 4.0);
  for (int p = 0; p < kFinePoints; ++p) {
    const double hz = tap.x0 + (tap.x1 - tap.x0) * p / (kFinePoints - 1);
    tap.set(p, lab::power_to_db(static_cast<float>(lab::fourier_at(windowed, count, hz).power() / full)));
  }
}

}  // namespace

void lab_setup() { kit::SineTable::init(); }

void lab_render(int frames) {
  const int count = key_count();

  tones.init(lab::kSampleRate);
  tones.set_param(binaural::kBeat, beat.value);
  tones.set_param(binaural::kEars, ears.value);
  tones.set_param(binaural::kWarmth, warmth.value);
  tones.set_param(binaural::kBed, bed.value);
  tones.set_param(binaural::kColour, colour.value);
  tones.set_param(binaural::kAttack, 0.01f);
  for (int v = 0; v < count; ++v) tones.note_on(v, key.value * kChord[v], 1.0f);

  shifter.init(lab::kSampleRate);
  shifter.set_param(ear_shift::kBeat, beat.value);
  shifter.set_param(ear_shift::kEars, ears.value);
  shifter.set_param(ear_shift::kLow, low.value);
  shifter.set_param(ear_shift::kHigh, high.value);

  pulser.init(lab::kSampleRate);
  pulser.set_param(isochronic::kRate, beat.value);
  pulser.set_param(isochronic::kDuty, duty.value);
  pulser.set_param(isochronic::kEdge, edge.value);
  pulser.set_param(isochronic::kDepth, depth.value);
  pulser.set_param(isochronic::kOffset, offset.value);
  pulser.set_param(isochronic::kWarmth, 0.0f);
  pulser.set_param(isochronic::kAttack, 0.005f);
  pulser.note_on(0, key.value, 1.0f);

  // The build part: the chosen step, and the five pieces held to the device.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;
  double pair_apart = 0.0;

  // One cycle of the lowest key, or four for the chord: its own period.
  const int window = static_cast<int>(lab::kSampleRate / key_hz(0) + 0.5f) * (count > 1 ? 4 : 1);
  Meter* const meters[] = {&meter_left,   &meter_right,      &meter_mid,   &meter_shifted, &meter_shifted_mid,
                           &meter_pulsed, &meter_pulsed_mid, &meter_built, &meter_built_mid};
  for (Meter* meter : meters) meter->start(window);

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    // The Binaural's phases as they stand for this sample, before it moves them on.
    const double half_phase = tones.half_beat_.phase;
    const kit::SinCos slow = kit::sin_cos(half_phase);
    const float second = Binaural::kSecond * tones.warmth_.value;
    const float third = Binaural::kThird * tones.warmth_.value;
    float s = 0.0f, c = 0.0f, whole = 0.0f, bare = 0.0f;
    for (int v = 0; v < count; ++v) {
      const auto& voice = tones.pool_.voices[v];
      const kit::SinCos turn = kit::sin_cos(voice.carrier);
      if (v == 0) bare = turn.s;
      s += turn.s;
      c += turn.c;
      if (second > 0.0f) {
        const kit::SinCos two = kit::second_partial(turn);
        const kit::SinCos three = kit::third_partial(turn);
        if (voice.split_second) {
          s += second * two.s;
          c += second * two.c;
        } else {
          whole += second * two.s;
        }
        if (voice.split_third) {
          s += third * three.s;
          c += third * three.c;
        } else {
          whole += third * three.s;
        }
      }
    }
    const kit::TonePair two_tones = kit::tone_pair({s, c}, slow);
    const float norm = Binaural::kVoiceAmp / ((1.0f + second + third) * std::sqrt(static_cast<float>(count)));
    float pair_left, pair_right;
    kit::to_ears(kit::ear_gains(tones.ears_.value), two_tones.hi, two_tones.lo, &pair_left, &pair_right);
    pair_left = (pair_left + whole) * norm;
    pair_right = (pair_right + whole) * norm;
    const float plain = (s + whole) * norm;

    tones.process(1);
    const float out_left = tones.out_left()[0];
    const float out_right = tones.out_right()[0];

    carrier_tap.put(i, Binaural::kVoiceAmp * bare);
    voice_tap.put(i, plain);
    high_tap.put(i, two_tones.hi * norm);
    low_tap.put(i, two_tones.lo * norm);
    left_tap.put(i, out_left);
    right_tap.put(i, out_right);
    const float mid = 0.5f * (out_left + out_right);
    mid_tap.put(i, mid);
    const float loud_left = meter_left.read(out_left);
    const float loud_right = meter_right.read(out_right);
    const float loud_mid = meter_mid.read(mid);

    // The Ear Shift, given the keys with no pair, the same in both ears.
    shifter.in_left()[0] = plain;
    shifter.in_right()[0] = plain;
    shifter.process(1);
    const float shift_left = shifter.out_left()[0];
    const float shift_right = shifter.out_right()[0];
    const float shift_mid = 0.5f * (shift_left + shift_right);
    shifted_tap.put(i, shift_left, shift_right);
    shifted_mid.put(i, shift_mid);
    const float loud_shifted = meter_shifted.read(shift_left);
    const float loud_shifted_mid = meter_shifted_mid.read(shift_mid);

    // The Isochronic, on the one key.
    pulser.process(1);
    const float pulse_left = pulser.out_left()[0];
    const float pulse_right = pulser.out_right()[0];
    const float pulse_mid = 0.5f * (pulse_left + pulse_right);
    pulsed_tap.put(i, pulse_left, pulse_right);
    pulsed_mid.put(i, pulse_mid);
    const float loud_pulsed = meter_pulsed.read(pulse_left);
    const float loud_pulsed_mid = meter_pulsed_mid.read(pulse_mid);

    // The build part, beside the devices.
    shown.run();
    held.run();
    bed_tap.put(i, held.bed_out[0], held.bed_out[1]);
    if (i >= frames) {
      const double apart_left = static_cast<double>(held.out[0]) - out_left;
      const double apart_right = static_cast<double>(held.out[1]) - out_right;
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
      // The pair from the device's own phases, with the bed the build makes.
      const double pair_off_left = static_cast<double>(kit::soft_clip(pair_left + held.bed_out[0])) - out_left;
      const double pair_off_right = static_cast<double>(kit::soft_clip(pair_right + held.bed_out[1])) - out_right;
      pair_apart += pair_off_left * pair_off_left + pair_off_right * pair_off_right;
    }
    const float built_both = 0.5f * (shown.out[0] + shown.out[1]);
    built.put(i, shown.out[0], shown.out[1]);
    built_right.put(i, shown.out[1]);
    built_mid.put(i, built_both);
    const float loud_built = meter_built.read(shown.out[0]);
    const float loud_built_mid = meter_built_mid.read(built_both);

    out_tap.put(i, out_left, out_right);

    if (i % lab::kControlPeriod == 0) {
      clock_tap.put(i, static_cast<float>(half_phase));
      level_left.put(i, loud_left);
      level_right.put(i, loud_right);
      level_mid.put(i, loud_mid);
      level_shifted.put(i, loud_shifted);
      level_shifted_mid.put(i, loud_shifted_mid);
      gate_tap.put(i, pulser.ear_[0].gate.open);
      level_pulsed.put(i, loud_pulsed);
      level_pulsed_mid.put(i, loud_pulsed_mid);
      built_level.put(i, loud_built);
      built_level_mid.put(i, loud_built_mid);
    }
  }
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  pair_check.value = lab::ratio_db(pair_apart, built_whole);
  fine_tap(fine_left, left_tap.channel(0), frames);
  fine_tap(fine_right, right_tap.channel(0), frames);
}
