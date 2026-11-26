// name: One spiral
// a: Engraved
// b: Loose hand
// what: One black line winds out from a point on white paper, and only by growing thicker and thinner it makes an egg on a cloth, a rolling wave, a knot, each turning into the next over minutes with its own shadow; or the same line by a loose hand in brown ink, wandering, running dry and dipped again, the form half there.
// follows: Loudness takes the line from nearly even to full relief. The drone lifts the wave, pads soften the light, texture roughens the line's edge, a phrase sends a ripple outward. A hit is a coloured blot running out from the middle, a cue slides the line round a whole turn. The spectrum weights its rings, the loop swings the light, keys drop beads.
float osEgg, osKnot, osWave, osSc, osSoft;   // how far each form has risen, its size on this page, how soft the light is
vec2 osEggC, osKnotC;                        // where the egg and the knot lie
mat2 osEggT, osKnotT;
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
  return sat(uHits * 1.6) * exp(-dot(d, d) / (0.0105 - 0.004 * go));
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

vec3 osEngraved(vec2 p) {
  osPlace(0.0);
  vec2 heart = vec2(-0.185, 0.075) * osSc, c = p - heart;
  float pitch = max(1.0 / 106.0, 5.13 / uRes.y), r = length(c), ang = atan(c.y, c.x + 1e-6);
  // a phrase bends the line, and the bend goes out from the middle
  vec2 bend = osBend(r, ang);
  float u = r / pitch - ang / TAU + osTurn() + bend.x / pitch, steep = 1.0 + bend.y;
  u = fract(u + 0.5) - 0.5;
  float depth = 0.33 + 0.67 * smoothstep(0.0, 0.5, uLevel * (1.0 + 0.4 * uEnergy));
  depth = mix(depth, 1.0, 0.6 * uCue);
  float lit = osLit(p);
  float dark = mix(0.90, 0.08, smoothstep(0.02, 1.08, pow(lit, mix(1.3, 0.95, uTone))));
  float ring = band(r / (0.95 * osSc + 0.1));
  float cov = mix(0.24, dark, depth) + 0.10 * ring * (0.4 + uEnergy);
  float blot = osBlot(c), bead = osBeads(c);
  cov += 0.6 * blot + 0.6 * bead + osSwell(r);
  cov += uTexture * 0.22 * (noise(p * uRes.y * 0.22) - 0.5) * smoothstep(0.02, 0.3, cov);
  cov = clamp(cov, 0.05, 0.93);
  float px = pitch * uRes.y / max(steep, 0.3), x = abs(u) * px, w = 0.5 * cov * px;
  float ink = osCover(x, w) + osCover(px - x, w);
  ink *= smoothstep(0.1, 0.6, r / pitch);
  vec3 sheet = vec3(0.958, 0.950, 0.930) * (1.0 + 0.035 * (noise(p * 2.0) - 0.5) + 0.02 * (noise(p * 260.0) - 0.5));
  vec3 black = mix(vec3(0.055, 0.052, 0.060), uKind[4] * vec3(0.62, 0.30, 0.30), sat(blot * 1.8 - 0.25));
  return mix(sheet, black, sat(ink));
}

// The same line by hand: every turn wanders for itself, leans on its neighbours, runs dry and is dipped.
vec3 osHand(vec2 p) {
  osPlace(1.0);
  float shape = uRes.x / uRes.y, wide = clamp(shape * 0.86, 0.5, 1.42);
  vec2 c = p - vec2(-0.04, 0.0), q = rot(0.16) * c / vec2(wide, min(wide, 1.0));
  float pitch = max(1.0 / 116.0, 2.9 / uRes.y), r = length(q), ang = atan(q.y, q.x + 1e-6), th = fract(ang / TAU - osTurn());
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
  float blot = osBlot(c), bead = osBeads(c);
  cov = cov * mix(1.15, 0.88, uTone) + 0.7 * blot + 0.6 * bead + osSwell(r);
  float near = floor(u + 0.5), clear = 1.0, wet = 0.0, last = 0.53 / pitch;
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
    float bite = noise(vec2(len * 34.0, (u - k - wob) * min(0.3 * px, 9.0))) + 0.35 * noise(p * 170.0);
    float dry = mix(1.0, smoothstep(0.35, 0.85, bite + full * 1.6), 1.0 - smoothstep(0.1, 0.45, full));
    float here = ink * dry * mix(0.80, 0.97, full);
    clear *= 1.0 - here;
    wet = max(wet, here * full);
  }
  vec3 sheet = vec3(0.950, 0.922, 0.868) * (1.0 + 0.05 * (noise(p * 1.7 + 3.0) - 0.5) + 0.035 * (noise(p * vec2(90.0, 300.0)) - 0.5));
  vec3 brown = mix(vec3(0.46, 0.27, 0.13), vec3(0.13, 0.065, 0.035), wet);
  brown = mix(brown, uKind[4] * vec3(0.62, 0.28, 0.26), sat(blot * 1.8 - 0.25));
  return mix(sheet, brown, 1.0 - clear);
}

vec3 render(vec2 p) { return uVar < 0.5 ? osEngraved(p) : osHand(p); }
