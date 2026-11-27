// name: Glass skeletons
// a: Turning lattice
// b: Scattered sand
// what: A ball of glass lattice, six-sided windows with twelve five-sided among them, turns slowly with a smaller ball inside it and twelve long needles, under one lamp on deep blue-grey; or many small glass shells of seven builds, balls, plates, bells, stars and boats, lie like sand on a pale grey slide, some out of focus.
// follows: The bands open the windows; the drone lights the inner ball, the phrase lengthens the needles, the piece colours the edges of the bars; a hit sends a ring of light round the shell, a cue swings the lamp round. On the slide each kind has shells of its own, which come into focus and take its colour, and the piece tints what lies at its place.
// own: 0 1 a crowd of small ones, -1 so near that a few fill the picture; 1 1 long stout needles, -1 no needles; 2 1 drawn out tall as eggs and spindles, -1 pressed flat as lenses; 3 the ground: 1 bright, in the colour of the hits, -1 dark, in the colour of the drone; 4 1 opaque chalk in the colours of the kinds, -1 every window filled with a coloured pane; 5 1 broken, with great pieces gone, -1 the inner ball grown large (b: laid out in rows); 6 the light: 1 from within each, -1 from behind; 7 1 motes sink past (b: all of it sinks), -1 drawn in hatched lines of the drone on paper of the hits
// the numbers of its own by name
float gsCrowd, gsNear, gsThorn, gsBald, gsDay, gsDark, gsChalk, gsPane, gsLost, gsInner, gsGlow, gsBack2, gsSink, gsHatch;
float gsPx, gsRi, gsFar;
vec3 gsCol, gsCore, gsC;
const float GS_FAR = 4.6, GS_LENS = 4.6;
vec3 gsLamp, gsFace;
const vec3 GS_E0 = vec3(0.0, 1.0, 0.0), GS_E1 = vec3(-0.80902, -0.30902, 0.5), GS_E2 = vec3(0.80902, -0.30902, 0.5);
const vec3 GS_M = vec3(-0.5, -0.80902, 0.30902);
vec2 gsS[4]; vec3 gsK;
vec3 gsFold(vec3 d) {
  for (int i = 0; i < 3; i++) {
  gsS[i] = 1.0 - 2.0 * vec2(lessThan(d.xy, vec2(0.0)));
  d.xy *= gsS[i];
  gsK[i] = dot(d, GS_M) < 0.0 ? 2.0 : 0.0;
  d -= gsK[i] * dot(d, GS_M) * GS_M;
  }
  gsS[3] = 1.0 - 2.0 * vec2(lessThan(d.xy, vec2(0.0)));
  d.xy *= gsS[3];
  return d;
}
vec3 gsUnfold(vec3 g) {
  g.xy *= gsS[3];
  for (int i = 2; i >= 0; i--) { g -= gsK[i] * dot(g, GS_M) * GS_M; g.xy *= gsS[i]; }
  return g;
}
// The windows: x is 0 in the middle of a window and 1 on the bar between two, rounded; y is how near a knot of three bars.
vec2 gsWeb(vec3 d, float n, out vec3 g) {
  vec3 a = vec3(dot(d, GS_E0), dot(d, GS_E1), dot(d, GS_E2));
  a = a + a * a * a * 0.19;
  a *= n / (a.x + a.y + a.z);
  vec3 c = floor(a + 0.5), r = abs(a - c);
  if (r.x > r.y && r.x > r.z) c.x = n - c.y - c.z; else if (r.y > r.z) c.y = n - c.x - c.z; else c.z = n - c.x - c.y;
  r = a - c; gsC = c;
  float hi = max(r.x, max(r.y, r.z)), lo = min(r.x, min(r.y, r.z)), rho = sqrt(2.0 * dot(r, r));
  g = -(r.x * GS_E0 + r.y * GS_E1 + r.z * GS_E2);
  g -= d * dot(d, g);
  g /= max(length(g), 1e-4);
  return vec2(mix(hi - lo, rho, 0.5), smoothstep(1.0, 1.15, rho));
}
vec3 gsGlass(vec3 m, vec3 v, vec3 l) {
  const vec3 warm = vec3(1.0, 0.955, 0.88);
  float nv = sat(-dot(m, v)), f = 1.0 - nv; f *= f; f = 0.05 + 0.95 * f * f;
  vec3 r = reflect(v, m);
  float k = sat(dot(r, l) * 0.5 + 0.5); k *= k; k *= k;
  vec3 c = (warm * k * 1.5 + vec3(0.11, 0.19, 0.29) * (0.55 - 0.45 * dot(r, l))) * f;
  float h = sat(dot(r, l)); h *= h; h *= h; h *= h; float h2 = h * h; h2 *= h2;
  c += warm * (h * 0.22 + h2 * (2.4 + 1.6 * uTone));
  const vec3 bend = vec3(0.5, 0.72, 1.0);
  vec3 split = (dot(v, l) - bend * dot(m, l)) * inversesqrt(1.0 + bend * bend + 2.0 * bend * nv);
  split = max(split, 0.0); split *= split; split *= split * split;
  c += split * warm * 1.5;
  float wrap = sat(0.3 + 0.7 * dot(m, l));
  return c + vec3(0.075, 0.1, 0.125) * wrap * wrap * (0.8 + 0.8 * uLevel);
}
float gsSq(float x) { return x * x; }
vec2 gsBall(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd), h = b * b - dot(ro, ro) + r * r;
  return h < 0.0 ? vec2(-1.0) : vec2(-b - sqrt(h), -b + sqrt(h));
}
const float gsR = 0.272;
float gsBar(vec3 o) { return 0.31 - 0.15 * sat(band(0.5 + 0.48 * o.y) * 1.3); }
float gsThrough(vec3 pos) {
  vec3 q = pos + gsLamp * gsBall(pos, gsLamp, gsR).y, d = q / gsR, g;
  float bar = gsBar(d);
  return 0.25 + 1.1 * smoothstep(bar - 0.12, bar + 0.4, 1.04 - gsWeb(gsFold(d), 5.0, g).x);
}
void gsShell(vec3 ro, vec3 rd, float t, float r, float n, float bar, float blur, float gain, vec3 tint, inout vec3 col, inout float left) {
  vec3 pos = ro + rd * t, o = pos / r, d = gsFold(o), g;
  float side = dot(o, rd) < 0.0 ? 1.0 : -1.0, nv = abs(dot(o, rd));
  vec2 w = gsWeb(d, n, g);
  float e = max(1.04 - w.x, 0.0), unit = n / 0.553;
  float spoke = dot(d, GS_M) * unit + 0.05;
  if (d.x * 0.5257 + d.z * 0.8507 > 1.0 - 0.5 * 0.9 / (unit * unit) && spoke < e) { e = spoke; g = GS_M; }
  float px = (gsPx + blur) * unit / (r * max(nv, 0.16));
  bar += 0.12 * w.y + 0.13 * gsChalk * (1.0 - 0.7 * gsNear);
  float cover = (1.0 - smoothstep(bar - px, bar + px, e)) * min(1.0, 2.0 * bar / (px + bar));
  if (gsLost > 0.0) {
  vec3 b = o + 0.16 * gsUnfold(g) * (1.0 - e);
  cover *= smoothstep(-0.02, 0.02, sin(b.x * 2.9 + 0.6) + sin(b.y * 3.3 + 2.1) + 0.8 * sin(b.z * 4.1 + b.x * 2.0) + 2.2 - 3.1 * gsLost);
  }
  if (gsPane > 0.0) {
  float in1 = (1.0 - cover) * smoothstep(0.0, 0.2, e);
  float h = fract(dot(gsC, vec3(0.31, 0.57, 0.83)) + 0.2);
  int ki = int(h * 3.9);
  float on = ki == 0 ? uDrone : ki == 1 ? uPad : ki == 2 ? uTexture : uPhrase;
  vec3 k = kindColour(h * 3.9), lit2 = (0.65 + 0.9 * on + 0.5 * uHits) * k * k * (0.2 + 0.8 * pow(sat(0.5 + 0.5 * dot(o, gsLamp)), 3.0) + 1.5 * gsGlow * (0.4 + uLevel) * (side > 0.0 ? 1.0 : 0.3)) * (0.5 + 0.8 * band(0.5 + 0.48 * o.y));
  col += left * in1 * gsPane * gain * lit2 * 0.75 * (1.0 - 0.7 * gsDay);
  left = mix(left, left * (0.25 + 0.2 * e), in1 * gsPane * (1.0 - gsDay)); gsCol *= mix(vec3(1.0), 0.35 + 0.65 * k, in1 * gsPane * gsDay);
  }
  if (cover < 0.003) return;
  float ring = acos(clamp(dot(o, gsFace), -1.0, 1.0)) - 0.35 - (1.0 - uHits) * 2.8;
  ring = exp(-ring * ring * 18.0) * uHits;
  float s = sat(e / (bar + 0.5 * px));
  vec3 m = normalize(o * side * sqrt(1.0 - s * s * 0.96) + gsUnfold(g) * s);
  vec3 c = gsGlass(m, rd, gsLamp);
  if (r < 0.2) { if (side > 0.0) c *= gsThrough(pos); } else if (side < 0.0) c *= 0.75;
  float lit = sat(0.5 + 0.5 * dot(o, gsLamp)); c *= 0.3 + 3.2 * lit * lit * lit; c *= 1.0 + uCue * lit;
  c += tint * (0.07 + 0.6 * s * s) * (0.45 + lit);
  if (r > 0.2) c += uKind[2] * uTexture * w.y * (0.5 + 0.9 * lit) + mix(vec3(1.0), uKind[4], 0.6) * ring * 2.4;
  else c += (uKind[3] * uKeys + vec3(0.9, 0.8, 0.7) * uMic) * (0.15 + w.y);
  vec3 chalk = mix(uKind[1], uKind[2], smoothstep(-0.5, 0.6, o.y + 0.3 * sin(o.x * 3.0)));
  float lam = sat(0.35 + 0.65 * dot(m, gsLamp));
  c = mix(c, chalk * chalk * (0.06 + 1.5 * lam * lam) * (0.7 + 0.3 * uLevel + 0.4 * uPad + 0.3 * uTexture) * (side > 0.0 ? 1.0 : 0.35) + tint * 0.4 + ring * 1.2, gsChalk);
  c = mix(c, c * 0.16, max(gsBack2, gsDay * (1.0 - gsChalk))) + gsCore * gsGlow * (side > 0.0 ? 0.12 + 0.25 * s * s : 0.6) * (r > 0.2 ? 1.0 : 1.6);
  col += left * cover * c * gain;
  left *= 1.0 - cover * mix(mix(0.26 + 0.34 * s, 0.8 + 0.15 * s, max(gsDay, gsBack2) * (side > 0.0 ? 1.0 : 0.5)), 1.0, gsChalk);
}
void gsOver(inout vec3 col, inout float left, vec4 w) { col += left * w.rgb; left *= w.a; }
// Motes that sink past.
vec3 gsMotes(vec2 p) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3 && gsSink > 0.0; i++) {
  float f = float(i), z = 7.0 + 6.0 * f;
  vec2 w = p * z + vec2(f * 5.0 + 0.3 * sin(uTime * 0.11 + f + p.y * 3.0), uTime * (0.2 + 0.1 * f)), id = floor(w);
  id.y = mod(id.y, 256.0);
  vec2 h = hash22(id + f * 19.0);
  float r = 0.03 + 0.09 * h.y * h.y;
  c += smoothstep(r, r * 0.3, length(fract(w) - 0.5 - 0.7 * (h - 0.5))) * step(h.x, 0.45) * mix(vec3(0.7), kindColour(h.y * 4.0), 0.5) * (0.25 + 0.45 * uBands[i * 4 + 2]);
  }
  return c * gsSink * (1.0 - 1.6 * gsDay);
}
vec3 gsLattice(vec2 p) {
  float wide = uRes.x / uRes.y;
  p *= 1.0 + 0.22 * (1.0 - smoothstep(0.5, 1.0, wide));
  vec2 mid = vec2(-0.17 * smoothstep(0.8, 1.6, wide), 0.012), bg = p;
  float own1 = 0.0, size1 = 1.0;
  mid *= 1.0 - gsCrowd; mid += gsNear * vec2(0.3, -0.12);
  if (gsCrowd > 0.0) {
  p *= 1.0 + 2.6 * gsCrowd;
  p.y += 0.03 * uTime * gsSink;
  vec2 cell = vec2(1.18, 1.06), id = floor(p / cell + 0.5);
  p.x += 0.5 * cell.x * mod(id.y, 2.0) * gsCrowd; id.x = floor(p.x / cell.x + 0.5);
  p -= id * cell;
  vec2 h = hash22(mod(id, 64.0) + 7.0);
  if (id != vec2(0.0)) { own1 = h.x; }
  size1 = mix(1.0, 0.95 + 0.8 * h.y, gsCrowd);
  p = (p - 0.42 * (h - 0.5) * gsCrowd) * size1;
  gsPx *= (1.0 + 2.6 * gsCrowd) * size1;
  }
  float nearer = 1.0 - 0.62 * gsNear;
  p = (p - mid) * nearer + mid; gsPx *= nearer;
  vec2 q = (bg - vec2(mid.x - 0.16, 0.2)) * vec2(0.8, 1.0);
  vec3 ground = mix(vec3(0.0045, 0.0075, 0.011), vec3(0.04, 0.057, 0.077), exp(-dot(q, q) * 3.4));
  if (gsDark > 0.0) ground = mix(ground, uKind[0] * uKind[0] * mix(0.02, 0.34, exp(-dot(q, q) * 2.6)), gsDark);
  if (gsDay > 0.0) ground = mix(ground, uKind[4] * uKind[4] * mix(1.0, 2.6, exp(-dot(q, q) * 1.6)) * (0.85 + 0.15 * uLevel + 0.12 * uDrone + 0.1 * uPad), gsDay);
  float out1 = length(bg - mid) - 0.95 + 0.75 * uHits;
  ground *= 1.0 + gsDay * uHits * (0.9 - 1.5 * gsHatch) * exp(-60.0 * out1 * out1);
  if (gsBack2 > 0.0) ground += gsBack2 * uKind[4] * uKind[4] * (0.55 + 0.35 * uLevel + 0.45 * uDrone + 0.35 * uPad) * (1.5 * smoothstep(0.43, 0.2, length(bg - mid)) + 0.5 * exp(-4.0 * length(bg - mid)));
  vec3 ro = vec3(0.0, 0.0, -GS_FAR), rd = normalize(vec3(p - mid, GS_LENS));
  float a = TAU * fract(uTime / 120.0 + own1), tilt = 0.42 + 0.06 * sin(TAU * fract(uTime / 170.0));
  mat3 ya = mat3(cos(a), 0.0, sin(a), 0.0, 1.0, 0.0, -sin(a), 0.0, cos(a));
  mat3 xa = mat3(1.0, 0.0, 0.0, 0.0, cos(tilt), -sin(tilt), 0.0, sin(tilt), cos(tilt));
  mat3 za = mat3(cos(0.35), -sin(0.35), 0.0, sin(0.35), cos(0.35), 0.0, 0.0, 0.0, 1.0);
  mat3 turn = ya * xa * za;
  float la = 2.35 + 0.3 * sin(TAU * uLoop) + 1.4 * 4.0 * uCue * (1.0 - uCue);
  gsLamp = turn * normalize(vec3(cos(la), sin(la), -0.45));
  gsFace = turn * normalize(vec3(-0.5, 0.35, -0.8));
  ro = turn * ro; rd = turn * rd;
  if (uOwn[2] != 0.0) {
  float k = exp2(0.75 * uOwn[2]);
  vec3 w = vec3(sqrt(k), 1.0 / k, sqrt(k));
  ro *= w; rd = normalize(rd * w);
  gsFar = length(ro);
  }
  float tm = -dot(ro, rd);
  gsCore = uKind[0] * (uDrone * (0.9 + uEnergy) + gsGlow * (0.5 + 1.1 * uLevel));
  gsCol = vec3(1.0);
  vec2 A = gsBall(ro, rd, gsR), B = gsBall(ro, rd, gsR * 0.94), C = gsBall(ro, rd, gsRi);
  const vec4 none = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 lay[4] = vec4[4](none, none, none, none);
  float reach = gsR * mix(1.85 + 0.2 * uSpace + 0.35 * uPhrase, 0.9, gsBald) * (1.0 - 0.2 * gsCrowd);
  for (int k = 0; k < 6; k++) {
  float u = (k & 1) == 0 ? 1.0 : -1.0;
  vec3 ax = k < 2 ? vec3(0.5257 * u, 0.0, 0.8507) : k < 4 ? vec3(0.0, 0.8507, 0.5257 * u) : vec3(0.8507, 0.5257 * u, 0.0);
  float b = dot(rd, ax), s = (dot(ro, ax) + b * tm) / max(1.0 - b * b, 1e-3);
  float len = reach * (s > 0.0 ? 1.0 + 0.12 * u : 1.06 - 0.1 * u);
  float sc = sign(s) * clamp(abs(s), gsRi * 0.8, len);
  float t = sc * b + tm;
  vec3 wv = ro + rd * t - ax * sc;
  float dist = length(wv);
  if (dist > 0.022 + 0.03 * gsThorn) continue;
  float f = (abs(sc) - gsR) / (len - gsR);
  float body = 1.0 - max(f, 0.0), root = (abs(sc) - gsR) * 42.0;
  float rad = 0.0016 + 0.0078 * body * (1.0 - 0.4 * max(f, 0.0)) * smoothstep(-2.0, 1.0, root) + 0.0028 * step(f, 0.0) * (1.0 - smoothstep(-2.0, 1.0, root)) + 0.0035 * exp(-root * root);
  rad *= (1.0 + 1.6 * gsThorn * max(body, 0.2)) * (1.0 - gsBald);
  if (rad < 1e-5) continue;
  float px = gsPx + abs(t - gsFar + 0.2) * 0.003;
  if (dist > rad + px) continue;
  float cover = (1.0 - smoothstep(rad - px, rad + px, dist)) * min(1.0, 2.0 * rad / (rad + px));
  float x = min(dist / (rad + 0.3 * px), 1.0);
  vec3 m = normalize(wv / max(dist, 1e-5) * x - rd * sqrt(1.0 - x * x * 0.96));
  vec3 e1 = normalize(cross(ax, vec3(0.3, 0.2, 0.9))), e2 = cross(ax, e1);
  float lampy = sat(0.5 + 0.5 * dot(ax, gsLamp) * sign(sc)); lampy *= lampy;
  float blade = cos(3.0 * atan(dot(m, e1), dot(m, e2) + 1e-4) + s * 16.0);
  vec3 c = gsGlass(m, rd, gsLamp);
  c = c * (0.5 + 0.9 * smoothstep(-0.3, 0.5, blade)) + vec3(0.5, 0.57, 0.62) * smoothstep(0.75, 1.0, blade) * (0.2 + 0.5 * lampy);
  c = c * (1.2 + 0.6 * lampy) + uKind[3] * uPhrase * smoothstep(0.0, 0.8, f) * (0.06 + 0.7 * x * x);
  int g = abs(sc) < gsR ? (t < tm ? 1 : 2) : t < tm ? 0 : 3;
  if (f < 0.0) c *= 0.6;
  c = mix(c, uKind[3] * uKind[3] * (0.3 + 1.5 * gsSq(sat(0.35 + 0.65 * dot(m, gsLamp)))), gsChalk);
  c *= 1.0 - 0.7 * max(gsBack2, 0.8 * gsDay * (1.0 - gsChalk));
  lay[g].rgb += lay[g].a * cover * c; lay[g].a *= 1.0 - cover * mix(0.35 + 0.35 * x, 1.0, max(gsChalk, 0.7 * max(gsDay, gsBack2)));
  }
  vec3 light = vec3(0.0); float left = 1.0;
  gsOver(light, left, lay[0]);
  vec3 at = (ro + rd * max(A.x, 0.0)) / gsR;
  float bar = gsBar(at), far = gsBar((ro + rd * A.y) / gsR);
  vec3 tint = vec3(0.0);
  if (A.x > 0.0) {
  float lon = 0.5 + atan(at.x, at.z + 1e-4) / TAU;
  tint = 2.6 * smoothstep(0.0, 0.06, min(lon, 1.0 - lon)) * piece(vec2(lon, 0.5 - 0.5 * at.y)).rgb;
  gsShell(ro, rd, A.x, gsR, 5.0, bar, 0.0, 1.0, tint, light, left);
  if (B.x > 0.0 && left > 0.7) gsShell(ro, rd, B.x, gsR * 0.94, 5.0, bar * 0.8, 0.0006, 0.5, tint, light, left);
  }
  gsOver(light, left, lay[1]);
  vec3 core = gsCore;
  float near2 = dot(ro + rd * tm, ro + rd * tm) / (gsRi * gsRi);
  if (C.x > 0.0) gsShell(ro, rd, C.x, gsRi, 3.0, 0.3, 0.0004, 0.95, core, light, left);
  light += left * core * (0.75 * exp(-near2 * 5.0) + 0.07 * exp(-near2 * 0.45));
  if (C.x > 0.0 && left > 0.25) gsShell(ro, rd, C.y, gsRi, 3.0, 0.3, 0.001, 0.6, core, light, left);
  gsOver(light, left, lay[2]);
  if (A.x > 0.0 && left > 0.2) gsShell(ro, rd, A.y, gsR, 5.0, far, 0.0028, 0.6, uKind[1] * uPad * 1.3, light, left);
  gsOver(light, left, lay[3]);
  return screenOf(light + ground * gsCol * left) + gsMotes(bg);
}
// ---- the slide ----
float gsT, gsOpen, gsLong;
float gsIn, gsBack, gsHole;
float gsRod(float e, float bar) { float b = bar + gsT, x = e / b; return max(0.0, 1.0 - x * x) * bar / b; }
float gsStick(vec2 q, vec2 a, vec2 b, float r0, float r1) {
  vec2 d = b - a; float k = sat(dot(q - a, d) / dot(d, d));
  return gsRod(length(q - a - d * k), mix(r0, r1, k) * (1.0 + 0.7 * gsThorn)) * (1.0 - gsBald * step(0.03 * gsBald, abs(r0 - r1)));
}
float gsCell(vec3 d, float n, float bar) { vec3 g; return gsRod(max(1.04 - gsWeb(gsFold(d), n, g).x, 0.0), bar); }
float gsHex(vec2 q, float bar) {
  q.y *= 1.1547; q.x += 0.5 * mod(floor(q.y), 2.0);
  vec2 c = fract(q) - 0.5; return gsRod(max(0.52 - length(c), 0.0) * 2.0, bar);
}
mat2 gsA, gsB;
// How thick the glass is at q (the shell is about 1 in radius), for each of seven builds.
float gsThick(vec2 q, int build, float seed, bool back) {
  float r = length(q), h = 0.0, an = atan(q.y, q.x + 1e-5), bar = 0.42 - 0.2 * gsOpen;
  if (build == 0 || build == 5) {
  vec2 s = build == 5 ? q * vec2(1.45, 1.0) : q;
  float m = dot(s, s); gsIn = 1.0 - m;
  if (m < 1.0) {
  float z = sqrt(1.0 - m); vec3 d = vec3(s, z);
  d.yz *= gsA; d.xz *= gsB; float n = seed > 0.5 ? 4.0 : 3.0;
  float rim = smoothstep(0.0, 0.02 + 0.3 * gsT, 1.0 - m);
  h = gsCell(d, n, bar) * rim;
  if (back) { d = vec3(s * 1.04, -z); d.yz *= gsA; d.xz *= gsB; gsBack = gsCell(normalize(d), n, bar) * rim; }
  }
  h = max(h, gsRod(sqrt(m) - 0.985, 0.035));
  if (build == 5) return max(h, gsStick(vec2(q.x, abs(q.y)), vec2(0.0, 0.95), vec2(0.0, 1.25 + 0.35 * gsLong), 0.08, 0.012));
  float k = floor(an / TAU * 11.0 + 0.5), f = an - k * TAU / 11.0;
  vec2 w = r * vec2(cos(f), sin(f));
  return max(h, gsStick(w, vec2(0.97, 0.0), vec2(1.2 + 0.28 * gsLong + 0.14 * sin(k * 2.0 + seed * 9.0), 0.0), 0.06, 0.012));
  }
  if (build == 1) {
  gsIn = 1.0 - r; float rings = 5.0, k = floor(r * rings), f = fract(r * rings);
  h = gsRod(0.5 - abs(f - 0.5), 0.16) * step(r, 1.0) + gsRod((r - 1.0) * 4.0, 0.16) * step(1.0, r);
  float n = 5.0 + k * 6.0, c = abs(fract(an / TAU * n + k * 0.37) - 0.5);
  if (r < 1.0 && k > 0.0) h = max(h, 0.8 * gsRod((0.5 - c) * TAU * r / n * rings, 0.15));
  return h * (1.0 - 0.3 * r);
  }
  if (build == 2) {
  float f = (fract(an / TAU * 3.0 + 0.5) - 0.5) * TAU / 3.0;
  vec2 w = r * vec2(cos(f), sin(f));
  float k = sat(w.x), d = length(w - vec2(k * 0.82, 0.0)) - (0.25 - 0.1 * k + 0.22 * smoothstep(0.45, 0.95, k));
  gsIn = -d * 4.0; h = gsRod(abs(d), 0.035);
  if (d < 0.0) h = max(h, gsHex(q * 7.0, bar * 1.3) * 0.8);
  return max(h, gsStick(w, vec2(1.1, 0.0), vec2(1.2 + 0.2 * gsLong, 0.0), 0.05, 0.01));
  }
  if (build == 3) {
  float y = q.y, v = sat((0.72 - y) / 1.42);
  float w = 0.72 * sqrt(v) * (0.9 - 0.1 * cos(v * 18.0)) * (1.0 - 0.15 * v * v);
  if (y < 0.72 && y > -0.72) {
  gsIn = (w - abs(q.x)) * 2.0; h = gsRod(abs(abs(q.x) - w), 0.04);
  if (abs(q.x) < w) {
    vec2 u = vec2(asin(clamp(q.x / max(w, 1e-3), -1.0, 1.0)) * 3.4, y * 7.0);
    h = max(h, gsHex(u, bar * 1.2) * 0.85 * smoothstep(-0.72, -0.64, y));
    h = max(h, gsRod(abs(abs(v - 0.43) - 0.26), 0.03));
  }
  }
  h = max(h, gsStick(q, vec2(0.0, 0.7), vec2(0.08, 1.0 + 0.3 * gsLong), 0.06, 0.012));
  vec2 b = vec2(abs(q.x), y);
  return max(h, max(gsStick(b, vec2(0.5, -0.7), vec2(0.72, -1.05 - 0.2 * gsLong), 0.055, 0.012), gsStick(q, vec2(0.06, -0.7), vec2(0.02, -1.0 - 0.2 * gsLong), 0.05, 0.012)));
  }
  if (build == 4) {
  float k = floor(an / TAU * 14.0 + 0.5), f = an - k * TAU / 14.0, len = 0.9 + 0.3 * gsLong + 0.22 * cos(k * PI);
  vec2 w = r * vec2(cos(f), sin(f));
  h = gsStick(w, vec2(0.05, 0.0), vec2(len, 0.0), 0.045, 0.012);
  h = max(h, gsStick(w, vec2(0.4, -0.1), vec2(0.4, 0.1), 0.03, 0.03));
  return max(h, gsRod(r, 0.16));
  }
  float a = sat(1.0 - q.x * q.x), w = 0.3 * a * (1.0 + 0.25 * a), d = abs(q.y) - w;
  if (abs(q.x) > 1.05) return 0.0;
  gsIn = -d * 3.0; h = gsRod(abs(d), 0.035);
  if (d < 0.0) h = max(max(h, gsRod(q.y, 0.03)), 0.6 * gsRod(0.5 - abs(fract(q.x * 11.0 + abs(q.y) * 1.5) - 0.5), 0.22) * smoothstep(0.05, 0.09, abs(q.y)));
  return h * (1.0 - smoothstep(0.97, 1.05, abs(q.x)));
}
const int GS_N = 26;
const vec4 GS_AT[GS_N] = vec4[GS_N](
  vec4(-0.37, 0.09, 0.178, 0.0), vec4(0.4, 0.17, 0.15, 3.0), vec4(0.17, -0.17, 0.105, 5.0), vec4(0.03, 0.29, 0.1, 1.0), vec4(-0.12, -0.33, 0.1, 2.0),
  vec4(-0.67, -0.27, 0.125, 4.0), vec4(0.66, -0.19, 0.15, 6.0), vec4(0.42, -0.35, 0.07, 0.0), vec4(-0.75, 0.27, 0.075, 1.0), vec4(0.73, 0.36, 0.06, 0.0),
  vec4(-0.42, -0.36, 0.055, 3.0), vec4(-0.01, 0.01, 0.05, 4.0), vec4(0.14, 0.12, 0.04, 0.0), vec4(-0.22, 0.4, 0.06, 6.0), vec4(0.22, 0.43, 0.04, 5.0),
  vec4(-0.72, 0.05, 0.035, 1.0), vec4(0.29, -0.45, 0.035, 1.0), vec4(0.83, 0.07, 0.065, 2.0), vec4(-0.93, -0.05, 0.1, 5.0), vec4(0.98, -0.36, 0.11, 0.0),
  vec4(1.08, 0.2, 0.1, 3.0), vec4(-1.12, 0.26, 0.11, 2.0), vec4(-1.08, -0.35, 0.09, 1.0), vec4(0.0, -0.46, 0.03, 4.0), vec4(0.57, 0.43, 0.035, 4.0), vec4(-0.5, 0.42, 0.04, 2.0));
vec4 gsAt(int i) {
  vec4 a = GS_AT[i];
  if (gsInner <= 0.0) return a;
  return vec4(mix(a.xyz, vec3((float(i % 7) - 3.0) * 0.27, (float(i / 7) - 1.5) * 0.245, 0.09), gsInner), a.w);
}
vec3 gsSlide(vec2 p) {
  p.x -= 0.34 * (1.0 - smoothstep(0.6, 1.0, uRes.x / uRes.y));
  p += 0.02 * vec2(sin(TAU * fract(uTime / 140.0)), cos(TAU * fract(uTime / 190.0)));
  float la = 2.35 + 0.3 * sin(TAU * uLoop) + 1.4 * 4.0 * uCue * (1.0 - uCue), px = gsPx;
  vec2 lamp = vec2(cos(la), sin(la)), q = p - lamp * 0.25;
  vec3 col = mix(vec3(0.47, 0.525, 0.56), vec3(0.84, 0.868, 0.875) + 0.05 * uTone, exp(-dot(q, q) * (1.9 - 0.3 * uMic))) * (1.0 + 0.1 * uCue * exp(-dot(q, q) * 5.0));
  float lum = dot(col, vec3(0.333));
  if (gsDark > 0.0) col = mix(col, uKind[0] * (0.05 + 0.3 * lum * lum), gsDark);
  if (gsDay > 0.0) col = mix(col, uKind[4] * (0.35 + 0.75 * lum), gsDay);
  if (gsCrowd + gsNear + gsSink > 0.0) {
  float k = (1.0 + 1.25 * gsCrowd) * (1.0 - 0.6 * gsNear);
  p = p * k + gsNear * vec2(0.1, 0.06); px *= k;
  p.y += 0.02 * uTime * gsSink;
  float sky = floor(p.y / 1.08 + 0.5);
  p.x += 0.83 * mod(sky, 2.0) * min(gsCrowd + gsSink, 1.0);
  if (gsCrowd + gsSink > 0.0) { p.y -= 1.08 * sky; p.x -= 2.5 * floor(p.x / 2.5 + 0.5); }
  }
  vec2 gq = rot(0.5) * p * 9.0, gi = floor(gq), gh = hash22(gi + 2.0);
  vec2 gc = normalize(gh - 0.5003), gd = mat2(gc, -gc.y, gc.x) * (fract(gq) - 0.5 - (gh.yx - 0.5) * 0.4);
  float long1 = step(0.6, gh.x) * 0.24 * gh.y, k1 = sat(gd.x / max(long1, 1e-3) * 0.5 + 0.5);
  gd.x -= clamp(gd.x, -long1, long1);
  float gr = long1 > 0.0 ? 0.004 + 0.014 * k1 : 0.012 + 0.04 * gh.y * gh.y, soft = px * 9.0 + 0.035 * fract(gh.y * 7.0), gl = length(gd);
  col *= 1.0 - 0.4 * step(0.5, hash21(gi + 9.0)) * gr / (gr + soft) * (1.0 - smoothstep(gr - soft, gr + soft, gl) - 0.9 * (1.0 - smoothstep(0.0, gr * 0.7, gl + soft)));
  int at = 0; float best = 1e3;
  for (int i = 0; i < GS_N; i++) { vec4 A = gsAt(i); vec2 d = p - A.xy; float k = dot(d, d) / (A.z * A.z); if (k < best) { best = k; at = i; } }
  float rw = length(p - GS_AT[0].xy) - 0.1 - (1.0 - uHits) * 0.3;
  float wide2 = exp2(0.5 * abs(uOwn[2]));
  vec3 rim = (uKind[4] * 0.6 + 0.3) * exp(-rw * rw * 800.0) * uHits;
  if (best > (int(GS_AT[at].w) % 5 == 1 ? 2.05 : 2.65) * (wide2 * wide2 + 1.6 * gsThorn)) return col + 0.06 * rim;
  vec4 s = gsAt(at); vec2 d = p - s.xy; float r = s.z;
  float seed = hash11(float(at) + 0.7), seed2 = hash11(float(at) + 5.3);
  int kind = at % 5, build = int(s.w);
  float loud = kind == 0 ? uDrone : kind == 1 ? uPad : kind == 2 ? uTexture : kind == 3 ? uPhrase : uKeys;
  vec4 here = piece(vec2(0.5 + s.x * 0.5, 0.5 - s.y));
  float out1 = (at % 4 == 0 ? 0.05 : at % 4 == 2 ? 1.25 : 0.25 + 0.5 * seed2) * (1.0 - 0.65 * loud);
  gsOpen = sat(band(float(at) / 25.0) * 1.2); gsLong = uPhrase + 1.2 * gsThorn;
  float blur = out1 * out1 * 0.008 * (0.7 + 0.6 * uSpace);
  gsT = (px * 0.9 + blur) / r;
  mat2 m = rot(seed * TAU + (seed2 - 0.5) * 0.9 * sin(TAU * fract(uTime / 160.0 + seed)));
  vec2 u = m * d / r, L = m * lamp;
  if (uOwn[2] != 0.0) u *= exp2(0.5 * uOwn[2] * vec2(1.0, -1.0));
  float e = (px + blur * 0.5) * 0.8 / r;
  gsA = rot(seed * 6.0 + 0.3); gsB = rot(seed * 4.0); gsBack = 0.0; gsIn = -1.0; gsHole = 1.0;
  float hx = gsThick(u + L * e, build, seed, false), h = gsThick(u, build, seed, true);
  if (gsLost > 0.0) {
  float gone = smoothstep(-0.02, 0.02, u.x * cos(seed * 40.0) + u.y * sin(seed * 40.0) + 0.1 * sin(u.x * 9.0 + u.y * 5.0) + 0.06 * sin(u.y * 17.0) + 1.25 - 1.15 * gsLost * (0.5 + seed2));
  gsHole = 1.0 - 0.7 * gsLost;
  hx *= gone; h *= gone; gsIn = mix(-1.0, gsIn, gone); gsBack *= gone;
  }
  hx -= h;
  float k = 1.0 / (1.0 + 90.0 * blur), steep = max(sat(h * 5.0) * (1.0 - smoothstep(0.1, 0.75, h)) * 0.38, abs(hx) * 1.2), body = smoothstep(-gsT * 2.0, 0.04 + gsT * 4.0, gsIn) * k, over = dot(u, L);
  vec3 tint = uKind[kind] * loud + here.rgb; tint = (tint - dot(tint, vec3(0.333))) * 1.9 / (1.0 + 0.5 * dot(tint, vec3(1.0)));
  float shade = length(u + L * 0.22);
  col *= 1.0 - 0.09 * gsHole * (1.0 - smoothstep(0.75, 1.2, shade)) * (build < 2 || build == 5 ? 1.0 : 0.3) * (1.0 - body);
  col *= 1.0 - body * (0.06 + 0.16 * exp(-max(gsIn, -2.0) * 6.0) - 0.12 * over);
  col *= 1.0 - vec3(0.34, 0.31, 0.28) * gsBack * k;
  col *= 1.0 - vec3(0.95, 0.9, 0.84) * sat(steep * 1.1 - 0.04) * k;
  col *= 1.0 - (0.14 - 0.13 * over) * sat(h * 3.0) * k;
  col += vec3(1.0, 0.985, 0.95) * (h * h * h * (0.36 + 0.16 * over) - hx * 0.4) * k;
  col += tint * (steep * 0.55 - hx * 1.1 + 0.05 * h + 0.05 * body) * k;
  if (gsDark + gsChalk + gsPane + gsGlow + gsBack2 > 0.0) {
  vec3 kc = mix(uKind[kind], kindColour(seed * 4.0), 0.35);
  float live = 0.6 + 0.6 * loud + 0.8 * here.a, lam = sat(0.55 - hx * 5.0);
  col += gsDark * (1.0 - gsChalk) * mix(vec3(0.7, 0.8, 0.85), kc, 0.65) * (h * 0.5 + steep * 0.55 + abs(hx) * 0.9 + 0.06 * body) * k * live;
  col = mix(col, mix(col * (0.3 + 0.9 * kc), kc * live * 0.75, 0.35 + 0.4 * gsDark), gsPane * body * (1.0 - sat(h * 3.0)) * 0.9);
  vec3 pit = mix(col, kc * 0.22, 0.85 * body);
  col = mix(col, mix(pit, kc * (0.55 + 0.8 * lam) * (0.85 + 0.3 * loud) * (0.8 + 0.35 * over), sat(h * 5.0)), gsChalk * sat(max(body, h * 6.0)));
  float in2 = sat(gsIn);
  col += gsGlow * kc * (0.85 * in2 * in2 * body + 0.35 * exp(-2.2 * length(u)) * (1.0 - body)) * (0.4 + 0.9 * live) * (0.35 + 0.65 * (1.0 - gsDay));
  col = mix(col, col * 0.16 + uKind[4] * 0.4 * smoothstep(0.75, 1.05, length(u)) * sat(h * 2.0), gsBack2 * sat(h * 4.0 + body * 0.75 - gsBack * 0.2));
  }
  col += rim * (0.06 + 0.9 * h + (at == 0 ? 0.45 * body : 0.0));
  return sat(col);
}
vec3 render(vec2 p) {
  gsCrowd = max(uOwn[0], 0.0); gsNear = max(-uOwn[0], 0.0); gsThorn = max(uOwn[1], 0.0); gsBald = max(-uOwn[1], 0.0);
  gsDay = max(uOwn[3], 0.0); gsDark = max(-uOwn[3], 0.0); gsChalk = max(uOwn[4], 0.0); gsPane = max(-uOwn[4], 0.0);
  gsLost = max(uOwn[5], 0.0); gsInner = max(-uOwn[5], 0.0); gsGlow = max(uOwn[6], 0.0); gsBack2 = max(-uOwn[6], 0.0);
  gsSink = max(uOwn[7], 0.0); gsHatch = max(-uOwn[7], 0.0);
  gsPx = 1.0 / uRes.y; gsRi = 0.112 + 0.105 * gsInner; gsFar = GS_FAR;
  vec3 col = uVar > 0.5 ? gsSlide(p) : gsLattice(p);
  if (gsHatch > 0.0) {
  float l = 1.0 - sat(dot(col, vec3(0.333))), w = 0.05 * noise(p * 6.0), soft = 0.1 + 150.0 / uRes.y;
  float a = abs(fract((p.x * 0.6 + p.y * 0.8 + w) * 74.0) - 0.5) * 2.0, b = abs(fract((p.x * 0.8 - p.y * 0.6 + w) * 74.0) - 0.5) * 2.0;
  float ink = max(max(smoothstep(-soft, soft, l * 2.2 - 0.55 - a), smoothstep(-soft, soft, l * 2.2 - 0.85 - b)), smoothstep(0.36, 0.5, l));
  col = mix(col, mix(uKind[4] * 1.02, mix(uKind[0] * 0.45, col, 0.25), ink), gsHatch);
  }
  return col;
}
