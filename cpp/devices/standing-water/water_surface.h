#pragma once

// The surface of Standing Water: what one key's pool looks like to a point
// that runs round a circle on it, once for every cycle of the note.
//
// A standing wave along the direction a, read on a circle of radius R (in
// radians of its own ripple) round a centre where its phase is p, is
//
//   cos(R cos(t - a) + p) = the sum over n of 2 J_n(R) q_n(p) cos(n (t - a)),
//   q_n = cos p, -sin p, -cos p, sin p, cos p ...
//
// so a figure of a few waves is a short list of harmonics of the note in
// closed form: the radius says how many, the directions and the centre say
// which. They are summed for both ears at once (left is the real part of the
// signal and right the imaginary one), turned into a cycle by one transform,
// bent by the reading (height, slope or the light on the floor), turned back,
// given the pool's colour harmonic by harmonic, stopped under the top of what
// may sound, and written out as a table of two cycles (two, so that what is
// half the pitch fits in it). Whatever the bend folds over lands on another
// harmonic of the same note: there is nothing out of tune in it.

#include "../../kit/kit.h"

namespace livemix {
namespace standing_water_dsp {

constexpr int kMaxWaves = 6;    // directions of a figure
constexpr int kRings = 3;       // the figure, and two rings of finer ripples on it
constexpr int kMaxHarmonic = 46;
constexpr int kMaxBins = 256;   // of half the pitch
constexpr int kBigTable = 1024;
constexpr int kTableSlack = 4;

enum Pattern : int { kStripes = 0, kSquares, kHexagons, kEightfold, kFree, kPatterns };
enum Reading : int { kHeight = 0, kSlope, kCaustic, kReadings };
enum Pool : int { kRound = 0, kLong, kSea, kPools };

// What a figure is made of.
struct Figure {
  int waves;                  // directions
  float angle[kMaxWaves];     // of each, in turns
  float phase[kMaxWaves];     // of each at the middle of the figure, in turns
  float side;                 // how strongly a wave holds its neighbours down
  float far;                  // ... and the ones across
  float chase;                // makes the hold one-sided: waves take turns
  float radius_low, radius_high;  // the circle at 0 and at 1
  float ring[2];              // how much finer the two rings of ripples are
  float ring_turn;            // how far the first of them is turned, in turns
  float anchor;               // the plain tone beside the figure
  float dull;                 // how much of its finer overtones the figure keeps to itself
  float wide;                 // how far apart the ears hear it
  float trade;                // how far its waves swap their energy, by turns
  float swing;                // how far its level goes up and down with that
  float pace;                 // how often, beside the others
  float chop;                 // air it throws up of its own accord
};

constexpr Figure kFigures[kPatterns] = {
    // One wave wins. Its crests are read from a slope, so the odd harmonics
    // stand: hollow.
    {3, {0.0f, 1.0f / 3.0f, 2.0f / 3.0f, 0, 0, 0}, {0.25f, 0.25f, 0.25f, 0, 0, 0}, 1.9f, 1.9f, 0.0f, 0.35f, 5.0f, {2.0f, 3.0f}, 0.0f, 3.4f, 0.85f, 0.06f, 0.0f, 0.0f, 1.0f, 0.0f},
    // Two at right angles: every fourth.
    {2, {0.0f, 0.25f, 0, 0, 0, 0}, {0.0f, 0.0f, 0, 0, 0, 0}, 0.4f, 0.4f, 0.0f, 1.4f, 7.5f, {1.41421356f, 2.0f}, 0.125f, 0.22f, 0.03f, 0.1f, 0.9f, 1.15f, 2.2f, 0.0f},
    // Three in a star: every third.
    {3, {0.0f, 1.0f / 3.0f, 2.0f / 3.0f, 0, 0, 0}, {0.125f, 0.125f, 0.125f, 0, 0, 0}, 0.6f, 0.6f, 0.0f, 0.8f, 7.5f, {1.7320508f, 2.0f}, 0.0833333f, 1.05f, 0.06f, 0.85f, 0.0f, 0.0f, 1.0f, 0.0f},
    // Four: every eighth, three octaves up.
    {4, {0.0f, 0.125f, 0.25f, 0.375f, 0, 0}, {0.0f, 0.0f, 0.0f, 0.0f, 0, 0}, 0.3f, 0.3f, 0.0f, 6.5f, 15.0f, {1.8477591f, 1.41421356f}, 0.0625f, 0.6f, 0.008f, 2.6f, 0.2f, 0.35f, 0.45f, 0.0f},
    // Six that chase each other, hollow and full in turn.
    {6, {0.0f, 0.0833333f, 0.1666667f, 0.25f, 0.3333333f, 0.4166667f}, {0.25f, 0.0f, 0.2f, 0.02f, 0.3f, 0.08f}, 1.25f, 1.25f, 0.75f, 0.5f, 7.0f, {1.5f, 2.0f}, 0.04f, 0.4f, 0.05f, 1.9f, 0.0f, 1.8f, 0.4f, 1.0f},
};

// What is summed for one frame of one key.
struct Frame {
  int pattern = 0, reading = 0, pool = 0;
  float radius = 3.0f;
  float depth = 0.5f;
  float layers = 0.0f;
  float strength = 1.0f;            // how far past its threshold the water is
  float wave[kMaxWaves] = {};       // amplitudes
  float turn[kMaxWaves] = {};       // the phase each wave has run on, in turns
  float centre[2][2] = {};          // of each ear's circle, radians of the ripple
  float below = 0.0f;               // the second halving
  float below_turn = 0.0f;
  float anchor = 0.7f;              // the plain tone that keeps the pitch
  float whisper = 0.0f;             // the drive's own octave, which needs no figure
  float whisper_turn = 0.0f;
};

class Surface {
 public:
  void init() {
    small_.init();
    middle_.init();
    big_.init();
    kit::SineTable::init();
  }

  // How high the figure stands at the middle of the two circles, -1 to 1 or so,
  // in the frame last built: the flicker of the light there.
  float glint() const { return glint_; }

  // Sums `frame`, colours it with `colour` (a gain for each bin of half the
  // pitch, `bins` of them), gives it the level `level` and writes two cycles of
  // each ear to `left` and `right`: `size` points and kTableSlack round the
  // join. `norm` follows the figure's own loudness (zero before the first) and is
  // never under `least` of it.
  void build(const Frame& frame, const float* colour, int bins, int size, float level, float norm_coeff, float least,
             float* norm, float* figure, float* left, float* right) {
    const int points = size / 2;
    for (int i = 0; i < points; ++i) re_[i] = im_[i] = 0.0f;
    sum_waves(frame, points);
    if (points == 512) middle_.inverse(re_, im_); else small_.inverse(re_, im_);
    bend(frame, points);
    if (points == 512) middle_.forward(re_, im_); else small_.forward(re_, im_);

    // The colour, and how loud the figure comes out of it.
    const float scale = 1.0f / static_cast<float>(points);
    for (int k = 1; k < bins; ++k) {
      const float g = colour[k] * scale;
      re_[k] *= g;
      im_[k] *= g;
      re_[points - k] *= g;
      im_[points - k] *= g;
    }
    // The plain tone, and half the pitch under it, each a share of how loud the
    // figure has been: a bend that makes the figure small leaves it as clear.
    const float apart = figure_power(bins, points);
    const float seen = std::sqrt(apart);
    *figure = *figure <= 0.0f ? seen : kit::max(0.6f * seen, seen + (*figure - seen) * norm_coeff);
    const float half = 0.5f * frame.anchor * *figure, under = 0.45f * frame.below * *figure;
    const float before = tone_power(points);
    re_[2] += half;
    im_[2] += half;
    re_[points - 2] += half;
    im_[points - 2] += half;
    re_[1] += under;
    im_[1] += under;
    re_[points - 1] += under;
    im_[points - 1] += under;
    const float now = std::sqrt(kit::max(0.0f, apart - before + tone_power(points)));
    // A figure that grows faster than this follows does not come out louder for it.
    *norm = *norm <= 0.0f ? now : kit::max(least * now, now + (*norm - now) * norm_coeff);
    const float gain = level / (*norm + 5.0e-4f);

    // Out again over the whole table. The octave of the drive is there whether
    // the figure is or not.
    for (int i = 0; i < size; ++i) out_re_[i] = out_im_[i] = 0.0f;
    for (int k = 1; k < bins; ++k) {
      out_re_[k] = re_[k] * gain;
      out_im_[k] = im_[k] * gain;
      out_re_[size - k] = re_[points - k] * gain;
      out_im_[size - k] = im_[points - k] * gain;
    }
    if (frame.whisper > 0.0f && bins > 5) {
      const float wr = 0.5f * frame.whisper * kit::SineTable::cos_lookup(frame.whisper_turn);
      const float wi = 0.5f * frame.whisper * kit::SineTable::lookup(frame.whisper_turn);
      const float vr = 0.5f * frame.whisper * kit::SineTable::cos_lookup(frame.whisper_turn + 0.11f);
      const float vi = 0.5f * frame.whisper * kit::SineTable::lookup(frame.whisper_turn + 0.11f);
      out_re_[4] += wr - vi;
      out_im_[4] += wi + vr;
      out_re_[size - 4] += wr + vi;
      out_im_[size - 4] += vr - wi;
    }
    if (size == kBigTable) big_.inverse(out_re_, out_im_); else middle_.inverse(out_re_, out_im_);
    // A narrow crest is held down to a height a chord of them has room for.
    float crest = 0.0f;
    for (int i = 0; i < size; ++i) {
      const float a = out_re_[i] < 0.0f ? -out_re_[i] : out_re_[i], b = out_im_[i] < 0.0f ? -out_im_[i] : out_im_[i];
      const float most = a > b ? a : b;
      crest = most > crest ? most : crest;
    }
    const float room = 2.2f * level + 0.5f * frame.whisper;
    const float held = crest > room ? std::sqrt(kit::max(room, 0.0f) / crest) : 1.0f;
    for (int i = 0; i < size; ++i) left[i + 1] = out_re_[i] * held;
    for (int i = 0; i < size; ++i) right[i + 1] = out_im_[i] * held;
    for (int ear = 0; ear < 2; ++ear) {
      float* table = ear == 0 ? left : right;
      table[0] = table[size];
      table[size + 1] = table[1];
      table[size + 2] = table[2];
    }
  }

 private:
  static constexpr int kLanes = 8;

  // Both ears' power, over the bins that may sound.
  float figure_power(int bins, int points) const {
    float power = 0.0f;
    for (int k = 1; k < bins; ++k) {
      const float a = re_[k], b = im_[k], c = re_[points - k], d = im_[points - k];
      power += a * a + b * b + c * c + d * d;
    }
    return power;
  }

  // ... of the two bins that plain tones go to.
  float tone_power(int points) const { return figure_power(3, points); }

  // The harmonics of the figure into re_/im_: left + i right.
  void sum_waves(const Frame& frame, int points) {
    const Figure& figure = kFigures[frame.pattern];
    const float squeeze = frame.pool == kLong ? 0.3f : 1.0f;
    const float share = 1.0f / std::sqrt(static_cast<float>(figure.waves));
    // A shallow light is drawn together less by the finest ripples.
    const float flat = (1.0f - frame.depth) * (1.0f - frame.depth), shallow = 0.04f * flat * flat;
    int top = 0;
    glint_ = 0.0f;
    for (int ring = 0; ring < kRings; ++ring) {
      const float fine = ring == 0 ? 1.0f : figure.ring[ring - 1];
      const float weight = ring == 0 ? 1.0f : (ring == 1 ? frame.layers * 1.5f : frame.layers * frame.layers * 2.0f);
      if (weight < 1.0e-3f) continue;
      const float radius = kit::min(frame.radius * fine, 30.0f);
      const float turned = ring == 1 ? figure.ring_turn : 0.0f;
      alignas(16) float cos_l[kLanes] = {}, sin_l[kLanes] = {}, cos_r[kLanes] = {}, sin_r[kLanes] = {};
      alignas(16) float rot_re[kLanes], rot_im[kLanes], step_re[kLanes], step_im[kLanes];
      for (int j = 0; j < kLanes; ++j) {
        rot_re[j] = step_re[j] = 1.0f;
        rot_im[j] = step_im[j] = 0.0f;
      }
      for (int j = 0; j < figure.waves; ++j) {
        const int next = j + 1 < figure.waves ? j + 1 : 0;
        const float angle = (figure.angle[j] + turned) * squeeze;
        const float ca = kit::SineTable::cos_lookup(angle), sa = kit::SineTable::lookup(angle);
        step_re[j] = ca;
        step_im[j] = -sa;
        float amplitude = frame.wave[j], own = figure.phase[j] + frame.turn[j];
        if (ring == 1) {
          amplitude = std::sqrt(frame.wave[j] * frame.wave[next]) * kit::min(1.0f, frame.wave[j] + frame.wave[next]);
          own += figure.phase[next] + frame.turn[next];
        } else if (ring == 2) {
          amplitude = frame.wave[j] * kit::min(1.0f, frame.wave[j] * 1.5f);
          own *= 2.0f;
        }
        amplitude *= weight * share;
        const float left = own + (frame.centre[0][0] * ca + frame.centre[0][1] * sa) * fine * (1.0f / kit::kTwoPi);
        const float right = own + (frame.centre[1][0] * ca + frame.centre[1][1] * sa) * fine * (1.0f / kit::kTwoPi);
        cos_l[j] = amplitude * kit::SineTable::cos_lookup(left);
        sin_l[j] = amplitude * kit::SineTable::lookup(left);
        cos_r[j] = amplitude * kit::SineTable::cos_lookup(right);
        sin_r[j] = amplitude * kit::SineTable::lookup(right);
        if (ring == 0) glint_ += 0.5f * (cos_l[j] + cos_r[j]);
      }
      const int highest = bessel(radius);
      if (highest > top) top = highest;
      for (int n = 1; n <= highest; ++n) {
        const float* from_l = (n & 1) ? sin_l : cos_l;
        const float* from_r = (n & 1) ? sin_r : cos_r;
        float lr[kLanes], li[kLanes], rr[kLanes], ri[kLanes];
        for (int j = 0; j < kLanes; ++j) {
          const float turned_re = rot_re[j] * step_re[j] - rot_im[j] * step_im[j];
          const float turned_im = rot_re[j] * step_im[j] + rot_im[j] * step_re[j];
          rot_re[j] = turned_re;
          rot_im[j] = turned_im;
          lr[j] = from_l[j] * turned_re;
          li[j] = from_l[j] * turned_im;
          rr[j] = from_r[j] * turned_re;
          ri[j] = from_r[j] * turned_im;
        }
        float sum[4] = {};
        for (int j = 0; j < figure.waves; ++j) {
          sum[0] += lr[j];
          sum[1] += li[j];
          sum[2] += rr[j];
          sum[3] += ri[j];
        }
        // q_n: + - - + from n = 0, the sine for odd n.
        const int quarter = n & 3;
        float g = bessel_[n] * ((quarter == 1 || quarter == 2) ? -1.0f : 1.0f);
        // The reading: the height itself, its slope along the circle, or its
        // bend, each against the radius so that it keeps its size.
        float a = sum[0] * g, b = sum[1] * g, c = sum[2] * g, d = sum[3] * g;
        if (frame.reading == kSlope) {
          const float s = static_cast<float>(n) / (0.5f * frame.radius + 0.6f);
          const float ta = -b * s, tc = -d * s;
          b = a * s;
          a = ta;
          d = c * s;
          c = tc;
        } else if (frame.reading == kCaustic) {
          const float square = static_cast<float>(n * n);
          const float m = square / ((0.35f * frame.radius * frame.radius + 1.0f) * (1.0f + shallow * square));
          a *= -m;
          b *= -m;
          c *= -m;
          d *= -m;
        }
        const int k = 2 * n;
        re_[k] += a - d;
        im_[k] += b + c;
        re_[points - k] += a + d;
        im_[points - k] += c - b;
      }
    }
    // Part of the plain tone lies under the bend, as a tilt of the whole pool.
    const float tilt = 0.16f * frame.strength;
    const float sign = frame.reading == kCaustic ? -1.0f : 1.0f;
    re_[2] += tilt * sign;
    im_[2] += tilt * sign;
    re_[points - 2] += tilt * sign;
    im_[points - 2] += tilt * sign;
    // The second halving: every other crest stands higher.
    if (frame.below > 0.0f) {
      const float cr = 0.45f * frame.below * kit::SineTable::cos_lookup(frame.below_turn);
      const float ci = 0.45f * frame.below * kit::SineTable::lookup(frame.below_turn);
      const int last = 2 * top + 1;
      for (int k = -last; k <= last; k += 2) {
        const int low = (k - 1 + points) & (points - 1), high = (k + 1 + points) & (points - 1);
        const int at = (k + points) & (points - 1);
        re_[at] = re_[low] * cr - im_[low] * ci + re_[high] * cr + im_[high] * ci;
        im_[at] = re_[low] * ci + im_[low] * cr + im_[high] * cr - re_[high] * ci;
      }
    }
  }

  // The reading, point by point.
  void bend(const Frame& frame, int points) {
    const float depth = frame.depth;
    for (int ear = 0; ear < 2; ++ear) {
      float* x = ear == 0 ? re_ : im_;
      // A figure of many ripples is steeper than a plain one: most of that is
      // taken out, so the bend meets the same size of surface in either.
      float power = 0.0f;
      for (int i = 0; i < points; ++i) power += x[i] * x[i];
      const float size = std::sqrt(power / static_cast<float>(points));
      const float even = frame.strength / (0.15f + 0.3f * frame.strength + 0.7f * size);
      if (frame.reading == kCaustic) {
        // Light through the surface: bright where the rays meet, and never
        // brighter than the taper lets it.
        const float d = even * (0.15f + 3.0f * depth * depth + 0.8f * depth);
        const float taper = 0.3f - 0.22f * depth;
        for (int i = 0; i < points; ++i) {
          const float ray = 1.0f + d * x[i];
          x[i] = 1.0f / (taper + std::sqrt(ray * ray + 0.01f));
        }
      } else if (frame.reading == kSlope) {
        // A leaning surface turns the light, and turns it past the edge.
        const float d = even * (0.7f + 6.0f * depth * depth);
        for (int i = 0; i < points; ++i) x[i] = wrapped_sine(x[i] * d);
      } else {
        // Deep troughs fill and the crests sharpen.
        const float d = even * (0.2f + 5.0f * depth * depth);
        for (int i = 0; i < points; ++i) {
          const float e = 1.0f + (1.0f / 16.0f) * kit::clamp(x[i] * d, -8.0f, 4.0f);
          const float e2 = e * e, e4 = e2 * e2, e8 = e4 * e4;
          x[i] = e8 * e8;
        }
      }
    }
  }

  // sin(x), for x of a few turns, within 0.1 %.
  static float wrapped_sine(float x) {
    const float turns = x * (1.0f / kit::kTwoPi);
    const float whole = static_cast<float>(static_cast<int>(turns + (turns < 0.0f ? -0.5f : 0.5f)));
    const float t = turns - whole;                       // -1/2 .. 1/2
    const float magnitude = t < 0.0f ? -t : t;
    const float y = 8.0f * t - 16.0f * t * magnitude;    // a parabola each side
    const float size = y < 0.0f ? -y : y;
    return y * (0.775f + 0.225f * size);
  }

  // J_0 .. J_n of x into bessel_, by the downward recurrence. Returns the
  // last n that is worth summing.
  int bessel(float x) {
    if (x < 1.0e-3f) {
      bessel_[0] = 1.0f;
      bessel_[1] = 0.5f * x;
      return 1;
    }
    int start = static_cast<int>(x) + 14;
    if (start > kMaxHarmonic) start = kMaxHarmonic;
    start += start & 1;
    float after = 0.0f, now = 1.0e-12f, sum = 0.0f;
    const float two_over = 2.0f / x;
    for (int n = start; n >= 1; --n) {
      bessel_[n] = now;
      if (!(n & 1)) sum += 2.0f * now;
      const float before = static_cast<float>(n) * two_over * now - after;
      after = now;
      now = before;
      if (now > 1.0e12f || now < -1.0e12f) {
        now *= 1.0e-12f;
        after *= 1.0e-12f;
        sum *= 1.0e-12f;
        for (int m = n; m <= start; ++m) bessel_[m] *= 1.0e-12f;
      }
    }
    bessel_[0] = now;
    sum += now;
    const float scale = 1.0f / sum;
    int last = 1;
    for (int n = 0; n <= start; ++n) {
      bessel_[n] *= scale;
      if (n > 0 && (bessel_[n] > 1.0e-4f || bessel_[n] < -1.0e-4f)) last = n;
    }
    return last;
  }

  kit::Fft<256> small_;
  kit::Fft<512> middle_;
  kit::Fft<kBigTable> big_;
  float re_[512] = {}, im_[512] = {};
  float out_re_[kBigTable] = {}, out_im_[kBigTable] = {};
  float glint_ = 0.0f;
  float bessel_[kMaxHarmonic + 4] = {};
};

}  // namespace standing_water_dsp
}  // namespace livemix
