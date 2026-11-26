// name: Scraped wax
// a: Slow edge
// b: Under black
// what: Coloured waxes laid warm in many coats and pulled back by one long blade: pale, red, honey and blue smears with cords, skips and islands, like land seen from a train, to a rolled edge where the dark coat still stands; or the bright coats lie under black wax, and slanting hatch scratched above and below one line lets them shine.
// follows: Drone brings up the blue coat low down, texture the honey, phrase the green, pad the mauve above. The piece stains the wax where it lies; bands open skips or hatching along the height. A hit is a fresh nick or scratches, a cue a gleam along the edge or line, the loop moves it. Highs sharpen scratches, keys gleam, a voice warms, Tone hardens, Space widens it.
float scSq(float x) { return x * x; }
float scS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float scPx, scHw, scAmt[5];
vec4 scStain; // what the piece holds at this place: its colour, and how much
vec3 scWax[5];
const vec3 scBone = vec3(0.90, 0.855, 0.755);
const vec3 scDeep = vec3(0.10, 0.12, 0.14);
const float scAt[5] = float[5](-0.31, 0.27, -0.13, 0.10, -0.02); // where along the height each kind's coat lies
// The long gradient of the old coats, from the foot of the panel to its top.
vec3 scGround(float y) {
  vec3 c = mix(vec3(0.13, 0.07, 0.065), vec3(0.42, 0.17, 0.10), scS(-0.5, -0.36, y));
  c = mix(c, vec3(0.80, 0.50, 0.22), scS(-0.38, -0.20, y));
  c = mix(c, vec3(0.86, 0.68, 0.45), scS(-0.24, -0.15, y));
  c = mix(c, vec3(0.075, 0.12, 0.15), scS(-0.145, -0.085, y));
  c = mix(c, vec3(0.20, 0.34, 0.38), scS(-0.07, 0.06, y));
  c = mix(c, vec3(0.78, 0.66, 0.56), scS(0.02, 0.20, y));
  return mix(c, vec3(0.60, 0.67, 0.69), scS(0.20, 0.5, y));
}
// The scraped side: the films of wax the blade left, one over another. Gives colour (rgb) and height (a).
vec4 scScrape(vec2 q, vec2 s, bool paint) {
  float slow = noise(vec2(q.x * 0.5, q.y * 3.0));
  q.y += 0.010 * (slow - 0.5);
  float n1 = noise(vec2(q.x * 0.9 + 3.0, q.y * 21.0));
  float n2 = noise(vec2(q.x * 2.0, q.y * 78.0));
  float n3 = noise(vec2(q.x * 6.0, q.y * 270.0));
  // a nick in the blade leaves one long cord of wax
  float cord = scS(0.66, 0.92, noise(vec2(q.x * 0.22, q.y * 47.0 + 9.0))) * (0.4 + 0.6 * n1);
  // the blade shudders: fine marks across the stroke, in patches
  float shud = scS(0.5, 0.85, noise(vec2(q.x * 1.7 + 40.0, q.y * 6.0))) * (noise(vec2((q.x - 0.1 * q.y) * 95.0, q.y * 9.0)) - 0.5);
  // and skips: the film breaks into islands
  float lace = noise(vec2(q.x * 11.0 + 3.0 * n1, q.y * 44.0)) * 0.65 + 0.35 * noise(vec2(q.x * 27.0, q.y * 110.0)) + 0.25 * (n3 - 0.5);
  float fine = 0.42 * n2 + 0.33 * n3 + 0.25 * n1 + 0.16 * shud;
  vec3 c = vec3(0.0);
  float yy = s.y + 0.11 * (n1 - 0.5) + 0.07 * (n2 - 0.5) + 0.05 * (slow - 0.5);
  if (paint) {
    c = scGround(yy) * (0.86 + 0.28 * n3);
    c = mix(c, c * 0.5 + scStain.rgb * 0.6, 0.55 * scStain.a);
  }
  float h = 0.5 * n1 + 0.45 * n2 + 0.16 * n3 * (0.7 + uHigh) + 0.5 * shud + 1.1 * cord;
  float bnd = band(s.y + 0.5);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), th, blend = noise(vec2(q.x * 0.8 + fi * 5.0, q.y * 5.0 + fi * 9.0));
    if (i < 5) {
      float off = (s.y - scAt[i]) / (i == 4 ? 0.05 : 0.11);
      th = 0.55 + 0.055 * off * off - 0.17 * scAmt[i];
    } else th = 0.64 - 0.09 * bnd + 0.02 * cos(s.y * 9.0) - 0.04 * scS(0.1, 0.5, s.y);
    if (th > 0.88) continue;
    float a = noise(vec2(q.x * 1.1 + fi * 17.3, q.y * (i == 5 ? 26.0 : 13.0) + fi * 31.7));
    float v = 0.56 * a + 0.44 * fine - th;
    v -= scS(0.5, 0.75, blend) * 0.28 * scS(0.02, 0.25, lace - 0.42);
    float soft = mix(0.008, 0.10, scS(0.55, 0.25, blend));
    float cov = scS(-soft, soft, v), body = scS(0.0, 0.22, v);
    h += cov * (0.5 + 1.1 * body);
    if (paint && cov > 0.0) {
      vec3 w = (i < 5 ? scWax[i] : scBone) * (0.82 + 0.34 * n2);
      // thin wax stains what is under it, thick wax hides it
      vec3 thin = mix(c, c * w * 1.5, 0.6);
      c = mix(c, mix(mix(thin, w, 0.35), w, body), cov);
    }
  }
  return vec4(c, h);
}
// The coat the blade has not reached: thick dark wax, laid warm in short dabs that fused.
float scCoat(vec2 q) {
  q.x += 0.12 * q.y;
  float a = noise(q * vec2(3.0, 4.0)), h = 0.0, k = 1.0;
  vec2 w = q * vec2(9.0, 5.0) + a * 1.5;
  for (int i = 0; i < 3; i++) {
    float n = abs(2.0 * noise(w) - 1.0);
    h += k * (1.0 - n) * (1.0 - n);
    w = rot(0.5) * w * 2.1 + 3.7; k *= 0.45;
  }
  return 2.0 * a + 2.6 * h + 0.3 * noise(q * 150.0);
}
// Height and colour of the whole panel. d: how far past the blade's edge.
vec4 scPanel(vec2 p, float drift, bool paint, out float d) {
  float ex = scHw * 0.42 + 0.10 * p.y + 0.06 * scHw * (1.0 - cos(TAU * uLoop)) - 0.03;
  d = p.x - ex - 0.004 * noise(vec2(p.y * 70.0, drift * 9.0));
  vec2 s = vec2(p.x, p.y + 0.03 * p.x + 0.010 * sin(p.x * 2.3));
  vec2 q = vec2(p.x + drift, s.y);
  float l1 = noise(vec2(p.y * 9.0, drift * 1.5)), l2 = noise(vec2(p.y * 37.0, drift * 5.0)), w = 0.012 + 0.030 * l1 + 0.012 * l2;
  if (d < 0.0) return scScrape(q, s, paint);
  float u = d / w;
  float roll = u < 1.0 ? sqrt(max(4.0 * (u + 0.06) * (1.0 - u), 0.0)) : 0.0;
  float h = 2.0 + 0.8 * scCoat(q) + roll * (5.0 + 2.0 * l2) + (u < 1.0 ? 1.5 * noise(vec2(u * 3.0 + 4.0 * l2, p.y * 130.0)) : 0.0);
  vec3 c = scBone;
  if (paint) {
    // what little of the coats beneath comes through
    float a = noise(q * vec2(2.0, 3.0) + 9.0), b = noise(q * vec2(6.0, 5.0) + 1.0);
    c = mix(scDeep, scGround(s.y + 0.16 * (a - 0.5)), 0.05 + 0.5 * a * b);
    if (u < 1.25) {
      vec3 k = scScrape(vec2(q.x * 0.2, s.y + 0.02 * u * l2), s, true).rgb;
      c = mix(c, mix(k, scBone, 0.18), scS(1.2, 0.85, u));
    }
    // the roll's shadow on the coat
    c *= 1.0 - 0.6 * scS(2.4, 0.95, u) * scS(0.9, 1.0, u);
  }
  return vec4(c, h);
}
vec3 scA(vec2 p) {
  float drift = 3.0 + 24.0 * sin(uTravel * 0.00046), d, d2;
  vec2 L = normalize(vec2(-0.45, 0.9));
  const float e = 0.0026;
  vec4 a = scPanel(p, drift, true, d);
  float h2 = scPanel(p + L * e, drift, false, d2).a;
  if (d > 0.0 != d2 > 0.0) h2 = a.a; // the step at the edge itself is drawn by the roll
  float slope = (h2 - a.a) * mix(0.75, 1.3, uTone) * (1.0 + 0.4 * uLow);
  vec3 c = a.rgb;
  // a hit: one fresh nick, cut to a bright coat, that fills in again
  vec2 n = p - vec2(scHw * (0.36 * sin(uTime * 0.13) - 0.25), 0.16 * sin(uTime * 0.19 + 1.0));
  n.y += 0.03 * p.x;
  float run = (n.x + 0.2) / 0.42, torn = noise(vec2(n.x * 24.0, n.y * 260.0)), wide = 0.019 * sqrt(max(run * (1.0 - run) * 4.0, 0.0)) * (1.15 - 0.8 * run) * (0.5 + 0.9 * torn);
  if (uHits > 0.003 && wide > 0.0) {
    float cut = scS(scPx, -scPx, abs(n.y) - wide) * scS(0.0, 0.4, uHits), side = clamp(n.y / wide, -1.0, 1.0);
    vec3 fresh = mix(mix(uKind[4], uKind[4] * uKind[4], 0.5), vec3(1.0, 0.93, 0.82), sat(0.75 - 0.8 * side * side + 0.5 * (torn - 0.5)));
    c = mix(c, fresh, cut * (0.6 + 0.4 * uHits));
    slope = mix(slope, -1.0 * side + 1.2 * (torn - 0.5), cut);
  }
  slope = clamp(slope, -2.2, 2.2);
  vec3 hl = uHits * exp(-dot(n * vec2(5.0, 13.0), n * vec2(5.0, 13.0))) * uKind[4]; // and the wax round it glows a little
  // light comes in at the upper left and dies away along the panel
  vec2 o = (p - vec2(-0.45 * scHw / 0.89, 0.32)) * vec2(0.62, 0.9);
  float pool = exp(-dot(o, o) * mix(1.7, 0.9, uSpace));
  // wax takes the light in: its shadows stay warm
  float lit = exp(-0.75 * slope);
  c *= mix(vec3(0.46, 0.37, 0.36), vec3(1.0), sat(lit)) * (1.0 + 0.10 * sat(lit - 1.0));
  float glint = exp(-scSq((slope + 0.8) * 2.2));
  // a cue: a wet gleam goes down the edge
  float fall = p.y - 0.46 + 1.1 * (1.0 - uCue), near = exp(-scSq(d * (d > 0.0 ? 22.0 : 9.0)));
  float wet = near * sqrt(uCue) * (0.25 + 1.5 * exp(-fall * fall * 40.0));
  c += vec3(1.0, 0.95, 0.86) * glint * ((d > 0.0 ? 0.17 : 0.04) + (0.24 + 0.2 * uKeys) * pool + 0.45 * wet);
  c += vec3(0.85, 0.93, 1.0) * (0.05 * pool + 0.16 * wet) + 0.22 * hl * (0.3 + c);
  c *= 0.64 + (0.40 + 0.06 * uLevel) * pool + vec3(0.22, 0.12, 0.03) * uMic * exp(-d * d * 7.0);
  return c;
}
// The bright coats that lie under the black. t: how far above the ruled line.
vec3 scUnder(vec2 q, float t) {
  float st = noise(vec2(q.x * 1.2 + uTime * 0.006, q.y * 26.0)), a = noise(vec2(q.x * 1.7 - uTime * 0.009, t * 3.0 + 7.0));
  float b = noise(vec2(q.x * 2.1 + t * 2.0 + 5.0, t * 4.0 - uTime * 0.007));
  float u = t + 0.05 * (st - 0.5) + 0.22 * (a - 0.5) * scS(0.0, 0.15, abs(t));
  vec3 c = mix(vec3(0.98, 0.86, 0.62), vec3(0.88, 0.52, 0.33), scS(0.0, 0.12, u));
  c = mix(c, vec3(0.62, 0.40, 0.46), scS(0.10, 0.22, u));
  c = mix(c, vec3(0.33, 0.45, 0.58), scS(0.18, 0.36, u));
  c = mix(c, vec3(0.16, 0.28, 0.44), scS(0.34, 0.6, u));
  c = mix(c, vec3(0.80, 0.42, 0.18), scS(0.0, -0.06, u));
  c = mix(c, vec3(0.50, 0.17, 0.13), scS(-0.06, -0.15, u));
  c = mix(c, vec3(0.10, 0.26, 0.31), scS(-0.14, -0.26, u));
  // each kind has its own pool of wax, which comes up as it sounds
  c = mix(c, scWax[3] * 1.25 + 0.06, sat(scAmt[3] * 1.5) * scS(0.35, 0.65, a) * scS(0.17, 0.02, abs(u - 0.12)));
  c = mix(c, scWax[1] * 1.15 + 0.04, sat(scAmt[1] * 1.5) * scS(0.58, 0.40, b) * scS(0.22, 0.04, abs(u - 0.27)));
  c = mix(c, scWax[2] * 1.15 + 0.04, sat(scAmt[2] * 1.5) * scS(0.3, 0.6, b) * scS(0.12, 0.02, abs(u + 0.05)));
  c = mix(c, scWax[0] * 1.5 + 0.06, sat(scAmt[0] * 1.5) * scS(0.7, 0.4, a) * scS(0.20, 0.04, abs(u + 0.22)));
  vec3 old = mix(vec3(dot(scStain.rgb, vec3(0.3, 0.55, 0.15))), scStain.rgb, 0.5) * vec3(1.06, 0.98, 0.88); // the stain, aged
  c = mix(c, c * 0.4 + old * 0.7, 0.4 * scStain.a);
  return c * (0.8 + 0.4 * st);
}
float scLine(float x) { return -0.13 + 0.09 * x + 0.015 * (1.0 - cos(TAU * uLoop)); }
// How closely the panel is hatched at a place, 0 black to 1.
float scDense(vec2 q) {
  float t = q.y - scLine(q.x);
  float veil = noise(vec2(q.x * 2.6 - 0.5 * q.y + uTime * 0.008, 3.0 + t * 1.5));
  float k1 = exp(-scSq((t - 0.11) * 12.0)) * scAmt[3] + exp(-scSq((t - 0.25) * 8.0)) * scAmt[1];
  float k2 = exp(-scSq((t + 0.04) * 18.0)) * scAmt[2] + exp(-scSq((t + 0.20) * 9.0)) * scAmt[0];
  float up = exp(-max(t, 0.0) * mix(6.0 - uSpace, 2.6 - 1.2 * uSpace, veil * veil * 1.3)) * (0.62 + 0.55 * veil + 0.22 * (band(0.5 + 0.9 * q.y) - 0.2) + 0.1 * uLow) + 0.5 * k1 * scS(0.2, 0.9, veil);
  float dn = exp(min(t, 0.0) * 4.0) * (0.42 + 0.5 * veil + 0.22 * (band(0.5 + 0.9 * q.y) - 0.2) + 0.1 * uLow) + 0.5 * k2 * scS(0.1, 0.9, veil);
  return t > 0.0 ? up : dn;
}
vec3 scB(vec2 p) {
  float w0 = noise(p * vec2(1.3, 30.0) + 4.0), w1 = noise(p * vec2(3.0, 110.0));
  vec2 o = p - vec2(-0.3 * scHw, 0.28);
  float pool = exp(-dot(o, o) * 2.2);
  vec3 c = vec3(0.030, 0.027, 0.033) * (0.7 + 0.6 * w0) + vec3(0.17, 0.175, 0.19) * pool * w0 * w0 * w1 * (1.0 + uTone);
  float t = p.y - scLine(p.x), rest = p.y + 0.13 - 0.09 * p.x, eq = scPx * 0.8, below = step(t, 0.0);
  vec3 under = scUnder(p, t);
  c += under * (0.02 + 0.07 * scS(0.45, 0.9, w0 * 0.7 + w1 * 0.4)) * exp(-abs(t) * 3.0);
  for (int j = 0; j < 4; j++) {
    float fj = float(j);
    // the hand works in patches, each at its own slant
    float wide = 0.26 - 0.03 * fj, px = (below > 0.5 ? p.x * 0.45 - rest * 2.0 : p.x - 0.8 * rest) / wide + fj * 0.5 + 10.0, pid = floor(px);
    float hp = hash21(vec2(pid, fj + 40.0 * below)), in_ = px - pid - 0.5;
    float ang = below > 0.5 ? 0.06 + (hp - 0.5) * 0.16 + (j == 2 ? 0.28 : j == 3 ? -0.5 : 0.0) : 0.80 + (hp - 0.5) * 0.24 - (j == 2 ? 0.42 : j == 3 ? -0.5 : 0.0);
    float sp = 0.0072 + 0.0009 * fj, len = mix(0.18, 0.32, hp);
    float cs = cos(ang), sn = sin(ang);
    vec2 r = vec2(cs * p.x + sn * p.y, cs * p.y - sn * p.x);
    r.y += 0.10 * in_ * in_ * (hp - 0.3) * wide;
    float row = floor(r.y / sp), hr = hash21(vec2(row, pid * 7.0 + fj));
    float u = r.x / len + hr * 5.0, cell = floor(u), f = u - cell - 0.5;
    vec2 h2 = hash22(vec2(cell + pid * 13.0, row + fj * 29.0));
    vec2 m = vec2((cell + 0.5 - hr * 5.0) * len, (row + 0.5) * sp);
    vec2 q = vec2(cs * m.x - sn * m.y, sn * m.x + cs * m.y);
    float dens = scDense(q) - 0.16 * fj - scS(0.35, 0.5, abs(in_) + 0.2 * (hr - 0.5));
    float on = scS(h2.x * 0.30, h2.x * 0.30 + 0.55, dens);
    if (on <= 0.0) continue;
    float hl = 0.5 * (0.6 + 0.4 * h2.y), body = max(1.0 - f * f / (hl * hl), 0.0);
    float v = r.y - (row + 0.5 + (h2.y - 0.5) * 0.35 + (h2.x - 0.5) * 0.35 * f) * sp;
    float hw = sp * (0.04 + (0.25 + 0.1 * uTone) * on) * sqrt(body), dd = abs(v) - hw;
    float cov = scS(eq, -eq, dd) * scS(0.0, 0.2, body) * sat(on * 2.0);
    c *= 1.0 - 0.5 * (1.0 - cov) * scS(2.5 * scPx, 0.0, dd) * on * body;
    c = mix(c, under * (1.04 - 0.32 * clamp(v / max(hw, scPx), -0.6, 1.0)), cov * (0.8 + 0.2 * h2.x)); // the far wall of the cut is in shade
    c += vec3(0.22, 0.21, 0.20) * (1.0 + 3.5 * uHigh) * (1.0 - cov) * scS(2.0 * scPx, 0.0, abs(dd - 1.2 * scPx)) * step(0.0, v) * on * body * (0.15 + pool) * (1.0 - sat(c.g * 2.2));
  }
  // a hit: a handful of fresh scratches, cut one after another
  vec2 o2 = vec2(p.x - scHw * (0.30 * sin(uTime * 0.13) - 0.12), rest - 0.23 - 0.05 * sin(uTime * 0.19 + 1.0));
  if (uHits > 0.003 && dot(o2, o2) < 0.09) {
    vec2 r = vec2(0.62 * o2.x + 0.785 * o2.y, 0.62 * o2.y - 0.785 * o2.x);
    r.y += 0.22 * r.x * r.x + 0.06 * r.x;
    float row = floor(r.y / 0.021), hr = hash11(row + 31.0), u = (r.x - 0.13 * (hr - 0.5)) / (0.12 + 0.09 * hr);
    if (abs(row) < 4.5 && abs(u) < 1.0) {
      float v = r.y - (row + 0.5 + 0.35 * (hr - 0.5)) * 0.021, hw = 0.0044 * sqrt(1.0 - u * u) * (1.1 - 0.4 * u) * (0.7 + 0.5 * hr);
      float tip = exp(-scSq((u - 7.0 * (1.0 - uHits) + 0.6 * row + 2.2) * 0.8));
      c *= 1.0 - 0.6 * uHits * scS(0.006, 0.0, abs(v) - hw);
      c = mix(c, mix(under * 0.5 + uKind[4] * uKind[4] * 0.5, vec3(1.0, 0.94, 0.84), 0.7 + 0.3 * tip - 0.4 * clamp(v / max(hw, scPx), 0.0, 1.0)), scS(scPx, -scPx, abs(v) - hw) * scS(0.0, 0.4, uHits) * (0.8 + 0.2 * tip));
    }
  }
  // a cue: a gleam runs along the ruled line; a voice warms it
  float far = p.x + 1.1 * scHw - 2.4 * scHw * (1.0 - uCue);
  c += c * (1.0 * sqrt(uCue) * exp(-far * far * 9.0) * exp(-t * t * 130.0) + 0.45 * uMic * exp(-t * t * 60.0));
  c += vec3(1.0, 0.93, 0.8) * (0.55 * sqrt(uCue) * exp(-far * far * 7.0)) * scS(2.5 * scPx, 0.0, abs(t));
  c *= 1.0 + 0.4 * uKeys * exp(-scSq((p.x * 0.8 - p.y) * 4.0));
  return c;
}
vec3 render(vec2 p) {
  scPx = 1.0 / uRes.y; scHw = min(0.5 * uRes.x / uRes.y, 1.0);
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, 0.0);
  vec3 pig[5] = vec3[5](vec3(0.05, 0.22, 0.27), vec3(0.55, 0.36, 0.42), vec3(0.90, 0.58, 0.20), vec3(0.42, 0.55, 0.44), vec3(0.72, 0.20, 0.13));
  for (int i = 0; i < 5; i++) { scAmt[i] = lv[i] * (0.6 + 0.6 * uEnergy); scWax[i] = mix(pig[i], uKind[i], 0.28 - 0.14 * uVar); }
  float pull = 0.12 * noise(vec2(p.x * 1.5, p.y * 40.0 + 1.2 * p.x)) + 0.06 * noise(vec2(p.x * 3.0, p.y * 150.0 + 4.5 * p.x));
  vec4 pc = piece(vec2(p.x / (2.0 * scHw) + 0.5 + pull - 0.09, 0.5 - p.y + 0.1 * (pull - 0.09)));
  scStain = vec4(pc.rgb / max(pc.a, 0.02), sat(pc.a * 1.2));
  return uVar < 0.5 ? scA(p) : scB(p);
}
