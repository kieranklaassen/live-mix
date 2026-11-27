// name: Crossed light
// a: Growing fans
// b: Needle field
// what: A thin film of crystals seen between two crossed polarisers: fans of fine needles have grown from their seeds until they met along straight seams, with soft dark arms crossing at each seed, in steel grey, white and straw; or coarse blades lying in sheaves, tight at the waist and spread at both ends, with wide black between them.
// follows: The polarisers turn with the loop and the dark arms sweep. Each fan or sheaf is of one kind and, with the piece at its place, goes from steel to straw and brighter as it swells. Low slides the thickness, the bands zone the fans or thicken the blades, texture frays them. A hit grows a fan, or runs light along the great sheaf; a cue lights its seams or edges.
// own: 0 1 many and small, -1 one great and the rest little; 1 a: 1 ringed like a target, -1 six armed and branched like snow; b: 1 the sheaves closed to straight bundles, -1 opened wide to bursts; 2 the ground: 1 pale and lit, -1 a deep glow in the colours of the drone and the pad; 3 1 satin in relief, lit from one side with no polarisers, -1 etched, in lines only; 4 1 laid back to a horizon, -1 seen in a round eyepiece; 5 1 grown into one another (b: thick sheaves), -1 half grown, with much clear between; 6 1 the needles curl, -1 coarse blades; 7 1 many dark arms (b: banded across), -1 none, everything takes the light

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
float clWorld;   // 0 as it draws itself, 1 another world: the colours of the kinds show
float clFat;     // how broad a blade is
float clAng;     // which way a needle lies
float clBright(vec3 c) { return dot(c, vec3(0.3, 0.6, 0.1)); }
// What lies behind the crystals.
vec3 clGround(vec2 p) {
  vec3 c = vec3(0.0012, 0.0017, 0.0027);
  if (uOwn[2] > 0.0) c = mix(c, vec3(1.0, 0.97, 0.9) * (0.8 - 0.25 * dot(p, p)) * (0.96 + 0.06 * noise(p * 140.0)), uOwn[2]);
  if (uOwn[2] < 0.0) {
    vec2 q = p - vec2(0.18, 0.12);
    float g = exp(-dot(q, q) * 2.2), w = fbm(p * 1.6 + uTime * 0.01);
    c = mix(c, uKind[1] * uKind[1] * g * (0.24 + 0.14 * w) * (0.8 + 0.4 * uLevel) + uKind[0] * uKind[0] * (0.05 + 0.08 * w), -uOwn[2]);
  }
  return c;
}
// A crystal's light on that ground, and in the colour of its kind: lit is how much comes through, tex its needles, 0 to 1.
vec3 clStuff(vec3 c, vec3 kind, vec2 ax, float tex, float dome, float swell) {
  float l = clBright(c) * 1.9;
  vec3 tint = kind / (max(max(kind.r, kind.g), kind.b) + 1e-3);
  c = mix(c, clBright(c) * mix(vec3(1.0), tint * tint, 0.5 + 0.3 * swell) * 1.15 + c * 0.15, 0.9 * clWorld);
  if (uOwn[3] > 0.0) {
    vec2 lamp = vec2(-0.6, 0.8);
    float along = dot(ax, lamp), d = sqrt(max(1.0 - along * along, 0.0)), sp = pow(d, 14.0);
    vec3 k = kind * kind * (0.05 + (0.3 + 0.5 * swell) * d * (0.25 + 1.1 * tex)) * (0.65 + 0.8 * dome) + mix(kind, vec3(1.0), 0.45) * sp * tex * tex * (0.35 + 0.5 * swell);
    c = mix(c, k, uOwn[3]);
    l = mix(l, clBright(k) * 1.6, uOwn[3]);
  }
  if (uOwn[3] < 0.0) {
    float v = smoothstep(-0.07 - 8.0 * clPx, 0.07 + 8.0 * clPx, tex - 0.92 + 0.72 * sat(l * 0.8));
    c = mix(c, mix(tint, vec3(1.0), 0.35) * v * (0.35 + 0.35 * swell), -uOwn[3]);
    l = mix(l, v * 0.8, -uOwn[3]);
  }
  if (uOwn[2] > 0.0) {
    vec3 thin = mix(vec3(0.9, 0.87, 0.8), kind, 0.35 + 0.35 * swell) * 0.85, deep = kind * kind * 0.3;
    c = mix(c, mix(deep, thin, sat(l * 0.95)), uOwn[2]);
  }
  return c;
}
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
  if (uOwn[6] > 0.0) th += uOwn[6] * (1.9 * r / (0.25 + r) + 1.3 * (noise(v * 4.2 + id * 3.1) - 0.5) * smoothstep(0.0, 0.3, r));
  float turn = th / TAU + 1.0;
  float bun = clFib(turn, r, 0.032, 0.3, id * 31.0);
  float fine = clFib(turn, r, 0.0056, 0.15, id * 17.0 + 5.0);
  if (uOwn[6] < 0.0) { float w = clFib(turn, r, 0.13, 3.0, id * 13.0 + 2.0); bun = mix(bun, smoothstep(0.35, 0.65, w), -uOwn[6]); fine = mix(fine, 0.35 + 0.5 * w + 0.2 * (fine - 0.5), -uOwn[6]); }
  fine = mix(fine, 0.5, smoothstep(0.003, 0.012, clPx)); // too fine to draw in a small picture
  float a = th + (bun - 0.5) * 0.42 + (fine - 0.5) * fray;
  clAng = a;
  float s = sin(2.0 * (a - turnAt));
  if (uOwn[7] > 0.0) { float s6 = sin(6.0 * (a - turnAt)); s = mix(s, s6, uOwn[7]); }
  if (uOwn[7] < 0.0) s = sqrt(mix(s * s, 0.7 + 0.3 * s * s, -uOwn[7]));
  return vec4(s * s, r, bun, fine);
}
vec3 clFilm(vec2 p, float P) {
  vec2 q = p / mix(1.12, 0.92, uSpace) + vec2(0.022 * sin(uTravel * 0.021), 0.014 * sin(uTravel * 0.017 + 1.0));
  vec2 w = q + 0.0045 * (vec2(noise(q * 60.0), noise(q * 60.0 + 31.0)) - 0.5);
  if (uOwn[5] > 0.0) w += uOwn[5] * (0.15 * (vec2(noise(q * 8.0), noise(q * 8.0 + 60.0)) - 0.5) + 0.05 * (vec2(noise(q * 31.0), noise(q * 31.0 + 60.0)) - 0.5));
  float b1 = 1e3, b2 = 1e3; int k1 = 0, k2 = 0;
  vec3 s1 = vec3(0.0), s2 = vec3(0.0); // where the nearest two seeds are, and how far they reach
  for (int i = 0; i < CL_N; i++) {
    vec4 Si = CL_S[i];
    if (uOwn[0] > 0.0) Si.z *= 1.0 - 0.95 * uOwn[0];
    if (uOwn[0] < 0.0) { Si.xy *= i == 0 ? 1.0 + 0.8 * uOwn[0] : 1.0 - 0.22 * uOwn[0]; Si.z *= i == 0 ? 1.0 - 0.15 * uOwn[0] : 1.0 + 0.45 * uOwn[0]; }
    vec2 d = w - Si.xy;
    float e = dot(d, d) - Si.z * Si.z;
    if (e < b1) { b2 = b1; k2 = k1; b1 = e; k1 = i; s2 = s1; s1 = Si.xyz; } else if (e < b2) { b2 = e; k2 = i; s2 = Si.xyz; }
  }
  vec4 S = vec4(s1, CL_S[k1].w);
  if (uOwn[0] > 0.0 || uOwn[4] > 0.0) { // many little ones between, that take the room of the others as they grow
    const float CELL = 0.21;
    vec2 at = floor(w / CELL);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = at + vec2(float(i), float(j)), h = hash22(c + 3.7);
      vec3 Si = vec3((c + 0.5 + 0.72 * (h - 0.5)) * CELL, 0.0);
      Si.z = max(uOwn[0], uOwn[4] * smoothstep(0.35, 0.6, max(abs(Si.y), abs(Si.x) - 0.8))) * CELL * (0.62 + 0.5 * h.y);
      vec2 d = w - Si.xy;
      float e = dot(d, d) - Si.z * Si.z;
      int id = 20 + int(hash21(c) * 900.0);
      if (e < b1) { b2 = b1; k2 = k1; b1 = e; k1 = id; s2 = s1; s1 = Si; S = vec4(Si, floor(h.x * 4.999)); } else if (e < b2) { b2 = e; k2 = id; s2 = Si; }
    }
  }
  float seam = (b2 - b1) / (2.0 * length(s1.xy - s2.xy) + 1e-4);
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
  float grown = 1.0;
  if (uOwn[5] != 0.0) grown = uOwn[5] > 0.0 ? 1.0 + 0.8 * uOwn[5] : 1.0 + 0.42 * uOwn[5];
  float front = S.z * grown * (0.92 + (kd == 4 ? 0.0 : 0.05 * swell)) * (0.68 + 0.36 * f.z + 0.5 * f.w * f.w) - f.y;
  float there = smoothstep(-0.004, 0.014, front), fern = 0.0;
  if (uOwn[1] < 0.0) {                  // six arms, each with its side branches
    float a6 = PI / 3.0, aa = atan(v.y, v.x) + h * 6.0, am = abs(mod(aa, a6) - 0.5 * a6);
    vec2 q6 = f.y * vec2(cos(am), sin(am));
    float far = S.z * grown * 1.05, left = sat(1.0 - q6.x / far);
    float spine = q6.y - (0.004 + 0.012 * left) * (0.6 + 0.8 * noise(v * 30.0));
    float step_ = 0.024 + 0.02 * h, t = q6.x - 0.577 * q6.y, b = abs(fract(t / step_ + h) - 0.5) * step_;
    float side = max(b - 0.0045 * (0.6 + noise(v * 40.0)), q6.y - (0.03 + 0.45 * t * 0.8) * left * (0.5 + 0.9 * noise(vec2(floor(t / step_ + h) * 1.7, floor(mod(aa, TAU) / a6) + h * 30.0))));
    float dm = min(spine, side);
    fern = smoothstep(clPx, -clPx * 1.5, dm) * step(q6.x, far);
    there = mix(there, fern + 0.10 * exp(-max(dm, 0.0) * 60.0) * left * step(q6.x, far), -uOwn[1]);
  }
  float open = f.x;
  open = mix(open, open * open, 0.25 + 0.5 * uTone);
  ret *= 0.3 + 0.7 * smoothstep(0.0, 0.09, front);
  if (uOwn[1] > 0.0) { float tg = 0.5 + 0.5 * sin(f.y * 100.0 + 6.0 * (f.z - 0.5) + h * 20.0 - uTime * 0.05); ret *= 1.0 + uOwn[1] * (1.1 * tg - 0.5); open *= mix(1.0, 0.15 + 1.1 * tg, uOwn[1]); f.w = mix(f.w, 0.3 + 0.5 * tg + 0.3 * (f.w - 0.5), 0.7 * uOwn[1]); }
  if (uOwn[1] < 0.0) { ret = mix(ret, max(ret, 190.0), -uOwn[1]); open = mix(open, 0.45 + 0.55 * open, -uOwn[1]); f.w = mix(f.w, 0.75, -0.8 * uOwn[1]); }
  open *= 0.45 + 0.55 * (0.5 + 0.5 * sin(4.0 * P + h * 50.0));
  vec3 c = clHue(clCap(ret)) * (0.008 + 0.06 * uMic + open * (0.5 + 0.35 * swell)) * (0.35 + 1.6 * f.w * f.w + 0.3 * f.z);
  vec3 tint = uKind[kd] / (max(max(uKind[kd].r, uKind[kd].g), uKind[kd].b) + 1e-3);
  c *= mix(vec3(1.0), 0.4 + 0.6 * tint, 0.3 * swell);
  c *= 0.3 + 0.7 * smoothstep(0.0005, 0.0045, seam);
  if (clWorld > 0.0) {
    vec2 ld = normalize(vec2(-0.55, 0.65));
    c = clStuff(c, uKind[kd], vec2(cos(clAng), sin(clAng)), sat(0.2 * f.z + 0.95 * f.w), sat(0.5 + 0.7 * dot(v, ld) / S.z + 0.3 * (1.0 - f.y / S.z)) * smoothstep(0.0, 0.012, seam), swell) * mix(1.0, 0.35 + 0.65 * smoothstep(0.0005, 0.005, seam), max(uOwn[2], uOwn[3]));
  }
  // a cue: the seams of the great fan take light
  float cue = uCue * 0.5 + 2.0 * uCue * (1.0 - uCue);
  if (k1 == 0 || k2 == 0) c += vec3(1.0, 0.86, 0.6) * cue * 0.9 * (exp(-seam / 0.006) + 0.25 * exp(-seam / 0.04) * f.w);
  c += vec3(1.0, 0.95, 0.85) * uKeys * smoothstep(0.80, 0.95, f.w) * exp(-f.y / 0.14) * 1.2;
  c *= there;
  if (clWorld > 0.0) c += clGround(p) * (1.0 - there * mix(0.85, 1.0, max(uOwn[2], 0.0)));
  else c += vec3(0.0012, 0.0017, 0.0027);
  // a hit: one seed, whose needles run out over its neighbours and melt
  if (uHits > 0.01) {
    float g = fract(uLoop + 0.06) * 4.0; int a = int(g) % 4;
    float mixTo = smoothstep(0.8, 1.0, fract(g));
    float far = 1.0 - uHits;
    for (int n = 0; n < 2; n++) {
      float wgt = n == 0 ? 1.0 - mixTo : mixTo;
      vec2 hv = q - CL_H[(a + n) % 4];
      if (clWorld > 0.0) {              // and light runs out from it over all that stands there
        float rr = length(hv) - 0.5 * far, go = clWorld * wgt * sat(uHits) * exp(-rr * rr * 60.0);
        c = mix(c, mix(c * 1.8 + 0.03, uKind[4] * (0.25 + 0.55 * clBright(c)), 0.35 + 0.35 * max(uOwn[2], 0.0)), 0.85 * go);
      }
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
  float open = 1.0;
  if (uOwn[1] != 0.0) open = uOwn[1] > 0.0 ? 1.0 - 0.94 * uOwn[1] : 1.0 - 2.2 * uOwn[1];
  if (uOwn[0] != 0.0) q *= uOwn[0] > 0.0 ? 1.0 + 0.35 * uOwn[0] : 1.0 + 0.42 * uOwn[0];
  vec2 q0 = q;
  int all = uOwn[0] > 0.0 ? CL_M * 2 : CL_M;
  for (int ii = 0; ii < all; ii++) {
    if (left < 0.06) break;
    int i = ii % CL_M;
    float back = 1.0;
    if (ii == CL_M) q = rot(2.3) * q0 * 1.3 + vec2(0.21, -0.12);
    if (ii >= CL_M) back = uOwn[0];
    vec4 A = CL_A[i], B = CL_B[i];
    if (uOwn[5] != 0.0) B.y *= uOwn[5] > 0.0 ? 1.0 + 1.6 * uOwn[5] : 1.0 + 0.5 * uOwn[5];
    if (uOwn[1] > 0.0) { B.y *= 1.0 + 1.1 * uOwn[1]; A.z = mix(A.z, 1.35 + 0.18 * sin(float(i) * 2.4), 0.75 * uOwn[1]); }
    vec2 ax = vec2(cos(A.z), sin(A.z)), no = vec2(-ax.y, ax.x), v = q - A.xy;
    float u = dot(v, ax), t = dot(v, no), un = abs(u);
    if (uOwn[6] > 0.0) t += uOwn[6] * (0.65 * u * u * (float(i % 2) * 2.0 - 1.0) + 0.05 * sin(u * 7.0 + float(i) + uTime * 0.09));
    // the needles of a sheaf run close at the waist and open to both sides
    float wide = B.x * open * (u > 0.0 ? 1.0 : 0.72), H = sqrt(B.y * B.y + wide * wide * u * u), s = t / H;
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
      if (uOwn[6] < 0.0) N = max(floor(N * (1.0 + 0.55 * uOwn[6])), 2.0);
      if (uOwn[5] < 0.0) N = max(floor(N * (1.0 + 0.5 * uOwn[5])), 2.0);
      float y = s * N + fn * 0.37, id = floor(y);
      if (abs(id + 0.5 - fn * 0.37) + 0.5 > N) continue;
      vec3 h = vec3(hash21(vec2(id + 40.0 * fn, float(i) * 7.0 + (u > 0.0 ? 1.0 : 2.0))), hash21(vec2(id + 40.0 * fn + 13.0, float(i) * 5.0 + 3.0)), 0.0);
      h.z = fract(h.y * 57.0);
      float cell = H / N;
      float off = (y - id - 0.5 - 0.24 * (h.y - 0.5)) * cell * il;
      float w = min((n == 0 ? 0.024 : n == 1 ? 0.010 : 0.0045) * (0.35 + 0.9 * h.y) * (0.5 * A.w + 0.5) * clFat, cell * il * 0.42);
      float tip = A.w * (0.30 + 0.70 * h.x) * (1.0 - 0.45 * s * s) * (u > 0.0 ? 1.0 : 0.8) - un + (h.z - 0.5) * 4.0 * off;
      float e = w * min(1.0, tip / (w * 3.5 + 0.012)) - abs(off), soft = clPx + B.z;
      if (uOwn[3] > 0.0 && e > -0.03) left *= 1.0 - 0.3 * uOwn[3] * back * smoothstep(-0.03, 0.0, e) * (1.0 - smoothstep(0.0, soft, e));
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
      if (uOwn[7] > 0.0) cr = mix(abs(cr), 0.3 * cr * cr + 0.75 * sin(un * 55.0 + h.z * 9.0 - uTime * 0.06), uOwn[7]);
      if (uOwn[7] < 0.0) cr = mix(abs(cr), 0.85 + 0.15 * cr * cr, -uOwn[7]);
      vec3 b = clHue(clCap(ret)) * (0.012 + 0.07 * uMic + cr * cr * (0.7 + 0.25 * swell + 0.15 * bn)) * (0.55 + 0.8 * str) * kc * (1.0 - 0.22 * fn);
      float line = 1.0 - smoothstep(0.0, 0.0022 + clPx, e);
      if (clWorld > 0.0) b = clStuff(b, uKind[kd], d, sat(str * 1.1 - 0.1 + 0.25 * line * max(-uOwn[3], 0.0)), sat(0.5 + (ridge > 0.1 ? -0.35 : 0.3) * sign(dot(no, vec2(-0.6, 0.8)) + 1e-4) * (h.z < 0.5 ? 1.0 : -1.0)), swell) * (1.0 - 0.15 * fn);
      b *= 1.0 - 0.6 * line * (1.0 - smoothstep(0.0, 0.004, B.z));
      if (i == 0) {
        b += vec3(1.0, 0.86, 0.6) * cue * line * (n == 0 ? 0.6 : 0.05);
        float g = un - (1.0 - uHits) * 0.6;
        b += mix(vec3(1.0), uKind[4], 0.3) * uHits * exp(-g * g / 0.005) * (0.1 + str) * (n == 0 ? 1.8 : 0.8);
      }
      b += vec3(1.0, 0.95, 0.85) * uKeys * exp(-tip * tip / 0.0009) * 0.5;
      float cover = back * on * (0.9 - 0.25 * smoothstep(0.0, 0.006, B.z));
      c += left * cover * b;
      left *= 1.0 - cover;
    }
  }
  // a dust of seeds that never grew
  q = q0;
  vec2 g = q * 19.0, id = floor(g);
  vec2 o = fract(g) - 0.5 - 0.5 * (hash22(id) - 0.5);
  float k = hash21(id + 5.0), a = k * 40.0;
  vec2 w = rot(a) * o;
  float bit = smoothstep(0.5, 0.75, noise(q * 3.0 + 4.0)) * step(0.4, k) * (1.0 - smoothstep(0.0, 0.03 + 19.0 * clPx, abs(w.y) + 0.2 * abs(w.x))) * (1.0 - smoothstep(0.05, 0.2, abs(w.x)));
  float lit = sin(2.0 * (a + P));
  c += left * vec3(0.05, 0.07, 0.10) * (1.0 - 2.0 * max(uOwn[2], 0.0)) * bit * (0.05 + lit * lit) * k;
  return c + left * (clWorld > 0.0 ? clGround(p) : vec3(0.0012, 0.0017, 0.0027));
}
vec3 render(vec2 p) {
  clPx = 1.0 / uRes.y;
  // the two polarisers turn together, a quarter turn in the loop: one sweep of the dark arms
  float P = 0.5 * PI * uLoop + 0.012 * uTravel + 0.35 + 0.35 * uVar;
  vec3 c = vec3(0.0);
  vec4 w0 = vec4(uOwn[0], uOwn[1], uOwn[2], uOwn[3]), w1 = vec4(uOwn[4], uOwn[5], uOwn[6], uOwn[7]);
  clWorld = sat(2.0 * (dot(w0, w0) + dot(w1, w1)));
  clFat = 1.0 + 1.5 * max(-uOwn[6], 0.0) + 0.6 * max(uOwn[5], 0.0);
  vec2 at = p;
  float far = 0.0, eye = 1.0;
  if (uOwn[4] > 0.0) {                  // laid back: the near edge at our feet
    float y = 0.24 - p.y, z = 1.0 / max(y, 0.03);
    vec2 w = vec2(p.x * z * 0.6, 0.55 * z - 0.95);
    p = mix(p, w, uOwn[4] * uOwn[4]); far = uOwn[4] * smoothstep(0.2, 0.0, y); clPx *= mix(1.0, z * 0.9, uOwn[4]);
  }
  if (uOwn[4] < 0.0) {
    float r = length(p) / 0.45;
    eye = mix(1.0, smoothstep(1.0, 0.985, r), -uOwn[4]);
    p *= mix(1.0, 0.8 + 0.35 * r * r, -uOwn[4]);
  }
  if (uVar < 0.5) c = clFilm(p, P);
  if (uVar >= 0.5) c = clNeedles(p, P);
  p = at;
  if (far > 0.0) {
    vec3 sky = mix(clGround(p) * 1.2, uKind[1] * uKind[1] * (0.06 + 0.5 * exp(-max(p.y - 0.24, 0.0) * 8.0)), 0.8 * (1.0 - max(uOwn[2], 0.0)));
    c = mix(c, sky, far);
  }
  c *= eye;
  vec2 l = p - vec2(-0.12, 0.08);
  c *= 1.15 - 0.62 * dot(l, l) / (1.0 + 0.5 * dot(l, l));
  return screenOf(c * 1.9 * (0.85 + 0.3 * uTone));
}
