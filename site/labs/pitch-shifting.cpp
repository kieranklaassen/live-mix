// Pitch shifting: the Pitch Shifter (cpp/devices/pitch-shifter) run one
// sample at a time, with its twelve parameters as the page's controls.
//
//   in ─(+)─► band limit ─► ring ─┬─► head A × its gain ─┐
//        ▲                        └─► head B × its gain ─┴─► voice A ─► Tone ─► place ─► mix ─► out
//        └──────── Feedback ◄─────────────────────────────────┘
//
// Vintage, where the lesson starts, is the plain method: two heads half a
// stretch apart sweep a fixed stretch of the ring and jump back where their
// gain is zero (ShiftVoice::sweep). Smooth starts each new head where the
// ring best matches what the old head is playing (ShiftVoice::find_splice).
// Grain overlaps four heads at a time, and Chords has no heads at all: it
// moves the peaks of the ring's spectrum (ChordEngine.h).
//
// Read from the device: the ratio of each voice, what it recorded (the newest
// sample of its ring), where each head is (the sweep's phase and stretch in
// Vintage, the heads' own delays in Smooth and Grain), the match the last
// splice search found, voice A, where each voice is placed, the output, and
// the band limit's two filters, copied and fed one sample to draw their
// response.
//
// Voice A is a local of the device's process() and is not kept, but it is
// what the device hands its Tone filter, and that filter keeps its three
// outputs, which add back up to what went in (kit::Svf: high = x − k·band −
// low). The "voice" tap is that sum.
//
// Written for the lesson: the loop read faster with nothing else done, as a
// tape played fast would be (the "tape" tap: the first piece of the build
// part, kept on the main path so that the lesson can show it failing), and
// each head's sound alone. The device adds the heads
// up as it reads them, so the lab reads the ring again at the device's own
// head positions with the device's own interpolation and gains. The "heads"
// check is how far the heads, added, land from the device's voice. Two heads
// are shown: in Grain, where four sound at once, each of the two taps holds
// every other grain. In Chords there is no head to read and the check says
// so: it reads 0 dB, no agreement at all.
//
// The kit keeps the plain method by itself as kit::DelayPitchShifter
// (cpp/kit/pitch.h), which no device uses as it stands. The lab runs it on
// what a second Pitch Shifter, kept in Vintage, recorded; the "kit" check is
// how far it lands from that device's voice.
//
// The build part puts the plain method together a piece at a time, on a path
// of its own (lab::Build in lab.h). It has five pieces, each a function of
// `Built` below, in the order the steps add them: the loop read faster, as a
// tape would be; one head sweeping a ring of the live sound; a window on the
// head; a second head; the band limit on what is recorded. The first is not
// in the device at all, and is there to show what the rest are for. With all
// five the build does to a sample what the device's Vintage voice does, in
// the same order, and on every render it is compared with the voice of the
// second Pitch Shifter, kept in Vintage at the page's Pitch A and Size with
// everything else out of the way (the "builtDifference" check).
//
// The lab starts on one voice, in Vintage, with Tone open as far as it goes
// and Mix all the way to the shifted sound.
//
// lab-memory-mb: 96

#include "lab.h"

#include "../../cpp/devices/pitch-shifter/pitch_shifter.h"

using namespace livemix;
using namespace livemix::pitch_shifter_dsp;

namespace {

PitchShifter shifter;
PitchShifter vintage;  // a second device, kept in Vintage: what the kit and the build are held to
kit::DelayPitchShifter<32768> plain;
kit::Hilbert pair_in;
kit::Hilbert pair_voice;

constexpr int kFineSize = 32768;
constexpr int kFineBins = kFineSize / 2 + 1;
kit::Fft<kFineSize> fine_fft;
float fine_window[kFineSize];
float fine_re[kFineSize];
float fine_im[kFineSize];
double fine_power[kFineBins];

// The device's own twelve parameters, by its own ids (cpp/devices/pitch-shifter/device.json).
lab::Control pitch_a{"pitchA", "Pitch A", "st", -24.0f, 24.0f, 12.0f};
lab::Control pitch_b{"pitchB", "Pitch B", "st", -24.0f, 24.0f, -12.0f};
lab::Control level_b{"levelB", "Voice B", "", 0.0f, 1.0f, 0.0f};
lab::Control detune{"detune", "Detune", "ct", 0.0f, 50.0f, 0.0f};
lab::Control mode{"mode", "Mode", "", 0.0f, 3.0f, 2.0f, lab::kLinear, "Smooth|Grain|Vintage|Chords"};
lab::Control size{"size", "Size", "ms", 10.0f, 400.0f, 60.0f, lab::kLog};
lab::Control jitter{"jitter", "Jitter", "", 0.0f, 1.0f, 0.0f};
lab::Control delay{"delay", "Delay", "ms", 0.0f, 1000.0f, 0.0f};
lab::Control feedback{"feedback", "Feedback", "", 0.0f, 0.95f, 0.0f};
lab::Control tone{"tone", "Tone", "Hz", 800.0f, 18000.0f, 18000.0f, lab::kLog};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap tape{"tape", "The loop read faster, as a tape would be", lab::kAudio, lab::kLesson, 2};
lab::Tap ratios{"ratios", "The ratio for each interval", lab::kCurve, lab::kKit, 1};
lab::Tap ratio_a{"ratioA", "Voice A, samples read for each one written", lab::kControl, lab::kDevice, 1};
lab::Tap ratio_b{"ratioB", "Voice B, samples read for each one written", lab::kControl, lab::kDevice, 1};
lab::Tap guard{"guard", "The band limit", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap ring_tap{"ring", "What is recorded", lab::kAudio, lab::kDevice, 2};
lab::Tap delay_a{"delayA", "Head A, how far behind", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap delay_b{"delayB", "Head B, how far behind", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap gain_a{"gainA", "Head A, its gain", lab::kControl, lab::kLesson, 1, ""};
lab::Tap gain_b{"gainB", "Head B, its gain", lab::kControl, lab::kLesson, 1, ""};
lab::Tap head_a{"headA", "Head A alone", lab::kAudio, lab::kLesson, 2};
lab::Tap head_b{"headB", "Head B alone", lab::kAudio, lab::kLesson, 2};
lab::Tap voice_tap{"voice", "Voice A: its heads together", lab::kAudio, lab::kDevice, 2};
lab::Tap level_in{"levelIn", "Level of the input", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level of voice A", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap match_tap{"match", "Match found at the last splice", lab::kControl, lab::kDevice, 1, ""};
lab::Tap seam_a{"seamA", "Head A, across one splice", lab::kCurve, lab::kLesson, 1};
lab::Tap seam_b{"seamB", "Head B, across the same splice", lab::kCurve, lab::kLesson, 1};
lab::Tap seam_voice{"seamVoice", "Voice A, across the same splice", lab::kCurve, lab::kDevice, 1};
lab::Tap fine{"fine", "Voice A's spectrum, 1.5 Hz to a point", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap pan_a{"panA", "Voice A, from left to right", lab::kControl, lab::kDevice, 1, ""};
lab::Tap pan_b{"panB", "Voice B, from left to right", lab::kControl, lab::kDevice, 1, ""};
lab::Tap picture{"picture", "The output, its spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check heads_check{"heads", "The heads read again and added, against the device's voice", "dB"};
lab::Check kit_check{"kit", "The kit's own shifter, against the voice of a Pitch Shifter kept in Vintage", "dB"};

lab::Tap built{"built", "The shifter so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_ahead{"builtAhead", "How far ahead of the present the head reads", lab::kControl, lab::kLesson, 1,
                     "s"};
lab::Tap built_ring{"builtRing", "What the build records", lab::kAudio, lab::kLesson, 2};
lab::Tap built_delay{"builtDelay", "Head A as built, how far behind", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap built_delay_b{"builtDelayB", "Head B as built, how far behind", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap built_gain{"builtGain", "Head A as built, its gain", lab::kControl, lab::kLesson, 1, ""};
lab::Tap built_gain_b{"builtGainB", "Head B as built, its gain", lab::kControl, lab::kLesson, 1, ""};

// The closest a head comes to the newest sample, in samples: the device's own floor.
float floor_delay() { return kit::max(ShiftVoice::kMinDelay, ShiftVoice::kFloorSeconds * lab::kSampleRate); }

// A ring at `delay` samples behind `origin`, between samples by the kit's
// cubic: the device's own read (ShiftVoice::render).
template <int Size>
float read_at(const kit::DelayLine<Size>& line, double origin, double delay) {
  const double position = origin - delay;
  const double floored = std::floor(position);
  const int index = static_cast<int>(static_cast<long long>(floored) & (Size - 1));
  const float t = static_cast<float>(position - floored);
  return kit::hermite(line.at(index - 1), line.at(index), line.at(index + 1), line.at(index + 2), t);
}

// The shifter so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kFaster = 0, kSweep, kWindow, kSecond, kLimit };

  int pieces = kFaster;
  kit::DelayLine<32768> ring[2];   // the last two thirds of a second, left and right
  kit::Svf limit[2][2];            // the band limit: [stage][channel]
  float ratio = 1.0f;              // samples read for each one written
  float stretch = 2880.0f;         // Size in samples: the stretch of ring a head sweeps
  float phase = 0.0f;              // where head A is in its stretch, 0 to 1
  float behind[2] = {0.0f, 0.0f};  // each head: how far behind the newest sample, in samples
  float gain[2] = {0.0f, 0.0f};    // each head: its gain
  float ahead = 0.0f;              // the first piece: how far ahead of the present it reads, in samples
  float recorded[2] = {0.0f, 0.0f};
  float out[2] = {0.0f, 0.0f};

  // Read faster: the loop is all there already, as on a tape, and the head
  // goes along it `ratio` samples for each sample that comes out, from the
  // loop's first sample. The pitch rises, and the head runs further ahead of
  // the present with every sample.
  void faster(int i) {
    const double since = static_cast<double>(i - lab::frames());  // samples since the loop began
    const double place = since * ratio;
    ahead = static_cast<float>(place - since);
    const double floored = std::floor(place);
    const double round = floored - std::floor(floored / lab::frames()) * lab::frames();
    const int at = static_cast<int>(round) + lab::frames();
    const float t = static_cast<float>(place - floored);
    for (int c = 0; c < 2; ++c) {
      out[c] = kit::hermite(lab::in_at(c, at - 1), lab::in_at(c, at), lab::in_at(c, at + 1), lab::in_at(c, at + 2), t);
    }
  }

  // A sawtooth delay: the head reads a ring of the live sound, `behind`
  // samples back. With every sample it comes ratio − 1 samples nearer (or
  // falls that much further behind), and at the end of its stretch its phase
  // wraps: it jumps to the other end.
  void sweep() {
    phase += (1.0f - ratio) / stretch;
    phase -= std::floor(phase);
    behind[0] = floor_delay() + phase * stretch;
    gain[0] = 1.0f;
  }

  // A window: the head's gain is a raised cosine of its phase, nothing at
  // either end of the stretch and 1 in the middle, so the jump is silent.
  void window() { gain[0] = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase); }

  // A second head, half a stretch from the first, under a window of its own:
  // it is at its loudest while the first one jumps, and the two gains add to 1.
  void second() {
    float other = phase + 0.5f;
    if (other >= 1.0f) other -= 1.0f;
    behind[1] = floor_delay() + other * stretch;
    gain[1] = 0.5f - 0.5f * kit::SineTable::cos_lookup(other);
  }

  // The band limit: what is recorded goes through two low-passes first, set
  // where the fastest reading still comes out under half the sample rate.
  float limited(int c, float x) { return flush_denormal(limit[1][c].lowpass(limit[0][c].lowpass(x))); }

  // One sample through the pieces built so far. The heads read before the
  // new sample is written, as the device's do.
  void run(int i, float left, float right) {
    if (pieces < kSweep) return faster(i);
    sweep();
    if (pieces >= kWindow) window();
    if (pieces >= kSecond) second();
    const float in[2] = {left, right};
    for (int c = 0; c < 2; ++c) {
      const double origin = ring[c].write_position();
      out[c] = gain[0] * read_at(ring[c], origin, behind[0]);
      if (pieces >= kSecond) out[c] += gain[1] * read_at(ring[c], origin, behind[1]);
      recorded[c] = pieces >= kLimit ? limited(c, in[c]) : in[c];
      ring[c].write(recorded[c]);
    }
  }

  void start(int pieces_) {
    pieces = pieces_;
    ratio = kit::clamp(kit::semitones_to_ratio(pitch_a.value), 0.25f, 4.0f);
    stretch = kit::max(64.0f, size.value * 0.001f * lab::kSampleRate);
    const float top = 0.45f * lab::kSampleRate / kit::max(1.0f, ratio);
    for (int c = 0; c < 2; ++c) {
      ring[c].clear();
      limit[0][c].set(top, 0.5412f, lab::kSampleRate);
      limit[1][c].set(top, 1.3066f, lab::kSampleRate);
      limit[0][c].reset();
      limit[1][c].reset();
    }
    phase = 0.0f;
    ahead = 0.0f;
    rest();
  }

  // Nothing has gone in yet: the device sleeps, and the heads stand still.
  void rest() {
    for (int c = 0; c < 2; ++c) behind[c] = gain[c] = recorded[c] = out[c] = 0.0f;
  }
};

lab::Build build{"Read faster|A sawtooth delay|A window|A second head|A band limit", Built::kLimit, -130.0f,
                 "The shifter as built, all five pieces, against the voice of a Pitch Shifter kept in Vintage"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device
Built sped;   // the first piece alone, on the main path: the loop read faster

// One head as the lab read it: where it was, its gain, and its sound alone.
struct HeadRead {
  float delay_ms = 0.0f;
  float gain = 0.0f;
  float left = 0.0f;
  float right = 0.0f;
  float phase = 2.0f;  // of the head shown; the youngest wins
};

HeadRead shown_head[2];
bool was_active[ShiftVoice::kMaxHeads];
float last_phase[ShiftVoice::kMaxHeads];
int role_of[ShiftVoice::kMaxHeads];
int next_role = 0;

// No head sounds. Each keeps the delay it was last shown at.
void silence_heads() {
  for (HeadRead& one : shown_head) one.gain = one.left = one.right = 0.0f;
}

// Voice A's heads for the sample the device has just made: fills
// `shown_head` and returns the heads' sum.
void read_heads(float* sum_left, float* sum_right) {
  ShiftVoice& voice = shifter.voice_[0];
  const Ring& ring = shifter.ring_;
  const float sr = lab::kSampleRate;
  const float ratio = shifter.ratio_[0];
  const double base = static_cast<double>(shifter.base_.value);
  // The device read before it wrote: its "now" was one sample back.
  const double origin = static_cast<double>((ring.now() - 1) & kRingMask) - base;
  const double limit = static_cast<double>(ShiftVoice::kMaxDelay) - base;
  const float base_ms = static_cast<float>(base) * 1000.0f / sr;
  *sum_left = *sum_right = 0.0f;
  shown_head[0].phase = shown_head[1].phase = 2.0f;
  silence_heads();
  if (!shifter.voices_on_) return;  // Chords: no head to read

  if (voice.sweeping_) {
    // Vintage: one phase for the pair, the second head half a turn on.
    for (int k = 0; k < 2; ++k) {
      const float phase = voice.sweep_seen_[k];
      const float weight = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase);
      double delay = static_cast<double>(floor_delay() + voice.sweep_offset_[k] +
                                         phase * voice.sweep_window_ * voice.sweep_stretch_[k]);
      if (delay > limit) delay = limit;
      const float l = read_at(ring.left, origin, delay);
      const float r = read_at(ring.right, origin, delay);
      shown_head[k].delay_ms = base_ms + static_cast<float>(delay) * 1000.0f / sr;
      shown_head[k].gain = weight;
      shown_head[k].left = weight * l;
      shown_head[k].right = weight * r;
      *sum_left += weight * l;
      *sum_right += weight * r;
    }
    return;
  }

  // Smooth and Grain: every head that sounded in this sample, as it was
  // before the device moved it on. A head that ran out in this sample is
  // still read: it sounded once more, at a gain next to nothing.
  float window[ShiftVoice::kMaxHeads];
  float left[ShiftVoice::kMaxHeads];
  float right[ShiftVoice::kMaxHeads];
  double delay[ShiftVoice::kMaxHeads];
  float phase[ShiftVoice::kMaxHeads];
  bool sounded[ShiftVoice::kMaxHeads];
  float product = 1.0f;
  int joined = 0;
  for (int s = 0; s < ShiftVoice::kMaxHeads; ++s) {
    const ShiftVoice::Head& head = voice.heads_[s];
    const bool fresh = head.active && (!was_active[s] || head.phase < last_phase[s]);
    sounded[s] = head.active || was_active[s];
    if (fresh) {
      role_of[s] = next_role;
      next_role ^= 1;
    }
    was_active[s] = head.active;
    last_phase[s] = head.phase;
    if (!sounded[s]) continue;
    phase[s] = head.phase - head.phase_step;
    delay[s] = head.delay - (1.0 - static_cast<double>(ratio * head.detune));
    window[s] = ShiftVoice::window_at(phase[s], head.edge);
    left[s] = read_at(ring.left, origin, delay[s]);
    right[s] = read_at(ring.right, origin, delay[s]);
    if (head.mode == kSmooth) {
      product *= window[s];
      ++joined;
    }
  }
  // The device's lift: two Smooth heads that do not agree dip in power as they cross.
  float lift = 1.0f;
  if (joined == 2 && voice.match_ < 0.999f) {
    lift /= std::sqrt(kit::max(0.25f, 1.0f - 2.0f * product * (1.0f - voice.match_)));
  }
  for (int s = 0; s < ShiftVoice::kMaxHeads; ++s) {
    if (!sounded[s]) continue;
    const ShiftVoice::Head& head = voice.heads_[s];
    const bool smooth = head.mode == kSmooth;
    // A Smooth head is lifted; a grain has a gain of its own on each side.
    const float l = window[s] * (smooth ? lift : head.gain_left) * left[s];
    const float r = window[s] * (smooth ? lift : head.gain_right) * right[s];
    HeadRead& one = shown_head[role_of[s] & 1];
    one.left += l;
    one.right += r;
    if (phase[s] < one.phase) {
      one.phase = phase[s];
      one.gain = window[s] * (smooth ? lift : head.gain_left);
      one.delay_ms = base_ms + static_cast<float>(delay[s]) * 1000.0f / sr;
    }
    *sum_left += l;
    *sum_right += r;
  }
}

// The band limit's curve: the device's own two filters as it left them,
// copied, cleared and fed one unit sample.
void measure_guard() {
  constexpr int kLength = 512;
  kit::Svf first = shifter.guard_[0][0];
  kit::Svf second = shifter.guard_[1][0];
  first.reset();
  second.reset();
  float* h = lab::take(kLength);
  if (!h) return;
  for (int n = 0; n < kLength; ++n) h[n] = second.lowpass(first.lowpass(n == 0 ? 1.0f : 0.0f));
  lab::response_tap(guard, h, kLength);
}

// The ratio the kit gives each whole number of semitones, two octaves either way.
void measure_ratios() {
  constexpr int kSteps = 49;
  if (!ratios.open(kSteps)) return;
  ratios.x0 = -24.0f;
  ratios.x1 = 24.0f;
  for (int s = 0; s < kSteps; ++s) ratios.set(s, kit::semitones_to_ratio(static_cast<float>(s - 24)));
}

// The average spectrum of the voice from frames of 32768 samples, eight
// times as long as the page's own: lines 5 Hz apart stand apart. In dB where
// a full-scale sine reads 0, as lab::spectrum has it.
void measure_fine() {
  const float* x = voice_tap.channel(0);
  if (!x || !fine.open(kFineBins)) return;
  fine.x0 = 0.0f;
  fine.x1 = lab::kSampleRate * 0.5f;
  // Past the 20 ms at the loop's start where two passes are crossfaded.
  const int from = voice_tap.length > 2 * lab::kFadeFrames ? lab::kFadeFrames : 0;
  const int count = voice_tap.length - from;
  for (int k = 0; k < kFineBins; ++k) fine_power[k] = 0.0;
  int done = 0;
  const int hop = kFineSize / 2;
  for (int start = 0; start == 0 || start + kFineSize <= count; start += hop) {
    for (int n = 0; n < kFineSize; ++n) {
      const int i = start + n;
      fine_re[n] = i < count ? x[from + i] * fine_window[n] : 0.0f;
      fine_im[n] = 0.0f;
    }
    fine_fft.forward(fine_re, fine_im);
    for (int k = 0; k < kFineBins; ++k) {
      fine_power[k] += static_cast<double>(fine_re[k]) * fine_re[k] + static_cast<double>(fine_im[k]) * fine_im[k];
    }
    ++done;
  }
  const double full = (kFineSize / 4.0) * (kFineSize / 4.0);
  for (int k = 0; k < kFineBins; ++k) {
    fine.data[k] = lab::power_to_db(static_cast<float>(fine_power[k] / (done * full)));
  }
}

// Twelve milliseconds of the loop with one splice in the middle: the first
// place after one second where the two heads' gains cross. Each head alone,
// and the voice the device made of them.
void measure_seam() {
  constexpr int kHalf = 288;  // 6 ms either side
  const int points = 2 * kHalf + 1;
  const float* a = head_a.channel(0);
  const float* b = head_b.channel(0);
  const float* both = voice_tap.channel(0);
  const float* ga = gain_a.channel(0);
  const float* gb = gain_b.channel(0);
  if (!a || !b || !both || !ga || !gb || head_a.length < 4 * points) return;
  if (!seam_a.open(points) || !seam_b.open(points) || !seam_voice.open(points)) return;
  seam_a.x0 = seam_b.x0 = seam_voice.x0 = -1000.0f * kHalf / lab::kSampleRate;
  seam_a.x1 = seam_b.x1 = seam_voice.x1 = 1000.0f * kHalf / lab::kSampleRate;
  const int first = gain_a.length > 4000 ? 3000 : gain_a.length / 4;
  int centre = first * lab::kControlPeriod;
  for (int k = first + 1; k < gain_a.length; ++k) {
    const bool crossed = (ga[k - 1] - gb[k - 1]) * (ga[k] - gb[k]) <= 0.0f && ga[k] != gb[k - 1];
    if (crossed && ga[k] > 0.2f && gb[k] > 0.2f) {
      centre = k * lab::kControlPeriod;
      break;
    }
  }
  if (centre < kHalf) centre = kHalf;
  if (centre > head_a.length - kHalf - 1) centre = head_a.length - kHalf - 1;
  for (int n = 0; n < points; ++n) {
    seam_a.set(n, a[centre - kHalf + n]);
    seam_b.set(n, b[centre - kHalf + n]);
    seam_voice.set(n, both[centre - kHalf + n]);
  }
}

// Where the device has placed a voice, from −1 (left) to 1 (right): its two
// gains on the voice's middle, turned back into the pan they were made from.
float placed(int v) {
  const float left = shifter.mid_left_[v].value;
  const float right = shifter.mid_right_[v].value;
  if (left <= 0.0f && right <= 0.0f) return 0.0f;
  return std::atan2(right, left) * (4.0f / kit::kPi) - 1.0f;
}

void configure(PitchShifter& device, bool whole) {
  using namespace pitch_shifter;
  device.init(lab::kSampleRate);
  device.set_param(kPitchA, pitch_a.value);
  device.set_param(kSize, size.value);
  // The second device: Vintage, one voice, and nothing else in the way.
  device.set_param(kPitchB, whole ? pitch_b.value : 0.0f);
  device.set_param(kLevelB, whole ? level_b.value : 0.0f);
  device.set_param(kDetune, whole ? detune.value : 0.0f);
  device.set_param(kMode, whole ? static_cast<float>(mode.choice()) : static_cast<float>(kVintage));
  device.set_param(kJitter, whole ? jitter.value : 0.0f);
  device.set_param(kDelay, whole ? delay.value : 0.0f);
  device.set_param(kFeedback, whole ? feedback.value : 0.0f);
  device.set_param(kTone, whole ? tone.value : kParamMax[kTone]);
  device.set_param(kSpread, whole ? spread.value : 0.0f);
  device.set_param(kMix, whole ? mix.value : 1.0f);
}

// One sample through a device. False when it slept: nothing has gone in yet,
// or nothing for three seconds, and then it makes no sample and its clock
// stands still.
bool step(PitchShifter& device, float left, float right) {
  device.in_left()[0] = left;
  device.in_right()[0] = right;
  const int tick = device.clock_.counter;
  device.process(1);
  return device.clock_.counter != tick;
}

// What voice A handed its Tone filter: the filter's three outputs, added up.
float voice_of(const PitchShifter& device, int channel) {
  const kit::Svf& filter = device.tone_[0][channel];
  return filter.high + filter.k * filter.band + filter.low;
}

}  // namespace

void lab_setup() {
  fine_fft.init();
  for (int n = 0; n < kFineSize; ++n) {
    fine_window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kFineSize));
  }
}

void lab_render(int frames) {
  configure(shifter, true);
  configure(vintage, false);

  plain.clear();
  pair_in.reset();
  pair_voice.reset();
  for (int s = 0; s < ShiftVoice::kMaxHeads; ++s) {
    was_active[s] = false;
    last_phase[s] = 0.0f;
    role_of[s] = 0;
  }
  next_role = 0;
  shown_head[0] = shown_head[1] = HeadRead();

  shown.start(build.at());
  held.start(build.compared_step);
  sped.start(Built::kFaster);

  const int behind = static_cast<int>(floor_delay());

  // The first pass of a loop is there so that tails are sounding when the
  // second starts. With no feedback this device remembers no further back
  // than its heads reach: the Delay, a Size and the floor in Vintage; where a
  // head going up starts far enough back for its whole life, the faster ratio
  // times a Size and a half, the search's 36 ms and what Jitter scatters; in
  // Chords, its long window. A head sounding when the kept pass starts began
  // up to a Size before it. So the lab starts the device twice that reach
  // before the pass that is kept, and no earlier. With Feedback up, what
  // rings is as long as the loop, and the whole first pass is played.
  const int total = lab::total();
  const float fastest =
      kit::max(1.0f, kit::max(kit::semitones_to_ratio(pitch_a.value + 1.0f), kit::semitones_to_ratio(pitch_b.value + 1.0f)));
  const float reach_seconds = size.value * 0.001f * (1.5f * fastest + jitter.value) + 0.06f + 0.02f * jitter.value +
                              delay.value * 0.001f + (mode.choice() == 3 ? 0.5f : 0.0f);
  const int warm = 2 * static_cast<int>(reach_seconds * lab::kSampleRate) + 4800;
  const int first = feedback.value > 0.0f || frames <= warm ? 0 : frames - warm;

  double heads_error = 0.0, heads_whole = 0.0;
  double kit_error = 0.0, vintage_left_whole = 0.0;
  double built_error = 0.0, vintage_whole = 0.0;
  for (int i = first; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const bool ran = step(shifter, left, right);
    const bool vintage_ran = step(vintage, left, right);

    float voice_left = 0.0f, voice_right = 0.0f;
    float recorded_left = 0.0f, recorded_right = 0.0f;
    if (ran) {
      voice_left = voice_of(shifter, 0);
      voice_right = voice_of(shifter, 1);
      recorded_left = shifter.ring_.left.read(1);
      recorded_right = shifter.ring_.right.read(1);
      float sum_left, sum_right;
      read_heads(&sum_left, &sum_right);
      if (i >= frames) {
        const double d = static_cast<double>(sum_left) - voice_left;
        heads_error += d * d;
        heads_whole += static_cast<double>(voice_left) * voice_left;
      }
    } else {
      silence_heads();
    }

    // The second device, the kit's shifter on what it recorded, and the build.
    if (vintage_ran) {
      const float vintage_left = voice_of(vintage, 0);
      const float vintage_right = voice_of(vintage, 1);
      plain.set_window(vintage.setup_[0].size);
      const float by_kit = plain.process(vintage.ring_.left.read(behind), vintage.ratio_[0]);
      shown.run(i, left, right);
      held.run(i, left, right);
      if (i >= frames) {
        const double e = static_cast<double>(by_kit) - vintage_left;
        const double apart_left = static_cast<double>(held.out[0]) - vintage_left;
        const double apart_right = static_cast<double>(held.out[1]) - vintage_right;
        kit_error += e * e;
        built_error += apart_left * apart_left + apart_right * apart_right;
        vintage_left_whole += static_cast<double>(vintage_left) * vintage_left;
        vintage_whole += static_cast<double>(vintage_left) * vintage_left;
        vintage_whole += static_cast<double>(vintage_right) * vintage_right;
      }
    } else if (shown.pieces < Built::kSweep) {
      shown.run(i, left, right);  // the tape needs nobody awake
    } else {
      shown.rest();
    }

    // The two pairs run on every sample. A level is worked out only on the
    // one sample in sixteen a control tap keeps; the put is made on every
    // sample all the same, since the loop can start between two of those and
    // a tap takes its room on its first put.
    const bool point = i % lab::kControlPeriod == 0;
    float same, quarter;
    pair_in.process(left, &same, &quarter);
    level_in.put(i, point ? lab::to_db(std::sqrt(same * same + quarter * quarter)) : 0.0f);
    pair_voice.process(voice_left, &same, &quarter);
    level.put(i, point ? lab::to_db(std::sqrt(same * same + quarter * quarter)) : 0.0f);

    in_tap.put(i, left, right);
    sped.run(i, left, right);
    tape.put(i, sped.out[0], sped.out[1]);
    ratio_a.put(i, shifter.ratio_[0]);
    ratio_b.put(i, shifter.ratio_[1]);
    ring_tap.put(i, recorded_left, recorded_right);
    delay_a.put(i, shown_head[0].delay_ms);
    delay_b.put(i, shown_head[1].delay_ms);
    gain_a.put(i, shown_head[0].gain);
    gain_b.put(i, shown_head[1].gain);
    head_a.put(i, shown_head[0].left, shown_head[0].right);
    head_b.put(i, shown_head[1].left, shown_head[1].right);
    voice_tap.put(i, voice_left, voice_right);
    match_tap.put(i, shifter.voice_[0].match_);
    pan_a.put(i, placed(0));
    pan_b.put(i, placed(1));
    out_tap.put(i, shifter.out_left()[0], shifter.out_right()[0]);

    const float ms = 1000.0f / lab::kSampleRate;
    built.put(i, shown.out[0], shown.out[1]);
    built_ring.put(i, shown.recorded[0], shown.recorded[1]);
    built_ahead.put(i, shown.ahead / lab::kSampleRate);
    built_delay.put(i, shown.behind[0] * ms);
    built_delay_b.put(i, shown.behind[1] * ms);
    built_gain.put(i, shown.gain[0]);
    built_gain_b.put(i, shown.gain[1]);
  }

  heads_check.value = lab::ratio_db(heads_error, heads_whole);
  kit_check.value = lab::ratio_db(kit_error, vintage_left_whole);
  build.difference.value = lab::ratio_db(built_error, vintage_whole);
  measure_guard();
  measure_ratios();
  measure_fine();
  measure_seam();
  if (out_tap.channel(0)) lab::spectrogram_tap(picture, out_tap.channel(0), out_tap.length);
}
