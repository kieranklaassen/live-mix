// name: Passed along
// a: Arms by day
// b: Lamps at anchor
// what: Hill behind hill at dawn, with a tower and three jointed arms on crest after crest, the nearest huge at the left, the last a tick in the haze, each taking up the shape of the one before; or ships at anchor on a foggy night, where a blinking lamp is answered hull by hull.
// follows: The phrase opens the near arms or the near lamp, and farther stations repeat the message seconds later. The drone lifts the mist, the pad lights the sky, texture brings birds or glints on the water, the bands lean the arms, the loop moves the sun or a boat's beam, a hit lights one station after another, a cue all at once, keys the windows.
// own: 0 snow or blue cold at -1, harvest gold or amber at 1; 1 night at -1, day at 1; 2 clear air at -1, thick fog at 1; 3 flat land or mirror water at -1, mountains or chop at 1; 4 the nearest stands back at -1, fills the frame at 1; 5 few stations at -1, many at 1.
float paW, paPx; // half the width drawn for, one pixel
float paSnow, paGold, paDark, paBright, paFlat, paSharp;
float paDn(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // falls from a to b
float paH1(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float paN(float x) { float i = floor(x), f = x - i; f = f * f * (3. - 2. * f); return mix(paH1(i), paH1(i + 1.), f); }
float paSeg(vec2 p, vec2 a, vec2 b) { vec2 d = b - a; return length(p - a - d * sat(dot(p - a, d) / max(dot(d, d), 1e-6))); }
float paCov(float d, float px) { return sat(0.5 - 0.5 * d / px); }
vec3 paHour(vec3 dawn, vec3 day, vec3 dark) { return mix(mix(dawn, day, paBright), dark, paDark); }
vec2 paTurn(vec2 q, float a) { float c = cos(a), s = sin(a); return vec2(c * q.x + s * q.y, c * q.y - s * q.x); }
// The nearest is smaller in a narrow picture.
float paFit() { return mix(0.62, 1., sat((paW - 0.28) / 0.5)); }
// How station n is lit: a hit runs back along them, a cue lights all.
float paEcho(float n) {
  float hit = n < 0.5 ? uHits * uHits : sat(1. - abs(uHits - 1. + 0.19 * n) * 5.) * sat(uHits * 5.);
  return max(hit, uCue);
}

// ---- a: arms by day
// Across (of the half width), which ridge, how big, which in the line.
const vec4 PA_POST[8] = vec4[8](
  vec4(0.53, 0., 0.0125, 4.), vec4(0.02, 0., 0.016, 5.), vec4(0.37, 1., 0.023, 3.), vec4(-0.14, 2., 0.038, 4.),
  vec4(0.68, 3., 0.043, 2.), vec4(0.19, 4., 0.085, 1.), vec4(0.88, 5., 0.125, 2.), vec4(-0.66, 7., 0.37, 0.));
// Beam, left arm, right arm: one held shape after another.
vec3 paShape(float k) {
  k = mod(k, 61.);
  vec3 h = floor(8. * vec3(paH1(k + 3.), paH1(k + 91.), paH1(k + 157.))) - 3.5;
  return vec3(sign(h.x) * (abs(h.x) > 2. ? 0.9 : 0.3), sign(h.yz) * (0.48 + 0.55 * abs(h.yz)));
}
vec3 paPose(float t) {
  float k = floor(t / 9.), f = t / 9. - k;
  return mix(paShape(k - 1.), paShape(k), smoothstep(0., 0.24, f));
}
// A worn crest, not a fold.
float paAbs(float x) { return sqrt(x * x + 0.012); }
float paBase(float near) { return 0.068 - 0.468 * near * (0.72 + 0.28 * near); }
float paRidge(float x, float fi) {
  float near = fi / 6., u = x * mix(2.7, 0.95, near) + fi * 13.7;
  float n1 = paN(u), n2 = paN(u * 2.3 + 3.), h = n1 + 0.36 * n2 - 0.68;
  if (paSharp > 0.) h = mix(h, 1.1 - paAbs(2.2 * n1 - 1.1) + 0.45 * (1. - paAbs(2. * n2 - 1.)) - 0.7, paSharp);
  h *= mix(0.052, 0.14, near) * (1. - 0.85 * paFlat) * (1. + 0.8 * paSharp * (1. - 0.6 * near));
  float kx = (x - PA_POST[fi < 0.5 ? 0 : int(fi) + 1].x * paW) / mix(0.1, 0.34, near);
  return paBase(near) + h + mix(0.018, 0.1, near) * exp(-kx * kx) * (1. - 0.4 * paFlat);
}
// One slatted arm lying along x from a to b, half as wide as w.
float paArm(vec2 q, float a, float b, float w, float px) {
  float whole = paCov(max(abs(q.x - 0.5 * (a + b)) - 0.5 * (b - a), abs(q.y) - w), px);
  float s = fract((q.x + q.y * 0.45) * 19.);
  float slat = smoothstep(0., 19. * px, 0.33 - abs(s - 0.5));
  float rail = paCov(abs(abs(q.y) - w + 0.012) - 0.012, px);
  float ends = paCov(min(abs(q.x - a - 0.015), abs(q.x - b + 0.015)) - 0.018, px);
  return whole * max(max(slat, rail), max(ends, smoothstep(0.008, 0.013, px)));
}
// A station round its pivot, the mast one unit long: wood, stone, window, arms.
vec4 paStation(vec2 q, vec3 pose, float px, bool fine) {
  float mast = 0., stone = 0., win = 0., arm = 0., t = 0.75 * px;
  if (dot(q, q) < 2.) {
    vec2 b = paTurn(q, pose.x);
    arm = paArm(b, -0.8, 0.8, 0.052 + t, px);
    for (int s = 0; s < 2; s++) {
      vec2 e = paTurn(vec2((s == 0 ? -b.x : b.x) - 0.8, b.y), s == 0 ? pose.y : pose.z);
      arm = max(arm, paArm(e, -0.02, 0.6, 0.046 + t, px));
      if (fine) arm = max(arm, max(paCov(paSeg(e, vec2(0.), vec2(-0.24, 0.)) - 0.007, px), paCov(length(e + vec2(0.24, 0.)) - 0.028, px)));
    }
    arm = max(arm, paCov(length(q) - 0.05 - t, px));
  }
  if (q.y < 0.1 && abs(q.x) < 0.5) {
    float w = 0.052 - 0.028 * q.y, in_ = max(q.y, -1.02 - q.y);
    if (fine) {
      float d = min(abs(abs(q.x) - w) - 0.015, max(abs(fract(q.y * 12.) - 0.5) / 12. - 0.009, abs(q.x) - w));
      // ropes, rail, the keeper with a glass
      vec2 m = vec2(abs(q.x), q.y);
      d = min(max(d, in_), min(paSeg(m, vec2(0.03, -0.02), vec2(0.16, -1.)), paSeg(m, vec2(0.04, -0.42), vec2(0.4, -1.))) - 0.0035);
      d = min(d, max(m.x - 0.42, min(abs(q.y + 0.86) - 0.006, max(abs(fract(q.x * 9.) - 0.5) / 9. - 0.006, abs(q.y + 0.94) - 0.08))));
      m = q - vec2(0.27, -1.02);
      d = min(d, max(max(abs(m.x + 0.02 * m.y) - 0.042 + 0.1 * m.y, m.y - 0.215), -m.y));
      d = min(min(d, length(m - vec2(0.008, 0.248)) - 0.026), paSeg(m, vec2(0., 0.18), vec2(0.07, 0.228)) - 0.01);
      mast = paCov(min(d, paSeg(m, vec2(0.026, 0.243), vec2(0.15, 0.262)) - 0.0065), px);
    } else mast = paCov(max(abs(q.x) - w * 0.8 - t, in_), px);
    float half_ = (fine ? 0.36 : 0.29) - 0.03 * (q.y + 1.);
    stone = paCov(max(min(abs(q.x) - half_, max(abs(q.x) - half_ - 0.07, abs(q.y + 1.06) - 0.045)), max(q.y + 1.015, -3.2 - q.y)), px);
    vec2 v = vec2(q.x + 0.06, q.y + 1.5);
    win = paCov(max(abs(v.x) - 0.055 - t, abs(v.y) - 0.1 - t), px);
    if (fine) win *= 1. - 0.8 * paCov(abs(fract(v.y * 15.) - 0.5) / 15. - 0.006, px);
  }
  return vec4(mast, stone, win, arm);
}
const vec3 paLit = vec3(1., 0.86, 0.66);
vec3 paHaze, paDim;
vec2 paSun;
vec3 paSky(vec2 p) {
  float y = p.y - 0.06;
  vec3 top = paHour(vec3(0.66, 0.69, 0.8), vec3(0.36, 0.6, 0.8), vec3(0.06, 0.09, 0.19));
  vec3 mid = paHour(vec3(0.86, 0.82, 0.85), vec3(0.7, 0.83, 0.9), vec3(0.15, 0.19, 0.32));
  vec3 c = mix(paHaze, mid, smoothstep(-0.02, 0.2, y));
  c = mix(c, top, smoothstep(0.14, 0.48, y));
  // long thin cloud
  vec2 q = vec2(p.x * 1.5 + uTravel * 0.012 + uTime * 0.002, y * 11. + 0.4 * sin(p.x * 2.3 + uTime * 0.01));
  float n = 0.6 * noise(q) + 0.27 * noise(q * vec2(2.6, 2.2) + 5.) + 0.13 * noise(q * vec2(7., 4.6) + 9.);
  float ds = length((p - paSun) * vec2(0.6, 1.));
  vec3 cc = mix(vec3(0.95, 0.92, 0.92), vec3(1., 0.87, 0.74), exp(-ds * 3.)) * (1. - paDark * vec3(0.5, 0.48, 0.34));
  c = mix(c, cc, smoothstep(0.42, 0.75, n) * smoothstep(0.02, 0.12, y) * (0.55 + 0.3 * uPad));
  // the sun, a moon by night
  float glow = exp(-ds * (6. - 1.5 * uPad)) * (0.35 + 0.45 * uPad + 0.2 * uLevel + 0.3 * uCue);
  c = mix(c, mix(mix(vec3(1., 0.9, 0.74), uKind[1], 0.14), vec3(0.72, 0.78, 0.92), paDark), sat(glow));
  return mix(c, vec3(0.98, 0.96, 0.93), 0.92 * paCov(length(p - paSun) - 0.034, 1.5 * paPx + 0.002));
}
// Birds, crossing slowly.
float paBirds(vec2 p) {
  float b = 0.;
  for (int k = 0; k < 5; k++) {
    float f = float(k), flap = 0.55 * sin(uTime * 2.4 + f * 1.9);
    vec2 q = p - vec2(1.25 - 2.5 * fract(uTime * 0.008 + 0.36) + 0.05 * abs(f - 1.6), 0.29 + 0.022 * f + 0.008 * sin(uTime * 0.3 + f * f));
    q.x = abs(q.x);
    b = max(b, paCov(max(abs(q.y - flap * q.x + (6. + 9. * flap) * q.x * q.x) - 0.0019 + 0.06 * q.x, q.x - 0.026), paPx));
  }
  return b;
}
// The land below one ridge's line.
vec3 paLand(vec2 p, float h, float fi) {
  float near = fi / 6., base = paBase(near), below = mix(h, base, 0.7 * paSharp) - p.y;
  float s = mix(0.16, 1., near * near), k = mix(0.35, 1., near);
  float warp = noise(vec2(p.x * 3. / s + fi * 7., below * 5. / s));
  // spurs wander as they come down
  float x = p.x + paSharp * below * (2.2 * warp - 1.), dh = (paRidge(x + 0.02, fi) - paRidge(x, fi)) / 0.02;
  float v = (below * 9. - 0.15 * p.x) / s + warp * 0.9, row = floor(v);
  float u = (p.x * 1.7 + below * 0.5) / s + 0.35 * warp + paH1(row + fi * 17.) * 5., cell = floor(u);
  float r = hash21(vec2(cell + 0.5, row + fi * 19.)), r2 = fract(r * 17.3);
  vec3 c = r < 0.5 ? mix(vec3(0.17, 0.35, 0.23), vec3(0.37, 0.53, 0.29), r2) : r < 0.68 ? vec3(0.53, 0.46, 0.55) : r < 0.8 ? vec3(0.6, 0.62, 0.42) : vec3(0.83, 0.83, 0.78);
  c = mix(c, vec3(0.34, 0.49, 0.29) + 0.05 * warp, 0.9 * sat(-uOwn[5]));
  c = mix(c, mix(vec3(0.58, 0.4, 0.2), vec3(0.8, 0.63, 0.3), r2), 0.85 * paGold);
  c *= 1. + 0.07 * sin((r2 < 0.5 ? u * 46. : v * 34. + u * 5.) + warp * 3.) * near * step(0.4, fract(r * 31.));
  c = mix(c, mix(vec3(0.84, 0.87, 0.92), vec3(0.94, 0.95, 0.96), warp), 0.94 * paSnow);
  // hedges, and clumps of trees
  vec2 e = (0.5 - abs(fract(vec2(u, v)) - 0.5)) * vec2(0.47, 0.11) * s;
  float leaf = noise(p * 130. / k);
  float hedge = paDn(0.0042, 0.0012, min(e.x, e.y) / k - 0.0022 * leaf);
  float wood = smoothstep(0.68 - 0.18 * uOwn[5], 0.73 - 0.18 * uOwn[5], noise(vec2(p.x * 5. / s + 3., below * 13. / s + fi)) + 0.16 * leaf);
  vec3 dark = vec3(0.1, 0.18, 0.15) + vec3(0.14, 0., -0.05) * paGold + vec3(0.14, 0.07, 0.15) * paSnow;
  wood = max(wood, smoothstep(0., 0.002, p.y - h));
  c = mix(c, dark * (0.75 + 0.6 * leaf), max(0.75 * hedge * sat(1. + uOwn[5]), wood) * (0.5 + 0.5 * k));
  // light from the right, lilac shade
  float lit = sat(0.45 - dh * 1.3 + 0.25 * (warp - 0.5));
  c *= mix(vec3(0.58, 0.59, 0.8), vec3(1.2, 1.1, 0.92), mix(lit, smoothstep(0.2, 0.75, lit), uTone));
  c += paLit * 0.09 * exp(-max(h - p.y, 0.) * 60. / s) * lit * (1. - wood);
  c *= paDim * (0.9 + 0.12 * uPad);
  // the air between, and mist at the foot of the ridge
  float air = pow(1. - near, 0.8) * (0.86 + 0.12 * uSpace) * (1. + 0.3 * uOwn[2]);
  c = mix(c, mix(vec3(0.72, 0.72, 0.86) * mix(vec3(1.), paHaze, 0.5), paHaze, pow(1. - near, 3.)) * (1. - 0.25 * paDark), sat(air) * 0.92);
  float wisp = 0.3 * warp + 0.7 * noise(vec2(p.x * 2.2 + uTime * 0.01 * (1. + near) + fi * 5., p.y * 11. - uTime * 0.006));
  float gap = mix(0.055, 0.17, near), thick = 0.5 + 0.35 * uDrone + 0.06 * sin(uTime * 0.2 + fi) + 0.4 * uOwn[2];
  float m = paDn(gap * 1.5, 0., p.y - (h * 0.25 + 0.75 * base) + gap * (1.45 - thick) - (wisp - 0.5) * gap * 1.3);
  vec4 pc = piece(vec2(p.x * uRes.y / uRes.x + 0.5 + 0.25 * (wisp - 0.5), near));
  vec3 mist = mix(paHaze, vec3(0.97, 0.98, 1.) * (1. - paDark * vec3(0.7, 0.64, 0.48)), 0.6);
  mist = mix(mist, mix(pc.rgb / max(pc.a, 0.03), vec3(0.92), 0.45) * (1. - 0.6 * paDark), 0.45 * sat(pc.a * 1.2) * sat(wisp * 1.6));
  return mix(c, mist, sat(m * (0.55 + 0.4 * uDrone + 0.3 * uOwn[2]) * mix(1., 0.7, near)));
}
// One station over c.
void paPost(int n, vec2 p, float seen, inout vec3 c) {
  vec4 at = PA_POST[n];
  bool first = n == 7;
  vec2 q = vec2(p.x - at.x * paW, p.y - 0.175 - 0.02 * uOwn[4]);
  float fi = at.y, near = fi / 6., e = paEcho(at.w), size = at.z;
  if (first) size *= exp2(0.75 * uOwn[4]) * paFit();
  else size = max(0.0005, size * (n == 1 || n == 3 || n == 6 ? smoothstep(0., 0.9, uOwn[5]) : n == 5 ? 1. : smoothstep(-1., -0.2, uOwn[5])));
  if (!first) q.y = p.y - paRidge(at.x * paW, fi) - 1.75 * size;
  q /= size;
  c = mix(c, mix(vec3(1., 0.8, 0.5), uKind[4], 0.35), e * (first ? 0.5 : 0.75) * exp(-dot(q, q) * (first ? 2.2 : 0.6)) * mix(0.6, 1., uEnergy));
  if (seen < fi - 0.5 && (dot(q, q) < 2. || (q.y < 0. && abs(q.x) < 0.5))) {
    float lift = first ? sat(0.12 + 1.1 * uPhrase + 0.5 * uLevel) : sat(0.25 + 1.7 * uLevel);
    vec3 pose = mix(vec3(0.5, 2.15, -2.3), paPose(uTime + 400. - 2.6 * at.w), lift);
    pose.yz += vec2(-1., 1.) * uCue * (1. - uCue);
    if (first) pose += vec3(0.16 * (uBands[2] - uBands[6]), 0.3 * uBands[4], 0.9 * uHits * (1. - uHits) - 0.3 * uBands[9]);
    vec4 st = paStation(q, pose, 0.8 * paPx / size, first);
    float air = sat(1. - near) * (0.82 + 0.12 * uOwn[2]);
    vec3 wood = vec3(0.085, 0.08, 0.1), stone = vec3(0.36, 0.34, 0.39);
    if (first) {
      vec2 g = vec2(q.x * 5. + 0.5 * mod(floor(q.y * 9.), 2.), q.y * 9.), j = abs(fract(g) - 0.5);
      stone *= (0.84 + 0.26 * hash21(floor(g) + 0.5)) * (1. - 0.22 * smoothstep(0.44, 0.5, max(j.x - 0.01, j.y)));
    }
    stone += paLit * 0.36 * smoothstep(0.2, 0.37, q.x) * (1. - paDark);
    stone *= 1. - paDark * vec3(0.58, 0.54, 0.38);
    vec3 armC = mix(wood, uKind[3] * 0.6, 0.35 * uPhrase * (first ? 1. : 0.4));
    armC = mix(armC, mix(vec3(0.95, 0.45, 0.2), uKind[4], 0.3), e * 0.9 * (first ? smoothstep(-0.2, 0.5, q.x) : 1.));
    armC = mix(armC, vec3(1., 0.76, 0.42), paDark * (first ? 0. : 0.6));
    vec3 b = mix(stone, vec3(1., 0.82, 0.46), st.z * st.y * sat(0.6 + 0.4 * uKeys + 0.3 * uMic));
    b = mix(mix(b, wood, st.x), armC, st.w);
    b = mix(b, paHaze * 0.92, air * (1. - 0.8 * e));
    c = mix(c, b, max(max(st.x, st.y), st.w));
    q += vec2(0.06, 1.5);
    c += vec3(0.5, 0.33, 0.14) * uKeys * exp(-dot(q, q) * 9.) * (1. - air);
  }
}
vec3 paDay(vec2 p) {
  paHaze = paHour(vec3(0.95, 0.88, 0.84), vec3(0.88, 0.92, 0.93), vec3(0.27, 0.27, 0.38));
  paHaze = mix(paHaze, (uOwn[0] < 0. ? vec3(0.84, 0.87, 0.92) : vec3(0.98, 0.84, 0.62)) * (1. - 0.62 * paDark), 0.6 * abs(uOwn[0]));
  paDim = paHour(vec3(1.04, 1.02, 1.), vec3(1.15, 1.15, 1.05), vec3(0.26, 0.32, 0.5));
  paSun = vec2(0.49 * paW + 0.05 * sin(TAU * uLoop), 0.205 + 0.13 * paBright - 0.025 * cos(TAU * uLoop));
  // which ridge is seen here
  float seen = -1., h = 0., m = 0.;
  for (int i = 6; i >= 0 && m <= 0. && p.y < 0.19 + 0.12 * paSharp; i--) {
    float fi = float(i), near = fi / 6.;
    h = paRidge(p.x, fi);
    float top = h;
    // trees
    if (abs(p.y - h) < 0.03) {
      float tf = mix(260., 70., near), clump = smoothstep(0.5, 0.7, paN(p.x * mix(16., 6., near) + fi * 5.));
      top += 1.2 * paN(p.x * tf) / tf * clump * (0.4 + near);
    }
    m = smoothstep(-paPx, paPx, top - p.y);
    seen = fi;
  }
  if (m <= 0.) seen = -1.;
  vec3 c = vec3(0.9, 0.9, 0.93) * paHaze * (1. - 0.2 * paDark);
  if (p.y > -0.02 && m < 1.) {
    c = paSky(p);
    c = mix(c, mix(vec3(0.16, 0.15, 0.2), c, 0.3 + 0.4 * paDark), paBirds(p) * sat(2. * uTexture));
  }
  if (m > 0.) c = mix(c, paLand(p, h, seen), m);
  // the stations near here
  int n = 0;
  float lit = max(uHits, uCue);
  for (int i = 0; i < 8; i++) {
    for (; n < 8; n++) {
      vec4 at = PA_POST[n];
      if (abs(p.x - at.x * paW) < at.z * (n == 7 ? 2.4 : lit > 0.01 ? 4.5 : 1.9) && (n == 7 || abs(p.y - 0.05) < 0.28) && (seen < at.y - 0.5 || lit > 0.01)) break;
    }
    if (n > 7) break;
    paPost(n, p, seen, c);
    n++;
  }
  return c;
}

// ---- b: lamps at anchor
const float PA_SEA = 0.075;
// The ships: across, how near, which way the bow lies, which in the line (below 0: of the fleet).
const vec4 PA_BERTH[10] = vec4[10](
  vec4(0.66, 1., 1., 0.), vec4(-0.84, 0.7, -1., -1.5), vec4(-0.58, 0.46, -1., 1.), vec4(0.17, 0.37, -1., -2.), vec4(0.1, 0.28, 1., 2.),
  vec4(-0.27, 0.165, 1., 3.), vec4(-0.4, 0.115, 1., -4.), vec4(0.44, 0.1, -1., 4.), vec4(0.29, 0.07, -1., -5.), vec4(-0.06, 0.06, -1., 5.));
// The message: a lamp opened and shut slowly.
float paSign(float t) {
  float k = floor(t), f = t - k;
  vec2 m = mod(vec2(k, k + 1.), 91.);
  vec2 on = step(0.42, vec2(paH1(m.x + 5.), paH1(m.y + 5.))) * step(mod(m, 13.), vec2(7.5));
  return mix(on.x, on.y, smoothstep(0.35, 0.9, f));
}
// One ship, waterline at 0, bow to the left: cover, lit windows, the line along the rail.
vec3 paShip(vec2 q, float px, bool fine) {
  float t = 0.6 * px, deck = 0.125 + (q.x < 0. ? 0.48 : 0.32) * q.x * q.x;
  float d = max(max(q.y - deck, -0.44 - 0.28 * q.y - 0.1 * smoothstep(0.1, 0.26, q.y) - q.x), max(q.x - 0.5 - 0.2 * q.y, -0.02 - q.y));
  float wale = paCov(abs(q.y - deck + 0.028) - 0.004, px);
  // a house on deck, the bowsprit, the anchor's chain
  vec2 hq = q - vec2(0.3, 0.135);
  d = min(d, max(abs(hq.x) - 0.115, abs(hq.y) - 0.05));
  d = min(d, paSeg(q, vec2(-0.45, 0.225), vec2(-0.71, 0.318)) - 0.009 - t);
  float cx = 1. - sat((-0.5 - q.x) / 0.16);
  float line = max(abs(q.y - 0.17 * cx * cx) * 0.7, abs(q.x + 0.58) - 0.08) - (fine ? 0.0025 : 0.);
  vec2 v = vec2(fract(hq.x * 15.) - 0.5, (hq.y - 0.031) * 15.);
  float win = paCov(max(abs(v.x) - 0.2, abs(v.y) - 0.19), 15. * px) * step(abs(hq.x), 0.1) * step(px, 0.012);
  for (int k = 0; k < 2; k++) {
    float mx = k == 0 ? -0.12 : 0.27, top = k == 0 ? 0.8 : 0.58, ty = top * 0.94;
    vec2 m = vec2(abs(q.x - mx - 0.02 * q.y), q.y);
    d = min(d, max(m.x - 0.011 * (1.2 - q.y / top) - t, max(q.y - top, 0.1 - q.y)));
    // shrouds, the stay forward, the boom with its furled sail
    line = min(line, paSeg(m, vec2(0., ty), vec2(0.08, 0.14)));
    line = min(line, paSeg(q, vec2(mx + 0.02 * top, ty), k == 0 ? vec2(-0.7, 0.315) : vec2(-0.11, 0.62)));
    if (fine) {
      float rung = max(abs(fract(q.y * 26.) - 0.5) / 26., m.x - 0.08 * (ty - q.y) / (ty - 0.14));
      line = min(line, min(paSeg(m, vec2(0., ty), vec2(0.055, 0.14)), max(rung, max(q.y - top * 0.8, 0.15 - q.y))));
    }
    float al = sat((q.x - mx - 0.02) / 0.3);
    d = min(d, length(q - vec2(mx + 0.02 + 0.3 * al, 0.24 + 0.035 * al)) - (0.022 + 0.004 * sin(al * 40.)) * (1.1 - 0.6 * al));
  }
  return vec3(max(paCov(d, px), 0.75 * paCov(line - 0.0018 - t, px)), win, wale);
}
const vec3 paWarm = vec3(1., 0.5, 0.18);
float paWave, paGlint, paChop;
// A lamp in fog at l, and its broken light on the water below the waterline wl.
float paLamp(vec2 p, vec2 l, float wl, float s, float thick) {
  vec2 d = p - l;
  float r = length(d), z = 0.45 + 0.55 * s;
  float v = 0.34 * exp(-r / (0.016 * z)) + (0.04 + 0.05 * thick) * exp(-r / (0.075 * z * (0.6 + thick))) + 1.8 * paCov(r - max(0.0065 * s, 1.3 * paPx), max(paPx, 0.001 + 0.002 * thick * s));
  float dy = wl - p.y;
  if (dy > 0.) {
    float h = max(l.y - wl, 0.01), x = d.x + (paWave - 0.5) * (0.012 + 0.16 * dy) * paChop, w = 0.004 + 0.006 * s + 0.055 * dy * paChop;
    float along = smoothstep(0., 0.4 * h, dy) * exp(-max(dy - h, 0.) * (3.2 + 1.4 * uOwn[3]));
    v = 0.4 * v + 0.8 * exp(-x * x / (w * w)) * along * mix(1., paGlint, 0.93) * sat(0.02 / w + 0.12);
  }
  return v;
}
vec3 paNight(vec2 p) {
  float thick = sat(0.48 + 0.18 * uDrone + 0.48 * uOwn[2] - 0.15 * paDark);
  vec3 top = vec3(0.012, 0.019, 0.026), low = vec3(0.115, 0.142, 0.148);
  top += paGold * vec3(0.033, 0.003, 0.004) + paSnow * vec3(-0.004, 0.007, 0.024);
  low += paGold * vec3(0.145, -0.027, -0.09) + paSnow * vec3(-0.055, -0.015, 0.02);
  top = mix(top, top * 8. + vec3(0.1, 0.12, 0.19), paBright) * (1. - 0.65 * paDark);
  low = mix(low, low * 2.5 + vec3(0.5, 0.42, 0.39), paBright) * (1. - 0.65 * paDark);
  low *= (1. + 0.45 * uPad + 0.3 * uDrone) * (1. + 0.4 * uOwn[5]);
  low = mix(low, low.g * (uKind[1] * uKind[1] * 1.8 + 0.2), 0.35 * uPad);
  float y = p.y - PA_SEA, dep = max(-y, 0.);
  // waves, closer together far off
  float z = 1. / (dep + 0.03);
  float w1 = noise(vec2(p.x * z * 0.55 + uTime * 0.05, z * 3.6 - uTime * 0.13));
  float w2 = noise(vec2(p.x * z * 1.5 - uTime * 0.07, z * 9. + uTime * 0.16 + 4. * w1));
  paWave = 0.62 * w1 + 0.38 * w2;
  paChop = 1. + 0.85 * uOwn[3];
  paGlint = smoothstep(0.42, 0.72, 0.45 * w1 + 0.55 * w2) * 1.9;
  // banks of fog that drift
  vec2 fq = vec2(p.x * 1.3 + uTravel * 0.015 + uTime * 0.004, p.y * 4.5 - uTime * 0.003);
  float fog = 0.55 * noise(fq) + 0.3 * noise(fq * 2.3 + 3.) + 0.15 * noise(fq * vec2(4.6, 6.1) + 8.);
  vec3 c = mix(top, low, sat(exp(-abs(y) * mix(5.5, 2.2, thick) * (y < 0. ? 1.7 : 1.)) * (0.45 + 0.6 * fog))) * (0.75 + 0.5 * fog);
  vec2 g = p * 34., id = floor(g);
  g -= id + 0.15 + 0.7 * hash22(id);
  c += vec3(0.5, 0.6, 0.75) * paDark * paDn(0.07, 0., length(g)) * step(0.72, hash21(id + 7.)) * sat(y * 4. - thick);
  if (y < 0.) {
    c = mix(c, mix(top * 0.42, low * 0.28, paBright), sat(dep * 2.4) * (0.6 + 0.4 * paDn(0.75, 0.3, paWave)) * (1. - 0.7 * paFlat));
    c *= 1. + paSharp * (2.6 * smoothstep(0.35, 0.8, paWave) - 0.6) * sat(dep * 6.);
    vec4 pc = piece(vec2(p.x * uRes.y / uRes.x + 0.5, sat(dep / 0.5)));
    c += pc.rgb * pc.rgb * (0.025 + 0.05 * paGlint) * smoothstep(0., 0.12, dep) * (1. + paBright);
    c += low * (0.35 * uTexture + 0.2 * paSharp) * smoothstep(0.6, 0.9, 0.3 * w1 + 0.7 * w2) * smoothstep(0., 0.1, dep);
  }
  vec3 cold = mix(vec3(0.72, 0.95, 1.), uKind[3] * uKind[3] * 1.4 + 0.15, 0.35);
  vec3 sum = vec3(0.);
  float left = 1.;
  int n = 0;
  for (int i = 0; i < 10 && left > 0.01; i++) {
    for (; n < 10; n++) {
      vec4 at = PA_BERTH[n];
      float dy = PA_SEA - 0.43 * at.y - p.y;
      if (abs(p.x - at.x * paW) < 0.05 + (n == 0 ? 1.35 : 0.75) * at.y + 0.15 * max(dy, 0.) && -dy < 0.07 + (n == 0 ? 1.4 : 0.85) * at.y && (at.w >= 0. || uOwn[5] > 0.01)) break;
    }
    if (n > 9) break;
    vec4 at = PA_BERTH[n];
    float wl = PA_SEA - 0.43 * at.y - (n == 0 ? 0.05 * uOwn[4] : 0.);
    int kind = n < 5 ? n : n - 5;
    float there = at.w < 0. ? smoothstep(0., 0.8, uOwn[5]) : n == 0 || n == 4 ? 1. : smoothstep(-1., -0.3, uOwn[5]);
    float s = at.y * (n == 0 ? exp2(0.6 * uOwn[4]) * paFit() : 1.);
    vec2 o = vec2(at.x * paW, wl);
    float far_ = 1. - sqrt(at.y), order = abs(at.w), thru = there * exp(-far_ * (0.7 + 1.2 * thick));
    // riding lamp, shuttered lamp
    vec2 a = vec2(-0.42 * at.z, 0.505) * s + o, b = vec2(-0.105 * at.z, 0.5) * s + o;
    sum += left * mix(paWarm, uKind[kind] * uKind[kind] * 1.4, 0.35) * paLamp(p, a, wl, s, thick) * (0.62 + 0.5 * (kind == 0 ? uDrone : kind == 1 ? uPad : kind == 2 ? uTexture : kind == 3 ? uPhrase : uLow)) * thru * 1.6;
    float say = paSign(uTime + 300. - 1.4 * order) * (n == 0 ? sat(0.15 * uLevel + 1.3 * uPhrase) : 1.1 * sat(uLevel * 2.4));
    say = max(say, 1.5 * paEcho(order)) * there * exp(-far_ * 1.2) * 1.8;
    sum += left * mix(cold, uKind[4], 0.3 * uHits) * paLamp(p, b, wl, s * 1.25, thick) * say;
    // the hull and its image
    vec2 q = p - o;
    bool under = q.y < 0.;
    float soft = paPx / s, shown = there;
    if (under) {
      q.x += (paWave - 0.5) * 0.35 * min(-q.y, 0.2) * paChop;
      q.y = -q.y; soft += 0.03 + 0.25 * q.y; shown *= 0.8 * exp(-q.y / s * 1.4);
    }
    q /= s;
    q.x = q.x * at.z + 0.006 * sin(uTime * 0.31 + float(n) * 2.) * paChop * q.y;
    float m = 0.;
    vec3 hullC = vec3(0.);
    if (abs(q.x) < 0.8 && q.y < 0.82) {
      vec3 sh = paShip(q, soft, n == 0 && !under);
      m = sh.x * shown;
      hullC = mix(top * 0.18, low * 0.06, 0.3) * (1. + 0.5 * sat(q.y * 3.) + (under ? 0. : 1.3) * sh.z);
      float veil = sat(1. - exp(-far_ * (1.2 + 1.9 * thick)) + 0.5 * thick * exp(-q.y * s * 22.) * (fog + 0.15) * (under ? 0.5 : 1.));
      hullC = mix(hullC, c, veil) + paWarm * sh.y * (0.05 + 1.1 * uKeys + 0.3 * uMic) * thru;
    }
    sum += left * m * hullC;
    left *= 1. - m;
    n++;
  }
  // the guard boat's beam
  g = p - vec2(-0.8 * paW, PA_SEA - 0.135);
  float r = length(g), ang = g.y / max(g.x, 0.01) - 0.05 - 0.16 * sin(TAU * uLoop);
  float beam = exp(-ang * ang / 0.0022 - r * 1.5) * smoothstep(0., 0.05, g.x) * (0.5 + fog) * (0.4 + thick);
  return sum + left * c + cold * (beam * (0.05 + 0.1 * uLevel) + 0.3 * exp(-r / 0.007));
}
vec3 render(vec2 p) {
  paW = clamp(0.5 * uRes.x / uRes.y, 0.28, 0.95);
  paPx = 1. / uRes.y;
  paSnow = max(-uOwn[0], 0.); paGold = max(uOwn[0], 0.);
  paDark = max(-uOwn[1], 0.); paBright = max(uOwn[1], 0.);
  paFlat = max(-uOwn[3], 0.); paSharp = max(uOwn[3], 0.);
  return uVar < 0.5 ? paDay(p) : screenOf(paNight(p));
}
