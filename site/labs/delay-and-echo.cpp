// Delay and echo: the kit's delay line (cpp/kit/delay.h) and the
// Tape Echo built on it (cpp/devices/tape-echo), run one sample at a time so
// every stage of its loop can be read out of the device as it works.
//
//   in ──(+)──► saturate ──► tape ──► heads ──┬──► mix ──► out
//         ▲                                   │
//         └── feedback ◄─ low cut ◄─ high cut ◄┘
//
// Read from the device: what it wrote on its tape (the line's newest sample),
// the feedback after the loop's two filters (their own states), where the
// head reads, the tape's speed (the device's own meter), the output, and the
// whole tape as it lies in memory when the render stops.
//
// What the heads read is a local of the device's loop and is not kept. The
// lab reads it again with the kit's own read, on the device's own tape at the
// device's own read point, and the "heads" check mixes that with the input as
// the device does and reports how far it lands from the device's output. The
// sum that goes to the tape (input plus feedback) is not kept either: the lab
// works it out from the device's numbers ("lesson"), puts it through the
// kit's tanh, and the "record" check reports how far that lands from what the
// device wrote.
//
// Measured on a second copy of the device, at its shortest Time with a steady
// transport: the level of each repeat of a short burst, and the spectrum of
// each repeat of one sample. The "loop" check makes the loop again from the
// kit's parts (the two filters, the feedback gain, the tanh), feeds it what
// the device's heads read, and reports how far it lands from what they read
// one trip later.
//
// The kit's line by itself: one sample read at every place between its
// neighbours, by the linear read and by the Hermite read, and the response of
// each as a delay of a few samples and a fraction.

#include "lab.h"

#include "../../cpp/devices/tape-echo/tape_echo.h"

using namespace livemix;

namespace {

using Tape = kit::DelayLine<TapeEcho::kTapeSize>;

TapeEcho echo;             // the loop goes through this one
TapeEcho probe;            // a second copy, for measuring the repeats
kit::DelayLine<64> small;  // the kit's line by itself

// The lab starts on a plain echo: a steady transport, a straight tape, the
// loop's filters as open as they go, one head, both sides alike. The device's
// own defaults are in cpp/devices/tape-echo/device.json.
lab::Control time{"time", "Time", "ms", 30.0f, 2000.0f, 250.0f, lab::kLog};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 1.1f, 0.5f};
lab::Control fraction{"fraction", "Between samples", "", 0.0f, 1.0f, 0.5f};
lab::Control high_cut{"highCut", "High cut", "Hz", 800.0f, 16000.0f, 16000.0f, lab::kLog};
lab::Control low_cut{"lowCut", "Low cut", "Hz", 20.0f, 800.0f, 20.0f, lab::kLog};
lab::Control drive{"drive", "Drive", "", 0.0f, 1.0f, 0.0f};
lab::Control wow{"wow", "Wow", "", 0.0f, 1.0f, 0.0f};
lab::Control flutter{"flutter", "Flutter", "", 0.0f, 1.0f, 0.0f};
lab::Control nudge{"nudge", "Move Time half way through, by", "ms", -200.0f, 200.0f, 0.0f};
lab::Control heads{"heads", "Heads", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "One|Two|Three|Dotted"};
lab::Control spread{"spread", "Ping pong", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 0.5f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap heads_tap{"heads", "What the heads read", lab::kAudio, lab::kKit, 2};
lab::Tap back{"back", "After the loop's filters", lab::kAudio, lab::kDevice, 2};
lab::Tap sum{"sum", "Input plus feedback", lab::kAudio, lab::kLesson, 2};
lab::Tap tape{"tape", "On the tape", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap delay{"delay", "How far back the head reads", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap speed{"speed", "Tape speed", lab::kControl, lab::kDevice, 1};

lab::Tap memory{"memory", "The tape in memory", lab::kCurve, lab::kDevice, 1};
lab::Tap write_at{"writeAt", "Write index", lab::kCurve, lab::kDevice, 1};
lab::Tap read_at{"readAt", "Read index", lab::kCurve, lab::kDevice, 1};

lab::Tap kernel_linear{"kernelLinear", "One sample, read linearly", lab::kCurve, lab::kKit, 1};
lab::Tap kernel_hermite{"kernelHermite", "One sample, read by Hermite", lab::kCurve, lab::kKit, 1};
lab::Tap response_linear{"responseLinear", "Linear read", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap response_hermite{"responseHermite", "Hermite read", lab::kSpectrum, lab::kKit, 1, "dB"};

lab::Tap repeats{"repeats", "Each repeat of a 1 kHz burst", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap repeats_click{"repeatsClick", "Each repeat of one sample", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap repeats_formula{"repeatsFormula", "The feedback gain, multiplied again each time", lab::kCurve,
                         lab::kLesson, 1, "dB"};
lab::Tap repeat_1{"repeat1", "First repeat", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap repeat_2{"repeat2", "Second", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap repeat_3{"repeat3", "Third", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap repeat_5{"repeat5", "Fifth", lab::kSpectrum, lab::kDevice, 1, "dB"};

lab::Tap saturate{"saturate", "What the tape takes", lab::kCurve, lab::kKit, 1};

lab::Check heads_check{"heads", "The heads read again by the kit's own read and mixed, against the device's output",
                       "dB"};
lab::Check record_check{"record", "Input plus feedback through the kit's tanh, against what the device wrote", "dB"};
lab::Check loop_check{"loop", "The loop made again from the kit's filters and tanh, against the device's repeats", "dB"};

constexpr int kProbeDelay = 1440;   // 30 ms, the device's shortest Time
constexpr int kBurstRepeats = 24;
constexpr int kClickRepeats = 12;
constexpr int kBurstLength = 480;   // 10 ms of 1 kHz under a Hann window
constexpr float kBurstPeak = 0.1f;  // loud enough to reach the tape's bend when the loop gains
constexpr float kClickPeak = 0.001f;  // small: the tape is straight down here

void configure(TapeEcho& device, float time_ms, int heads_mode, float wow_value, float flutter_value,
               float spread_value, float mix_value) {
  using namespace tape_echo;
  device.init(lab::kSampleRate);
  device.set_param(kTime, time_ms);
  device.set_param(kFeedback, feedback.value);
  device.set_param(kHeads, static_cast<float>(heads_mode));
  device.set_param(kWow, wow_value);
  device.set_param(kFlutter, flutter_value);
  device.set_param(kDrive, drive.value);
  device.set_param(kLowCut, low_cut.value);
  device.set_param(kHighCut, high_cut.value);
  device.set_param(kSpread, spread_value);
  device.set_param(kMix, mix_value);
}

// How far back the Time head reads on the sample the device has just done,
// in samples: the motor's part and the wobble, as the device adds them.
float read_point(const TapeEcho& device) {
  return device.time_seen_ + device.wobble_seen_ * device.sample_rate();
}

// What the heads read on the sample the device has just done, by the kit's
// own read. The device reads before it writes, so the write index is stepped
// back for the read and forward again: the line is as the device found it.
float heads_read(TapeEcho& device, int channel) {
  Tape& line = device.tape_[channel];
  const float base = read_point(device);
  const float longest = Tape::max_delay() - 8.0f;
  line.write_ = (line.write_ - 1) & Tape::kMask;
  float read = 0.0f;
  for (int h = 0; h < TapeEcho::kNumHeads; ++h) {
    const float gain = device.head_gain_[h].value;
    if (gain == 0.0f) continue;
    read += gain * line.read_hermite(kit::clamp(base * TapeEcho::kHeadRatio[h], 4.0f, longest));
  }
  line.write_ = (line.write_ + 1) & Tape::kMask;
  return read;
}

struct Distance {
  double off = 0.0;
  double whole = 0.0;
  void add(float rebuilt, float real) {
    const double d = static_cast<double>(rebuilt) - static_cast<double>(real);
    off += d * d;
    whole += static_cast<double>(real) * static_cast<double>(real);
  }
  float db() const { return lab::ratio_db(off, whole); }
};

// The device's tape as it lies in memory: the largest sample of every 32, by
// its index, with the index the next sample is written at and the index the
// Time head reads it from.
void draw_memory() {
  constexpr int kBin = 32;
  constexpr int kPoints = Tape::kSize / kBin;
  const Tape& line = echo.tape_[0];
  if (!memory.open(kPoints) || !write_at.open(2) || !read_at.open(2)) return;
  memory.x0 = 0.5f * kBin;
  memory.x1 = static_cast<float>(Tape::kSize) - 0.5f * kBin;
  for (int p = 0; p < kPoints; ++p) {
    float most = 0.0f;
    for (int j = 0; j < kBin; ++j) {
      const float value = line.at(p * kBin + j);
      if (std::fabs(value) > std::fabs(most)) most = value;
    }
    memory.set(p, most);
  }
  const int written = line.write_position();
  const int behind = static_cast<int>(kit::clamp(read_point(echo), 4.0f, Tape::max_delay() - 8.0f));
  write_at.x0 = write_at.x1 = static_cast<float>(written);
  read_at.x0 = read_at.x1 = static_cast<float>((written - behind) & Tape::kMask);
  write_at.set(0, -1.0f);
  write_at.set(1, 1.0f);
  read_at.set(0, -1.0f);
  read_at.set(1, 1.0f);
}

// The kit's line by itself. One unit sample, nine samples old, read at every
// delay around nine: what one stored sample adds to a read that lands near
// it. Then the two reads as filters: a delay of four samples and a fraction,
// one sample put through it.
void read_between() {
  constexpr int kAge = 9;
  constexpr int kPerSample = 16;
  constexpr int kPoints = 6 * kPerSample + 1;
  if (!kernel_linear.open(kPoints) || !kernel_hermite.open(kPoints)) return;
  kernel_linear.x0 = kernel_hermite.x0 = -3.0f;
  kernel_linear.x1 = kernel_hermite.x1 = 3.0f;
  small.clear();
  small.write(1.0f);
  for (int n = 1; n < kAge; ++n) small.write(0.0f);
  for (int p = 0; p < kPoints; ++p) {
    const float at = static_cast<float>(kAge - 3) + static_cast<float>(p) / kPerSample;
    kernel_linear.set(p, small.read_linear(at));
    kernel_hermite.set(p, small.read_hermite(at));
  }

  constexpr int kLength = 16;
  float linear[kLength];
  float hermite[kLength];
  small.clear();
  for (int n = 0; n < kLength; ++n) {
    linear[n] = small.read_linear(4.0f + fraction.value);
    hermite[n] = small.read_hermite(4.0f + fraction.value);
    small.write(n == 0 ? 1.0f : 0.0f);
  }
  lab::response_tap(response_linear, linear, kLength);
  lab::response_tap(response_hermite, hermite, kLength);
}

// One short sound through the second copy of the device, wet only, and what
// comes out: the sound's own length of silence, then the repeats, one every
// kProbeDelay samples.
float* probe_run(const float* sound, int length, int repeat_count) {
  configure(probe, 30.0f, 0, 0.0f, 0.0f, 0.0f, 1.0f);
  const int count = (repeat_count + 1) * kProbeDelay;
  float* heard = lab::take(count);
  if (!heard) return nullptr;
  for (int offset = 0; offset < count; offset += 16) {
    for (int j = 0; j < 16; ++j) {
      const float x = offset + j < length ? sound[offset + j] : 0.0f;
      probe.in_left()[j] = x;
      probe.in_right()[j] = x;
    }
    probe.process(16);
    for (int j = 0; j < 16; ++j) heard[offset + j] = probe.out_left()[j];
  }
  return heard;
}

float energy(const float* x, int count) {
  double total = 0.0;
  for (int i = 0; i < count; ++i) total += static_cast<double>(x[i]) * static_cast<double>(x[i]);
  return static_cast<float>(total);
}

// The level of each repeat against the sound that went in, and the level the
// feedback gain alone would give it.
void level_of_repeats(lab::Tap& tap, const float* heard, int repeat_count, float sent) {
  if (!tap.open(repeat_count)) return;
  tap.x0 = 1.0f;
  tap.x1 = static_cast<float>(repeat_count);
  for (int k = 1; k <= repeat_count; ++k) {
    tap.set(k - 1, lab::power_to_db(energy(heard + k * kProbeDelay, kProbeDelay) / sent));
  }
}

void measure_repeats() {
  float burst[kBurstLength];
  for (int n = 0; n < kBurstLength; ++n) {
    const float window = 0.5f - 0.5f * std::cos(kit::kTwoPi * static_cast<float>(n) / kBurstLength);
    burst[n] = kBurstPeak * window * std::sin(kit::kTwoPi * 1000.0f * static_cast<float>(n) / lab::kSampleRate);
  }
  if (const float* heard = probe_run(burst, kBurstLength, kBurstRepeats)) {
    level_of_repeats(repeats, heard, kBurstRepeats, energy(burst, kBurstLength));
  }
  // The feedback gain to the power of the trips made so far, as a line: eight
  // points to a repeat, so it is drawn as a line and the repeats as dots.
  constexpr int kPerRepeat = 8;
  constexpr int kLinePoints = (kBurstRepeats - 1) * kPerRepeat + 1;
  if (repeats_formula.open(kLinePoints)) {
    repeats_formula.x0 = 1.0f;
    repeats_formula.x1 = static_cast<float>(kBurstRepeats);
    for (int p = 0; p < kLinePoints; ++p) {
      const float trips = static_cast<float>(p) / kPerRepeat;
      repeats_formula.set(p, p == 0 ? 0.0f : lab::to_db(std::pow(feedback.value, trips)));
    }
  }

  const float click = kClickPeak;
  float* heard = probe_run(&click, 1, kClickRepeats);
  if (!heard) return;
  level_of_repeats(repeats_click, heard, kClickRepeats, kClickPeak * kClickPeak);

  // The loop, made again from the kit's parts: what the heads read goes
  // through the high cut, the low cut and the feedback gain, joins the input,
  // is recorded through the tanh, and is what the heads read one trip later.
  kit::Svf high;
  kit::OnePole low;
  high.set(high_cut.value, 0.6f, lab::kSampleRate);
  low.set_cutoff(low_cut.value, lab::kSampleRate);
  const float hit = 1.0f + 3.0f * drive.value;
  Distance distance;
  for (int n = 0; n < kClickRepeats * kProbeDelay; ++n) {
    const float sent = (n == 0 ? click : 0.0f) + feedback.value * low.highpass(high.lowpass(heard[n]));
    distance.add(flush_denormal(kit::fast_tanh(sent * hit) / hit), heard[n + kProbeDelay]);
  }
  loop_check.value = distance.db();

  // The spectrum of a repeat: what the loop has done to one sample by then.
  for (int i = 0; i < (kClickRepeats + 1) * kProbeDelay; ++i) heard[i] *= 1.0f / kClickPeak;
  lab::response_tap(repeat_1, heard + 1 * kProbeDelay, kProbeDelay);
  lab::response_tap(repeat_2, heard + 2 * kProbeDelay, kProbeDelay);
  lab::response_tap(repeat_3, heard + 3 * kProbeDelay, kProbeDelay);
  lab::response_tap(repeat_5, heard + 5 * kProbeDelay, kProbeDelay);
}

// The record path's curve: the kit's tanh at the device's drive, by the
// level sent to it.
void draw_saturation() {
  constexpr int kPoints = 201;
  if (!saturate.open(kPoints)) return;
  saturate.x0 = 0.0f;
  saturate.x1 = 2.0f;
  const float gain = 1.0f + 3.0f * drive.value;
  for (int p = 0; p < kPoints; ++p) {
    const float x = 2.0f * static_cast<float>(p) / (kPoints - 1);
    saturate.set(p, kit::fast_tanh(x * gain) / gain);
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  using namespace tape_echo;
  configure(echo, time.value, heads.choice(), wow.value, flutter.value, spread.value, mix.value);

  Distance heads_distance;
  Distance record_distance;
  float mix_seen = -1.0f;
  float dry_gain = 1.0f;
  float wet_gain = 0.0f;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    // Time moves half way through the loop and back at its start, each time
    // as a turn of the knob: the device's motor follows.
    const int at = i % frames;
    if (at == 0 && i > 0) echo.set_param(kTime, time.value);
    if (at == frames / 2) echo.set_param(kTime, time.value + nudge.value);

    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    // Asleep, the device does nothing to its tape (kit::IdleGate): any input wakes it.
    const bool runs = left != 0.0f || right != 0.0f || !echo.idle_.asleep();
    echo.in_left()[0] = left;
    echo.in_right()[0] = right;
    echo.process(1);

    // The first time round only fills the tape, and no stage of it is worked
    // out. Its first sample is: a tap takes its room on its first put, and
    // the order the taps take it in is the order of that sample's puts.
    if (i > 0 && i < frames) continue;

    in_tap.put(i, left, right);
    out_tap.put(i, echo.out_left()[0], echo.out_right()[0]);
    speed.put(i, echo.meter(1));
    if (!runs) {
      heads_tap.put(i, 0.0f);
      back.put(i, 0.0f);
      sum.put(i, 0.0f);
      tape.put(i, 0.0f);
      delay.put(i, echo.meter(0));
      continue;
    }
    delay.put(i, read_point(echo) * 1000.0f / lab::kSampleRate);

    const float read[2] = {heads_read(echo, 0), heads_read(echo, 1)};
    const float filtered[2] = {echo.high_cut_[0].low - echo.low_cut_[0].state,
                               echo.high_cut_[1].low - echo.low_cut_[1].state};
    const float gain = echo.feedback_.value;
    const float crossed = echo.spread_.value;
    const float sent[2] = {left + gain * kit::lerp(filtered[0], filtered[1], crossed),
                           right * (1.0f - crossed) + gain * kit::lerp(filtered[1], filtered[0], crossed)};
    const float written[2] = {echo.tape_[0].read(1), echo.tape_[1].read(1)};

    heads_tap.put(i, read[0], read[1]);
    back.put(i, filtered[0], filtered[1]);
    sum.put(i, sent[0], sent[1]);
    tape.put(i, written[0], written[1]);

    if (i >= frames && i < 2 * frames) {
      if (echo.mix_.value != mix_seen) {
        mix_seen = echo.mix_.value;
        kit::equal_power(mix_seen, &dry_gain, &wet_gain);
      }
      heads_distance.add(left * dry_gain + read[0] * wet_gain, echo.out_left()[0]);
      heads_distance.add(right * dry_gain + read[1] * wet_gain, echo.out_right()[0]);
      const float hit = 1.0f + 3.0f * echo.drive_.value;
      record_distance.add(flush_denormal(kit::fast_tanh(sent[0] * hit) / hit), written[0]);
      record_distance.add(flush_denormal(kit::fast_tanh(sent[1] * hit) / hit), written[1]);
    }
  }
  heads_check.value = heads_distance.db();
  record_check.value = record_distance.db();

  draw_memory();
  read_between();
  measure_repeats();
  draw_saturation();
}
