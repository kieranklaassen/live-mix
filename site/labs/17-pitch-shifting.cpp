// Lesson 17, pitch shifting: the Pitch Shifter (cpp/devices/pitch-shifter)
// run one sample at a time, in the two of its four modes that are a pair of
// read heads on a delay line.
//
//   in ──► band limit ──► ring ──┬──► head A × its gain ──┐
//                                └──► head B × its gain ──┴──► voice ──► Tone ──► mix ──► out
//
// Vintage, where the lesson starts, is the plain method: two heads half a
// window apart sweep a fixed stretch of the ring and jump back where their
// gain is zero (ShiftVoice::sweep). Smooth starts each new head where the
// ring best matches what the old head is playing (ShiftVoice::find_splice).
//
// Read from the device: what it recorded (the newest sample of its ring),
// where each head is (the sweep's phase and window in Vintage, the heads'
// own delays in Smooth), the match the last splice search found, the voice,
// the output, and the band limit's two filters, copied and fed one sample to
// draw their response.
//
// The voice is a local of the device's process() and is not kept, but it is
// what the device hands its Tone filter, and that filter keeps its three
// outputs, which add back up to what went in (kit::Svf: high = x − k·band −
// low). The "voice" tap is that sum.
//
// Written for the lesson: each head's sound alone. The device adds the heads
// up as it reads them, so the lab reads the ring again at the device's own
// head positions with the device's own interpolation and gains. The "heads"
// check is how far the two, added, land from the device's voice.
//
// The kit keeps the plain method by itself as kit::DelayPitchShifter
// (cpp/kit/pitch.h), which no device uses as it stands. The lab runs it on
// the same recording; the "kit" check is how far it lands from the device's
// voice. In Vintage the two are the same arithmetic. In Smooth they are not,
// and the check says by how much.
//
// Voice B is kept at seven semitones, a fifth above, and is silent until its
// level is raised. Jitter, Delay, Feedback and Spread stay at zero (both
// voices in the middle) and Tone is open as far as it goes.

#include "lab.h"

#include "../../cpp/devices/pitch-shifter/pitch_shifter.h"

using namespace livemix;
using namespace livemix::pitch_shifter_dsp;

namespace {

PitchShifter shifter;
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

lab::Control semitones{"semitones", "Pitch", "st", -24.0f, 24.0f, 12.0f};
lab::Control size{"size", "Size", "ms", 10.0f, 400.0f, 60.0f, lab::kLog};
lab::Control mode{"mode", "Mode", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Vintage|Smooth"};
lab::Control level_b{"levelB", "Voice B, a fifth above", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap ring_tap{"ring", "What is recorded", lab::kAudio, lab::kDevice, 2};
lab::Tap delay_a{"delayA", "Head A, how far behind", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap delay_b{"delayB", "Head B, how far behind", lab::kControl, lab::kDevice, 1, "ms"};
lab::Tap gain_a{"gainA", "Head A, its gain", lab::kControl, lab::kLesson, 1, ""};
lab::Tap gain_b{"gainB", "Head B, its gain", lab::kControl, lab::kLesson, 1, ""};
lab::Tap head_a{"headA", "Head A alone", lab::kAudio, lab::kLesson, 2};
lab::Tap head_b{"headB", "Head B alone", lab::kAudio, lab::kLesson, 2};
lab::Tap voice_tap{"voice", "The voice: both heads", lab::kAudio, lab::kDevice, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap level_in{"levelIn", "Level of the input", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level of the voice", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap match_tap{"match", "Match found at the last splice", lab::kControl, lab::kDevice, 1, ""};
lab::Tap guard{"guard", "The band limit", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap fine{"fine", "The voice's spectrum, 1.5 Hz to a point", lab::kSpectrum, lab::kDevice, 1, "dB"};

lab::Check heads_check{"heads", "The two heads read again and added, against the device's voice", "dB"};
lab::Check kit_check{"kit", "The kit's own shifter on the same recording, against the device's voice", "dB"};

// One head as the lab read it: where it was, its gain, and its sound alone.
struct HeadRead {
  float delay_ms = 0.0f;
  float gain = 0.0f;
  float left = 0.0f;
  float right = 0.0f;
  float phase = 2.0f;  // of the head shown; the youngest wins
};

HeadRead shown[2];
bool was_active[16];
float last_phase[16];
int role_of[16];
int next_role = 0;

// The ring at `delay` samples behind where the device's heads count from,
// by the device's own interpolation (ShiftVoice::render).
void read_ring(const Ring& ring, double origin, double delay, float* left, float* right) {
  const double position = origin - delay;
  const double floored = std::floor(position);
  const int index = static_cast<int>(static_cast<long long>(floored) & kRingMask);
  const float t = static_cast<float>(position - floored);
  *left = kit::hermite(ring.left.at(index - 1), ring.left.at(index), ring.left.at(index + 1),
                       ring.left.at(index + 2), t);
  *right = kit::hermite(ring.right.at(index - 1), ring.right.at(index), ring.right.at(index + 1),
                        ring.right.at(index + 2), t);
}

// Voice A's heads for the sample the device has just made: fills `shown`
// and returns the heads' sum.
void read_heads(float* sum_left, float* sum_right) {
  ShiftVoice& voice = shifter.voice_[0];
  const Ring& ring = shifter.ring_;
  const float sr = lab::kSampleRate;
  const float ratio = shifter.ratio_[0];
  const double base = static_cast<double>(shifter.base_.value);
  // The device read before it wrote: its "now" was one sample back.
  const double origin = static_cast<double>((ring.now() - 1) & kRingMask) - base;
  const double limit = static_cast<double>(ShiftVoice::kMaxDelay) - base;
  *sum_left = *sum_right = 0.0f;
  shown[0].phase = shown[1].phase = 2.0f;
  shown[0].gain = shown[1].gain = 0.0f;
  shown[0].left = shown[0].right = shown[1].left = shown[1].right = 0.0f;

  if (voice.sweeping_) {
    // Vintage: one phase for the pair, the second head half a turn on.
    const float floor_delay = kit::max(ShiftVoice::kMinDelay, ShiftVoice::kFloorSeconds * sr);
    for (int k = 0; k < 2; ++k) {
      const float phase = voice.sweep_seen_[k];
      const float weight = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase);
      double delay = static_cast<double>(floor_delay + voice.sweep_offset_[k] +
                                         phase * voice.sweep_window_ * voice.sweep_stretch_[k]);
      if (delay > limit) delay = limit;
      float l, r;
      read_ring(ring, origin, delay, &l, &r);
      shown[k].delay_ms = static_cast<float>(delay) * 1000.0f / sr;
      shown[k].gain = weight;
      shown[k].left = weight * l;
      shown[k].right = weight * r;
      *sum_left += weight * l;
      *sum_right += weight * r;
    }
    return;
  }

  // Smooth: every head that sounded in this sample, as it was before the
  // device moved it on. A head that ran out in this sample is still read: it
  // sounded once more, at a gain next to nothing.
  float window[16], left[16], right[16];
  double delay[16];
  float phase[16];
  bool sounded[16];
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
    read_ring(ring, origin, delay[s], &left[s], &right[s]);
    product *= window[s];
    ++joined;
  }
  // The device's lift: two heads that do not agree dip in power as they cross.
  float lift = 1.0f;
  if (joined == 2 && voice.match_ < 0.999f) {
    lift /= std::sqrt(kit::max(0.25f, 1.0f - 2.0f * product * (1.0f - voice.match_)));
  }
  for (int s = 0; s < ShiftVoice::kMaxHeads; ++s) {
    if (!sounded[s]) continue;
    HeadRead& one = shown[role_of[s] & 1];
    one.left += lift * window[s] * left[s];
    one.right += lift * window[s] * right[s];
    if (phase[s] < one.phase) {
      one.phase = phase[s];
      one.gain = lift * window[s];
      one.delay_ms = static_cast<float>(delay[s]) * 1000.0f / sr;
    }
    *sum_left += lift * window[s] * left[s];
    *sum_right += lift * window[s] * right[s];
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

}  // namespace

void lab_setup() {
  fine_fft.init();
  for (int n = 0; n < kFineSize; ++n) {
    fine_window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * 3.14159265358979323846 * n / kFineSize));
  }
}

void lab_render(int frames) {
  (void)frames;
  using namespace pitch_shifter;
  shifter.init(lab::kSampleRate);
  shifter.set_param(kPitchA, semitones.value);
  shifter.set_param(kPitchB, 7.0f);
  shifter.set_param(kLevelB, level_b.value);
  shifter.set_param(kDetune, 0.0f);
  shifter.set_param(kMode, mode.choice() == 1 ? static_cast<float>(kSmooth) : static_cast<float>(kVintage));
  shifter.set_param(kSize, size.value);
  shifter.set_param(kJitter, 0.0f);
  shifter.set_param(kDelay, 0.0f);
  shifter.set_param(kFeedback, 0.0f);
  shifter.set_param(kTone, kParamMax[kTone]);
  shifter.set_param(kSpread, 0.0f);
  shifter.set_param(kMix, mix.value);

  plain.clear();
  pair_in.reset();
  pair_voice.reset();
  for (int s = 0; s < 16; ++s) {
    was_active[s] = false;
    last_phase[s] = 0.0f;
    role_of[s] = 0;
  }
  next_role = 0;
  shown[0] = shown[1] = HeadRead();

  // The kit's shifter reads 1 sample behind what it is given where the
  // device's heads read 72 behind the ring: it is fed the ring 71 back.
  const int behind = static_cast<int>(kit::max(ShiftVoice::kMinDelay, ShiftVoice::kFloorSeconds * lab::kSampleRate));

  // The first pass of a loop is there so that tails are sounding when the
  // second starts. With no feedback this device remembers no further back
  // than its heads reach: a Size and the floor in Vintage; in Smooth, where a
  // head going up starts far enough back for its whole life, the faster
  // ratio times a Size, and the search's 36 ms. A head sounding when the kept
  // pass starts began up to a Size before it. So the lab starts the device
  // twice that reach before the pass that is kept, and no earlier.
  const int total = lab::total();
  const float fastest = kit::max(1.0f, kit::max(kit::semitones_to_ratio(semitones.value), kit::semitones_to_ratio(7.0f)));
  const int reach = static_cast<int>((size.value * 0.001f * fastest + 0.05f) * lab::kSampleRate);
  const int warm = 2 * reach + 4800;
  const int first = lab::frames() > warm ? lab::frames() - warm : 0;
  double heads_error = 0.0, kit_error = 0.0, reference = 0.0;
  for (int i = first; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    shifter.in_left()[0] = left;
    shifter.in_right()[0] = right;
    const int tick = shifter.clock_.counter;
    shifter.process(1);
    // Asleep (nothing has gone in yet, or nothing for three seconds) the
    // device makes no sample and its clock stands still.
    const bool ran = shifter.clock_.counter != tick;

    float voice_left = 0.0f, voice_right = 0.0f;
    float recorded_left = 0.0f, recorded_right = 0.0f;
    if (ran) {
      const kit::Svf& tone_left = shifter.tone_[0][0];
      const kit::Svf& tone_right = shifter.tone_[0][1];
      voice_left = tone_left.high + tone_left.k * tone_left.band + tone_left.low;
      voice_right = tone_right.high + tone_right.k * tone_right.band + tone_right.low;
      recorded_left = shifter.ring_.left.read(1);
      recorded_right = shifter.ring_.right.read(1);

      float sum_left, sum_right;
      read_heads(&sum_left, &sum_right);
      plain.set_window(shifter.setup_[0].size);
      const float by_kit = plain.process(shifter.ring_.left.read(behind), shifter.ratio_[0]);
      if (i >= lab::frames()) {
        const double d = static_cast<double>(sum_left) - voice_left;
        const double e = static_cast<double>(by_kit) - voice_left;
        heads_error += d * d;
        kit_error += e * e;
        reference += static_cast<double>(voice_left) * voice_left;
      }
    } else {
      shown[0].gain = shown[1].gain = 0.0f;
      shown[0].left = shown[0].right = shown[1].left = shown[1].right = 0.0f;
    }

    float same, quarter;
    pair_in.process(left, &same, &quarter);
    level_in.put(i, lab::to_db(std::sqrt(same * same + quarter * quarter)));
    pair_voice.process(voice_left, &same, &quarter);
    level.put(i, lab::to_db(std::sqrt(same * same + quarter * quarter)));

    in_tap.put(i, left, right);
    ring_tap.put(i, recorded_left, recorded_right);
    delay_a.put(i, shown[0].delay_ms);
    delay_b.put(i, shown[1].delay_ms);
    gain_a.put(i, shown[0].gain);
    gain_b.put(i, shown[1].gain);
    head_a.put(i, shown[0].left, shown[0].right);
    head_b.put(i, shown[1].left, shown[1].right);
    voice_tap.put(i, voice_left, voice_right);
    out_tap.put(i, shifter.out_left()[0], shifter.out_right()[0]);
    match_tap.put(i, shifter.voice_[0].match_);
  }

  const auto against = [&](double error) {
    if (reference <= 0.0) return error <= 0.0 ? lab::kFloorDb : 0.0f;
    const double part = error / reference;
    return part > 1.0e-14 ? static_cast<float>(10.0 * std::log10(part)) : lab::kFloorDb;
  };
  heads_check.value = against(heads_error);
  kit_check.value = against(kit_error);
  measure_guard();
  measure_fine();
}
