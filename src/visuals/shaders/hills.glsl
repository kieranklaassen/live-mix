// name: Hills
// a: Dawn mist
// b: Dunes
// what: Ranges of hills one behind another at dawn with mist lying in the valleys, the far ones pale and the near ones dark; or dunes of sand in low side light with wind lifting a veil of sand from the crests.
// follows: Each range is one kind of sound: it rises a little and its mist glows in that colour as the sound plays; the low band is the breathing of the mist; the sun's glow follows the mix; a hit is a bloom of light in one valley and a cue runs light along another; on the dunes each ridge is a kind of sound, the low band is the wind and a hit is a gust.
float hiLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float hiH1(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float hiN1(float x, float seed) { x += seed * 37.7; float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hiH1(i), hiH1(i + 1.0), f); }
// A slow wave like a sine (one turn in TAU), made without one.
float hiSin(float x) { x = abs(fract(x * 0.159155) - 0.5) * 2.0; return 1.0 - 2.0 * x * x * (3.0 - 2.0 * x); }
float hiBase(float near) { return mix(0.075, -0.335, pow(near, 1.1)); }
// The line of one range across the picture. near is 0 for the last range and 1 for the nearest.
float hiRidge(float x, float fi, float near, float lift) {
  float f = mix(2.3, 0.85, near), amp = mix(0.05, 0.15, near);
  float u = x * f + fi * 17.3;
  float h = hiN1(u, fi * 3.1) + 0.5 * hiN1(u * 2.3 + 4.0, fi * 3.1 + 7.0) + 0.2 * hiN1(u * 5.9, fi + 11.0);
  h = amp * (h - 0.85) * 1.5 + 0.03 * hiSin(x * 1.1 + fi * 2.3);
  // the tops of trees along the nearer ranges
  float tf = mix(300.0, 64.0, near), tu = x * tf + 3.0 * hiN1(x * tf * 0.21, fi);
  float tip = max(0.0, 1.0 - 2.8 * abs(fract(tu) - 0.5)) * hiH1(floor(tu) + fi * 31.0);
  h += (tip * tip * 1.6 + 0.5 * hiN1(x * tf * 0.6, fi + 5.0)) / tf * smoothstep(0.3, 0.7, near);
  return hiBase(near) + h + lift;
}
float hiBird(vec2 q, float flap) {
  q.x = abs(q.x);
  float y = q.y - flap * q.x + (0.5 + abs(flap)) * q.x * q.x * 16.0;
  return smoothstep(0.003, 0.001, abs(y)) * smoothstep(0.03, 0.02, q.x);
}
vec3 hiDawn(vec2 p) {
  float px = 1.2 / uRes.y;
  float drift = uTravel * 0.012 + uTime * 0.002;
  float breath = 0.5 + 0.5 * hiSin(uTime * 0.21);
  float lvl = uLevel;
  // the sky: night still high up, rose and gold low down where the sun is coming
  vec2 sun = vec2(0.24, 0.078);
  float up = p.y - 0.03;
  vec3 col = mix(vec3(0.4, 0.13, 0.08), vec3(0.085, 0.035, 0.1), sat(up * 4.8));
  col = mix(col, vec3(0.003, 0.008, 0.032), smoothstep(0.06, 0.46, up));
  float ds = length((p - sun) * vec2(0.5, 1.0));
  float glow = 0.22 + 1.1 * lvl;
  float ang = atan(p.y - sun.y, p.x - sun.x);
  float rays = noise(vec2(ang * 7.0, uTime * 0.03)) * noise(vec2(ang * 19.0 + 4.0, uTime * 0.05));
  col += vec3(1.0, 0.33, 0.1) * glow * 0.5 * exp(-ds * 5.0) * (0.7 + 1.5 * rays);
  col += vec3(1.0, 0.68, 0.32) * glow * 1.4 * exp(-ds * 17.0);
  col += vec3(1.0, 0.92, 0.75) * glow * 4.0 * smoothstep(0.03, 0.026, length(p - sun));
  // thin high cloud, lit from under
  vec2 cq = vec2(p.x * 1.2 + drift * 0.4, p.y * 10.0 + 3.0);
  float ci = 0.55 * noise(cq) + 0.3 * noise(cq * 2.1 + 5.0) + 0.15 * noise(cq * 4.3 + 9.0);
  float cm = smoothstep(0.48, 0.8, ci) * smoothstep(0.03, 0.12, up) * smoothstep(0.5, 0.18, up);
  col = mix(col, (vec3(0.75, 0.22, 0.14) * exp(-ds * 2.6) + vec3(0.06, 0.03, 0.065)) * (0.5 + lvl), cm * 0.6);
  // birds, far off, crossing slowly
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 at = vec2(1.2 - 2.6 * fract(uTime * 0.012 + 0.31), 0.2) + vec2(0.08 * fk - 0.03 * hiH1(fk + 1.0), 0.03 * hiH1(fk + 4.0) + 0.012 * hiSin(uTime * 0.3 + fk * 2.0));
    float b = hiBird((p - at) * 1.5, 0.8 * hiSin(uTime * 2.8 + fk * 1.7));
    col = mix(col, vec3(0.015, 0.012, 0.025), b * 0.8);
  }
  float hitX = -0.28 + 0.25 * hiSin(uTime * 0.13), cueX = -1.1 + 2.2 * (1.0 - uCue);
  for (int i = 0; i < 6; i++) {
    float fi = float(i), near = fi / 5.0;
    int kind = min(5 - i, 4); // the drone is the nearest range; the last two are far off
    float lv = i == 0 ? 0.0 : hiLv(kind);
    vec3 kc = uKind[kind]; kc = kc * kc * 1.5 + kc * 0.15;
    float x = p.x + drift * mix(0.2, 2.2, near * near);
    float h = hiRidge(x, fi, near, 0.03 * lv * (1.0 - 0.4 * near));
    float below = h - p.y;
    float mask = smoothstep(-px, px, below);
    // the range itself: paler and bluer the further off, a little light caught along its top on the side of the sun
    float toSun = exp(-abs(p.x - sun.x) * mix(1.4, 2.4, near));
    vec3 far = vec3(0.07, 0.06, 0.125) + vec3(0.3, 0.09, 0.03) * toSun * (0.3 + lvl);
    vec3 body = mix(far, vec3(0.0025, 0.006, 0.01), pow(near, 0.5));
    body *= 0.7 + 0.6 * noise(vec2(x * mix(14.0, 6.0, near) + fi * 9.0, (p.y - h * 0.7) * mix(50.0, 20.0, near)));
    float rim = exp(-max(below, 0.0) * mix(300.0, 90.0, near)) * toSun;
    body += vec3(1.0, 0.45, 0.2) * rim * (0.04 + 0.2 * lvl) * mix(1.0, 0.3, near);
    col = mix(col, body, mask);
    // the mist lying in front of this range, in the valley before the next: flat on top like a lake
    float b0 = hiBase(near), b1 = hiBase(min(near + 0.2, 1.25));
    float gap = b0 - b1;
    vec2 mq = vec2(x * 1.6 + uTime * 0.012 * (1.0 + fi * 0.3) + fi * 5.0, p.y * 6.0 - uTime * 0.008);
    float wisp = noise(mq) * 0.65 + noise(mq * vec2(2.7, 3.4) + 5.0) * 0.35;
    float top = b1 + gap * (0.15 + 0.5 * uLow * (0.5 + 0.5 * breath) + 0.15 * breath) + (wisp - 0.5) * gap * 1.5;
    float dens = smoothstep(top + gap * 0.8, top - gap * 0.5, p.y);
    dens *= 0.55 + 0.45 * noise(mq * vec2(4.0, 9.0) + 9.0);
    vec3 mist = mix(vec3(0.15, 0.085, 0.14), vec3(0.016, 0.03, 0.06), pow(near, 0.7)) * (0.6 + 0.7 * lvl);
    mist += vec3(1.0, 0.4, 0.14) * toSun * (0.1 + 0.5 * lvl) * mix(1.0, 0.1, near) * (0.7 + 1.5 * rays);
    mist += kc * lv * mix(0.6, 0.35, near) * (0.35 + 1.1 * wisp);
    float hd = length(vec2(p.x - hitX, (p.y - top + 0.02) * 2.4));
    if (i == 3) mist += mix(vec3(1.0, 0.8, 0.55), uKind[4], 0.35) * uHits * 1.5 * exp(-hd * hd * 24.0);
    float cd = length(vec2((p.x - cueX) * 0.8, (p.y - top + 0.02) * 2.6));
    if (i == 4) mist += vec3(1.0, 0.75, 0.5) * uCue * 1.1 * exp(-cd * cd * 14.0);
    col = mix(col, mist, dens * 0.88);
  }
  // the near slope, almost black, with the tops of its trees
  float xn = p.x + drift * 3.2;
  float hn = -0.5 + 0.1 * hiN1(xn * 0.8 + 40.0, 3.0) + 0.03 * hiN1(xn * 2.6, 9.0);
  float tu = xn * 23.0 + 2.5 * hiN1(xn * 5.0, 1.0);
  float tip = max(0.0, 1.0 - 2.5 * abs(fract(tu) - 0.5)) * hiH1(floor(tu));
  float tu2 = xn * 61.0 + 2.0 * hiN1(xn * 14.0, 2.0), tip2 = max(0.0, 1.0 - 2.5 * abs(fract(tu2) - 0.5)) * hiH1(floor(tu2) + 9.0);
  hn += (0.11 * tip * tip * tip + 0.025 * tip2) * (0.3 + 0.7 * smoothstep(0.3, 0.7, hiN1(xn * 2.0, 5.0)));
  col = mix(col, vec3(0.002, 0.004, 0.006), smoothstep(-px, px, hn - p.y));
  return col;
}
// The dunes. Returns the height; hiS.x is how far across its ridge the place is (0 the trough, hiCrest the crest), hiS.y which ridge.
const float hiCrest = 0.66;
vec2 hiS;
float hiPile;
const mat2 hiRot = mat2(0.9553, -0.2955, 0.2955, 0.9553);
float hiDuneH(vec2 x) {
  vec2 r = hiRot * x;
  float w = 1.5 * hiSin(r.y * 0.15 + 0.9 * hiSin(r.x * 0.1)) + 0.6 * hiSin(r.y * 0.41 + 1.7);
  float u = r.x * 0.19 + w * 0.3;
  float id = floor(u), s = u - id, up = s / hiCrest;
  float ramp = s < hiCrest ? up * sqrt(up) : (1.0 - s) / (1.0 - hiCrest);
  float kind = id - 5.0 * floor(id * 0.2);
  float lv = kind < 0.5 ? uDrone : kind < 1.5 ? uPad : kind < 2.5 ? uTexture : kind < 3.5 ? uPhrase : 0.3 * uHits;
  float pile = 0.3 + 1.9 * hiN1(r.y * 0.11, id) + 0.2 * lv;
  hiS = vec2(s, kind); hiPile = pile;
  return pile * ramp;
}
vec3 hiDuneSky(vec3 rd, vec3 L, float lvl) {
  float y = max(rd.y, 0.0);
  vec3 col = mix(vec3(0.36, 0.12, 0.07), vec3(0.08, 0.035, 0.1), sat(y * 4.5));
  col = mix(col, vec3(0.003, 0.008, 0.032), smoothstep(0.03, 0.34, y));
  float m = sat(dot(normalize(vec3(rd.x, y, rd.z)), L)), m2 = m * m, m4 = m2 * m2;
  col += vec3(1.0, 0.4, 0.1) * (0.2 + 0.6 * lvl) * (m4 / (1.0 + 40.0 * y * y) + 0.7 * m4 * m4 * m4 * m4 * m4);
  return col;
}
vec3 hiDunes(vec2 p) {
  float lvl = uLevel, wind = 0.2 + 0.8 * uLow;
  vec3 ro = vec3(uTravel * 0.1, 2.5, uTravel * 0.03);
  vec3 rd = normalize(vec3(p.x, p.y - 0.14, 1.0));
  vec3 L = normalize(vec3(-0.86, 0.22, 0.42));
  float t = 0.6 + 0.3 * hash21(gl_FragCoord.xy), d = 1.0, dPrev = 1.0, st = 0.0;
  float veil = 0.0;
  vec3 veilC = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    vec3 q = ro + rd * t;
    float bowl = 0.0016 * t * t;
    dPrev = d;
    d = q.y - hiDuneH(q.xz) - bowl;
    // sand in the air: a thin sheet streaming off each crest
    float past = hiS.x - hiCrest;
    float sheet = past > 0.0 ? exp(-abs(q.y - bowl - hiPile + past * 0.8 - 0.04) * 14.0 - past * 26.0) : exp(-max(d, 0.0) * 16.0) * smoothstep(-0.12, 0.0, past);
    float a = sheet * st * step(0.0, d) / (1.0 + 0.05 * t);
    int kd = int(hiS.y);
    veil += a; veilC += a * uKind[kd] * uKind[kd] * hiLv(kd);
    if (d < 0.0 || t > 70.0) break;
    st = max(d * 0.5, 0.01 * t);
    t += st;
  }
  if (d < 0.0) t -= st * d / (d - dPrev);
  vec3 col = hiDuneSky(rd, L, lvl);
  // thin cloud low in the sky, catching the last of the light
  float ci = noise(vec2(p.x * 1.4 + uTime * 0.004, p.y * 12.0)) * 0.65 + noise(vec2(p.x * 4.0, p.y * 30.0) + 3.0) * 0.35;
  col += vec3(0.6, 0.16, 0.08) * (0.3 + lvl) * smoothstep(0.48, 0.85, ci) * smoothstep(0.5, 0.2, p.y) * (0.35 + 0.5 * sat(0.6 - p.x));
  vec3 horizon = hiDuneSky(normalize(vec3(rd.x, 0.02, rd.z)), L, lvl);
  if (t < 70.0) {
    vec3 q = ro + rd * t;
    float e = 0.004 * t + 0.004, bowl = 0.0016 * t * t;
    float h0 = hiDuneH(q.xz);
    vec2 s0 = hiS;
    vec3 n = normalize(vec3(h0 - hiDuneH(q.xz + vec2(e, 0.0)), e, h0 - hiDuneH(q.xz + vec2(0.0, e))));
    float lee = step(hiCrest, s0.x);
    // fine ripples across the wind, lost with distance
    vec2 rr = hiRot * q.xz;
    float rp = sin(rr.x * 30.0 + 5.0 * noise(rr * 1.1) + 2.5 * noise(rr.yx * 4.0));
    float rfade = (1.0 - 0.85 * lee) / (1.0 + 0.012 * t * t);
    n = normalize(n + vec3(0.95, 0.0, 0.3) * rp * 0.4 * rfade);
    float dif = sat(dot(n, L));
    // the shadow a crest throws across the next dune
    float sh = 1.0;
    for (int k = 1; k < 5; k++) {
      float ds = 0.4 * float(k * k);
      vec3 qs = q + L * ds;
      sh = min(sh, smoothstep(-0.02, 0.05 * ds + 0.02, qs.y - hiDuneH(qs.xz) - bowl));
    }
    int kd = int(s0.y);
    float lv = hiLv(kd);
    vec3 kc = uKind[kd]; kc = kc * kc * 1.5 + kc * 0.2;
    vec3 sand = vec3(0.6, 0.33, 0.19) * (0.8 + 0.4 * noise(q.xz * 0.4)) * (1.0 + 0.1 * rp * rfade);
    vec3 sunC = vec3(1.0, 0.36, 0.09) * (0.4 + 1.5 * lvl);
    vec3 amb = vec3(0.016, 0.03, 0.12) * (0.3 + 0.9 * n.y) + vec3(0.05, 0.012, 0.01) * sat(0.3 - n.x);
    float off = abs(s0.x - hiCrest);
    float crest = 1.0 / (1.0 + 120.0 * off * off);
    col = sand * (sunC * dif * sh * (0.75 + 0.6 * crest) + amb);
    col += sand * kc * lv * (0.3 * dif * sh + 0.06 + 0.9 * crest * sh * (0.3 + dif));
    // a bright edge where the light skims the crest
    col += (sunC * 0.6 + kc * lv) * 0.3 * sh / (1.0 + 3000.0 * off * off);
    col = mix(horizon * 0.75, col, exp(-t * 0.03));
  }
  // the veil of sand, lit from behind
  float m = sat(dot(rd, L));
  float streak = noise(vec2(p.x * 3.0 - uTime * 0.25, p.y * 9.0 + p.x * 3.0)) * (0.5 + noise(vec2(p.x * 11.0 - uTime * 0.6, p.y * 40.0)));
  vec3 vc = vec3(1.0, 0.48, 0.2) * (0.2 + 0.7 * lvl) * (0.3 + 1.5 * m * m * m) + veilC / max(veil, 0.0001) * 1.1;
  float gx = p.x + 0.25 - 0.3 * hiSin(uTime * 0.11), cx = p.x - 1.0 + 2.0 * uCue;
  float gust = uHits / (1.0 + 30.0 * gx * gx) + uCue / (1.0 + 20.0 * cx * cx);
  col += vc * (1.0 - exp(-veil * (0.35 + 1.8 * wind + 7.0 * gust))) * (0.4 + 0.9 * streak) * (1.0 + 1.6 * gust);
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? hiDawn(p) : hiDunes(p));
}
