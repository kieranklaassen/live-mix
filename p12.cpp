// Bad input samples (an instrument ignores its input: prove it), bad notes, and tuning/level per note.
#include "rv.h"
static const float R = 48000.0f;
int main() {
  for (const char* preset : {"(default)", "Hammered shimmer", "Koto pluck"}) {
    load(dev, preset, R);
    dev.note_on(1, 220.0f, 0.8f);
    Stereo clean = render(dev, 2.0f, R);
    load(dev, preset, R);
    dev.note_on(1, 220.0f, 0.8f);
    std::vector<float> in(static_cast<size_t>(2.0f * R), 0.0f);
    for (size_t i = 0; i < in.size(); ++i) in[i] = 0.3f * std::sin(0.05f * i);
    in[20000] = std::nanf("");
    in[30000] = INFINITY;
    in[40000] = 1.0e30f;
    Stereo dirty = run(dev, in);
    dev.note_off(1);
    Stereo tail = render(dev, 40.0f, R);
    std::printf("%-18s bad input: same as clean %d, finite %d, tail ends in zero %d\n", preset, dirty.left == clean.left && dirty.right == clean.right,
                finite(dirty.left) && finite(tail.left), peak(tail.left, tail.size() - 48000) == 0.0);
  }
  // level and tuning per note across the range, default patch and three presets
  for (const char* preset : {"(default)", "Open zither", "Concert harp", "Koto pluck", "Single felt string"}) {
    std::printf("%-18s note: peak dB / rms(0-0.5 s) dB / cents:", preset);
    double lo = 1e9, hi = -1e9;
    for (int note = 28; note <= 100; note += 6) {
      load(dev, preset, R);
      dev.set_param(p::kChord, 0.0f);
      dev.set_param(p::kCourses, 0.0f);
      dev.set_param(p::kSympathy, 0.0f);
      dev.note_on(1, hz_of(note), 0.7f);
      Stereo out = render(dev, 1.0f, R);
      const std::vector<float> m = mono(out);
      const double f0 = hz_of(note);
      const double got = dominant_frequency(m, R, f0 * 0.97, f0 * 1.03, 2400, 43200);
      const double r = db(rms(m, 0, 24000));
      lo = std::min(lo, r);
      hi = std::max(hi, r);
      std::printf("  %d: %.1f/%.1f/%+.1f", note, db(peak(m)), r, 1200.0 * std::log2(got / f0));
    }
    std::printf("  | rms span %.1f dB\n", hi - lo);
  }
  return 0;
}
