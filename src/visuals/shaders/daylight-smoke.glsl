// name: Daylight smoke
// a: Smoke flowers
// b: Weeping lines
// what: Noon fireworks, painted in smoke on a pale paper sky, with only the tip of one pole below: round flowers of lumpy petals in chalk red, indigo, saffron and bottle green, lit from the upper left, the old ones only stains; or long weeping lines of two colours that fall from a burst, kink in the wind and thin out.
// follows: Where the piece sounds a shell opens as the loop gets there, in its colours, and frays to a stain. Drone leans it like wind, pad warms the sky, texture frays, phrase and voice thicken the thread; low, mid and high stretch petals and lines. A hit is a white-hearted flower at the playing place, a cue one great shell, keys dots. Tone sharpens, Space widens.
// own: 0 the powders: 1 the sounds' own colours, -1 white smoke; 1 the form: 1 thin rays (b: few thick ropes), -1 round heaped puffs (b: fine rain); 2 the sky: 1 night with stars, -1 a low sun in a sky of the sounds' colours; 3 1 each stands on a stem (b: a trunk), -1 each sinks like ink with a tail above it (b: the lines turned round to rise); 4 1 hills in front, -1 water below that mirrors it; 5 1 all of it grains of dust, -1 flat shapes in two tones with a dark line; 6 1 torn away on the wind, -1 twisted into spirals; 7 1 many small ones in clusters and none fade, -1 one great one at a time in the middle
const vec2 dsL = vec2(-0.64, 0.77);              // where the noon sun stands
vec3 dsC = vec3(0.0), dsT = vec3(1.0);           // the smoke laid so far, front to back, and what still shows through it
vec2 dsHit = vec2(9.0);                          // from where a hit is
float dsG = 0.0;                                 // the grain here
// Lays smoke behind what is there. Young smoke covers the paper; old smoke (f to 1) only stains it.
void dsLay(vec3 body, vec3 ink, float f, float al) {
  if (uOwn[5] > 0.0) al = mix(al, smoothstep(dsG - 0.1, dsG + 0.1, al * 1.1), uOwn[5]);
  if (uOwn[5] < 0.0) {
    body = mix(body, ink * ink * 0.22, -uOwn[5] * (1.0 - smoothstep(0.12, 0.3, abs(al - 0.45))) * 0.9 * (1.0 - min(1.6 * f, 1.0)));
    al = mix(al, smoothstep(0.2, 0.3, al), -uOwn[5]); f *= 1.0 + 0.75 * uOwn[5];
  }
  f *= 1.0 - 0.8 * max(uOwn[2], 0.0);
  dsC += dsT * body * al * (1.0 - f);
  dsT *= 1.0 - al + al * f * mix(vec3(1.0), ink, 0.48);
}
// A lump of smoke in its own colour, lit from -1 (its shade) to 1 (the sun).
vec3 dsLit(vec3 ink, float lit) {
  if (uOwn[5] < 0.0) lit = mix(lit, mix(-0.9, 0.35, smoothstep(-0.06, 0.06, lit)), -uOwn[5]);
  vec3 c = mix(ink * vec3(0.68, 0.64, 0.73), ink, smoothstep(-0.9, 0.0, lit));
  c *= 1.0 - 0.45 * max(-uOwn[0], 0.0) * smoothstep(0.5, -0.8, lit);
  return mix(c, mix(ink, vec3(1.0, 0.97, 0.91), 0.38 + 0.3 * uEnergy), smoothstep(0.0, 1.0, lit));
}
vec3 dsWhite(vec3 c) { return uOwn[0] < 0.0 ? mix(c, vec3(0.93, 0.92, 0.90), -0.96 * uOwn[0]) : c; }
// Four smoke powders: chalk red, indigo, saffron, bottle green.
vec3 dsPowder(int k) {
  k = k % 4;
  vec3 c = k == 0 ? vec3(0.80, 0.25, 0.20) : k == 1 ? vec3(0.21, 0.27, 0.52) : k == 2 ? vec3(0.93, 0.62, 0.15) : vec3(0.16, 0.42, 0.33);
  if (uOwn[0] > 0.0) c = mix(c, uKind[k], uOwn[0]);
  return dsWhite(c);
}
// The sound at a shell's moment, at two heights of the room: rgb its powder, stained by the kinds there, a how strong.
vec4 dsSound(float x, float y, float apart, vec3 own) {
  vec4 m = piece(vec2(x, sat(y - 0.1))) + piece(vec2(x, sat(y + apart)));
  vec3 c = m.rgb / max(max(m.r, max(m.g, m.b)), 0.02);
  float on = smoothstep(0.02, 0.25, m.a);
  if (uOwn[0] != 0.0 || uOwn[7] != 0.0) return vec4(dsWhite(mix(own, c * c * 0.8, 0.4 * smoothstep(0.02, 0.2, m.a) * (1.0 - 0.3 * uOwn[0]))), max(on, 0.75 * smoothstep(0.0, 0.3, abs(uOwn[7]))));
  return vec4(mix(own, c * c * 0.8, 0.4 * smoothstep(0.02, 0.2, m.a)), on);
}
// Four chance numbers for the corners of a square of the plane, and a soft noise of them, cheaper than the usual one.
vec4 dsFour(vec2 i) {
  vec4 k = 50.0 * fract(vec4(i, i + 1.0) * 0.3183099 + 0.113).xzyw;
  vec4 x = k.xyxy, y = k.zzww;
  return fract(x * y * (x + y));
}
float dsN(vec2 p) {
  vec2 i = floor(p), f = p - i;
  vec4 h = dsFour(i);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h.x, h.y, f.x), mix(h.z, h.w, f.x), f.y);
}
// Round lumps with sharp valleys between: x how high, y how much of the lump faces the sun.
vec2 dsBillow(vec2 q) {
  vec2 i = floor(q), f = q - i, g = 6.0 * f * (1.0 - f);
  vec4 h = dsFour(i);
  f = f * f * (3.0 - 2.0 * f);
  float a = h.x, b = h.y, c = h.z, d = h.w, k = a - b - c + d;
  float n = 2.0 * mix(mix(a, b, f.x), mix(c, d, f.x), f.y) - 1.0;
  float m = sqrt(n * n + 0.02);
  return vec2(m, -n / m * dot(g * vec2(b - a + k * f.y, c - a + k * f.x), dsL));
}
// Low, middle and high band along f.
float dsBand(float f) { return mix(mix(uLow, uMid, sat(2.0 * f)), uHigh, sat(2.0 * f - 1.0)); }
// The petal nearest to angle a (in petals) of a ring; r how far out. x how far inside it, y and z its round side's lean, along and across.
vec3 dsPetal(float r, float a, float i, float n, float seed, float len, float fat) {
  float id = mod(i, n), h = fract(id * 0.618 + seed), g = fract(id * 0.379 + seed * 1.7);
  float da = (a - i - 0.5 - 0.35 * (h - 0.5)) * TAU / n;
  float w1 = fat * (0.8 + 0.4 * h), l = len * (0.7 + 0.3 * g + 0.3 * (dsBand(fract(id * 0.447)) - 0.3)) - w1 * 0.6;
  float u = r * (1.0 - 0.5 * da * da), t = sat(u / l), w = mix(0.03, w1, 0.35 * t + 0.65 * t * t * t);
  vec2 v = vec2(u - l * t, r * da);
  float dv = length(v);
  return vec3(w - dv, v / max(max(w, dv), 0.01));
}
// One flower of smoke: v from its heart, R its reach, age 0 to 1, on how much of it there is, heart its white.
void dsFlower(vec3 ink, vec2 v, float R, float n, float seed, float age, float on, float heart) {
  vec2 q = v / R;
  float r2 = dot(q, q), fr = smoothstep(0.06, 0.6, age), flow = uTravel * 0.04 + seed, px = 1.0 / (R * uRes.y), big = smoothstep(0.02, 0.11, R);
  if (uOwn[6] < 0.0) q = rot(uOwn[6] * (3.6 * sqrt(r2) - 0.6 + 0.06 * uTime)) * q;
  if (uOwn[6] > 0.0) { q.x -= uOwn[6] * (0.25 + 0.5 * q.y * q.y + 0.5 * max(q.x, 0.0)); q.y += uOwn[6] * 0.12 * sin(q.x * 3.0 - flow * 5.0 + seed); }
  // the wind leans it, its own weight bends the petals down, and it frays
  q.x -= (0.12 + 0.4 * uDrone) * fr * (q.y + 0.3);
  q.y += 0.11 * min(r2, 1.1) * (0.4 + fr) * (1.0 + 2.4 * min(uOwn[3], 0.0));
  float curl = dsN(q * 6.5 + vec2(-flow, seed)) - 0.5, fine = (dsN(q * 15.0 + vec2(seed, flow)) - 0.5) * big, slow = 0.27 * (sin(q.x * 3.7 + seed * 2.3) + sin(q.y * 4.3 - q.x * 1.9 + seed + flow * 0.7)) * cos(q.y * 2.1 - seed);
  q = q * (1.0 - slow * (0.25 + 0.3 * fr)) + vec2(-q.y, q.x) * curl * 0.1 + vec2(curl, -fine) * (0.05 + 0.1 * fr) + vec2(slow - fine, curl) * 0.06;
  float thin = 1.0 - 0.84 * max(uOwn[1], 0.0), puff = max(-uOwn[1], 0.0);
  float r = length(q) + 1e-4, a = atan(q.y, q.x + 1e-5) / TAU, ao = a * n, io = floor(ao), m = floor(n * 0.6), ai = (a + 0.13) * m;
  vec3 k = dsPetal(r, ao, io, n, seed, 1.0, 1.95 / n * thin), inner = dsPetal(r, ai, floor(ai), m, seed + 5.3, 0.58, 0.16 * thin);
  k.x -= 0.13 * smoothstep(0.34, 0.5, abs(ao - io - 0.5));            // petals part where they meet
  if (inner.x + 0.04 > k.x) k = vec3(inner.x + 0.04, inner.yz);
  if (puff > 0.0) {
    vec2 lump = dsBillow(q * 2.6 + seed * 5.0), small = dsBillow(q * 6.1 - seed * 3.0);
    k = mix(k, vec3(0.62 + 0.42 * lump.x + 0.16 * small.x - length(q * vec2(0.85, 1.15)), 0.8 * sat(r), 0.0), puff);
    curl = mix(curl, 0.45 * curl + clamp(lump.y * 0.22, -0.4, 0.6) + clamp(small.y * 0.06, -0.2, 0.3), puff);
  }
  k.yz *= sat(1.0 + 8.0 * k.x);
  vec2 rad = q / r, b = dsBillow(q * 5.5 + vec2(seed * 3.0, -flow));
  float h = k.x + ((b.x - 0.4) * 0.1 + curl * 0.06 + fine * (0.06 + 0.1 * fr + 0.1 * uTexture)) * (1.0 - 0.85 * max(uOwn[1], 0.0));
  if (uOwn[1] > 0.0) h += 0.05 * uOwn[1] * smoothstep(0.75, 0.95, r) - 0.004 * uOwn[1];
  // a hard front at the tips while young, loose toward the heart, loose everywhere when old
  float soft = mix(mix(0.15, 0.035, smoothstep(0.25, 0.75, r)), 0.32, fr) * (1.25 - 0.5 * uTone) + px;
  float al = smoothstep(-soft, soft * 1.3, h + 0.02) * (1.0 - 0.3 * fr * (b.x + fine));
  al = max(al, 0.5 * (1.0 - smoothstep(0.15, 1.05, r)) * (0.7 + curl) * (1.0 - 0.75 * max(uOwn[1], -min(uOwn[5], 0.0))));     // a thin veil between the petals
  al = max(al, (1.0 - big) * (1.0 - smoothstep(0.4, 0.95, r)));             // just opening it is one ball
  float lit = 0.75 * dot(rad * k.y + vec2(-rad.y, rad.x) * k.z, dsL) + clamp(b.y * 0.2, -0.25, 0.35) + 0.35 * dot(q, dsL) + 0.6 * curl + 0.5 * fine;
  vec3 body = mix(dsLit(ink, (lit < 0.0 ? max(lit, -0.65) * smoothstep(-0.03, 0.03, h) : lit) * (1.0 - 0.5 * fr)), vec3(1.0, 0.985, 0.94), sat(heart * exp(-r * r * 7.0)));
  dsLay(body, ink, fr * 0.75, al * on * (1.0 - smoothstep(1.2, 1.6, r2 * (1.2 + 0.4 * curl))));
}
// A stem down from v's heart to the ground, or a tail left above it.
void dsStem(vec3 ink, vec2 v, float R, float seed, float on) {
  float up = uOwn[3] > 0.0 ? -v.y : v.y, o = abs(uOwn[3]), thick = R * (uVar > 0.5 ? 0.035 + 0.10 * up * up + 0.05 * up : 0.03);
  float x = v.x - 0.05 * sin(up * 5.0 + seed + 0.1 * uTravel) * up - 0.02 * sin(seed * 3.0 + up * 11.0);
  for (int near = 0; near < 1 && up > 0.0 && abs(x) < 0.2; near++) {
    if (uOwn[3] > 0.0) {
      float side = x < 0.0 ? -1.0 : 1.0, y = up - R * 1.25 - 0.14 * (0.5 + 0.5 * side) * fract(seed), e = (abs(x) - 0.45 * R) / (0.5 * R), w = y + 0.5 * e * R * 0.6;
      float leaf = uVar > 0.5 ? -1.0 : 1.0 - e * e - abs(w) / (0.10 * R);
      vec3 green = dsWhite(mix(vec3(0.22, 0.30, 0.22), ink * 0.6, 0.5));
      float edge = fwidth(x) + 0.001;
      dsLay(dsLit(green, abs(x) < thick ? -0.9 * x / thick : 0.12 * side), green, 0.0, o * on * max(smoothstep(edge, -edge, abs(x) - thick), smoothstep(0.0, 0.2, leaf)) * smoothstep(0.0, uVar > 0.5 ? 0.09 : 0.02, up));
    } else {
      float n = dsN(vec2(v.y * 26.0 - 0.2 * uTravel, v.x * 30.0 + seed)) , w = R * (0.2 + 0.5 * up) * (0.4 + 1.0 * n), d = x / w;
      dsLay(dsLit(ink, -d), ink, 0.35, o * on * exp(-d * d) * exp(-up * 1.2) * smoothstep(0.0, 1.2 * R, up));
    }
  }
}
// One weeping shell, v from its burst: a curtain of lines thrown out to the sides, slowed by the air and falling. All of them
// are found at once, by folding the place they were thrown from; the lower the fresher.
void dsWeep(vec3 ink, vec3 ink2, vec2 v, float R, float seed, float age, float on) {
  float flow = uTravel * 0.05 + seed, px = 1.0 / uRes.y, down = max(-v.y, 0.0), fr = smoothstep(0.06, 0.5, age);
  // the wind leans the curtain and kinks every line at its own heights
  float gust = 0.2 * (sin(v.y * 15.0 - flow * 1.3 + 2.0 * sin(v.x * 4.0 + seed)) + sin(v.y * 26.0 + v.x * 7.0 + seed)), curl = dsN(v * vec2(34.0, 22.0) + vec2(seed, flow)) - 0.5, fine = dsN(v * 75.0 + vec2(-flow, seed)) - 0.5;
  vec2 q = v / R - vec2(0.0, 0.06);
  if (uOwn[6] < 0.0) v.x += uOwn[6] * 0.16 * min(down * 2.0, 1.0) * sin(v.y * 17.0 + seed + v.x * 3.0 + 0.1 * uTime);
  if (uOwn[6] > 0.0) v.x -= uOwn[6] * (0.4 * down + 0.9 * down * down);
  v.x -= down * (0.12 + 0.3 * down + 0.3 * uDrone) * (0.4 + fr) + gust * 0.26 * min(down, 0.4) * (0.5 + fr);
  v += vec2(curl, fine * 0.5) * (0.014 + 0.02 * fr + 0.012 * uTexture);
  // the burst itself, a torn puff that the lines hang from
  for (int near = 0; near < 1 && dot(q, q) < 0.26; near++) {
    vec2 b = dsBillow(mat2(0.8, 0.6, -0.6, 0.8) * q * 4.6 + vec2(seed * 3.7, -flow) + vec2(fine, curl) * 0.7);
    float ph = 0.23 - length(q * vec2(0.75, 1.15)) + (b.x - 0.4) * 0.16 + curl * 0.24 + fine * 0.06;
    dsLay(dsLit(ink, 1.6 * dot(q, dsL) + b.y * 0.3 + curl * 0.6), ink, 0.7 * fr, smoothstep(-0.05 - 0.2 * fr, 0.14, ph) * (1.0 - smoothstep(0.12, 0.26, dot(q, q))) * (0.95 - 0.35 * fr) * on);
  }
  float reach = 1.0 - exp(-age * 8.0);
  float G = R * 0.2, gap = R * 0.112 * exp2(uOwn[1]), t = max(R * 0.1 - v.y, 0.0) / G, e = exp(-t), open = 1.0 - e;
  for (int near = 0; near < 1 && t > 0.0 && t < 18.0 * reach; near++) {
    float X = v.x / max(open, 0.03) / gap, id = floor(X), lean = X * gap * e / G;
    float h = fract(id * 0.618 + seed * 0.37), g = fract(h * 17.3 + id * 0.113);
    float dist = (X - id - 0.5 - 0.5 * (h - 0.5)) * gap * open / sqrt(1.0 + lean * lean);
    float tip = reach * (1.6 + 9.5 * g * g + 1.5 * h + 4.0 * dsBand(fract(h * 5.0)) * h) + 0.01, s = sat(t / tip);
    float w = (mix(0.0095, 0.006, s) * (0.6 + 0.7 * fr) + 0.004 * smoothstep(0.8, 1.0, s) * (1.0 - fr)) * (0.55 + 2.0 * R) * (1.0 + 1.3 * curl + fine) * (uOwn[1] > 0.0 ? 1.0 + 2.6 * uOwn[1] : 1.0 + 0.5 * uOwn[1]), ww = max(w, px);
    float d = abs(dist) / ww, al = (1.0 - smoothstep(0.2 + 0.4 * uTone - 0.5 * fr, 1.4, d)) * (1.0 - smoothstep(tip * 0.95, tip, t)) * mix(1.0, 0.3 + 0.7 * s, fr) * min(1.0, w / px);
    vec3 c = mix(ink, ink2, step(0.58, fract(h * 7.0)));
    dsLay(dsLit(c, -clamp(dist / ww, -1.0, 1.0) * 0.7 + curl + fine), c, 0.7 * fr, al * on * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(8.0, 10.0, abs(X) * exp2(uOwn[1]))));
  }
}
// A thin thread of pale smoke going up from a to b, loosening and swaying more the higher it is.
void dsThread(vec2 p, vec2 a, vec2 b, float seed, float on, float w) {
  float t = (p.y - a.y) / (b.y - a.y), f = uTravel * 0.11 + seed;
  float x = p.x - mix(a.x, b.x, t * t * (1.6 - 0.6 * t)) - t * (0.02 * sin(t * 9.0 - f) + 0.02 * t * sin(t * 23.0 - 1.7 * f + seed) + 0.012 * t * sin(t * 51.0 - 2.3 * f));
  for (int near = 0; near < 1 && t > 0.0 && t < 1.0 && abs(x) < 0.07; near++) {
    float n = dsN(vec2(p.y * 34.0 - 3.0 * f, p.x * 40.0 + seed)), d = x / (w * (0.7 + 5.0 * t * t) * (0.35 + 1.3 * n));
    dsLay(mix(vec3(0.64, 0.66, 0.70), vec3(0.95, 0.945, 0.93), (1.0 - smoothstep(-1.4, 1.4, d))), vec3(1.0), 0.0,
          exp(-d * d) * on * smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.45, 1.0, t)) * (0.65 + 0.35 * n));
  }
}
// The sky of another hour.
vec3 dsSky(vec3 sky, vec2 p, float wide) {
  float y = sat(p.y + 0.5);
  if (uOwn[2] > 0.0) {
    vec2 g = p / 0.036, at = floor(g);
    float h = hash21(at), d = length(g - at - 0.3 - 0.4 * vec2(h, fract(h * 57.3)));
    vec3 c = mix(vec3(0.055, 0.060, 0.085), uKind[1] * 0.16, 0.5) * (1.25 - 0.6 * y) + 0.05 * uKind[0] * exp(-6.0 * y);
    c += step(0.86, h) * (h - 0.8) * 4.0 * smoothstep(0.10, 0.04, d) * vec3(0.95, 0.92, 0.82) * (0.8 + 0.2 * sin(uTime * 0.6 + h * 90.0));
    sky = mix(sky, c, uOwn[2]);
  }
  if (uOwn[2] < 0.0) {
    float d = length(p - vec2(0.24 * wide, 0.02 + 0.02 * uPad));
    vec3 c = mix(mix(uKind[3], vec3(1.0, 0.95, 0.85), 0.35), mix(uKind[1], vec3(0.9), 0.12), smoothstep(0.0, 0.95, y + 0.04 * sin(p.x * 3.0)));
    c = mix(c, mix(uKind[3], vec3(1.0, 0.96, 0.88), 0.72), 0.5 * exp(-d * 5.0) + 0.45 * smoothstep(0.172, 0.166, d));
    sky = mix(sky, c + (dsN(p * vec2(60.0, 260.0)) - 0.5) * 0.02, -uOwn[2]);
  }
  return sky;
}
vec3 render(vec2 p) {
  float deep = 0.0, calm = 1.0;
  if (uOwn[4] < 0.0) {                 // water: all of it again, upside down
    deep = mix(-0.62, -0.17, -uOwn[4]) - p.y;
    if (deep > 0.0) {
      p.y += 2.0 * deep;
      p.x += (0.004 + 0.05 * deep) * (sin(deep * 70.0 / (1.0 + 4.0 * deep) - uTime * 0.5 + 4.0 * dsN(p * vec2(4.0, 9.0))) + 0.5 * sin(deep * 190.0 / (1.0 + 4.0 * deep) + p.x * 9.0 + uTime * 0.7));
    }
  }
  if (uOwn[5] > 0.0) {
    vec2 g = rot(0.35) * p / 0.0065, at = floor(g);
    float h = hash21(at);
    dsG = 0.02 + 0.78 * length(g - at - 0.5 - 0.5 * (vec2(h, fract(h * 91.7)) - 0.5)) + 0.22 * h;
  }
  float px = 1.0 / uRes.y, wide = clamp(0.5 * uRes.x * px, 0.26, 0.86) * 0.94;
  float fit = mix(0.72, 1.0, smoothstep(0.26, 0.6, wide)), drift = uTravel * 0.05, quiet = 0.5 * (1.0 - smoothstep(0.05, 0.5, uLevel)) * (1.0 - abs(uOwn[7]));
  float open = 1.0 - uCue, hop = 1.0 - uHits, now = (uLoop - 0.5) * 2.0 * wide;
  vec2 sway = vec2(sin(drift), cos(drift * 0.8)) * 0.012, from = vec2(-0.3 * wide, -0.385), to = vec2(0.04 * wide, 0.42);
  vec3 hot = uKind[4];
  if (uVar > 0.5) { from = vec2(0.34 * wide, -0.385); to = vec2(0.08 * wide, 0.42); }
  // each body below is a loop that turns once or not at all, so that nothing out of reach is paid for
  // keys are a row of small dots of smoke
  for (int once = 0; once < 1 && uKeys > 0.004 && abs(p.y + 0.3) < 0.05; once++) {
    float kx = p.x / 0.085, ki = floor(kx);
    vec2 kd = vec2((kx - ki - 0.5) * 0.085, p.y + 0.3 - 0.02 * sin(ki * 2.4 + drift));
    float kr = length(kd) - 0.013 * (0.6 + 0.5 * fract(ki * 0.618));
    vec3 ink = dsPowder(int(mod(ki, 4.0)));
    dsLay(dsLit(ink, dot(kd, dsL) * 70.0), ink, 0.0, uKeys * 0.9 * (1.0 - smoothstep(-0.004, 0.004, kr)) * step(abs(ki + 0.5), 5.0));
  }
  // in front: a hit's small fresh flower at the place now playing, white at its heart, and a cue's one great flower in the middle
  for (int i = 0; i < 2 && uHits + uCue > 0.004; i++) {
    bool hit = i == 0;
    vec2 v = p - (hit ? vec2(now, mix(-0.24, -0.28, uVar) + 0.2 * abs(uOwn[4]) + 0.05 * sin(TAU * uLoop * 2.0)) : vec2(0.02, 0.07));
    if (hit) dsHit = v;
    float R = hit ? (0.13 + 0.05 * hop) * (1.0 + 0.35 * max(abs(uOwn[1]), abs(uOwn[4]))) : 0.15 + 0.28 * open * (2.0 - open), on = hit ? smoothstep(0.0, 0.5, uHits) : smoothstep(0.0, 0.45, uCue) * (1.0 - uVar);
    for (int near = 0; near < 1 && on > 0.004 && dot(v, v) < 1.55 * R * R; near++)
      dsFlower(mix(dsPowder(hit ? 2 : 0), hot, hit ? 0.5 : 0.3), v, R, hit ? 8.0 : 13.0, hit ? 91.0 : 77.0, hit ? 0.03 * hop : 0.1 * open, on, hit ? 1.3 : uCue);
  }
  for (int once = 0; once < 1 && uVar < 0.5; once++) {
    // the shells of the loop, the newest in front
    float newest = floor(uLoop * 9.0 + 8.5);
    for (int i = 0; i < 6; i++) {
      float fj = mod(newest - float(i), 9.0), x = (fj + 0.5) / 9.0, age = fract(uLoop - x), up = mod(fj, 2.0);
      float y = mix(-0.02, 0.23, up) + 0.07 * fract(fj * 0.382), size = fract(fj * 0.618 + 0.35), R = fit * (0.165 - 0.025 * up + 0.05 * size) * (0.9 + 0.3 * uSpace) * (1.0 + 0.4 * age);
      vec2 v = p - vec2((x - 0.5) * 2.0 * wide + 0.1 * age, y + 0.03 * age) - sway;
      float seed = fj * 11.3 + 2.2, there = 1.0, held = age, edge = 1.0;
      v.y -= 0.24 * min(uOwn[3], 0.0);
      if (uOwn[7] != 0.0) {
        float o = max(-uOwn[7], 0.0), many = max(uOwn[7], 0.0);
        there = 1.0 - o * (mod(fj, 3.0) > 0.5 ? 1.0 : smoothstep(0.30, 0.40, age));
        v += o * (vec2((x - 0.5) * 2.0 * wide + 0.1 * age, y + 0.03 * age) - vec2(0.03, 0.05));
        R = mix(R, 0.36, o);
        held = age * (1.0 - 0.7 * many - 0.5 * o);
        many = smoothstep(0.35, 0.75, many); R *= 1.0 - 0.36 * many;
        float a = (atan(v.y, v.x + 1e-5) - fj) / 2.0944 + 0.5, k = floor(a);
        edge = mix(1.0, smoothstep(0.02, 0.13, 0.5 - abs(a - k - 0.5)), sat(8.0 * many));
        v -= many * 1.35 * R * vec2(cos(k * 2.0944 + fj), sin(k * 2.0944 + fj));
        seed += 3.7 * mod(k, 3.0) * step(0.001, many);
        R *= 1.0 - 0.3 * many * fract(seed * 0.618);
      }
      if (there < 0.004) continue;
      for (int near = 0; near < 1 && age < 0.63 && dsT.g > 0.02 && dot(v, v) < 1.55 * R * R; near++) {
        vec4 m = dsSound(x, 0.5 - 1.15 * y, 0.28, dsPowder(int(fj)));
        dsFlower(m.rgb, v, R * (1.0 - exp(-age * 18.0)) + 0.01, 9.0 + mod(fj * 5.0, 6.0), seed, held,
                 there * m.a * smoothstep(0.0, 0.015, age) * (1.0 - smoothstep(0.42, 0.63, age)) * 0.97, 0.5 * exp(-age * 14.0));
      }
      if (uOwn[3] != 0.0 && age < 0.63 && dsT.g > 0.02 && abs(v.x) < 0.3) {
        vec4 m = dsSound(x, 0.5 - 1.15 * y, 0.28, dsPowder(int(fj)));
        dsStem(m.rgb, v, R, seed, edge * there * m.a * smoothstep(0.0, 0.015, age) * (1.0 - smoothstep(0.42, 0.63, age)) * 0.97);
      }
    }
    // and two old stains in a quiet sky
    for (int i = 0; i < 2 && quiet > 0.01; i++) {
      vec2 v = p - (i == 0 ? vec2(-0.52 * wide, 0.19) + sway : vec2(0.47 * wide, 0.04) + sway.yx);
      float R = i == 0 ? 0.25 : 0.2;
      for (int near = 0; near < 1 && dot(v, v) < 1.55 * R * R; near++) dsFlower(dsPowder(1 - i), v, R, i == 0 ? 10.0 : 12.0, i == 0 ? 41.0 : 47.0, i == 0 ? 0.33 : 0.4, quiet, 0.0);
    }
  }
  for (int once = 0; once < 1 && uVar > 0.5; once++) {
    float newest = floor(uLoop * 5.0 + 4.5);
    // i 0 is the cue's, then those of the loop, then the stains
    for (int i = uCue > 0.004 ? 0 : 1; i < (quiet > 0.01 ? 7 : 4); i++) {
      float fj = mod(newest - float(i) + 1.0, 5.0), x = (fj + 0.5) / 5.0, age = fract(uLoop - x), up = mod(fj, 2.0), R = fit * (0.29 - 0.08 * up + 0.05 * fract(fj * 0.618)) * (0.9 + 0.3 * uSpace);
      vec2 c = vec2((x - 0.5) * 2.0 * wide, mix(0.2, 0.31, up)) + sway;
      if (i == 0) { c = vec2(0.02, 0.2); R = 0.26 + 0.14 * open * (2.0 - open); age = 0.14 + 0.2 * open; }
      if (i == 5) { c = vec2(-0.45 * wide, 0.24) + sway; R = 0.24; age = 0.36; }
      if (i == 6) { c = vec2(0.58 * wide, 0.3) + sway.yx; R = 0.17; age = 0.4; }
      float there = 1.0, held = age;
      if (uOwn[7] != 0.0 && i > 0) {
        float o = max(-uOwn[7], 0.0), many = max(uOwn[7], 0.0);
        there = 1.0 - o * smoothstep(0.17, 0.26, age);
        c = mix(c, vec2(0.02, 0.22), o); R = mix(R, 0.4, o);
        held = age * (1.0 - 0.6 * many - 0.3 * o); R *= 1.0 - 0.35 * smoothstep(0.35, 0.75, many);
      }
      vec2 v = p - c, v0 = v;
      if (uOwn[7] > 0.35 && i > 0) {    // two at each place, one lower
        float k = v.x > 0.0 ? 1.0 : -1.0;
        v -= smoothstep(0.35, 0.75, uOwn[7]) * vec2(0.92 * R * k, -0.10 * k);
      }
      if (uOwn[3] < 0.0) v = rot(PI * uOwn[3]) * (v + vec2(0.0, -0.5 * uOwn[3] * (c.y + 0.16) * 2.0));
      for (int near = 0; near < 1 && age < 0.6 && dsT.g > 0.02 && v.y < 0.56 * R && v.y > -0.1 - max(2.0 * uOwn[3], 0.0) - 3.0 * R * min(1.0, age * 9.0) && abs(v.x + 0.3 * min(v.y, 0.0)) < 1.12 * R - 0.3 * min(v.y, 0.0); near++) {
        vec3 ink = dsPowder(int(fj)), ink2 = dsPowder(int(fj) + 2);
        float on = quiet * 1.4, seed = fj * 7.7 + 1.4;
        if (i == 0) { on = smoothstep(0.0, 0.45, uCue); ink = mix(dsPowder(0), hot, 0.3); ink2 = dsPowder(2); seed = 3.3; }
        else if (i > 4) { ink = dsPowder(6 - i); ink2 = dsPowder(8 - i); seed = float(i) * 3.3; }
        else {
          vec4 m = dsSound(x, 0.45, 0.35, ink);
          ink = m.rgb; ink2 = mix(m.rgb, ink2, 0.75); on = there * m.a * smoothstep(0.0, 0.015, age) * (1.0 - smoothstep(0.34, 0.6, age));
          R = R * (1.0 - exp(-age * 16.0)) + 0.01;
        }
        dsWeep(ink, ink2, v, R, seed, i > 0 ? held : age, on);
        if (uOwn[3] > 0.0) dsStem(ink, v, R, seed, on);
      }
    }
  }
  calm = 1.0 - sat(2.0 * max(max(abs(uOwn[3]), abs(uOwn[4])), max(-uOwn[7], max(uOwn[5], -uOwn[5]))));
  if (calm > 0.0) dsThread(p, from, to, 1.0 + uVar, (0.8 + 0.2 * uPhrase) * calm, 0.0045 + 0.004 * uPhrase + 0.005 * uMic);
  // the sky: plain pale paper, a breath of blue laid in from the top edge, warmer low down with the pads
  vec3 sky = mix(vec3(0.935, 0.918, 0.872), vec3(0.95, 0.885, 0.78), uPad * 0.7 * (1.0 - smoothstep(-0.5, 0.5, p.y)));
  sky = mix(sky, vec3(0.76, 0.83, 0.86), 0.8 * smoothstep(0.1, 0.62, p.y + 0.02 * sin(p.x * 5.0)));
  sky += (dsN(p * vec2(60.0, 260.0)) - 0.5) * 0.014;
  float ends = smoothstep(wide, 0.86 * wide, abs(p.x));
  if (uOwn[2] != 0.0) sky = dsSky(sky, p, wide);
  vec3 col = dsC + dsT * sky;
  if (deep > 0.0) {                    // the water takes a little of the sounds' colours
    vec4 m = piece(vec2(p.x / (2.0 * wide) + 0.5, sat(deep * 2.5))) * ends;
    col = mix(col * vec3(0.88, 0.91, 0.93), m.rgb * 0.6 + uKind[0] * 0.3 * (1.0 - m.a), 0.10 + 0.35 * m.a * smoothstep(0.0, 0.1, deep));
    col *= 1.0 - 0.16 * exp(-deep * 60.0);
  }
  if (uOwn[4] > 0.0) {                 // hills in front, the nearest darkest
    for (int i = 0; i < 4; i++) {
      float fi = float(i), top = mix(-0.62, -0.17 - 0.095 * fi, uOwn[4]) + (0.10 - 0.012 * fi) * (dsN(vec2(p.x * (1.5 + 0.5 * fi) + fi * 7.3, fi)) - 0.5) * 2.0 + 0.012 * (dsN(vec2(p.x * 16.0, fi * 3.0)) - 0.5), in_ = top - p.y;
      vec3 k = mix(sky, uKind[0] * (0.30 + 0.25 * uKind[0]), 0.28 + 0.24 * fi) * (1.0 + 0.10 * uDrone);
      vec4 m = piece(vec2(p.x / (2.0 * wide) + 0.5, 0.35 + 0.2 * fi)) * ends;
      k = mix(k, mix(sky, k, 0.55), smoothstep(0.02, 0.22, in_)) + m.rgb * 0.16 * exp(-in_ * 14.0);
      col = mix(col, k + 0.02 * (dsN(p * vec2(160.0, 240.0)) - 0.5), smoothstep(-px, px, in_));
    }
  }
  // round a hit the air of these other skies is lit
  if (uHits > 0.004) col = mix(col, mix(hot, vec3(1.0, 0.97, 0.90), 0.45), uHits * 0.5 * exp(-dot(dsHit, dsHit) * 26.0) * max(max(abs(uOwn[2]), abs(uOwn[4])), max(abs(uOwn[3]), abs(uOwn[5]))));
  // the tip of one pole
  vec2 q = p - from;
  float w = 0.0065 - 0.006 * q.y, bar = 1.0 - smoothstep(-px, px, max(abs(q.x - 0.02 * q.y) - w, q.y));
  bar *= calm;
  return mix(col, vec3(0.13, 0.125, 0.14) + 0.14 * (1.0 - smoothstep(-0.008, 0.004, q.x)), bar);
}
