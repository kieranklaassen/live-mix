// Granular sound: the Grain Delay (cpp/devices/grain-delay) run one
// sample at a time, with the kit's grain pool (cpp/kit/grains.h) read as it
// works.
//
//   in ──(+)──► low-pass ──► limit ──► ring ──► grains ──► limit ─► tone ─► 30 Hz ──┬─► out
//         ▲                               (kit::GrainPool)                           │
//         └──────────────────────────── feedback ◄───────────────────────────────────┘
//
// Read from the device: what it records (the newest sample of its ring), its
// output, and every grain its pool holds: where it reads, how fast, how far
// through its window it is, and its gain. The pool's sum is a local of the
// device's loop and is not kept, so the lab adds the grains up again from the
// pool's own state just before the device does ("lesson"), puts that sum
// through the same limiter, tone filter and 30 Hz high-pass, and reports how
// far the result lands from the device's output (the "rebuilt" check).
//
// The device's randomness is seeded in its init, so every render is the same.
// Dice seeds it again, with one of eight numbers, the first of them the
// device's own: the same settings with other throws. Its sprays start at zero
// here. One thing it will not turn off: once its grains read unrelated sound
// (any Pitch, any spray, any Reverse) it moves each wait between grains by up
// to half. To show what that is for, the lab keeps a second pool of the kit's
// ("kit"), reading the device's own ring, which it starts by the device's
// formulas (spawn_grain, written out again in `plan` below) with that one
// term on a control of its own, Scatter, and under a window of its own, Shape:
// the device's grains are all bells, and at Shape's least the lab's are cut
// out of the ring with all but square edges. The "rule" check holds `plan` to the
// device: for every grain the device starts, the start, speed, length, gain
// and wait it works out against what the device's pool and counter hold.
//
// A second copy of the device is played a 1 kHz sine, for the picture of the
// lines a steady grain rate draws in a spectrum.
//
// The first time round the loop is there only so that what still sounds at
// the loop's end is sounding at its start. The device remembers no further
// back than its grains reach, times the trips round its feedback loop that
// take a sound down 100 dB, so only that much of the end of the first pass is
// played into it (`remembered`). Before that it is asleep, and does nothing.
//
// The build part puts a grain delay together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h). It has six pieces, each a
// function or two of `Built` below, in the order the steps add them: a ring
// that records, read back late; one grain at a time under its window; many
// grains, and the gain that holds their level; scatter in time and from side
// to side; pitch, with the low-pass it needs on the way in; and the output
// stages with the path back to the input. The path writes the "built" taps
// and leaves every other tap as it was. Two copies of it run: one at the step
// the reader chose, which is what the taps show, and one with all six pieces,
// whose output is compared on every render with the device's own output (the
// "builtDifference" check). With all six the build does to a sample what the
// device does, in the same order and with the dice thrown in the same order,
// so the two are the same sample for sample. A step before the last is the
// lesson's own: a grain delay with a piece missing, which the device never
// is. One thing the build is told and does not work out: when the device goes
// to sleep after a silence, and when it wakes.
//
// lab-memory-mb: 128

#include "lab.h"

#include <cstring>

#include "../../cpp/devices/grain-delay/grain_delay.h"

using namespace livemix;

namespace {

using Pool = kit::GrainPool<GrainDelay::kMaxGrains>;
using Tape = GrainDelay::Tape;

// The device's own controls, by its own names. Where it differs from the
// device's defaults the lab starts at the textbook case: no sprays, no pitch,
// no feedback, grains end to end, the tone filter open, the wet sound alone.
lab::Control time_ms{"time", "Time", "ms", 10.0f, 2000.0f, 250.0f, lab::kLog};
lab::Control spray{"spray", "Spray", "", 0.0f, 1.0f, 0.0f};
lab::Control pitch{"pitch", "Pitch", "st", -24.0f, 24.0f, 0.0f};
lab::Control pitch_spray{"pitchSpray", "Pitch Spray", "", 0.0f, 1.0f, 0.0f};
lab::Control size{"size", "Size", "ms", 10.0f, 500.0f, 120.0f, lab::kLog};
lab::Control density{"density", "Density", "", 1.0f, 8.0f, 1.0f, lab::kLog};
lab::Control reverse{"reverse", "Reverse", "", 0.0f, 1.0f, 0.0f};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 1.0f, 0.0f};
lab::Control tone{"tone", "Tone", "Hz", 500.0f, 16000.0f, 16000.0f, lab::kLog};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
// The lesson's own.
lab::Control look{"look", "Look at the grain after", "s", 0.0f, 8.0f, 1.0f};
lab::Control shape{"shape", "Shape", "", 0.02f, 1.0f, 1.0f};
lab::Control scatter{"scatter", "Scatter", "", 0.0f, 1.0f, 0.0f};
lab::Control throw_of{"dice", "Dice", "", 0.0f, 7.0f, 0.0f, lab::kLinear, "1|2|3|4|5|6|7|8"};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap recorded{"recorded", "What is recorded", lab::kAudio, lab::kDevice, 2};
lab::Tap piece{"piece", "What one grain reads", lab::kCurve, lab::kDevice, 1};
lab::Tap bell{"bell", "Its window, at the height of the piece", lab::kCurve, lab::kKit, 1};
lab::Tap grain{"grain", "The grain: the piece times the window", lab::kCurve, lab::kKit, 1};
lab::Tap cover{"cover", "The windows added up", lab::kControl, lab::kLesson, 1};
lab::Tap steady{"steady", "The lab's own pool, by its Scatter and its Shape", lab::kAudio, lab::kKit, 2};
lab::Tap grains{"grains", "The grains added up", lab::kAudio, lab::kLesson, 2};
// Last of the sounds, so it is what Play plays until a stage is chosen.
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap window{"window", "The window", lab::kCurve, lab::kKit, 1};
lab::Tap cut_spectrum{"cutSpectrum", "The piece cut out with no window", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap grain_spectrum{"grainSpectrum", "The piece under the window", lab::kSpectrum, lab::kKit, 1, "dB"};
// One column a grain: when it starts (s), how long it lasts (s), how far
// behind the write point it starts reading (ms), its speed (below zero:
// backwards), its gain, and a mark: 1 for the grain the lesson looks at, 2
// for a read head that is no grain (the build's first step).
lab::Tap cloud{"cloud", "The grains the device started", lab::kFrames, lab::kDevice, 1};
// The device's own counter to its next grain, read after each sample: a
// tooth for each wait.
lab::Tap until_next{"wait", "The time left until the next grain starts", lab::kControl, lab::kDevice, 1, "ms"};
// For each of those grains, in the order they started: the number from 0 to
// 1 that the dice gave for its place, before Spray scales it.
lab::Tap throws{"throws", "What the dice gave each grain for its place", lab::kCurve, lab::kLesson, 1};
lab::Tap lines_device{"linesDevice", "The device's grains of a 1 kHz sine", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap lines_steady{"linesSteady", "The lab's pool, by its own Scatter", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap picture{"picture", "The output's spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The grains added up again and put through the device's output stages, against its output", "dB"};
lab::Check rule{"rule", "Each grain's start, speed, length, gain and wait worked out again, against the device's pool", "samples"};

lab::Tap built{"built", "The grain delay so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_cover{"builtCover", "The windows added up, as built", lab::kControl, lab::kLesson, 1};
lab::Tap built_cloud{"builtCloud", "The grains the build started", lab::kFrames, lab::kLesson, 1};

// The dice as seeded for each choice of Dice. The first is the device's own.
uint32_t seed_of(uint32_t own) { return own + static_cast<uint32_t>(throw_of.choice()) * 0x9E3779B9u; }

// What spawn_grain decides for one grain.
struct Plan {
  double start;  // where on the ring its first sample is read
  float ratio;   // ring samples per output sample; below zero backwards
  float length;  // output samples
  float pan;
  float gain;
  float wait;    // samples until the next grain
  float place;   // the number thrown for its place, 0 to 1
};

// GrainDelay::spawn_grain again, line for line, with the device's own
// parameters, helpers and constants, and the dice thrown in its order.
// `loose` is how much of the half a wait may be moved by; below zero, the
// device's own amount: one less its coherence.
Plan plan(const GrainDelay& d, kit::Rng& dice, double now, float loose) {
  using namespace grain_delay;
  const float sr = d.sample_rate();
  const float length = d.param(kSize) * 0.001f * sr;
  const float overlap = d.param(kDensity);
  const float together = d.coherence(d.param(kSize) * 0.001f);

  const float semitones = d.param(kPitch) + d.pitch_spray_semitones() * dice.bipolar();
  float ratio =
      kit::clamp(kit::semitones_to_ratio(semitones), 1.0f / GrainDelay::kMaxRatio, GrainDelay::kMaxRatio);
  const bool reversed = dice.uniform() < d.param(kReverse);
  const float place = dice.uniform();
  float delay = (d.param(kTime) * 0.001f + d.spray_seconds() * place) * sr;
  const float pan = d.param(kSpread) * dice.bipolar();
  const float jitter = 0.5f * (loose < 0.0f ? 1.0f - together : loose) * dice.bipolar();

  double start;
  if (reversed) {
    delay = kit::max(delay, 0.5f * (1.0f + ratio) * length + 4.0f);
    start = now - delay + 0.5 * length * (1.0f + ratio);
    ratio = -ratio;
  } else {
    const float lead = 0.5f * (ratio - 1.0f) * length;
    delay = kit::max(delay, (lead < 0.0f ? -lead : lead) + 4.0f);
    start = now - delay - lead;
  }
  const float power = together * GrainDelay::coherent_power(overlap) +
                      (1.0f - together) * GrainDelay::scattered_power(overlap);
  return {start, ratio, length, pan, GrainDelay::kSqrtTwo / std::sqrt(power),
          kit::max(8.0f, length / overlap * (1.0f + jitter)), place};
}

float apart(double a, double b) { return static_cast<float>(a > b ? a - b : b - a); }

// One sample of a rig: what the device did, and what the lab read beside it.
struct Sample {
  float recorded[2] = {0.0f, 0.0f};
  float grains[2] = {0.0f, 0.0f};
  float cover = 0.0f;
  float out[2] = {0.0f, 0.0f};
  float rebuilt[2] = {0.0f, 0.0f};
  float steady[2] = {0.0f, 0.0f};
  bool ran = false;      // the device was awake, or woke, on this sample
  bool woke = false;     // it woke on this sample
  bool started = false;  // the device started a grain on this sample
  float until = 0.0f;    // the device's counter to its next grain, in samples
  double now = 0.0;      // the write point as that grain was placed
  double start = 0.0;
  float ratio = 1.0f;
  float length = 0.0f;
  float gain = 0.0f;
  float place = 0.0f;
  float off_rule = 0.0f;
};

// A device, and beside it the lab's own pool on the same ring.
struct Rig {
  GrainDelay device;
  Pool pool;
  kit::Rng own_dice;
  float until = 0.0f;
  bool own_on = false;
  kit::Svf tone_filter[2];
  kit::OnePole rumble[2];

  void start(float time_value, float feedback_value, float tone_value, float mix_value) {
    using namespace grain_delay;
    device.init(lab::kSampleRate);
    device.rng_.seed(seed_of(device.rng_.state));
    device.set_param(kTime, time_value);
    device.set_param(kSpray, spray.value);
    device.set_param(kPitch, pitch.value);
    device.set_param(kPitchSpray, pitch_spray.value);
    device.set_param(kSize, size.value);
    device.set_param(kDensity, density.value);
    device.set_param(kReverse, reverse.value);
    device.set_param(kFeedback, feedback_value);
    device.set_param(kTone, tone_value);
    device.set_param(kSpread, spread.value);
    device.set_param(kMix, mix_value);
    pool.reset();
    own_dice.seed(seed_of(0x9E3779B9u));
    until = 0.0f;
    own_on = false;
    for (int c = 0; c < 2; ++c) {
      tone_filter[c].reset();
      tone_filter[c].set(device.param(kTone), 0.6f, lab::kSampleRate);
      rumble[c].reset();
      rumble[c].set_cutoff(30.0f, lab::kSampleRate);
    }
  }

  // `rebuild`: add the device's grains up again and hold the lab to the
  // device. `own`: run the lab's pool too; it joins on the next grain the
  // device starts, so that with no Scatter the two start grains together.
  Sample step(float left, float right, bool rebuild, bool own) {
    Sample s;
    GrainDelay& d = device;
    const bool slept = d.asleep_;
    // A sleeping device stays asleep on silence, and does nothing.
    s.ran = !slept || left != 0.0f || right != 0.0f;
    s.woke = slept && s.ran;

    // The pool's sum, from the pool as it stands before the device adds it:
    // each grain's read of the ring, times its window, times its gain, in the
    // pool's order. A grain that starts on this sample adds nothing yet: its
    // window opens from zero.
    if (rebuild && !slept) {
      const Tape tape{d.line_, d.written_, d.valid_from_};
      for (const auto& one : d.pool_.grains_) {
        if (!one.active) continue;
        const float open = Pool::window_at(one.phase, one.edge);
        s.grains[0] += tape.read(0, one.position) * open * one.gain_left;
        s.grains[1] += tape.read(1, one.position) * open * one.gain_right;
        s.cover += open * one.gain_left;
      }
    }

    // A grain is due when the device's counter has run out, or as it wakes.
    const bool starting = s.ran && (slept || d.until_grain_ <= 0.0f);
    kit::Rng its_dice = d.rng_;
    const float waited = slept ? 0.0f : d.until_grain_;
    s.now = static_cast<double>(d.written_);

    d.in_left()[0] = left;
    d.in_right()[0] = right;
    d.process(1);

    if (!s.ran) {
      pool.reset();
      until = 0.0f;
      return s;
    }
    const int newest = static_cast<int>((d.written_ - 1) & (GrainDelay::kRingSize - 1));
    s.recorded[0] = d.line_[0].at(newest);
    s.recorded[1] = d.line_[1].at(newest);
    s.out[0] = d.out_left()[0];
    s.out[1] = d.out_right()[0];
    s.until = kit::max(d.until_grain_, 0.0f);

    if (starting) {
      for (const auto& one : d.pool_.grains_) {
        if (!one.active || one.phase != one.phase_step) continue;
        s.started = true;
        s.start = d.started_at_[0];
        s.ratio = d.started_ratio_[0];
        s.length = 1.0f / one.phase_step;
        s.gain = one.gain_left;
        if (rebuild) {
          const Plan p = plan(d, its_dice, s.now, -1.0f);
          s.place = p.place;
          float gain_left, gain_right;
          kit::pan_gains(p.pan, &gain_left, &gain_right);
          const float length = kit::max(p.length, 8.0f);
          // In samples: the start, the last sample's place by its speed, the
          // length, the wait. The gain's difference, a ratio, is added as it is.
          s.off_rule = apart(p.start, s.start) + apart(p.ratio, s.ratio) * length +
                       apart(1.0f / length, one.phase_step) * length * length +
                       apart(waited + p.wait - 1.0f, d.until_grain_) +
                       apart(gain_left * p.gain, one.gain_left) +
                       apart(gain_right * p.gain, one.gain_right);
        }
        break;
      }
    }

    if (rebuild) {
      // The device's output stages, on the sum: limit, tone, 30 Hz, mix.
      const float in[2] = {left, right};
      for (int c = 0; c < 2; ++c) {
        if (slept) {
          tone_filter[c].reset();
          rumble[c].reset();
        }
        float wet = 2.0f * kit::soft_clip(0.5f * s.grains[c]);
        wet = rumble[c].highpass(tone_filter[c].lowpass(wet));
        s.rebuilt[c] = in[c] * d.dry_gain_ + wet * d.wet_gain_;
      }
    }

    // The lab's own pool, in the device's order: start a grain if one is due,
    // count down, render. It reads the ring as the device's grains just did.
    if (own && !own_on && s.started) own_on = true;
    if (!own_on) return s;
    if (slept) {
      pool.reset();
      until = 0.0f;
    }
    const Tape tape{d.line_, d.written_ - 1, d.valid_from_};
    if (until <= 0.0f) {
      const Plan p = plan(d, own_dice, s.now, scatter.value);
      pool.spawn(p.start, p.ratio, p.length, p.pan, p.gain, shape.value);
      until += p.wait;
    }
    until -= 1.0f;
    pool.render(tape, &s.steady[0], &s.steady[1]);
    return s;
  }
};

Rig loop_rig;
Rig tone_rig;

// The grain delay so far: a function or two a piece, and run() to take a
// sample through the pieces there are. The ring, the pool, the dice and the
// filters are the kit's own, as the device's are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kRecord = 0, kGrain, kMany, kScatter, kPitch, kLoop };

  int pieces = kRecord;
  kit::DelayLine<GrainDelay::kRingSize> line[2];  // the ring: 21.8 s of memory a channel
  long long written = 0;                          // samples recorded so far: the write point
  long long valid_from = 0;                       // nothing recorded before this is read
  Pool pool;                                      // the kit's grain pool: twenty grains at most
  kit::Rng dice;
  float until = 0.0f;                             // samples until the next grain starts
  kit::Svf guard[2];
  kit::Svf tone_filter[2];
  kit::OnePole rumble[2];
  float dry_gain = 0.0f;
  float wet_gain = 1.0f;
  float out[2] = {0.0f, 0.0f};
  float cover = 0.0f;       // the windows of the sounding grains, each times its gain, added up
  bool started = false;     // a grain started on this sample: where, how fast, how long, how loud
  double born_at = 0.0;
  float born_ratio = 1.0f;
  float born_length = 0.0f;
  float born_gain = 0.0f;

  // A control whose piece the build has not reached yet stands at nothing.
  float has(Piece piece, const lab::Control& control) const { return pieces >= piece ? control.value : 0.0f; }

  // Record: each sample that comes in is written onto the ring at the write
  // point, and the write point moves on by one.
  void record(const float keep[2]) {
    for (int c = 0; c < 2; ++c) line[c].write(keep[c]);
    ++written;
  }

  // Read it back late: one read of the ring, Time behind the write point.
  float read_late(int c) const {
    const float delay = (time_ms.value * 0.001f) * lab::kSampleRate;
    return Tape{line, written, valid_from}.read(c, static_cast<double>(written) - delay);
  }

  // One grain: a place on the ring to start reading, a speed and a length,
  // handed to the kit's pool, which reads the ring from there under a window
  // that opens from nothing and closes to nothing. This first grain reads at
  // the speed of the recording, from Time behind, and the next one starts as
  // it ends.
  void one_grain() {
    const float length = size.value * 0.001f * lab::kSampleRate;
    const float delay = (time_ms.value * 0.001f) * lab::kSampleRate;
    const double start = static_cast<double>(written) - delay;
    pool.spawn(start, 1.0f, length, 0.0f, GrainDelay::kSqrtTwo, 1.0f);
    until += length;
    born(start, 1.0f, length, 1.0f);
  }

  // Many grains: the level. Windows spaced evenly over the same sound add in
  // amplitude: `overlap` of them sum to half their number, and at an overlap
  // of 1 the sum ripples by half of itself.
  static float power_alike(float overlap) {
    const float off_one = 1.0f - overlap * overlap;
    const float ripple = off_one > -1.0e-3f
                             ? 0.5f
                             : kit::SineTable::lookup(0.5f * overlap) / (kit::kPi * overlap * off_one);
    return 0.25f * overlap * overlap * (1.0f + 2.0f * ripple * ripple);
  }

  // Over unrelated sound they add in power: three eighths from each window.
  static float power_apart(float overlap) { return 0.375f * overlap; }

  // Scatter: each grain reads a random amount later than Time, up to Spray
  // squared seconds...
  float spray_seconds() const {
    const float amount = has(kScatter, spray);
    return amount * amount * GrainDelay::kMaxSpraySeconds;
  }
  float later() { return spray_seconds() * dice.uniform(); }

  // ...is thrown to a random place between left and right...
  float sideways() { return has(kScatter, spread) * dice.bipolar(); }

  // ...and once the grains no longer read the same sound, each wait between
  // two of them is moved by up to half of itself.
  float uneven(float together) { return 0.5f * (1.0f - together) * dice.bipolar(); }

  // How alike the sound is that overlapping grains read: 1 when they all read
  // the same place at the same speed, falling to 0 as Spray, Pitch or Pitch
  // Spray pull their places further apart than 0.2 ms. A reversed grain is
  // unlike the rest.
  float alike() const {
    const float seconds = size.value * 0.001f;
    const float off_speed = kit::semitones_to_ratio(has(kPitch, pitch)) - 1.0f;
    const float by_pitch = GrainDelay::kPitchOffset * seconds * off_speed;
    const float by_spray = GrainDelay::kSprayOffset * spray_seconds();
    const float by_detune = GrainDelay::kDetuneOffset * seconds * pitch_spray_semitones();
    const float apart = (by_pitch * by_pitch + by_spray * by_spray + by_detune * by_detune) /
                        (GrainDelay::kAlikeSeconds * GrainDelay::kAlikeSeconds);
    return std::exp(-0.5f * kit::min(apart, 60.0f)) * (1.0f - has(kPitch, reverse));
  }

  // Pitch: how fast a grain reads the ring. Twelve semitones is a doubling,
  // and Pitch Spray moves each grain up to an octave either way.
  float pitch_spray_semitones() const {
    const float amount = has(kPitch, pitch_spray);
    return amount * amount * GrainDelay::kMaxPitchSpraySemitones;
  }
  float speed() {
    const float semitones = has(kPitch, pitch) + pitch_spray_semitones() * dice.bipolar();
    return kit::clamp(kit::semitones_to_ratio(semitones), 1.0f / GrainDelay::kMaxRatio, GrainDelay::kMaxRatio);
  }

  // A grain that reads faster than the recording runs covers more ring than
  // it lasts, so it starts further back by half the difference: its middle
  // then reads the sample that is `delay` old. One read backwards starts
  // nearer the write point and runs away from it. Neither may come within
  // four samples of the write point.
  double placed(float* delay, float* ratio, bool reversed, float length) const {
    const double now = static_cast<double>(written);
    if (reversed) {
      *delay = kit::max(*delay, 0.5f * (1.0f + *ratio) * length + 4.0f);
      const double start = now - *delay + 0.5 * length * (1.0f + *ratio);
      *ratio = -*ratio;
      return start;
    }
    const float lead = 0.5f * (*ratio - 1.0f) * length;
    *delay = kit::max(*delay, (lead < 0.0f ? -lead : lead) + 4.0f);
    return now - *delay - lead;
  }

  // Start a grain as the device does, with the dice thrown in its order:
  // speed, direction, place, side, wait.
  void start_grain() {
    const float length = size.value * 0.001f * lab::kSampleRate;
    const float overlap = density.value;
    const float together = alike();

    float ratio = speed();
    const bool reversed = dice.uniform() < has(kPitch, reverse);
    float delay = (time_ms.value * 0.001f + later()) * lab::kSampleRate;
    const float pan = sideways();
    const float jitter = uneven(together);

    const double start = placed(&delay, &ratio, reversed, length);
    const float power = together * power_alike(overlap) + (1.0f - together) * power_apart(overlap);
    const float gain = GrainDelay::kSqrtTwo / std::sqrt(power);
    pool.spawn(start, ratio, length, pan, gain, 1.0f);
    until += kit::max(8.0f, length / overlap * (1.0f + jitter));
    born(start, ratio, length, gain * kit::kSqrtHalf);
  }

  // Round again: the grains' sum is limited by a curve that is a straight
  // line up to full scale, low-passed at Tone and high-passed at 30 Hz.
  float toned(int c, float wet) {
    wet = 2.0f * kit::soft_clip(0.5f * wet);
    return rumble[c].highpass(tone_filter[c].lowpass(wet));
  }

  // What is recorded: the input, and from the last piece on the grains' own
  // sound with it, times Feedback; low-passed to what the pitch can carry.
  float kept(int c, float in, float wet) {
    if (pieces < kPitch) return in;
    if (pieces < kLoop) return guard[c].lowpass(in);
    const float both = guard[c].lowpass(in + feedback.value * wet);
    return flush_denormal(kit::soft_clip(both));
  }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    const float in[2] = {left, right};
    float wet[2] = {0.0f, 0.0f};
    started = false;
    if (pieces >= kGrain) {
      covered();
      if (until <= 0.0f) {
        if (pieces >= kMany) start_grain();
        else one_grain();
      }
      until -= 1.0f;
      pool.render(Tape{line, written, valid_from}, &wet[0], &wet[1]);
    } else {
      wet[0] = read_late(0);
      wet[1] = read_late(1);
      cover = 1.0f;
    }
    float keep[2];
    for (int c = 0; c < 2; ++c) {
      if (pieces >= kLoop) wet[c] = toned(c, wet[c]);
      keep[c] = kept(c, in[c], wet[c]);
    }
    record(keep);
    for (int c = 0; c < 2; ++c) out[c] = pieces >= kLoop ? in[c] * dry_gain + wet[c] * wet_gain : wet[c];
  }

  // For the pictures: the windows of the grains that are sounding, each times
  // its gain on the left, added up; and the grain that has just started.
  void covered() {
    cover = 0.0f;
    for (const auto& one : pool.grains_) {
      if (one.active) cover += Pool::window_at(one.phase, one.edge) * one.gain_left;
    }
  }
  void born(double start, float ratio, float length, float gain) {
    started = true;
    born_at = start;
    born_ratio = ratio;
    born_length = length;
    born_gain = gain;
  }

  void start(int pieces_, uint32_t seed) {
    pieces = pieces_;
    for (int c = 0; c < 2; ++c) line[c].clear();
    written = 0;
    valid_from = 0;
    dice.seed(seed);
    const float fastest_up = kit::clamp(kit::semitones_to_ratio(pitch.value + pitch_spray_semitones()), 1.0f,
                                        GrainDelay::kMaxRatio);
    for (int c = 0; c < 2; ++c) {
      guard[c].set(0.45f * lab::kSampleRate / fastest_up, 0.7071f, lab::kSampleRate);
      tone_filter[c].set(tone.value, 0.6f, lab::kSampleRate);
      rumble[c].set_cutoff(30.0f, lab::kSampleRate);
    }
    dry_gain = kit::SineTable::cos_lookup(0.25f * mix.value);
    wet_gain = kit::SineTable::lookup(0.25f * mix.value);
    wake();
    rest();
  }

  // The device has woken: whatever the ring holds is from before the silence
  // and is not read again, no grain is sounding, and one is due at once.
  void wake() {
    valid_from = written;
    pool.reset();
    until = 0.0f;
    for (int c = 0; c < 2; ++c) {
      guard[c].reset();
      tone_filter[c].reset();
      rumble[c].reset();
    }
  }

  // The device is asleep: nothing is read, written or counted.
  void rest() {
    out[0] = out[1] = 0.0f;
    cover = 0.0f;
    started = false;
  }
};

lab::Build build{"Record, and read it back late|One grain and its window|Many grains|Scatter|Pitch|Round again",
                 Built::kLoop, -120.0f,
                 "The grain delay as built, all six pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// The one grain the lesson looks at, run again alone in a pool of one.
constexpr int kMostGrainSamples = 24064;  // 500 ms and a little
kit::GrainPool<1> alone;
float piece_at[kMostGrainSamples];
float window_at[kMostGrainSamples];
float grain_at[kMostGrainSamples];

constexpr int kMostGrains = 8192;
constexpr int kCloudRows = 6;
float cloud_at[kMostGrains][kCloudRows];
float built_cloud_at[kMostGrains][kCloudRows];
float throw_at[kMostGrains];

// A cloud tap from its rows.
void write_cloud(lab::Tap& tap, const float rows[][kCloudRows], int count, int frames) {
  if (count <= 0 || !tap.open(count * kCloudRows)) return;
  tap.columns = count;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(frames) / lab::kSampleRate;
  for (int g = 0; g < count; ++g) {
    for (int r = 0; r < kCloudRows; ++r) tap.data[g * kCloudRows + r] = rows[g][r];
  }
}

// How much of the end of the first pass the device can still hear at the
// start of the second, in samples: the furthest a grain reaches back (the
// device's own sum, in GrainDelay::control), once for each trip round the
// feedback loop that takes a sound down 100 dB, and a tenth of a second.
float remembered() {
  const float steepest = (pitch.value < 0.0f ? -pitch.value : pitch.value) +
                         pitch_spray.value * pitch_spray.value * GrainDelay::kMaxPitchSpraySemitones;
  const float fastest = kit::min(GrainDelay::kMaxRatio, kit::semitones_to_ratio(steepest));
  const float size_seconds = size.value * 0.001f;
  const float run = 0.5f * (1.0f + fastest) * size_seconds;
  const float furthest = time_ms.value * 0.001f + spray.value * spray.value * GrainDelay::kMaxSpraySeconds;
  const float reach = kit::max(furthest, run) + run + size_seconds + 0.05f;
  if (feedback.value >= 0.99f) return 1.0e9f;
  const float trips = feedback.value > 0.0f ? std::log(1.0e-5f) / std::log(feedback.value) : 0.0f;
  return (trips + 1.0f) * reach * lab::kSampleRate + 4800.0f;
}

// The spectrum of a piece of sound with silence either side of it.
void spectrum_of(lab::Tap& tap, const float* x, int count) {
  constexpr int kMargin = lab::kSpectrumSize;
  float* padded = lab::take(count + 2 * kMargin);
  if (!padded) return;
  for (int i = 0; i < count; ++i) padded[kMargin + i] = x[i];
  lab::spectrum_tap(tap, padded, count + 2 * kMargin);
}

// The lines: a 1 kHz sine through a second copy of the device at these
// settings (Time at its shortest, no feedback, the tone filter open, wet
// only), and through the lab's pool beside it. Each spectrum is the average
// of frames of 32768 samples, 1.46 Hz a bin, drawn 250 Hz either side of the
// pitch the sine is shifted to, in dB against the sine itself.
constexpr int kLinesSize = 32768;
constexpr int kLinesFrames = 2;
constexpr int kLinesReach = 171;  // bins either side: 250 Hz
constexpr int kLinesPoints = 2 * kLinesReach + 1;
constexpr float kToneHz = 1000.0f;
constexpr float kToneLevel = 0.25f;
kit::Fft<kLinesSize> lines_fft;
float lines_window[kLinesSize];
float lines_bins[kLinesSize];

// The two as they were last measured, with where their ends stand and the
// ten settings that reach them. They are measured again only when one of
// those has moved.
struct Lines {
  float device[kLinesPoints];
  float pool[kLinesPoints];
  float x0 = 0.0f;
  float x1 = 0.0f;
  float settings[10];
  bool kept = false;
};
Lines lines;

void lines_of(float* out, const float* x, float shifted) {
  const float bin = lab::kSampleRate / kLinesSize;
  const int centre = static_cast<int>(shifted / bin + 0.5f);
  lines.x0 = static_cast<float>(centre - kLinesReach) * bin - shifted;
  lines.x1 = static_cast<float>(centre + kLinesReach) * bin - shifted;
  static double power[kLinesPoints];
  for (int p = 0; p < kLinesPoints; ++p) power[p] = 0.0;
  for (int f = 0; f < kLinesFrames; ++f) {
    const float* from = x + f * (kLinesSize / 2);
    // The real part of bin k comes back at [k], the imaginary part at [N - k].
    lines_fft.forward_real([from](int n) { return from[n] * lines_window[n]; }, lines_bins);
    for (int p = 0; p < kLinesPoints; ++p) {
      const int k = centre - kLinesReach + p;
      if (k < 1 || k >= kLinesSize / 2) continue;
      const double re = lines_bins[k];
      const double im = lines_bins[kLinesSize - k];
      power[p] += re * re + im * im;
    }
  }
  // A sine of the tone's level under a Hann window puts level * N / 4 in its bin.
  const double full = static_cast<double>(kToneLevel) * (kLinesSize / 4.0);
  for (int p = 0; p < kLinesPoints; ++p) {
    out[p] = lab::power_to_db(static_cast<float>(power[p] / (kLinesFrames * full * full)));
  }
}

void measure_lines() {
  const float settings[10] = {spray.value,   pitch.value,  pitch_spray.value, size.value,     density.value,
                              reverse.value, spread.value, scatter.value,     throw_of.value, shape.value};
  if (!lines.kept || std::memcmp(settings, lines.settings, sizeof settings) != 0) {
    Rig& rig = tone_rig;
    rig.start(10.0f, 0.0f, 16000.0f, 1.0f);
    const float ratio = kit::clamp(kit::semitones_to_ratio(pitch.value), 1.0f / GrainDelay::kMaxRatio,
                                   GrainDelay::kMaxRatio);
    // Long enough for every grain to be reading the sine: the farthest a grain
    // reaches back, and one grain more.
    const float size_seconds = size.value * 0.001f;
    const float reach = 0.05f + rig.device.spray_seconds() + (1.5f + 0.5f * ratio) * size_seconds;
    const int warm = static_cast<int>(kit::min(reach, 2.5f) * lab::kSampleRate);
    const int kept = kLinesSize + (kLinesFrames - 1) * (kLinesSize / 2);
    float* from_device = lab::take(kept);
    float* from_pool = lab::take(kept);
    if (!from_device || !from_pool) return;
    const float turn = kit::kTwoPi * kToneHz / lab::kSampleRate;
    for (int i = 0; i < warm + kept; ++i) {
      const float x = kToneLevel * std::sin(turn * static_cast<float>(i % 48));  // 48 samples a cycle
      const Sample s = rig.step(x, x, false, true);
      if (i >= warm) {
        from_device[i - warm] = s.out[0];
        from_pool[i - warm] = s.steady[0];
      }
    }
    lines_of(lines.device, from_device, kToneHz * ratio);
    lines_of(lines.pool, from_pool, kToneHz * ratio);
    std::memcpy(lines.settings, settings, sizeof settings);
    lines.kept = true;
  }
  if (!lines_device.open(kLinesPoints) || !lines_steady.open(kLinesPoints)) return;
  lines_device.x0 = lines_steady.x0 = lines.x0;
  lines_device.x1 = lines_steady.x1 = lines.x1;
  for (int p = 0; p < kLinesPoints; ++p) {
    lines_device.set(p, lines.device[p]);
    lines_steady.set(p, lines.pool[p]);
  }
}

}  // namespace

void lab_setup() {
  lines_fft.init();
  for (int n = 0; n < kLinesSize; ++n) {
    lines_window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kLinesSize));
  }
}

void lab_render(int frames) {
  Rig& rig = loop_rig;
  rig.start(time_ms.value, feedback.value, tone.value, mix.value);
  const GrainDelay& d = rig.device;

  // The build part: the chosen step, and the whole build that is held to the
  // device. When the chosen step is the whole build, one copy is both.
  const bool whole = build.at() == build.compared_step;
  Built& show = whole ? held : shown;
  held.start(build.compared_step, d.rng_.state);
  if (!whole) shown.start(build.at(), d.rng_.state);
  double built_apart = 0.0, built_level = 0.0;
  int built_count = 0;

  // The grain to look at: the first to start at or after `look`, early enough
  // in the loop to be seen whole.
  const int length_samples = static_cast<int>(size.value * 0.001f * lab::kSampleRate);
  int latest = frames - 2 * length_samples - 64;
  if (latest < 0) latest = 0;
  int wanted = static_cast<int>(look.value * lab::kSampleRate);
  if (wanted > latest) wanted = latest;
  bool looking = false;
  bool looked = false;
  int grain_samples = 0;

  int cloud_count = 0;
  double off = 0.0, level = 0.0;
  float worst_rule = 0.0f;

  // Only the second time round the loop is kept (lab.h). Of the first, the
  // device is played as much of the end as it can remember (`remembered`):
  // before that it is asleep. The lab joins it a little before the second
  // pass: its own filters need a fifth of a second to stand where the
  // device's do, and its own pool three grains' length to hold every grain
  // still sounding.
  const float memory = remembered();
  const int first = memory < static_cast<float>(frames - 16) ? frames - 16 - static_cast<int>(memory) : 0;
  const int rebuild_from = frames - 9600;
  const int own_from = frames - 3 * length_samples - 64;

  const int total = lab::total();
  for (int i = first; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const Sample s = rig.step(left, right, i >= rebuild_from, i >= own_from);

    // The build keeps the device's hours: it wakes when the device wakes, and
    // while the device sleeps it does nothing.
    if (s.woke) {
      held.wake();
      if (!whole) shown.wake();
    }
    if (s.ran) {
      held.run(left, right);
      if (!whole) shown.run(left, right);
    } else {
      held.rest();
      if (!whole) shown.rest();
    }

    const bool kept = i >= frames && i < 2 * frames;
    if (i >= frames) {
      in_tap.put(i, left, right);
      recorded.put(i, s.recorded[0], s.recorded[1]);
      cover.put(i, s.cover);
      until_next.put(i, s.until * 1000.0f / lab::kSampleRate);
      grains.put(i, s.grains[0], s.grains[1]);
      steady.put(i, s.steady[0], s.steady[1]);
      built.put(i, show.out[0], show.out[1]);
      built_cover.put(i, show.cover);
      out_tap.put(i, s.out[0], s.out[1]);

      for (int c = 0; c < 2; ++c) {
        const double miss = static_cast<double>(s.rebuilt[c]) - s.out[c];
        off += miss * miss;
        level += static_cast<double>(s.out[c]) * s.out[c];
        const double built_miss = static_cast<double>(held.out[c]) - s.out[c];
        built_apart += built_miss * built_miss;
        built_level += static_cast<double>(s.out[c]) * s.out[c];
      }
      if (s.off_rule > worst_rule) worst_rule = s.off_rule;
    }

    if (show.started && kept && built_count < kMostGrains) {
      float* row = built_cloud_at[built_count++];
      row[0] = static_cast<float>(i - frames) / lab::kSampleRate;
      row[1] = kit::max(show.born_length, 8.0f) / lab::kSampleRate;
      row[2] = static_cast<float>((static_cast<double>(show.written - 1) - show.born_at) * 1000.0 /
                                  lab::kSampleRate);
      row[3] = show.born_ratio;
      row[4] = show.born_gain;
      row[5] = 0.0f;
    }

    const bool chosen = s.started && kept && !looking && !looked && i - frames >= wanted;
    if (s.started && kept && cloud_count < kMostGrains) {
      throw_at[cloud_count] = s.place;
      float* row = cloud_at[cloud_count++];
      row[0] = static_cast<float>(i - frames) / lab::kSampleRate;
      row[1] = kit::max(s.length, 8.0f) / lab::kSampleRate;
      row[2] = static_cast<float>((s.now - s.start) * 1000.0 / lab::kSampleRate);
      row[3] = s.ratio;
      row[4] = s.gain;
      row[5] = chosen ? 1.0f : 0.0f;
    }

    // The chosen grain again, alone: the same start, speed and length in a
    // pool of one, at the centre, at a gain of one, under the window Shape
    // asks for. It reads the ring on the samples the device's grain does.
    if (chosen) {
      alone.reset();
      alone.spawn(s.start, s.ratio, s.length, 0.0f, GrainDelay::kSqrtTwo, shape.value);
      looking = true;
    }
    if (looking) {
      const auto& one = alone.grains_[0];
      if (one.active && grain_samples < kMostGrainSamples) {
        const Tape tape{d.line_, d.written_ - 1, d.valid_from_};
        piece_at[grain_samples] = tape.read(0, one.position);
        window_at[grain_samples] = kit::GrainPool<1>::window_at(one.phase, one.edge);
        float alone_left = 0.0f, alone_right = 0.0f;
        alone.render(tape, &alone_left, &alone_right);
        grain_at[grain_samples] = alone_left;
        ++grain_samples;
      }
      if (!alone.grains_[0].active || grain_samples >= kMostGrainSamples) {
        looking = false;
        looked = true;
      }
    }
  }

  rebuilt.value = level > 0.0 ? lab::power_to_db(static_cast<float>(off / level)) : (off > 0.0 ? 0.0f : lab::kFloorDb);
  rule.value = worst_rule;
  build.difference.value = lab::ratio_db(built_apart, built_level);

  // The one grain: what it read, its window, and their product as the kit made it.
  if (grain_samples > 1) {
    const float ms = static_cast<float>(grain_samples - 1) * 1000.0f / lab::kSampleRate;
    const float top = lab::peak(piece_at, grain_samples);
    if (piece.open(grain_samples) && bell.open(grain_samples) && grain.open(grain_samples) &&
        window.open(grain_samples)) {
      piece.x1 = bell.x1 = grain.x1 = window.x1 = ms;
      piece.x0 = bell.x0 = grain.x0 = window.x0 = 0.0f;
      for (int n = 0; n < grain_samples; ++n) {
        piece.set(n, piece_at[n]);
        bell.set(n, window_at[n] * top);
        grain.set(n, grain_at[n]);
        window.set(n, window_at[n]);
      }
    }
    spectrum_of(cut_spectrum, piece_at, grain_samples);
    spectrum_of(grain_spectrum, grain_at, grain_samples);
  }

  write_cloud(cloud, cloud_at, cloud_count, frames);
  if (cloud_count > 1 && throws.open(cloud_count)) {
    throws.x0 = 0.0f;
    throws.x1 = static_cast<float>(cloud_count - 1);
    for (int g = 0; g < cloud_count; ++g) throws.set(g, throw_at[g]);
  }

  // With one piece there are no grains: the cloud is the one read head, Time
  // behind the write point for the whole loop.
  if (show.pieces == Built::kRecord) {
    float* row = built_cloud_at[0];
    row[0] = 0.0f;
    row[1] = static_cast<float>(frames) / lab::kSampleRate;
    row[2] = time_ms.value;
    row[3] = 1.0f;
    row[4] = 1.0f;
    row[5] = 2.0f;
    built_count = 1;
  }
  write_cloud(built_cloud, built_cloud_at, built_count, frames);

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.data, frames);
  measure_lines();
}
