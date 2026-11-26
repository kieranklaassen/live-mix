// name: House brush
// a: Five bars
// b: Crossed
// what: Five great strokes of house paint on warm white primed canvas, dry at their ragged ends, with bristle gaps, ridges that catch a window, flecks and drips: two upright, two level and a short slash, with much of the canvas bare; or five that cross in a knot low on the left, one of them whitewash dragged grey through wet black.
// follows: Each kind is a stroke: drone the widest, pad, texture the driest, phrase, hits the slash. Loudness and the piece load it fuller, blacker and longer. The spectrum fills sixteen bundles of bristle. A hit wets the slash and throws flecks; a cue floods all five with gloss. The loop slides the sheen, beads run down the drips, a voice warms the window light.
const vec2 HBL = vec2(-0.91, 0.414);  // where the window is
float hbPx, hbTooth, hbWide, hbFat;   // a pixel; the weave of the canvas here; how far apart and how fat in this shape of picture
vec2 hbA, hbDir;                      // the stroke being looked at: its start and the way it was drawn
float hbL, hbW, hbBow, hbSeed, hbLoad, hbLen, hbWet, hbRow; // its length, half width, bend, seed, load, how far it got, how wet, its row in the piece
vec2 hbAt, hbDrops; float hbThick, hbHair, hbN1, hbMap; // where we are in it (along, across), where it drips, how thick the paint is, the hair that drew it, two things read once
float hbSq(float x) { return x * x; }
float hbGo(float v) { return sqrt(sat(v)); }
// Where stroke k lies: start and end; half width, bend, where along it drips.
void hbPlace(int k) {
  bool b = uVar > 0.5;
  vec4 e, f;
  if (k == 0) { e = b ? vec4(1.02, 0.524, -0.8, -0.46) : vec4(-0.45, 0.62, -0.5, -0.33); f = b ? vec4(0.125, 0.02, 0.244, 0.556) : vec4(0.148, 0.016, 0.82, 2.0); hbRow = 0.85; }
  else if (k == 1) { e = b ? vec4(-0.46, 0.58, -0.16, -0.5) : vec4(1.02, 0.2, -0.16, 0.25); f = b ? vec4(0.09, -0.02, 2.0, 2.0) : vec4(0.1, -0.02, 0.57, 0.2); hbRow = 0.5; }
  else if (k == 2) { e = b ? vec4(-0.98, -0.02, 0.66, -0.2) : vec4(0.5, -0.06, 0.45, -0.6); f = b ? vec4(0.066, 0.016, 2.0, 2.0) : vec4(0.082, 0.012, 2.0, 2.0); hbRow = 0.68; }
  else if (k == 3) { e = b ? vec4(0.02, 0.43, -0.48, -0.47) : vec4(-0.98, -0.42, 0.2, -0.4); f = b ? vec4(0.056, 0.016, 2.0, 2.0) : vec4(0.052, -0.012, 2.0, 2.0); hbRow = 0.18; }
  else { e = b ? vec4(-0.74, 0.12, -0.5, 0.33) : vec4(-0.02, -0.22, 0.24, 0.06); f = b ? vec4(0.042, 0.016, 2.0, 2.0) : vec4(0.046, 0.016, 2.0, 2.0); hbRow = 0.29; }
  e *= vec4(hbWide, 1.0, hbWide, 1.0);
  hbA = e.xy; hbDir = e.zw - e.xy; hbL = length(hbDir); hbDir /= hbL;
  hbW = f.x * hbFat; hbBow = f.y; hbDrops = f.zw; hbSeed = 3.7 + 11.3 * float(k);
}
// How its kind of sound loads it.
void hbHear(int k) {
  float go = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? max(uPhrase, 0.6 * uKeys) : max(uHits, 0.35 * uLevel);
  float g = hbGo(go) * mix(0.8, 1.2, uEnergy), swell = 4.0 * uCue * (1.0 - uCue);
  hbLoad = 0.8 - (k == 2 ? 0.08 : 0.0) + 0.38 * g + 0.22 * swell + 0.03 * sin(uTime * 0.07 + hbSeed);
  hbLen = 0.8 + 0.16 * (k == 4 ? hbGo(0.35 * uLevel) : sat(g)); // a hit makes the slash fuller and wetter, never longer
  hbWet = 0.45 + 0.35 * g + 0.8 * uCue + (k == 4 ? uHits : 0.0) + (k == 3 ? 0.5 * uKeys : 0.0);
}
// What ran down from the stroke: a drip is as long as its stroke is loaded, and a wet bead goes down it.
float hbDrip(vec2 d, out float high) {
  float cov = 0.0; high = 0.0;
  float there = smoothstep(0.86, 1.06, hbLoad);
  for (int j = 0; j < 2; j++) {
    vec2 o = d - hbDir * hbL * hbDrops[j];
    float fj = float(j), run = hbW + (0.14 + 0.12 * fj) * smoothstep(0.86, 1.2, hbLoad), low = -o.y;
    o.x += 0.0025 * sin(o.y * 31.0 + hbSeed) - 0.3 * hbW * hbDir.y;
    if (abs(o.x) > 0.014 || low < 0.0 || low > run + 0.02) continue;
    float at = fract(uTravel * 0.03 + 0.37 * hbSeed + 0.5 * fj);
    float r = 0.0026 + 0.002 * fj + 0.002 * smoothstep(run - 0.05, run, low) + 0.003 * sin(PI * at) * exp(-hbSq((low - at * run) / 0.011));
    r *= 0.15 + 0.85 * there;
    float l = length(vec2(o.x, max(low - run, 0.0)));
    cov = max(cov, there * sat(0.5 - (l - r) / (1.6 * hbPx))); high = max(high, 1.3 * sqrt(sat(1.0 - hbSq(l / r))));
  }
  return cov;
}
// The stroke at one place: how much paint covers (cov), and how high it stands.
float hbLay(vec2 p, bool first, out float cov) {
  vec2 d = p - hbA;
  float s = dot(d, hbDir), v = dot(d, vec2(-hbDir.y, hbDir.x)), x = s / hbL, cx = sat(x), dripHigh = 0.0, drip = 0.0;
  if (hbDrops.x < 1.0) drip = hbDrip(d, dripHigh);
  cov = drip; hbThick = 1.0; hbHair = 0.5;
  v -= hbBow * 4.0 * cx * (1.0 - cx) + 0.004 * sin(s * 7.0 + hbSeed);
  float w = hbW * (1.0 + 0.03 * sin(s * 5.0 + hbSeed * 3.0) - 0.06 * cx);
  float y = v / w, ay = abs(y);
  hbAt = vec2(x, y);
  if (first) { hbN1 = 0.5; hbMap = 0.0; }
  if (x < -0.06 || x > 1.18 || ay > 1.06) return drip * dripHigh;
  // the sides waver, each in its own way; the start is set down blunt
  float in1 = 1.0 - ay, s0 = s - 0.01;
  if (ay > 0.8) {
    float side = v > 0.0 ? 3.1 : 8.7, nick = noise(vec2(s * 37.0, hbSeed * 2.0 + side));
    in1 += 0.04 - 0.06 * noise(vec2(s * 6.0, hbSeed + side)) - 0.07 * nick * nick * nick;
  }
  if (s < 0.1) s0 = s - 0.022 * noise(vec2(y * 3.0, hbSeed)) - 0.008 * noise(vec2(y * 14.0, hbSeed)) - 0.012 * y * y * y * y;
  // bundles of bristles, then hairs, both drawn out along the stroke
  if (first) { hbN1 = noise(vec2(s * 2.0 + hbSeed, y * 6.0 + hbSeed * 5.0)); hbMap = piece(vec2(cx, hbRow)).a; }
  float n1 = hbN1, n2 = noise(vec2(s * 4.5, v * 160.0 + hbSeed * 9.0)), n3 = noise(vec2(s * 9.0 + 3.0, v * 70.0 + hbSeed * 4.0));
  float u = (y * 0.5 + 0.5) * 16.0 + 2.2 * (n1 - 0.5) + 0.35 * sin(y * 17.0 + hbSeed), f = fract(u) - 0.5;
  float gap = 4.0 * f * f * (0.3 - 0.4 * band(u / 16.0));
  float load = hbLoad * (1.0 - 0.5 * hbSq(cx / hbLen)) - 1.7 * smoothstep(hbLen - 0.12, hbLen + 0.16, x);
  load += 0.3 * exp(-max(s0, 0.0) * 14.0) + 0.18 * hbMap;
  float dep = load - 0.5 * n1 - 0.26 * n2 - 0.24 * n3 - 0.2 * hbTooth - gap - 0.25 * (1.0 - smoothstep(0.0, 0.2, in1)) * sat(1.3 - load);
  float aa = hbPx * 1.2;
  float c = smoothstep(0.0, aa / w + 0.02, in1) * smoothstep(-aa * 0.5, aa, s0) * smoothstep(-0.05, 0.1, dep);
  float ridge = exp(-hbSq((in1 - 0.07) / 0.05)) + 0.8 * exp(-hbSq((s0 - 0.008) / 0.007));
  drip *= 1.0 - c;
  hbThick = max(sat(dep), drip); hbHair = 0.5 * (n2 + n3);
  cov = max(drip, c);
  return drip * dripHigh + c * sqrt(sat(in1 / 0.05 + 0.05)) * (0.3 + 0.35 * sat(dep) + 0.2 * n2 + 0.4 * n3 + 0.5 * n3 * f * f + ridge * (0.2 + 0.7 * sat(load)));
}
// Flecks thrown off the slash: a few always there, more on a hit, the near ones first.
float hbFlecks(vec2 p) {
  vec2 across = vec2(-hbDir.y, hbDir.x), g = floor(p / 0.03), h = hash22(g + 7.0);
  vec2 c = (g + 0.5 + 0.5 * (hash22(g + 31.0) - 0.5)) * 0.03, o = p - c, d = c - hbA - hbDir * hbL;
  float far = length(d);
  if (far > 0.5) return 0.0;
  float fan = exp(-hbSq(dot(d, across) / 0.16)) * smoothstep(-0.12, 0.02, dot(d, hbDir)) * (1.0 - smoothstep(0.0, 0.5, far));
  float old = step(h.y, 0.22 * fan), thrown = step(h.y, 0.75 * fan) * smoothstep(0.0, 0.5, uHits) * smoothstep(0.0, 0.08, (1.0 - uHits) * 0.6 + 0.2 - far);
  float r = 0.03 * mix(0.03, 0.22, h.x * h.x * h.x) * max(old, thrown), l = length(vec2(dot(o, hbDir) * 0.75, dot(o, across) * 1.15));
  return sat(0.5 - (l - r) / (1.6 * hbPx)) * sat(r / hbPx);
}
// Soft noise with how it changes (x: the value; y, z: across and up).
vec3 hbNoise(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1)), k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
vec3 render(vec2 p) {
  bool b = uVar > 0.5;
  hbPx = 1.0 / uRes.y;
  float asp = uRes.x / uRes.y / 1.78;
  hbWide = clamp(asp, 0.34, 1.25); hbFat = mix(0.6, 1.0, sat((asp - 0.3) / 0.7));
  float e = max(hbPx, 0.0016);
  vec2 q = p + HBL * e;
  // the weave: threads across and threads up
  vec3 ta = hbNoise(p * vec2(380.0, 100.0)), tb = hbNoise(p * vec2(100.0, 380.0) + 40.0);
  hbTooth = 0.5 * (ta.x + tb.x);
  // primed canvas: old whitewash brushed this way and that
  float h1 = 0.0, h2 = 0.13 * 0.35 * e * dot(HBL, ta.yz * vec2(380.0, 100.0) + tb.yz * vec2(100.0, 380.0));
  float wa = noise(vec2(p.x * 2.4, p.y * 62.0 + 5.0 * p.x)), wb = noise(vec2(p.x * 70.0 + p.y * 12.0, p.y * 2.2));
  float lay = sin(p.x * 4.7 + 1.6 * sin(p.y * 4.1 + 0.7) + 0.6);
  float patch1 = smoothstep(-0.12, 0.12, lay + 0.9 * (mix(wb, wa, 0.5) - 0.5));
  vec3 col = mix(vec3(0.875, 0.85, 0.8), vec3(0.935, 0.93, 0.905), mix(wa, wb, patch1) * 0.5 + 0.35 * patch1 + 0.15 * hbTooth);
  float gloss = 0.0; vec3 glaze = vec3(0.0);
  // the oil of a hit soaks the canvas round the slash for a moment
  hbPlace(4);
  float fl = hbFlecks(p);
  vec2 sd = p - hbA - hbDir * hbL * 0.6;
  col *= 1.0 - 0.16 * uHits * exp(-dot(sd, sd) * 26.0);
  // which strokes can be here, in the order they were painted
  int on[5] = int[5](0, 0, 0, 0, 0), many = 0;
  for (int k = 0; k < 5; k++) {
    hbPlace(k);
    vec2 m = p - hbA - hbDir * hbL * 0.5;
    bool off = abs(dot(m, hbDir)) > hbL * 0.69 || abs(m.y * hbDir.x - m.x * hbDir.y) > hbW * 1.1 + abs(hbBow) + 0.01;
    if (off && hbDrops.x < 1.0) {
      vec2 o = vec2(p.x - hbA.x - 0.3 * hbW * hbDir.y, hbA.y - p.y);
      off = min(abs(o.x - hbDir.x * hbL * hbDrops.x), abs(o.x - hbDir.x * hbL * hbDrops.y)) > 0.025 || o.y < -0.02 || o.y > max(0.0, -hbDir.y * hbL) + 0.45;
    }
    if (!off) { on[many] = k; many++; }
  }
  for (int n = 0; n < many; n++) {
    int k = on[n];
    hbPlace(k); hbHear(k);
    float c1, c2;
    float b1 = hbLay(p, true, c1); vec4 was = vec4(hbAt, hbThick, hbHair);
    float b2 = hbLay(q, false, c2);
    if (c1 < 0.002) continue;
    h1 = mix(h1, h1 * 0.05 + b1, c1); h2 = mix(h2, h2 * 0.05 + b2, c1 * c2);
    vec3 kc = uKind[k]; hbAt = was.xy; hbThick = was.z; hbHair = was.w;
    float body = smoothstep(0.02, 0.4, hbThick);
    vec3 ink = mix(mix(vec3(0.16), kc, 0.33) * 0.55, mix(vec3(0.03), kc * 0.1, 0.5), body);
    float streak = smoothstep(0.35, 0.7, hbHair);
    if (b && k == 1) { // whitewash, greyed by the black it was dragged through
      float dirt = smoothstep(0.5, 0.62, hbAt.x) * (0.35 + 0.65 * streak) * 0.75;
      ink = mix(mix(vec3(0.62), vec3(0.93, 0.925, 0.9), body), vec3(0.2) + 0.12 * kc, dirt);
    }
    if (b && k == 2) ink = mix(ink, vec3(0.62), streak * smoothstep(0.38, 0.44, hbAt.x) * exp(-max(hbAt.x - 0.42, 0.0) * 4.0) * 0.6);
    if (b && k == 3) ink = mix(ink, vec3(0.6), streak * smoothstep(0.5, 0.6, hbAt.x) * 0.4);
    col = mix(col, ink, c1 * mix(0.8, 1.0, body));
    float sheen = 0.55 + 0.45 * cos(TAU * (hbAt.x * 0.8 - uLoop - uTime * 0.015) + float(k) * 1.7);
    gloss = mix(gloss, hbWet * sheen, c1); glaze = mix(glaze, kc, c1);
  }
  col = mix(col, vec3(0.035) + 0.06 * uKind[4], fl);
  float g = (h1 - h2) * 0.006 / e; // leaning to the window is more than 0
  float lumi = dot(col, vec3(0.333));
  col *= 1.0 + clamp(g * 0.4, -0.35, 0.1);
  float sp = exp(-hbSq((min(g, 0.6) - 0.5) / mix(0.4, 0.22, uTone)));
  col += (1.0 - lumi) * vec3(0.8, 0.88, 0.95) * mix(vec3(1.0), glaze * 1.5, 0.25) * gloss * (0.9 * sp + 0.08 * smoothstep(-0.3, 0.3, g));
  // window light from the left: two leaning panes of it lie on the canvas
  vec2 wp = vec2(p.x / max(hbWide, 0.5) + 0.22 * p.y + 0.42 + 0.02 * sin(uTime * 0.011), p.y - 0.18 * p.x - 0.06);
  float soft = mix(0.03, 0.12, uSpace);
  vec2 pane = 1.0 - smoothstep(vec2(0.46, 0.36) - soft, vec2(0.46, 0.36) + soft, abs(wp));
  float panes = pane.x * pane.y * (0.2 + 0.8 * smoothstep(0.0, 0.02 + soft * 0.5, abs(wp.x - 0.04)));
  float fall = 0.97 - 0.15 * smoothstep(-0.9, 1.1, p.x / max(hbWide, 0.5) - 0.35 * p.y);
  col *= vec3(fall) + panes * vec3(0.085, 0.07, 0.04) * (1.0 + 0.5 * uMic);
  return min(col, 0.97);
}
