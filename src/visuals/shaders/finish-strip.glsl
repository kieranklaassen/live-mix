// name: Finish strip
// a: Things passing
// b: Once round
// what: A long photograph taken through a slit, time laid out sideways on white paper: a high bicycle with bent spokes, birds, cloth on poles and turning leaves over streaks of ground that never moved. Or the painted skin of a round clay pot unrolled: wading birds, reeds, spirals and hatching between two dark rims.
// follows: Across is the loop: each stroke is a sheaf of streaks, or darker paint. Drones darken and stretch the bicycle or fill the spirals, pads the cloth or reeds, texture the leaves or hatching, phrases the birds. Bands are ground streaks or turned lines. A hit is a needle at the playhead; a cue widens the middle; Tone sharpens, Space pales, keys darken the scale.
float fnPx, fnDx, fnNow, fnHit; // a pixel; how far from the playhead; near it; a hit there
float fnGain;                    // how strongly things answer
// A soft step from a to b, whichever is the larger.
float fnS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float fnEdge(float f) { float w = fwidth(f) * mix(1.5, 0.7, uTone) + 1e-5; return fnS(w, -w, f); }
// The same where cells would show in fwidth.
float fnCell(float f) { float w = min(fwidth(f), 5.0 / uRes.y) * mix(1.5, 0.7, uTone) + 1e-5; return fnS(w, -w, f); }
float fnBell(float x) { return exp(-x * x); }
// A kind's colour as a muted ink.
vec3 fnInk(int k, vec3 own, float dark) {
  vec3 c = uKind[k];
  c = mix(vec3(dot(c, vec3(0.333))), c, 0.7);
  c *= 1.0 / max(max(c.r, max(c.g, c.b)), 0.05);
  return mix(own, c * dark, 0.36);
}
// The piece at a place on the strip; and round it: x its strength, y how long it lasts there.
float fnOne(vec2 c) { return piece(vec2(c.x / 1.78 + 0.5, clamp(0.5 - c.y / 0.78, 0.06, 0.94))).a; }
vec2 fnThere(vec2 c, float span) {
  float m = fnOne(c), l = fnOne(c - vec2(span, 0.0)), r = fnOne(c + vec2(span, 0.0));
  return vec2(sat(max(m, 0.7 * max(l, r)) * 1.3), sat((l + m + r) * 0.45));
}
// A wheel that rolled past the slit, in its radii: the spokes come out bent.
float fnWheel(vec2 q, float n, float turn) {
  float r = length(q), a = r > 1e-4 ? atan(q.y, q.x) : 0.0;
  float m = fnEdge(abs(r - 0.965) - 0.035);
  m = max(m, 0.7 * fnEdge(abs(r - 0.895) - 0.008));
  m = max(m, fnEdge(r - 0.085));
  float f = sin(0.5 * n * (a + q.x - turn)), w = fwidth(f), th = 0.5 * n * 0.0075 / max(r, 0.05);
  float s = fnS(th + w, max(th - w, 0.0) - 1e-4, abs(f));
  s = mix(s, sat(th * 0.8), fnS(0.7, 1.8, w));
  return max(m, 0.85 * s * step(r, 0.95) * step(0.06, r));
}
// A high bicycle: big wheel, little wheel, the bent backbone between.
float fnCycle(vec2 q, float turn) {
  float m = fnWheel(q, 22.0, turn);
  m = max(m, fnWheel((q - vec2(1.2, -0.65)) / 0.35, 12.0, turn * 2.857));
  float r = length(q), a = r > 1e-4 ? atan(q.y, q.x) : 0.0;
  float s = sat((1.72 - a) / 2.22);
  float back = abs(r - (1.12 + 0.245 * s * s)) - 0.036 + 0.018 * s;
  m = max(m, fnEdge(max(back, max(a - 1.575, -0.494 - a))));
  m = max(m, fnEdge(max(abs(q.x + 0.015) - 0.024 - 0.012 * sat(q.y), max(-q.y, q.y - 1.2))));
  float bx = q.x + 0.06, bar = max(abs(q.y - 1.2 + 1.1 * bx * bx) - 0.017 - 0.06 * bx * bx, abs(bx) - 0.26);
  float seat = length((q - vec2(0.27, 1.2 - 0.12 * q.x)) * vec2(1.0, 3.6)) - 0.15;
  return max(m, fnEdge(min(bar, seat)));
}
// A bird flying left, bent by its beat. x near wing and body, y the far wing.
vec2 fnBird(vec2 q, float beat) {
  float bob = 0.07 * sin(beat + q.x * 2.2);
  float y = q.y - bob, s = q.x;
  float t = sat(1.0 - s * s);
  float body = abs(y) - 0.17 * pow(t, 0.62) * (1.0 - 0.6 * s) * (1.0 - 0.12 * fnBell((s + 0.62) / 0.12));
  body = max(body, abs(s) - 1.0);
  float beak = max(abs(y + 0.02) - 0.05 * sat((s + 1.22) / 0.3), max(-1.22 - s, s + 0.8));
  float tf = (s - 0.55) / 0.85;
  float tail = max(abs(abs(y) - 0.11 * tf * tf) - 0.06 * (1.0 - tf), max(-tf, tf - 1.0));
  float H1 = 1.05 + 0.3 * sin(beat), H2 = 0.75 - 0.3 * sin(beat + 0.8);
  float h = sat((y - 0.02) / H1);
  float sc = -0.22 - 0.75 * h * (1.0 - h) + 1.05 * h * h + 0.12 * sin(beat + h * 3.0);
  float near = max(abs(s - sc) - 0.36 * pow(1.0 - h, 0.65), max(-y, y - 0.02 - 0.97 * H1));
  h = sat((0.05 - y) / H2);
  sc = -0.12 - 0.4 * h + 1.15 * h * h;
  float far = max(abs(s - sc) - 0.3 * pow(1.0 - h, 0.7), max(y - 0.05, 0.05 - y - 0.97 * H2));
  return vec2(max(fnEdge(min(min(body, beak), tail)), fnEdge(near)), fnEdge(far));
}
// A leaf that turned over as it went by. x cover, y which face and rib.
vec2 fnLeaf(vec2 q, float ph) {
  float s = q.x, y = q.y - 0.35 * sin(s * 1.6 + ph * 0.7);
  float c = cos(s * 2.3 + ph), w = 0.42 * sat(1.0 - s * s) * (1.0 - 0.25 * s);
  float f = max(abs(y) - w * (0.1 + 0.9 * abs(c)), abs(s) - 1.0);
  float stem = max(abs(y) - 0.022, max(0.9 - s, s - 1.5));
  float rib = fnEdge(abs(y) - 0.014);
  return vec2(max(fnEdge(f), fnEdge(stem)), 0.5 + 0.35 * fnS(-0.3, 0.3, c) - 0.3 * rib);
}
// Cloth on a pole. x cover, y the light on its folds, z its hem.
vec3 fnCloth(vec2 q, float len, float tall, float ph) {
  float t = q.x / len, g = fnS(0.0, 0.62, t), wv = t * 10.0 - ph;
  float lift = 0.36 * tall * g * sin(wv) + 0.14 * tall * g * sin(wv * 1.7 + 1.0);
  float top = lift - 0.05 * t, low = lift - tall * (1.0 - 0.5 * t) * (1.0 - 0.3 * g * sin(wv + 1.5)) - 0.03 * t;
  float v = (q.y - low) / max(top - low, 0.01);
  float end = 1.0 - 0.16 * (1.0 - abs(2.0 * v - 1.0));
  float f = max(max(q.y - top, low - q.y), max(-q.x, (t - end) * len));
  float fold = sin(wv + 0.9 + 1.2 * v) * g;
  return vec3(fnEdge(f) * fnS(-0.2, 0.0, 1.02 - t), fold, fnS(0.1, 0.0, min(v, 1.0 - v)));
}
const vec3 fnLeaves[7] = vec3[7](vec3(0.68, -0.25, 0.05), vec3(-0.72, -0.2, 0.042), vec3(0.77, -0.1, 0.026), vec3(-0.08, 0.31, 0.02), vec3(0.14, 0.1, 0.022), vec3(-0.47, 0.08, 0.026), vec3(0.66, 0.27, 0.018));
vec3 fnPassing(vec2 P) {
  float foot = -0.365;
  float n1 = noise(vec2(P.x * 0.35, P.y * 34.0)), n2 = noise(vec2(P.x * 0.6, P.y * 110.0 + 40.0)), n3 = noise(vec2(P.x * 1.4, P.y * 380.0));
  float gnd = fnS(-0.06, -0.2, P.y);
  vec3 col = mix(vec3(0.905, 0.91, 0.905), vec3(0.83, 0.822, 0.8), gnd);
  col -= 0.06 * fnS(-0.02, 0.42, P.y);
  float str = (n1 - 0.5) * 0.5 + (n2 - 0.5) * 0.35 + (n3 - 0.5) * 0.25;
  col *= 1.0 + str * mix(0.06, 0.26, gnd);
  col *= 1.0 - 0.16 * fnBell((P.y + 0.125 + 0.004 * n1) / 0.012) - 0.1 * fnBell((P.y + 0.155) / 0.004);
  // the bands: streaks of colour, low at the foot
  float at = sat((P.y - foot) / 0.76);
  float st = fnS(0.46, 0.8, noise(vec2(P.x * 0.5 - uTime * 0.01, P.y * 46.0 + 9.0))) + 0.7 * fnS(0.55, 0.85, noise(vec2(P.x * 0.9 + 5.0, P.y * 150.0)));
  vec3 tint = mix(vec3(0.27, 0.37, 0.42), vec3(0.60, 0.33, 0.25), fnS(0.42, 0.62, noise(vec2(P.x * 0.15, P.y * 19.0 + 31.0))));
  col = mix(col, tint, sat(st * band(at) * (0.58 - 0.28 * at)));
  // a stroke of the piece: a sheaf of streaks, a little in its colour
  vec4 m = piece(vec2(P.x / 1.78 + 0.5, clamp(0.5 - P.y / 0.78, 0.04, 0.96)));
  vec3 hue = m.rgb / max(max(m.r, max(m.g, m.b)), 0.05);
  col *= mix(vec3(1.0), 0.48 + 0.2 * hue, sat(m.a * 0.68 * fnGain) * fnS(0.42, 0.72, noise(vec2(P.x * 0.8 + 2.0, P.y * 75.0 + 70.0))));
  vec3 grey = vec3(0.25, 0.265, 0.28), rust = vec3(0.60, 0.27, 0.19), slate = vec3(0.24, 0.36, 0.43);
  float air = mix(0.12, -0.06, 1.0 - uSpace);
  P.y += 0.0011 * (noise(vec2(P.x * 130.0, 3.0)) - 0.5);
  // far poles
  for (int i = 0; i < 4; i++) {
    float f = float(i), x = -0.74 + 0.46 * f + 0.12 * hash11(f + 5.0);
    float d = abs(P.x - x - 0.012 * sin(P.y * 9.0 + f)) - 0.0022 - 0.002 * hash11(f);
    col = mix(col, grey, fnEdge(max(d, max(P.y - 0.1 - 0.1 * hash11(f + 9.0), -0.15 - P.y))) * (0.3 - air));
  }
  // birds: phrases
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    vec3 at3 = i == 0 ? vec3(-0.5, 0.225, 0.09) : i == 1 ? vec3(0.34, 0.255, 0.064) : vec3(0.02, 0.16, 0.042);
    vec2 c = at3.xy;
    vec2 a = fnThere(c, 0.07);
    float k = (i == 0 ? 1.5 : i == 1 ? 0.8 : 1.1) * (1.0 + 0.6 * a.y + 0.2 * uPhrase);
    c.y += 0.008 * sin(uTime * 0.23 + f * 2.0);
    vec2 q = (P - c) / at3.z; q.x /= k;
    vec2 b = fnBird(q, uTime * 0.31 + f * 2.1);
    float on = sat((0.6 + 0.2 * hash11(f + 3.0) + 0.4 * fnGain * (0.6 * a.x + uPhrase) + 0.2 * fnNow) * (i == 2 ? 0.6 : 1.0)) - air;
    vec3 ink = mix(grey, fnInk(3, slate, 0.5), 0.4 + 0.4 * sat(a.x + uPhrase));
    col = mix(col, mix(ink, vec3(0.75), 0.4), b.y * (1.0 - b.x) * on * 0.75);
    col = mix(col, ink * (0.9 + 0.35 * sat(q.y)), b.x * on);
  }
  // cloth on its pole: pads
  for (int i = 0; i < 2; i++) {
    vec2 c = i == 0 ? vec2(0.46, 0.13) : vec2(-0.81, 0.05);
    vec2 a = fnThere(c + vec2(0.12, -0.05), 0.12);
    float len = (i == 0 ? 0.36 : 0.16) * (1.0 + 0.7 * a.y), ta = i == 0 ? 0.13 : 0.08;
    float on = sat(0.62 + 0.4 * fnGain * (0.6 * a.x + uPad) + 0.15 * fnNow) * (i == 0 ? 1.0 : 0.65) - air;
    vec3 ink = fnInk(1, rust, 0.62);
    vec2 d = P - c; d.x -= 0.02 * sin(d.y * 5.0);
    vec3 q = fnCloth(d, len, ta, uTime * 0.35 + float(i));
    col = mix(col, ink * (1.02 + 0.26 * q.y + 0.16 * q.y * q.y * q.y - 0.2 * q.z), q.x * on * 0.9);
    col = mix(col, grey * 0.8, fnEdge(max(abs(d.x - 0.006) - 0.0035, max(d.y - 0.03, foot + 0.02 + 0.12 * float(i) - P.y))) * on);
  }
  // leaves: texture
  for (int i = 0; i < 7; i++) {
    float f = float(i), h1 = hash11(f + 31.0), h2 = hash11(f + 47.0);
    vec3 at3 = fnLeaves[i];
    vec2 c = at3.xy;
    float a = fnOne(vec2(c.x, c.y - 0.1)), S = at3.z * (1.0 + 0.3 * uTexture), k = (0.9 + 0.9 * h2) * (1.0 + 0.6 * a);
    c.y += 0.01 * sin(uTime * 0.19 + f * 1.7);
    vec2 q = (P - c) / S; q.x /= k; q.y += (h1 - 0.5) * 0.7 * q.x;
    vec2 l = fnLeaf(q, uTime * 0.27 + f * 2.4);
    float on = sat((i < 3 ? 0.62 : 0.12) + 0.8 * fnGain * (0.3 * a + uTexture) + 0.2 * fnNow) - 0.5 * air;
    vec3 ink = fnInk(2, i % 2 == 0 ? rust : grey, 0.6);
    col = mix(col, ink * (0.5 + l.y), l.x * sat(on) * 0.92);
  }
  // the high wheel: drones
  {
    vec2 c = vec2(-0.24, -0.145);
    vec2 a = fnThere(vec2(c.x, -0.25), 0.16);
    float R = 0.185, k = 1.55 * (1.0 + 0.22 * a.y + 0.08 * uDrone);
    vec2 q = (P - c) / R; q.x /= k; q.x += 0.1 * sin(q.x * 2.1 + 0.7);
    float sh = fnBell((P.y - c.y + R + 0.012) / 0.014) * (fnBell(q.x / 0.75) + 0.6 * fnBell((q.x - 1.2) / 0.4));
    float on = sat(0.74 + 0.4 * fnGain * (0.5 * a.x + 0.8 * uDrone)) - air;
    col *= 1.0 - 0.42 * sh * on;
    vec3 ink = mix(grey * 0.75, fnInk(0, slate, 0.4), 0.55);
    float r = length(q), lit = fnBell((r - 0.972) / 0.012) * sat(q.y * 0.8 + 0.5);
    col = mix(col, ink * (1.0 + 0.25 * q.y) + 0.2 * lit * step(r, 1.0), fnCycle(q, uTime * 0.12) * on);
  }
  // a hit: a needle where the slit is; a cue: the middle exposed longer
  float nd = abs(fnDx) - 0.011 * sat(1.0 - pow(abs(P.y - 0.02) / 0.34, 1.6)) * (0.5 + 0.5 * uHits);
  col = mix(col, fnInk(4, rust, 0.6), fnEdge(nd) * step(abs(P.y - 0.02), 0.34) * fnHit);
  col = mix(col, rust, 0.16 * fnHit * fnBell(fnDx / 0.05));
  col *= 1.0 + 0.04 * (n2 + n3 - 1.0) + 0.04 * (noise(vec2(P.x * 260.0, 1.0)) - 0.5);
  return col * (1.0 - 0.16 * uCue * fnBell(P.x / 0.32));
}
// A painted wading bird, its feet at y = -0.5. x paint, y scratched lines.
vec2 fnWader(vec2 q, float low) {
  vec2 b = rot(0.3) * (q - vec2(0.03, 0.02));
  float e = length(b / vec2(0.2 + 0.03 * b.x, 0.105 - 0.16 * max(b.x, 0.0)));
  float body = (e - 1.0) * 0.1;
  float tl = (b.x - 0.1) / 0.28;
  body = smin(body, max(abs(b.y - 0.02 + 0.06 * tl) - 0.055 * (1.0 - tl), max(-tl, tl - 1.0) * 0.28), 0.03);
  // neck and head, held high or let down
  vec2 a0 = vec2(-0.13, 0.08), a1 = mix(vec2(-0.34, 0.2), vec2(-0.40, 0.3), low), a2 = mix(vec2(-0.06, 0.3), vec2(-0.33, 0.05), low), a3 = mix(vec2(-0.17, 0.44), vec2(-0.31, -0.2), low);
  float neck = 1.0;
  vec2 last = a0;
  for (int i = 1; i <= 9; i++) {
    float t = float(i) / 9.0, u = 1.0 - t;
    vec2 c = u * u * u * a0 + 3.0 * u * u * t * a1 + 3.0 * u * t * t * a2 + t * t * t * a3, d = c - last, v = q - last;
    neck = min(neck, length(v - d * sat(dot(v, d) / dot(d, d))) - mix(0.034, 0.017, t));
    last = c;
  }
  vec2 h = q - a3; h = rot(mix(0.1, 1.15, low)) * h;
  float head = length((h + vec2(0.015, 0.0)) * vec2(0.8, 1.0)) - 0.03;
  float bt = -h.x / 0.19;
  head = min(head, max(abs(h.y + 0.02 * bt) - 0.017 * (1.0 - bt), max(-bt, bt - 1.0) * 0.19));
  float f = smin(min(body, smin(neck, body, 0.04)), head, 0.02);
  // legs with the knee bent back
  float y = q.y, k1 = 0.04 * fnBell((y + 0.26) / 0.1), k2 = 0.05 * fnBell((y + 0.24) / 0.1);
  float leg = min(abs(q.x - 0.02 - k1 + 0.1 * (y + 0.1)) - 0.011, abs(q.x - 0.08 - k2 - 0.2 * (y + 0.1)) - 0.011);
  leg = max(leg, max(-0.5 - y, y + 0.02));
  float toe = max(abs(y + 0.494) - 0.006, abs(q.x) - 0.09);
  float cut = fnCell(abs(sin(b.y * 62.0 + 9.0 * b.x * b.x)) - 0.22) * fnS(0.75, 0.6, e) * fnS(-0.1, 0.0, b.x);
  cut = max(cut, fnCell(length(h + vec2(0.012, -0.004)) - 0.008));
  return vec2(fnCell(min(f, min(leg, toe))), cut);
}
// Reeds between the birds. x stems and blades, y heads.
vec2 fnReed(vec2 q, float sway) {
  float m = 1.0, hd = 1.0;
  for (int i = 0; i < 3; i++) {
    float f = float(i) - 1.0, y = q.y + 0.5, tall = 0.86 - 0.16 * abs(f) + 0.06 * f;
    float g = f * 0.02 + (f * 0.16 + sway) * y * y, bg = f * (0.03 + 0.5 * y * (1.0 - 0.5 * y)) + 0.03 + sway * y;
    m = min(m, max(min(abs(q.x - g) - 0.009, 0.9 * abs(q.x - bg) - 0.02 + 0.04 * y), max(-y, y - tall)));
    hd = min(hd, length(vec2(q.x - g, (y - tall) * 0.36)) - 0.026);
  }
  return vec2(fnCell(m), fnCell(hd));
}
// Spirals joined in a row. x the line, y the ground between.
vec2 fnCurl(vec2 q, float turn, float fat) {
  vec2 c = vec2(fract(q.x) - 0.5, q.y);
  float r = length(c), a = r > 1e-4 ? atan(c.y, c.x) : 0.0, gap = 0.155;
  float s = sin(0.5 * (a - turn) - PI * r / gap);
  float w = fwidth(r) * PI / gap * 1.2 + 1e-4;
  float m = fnS(fat + w, fat - w, abs(s)) * fnS(0.43 + fwidth(r), 0.43, r);
  m = max(m, fnEdge(r - 0.06));
  // the line from the foot of one to the top of the next
  float x = fract(q.x + 0.5) - 0.5, g = 0.43 * sin(0.5 * PI * sin(PI * x)), sl = 2.1 * cos(PI * x) * cos(0.5 * PI * sin(PI * x));
  float ln = abs(q.y - g) / sqrt(1.0 + sl * sl) - (0.02 + 0.05 * fat) * sqrt(sat(1.0 - 16.0 * x * x * x * x));
  m = max(m, fnEdge(ln) * step(abs(x), 0.49));
  return vec2(m, fnS(0.47 - fwidth(r), 0.47, r) * (1.0 - m));
}
vec3 fnPot(vec2 P) {
  vec3 slip = vec3(0.885, 0.805, 0.685);
  vec2 Q = P + 0.0035 * (vec2(noise(P * 13.0), noise(P * 13.0 + 40.0)) - 0.5);
  Q.y += 0.0035 * sin(3.53 * P.x + 1.0) + 0.002 * sin(10.6 * P.x + uTime * 0.05);
  float y = Q.y;
  // the slip: turned on the wheel, fired in an open fire
  float turnm = noise(vec2(P.x * 1.6, P.y * 120.0)), cloud = fbm(P * vec2(1.6, 2.6) + 4.0), fine = noise(P * 170.0);
  vec3 col = slip * (1.0 + 0.07 * (turnm - 0.5) + 0.05 * (fine - 0.5));
  col = mix(col, vec3(0.74, 0.6, 0.48), 0.6 * fnS(0.52, 0.8, cloud));
  col = mix(col, vec3(0.94, 0.9, 0.82), 0.5 * fnS(0.46, 0.2, cloud));
  float brush = 0.8 + 0.2 * noise(vec2(P.x * 26.0, P.y * 90.0));
  float worn = fnS(0.26, 0.4, 0.45 * noise(P * 19.0 + 7.0) + 0.3 * noise(P * 70.0) + 0.25 * fine);
  float a = fnOne(vec2(P.x, 0.0));
  float ink = brush * mix(0.45 + 0.55 * worn, 1.0, 0.5 * a);
  vec3 black = vec3(0.19, 0.145, 0.125), red = vec3(0.60, 0.25, 0.16), blue = vec3(0.30, 0.38, 0.42);
  col = mix(col, black, max(fnEdge(0.362 - y), fnEdge(y + 0.375)) * ink * 0.92);
  // texture: a row of hatched triangles under the rim
  float tx = Q.x / 1.78 * 24.0, tri = abs(fract(tx) - 0.5) * 2.0, ty = (y - 0.292) / 0.052;
  float tr = max(tri - ty, max(-ty, ty - 1.0));
  float hat = fnEdge(abs(sin((tx * 2.0 + ty) * 9.0)) - 0.35 - 0.6 * uTexture);
  float tin = fnEdge(tr), ted = fnEdge(abs(tr) - 0.06) * step(-0.1, ty) * step(ty, 1.1);
  col = mix(col, fnInk(2, red, 0.6), max(tin * hat * (0.55 + 0.4 * sat(fnGain * uTexture)), ted * 0.8) * ink);
  // the bands: lines turned on the wheel, as thick as they sound
  for (int i = 0; i < 8; i++) {
    float f = float(i), h = i < 3 ? -0.222 + 0.017 * f : i < 5 ? -0.345 + 0.012 * (f - 3.0) : 0.262 + 0.013 * (f - 5.0);
    float b = max(uBands[i * 2], uBands[i * 2 + 1]);
    col = mix(col, i == 1 ? red : black, fnEdge(abs(y - h) - 0.0016 - 0.0034 * b) * ink * (0.75 + 0.25 * b));
  }
  // drone: spirals joined in a row, turning very slowly
  {
    vec2 q = vec2(Q.x / 1.78 * 11.0, (y + 0.283) / 0.1);
    float on = step(abs(q.y), 0.52), dr = sat(fnGain * 1.3 * uDrone + 0.4 * fnGain * fnOne(vec2(P.x, -0.25)));
    vec2 c = fnCurl(q, uTime * 0.09, 0.4 + 0.3 * dr) * on;
    col = mix(col, fnInk(0, red, 0.5), c.y * ink * 0.85 * dr);
    col = mix(col, fnInk(0, black, 0.42), c.x * ink * (0.7 + 0.3 * dr));
  }
  // phrases are the birds, pads the reeds
  {
    float tn = Q.x / 0.445, id = floor(tn + 0.5), rid = floor(tn);
    vec2 c = vec2(id * 0.445, 0.03), q = (vec2(Q.x, y) - c) / 0.41;
    float there = fnThere(vec2(c.x, 0.14), 0.09).x;
    float low = abs(mod(id, 4.0) - 1.0) < 0.5 ? 1.0 : 0.0;
    vec2 w = fnWader(q, low);
    vec3 bi = mix(black, fnInk(3, red, 0.55), 0.15 + 0.45 * low);
    col = mix(col, bi, w.x * ink * (1.0 - w.y) * sat(0.72 + 0.3 * fnGain * (there + uPhrase)));
    c.x = (rid + 0.5) * 0.445;
    q = (vec2(Q.x, y) - c) / 0.41;
    there = fnThere(c, 0.09).x;
    vec2 r = fnReed(q, 0.06 * sin(uTime * 0.21 + rid * 1.3));
    col = mix(col, fnInk(1, blue, 0.5), r.x * ink * sat(0.6 + 0.4 * fnGain * (there + uPad)));
    col = mix(col, fnInk(1, red, 0.7), r.y * ink * sat(0.5 + 0.5 * fnGain * (there + uPad)));
  }
  // a window slid round the glaze into long streaks
  float sh = fnBell((y - 0.2) / 0.035) * 0.16 + fnBell((y - 0.232) / 0.006) * 0.12 + fnBell((y + 0.12) / 0.06) * 0.05;
  col += sh * (0.6 + 0.8 * uSpace) * (0.6 + 0.5 * noise(vec2(P.x * 2.2 - uTime * 0.02, P.y * 60.0))) * vec3(1.0, 0.98, 0.94);
  col *= 1.0 - 0.28 * fnS(0.3, 0.42, abs(y)) - 0.1 * fnS(0.1, 0.4, -y);
  // two old breaks
  for (int i = 0; i < 2; i++) {
    float f = float(i), g = 0.85 * f - 0.38 + 0.09 * noise(vec2(P.y * 7.0, f + 3.0)) + 0.03 * noise(vec2(P.y * 31.0, f)) + 0.12 * P.y * (1.0 - 2.0 * f);
    col *= 1.0 - 0.5 * fnEdge(abs(P.x - g) - 0.0012);
  }
  col = mix(col, vec3(1.0, 0.97, 0.92), 0.85 * fnHit * fnS(0.011, 0.002, abs(fnDx) / max(0.15, 1.0 - y * y * 5.0)));
  return col * (1.0 + vec3(0.14, 0.1, 0.04) * fnHit * fnBell(fnDx / 0.06)) * (1.0 + 0.14 * uCue * fnBell(P.x / 0.35));
}
vec3 render(vec2 p) {
  float wide = clamp(uRes.x / uRes.y, 0.9, 2.4), c = 4.0 * uCue * (1.0 - uCue);
  fnPx = 1.0 / uRes.y;
  vec2 P = vec2(p.x / wide * 1.78, p.y);
  P.x += 0.022 * sin(P.x * 2.6 + uTime * 0.13) + 0.012 * sin(P.x * 6.1 - uTime * 0.17);
  P.x *= 1.0 - 0.16 * c * fnBell(P.x / 0.5);
  fnDx = P.x - (uLoop - 0.5) * 1.78;
  float ends = fnS(0.0, 0.04, uLoop) * fnS(1.0, 0.96, uLoop);
  fnNow = fnBell(fnDx / 0.1) * ends;
  fnHit = sat(uHits * 1.4) * (0.3 + 0.7 * fnS(0.0, 0.01, uLoop) * fnS(1.0, 0.99, uLoop));
  fnGain = 0.7 + 0.6 * uEnergy;
  // the strip on its paper, above a time scale
  float y = p.y + uVar * (0.004 * sin(TAU * P.x / 1.78) + 0.003 * (noise(vec2(P.x * 9.0, 2.0)) - 0.5));
  float top = mix(0.395, 0.4, uVar), foot = mix(-0.365, -0.4, uVar);
  vec3 col = uVar < 0.5 ? fnPassing(P) : fnPot(P);
  col *= 1.0 - 0.13 * ends * fnS(1.5, 0.3, abs(fnDx) * uRes.y);
  vec3 paper = vec3(0.952, 0.946, 0.928) * (1.0 + 0.02 * (noise(vec2(P.x * 30.0, p.y * 40.0)) - 0.5));
  paper *= 1.0 - 0.2 * uVar * exp(min(p.y - foot, 0.0) / 0.02) * step(p.y, 0.0);
  float tk = P.x / 1.78 * 64.0, near = abs(fract(tk + 0.5) - 0.5) * 1.78 / 64.0, down = foot - mix(0.014, 0.03, uVar) - p.y;
  float len = mod(floor(tk + 0.5), 8.0) < 0.5 ? 0.024 : 0.012;
  paper *= 1.0 - (0.35 + 0.5 * max(uKeys, uMic) * fnNow) * fnS(0.0012 + fnPx, 0.0004, near) * fnS(len + fnPx, len, down) * fnS(-fnPx, 0.0, down);
  return mix(paper, col, fnS(fnPx, -fnPx, max(y - top, foot - y)));
}
