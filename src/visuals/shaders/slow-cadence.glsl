// name: Coming round
// a: Beads on paper
// b: Fine arms
// what: Ninety beads of ink on a warm white sheet, small at the heart and fat at the rim, scattered like seed until they gather on threads into five arms, three, a pair of facing curves, one long curl, and come apart again; or each bead is the pearl at the tip of a hair-fine bent arm, pale on charcoal, opening and folding like fans.
// follows: Fuller music brings the next gathering sooner. Heart to rim the beads are the low to the high bands, each as large as its band is loud, and wet and coloured by what the piece sounds at its row. A hit swells them from the heart outward, and a cue darkens them or lights the arms, dot by dot; low sound spreads the rows; the keys pick out a few beads.
// own: 0 1 many more of them, -1 a few; 1 each bead a pointed petal (b: each arm a broad blade), -1 each a square tile (b: each arm a string of dots); 2 1 an open heart, the rows in a wreath, -1 the rows crowd to the heart (b: the arms stand out straight); 3 the ground, and the beads dyed in the colours of the sounds: 1 night (b: pale paper), -1 the colour of the drone; 4 1 each shines by its own light, -1 each drawn as an outline only; 5 1 the sheet lies before us, seen low, -1 it is wrapped over a ball; 6 1 it stays sown as in a seed head, -1 it stays one long curl (both turn slowly and breathe); 7 1 large, lapping one over another, -1 small as grains
const float scBow = 0.40; float scN;                 // how many there are, and the radius every arm is bent to, against the rim
const vec2 scLight = vec2(-0.64, 0.77);              // towards the window
float scHole, scMuch, scDyed, scFlat;                // an open heart, how large against plain, how far dyed, how far a bead is seen from the side
float scR, scPx, scTurn, scLean, scC, scQ, scStrung, scTooth;
// One rule for all: number n has turned n times when the first has turned once.
float scAngle(float n) { return TAU * (fract(n * scTurn) + scLean); }
float scOut(float x) { return scR * (0.03 + scHole + x * (1.0 - scHole) * (1.0 + scC - scC * x)); }
// Which row lies at this distance out: scOut, the other way round.
float scRowAt(float r) {
  if (uOwn[2] != 0.0) { float k = 1.0 + scC, g = max(r / scR - 0.03 - scHole, 0.0) / (1.0 - scHole); return g > 1.0 ? 1.0 : 2.0 * g / (k + sqrt(max(0.0, k * k - 4.0 * scC * g)) + 1e-5); }
  float k = 1.0 + scC; return (k - sqrt(max(0.0, k * k - 4.0 * scC * clamp(r / scR - 0.03, 0.0, 1.0)))) / (2.0 * scC); }
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

// The ground of another world: night, or the colour of the drone; b has paper where a has night.
vec3 scGround(vec2 p, vec3 was, float lit) {
  if (uOwn[3] < 0.0) return mix(was, uKind[0] * (0.42 + 0.62 * smoothstep(0.05, 0.9, lit)) * (1.0 + 0.09 * scTooth + 0.12 * (noise(p * 7.0 + 3.0) - 0.5)), -uOwn[3]);
  if (uVar < 0.5) return mix(was, vec3(0.018, 0.02, 0.028) + (0.02 + 0.06 * uKind[1]) * smoothstep(0.2, 1.0, lit) * (1.0 + 0.5 * scTooth), uOwn[3]);
  return mix(was, mix(vec3(0.80, 0.755, 0.685), vec3(0.975, 0.955, 0.91), smoothstep(0.08, 0.72, lit)) * (1.0 + 0.05 * scTooth), uOwn[3]);
}
// The colour of number n in row x when it is dyed.
vec3 scDye(float n, float x) { float k = 4.0 * (1.0 - x) + 0.9 * (hash11(n + 4.4) - 0.5); return mix(mix(mix(mix(uKind[0], uKind[1], sat(k)), uKind[2], sat(k - 1.0)), uKind[3], sat(k - 2.0)), uKind[4], sat(k - 3.0)); }
// How far out of a bead's middle a place is, for other forms than a drop; e is the way out from the heart.
float scForm(vec2 d, vec2 e, float rad) {
  vec2 a = vec2(dot(d, e), dot(d, vec2(-e.y, e.x))) / rad;
  float l = length(a);
  if (uOwn[1] > 0.0) { float t = a.x / (1.0 + 1.1 * uOwn[1]); l = mix(l, t * t + sqrt(a.y * a.y * 1.7 + 0.002), uOwn[1]); }
  if (uOwn[1] < 0.0) { vec2 b = a * a * 1.15; l = mix(l, sqrt(sqrt(dot(b * b, vec2(1.0)))), -uOwn[1]); }
  return l * rad;
}

// One bead of ink lying on what is already there.
vec3 scBead(vec3 col, vec3 sheet, vec2 d, vec2 way, float n, float x, float rad, float y, float cue) {
  float l = length(d);
  if (scDyed > 0.0 && uOwn[4] <= 0.0 && max(y, cue) < 0.01) { // neither it nor its shade is here
    vec2 s = d + scLight * rad * (0.42 + 0.35 * uSpace);
    if (min(scForm(d, way, rad), scForm(s, way, rad) / 1.5) > rad * 1.06 && length(s) > rad * 1.5) return col;
  }
  float h = hash11(n + 0.5), h2 = fract(h * 7.31);
  vec4 m = scRow(x);
  vec3 ink = mix(vec3(0.13, 0.15, 0.22), vec3(0.32, 0.19, 0.13), (1.0 - smoothstep(0.0, 0.5, x + 0.5 * h2 - 0.2)));
  if (scDyed > 0.0) ink = mix(ink, mix(scDye(n, x), uKind[4], 0.3 * y) * 0.92, scDyed);
  ink = mix(ink, m.rgb * sqrt(m.rgb), 0.92 * m.a * (1.0 - 0.35 * scDyed));
  float wet = sat(0.25 + 0.75 * m.a + 0.4 * y);
  // where a hit passes, the ink runs out into the paper round it
  float run = max(y, 0.8 * cue);
  if (run > 0.01) { float f = l / (rad * 2.0 + 0.012); col *= mix(vec3(1.0), mix(mix(uKind[4], ink + 0.2, 0.5), vec3(0.35, 0.36, 0.45), sat(cue - y)), 0.42 * run * exp(-f * f * 2.6)); }
  // the shade it throws, away from the window, with the light that came through the ink in it
  vec2 s = d + scLight * rad * (0.42 + 0.35 * uSpace * wet);
  float sh = length(s) / rad;
  if (uOwn[1] != 0.0) sh = scForm(s, way, rad) / rad;
  if (uOwn[4] > 0.0) { float g = l / (rad * 2.6 + 0.006); col += ink * (0.16 + 0.75 * m.a + 0.5 * band(x) + y + cue) * uOwn[4] * max(exp(-g * g * 2.2) - 0.06, 0.0) * mix(0.16, 0.55, max(uOwn[3], 0.0)); }
  float bare = 1.0 - abs(uOwn[4]);
  col *= mix(vec3(1.0), vec3(0.60, 0.585, 0.60), (1.0 - smoothstep(0.55, 1.4 + 0.2 * uSpace, sh)) * (0.45 + 0.55 * wet) * bare);
  col += (ink + 0.06) * 0.42 * wet * m.a * (1.0 - smoothstep(0.1, 0.85, length(s + scLight * rad * 0.34) / rad)) * bare;
  vec2 u = d / rad;
  if (uOwn[1] != 0.0) { float f = scForm(d, way, rad); u *= f / max(l, 1e-5); l = f; }
  // no drop is quite round
  float c = dot(u, normalize(vec2(h - 0.503, h2 - 0.4))) / max(l / rad, 1e-4);
  float e = 1.0 + 0.024 * (2.0 * c * c - 1.0) + 0.014 * c * (4.0 * c * c - 3.0);
  float cover = smoothstep(-scPx, scPx, rad * e - l);
  if (uOwn[4] < 0.0) cover *= 1.0 + uOwn[4] * (1.0 - smoothstep(-scPx, scPx, l - rad * e + max(0.1 * rad * (0.6 + wet), 1.6 * scPx)));
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
  if (uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[1] != 0.0) {
    // opaque: a glazed ball, a petal or a tile lit from the window; or a lamp
    float up = sqrt(max(1.0 - k * k, 0.0)), lam = sat(dot(vec3(u, up + 0.1), vec3(scLight * 0.72, 0.62)));
    if (uOwn[1] > 0.0) { vec2 a = vec2(dot(d, way), dot(d, vec2(-way.y, way.x))) / rad; lam = mix(lam, sat(0.62 + 0.3 * a.x + 0.35 * dot(way, scLight) - 0.25 * sign(a.y) * smoothstep(0.0, 0.12, abs(a.y)) * dot(vec2(-way.y, way.x), scLight)), uOwn[1]); }
    if (uOwn[1] < 0.0) lam = mix(lam, 0.66 + 0.5 * smoothstep(0.6, 0.95, k) * dot(u, scLight), -uOwn[1]);
    vec3 ball = ink * (0.2 + 1.0 * lam) * (0.72 + 0.35 * h2 + 0.5 * m.a + 0.35 * band(x) + 0.5 * y + 0.4 * cue) * (1.0 + 0.1 * scTooth);
    ball = min(ball, 0.97);
    bead = mix(bead, ball, max(abs(uOwn[3]), 0.85 * abs(uOwn[1])));
    if (uOwn[4] > 0.0) bead = mix(bead, mix(ink, vec3(1.0, 0.97, 0.9), 0.65 * (1.0 - k * k)) * (0.5 + 0.5 * m.a + 0.5 * band(x) + 0.6 * y + 0.5 * cue), uOwn[4]);
    if (uOwn[4] < 0.0) bead = mix(bead, ink * mix(0.75, 1.3, max(uOwn[3], 0.0)) * (0.8 + 0.6 * m.a + y), -uOwn[4]);
    gleam *= bare * (1.0 - 0.75 * abs(uOwn[1]));
  }
  bead = mix(bead, mix(vec3(1.0, 0.985, 0.95), vec3(1.0, 0.86, 0.5), scKey(n)), max(0.82 * gleam, 0.8 * scKey(n) * (1.0 - smoothstep(0.30, 0.62, k))));
  return mix(col, bead, cover * 0.97);
}

// Where on the sheet a place of the picture lies, when the sheet lies before us or is wrapped over a ball; z is how much smaller things are there, w the light on it.
vec4 scEye(vec2 q, float R) {
  vec4 o = vec4(q, 1.0, 1.0);
  if (uOwn[5] > 0.0) {
    float th = 1.12 * uOwn[5], c = cos(th), sn = sin(th), D = 1.25;
    float Y = q.y * D / max(D * c - q.y * sn, 0.05), k = (D + Y * sn) / D;
    o = vec4(q.x * k, Y, k, 1.0);
  }
  if (uOwn[5] < 0.0) {
    float ball = 0.42 / max(-uOwn[5], 1e-4), s = length(q), g = min(s / ball, 1.0), z = sqrt(max(1.0 - g * g, 0.0)), k = mix(1.0, R * 1.58, -uOwn[5]);
    o.xy = q / max(s, 1e-5) * k * (ball * asin(g) + max(s - ball, 0.0));
    o.z = min(k / max(z, 0.12), 5.0);
    float lam = sat(dot(vec3(q / ball, z), vec3(scLight * 0.7, 0.58)));
    o.w = mix(1.0, 0.16 + 1.05 * lam, -uOwn[5]);
  }
  return o;
}
// What the ball stands before, and the shade it throws there.
vec3 scRound(vec3 col, vec3 sheet, vec2 q, vec4 eye) {
  if (uOwn[5] >= 0.0) return col;
  vec2 s = q + scLight * 0.16;
  float ball = 0.42 / max(-uOwn[5], 1e-4), off = smoothstep(ball - 0.002, ball + 0.004, length(q));
  if (uOwn[3] < 0.0) sheet = mix(sheet, mix(vec3(0.62, 0.58, 0.53), vec3(0.93, 0.905, 0.86), smoothstep(-0.6, 0.6, dot(q, vec2(-0.5, 0.62)))) * (1.0 + 0.04 * scTooth), -0.9 * uOwn[3]);
  vec3 back = sheet * (1.0 - 0.45 * smoothstep(ball + 0.2, ball - 0.12, length(s)));
  return mix(col * eye.w, back, off);
}

vec3 scBeads(vec2 p) {
  float shape = uRes.x / uRes.y, wide = min(1.0, 0.45 + 0.5 * shape);
  vec2 heart = vec2(0.105 * min(shape / 1.78, 1.3), -0.052);
  scR = 0.555 * wide; scC = 0.42 - 0.06 * uLow;
  if (uOwn[2] < 0.0) scC += 1.15 * uOwn[2];
  if (uOwn[5] < 0.0) heart = mix(heart, vec2(0.0), -uOwn[5]);
  // window light across the sheet
  float lit = 0.5 + 0.5 * dot(p, vec2(-0.5, 0.62));
  vec3 sheet = scPaper(p, mix(vec3(0.80, 0.755, 0.685), vec3(0.975, 0.955, 0.91), smoothstep(0.08, 0.72, lit)), 0.07);
  if (uOwn[3] != 0.0) sheet = scGround(p, sheet, lit);
  vec3 col = sheet;
  vec2 q = p - heart, q0 = q; vec4 eye = vec4(q, 1.0, 1.0);
  float form = 1.0, more = 1.0, apart = 1.0;
  if (uOwn[5] != 0.0) { eye = scEye(q, scR); q = eye.xy; scPx *= eye.z; scFlat = uOwn[5] > 0.0 ? cos(1.12 * uOwn[5]) : 1.0; }
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[4] > 0.0 || uOwn[5] > 0.0 || uOwn[7] != 0.0)
  { form = (1.0 + 0.6 * max(uOwn[1], 0.0) + 0.2 * max(-uOwn[1], 0.0)) * (1.0 + 0.9 * max(uOwn[4], 0.0)); apart = (1.0 + 0.9 * max(uOwn[4], 0.0)) / scFlat * (uOwn[5] > 0.0 ? max(eye.z, 1.0) : 1.0); more = form * apart / (1.0 + 0.9 * max(uOwn[4], 0.0)) + 1e-4; }
  const vec2 off = vec2(-0.036, 0.026);            // the heart of the spiral lies a little off the middle of its rim
  float s = length(q), reach = 0.05 + 0.055 * min(1.0, s / scR) + 0.07 * max(uHits, uCue);
  if (more > 1.0) { // no further than the largest bead that could lie here
    float xs = min(1.0, scRowAt(s) + 0.14), b = max(uHits, uCue), rm = (0.0042 + 0.026 * xs * sqrt(xs)) * scMuch * (1.24 + 0.3 * uEnergy) + 0.012 * b + 0.007 * uMic;
    reach = (rm * (1.5 + 0.34 * uSpace) + b * (rm * 2.0 + 0.018)) * more + 0.048 * (1.0 - min(1.0, s / scR)) + 0.004;
  }
  if (s > scR + reach) return scRound(col, sheet, q0, eye);
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
    if (uOwn[3] > 0.0) col += uOwn[3] * 0.16 * scStrung * uKind[1] * (1.0 - smoothstep(0.0003, 0.5 * scPx + 0.0016, e));
    col *= 1.0 - 0.7 * scStrung * (1.0 - smoothstep(0.0003, 0.5 * scPx + 0.0016, e));
  }
  for (int i = i1; i <= i2; i++) {
    float n = float(i), x = n / scN, full = 0.0042 + 0.026 * x * sqrt(x);
    if (scMuch != 1.0) full *= scMuch;
    float lim = (full * most + 0.012 * blot + 0.007 * uMic * step(x, 0.6)) * (1.9 + 0.5 * uSpace + 1.1 * blot) + 0.015 * blot;
    float limA = lim; if (more > 1.0) { if (blot < 0.004) lim = (full * (1.24 + 0.3 * uEnergy) + 0.007 * uMic) * (1.46 + 0.34 * uSpace); limA = lim * apart; lim *= more; }
    float aside = min(4.0 * abs(fract(psi - n * scTurn + 0.5) - 0.5), 1.0) * s - 0.045 * (1.0 - x);
    if (aside > limA) continue;
    float a = scAngle(n);
    vec2 d = q - off * (1.0 - x) - scOut(x) * vec2(cos(a), sin(a));
    if (scFlat < 1.0) d.y *= scFlat / eye.z;
    float dd = dot(d, d);
    if (dd > lim * lim) continue;
    float b = band(x), y = uHits > 0.004 ? scHit(x) : 0.0, cue = uCue > 0.004 ? scCue(x) : 0.0;
    float rad = full * (0.84 + (0.4 + 0.3 * uEnergy) * b) + y * (0.007 + 0.005 * x) + 0.003 * cue + 0.007 * uMic * exp(-x * 7.0);
    // only where it lies, or its shade, or its blot
    vec2 mid = d + scLight * rad * (0.42 + 0.22 * uSpace);
    float far = max(y, cue) > 0.01 ? rad * 3.2 + 0.018 : rad * (1.46 + 0.34 * uSpace);
    if (more > 1.0) {
      far *= form + 0.006 * max(uOwn[4], 0.0) / max(rad, 0.002);
      if (uOwn[1] > 0.0 && max(y, cue) < 0.01 && abs(dot(mid, vec2(-sin(a), cos(a)))) > rad * mix(1.8, 1.25, uOwn[1]) * (1.0 + 0.9 * max(uOwn[4], 0.0))) continue;
    }
    if (dot(mid, mid) < far * far) col = scBead(col, sheet, d, vec2(cos(a), sin(a)), n, x, rad, y, cue);
  }
  return scRound(col, sheet, q0, eye);
}

vec3 scArms(vec2 p) {
  float shape = uRes.x / uRes.y;
  vec2 heart = vec2(-0.30 * min(shape / 1.78, 1.3), -0.16);
  scR = 0.80; scC = 0.30 - 0.05 * uLow;
  if (uOwn[5] != 0.0) heart *= 1.0 - abs(uOwn[5]);
  vec2 q = p - heart, q0 = q; vec4 eye = vec4(q, 1.0, 1.0);
  if (uOwn[5] != 0.0) { eye = scEye(q, scR); q = eye.xy; scPx *= eye.z; }
  float s = length(q) + 1e-5;
  float lit = 0.5 + 0.5 * dot(p, vec2(-0.5, 0.62));
  vec3 sheet = scPaper(p, mix(vec3(0.078, 0.083, 0.094), vec3(0.245, 0.235, 0.228), smoothstep(0.08, 0.95, lit)), 0.22), col = sheet;
  if (uOwn[3] != 0.0) col = sheet = scGround(p, sheet, lit);
  float light = max(uOwn[4], 0.0), inked = max(uOwn[3], 0.0), blade = max(uOwn[1], 0.0), dots = max(-uOwn[1], 0.0), hollow = max(-uOwn[4], 0.0), dusk = max(-uOwn[3], 0.0);
  float far = 1.0 / (2.0 * scBow * 2.0 * scR);
  if (uOwn[2] < 0.0) far *= 1.0 + 0.97 * uOwn[2];
  float wideBy = uOwn[7] == 0.0 ? 1.0 : exp2(uOwn[7] * 1.3), cull = 0.024;
  if (uOwn[1] != 0.0 || uOwn[7] > 0.0 || light > 0.0) {
    float w = 0.002 * wideBy + blade * 0.06 * min(wideBy, 1.4) * sqrt(90.0 / scN) * (0.15 + min(1.0, scRowAt(s) + 0.6 * blade)) + dots * 0.0105 * wideBy + light * 0.03 + 2.0 * scPx;
    cull = min(max(max(blade, sat(scHole * 1.6)) > 0.5 || inked > 0.5 ? 0.004 : 0.024, w / max(TAU * s * sqrt(1.0 - min(s * far * s * far, 0.81)), 1e-3)), 0.12);
  }
  float z = min(s * far, 0.9), bend = asin(z), slope = sqrt(1.0 - z * z);
  float psi = (atan(q.y, q.x + 1e-5) - bend) / TAU - scLean;
  // an arm is bright where it lies across the light
  float dir = TAU * psi + TAU * scLean + 2.0 * bend, sd = sin(dir - 2.2), satin = 0.42 + 0.58 * sd * sd;
  float sheen = 0.0, perTurn = TAU * s * slope, px = 0.7 * scPx;
  int i1 = int(max(1.0, floor(scRowAt(s - 0.02) * scN)));
  if (scHole > 0.0 && s < scR * (0.03 + scHole) * 0.72) i1 = int(scN) + 1;
  for (int i = i1; i <= int(scN); i++) {
    float n = float(i), x = n / scN, r = scOut(x), v = r * far;
    if (s > r) continue;
    float at = n * scTurn - v * (1.0 + v * v * (0.1667 + 0.082 * v * v)) / TAU;
    float da = abs(fract(psi - at + 0.5) - 0.5);
    if (da > cull) continue;
    float t = s / r, d = da * perTurn, k = max(1.0 - da * 41.6, 0.0);
    float t2 = t * t; sheen += k * k * t2 * (1.0 - t2 * t2 * t2 * t2);
    float w = mix(0.0006, 0.0017, t2) * (0.8 + 0.4 * uTone);
    if (uOwn[7] != 0.0) w *= wideBy;
    if (blade > 0.0) w += blade * (0.006 + 0.034 * x) * sin(PI * sqrt(t)) * (1.0 + 0.5 * band(x)) * min(wideBy, 1.4) * sqrt(90.0 / scN);
    float W = max(w, 0.6 * scPx);
    float amt = (1.0 - smoothstep(W - px, W + px, d)) * w / W;
    if (blade > 0.0 && hollow > 0.0) amt *= 1.0 - hollow * 0.93 * (1.0 - smoothstep(-px, px, d - W + 0.0024));
    if (dots > 0.0) { float st = fract(s * 30.0 - 0.15 * uTime * 0.1) - 0.5, rd = (0.0022 + 0.004 * t2) * wideBy * (0.8 + 0.9 * band(x)), e2 = length(vec2(st / 30.0, d)); amt = mix(amt, 1.0 - smoothstep(rd - px, rd + px, e2), dots); }
    if (scHole > 0.0) amt *= smoothstep(0.75, 1.0, s / (scR * (0.03 + scHole)));
    if (light > 0.0) { float g = d / (0.004 + 0.008 * wideBy); amt = max(amt, light * 0.22 * exp(-g * g) * step(d, 0.08)); }
    if (amt < 0.01) continue;
    vec4 m = scRow(x);
    vec3 tone = mix(vec3(0.95, 0.92, 0.85), m.rgb * 1.15 + 0.1, 0.75 * m.a);
    if (scDyed > 0.0) {
      tone = mix(tone, mix(scDye(n, x), m.rgb, 0.5 * m.a) * mix(1.1, 0.75, inked), scDyed);
      if (blade > 0.0) tone *= 1.0 + blade * (0.42 * sign(fract(psi - at + 0.5) - 0.5) * smoothstep(0.0, 0.004, d) * -0.6 + 0.25 * (t - 0.5) + 0.3 * smoothstep(0.003, 0.0, d));
      tone = mix(tone, uKind[4], scHit(x)) * (1.0 + 0.35 * scCue(x));
      amt *= 1.0 + 0.5 * max(inked, blade);
    }
    col = mix(col, tone, sat(amt * smoothstep(0.02, 0.9, t) * satin * (0.85 + (0.4 + uEnergy) * band(x) + 0.6 * m.a + scHit(x) + scCue(x))));
  }
  float row = scRowAt(s);
  vec3 dust = vec3(0.10, 0.095, 0.085) + uKind[4] * 0.55 * scHit(row) + vec3(0.40, 0.36, 0.28) * scCue(row);
  if (inked > 0.0) dust *= 1.0 - 1.5 * inked;
  if (light > 0.0) dust += light * 0.12 * kindColour(4.0 * (1.0 - row));
  if (blade > 0.0 || scHole > 0.0) sheen *= 1.0 - max(0.8 * blade, sat(scHole * 1.6));
  if (dusk > 0.0) dust *= 1.0 - 0.6 * dusk;
  col += dust * (sheen / (1.0 + 0.12 * sheen)) * satin * (0.40 + 0.40 * uSpace);
  float out2 = 0.02; if (uOwn[7] > 0.0 || light > 0.0) out2 = (0.004 + 0.016 * wideBy * wideBy) * (1.0 + 1.2 * light) + 0.01 * light;
  if (out2 > 0.02) i1 = int(max(1.0, floor(scRowAt(s - out2) * scN)));
  int i2 = int(min(scN, ceil(scRowAt(s + out2) * scN)));
  for (int i = i1; i <= i2; i++) {
    float n = float(i), x = n / scN, a = scAngle(n);
    vec2 e = q - scOut(x) * vec2(cos(a), sin(a));
    float b = band(x), y = scHit(x), rad = (0.0024 + 0.0055 * x) * (0.8 + 0.9 * b) + 0.005 * y + 0.004 * scKey(n), l = length(e);
    if (uOwn[7] != 0.0 || blade > 0.0) rad *= wideBy * wideBy * (1.0 - 0.6 * blade);
    float bead = (1.0 - smoothstep(-scPx, scPx, l - rad));
    if (hollow > 0.0) bead *= 1.0 - hollow * (1.0 - smoothstep(-scPx, scPx, l - rad + max(0.0018, 0.16 * rad)));
    if (light > 0.0) { float g = l / (rad * 2.4 + 0.004); bead = max(bead, light * 0.5 * exp(-g * g)); }
    if (bead < 0.004) continue;
    vec4 m = scRow(x);
    vec3 tone = mix(vec3(0.95, 0.92, 0.85), m.rgb * 1.15 + 0.1, 0.75 * m.a);
    if (scDyed > 0.0) tone = mix(tone, mix(mix(scDye(n, x), m.rgb, 0.5 * m.a) * mix(1.15, 0.8, inked), vec3(1.0, 0.97, 0.9), 0.55 * light * sat(1.0 - l / rad)), scDyed);
    if (scHole > 0.0) tone = mix(tone, uKind[3] * (0.9 + 0.5 * b), scDyed * min(1.0, scHole * 3.0));
    col = mix(col, tone * (0.75 + 0.25 * dot(e / rad, vec2(-0.6, 0.8)) * (1.0 - light) + 0.25 * light), bead);
  }
  return scRound(col, sheet, q0, eye);
}

vec3 render(vec2 p) {
  scPx = 1.0 / uRes.y;
  scTurn = fract(0.390 + fract(uTime / (uVar < 0.5 ? 2048.0 : 4096.0)) + fract(uTravel / 2048.0));
  scLean = fract(0.09 + uTime * 0.0004);
  if (uOwn[6] != 0.0) {
    float held = abs(uOwn[6]);
    scTurn = fract(mix(0.390, uOwn[6] > 0.0 ? 0.38197 : 0.0235, held) + (1.0 - held) * (uTime + uTravel) / 2048.0 + held * 0.0009 * sin(uTime * 0.11));
    scLean = fract(0.09 + uTime * (0.0004 + 0.0022 * held));
  }
  scN = 90.0; scHole = 0.0; scMuch = 1.0; scFlat = 1.0;
  if (uOwn[0] != 0.0) { scN = floor(90.0 * exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.15 : 1.6)) + 0.5); scMuch = pow(90.0 / scN, 0.42); }
  if (uOwn[2] > 0.0) scHole = 0.5 * uOwn[2];
  if (uOwn[7] != 0.0 && uVar < 0.5) scMuch *= exp2(uOwn[7] * (uOwn[7] > 0.0 ? 0.95 : 1.3));
  scDyed = min(1.0, abs(uOwn[1]) + abs(uOwn[3]) + abs(uOwn[4]));
  // the nearest simple ratio, and how nearly they have come round to it
  scQ = 1.0; float near = 1.0;
  for (int k = 1; k <= 7; k++) { float e = abs(fract(float(k) * scTurn + 0.5) - 0.5); if (e < near - 1e-5) { near = e; scQ = float(k); } }
  scStrung = (1.0 - smoothstep(0.012, 0.05, near));
  return uVar < 0.5 ? scBeads(p) : scArms(p);
}
