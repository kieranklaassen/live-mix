// name: Crossed light
// a: Growing fans
// b: Needle field
// what: A thin film of crystals seen between two crossed polarisers: fans of fine needles have grown from their seeds until they met along straight seams, with soft dark arms crossing at each seed, in steel grey, white and straw; or coarse blades lying in sheaves, tight at the waist and spread at both ends, with wide black between them.
// follows: The polarisers turn with the loop and the dark arms sweep. Each fan or sheaf is of one kind and, with the piece at its place, goes from steel to straw and brighter as it swells. Low slides the thickness, the bands zone the fans or thicken the blades, texture frays them. A hit grows a fan, or runs light along the great sheaf; a cue lights its seams or edges.

// The film: where each fan's seed is, how far it reaches before it stops, and its kind.
const int CL_N = 15;
const vec4 CL_S[15] = vec4[15](
  vec4(-0.34, -0.10, 0.60, 0.0), vec4(0.37, 0.20, 0.43, 1.0), vec4(0.30, -0.36, 0.34, 2.0), vec4(-0.78, 0.36, 0.42, 3.0),
  vec4(-0.13, 0.50, 0.30, 4.0), vec4(0.80, -0.14, 0.40, 0.0), vec4(0.05, -0.24, 0.20, 3.0), vec4(0.58, -0.47, 0.24, 1.0),
  vec4(-0.88, -0.36, 0.36, 2.0), vec4(0.86, 0.47, 0.36, 3.0), vec4(0.13, 0.47, 0.17, 2.0), vec4(-0.07, -0.56, 0.24, 1.0),
  vec4(1.20, 0.16, 0.36, 4.0), vec4(-1.22, 0.05, 0.40, 1.0), vec4(1.18, -0.46, 0.40, 2.0));
// Where a hit may start a new fan.
const vec2 CL_H[4] = vec2[4](vec2(0.16, 0.14), vec2(-0.50, 0.24), vec2(0.56, -0.16), vec2(-0.20, -0.34));
// The sheaves, nearest first: where the waist is, which way they lie, half their length. Then how far they open, half the
// waist, how far out of focus, and the kind.
const int CL_M = 8;
const vec4 CL_A[8] = vec4[8](
  vec4(-0.26, -0.13, 0.50, 0.92), vec4(0.50, 0.00, -1.16, 0.60), vec4(-0.52, 0.27, -0.40, 0.50), vec4(0.24, -0.42, 0.02, 0.34),
  vec4(0.05, 0.40, 2.75, 0.17), vec4(0.80, -0.40, 0.5, 0.20), vec4(1.10, 0.26, 0.8, 0.40), vec4(-1.12, -0.2, 1.1, 0.40));
const vec4 CL_B[8] = vec4[8](
  vec4(0.50, 0.056, 0.0, 0.0), vec4(0.46, 0.034, 0.0, 1.0), vec4(0.40, 0.024, 0.001, 3.0), vec4(0.42, 0.020, 0.0, 2.0),
  vec4(0.50, 0.018, 0.001, 4.0), vec4(0.56, 0.018, 0.001, 2.0), vec4(0.5, 0.020, 0.003, 3.0), vec4(0.5, 0.020, 0.003, 1.0));

float clPx;
float clKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits * 0.6; }
// What white light becomes behind a crystal that holds one ray back by so many nanometres: grey, steel, white, straw, amber.
vec3 clHue(float ret) { vec3 s = sin(PI * ret / vec3(640.0, 545.0, 455.0)); s *= s; return max(mix(vec3(dot(s, vec3(0.3, 0.6, 0.1))), s, 1.35), 0.0); }
float clCap(float ret) { return 430.0 * (1.0 - exp(-max(ret, 0.0) / 330.0)); }
// Noise that closes round a circle of n cells.
float clRing(float x, float y, float n, float s) {
  float i = floor(x), j = floor(y), f = x - i, g = y - j;
  f = f * f * (3.0 - 2.0 * f); g = g * g * (3.0 - 2.0 * g);
  float a = mod(i, n), b = mod(i + 1.0, n);
  return mix(mix(hash21(vec2(a + s, j)), hash21(vec2(b + s, j)), f), mix(hash21(vec2(a + s, j + 1.0)), hash21(vec2(b + s, j + 1.0)), f), g);
}
// Fibres that leave the seed and split as they go, so that all are about one width.
float clFib(float turn, float r, float wide, float along, float s) {
  float l = max(log2(max(r, 1e-4) * TAU / (wide * 12.0)), 0.0), n = floor(l), f = l - n;
  float c = 12.0 * exp2(n);
  return mix(clRing(turn * c, r / along + n * 7.0, c, s), clRing(turn * c * 2.0, r / along + n * 7.0 + 7.0, c * 2.0, s), smoothstep(0.15, 0.85, f));
}
// One fan at v from its seed: x is how far the light is let through, y how far it is from the seed, z and w the two needle textures.
vec4 clFan(vec2 v, float id, float turnAt, float fray) {
  float r = length(v);
  if (r < 1e-4) { v = vec2(1e-4, 0.0); r = 1e-4; }
  float bend = noise(v * 2.6 + id * 9.7) - 0.5;
  float th = atan(v.y, v.x) + bend * 0.36 * smoothstep(0.0, 0.5, r);
  float turn = th / TAU + 1.0;
  float bun = clFib(turn, r, 0.032, 0.3, id * 31.0);
  float fine = clFib(turn, r, 0.0056, 0.15, id * 17.0 + 5.0);
  fine = mix(fine, 0.5, smoothstep(0.003, 0.012, clPx)); // too fine to draw in a small picture
  float a = th + (bun - 0.5) * 0.42 + (fine - 0.5) * fray;
  float s = sin(2.0 * (a - turnAt));
  return vec4(s * s, r, bun, fine);
}
vec3 clFilm(vec2 p, float P) {
  vec2 q = p / mix(1.12, 0.92, uSpace) + vec2(0.022 * sin(uTravel * 0.021), 0.014 * sin(uTravel * 0.017 + 1.0));
  vec2 w = q + 0.0045 * (vec2(noise(q * 60.0), noise(q * 60.0 + 31.0)) - 0.5);
  float b1 = 1e3, b2 = 1e3; int k1 = 0, k2 = 0;
  for (int i = 0; i < CL_N; i++) {
    vec2 d = w - CL_S[i].xy;
    float e = dot(d, d) - CL_S[i].z * CL_S[i].z;
    if (e < b1) { b2 = b1; k2 = k1; b1 = e; k1 = i; } else if (e < b2) { b2 = e; k2 = i; }
  }
  vec4 S = CL_S[k1];
  float seam = (b2 - b1) / (2.0 * length(S.xy - CL_S[k2].xy) + 1e-4);
  int kd = int(S.w); float id = float(k1);
  float h = hash11(id + 3.0);
  float loud = clKind(kd);
  vec4 m = piece(clamp(vec2(mix(p.x, S.x, 0.5) / 1.8 + 0.5, 0.5 - mix(p.y, S.y, 0.5)), 0.0, 1.0));
  float ans = 0.55 + uEnergy;
  float swell = sat((0.65 * loud + 0.6 * m.a) * ans);
  vec2 v = q - S.xy;
  float fray = 0.25 + 0.4 * uTexture * ans;
  vec4 f = clFan(v, id, P + (h - 0.5) * 0.3, fray);
  float zone = f.y / S.z;
  float rings = sin(f.y * 120.0 + f.z * 5.0 + h * 20.0) * (0.05 + 0.4 * band(zone) * ans);
  float lie = h * 37.0, wedge = dot(v, vec2(cos(lie), sin(lie))) / S.z;
  float ret = 85.0 + 190.0 * h * h + 90.0 * (f.z - 0.5) + 80.0 * (f.w - 0.5) + 50.0 * uLow * ans + 300.0 * swell * (0.4 + 0.9 * h);
  ret *= 1.0 + 0.75 * wedge;
  ret *= 1.0 + 0.25 * rings;
  ret *= smoothstep(-0.004, 0.02, seam) * 0.5 + 0.5;
  // the ragged front, where a fan stopped growing and the melt stayed clear
  float front = S.z * (0.92 + (kd == 4 ? 0.0 : 0.05 * swell)) * (0.68 + 0.36 * f.z + 0.5 * f.w * f.w) - f.y;
  float there = smoothstep(-0.004, 0.014, front);
  float open = f.x;
  open = mix(open, open * open, 0.25 + 0.5 * uTone);
  ret *= 0.3 + 0.7 * smoothstep(0.0, 0.09, front);
  open *= 0.45 + 0.55 * (0.5 + 0.5 * sin(4.0 * P + h * 50.0));
  vec3 c = clHue(clCap(ret)) * (0.008 + 0.06 * uMic + open * (0.5 + 0.35 * swell)) * (0.35 + 1.6 * f.w * f.w + 0.3 * f.z);
  vec3 tint = uKind[kd] / (max(max(uKind[kd].r, uKind[kd].g), uKind[kd].b) + 1e-3);
  c *= mix(vec3(1.0), 0.4 + 0.6 * tint, 0.3 * swell);
  c *= 0.3 + 0.7 * smoothstep(0.0005, 0.0045, seam);
  // a cue: the seams of the great fan take light
  float cue = uCue * 0.5 + 2.0 * uCue * (1.0 - uCue);
  if (k1 == 0 || k2 == 0) c += vec3(1.0, 0.86, 0.6) * cue * 0.9 * (exp(-seam / 0.006) + 0.25 * exp(-seam / 0.04) * f.w);
  c += vec3(1.0, 0.95, 0.85) * uKeys * smoothstep(0.80, 0.95, f.w) * exp(-f.y / 0.14) * 1.2;
  c *= there;
  c += vec3(0.0012, 0.0017, 0.0027);
  // a hit: one seed, whose needles run out over its neighbours and melt
  if (uHits > 0.01) {
    float g = fract(uLoop + 0.06) * 4.0; int a = int(g) % 4;
    float mixTo = smoothstep(0.8, 1.0, fract(g));
    float far = 1.0 - uHits;
    for (int n = 0; n < 2; n++) {
      float wgt = n == 0 ? 1.0 - mixTo : mixTo;
      vec2 hv = q - CL_H[(a + n) % 4];
      if (wgt < 0.01 || dot(hv, hv) > 0.12) continue;
      vec4 hf = clFan(hv, 40.0 + float((a + n) % 4), P, 0.4);
      float R = 0.05 + 0.19 * far * (2.0 - far);
      float in1 = smoothstep(0.0, 0.03, R * (0.45 + 0.25 * hf.z + 0.7 * hf.w * hf.w) - hf.y);
      vec3 hc = clHue(240.0 + 130.0 * (hf.w - 0.5) + 60.0 * hf.z) * (0.02 + hf.x) * (0.3 + hf.w) * 1.3;
      c = mix(c, hc * mix(vec3(1.0), uKind[4], 0.2), in1 * 0.9 * sat(uHits * 1.4) * wgt);
      c += vec3(1.0, 0.9, 0.7) * wgt * uHits * 1.5 * exp(-hf.y / 0.012);
    }
  }
  return c;
}
vec3 clNeedles(vec2 p, float P) {
  vec2 q = p / mix(1.1, 0.92, uSpace) + vec2(0.02 * sin(uTravel * 0.021), 0.013 * sin(uTravel * 0.017 + 1.0));
  float ans = 0.55 + uEnergy, cue = uCue * 0.5 + 2.0 * uCue * (1.0 - uCue);
  vec3 c = vec3(0.0);
  float left = 1.0; // how much of what lies behind still shows
  for (int i = 0; i < CL_M; i++) {
    if (left < 0.06) break;
    vec4 A = CL_A[i], B = CL_B[i];
    vec2 ax = vec2(cos(A.z), sin(A.z)), no = vec2(-ax.y, ax.x), v = q - A.xy;
    float u = dot(v, ax), t = dot(v, no), un = abs(u);
    // the needles of a sheaf run close at the waist and open to both sides
    float wide = B.x * (u > 0.0 ? 1.0 : 0.72), H = sqrt(B.y * B.y + wide * wide * u * u), s = t / H;
    if (un > A.w || abs(s) > 1.0) continue;
    float slope = s * wide * wide * u / H, il = inversesqrt(1.0 + slope * slope);
    int kd = int(B.w);
    vec4 m = piece(clamp(vec2(mix(p.x, A.x, 0.5) / 1.8 + 0.5, 0.5 - mix(p.y, A.y, 0.5)), 0.0, 1.0));
    float swell = sat((0.65 * clKind(kd) + 0.6 * m.a) * ans);
    vec3 kc = uKind[kd];
    kc = mix(vec3(1.0), 0.4 + 0.6 * kc / (max(max(kc.r, kc.g), kc.b) + 1e-3), 0.3 * swell);
    // coarse blades in front, two rows of finer ones behind them
    for (int n = 0; n < 3; n++) {
      if (n == 2 && A.w < 0.25) break;
      float fn = float(n), N = n == 0 ? 6.0 : n == 1 ? 11.0 : 19.0;
      float y = s * N + fn * 0.37, id = floor(y);
      if (abs(id + 0.5 - fn * 0.37) + 0.5 > N) continue;
      vec3 h = vec3(hash21(vec2(id + 40.0 * fn, float(i) * 7.0 + (u > 0.0 ? 1.0 : 2.0))), hash21(vec2(id + 40.0 * fn + 13.0, float(i) * 5.0 + 3.0)), 0.0);
      h.z = fract(h.y * 57.0);
      float cell = H / N;
      float off = (y - id - 0.5 - 0.24 * (h.y - 0.5)) * cell * il;
      float w = min((n == 0 ? 0.024 : n == 1 ? 0.010 : 0.0045) * (0.35 + 0.9 * h.y) * (0.5 * A.w + 0.5), cell * il * 0.42);
      float tip = A.w * (0.30 + 0.70 * h.x) * (1.0 - 0.45 * s * s) * (u > 0.0 ? 1.0 : 0.8) - un + (h.z - 0.5) * 4.0 * off;
      float e = w * min(1.0, tip / (w * 3.5 + 0.012)) - abs(off), soft = clPx + B.z;
      if (e < -soft) continue;
      float on = smoothstep(-soft, soft, e);
      float bn = band(h.z);
      float str = noise(vec2(u * 7.0 + h.y * 50.0, off * 300.0 + h.z * 90.0));
      // a blade is thicker along one side of its ridge than along the other
      float ridge = off / w * (h.z < 0.5 ? 1.0 : -1.0);
      float bev = sat(e / (w * 0.5 + 0.001)) * mix(1.0, 0.5, smoothstep(0.1, 0.16, ridge));
      float ret = (0.25 + 0.75 * bev) * (70.0 + 290.0 * h.y * h.z + 60.0 * (str - 0.5) + 50.0 * uLow * ans + 400.0 * swell * (0.08 + 0.92 * h.z) + 70.0 * bn * ans);
      vec2 d = (ax + no * slope) * il;
      float turn = 2.0 * (P + (h.z - 0.5) * (0.55 + 0.6 * uTexture * ans));
      float cr = 2.0 * d.x * d.y * cos(turn) - (d.x * d.x - d.y * d.y) * sin(turn);
      vec3 b = clHue(clCap(ret)) * (0.012 + 0.07 * uMic + cr * cr * (0.7 + 0.25 * swell + 0.15 * bn)) * (0.55 + 0.8 * str) * kc * (1.0 - 0.22 * fn);
      float line = 1.0 - smoothstep(0.0, 0.0022 + clPx, e);
      b *= 1.0 - 0.6 * line * (1.0 - smoothstep(0.0, 0.004, B.z));
      if (i == 0) {
        b += vec3(1.0, 0.86, 0.6) * cue * line * (n == 0 ? 0.6 : 0.05);
        float g = un - (1.0 - uHits) * 0.6;
        b += mix(vec3(1.0), uKind[4], 0.3) * uHits * exp(-g * g / 0.005) * (0.1 + str) * (n == 0 ? 1.8 : 0.8);
      }
      b += vec3(1.0, 0.95, 0.85) * uKeys * exp(-tip * tip / 0.0009) * 0.5;
      float cover = on * (0.9 - 0.25 * smoothstep(0.0, 0.006, B.z));
      c += left * cover * b;
      left *= 1.0 - cover;
    }
  }
  // a dust of seeds that never grew
  vec2 g = q * 19.0, id = floor(g);
  vec2 o = fract(g) - 0.5 - 0.5 * (hash22(id) - 0.5);
  float k = hash21(id + 5.0), a = k * 40.0;
  vec2 w = rot(a) * o;
  float bit = smoothstep(0.5, 0.75, noise(q * 3.0 + 4.0)) * step(0.4, k) * (1.0 - smoothstep(0.0, 0.03 + 19.0 * clPx, abs(w.y) + 0.2 * abs(w.x))) * (1.0 - smoothstep(0.05, 0.2, abs(w.x)));
  float lit = sin(2.0 * (a + P));
  c += left * vec3(0.05, 0.07, 0.10) * bit * (0.05 + lit * lit) * k;
  return c + left * vec3(0.0012, 0.0017, 0.0027);
}
vec3 render(vec2 p) {
  clPx = 1.0 / uRes.y;
  // the two polarisers turn together, a quarter turn in the loop: one sweep of the dark arms
  float P = 0.5 * PI * uLoop + 0.012 * uTravel + 0.35 + 0.35 * uVar;
  vec3 c = vec3(0.0);
  if (uVar < 0.5) c = clFilm(p, P);
  if (uVar >= 0.5) c = clNeedles(p, P);
  vec2 l = p - vec2(-0.12, 0.08);
  c *= 1.15 - 0.62 * dot(l, l) / (1.0 + 0.5 * dot(l, l));
  return screenOf(c * 1.9 * (0.85 + 0.3 * uTone));
}
