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
// The build part puts a compressor together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h): a wire; then the level,
// measured with the kit's filters as the device measures it; then threshold
// and ratio, which turn the level into a gain. The path writes the "built"
// taps and leaves every other tap as it was. Two copies of it run: one at the
// step the reader chose, which is what the taps show, and one held at the
// step that measures the level, whose reading is compared on every render
// with the power in the device's own detector (the "builtDifference" check).
// The step after it is written for the lesson: it is a compressor with a hard
// knee and no attack or release, which the device never is.

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
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap curve{"curve", "Level out against level in", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap curve_formula{"curveFormula", "The curve as written", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The curve and ballistics worked out again, against the device's reduction", "dB"};
lab::Check curve_error{"curveError", "The measured curve against the curve as written", "dB"};

// The build part's pieces, in the order the steps add them.
enum Piece : int { kWire = 0, kMeasure = 1, kCurve = 2 };

lab::Build build{"A wire|Measure the level|Threshold and ratio", kMeasure, -100.0f,
                 "The level the build measures, against the device's own detector"};

lab::Tap built{"built", "The compressor so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kKit, 1, "dB"};
lab::Tap built_gain{"builtGain", "Gain, as built", lab::kControl, lab::kLesson, 1, "dB"};

// The compressor so far: the pieces up to `pieces`, one sample at a time.
struct Built {
  int pieces = kWire;
  kit::Svf sidechain[2];
  kit::OnePole rms[2];
  kit::ControlClock clock;
  float power = 0.0f;
  float level = AmbientComp::kFloorDb;
  float reduction = 0.0f;  // dB, 0 or below
  float gain = 1.0f;
  float gain_target = 1.0f;
  float gain_step = 0.0f;
  bool ticked = false;  // the last sample was one the level is read on
  float out[2] = {0.0f, 0.0f};

  void start(int pieces_) {
    pieces = pieces_;
    for (kit::Svf& filter : sidechain) filter.set(sc_low_cut.value, kit::kSqrtHalf, lab::kSampleRate);
    for (kit::OnePole& stage : rms) {
      stage.set_cutoff(1.0f / (kit::kTwoPi * AmbientComp::kRmsSeconds), lab::kSampleRate);
    }
    rest();
  }

  // Nothing is sounding: forget the level and the gain, as the device does.
  void rest() {
    for (kit::Svf& filter : sidechain) filter.reset();
    for (kit::OnePole& stage : rms) stage.reset();
    clock.reset(AmbientComp::kControlPeriod);
    power = 0.0f;
    level = AmbientComp::kFloorDb;
    reduction = 0.0f;
    gain = 1.0f;
    gain_target = 1.0f;
    gain_step = 0.0f;
    ticked = false;
  }

  void run(float left, float right) {
    // A wire: what goes in comes out.
    out[0] = left;
    out[1] = right;
    ticked = false;
    if (pieces < kMeasure) return;

    // Measure the level: the mean power of the two channels above "Ignore
    // below", through two 30 ms one-poles, read in dB every 16 samples.
    const float heard_left = sidechain[0].highpass(left);
    const float heard_right = sidechain[1].highpass(right);
    power = rms[1].lowpass(rms[0].lowpass(0.5f * (heard_left * heard_left + heard_right * heard_right)));
    ticked = clock.tick();
    if (ticked) level = power > AmbientComp::kFloorPower ? 10.0f * std::log10(power) : AmbientComp::kFloorDb;
    if (pieces < kCurve) return;

    // Threshold and ratio: every dB the level stands over the threshold is
    // let through as 1 / ratio of a dB. The gain that does it is aimed at on
    // each reading and ramped to over the 16 samples until the next.
    if (ticked) {
      const float over = level - threshold.value;
      reduction = over > 0.0f ? (1.0f / ratio.value - 1.0f) * over : 0.0f;
      gain = gain_target;
      gain_target = kit::db_to_gain(reduction);
      gain_step = (gain_target - gain) * (1.0f / static_cast<float>(AmbientComp::kControlPeriod));
    }
    gain += gain_step;
    out[0] = left * gain;
    out[1] = right * gain;
  }
};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // at the step that is compared with the device

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

constexpr int kCurvePoints = 61;
constexpr int kSettle = 19200;  // 0.4 s
float settle_sine[kSettle];     // the 1 kHz sine the curve is measured with, at a peak of 1

// The curve as it was last measured, and the four settings that reach it.
// It is measured again only when one of them has moved.
float curve_measured[kCurvePoints];
float curve_written[kCurvePoints];
float curve_worst = 0.0f;
float curve_settings[4];
bool curve_kept = false;

// The static curve, measured: a steady 1 kHz sine at each level through a
// device at rest, attack at its shortest, read once the gain has settled.
void measure_curve() {
  if (!curve.open(kCurvePoints) || !curve_formula.open(kCurvePoints)) return;
  curve.x0 = curve_formula.x0 = -60.0f;
  curve.x1 = curve_formula.x1 = 0.0f;
  const float settings[4] = {threshold.value, ratio.value, knee.value, sc_low_cut.value};
  if (!curve_kept || std::memcmp(settings, curve_settings, sizeof settings) != 0) {
    curve_worst = 0.0f;
    for (int p = 0; p < kCurvePoints; ++p) {
      const float level_db = -60.0f + static_cast<float>(p);
      // A sine on both channels reads 3 dB under its peak (ambient_comp.h).
      const float amplitude = kit::db_to_gain(level_db + 3.0103f);
      configure(probe, 10.0f, 0.1f, 1.0f, 0.0f, 1.0f);
      for (int i = 0; i < kSettle; i += 16) {
        for (int j = 0; j < 16; ++j) {
          const float x = amplitude * settle_sine[i + j];
          probe.in_left()[j] = x;
          probe.in_right()[j] = x;
        }
        probe.process(16);
      }
      const float measured = level_db + static_cast<float>(probe.reduction_);
      const float written = level_db + knee_curve(level_db, threshold.value, knee.value, 1.0f / ratio.value - 1.0f);
      curve_measured[p] = measured;
      curve_written[p] = written;
      const float error = measured > written ? measured - written : written - measured;
      if (error > curve_worst) curve_worst = error;
    }
    std::memcpy(curve_settings, settings, sizeof settings);
    curve_kept = true;
  }
  for (int p = 0; p < kCurvePoints; ++p) {
    curve.set(p, curve_measured[p]);
    curve_formula.set(p, curve_written[p]);
  }
  curve_error.value = curve_worst;
}

}  // namespace

void lab_setup() {
  const float step = kit::kTwoPi * 1000.0f / lab::kSampleRate;
  for (int n = 0; n < kSettle; ++n) settle_sine[n] = std::sin(step * static_cast<float>(n));
}

void lab_render(int frames) {
  (void)frames;
  configure(comp, attack.value, release.value, tails.value, makeup.value, mix.value);

  // The lesson's own copy of the control step, fed from the device's state.
  double rebuilt_reduction = 0.0;
  float slow = -100.0f;
  float worst = 0.0f;
  bool was_resting = true;
  float level_now = -100.0f;
  float target_now = 0.0f;

  // The build part: the chosen step, and the step that is held to the device.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    comp.in_left()[0] = left;
    comp.in_right()[0] = right;
    const bool ticks = comp.clock_.counter == 0;  // the device steps its gain on this sample
    comp.process(1);

    in_tap.put(i, left, right);
    sidechain.put(i, comp.sidechain_[0].high, comp.sidechain_[1].high);
    out_tap.put(i, comp.out_left()[0], comp.out_right()[0]);

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
    // measured, and the build forgets with it.
    if (comp.resting_) {
      shown.rest();
      held.rest();
      shown.out[0] = left;
      shown.out[1] = right;
    } else {
      shown.run(left, right);
      held.run(left, right);
      if (held.ticked && i >= lab::frames()) {
        const double apart = static_cast<double>(held.power) - comp.rms_[1].state;
        built_apart += apart * apart;
        built_whole += static_cast<double>(comp.rms_[1].state) * comp.rms_[1].state;
      }
    }
    built.put(i, shown.out[0], shown.out[1]);

    if (i % lab::kControlPeriod == 0) {
      built_level.put(i, shown.level);
      built_gain.put(i, shown.reduction);
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
}
