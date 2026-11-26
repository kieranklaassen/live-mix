// name: Dabs
// a: Quay
// b: Orchard
// what: A still harbour at a late hour, painted on pale board in small separate dabs of unmixed colour: two masts and a dark hull moored at the right, its image in the water, houses and a light tower far off; or an orchard on a slope, round trees with a ladder, blue and violet shadows lying down the grass.
// follows: Each kind dyes and fattens the dabs of its part: pads the sky, drones the boats or the shadows, textures the water or the grass, phrases the gleam or the leaves. Bands lift the light and the piece colours water and grass. A hit pales the dabs in one soft circle, a cue sends a gleam over. The loop leans from cool to warm; keys brighten odd dabs.
// What the scene says of one place: two pigments in the light, two in the shade, and an odd one out (and how many dabs
// take it); how much light; and how strongly which sound dyes it.
vec3 dqL1, dqL2, dqS1, dqS2, dqK, dqDye;
float dqLit, dqOdd, dqAmt;
void dqSet(vec3 l1, vec3 l2, vec3 s1, vec3 s2, vec3 k, float odd, float lit) { dqL1 = l1; dqL2 = l2; dqS1 = s1; dqS2 = s2; dqK = k; dqOdd = odd; dqLit = lit; }
void dqBy(vec3 dye, float amt) { dqDye = dye; dqAmt = amt; }
float dqBar(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; return length(p - a - d * sat(dot(p - a, d) / dot(d, d))); }

float dqFall(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); }
const float dqHz = 0.09, dqWl = -0.17;   // the far water's edge, and where the hulls meet the water
float dqBow(vec2 q) { float u = sat((q.y - dqWl) / 0.23); return q.x - 0.215 + 0.15 * sqrt(u); }
float dqRail(float x) { float u = max(x - 0.08, 0.0); return 0.06 - 0.17 * u + 0.12 * u * u; }
// What stands over the water, nearest first: q is the place among the hulls, f among the far things.
void dqOver(vec2 q, vec2 f) {
  if (q.x > 0.0 && q.y > dqWl) {
    dqBy(uKind[0], uDrone);
    // the near hull: its bow flares to the left, its side runs out of the picture
    float bow = dqBow(q), d = dqRail(q.x) - q.y;
    if (bow > 0.0 && d > 0.0) {
      if (d < 0.02) dqSet(vec3(1.0, 0.86, 0.58), vec3(0.99, 0.70, 0.42), vec3(0.56, 0.48, 0.74), vec3(0.5, 0.3, 0.5), vec3(1.0, 0.97, 0.9), 0.1, 0.85);
      else if (d > 0.05 && d < 0.066) dqSet(vec3(1.0, 0.94, 0.80), vec3(0.90, 0.84, 0.90), vec3(0.66, 0.70, 0.90), vec3(0.8, 0.7, 0.8), vec3(1.0, 0.97, 0.9), 0.1, 0.65);
      else if (q.y < dqWl + 0.04) dqSet(vec3(0.96, 0.46, 0.22), vec3(0.90, 0.26, 0.18), vec3(0.60, 0.12, 0.26), vec3(0.34, 0.14, 0.42), vec3(0.1, 0.5, 0.5), 0.1, 0.5);
      else dqSet(vec3(0.94, 0.48, 0.28), vec3(0.40, 0.44, 0.80), vec3(0.16, 0.18, 0.50), vec3(0.36, 0.14, 0.42), vec3(0.06, 0.42, 0.52), 0.14, 0.10 + 0.3 * dqFall(0.14, 0.0, bow));
      return;
    }
    // masts and a tan sail furled on its boom: warm on the side of the light, blue on the other
    float m1 = q.x - 0.45, m2 = q.x - 0.72, m3 = q.x - 1.04;
    float m = abs(m1) < 0.0175 - 0.008 * q.y ? m1 : abs(m2) < 0.014 - 0.006 * q.y ? m2 : abs(m3) < 0.015 ? m3 : 9.0;
    if (m < 1.0) { dqSet(vec3(1.0, 0.68, 0.34), vec3(0.94, 0.50, 0.28), vec3(0.22, 0.22, 0.54), vec3(0.42, 0.20, 0.42), vec3(0.2, 0.5, 0.6), 0.06, 0.5 - 70.0 * m); return; }
    float u = q.y - 0.118 - 0.13 * (q.x - 0.47), w = 0.030 * dqFall(1.02, 0.94, q.x) + 0.006 * sin(q.x * 34.0);
    if (q.x > 0.47 && abs(u) < w) { dqSet(vec3(0.97, 0.66, 0.36), vec3(0.95, 0.80, 0.52), vec3(0.62, 0.30, 0.34), vec3(0.42, 0.28, 0.54), vec3(0.2, 0.56, 0.6), 0.06, 0.5 + 18.0 * u + 0.25 * sin(q.x * 68.0)); return; }
    // the deckhouse, with its windows
    if (q.x > 0.56 && q.x < 0.90 && q.y < 0.062) {
      float win = step(abs(fract((q.x - 0.56) / 0.085) - 0.5), 0.28) * step(abs(q.y - 0.022), 0.017);
      if (win > 0.5 || q.y > 0.05) dqSet(vec3(0.56, 0.72, 0.80), vec3(0.98, 0.80, 0.50), vec3(0.16, 0.34, 0.56), vec3(0.34, 0.24, 0.54), vec3(0.1, 0.5, 0.5), 0.06, 0.14);
      else dqSet(vec3(1.0, 0.82, 0.52), vec3(0.98, 0.66, 0.40), vec3(0.70, 0.56, 0.78), vec3(0.6, 0.6, 0.84), vec3(1.0, 0.94, 0.8), 0.1, 0.82);
      return;
    }
    // the hull behind, green, with a pale rail
    float r2 = 0.115 - 0.10 * max(q.x - 0.28, 0.0);
    if (q.x > 0.36 - 0.12 * sqrt(sat((q.y - dqWl) / 0.3)) && q.y < r2) {
      if (q.y > r2 - 0.02) dqSet(vec3(1.0, 0.93, 0.78), vec3(1.0, 0.80, 0.54), vec3(0.62, 0.60, 0.84), vec3(0.72, 0.62, 0.8), vec3(0.95, 0.60, 0.40), 0.1, 0.8);
      else dqSet(vec3(0.34, 0.68, 0.60), vec3(0.66, 0.76, 0.48), vec3(0.08, 0.40, 0.52), vec3(0.18, 0.30, 0.58), vec3(0.95, 0.60, 0.30), 0.08, 0.45);
      return;
    }
  }
  dqBy(uKind[1], uPad);
  float h = f.y - dqHz;
  if (h < 0.0) { dqSet(vec3(0.96, 0.84, 0.66), vec3(0.72, 0.82, 0.82), vec3(0.40, 0.62, 0.82), vec3(0.56, 0.54, 0.82), vec3(0.36, 0.70, 0.66), 0.13, 0.3); return; }
  if (h < 0.2) {
    // a light tower at the end of the mole, houses along it, a sail, a far hill
    float tw = f.x + 0.19, wide = 0.023 - 0.055 * h;
    if (h < 0.165 && abs(tw) < wide) {
      if (h > 0.138) dqSet(vec3(0.96, 0.46, 0.24), vec3(0.98, 0.62, 0.30), vec3(0.56, 0.20, 0.36), vec3(0.40, 0.26, 0.56), vec3(1.0, 0.9, 0.6), 0.1, 0.6 - 20.0 * tw);
      else dqSet(vec3(1.0, 0.94, 0.76), vec3(1.0, 0.80, 0.50), vec3(0.42, 0.46, 0.78), vec3(0.56, 0.42, 0.68), vec3(0.98, 0.9, 0.8), 0.05, 0.42 - 28.0 * tw);
      return;
    }
    float bx = f.x * 11.0, bh = hash11(floor(bx) + 9.0), by = fract(bx);
    float wall = 0.02 + 0.03 * bh, gable = wall + 0.022 * (1.0 - abs(2.0 * by - 1.0) * 0.7);
    float there = step(f.x, -0.272) * step(bh, 0.86);
    if (there > 0.5 && h < gable && h > 0.006) {
      if (h > wall) dqSet(vec3(0.96, 0.50, 0.30), vec3(0.98, 0.64, 0.42), vec3(0.62, 0.34, 0.50), vec3(0.5, 0.4, 0.7), vec3(0.98, 0.8, 0.6), 0.08, 0.7);
      else dqSet(vec3(1.0, 0.89, 0.66), vec3(1.0, 0.78, 0.54), vec3(0.48, 0.50, 0.80), vec3(0.62, 0.50, 0.74), vec3(0.98, 0.94, 0.8), 0.08, by > 0.62 ? 0.1 : 0.95);
      return;
    }
    if (h < 0.02 && f.x < -0.10 && (h < 0.007 || f.x > -0.272)) { dqSet(vec3(0.90, 0.68, 0.60), vec3(0.96, 0.78, 0.60), vec3(0.46, 0.46, 0.76), vec3(0.58, 0.46, 0.72), vec3(0.4, 0.62, 0.7), 0.1, 0.3); return; }
    float sl = f.x + 0.02;
    if (h > 0.006 && h < 0.105 && abs(sl + 0.10 * h) < 0.036 * (1.0 - h / 0.11)) { dqSet(vec3(0.98, 0.58, 0.28), vec3(0.96, 0.72, 0.42), vec3(0.66, 0.30, 0.40), vec3(0.48, 0.34, 0.60), vec3(1.0, 0.88, 0.6), 0.06, 0.65 - 18.0 * sl); return; }
    if (h < 0.028 + 0.016 * sin(f.x * 3.1 + 0.6) + 0.006 * sin(f.x * 9.0)) { dqSet(vec3(0.88, 0.74, 0.78), vec3(0.80, 0.80, 0.84), vec3(0.64, 0.68, 0.88), vec3(0.72, 0.66, 0.86), vec3(0.98, 0.84, 0.66), 0.1, 0.35); return; }
  }
  // the sky: cream and rose low down, pale blue and lilac higher
  float up = sat(h / 0.42), veil = noise(vec2(f.x * 1.3 + f.y * 2.0, f.y * 6.0 + 3.0)) - 0.5;
  dqSet(mix(vec3(1.0, 0.86, 0.56), vec3(0.98, 0.90, 0.76), up), mix(vec3(0.99, 0.74, 0.58), vec3(0.96, 0.80, 0.80), up),
        mix(vec3(0.82, 0.76, 0.88), vec3(0.56, 0.77, 0.89), up), mix(vec3(0.74, 0.84, 0.84), vec3(0.72, 0.73, 0.91), up), vec3(0.99, 0.95, 0.84), 0.1, 0.95 - up + 0.6 * veil);
}
void dqQuay(vec2 p) {
  float edge = -0.405 - 0.165 * p.x - p.y;      // over 0 on the stones of the quay
  if (edge > -0.15) {
    // two iron bollards, with their long blue shadows
    dqBy(uKind[3], 0.5 * uPhrase);
    bool near = p.x > -0.38;
    vec2 d = near ? (p - vec2(-0.15, -0.435)) / 1.35 : (p - vec2(-0.72, -0.325)) / 0.9;
    vec2 cap = (d - vec2(0.0, 0.078)) / vec2(0.043, 0.024);
    if (dot(cap, cap) < 1.0 || (abs(d.x) < 0.031 - 0.08 * d.y && d.y > -0.012 && d.y < 0.078)) {
      dqSet(vec3(1.0, 0.64, 0.32), vec3(0.94, 0.42, 0.26), vec3(0.16, 0.18, 0.48), vec3(0.36, 0.14, 0.40), vec3(0.1, 0.46, 0.5), 0.1, 0.3 - 30.0 * d.x);
      return;
    }
    if (edge > 0.0) {
      dqSet(vec3(1.0, 0.89, 0.66), vec3(0.99, 0.75, 0.55), vec3(0.76, 0.70, 0.90), vec3(0.92, 0.68, 0.74), vec3(0.66, 0.82, 0.80), 0.08, 0.80 - 0.45 * step(0.46, abs(fract((p.x - edge * 1.6) * 2.7) - 0.5)));
      if (dqBar(d, vec2(0.0), vec2(0.34, -0.09)) < 0.026) dqSet(vec3(0.92, 0.62, 0.62), vec3(0.70, 0.66, 0.90), vec3(0.32, 0.40, 0.80), vec3(0.48, 0.36, 0.72), vec3(0.4, 0.66, 0.7), 0.1, 0.12);
      else if (edge < 0.02) { dqS1 = vec3(0.98, 0.82, 0.66); dqL1 = vec3(1.0, 0.97, 0.86); dqLit = 0.9; }
      return;
    }
  }
  if (p.y > dqHz || (p.y > dqWl && dqBow(p) > 0.0 && p.x > 0.0)) { dqOver(p, p); return; }
  // the water takes what stands over it, upside down and drawn sideways by a slow swell
  float down = dqHz - p.y, below = max(dqWl - p.y, 0.0);
  float sw = sin(p.y * 95.0 + p.x * 3.0 + uTime * 0.45) + 0.6 * sin(p.y * 43.0 - p.x * 7.0 - uTime * 0.31);
  float x = p.x + sw * (0.003 + 0.022 * below + 0.015 * down);
  dqOver(vec2(x, below > 0.0 ? 2.0 * dqWl - p.y : -9.0), vec2(x, dqHz + down * 0.95));
  float streak = noise(vec2(p.x * 3.2 + 0.03 * uTime, p.y * 34.0));
  float gl = (p.x + 0.40 + 0.1 * down) / (0.10 + 0.35 * down), gleam = exp(-gl * gl);
  vec4 m = piece(vec2(p.x * 0.56 + 0.5, sat(down / 0.6)));
  dqS1 = mix(dqS1, vec3(0.28, 0.56, 0.80), 0.55); dqS2 = mix(dqS2, vec3(0.46, 0.44, 0.78), 0.45);
  dqL2 = mix(dqL2, vec3(0.60, 0.80, 0.80), 0.3);
  dqK = vec3(0.36, 0.70, 0.66); dqOdd = 0.13;
  dqLit = dqLit * 0.62 - 0.1 - 0.25 * smoothstep(0.0, 0.5, down) + 0.55 * (streak - 0.5) + 0.5 * gleam * streak + 0.35 * m.a
        + (0.3 + 0.5 * uEnergy) * band(0.5 + p.x * 0.55) * smoothstep(0.35, 0.75, streak);
  // the gleam takes the phrase, the rest the texture and, where a sound of the piece lies, its colour
  float w = sat(1.6 * gleam - 0.3);
  dqBy(mix(mix(uKind[2], m.rgb / max(m.a, 0.02), sat(3.0 * m.a)), uKind[3], w), max(mix(0.7 * uTexture, uPhrase, w), 0.6 * m.a));
}
// The orchard's trees: middle and size of the crown. A place looks at one near tree and one far one.
const vec3 dqT0 = vec3(0.44, 0.09, 0.25), dqT1 = vec3(-0.70, -0.02, 0.215), dqT2 = vec3(1.10, 0.12, 0.20), dqT3 = vec3(-1.18, 0.0, 0.20), dqT4 = vec3(-0.07, 0.055, 0.135),
  dqT5 = vec3(0.79, 0.24, 0.11), dqT6 = vec3(-0.31, 0.055, 0.085), dqT7 = vec3(0.17, 0.165, 0.075), dqT8 = vec3(-0.44, 0.05, 0.055);
vec3 dqNear(float x) { return x < -0.4 ? (x < -0.945 ? dqT3 : dqT1) : x < 0.12 ? dqT4 : x < 0.8 ? dqT0 : dqT2; }
vec3 dqFar(float x) { return x < 0.0 ? (x < -0.39 ? dqT8 : dqT6) : x < 0.5 ? dqT7 : dqT5; }
// How deep a place of the grass lies in the shadow of tree t.
float dqShade(vec2 p, vec3 t) { vec2 d = (p - t.xy) / t.z + vec2(1.35, 1.75); d.y -= 0.16 * d.x; d *= vec2(0.62, 2.3); return 1.25 - dot(d, d); }
void dqOrchard(vec2 p) {
  for (int i = 0; i < 2; i++) {
    vec3 t = i == 0 ? dqNear(p.x) : dqFar(p.x);
    vec2 d = (p - t.xy) / t.z;
    if (abs(d.x) > 1.3 || d.y > 1.2 || d.y < -1.7) continue;
    float fi = t.x * 9.0 + 2.0;
    vec2 u = d + 0.10 * sin(d.yx * vec2(4.3, 5.1) + fi * vec2(2.1, 1.3)) + 0.05 * sin(d.yx * 11.0 + fi);
    u.y -= 0.07 * u.x * u.x + 0.22 * max(-d.y, 0.0);
    if (dot(u, u) < 1.0) {
      // leaf masses turn to the light, up at the right
      float lump = sin(d.x * 5.0 + fi) * sin(d.y * 5.5 + 1.7 * fi);
      float lit = 0.45 + 0.55 * dot(d, vec2(0.62, 0.72)) + 0.28 * lump;
      dqSet(vec3(0.95, 0.84, 0.26), vec3(0.62, 0.78, 0.22), vec3(0.10, 0.42, 0.36), vec3(0.18, 0.26, 0.60), lit > 0.4 ? vec3(0.99, 0.50, 0.20) : vec3(0.50, 0.16, 0.44), 0.12, lit);
      dqBy(uKind[3], uPhrase);
      return;
    }
    float lean = d.x - 0.08 * sin(d.y * 2.0 + fi);
    if (d.y < -0.5 && d.y > -1.6 && abs(lean) < 0.075 + 0.06 * dqFall(-1.2, -1.6, d.y)) {
      dqSet(vec3(0.99, 0.66, 0.38), vec3(0.86, 0.48, 0.46), vec3(0.26, 0.24, 0.54), vec3(0.44, 0.22, 0.44), vec3(0.2, 0.5, 0.5), 0.1, 0.4 + 6.0 * lean);
      dqBy(uKind[0], uDrone);
      return;
    }
  }
  float g = 0.115 + 0.115 * p.x + 0.02 * sin(p.x * 2.6 + 0.6) - p.y;
  if (g > 0.0) {
    // the grass, and the blue shadows lying down it
    float far = exp(-g * 5.0), row = noise(vec2(p.x * 2.0 + p.y * 5.0, (p.y - 0.115 * p.x) * 22.0));
    float shade = max(dqShade(p, p.x < -0.5 ? (p.x < -1.28 ? dqT3 : dqT1) : p.x < 0.5 ? dqT0 : dqT2), dqShade(p, p.x > 0.4 ? dqT5 : p.y > -0.135 ? dqT6 : dqT4));
    if (shade > 0.28 + 0.16 * sin(p.x * 17.0 + p.y * 31.0) + 0.3 * (row - 0.5)) {
      dqSet(vec3(0.62, 0.70, 0.40), vec3(0.80, 0.56, 0.60), vec3(0.24, 0.38, 0.78), vec3(0.44, 0.36, 0.74), vec3(0.16, 0.54, 0.60), 0.12, 0.12 + 0.5 * smoothstep(0.75, 0.9, row));
      dqBy(uKind[0], uDrone);
    } else {
      vec4 m = piece(vec2(p.x * 0.56 + 0.5, sat(g * 1.6)));
      dqSet(mix(vec3(0.94, 0.84, 0.30), vec3(0.98, 0.88, 0.54), far), mix(vec3(0.68, 0.78, 0.28), vec3(0.80, 0.84, 0.52), far), vec3(0.38, 0.66, 0.36), vec3(0.30, 0.60, 0.52), vec3(0.98, 0.60, 0.36), 0.1,
            0.66 + 0.6 * (row - 0.5) + (0.2 + 0.4 * uEnergy) * band(0.5 + p.x * 0.55) * (row - 0.2));
      dqBy(mix(uKind[2], m.rgb / max(m.a, 0.02), sat(3.0 * m.a)), max(0.7 * uTexture, 0.6 * m.a));
    }
    return;
  }
  dqBy(uKind[1], uPad);
  if (p.y < 0.16 + 0.05 * sin(p.x * 2.2 + 2.4) + 0.02 * sin(p.x * 5.1)) {
    dqSet(vec3(0.92, 0.78, 0.70), vec3(0.70, 0.82, 0.70), vec3(0.54, 0.64, 0.88), vec3(0.66, 0.60, 0.84), vec3(0.98, 0.88, 0.6), 0.1, 0.35 + 6.0 * (0.14 - p.y));
    return;
  }
  float up = sat((p.y - 0.1) / 0.4);
  dqSet(mix(vec3(1.0, 0.90, 0.66), vec3(0.98, 0.92, 0.80), up), mix(vec3(0.99, 0.80, 0.70), vec3(0.94, 0.84, 0.88), up), mix(vec3(0.72, 0.84, 0.88), vec3(0.52, 0.74, 0.90), up),
        mix(vec3(0.82, 0.78, 0.90), vec3(0.68, 0.76, 0.92), up), vec3(0.97, 0.90, 0.84), 0.05, 0.75 - 0.7 * up + 0.8 * (noise(vec2(p.x * 2.0, p.y * 5.0)) - 0.5));
}
// How the dabs lie at a place: which way (xy), how long (z), how fat the sound there makes them (w).
vec4 dqWay(float ang, float lng, float fat) { return vec4(cos(ang), sin(ang), lng, fat); }
vec4 dqLie(vec2 p) {
  if (uVar < 0.5) {
    float sky = smoothstep(dqHz - 0.01, dqHz + 0.02, p.y), hull = sat(dqBow(p) * 30.0) * smoothstep(dqWl - 0.01, dqWl + 0.01, p.y);
    float quay = smoothstep(-0.02, 0.01, -0.405 - 0.165 * p.x - p.y);
    vec4 l = vec4(1.0, 0.0, 1.5, uTexture);
    l = mix(l, dqWay(0.35 + 0.5 * sin(p.x * 2.0 + p.y * 4.0), 1.2, uPad), sky);
    l = mix(l, vec4(0.99, -0.15, 1.38, uDrone), hull * (1.0 - smoothstep(0.0, 0.03, p.y - 0.13)));
    return mix(l, vec4(0.99, -0.16, 1.2, 0.5 * uPhrase), quay);
  }
  float sky = smoothstep(-0.01, 0.03, p.y - 0.115 - 0.115 * p.x);
  vec4 l = mix(vec4(0.99, 0.14, 1.4, uTexture), dqWay(-0.3 + 0.5 * sin(p.x * 2.0 - p.y * 3.0), 1.2, uPad), sky);
  // round the crowns of the near trees they follow the form
  vec3 t = dqNear(p.x);
  vec2 d = (p - t.xy) / t.z;
  float r = dot(d, d);
  return mix(l, vec4(d.y < 0.0 ? vec2(-d.y, d.x) : vec2(d.y, -d.x), 1.35, uPhrase), dqFall(1.3, 0.9, r) * smoothstep(0.0, 0.1, r));
}
float dqLum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec2 dqHit; float dqWarm;   // where a hit falls, and how far the hour leans to the warm dabs
// The one colour of a dab at c, by its two numbers.
vec3 dqPaint(vec2 c, float h1, float h2) {
  float h3 = fract(h1 * 131.7), h4 = fract(h1 * 717.3), h5 = fract(h1 * 311.9);
  // a cue is a slow gleam that crosses: the dabs in it turn to their light
  float gx = c.x + 0.3 * c.y - mix(-0.6, 0.8, 1.0 - uCue), cue = sat(1.0 - gx * gx * 5.0);
  cue *= cue * uCue;
  // light or shade, then one pigment of two
  float lit = dqLit + dqWarm + 0.05 * sin(uTime * (0.2 + 0.25 * h3) + h4 * TAU) + 0.7 * cue;
  vec3 k = mix(h4 < 0.5 ? dqS1 : dqS2, h3 < 0.6 ? dqL1 : dqL2, smoothstep(h5 - 0.07, h5 + 0.07, lit));
  if (fract(h2 * 91.7) < dqOdd) k = mix(dqK, vec3(1.0, 0.93, 0.74), 0.75 * uKeys);
  k *= 0.97 + 0.07 * (h2 - 0.5);
  // the sound dyes its share of the dabs, each at about the lightness it had
  float l = dqLum(k), share = smoothstep(0.0, 0.25, dqAmt * (0.2 + 0.42 * uEnergy) - fract(h1 * 991.3) * 0.95);
  vec3 dye = mix(dqDye * l / max(dqLum(dqDye), 0.05), vec3(l), max(0.0, l - 0.6) * 0.9);
  k = mix(k, sat(dye), 0.75 * share);
  // a hit pales the dabs in one soft circle
  vec2 hc = c - dqHit;
  float pale = uHits * dqFall(0.036, 0.004, dot(hc, hc)) * smoothstep(0.2, 0.5, h4) + 0.12 * cue;
  return mix(k, mix(vec3(1.0, 0.97, 0.90), uKind[4], 0.12), sat(pale));
}
// A single row of dabs from a to b: how much of the pixel it covers (x) and the dab's own number (y).
vec2 dqRow(vec2 p, vec2 a, vec2 b, float sag, float gap, vec2 half_) {
  vec2 ab = b - a, dir = ab / length(ab);
  float n = floor(length(ab) / gap), k = clamp(floor(dot(p - a, dir) / gap), 0.0, n), u = k / n;
  vec2 d = p - a - dir * (k + 0.5) * gap;
  float h = hash11(k + a.x * 31.0);
  d = vec2(dot(d, dir), dot(d, vec2(-dir.y, dir.x)) + sag * 4.0 * u * (1.0 - u)) / (half_ * (0.75 + 0.4 * h));
  return vec2(sat(0.5 + (1.0 - dot(d, d)) * 0.5 * min(half_.x, half_.y) * uRes.y), h);
}
vec3 render(vec2 p) {
  dqHit = vec2(0.22 * sin(uTime * 0.11), -0.08 + 0.14 * sin(uTime * 0.083 + 1.0));
  dqWarm = 0.12 * (uTone - 0.5) + 0.12 * uMic - 0.09 * cos(TAU * uLoop);
  vec4 lie = dqLie(p);
  float fat = 1.0 + 0.2 * lie.w + 0.16 * (0.5 - uSpace), root = sqrt(lie.z);
  lie.xy /= max(length(lie.xy), 0.01);
  mat2 grain = mat2(lie.x, -lie.y, lie.y, lie.x);
  // three sheets of dabs, the smallest on top: find the dab seen here and the one under its edge
  vec4 one = vec4(p, 0.5, 0.5), two = one;   // each: its middle, its two numbers
  float a1 = 0.0, a2 = 0.0;
  for (int s = 0; s < 3; s++) {
    float rows = 84.0 - 12.0 * float(s), seed = float(s) + 1.0;
    mat2 m = s == 0 ? mat2(0.9211, -0.3894, 0.3894, 0.9211) : s == 1 ? mat2(0.7648, 0.6442, -0.6442, 0.7648) : mat2(0.4085, -0.9128, 0.9128, 0.4085);
    vec2 q = m * p * rows + seed * 3.17, at = floor(q - 0.5);
    for (int j = 0; j < 4; j++) {
      // in one order wherever we stand, so a dab lies over its neighbour everywhere alike
      vec2 par = vec2(j & 1, (j >> 1) ^ (j & 1)), id = at + mod(par - at, 2.0);
      float h1 = hash21(id + seed * 7.0), h2 = fract(h1 * 57.31), size = (0.36 + 0.17 * fract(h1 * 131.7)) * fat;
      vec2 d = (q - id - 0.5 - (vec2(h1, h2) - 0.5) * 0.54) * m;
      if (dot(d, d) > 1.9 * size * size) continue;
      float tip = (fract(h1 * 717.3) - 0.5) * 0.8;
      vec2 e = grain * d / size;
      e = (e + tip * vec2(-e.y, e.x)) * vec2(1.0 / root, root);
      float rr = dot(e, e) / (1.0 + tip * tip) * (1.0 + 0.2 * (fract(h1 * 43.0) - 0.5) * e.x);
      float a = sat(0.5 + (1.0 - rr) * 0.23 * uRes.y * size / rows);
      if (a > 0.02) {
        vec4 dab = vec4(p - d / rows, h1, h2);
        if (a1 < 0.02) { one = dab; a1 = a; }
        else if (a2 < a) { two = dab; a2 = a; }
        if (max(a1, a2) > 0.95) break;
      }
    }
    if (max(a1, a2) > 0.95) break;
  }
  // at its edge a dab is seen with the one below it, given the same look at the scene
  if (uVar < 0.5) dqQuay(one.xy); else dqOrchard(one.xy);
  vec3 col = vec3(0.93, 0.885, 0.79);
  if (a1 < 0.95) col = mix(col, dqPaint(two.xy, two.z, two.w), a2);
  col = mix(col, dqPaint(one.xy, one.z, one.w), a1 > 0.95 ? 1.0 : a1);
  // single rows: the mooring line and the stays, or a ladder in the near tree
  vec2 row = vec2(0.0);
  if (uVar < 0.5) {
    vec2 half_ = vec2(0.006, 0.0031);
    row = p.x < 0.1 && p.y < 0.03 ? dqRow(p, vec2(-0.14, -0.345), vec2(0.105, -0.005), 0.03, 0.0125, half_)
      : p.x < 0.45 ? dqRow(p, vec2(0.075, 0.066), vec2(0.44, 0.64), 0.0, 0.0125, half_) : dqRow(p, vec2(0.46, 0.64), vec2(0.96, 0.02), 0.0, 0.0125, half_);
  } else if (abs(p.x - 0.32) < 0.09 && abs(p.y + 0.1) < 0.19) {
    vec2 r0 = dqRow(p, vec2(0.262, -0.265), vec2(0.352, 0.065), 0.0, 0.0125, vec2(0.0072, 0.0046));
    vec2 r1 = dqRow(p, vec2(0.306, -0.272), vec2(0.380, 0.06), 0.0, 0.0125, vec2(0.0072, 0.0046));
    vec2 r2 = dqRow(p, vec2(0.284, -0.26), vec2(0.366, 0.05), 0.0, 0.037, vec2(0.0042, 0.016));
    row = r0.x > r1.x ? r0 : r1;
    row = row.x > r2.x ? row : r2;
  }
  vec3 cord = uVar < 0.5 ? (row.y < 0.6 ? vec3(0.34, 0.26, 0.56) : vec3(0.96, 0.58, 0.32)) : (row.y < 0.65 ? vec3(1.0, 0.80, 0.50) : vec3(0.95, 0.52, 0.34));
  return mix(col, cord, row.x);
}
