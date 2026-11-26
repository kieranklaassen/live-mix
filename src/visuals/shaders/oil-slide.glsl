// name: Oil slide
// a: Dye and oil
// b: Cells
// what: Fat cells of clear coloured oil pressed between two round glasses and thrown on a wall, bright at their rims, joining and parting in dark red and violet ink, soft towards the edge of the beam; or a foam of unlike cells in two dyes, some with a yolk of another, shrinking and darkening as it drains downward.
// follows: Low rocks the glass. Drone, pad, texture and phrase each have a dye that takes more room as they sound. The bands swell the small bubbles and make the foam pulse. The whole mix brightens the lamp. A hit is a tap: a red cell shows, a ring runs out, and it bursts into droplets. A cue tips the glass and lifts the lamp. Keys and a voice do a little too.
// A soft step that may also run downward.
float osStep(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
const vec3 OS_LAMP = vec3(1.0, 0.93, 0.8);
// A dye as how much it takes out of each colour of the light.
vec3 osTake(vec3 house, vec3 kind, float own) {
  vec3 k = kind / max(max(kind.r, max(kind.g, kind.b)), 0.05);
  return -log(clamp(mix(house, k * k * k, own), 0.012, 0.97));
}
vec3 osDye(int k) {
  if (k == 0) return osTake(vec3(0.01, 0.56, 0.68), uKind[0], 0.35);
  if (k == 1) return osTake(vec3(0.86, 0.03, 0.42), uKind[1], 0.3);
  if (k == 2) return osTake(vec3(1.0, 0.5, 0.02), uKind[2], 0.3);
  if (k == 3) return osTake(vec3(0.85, 0.86, 0.06), uKind[3], 0.35);
  return osTake(vec3(1.0, 0.1, 0.03), uKind[4], 0.4);
}
// Smooth joins that carry the slope along: xy is the slope, z the distance.
vec3 osMin(vec3 a, vec3 b, float k) { float h = sat(0.5 + 0.5 * (b.z - a.z) / k); return mix(b, a, h) - vec3(0.0, 0.0, k * h * (1.0 - h)); }
vec3 osMax(vec3 a, vec3 b, float k) { return -osMin(-a, -b, k); }
vec3 osBall(vec2 p, vec2 c, float r) { vec2 v = p - c; float l = sqrt(dot(v, v) + 0.0012); return vec3(v / l, l - r); }
// Where the finger taps, and what the tap does to the place p.
vec2 osTap;
vec2 osShiver(vec2 p) {
  if (uHits < 0.01) return vec2(0.0);
  vec2 v = p - osTap; float l = length(v) + 1e-3;
  float w = l - 0.62 * (1.0 - uHits);
  return v / l * uHits * (1.0 - uHits) * 0.07 * sin(w * 50.0) * exp(-w * w * 160.0) * osStep(0.0, 0.08, l);
}
vec2 osRock() {
  float c = sat(uCue), t = 4.0 * c * (1.0 - c);
  return (0.2 + 0.8 * uLow) * vec2(0.03 * sin(uTime * 0.41), 0.02 * sin(uTime * 0.33 + 1.0)) + t * vec2(0.045, -0.02);
}
// One lens of clear oil: x how much of it covers, y its dark rim, z the light it gathers.
vec3 osLens(vec2 v, float r, float b) {
  float l = length(v), d = l - r;
  float in_ = osStep(b, -b, d);
  float w = 0.06 * r + 0.8 * b;
  float rim = exp(-d * d / (w * w));
  vec2 s = (v + vec2(-0.32, 0.32) * r) / (0.36 * r + b);
  return vec3(in_, rim, exp(-dot(s, s)) * in_);
}
// Small bubbles on a turned grid: each listens to one band and to the piece at its place.
vec4 osBubbles(vec2 p, float n, float seed, float b) {
  vec2 g = rot(0.5 + seed) * p * n + seed * 17.0;
  vec2 id = floor(g), f = g - id - 0.5;
  float h = hash21(id + seed * 31.0);
  vec2 j = hash22(id + seed * 11.0) - 0.5;
  vec2 at = (id + 0.5 - seed * 17.0) * rot(0.5 + seed) / n;
  float here = piece(vec2(0.5 + at.x * 0.62, 0.5 - at.y)).a;
  float crowd = osStep(-0.1, 0.5, sin(dot(at, vec2(7.0, 4.0)) + seed * 5.0 + uTime * 0.03) * sin(dot(at, vec2(-5.0, 9.0)) + seed * 3.0));
  float loud = uBands[int(fract(h * 7.0) * 15.99)];
  float r = (0.02 + 0.26 * h * h * h * h) * crowd * osStep(0.35, 0.75, h + 0.25 * loud + 0.6 * here);
  r = min(r * (0.75 + 0.5 * loud + 0.5 * here), 0.4);
  j = j * (0.9 - 2.0 * r) + 0.04 * sin(uTime * (0.2 + 0.3 * h) + h * 40.0 + vec2(0.0, 1.7));
  r /= n;
  return r < 0.0012 ? vec4(0.0) : vec4(osLens(f / n - j / n, r, b) * osStep(0.0012, 0.003, r), fract(h * 23.0));
}
// What a tap leaves: a fat clear cell of the hit's dye that spreads and thins, and the droplets it bursts into.
void osTapped(vec2 p, float b, inout vec3 take, inout vec3 bu) {
  if (uHits < 0.01) return;
  float go = 1.0 - uHits, born = osStep(1.0, 0.8, uHits) * osStep(0.0, 0.25, uHits);
  vec3 o = vec3(0.0), ink = osDye(4) * 0.8;
  vec2 v = p - osTap;
  for (int i = 0; i < 9; i++) {
    float h = hash11(float(i) + 3.0), a = (float(i) + 0.7 * h) * TAU / 9.0;
    vec2 c = vec2(cos(a), sin(a)) * (0.05 + (0.05 + 0.2 * h) * go);
    o = max(o, osLens(v - c, (0.012 + 0.022 * hash11(h * 9.0)) * (0.3 + 0.7 * uHits), b));
  }
  o *= born;
  vec3 st = osLens(v, 0.12 + 0.07 * go, b + 0.03 * go) * uHits * uHits;
  take = mix(take, ink, o.x);
  take = mix(take, take * 0.4 + ink, st.x);
  bu = max(max(bu, o), st * vec3(1.0, 0.7, 0.12));
}
// What the beam leaves on the wall outside the round glass.
vec3 osWall(vec2 p, float out_, vec3 spill) {
  float grain = 0.85 + 0.3 * noise(p * 90.0) * noise(p * 13.0);
  return (spill * 0.035 * exp(-out_ * 7.0) + vec3(0.0045, 0.0038, 0.005)) * grain;
}
// The lamp's light as the screen shows it: deep colours stay deep.
vec3 osShow(vec3 c) { return pow(1.0 - exp(-max(c, 0.0)), vec3(0.4545)); }
// The light of a tap, and the ring that runs out from it.
float osGlow(vec2 q) { vec2 v = q - osTap; return uHits * (0.6 + 0.9 * uEnergy) * exp(-dot(v, v) * 34.0); }
float osRing(vec2 q) { float d = length(q - osTap) - 0.06 - 0.6 * (1.0 - uHits); return uHits * (0.6 + 0.9 * uEnergy) * exp(-d * d * 1100.0); }
vec3 osOils(vec2 p) {
  vec2 mid = vec2(0.06, -0.02); float R = 0.66;
  float rr = length(p - mid);
  vec3 wall_ = rr > R - 0.05 ? osWall(p, max(rr - R, 0.0), exp(-osDye(1) * 0.4) * (0.4 + uLevel)) : vec3(0.0);
  if (rr > R + 0.04) return osShow(wall_);
  float soft = osStep(0.33, 0.7, rr);
  float b = 1.0 / uRes.y + mix(0.0014, 0.0, uTone) + 0.012 * soft * soft * (0.5 + uSpace);
  vec2 q = p + osShiver(p) - osRock();
  vec2 w = q + 0.045 * sin(q.yx * vec2(6.0, 7.0) + vec2(uTime * 0.09, 2.0 - uTime * 0.07)) + 0.016 * sin(q.yx * vec2(17.0, 14.0) + vec2(3.0 - uTime * 0.11, uTime * 0.13));
  float level[4] = float[4](uDrone, uPad, uTexture, uPhrase);
  vec3 dye[4];
  for (int i = 0; i < 4; i++) dye[i] = osDye(i);
  // the big cells of each dye
  vec3 f[4];
  vec3 glass = vec3((p - mid) / max(rr, 1e-3), rr - R + 0.02);
  for (int k = 0; k < 4; k++) {
    vec3 d = vec3(0.0, 1.0, 9.0);
    float size = k == 0 ? 0.21 : k == 1 ? 0.175 : k == 2 ? 0.14 : 0.1;
    for (int i = 0; i < 4; i++) {
      float n = float(k * 4 + i);
      vec2 h = vec2(fract(n * 0.7549 + 0.13), fract(n * 0.5698 + 0.31));
      vec2 c = (h - 0.5) * vec2(1.3, 1.0) + mid;
      vec2 sway = sin(uTime * (0.03 + 0.05 * h.yx) + n * vec2(2.4, 1.7));
      c += 0.1 * sway;
      float r = size * (0.55 + 0.75 * fract(n * 0.618)) * (0.84 + 0.42 * level[k]) * (1.0 + 0.06 * sway.x * sway.y);
      d = osMin(d, osBall(w, c, r), 0.12);
    }
    f[k] = osMax(d, glass, 0.03);
  }
  // slow streaks in the dye
  vec2 s = w * 4.0 + vec2(0.0, uTime * 0.011);
  float streak = osStep(0.1, 0.9, noise(s + 2.4 * vec2(noise(s * 1.4 + 4.0), 0.5 + 0.4 * sin(s.x * 1.3 - s.y * 0.9))));
  float thread = 1.0 - sat(abs(streak - 0.45) * 7.0); thread *= thread;
  // the water between them: a dense ink, violet into wine
  vec3 take = mix(vec3(3.4, 4.6, 1.5), vec3(1.35, 4.8, 3.6), osStep(-0.45, 0.6, sin(2.4 * w.x + 1.2 * w.y + 2.2 + 0.4 * sin(uTime * 0.021)))) * (0.95 + 1.5 * streak) * (1.0 - 0.5 * thread);
  vec3 f01 = osMin(f[0], f[1], 0.04), f23 = osMin(f[2], f[3], 0.04);
  vec3 d = vec3(0.0, 1.0, 9.0); int k = 0;
  for (int i = 0; i < 4; i++) {
    vec3 other = osMin(i < 2 ? f[1 - i] : f[5 - i], i < 2 ? f23 : f01, 0.04);
    // two dyes never mix: each pushes the other back and a seam of water stays between
    vec3 di = osMax(f[i], 0.5 * (f[i] - other) + vec3(0.0, 0.0, 0.006), 0.04);
    di.z /= clamp(length(di.xy), 0.4, 1.0);       // a small cell squeezed between others keeps a clean edge
    take = mix(take, dye[i] * 0.6, osStep(b, -b, di.z));
    if (di.z < d.z) { d = di; k = i; }
  }
  float in_ = osStep(b, -b, d.z), deep = max(-d.z, 0.0);
  float side = dot(d.xy, vec2(-0.6, 0.8));
  float thick = 0.45 + (1.0 - exp(-deep * 60.0)) * (0.1 + 1.4 * streak + 0.25 * thread) * (0.8 + 0.4 * level[k]);
  thick *= 1.0 + 0.5 * side * exp(-deep * 9.0);
  // where the dye is thick it turns: blue in the turquoise, violet in the magenta, red in the amber, green in the yellow
  vec3 turn = k == 0 ? vec3(0.9, 0.9, 0.0) : k == 1 ? vec3(1.1, 0.1, 0.0) : k == 2 ? vec3(0.0, 1.5, 0.5) : vec3(1.3, 0.1, 0.1);
  float vein = osStep(0.35, 1.0, streak) * (1.0 - exp(-deep * 26.0));
  take = mix(take, dye[k] * thick + turn * vein, in_);
  // the rim bends the light away outside and gathers it inside, a hair apart for each colour
  float wr = 0.0012 + 0.75 * b;
  vec3 e = vec3(d.z) + vec3(-0.0018, 0.0, 0.0018);
  float light = 1.0 - 0.8 * exp(-d.z * d.z / (wr * wr));
  vec3 g = (e + 2.4 * wr) / (wr * 0.9); float g2 = (d.z + 0.017 + 0.014 * streak) / 0.006;
  vec3 fringe = exp(-g * g) * (0.45 + 1.1 * sat(0.3 - side)) * (0.0045 / (wr + 0.001));
  float gather = exp(-g2 * g2) * sat(0.1 - side) * 0.8;
  // the upper glass carries two thin veils of dye, out of focus, that lie over everything
  vec2 u = p + 1.6 * osRock() + 0.05 * sin(p.yx * 5.0 + uTime * vec2(0.05, 0.06));
  float v1 = length(u - vec2(-0.26, -0.2) - 0.08 * sin(uTime * vec2(0.037, 0.029))) - 0.3 - 0.06 * uKeys;
  float v2 = length(u - vec2(0.42, 0.16) - 0.08 * sin(uTime * vec2(0.031, 0.041) + 2.0)) - 0.27 - 0.06 * uMic;
  take += dye[2] * 0.5 * osStep(0.014, -0.014, v1) * (0.5 + 0.5 * osStep(0.0, -0.2, v1));
  take += dye[0] * 0.34 * osStep(0.014, -0.014, v2) * (0.5 + 0.5 * osStep(0.0, -0.2, v2));
  light *= (1.0 + 0.35 * exp(-v1 * v1 * 4000.0)) * (1.0 + 0.35 * exp(-v2 * v2 * 4000.0));
  // droplets of other dye, then bubbles of air: their rims are dark and their middles gather the lamp
  vec4 dr = osBubbles(q + 0.3, 6.0, 1.0, b);
  take = mix(take, take * 0.3 + dye[int(dr.w * 3.99)] * 0.7, dr.x);
  vec3 bu = osBubbles(q, 17.0, 2.0, b).xyz;
  take = mix(take, take * 0.25, bu.x);
  bu = max(bu, dr.xyz);
  osTapped(q, b, take, bu);
  light *= 1.0 - 0.75 * bu.y;
  vec3 tint = exp(-take * 1.5);
  // the lamp: hot above and left of the middle, falling off to the rim
  vec2 l = p - vec2(-0.1, 0.1);
  float hot = exp(-dot(l, l) * 3.2);
  vec3 lamp = OS_LAMP * (0.28 + 1.5 * hot) * (0.85 + (0.2 + 0.35 * uEnergy) * uLevel + 0.3 * uCue);
  vec3 col = tint * light * (1.0 + gather) + (tint * 0.7 + 0.12) * (fringe * 0.9 + bu.z * 1.1);
  col *= lamp * (1.0 + 1.2 * osRing(q) + 0.9 * osGlow(q));
  // the edge of the glass, out of focus, and the dark wall
  float edge = osStep(0.016, -0.03, rr - R);
  col *= edge * mix(1.0, 0.5, osStep(0.3, 0.66, rr));
  float lip = (rr - R + 0.004) / 0.01;
  col += lamp * 0.1 * exp(-lip * lip) * (tint + 0.1);
  return osShow(col * 1.9 + wall_ * (1.0 - edge));
}
// A swing to and fro, once a turn.
vec4 osSway(vec4 x) { x = abs(fract(x) * 2.0 - 1.0); return x * x * (6.0 - 4.0 * x) - 1.0; }
vec4 osHash(vec4 x, vec4 y) { x = fract(x * 123.34); y = fract(y * 456.21); vec4 d = x * (x + 45.32) + y * (y + 45.32); return fract((x + d) * (y + d)); }
vec3 osFoam(vec2 p) {
  vec2 mid = vec2(-0.12, 0.2); float R = 0.71;
  float rr = length(p - mid);
  vec3 wall_ = rr > R - 0.05 ? osWall(p, max(rr - R, 0.0), vec3(0.5, 0.42, 0.5) * (0.4 + uLevel)) : vec3(0.0);
  if (rr > R + 0.04) return osShow(wall_);
  float soft = osStep(0.35, 0.74, rr);
  float b = 1.0 / uRes.y + mix(0.0015, 0.0004, uTone) + 0.008 * soft * soft * (0.5 + uSpace);
  vec2 q = p + osShiver(p) - 0.6 * osRock();
  vec2 z = q + 0.02 * sin(q.yx * 6.0 + uTime * vec2(0.08, -0.06)) - vec2(0.3, -0.92);
  float far = max(length(z), 0.05);
  const float N = 8.5;
  float scale = far / N;                          // the size of a cell here: they shrink as they drain
  vec2 g = vec2(log(far), atan(z.x, z.y)) * N;
  g.x += mod(uTravel * 0.03 + uTime * 0.02, 289.0);
  // sixteen cells round about, four at a time: where each one's middle is, how big it is and its own number
  vec2 base = floor(g - 0.5), mine = vec2(0.0);
  vec4 X[4], Y[4], M[4], H[4];
  float best = 9.0, big = 0.0, self = 0.0;
  vec4 cx = base.x + vec4(-1.0, 0.0, 1.0, 2.0), hx = mod(cx, 289.0);
  for (int j = 0; j < 4; j++) {
    float cy = base.y - 1.0 + float(j);
    vec4 hy = vec4(cy + 40.0), h1 = osHash(hx, hy), h2 = osHash(hx + h1 + 17.3, hy + h1 + 17.3);
    vec4 hear = vec4(uBands[int(h2.x * 15.99)], uBands[int(h2.y * 15.99)], uBands[int(h2.z * 15.99)], uBands[int(h2.w * 15.99)]);
    X[j] = cx - g.x + 0.5 + (h1 - 0.5) * 0.85 + 0.06 * osSway(uTime * (0.03 + 0.03 * h1) + h2 * 6.0);
    Y[j] = cy - g.y + 0.5 + (h2 - 0.5) * 0.85 + 0.06 * osSway(uTime * (0.03 + 0.03 * h2) + h1 * 6.0);
    vec4 size = 0.55 * h1 * h1 * h1 + (0.02 + 0.07 * hear) * osSway(uTime * 0.11 + h2 * 5.0);
    H[j] = h2;
    M[j] = X[j] * X[j] + Y[j] * Y[j] - size;
    for (int i = 0; i < 4; i++) if (M[j][i] < best) { best = M[j][i]; mine = vec2(X[j][i], Y[j][i]); big = size[i]; self = h2[i]; }
  }
  float e = -1.0, own = 0.0, sum = 0.0; vec2 v = vec2(0.0);
  for (int j = 0; j < 4; j++) {
    vec4 x = exp((best - M[j]) * 4.5), ww = x * x * x;
    own += dot(ww, H[j]); sum += dot(ww, vec4(1.0)); e += dot(x, vec4(1.0));
    v -= vec2(dot(ww, X[j]), dot(ww, Y[j]));
  }
  own /= sum; v /= sum;
  e = -log(max(e, 1e-6)) / 9.0;
  // dry and thin walled up by the lamp, wet and round below
  float wet = osStep(1.35, 0.45, far);
  float wall = (0.015 + 0.11 * wet) * (1.15 - 0.5 * uLevel);
  float d = (wall - e) * scale;                   // below 0 is inside the cell
  float in_ = osStep(b, -b, d), deep = max(-d, 0.0) / scale;
  // the two dyes run slowly behind the foam, and every cell bends what is behind it
  vec2 bend = v * scale * 0.9 * in_;
  vec2 s = (q + bend) * 2.1 + vec2(uTime * 0.008, 4.0 - uTime * 0.011);
  float flow = noise(s + 1.7 * noise(s * 0.9 + 3.0)), m1 = flow - 0.5 + 0.1 * (uPad + uPhrase - uDrone - uTexture) + 0.5 * in_ * (own - 0.5);
  float two = osStep(-0.08, 0.08, m1);
  vec3 dA = osDye(0) + vec3(0.5, 0.55, 0.0), dB = osDye(1);
  vec3 dye = mix(dA, dB, two);
  vec3 turn = mix(vec3(0.9, 0.5, 0.0), vec3(0.8, 0.2, 0.0), two) * osStep(0.35, 0.8, own + 1.2 * abs(flow - 0.5));
  // some cells hold a yolk of another dye, sunk towards the drain
  float rich = fract(self * 5.0 + 0.2), level = rich < 0.5 ? uTexture : uPhrase;
  float yr = (0.1 + 0.28 * osStep(0.35, 0.9, self) + 0.2 * level + 0.08 * uKeys) * osStep(0.3, 0.42, self) * osStep(0.02, 0.12, big);
  float yolk = -smin(yr - length(mine + vec2(-0.1, 0.0)), e - wall - 0.06, 0.09) * scale;
  float thin = (0.3 + 1.8 * own * own + 1.6 * abs(flow - 0.5)) * (0.75 + 1.3 * length(v)) * (1.0 + 0.5 * dot(v, vec2(-0.7, 0.4)));
  vec3 take = mix((dye * (2.4 + 1.5 * wet) + 0.5 + 1.4 * wet) * (0.55 + 0.9 * flow), dye * (thin + 1.2 * exp(-deep * 26.0)) + turn * (1.0 - exp(-deep * 45.0)), in_);
  float yon = in_ * osStep(0.05, 0.09, yr), yin = osStep(b, -b, yolk) * yon;
  if (yin > 0.0) take = mix(take, dye * 0.12 + osDye(rich < 0.5 ? 2 : 3) * (0.3 + 1.2 * rich), yin);
  float wr = 0.0012 + 0.75 * b;
  float side = dot(v, vec2(0.6, -0.8));
  float light = (1.0 - 0.75 * exp(-d * d / (wr * wr))) * (1.0 - 0.6 * yon * exp(-yolk * yolk / (wr * wr)));
  vec3 e3 = vec3(-0.0012, 0.0, 0.0012) + 2.4 * wr;
  vec3 gg = (d + e3) / wr; float gy = yolk / wr + 2.4;
  vec3 fringe = exp(-gg * gg) * (0.35 + sat(0.3 + 1.6 * side)) + 0.9 * yon * exp(-gy * gy) * sat(0.5 + side);
  float g2 = (deep - 0.1) / 0.05;
  float gather = exp(-g2 * g2) * sat(side * 1.6) * in_;
  vec3 bu = osBubbles(q, 17.0, 3.0, b).xyz;
  take = mix(take, take * 0.3, bu.x);
  osTapped(q, b, take, bu);
  light *= 1.0 - 0.75 * bu.y;
  vec3 tint = exp(-take * 1.3);
  vec2 l = p - vec2(-0.2, 0.2);
  vec3 lamp = OS_LAMP * (0.2 + 1.8 * exp(-dot(l, l) * 3.4)) * (0.85 + (0.2 + 0.35 * uEnergy) * uLevel + 0.3 * uCue + 0.2 * uMic);
  vec3 col = tint * light * (1.0 + 0.8 * gather) + tint * 1.1 * fringe + (tint * 0.7 + 0.12) * bu.z;
  col *= lamp * (1.0 + 1.2 * osRing(q) + 0.9 * osGlow(q));
  float edge = osStep(0.012, -0.025, rr - R);
  col *= edge;
  float lip = (rr - R + 0.004) / 0.008;
  col += lamp * 0.12 * exp(-lip * lip) * (tint + 0.1);
  return osShow(col * 1.8 + wall_ * (1.0 - edge));
}
vec3 render(vec2 p) {
  osTap = vec2(0.26 * sin(uTime * 0.071 + 1.0), 0.16 * sin(uTime * 0.053));
  return uVar < 0.5 ? osOils(p) : osFoam(p);
}
