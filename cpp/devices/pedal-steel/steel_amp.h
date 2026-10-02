#pragma once

// What stands between the steel's strings and the room: the pickup's own
// resonance, a clean amplifier and a guitar speaker. One instance serves
// every voice.
//
//   in ─► pickup resonance ─► headroom ─► mid scoop ─► speaker ─► out
//
// - The pickup's coil and the cable form a resonant low-pass: flat, a peak of
//   a few dB, then 12 dB per octave down. `set_tone` moves the peak.
// - The amplifier is clean, as a steel's is: exactly linear for a note or a
//   small chord (so a chord does not smear into difference tones), with a
//   soft ceiling that rounds ten strings picked hard. Then the scoop a clean
//   guitar amplifier's tone controls cut around 500 Hz.
// - The speaker has nothing below about 90 Hz, a broad lift near 2.5 kHz and
//   very little above 6 kHz. Without it a pickup sounds like a wire.
//
// The corner frequencies are those of the instrument family, not of one
// amplifier: this is not a circuit model.

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace pedal_steel {

class SteelAmp {
 public:
  static constexpr float kResonanceQ = 1.6f;  // a peak of about 4 dB
  static constexpr float kScoopHz = 500.0f;
  static constexpr float kScoopDb = -4.0f;
  static constexpr float kSpeakerLowHz = 90.0f;
  static constexpr float kPresenceHz = 2500.0f;
  static constexpr float kPresenceDb = 3.0f;
  static constexpr float kSpeakerHighHz = 6000.0f;
  // Where the amplifier runs out of headroom: 1 / kDrive is its ceiling and
  // half of that is as far as it is exactly linear.
  static constexpr float kDrive = 0.8f;

  void init(float sample_rate) {
    sample_rate_ = sample_rate;
    resonance_.reset();
    scoop_.reset();
    low_.reset();
    presence_.reset();
    high_[0].reset();
    high_[1].reset();
    scoop_.set_peak(kScoopHz, 0.7f, kScoopDb, sample_rate);
    low_.set_highpass(kSpeakerLowHz, kit::kSqrtHalf, sample_rate);
    presence_.set_peak(kPresenceHz, 0.8f, kPresenceDb, sample_rate);
    // Two sections of a fourth-order Butterworth low-pass.
    high_[0].set_lowpass(kSpeakerHighHz, 0.5412f, sample_rate);
    high_[1].set_lowpass(kSpeakerHighHz, 1.3066f, sample_rate);
    set_tone(3200.0f);
  }

  // The pickup's resonant frequency. Safe to move while sounding.
  void set_tone(float hz) { resonance_.set(hz, kResonanceQ, sample_rate_); }

  float process(float x) {
    x = resonance_.lowpass(x);
    x = kit::soft_clip(x * kDrive) * (1.0f / kDrive);
    x = low_.process(scoop_.process(x));
    return high_[1].process(high_[0].process(presence_.process(x)));
  }

 private:
  kit::Svf resonance_;
  kit::Biquad scoop_, low_, presence_;
  kit::Biquad high_[2];
  float sample_rate_ = 48000.0f;
};

}  // namespace pedal_steel
}  // namespace livemix
