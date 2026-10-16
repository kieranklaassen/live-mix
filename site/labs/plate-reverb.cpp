// The plate reverb: the Plate Reverb (cpp/devices/plate-reverb) run
// one sample at a time, with a tap after every stage of it.
//
//   in ─► one channel ─► pre-delay ─► bandwidth filter ─► four all-passes ─┬─► left half ──┐
//                                                                         │    ▲     └────┼──┐
//                                                                         │    └──────────┼─┐│  each half: all-pass (its
//                                                                         └─► right half ─┘ ││  delay moving), delay, damping,
//                                                                              ▲            ││  × decay, all-pass, delay
//                                                                              └────────────┘│
//                                          out, left and right: seven points of the halves' delays each
//
// lab-sources: cpp/devices/plate-reverb/plate_reverb.cpp cpp/devices/plate-reverb/plate_reverb_device.cpp
// lab-memory-mb: 96
// lab-arena-mb: 64
//
// Read from the device: what leaves the pre-delay and the bandwidth filter, and
// in each half of the tank what goes into its two delays, what the damping
// filter holds and what crosses to the other half. These are the device's own
// state.
//
// Worked out here ("lesson"): what each of the four input all-passes puts out.
// The device keeps what an all-pass holds in its delay and not what it hands
// on, which is a local of process(). The lab takes the two samples of the
// all-pass's delay that the device itself used and writes the same line,
// `delayed - gain * feed`. The "rebuilt" check holds each result to what the
// next stage took in, which that stage's own delay gives back. "What the plate
// adds" is the output less the dry sound the device mixed in.
//
// A second plate (`struck`) is given one sample and nothing more, at the same
// settings, so its response can be drawn whatever source plays: the echoes
// after each all-pass and in the tank, how many there are in each 10 ms, how
// the energy dies away as a whole and in two bands, how long each of thirteen
// bands takes to fall 60 dB, and the tail's spectrum over time. The response
// of the input stages does not depend on any control, so it is measured once,
// in lab_setup.
//
// The device has no control over the movement of the tank's two delays. The
// lab holds them still by setting their excursion to nothing after init, and
// gives the movement back as a control.
//
// Beside the plate runs the thing a plate is not: one delay with its output
// fed back, of the first input all-pass's length and gain. It is the lesson's
// own, and is there to be heard and counted against.
//
// The build part puts a plate together a piece at a time, on a path of its
// own beside the device (lab::Build in lab.h). It has eight pieces, each a
// function of `Built` below, in the order the steps add them: one channel and
// a gap; four all-passes; one loop; a second loop, crossed with the first;
// damping; the seven places each side is read at; the movement; the mix. The
// path writes the "built" taps and leaves every other tap as it was. The
// build's memory is the device's own kind of ring (PlateReverb::DelayBuffer)
// and its lengths are read from the device once the device has set them, so
// the build is the pieces and not a second copy of the numbers. Two copies of
// it run: one at the step the reader chose, which is what the taps show, and
// one with all eight pieces, whose output is compared on every render with the
// device's own output (the "builtDifference" check). With all eight the build
// does to a sample what the device does, in the same order, so the two are the
// same sample for sample. A step before the last is the lesson's own: a plate
// with a piece missing, which the device never is. Before the loop the chosen
// step is given one click and nothing more, for the picture of one click
// thickening.

#include "lab.h"

#include "../../cpp/devices/plate-reverb/plate_reverb_device.h"

using namespace livemix;

namespace {

PlateReverbDevice plate;  // the loop goes through this one
PlateReverb struck;       // this one is given a single sample

// The gains the lab writes again. plate_reverb.cpp keeps them in its unnamed
// namespace, out of reach: a wrong one fails "rebuilt" or "builtDifference".
constexpr float kInputGainA = 0.750f;   // input all-passes 1 and 2
constexpr float kInputGainB = 0.625f;   // input all-passes 3 and 4
constexpr float kTankGainA = -0.700f;   // each half's first all-pass, the one whose delay moves
constexpr float kTankGainB = 0.500f;    // each half's second all-pass
constexpr float kReadGain = 0.6f;       // each of the seven places an output is read at

constexpr int kRate = 48000;
constexpr int kWindow = 480;            // 10 ms: the stretch echoes are counted in
constexpr float kEchoFloor = 0.001f;    // 60 dB under the largest sample of that stretch
constexpr int kChain = 32768;           // long enough for the input stages to ring out
constexpr int kHit = 2400;              // 50 ms: the stretch of the input stages that is drawn,
constexpr int kHitLead = 96;            //   of which the first 2 ms are before the sample arrives
constexpr int kInputWindows = 10;       // 100 ms of counts for the input stages
constexpr int kStruck = 8 * kRate;      // the longest the second plate is listened to
constexpr int kStruckLeast = 2 * kRate; // and the shortest
constexpr int kTankHit = kRate;         // 1 s: the stretch of the tank that is drawn and counted,
constexpr int kTankLead = 960;          //   of which the first 20 ms are before the sample arrives
constexpr int kOutHit = 2880;           // 60 ms: the stretch of the two outputs that is drawn
constexpr int kPicture = 4 * kRate;     // the tail's picture
constexpr int kResponsePoints = 241;     // from 20 Hz to 20 kHz in even ratios, for the checks
constexpr int kCombPoints = 801;         // from 0 to 2 kHz in even steps of 2.5 Hz, for the picture
constexpr float kCombTop = 2000.0f;
constexpr int kRung = 12288;             // by here one all-pass, or the delay with feedback, is 120 dB down
constexpr int kCombLength = 229;        // the first input all-pass's length, for a like-for-like echo
constexpr float kCombGain = kInputGainA;
constexpr int kCombRing = 256;          // the memory of the delay with feedback that runs on the loop
constexpr int kBands = 13;              // 250 Hz to 16 kHz, half an octave apart
constexpr float kBandLowest = 250.0f;
constexpr float kBandHighest = 16000.0f;
constexpr int kBandFrame = 1024;        // 21 ms: the stretch a band's level is read over,
constexpr int kBandHop = 512;           //   read again every 11 ms

lab::Control decay{"decay", "Decay", "", 0.0f, 0.9f, 0.5f};
lab::Control damping{"damping", "Damping", "", 0.0f, 1.0f, 0.3f};
lab::Control predelay{"predelay", "Pre-delay", "ms", 0.0f, 250.0f, 20.0f};
lab::Control movement{"movement", "The tank's delays", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Still|Moving"};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

// The loop, stage by stage.
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap combed{"combed", "One delay with its output fed back", lab::kAudio, lab::kLesson, 1};
lab::Tap predelayed{"predelayed", "One channel, after the pre-delay", lab::kAudio, lab::kDevice, 1};
lab::Tap filtered{"filtered", "After the bandwidth filter", lab::kAudio, lab::kDevice, 1};
lab::Tap diffused1{"diffused1", "After one all-pass", lab::kAudio, lab::kLesson, 1};
lab::Tap diffused2{"diffused2", "After two all-passes", lab::kAudio, lab::kLesson, 1};
lab::Tap diffused3{"diffused3", "After three all-passes", lab::kAudio, lab::kLesson, 1};
lab::Tap diffused4{"diffused4", "After four all-passes", lab::kAudio, lab::kLesson, 1};
lab::Tap tank_a{"tankA", "In the tank, after each half's first all-pass", lab::kAudio, lab::kDevice, 2};
lab::Tap damped{"damped", "In the tank, after the delay and the damping", lab::kAudio, lab::kDevice, 2};
lab::Tap tank_b{"tankB", "In the tank, after each half's second all-pass", lab::kAudio, lab::kDevice, 2};
lab::Tap crossing{"crossing", "Crossing to the other half", lab::kAudio, lab::kDevice, 2};
lab::Tap added{"added", "What the plate adds: the output less the dry sound", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap wobble_left{"wobbleLeft", "Left half: added to the first all-pass's delay", lab::kControl, lab::kLesson, 1,
                     "samples"};
lab::Tap wobble_right{"wobbleRight", "Right half: added to the first all-pass's delay", lab::kControl, lab::kLesson, 1,
                      "samples"};

// One sample in: the response of the stages.
lab::Tap hit_comb{"hitComb", "One sample, through one delay with feedback", lab::kCurve, lab::kLesson, 1};
lab::Tap hit1{"hit1", "One sample, after one all-pass", lab::kCurve, lab::kLesson, 1};  // x: ms after the pre-delay
lab::Tap hit2{"hit2", "One sample, after two all-passes", lab::kCurve, lab::kLesson, 1};
lab::Tap hit3{"hit3", "One sample, after three all-passes", lab::kCurve, lab::kLesson, 1};
lab::Tap hit4{"hit4", "One sample, after four all-passes", lab::kCurve, lab::kLesson, 1};
lab::Tap hit_tank{"hitTank", "One sample, going into the left half's first delay", lab::kCurve, lab::kDevice, 1};
lab::Tap hit_left{"hitLeft", "One sample, at the left output", lab::kCurve, lab::kDevice, 1};
lab::Tap hit_right{"hitRight", "One sample, at the right output", lab::kCurve, lab::kDevice, 1};

// How many echoes in each 10 ms of those responses.
lab::Tap density_comb{"densityComb", "Echoes of one delay with feedback", lab::kCurve, lab::kLesson, 1, "in 10 ms"};
lab::Tap density1{"density1", "Echoes after one all-pass", lab::kCurve, lab::kLesson, 1, "in 10 ms"};
lab::Tap density2{"density2", "Echoes after two all-passes", lab::kCurve, lab::kLesson, 1, "in 10 ms"};
lab::Tap density3{"density3", "Echoes after three all-passes", lab::kCurve, lab::kLesson, 1, "in 10 ms"};
lab::Tap density4{"density4", "Echoes after four all-passes", lab::kCurve, lab::kLesson, 1, "in 10 ms"};
lab::Tap density_tank{"densityTank", "Echoes in the tank", lab::kCurve, lab::kDevice, 1, "in 10 ms"};
lab::Tap density_out{"densityOut", "Echoes at the output", lab::kCurve, lab::kDevice, 1, "in 10 ms"};

// What a stage does to each frequency.
lab::Tap response_comb{"responseComb", "One delay with feedback", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap response_allpass{"responseAllpass", "The first input all-pass", lab::kCurve, lab::kLesson, 1, "dB"};

// How the response dies away.
lab::Tap decay_curve{"decayCurve", "Energy still to come", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_low{"decayLow", "Energy still to come, around 500 Hz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_high{"decayHigh", "Energy still to come, around 5 kHz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap fall_bands{"fallBands", "Time to fall 60 dB, at each frequency", lab::kCurve, lab::kDevice, 1, "s"};
lab::Tap tail{"tail", "The response", lab::kFrames, lab::kDevice, 1, "dB"};

// The device's delay lengths as it set them at init, in samples: the four
// input all-passes, then for the left half and the right its moving all-pass
// (at rest), first delay, second all-pass and second delay.
lab::Tap lengths{"lengths", "The delay lengths", lab::kCurve, lab::kDevice, 1, "samples"};

lab::Check rebuilt{"rebuilt", "What each input all-pass put out, worked out again, against what the next stage took in",
                   "dB"};
lab::Check flat_one{"flatOne", "The furthest the first input all-pass moves the level of any frequency", "dB"};
lab::Check flat{"flat", "The furthest the four input all-passes move the level of any frequency", "dB"};
lab::Check bandwidth_loss{"bandwidthLoss", "What the bandwidth filter takes off at 20 kHz", "dB"};
lab::Check trip{"trip", "Once round both halves of the tank", "s"};
lab::Check fall{"fall", "Time to fall 60 dB, measured", "s"};
lab::Check fall_formula{"fallFormula", "Time to fall 60 dB, by the formula", "s"};
lab::Check fall_low{"fallLow", "Time to fall 60 dB around 500 Hz", "s"};
lab::Check fall_high{"fallHigh", "Time to fall 60 dB around 5 kHz", "s"};
lab::Check sides{"sides", "How alike left and right are (1 the same, 0 unrelated)", ""};

// The build part's taps.
lab::Tap built{"built", "The plate so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_hit{"builtHit", "One click through the plate so far, left side", lab::kCurve, lab::kLesson, 1};
lab::Tap built_sweep{"builtSweep", "Added to the left half's first delay, as built", lab::kControl, lab::kLesson, 1,
                     "samples"};

// The plate so far: one function a piece, and run() to take a sample through
// the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kGap = 0, kDiffuse, kLoop, kCross, kDamp, kRead, kMove, kMix };

  // An all-pass delay, on the device's own kind of ring.
  template <int N>
  struct Diffuser {
    PlateReverb::DelayBuffer<N> ring;
    int length = 1;
    float gain = 0.0f;

    // An all-pass: a delay with its output fed back, and one line more. Some
    // of what has just gone in is taken straight off what comes out.
    float pass(float x) {
      const float delayed = ring.read(length);
      const float feed = x + gain * delayed;
      ring.write(feed);
      return delayed - gain * feed;
    }
  };

  // One half of the tank.
  struct Half {
    PlateReverb::DelayBuffer<4096> swept;  // the first all-pass's ring
    float rest = 1.0f;     // that all-pass's delay at rest, in samples: not a whole number
    float sweep = 0.0f;    // how far the movement stretches it, in samples
    float phase = 0.0f;    // where the movement is in its turn
    float turn = 0.0f;     // how far it turns in one sample
    float stretch = 0.0f;  // what the movement adds to the delay on this sample
    PlateReverb::DelayBuffer<16384> first;
    int first_length = 1;
    OnePoleLowpass damping;
    Diffuser<16384> second_allpass;
    PlateReverb::DelayBuffer<16384> second;
    int second_length = 1;
    float heard = 0.0f;    // what goes into the first delay: where a half is heard before it has outputs
    float back = 0.0f;     // what leaves the second delay

    // The half's first all-pass. Its delay is not a whole number of samples,
    // so it reads between two samples. Movement: a slow sine stretches the
    // delay by up to `sweep` samples and lets it back. (With no sweep the
    // sine is not asked for: nothing times anything is nothing.)
    float moving(float x) {
      phase += turn;
      if (phase >= kit::kTwoPi) phase -= kit::kTwoPi;
      stretch = sweep > 0.0f ? sweep * (1.0f + std::sin(phase)) * 0.5f : 0.0f;
      const float delayed = swept.read_interpolated(rest + stretch);
      const float feed = x + kTankGainA * delayed;
      swept.write(feed);
      return delayed - kTankGainA * feed;
    }

    // Once through the half: an all-pass, a long delay, the damping filter,
    // times the decay, a second all-pass and a second long delay.
    void run(float x, float decay_gain, float dulling) {
      x = moving(x);
      heard = x;
      first.write(x);
      x = damping.process(first.read(first_length), dulling);
      x *= decay_gain;
      x = second_allpass.pass(x);
      second.write(x);
      back = second.read(second_length);
    }
  };

  int pieces = kGap;
  float decay_gain = 0.5f;  // Decay
  float dulling = 0.0f;     // Damping, once the damping is in; before it, 0, which is no filter
  float blend = 1.0f;       // Mix
  float bandwidth = 0.0f;   // the device's fixed coefficient for the filter after the gap

  PlateReverb::DelayBuffer<32768> gap;
  int gap_length = 1;
  OnePoleLowpass open_filter;
  Diffuser<512> diffuser_1;
  Diffuser<512> diffuser_2;
  Diffuser<2048> diffuser_3;
  Diffuser<1024> diffuser_4;
  Half left;
  Half right;
  int place_left[7] = {};
  int place_right[7] = {};
  float out[2] = {0.0f, 0.0f};

  // One channel and a gap: the mean of left and right goes into a ring of
  // memory and is read back gap_length samples behind. The filter after it is
  // the device's bandwidth filter, which the device keeps all but open.
  float wait(float in_left, float in_right) {
    gap.write((in_left + in_right) * 0.5f);
    return open_filter.process(gap.read(gap_length), bandwidth);
  }

  // Four all-passes in a row: each echo of one sets off a train in the next.
  float diffuse(float x) {
    x = diffuser_1.pass(x);
    x = diffuser_2.pass(x);
    x = diffuser_3.pass(x);
    return diffuser_4.pass(x);
  }

  // One loop: the left half alone. What leaves it comes back in, times Decay.
  void loop(float x) { left.run(x + decay_gain * left.back, decay_gain, dulling); }

  // Two, crossed: each half takes in what left the other.
  void cross(float x) {
    left.run(x + decay_gain * right.back, decay_gain, dulling);
    right.run(x + decay_gain * left.back, decay_gain, dulling);
  }

  // The outputs: each side adds up seven places along the delays, four of them
  // in the other half, each at a fixed gain and with a fixed sign.
  void read() {
    float l = kReadGain * right.first.read(place_left[0]);
    l += kReadGain * right.first.read(place_left[1]);
    l -= kReadGain * right.second_allpass.ring.read(place_left[2]);
    l += kReadGain * right.second.read(place_left[3]);
    l -= kReadGain * left.first.read(place_left[4]);
    l -= kReadGain * left.second_allpass.ring.read(place_left[5]);
    l -= kReadGain * left.second.read(place_left[6]);
    float r = kReadGain * left.first.read(place_right[0]);
    r += kReadGain * left.first.read(place_right[1]);
    r -= kReadGain * left.second_allpass.ring.read(place_right[2]);
    r += kReadGain * left.second.read(place_right[3]);
    r -= kReadGain * right.first.read(place_right[4]);
    r -= kReadGain * right.second_allpass.ring.read(place_right[5]);
    r -= kReadGain * right.second.read(place_right[6]);
    out[0] = l;
    out[1] = r;
  }

  // Mix: the sound as it went in, beside the plate.
  void mixed(float in_left, float in_right) {
    out[0] = in_left * (1.0f - blend) + out[0] * blend;
    out[1] = in_right * (1.0f - blend) + out[1] * blend;
  }

  // One sample through the pieces built so far, in the order it meets them.
  // Until a piece gives the plate outputs of its own, it is heard where the
  // sound has got to: after the gap, after the all-passes, then inside a half.
  // Reading the outputs changes nothing inside the plate, so on a sample that
  // nobody will hear (`listened` false) they are not read.
  void run(float in_left, float in_right, bool listened = true) {
    float x = wait(in_left, in_right);
    if (pieces >= kDiffuse) x = diffuse(x);
    out[0] = out[1] = x;
    if (pieces < kLoop) return;
    if (pieces >= kCross) cross(x);
    else loop(x);
    out[0] = left.heard;
    out[1] = pieces >= kCross ? right.heard : left.heard;
    if (!listened) return;
    if (pieces >= kRead) read();
    if (pieces >= kMix) mixed(in_left, in_right);
  }

  template <int N>
  static void set(Diffuser<N>& stage, int length, float gain) {
    stage.ring.clear();
    stage.length = length;
    stage.gain = gain;
  }

  // A half takes its lengths, and where its movement stands, from the device's.
  void set(Half& half, const PlateReverb::ModulatedAllpass<4096>& first_allpass, int first_length,
           int allpass_length, int second_length, float swing) {
    half.swept.clear();
    half.rest = first_allpass.base_length;
    half.sweep = pieces >= kMove ? swing : 0.0f;
    half.phase = first_allpass.lfo_phase;
    half.turn = first_allpass.lfo_increment;
    half.stretch = 0.0f;
    half.first.clear();
    half.first_length = first_length;
    half.damping.state = 0.0f;
    set(half.second_allpass, allpass_length, kTankGainB);
    half.second.clear();
    half.second_length = second_length;
    half.heard = 0.0f;
    half.back = 0.0f;
  }

  // The lengths and the settings are the device's own, read from it once it
  // has been set up and before it has run. `swing` is how far the device
  // sweeps its two delays, or nothing while the lab holds them still.
  void start(int pieces_, const PlateReverb& device, float blend_, float swing) {
    pieces = pieces_;
    decay_gain = device.decay_;
    dulling = pieces >= kDamp ? device.damping_coefficient_ : 0.0f;
    blend = blend_;
    bandwidth = device.bandwidth_coefficient_;
    gap.clear();
    gap_length = device.predelay_samples_;
    open_filter.state = 0.0f;
    set(diffuser_1, device.input_diffusion_1_.length, kInputGainA);
    set(diffuser_2, device.input_diffusion_2_.length, kInputGainA);
    set(diffuser_3, device.input_diffusion_3_.length, kInputGainB);
    set(diffuser_4, device.input_diffusion_4_.length, kInputGainB);
    set(left, device.left_decay_diffusion_1_, device.left_delay_1_length_, device.left_ap_2_length_,
        device.left_delay_2_length_, swing);
    set(right, device.right_decay_diffusion_1_, device.right_delay_1_length_, device.right_ap_2_length_,
        device.right_delay_2_length_, swing);
    for (int k = 0; k < 7; ++k) {
      place_left[k] = device.tap_left_[k];
      place_right[k] = device.tap_right_[k];
    }
    out[0] = out[1] = 0.0f;
  }
};

lab::Build build{"One channel and a gap|Four all-passes|One loop|Two loops, crossed|Damping|Seven places a side|"
                 "Movement|Mix",
                 Built::kMix, -120.0f, "The plate as built, all eight pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

// What lab_setup measured, kept for every render.
float chain_hit_[4][kHit];
float chain_density_[4][kInputWindows];
float comb_hit_[kHit];
float comb_density_[kTankHit / kWindow];
float response_comb_[kCombPoints];
float response_allpass_[kCombPoints];
float flat_one_ = 0.0f;
float flat_ = 0.0f;
float bandwidth_loss_ = 0.0f;
float chain_stage_[5][kChain];  // the filter's output, then each all-pass's

// The delay with feedback that runs on the loop, and the frames a band's
// level is read in.
float comb_ring_[kCombRing];
kit::Fft<kBandFrame> band_fft_;
float band_window_[kBandFrame];

// What an all-pass put out on the sample the device has just processed.
// plate_reverb.h: delayed = read(length); feed = x + gain * delayed;
// write(feed); return delayed - gain * feed. After the write, `feed` is the
// newest sample in the delay and `delayed` is one place further back.
template <int N>
float allpass_out(const PlateReverb::Allpass<N>& stage, float gain) {
  return stage.buffer.read(stage.length + 1) - gain * stage.buffer.read(1);
}

// What it took in, from the same two samples: feed = x + gain * delayed.
template <int N>
float allpass_in(const PlateReverb::Allpass<N>& stage, float gain) {
  return stage.buffer.read(1) - gain * stage.buffer.read(stage.length + 1);
}

// The delay a moving all-pass read at on that sample (plate_reverb.cpp).
template <int N>
float delay_now(const PlateReverb::ModulatedAllpass<N>& stage) {
  return stage.base_length + stage.excursion * (1.0f + std::sin(stage.lfo_phase)) * 0.5f;
}

// What a moving all-pass took in: its read between two samples, one place
// further back now that it has written.
template <int N>
float moving_in(const PlateReverb::ModulatedAllpass<N>& stage, float gain) {
  const float delay = delay_now(stage);
  const int whole = static_cast<int>(delay);
  const float frac = delay - static_cast<float>(whole);
  const float a = stage.buffer.read(whole + 1);
  const float b = stage.buffer.read(whole + 2);
  return stage.buffer.read(1) - gain * (a + (b - a) * frac);
}

void hold_still(PlateReverb& reverb) {
  reverb.left_decay_diffusion_1_.excursion = 0.0f;
  reverb.right_decay_diffusion_1_.excursion = 0.0f;
}

// Echoes in each 10 ms of a response: samples larger than both neighbours and
// within 60 dB of the largest sample of the same 10 ms.
void count_echoes(const float* h, int count, float* per_window, int windows) {
  for (int w = 0; w < windows; ++w) {
    per_window[w] = 0.0f;
    const int from = w * kWindow;
    const int to = from + kWindow < count ? from + kWindow : count;
    if (from >= to) continue;
    const float floor = lab::peak(h + from, to - from) * kEchoFloor;
    if (floor <= 0.0f) continue;
    for (int i = from; i < to; ++i) {
      const float here = std::fabs(h[i]);
      const float before = i > 0 ? std::fabs(h[i - 1]) : 0.0f;
      const float after = i + 1 < count ? std::fabs(h[i + 1]) : 0.0f;
      if (here > floor && here > before && here >= after) per_window[w] += 1.0f;
    }
  }
}

// What the last of `points` samples stands at, in milliseconds after the first.
float span_ms(int points) { return 1000.0f * static_cast<float>(points - 1) / lab::kSampleRate; }

void copy_curve(lab::Tap& tap, const float* from, int points, float x0, float x1) {
  if (!tap.open(points)) return;
  tap.x0 = x0;
  tap.x1 = x1;
  for (int p = 0; p < points; ++p) tap.data[p] = from[p];
}

// The level a response gives each of kCombPoints frequencies standing evenly
// from 0 to kCombTop hertz: the sum lab::response_tap makes, at even steps.
void level_at_even_steps(const float* h, int count, float* out) {
  for (int p = 0; p < kCombPoints; ++p) {
    const double hz = kCombTop * static_cast<double>(p) / (kCombPoints - 1);
    out[p] = lab::power_to_db(static_cast<float>(lab::fourier_at(h, count, hz).power()));
  }
}

// How far, at most, the level of a response stands from the level of what
// went in, over 20 Hz to 20 kHz, in dB. `work` is a tap used as room.
float furthest_from(lab::Tap& work, const float* h, const float* into) {
  lab::response_tap(work, h, kChain, kResponsePoints);
  float furthest = 0.0f;
  for (int p = 0; p < kResponsePoints; ++p) {
    const float moved = std::fabs(work.data[p] - into[p]);
    if (moved > furthest) furthest = moved;
  }
  return furthest;
}

// The input stages' answer to one sample. No control reaches them but the
// pre-delay, which only moves the answer later, so this runs once.
void measure_input_stages() {
  struck.init(lab::kSampleRate);
  struck.set_predelay_ms(0.0f);
  for (int i = 0; i < kChain; ++i) {
    float left = 0.0f, right = 0.0f;
    struck.process(i == 0 ? 1.0f : 0.0f, &left, &right);
    chain_stage_[0][i] = struck.input_lowpass_.state;
    chain_stage_[1][i] = allpass_out(struck.input_diffusion_1_, kInputGainA);
    chain_stage_[2][i] = allpass_out(struck.input_diffusion_2_, kInputGainA);
    chain_stage_[3][i] = allpass_out(struck.input_diffusion_3_, kInputGainB);
    chain_stage_[4][i] = allpass_out(struck.input_diffusion_4_, kInputGainB);
  }
  for (int s = 0; s < 4; ++s) {
    for (int i = 0; i < kHit; ++i) chain_hit_[s][i] = i < kHitLead ? 0.0f : chain_stage_[s + 1][i - kHitLead];
    count_echoes(chain_stage_[s + 1], kChain, chain_density_[s], kInputWindows);
  }

  // The level each stage gives each frequency, from 20 Hz to 20 kHz, against
  // the level of what went into the first all-pass. A tap is only room to
  // work in here: every render clears the taps and fills them again.
  static float into[kResponsePoints];
  lab::response_tap(response_allpass, chain_stage_[0], kChain, kResponsePoints);
  for (int p = 0; p < kResponsePoints; ++p) into[p] = response_allpass.data[p];
  bandwidth_loss_ = -into[kResponsePoints - 1];
  flat_one_ = furthest_from(response_allpass, chain_stage_[1], into);
  flat_ = furthest_from(response_allpass, chain_stage_[4], into);

  // For the picture, the first all-pass beside one delay of the same length
  // with the same gain fed back round it and nothing else,
  // y[n] = x[n] + g y[n - M], both at even steps up to 2 kHz. The delay with
  // feedback is kept for a second, to be drawn and to have its echoes counted
  // as the plate's are.
  static float comb[kTankHit];
  static float before[kCombPoints];
  for (int i = 0; i < kTankHit; ++i) {
    comb[i] = (i == 0 ? 1.0f : 0.0f) + (i >= kCombLength ? kCombGain * comb[i - kCombLength] : 0.0f);
  }
  for (int i = 0; i < kHit; ++i) comb_hit_[i] = i < kHitLead ? 0.0f : comb[i - kHitLead];
  count_echoes(comb, kTankHit, comb_density_, kTankHit / kWindow);
  level_at_even_steps(comb, kRung, response_comb_);
  level_at_even_steps(chain_stage_[0], 64, before);  // the bandwidth filter is done in a few samples
  level_at_even_steps(chain_stage_[1], kRung, response_allpass_);
  for (int p = 0; p < kCombPoints; ++p) response_allpass_[p] -= before[p];
}

// When a decay curve of `length` points from `x0` to `x1` seconds first stands
// at `level` dB, in seconds. Negative when it never does.
float time_at(const float* data, int length, float x0, float x1, float level) {
  if (!data || length < 2) return -1.0f;
  const float step = (x1 - x0) / static_cast<float>(length - 1);
  for (int p = 1; p < length; ++p) {
    if (data[p] <= level) {
      const float above = data[p - 1];
      const float part = above > data[p] ? (above - level) / (above - data[p]) : 0.0f;
      return x0 + (static_cast<float>(p - 1) + part) * step;
    }
  }
  return -1.0f;
}

// The time to fall 60 dB as it is read off a decay curve: three times the
// time from -5 dB to -25 dB. The first 5 dB hold the pre-delay and the first
// uneven echoes, and the foot of the curve bends down where the listening
// stopped, so neither is used.
float fall_time(const float* data, int length, float x0, float x1) {
  const float from = time_at(data, length, x0, x1, -5.0f);
  const float to = time_at(data, length, x0, x1, -25.0f);
  return from >= 0.0f && to > from ? 3.0f * (to - from) : 0.0f;
}

float fall_time(const lab::Tap& curve) { return fall_time(curve.data, curve.length, curve.x0, curve.x1); }

// How long each of thirteen bands of a response takes to fall 60 dB. The
// response is read in frames of 21 ms, each through the kit's transform; a
// band is the bins within half an octave of its middle, so each is an octave
// wide and overlaps its neighbours; and each band's energy still to come is
// read as the whole response's is, three times its time from -5 dB to -25 dB.
void measure_bands(const float* h, int count) {
  const int frames = (count - kBandFrame) / kBandHop + 1;
  if (frames < 8 || !fall_bands.open(kBands)) return;
  fall_bands.x0 = kBandLowest;
  fall_bands.x1 = kBandHighest;
  fall_bands.scale = lab::kLog;
  float* energy = lab::take(frames * kBands);
  float* ahead = lab::take(frames);
  if (!energy || !ahead) return;

  static float re[kBandFrame];
  static float im[kBandFrame];
  int low[kBands], high[kBands];
  const double bin = lab::kSampleRate / static_cast<double>(kBandFrame);
  for (int b = 0; b < kBands; ++b) {
    const double middle = kBandLowest * std::pow(2.0, 0.5 * b);
    low[b] = static_cast<int>(middle / std::sqrt(2.0) / bin + 0.5);
    high[b] = static_cast<int>(middle * std::sqrt(2.0) / bin + 0.5);
    if (high[b] > kBandFrame / 2) high[b] = kBandFrame / 2;
  }
  for (int f = 0; f < frames; ++f) {
    const float* x = h + f * kBandHop;
    for (int n = 0; n < kBandFrame; ++n) {
      re[n] = x[n] * band_window_[n];
      im[n] = 0.0f;
    }
    band_fft_.forward(re, im);
    for (int b = 0; b < kBands; ++b) {
      double sum = 0.0;
      for (int k = low[b]; k <= high[b]; ++k) sum += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
      energy[f * kBands + b] = static_cast<float>(sum);
    }
  }
  const float last = static_cast<float>((frames - 1) * kBandHop) / lab::kSampleRate;
  for (int b = 0; b < kBands; ++b) {
    double total = 0.0;
    for (int f = 0; f < frames; ++f) total += energy[f * kBands + b];
    double coming = 0.0;
    for (int f = frames - 1; f >= 0; --f) {
      coming += energy[f * kBands + b];
      ahead[f] = total > 0.0 ? lab::power_to_db(static_cast<float>(coming / total)) : lab::kFloorDb;
    }
    fall_bands.data[b] = fall_time(ahead, frames, 0.0f, last);
  }
}

// One sample into the second plate, at the lab's settings.
void strike() {
  struck.init(lab::kSampleRate);
  struck.set_decay(decay.value);
  struck.set_damping(damping.value);
  struck.set_predelay_ms(predelay.value);
  if (!movement.on()) hold_still(struck);

  // The pre-delay reads after it writes, so a length of n delays by n - 1.
  const int start = struck.predelay_samples_ - 1;

  // Once round: every delay of both halves. The plain delays read after they
  // write, so each is one sample shorter than its length; a moving all-pass
  // stands on average half its excursion above its rest.
  const float samples = struck.left_decay_diffusion_1_.base_length + 0.5f * struck.left_decay_diffusion_1_.excursion +
                        static_cast<float>(struck.left_delay_1_length_ - 1 + struck.left_ap_2_length_ +
                                           struck.left_delay_2_length_ - 1) +
                        struck.right_decay_diffusion_1_.base_length + 0.5f * struck.right_decay_diffusion_1_.excursion +
                        static_cast<float>(struck.right_delay_1_length_ - 1 + struck.right_ap_2_length_ +
                                           struck.right_delay_2_length_ - 1);
  trip.value = samples / lab::kSampleRate;
  // The gain round the loop is decay to the fourth power: 20 log10 of it, in
  // dB, is lost every trip.
  fall_formula.value = struck.decay_ > 0.001f ? -3.0f * trip.value / (4.0f * std::log10(struck.decay_)) : 0.0f;

  // Listen for as long as the response takes to fall some 90 dB by that
  // formula, and never longer than eight seconds: a render has to stay quick.
  int listen = start + kRate / 2 + static_cast<int>(1.5f * fall_formula.value * lab::kSampleRate);
  if (listen < kStruckLeast) listen = kStruckLeast;
  if (listen > kStruck) listen = kStruck;

  float* left = lab::take(listen > kPicture ? listen : kPicture);
  float* low = lab::take(listen);
  float* high = lab::take(listen);
  float* node = lab::take(kTankHit);
  float* from_left = lab::take(kTankHit);
  float* from_right = lab::take(kOutHit);
  if (!left || !low || !high || !node || !from_left || !from_right) return;

  kit::Svf low_band[2], high_band[2];
  for (int k = 0; k < 2; ++k) {
    low_band[k].set(500.0f, 2.0f, lab::kSampleRate);
    high_band[k].set(5000.0f, 2.0f, lab::kSampleRate);
  }

  double both = 0.0, left_power = 0.0, right_power = 0.0;
  for (int i = 0; i < listen; ++i) {
    float l = 0.0f, r = 0.0f;
    struck.process(i == 0 ? 1.0f : 0.0f, &l, &r);
    left[i] = l;
    low[i] = low_band[1].bandpass(low_band[0].bandpass(l));
    high[i] = high_band[1].bandpass(high_band[0].bandpass(l));
    both += static_cast<double>(l) * r;
    left_power += static_cast<double>(l) * l;
    right_power += static_cast<double>(r) * r;
    const int k = i - start;
    if (k >= 0 && k < kTankHit) {
      if (k + kTankLead < kTankHit) node[k + kTankLead] = struck.left_delay_1_.read(1);
      from_left[k] = l;
      if (k < kOutHit) from_right[k] = r;
    }
  }
  sides.value = left_power > 0.0 && right_power > 0.0 ? static_cast<float>(both / std::sqrt(left_power * right_power)) : 0.0f;

  // The pictures of single echoes count their time from where the sample
  // leaves the pre-delay.
  const float tank_lead_ms = 1000.0f * static_cast<float>(kTankLead) / lab::kSampleRate;
  copy_curve(hit_tank, node, kTankHit, -tank_lead_ms, span_ms(kTankHit) - tank_lead_ms);
  copy_curve(hit_left, from_left, kOutHit, 0.0f, span_ms(kOutHit));
  copy_curve(hit_right, from_right, kOutHit, 0.0f, span_ms(kOutHit));

  const int windows = kTankHit / kWindow;
  const int tank_windows = (kTankHit - kTankLead) / kWindow;
  if (density_tank.open(tank_windows) && density_out.open(windows)) {
    density_tank.x0 = density_out.x0 = 0.0f;  // each count stands at the start of its 10 ms
    density_tank.x1 = 10.0f * static_cast<float>(tank_windows - 1);
    density_out.x1 = 10.0f * static_cast<float>(windows - 1);
    count_echoes(node + kTankLead, kTankHit - kTankLead, density_tank.data, tank_windows);
    count_echoes(from_left, kTankHit, density_out.data, windows);
  }

  lab::energy_decay_tap(decay_curve, left, listen);
  lab::energy_decay_tap(decay_low, low, listen);
  lab::energy_decay_tap(decay_high, high, listen);
  fall.value = fall_time(decay_curve);
  fall_low.value = fall_time(decay_low);
  fall_high.value = fall_time(decay_high);
  measure_bands(left, listen);
  lab::spectrogram_tap(tail, left, kPicture, 200, false);

  if (lengths.open(12)) {
    lengths.x0 = 1.0f;
    lengths.x1 = 12.0f;
    const float values[12] = {
        static_cast<float>(struck.input_diffusion_1_.length), static_cast<float>(struck.input_diffusion_2_.length),
        static_cast<float>(struck.input_diffusion_3_.length), static_cast<float>(struck.input_diffusion_4_.length),
        struck.left_decay_diffusion_1_.base_length,           static_cast<float>(struck.left_delay_1_length_),
        static_cast<float>(struck.left_ap_2_length_),         static_cast<float>(struck.left_delay_2_length_),
        struck.right_decay_diffusion_1_.base_length,          static_cast<float>(struck.right_delay_1_length_),
        static_cast<float>(struck.right_ap_2_length_),        static_cast<float>(struck.right_delay_2_length_),
    };
    for (int p = 0; p < 12; ++p) lengths.data[p] = values[p];
  }
}

// One click through the plate so far, and the second that follows it. The
// click goes in at 0: the picture counts its time from there, the gap included.
void strike_built(const PlateReverb& device, float swing) {
  if (!built_hit.open(kTankHit)) return;
  built_hit.x0 = 0.0f;
  built_hit.x1 = span_ms(kTankHit);
  shown.start(build.at(), device, mix.value, swing);
  for (int i = 0; i < kTankHit; ++i) {
    const float x = i == 0 ? 1.0f : 0.0f;
    shown.run(x, x);
    built_hit.data[i] = shown.out[0];
  }
}

}  // namespace

void lab_setup() {
  band_fft_.init();
  for (int n = 0; n < kBandFrame; ++n) {
    band_window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / kBandFrame));
  }
  measure_input_stages();
}

void lab_render(int frames) {
  plate.init(lab::kSampleRate);
  plate.set_param(PlateReverbParam::kMix, mix.value);
  plate.set_param(PlateReverbParam::kDecay, decay.value);
  plate.set_param(PlateReverbParam::kDamping, damping.value);
  plate.set_param(PlateReverbParam::kPredelayMs, predelay.value);
  PlateReverb& reverb = plate.reverb_;
  // How far the device sweeps the tank's two delays, before the lab holds them still.
  const float swing = movement.on() ? reverb.left_decay_diffusion_1_.excursion : 0.0f;
  if (!movement.on()) hold_still(reverb);

  // The build part: one click through the chosen step, then the chosen step
  // on the loop, and the whole build that is held to the device. When the
  // reader is on the last step the two are one.
  strike_built(reverb, swing);
  shown.start(build.at(), reverb, mix.value, swing);
  const bool both = build.at() != build.compared_step;
  if (both) held.start(build.compared_step, reverb, mix.value, swing);
  const Built& compared = both ? held : shown;
  double built_apart = 0.0, built_whole = 0.0;

  for (int k = 0; k < kCombRing; ++k) comb_ring_[k] = 0.0f;
  int comb_at = 0;

  // Each all-pass's output, worked out, against what the next stage took in.
  double apart[4] = {0.0, 0.0, 0.0, 0.0};
  double whole[4] = {0.0, 0.0, 0.0, 0.0};

  const float dry = 1.0f - plate.mix();
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    plate.in_left()[0] = left;
    plate.in_right()[0] = right;
    const float crossed_before = reverb.right_feedback_;
    plate.process(1);
    const float out_left = plate.out_left()[0];
    const float out_right = plate.out_right()[0];

    // One delay with its output fed back: c[n] = x[n] + g c[n - M].
    const float rung = flush_denormal(0.5f * (left + right) +
                                      kCombGain * comb_ring_[(comb_at - kCombLength) & (kCombRing - 1)]);
    comb_ring_[comb_at] = rung;
    comb_at = (comb_at + 1) & (kCombRing - 1);

    // The first time round the loop nothing of the build is kept or compared.
    shown.run(left, right, i >= frames);
    if (both) held.run(left, right, i >= frames);

    if (i < frames) continue;  // a tap keeps the second pass and what follows it

    const double apart_left = static_cast<double>(compared.out[0]) - out_left;
    const double apart_right = static_cast<double>(compared.out[1]) - out_right;
    built_apart += apart_left * apart_left + apart_right * apart_right;
    built_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
    built.put(i, shown.out[0], shown.out[1]);

    const float out1 = allpass_out(reverb.input_diffusion_1_, kInputGainA);
    const float out2 = allpass_out(reverb.input_diffusion_2_, kInputGainA);
    const float out3 = allpass_out(reverb.input_diffusion_3_, kInputGainB);
    const float out4 = allpass_out(reverb.input_diffusion_4_, kInputGainB);

    in_tap.put(i, left, right);
    combed.put(i, rung);
    predelayed.put(i, reverb.predelay_.read(reverb.predelay_samples_));
    filtered.put(i, reverb.input_lowpass_.state);
    diffused1.put(i, out1);
    diffused2.put(i, out2);
    diffused3.put(i, out3);
    diffused4.put(i, out4);
    tank_a.put(i, reverb.left_delay_1_.read(1), reverb.right_delay_1_.read(1));
    damped.put(i, reverb.left_damping_.state, reverb.right_damping_.state);
    tank_b.put(i, reverb.left_delay_2_.read(1), reverb.right_delay_2_.read(1));
    crossing.put(i, reverb.left_feedback_, reverb.right_feedback_);
    added.put(i, out_left - dry * left, out_right - dry * right);
    out_tap.put(i, out_left, out_right);
    if (i % lab::kControlPeriod == 0) {
      wobble_left.put(i, delay_now(reverb.left_decay_diffusion_1_) - reverb.left_decay_diffusion_1_.base_length);
      wobble_right.put(i, delay_now(reverb.right_decay_diffusion_1_) - reverb.right_decay_diffusion_1_.base_length);
      built_sweep.put(i, shown.left.stretch);
    }

    if (!plate.asleep()) {
      // The left half takes in the fourth all-pass's output and what crossed
      // from the right half on the sample before, times the decay.
      const float taken[4] = {
          allpass_in(reverb.input_diffusion_2_, kInputGainA),
          allpass_in(reverb.input_diffusion_3_, kInputGainB),
          allpass_in(reverb.input_diffusion_4_, kInputGainB),
          moving_in(reverb.left_decay_diffusion_1_, kTankGainA) - reverb.decay_ * crossed_before,
      };
      const float given[4] = {out1, out2, out3, out4};
      for (int s = 0; s < 4; ++s) {
        const double d = static_cast<double>(given[s]) - static_cast<double>(taken[s]);
        apart[s] += d * d;
        whole[s] += static_cast<double>(taken[s]) * static_cast<double>(taken[s]);
      }
    }
  }

  float worst = lab::kFloorDb;
  for (int s = 0; s < 4; ++s) {
    if (whole[s] <= 0.0) continue;
    const float db = lab::ratio_db(apart[s], whole[s]);
    if (db > worst) worst = db;
  }
  rebuilt.value = worst;
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  // What lab_setup measured of the input stages.
  const float hit_lead_ms = 1000.0f * static_cast<float>(kHitLead) / lab::kSampleRate;
  lab::Tap* hits[4] = {&hit1, &hit2, &hit3, &hit4};
  lab::Tap* densities[4] = {&density1, &density2, &density3, &density4};
  for (int s = 0; s < 4; ++s) {
    copy_curve(*hits[s], chain_hit_[s], kHit, -hit_lead_ms, span_ms(kHit) - hit_lead_ms);
    copy_curve(*densities[s], chain_density_[s], kInputWindows, 0.0f, 10.0f * static_cast<float>(kInputWindows - 1));
  }
  copy_curve(hit_comb, comb_hit_, kHit, -hit_lead_ms, span_ms(kHit) - hit_lead_ms);
  copy_curve(density_comb, comb_density_, kTankHit / kWindow, 0.0f, 10.0f * static_cast<float>(kTankHit / kWindow - 1));
  copy_curve(response_comb, response_comb_, kCombPoints, 0.0f, kCombTop);
  copy_curve(response_allpass, response_allpass_, kCombPoints, 0.0f, kCombTop);
  flat_one.value = flat_one_;
  flat.value = flat_;
  bandwidth_loss.value = bandwidth_loss_;

  strike();
}
