#pragma once

namespace livemix {
namespace dry_brush_matter {

// What the brushes and the papers of Dry Brush are made of.

constexpr int kHairs = 28;
enum Stuff : int { kHair = 0, kReed, kEdge, kFeather, kFinger, kStuffs };
enum Sheet : int { kSilk = 0, kRice, kRough, kStone, kSheets };

// Which partial each hair of a brush stands on. Copies of one partial lie
// beside each other, so they land in different places of the stereo field.
constexpr float kRatio[kStuffs][kHairs] = {
    {1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 12, 13, 14},
    {1, 1, 3, 3, 5, 5, 7, 7, 9, 9, 11, 11, 13, 13, 15, 15, 17, 17, 19, 19, 21, 21, 23, 23, 25, 25, 27, 27},
    {0.5f, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18},
    {1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 12, 12, 16, 16},
    {1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6}};
constexpr float kCopy[8] = {1.0f, 0.42f, 0.34f, 0.28f, 0.25f, 0.23f, 0.21f, 0.2f};

struct Matter {       // what a brush is made of
  float blur;         // hertz of blur on a hair's first partial
  float tone;         // how much of a wet hair is tone; the rest is blur
  float gap;          // seconds of a skip
  float rub_hz, rub_q, rub;  // the rubbing: its band and level
  float knock;        // how hard it lands on string and paper
  float pick_hz, hold, hold_high;  // the string under it: pick, ring, ring at 4 kHz
  float string;       // how loud that string is
  float thirst;       // how fast it spends its ink
  float left;         // what is left of it without ink
  float open;         // pressure its last hairs ask for
  float pace;         // how quickly it lands, as a share of Attack
  float leave;        // how deep a stain it leaves
  float bright;       // where its colour ends, against hair
  float gain;
  float air;          // rubbing that is there on the smoothest paper
  float fade;         // how quickly a struck mark of it fades
};
constexpr Matter kMatter[kStuffs] = {
    {6.0f, 0.95f, 0.060f, 2600.0f, 0.6f, 0.5f, 0.9f, 1800.0f, 2.2f, 0.35f, 1.0f, 1.0f, 1.0f, 1.25f, 1.0f, 1.0f, 1.0f, 1.0f, 0.02f, 1.0f},
    {3.0f, 0.99f, 0.035f, 3800.0f, 3.5f, 0.22f, 1.4f, 5200.0f, 3.0f, 0.85f, 1.4f, 2.0f, 0.35f, 0.95f, 0.3f, 0.6f, 3.0f, 0.74f, 0.02f, 0.75f},
    {10.0f, 0.75f, 0.085f, 600.0f, 0.6f, 0.6f, 1.1f, 1000.0f, 1.1f, 0.15f, 1.1f, 1.5f, 1.1f, 1.50f, 1.3f, 1.3f, 0.28f, 0.95f, 0.1f, 0.7f},
    {30.0f, 0.15f, 0.050f, 2300.0f, 0.5f, 0.9f, 0.25f, 3500.0f, 0.7f, 0.30f, 1.1f, 1.2f, 0.35f, 0.85f, 1.7f, 0.8f, 0.7f, 0.76f, 0.55f, 2.2f},
    {2.0f, 0.99f, 0.110f, 650.0f, 1.6f, 0.4f, 1.2f, 420.0f, 1.4f, 0.10f, 1.2f, 0.3f, 1.6f, 1.60f, 0.7f, 1.4f, 0.3f, 0.95f, 0.01f, 0.65f}};

struct Ground {       // what a paper is like
  float tooth;        // how much Grain finds on it
  float catching;     // how often a hair is caught on it
  float wander;       // hertz the stain wanders by
  float reach;        // where the stain's partials end, Hz
  float drink;        // how deep the stain is
  float thirst;       // how fast it takes the ink
  float soft;         // where it lets the stroke's colour end
  float fade;         // how quickly a struck mark fades on it
  float ring, ring_seconds, rubbed;  // the paper modes: struck, and kept up by rubbing
  float ratio[4];
  float left;         // what it leaves a hair without ink
  float rub;          // where the rubbing sits, against the brush
  float wide;         // how far apart it holds the hairs
  float thin;         // how much of the low end the sheet takes away
  float low, f1, q1, g1, f2, q2, g2, gain;  // the sheet
};
constexpr Ground kGround[kSheets] = {
    {0.75f, 0.0f, 0.9f, 3000.0f, 0.8f, 0.8f, 1.0f, 1.0f, 0.05f, 0.5f, 0.0f, {2, 3, 5, 8},
     1.0f, 1.0f, 0.8f, 0.0f, 17000.0f, 320.0f, 0.7f, -0.3f, 5500.0f, 0.5f, 1.2f, 1.0f},
    {1.2f, 0.0f, 2.0f, 700.0f, 1.6f, 1.9f, 0.28f, 1.1f, 0.25f, 0.12f, 0.0f, {1, 2, 3, 4},
     1.0f, 0.6f, 1.0f, 0.0f, 3800.0f, 210.0f, 0.6f, 0.45f, 1500.0f, 0.7f, -0.2f, 0.62f},
    {8.0f, 0.95f, 6.0f, 1800.0f, 0.8f, 2.4f, 1.0f, 1.7f, 0.0f, 0.1f, 0.0f, {1, 2, 3, 4},
     0.35f, 1.9f, 1.8f, 0.3f, 11000.0f, 950.0f, 1.3f, 2.6f, 2900.0f, 1.6f, 1.9f, 0.46f},
    {1.0f, 0.0f, 0.5f, 3500.0f, 0.6f, 0.6f, 1.1f, 0.6f, 0.9f, 2.6f, 1.2f, {1.0f, 2.756f, 5.404f, 8.933f},
     1.2f, 1.4f, 0.35f, 0.3f, 13000.0f, 150.0f, 0.7f, -0.6f, 1830.0f, 4.0f, 1.5f, 0.9f}};

}  // namespace dry_brush_matter
}  // namespace livemix
