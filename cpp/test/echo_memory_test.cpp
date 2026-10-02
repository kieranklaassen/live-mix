// Native harness for Echo Memory (cpp/devices/echo-memory). After the
// conformance pass it asserts what makes it an echo with a memory: the echo
// voice is a plain delay, the memory voice reaches back past a silence but
// never past Reach, prefers moments with sound, plays them back cleanly at
// half speed or backwards, and the whole device comes to rest.

#include "../devices/echo-memory/echo_memory.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::EchoMemory;
namespace p = livemix::echo_memory;

static EchoMemory device;

static const float kRate = 48000.0f;

// Sample index of the largest magnitude in [from, to).
static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// Echo voice only, wet only, nothing crossed, loop wide open.
static void echo_only(EchoMemory& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMemory, 0.0f);
  d.set_param(p::kEcho, 1.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

// Memory voice only, wet only, centred, loop wide open.
static void memory_only(EchoMemory& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kEcho, 0.0f);
  d.set_param(p::kMemory, 1.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kVary, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

// A moment the memory voice started, and the output sample it started near
// (within `block` frames).
struct Event {
  size_t at;
  EchoMemory::Recall recall;
};

static Stereo run_logged(EchoMemory& d, const std::vector<float>& left, const std::vector<float>& right,
                         std::vector<Event>* events, int block = 16) {
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  int seen = d.last_recall().count;
  for (size_t done = 0; done < left.size();) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(block), left.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    if (d.last_recall().count != seen) {
      seen = d.last_recall().count;
      events->push_back({done, d.last_recall()});
    }
    done += frames;
  }
  return out;
}

// `total` seconds of silence with a tone from `at` for `seconds` (10 ms fades).
static void add_tone(std::vector<float>& x, float hz, float at, float seconds, float gain,
                     float rate = kRate) {
  const size_t start = static_cast<size_t>(at * rate);
  const size_t length = static_cast<size_t>(seconds * rate);
  const size_t fade = static_cast<size_t>(0.01f * rate);
  for (size_t i = 0; i < length && start + i < x.size(); ++i) {
    float g = gain;
    if (i < fade) g *= static_cast<float>(i) / fade;
    if (length - i <= fade) g *= static_cast<float>(length - i) / fade;
    x[start + i] += g * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate));
  }
}

// Seconds after `from` at which the output last was not exact zero.
static double rings_for(const Stereo& out, size_t from, float rate = kRate) {
  size_t last = from;
  for (size_t i = from; i < out.size(); ++i) {
    if (out.left[i] != 0.0f || out.right[i] != 0.0f) last = i;
  }
  return static_cast<double>(last - from) / rate;
}

// Least-squares fit of a sine at `hz` to x[from, to): its amplitude, and the
// RMS of what the fit leaves over.
static void fit_sine(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                     double* amplitude, double* residual) {
  double ss = 0, cc = 0, sc = 0, xs = 0, xc = 0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    const double sn = std::sin(phase), cs = std::cos(phase);
    ss += sn * sn;
    cc += cs * cs;
    sc += sn * cs;
    xs += x[i] * sn;
    xc += x[i] * cs;
  }
  const double det = ss * cc - sc * sc;
  const double a = (xs * cc - xc * sc) / det;
  const double b = (xc * ss - xs * sc) / det;
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    const double error = x[i] - a * std::sin(phase) - b * std::cos(phase);
    sum += error * error;
  }
  *amplitude = std::sqrt(a * a + b * b);
  *residual = std::sqrt(sum / static_cast<double>(to - from));
}

int main() {
  Conformance spec;
  spec.name = "echo-memory";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // Default Reach (20 s) plus Size (3 s) plus two blocks of the activity map.
  spec.tail_seconds = 24.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Memory 0 is a plain delay: repeats at Time, each down by Feedback.
  {
    echo_only(device);
    device.set_param(p::kTime, 250.0f);
    device.set_param(p::kFeedback, 0.5f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
    const size_t first = peak_index(out.left, 6000, 18000);
    const size_t second = peak_index(out.left, 18000, 30000);
    std::printf("echo: first repeat at %zu, second at %zu, ratio %.3f\n", first, second,
                std::fabs(out.left[second]) / std::fabs(out.left[first]));
    EXPECT(std::llabs(static_cast<long long>(first) - 12000) <= 2, "first repeat lands at Time");
    EXPECT(std::llabs(static_cast<long long>(second) - 24000) <= 3, "second repeat lands at 2x Time");
    const double ratio = std::fabs(out.left[second]) / std::fabs(out.left[first]);
    EXPECT(ratio > 0.38 && ratio < 0.52, "each repeat is scaled by Feedback");
  }

  // Mix 0 is the input, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xD1CEu;
    std::vector<float> left = noise(3.0f, kRate, 0.5f);
    std::vector<float> right = noise(3.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, bit for bit");
  }

  // Recall: a 440 Hz tone, six seconds of silence, then 660 Hz. The memory
  // voice brings 440 Hz back past the silence; the echo alone does not, and
  // nor does a Reach shorter than the gap.
  {
    std::vector<float> input = silence(28.0f, kRate);
    add_tone(input, 440.0f, 0.0f, 2.0f, 0.25f);
    add_tone(input, 660.0f, 8.0f, 20.0f, 0.25f);
    const size_t from = static_cast<size_t>(9.0f * kRate);
    double level[3];
    for (int which = 0; which < 3; ++which) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      if (which == 1) device.set_param(p::kMemory, 0.0f);
      if (which == 2) device.set_param(p::kReach, 4.0f);
      Stereo out = run(device, input);
      level[which] = 0.0;
      // The loudest half second of 440 Hz after the gap.
      for (size_t at = from; at + 24000 <= out.size(); at += 12000) {
        level[which] = std::max(level[which], tone_level(out.left, 440.0, kRate, at, at + 24000));
      }
    }
    std::printf("recall: 440 Hz after the gap %.1f dB; echo alone %.1f dB; Reach 4 s %.1f dB\n",
                db(level[0] / 0.25), db(level[1] / 0.25), db(level[2] / 0.25));
    EXPECT(level[0] > 0.25 * 0.1, "the memory voice brings the first tone back past the silence");
    EXPECT(level[1] < 0.25 * 1.0e-4, "the echo alone has long forgotten it");
    EXPECT(level[2] < 0.25 * 1.0e-4, "a Reach shorter than the gap cannot get to it");
  }

  // The memory voice prefers sound and keeps inside Reach. The input is one
  // second of tone every ten (a memory that is 90 % silence): where each
  // moment came from is worked out from when it started and how old it was.
  {
    const float total = 90.0f;
    std::vector<float> input = silence(total, kRate);
    for (float at = 0.0f; at < 61.0f; at += 10.0f) add_tone(input, 330.0f, at, 1.0f, 0.3f);
    memory_only(device);
    device.set_param(p::kReach, 30.0f);
    device.set_param(p::kWander, 0.8f);
    device.set_param(p::kSize, 0.4f);
    std::vector<Event> events;
    run_logged(device, input, input, &events);
    int on_sound = 0;
    double youngest = 1.0e9, oldest = 0.0;
    for (const Event& event : events) {
      const double source = static_cast<double>(event.at) / kRate - event.recall.age_seconds;
      const double into = std::fmod(source, 10.0);
      if (source > -0.1 && source < 61.1 && into > -0.1 && into < 1.1) ++on_sound;
      youngest = std::min(youngest, static_cast<double>(event.recall.age_seconds));
      oldest = std::max(oldest, static_cast<double>(event.recall.age_seconds));
    }
    const double share = events.empty() ? 0.0 : static_cast<double>(on_sound) / events.size();
    std::printf("prefers sound: %zu moments, %.0f %% centred on a tone burst; ages %.2f to %.2f s\n",
                events.size(), 100.0 * share, youngest, oldest);
    EXPECT(events.size() > 60, "Wander 0.8 recalls a moment more than once a second");
    EXPECT(share >= 0.8, "at least 80 % of moments come from where there was sound");
    double near_gain = 0.0, far_gain = 1.0;
    for (const Event& event : events) {
      if (event.recall.age_seconds < 6.0f) near_gain = std::max(near_gain, static_cast<double>(event.recall.gain));
      if (event.recall.age_seconds > 27.0f) far_gain = std::min(far_gain, static_cast<double>(event.recall.gain));
    }
    std::printf("prefers sound: a recent moment plays at %.1f dB, one near the end of Reach at %.1f dB\n",
                db(near_gain), db(far_gain));
    EXPECT(near_gain > 0.95 && far_gain < 0.55 && far_gain >= 0.4, "older moments come back fainter");
    EXPECT(youngest >= 2.0, "nothing younger than two seconds is recalled");
    EXPECT(oldest <= 30.0, "nothing older than Reach is recalled");
  }

  // Moments fade in and out: on a steady low tone the memory voice never
  // jumps by more than two overlapping copies of the tone can.
  {
    std::vector<float> input = sine(110.0f, 30.0f, kRate, 0.5f);
    memory_only(device);
    device.set_param(p::kWander, 0.9f);
    device.set_param(p::kSize, 0.2f);
    device.set_param(p::kVary, 1.0f);
    device.set_param(p::kSpread, 1.0f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events);
    // One copy of the tone steps by 0.5 * 2 pi * 110 / 48000 = 0.0072 a
    // sample; double speed doubles it and the widest pan adds 3 dB.
    const double step = std::max(max_step(out.left), max_step(out.right));
    std::printf("fades: %zu moments of 0.2 s, largest step %.4f (peak %.2f)\n", events.size(), step,
                peak(out.left));
    EXPECT(events.size() > 60, "Wander 0.9 flickers: more than two moments a second");
    EXPECT(step < 0.045, "moments start and stop without a click");
  }

  // Vary: a moment comes back as it was, an octave down at half speed, an
  // octave up at double speed, or backwards. Each moment of a steady 440 Hz
  // tone is measured in the flat middle of its window.
  {
    std::vector<float> input = sine(440.0f, 150.0f, kRate, 0.3f);
    memory_only(device);
    device.set_param(p::kWander, 0.45f);
    device.set_param(p::kSize, 1.0f);
    device.set_param(p::kVary, 0.8f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events);
    int kinds[3] = {0, 0, 0}, reversed = 0, right = 0, measured = 0;
    for (const Event& event : events) {
      const size_t length = static_cast<size_t>(event.recall.seconds * kRate);
      const size_t from = event.at + length * 42 / 100, to = event.at + length * 58 / 100;
      if (to >= out.size() || length < 40000) continue;
      const double expected = 440.0 * event.recall.speed;
      const double found = dominant_frequency(out.left, kRate, 150.0, 1300.0, from, to);
      const double level = tone_level(out.left, expected, kRate, from, to) / event.recall.gain;
      ++measured;
      if (std::fabs(found - expected) < 2.0 && level > 0.27 && level < 0.33) ++right;
      kinds[event.recall.speed < 0.75f ? 0 : (event.recall.speed > 1.5f ? 2 : 1)] += 1;
      reversed += event.recall.reversed ? 1 : 0;
    }
    std::printf("vary: %d moments measured, %d at the right pitch and level; %d half speed, %d as played, "
                "%d double speed, %d backwards\n",
                measured, right, kinds[0], kinds[1], kinds[2], reversed);
    EXPECT(measured >= 25 && right == measured, "every moment plays at its speed's pitch, at the source level");
    EXPECT(kinds[0] >= 3 && kinds[1] >= 3 && kinds[2] >= 1 && reversed >= 3,
           "Vary gives half speed, double speed and backwards moments");
  }

  // Changed speeds are clean. With 5 kHz and 15 kHz in the memory, half speed
  // plays 2.5 and 7.5 kHz (its images would be at 21.5 and 16.5 kHz) and
  // double speed plays 10 kHz (the 15 kHz would fold to 18 kHz): the
  // strongest component that should not be there, per speed.
  {
    std::vector<float> input = silence(90.0f, kRate);
    add_tone(input, 5000.0f, 0.0f, 90.0f, 0.2f);
    add_tone(input, 15000.0f, 0.0f, 90.0f, 0.2f);
    memory_only(device);
    device.set_param(p::kWander, 0.55f);
    device.set_param(p::kSize, 0.8f);
    device.set_param(p::kVary, 1.0f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events);
    double worst[3] = {0.0, 0.0, 0.0};
    int count[3] = {0, 0, 0};
    for (const Event& event : events) {
      const int kind = event.recall.speed < 0.75f ? 0 : (event.recall.speed > 1.5f ? 2 : 1);
      const size_t length = static_cast<size_t>(event.recall.seconds * kRate);
      const size_t from = event.at + length * 42 / 100, to = event.at + length * 58 / 100;
      if (count[kind] >= 2 || length < 38000 || to >= out.size()) continue;
      ++count[kind];
      for (double hz = 100.0; hz < 24000.0; hz += 100.0) {
        if (std::fabs(hz - 5000.0 * event.recall.speed) < 500.0) continue;
        if (std::fabs(hz - 15000.0 * event.recall.speed) < 500.0) continue;
        worst[kind] =
            std::max(worst[kind], tone_level(out.left, hz, kRate, from, to) / event.recall.gain / 0.2);
      }
    }
    std::printf("speeds: strongest stray component %.1f dB at half speed, %.1f dB as played, %.1f dB at "
                "double speed (re the tones)\n",
                db(worst[0]), db(worst[1]), db(worst[2]));
    EXPECT(count[0] > 0 && count[1] > 0 && count[2] > 0, "all three speeds were measured");
    EXPECT(worst[0] < 1.0e-3 && worst[1] < 1.0e-3, "half speed leaves no image above -60 dB");
    EXPECT(worst[2] < 1.0e-3, "double speed folds nothing back above -60 dB");
  }

  // Backwards really is the source backwards: the flat middle of a reversed
  // moment against the input read the other way from where it started.
  {
    rng_state() = 0xFACEu;
    std::vector<float> input = noise(16.0f, kRate, 0.5f);
    // Two poles at 400 Hz: dull enough that the Tone filter's delay of under
    // a sample does not blur the comparison.
    double low = 0.0, lower = 0.0;
    for (float& v : input) {
      low += 0.05 * (v - low);
      lower += 0.05 * (low - lower);
      v = static_cast<float>(4.0 * lower);
    }
    memory_only(device);
    device.set_param(p::kWander, 0.6f);
    device.set_param(p::kSize, 0.5f);
    device.set_param(p::kVary, 1.0f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events, 1);
    double backwards = 0.0, forwards = 1.0;
    int found = 0;
    for (const Event& event : events) {
      if (!event.recall.reversed || event.recall.speed != 1.0f) continue;
      const long length = std::lround(event.recall.seconds * kRate);
      const long start = static_cast<long>(event.at) - std::lround(event.recall.start_age_seconds * kRate);
      if (event.at + length >= out.size()) continue;
      std::vector<float> played, mirrored, straight;
      for (long k = length * 42 / 100; k < length * 58 / 100; ++k) {
        played.push_back(out.left[event.at + k]);
        mirrored.push_back(input[start - k]);
        straight.push_back(input[start - length + k]);
      }
      backwards = correlation(played, mirrored);
      forwards = correlation(played, straight);
      ++found;
      break;
    }
    std::printf("reverse: correlation with the source backwards %.4f, forwards %.4f\n", backwards, forwards);
    EXPECT(found == 1 && backwards > 0.98, "a reversed moment is the source read backwards");
    EXPECT(std::fabs(forwards) < 0.5, "and not the source read forwards");
  }

  // 16-bit storage with dither: a recalled -20 dBFS sine against what is
  // left when the sine is taken away.
  {
    std::vector<float> input = sine(1000.0f, 30.0f, kRate, 0.1f);
    memory_only(device);
    device.set_param(p::kSize, 2.0f);
    device.set_param(p::kWander, 0.3f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events);
    double amplitude = 0.0, residual = 1.0;
    for (const Event& event : events) {
      const size_t length = static_cast<size_t>(event.recall.seconds * kRate);
      if (length < 90000 || event.at + length >= out.size()) continue;
      fit_sine(out.left, 1000.0, kRate, event.at + length * 42 / 100, event.at + length * 58 / 100,
               &amplitude, &residual);
      amplitude /= event.recall.gain;
      residual /= event.recall.gain;
      break;
    }
    const double snr = db(amplitude / std::sqrt(2.0) / residual);
    std::printf("16-bit memory: recalled sine %.2f dBFS, noise %.1f dB below it\n", db(amplitude), snr);
    EXPECT_NEAR(db(amplitude), -20.0, 0.1, "a recalled moment plays at the level it was recorded");
    EXPECT(snr > 60.0, "the memory's noise is more than 60 dB under a -20 dBFS sine");
  }

  // It comes to rest. At the defaults nothing can start later than Reach
  // after the last sound and nothing lasts longer than Size, so the output is
  // exact zero within Reach + Size (23 s) of the input stopping, and the
  // device is asleep.
  {
    device.init(kRate);
    std::vector<float> input = silence(40.0f, kRate);
    add_tone(input, 330.0f, 0.0f, 4.0f, 0.4f);
    add_tone(input, 495.0f, 4.0f, 4.0f, 0.4f);
    Stereo out = run(device, input);
    const double tail = rings_for(out, static_cast<size_t>(8.0f * kRate));
    std::printf("rest: default patch rings for %.2f s after the input stops\n", tail);
    EXPECT(tail > 10.0, "the memory keeps bringing moments back long after the echo has gone");
    EXPECT(tail <= 23.3, "exact silence within Reach + Size of the input stopping");
    EXPECT(device.asleep(), "asleep once it has come to rest");

    // It wakes with a blank memory: what was played before the sleep is not
    // recalled, even with Reach at a minute.
    device.set_param(p::kReach, 60.0f);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> second = silence(30.0f, kRate);
    add_tone(second, 495.0f, 0.0f, 30.0f, 0.3f);
    Stereo later = run(device, second);
    double old = 0.0;
    for (size_t at = 0; at + 24000 <= later.size(); at += 12000) {
      old = std::max(old, tone_level(later.left, 330.0, kRate, at, at + 24000));
    }
    std::printf("rest: after waking, the tone from before the sleep is at %.1f dB\n", db(old / 0.4));
    EXPECT(rms(later.left) > 0.05, "wakes on new input");
    // A recall of the old tone would sit near 0 dB here; what is measured is
    // the new tone's onset, which has a little energy everywhere.
    EXPECT(old < 0.4 * 1.0e-2, "wakes with a blank memory");
  }

  // Collect records what the memory voice plays back into the memory, 9.6 dB
  // down a generation. Loud input stays bounded; afterwards memories of
  // memories outlast Reach + Size (5 s here) and then die: at most seven
  // generations fit between full scale and the -60 dB that counts as silence,
  // so the output is exact zero within 8 x (Reach + Size) = 40 s.
  {
    double tails[2], peaks[2];
    for (int collect = 0; collect < 2; ++collect) {
      memory_only(device);
      device.set_param(p::kReach, 4.0f);
      device.set_param(p::kSize, 1.0f);
      device.set_param(p::kWander, 0.8f);
      device.set_param(p::kSpread, 1.0f);
      device.set_param(p::kCollect, static_cast<float>(collect));
      rng_state() = 0xABCDu;
      std::vector<float> input = noise(10.0f, kRate, 0.9f);
      input.resize(static_cast<size_t>(60.0f * kRate), 0.0f);
      Stereo out = run(device, input);
      tails[collect] = rings_for(out, static_cast<size_t>(10.0f * kRate));
      peaks[collect] = std::max(peak(out.left), peak(out.right));
    }
    std::printf("collect: rings %.2f s with Collect off, %.2f s with it on; peaks %.2f and %.2f\n",
                tails[0], tails[1], peaks[0], peaks[1]);
    EXPECT(tails[0] <= 5.3, "Collect off: silent within Reach + Size");
    EXPECT(tails[1] > tails[0] + 2.0, "Collect on: memories of memories ring on");
    EXPECT(tails[1] <= 40.0, "Collect on still dies away within its bound");
    EXPECT(peaks[1] < 2.01, "Collect on stays bounded with full-scale input");
  }

  // 96 kHz: the memory is kept at 48 kHz. A recalled 440 Hz tone comes back
  // at its level; a 30 kHz tone beside it must not fold to 18 kHz, and the
  // read back up to 96 kHz must not leave an image at 47.56 kHz.
  {
    const float rate = 96000.0f;
    std::vector<float> input = silence(14.0f, rate);
    add_tone(input, 440.0f, 0.0f, 14.0f, 0.25f, rate);
    add_tone(input, 30000.0f, 0.0f, 14.0f, 0.25f, rate);
    memory_only(device, rate);
    device.set_param(p::kSize, 2.0f);
    std::vector<Event> events;
    Stereo out = run_logged(device, input, input, &events);
    double tone = 0.0, alias = 1.0, ultrasonic = 1.0, image = 1.0;
    for (const Event& event : events) {
      const size_t length = static_cast<size_t>(event.recall.seconds * rate);
      const size_t from = event.at + length * 42 / 100, to = event.at + length * 58 / 100;
      if (length < 180000 || to >= out.size()) continue;
      tone = tone_level(out.left, 440.0, rate, from, to) / event.recall.gain;
      alias = tone_level(out.left, 18000.0, rate, from, to) / event.recall.gain;
      ultrasonic = tone_level(out.left, 30000.0, rate, from, to) / event.recall.gain;
      image = tone_level(out.left, 47560.0, rate, from, to) / event.recall.gain;
      break;
    }
    std::printf("96 kHz: recalled 440 Hz %.2f dB re input; 18 kHz alias %.1f dB, 30 kHz %.1f dB, "
                "47.56 kHz image %.1f dB below it\n",
                db(tone / 0.25), -db(alias / tone), -db(ultrasonic / tone), -db(image / tone));
    EXPECT_NEAR(db(tone / 0.25), 0.0, 0.2, "96 kHz: a recalled tone plays at its level");
    EXPECT(alias < tone * 1.0e-3, "96 kHz: nothing folds into the half-rate memory above -60 dB");
    EXPECT(ultrasonic < tone * 1.0e-3 && image < tone * 1.0e-3, "96 kHz: no images above -60 dB");
  }

  // Level and stereo at the defaults, on a held chord from a mono source.
  {
    std::vector<float> input = silence(24.0f, kRate);
    for (float hz : {196.0f, 246.94f, 293.66f, 392.0f}) add_tone(input, hz, 0.0f, 24.0f, 0.12f);
    device.init(kRate);
    Stereo out = run(device, input);
    const size_t from = static_cast<size_t>(6.0f * kRate);
    const double gain = db(0.5 * (rms(out.left, from) + rms(out.right, from)) / rms(input, from));
    const double corr = correlation(out.left, out.right, from);
    std::vector<float> mid(out.size());
    for (size_t i = 0; i < out.size(); ++i) mid[i] = 0.5f * (out.left[i] + out.right[i]);
    const double mono = db(rms(mid, from) / (0.5 * (rms(out.left, from) + rms(out.right, from))));
    std::printf("defaults: %+.2f dB re dry on a held chord, peak %.2f; L/R correlation %.2f, mono sum %+.2f dB\n",
                gain, std::max(peak(out.left), peak(out.right)), corr, mono);
    EXPECT(gain > -3.0 && gain < 3.0, "the default patch is within 3 dB of the dry level");
    EXPECT(corr > 0.3, "the default patch keeps a mono source mostly correlated");
    EXPECT(mono > -2.0, "the default patch folds to mono without a hole");
  }

  // Spread places each recalled moment at its own position, alternating
  // sides; at zero a mono source stays mono.
  {
    std::vector<float> input = sine(330.0f, 40.0f, kRate, 0.3f);
    double widest = 0.0, narrowest = 100.0;
    int flips = 0, pairs = 0;
    memory_only(device);
    device.set_param(p::kSpread, 1.0f);
    device.set_param(p::kSize, 0.5f);
    std::vector<Event> events;
    Stereo wide = run_logged(device, input, input, &events);
    double previous = 0.0;
    for (const Event& event : events) {
      const size_t length = static_cast<size_t>(event.recall.seconds * kRate);
      if (length < 20000 || event.at + length >= wide.size()) continue;
      const double balance = db(rms(wide.right, event.at, event.at + length) /
                                rms(wide.left, event.at, event.at + length));
      widest = std::max(widest, std::fabs(balance));
      narrowest = std::min(narrowest, std::fabs(balance));
      if (previous != 0.0) {
        ++pairs;
        if (balance * previous < 0.0) ++flips;
      }
      previous = balance;
    }
    memory_only(device);
    Stereo centred = run(device, input);
    double apart = 0.0;
    for (size_t i = 0; i < centred.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(centred.left[i]) - centred.right[i]));
    }
    std::printf("spread: at 1 moments sit %.1f to %.1f dB to one side and change sides %d times in %d; "
                "at 0 left and right differ by %.2g\n",
                narrowest, widest, flips, pairs);
    EXPECT(pairs >= 8 && flips == pairs, "Spread 1: successive moments are on opposite sides");
    EXPECT(narrowest > 2.0 && widest > 9.0 && widest < 13.0, "Spread 1: from just off centre to wide, never hard");
    // Each channel of the memory has its own dither, a step of 1/32767.
    EXPECT(apart < 1.0e-4, "Spread 0 keeps a mono source mono, down to the memory's dither");
  }

  // Tone darkens both voices, and the echo more on every repeat.
  {
    rng_state() = 0x70E5u;
    std::vector<float> input = noise(12.0f, kRate, 0.3f);
    double bright[2], dark[2];
    for (int voice = 0; voice < 2; ++voice) {
      for (int pass = 0; pass < 2; ++pass) {
        if (voice == 0) {
          echo_only(device);
        } else {
          memory_only(device);
          device.set_param(p::kWander, 0.7f);
        }
        device.set_param(p::kTone, pass == 0 ? 16000.0f : 800.0f);
        Stereo out = run(device, input);
        (pass == 0 ? bright : dark)[voice] = energy_above(out.left, 3000.0, kRate, 5 * 48000);
      }
    }
    echo_only(device);
    device.set_param(p::kTime, 200.0f);
    device.set_param(p::kFeedback, 0.8f);
    device.set_param(p::kTone, 2000.0f);
    std::vector<float> burst(input.begin(), input.begin() + 2400);
    burst.resize(static_cast<size_t>(2.0f * kRate), 0.0f);
    Stereo out = run(device, burst);
    const size_t n = 9600;
    const double early = energy_above(out.left, 3000.0, kRate, n, 2 * n);
    const double late = energy_above(out.left, 3000.0, kRate, 5 * n, 6 * n);
    std::printf("tone: energy above 3 kHz, echo %.3f -> %.4f, memory %.3f -> %.4f at 800 Hz; "
                "first repeat %.4f, fifth %.5f\n",
                bright[0], dark[0], bright[1], dark[1], early, late);
    EXPECT(dark[0] < bright[0] * 0.1, "Tone darkens the echo");
    EXPECT(dark[1] < bright[1] * 0.1, "Tone darkens the recalled moments");
    EXPECT(late < early * 0.5, "each echo repeat is darker than the last");
  }

  // Handling it while it sounds. Mix, Echo, Memory, Tone, Feedback, Spread
  // and Collect move without a click (the reference is the same render with
  // nothing moved); Time glides, bending the repeats by no more than the
  // head's top speed allows (3 x 110 Hz at twice the tone's level).
  {
    std::vector<float> input = sine(110.0f, 12.0f, kRate, 0.4f);
    double steps[3];
    for (int moved = 0; moved < 3; ++moved) {
      device.init(kRate);
      device.set_param(p::kMix, 0.6f);
      Stereo out;
      const size_t chunk = 4800;
      for (size_t done = 0, n = 0; done < input.size(); done += chunk, ++n) {
        if (moved == 2 && done >= 4 * 48000 && n % 5 == 0) {
          device.set_param(p::kTime, n % 2 ? 60.0f : 3000.0f);
        }
        if (moved == 1 && done >= 4 * 48000) {
          const float t = static_cast<float>(n % 7) / 6.0f;
          device.set_param(p::kMix, 0.2f + 0.8f * t);
          device.set_param(p::kEcho, 1.0f - t);
          device.set_param(p::kMemory, n % 3 ? 1.0f : 0.0f);
          device.set_param(p::kTone, n % 2 ? 900.0f : 12000.0f);
          device.set_param(p::kFeedback, n % 2 ? 0.9f : 0.0f);
          device.set_param(p::kSpread, n % 2 ? 1.0f : 0.0f);
          device.set_param(p::kCollect, static_cast<float>(n % 2));
        }
        std::vector<float> part(input.begin() + done, input.begin() + done + chunk);
        out = concat(out, run(device, part));
      }
      steps[moved] = std::max(max_step(out.left, 4 * 48000), max_step(out.right, 4 * 48000));
    }
    std::printf("handling: largest step %.4f left alone, %.4f with the controls thrown about, %.4f with "
                "Time jumping between 60 ms and 3 s\n",
                steps[0], steps[1], steps[2]);
    EXPECT(steps[1] < 0.03, "moving the controls while it sounds does not click");
    EXPECT(steps[2] < 0.06, "a Time change glides without a click");
  }

  // Cost: the default patch, then the heaviest sensible one (both voices
  // always busy with long moments at changed speeds, Collect on).
  {
    rng_state() = 0xBEEFu;
    std::vector<float> input = noise(20.0f, kRate, 0.25f);
    device.init(kRate);
    run(device, input);
    report_cost("echo-memory (defaults)", 20.0f, kRate, [&] { run(device, input); });
    device.init(kRate);
    device.set_param(p::kWander, 0.6f);
    device.set_param(p::kSize, 8.0f);
    device.set_param(p::kVary, 1.0f);
    device.set_param(p::kCollect, 1.0f);
    device.set_param(p::kReach, 60.0f);
    run(device, input);
    report_cost("echo-memory (heaviest)", 20.0f, kRate, [&] { run(device, input); });
  }

  return finish("echo-memory");
}
