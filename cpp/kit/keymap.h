#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// For an instrument whose keys are things and not pitches (a drum kit: every
// C is the kick, every D the snare). A note reaches a device as a frequency;
// this says which of the twelve keys of the octave it is, which octave it was
// played in, and how far off the key it lies.
//
//   const kit::OctaveKey key = kit::octave_key(frequency);
//   start(drum_[key.key], key.semitones());   // the octave tunes the drum
//
// MIDI 60 to 71 is the octave a kit is written in: `octave` is 0 there, 1 for
// the keys above it and -1 for the ones below, so `semitones()` is how far a
// drum is tuned from where it sits. A key a few cents off (a hand's touch, a
// tape running slow) is still its key, and the cents go into the tuning.
struct OctaveKey {
  int key = 0;         // 0 (C) to 11 (B)
  int octave = 0;      // octaves from the one MIDI 60 is in
  float cents = 0.0f;  // -50 to 50

  // The tuning the octave and the cents ask for, in semitones, kept to `reach` octaves.
  float semitones(int reach = 2) const {
    const int kept = clamp_int(octave, -reach, reach);
    return static_cast<float>(kept) * 12.0f + cents * 0.01f;
  }
};

inline OctaveKey octave_key(float frequency) {
  const float note = hz_to_midi(clamp(frequency, 8.0f, 14000.0f));
  const int nearest = static_cast<int>(std::floor(note + 0.5f));
  OctaveKey out;
  out.key = ((nearest % 12) + 12) % 12;
  out.octave = (nearest - out.key) / 12 - 5;
  out.cents = (note - static_cast<float>(nearest)) * 100.0f;
  return out;
}

}  // namespace kit
}  // namespace livemix
