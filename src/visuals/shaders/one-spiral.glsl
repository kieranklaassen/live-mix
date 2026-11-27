// name: One spiral
// a: Engraved
// b: Loose hand
// what: One black line winds out from a point on white paper, and only by growing thicker and thinner it makes an egg on a cloth, a rolling wave, a knot, each turning into the next over minutes with its own shadow; or the same line by a loose hand in brown ink, wandering, running dry and dipped again, the form half there.
// follows: Loudness takes the line from nearly even to full relief. The drone lifts the wave, pads soften the light, texture roughens the line's edge, a phrase sends a ripple outward. A hit is a coloured blot running out from the middle, a cue slides the line round a whole turn. The spectrum weights its rings, the loop swings the light, keys drop beads.
// own: 0 1 twice as many fine turns, -1 a few broad ones; 1 1 the turns are square with corners, -1 they run in six petals; 2 1 a bed of many pebbles lies there instead of egg and knot, -1 one open flower, at half either way nothing; 3 1 steep ridges of hills for a ground, -1 a bare flat table; 4 1 a black page and a pale line, at half grey paper with black line and white, -1 paper in the colour of the drone with both lines; 5 1 inks in the colours of the sounds, -1 washes of those colours laid under the line; 6 1 the line is a twisted cord with its own light, -1 it is broken into dots; 7 1 the sheet lies as a land going away to a horizon, -1 a whirl whose turns open outward round a deep eye
float osEgg, osKnot, osWave, osSc, osSoft;   // how far each form has risen, its size on this page, how soft the light is
vec2 osEggC, osKnotC;                        // where the egg and the knot lie
mat2 osEggT, osKnotT;
float osFar;                                  // 1 near by, 0 at the horizon of a laid sheet
vec2 osHeart;                                 // where the line begins
float osPale;                                 // 1 where the egg or the knot shows, 0 where the cloth does
float osMax(float a, float b, float k) { return -smin(-a, -b, k); }

// The relief: a cloth, the swell that runs under it, and what lies on it or is sunk beneath it.
float osHigh(vec2 p) {
  vec2 q = p / osSc;
  osPale = 0.0;
  float f = q.x * 5.2 - q.y * 7.6 + 1.3 * sin(q.y * 3.1 + q.x * 1.4 + 0.6);
  float g = q.x * 9.0 + q.y * 4.2 + 1.1 * sin(q.x * 3.7 - 1.0);
  float fold = 0.5 + 0.5 * sin(f), fold2 = 0.5 + 0.5 * sin(g);
  float h = 0.030 * fold * fold * (0.55 + 0.45 * sin(q.x * 2.2 + 1.9)) + 0.012 * fold2 * fold2;
  float w = q.x * 5.0 - q.y * 8.5 + 0.9 * sin(q.x * 3.4 + q.y * 1.5 + 0.4) + 0.5 * sin(q.x * 6.5 - q.y * 2.0 + 2.0) - TAU * fract(uTravel * 0.011);
  float crest = 0.5 + 0.5 * sin(w + 0.85 * cos(w));                    // steep on the side it rolls towards
  h = mix(h, 0.4 * h + 0.17 * crest * crest * (0.75 + 0.25 * sin(q.x * 4.0 + q.y * 3.0)), osWave);
  if (uOwn[3] != 0.0) h *= 1.0 - 0.9 * abs(uOwn[3]);
  if (uOwn[2] > 0.0) h *= 1.0 - 0.75 * uOwn[2] * (1.0 - max(uOwn[3], 0.0));
  if (uOwn[3] > 0.0) {
    vec2 m = rot(0.5) * q * 3.1 + 0.35 * sin(q.yx * 5.3 + vec2(0.4, 2.1));
    float ra = 1.0 - abs(sin(m.x + 0.8 * sin(m.y * 0.9 + 1.0))), rb = 1.0 - abs(sin(m.y * 1.7 + m.x * 0.9 + 0.7 * sin(m.x * 2.3)));
    float rc = 1.0 - abs(sin(m.x * 4.1 - m.y * 2.9 + 1.2 * sin(m.y * 3.0)));
    h += uOwn[3] * (0.24 * ra * ra * (0.5 + 0.5 * rb) + 0.09 * rb * rb + 0.022 * rc * ra);
  }
  if (uOwn[2] > 0.0) {                          // pebbles: the nearest of two lattices laid into each other
    vec2 m = q * vec2(5.2, 6.0) + 0.23 * sin(q.yx * vec2(7.3, 9.1) + vec2(0.6, 2.4)) + 0.2 * sin(q.yx * vec2(17.0, 13.0));
    float ph = -0.2;
    for (int k = 0; k < 2; k++) {
      vec2 o = m + 0.5 * float(k), id = floor(o), f = o - id - 0.5;
      float h1 = hash21(id + 37.0 * float(k) + 3.0), h2 = fract(h1 * 41.7), rr = 0.30 + 0.17 * h1;
      f = rot(h2 * 6.0) * f * vec2(1.0, 1.18 + 0.3 * h2) + 0.06 * (h1 - 0.5);
      float d2 = dot(f, f) / (rr * rr);
      ph = max(ph, (d2 < 1.0 ? 0.62 * rr * sqrt(1.0 - d2) : -0.5 * (sqrt(d2) - 1.0)) * 0.26 + 0.02 * h2);
    }
    ph += 0.022 + 0.6 * max(uOwn[3], 0.0) * h - 0.3 * (1.0 - smoothstep(0.5, 1.0, uOwn[2]));
    osPale = max(osPale, smoothstep(-0.006, 0.008, ph - h));
    h = osMax(h, ph, 0.006);
  }
  if (uOwn[2] < 0.0) {                          // a flower: rows of petals, each row above the one outside it
    vec2 e = q - vec2(-0.1, 0.01);
    float l = length(e), a = atan(e.y, e.x + 1e-6), fh = -0.3;
    for (int k = 0; k < 3; k++) {
      float f = float(k), n = 7.0 - f, t = a + 0.5 * f + 0.1, c = abs(sin(0.5 * n * t));
      float tip = (0.52 - 0.16 * f) * (0.42 + 0.58 * sqrt(c + 0.01)), x = l / tip;
      float ht = 0.045 * f + 0.02 + 0.13 * x * x * c + 0.05 * c * (1.0 - x);      // cupped up toward the tip, a keel along it
      fh = max(fh, x < 1.0 ? ht : ht - (x - 1.0) * 1.6);
    }
    float d2 = l * l / 0.0052;
    if (d2 < 1.0) fh = max(fh, 0.16 + 0.11 * sqrt(1.0 - d2));
    fh -= 0.5 * (1.0 - smoothstep(0.5, 1.0, -uOwn[2]));
    osPale = max(osPale, smoothstep(-0.006, 0.008, fh - h));
    h = osMax(h, fh, 0.008);
  }
  if (osEgg > 0.001) {
    vec2 e = osEggT * (q - osEggC);
    e.y *= 1.0 + 0.48 * e.x;
    float r2 = e.x * e.x * 8.2 + e.y * e.y * 14.0;
    float eh = (r2 < 1.0 ? 0.225 * sqrt(1.0 - r2) : -0.6 * (sqrt(r2) - 1.0)) + 0.035 - 0.26 * (1.0 - osEgg);
    osPale = smoothstep(-0.01, 0.012, eh - h);
    h = osMax(h, eh, 0.016);
  }
  if (osKnot > 0.001) {
    vec2 e = osKnotT * (q - osKnotC);
    float l = length(e), a = atan(e.y, e.x + 1e-6) * 1.5;
    float kh = -1.0;
    for (int k = 0; k < 2; k++) {
      float b = a + PI * float(k);              // half a turn of the strand's own angle: the other of the two strands
      float rr = 0.232 + 0.098 * cos(b), sl = 0.147 * sin(b) / (rr + 0.001);
      float d = abs(l - rr) / sqrt(1.0 + sl * sl), w2 = 0.058;
      float t = d < w2 ? sqrt(w2 * w2 - d * d) : -(d - w2) * 3.0;
      kh = max(kh, t + 0.055 * sin(b) + 0.05);
    }
    kh += 0.03 - 0.20 * (1.0 - osKnot);
    osPale = max(osPale, smoothstep(-0.008, 0.008, kh - h));
    h = osMax(h, kh, 0.008);
  }
  if (uOwn[7] < 0.0) h += uOwn[7] * 0.34 * exp(-dot(p - osHeart, p - osHeart) * 22.0);
  return h * osSc;
}

// How much light comes back from the relief here, 0 to 1.
float osLit(vec2 p) {
  float az = 2.36 + 0.42 * sin(TAU * uLoop), el = mix(0.72, 0.46, uSpace);
  vec3 l = vec3(cos(az) * cos(el), sin(az) * cos(el), sin(el));
  float e = 0.0045, h = osHigh(p), pale = osPale;
  vec3 n = normalize(vec3(h - osHigh(p + vec2(e, 0.0)), h - osHigh(p + vec2(0.0, e)), e));
  float lam = dot(n, l), sh = 1.0, slope = tan(el);
  vec2 dir = vec2(cos(az), sin(az));
  float pen = mix(0.10, 0.34, osSoft);
  for (int i = 1; i < 10; i++) {
    float t = 0.40 * float(i * i) / 81.0 + 0.012;
    float over = osHigh(p + dir * t) - h - t * slope;
    sh = min(sh, 0.5 - over / (pen * t + 0.004));
  }
  sh = smoothstep(0.0, 1.0, sat(sh));
  float front = mix(max(lam, 0.0), sat(lam * 0.6 + 0.4) * 0.9, 0.55 * osSoft);
  float back = sat(0.5 - 0.6 * dot(n.xy, dir)) * mix(0.06 + 0.09 * n.z, 0.44 - 0.28 * n.z, pale);   // light thrown up again from the cloth
  return (front * mix(sh, 1.0, 0.10 + 0.14 * osSoft) + back) * mix(mix(0.66, 1.0, smoothstep(-0.45, 0.45, dot(p, vec2(0.7, -0.75)))), 1.03, pale);
}

void osPlace(float b) {
  float c = cos(TAU * fract(uTime / 256.0 + 0.5 * b));
  osEgg = smoothstep(-0.12, 0.45, c);
  osKnot = 1.0 - smoothstep(-0.45, 0.12, c);
  osWave = sat(0.85 * (1.0 - smoothstep(0.0, 0.55, abs(c))) + 0.75 * uDrone);
  osEgg *= 1.0 - 0.18 * osWave;
  if (uOwn[2] != 0.0) { float o = 1.0 - smoothstep(0.0, 0.5, abs(uOwn[2])); osEgg *= o; osKnot *= o; }
  osSoft = sat(uPad);
  osSc = clamp(uRes.x / uRes.y * 0.72, 0.42, 1.0) * mix(1.0, 1.08, b);
  osEggC = vec2(-0.12, -0.01); osKnotC = vec2(-0.03, 0.0);
  osEggT = rot(1.22 + 0.12 * sin(uTime * 0.021));
  osKnotT = rot(0.4 + 0.25 * sin(uTime * 0.013));
}
// What thickens the line besides the form: the blot of a hit on its way out, and beads dropped by the keys.
float osBlot(vec2 c) {
  float go = 1.0 - uHits, a = 2.2 + 3.4 * go;
  vec2 d = c - vec2(cos(a), sin(a)) * go * 0.62;
  float b = sat(uHits * 1.6) * exp(-dot(d, d) / (0.0105 - 0.004 * go));
  if (uOwn[7] > 0.0) { float f = (length(c) - 0.1 - 0.5 * go) * 9.0; b = max(b, 0.75 * uOwn[7] * sat(uHits * 1.6) * exp(-f * f)); }   // on a land it is a ring
  return b;
}
float osBeads(vec2 c) {
  float s = 0.0;
  for (int i = 0; i < 7; i++) {
    float f = float(i), a = f * 2.39996 + 0.7;
    vec2 d = c - vec2(cos(a), sin(a)) * 0.145 * sqrt(f + 0.6);
    s += exp(-dot(d, d) * 1700.0);
  }
  return s * uKeys;
}
// How much of one pixel a line of half width w, at distance x, covers: all in pixels.
float osCover(float x, float w) { return max(0.0, min(x + 0.62, w) - max(x - 0.62, -w)) / 1.24; }

// A phrase's ripple, going out from the middle: how far it bends the line, and how that changes outward.
vec2 osBend(float r, float ang) {
  float go = 0.5 + 0.5 * cos(TAU * (r * 1.1 - fract(uTime * 0.13)));
  float a = 0.0062 * uPhrase * go * go * go * smoothstep(0.03, 0.2, r), w = 46.0 * r + 3.0 * ang - TAU * fract(uTime * 0.27);
  return a * vec2(sin(w), 46.0 * cos(w));
}
// What else thickens the line: a voice near the heart, and the swell of a cue as it passes outward.
float osSwell(float r) {
  float d = (r - 0.9 * (1.0 - uCue)) * 4.5;
  return 0.30 * uMic * exp(-r * r * 14.0) + 0.34 * uCue * exp(-d * d);
}
float osTurn() { return uTravel * 0.004 + uCue * uCue * (3.0 - 2.0 * uCue); }

// The shape of a turn: round, square or petalled.
float osRound(vec2 c, float r, float ang) {
  if (uOwn[1] > 0.0) return mix(r, mix(0.94, 1.0, uOwn[1]) * max(abs(c.x), abs(c.y)) * 1.05, uOwn[1]);
  if (uOwn[1] < 0.0) return r * (1.0 - 0.21 * uOwn[1] * cos(6.0 * ang) * smoothstep(0.0, 0.16, r));
  return r;
}
// With the eye of a whirl the turns lie close at the heart and open outward.
float osOpen(float r) {
  if (uOwn[7] < 0.0) return mix(r, 0.6 * log(1.0 + 9.0 * r) / 1.856, -uOwn[7]);
  return r;
}
bool osOther() { return uOwn[4] != 0.0 || uOwn[5] != 0.0; }
// The colours of page, dark line and pale line here.
void osInks(vec2 p, float turn, float lit, inout vec3 sheet, inout vec3 dark, out vec3 pale) {
  vec4 m = piece(vec2(0.5 + p.x * 0.56, 0.5 - p.y));
  float grain = sheet.r;
  vec3 own = osPale > 0.0 ? mix(uKind[2], uKind[1], osPale) : uKind[2];
  own = mix(own, m.rgb / max(m.a, 0.02), sat(m.a) * (uOwn[5] < 0.0 ? 0.38 : 0.55));
  if (uOwn[6] > 0.0) own = mix(own, mix(mix(uKind[0], uKind[1], 0.5 + 0.5 * sin(turn * 1.9)), mix(uKind[2], uKind[3], 0.5 + 0.5 * sin(turn * 1.1)), 0.5 + 0.5 * sin(turn * 0.77 + 1.0)), 0.7 * uOwn[6]);
  pale = vec3(0.95, 0.93, 0.89);
  if (uOwn[5] < 0.0) {
    float pool = 0.86 + 0.28 * fbm(p * 7.0 + 3.0);
    vec3 w = mix(uKind[0] * 0.8, own * 1.18 + 0.09, smoothstep(0.08, 0.7, lit)) * pool;
    w = mix(w, sheet, 0.5 * smoothstep(0.8, 1.15, lit));
    sheet = mix(sheet, w, -uOwn[5] * 0.92);
  }
  if (uOwn[5] > 0.0) {
    dark = mix(dark, mix(mix(uKind[0] * 0.62, own * 0.6, max(uOwn[6], 0.0)), own * mix(0.85, 1.0, max(uOwn[6], 0.0)), smoothstep(0.1, 0.8, lit)), uOwn[5] * 0.95);
    pale = mix(pale, mix(own, uKind[3], smoothstep(0.55, 1.05, lit)) * 1.08 + 0.02, uOwn[5]);
  }
  if (uOwn[4] > 0.0) sheet = mix(sheet, mix(sheet * vec3(0.46, 0.45, 0.44), vec3(0.028, 0.028, 0.034) + 0.06 * (uOwn[5] < 0.0 ? sheet * 2.4 : vec3(0.0)), smoothstep(0.4, 1.0, uOwn[4])), smoothstep(0.0, 0.5, uOwn[4]));
  if (uOwn[4] > 0.5) dark *= 1.0 - 0.9 * smoothstep(0.5, 1.0, uOwn[4]) * (1.0 - 0.6 * max(uOwn[5], 0.0));
  if (uOwn[4] < 0.0) sheet = mix(sheet, (uOwn[5] < 0.0 ? mix(uKind[0], sheet, -0.6 * uOwn[5]) : uKind[0]) * mix(0.95, 1.0, grain), -uOwn[4]);
}
// How much of the pale line there is, by the light.
float osPaleCov(float lit, float depth) { return sat(mix(0.16, 0.02 + 0.80 * smoothstep(0.30, 1.1, lit), depth)) * min(1.0, abs(uOwn[4]) * 2.0); }
// A line as a row of dots: x across and y along in pixels, w the half width it had, full the room there is.
float osDots(float x, float y, float room, float w, float px) {
  float t = -uOwn[6], rad = mix(w, sqrt(max(w, 0.0) * px * 0.64), t);
  y = max(abs(y) - 0.5 * room * (1.0 - t), 0.0);
  float d = length(vec2(x, y * min(1.0, 4.0 * t) * px / max(room, 1.0)));
  return sat(rad - d + 0.5);
}
// A cord: x across from -1 to 1, s how far along it, out the way it faces.
vec3 osCord(float x, float s, vec2 out_, vec3 col, float seen) {
  float up = sqrt(max(0.0, 1.0 - x * x)), az = 2.36 + 0.42 * sin(TAU * uLoop);
  float tw = fract(s + 0.32 * x), ply = sin(PI * tw);
  float l = 0.30 + 0.62 * up + 0.42 * x * dot(out_, vec2(cos(az), sin(az)));
  l *= mix(0.82, 0.66 + 0.46 * ply, seen);
  return col * max(l, 0.0) * (1.0 - smoothstep(0.72, 1.0, abs(x))) + col * 0.04;
}

vec3 osEngraved(vec2 p) {
  osPlace(0.0);
  vec2 heart = vec2(-0.185, 0.075) * osSc, c = p - heart;
  osHeart = heart;
  float pitch = max(1.0 / 106.0, 5.13 / uRes.y), r = length(c), ang = atan(c.y, c.x + 1e-6);
  if (uOwn[0] != 0.0) pitch = uOwn[0] < 0.0 ? pitch * exp2(-2.5 * uOwn[0]) : max(pitch * exp2(-uOwn[0]), 3.4 / uRes.y);
  if (uOwn[7] < 0.0) pitch *= 1.0 - 0.35 * uOwn[7];
  // a phrase bends the line, and the bend goes out from the middle
  vec2 bend = osBend(r, ang);
  float u = r / pitch - ang / TAU + osTurn() + bend.x / pitch, steep = 1.0 + bend.y, ro = r;
  if (uOwn[1] != 0.0 || uOwn[7] < 0.0) { ro = osOpen(osRound(c, r, ang)); u = ro / pitch - ang / TAU + osTurn() + bend.x / pitch; }
  u = fract(u + 0.5) - 0.5;
  float depth = 0.33 + 0.67 * smoothstep(0.0, 0.5, uLevel * (1.0 + 0.4 * uEnergy));
  depth = mix(depth, 1.0, 0.6 * uCue);
  float lit = osLit(p);
  float dark = mix(0.90, 0.08, smoothstep(0.02, 1.08, pow(lit, mix(1.3, 0.95, uTone))));
  float ring = band(r / (0.95 * osSc + 0.1));
  float cov = mix(0.24, dark, depth) + 0.10 * ring * (0.4 + uEnergy);
  if (uOwn[4] != 0.0) cov = mix(cov, 0.05 + cov * smoothstep(0.45, 0.85, dark), abs(uOwn[4]));
  if (uOwn[5] < 0.0) cov *= 1.0 + 0.3 * uOwn[5];
  float blot = osBlot(c), bead = osBeads(c);
  cov += 0.6 * blot + 0.6 * bead + osSwell(r);
  cov += uTexture * 0.22 * (noise(p * uRes.y * 0.22) - 0.5) * smoothstep(0.02, 0.3, cov);
  cov = clamp(cov, 0.05, 0.93);
  float px = pitch * uRes.y / max(steep, 0.3), x = abs(u) * px, w = 0.5 * cov * px;
  float s = ro / pitch + bend.x / pitch - u, room = r * uRes.y / max(s, 0.3), way = PI * s * s, seen = 1.0;
  vec2 gr = vec2(dFdx(ro + bend.x), dFdy(ro + bend.x));
  if (uOwn[1] != 0.0 || uOwn[7] != 0.0) {
    float per = length(gr) / pitch;
    px = min(1.0 / max(per, 1e-4), 2.0 * pitch * uRes.y); x = abs(u) * px; w = 0.5 * cov * px;
    seen = smoothstep(1.3, 3.2, px);
    if (uOwn[7] > 0.0 && uOwn[4] > 0.0) osFar *= mix(1.0, smoothstep(0.12, 0.6, px), uOwn[4]);
  }
  float ink = osCover(x, w) + osCover(px - x, w);
  if (uOwn[6] < 0.0) ink = osDots(x, (fract(way) - 0.5) * room, room, w, px);
  ink = mix(cov, ink, seen) * osFar;
  ink *= smoothstep(0.1, 0.6, r / pitch);
  vec3 sheet = vec3(0.958, 0.950, 0.930) * (1.0 + 0.035 * (noise(p * 2.0) - 0.5) + 0.02 * (noise(p * 260.0) - 0.5));
  vec3 black = mix(vec3(0.055, 0.052, 0.060), uKind[4] * vec3(0.62, 0.30, 0.30), sat(blot * 1.8 - 0.25));
  if (!osOther() && uOwn[6] <= 0.0 && uOwn[7] <= 0.0) return mix(sheet, black, sat(ink));
  vec3 pale; osInks(p, s, lit, sheet, black, pale);
  vec3 col = mix(sheet, black, sat(ink));
  float pc = 0.0;
  if (uOwn[4] != 0.0) {
    pc = max(osPaleCov(lit, depth) * (1.0 - 0.75 * max(-uOwn[4], 0.0) * (1.0 - smoothstep(0.35, 0.9, lit))), min(0.9, 0.6 * blot + 0.6 * bead + osSwell(r)));
    float x2 = (0.5 - abs(u)) * px, pi_ = osCover(x2, 0.5 * pc * px) + osCover(px - x2, 0.5 * pc * px);
    if (uOwn[6] < 0.0) pi_ = osDots(x2, (fract(way) - 0.5) * room, room, 0.5 * pc * px, px);
    pale = mix(pale, uKind[4], sat(blot * 1.8 - 0.25));
    col = mix(col, pale, osFar * sat(mix(pc, pi_, seen)) * smoothstep(0.1, 0.6, r / pitch));
  }
  if (uOwn[6] > 0.0) {
    vec3 base = mix(uOwn[5] > 0.0 ? mix(sheet, black, 0.96 * uOwn[5]) : sheet, mix(black, sheet, 0.12), 0.8 * cov * (1.0 - 0.5 * max(uOwn[5], 0.0)));
    if (uOwn[4] > 0.0) base = mix(base, mix(black, pale, 0.12 + 0.88 * pc), uOwn[4]);
    base = mix(base, uKind[4], sat(blot * 1.5 + 0.9 * bead));
    col = mix(col, osCord(u * 2.0, way * 0.8, gr / max(length(gr), 1e-6), base * 1.1, seen), uOwn[6] * osFar);
  }
  return col;
}

// The same line by hand: every turn wanders for itself, leans on its neighbours, runs dry and is dipped.
vec3 osHand(vec2 p) {
  osPlace(1.0);
  float shape = uRes.x / uRes.y, wide = clamp(shape * 0.86, 0.5, 1.42);
  vec2 c = p - vec2(-0.04, 0.0), q = rot(0.16) * c / vec2(wide, min(wide, 1.0));
  float pitch = max(1.0 / 116.0, 2.9 / uRes.y), r = length(q), ang = atan(q.y, q.x + 1e-6), th = fract(ang / TAU - osTurn()), re = r;
  osHeart = vec2(-0.04, 0.0);
  if (uOwn[0] != 0.0) pitch = uOwn[0] < 0.0 ? pitch * exp2(-2.5 * uOwn[0]) : max(pitch * exp2(-uOwn[0]), 2.4 / uRes.y);
  if (uOwn[7] < 0.0) pitch *= 1.0 - 0.35 * uOwn[7];
  if (uOwn[1] != 0.0 || uOwn[7] < 0.0) r = osOpen(osRound(q, r, ang));
  float lean = 0.055 * (noise(q * 3.6 + vec2(0.0, 0.02 * uTime)) - 0.5) + 0.018 * (noise(q * 9.0 + 5.0) - 0.5);
  float u0 = (r + lean * smoothstep(0.04, 0.34, r) + osBend(r, ang).x), loose = max(0.0, u0 - 0.41) / 0.10, slope = 1.0 / (1.0 + loose);
  u0 = (min(u0, 0.41) + 0.10 * log(1.0 + loose)) / pitch;   // past the form the turns open out
  float u = u0 - th;
  float perPx = length(vec2(dFdx(u0), dFdy(u0))) + 1e-4, px = min(1.0 / perPx, 8.0 * pitch * uRes.y);
  float lit = osLit(p), dark = 1.0 - smoothstep(0.02, 1.16, lit);
  float part = smoothstep(-0.12, 0.16, 0.30 - 0.34 * c.x + 0.34 * c.y + 0.14 * (noise(p * 3.0 + 9.0) - 0.5) + 0.12 * uLevel) * (1.0 - smoothstep(0.42, 0.56, r));
  float depth = (0.45 + 0.55 * smoothstep(0.0, 0.5, uLevel * (1.0 + 0.4 * uEnergy))) * part;
  depth = mix(depth, 1.0, 0.6 * uCue);
  float cov = mix(0.20, 0.06 + 1.0 * dark * sqrt(dark), depth) + 0.12 * band(r / 0.5) * (0.4 + uEnergy);
  if (uOwn[4] != 0.0) cov = mix(cov, 0.05 + cov * smoothstep(0.4, 0.8, dark), abs(uOwn[4]));
  if (uOwn[5] < 0.0) cov *= 1.0 + 0.3 * uOwn[5];
  float blot = osBlot(c), bead = osBeads(c);
  cov = cov * mix(1.15, 0.88, uTone) + 0.7 * blot + 0.6 * bead + osSwell(r);
  float near = floor(u + 0.5), clear = 1.0, wet = 0.0, last = 0.53 / pitch;
  float pc = 0.0, pin = 0.0, seen = uOwn[7] > 0.0 ? smoothstep(1.0, 2.6, px) : 1.0;
  if (uOwn[4] != 0.0) pc = max(osPaleCov(lit, sat(depth * 1.3)), min(0.9, 0.6 * blot + 0.6 * bead + osSwell(r)));
  vec2 gr = vec2(dFdx(u0), dFdy(u0)); vec3 rope = vec3(-1.0);
  for (int j = -1; j < 2; j++) {
    float k = near + float(j);
    if (k < 0.0) continue;
    float s = k + th;
    if (s > last + 1.0) continue;
    float wob = 0.5 * (noise(vec2(s * 4.7, 3.5)) - 0.5) + 0.22 * (noise(vec2(s * 19.0, 8.5)) - 0.5);
    float len = PI * pitch * s * s;                        // how far the pen has come
    float full = 1.0 - fract(len / 3.7 + 0.4 * noise(vec2(len * 0.3, 1.5)));
    full *= smoothstep(0.0, 0.012, 1.0 - full);             // the new stroke begins with a rounded end
    float w = cov * (0.76 + 0.36 * full * full) * (0.9 + 0.35 * (noise(vec2(len * 9.0, 5.5)) - 0.5));
    w += uTexture * 0.3 * (noise(p * uRes.y * 0.2) - 0.5) * cov;
    w *= (1.0 - smoothstep(last - 0.5, last, s));
    float ink = osCover(abs(u - k - wob) * px, 0.5 * clamp(w, 0.0, 1.0) * mix(slope, 1.0, 0.25) * px);
    float room = re * uRes.y / max(s, 0.3), way = PI * s * s;
    if (uOwn[6] < 0.0) ink = osDots((u - k - wob) * px, (fract(way) - 0.5) * room, room, 0.5 * clamp(w, 0.0, 1.0) * mix(slope, 1.0, 0.25) * px, px);
    if (uOwn[4] != 0.0) {
      float pw = 0.5 * sat(pc * (0.8 + 0.3 * full)) * mix(slope, 1.0, 0.25) * px * (1.0 - smoothstep(last - 0.5, last, s)), px2 = (u - k - wob - 0.5) * px;
      float a = osCover(abs(px2), pw);
      if (uOwn[6] < 0.0) a = osDots(px2, (fract(way) - 0.5) * room, room, pw, px);
      pin = max(pin, a);
    }
    if (uOwn[6] > 0.0 && (rope.z < 0.0 || abs(u - k - wob * 0.6) < 0.5 * abs(rope.x))) {
      float edge = 1.0 - smoothstep(last - 0.4, last, s), xx = (u - k - wob * 0.6) / 0.5;
      rope = vec3(xx, way * 0.8, edge);
    }
    float bite = noise(vec2(len * 34.0, (u - k - wob) * min(0.3 * px, 9.0))) + 0.35 * noise(p * 170.0);
    float dry = mix(1.0, smoothstep(0.35, 0.85, bite + full * 1.6), 1.0 - smoothstep(0.1, 0.45, full));
    float here = ink * dry * mix(0.80, 0.97, full);
    clear *= 1.0 - here;
    wet = max(wet, here * full);
  }
  vec3 sheet = vec3(0.950, 0.922, 0.868) * (1.0 + 0.05 * (noise(p * 1.7 + 3.0) - 0.5) + 0.035 * (noise(p * vec2(90.0, 300.0)) - 0.5));
  vec3 brown = mix(vec3(0.46, 0.27, 0.13), vec3(0.13, 0.065, 0.035), wet);
  brown = mix(brown, uKind[4] * vec3(0.62, 0.28, 0.26), sat(blot * 1.8 - 0.25));
  clear = mix(1.0, mix(1.0 - sat(cov) * (1.0 - smoothstep(last - 0.5, last, u0)), clear, seen), osFar);
  if (!osOther() && uOwn[6] <= 0.0) return mix(sheet, brown, 1.0 - clear);
  vec3 pale; osInks(p, u0, lit, sheet, brown, pale);
  vec3 col = mix(sheet, brown, 1.0 - clear);
  if (uOwn[4] != 0.0) col = mix(col, mix(pale, uKind[4], sat(blot * 1.8 - 0.25)), osFar * mix(pc * (1.0 - smoothstep(last - 0.5, last, u0)), pin, seen));
  if (uOwn[6] > 0.0 && rope.z > 0.0) {
    vec3 base = mix(uOwn[5] > 0.0 ? mix(sheet, brown, 0.96 * uOwn[5]) : sheet, mix(brown, sheet, 0.12), 0.8 * sat(cov) * (1.0 - 0.5 * max(uOwn[5], 0.0)));
    if (uOwn[4] > 0.0) base = mix(base, mix(brown, pale, 0.12 + 0.88 * pc), uOwn[4]);
    base = mix(base, uKind[4], sat(blot * 1.5 + 0.9 * bead));
    col = mix(col, osCord(rope.x, rope.y, gr / max(length(gr), 1e-6), base * 1.1, seen), uOwn[6] * rope.z * osFar);
  }
  return col;
}

// The sheet laid down as a land, and what stands on it lifts the line.
vec2 osLaid(vec2 p, float t) { float w = max(1.0 - 2.4 * t * p.y, 0.05); return p / w * (1.0 + 0.5 * t); }
vec3 render(vec2 p) {
  osFar = 1.0;
  if (uOwn[7] > 0.0) {
    float t = uOwn[7], w = 1.0 - 2.4 * t * p.y;
    osPlace(uVar); osHeart = vec2(0.0);
    vec2 q = osLaid(p, t);
    float lift = 0.62 * t * max(w, 0.1) / (1.0 + 0.5 * t), n = uOwn[3] > 0.0 ? 7.5 : 5.0, top = (uOwn[3] > 0.0 ? 0.36 : 0.3) * osSc, over = 1.0, was = 1.0, at = top;
    vec2 back = q;
    for (int i = 0; i < 9 && float(i) < n + 1.0; i++) {              // from the near side: the first that stands in the way is seen
      at = top * (1.0 - float(i) / n);
      q = osLaid(p - vec2(0.0, lift * at), t);
      over = at - osHigh(q);
      if (over < 0.0) { q = mix(back, q, was / max(was - over, 1e-5)); break; }
      was = over; back = q;
    }
    p = q; osFar = smoothstep(0.14, 0.44, w);
  }
  return uVar < 0.5 ? osEngraved(p) : osHand(p);
}
