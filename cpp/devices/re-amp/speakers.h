#pragma once

// The five loudspeakers of Re-amp, each a short chain of second-order
// sections (no impulse responses):
//
//   amplifier ─► motor (weakens with cone excursion) ─► high-pass with the
//   hump of the cone in its box ─► the driver's peaks and dips, with cone
//   breakup as narrow peaks and notches ─► fourth-order roll-off
//
// A speaker is described by where those sections sit; `SpeakerBank` builds
// the filters for one of them at a sample rate, measures the result on pink
// noise through a loudness weighting, and sets its gain so that every speaker
// comes out as loud as the noise went in. Two banks exist in the device so a
// change of speaker can be crossfaded.

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace re_amp_dsp {

enum SectionKind : int { kNone = 0, kHighpass, kLowpass, kPeak };

struct Section {
  int kind;
  float hz;
  float q;
  float db;  // peaks only
};

constexpr int kMaxSections = 8;
constexpr int kNumSpeakers = 5;

struct SpeakerModel {
  Section sections[kMaxSections];
  // The cone's excursion follows the signal below this corner (displacement
  // falls 12 dB an octave above the resonance)...
  float excursion_hz;
  // ...and the motor loses this much force with it: gain 1 / (1 + k·e²). The
  // lows modulate everything else, which is the growl of a small speaker
  // working hard.
  float excursion;
  // Where the cone starts to beam: the corner of the off-axis treble loss.
  float beam_hz;
  // Level against the loudness match, in dB. Narrow speakers sit a little
  // under it: matched exactly on noise they come out hot on real material,
  // which has most of its energy inside their band.
  float trim_db;
};

// Small: a 3-inch radio speaker in a plastic box. Combo: a 12-inch guitar
// speaker in an open-backed cabinet. Stack: four 12-inch speakers in a closed
// cabinet. Horn: a re-entrant public address horn. Full range: a studio
// monitor, there so the room can be used without a speaker's colour.
inline constexpr SpeakerModel kSpeakers[kNumSpeakers] = {
    {{{kHighpass, 450.0f, 1.3f, 0.0f},
      {kPeak, 700.0f, 1.4f, 2.5f},
      {kPeak, 1300.0f, 2.0f, -3.0f},
      {kPeak, 2300.0f, 2.5f, 4.0f},
      {kPeak, 3000.0f, 5.0f, -4.0f},
      {kLowpass, 3450.0f, 1.3f, 0.0f},
      {kLowpass, 3450.0f, 0.54f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f}},
     450.0f, 5.0f, 3500.0f, -2.0f},
    {{{kHighpass, 125.0f, 1.1f, 0.0f},
      {kHighpass, 95.0f, 0.6f, 0.0f},
      {kPeak, 400.0f, 1.0f, -2.5f},
      {kPeak, 2500.0f, 1.6f, 5.0f},
      {kPeak, 3500.0f, 6.0f, -5.0f},
      {kPeak, 4100.0f, 5.0f, 3.0f},
      {kLowpass, 3900.0f, 1.2f, 0.0f},
      {kLowpass, 3900.0f, 0.6f, 0.0f}},
     110.0f, 1.6f, 1800.0f, -0.5f},
    {{{kHighpass, 100.0f, 1.3f, 0.0f},
      {kHighpass, 45.0f, 0.7f, 0.0f},
      {kPeak, 550.0f, 0.8f, -6.0f},
      {kPeak, 2200.0f, 5.0f, -4.0f},
      {kPeak, 3000.0f, 1.8f, 4.0f},
      {kPeak, 4300.0f, 5.0f, 2.5f},
      {kLowpass, 3600.0f, 1.25f, 0.0f},
      {kLowpass, 3600.0f, 0.58f, 0.0f}},
     100.0f, 1.0f, 1500.0f, -0.5f},
    {{{kHighpass, 520.0f, 1.1f, 0.0f},
      {kHighpass, 460.0f, 0.7f, 0.0f},
      {kPeak, 950.0f, 3.5f, 6.0f},
      {kPeak, 1350.0f, 4.0f, -5.0f},
      {kPeak, 1900.0f, 4.0f, 5.0f},
      {kPeak, 2800.0f, 4.0f, 3.0f},
      {kLowpass, 2900.0f, 1.2f, 0.0f},
      {kLowpass, 2900.0f, 0.6f, 0.0f}},
     520.0f, 1.5f, 2000.0f, -2.5f},
    {{{kHighpass, 38.0f, 0.7f, 0.0f},
      {kPeak, 2800.0f, 1.0f, -1.0f},
      {kLowpass, 18000.0f, 0.7f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f},
      {kNone, 0.0f, 0.0f, 0.0f}},
     45.0f, 0.3f, 5000.0f, 0.0f},
};

// |H|² of a biquad at `hz`.
inline double biquad_power(const kit::Biquad& f, double hz, double sample_rate) {
  const double w = 2.0 * 3.14159265358979323846 * hz / sample_rate;
  const double c1 = std::cos(w), s1 = std::sin(w);
  const double c2 = std::cos(2.0 * w), s2 = std::sin(2.0 * w);
  const double nr = f.b0 + f.b1 * c1 + f.b2 * c2;
  const double ni = -(f.b1 * s1 + f.b2 * s2);
  const double dr = 1.0 + f.a1 * c1 + f.a2 * c2;
  const double di = -(f.a1 * s1 + f.a2 * s2);
  return (nr * nr + ni * ni) / (dr * dr + di * di);
}

class SpeakerBank {
 public:
  void reset() {
    for (int c = 0; c < 2; ++c) {
      for (kit::Biquad& filter : section_[c]) filter.reset();
      excursion_[c].reset();
    }
  }

  // Build speaker `model` (0..kNumSpeakers-1) at `sample_rate`. State is
  // left alone: reset() first when the bank is not sounding.
  void design(int model, float sample_rate) {
    model_ = kit::clamp_int(model, 0, kNumSpeakers - 1);
    const SpeakerModel& speaker = kSpeakers[model_];
    count_ = 0;
    for (int s = 0; s < kMaxSections; ++s) {
      const Section& section = speaker.sections[s];
      if (section.kind == kNone) continue;
      kit::Biquad shape;
      const float hz = kit::min(section.hz, 0.45f * sample_rate);
      if (section.kind == kHighpass) shape.set_highpass(hz, section.q, sample_rate);
      if (section.kind == kLowpass) shape.set_lowpass(hz, section.q, sample_rate);
      if (section.kind == kPeak) shape.set_peak(hz, section.q, section.db, sample_rate);
      for (int c = 0; c < 2; ++c) {
        kit::Biquad& filter = section_[c][count_];
        filter.b0 = shape.b0;
        filter.b1 = shape.b1;
        filter.b2 = shape.b2;
        filter.a1 = shape.a1;
        filter.a2 = shape.a2;
      }
      ++count_;
    }
    for (int c = 0; c < 2; ++c) excursion_[c].set(speaker.excursion_hz, 0.7f, sample_rate);
    k_ = speaker.excursion;
    gain_ = kit::db_to_gain(speaker.trim_db) / std::sqrt(static_cast<float>(loudness(sample_rate)));
  }

  int model() const { return model_; }
  float gain() const { return gain_; }

  // The linear response's power at `hz`, gain included (small signals).
  double power_at(double hz, double sample_rate) const {
    double power = static_cast<double>(gain_) * gain_;
    for (int s = 0; s < count_; ++s) power *= biquad_power(section_[0][s], hz, sample_rate);
    return power;
  }

  float process(int c, float v) {
    const float e = excursion_[c].lowpass(v);
    float y = v * gain_ / (1.0f + k_ * e * e);
    kit::Biquad* filters = section_[c];
    for (int s = 0; s < count_; ++s) y = filters[s].process(y);
    return y;
  }

 private:
  // Mean power of the sections on pink noise (equal energy per octave, 20 Hz
  // to 20 kHz) through a loudness weighting in the manner of ITU-R BS.1770:
  // a +4 dB shelf above 1.7 kHz and a high-pass at 38 Hz. Relative to what the
  // weighting alone gives, so 1 is "as loud as the input".
  double loudness(float sample_rate) const {
    kit::Biquad shelf, rumble;
    shelf.set_high_shelf(1682.0f, 4.0f, sample_rate);
    rumble.set_highpass(38.1f, 0.5f, sample_rate);
    const int points = 120;
    const double top = kit::min(20000.0f, 0.45f * sample_rate);
    double weighted = 0.0, reference = 0.0;
    for (int i = 0; i < points; ++i) {
      const double hz = 20.0 * std::pow(top / 20.0, (i + 0.5) / points);
      const double weight = biquad_power(shelf, hz, sample_rate) * biquad_power(rumble, hz, sample_rate);
      double power = 1.0;
      for (int s = 0; s < count_; ++s) power *= biquad_power(section_[0][s], hz, sample_rate);
      weighted += weight * power;
      reference += weight;
    }
    return weighted > 1.0e-12 ? weighted / reference : 1.0;
  }

  kit::Biquad section_[2][kMaxSections];
  kit::Svf excursion_[2];
  int count_ = 0;
  int model_ = 0;
  float gain_ = 1.0f;
  float k_ = 0.0f;
};

}  // namespace re_amp_dsp
}  // namespace livemix
