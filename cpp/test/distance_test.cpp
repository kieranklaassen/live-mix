// Native harness for Distance (cpp/devices/distance). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it distance: the level, the highs, the
// travel time and the width each follow the place of the source as the
// model in distance.h says, the room takes over from the direct sound, a move
// bends the pitch by its speed and settles, and the walk runs free.

#include "../devices/distance/distance.h"
#include "support/test_kit.h"

#include <functional>

using namespace testkit;
using livemix::Distance;
namespace p = livemix::distance;

static Distance device;
static Distance other;

static const float kRate = 48000.0f;

// Pink noise, a side each: nearer to music than white noise is.
static Stereo pink(float seconds, float gain, uint32_t seed = 11) {
  Stereo out;
  out.left.resize(static_cast<size_t>(seconds * kRate));
  out.right.resize(out.left.size());
  livemix::kit::Noise a, b;
  a.seed(seed);
  b.seed(seed * 7 + 3);
  for (size_t i = 0; i < out.left.size(); ++i) {
    out.left[i] = gain * 5.0f * a.pink();
    out.right[i] = gain * 5.0f * b.pink();
  }
  return out;
}

// A source that stands still at `place`, with nothing of the model left out.
static void still(Distance& d, float place, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDistance, place);
  d.set_param(p::kWander, 0.0f);
}

static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

// The largest difference between two renders, both sides.
static double apart(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// How much of what an event changes is there after 8 samples, against what
// it has changed after 20 ms: near 0 for a change that comes in gradually,
// 1 for a jump. The same passage is rendered twice from init(), once with
// the event, at eight moments a little apart, and the worst is kept.
static double suddenness(const std::function<void(Distance&)>& setup,
                         const std::function<void(Distance&)>& event) {
  double worst = 0.0;
  for (int moment = 0; moment < 8; ++moment) {
    const size_t lead = static_cast<size_t>(0.6f * kRate) + static_cast<size_t>(moment) * 57;
    const size_t after = static_cast<size_t>(0.02f * kRate);
    Stereo input = pink(1.0f, 0.1f, 5);
    for (size_t i = 0; i < input.size(); ++i) {
      const float tone = 0.3f * static_cast<float>(std::sin(2.0 * kPi * 330.0 * i / kRate));
      input.left[i] += tone;
      input.right[i] += tone;
    }
    Stereo rendered[2];
    for (int with = 0; with < 2; ++with) {
      setup(device);
      Stereo head, tail;
      head.left.assign(input.left.begin(), input.left.begin() + lead);
      head.right.assign(input.right.begin(), input.right.begin() + lead);
      tail.left.assign(input.left.begin() + lead, input.left.begin() + lead + after);
      tail.right.assign(input.right.begin() + lead, input.right.begin() + lead + after);
      // One sample at a time, so the event falls on the moment and not on a block.
      run(device, head.left, head.right, 1);
      if (with) event(device);
      rendered[with] = run(device, tail.left, tail.right, 1);
    }
    const double first = apart(rendered[0], rendered[1], 0, 8);
    const double whole = apart(rendered[0], rendered[1]);
    if (whole > 1.0e-7) worst = std::max(worst, first / whole);
  }
  return worst;
}

// The place of a source `seconds` after Distance was set from one place to
// another: the two poles of the glide, stepped as the device steps them.
static double glided(double from, double to, double seconds) {
  const double rate = kRate / Distance::kPeriod;
  const double coeff = std::exp(-1.0 / (Distance::kGlideSeconds * rate));
  double first = from, value = from;
  const int ticks = static_cast<int>(seconds * rate + 0.5);
  for (int n = 0; n < ticks; ++n) {
    first = to + (first - to) * coeff;
    value = first + (value - first) * coeff;
  }
  return value;
}

// The mean pitch of a tone between the first and the last upward zero
// crossing in [from, to): cycles over time, whatever the level does. The
// two times are handed back in seconds.
static double mean_pitch(const std::vector<float>& x, size_t from, size_t to, double* began,
                         double* ended) {
  double first = -1.0, last = -1.0;
  int crossings = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]);
      if (first < 0.0) first = at;
      last = at;
      ++crossings;
    }
  }
  *began = first / kRate;
  *ended = last / kRate;
  return crossings > 1 ? (crossings - 1) * kRate / (last - first) : 0.0;
}

static double travel_seconds(double place) {
  return (std::pow(2.0, Distance::kOctaves * place) - 1.0) / Distance::kSoundSpeed;
}

int main() {
  Conformance spec;
  spec.name = "distance";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Distance 0 with Wander 0 is the input, sample for sample, whatever the
  // other knobs say and whatever the block size.
  {
    Stereo in = pink(1.0f, 0.3f);
    // Also hot samples, and one too small to be anything but itself.
    in.left[100] = 3.5f;
    in.right[200] = -7.25f;
    in.left[300] = 1.0e-20f;
    for (int block : {1, 128, 2048}) {
      still(device, 0.0f);
      device.set_param(p::kRoom, 0.9f);
      device.set_param(p::kAir, 1.0f);
      device.set_param(p::kDecay, 6.0f);
      device.set_param(p::kLevel, 1.0f);
      device.set_param(p::kWidth, 1.0f);
      Stereo out = run(device, in.left, in.right, block);
      EXPECT(out.left == in.left && out.right == in.right,
             "Distance 0 with Wander 0 passes the input through bit for bit");
    }
  }

  // The direct sound: 6 dB down and (d - 1) / 343 s later for each doubling.
  {
    double last_level = 2.0;
    long last_arrival = -1;
    for (int step = 0; step <= 5; ++step) {
      const float place = 0.2f * static_cast<float>(step);
      still(device, place);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kLevel, 0.0f);
      Stereo out = run(device, impulse(0.5f, kRate, 1.0f));
      const double metres = std::pow(2.0, step);
      const long expected = std::lround((metres - 1.0) / Distance::kSoundSpeed * kRate);
      const size_t arrival = peak_index(out.left, 0, static_cast<size_t>(expected) + 8);
      char label[120];
      std::snprintf(label, sizeof label, "at %g m the direct sound arrives after (d - 1) / 343 s", metres);
      EXPECT(std::labs(static_cast<long>(arrival) - expected) <= 1, label);
      std::snprintf(label, sizeof label, "at %g m the direct sound is 1 / d as strong", metres);
      EXPECT_NEAR(std::fabs(out.left[arrival]), 1.0 / metres, 0.01 / metres, label);
      EXPECT(std::fabs(out.left[arrival]) < last_level, "the direct sound falls with Distance");
      EXPECT(static_cast<long>(arrival) > last_arrival, "the direct sound is later with Distance");
      last_level = std::fabs(out.left[arrival]);
      last_arrival = static_cast<long>(arrival);
    }
    // Doppler scales the travel time; at 0 there is none.
    still(device, 1.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kDoppler, 0.5f);
    Stereo half = run(device, impulse(0.3f, kRate, 1.0f));
    const long whole = std::lround(31.0 / Distance::kSoundSpeed * kRate);
    EXPECT(std::labs(static_cast<long>(peak_index(half.left, 0, 3000)) - whole / 2) <= 1,
           "Doppler at a half halves the travel time");
    still(device, 1.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kDoppler, 0.0f);
    Stereo none = run(device, impulse(0.3f, kRate, 1.0f));
    EXPECT(std::fabs(none.left[0]) > 0.02 && peak_index(none.left, 0, 20) == 0,
           "Doppler at 0 leaves no travel time");
  }

  // Loudness falls with Distance at Level 0, to what the model says the
  // room leaves of it, and holds within 2 dB at Level 1.
  {
    Stereo in = pink(8.0f, 0.1f);
    const size_t from = static_cast<size_t>(4.0f * kRate);
    const double level_in = 0.5 * (rms(in.left, from) + rms(in.right, from));
    double last = 1.0;
    for (int step = 0; step <= 5; ++step) {
      const float place = 0.2f * static_cast<float>(step);
      still(device, place);
      device.set_param(p::kLevel, 0.0f);
      Stereo out = run(device, in.left, in.right);
      const double level = 0.5 * (rms(out.left, from) + rms(out.right, from)) / level_in;
      char label[120];
      if (step > 0 && step < 3) {
        std::snprintf(label, sizeof label, "Level 0: quieter at Distance %.1f than nearer (%.1f dB)",
                      place, db(level));
        EXPECT(level < last * 0.9, label);
      }
      // Past the room's own distance the loudness is the room's, which holds.
      std::snprintf(label, sizeof label, "Level 0: never louder farther away (Distance %.1f)", place);
      EXPECT(level < last * 1.03, label);
      std::snprintf(label, sizeof label, "Level 0 at Distance %.1f is what the model leaves", place);
      const float air = p::kParamDefault[p::kAir];
      EXPECT_NEAR(db(level), db(1.0 / Distance::hold_gain(place, 0.5f, air)), 1.5, label);
      last = level;

      still(device, place);
      device.set_param(p::kLevel, 1.0f);
      Stereo held = run(device, in.left, in.right);
      const double kept = 0.5 * (rms(held.left, from) + rms(held.right, from)) / level_in;
      std::snprintf(label, sizeof label, "Level 1 holds the loudness at Distance %.1f", place);
      EXPECT_NEAR(db(kept), 0.0, 2.0, label);
    }
  }

  // The air: the direct sound alone (the first milliseconds of an impulse,
  // before the floor answers) is 3 dB down at the corner the model gives,
  // and the corner comes down as the source recedes.
  {
    double last_share = 1.0;
    for (float place : {0.3f, 0.6f, 0.9f}) {
      still(device, place);
      device.set_param(p::kAir, 1.0f);
      device.set_param(p::kLevel, 0.0f);
      Stereo out = run(device, impulse(0.4f, kRate, 1.0f));
      const double metres = Distance::metres(place);
      const size_t arrival =
          static_cast<size_t>(std::lround((metres - 1.0) / Distance::kSoundSpeed * kRate));
      // Up to just before the floor's reflection.
      const double floor_lag = (std::sqrt(metres * metres + 9.0) - metres) / Distance::kSoundSpeed;
      const size_t until = arrival + static_cast<size_t>(floor_lag * kRate) - 2;
      const double corner = Distance::air_corner(1.0f, static_cast<float>(metres));
      double flat = 0.0, re = 0.0, im = 0.0;
      for (size_t i = arrival; i < until; ++i) {
        const double angle = 2.0 * kPi * corner * static_cast<double>(i - arrival) / kRate;
        flat += out.left[i];
        re += out.left[i] * std::cos(angle);
        im -= out.left[i] * std::sin(angle);
      }
      char label[120];
      std::snprintf(label, sizeof label, "at %.1f m the air is 3 dB down at %.0f Hz", metres, corner);
      EXPECT_NEAR(db(std::sqrt(re * re + im * im) / std::fabs(flat)), -3.0, 0.5, label);
      EXPECT_NEAR(std::fabs(flat), 1.0 / metres, 0.03 / metres, "the air takes nothing from the lows");

      // And the whole sound has less above 3 kHz the farther it is.
      still(device, place);
      device.set_param(p::kAir, 1.0f);
      Stereo in = pink(3.0f, 0.1f);
      Stereo wet = run(device, in.left, in.right);
      const double share = energy_above(wet.left, 3000.0, kRate, 48000);
      EXPECT(share < last_share * 0.8, "the highs fall with Distance");
      last_share = share;
    }
    // Air 0 is clear air: the direct sound is a single sample.
    still(device, 1.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kLevel, 0.0f);
    Stereo clear = run(device, impulse(0.2f, kRate, 1.0f));
    const size_t arrival = static_cast<size_t>(std::lround(31.0 / Distance::kSoundSpeed * kRate));
    EXPECT(std::fabs(clear.left[arrival + 1]) < 1.0e-6 && std::fabs(clear.left[arrival]) > 0.03,
           "Air 0 takes nothing at any distance");
  }

  // Width: a sound on the left alone keeps its side by atan(1 / d^Width)
  // against what it is at 1 m, read off the direct sound's first sample.
  {
    std::vector<float> left = impulse(0.3f, kRate, 1.0f);
    std::vector<float> nothing = silence(0.3f, kRate);
    for (float width : {0.0f, 0.5f, 1.0f}) {
      double last = 1.0001;
      for (float place : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
        still(device, place);
        device.set_param(p::kAir, 0.0f);
        device.set_param(p::kLevel, 0.0f);
        device.set_param(p::kWidth, width);
        Stereo out = run(device, left, nothing);
        const size_t arrival = static_cast<size_t>(
            std::lround((Distance::metres(place) - 1.0) / Distance::kSoundSpeed * kRate));
        const double l = out.left[arrival], r = out.right[arrival];
        const double side = (l - r) / (l + r);
        char label[120];
        std::snprintf(label, sizeof label, "Width %.1f at Distance %.2f keeps atan(1 / d^Width) of the sides",
                      width, place);
        EXPECT_NEAR(side, Distance::side_gain(place, width), 0.005, label);
        if (width > 0.0f && place > 0.0f) EXPECT(side < last - 0.02, "the sides narrow with Distance");
        if (width == 0.0f) EXPECT_NEAR(side, 1.0, 1.0e-6, "Width 0 never narrows");
        last = side;
      }
    }
    // The geometry itself: at 4 m with Width 1 a source 1 m to each side is seen under atan(1/4).
    EXPECT_NEAR(Distance::side_gain(0.4f, 1.0f), std::atan(0.25) * 4.0 / kPi, 1.0e-4,
                "the sides follow the angle the source is seen under");
  }

  // The room takes over: the share of an impulse's energy that is not the
  // direct sound grows with Distance, from none.
  {
    double last = -1.0;
    for (float place : {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f}) {
      still(device, place);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kLevel, 0.0f);
      Stereo out = run(device, impulse(4.0f, kRate, 1.0f));
      const size_t arrival = static_cast<size_t>(
          std::lround((Distance::metres(place) - 1.0) / Distance::kSoundSpeed * kRate));
      double direct = 0.0, rest = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        const double e = static_cast<double>(out.left[i]) * out.left[i];
        if (i == arrival) direct += e; else rest += e;
      }
      const double share = rest / (direct + rest);
      char label[120];
      std::snprintf(label, sizeof label, "more of the room at Distance %.1f (%.3f of the energy)", place, share);
      EXPECT(share > last, label);
      if (place == 0.0f) EXPECT(share == 0.0, "at Distance 0 there is no room at all");
      last = share;
    }
    EXPECT(last > 0.9, "far away nearly all of it is the room");
  }

  // The first reflections stand where their images are: the right wall's
  // comes from the right, as late as its path is longer and as strong as
  // 1 / path, and it closes up on the direct sound as the source recedes.
  {
    double last_lag = 1.0;
    for (float place : {0.2f, 0.5f, 0.8f}) {
      still(device, place);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kLevel, 0.0f);
      device.set_param(p::kWidth, 1.0f);
      Stereo out = run(device, impulse(0.5f, kRate, 1.0f));
      const double d = Distance::metres(place);
      float across, up, keeps;
      Distance::image(3, 0.5f, &across, &up, &keeps);
      const double path = std::sqrt(d * d + across * across);
      const double lag = (path - d) / Distance::kSoundSpeed;
      // At rest the travel time is a whole number of samples; the lag is not.
      const double at = static_cast<double>(std::lround((d - 1.0) / Distance::kSoundSpeed * kRate)) +
                        lag * kRate;
      const size_t index = static_cast<size_t>(at);
      // Read between two samples: the two share it.
      const double right = out.right[index + 0] + out.right[index + 1];
      const double left = out.left[index + 0] + out.left[index + 1];
      const double gain = (1.0 - 1.0 / d) * keeps / path;
      const double bearing = across / path;
      char label[120];
      std::snprintf(label, sizeof label, "at %.1f m the right wall answers %.1f ms after the direct sound", d, lag * 1000.0);
      EXPECT_NEAR(right, gain * std::sqrt(0.5 * (1.0 + bearing)), 0.12 * gain, label);
      EXPECT_NEAR(left, gain * std::sqrt(0.5 * (1.0 - bearing)), 0.12 * gain,
                  "and is as much quieter on the left as its image is off to the right");
      EXPECT(right > left, "the right wall's reflection comes from the right");
      EXPECT(lag < last_lag, "a reflection closes up on the direct sound as the source recedes");
      last_lag = lag;
    }
    // Room moves the walls: the same reflection is later in a larger room.
    float across_small, across_large, up, keeps;
    Distance::image(3, 0.0f, &across_small, &up, &keeps);
    Distance::image(3, 1.0f, &across_large, &up, &keeps);
    still(device, 0.4f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kRoom, 1.0f);
    Stereo large = run(device, impulse(0.5f, kRate, 1.0f));
    const double d = Distance::metres(0.4f);
    const double lag = (std::sqrt(d * d + across_large * across_large) - d) / Distance::kSoundSpeed;
    const size_t at = static_cast<size_t>(
        static_cast<double>(std::lround((d - 1.0) / Distance::kSoundSpeed * kRate)) + lag * kRate);
    EXPECT(peak(large.right, at, at + 2) > 20.0 * peak(large.right, at - 200, at - 20),
           "in the largest room the right wall answers later, where its image is");
    EXPECT(across_large > 9.0f * across_small, "Room sets the width of the room");
  }

  // Decay is how long the room rings.
  {
    double measured[2];
    int n = 0;
    for (float decay : {0.6f, 3.0f}) {
      still(device, 0.8f);
      device.set_param(p::kAir, 0.0f);
      device.set_param(p::kDecay, decay);
      rng_state() = 0xC0FFEEu;
      std::vector<float> burst = noise(0.1f, kRate, 0.5f);
      burst.resize(static_cast<size_t>((decay * 1.5f + 1.0f) * kRate), 0.0f);
      Stereo out = run(device, burst);
      measured[n] = rt60(out.left, kRate, 0.4, 0.1, -80.0);
      char label[120];
      std::snprintf(label, sizeof label, "Decay %.1f s rings for about that long (%.2f s)", decay, measured[n]);
      EXPECT(measured[n] > 0.7 * decay && measured[n] < 1.3 * decay, label);
      ++n;
    }
    EXPECT(measured[1] > 3.0 * measured[0], "a longer Decay rings longer");
  }

  // Moving Distance bends a tone by the speed of the move and settles: the
  // pitch over a tenth of a second is one less the rate the travel time grew
  // at, which the glide's two poles give.
  {
    // A high tone: the bend is a share of the pitch, what the room adds to
    // the reading is not.
    const float hz = 4000.0f;
    for (float doppler : {1.0f, 0.5f}) {
      for (int away = 0; away < 2; ++away) {
        const float from = away ? 0.0f : 0.3f;
        const float to = away ? 0.3f : 0.0f;
        still(device, from);
        device.set_param(p::kAir, 0.0f);
        device.set_param(p::kLevel, 1.0f);
        // The largest room is the quietest and its walls the farthest: the
        // tone that is measured is the direct sound.
        device.set_param(p::kRoom, 1.0f);
        device.set_param(p::kDecay, 0.2f);
        device.set_param(p::kDoppler, doppler);
        std::vector<float> tone = sine(hz, 4.0f, kRate, 0.25f);
        std::vector<float> first(tone.begin(), tone.begin() + 48000);
        std::vector<float> rest(tone.begin() + 48000, tone.end());
        run(device, first);
        device.set_param(p::kDistance, to);
        Stereo out = run(device, rest);
        double t1, t2;
        const double heard = mean_pitch(out.left, static_cast<size_t>(0.10f * kRate),
                                        static_cast<size_t>(0.20f * kRate), &t1, &t2);
        const double grew =
            doppler * (travel_seconds(glided(from, to, t2)) - travel_seconds(glided(from, to, t1)));
        const double expected = hz * (1.0 - grew / (t2 - t1));
        char label[140];
        std::snprintf(label, sizeof label, "moving %s at Doppler %.1f bends 4 kHz to %.1f Hz",
                      away ? "away" : "nearer", doppler, expected);
        EXPECT_NEAR(heard, expected, 2.5, label);
        EXPECT(away ? heard < hz - 20.0 * doppler : heard > hz + 20.0 * doppler,
               "the pitch falls as the source leaves and rises as it comes");
        const double settled = dominant_frequency(out.left, kRate, 3900.0, 4100.0, 96000, 144000);
        EXPECT_NEAR(settled, hz, 0.05, "the bend settles once the source has arrived");
        // The device says the same of itself.
        EXPECT(device.meter(0) == static_cast<float>(to),
               "the source arrives: the place the device reports is exactly where Distance put it");
        EXPECT_NEAR(device.meter(1), 1.0, 1.0e-6, "at rest the device reports no bend");
      }
    }
    // While it moves, the reported bend is the one heard.
    still(device, 0.0f);
    device.set_param(p::kAir, 0.0f);
    run(device, sine(hz, 0.5f, kRate, 0.25f));
    device.set_param(p::kDistance, 0.3f);
    run(device, sine(hz, 0.15f, kRate, 0.25f));
    const double rate = (travel_seconds(glided(0.0, 0.3, 0.151)) - travel_seconds(glided(0.0, 0.3, 0.149))) / 0.002;
    EXPECT_NEAR(device.meter(1), 1.0 - rate, 2.0e-4, "the bend the device reports is one less the growth of the travel time");
    EXPECT_NEAR(device.meter(0), glided(0.0, 0.3, 0.15), 2.0e-3, "the place the device reports glides with it");
  }

  // Wander walks the source: a steady tone swells and sinks, the place the
  // device reports stays between the ends of the walk and covers most of it,
  // and Rate sets how fast.
  {
    device.init(kRate);
    device.set_param(p::kDistance, 0.5f);
    device.set_param(p::kWander, 0.6f);
    device.set_param(p::kRate, 0.5f);
    device.set_param(p::kLevel, 0.0f);
    float lowest = 1.0f, highest = 0.0f;
    double quietest = 1.0e9, loudest = 0.0;
    std::vector<float> tone = sine(440.0f, 0.1f, kRate, 0.25f);
    for (int n = 0; n < 300; ++n) {
      Stereo out = run(device, tone);
      lowest = std::min(lowest, device.meter(0));
      highest = std::max(highest, device.meter(0));
      const double level = rms(out.left);
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    EXPECT(lowest >= 0.2f - 1.0e-4f && highest <= 0.8f + 1.0e-4f,
           "the walk stays between Distance less and plus half of Wander");
    EXPECT(lowest < 0.27f && highest > 0.73f, "the walk covers nearly all of its span");
    EXPECT(loudest > 2.0 * quietest, "a walking source swells and sinks");

    // Wander 0 holds it still.
    still(device, 0.5f);
    double first = 0.0, lastly = 0.0;
    for (int n = 0; n < 50; ++n) {
      Stereo out = run(device, tone);
      if (n == 20) first = rms(out.left);
      if (n == 49) lastly = rms(out.left);
    }
    EXPECT_NEAR(lastly / first, 1.0, 0.01, "without Wander the source stands still");

    // Near an end the span is kept inside the picture: Distance 0.1 with
    // Wander 0.6 walks from 0 to 0.4.
    device.init(kRate);
    device.set_param(p::kDistance, 0.1f);
    device.set_param(p::kWander, 0.6f);
    device.set_param(p::kRate, 1.0f);
    lowest = 1.0f, highest = 0.0f;
    for (int n = 0; n < 300; ++n) {
      run(device, tone);
      lowest = std::min(lowest, device.meter(0));
      highest = std::max(highest, device.meter(0));
    }
    EXPECT(lowest >= 0.0f && lowest < 0.03f && highest > 0.37f && highest <= 0.4f + 1.0e-4f,
           "a walk that would leave the near end is kept inside");
  }

  // The walk runs free: where the source is after three seconds does not
  // depend on whether there was sound, on the block size, or on anything in
  // the sound.
  {
    float places[4];
    int n = 0;
    for (int kind = 0; kind < 4; ++kind) {
      device.init(kRate);
      device.set_param(p::kWander, 1.0f);
      device.set_param(p::kRate, 0.7f);
      if (kind == 0) render(device, 3.0f, kRate);  // asleep throughout
      if (kind == 1) run(device, sine(220.0f, 3.0f, kRate, 0.5f));
      if (kind == 2) {
        rng_state() = 99u;
        run(device, noise(3.0f, kRate, 0.9f), 1);
      }
      if (kind == 3) {  // sound, a sleep, sound again
        run(device, noise(0.3f, kRate, 0.5f), 2048);
        render(device, 2.4f, kRate, 2048);
        run(device, noise(0.3f, kRate, 0.5f), 7);
      }
      places[n++] = device.meter(0);
    }
    EXPECT(std::fabs(places[1] - places[0]) < 1.0e-3f && std::fabs(places[2] - places[0]) < 1.0e-3f &&
               std::fabs(places[3] - places[0]) < 1.0e-3f,
           "the walk is where it would be, sound or no sound");
  }

  // The same output at block sizes 1, 128 and 2048 with the fastest, widest
  // walk, across a sleep, with knobs moved while it slept, and with the
  // sound coming back in the middle of a block.
  {
    Stereo passage;
    {
      Stereo burst = pink(0.4f, 0.2f, 3);
      const size_t gap = static_cast<size_t>(11.0f * kRate) + 777;
      passage.left = burst.left;
      passage.right = burst.right;
      passage.left.resize(burst.size() + gap, 0.0f);
      passage.right.resize(burst.size() + gap, 0.0f);
      Stereo again = pink(1.2f, 0.2f, 4);
      passage.left.insert(passage.left.end(), again.left.begin(), again.left.end());
      passage.right.insert(passage.right.end(), again.right.begin(), again.right.end());
    }
    const size_t moved_at = static_cast<size_t>(10.0f * kRate);
    Stereo rendered[3];
    int n = 0;
    for (int block : {1, 128, 2048}) {
      device.init(kRate);
      device.set_param(p::kDistance, 0.6f);
      device.set_param(p::kWander, 1.0f);
      device.set_param(p::kRate, 1.0f);
      device.set_param(p::kDecay, 0.5f);
      Stereo head, tail;
      head.left.assign(passage.left.begin(), passage.left.begin() + moved_at);
      head.right.assign(passage.right.begin(), passage.right.begin() + moved_at);
      tail.left.assign(passage.left.begin() + moved_at, passage.left.end());
      tail.right.assign(passage.right.begin() + moved_at, passage.right.end());
      Stereo first = run(device, head.left, head.right, block);
      EXPECT(peak(first.left, moved_at - 4096) == 0.0, "asleep before the knobs are moved");
      // Moved while asleep: they snap when the sound returns.
      device.set_param(p::kDistance, 0.3f);
      device.set_param(p::kRoom, 0.8f);
      device.set_param(p::kRate, 0.6f);
      device.set_param(p::kWidth, 1.0f);
      rendered[n++] = concat(first, run(device, tail.left, tail.right, block));
    }
    char label[160];
    const double a = apart(rendered[0], rendered[1]);
    const double b = apart(rendered[2], rendered[1]);
    std::snprintf(label, sizeof label,
                  "the same at block sizes 1, 128 and 2048 across a sleep (apart by %g and %g)", a, b);
    EXPECT(a < 1.0e-4 && b < 1.0e-4, label);
    const size_t back = passage.size() - static_cast<size_t>(1.2f * kRate);
    EXPECT(peak(rendered[1].left, back, back + 4800) > 0.01, "and it sounds again after the sleep");

    // Knobs moved while asleep snap: the first sound after the sleep is the
    // same as from a device that was set so from the start and is as old.
    other.init(kRate);
    other.set_param(p::kDistance, 0.3f);
    other.set_param(p::kWander, 1.0f);
    other.set_param(p::kRate, 1.0f);
    other.set_param(p::kDecay, 0.5f);
    other.set_param(p::kRoom, 0.8f);
    other.set_param(p::kWidth, 1.0f);
    render(other, static_cast<float>(moved_at) / kRate, kRate);
    other.set_param(p::kRate, 0.6f);
    Stereo tail;
    tail.left.assign(passage.left.begin() + moved_at, passage.left.end());
    tail.right.assign(passage.right.begin() + moved_at, passage.right.end());
    Stereo fresh = run(other, tail.left, tail.right);
    Stereo slept;
    slept.left.assign(rendered[1].left.begin() + moved_at, rendered[1].left.end());
    slept.right.assign(rendered[1].right.begin() + moved_at, rendered[1].right.end());
    std::snprintf(label, sizeof label, "knobs moved while asleep snap on waking (apart by %g)",
                  apart(fresh, slept));
    EXPECT(apart(fresh, slept) < 1.0e-4, label);
  }

  // The same again where it shows at once: no travel time, so the first
  // sample after the sleep is heard through whatever the gains are at that
  // moment, with the walk at its fastest, for sound that returns at several
  // places in a block. A device that woke on "now" and not on the clock's
  // own ticks would differ here.
  {
    double worst = 0.0;
    for (size_t gap : {528777u, 529001u, 530339u, 533210u, 536111u, 541013u}) {
      std::vector<float> passage(9600, 0.5f);
      passage.resize(9600 + gap, 0.0f);
      passage.resize(passage.size() + 4800, 0.9f);
      Stereo rendered[3];
      int n = 0;
      for (int block : {1, 128, 2048}) {
        device.init(kRate);
        device.set_param(p::kDistance, 0.5f);
        device.set_param(p::kWander, 1.0f);
        device.set_param(p::kRate, 1.0f);
        device.set_param(p::kDoppler, 0.0f);
        device.set_param(p::kAir, 0.0f);
        device.set_param(p::kLevel, 0.0f);
        device.set_param(p::kDecay, 0.3f);
        rendered[n++] = run(device, passage, block);
      }
      worst = std::max(worst, std::max(apart(rendered[0], rendered[1]), apart(rendered[2], rendered[1])));
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "waking in the middle of a block leaves every moving value where the clock has it (apart by %g)",
                  worst);
    EXPECT(worst < 1.0e-4, label);
  }

  // A gain on the move moves every sample: a steady level through a glide of
  // Distance is a slope, not a flight of steps one control period long.
  {
    still(device, 0.0f);
    device.set_param(p::kDoppler, 0.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kLevel, 0.0f);
    std::vector<float> steady(72000, 0.5f);
    std::vector<float> head(steady.begin(), steady.begin() + 24000);
    std::vector<float> tail(steady.begin() + 24000, steady.end());
    run(device, head);
    device.set_param(p::kDistance, 0.6f);
    Stereo out = run(device, tail);
    double span = 0.0;
    for (size_t i = 0; i + 64 < 24000; ++i) {
      span = std::max(span, std::fabs(static_cast<double>(out.left[i + 64]) - out.left[i]));
    }
    char label[140];
    std::snprintf(label, sizeof label,
                  "a gliding gain moves every sample (largest step %g, largest change over 64 samples %g)",
                  max_step(out.left, 0, 24000), span);
    EXPECT(span > 1.0e-3 && max_step(out.left, 0, 24000) < 0.1 * span, label);
  }

  // No knob clicks: what a jump across its range changes comes in
  // gradually, both ways.
  {
    struct Jump {
      int id;
      float from, to;
      const char* name;
    };
    const Jump jumps[] = {
        {p::kDistance, 0.1f, 0.9f, "Distance"}, {p::kRoom, 0.0f, 1.0f, "Room"},
        {p::kAir, 0.0f, 1.0f, "Air"},           {p::kWander, 0.0f, 1.0f, "Wander"},
        {p::kRate, 0.01f, 1.0f, "Rate"},        {p::kDoppler, 0.0f, 1.0f, "Doppler"},
        {p::kDecay, 0.2f, 8.0f, "Decay"},       {p::kLevel, 0.0f, 1.0f, "Level"},
        {p::kWidth, 0.0f, 1.0f, "Width"},
    };
    for (const Jump& jump : jumps) {
      for (int back = 0; back < 2; ++back) {
        const float from = back ? jump.to : jump.from;
        const float to = back ? jump.from : jump.to;
        const double sudden = suddenness(
            [&](Distance& d) {
              d.init(kRate);
              d.set_param(p::kDistance, 0.6f);
              d.set_param(p::kWander, 0.5f);
              d.set_param(p::kRate, 0.5f);
              d.set_param(jump.id, from);
            },
            [&](Distance& d) { d.set_param(jump.id, to); });
        char label[120];
        std::snprintf(label, sizeof label, "%s moved from %g to %g comes in gradually (%.3f)", jump.name,
                      from, to, sudden);
        EXPECT(sudden < 0.15, label);
      }
    }
    // And the coarser bound for the knob most likely to be moved while
    // sounding: a tone through a full sweep of Distance has no step larger
    // than the tone's own.
    still(device, 0.0f);
    std::vector<float> tone = sine(220.0f, 0.5f, kRate, 0.5f);
    run(device, tone);
    device.set_param(p::kDistance, 1.0f);
    Stereo out = run(device, sine(220.0f, 2.0f, kRate, 0.5f));
    // The steepest a 220 Hz tone as loud as the loudest moment can be.
    const double own = peak(out.left) * 2.0 * kPi * 220.0 / kRate;
    EXPECT(max_step(out.left) < 1.2 * own, "a sweep of Distance under a tone adds no step");
  }

  // Samples that are not numbers, infinite or absurd: the output stays
  // finite and bounded while they come, and when good input returns the
  // device is the device again, not stuck and not silent.
  {
    Stereo good = pink(1.0f, 0.2f, 9);
    for (float bad : {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f}) {
      still(device, 0.6f);
      device.set_param(p::kDecay, 8.0f);
      device.set_param(p::kLevel, 1.0f);
      std::vector<float> poison(4800, 0.1f);
      for (size_t i = 0; i < poison.size(); i += 7) poison[i] = bad;
      Stereo during = run(device, poison);
      EXPECT(finite(during.left) && finite(during.right) && peak(during.left) < 20.0,
             "bad samples in give finite, bounded samples out");
      render(device, 30.0f, kRate);  // let what they left ring out
      Stereo after = run(device, good.left, good.right);
      still(other, 0.6f);
      other.set_param(p::kDecay, 8.0f);
      other.set_param(p::kLevel, 1.0f);
      render(other, (4800.0f + 30.0f * kRate) / kRate, kRate);
      Stereo clean = run(other, good.left, good.right);
      EXPECT(finite(after.left) && finite(after.right), "finite again once good input returns");
      EXPECT(apart(after, clean) < 1.0e-4, "after bad samples the device is as it was");
    }
  }

  // Bounded at the worst: a full-scale tone held on a mode of a small room
  // that rings for eight seconds, far away, with the loudness held.
  {
    double worst = 0.0;
    for (float hz : {110.0f, 247.3f, 440.0f, 1000.0f, 3111.0f}) {
      still(device, 1.0f);
      device.set_param(p::kRoom, 0.0f);
      device.set_param(p::kDecay, 8.0f);
      device.set_param(p::kLevel, 1.0f);
      device.set_param(p::kAir, 0.0f);
      Stereo out = run(device, sine(hz, 12.0f, kRate, 1.0f));
      EXPECT(finite(out.left) && finite(out.right), "a held full-scale tone stays finite");
      worst = std::max(worst, std::max(peak(out.left), peak(out.right)));
    }
    char label[120];
    std::snprintf(label, sizeof label, "a held full-scale tone at the longest Decay stays under 2.1 (peak %.2f)", worst);
    EXPECT(worst < 2.1, label);
  }

  // The travel time is a time: the same at 96 kHz, where the lines are
  // twice as long in samples.
  {
    still(device, 1.0f, 96000.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kRoom, 1.0f);
    Stereo out = run(device, impulse(1.0f, 96000.0f, 1.0f));
    const long expected = std::lround(31.0 / Distance::kSoundSpeed * 96000.0);
    EXPECT(std::labs(static_cast<long>(peak_index(out.left, 0, static_cast<size_t>(expected) + 8)) - expected) <= 1,
           "at 96 kHz the farthest sound arrives after the same 90 ms");
    EXPECT(finite(out.left) && rms(out.left, 48000) > 1.0e-5, "and the largest room still answers");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 8.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, noise(0.5f, kRate, 0.5f));
    EXPECT(rms(woken.left, 2000) > 0.01, "wakes on new input");
  }

  // Cost: the defaults, and the worst (everything moving, the largest room).
  device.init(kRate);
  Stereo input = pink(10.0f, 0.1f, 21);
  report_cost("distance", 10.0f, kRate, [&] { run(device, input.left, input.right); });
  device.init(kRate);
  device.set_param(p::kDistance, 0.7f);
  device.set_param(p::kWander, 1.0f);
  device.set_param(p::kRate, 1.0f);
  device.set_param(p::kRoom, 1.0f);
  device.set_param(p::kDecay, 8.0f);
  device.set_param(p::kAir, 1.0f);
  device.set_param(p::kLevel, 1.0f);
  report_cost("distance (worst: widest fastest walk, largest room)", 10.0f, kRate,
              [&] { run(device, input.left, input.right); });

  return finish("distance");
}
