// name: Soft lights
// a: Frosted glass
// b: Cut gels
// what: A few great soft lights drifting behind a pane of frosted glass, some close against it and some far back, melting into one another where they cross; or the same lights as sharp cut discs and half discs of coloured gel, each filled with a gradient and laid one over another with soft shadows between.
// follows: One light for each kind of sound, as large and bright as that sound is loud; a hit sends a ring of brightness out through the red one and a cue a wider ring through the violet; the gels grow, turn and slide with the same sounds.
// own: 0 1 four times as many lights, small ones among the great, -1 only two are left, larger; 1 the form: 1 tall bars, -1 hollow rings; 2 1 set out in straight rows, -1 all round one middle; 3 the ground: 1 white paper, the lights washes of colour on it, -1 a plastered wall in the colours of the drone and the pad; 4 the pane: 1 reeded glass, -1 glass bricks; 5 1 the lower half is water that mirrors them, -1 the shadow of leaves lies over all; 6 the edge: 1 cut hard (b: outlines only), -1 drawn out into smoke; 7 1 they rise (a: and run together like warm wax), -1 they go round the middle

float meLv[5];
const float meDepth[5] = float[5](0.8, 0.55, 0.32, 0.1, 0.45); // how far behind the glass each light hangs
// A kind's colour made pure, then turned toward a neighbouring hue: warm is 1 for its lighter neighbour (teal to
// sea green, amber to yellow, violet to pink), -1 for its deeper one (teal to blue, amber to red, violet to indigo).
vec3 mePure(int k) {
  vec3 c = uKind[k];
  c = max(mix(vec3(dot(c, vec3(0.3333))), c, 1.9), 0.0);
  if (k == 4) c *= vec3(1.0, 0.55, 0.8); // the hit is a rose red, not an orange
  return c;
}
vec3 meTurn(vec3 c, float ca, float sa) { return max(c * ca + 0.57735 * (c.zxy - c.yzx) * sa + (1.0 - ca) * 0.33333 * (c.x + c.y + c.z), 0.0); }
// The colour pure, of light k, turned by warm: the angles are known beforehand.
#define meHue(k, pure, warm) meTurn(pure, k == 4 ? cos(0.0225 * TAU * (warm)) : cos(0.05 * TAU * (warm)), k == 4 ? sin(0.0225 * TAU * (warm)) : k == 0 || k == 3 ? -sin(0.05 * TAU * (warm)) : sin(0.05 * TAU * (warm)))
// Where a light stands in this world. c: where it would be; j: which of its copies.
vec2 mePlace(vec2 c, int k, int j) {
  float fk = float(k), fj = float(j);
  vec2 h = hash22(vec2(fk * 3.0 + 1.0, fj * 5.0 + 11.0));
  if (j > 0) c = c * 0.5 + (h - 0.5) * vec2(1.75, 0.95) + 0.05 * vec2(sin(uTime * 0.07 + h.x * 40.0), cos(uTime * 0.06 + h.y * 40.0));
  if (uOwn[2] > 0.0) c = mix(c, vec2((fk - 2.0) * 0.33 + (j == 2 || j == 3 ? 0.11 : j == 0 ? 0.0 : -0.055), j == 0 ? 0.0 : j == 1 ? 0.29 : j == 2 ? -0.29 : 0.15) + (c - vec2(-0.46 + 0.24 * fk, 0.0)) * vec2(0.05, 0.12), uOwn[2]);
  if (uOwn[2] < 0.0) c *= 1.0 + 0.96 * uOwn[2];
  if (uOwn[7] < 0.0) c = rot(uTime * 0.07 * uOwn[7] * (1.5 - 0.22 * fk - 0.1 * fj)) * c;
  if (uOwn[7] > 0.0 && k < 4) c.y = mod(c.y + uOwn[7] * (uTime * (0.012 + 0.016 * h.x) + 1.3 * (h.y - 0.5)) + 0.85, 1.7) - 0.85;
  return c;
}
// How large it is, and how much of it is there.
vec2 meShare(int k, int j, float y) {
  vec2 s = vec2(1.0);
  if (j > 0) s = vec2(0.28 + 0.4 * hash21(vec2(float(k), float(j) + 4.0)), sat(uOwn[0] * 3.0 - float(j) + 1.0));
  if (uOwn[0] < 0.0) s *= k == 0 || k == 3 ? vec2(1.0 - 0.45 * uOwn[0], 1.0) : k == 4 ? vec2(1.0) : vec2(1.0 + 0.4 * uOwn[0], 1.0 + uOwn[0]);
  if (uOwn[7] > 0.0) s.y *= 1.0 - uOwn[7] * smoothstep(0.6, 0.82, abs(y));
  return s;
}
// Lights as paint: what they leave of the white of the paper.
vec3 mePaint(vec3 light, float k) {
  float m = max(light.r, max(light.g, light.b)), s = 1.0 - exp(-1.3 * m);
  return exp(-k * s * (2.3 * (1.0 - light / max(m, 1e-3)) + 0.08));
}
vec3 mePaper(vec2 p) { return vec3(1.5, 1.45, 1.36) * (0.92 + 0.1 * noise(p * 90.0) + 0.06 * noise(p * vec2(13.0, 15.0))); }
vec3 meWall(vec2 p) {
  vec3 a = uKind[0] * uKind[0], b = uKind[1] * uKind[1];
  float rough = fbm(p * 3.2 + 4.0), grit = noise(p * 120.0) * 0.5 + noise(p * 47.0) * 0.5;
  vec2 l = p - vec2(-0.3, 0.35);
  return mix(b, a, smoothstep(-0.45, 0.5, p.y + 0.5 * (rough - 0.5))) * (0.32 + 0.5 * rough) * (0.8 + 0.4 * grit) * (0.35 + 0.8 * exp(-dot(l, l) * 1.3));
}
// The shadow of leaves.
float meLeaves(vec2 p) {
  float dark = 0.0;
  for (int l = 0; l < (uOwn[5] < 0.0 ? 2 : 0); l++) {
    float fl = float(l), s = 4.6 - 1.7 * fl, blur = 0.03 + 0.1 * fl;
    vec2 g = rot(0.35 - 0.9 * fl) * (p + 0.012 * vec2(sin(uTime * 0.3 + p.y * 3.0 + fl), sin(uTime * 0.23 + p.x * 4.0))) * s + fl * 7.0, i = floor(g);
    for (int n = 0; n < 9; n++) {
      vec2 c = i + vec2(float(n % 3) - 1.0, float(n / 3) - 1.0), h = hash22(c + 3.0);
      vec2 v = rot(1.9 + 2.0 * (h.x - 0.5) + fl) * (g - c - 0.5 - (h - 0.5) * 0.6);
      float there = smoothstep(0.02, 0.14, fract(h.y * 7.7) * 0.62 + 0.42 - 0.5 * noise(c * 0.31 + 2.0) - 0.4 + 0.35 * sat(0.4 - 0.6 * p.x + 0.9 * p.y));
      float y = v.y / 0.72, w = 0.26 * (1.0 - y * y) * (1.0 + 0.4 * y) - abs(v.x);
      dark = max(dark, there * smoothstep(-blur, blur, w) * step(abs(y), 1.0) * (0.85 - 0.3 * fl) * (0.82 + 0.18 * smoothstep(0.0, 0.03, abs(v.x))));
    }
  }
  return dark * -uOwn[5];
}
// Where a light is: each wanders slowly on its own path. depth is how far behind the glass (0 against it, 1 far back).
vec2 meAt(int k, float depth) {
  float fk = float(k), t = uTime * 0.045 + uTravel * 0.012;
  vec2 home = vec2(-0.46 + 0.24 * fk + 0.1 * sin(fk * 2.4), 0.16 * sin(fk * 1.9 + 0.6) - 0.02);
  vec2 wander = vec2(sin(t * (1.0 + 0.23 * fk) + fk * 2.1), cos(t * (0.8 + 0.17 * fk) + fk * 1.3)) * vec2(0.2, 0.12);
  vec2 sway = vec2(sin(uTime * 0.08), cos(uTime * 0.063)) * 0.07 * depth; // the eye moves: what is far slides more behind the pane
  return home + wander + sway;
}
vec3 meFrosted(vec2 p) {
  vec2 p0 = p;
  // the frost: every point of the pane throws the light a little aside, and the pane itself is not quite flat
  vec2 px = gl_FragCoord.xy;
  vec2 scatter = (vec2(hash21(px), hash21(px + 71.3)) - 0.5);
  vec2 wave = vec2(noise(p * 7.0 + 3.0), noise(p * 7.0 + 19.0)) - 0.5;
  vec2 ripple = vec2(noise(p * 19.0 + 40.0), noise(p * 19.0 + 71.0)) - 0.5; // the small unevenness of the glass
  vec3 col = vec3(0.0);
  float hard = max(uOwn[6], 0.0), smoke = max(-uOwn[6], 0.0), drift = 1.0;
  vec4 wax = vec4(0.0);
  vec3 beat = vec3(0.0);
  if (uOwn[7] > 0.0) { scatter *= 1.0 - 0.85 * uOwn[7]; ripple *= 1.0 - 0.6 * uOwn[7]; }
  if (hard > 0.0) { scatter *= 1.0 - hard; ripple *= 1.0 - hard; wave *= 1.0 - hard; }
  if (smoke > 0.0) {
    vec2 w = vec2(fbm(p * 1.6 + vec2(2.0, uTime * 0.02)), fbm(p * 1.6 + vec2(11.0 - uTime * 0.017, 5.0))) - 0.48;
    drift = mix(1.0, 0.25 + 1.5 * fbm(vec2(p.x * 5.5, p.y * 1.3) + w * 3.0 + vec2(0.0, uTime * 0.02)), smoke);
    p += smoke * w * vec2(0.75, 0.55);
    scatter *= 1.0 - 0.6 * smoke;
  }
  for (int j = 0; j < 1 + int(ceil(3.0 * max(uOwn[0], 0.0) - 0.01)); j++) for (int k = 0; k < 5; k++) {
    float depth = meDepth[k];
    float lv = meLv[k];
    vec2 c = meAt(k, depth);
    if (j > 0 || uOwn[2] != 0.0 || uOwn[7] != 0.0) c = mePlace(c, k, j);
    vec2 share = meShare(k, j, c.y);
    vec2 q = p + wave * 0.03 + ripple * 0.014 + scatter * (0.012 + 0.07 * depth) - c;
    q.x *= hard > 0.0 ? mix(0.82, 1.0, hard) : 0.82;
    float r = (0.1 + 0.2 * lv) * (0.8 + 0.8 * depth) * share.x;
    if (uOwn[2] > 0.0) r = mix(r, (0.07 + 0.1 * lv) * share.x, uOwn[2]);
    if (uOwn[2] < 0.0) r = mix(r, (0.1 + 0.095 * float(k) + 0.05 * float(j)) * (0.75 + 0.5 * lv), -uOwn[2]);
    if (uOwn[1] > 0.0) q *= vec2(1.0 + 1.1 * uOwn[1], 1.0 - 0.74 * uOwn[1]);
    float d = length(q) / r;
    if (uOwn[1] < 0.0) d = mix(d, abs(d - 1.0) * (2.2 + 2.2 * hard), -uOwn[1]);
    float soft = mix(2.2, 1.0, depth); // close to the glass a light keeps an edge; far back it is all bloom
    float body = exp(-pow(d, 2.0 * soft));
    float bloom = exp(-d * d * 0.32);
    float e = body;
    if (hard > 0.0) { e = mix(body, smoothstep(0.87 + 3.0 / (uRes.y * r), 0.87 - 3.0 / (uRes.y * r), d), hard); body = mix(body, e * (0.55 + 0.45 * sat(0.5 - 0.6 * q.y / r)), hard); bloom *= 1.0 - 0.5 * hard; }
    vec3 own = mePure(k), hot = meHue(k, own, 1.0), deep = meHue(k, own, -2.0);
    vec3 light = mix(deep * 0.5, mix(own, hot + 0.06, body * body), body) * body + deep * bloom * 0.07;
    float power = 0.012 + 1.5 * lv * lv + 0.3 * lv;
    if (share.y < 1.0) light *= share.y;
    if (uOwn[0] < 0.0 || uOwn[3] > 0.0) power += k == 4 ? 0.0 : 0.1 + 0.2 * max(uOwn[3], 0.0);
    if (uOwn[7] > 0.0) { float f = exp(-d * d * 1.1) * (k == 4 ? 1.1 * lv : 0.45 + 0.6 * lv) * share.y; wax += vec4(mix(own, hot, 0.5) * (0.35 + power) * f, f); }
    col += light * power;
    // a ring of brightness going out through a light
    float go = k == 4 ? uHits : (k == 1 ? uCue : 0.0);
    float ring = (1.0 - go) * (k == 4 ? 2.2 : 3.2);
    col += (hot + 0.15) * go * 1.0 * exp(-pow((d - ring) / 0.3, 2.0)) * smoothstep(0.0, 0.25, 1.0 - go);
    if (uOwn[7] > 0.0) beat += (hot + 0.15) * go * 0.8 * exp(-pow((length(p - meAt(k, depth)) / 0.2 - ring) / 0.3, 2.0)) * smoothstep(0.0, 0.25, 1.0 - go) * step(0.5, 1.5 - float(j));
  }
  if (uOwn[7] > 0.0) {
    float in_ = smoothstep(0.34, 0.39, wax.a), top = smoothstep(0.3, 1.1, wax.a);
    vec3 c = wax.rgb / max(wax.a, 0.05);
    col = mix(col, c * (0.3 + 0.75 * top) * in_ + c * 0.16 * wax.a * (1.0 - in_) + c * 0.5 * exp(-pow((wax.a - 0.41) / 0.05, 2.0)), uOwn[7]);
  }
  col *= drift;
  if (uOwn[7] > 0.0) col += beat * uOwn[7];
  if (uOwn[3] > 0.0) col = mix(col, mePaper(p0) * mePaint(col, 1.0), uOwn[3]);
  if (uOwn[3] < 0.0) col = mix(col, meWall(p0) * (1.0 - 0.5 * sat(dot(col, vec3(0.3)))) + col, -uOwn[3]);
  // the face of the glass: a soft sheen across it, streaked where it was last wiped, and the dim shape of a window behind the eye
  float grainy = 0.7 + 0.6 * hash21(px * 0.7 + 3.0);
  vec2 arc = p - vec2(0.9, -1.3);
  float off = length(arc), round_ = atan(arc.y, arc.x);
  float wiped = noise(vec2(off * 130.0, round_ * 5.0)) * 0.6 + 0.4 * noise(vec2(off * 41.0, round_ * 2.0 + 9.0));
  float sheen = exp(-pow((p.x * 0.6 + p.y + 0.12 + 0.06 * sin(uTime * 0.05) + wave.x * 0.12) / 0.17, 2.0));
  vec2 w = (p - vec2(-0.5 + 0.03 * sin(uTime * 0.08), 0.19)) * rot(-0.1) + wave * 0.05 + ripple * 0.02;
  float pane = smoothstep(0.17, 0.1, abs(w.x)) * smoothstep(0.2, 0.13, abs(w.y)) * (0.4 + 0.6 * smoothstep(0.0, 0.018, abs(w.x)) * smoothstep(0.0, 0.018, abs(w.y - 0.02)));
  col += vec3(0.55, 0.66, 0.82) * (0.05 * sheen + 0.035 * pane) * (0.35 + 1.3 * wiped * wiped) * grainy * (0.35 + uLevel) * (uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[6] != 0.0 ? 1.0 - max(abs(uOwn[3]), max(abs(uOwn[4]), abs(uOwn[6]))) : 1.0);
  col *= 0.9 + 0.2 * hash21(px + 5.0); // frost takes a little, unevenly
  return col;
}

// One gel: a disc, or a half disc when cut is 1. Gives how much of it covers this point; rim is its cut edge.
float meGel(vec2 q, float r, float cut, float turn, vec2 way, float soft, out float rim, out float dd) {
  float d = length(q) - r;
  float h = dot(q, way); // the straight cut
  if (uOwn[1] > 0.0) { vec2 b = abs(rot(0.16 * (turn - 3.5) * (1.0 - uOwn[2])) * q) - r * vec2(0.3, 1.15); d = mix(d, max(b.x, b.y), uOwn[1]); cut *= 1.0 - uOwn[1]; }
  if (uOwn[1] < 0.0) d = mix(d, abs(length(q) - r * 0.84) - r * 0.16, -uOwn[1]);
  dd = mix(d, max(d, -h), cut);
  float aa = 1.5 / uRes.y + soft;
  rim = smoothstep(0.007 + aa, 0.0, abs(dd + 0.003));
  if (uOwn[6] < 0.0) { aa += 0.11 * -uOwn[6] * sat(r * 3.0); rim *= 1.0 + uOwn[6]; }
  return smoothstep(aa, -aa, dd);
}
vec3 meGels(vec2 p) {
  vec3 col = vec3(0.0);
  float paper = max(uOwn[3], 0.0), wall = max(-uOwn[3], 0.0), line = max(uOwn[6], 0.0);
  if (paper > 0.0) col = mePaper(p) * paper * 0.95;
  if (wall > 0.0) col = meWall(p) * wall;
  vec3 ground = col;
  if (uOwn[6] < 0.0) p += -uOwn[6] * 0.5 * (vec2(fbm(p * 2.0 + vec2(2.0, uTime * 0.02)), fbm(p * 2.0 + vec2(11.0 - uTime * 0.017, 5.0))) - 0.48);
  float t = uTime * 0.05 + uTravel * 0.015;
  // the lamp behind them all
  vec2 lamp = vec2(0.05 + 0.12 * sin(uTime * 0.04), 0.02 + 0.06 * cos(uTime * 0.05));
  float lit = 0.3 + 1.1 * exp(-dot(p - lamp, p - lamp) / 0.16);
  vec2 homes[5] = vec2[5](vec2(-0.36, -0.04), vec2(-0.06, 0.05), vec2(0.27, -0.1), vec2(0.1, 0.16), vec2(0.5, 0.12));
  float sizes[5] = float[5](0.4, 0.43, 0.33, 0.25, 0.22);
  for (int j = int(ceil(3.0 * max(uOwn[0], 0.0) - 0.01)); j >= 0; j--) for (int k = 0; k < 5; k++) {
    float fk = float(k), lv = meLv[k];
    vec2 c = homes[k] + vec2(sin(t * (0.9 + 0.2 * fk) + fk * 1.7), cos(t * (0.7 + 0.15 * fk) + fk * 0.9)) * vec2(0.1, 0.06);
    c += vec2(sin(uTime * 0.08), cos(uTime * 0.063)) * 0.012 * (fk - 2.0); // upper layers slide over lower as the eye moves
    if (j > 0 || uOwn[2] != 0.0 || uOwn[7] != 0.0) c = mePlace(c, k, j);
    vec2 share = meShare(k, j, c.y);
    float r = sizes[k] * (0.55 + 0.75 * lv) * share.x;
    if (share.x * share.y < 1.0) r *= 0.02 + 0.98 * share.y;
    if (uOwn[2] > 0.0) r = mix(r, (0.1 + 0.11 * lv) * (1.0 + 0.5 * max(uOwn[1], 0.0)) * (j > 0 ? share.x : 1.0), uOwn[2]);
    if (uOwn[2] < 0.0) r = mix(r, (0.56 - 0.1 * fk - 0.03 * float(j)) * (0.75 + 0.4 * lv), -uOwn[2]);
    float cut = mod(fk, 2.0);
    float turn = fk * 2.3 + 0.6 + t * (cut > 0.5 ? 0.8 : 0.25);
    float rim, dd;
    vec2 way = vec2(cos(turn), sin(turn));
    // the shadow this gel lays on those under it
    float lift = 0.02 + 0.014 * fk;
    float shade = meGel(p - c - vec2(lift, -lift * 1.3), r, cut, turn, way, 0.022 + 0.012 * fk, rim, dd);
    if (uOwn[3] == 0.0 && line == 0.0) col *= 1.0 - 0.78 * shade;
    else col *= 1.0 - shade * mix(mix(0.78, 0.3, paper), 0.0, line) * mix(1.0, 0.6, wall);
    float cover = meGel(p - c, r, cut, turn, way, 0.0012 * (4.0 - fk), rim, dd); // those furthest back are a touch softer
    // its fill: a gradient across it, from a hot side through its own colour down to the dark of the next hue
    vec2 g = vec2(cos(turn + 0.7), sin(turn + 0.7));
    float along = sat(0.5 + 0.5 * dot(p - c, g) / r);
    vec3 own = mePure(k), hot = meHue(k, own, 1.0), fill = mix(meHue(k, own, -1.6) * 0.03, meHue(k, own, -0.4) * 0.7, smoothstep(0.05, 0.75, along));
    fill = mix(fill, hot * 1.2 + vec3(0.12, 0.09, 0.06), smoothstep(0.68, 1.0, along));
    float bright = (0.02 + 0.8 * lv * lv + 0.3 * lv) * lit;
    // a ring of brightness through the gel
    float go = k == 4 ? uHits : (k == 1 ? uCue : 0.0);
    float ring = (1.0 - go) * r * 1.25;
    float flash = go * exp(-pow((length(p - c) - ring) / (0.02 + 0.09 * r), 2.0));
    // what lies under is seen through this gel, taking its colour; the gel adds its own light
    vec3 tint = own;
    tint /= max(max(tint.r, tint.g), max(tint.b, 0.2));
    if (paper > 0.0) {
      float m = mix(0.35 + 0.65 * smoothstep(0.0, 0.9, along), 0.1, line);
      col *= mix(vec3(1.0), mePaint(tint * (0.25 + 1.3 * lv), m), cover * paper);
      col *= mix(vec3(1.0), mePaint(tint, 1.0) * 0.8, rim * cover * paper * (0.35 + 0.65 * line));
      fill *= 1.0 - paper; bright *= 1.0 - paper; flash *= 1.0 - 0.6 * paper;
    }
    if (wall > 0.0 && paper == 0.0) col = mix(col, (fill + tint * 0.06) * lit * (0.5 + lv), cover * wall * 0.6 * (1.0 - line));
    if (line > 0.0) { fill *= 1.0 - 0.93 * line; bright *= 1.0 - 0.5 * line; }
    vec3 under = col * mix(vec3(1.0), tint * 0.5 + 0.42, cover * (1.0 - max(paper, line)));
    col = under + (fill * bright + (hot + 0.2) * flash * 0.8) * cover;
    if (line == 0.0 && paper == 0.0) col += (hot + 0.15) * rim * cover * (0.03 + 0.2 * lv) * lit;
    else col += (hot + 0.15) * rim * cover * mix((0.03 + 0.2 * lv) * lit, 0.22 + 1.3 * lv, line) * (1.0 - paper);
    col += meHue(k, own, 0.3) * bright * 0.16 * exp(-max(dd, 0.0) / 0.045) * (1.0 - cover); // light spilling past its edge
  }
  return col;
}
// To the screen with the weight of film: colours stay deep as they brighten, darks stay down.
vec3 meFilm(vec3 light) {
  vec3 c = screenOf(light);
  c = mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.35);
  c = sat(c);
  return mix(c, c * c * (3.0 - 2.0 * c), 0.55);
}
vec3 render(vec2 p) {
  meLv[0] = uDrone; meLv[1] = uPad; meLv[2] = uTexture; meLv[3] = uPhrase; meLv[4] = uHits;
  vec2 at = p;
  vec3 pane = vec3(1.0), shine = vec3(0.0);
  if (uOwn[0] < 0.0) meLv[0] = mix(meLv[0], sat(0.45 * uDrone + 0.45 * uPad + 0.3 * uTexture), -uOwn[0]);
  if (uOwn[5] > 0.0) {
    // water: from its edge down everything is seen again, shaken
    float edge = mix(-0.62, -0.1, uOwn[5]), deep = edge - p.y;
    if (deep > 0.0) {
      float ly = log(deep + 0.05), n = noise(vec2(p.x * 2.5, ly * 8.0 + uTime * 0.16)) + 0.5 * noise(vec2(p.x * 7.0, ly * 19.0 - uTime * 0.21)) - 0.75;
      p = vec2(p.x + 0.05 * n * sat(deep * 6.0), edge + deep * 1.05 + 0.22 * n * sat(deep * 3.0) * (0.2 + deep));
      pane = vec3(0.6, 0.66, 0.72) * (0.85 + 0.3 * n);
    }
    pane *= 1.0 - 0.5 * exp(-pow(deep / 0.004, 2.0)) * (1.0 - max(uOwn[3], 0.0));
  }
  if (uOwn[4] > 0.0) {
    // reeds of glass, each a lens of its own
    float w = 0.058, i = floor(p.x / w), f = p.x / w - i - 0.5, far = 1.0 - 4.0 * f * f;
    p.x += uOwn[4] * (-f * w * 2.6 + 0.07 * (hash11(i) - 0.5) * 0.4);
    pane *= mix(vec3(1.0), vec3(0.62 + 0.5 * far + 0.1 * f), uOwn[4]);
    shine += uOwn[4] * exp(-pow((f + 0.3) * 9.0, 2.0)) * vec3(0.1) * (0.3 + uLevel);
  }
  if (uOwn[4] < 0.0) {
    // bricks of glass in their mortar
    vec2 g = (p + vec2(0.0, 0.075)) / 0.23, i = floor(g), f = g - i - 0.5, a = abs(f);
    vec2 h = hash22(i + 5.0) - 0.5;
    float box = pow(pow(a.x, 8.0) + pow(a.y, 8.0), 0.125), face = smoothstep(0.45, 0.42, box), slope = smoothstep(0.28, 0.43, box);
    vec2 out_ = f * (0.5 + 2.0 * slope) * -0.23 + h * 0.06 + 0.012 * (vec2(noise(p * 23.0), noise(p * 23.0 + 7.0)) - 0.5);
    p += -uOwn[4] * out_;
    pane *= mix(vec3(1.0), vec3(mix(0.025 * smoothstep(0.5, 0.45, box), 0.72 + 0.4 * (1.0 - slope) + 0.45 * slope * dot(f, vec2(-0.6, 0.8)), face)), -uOwn[4]);
    shine += -uOwn[4] * face * vec3(0.8, 0.85, 0.9) * (0.1 * smoothstep(0.02, 0.0, abs(box - 0.405)) * sat(0.4 - f.x + f.y) + 0.026);
  }
  vec3 col = uVar > 0.5 ? meGels(p) : meFrosted(p);
  if (uOwn[4] != 0.0 || uOwn[5] > 0.0) col = col * pane + shine;
  if (uOwn[5] < 0.0) { float dark = meLeaves(at); col *= 1.0 - dark * mix(vec3(0.82), vec3(0.8, 0.68, 0.6), max(uOwn[3], 0.0)); }
  col *= 1.0 - (uOwn[3] > 0.0 ? mix(0.3, 0.1, uOwn[3]) : 0.3) * dot(at, at);
  return meFilm(col);
}
