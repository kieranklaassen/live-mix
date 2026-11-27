#pragma once

// The gongs, the cases and the escapements of Clock Room as tables. A gong
// is sixteen modes: where each lies as the metal is bent (`bent`), where it
// lies when the maker has tuned it (`just`), how loud a strike wakes it, how
// long it rings as a share of Decay, how much of a rub it takes, and how far
// it stands from its place in hertz, for pairs that warble. Mode 0 is the
// tone an octave under the note, which the wall wakes; mode 1 is the note.
// The first four are the gong's low part, the rest its high part.

namespace livemix {
namespace clock_room_tables {

constexpr int kModes = 16;
constexpr int kNumGongs = 5;
constexpr int kNumCases = 4;
constexpr int kNumEscapements = 5;

struct Mode {
  float bent, just, level, keep, rub, off;
};

struct Gong {
  float decay;   // against the knob
  float attack;  // how long a hammer rests on it, against the coil's
  float bloom;   // how much of the late rise it has
  float from;    // the ratio it begins at
  float dark;    // how soon the late rise falls off towards the top
  float knock;   // how much of the hammer itself is heard
  float root;    // how much more of the note itself its high keys have
  Mode modes[kModes];
};

inline const Gong& gong(int which) {
  static const Gong kGongs[kNumGongs] = {
      // Coil: a flat spiral of steel wire. Deep, soft, with a low tone under it.
      {1.0f, 1.0f, 0.65f, 1.7f, 0.06f, 0.7f, 0.1f,
       {{0.46f, 0.5f, 0.20f, 0.9f, 0.22f, 0.0f},
        {1.0f, 1.0f, 0.62f, 0.85f, 0.80f, 0.0f},
        {1.38f, 1.5f, 0.15f, 0.62f, 0.22f, 0.0f},
        {2.16f, 2.0f, 0.46f, 0.68f, 0.46f, 0.0f},
        {3.31f, 3.0f, 0.36f, 0.56f, 0.34f, 0.0f},
        {4.45f, 4.0f, 0.32f, 0.48f, 0.30f, 0.0f},
        {4.82f, 5.0f, 0.18f, 0.38f, 0.16f, 0.0f},
        {5.74f, 6.0f, 0.24f, 0.34f, 0.18f, 0.0f},
        {7.31f, 7.5f, 0.16f, 0.26f, 0.10f, 0.0f},
        {8.66f, 9.0f, 0.15f, 0.22f, 0.08f, 0.0f},
        {9.94f, 9.94f, 0.10f, 0.14f, 0.03f, 0.0f},
        {11.5f, 11.5f, 0.08f, 0.12f, 0.02f, 0.0f},
        {13.2f, 13.2f, 0.07f, 0.10f, 0.02f, 0.0f},
        {15.1f, 15.1f, 0.06f, 0.08f, 0.01f, 0.0f},
        {17.2f, 17.2f, 0.05f, 0.07f, 0.0f, 0.0f},
        {19.6f, 19.6f, 0.04f, 0.06f, 0.0f, 0.0f}}},
      // Straight rod: one thick rod screwed to a block. Few modes, far apart, and no low tone.
      {3.2f, 0.6f, 0.35f, 1.7f, 0.045f, 0.9f, 0.0f,
       {{0.5f, 0.5f, 0.0f, 1.0f, 0.0f, 0.0f},
        {1.0f, 1.0f, 0.66f, 1.0f, 0.90f, 0.0f},
        {1.0f, 1.0f, 0.24f, 0.9f, 0.40f, 0.34f},
        {2.0f, 2.0f, 0.01f, 0.66f, 0.01f, 0.0f},
        {2.76f, 3.0f, 0.16f, 0.60f, 0.14f, 0.0f},
        {5.40f, 6.0f, 0.80f, 0.5f, 0.34f, 0.0f},
        {8.93f, 8.0f, 0.08f, 0.20f, 0.02f, 0.0f},
        {13.3f, 12.0f, 0.36f, 0.14f, 0.07f, 0.0f},
        {3.0f, 3.0f, 0.06f, 0.5f, 0.06f, 0.5f},
        {6.0f, 6.0f, 0.16f, 0.4f, 0.1f, -0.7f},
        {18.6f, 18.6f, 0.12f, 0.07f, 0.0f, 0.0f},
        {24.8f, 24.8f, 0.05f, 0.05f, 0.0f, 0.0f},
        {12.1f, 12.1f, 0.06f, 0.1f, 0.0f, 1.0f},
        {29.0f, 29.0f, 0.04f, 0.04f, 0.0f, 0.0f},
        {33.0f, 33.0f, 0.03f, 0.04f, 0.0f, 0.0f},
        {38.0f, 38.0f, 0.02f, 0.03f, 0.0f, 0.0f}}},
      // Cup: a small round bell on a post. Pairs that warble, high and soon gone.
      {0.36f, 0.45f, 0.5f, 1.7f, 0.02f, 1.2f, 0.9f,
       {{0.5f, 0.5f, 0.0f, 1.0f, 0.0f, 0.0f},
        {1.0f, 1.0f, 0.26f, 1.0f, 0.30f, -0.8f},
        {1.0f, 1.0f, 0.24f, 0.95f, 0.28f, 0.9f},
        {2.11f, 2.0f, 0.42f, 0.8f, 0.40f, -1.6f},
        {2.11f, 2.0f, 0.36f, 0.75f, 0.36f, 1.8f},
        {3.31f, 3.0f, 0.06f, 0.5f, 0.06f, 0.0f},
        {4.36f, 4.0f, 0.60f, 0.6f, 0.36f, -2.4f},
        {4.36f, 4.0f, 0.50f, 0.55f, 0.30f, 2.6f},
        {5.9f, 6.0f, 0.34f, 0.40f, 0.18f, 0.0f},
        {7.4f, 8.0f, 0.44f, 0.34f, 0.18f, -2.0f},
        {7.4f, 8.0f, 0.34f, 0.32f, 0.14f, 2.2f},
        {11.2f, 11.2f, 0.26f, 0.20f, 0.06f, 0.0f},
        {13.4f, 13.4f, 0.20f, 0.16f, 0.03f, 0.0f},
        {15.9f, 15.9f, 0.15f, 0.12f, 0.02f, 0.0f},
        {18.4f, 18.4f, 0.11f, 0.10f, 0.0f, 0.0f},
        {21.2f, 21.2f, 0.08f, 0.08f, 0.0f, 0.0f}}},
      // Tube: a hanging tube. Nearly all of it lies over the note, in octaves and fifths.
      {1.4f, 0.8f, 0.4f, 1.7f, 0.06f, 0.4f, 9.0f,
       {{0.5f, 0.5f, 0.0f, 1.0f, 0.0f, 0.0f},
        {1.0f, 1.0f, 0.05f, 0.9f, 0.06f, 0.0f},
        {2.0f, 2.0f, 0.58f, 1.0f, 0.62f, 0.0f},
        {2.93f, 3.0f, 0.60f, 0.85f, 0.60f, 0.0f},
        {4.25f, 4.0f, 0.54f, 0.66f, 0.42f, 0.0f},
        {5.43f, 5.333f, 0.26f, 0.46f, 0.15f, 0.0f},
        {6.79f, 6.0f, 0.22f, 0.38f, 0.12f, 0.0f},
        {8.21f, 8.0f, 0.22f, 0.30f, 0.08f, 0.0f},
        {9.72f, 9.72f, 0.12f, 0.20f, 0.03f, 0.0f},
        {11.3f, 11.3f, 0.10f, 0.16f, 0.02f, 0.0f},
        {12.9f, 12.9f, 0.08f, 0.12f, 0.02f, 0.0f},
        {14.6f, 14.6f, 0.06f, 0.10f, 0.0f, 0.0f},
        {16.4f, 16.4f, 0.05f, 0.08f, 0.0f, 0.0f},
        {18.3f, 18.3f, 0.04f, 0.06f, 0.0f, 0.0f},
        {20.3f, 20.3f, 0.03f, 0.05f, 0.0f, 0.0f},
        {22.4f, 22.4f, 0.03f, 0.04f, 0.0f, 0.0f}}},
      // Nested: coils inside coils. A low stack of fifths, and a wide wash far over it that comes late.
      {1.65f, 3.1f, 2.4f, 0.3f, 0.012f, 0.3f, 0.0f,
       {{0.44f, 0.5f, 0.62f, 1.0f, 0.72f, 0.0f},
        {0.69f, 0.75f, 0.30f, 0.9f, 0.36f, 0.0f},
        {1.0f, 1.0f, 0.42f, 0.95f, 0.56f, 0.0f},
        {1.42f, 1.5f, 0.30f, 0.85f, 0.40f, 0.0f},
        {2.37f, 2.25f, 0.10f, 0.62f, 0.12f, 0.4f},
        {3.12f, 3.0f, 0.12f, 0.6f, 0.14f, 0.0f},
        {4.4f, 4.5f, 0.10f, 0.6f, 0.12f, 0.0f},
        {5.1f, 6.0f, 0.3f, 0.6f, 0.323f, 0.6f},
        {6.2f, 6.75f, 0.3f, 0.6f, 0.304f, -0.8f},
        {7.4f, 7.4f, 0.33f, 0.58f, 0.285f, 0.0f},
        {8.3f, 9.0f, 0.33f, 0.55f, 0.285f, 0.0f},
        {9.6f, 9.6f, 0.36f, 0.52f, 0.266f, 0.0f},
        {11.1f, 11.1f, 0.36f, 0.48f, 0.247f, 0.0f},
        {12.7f, 12.7f, 0.33f, 0.44f, 0.228f, 0.0f},
        {14.9f, 14.9f, 0.3f, 0.4f, 0.19f, 0.0f},
        {17.3f, 17.3f, 0.24f, 0.36f, 0.152f, 0.0f}}},
  };
  return kGongs[which < 0 ? 0 : (which >= kNumGongs ? kNumGongs - 1 : which)];
}

// A case: three filters, a short box of four reflections, and what a tick
// sounds like in it.
struct Case {
  float low_hz, low_db;
  float mid_hz, mid_q, mid_db;
  float high_hz, high_db;
  float send, feedback, damp_hz;
  float tick_hz, tick_q, tick_gain;
  float gain;
  float ring;  // how long a gong rings in it, against Decay
};

inline const Case& room_case(int which) {
  static const Case kCases[kNumCases] = {
      {230.0f, 2.5f, 480.0f, 0.8f, 2.0f, 2000.0f, -9.0f, 0.24f, 0.55f, 1800.0f, 1150.0f, 6.0f, 2.6f, 1.0f, 1.0f},  // oak
      {260.0f, -13.0f, 1600.0f, 0.5f, 3.0f, 2300.0f, 4.8f, 0.03f, 0.30f, 6000.0f, 2100.0f, 10.0f, 0.5f, 1.0f, 0.38f},  // marble
      {440.0f, -14.0f, 1200.0f, 1.3f, 8.5f, 3000.0f, -6.0f, 0.85f, 0.93f, 4500.0f, 1900.0f, 20.0f, 1.8f, 0.8f, 1.1f},  // iron
      {900.0f, -18.0f, 2800.0f, 0.8f, 4.0f, 4200.0f, 1.5f, 0.42f, 0.80f, 9000.0f, 4600.0f, 18.0f, 0.3f, 0.85f, 1.8f},  // glass dome
  };
  return kCases[which < 0 ? 0 : (which >= kNumCases ? kNumCases - 1 : which)];
}

// What an escapement does in one swing of the pendulum, as a list of touches:
// when (of a swing), which rod (0 or 1), how hard, how much harder than the
// hammer is set, and how much of the touch the other rod feels.
struct Touch {
  float at;
  int rod;
  float force, edge, other;
};
struct Escapement {
  float low;   // how much of the note itself its hammers wake
  float tilt;  // how far its hammers lean to the upper modes, a power of the ratio
  float ring;  // how long the gong rings under it, against Decay
  float glow;  // how much of the rub it lets through
  float bloom; // and of the late rise
  float knock; // how much of its hammer is heard
  int touches;
  Touch list[5];
};

inline const Escapement& escapement(int which) {
  static const Escapement kEscapements[kNumEscapements] = {
      // Verge: a light quick knock to and fro, never even.
      {0.2f, 1.0f, 0.22f, 0.4f, 0.25f, 1.9f, 5,
       {{0.0f, 0, 0.70f, 0.30f, 0.1f},
        {0.22f, 1, 0.36f, 0.42f, 0.0f},
        {0.36f, 0, 0.48f, 0.36f, 0.0f},
        {0.63f, 1, 0.60f, 0.30f, 0.0f},
        {0.79f, 0, 0.30f, 0.45f, 0.0f}}},
      // Anchor: one rod on the swing, the other on the way back.
      {1.0f, 0.0f, 1.0f, 1.0f, 1.0f, 0.7f, 2, {{0.0f, 0, 1.0f, 0.0f, 0.3f}, {0.5f, 1, 0.72f, -0.06f, 0.2f}}},
      // Deadbeat: one clean blow on both rods, and a brake before the next.
      {0.9f, 0.0f, 0.55f, 0.3f, 0.3f, 1.4f, 1, {{0.0f, 0, 1.25f, 0.34f, 0.9f}}},
      // Chime hammer: nothing but the key's own strike and its answer.
      {0.7f, 0.5f, 0.75f, 0.06f, 1.2f, 1.2f, 0, {}},
      // Rub only: at most a hand laid on again with each swing.
      {1.0f, -0.3f, 2.0f, 1.0f, 0.0f, 0.2f, 1, {{0.0f, 0, 0.45f, -0.25f, 0.7f}}},
  };
  return kEscapements[which < 0 ? 0 : (which >= kNumEscapements ? kNumEscapements - 1 : which)];
}

}  // namespace clock_room_tables
}  // namespace livemix
