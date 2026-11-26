// name: Glowing shore
// a: Night tide
// b: Wading
// what: A night beach under stars and a low headland: waves come in slanting out of a black sea, fall in cold blue living light, run up the dark sand as lace and leave sparks in the wash; or straight down into ankle-deep water, where the wake of someone who waded by curls in glowing threads over rippled sand, a foam edge beside it.
// follows: The swell keeps its own slow time. Each kind lights its own stretch of shore, or strand of the wake; the bands light the length of it, the piece its places. High and keys add sparks. A voice lights the far line, or the foam edge. A hit is a splash or a bright stir; a cue lights one whole wave from end to end, or runs up the wake. Music carries the wake on.
const float gsT = 10.0, gsHor = 0.2, gsVx = 1.7, gsC = 0.507, gsS0 = 3.1;
float gsS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }   // either way
// Noise that may be carried along for ever.
float gsGrain(vec2 p) {
  vec2 i = floor(p), f = p - i, j = mod(i + 1.0, 512.0); f = f * f * (3.0 - 2.0 * f); i = mod(i, 512.0);
  return mix(mix(hash21(i), hash21(vec2(j.x, i.y)), f.x), mix(hash21(vec2(i.x, j.y)), hash21(j), f.x), f.y);
}
float gsKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
// The living light: deep blue where weak, pale where strong, a little of what sounds.
vec3 gsGlow(float i, vec3 tint) {
  i = max(i, 0.0);
  float w = i * i / (0.6 + i);
  return i * vec3(0.006, 0.1, 0.46) * tint + w * vec3(0.02, 0.5 + 0.12 * uTone, 0.62) * mix(vec3(1.0), tint, 0.5) + w * max(i - 0.9, 0.0) * vec3(0.3, 0.24, 0.12);
}
// How brightly the water glows at x across the kinds and the bands and at a place in the piece, and in what tint.
float gsLife(float x, vec2 place, out vec3 tint) {
  float sum = 0.0, wide = 0.25;
  vec3 tc = vec3(0.4);
  float tw = 0.4;
  for (int k = 0; k < 4; k++) {
    float at = -0.6 + 0.4 * float(k) + 0.08 * sin(uTime * 0.05 + float(k) * 2.1), d = (x - at) / wide;
    float s = gsKind(k) * exp(-d * d);
    sum += s; tc += s * uKind[k] / max(max(uKind[k].r, max(uKind[k].g, uKind[k].b)), 0.1); tw += s;
  }
  tint = mix(vec3(1.0), tc / tw * 1.25, 0.45);
  float bx = band(sat(x / 1.7 + 0.5));
  vec4 pc = piece(vec2(place.x / 1.78 + 0.5, place.y));
  float l = (0.4 + 1.3 * uEnergy) * (0.75 * sum + 0.45 * bx + 0.5 * pc.a * gsS(0.89, 0.7, abs(place.x)));
  return 0.05 + 1.6 * (1.0 - exp(-l * 0.72));
}
// Foam: the walls between scattered holes, 0 on a wall.
float gsHoles(vec2 q) {
  vec2 i = floor(q), f = q - i; float m = 2.0, m2 = 2.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y); float h = hash21(i + g);
    vec2 d = g + 0.15 + 0.7 * vec2(h, fract(h * 91.7)) - f;
    float l = dot(d, d);
    if (l < m) { m2 = m; m = l; } else m2 = min(m2, l);
  }
  return sqrt(m2) - sqrt(m);
}
vec3 gsSky(vec2 p, float e) {
  vec3 c = mix(vec3(0.007, 0.023, 0.04), vec3(0.0006, 0.0016, 0.0075), gsS(-0.02, 0.25, e));
  // the pale road of stars
  vec2 m = rot(-0.95) * (p - vec2(-0.42, 0.36));
  float road = exp(-m.y * m.y * 34.0) * (0.45 + 0.9 * noise(m * 9.0)) * gsS(0.0, 0.16, e);
  c += vec3(0.0075, 0.0105, 0.016) * road;
  for (int k = 0; k < 2; k++) {
    float n = k == 0 ? 19.0 : 95.0;
    vec2 g = rot(0.5 + float(k)) * (p + 3.1) * n, id = floor(g), h = hash22(id + float(k) * 31.0);
    float big = fract(h.x * 57.3), d = length(fract(g) - 0.2 - 0.6 * h) / n, r = (0.5 + (k == 0 ? 0.8 : 0.15) * big * big) / uRes.y + (k == 0 ? 0.0005 : 0.0) * big * big * big;
    float on = gsS(0.02, 0.0, fract(h.y * 37.7) - (k == 0 ? 0.3 : 0.1) - 0.35 * road);
    c += mix(vec3(0.6, 0.8, 1.0), vec3(1.0, 0.86, 0.7), h.x) * on * exp(-d * d / (r * r)) * (k == 0 ? 0.06 + 0.8 * big * big * big * big * big : 0.03 + 0.12 * big * big) * gsS(0.0, 0.1, e) * (0.85 + 0.15 * sin(uTime * (0.5 + h.x) + h.y * 60.0));
  }
  // the low headland, two ranges
  float px = 1.5 / uRes.y, x = p.x;
  if (e > 0.17) return c;
  float rough = gsS(0.0, 0.15, x) * (0.006 * noise(vec2(x * 27.0, 1.0)) + 0.003 * noise(vec2(x * 90.0, 5.0)));
  float t1 = 0.052 * gsS(0.1, 0.5, x) * (1.0 + 0.2 * sin(x * 9.0)) + 0.018 * gsS(0.03, 0.2, x) + rough - 0.006;
  float t2 = 0.075 * gsS(0.42, 0.86, x) + 0.02 * gsS(0.36, 0.5, x) * (1.0 + 0.3 * sin(x * 17.0)) + rough * 1.5 - 0.006;
  c = mix(c, vec3(0.0035, 0.0085, 0.013), gsS(px, -px, e - t1));
  c = mix(c, vec3(0.0014, 0.003, 0.005), gsS(px, -px, e - t2));
  return c;
}
float gsAt() { return 0.42 * sin(uTime * 0.07 + 2.5); }
float gsBreak(float u, float k, float n) {
  float b = 0.4 + 0.2 * sin(u * 0.37 + n * 3.7) + 0.05 * sin(u * 0.83 + n * 2.3);
  float open = gsS(3.6, 1.1, k) + 0.5 * exp(-(k - 5.2) * (k - 5.2) * 3.0);
  return gsS(-0.06, 0.18, open * 1.3 - b - 0.08);
}
float gsBend(float u, float k, float n) {
  return 0.11 * sin(u * 0.47 + n * 2.4) + 0.06 * sin(u * 0.93 + n * 5.1) + (noise(vec2(u * 1.1 + n * 2.3, n + 9.0)) - 0.5) * 0.2 * gsS(5.0, 1.0, k);
}
// Sparks lying on the shore, at (x, depth d under the horizon)
float gsSparks(vec2 p, float d, float many, float seed) {
  vec2 g = vec2(p.x * 95.0, log(d) * 32.0) + seed;
  g.x += 13.0 * hash11(floor(g.y));
  vec2 id = floor(g), h = hash22(id), q = (fract(g) - 0.15 - 0.7 * h) * vec2(1.0 / 95.0, d / 32.0);
  if (fract(h.y * 19.0) > many * 1.7) return 0.0;
  float big = fract(h.x * 71.0), r = 0.6 / uRes.y + (0.0001 + 0.0017 * big * big * big * big) * d * 2.0;
  float tw = 0.5 + 0.5 * sin(uTime * (0.6 + 1.6 * h.x) + h.y * 80.0);
  return gsS(0.0, 0.05, many * (0.3 + 1.4 * gsS(0.35, 0.75, noise(id * 0.13))) - fract(h.y * 19.0)) * exp(-dot(q, q) / (r * r)) * (0.3 + tw * tw) * (0.4 + big);
}
vec3 gsTide(vec2 p) {
  float d = gsHor - p.y, px = 1.0 / uRes.y;
  if (d <= 0.0) return gsSky(p, -d);
  d = max(d, 0.0015);
  float gx = max(gsVx - p.x, 0.05), s = gsC * gx / d, q = (p.x * gsVx + 1.0) / gx, u = q * s;
  float K = log(s / gsS0) / 0.4;   // 0 the waterline, 1 a wave further out
  float f = fract(uTime / gsT), n0 = mod(floor(uTime / gsT), 256.0);
  vec3 tint; float life = gsLife(p.x, vec2(p.x, gsS(0.0, 0.5, d)), tint);
  // the sea: the low sky, broken by ripples
  float r1 = gsGrain(vec2(u * 0.6 + uTime * 0.1, s * 1.6 + uTime * 0.25)), r2 = gsGrain(vec2(p.x * 24.0 + uTime * 0.12, log(d) * 34.0 - uTime * 0.3)) * 0.62 + gsGrain(vec2(p.x * 61.0 - uTime * 0.2, log(d) * 77.0 - uTime * 0.5)) * 0.38;
  float calm = gsS(0.004, 0.05, d);
  vec3 c = mix(vec3(0.009, 0.027, 0.04), vec3(0.0022, 0.0062, 0.012), gsS(0.0, 0.2, d));
  c *= 0.75 + calm * (0.7 * r2 - 0.1 + 0.5 * (r1 - 0.5));
  c *= 1.0 - 0.6 * gsS(0.05, 0.5, p.x) * gsS(0.05, 0.0, d);
  // the sand
  float shore = 0.0;
  if (K < 0.6) {
    float grain = noise(p * uRes.y * 0.45) * 0.5 + noise(vec2(u * 2.2, s * 5.0)) * 0.5;
    float wet = gsS(-2.6, -0.7, K + 0.4 * noise(vec2(u * 0.7, 3.0)));
    vec3 sand = mix(vec3(0.0062, 0.0061, 0.0068) * (0.5 + 1.0 * grain), vec3(0.0028, 0.0062, 0.0105) * (0.85 + 0.3 * grain), wet);
    c = mix(c, sand, gsS(0.3, 0.0, K));
    float sea = gsS(0.6, 0.2, K), light = 0.0, film = 0.0, spark = 0.0, pale = 0.0;
    float froth = noise(vec2(u, s) * 21.0) * 0.5 + noise(vec2(u * 43.0, s * 34.0)) * 0.5;
    vec2 warp = (vec2(noise(vec2(u, s) * 2.2), noise(vec2(u, s) * 2.2 + 7.0)) - 0.5) * 2.2;
    for (int i = 0; i < 2; i++) {
      float a = f + float(i), n = mod(n0 - float(i), 256.0), A = 1.55;
      if (a > A) break;
      float R = 0.95 + 0.5 * hash11(n + 0.5);
      float lb = 0.18 * sin(u * 1.1 + n * 3.3) + 0.11 * sin(u * 2.3 + n * 1.9) + (noise(vec2(u * 2.9 + n, 5.0)) - 0.5) * 0.22;
      float up = a < 0.5 * A ? 1.0 - pow(1.0 - 2.0 * a / A, 2.0) : 1.0 - pow(2.0 * a / A - 1.0, 2.0);
      float fr = -up * (R + lb), back = K - fr;   // behind its edge
      float fade = exp(-a * 1.1) * gsS(1.55, 1.2, a);
      float in_ = gsS(0.0, 0.03, back);
      film = max(film, in_ * gsS(1.55, 1.3, a));
      float dens = exp(-max(back, 0.0) * 1.1 - 0.5 * a) * gsS(1.55, 1.1, a) * gsS(0.0, 0.15, a) * sea, lace = 0.0;
      if (in_ > 0.0 && dens > 0.05) {
        vec2 lq = vec2(u, s + up * 0.6) * 5.5 + n * 11.0;
        lq += warp;
        lace = gsS(0.1 + 0.75 * dens * dens, 0.02 + 0.3 * dens, gsHoles(lq)) * in_ * gsS(0.03, 0.4, dens) * (0.12 + 0.88 * gsS(0.38, 0.72, noise(lq * 0.45 + 3.0) + 0.3 * dens));
        lace *= 0.25 + 1.5 * froth * froth;
      }
      float rim = exp(-abs(back) * d * 130.0) * fade * gsS(0.0, 0.08, a);
      pale += lace * 0.6 + rim * 0.5;
      light += lace * exp(-back * 0.9) + rim * (0.35 + 1.5 * froth) + 0.08 * in_ * dens;
      // sparks left where it turned
      float top = K + R + lb;
      spark += exp(-top * top * 9.0) * gsS(0.3, 0.8, a) * gsS(1.55, 1.0, a) + in_ * dens * 0.6;
    }
    vec3 wetc = vec3(0.0035, 0.009, 0.015) * (0.8 + 0.4 * r2);
    c = mix(c, wetc, film * 0.75 * sea);
    c += vec3(0.009, 0.016, 0.022) * pale;
    c += gsGlow(life * 0.16 * exp(min(K, 0.0) * 1.5), tint) * (0.3 + 1.2 * grain * grain) * (1.0 - film);
    c += gsGlow(light * life, tint);
    c += gsGlow(1.0, tint) * 1.8 * gsSparks(p, d, 0.08 + 0.4 * spark * (0.6 + uHigh), 3.0) * spark * (0.12 + life) * (0.5 + uHigh + uKeys);
    shore = (0.4 * film + 0.5 * wet) * sea;
  }
  // the waves, far ones first
  float kp = max(floor(K + f), 0.0), hx = p.x - gsAt(), lost = 0.0, lostI = 0.0;
  for (int j = 0; j < 4; j++) {
    float k = kp + 2.0 - float(j);
    if (k < -0.5 || k > 9.0) continue;
    float n = mod(k + n0, 256.0), k0 = k - f, wt = (9.0 - k0) * gsT;   // its age
    float u0 = q * gsS0 * exp(0.4 * k0);
    float kk = k0 + gsBend(u0, k0, n), dk = gsC * gx / (gsS0 * exp(0.4 * kk));
    if (dk > d * 2.4 || dk < d * 0.44) continue;
    float low = (0.05 + 0.33 * exp(-(k0 - 1.9) * (k0 - 1.9) * 0.45)) * gsS(-0.2, 0.7, k0);
    if (K - kk > 1.2 && dk - d > 3.0 * low * dk || d - dk > 9.0 * max(low * dk, 0.0012)) continue;
    float in_ = gsS(8.5, 6.5, k0), there = gsS(0.0, 0.3, k0) * gsS(2.0, 1.6, K - k0), own = 0.5 + 0.35 * sin(u0 * 0.9 + n * 2.7 + wt * 0.2);
    float br = gsBreak(u0, k0, n);
    if (br > 0.0) dk *= 1.0 + br * (0.08 * noise(vec2(q * 18.0 + n, wt * 0.3)));
    float hg = low * (0.8 + 0.4 * own), hh = max(hg * dk, 0.0012), v = (dk - d) / hh;
    float cx = p.x + 0.9 - 1.8 * (1.0 - uCue), cue = uCue * exp(-(k0 - 1.6) * (k0 - 1.6) * 2.5);
    float I = (life * (0.7 + 0.6 * own) + cue * (0.9 + 1.4 * exp(-cx * cx * 7.0)) + 1.7 * uHits * exp(-hx * hx * 45.0 - (k0 - 1.5) * (k0 - 1.5) * 1.5) + (0.22 + 0.6 * uMic) * exp(-(k0 - 5.0) * (k0 - 5.0) * 2.0)) * in_;
    if (v > 0.0) {
      // the wash it has left
      float gone = K - kk, lo = gsS(0.6, 0.9, v) * gsBreak(u0, K, n) * exp(-gone * 2.2) * gsS(1.2, 0.8, gone) * gsS(-0.1, 0.3, K);
      lost = max(lost, lo); lostI = max(lostI, lo * I);
      float top = 1.0, cover = 0.0;
      if (v < 1.5) {
        vec2 bq = vec2(q * 15.0 + n * 3.0, v * 1.7 - wt * 0.3);
        float b0 = br > 0.0 ? noise(bq) : 0.5, bump = br <= 0.0 ? 0.5 : abs(2.0 * noise(bq * 1.6 + b0 * 1.5 + 5.0) - 1.0), fine = br <= 0.0 ? 0.5 : abs(2.0 * noise(bq * vec2(4.1, 2.6) + b0 * 2.0) - 1.0), mist = br <= 0.0 ? 0.5 : noise(bq * vec2(11.0, 5.0));
        float tall = mix(1.0, 0.62 + 0.45 * b0 + 0.22 * bump + 0.18 * (mist - 0.5), br), aa = px / hh;
        float on = gsS(tall + aa, tall - aa, v) * in_ * there;
        // a dark steep face with a thin pale lip
        vec3 face = c * mix(1.0, 0.4, gsS(0.0, 0.7, v));
        face += vec3(0.006, 0.014, 0.02) * gsS(0.7, 1.0, v) * 0.7 + gsGlow(I * 0.35 * gsS(0.55, 1.0, v) * gsS(4.0, 2.0, kk), tint);
        // tumbling foam, brightest at its foot and in its folds
        float body = 0.2 + (1.1 * gsS(-0.35, 0.65, bump) * (0.25 + b0) + 0.4 * fine) * (0.5 + 0.8 * mist);
        vec3 foam = vec3(0.0115, 0.0205, 0.029) * body + gsGlow(I * body * (1.3 * exp(-v * 2.2) + 0.45 + 0.4 * gsS(0.5, 1.0, v / tall)), tint);
        top = tall; cover = on; lost *= 1.0 - on; lostI *= 1.0 - on;
        float spill = gsS(-0.2, 0.2, v - 1.0 + br * 1.6 + 0.35 * (b0 - 0.5) + 0.25 * (bump - 0.5)) * gsS(0.0, 0.15, br);   // from the crest down
        c = mix(c, mix(face, foam, spill), on * mix(gsS(0.0, 0.5, v), 1.0, spill));
      }
      c += there * gsGlow(I * br * 0.1 * exp(-max(v - top, 0.0) * 2.0) * (1.0 - cover), tint) * (0.6 + 0.8 * uSpace);
    } else {
      // its light on the water before it
      float vr = -v, m = (0.35 + 0.5 * shore) * exp(-vr * 0.9) * (0.25 + 1.6 * r2 * r2) + 0.07 * exp(-vr * (0.5 - 0.25 * uSpace));
      m *= gsS(0.44, 0.7, dk / d) * there;
      c += gsGlow(I * br, tint) * m * 0.8;
      c += gsGlow(I * br * 0.8, tint) * there * exp(-vr * 9.0);
    }
  }
  // the lace of the wash
  vec2 lq = mat2(0.83, -0.56, 0.56, 0.83) * vec2(p.x * 26.0, log(d) * 11.0) + (vec2(r1, r2) - 0.5) * 1.6;
  float lace = gsS(0.08 + 0.7 * lost * lost, 0.02 + 0.3 * lost, gsHoles(lq) + 0.2 * (r2 - 0.5)) * gsS(0.02, 0.08, lost);
  c += vec3(0.006, 0.009, 0.012) * lace * lost + gsGlow(lostI * (lace * 0.7 + 0.05), tint);
  c += gsGlow(1.0, tint) * gsSparks(p, d, 0.25 + 0.4 * uHigh, 1.0) * lost * (0.1 + life) * (0.5 + uHigh);
  return c;
}
// A splash at v from its middle, t from 0 to 1: drops of light thrown out to reach, falling back by g.
float gsSplash(vec2 v, float t, float reach, float tall, float g) {
  float s = 0.0;
  vec2 w = (v + vec2(0.0, g * t * t)) / vec2(1.0, tall);
  float r = length(w) + 0.0001, turn = atan(w.y, w.x + 0.00001) / TAU;
  for (int i = 0; i < 4; i++) {
    float n = 23.0 + 14.0 * float(i), a = turn * n + float(i) * 0.37, id = floor(a);
    float h = hash21(vec2(mod(id, n), float(i) * 7.0 + 1.0)), h2 = fract(h * 73.0);
    float R = reach * (0.1 + 0.9 * h * h) * t * (2.0 - t), z = 0.9 / uRes.y + 0.0011 * h2 * h2;
    vec2 e = vec2((a - id - 0.3 - 0.4 * h2) * TAU * r / n, r - R) * vec2(1.0, 0.8);
    s += exp(-dot(e, e) / (z * z)) * (0.4 + h2);
  }
  return s;
}
// Single sparks in the water seen from above, n across a unit.
float gsDust(vec2 p, float n, float many) {
  float s = 0.0;
  for (int k = 0; k < 2; k++) {
    vec2 g = rot(0.6 + float(k)) * p * n + float(k) * 17.0, id = floor(g), h = hash22(mod(id, 1009.0));
    vec2 v = (fract(g) - 0.2 - 0.6 * h) / n;
    float big = fract(h.x * 71.0), z = 0.6 / uRes.y + 0.0017 * big * big * big * big, tw = 0.5 + 0.5 * sin(uTime * (0.5 + 1.5 * h.x) + h.y * 80.0);
    s += gsS(0.0, 0.1, many - fract(h.y * 19.0)) * exp(-dot(v, v) / (z * z)) * (0.25 + tw * tw) * (0.4 + big);
    n *= 1.7;
  }
  return s;
}
// The same water from above: the wake of someone wading.
const vec2 gsFrom = vec2(0.96, -0.45), gsAlong = vec2(-0.891, 0.454);
vec3 gsWade(vec2 p) {
  const float S = 0.36;
  // the water's slow shapes, and the ring of a hit
  float h1 = gsGrain(p * 3.0 + vec2(uTime * 0.09, -uTime * 0.05)), h2 = gsGrain(p * 7.0 - vec2(uTime * 0.11, uTime * 0.13) + 9.0);
  vec2 slope = (vec2(h1, h2) - 0.5) * 0.022;
  vec2 at = vec2(0.3 * sin(uTime * 0.06), -0.08 + 0.14 * cos(uTime * 0.047)), va = p - at;
  float l = length(va) + 0.001, z = (l - (1.0 - uHits) * 0.3 - 0.012) * 100.0;
  float ring = exp(-z * z) * gsS(0.35, 0.65, noise(va / l * 4.0 + l * 9.0 + 20.0)) * uHits;
  slope += va / l * z * exp(-z * z) * uHits * 0.012;
  // unroll the eddies: what is a curl on the water is a straight thread here
  float roll = uTravel * 0.09, f = fract(roll), j0 = floor(roll);
  vec2 q = p - gsFrom;
  q = vec2(dot(q, gsAlong), dot(q, vec2(-gsAlong.y, gsAlong.x)));
  q.y -= 0.07 * sin(q.x * 3.4 + 0.5 + uTime * 0.03) * gsS(0.0, 0.5, q.x);
  q += (vec2(h1, h2) - 0.5) * 0.05 * gsS(0.0, 0.6, q.x);
  vec2 q0 = q;
  for (int j = 0; j < 7; j++) {
    float at_ = (float(j) + f) * S, side = mod(float(j) - j0, 2.0) < 0.5 ? 1.0 : -1.0;
    float R = 0.04 + 0.045 * at_;
    vec2 w = q - vec2(at_, side * (0.025 + 0.055 * at_));
    float r = length(w), e = exp(-r * r / (R * R * 2.6));
    float tu = side * 5.2 * (1.0 - exp(-at_ * 3.2)) * gsS(7.0 * S, 6.0 * S, at_) * exp(-r / R * 0.7) * e;
    q = rot(-tu) * w + (q - w);
  }
  float gone = max(q.x, 0.0), wd = 0.006 + 0.06 * sqrt(gone) + 0.045 * gone, n = q.y / wd, along = q.x - roll * S;
  float body = exp(-n * n * 0.9) * gsS(-0.03, 0.06, q.x) * exp(-gone * 0.4);
  float th = gsGrain(vec2(along * 5.0, n * 5.0)) * 0.55 + gsGrain(vec2(along * 13.0, n * 15.0 + 4.0)) * 0.45;
  float edge = exp(-(abs(n) - 0.75) * (abs(n) - 0.75) * 16.0) + 0.6 * exp(-n * n * 30.0);
  float thread = gsS(0.35, 0.8, th) * 0.9 + edge * (0.4 + 0.9 * th);
  // who lights it: each kind its own stream of the wake
  vec3 tint; float life = gsLife(clamp(n * 0.4, -0.8, 0.8), vec2(p.x, sat(0.5 - p.y)), tint);
  float run = (1.0 - uCue) * 2.2, cue = uCue * exp(-(q0.x - run) * (q0.x - run) * 9.0) * 1.8;
  float stir = uHits * exp(-dot(va, va) * 55.0 / (0.35 + 1.5 * (1.0 - uHits)));
  float I = life + cue + 0.13 + 1.3 * stir;
  // the sand under it, in ripples, lit by what glows above
  vec2 b = p + slope * 1.5 + gsAlong * -uTravel * 0.012;
  float warp = noise(b * 2.1) * 7.0 + noise(b * 5.3 + 3.0) * 3.4 + noise(b * 14.0) * 0.8, ph = dot(b, vec2(52.0, 71.0)) + warp;
  float tall = 0.35 + 0.65 * gsS(0.25, 0.7, noise(b * 3.1 + 20.0));
  ph += 0.7 * sin(ph);
  float rip = sin(ph) * tall, dn = cos(ph) * tall;
  float spread = exp(-q0.y * q0.y / (0.02 + 0.05 * max(q0.x, 0.0) + 0.03 * uSpace)) * gsS(-0.35, 0.2, q0.x) * exp(-max(q0.x, 0.0) * 0.3);
  float lit = 0.5 + 0.5 * dn * clamp(q0.y * 8.0, -1.0, 1.0);
  float gr = gsGrain(b * uRes.y * 0.35);
  vec3 c = vec3(0.0014, 0.0046, 0.0078) * (0.8 + 0.42 * rip + 0.6 * (gr - 0.5)) * (0.5 + h1);
  c += gsGlow(I * spread * 0.3, tint) * (0.12 + 0.95 * lit) * (0.6 + 0.8 * gr);
  // the threads, and the single sparks they are made of
  vec2 dp = p - gsAlong * roll * S;
  float dust = gsGrain(dp * 110.0) * 0.5 + gsGrain(rot(0.7) * dp * 240.0) * 0.5, glow = body * thread;
  float head = exp(-(gone - 0.75) * (gone - 0.75) * 4.0);
  c += gsGlow(I * glow * (0.5 + 1.6 * dust * dust) * (1.0 + 0.9 * head), tint) + gsGlow(I * body * 0.12, tint);
  c += gsGlow(1.0, tint) * gsDust(dp, 70.0, 0.05 + 0.6 * glow + 0.15 * spread * (uHigh + uKeys) + 0.6 * stir) * (0.1 + I) * (0.12 + 1.3 * glow + 0.5 * uHigh * spread + 1.2 * stir);
  // the edge of a spent wave coming over from the corner
  float far = dot(p, vec2(0.62, 0.785)) - 0.52 - 0.05 * sin(uTime * 0.21) - 0.16 * (noise(p * 2.6 + vec2(0.0, uTime * 0.02)) - 0.5) - 0.05 * (noise(p * 8.0 + 4.0) - 0.5);
  if (far > -0.06) {
    vec3 t2; float l2 = gsLife(0.6 * (p.y - p.x) + 0.2, vec2(p.x, sat(0.5 - p.y)), t2);
    l2 += uCue * 1.2 + 0.4 * uMic;
    float dens = exp(-max(far, 0.0) * 6.0), ho = gsHoles(p * 25.0 + (vec2(h2, noise(p * 9.0 + 2.0)) - 0.5) * 2.5);
    float on = gsS(0.0, 0.006, far), lace = gsS(0.1 + 0.6 * dens * dens, 0.02 + 0.25 * dens, ho) * on * (0.1 + 0.9 * gsS(0.35, 0.7, noise(p * 6.0 + 30.0) + 0.3 * dens));
    float froth = noise(p * 85.0) * 0.5 + noise(p * 190.0) * 0.5;
    lace *= 0.2 + 1.6 * froth * froth;
    float rim = exp(-abs(far) * (far > 0.0 ? 90.0 : 300.0)) * (0.3 + 1.4 * froth);
    c = mix(c, c * 0.7, on);
    c += vec3(0.009, 0.013, 0.017) * (0.8 * lace * dens + rim) + gsGlow(l2 * (0.8 * lace * dens + rim + 0.1 * exp(-abs(far) * 16.0)), t2);
    c += gsGlow(1.0, t2) * gsDust(p, 60.0, 0.4 * dens * on) * (0.1 + l2) * dens;
  }
  c += gsGlow(1.0, tint) * (0.8 * ring * (0.1 + 1.4 * dust * dust) + stir * (0.9 * dust * dust + 0.12));
  return c;
}
vec3 render(vec2 p) {
  vec3 c = uVar < 0.5 ? gsTide(p) : gsWade(p);
  if (uVar < 0.5 && uHits > 0.005) {
    // a splash on the near wave
    float x = gsAt(), t = 1.0 - uHits;
    vec2 v = p - vec2(x, gsHor + 0.02 - gsC * (gsVx - x) / (gsS0 * 1.7));
    if (abs(v.x) < 0.4) c += gsGlow(1.1, vec3(1.0)) * uHits * (2.2 * gsSplash(v, t, 0.2, 0.7, 0.08) * gsS(-0.03, 0.0, v.y) + 1.4 * exp(-v.x * v.x * 110.0 / (0.3 + 2.0 * t) - v.y * v.y * 2600.0) * (0.4 + noise(v * vec2(70.0, 130.0) + 40.0)) + 0.3 * exp(-v.x * v.x * 60.0 - v.y * v.y * 500.0));
  }
  return screenOf(c);
}
