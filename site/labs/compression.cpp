// Compression: the Ambient Compressor (cpp/devices/ambient-comp)
// run one sample at a time, so every stage of its side chain can be read out
// of the device itself as it works.
//
//   in ──┬───────────────────────────────────────► × gain × make-up ──► mix ──► out
//        └──► high-pass ──► RMS ──► dB ──► curve ──► attack / release
//
// Read from the device: the high-passed side chain, the detector's power, the
// reduction after attack and release, the gain, the output. The level in dB
// and the curve's answer are locals of the device's control step and are not
// kept, so the lab works them out again from the device's own power,
// threshold, knee and slope ("lesson"), runs them through the same attack and
// release, and reports how far that lands from the reduction the device
// stored (the "rebuilt" check). The level after the first of the detector's
// two poles is the device's own state too, put into dB here.
//
// Two taps are a meter of the lesson's own, one on the input and one on the
// output: the mean of the two channels' squares through two 30 ms one-poles,
// in dB, which is the detector's measure without its high-pass. They let a
// picture set how loud the sound went in beside how loud it came out.
//
// Beside the loop there are pictures that are not the loop: the static curve,
// measured by playing a steady tone at each level through a second device,
// once as the reduction it settles at and once as the level that comes out
// with make-up and mix; what the side chain's high-pass does to each
// frequency, from a kit filter set as the device sets its own; and the 128
// samples of the loop in which the gain moves most, as the device holds its
// aim between readings and as it ramps to it.
//
// The build part puts a compressor together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h). It has seven pieces, each
// a function of `Built` below, in the order the steps add them: a wire; the
// level, measured with the kit's filters as the device measures it; threshold
// and ratio; the knee; attack and release; make-up; mix. The path writes the
// "built" taps and leaves every other tap as it was. Two copies of it run: one
// at the step the reader chose, which is what the taps show, and one with
// all seven pieces, whose output is compared on every render with the
// device's own output (the "builtDifference" check). With all seven the build
// does to a sample what the device does, in the same order, so the two are
// the same sample for sample. A step before the last is the lesson's own: a
// compressor with a piece missing, which the device never is. One thing the
// build does not rebuild: when the device rests after half a second of
// silence, the build is told, and forgets what it measured with it.

#include "lab.h"

#include <cstring>

#include "../../cpp/devices/ambient-comp/ambient_comp.h"

using namespace livemix;

namespace {

AmbientComp comp;
AmbientComp probe;  // a second device, for measuring the static curve

lab::Control threshold{"threshold", "Threshold", "dB", -60.0f, 0.0f, -24.0f};
lab::Control ratio{"ratio", "Ratio", ":1", 1.0f, 10.0f, 4.0f};
lab::Control knee{"knee", "Knee", "dB", 0.0f, 24.0f, 6.0f};
lab::Control attack{"attack", "Attack", "ms", 10.0f, 3000.0f, 10.0f, lab::kLog};
lab::Control release{"release", "Release", "s", 0.1f, 20.0f, 0.3f, lab::kLog};
lab::Control tails{"tails", "Tails", "", 0.0f, 1.0f, 1.0f, lab::kLinear, "Hold|Release"};
lab::Control sc_low_cut{"scLowCut", "Ignore below", "Hz", 20.0f, 300.0f, 90.0f, lab::kLog};
lab::Control makeup{"makeup", "Make-up", "dB", -12.0f, 24.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap sidechain{"sidechain", "Side chain, high-passed", lab::kAudio, lab::kDevice, 2};
lab::Tap level_one{"levelOnePole", "Level after one pole", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap target{"target", "What the curve asks for", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap reduction{"reduction", "Gain reduction", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap gain{"gain", "Gain", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap meter_in{"meterIn", "Level going in", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap meter_out{"meterOut", "Level coming out", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap removed{"removed", "What was taken away: input less output", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap curve{"curve", "Level out against level in", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap curve_formula{"curveFormula", "The curve as written", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap curve_whole{"curveWhole", "Level out, with make-up and mix", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap sidechain_response{"sidechainResponse", "What the detector hears of each frequency", lab::kSpectrum,
                            lab::kKit, 1, "dB"};
lab::Tap gain_held{"gainHeld", "The gain, held between readings", lab::kCurve, lab::kDevice, 1};
lab::Tap gain_ramped{"gainRamped", "The gain, ramped", lab::kCurve, lab::kDevice, 1};

lab::Check rebuilt{"rebuilt", "The curve and ballistics worked out again, against the device's reduction", "dB"};
lab::Check curve_error{"curveError", "The measured curve against the curve as written", "dB"};

lab::Tap built{"built", "The compressor so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kKit, 1, "dB"};
lab::Tap built_target{"builtTarget", "What the built curve asks for", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_gain{"builtGain", "Gain, as built", lab::kControl, lab::kLesson, 1, "dB"};

// The soft knee as ambient_comp.h writes it: dB of reduction for a level.
float knee_curve(float level_db, float threshold_db, float knee_db, float slope) {
  const float over = level_db - threshold_db;
  if (2.0f * over >= knee_db) return slope * over;
  if (2.0f * over > -knee_db) {
    const float into = over + 0.5f * knee_db;
    return slope * into * into / (2.0f * knee_db);
  }
  return 0.0f;
}

// The compressor so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kWire = 0, kMeasure, kCurve, kKnee, kTimes, kMakeup, kMix };

  int pieces = kWire;
  kit::Svf sidechain[2];
  kit::OnePole rms[2];
  kit::ControlClock clock;
  bool ticked = false;      // this sample is one the level is read on
  float power = 0.0f;       // the mean of the squares, smoothed
  float level = AmbientComp::kFloorDb;
  float target = 0.0f;      // dB, 0 or below: what the curve asks for
  double reduction = 0.0;   // dB, 0 or below: what is in force
  float slow = AmbientComp::kFloorDb;  // the level's own average over a second
  float attack_coeff = 0.0f;
  float release_coeff = 0.0f;
  float slow_coeff = 0.0f;
  float gain = 1.0f;
  float gain_target = 1.0f;
  float gain_step = 0.0f;
  float lift = 1.0f;        // the make-up, as a number to multiply by
  float applied = 1.0f;     // what the sound is multiplied by
  float out[2] = {0.0f, 0.0f};

  // A wire: what goes in comes out, times one number, and the number is 1.
  // Every piece after this one is a way of changing that number.
  void wire(float left, float right) {
    out[0] = left * applied;
    out[1] = right * applied;
  }

  // Measure the level: the mean of the two channels' squares, of what is
  // above "Ignore below", smoothed by two 30 ms one-poles and read in dB
  // once every 16 samples.
  void measure(float left, float right) {
    const float heard_left = sidechain[0].highpass(left);
    const float heard_right = sidechain[1].highpass(right);
    power = rms[1].lowpass(rms[0].lowpass(0.5f * (heard_left * heard_left + heard_right * heard_right)));
    ticked = clock.tick();
    if (ticked) level = power > AmbientComp::kFloorPower ? 10.0f * std::log10(power) : AmbientComp::kFloorDb;
  }

  // Threshold and ratio: of every dB the level stands over the threshold,
  // 1 / ratio of a dB is let through and the rest is taken away. The answer
  // is a change of gain in dB, 0 or below.
  float corner() const {
    const float over = level - threshold.value;
    const float slope = 1.0f / ratio.value - 1.0f;
    return over > 0.0f ? slope * over : 0.0f;
  }

  // Knee: the corner at the threshold, rounded. It is the same answer far
  // from the threshold, and a parabola for half a knee either side of it.
  float rounded() const {
    const float slope = 1.0f / ratio.value - 1.0f;
    return knee_curve(level, threshold.value, knee.value, slope);
  }

  // Attack and release: the reduction no longer jumps to what the curve asks
  // for. On each reading it covers a fixed share of the distance: the
  // attack's share when more reduction is asked for, the release's when
  // less. With Tails on Hold the release waits while the sound dies away,
  // which is while the level is 1.5 dB or more under its own average.
  void follow() {
    slow = flush_denormal(level + (slow - level) * slow_coeff);
    if (slow < level - AmbientComp::kDyingDb) slow = level - AmbientComp::kDyingDb;
    const bool dying = !tails.on() && level < slow - AmbientComp::kDyingDb;
    if (target < reduction) {
      reduction = target + (reduction - target) * attack_coeff;
    } else if (!dying) {
      reduction = target + (reduction - target) * release_coeff;
    }
    if (reduction > -kDenormalThreshold) reduction = 0.0;
  }

  // The reduction in dB becomes a number to multiply by. It is aimed at on
  // each reading and walked to over the 16 samples until the next.
  void aim() {
    gain = gain_target;
    gain_target = kit::db_to_gain(static_cast<float>(reduction));
    gain_step = (gain_target - gain) * (1.0f / static_cast<float>(AmbientComp::kControlPeriod));
  }

  // Make-up: one more gain after the compressor's, fixed, to give back what
  // was taken. `lift` is the Make-up control's dB as a number to multiply by.
  float made_up() const { return gain * lift; }

  // Mix: some of the sound as it went in, beside the compressed sound. Both
  // are the same sample at different gains, so the blend is one number too.
  float blended() const { return 1.0f - mix.value + mix.value * gain * lift; }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    ticked = false;
    if (pieces >= kMeasure) measure(left, right);
    if (pieces >= kCurve) {
      if (ticked) {
        target = pieces >= kKnee ? rounded() : corner();
        if (pieces >= kTimes) follow();
        else reduction = target;
        aim();
      }
      gain += gain_step;
    }
    applied = pieces >= kMix ? blended() : pieces >= kMakeup ? made_up() : gain;
    wire(left, right);
  }

  void start(int pieces_) {
    pieces = pieces_;
    const float tick_rate = lab::kSampleRate / static_cast<float>(AmbientComp::kControlPeriod);
    for (kit::Svf& filter : sidechain) filter.set(sc_low_cut.value, kit::kSqrtHalf, lab::kSampleRate);
    for (kit::OnePole& stage : rms) {
      stage.set_cutoff(1.0f / (kit::kTwoPi * AmbientComp::kRmsSeconds), lab::kSampleRate);
    }
    attack_coeff = kit::time_to_coeff(attack.value * 0.001f, tick_rate);
    release_coeff = kit::time_to_coeff(release.value, tick_rate);
    slow_coeff = kit::time_to_coeff(AmbientComp::kSlowSeconds, tick_rate);
    lift = kit::db_to_gain(makeup.value);
    rest();
  }

  // Nothing is sounding: forget the level and the gain, as the device does.
  void rest() {
    for (kit::Svf& filter : sidechain) filter.reset();
    for (kit::OnePole& stage : rms) stage.reset();
    clock.reset(AmbientComp::kControlPeriod);
    ticked = false;
    power = 0.0f;
    level = AmbientComp::kFloorDb;
    target = 0.0f;
    reduction = 0.0;
    slow = AmbientComp::kFloorDb;
    gain = 1.0f;
    gain_target = 1.0f;
    gain_step = 0.0f;
    applied = 1.0f;
  }
};

lab::Build build{"A wire|Measure the level|Threshold and ratio|Knee|Attack and release|Make-up|Mix", Built::kMix,
                 -120.0f, "The compressor as built, all seven pieces, against the device's own output"};

// The lesson's meter: how loud a sound is, as the detector measures it but
// with nothing filtered out first. It never reads under -80 dB.
struct Meter {
  kit::OnePole rms[2];

  void start() {
    for (kit::OnePole& stage : rms) {
      stage.set_cutoff(1.0f / (kit::kTwoPi * AmbientComp::kRmsSeconds), lab::kSampleRate);
      stage.reset();
    }
  }
  float read(float left, float right) {
    const float power = rms[1].lowpass(rms[0].lowpass(0.5f * (left * left + right * right)));
    return power > 1.0e-8f ? 10.0f * std::log10(power) : -80.0f;
  }
};

Meter going_in;
Meter coming_out;

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

void configure(AmbientComp& device, float attack_ms, float release_s, float tails_value, float makeup_db,
               float mix_value) {
  using namespace ambient_comp;
  device.init(lab::kSampleRate);
  device.set_param(kThreshold, threshold.value);
  device.set_param(kRatio, ratio.value);
  device.set_param(kKnee, knee.value);
  device.set_param(kAttack, attack_ms);
  device.set_param(kRelease, release_s);
  device.set_param(kTails, tails_value);
  device.set_param(kScLowCut, sc_low_cut.value);
  device.set_param(kMakeup, makeup_db);
  device.set_param(kMix, mix_value);
}

constexpr int kCurvePoints = 61;
constexpr int kSettle = 19200;  // 0.4 s
constexpr int kCycle = 48;      // one cycle of the 1 kHz sine: what the level that comes out is read over
float settle_sine[kSettle];     // the 1 kHz sine the curve is measured with, at a peak of 1

// The curve as it was last measured, and the six settings that reach it.
// It is measured again only when one of them has moved.
float curve_measured[kCurvePoints];
float curve_written[kCurvePoints];
float curve_out[kCurvePoints];
float curve_worst = 0.0f;
float curve_settings[6];
bool curve_kept = false;

// The static curve, measured: a steady 1 kHz sine at each level through a
// device at rest, attack at its shortest, read once the gain has settled.
// The reduction is the device's own state; the level that comes out is the
// mean power of its output over the last cycle, as the detector would read it.
void measure_curve() {
  if (!curve.open(kCurvePoints) || !curve_formula.open(kCurvePoints) || !curve_whole.open(kCurvePoints)) return;
  curve.x0 = curve_formula.x0 = curve_whole.x0 = -60.0f;
  curve.x1 = curve_formula.x1 = curve_whole.x1 = 0.0f;
  const float settings[6] = {threshold.value, ratio.value, knee.value, sc_low_cut.value, makeup.value, mix.value};
  if (!curve_kept || std::memcmp(settings, curve_settings, sizeof settings) != 0) {
    curve_worst = 0.0f;
    for (int p = 0; p < kCurvePoints; ++p) {
      const float level_db = -60.0f + static_cast<float>(p);
      // A sine on both channels reads 3 dB under its peak (ambient_comp.h).
      const float amplitude = kit::db_to_gain(level_db + 3.0103f);
      configure(probe, 10.0f, 0.1f, 1.0f, makeup.value, mix.value);
      double out_power = 0.0;
      for (int i = 0; i < kSettle; i += 16) {
        for (int j = 0; j < 16; ++j) {
          const float x = amplitude * settle_sine[i + j];
          probe.in_left()[j] = x;
          probe.in_right()[j] = x;
        }
        probe.process(16);
        if (i >= kSettle - kCycle) {
          for (int j = 0; j < 16; ++j) out_power += static_cast<double>(probe.out_left()[j]) * probe.out_left()[j];
        }
      }
      const float measured = level_db + static_cast<float>(probe.reduction_);
      const float written = level_db + knee_curve(level_db, threshold.value, knee.value, 1.0f / ratio.value - 1.0f);
      curve_measured[p] = measured;
      curve_written[p] = written;
      curve_out[p] = lab::power_to_db(static_cast<float>(out_power / kCycle));
      const float error = measured > written ? measured - written : written - measured;
      if (error > curve_worst) curve_worst = error;
    }
    std::memcpy(curve_settings, settings, sizeof settings);
    curve_kept = true;
  }
  for (int p = 0; p < kCurvePoints; ++p) {
    curve.set(p, curve_measured[p]);
    curve_formula.set(p, curve_written[p]);
    curve_whole.set(p, curve_out[p]);
  }
  curve_error.value = curve_worst;
}

// What the side chain's high-pass lets through at each frequency: one unit
// sample through a kit filter set as the device sets its own, and the level
// of what rings out at each frequency.
constexpr int kRing = 8192;
float ring[kRing];

void measure_sidechain() {
  kit::Svf filter;
  filter.set(sc_low_cut.value, kit::kSqrtHalf, lab::kSampleRate);
  for (int n = 0; n < kRing; ++n) ring[n] = filter.highpass(n == 0 ? 1.0f : 0.0f);
  lab::response_tap(sidechain_response, ring, kRing);
}

// The 128 samples of the loop in which the gain moves most: the device's aim,
// which holds still between readings, and the gain it ramps towards that aim.
constexpr int kGainPoints = 128;

void gain_window(const float* aimed, const float* ramped, int frames) {
  if (!aimed || !ramped || frames < kGainPoints) return;
  if (!gain_held.open(kGainPoints) || !gain_ramped.open(kGainPoints)) return;
  int at = 0;
  float most = 0.0f;
  for (int n = 1; n < frames; ++n) {
    const float jump = aimed[n] > aimed[n - 1] ? aimed[n] - aimed[n - 1] : aimed[n - 1] - aimed[n];
    if (jump > most) {
      most = jump;
      at = n;
    }
  }
  int from = at - 40;
  if (from < 0) from = 0;
  if (from > frames - kGainPoints) from = frames - kGainPoints;
  gain_held.x0 = gain_ramped.x0 = 0.0f;
  gain_held.x1 = gain_ramped.x1 = static_cast<float>(kGainPoints - 1);
  for (int n = 0; n < kGainPoints; ++n) {
    gain_held.set(n, aimed[from + n]);
    gain_ramped.set(n, ramped[from + n]);
  }
}

}  // namespace

void lab_setup() {
  const float step = kit::kTwoPi * 1000.0f / lab::kSampleRate;
  for (int n = 0; n < kSettle; ++n) settle_sine[n] = std::sin(step * static_cast<float>(n));
}

void lab_render(int frames) {
  configure(comp, attack.value, release.value, tails.value, makeup.value, mix.value);

  // The lesson's own copy of the control step, fed from the device's state.
  double rebuilt_reduction = 0.0;
  float slow = -100.0f;
  float worst = 0.0f;
  bool was_resting = true;
  float level_now = -100.0f;
  float target_now = 0.0f;

  // The build part: the chosen step, and the whole build that is held to the device.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;

  going_in.start();
  coming_out.start();

  // The gain of the pass that is kept, sample by sample.
  float* aimed = lab::take(frames);
  float* ramped = lab::take(frames);

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    comp.in_left()[0] = left;
    comp.in_right()[0] = right;
    const bool ticks = comp.clock_.counter == 0;  // the device steps its gain on this sample
    comp.process(1);
    const float out_left = comp.out_left()[0];
    const float out_right = comp.out_right()[0];

    in_tap.put(i, left, right);
    sidechain.put(i, comp.sidechain_[0].high, comp.sidechain_[1].high);
    removed.put(i, left - out_left, right - out_right);
    const float loud_in = going_in.read(left, right);
    const float loud_out = coming_out.read(out_left, out_right);
    out_tap.put(i, out_left, out_right);
    if (i >= frames && i < 2 * frames && aimed && ramped) {
      aimed[i - frames] = comp.gain_target_;
      ramped[i - frames] = comp.gain_;
    }

    // At rest the device forgets its gain; the copy forgets with it.
    if (comp.resting_) {
      rebuilt_reduction = 0.0;
      slow = -100.0f;
      was_resting = true;
    } else if (ticks || was_resting) {
      was_resting = false;
      const float power = comp.rms_[1].state;
      const float level_db = power > 1.0e-10f ? 10.0f * std::log10(power) : -100.0f;
      const float wanted = knee_curve(level_db, comp.threshold_.value, comp.knee_, comp.slope_);
      slow = level_db + (slow - level_db) * comp.slow_coeff_;
      if (slow < level_db - 1.5f) slow = level_db - 1.5f;
      const bool dying = comp.hold_tails_ && level_db < slow - 1.5f;
      if (wanted < rebuilt_reduction) {
        rebuilt_reduction = wanted + (rebuilt_reduction - wanted) * comp.attack_coeff_;
      } else if (!dying) {
        rebuilt_reduction = wanted + (rebuilt_reduction - wanted) * comp.release_coeff_;
      }
      level_now = level_db;
      target_now = wanted;
      const float error = static_cast<float>(rebuilt_reduction - comp.reduction_);
      const float distance = error < 0.0f ? -error : error;
      if (i >= lab::frames() && distance > worst) worst = distance;
    }

    // The build part, beside the device. At rest the device forgets what it
    // measured and is a wire; the build forgets with it, and is one too.
    if (comp.resting_) {
      shown.rest();
      held.rest();
      shown.wire(left, right);
      held.wire(left, right);
    } else {
      shown.run(left, right);
      held.run(left, right);
    }
    if (i >= lab::frames()) {
      const double apart_left = static_cast<double>(held.out[0]) - out_left;
      const double apart_right = static_cast<double>(held.out[1]) - out_right;
      built_apart += apart_left * apart_left + apart_right * apart_right;
      built_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
    }
    built.put(i, shown.out[0], shown.out[1]);

    if (i % lab::kControlPeriod == 0) {
      meter_in.put(i, loud_in);
      meter_out.put(i, loud_out);
      built_level.put(i, shown.level);
      built_target.put(i, shown.target);
      built_gain.put(i, lab::to_db(shown.applied));
      const float one_pole = comp.rms_[0].state;
      level_one.put(i, comp.resting_ || one_pole <= 1.0e-10f ? -100.0f : 10.0f * std::log10(one_pole));
      level.put(i, level_now);
      target.put(i, target_now);
      reduction.put(i, static_cast<float>(comp.reduction_));
      gain.put(i, lab::to_db(comp.gain_));
    }
  }
  rebuilt.value = worst;
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  measure_curve();
  measure_sidechain();
  gain_window(aimed, ramped, frames);
}
