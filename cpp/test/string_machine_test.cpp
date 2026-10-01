// Native harness for String Machine (cpp/devices/string-machine). The
// conformance pass covers silence before and after notes, voice stealing
// under a pile of keys, parameter abuse and other sample rates; the rest
// asserts what makes it a string machine.

#include "../devices/string-machine/string_machine.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::StringMachine;
namespace p = livemix::string_machine;

static StringMachine device;

static const float kRate = 48000.0f;

// A dry, fast, steady voice: no ensemble, drift or slow envelope in the way.
static void dry(StringMachine& d) {
  d.init(kRate);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kAttack, 0.005f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kLow, 0.0f);
  d.set_param(p::kHigh, 0.0f);
  d.set_param(p::kTone, 12000.0f);
  d.set_param(p::kVolume, 0.0f);
}

int main() {
  Conformance spec;
  spec.name = "string-machine";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // It plays the pitch it is asked for.
  {
    dry(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double hz = dominant_frequency(out.left, kRate, 100.0, 1000.0, 24000);
    EXPECT_NEAR(hz, 220.0, 0.5, "the 8' rank sounds at the played frequency");
    EXPECT(tone_level(out.left, 440.0, kRate, 24000) > 0.2 * tone_level(out.left, 220.0, kRate, 24000),
           "a sawtooth: the second harmonic is strong");
  }

  // Cello adds the octave below, Violin the octave above.
  {
    dry(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo plain = render(device, 0.5f, kRate);
    dry(device);
    device.set_param(p::kLow, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo cello = render(device, 0.5f, kRate);
    EXPECT(tone_level(plain.left, 110.0, kRate, 12000) < 0.002, "no 16' rank with Cello at 0");
    EXPECT(tone_level(cello.left, 110.0, kRate, 12000) > 0.02, "Cello adds the octave below");

    dry(device);
    device.set_param(p::kHigh, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo violin = render(device, 0.5f, kRate);
    // 660 Hz is a harmonic of the 8' only; 440 Hz gains the 4' fundamental.
    EXPECT(tone_level(violin.left, 440.0, kRate, 12000) > 1.5 * tone_level(plain.left, 440.0, kRate, 12000),
           "Violin adds the octave above");
  }

  // Attack and release are the times they say.
  {
    dry(device);
    device.set_param(p::kAttack, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 2.0f, kRate);
    const double early = rms(rise.left, 0, 4800);
    const double full = rms(rise.left, 72000, 96000);
    EXPECT(early < 0.35 * full, "a 1 s attack is still quiet after 100 ms");
    EXPECT(rms(rise.left, 52800, 57600) > 0.9 * full, "and has arrived shortly after 1 s");
    device.note_off(1);
    Stereo fall = render(device, 3.0f, kRate);
    EXPECT(rms(fall.left, 19200, 24000) > 0.01 * full, "a 1 s release is still audible at 0.45 s");
    EXPECT(rms(fall.left, 48000, 52800) < 0.002 * full, "is 60 dB down after its time");
    EXPECT(peak(fall.left, 96000, 144000) == 0.0, "and is exactly silent soon after");
  }

  // Tone darkens.
  {
    dry(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo bright = render(device, 0.5f, kRate);
    dry(device);
    device.set_param(p::kTone, 400.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo dark = render(device, 0.5f, kRate);
    EXPECT(tone_level(dark.left, 3520.0, kRate, 12000) < 0.05 * tone_level(bright.left, 3520.0, kRate, 12000),
           "Tone removes the highs");
    EXPECT(tone_level(dark.left, 220.0, kRate, 12000) > 0.8 * tone_level(bright.left, 220.0, kRate, 12000),
           "and leaves the fundamental");
  }

  // The ensemble makes it wide and moving; without it the output is mono.
  {
    dry(device);
    device.note_on(1, 220.0f, 1.0f);
    Stereo mono = render(device, 2.0f, kRate);
    EXPECT(mono.left == mono.right, "Ensemble 0 is mono");

    dry(device);
    device.set_param(p::kEnsemble, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo wide = render(device, 4.0f, kRate);
    const double side = correlation(wide.left, wide.right, 48000);
    EXPECT(side < 0.97, "the ensemble decorrelates left and right");
    // Movement: the level of the fundamental breathes over time.
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = 48000; from + 9600 <= wide.left.size(); from += 4800) {
      const double level = tone_level(wide.left, 3520.0, kRate, from, from + 9600);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi > 1.15 * lo, "the ensemble modulates the upper harmonics");

    dry(device);
    device.set_param(p::kEnsemble, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo narrow = render(device, 1.0f, kRate);
    EXPECT(correlation(narrow.left, narrow.right, 24000) > 0.9999, "Width 0 folds the ensemble to the centre");
  }

  // Drift detunes held keys against each other (slow beating), and is
  // different per key.
  {
    dry(device);
    device.set_param(p::kDrift, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 220.0f, 1.0f);
    Stereo out = render(device, 8.0f, kRate);
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = 24000; from + 12000 <= out.left.size(); from += 6000) {
      const double level = rms(out.left, from, from + 12000);
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    EXPECT(hi > 1.2 * lo, "two keys on one pitch beat against each other with Drift");
  }

  // Loudness follows velocity, and one key sits at a sane level.
  {
    dry(device);
    device.set_param(p::kVolume, -9.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo loud = render(device, 0.5f, kRate);
    dry(device);
    device.set_param(p::kVolume, -9.0f);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 0.5f, kRate);
    EXPECT(rms(soft.left, 12000) < 0.6 * rms(loud.left, 12000), "soft keys are quieter");
    const double level_db = db(peak(loud.left, 12000));
    EXPECT(level_db > -30.0 && level_db < -12.0, "one key at the default volume peaks between -30 and -12 dBFS");
  }

  // Ten held keys stay clean: the soft clip is not reached at the default volume.
  {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    EXPECT(peak(out.left) < 0.9 && peak(out.right) < 0.9, "ten keys stay under the clip knee region");
  }

  // Cost with every voice sounding.
  device.init(kRate);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("string-machine (16 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("string-machine");
}
