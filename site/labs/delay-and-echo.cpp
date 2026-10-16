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
// each as a delay of a few samples and a fraction. And the kit's line again,
// sixteen slots long, with one click sent round it: every slot after every
// step, with where the line wrote and where it read, for the picture of the
// ring.
//
// The build part puts an echo together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has eight pieces, each a
// function of `Built` below, in the order the steps add them: a ring of
// memory; a read head; feedback; reading between samples; filters in the
// loop; a soft ceiling where the sum is recorded; a transport that is never
// steady (the motor's lag, wow and flutter); more heads and two sides. The
// path writes the "built" taps and leaves every other tap as it was (one of
// them is a curve: one stored sample as the echo so far reads around it). Two
// copies of it run: one at the step the reader chose, which is what the taps
// show, and one with all eight pieces, whose output is compared on every
// render with the device's own output (the "builtDifference" check). With all
// eight the build does to a sample what the device does, in the same order,
// with the kit's own filters, drifts and smoother, so the two are the same
// sample for sample. A step before the last is the lesson's own: an echo with
// a piece missing, which the device never is. Until the soft ceiling is in,
// the build cuts the recorded sum off flat at full scale, which the device
// does not do: without it a loop that gains would grow without end.

// lab-memory-mb: 96

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
lab::Tap repeat_2{"repeat2", "Second repeat", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap repeat_3{"repeat3", "Third repeat", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap repeat_5{"repeat5", "Fifth repeat", lab::kSpectrum, lab::kDevice, 1, "dB"};

lab::Tap saturate{"saturate", "What the tape takes", lab::kCurve, lab::kKit, 1};

// One click sent round a ring of sixteen slots, for the picture of the ring.
constexpr int kRingSlots = 16;
constexpr int kRingSteps = 49;  // three times round, and the step that begins the fourth
kit::DelayLine<kRingSlots> ring_line;
lab::Control ring_back{"ringBack", "Read head, slots behind", "", 2.0f, 8.0f, 5.0f, lab::kLinear, "2|3|4|5|6|7|8"};
lab::Tap ring{"ring", "What each slot holds", lab::kFrames, lab::kKit, 1};
lab::Tap ring_write{"ringWrite", "Write head", lab::kCurve, lab::kKit, 2};
lab::Tap ring_read{"ringRead", "Read head", lab::kCurve, lab::kKit, 2};

lab::Tap built{"built", "The echo so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_tape{"builtTape", "Written on the ring", lab::kAudio, lab::kLesson, 1};
lab::Tap built_heads{"builtHeads", "Read from the ring", lab::kAudio, lab::kLesson, 1};
lab::Tap built_right{"builtRight", "Read from the right side's ring", lab::kAudio, lab::kLesson, 1};
lab::Tap built_back{"builtBack", "Back from the filters", lab::kAudio, lab::kLesson, 1};
lab::Tap built_delay{"builtDelay", "How far behind the head stands", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap built_kernel{"builtKernel", "One stored sample, as the echo so far reads around it", lab::kCurve,
                      lab::kLesson, 1};

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

// The echo so far: one function a piece, and run() to take a sample through
// the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kRing = 0, kHead, kFeedback, kBetween, kFilters, kCeiling, kTransport, kHeads };

  static constexpr int kSlots = TapeEcho::kTapeSize;  // 262,144 to a side, as the device has
  static constexpr int kMask = kSlots - 1;

  int pieces = kRing;
  float slots[2][kSlots];  // the ring: the last 262,144 samples of each side, in the order they came
  int write = 0;           // the slot the next sample goes in
  float aim = 0.0f;        // Time, in samples
  kit::Smoother motor;     // Time as the motor follows it
  kit::Drift wow_drift;
  kit::Drift flutter_drift;
  kit::Lfo flutter_lfo;
  kit::Svf high_cut_filter[2];
  kit::OnePole low_cut_filter[2];
  kit::IdleGate idle;
  float gains[TapeEcho::kNumHeads] = {1.0f, 0.0f, 0.0f};
  float hit = 1.0f;        // how hard the sum is driven at the ceiling
  float dry = 1.0f;
  float wet = 0.0f;
  float behind = 0.0f;     // where the Time head stands, in samples behind the write index
  float read_now[2] = {0.0f, 0.0f};
  float back_now[2] = {0.0f, 0.0f};
  float written[2] = {0.0f, 0.0f};
  float out[2] = {0.0f, 0.0f};

  // A ring of memory: the newest sample goes into the slot the write index
  // points at, over the oldest one there is, and the index steps on. Past the
  // last slot it comes round to the first: the ring's size is a power of two,
  // so coming round is one AND with the size less one.
  void record(float left, float right) {
    slots[0][write] = left;
    slots[1][write] = right;
    write = (write + 1) & kMask;
  }

  // A read head: the sample that went in `back` samples ago lies `back` slots
  // behind the write index. Nothing in the ring has moved.
  float read(int side, int back) const { return slots[side][(write - back) & kMask]; }

  // Feedback: some of what the head reads is recorded again beside the input.
  float fed_back(float in, float echo) const { return in + feedback.value * echo; }

  // Reading between samples: a delay of 4,800.48 samples lands between two
  // slots. Take the two slots on each side of it and put the kit's cubic
  // through the four.
  float between(int side, float back) const {
    const int whole = static_cast<int>(back);
    const float fraction = back - static_cast<float>(whole);
    return kit::hermite(read(side, whole - 1), read(side, whole), read(side, whole + 1), read(side, whole + 2),
                        fraction);
  }

  // Filters in the loop: what the head reads goes through a low-pass and then
  // a high-pass before it is fed back. What is heard is taken before them.
  float filtered(int side, float echo) {
    return low_cut_filter[side].highpass(high_cut_filter[side].lowpass(echo));
  }

  // A ceiling where the sum is recorded. Without one, the lesson cuts the
  // sum off flat at full scale, the largest number a sample can be.
  float flat(float sent) const { return kit::clamp(sent, -1.0f, 1.0f); }

  // The soft ceiling: a curve that is a straight line for a small sum and
  // bends over towards a level it cannot pass, 1 over `hit`.
  float bent(float sent) const { return flush_denormal(kit::fast_tanh(sent * hit) / hit); }

  // A transport that is never steady: Time is followed by a motor, a
  // smoother with a lag of 120 ms, and two wanderings are added to where the
  // head stands. Wow is a slow drift of up to 1.6 ms, Flutter a faster one of
  // up to 0.07 ms.
  float transport() {
    const float wobble = wow.value * TapeEcho::kWowSeconds * wow_drift.next() +
                         flutter.value * TapeEcho::kFlutterSeconds *
                             (0.7f * flutter_lfo.next(kit::Lfo::kSine) + 0.3f * flutter_drift.next());
    return motor.next() + wobble * lab::kSampleRate;
  }

  // More heads: the ring is read at Time, at two thirds of it and at a third
  // of it, and the three are added at the gains the Heads control picks.
  float heads_read(int side, float base) const {
    const float longest = static_cast<float>(kSlots - 4) - 8.0f;
    float echo = 0.0f;
    for (int h = 0; h < TapeEcho::kNumHeads; ++h) {
      if (gains[h] == 0.0f) continue;
      echo += gains[h] * between(side, kit::clamp(base * TapeEcho::kHeadRatio[h], 4.0f, longest));
    }
    return echo;
  }

  // Two sides: as Ping pong rises the input leaves the right side's ring, and
  // each side records more of the other side's echo and less of its own.
  void crossed(float left, float right, float* sent) const {
    sent[0] = left + feedback.value * kit::lerp(back_now[0], back_now[1], spread.value);
    sent[1] = right * (1.0f - spread.value) + feedback.value * kit::lerp(back_now[1], back_now[0], spread.value);
  }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    // Nothing going in and nothing left to say: the echo sleeps, as the device does.
    if (!idle.wake(left != 0.0f || right != 0.0f)) {
      for (int side = 0; side < 2; ++side) read_now[side] = back_now[side] = written[side] = out[side] = 0.0f;
      return;
    }
    behind = pieces >= kTransport ? transport() : aim;
    for (int side = 0; side < 2; ++side) {
      if (pieces >= kHeads) read_now[side] = heads_read(side, behind);
      else if (pieces >= kBetween) read_now[side] = between(side, behind);
      else if (pieces >= kHead) read_now[side] = read(side, static_cast<int>(behind + 0.5f));
      back_now[side] = pieces >= kFilters ? filtered(side, read_now[side]) : read_now[side];
    }
    float sent[2] = {left, right};
    if (pieces >= kHeads) {
      crossed(left, right, sent);
    } else if (pieces >= kFeedback) {
      sent[0] = fed_back(left, back_now[0]);
      sent[1] = fed_back(right, back_now[1]);
    }
    if (pieces >= kFeedback) {
      for (float& one : sent) one = pieces >= kCeiling ? bent(one) : flat(one);
    }
    written[0] = sent[0];
    written[1] = sent[1];
    record(sent[0], sent[1]);
    out[0] = left * dry + read_now[0] * wet;
    out[1] = right * dry + read_now[1] * wet;
    const float loudest = kit::max(out[0] < 0.0f ? -out[0] : out[0], out[1] < 0.0f ? -out[1] : out[1]);
    idle.settle(loudest, 1);
  }

  // Time, turned: in samples, held to the range the device holds it to.
  void turn(float time_ms) {
    using namespace tape_echo;
    aim = kit::clamp(time_ms, kParamMin[kTime], kParamMax[kTime]) * 0.001f * lab::kSampleRate;
    motor.set_target(aim);
  }

  void start(int pieces_) {
    using namespace tape_echo;
    pieces = pieces_;
    for (int side = 0; side < 2; ++side) {
      for (float& slot : slots[side]) slot = 0.0f;
      high_cut_filter[side].reset();
      high_cut_filter[side].set(high_cut.value, 0.6f, lab::kSampleRate);
      low_cut_filter[side].reset();
      low_cut_filter[side].set_cutoff(low_cut.value, lab::kSampleRate);
      read_now[side] = back_now[side] = written[side] = out[side] = 0.0f;
    }
    write = 0;
    motor.set_time(TapeEcho::kMotorLagSeconds, lab::kSampleRate);
    turn(time.value);
    motor.snap(aim);
    behind = aim;
    // The device's own seeds and rates, so that the wanderings are the device's.
    wow_drift = kit::Drift();
    wow_drift.seed(0x51ED270Bu);
    wow_drift.set_rate(0.5f, lab::kSampleRate);
    flutter_lfo = kit::Lfo();
    flutter_lfo.reset();
    flutter_lfo.seed(0x9E3779B9u);
    flutter_lfo.set_rate(7.1f, lab::kSampleRate);
    flutter_drift = kit::Drift();
    flutter_drift.seed(0x7F4A7C15u);
    flutter_drift.set_rate(1.9f, lab::kSampleRate);
    idle.reset(lab::kSampleRate, kParamMax[kTime] * 0.001f + 0.5f);
    for (int h = 0; h < TapeEcho::kNumHeads; ++h) gains[h] = TapeEcho::kHeadGains[heads.choice()][h];
    hit = 1.0f + 3.0f * drive.value;
    // Until there is a head to hear, what comes out is what went in.
    dry = 1.0f;
    wet = 0.0f;
    if (pieces >= kHead) kit::equal_power(mix.value, &dry, &wet);
  }
};

lab::Build build{"A ring of memory|A read head|Feedback|Between samples|Filters in the loop|A soft ceiling|"
                 "An unsteady transport|More heads, two sides",
                 Built::kHeads, -120.0f, "The echo as built, all eight pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// One stored sample, read by the echo so far at every place around it: the
// picture of the step that reads between samples. The loop is done with the
// ring by now, so the sample is recorded on it, with silence on both sides.
void draw_built_read(Built& so_far) {
  constexpr int kAge = 9;
  constexpr int kPerSample = 16;
  constexpr int kPoints = 6 * kPerSample + 1;
  if (!built_kernel.open(kPoints)) return;
  built_kernel.x0 = -3.0f;
  built_kernel.x1 = 3.0f;
  for (int n = 0; n < kAge; ++n) so_far.record(0.0f, 0.0f);
  so_far.record(1.0f, 1.0f);
  for (int n = 1; n < kAge; ++n) so_far.record(0.0f, 0.0f);
  for (int p = 0; p < kPoints; ++p) {
    const float back = static_cast<float>(kAge - 3) + static_cast<float>(p) / kPerSample;
    float read = 0.0f;
    if (so_far.pieces >= Built::kBetween) {
      read = so_far.between(0, back);
    } else if (so_far.pieces >= Built::kHead) {
      read = so_far.read(0, static_cast<int>(back + 0.5f));
    }
    built_kernel.set(p, read);
  }
}

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

// One click sent round the kit's line, sixteen slots long, with the read head
// a few slots behind the write head and Feedback between them: every slot
// after every step, and for each step the slot written, what was written
// there, the slot read and what was read.
void go_round() {
  if (!ring.open(kRingSteps * kRingSlots) || !ring_write.open(kRingSteps) || !ring_read.open(kRingSteps)) return;
  ring.columns = kRingSteps;
  ring.x0 = ring_write.x0 = ring_read.x0 = 0.0f;
  ring.x1 = ring_write.x1 = ring_read.x1 = static_cast<float>(kRingSteps - 1);
  const int back = ring_back.choice();
  ring_line.clear();
  for (int n = 0; n < kRingSteps; ++n) {
    const int at = ring_line.write_position();
    const float read = ring_line.read(back);
    const float written = (n == 0 ? 1.0f : 0.0f) + feedback.value * read;
    ring_line.write(written);
    ring_write.set(n, static_cast<float>(at), written);
    ring_read.set(n, static_cast<float>((at - back) & (kRingSlots - 1)), read);
    for (int slot = 0; slot < kRingSlots; ++slot) ring.set(n * kRingSlots + slot, ring_line.at(slot));
  }
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  using namespace tape_echo;
  configure(echo, time.value, heads.choice(), wow.value, flutter.value, spread.value, mix.value);

  // The build part: the chosen step, and the whole build that is held to the
  // device. Where the chosen step is the whole build, one copy does for both.
  const bool whole = build.at() == build.compared_step;
  Built& seen = whole ? held : shown;
  held.start(build.compared_step);
  if (!whole) shown.start(build.at());
  Distance built_distance;

  Distance heads_distance;
  Distance record_distance;
  float mix_seen = -1.0f;
  float dry_gain = 1.0f;
  float wet_gain = 0.0f;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    // Time moves half way through the loop and back at its start, each time
    // as a turn of the control: the device's motor follows.
    const int at = i % frames;
    if (at == 0 && i > 0) {
      echo.set_param(kTime, time.value);
      held.turn(time.value);
      if (!whole) shown.turn(time.value);
    }
    if (at == frames / 2) {
      echo.set_param(kTime, time.value + nudge.value);
      held.turn(time.value + nudge.value);
      if (!whole) shown.turn(time.value + nudge.value);
    }

    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    // Asleep, the device does nothing to its tape (kit::IdleGate): any input wakes it.
    const bool runs = left != 0.0f || right != 0.0f || !echo.idle_.asleep();
    echo.in_left()[0] = left;
    echo.in_right()[0] = right;
    echo.process(1);

    // The build part, beside the device.
    held.run(left, right);
    if (!whole) shown.run(left, right);
    if (i >= frames) {
      built_distance.add(held.out[0], echo.out_left()[0]);
      built_distance.add(held.out[1], echo.out_right()[0]);
    }

    // The first time round only fills the tape, and no stage of it is worked
    // out. Its first sample is: a tap takes its room on its first put, and
    // the order the taps take it in is the order of that sample's puts.
    if (i > 0 && i < frames) continue;

    built.put(i, seen.out[0], seen.out[1]);
    built_tape.put(i, seen.written[0]);
    built_heads.put(i, seen.read_now[0]);
    built_right.put(i, seen.read_now[1]);
    built_back.put(i, seen.back_now[0]);
    built_delay.put(i, seen.behind * 1000.0f / lab::kSampleRate);

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
  build.difference.value = built_distance.db();

  draw_built_read(seen);
  draw_memory();
  read_between();
  measure_repeats();
  draw_saturation();
  go_round();
}
