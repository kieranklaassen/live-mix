// name: Iron filings
// a: Filings
// b: Spiked fluid
// what: Thousands of iron needles on white paper over hidden magnets: they lie in chains along the pull, stand up thick and black at the poles and throw small shadows; or a pool of black magnetic fluid in a white dish that swells and rises into crowns of glossy spikes.
// follows: Drone, pad, texture and phrase are each a pole that grows stronger as it sounds, its colour showing through the paper or from a lamp; keys and a voice add to it. High sound sharpens the points. A hit sends a ring of knocked needles or spikes outward; a cue turns one pole round, or lets the crowns sink and rise. The poles drift over minutes.
// own: 0 1 a few great needles or spikes, -1 a multitude of fine ones; 1 the poles: 1 one in the middle and the rest in a slow wheel about it, -1 strung in a row (b: the pool a long channel); 2 1 a whorl, the chains run in spirals (b: the spikes lean round), -1 closed rings about each pole (b: the spikes lean inward as a bud); 3 the ground: 1 night, the iron pale on it, -1 a wash of the drone's and the pad's colour; 4 1 dyed in the sounds' colours, matt, -1 bright metal; 5 the eye: 1 low over the ground to a hazy distance, -1 a: the sheet is a ball, b: from straight above; 6 1 a fur that stands everywhere (b: a sea with no dish), -1 nearly all gone but at the poles (b: the pool in separate drops); 7 1 broad pointed petals (b: tall thin spires), -1 round grains (b: low domes)
vec3 ifPX, ifPY, ifQX, ifQY, ifS, ifT;      // the hidden poles, three and three: where, and how strong (the sign is which way round)
const vec3 IF_D = vec3(0.1, 0.085, 0.055), IF_E = vec3(0.05, 0.05, 0.045); // how deep they lie
vec3 ifB, ifBx, ifBy;              // the field where we are, and how it changes across and up the sheet
vec2 ifSun; float ifPx, ifBlur;    // where shadows fall for a unit of height; a pixel on the paper; how far out of focus
float ifShade, ifCov; vec3 ifInk, ifGel, ifThrough; // ifGel and ifThrough: what colour the sounding poles lend the iron and the paper
float ifV = 0.6;                   // how far up the sheet a unit of height is seen
float ifSz = 1.0, ifCell = 1.0, ifLen = 1.0, ifThick = 1.0; // the filings beside the plain ones: size, spacing, length, thickness
vec4 ifDye; vec3 ifLoft; // the colour of the nearest poles, sounding or not; the ball's face
// How far a cue has turned the poles round: nothing at first, most in the middle, nothing at the end.
float ifTurn() { return 4.0 * uCue * (1.0 - uCue); }
void ifPoles() {
  float t = uTime * 0.013, wide = clamp(uRes.x / uRes.y / 1.7, 0.36, 1.2), high = wide < 0.6 ? 1.15 : 1.0;
  ifPX = wide * (vec3(-0.31, 0.25, 0.5) + 0.055 * sin(t * vec3(2.0, 2.31, 2.62) + vec3(0.0, 2.1, 4.2)));
  ifQX = wide * (vec3(-0.13, 0.1, -0.66) + 0.055 * sin(t * vec3(2.93, 3.24, 3.55) + vec3(0.0, 2.1, 4.2) + 6.3));
  ifPY = high * vec3(0.08, -0.1, 0.27) + 0.055 * cos(t * vec3(1.7, 1.93, 2.16) + vec3(0.0, 1.3, 2.6));
  ifQY = high * vec3(-0.36, 0.33, -0.27) + 0.055 * cos(t * vec3(2.39, 2.62, 2.85) + vec3(0.0, 1.3, 2.6) + 3.9);
  if (uOwn[1] > 0.0) {               // a wheel
    vec3 u = 1.2566 * vec3(0.0, 1.0, 2.0) + 0.02 * uTime, v = 1.2566 * vec3(3.0, 4.0, 2.0) + 0.02 * uTime;
    float rx = 0.44 * min(wide, 1.0), ry = 0.37 * high;
    ifPX = mix(ifPX, vec3(0.0, rx * cos(u.x), rx * cos(u.y)), uOwn[1]); ifPY = mix(ifPY, vec3(0.0, ry * sin(u.x), ry * sin(u.y)), uOwn[1]);
    ifQX = mix(ifQX, rx * cos(vec3(v.z, v.x, v.y)), uOwn[1]); ifQY = mix(ifQY, ry * sin(vec3(v.z, v.x, v.y)), uOwn[1]);
  }
  if (uOwn[1] < 0.0) {               // a row
    ifPX = mix(ifPX, wide * vec3(-0.14, 0.2, 0.74), -uOwn[1]); ifPY = mix(ifPY, 0.03 * sin(t * vec3(5.0, 4.2, 4.6) + vec3(0.0, 2.0, 4.0)), -uOwn[1]);
    ifQX = mix(ifQX, wide * vec3(-0.43, 0.48, -0.72), -uOwn[1]); ifQY = mix(ifQY, 0.03 * sin(t * vec3(4.4, 5.2, 4.8) + vec3(1.0, 3.0, 5.0)), -uOwn[1]);
  }
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
  if (uOwn[4] != 0.0) ifDye += vec4(kc * n, n.x + n.y + n.z);
  n *= n * go;
  ifThrough += n.x + n.y + n.z - kc * n;
}
void ifField(vec2 q) {
  ifB = ifBx = ifBy = ifGel = ifThrough = vec3(0.0); ifDye = vec4(1e-7 * uKind[0], 1e-7);
  float gw = 0.03;
  ifThree(q, ifPX, ifPY, ifS, IF_D, vec3(uDrone, uPad, uTexture), mat3(uKind[0], uKind[1], uKind[2]), gw);
  ifThree(q, ifQX, ifQY, ifT, IF_E, vec3(uPhrase, max(uHits, uCue), max(uKeys, uMic)), mat3(uKind[3], uKind[4], uKind[3]), gw);
  // a hit floods the paper over the fifth pole with its colour, a cue over the pole it turns
  vec2 h = q - vec2(ifQX.y, ifQY.y), c = q - vec2(ifPX.y, ifPY.y);
  ifThrough += (1.0 - uKind[4]) * 0.45 * uHits * exp(-dot(h, h) * 60.0) + (1.0 - uKind[1]) * 0.5 * uCue * exp(-dot(c, c) * 30.0);
  ifGel = min(ifGel / gw, 1.0);
  ifDye.rgb /= ifDye.w;
  if (uOwn[3] > 0.0 || uOwn[4] > 0.0) ifGel += uKind[4] * 2.0 * uHits * exp(-dot(h, h) * 13.0) + uKind[1] * 1.2 * uCue * exp(-dot(c, c) * 25.0);
  if (uOwn[2] != 0.0) {              // the chains run off at an angle to the pull: spirals, then rings
    mat2 off = rot(uOwn[2] * (uOwn[2] > 0.0 ? 1.05 : 1.5708));
    ifB.xy = off * ifB.xy; ifBx.xy = off * ifBx.xy; ifBy.xy = off * ifBy.xy;
  }
}
// What a filing is made of. c: as iron, lit: to the window, up: foot to tip.
vec3 ifStuff(vec3 c, float lit, float up) {
  if (uOwn[3] > 0.0) c = mix(c, vec3(0.95, 0.93, 0.89) * (0.3 + 1.2 * lit * lit) * (0.45 + 0.55 * up) * (1.0 - 0.5 * ifGel) + ifGel * (0.3 + 0.7 * lit), uOwn[3]);
  if (uOwn[4] > 0.0) c = mix(c, ifDye.rgb * (0.4 + 0.8 * lit) * (0.5 + 0.5 * up) * (1.0 + 0.5 * ifGel), uOwn[4]);
  if (uOwn[4] < 0.0) c = mix(c, ifDye.rgb * ifDye.rgb * (0.15 + 0.5 * up) + (0.35 + 0.65 * ifDye.rgb) * smoothstep(0.4, 0.75, lit) * (0.4 + 0.75 * up), -uOwn[4]);
  return c;
}
// The ground, before anything lies on it. was: the white paper.
vec3 ifGround(vec3 was, vec2 p, vec2 q, float lamp, float tooth) {
  if (uOwn[3] > 0.0) was = mix(was, (vec3(0.035) + 0.07 * mix(uKind[0], uKind[1], sat(0.5 + p.x))) * (2.0 * lamp - 0.8) + 0.02 * tooth, uOwn[3]);
  if (uOwn[3] < 0.0) {
    float f = fbm(q * vec2(1.7, 2.6) + 3.0);
    was = mix(was, (mix(uKind[0], uKind[1], smoothstep(-0.55, 0.6, p.y + 1.1 * (f - 0.5))) * (0.82 + 0.4 * f) + 0.05) * (0.2 + 0.85 * lamp) + 0.03 * tooth, -uOwn[3]);
  }
  return was;
}
// One filing: how far we are from its middle, half of it as a vector in the room, half its width, how much it is there.
void ifNeedle(vec2 d, vec3 h, float w, float on, float tone) {
  vec2 a = h.xy + vec2(0.0, h.z * ifV), s = h.xy + ifSun * h.z;
  vec2 e = d - vec2(0.0, h.z * ifV), g = d - ifSun * h.z;
  float t = clamp(dot(e, a) / (dot(a, a) + 1e-7), -1.0, 1.0), u = clamp(dot(g, s) / (dot(s, s) + 1e-7), -1.0, 1.0);
  float sl = length(g - s * u), sw = w * 1.5 + ifPx + ifBlur + h.z * (u + 1.0) * 0.1;
  ifShade = max(ifShade, (1.0 - smoothstep(0.0, sw * 1.5, sl)) * on * (0.6 - 0.12 * u));
  vec2 v = e - a * t;
  float l = length(v), aa = ifPx * 0.7 + ifBlur, ww = w * (1.0 - 0.75 * t * t * t * t);
  if (uOwn[7] > 0.0) ww = mix(ww, 1.2 * w * (1.0 - t) * (0.35 + 0.65 * t + 0.6), uOwn[7]);
  float cov = (1.0 - smoothstep(ww - aa, ww + aa, l)) * min(1.0, ww / aa) * on;
  if (cov < 0.003) return;
  float lit = sat(0.5 - 0.6 * (v.x * 0.84 - v.y * 0.54) / (w + aa)); // the side to the window
  vec3 c = vec3(tone) * (0.3 + 1.2 * lit * lit) + (0.05 + 0.3 * h.z / (length(h) + 1e-5)) * lit * smoothstep(-0.4, 1.0, t) * (0.3 + ifGel);
  if (uOwn[3] > 0.0 || uOwn[4] != 0.0) c = ifStuff(c, lit, smoothstep(-1.0, 0.8, t));
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
    if (on < 0.01 || dot(d, d) > l * l + 2e-5 * ifThick * ifThick) continue;
    vec2 a = normalize(along + (h.w - 0.5) * loose * side + 1e-5) * l;
    float t = clamp(dot(d, a) / (l * l), -1.0, 1.0), ww = w * (0.6 + 0.7 * h.y) * (1.0 - 0.6 * t * t * t * t);
    vec2 v = d - a * t;
    if (uOwn[7] > 0.0) ww *= 1.0 - uOwn[7] * t * t;
    float cov = (1.0 - smoothstep(ww - aa, ww + aa, length(v))) * min(1.0, ww / aa) * on;
    ifShade = max(ifShade, (1.0 - smoothstep(0.0, ww * 1.5 + aa, length(v - ifSun * ww * 1.6))) * on * 0.6);
    float lit = sat(0.5 - 0.6 * (v.x * 0.84 - v.y * 0.54) / (ww + aa)); // the side to the window
    vec3 c = vec3(0.02 + 0.09 * h.w * h.w) * (0.3 + 1.2 * lit * lit) + (0.04 + 0.12 * h.y) * lit * ifGel;
    if (uOwn[3] > 0.0 || uOwn[4] != 0.0) c = ifStuff(c, lit, 0.6 + 0.4 * h.w);
    ifInk = mix(ifInk, c, cov);
    ifCov = mix(ifCov, 1.0, cov);
  }
}
// A sowing of filings that stand up at the poles, leaning as the field leans.
void ifStand(vec2 q, float cell, float len, float w, float seed, float from) {
  vec2 g = q / cell, id0 = floor(g);
  for (int j = 1; j >= (uOwn[5] > 0.0 ? -2 : -1); j--) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec4 h = fract(hash21(id + seed) * vec4(1.0, 31.7, 97.3, 411.1));
    vec2 d = (g - id - 0.5 - 0.7 * (h.xy - 0.5)) * cell;
    float l = len * (0.5 + 0.6 * h.x);
    if (dot(d, d) > l * l * (3.6 + 2.4 * max(uOwn[5], 0.0)) + 1e-4 * max(-uOwn[7], 0.0) * ifSz * ifSz) continue;
    vec3 f = ifB - ifBx * d.x - ifBy * d.y;
    if (uOwn[6] > 0.0) f.z += uOwn[6] * (f.z < 0.0 ? -0.6 : 0.6) * length(f.xy);
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
  float low = max(uOwn[5], 0.0), ball = max(-uOwn[5], 0.0), fur = max(uOwn[6], 0.0), bare = max(-uOwn[6], 0.0);
  float hair = max(uOwn[7], 0.0), grain = max(-uOwn[7], 0.0);
  ifSz = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.1 : 0.7));
  ifCell = ifSz * (1.0 + 0.5 * hair); ifLen = ifSz * (1.0 + 0.6 * hair) * (1.0 - 0.75 * grain); ifThick = ifSz * (1.0 + 3.2 * hair) * (1.0 + 2.6 * grain);
  ifV = 0.6 + 0.45 * low - 0.4 * ball;
  float w = 1.0 / max(1.0 - (0.2 + 0.4 * low) * (1.0 - ball) * p.y, 0.15);
  vec2 q = vec2(p.x, p.y / 0.85) * w;
  if (low > 0.0) q.y = mix(q.y, p.y / 0.6 * w - 0.17, low);
  ifPx = w / uRes.y;
  ifBlur = 0.003 * smoothstep(0.25, 0.6, abs(p.y + 0.02));
  float R = 0.465 / max(ball, 0.01), rr = length(p), limb = 1.0, edge = 1.0;
  if (ball > 0.0) {                  // the sheet goes round a ball
    limb = sqrt(max(1.0 - rr * rr / (R * R), 0.0));
    edge = 1.0 - smoothstep(R - 1.5 * ifPx, R, rr);
    q = mix(q, p * (asin(min(rr / R, 1.0)) * R / max(rr, 1e-4)), min(ball * 4.0, 1.0));
    if (edge <= 0.0) q = p;
    ifPx /= max(limb, 0.12); ifBlur = mix(ifBlur, 0.0, ball);
  }
  ifSun = rot(0.15 * sin(uTime * 0.017)) * vec2(0.85, -0.55) * (0.7 + 0.5 * uSpace);
  ifField(q);
  float m = length(ifB), far = sat(1.0 - m * 16.0);
  // strands: fine noise drawn out along the bent field line through here
  float bl = length(ifB.xy) + 1e-4;
  vec2 d0 = ifB.xy / bl, bend = (ifBx.xy * d0.x + ifBy.xy * d0.y) / bl;
  bend -= d0 * dot(bend, d0);
  bend *= min(1.0, 18.0 / (length(bend) + 1e-3));
  float s = 0.0, ifFine = 110.0 / ifSz;
  for (int k = -2; k <= 2; k++) { float t = float(k) * 0.013 * ifSz; s += noise((q + d0 * t + 0.5 * bend * t * t) * ifFine + 40.0); }
  float s0 = s / 5.0; s = smoothstep(0.38, 0.6, s0);
  float near = smoothstep(0.004, 0.085, m);
  near = sqrt(near);
  float dens = mix(0.05, 1.0, s * near) * mix(0.45, 1.0, near);
  dens *= 1.0 - 0.4 * smoothstep(0.07, 0.12, m) * (1.0 - smoothstep(0.14, 0.24, m));
  if (fur > 0.0) { dens = mix(dens, 0.3 + 0.7 * s, fur); far *= 1.0 - fur; }
  if (bare > 0.0) dens *= mix(1.0, smoothstep(0.06, 0.2, m), bare);
  // the paper, with the painted ends of the magnets showing through it
  float lamp = 1.0 - 0.22 * smoothstep(0.1, 1.7, length(p - vec2(-0.6, 0.45)));
  float tooth = hash21(floor(q * 420.0)) - 0.5;
  vec3 col = mix(vec3(0.93, 0.945, 0.965), vec3(0.975, 0.965, 0.94), sat(lamp * 3.0 - 2.0)) * (lamp + 0.02 * tooth);
  if (uOwn[3] != 0.0) col = ifGround(col, p, q, lamp, tooth);
  if (ball > 0.0) {
    vec2 f = p - vec2(0.2, -0.24) * R;
    ifLoft = vec3(p / R, limb);
    col *= 1.0 - 0.4 * ball * (1.0 - smoothstep(0.2 * R, 1.15 * R, length(f)));
    if (edge <= 0.0) return col;
  }
  vec3 bg = col;
  if (ball > 0.0) col = mix(col, ifGround(vec3(0.9), p, q, 1.0, tooth), ball);
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
  float bed = smoothstep(0.5, 0.6, s0 + 0.35 * tooth) * smoothstep(0.02, 0.07, m) * (0.35 + 0.65 * deep);
  if (bare > 0.0) bed *= mix(1.0, smoothstep(0.1, 0.3, m), bare);
  if (grain > 0.0) bed *= 1.0 - 0.75 * grain;
  if (hair > 0.0) bed *= 1.0 - 0.6 * hair;
  if (uOwn[3] > 0.0) col += uOwn[3] * (vec3(0.3) * bed + ifGel * (0.2 + 0.35 * uEnergy) * smoothstep(0.1, 0.8, m));
  if (uOwn[4] > 0.0) col = mix(col, ifDye.rgb * 0.55, 0.8 * bed * uOwn[4]);
  bed *= 1.0 - max(max(uOwn[3], uOwn[4]), 0.0);
  col *= 1.0 - 0.72 * bed;
  col *= 1.0 - (1.0 - 0.75 * ifGel) * 0.5 * smoothstep(0.12, 0.75, m);
  if (deep > 0.0) {
    ifLie(q, 0.0120 * ifCell, 0.0125 * ifLen, 0.0008 * sharp * ifThick, 17.0, d0, loose, dens * deep, -1);
    if (near > 0.1) ifLie(q, 0.0105 * ifCell, 0.0068 * ifLen, 0.0008 * sharp * ifThick, 3.0, d0, loose * 1.2, dens * deep * smoothstep(0.1, 0.4, near), 0);
  }
  float stLen = ifSz * (1.0 + 0.15 * hair - 0.7 * grain) * (1.0 - 0.15 * low), stW = ifSz * (1.0 + 2.2 * hair) * (1.0 + 2.2 * grain);
  if (m > 0.11 - 0.2 * fur) ifStand(q, 0.018 * ifSz, 0.0255 * stLen, 0.0016 * sharp * stW, 41.0, 0.1 - 0.2 * fur);
  if (m > 0.2) ifStand(q, 0.026 * ifSz, 0.033 * stLen, 0.0021 * sharp * stW, 53.0, 0.18);
  col *= 1.0 - ifShade * vec3(0.82, 0.8, 0.75);
  if (low > 0.0) {
    vec3 all_ = mix(col, ifInk / max(ifCov, 1e-3), ifCov);
    return mix(all_, bg, low * smoothstep(0.1, 0.5, p.y));
  }
  if (ball > 0.0) {
    float sun = sat(dot(ifLoft, vec3(-0.55, 0.5, 0.67)));
    vec3 all_ = mix(col, ifInk / max(ifCov, 1e-3), ifCov);
    return mix(bg, all_ * mix(1.0, 0.42 + 0.75 * sun, ball), edge);
  }
  return mix(col, ifInk / max(ifCov, 1e-3), ifCov);
}
// The black fluid: crowns of it stand over the poles under the dish.
vec4 ifX, ifZ, ifA; float ifSlim, ifTopMost; // where the four crowns stand, and how strong
const vec4 IF_W = vec4(12.0, 18.0, 30.0, 32.0);
float ifStep = 0.118;              // how far apart the spikes stand
vec4 ifWt; float ifSharp = 0.0;    // how much each crown pulls here; b's own 7
const mat2 ifTurned = mat2(0.945, 0.327, -0.327, 0.945);
float ifE; vec2 ifGE, ifLean, ifAt, ifWarp; // the pull at ifAt, how it changes, which way spikes lean there
void ifCrowns() {
  float t = uTime * 0.017;
  ifX = vec4(-0.16, 0.28, 0.17, -0.3) + 0.045 * sin(t * vec4(2.0, 2.3, 2.6, 2.9) + vec4(0.0, 2.1, 4.2, 6.3));
  ifZ = vec4(0.02, 0.16, -0.3, -0.33) + 0.045 * cos(t * vec4(1.7, 1.9, 2.2, 2.4) + vec4(0.0, 1.3, 2.6, 3.9));
  ifStep = 0.118 * exp2(0.8 * uOwn[0]);
  ifSharp = uOwn[7];
  if (uOwn[1] > 0.0) {
    vec3 u = vec3(0.6, 2.694, 4.789) + 0.02 * uTime;
    ifX = mix(ifX, vec4(0.0, 0.4 * cos(u)), uOwn[1]); ifZ = mix(ifZ, vec4(0.0, 0.4 * sin(u)), uOwn[1]);
  }
  if (uOwn[1] < 0.0) {
    ifX = mix(ifX, vec4(-0.16, 0.2, 0.52, -0.5), -uOwn[1]); ifZ = mix(ifZ, 0.03 * sin(t * vec4(5.0, 4.2, 4.6, 5.4) + vec4(0.0, 2.0, 4.0, 1.0)), -uOwn[1]);
  }
  ifA = vec4(0.5, 0.16, 0.02, 0.02) + vec4(0.5, 0.68, 0.75, 0.75) * sqrt(sat(vec4(uDrone, uPad, uTexture, max(uPhrase, max(uKeys, uMic)))));
  ifA *= 1.0 - 0.85 * ifTurn();
  float top = 1.4 * max(max(ifA.x, ifA.y), max(ifA.z, ifA.w)) + 0.3 * uHits;
  ifTopMost = 0.07 + 0.62 * top / (1.0 + 0.3 * top) * (1.0 + 0.5 * max(ifSharp, 0.0));
  ifSlim = mix(0.2, 0.75, sat(0.35 * uTone + 0.5 * uHigh + 0.3 * uMid));
}
void ifPull(vec2 at) {
  vec4 dx = at.x - ifX, dz = at.y - ifZ, n = 1.0 / (1.0 + (dx * dx + dz * dz) * IF_W), a = ifA * n * n, g = -4.0 * IF_W * n * a;
  float e = a.x + a.y + a.z + a.w;
  ifAt = at;
  ifLean = vec2(dot(a, dx), dot(a, dz)) / (0.1 + e);
  ifWt = a;
  if (uOwn[2] > 0.0) ifLean += uOwn[2] * 2.0 * vec2(-ifLean.y, ifLean.x);
  if (uOwn[2] < 0.0) ifLean *= 1.0 + 2.8 * uOwn[2];
  float ring = (length(at - vec2(ifX.y, ifZ.y)) - 0.5 * (1.0 - sat(uHits))) * 8.0;
  e += 1.2 * uHits * (1.0 - uHits) * exp(-ring * ring);
  float sq = 1.0 / (1.0 + 0.3 * e);
  ifE = e * sq;
  ifGE = vec2(dot(g, dx), dot(g, dz)) * sq * sq;
  ifWarp = 0.022 * sin(at.yx * 7.0 + vec2(0.0, 1.7));
}
float ifDishH(float r) { return (0.2 * smoothstep(0.75, 1.12, r) * (1.0 - max(uOwn[6], 0.0)) - 0.24 * smoothstep(1.13, 1.2, r)) * (1.0 - 0.85 * max(uOwn[5], 0.0)); }
// Above 0 inside the puddle's outline.
float ifPool(vec2 q) {
  float in_ = 1.0 - q.x * q.x * 2.0 - q.y * q.y * 2.5 - 0.5 * q.x * q.y - 0.5 * q.x * q.x * q.x;
  if (uOwn[1] < 0.0) in_ = mix(in_, 1.0 - q.x * q.x * 1.7 - q.y * q.y * 14.0, -uOwn[1]);
  if (uOwn[6] > 0.0) in_ = mix(in_, max(in_, 1.0), uOwn[6]);
  if (uOwn[6] < 0.0) {
    vec2 g = q / vec2(0.36, 0.31);
    g.x += 0.5 * mod(floor(g.y), 2.0) + 0.2;
    vec2 id = floor(g), f = g - id - 0.5 - 0.12 * (hash22(id) - 0.5);
    vec2 c = (id + 0.5 - vec2(0.5 * mod(id.y, 2.0) + 0.2, 0.0)) * vec2(0.36, 0.31);
    float r = (0.3 + 0.2 * hash21(id + 5.0)) * smoothstep(0.78, 0.6, length(c));
    in_ = mix(in_, 5.0 * (r * r - dot(f, f)) - 0.05 - 0.4 * smoothstep(0.7, 0.8, length(c)), -uOwn[6]);
  }
  return in_;
}
// How far q is from the fluid, by the pull last asked for (below 0 is inside).
float ifFluidD(vec3 q) {
  float in_ = ifPool(q.xz);
  if (in_ < 0.0) return q.y - in_ * 0.2;
  float pool = in_ / (in_ + 0.05 + 0.4 * max(-uOwn[6], 0.0)), y = q.y - pool * (0.04 + 0.14 * max(ifE + dot(ifGE, q.xz - ifAt), 0.0));
  // the spike of this cell of the lattice: the place is first brought back down along the lean
  float fan = 1.0 / (1.0 + 2.6 * max(q.y, 0.0));
  vec2 b = q.xz - ifLean * (1.0 - fan), w = (b + ifWarp) * ifTurned / vec2(ifStep, ifStep * 1.7320508);
  vec2 c1 = floor(w) + 0.5 - w, c2 = floor(w + 0.5) - w;
  c1 *= vec2(1.0, 1.7320508); c2 *= vec2(1.0, 1.7320508);
  vec2 c = dot(c1, c1) < dot(c2, c2) ? c1 : c2;
  vec2 o = ifTurned * c * ifStep;
  float e = ifE * (1.0 + clamp(dot(ifGE, b + o - ifAt) / (ifE + 0.02), -0.6, 0.25)), st = smoothstep(0.1, 0.42, e);
  // a soft swelling where the pull is slight, a spike where it is strong
  float r = length(o), swell = max(1.0 - 4.0 * r * r / (ifStep * ifStep), 0.0);
  y -= 0.035 * pool * smoothstep(0.07, 0.3, e) * swell * swell;
  float h = 0.5 * pool * e * st - 0.03, tall = smoothstep(0.0, 0.08, h);
  if (ifSharp != 0.0) h *= 1.0 + (ifSharp > 0.0 ? 0.5 : 0.6) * ifSharp;
  h = max(h, 0.004);
  float k = 1.0 - max(y, 0.0) / h, R = 0.34 * ifStep * smoothstep(0.0, 0.17, h) * k * mix(1.0, k, ifSlim) * mix(1.0, fan, 0.6);
  if (ifSharp > 0.0) R *= 1.0 - 0.35 * ifSharp;
  if (ifSharp < 0.0) R = mix(R, 0.44 * ifStep * smoothstep(0.0, 0.1, h) * sqrt(max(1.0 - (1.0 - k) * (1.0 - k), 0.0)), -ifSharp);
  float d = y < h ? (r - R) * 0.95 : length(vec2(r, y - h));
  d *= 1.0 - 0.4 * abs(uOwn[2]);
  d = smin(d - 0.002 + 0.06 * (1.0 - tall), y * 0.9, 0.025 * smoothstep(0.1, 0.3, ifE) + 0.001);
  // never further than the next cell's spike may stand, unless well above them all
  return min(d, max(max(0.75 * ifStep - r, 0.3 * ifStep), 0.5 * (q.y - 0.07 - 0.55 * ifE * (1.0 + 0.5 * max(ifSharp, 0.0))) * (uOwn[1] < 0.0 || uOwn[5] > 0.0 ? 0.7 : 1.0)));
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
  c += vec3(1.0, 0.98, 0.95) * (2.6 - 2.2 * max(uOwn[6], 0.0)) * (1.0 - smoothstep(-0.05, 0.15, max(s.x, s.y))) * smoothstep(0.05, 0.15, r.y);
  float w = r.y - 0.22;
  vec4 g = vec4(uDrone, uPad, uTexture, uPhrase) * exp(4.0 * (h.x * vec4(-0.589, -0.951, 0.001, 0.952) + h.y * vec4(0.808, -0.310, -1.000, -0.307)) - 4.0);
  vec3 lamps = uKind[0] * uKind[0] * g.x + uKind[1] * uKind[1] * g.y + uKind[2] * uKind[2] * g.z + uKind[3] * uKind[3] * g.w;
  lamps += uKind[4] * uKind[4] * max(uHits, uCue) * exp(4.0 * dot(h, vec2(0.587, 0.810)) - 4.0);
  c += lamps * (0.5 + 1.8 * uEnergy) * exp(-w * w * 15.0);
  return c;
}
vec3 ifFluid(vec2 p) {
  ifCrowns();
  float low = max(uOwn[5], 0.0), above = max(-uOwn[5], 0.0), night = max(uOwn[3], 0.0), wash = max(-uOwn[3], 0.0), sea = max(uOwn[6], 0.0);
  float sn = 0.5, cs = 0.866, D = 2.75;
  if (uOwn[5] != 0.0) { sn = mix(mix(sn, 0.23, low), 0.985, above); cs = sqrt(1.0 - sn * sn); }
  float F = 2.3 * clamp(uRes.x / uRes.y / 1.5, 0.48, 1.0);
  vec2 s = p - vec2(-0.03, -0.03);
  vec3 ro = vec3(0.12 * sin(uTime * 0.021), D * sn, -D * cs), rd = normalize(vec3(s.x, s.y * cs - F * sn, F * cs + s.y * sn));
  float rise = rd.y;
  rd.y = min(rd.y, -0.02);
  float px = 0.7 / (min(uRes.y, 700.0) * F), far = (-0.04 - ro.y) / rd.y, fl = 0.0, dish = 0.0;
  // begin where the ray meets the round that holds the crowns, or else just over the dish's rim
  float t = (0.22 - max(0.16 * low, 0.169 * sea) - ro.y) / rd.y, ra = dot(rd.xz, rd.xz), rb = dot(ro.xz, rd.xz), rc = rb * rb - ra * (dot(ro.xz, ro.xz) - (uOwn[1] != 0.0 ? 0.6 : 0.36));
  if (rc > 0.0) { float first = (-rb - sqrt(rc)) / ra, last = (-rb + sqrt(rc)) / ra, top = (ifTopMost - ro.y) / rd.y; if (first < t && last > top) t = max(first, top); }
  float shy = 9.0; // the nearest the ray passed by a spike, in pixels
  bool shyly = uOwn[2] != 0.0 || uOwn[1] < 0.0 || uOwn[5] > 0.0;
  int most = rc <= 0.0 && (low > 0.0 && rise > -0.02 || sea == 1.0) ? 1 : shyly ? 38 : uOwn[6] < 0.0 ? 34 : 21;
  for (int i = 0; i < most; i++) {
    vec3 q = ro + rd * t;
    bool in_ = ifPool(q.xz) > -0.2;
    dish = q.y - ifDishH(length(q.xz));
    fl = max(length(q.xz) - 0.71, 0.0) + 0.05;
    if (uOwn[1] < 0.0) fl = max(fl, abs(q.z) - sqrt(1.2 / mix(2.0, 14.0, max(-uOwn[1], 0.0))) + 0.04);
    if (in_) {
      ifPull(q.xz);
      fl = ifFluidD(q);
      if (q.y > 0.06) shy = min(shy, fl / (px * t));
      // two steps for each asking of the pull
      float d = min(fl, dish);
      if (d > px * t * 2.0) {
        if (shyly) { t += d * 0.8; continue; }
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
  vec3 stand = vec3(0.4, 0.41, 0.43);
  if (night > 0.0) { white = mix(white, 0.02 + 0.07 * uKind[0] * uKind[0], night); stand = mix(stand, 0.006 + 0.03 * uKind[1] * uKind[1], night); }
  if (wash > 0.0) { white = mix(white, uKind[0] * uKind[0], wash); stand = mix(stand, uKind[1] * uKind[1] * 0.7, wash); }
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
  if (wet && sea > 0.0) {
    vec2 g = q.xz * 9.0 + vec2(0.0, uTime * 0.11);
    n = normalize(n + sea * 0.12 * (1.0 - smoothstep(0.0, 0.12, q.y - 0.04)) * vec3(noise(g) - 0.5 + 0.5 * (noise(g * 2.7) - 0.5), 0.0, noise(g + 31.0) - 0.5 + 0.5 * (noise(g * 2.7 + 9.0) - 0.5)));
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
    col = vec3(0.005, 0.005, 0.007) + min(seen * (0.07 + 0.93 * fr) * mix(0.06, 1.0, open) * 1.15, 0.3 + 0.5 * night);
    if (uOwn[4] != 0.0) {
      ifPull(q.xz);
      vec3 dye = (uKind[0] * ifWt.x + uKind[1] * ifWt.y + uKind[2] * ifWt.z + uKind[3] * ifWt.w + 1e-4 * uKind[0]) / (ifWt.x + ifWt.y + ifWt.z + ifWt.w + 1e-4);
      dye *= dye;
      float face = dot(n, key);
      if (uOwn[4] > 0.0) col = mix(col, dye * (0.12 + 0.18 * sat(n.y) + 0.85 * sat(face * 0.8 + 0.2) * mix(0.35, 1.0, open) + 0.5 * pow(1.0 - sat(-dot(n, rd)), 3.0)) * (0.6 + 1.2 * sat(q.y * 3.0)) + 0.03 * seen * open, uOwn[4]);
      if (uOwn[4] < 0.0) col = mix(col, (0.25 + 0.75 * dye) * (min(seen, 1.6) * 0.75 + 0.3 * smoothstep(-0.3, 0.9, r.y)) * mix(0.25, 1.0, open), -uOwn[4]);
    }
  } else {
    float sh = 1.0;
    if (rr < 0.95) for (int i = 0; i < 2; i++) {
      float l = i == 0 ? 0.09 : 0.24;
      vec3 a = q + key * l;
      ifPull(a.xz);
      sh = min(sh, sat(0.5 + 2.5 * (a.y - 0.05 - 0.4 * ifE * smoothstep(0.1, 0.42, ifE) * smoothstep(-0.1, 0.15, ifPool(a.xz))) / l));
    }
    float dif = sat(dot(n, key)), on = 1.0 - smoothstep(1.17, 1.185, rr);
    vec3 base = mix(stand * (1.1 - 0.22 * length(p - vec2(-0.5, 0.2))), white, on);
    sh *= mix(0.35 + 0.65 * smoothstep(-0.1, 0.3, length(q.xz - vec2(0.16, -0.14)) - 1.15), 1.0, on);
    float ao = 1.0 - 0.6 * exp(-max(rr - 0.66, 0.0) * 14.0);
    col = base * (0.28 * ao + 0.8 * dif * mix(0.2, 1.0, sh));
    col += on * (ifStudio(r) * open - 0.15) * (0.04 + 0.5 * fr);
    col *= (0.3 + 0.7 * smoothstep(0.0, 4.0 * px * t, -ifPool(q.xz))) * (0.15 + 0.85 * smoothstep(0.3, 1.5, shy));
  }
  // the far rim, against the table, without steps
  float tr = (0.2 - ro.y) / rd.y, rim = (length(ro.xz + rd.xz * tr) - 1.128) / (px * tr * 2.6);
  if (ro.z + rd.z * tr > 0.0 && !wet) col = mix(col, uOwn[3] == 0.0 ? vec3(0.45) : mix(col, 0.6 * white, 0.5), 0.6 * max(1.0 - abs(rim), 0.0) * (1.0 - sea));
  if (low > 0.0 || sea > 0.0) {      // the haze of the distance
    vec3 sky = mix(vec3(0.46, 0.47, 0.49), vec3(0.6, 0.6, 0.6), sat(rise * 4.0 + 0.2));
    if (night > 0.0) sky = mix(sky, mix(0.04 + 0.2 * uKind[1] * uKind[1], 0.01 + 0.04 * uKind[0] * uKind[0], sat(rise * 5.0 + 0.1)), night);
    if (wash > 0.0) sky = mix(sky, mix(uKind[1] * uKind[1], 0.5 * uKind[0] * uKind[0] + 0.3 * uKind[1] * uKind[1], sat(rise * 5.0 + 0.1)), wash);
    float away = max(t - 3.0, 0.0) * 0.3;
    col = mix(col, sky, max(low, sea) * (1.0 - exp(-away * away)));
  }
  return pow(max(col, 0.0), vec3(0.4545));
}
vec3 render(vec2 p) {
  if (uVar < 0.5) return ifPaper(p);
  return ifFluid(p);
}
