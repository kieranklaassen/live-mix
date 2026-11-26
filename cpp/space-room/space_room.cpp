// The convolution behind a track's room (`src/core/tracks/SpaceKernel.ts`):
// two channels, each with an impulse of its own, with no latency.
//
// A browser's ConvolverNode costs in step with the length of its impulse: a
// room of five seconds is seven times the work of a room of a quarter of one.
// Here the impulse is cut into partitions of three sizes (128, 1024 and 8192
// samples), each size convolves in the frequency domain with one transform of
// the input shared by all its partitions, and the spectra of the impulse are
// shared by every room that holds it.
//
// The transform is the odd-frequency ("twisted") one: a block of 2B real
// samples folds into B complex ones, and the product of two such spectra is
// a convolution that wraps round with its sign turned. Overlap-save throws
// the part that wraps away, so it does not matter which sign it has. What is
// gained is that B complex numbers hold all of it, with no bin of its own for
// zero and for half the rate, and that nothing has to be brought into order:
// the forward transform leaves its bins in the order its last stage does, the
// impulse's spectra are in that order too, and the inverse starts from it.
//
// The first size works on each block of 128 as it comes. A larger size has
// two of its own hops between a sample and the first sample it answers with:
// one to fill, and one to do the work in, a share of it in every block, so no
// block has more to do than another.
//
// Every pointer is handed in. There is no static data, nothing is allocated
// and nothing is called: the page lays the memory out, prepares the spectra
// and the rooms in it, and the audio thread's instance of this module only
// ever runs `room_process` on it.

#include <wasm_simd128.h>

#include <stddef.h>
#include <stdint.h>

#define EXPORT extern "C" __attribute__((used, visibility("default")))

namespace {

using f32 = float;
using Vec = v128_t;

constexpr int kQuantum = 128;
constexpr int kChannels = 2;

inline Vec load(const f32* from) { return wasm_v128_load(from); }
inline void store(f32* to, Vec value) { wasm_v128_store(to, value); }
inline Vec add(Vec a, Vec b) { return wasm_f32x4_add(a, b); }
inline Vec sub(Vec a, Vec b) { return wasm_f32x4_sub(a, b); }
inline Vec mul(Vec a, Vec b) { return wasm_f32x4_mul(a, b); }

inline int log2Of(int n) { return 31 - __builtin_clz(static_cast<unsigned>(n)); }

/** One partition size of a room. `P` partitions of `B` samples. */
struct Level {
  int32_t B;
  int32_t P;
  /** The slot of the delay line the newest spectrum is in. */
  int32_t slot;
  /** How far the hop being heard has come, in samples. */
  int32_t fill;
  /** Units of work done on the hop before, and how many there are. */
  int32_t unit;
  int32_t units;
  /** Which of the three hops of input is the one being filled. */
  int32_t hop;
  int32_t unused;
  /** The tables of a transform of B points. */
  const f32* tables;
  /** The impulse's spectra: [channel][partition][re B, im B]. */
  const f32* spectra;
  /** The input's spectra, laid out as the impulse's: [channel][slot][re B, im B]. */
  f32* line;
  /** The sum of the products: [re B, im B] for each channel. */
  f32* sum;
  /** The input: two hops for each channel in the first size, three in the others. */
  f32* input;
  /** What is heard in this hop and what is made for the next: [channel][B]. */
  f32* heard;
  f32* made;
};

struct Room {
  int32_t levels;
  /** How many blocks of nothing came in since the last that had something. */
  int32_t quiet;
  /** After this many the room has rung out. */
  int32_t tail;
  int32_t unused;
  f32 in[kChannels][kQuantum];
  f32 out[kChannels][kQuantum];
  Level level[3];
};

inline void clear(f32* to, int count) {
  const Vec nothing = wasm_f32x4_splat(0.0f);
  for (int j = 0; j < count; j += 4) store(to + j, nothing);
}

inline void copy(f32* to, const f32* from, int count) {
  for (int j = 0; j < count; j += 4) store(to + j, load(from + j));
}

inline void transpose(Vec& a, Vec& b, Vec& c, Vec& d) {
  const Vec ab0 = wasm_i32x4_shuffle(a, b, 0, 4, 1, 5);
  const Vec ab1 = wasm_i32x4_shuffle(a, b, 2, 6, 3, 7);
  const Vec cd0 = wasm_i32x4_shuffle(c, d, 0, 4, 1, 5);
  const Vec cd1 = wasm_i32x4_shuffle(c, d, 2, 6, 3, 7);
  a = wasm_i64x2_shuffle(ab0, cd0, 0, 2);
  b = wasm_i64x2_shuffle(ab0, cd0, 1, 3);
  c = wasm_i64x2_shuffle(ab1, cd1, 0, 2);
  d = wasm_i64x2_shuffle(ab1, cd1, 1, 3);
}

// Tables of a transform of B points, in the order they are read: the twist
// (cos B, sin B), the radix-2 stage's twiddles where B is no power of four
// (re B/2, im B/2), and those of each radix-4 stage from the longest to the
// one of 16 (re and im of w, w² and w³, a quarter of the stage each).

void forwardRadix2(f32* re, f32* im, int n, const f32* tables) {
  const int half = n >> 1;
  f32* re1 = re + half;
  f32* im1 = im + half;
  const f32* wr = tables;
  const f32* wi = tables + half;
  for (int j = 0; j < half; j += 4) {
    const Vec ar = load(re + j), ai = load(im + j), br = load(re1 + j), bi = load(im1 + j);
    const Vec xr = sub(ar, br), xi = sub(ai, bi), w = load(wr + j), v = load(wi + j);
    store(re + j, add(ar, br));
    store(im + j, add(ai, bi));
    store(re1 + j, sub(mul(xr, w), mul(xi, v)));
    store(im1 + j, add(mul(xr, v), mul(xi, w)));
  }
}

void inverseRadix2(f32* re, f32* im, int n, const f32* tables) {
  const int half = n >> 1;
  f32* re1 = re + half;
  f32* im1 = im + half;
  const f32* wr = tables;
  const f32* wi = tables + half;
  for (int j = 0; j < half; j += 4) {
    const Vec xr = load(re1 + j), xi = load(im1 + j), w = load(wr + j), v = load(wi + j);
    const Vec br = add(mul(xr, w), mul(xi, v)), bi = sub(mul(xi, w), mul(xr, v));
    const Vec ar = load(re + j), ai = load(im + j);
    store(re + j, add(ar, br));
    store(im + j, add(ai, bi));
    store(re1 + j, sub(ar, br));
    store(im1 + j, sub(ai, bi));
  }
}

/** One radix-4 stage over all B points, in runs of n. */
void forwardRadix4(f32* re, f32* im, int B, int n, const f32* tables) {
  const int q = n >> 2;
  const f32 *w1r = tables, *w1i = tables + q, *w2r = tables + 2 * q, *w2i = tables + 3 * q,
            *w3r = tables + 4 * q, *w3i = tables + 5 * q;
  for (int s = 0; s < B; s += n) {
    f32 *r0 = re + s, *i0 = im + s, *r1 = r0 + q, *i1 = i0 + q, *r2 = r1 + q, *i2 = i1 + q,
        *r3 = r2 + q, *i3 = i2 + q;
    for (int j = 0; j < q; j += 4) {
      const Vec ar = load(r0 + j), ai = load(i0 + j), br = load(r1 + j), bi = load(i1 + j);
      const Vec cr = load(r2 + j), ci = load(i2 + j), dr = load(r3 + j), di = load(i3 + j);
      const Vec t0r = add(ar, cr), t0i = add(ai, ci), t1r = sub(ar, cr), t1i = sub(ai, ci);
      const Vec t2r = add(br, dr), t2i = add(bi, di);
      // (b − d) turned a quarter back.
      const Vec t3r = sub(bi, di), t3i = sub(dr, br);
      store(r0 + j, add(t0r, t2r));
      store(i0 + j, add(t0i, t2i));
      Vec xr = add(t1r, t3r), xi = add(t1i, t3i), w = load(w1r + j), v = load(w1i + j);
      store(r1 + j, sub(mul(xr, w), mul(xi, v)));
      store(i1 + j, add(mul(xr, v), mul(xi, w)));
      xr = sub(t0r, t2r), xi = sub(t0i, t2i), w = load(w2r + j), v = load(w2i + j);
      store(r2 + j, sub(mul(xr, w), mul(xi, v)));
      store(i2 + j, add(mul(xr, v), mul(xi, w)));
      xr = sub(t1r, t3r), xi = sub(t1i, t3i), w = load(w3r + j), v = load(w3i + j);
      store(r3 + j, sub(mul(xr, w), mul(xi, v)));
      store(i3 + j, add(mul(xr, v), mul(xi, w)));
    }
  }
}

void inverseRadix4(f32* re, f32* im, int B, int n, const f32* tables) {
  const int q = n >> 2;
  const f32 *w1r = tables, *w1i = tables + q, *w2r = tables + 2 * q, *w2i = tables + 3 * q,
            *w3r = tables + 4 * q, *w3i = tables + 5 * q;
  for (int s = 0; s < B; s += n) {
    f32 *r0 = re + s, *i0 = im + s, *r1 = r0 + q, *i1 = i0 + q, *r2 = r1 + q, *i2 = i1 + q,
        *r3 = r2 + q, *i3 = i2 + q;
    for (int j = 0; j < q; j += 4) {
      const Vec ar = load(r0 + j), ai = load(i0 + j);
      Vec xr = load(r1 + j), xi = load(i1 + j), w = load(w1r + j), v = load(w1i + j);
      const Vec br = add(mul(xr, w), mul(xi, v)), bi = sub(mul(xi, w), mul(xr, v));
      xr = load(r2 + j), xi = load(i2 + j), w = load(w2r + j), v = load(w2i + j);
      const Vec cr = add(mul(xr, w), mul(xi, v)), ci = sub(mul(xi, w), mul(xr, v));
      xr = load(r3 + j), xi = load(i3 + j), w = load(w3r + j), v = load(w3i + j);
      const Vec dr = add(mul(xr, w), mul(xi, v)), di = sub(mul(xi, w), mul(xr, v));
      const Vec t0r = add(ar, cr), t0i = add(ai, ci), t2r = sub(ar, cr), t2i = sub(ai, ci);
      const Vec t1r = add(br, dr), t1i = add(bi, di), t3r = sub(br, dr), t3i = sub(bi, di);
      store(r0 + j, add(t0r, t1r));
      store(i0 + j, add(t0i, t1i));
      store(r2 + j, sub(t0r, t1r));
      store(i2 + j, sub(t0i, t1i));
      store(r1 + j, sub(t2r, t3i));
      store(i1 + j, add(t2i, t3r));
      store(r3 + j, add(t2r, t3i));
      store(i3 + j, sub(t2i, t3r));
    }
  }
}

/** The last stage, in runs of 4: four runs at a time, left lying across. */
void forwardLast(f32* re, f32* im, int B) {
  for (int s = 0; s < B; s += 16) {
    Vec ar = load(re + s), br = load(re + s + 4), cr = load(re + s + 8), dr = load(re + s + 12);
    Vec ai = load(im + s), bi = load(im + s + 4), ci = load(im + s + 8), di = load(im + s + 12);
    transpose(ar, br, cr, dr);
    transpose(ai, bi, ci, di);
    const Vec t0r = add(ar, cr), t0i = add(ai, ci), t1r = sub(ar, cr), t1i = sub(ai, ci);
    const Vec t2r = add(br, dr), t2i = add(bi, di), t3r = sub(bi, di), t3i = sub(dr, br);
    store(re + s, add(t0r, t2r));
    store(im + s, add(t0i, t2i));
    store(re + s + 4, add(t1r, t3r));
    store(im + s + 4, add(t1i, t3i));
    store(re + s + 8, sub(t0r, t2r));
    store(im + s + 8, sub(t0i, t2i));
    store(re + s + 12, sub(t1r, t3r));
    store(im + s + 12, sub(t1i, t3i));
  }
}

void inverseFirst(f32* re, f32* im, int B) {
  for (int s = 0; s < B; s += 16) {
    const Vec ar = load(re + s), br = load(re + s + 4), cr = load(re + s + 8), dr = load(re + s + 12);
    const Vec ai = load(im + s), bi = load(im + s + 4), ci = load(im + s + 8), di = load(im + s + 12);
    const Vec t0r = add(ar, cr), t0i = add(ai, ci), t2r = sub(ar, cr), t2i = sub(ai, ci);
    const Vec t1r = add(br, dr), t1i = add(bi, di), t3r = sub(br, dr), t3i = sub(bi, di);
    Vec o0r = add(t0r, t1r), o0i = add(t0i, t1i), o2r = sub(t0r, t1r), o2i = sub(t0i, t1i);
    Vec o1r = sub(t2r, t3i), o1i = add(t2i, t3r), o3r = add(t2r, t3i), o3i = sub(t2i, t3r);
    transpose(o0r, o1r, o2r, o3r);
    transpose(o0i, o1i, o2i, o3i);
    store(re + s, o0r);
    store(re + s + 4, o1r);
    store(re + s + 8, o2r);
    store(re + s + 12, o3r);
    store(im + s, o0i);
    store(im + s + 4, o1i);
    store(im + s + 8, o2i);
    store(im + s + 12, o3i);
  }
}

/** How many stages an inverse of B points is made in. A forward one has one more, its fold. */
inline int stagesOf(int B) {
  const int log = log2Of(B);
  return (log & 1) + (log >> 1);
}

/** One step of a forward transform of two halves of B samples: the fold first, then the stages. */
void forwardStep(f32* re, f32* im, int B, const f32* tables, const f32* first, const f32* second,
                 int step) {
  if (step == 0) {
    const f32* cosines = tables;
    const f32* sines = tables + B;
    for (int j = 0; j < B; j += 4) {
      const Vec a = load(first + j), b = load(second + j), w = load(cosines + j), v = load(sines + j);
      store(re + j, sub(mul(a, w), mul(b, v)));
      store(im + j, add(mul(a, v), mul(b, w)));
    }
    return;
  }
  const f32* stage = tables + 2 * B;
  int n = B;
  int left = step - 1;
  if (log2Of(B) & 1) {
    if (left == 0) {
      forwardRadix2(re, im, B, stage);
      return;
    }
    stage += B;
    n >>= 1;
    left -= 1;
  }
  for (; left > 0; left -= 1) {
    stage += 6 * (n >> 2);
    n >>= 2;
  }
  if (n == 4) {
    forwardLast(re, im, B);
  } else {
    forwardRadix4(re, im, B, n, stage);
  }
}

/** One stage of an inverse transform, counted from the first. The twist is taken off afterwards (`unfold`). */
void inverseStep(f32* re, f32* im, int B, const f32* tables, int step) {
  const int log = log2Of(B);
  const f32* stage = tables + 2 * B;
  int n = B;
  // Counted from the longest, as the tables lie.
  int at = (log >> 1) - 1 - step;
  if (log & 1) {
    if (at < 0) {
      inverseRadix2(re, im, B, stage);
      return;
    }
    stage += B;
    n >>= 1;
  }
  for (; at > 0; at -= 1) {
    stage += 6 * (n >> 2);
    n >>= 2;
  }
  if (n == 4) {
    inverseFirst(re, im, B);
  } else {
    inverseRadix4(re, im, B, n, stage);
  }
}

/** The half of the result that overlap-save keeps: the imaginary part, with the twist taken off. */
void unfold(f32* out, const f32* re, const f32* im, int B, const f32* tables) {
  const f32* cosines = tables;
  const f32* sines = tables + B;
  for (int j = 0; j < B; j += 4) {
    store(out + j, sub(mul(load(im + j), load(cosines + j)), mul(load(re + j), load(sines + j))));
  }
}

/** Adds the product of two spectra to a sum. */
void accumulate(f32* sum, const f32* x, const f32* h, int B) {
  f32* sumIm = sum + B;
  const f32 *xi = x + B, *hi = h + B;
  for (int j = 0; j < B; j += 4) {
    const Vec a = load(x + j), b = load(xi + j), c = load(h + j), d = load(hi + j);
    store(sum + j, add(load(sum + j), sub(mul(a, c), mul(b, d))));
    store(sumIm + j, add(load(sumIm + j), add(mul(a, d), mul(b, c))));
  }
}

/** Adds two products at once, so the sum is read and written once for both. */
void accumulate2(f32* sum, const f32* x, const f32* h, const f32* x2, const f32* h2, int B) {
  f32* sumIm = sum + B;
  const f32 *xi = x + B, *hi = h + B, *xi2 = x2 + B, *hi2 = h2 + B;
  for (int j = 0; j < B; j += 4) {
    const Vec a = load(x + j), b = load(xi + j), c = load(h + j), d = load(hi + j);
    const Vec e = load(x2 + j), f = load(xi2 + j), g = load(h2 + j), k = load(hi2 + j);
    store(sum + j,
          add(load(sum + j), add(sub(mul(a, c), mul(b, d)), sub(mul(e, g), mul(f, k)))));
    store(sumIm + j, add(load(sumIm + j),
                         add(add(mul(a, d), mul(b, c)), add(mul(e, k), mul(f, g)))));
  }
}

inline f32* spectrumAt(f32* line, const Level& level, int channel, int slot) {
  return line + (static_cast<size_t>(channel) * level.P + slot) * 2 * level.B;
}
inline const f32* impulseAt(const Level& level, int channel, int partition) {
  return level.spectra + (static_cast<size_t>(channel) * level.P + partition) * 2 * level.B;
}

/** The products of partitions `p` and `p + 1`, where there is one, with the spectra of the input that long ago. */
void products(const Level& level, int channel, int p, f32* sum) {
  int a = level.slot - p;
  if (a < 0) a += level.P;
  if (p + 1 < level.P) {
    int b = a - 1;
    if (b < 0) b += level.P;
    accumulate2(sum, spectrumAt(level.line, level, channel, a), impulseAt(level, channel, p),
                spectrumAt(level.line, level, channel, b), impulseAt(level, channel, p + 1),
                level.B);
  } else {
    accumulate(sum, spectrumAt(level.line, level, channel, a), impulseAt(level, channel, p),
               level.B);
  }
}

/** The first size: a block of 128 in, the same block out. */
void processFirst(Level& level, int channel, const f32* in, f32* out) {
  const int B = level.B;
  f32* input = level.input + channel * 2 * B;
  f32* sum = level.sum + channel * 2 * B;
  f32* spectrum = spectrumAt(level.line, level, channel, level.slot);
  copy(input + B, in, B);
  const int stages = stagesOf(B);
  for (int step = 0; step <= stages; step += 1) {
    forwardStep(spectrum, spectrum + B, B, level.tables, input, input + B, step);
  }
  copy(input, input + B, B);
  clear(sum, 2 * B);
  for (int p = 0; p < level.P; p += 2) products(level, channel, p, sum);
  for (int step = 0; step < stages; step += 1) inverseStep(sum, sum + B, B, level.tables, step);
  unfold(out, sum, sum + B, B, level.tables);
}

/** How many units the work on a hop of a larger size is cut into. */
inline int unitsOf(int B, int P) {
  const int stages = stagesOf(B);
  return kChannels * (stages + 1 + ((P + 1) >> 1) + stages + 1);
}

/** One unit of it: the forward steps, the products two by two, the inverse stages, the unfolding, for one channel and then the other. */
void work(Level& level, int unit) {
  const int B = level.B;
  const int stages = stagesOf(B);
  const int pairs = (level.P + 1) >> 1;
  const int each = stages + 1 + pairs + stages + 1;
  const int channel = unit >= each ? 1 : 0;
  int at = channel == 1 ? unit - each : unit;
  f32* sum = level.sum + channel * 2 * B;
  if (at <= stages) {
    // The hop that filled last, and the one before it.
    const f32* input = level.input + channel * 3 * B;
    const int last = level.hop == 0 ? 2 : level.hop - 1;
    const int before = last == 0 ? 2 : last - 1;
    f32* spectrum = spectrumAt(level.line, level, channel, level.slot);
    forwardStep(spectrum, spectrum + B, B, level.tables, input + before * B, input + last * B, at);
    return;
  }
  at -= stages + 1;
  if (at < pairs) {
    if (at == 0) clear(sum, 2 * B);
    products(level, channel, at * 2, sum);
    return;
  }
  at -= pairs;
  if (at < stages) {
    inverseStep(sum, sum + B, B, level.tables, at);
    return;
  }
  unfold(level.made + channel * B, sum, sum + B, B, level.tables);
}

/** A block of 128 of a larger size: what it made is added to `out`, and its share of the work is done. */
void processLater(Level& level, const f32 (&in)[kChannels][kQuantum], f32 (&out)[kChannels][kQuantum]) {
  const int B = level.B;
  const int at = level.fill;
  for (int channel = 0; channel < kChannels; channel += 1) {
    const f32* heard = level.heard + channel * B + at;
    f32* to = out[channel];
    for (int j = 0; j < kQuantum; j += 4) store(to + j, add(load(to + j), load(heard + j)));
    copy(level.input + (channel * 3 + level.hop) * B + at, in[channel], kQuantum);
  }
  const int slots = B / kQuantum;
  const int slot = at / kQuantum;
  const int due = slot + 1 == slots ? level.units : (level.units * (slot + 1)) / slots;
  for (; level.unit < due; level.unit += 1) work(level, level.unit);
  level.fill = at + kQuantum;
  if (level.fill < B) return;
  level.fill = 0;
  level.unit = 0;
  level.hop = level.hop == 2 ? 0 : level.hop + 1;
  level.slot = level.slot + 1 == level.P ? 0 : level.slot + 1;
  f32* heard = level.heard;
  level.heard = level.made;
  level.made = heard;
}

}  // namespace

/** How many bytes a room takes, apart from what its sizes work in. */
EXPORT int room_bytes() { return static_cast<int>(sizeof(Room)); }

/** Where its block of input goes, and where its block of output is. */
EXPORT f32* room_in(Room* room) { return room->in[0]; }
EXPORT f32* room_out(Room* room) { return room->out[0]; }

/** A room with nothing in it. `tail` is how many blocks of nothing it takes for it to have rung out. */
EXPORT void room_init(Room* room, int tail) {
  room->levels = 0;
  room->quiet = tail;
  room->tail = tail;
  clear(room->in[0], kChannels * kQuantum);
  clear(room->out[0], kChannels * kQuantum);
}

/**
 * Adds a size to a room, the smallest first. `line`, `sum`, `input`, `heard`
 * and `made` are zeros. `offset` is how far into a hop it starts, in samples:
 * rooms that start apart do not have their heaviest blocks together.
 */
EXPORT void room_level(Room* room, int B, int P, const f32* tables, const f32* spectra, f32* line,
                       f32* sum, f32* input, f32* heard, f32* made, int offset) {
  Level& level = room->level[room->levels];
  room->levels += 1;
  level.B = B;
  level.P = P;
  level.slot = 0;
  level.fill = offset;
  level.units = unitsOf(B, P);
  // Nothing has filled yet, so the first hop has no work.
  level.unit = level.units;
  level.hop = 0;
  level.tables = tables;
  level.spectra = spectra;
  level.line = line;
  level.sum = sum;
  level.input = input;
  level.heard = heard;
  level.made = made;
}

/** The spectrum of one partition of an impulse, into [re B, im B]: `samples` is the partition and B zeros after it, over B. */
EXPORT void room_spectrum(f32* to, int B, const f32* tables, const f32* samples) {
  const int stages = stagesOf(B);
  for (int step = 0; step <= stages; step += 1) {
    forwardStep(to, to + B, B, tables, samples, samples + B, step);
  }
}

/** One block: what is at `room_in` is convolved into `room_out`. 0 when the room has rung out, and then nothing is written. */
EXPORT int room_process(Room* room) {
  Vec any = wasm_f32x4_splat(0.0f);
  for (int j = 0; j < kChannels * kQuantum; j += 4) any = wasm_v128_or(any, load(room->in[0] + j));
  // Minus zero is nothing too.
  any = wasm_v128_and(any, wasm_i32x4_splat(0x7fffffff));
  if (wasm_v128_any_true(any)) {
    room->quiet = 0;
  } else if (room->quiet >= room->tail) {
    return 0;
  } else {
    room->quiet += 1;
  }
  Level& first = room->level[0];
  for (int channel = 0; channel < kChannels; channel += 1) {
    processFirst(first, channel, room->in[channel], room->out[channel]);
  }
  first.slot = first.slot + 1 == first.P ? 0 : first.slot + 1;
  for (int i = 1; i < room->levels; i += 1) processLater(room->level[i], room->in, room->out);
  return 1;
}
