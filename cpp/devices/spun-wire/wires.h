#pragma once

// The six wires of one key: six string loops run side by side.
//
//   impulses ─┐
//   noise ────┴► body ► plucker ► high-pass ─► (+) ─────────────► ring[], one a wire
//                                               ▲            │
//              rim ◄─ stiffness ◄─ loss ◄─ tuning allpass ◄─ delay
//
// - Everything that moves a wire, a pluck or a rub, goes in by the same door:
//   one impulse a period at most, at the same place in the wire's period, and
//   noise beside it. A pluck is one such impulse, a rub a small one every
//   period. So a rub begins in step with the pluck before it, and passing
//   from the one to the other has no step in it.
// - The second, inverted impulse, Point of a period later, takes out the
//   partials with a node where the wire is touched.
// - Loss, stiffness and tuning are worked out as in kit::PluckedString: the
//   loop's whole phase delay at the fundamental is one period.
// - A wire whose tuning changes while it rings crossfades from its old place
//   in the line to the new one, so nothing steps.
// - The rim takes `rim` of what the wires have in common out of each of them
//   (y - rim·mean): a contraction, so no setting can make the wheel grow.
//
// Wires are processed kLanes at a time, one array for each part of the state,
// taken four at a time.

#include <initializer_list>

#include "../../kit/kit.h"

namespace livemix {
namespace spun_wire {

// Four wires at a time; the compiler makes one instruction of each line.
typedef float Four __attribute__((vector_size(16)));
typedef int32_t IFour __attribute__((vector_size(16)));

struct Wires {
  static constexpr int kWires = 6;
  static constexpr int kLanes = 8;
  static constexpr int kChunk = 32;
  static constexpr int kSize = 8192;
  static constexpr int kMask = kSize - 1;
  static constexpr int kFadeChunks = 40;

  // What one wire is to be: filled by the voice, taken by design().
  struct Spec {
    float hz = 220.0f;
    float ring = 4.0f;       // seconds to -60 dB at the fundamental
    float ring_high = 0.5f;  // and at high_hz
    float high_hz = 4000.0f;
    float stiffness = 0.0f;  // inharmonicity B
  };

  alignas(16) float exc[kChunk + 2][kLanes] = {};
  alignas(16) float whole_x1[2][kLanes] = {};  // tuning allpass state, old and new place
  alignas(16) float whole_y1[2][kLanes] = {};
  alignas(16) float tune_a[2][kLanes] = {};
  alignas(16) float loss_a[kLanes] = {}, loss_g[kLanes] = {}, loss[kLanes] = {};
  alignas(16) float loss_a_to[kLanes] = {}, loss_g_to[kLanes] = {};
  alignas(16) float stiff_a[kLanes] = {}, stiff_to[kLanes] = {};
  alignas(16) float s1x[kLanes] = {}, s1y[kLanes] = {}, s2x[kLanes] = {}, s2y[kLanes] = {};
  alignas(16) float body_k[kLanes] = {}, pick_k[kLanes] = {}, high_k[kLanes] = {};
  alignas(16) float body[kLanes] = {}, pick[kLanes] = {}, high[kLanes] = {};
  alignas(16) float noise_gain[kLanes] = {}, noise_now[kLanes] = {}, noise_decay[kLanes] = {}, hiss[kLanes] = {};
  alignas(16) float hiss_at[kLanes] = {};
  alignas(16) float on[kLanes] = {};  // 1 for a wire that is strung
  alignas(16) float pan_l[kLanes] = {}, pan_r[kLanes] = {}, pan_l_to[kLanes] = {}, pan_r_to[kLanes] = {};
  alignas(16) uint32_t seed[kLanes] = {};
  int whole[2][kWires] = {};
  float line[kWires][kSize] = {};
  int write = 0;
  int clean[kWires] = {};  // samples behind the write head that belong to this note
  float period[kWires] = {};
  float next[kWires] = {};      // samples to the wire's next place for an impulse
  float comb_at[kWires] = {};   // the second impulse that waits, < 0 for none
  float comb_amp[kWires] = {};
  float pluck[kWires] = {};     // a pluck that waits for its place
  float rub[kWires] = {};       // what goes in every period, and where it is going
  float rub_to[kWires] = {};
  float ring_gain[kWires] = {};  // what is left of the fundamental after one chunk
  float ring_now[kWires] = {};   // the same with the damper on
  float kept[kWires] = {};       // and after one period, now and where it is going
  float kept_to[kWires] = {};
  float damper[kLanes] = {};     // what a key let go makes of a period: 1 while it is down
  float damper_to[kLanes] = {};
  float lost[kWires] = {};       // what one period loses, the damper's share with it
  float amount[kWires] = {};     // how hard the wire swings, in plucks
  float pulse[kWires] = {};      // how much of an impulse is the clean push
  float breath[kWires] = {};     // and what noise of amount 1 is, for this wire
  float puff[kWires] = {};       // the noise a waiting pluck brings
  float comb = 0.2f;
  float hiss_k = 0.02f;
  uint32_t late[kLanes] = {};    // the same noise, Point of a period later and inverted
  int lag[kLanes] = {}, wait[kLanes] = {};
  float rim = 0.0f, rim_to = 0.0f;
  int fade = 0;                  // chunks of a crossfade still to go
  bool hissing = false;

  void reset(uint32_t key) {
    clear_lanes(&whole_x1[0][0], 2 * kLanes);
    clear_lanes(&whole_y1[0][0], 2 * kLanes);
    for (float* state : {loss, s1x, s1y, s2x, s2y, body, pick, high, noise_gain, noise_now, hiss, hiss_at})
      clear_lanes(state, kLanes);
    clear_lanes(&exc[0][0], (kChunk + 2) * kLanes);
    for (int i = 0; i < kLanes; ++i) {
      late[i] = seed[i] = key * 2654435761u + 7919u * static_cast<uint32_t>(i + 1);
      lag[i] = wait[i] = 0;
      damper[i] = damper_to[i] = 1.0f;
    }
    for (int i = 0; i < kWires; ++i) {
      clean[i] = 0;
      next[i] = 0.0f;
      comb_at[i] = -1.0f;
      puff[i] = 0.0f;
      comb_amp[i] = pluck[i] = rub[i] = rub_to[i] = amount[i] = 0.0f;
    }
    fade = 0;
    hissing = false;
  }

  // Sets the damper: `seconds` to -60 dB, 0 for off.
  void damp(float seconds, float sample_rate) {
    hiss_k = 1.0f - std::exp(-1.0f / (0.001f * sample_rate));
    for (int i = 0; i < kWires; ++i) {
      damper_to[i] = seconds > 0.0f ? std::exp(-kSixtyDb * period[i] / (sample_rate * seconds)) : 1.0f;
      ring_now[i] = ring_gain[i] * (seconds > 0.0f ? std::exp(-kSixtyDb * static_cast<float>(kChunk) / (sample_rate * seconds)) : 1.0f);
      const int later = kit::clamp_int(static_cast<int>(comb * period[i] + 0.5f), 1, kSize);
      if (later == lag[i]) continue;
      lag[i] = wait[i] = later;
      late[i] = seed[i];
    }
  }

  static float allpass_delay(float a, float w) {
    return 1.0f - 2.0f * std::atan2(a * std::sin(w), 1.0f + a * std::cos(w)) / w;
  }
  static float loss_size(float a, float w) {
    return (1.0f - a) / std::sqrt(1.0f - 2.0f * a * std::cos(w) + a * a);
  }

  // Works out wire i. `snap` puts it there at once (a silent wire); else the
  // place in the line crossfades and the filters glide.
  void design(int i, const Spec& spec, float sample_rate, bool snap) {
    const float hz = kit::max(spec.hz, sample_rate / static_cast<float>(kSize - 8));
    const float span = sample_rate / hz;
    const float w1 = kit::kTwoPi * hz / sample_rate;
    const float w2 = kit::kTwoPi * kit::min(kit::max(spec.high_hz, 2.0f * hz), 0.45f * sample_rate) / sample_rate;
    const float gain1 = std::exp(-kSixtyDb / (hz * spec.ring));
    const float wanted = std::exp(-kSixtyDb / (hz * kit::min(spec.ring_high, spec.ring))) / gain1;
    float lo = 0.0f, hi = 0.98f;
    if (wanted >= 1.0f) {
      hi = 0.0f;
    } else if (loss_size(hi, w2) / loss_size(hi, w1) < wanted) {
      for (int k = 0; k < 18; ++k) {
        const float mid = 0.5f * (lo + hi);
        (loss_size(mid, w2) / loss_size(mid, w1) > wanted ? lo : hi) = mid;
      }
    }
    loss_a_to[i] = hi;
    loss_g_to[i] = kit::min(gain1 / loss_size(hi, w1), 0.99999f);
    stiff_to[i] = stiffness(span, w1, spec.stiffness);
    const float lag = std::atan2(hi * std::sin(w1), 1.0f - hi * std::cos(w1)) / w1;
    const float stiff_lag = 2.0f * allpass_delay(stiff_to[i], w1);
    const float place = kit::clamp(span - lag - stiff_lag, 1.6f, static_cast<float>(kSize - 6));
    const int steps = static_cast<int>(place - 0.5f);
    const float rest = place - static_cast<float>(steps);
    const float tune = std::sin((1.0f - rest) * w1 * 0.5f) / std::sin((1.0f + rest) * w1 * 0.5f);
    // What lies in the line beyond this note's own samples is another note's.
    for (int d = clean[i] + 1; d <= steps + 2 && d < kSize; ++d) line[i][(write - d) & kMask] = 0.0f;
    if (clean[i] < steps + 2) clean[i] = steps + 2;
    period[i] = span;
    kept_to[i] = gain1;
    ring_gain[i] = std::exp(-kSixtyDb * static_cast<float>(kChunk) / (sample_rate * spec.ring));
    whole[1][i] = steps;
    tune_a[1][i] = tune;
    whole_x1[1][i] = whole_x1[0][i];
    whole_y1[1][i] = whole_y1[0][i];
    if (snap) {
      whole[0][i] = steps;
      tune_a[0][i] = tune;
      loss_a[i] = loss_a_to[i];
      loss_g[i] = loss_g_to[i];
      stiff_a[i] = stiff_to[i];
      kept[i] = gain1;
    } else {
      fade = kFadeChunks;
    }
  }

  // The coefficient of the two stiffness allpasses that puts the fitted
  // partial where a wire of inharmonicity b has it. 0 is a plain sample.
  static float stiffness(float span, float w1, float b) {
    const int fit = kit::clamp_int(static_cast<int>(0.2f * span), 0, b > 0.01f ? 5 : 8);
    if (b <= 0.0f || fit < 2) return 0.0f;
    const float n = static_cast<float>(fit);
    const float stretch = std::sqrt((1.0f + b * n * n) / (1.0f + b));
    const float wn = w1 * n * stretch;
    const float want = span * (1.0f - 1.0f / stretch) * 0.5f;
    float lo = 0.0f, hi = 0.9f;
    if (allpass_delay(-hi, w1) - allpass_delay(-hi, wn) > want) {
      for (int k = 0; k < 18; ++k) {
        const float mid = 0.5f * (lo + hi);
        (allpass_delay(-mid, w1) - allpass_delay(-mid, wn) < want ? lo : hi) = mid;
      }
    } else {
      lo = hi;
    }
    while (lo > 1.0e-4f && 2.0f * allpass_delay(-lo, w1) > 0.7f * span) lo *= 0.9f;
    return -lo;
  }

  static constexpr float kSixtyDb = 6.907755279f;

  static void clear_lanes(float* values, int count) {
    for (int i = 0; i < count; ++i) values[i] = 0.0f;
  }

  // Builds one chunk of what moves the wires. `sign` is the side
  // the plucker comes from.
  void excite(float sign) {
    for (int l = 0; l < kLanes; ++l) {
      exc[0][l] = exc[kChunk][l];
      exc[1][l] = exc[kChunk + 1][l];
    }
    clear_lanes(&exc[2][0], kChunk * kLanes);
    for (int i = 0; i < kWires; ++i) {
      rub[i] = settle_to_zero(rub[i] + (rub_to[i] - rub[i]) * 0.12f);
      float at = next[i];
      if (comb_at[i] >= 0.0f) {
        if (comb_at[i] < static_cast<float>(kChunk)) {
          place(i, comb_at[i], -comb_amp[i]);
          comb_at[i] = -1.0f;
        } else {
          comb_at[i] -= static_cast<float>(kChunk);
        }
      }
      amount[i] = settle_to_zero(amount[i] * ring_now[i]);
      while (at < static_cast<float>(kChunk)) {
        const float size = (pluck[i] + rub[i]);
        if (size > 1.0e-6f) {
          const float push = sign * size * pulse[i] * period[i] * 0.5f;
          place(i, at, push);
          const float second = at + comb * period[i];
          if (second < static_cast<float>(kChunk)) {
            place(i, second, -push);
          } else {
            comb_at[i] = second - static_cast<float>(kChunk);
            comb_amp[i] = push;
          }
          amount[i] += size;
          if (pluck[i] > 0.0f) started(i);
        }
        pluck[i] = 0.0f;
        at += period[i];
      }
      next[i] = at - static_cast<float>(kChunk);
    }
    if (hissing) {
      for (int l = 0; l < kLanes; ++l) noise_now[l] = settle_to_zero(noise_now[l] + (noise_gain[l] - noise_now[l]) * 0.12f);
      for (int s = 0; s < kChunk; ++s) {
        for (int l = 0; l < kLanes; ++l) {
          seed[l] = seed[l] * 1664525u + 1013904223u;
          const float white = static_cast<float>(static_cast<int32_t>(seed[l])) * (1.0f / 2147483648.0f);
          hiss[l] *= noise_decay[l];
          hiss_at[l] += (hiss[l] + noise_now[l] - hiss_at[l]) * hiss_k;
          if (wait[l] > 0) {
            --wait[l];
            exc[s][l] += white * hiss_at[l];
            continue;
          }
          late[l] = late[l] * 1664525u + 1013904223u;
          const float before = static_cast<float>(static_cast<int32_t>(late[l])) * (1.0f / 2147483648.0f);
          exc[s][l] += (white - before) * hiss_at[l];
        }
      }
    }
    for (int o = 0; o < kLanes; o += 4) {
      Four at[3], k[3];
      for (int f = 0; f < 4; ++f) {
        at[0][f] = body[o + f];
        at[1][f] = pick[o + f];
        at[2][f] = high[o + f];
        k[0][f] = body_k[o + f];
        k[1][f] = pick_k[o + f];
        k[2][f] = high_k[o + f];
      }
      for (int s = 0; s < kChunk; ++s) {
        float* here = exc[s] + o;
        const Four in = {here[0], here[1], here[2], here[3]};
        at[0] += (in - at[0]) * k[0];
        at[1] += (at[0] - at[1]) * k[1];
        at[2] += (at[1] - at[2]) * k[2];
        const Four out = at[1] - at[2];
        for (int f = 0; f < 4; ++f) here[f] = out[f];
      }
      for (int f = 0; f < 4; ++f) {
        body[o + f] = at[0][f];
        pick[o + f] = at[1][f];
        high[o + f] = at[2][f];
      }
    }
    for (float* state : {body, pick, high, hiss, hiss_at}) flush(state);
  }

  // One chunk of the wires into left and right. Returns the loudest sample.
  float run(float* left, float* right) {
    if (fade > 0) {
      const float share = 1.0f / static_cast<float>(fade);
      for (int i = 0; i < kWires; ++i) kept[i] += (kept_to[i] - kept[i]) * share;
      for (int l = 0; l < kLanes; ++l) {
        loss_a[l] += (loss_a_to[l] - loss_a[l]) * share;
        loss_g[l] += (loss_g_to[l] - loss_g[l]) * share;
        stiff_a[l] += (stiff_to[l] - stiff_a[l]) * share;
      }
    }
    const float peak = fade > 0 ? strings<true>(left, right) : strings<false>(left, right);
    if (fade > 0 && --fade == 0) {
      for (int i = 0; i < kWires; ++i) whole[0][i] = whole[1][i];
      for (int l = 0; l < kLanes; ++l) {
        tune_a[0][l] = tune_a[1][l];
        whole_x1[0][l] = whole_x1[1][l];
        whole_y1[0][l] = whole_y1[1][l];
      }
    }
    for (float* state : {loss, s1x, s1y, s2x, s2y, whole_x1[0], whole_y1[0], whole_x1[1], whole_y1[1]}) flush(state);
    for (int i = 0; i < kWires; ++i) clean[i] = kit::clamp_int(clean[i] + kChunk, 0, kSize - 1);
    return peak;
  }

 private:
  void place(int i, float at, float size) {
    const int whole_at = static_cast<int>(at);
    const float part = at - static_cast<float>(whole_at);
    exc[whole_at][i] += size * (1.0f - part);
    exc[whole_at + 1][i] += size * part;
  }
  // A pluck has gone in: its own noise starts with it.
  void started(int i) {
    hiss[i] += kit::max(puff[i] - 0.8f * hiss[i], 0.0f);
    puff[i] = 0.0f;
  }
  static void flush(float* values) {
    for (int l = 0; l < kLanes; ++l) values[l] = flush_denormal(values[l]);
  }

  template <bool Fade>
  float strings(float* left, float* right) {
    constexpr int kGroups = kLanes / 4;
    constexpr float kPart = 1.0f / static_cast<float>(kChunk);
    const auto load = [](const float* from) {
      Four out;
      for (int k = 0; k < 4; ++k) out[k] = from[k];
      return out;
    };
    const auto store = [](float* to, Four v) {
      for (int k = 0; k < 4; ++k) to[k] = v[k];
    };
    alignas(16) float damper_next[kLanes];
    for (int l = 0; l < kLanes; ++l) {
      const float left_to_go = damper_to[l] - damper[l];
      damper_next[l] = (left_to_go < 1.0e-6f && left_to_go > -1.0e-6f) ? damper_to[l] : damper[l] + left_to_go * 0.15f;
    }
    Four x1[2][kGroups], y1[2][kGroups], ta[2][kGroups];
    Four la[kGroups], lg[kGroups], lg_step[kGroups], ls[kGroups], sa[kGroups], ax[kGroups], ay[kGroups], bx[kGroups], by[kGroups];
    Four pl[kGroups], pr[kGroups], dl[kGroups], dr[kGroups], strung[kGroups];
    for (int g = 0; g < kGroups; ++g) {
      const int o = 4 * g;
      for (int p = 0; p < 2; ++p) {
        x1[p][g] = load(whole_x1[p] + o);
        y1[p][g] = load(whole_y1[p] + o);
        ta[p][g] = load(tune_a[p] + o);
      }
      la[g] = load(loss_a + o);
      lg[g] = load(loss_g + o) * load(damper + o);
      lg_step[g] = (load(loss_g + o) * load(damper_next + o) - lg[g]) * kPart;
      ls[g] = load(loss + o);
      sa[g] = load(stiff_a + o);
      ax[g] = load(s1x + o);
      ay[g] = load(s1y + o);
      bx[g] = load(s2x + o);
      by[g] = load(s2y + o);
      pl[g] = load(pan_l + o);
      pr[g] = load(pan_r + o);
      dl[g] = (load(pan_l_to + o) - pl[g]) * kPart;
      dr[g] = (load(pan_r_to + o) - pr[g]) * kPart;
      strung[g] = load(on + o);
    }
    for (int l = 0; l < kLanes; ++l) damper[l] = damper_next[l];
    for (int i = 0; i < kWires; ++i) lost[i] = 1.0f - kept[i] * damper[i];
    const float rim_step = (rim_to - rim) * kPart;
    const float fade_step = 1.0f / static_cast<float>(kFadeChunks * kChunk);
    const float fade_from = 1.0f - static_cast<float>(fade * kChunk) * fade_step;
    const Four tiny = {1.0e-15f, 1.0e-15f, 1.0e-15f, 1.0e-15f};
    float peak = 0.0f;
    for (int s = 0; s < kChunk; ++s) {
      Four y[kGroups];
      for (int g = 0; g < kGroups; ++g) {
        Four x = taken(g, 0);
        const Four tuned = ta[0][g] * (x - y1[0][g]) + x1[0][g];
        x1[0][g] = x;
        y1[0][g] = tuned;
        y[g] = tuned;
        if (Fade) {
          x = taken(g, 1);
          const Four other = ta[1][g] * (x - y1[1][g]) + x1[1][g];
          x1[1][g] = x;
          y1[1][g] = other;
          y[g] = y[g] + (other - y[g]) * (fade_from + fade_step * static_cast<float>(s + 1));
        }
        ls[g] = y[g] + (ls[g] - y[g]) * la[g];
        lg[g] += lg_step[g];
        const Four lossy = lg[g] * ls[g];
        const Four one = sa[g] * (lossy - ay[g]) + ax[g];
        ax[g] = lossy;
        ay[g] = one;
        const Four two = sa[g] * (one - by[g]) + bx[g];
        bx[g] = one;
        by[g] = two;
        y[g] = two;
      }
      rim += rim_step;
      const Four both = y[0] * strung[0] + y[1] * strung[1];
      const float common = (both[0] + both[1] + both[2] + both[3]) * rim;
      Four sum_l = {}, sum_r = {};
      for (int g = 0; g < kGroups; ++g) {
        const Four v = y[g] - strung[g] * common + load(exc[s] + 4 * g);
        y[g] = (Four)((IFour)v & ((v > tiny) | (v < -tiny)));
        pl[g] += dl[g];
        pr[g] += dr[g];
        sum_l += y[g] * pl[g];
        sum_r += y[g] * pr[g];
      }
      for (int i = 0; i < kWires; ++i) line[i][write] = y[i >> 2][i & 3];
      write = (write + 1) & kMask;
      const float out_l = sum_l[0] + sum_l[1] + sum_l[2] + sum_l[3];
      const float out_r = sum_r[0] + sum_r[1] + sum_r[2] + sum_r[3];
      left[s] += out_l;
      right[s] += out_r;
      const float size = kit::max(out_l < 0.0f ? -out_l : out_l, out_r < 0.0f ? -out_r : out_r);
      peak = size > peak ? size : peak;
    }
    for (int g = 0; g < kGroups; ++g) {
      const int o = 4 * g;
      for (int p = 0; p < 2; ++p) {
        store(whole_x1[p] + o, x1[p][g]);
        store(whole_y1[p] + o, y1[p][g]);
      }
      store(loss + o, ls[g]);
      store(s1x + o, ax[g]);
      store(s1y + o, ay[g]);
      store(s2x + o, bx[g]);
      store(s2y + o, by[g]);
      store(pan_l + o, pl[g]);
      store(pan_r + o, pr[g]);
    }
    return peak;
  }

  // Where group g of the wires reads its line, at the old place or the new.
  Four taken(int g, int place) const {
    const int o = 4 * g;
    Four out = {};
    out[0] = line[o][(write - whole[place][o]) & kMask];
    out[1] = line[o + 1][(write - whole[place][o + 1]) & kMask];
    if (g == 0) {
      out[2] = line[2][(write - whole[place][2]) & kMask];
      out[3] = line[3][(write - whole[place][3]) & kMask];
    }
    return out;
  }
};

}  // namespace spun_wire
}  // namespace livemix
