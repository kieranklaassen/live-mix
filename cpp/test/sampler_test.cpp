// Native harness for Sampler (cpp/devices/sampler). The conformance pass
// runs on the built-in sound; the rest loads sines, sweeps and noise through
// the three sample entry points and asserts what makes it a sampler.

#include "../devices/sampler/sampler.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::Sampler;
namespace p = livemix::sampler;

static Sampler device;

static const float kRate = 48000.0f;
static const float kMiddleC = 261.6256f;

// Hand the device a sound the way the host does.
static void load(Sampler& d, const std::vector<float>& left, const std::vector<float>& right, float rate) {
  const int capacity = d.sample_capacity();
  const int frames = std::min(static_cast<int>(left.size()), capacity);
  float* buffer = d.sample_buffer();
  for (int i = 0; i < frames; ++i) {
    buffer[i] = left[i];
    buffer[capacity + i] = right.empty() ? 0.0f : right[i];
  }
  d.sample_commit(frames, right.empty() ? 1 : 2, rate);
}
static void load(Sampler& d, const std::vector<float>& mono, float rate) {
  load(d, mono, std::vector<float>(), rate);
}

// The whole sound, looped, with nothing in the way: no crossfade, wobble or
// velocity, a fast envelope, the filter open.
static void plain(Sampler& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kStart, 0.0f);
  d.set_param(p::kEnd, 1.0f);
  d.set_param(p::kLoop, 1.0f);
  d.set_param(p::kCrossfade, 0.0f);
  d.set_param(p::kReverse, 0.0f);
  d.set_param(p::kAttack, 0.001f);
  d.set_param(p::kRelease, 0.02f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kWobble, 0.0f);
  d.set_param(p::kVelocity, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

// RMS of `x` through a two-pole band-pass at `hz` (unity gain at the centre).
static double band_rms(const std::vector<float>& x, double rate, double hz, double q, size_t from = 0,
                       size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double w = 2.0 * kPi * hz / rate;
  const double alpha = std::sin(w) / (2.0 * q);
  const double b0 = alpha / (1.0 + alpha), a1 = -2.0 * std::cos(w) / (1.0 + alpha),
               a2 = (1.0 - alpha) / (1.0 + alpha);
  double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0, sum = 0.0;
  for (size_t i = 0; i < to; ++i) {
    const double y = b0 * (x[i] - x2) - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    if (i >= from) sum += y * y;
  }
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

// Frequency over [from, to) from the spacing of rising zero crossings.
static double crossing_frequency(const std::vector<float>& x, double rate, size_t from, size_t to) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + static_cast<double>(-x[i - 1]) / (x[i] - x[i - 1]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * rate / (last - first) : 0.0;
}

int main() {
  Conformance spec;
  spec.name = "sampler";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  const bool verbose = std::getenv("SAMPLER_VERBOSE") != nullptr;

  // The built-in sound: middle C at middle C, a sane level, and a middle
  // that loops as it stands (the default region and crossfade).
  {
    device.init(kRate);
    device.set_param(p::kWobble, 0.0f);
    device.note_on(1, kMiddleC, 0.7f);
    Stereo out = render(device, 6.0f, kRate);
    EXPECT_NEAR(dominant_frequency(out.left, kRate, 100.0, 1000.0, 24000, 96000), 261.63, 0.3,
                "the built-in sound plays middle C at middle C");
    const double level_db = db(std::max(peak(out.left), peak(out.right)));
    if (verbose) std::printf("default note: peak %.1f dBFS, rms %.1f dB\n", level_db, db(rms(out.left, 24000)));
    EXPECT(level_db > -24.0 && level_db < -10.0, "one key at the defaults peaks between -24 and -10 dBFS");
    // The loop is 100724 frames: seams at 2.098 s and 4.197 s. Compare the
    // 40 ms around each with the stretch between them.
    const double calm_step = max_step(out.left, 110000, 190000);
    const double calm_level = rms(out.left, 110000, 190000);
    for (size_t seam : {static_cast<size_t>(100724), static_cast<size_t>(201448)}) {
      const double step = max_step(out.left, seam - 3400, seam + 960);
      const double level = rms(out.left, seam - 3400, seam + 960);
      if (verbose) std::printf("seam at %zu: step %.5f (calm %.5f), level %.2f dB against calm\n", seam, step, calm_step, db(level) - db(calm_level));
      EXPECT(step < 1.15 * calm_step, "the built-in loop has no click at its seam");
      EXPECT(std::fabs(db(level) - db(calm_level)) < 0.5, "nor a bump or dip through its crossfade");
    }
    EXPECT(correlation(out.left, out.right, 24000) < 0.9999, "the built-in sound's breath is stereo");

    // Played whole with Loop Off it has its own attack and release, and ends.
    plain(device);
    device.set_param(p::kLoop, 0.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo whole = render(device, 4.0f, kRate);
    const double steady = rms(whole.left, 48000, 96000);
    EXPECT(rms(whole.left, 0, 960) < 0.2 * steady, "the built-in sound starts softly");
    // 4 kHz is above every harmonic of the tone: only the breath is there.
    const double air_attack = band_rms(whole.left, kRate, 4000.0, 2.0, 240, 1920) / rms(whole.left, 240, 1920);
    const double air_steady = band_rms(whole.left, kRate, 4000.0, 2.0, 48000, 96000) / steady;
    if (verbose) std::printf("breath against tone: attack %.4f, steady %.4f\n", air_attack, air_steady);
    EXPECT(air_steady > 0.003 && air_steady < 0.1, "a little breath in the steady tone");
    EXPECT(air_attack > 3.0 * air_steady, "and a breathier attack");
    EXPECT(rms(whole.left, 139000, 143000) < 0.1 * steady, "and fades at its end");
  }

  // Pitch: the key transposes the sound, middle C being its own pitch; Tune
  // and Fine move it by semitones and cents.
  {
    std::vector<float> tone = sine(220.0f, 2.0f, kRate, 0.5f);
    auto pitch_of = [&](float key_hz, float tune, float fine, float device_rate, const std::vector<float>& sound,
                        float sound_rate) {
      plain(device, device_rate);
      load(device, sound, sound_rate);
      device.set_param(p::kTune, tune);
      device.set_param(p::kFine, fine);
      device.note_on(1, key_hz, 1.0f);
      Stereo out = render(device, 1.5f, device_rate);
      return dominant_frequency(out.left, device_rate, 50.0, 2000.0, static_cast<size_t>(0.25f * device_rate));
    };
    EXPECT_NEAR(pitch_of(kMiddleC, 0.0f, 0.0f, kRate, tone, kRate), 220.0, 0.3, "middle C plays a 220 Hz sound at 220 Hz");
    EXPECT_NEAR(pitch_of(2.0f * kMiddleC, 0.0f, 0.0f, kRate, tone, kRate), 440.0, 0.3,
                "an octave above middle C plays it at 440 Hz");
    EXPECT_NEAR(pitch_of(0.5f * kMiddleC, 0.0f, 0.0f, kRate, tone, kRate), 110.0, 0.3, "an octave below at 110 Hz");
    EXPECT_NEAR(pitch_of(kMiddleC, 7.0f, 0.0f, kRate, tone, kRate), 220.0 * std::pow(2.0, 7.0 / 12.0), 0.4,
                "Tune +7 is a fifth up");
    EXPECT_NEAR(pitch_of(kMiddleC, -12.0f, 0.0f, kRate, tone, kRate), 110.0, 0.3, "Tune -12 is an octave down");
    EXPECT_NEAR(pitch_of(kMiddleC, 0.0f, 50.0f, kRate, tone, kRate), 220.0 * std::pow(2.0, 50.0 / 1200.0), 0.3,
                "Fine +50 is a quarter tone up");
    EXPECT_NEAR(pitch_of(kMiddleC, 0.0f, -100.0f, kRate, tone, kRate), 220.0 * std::pow(2.0, -1.0 / 12.0), 0.3,
                "Fine -100 is a semitone down");
    // The stored sound's own rate is accounted for, both ways.
    EXPECT_NEAR(pitch_of(2.0f * kMiddleC, 0.0f, 0.0f, kRate, sine(220.0f, 2.0f, 44100.0f, 0.5f), 44100.0f), 440.0, 0.3,
                "a sound stored at 44.1 kHz plays at the right pitch at 48 kHz");
    EXPECT_NEAR(pitch_of(2.0f * kMiddleC, 0.0f, 0.0f, 96000.0f, tone, kRate), 440.0, 0.3,
                "a 48 kHz sound plays at the right pitch in a 96 kHz device");
    EXPECT_NEAR(pitch_of(kMiddleC, 0.0f, 0.0f, 44100.0f, sine(220.0f, 2.0f, 22050.0f, 0.5f), 22050.0f), 220.0, 0.3,
                "and a 22.05 kHz sound in a 44.1 kHz device");
  }

  // Loop Off ends with the sound and frees the voice; Forward holds as long
  // as the key does.
  {
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.5f);
    plain(device);
    load(device, tone, kRate);
    device.set_param(p::kLoop, 0.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo once = render(device, 2.0f, kRate);
    EXPECT(rms(once.left, 24000, 47000) > 0.1, "Loop Off plays the sound through");
    EXPECT(peak(once.left, 48010, 57600) < 1.0e-4 && peak(once.left, 57600, 96000) == 0.0,
           "and ends when the sound ends, the key still down");
    EXPECT(max_step(once.left, 47000, 48100) < 1.2 * max_step(once.left, 24000, 47000),
           "a sound that stops mid-wave still ends without a click");
    // An octave up it takes half as long.
    plain(device);
    load(device, tone, kRate);
    device.set_param(p::kLoop, 0.0f);
    device.note_on(1, 2.0f * kMiddleC, 1.0f);
    Stereo quick = render(device, 1.0f, kRate);
    EXPECT(rms(quick.left, 20000, 23500) > 0.1 && peak(quick.left, 24010, 48000) < 1.0e-4,
           "an octave up the sound is over in half the time");
    // The voices really are free: 16 ended notes, then 16 more with none stolen.
    plain(device);
    load(device, tone, kRate);
    device.set_param(p::kLoop, 0.0f);
    for (int n = 0; n < 16; ++n) device.note_on(n, kMiddleC, 1.0f);
    render(device, 1.2f, kRate);
    device.set_param(p::kLoop, 1.0f);
    device.note_on(100, kMiddleC, 1.0f);
    Stereo fresh = render(device, 0.2f, kRate);
    const double one = rms(fresh.left, 2400);
    for (int n = 1; n < 16; ++n) device.note_on(100 + n, kMiddleC, 1.0f);
    Stereo full = render(device, 0.2f, kRate);
    EXPECT(one > 0.05, "a voice that ended by itself plays again");
    // All sixteen fit beside it, in phase (same sound, same key, started together).
    EXPECT(max_step(full.left) < 0.3, "sixteen more notes start without stealing anything");

    plain(device);
    load(device, tone, kRate);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo looped = render(device, 5.0f, kRate);
    EXPECT(rms(looped.left, 192000, 240000) > 0.9 * rms(looped.left, 24000, 47000),
           "Loop Forward sustains for as long as the key is held");
    // 220 cycles in the loop: the seam of a matching loop is not there.
    EXPECT(max_step(looped.left, 4800) < 1.05 * max_step(looped.left, 4800, 40000), "a matching loop is seamless");
    device.note_off(1);
    Stereo released = render(device, 1.0f, kRate);
    EXPECT(peak(released.left, 24000) == 0.0, "and stops when it is released");
  }

  // The loop crossfade: a region that does not match clicks at the seam with
  // Crossfade 0 and does not with it.
  {
    // One second of 220 Hz. Ending the loop at 0.7375 s leaves 162.25
    // cycles in it: the seam jumps from the top of the wave to zero.
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.5f);
    plain(device);
    load(device, tone, kRate);
    device.note_on(1, kMiddleC, 1.0f);
    const double own_step = max_step(render(device, 0.5f, kRate).left, 4800);
    auto seam_step = [&](float end, float crossfade, float start) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kStart, start);
      device.set_param(p::kEnd, end);
      device.set_param(p::kCrossfade, crossfade);
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 4.0f, kRate);
      return max_step(out.left, 4800);
    };
    const float mismatched = 0.7375f;
    const double hard = seam_step(mismatched, 0.0f, 0.0f);
    const double faded = seam_step(mismatched, 60.0f, 0.0f);
    const double faded_with_lead_in = seam_step(0.25f + mismatched, 60.0f, 0.25f);
    if (verbose)
      std::printf("seam step: %.4f hard, %.4f crossfaded, %.4f with lead-in (the sine's own %.4f)\n", hard, faded,
                  faded_with_lead_in, own_step);
    EXPECT(hard > 10.0 * own_step, "a loop that does not match clicks with Crossfade 0");
    EXPECT(faded < 1.1 * own_step, "and does not with a crossfade");
    EXPECT(faded_with_lead_in < 1.1 * own_step, "nor when the loop start has audio before it");
    // The same backwards: the crossfade mirrors.
    double reversed[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kEnd, mismatched);
      device.set_param(p::kReverse, 1.0f);
      device.set_param(p::kCrossfade, which == 0 ? 0.0f : 60.0f);
      device.note_on(1, kMiddleC, 1.0f);
      reversed[which] = max_step(render(device, 4.0f, kRate).left, 4800);
    }
    EXPECT(reversed[0] > 10.0 * own_step && reversed[1] < 1.1 * own_step, "a reversed loop crossfades the same way");
  }

  // The crossfade keeps the level: no dip on unrelated material (noise).
  {
    rng_state() = 0xF1E1Du;
    plain(device);
    load(device, noise(2.0f, kRate, 0.3f), kRate);
    device.set_param(p::kCrossfade, 400.0f);
    device.note_on(1, kMiddleC, 1.0f);
    // The pass ends at 2 s; the crossfade runs from 1.6 s, the loop from 0.4 s.
    Stereo out = render(device, 4.0f, kRate);
    const double body = rms(out.left, 24000, 72000);
    const double middle = rms(out.left, 81600, 91200);  // 1.7 to 1.9 s: the middle of the fade
    if (verbose) std::printf("noise loop: crossfade middle %.2f dB against the body\n", db(middle) - db(body));
    EXPECT(std::fabs(db(middle) - db(body)) < 1.0, "the crossfade of unrelated material neither dips nor swells");
    // After the seam it is playing from 0.4 s on: the same audio as the first pass.
    double worst = 0.0;
    for (size_t i = 0; i < 9600; ++i) worst = std::max(worst, std::fabs(static_cast<double>(out.left[96000 + i]) - out.left[19200 + i]));
    EXPECT(worst < 1.0e-4, "after the seam the loop continues from the loop start plus the crossfade");
  }

  // Ping-pong turns around at each edge: a rising sweep falls on every
  // other pass, with no jump at the turn.
  {
    std::vector<float> ramp(48000);
    double phase = 0.0;
    for (size_t i = 0; i < ramp.size(); ++i) {
      ramp[i] = 0.5f * static_cast<float>(std::sin(phase));
      phase += 2.0 * kPi * (300.0 + 1200.0 * static_cast<double>(i) / 48000.0) / kRate;
    }
    plain(device);
    load(device, ramp, kRate);
    device.set_param(p::kLoop, 2.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo out = render(device, 3.0f, kRate);
    auto hz_at = [&](double seconds) {
      const size_t centre = static_cast<size_t>(seconds * kRate);
      return crossing_frequency(out.left, kRate, centre - 1200, centre + 1200);
    };
    if (verbose)
      std::printf("ping-pong: %.0f %.0f | %.0f %.0f | %.0f %.0f Hz\n", hz_at(0.25), hz_at(0.75), hz_at(1.25), hz_at(1.75),
                  hz_at(2.25), hz_at(2.75));
    EXPECT_NEAR(hz_at(0.25), 600.0, 6.0, "Ping-pong: the first pass runs forwards");
    EXPECT_NEAR(hz_at(0.75), 1200.0, 6.0, "Ping-pong: the first pass runs forwards (later)");
    EXPECT_NEAR(hz_at(1.25), 1200.0, 6.0, "Ping-pong: the second pass runs backwards");
    EXPECT_NEAR(hz_at(1.75), 600.0, 6.0, "Ping-pong: the second pass runs backwards (later)");
    EXPECT_NEAR(hz_at(2.25), 600.0, 6.0, "Ping-pong: the third pass runs forwards again");
    EXPECT(max_step(out.left, 47000, 49000) < 1.1 * max_step(out.left, 40000, 47000), "the turn at End does not click");
    EXPECT(max_step(out.left, 95000, 97000) < 3.0 * max_step(out.left, 88000, 95000) + 0.002, "nor the turn at Start");

    // Reverse starts at End and runs backwards; with Loop Off it ends at Start.
    plain(device);
    load(device, ramp, kRate);
    device.set_param(p::kReverse, 1.0f);
    device.set_param(p::kLoop, 0.0f);
    device.note_on(1, kMiddleC, 1.0f);
    out = render(device, 2.0f, kRate);
    EXPECT_NEAR(hz_at(0.25), 1200.0, 6.0, "Reverse starts from the end of the sound");
    EXPECT_NEAR(hz_at(0.75), 600.0, 6.0, "and plays it backwards");
    EXPECT(peak(out.left, 48010, 57600) < 1.0e-4 && peak(out.left, 57600) == 0.0, "ending at Start with Loop Off");
    plain(device);
    load(device, ramp, kRate);
    device.set_param(p::kReverse, 1.0f);
    device.note_on(1, kMiddleC, 1.0f);
    out = render(device, 2.0f, kRate);
    EXPECT_NEAR(hz_at(1.25), 1200.0, 6.0, "a reversed Forward loop jumps back to End");
    plain(device);
    load(device, ramp, kRate);
    device.set_param(p::kReverse, 1.0f);
    device.set_param(p::kLoop, 2.0f);
    device.note_on(1, kMiddleC, 1.0f);
    out = render(device, 2.0f, kRate);
    EXPECT_NEAR(hz_at(0.25), 1200.0, 6.0, "a reversed Ping-pong starts backwards");
    EXPECT_NEAR(hz_at(1.25), 600.0, 6.0, "and comes back forwards");
  }

  // Start and End choose the region: a sound that is 300 Hz in its first
  // half and 500 Hz in its second.
  {
    std::vector<float> two = sine(300.0f, 1.0f, kRate, 0.5f);
    std::vector<float> second = sine(500.0f, 1.0f, kRate, 0.5f);
    two.insert(two.end(), second.begin(), second.end());
    auto levels = [&](float start, float end, int loop, double* low, double* high) {
      plain(device);
      load(device, two, kRate);
      device.set_param(p::kStart, start);
      device.set_param(p::kEnd, end);
      device.set_param(p::kLoop, static_cast<float>(loop));
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 3.0f, kRate);
      *low = tone_level(out.left, 300.0, kRate, 4800);
      *high = tone_level(out.left, 500.0, kRate, 4800);
    };
    double low, high;
    levels(0.0f, 0.5f, 1, &low, &high);
    EXPECT(low > 0.3 && high < 0.01, "Start 0, End 0.5 loops the first half only");
    levels(0.5f, 1.0f, 1, &low, &high);
    EXPECT(high > 0.3 && low < 0.01, "Start 0.5, End 1 loops the second half only");
    levels(1.0f, 0.5f, 1, &low, &high);
    EXPECT(high > 0.3 && low < 0.01, "Start above End is the same region");
    levels(0.25f, 0.75f, 1, &low, &high);
    EXPECT(low > 0.15 && high > 0.15, "a region across the middle plays both");
    levels(0.5f, 0.5f, 1, &low, &high);
    EXPECT(std::isfinite(low) && std::isfinite(high), "an empty region is survivable");
    // Loop Off from Start 0.5: half the sound, then silence.
    plain(device);
    load(device, two, kRate);
    device.set_param(p::kStart, 0.5f);
    device.set_param(p::kLoop, 0.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    EXPECT(tone_level(out.left, 500.0, kRate, 4800, 43200) > 0.3 && peak(out.left, 48010) < 1.0e-4,
           "Loop Off plays from Start to End and stops");
  }

  // Wobble is a tape motor: the pitch drifts by a few tens of cents at
  // about 0.8 Hz, the same for every key.
  {
    std::vector<float> tone = sine(1000.0f, 1.0f, kRate, 0.5f);
    auto deviation = [&](float wobble, float key_hz, double centre_hz) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kWobble, wobble);
      device.note_on(1, key_hz, 1.0f);
      Stereo out = render(device, 12.0f, kRate);
      // Cents off pitch, 40 times a second.
      std::vector<float> cents;
      for (size_t from = 4800; from + 1200 <= out.left.size(); from += 1200) {
        cents.push_back(static_cast<float>(1200.0 * std::log2(crossing_frequency(out.left, kRate, from, from + 1200) / centre_hz)));
      }
      return cents;
    };
    std::vector<float> still = deviation(0.0f, kMiddleC, 1000.0);
    std::vector<float> wow = deviation(1.0f, kMiddleC, 1000.0);
    std::vector<float> half = deviation(0.5f, kMiddleC, 1000.0);
    std::vector<float> fifth = deviation(1.0f, 1.5f * kMiddleC, 1500.0);
    const double rate_hz = dominant_frequency(wow, 40.0, 0.2, 5.0);
    if (verbose)
      std::printf("wobble: still %.2f ct, full ±%.1f ct at %.2f Hz, half ±%.1f ct\n", peak(still), peak(wow), rate_hz, peak(half));
    EXPECT(peak(still) < 0.5, "Wobble 0 is steady");
    EXPECT(peak(wow) > 18.0 && peak(wow) < 34.0, "Wobble 1 swings the pitch by about 30 cents");
    EXPECT_NEAR(rate_hz, 0.8, 0.1, "at about 0.8 Hz");
    EXPECT_NEAR(peak(half), 0.5 * peak(wow), 2.0, "Wobble 0.5 is half as deep");
    EXPECT(correlation(wow, fifth) > 0.98, "every key wobbles together: one motor");
    EXPECT(std::fabs(mean(wow)) < 3.0, "around the right pitch");
  }

  // Attack and Release are the times they say.
  {
    plain(device);
    load(device, sine(220.0f, 1.0f, kRate, 0.5f), kRate);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double full = rms(rise.left, 72000, 96000);
    EXPECT(rms(rise.left, 0, 4800) < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, 52800, 57600) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, 48000, 52800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 96000, 144000) == 0.0, "and is exactly silent soon after");
  }

  // Velocity sets how much the key's velocity changes the level.
  {
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.5f);
    auto level = [&](float amount, float gain) {
      plain(device);
      load(device, tone, kRate);
      device.set_param(p::kVelocity, amount);
      device.note_on(1, kMiddleC, gain);
      return rms(render(device, 0.5f, kRate).left, 4800);
    };
    const double loud = level(1.0f, 1.0f);
    EXPECT_NEAR(level(0.0f, 0.25f) / loud, 1.0, 0.01, "Velocity 0: every key at full level");
    EXPECT_NEAR(level(1.0f, 0.25f) / loud, 0.25, 0.01, "Velocity 1: the level is the key's velocity");
    EXPECT_NEAR(level(0.5f, 0.25f) / loud, 0.625, 0.01, "Velocity 0.5: half way");
  }

  // Tone is a low-pass on everything.
  {
    rng_state() = 0x70E5u;
    std::vector<float> hiss = noise(2.0f, kRate, 0.3f);
    double highs[2], lows[2];
    for (int which = 0; which < 2; ++which) {
      plain(device);
      load(device, hiss, kRate);
      device.set_param(p::kTone, which == 0 ? 18000.0f : 500.0f);
      device.note_on(1, kMiddleC, 1.0f);
      Stereo out = render(device, 2.0f, kRate);
      highs[which] = band_rms(out.left, kRate, 5000.0, 2.0, 4800);
      lows[which] = band_rms(out.left, kRate, 200.0, 2.0, 4800);
    }
    EXPECT(highs[1] < 0.03 * highs[0], "Tone at 500 Hz removes the highs");
    EXPECT(lows[1] > 0.8 * lows[0], "and leaves the lows");
  }

  // The aliasing guard. A 15 kHz sound played two octaves up would land at
  // 60 kHz, which folds to 12 kHz; the mip levels remove it instead. They
  // are built over the blocks after a commit, so a key struck at once still
  // reads the full-rate sound.
  {
    std::vector<float> high = sine(15000.0f, 2.0f, kRate, 0.5f);
    plain(device);
    load(device, high, kRate);
    device.note_on(1, 4.0f * kMiddleC, 1.0f);
    Stereo early = render(device, 0.25f, kRate);
    device.note_off(1);
    render(device, 0.75f, kRate);
    device.note_on(2, 4.0f * kMiddleC, 1.0f);
    Stereo late = render(device, 0.25f, kRate);
    const double folded_early = tone_level(early.left, 12000.0, kRate, 2400);
    const double folded_late = tone_level(late.left, 12000.0, kRate, 2400);
    if (verbose) std::printf("alias of 15 kHz two octaves up: %.4f at once, %.5f once the mips are built\n", folded_early, folded_late);
    EXPECT(folded_early > 0.2, "a key struck right after a commit reads the full-rate sound");
    EXPECT(folded_late < 0.005, "two octaves up, what would fold back is removed");
    EXPECT(rms(late.left, 2400) < 0.005, "leaving nothing of a sound that is all above the band");

    // An octave up: 15 kHz would fold to 18 kHz.
    device.note_off(2);
    render(device, 0.2f, kRate);
    device.note_on(3, 2.0f * kMiddleC, 1.0f);
    Stereo octave = render(device, 0.25f, kRate);
    EXPECT(tone_level(octave.left, 18000.0, kRate, 2400) < 0.005, "an octave up, likewise");

    // What belongs in the band is kept: 4 kHz two octaves up is 16 kHz,
    // 9 kHz an octave up is 18 kHz, at close to full level.
    plain(device);
    load(device, sine(4000.0f, 2.0f, kRate, 0.5f), kRate);
    render(device, 1.0f, kRate);
    device.note_on(1, 4.0f * kMiddleC, 1.0f);
    Stereo kept = render(device, 0.25f, kRate);
    device.note_off(1);
    device.note_on(2, kMiddleC, 1.0f);
    Stereo home = render(device, 0.25f, kRate);
    const double kept_level = tone_level(kept.left, 16000.0, kRate, 2400);
    const double home_level = tone_level(home.left, 4000.0, kRate, 4800);
    if (verbose) std::printf("4 kHz two octaves up: %.3f at 16 kHz against %.3f at home\n", kept_level, home_level);
    EXPECT(kept_level > 0.6 * home_level, "two octaves up keeps what fits under Nyquist");
    plain(device);
    load(device, sine(9000.0f, 2.0f, kRate, 0.5f), kRate);
    render(device, 1.0f, kRate);
    device.note_on(1, 2.0f * kMiddleC, 1.0f);
    Stereo ninth = render(device, 0.25f, kRate);
    if (verbose) std::printf("9 kHz an octave up: %.3f at 18 kHz\n", tone_level(ninth.left, 18000.0, kRate, 2400));
    EXPECT(tone_level(ninth.left, 18000.0, kRate, 2400) > 0.6 * home_level, "an octave up keeps 9 kHz");

    // The built-in sound has its levels from the start: a high key is clean.
    plain(device);
    device.set_param(p::kStart, 0.15f);
    device.set_param(p::kEnd, 0.85f);
    device.note_on(1, 8.0f * kMiddleC, 1.0f);
    Stereo top = render(device, 0.5f, kRate);
    EXPECT_NEAR(dominant_frequency(top.left, kRate, 500.0, 8000.0, 4800), 8.0 * 261.63, 2.0,
                "three octaves up the built-in sound is still at pitch");
  }

  // A new sound committed while keys are held: no click, and the new sound
  // is what plays.
  {
    plain(device);
    load(device, sine(220.0f, 1.0f, kRate, 0.5f), kRate);
    device.note_on(1, kMiddleC, 1.0f);
    device.note_on(2, 1.5f * kMiddleC, 1.0f);
    Stereo before = render(device, 0.5f, kRate);
    const double loud = 0.8 * peak(before.left, 12000);
    for (int i = 0; i < 48000; ++i) {
      Stereo one = render(device, 1.01f / kRate, kRate, 1);
      before = concat(before, one);
      if (std::fabs(one.left[0]) > loud) break;
    }
    const size_t at = before.size();
    load(device, sine(660.0f, 1.0f, kRate, 0.5f), kRate);
    Stereo after = render(device, 1.0f, kRate);
    Stereo all = concat(before, after);
    const double step_before = max_step(all.left, 12000, at);
    const double step_across = max_step(all.left, at - 2, at + 48);
    const double step_after = max_step(all.left, at + 4800);
    if (verbose)
      std::printf("commit at |out| %.3f: step %.4f before, %.4f across, %.4f after\n", std::fabs(all.left[at - 1]),
                  step_before, step_across, step_after);
    EXPECT(std::fabs(all.left[at - 1]) > 0.3, "the commit lands on a loud sample");
    EXPECT(step_across < 1.2 * step_before, "a commit mid-note does not click");
    EXPECT(max_step(all.left, at, at + 960) < 1.2 * step_after, "nor does the new sound coming in");
    EXPECT(tone_level(after.left, 660.0, kRate, 4800) > 0.2 && tone_level(after.left, 220.0, kRate, 4800) < 0.01,
           "the held keys play the new sound");

    // An empty commit is silence, not a crash; so are absurd ones.
    device.sample_commit(0, 2, kRate);
    Stereo emptied = render(device, 0.5f, kRate);
    EXPECT(finite(emptied.left) && max_step(emptied.left) < 1.2 * step_after, "an empty commit fades out without a click");
    EXPECT(peak(emptied.left, 4800, 9600) < 1.0e-4 && peak(emptied.left, 9600) == 0.0, "and is silent");
    device.note_on(3, 440.0f, 1.0f);
    device.sample_commit(-5, 0, -1.0f);
    device.sample_commit(3, 1, std::nanf(""));
    Stereo nothing = render(device, 0.5f, kRate);
    EXPECT(finite(nothing.left) && peak(nothing.left) == 0.0, "keys on an empty store are silent");
    rng_state() = 0xB0B0u;
    std::vector<float> burst = noise(0.05f, kRate, 0.5f);
    load(device, burst, burst, 22050.0f);
    device.note_on(4, 440.0f, 1.0f);
    Stereo revived = render(device, 0.5f, kRate);
    EXPECT(rms(revived.left, 4800) > 0.01, "and play again once a sound arrives");
    device.sample_commit(device.sample_capacity() + 1000, 2, 1.0e9f);
    Stereo big = render(device, 0.25f, kRate);
    EXPECT(finite(big.left) && peak(big.left) < 1.01, "an oversized commit with an absurd rate is survivable");
    EXPECT(device.sample_capacity() >= 30 * 48000, "the store holds at least 30 s at 48 kHz");
  }

  // Moving Tune, Fine, Tone, Wobble or Volume while a note sounds glides.
  {
    plain(device);
    load(device, sine(220.0f, 1.0f, kRate, 0.5f), kRate);
    device.note_on(1, kMiddleC, 1.0f);
    Stereo steady = render(device, 0.5f, kRate);
    device.set_param(p::kTune, 12.0f);
    device.set_param(p::kFine, 100.0f);
    device.set_param(p::kWobble, 1.0f);
    Stereo moved = render(device, 0.5f, kRate);
    // An octave and a semitone up, the wave is 2.12 times as steep; no more.
    EXPECT(max_step(moved.left) < 2.3 * max_step(steady.left, 4800), "a Tune change glides without a click");
    EXPECT_NEAR(dominant_frequency(moved.left, kRate, 100.0, 1000.0, 12000), 466.16, 6.0, "to the new pitch");
    device.set_param(p::kVolume, -30.0f);
    device.set_param(p::kTone, 400.0f);
    Stereo quiet = render(device, 0.5f, kRate);
    EXPECT(max_step(quiet.left) < 1.1 * max_step(moved.left), "Volume and Tone changes do not click");
  }

  // The seventeenth key steals a voice without a click; ten keys stay clean.
  {
    plain(device);
    load(device, sine(220.0f, 1.0f, kRate, 0.5f), kRate);
    device.set_param(p::kVolume, -18.0f);
    for (int n = 0; n < 16; ++n) device.note_on(n, kMiddleC * std::pow(2.0f, n / 12.0f), 1.0f);
    Stereo held = render(device, 0.5f, kRate);
    device.set_param(p::kVelocity, 1.0f);
    device.note_on(16, kMiddleC * 2.0f, 0.1f);
    Stereo stolen = render(device, 0.25f, kRate);
    if (verbose) std::printf("steal: step %.4f before, %.4f after\n", max_step(held.left, 4800), max_step(stolen.left));
    EXPECT(max_step(stolen.left) < 1.2 * max_step(held.left, 4800), "stealing a voice does not click");

    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    if (verbose) std::printf("ten keys: peak %.2f\n", std::max(peak(out.left), peak(out.right)));
    EXPECT(peak(out.left) < 0.9 && peak(out.right) < 0.9, "ten keys stay under the clip knee region");
  }

  // What a commit costs: the whole store, stereo. It runs between blocks on
  // the audio thread, so it has to be short; the mip levels follow later.
  {
    device.init(kRate);
    const int capacity = device.sample_capacity();
    float* buffer = device.sample_buffer();
    for (int i = 0; i < capacity; ++i) buffer[i] = buffer[capacity + i] = 0.25f * white();
    const auto begin = std::chrono::steady_clock::now();
    device.sample_commit(capacity, 2, kRate);
    const double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - begin).count();
    std::printf("sampler commit of %.1f s stereo: %.2f ms (native)\n", capacity / kRate, ms);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    report_cost("sampler (8 keys, mips building)", 2.0f, kRate, [&] { render(device, 2.0f, kRate); });
  }

  // Cost with eight and with every voice sounding, on the built-in sound.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("sampler (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.7f);
  report_cost("sampler (16 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("sampler");
}
