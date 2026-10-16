// The feedback delay network: the FDN Reverb (cpp/devices/fdn-reverb)
// run one sample at a time, with its eight lines read as it works.
//
//   in ─► one channel ─► pre-delay ─► breath ─► 4 all-passes ─┬─► (+) ─► damping ─► DC block ─► tanh ─► line 1 ─┬─►
//                                                             ├─► (+) ─►   ...                          line 2 ─┤
//                                                             ┆    ▲                                      ...   ┆
//                                                             └─► (+) ─►   ...                          line 8 ─┤
//                                                                  └──── × gain ◄──── mixing matrix ◄───────────┘
//                                                  left = lines 1, 3, 5, 7     right = lines 2, 4, 6, 8
//
// lab-sources: cpp/devices/fdn-reverb/fdn_reverb_device.cpp
//
// Read from the device: each line's output (the state its read between two
// samples keeps), what is written back into a line, the breath and where it
// stands in its cycle, the output.
//
// Worked out here ("lesson") from the device's own numbers after each sample,
// because they are locals of its process() and are not kept: what goes into
// the diffusers (the two channels summed, out of the pre-delay's line, times
// the breath), the diffused input (from what the last all-pass holds), how
// far each line's read has swayed (from its oscillator's phase), and the wet
// signal (a quarter of every other line, through tanh). What the matrix
// hands line 1 is the kit's own mixing function on the device's eight line
// outputs ("kit"). Two checks hold them:
// "loop" works the whole feedback path out again with the kit's own mixing
// function (cpp/kit/fdn.h) and reports how far that lands from the damping
// state the device stored, and "wetAgain" mixes the wet signal with the dry
// one as the device does and reports how far that lands from its output.
//
// The device has no control for the slow sway of its line lengths. To show
// the network at rest the lab stops the eight oscillators by clearing their
// rates in the device's state; the "wander" control lets them run again as
// the device sets them.
//
// The bare network, with nothing in its loop but lines, a mixing matrix and
// a gain, is written for the lesson from the kit's parts, with the device's
// own lengths. One copy of it is given a single click, for the pictures of
// echoes; another is given the loop, so that it can be heard. The decay
// curves and the spectrum over time are of the answer to one click, from
// rest, of a second copy of the device's network. Every picture of a click
// is worked out again only when a control that reaches it has moved.
//
// The build part puts the network together a piece at a time, on a path of
// its own beside the device (lab::Build in lab.h). It has seven pieces, each
// a function of `Built` below, in the order the steps add them: one comb;
// eight lines; the mixing matrix; damping; diffusion; movement; two guards.
// The build is the network and the diffusers ahead of it. It is fed what
// the device's diffusers are fed. Two copies of it run: one at the step the
// reader chose, which is what the "built" taps show, and one with all seven
// pieces, whose eight line outputs are compared on every render with the
// eight of the device (the "builtDifference" check, and "builtWorst", the
// largest difference in any one sample). With all seven the build does to a
// sample what the device does, in the same order. A step before the last is
// the lesson's own: a network with a piece missing, which the device never is.
//
// The device sleeps once nothing has gone in and it has put out exact zeros
// for two seconds; asleep, only its oscillators turn. The first time round
// the loop is there only so that a tail from the end is sounding at the
// start: no more of its end is played than the lines can remember.

#include "lab.h"

#include "../../cpp/devices/fdn-reverb/fdn_reverb_device.h"

using namespace livemix;

namespace {

constexpr int kLines = FdnReverb::kChannels;
constexpr int kSpreaders = FdnReverb::kInputAllpasses;
constexpr int kResponse = 96000;  // two seconds: how long a click's answer is listened to
constexpr int kBareSize = 32768;  // room for the longest line at Size 2, and its sway
constexpr int kWindow = 2400;     // 50 ms: the window echoes are counted in
constexpr int kWindows = kResponse / kWindow;
constexpr int kTeeth = 481;
constexpr int kDecayPoints = 400;
constexpr int kPictureColumns = 200;
constexpr int kPassPoints = 241;
constexpr int kRung = 48000;  // one second: the build's answer to a click

FdnReverbDevice device;
FdnReverb probe;  // the same network, for the answer to one click

// The device's seven parameters, with its own ranges, then the lesson's three.
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};
lab::Control decay{"decay", "Decay", "s", 0.1f, 20.0f, 1.5f, lab::kLog};
lab::Control damping{"damping", "Damping", "", 0.0f, 1.0f, 0.0f};
lab::Control predelay{"predelay", "Pre-delay", "ms", 0.0f, 250.0f, 0.0f};
lab::Control size{"size", "Size", "", 0.5f, 2.0f, 1.0f};
lab::Control breath_rate{"breathRate", "Breath rate", "Hz", 0.05f, 2.0f, 0.3f, lab::kLog};
lab::Control breath_depth{"breathDepth", "Breath depth", "", 0.0f, 1.0f, 0.0f};
lab::Control wander{"wander", "Wander", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Still|Moving"};
lab::Control matrix{"matrix", "Mixing", "", 0.0f, 2.0f, 1.0f, lab::kLinear, "None|Hadamard|Householder"};
lab::Control gains{"gains", "Gain", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "One for all|One per line"};

// The loop, stage by stage.
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap lone{"lone", "The loop through one line alone", lab::kAudio, lab::kLesson, 1};
lab::Tap bare{"bare", "The loop through the bare network", lab::kAudio, lab::kLesson, 2};
lab::Tap breath_phase{"breathPhase", "Where the breath stands in its cycle", lab::kControl, lab::kDevice, 1, ""};
lab::Tap gate{"gate", "Breath: the gain on the input", lab::kControl, lab::kDevice, 1, ""};
lab::Tap fed{"fed", "Into the diffusers", lab::kAudio, lab::kLesson, 1};
lab::Tap diffused{"diffused", "Diffused input", lab::kAudio, lab::kLesson, 1};
lab::Tap sway_short{"sway1", "How far line 1's read has swayed", lab::kControl, lab::kLesson, 1, "samples"};
lab::Tap sway_long{"sway8", "How far line 8's read has swayed", lab::kControl, lab::kLesson, 1, "samples"};
lab::Tap line_short{"line1", "Line 1, the shortest", lab::kAudio, lab::kDevice, 1};
lab::Tap line_long{"line8", "Line 8, the longest", lab::kAudio, lab::kDevice, 1};
lab::Tap shared{"shared", "What the matrix hands line 1", lab::kAudio, lab::kKit, 1};
lab::Tap written{"written", "Written back into line 1", lab::kAudio, lab::kDevice, 1};
lab::Tap wet{"wet", "Out of the lines: the wet signal", lab::kAudio, lab::kLesson, 2};
lab::Tap level_in{"levelIn", "Level of the input", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level of the output", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

// One click, and what is read off it.
lab::Tap lengths{"lengths", "The eight lengths", lab::kCurve, lab::kDevice, 1, "ms"};
lab::Tap comb{"comb", "One line alone", lab::kCurve, lab::kLesson, 1};
lab::Tap comb_teeth{"combTeeth", "One line alone: its response to frequency", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap apart{"apart", "Eight lines, each fed back to itself", lab::kCurve, lab::kLesson, 1};
lab::Tap mixed{"mixed", "Eight lines, mixed", lab::kCurve, lab::kLesson, 1};
lab::Tap density_apart{"densityApart", "Echoes, each line to itself", lab::kCurve, lab::kLesson, 1, "per ms"};
lab::Tap density_mixed{"densityMixed", "Echoes, mixed", lab::kCurve, lab::kLesson, 1, "per ms"};
lab::Tap answer{"answer", "The device's answer to one click, left side", lab::kCurve, lab::kDevice, 1};
lab::Tap decay_curve{"decayCurve", "Energy still to come", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_wanted{"decayWanted", "60 dB in the decay time", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap decay_low{"decayLow", "Energy still to come, around 500 Hz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_high{"decayHigh", "Energy still to come, around 8 kHz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap pass_gain{"passGain", "Gain of one trip round the loop", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap picture{"picture", "The answer's spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check loop{"loop", "The feedback path worked out again, against the device's own state", "dB"};
lab::Check wet_again{"wetAgain", "The wet signal mixed with the dry again, against the device's output", "dB"};
lab::Check trip_gain{"tripGain", "The gain on every trip round the loop", "dB"};
lab::Check keeps{"keeps", "Furthest the kit's Hadamard matrix lands from keeping energy", ""};
lab::Check keeps_householder{"keepsHouseholder", "Furthest the kit's Householder matrix lands from keeping energy", ""};
lab::Check same_matrix{"sameMatrix", "Largest difference between the device's matrix and the kit's", ""};
lab::Check density_first{"densityFirst", "Echoes in the first half second, mixed", ""};
lab::Check density_second{"densitySecond", "Echoes in the second half second, mixed", ""};

// The build part's taps.
lab::Tap built{"built", "The network so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_first{"builtFirst", "Line 1, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_last{"builtLast", "Line 8, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_sway{"builtSway", "How far line 1's read has swayed, as built", lab::kControl, lab::kLesson, 1,
                    "samples"};
lab::Tap built_click{"builtClick", "One click through the network so far, left side", lab::kCurve, lab::kLesson, 1};

lab::Check built_worst{"builtWorst", "The largest difference in any one sample between a line as built and the device's",
                       ""};

void still(FdnReverb& network) {
  for (int ch = 0; ch < kLines; ++ch) {
    network.lfo_phase_[ch] = 0.0f;
    network.lfo_increment_[ch] = 0.0f;
  }
}

void configure(FdnReverb& network, float predelay_ms, float depth) {
  network.set_decay(decay.value);
  network.set_damping(damping.value);
  network.set_size(size.value);
  network.set_predelay_ms(predelay_ms);
  network.set_breath_rate(breath_rate.value);
  network.set_breath_depth(depth);
  if (!wander.on()) still(network);
}

// ---------------------------------------------------------------------------
// The build part.

// What the build takes from the device before the loop starts: the numbers
// the device worked out from its controls.
struct Plan {
  float length[kLines] = {};  // each line's length in samples: its own length times Size
  float gain = 0.0f;          // what every trip round the loop keeps
  float pole = 0.0f;          // the damping filter's coefficient
  int spread[kSpreaders] = {};  // the lengths of the four all-passes ahead of the lines
  float phase[kLines] = {};   // where each line's slow sine starts
  float rate[kLines] = {};    // how far it turns in one sample
  bool moving = false;        // false when every sine stands still at nothing
};

Plan plan;

void read_plan(const FdnReverb& network) {
  for (int ch = 0; ch < kLines; ++ch) {
    plan.length[ch] = static_cast<float>(network.base_delays_[ch]) * network.size_.current;
    plan.phase[ch] = network.lfo_phase_[ch];
    plan.rate[ch] = network.lfo_increment_[ch];
  }
  plan.moving = wander.on();
  plan.gain =
      FdnReverb::feedback_gain_for(network.decay_.current, network.average_delay_seconds_ * network.size_.current);
  plan.pole = network.lp_coefficient_.current;
  for (int k = 0; k < kSpreaders; ++k) plan.spread[k] = network.input_allpass_[k].length;
}

// The network so far: one function a piece, and run() to take one sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kComb = 0, kEight, kMatrix, kDamping, kDiffusion, kMovement, kGuards };

  int pieces = kComb;
  kit::DelayLine<kBareSize> line[kLines];
  kit::DelayLine<FdnReverb::kInputAllpassSamples> spreader[kSpreaders];
  float out[kLines] = {};          // what each line gave back on this sample
  float damped[kLines] = {};       // what each line's damping filter holds
  float between[kLines] = {};      // what each line's read between two samples holds
  float phase[kLines] = {};        // where each line's slow sine stands
  float sway[kLines] = {};         // how far each line's read stands from its length, in samples
  float blocked_in[kLines] = {};   // the DC blocker's last input
  float blocked_out[kLines] = {};  // and its last output
  float left = 0.0f;
  float right = 0.0f;

  // One comb: a line gives back what was written into it one length ago. Until
  // the lines move, a length is read at the nearest whole sample.
  float read(int ch) { return line[ch].read(static_cast<int>(plan.length[ch] + 0.5f)); }

  // What is written into a line is the new sound and what the line gave back,
  // times the gain. Numbers too small to matter are written as nothing.
  void write(int ch, float y) { line[ch].write(flush_denormal(y)); }

  // The mixing matrix: the eight outputs become eight sums and differences of
  // all eight, so that every line's echo goes back into every line.
  void mix(float* back) { kit::hadamard<kLines>(back); }

  // Damping: a one-pole low-pass on what goes back into each line, so that
  // every trip costs the high notes a little more than the low ones.
  float damp(int ch, float y) {
    damped[ch] = flush_denormal((1.0f - plan.pole) * y + plan.pole * damped[ch]);
    return damped[ch];
  }

  // Diffusion: an all-pass ahead of the lines. It keeps every frequency's
  // level and turns one sample into a row of them.
  float spread(int k, float x, float g) {
    const float delayed = spreader[k].read(plan.spread[k]);
    const float y = -g * x + delayed;
    spreader[k].write(flush_denormal(x + g * y));
    return y;
  }

  // Four of them in a row, two at each coefficient.
  float diffuse(float x) {
    x = spread(0, x, FdnReverb::kInputDiffusion1);
    x = spread(1, x, FdnReverb::kInputDiffusion1);
    x = spread(2, x, FdnReverb::kInputDiffusion2);
    return spread(3, x, FdnReverb::kInputDiffusion2);
  }

  // Movement: each line's length sways on a slow sine of its own, so the
  // line is read between two samples, through a first-order all-pass.
  float read_moving(int ch) {
    phase[ch] += plan.rate[ch];
    if (phase[ch] >= 1.0f) phase[ch] -= 1.0f;
    sway[ch] = plan.moving ? std::sin(phase[ch] * FdnReverb::kTwoPi) * FdnReverb::kLineModulationSamples : 0.0f;
    const float delay = plan.length[ch] + sway[ch];
    const int whole = static_cast<int>(delay);
    const float part = delay - static_cast<float>(whole);
    const float eta = (1.0f - part) / (1.0f + part);
    const float y = line[ch].read(whole + 1) + eta * (line[ch].read(whole) - between[ch]);
    between[ch] = flush_denormal(y);
    return y;
  }

  // Two guards on what goes back into a line. The first takes out anything
  // that stands still (a DC blocker); the second lets nothing past 1 (tanh).
  float guard(int ch, float y) {
    const float steady = y - blocked_in[ch] + FdnReverb::kDcBlockerR * blocked_out[ch];
    blocked_in[ch] = y;
    blocked_out[ch] = flush_denormal(steady);
    return std::tanh(steady);
  }

  // The two sides: one comb is heard as it is; eight lines are heard a
  // quarter of every other one to a side, and the last piece limits each side.
  void listen() {
    if (pieces < kEight) {
      left = right = out[0];
      return;
    }
    left = (out[0] + out[2] + out[4] + out[6]) * 0.25f;
    right = (out[1] + out[3] + out[5] + out[7]) * 0.25f;
    if (pieces >= kGuards) {
      left = std::tanh(left);
      right = std::tanh(right);
    }
  }

  // One sample through the pieces built so far, in the order the device
  // meets them: `x` goes in, `out` is what the lines gave back.
  void run(float x) {
    const int count = pieces >= kEight ? kLines : 1;
    if (pieces >= kDiffusion) x = diffuse(x);
    float back[kLines] = {};
    for (int ch = 0; ch < count; ++ch) {
      out[ch] = pieces >= kMovement ? read_moving(ch) : read(ch);
      back[ch] = out[ch];
    }
    if (pieces >= kMatrix) mix(back);
    for (int ch = 0; ch < count; ++ch) {
      float y = x + back[ch] * plan.gain;
      if (pieces >= kDamping) y = damp(ch, y);
      if (pieces >= kGuards) y = guard(ch, y);
      write(ch, y);
    }
    listen();
  }

  // What the device does asleep: the sines turn and nothing else happens.
  void sleep(int frames) {
    if (pieces < kMovement || !plan.moving) return;
    for (int i = 0; i < frames; ++i) {
      for (int ch = 0; ch < kLines; ++ch) {
        phase[ch] += plan.rate[ch];
        if (phase[ch] >= 1.0f) phase[ch] -= 1.0f;
      }
    }
  }

  void start(int pieces_) {
    pieces = pieces_;
    left = 0.0f;
    right = 0.0f;
    for (int ch = 0; ch < kLines; ++ch) {
      line[ch].clear();
      out[ch] = 0.0f;
      damped[ch] = 0.0f;
      between[ch] = 0.0f;
      phase[ch] = plan.phase[ch];
      sway[ch] = 0.0f;
      blocked_in[ch] = 0.0f;
      blocked_out[ch] = 0.0f;
    }
    for (int k = 0; k < kSpreaders; ++k) spreader[k].clear();
  }
};

lab::Build build{"One comb|Eight lines|The mixing matrix|Damping|Diffusion|Movement|Two guards", Built::kGuards,
                 -120.0f, "The network as built, all seven pieces, against the eight line outputs of the device"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device
Built rung;   // at the step the reader chose, given one sample: the build's answer to a click

// One click into the network so far, from rest: what its left side says in
// the second that follows.
void ring() {
  rung.start(build.at());
  if (!built_click.open(kRung)) return;
  built_click.x0 = 0.0f;
  built_click.x1 = static_cast<float>(kRung - 1) / lab::kSampleRate;
  for (int n = 0; n < kRung; ++n) {
    rung.run(n == 0 ? 1.0f : 0.0f);
    built_click.data[n] = rung.left;
  }
}

// ---------------------------------------------------------------------------
// The bare network: eight lines of the device's lengths, a mixing matrix and
// a gain, and nothing else. Whatever goes in goes into every line, as the
// device feeds its lines. Size scales the lengths, here to the nearest whole
// sample. With `lossless` every gain is 1, for counting echoes that would
// otherwise die away.
struct Bare {
  kit::DelayLine<kBareSize> line[kLines];
  int length[kLines] = {};
  float gain[kLines] = {};
  int which = 1;         // 0: each line to itself, 1: Hadamard, 2: Householder
  float v[kLines] = {};  // what each line gave back on this sample

  void start(const FdnReverb& network, int which_, bool lossless) {
    which = which_;
    float sum = 0.0f;
    for (int ch = 0; ch < kLines; ++ch) {
      line[ch].clear();
      v[ch] = 0.0f;
      length[ch] = static_cast<int>(static_cast<float>(network.base_delays_[ch]) * size.value + 0.5f);
      sum += static_cast<float>(length[ch]);
    }
    for (int ch = 0; ch < kLines; ++ch) {
      // One for all: the device's law, from the mean length. One per line: the
      // kit's, from each line's own.
      const float one = FdnReverb::feedback_gain_for(decay.value, sum / kLines / lab::kSampleRate);
      const float own = kit::rt60_gain(static_cast<float>(length[ch]), decay.value, lab::kSampleRate);
      gain[ch] = lossless ? 1.0f : (gains.on() ? own : one);
    }
  }

  void run(float x) {
    float back[kLines];
    for (int ch = 0; ch < kLines; ++ch) back[ch] = v[ch] = line[ch].read(length[ch]);
    if (which == 1) kit::hadamard<kLines>(back);
    if (which == 2) kit::householder<kLines>(back);
    for (int ch = 0; ch < kLines; ++ch) line[ch].write(x + gain[ch] * back[ch]);
  }

  // The two sides as the device takes them: a quarter of every other line.
  float left() const { return 0.25f * (v[0] + v[2] + v[4] + v[6]); }
  float right() const { return 0.25f * (v[1] + v[3] + v[5] + v[7]); }
};

Bare struck;  // given one click
Bare looped;  // given the loop
kit::DelayLine<kBareSize> alone;  // line 1 by itself, given the loop

// A tap's points as they were last worked out, kept between renders.
struct Kept {
  float* points;
  int length = 0;
  float x0 = 0.0f;
  float x1 = 1.0f;
  int columns = 0;
  int scale = lab::kLinear;

  void keep(const lab::Tap& tap) {
    length = tap.data ? tap.length : 0;
    x0 = tap.x0;
    x1 = tap.x1;
    columns = tap.columns;
    scale = tap.scale;
    for (int i = 0; i < length; ++i) points[i] = tap.data[i];
  }
  void give(lab::Tap& tap) const {
    if (length == 0 || !tap.open(length)) return;
    tap.x0 = x0;
    tap.x1 = x1;
    tap.columns = columns;
    tap.scale = scale;
    for (int i = 0; i < length; ++i) tap.data[i] = points[i];
  }
};

float response_[kResponse];
float band_[kResponse];
float scratch_[kResponse];
float first_[kResponse];

float kept_comb_[kResponse], kept_apart_[kResponse], kept_mixed_[kResponse], kept_answer_[kResponse];
float kept_teeth_[kTeeth], kept_density_apart_[kWindows], kept_density_mixed_[kWindows];
float kept_decay_[kDecayPoints], kept_low_[kDecayPoints], kept_high_[kDecayPoints];
float kept_pass_[kPassPoints], kept_picture_[kPictureColumns * lab::kPictureRows];

Kept kept_comb{kept_comb_}, kept_apart{kept_apart_}, kept_mixed{kept_mixed_}, kept_answer{kept_answer_};
Kept kept_teeth{kept_teeth_}, kept_density_apart{kept_density_apart_}, kept_density_mixed{kept_density_mixed_};
Kept kept_decay{kept_decay_}, kept_low{kept_low_}, kept_high{kept_high_};
Kept kept_pass{kept_pass_}, kept_picture{kept_picture_};
float kept_first = 0.0f, kept_second = 0.0f;

// The settings that reach the bare network's pictures and the device's answer
// to a click, as they stood when each was last worked out.
float bare_for[4] = {-1.0f, -1.0f, -1.0f, -1.0f};
float answer_for[4] = {-1.0f, -1.0f, -1.0f, -1.0f};

bool moved(float* was, const float* now) {
  bool any = false;
  for (int k = 0; k < 4; ++k) {
    if (was[k] != now[k]) any = true;
    was[k] = now[k];
  }
  return any;
}

// How far a matrix is from keeping energy. A unit vector through a mixing
// function comes out as one column of its matrix; a matrix that keeps energy
// has columns of length one, at right angles to each other. The answer is
// the furthest any column's length squared lands from one, or any two
// columns' product from nothing.
float unkept(const float columns[kLines][kLines]) {
  float worst = 0.0f;
  for (int a = 0; a < kLines; ++a) {
    for (int b = a; b < kLines; ++b) {
      float dot = 0.0f;
      for (int r = 0; r < kLines; ++r) dot += columns[a][r] * columns[b][r];
      worst = kit::max(worst, std::fabs(dot - (a == b ? 1.0f : 0.0f)));
    }
  }
  return worst;
}

void measure_matrices() {
  float hadamard[kLines][kLines] = {};
  float householder[kLines][kLines] = {};
  float apart_from_kit = 0.0f;
  for (int c = 0; c < kLines; ++c) {
    float unit[kLines] = {};
    float device_column[kLines] = {};
    unit[c] = 1.0f;
    hadamard[c][c] = 1.0f;
    householder[c][c] = 1.0f;
    kit::hadamard<kLines>(hadamard[c]);
    kit::householder<kLines>(householder[c]);
    FdnReverb::hadamard8(unit, device_column);
    for (int r = 0; r < kLines; ++r) {
      apart_from_kit = kit::max(apart_from_kit, std::fabs(hadamard[c][r] - device_column[r]));
    }
  }
  keeps.value = unkept(hadamard);
  keeps_householder.value = unkept(householder);
  same_matrix.value = apart_from_kit;
}

// One click into the bare network: `out` takes its left side, `first` line 1 alone.
void strike(const FdnReverb& network, int which, bool lossless, float* out, float* first) {
  struck.start(network, which, lossless);
  for (int n = 0; n < kResponse; ++n) {
    struck.run(n == 0 ? 1.0f : 0.0f);
    out[n] = struck.left();
    if (first) first[n] = struck.v[0];
  }
}

int echoes_between(const float* x, int from, int to) {
  int count = 0;
  for (int i = from; i < to; ++i) count += x[i] != 0.0f ? 1 : 0;
  return count;
}

// Echoes per millisecond, counted in windows of 50 ms: every sample that is
// not exactly zero is an echo arriving.
void count_echoes(lab::Tap& tap, const float* x) {
  if (!tap.open(kWindows)) return;
  tap.x0 = 0.5f * kWindow / lab::kSampleRate;
  tap.x1 = (kWindows - 0.5f) * kWindow / lab::kSampleRate;
  for (int w = 0; w < kWindows; ++w) {
    const int count = echoes_between(x, w * kWindow, (w + 1) * kWindow);
    tap.set(w, static_cast<float>(count) / (1000.0f * kWindow / lab::kSampleRate));
  }
}

void copy_curve(lab::Tap& tap, const float* x, int count) {
  if (!tap.open(count)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(count - 1) / lab::kSampleRate;
  for (int i = 0; i < count; ++i) tap.data[i] = x[i];
}

// The one line's response to frequency, from 0 to 60 Hz: the sum the Fourier
// transform is, over the few samples of its answer that are not zero.
void teeth(const float* h) {
  constexpr float kTop = 60.0f;
  int at[64];
  int echoes = 0;
  for (int n = 0; n < kResponse && echoes < 64; ++n) {
    if (h[n] != 0.0f) at[echoes++] = n;
  }
  if (!comb_teeth.open(kTeeth)) return;
  comb_teeth.x0 = 0.0f;
  comb_teeth.x1 = kTop;
  for (int p = 0; p < kTeeth; ++p) {
    const double w = 2.0 * lab::kPi * kTop * p / (kTeeth - 1) / lab::kSampleRate;
    double re = 0.0, im = 0.0;
    for (int e = 0; e < echoes; ++e) {
      re += h[at[e]] * std::cos(w * at[e]);
      im -= h[at[e]] * std::sin(w * at[e]);
    }
    comb_teeth.data[p] = lab::power_to_db(static_cast<float>(re * re + im * im));
  }
}

void bare_networks(const FdnReverb& network) {
  const float now[4] = {decay.value, size.value, static_cast<float>(matrix.choice()), gains.on() ? 1.0f : 0.0f};
  if (moved(bare_for, now)) {
    strike(network, 0, false, scratch_, first_);
    copy_curve(apart, scratch_, kResponse);
    copy_curve(comb, first_, kResponse);
    teeth(first_);

    strike(network, matrix.choice(), false, scratch_, nullptr);
    copy_curve(mixed, scratch_, kResponse);

    strike(network, 0, true, scratch_, nullptr);
    count_echoes(density_apart, scratch_);
    strike(network, matrix.choice(), true, scratch_, nullptr);
    count_echoes(density_mixed, scratch_);
    kept_first = static_cast<float>(echoes_between(scratch_, 0, 24000));
    kept_second = static_cast<float>(echoes_between(scratch_, 24000, 48000));

    kept_apart.keep(apart);
    kept_comb.keep(comb);
    kept_teeth.keep(comb_teeth);
    kept_mixed.keep(mixed);
    kept_density_apart.keep(density_apart);
    kept_density_mixed.keep(density_mixed);
  } else {
    kept_apart.give(apart);
    kept_comb.give(comb);
    kept_teeth.give(comb_teeth);
    kept_mixed.give(mixed);
    kept_density_apart.give(density_apart);
    kept_density_mixed.give(density_mixed);
  }
  density_first.value = kept_first;
  density_second.value = kept_second;
}

// The answer through a narrow band (two of the kit's band-pass filters in
// a row, so what leaks in from the slower-dying bands beside it stays well
// under what is measured), and how its energy dies away.
void band_decay(lab::Tap& tap, float hz) {
  kit::Svf one, two;
  one.set(hz, 4.0f, lab::kSampleRate);
  two.set(hz, 4.0f, lab::kSampleRate);
  for (int i = 0; i < kResponse; ++i) band_[i] = two.bandpass(one.bandpass(response_[i]));
  lab::energy_decay_tap(tap, band_, kResponse, kDecayPoints);
}

void device_response() {
  const float now[4] = {decay.value, size.value, damping.value, wander.on() ? 1.0f : 0.0f};
  if (moved(answer_for, now)) {
    probe.init(lab::kSampleRate);
    configure(probe, 0.0f, 0.0f);
    for (int n = 0; n < kResponse; ++n) {
      float left = 0.0f, right = 0.0f;
      probe.process(n == 0 ? 1.0f : 0.0f, &left, &right);
      response_[n] = left;
    }
    copy_curve(answer, response_, kResponse);
    lab::energy_decay_tap(decay_curve, response_, kResponse, kDecayPoints);
    band_decay(decay_low, 500.0f);
    band_decay(decay_high, 8000.0f);
    lab::spectrogram_tap(picture, response_, kResponse, kPictureColumns, false);

    // One trip round the loop, against frequency: the gain, the damping
    // filter and the DC blocker as fdn_reverb.h writes them, fed one click.
    constexpr int kTrip = 4096;
    float* trip = lab::take(kTrip);
    if (!trip) return;
    const float g = FdnReverb::feedback_gain_for(decay.value, probe.average_delay_seconds_ * size.value);
    const float a = probe.lp_coefficient_.target;
    float lp = 0.0f, x1 = 0.0f, y1 = 0.0f;
    for (int n = 0; n < kTrip; ++n) {
      const float x = n == 0 ? g : 0.0f;
      lp = (1.0f - a) * x + a * lp;
      const float y = lp - x1 + FdnReverb::kDcBlockerR * y1;
      x1 = lp;
      y1 = y;
      trip[n] = y;
    }
    lab::response_tap(pass_gain, trip, kTrip, kPassPoints);

    kept_answer.keep(answer);
    kept_decay.keep(decay_curve);
    kept_low.keep(decay_low);
    kept_high.keep(decay_high);
    kept_picture.keep(picture);
    kept_pass.keep(pass_gain);
  } else {
    kept_answer.give(answer);
    kept_decay.give(decay_curve);
    kept_low.give(decay_low);
    kept_high.give(decay_high);
    kept_picture.give(picture);
    kept_pass.give(pass_gain);
  }
  if (decay_wanted.open(2)) {
    decay_wanted.x0 = 0.0f;
    decay_wanted.x1 = static_cast<float>(kResponse) / lab::kSampleRate;
    decay_wanted.set(0, 0.0f);
    decay_wanted.set(1, -60.0f * decay_wanted.x1 / decay.value);
  }
}

// ---------------------------------------------------------------------------
// The loop.

// The first time round the loop is there only so that what still rings at the
// loop's end is sounding at its start. Nothing here remembers further back
// than the pre-delay, one trip of the longest line, and the time an echo
// takes to fall 100 dB. At 60 dB in Decay seconds that is five thirds of
// Decay; the bare network's longest line, when it is fed back to itself with
// the one gain, takes 1.23 times as long. Only that much of the end is played
// into the device. Before it the device is put to sleep, where it does what
// it does whenever nothing has come in for a while: its oscillators turn and
// nothing else. Returns the sample the playing begins on.
int sleep_through(int frames) {
  const float remembered = 0.25f + predelay.value * 0.001f + 0.2f * size.value + decay.value * (100.0f / 60.0f) * 1.25f;
  int wake = frames - static_cast<int>(remembered * lab::kSampleRate);
  wake = wake > 0 ? wake - wake % lab::kControlPeriod : 0;
  if (wake == 0) return 0;
  device.idle_.quiet_ = device.idle_.hold_;
  int i = 0;
  while (i < wake) {
    const int n = wake - i < FdnReverbDevice::kMaxBlockFrames ? wake - i : FdnReverbDevice::kMaxBlockFrames;
    device.process(n);  // the input is already silence
    i += n;
  }
  return wake;
}

// A value over time as it stood the second time round the loop, kept as it
// was: the breath and the sway do not come round with the loop, and a
// crossfade from one place in a cycle to another would draw a bend that
// nothing in the device made.
void keep(lab::Tap& tap, int i, float value) {
  if (!tap.data && !tap.open(lab::frames() / lab::kControlPeriod)) return;
  tap.set((i - lab::frames()) / lab::kControlPeriod, value);
}

float swayed(const FdnReverb& network, int ch) {
  return std::sin(network.lfo_phase_[ch] * FdnReverb::kTwoPi) * FdnReverb::kLineModulationSamples;
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  device.init(lab::kSampleRate);
  device.set_param(FdnReverbParam::kMix, mix.value);
  FdnReverb& network = device.reverb_;
  configure(network, predelay.value, breath_depth.value);
  read_plan(network);

  if (lengths.open(kLines)) {
    lengths.x0 = 1.0f;
    lengths.x1 = static_cast<float>(kLines);
    for (int ch = 0; ch < kLines; ++ch) {
      lengths.set(ch, static_cast<float>(network.base_delays_[ch]) * size.value * 1000.0f / lab::kSampleRate);
    }
  }

  // The build part: the chosen step, and the whole build that is held to the
  // device. When the reader is on the last step the two are one.
  shown.start(build.at());
  const bool both = build.at() != build.compared_step;
  if (both) held.start(build.compared_step);
  const Built& compared = both ? held : shown;

  looped.start(network, matrix.choice(), false);
  alone.clear();

  auto& last = network.input_allpass_[kSpreaders - 1];
  const float g2 = FdnReverb::kInputDiffusion2;
  // The mix as the device takes it: equal power, from one angle.
  const float angle = kit::clamp(mix.value, 0.0f, 1.0f) * FdnReverbDevice::kHalfPi;
  const float dry_gain = std::cos(angle);
  const float wet_gain = std::sin(angle);
  double differ = 0.0, reference = 0.0;
  double mixed_apart = 0.0, mixed_whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;
  float worst = 0.0f;
  // A meter for the level traces: the mean of the two channels' squares
  // through two one-pole filters of 10 ms, as the detector of the compression
  // lesson is built.
  float smooth_one = 0.0f, smooth_two = 0.0f, smooth_in_one = 0.0f, smooth_in_two = 0.0f;
  const float smooth = kit::time_to_coeff(0.01f, lab::kSampleRate);

  const int wake = sleep_through(frames);
  shown.sleep(wake);
  if (both) held.sleep(wake);

  const int total = lab::total();
  for (int i = wake; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const bool kept = i >= frames;
    float before[kLines];
    for (int ch = 0; ch < kLines; ++ch) before[ch] = network.lp_state_[ch];
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    const bool awake = !device.asleep() || left != 0.0f || right != 0.0f;
    device.process(1);
    const float out_left = device.out_left()[0];
    const float out_right = device.out_right()[0];

    // What goes into the diffusers: the two channels as one, out of the
    // pre-delay's line, times the breath. Asleep the device takes nothing in.
    const float sum = (left + right) * 0.5f;
    const float delayed = network.predelay_samples_ > 0 ? network.predelay_.read(network.predelay_samples_) : sum;
    const float open = FdnReverb::breath_law(network.breath_phase_, network.breath_depth_.current);
    const float entering = awake ? delayed * open : 0.0f;

    // The build part, beside the device's network.
    shown.run(entering);
    if (both) held.run(entering);

    // The bare network and line 1 by itself, given the loop as one channel.
    looped.run(sum);
    const float echo = alone.read(looped.length[0]);
    alone.write(sum + looped.gain[0] * echo);

    const float power = 0.5f * (out_left * out_left + out_right * out_right);
    smooth_one = power + (smooth_one - power) * smooth;
    smooth_two = smooth_one + (smooth_two - smooth_one) * smooth;
    const float power_in = 0.5f * (left * left + right * right);
    smooth_in_one = power_in + (smooth_in_one - power_in) * smooth;
    smooth_in_two = smooth_in_one + (smooth_in_two - smooth_in_one) * smooth;
    if (!kept) continue;

    // The diffused input: the last all-pass keeps x + g·y and still holds the
    // sample it read, so y = (read − g·kept) / (1 − g²).
    const float stored = last.line.read(1);
    const float read = last.line.read(last.length + 1);
    const float spread = awake ? (read - g2 * stored) / (1.0f - g2 * g2) : 0.0f;

    // The feedback path again: the device's eight line outputs through the
    // kit's matrix, times the gain, plus the diffused input, through the
    // damping filter. The device kept the filter's state.
    float v[kLines];
    for (int ch = 0; ch < kLines; ++ch) v[ch] = network.interp_state_[ch];
    kit::hadamard<kLines>(v);
    if (awake && i < 2 * frames) {
      const float a = network.lp_coefficient_.current;
      for (int ch = 0; ch < kLines; ++ch) {
        const float again = (1.0f - a) * (spread + v[ch] * plan.gain) + a * before[ch];
        const double d = static_cast<double>(again) - network.lp_state_[ch];
        differ += d * d;
        reference += static_cast<double>(network.lp_state_[ch]) * network.lp_state_[ch];
      }
    }

    // The wet signal: a quarter of every other line, through tanh.
    const float* lines = network.interp_state_;
    const float wet_left = std::tanh((lines[0] + lines[2] + lines[4] + lines[6]) * 0.25f);
    const float wet_right = std::tanh((lines[1] + lines[3] + lines[5] + lines[7]) * 0.25f);
    if (i < 2 * frames) {
      const double d_left = static_cast<double>(left * dry_gain + wet_left * wet_gain) - out_left;
      const double d_right = static_cast<double>(right * dry_gain + wet_right * wet_gain) - out_right;
      mixed_apart += d_left * d_left + d_right * d_right;
      mixed_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
      // The build with every piece, line by line, against the device's lines.
      for (int ch = 0; ch < kLines; ++ch) {
        const float own = lines[ch];
        const float d = compared.between[ch] - own;
        built_apart += static_cast<double>(d) * d;
        built_whole += static_cast<double>(own) * own;
        worst = kit::max(worst, std::fabs(d));
      }
    }

    in_tap.put(i, left, right);
    lone.put(i, echo);
    bare.put(i, looped.left(), looped.right());
    fed.put(i, entering);
    diffused.put(i, spread);
    line_short.put(i, lines[0]);
    line_long.put(i, lines[kLines - 1]);
    shared.put(i, v[0]);
    written.put(i, network.lines_[0].read(1));
    wet.put(i, wet_left, wet_right);
    out_tap.put(i, out_left, out_right);
    built.put(i, shown.left, shown.right);
    built_first.put(i, shown.out[0]);
    built_last.put(i, shown.out[kLines - 1]);
    if (i % lab::kControlPeriod == 0) {
      level_in.put(i, lab::power_to_db(smooth_in_two));
      level.put(i, lab::power_to_db(smooth_two));
      if (i < 2 * frames) {
        keep(breath_phase, i, network.breath_phase_);
        keep(gate, i, open);
        keep(sway_short, i, swayed(network, 0));
        keep(sway_long, i, swayed(network, kLines - 1));
        keep(built_sway, i, shown.sway[0]);
      }
    }
  }
  loop.value = reference > 0.0 ? lab::power_to_db(static_cast<float>(differ / reference)) : lab::kFloorDb;
  if (loop.value < lab::kFloorDb) loop.value = lab::kFloorDb;
  wet_again.value = lab::ratio_db(mixed_apart, mixed_whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  built_worst.value = worst;
  trip_gain.value = lab::to_db(plan.gain);

  measure_matrices();
  device_response();
  bare_networks(network);
  ring();
}
