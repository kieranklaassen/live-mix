#pragma once

// The reeds of Common Air as a bank of lanes, four at a time with the vector
// instructions.
//
// A reed is a turning pair (cosine, sine), and the air it lets through is the
// closed form of a train of pulses, sum of r^n cos(n phase), taken twice: once
// as the reed swings out through its slot and once, `gap` of a turn later, as
// it swings back, at `back` times the height. A sine is the body of the sound.
// r is kept where the train has died away before the top of the band, so
// nothing folds and nothing has to be oversampled.
//
// All lanes breathe from one root. What they let through together, smoothed
// by the room the root has, pushes the pressure there up and down at the
// speed of the sound itself; each reed feels that through a small air volume
// of its own and lets more or less through. That is the only place where the
// keys meet at audio rate, and it is what makes sum and difference tones.

#include "../../kit/kit.h"

namespace livemix {
namespace common_air {

constexpr int kVoices = 16;
constexpr int kLanes = 2 * kVoices;  // a lane for each key and one for its second reed
constexpr int kMaxChunk = 160;        // control period at 192 kHz, with room

struct ReedShape {
  float gap;     // turns between the swing out and the swing back
  float back;    // height of the second pulse against the first
  float body;    // sine added
  float slope;   // how fast the harmonics fall, nepers each at 220 Hz
  float tine;    // how much of the bar itself rings at a start
  float rough;   // cents of unsteadiness from one turn to the next
  float air;     // breath noise against the others
  float bend;    // how far thin air bends it
  float level;
  float flutter;  // how unsteadily it swings
  float hiss;     // how high its breath noise lies
  float need;     // the pressure under which it will not sound
  float rise;     // how its swing grows with the pressure over that
  float ring;     // how much longer than its key it sounds

  static constexpr int kFields = 14;
  float field(int i) const {
    const float all[kFields] = {gap,  back, body,  slope,   tine, rough, air,
                                bend, level, flutter, hiss, need, rise, ring};
    return all[i];
  }
};

inline const ReedShape* reed_shapes() {
  static constexpr ReedShape kShapes[4] = {
      // brass: both ways through a slot
      {0.29f, -0.52f, 0.40f, 0.175f, 0.10f, 0.0f, 0.40f, 1.0f, 1.0f, 0.0f, 1.0f, 0.04f, 0.58f, 1.0f},
      // cane: shuts once, hollow, speaks on next to nothing
      {0.50f, -0.98f, 1.70f, 0.620f, 0.00f, 0.6f, 0.34f, 1.2f, 0.95f, 0.15f, 0.4f, 0.01f, 0.36f, 0.4f},
      // steel: thin and stiff, with a bar behind it
      {0.075f, -1.00f, 0.05f, 0.135f, 1.00f, 0.0f, 0.25f, 0.4f, 1.0f, 0.0f, 1.8f, 0.12f, 0.95f, 2.8f},
      // paper: soft, fluttering, half breath
      {0.50f, 0.55f, 2.10f, 0.950f, 0.00f, 5.0f, 4.00f, 1.8f, 0.98f, 0.9f, 0.8f, 0.00f, 0.90f, 2.2f},
  };
  return kShapes;
}

class ReedBank {
 public:
  alignas(16) float c[kLanes], s[kLanes];      // the reed's place
  alignas(16) float dc[kLanes], ds[kLanes];    // its turn per sample
  alignas(16) float cg[kLanes], sg[kLanes];    // the turn from swing out to swing back
  alignas(16) float r[kLanes], dr[kLanes];     // the train
  alignas(16) float g[kLanes], dg[kLanes];     // level
  alignas(16) float back[kLanes], body[kLanes];
  alignas(16) float q[kLanes], qc[kLanes];     // each reed's own small air volume
  float flow[kMaxChunk][kLanes];
  alignas(16) float draw[kLanes];  // what each reed takes from the root
  float root = 0.0f;     // what the reeds leave at the root, at audio rate
  float root_coeff = 0.02f;

  void reset() {
    for (int k = 0; k < kLanes; ++k) clear(k);
    for (int i = 0; i < kMaxChunk; ++i) {
      for (int k = 0; k < kLanes; ++k) flow[i][k] = 0.0f;
    }
    root = 0.0f;
  }

  void clear(int k) {
    c[k] = 1.0f;
    s[k] = 0.0f;
    dc[k] = 1.0f;
    ds[k] = 0.0f;
    cg[k] = 1.0f;
    sg[k] = 0.0f;
    r[k] = dr[k] = 0.0f;
    g[k] = dg[k] = 0.0f;
    back[k] = body[k] = 0.0f;
    q[k] = 0.0f;
    qc[k] = 0.1f;
    draw[k] = 0.0f;
  }

  // `count` samples of lanes 0 to `keys` (a multiple of four) and, with
  // `second`, of the second reeds. `depth` is how far the root moves a reed.
  void run(int count, int keys, bool second, float depth, float depth_step) {
    for (int i = 0; i < count; ++i) {
      depth += depth_step;
      const float pressure = root / (1.0f + (root < 0.0f ? -root : root));
      lanes(0, keys, depth, pressure, flow[i]);
      float sum = 0.0f;
      for (int k = 0; k < keys; ++k) sum += draw[k];
      if (second) {
        lanes(kVoices, keys, depth, pressure, flow[i]);
        for (int k = 0; k < keys; ++k) sum += draw[kVoices + k];
      }
      root = flush_denormal(root - root_coeff * (root + kDraw * sum));
    }
  }

 private:
  static constexpr float kDraw = 20.0f;

  void lanes(int from, int count, float depth, float pressure, float* out) {
    float* __restrict__ pc = c + from;
    float* __restrict__ ps = s + from;
    float* __restrict__ pr = r + from;
    float* __restrict__ pg = g + from;
    float* __restrict__ pq = q + from;
    float* __restrict__ po = out + from;
    float* __restrict__ pt = draw + from;
    const float* __restrict__ pdc = dc + from;
    const float* __restrict__ pds = ds + from;
    const float* __restrict__ pcg = cg + from;
    const float* __restrict__ psg = sg + from;
    const float* __restrict__ pdr = dr + from;
    const float* __restrict__ pdg = dg + from;
    const float* __restrict__ pb = back + from;
    const float* __restrict__ pw = body + from;
    const float* __restrict__ pqc = qc + from;
    const int quads = count >> 2;
    for (int h = 0; h < quads; ++h) {
      for (int j = 0; j < 4; ++j) {
        const int k = 4 * h + j;
        const float nc = pc[k] * pdc[k] - ps[k] * pds[k];
        const float ns = pc[k] * pds[k] + ps[k] * pdc[k];
        pc[k] = nc;
        ps[k] = ns;
        const float cb = nc * pcg[k] - ns * psg[k];
        const float rr = pr[k] + pdr[k];
        pr[k] = rr;
        const float gg = pg[k] + pdg[k];
        pg[k] = gg;
        const float base = 1.0f + rr * rr;
        const float two = rr + rr;
        const float ahead = rr * (nc - rr) / (base - two * nc);
        const float behind = rr * (cb - rr) / (base - two * cb);
        // The little that is put on and taken off again is what lets it reach zero.
        const float qq = (pq[k] + pqc[k] * (pressure - pq[k]) + 1.0e-18f) - 1.0e-18f;
        pq[k] = qq;
        pt[k] = nc * gg;
        po[k] = (ahead + pb[k] * behind + pw[k] * nc) * gg * (1.0f + depth * qq);
      }
    }
  }
};

}  // namespace common_air
}  // namespace livemix
