// Native harness for Radio (cpp/devices/radio). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a radio link.

#include "../devices/radio/radio.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Radio;
namespace p = livemix::radio;

static Radio device;

static const float kRate = 48000.0f;

// A steady link: no fading, static, neighbours or drift, line output.
static void clean(Radio& d, int band, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBand, static_cast<float>(band));
  d.set_param(p::kTuning, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kFading, 0.0f);
  d.set_param(p::kStatic, 0.0f);
  d.set_param(p::kInterference, 0.0f);
  d.set_param(p::kSpeaker, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static void set_all(Radio& d, const float* values) {
  for (int id = 0; id < p::kNumParams; ++id) d.set_param(id, values[id]);
}

// Level in dB of the `hz` component in consecutive windows.
static std::vector<double> tone_envelope(const std::vector<float>& x, double hz, float rate,
                                         float window_seconds) {
  std::vector<double> out;
  const size_t window = static_cast<size_t>(window_seconds * rate);
  for (size_t s = 0; s + window <= x.size(); s += window) {
    out.push_back(db(tone_level(x, hz, rate, s, s + window)));
  }
  return out;
}

// RMS in dB of what is left between `lo` and `hi` Hz in consecutive windows
// (eighth-order Butterworth each way).
static std::vector<double> band_envelope(const std::vector<float>& x, float lo, float hi, float rate,
                                         float window_seconds) {
  using livemix::radio_parts::Cascade;
  using livemix::radio_parts::kButter8;
  std::vector<double> out;
  const size_t window = static_cast<size_t>(window_seconds * rate);
  Cascade<4> high, low;
  high.reset();
  low.reset();
  high.set(lo, rate, kButter8);
  low.set(hi, rate, kButter8);
  double sum = 0.0;
  for (size_t i = 0; i < x.size(); ++i) {
    const double v = low.lowpass(high.highpass(x[i]));
    sum += v * v;
    if ((i + 1) % window == 0) {
      out.push_back(db(std::sqrt(sum / static_cast<double>(window))));
      sum = 0.0;
    }
  }
  return out;
}

static double pearson(const std::vector<double>& a, const std::vector<double>& b) {
  const size_t n = std::min(a.size(), b.size());
  double ma = 0.0, mb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    ma += a[i];
    mb += b[i];
  }
  ma /= static_cast<double>(n);
  mb /= static_cast<double>(n);
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) * (a[i] - ma);
    sbb += (b[i] - mb) * (b[i] - mb);
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

static double range(const std::vector<double>& v, size_t from = 0) {
  double lo = 1.0e9, hi = -1.0e9;
  for (size_t i = from; i < v.size(); ++i) {
    lo = std::min(lo, v[i]);
    hi = std::max(hi, v[i]);
  }
  return hi - lo;
}

static double average(const std::vector<double>& v, size_t from = 0) {
  double sum = 0.0;
  for (size_t i = from; i < v.size(); ++i) sum += v[i];
  return sum / static_cast<double>(v.size() - from);
}

// Times the series crosses its own mean: two per cycle of a slow movement.
static int crossings(const std::vector<double>& v) {
  const double m = average(v);
  int count = 0;
  for (size_t i = 1; i < v.size(); ++i) {
    if ((v[i - 1] < m) != (v[i] < m)) ++count;
  }
  return count;
}

int main() {
  Conformance spec;
  spec.name = "radio";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  // 1. Band limits. Shortwave at the default bandwidth: everything under
  // 150 Hz and over 6 kHz is at least 20 dB under the middle of the band. The
  // wide setting passes 4 kHz, the narrow one does not.
  {
    auto level_at = [&](float hz, float bandwidth) {
      clean(device, Radio::kShortwave);
      device.set_param(p::kBandwidth, bandwidth);
      Stereo out = run(device, sine(hz, 1.5f, kRate, 0.25f));
      return db(tone_level(out.left, hz, kRate, 24000, 72000));
    };
    const double mid = level_at(1000.0f, 0.5f);
    double worst_low = -200.0, worst_high = -200.0;
    for (float hz : {40.0f, 80.0f, 120.0f, 150.0f}) worst_low = std::max(worst_low, level_at(hz, 0.5f) - mid);
    for (float hz : {6000.0f, 8000.0f, 12000.0f}) worst_high = std::max(worst_high, level_at(hz, 0.5f) - mid);
    const double wide = level_at(4000.0f, 1.0f) - level_at(1000.0f, 1.0f);
    const double narrow = level_at(4000.0f, 0.0f) - level_at(1000.0f, 0.0f);
    std::printf("band limits: <=150 Hz %.1f dB, >=6 kHz %.1f dB re 1 kHz; 4 kHz wide %.1f dB, narrow %.1f dB\n",
                worst_low, worst_high, wide, narrow);
    EXPECT(worst_low < -20.0, "Shortwave: 150 Hz and below are at least 20 dB down");
    EXPECT(worst_high < -20.0, "Shortwave: 6 kHz and above are at least 20 dB down");
    EXPECT(wide > -3.0, "the wide setting passes 4 kHz");
    EXPECT(narrow < -30.0, "the narrow setting cuts 4 kHz");
    EXPECT_NEAR(mid, db(0.25), 2.5, "a steady link is near unity gain in the passband");
  }

  // 2. Sideband: Tuning at +0.5 moves every frequency up by 200 Hz, so a
  // 1000 + 2000 Hz pair is no longer an octave, and nothing is left where the
  // other sideband would be.
  {
    clean(device, Radio::kSideband);
    device.set_param(p::kTuning, 0.5f);
    std::vector<float> pair = sine(1000.0f, 3.0f, kRate, 0.2f);
    const std::vector<float> upper = sine(2000.0f, 3.0f, kRate, 0.2f);
    for (size_t i = 0; i < pair.size(); ++i) pair[i] += upper[i];
    Stereo out = run(device, pair);
    const size_t from = 48000, to = 3 * 48000;
    const double low = dominant_frequency(out.left, kRate, 500.0, 1500.0, from, to);
    const double high = dominant_frequency(out.left, kRate, 1501.0, 2600.0, from, to);
    const double image = db(tone_level(out.left, 800.0, kRate, from, to)) -
                         db(tone_level(out.left, 1200.0, kRate, from, to));
    std::printf("sideband +0.5: 1000 -> %.2f Hz, 2000 -> %.2f Hz, ratio %.4f, other sideband %.1f dB\n", low,
                high, high / low, image);
    EXPECT_NEAR(low, 1200.0, 1.0, "Sideband: 1000 Hz comes out 200 Hz higher");
    EXPECT_NEAR(high, 2200.0, 1.0, "Sideband: 2000 Hz comes out 200 Hz higher");
    EXPECT(std::fabs(high / low - 2.0) > 0.1, "Sideband: the octave is broken");
    EXPECT(image < -60.0, "Sideband: the other sideband is rejected");

    clean(device, Radio::kSideband);
    device.set_param(p::kTuning, -1.0f);
    out = run(device, sine(1000.0f, 2.0f, kRate, 0.2f));
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 300.0, 1500.0, from, 2 * 48000), 600.0, 1.0,
                "Sideband: Tuning at -1 is 400 Hz down");
  }

  // 3. With a carrier, off-tune whistles at the offset: no input is at that
  // frequency, the pitch follows the dial, and it is gone when tuned in.
  {
    auto whistle = [&](float tuning, double hz, double* programme) {
      clean(device, Radio::kShortwave);
      device.set_param(p::kTuning, tuning);
      Stereo out = run(device, sine(300.0f, 2.5f, kRate, 0.25f));
      *programme = db(tone_level(out.left, 300.0, kRate, 48000, 120000));
      return db(tone_level(out.left, hz, kRate, 48000, 120000));
    };
    double programme_in, programme_off, programme_edge, unused;
    const double tuned_in = whistle(0.0f, 1375.0, &programme_in);
    const double off = whistle(0.5f, 1375.0, &programme_off);
    const double other = whistle(0.3f, 495.0, &unused);
    const double below = whistle(-0.5f, 1375.0, &unused);
    whistle(0.9f, 4455.0, &programme_edge);
    std::printf("whistle: tuned in %.1f dB, +0.5 (1375 Hz) %.1f dB, -0.5 %.1f dB, +0.3 (495 Hz) %.1f dB; "
                "programme %.1f dB tuned, %.1f dB at +0.5, %.1f dB at +0.9\n",
                tuned_in, off, below, other, programme_in, programme_off, programme_edge);
    EXPECT(tuned_in < -80.0, "tuned in: no whistle");
    EXPECT(off > -30.0 && off < -15.0, "Tuning +0.5: a whistle at the 1375 Hz offset");
    EXPECT(below > -30.0, "Tuning -0.5: the same whistle from the other side");
    EXPECT(other > -30.0, "the whistle's pitch follows the dial");
    EXPECT(std::fabs(programme_off - programme_in) < 1.0, "a little off-tune leaves the programme's level");
    // 4. Far enough off, the carrier slides down the filter's skirt and the
    // programme sinks.
    EXPECT(programme_edge < programme_in - 6.0, "far off-tune the programme sinks");
  }

  // 5. Fading. At 0 a steady tone stays steady for a minute; at 1 it rises
  // and sinks by more than 12 dB over periods of seconds.
  // 6. The fading is selective: two partials do not fade together, because a
  // notch moves through the band.
  {
    std::vector<float> pair = sine(700.0f, 60.0f, kRate, 0.2f);
    const std::vector<float> upper = sine(1900.0f, 60.0f, kRate, 0.2f);
    for (size_t i = 0; i < pair.size(); ++i) pair[i] += upper[i];

    clean(device, Radio::kShortwave);
    Stereo steady = run(device, pair);
    const double still = range(tone_envelope(steady.left, 700.0, kRate, 0.5f), 2);

    clean(device, Radio::kShortwave);
    device.set_param(p::kFading, 1.0f);
    Stereo faded = run(device, pair);
    const std::vector<double> low = tone_envelope(faded.left, 700.0, kRate, 0.5f);
    const std::vector<double> high = tone_envelope(faded.left, 1900.0, kRate, 0.5f);
    std::vector<double> tilt(low.size());
    for (size_t i = 0; i < low.size(); ++i) tilt[i] = low[i] - high[i];
    const int crossed = crossings(low);
    std::printf("fading: range %.2f dB at 0, %.1f dB at 1 (700 Hz) and %.1f dB (1900 Hz); %d mean crossings "
                "in 60 s (period about %.1f s); the two partials differ by %.1f dB at most, correlation %.2f\n",
                still, range(low), range(high), crossed, crossed > 0 ? 120.0 / crossed : 0.0, range(tilt),
                pearson(low, high));
    EXPECT(still < 1.0, "Fading 0: a steady tone varies by less than 1 dB over a minute");
    EXPECT(range(low) > 12.0, "Fading 1: a steady tone varies by more than 12 dB");
    EXPECT(crossed >= 6 && crossed <= 60, "Fading 1: the fades take seconds (2 to 20 s a cycle)");
    EXPECT(range(tilt) > 8.0, "Fading 1: partials fade at different times (a notch moves)");
    EXPECT(pearson(low, high) < 0.97, "Fading 1: the two partials are not locked together");

    // Medium wave fades too, but less and more slowly.
    clean(device, Radio::kMediumWave);
    device.set_param(p::kFading, 1.0f);
    Stereo slow = run(device, pair);
    const std::vector<double> local = tone_envelope(slow.left, 700.0, kRate, 0.5f);
    std::printf("fading, medium wave: range %.1f dB, %d mean crossings\n", range(local), crossings(local));
    EXPECT(range(local) > 4.0 && range(local) < range(low), "Medium wave fades less than Shortwave");
    EXPECT(crossings(local) < crossed, "Medium wave fades more slowly than Shortwave");
  }

  // 7. The receiver's gain follows the signal, and the static was added
  // before it: when the tone sinks the noise rises.
  {
    clean(device, Radio::kShortwave);
    device.set_param(p::kFading, 1.0f);
    device.set_param(p::kStatic, 0.3f);
    Stereo out = run(device, sine(700.0f, 60.0f, kRate, 0.25f));
    const std::vector<double> tone = tone_envelope(out.left, 700.0, kRate, 0.5f);
    // Between the tone's second and third harmonics.
    const std::vector<double> hiss = band_envelope(out.left, 1600.0f, 2000.0f, kRate, 0.5f);
    const double together = pearson(tone, hiss);
    std::printf("gain: tone range %.1f dB, noise range %.1f dB, correlation of the two %.2f\n", range(tone, 2),
                range(hiss, 2), together);
    EXPECT(together < -0.4, "the noise rises as the signal sinks (envelopes correlate below -0.4)");
    EXPECT(range(hiss, 2) > 8.0, "the noise floor moves by more than 8 dB with the fades");

    // The same at the default settings of those two controls.
    clean(device, Radio::kShortwave);
    device.set_param(p::kFading, p::kParamDefault[p::kFading]);
    device.set_param(p::kStatic, p::kParamDefault[p::kStatic]);
    out = run(device, sine(700.0f, 60.0f, kRate, 0.25f));
    const double usual = pearson(tone_envelope(out.left, 700.0, kRate, 0.5f),
                                 band_envelope(out.left, 1600.0f, 2000.0f, kRate, 0.5f));
    std::printf("gain at the default Fading and Static: correlation %.2f\n", usual);
    EXPECT(usual < -0.4, "at the defaults too, noise and signal move against each other");
  }

  // 8. Static follows its control: none at 0, and each step up is louder.
  {
    auto hiss_at = [&](float amount, float bandwidth, float lo, float hi) {
      clean(device, Radio::kShortwave);
      device.set_param(p::kStatic, amount);
      device.set_param(p::kBandwidth, bandwidth);
      Stereo out = run(device, sine(700.0f, 20.0f, kRate, 0.25f));
      return average(band_envelope(out.left, lo, hi, kRate, 0.5f), 2);
    };
    const double none = hiss_at(0.0f, 0.5f, 1600.0f, 2000.0f), little = hiss_at(0.2f, 0.5f, 1600.0f, 2000.0f),
                 some = hiss_at(0.5f, 0.5f, 1600.0f, 2000.0f), full = hiss_at(1.0f, 0.5f, 1600.0f, 2000.0f);
    const double top = hiss_at(0.5f, 0.5f, 2700.0f, 3300.0f), narrow = hiss_at(0.5f, 0.0f, 2700.0f, 3300.0f);
    std::printf("static: %.1f dB at 0 (the tone's skirt), %.1f at 0.2, %.1f at 0.5, %.1f at 1 (1.6 to 2 kHz); "
                "2.7 to 3.3 kHz: %.1f dB, with the narrow filter %.1f\n",
                none, little, some, full, top, narrow);
    EXPECT(none < little - 15.0, "Static 0: no noise");
    EXPECT(little > -70.0 && some > little + 6.0 && full > some + 4.0, "Static: more is louder");
    EXPECT(narrow < top - 8.0, "a narrower filter lets less noise through at the top of the band");
  }

  // 9. Interference: nothing at 0; at the default it is occasional; turned
  // up it is there more of the time and louder. The 60 Hz input only keeps
  // the receiver on: it is under the audio band.
  {
    auto neighbours = [&](float amount, double* share, double* level, int* events) {
      clean(device, Radio::kShortwave);
      device.set_param(p::kInterference, amount);
      Stereo out = run(device, sine(60.0f, 240.0f, kRate, 0.2f));
      const std::vector<double> heard = band_envelope(out.left, 250.0f, 5000.0f, kRate, 0.25f);
      int on = 0;
      double sum = 0.0;
      bool was = false;
      *events = 0;
      for (size_t i = 4; i < heard.size(); ++i) {
        const bool is = heard[i] > -55.0;
        if (is) {
          ++on;
          sum += heard[i];
        }
        if (is && !was) ++*events;
        was = is;
      }
      *share = static_cast<double>(on) / static_cast<double>(heard.size() - 4);
      *level = on > 0 ? sum / on : -200.0;
    };
    double share_off, level_off, share_usual, level_usual, share_full, level_full;
    int events_off, events_usual, events_full;
    neighbours(0.0f, &share_off, &level_off, &events_off);
    neighbours(p::kParamDefault[p::kInterference], &share_usual, &level_usual, &events_usual);
    neighbours(1.0f, &share_full, &level_full, &events_full);
    std::printf("interference over 240 s: default %d bursts (%.1f a minute), heard %.0f%% of the time at %.1f dB; "
                "at 1: %d bursts, %.0f%% of the time at %.1f dB\n",
                events_usual, events_usual / 4.0, 100.0 * share_usual, level_usual, events_full,
                100.0 * share_full, level_full);
    EXPECT(share_off == 0.0, "Interference 0: nothing but the station");
    EXPECT(share_usual > 0.04 && share_usual < 0.35, "default Interference is occasional (4 to 35% of the time)");
    EXPECT(share_full > 0.5 && share_full < 0.95, "Interference 1 is there most of the time, never all of it");
    EXPECT(level_full > level_usual + 4.0, "more Interference is louder");
  }

  // 10. Moving the dial or changing band while sounding does not click.
  {
    std::vector<float> chord = sine(220.0f, 2.0f, kRate, 0.3f);
    const std::vector<float> fifth = sine(330.0f, 2.0f, kRate, 0.2f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += fifth[i];
    clean(device, Radio::kShortwave);
    Stereo settled = run(device, chord);
    const double usual = max_step(settled.left, 48000);
    double worst = 0.0;
    for (int k = 0; k < 100; ++k) {
      device.set_param(p::kTuning, -0.5f + 0.01f * static_cast<float>(k));
      const std::vector<float> piece(chord.begin() + k * 960, chord.begin() + (k + 1) * 960);
      worst = std::max(worst, max_step(run(device, piece).left));
    }
    clean(device, Radio::kShortwave);
    run(device, chord);
    device.set_param(p::kBand, static_cast<float>(Radio::kSideband));
    const double to_sideband = max_step(run(device, chord).left);
    device.set_param(p::kBand, static_cast<float>(Radio::kMediumWave));
    const double to_medium = max_step(run(device, chord).left);
    device.set_param(p::kBandwidth, 0.0f);
    device.set_param(p::kSpeaker, 1.0f);
    device.set_param(p::kFading, 1.0f);
    const double knobs = max_step(run(device, chord).left, 0, 4800);
    std::printf("clicks: largest step %.4f settled; %.4f sweeping Tuning; %.4f and %.4f changing Band; "
                "%.4f on a jump of Bandwidth, Speaker and Fading\n",
                usual, worst, to_sideband, to_medium, knobs);
    EXPECT(worst < 0.06, "sweeping Tuning does not click");
    EXPECT(to_sideband < 0.06 && to_medium < 0.06, "changing Band does not click");
    EXPECT(knobs < 0.06, "Bandwidth, Speaker and Fading jumps do not click");
  }

  // 11. Mix 0 is the input, untouched and still stereo; at Mix 1 the radio is
  // one loudspeaker, the same on both sides.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> left = noise(1.0f, kRate, 0.5f), right = noise(1.0f, kRate, 0.5f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 passes the input through bit for bit");
    device.init(kRate);
    out = run(device, left, right);
    EXPECT(out.left == out.right, "Mix 1: the radio is mono");
    EXPECT(correlation(out.left, out.right) > 0.999, "Mix 1: mono compatible");
  }

  // 12. The receiver stays on for four seconds after the input stops (the
  // static carries on), fades over a second and a half, and is then asleep.
  {
    device.init(kRate);
    device.set_param(p::kStatic, 0.6f);
    run(device, sine(440.0f, 1.0f, kRate, 0.3f));
    Stereo after = render(device, 7.0f, kRate);
    const double held = db(rms(after.left, 1 * 48000, 3 * 48000));
    const double fading_out = db(rms(after.left, 4 * 48000 + 36000, 5 * 48000));
    size_t last = 0;
    for (size_t i = 0; i < after.size(); ++i) {
      if (after.left[i] != 0.0f) last = i;
    }
    std::printf("tail: static %.1f dB one to three seconds after the input stops, %.1f dB at 4.75 to 5 s, "
                "exact silence from %.2f s\n",
                held, fading_out, static_cast<double>(last + 1) / kRate);
    EXPECT(held > -50.0, "the static carries on after the input stops");
    EXPECT(fading_out < held - 6.0, "then it fades");
    EXPECT(static_cast<double>(last) / kRate < 5.6, "silent 5.6 s after the input stops");
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.3f));
    EXPECT(rms(woken.left, 12000, 24000) > 0.05, "wakes on new input");
  }

  // 13. The loudspeaker: small takes away bass and treble, humps the middle,
  // and overloads softly.
  {
    auto through = [&](float speaker, float hz, float gain, double* third) {
      clean(device, Radio::kMediumWave);
      device.set_param(p::kBandwidth, 1.0f);
      device.set_param(p::kSpeaker, speaker);
      Stereo out = run(device, sine(hz, 1.0f, kRate, gain));
      if (third) *third = db(tone_level(out.left, 3.0 * hz, kRate, 24000, 48000));
      return db(tone_level(out.left, hz, kRate, 24000, 48000));
    };
    double clean_third, small_third;
    const double bass = through(1.0f, 120.0f, 0.1f, nullptr) - through(0.0f, 120.0f, 0.1f, nullptr);
    const double treble = through(1.0f, 5500.0f, 0.1f, nullptr) - through(0.0f, 5500.0f, 0.1f, nullptr);
    const double hump = through(1.0f, 1900.0f, 0.1f, nullptr) - through(1.0f, 700.0f, 0.1f, nullptr);
    const double line = through(0.0f, 500.0f, 0.4f, &clean_third);
    const double small = through(1.0f, 500.0f, 0.4f, &small_third);
    std::printf("speaker 1 against 0: 120 Hz %.1f dB, 5.5 kHz %.1f dB; 1.9 kHz is %.1f dB over 700 Hz; third "
                "harmonic of a -8 dB tone %.1f dB re fundamental (line %.1f)\n",
                bass, treble, hump, small_third - small, clean_third - line);
    EXPECT(bass < -12.0, "small speaker: no bass");
    EXPECT(treble < -10.0, "small speaker: no top");
    EXPECT(hump > 3.0, "small speaker: a hump in the middle");
    EXPECT(small_third - small > -40.0 && small_third - small > clean_third - line + 10.0,
           "small speaker: overloads softly");
  }

  // 14. The same radio at 44.1, 48 and 96 kHz: passband level, the sideband
  // shift, the whistle and the noise floor.
  {
    double level[3], shifted[3], whistle[3], hiss[3];
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (int r = 0; r < 3; ++r) {
      const float rate = rates[r];
      const size_t from = static_cast<size_t>(rate), to = static_cast<size_t>(2.0f * rate);
      clean(device, Radio::kShortwave, rate);
      device.set_param(p::kStatic, 0.5f);
      Stereo out = run(device, sine(700.0f, 12.0f, rate, 0.25f));
      level[r] = db(tone_level(out.left, 700.0, rate, from, to));
      hiss[r] = average(band_envelope(out.left, 1600.0f, 2000.0f, rate, 0.5f), 2);
      clean(device, Radio::kShortwave, rate);
      device.set_param(p::kTuning, 0.5f);
      out = run(device, sine(300.0f, 2.0f, rate, 0.25f));
      whistle[r] = dominant_frequency(out.left, rate, 600.0, 4000.0, from, to);
      clean(device, Radio::kSideband, rate);
      device.set_param(p::kTuning, 0.5f);
      out = run(device, sine(1000.0f, 2.0f, rate, 0.2f));
      shifted[r] = dominant_frequency(out.left, rate, 500.0, 2000.0, from, to);
    }
    std::printf("rates 44.1 / 48 / 96 kHz: level %.2f / %.2f / %.2f dB, noise %.1f / %.1f / %.1f dB, whistle "
                "%.1f / %.1f / %.1f Hz, sideband %.1f / %.1f / %.1f Hz\n",
                level[0], level[1], level[2], hiss[0], hiss[1], hiss[2], whistle[0], whistle[1], whistle[2],
                shifted[0], shifted[1], shifted[2]);
    for (int r = 0; r < 3; ++r) {
      EXPECT_NEAR(level[r], level[1], 0.3, "the passband level does not depend on the sample rate");
      EXPECT_NEAR(hiss[r], hiss[1], 2.0, "the noise floor does not depend on the sample rate");
      EXPECT_NEAR(whistle[r], 1375.0, 2.0, "the whistle is at the offset at every sample rate");
      EXPECT_NEAR(shifted[r], 1200.0, 1.0, "the sideband shift is in hertz at every sample rate");
    }
  }

  // 15. Levels: a held chord through the default patch comes out within 3 dB
  // of what went in, and full-scale noise through the worst settings stays
  // under the amplifier's rails.
  {
    std::vector<float> chord(static_cast<size_t>(20.0f * kRate), 0.0f);
    for (float hz : {220.0f, 277.18f, 329.63f, 440.0f, 659.26f}) {
      const std::vector<float> note = sine(hz, 20.0f, kRate, 0.1f);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += note[i];
    }
    device.init(kRate);
    Stereo out = run(device, chord);
    const double change = db(rms(out.left, 48000)) - db(rms(chord, 48000));
    device.init(kRate);
    set_all(device, p::kParamMax);
    rng_state() = 0xBEEFu;
    Stereo loud = run(device, noise(5.0f, kRate, 1.0f));
    std::printf("levels: default patch %+.1f dB against a dry chord (peak %.1f dBFS); everything at maximum with "
                "full-scale noise peaks at %.2f\n",
                change, db(peak(out.left)), std::max(peak(loud.left), peak(loud.right)));
    EXPECT(change > -3.0 && change < 3.0, "the default patch is within 3 dB of the dry level");
    EXPECT(peak(loud.left) <= 1.0, "the output never passes the amplifier's rails");
  }

  // Cost with everything on: full static and interference, deep fading.
  device.init(kRate);
  device.set_param(p::kStatic, 1.0f);
  device.set_param(p::kInterference, 1.0f);
  device.set_param(p::kFading, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  rng_state() = 0xBEEFu;
  const std::vector<float> load = noise(10.0f, kRate, 0.25f);
  report_cost("radio", 10.0f, kRate, [&] { run(device, load); });

  return finish("radio");
}
