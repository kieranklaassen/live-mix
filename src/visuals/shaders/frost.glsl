// name: Frost
// a: Window
// b: Grass
// what: Frost on a window before dawn: stiff feathers of ice with barbs on their barbs grow in from the edges, and through the clear glass that is left a blue garden and a far lamp show out of focus; or frosted grass against the low sun, white needles all along each blade and round the rim of one brown leaf.
// follows: The feathers, or the needles, grow and draw back once in the loop. Each kind of sound lights its own feathers or blades, and the piece lies along them from foot to tip. Low warms the lamp or the sun, a cue more so; high and keys bring glints. A hit runs one fine crack over the glass, or a light up the blades. In the grass the bands light far grains of frost.
// own: 0 1 great feathers (b: broad leaves), -1 small ones (b: twice as many thin blades); 1 1 curled over like young fern, -1 straight as spears; 2 1 full plumes (b: long needles), -1 bare twigs (b: no needles); 3 the hour: 1 bright day under a sky in the colour of the hits, -1 an afterglow in that colour; 4 what is behind: 1 the round lights of a street, -1 nothing but a plain ground in the colour of the drone; 5 1 living leaves in the colours of the kinds, -1 black shapes against the light; 6 1 they grow from a bed below (b: stand upright), -1 out from the middle (b: all lean with the wind); 7 1 snow falls past, -1 drops stand on the pane

// The feathers: where each starts (x is stretched) and which way; how it bends, how wide, when it grows, how long.
const int FR_N = 20;
const vec4 FR_A[20] = vec4[20](
  vec4(-0.74, -0.64, 0.54, 0.841), vec4(-0.5, -0.64, 0.697, 0.717), vec4(-1.02, -0.4, 0.454, 0.891),
  vec4(-0.16, -0.64, 0.853, 0.523), vec4(0.2, -0.64, 0.79, 0.613), vec4(1.0, -0.64, -0.589, 0.808),
  vec4(0.54, -0.64, 0.454, 0.891), vec4(0.74, -0.64, -0.178, 0.984), vec4(1.04, -0.3, -0.912, 0.409),
  vec4(1.04, 0.06, -0.703, 0.711), vec4(1.04, 0.36, -0.953, -0.304), vec4(0.94, 0.64, -0.628, -0.778),
  vec4(0.56, 0.64, 0.315, -0.949), vec4(0.22, 0.64, 0.697, -0.717), vec4(-0.2, 0.64, 0.697, -0.717),
  vec4(-0.7, 0.64, 0.582, -0.813), vec4(-1.04, 0.5, 0.939, -0.343), vec4(-1.04, 0.1, 0.853, 0.523),
  vec4(-1.04, -0.16, 0.976, 0.218), vec4(-1.02, -0.64, 0.582, 0.813));
const vec4 FR_B[20] = vec4[20](
  vec4(-0.98, 0.44, 0.0, 1.46), vec4(-0.75, 0.2, 0.1, 0.8), vec4(-0.5, 0.26, 0.05, 0.95),
  vec4(0.55, 0.22, 0.1, 0.62), vec4(0.6, 0.26, 0.13, 0.54), vec4(-0.6, 0.3, 0.0, 0.92),
  vec4(0.9, 0.25, 0.14, 0.44), vec4(0.6, 0.24, 0.1, 0.52), vec4(-0.8, 0.2, 0.1, 0.46),
  vec4(0.7, 0.2, 0.12, 0.5), vec4(0.8, 0.22, 0.14, 0.5), vec4(-0.75, 0.24, 0.04, 0.56),
  vec4(0.8, 0.22, 0.15, 0.34), vec4(-0.6, 0.25, 0.11, 0.54), vec4(0.55, 0.28, 0.08, 0.66),
  vec4(0.75, 0.34, 0.02, 1.0), vec4(0.5, 0.24, 0.12, 0.7), vec4(-0.5, 0.22, 0.1, 0.62),
  vec4(0.45, 0.27, 0.14, 0.8), vec4(0.6, 0.24, 0.06, 0.6));
// the numbers of its own by name
float frBig, frCurl, frFull, frDay, frDusk, frHour, frThick, frStreet, frBlank, frLive, frInk, frBed, frStar;
vec3 frH, frD;
float frSq(float x) { return x * x; }
float frS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float frGrain(vec2 p) { return 0.5 * (noise(rot(0.6) * p * 430.0) + noise(rot(2.1) * p * 310.0)); }
float frLevel(float k) { return k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : uPhrase; }
vec4 frB(int k) { return FR_B[k] * vec4(frCurl, frFull, 1.0, 1.0); }
vec3 frPlain(vec2 p) { return mix(frD * 0.75, frH * 1.5, frDay) * mix(1.1, mix(0.22, 0.8, frDay), frS(0.0, 0.95, length(p - vec2(-0.1, 0.12)))); }
// Round lights far off; each follows a band.
vec3 frLights(vec2 p) {
  vec3 c = vec3(0.0);
  int n = frStreet > 0.0 ? 26 : 0;
  for (int i = 0; i < n; i++) {
  float f = float(i), h = fract(f * 0.618 + 0.13), r = 0.018 + 0.06 * frSq(fract(f * 0.713 + 0.4));
  float d = length(p - vec2((h - 0.5) * 1.8, -0.3 + 0.62 * fract(f * 0.7549 + 0.2)));
  if (d > r) continue;
  c += uKind[i % 5] * uKind[i % 5] * frS(r, r - 0.008, d) * (0.65 + 0.4 * frS(0.5 * r, r, d)) * (0.2 + 1.1 * uBands[i % 16] * (0.4 + uEnergy)) * (0.8 + 0.2 * sin(uTime * 0.21 + f * 2.4));
  }
  return c * frStreet * 1.8;
}
float frAside(float x, float k) { x = clamp(x, -0.2, 1.4); return k * x * x * 0.25 * (1.0 + x); }
vec2 frBend(vec2 q, float k, float f, out vec2 t) {
  float x = clamp(q.x, -0.2, 1.4), g = k * x * (0.5 + 0.75 * x), n = inversesqrt(1.0 + g * g);
  t = vec2(1.0, g) * n;
  return vec2(q.x + 0.25 * g * g * x, (q.y - f) * n);
}
float frPlume(float u) { float x = sat(1.0 - u); return frS(-0.05, 0.22, u) * x * (1.6 - 0.6 * x) + 0.02; }
vec3 frSound(float kind, float u) {
  vec3 tint = uKind[int(kind)];
  float m = piece(vec2(0.02 + 0.96 * u, 0.84 - 0.2 * kind)).a;
  return mix(tint * tint, vec3(0.27, 0.42, 0.57), 0.28) * (0.65 * frLevel(kind) * exp(-2.0 * u) + 0.8 * m) * (0.3 + uEnergy);
}
// One feather at (s, d): x the line of ice, y how much, zw its slope.
vec4 frFeather(float s, float d, float len, float plume, float seed, float px, out vec2 hn) {
  float sg = d < 0.0 ? -1.0 : 1.0, ad = abs(d);
  float s0 = s - ad * 0.577 - ad * ad * 0.35;
  float p1 = 0.012 + 0.008 * fract(seed * 0.618) + 0.010 * len;
  float w = s0 / p1 + 0.45 * sin(s0 * 15.0 + seed) + 0.12 * sin(s0 * 61.0 + seed * 3.0) + 0.5 * step(sg, 0.0);
  float i = floor(w), hb = hash21(vec2(i + seed * 11.0, 5.0 + sg));
  float c = (fract(w) - 0.5) * p1 * 0.866, ac = abs(c), sc = c < 0.0 ? -1.0 : 1.0;
  float t = ad * 1.1547, u0 = sat((i + 0.5) * p1 / len);
  float bl = plume * frPlume(u0) * (0.45 + 0.55 * sqrt(hb)) * (0.85 + 0.15 * sin(s0 * 23.0 + seed * 5.0 + sg));
  float k = sat(1.0 - t / max(bl, 1e-4)), on = frS(0.0, 0.06, k);
  vec2 e1 = vec2(0.866, -0.5 * sg), b1 = vec2(0.5, 0.866 * sg);
  float r1 = sat(1.0 - ac / (p1 * 0.1 * sqrt(k) + px * 0.75)) * on;
  float p2 = p1 * (0.19 + 0.05 * hb);
  float w2 = (t - ac * 0.577) / p2 + 9.0 * hb + 0.5 * step(sc, 0.0);
  float h2 = hash21(vec2(floor(w2) + 37.0 * hb, i + seed * 3.0 + sc));
  float c2 = (fract(w2) - 0.5) * p2 * 0.866;
  float b2 = p1 * 0.62 * (0.5 + 0.5 * h2) * frS(0.0, 0.4, k + 0.04), k2 = sat(1.0 - ac * 1.1547 / max(b2, 1e-4));
  float see = frS(1.2, 3.0, p2 / px), in2 = frS(0.0, 0.2, k2) * on;
  float r2 = mix(0.45, sat(1.0 - abs(c2) / (p2 * 0.26 * (0.3 + 0.7 * k2) + px * 0.5)), see) * in2;
  vec2 e2 = e1 * (-0.5 * sc) + b1 * 0.866;
  float ws = (0.0025 + 0.0035 * len) * sat(1.1 - s / len) + px;
  float rs = sat(1.0 - ad / ws) * frS(len + 0.004, len - 0.02, s);
  hn = vec2(h2, hb);
  return vec4(sat(0.9 * r1 + 0.55 * r2 * (1.0 - r1) + rs), sat(in2 * 0.5 + on * exp(-ac / (p1 * 0.2)) * 0.4 + rs), e1 * sc * r1 + e2 * sign(c2) * r2 * 0.75 * see + vec2(0.0, sg) * rs);
}
vec3 frGarden(vec2 p, vec2 l, float warm) {
  float y = p.y, x = p.x - l.x;
  vec3 c = mix(vec3(0.055, 0.12, 0.2), vec3(0.006, 0.018, 0.05), frS(-0.1, 0.45, y));
  c += vec3(0.2, 0.15, 0.1) * exp(-frSq((y + 0.03) / 0.06)) * (0.4 + 0.4 * uMic);
  if (frHour > 0.0) c = mix(c, mix(mix(frH * 1.2, frD * 0.22, frS(-0.12, 0.4, y)), frH * mix(1.7, 1.05, frS(-0.1, 0.5, y)), frDay), frHour);
  vec3 wooded = mix(vec3(0.006, 0.016, 0.03), frH * vec3(0.34, 0.4, 0.45), frDay);
  float tree = -0.025 + 0.02 * sin(x * 13.0 + 1.0) + 0.01 * sin(x * 29.0) + 0.1 * frS(0.12, 0.4, x) + 0.1 * frS(-0.1, -0.35, x);
  c = mix(c, wooded, 0.9 * frS(0.04, -0.03, y - tree));
  const vec3 TR[5] = vec3[5](
  vec3(-0.4, 0.012, 0.05), vec3(-0.235, 0.008, -0.04), vec3(0.06, 0.010, 0.03), vec3(0.27, 0.007, -0.05), vec3(0.45, 0.013, 0.02));
  float wood = 0.0;
  if (y > -0.17) for (int i = 0; i < 5; i++) wood = max(wood, frS(0.016, -0.010, abs(x - TR[i].x - TR[i].z * y) - TR[i].y * (1.0 - 0.8 * y)));
  c = mix(c, mix(vec3(0.005, 0.012, 0.024), wooded, frDay), 0.8 * wood * frS(-0.16, -0.12, y));
  float snow = frS(-0.1, -0.15, y + 0.015 * sin(x * 7.0));
  vec3 lies = mix(vec3(0.04, 0.085, 0.15), vec3(0.015, 0.035, 0.07), sat((-0.12 - y) * 3.0));
  if (frHour > 0.0) lies = mix(lies, mix(frH * 0.5, frD * 0.12, sat((-0.12 - y) * 4.0)) * frDusk + (frH * 1.25 + 0.25) * frDay, frHour);
  c = mix(c, lies, snow);
  warm *= (1.0 - 0.9 * frDay) * (1.0 - frBlank);
  c = mix(c, frPlain(p), frBlank) + frLights(p) * (1.0 - 0.6 * frDay);
  float r2 = x * x + frSq(y - l.y), r = sqrt(r2);
  c = mix(c, vec3(0.004), 0.85 * (1.0 - frBlank) * (1.0 - frDay) * frS(0.006, 0.0, abs(x) - 0.002) * frS(-0.155, -0.14, y) * step(y, l.y));
  c += vec3(1.0, 0.55, 0.19) * warm * (0.8 * exp(-r2 / 0.0016) + 0.22 * exp(-r2 / 0.012) + 0.05 * exp(-r2 / 0.07)
   + snow * (0.24 * exp(-frSq(x / 0.13) - frSq((y + 0.155) / 0.03)) + 0.05 * exp(-frSq(x / 0.3) - frSq((y + 0.15) / 0.08))));
  return mix(c, vec3(1.9, 1.3, 0.7) * (0.6 + 0.6 * warm), frS(0.013, 0.007, r) * (1.0 - frBlank) * (1.0 - frDay));
}

vec3 frWindow(vec2 p, float px, float X) {
  vec2 lamp = vec2(0.25 * X, 0.0), ql = p - lamp;
  float warm = 0.6 + 0.5 * uLow * (0.5 + uEnergy) + 0.9 * uCue, S = mix(0.66, 1.0, frS(0.3, 0.9, X)) * frBig;
  vec2 round1 = vec2(0.0, 1.0);
  float front = mix(0.77, 1.05, 0.5 - 0.5 * cos(TAU * uLoop)) + 0.11 * sin(uTime * 0.055 - 0.4);
  float T1 = 9.0, T2 = 9.0;
  int k1 = -1, k2 = -1;
  vec2 m1 = vec2(0.0), m2 = m1, d1 = vec2(1.0, 0.0), d2 = d1;
  for (int k = 0; k < FR_N; k++) {
  vec4 A = FR_A[k], B = frB(k);
  if (frBed + frStar > 0.0) {
    float f = float(k);
    round1 = mat2(-0.7374, 0.6755, -0.6755, -0.7374) * round1;
    A = mix(A, frStar > 0.0 ? vec4(0.02 * round1 / vec2(X, 1.0), round1) : vec4((fract(f * 0.618 + 0.1) - 0.5) * 2.1, -0.6 - 0.05 * fract(f * 0.37), vec2(fract(f * 0.71) - 0.5, 1.0)), frBed + frStar);
    A.zw = normalize(A.zw + vec2(1e-3, 0.0));
    B.w *= mix(1.0, (k < 6 ? 0.62 : 0.5) / B.w, frStar) * mix(1.0, min(1.0, 0.75 / B.w), frBed); B.z *= 1.0 - frStar;
  }
  vec2 q = (p - vec2(A.x * X, A.y)) / S;
  float qx = dot(A.zw, q);
  if (qx < -0.1 || qx > B.w + 0.1) continue;
  q = vec2(qx, A.z * q.y - A.w * q.x);
  float f = frAside(q.x, B.x);
  if (abs(q.y - f) * 0.6 > B.y) continue;
  vec2 t, m = frBend(q, B.x, f, t);
  float ad = abs(m.y), s0 = m.x - ad * 0.577 - ad * ad * 0.35, u = s0 / B.w;
  if (u > 1.0 || ad * 1.1547 > B.y * frPlume(u)) continue;
  float T = B.z + s0 * 0.75 + ad * 1.3;
  if (T < T2) {
    vec2 d = vec2(A.z * t.x - A.w * t.y, A.w * t.x + A.z * t.y);
    if (T < T1) { T2 = T1; k2 = k1; m2 = m1; d2 = d1; T1 = T; k1 = k; m1 = m; d1 = d; }
    else { T2 = T; k2 = k; m2 = m; d2 = d; }
  }
  }
  vec2 g = vec2(0.0);
  float line = 0.0, body = 0.0, hn = 0.0;
  vec3 from = vec3(0.0), hue = uKind[0];
  for (int j = 1; j >= 0; j--) {
  int k = j == 1 ? k2 : k1;
  if (k < 0) continue;
  vec2 m = j == 1 ? m2 : m1, d = j == 1 ? d2 : d1, h;
  vec4 B = frB(k);
  B.w *= mix(1.0, (k < 6 ? 0.62 : 0.5) / B.w, frStar) * mix(1.0, min(1.0, 0.75 / B.w), frBed); B.z *= 1.0 - frStar;
  float ad = abs(m.y), T = B.z + (m.x - 0.577 * ad - 0.35 * ad * ad) * 0.75 + ad * 0.7;
  if (T > front + 0.012) continue;
  vec4 f = frFeather(m.x, m.y, B.w, B.y, float(k) + 1.0, px / S, h);
  f *= frS(0.012, -0.012, T + ad * 1.3 * h.y - front)
     * (j == 1 ? 0.6 : 1.0);
  float over = sat(f.x * 1.2 + f.y * 0.35);
  g = g * (1.0 - over) + f.z * d + f.w * vec2(-d.y, d.x);
  line = line * (1.0 - over) + f.x; body = body * (1.0 - 0.6 * f.y) + 0.6 * f.y; hn = h.x;
  from = mix(from, frSound(float(k % 4), sat(m.x / B.w)), f.y);
  hue = mix(hue, uKind[k % 4], sat(f.y * 2.0));
  }
  float edge = max(abs(p.x) / (0.89 * X), abs(p.y) / 0.5);
  float film = edge < 0.29 ? 0.0 : frS(0.5, 1.15, edge + 0.35 * (noise(p * 4.0) - 0.4)) * (0.6 + 0.8 * uSpace);
  if (film > 0.001) film *= 0.12 + 0.16 * frGrain(p);
  film *= (1.0 - frThick);
  vec3 col = frGarden(p + g * 0.012 * (1.0 - frThick), lamp, warm);
  float r2 = dot(ql, ql), away = frSq(ql.x * 0.75 / X) + ql.y * ql.y;
  vec3 sky = mix(vec3(0.34, 0.5, 0.66), vec3(0.085, 0.19, 0.36), frS(0.02, 0.85, away));
  vec3 glow = vec3(1.0, 0.52, 0.18) * warm * (1.6 * exp(-r2 / 0.022) + 0.5 * exp(-r2 / 0.08) + 0.1 * exp(-r2 / 0.3));
  float toSky = dot(g, vec2(-0.5, 0.86)), toLamp = -dot(g, ql) / (sqrt(r2) + 0.05);
  float crack = 0.0, beside = 0.0;
  if (uHits > 0.004) {
  vec2 cq = rot(-0.45 - 0.5 * sin(uTime * 0.023)) * (p - vec2(0.12 * X, 0.12 * sin(uTime * 0.017)));
  float v = cq.x, y = abs(cq.y + 0.05 * abs(fract(v * 1.9 + 0.2) * 2.0 - 1.0) + 0.014 * abs(fract(v * 6.3) * 2.0 - 1.0) - 0.03);
  float head = mix(0.8, 0.12, uHits), on = frS(head + 0.01, head - 0.01, v) * frS(-0.95, -0.6, v) * (0.4 + exp(-max(head - v, 0.0) * 4.0)) * uHits;
  crack = on * frS(px * 1.8, 0.0, y);
  beside = on * exp(-y * 26.0) * (0.1 + 0.75 * sat(line));
  }
  vec3 c = sky * (0.9 + 0.55 * toSky) + glow * (0.6 + 0.5 * toLamp) + from * 1.2;
  float thick = frThick, lit = 0.6 + 0.5 * toSky;
  if (thick + frDay > 0.0) {
  vec3 h2 = hue * hue;
  c = mix(c, (0.1 + h2) * (0.35 + 0.5 * lit) + from * 0.5, 0.9 * frDay);
  c = mix(c, h2 * (0.1 + 0.85 * lit * lit) * mix(0.7, 1.5, frDay) * (0.75 + 0.5 * uLevel) + from * hue * 1.4 + glow * 0.12 * h2, frLive);
  c = mix(c, 0.006 + 0.04 * frD + from * 0.15 + frH * 0.06 * sat(toLamp), frInk);
  }
  col = mix(col, c * mix(0.45, 0.62, thick), sat(film + mix(0.62, 3.2, thick) * body));
  col = mix(col, c * mix(mix(1.3, 1.95, uTone), 1.15, max(thick, frDay)), sat(line) * 0.9);
  col += (crack * 1.2 + beside * 0.8) * (vec3(0.5, 0.7, 0.9) + uKind[4] * 0.4);
  float tw = frSq(sat(sin(TAU * (hn * 5.0 + p.x * 0.8 - p.y * 0.5) + uTime * 0.35)));
  tw *= tw * tw * frS(0.75, 1.0, fract(hn * 91.7));
  col += (vec3(0.6, 0.8, 1.0) + glow * 2.0) * sat(1.0 - thick - 0.7 * frDay) * tw * sat(line) * (0.3 + 1.6 * uHigh + uKeys) * 1.3;
  return screenOf(col);
}
// The blades of b; number 4 is a dead leaf.
const vec4 FR_C[12] = vec4[12](
  vec4(-1.0, -0.64, 0.362, 0.932), vec4(0.3, -0.64, -0.129, 0.992), vec4(-0.3, -0.64, -0.049, 0.999),
  vec4(0.72, -0.64, -0.416, 0.909), vec4(1.06, 0.44, -0.961, -0.275), vec4(-0.8, -0.64, 0.454, 0.891),
  vec4(0.1, -0.64, -0.505, 0.863), vec4(-0.46, -0.64, 0.436, 0.9), vec4(-0.22, -0.64, 0.582, 0.813),
  vec4(0.4, -0.64, 0.436, 0.9), vec4(-0.6, -0.64, -0.276, 0.961), vec4(0.06, -0.64, 0.752, 0.659));
const vec4 FR_D[12] = vec4[12](
  vec4(-0.6, 0.016, 1.0, 0.94), vec4(0.4, 0.014, 3.0, 0.7), vec4(-0.5, 0.019, 2.0, 1.02),
  vec4(0.6, 0.015, 1.0, 0.6), vec4(0.6, 0.115, 3.0, 0.86), vec4(-0.95, 0.024, 2.0, 1.1),
  vec4(0.8, 0.02, 1.0, 0.76), vec4(-1.1, 0.03, 0.0, 1.26), vec4(-0.9, 0.023, 3.0, 0.94),
  vec4(-0.8, 0.02, 2.0, 0.62), vec4(0.7, 0.02, 0.0, 0.56), vec4(-0.6, 0.02, 1.0, 0.66));
vec4 frDof(int k) {
  vec4 B = FR_D[k % 12] * (k == 4 ? vec4(1.0) : vec4(frCurl, frBig, 1.0, mix(1.0, frBig, 0.22)));
  return k < 12 ? B : B * vec4(-1.0, 0.75 * sat(-uOwn[0] * 3.0), 1.0, mix(0.2, 0.92, -uOwn[0]));
}
float frNeedles(float s, float e, float pitch, float len, float lean, float seed, float px) {
  float w = (s - e * lean) / pitch, h = hash21(vec2(floor(w), seed)), l = max(len * (0.2 + 0.8 * h * h), 1e-4);
  float k = sat(1.0 - e / l), c = abs(fract(w) - 0.35 - 0.3 * h) * pitch;
  return sat(1.2 - c / (pitch * 0.18 * k + px * 0.7)) * frS(0.0, 0.12, k);
}
vec2 frEdge(vec2 m, float e, float u, float k, float big, float px) {
  big *= frFull;
  float seed = k * 3.0 + (m.y < 0.0 ? 1.0 : 2.0), e0 = max(e + 0.004, 0.0);
  float gr = (m.y > 0.0 ? 1.0 : 0.6) * big * mix(0.66, 1.0, 0.5 - 0.5 * cos(TAU * uLoop)) * frS(0.0, 0.12, u) * (1.0 + 0.4 * sin(m.x * 37.0 + seed) * sin(m.x * 17.0 + seed * 2.0));
  float n = max(frNeedles(m.x, e0, 0.0046, 0.018 * gr, 0.25, seed, px), frNeedles(m.x, e0, 0.0080, 0.036 * gr, 0.65, seed + 20.0, px));
  n *= frS(-0.004, 0.0, e) * frS(1.04, 0.99, u - 0.3 * e0) * step(0.0, u);
  float tw = frSq(sat(sin(hash11(floor(m.x / 0.0080) + seed) * 31.4 + m.x * 3.8 + uTime * 0.37)));
  return vec2(n * mix(0.8, 1.0, uTone), tw * tw * tw);
}
vec3 frIce(vec2 p, float near, float warm, vec3 sound, vec3 hue) {
  vec3 c = mix(vec3(0.42, 0.58, 0.74), vec3(1.7, 1.25, 0.8) * warm, 0.08 + 0.85 * near) * mix(0.55, 1.15, frS(-0.5, 0.0, p.y)) + sound * 1.8;
  if (frThick + frDay > 0.0) {
  c = mix(c, 0.12 + hue * hue * 0.6 + sound, 0.85 * frDay);
  c = mix(c, hue * (hue * (0.5 + 1.3 * near * warm) + sound * 1.6), frLive);
  c = mix(c, vec3(0.02) + frH * 0.9 * near * near + sound * 0.5, frInk);
  }
  return c;
}
vec3 frLeaf(vec3 col, vec2 p, vec2 m, float near, float warm, float px) {
  vec4 B = FR_D[4];
  if (m.x < -8.0) return col;
  float ad = abs(m.y), u = m.x / B.w, v = sat(u);
  float e = ad - B.y * 2.1 * sqrt(v) * (1.0 - v) * (1.0 + 0.2 * v) - 0.003 * abs(fract(m.x * 42.0) * 2.0 - 1.0) * (1.0 - v);
  vec3 ice = frIce(p, near, warm, frSound(B.z, v), uKind[3]);
  float vs = (m.x - ad * 0.75) / 0.042 + 0.5 * step(0.0, m.y), vn = abs(fract(vs) - 0.5) * 0.034;
  float vein = max(sat(1.2 - vn / 0.0022), sat(1.2 - ad / (0.0045 * (1.1 - v)))), grain = frGrain(m), spot = noise(m * 18.0 + 9.0);
  vec3 c = mix(vec3(0.13, 0.034, 0.012), vec3(0.85, 0.34, 0.07) * warm, sat(0.08 + 0.5 * v * v + 1.1 * near) * (0.3 + 0.9 * spot * (0.4 + grain))) * (1.0 - 0.5 * vein) * (1.0 - 0.65 * frS(0.62, 0.8, spot));
  c *= (m.y < 0.0 ? 0.72 : 1.0) * (0.7 + 0.3 * frS(0.0, 0.02, ad));
  float rime = vein * 0.55 * frS(0.3, 0.65, grain) + (0.15 + 0.6 * frS(-0.030, 0.0, e)) * frS(0.45, 0.75, grain);
  c = mix(c, ice * 0.75, rime) + ice * 0.6 * exp(-abs(e) * 420.0);
  col = mix(col, c, frS(px, -px, e) * frS(1.0, 1.0 - 2.0 * px, u));
  vec2 n = frEdge(m, e, u, 4.0, 1.35, px);
  return mix(col, ice * (0.75 + (40.0 - 25.0 * frThick) * max(e + 0.004, 0.0)) + n.y * (0.3 + 1.8 * uHigh) * (1.0 - frThick), n.x);
}

vec3 frGrass(vec2 p, float px, float X) {
  vec2 sun = vec2(-0.4 * X, 0.14);
  float warm = 0.7 + 0.4 * uLow * (0.5 + uEnergy) + 0.7 * uCue + 0.25 * uMic;
  float sr = frSq((p.x - sun.x) * 0.8) + frSq(p.y - sun.y), near = exp(-sr / 0.1);
  vec3 gold = vec3(1.0, 0.66, 0.36);
  vec3 col = mix(vec3(0.34, 0.5, 0.58), vec3(0.06, 0.15, 0.31), frS(0.0, 0.58, p.y));
  if (frHour > 0.0) {
  col = mix(col, mix(mix(frH * 0.95, frD * 0.18, frS(0.0, 0.5, p.y)), frH * mix(1.5, 1.0, frS(0.0, 0.58, p.y)), frDay), frHour);
  gold = mix(gold, frH * 1.4 + 0.1, 0.7 * (frHour));
  }
  col = mix(col, gold * 0.95, min(warm, 1.3) * (0.55 * exp(-sr / 0.03) + (0.2 + 0.3 * uSpace) * exp(-sr / 0.16)));
  float trees = p.y - 0.045 - 0.03 * (1.0 + sin(p.x * 4.1 + 2.0)) - 0.015 * sin(p.x * 11.0) - 0.006 * sin(p.x * 31.0);
  col = mix(col, mix(mix(vec3(0.07, 0.14, 0.21), frH * vec3(0.5, 0.56, 0.6), frDay), gold * 0.45, 0.8 * exp(-sr / 0.05)), 0.8 * frS(0.035, -0.035, trees));
  vec3 field = mix(vec3(0.2, 0.31, 0.38), vec3(0.010, 0.028, 0.045), frS(0.0, -0.46, p.y));
  if (frHour > 0.0) field = mix(field, mix(frH * 1.15, frH * vec3(0.5, 0.55, 0.55), frS(0.0, -0.46, p.y)) * frDay + mix(frH * 0.4, frD * 0.06, frS(0.0, -0.4, p.y)) * frDusk, frHour);
  field = mix(field, gold * 0.5, 0.65 * exp(-frSq((p.x - sun.x) / 0.35) - frSq((p.y + 0.02) / 0.12)));
  col = mix(col, field, frS(0.02, -0.06, p.y + 0.02 + 0.01 * sin(p.x * 5.0)));
  col = mix(col, frPlain(p), frBlank);
  col += mix(vec3(1.0, 0.75, 0.45), frH * 1.4, frDusk) * warm * (1.6 * exp(-sr / 0.0030) + 0.5 * exp(-sr / 0.015)) * (1.0 - frBlank) * (1.0 - 0.6 * frDay);
  col += frLights(p) * (1.0 - 0.6 * frDay);
  near *= 1.0 - 0.75 * frBlank;
  for (int i = 0; i < 10; i++) {
  float f = float(i), r = 0.012 + 0.034 * frSq(fract(f * 0.713 + 0.2));
  vec2 c = vec2((fract(f * 0.618 + 0.1) - 0.5) * 1.9 * X, -0.45 + 0.44 * fract(f * 0.382 + 0.37 * fract(f * 0.27)));
  float d = length(p - c);
  if (d > r) continue;
  float g = sat(1.0 - 1.4 * abs(c.x - sun.x)), b = frS(r, r - 0.007, d) * (0.6 + 0.5 * frS(0.4 * r, r, d));
  col += (1.0 - 0.8 * frBlank) * mix(vec3(0.35, 0.6, 0.85), vec3(1.0, 0.68, 0.36), g) * b * (0.1 + 0.16 * g + 0.22 * uBands[i + 3] * (0.4 + uEnergy)) * (0.75 + 0.25 * sin(uTime * 0.23 + f * 2.4));
  }
  float y = p.y + 0.6;
  for (int i = 0; i < 4; i++) {
  float f = float(i), h = fract(f * 0.618 + 0.3), top = 0.5 + 0.45 * fract(f * 0.382 + 0.6);
  float at = (-0.85 + 0.42 * f + 0.1 * h) * X + (h - 0.5) * 0.55 * y * (1.0 + y) + 0.006 * sin(uTime * 0.2 + f) * y;
  float a = frS(0.016, -0.012, abs(p.x - at) - 0.014 * sat(1.0 - y / top)) * frS(top, top - 0.2, y);
  col = mix(col, mix(vec3(0.03, 0.065, 0.07), frH * 0.35, frDay) + gold * 0.3 * warm * near * near, 0.75 * a * (1.0 - frBlank));
  }
  vec3 at[3] = vec3[3](vec3(-9.0), vec3(-9.0), vec3(-9.0));
  vec2 lm = vec2(-9.0), stir = 0.010 * vec2(sin(uTime * 0.31), cos(uTime * 0.31));
  int blades = uOwn[0] < 0.0 ? 24 : 12;
  float wider = 0.028 * (1.0 + 1.4 * max(uOwn[2], 0.0)) * (1.0 + 0.6 * max(uOwn[0], 0.0));
  for (int k = 0; k < blades; k++) {
  vec4 A = FR_C[k % 12], B = frDof(k);
  if (k > 11) {
    if (k == 16) continue;
    A.x = 0.17 - A.x; A.z = -A.z;
  }
  if (frBed + frStar > 0.0 && k != 4) {
    A.x = mix(A.x, (fract(float(k) * 0.618 + 0.45) - 0.5) * 2.1, frBed * 0.8);
    A.zw = mix(A.zw, frStar > 0.0 ? vec2(0.66, 0.75) : vec2(0.25 * (fract(float(k) * 0.37) - 0.5), 1.0), frBed + frStar);
    A.zw = normalize(A.zw);
    B.x = mix(B.x, -0.75 * abs(B.x), frStar); A.x -= 0.3 * frStar;
  }
  vec2 q = p - vec2(A.x * X, A.y), t;
  if (k == 4) q -= vec2(0.7, 0.1) * (1.0 - min(X, 1.0)) + vec2(0.95, 0.2) * min(frBed + frStar + frBlank, 1.0);
  q = vec2(dot(A.zw, q), A.z * q.y - A.w * q.x);
  q.y -= dot(stir, A.zw) * q.x;
  vec2 m = frBend(q, B.x, frAside(q.x, B.x), t);
  float v = m.x / B.w, e = abs(m.y) - B.y * sat(1.0 - v) * (1.0 + 0.5 * v);
  if (k == 4) { lm = m; continue; }
  if (e > wider || v < -0.05 || v > 1.06) continue;
  at[0] = at[1]; at[1] = at[2]; at[2] = vec3(m, float(k));
  }
  col = frLeaf(col, p, lm, near, warm, px);
  for (int j = 0; j < 3; j++) {
  if (at[j].z < 0.0) continue;
  vec2 m = at[j].xy;
  float fk = at[j].z;
  vec4 B = frDof(int(fk));
  float u = m.x / B.w, v = sat(u), w = B.y * (1.0 - v) * (1.0 + 0.5 * v), e = abs(m.y) - w, x = m.y / max(w, 1e-3);
  vec3 sound = frSound(B.z, v);
  float run = uHits * exp(-frSq((u - 0.98 + 0.55 * uHits) / 0.14)) * frS(0.4, 0.9, cos(uTime * 0.05 + fk * 1.885));
  vec3 ice = frIce(p, near, warm, sound, uKind[int(B.z)]) + run * (vec3(1.5, 1.7, 1.9) + uKind[4]);
  float fold = frS(-0.12, 0.12, x * sign(B.x)), grain = frGrain(p);
  vec3 c = mix(vec3(0.012, 0.040, 0.040), vec3(0.42, 0.4, 0.1) * warm, near * (0.3 + 0.7 * fold)) * (0.88 + 0.17 * cos(x * 16.0)) * (0.6 + 0.8 * fold) + sound * 0.1;
  if (frThick + frDay > 0.0) {
    vec3 h2 = uKind[int(B.z)] * uKind[int(B.z)];
    c = mix(c, (0.08 + h2 * 0.5) * (0.5 + 0.7 * fold), 0.5 * frDay);
    c = mix(c, h2 * (0.12 + 0.5 * fold + 1.1 * near * warm * (0.4 + 0.6 * fold)) * (0.88 + 0.17 * cos(x * 16.0)) * mix(1.0, 1.6, frDay) + sound * 0.5, frLive);
    c = mix(c, vec3(0.008) + frD * 0.03 + sound * 0.25, frInk);
  }
  float rime = (1.0 - 0.8 * frThick) * frS(0.45, 1.0, abs(x)) * (0.3 + 0.6 * grain) + 0.5 * (1.0 - frThick) * frS(0.6, 0.78, grain);
  c = mix(c, ice * 0.75, rime) + ice * 0.6 * (1.0 - 0.8 * frDay) * exp(-abs(e) * 420.0);
  col = mix(col, c, frS(px, -px, e) * frS(1.0, 1.0 - 2.0 * px, u));
  vec2 n = frEdge(m, e, u, fk, 1.0, px) * vec2(1.0, 0.3 + 1.8 * uHigh + uKeys);
  col = mix(col, ice * (0.75 + (40.0 - 25.0 * frThick) * max(e + 0.004, 0.0)) + n.y * (1.0 - frThick), n.x);
  col += run * exp(-max(e, 0.0) * 60.0) * 0.25 * vec3(0.7, 0.85, 1.0) * step(0.0, u);
  }
  vec2 n = p - vec2(-0.98 * X, -0.6);
  float na = abs(n.y - 0.95 * n.x + 0.5 * n.x * n.x) - 0.028 * sat(1.0 - n.x / 0.62);
  col = mix(col, vec3(0.02, 0.05, 0.055) + gold * 0.1 * warm * near, 0.8 * (1.0 - frBlank) * (1.0 - frDay) * frS(0.035, -0.02, na) * frS(0.66, 0.4, n.x));
  return screenOf(col);
}
vec3 frSnow(vec3 col, vec2 p) {
  int n = uOwn[7] > 0.0 ? 4 : 0;
  for (int i = 0; i < n; i++) {
  float f = float(i), z = 5.0 + 4.5 * f, v = 0.05 + 0.02 * f;
  vec2 w = p * z + vec2(0.25 * sin(uTime * 0.13 + f * 2.0) + 3.0 * f + 0.2 * sin(p.y * 4.0 + f + uTime * 0.2), uTime * (3.6 + 0.6 * f) * v * 2.0), c = floor(w);
  c.y = mod(c.y, 512.0);
  vec2 h = hash22(c + f * 17.0);
  float r = (0.06 + 0.17 * h.y * h.y) * (f < 0.5 ? 1.3 : 1.0), d = length(fract(w) - 0.5 - 0.5 * (h - 0.5));
  float a = frS(r, r * (f < 0.5 ? 0.1 : 0.45), d) * step(h.x, 0.42) * mix(0.35, 0.8, f / 3.0) * uOwn[7];
  col = mix(col, mix(vec3(0.95, 0.96, 0.97), vec3(1.0), frDay) * (0.75 + 0.25 * uLevel), a);
  }
  return col;
}
vec3 frDrops(vec3 col, vec2 p) {
  int n = uOwn[7] < 0.0 ? 2 : 0;
  for (int i = 0; i < n; i++) {
  vec2 w = p * (6.0 + 9.0 * float(i)) + float(i) * 7.3, c = floor(w), h = hash22(c + float(i) * 31.0);
  float r = max((0.1 + 0.34 * h.y * h.y) * step(h.x, 0.34), 1e-3);
  vec2 u = (fract(w) - 0.5 - (0.5 - r) * 1.4 * (hash22(c + 5.0) - 0.5)) / r * vec2(1.0, 0.9);
  float l = length(u), low = sat(0.5 - 0.7 * u.y);
  vec3 k = mix(frH, frD * 0.5, 0.5 - 0.5 * u.y) * (0.15 + 0.5 * frDusk + 0.7 * frDay) + (0.1 + 0.8 * low * low) * mix(vec3(0.5, 0.6, 0.7), uKind[int(h.x * 6.4) % 4], 0.5) * (0.35 + 0.65 * uLevel);
  k *= 1.0 - 0.75 * frS(0.6, 1.0, l) * (0.6 + 0.4 * u.y);
  u -= vec2(-0.35, 0.45);
  k += 0.9 * exp(-dot(u, u) * 22.0) * (0.7 + 0.5 * uHigh);
  col = mix(col, sqrt(sat(k)), -0.92 * uOwn[7] * frS(1.0, 0.86, l) * step(0.01, r));
  }
  return col;
}
vec3 render(vec2 p) {
  frBig = exp2(uOwn[0] * (uVar < 0.5 ? (uOwn[0] > 0.0 ? 0.75 : 0.9) : 1.3));
  frCurl = 1.0 + uOwn[1] * (uOwn[1] > 0.0 ? 1.6 : 1.0);
  frFull = uVar < 0.5 ? exp2(uOwn[2] * (uOwn[2] > 0.0 ? 0.7 : 1.7)) : 1.0 + uOwn[2] * (uOwn[2] > 0.0 ? 1.5 : 0.98);
  frDay = max(uOwn[3], 0.0); frDusk = max(-uOwn[3], 0.0); frStreet = max(uOwn[4], 0.0); frBlank = max(-uOwn[4], 0.0);
  frLive = max(uOwn[5], 0.0); frInk = max(-uOwn[5], 0.0); frBed = max(uOwn[6], 0.0); frStar = max(-uOwn[6], 0.0);
  frHour = frDay + frDusk; frThick = frLive + frInk;
  frH = uKind[4] * uKind[4]; frD = uKind[0] * uKind[0];
  float px = 1.0 / uRes.y, X = clamp(0.5 * uRes.x / uRes.y, 0.28, 1.2) / 0.89;
  vec3 col = uVar < 0.5 ? frWindow(p, px, X) : frGrass(p, px, X);
  return frDrops(frSnow(col, p), p);
}
