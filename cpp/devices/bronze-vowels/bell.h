#pragma once

// One bell of Bronze Vowels: what it keeps from tick to tick, the note ids that
// hold it, and what is done every sample.

#include "../../kit/kit.h"
#include "mouth.h"

namespace livemix {
namespace bronze {

constexpr int kLanes = 8;
constexpr int kGroups = kSlots / kLanes;
constexpr int kHolders = 16;  // note ids one bell remembers

struct Bell {
  alignas(16) float re[kSlots] = {}, im[kSlots] = {};
  float cw[kSlots] = {}, sw[kSlots] = {};
  float gl[kSlots] = {}, gr[kSlots] = {}, dl[kSlots] = {}, dr[kSlots] = {};
  float tl[kSlots] = {}, tr[kSlots] = {};      // what the gains ramp to
  float pl[kSlots] = {}, pr[kSlots] = {};      // the places between the speakers
  float ratio[kPartials] = {}, hz[kPartials] = {}, edge[kPartials] = {};
  float octave[kPartials] = {};                // log2 of the ratio
  float bare[kPartials] = {}, from[kPartials] = {}, to[kPartials] = {};
  float decay[kPartials] = {}, keep[kPartials] = {};
  float mouth[kPartials] = {}, want[kPartials] = {};  // log2 of a gain: where it is, where it goes
  float flutter[kPartials] = {}, late[kPartials] = {}, white[kPartials] = {};
  float said[bronze::kMouth] = {}, off[bronze::kMouth] = {};
  // The four formants the air goes through.
  float ic1[4] = {}, ic2[4] = {}, a1[4] = {}, a2[4] = {}, a3[4] = {}, kg[4] = {};
  float air = 0.0f, air_step = 0.0f, air_to = 0.0f;
  float puff = 0.0f, puff_step = 1.0f;         // the breath mallet's air
  float knock = 0.0f, knock_step = 1.0f;
  // The three modes of what the mallet hits besides the bell.
  float bc1[3] = {}, bc2[3] = {}, b1[3] = {}, b2[3] = {}, b3[3] = {}, bg[3] = {};
  float next1[3] = {}, next2[3] = {}, next3[3] = {}, next_gain[3] = {};  // another mallet's, taken up after a fade
  float next_knock = 0.0f, next_step = 1.0f, knock_fade = 1.0f, knock_fade_step = 0.0f;
  int swap = 0;
  float body = 0.0f;                           // how loud they are
  kit::Rng rng, air_rng, flutter_rng;
  float frequency = 440.0f;
  float at = 1.0f, attack = 0.01f, age = 0.0f;
  float fade = 1.0f, fade_step = 0.0f;         // what a steal leaves of the knock and the air
  float choke = 0.0f;                          // nepers a second, the hand on a bell let go
  float taught = 0.0f;                         // how far it has come round to another's vowel
  float lit = 0.0f;                            // how far another strike still rings it awake
  float bump = 1.0f, punch = 0.0f, punch_to = 0.0f, breathy = 0.0f;
  float position = 0.0f, pace = 1.0f, delay = 0.0f, high = 0.0f, key_pan = 0.0f;
  float follow = 0.0f;
  float pending_frequency = 440.0f, pending_gain = 0.0f;
  int pending_metal = 0, metal = 0, word = 0, look = 0, live = 0, steal = 0;
  uint32_t stamp = 0, tuned = 0, key = 0;
  int holders = 0;
  int ids[kHolders] = {};
  bool sounding = false, pending = false, struck = false, airy = false;
  bool on[kGroups] = {};

  bool released() const { return holders == 0; }

  // Everything as at first but who holds it, and since when.
  void renew() {
    Bell fresh;
    fresh.holders = holders;
    for (int i = 0; i < kHolders; ++i) fresh.ids[i] = ids[i];
    fresh.stamp = stamp;
    *this = fresh;
  }

  void hold(int id) {
    drop(id);
    if (holders == kHolders) {
      for (int i = 1; i < kHolders; ++i) ids[i - 1] = ids[i];
      --holders;
    }
    ids[holders++] = id;
  }
  bool drop(int id) {
    for (int i = 0; i < holders; ++i) {
      if (ids[i] != id) continue;
      for (int j = i + 1; j < holders; ++j) ids[j - 1] = ids[j];
      --holders;
      return true;
    }
    return false;
  }

  // --- every sample --------------------------------------------------------------

  // Four at a time in a build that does not ask for it as well.
#if defined(__EMSCRIPTEN__)
  __attribute__((target("simd128")))
#endif
  void render_partials(int n, float* __restrict left, float* __restrict right) {
    const int groups = (live + kLanes - 1) / kLanes;
    for (int g = 0; g < groups; ++g) {
      if (!on[g]) continue;
      const int at = g * kLanes;
      alignas(16) float re[kLanes], im[kLanes], cw[kLanes], sw[kLanes], gl[kLanes], gr[kLanes], dl[kLanes], dr[kLanes];
      for (int k = 0; k < kLanes; ++k) {
        re[k] = this->re[at + k];
        im[k] = this->im[at + k];
        cw[k] = this->cw[at + k];
        sw[k] = this->sw[at + k];
        gl[k] = this->gl[at + k];
        gr[k] = this->gr[at + k];
        dl[k] = this->dl[at + k];
        dr[k] = this->dr[at + k];
      }
      for (int i = 0; i < n; ++i) {
        float* __restrict out_left = left + i * kLanes;
        float* __restrict out_right = right + i * kLanes;
        for (int k = 0; k < kLanes; ++k) {
          const float turned = cw[k] * re[k] - sw[k] * im[k];
          im[k] = sw[k] * re[k] + cw[k] * im[k];
          re[k] = turned;
          gl[k] += dl[k];
          gr[k] += dr[k];
          out_left[k] += gl[k] * im[k];
          out_right[k] += gr[k] * im[k];
        }
      }
      for (int k = 0; k < kLanes; ++k) {
        this->re[at + k] = re[k];
        this->im[at + k] = im[k];
        this->gl[at + k] = gl[k];
        this->gr[at + k] = gr[k];
      }
    }
  }

  // The knock, and the air through the mouth: the first formant in the
  // middle, the others to the sides a little.
  void render_air(int n, float width, float* left, float* right) {
    if (knock > 0.0f || body > 0.0f) {
      float fade = this->fade, out = knock_fade;
      for (int i = 0; i < n; ++i) {
        fade += fade_step;
        out += knock_fade_step;
        const float x = rng.bipolar() * knock;
        knock *= knock_step;
        float y = 0.0f;
        for (int j = 0; j < 3; ++j) {
          const float v3 = x - bc2[j];
          const float v1 = b1[j] * bc1[j] + b2[j] * v3;
          const float v2 = bc2[j] + b2[j] * bc1[j] + b3[j] * v3;
          bc1[j] = 2.0f * v1 - bc1[j];
          bc2[j] = 2.0f * v2 - bc2[j];
          y += bg[j] * v1;
        }
        left[i] += y * fade * out;
        right[i] += y * fade * out;
      }
      knock_fade = out;
    }
    const float faded = fade;
    fade += fade_step * static_cast<float>(n);
    if (!airy) return;
    const float lean[4] = {0.0f, -0.45f * width, 0.6f * width, -0.75f * width};
    float gl[4], gr[4], ic1[4], ic2[4], a1[4], a2[4], a3[4];
    for (int j = 0; j < 4; ++j) {
      gl[j] = kg[j] * (1.0f - lean[j]);
      gr[j] = kg[j] * (1.0f + lean[j]);
      ic1[j] = this->ic1[j];
      ic2[j] = this->ic2[j];
      a1[j] = this->a1[j];
      a2[j] = this->a2[j];
      a3[j] = this->a3[j];
    }
    float air = this->air;
    float through = faded;
    for (int i = 0; i < n; ++i) {
      air += air_step;
      through += fade_step;
      const float x = air_rng.bipolar() * air;
      float l[4], r[4];
      for (int j = 0; j < 4; ++j) {
        const float v3 = x - ic2[j];
        const float v1 = a1[j] * ic1[j] + a2[j] * v3;
        const float v2 = ic2[j] + a2[j] * ic1[j] + a3[j] * v3;
        ic1[j] = 2.0f * v1 - ic1[j];
        ic2[j] = 2.0f * v2 - ic2[j];
        l[j] = gl[j] * v1;
        r[j] = gr[j] * v1;
      }
      left[i] += through * ((l[0] + l[1]) + (l[2] + l[3]));
      right[i] += through * ((r[0] + r[1]) + (r[2] + r[3]));
    }
    this->air = air;
    for (int j = 0; j < 4; ++j) {
      this->ic1[j] = ic1[j];
      this->ic2[j] = ic2[j];
    }
  }
};

}  // namespace bronze
}  // namespace livemix
