// Lesson 14, the feedback delay network: the FDN Reverb (cpp/devices/fdn-reverb)
// run one sample at a time, with its eight lines read as it works.
//
//   in ─► gate ─► 4 all-passes ─┬──────────────► (+) ─► damping ─► DC block ─► tanh ─► line 1 ─┬─►
//                               ├──────────────► (+) ─►   ...                          line 2 ─┤
//                               ┆                 ▲                                      ...   ┆
//                               └──────────────► (+) ─►   ...                          line 8 ─┤
//                                                 └──── × gain ◄──── mixing matrix ◄───────────┘
//                                         left = lines 1, 3, 5, 7     right = lines 2, 4, 6, 8
//
// lab-sources: cpp/devices/fdn-reverb/fdn_reverb_device.cpp
//
// Read from the device: each line's output (the state its interpolated read
// keeps), what is written back into a line, the breath, the output. The
// diffused input and the gain are locals of the device's process() and are
// not kept, so the lab works them out again from the device's own state
// ("lesson"), then works the whole feedback path out again with the kit's
// own mixing function (cpp/kit/fdn.h) and reports how far that lands from
// the damping state the device stored (the "loop" check).
//
// The device has no control for the slow wander of its line lengths. To show
// the network at rest the lab stops the eight oscillators by clearing their
// rates in the device's state; the "wander" control lets them run again as
// the device sets them.
//
// The decay curves and the spectrum over time are of the response to one
// click, from rest, of a second copy of the device's network. The bare
// network, with nothing in its loop but lines, a mixing matrix and a gain, is
// written for the lesson from the kit's parts, with the device's own lengths.

#include "lab.h"

#include "../../cpp/devices/fdn-reverb/fdn_reverb_device.h"

using namespace livemix;

namespace {

constexpr int kLines = FdnReverb::kChannels;
constexpr int kResponse = 96000;  // two seconds
constexpr int kBareSize = 32768;
constexpr int kWindow = 2400;  // 50 ms: the window echoes are counted in

FdnReverbDevice device;
FdnReverb probe;  // the same network, for the response to one click

kit::DelayLine<kBareSize> bare_lines[kLines];
float response_[kResponse];
float band_[kResponse];

lab::Control decay{"decay", "Decay", "s", 0.1f, 20.0f, 1.5f, lab::kLog};
lab::Control size{"size", "Size", "", 0.5f, 2.0f, 1.0f};
lab::Control damping{"damping", "Damping", "", 0.0f, 1.0f, 0.0f};
lab::Control matrix{"matrix", "Mixing", "", 0.0f, 2.0f, 1.0f, lab::kLinear, "None|Hadamard|Householder"};
lab::Control gains{"gains", "Gain", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "One for all|One per line"};
lab::Control wander{"wander", "Wander", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "Still|Moving"};
lab::Control breath_depth{"breathDepth", "Breath depth", "", 0.0f, 1.0f, 0.0f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap gate{"gate", "Breath: the gain on the input", lab::kControl, lab::kDevice, 1, ""};
lab::Tap diffused{"diffused", "Diffused input", lab::kAudio, lab::kLesson, 1};
lab::Tap line_short{"line1", "Line 1, the shortest", lab::kAudio, lab::kDevice, 1};
lab::Tap line_long{"line8", "Line 8, the longest", lab::kAudio, lab::kDevice, 1};
lab::Tap written{"written", "Written back into line 1", lab::kAudio, lab::kDevice, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap level_in{"levelIn", "Level of the input", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap level{"level", "Level of the output", lab::kControl, lab::kLesson, 1, "dB"};

lab::Tap lengths{"lengths", "The eight lengths", lab::kCurve, lab::kDevice, 1, "ms"};
lab::Tap comb{"comb", "One line alone", lab::kCurve, lab::kLesson, 1};
lab::Tap comb_teeth{"combTeeth", "One line alone: its response to frequency", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap apart{"apart", "Eight lines, each fed back to itself", lab::kCurve, lab::kLesson, 1};
lab::Tap mixed{"mixed", "Eight lines, mixed", lab::kCurve, lab::kLesson, 1};
lab::Tap density_apart{"densityApart", "Echoes, each line to itself", lab::kCurve, lab::kLesson, 1, "per ms"};
lab::Tap density_mixed{"densityMixed", "Echoes, mixed", lab::kCurve, lab::kLesson, 1, "per ms"};
lab::Tap decay_curve{"decayCurve", "Energy still to come", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_wanted{"decayWanted", "60 dB in the decay time", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap decay_low{"decayLow", "Energy still to come, around 500 Hz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap decay_high{"decayHigh", "Energy still to come, around 8 kHz", lab::kCurve, lab::kDevice, 1, "dB"};
lab::Tap pass_gain{"passGain", "Gain of one trip round the loop", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap picture{"picture", "The response's spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};

lab::Check loop{"loop", "The feedback path worked out again, against the device's own state", "dB"};
lab::Check trip_gain{"tripGain", "The gain on every trip round the loop", "dB"};
lab::Check keeps{"keeps", "Furthest the kit's Hadamard matrix lands from keeping energy", ""};
lab::Check keeps_householder{"keepsHouseholder", "Furthest the kit's Householder matrix lands from keeping energy", ""};
lab::Check same_matrix{"sameMatrix", "Largest difference between the device's matrix and the kit's", ""};
lab::Check density_first{"densityFirst", "Echoes in the first half second, mixed", ""};
lab::Check density_second{"densitySecond", "Echoes in the second half second, mixed", ""};

void still(FdnReverb& network) {
  for (int ch = 0; ch < kLines; ++ch) {
    network.lfo_phase_[ch] = 0.0f;
    network.lfo_increment_[ch] = 0.0f;
  }
}

void configure(FdnReverb& network, float depth) {
  network.set_decay(decay.value);
  network.set_damping(damping.value);
  network.set_size(size.value);
  network.set_predelay_ms(0.0f);
  network.set_breath_depth(depth);
  if (!wander.on()) still(network);
}

void mix_lines(float* v, int which) {
  if (which == 1) kit::hadamard<kLines>(v);
  if (which == 2) kit::householder<kLines>(v);
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

// The bare network: eight lines of the device's lengths, a mixing matrix and
// a gain, and nothing else. One click goes into every line, as the device
// feeds its lines. `out` takes the left output as the device takes it (lines
// 1, 3, 5 and 7, times a quarter); `first` takes line 1 alone. Size scales
// the lengths, here to the nearest whole sample. With `lossless` every gain
// is 1, for counting echoes that would otherwise die away.
void run_bare(int which, bool lossless, float* out, float* first) {
  int length[kLines];
  float gain[kLines];
  float sum = 0.0f;
  for (int ch = 0; ch < kLines; ++ch) {
    bare_lines[ch].clear();
    length[ch] = static_cast<int>(static_cast<float>(probe.base_delays_[ch]) * size.value + 0.5f);
    sum += static_cast<float>(length[ch]);
  }
  for (int ch = 0; ch < kLines; ++ch) {
    // One for all: the device's law, from the mean length. One per line: the
    // kit's, from each line's own.
    const float one = FdnReverb::feedback_gain_for(decay.value, sum / kLines / lab::kSampleRate);
    const float own = kit::rt60_gain(static_cast<float>(length[ch]), decay.value, lab::kSampleRate);
    gain[ch] = lossless ? 1.0f : (gains.on() ? own : one);
  }
  for (int n = 0; n < kResponse; ++n) {
    float v[kLines];
    for (int ch = 0; ch < kLines; ++ch) v[ch] = bare_lines[ch].read(length[ch]);
    out[n] = 0.25f * (v[0] + v[2] + v[4] + v[6]);
    if (first) first[n] = v[0];
    mix_lines(v, which);
    const float x = n == 0 ? 1.0f : 0.0f;
    for (int ch = 0; ch < kLines; ++ch) bare_lines[ch].write(x + gain[ch] * v[ch]);
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
  const int windows = kResponse / kWindow;
  if (!tap.open(windows)) return;
  tap.x0 = 0.5f * kWindow / lab::kSampleRate;
  tap.x1 = (windows - 0.5f) * kWindow / lab::kSampleRate;
  for (int w = 0; w < windows; ++w) {
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
// transform is, over the few samples of its response that are not zero.
void teeth(const float* h) {
  constexpr int kPoints = 481;
  constexpr float kTop = 60.0f;
  int at[64];
  int echoes = 0;
  for (int n = 0; n < kResponse && echoes < 64; ++n) {
    if (h[n] != 0.0f) at[echoes++] = n;
  }
  if (!comb_teeth.open(kPoints)) return;
  comb_teeth.x0 = 0.0f;
  comb_teeth.x1 = kTop;
  for (int p = 0; p < kPoints; ++p) {
    const double w = 2.0 * lab::kPi * kTop * p / (kPoints - 1) / lab::kSampleRate;
    double re = 0.0, im = 0.0;
    for (int e = 0; e < echoes; ++e) {
      re += h[at[e]] * std::cos(w * at[e]);
      im -= h[at[e]] * std::sin(w * at[e]);
    }
    comb_teeth.data[p] = lab::power_to_db(static_cast<float>(re * re + im * im));
  }
}

void bare_networks() {
  float* scratch = lab::take(kResponse);
  float* first = lab::take(kResponse);
  if (!scratch || !first) return;

  run_bare(0, false, scratch, first);
  copy_curve(apart, scratch, kResponse);
  copy_curve(comb, first, kResponse);
  teeth(first);

  run_bare(matrix.choice(), false, scratch, nullptr);
  copy_curve(mixed, scratch, kResponse);

  run_bare(0, true, scratch, nullptr);
  count_echoes(density_apart, scratch);
  run_bare(matrix.choice(), true, scratch, nullptr);
  count_echoes(density_mixed, scratch);
  density_first.value = static_cast<float>(echoes_between(scratch, 0, 24000));
  density_second.value = static_cast<float>(echoes_between(scratch, 24000, 48000));
}

// The response through a narrow band (two of the kit's band-pass filters in
// a row, so what leaks in from the slower-dying bands beside it stays well
// under what is measured), and how its energy dies away.
void band_decay(lab::Tap& tap, float hz) {
  kit::Svf one, two;
  one.set(hz, 4.0f, lab::kSampleRate);
  two.set(hz, 4.0f, lab::kSampleRate);
  for (int i = 0; i < kResponse; ++i) band_[i] = two.bandpass(one.bandpass(response_[i]));
  lab::energy_decay_tap(tap, band_, kResponse);
}

void device_response() {
  probe.init(lab::kSampleRate);
  configure(probe, 0.0f);
  for (int n = 0; n < kResponse; ++n) {
    float left = 0.0f, right = 0.0f;
    probe.process(n == 0 ? 1.0f : 0.0f, &left, &right);
    response_[n] = left;
  }
  lab::energy_decay_tap(decay_curve, response_, kResponse);
  if (decay_wanted.open(2)) {
    decay_wanted.x0 = 0.0f;
    decay_wanted.x1 = static_cast<float>(kResponse) / lab::kSampleRate;
    decay_wanted.set(0, 0.0f);
    decay_wanted.set(1, -60.0f * decay_wanted.x1 / decay.value);
  }
  band_decay(decay_low, 500.0f);
  band_decay(decay_high, 8000.0f);
  lab::spectrogram_tap(picture, response_, kResponse, 200, false);

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
  lab::response_tap(pass_gain, trip, kTrip);
}

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  (void)frames;
  device.init(lab::kSampleRate);
  device.set_param(FdnReverbParam::kMix, mix.value);
  FdnReverb& network = device.reverb_;
  configure(network, breath_depth.value);

  if (lengths.open(kLines)) {
    lengths.x0 = 1.0f;
    lengths.x1 = static_cast<float>(kLines);
    for (int ch = 0; ch < kLines; ++ch) {
      lengths.set(ch, static_cast<float>(network.base_delays_[ch]) * size.value * 1000.0f / lab::kSampleRate);
    }
  }

  auto& last = network.input_allpass_[FdnReverb::kInputAllpasses - 1];
  const float g2 = FdnReverb::kInputDiffusion2;
  double differ = 0.0, reference = 0.0;
  // A meter for the level traces: the mean of the two channels' squares
  // through two one-pole filters of 10 ms, as lesson 7's detector is built.
  float smooth_one = 0.0f, smooth_two = 0.0f, smooth_in_one = 0.0f, smooth_in_two = 0.0f;
  const float smooth = kit::time_to_coeff(0.01f, lab::kSampleRate);
  float gain = 0.0f, gain_decay = -1.0f, gain_size = -1.0f;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    float before[kLines];
    for (int ch = 0; ch < kLines; ++ch) before[ch] = network.lp_state_[ch];
    device.in_left()[0] = left;
    device.in_right()[0] = right;
    const bool awake = !device.asleep() || left != 0.0f || right != 0.0f;
    device.process(1);

    // The diffused input: the last all-pass keeps x + g·y and still holds the
    // sample it read, so y = (read − g·kept) / (1 − g²).
    const float kept = last.line.read(1);
    const float read = last.line.read(last.length + 1);
    const float spread = awake ? (read - g2 * kept) / (1.0f - g2 * g2) : 0.0f;

    // The feedback path again: the device's eight line outputs through the
    // kit's matrix, times the gain, plus the diffused input, through the
    // damping filter. The device kept the filter's state.
    if (awake) {
      float v[kLines];
      for (int ch = 0; ch < kLines; ++ch) v[ch] = network.interp_state_[ch];
      kit::hadamard<kLines>(v);
      // The device works its gain out on every sample; here only when the
      // decay or the size it reads has moved.
      if (network.decay_.current != gain_decay || network.size_.current != gain_size) {
        gain_decay = network.decay_.current;
        gain_size = network.size_.current;
        gain = FdnReverb::feedback_gain_for(gain_decay, network.average_delay_seconds_ * gain_size);
      }
      const float a = network.lp_coefficient_.current;
      if (i >= lab::frames()) {
        for (int ch = 0; ch < kLines; ++ch) {
          const float again = (1.0f - a) * (spread + v[ch] * gain) + a * before[ch];
          const double d = static_cast<double>(again) - network.lp_state_[ch];
          differ += d * d;
          reference += static_cast<double>(network.lp_state_[ch]) * network.lp_state_[ch];
        }
      }
    }

    const float out_left = device.out_left()[0];
    const float out_right = device.out_right()[0];
    const float power = 0.5f * (out_left * out_left + out_right * out_right);
    smooth_one = power + (smooth_one - power) * smooth;
    smooth_two = smooth_one + (smooth_two - smooth_one) * smooth;
    const float power_in = 0.5f * (left * left + right * right);
    smooth_in_one = power_in + (smooth_in_one - power_in) * smooth;
    smooth_in_two = smooth_in_one + (smooth_in_two - smooth_in_one) * smooth;

    in_tap.put(i, left, right);
    diffused.put(i, spread);
    line_short.put(i, network.interp_state_[0]);
    line_long.put(i, network.interp_state_[kLines - 1]);
    written.put(i, network.lines_[0].read(1));
    out_tap.put(i, out_left, out_right);
    if (i % lab::kControlPeriod == 0) {
      gate.put(i, FdnReverb::breath_law(network.breath_phase_, network.breath_depth_.current));
      level_in.put(i, lab::power_to_db(smooth_in_two));
      level.put(i, lab::power_to_db(smooth_two));
    }
  }
  loop.value = reference > 0.0 ? lab::power_to_db(static_cast<float>(differ / reference)) : lab::kFloorDb;
  if (loop.value < lab::kFloorDb) loop.value = lab::kFloorDb;
  trip_gain.value = lab::to_db(FdnReverb::feedback_gain_for(decay.value, network.average_delay_seconds_ * size.value));

  measure_matrices();
  device_response();
  bare_networks();
}
