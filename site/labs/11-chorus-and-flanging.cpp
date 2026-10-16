// Lesson 11, chorus and flanging: the Flanger (cpp/devices/flanger) and the
// Chorus (cpp/devices/chorus), each run one sample at a time on the same
// loop, so the oscillator, the delay it sets, the delayed copy by itself and
// the sum can all be read as they are made.
//
//   in ──(+)──► delay line ──► read at a moving point ──┬──► delayed copy ──┐
//         ▲                                             │                   ├─ mix ─► out
//         └────────────── feedback (±) ◄────────────────┘              in ──┘
//
// The Flanger three times over:
//   - with its Depth at 0 and one sample put in, for the comb's response
//     ("comb", and "combWet" for the delayed path by itself). The response is
//     the transform of what comes out, folded to 4,096 samples first so that
//     a long ring is all counted. The formula the lesson writes is worked out
//     at the same frequencies ("combFormula"), and a check says how far apart
//     the two are.
//   - with its Depth at 0 on the loop ("still"): the comb with nothing moving.
//   - as set by the controls on the loop: its oscillator, the delay it reads
//     at, the delayed copy (the device keeps it for the feedback) and the sum.
//
// The Chorus once. It keeps the delay line, the oscillator's phase, the
// smoothed delay and depth and each voice's gains, but not what each voice
// read: those are locals of its `read_voices`. So the lab reads the voices
// again, out of the device's own line with the device's own numbers
// ("lesson"), sums them as the device does, and reports how far that sum
// lands from the output the device wrote (the "rebuilt" check).

#include "lab.h"

#include "../../cpp/devices/chorus/chorus.h"
#include "../../cpp/devices/flanger/flanger.h"

using namespace livemix;

namespace {

Flanger swept;
Flanger held;  // a second Flanger whose Depth stays at 0
Chorus chorus_device;

lab::Control delay{"delay", "Delay", "ms", 0.5f, 10.0f, 2.5f, lab::kLog};
lab::Control depth{"depth", "Depth", "%", 0.0f, 100.0f, 50.0f};
lab::Control rate{"rate", "Rate", "Hz", 0.01f, 10.0f, 0.25f, lab::kLog};
lab::Control shape{"shape", "Shape", "", 0.0f, 5.0f, 0.0f, lab::kLinear,
                   "Sine|Triangle|Saw up|Saw down|Square|Random"};
lab::Control feedback{"feedback", "Feedback", "%", -95.0f, 95.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 0.5f};
lab::Control voices{"voices", "Voices", "", 0.0f, 1.0f, 1.0f, lab::kLinear, "2|3"};
lab::Control chorus_delay{"chorusDelay", "Chorus delay", "ms", 5.0f, 30.0f, 12.0f};
lab::Control chorus_depth{"chorusDepth", "Chorus depth", "%", 0.0f, 100.0f, 50.0f};
lab::Control chorus_rate{"chorusRate", "Chorus rate", "Hz", 0.01f, 10.0f, 0.8f, lab::kLog};
lab::Control spread{"spread", "Spread", "%", 0.0f, 100.0f, 70.0f};
lab::Control chorus_mix{"chorusMix", "Chorus mix", "", 0.0f, 1.0f, 0.5f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap still{"still", "Comb, held still", lab::kAudio, lab::kDevice, 2};
lab::Tap comb{"comb", "The comb, measured", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap comb_wet{"combWet", "The delayed path alone, measured", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap comb_formula{"combFormula", "The comb as written", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap lfo{"lfo", "Oscillator", lab::kControl, lab::kDevice, 1, ""};
lab::Tap delay_ms{"delayMs", "Delay time", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap flanger_wet{"flangerWet", "Delayed copy alone", lab::kAudio, lab::kDevice, 2};
lab::Tap flanger_out{"flanger", "Flanger", lab::kAudio, lab::kDevice, 2};
lab::Tap picture{"flangerPicture", "Flanger, spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap voice1_ms{"voice1Ms", "Voice 1 delay", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap voice2_ms{"voice2Ms", "Voice 2 delay", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap voice3_ms{"voice3Ms", "Voice 3 delay", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap voice1_right_ms{"voice1MsRight", "Voice 1 delay, right side", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap voice2_right_ms{"voice2MsRight", "Voice 2 delay, right side", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap cents1{"cents1", "Voice 1 pitch", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap cents2{"cents2", "Voice 2 pitch", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap cents3{"cents3", "Voice 3 pitch", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap voice{"voice", "One voice alone", lab::kAudio, lab::kLesson, 2};
lab::Tap chorus_wet{"chorusWet", "Voices summed", lab::kAudio, lab::kLesson, 2};
lab::Tap chorus_out{"chorus", "Chorus", lab::kAudio, lab::kDevice, 2};

lab::Check comb_error{"combError", "The measured comb against the formula: the largest difference in gain, against a gain of 1",
                      "dB"};
lab::Check rebuilt{"rebuilt", "The voices read again and summed, against the Chorus's own output", "dB"};

constexpr double kPi = 3.14159265358979323846;
constexpr int kCombPoints = 342;  // bins of a 4,096-point transform: 0 Hz to 3,996 Hz
constexpr int kCombMost = 131072;  // samples of ring counted at most: 2.7 s

float fold_out_[lab::kSpectrumSize];
float fold_wet_[lab::kSpectrumSize];
float fold_im_[lab::kSpectrumSize];

void configure(Flanger& device, float depth_percent) {
  using namespace flanger;
  device.init(lab::kSampleRate);
  device.set_param(kDelayMs, delay.value);
  device.set_param(kRate, rate.value);
  device.set_param(kDepth, depth_percent);
  device.set_param(kFeedback, feedback.value);
  device.set_param(kShape, static_cast<float>(shape.choice()));
  device.set_param(kMix, mix.value);
  // Stereo stays where the device starts it: the right side a quarter cycle ahead.
}

void configure(Chorus& device) {
  using namespace chorus;
  device.init(lab::kSampleRate);
  device.set_param(kVoices, static_cast<float>(voices.choice()));
  device.set_param(kRate, chorus_rate.value);
  device.set_param(kDepth, chorus_depth.value);
  device.set_param(kDelayMs, chorus_delay.value);
  device.set_param(kSpread, spread.value);
  device.set_param(kMix, chorus_mix.value);
  // Feedback (0) and High-pass (20 Hz, which is off) stay where the device starts them.
}

// A device renders a sample when something goes in or it is not yet asleep
// (kit::IdleGate::wake). Asleep, it writes zeros and reads nothing.
template <class Device>
bool renders(const Device& device, float left, float right) {
  return left != 0.0f || right != 0.0f || !device.idle_.asleep();
}

// How far back a device can still hear, in samples: the length of its line
// in use, and for a loop the trips round it that take a sound down 100 dB.
int memory_of(float longest_read, float loop_gain) {
  const float size = loop_gain < 0.0f ? -loop_gain : loop_gain;
  const float trips = size > 0.0f ? std::log(1.0e-5f) / std::log(size) : 0.0f;
  return static_cast<int>((trips + 1.0f) * (longest_read + 1.0f)) + 4800;
}

// The first time round the loop is there only so that what still rings at the
// loop's end is sounding at its start. A device remembers no further back
// than `memory` samples, so only that much of the end is played into it.
// Before that nothing goes in and the device sleeps, which costs next to
// nothing; its oscillator runs on all the while, as it does in the engine,
// and stands where it would have stood. Returns where the playing begins.
template <class Device>
int sleep_through(Device& device, int frames, int memory) {
  const int kMost = Device::kMaxBlockFrames;
  int wake = frames - lab::kControlPeriod - memory;
  wake = wake > 0 ? wake - wake % 64 : 0;
  int i = 0;
  while (i < wake) {
    const int n = wake - i < kMost ? wake - i : kMost;
    device.process(n);  // the input is already silence: a device clears what it has read
    i += n;
  }
  return i;
}

// A value over time, as it stood the second time round the loop. The sound is
// crossfaded across the loop's join (Tap::put) so that it plays without a
// step. An oscillator that does not come round with the loop would be faded
// the same way, from one place in its sweep to another, and the trace would
// show a kink that no read point made. So these are kept as they were.
void keep(lab::Tap& tap, int i, float value) {
  if (!tap.data && !tap.open(lab::frames() / lab::kControlPeriod)) return;
  tap.set((i - lab::frames()) / lab::kControlPeriod, value);
}

// DelayLine::read_hermite as it stood before the sample just written: the
// device reads its voices, then writes, so a look afterwards is one further on.
template <int Size>
float read_before_write(const kit::DelayLine<Size>& line, float delay_samples) {
  const int whole = static_cast<int>(delay_samples);
  const float fraction = delay_samples - static_cast<float>(whole);
  const int at = line.write_position() - 1;
  return kit::hermite(line.at(at - whole + 1), line.at(at - whole), line.at(at - whole - 1),
                      line.at(at - whole - 2), fraction);
}

// The comb with nothing moving: one sample into a Flanger at Depth 0, and the
// transform of everything that comes out. A ring longer than the transform is
// folded into it, which leaves each bin exactly what the whole ring gives.
void measure_comb() {
  if (!comb.open(kCombPoints) || !comb_wet.open(kCombPoints) || !comb_formula.open(kCombPoints)) return;
  const float last_hz = static_cast<float>(kCombPoints - 1) * lab::kSampleRate / lab::kSpectrumSize;
  comb.x1 = comb_wet.x1 = comb_formula.x1 = last_hz;

  configure(held, 0.0f);
  for (int n = 0; n < lab::kSpectrumSize; ++n) fold_out_[n] = fold_wet_[n] = 0.0f;
  // Half of full scale, so the feedback's limiter (linear up to ±1) stays out of it.
  constexpr float kUnit = 0.5f;
  for (int n = 0; n < kCombMost; ++n) {
    const float x = n == 0 ? kUnit : 0.0f;
    if (n > 0 && held.idle_.asleep()) break;
    held.in_left()[0] = x;
    held.in_right()[0] = x;
    held.process(1);
    fold_out_[n & (lab::kSpectrumSize - 1)] += held.out_left()[0] / kUnit;
    fold_wet_[n & (lab::kSpectrumSize - 1)] += held.last_wet_[0] / kUnit;
  }
  for (int n = 0; n < lab::kSpectrumSize; ++n) fold_im_[n] = 0.0f;
  lab::g_spectrum_fft.forward(fold_out_, fold_im_);
  for (int k = 0; k < kCombPoints; ++k) {
    fold_out_[k] = std::sqrt(fold_out_[k] * fold_out_[k] + fold_im_[k] * fold_im_[k]);
  }
  for (int n = 0; n < lab::kSpectrumSize; ++n) fold_im_[n] = 0.0f;
  lab::g_spectrum_fft.forward(fold_wet_, fold_im_);

  // The formula, with the device's own delay, feedback and mix:
  //   H = (1 - m) + m e^{-jwD} / (1 - g e^{-jw(D + 1)})
  const double d = static_cast<double>(held.delay_.value);
  const double g = static_cast<double>(held.feedback_.value);
  const double m = static_cast<double>(held.mix_.value);
  double worst = 0.0;
  for (int k = 0; k < kCombPoints; ++k) {
    const double w = 2.0 * kPi * k / lab::kSpectrumSize;
    const double loop_re = 1.0 - g * std::cos(w * (d + 1.0));
    const double loop_im = g * std::sin(w * (d + 1.0));
    const double size = loop_re * loop_re + loop_im * loop_im;
    // e^{-jwD} over the loop's denominator.
    const double wet_re = (std::cos(w * d) * loop_re - std::sin(w * d) * loop_im) / size;
    const double wet_im = (-std::sin(w * d) * loop_re - std::cos(w * d) * loop_im) / size;
    const double re = (1.0 - m) + m * wet_re;
    const double im = m * wet_im;
    const double written = std::sqrt(re * re + im * im);
    const double measured = static_cast<double>(fold_out_[k]);
    const double wet = std::sqrt(static_cast<double>(fold_wet_[k]) * fold_wet_[k] +
                                 static_cast<double>(fold_im_[k]) * fold_im_[k]);
    comb.set(k, lab::to_db(static_cast<float>(measured)));
    comb_wet.set(k, lab::to_db(static_cast<float>(wet)));
    comb_formula.set(k, lab::to_db(static_cast<float>(written)));
    const double apart = measured > written ? measured - written : written - measured;
    if (apart > worst) worst = apart;
  }
  comb_error.value = lab::to_db(static_cast<float>(worst));
}

// The loop through the Flanger with its Depth at 0: nothing but the comb.
void render_still() {
  constexpr int kBlock = 16;
  configure(held, 0.0f);
  const int total = lab::total();
  const int start = sleep_through(held, lab::frames(), memory_of(held.delay_.value, held.feedback_.value));
  for (int i = start; i < total; i += kBlock) {
    for (int j = 0; j < kBlock; ++j) {
      held.in_left()[j] = lab::in_at(0, i + j);
      held.in_right()[j] = lab::in_at(1, i + j);
    }
    held.process(kBlock);
    if (i < lab::frames()) continue;  // the first time round is not kept
    for (int j = 0; j < kBlock; ++j) still.put(i + j, held.out_left()[j], held.out_right()[j]);
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure(swept, depth.value);
  configure(chorus_device);

  const float ms_per_sample = 1000.0f / lab::kSampleRate;
  const float longest = kit::DelayLine<Chorus::kLineSize>::max_delay();
  float before[3] = {0.0f, 0.0f, 0.0f};  // each voice's delay one control period ago
  float pitch[3] = {0.0f, 0.0f, 0.0f};
  bool have_before = false;
  double apart = 0.0;
  double whole = 0.0;

  // The end of the first time round, in blocks: it fills the delay lines, and
  // no stage of it is kept.
  constexpr int kBlock = 64;
  const int total = lab::total();
  const float sweep_most = swept.delay_.value + swept.deviation_.value;
  const int wake_swept = sleep_through(swept, frames, memory_of(sweep_most, swept.feedback_.value));
  const int wake_chorus = sleep_through(chorus_device, frames, memory_of(longest, 0.0f));
  int i = wake_swept < wake_chorus ? wake_swept : wake_chorus;
  for (; i + kBlock <= frames - lab::kControlPeriod; i += kBlock) {
    const bool flanging = i >= wake_swept;
    const bool singing = i >= wake_chorus;
    for (int j = 0; j < kBlock; ++j) {
      const float left = lab::in_at(0, i + j);
      const float right = lab::in_at(1, i + j);
      if (flanging) {
        swept.in_left()[j] = left;
        swept.in_right()[j] = right;
      }
      if (singing) {
        chorus_device.in_left()[j] = left;
        chorus_device.in_right()[j] = right;
      }
    }
    if (flanging) swept.process(kBlock);
    if (singing) chorus_device.process(kBlock);
  }

  for (; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const bool kept = i >= frames;
    const bool control = i % lab::kControlPeriod == 0;

    // The Flanger. Its oscillator, its read point and the copy it read are all its own state.
    const bool flanging = renders(swept, left, right);
    swept.in_left()[0] = left;
    swept.in_right()[0] = right;
    swept.process(1);

    // The Chorus, and its voices read again from its own line.
    const bool singing = renders(chorus_device, left, right);
    chorus_device.in_left()[0] = left;
    chorus_device.in_right()[0] = right;
    chorus_device.process(1);
    const float out[2] = {chorus_device.out_left()[0], chorus_device.out_right()[0]};

    const int set = chorus_device.three_.value >= 0.5f ? Chorus::kThree : Chorus::kTwo;
    const Chorus::VoiceSet& voice_set = Chorus::kSets[set];
    const float turn = static_cast<float>(chorus_device.lfo_phase_);
    float sine[2], cosine[2];
    sine[0] = kit::SineTable::lookup(turn);
    cosine[0] = kit::SineTable::cos_lookup(turn);
    sine[1] = sine[0] * chorus_device.offset_cos_ + cosine[0] * chorus_device.offset_sin_;
    cosine[1] = cosine[0] * chorus_device.offset_cos_ - sine[0] * chorus_device.offset_sin_;
    const float base = chorus_device.delay_.value;
    const float deviation = chorus_device.deviation_.value;

    float read_at[2][3] = {{base, base, base}, {base, base, base}};
    float first_voice[2] = {0.0f, 0.0f};
    float wet[2] = {0.0f, 0.0f};
    const float in[2] = {left, right};
    for (int c = 0; c < 2; ++c) {
      float sum = 0.0f;
      for (int v = 0; v < voice_set.voices; ++v) {
        const float sweep = sine[c] * voice_set.ahead_cos[v] + cosine[c] * voice_set.ahead_sin[v];
        read_at[c][v] = kit::clamp(base + sweep * deviation, 2.0f, longest);
        if (!singing) continue;
        const float read = read_before_write(chorus_device.line_[c], read_at[c][v]);
        if (v == 0) first_voice[c] = read;
        sum += read * chorus_device.pan_gain_[set][v][c];
      }
      wet[c] = sum * voice_set.norm;
      if (kept) {
        const float shaped = wet[c] - chorus_device.high_pass_amount_.value * chorus_device.high_pass_[c].state;
        const float again = singing ? in[c] + (shaped - in[c]) * chorus_device.mix_.value : 0.0f;
        apart += static_cast<double>(again - out[c]) * static_cast<double>(again - out[c]);
        whole += static_cast<double>(out[c]) * static_cast<double>(out[c]);
      }
    }

    // A delay that moves replays the sound at another speed: 1 - (the delay's slope).
    if (control) {
      for (int v = 0; v < 3; ++v) {
        const float slope = (read_at[0][v] - before[v]) / static_cast<float>(lab::kControlPeriod);
        pitch[v] = have_before ? 1200.0f * std::log2(1.0f - slope) : 0.0f;
        before[v] = read_at[0][v];
      }
      have_before = true;
    }
    if (!kept) continue;

    in_tap.put(i, left, right);
    flanger_wet.put(i, flanging ? swept.last_wet_[0] : 0.0f, flanging ? swept.last_wet_[1] : 0.0f);
    flanger_out.put(i, swept.out_left()[0], swept.out_right()[0]);
    voice.put(i, first_voice[0], first_voice[1]);
    chorus_wet.put(i, wet[0], wet[1]);
    chorus_out.put(i, out[0], out[1]);
    if (!control) continue;
    keep(lfo, i, swept.lfo_.value());
    keep(delay_ms, i, swept.meter(1));
    keep(voice1_ms, i, read_at[0][0] * ms_per_sample);
    keep(voice2_ms, i, read_at[0][1] * ms_per_sample);
    keep(voice3_ms, i, read_at[0][2] * ms_per_sample);
    keep(voice1_right_ms, i, read_at[1][0] * ms_per_sample);
    keep(voice2_right_ms, i, read_at[1][1] * ms_per_sample);
    keep(cents1, i, pitch[0]);
    keep(cents2, i, pitch[1]);
    keep(cents3, i, pitch[2]);
  }
  rebuilt.value = whole > 0.0 && apart / whole > 1.0e-14 ? static_cast<float>(10.0 * std::log10(apart / whole))
                                                          : lab::kFloorDb;

  render_still();
  measure_comb();
  if (flanger_out.data) lab::spectrogram_tap(picture, flanger_out.channel(0), frames);
}
