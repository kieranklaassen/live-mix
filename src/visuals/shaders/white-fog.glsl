// name: White fog
// a: Snow field
// b: Bare trees
// what: A white field with no horizon and the few things the fog lets be seen: a line of posts walking off, a hut under snow, one bare tree with a crow on its bough, a far row of firs; or pruned apple trees on a slope, row behind row into pale nothing, a ladder leaning in the near one and five red apples nobody picked.
// follows: Each kind clears the fog at its own depth: drone the firs or far rows, pad the fence or middle rows, texture the hut or second row, phrase the near tree. The level dims the light, low lifts ground mist, the bands set the firs' heights, the loop walks a thin place by. A hit drops snow and lifts the crow, a cue opens a clear lane, keys warm window or apples.
float wfPx, wfW, wfLoopX, wfLoopA, wfCap, wfN2;
float wfKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float wfSq(float x) { return x * x; }
float wfH(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float wfN(float x) { float i = floor(x), f = fract(x); return mix(wfH(i), wfH(i + 1.0), f * f * (3.0 - 2.0 * f)); }
// The ink of one kind: nearly black, with a little of its colour in it.
vec3 wfInk(int k) { vec3 c = uKind[k]; return mix(vec3(0.085, 0.09, 0.1), c * c * 0.45, 0.12 + 0.16 * uEnergy); }
// A thin stroke: how much of a pixel d away from its middle a line of half width w covers.
float wfLine(float d, float w, float px) { float v = max(w, 0.55 * px); return sat((v - abs(d)) / px + 0.5) * min(1.0, w / v); }
// The rest of a whole number over 1021, exact, without a slow division.
int wfMod(int n) { return n - 1021 * int((float(n) + 0.5) * (1.0 / 1021.0)); }
// A bare tree of height about 1 growing from the origin. At each fork only the two limbs nearest the pixel are followed on.
// pruned is for a tree that is cut back each year. Every limb has a whole number, so each card grows the same tree.
float wfTree(vec2 p, int seed, int n, bool pruned, vec2 lean, float px) {
  wfCap = 0.0;
  vec4 na, nb = vec4(0.0);                    // a limb's end and its direction
  vec2 ma, mb = vec2(0.0);                   // its length and its thickness
  int ia = seed, ib = 0;                     // its number
  vec2 d0 = normalize(lean), s0 = vec2(d0.y, -d0.x);
  float l0 = 0.2, w0 = pruned ? 0.034 : 0.026, turn0 = float(seed);
  float along = dot(p, d0), tr = sat(along / l0), side = dot(p, s0) - 0.012 * sin(tr * 5.0 + turn0) * tr;
  float cov = sat((w0 * (1.0 + 0.5 * exp(-tr * 9.0) - 0.22 * tr) - abs(side)) / px + 0.5) * step(-0.01, along) * step(along, l0 + 0.5 * w0);
  if (pruned && p.y < 0.1) return cov;
  na = vec4(d0 * l0 + s0 * 0.012 * sin(5.0 + turn0), d0); ma = vec2(l0, w0 * 0.8);
  bool two = false;
  for (int i = 0; i < n; i++) {
    vec4 a1 = vec4(0.0), b1 = vec4(0.0); vec2 am = vec2(0.0), bm = vec2(0.0);
    int ka = 0, kb = 0;
    float sa = 1e3, sb = 1e3;
    for (int k = 0; k < 4; k++) {
      if (k > 1 && !two) break;
      vec4 N = k < 2 ? na : nb; vec2 M = k < 2 ? ma : mb;
      int own = k < 2 ? ia : ib, kid = wfMod(own * 171 + 37 + (k & 1) * 411);
      float sd = (k & 1) == 0 ? -1.0 : 1.0, h = float(kid) / 1021.0, h2 = float(wfMod(kid * 89 + 17)) / 1021.0;
      bool lead = ((own * 5 / 7) & 1) == (k & 1);
      float turn = lead ? 0.08 + 0.3 * h : 0.5 + 0.6 * h, up = 0.03;
      float ln = M.x * (lead ? 0.78 + 0.16 * h2 : 0.6 + 0.25 * h2), w = M.y * (lead ? 0.76 : 0.58);
      if (pruned) {                        // a low crown of knuckles and upright shoots
        turn = i == 0 ? 0.4 + 0.65 * h : 0.22 + 0.45 * h; up = i == 0 ? 0.0 : 0.4;
        ln = M.x * (i == 0 ? 0.95 : 0.7 + 0.3 * h2); w = M.y * (i == 0 ? 0.72 : 0.66);
      }
      vec2 d = normalize(N.zw + sd * turn * vec2(N.w, -N.z) + vec2(0.0, up));
      vec2 q = p - N.xy;
      float t = sat(dot(q, d) / ln), bow = (h2 - 0.5) * 0.36 * ln;
      vec2 off = q - d * t * ln - vec2(d.y, -d.x) * bow * 4.0 * t * (1.0 - t);
      cov = max(cov, wfLine(length(off), mix(M.y, w, t) * 0.92, px));
      if (i < 3 && abs(d.x) > 0.45) wfCap = max(wfCap, wfLine(length(off - vec2(0.0, w * 0.95)), w * 2.4 * min(abs(d.x) - 0.2, 0.6) * t * (1.0 - t) + 0.1 * w, px) * sat((abs(d.x) - 0.45) * 6.0));
      vec2 end = N.xy + d * ln;
      float s = length(p - end - d * ln * 1.1) - ln * 1.25;
      vec4 c = vec4(end, d); vec2 m = vec2(ln, w);
      if (s < sa) { b1 = a1; bm = am; kb = ka; sb = sa; a1 = c; am = m; ka = kid; sa = s; }
      else if (s < sb) { b1 = c; bm = m; kb = kid; sb = s; }
    }
    na = a1; ma = am; ia = ka; nb = b1; mb = bm; ib = kb;
    float far = (pruned ? 0.15 : 0.8) + 0.6 * max(float(n - i) - 3.0, 0.0);      // how far what is still to grow can reach
    two = n > 4 && sb < mb.x * far;
    if (sa > ma.x * far + px) break;
  }
  return cov;
}
// Lays ink where something stands (a), as clear as the air is (c): pale things still hide what is behind them.
vec3 wfLay(vec3 col, vec3 air, vec3 ink, float a, float c) { float o = min(1.0, c * 2.5 + 0.0001); return mix(col, mix(air, ink, c / o), a * o); }
// The lane of clear air a cue opens: it runs from near (z is 0) to far (1), then closes.
float wfLane(float x, float z) {
  if (uCue <= 0.0) return 0.0;
  return smoothstep(z * 0.5 - 0.2, z * 0.5, 1.0 - uCue) * smoothstep(0.0, 0.55, uCue) * exp(-wfSq((x - 0.3 * wfW) / (0.36 - 0.14 * z)));
}
// Fog: how clear the air is at a place and a depth (z, 0 near to 1 far), with lv the loudness of the kind that lives there.
float wfClear(vec2 p, float z, float rest, float lv, float x) {
  vec2 q = vec2(p.x * 1.3 + uTravel * 0.012 * (1.2 - z) + uTime * 0.008, p.y * 2.2 - uTime * 0.004) + z * vec2(17.3, 9.1);
  float n = 0.66 * noise(q) + 0.34 * wfN2;
  float thin = wfLoopA * exp(-wfSq((x - wfLoopX) / 0.22));
  float c = rest + (0.5 + 0.45 * uEnergy) * lv + 0.34 * thin + 0.75 * wfLane(x, z) - 0.12 * (uSpace - 0.5) * (0.4 + z);
  return smoothstep(0.12, 1.02, c + (n - 0.5) * 0.95);
}
// The light of the fog itself, and the snow under it.
vec3 wfAir(vec2 p, float fieldY) {
  vec2 sun = (p - vec2(0.36 * wfW, 0.34)) * vec2(0.75, 1.0);
  float g = exp(-dot(sun, sun) * 2.6), low = 1.0 - smoothstep(-0.45, 0.2, p.y - fieldY);
  vec3 c = mix(vec3(0.905, 0.912, 0.92), vec3(0.975, 0.968, 0.95), g);
  c = mix(c, vec3(0.965, 0.966, 0.965), low * 0.7);
  float dim = sat(uLevel * (0.55 + 0.5 * uEnergy) + 0.5 * (0.5 - uTone));
  c *= mix(vec3(1.0), vec3(0.815, 0.835, 0.865), dim * (1.0 - 0.6 * g));
  vec2 q = vec2(p.x * 1.1 + 0.5 * p.y + uTime * 0.007 + uTravel * 0.01, p.y * 3.2 - 0.6 * p.x);
  c += (vec3(0.975, 0.972, 0.96) - c) * 0.55 * wfLane(p.x, sat((p.y + 0.45) * 1.6)) * (1.0 - smoothstep(0.1, 0.4, p.y - fieldY));
  return c * (1.0 + 0.05 * (noise(q) * 0.65 + wfN2 * 0.35 - 0.5) * (1.0 - low));
}
vec3 wfSnow(vec3 c, vec2 p, float fieldY) {
  float d = max(fieldY - p.y, 0.0), k = smoothstep(0.0, 0.3, d);
  vec2 q = vec2(p.x * 1.5 + 2.0, p.y * 7.0 / (0.5 + d * 1.6)) + vec2(0.4 * p.y, 0.5 * p.x);
  float n = noise(q) * 0.8 + wfN2 * 0.2;
  return c * mix(vec3(1.0), mix(vec3(0.925, 0.937, 0.955), vec3(1.012), smoothstep(0.25, 0.7, n)), k * 0.85);
}
// A crow: on its perch, and in the air as a hit goes by.
float wfCrow(vec2 p, vec2 at) {
  vec2 q = p - at;
  if (max(abs(q.x - 0.1), abs(q.y - 0.07)) > 0.17) return 0.0;
  vec2 b = rot(0.55) * (q - vec2(0.0, 0.0085));
  float c = max(abs(b.y) - 0.0052 * sqrt(max(1.0 - wfSq(b.x / 0.0125), 0.0)), abs(b.x) - 0.0125);
  c = min(c, length(q - vec2(0.0098, 0.0165)) - 0.0043);                      // the head, the bill, the tail
  c = min(c, max(abs(q.y - 0.0165 + 0.2 * (q.x - 0.012)) - 0.0014, abs(q.x - 0.0155) - 0.0028));
  b.x += 0.016; c = min(c, max(abs(b.y) - 0.0024, abs(b.x) - 0.008));
  float perch = sat(-c / wfPx + 0.5) * (1.0 - smoothstep(0.0, 0.12, uHits));
  float s = 1.0 - uHits;
  vec2 f = p - at - vec2(0.005 + 0.2 * s, 0.012 + 0.16 * s - 0.05 * s * s);
  f = rot(-0.25) * f;
  float ax = abs(f.x), wing = f.y - (0.5 - 0.7 * s) * ax + 9.0 * ax * ax;
  float w = 0.0065 * sat(1.0 - ax / 0.034);
  float fly = sat((w - abs(wing)) / wfPx + 0.5) * step(ax, 0.034);
  fly = max(fly, sat((0.0055 - length(f * vec2(0.45, 1.1))) / wfPx + 0.5));
  return max(perch, fly * smoothstep(0.05, 0.3, uHits));
}
// Snow let go from a bough: a white veil that falls, hides what is behind it, and throws a little shade.
vec3 wfFall(vec3 col, vec3 air, vec2 p, vec2 at) {
  if (uHits <= 0.002) return col;
  float s = 1.0 - uHits;
  vec2 q = p - at + vec2(0.0, 0.05 + 0.2 * s);
  float r = wfSq(q.x / 0.15), n = 0.5 + 0.8 * noise(vec2(p.x * 40.0, p.y * 14.0 + s * 4.0));
  col *= 1.0 - 0.2 * uHits * (0.4 + 0.6 * n) * exp(-r * 1.1 - wfSq((q.y + 0.045) / (0.1 + 0.1 * s)));
  return mix(col, air * 1.03, sat(1.3 * uHits * n * exp(-r * 1.4 - wfSq(q.y / (0.085 + 0.12 * s)))));
}
// One fir far off. q is from its foot, h its height; soft is how far the fog spreads its edge.
float wfFir(vec2 q, float h, float seed, float soft) {
  float y = q.y / h;
  if (y < -0.1 || y > 1.1) return 0.0;
  float e = sign(q.x) * 40.0 + seed * 310.0 + 80.0 + abs(q.x) / h * 14.0;
  float rag = 0.6 * wfN(y * 21.0 + e) + 0.4 * wfN(y * 47.0 + e * 1.7);
  float w = h * (0.1 + 0.06 * seed) * pow(max(1.0 - y, 0.0), 0.85) * (0.5 + 0.75 * rag);
  return (1.0 - smoothstep(-soft, soft, abs(q.x) - w)) * (1.0 - smoothstep(0.86, 1.0, y)) * smoothstep(-0.1, 0.12, y);
}
// The far row. Its feet are lost; bands set the heights.
float wfFirs(vec2 p, float y0, float sp, float tall, float seed, float soft) {
  float a = 0.0, u = p.x / sp;
  for (int k = -1; k <= 1; k++) {
    float id = floor(u) + float(k), h = hash21(vec2(id, seed)), h2 = fract(h * 7.7);
    float x = (id + 0.5 + 0.6 * (h2 - 0.5)) * sp;
    float stand = smoothstep(0.34, 0.62, wfN(x * 2.6 + seed * 13.0 + 50.0));
    float b = band(sat((x / wfW + 1.0) * 0.5));
    float ht = tall * (0.55 + 0.6 * h) * (0.8 + 0.45 * b * (0.4 + uEnergy)) * (0.55 + 0.45 * stand);
    a = max(a, wfFir(p - vec2(x, y0 + 0.02 * (h2 - 0.5)), ht, h, soft) * stand * (0.75 + 0.25 * h2));
  }
  return a * smoothstep(-0.03, tall * 0.55, p.y - y0 - 0.05 * uLow - 0.1 * (noise(vec2(p.x * 3.0 + uTime * 0.012 + uTravel * 0.015, seed)) - 0.5));
}
// Where the fence stands: u is 1 at the near post and falls to 0 far off.
vec2 wfPost(float u) { return vec2(wfW * (0.1 + 0.84 * u - 0.45 * u * (1.0 - u)), 0.03 - 0.45 * u); }
vec3 wfField(vec2 p) {
  float fy = 0.02;
  vec3 air = wfAir(p, fy), col = wfSnow(air, p, fy);
  // the far forest, two deep
  if (p.y > -0.08 && p.y < 0.36) {
    float a = wfFirs(p, 0.055, 0.03, 0.15, 3.0, 0.0035);
    float c = wfClear(p, 1.0, 0.06, uDrone, p.x);
    col = mix(col, wfInk(0), a * c * 0.36);
    a = wfFirs(p, 0.01, 0.04, 0.18, 8.0, 0.002);
    c = wfClear(p, 0.85, 0.1, uDrone, p.x);
    col = mix(col, wfInk(0), a * c * 0.66);
  }
  // the hut: its roof is bare paper, only the wall is drawn
  float hs = mix(0.7, 1.0, smoothstep(0.3, 0.85, wfW)), px = wfPx / hs;
  vec2 q = (p - vec2(0.36 * wfW + 0.02, -0.06)) / hs;
  if (abs(q.x) < 0.14 && q.y > -0.04 && q.y < 0.3) {
    float c = wfClear(p, 0.6, 0.2, uTexture, p.x);
    vec3 ink = wfInk(2);
    float gable = min(0.047 - abs(q.x + 0.03), 0.075 - abs(q.x + 0.03) * 0.95 - q.y);
    float wall = sat(min(q.y + 0.004, gable) / px + 0.5), slope = q.x + 0.03 - (0.075 - q.y) * 1.044;
    float flank = sat(min(min(q.y + 0.004, 0.031 - q.y), 0.033 - abs(q.x - 0.05)) / px + 0.5);
    col = wfLay(col, air, ink * (1.0 + 2.0 * flank * (1.0 - wall)), max(wall, flank) * smoothstep(-0.006, 0.006, q.y), c);
    col = mix(col, ink, sat(min(0.0055 - abs(q.x - 0.02), min(q.y - 0.083, 0.106 - q.y)) / px + 0.5) * c);
    float roof = sat(min(min(0.083 - q.y, q.y - 0.026), min(slope + 0.004, 0.077 - slope)) / px + 0.5);
    roof = max(roof, sat((0.005 - abs(q.y - 0.079 + abs(q.x + 0.03) * 0.95)) / px + 0.5) * step(abs(q.x + 0.03), 0.054));
    col = mix(col, air * (1.03 - 0.06 * smoothstep(0.0, 0.07, slope)), roof * sat(c * 1.6));
    vec2 w = abs(q - vec2(-0.03, 0.023)) - vec2(0.008, 0.011);
    float win = sat(-max(w.x, w.y) / px + 0.5);
    col = mix(col, mix(vec3(0.3, 0.3, 0.32), vec3(1.0, 0.74, 0.36), sat(0.2 + uKeys * 1.4)), win * max(c, uKeys * 0.7));
    float glow = exp(-dot(q - vec2(-0.03, 0.005), q - vec2(-0.03, 0.005)) * 900.0);
    col += vec3(0.1, 0.04, -0.06) * glow * uKeys * (1.0 - wall);
    float up = max(q.y - 0.1, 0.0), smoke = q.x - 0.02 - (0.1 * up + 0.02 * sin(q.y * 22.0 - uTime * 0.5) * sat(up * 8.0));
    col = mix(col, air * 0.74, exp(-wfSq(smoke / (0.005 + 0.1 * up))) * smoothstep(0.1, 0.11, q.y) * (1.0 - smoothstep(0.14, 0.3, q.y)) * max(0.6 * uMic, 0.35 * c * uTexture));
  }
  // the fence, walking off
  for (int k = 0; k < 10; k++) {
    if (p.y > 0.03 || p.x < 0.05 * wfW) break;
    float fk = float(k), z = 1.0 + 0.5 * fk, u = 1.0 / z;
    vec2 at = wfPost(u);
    float h = 0.16 / z;
    vec2 o = p - at;
    float h1 = hash11(fk + 2.0);
    // a slack wire to the next post
    vec2 nx = wfPost(1.0 / (z + 0.5)); float hn = 0.16 / (z + 0.5);
    if (fk < 8.5 && p.x < at.x && p.x > nx.x && p.y > nx.y - h && p.y < nx.y + h * 1.5) {
      float g = (p.x - nx.x) / max(at.x - nx.x, 1e-4);
      float wy = mix(nx.y + hn * 0.8, at.y + h * 0.8, g) - 0.26 * h * g * (1.0 - g);
      col = mix(col, wfInk(1), wfLine(p.y - wy, 0.0007 * (0.4 + u), wfPx) * wfClear(p, 0.15 + 0.07 * fk, 0.2, uPad, p.x) * 0.7);
    }
    if (abs(o.x) < h && o.y > -h && o.y < h * 1.4) {
      o.x -= o.y * (h1 - 0.5) * 0.22;
      float w = h * (0.052 + 0.02 * h1), tp = h * (0.85 + 0.3 * fract(h1 * 5.0));
      float post = sat((w * (1.0 - 0.15 * o.y / h) - abs(o.x)) / wfPx + 0.5) * sat((tp - o.y) / wfPx + 0.5) * smoothstep(-0.02 * h, 0.14 * h, o.y);
      float far = fk / 9.0;
      float c = wfClear(at, 0.15 + 0.6 * far, 0.56 - 0.3 * far, uPad, at.x);
      col *= 1.0 - 0.1 * c * exp(-wfSq(o.x / (h * 0.16)) - wfSq(o.y / (h * 0.06)));
      col = mix(col, wfInk(1) * (1.0 + 0.5 * smoothstep(-w, w, o.x)), post * c);
      float cap = sat((1.0 - length((o - vec2(0.0, tp)) / vec2(w * 1.45, w * 1.1))) * w / wfPx + 0.5) * step(tp - w * 0.3, o.y);
      col = mix(col, air * 1.02, cap * c);
    }
  }
  // the near tree, far to the left
  vec2 tb = vec2(-0.6 * wfW, -0.26);
  float sc = mix(0.4, 0.58, smoothstep(0.3, 0.85, wfW));
  vec2 t = (p - tb) / sc;
  float c = wfClear(p, 0.1, 0.42, max(uPhrase, 0.55 * uHits * exp(-wfSq((p.x - tb.x - 0.2) / 0.2))), p.x);
  if (length((t - vec2(0.12, 0.52)) / vec2(0.85, 0.7)) < 1.0) {
    t.x -= 0.006 * t.y * t.y * sin(uTime * 0.37 + t.y * 2.0);
    float a = wfTree(t, 326, 10, false, vec2(0.16, 1.0), wfPx / sc);
    a *= smoothstep(-0.01, 0.05 + 0.3 * uLow * wfN2, t.y);
    col *= 1.0 - 0.12 * c * exp(-wfSq(t.x / 0.16) - wfSq((t.y - 0.005) / 0.03));
    col = wfLay(col, air, wfInk(3), a, c);
    col = mix(col, air * 1.03, wfCap * c * (1.0 - smoothstep(0.1, 0.6, uHits) * exp(-wfSq((p.x - tb.x - 0.2) / 0.14))));
  }
  vec2 pe = tb + vec2(0.305, 0.43) * sc;
  col = wfFall(col, air, p, pe);
  col = mix(col, vec3(0.03, 0.03, 0.04), wfCrow(p, pe));
  return col;
}
vec3 wfOrchard(vec2 p) {
  float tilt = 0.12 * p.x;
  vec3 air = wfAir(p, 0.08 + tilt), col = wfSnow(air, p, 0.08 + tilt);
  float big = mix(0.8, 1.0, smoothstep(0.3, 0.85, wfW));
  float z = 6.3275;
  for (int i = 5; i >= 0; i--) {
    float fi = float(i), d = fi / 5.0;
    z *= 1.0 / 1.36;
    float sp = 0.68 * big / z;
    int kind = i == 0 ? 3 : i == 1 ? 2 : i < 4 ? 1 : 0;
    float x0 = 0.24 * wfW + 0.06 * fi * big;
    float id = floor((p.x - x0) / sp + 0.5), x = x0 + id * sp;
    vec2 t = p - vec2(x, 0.2 - 0.54 / z + 0.14 * x);
    if (t.y * z < -0.025 || t.y * z > 0.36) continue;
    int seed = wfMod(int(id) * 37 + i * 53 + 2442);
    float h = float(wfMod(seed * 271)) / 1021.0, sc = 0.4 * big / z * (0.894 - 0.06 * h);
    t /= sc;
    if (t.y > -0.06 && t.y < 1.0 && abs(t.x) < clamp(1.5 * t.y - 0.05, 0.25, 0.64)) {
      vec4 m = piece(vec2(0.5 + 0.5 * p.x / 0.9, 0.95 - 0.8 * d));
      float c = wfClear(p, d, 0.42 - 0.34 * d, 0.8 * wfKind(kind) + 0.3 * m.a * uEnergy, p.x) * mix(1.0, 0.34, d);
      if (c > 0.02) {
        t.x -= 0.004 * t.y * t.y * sin(uTime * 0.37 + t.y * 2.0 + h * 6.0);
        float a = wfTree(t, seed, i < 1 ? 6 : i < 2 ? 5 : 4, true, vec2(0.3 * (h - 0.5), 1.0), wfPx / sc);
        a *= smoothstep(-0.01, 0.06 + 0.4 * uLow * wfN2, t.y);
        col *= 1.0 - 0.14 * c * exp(-wfSq(t.x / 0.11) - wfSq((t.y - 0.005) / 0.028));
        col = wfLay(col, air, wfInk(kind), a, c);
        col = mix(col, air * 1.02, wfCap * c * step(fi, 2.5));
      }
    }
  }
  // the ladder against the near tree
  vec2 fo = vec2(0.24 * wfW, -0.34 + 0.0336 * wfW), la = fo + vec2(-0.15, -0.005) * big, lb = fo + vec2(0.02, 0.31) * big;
  vec2 ax = normalize(lb - la), q = p - la;
  float len = length(lb - la), s = dot(q, ax), v = dot(q, vec2(ax.y, -ax.x));
  if (s > -0.02 && s < len + 0.01 && abs(v) < 0.04) {
    float wide = mix(0.026, 0.012, s / len), r = fract(s / 0.036) - 0.5;
    float lad = wfLine(abs(v) - wide, 0.0024, wfPx);
    lad = max(lad, wfLine(r * 0.036, 0.0017, wfPx) * step(abs(v), wide) * step(s, len - 0.01));
    lad *= sat((len - s) / wfPx + 0.5) * smoothstep(0.0, 0.015, s);
    col = wfLay(col, air, vec3(0.16, 0.13, 0.11), lad, wfClear(p, 0.0, 0.44, uPhrase, p.x));
  }
  // a few apples nobody picked: the keys redden them
  vec2 ap = (p - fo) / big;
  if (abs(ap.x) < 0.23 && ap.y > 0.2 && ap.y < 0.36) {
    float c = wfClear(p, 0.0, 0.5, uPhrase, p.x);
    vec2 at[5] = vec2[5](vec2(-0.1835, 0.263), vec2(-0.1425, 0.236), vec2(-0.122, 0.297), vec2(0.168, 0.259), vec2(0.1, 0.246));
    for (int k = 0; k < 5; k++) {
      vec2 o = ap - at[k];
      float l = length(o * vec2(1.0, 1.06)), ball = sat((0.0052 - l) / wfPx * big + 0.5);
      vec3 red = mix(vec3(0.34, 0.15, 0.12), vec3(0.82, 0.2, 0.11), sat(0.35 + uKeys));
      col = wfLay(col, air, red * (1.0 + 0.5 * (1.0 - smoothstep(0.0, 0.004, length(o - vec2(0.0012, 0.002))))), ball, max(c, 0.85 * uKeys));
    }
  }
  vec2 pe = lb + vec2(0.0, 0.002);
  col = wfFall(col, air, p, pe);
  col = mix(col, vec3(0.03, 0.03, 0.04), wfCrow(p, pe));
  return col;
}
vec3 render(vec2 p) {
  wfPx = 1.0 / uRes.y;
  wfW = clamp(0.5 * uRes.x / uRes.y, 0.28, 0.85);
  wfLoopX = (uLoop * 2.0 - 1.0) * (wfW + 0.15);
  wfLoopA = smoothstep(0.0, 0.12, uLoop) * (1.0 - smoothstep(0.88, 1.0, uLoop));
  wfN2 = noise(vec2(p.x * 3.0 + p.y + uTime * 0.018 + uTravel * 0.02, p.y * 5.0 - p.x));
  return uVar < 0.5 ? wfField(p) : wfOrchard(p);
}
