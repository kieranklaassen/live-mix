#pragma once

// One sounding drum of Night Drum: its state, and what is done with it every
// sample. night_drum.h decides once in kChunk samples where it should go.

#include "../../kit/kit.h"
#include "drum_tables.h"

namespace livemix {
namespace night_drum_voice {

constexpr int kChunk = 32;  // control period, samples
constexpr int kHolders = 16;  // note ids one drum remembers
using night_drum_tables::kAir;
using night_drum_tables::kCavity;
using night_drum_tables::kModes;
using night_drum_tables::kOther;
using night_drum_tables::kSlots;
constexpr float kOtherShare[kOther] = {1.0f, 0.65f, 0.42f, 0.28f};

struct Voice {
  // The bank: state, this tick's turn with its decay, what goes in (a
  // stroke, and for the air and the second skin the skin's own sound), what
  // comes out and how it moves to where it should be.
  float re[kSlots] = {}, im[kSlots] = {};
  float turn_re[kSlots] = {}, turn_im[kSlots] = {};
  float in[kSlots] = {}, from_skin[kAir] = {};
  float left[kSlots] = {}, right[kSlots] = {};
  float left_step[kSlots] = {}, right_step[kSlots] = {};
  float left_to[kSlots] = {}, right_to[kSlots] = {};
  float shade[kModes] = {};   // level of each mode by the tilt of the skin
  float clear[kModes] = {};   // and its loss by the hand
  float hz[kModes] = {};
  uint32_t shaded = 0;

  int hand = 0;
  float frequency = 220.0f, octave = 7.78f;  // Hz and its log2
  float gain = 0.0f, strength = 0.0f;
  float contact = 0.001f;                    // seconds
  float contact_a = 1.0f, low1 = 0.0f, low2 = 0.0f;
  float still = 0.0f, still_a = 0.0f;        // what is not heard of a slow push
  float nepers = 0.0f;                       // of the fundamental, a second
  float place = 0.5f, angle = 0.0f, home = 0.0f;

  int impulse_in = -1;       // samples until the stroke lands
  float impulse = 0.0f;
  float wait = 0.0f;         // seconds to the next stroke of a roll
  int fingers = 0;           // how many fingers of a single stroke are still to land
  int strokes = 0;
  float used_to = 0.0f;      // the strength the skin has got used to
  float tension = 0.0f, tension_to = 0.0f;
  float gulp = 0.0f, fresh = 0.0f;

  float spread = 1.0f;
  float side = 0.0f;         // where this drum stands in the field, -1 to 1
  float side_left = 1.0f, side_right = 1.0f, side_left_step = 0.0f, side_right_step = 0.0f;
  float rise = 0.0f;         // of Swell
  float amp = 0.0f, amp_step = 0.0f;
  float drive = 0.0f, drive_step = 0.0f;    // of a sustained hand
  float direct = 0.0f, direct_step = 0.0f;  // the sustained hand itself
  float reach = 1.0f;
  float open = 0.65f;        // of a hum, the part of a cycle the throat is open
  float slip = 0.0f;         // of a rub, what the next sample still gets
  float press = 0.0f;        // 0..1, how far the hand is on the skin
  float phase = 0.0f, phase_step = 0.0f, vibrato = 0.0f;
  float swirl = 0.0f, swirl_rate = 1.0f, swirl_peak = 1.0f;
  kit::Drift breath, wander;
  kit::Rng rng, gut;         // the hand's, and the thread's own

  kit::Svf tap, rattle;
  float tap_level = 0.0f, tap_fall = 0.0f, tap_left = 0.7f, tap_right = 0.7f, tap_low = 0.0f;
  float tap_soft = 0.0f, rough = 0.0f, rough_soft = 0.0f;
  float thread = 0.0f, thread_step = 0.0f, thread_over = 1.0f, thread_give = 1.0f, thread_low = 0.0f;

  float follow = 0.0f, weight = 0.0f;  // its level, and what it counts for among the others
  float steal = 1.0f;
  float pending_frequency = 220.0f, pending_gain = 0.0f;
  uint32_t stamp = 0;
  int aim_in = 0;
  int holders = 0;
  int ids[kHolders] = {};
  bool sounding = false, pending = false;
  bool halfway = true;                      // between two looks at where the modes stand
  bool tapping = false, threading = false;  // the tap and the thread are heard in this chunk

  bool released() const { return holders == 0; }
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
};

// The turn and the decay of every resonance, `w` in hertz and `n` in nepers a
// second. The sine and cosine are polynomials of half the angle, doubled and
// set back to length one, the same for every mode, so the loop is one the
// compiler takes four at a time.
inline void turn_bank(Voice& voice, const float* __restrict w, const float* __restrict n, float sr) {
  const float turn = 0.5f * kit::kTwoPi / sr, share = 1.0f / sr, most = kit::kPi * 0.48f;
  for (int k = 0; k < kSlots; ++k) {
    const float x0 = w[k] * turn;
    const float x = x0 < most ? x0 : most;
    const float x2 = x * x;
    const float s =
        x * (1.0f + x2 * (-1.0f / 6.0f + x2 * (1.0f / 120.0f + x2 * (-1.0f / 5040.0f + x2 * (1.0f / 362880.0f - x2 / 39916800.0f)))));
    const float c =
        1.0f + x2 * (-0.5f + x2 * (1.0f / 24.0f + x2 * (-1.0f / 720.0f + x2 * (1.0f / 40320.0f - x2 * (1.0f / 3628800.0f)))));
    const float sine = 2.0f * s * c, cosine = c * c - s * s;
    const float length = 1.5f - 0.5f * (sine * sine + cosine * cosine);
    const float d0 = n[k] * share;
    const float d = d0 < 0.5f ? d0 : 0.5f;
    const float radius = (1.0f - d * (1.0f - d * (0.5f - d * (1.0f / 6.0f)))) * length;
    voice.turn_re[k] = cosine * radius;
    voice.turn_im[k] = sine * radius;
  }
}

// The second skin is drawn after the first whatever their interval: a mode
// of it that is under its share of the first one's level grows toward it.
inline void answer(Voice& voice, float level, float answer_step) {
  if (level < 1.0e-5f) return;
  for (int j = 0; j < kOther; ++j) {
    const int k = kModes + kCavity + j;
    const float target = level * kOtherShare[j];
    float size = std::sqrt(voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k]);
    if (size >= target) continue;
    if (size < 0.003f * target) {
      size = 0.003f * target;
      voice.re[k] = size;
      voice.im[k] = 0.0f;
    }
    const float grow = 1.0f + kit::min((target - size) / size, 3.0f) * answer_step;
    voice.turn_re[k] *= grow;
    voice.turn_im[k] *= grow;
  }
}

// x goes through the contact into the skin, y is heard as the hand itself.
inline bool touch(Voice& voice, int n, float grain, float tap_rise, float* x, float* y) {
  bool heard = false;
  if (voice.impulse_in >= 0) {
    if (voice.impulse_in < n) {
      x[voice.impulse_in] += voice.impulse;
      voice.impulse_in = -1;
    } else {
      voice.impulse_in -= n;
    }
  }
  if (voice.tapping) {
    heard = true;
    const float fall = voice.tap_fall;
    float level = voice.tap_level, soft = voice.tap_soft, rough = voice.rough, rough_soft = voice.rough_soft;
    for (int i = 0; i < n; ++i) {
      level *= fall;
      rough *= fall;
      soft += (level - soft) * tap_rise;
      rough_soft += (rough - rough_soft) * tap_rise;
      const float noise = voice.rng.bipolar();
      y[i] += noise * soft;
      x[i] += noise * rough_soft;
    }
    voice.tap_level = level;
    voice.tap_soft = soft;
    voice.rough = rough;
    voice.rough_soft = rough_soft;
  } else {
    voice.tap_soft = voice.rough = voice.rough_soft = 0.0f;
  }
  if (voice.drive == 0.0f && voice.drive_step == 0.0f && voice.direct == 0.0f && voice.direct_step == 0.0f) return heard;
  if (!night_drum_tables::hand_of(voice.hand).sustained) {  // a hand that was taken off for another
    for (int i = 0; i < n; ++i) {
      voice.drive = kit::max(voice.drive + voice.drive_step, 0.0f);
      voice.direct = kit::max(voice.direct + voice.direct_step, 0.0f);
    }
    return heard;
  }
  const float dry = 0.05f + 0.5f * grain, airy = 0.02f + 2.0f * grain * std::sqrt(grain);  // the noise in a rub and in a hum
  const float closed = 1.0f / voice.open, rest = voice.open * (1.0f / 12.0f);  // of a hum
  for (int i = 0; i < n; ++i) {
    voice.drive += voice.drive_step;
    voice.direct += voice.direct_step;
    if (voice.hand == night_drum_tables::kBrush) {
      const float noise = voice.rng.bipolar();
      x[i] += noise * voice.drive;
      y[i] += noise * voice.direct;
      continue;
    }
    voice.phase += voice.phase_step;
    const bool round = voice.phase >= 1.0f;
    if (round) voice.phase -= 1.0f;
    if (voice.hand == night_drum_tables::kRub) {
      // The finger sticks and slips once a cycle, never twice alike.
      const float noise = voice.rng.bipolar();
      const float late = 1.0f - voice.phase;
      x[i] += voice.slip;
      voice.slip = 0.0f;
      if (round) {
        // Between two samples: a part now, the rest with the next one.
        const float part = voice.phase / voice.phase_step;
        const float slip = voice.drive * (1.0f + 0.35f * voice.rng.bipolar());
        x[i] += slip * part;
        voice.slip = slip * (1.0f - part);
      }
      x[i] += noise * voice.drive * dry * late;
      y[i] += noise * voice.direct * late * late;
    } else {
      // A throat: opens slowly, shuts with a corner, rests the longer the
      // harder the touch, which is what makes a voice bright.
      const float u = voice.phase * closed;
      const float flow = u < 1.0f ? u * u * (1.0f - u) : 0.0f;
      const float breath = voice.rng.bipolar() * airy * (flow + 0.02f);
      x[i] += (flow + breath) * voice.drive * 12.0f * closed;
      y[i] += (flow - rest + breath * 2.0f) * voice.direct * 6.75f;
    }
  }
  return true;
}

// Modes `from` to `to`, four at a time. `second` is what else goes in (the
// skin's own sound, for the air and the second skin).
template <bool kSecond>
inline void bank(Voice& voice, int from, int to, int n, const float* first, const float* second, float* __restrict left,
                 float* __restrict right) {
  float ol[kChunk * 4] = {}, orr[kChunk * 4] = {};
  for (int k = from; k < to; k += 4) {
    float re[4], im[4], tr[4], ti[4], in[4], in2[4], gl[4], gr[4], dl[4], dr[4];
    for (int j = 0; j < 4; ++j) {
      re[j] = voice.re[k + j];
      im[j] = voice.im[k + j];
      tr[j] = voice.turn_re[k + j];
      ti[j] = voice.turn_im[k + j];
      in[j] = voice.in[k + j];
      in2[j] = kSecond ? voice.from_skin[k + j - from] : 0.0f;
      gl[j] = voice.left[k + j];
      gr[j] = voice.right[k + j];
      dl[j] = voice.left_step[k + j];
      dr[j] = voice.right_step[k + j];
    }
    for (int i = 0; i < n; ++i) {
      const float a = first[i], b = kSecond ? second[i] : 0.0f;
      for (int j = 0; j < 4; ++j) {
        float turned = tr[j] * re[j] - ti[j] * im[j] + in[j] * a;
        if constexpr (kSecond) turned += in2[j] * b;
        im[j] = tr[j] * im[j] + ti[j] * re[j];
        re[j] = turned;
        gl[j] += dl[j];
        gr[j] += dr[j];
        ol[4 * i + j] += gl[j] * im[j];
        orr[4 * i + j] += gr[j] * im[j];
      }
    }
    for (int j = 0; j < 4; ++j) {
      voice.re[k + j] = re[j];
      voice.im[k + j] = im[j];
      voice.left[k + j] = gl[j];
      voice.right[k + j] = gr[j];
    }
  }
  for (int i = 0; i < n; ++i) {
    left[i] += (ol[4 * i] + ol[4 * i + 1]) + (ol[4 * i + 2] + ol[4 * i + 3]);
    right[i] += (orr[4 * i] + orr[4 * i + 1]) + (orr[4 * i + 2] + orr[4 * i + 3]);
  }
}

// What every drum needs to know of the moment it sounds in.
struct Moment {
  float grain = 0.0f, tap_rise = 0.1f, thread_a = 0.3f, soft_a = 0.5f, steal_step = 0.0f;
};

inline void render_voice(Voice& voice, int n, const Moment& now, float* left, float* right) {
  float x[kChunk] = {}, y[kChunk] = {}, skin[kChunk] = {};
  float out_left[kChunk] = {}, out_right[kChunk] = {};
  const bool heard = touch(voice, n, now.grain, now.tap_rise, x, y);
  const float a = voice.contact_a, sa = voice.still_a;
  float low1 = voice.low1, low2 = voice.low2, still = voice.still;
  for (int i = 0; i < n; ++i) {
    low1 += a * (x[i] - low1);
    low2 += a * (low1 - low2);
    still += sa * (low2 - still);
    x[i] = low2 - still;
  }
  voice.low1 = low1;
  voice.low2 = low2;
  voice.still = still;
  bank<false>(voice, 0, kModes, n, x, nullptr, out_left, out_right);
  for (int i = 0; i < n; ++i) skin[i] = 0.7f * (out_left[i] + out_right[i]);
  bank<true>(voice, kModes, kSlots, n, x, skin, out_left, out_right);
  if (voice.threading) {
    // The skin's own wave where it meets the thread, broken up by its rattle.
    for (int i = 0; i < n; ++i) {
      voice.thread = kit::max(voice.thread + voice.thread_step, 0.0f);
      const float over = skin[i] - voice.thread_over;
      const float hit = over > 0.0f ? over / (1.0f + over * voice.thread_give) * (0.4f + 0.6f * voice.gut.bipolar()) : 0.0f;
      const float buzz = voice.rattle.bandpass(hit) * voice.thread;
      voice.thread_low += now.thread_a * (buzz - voice.thread_low);
      out_left[i] += voice.thread_low;
      out_right[i] += voice.thread_low;
    }
  } else {
    voice.thread = 0.0f;
  }
  if (heard || voice.tap.ic1 != 0.0f || voice.tap.ic2 != 0.0f) {
    // The band of the hand, and a soft top on it: skin, not hiss.
    const float top = now.soft_a, to_left = voice.tap_left, to_right = voice.tap_right;
    float low = voice.tap_low;
    kit::Svf tap = voice.tap;
    for (int i = 0; i < n; ++i) {
      low += top * (tap.bandpass(y[i]) - low);
      out_left[i] += low * to_left;
      out_right[i] += low * to_right;
    }
    voice.tap = tap;
    voice.tap_low = low;
  }
  const float amp_step = voice.amp_step, left_step = voice.side_left_step, right_step = voice.side_right_step;
  const float steal_step = voice.pending ? now.steal_step : 0.0f;
  float amp = voice.amp, side_left = voice.side_left, side_right = voice.side_right, steal = voice.pending ? voice.steal : 1.0f;
  for (int i = 0; i < n; ++i) {
    amp += amp_step;
    steal = kit::max(steal - steal_step, 0.0f);
    side_left += left_step;
    side_right += right_step;
    left[i] += out_left[i] * amp * steal * side_left;
    right[i] += out_right[i] * amp * steal * side_right;
  }
  voice.amp = amp;
  voice.side_left = side_left;
  voice.side_right = side_right;
  if (voice.pending) voice.steal = steal;
}

}  // namespace night_drum_voice
}  // namespace livemix
