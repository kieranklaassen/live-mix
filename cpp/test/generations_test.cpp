// Native harness for Generations (cpp/devices/generations). After the
// conformance pass it asserts what makes it a loop that is recorded again
// through a room: a pass takes exactly Length and is scaled by Keep, the
// level is held while the colour goes to the room's tones, those tones sit
// where Room puts them at every sample rate, and nothing clicks, runs away
// or depends on the block size.

#include "../devices/generations/generations.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Generations;
namespace p = livemix::generations;

static Generations device;
static Generations other;

static const float kRate = 48000.0f;

// The room's k-th tone at a Room setting (generations.h: room_hz and kModeRatio).
static double mode_hz(double room, int k) {
  return Generations::kSmallRoomHz *
         std::pow(Generations::kLargeRoomHz / Generations::kSmallRoomHz, room) *
         Generations::kModeRatio[k];
}

// The loop alone: one room for both sides, no noise, no loss of highs.
static void bare(Generations& d, float rate, float length, float keep) {
  d.init(rate);
  d.set_param(p::kLength, length);
  d.set_param(p::kKeep, keep);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kHiss, 0.0f);
  d.set_param(p::kDamping, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// `burst` seconds of noise, then silence up to `total`.
static std::vector<float> noise_once(float burst, float total, float rate, float gain, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> out = noise(burst, rate, gain);
  out.resize(static_cast<size_t>(total * rate), 0.0f);
  return out;
}

// Sines at `hz` from `from` for `seconds` with 20 ms ends, added to `x`.
static void add_sines(std::vector<float>& x, const std::vector<double>& hz, double from, double seconds,
                      double gain, double rate) {
  const size_t at = static_cast<size_t>(from * rate);
  const size_t n = static_cast<size_t>(seconds * rate);
  for (size_t i = 0; i < n && at + i < x.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    const double env = std::min(1.0, std::min(t, seconds - t) / 0.02);
    double v = 0.0;
    for (double f : hz) v += std::sin(2.0 * kPi * f * t);
    x[at + i] += static_cast<float>(gain * env * v);
  }
}

static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// How far the room's tones stand over the sound between them, in dB, in [from, to).
static double tones_over_between(const std::vector<float>& x, double room, double rate, size_t from,
                                 size_t to) {
  double on = 0.0, off = 0.0;
  for (int k = 0; k < Generations::kModes; ++k) on += tone_level(x, mode_hz(room, k), rate, from, to);
  for (int k = 0; k + 1 < Generations::kModes; ++k) {
    off += tone_level(x, std::sqrt(mode_hz(room, k) * mode_hz(room, k + 1)), rate, from, to);
  }
  return db(on / Generations::kModes) - db(off / (Generations::kModes - 1));
}

// Mean power of the sound at `count` frequencies from `low` to `high`, leaving out `skip` ± 5 %.
static double band_power(const std::vector<float>& x, double low, double high, int count, double skip,
                         double rate, size_t from, size_t to) {
  double sum = 0.0;
  int used = 0;
  for (int i = 0; i < count; ++i) {
    const double hz = low + (high - low) * (i + 0.5) / count;
    if (std::fabs(hz - skip) < 0.05 * skip) continue;
    const double level = tone_level(x, hz, rate, from, to);
    sum += level * level;
    ++used;
  }
  return sum / used;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// A phrase, a silence, a phrase, with knobs moved inside the silence, in
// blocks of `block` (0: ragged). Everything after the silence comes back.
static Stereo across_silence(Generations& d, float silence_seconds, int block) {
  d.init(kRate);
  d.set_param(p::kLength, 0.5f);
  d.set_param(p::kKeep, 0.2f);
  d.set_param(p::kMix, 0.7f);
  std::vector<float> phrase = noise_once(0.2f, 0.25f, kRate, 0.4f, 0xA5A5u);
  std::vector<float> all = phrase;
  const size_t gap = static_cast<size_t>(silence_seconds * kRate);
  all.resize(all.size() + gap, 0.0f);
  const size_t second = all.size();
  std::vector<float> again = noise_once(0.3f, 1.8f, kRate, 0.4f, 0x5A5Au);
  all.insert(all.end(), again.begin(), again.end());
  // The knobs move 5 ms before the second phrase.
  const size_t moved = second - 240;
  Stereo out;
  out.left.resize(all.size());
  out.right.resize(all.size());
  const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  size_t done = 0;
  int which = 0;
  bool turned = false;
  while (done < all.size()) {
    size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(ragged[which++ % 8]);
    frames = std::min(frames, all.size() - done);
    // A knob is turned between two blocks: the block before ends on the same sample in every render.
    if (!turned && done < moved) frames = std::min(frames, moved - done);
    if (!turned && done == moved) {
      d.set_param(p::kRoom, 0.9f);
      d.set_param(p::kResonance, 0.8f);
      d.set_param(p::kKeep, 0.6f);
      d.set_param(p::kLength, 0.7f);
      d.set_param(p::kWidth, 1.0f);
      d.set_param(p::kHiss, 0.8f);
      d.set_param(p::kDamping, 0.6f);
      d.set_param(p::kMix, 1.0f);
      turned = true;
    }
    for (size_t i = 0; i < frames; ++i) {
      d.in_left()[i] = all[done + i];
      d.in_right()[i] = all[done + i];
    }
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  Stereo after;
  after.left.assign(out.left.begin() + second, out.left.end());
  after.right.assign(out.right.begin() + second, out.right.end());
  return after;
}

int main() {
  Conformance spec;
  spec.name = "generations";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 110.0f;
  spec.max_peak = 2.5f;
  check_effect(device, spec, kRate);

  // How long the default patch really rings (keeps tail_seconds honest).
  {
    device.init(kRate);
    rng_state() = 0x1234567u;
    run(device, noise(1.0f, kRate, 0.5f));
    Stereo tail = render(device, 200.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("generations: default patch silent %.1f s after the input stops (%.1f dB after 8 s)\n",
                seconds, db(rms(tail.left, 7 * 48000, 9 * 48000)));
    EXPECT(seconds > 40.0 && seconds < 110.0, "the default tail ends within tail_seconds, not instantly");
  }

  // With no room in it the loop is a copy: a click comes back exactly Length
  // later, and again, scaled by Keep.
  for (float length : {0.5f, 1.25f}) {
    bare(device, kRate, length, 0.5f);
    device.set_param(p::kResonance, 0.0f);
    const size_t n = static_cast<size_t>(length * kRate);
    Stereo out = run(device, impulse(3.6f * length, kRate, 0.4f));
    const size_t first = peak_index(out.left, n / 2, n + n / 2);
    const size_t second = peak_index(out.left, n + n / 2, 2 * n + n / 2);
    const size_t third = peak_index(out.left, 2 * n + n / 2, 3 * n + n / 2);
    EXPECT(first == n, "the first pass returns exactly Length later");
    EXPECT(second == 2 * n && third == 3 * n, "and again exactly every Length");
    EXPECT_NEAR(std::fabs(out.left[first]), 0.4, 0.006, "the first pass is at the level it was played");
    EXPECT_NEAR(std::fabs(out.left[second]) / std::fabs(out.left[first]), 0.5, 0.005,
                "each pass is scaled by Keep");
    EXPECT_NEAR(std::fabs(out.left[third]) / std::fabs(out.left[second]), 0.5, 0.005, "pass after pass");
    EXPECT(peak(out.left, 0, n - 1) == 0.0, "nothing sounds before the first pass");
  }

  // Keep sets the level of each pass, through the room too: the room takes
  // energy from a wide sound and the level hold gives it back.
  for (float keep : {0.5f, 0.8f}) {
    bare(device, kRate, 1.0f, keep);
    device.set_param(p::kResonance, 0.7f);
    std::vector<float> in = noise_once(0.6f, 9.0f, kRate, 0.3f, 0xC0FFEEu);
    Stereo out = run(device, in);
    const double played = rms(in, 0, 48000);
    const double first = rms(out.left, 48000, 96000);
    EXPECT_NEAR(db(first / played), 0.0, 0.5, "the first pass comes back as loud as it was played");
    double worst = 0.0;
    for (size_t pass = 1; pass < 8; ++pass) {
      const double step = db(rms(out.left, (pass + 1) * 48000, (pass + 2) * 48000) /
                             rms(out.left, pass * 48000, (pass + 1) * 48000));
      worst = std::max(worst, std::fabs(step - db(keep)));
    }
    std::printf("generations: Keep %.1f, a pass is within %.3f dB of %.2f dB under the one before\n",
                keep, worst, db(keep));
    EXPECT(worst < 0.3, "each pass is Keep of the one before, whatever the room took");
  }

  // The idea itself: noise played once comes back with its energy gathered at
  // the room's tones, more so on every pass, and the level does not move.
  {
    bare(device, kRate, 1.0f, 1.0f);
    std::vector<float> in = noise_once(0.8f, 76.0f, kRate, 0.3f, 0xC0FFEEu);
    Stereo out = run(device, in);
    const double room = p::kParamDefault[p::kRoom];
    const double gathered1 = tones_over_between(out.left, room, kRate, 48000, 96000);
    const double gathered4 = tones_over_between(out.left, room, kRate, 4 * 48000, 5 * 48000);
    const double gathered16 = tones_over_between(out.left, room, kRate, 16 * 48000, 17 * 48000);
    std::printf("generations: the room's tones stand %.1f, %.1f, %.1f dB over what is between them "
                "after 1, 4 and 16 passes\n",
                gathered1, gathered4, gathered16);
    EXPECT(gathered1 > 2.0 && gathered1 < 12.0, "one pass prints the room lightly");
    EXPECT(gathered4 > gathered1 + 8.0, "four passes print it deeper");
    EXPECT(gathered16 > gathered4 + 20.0, "sixteen passes leave little but the room's tones");

    // Keep at the top: the level holds for more than a minute and never builds.
    const double first = rms(out.left, 48000, 96000);
    double lowest = 1.0e9, highest = 0.0, late_low = 1.0e9, late_high = 0.0;
    for (size_t pass = 1; pass <= 75; ++pass) {
      const double level = rms(out.left, pass * 48000, (pass + 1) * 48000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      if (pass >= 20) {
        late_low = std::min(late_low, level);
        late_high = std::max(late_high, level);
      }
    }
    std::printf("generations: Keep 1 over 75 passes: %.2f to %.2f dB against the first, "
                "%.3f dB apart from pass 20 on\n",
                db(lowest / first), db(highest / first), db(late_high / late_low));
    EXPECT(db(lowest / first) > -1.0 && db(highest / first) < 1.0,
           "Keep 1: the level holds within 1 dB for more than a minute");
    EXPECT(db(late_high / late_low) < 0.2, "and it does not creep: no pass is louder than the ones before");
    EXPECT(peak(out.left) < 1.0, "nor does a peak build");
  }

  // The same for notes that lie between the room's tones: the level holds
  // while the notes give way to the room.
  {
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.8f);
    device.set_param(p::kHiss, 0.15f);
    std::vector<float> in(static_cast<size_t>(41 * kRate), 0.0f);
    const double notes[4] = {220.0, 277.18, 329.63, 440.0};
    for (size_t i = 0; i < 38400; ++i) {
      const double env = std::min(1.0, i / 480.0) * std::exp(-static_cast<double>(i) / 20000.0);
      for (double hz : notes) in[i] += static_cast<float>(0.12 * env * std::sin(2.0 * kPi * hz * i / kRate));
    }
    Stereo out = run(device, in);
    const double first = rms(out.left, 48000, 96000);
    double lowest = 1.0e9, highest = 0.0;
    for (size_t pass = 1; pass <= 39; ++pass) {
      const double level = rms(out.left, pass * 48000, (pass + 1) * 48000);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    double notes_first = 0.0, notes_late = 0.0;
    for (double hz : notes) {
      notes_first += tone_level(out.left, hz, kRate, 48000, 96000);
      notes_late += tone_level(out.left, hz, kRate, 30 * 48000, 31 * 48000);
    }
    std::printf("generations: a chord between the tones: level %.2f to %.2f dB over 39 passes, "
                "its notes %.1f dB down by pass 30\n",
                db(lowest / first), db(highest / first), db(notes_late / notes_first));
    EXPECT(db(lowest / first) > -1.0 && db(highest / first) < 1.0,
           "a chord that the room does not ring on keeps its level too");
    EXPECT(db(notes_late / notes_first) < -30.0, "while its notes dissolve");
  }

  // The room passes each of its eight tones at 1 (the gains are trimmed for
  // the skirts they stand on), so none of them wins: eight sines on the tones
  // are as level with each other after sixteen passes as when they were played.
  // The loop is long so the low tones, which the room holds back the longest,
  // do not run into their own next pass; the measure is a plain correlation
  // over the whole pass, so where in the pass a tone has got to does not count.
  for (float resonance : {0.35f, 0.8f}) {
    bare(device, kRate, 4.0f, 1.0f);
    device.set_param(p::kResonance, resonance);
    const double low = Generations::kSmallRoomHz *
                       std::pow(static_cast<double>(Generations::kLargeRoomHz) / Generations::kSmallRoomHz, 0.5);
    std::vector<float> in(static_cast<size_t>(72 * kRate), 0.0f);
    for (size_t i = 0; i < 38400; ++i) {
      const double env = 0.5 - 0.5 * std::cos(2.0 * kPi * i / 38400.0);
      for (int k = 0; k < Generations::kModes; ++k) {
        in[i] += static_cast<float>(0.05 * env *
                                    std::sin(2.0 * kPi * low * Generations::kModeRatio[k] * i / kRate));
      }
    }
    Stereo out = run(device, in);
    const auto plain_tone = [&](double hz, size_t from, size_t to) {
      double re = 0.0, im = 0.0;
      for (size_t i = from; i < to; ++i) {
        const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
        re += out.left[i] * std::cos(phase);
        im -= out.left[i] * std::sin(phase);
      }
      return std::sqrt(re * re + im * im);
    };
    double least = 1.0e9, most = -1.0e9;
    for (int k = 0; k < Generations::kModes; ++k) {
      const double hz = low * Generations::kModeRatio[k];
      const double moved = db(plain_tone(hz, 68 * 48000, 72 * 48000) / plain_tone(hz, 4 * 48000, 8 * 48000));
      least = std::min(least, moved);
      most = std::max(most, moved);
    }
    std::printf("generations: Resonance %.2f, eight sines on the tones are %.2f to %.2f dB from where "
                "they began after 16 passes\n",
                resonance, least, most);
    EXPECT(most - least < 0.8 && least > -0.8 && most < 0.8,
           "the room passes each of its tones at 1: after 16 passes none has won");
  }

  // The tones are where Room puts them, at every sample rate.
  {
    double worst = 0.0;
    auto strongest = [&](float rate, float room, int k) {
      bare(device, rate, 0.5f, 1.0f);
      device.set_param(p::kRoom, room);
      device.set_param(p::kResonance, 0.8f);
      Stereo out = run(device, noise_once(0.45f, 14.0f, rate, 0.3f, 0xBADC0DEu));
      const double hz = mode_hz(room, k);
      const size_t from = static_cast<size_t>(11.0f * rate);
      const double found = dominant_frequency(out.left, rate, hz * 0.93, hz * 1.07, from, out.size());
      worst = std::max(worst, std::fabs(found / hz - 1.0));
      return found;
    };
    for (float room : {0.0f, 0.5f, 1.0f}) {
      for (int k : {0, 3, 7}) strongest(kRate, room, k);
    }
    // Narrow noise has its strongest point anywhere in the tone's width, and
    // the skirts of its neighbours move a tone by up to 8 cents.
    EXPECT(worst < 0.012, "the tones follow Room: each is within 1.2 % of where the room has it");
    std::printf("generations: tones within %.2f %% of their place at 48 kHz", 100.0 * worst);
    worst = 0.0;
    const double at44 = strongest(44100.0f, 0.3f, 6);
    const double at96 = strongest(96000.0f, 0.3f, 6);
    const double at48 = strongest(48000.0f, 0.3f, 6);
    std::printf(", and tone 7 of Room 0.3 (%.1f Hz) at %.1f, %.1f and %.1f Hz at 44.1, 48 and 96 kHz\n",
                mode_hz(0.3, 6), at44, at48, at96);
    EXPECT(worst < 0.012, "and are at the same frequencies at 44.1, 48 and 96 kHz");
  }

  // Resonance is how hard the room prints: none at 0, and at the top the
  // tones are there within four passes.
  {
    std::vector<float> in = noise_once(0.8f, 9.0f, kRate, 0.3f, 0xC0FFEEu);
    const double room = p::kParamDefault[p::kRoom];
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.0f);
    Stereo flat = run(device, in);
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 1.0f);
    Stereo sharp = run(device, in);
    const double none = tones_over_between(flat.left, room, kRate, 8 * 48000, 9 * 48000) -
                        tones_over_between(flat.left, room, kRate, 48000, 96000);
    const double full = tones_over_between(sharp.left, room, kRate, 4 * 48000, 5 * 48000);
    EXPECT(std::fabs(none) < 0.5, "Resonance 0: eight passes leave the colour as it was");
    EXPECT(full > 40.0, "Resonance 1: four passes leave the room's tones");
  }

  // With no room, no damping and no hiss a pass is a copy: only the 12 Hz
  // low cut stands in the loop.
  {
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.0f);
    std::vector<float> in(static_cast<size_t>(9.0f * kRate), 0.0f);
    for (size_t i = 0; i < 38400; ++i) {
      const double env = std::min(1.0, std::min(i, 38400 - i) / 480.0);
      in[i] = static_cast<float>(env * (0.15 * std::sin(2.0 * kPi * 233.0 * i / kRate) +
                                        0.1 * std::sin(2.0 * kPi * 1741.0 * i / kRate)));
    }
    Stereo out = run(device, in);
    // Eight passes are eight goes through the low cut, which turns the phase
    // of a low note a few degrees each time; the comparison allows for it.
    std::vector<float> through(in.begin(), in.begin() + 48000);
    for (int pass = 0; pass < 8; ++pass) {
      livemix::kit::DcBlocker low_cut;
      low_cut.set_cutoff(Generations::kLowCutHz, kRate);
      for (float& x : through) x = low_cut.process(x);
    }
    double copy = 0.0;
    for (size_t i = 0; i < 48000; ++i) {
      copy = std::max(copy, std::fabs(static_cast<double>(out.left[8 * 48000 + i]) - through[i]));
    }
    std::printf("generations: with no room in it the eighth pass is within %.5f of what was played\n", copy);
    EXPECT(copy < 0.002, "Resonance 0 with no damping and no hiss: a pass is a copy but for the low cut");
  }

  // Damping takes highs on every pass; at 0 it takes none.
  {
    std::vector<float> in = noise_once(0.8f, 9.0f, kRate, 0.3f, 0xC0FFEEu);
    double share[2][3];
    int row = 0;
    for (float damping : {0.0f, 0.7f}) {
      bare(device, kRate, 1.0f, 1.0f);
      device.set_param(p::kResonance, 0.0f);
      device.set_param(p::kDamping, damping);
      Stereo out = run(device, in);
      int column = 0;
      for (size_t pass : {1u, 4u, 8u}) {
        share[row][column++] = energy_above(out.left, 3000.0, kRate, pass * 48000, pass * 48000 + 38400);
      }
      ++row;
    }
    EXPECT(std::fabs(share[0][2] / share[0][0] - 1.0) < 0.01, "Damping 0: a pass does not change the tone");
    EXPECT(share[1][1] < 0.6 * share[1][0] && share[1][2] < 0.6 * share[1][1],
           "Damping: the highs fall pass after pass");
  }

  // Hiss is noise added on every pass at a share of the loop's level, and as
  // dense in the audible band at 96 kHz as at 48 kHz.
  {
    double added[2][2];
    double at_rate[2];
    int column = 0;
    for (float rate : {48000.0f, 96000.0f}) {
      const size_t loop = static_cast<size_t>(rate);
      for (int row = 0; row < 2; ++row) {
        bare(device, rate, 1.0f, 1.0f);
        device.set_param(p::kResonance, 0.0f);
        device.set_param(p::kHiss, row == 0 ? 0.0f : 1.0f);
        std::vector<float> in = sine(1000.0f, 0.9f, rate, 0.3f);
        in.resize(static_cast<size_t>(6.0f * rate), 0.0f);
        Stereo out = run(device, in);
        if (rate == 48000.0f) {
          added[row][0] = band_power(out.left, 2000.0, 9000.0, 200, 1000.0, rate, loop, 2 * loop);
          added[row][1] = band_power(out.left, 2000.0, 9000.0, 200, 1000.0, rate, 4 * loop, 5 * loop);
        }
        if (row == 1) at_rate[column] = band_power(out.left, 2000.0, 9000.0, 400, 1000.0, rate, loop, 2 * loop);
      }
      ++column;
    }
    std::printf("generations: Hiss 1 adds noise at %.1f dB a tone bin on pass 1 and %.1f dB on pass 4 "
                "(Hiss 0: %.1f dB); 96 kHz against 48 kHz %.2f dB\n",
                0.5 * db(added[1][0]), 0.5 * db(added[1][1]), 0.5 * db(added[0][1]),
                0.5 * db(at_rate[1] / at_rate[0]));
    EXPECT(added[0][1] < 1.0e-3 * added[1][0], "Hiss 0 adds nothing");
    EXPECT(added[1][1] > 2.5 * added[1][0], "Hiss is added again on every pass");
    EXPECT(std::fabs(0.5 * db(at_rate[1] / at_rate[0])) < 1.0,
           "the hiss is as dense in the band at 96 kHz as at 48 kHz");
  }

  // Width: at 0 both sides share one room and a centred sound stays centred;
  // turned up, the two rooms pull it apart pass after pass.
  {
    std::vector<float> in = noise_once(0.8f, 14.0f, kRate, 0.3f, 0xC0FFEEu);
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.7f);
    device.set_param(p::kHiss, 0.5f);
    Stereo one = run(device, in);
    EXPECT(worst_difference(one, Stereo{one.right, one.left}) == 0.0,
           "Width 0: a centred sound stays centred, hiss and all");
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.7f);
    device.set_param(p::kWidth, 1.0f);
    Stereo two = run(device, in);
    const double early = correlation(two.left, two.right, 48000, 96000);
    const double late = correlation(two.left, two.right, 12 * 48000, 13 * 48000);
    std::printf("generations: Width 1, left against right %.2f on pass 1 and %.2f on pass 12\n", early, late);
    EXPECT(early > 0.9, "Width 1: the first pass is still nearly centred");
    EXPECT(std::fabs(late) < 0.6, "and twelve passes on the sides have drifted apart");
  }

  // Listen Off: the loop goes on and nothing new reaches it.
  {
    std::vector<float> first = noise_once(0.4f, 1.5f, kRate, 0.3f, 0xC0FFEEu);
    std::vector<float> later = sine(700.0f, 4.0f, kRate, 0.4f);
    Stereo heard[3];
    for (int which = 0; which < 3; ++which) {
      bare(device, kRate, 1.0f, 0.8f);
      run(device, first);
      device.set_param(p::kListen, which == 0 ? 0.0f : 1.0f);
      render(device, 0.5f, kRate);  // the gate closes over 20 ms
      heard[which] = which == 2 ? render(device, 4.0f, kRate) : run(device, later);
    }
    EXPECT(worst_difference(heard[1], heard[2]) == 0.0,
           "Listen Off: the loop is the same whether or not anything is played");
    EXPECT(rms(heard[1].left, 48000, 96000) > 0.02, "and it keeps turning");
    EXPECT_NEAR(db(rms(heard[1].left, 96000, 144000) / rms(heard[1].left, 48000, 96000)), db(0.8), 0.3,
                "and fading by Keep");
    EXPECT(tone_level(heard[0].left, 700.0, kRate, 96000, 192000) > 0.1,
           "Listen On: the same playing is recorded");
  }

  // Mix 0 is the dry signal, sample for sample.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x77u;
    std::vector<float> in = noise(4.0f, kRate, 0.5f);
    Stereo out = run(device, in);
    bool same = true;
    for (size_t i = 0; i < in.size(); ++i) same = same && out.left[i] == in[i] && out.right[i] == in[i];
    EXPECT(same, "Mix 0 passes the input through, sample for sample");
  }

  // Played into without end at Keep 1, the loop settles at its ceiling.
  {
    bare(device, kRate, 0.5f, 1.0f);
    Stereo out = run(device, sine(110.0f, 60.0f, kRate, 1.0f));
    EXPECT(finite(out.left) && peak(out.left) < 1.5, "a full-scale tone into a held loop stays bounded");
    EXPECT_NEAR(db(rms(out.left, 30 * 48000, 31 * 48000) / Generations::kCeiling), 0.0, 1.0,
                "and settles at the ceiling");
    EXPECT_NEAR(db(rms(out.left, 59 * 48000) / rms(out.left, 30 * 48000, 31 * 48000)), 0.0, 0.1,
                "where it stays");
    bare(device, kRate, 0.5f, 1.0f);
    device.set_param(p::kResonance, 1.0f);
    device.set_param(p::kHiss, 1.0f);
    rng_state() = 0x99u;
    Stereo loud = run(device, noise(60.0f, kRate, 1.0f));
    EXPECT(finite(loud.left) && peak(loud.left) < 2.5, "full-scale noise into it at full Resonance too");
    EXPECT(rms(loud.left, 59 * 48000) < 0.4, "at the same ceiling");
  }

  // Playing into a loop that sounds does not turn up what is already on it. A
  // tone of the room is put on the loop; then notes between the room's tones,
  // which the room takes much from, are played over it for ten passes. The
  // tone goes on falling by Keep a pass, as it does when nothing is played.
  {
    const double room = p::kParamDefault[p::kRoom];
    const double tone = mode_hz(room, 2);
    std::vector<double> between;
    for (int k = 0; k + 1 < Generations::kModes; ++k) {
      between.push_back(std::sqrt(mode_hz(room, k) * mode_hz(room, k + 1)));
    }
    const size_t loop = 48000;
    std::vector<float> first(13 * loop, 0.0f), playing(13 * loop, 0.0f);
    add_sines(first, {tone}, 0.0, 0.9, 0.15, kRate);
    // Each burst starts a little off the loop's time, so the passes do not stand in step.
    for (int pass = 1; pass < 12; ++pass) {
      add_sines(playing, between, pass + 0.02 + 0.0137 * ((pass * 5) % 7), 0.85, 0.03, kRate);
    }
    std::vector<float> both = first;
    for (size_t i = 0; i < both.size(); ++i) both[i] += playing[i];
    double fall[3];
    double at2[3], at10[3];
    int which = 0;
    for (const std::vector<float>* in : {&first, &both, &playing}) {
      bare(device, kRate, 1.0f, 0.8f);
      device.set_param(p::kResonance, 0.6f);
      Stereo out = run(device, *in);
      at2[which] = tone_level(out.left, tone, kRate, 2 * loop, 3 * loop);
      at10[which] = tone_level(out.left, tone, kRate, 10 * loop, 11 * loop);
      ++which;
    }
    // What the playing alone leaves at the tone is taken off (as powers).
    fall[0] = db(at10[0] / at2[0]);
    fall[1] = db(std::sqrt(std::max(1.0e-20, at10[1] * at10[1] - at10[2] * at10[2])) /
                 std::sqrt(std::max(1.0e-20, at2[1] * at2[1] - at2[2] * at2[2])));
    std::printf("generations: a tone on the loop falls %.2f dB over eight passes alone and %.2f dB with "
                "notes played over it (Keep says %.2f)\n",
                fall[0], fall[1], 8.0 * db(0.8));
    EXPECT_NEAR(fall[0], 8.0 * db(0.8), 1.0, "a tone left alone falls by Keep a pass");
    EXPECT_NEAR(fall[1], 8.0 * db(0.8), 2.0, "and as fast while new notes are played over it");
  }

  // A note comes back at the level it was played whether the loop was empty
  // or full of the room's tones: its level is its own, not the loop's.
  {
    const double room = p::kParamDefault[p::kRoom];
    const double note = std::sqrt(mode_hz(room, 2) * mode_hz(room, 3));
    const size_t loop = 24000;
    double back[2][2];
    for (int busy = 0; busy < 2; ++busy) {
      std::vector<float> in(static_cast<size_t>(24 * kRate), 0.0f);
      if (busy) {
        // Twenty seconds of the room's own tones, a burst a loop.
        std::vector<double> tones;
        for (int k : {0, 1, 4, 5, 6}) tones.push_back(mode_hz(room, k));
        for (int n = 0; n < 40; ++n) add_sines(in, tones, 0.5 * n + 0.03, 0.4, 0.05, kRate);
      }
      add_sines(in, {note}, 20.5, 0.3, 0.2, kRate);
      bare(device, kRate, 0.5f, 0.9f);
      device.set_param(p::kResonance, 0.85f);
      Stereo out = run(device, in);
      const size_t at = static_cast<size_t>(20.5 * kRate);
      const double played = tone_level(in, note, kRate, at, at + 14400);
      back[busy][0] = db(tone_level(out.left, note, kRate, at + loop, at + loop + 14400) / played);
      back[busy][1] = db(tone_level(out.left, note, kRate, at + 2 * loop, at + 2 * loop + 14400) / played);
    }
    std::printf("generations: a note between the tones returns at %.2f and %.2f dB into an empty loop, "
                "%.2f and %.2f dB into a loop full of the room's tones\n",
                back[0][0], back[0][1], back[1][0], back[1][1]);
    EXPECT_NEAR(back[0][0], 0.0, 1.0, "into an empty loop a note first returns as loud as it was played");
    EXPECT_NEAR(back[1][0], back[0][0], 1.0, "and as loud into a loop that is full of the room's tones");
    EXPECT_NEAR(back[1][1], back[0][1], 1.5, "on its second return too");
  }

  // Played into without end at Keep 1, a quiet tone is held near its own
  // level: the loop does not climb to the loudest it can hold.
  {
    bare(device, kRate, 0.5f, 1.0f);
    std::vector<float> in = sine(110.0f, 60.0f, kRate, 0.03f);
    Stereo out = run(device, in);
    const double played = rms(in, 30 * 48000, 31 * 48000);
    const double mid = rms(out.left, 30 * 48000, 31 * 48000);
    const double late = rms(out.left, 59 * 48000);
    std::printf("generations: a tone held at %.1f dBFS into a loop at Keep 1 comes back %.2f dB over it "
                "after 30 s and %.2f dB after 60 s\n",
                db(played), db(mid / played), db(late / played));
    EXPECT(db(late / played) < 6.5,
           "a quiet tone played without end is held within 6 dB of its own level");
    EXPECT(db(late / played) > -1.0, "and is not turned down under it");
    EXPECT_NEAR(db(late / mid), 0.0, 0.2, "where it stays");
  }
  // Nothing clicks when the knobs most likely to be moved are moved while
  // the loop sounds: each against the same render with nothing moved.
  {
    struct Move {
      const char* what;
      int param;
      float to;
    };
    const Move moves[] = {
        {"Room", p::kRoom, 0.85f},         {"Resonance", p::kResonance, 1.0f},
        {"Keep", p::kKeep, 0.2f},          {"Length", p::kLength, 0.83f},
        {"Listen Off", p::kListen, 1.0f},  {"Damping", p::kDamping, 1.0f},
        {"Width", p::kWidth, 1.0f},        {"Mix", p::kMix, 0.2f},
    };
    std::vector<float> tone = sine(150.0f, 6.0f, kRate, 0.3f);
    Stereo still, moved;
    for (const Move& move : moves) {
      for (int which = 0; which < 2; ++which) {
        device.init(kRate);
        device.set_param(p::kLength, 0.5f);
        device.set_param(p::kKeep, 0.9f);
        device.set_param(p::kHiss, 0.0f);
        device.set_param(p::kMix, 0.6f);
        run(device, tone);
        if (which == 1) device.set_param(move.param, move.to);
        (which == 0 ? still : moved) = run(device, tone);
      }
      const double before = std::max(max_step(still.left), max_step(still.right));
      const double after = std::max(max_step(moved.left), max_step(moved.right));
      std::printf("generations: largest step with %s moved %.4f, with nothing moved %.4f\n", move.what,
                  after, before);
      char label[96];
      std::snprintf(label, sizeof label, "moving %s while the loop sounds does not click", move.what);
      EXPECT(after < 1.5 * before + 0.002, label);
      // Listen On again, for the choice's other way.
      if (move.param == p::kListen) {
        device.set_param(p::kListen, 0.0f);
        Stereo back = run(device, tone);
        EXPECT(max_step(back.left) < 1.5 * before + 0.002, "nor does Listen On again");
      }
    }
  }

  // After Length has moved, a pass takes the new Length, to the sample.
  {
    bare(device, kRate, 1.0f, 0.5f);
    device.set_param(p::kResonance, 0.0f);
    run(device, sine(220.0f, 0.5f, kRate, 0.2f));
    device.set_param(p::kLength, 1.5f);
    render(device, 30.0f, kRate);
    // The old loop has faded under the floor and the device sleeps; a move
    // while it is awake is the case that matters, so wake it and move again.
    run(device, sine(220.0f, 0.5f, kRate, 0.2f));
    device.set_param(p::kLength, 0.75f);
    render(device, 6.0f, kRate);
    Stereo out = run(device, impulse(3.0f, kRate, 0.4f));
    // The loop still holds a trace of the tone; the click stands well over it.
    EXPECT(peak_index(out.left, 18000, 54000) == 36000, "after a Length change a pass takes the new Length");
    EXPECT(peak_index(out.left, 54000, 90000) == 72000, "exactly");
  }

  // Input that is not a sound: the device comes back when sound does.
  {
    for (float bad : {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f}) {
      device.init(kRate);
      device.set_param(p::kKeep, 0.5f);
      device.set_param(p::kLength, 0.5f);
      other.init(kRate);
      other.set_param(p::kKeep, 0.5f);
      other.set_param(p::kLength, 0.5f);
      rng_state() = 0x4242u;
      std::vector<float> good = noise(1.0f, kRate, 0.3f);
      run(device, good);
      run(other, good);
      std::vector<float> rubbish(4800, bad);
      run(device, rubbish);
      run(other, silence(0.1f, kRate));
      rng_state() = 0x4343u;
      std::vector<float> again = noise(20.0f, kRate, 0.3f);
      Stereo out = run(device, again);
      Stereo clean = run(other, again);
      EXPECT(finite(out.left) && finite(out.right), "after bad input the output is numbers again at once");
      EXPECT(peak(out.left) < 2.5, "and bounded");
      // What the bad input left on the loop fades; the room's tones it fed
      // stay for as long as the playing feeds them, so the two are compared
      // by level here, and sample for sample once both loops have emptied.
      EXPECT_NEAR(db(rms(out.left, 10 * 48000) / rms(clean.left, 10 * 48000)), 0.0, 0.5,
                  "and at the level of a device that never had bad input");
      render(device, 30.0f, kRate);
      render(other, 30.0f, kRate);
      EXPECT(device.meter(0) == -1.0f && other.meter(0) == -1.0f, "its loop empties as the other's does");
      rng_state() = 0x4444u;
      std::vector<float> last = noise(3.0f, kRate, 0.3f);
      EXPECT(worst_difference(run(device, last), run(other, last)) == 0.0,
             "and after that it is the same device, sample for sample: nothing is stuck");
    }
  }

  // A held offset is not sound: the loop's low cut leaves only its two edges,
  // and they come back with their own energy (as the room's tones, a few
  // passes on), not with the energy of the whole offset put into them.
  for (float offset : {0.8f, 1.0e30f}) {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> in(static_cast<size_t>(8.0f * kRate), 0.0f);
    for (size_t i = 0; i < 24000; ++i) in[i] = offset;
    Stereo out = run(device, in);
    std::printf("generations: half a second held at %g comes back with a peak of %.2f\n", offset,
                peak(out.left));
    EXPECT(finite(out.left) && peak(out.left) < (offset > 1.0f ? 1.9 : 1.6),
           "a held offset comes back as its two edges, not as a burst");
  }

  // The device sleeps once the loop has faded, and wakes with an empty loop.
  {
    bare(device, kRate, 1.0f, 0.3f);
    run(device, noise_once(0.2f, 0.25f, kRate, 0.5f, 0x1111u));
    Stereo fade = render(device, 20.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep once the loop has faded");
    EXPECT(device.meter(0) == -1.0f && device.meter(1) == 0.0f && device.meter(2) == 1.0f,
           "its readings are at rest then");
    size_t last = 0;
    for (size_t i = 0; i < fade.size(); ++i) {
      if (fade.left[i] != 0.0f) last = i;
    }
    EXPECT(last > 5 * 48000 && last < 14 * 48000, "it sleeps after the last pass that can be heard, not before");
    device.set_param(p::kResonance, 0.0f);
    Stereo woken = run(device, impulse(2.5f, kRate, 0.4f));
    EXPECT(peak(woken.left, 0, 47999) == 0.0, "it wakes with an empty loop");
    EXPECT(peak_index(woken.left, 24000, 72000) == 48000, "and loops again");

    bare(device, kRate, 12.0f, 1.0f);
    run(device, noise_once(0.3f, 1.0f, kRate, 0.3f, 0x2222u));
    Stereo quiet = render(device, 10.5f, kRate);
    Stereo back = render(device, 2.0f, kRate);
    EXPECT(peak(quiet.left) < 1.0e-6, "a 12 s loop is silent between the passes of a short sound");
    EXPECT(rms(back.left, 24000, 38400) > 0.05, "and has not gone to sleep: the sound returns after 12 s");
    render(device, 120.0f, kRate);
    Stereo much_later = render(device, 13.0f, kRate);
    EXPECT(rms(much_later.left) > 0.01, "a held loop is still turning minutes later");
  }

  // The same sound at every block size, also when the second phrase arrives
  // around the moment the loop empties, with knobs moved in the silence.
  {
    // When the loop empties: the last sample that is not exact zero, in blocks of one.
    device.init(kRate);
    device.set_param(p::kLength, 0.5f);
    device.set_param(p::kKeep, 0.2f);
    device.set_param(p::kMix, 0.7f);
    run(device, noise_once(0.2f, 0.25f, kRate, 0.4f, 0xA5A5u), 1);
    Stereo tail = render(device, 12.0f, kRate, 1);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const float empties = static_cast<float>(last) / kRate;
    std::printf("generations: a short loop at Keep 0.2 is empty %.3f s after the phrase\n", empties);
    EXPECT(empties > 1.0f && empties < 11.0f, "the short loop empties inside the test");
    double worst = 0.0;
    int runs = 0;
    for (float silence_seconds = empties - 0.12f; silence_seconds < empties + 0.14f; silence_seconds += 0.02f) {
      Stereo reference = across_silence(device, silence_seconds, 128);
      for (int block : {1, 2048, 0}) {
        worst = std::max(worst, worst_difference(across_silence(device, silence_seconds, block), reference));
        ++runs;
      }
    }
    for (float silence_seconds : {0.3f, empties + 2.0f}) {
      Stereo reference = across_silence(device, silence_seconds, 128);
      for (int block : {1, 2048, 0}) {
        worst = std::max(worst, worst_difference(across_silence(device, silence_seconds, block), reference));
        ++runs;
      }
    }
    std::printf("generations: %d renders across a silence at block sizes 1, 2048 and ragged differ from "
                "128 by at most %g\n",
                runs, worst);
    EXPECT(worst < 1.0e-5, "the output does not depend on the block size across a silence");
  }

  // The readings for the display: the record head's place in the loop, the
  // level the loop holds, and the gain of the level hold. Reading them
  // changes nothing.
  {
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.8f);
    std::vector<float> in = noise_once(0.8f, 30.0f, kRate, 0.3f, 0xC0FFEEu);
    in[0] = 0.25f;  // the loop starts on the first sample
    EXPECT(device.meter(0) == -1.0f, "before anything is played the loop has no place to be");
    Stereo plain = run(device, in);
    bare(device, kRate, 1.0f, 1.0f);
    device.set_param(p::kResonance, 0.8f);
    Stereo read;
    read.left.resize(in.size());
    read.right.resize(in.size());
    double turn_error = 0.0;
    float hold_first = 0.0f, hold_late = 0.0f, level_late = 0.0f;
    for (size_t done = 0; done < in.size(); done += 128) {
      for (int i = 0; i < 128; ++i) {
        device.in_left()[i] = in[done + i];
        device.in_right()[i] = in[done + i];
      }
      device.process(128);
      for (int i = 0; i < 128; ++i) {
        read.left[done + i] = device.out_left()[i];
        read.right[done + i] = device.out_right()[i];
      }
      const size_t now = done + 128;
      turn_error = std::max(turn_error,
                            std::fabs(device.meter(0) - static_cast<double>(now % 48000) / 48000.0));
      if (now == 48000 + 48000) hold_first = device.meter(2);
      if (now == 28 * 48000) {
        hold_late = device.meter(2);
        level_late = device.meter(1);
      }
    }
    EXPECT(worst_difference(plain, read) == 0.0, "reading the meters does not change the sound");
    EXPECT(turn_error < 1.0e-6, "the first reading is the record head's place in the loop");
    const double held = rms(plain.left, 27 * 48000, 28 * 48000);
    std::printf("generations: the level hold gives %.1f dB on pass 1 and %.2f dB on pass 27; "
                "level reading %.4f, measured %.4f\n",
                db(hold_first), db(hold_late), level_late, held);
    EXPECT(db(hold_first) > 6.0, "the level hold gives back what the room took from a wide sound");
    EXPECT(std::fabs(db(hold_late)) < 1.0, "and little is left to give once the sound is the room's tones");
    EXPECT_NEAR(db(level_late / held), 0.0, 0.5, "the level reading is the level of the loop");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("generations", 10.0f, kRate, [&] { run(device, input); });
  // The worst there is: Room, Resonance and Width turned without rest, so
  // the room is tuned again on every control tick, and Length crossfading.
  device.init(kRate);
  report_cost("generations with the room and Length moving", 10.0f, kRate, [&] {
    Stereo out;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      const float swing = static_cast<float>((done / 128) % 200) / 200.0f;
      device.set_param(p::kRoom, swing);
      device.set_param(p::kResonance, 1.0f - swing);
      device.set_param(p::kWidth, swing);
      device.set_param(p::kLength, 0.5f + swing);
      for (int i = 0; i < 128; ++i) {
        device.in_left()[i] = input[done + i];
        device.in_right()[i] = input[done + i];
      }
      device.process(128);
    }
  });

  return finish("generations");
}
