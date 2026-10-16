// Lesson 18, granular sound: the Grain Delay (cpp/devices/grain-delay) run one
// sample at a time, with the kit's grain pool (cpp/kit/grains.h) read as it
// works.
//
//   in ──(+)──► anti-alias ──► limit ──► ring ──► grains ──► limit ─► tone ─► 30 Hz ──┬─► out
//         ▲                                 (kit::GrainPool)                           │
//         └───────────────────────────── feedback ◄────────────────────────────────────┘
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
// Its sprays start at zero here. One thing it will not turn off: once its
// grains read unrelated sound (any Pitch, any spray, any Reverse) it moves
// each wait between grains by up to half. To show what that is for, the lab
// keeps a second pool of the kit's ("kit"), reading the device's own ring,
// which it starts by the device's formulas (spawn_grain, written out again in
// `plan` below) with that one term on a control of its own, Scatter. The
// "rule" check holds `plan` to the device: for every grain the device starts,
// the start, speed, length, gain and wait it works out against what the
// device's pool and counter hold.
//
// A second copy of the device is played a 1 kHz sine, for the picture of the
// lines a steady grain rate draws in a spectrum.
//
// lab-memory-mb: 96

#include "lab.h"

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

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap recorded{"recorded", "What is recorded", lab::kAudio, lab::kDevice, 2};
lab::Tap piece{"piece", "What one grain reads", lab::kCurve, lab::kDevice, 1};
lab::Tap bell{"bell", "Its window, at the height of the piece", lab::kCurve, lab::kKit, 1};
lab::Tap grain{"grain", "The grain: the piece times the window", lab::kCurve, lab::kKit, 1};
lab::Tap cover{"cover", "The windows added up", lab::kControl, lab::kLesson, 1};
lab::Tap steady{"steady", "The lab's pool, started by its own Scatter", lab::kAudio, lab::kKit, 2};
lab::Tap grains{"grains", "The grains added up", lab::kAudio, lab::kLesson, 2};
// Last of the sounds, so it is what Play plays until a stage is chosen.
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap window{"window", "The window", lab::kCurve, lab::kKit, 1};
lab::Tap cut_spectrum{"cutSpectrum", "The piece cut out with no window", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap grain_spectrum{"grainSpectrum", "The piece under the window", lab::kSpectrum, lab::kKit, 1, "dB"};
// One column a grain: when it starts (s), how long it lasts (s), how far
// behind the write point it starts reading (ms), its speed (below zero:
// backwards), its gain, and 1 for the grain the lesson looks at.
lab::Tap cloud{"cloud", "The grains the device started", lab::kFrames, lab::kDevice, 1};
lab::Tap lines_device{"linesDevice", "The device's grains of a 1 kHz sine", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap lines_steady{"linesSteady", "The lab's pool, by its own Scatter", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap picture{"picture", "The output's spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check rebuilt{"rebuilt", "The grains added up again and put through the device's output stages, against its output", "dB"};
lab::Check rule{"rule", "Each grain's start, speed, length, gain and wait worked out again, against the device's pool", "samples"};

// What spawn_grain decides for one grain.
struct Plan {
  double start;  // where on the ring its first sample is read
  float ratio;   // ring samples per output sample; below zero backwards
  float length;  // output samples
  float pan;
  float gain;
  float wait;    // samples until the next grain
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
  float delay = (d.param(kTime) * 0.001f + d.spray_seconds() * dice.uniform()) * sr;
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
          kit::max(8.0f, length / overlap * (1.0f + jitter))};
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
  bool started = false;  // the device started a grain on this sample
  double now = 0.0;      // the write point as that grain was placed
  double start = 0.0;
  float ratio = 1.0f;
  float length = 0.0f;
  float gain = 0.0f;
  float off_rule = 0.0f;
};

// A device, and beside it the lab's own pool on the same ring.
struct Rig {
  GrainDelay device;
  Pool pool;
  kit::Rng dice;
  float until = 0.0f;
  bool own_on = false;
  kit::Svf tone_filter[2];
  kit::OnePole rumble[2];

  void start(float time_value, float feedback_value, float tone_value, float mix_value) {
    using namespace grain_delay;
    device.init(lab::kSampleRate);
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
    dice.seed(0x9E3779B9u);
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
    const bool ran = !slept || left != 0.0f || right != 0.0f;

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
    const bool starting = ran && (slept || d.until_grain_ <= 0.0f);
    kit::Rng its_dice = d.rng_;
    const float waited = slept ? 0.0f : d.until_grain_;
    s.now = static_cast<double>(d.written_);

    d.in_left()[0] = left;
    d.in_right()[0] = right;
    d.process(1);

    if (!ran) {
      pool.reset();
      until = 0.0f;
      return s;
    }
    const int newest = static_cast<int>((d.written_ - 1) & (GrainDelay::kRingSize - 1));
    s.recorded[0] = d.line_[0].at(newest);
    s.recorded[1] = d.line_[1].at(newest);
    s.out[0] = d.out_left()[0];
    s.out[1] = d.out_right()[0];

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
      const Plan p = plan(d, dice, s.now, scatter.value);
      pool.spawn(p.start, p.ratio, p.length, p.pan, p.gain, 1.0f);
      until += p.wait;
    }
    until -= 1.0f;
    pool.render(tape, &s.steady[0], &s.steady[1]);
    return s;
  }
};

Rig loop_rig;
Rig tone_rig;

// The one grain the lesson looks at, run again alone in a pool of one.
constexpr int kMostGrainSamples = 24064;  // 500 ms and a little
kit::GrainPool<1> alone;
float piece_at[kMostGrainSamples];
float window_at[kMostGrainSamples];
float grain_at[kMostGrainSamples];

constexpr int kMostGrains = 8192;
constexpr int kCloudRows = 6;
float cloud_at[kMostGrains][kCloudRows];

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
constexpr float kToneHz = 1000.0f;
constexpr float kToneLevel = 0.25f;
kit::Fft<kLinesSize> lines_fft;
float lines_window[kLinesSize];
float lines_bins[kLinesSize];

void lines_of(lab::Tap& tap, const float* x, float shifted) {
  const int points = 2 * kLinesReach + 1;
  if (!tap.open(points)) return;
  const float bin = lab::kSampleRate / kLinesSize;
  const int centre = static_cast<int>(shifted / bin + 0.5f);
  tap.x0 = static_cast<float>(centre - kLinesReach) * bin - shifted;
  tap.x1 = static_cast<float>(centre + kLinesReach) * bin - shifted;
  static double power[2 * kLinesReach + 1];
  for (int p = 0; p < points; ++p) power[p] = 0.0;
  for (int f = 0; f < kLinesFrames; ++f) {
    const float* from = x + f * (kLinesSize / 2);
    // The real part of bin k comes back at [k], the imaginary part at [N - k].
    lines_fft.forward_real([from](int n) { return from[n] * lines_window[n]; }, lines_bins);
    for (int p = 0; p < points; ++p) {
      const int k = centre - kLinesReach + p;
      if (k < 1 || k >= kLinesSize / 2) continue;
      const double re = lines_bins[k];
      const double im = lines_bins[kLinesSize - k];
      power[p] += re * re + im * im;
    }
  }
  // A sine of the tone's level under a Hann window puts level * N / 4 in its bin.
  const double full = static_cast<double>(kToneLevel) * (kLinesSize / 4.0);
  for (int p = 0; p < points; ++p) {
    tap.data[p] = lab::power_to_db(static_cast<float>(power[p] / (kLinesFrames * full * full)));
  }
}

void measure_lines() {
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
  lines_of(lines_device, from_device, kToneHz * ratio);
  lines_of(lines_steady, from_pool, kToneHz * ratio);
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

  // Only the second time round the loop is kept (lab.h), so the first time
  // only the device runs. The lab joins it a little before the second: its
  // own filters need a fifth of a second to stand where the device's do, and
  // its own pool three grains' length to hold every grain still sounding.
  const int rebuild_from = frames - 9600;
  const int own_from = frames - 3 * length_samples - 64;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const Sample s = rig.step(left, right, i >= rebuild_from, i >= own_from);

    if (i >= frames) {
      in_tap.put(i, left, right);
      recorded.put(i, s.recorded[0], s.recorded[1]);
      cover.put(i, s.cover);
      grains.put(i, s.grains[0], s.grains[1]);
      out_tap.put(i, s.out[0], s.out[1]);
      steady.put(i, s.steady[0], s.steady[1]);

      for (int c = 0; c < 2; ++c) {
        const double miss = static_cast<double>(s.rebuilt[c]) - s.out[c];
        off += miss * miss;
        level += static_cast<double>(s.out[c]) * s.out[c];
      }
      if (s.off_rule > worst_rule) worst_rule = s.off_rule;
    }

    const bool kept = i >= frames && i < 2 * frames;
    const bool chosen = s.started && kept && !looking && !looked && i - frames >= wanted;
    if (s.started && kept && cloud_count < kMostGrains) {
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

  if (cloud_count > 0 && cloud.open(cloud_count * kCloudRows)) {
    cloud.columns = cloud_count;
    cloud.x0 = 0.0f;
    cloud.x1 = static_cast<float>(frames) / lab::kSampleRate;
    for (int g = 0; g < cloud_count; ++g) {
      for (int r = 0; r < kCloudRows; ++r) cloud.data[g * kCloudRows + r] = cloud_at[g][r];
    }
  }

  if (out_tap.data) lab::spectrogram_tap(picture, out_tap.data, frames);
  measure_lines();
}
