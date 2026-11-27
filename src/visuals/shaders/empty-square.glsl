// name: Empty square
// a: Paved plain
// b: Wide steps
// what: A sunlit square of pale stone seen from a high window, with nothing standing in it, and across it the long blue shadows of things that are not there: an arch, a tall vase, a ladder, a flag, a ball on a rod; or a wide flight of shallow steps that the same shadows climb in zigzags.
// follows: Each kind of sound is one shadow that darkens and grows as it plays: drone the arch, pad and voice the vase, texture the flag, phrase the ladder, whose rungs thicken with the piece; a hit shows the ball and bounces it. The loop is the sun and swings them all. The spectrum is sixteen railings, keys are birds, travel moves thin cloud, a cue one big cloud.
// own: 0 1 each thing stands in a long row, -1 each is great; 1 what throws them: 1 growing things (a tree, reeds, a leaf, bamboo, a seed head), -1 a wheel, a bell, a kite, a screw and a hoop; 2 the sun: 1 low with long shadows, -1 high; 3 the ground: 1 rolling sand or snow with no joints, -1 laid in checks in the colour of the hits; 4 1 a moonlit night, -1 the things are of coloured glass; 5 the eye: 1 from straight above, -1 low under a great sky; 6 1 wet with puddles, -1 old, cracked and mossy; 7 1 wide soft edges, -1 drawn in pen strokes
vec2 esD;      // which way the shadows fall over the ground
float esT;     // how steeply the sun stands
float esPen;   // how soft a shadow gets with distance
vec2 esPx;     // how much ground one pixel covers, aside and away
float esCloud; // how much thin cloud lies before the sun here
float esDark;  // all the shadow here, 0 to 1
vec4 esTint;   // the colours of that shadow, summed, and their weight
vec2 esAt;     // the place in the picture
float esP(float x) { return max(x, 0.0); }
// Where the ground is sand: how high it lies.
float esLie(vec2 g) { return 0.085 * sin(g.x * 2.3 + 0.9 * sin(g.y * 1.4)) * sin(g.y * 2.1 + 0.5 + 0.4 * g.x) + 0.03 * sin(g.x * 5.1 - g.y * 3.7 + sin(g.y * 2.0)); }
// A row of squares, 1 and -1 in turn, w one pixel of it.
float esRow(float x, float w) { return clamp((abs(fract(x * 0.5) - 0.5) - 0.25) / max(w * 0.5, 1e-4), -1.0, 1.0) * sat(1.6 - 1.2 * w); }

// Where the ray back to the sun from P goes through the upright plane of an absent thing: aside, up, and how far off it is.
vec3 esBack(vec3 P, vec3 at, vec2 e) {
  vec2 g = P.xz - at.xz;
  float det = e.x * esD.y - e.y * esD.x;
  float u = (g.x * esD.y - g.y * esD.x) / det, a = (e.x * g.y - e.y * g.x) / det;
  return vec3(u, P.y - at.y + a * esT, a);
}
void esLay(float d, float a, float strength, vec3 tint) {
  float w = esPen * max(a, 0.0) + 0.5 * (esPx.x + esPx.y * esT);
  float c = (1.0 - smoothstep(-w, w, d)) * smoothstep(-0.02, 0.02, a) * strength;
  esTint += vec4(tint, 1.0) * c;
  esDark = 1.0 - (1.0 - esDark) * (1.0 - c);
}
float esBox(vec2 q, vec2 b) { q = abs(q) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
// ---- the five things that are not there, each one high
float esHole(vec2 q) { q.y -= 0.56; return q.y > 0.0 ? length(q) - 0.25 : abs(q.x) - 0.25; }
float esArch(vec2 q) {
  float d = max(esBox(q - vec2(0.06, 0.3), vec2(0.5, 0.665)), -max(esHole(q), esHole(q - vec2(0.12, 0.0))));
  return min(d, esBox(q - vec2(0.06, 0.93), vec2(0.56, 0.035)));
}
float esVase(vec2 q, float full) {
  float h = sat(q.y);
  float r = 0.085 + (0.19 + 0.07 * full) * smoothstep(0.02, 0.42, h) * (1.0 - smoothstep(0.4, 0.82, h));
  r += 0.035 * (1.0 - smoothstep(0.0, 0.07, h)) + 0.05 * smoothstep(0.9, 1.0, h) * h;
  float d = max((abs(q.x) - r) * 0.85, abs(q.y - 0.5) - 0.5);
  return min(d, abs(length((q - vec2(0.19, 0.74)) * vec2(1.0, 0.8)) - 0.1) - 0.02);
}
float esFlag(vec2 q, float stir) {
  bool st = uVar > 0.5; // on the flat ground a shadow is drawn out, so the cloth there is longer and narrower
  float d = esBox(q - vec2(0.0, 0.5), vec2(st ? 0.011 : 0.016, 0.5)), l = st ? 0.9 : 1.2;
  d = min(d, length(q - vec2(0.0, 1.02)) - 0.035);
  float x = q.x / l;
  float wave = (0.02 + 0.05 * stir) * sin(x * 5.5 - uTime * 0.9) * sat(x) * (st ? 1.0 : 0.6) - 0.05 * x * x;
  float h = abs(q.y - (st ? 0.8 : 0.85) - wave), y = h - (st ? 0.2 - 0.06 * sat(x) : 0.115 - 0.03 * sat(x));
  return min(d, max(y, max(-q.x, q.x - l + 0.25 * max(0.0, 1.0 - h * (st ? 6.0 : 11.0)))));
}
float esLadder(vec2 q, float grow) {
  float wide = 0.15 - 0.055 * q.y, d = abs(abs(q.x) - wide) - 0.014;
  float k = clamp(floor(q.y * 10.0), 0.0, 9.0);
  float lv = piece(vec2(uLoop, 0.05 + 0.1 * k)).a;
  float rung = max(abs(q.y - (k + 0.5) * 0.1) - 0.006 - 0.016 * lv * grow, abs(q.x) - wide);
  return max(min(d, rung), abs(q.y - 0.5) - 0.5);
}
float esBall(vec2 q, float up) {
  return min(esBox(q - vec2(0.0, 0.2), vec2(0.011, 0.2)), length(q - vec2(0.0, 0.62 + up)) - 0.27);
}
// A bird going up its y, wings out, seen from under.
float esBird(vec2 q, float spread) {
  q.x = abs(q.x);
  float x = q.x / spread, wing = max(abs(q.y - 0.5 * x + 3.2 * x * x) - 0.036 * sat(1.0 - x * 4.0), x - 0.25);
  return min(wing, length(q * vec2(3.2, 1.0) + vec2(0.0, 0.02)) - 0.075);
}
// ---- five things that grow
float esGrown(vec2 q, int k, float lv) {
  float sway = 0.02 * sin(uTime * 0.6 + q.y * 3.0) * q.y;
  if (k == 0) {
    vec2 t = q - vec2(0.05 * sin(q.y * 4.0), 0.0), c = q - vec2(0.02, 0.74);
    float d = max(abs(t.x) - 0.055 + 0.03 * q.y, q.y - 0.9);
    vec2 b = vec2(abs(t.x) - 0.5 * esP(t.y - 0.36), t.y - 0.62);
    d = min(d, max(abs(b.x) * 0.9 - 0.018, abs(b.y) - 0.26));
    float leaf = length(c * vec2(0.85, 1.1)) - 0.34 + 0.3 * (noise(q * 7.0 + 3.0) - 0.4) + 0.2 * (noise(q * 17.0 + vec2(uTime * 0.05, 0.0)) - 0.5);
    return min(d, max(leaf, 0.2 * (0.36 - noise(q * 21.0 + 9.0))) * 0.55);
  }
  if (k == 1) {
    float c = clamp(floor(q.x / 0.1 + 0.5), -3.0, 3.0), d = 1.0;
    for (int i = -1; i < 2; i++) {
      float n = clamp(c + float(i), -3.0, 3.0), top = 0.72 + 0.28 * hash11(n + 5.0), x = q.x - n * 0.075 - n * 0.09 * q.y * q.y - sway * (1.0 + n * 0.3);
      d = min(d, max(abs(x) - 0.009, q.y - top));
      d = min(d, length(vec2(x, (q.y - top + 0.12) * 0.28)) - 0.027 - 0.01 * lv);
      d = min(d, max(abs(x - 0.12 * n / 3.0 * q.y - 0.05 * sin(q.y * 4.0)) - 0.014 * (1.0 - q.y), q.y - 0.75));
    }
    return d * 0.9;
  }
  if (k == 2) {
    vec2 v = rot(0.85) * (q - vec2(0.1 + sway, 0.2));
    v.y += 0.35 * v.x * v.x - 0.1;
    float d = length(v * vec2(1.0, 2.3 + 0.8 * v.x) - vec2(0.5, 0.0)) - 0.5;
    d = max(d * 0.45, 0.022 - abs(fract(v.x * 9.0 - abs(v.y) * 5.0) - 0.5) * 0.1 * smoothstep(0.02, 0.09, abs(v.y)) - 0.02 * step(abs(v.y), 0.02));
    return min(d, max(abs(q.x - 0.1 * q.y) - 0.014, q.y - 0.5));
  }
  if (k == 3) {
    float at = floor(q.y * 8.0), node = 0.008 * exp(-900.0 * pow(q.y - (clamp(at, 1.0, 7.0) + 0.5) * 0.125, 2.0));
    float d = max(min(abs(q.x - 0.07 - sway) - 0.017 - node, abs(q.x + 0.09 + sway * 0.6) - 0.012 - node), q.y - 1.0);
    for (int i = -1; i < 2; i++) { // a leaf reaches over its own joint into the next
      float n = clamp(at + float(i), 1.0, 7.0), side = mod(n, 2.0) * 2.0 - 1.0, l = piece(vec2(uLoop, 0.05 + 0.12 * n)).a;
      vec2 f = rot(-side * 0.5) * (q - vec2(0.07 + sway - 0.16 * step(side, 0.0), (n + 0.5) * 0.125)) * vec2(side, 1.0);
      f.x -= 0.15;
      d = min(d, (abs(f.x) + 1.0 * abs(f.y) * (6.0 - 2.5 * sat(l)) - 0.17) * 0.2);
      f = rot(side * 0.8) * (q - vec2(0.07 + sway - 0.16 * step(0.0, side), (n + 0.35) * 0.125)) * vec2(-side, 1.0);
      f.x -= 0.13;
      d = min(d, (abs(f.x) + abs(f.y) * 7.0 - 0.15) * 0.16);
    }
    return d;
  }
  vec2 c = q - vec2(sway, 0.7 + 0.6 * uHits * (1.0 - uHits));
  float a = atan(c.y, c.x + 1e-5) + 0.2, R = length(c), s = TAU / 24.0, w = (fract(a / s) - 0.5) * s * R;
  float d = min(max(abs(w) - 0.009, R - 0.27), length(vec2(w, R - 0.27)) - 0.032);
  d = min(min(d, length(vec2(w * 1.3, R - 0.19)) - 0.024), R - 0.11);
  return min(d, max(abs(q.x - sway * 0.5) - 0.01, abs(q.y - 0.33) - 0.33));
}
// ---- five things that turn, ring or fly
float esTurned(vec2 q, int k, float lv) {
  if (k == 0) {
    vec2 c = q - vec2(0.0, 0.5);
    float R = length(c), s = TAU / 12.0, w = (fract(atan(c.y, c.x + 1e-5) / s + uTime * 0.02) - 0.5) * s * R;
    float d = min(abs(R - 0.46) - 0.026, max(abs(w) - 0.013, R - 0.46));
    return min(min(d, abs(R - 0.24) - 0.012), R - 0.07);
  }
  if (k == 1) {
    float y = q.y - 0.32, e = esP(0.62 - y), rr = 0.07 + 0.13 * smoothstep(0.62, 0.45, y) + 0.2 * exp(-y * 6.0) * (1.0 + 0.2 * lv);
    float d = max((abs(q.x) - rr) * 0.75, abs(y - 0.28) - 0.28);
    d = min(d, length(q - vec2(0.06 * sin(uTime * 0.9) * (0.3 + lv), 0.3)) - 0.06);
    return min(d, min(abs(length(q - vec2(0.0, 0.95)) - 0.06) - 0.018, 1.0 + e));
  }
  if (k == 2) {
    vec2 c = q - vec2(0.45, 0.82 + 0.03 * sin(uTime * 0.5)), v = rot(0.5 + 0.08 * sin(uTime * 0.4)) * c;
    float d = (abs(v.x) * 1.25 + abs(v.y + 0.04) * (v.y > -0.04 ? 1.3 : 0.75) - 0.27) * 0.7;
    float u = sat((v.y + 0.35) / -0.62), tail = v.x - 0.06 * sin(v.y * 13.0 + uTime * 0.9) * u;
    d = min(d, max(max(abs(tail) - 0.008 - 0.03 * step(fract(v.y * 7.0), 0.3), v.y + 0.3), -v.y - 1.0));
    return min(d, max(abs(q.x - 0.55 * q.y) * 0.86 - 0.006, abs(q.y - 0.4) - 0.4));
  }
  if (k == 3) {
    float n = clamp(floor(q.y * 10.0), 0.0, 9.0), l = piece(vec2(uLoop, 0.05 + 0.1 * n)).a, a = q.y * 22.0;
    float d = min(abs(q.x) - 0.018, (abs(q.x - 0.17 * sin(a)) - 0.016 - 0.02 * sat(l)) * 0.4);
    d = min(d, (abs(q.x + 0.17 * sin(a)) - 0.012) * 0.4);
    return max(d, abs(q.y - 0.5) - 0.5);
  }
  vec2 c = q - vec2(0.0, 0.62 + 1.2 * uHits * (1.0 - uHits));
  return min(min(abs(length(c) - 0.25) - 0.035, length(c) - 0.15), esBox(q - vec2(0.0, 0.18), vec2(0.011, 0.18)));
}
void esOne(vec3 P, vec4 at, vec2 e, int k, float lv, float rest) {
  if (k == 4) {   // where the eye is elsewhere, what a hit shows stands where it is seen
    at.w *= 1.0 + 0.6 * max(abs(uOwn[1]), abs(uOwn[5]));
    if (uVar < 0.5) at.xz += uOwn[5] < 0.0 ? -uOwn[5] * vec2(-0.3, 0.5) : uOwn[5] * vec2(-0.25, 0.1);
  }
  float size = at.w * (0.8 + 0.2 * lv) * (1.0 + esP(-uOwn[0]) * (k == 0 ? 0.9 : 0.6) - (k == 0 ? 0.15 : 0.35) * esP(uOwn[0])), stands = 1.0;
  vec3 r = esBack(P, at.xyz, e);
  vec2 q = r.xy / size;
  if (uOwn[0] > 0.0) {
    float mid = k == 0 ? 0.06 - 0.06 * abs(uOwn[1]) : 0.0, per = k == 0 ? 0.99 + 0.03 * abs(uOwn[1]) : k == 2 ? 2.2 : 1.6, most = k == 0 ? 8.0 : 3.0, c = clamp(floor((q.x - mid) / per + 0.5), -most, most);
    q.x -= c * per;
    stands = sat(uOwn[0] * most - abs(c) + 1.0);
  }
  if (abs(q.x) > 1.3 || q.y > 1.7) return;
  float d = k == 0 ? esArch(q) : k == 1 ? esVase(q, lv) : k == 2 ? esFlag(q, lv) : k == 3 ? esLadder(q, lv) : esBall(q, 1.2 * uHits * (1.0 - uHits));
  if (uOwn[1] != 0.0) d = mix(d, uOwn[1] > 0.0 ? esGrown(q, k, lv) : esTurned(q, k, lv), abs(uOwn[1]));
  float pen = esPen;
  esPen *= 1.3 - 0.6 * lv;
  esLay(d * size, r.z, mix(rest, 0.97, sat(lv * (0.9 + 0.8 * uEnergy))) * stands, uKind[k]);
  esPen = pen;
}
// ---- everything that throws a shadow on P
void esShadows(vec3 P) {
  bool st = uVar > 0.5;
  esDark = 0.0; esTint = vec4(0.0);
  float pad = sat(uPad + 0.6 * uMic);
  if (!st) {
    esOne(P, vec4(-1.02, 0.0, 1.27, 0.46), vec2(0.5, 0.86), 0, uDrone, 0.6);
    esOne(P, vec4(0.04, 0.0, 1.06, 0.3), vec2(0.5, 0.86), 1, pad, 0.0);
    esOne(P, vec4(-0.05, 0.0, 1.4, 0.43), vec2(0.3, 0.95), 2, uTexture, 0.0);
    esOne(P, vec4(-0.85, 0.0, 0.84, 0.32), vec2(0.5, 0.86), 3, uPhrase, 0.4);
    esOne(P, vec4(0.02, 0.0, 0.81, 0.215), vec2(0.5, 0.86), 4, uHits, 0.0);
  } else {
    vec2 e = vec2(-0.57, 0.82);
    esOne(P, vec4(-0.41, 0.29, 1.06, 0.4), e, 0, uDrone, 0.6);
    esOne(P, vec4(0.2, 0.22, 0.8, 0.26), e, 1, pad, 0.0);
    esOne(P, vec4(0.55, 0.33, 1.12, 0.4), e, 2, uTexture, 0.0);
    esOne(P, vec4(-0.3, 0.22, 0.8, 0.34), e, 3, uPhrase, 0.4);
    esOne(P, vec4(0.56, 0.23, 0.78, 0.46), e, 4, uHits, 0.0);
  }
  // sixteen railings along the edge
  float gap = st ? 0.09 : 0.27;
  vec3 r = esBack(P, st ? vec3(-0.55, 0.19, 0.77) : vec3(-2.3, 0.0, 1.8), st ? vec2(0.985, -0.172) : vec2(1.0, 0.0));
  float u = r.x / gap, k = floor(u);
  if (k > -1.0 && k < 16.0) {
    float d = abs(u - k - 0.5) * gap - gap * 0.07;
    d = max(d, r.y - gap * (0.35 + 1.4 * uBands[int(k)]));
    float bar = min(d, abs(r.y - gap * 0.22) - gap * 0.03);
    if (uOwn[1] != 0.0) {   // blades of grass, or posts with a ball on each
      float top = gap * (0.35 + 1.4 * uBands[int(k)]), x = (u - k - 0.5) * gap;
      float blade = max(abs(x - 0.25 * gap * sin(k * 2.4) * r.y / top) - gap * 0.13 * sat(1.0 - r.y / (top * 1.6)), r.y - top * 1.6) * 0.8;
      float post = min(d, length(vec2(x, r.y - top)) - gap * 0.2);
      bar = mix(bar, uOwn[1] > 0.0 ? blade : post, abs(uOwn[1]));
    }
    esLay(bar, r.z, 0.62, vec3(0.4));
  }
  // the keys are birds going over
  vec2 from = st ? vec2(-1.1, 1.35) : vec2(-1.7, 1.35), by = st ? vec2(2.8, -0.45) : vec2(3.3, -0.65), n = by / length(by);
  for (int i = 0; i < 3; i++) {
    float f = float(i), go = fract(uTime * 0.023 + f * 0.07);
    vec2 g = (P.xz - from - by * go - vec2(0.0, 0.16 * f - 0.1 * f * f)) / (st ? 0.6 : 0.55);
    float d = esBird(vec2(g.x * n.y - g.y * n.x, dot(g, n)), 0.8 + 0.2 * sin(uTime * 2.0 + f * 2.0));
    esLay(d, 0.6, 0.85 * sat(uKeys * 1.3) * smoothstep(0.0, 0.08, go) * (1.0 - smoothstep(0.92, 1.0, go)), uKind[3]);
  }
}
// One surface in the sun and in the shadow.
vec3 esPaint(vec3 stone, float sunny) {
  float sun = 1.0 - esDark * (1.0 - 0.45 * esCloud);
  vec3 tint = esTint.w > 0.001 ? esTint.rgb / esTint.w : vec3(0.4);
  tint /= max(dot(tint, vec3(0.333)), 0.05);
  vec3 shade = stone * vec3(0.35, 0.355, 0.60) * (1.12 - 0.24 * uTone) * mix(vec3(1.0), tint, 0.22);
  vec3 lit = stone * mix(vec3(1.0), vec3(0.72, 0.75, 0.86), esCloud * 0.8) * sunny;
  if (uOwn[4] < 0.0) {
    vec3 glass = esTint.w > 0.001 ? esTint.rgb / esTint.w : vec3(0.4);
    shade = mix(shade, mix(stone, vec3(0.6, 0.56, 0.5), 0.35) * (0.14 + 1.15 * glass * (0.55 + 0.45 * glass)), -uOwn[4]);
  }
  if (uOwn[4] > 0.0) {
    shade = mix(shade, stone * vec3(0.075, 0.095, 0.15) * mix(vec3(1.0), tint, 0.4), uOwn[4]);
    lit = mix(lit, lit * vec3(0.34, 0.43, 0.58), uOwn[4]);
  }
  if (uOwn[7] < 0.0) {
    // strokes of a pen, crossed where it is darkest
    float dark = 1.0 - sun, wob = noise(esAt * 9.0) * 1.3;
    vec2 g = vec2(esAt.x + 0.8 * esAt.y, esAt.x - 1.1 * esAt.y) * 44.0 + wob, f = abs(fract(g) - 0.5);
    float pxw = 44.0 * 1.4 / uRes.y, t1 = 0.27 * sat(dark * 1.5), t2 = 0.1 * sat(dark * 4.0 - 3.3);
    float ink = sat((t1 - f.x) / pxw + 0.5) * sat(t1 * 12.0), over = sat((t2 - f.y) / pxw + 0.5) * sat(t2 * 12.0);
    ink = max(max(ink, 0.6 * over), smoothstep(0.45, 0.85, 4.0 * sun * dark)) * (0.75 + 0.25 * noise(esAt * vec2(160.0, 90.0)));
    vec3 pen = vec3(0.1, 0.105, 0.14) * mix(vec3(1.0), tint, 0.7);
    vec3 drawn = mix(lit * 1.02, pen, ink);
    return mix(mix(shade, lit, sun), drawn, -uOwn[7]);
  }
  vec3 c = mix(shade, lit, sun);
  float edge = sun * (1.0 - sun) * 4.0;
  return c * mix(vec3(1.0), vec3(1.06, 0.98, 0.90), edge * 0.6);
}

vec3 render(vec2 p) {
  bool st = uVar > 0.5;
  // a tall frame stands further off, so that all the shadows are in it
  float off = 1.0 + 1.35 * (1.0 - smoothstep(0.6, 1.3, uRes.x / uRes.y));
  esAt = p;
  p = vec2(p.x * off - (st ? 0.05 : 0.055) * (off - 1.0), (p.y - 0.385) * off + 0.385 + 0.1 * (off - 1.0));
  // the loop is the sun
  if (uOwn[5] < 0.0) p.y -= 0.24 * uOwn[5];
  float above = esP(uOwn[5]);
  float noon = 0.5 - 0.5 * cos(TAU * uLoop), swing = 0.16 * sin(TAU * uLoop) + 0.05 * sin(uTime * 0.03);
  esT = (0.36 + 0.12 * noon) * (1.2 - 0.4 * uSpace);
  esT *= exp2(uOwn[2] > 0.0 ? -0.95 * uOwn[2] : -1.5 * uOwn[2]);
  float az = (st ? 0.6 : -0.54) + swing;
  esD = vec2(cos(az), sin(az));
  float px = off / uRes.y;
  vec3 stone = vec3(0.965, 0.89, 0.76), P;
  vec2 rd = vec2(p.x, 0.72);
  float t, there, bright = 1.0, sand = esP(uOwn[3]), joint = 0.0;
  if (!st) {
    // the plain, tilted towards us, with an edge and only sky beyond it
    t = 1.0 / (0.78 - min(p.y, 0.39));
    P = vec3(rd.x * t, 0.0, rd.y * t);
    there = (1.0 - smoothstep(-px, px, p.y - 0.385));
    esPx = vec2(t, t * t * 0.72) * px;
    if (above > 0.0) {
      P = mix(P, vec3(p.x * 1.75, 0.0, 1.26 + p.y * 1.7), above);
      esPx = mix(esPx, vec2(1.75) * px, above);
      there = max(there, smoothstep(0.0, 0.2, above));
    }
    vec2 g = rot(0.2) * P.xz / 0.25;
    float row = floor(g.y); g.x += 0.5 * mod(row, 2.0);
    vec2 q = abs(fract(g) - 0.5), w = esPx / 0.25;
    vec2 j = smoothstep(0.493 - w, vec2(0.497) , q) * min(0.012 / w, 1.0);
    stone *= 1.0 + 0.07 * (hash21(floor(g)) - 0.5);
    joint = max(j.x, j.y);
    vec3 plain = vec3(0.965, 0.89, 0.76);
    stone *= mix(vec3(1.0), vec3(0.87, 0.84, 0.86), joint);
    if (sand > 0.0) stone = mix(stone, plain, sand);
    if (uOwn[3] < 0.0) {
      vec2 c = rot(0.2) * P.xz / 0.2;
      float o = 0.5 - 0.5 * esRow(c.x, esPx.x / 0.2) * esRow(c.y, esPx.y / 0.2);
      stone = mix(stone, plain * mix(vec3(1.0), 0.04 + 0.7 * uKind[4], o), -uOwn[3]);
    }
    float edge = smoothstep(0.362, 0.362 + 2.0 * px, p.y);
    bright = 1.0 + (1.0 - above) * (0.07 * edge - 0.25 * smoothstep(0.366 - px, 0.366, p.y) * (1.0 - smoothstep(0.366 + 2.0 * px, 0.366 + 3.0 * px, p.y)));
  } else {
    // two flights of shallow steps with a landing between, each step found in closed form
    const float D = 0.1, S = 0.28, H = D * S, z2 = 1.35, yl = 10.0 * H;
    rd = vec2(0.976 * p.x + 0.196, -0.218 * p.x + 0.878);
    if (above > 0.0) p = mix(p, vec2(p.x * 0.62 + 0.02, p.y * 0.5 - 0.02), above);
    float s = 0.55 - min(p.y, 0.5);
    float t1 = 1.0 / (s + S * rd.y), q1 = t1 * rd.y / D;
    float tb = (1.0 - yl - H + S * z2) / (s + S * rd.y), q2 = (tb * rd.y - z2) / D;
    float fw1 = fwidth(q1), fw2 = fwidth(q2);
    float corner = s / (s + S * rd.y);
    bool low = q1 < 10.0, level = !low && q2 < -1.0;
    float q = low ? q1 : q2, w = low ? fw1 : fw2, k = floor(q), fr = q - k;
    float y = low ? k * H : yl + (k + 1.0) * H;
    if (level) y = yl;
    bool riser = !level && fr > corner;
    t = riser ? ((k + 1.0) * D + (low ? 0.0 : z2)) / rd.y : (1.0 - y) / s;
    P = vec3(rd.x * t, 1.0 - s * t, rd.y * t);
    esPx = vec2(t, t * t * 0.9) * px;
    float up = level ? 0.0 : sat((fr - corner) / w + 0.5) * sat((1.0 - fr) / w);
    there = (1.0 - smoothstep(-w, w, q2 - 8.0));
    float lip = level ? 0.0 : (1.0 - smoothstep(0.03, 0.05, fr)) * smoothstep(0.0, w, fr);
    bright = mix(0.945, 1.08, up) + 0.06 * lip;
    if (sand > 0.0) bright = mix(bright, mix(0.9, 1.05, up), sand);
    if (!level) bright *= 1.0 - 0.22 * (1.0 - 0.5 * sand) * (1.0 - smoothstep(0.0, 0.03 + w, abs(fr - corner)));
    vec2 g = vec2(P.x / 0.34 + 0.37 * k, k + (low ? 0.0 : 40.0));
    stone *= 1.0 + 0.06 * (hash21(floor(g)) - 0.5);
    float wj = esPx.x / 0.34;
    joint = smoothstep(0.49 - wj, 0.496, abs(fract(g.x) - 0.5)) * min(0.012 / wj, 1.0);
    vec3 plain = vec3(0.965, 0.89, 0.76);
    stone *= 1.0 - 0.12 * joint;
    if (sand > 0.0) stone = mix(stone, plain, sand);
    if (uOwn[3] < 0.0) {
      float o = 0.5 - 0.5 * esRow(P.x / 0.16 + k + (riser ? 1.0 : 0.0), esPx.x / 0.16);
      stone = mix(stone, plain * mix(vec3(1.0), 0.04 + 0.7 * uKind[4], o), -uOwn[3]);
    }
  }
  if (sand > 0.0) {
    float soft = st ? 0.35 : 1.0;
    float here = esLie(P.xz), slope = (esLie(P.xz - 0.04 * esD) - here) / 0.04;
    float rip = sin(dot(P.xz, vec2(46.0, 21.0)) + 5.0 * noise(P.xz * 2.3) + here * 60.0);
    bright *= 1.0 - sand * soft * (0.75 * slope + 0.035 * rip * sat(1.5 - 70.0 * max(esPx.x, esPx.y)));
    P.y += sand * soft * here;
    bright = min(bright, mix(9.0, 1.12, sand));
  }
  float moss = 0.0;
  if (uOwn[6] < 0.0) {
    float old = -uOwn[6], n = fbm(P.xz * 2.6 + 3.0), crack = abs(noise(P.xz * 4.1 + 1.5 * n) - 0.5 + 0.35 * (n - 0.5));
    float w = max(esPx.x, esPx.y) * 3.0;
    joint = max(joint, 1.0 - smoothstep(0.003, 0.008 + w, crack));
    moss = old * max(smoothstep(0.54, 0.66, n + 0.12 * noise(P.xz * vec2(60.0, 30.0)) - 0.06), joint * 0.8 * smoothstep(0.3, 0.5, n));
    stone *= 1.0 - old * 0.55 * joint * (1.0 - sand);
    stone = mix(stone, (0.1 + 0.6 * uKind[2]) * vec3(0.8, 0.95, 0.6) * (0.8 + 0.4 * noise(P.xz * 70.0)), 0.8 * moss);
    stone *= 1.0 - 0.3 * old * smoothstep(0.35, 0.65, noise(P.xz * 1.7 + 9.0));
  }
  stone *= 1.0 + 0.04 * (noise(P.xz * 150.0 + P.y * 90.0) - 0.5) + 0.02 * (noise(P.xz * 37.0) - 0.5) + 0.06 * (noise(P.xz * 3.0) - 0.5);
  float top = p.y - 0.36;
  vec3 sky = mix(vec3(0.82, 0.87, 0.80), vec3(0.62, 0.77, 0.77), smoothstep(0.0, 0.16, top));
  if (uOwn[5] < 0.0) {   // a great sky has high cloud in it
    float c = fbm(vec2(p.x * 1.5, p.y * 6.0) + vec2(-0.01 * uTime, 2.0));
    sky = mix(sky, mix(sky, vec3(0.97, 0.94, 0.88), 0.75 * smoothstep(0.42, 0.75, c)) * mix(1.06, 0.86, sat(top * 1.4)), -uOwn[5]);
  }
  if (uOwn[4] > 0.0) {
    vec2 m = esAt - vec2(-0.36, 0.3);
    vec3 night = mix(vec3(0.16, 0.21, 0.3), vec3(0.03, 0.045, 0.085), sat(top * 3.0)) + 0.16 * exp(-dot(m, m) * 9.0);
    vec2 sg = esAt * 46.0, sf = fract(sg) - 0.5;
    night += smoothstep(0.12, 0.02, length(sf - 0.6 * (hash22(floor(sg)) - 0.5))) * step(0.86, hash21(floor(sg) + 4.0)) * 0.6;
    if (uOwn[5] < 0.0) night = mix(night, vec3(0.86, 0.87, 0.82), smoothstep(0.052, 0.049, length(m)) * -uOwn[5]);
    sky = mix(sky, night, uOwn[4]);
  }
  // thin cloud before the sun, and the one cloud of a cue
  float drift = uTravel * 0.02 + uTime * 0.004;
  float pass = (1.0 - smoothstep(0.18, 0.62, abs(p.x + 0.35 * noise(p * 4.0 + 3.0) - 0.17 - mix(1.5, -1.2, uCue)))) * smoothstep(0.0, 0.3, uCue);
  esCloud = sat(0.8 * smoothstep(0.5, 0.85, noise(P.xz * 1.1 + vec2(-drift, 0.3 * drift))) + pass);
  esPen = 0.0145 * (1.5 - 0.9 * uTone) * (1.0 + 3.0 * esCloud);
  esPen *= 1.0 + 7.0 * esP(uOwn[7]);
  esShadows(P);
  if (uOwn[7] > 0.0) esDark *= 1.0 - 0.25 * uOwn[7];
  vec3 col = esPaint(stone * (0.98 + 0.06 * sat(0.5 - 0.5 * p.x + 0.4 * p.y)), bright * (0.985 + 0.03 * uLevel));
  if (uOwn[6] > 0.0) {
    float n = fbm(P.xz * vec2(1.5, 2.2) + 5.0), pud = smoothstep(0.47, 0.5, n) * (st ? smoothstep(0.9, 1.0, bright) : 1.0);
    vec2 rp = P.xz * 9.0;
    vec2 cell = floor(rp), o = fract(rp) - 0.5;
    float ring = length(o - 0.4 * (hash22(cell) - 0.5)), age = fract(uTime * 0.35 + hash21(cell)), wave = sin((ring - age * 0.5) * 60.0) * exp(-pow((ring - age * 0.5) * 12.0, 2.0)) * (1.0 - age) * step(0.6, hash21(cell + 7.0));
    vec3 up = mix(mix(vec3(0.86, 0.88, 0.84), vec3(0.5, 0.6, 0.66), sat(0.55 - 0.9 * p.y)), vec3(0.14, 0.18, 0.26), esP(uOwn[4]));
    up *= 1.12 - 0.85 * esDark;
    col = mix(col, mix(col * vec3(0.62, 0.64, 0.68), up * (1.0 + 0.25 * wave), 0.16 + 0.76 * pud), uOwn[6]);
  }
  return mix(sky, col, there);
}
