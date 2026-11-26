// name: Empty square
// a: Paved plain
// b: Wide steps
// what: A sunlit square of pale stone seen from a high window, with nothing standing in it, and across it the long blue shadows of things that are not there: an arch, a tall vase, a ladder, a flag, a ball on a rod; or a wide flight of shallow steps that the same shadows climb in zigzags.
// follows: Each kind of sound is one shadow that darkens and grows as it plays: drone the arch, pad and voice the vase, texture the flag, phrase the ladder, whose rungs thicken with the piece; a hit shows the ball and bounces it. The loop is the sun and swings them all. The spectrum is sixteen railings, keys are birds, travel moves thin cloud, a cue one big cloud.
vec2 esD;      // which way the shadows fall over the ground
float esT;     // how steeply the sun stands
float esPen;   // how soft a shadow gets with distance
vec2 esPx;     // how much ground one pixel covers, aside and away
float esCloud; // how much thin cloud lies before the sun here
float esDark;  // all the shadow here, 0 to 1
vec4 esTint;   // the colours of that shadow, summed, and their weight

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
void esOne(vec3 P, vec4 at, vec2 e, int k, float lv, float rest) {
  float size = at.w * (0.8 + 0.2 * lv);
  vec3 r = esBack(P, at.xyz, e);
  vec2 q = r.xy / size;
  if (abs(q.x) > 1.3 || q.y > 1.7) return;
  float d = k == 0 ? esArch(q) : k == 1 ? esVase(q, lv) : k == 2 ? esFlag(q, lv) : k == 3 ? esLadder(q, lv) : esBall(q, 1.2 * uHits * (1.0 - uHits));
  float pen = esPen;
  esPen *= 1.3 - 0.6 * lv;
  esLay(d * size, r.z, mix(rest, 0.97, sat(lv * (0.9 + 0.8 * uEnergy))), uKind[k]);
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
    esLay(min(d, abs(r.y - gap * 0.22) - gap * 0.03), r.z, 0.62, vec3(0.4));
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
  vec3 c = mix(shade, lit, sun);
  float edge = sun * (1.0 - sun) * 4.0;
  return c * mix(vec3(1.0), vec3(1.06, 0.98, 0.90), edge * 0.6);
}

vec3 render(vec2 p) {
  bool st = uVar > 0.5;
  // a tall frame stands further off, so that all the shadows are in it
  float off = 1.0 + 1.35 * (1.0 - smoothstep(0.6, 1.3, uRes.x / uRes.y));
  p = vec2(p.x * off - (st ? 0.05 : 0.055) * (off - 1.0), (p.y - 0.385) * off + 0.385 + 0.1 * (off - 1.0));
  // the loop is the sun
  float noon = 0.5 - 0.5 * cos(TAU * uLoop), swing = 0.16 * sin(TAU * uLoop) + 0.05 * sin(uTime * 0.03);
  esT = (0.36 + 0.12 * noon) * (1.2 - 0.4 * uSpace);
  float az = (st ? 0.6 : -0.54) + swing;
  esD = vec2(cos(az), sin(az));
  float px = off / uRes.y;
  vec3 stone = vec3(0.965, 0.89, 0.76), P;
  vec2 rd = vec2(p.x, 0.72);
  float t, there, bright = 1.0;
  if (!st) {
    // the plain, tilted towards us, with an edge and only sky beyond it
    t = 1.0 / (0.78 - min(p.y, 0.39));
    P = vec3(rd.x * t, 0.0, rd.y * t);
    there = (1.0 - smoothstep(-px, px, p.y - 0.385));
    esPx = vec2(t, t * t * 0.72) * px;
    vec2 g = rot(0.2) * P.xz / 0.25;
    float row = floor(g.y); g.x += 0.5 * mod(row, 2.0);
    vec2 q = abs(fract(g) - 0.5), w = esPx / 0.25;
    vec2 j = smoothstep(0.493 - w, vec2(0.497) , q) * min(0.012 / w, 1.0);
    stone *= 1.0 + 0.07 * (hash21(floor(g)) - 0.5);
    stone *= mix(vec3(1.0), vec3(0.87, 0.84, 0.86), max(j.x, j.y));
    float edge = smoothstep(0.362, 0.362 + 2.0 * px, p.y);
    bright = 1.0 + 0.07 * edge - 0.25 * smoothstep(0.366 - px, 0.366, p.y) * (1.0 - smoothstep(0.366 + 2.0 * px, 0.366 + 3.0 * px, p.y));
  } else {
    // two flights of shallow steps with a landing between, each step found in closed form
    const float D = 0.1, S = 0.28, H = D * S, z2 = 1.35, yl = 10.0 * H;
    rd = vec2(0.976 * p.x + 0.196, -0.218 * p.x + 0.878);
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
    if (!level) bright *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.03 + w, abs(fr - corner)));
    vec2 g = vec2(P.x / 0.34 + 0.37 * k, k + (low ? 0.0 : 40.0));
    stone *= 1.0 + 0.06 * (hash21(floor(g)) - 0.5);
    float wj = esPx.x / 0.34;
    stone *= 1.0 - 0.12 * smoothstep(0.49 - wj, 0.496, abs(fract(g.x) - 0.5)) * min(0.012 / wj, 1.0);
  }
  stone *= 1.0 + 0.04 * (noise(P.xz * 150.0 + P.y * 90.0) - 0.5) + 0.02 * (noise(P.xz * 37.0) - 0.5) + 0.06 * (noise(P.xz * 3.0) - 0.5);
  float top = p.y - 0.36;
  vec3 sky = mix(vec3(0.82, 0.87, 0.80), vec3(0.62, 0.77, 0.77), smoothstep(0.0, 0.16, top));
  // thin cloud before the sun, and the one cloud of a cue
  float drift = uTravel * 0.02 + uTime * 0.004;
  float pass = (1.0 - smoothstep(0.18, 0.62, abs(p.x + 0.35 * noise(p * 4.0 + 3.0) - 0.17 - mix(1.5, -1.2, uCue)))) * smoothstep(0.0, 0.3, uCue);
  esCloud = sat(0.8 * smoothstep(0.5, 0.85, noise(P.xz * 1.1 + vec2(-drift, 0.3 * drift))) + pass);
  esPen = 0.0145 * (1.5 - 0.9 * uTone) * (1.0 + 3.0 * esCloud);
  esShadows(P);
  vec3 col = esPaint(stone * (0.98 + 0.06 * sat(0.5 - 0.5 * p.x + 0.4 * p.y)), bright * (0.985 + 0.03 * uLevel));
  return mix(sky, col, there);
}
