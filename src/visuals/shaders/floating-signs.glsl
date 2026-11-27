// name: Floating signs
// a: Washed blue
// b: Night ground
// what: Seven small painted signs - pebble, hook, fork, seed, coil, comb and split ring - float on a scrubbed, washed-blue ground, each tied by a thread to one slack cord, with runs of thin colour below it; or the same signs in bone and pigment on rubbed dark earth, set another way, with lit knots where the threads are tied.
// follows: Drone swells the pebble, pad the hook, texture the fork, phrase the seed, middle tones and keys the coil; the bands are the teeth of the comb. A bead on the cord is now; below it each run is as long as the piece is loud there. A hit fills the split ring and drops a bead, a voice thickens its paint, a cue soaks the cord and tugs it so the signs bob.
// own: 0 the ground: 1 pale paper, -1 a field in the drone's colour; 1 1 a crowd of small ones, -1 only three, large; 2 1 rounds and moons, -1 kites with tails; 3 1 raised and lit, -1 outlines only; 4 1 strewn near and far, -1 one size in a row; 5 1 the runs fall long and broad, -1 no cord, threads or runs; 6 1 lamps in dark air, -1 still water under the cord mirrors them; 7 1 a wind lays them over, -1 each turns slowly
// The picture so far; the tooth of the cloth, two drags of the brush, a pixel, how far this place is inside the pebble.
vec3 gC;
float gT, gA, gB, gF, gPx, gIn, gW, gNarrow, gWide, gK, gZ, gV;
bool gN;                // the night ground
vec3 gInk, gOver; vec2 gQ; // the inks of a sign, its place
vec4 gSlow;             // slow turns that every sign shares, each in its own mix

vec3 fsRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
// A kind's colour as a pigment, with a little earth ground into it.
vec3 fsPig(int k) { vec3 c = uKind[k]; return gN ? fsRich(c, 1.05) * vec3(1.06, 0.96, 0.86) + vec3(0.06, 0.04, 0.01) : fsRich(c, 1.02) * vec3(0.95, 0.84, 0.78) + vec3(0.03, 0.01, 0.0); }
// The slack cord across the lower third, and the dip a cue sends along it.
float fsDip(float x) {
  if (uCue < 0.004) return 0.0;
  float far = x - mix(1.0, -1.0, uCue);
  return -0.17 * uCue * (1.0 - uCue) * exp(-far * far * 6.0);
}
float fsHold(float x) {
  float u = x / gW;
  float y = (gN ? -0.29 - 0.05 * u : -0.318 + 0.035 * u) + 0.11 * u * u * (1.0 - 0.6 * gNarrow);
  y += 0.012 * sin(u * 4.1 + uTime * 0.21) + (0.005 + 0.012 * uLow * uEnergy) * sin(u * 8.3 + uTravel * 0.4);
  if (uOwn[4] < 0.0) y = mix(y, -0.3 + 0.004 * sin(u * 8.3 + uTravel * 0.4), -uOwn[4]);
  return y;
}
float fsCord(float x) { return fsHold(x) + fsDip(x); }

// A small round spot.
void fsSpot(float d, vec3 pig) { gC = mix(gC, pig, (1.0 - smoothstep(-gPx, gPx, d + (gT - 0.5) * 0.0024))); }
// Paint laid to a distance d (less than 0 inside), body 1 thick to 0 dry.
float fsLay(float d, vec3 pig, float body) {
  float e = d + (gT - 0.5) * 0.0024 + (gA - 0.5) * 0.0026;
  float cov = (1.0 - smoothstep(-gPx, gPx, e)) * (1.0 - (1.0 - body) * smoothstep(0.38, 0.68, gB * 0.82 + gT * 0.18));
  pig *= (1.0 + 0.2 * (gB - 0.5)) * (gN ? 1.0 - 0.28 * smoothstep(-0.02, 0.0, d) : 1.0 - 0.2 * smoothstep(-0.007, 0.0, d));
  gC = mix(gC, pig, cov);
  return cov;
}
float fsMark(float d, vec3 pig, float lv) {
  if (uOwn[3] < 0.0) {
    vec3 keep = gC;
    float c = d > 0.02 ? 0.0 : fsLay(mix(d, abs(d) - 0.0022 - 0.0015 * gB, sat(-1.5 * uOwn[3])), pig, 0.9);
    gC = mix(gC, mix(gC, pig, 0.16 + 0.2 * lv), -uOwn[3] * (1.0 - smoothstep(-gPx, gPx, d)) * 0.6);
    return c * (1.0 + uOwn[3]);
  }
  if (uOwn[3] > 0.0) {
    vec2 g = vec2(dFdx(d), dFdy(d));
    float run = length(g) / gPx;
    g /= max(length(g), 1e-5);
    float to = dot(g, vec2(-0.64, 0.77)) * smoothstep(0.35, 0.75, run) * smoothstep(1.7, 1.35, run);   // no side where two edges meet
    gC *= 1.0 - uOwn[3] * 0.3 * exp(-max(d, 0.0) * 34.0) * smoothstep(-0.004, 0.0, d) * smoothstep(0.09, 0.03, d);
    if (d > 0.01) return 0.0;
    float in_ = sat(-d / 0.03), o = 1.0 - in_, c = fsLay(d, pig, 1.0);
    gC *= 1.0 + c * uOwn[3] * (o * o * to * 0.7 + 0.1);
    gC += c * uOwn[3] * 0.3 * smoothstep(0.75, 1.0, to) * smoothstep(0.12, 0.35, in_) * smoothstep(0.75, 0.35, in_);
    return c;
  }
  return d > 0.01 ? 0.0 : fsLay(d, pig, (gN ? 0.5 : 0.66) + (gN ? 0.5 : 0.34) * lv);
}

// The signs, each standing on its foot: q is 0 there and about 2 at the top, z is its size, lv how strongly it sounds.
void fsInks(float lv) {
  gInk = gN ? mix(vec3(0.54, 0.50, 0.41), vec3(0.93, 0.86, 0.71), 0.3 + 0.7 * lv) : mix(vec3(0.15, 0.155, 0.18), vec3(0.04, 0.035, 0.045), lv);
  if (uOwn[0] > 0.0 && gN) gInk = mix(gInk, mix(vec3(0.3, 0.27, 0.25), vec3(0.07, 0.06, 0.06), lv), uOwn[0]);
  gOver = mix(gInk, gN ? vec3(0.1, 0.08, 0.08) : vec3(0.93, 0.87, 0.7), gIn); // what crosses the pebble turns over
}
void fsPebble(vec2 q, float z, float lv) {
  vec2 r = q - vec2(0.0, 0.86);
  r += 0.13 * sin(r.yx * 2.1 + vec2(0.5, 2.0)) - 0.05 * sin(r.yx * 4.3 + 1.0);
  float d = (length(r * vec2(0.92, 1.12)) - 0.84) * z * 0.9;
  vec3 pig = fsPig(0);
  pig *= gN ? 0.6 + 0.4 * lv : 0.92 - 0.2 * lv;
  pig *= 1.0 + 0.22 * (gA - 0.5) + 0.12 * sat(0.5 - 0.5 * r.x + 0.5 * r.y) - 0.06;
  gIn = fsMark(d, pig, 0.5 + 0.5 * lv);
  // its underside lies in shadow, higher the louder
  float low = r.y + 0.36 - 0.14 * lv + 0.32 * r.x - 0.22 * r.x * r.x;
  fsMark(max(d + 0.006, low * z), gN ? pig * 0.42 : mix(pig * 0.4, gInk, 0.45), 0.8);
}
// Hook, a drop hanging in its crook.
void fsHook(vec2 q, float z, float lv) {
  vec2 m = (q - vec2(0.33, 1.14 - 0.06 * lv)) * vec2(1.45, 0.8);
  m.x += 0.22 * m.y * m.y + 0.08 * m.y; m.x *= 1.0 + 0.5 * m.y;
  fsMark((length(m) - 0.19 - 0.13 * lv) * z * 0.75, fsPig(1), 0.5 + 0.5 * lv);
  // a shaft that leans into the left end of a bent crook, thick over the top and thin at both ends
  float t = sat(q.y / 1.35), bend = 0.11 * sin(PI * t), w = mix(0.02, 0.083, t * t);
  vec2 k = (q - vec2(0.335, 1.35)) * vec2(1.0, 0.86);
  float along = 0.5 - 0.5 * k.x / max(length(k), 1e-4), r = abs(length(k) - 0.335 - 0.03 * k.x);
  float d = max(abs(q.x + bend) * 0.98 - w, max(q.y - 1.36, -q.y - 0.02));
  if (q.y > 1.32 || q.x > 0.3) d = min(d, r - mix(0.115, 0.085, along) * (1.0 - 0.45 * sat(1.3 - q.y)));
  if (q.x > 0.3) d = max(d, 1.08 - q.y + 0.4 * (0.6 - q.x));
  fsMark(smin(d, length(q - vec2(0.56, 1.09)) - 0.10 - 0.05 * lv, 0.08) * z, gOver, lv);
}
// Fork, a stone held between two of its tines.
void fsFork(vec2 q, float z, float lv) {
  vec2 e = q - vec2(-0.23, 1.3 + 0.1 * lv);
  e = rot(-0.22) * e; e += 0.04 * sin(e.yx * 9.0);
  fsMark((length(e * vec2(1.5, 1.0)) - 0.24 - 0.16 * lv) * z * 0.8, fsPig(2), 0.5 + 0.5 * lv);
  float k = q.x < 0.0 ? 2.7 : 1.5, up = q.y - 0.83, side = abs(up - k * q.x * q.x) / sqrt(1.0 + 4.0 * k * k * q.x * q.x) - mix(0.085, 0.03, sat(abs(q.x) * 1.8));
  side = max(side, q.y - 1.35 + 0.35 * q.x - (q.x < 0.0 ? 0.1 : 0.15));
  float stem = abs(q.x - 0.05 * sin(q.y * 2.4)) - mix(0.028, 0.072, 1.0 - abs(q.y - 0.9) / 1.1);
  float d = min(side, max(stem, max(q.y - 1.98, -q.y)));
  fsMark(d * z, gOver, lv);
}
// Seed.
void fsSeed(vec2 q, float z, float lv) {
  vec2 r = q - vec2(0.0, 0.95);
  r.x += 0.1 * r.y * r.y - 0.06;
  float d = max(length(r - vec2(0.62, 0.0)), length(r + vec2(0.62, 0.0))) - 1.1;
  float tail = abs(q.x + 0.6 * (q.y - 1.72) * (q.y - 1.72) * 1.8) * 0.8 - mix(0.06, 0.015, sat((q.y - 1.7) * 1.8));
  fsMark(max(tail, max(abs(q.y - 1.98) - 0.3, uOwn[3] > 0.0 ? abs(q.x) - 0.36 : -1.0)) * z, gInk, lv);
  fsMark(d * z, gInk, lv);
  fsMark(max(d + 0.03, 0.02 - r.x + 0.12 * r.y * r.y - 0.2 * lv) * z, fsPig(3), lv);
}
// Split ring.
void fsRing(vec2 q, float z, float lv) {
  vec2 r = q - vec2(0.0, 0.9), l = r + vec2(0.06, 0.0), m = r - vec2(0.06, -0.1), n = vec2(0.953, 0.301);
  float left = max(max(length(l) - 0.88, 0.64 - length(l - vec2(0.08, 0.02))), dot(l, n) - 0.02);
  float right = max(abs(length(m) - 0.79) - 0.07 - 0.04 * lv, 0.1 - dot(m, n));
  // a hit fills the pit with colour
  gC = mix(gC, fsPig(4), (1.0 - smoothstep(-0.16, 0.12, length(r - vec2(0.03, -0.03)) - 0.5 + (gA - 0.5) * 0.3)) * sat(uHits * 1.2) * 0.95);
  fsMark(left * z, gOver, max(lv, uMic));
  fsMark(right * z, fsPig(4), max(lv, uMic));
}
// Coil.
void fsCoil(vec2 q, float z, float lv) {
  vec2 r = q - vec2(0.0, 0.53);
  float a = atan(r.y, r.x + 1e-5) / TAU, l = length(r), n = clamp(floor(l / 0.3 - a + 0.5), 0.0, 2.0), th = a + n;
  float d = abs(l - 0.3 * th) - (0.05 + 0.02 * sin(th * 4.0 + 1.0 + 0.6 * gSlow.z)) * (0.75 + 0.6 * lv);
  fsMark(max(d, 0.25 - th) * z * 0.9, gOver, lv);
  fsMark((length(r) - 0.08 - 0.07 * lv) * z, fsPig(1), lv);
}
// Comb: its teeth are the bands.
void fsComb(vec2 q, float z, float lv) {
  float k = clamp(floor(q.x / 0.27 + 0.5), -4.0, 4.0), b = min(band((k + 4.0) / 8.0) * (0.5 + uEnergy), 1.0);
  float up = q.y - 0.16 + 0.16 * q.x * q.x, len = 0.3 + 0.2 * hash11(k + 9.0) + 1.1 * b;
  float x = q.x - k * 0.27 - (0.012 * k + 0.05 * sin(k * 2.0)) * max(up, 0.0);
  float d = length(vec2(x, up - clamp(up, 0.0, len))) - mix(0.085, 0.03, sat(up / len));
  d = min(d, max((abs(up) - 0.075 - 0.03 * q.x) * 0.9, abs(q.x) - 1.2));
  fsMark(d * z, gOver, max(lv, b));
  if (k == -2.0 || k == 1.0 || k == 2.0) fsMark(max(length(vec2(x, up - clamp(up, 0.0, len))) - 0.06, 0.2 - up) * z, fsPig(k < 0.0 ? 0 : k < 1.5 ? 2 : 3), max(lv, b));
}

vec3 fsLit(vec3 c) { return c * (1.0 + 0.35 * max(uOwn[6], 0.0) * gV); }
void fsRound(int i, int kind) {
  float big = sat(uOwn[2] * 1.4), f = float(i);
  vec2 r = gQ - vec2(0.0, 0.95);
  float l = length(r), d = l - 0.8 * big, a = f * 1.9 + 0.4 * sin(uTime * 0.05 + f);
  vec3 pig = fsLit(fsPig(kind) * (0.8 + 0.3 * gV + 0.2 * gA));
  if (i == 2 || i == 4) d = abs(l - 0.62 * big) - (0.12 + 0.07 * gV) * big;
  fsMark(d * gZ, pig, 0.6 + 0.4 * gV);
  if (i == 4) gC = mix(gC, fsPig(4), (1.0 - smoothstep(0.3, 0.48, l)) * sat(uHits * 1.2));
  if (i == 2 || i == 4) { fsMark((l - 0.2 * big) * gZ, fsLit(gInk), gV); return; }
  vec2 o = vec2(cos(a), sin(a)) * (0.5 + 0.25 * sin(f * 2.3) + 0.2 * gV);
  fsMark(max(d + 0.02, 0.82 * big - length(r - o * big)) * gZ, i == 1 || i == 5 ? gInk : pig * 0.42, 0.8);
}
// Or a kite.
void fsKite(int i, int kind) {
  float big = sat(-uOwn[2] * 1.4), f = float(i), w = 0.62 + 0.14 * sin(f * 2.1);
  vec2 r = gQ - vec2(0.0, 1.0);
  float mid = 0.28, up = r.y - mid, side = abs(r.x), k = up > 0.0 ? 0.62 : 1.22;
  float d = (side / w + abs(up) / k - big) * w * k / sqrt(w * w + k * k);
  vec3 pig = fsLit(fsPig(kind) * (0.8 + 0.3 * gV + 0.2 * gA));
  fsMark(d * gZ, pig, 0.6 + 0.4 * gV);
  if (uOwn[3] >= 0.0) fsMark(max(d + 0.03, (i & 1) == 0 ? -r.x * up : -r.x) * gZ, mix(pig * 0.5, gInk, 0.3), 0.85);
  fsMark(max(min(abs(r.x), abs(up)) - 0.014, d + 0.01) * gZ, gOver, gV);
  float below = -0.94 * big - r.y;
  if (below > -0.05 && below < 1.5) {
    float x = r.x - 0.16 * sin(below * 4.0 - uTime * 0.9 + f) * sat(below * 1.6);
    fsMark(max(abs(x) - 0.016, below - 1.35) * gZ, gInk, gV);
    float n = fract(below / 0.4) - 0.5;
    if (below > 0.1 && below < 1.3) fsMark(max(abs(x) - 0.14, 0.4 * abs(n) - 0.02 - 0.45 * abs(x)) * gZ, fsLit(fsPig((kind + 1) % 4)), gV);
  }
}
void fsCrowd(vec2 w) {
  float n = 19.0 * gW / 0.89, x = (w.x / gW * 0.5 + 0.5) * n, id0 = floor(x), wide = 2.0 * gW / n;
  for (int i = -1; i <= 1; i++) {
    float id = id0 + float(i), h = hash11(id + 2.0), h2 = hash11(id * 1.3 + 8.0), h3 = fract(h * 23.7);
    if (id < 0.0 || id > n - 1.0) continue;
    float cx = ((id + 0.5 + 0.5 * (h2 - 0.5)) / n - 0.5) * 2.0 * gW, hold = fsHold(cx), b = min(band(h) * (0.5 + uEnergy), 1.0);
    float z = (0.016 + 0.03 * h3 * h3) * (0.85 + 0.5 * b) * max(uOwn[1], 0.0), y = hold + (0.08 + 0.62 * h) + 0.006 * sin(uTime * 0.4 + id);
    float dx = w.x - cx - max(uOwn[7], 0.0) * 0.55 * (w.y - hold);
    vec2 v = vec2(dx, w.y - y);
    if (w.y > hold && w.y < y) gC = mix(gC, gN && uOwn[0] <= 0.0 ? vec3(0.7, 0.63, 0.5) : vec3(0.08), (1.0 - smoothstep(0.0, 1.7 * gPx, abs(dx))) * 0.55 * (1.0 + min(uOwn[5], 0.0)) * uOwn[1]);
    int k = int(h2 * 4.99); gV = b; gIn = 0.0; fsInks(b);
    float d = length(v) - z;
    d = uOwn[2] < -0.5 ? (abs(v.x) * 1.25 + abs(v.y) * 0.85 - 1.2 * z) * 0.7 : h3 < 0.5 ? max(d, 0.75 * z - length(v - 0.4 * z)) : d;
    if (uOwn[6] > 0.0) gC += uOwn[6] * fsPig(k) * (0.1 + 0.3 * b) * exp(-dot(v, v) / (z * z * 2.5 + 1e-6));
    fsMark(d, fsLit(h3 > 0.72 ? gInk : fsPig(k)), 0.5 + 0.5 * b);
  }
}

// A sign with its tether and its knot: where it stands by day, by night and in a tall picture (x, y, size), where its
// tether leaves the cord (x, lean) by day and by night, its colour, and how it shares in the slow turns.
bool fsHang(int i, vec2 w, float lv, vec3 day, vec3 dark, vec3 tall, vec2 onD, vec2 onN, int kind, vec4 m, vec3 box) {
  vec3 s = gN ? dark : day;
  vec2 on = gN ? onN : onD;
  s.x *= gWide; on.x *= gWide;
  s = mix(s, tall, gNarrow); on.x = mix(on.x, tall.x * 0.9, gNarrow);
  lv = sat(lv * gK);
  float slot = mod(float(i) * 3.0 + 1.0, 7.0);
  if (uOwn[4] < 0.0) { s = mix(s, vec3((slot - 3.0) * 0.25 * gW / 0.89, -0.17, 0.12), -uOwn[4]); on.x = mix(on.x, s.x, -uOwn[4]); }
  if (uOwn[4] > 0.0) {
    vec3 t = i == 0 ? vec3(0.42, -0.2, 0.3) : i == 1 ? vec3(-0.62, -0.05, 0.14) : i == 2 ? vec3(-0.22, 0.2, 0.1) : i == 3 ? vec3(-0.38, -0.24, 0.17) : i == 4 ? vec3(0.04, -0.05, 0.08) : vec3(i == 5 ? 0.22 : -0.06, i == 5 ? 0.28 : -0.26, 0.06);
    t.x *= gW / 0.89;
    s = mix(s, t, uOwn[4]); on.x = mix(on.x, t.x, uOwn[4]);
  }
  if (uOwn[1] < 0.0) {
    bool stays = i == 0 || i == 4 || i == 3;
    if (!stays && uOwn[1] < -0.97) return false;
    if (stays) s.z *= 1.0 - (i == 3 ? 1.1 : 0.5) * uOwn[1];
    else s.z *= max(1.0 + uOwn[1], 0.02);
    s.x = mix(s.x, !stays ? s.x : i == 0 ? -0.12 : i == 4 ? 0.42 : -0.5, -uOwn[1] * (1.0 - gNarrow));
  }
  if (uOwn[7] > 0.0) { s.x += uOwn[7] * ((s.y - fsHold(on.x)) * 0.55 + 0.02 * sin(uTime * 0.6 + slot)); s.y -= uOwn[7] * 0.12 * (s.y + 0.3); }
  s.x += dot(m.yxwz, gSlow * vec4(0.012, 0.012, 0.005, 0.004));
  float dip = fsDip(on.x);
  s.y += dot(m, gSlow * vec4(0.01, 0.012, 0.006, 0.004)) + 1.4 * dip;
  s.z *= 0.92 + 0.16 * (i == 4 ? 2.4 * lv * (1.0 - lv) : lv); // the ring answers a hit by swelling a moment after it
  vec2 q = w - s.xy, c = q - vec2(0.0, s.z);
  float reach = max((i == 4 ? 2.2 : 1.6) * s.z, 0.18);
  if (uOwn[7] != 0.0 || uOwn[3] > 0.0 || uOwn[2] != 0.0) reach = reach * 1.5 + 0.1;
  if (uOwn[6] > 0.0) reach = max(reach, 3.0 * s.z);
  if (w.x < min(on.x, s.x) - reach || w.x > max(on.x, s.x) + reach || c.y > reach) return false;
  // the rubbing round it
  float h = sat(1.0 - dot(c, c) / (s.z * s.z * mix(1.4, 2.5, uSpace)));
  h *= h;
  h *= 1.0 - max(abs(uOwn[0]), max(uOwn[6], 0.0));
  gC = gN ? gC * (1.0 - 0.35 * h) : mix(gC, vec3(0.80, 0.86, 0.88), h * (0.16 + 0.2 * gB));
  vec2 a = vec2(on.x, fsHold(on.x) + dip);
  float ht = max(s.y - a.y, 0.02), t = (w.y - a.y) / ht;
  vec3 line = gN ? vec3(0.70, 0.63, 0.50) : vec3(0.08, 0.08, 0.1), pig = fsPig(kind);
  float bow = 0.035 * m.x + 0.016 * dot(m.zw, gSlow.zw);
  if (uOwn[0] > 0.0) line = mix(line, vec3(0.15, 0.13, 0.12), uOwn[0]);
  float tied = 1.0 - max(-uOwn[5], 0.0);
  if (t > -0.02 && t < 1.02 && abs(w.x - 0.5 * (a.x + s.x)) < 0.5 * abs(a.x - s.x) + 0.08) {
    t = sat(t);
    float st = 4.0 * t * (1.0 - t);
    float x = mix(a.x, s.x, t * t * (3.0 - 2.0 * t)) + bow * st * st;
    float sl = ((s.x - a.x) * 6.0 * t * (1.0 - t) + bow * 8.0 * st * (1.0 - 2.0 * t)) / ht;
    float d = abs(w.x - x) / sqrt(1.0 + sl * sl) - 0.0005 - 0.0007 * gB - 0.0004 * lv;
    gC = mix(gC, mix(line, vec3(0.85, 0.82, 0.7), gN ? 0.0 : 0.7 * gIn), (1.0 - smoothstep(-gPx, gPx, d + 0.0012 * (gT - 0.5))) * 0.85 * tied);
  }
  if ((i == 0 || i == 3 || i == 5) && tied > 0.5) { // a small bead part way up
    float bt = i == 3 ? 0.62 : i == 5 ? 0.36 : 0.45, st = 4.0 * bt * (1.0 - bt);
    vec2 at = vec2(mix(a.x, s.x, bt * bt * (3.0 - 2.0 * bt)) + bow * st * st, a.y + bt * ht);
    fsSpot(length((w - at) * vec2(1.0, 0.8)) - 0.0075, line);
  }
  if (i == 4 && uHits > 0.004) { // a hit stains the ground round the ring and lets a bead fall to the cord
    float st = sat(1.0 - dot(c, c) / (s.z * s.z * (gN ? 1.5 : 4.0)) + 0.3 * (gA - 0.5));
    gC = mix(gC, pig, st * 0.75 * uHits);
    fsSpot(length(w - mix(s.xy, a, 1.0 - uHits)) - 0.015 * sat(uHits * 4.0), pig);
  }
  // knots; by night they are lit
  vec2 ka = w - a;
  float ra = dot(ka, ka), rf = dot(q, q);
  ra += 0.04 * (1.0 - tied); rf += 0.04 * (1.0 - tied);
  if (uOwn[6] > 0.0) {
    float l = dot(c, c) / (s.z * s.z);
    gC += uOwn[6] * pig * (0.15 + 0.5 * lv) * (0.5 * exp(-l * 0.9) + 0.4 * exp(-l * 3.0));
  }
  if (gN) {
    float near = min(ra, rf);
    if (near < 0.03) {
      float g = (1.0 - 0.9 * max(uOwn[0], 0.0)) * (0.35 + 0.75 * lv + 0.5 * uCue) * (0.6 + 0.8 * gT);
      gC += pig * g * (0.55 / (1.0 + near * near * 9e6) + 0.2 * (1.0 - 0.6 * gNarrow) * sat(1.0 - near * 34.0) / (1.0 + near * 300.0));
      fsSpot(sqrt(near) - 0.0055 - 0.003 * lv, mix(pig, vec3(1.0, 0.95, 0.8), 0.6));
    }
  } else if (ra < 0.001) fsSpot(sqrt(ra) - 0.005 - 0.003 * lv, vec3(0.06, 0.06, 0.08));
  vec2 ax = normalize(vec2(1.0, on.y + 0.05 * dot(m.wzyx, gSlow.wzyx)));
  float turn = slot * 1.7 + uTime * (0.1 + 0.015 * slot);
  if (uOwn[7] != 0.0) ax = normalize(mix(ax, uOwn[7] > 0.0 ? vec2(0.82, -0.57) : vec2(cos(turn), sin(turn)), abs(uOwn[7])) + vec2(1e-4, 0.0));
  gQ = vec2(dot(q, ax), dot(q, vec2(-ax.y, ax.x))) / s.z;
  if (uOwn[7] < 0.0) gQ = vec2(dot(c, ax), dot(c, vec2(-ax.y, ax.x))) / s.z + vec2(0.0, 1.0);
  gZ = s.z; gV = lv;
  fsInks(lv);
  if (uOwn[2] != 0.0) {
    if (uOwn[2] > 0.0) fsRound(i, kind); else fsKite(i, kind);
    float k = 1.0 - 0.95 * abs(uOwn[2]);
    if (k < 0.08) return false;
    gZ *= k; gQ = (gQ - vec2(0.0, 1.0)) / k + vec2(0.0, 1.0);
  }
  if (uOwn[3] > 0.0) return gQ.x > box.x - 1.2 && gQ.x < box.y + 1.2 && gQ.y > -1.2 && gQ.y < box.z + 1.2;
  return gQ.x > box.x && gQ.x < box.y && gQ.y > -0.15 && gQ.y < box.z;
}

vec3 fsBed(vec3 c, vec2 p, float big) {
  if (uOwn[0] > 0.0) {
    vec3 paper = vec3(0.93, 0.89, 0.81) * (0.92 + 0.1 * gT + 0.06 * gF) * (1.02 - 0.16 * dot(p, p));
    c = mix(c, paper * (1.0 - 0.1 * smoothstep(0.5, 0.75, big) * vec3(0.6, 1.0, 1.5)), uOwn[0]);
  }
  if (uOwn[0] < 0.0) {
    vec3 k = uKind[0];
    float light = 0.75 - 0.6 * length(p * vec2(0.62, 1.0) + vec2(0.14, -0.12));
    vec3 field = k * (0.5 + 0.75 * light + 0.35 * big + 0.22 * gA + 0.2 * gB - 0.4) + 0.09 * k * smoothstep(0.5, 0.75, gF);
    c = mix(c, field * (0.9 + 0.2 * gT), -uOwn[0]);
  }
  if (uOwn[6] > 0.0) c *= mix(1.0, 0.12 + 0.35 * big, uOwn[6]);
  return c;
}
vec3 fsGround(vec2 p, float big) {
  float light = 0.66 - 0.55 * length(p * vec2(0.62, 1.0) - (gN ? vec2(0.12, 0.06) : vec2(-0.14, 0.1))) + (uTone - 0.5) * 0.2;
  float tide = big - 0.58 + 0.03 * (gA - 0.5), edge = exp(-tide * tide * 5000.0);
  float a = (gA - 0.5) * (0.35 + 0.9 * big), b = (gB - 0.5) * (1.1 - 0.9 * big);
  vec3 c;
  if (gN) {
    c = mix(vec3(0.085, 0.075, 0.082), vec3(0.2, 0.14, 0.11), smoothstep(0.1, 0.75, light + 0.5 * (big - 0.5) + 0.35 * b));
    c = mix(c, vec3(0.40, 0.215, 0.115), 0.8 * smoothstep(0.45, 0.95, light + 0.9 * (big - 0.5) + 0.45 * a));
    c = mix(c, vec3(0.13, 0.18, 0.165), 0.8 * smoothstep(0.5, 0.75, 1.0 - big + 0.3 * b));
    // dry chalk and earth dragged over it
    float drag = smoothstep(0.55, 0.75, 0.6 * gF + 0.25 * gA + 0.15 * gT + 0.4 * (light - 0.4));
    c = mix(c, vec3(0.52, 0.36, 0.24), 0.42 * drag * smoothstep(0.35, 0.65, big + 0.4 * (gB - 0.5)));
    c *= 1.0 - 0.2 * smoothstep(0.55, 0.85, gF);
    return c * (0.88 + 0.24 * gT) * (1.0 - 0.15 * edge);
  }
  c = mix(vec3(0.25, 0.36, 0.45), vec3(0.44, 0.59, 0.70), smoothstep(0.05, 0.6, light + 0.45 * b + 0.5 * (big - 0.5)));
  c = mix(c, vec3(0.75, 0.84, 0.86), 0.92 * smoothstep(0.36, 0.86, light + 0.4 * a + 0.5 * (big - 0.5)));
  // stiff pale paint dragged over it, broken by the cloth
  float drag = smoothstep(0.48, 0.74, 0.55 * gF + 0.3 * gA + 0.15 * gT + 0.55 * (light - 0.42));
  c = mix(c, vec3(0.83, 0.89, 0.89), 0.4 * drag * smoothstep(0.3, 0.6, big + 0.5 * (gB - 0.5)));
  c *= 1.0 - 0.10 * smoothstep(0.55, 0.85, gF) * (1.0 - smoothstep(0.2, 0.45, light));
  // warm cloth showing where the rag went through, at the upper right most of all
  vec2 k = (p - vec2(0.56, 0.2)) * vec2(1.0, 1.5);
  c = mix(c, vec3(0.84, 0.72, 0.60), 0.6 * smoothstep(0.25, 1.0, 0.95 - 2.1 * dot(k, k) - 1.6 * abs(big - 0.45) + 1.1 * b));
  return c * (0.965 + 0.07 * gT) * (1.0 - 0.08 * edge);
}

vec3 render(vec2 p) {
  gN = uVar > 0.5; gPx = 1.0 / uRes.y; gIn = 0.0; gK = 0.6 + 0.9 * uEnergy;
  gW = max(0.5 * uRes.x / uRes.y, 0.3); gNarrow = 1.0 - smoothstep(0.35, 0.75, gW); gWide = clamp(gW / 0.89, 1.0, 1.25);
  gSlow = sin(vec4(uTime * 0.05, uTime * 0.073 + 1.0, uTravel * 0.5, uTime * 0.31 + 2.0));
  // the scrubbed ground: a patch field, two drags of the brush across each other, the tooth of the cloth
  float big = 0.65 * noise(p * 2.3 + 3.0) + 0.35 * noise(p * 5.6 + 11.0);
  gA = noise(rot(0.45 + 0.24 * (big - 0.5)) * p * vec2(4.5, 46.0));
  gB = noise(rot(-0.95 + 0.24 * (big - 0.5)) * p * vec2(5.0, 34.0) + 9.0);
  gT = noise(p * 230.0 + 3.0);
  vec2 bent = p + 0.05 * sin(p.yx * 3.1 + vec2(1.0, 2.5));
  gF = mix(noise(rot(0.35) * bent * vec2(9.0, 120.0) + 4.0), noise(rot(-0.75) * bent * vec2(8.0, 105.0) + 8.0), smoothstep(0.44, 0.52, big + 0.1 * (gT - 0.5)));
  gA = mix(gA, gT, 0.12); gB = mix(gB, gT, 0.12);
  gC = fsGround(p, big);
  if (uOwn[0] != 0.0 || uOwn[6] > 0.0) gC = fsBed(gC, p, big);

  // the hand is never quite steady
  vec2 w = p + 0.0011 * sin(p.yx * vec2(47.0, 41.0) + 2.0 * sin(p.xy * 19.0)) + 0.0007 * (gA - 0.5);
  float cy = fsCord(w.x), under = cy - w.y, u = 0.5 + 0.5 * w.x / gW;
  float wet = 0.0, tied = 1.0 - max(-uOwn[5], 0.0);
  vec3 dry = gC;
  if (uOwn[6] < 0.0 && under > 0.0) {
    wet = -uOwn[6];
    w.x += 0.12 * under * (noise(vec2(w.x * 2.0, under * 30.0 - uTime * 0.5)) - 0.5) + 0.004 * sin(under * 70.0 - uTime * 0.8);
    w.y = cy + under * 1.25;
    under = -under;
  }
  vec3 rope = gN ? vec3(0.86, 0.77, 0.6) : vec3(0.06, 0.06, 0.08);
  // a cue lets the cord bleed into the ground
  gC = mix(gC, gN ? vec3(0.8, 0.45, 0.2) : vec3(0.13, 0.2, 0.3), uCue * 0.6 * exp(-abs(under) * 22.0) * (0.5 + gB));
  // the piece as runs of thin colour under the cord, the loop from left to right; the louder a place the longer its run
  float fall = 1.0 + 2.4 * max(uOwn[5], 0.0);
  if (under > 0.0 && under < 0.22 * fall && tied > 0.0) {
    float n = floor(2.0 * gW / 0.036), k = floor(u * n), x = (u * n - k - 0.5) + 0.22 * sin(w.y * 21.0 + k * 4.0);
    float r = hash11(k + 3.0);
    vec4 m = piece(vec2((k + 0.5) / n, 0.12 + 0.76 * fract(k * 0.618 + 0.1)));
    float len = (0.015 + 0.17 * r * r) * sat(m.a * 1.5) + 0.004;
    if (uOwn[5] > 0.0) len = mix(len, (0.06 + 0.6 * r) * (0.25 + 0.75 * sat(m.a * 1.6)), uOwn[5]);
    float run = length(vec2(x * 0.036, max(under - len, 0.0))) - 0.0105 * (1.0 + 1.3 * max(uOwn[5], 0.0)) * (0.5 + 0.5 * r) * (0.55 + 0.45 * under / len);
    float cov = (1.0 - smoothstep(-0.002, 0.002, run + 0.004 * (gB - 0.5))) * sat(m.a * 4.0 + 0.8 * max(uOwn[5], 0.0)) * (0.6 + 0.4 * under / max(len, 0.01)) * (0.55 + 0.6 * uEnergy);
    vec3 dye = fsRich(m.rgb / max(m.a, 0.05), 1.2);
    if (uOwn[5] > 0.0) { dye = mix(uKind[int(r * 3.99)], dye, sat(m.a * 5.0)) * (gN ? 1.1 : 1.4); }
    gC = mix(gC, gN ? dye * 0.8 : dye * 0.62, sat(cov) * 0.85 * tied);
  }
  if (uOwn[1] > 0.0) fsCrowd(w);
  float lo = max(uKeys, uMid * 0.7);
  if (fsHang(0, w, uDrone, vec3(-0.27, -0.13, 0.245), vec3(0.02, -0.21, 0.125), vec3(0.07, -0.15, 0.1), vec2(-0.31, -0.12), vec2(-0.02, 0.2), 0, vec4(0.8, -0.5, 0.6, 0.4), vec3(-1.2, 1.2, 1.95))) fsPebble(gQ, gZ, gV);
  if (fsHang(4, w, uHits, vec3(0.45, -0.165, 0.1), vec3(-0.47, -0.13, 0.235), vec3(-0.2, -0.16, 0.045), vec2(0.5, 0.1), vec2(-0.4, 0.15), 4, vec4(-0.6, 0.7, -0.5, 0.8), vec3(-1.15, 1.15, 1.95))) fsRing(gQ, gZ, gV);
  if (fsHang(2, w, uTexture, vec3(0.63, -0.02, 0.15), vec3(0.09, 0.07, 0.15), vec3(0.18, 0.1, 0.075), vec2(0.56, -0.22), vec2(0.17, 0.14), 2, vec4(0.5, 0.8, -0.7, -0.5), vec3(-0.8, 0.8, 2.15))) fsFork(gQ, gZ, gV);
  if (fsHang(6, w, 0.6 * uHigh + 0.4 * uLevel, vec3(0.2, -0.17, 0.1), vec3(0.55, -0.17, 0.1), vec3(0.2, -0.17, 0.042), vec2(0.14, -0.08), vec2(0.5, -0.12), 2, vec4(-0.8, -0.4, 0.7, 0.5), vec3(-1.4, 1.4, 1.9))) fsComb(gQ, gZ, gV);
  if (fsHang(1, w, uPad, vec3(-0.03, -0.21, 0.32), vec3(0.3, -0.1, 0.2), vec3(-0.09, -0.06, 0.15), vec2(0.0, 0.1), vec2(0.33, -0.22), 1, vec4(0.6, 0.6, 0.8, -0.6), vec3(-0.35, 0.95, 2.2))) fsHook(gQ, gZ, gV);
  if (fsHang(3, w, uPhrase, vec3(0.37, 0.18, 0.07), vec3(-0.44, 0.04, 0.1), vec3(0.03, 0.29, 0.055), vec2(0.3, 0.45), vec2(-0.5, -0.3), 3, vec4(-0.7, 0.5, 0.9, 0.7), vec3(-0.6, 0.6, 2.4))) fsSeed(gQ, gZ, gV);
  if (fsHang(5, w, lo, vec3(-0.71, 0.09, 0.11), vec3(0.72, 0.1, 0.13), vec3(-0.18, 0.24, 0.055), vec2(-0.6, 0.2), vec2(0.66, 0.1), 1, vec4(0.9, -0.6, -0.6, 0.6), vec3(-1.0, 1.0, 1.4))) fsCoil(gQ, gZ, gV);
  if (wet > 0.0) {
    float deep = cy - p.y;
    vec3 pool = dry * mix(vec3(0.65), uKind[0], 0.5) * (1.0 - 0.5 * sat(deep * 2.5));
    gC = mix(dry, mix(gC * vec3(0.8, 0.85, 0.9), pool, sat(0.15 + deep * 1.3)), wet * smoothstep(0.0, 0.004, deep));
    under = deep; w.y = p.y;
  }
  // the cord itself, over everything
  if (uOwn[0] > 0.0) rope = mix(rope, vec3(0.1, 0.09, 0.09), uOwn[0]);
  if (abs(under) < 0.03 && tied > 0.02) {
    float sl = (fsCord(w.x + 0.01) - cy) * 100.0;
    fsLay(abs(under) / sqrt(1.0 + sl * sl) + 0.004 * (1.0 - tied) - 0.0017 - 0.0012 * noise(vec2(w.x * 9.0, 2.0)) - 0.001 * uLow - 0.002 * uCue, rope, 0.8);
  }
  // the bead that is now
  float bx = mix(-gW, gW, uLoop), bd = length(w - vec2(bx, fsCord(bx)));
  if (bd < 0.2 && tied > 0.5) {
    vec3 keep = gC;
    fsLay(bd - 0.0135 - 0.004 * uLevel, gN ? vec3(0.96, 0.72, 0.4) : vec3(0.8, 0.28, 0.14), 0.95);
    if (gN) gC += vec3(0.4, 0.22, 0.08) * exp(-bd * 28.0) * (1.0 - smoothstep(0.1, 0.2, bd));
    gC = mix(keep, gC, smoothstep(0.0, 0.03, uLoop) * (1.0 - smoothstep(0.97, 1.0, uLoop)));
  }
  return sat(gC);
}
