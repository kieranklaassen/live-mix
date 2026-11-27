#pragma once

// The six metals of Climbing Gong: where the eighteen tones of a key stand,
// as ratios of the key. Tones 0 to 5 are the ground register (the lowest is
// always the key), then come three registers of four. Every tone is a pair of
// modes (the pair's split is Shimmer), so a key is 36 modes.
//
// Each tuned metal is closed under the sums the registers feed upward: two
// tones of a lower register add up to one of the next, so what the climb
// makes lands on the metal. What does not land falls between modes that are a
// fraction of a hertz wide and is not heard.

namespace livemix {
namespace climbing_gong_metal {

constexpr int kTones = 18;
constexpr int kGroundTones = 6;

enum Metal : int { kFifths = 0, kHarmonic, kSixths, kGolden, kSilver, kPlate, kNumMetals };

struct Spec {
  float ratio[kTones];
  // How loud each ground tone is in a stroke before the beater and the place.
  float ground[kGroundTones];
  // A tone that would stand too high for the ear is brought down by this
  // ratio, which keeps it on the metal.
  float fold;
  // How far the pairs of this metal stand apart, against Shimmer.
  float split;
  // Evens out how loud the metals are.
  float gain;
  // Where a metal leans: a power of the ratio on what a stroke gives above the key.
  float lean;
  // How far each rung may come, against the law.
  float reach[3];
  // How long the low and the high tones ring, against Low ring and High ring.
  float low_ring, high_ring;
  // How much rush is in the climb whatever Roar says.
  float rush;
  // How long a beater rests on it, against the beater's own time.
  float contact;
  // How far its tones spread, against Width, and how long it climbs, against Climb time.
  float wide, pace;
};

inline const Spec& spec(int metal) {
  static const Spec kSpecs[kNumMetals] = {
      // Fifths: octaves, fifths and ninths and nothing else.
      {{1.0f, 1.5f, 2.0f, 2.25f, 3.0f, 4.0f,  //
        4.5f, 6.0f, 8.0f, 9.0f,               //
        12.0f, 13.5f, 16.0f, 18.0f,           //
        24.0f, 27.0f, 32.0f, 36.0f},
       {1.30f, 0.70f, 0.50f, 0.08f, 0.41f, 0.15f},
       2.0f, 0.91f, 1.00f, -0.20f, {1.05f, 1.20f, 1.70f}, 0.90f, 0.90f, 0.00f, 1.30f, 1.11f, 0.80f},
      // Harmonic: the plain series without its sevenths.
      {{1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f,  //
        8.0f, 9.0f, 10.0f, 12.0f,            //
        15.0f, 16.0f, 18.0f, 20.0f,          //
        24.0f, 25.0f, 30.0f, 32.0f},
       {1.50f, 0.30f, 0.20f, 0.10f, 0.08f, 0.06f},
       2.0f, 0.43f, 1.00f, -0.60f, {2.20f, 2.40f, 3.00f}, 1.60f, 2.40f, 0.00f, 1.60f, 0.60f, 0.65f},
      // Sixths: a sixth and a fourth inside every octave.
      {{1.0f, 1.6666667f, 2.0f, 2.6666667f, 3.3333333f, 5.0f,  //
        5.3333333f, 6.6666667f, 8.0f, 10.0f,                   //
        10.666667f, 13.333333f, 16.0f, 20.0f,                  //
        21.333333f, 26.666667f, 32.0f, 40.0f},
       {1.50f, 0.50f, 0.06f, 0.30f, 0.06f, 0.06f},
       2.0f, 2.60f, 1.12f, -0.40f, {0.55f, 0.50f, 0.50f}, 0.45f, 0.40f, 0.00f, 1.60f, 0.60f, 1.60f},
      // Golden: whole numbers of one and the golden mean.
      {{1.0f, 1.6180340f, 2.6180340f, 3.2360680f, 4.2360680f, 5.2360680f,  //
        6.8541020f, 8.4721360f, 9.4721360f, 11.0901699f,                   //
        13.7082039f, 15.3262379f, 17.9442719f, 20.5623059f,                //
        22.1803399f, 24.7983739f, 29.0344419f, 33.2705098f},
       {0.15f, 0.50f, 0.26f, 0.23f, 1.50f, 1.50f},
       2.6180340f, 1.01f, 1.48f, 1.20f, {0.67f, 0.60f, 0.60f}, 0.65f, 2.40f, 0.00f, 0.30f, 1.20f, 1.80f},
      // Silver: whole numbers of one and the root of two; glass more than bronze.
      {{1.0f, 2.4142136f, 2.8284271f, 3.4142136f, 4.8284271f, 5.8284271f,  //
        6.8284271f, 8.2426407f, 9.6568542f, 11.6568542f,                   //
        14.0710678f, 16.4852814f, 19.3137085f, 23.3137085f,                //
        28.1421356f, 33.9705627f, 39.7989899f, 46.6274170f},
       {0.07f, 0.43f, 0.06f, 0.06f, 0.06f, 1.50f},
       2.4142136f, 0.49f, 1.23f, 1.30f, {0.55f, 2.40f, 3.00f}, 0.45f, 1.90f, 0.00f, 0.30f, 0.60f, 0.50f},
      // Plate: an untuned flat plate, where hardly anything lands and the climb is mostly rush.
      {{1.0f, 1.2730f, 1.7300f, 2.3280f, 2.8970f, 3.9100f,  //
        4.1100f, 5.0700f, 6.3000f, 7.4200f,                 //
        8.9300f, 10.3600f, 12.1900f, 14.6300f,              //
        16.9100f, 20.7700f, 25.3100f, 30.1900f},
       {0.15f, 0.11f, 0.06f, 1.34f, 1.36f, 0.14f},
       2.0f, 1.65f, 1.42f, 0.80f, {1.13f, 2.40f, 3.00f}, 1.60f, 2.40f, 0.90f, 0.30f, 1.18f, 0.50f},
  };
  return kSpecs[metal < 0 ? 0 : (metal >= kNumMetals ? kNumMetals - 1 : metal)];
}

}  // namespace climbing_gong_metal
}  // namespace livemix
