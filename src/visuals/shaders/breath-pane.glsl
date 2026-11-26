// name: Breath pane
// a: Misted
// b: Greenhouse
// what: A misted window, pale grey and wet, and behind it an evening garden: a house with lit windows, a lamp, a string of lights, one tree. Where sounds are the mist is wiped away in arcs, and drops run down in crooked clean tracks; or a steamed greenhouse pane with dark leaves pressed on it, sharp where they touch and lost behind.
// follows: The mist is wiped where the piece sounds and comes back as it fades. Drone lights the lamp, bands the string of lights or far spots, texture and keys add beads, the phrase draws a finger line with the loop; in the greenhouse each held kind presses its leaf. A hit is a round touch and one falling drop, a cue or a voice breathes mist, travel brings headlights.
float bpPx, bpAsp;
float bpS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float bpBell(float x) { return exp(-x * x); }
// Where the water stands on the glass, worked out once for a pixel.
float bpFog; // mist, 0 wiped clean to 1
float bpRim, bpDrop; // the wet edge of a wiped place; 1 inside a drop
vec2 bpBend; // how far the water shifts what is seen through it
float bpDark, bpGlint; // the dark rim of a drop, its light

vec2 bpUV(vec2 q) { return vec2(q.x / bpAsp + 0.5, 0.5 - q.y); }
// The wiping arm swings about an elbow under the sill.
vec2 bpArc(vec2 p) { vec2 e = p - vec2(0.16, -1.6); float r = length(e); return vec2(atan(e.x, e.y) * 1.6 + 0.16, r - 1.6); }
// How wiped a place is by the sounds there.
float bpWiped(vec2 arc) {
 vec2 u = bpUV(arc), e = min(u, 1.0 - u);
 return piece(clamp(u, 0.0, 1.0)).a * bpS(0.0, 0.07, e.x) * bpS(-0.12, 0.0, e.y);
}
// Lays one drop on the glass. v from its middle in its own radii, r its radius.
void bpLay(vec2 v, float r, float on) {
 float d = length(v), e = bpPx * 1.2 / max(r, 1e-4);
 float m = bpS(1.0 + e, 1.0 - e, d) * on;
 bpFog *= 1.0 - m;
 bpRim *= 1.0 - m;
 bpBend = mix(bpBend, -v * (r * 1.4 + 0.13), m);
 bpDrop = max(bpDrop, m);
 float rim = bpS(0.35, 1.0, d);
 bpDark = mix(bpDark, rim * rim * (0.55 + 0.45 * v.y), m);
 bpGlint = mix(bpGlint, bpS(0.34, 0.12, length(v - vec2(-0.32, 0.42))) + 0.3 * bpS(0.5, 0.95, d) * bpS(0.1, 0.9, -v.y), m);
}
// Standing beads in a grid.
void bpBeads(vec2 p, float scale, float seed, float grow, float share) {
 vec2 g = p * scale, id = floor(g), h = hash22(id + seed);
 float n = fract(h.x * 91.7);
 float r = (0.1 + 0.3 * n * n) * bpS(1.0 - share, 1.15 - share, h.y) * grow;
 vec2 c = 0.5 + (h - 0.5) * (1.0 - 2.0 * r) * 0.9;
 vec2 v = fract(g) - c; v.y *= 0.92;
 if (r > 0.02) bpLay(v / r, r / scale, bpS(0.02, 0.08, r));
}
// A finger's line: where it goes, how fresh it is.
float bpFinger(float x) { return 0.205 + 0.055 * sin(x * 10.0 + 1.0) + 0.026 * sin(x * 23.0) - 0.05 * x; }
float bpFresh(float x) { float u = x / bpAsp + 0.5, age = fract(uLoop - u); return uPhrase * exp(-age * 3.5) * bpS(1.0, 0.96, age) * bpS(0.03, 0.1, u) * bpS(0.97, 0.9, u); }
// How far a drop has run, in stops and starts.
float bpCreep(float x, float h) { float s = 5.0 * x, i = floor(s), f = s - i; return sat((i + bpS(0.15 + 0.4 * h, 1.0, f)) / 5.0); }
// In each column a drop runs a crooked way down from a wet edge.
void bpRuns(vec2 p, float cell, float seed) {
 float g = p.x / cell + seed, id = floor(g);
 float h0 = hash11(mod(id, 512.0) + seed * 7.3);
 float beat = uTime / (26.0 + 30.0 * h0) + h0 * 17.0, turn = mod(floor(beat), 256.0), ph = beat - floor(beat);
 vec2 h = hash22(vec2(id, turn) + seed);
 float n = fract(h.x * 57.3);
 float x0 = (id + 0.5 - seed + (h.x - 0.5) * 0.4) * cell;
 float start = mix(0.46, -0.2, h.y);
 float wet = bpS(0.1, 0.25, bpWiped(bpArc(vec2(x0, start))));
 float own = step(0.73, n); // a few run in silence
 if (own > 0.5) start = mix(0.53, 0.1, h.y * h.y);
 if (n < 0.22) { start = bpFinger(x0) - 0.01; wet = bpS(0.2, 0.5, bpFresh(x0)); }
 float on = max(wet, own) * bpS(0.0, 0.04, ph) * bpS(1.0, 0.8, ph);
 if (on < 0.01) return;
 float wob = (noise(vec2(p.y * 7.0, id * 3.7 + turn)) - 0.5) * 0.3 * cell + 0.028 * cell * sin(p.y * 43.0 + id * 2.3 + 2.0 * sin(p.y * 17.0));
 float dx = p.x - x0 - wob, run = bpCreep(min(ph * 1.3, 1.0), n) * (0.28 + 0.5 * fract(n * 13.0)) + 0.001;
 float down = start - p.y, w = cell * (0.055 + 0.05 * fract(n * 31.0));
 float track = bpS(w + bpPx, w - bpPx, abs(dx) * (1.0 + 0.7 * bpS(run * 0.6, 0.0, down))) * bpS(-0.005, 0.02, down) * bpS(run + 0.002, run - 0.002, down);
 float edge = bpS(w * 0.4, w, abs(dx)) * track;
 bpFog *= 1.0 - 0.92 * track * on * (0.5 + 0.5 * bpS(0.0, run, down));
 bpRim = max(bpRim * (1.0 - track), edge * 0.7 * on);
 bpBend.x += dx / w * 0.035 * track * on;
 float r = w * 1.75;
 vec2 v = vec2(dx, p.y - (start - run)) / r;
 v.y *= v.y > 0.0 ? 0.62 : 1.0; v.x *= v.y > 0.0 ? 1.0 + 0.35 * v.y : 1.0;
 bpLay(v, r, on);
}
// The glass: the mist, what is wiped from it, and the water on it.
void bpGlass(vec2 p, float ghost) {
 bpRim = bpDrop = bpDark = bpGlint = 0.0; bpBend = vec2(0.0);
 vec2 arc = bpArc(p);
 float cloud = noise(p * 2.3 + vec2(0.1 * sin(uTime * 0.05), 3.0)) * 0.6 + noise(p * 6.1 - vec2(0.2 * sin(uTime * 0.03), 0.0)) * 0.4;
 float streak = noise(vec2(arc.x * 1.7, arc.y * 24.0)) * 0.55 + noise(vec2(arc.x * 3.0 + 3.0, arc.y * 85.0)) * 0.45;
 float w = bpWiped(arc + vec2(0.45 * arc.y + 0.05 * sin(arc.y * 15.0 + 2.0) + 0.012 * sin(arc.y * 37.0) + 0.07 * (streak - 0.5), 0.07 * (cloud - 0.5)));
 float f = w * (0.45 + 0.95 * cloud) + (streak - 0.5) * 0.07 + 0.03 * uLevel;
 float clear = bpS(0.15, 0.19, f);
 float film = bpS(0.66, 0.85, streak) * 0.45;
 bpRim = bpBell((f - 0.155) / 0.017) * bpS(0.03, 0.1, w);
 bpFog = (0.8 + 0.2 * bpS(0.25, 0.7, cloud)) * (1.0 - clear * (1.0 - film));
 // an old wipe, half misted over again
 float old = bpS(0.075, 0.03, abs(arc.y - ghost) + (streak - 0.5) * 0.06) * bpS(-0.62, -0.4, arc.x) * bpS(0.35, 0.0, arc.x);
 bpFog *= 1.0 - 0.5 * old * (0.55 + 0.45 * streak);
 bpBend = vec2(0.0, (streak - 0.5) * 0.012) * clear + (cloud - 0.5) * 0.05 * bpRim;
 // the finger's line, with the water it pushed aside
 float fresh = bpS(0.04, 0.35, bpFresh(p.x)), fy = abs(p.y - bpFinger(p.x));
 if (fresh > 0.0 && fy < 0.1) {
  float fs = 0.55 * cos(p.x * 10.0 + 1.0) + 0.6 * cos(p.x * 23.0) - 0.05, fw = 0.0105;
  fy = fy / sqrt(1.0 + fs * fs) + 0.003 * (noise(p * 45.0) - 0.5);
  float line = bpS(fw + 0.0015, fw - 0.0015, fy) * fresh;
  bpFog += 0.25 * fresh * bpBell((fy - fw * 1.35) / 0.004) * (1.0 - clear);
  bpFog *= 1.0 - 0.94 * line;
  bpRim = max(bpRim, 0.6 * line * bpS(0.4 * fw, fw, fy));
 }
 // a cue breathes thick mist that shrinks from its edge; a voice mists the foot of the pane
 float b = length(p - vec2(-0.08, 0.04)) + 0.1 * (cloud - 0.5);
 float breath = bpS(0.0, 0.5, uCue) * bpS(0.34, 0.1, b + 0.16 * (1.0 - uCue));
 breath = max(breath, uMic * 0.8 * bpS(0.3, 0.0, length((p - vec2(0.1, -0.4)) * vec2(0.6, 1.0))));
 bpFog = mix(bpFog, 1.35, breath);
 float dry = 1.0 - sat(breath);
 bpRim *= dry;
 float grow = 0.6 + 0.3 * uTexture + 0.1 * uKeys;
 bpBeads(p, 62.0, 5.0, grow * dry, 0.07 + 0.5 * bpRim + 0.1 * uTexture + 0.1 * uKeys);
 bpBeads(p + 0.37, 25.0, 9.0, grow * dry, 0.02 + 0.22 * bpRim + 0.05 * uTexture + 0.06 * uKeys);
 bpRuns(p, 0.085, 1.0);
 bpRuns(p, 0.034, 40.5);
 // a hit: a touch clears a round place, and one heavy drop runs down from it
 if (uHits > 0.01) {
  float hx = 0.06 + 0.2 * sin(uTime * 0.037), top = 0.16, y = top - 0.02 - 0.6 * (1.0 - uHits), on = bpS(0.0, 0.3, uHits);
  float dx = p.x - hx - 0.035 * (noise(vec2(p.y * 6.0, 2.0)) - 0.5);
  float tap = length(vec2(p.x - hx, (p.y - top - 0.06) * 0.7)) + 0.05 * (streak - 0.5);
  bpFog *= 1.0 - 0.95 * bpS(0.155, 0.125, tap) * uHits;
  bpRim = max(bpRim, on * bpBell((tap - 0.14) / 0.012));
  float wide = 0.011 * bpS(top + 0.02, top - 0.1, p.y) + 1e-4;
  float tr = bpS(wide + bpPx, wide - bpPx, abs(dx)) * step(p.y, top) * step(y, p.y) * on;
  bpFog *= 1.0 - tr; bpBend.x += dx * 3.0 * tr;
  bpLay(vec2(dx * (p.y > y ? 1.15 : 1.0), (p.y - y) * (p.y > y ? 0.55 : 1.0)) / 0.024, 0.024, on);
 }
}
// A soft light of radius r seen through blur b.
float bpLamp(vec2 v, float r, float b) { float k = r * r + b * b; return r * r / k * exp(-dot(v, v) / k); }
float bpCap(vec2 p, vec2 a, vec2 b, float w0, float w1) { vec2 d = b - a; float h = sat(dot(p - a, d) / dot(d, d)); return length(p - a - d * h) - mix(w0, w1, h); }
vec3 bpKind(int i) { vec3 k = uKind[i]; return k * k * 1.6; }
// The garden, as sharp as b is small.
vec3 bpGarden(vec2 q, float b) {
 float s = bpPx * 1.3 + b, e = 0.4 + 0.9 * uEnergy;
 float up = sat((q.y + 0.16) / 0.66);
 vec3 c = mix(vec3(1.05, 0.52, 0.22), vec3(0.5, 0.36, 0.37), bpS(0.0, 0.3, up));
 c = mix(c, vec3(0.12, 0.19, 0.3), bpS(0.15, 0.9, up));
 float st = noise(vec2(q.x * 2.2 + 4.0, q.y * 13.0 + 0.6 * q.x)) * 0.65 + 0.35 * noise(vec2(q.x * 6.0, q.y * 34.0));
 c = mix(c, vec3(0.95, 0.42, 0.27) * (0.4 + 0.6 * (1.0 - up)), bpS(0.5, 0.8, st) * 0.5 * bpS(0.9, 0.2, up));
 vec4 m = piece(bpUV(q));
 c += (m.rgb * m.rgb - 0.35 * m.a) * 0.12 * e;
 c += bpKind(1) * uPad * 0.1 * e * bpS(0.7, 0.1, up);
 // far hills one behind another, and a road where headlights pass
 c = mix(c, vec3(0.27, 0.19, 0.22), bpS(s, -s, q.y + 0.07 - 0.06 * noise(vec2(q.x * 2.0, 1.0))));
 c = mix(c, vec3(0.085, 0.072, 0.095), bpS(s + 0.003, -s, q.y + 0.125 - 0.03 * noise(vec2(q.x * 5.0, 9.0)) - 0.02 * noise(vec2(q.x * 24.0, 4.0))));
 float car = fract(uTravel * 0.011), hx = 1.3 - 2.6 * car;
 vec2 hv = q - vec2(hx, -0.142);
 c += vec3(1.5, 1.2, 0.8) * (bpLamp(hv, 0.01, b) + bpLamp(hv - vec2(0.03, 0.0), 0.01, b)) * bpS(0.0, 0.1, car) * bpS(1.0, 0.9, car) * 1.6;
 // the lawn, and a wet path
 vec3 warm = vec3(2.1, 1.02, 0.3) * (0.7 + 0.6 * uLevel), lc = mix(vec3(1.7, 0.95, 0.42), bpKind(0) * 2.2, 0.4 * uDrone) * (0.8 + 1.7 * uDrone * e + 0.4 * uLow);
 vec2 a = q - vec2(-0.6, -0.02), wg = a - vec2(0.04, -0.09), l = q - vec2(0.16, 0.035);
 float lawn = bpS(s, -s, q.y + 0.17 - 0.026 * noise(vec2(q.x * 21.0, 2.0)));
 if (lawn > 0.0) {
  float deep = sat(-0.165 - q.y), lg = log(0.055 + deep), blade = noise(vec2(q.x * 30.0 / (0.12 + deep), 27.0 * lg));
  vec3 g = mix(vec3(0.03, 0.036, 0.036), vec3(0.01, 0.017, 0.018), bpS(0.0, 0.3, deep)) * (0.75 + 0.6 * blade);
  float pw = 0.012 + 0.17 * deep, path = bpS(pw + s, pw - s, abs(q.x - 0.135 + 0.06 * sin(deep * 9.0) + 0.4 * deep * deep) + pw * 0.25 * (blade - 0.5));
  float wet = mix(noise(vec2(q.x * 10.0 / (0.15 + deep), 22.0 * lg)), 0.5, bpS(0.0, 0.04, b));
  g = mix(g, mix(vec3(0.07, 0.058, 0.06), vec3(0.4, 0.25, 0.19), bpS(0.15, 0.85, wet)), path * 0.8);
  g += lc * (0.4 * path * bpS(0.2, 0.75, wet) + 0.02) * bpBell(l.x / (0.05 + b)) * bpS(-0.6, -0.2, l.y);
  c = mix(c, g, lawn);
 }
 // the house, and a bush
 if (q.x < -0.1) {
  float roof = min(max(abs(a.x) - 0.3, a.y - 0.2 + abs(a.x) * 0.62), max(abs(a.x - 0.13) - 0.017, abs(a.y - 0.12) - 0.065));
  float eave = abs(a.x) * 0.62 + a.y - 0.2;
  vec3 wall = vec3(0.03, 0.027, 0.034) + 0.025 * bpS(-0.2, 0.15, a.y);
  wall = mix(wall, vec3(0.085, 0.075, 0.09), bpBell((eave + 0.008) / (0.007 + 0.5 * s)) * 0.8) + warm * 0.022 * exp(-dot(wg, wg) * 60.0);
  c = mix(c, wall, bpS(s, -s, roof) * bpS(-s, s, q.y + 0.155));
  vec2 w1 = abs(vec2(abs(a.x - 0.04) - 0.06, a.y + 0.07)), w2 = w1 - vec2(0.028, 0.045);
  float pane = bpS(s, -s, max(w2.x, w2.y)) * (0.045 / (0.045 + b)) * mix(bpS(0.001, 0.0035, min(w1.x, abs(a.y + 0.055))), 0.85, bpS(0.005, 0.025, b));
  c = mix(c, warm * mix(1.1, 0.5, bpS(-0.1, -0.025, a.y)) * (0.72 + 0.28 * bpS(0.03, 0.012, w1.x)), pane) + warm * 0.05 * exp(-dot(wg, wg) * 40.0);
  float bush = length((q - vec2(-0.33, -0.165)) * vec2(0.75, 1.0)) - 0.06 - 0.03 * (noise(q * 30.0) + noise(q * 70.0) - 0.8);
  c = mix(c, vec3(0.018, 0.02, 0.02), bpS(s, -s, bush));
 }
 // the lamp on its post, for the drone
 float post = bpS(s, -s, max(abs(l.x) - 0.0034, max(l.y, -l.y - 0.23))) * (0.004 / (0.004 + b * 0.7));
 c = mix(c, vec3(0.02, 0.018, 0.022), post);
 float ld = length(l);
 c += lc * (1.3 * bpLamp(l, 0.015, b) + 0.1 * exp(-ld * ld * 60.0) + 0.16 * exp(-ld * 15.0));
 // a string of small lamps, one for each band
 float t = (q.x + 0.46) / 0.96, tt = sat(t), i = clamp(floor(t * 16.0), 0.0, 15.0), bt = (i + 0.5) / 16.0;
 vec2 bl = vec2(bt * 0.96 - 0.46, mix(0.1, 0.19, bt) - 0.34 * bt * (1.0 - bt) - 0.012);
 float yc = mix(0.1, 0.19, tt) - 0.34 * tt * (1.0 - tt);
 c *= 1.0 - 0.6 * step(abs(t - 0.5), 0.5) * bpS(0.0022 + b * 0.3, 0.0004, abs(q.y - yc)) * (0.002 / (0.002 + b * 0.6));
 bl = q - bl;
 c += mix(vec3(1.6, 0.78, 0.3), kindColour(i * 0.25) * 1.7, 0.45) * (0.25 + 2.2 * uBands[int(i)] * e) * (1.2 * bpLamp(bl, 0.0072, b) + 0.12 * exp(-dot(bl, bl) * 1500.0) * 0.02 / (0.02 + b));
 // one dark tree
 vec2 r = q - vec2(0.57 + 0.006 * sin(uTime * 0.21 + q.y * 3.0) * bpS(-0.2, 0.4, q.y), 0.0), cr = (r - vec2(0.0, 0.18)) / vec2(0.29, 0.235);
 float ls = 0.1 + b * 22.0, oval = 1.0 - dot(cr, cr), fine = 1.0 - bpS(0.01, 0.06, b);
 if (oval < -1.5 * fine - ls && abs(r.x) > 0.1 + s) return c;
 float tree = min(bpCap(r, vec2(0.02, -0.26), vec2(0.0, 0.04), 0.026, 0.013), bpCap(r, vec2(0.0, 0.0), vec2(-0.14, 0.2), 0.011, 0.003));
 tree = min(tree, bpCap(r, vec2(0.0, 0.04), vec2(0.05, 0.3), 0.012, 0.003));
 oval += (noise(r * 9.0 + 3.0) - 0.5) * (0.5 + 0.9 * fine);
 if (fine > 0.0) oval += fine * ((noise(rot(0.6) * r * 30.0) - 0.5) * 1.2 + (noise(rot(1.1) * r * 80.0) - 0.5) * 0.9);
 float dark = max(bpS(s, -s, tree), bpS(0.3 - ls, 0.3 + ls, oval) * 0.97);
 return mix(c, vec3(0.018, 0.024, 0.024) + vec3(0.06, 0.028, 0.014) * bpS(0.4, -0.9, cr.x + 0.4 * cr.y + 2.0 * max(-cr.y - 0.5, 0.0)), dark);
}
vec3 bpMisted(vec2 p) {
 bpGlass(p, 0.0);
 float fog = min(bpFog, 1.0);
 float b = mix(0.012 - 0.006 * uTone, 0.06 + 0.06 * uSpace, fog * fog * (0.4 + 0.6 * fog)) + bpDrop * 0.012;
 vec3 c = bpGarden(p + bpBend * (1.0 + 1.4 * bpDrop), b);
 // the mist: the light behind it and its own pale grey
 float lum = 0.62 + 0.3 * bpS(-0.5, 0.45, p.y);
 vec2 l = p - vec2(0.16, 0.035), w = p - vec2(-0.56, -0.09);
 vec3 halo = vec3(1.0, 0.6, 0.28) * (0.22 * exp(-length(w) * 5.5) + (0.1 + 0.25 * uDrone) * exp(-length(l) * 6.0));
 vec3 mist = c * 0.4 + vec3(0.5, 0.525, 0.54) * lum * 0.95 + halo;
 c = mix(c, mist, fog);
 return c + 0.55 * vec3(1.0, 0.97, 0.93) * max(bpFog - 1.0, 0.0);
}
vec3 bpHot, bpC; // the light behind the greenhouse; the picture so far
float bpMot; // an unevenness all leaves share
// One leaf, bowed from its base. near: where it touches the glass. frond: 0 broad, 1 leaflets, 2 fingers.
void bpLeaf(vec2 p, vec2 base, float ang, float len, float wid, float bow, vec4 near, float frond, vec3 tint, float lv) {
 vec2 d = p - base;
 float ca = cos(ang), sa = sin(ang);
 vec2 q = vec2(ca * d.x + sa * d.y, ca * d.y - sa * d.x) / len;
 float x = q.x, xx = sat(x);
 q.y -= bow * x * x + 0.012 * x * x * sin(uTime * 0.17 + ang * 3.0);
 if (x < -0.12 || x > 1.12 || abs(q.y) > wid + 0.12) return;
 float y = abs(q.y), side = q.y < 0.0 ? 0.0 : 1.0;
 float w = wid * max(sin(PI * pow(xx, 0.72)), 0.0) * (1.0 + 0.05 * sin(x * 17.0 + side * 2.0 + ang));
 if (y > w + 0.1) return;
 float rib = 0.01 * (1.0 - xx) + 0.002, yy = y / max(w, 1e-3), broad = 1.0 - step(0.5, frond);
 // how far from the glass this place is
 float z = near.x + near.y * abs(x - near.z) + near.w * y / wid + 0.1 * (bpMot - 0.5) - 0.16 * lv;
 float off = max(z, 0.0);
 float s = bpPx * 1.2 + off * (0.05 + 0.05 * uSpace) * (0.35 + 0.65 * bpFog);
 float in_ = min(w - y, x * 0.5 + 0.004), vein;
 float v = (x - y * 0.9 + 0.35 * y * y / wid) * 11.0, vs = abs(fract(v) - 0.5) * 2.0;
 if (frond > 0.5 && frond < 1.5) {
  float ey = min(yy, 1.0), n = 17.0, u = x * n - ey * 2.2 * (1.0 - 0.4 * xx);
  float k = floor(u), lf = abs(u - k - 0.5) * 2.0;
  float tip = 0.72 + 0.28 * hash11(k + side * 31.0 + ang);
  in_ = min(in_, (0.66 * (1.0 - pow(ey / tip, 3.0)) - lf) / (2.0 * n));
  in_ = max(in_, rib - y);
  vein = bpS(0.16, 0.0, lf);
 } else {
  if (frond > 1.5) in_ = min(min(in_, w * (1.0 - 0.3 * (1.0 - vs) * (1.0 - vs)) - y), (vs - 0.22 * bpS(0.3, 0.75, yy) * bpS(0.12, 0.3, xx) * bpS(0.95, 0.75, xx)) / 22.0 + 0.003);
  vein = bpS(0.86, 0.97, 1.0 - vs) * bpS(0.0, 0.3, 1.0 - yy) + 0.4 * bpS(0.7, 1.0, abs(fract(v * 5.0) - 0.5) * 2.0);
 }
 float cov = bpS(-s, s, in_ * len) * mix(1.0, wid * len * 0.5 / (wid * len * 0.5 + s), 0.8);
 if (cov < 0.004) return;
 float mid = bpS(rib * 1.2 + s, rib * 0.4, y);
 float fleck = noise(q * vec2(9.0, 26.0));
 vec3 leaf = mix(vec3(0.005, 0.024, 0.016), vec3(0.016, 0.07, 0.03), 0.2 + 0.4 * side + 0.4 * fleck + 0.25 * vs * broad);
 leaf += bpHot * bpHot * vec3(0.06, 0.11, 0.016) * (0.35 + 0.65 * side);
 leaf *= 1.0 + 0.55 * vein * bpS(0.1, 0.0, off);
 // its sound's colour comes up in it as variegation along the rib
 float stripe = bpS(0.75, 0.1, yy + 0.5 * (1.0 - vs) * broad + 0.35 * fleck);
 leaf = mix(leaf, tint * tint * 0.5 + 0.01, lv * 0.7 * stripe);
 leaf += (vec3(0.09, 0.15, 0.08) + 0.15 * tint * lv) * mid * (1.0 - min(frond, 1.0) * 0.5);
 float touch = bpS(0.004, -0.02, z);
 leaf = mix(leaf + vec3(0.02, 0.03, 0.022), leaf * 0.8, touch);
 float veil = (1.0 - touch) * sat(0.34 + 1.25 * off) * bpFog;
 // the film of water round the part that touches
 float film = bpBell((z - 0.002) / 0.0045) * bpS(0.0, 0.01, in_);
 leaf += vec3(0.3, 0.36, 0.31) * film * bpS(0.3, 0.6, fleck);
 veil *= 1.0 - 0.8 * film;
 bpC = mix(bpC, mix(leaf, bpC * 0.15 + bpHot, veil * 0.94), cov);
}
vec3 bpHouse(vec2 p) {
 bpGlass(p, 0.14);
 float fog = min(bpFog, 1.0);
 vec2 q = p + bpBend * (1.0 + 1.2 * bpDrop);
 // pale wet light, strongest high up to the right
 vec2 sv = (q - vec2(0.24, 0.3)) * vec2(0.8, 1.1);
 float sun = exp(-dot(sv, sv) * (4.0 - 1.6 * uTone));
 bpMot = noise(q * 9.0);
 bpHot = mix(vec3(0.2, 0.29, 0.25), vec3(0.95, 0.98, 0.78), sun) * (0.85 + 0.25 * uLevel);
 // far behind: green dusk with round spots of light, for the bands
 float b = 0.02 + 0.09 * fog, e = 0.4 + 0.9 * uEnergy;
 float far = noise(q * 3.1 + 5.0) * 0.5 + noise(rot(0.7) * q * vec2(15.0, 3.5)) * 0.5;
 bpC = mix(vec3(0.006, 0.02, 0.015), vec3(0.06, 0.115, 0.04), bpS(0.35, 0.75, far)) * (0.6 + 1.2 * sun);
 bpC += vec3(0.5, 0.6, 0.26) * sun * bpS(0.42, 0.8, far) * 0.9;
 vec4 m = piece(bpUV(q));
 vec2 sg = rot(0.7) * q * 6.3 + vec2(1.5, 0.25 * sin(uTime * 0.04)), h = hash22(floor(sg) + 3.0);
 float r = 0.1 + 0.22 * h.x, n = fract(h.y * 37.0);
 vec3 kc = kindColour(n * 4.0), spot = mix(vec3(0.75, 0.85, 0.4), kc * kc * 1.6, 0.4);
 bpC += spot * (0.05 + 0.55 * band(n) * e) * bpS(r + 0.09, r - 0.09, length(fract(sg) - 0.5 - (h - 0.5) * 0.16)) * step(0.45, h.y) * (1.0 - 0.8 * fog) * (0.3 + far);
 bpC = mix(bpC, bpC * 0.6 + m.rgb * m.rgb * (0.06 + 0.2 * far) * e, bpS(0.1, 0.7, m.a) * 0.7);
 bpC = mix(bpC, bpC * 0.12 + bpHot, 0.95 * fog);
 // the leaves, the far ones first
 bpLeaf(q, vec2(-0.3, -0.7), 1.72, 1.08, 0.12, -0.1, vec4(0.42, 0.1, 0.5, 0.05), 0.0, uKind[4], 0.0);
 bpLeaf(q, vec2(0.66, 0.7), 4.3, 1.0, 0.2, 0.12, vec4(0.34, 0.1, 0.5, 0.0), 1.0, uKind[2], uTexture * 0.6);
 bpLeaf(q, vec2(-0.66, 0.62), 5.0, 0.66, 0.2, 0.15, vec4(0.06, 0.5, 0.72, 0.1), 0.0, uKind[3], uPhrase);
 bpLeaf(q, vec2(0.28, -0.68), 1.22, 0.84, 0.2, -0.16, vec4(-0.02, 0.5, 0.62, 0.05), 1.0, uKind[2], uTexture);
 bpLeaf(q, vec2(1.02, -0.46), 2.74, 0.98, 0.2, -0.16, vec4(-0.06, 0.55, 0.6, 0.1), 2.0, uKind[1], uPad);
 bpLeaf(q, vec2(-0.04, -0.66), 2.02, 0.66, 0.07, 0.1, vec4(-0.03, 0.6, 0.68, 0.05), 0.0, uKind[3], uPhrase);
 bpLeaf(q, vec2(-0.88, -0.62), 0.96, 1.06, 0.17, -0.12, vec4(-0.1, 0.42, 0.55, 0.1), 0.0, uKind[0], uDrone);
 return bpC + 0.55 * max(bpFog - 1.0, 0.0);
}
vec3 render(vec2 p) {
 bpPx = 1.0 / uRes.y; bpAsp = uRes.x / uRes.y;
 vec3 c = uVar < 0.5 ? bpMisted(p) : bpHouse(p);
 c *= (1.0 + 0.11 * min(bpFog, 1.0) * (noise(p * 300.0) - 0.5)) * (1.0 - 0.75 * bpDark * bpDrop); // the grain of the mist, the drops
 c += vec3(1.0, 0.95, 0.88) * bpGlint * bpDrop * (0.5 + 0.5 * uHigh);
 c = c * (1.0 - 0.3 * bpRim);
 return screenOf(c * 1.1);
}
