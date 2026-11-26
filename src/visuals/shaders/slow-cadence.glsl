// name: Coming round
// a: Beads on paper
// b: Fine arms
// what: Ninety beads of ink on a warm white sheet, small at the heart and fat at the rim, scattered like seed until they gather on threads into five arms, three, a pair of facing curves, one long curl, and come apart again; or each bead is the pearl at the tip of a hair-fine bent arm, pale on charcoal, opening and folding like fans.
// follows: Fuller music brings the next gathering sooner. Heart to rim the beads are the low to the high bands, each as large as its band is loud, and wet and coloured by what the piece sounds at its row. A hit swells them from the heart outward, and a cue darkens them or lights the arms, dot by dot; low sound spreads the rows; the keys pick out a few beads.
const float scN = 90.0, scBow = 0.40;                // how many there are, and the radius every arm is bent to, against the rim
const vec2 scLight = vec2(-0.64, 0.77);              // towards the window
float scR, scPx, scTurn, scLean, scC, scQ, scStrung, scTooth;
// One rule for all: number n has turned n times when the first has turned once.
float scAngle(float n) { return TAU * (fract(n * scTurn) + scLean); }
float scOut(float x) { return scR * (0.03 + x * (1.0 + scC - scC * x)); }
// Which row lies at this distance out: scOut, the other way round.
float scRowAt(float r) { float k = 1.0 + scC; return (k - sqrt(max(0.0, k * k - 4.0 * scC * clamp(r / scR - 0.03, 0.0, 1.0)))) / (2.0 * scC); }
// The swelling of a hit and the darkening of a cue, as they pass row x on the way out.
float scHit(float x) { float d = (x - 0.12 - 1.1 * (1.0 - uHits)) * 4.5; return uHits * exp(-d * d); }
float scCue(float x) { float d = (x - 0.12 - 1.1 * (1.0 - uCue)) * 2.8; return min(1.0, uCue * 1.5) * exp(-d * d); }
float scKey(float n) { return uKeys * step(0.5, fract(n * 0.2857143 + 0.2)) * step(0.5, fract(n * 0.2)); }
// What the piece sounds at row x just now: its colour, and how loud.
vec4 scRow(float x) { vec4 m = piece(vec2(uLoop, 0.06 + 0.88 * x)); return vec4(m.rgb / max(m.a, 0.04), sat(m.a * 1.25)); }

vec3 scPaper(vec2 p, vec3 sheet, float rough) {
  float tooth = noise(p * 210.0) - 0.5, felt = noise(rot(0.7) * p * vec2(46.0, 60.0)) - 0.5, cloud = 0.5 * sin(p.x * 5.1 + 1.0 + 1.3 * sin(p.y * 4.3)) * sin(p.y * 6.7 + p.x * 2.0);
  scTooth = tooth;
  float slope = noise(p * 210.0 + vec2(0.6, -0.8)) - 0.5 - tooth;
  return sheet * (1.0 + rough * (0.55 * slope + 0.25 * tooth + 0.35 * felt) + 0.03 * cloud);
}

// One bead of ink lying on what is already there.
vec3 scBead(vec3 col, vec3 sheet, vec2 d, float n, float x, float rad, float y, float cue) {
  float h = hash11(n + 0.5), h2 = fract(h * 7.31), l = length(d);
  vec4 m = scRow(x);
  vec3 ink = mix(vec3(0.13, 0.15, 0.22), vec3(0.32, 0.19, 0.13), (1.0 - smoothstep(0.0, 0.5, x + 0.5 * h2 - 0.2)));
  ink = mix(ink, m.rgb * sqrt(m.rgb), 0.92 * m.a);
  float wet = sat(0.25 + 0.75 * m.a + 0.4 * y);
  // where a hit passes, the ink runs out into the paper round it
  float run = max(y, 0.8 * cue);
  if (run > 0.01) { float f = l / (rad * 2.0 + 0.012); col *= mix(vec3(1.0), mix(mix(uKind[4], ink + 0.2, 0.5), vec3(0.35, 0.36, 0.45), sat(cue - y)), 0.42 * run * exp(-f * f * 2.6)); }
  // the shade it throws, away from the window, with the light that came through the ink in it
  vec2 s = d + scLight * rad * (0.42 + 0.35 * uSpace * wet);
  float sh = length(s) / rad;
  col *= mix(vec3(1.0), vec3(0.60, 0.585, 0.60), (1.0 - smoothstep(0.55, 1.4 + 0.2 * uSpace, sh)) * (0.45 + 0.55 * wet));
  col += (ink + 0.06) * 0.42 * wet * m.a * (1.0 - smoothstep(0.1, 0.85, length(s + scLight * rad * 0.34) / rad));
  vec2 u = d / rad;
  // no drop is quite round
  float c = dot(u, normalize(vec2(h - 0.503, h2 - 0.4))) / max(l / rad, 1e-4);
  float e = 1.0 + 0.024 * (2.0 * c * c - 1.0) + 0.014 * c * (4.0 * c * c - 3.0);
  float cover = smoothstep(-scPx, scPx, rad * e - l);
  if (cover <= 0.0) return col;
  float k = sat(l / (rad * e)), side = dot(u, -scLight);
  // dry ink is a grey wash with a dark rim; where it sounds it is wet and coloured
  float dens = mix(0.5, 1.5, h2 * h2) + 0.30 * (uTone - 0.5) + 0.3 * m.a + 1.1 * cue + 0.5 * y;
  dens *= 0.82 + mix(0.42, 0.30, wet) * smoothstep(0.62, 0.95, k) + mix(0.5, 0.15, wet) * scTooth;
  // the light goes in at the window side and gathers across from it
  dens *= 1.0 - 0.66 * wet * smoothstep(-0.1, 0.8, side) * (1.0 - smoothstep(0.66, 1.0, k));
  dens += 0.26 * wet * (1.0 - smoothstep(-0.95, 0.2, side));
  vec3 bead = mix(col, sheet, 0.5) * pow(max(ink, 0.012), vec3(dens));
  vec2 g = u - vec2(-0.34, 0.40);
  float gleam = (1.0 - smoothstep(0.13, 0.27, length(rot(0.7) * g * vec2(1.0, 1.5)))) * smoothstep(0.3, 0.8, wet + 0.1) * smoothstep(0.003, 0.009, rad);
  bead = mix(bead, mix(vec3(1.0, 0.985, 0.95), vec3(1.0, 0.86, 0.5), scKey(n)), max(0.82 * gleam, 0.8 * scKey(n) * (1.0 - smoothstep(0.30, 0.62, k))));
  return mix(col, bead, cover * 0.97);
}

vec3 scBeads(vec2 p) {
  float shape = uRes.x / uRes.y, wide = min(1.0, 0.45 + 0.5 * shape);
  vec2 heart = vec2(0.105 * min(shape / 1.78, 1.3), -0.052);
  scR = 0.555 * wide; scC = 0.42 - 0.06 * uLow;
  // window light across the sheet
  float lit = 0.5 + 0.5 * dot(p, vec2(-0.5, 0.62));
  vec3 sheet = scPaper(p, mix(vec3(0.80, 0.755, 0.685), vec3(0.975, 0.955, 0.91), smoothstep(0.08, 0.72, lit)), 0.07);
  vec3 col = sheet;
  vec2 q = p - heart;
  const vec2 off = vec2(-0.036, 0.026);            // the heart of the spiral lies a little off the middle of its rim
  float s = length(q), reach = 0.05 + 0.055 * min(1.0, s / scR) + 0.07 * max(uHits, uCue);
  if (s > scR + reach) return col;
  int i1 = int(max(1.0, floor(scRowAt(s - reach) * scN))), i2 = int(min(scN, ceil(scRowAt(s + reach) * scN)));
  float psi = atan(q.y, q.x + 1e-5) / TAU - scLean, most = 1.26 + 0.3 * uEnergy, blot = max(uHits, uCue);
  // the thread they hang on while they are gathered
  if (scStrung > 0.0) for (int i = max(1, i1 - 2); i <= i2; i++) {
    float n = float(i), x = n / scN, x2 = (n + scQ) / scN;
    if (x2 > 1.0) break;
    if (min(4.0 * abs(fract(psi - n * scTurn + 0.5) - 0.5), 1.0) * s > 0.045 * (1.0 - x) + 0.17 * x + 0.01) continue;
    float a = scAngle(n), a2 = scAngle(n + scQ);
    vec2 A = off * (1.0 - x) + scOut(x) * vec2(cos(a), sin(a)), B = off * (1.0 - x2) + scOut(x2) * vec2(cos(a2), sin(a2)) - A, w = q - A;
    float e = length(w - B * sat(dot(w, B) / max(dot(B, B), 1e-7)));
    col *= 1.0 - 0.7 * scStrung * (1.0 - smoothstep(0.0003, 0.5 * scPx + 0.0016, e));
  }
  for (int i = i1; i <= i2; i++) {
    float n = float(i), x = n / scN, full = 0.0042 + 0.026 * x * sqrt(x);
    float lim = (full * most + 0.012 * blot + 0.007 * uMic * step(x, 0.6)) * (1.9 + 0.5 * uSpace + 1.1 * blot) + 0.015 * blot;
    float aside = min(4.0 * abs(fract(psi - n * scTurn + 0.5) - 0.5), 1.0) * s - 0.045 * (1.0 - x);
    if (aside > lim) continue;
    float a = scAngle(n);
    vec2 d = q - off * (1.0 - x) - scOut(x) * vec2(cos(a), sin(a));
    float dd = dot(d, d);
    if (dd > lim * lim) continue;
    float b = band(x), y = uHits > 0.004 ? scHit(x) : 0.0, cue = uCue > 0.004 ? scCue(x) : 0.0;
    float rad = full * (0.84 + (0.4 + 0.3 * uEnergy) * b) + y * (0.007 + 0.005 * x) + 0.003 * cue + 0.007 * uMic * exp(-x * 7.0);
    // only where it lies, or its shade, or its blot
    vec2 mid = d + scLight * rad * (0.42 + 0.22 * uSpace);
    float far = max(y, cue) > 0.01 ? rad * 3.2 + 0.018 : rad * (1.46 + 0.34 * uSpace);
    if (dot(mid, mid) < far * far) col = scBead(col, sheet, d, n, x, rad, y, cue);
  }
  return col;
}

vec3 scArms(vec2 p) {
  float shape = uRes.x / uRes.y;
  vec2 heart = vec2(-0.30 * min(shape / 1.78, 1.3), -0.16);
  scR = 0.80; scC = 0.30 - 0.05 * uLow;
  vec2 q = p - heart;
  float s = length(q) + 1e-5;
  float lit = 0.5 + 0.5 * dot(p, vec2(-0.5, 0.62));
  vec3 sheet = scPaper(p, mix(vec3(0.078, 0.083, 0.094), vec3(0.245, 0.235, 0.228), smoothstep(0.08, 0.95, lit)), 0.22), col = sheet;
  float far = 1.0 / (2.0 * scBow * 2.0 * scR);
  float z = min(s * far, 0.9), bend = asin(z), slope = sqrt(1.0 - z * z);
  float psi = (atan(q.y, q.x + 1e-5) - bend) / TAU - scLean;
  // an arm is bright where it lies across the light
  float dir = TAU * psi + TAU * scLean + 2.0 * bend, sd = sin(dir - 2.2), satin = 0.42 + 0.58 * sd * sd;
  float sheen = 0.0, perTurn = TAU * s * slope, px = 0.7 * scPx;
  int i1 = int(max(1.0, floor(scRowAt(s - 0.02) * scN)));
  for (int i = i1; i <= 90; i++) {
    float n = float(i), x = n / scN, r = scOut(x), v = r * far;
    if (s > r) continue;
    float at = n * scTurn - v * (1.0 + v * v * (0.1667 + 0.082 * v * v)) / TAU;
    float da = abs(fract(psi - at + 0.5) - 0.5);
    if (da > 0.024) continue;
    float t = s / r, d = da * perTurn, k = 1.0 - da * 41.6;
    float t2 = t * t; sheen += k * k * t2 * (1.0 - t2 * t2 * t2 * t2);
    float w = mix(0.0006, 0.0017, t2) * (0.8 + 0.4 * uTone), W = max(w, 0.6 * scPx);
    float amt = (1.0 - smoothstep(W - px, W + px, d)) * w / W;
    if (amt < 0.01) continue;
    vec4 m = scRow(x);
    vec3 tone = mix(vec3(0.95, 0.92, 0.85), m.rgb * 1.15 + 0.1, 0.75 * m.a);
    col = mix(col, tone, sat(amt * smoothstep(0.02, 0.9, t) * satin * (0.85 + (0.4 + uEnergy) * band(x) + 0.6 * m.a + scHit(x) + scCue(x))));
  }
  float row = scRowAt(s);
  vec3 dust = vec3(0.10, 0.095, 0.085) + uKind[4] * 0.55 * scHit(row) + vec3(0.40, 0.36, 0.28) * scCue(row);
  col += dust * (sheen / (1.0 + 0.12 * sheen)) * satin * (0.40 + 0.40 * uSpace);
  int i2 = int(min(scN, ceil(scRowAt(s + 0.02) * scN)));
  for (int i = i1; i <= i2; i++) {
    float n = float(i), x = n / scN, a = scAngle(n);
    vec2 e = q - scOut(x) * vec2(cos(a), sin(a));
    float b = band(x), y = scHit(x), rad = (0.0024 + 0.0055 * x) * (0.8 + 0.9 * b) + 0.005 * y + 0.004 * scKey(n), l = length(e);
    float bead = (1.0 - smoothstep(-scPx, scPx, l - rad));
    if (bead < 0.004) continue;
    vec4 m = scRow(x);
    vec3 tone = mix(vec3(0.95, 0.92, 0.85), m.rgb * 1.15 + 0.1, 0.75 * m.a);
    col = mix(col, tone * (0.75 + 0.25 * dot(e / rad, vec2(-0.6, 0.8))), bead);
  }
  return col;
}

vec3 render(vec2 p) {
  scPx = 1.0 / uRes.y;
  scTurn = fract(0.390 + fract(uTime / (uVar < 0.5 ? 2048.0 : 4096.0)) + fract(uTravel / 2048.0));
  scLean = fract(0.09 + uTime * 0.0004);
  // the nearest simple ratio, and how nearly they have come round to it
  scQ = 1.0; float near = 1.0;
  for (int k = 1; k <= 7; k++) { float e = abs(fract(float(k) * scTurn + 0.5) - 0.5); if (e < near - 1e-5) { near = e; scQ = float(k); } }
  scStrung = (1.0 - smoothstep(0.012, 0.05, near));
  return uVar < 0.5 ? scBeads(p) : scArms(p);
}
