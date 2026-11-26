// name: Iron filings
// a: Filings
// b: Spiked fluid
// what: Thousands of iron needles on white paper over hidden magnets: they lie in chains along the pull, stand up thick and black at the poles and throw small shadows; or a pool of black magnetic fluid in a white dish that swells and rises into crowns of glossy spikes.
// follows: Drone, pad, texture and phrase are each a pole that grows stronger as it sounds, its colour showing through the paper or from a lamp; keys and a voice add to it. High sound sharpens the points. A hit sends a ring of knocked needles or spikes outward; a cue turns one pole round, or lets the crowns sink and rise. The poles drift over minutes.
vec3 ifPX, ifPY, ifQX, ifQY, ifS, ifT;      // the hidden poles, three and three: where, and how strong (the sign is which way round)
const vec3 IF_D = vec3(0.1, 0.085, 0.055), IF_E = vec3(0.05, 0.05, 0.045); // how deep they lie
vec3 ifB, ifBx, ifBy;              // the field where we are, and how it changes across and up the sheet
vec2 ifSun; float ifPx, ifBlur;    // where shadows fall for a unit of height; a pixel on the paper; how far out of focus
float ifShade, ifCov; vec3 ifInk, ifGel, ifThrough; // ifGel and ifThrough: what colour the sounding poles lend the iron and the paper
const float IF_V = 0.6;            // how far up the sheet a unit of height is seen
// How far a cue has turned the poles round: nothing at first, most in the middle, nothing at the end.
float ifTurn() { return 4.0 * uCue * (1.0 - uCue); }
void ifPoles() {
  float t = uTime * 0.013, wide = clamp(uRes.x / uRes.y / 1.7, 0.36, 1.2), high = wide < 0.6 ? 1.15 : 1.0;
  ifPX = wide * (vec3(-0.31, 0.25, 0.5) + 0.055 * sin(t * vec3(2.0, 2.31, 2.62) + vec3(0.0, 2.1, 4.2)));
  ifQX = wide * (vec3(-0.13, 0.1, -0.66) + 0.055 * sin(t * vec3(2.93, 3.24, 3.55) + vec3(0.0, 2.1, 4.2) + 6.3));
  ifPY = high * vec3(0.08, -0.1, 0.27) + 0.055 * cos(t * vec3(1.7, 1.93, 2.16) + vec3(0.0, 1.3, 2.6));
  ifQY = high * vec3(-0.36, 0.33, -0.27) + 0.055 * cos(t * vec3(2.39, 2.62, 2.85) + vec3(0.0, 1.3, 2.6) + 3.9);
  ifS = vec3(0.5, 0.5, 0.03) + vec3(0.55, 0.6, 0.85) * sqrt(sat(vec3(uDrone, uPad, uTexture)));
  ifS.y *= 1.8 * ifTurn() - 1.0;
  ifT = vec3(0.03 + 0.9 * sqrt(sat(uPhrase)), -0.02 - 0.55 * uLevel, -0.02 - 0.8 * max(uKeys, uMic));
}
void ifThree(vec2 q, vec3 px, vec3 py, vec3 s, vec3 dp, vec3 go, mat3 kc, inout float gw) {
  vec3 x = q.x - px, y = q.y - py, r = inversesqrt(x * x + y * y + dp * dp), r2 = r * r, b = s * r2 * r * dp * dp;
  vec3 ex = 3.0 * b * r2 * x, ey = 3.0 * b * r2 * y, n = dp * r;
  float all3 = b.x + b.y + b.z;
  ifB += vec3(dot(b, x), dot(b, y), dot(b, dp));
  ifBx += vec3(all3 - dot(ex, x), -dot(ex, y), -dot(ex, dp));
  ifBy += vec3(-dot(ey, x), all3 - dot(ey, y), -dot(ey, dp));
  n *= n; n *= n;
  gw += 0.5 * (n.x + n.y + n.z);
  ifGel += kc * (n * go);
  n *= n * go;
  ifThrough += n.x + n.y + n.z - kc * n;
}
void ifField(vec2 q) {
  ifB = ifBx = ifBy = ifGel = ifThrough = vec3(0.0);
  float gw = 0.03;
  ifThree(q, ifPX, ifPY, ifS, IF_D, vec3(uDrone, uPad, uTexture), mat3(uKind[0], uKind[1], uKind[2]), gw);
  ifThree(q, ifQX, ifQY, ifT, IF_E, vec3(uPhrase, max(uHits, uCue), max(uKeys, uMic)), mat3(uKind[3], uKind[4], uKind[3]), gw);
  // a hit floods the paper over the fifth pole with its colour, a cue over the pole it turns
  vec2 h = q - vec2(ifQX.y, ifQY.y), c = q - vec2(ifPX.y, ifPY.y);
  ifThrough += (1.0 - uKind[4]) * 0.45 * uHits * exp(-dot(h, h) * 60.0) + (1.0 - uKind[1]) * 0.5 * uCue * exp(-dot(c, c) * 30.0);
  ifGel = min(ifGel / gw, 1.0);
}
// One filing: how far we are from its middle, half of it as a vector in the room, half its width, how much it is there.
void ifNeedle(vec2 d, vec3 h, float w, float on, float tone) {
  vec2 a = h.xy + vec2(0.0, h.z * IF_V), s = h.xy + ifSun * h.z;
  vec2 e = d - vec2(0.0, h.z * IF_V), g = d - ifSun * h.z;
  float t = clamp(dot(e, a) / (dot(a, a) + 1e-7), -1.0, 1.0), u = clamp(dot(g, s) / (dot(s, s) + 1e-7), -1.0, 1.0);
  float sl = length(g - s * u), sw = w * 1.5 + ifPx + ifBlur + h.z * (u + 1.0) * 0.1;
  ifShade = max(ifShade, (1.0 - smoothstep(0.0, sw * 1.5, sl)) * on * (0.6 - 0.12 * u));
  vec2 v = e - a * t;
  float l = length(v), aa = ifPx * 0.7 + ifBlur, ww = w * (1.0 - 0.75 * t * t * t * t);
  float cov = (1.0 - smoothstep(ww - aa, ww + aa, l)) * min(1.0, ww / aa) * on;
  if (cov < 0.003) return;
  float lit = sat(0.5 - 0.6 * (v.x * 0.84 - v.y * 0.54) / (w + aa)); // the side to the window
  vec3 c = vec3(tone) * (0.3 + 1.2 * lit * lit) + (0.05 + 0.3 * h.z / (length(h) + 1e-5)) * lit * smoothstep(-0.4, 1.0, t) * (0.3 + ifGel);
  ifInk = mix(ifInk, c, cov); ifCov = mix(ifCov, 1.0, cov);
}
// A sowing of filings that lie along the field, each kept in its own cell for good.
void ifLie(vec2 q, float cell, float len, float w, float seed, vec2 along, float loose, float dens, int lo) {
  vec2 g = q / cell, id0 = floor(g - (lo == 0 ? 0.5 : 0.0)), side = vec2(-along.y, along.x);
  float spread = lo == 0 ? 0.5 : 0.75, aa = ifPx * 0.7 + ifBlur;
  for (int j = 1; j >= lo; j--) for (int i = lo; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec4 h = fract(hash21(id + seed) * vec4(1.0, 31.7, 97.3, 411.1));
    float on = smoothstep(h.z, h.z + 0.12, dens * 1.12);
    vec2 d = (g - id - 0.5 - spread * (h.xy - 0.5)) * cell;
    float l = len * (0.5 + 0.6 * h.x);
    if (on < 0.01 || dot(d, d) > l * l + 2e-5) continue;
    vec2 a = normalize(along + (h.w - 0.5) * loose * side + 1e-5) * l;
    float t = clamp(dot(d, a) / (l * l), -1.0, 1.0), ww = w * (0.6 + 0.7 * h.y) * (1.0 - 0.6 * t * t * t * t);
    vec2 v = d - a * t;
    float cov = (1.0 - smoothstep(ww - aa, ww + aa, length(v))) * min(1.0, ww / aa) * on;
    ifShade = max(ifShade, (1.0 - smoothstep(0.0, ww * 1.5 + aa, length(v - ifSun * ww * 1.6))) * on * 0.6);
    float lit = sat(0.5 - 0.6 * (v.x * 0.84 - v.y * 0.54) / (ww + aa)); // the side to the window
    ifInk = mix(ifInk, vec3(0.02 + 0.09 * h.w * h.w) * (0.3 + 1.2 * lit * lit) + (0.04 + 0.12 * h.y) * lit * ifGel, cov);
    ifCov = mix(ifCov, 1.0, cov);
  }
}
// A sowing of filings that stand up at the poles, leaning as the field leans.
void ifStand(vec2 q, float cell, float len, float w, float seed, float from) {
  vec2 g = q / cell, id0 = floor(g);
  for (int j = 1; j >= -1; j--) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec4 h = fract(hash21(id + seed) * vec4(1.0, 31.7, 97.3, 411.1));
    vec2 d = (g - id - 0.5 - 0.7 * (h.xy - 0.5)) * cell;
    float l = len * (0.5 + 0.6 * h.x);
    if (dot(d, d) > l * l * 3.6) continue;
    vec3 f = ifB - ifBx * d.x - ifBy * d.y;
    float m = length(f), on = smoothstep(h.z, h.z + 0.12, 1.12 * smoothstep(from, from + 0.2, m));
    if (on < 0.01) continue;
    vec3 n = f / (m + 1e-5);
    n *= n.z < 0.0 ? -1.0 : 1.0;
    n.xy += (h.w - 0.5) * 0.25 * vec2(-n.y, n.x);
    ifNeedle(d, n * l * (0.45 + 0.6 * smoothstep(0.1, 0.9, m)), w * (0.6 + 0.7 * h.y), on, 0.02 + 0.07 * h.w * h.w);
  }
}
vec3 ifPaper(vec2 p) {
  ifPoles();
  float w = 1.0 / (1.0 - 0.2 * p.y);
  vec2 q = vec2(p.x, p.y / 0.85) * w;
  ifPx = w / uRes.y;
  ifBlur = 0.003 * smoothstep(0.25, 0.6, abs(p.y + 0.02));
  ifSun = rot(0.15 * sin(uTime * 0.017)) * vec2(0.85, -0.55) * (0.7 + 0.5 * uSpace);
  ifField(q);
  float m = length(ifB), far = sat(1.0 - m * 16.0);
  // strands: fine noise drawn out along the bent field line through here
  float bl = length(ifB.xy) + 1e-4;
  vec2 d0 = ifB.xy / bl, bend = (ifBx.xy * d0.x + ifBy.xy * d0.y) / bl;
  bend -= d0 * dot(bend, d0);
  bend *= min(1.0, 18.0 / (length(bend) + 1e-3));
  float s = 0.0;
  for (int k = -2; k <= 2; k++) { float t = float(k) * 0.013; s += noise((q + d0 * t + 0.5 * bend * t * t) * 110.0 + 40.0); }
  float s0 = s / 5.0; s = smoothstep(0.38, 0.6, s0);
  float near = smoothstep(0.004, 0.085, m);
  near = sqrt(near);
  float dens = mix(0.05, 1.0, s * near) * mix(0.45, 1.0, near);
  dens *= 1.0 - 0.4 * smoothstep(0.07, 0.12, m) * (1.0 - smoothstep(0.14, 0.24, m));
  // the paper, with the painted ends of the magnets showing through it
  float lamp = 1.0 - 0.22 * smoothstep(0.1, 1.7, length(p - vec2(-0.6, 0.45)));
  float tooth = hash21(floor(q * 420.0)) - 0.5;
  vec3 col = mix(vec3(0.93, 0.945, 0.965), vec3(0.975, 0.965, 0.94), sat(lamp * 3.0 - 2.0)) * (lamp + 0.02 * tooth);
  col *= exp(-ifThrough * (0.5 + 1.3 * uEnergy));
  ifShade = 0.0; ifInk = vec3(0.0); ifCov = 0.0;
  // a hit: a ring of knocked filings runs out from the fifth pole
  float ring = (length(q - vec2(ifQX.y, ifQY.y)) - 0.34 * (1.0 - sat(uHits))) / 0.06;
  ring = 4.0 * uHits * (1.0 - uHits) * exp(-ring * ring);
  float loose = 0.45 + 3.5 * far + 5.0 * ring;
  dens = sat(dens + 0.5 * ring);
  float sharp = mix(1.25, 0.8, uTone) * (1.1 - 0.25 * uHigh);
  // the chains themselves, under their loose ends
  float deep = 1.0 - smoothstep(0.17, 0.25, m);
  col *= 1.0 - 0.72 * smoothstep(0.5, 0.6, s0 + 0.35 * tooth) * smoothstep(0.02, 0.07, m) * (0.35 + 0.65 * deep);
  col *= 1.0 - (1.0 - 0.75 * ifGel) * 0.5 * smoothstep(0.12, 0.75, m);
  if (deep > 0.0) {
    ifLie(q, 0.0120, 0.0125, 0.0008 * sharp, 17.0, d0, loose, dens * deep, -1);
    if (near > 0.1) ifLie(q, 0.0105, 0.0068, 0.0008 * sharp, 3.0, d0, loose * 1.2, dens * deep * smoothstep(0.1, 0.4, near), 0);
  }
  if (m > 0.11) ifStand(q, 0.018, 0.0255, 0.0016 * sharp, 41.0, 0.1);
  if (m > 0.2) ifStand(q, 0.026, 0.033, 0.0021 * sharp, 53.0, 0.18);
  col *= 1.0 - ifShade * vec3(0.82, 0.8, 0.75);
  return mix(col, ifInk / max(ifCov, 1e-3), ifCov);
}
// The black fluid: crowns of it stand over the poles under the dish.
vec4 ifX, ifZ, ifA; float ifSlim, ifTopMost; // where the four crowns stand, and how strong
const vec4 IF_W = vec4(12.0, 18.0, 30.0, 32.0);
const float IF_STEP = 0.118;
const mat2 ifTurned = mat2(0.945, 0.327, -0.327, 0.945);
float ifE; vec2 ifGE, ifLean, ifAt, ifWarp; // the pull at ifAt, how it changes, which way spikes lean there
void ifCrowns() {
  float t = uTime * 0.017;
  ifX = vec4(-0.16, 0.28, 0.17, -0.3) + 0.045 * sin(t * vec4(2.0, 2.3, 2.6, 2.9) + vec4(0.0, 2.1, 4.2, 6.3));
  ifZ = vec4(0.02, 0.16, -0.3, -0.33) + 0.045 * cos(t * vec4(1.7, 1.9, 2.2, 2.4) + vec4(0.0, 1.3, 2.6, 3.9));
  ifA = vec4(0.5, 0.16, 0.02, 0.02) + vec4(0.5, 0.68, 0.75, 0.75) * sqrt(sat(vec4(uDrone, uPad, uTexture, max(uPhrase, max(uKeys, uMic)))));
  ifA *= 1.0 - 0.85 * ifTurn();
  float top = 1.4 * max(max(ifA.x, ifA.y), max(ifA.z, ifA.w)) + 0.3 * uHits;
  ifTopMost = 0.07 + 0.62 * top / (1.0 + 0.3 * top);
  ifSlim = mix(0.2, 0.75, sat(0.35 * uTone + 0.5 * uHigh + 0.3 * uMid));
}
void ifPull(vec2 at) {
  vec4 dx = at.x - ifX, dz = at.y - ifZ, n = 1.0 / (1.0 + (dx * dx + dz * dz) * IF_W), a = ifA * n * n, g = -4.0 * IF_W * n * a;
  float e = a.x + a.y + a.z + a.w;
  ifAt = at;
  ifLean = vec2(dot(a, dx), dot(a, dz)) / (0.1 + e);
  float ring = (length(at - vec2(ifX.y, ifZ.y)) - 0.5 * (1.0 - sat(uHits))) * 8.0;
  e += 1.2 * uHits * (1.0 - uHits) * exp(-ring * ring);
  float sq = 1.0 / (1.0 + 0.3 * e);
  ifE = e * sq;
  ifGE = vec2(dot(g, dx), dot(g, dz)) * sq * sq;
  ifWarp = 0.022 * sin(at.yx * 7.0 + vec2(0.0, 1.7));
}
float ifDishH(float r) { return 0.2 * smoothstep(0.75, 1.12, r) - 0.24 * smoothstep(1.13, 1.2, r); }
// Above 0 inside the puddle's outline.
float ifPool(vec2 q) { return 1.0 - q.x * q.x * 2.0 - q.y * q.y * 2.5 - 0.5 * q.x * q.y - 0.5 * q.x * q.x * q.x; }
// How far q is from the fluid, by the pull last asked for (below 0 is inside).
float ifFluidD(vec3 q) {
  float in_ = ifPool(q.xz);
  if (in_ < 0.0) return q.y - in_ * 0.2;
  float pool = in_ / (in_ + 0.05), y = q.y - pool * (0.04 + 0.14 * max(ifE + dot(ifGE, q.xz - ifAt), 0.0));
  // the spike of this cell of the lattice: the place is first brought back down along the lean
  float fan = 1.0 / (1.0 + 2.6 * max(q.y, 0.0));
  vec2 b = q.xz - ifLean * (1.0 - fan), w = (b + ifWarp) * ifTurned / vec2(IF_STEP, IF_STEP * 1.7320508);
  vec2 c1 = floor(w) + 0.5 - w, c2 = floor(w + 0.5) - w;
  c1 *= vec2(1.0, 1.7320508); c2 *= vec2(1.0, 1.7320508);
  vec2 c = dot(c1, c1) < dot(c2, c2) ? c1 : c2;
  vec2 o = ifTurned * c * IF_STEP;
  float e = ifE * (1.0 + clamp(dot(ifGE, b + o - ifAt) / (ifE + 0.02), -0.6, 0.25)), st = smoothstep(0.1, 0.42, e);
  // a soft swelling where the pull is slight, a spike where it is strong
  float r = length(o), swell = max(1.0 - 4.0 * r * r / (IF_STEP * IF_STEP), 0.0);
  y -= 0.035 * pool * smoothstep(0.07, 0.3, e) * swell * swell;
  float h = 0.5 * pool * e * st - 0.03, tall = smoothstep(0.0, 0.08, h);
  h = max(h, 0.004);
  float k = 1.0 - max(y, 0.0) / h, R = 0.34 * IF_STEP * smoothstep(0.0, 0.17, h) * k * mix(1.0, k, ifSlim) * mix(1.0, fan, 0.6);
  float d = y < h ? (r - R) * 0.95 : length(vec2(r, y - h));
  d = smin(d - 0.002 + 0.06 * (1.0 - tall), y * 0.9, 0.025 * smoothstep(0.1, 0.3, ifE) + 0.001);
  // never further than the next cell's spike may stand, unless well above them all
  return min(d, max(max(0.75 * IF_STEP - r, 0.3 * IF_STEP), 0.5 * (q.y - 0.07 - 0.55 * ifE)));
}
// Two tall lamps that stand at the sides: a warm one left, a cool one right.
vec3 ifStrips(vec3 r) {
  vec2 h = r.xz / (length(r.xz) + 1e-3);
  return (vec3(2.6, 2.5, 2.35) * smoothstep(0.88, 0.97, dot(h, vec2(-0.94, -0.34))) + vec3(1.3, 1.45, 1.6) * smoothstep(0.93, 0.97, dot(h, vec2(0.96, 0.28)))) * smoothstep(-0.75, -0.45, r.y) * (1.0 - smoothstep(0.5, 0.75, r.y));
}
// The studio: one broad soft lamp overhead to the left and a coloured gel low down for each sound.
vec3 ifStudio(vec3 r) {
  vec2 h = r.xz / (length(r.xz) + 1e-3);
  vec3 c = vec3(0.02 + 0.12 * (1.0 - smoothstep(0.0, 0.5, abs(r.y))));
  vec2 s = abs(r.xz / max(r.y, 0.05) - vec2(-0.8, 0.5)) - vec2(0.7, 0.5);
  c += vec3(1.0, 0.98, 0.95) * 2.6 * (1.0 - smoothstep(-0.05, 0.15, max(s.x, s.y))) * smoothstep(0.05, 0.15, r.y);
  float w = r.y - 0.22;
  vec4 g = vec4(uDrone, uPad, uTexture, uPhrase) * exp(4.0 * (h.x * vec4(-0.589, -0.951, 0.001, 0.952) + h.y * vec4(0.808, -0.310, -1.000, -0.307)) - 4.0);
  vec3 lamps = uKind[0] * uKind[0] * g.x + uKind[1] * uKind[1] * g.y + uKind[2] * uKind[2] * g.z + uKind[3] * uKind[3] * g.w;
  lamps += uKind[4] * uKind[4] * max(uHits, uCue) * exp(4.0 * dot(h, vec2(0.587, 0.810)) - 4.0);
  c += lamps * (0.5 + 1.8 * uEnergy) * exp(-w * w * 15.0);
  return c;
}
vec3 ifFluid(vec2 p) {
  ifCrowns();
  float sn = 0.5, cs = 0.866, D = 2.75, F = 2.3 * clamp(uRes.x / uRes.y / 1.5, 0.48, 1.0);
  vec2 s = p - vec2(-0.03, -0.03);
  vec3 ro = vec3(0.12 * sin(uTime * 0.021), D * sn, -D * cs), rd = normalize(vec3(s.x, s.y * cs - F * sn, F * cs + s.y * sn));
  rd.y = min(rd.y, -0.02);
  float px = 0.7 / (min(uRes.y, 700.0) * F), far = (-0.04 - ro.y) / rd.y, fl = 0.0, dish = 0.0;
  // begin where the ray meets the round that holds the crowns, or else just over the dish's rim
  float t = (0.22 - ro.y) / rd.y, ra = dot(rd.xz, rd.xz), rb = dot(ro.xz, rd.xz), rc = rb * rb - ra * (dot(ro.xz, ro.xz) - 0.36);
  if (rc > 0.0) { float first = (-rb - sqrt(rc)) / ra, last = (-rb + sqrt(rc)) / ra, top = (ifTopMost - ro.y) / rd.y; if (first < t && last > top) t = max(first, top); }
  float shy = 9.0; // the nearest the ray passed by a spike, in pixels
  for (int i = 0; i < 21; i++) {
    vec3 q = ro + rd * t;
    bool in_ = ifPool(q.xz) > -0.2;
    dish = q.y - ifDishH(length(q.xz));
    fl = max(length(q.xz) - 0.71, 0.0) + 0.05;
    if (in_) {
      ifPull(q.xz);
      fl = ifFluidD(q);
      if (q.y > 0.06) shy = min(shy, fl / (px * t));
      // two steps for each asking of the pull
      float d = min(fl, dish);
      if (d > px * t * 2.0) {
        t += d * 0.9; q = ro + rd * t;
        t += 0.8 * max(min(ifFluidD(q), q.y - ifDishH(length(q.xz))), 0.0);
        continue;
      }
    }
    float d = min(fl, dish);
    if (d < px * t * 0.6 || t > far) break;
    t += d * 0.9;
  }
  t = min(t, far);
  // a ray that ran out of steps by a spike's flank goes on to the pool or the dish
  bool wet = fl < dish && fl < px * t * 2.0;
  if (!wet) {
    float tp = (0.045 - ro.y) / rd.y;
    vec2 at = ro.xz + rd.xz * tp;
    if (ifPool(at) > 0.04) { t = tp; wet = true; ifPull(at); }
    else if (dish > px * t * 2.0) for (int i = 0; i < 6; i++) { vec3 q = ro + rd * t; t += 0.85 * (q.y - ifDishH(length(q.xz))); }
  }
  t = min(t, far);
  vec3 q = ro + rd * t, n, key = normalize(vec3(-0.52, 0.74, 0.42)), white = vec3(0.86, 0.86, 0.845);
  float rr = length(q.xz), h = max(0.002, px * t * 1.8);
  if (wet) {
    vec2 e = vec2(1.0, -1.0) * h;
    vec4 f;
    vec3 a = q + e.xyy; f.x = ifFluidD(a); a = q + e.yyx; f.y = ifFluidD(a);
    a = q + e.yxy; f.z = ifFluidD(a); a = q + e.xxx; f.w = ifFluidD(a);
    n = normalize(e.xyy * f.x + e.yyx * f.y + e.yxy * f.z + e.xxx * f.w + vec3(0.0, 1e-6, 0.0));
  } else {
    vec2 o = q.xz / (rr + 1e-4);
    n = normalize(vec3(-o * (ifDishH(rr + 0.004) - ifDishH(rr - 0.004)) / 0.008, 1.0).xzy);
  }
  vec3 r = reflect(rd, n);
  float fr = 1.0 - sat(-dot(n, rd)); fr *= (wet ? 0.22 : 0.7) * fr * fr * fr * fr;
  // what the mirror meets close by: more fluid (dark) or nothing
  float open = 1.0;
  if (wet) {
    float l = 0.12;
    vec3 a = q + n * 0.01 + r * l;
    ifPull(a.xz);
    open = sat(0.6 + ifFluidD(a) / (0.3 * l));
  }
  vec3 col;
  if (wet) {
    // looking down it meets the dish, the table past it, or first the black pool, which mirrors the studio once more
    vec2 at = q.xz + r.xz * q.y / max(-r.y, 0.03);
    float over = smoothstep(-0.15, 0.1, ifPool(at)), la = length(at);
    vec3 seen = white * mix(0.12, 0.5 + 0.5 * smoothstep(0.7, 1.05, la), 1.0 - smoothstep(1.1, 1.5, la)) * (1.0 - over);
    seen = mix(seen, ifStudio(vec3(r.x, abs(r.y), r.z)), r.y > 0.0 ? 1.0 : 0.15 * over) + ifStrips(r);
    col = vec3(0.005, 0.005, 0.007) + min(seen * (0.07 + 0.93 * fr) * mix(0.06, 1.0, open) * 1.15, 0.3);
  } else {
    float sh = 1.0;
    if (rr < 0.95) for (int i = 0; i < 2; i++) {
      float l = i == 0 ? 0.09 : 0.24;
      vec3 a = q + key * l;
      ifPull(a.xz);
      sh = min(sh, sat(0.5 + 2.5 * (a.y - 0.05 - 0.4 * ifE * smoothstep(0.1, 0.42, ifE) * smoothstep(-0.1, 0.15, ifPool(a.xz))) / l));
    }
    float dif = sat(dot(n, key)), on = 1.0 - smoothstep(1.17, 1.185, rr);
    vec3 base = mix(vec3(0.4, 0.41, 0.43) * (1.1 - 0.22 * length(p - vec2(-0.5, 0.2))), white, on);
    sh *= mix(0.35 + 0.65 * smoothstep(-0.1, 0.3, length(q.xz - vec2(0.16, -0.14)) - 1.15), 1.0, on);
    float ao = 1.0 - 0.6 * exp(-max(rr - 0.66, 0.0) * 14.0);
    col = base * (0.28 * ao + 0.8 * dif * mix(0.2, 1.0, sh));
    col += on * (ifStudio(r) * open - 0.15) * (0.04 + 0.5 * fr);
    col *= (0.3 + 0.7 * smoothstep(0.0, 4.0 * px * t, -ifPool(q.xz))) * (0.15 + 0.85 * smoothstep(0.3, 1.5, shy));
  }
  // the far rim, against the table, without steps
  float tr = (0.2 - ro.y) / rd.y, rim = (length(ro.xz + rd.xz * tr) - 1.128) / (px * tr * 2.6);
  if (ro.z + rd.z * tr > 0.0 && !wet) col = mix(col, vec3(0.45), 0.6 * max(1.0 - abs(rim), 0.0));
  return pow(max(col, 0.0), vec3(0.4545));
}
vec3 render(vec2 p) {
  if (uVar < 0.5) return ifPaper(p);
  return ifFluid(p);
}
