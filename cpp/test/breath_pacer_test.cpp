// Native harness for Breath Pacer (cpp/devices/breath-pacer). The conformance
// pass covers silence before and after notes, a pile of keys, parameter abuse
// and other sample rates. The rest measures what makes it this instrument:
// one cycle clock counted in samples that starts at In with the first key
// from silence, a level and a brightness that follow In, Hold, Out and Rest,
// a struck mark on the exact sample of each of the two turns, a slow down in
// closed form over minutes, and the same output at any block size across any
// silence.
//
// Nobody has listened to this device. Every claim below is a measurement.

#include <ctime>
#include <functional>

#include "../devices/breath-pacer/breath_pacer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::BreathPacer;
namespace p = livemix::breath_pacer;

static BreathPacer device;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

// A count of samples for a time, to the nearest sample (testkit::render
// counts in float and can land one short).
static size_t at(double seconds, double rate = kRate) {
  return static_cast<size_t>(std::llround(seconds * rate));
}

// --- rendering exact counts of frames -------------------------------------------------------

// Block sizes: a positive number is that size, 0 is the ragged mix.
static const int kRagged[] = {1, 7, 64, 128, 33, 512, 2048, 5};

struct Take {
  Stereo out;
  int block = 128;
  int ragged_at = 0;
};

// Render `frames` more frames onto the end of `take`.
static void play(BreathPacer& d, Take& take, size_t frames) {
  const size_t start = take.out.size();
  take.out.left.resize(start + frames);
  take.out.right.resize(start + frames);
  size_t done = 0;
  while (done < frames) {
    const int size = take.block > 0 ? take.block : kRagged[take.ragged_at++ % 8];
    const int n = static_cast<int>(std::min(static_cast<size_t>(size), frames - done));
    d.process(n);
    for (int i = 0; i < n; ++i) {
      take.out.left[start + done + i] = d.out_left()[i];
      take.out.right[start + done + i] = d.out_right()[i];
    }
    done += n;
  }
}

static Stereo play(BreathPacer& d, size_t frames, int block = 128) {
  Take take;
  take.block = block;
  play(d, take, frames);
  return take.out;
}

// Render without keeping the sound: `seen(index, left, right)` for each frame.
template <typename Seen>
static void stream(BreathPacer& d, size_t frames, Seen seen, int block = 128) {
  size_t done = 0;
  while (done < frames) {
    const int n = static_cast<int>(std::min(static_cast<size_t>(block), frames - done));
    d.process(n);
    for (int i = 0; i < n; ++i) seen(done + i, d.out_left()[i], d.out_right()[i]);
    done += n;
  }
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = a.size() == b.size() ? 0.0 : 1.0e9;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// --- patches --------------------------------------------------------------------------------

static void pattern(BreathPacer& d, float in, float hold, float out, float rest) {
  d.set_param(p::kIn, in);
  d.set_param(p::kHold, hold);
  d.set_param(p::kOut, out);
  d.set_param(p::kRest, rest);
}

// The three parts alone are measured 12 dB under unity, where even a full
// pool with every level at its top stays under the soft clip's knee: what is
// read is then the part itself and not the guard.
static const float kQuiet = -12.0f;

// Only the pitched part: a level can be read off it.
static void tone_only(BreathPacer& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kMarks, 0.0f);
  d.set_param(p::kTone, 1.0f);
  d.set_param(p::kBright, 0.0f);
  d.set_param(p::kVolume, kQuiet);
}

// Only the marks: between two of them the output is exact zeros.
static void marks_only(BreathPacer& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kTone, 0.0f);
  d.set_param(p::kMarks, 1.0f);
  d.set_param(p::kVolume, kQuiet);
}

// Only the air.
static void air_only(BreathPacer& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAir, 1.0f);
  d.set_param(p::kTone, 0.0f);
  d.set_param(p::kMarks, 0.0f);
  d.set_param(p::kVolume, kQuiet);
}

// A key whose period is a whole 100 samples at `rate`, so that the RMS of a
// window of whole periods is the level and nothing else.
static float whole_key(float rate) { return rate / 100.0f; }

// The level of a tone of whole 100-sample periods, one value a period:
// RMS times the root of two (the amplitude, for a sine).
static std::vector<double> level_track(const std::vector<float>& x, size_t period = 100) {
  std::vector<double> track;
  for (size_t start = 0; start + period <= x.size(); start += period) {
    track.push_back(rms(x, start, start + period) * std::sqrt(2.0));
  }
  return track;
}

// The time of the largest value of a track between two times, in seconds
// (each value stands at the middle of its period).
static double time_of_most(const std::vector<double>& track, double from, double to, double rate,
                           bool least = false, size_t period = 100) {
  size_t best = 0;
  bool any = false;
  for (size_t i = 0; i < track.size(); ++i) {
    const double t = (static_cast<double>(i) + 0.5) * static_cast<double>(period) / rate;
    if (t < from || t > to) continue;
    if (!any || (least ? track[i] < track[best] : track[i] > track[best])) best = i;
    any = true;
  }
  return (static_cast<double>(best) + 0.5) * static_cast<double>(period) / rate;
}

// The first time a track crosses `level` between two times, going up or down.
static double crossing(const std::vector<double>& track, double level, double from, double to, double rate,
                       bool rising, size_t period = 100) {
  for (size_t i = 1; i < track.size(); ++i) {
    const double t0 = (static_cast<double>(i) - 0.5) * static_cast<double>(period) / rate;
    const double t1 = (static_cast<double>(i) + 0.5) * static_cast<double>(period) / rate;
    if (t1 < from || t0 > to) continue;
    const double a = track[i - 1], b = track[i];
    if (rising ? (a < level && b >= level) : (a > level && b <= level)) {
      return t0 + (t1 - t0) * (level - a) / (b - a);
    }
  }
  return -1.0;
}

// --- how suddenly an event arrives ----------------------------------------------------------

// The same passage twice from init, once with the event; the difference over
// 20 ms; the largest in its first 8 samples over the largest overall. At
// every one of `times` (seconds after the setup), the worst kept. Under 0.15
// the event came in gradually; a jump reads near 1.
using Change = std::function<void(BreathPacer&)>;

static double suddenness(const Change& setup, const Change& event, const std::vector<double>& times) {
  double worst = 0.0;
  for (double time : times) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      setup(device);
      play(device, at(time));
      if (pass == 0) event(device);
      out[pass] = play(device, at(0.02));
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

// CPU time of `work`, which renders `seconds` of sound: the machine is shared,
// so the wall clock says little.
template <typename Work>
static double cpu_share(float seconds, Work work) {
  const std::clock_t start = std::clock();
  work();
  return static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC / seconds;
}

static void test_cycle();
static void test_join_and_restart();
static void test_marks();
static void test_slow_down();
static void test_block_size_and_sleep();
static void test_clicks();
static void test_voices();
static void test_controls();
static void test_rates();
static void test_levels();
static void test_cost();

int main() {
  Conformance spec;
  spec.name = "breath-pacer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_cycle();
  test_join_and_restart();
  test_marks();
  test_slow_down();
  test_block_size_and_sleep();
  test_clicks();
  test_voices();
  test_controls();
  test_rates();
  test_levels();
  test_cost();
  return finish("breath-pacer");
}

// --- the cycle ------------------------------------------------------------------------------

static void test_cycle() {
  char label[240];

  // In 5, Out 5 (the defaults): the level peaks at 5.0 s and is back at the
  // floor at 10.0 s, at every rate and at any block size.
  for (float rate : kRates) {
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      tone_only(device, rate);
      device.note_on(1, whole_key(rate), 0.7f);
      Stereo out = play(device, at(10.5, rate), block);
      if (block != 128) {
        std::snprintf(label, sizeof label, "In 5 Out 5 at %.0f Hz is the same in blocks of %d (0 is ragged): worst %g", rate,
                      block, worst_difference(out, reference));
        EXPECT(worst_difference(out, reference) < 1.0e-6, label);
        continue;
      }
      reference = out;
      const std::vector<double> track = level_track(out.left);
      const double top = time_of_most(track, 2.0, 8.0, rate);
      const double crest = track[static_cast<size_t>(top * rate / 100.0)];
      const double up = crossing(track, 0.5 * crest, 0.0, 5.0, rate, true);
      const double down = crossing(track, 0.5 * crest, 5.0, 10.0, rate, false);
      const double bottom = time_of_most(track, 8.0, 10.5, rate, true);
      const double least = track[static_cast<size_t>(bottom * rate / 100.0)];
      std::printf("  %.0f Hz: In 5 Out 5 peaks at %.4f s (half way up at %.4f, half way down at %.4f), lowest at %.4f s, "
                  "crest %.4f, lowest %.6f\n",
                  rate, top, up, down, bottom, crest, least);
      std::snprintf(label, sizeof label, "at %.0f Hz the level of In 5 Out 5 peaks at 5.0 s within 10 ms (%.4f s)", rate, top);
      EXPECT(crest > 0.01 && std::fabs(top - 5.0) < 0.01, label);
      std::snprintf(label, sizeof label, "at %.0f Hz the rise and the fall are the same shape about 5.0 s (middle %.4f s)", rate,
                    0.5 * (up + down));
      EXPECT(up > 0.0 && down > 0.0 && std::fabs(0.5 * (up + down) - 5.0) < 0.01, label);
      std::snprintf(label, sizeof label, "at %.0f Hz the level is back at the floor at 10.0 s within 10 ms (%.4f s)", rate, bottom);
      EXPECT(std::fabs(bottom - 10.0) < 0.01 && least < 0.01 * crest, label);
      EXPECT(std::fabs(out.left[at(10.0, rate)]) < 1.0e-9, "with Floor at 0 the sample at 10.0 s is silence itself");
      EXPECT(out.left == out.right, "the pitched part is the same in both ears");
    }
  }

  // A breath begins with sound: the first half second, with the marks and
  // without them (the effect Breath, on a free clock, can begin in its Rest).
  for (float marks : {p::kParamDefault[p::kMarks], 0.0f}) {
    device.init(kRate);
    device.set_param(p::kMarks, marks);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = play(device, at(0.5));
    std::snprintf(label, sizeof label, "the first half second sounds with Marks at %.1f (RMS %g)", marks, rms(out.left));
    EXPECT(rms(out.left) > 1.0e-4, label);
  }

  // Four, seven, eight over two cycles (38 s): the same sound at any block
  // size, the held seconds included.
  {
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      device.init(kRate);
      pattern(device, 4.0f, 7.0f, 8.0f, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      device.note_on(2, 329.63f, 0.7f);
      Stereo out = play(device, at(38.0), block);
      if (block == 128) {
        reference = out;
        EXPECT(rms(out.left, at(5.0), at(10.0)) > 1.0e-3, "four seven eight sounds through its Hold");
        continue;
      }
      std::snprintf(label, sizeof label, "four seven eight over two cycles is the same in blocks of %d (0 is ragged): worst %g",
                    block, worst_difference(out, reference));
      EXPECT(worst_difference(out, reference) < 1.0e-6, label);
    }
    // And the Hold holds: the level stands still from 4 s to 11 s, then falls,
    // and the second cycle's Hold begins at 23 s.
    tone_only(device);
    pattern(device, 4.0f, 7.0f, 8.0f, 0.0f);
    device.note_on(1, whole_key(kRate), 0.7f);
    Stereo out = play(device, at(38.0));
    const std::vector<double> track = level_track(out.left);
    double low = 1.0e9, high = 0.0;
    for (size_t i = at(4.05) / 100; i < at(10.95) / 100; ++i) {
      low = std::min(low, track[i]);
      high = std::max(high, track[i]);
    }
    std::printf("  four seven eight: the level through Hold is %.6f to %.6f; at 3.9 s %.6f, at 11.2 s %.6f, at 23.5 s %.6f\n",
                low, high, track[at(3.9) / 100], track[at(11.2) / 100], track[at(23.5) / 100]);
    EXPECT(high > 0.01 && (high - low) < 1.0e-4 * high, "the level stands still through the seven seconds of Hold");
    EXPECT(track[at(3.9) / 100] < 0.999 * high && track[at(11.2) / 100] < 0.999 * high, "and moves just before and after it");
    EXPECT(std::fabs(track[at(23.5) / 100] - high) < 1.0e-4 * high, "the second cycle holds from 23 s");
  }

  // Seconds of exact silence while a key is held: In 1, Out 1, Rest 4 with
  // Floor at 0. The device must not take the Rest for the end, and the next
  // In comes on its sample.
  {
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      device.init(kRate);
      pattern(device, 1.0f, 0.0f, 1.0f, 4.0f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = play(device, at(8.0), block);
      if (block == 128) {
        reference = out;
        std::snprintf(label, sizeof label, "the Rest of a held key is exact silence (peak %g)", both_peak(out, at(2.0), at(6.0)));
        EXPECT(both_peak(out, at(2.0), at(6.0)) == 0.0, label);
        EXPECT(rms(out.left, at(1.5), at(1.9)) > 1.0e-5, "the Out before it still sounds");
        std::snprintf(label, sizeof label, "the next In sounds from 6.0 s (RMS %g)", rms(out.left, at(6.0), at(6.5)));
        EXPECT(rms(out.left, at(6.0), at(6.5)) > 1.0e-4, label);
        continue;
      }
      std::snprintf(label, sizeof label, "a held key across four seconds of Rest is the same in blocks of %d: worst %g", block,
                    worst_difference(out, reference));
      EXPECT(worst_difference(out, reference) < 1.0e-6, label);
    }
  }

  // The shape of a rise, read from the sound: a quarter, a half and three
  // quarters of the way up In 4 the level is the header's rise() of the crest.
  {
    tone_only(device);
    pattern(device, 4.0f, 2.0f, 4.0f, 0.0f);
    device.note_on(1, whole_key(kRate), 0.7f);
    Stereo out = play(device, at(6.0));
    const std::vector<double> track = level_track(out.left);
    const double crest = track[at(5.0) / 100];
    for (float t : {0.25f, 0.5f, 0.75f}) {
      // The middle of the period that straddles the moment: the mean of its two neighbours.
      const size_t index = at(4.0 * t) / 100;
      const double measured = 0.5 * (track[index - 1] + track[index]) / crest;
      std::snprintf(label, sizeof label, "%.2f of the way up In the level is %.4f of the crest (rise says %.4f)", t, measured,
                    BreathPacer::rise(t));
      EXPECT(std::fabs(measured - BreathPacer::rise(t)) < 0.002, label);
    }
    std::printf("  rise(0.25) %.4f, rise(0.5) %.4f, rise(0.75) %.4f\n", BreathPacer::rise(0.25f), BreathPacer::rise(0.5f),
                BreathPacer::rise(0.75f));
    EXPECT(std::fabs(BreathPacer::rise(0.25f) - 0.1982f) < 1.0e-3f && std::fabs(BreathPacer::rise(0.5f) - 0.5f) < 1.0e-4f,
           "a rise is half a line and half a soft S: 0.198 at a quarter, a half at a half");
  }

  // The shape of a part, as the header states it.
  EXPECT(BreathPacer::rise(0.0f) == 0.0f && std::fabs(BreathPacer::rise(1.0f) - 1.0f) < 1.0e-6f,
         "a rise runs from 0 to 1");
  EXPECT(std::fabs(BreathPacer::breath_at(BreathPacer::kStageHold, 0.3f) - 1.0f) < 1.0e-6f &&
             BreathPacer::breath_at(BreathPacer::kStageRest, 0.3f) == 0.0f,
         "the breath is full through Hold and empty through Rest");
  EXPECT(std::fabs(BreathPacer::breath_at(BreathPacer::kStageIn, 0.25f) + BreathPacer::breath_at(BreathPacer::kStageOut, 0.25f) -
                   1.0f) < 1.0e-6f,
         "Out is In turned over");
}

// --- keys that join, and the start after silence --------------------------------------------

// The level of the `hz` component, one value every `hop` samples from Hann
// windows of `window` samples; each value stands at its window's middle.
static std::vector<double> tone_track(const std::vector<float>& x, double hz, size_t window, size_t hop, double rate = kRate) {
  std::vector<double> track;
  for (size_t start = 0; start + window <= x.size(); start += hop) {
    track.push_back(tone_level(x, hz, rate, start, start + window));
  }
  return track;
}

static void test_join_and_restart() {
  char label[240];
  const size_t window = 2400, hop = 240;  // 50 ms, every 5 ms
  auto index_at = [&](double seconds) { return static_cast<size_t>((seconds * kRate - window / 2) / hop); };

  // A second key at 3 s joins the cycle: its swell peaks with the first's.
  {
    tone_only(device);
    device.note_on(1, 480.0f, 0.7f);
    Take take;
    play(device, take, at(3.0));
    device.note_on(2, 800.0f, 0.7f);
    play(device, take, at(7.5));
    const std::vector<double> first = tone_track(take.out.left, 480.0, window, hop);
    const std::vector<double> second = tone_track(take.out.left, 800.0, window, hop);
    size_t best_first = index_at(3.5), best_second = index_at(3.5);
    double low = 1.0e9, high = 0.0;
    for (size_t i = index_at(3.5); i <= index_at(9.0); ++i) {
      if (first[i] > first[best_first]) best_first = i;
      if (second[i] > second[best_second]) best_second = i;
      low = std::min(low, second[i] / first[i]);
      high = std::max(high, second[i] / first[i]);
    }
    const double first_at = (best_first * hop + window / 2) / static_cast<double>(kRate);
    const double second_at = (best_second * hop + window / 2) / static_cast<double>(kRate);
    std::printf("  a key at 3 s: the first key peaks at %.3f s, the second at %.3f s; second over first %.4f to %.4f\n", first_at,
                second_at, low, high);
    EXPECT(second[best_second] > 0.01, "the second key sounds");
    std::snprintf(label, sizeof label, "a key that joins at 3 s peaks with the first, at 5.0 s (%.3f and %.3f s)", first_at, second_at);
    EXPECT(std::fabs(second_at - 5.0) <= 0.01 && std::fabs(first_at - 5.0) <= 0.01, label);
    EXPECT(high - low < 0.01 * high, "and its level follows the first key's from there on");
  }

  // The key that joins strikes no mark of its own: it waits for the turn.
  {
    marks_only(device);
    device.note_on(1, 220.0f, 0.7f);
    Take take;
    play(device, take, at(3.0));
    device.note_on(2, 300.0f, 0.7f);
    play(device, take, at(3.0));
    std::snprintf(label, sizeof label, "a key that joins at 3 s strikes no mark until the turn (peak %g from 1 s to 5 s)",
                  both_peak(take.out, at(1.0), at(5.0)));
    EXPECT(both_peak(take.out, at(1.0), at(5.0)) == 0.0, label);
    const double low_mark = tone_level(take.out.left, 220.0 * 2.0 / 3.0, kRate, at(5.0), at(5.2));
    const double high_mark = tone_level(take.out.left, 300.0 * 2.0 / 3.0, kRate, at(5.0), at(5.2));
    std::printf("  the turn at 5 s: marks at %.5f (first key) and %.5f (second key)\n", low_mark, high_mark);
    EXPECT(low_mark > 1.0e-3 && high_mark > 1.0e-3, "at the turn both keys strike their mark");
  }

  // A key let go and struck again inside Hold carries on the running cycle:
  // once its attack is over, the sound is the held key's own, sample for
  // sample (In 2, Hold 4, Out 2; off at 3.0 s, on again at 3.5 s).
  {
    device.init(kRate);
    pattern(device, 2.0f, 4.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo held = play(device, at(9.0));

    device.init(kRate);
    pattern(device, 2.0f, 4.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Take take;
    play(device, take, at(3.0));
    device.note_off(1);
    play(device, take, at(0.5));
    EXPECT(rms(take.out.left, at(3.3), at(3.5)) < 0.5 * rms(held.left, at(3.3), at(3.5)), "a key up releases at once");
    device.note_on(1, 220.0f, 0.7f);
    play(device, take, at(5.5));
    const double apart = worst_difference(take.out, held, at(3.7), at(9.0));
    std::snprintf(label, sizeof label, "a key struck again inside Hold carries on the running cycle (worst %g against the held key)", apart);
    EXPECT(apart < 1.0e-6, label);
    EXPECT(rms(held.left, at(6.0), at(6.3)) > 1.0e-4, "(and there is something to compare)");
  }

  // The same with another key: it joins where the cycle stands, and the next
  // mark is the Out turn's at 6.0 s.
  {
    marks_only(device);
    pattern(device, 2.0f, 4.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Take take;
    play(device, take, at(3.0));
    device.note_off(1);
    play(device, take, at(0.5));
    device.note_on(2, 300.0f, 0.7f);
    play(device, take, at(3.5));
    size_t first = 0;
    for (size_t i = at(3.5); i < take.out.size() && first == 0; ++i) {
      if (take.out.left[i] != 0.0f) first = i;
    }
    std::snprintf(label, sizeof label, "another key struck inside Hold waits for the turn at 6.0 s (first sound at sample %zu, the turn is %zu)",
                  first, at(6.0));
    EXPECT(first == at(6.0) + 1, label);
  }

  // After exact silence the next key starts at In: what it plays is what a
  // fresh device plays, whether the device had fallen asleep yet or not.
  for (double gap : {1.72, 1.80, 3.5}) {
    device.init(kRate);
    pattern(device, 2.0f, 4.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo fresh = play(device, at(4.0));

    device.init(kRate);
    pattern(device, 2.0f, 4.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Take take;
    play(device, take, at(3.0));
    device.note_off(1);
    play(device, take, at(gap));
    const double left_over = both_peak(take.out, at(3.0 + gap - 0.02), at(3.0 + gap));
    device.note_on(1, 220.0f, 0.7f);
    Stereo again = play(device, at(4.0));
    std::snprintf(label, sizeof label, "after %.2f s of release the output is exact silence (peak %g)", gap, left_over);
    EXPECT(left_over == 0.0, label);
    std::snprintf(label, sizeof label, "a key after %.2f s starts at In, as on a fresh device (worst %g)", gap,
                  worst_difference(again, fresh));
    EXPECT(worst_difference(again, fresh) < 1.0e-6, label);
    EXPECT(rms(fresh.left, 0, at(0.5)) > 1.0e-4, "(and a fresh device begins with sound)");
  }
}

// --- the marks ------------------------------------------------------------------------------

// Where each mark begins in a render of marks alone: the sample before the
// first that is not zero after a stretch of exact zeros (a mark's own first
// sample is the sine of nothing).
struct MarkFinder {
  std::vector<size_t> onsets;
  size_t gap;
  size_t zeros;
  size_t base = 0;  // frames rendered by earlier calls

  explicit MarkFinder(float rate) : gap(static_cast<size_t>(0.05 * rate)), zeros(gap) {}

  void run(BreathPacer& d, size_t frames) {
    stream(d, frames, [&](size_t index, float left, float right) {
      if (left == 0.0f && right == 0.0f) {
        ++zeros;
        return;
      }
      if (zeros >= gap) onsets.push_back(base + index - 1);
      zeros = 0;
    });
    base += frames;
  }
};

static std::vector<size_t> mark_onsets(BreathPacer& d, size_t frames, float rate) {
  MarkFinder finder(rate);
  finder.run(d, frames);
  return finder.onsets;
}

static void test_marks() {
  char label[240];
  struct Pattern {
    float in, hold, out, rest;
  };
  // The second has lengths that are no whole number of samples at any rate.
  const Pattern patterns[] = {{2.0f, 0.0f, 2.0f, 0.0f}, {1.37f, 0.0f, 2.21f, 0.0f}, {2.0f, 3.0f, 2.0f, 1.5f}};
  for (float rate : kRates) {
    for (const Pattern& shape : patterns) {
      marks_only(device, rate);
      pattern(device, shape.in, shape.hold, shape.out, shape.rest);
      device.note_on(1, 220.0f, 0.7f);
      const double seconds = 3.2 * (shape.in + shape.hold + shape.out + shape.rest);
      const std::vector<size_t> found = mark_onsets(device, at(seconds, rate), rate);
      // The turns: In begins at the cycle's start, Out after In and Hold. A
      // turn's sample is the first one at or after its time.
      std::vector<size_t> expected;
      const double in = static_cast<double>(shape.in) * rate, hold = static_cast<double>(shape.hold) * rate;
      const double out = static_cast<double>(shape.out) * rate, rest = static_cast<double>(shape.rest) * rate;
      for (double start = 0.0; start < seconds * rate; start += in + hold + out + rest) {
        expected.push_back(static_cast<size_t>(std::ceil(start)));
        if (start + in + hold < seconds * rate) expected.push_back(static_cast<size_t>(std::ceil(start + in + hold)));
      }
      bool same = found.size() == expected.size();
      for (size_t i = 0; same && i < found.size(); ++i) same = found[i] == expected[i];
      std::snprintf(label, sizeof label,
                    "%.0f Hz, In %.2f Hold %.0f Out %.2f Rest %.1f: %zu marks, each on the exact sample of its turn (expected %zu)",
                    rate, shape.in, shape.hold, shape.out, shape.rest, found.size(), expected.size());
      EXPECT(same && found.size() >= 6, label);
      if (!same) {
        for (size_t i = 0; i < std::max(found.size(), expected.size()) && i < 10; ++i) {
          std::printf("    mark %zu: found %ld, expected %ld\n", i, i < found.size() ? static_cast<long>(found[i]) : -1L,
                      i < expected.size() ? static_cast<long>(expected[i]) : -1L);
        }
      }
    }
  }

  // With Hold at 0 there is one mark at the turn, not two; with a Hold there
  // is none where the Hold begins.
  {
    marks_only(device);
    pattern(device, 2.0f, 0.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    const std::vector<size_t> none = mark_onsets(device, at(7.9), kRate);
    EXPECT(none.size() == 4 && none[1] == at(2.0) && none[2] == at(4.0), "Hold 0: one mark at each turn (0, 2, 4 and 6 s)");
    marks_only(device);
    pattern(device, 2.0f, 3.0f, 2.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    const std::vector<size_t> held = mark_onsets(device, at(6.9), kRate);
    EXPECT(held.size() == 2 && held[1] == at(5.0), "Hold 3: no mark where the Hold begins, one where Out does");
  }

  // The first In mark (struck as the key arrives) is as loud as the next one,
  // for one key and for a chord; and a chord's marks are scaled by the root
  // of the count, so four keys of one pitch class strike no more than twice
  // as hard as one.
  {
    double single = 0.0;
    for (int keys : {1, 4}) {
      marks_only(device);
      pattern(device, 2.0f, 0.0f, 2.0f, 0.0f);
      for (int n = 0; n < keys; ++n) device.note_on(n, 220.0f * static_cast<float>(n + 1), 0.7f);
      Stereo out = play(device, at(4.5));
      const double first = peak(out.left, 0, at(0.4)), next = peak(out.left, at(4.0), at(4.4));
      if (keys == 1) single = first;
      std::snprintf(label, sizeof label, "%d key(s): the first In mark peaks at %.4f and the next at %.4f", keys, first, next);
      EXPECT(first > 0.01 && std::fabs(first / next - 1.0) < 0.01, label);
      if (keys == 4) {
        std::snprintf(label, sizeof label, "four keys strike %.2f times as hard as one (the root of the count is 2)", first / single);
        EXPECT(first / single > 1.0 && first / single <= 2.0, label);
      }
    }
  }

  // The two marks: the key's own pitch at In, a fifth below it at Out; soft
  // (a rise of milliseconds, not a click), short, and gone to exact zero.
  for (float rate : kRates) {
    marks_only(device, rate);
    pattern(device, 2.0f, 0.0f, 2.0f, 0.0f);
    device.note_on(1, 440.0f, 0.7f);
    Stereo out = play(device, at(4.0, rate));
    const double in_hz = dominant_frequency(out.left, rate, 200.0, 900.0, 0, at(0.3, rate));
    const double out_hz = dominant_frequency(out.left, rate, 200.0, 900.0, at(2.0, rate), at(2.3, rate));
    const double top = peak(out.left, 0, at(0.3, rate));
    size_t top_at = 0;
    for (size_t i = 0; i < at(0.3, rate); ++i) {
      if (std::fabs(out.left[i]) >= top) {
        top_at = i;
        break;
      }
    }
    const double early = peak(out.left, 0, 9);
    const double later = peak(out.left, at(0.25, rate), at(0.27, rate));
    std::printf("  %.0f Hz: the In mark is at %.1f Hz and the Out mark at %.1f Hz; peak %.4f after %.1f ms; %.1f dB down at 0.25 s\n",
                rate, in_hz, out_hz, top, 1000.0 * top_at / rate, db(later / top));
    std::snprintf(label, sizeof label, "at %.0f Hz the In mark is at the key (%.1f Hz) and the Out mark a fifth below (%.1f Hz)", rate,
                  in_hz, out_hz);
    EXPECT(std::fabs(in_hz - 440.0) < 3.0 && std::fabs(out_hz - 440.0 * 2.0 / 3.0) < 3.0, label);
    EXPECT(early < 0.02 * top, "a mark rises over milliseconds: after 8 samples it is under a fiftieth of its peak");
    EXPECT(1000.0 * top_at / rate > 1.0 && 1000.0 * top_at / rate < 20.0, "and peaks within 20 ms");
    EXPECT(db(later / top) < -20.0 && db(later / top) > -40.0, "a mark is about 30 dB down after a quarter of a second");
    EXPECT(peak(out.left, at(1.0, rate), at(2.0, rate)) == 0.0, "and is exact silence a second after it was struck");
    EXPECT(out.left == out.right, "the marks are the same in both ears");
  }
}

// --- the slow down --------------------------------------------------------------------------

// When the turn at `position` seconds of the pattern as set comes round, with
// the cycle growing to `slow_to` times its length over `over` seconds by
// ratio: the closed form, worked out here apart from the device.
static double turn_time(double position, double slow_to, double over) {
  const double log_ratio = -std::log(slow_to);  // of the speed, which falls
  const double reach = over * (std::exp(log_ratio) - 1.0) / log_ratio;  // the pattern covered while it slows
  if (position <= reach) return over * std::log(1.0 + position * log_ratio / over) / log_ratio;
  return over + (position - reach) * slow_to;
}

static void test_slow_down() {
  char label[240];

  // Slow to 1.5 over 2 minutes on In 5, Out 5: every turn comes when the
  // closed form says, the cycle is 10 s at the start, about 12.2 s after a
  // minute and 15 s from two minutes on.
  for (float rate : kRates) {
    marks_only(device, rate);
    device.set_param(p::kSlowTo, 1.5f);
    device.set_param(p::kOver, 2.0f);
    device.note_on(1, 220.0f, 0.7f);
    MarkFinder finder(rate);
    double reading[4] = {0, 0, 0, 0}, place[4] = {0, 0, 0, 0};
    for (int minute = 0; minute < 4; ++minute) {
      reading[minute] = device.cycle_seconds();
      place[minute] = device.meter(1);
      finder.run(device, at(minute < 3 ? 60.0 : 20.0, rate));
    }
    const std::vector<size_t>& onsets = finder.onsets;

    double worst = 0.0;
    for (size_t k = 0; k < onsets.size(); ++k) {
      const double expected = turn_time(5.0 * static_cast<double>(k), 1.5, 120.0);
      worst = std::max(worst, std::fabs(static_cast<double>(onsets[k]) / rate - expected));
    }
    // Whole cycles are from one In mark to the next: every second onset. A
    // cycle is as long as the law makes it at its own middle (the law is
    // nearly straight over one cycle), so each is held to that.
    double worst_cycle = 0.0, near_minute = 0.0, after_two = 0.0, first_cycle = 0.0;
    for (size_t k = 0; k + 2 < onsets.size(); k += 2) {
      const double from = static_cast<double>(onsets[k]) / rate, to = static_cast<double>(onsets[k + 2]) / rate;
      const double middle = 0.5 * (from + to);
      const double law = 10.0 * std::pow(1.5, std::min(middle, 120.0) / 120.0);
      if (to <= 120.0 || from >= 120.0) worst_cycle = std::max(worst_cycle, std::fabs((to - from) / law - 1.0));
      if (k == 0) first_cycle = to - from;
      if (from <= 60.0 && to > 60.0) near_minute = to - from;
      if (from >= 125.0 && after_two == 0.0) after_two = to - from;
    }
    std::printf("  %.0f Hz: %zu turns, worst %.3f ms from the closed form; cycle read %.3f, %.3f, %.3f, %.3f s at 0, 1, 2, 3 min; "
                "measured %.3f s first, %.3f s across one minute, %.5f s after two; worst cycle %.4f %% from the law at its middle\n",
                rate, onsets.size(), 1000.0 * worst, reading[0], reading[1], reading[2], reading[3], first_cycle, near_minute,
                after_two, 100.0 * worst_cycle);
    std::snprintf(label, sizeof label, "at %.0f Hz every turn of the slow down comes when the closed form says (worst %.3f ms over %zu turns)",
                  rate, 1000.0 * worst, onsets.size());
    EXPECT(onsets.size() >= 28 && worst < 5.0e-4, label);
    std::snprintf(label, sizeof label, "at %.0f Hz the cycle reads 10, 12.25, 15 and 15 s at 0, 1, 2 and 3 minutes (%.4f, %.4f, %.4f, %.4f)",
                  rate, reading[0], reading[1], reading[2], reading[3]);
    EXPECT(std::fabs(reading[0] - 10.0) < 0.01 && std::fabs(reading[1] - 10.0 * std::sqrt(1.5)) < 0.0123 &&
               std::fabs(reading[2] - 15.0) < 0.015 && std::fabs(reading[3] - 15.0) < 0.015,
           label);
    std::snprintf(label, sizeof label, "at %.0f Hz every measured cycle is as long as the law says at its middle (worst %.4f %%)", rate,
                  100.0 * worst_cycle);
    EXPECT(worst_cycle < 1.0e-3, label);
    EXPECT(std::fabs(first_cycle - turn_time(10.0, 1.5, 120.0)) < 5.0e-4 && first_cycle > 10.0 && first_cycle < 10.3,
           "the first cycle is a little over 10 s");
    EXPECT(std::fabs(near_minute - 10.0 * std::sqrt(1.5)) < 0.15, "the cycle that crosses one minute is about 12.2 s");
    EXPECT(std::fabs(after_two - 15.0) < 2.5 / rate, "a cycle after two minutes is 15 s to the sample");
    EXPECT(place[0] == 0.0 && std::fabs(place[1] - 0.5) < 1.0e-3 && place[2] == 1.0 && place[3] == 1.0,
           "the place in the slow down reads 0, a half, 1 and 1");
  }

  // The slow down's life (plan KTD4), read from the cycle's length.
  auto reads = [](double seconds) { return device.cycle_seconds() > seconds * 0.999 && device.cycle_seconds() < seconds * 1.001; };
  {
    // Armed with no key: nothing counts until the first key.
    device.init(kRate);
    device.set_param(p::kSlowTo, 1.5f);
    device.set_param(p::kOver, 2.0f);
    play(device, at(30.0), 2048);
    EXPECT(reads(10.0) && device.meter(1) == 0.0f, "armed with no key open, the slow down waits for the first key");
    // It counts on through a release, sleep and a new key.
    device.note_on(1, 220.0f, 0.7f);
    play(device, at(20.0), 2048);
    device.note_off(1);
    Stereo quiet = play(device, at(39.0), 2048);
    EXPECT(both_peak(quiet, at(5.0)) == 0.0, "(the device is silent through the gap)");
    device.note_on(2, 330.0f, 0.7f);
    play(device, at(1.0), 2048);
    std::snprintf(label, sizeof label, "the slow down counts on through a release, silence and a new key (%.4f s a cycle at one minute)",
                  device.cycle_seconds());
    EXPECT(reads(10.0 * std::sqrt(1.5)), label);
    // In, Hold, Out and Rest do not arm it.
    device.set_param(p::kIn, 6.0f);
    device.set_param(p::kHold, 1.0f);
    device.set_param(p::kOut, 7.0f);
    device.set_param(p::kRest, 2.0f);
    std::snprintf(label, sizeof label, "a change of the pattern does not start the slow down again (%.4f s a cycle, place %.3f)",
                  device.cycle_seconds(), device.meter(1));
    EXPECT(reads(16.0 * std::sqrt(1.5)) && std::fabs(device.meter(1) - 0.5f) < 1.0e-3f, label);
    // Moving Over does, from the set length, and at once with a key open.
    device.set_param(p::kOver, 3.0f);
    EXPECT(reads(16.0) && device.meter(1) == 0.0f, "moving Over starts it again from the set length");
    play(device, at(90.0), 2048);
    EXPECT(reads(16.0 * std::sqrt(1.5)), "and with a key open it runs at once: half way after half of the three minutes");
    // So does moving Slow to.
    device.set_param(p::kSlowTo, 2.0f);
    EXPECT(reads(16.0), "moving Slow to starts it again");
    play(device, at(180.0) - 1, 2048);
    EXPECT(device.cycle_seconds() < 32.0 && device.cycle_seconds() > 31.9, "a sample before its time is up it is not there yet");
    play(device, 1, 1);
    EXPECT(device.cycle_seconds() == 32.0, "and at its time it is at Slow to, and stays");
    play(device, at(30.0), 2048);
    EXPECT(device.cycle_seconds() == 32.0 && device.meter(1) == 1.0f, "(half a minute later it still is)");
  }
  {
    // Over at 0 is off, whatever Slow to says.
    device.init(kRate);
    device.set_param(p::kSlowTo, 2.0f);
    device.note_on(1, 220.0f, 0.7f);
    play(device, at(30.0), 2048);
    EXPECT(device.cycle_seconds() == 10.0 && device.meter(1) == 0.0f, "with Over at 0 the cycle keeps its length");
  }
}

// --- block size, silence and sleep ----------------------------------------------------------

static void test_block_size_and_sleep() {
  char label[240];

  // The output does not depend on the block size, across silences of every
  // length from inside the release to past the moment the device falls
  // asleep (which block that is depends on the block size), and one long
  // after it. With Release at 0.05 s the last voice ends 83 ms after its key
  // and the device sleeps 100 ms later. Controls are moved in the silence,
  // 10 ms before the next key: asleep or not, they are there when it comes.
  //   kind 0  the plain phrase
  //   kind 1  a slow down that is running through the silence
  //   kind 2  Over moved in the silence (the slow down armed with no key open)
  auto phrase = [](int block, double silence, int kind) {
    device.init(kRate);
    device.set_param(p::kRelease, 0.05f);
    pattern(device, 1.0f, 0.5f, 1.0f, 0.5f);
    if (kind == 1) {
      device.set_param(p::kSlowTo, 2.0f);
      device.set_param(p::kOver, 0.05f);  // three seconds
    }
    Take take;
    take.block = block;
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 329.63f, 0.8f);
    play(device, take, at(0.7));
    device.note_off(1);
    device.note_off(2);
    play(device, take, at(silence - 0.01));
    device.set_param(p::kAir, 0.9f);
    device.set_param(p::kBright, 1.0f);
    device.set_param(p::kFloor, 0.3f);
    device.set_param(p::kIn, 1.5f);
    if (kind == 2) {
      device.set_param(p::kSlowTo, 1.7f);
      device.set_param(p::kOver, 0.02f);
    }
    play(device, take, at(0.01));
    device.note_on(3, 277.18f, 0.8f);
    play(device, take, at(1.2));
    device.set_param(p::kTone, 0.9f);
    device.set_param(p::kOut, 3.0f);
    play(device, take, at(0.5));
    return take.out;
  };
  {
    Stereo asleep = phrase(128, 1.3, 0);
    EXPECT(both_peak(asleep, at(1.0), at(1.95)) == 0.0, "the phrase holds a silence in which the device sleeps");
    EXPECT(rms(asleep.left, at(2.2)) > 1.0e-3, "and a note after it");
  }
  for (int kind = 0; kind < 3; ++kind) {
    double worst = 0.0, worst_silence = 0.0;
    const char* worst_block = "none";
    for (double silence : {0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 1.3}) {
      Stereo reference = phrase(128, silence, kind);
      for (int block : {1, 0, 2048}) {
        const double apart = worst_difference(phrase(block, silence, kind), reference);
        if (apart > worst) {
          worst = apart;
          worst_silence = silence;
          worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
        }
      }
    }
    std::snprintf(label, sizeof label, "phrase %d does not depend on the block size across any silence (worst %g, %s blocks, %.2f s silence)",
                  kind, worst, worst_block, worst_silence);
    EXPECT(worst < 1.0e-6, label);
  }

  // A knob moved in silence is simply there at the next key: the sound is
  // that of a device set that way from init, sample for sample. The device is
  // put to sleep off any beat it might keep (one odd block of 13 frames while
  // the first note rings, and ragged blocks through the silence).
  auto moved_in_silence = [](const Change& move) {
    device.init(kRate);
    move(device);
    device.note_on(1, 220.0f, 0.7f);
    Stereo from_init = play(device, at(2.5));

    device.init(kRate);
    device.note_on(1, 330.0f, 0.7f);
    play(device, at(0.4));
    device.process(13);
    device.note_off(1);
    Stereo quiet = play(device, at(3.0), 0);
    move(device);
    play(device, at(0.005), 0);
    device.note_on(1, 220.0f, 0.7f);
    Stereo after = play(device, at(2.5));
    return std::max(worst_difference(after, from_init), both_peak(quiet, at(2.5)));
  };
  double worst_one = 0.0;
  int worst_id = -1;
  for (int id = 0; id < p::kNumParams; ++id) {
    const float low = p::kParamMin[id], high = p::kParamMax[id], usual = p::kParamDefault[id];
    const float far = (high - usual) > (usual - low) ? high : low;
    const double apart = moved_in_silence([&](BreathPacer& d) {
      if (id == p::kSlowTo) d.set_param(p::kOver, 0.05f);  // Slow to alone does nothing
      d.set_param(id, far);
    });
    if (apart > worst_one) {
      worst_one = apart;
      worst_id = id;
    }
  }
  std::snprintf(label, sizeof label, "each knob moved in silence is there at the next key (worst %g, param %d)", worst_one, worst_id);
  EXPECT(worst_one < 1.0e-6, label);
  const double all = moved_in_silence([](BreathPacer& d) {
    pattern(d, 1.3f, 0.4f, 1.1f, 0.3f);
    d.set_param(p::kSlowTo, 1.6f);
    d.set_param(p::kOver, 0.04f);
    d.set_param(p::kAir, 0.2f);
    d.set_param(p::kTone, 0.9f);
    d.set_param(p::kBright, 1.0f);
    d.set_param(p::kMarks, 0.8f);
    d.set_param(p::kFloor, 0.4f);
    d.set_param(p::kRelease, 0.3f);
    d.set_param(p::kVolume, -3.0f);
  });
  std::snprintf(label, sizeof label, "every knob moved in one silence is there at the next key (worst %g)", all);
  EXPECT(all < 1.0e-6, label);

  // A second init is the first: a phrase with keys, a pattern and a slow
  // down, bit for bit.
  {
    Stereo runs[2];
    for (Stereo& run : runs) {
      device.init(kRate);
      pattern(device, 1.0f, 0.3f, 1.2f, 0.2f);
      device.set_param(p::kSlowTo, 1.4f);
      device.set_param(p::kOver, 0.05f);
      device.note_on(1, 220.0f, 0.7f);
      device.note_on(2, 277.18f, 0.5f);
      Take take;
      play(device, take, at(2.0));
      device.note_off(1);
      device.note_on(3, 440.0f, 0.9f);
      play(device, take, at(2.0));
      run = take.out;
    }
    EXPECT(runs[0].left == runs[1].left && runs[0].right == runs[1].right, "a second init gives the first render again, bit for bit");
  }
}

// --- clicks ---------------------------------------------------------------------------------

static void test_clicks() {
  char label[240];
  // In 2, Hold 1, Out 2, Rest 1 with some Floor: six seconds a cycle, and
  // every part has sound in it. The moments tried fall in each part, and two
  // fall just after a turn, while its mark rings.
  const std::vector<double> places = {0.05, 0.5, 1.24, 1.98, 2.72, 3.05, 3.46, 4.2, 4.94, 5.68};
  const Change one = [](BreathPacer& d) {
    pattern(d, 2.0f, 1.0f, 2.0f, 1.0f);
    d.set_param(p::kFloor, 0.3f);
    d.note_on(1, 220.0f, 0.8f);
  };
  const Change eight = [](BreathPacer& d) {
    pattern(d, 2.0f, 1.0f, 2.0f, 1.0f);
    d.set_param(p::kFloor, 0.3f);
    for (int n = 0; n < BreathPacer::kMaxVoices; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.8f);
  };

  // A pattern changed in mid-cycle moves the level without a step: each of
  // the four lengths thrown to each end, at every place.
  {
    double worst = 0.0;
    int worst_id = -1;
    for (int id : {p::kIn, p::kHold, p::kOut, p::kRest}) {
      for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
        const double sudden = suddenness(one, [&](BreathPacer& d) { d.set_param(id, value); }, places);
        if (sudden > worst) {
          worst = sudden;
          worst_id = id;
        }
      }
    }
    std::snprintf(label, sizeof label, "a pattern changed in mid cycle moves the level without a step (worst %.3f of the way after 8 samples, param %d)",
                  worst, worst_id);
    EXPECT(worst < 0.15, label);
    std::printf("  a length thrown end to end in mid cycle: %.3f of the way after 8 samples at the worst\n", worst);
  }

  // The slow down thrown in mid-glide changes the speed, not the place.
  {
    const Change gliding = [&](BreathPacer& d) {
      d.set_param(p::kSlowTo, 2.0f);
      d.set_param(p::kOver, 0.1f);
      one(d);
    };
    const double over = suddenness(gliding, [](BreathPacer& d) { d.set_param(p::kOver, 30.0f); }, places);
    const double slow = suddenness(gliding, [](BreathPacer& d) { d.set_param(p::kSlowTo, 1.0f); }, places);
    std::snprintf(label, sizeof label, "Over and Slow to thrown in mid glide come in gradually (%.3f and %.3f)", over, slow);
    EXPECT(over < 0.15 && slow < 0.15, label);
  }

  // A steal, a second strike of a held key and the shortest release.
  {
    const double steal = suddenness(eight, [](BreathPacer& d) { d.note_on(99, 987.77f, 0.8f); }, places);
    const double again = suddenness(one, [](BreathPacer& d) { d.note_on(1, 220.0f, 0.8f); }, places);
    const double louder = suddenness(one, [](BreathPacer& d) { d.note_on(1, 220.0f, 0.2f); }, places);
    const double off = suddenness(
        [&](BreathPacer& d) {
          d.set_param(p::kRelease, p::kParamMin[p::kRelease]);
          one(d);
        },
        [](BreathPacer& d) { d.note_off(1); }, places);
    const double join = suddenness(one, [](BreathPacer& d) { d.note_on(2, 329.63f, 0.8f); }, places);
    std::snprintf(label, sizeof label,
                  "a steal, a second strike, a softer second strike, the shortest release and a joining key start gradually (%.3f, %.3f, %.3f, %.3f, %.3f)",
                  steal, again, louder, off, join);
    EXPECT(steal < 0.15 && again < 0.15 && louder < 0.15 && off < 0.15 && join < 0.15, label);
    std::printf("  after 8 samples: a steal is %.3f of the way, a second strike %.3f, a softer one %.3f, a note off %.3f, a joining key %.3f\n",
                steal, again, louder, off, join);
  }

  // Each smoothed control thrown end to end, both ways, at every place.
  for (int id : {p::kAir, p::kTone, p::kBright, p::kMarks, p::kFloor, p::kVolume}) {
    const double up = suddenness(
        [&](BreathPacer& d) {
          one(d);
          d.set_param(id, p::kParamMin[id]);
        },
        [&](BreathPacer& d) { d.set_param(id, p::kParamMax[id]); }, places);
    const double down = suddenness(
        [&](BreathPacer& d) {
          one(d);
          d.set_param(id, p::kParamMax[id]);
        },
        [&](BreathPacer& d) { d.set_param(id, p::kParamMin[id]); }, places);
    std::snprintf(label, sizeof label, "param %d thrown end to end is smoothed (%.3f up and %.3f down of the way after 8 samples)", id, up, down);
    EXPECT(up < 0.15 && down < 0.15 && up > 0.0 && down > 0.0, label);
  }
}

// --- voices ---------------------------------------------------------------------------------

static void test_voices() {
  char label[240];
  auto hold_eight = [](BreathPacer& d) {
    for (int n = 0; n < BreathPacer::kMaxVoices; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  };
  // In 1 then a long Hold: every measure below is taken on a full, still breath.
  auto still = [](BreathPacer& d) {
    tone_only(d);
    pattern(d, 1.0f, 12.0f, 1.0f, 0.0f);
  };

  // Two keys into a full pool, back to back with no block between: each
  // takes a voice of its own and both sound. The held keys are minor thirds
  // from 110 Hz; the probe pitches are clear of their partials (the highest
  // is 1480 Hz).
  {
    still(device);
    hold_eight(device);
    play(device, at(1.5));
    device.note_on(98, 2500.0f, 0.8f);
    device.note_on(99, 3100.0f, 0.8f);
    Stereo out = play(device, at(0.6));
    const double first = tone_level(out.left, 2500.0, kRate, at(0.2)), second = tone_level(out.left, 3100.0, kRate, at(0.2));
    std::snprintf(label, sizeof label, "two keys that both have to steal both sound (%.4f and %.4f)", first, second);
    EXPECT(first > 0.01 && second > 0.01, label);
  }
  // Seven held, then two: the first takes the free voice, and the second
  // must not take that voice from it (a level that is only true once the
  // sound has begun would say it is the quietest).
  {
    still(device);
    for (int n = 0; n < 7; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    play(device, at(1.5));
    device.note_on(98, 2500.0f, 0.8f);
    device.note_on(99, 3100.0f, 0.8f);
    Stereo out = play(device, at(0.6));
    const double first = tone_level(out.left, 2500.0, kRate, at(0.2)), second = tone_level(out.left, 3100.0, kRate, at(0.2));
    std::snprintf(label, sizeof label, "a key that took the last free voice is not stolen by the next one (%.4f and %.4f)", first, second);
    EXPECT(first > 0.01 && second > 0.01, label);
  }
  // The double strike with tied levels: eight keys held until every voice is
  // equally loud, the ninth key struck twice in one block. It takes one
  // voice, not two: the chord's second key is still there, and after every
  // key is let go the device reaches exact silence.
  {
    still(device);
    hold_eight(device);
    play(device, at(3.0));
    device.note_on(50, 2500.0f, 0.8f);
    device.note_on(50, 2500.0f, 0.8f);
    Stereo out = play(device, at(1.2));
    const double second_key = tone_level(out.left, 110.0 * std::pow(2.0, 3.0 / 12.0), kRate, at(0.2));
    const double first_key = tone_level(out.left, 110.0, kRate, at(0.2));
    std::snprintf(label, sizeof label, "a key struck twice in one block takes one voice: the first key went (%.5f), the second stays (%.4f)",
                  first_key, second_key);
    EXPECT(second_key > 0.01 && first_key < 0.02 * second_key && tone_level(out.left, 2500.0, kRate, at(0.2)) > 0.01, label);
    for (int n = 0; n < BreathPacer::kMaxVoices; ++n) device.note_off(n);
    device.note_off(50);
    Stereo rest = play(device, at(3.0));
    std::snprintf(label, sizeof label, "and nothing is left sounding once every key is let go (peak %g)", both_peak(rest, at(2.0)));
    EXPECT(both_peak(rest, at(2.0)) == 0.0, label);
  }
  // A key struck, let go before its stolen voice has faded: it never starts.
  {
    still(device);
    hold_eight(device);
    play(device, at(1.5));
    device.note_on(99, 2500.0f, 0.8f);
    device.note_off(99);
    Stereo never = play(device, at(0.4));
    EXPECT(tone_level(never.left, 2500.0, kRate, at(0.1)) < 1.0e-4, "a stolen voice released before it starts stays silent");
  }
  // A key struck again with every voice busy keeps its own voice and its
  // release: a quarter of the release time after it is let go it is about
  // 15 dB down, neither gone nor still full. (Seven low keys and one at
  // 1 kHz, clear of their partials.)
  {
    still(device);
    for (int n = 0; n < 7; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.8f);
    device.note_on(7, 1000.0f, 0.8f);
    play(device, at(1.5));
    device.note_on(7, 1000.0f, 0.8f);
    Stereo before = play(device, at(0.5));
    device.note_off(7);
    Stereo after = play(device, at(0.5));
    const double full = tone_level(before.left, 1000.0, kRate, at(0.3), at(0.5));
    const double quarter = tone_level(after.left, 1000.0, kRate, at(0.2), at(0.3));
    std::snprintf(label, sizeof label, "a key struck again with every voice busy keeps its release (%.1f dB a quarter of the way)",
                  db(quarter / full));
    EXPECT(db(quarter / full) < -9.0 && db(quarter / full) > -21.0, label);
    EXPECT(tone_level(before.left, 110.0, kRate, at(0.1)) > 0.01, "and it stole no voice to do so");
  }
  // A held key struck again does not stack: one voice, the same level, and
  // one key up ends it.
  {
    still(device);
    device.note_on(1, 220.0f, 0.7f);
    Stereo before = play(device, at(2.0));
    device.note_on(1, 220.0f, 0.7f);
    Stereo after = play(device, at(1.0));
    const double was = tone_level(before.left, 220.0, kRate, at(1.5)), is = tone_level(after.left, 220.0, kRate, at(0.5));
    std::snprintf(label, sizeof label, "a held key struck again keeps its level (%.5f then %.5f)", was, is);
    EXPECT(std::fabs(is / was - 1.0) < 0.01, label);
    device.note_off(1);
    Stereo rest = play(device, at(3.0));
    EXPECT(both_peak(rest, at(2.0)) == 0.0, "and one key up ends it");
  }
  // One pitch under two keys adds, whatever the moment the second arrives:
  // the second voice starts in step with the first, so the two never cancel.
  {
    double low = 1.0e9, high = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      still(device);
      device.note_on(1, 220.0f, 0.7f);
      Stereo alone = play(device, at(1.5 + 0.00057 * trial));
      device.note_on(2, 220.0f, 0.7f);
      Stereo both = play(device, at(0.6));
      const double ratio = tone_level(both.left, 220.0, kRate, at(0.3)) / tone_level(alone.left, 220.0, kRate, at(1.2));
      low = std::min(low, ratio);
      high = std::max(high, ratio);
    }
    std::snprintf(label, sizeof label, "one pitch under two keys is the root of two louder at every arrival (%.3f to %.3f)", low, high);
    EXPECT(low > 1.38 && high < 1.45, label);
  }
  // Bad notes: no frequency is no note, an absurd one is held to the range,
  // a gain over 1 is 1, and a key up for no key does nothing.
  {
    still(device);
    device.note_on(1, std::nanf(""), 0.7f);
    device.note_off(77);
    Stereo none = play(device, at(0.3));
    EXPECT(both_peak(none) == 0.0, "a note with no frequency is no note");
    still(device);
    device.note_on(1, 30000.0f, 0.7f);
    Stereo top = play(device, at(1.5));
    const double hz = dominant_frequency(top.left, kRate, 6000.0, 20000.0, at(1.1));
    std::snprintf(label, sizeof label, "a key above the range is played at its top, 12 kHz (%.0f Hz)", hz);
    EXPECT(std::fabs(hz - 12000.0) < 20.0, label);
    still(device);
    device.note_on(1, 220.0f, 5.0f);
    Stereo loud = play(device, at(1.5));
    still(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo full = play(device, at(1.5));
    EXPECT(worst_difference(loud, full) == 0.0, "a gain over 1 is 1");
  }
  // Nothing folds back at the top of the keyboard: a partial that would pass
  // half the rate is left out. Key at 5 kHz, 44.1 kHz: the fourth partial
  // (20 kHz) is past four tenths of the rate and the fifth does not exist;
  // at 9 kHz the third (27 kHz) would fold to 17.1 kHz.
  {
    tone_only(device, 44100.0f);
    device.set_param(p::kBright, 1.0f);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, 9000.0f, 0.7f);
    Stereo out = play(device, at(2.0, 44100.0));
    const double key = tone_level(out.left, 9000.0, 44100.0, at(1.2, 44100.0));
    const double folded3 = tone_level(out.left, 44100.0 - 27000.0, 44100.0, at(1.2, 44100.0));
    const double folded4 = tone_level(out.left, 44100.0 - 36000.0, 44100.0, at(1.2, 44100.0));
    std::snprintf(label, sizeof label, "a 9 kHz key at 44.1 kHz folds nothing back (third partial's place %.1f dB, fourth's %.1f dB under the key)",
                  db(folded3 / key), db(folded4 / key));
    EXPECT(key > 0.01 && db(folded3 / key) < -80.0 && db(folded4 / key) < -80.0, label);
  }
}

// --- what each control does -----------------------------------------------------------------

static void test_controls() {
  char label[240];

  // Air is the noise and Tone the pitched part: each alone is only itself.
  {
    tone_only(device);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, whole_key(kRate), 0.7f);
    Stereo tone = play(device, at(4.0));
    double repeat = 0.0;
    for (size_t i = at(2.0); i < at(3.0); ++i) repeat = std::max(repeat, std::fabs(static_cast<double>(tone.left[i]) - tone.left[i + 100]));
    std::snprintf(label, sizeof label, "with Air at 0 a held breath repeats period for period: no noise (worst %g)", repeat);
    EXPECT(rms(tone.left, at(2.0)) > 0.01 && repeat < 1.0e-5, label);

    air_only(device);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo air = play(device, at(9.0));
    const double level = rms(air.left, at(2.0));
    const double line = tone_level(air.left, 220.0, kRate, at(2.0));
    std::snprintf(label, sizeof label, "with Tone at 0 there is no line at the key (%.1f dB under the air)", db(line / level));
    EXPECT(level > 1.0e-3 && db(line / level) < -20.0, label);

    // The air is spread a little: half as much side as mid (the Ears law at
    // a half), so it folds to mono without loss, and its sides are alike.
    const double width = db(rms(side(air), at(2.0)) / rms(mid(air), at(2.0)));
    const double sides = db(rms(air.left, at(2.0)) / rms(air.right, at(2.0)));
    std::printf("  the air: side over mid %.2f dB, left over right %.2f dB, correlation %.3f\n", width, sides,
                correlation(air.left, air.right, at(2.0)));
    EXPECT(std::fabs(width + 6.0) < 1.0, "the air's side is 6 dB under its mid");
    EXPECT(std::fabs(sides) < 0.5, "and its two sides are equally loud");
    EXPECT(std::fabs(mean(air.left, at(2.0))) < 1.0e-3, "the air leaves no offset");
  }

  // Air, Tone and Marks are levels on a square law: a half is 12 dB down.
  {
    double levels[3][2];
    for (int half = 0; half < 2; ++half) {
      const float knob = half ? 0.5f : 1.0f;
      air_only(device);
      device.set_param(p::kAir, knob);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      levels[0][half] = rms(play(device, at(9.0)).left, at(2.0));
      tone_only(device);
      device.set_param(p::kTone, knob);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      levels[1][half] = rms(play(device, at(3.0)).left, at(2.0));
      marks_only(device);
      device.set_param(p::kMarks, knob);
      device.note_on(1, 220.0f, 0.7f);
      levels[2][half] = peak(play(device, at(0.5)).left);
    }
    std::snprintf(label, sizeof label, "Air, Tone and Marks at a half are 12 dB down (%.2f, %.2f and %.2f dB)",
                  db(levels[0][1] / levels[0][0]), db(levels[1][1] / levels[1][0]), db(levels[2][1] / levels[2][0]));
    for (auto& level : levels) EXPECT(std::fabs(db(level[1] / level[0]) + 12.04) < 0.3, label);
    EXPECT(levels[0][0] > 1.0e-3 && levels[1][0] > 1.0e-3 && levels[2][0] > 1.0e-3, "(and each sounds at full)");
  }

  // Bright: how much the brightness follows the breath. The pitched part's
  // second partial against its first is the header's own weight for how open
  // the breath is; at Bright 0 it does not move.
  for (float bright : {0.0f, 0.5f, 1.0f}) {
    tone_only(device);
    device.set_param(p::kBright, bright);
    pattern(device, 4.0f, 2.0f, 4.0f, 0.0f);
    device.note_on(1, 240.0f, 0.7f);
    Stereo out = play(device, at(6.0));
    // Half way up the In (2 s) and on the Hold (5 s).
    const double half_way = BreathPacer::breath_at(BreathPacer::kStageIn, 0.5f);
    const double expected[2] = {BreathPacer::partial_weight(2, BreathPacer::openness(bright, static_cast<float>(half_way))),
                                BreathPacer::partial_weight(2, BreathPacer::openness(bright, 1.0f))};
    const double measured[2] = {
        tone_level(out.left, 480.0, kRate, at(1.9), at(2.1)) / tone_level(out.left, 240.0, kRate, at(1.9), at(2.1)),
        tone_level(out.left, 480.0, kRate, at(4.5), at(5.5)) / tone_level(out.left, 240.0, kRate, at(4.5), at(5.5))};
    std::printf("  Bright %.1f: second partial over first %.3f half way up and %.3f full (the law says %.3f and %.3f)\n", bright,
                measured[0], measured[1], expected[0], expected[1]);
    std::snprintf(label, sizeof label, "Bright %.1f: the pitched part is as bright as the law says (%.3f and %.3f against %.3f and %.3f)",
                  bright, measured[0], measured[1], expected[0], expected[1]);
    EXPECT(std::fabs(measured[0] - expected[0]) < 0.02 && std::fabs(measured[1] - expected[1]) < 0.01, label);
    if (bright == 0.0f) EXPECT(std::fabs(measured[0] - measured[1]) < 0.01, "at Bright 0 the colour stays still");
    if (bright == 1.0f) EXPECT(measured[1] > measured[0] + 0.2, "at Bright 1 the breath opens as it fills");
  }
  // The same for the air: the share of its energy above 1 kHz.
  {
    double share[2][2];
    for (int full = 0; full < 2; ++full) {
      air_only(device);
      device.set_param(p::kBright, full ? 1.0f : 0.0f);
      device.set_param(p::kFloor, 1.0f);  // the level stays, so both stretches are loud enough to read
      pattern(device, 8.0f, 8.0f, 8.0f, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = play(device, at(16.0));
      share[full][0] = energy_above(out.left, 1000.0, kRate, at(0.1), at(2.1));
      share[full][1] = energy_above(out.left, 1000.0, kRate, at(9.0), at(16.0));
    }
    std::printf("  the air's energy above 1 kHz: Bright 0 %.3f early and %.3f full; Bright 1 %.3f early and %.3f full\n", share[0][0],
                share[0][1], share[1][0], share[1][1]);
    EXPECT(std::fabs(share[0][0] - share[0][1]) < 0.08, "at Bright 0 the air's colour stays still");
    EXPECT(share[1][1] > share[1][0] + 0.3, "at Bright 1 the air opens as the breath fills");
    EXPECT(share[1][1] > share[0][1] + 0.1 && share[1][0] < share[0][0] - 0.1, "and Bright 1 is brighter full and darker empty than Bright 0");
  }
  EXPECT(BreathPacer::openness(0.0f, 0.0f) == 0.5f && BreathPacer::openness(0.0f, 1.0f) == 0.5f &&
             BreathPacer::openness(1.0f, 0.0f) == 0.0f && BreathPacer::openness(1.0f, 1.0f) == 1.0f,
         "how open the breath is: a half at Bright 0, the breath itself at Bright 1");
  EXPECT(BreathPacer::air_cutoff_hz(0.0f) < BreathPacer::air_cutoff_hz(0.5f) && BreathPacer::air_cutoff_hz(0.5f) < BreathPacer::air_cutoff_hz(1.0f),
         "the air's low pass rises as the breath opens");

  // Floor: how much sound stays at the bottom. Read on In 2, Out 2, Rest 2.
  for (float floor : {0.0f, 0.5f, 1.0f}) {
    tone_only(device);
    device.set_param(p::kFloor, floor);
    pattern(device, 2.0f, 0.0f, 2.0f, 2.0f);
    device.note_on(1, whole_key(kRate), 0.7f);
    Stereo out = play(device, at(6.0));
    const std::vector<double> track = level_track(out.left);
    const double crest = std::max(track[at(2.0) / 100 - 1], track[at(2.0) / 100]);
    const double bottom = track[at(5.0) / 100];
    const double law = BreathPacer::floor_gain(floor);
    std::printf("  Floor %.1f: the bottom is %.4f of the crest (the law says %.4f)\n", floor, bottom / crest, law);
    std::snprintf(label, sizeof label, "Floor %.1f leaves %.4f of the crest at the bottom (the law says %.4f)", floor, bottom / crest, law);
    EXPECT(crest > 0.01 && std::fabs(bottom / crest - law) < 0.003, label);
    if (floor == 0.0f) EXPECT(both_peak(out, at(4.0), at(6.0)) == 0.0, "at Floor 0 the Rest is exact silence");
    if (floor == 0.5f) EXPECT(std::fabs(db(bottom / crest) + 12.04) < 0.2, "at Floor a half the bottom is 12 dB under the crest");
    if (floor == 1.0f) {
      double low = 1.0e9, high = 0.0;
      for (size_t i = at(0.5) / 100; i < at(6.0) / 100; ++i) {
        low = std::min(low, track[i]);
        high = std::max(high, track[i]);
      }
      EXPECT(high - low < 1.0e-3 * high, "at Floor 1 the level stays still");
    }
  }
  EXPECT(BreathPacer::level_gain(0.0f, 0.4f) == 0.4f && BreathPacer::level_gain(1.0f, 0.4f) == 1.0f &&
             std::fabs(BreathPacer::level_gain(0.5f, 0.0f) - 0.25f) < 1.0e-7f,
         "the level law: the floor's gain and the breath on top of it");

  // Release: 60 dB in the set time, so 30 dB at half of it.
  for (float release : {0.2f, 2.0f}) {
    tone_only(device);
    device.set_param(p::kRelease, release);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, whole_key(kRate), 0.7f);
    Stereo held = play(device, at(2.0));
    device.note_off(1);
    Stereo tail = play(device, at(2.0 * release + 0.5));
    const double full = level_track(held.left).back();
    const double half = level_track(tail.left)[at(0.5 * release) / 100];
    std::snprintf(label, sizeof label, "Release %.1f s: %.1f dB down at half of it", release, db(half / full));
    EXPECT(std::fabs(db(half / full) + 30.0) < 1.5, label);
    EXPECT(both_peak(tail, at(1.9 * release)) == 0.0, "and exact silence before twice the time is up");
  }

  // Volume is in decibels.
  {
    double levels[2];
    int n = 0;
    for (float volume : {-12.0f, -18.0f}) {
      tone_only(device);
      device.set_param(p::kVolume, volume);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      levels[n++] = rms(play(device, at(3.0)).left, at(2.0));
    }
    EXPECT(std::fabs(db(levels[1] / levels[0]) + 6.0) < 0.05, "Volume moves the level in decibels");
  }

  // The readings for a display: the place in the breath as it is set, the
  // place in the slow down, and how much longer than set the cycle is.
  {
    device.init(kRate);
    EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(2) == 1.0f, "at rest the readings are 0, 0 and 1");
    device.note_on(1, 220.0f, 0.7f);
    play(device, at(2.5));
    const float quarter = device.meter(0);
    play(device, at(5.0));
    const float three = device.meter(0);
    std::snprintf(label, sizeof label, "the place in the breath reads a quarter at 2.5 s and three quarters at 7.5 s (%.4f and %.4f)", quarter, three);
    EXPECT(std::fabs(quarter - 0.25f) < 1.0e-4f && std::fabs(three - 0.75f) < 1.0e-4f, label);
    device.note_off(1);
    play(device, at(3.0));
    EXPECT(device.meter(0) == 0.0f, "and 0 again once the sound has ended");
    EXPECT(device.meter(7) == 0.0f && device.meter(-1) == 0.0f, "a reading that does not exist is 0");
    device.init(kRate);
    device.set_param(p::kSlowTo, 2.0f);
    device.set_param(p::kOver, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    play(device, at(30.0), 2048);
    std::snprintf(label, sizeof label, "half way through a slow down to twice the length the cycle reads %.4f times its setting", device.meter(2));
    EXPECT(std::fabs(device.meter(2) - std::sqrt(2.0f)) < 2.0e-3f && std::fabs(device.meter(1) - 0.5f) < 1.0e-3f, label);
  }
}

// --- the same at every sample rate ----------------------------------------------------------

static void test_rates() {
  char label[240];
  struct Measured {
    double tone_hz, tone_level, air_level, air_bright, air_dark, mark_peak, default_peak;
  };
  Measured at_rate[3];
  for (int r = 0; r < 3; ++r) {
    const float rate = kRates[r];
    Measured& m = at_rate[r];
    // The pitched part on a full, still breath.
    tone_only(device, rate);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo tone = play(device, at(4.0, rate));
    m.tone_hz = dominant_frequency(tone.left, rate, 200.0, 240.0, at(1.5, rate));
    m.tone_level = rms(tone.left, at(1.5, rate));
    // The air on a full, still breath, at the defaults' Bright and fully open:
    // its level, and the share of it above 1 kHz and under 300 Hz.
    air_only(device, rate);
    pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo air = play(device, at(12.0, rate));
    m.air_level = rms(air.left, at(1.5, rate));
    m.air_bright = energy_above(air.left, 1000.0, rate, at(1.5, rate));
    m.air_dark = 1.0 - energy_above(air.left, 300.0, rate, at(1.5, rate));
    // A mark.
    marks_only(device, rate);
    device.note_on(1, 220.0f, 0.7f);
    m.mark_peak = peak(play(device, at(0.5, rate)).left);
    // The default patch over one breath.
    device.init(rate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo usual = play(device, at(10.5, rate));
    m.default_peak = both_peak(usual);
    std::printf("  %.0f Hz: tone %.3f Hz at %.2f dBFS; air %.2f dBFS, %.3f of it above 1 kHz, %.3f under 300 Hz; mark %.2f dBFS; "
                "the default patch peaks at %.2f dBFS\n",
                rate, m.tone_hz, db(m.tone_level), db(m.air_level), m.air_bright, m.air_dark, db(m.mark_peak), db(m.default_peak));
    std::snprintf(label, sizeof label, "at %.0f Hz the pitched part is at the key (%.3f Hz)", rate, m.tone_hz);
    EXPECT(std::fabs(m.tone_hz - 220.0) < 0.1, label);
  }
  const Measured& mid_rate = at_rate[1];
  for (int r : {0, 2}) {
    const Measured& m = at_rate[r];
    std::snprintf(label, sizeof label, "at %.0f Hz the tone, the air and the marks are as loud as at 48 kHz (%.2f, %.2f and %.2f dB apart)",
                  kRates[r], db(m.tone_level / mid_rate.tone_level), db(m.air_level / mid_rate.air_level),
                  db(m.mark_peak / mid_rate.mark_peak));
    EXPECT(std::fabs(db(m.tone_level / mid_rate.tone_level)) < 0.1 && std::fabs(db(m.air_level / mid_rate.air_level)) < 0.5 &&
               std::fabs(db(m.mark_peak / mid_rate.mark_peak)) < 0.2,
           label);
    std::snprintf(label, sizeof label, "at %.0f Hz the air against the tone is within 0.5 dB of 48 kHz (%.2f dB apart)", kRates[r],
                  db((m.air_level / m.tone_level) / (mid_rate.air_level / mid_rate.tone_level)));
    EXPECT(std::fabs(db((m.air_level / m.tone_level) / (mid_rate.air_level / mid_rate.tone_level))) < 0.5, label);
    std::snprintf(label, sizeof label, "at %.0f Hz the air has the colour it has at 48 kHz (above 1 kHz %.3f against %.3f, under 300 Hz %.3f against %.3f)",
                  kRates[r], m.air_bright, mid_rate.air_bright, m.air_dark, mid_rate.air_dark);
    EXPECT(std::fabs(m.air_bright - mid_rate.air_bright) < 0.03 && std::fabs(m.air_dark - mid_rate.air_dark) < 0.03, label);
    EXPECT(std::fabs(db(m.default_peak / mid_rate.default_peak)) < 1.5, "and the default patch peaks within 1.5 dB");
  }
}

// --- levels ---------------------------------------------------------------------------------

static void test_levels() {
  char label[240];
  // One key of the default patch over a whole breath: the recipe's range at
  // gain 0.7 and the narrower one the app expects at the gain it plays with.
  struct Range {
    float gain;
    double lowest, highest;
  };
  for (float hz : {65.406f, 261.63f, 1046.5f}) {
    for (const Range& range : {Range{0.7f, -24.0, -10.0}, Range{0.8f, -22.0, -16.0}}) {
      device.init(kRate);
      device.note_on(1, hz, range.gain);
      Stereo out = play(device, at(10.5));
      const double level = db(both_peak(out));
      std::printf("  one key (%.0f Hz) at gain %.1f: peak %.1f dBFS, loudest 400 ms %.1f dBFS\n", hz, range.gain, level,
                  db(rms(mid(out), at(4.8), at(5.2))));
      std::snprintf(label, sizeof label, "one key (%.0f Hz) at gain %.1f peaks between %.0f and %.0f dBFS (%.1f)", hz, range.gain,
                    range.lowest, range.highest, level);
      EXPECT(level > range.lowest && level < range.highest, label);
      EXPECT(std::fabs(mean(out.left)) < 1.0e-3 && std::fabs(mean(out.right)) < 1.0e-3, "and leaves no offset");
    }
  }

  // The note's gain is its level.
  {
    double levels[2];
    int n = 0;
    for (float gain : {0.7f, 0.35f}) {
      tone_only(device);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      device.note_on(1, 220.0f, gain);
      levels[n++] = rms(play(device, at(3.0)).left, at(2.0));
    }
    EXPECT(std::fabs(db(levels[1] / levels[0]) + 6.02) < 0.1, "half the gain is 6 dB down");
  }

  // So is the air's: it is one noise, as loud as the key that opens it.
  {
    double levels[2];
    int n = 0;
    for (float gain : {0.7f, 0.35f}) {
      air_only(device);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      device.note_on(1, 220.0f, gain);
      levels[n++] = rms(play(device, at(9.0)).left, at(2.0));
    }
    std::snprintf(label, sizeof label, "half the gain is 6 dB less air (%.2f dB)", db(levels[1] / levels[0]));
    EXPECT(std::fabs(db(levels[1] / levels[0]) + 6.02) < 0.1, label);
  }

  // The sum is scaled by the root of the count of sounding keys (plan KTD5):
  // four keys that are no partials of one another are as loud as one, a key
  // drops 3 dB as a second comes in, and the air does not grow with the keys.
  {
    const float keys[4] = {220.0f, 277.18f, 329.63f, 415.3f};
    double tone[2], air[2];
    for (int many = 0; many < 2; ++many) {
      tone_only(device);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      for (int n = 0; n < (many ? 4 : 1); ++n) device.note_on(n, keys[n], 0.8f);
      Stereo out = play(device, at(6.0));
      tone[many] = rms(out.left, at(2.0));
      if (many) {
        const double one_of_four = tone_level(out.left, 220.0, kRate, at(2.0));
        tone_only(device);
        pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
        device.note_on(0, 220.0f, 0.8f);
        const double alone = tone_level(play(device, at(6.0)).left, 220.0, kRate, at(2.0));
        std::snprintf(label, sizeof label, "one key of four is 6 dB under itself alone (%.2f dB)", db(one_of_four / alone));
        EXPECT(std::fabs(db(one_of_four / alone) + 6.02) < 0.1, label);
      }
      air_only(device);
      pattern(device, 1.0f, 12.0f, 1.0f, 0.0f);
      for (int n = 0; n < (many ? 4 : 1); ++n) device.note_on(n, keys[n], 0.8f);
      air[many] = rms(play(device, at(9.0)).left, at(2.0));
    }
    std::snprintf(label, sizeof label, "four keys are as loud as one: the tone %.2f dB apart, the air %.2f dB apart", db(tone[1] / tone[0]),
                  db(air[1] / air[0]));
    EXPECT(std::fabs(db(tone[1] / tone[0])) < 0.5 && std::fabs(db(air[1] / air[0])) < 0.1, label);
  }

  // A full pool at the crest stays under the clip's knee in both ears, at
  // the default patch: ten keys asked for (eight sound), at the gain the app
  // plays with and at full gain, as minor thirds and as the first eight
  // partials of one low note (whose peaks line up).
  for (int stack = 0; stack < 2; ++stack) {
    for (float gain : {0.8f, 1.0f}) {
      device.init(kRate);
      for (int n = 0; n < 10; ++n) {
        device.note_on(n, stack ? 110.0f * static_cast<float>(n + 1) : 110.0f * std::pow(2.0f, n * 3 / 12.0f), gain);
      }
      Stereo out = play(device, at(10.5));
      const double top = both_peak(out);
      std::printf("  ten keys (%s) at gain %.1f peak at %.3f (%.1f dBFS)\n", stack ? "partials of 110 Hz" : "minor thirds", gain, top, db(top));
      std::snprintf(label, sizeof label, "ten keys (%s) at gain %.1f stay under the clip's knee (peak %.3f)",
                    stack ? "partials of 110 Hz" : "minor thirds", gain, top);
      EXPECT(top < 0.5, label);
    }
  }

  // Everything turned up, a full pool and Volume at its top: the soft clip
  // is the guard, and it holds.
  {
    device.init(kRate);
    device.set_param(p::kAir, 1.0f);
    device.set_param(p::kTone, 1.0f);
    device.set_param(p::kMarks, 1.0f);
    device.set_param(p::kBright, 1.0f);
    device.set_param(p::kVolume, 6.0f);
    pattern(device, 1.0f, 2.0f, 1.0f, 0.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * static_cast<float>(n + 1), 1.0f);
    Stereo out = play(device, at(5.0));
    std::snprintf(label, sizeof label, "everything at its top is held by the soft clip (peak %.3f)", both_peak(out));
    EXPECT(both_peak(out) > 0.5 && both_peak(out) <= 1.0, label);
  }
}

// --- cost -----------------------------------------------------------------------------------

static void test_cost() {
  for (float rate : {48000.0f, 96000.0f}) {
    auto work = [rate] {
      device.init(rate);
      device.set_param(p::kSlowTo, 1.5f);
      device.set_param(p::kOver, 1.0f);
      pattern(device, 2.0f, 1.0f, 2.0f, 1.0f);
      for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
      stream(device, at(20.0, rate), [](size_t, float, float) {});
    };
    char name[64];
    std::snprintf(name, sizeof name, "breath-pacer (8 keys, %.0f kHz)", rate / 1000.0f);
    report_cost(name, 20.0f, rate, work);
    const double share = cpu_share(20.0f, work);
    std::printf("%s CPU time: %.2f%% of real time, %.1f us per 128-frame block\n", name, 100.0 * share,
                share * 128.0 / rate * 1.0e6);
    if (rate == 48000.0f) EXPECT(share < 0.05, "eight keys cost under 5 % of real time at 48 kHz (CPU time, native)");
  }
}
