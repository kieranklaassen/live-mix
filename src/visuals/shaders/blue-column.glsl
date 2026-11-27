// name: Blue column
// a: On the cable
// b: Sand rim
// what: One column of sea, pale turquoise above and violet-black below: a ship's hull, a thread of cable, a round steel chamber whose lamp just touches the flank of something very large that is leaving, and small lights far down; or a white sand shelf where sand pours in thin falls into a round hole, a diver on a line at its edge.
// follows: A drone lets light go deeper. Each kind lights a creature; pads also the sun's rays or net, a phrase the line, texture the specks. Bands light the great flank, or the falls, which lows surge. The piece lights far creatures, or stains the hole. A hit throws a ring of sparks, or a sheet of sand; a cue swings the beam or the sun. Voice and keys add light.
// own: 0 green cold water at -1, rose evening at 1; 1 pale day far down at -1, night at 1; 2 near the chamber, or low on the sand, at -1, far from it, or looking down from high, at 1; 3 a thin lamp and slender body, or a narrow well, at -1, a flood of light on a giant, or a vast hole, at 1; 4 clear and nearly empty, or few falls, at -1, thick snow and many lights, or curtains of sand, at 1; 5 lamp turned down in open water, or a smooth rim, at -1, a cliff close by, or a ragged rim, at 1; 6 a sea floor with smoking chimneys, or a round stack left in the hole, at -1, a fleet of chambers, or many holes, at 1; 7 the large one a jelly, or light out of black sand, at -1, a hall of ribs, or sea grass, at 1
// The light at the surface, how fast each colour is lost going down, what is left at the bottom.
vec3 bcTop, bcLoss, bcDeep;
float bcPx;
// Noise whose rows come round again after 64.
float bcN(vec2 p) {
 vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f);
 float y0 = mod(i.y, 64.0), y1 = mod(i.y + 1.0, 64.0);
 return mix(mix(hash21(vec2(i.x, y0)), hash21(vec2(i.x + 1.0, y0)), f.x), mix(hash21(vec2(i.x, y1)), hash21(vec2(i.x + 1.0, y1)), f.x), f.y);
}
float bcRun(float x) { return mod(x, 64.0); }
float bcIn(float d, float e) { return 1.0 - smoothstep(-e, e, d); }
float bcDot(float d, float r) { r = max(r, 0.7 * bcPx); return bcIn(d - r, bcPx); }
// A small living lamp.
float bcLamp(float d, float r) { return 1.8 * bcDot(d, r) + 0.4 * exp(-d * 160.0) * (1.0 - smoothstep(0.014, 0.024, d)); }
vec3 bcGlow(int k) { return pow(uKind[k], vec3(1.3)) * vec3(0.8, 1.05, 1.25) + 0.05; }
float bcCap(vec2 q, vec2 a, vec2 b, float r, float s) {
 vec2 e = b - a; float h = sat(dot(q - a, e) / dot(e, e));
 return length(q - a - e * h) - mix(r, s, h);
}
vec3 bcWater(float d) { d = max(d, 0.0); return bcTop * exp(-bcLoss * d * (0.75 + 0.75 * d)) + bcDeep * smoothstep(0.1, 1.0, d); }
float bcSpecks(vec2 p, float freq, float fall, float seed, float size, float some) {
 vec2 q = p * freq;
 q.x += 0.35 * sin(uTime * 0.13 + seed);
 q.y += bcRun(fall * freq);
 vec2 id = floor(q), f = q - id; id.y = mod(id.y, 64.0);
 vec2 h = hash22(id + seed);
 float r = size * (0.45 + h.x * h.x) * smoothstep(0.0, 0.2, some - hash21(id.yx + seed * 1.7)), drawn = max(r, 0.7 * bcPx);
 return r / drawn * bcDot(length(f - 0.5 - (h - 0.5) * 0.7) / freq, drawn);
}
// How far inside a cliff we are; its ledges pass as we sink.
float bcCliff(float x, float y, float n, float seed) {
 float L = y * n + bcRun(uTravel * 0.02), i = floor(L), f = L - i;
 float h = hash21(vec2(mod(i, 64.0), seed)), g = hash21(vec2(mod(i + 1.0, 64.0), seed));
 return x + 0.55 / n * mix(0.2 * h + h * f * f * f, 0.2 * g, smoothstep(0.86, 1.0, f)) + 0.02 * bcN(vec2(seed, L * 4.0)) + 0.05 * sin(y * 4.0 + seed);
}

// What lives in the deep, drawn in lit dots.
vec3 bcLife(vec2 p, float many) {
 vec3 c = vec3(0.0);
 float t = uTime;
 float dy = p.y + 0.405 - uOwn[7] * (uOwn[7] < 0.0 ? 0.62 : 0.1) * (p.x - 0.35) - 0.10 * max(-uOwn[7], 0.0) - 0.028 * sin(p.x * 4.2 + t * 0.10) - 0.016 * sin(p.x * 9.0);
 if (abs(dy) < 0.09) {
  float n = p.x * 60.0, i = floor(n), h = hash11(i + 40.0), bx = (n - i - 0.5 - 0.5 * (hash11(i + 11.0) - 0.5)) / 60.0;
  float lit = smoothstep(-0.82, -0.66, p.x) * (1.0 - smoothstep(0.42, 0.62, p.x)) * (0.16 + (0.8 + 0.35 * sin(p.x * 7.0 - t * 0.5)) * uDrone);
  float len = 0.02 + 0.06 * h * h, thread = bcDot(abs(bx + 0.004 * sin(dy * 60.0 + i)), 0.0005) * smoothstep(-len, -0.3 * len, dy) * step(dy, 0.0);
  c += bcGlow(0) * lit * ((0.5 + h) * bcLamp(length(vec2(bx, dy - 0.007 * (h - 0.5))), 0.0018 + 0.0042 * h * h) + 0.22 * bcDot(abs(dy), 0.0009) + 0.4 * thread);
 }
 vec2 q = rot(-0.42 + 0.06 * sin(t * 0.07)) * (p - vec2(0.60 - 0.42 * max(uOwn[6], 0.0), -0.235 + 0.30 * max(-uOwn[6], 0.0) + 0.012 * sin(t * 0.11)));
 float d = bcCap(q, vec2(-0.065, 0.0), vec2(0.075, 0.0), 0.033, 0.021);
 if (d < 0.0) {
  float R = 0.032 - 0.011 * smoothstep(-0.02, 0.1, q.x), v = clamp(q.y / R, -1.0, 1.0), row = floor(asin(v) / 0.38 + 0.5), u = q.x / 0.0115 + 0.5 * mod(row, 2.0);
  float lamp = length(vec2((fract(u) - 0.5) * 0.0115, (sin(row * 0.38) - v) * R));
  c += bcGlow(1) * smoothstep(0.0, 0.0025, -d) * (0.2 + uPad * (0.9 + 0.4 * sin(q.x * 34.0 + t * 0.6))) * (1.5 * bcDot(lamp, 0.0014 + 0.0016 * sqrt(1.0 - v * v)) + 0.12 + 0.35 * smoothstep(-0.008, 0.0, d));
 }
 q = p - vec2(0.17 + 0.42 * min(uOwn[6], 0.0) + 0.03 * sin(t * 0.05), -0.265 + 0.5 * max(-uOwn[6], 0.0));
 if (abs(q.x) < 0.2 && abs(q.y) < 0.11) {
  q.y += 0.010 * sin(q.x * 18.0 + t * 0.5) * smoothstep(-0.08, 0.12, q.x) + q.x * 0.10;
  float s = (q.x + 0.11) / 0.23, s1 = sat(s), w = 0.019 * sqrt(sat(s1 * 9.0)) * (1.0 - s1) * (1.0 + 0.5 * s1) + 0.016 * smoothstep(0.92, 1.0, s1);
  float body = smoothstep(0.0, 0.03, s) * step(s, 1.0) * bcIn(abs(q.y) - w, bcPx), u = s * 21.0 - clamp(floor(s * 21.0), 1.0, 18.0);
  float lit = 0.28 + uPhrase * (0.4 + 1.3 * exp(-8.0 * pow(abs(fract(s1 - t * 0.22) - 0.5), 2.0)));
  c += body * (vec3(0.006, 0.014, 0.022) + bcGlow(3) * lit * 0.07);
  c += bcGlow(3) * lit * bcLamp(length(vec2((u - 0.5) * 0.011, q.y + w * 0.45)), 0.0026 - 0.0013 * s1);
  vec2 tip = vec2(-0.127 + 0.006 * sin(t * 0.4), -0.066);
  c += bcGlow(3) * (0.28 * bcDot(bcCap(q, vec2(-0.1, -0.01), tip, 0.0, 0.0), 0.0006) + (0.5 + 1.2 * uPhrase) * bcLamp(length(q - tip), 0.0042));
 }
 q = p - vec2(-0.36 + 0.5 * max(-uOwn[7], 0.0) + 0.95 * max(uOwn[6], 0.0), 0.165 - 0.2 * max(uOwn[6], 0.0));
 float sh = 1.0 - smoothstep(0.45, 1.0, length(q / vec2(0.40, 0.115)));
 if (sh > 0.0) {
  vec2 G = vec2(30.0, 62.0), g = q * G;
  g.y += 1.2 * sin(q.x * 8.0);
  g.x += bcRun(t * 0.12) + 0.5 * mod(floor(g.y), 2.0);
  vec2 id = floor(g), f = g - id - 0.5, h = hash22(vec2(mod(id.x, 64.0), id.y) + 7.0);
  f = (f - (h - 0.5) * vec2(0.4, 0.45)) / G;
  float l = 0.0085 + 0.004 * h.y, w = 0.0026 * sat(1.0 - abs(f.x + 0.2 * l) / l), glint = 0.5 + 0.5 * sin(t * 0.4 + h.x * 30.0 + q.x * 12.0);
  float m = bcIn(abs(f.y) - w, bcPx) * step(abs(f.x), l) * smoothstep(0.0, 0.3, sh - 0.75 * h.x);
  c += m * (vec3(0.02, 0.05, 0.06) + bcGlow(2) * (0.2 + 1.2 * uTexture) * (0.4 + 0.9 * glint) * smoothstep(-0.0015, 0.001, f.y));
 }
 q = rot(0.35 + 0.1 * sin(t * 0.06)) * (p - vec2(-0.02, -0.2));
 float r = length(q);
 if (r < 0.22) {
  float e = length(q * vec2(1.3, 0.95)), v = q.y / 0.041, wide = 0.030 * sqrt(max(1.0 - v * v, 0.0)) + 1e-4, m = clamp(q.x / wide, -1.0, 1.0), row = floor(asin(m) / 0.52 + 0.5);
  float comb = sat(1.0 - abs(sin(row * 0.52) - m) * wide / 0.0022) * (0.55 + 0.45 * sin(q.y * 520.0 + row * 2.0)) * (1.0 - smoothstep(0.6, 0.95, abs(v)));
  c += bcIn(e - 0.039, 0.001) * (bcGlow(4) * comb * bcIn(e - 0.0355, 0.003) * (0.45 + 2.4 * uHits) + bcGlow(4) * 0.06 * (1.0 + 2.0 * uHits));
  float far = 0.05 + 0.13 * (1.0 - uHits), an = atan(q.y, q.x + 1e-5) / TAU * 18.0, ring = far * (0.7 + 0.45 * hash11(mod(floor(an), 18.0) + 3.0));
  c += (bcGlow(4) + 0.25) * smoothstep(0.0, 0.25, uHits) * (1.2 * bcLamp(length(vec2((fract(an) - 0.5) * TAU / 18.0 * r, r - ring)), 0.0034) + 0.18 * exp(-abs(r - far) * 60.0) * uHits + 0.35 * uHits * (exp(-r * r * 70.0) - 0.033));
 }
 vec2 G = vec2(13.0, 17.0), id = floor(p * G + vec2(0.5 * mod(floor(p.y * G.y), 2.0), 0.0)), h = hash22(id + 21.0);
 vec2 at = (id + 0.5 + (h - 0.5) * 0.35 - vec2(0.5 * mod(id.y, 2.0), 0.0)) / G + 0.005 * sin(t * 0.09 + h * 9.0);
 vec4 pc = piece(vec2(at.x / 1.7 + 0.5, 0.5 - at.y));
 q = rot(0.9 * (h.x - 0.5)) * (p - at);
 q.y += q.x * q.x * 14.0 * (h.y - 0.5);
 float count = floor(h.y * 3.9), n = clamp(floor(q.x / 0.0075 + 0.5), -count, count);
 float lit = 0.07 + 1.5 * pc.a * (0.6 + 0.9 * uEnergy) + uKeys * sat(sin(t * 2.0 + h.x * 40.0));
 lit *= smoothstep(0.0, 0.25, 0.34 + 0.5 * many - hash21(id + 3.3)) * (1.0 - smoothstep(-0.05, 0.28, at.y));
 return c + mix(vec3(0.35, 0.8, 1.0), pc.rgb / max(pc.a, 0.01), sat(pc.a * 3.0)) * lit * (1.8 * bcDot(length(vec2(q.x - n * 0.0075, q.y)), 0.0011 + 0.0017 * h.x * h.x) + 0.3 * pow(sat(1.0 - length(p - at) / 0.019), 2.0));
}

vec3 bcCable(vec2 p) {
 float o2 = uOwn[2], o3 = uOwn[3], many = uOwn[4], o5 = uOwn[5], o6 = uOwn[6], o7 = uOwn[7], open = max(-o5, 0.0), t = uTime;
 float depth = max(0.5 - p.y, 0.0), off = abs(p.x - 0.28), brush = bcN(vec2(p.x * 2.2 + 4.0, p.y * 26.0)) - 0.5;
 float D = depth + 0.026 * brush * smoothstep(0.0, 0.2, depth) + 0.05 * off * off;
 vec3 water = bcWater(D);
 vec2 hull = vec2(0.315, 0.425), hq = p - hull, hr = hq * vec2(3.2, 7.5);
 float fan = bcN(vec2(hq.x / (0.16 + depth) * 5.0 + 20.0 + 0.4 * sin(t * 0.05), 1.0 + 0.5 * sin(t * 0.07)));
 float rip = bcN(vec2(p.x * 11.0 + sin(t * 0.11), depth * 60.0 + bcRun(t * 0.3)));
 water += bcTop * (0.9 * exp(-dot(hr, hr)) * (0.7 + 0.5 * rip) + (0.16 + 0.35 * uHigh) * smoothstep(0.6, 0.95, rip) * exp(-depth * 18.0));
 water *= 1.0 + (0.45 + 1.2 * uPad) * (fan - 0.45) * exp(-depth * 3.2 - off * 1.1);
 vec3 c = water;
 float lump = bcN(vec2(p.x * 24.0, p.y * 34.0 + bcRun(uTravel * 0.136)));
 c = mix(c, water * (0.50 + 0.22 * lump), smoothstep(-0.010, 0.012, bcCliff(p.x - 0.79 + 0.30 * max(o5, 0.0) - 0.5 * open, p.y, 5.0, 3.0)));
 if (o6 < 0.0) {
  float g = -0.60 + 0.12 * min(-o6 * 2.0, 1.0) - 0.15 * o6 + 0.06 * sin(p.x * 2.6 + 1.3) + 0.04 * bcN(vec2(p.x * 9.0, 3.0));
  vec3 hot = bcGlow(0) * vec3(1.5, 0.9, 0.5) * (0.5 + 0.9 * uDrone), rock = (water * 0.6 + 0.02) * (0.4 + 1.1 * bcN(p * 40.0 + p.yx * 26.0));
  c = mix(c, rock * (1.0 - 1.6 * (g - p.y)), bcIn(p.y - g, 0.002));
  for (int i = 0; i < 2; i++) {
   float k = float(i), fx = p.x / 0.43 + 0.45 * k, ci = floor(fx), h = hash11(ci + 31.0 + 7.0 * k), x = (fx - ci - 0.5) * 0.43, top = g - o6 * (0.08 + 0.34 * h * h), ry = max(p.y - top, 0.0);
   float wd = 0.013 + 0.028 * sat((top - p.y) * 3.0) + 0.012 * bcN(vec2(p.y * 30.0, ci * 3.0)), sw = 0.02 + 0.34 * ry, sx = x - 0.3 * ry * ry - 0.04 * sin(ry * 14.0 - t * 0.35 + h * 6.0) * sat(ry * 6.0);
   float puff = bcN(vec2(sx / sw * 2.0 + 7.0 * ci, ry * 14.0 + 64.0 - bcRun(t * 0.3)));
   c = mix(c, water * 0.3 + hot * exp(-ry * 9.0) + 0.03, 0.9 * exp(-sx * sx / (sw * sw) - ry * 2.6) * step(top, p.y) * smoothstep(0.15, 0.7, puff) * -o6);
   c = mix(c, rock * mix(0.5, 1.6, smoothstep(-wd, wd, x)) + hot * 0.3 * exp(-30.0 * (top - p.y)), bcIn(abs(x) - wd, 0.0015) * bcIn(p.y - top, 0.002));
   c -= hot * 0.3 * o6 * exp(-length(vec2(x, top - p.y)) * 26.0);
  }
 }
 if (o6 > 0.0) for (int i = 0; i < 7; i++) {
  float k = float(i), h = hash11(k + 2.0), sz = (0.36 + 0.4 * h) * min(o6 * 1.6, 1.0), top = 0.44 + 0.03 * h, r = 0.052 * sz, on = min(o6 * 3.0, 1.0);
  vec2 d = p - vec2(-0.95 + 0.295 * k + 0.13 * step(3.5, k), 0.18 - 0.52 * fract(k * 0.382 + 0.2)) - 0.004 * sin(t * 0.15 + k), e = vec2(d.x, p.y - top);
  c = mix(c, water * 0.1, on * max(0.8 * bcDot(abs(d.x), 0.0007) * step(0.0, d.y) * step(e.y, 0.0), bcIn(length(e * vec2(3.2, 8.0) / sz) - 0.12, 0.02)));
  float ah = -d.y - r, cone = 0.3 * max(ah, 0.0) + 0.006, lamp = on * (0.55 + 0.6 * uLevel + 0.7 * band(k / 6.0));
  c += lamp * vec3(1.0, 0.88, 0.62) * (0.28 * max(1.0 - d.x * d.x / (cone * cone), 0.0) * step(0.0, ah) * exp(-ah * vec3(9.0, 6.0, 6.0)) + 0.10 * exp(-length(d) * 26.0));
  c = mix(c, water * (0.5 + 1.1 * smoothstep(-r, r, d.y)), bcIn(length(d) - r, bcPx));
  c += lamp * vec3(1.6, 1.25, 0.7) * bcDot(length(d + vec2(0.0, r * 0.75)), 0.004 * sz);
 }
 float S = exp(-0.75 * o2), near = max(-o2, 0.0), R = 0.054;
 vec2 C0 = vec2(0.36, -0.02), C = C0 + vec2(0.05 * near, 0.05 * near - 0.10 * max(o2, 0.0)) + 0.004 * vec2(sin(t * 0.17), sin(t * 0.13));
 vec2 q = (p - C) / S + C0;
 float pxq = bcPx / S;
 float turn = 0.13 + 0.05 * sin(t * 0.11) + 1.7 * uCue * (1.0 - uCue) + 0.95 * open;
 vec2 dir = vec2(-cos(turn), -sin(turn)), nrm = vec2(-dir.y, dir.x), b = q - C0 - dir * R;
 float along = dot(b, dir), across = dot(b, nrm), ahead = max(along, 0.0), wide = 0.010 + 0.135 * ahead * (0.85 + 0.3 * uSpace) * exp(0.75 * o3);
 float bright = (0.75 + 0.5 * uLevel + 0.6 * uMic + 0.5 * uCue) * (0.8 + 0.4 * uTone), spread = max(1.0 - across * across / (wide * wide), 0.0);
 vec3 beam = vec3(1.0, 0.92, 0.70) * exp(-ahead * vec3(2.3, 0.75, 0.75)) * spread * sqrt(spread) * smoothstep(-0.004, 0.012, along) * bright / (1.0 + 4.0 * ahead);
 float s = q.x + 1.0, yc = -0.055 - 0.21 * s * s + 0.02 * s * s * sin(t * 0.15 - s * 2.0) + 0.10 * max(o3, 0.0);
 float w = 0.30 * exp(1.1 * o3) * pow(max(1.0 - s, 0.0), 0.8) + 0.035 * exp(-400.0 * (s - 0.97) * (s - 0.97));
 w = mix(w, -0.02, max(abs(o7), max(o6, 0.0)));
 float v = (q.y - yc) / max(w, 1e-3), body = smoothstep(-0.012, 0.016, w - abs(q.y - yc)) * (1.0 - smoothstep(0.98, 1.06, s));
 if (body > 0.0) {
  float nz = sqrt(max(1.0 - v * v, 0.0)), arc = asin(clamp(v, -1.0, 1.0));
  c = mix(c, water * mix(0.5, 0.75, smoothstep(0.2, 1.0, v)), body * 0.9 * exp(-across * across * 28.0));
  float n1 = noise(vec2(q.x * 26.0, arc * 9.0)), n2 = noise(vec2(q.x * 90.0, arc * 22.0)), pleat = smoothstep(-0.8, 0.6, sin(arc * 46.0 + 2.2 * n1 + q.x * 4.0));
  float skin = (0.34 + 0.3 * n1 + 0.16 * n2) * mix(1.0, 0.6 + 0.5 * pleat, smoothstep(0.05, 0.3, -v));
  c += body * beam * 3.4 * skin * (0.15 + 0.85 * nz) * vec3(0.8, 1.0, 1.08);
  float u = s * 26.0, lamp = length(vec2((fract(u) - 0.5) / 26.0, (v + 0.18 - 0.05 * hash11(floor(u) + 70.0)) * w));
  float run = exp(-30.0 * pow(abs(fract(s * 0.8 - t * 0.09) - 0.5), 2.0));
  c += body * mix(vec3(0.4, 0.85, 1.0), bcGlow(3), 0.5) * (0.12 + 1.1 * band(s) + 0.9 * uPhrase * run) * smoothstep(0.03, 0.12, w) * bcLamp(lamp, 0.0008 + 0.0018 * smoothstep(0.05, 0.14, w));
 }
 if (o7 < 0.0) {
  float RB = -0.30 * o7 * exp(0.45 * o3) * (1.0 - 0.035 * sin(t * 0.42));
  vec2 j = rot(-0.26 + 0.04 * sin(t * 0.09)) * (q - vec2(-0.40, 0.06)) / max(RB, 1e-4);
  float v = j.y / 0.8, wide = j.y > 0.0 ? sqrt(max(1.0 - v * v, 1e-4)) : 1.0 - 0.10 * v * v, m = j.x / wide, am = asin(clamp(m, -1.0, 1.0)), hem = -0.16 - 0.035 * cos(am * 12.0) + 0.05 * m * m, low = max(hem - j.y, 0.0);
  float in_ = bcIn(abs(j.x) - wide, 0.008) * smoothstep(-0.01, 0.01, j.y - hem) * bcIn(v - 1.0, 0.01);
  float tx = (j.x - (0.16 * sin(j.y * 2.0 + t * 0.3) * sat(low * 0.9) + 0.06 * sin(j.y * 5.7 + t * 0.5))) / (1.0 + 0.35 * sat(low * 0.36)), tn = tx * 13.0, ti = floor(tn), th = hash11(ti + 90.0);
  float thr = bcDot(abs(tn - ti - 0.5 - 0.5 * (th - 0.5)) * RB / 13.0, 0.0008) * step(abs(tx), 0.97) * (1.0 - smoothstep(0.4, 1.0, low / (1.0 + 1.8 * th))), fr = bcN(vec2(tx * 7.0 + 3.0, j.y * 4.8 + t * 0.12)), arms = exp(-tx * tx * 8.6 - low * 1.5) * smoothstep(0.35, 0.8, fr);
  vec3 jel = bcGlow(1) * (0.75 + 1.1 * uPad), jb = beam * 5.0 + water * 0.5;
  c += step(j.y, hem + 0.06) * (1.0 - in_) * (thr * (jel * 0.34 + jb * 0.35) + arms * (jel * 0.20 + jb * 0.3));
  float rim = smoothstep(0.55, 1.0, abs(m)) * step(0.0, j.y) + 1.0 - smoothstep(0.0, 0.1, j.y - hem), rib = 1.0 - smoothstep(0.0, 0.16, abs(fract(am * 5.1 + 0.5) - 0.5)), y = (j.y - 0.22) * 1.5;
  c = mix(c, c * 0.72, in_) + in_ * (jel * (0.10 + 0.22 * rim + 0.18 * rib + 0.30 * exp(-6.2 * (j.x * j.x + y * y))) + jb * (0.15 + 0.30 * rim + 0.14 * rib));
  c += in_ * (bcGlow(3) + 0.1) * (0.35 + 1.3 * band(sat(am / PI + 0.5))) * bcLamp(length(vec2((sin((floor(am * 7.0) + 0.5) / 7.0) - m) * wide, j.y - hem - 0.04) * RB), -0.0032 * o7);
  body = max(body, in_);
 }
 if (o7 > 0.0) for (int i = 0; i < 2; i++) {
  float k = float(i), u = sat((q.x + 1.05) / 0.95), yb = -0.40 + 0.22 * (u - 0.6) * (u - 0.6) + 0.03 * k, tall = (0.52 - 0.06 * k) * o7 * exp(0.3 * o3) * sin(PI * sqrt(u * 0.97 + 0.01)), vv = (q.y - yb) / max(tall, 1e-3), lean = q.x - 0.10 * vv * vv + 0.15 * vv - 0.03 * k;
  float n = lean / 0.083, w2 = (0.011 - 0.007 * sat(vv)) * (0.8 + 0.4 * hash11(floor(n) + 8.0)), x = abs(n - floor(n) - 0.5) * 0.083, one = bcIn(x - w2, 0.0015) * step(0.0, vv) * step(vv, 1.0 - 0.3 * step(0.8, hash11(floor(n) + 3.0)));
  float spine = bcIn(abs(q.y - yb) - 0.02 * min(6.0 - 6.0 * u, 1.0) - 0.006 * sin(q.x * 150.0), 0.002), lit = max(one, spine) * step(0.001, u) * step(u, 0.999);
  c = mix(c, (water * 1.1 + beam * 3.0 + vec3(0.30, 0.28, 0.22) * exp(-2.6 * length(b)) + bcGlow(3) * (0.03 + 0.35 * band(u) * exp(-9.0 * fract(vv * 0.5 - t * 0.06)))) * (1.0 - 0.55 * sat(x / w2)) * (0.6 + 0.5 * noise(q * 70.0)) * (1.0 - 0.45 * k) + 0.01, lit);
  body = max(body, lit * 0.8);
 }
 float haze = exp(0.7 * many) * (0.34 + 0.45 * bcN(vec2(along * 7.0 - 0.3 * sin(t * 0.07), across * 22.0 + bcRun(t * 0.03))));
 c += beam * haze * (1.0 - 0.75 * body);
 c += vec3(1.0, 0.86, 0.6) * bright * (0.35 * exp(-length(b) * 24.0) + 0.05 * exp(-length(b) * 6.0));
 float fall = uTravel * 0.014, some = 0.5 + 0.5 * many + 0.18 * uTexture, fl = exp(0.5 * many);
 float snow = 0.35 * bcSpecks(p + 3.0, 46.0, fall * 0.5, 1.0, 0.0016 * fl, some) + 0.55 * bcSpecks(p + 5.0, 30.0, fall * 0.8, 2.0, 0.0021 * fl, some)
             + 0.8 * bcSpecks(p + 7.0, 19.0, fall * 1.2, 3.0, 0.0028 * fl, some) + bcSpecks(p + 9.0, 8.0, fall * 1.9, 4.0, 0.0050 * fl, 0.75 * some + 0.1);
 c += snow * (water * 0.55 + vec3(0.02, 0.035, 0.05) + beam * 5.5);
 c += bcLife(p, many) * (1.0 - 0.6 * body) * (1.0 - 0.45 * max(-many, 0.0)) * (0.75 + 0.5 * uEnergy);
 float foot = C.y + S * R * 1.4, ty = sat((p.y - foot) / (hull.y - foot)), cx = mix(C.x, hull.x + 0.012, ty) - 0.010 * sin(PI * ty);
 float cab = bcDot(abs(p.x - cx), 0.0013 * mix(S, 0.6, ty)) * smoothstep(foot - 0.004, foot, p.y) * step(p.y, hull.y);
 c = mix(c, mix(vec3(0.16, 0.2, 0.2), water * 0.12, smoothstep(0.0, 0.5, ty)), cab * 0.9);
 c = mix(c, water * 0.02 + vec3(0.0, 0.004, 0.007), bcIn(length(vec2(hq.x, abs(hq.y) + 0.135)) - 0.1495, bcPx));
 vec2 k = q - C0;
 float kr = length(k);
 if (kr < R * 1.8) {
  vec3 sky = bcWater(D * 0.75) * 1.5 + vec3(0.02, 0.03, 0.04);
  float frame = min(bcCap(vec2(abs(k.x), k.y), vec2(0.036, -0.062), vec2(0.022, -0.045), 0.0026, 0.0026), abs(length(k - vec2(0.0, R * 1.22)) - 0.008) - 0.0026);
  c = mix(c, sky * 0.16 + 0.006, bcIn(frame, pxq));
  vec3 n = vec3(k / R, 0.0); n.z = sqrt(max(1.0 - dot(n.xy, n.xy), 0.0));
  float u = 0.5 + 0.5 * n.y;
  vec3 steel = sky * (0.10 + 0.8 * u * u) * (0.7 + 0.5 * noise(k * 120.0)) + sky * 0.9 * pow(sat(dot(n, vec3(-0.25, 0.8, 0.546))), 18.0);
  c = mix(c, steel, bcIn(kr - R, pxq));
  vec2 o = vec2(dot(k, dir) - R * 0.62, dot(k, nrm));
  float pane = length((o - vec2(0.0025, 0.0)) * vec2(1.4, 1.0)) - 0.0165;
  c = mix(c, sky * (0.22 + 0.5 * smoothstep(-0.02, 0.02, o.y * nrm.y + o.x * dir.y)), bcIn(length(o * vec2(1.35, 1.0)) - 0.0245, pxq));
  c = mix(c, vec3(2.6, 2.1, 1.25) * (0.7 + 0.5 * bright) * (1.0 - 0.35 * smoothstep(-0.012, 0.0, pane)), bcIn(pane, pxq));
 }
 return c;
}

// The net of sun on the sand.
float bcNet(vec2 s) {
 float t = bcRun(uTime * 0.16);
 s += 0.4 * vec2(bcN(s * 0.8 + vec2(3.0, t)), bcN(s.yx * 0.8 + vec2(9.0, 64.0 - t)));
 float n = sat(1.0 - abs(bcN(s * 1.25 + vec2(0.0, t)) - bcN(s * 1.7 + vec2(31.0, 64.0 - t))) * 3.6);
 return n * n * n;
}
// How far outside the diver, in metres from the hip.
float bcDiver(vec2 q) {
 float sw = 0.05 * sin(uTime * 0.5), d = min(length((q - vec2(0.03, 0.80)) * vec2(1.15, 1.0)) - 0.12, bcCap(q, vec2(0.02, 0.7), vec2(0.0, 0.0), 0.07, 0.10));
 d = min(d, bcCap(q, vec2(-0.02, 0.48), vec2(-0.01, 0.1), 0.19, 0.12));
 d = min(d, min(bcCap(q, vec2(0.12, 0.53), vec2(0.30, 0.44), 0.055, 0.045), bcCap(q, vec2(0.30, 0.44), vec2(0.46, 0.76), 0.045, 0.03)));
 vec2 f1 = vec2(-0.05 - sw, -0.90), f2 = vec2(0.07 + 0.6 * sw, -0.80);
 d = min(d, min(bcCap(q, vec2(-0.04, 0.0), f1, 0.09, 0.035), bcCap(q, vec2(0.05, 0.0), f2, 0.09, 0.035)));
 return min(d, min(bcCap(q, f1, vec2(-0.16 - 3.0 * sw, -1.85), 0.02, 0.085), bcCap(q, f2, vec2(0.20 + 2.0 * sw, -1.72), 0.02, 0.085)));
}
float bcEdge(float a, float R, float rough) { return R * (1.0 + rough * (0.030 * sin(3.0 * a + 1.0) + 0.020 * sin(7.0 * a + 2.2) + 0.014 * sin(17.0 * a))); }

vec3 bcRim(vec2 p) {
 const float F = 0.92;
 float o3 = uOwn[3], o4 = uOwn[4], o5 = uOwn[5], o6 = uOwn[6], o7 = uOwn[7], low = max(-uOwn[2], 0.0), high = max(uOwn[2], 0.0), t = uTime;
 float H = 3.0 - 1.7 * low + 7.5 * high + 0.08 * sin(t * 0.23), th = 0.42 - 0.17 * low + 0.50 * high, sn = sin(th), cs = cos(th);
 vec3 rd = normalize(vec3(p.x, p.y * cs - F * sn, p.y * sn + F * cs));
 float R = 8.3 * exp((o3 < 0.0 ? 0.75 : 0.5) * o3), rough = 0.35 + 0.75 * max(o5, 0.0) + 0.35 * min(o5, 0.0);
 vec2 C = vec2(3.1 - 2.2 * high + 1.5 * max(o3, 0.0) + 1.2 * min(o3, 0.0), 3.3 - 1.6 * min(o3, 0.0) + R + 0.8 * high + 0.4 * low);
 vec3 sunC = mix(vec3(dot(bcTop, vec3(0.33))), bcTop, 0.36), fogK = bcLoss * vec3(0.0075, 0.0070, 0.0095) * (1.2 - 0.4 * uSpace);
 float up = max(rd.y, 0.0);
 vec3 haze = bcTop * mix(vec3(0.10, 0.30, 0.46), vec3(0.45, 0.62, 0.66), smoothstep(0.0, 0.30, up));
 haze += bcTop * 0.4 * smoothstep(0.03, 0.2, up) * smoothstep(0.45, 0.85, bcN(vec2(p.x * 1.4, 1.9) / (up + 0.06) + vec2(0.0, bcRun(t * 0.2))));
 if (o7 < 0.0) haze *= 1.0 + 0.7 * o7;
 vec3 c = haze;
 float T = min(H / max(-rd.y, 1e-3), 300.0), pxw = T / (F * uRes.y), fine = pxw / max(-rd.y, 0.05);
 vec2 w = rd.xz * T, rel = w - C;
 vec2 C1 = C;
 float R1 = R, ri = R * 0.62 * max(-o6, 0.0);
 if (o6 > 0.0) {
  R1 = R *= 1.0 - 0.42 * o6;
  float near_ = length(rel) - R;
  vec2 to = C;
  for (int i = 0; i < 12; i++) {
   vec2 g = vec2(mod(float(i), 3.0), floor(float(i) / 3.0)), h = hash22(g + 5.0);
   vec2 at = C + 2.15 * R1 * (vec2(g.x - 1.5 + mod(g.y, 2.0) * 0.5, g.y - 1.0) + 0.3 * (h - 0.5));
   float rr = R1 * (0.25 + 0.6 * h.y) * o6, d = length(w - at) - rr;
   if (g.y * 4.0 + g.x != 5.0 && d < near_) { near_ = d; to = at; R = rr; }
  }
  C = to; rel = w - C;
 }
 float r = length(rel), an = atan(-rel.x, rel.y + 1e-6), out_ = r - bcEdge(an, R, rough);
 if (o6 < 0.0) out_ = max(out_, ri - r);
 vec3 well = vec3(0.0);
 if (o7 < 0.0) well = -o7 * pow(mix(uKind[0], uKind[1], 0.5 + 0.5 * sin(t * 0.05)), vec3(1.6)) * (0.8 + 0.6 * uDrone + 0.4 * uPad + 0.4 * uHits);
 if (T < 299.0) {
  float lip = 1.0 - smoothstep(0.0, 1.1, out_), ph = (w.y * 0.9 + w.x * 0.35) * 19.0 + 9.0 * bcN(w * 0.4 + 40.0) + 3.0 * bcN(w * 1.3 + 90.0);
  float shade = 1.0 + 0.42 * sin(ph + 0.6 * sin(ph)) * (1.0 - lip) * exp(-fine * 22.0) * (1.0 - 0.6 * max(-o5, 0.0));
  shade += 0.5 * (bcN(vec2(an * R * 2.6, out_ * 1.1 + bcRun(t * 0.5))) - 0.5) * lip * (1.0 - smoothstep(2.6, 3.0, abs(an))) - lip * lip * (0.15 + 0.25 * dot(rel / max(r, 0.01), vec2(-0.7, -0.7)));
  float net = (bcNet(w * 1.7) + 0.5 * bcNet(w * 0.9 + 17.0)) * exp(-fine * 4.0) * (0.6 + 0.8 * uTone);
  vec3 sand = vec3(0.80, 0.75, 0.62) * shade * (0.58 + 0.12 * uLevel + (0.50 + 0.6 * uPad + uKeys) * net) * sunC * 1.3;
  if (o7 < 0.0) sand = sand * (1.0 + 0.98 * o7) + well * 0.15 * exp(-max(out_, 0.0) * 0.9) * shade;
  if (o7 > 0.0) {
   float bare = smoothstep(0.0, 0.8, out_ - 0.25 - 0.9 * bcN(vec2(an * R * 0.7, 2.0)) - 1.2 * smoothstep(0.55, 0.9, bcN(w * 0.28 + 9.0))), got = 0.0, hi = 0.0;
   vec2 st = rd.xz / max(-rd.y, 0.08), sw = vec2(0.22, 0.06) * sin(w.x * 0.5 + w.y * 0.35 + t * 0.5);
   for (int i = 0; i < 5; i++) {
    float h = 1.0 - float(i) * 0.2;
    vec2 g = w - st * h * 0.50 * o7 + sw * h * h;
    float on = smoothstep(0.42, 0.62, noise(g * vec2(13.0, 9.0)) + 0.5 * noise(g * 1.7 + 40.0) - 0.42 * h) * (1.0 - got);
    hi += on * h; got += on;
   }
   vec3 leaf = mix(vec3(0.02, 0.06, 0.03), vec3(0.26, 0.42, 0.13), hi * hi) * (0.4 + 0.35 * uLevel + (0.7 + 0.6 * uPad) * net) * sunC;
   sand = mix(sand, mix(vec3(0.015, 0.035, 0.022) * sunC, leaf, got), sat(1.6 * o7) * bare);
  }
  vec3 fog = exp(-fogK * T), ground = sand * fog + haze * (1.0 - fog), hole = ground;
  if (out_ < pxw * 3.0) {
   float A = max(dot(rd.xz, rd.xz), 1e-4), B = dot(rel, rd.xz), E = r - out_, s = 0.0, a = an;
   for (int i = 0; i < 2; i++) {
    s = max(-B + sqrt(max(B * B - A * (dot(rel, rel) - E * E), 0.0)), 0.0) / A;
    vec2 e = rel + rd.xz * s; a = atan(-e.x, e.y + 1e-6); E = bcEdge(a, R, rough);
   }
   if (o6 < 0.0) {
    float di = B * B - A * (dot(rel, rel) - ri * ri), s1 = (-B - sqrt(max(di, 0.0))) / A;
    if (di > 0.0 && s1 > 0.0 && s1 < s) { s = s1; vec2 e = rel + rd.xz * s; a = atan(e.x, -e.y - 1e-6); }
   }
   float Y = -rd.y * s, dist = T + s, u = a * R;
   float ledge = bcN(vec2(u * 0.22, Y * 1.5 + 3.0)) + 0.5 * bcN(vec2(u * 0.8 + 20.0, Y * 3.6)) - bcN(vec2(u * 0.22, Y * 1.5 + 3.3)) - 0.5 * bcN(vec2(u * 0.8 + 20.0, Y * 3.6 + 0.8));
   ledge *= 1.0 + 0.7 * o5;
   vec3 wall = vec3(0.34, 0.33, 0.28) * max(0.65 + 0.3 * cos(a + 2.19) + 1.1 * ledge, 0.08) * (0.6 + 0.6 * bcN(vec2(u * 2.3, Y * 2.0)));
   wall = (wall + vec3(0.30, 0.28, 0.23) * smoothstep(0.16, 0.26, ledge)) * (1.0 - 0.6 * exp(-Y * 2.0));
   float fu = a / PI * 15.0, fi = floor(fu), falls = 0.0;
   for (int j = -1; j <= 1; j++) {
    float id = fi + float(j) + 8.0, h = hash11(id + 5.0), h2 = hash11(id + 19.0), m = (fu - fi - float(j) - 0.5 - 0.6 * (h - 0.5)) * PI / 15.0 * R;
    float wd = (0.05 + 0.15 * h2) * (1.0 + 0.5 * uLow + 1.2 * max(o4, 0.0)) + 0.035 * Y, x = m / wd;
    float flow = bcN(vec2(x * 1.6 + id * 9.0, Y * 0.8 + 64.0 - bcRun(t * 1.1))) + 0.6 * bcN(vec2(x * 4.0 + id * 5.0, Y * 2.0 + 64.0 - bcRun(t * 2.4)));
    falls += smoothstep(0.0, 0.3, 0.68 + 0.6 * o4 - h) * (0.25 + 0.9 * h2) * (0.5 + 0.4 * uLow + 0.6 * uBands[int(clamp(id, 0.0, 15.0))]) * exp(-x * x) * (0.25 + 0.75 * flow) * (0.12 + 0.2 * exp(-Y * 0.6)) / (0.06 + 0.4 * wd);
   }
   float hd = (1.0 - uHits) * 5.0, hm = (a - 0.18 - 0.5 * sin(t * 0.09)) * R;
   float gush = smoothstep(0.0, 0.15, uHits) * exp(-(hm * hm * 0.12 + (Y - hd) * (Y - hd) * 0.6) / (1.2 + 0.2 * hd));
   vec4 pc = piece(vec2(0.5 - a / 2.4, sat(Y / 9.0))) * (1.0 - smoothstep(0.8, 1.2, abs(a)));
   vec3 down = exp(-bcLoss * vec3(0.030, 0.040, 0.040) * Y * (1.0 + 0.08 * Y)), lit = sunC * 1.1 * down + bcTop * 0.01 * exp(-Y * 0.2);
   wall = wall * (lit + 0.3 * pc.rgb * (0.4 + uEnergy)) + (vec3(0.80, 0.75, 0.62) * (falls + gush) + bcGlow(4) * 0.3 * gush) * (lit + 0.12 * sunC * down.b) + sunC * 0.3 * gush * gush;
   float slide = bcRun(uTravel * 0.2);
   vec2 G = vec2(0.55, 1.5), g = vec2(Y, u) * G.yx, id = floor(g + vec2(0.0, slide)), h = hash22(vec2(id.x, mod(id.y, 64.0)) + 4.0), f = (g + vec2(0.0, slide) - id - 0.5 - (h - 0.5) * 0.5) / G.yx;
   float l = 0.20 + 0.16 * h.x, fw = 0.07 * sat(1.0 - f.y * f.y / (l * l)), px = dist / (F * uRes.y);
   float fish = bcIn(abs(f.x) - fw, px) * step(abs(f.y), l) * smoothstep(0.0, 0.2, 0.42 + 0.4 * o4 - hash21(id + 9.0)) * smoothstep(0.4, 1.0, Y);
   wall += fish * mix(vec3(0.7, 0.9, 1.0), pc.rgb / max(pc.a, 0.01), sat(pc.a * 2.5)) * (0.3 * lit + pc.a * (0.4 + 0.9 * uEnergy));
   fog = exp(-fogK * 0.8 * dist);
   hole = wall * fog + (haze * 0.7 * down + bcDeep) * (1.0 - fog) + sand * 0.25 * exp(-Y * 9.0) * fog;
   if (o7 < 0.0) hole = hole * (1.0 + 0.7 * o7) + well * 2.2 * (1.0 - exp(-Y * 0.09)) * max(0.75 + 0.6 * ledge, 0.0) * (1.0 - 0.9 * fish);
  }
  c = mix(hole, ground, smoothstep(-pxw, pxw, out_ * max(-rd.y, 0.15)));
 }
 C = C1; R = R1;
 if (o7 < 0.0) c += well * 0.2 * exp(-pow(abs(p.x - F * C.x / max(C.y, 1.0)) * C.y / (R * 0.8), 2.0)) * smoothstep(-0.25, 0.1, p.y) * exp(-max(p.y, 0.0) * 2.5) * (0.5 + bcN(vec2(p.x * 12.0, p.y * 3.0 + 64.0 - bcRun(t * 0.15))));
 float sl = p.x + 0.35 * p.y - 0.05 * sin(t * 0.07) + 0.9 * uCue * (1.0 - uCue), ray = bcN(vec2(sl * 7.0 + 20.0, 4.0 + 0.6 * sin(t * 0.06)));
 c += bcTop * vec3(0.5, 0.9, 1.0) * (0.05 + 0.04 * uPad + 0.14 * uCue) * smoothstep(0.4, 0.95, ray) * smoothstep(-0.5, 0.5, p.y);
 float lz = C.y - R * (0.25 + 0.2 * high + 0.55 * max(-o6, 0.0)), kk = p.y / F, fw = 1.0 / max(cs + kk * sn, 0.05), dep = lz * fw, pl = dep / (F * uRes.y);
 vec2 q = vec2(p.x * dep / F - C.x + R * (0.36 - 0.1 * high), H + lz * (kk * cs - sn) * fw);
 if (out_ < 0.0 || w.y > lz || T > 299.0) {
  float line = (1.0 - smoothstep(0.0, pl, abs(q.x) - 0.004)) * exp(-max(-q.y, 0.0) * 0.16), bead = fract(0.06 * q.y + 0.11 * t) - 0.5;
  c = mix(c, sunC * 0.45, line * 0.55) + line * bcGlow(3) * uPhrase * 2.0 * exp(-60.0 * bead * bead);
  q = (q - vec2(-0.58, -0.55 + 0.06 * sin(t * 0.31))) / 1.25;
  float d = bcDiver(q);
  vec3 fog = exp(-fogK * dep), suit = bcTop * (0.004 + 0.12 * smoothstep(-0.06, 0.02, d) * smoothstep(-0.4, 0.9, q.y - 0.5 * q.x));
  c = mix(c, suit * fog + haze * 0.12 * (1.0 - fog), bcIn(d * 1.25, pl));
  c += vec3(0.8, 0.64, 0.4) * uMic * exp(-length(q - vec2(0.1, 0.8)) * 5.0);
 }
 float some = 0.32 + 0.4 * o4 + 0.4 * uTexture;
 return c + bcSpecks(p + 7.0, 22.0, uTravel * 0.008, 3.0, 0.0020, some) * bcTop * vec3(0.1, 0.2, 0.25);
}

vec3 render(vec2 p) {
 bcPx = 0.7 / uRes.y;
 p.x += (0.22 - 0.32 * uVar) * (1.0 - smoothstep(0.6, 1.3, uRes.x / uRes.y));
 float o0 = uOwn[0], o1 = uOwn[1], green = max(-o0, 0.0), dusk = max(o0, 0.0), day = max(-o1, 0.0), night = max(o1, 0.0);
 bcTop = mix(mix(vec3(0.55, 1.5, 1.4), vec3(0.95, 1.3, 0.85), green), vec3(1.9, 1.05, 0.8), dusk) * mix(vec3(1.0), vec3(0.14, 0.2, 0.3), night);
 bcLoss = mix(mix(vec3(14.0, 5.0, 2.9), vec3(8.0, 3.5, 5.0), green), vec3(4.0, 5.2, 3.3), dusk) * exp(0.14 - 0.30 * uDrone - 0.75 * day + 0.6 * night + 0.3 * uOwn[4]);
 bcDeep = mix(mix(vec3(0.0065, 0.0015, 0.0085), vec3(0.002, 0.007, 0.004), green), vec3(0.013, 0.001, 0.010), dusk) * (1.0 + 2.0 * day);
 return screenOf(uVar < 0.5 ? bcCable(p) : bcRim(p));
}
