// name: Moonscape
// a: Raking sun
// b: Earth-lit
// what: A cratered plain from low overhead under a sun low on the ground: rims bright, floors lost in black, night coming in from the left, and a far mountain with only its face lit; or the same ground from standing height at night, in soft blue light from a globe out of sight, with stars, and the last sun gold on the hilltops.
// follows: Each kind of sound glows in its own craters; the piece tints the ground where it lies. The spectrum lights the rims, low notes near and high ones far. High sounds raise dust at the horizon, low ones lift shadows. A hit throws up a plume, a cue runs light along the edge of the world. Keys glint in dust, a voice lights the peaks. The loop sways the shadows.
float msLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// A kind's colour as a clear light.
vec3 msInk(vec3 k) { k *= k; return k / max(max(k.r, max(k.g, k.b)), 0.05); }
vec3 msHash(vec2 c) {
  vec3 q = fract((c.xyx + 41.0) * vec3(0.1031, 0.103, 0.0973)); q += dot(q, q.yzx + 33.33);
  return fract((q.xxy + q.yzz) * q.zyx);
}
// Noise with its slope: value, along x, along y.
vec3 msNoise(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1)), k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
float msBall, msEye, msTan, msHump; // the moon's radius, the height of the eye, the sun's slope
vec2 msSun;                 // the way to the light, in plan
// What the last crater looked at was: the place from its middle in radii, its cell, its radius, its rim, how far out.
vec2 msQ, msCell; float msR, msRim, msAt, msOut;
const mat2 MS1 = mat2(0.921, 0.389, -0.389, 0.921), MS2 = mat2(0.777, -0.629, 0.629, 0.777), MS3 = mat2(0.36, 0.933, -0.933, 0.36);
// One crater in each cell of a turned grid, kept inside its cell: height, slope along x and z.
vec3 msCrater(vec2 x, mat2 turn, float cell, float most, float few) {
  x = turn * x / cell;
  vec2 c = floor(x); vec3 h = msHash(c + cell * 7.0);
  float R = most * (0.34 + 0.66 * h.z * h.z), age = fract(h.x * 17.0 + h.z * 5.0);
  age = mix(0.35, 1.0, age) * step(few, fract(h.y * 23.0 + h.z * 3.0));
  vec2 q = x - c - 0.5 - (h.xy - 0.5) * 2.0 * (0.5 - 1.75 * R);
  float l = max(length(q), 1e-4);
  if (l > 2.2 * R) { msAt = 3.0; msRim = 0.0; msOut = 1.0; return vec3(0.0); }
  vec2 d = q / l, d2 = vec2(d.x * d.x - d.y * d.y, 2.0 * d.x * d.y);
  vec2 hh = h.xy - 0.5;
  float fl = sat(0.1 + 0.28 * R / most);
  R *= 1.0 + 0.1 * dot(d2, hh) + 0.12 * (d2.x * d.x - d2.y * d.y) * hh.y + 0.1 * (d2.x * d2.x - d2.y * d2.y) * hh.x;
  float r = l / R, wide = cell * R, rim = 0.13 * age, deep = 0.4 * age, y = 0.0, s = 0.0;
  msQ = q / R; msR = wide; msRim = rim; msCell = c; msAt = r; msOut = 1.0;
  if (r > 1.7) return vec3(0.0);
  float ti = sat((r - fl) / (1.0 - fl)), to = min((1.7 - r) / 0.7, 1.0);
  msOut = step(1.0, r);
  y = r < 1.0 ? (deep + rim) * ti * (0.5 + 0.5 * ti) - deep : rim * to * to * to;
  s = mix((deep + rim) * (0.5 + ti) / (1.0 - fl) * smoothstep(fl - 0.03, fl + 0.03, r), -rim * 3.0 * to * to / 0.7, msOut);
  return vec3(y * wide, (d * s) * turn);
}
// Is the place just looked at in the shadow of its own rim? 1 lit, 0 dark. y is its height over the plain, in world units.
float msShade(mat2 turn, float y, float soft) {
  if (msRim <= 0.0 || msAt > 1.8) return 1.0;
  vec2 s = turn * msSun;
  float a = dot(msQ, s), b = msQ.x * s.y - msQ.y * s.x, k = 1.0 - b * b;
  if (k <= 0.0) return 1.0;
  float root = sqrt(k), h = msRim - y / msR, d = -a - root;
  float dark = smoothstep(0.0, 2.0 * soft, h - max(root - a, 0.0) * msTan) * (1.0 - msOut);
  if (d > 0.0) dark += smoothstep(0.0, 2.0 * soft, h - d * msTan) * msOut;
  return 1.0 - dark * (1.0 - smoothstep(1.5, 1.8, msAt));
}
// Slow waves: they lift the plain into low swells, and bend the craters' rows.
vec2 msWave(vec2 x) { return x.yx * vec2(0.83, 0.71) + vec2(0.4, 2.1); }
// The same crater, its height alone, for the way down of a ray.
float msBowl(vec2 x, float cell, float few) {
  vec2 c = floor(x); vec3 h = msHash(c + cell * 7.0);
  float R = 0.27 * (0.34 + 0.66 * h.z * h.z);
  vec2 q = x - c - 0.5 - (h.xy - 0.5) * 2.0 * (0.5 - 1.75 * R);
  float l2 = dot(q, q);
  if (l2 > 4.84 * R * R || fract(h.y * 23.0 + h.z * 3.0) < few) return 0.0;
  float l = max(sqrt(l2), 1e-4), fl = sat(0.1 + 0.28 * R / 0.27), age = mix(0.35, 1.0, fract(h.x * 17.0 + h.z * 5.0));
  vec2 d = q / l, d2 = vec2(d.x * d.x - d.y * d.y, 2.0 * d.x * d.y), hh = h.xy - 0.5;
  R *= 1.0 + 0.1 * dot(d2, hh) + 0.12 * (d2.x * d.x - d2.y * d.y) * hh.y + 0.1 * (d2.x * d2.x - d2.y * d2.y) * hh.x;
  float r = l / R;
  if (r < 1.0) { float t = sat((r - fl) / (1.0 - fl)); return (0.265 * t * (1.0 + t) - 0.4) * age * R * cell; }
  float t = max(1.7 - r, 0.0) / 0.7;
  return 0.13 * t * t * t * age * R * cell;
}
float msPit; // under 0 inside a crater
float msGround(vec2 x) {
  vec2 w = sin(msWave(x)); x += 0.3 * w;
  msPit = msBowl(MS1 * x / 4.2, 4.2, 0.15) + msBowl(MS2 * x / 1.5, 1.5, 0.12);
  return msHump * w.x * w.y + msPit;
}
// How far over the ground a ray is at t.
vec2 msGo;
float msClear(vec3 rd, float t, float a) { return msEye + rd.y * t + a * t * t - msGround(rd.xz * t + msGo); }
// A far hill standing up behind the edge of the ground: rgb its normal, a how much of it covers the place.
// q is the place (across, above the edge), c its middle and half width, tall its height.
vec4 msHill(vec2 q, vec2 c, float tall, float px) {
  float x = (q.x - c.x) / c.y, y = q.y + 0.02;
  if (abs(x) > 2.2 || y > tall * 1.3) return vec4(0.0);
  float w = noise(vec2(x * 2.2 + c.x * 31.0, 0.5)) + 0.45 * noise(vec2(x * 6.5 + c.x * 17.0, 3.5)) + 0.16 * noise(vec2(x * 19.0, c.x * 70.0)) - 0.8;
  float top = tall * (1.0 + 0.34 * w) * exp(-x * x * 1.1);
  float cover = smoothstep(-px, px, top - y);
  if (cover <= 0.0) return vec4(0.0);
  float z = sqrt(max(log(max(top, 1e-4) / max(y, 1e-3)), 0.0));
  // gullies run down the slope, finer ones across them
  float turned = atan(x, z + 0.2), down = y / tall;
  vec3 g1 = msNoise(vec2(turned * 4.0 + c.x * 9.0 + down, down * 2.2)), g2 = msNoise(vec2(turned * 10.0 - 2.0 * down, down * 7.0 + c.x * 5.0)), g3 = msNoise(vec2(x * 17.0 + g1.x, down * 19.0));
  float steep = 1.1 * tall / c.y;
  vec3 n = vec3(2.2 * x * down * steep, 0.62, -2.0 * z * down * steep - 0.12);
  n.x -= 0.5 * g1.y + 0.3 * g2.y + 0.16 * g3.y; n.y += 0.25 * g2.z + 0.14 * g3.z;
  return vec4(normalize(n), cover);
}
vec2 msHitAt; vec3 msLight, msEmber; float msAlt;
// The ground where a ray meets it: at is the place from the eye, t how far.
vec3 msLand(vec2 p, vec3 rd, float t, bool b) {
  float px = 1.0 / uRes.y, crisp = mix(1.7, 0.5, uTone);
  vec2 at = rd.xz * t, w = msWave(at + msGo), sw = sin(w), x = at + msGo + 0.3 * sw;
  vec3 V = -rd, up = normalize(vec3(at.x / msBall, 1.0, at.y / msBall));
  float foot = t * px / max(dot(V, up), 0.08), lit = 1.0, soft = (b ? 0.22 : 0.02) * crisp, rims = 0.0, alt = msAlt;
  // the sun stands lower toward the left, until only the rims reach it
  if (!b) alt = max(alt + 0.026 * at.x, 0.012);
  msTan = tan(alt);
  vec3 L = vec3(msSun.x * cos(alt), sin(alt), msSun.y * cos(alt));
  vec3 c2 = msCrater(x, MS2, 1.5, 0.27, 0.12);
  lit *= msShade(MS2, c2.x, soft); rims = exp(-50.0 * (msAt - 1.0) * (msAt - 1.0)) * msRim * 7.0;
  vec2 kq = msQ * MS2, kc = msCell; float kr = msAt, ks = msRim > 0.0 ? 0.8 * step(0.2, hash21(msCell + 5.0)) : 0.0;
  vec3 c1 = msCrater(x, MS1, 4.2, 0.27, 0.15);
  lit *= msShade(MS1, c1.x + c2.x, soft * 0.6); rims = max(rims, exp(-90.0 * (msAt - 1.0) * (msAt - 1.0)) * msRim * 7.0);
  if (msRim > 0.0 && msAt < 1.7) { ks = 1.0; kq = msQ * MS1; kr = msAt; kc = msCell; }
  vec3 g = c1 + c2;
  float f3 = (1.0 - smoothstep(0.02, 0.1, foot)), f4 = (1.0 - smoothstep(0.008, 0.035, foot));
  if (f3 > 0.0) { vec3 c3 = msCrater(x, MS3, 0.56, 0.26, 0.1) * f3; g += c3; lit *= mix(1.0, msShade(MS3, c3.x, soft * 2.0), f3); }
  if (f4 > 0.0) { vec3 c4 = msCrater(x, MS1, 0.21, 0.25, 0.1) * f4; g += c4; lit *= mix(1.0, msShade(MS1, c4.x, soft * 3.0), f4); }
  vec3 n1 = msNoise(x * 2.1), n2 = msNoise(x * 7.0), n3 = foot < 0.06 ? msNoise(x * 23.0) : vec3(0.5, 0.0, 0.0), n4 = foot < 0.02 ? msNoise(x * 67.0) : vec3(0.5, 0.0, 0.0);
  g.yz += 0.05 * n1.yz + 0.05 * n2.yz * (1.0 - smoothstep(0.05, 0.2, foot)) + 0.045 * n3.yz * (1.0 - smoothstep(0.015, 0.06, foot)) + 0.06 * n4.yz * (1.0 - smoothstep(0.006, 0.02, foot));
  g.yz += msHump * vec2(0.71 * cos(w.y) * sw.x, 0.83 * cos(w.x) * sw.y);
  // right at the edge of the ground, where a point of the picture holds a whole crater, only the mean is left
  float graze = (1.0 - smoothstep(0.02, b ? 0.06 : 0.16, dot(V, up)));
  lit = mix(lit, 0.75, graze);
  vec3 N = normalize(up + vec3(-g.y, 0.0, -g.z) * (1.0 - graze));
  N = normalize(N + V * max(0.04 - dot(N, V), 0.0)); // no face seen from behind
  float mu0 = sat(dot(N, L)), ls = mu0 / (mu0 + max(dot(N, V), 0.06) + 0.05);
  // old dark plains and paler dust
  float albedo = (0.62 + 0.62 * smoothstep(0.25, 0.7, noise(x * 0.33 + 4.0))) * (0.9 + 0.25 * (n1.x * n2.x - 0.4 * n3.x));
  // the piece lies over the ground: across is the loop, far is the back of the room
  vec4 pc = piece(clamp(vec2(p.x / 1.76 + 0.5, 1.0 - t / 9.0), 0.01, 0.99));
  vec3 here = msInk(pc.rgb + 0.02), tint = mix(vec3(1.0), 0.6 + 0.8 * here, 0.22 * sat(pc.a));
  vec3 col = msLight * tint * lit * albedo * (b ? 1.15 * pow(ls + 0.001, 2.5) : 1.75 * ls) * (0.9 + 0.2 * uLevel);
  if (b) col *= 0.25 + 0.75 * smoothstep(0.6, 4.5, t);
  col += (b ? vec3(0.004, 0.011, 0.034) : vec3(0.004, 0.0055, 0.009)) * (0.6 + 0.6 * uLow) * (0.4 + 0.6 * N.y) * albedo * (1.0 + 1.3 * here * pc.a);
  float wave = t - 11.0 * uCue;
  col += msLight * rims * (0.012 + 0.6 * ls * lit) * (band(sat((t - 1.5) / 9.0)) * (0.5 + uEnergy) + 1.5 * uCue * exp(-wave * wave * 0.3));
  // a kind of sound glows down in its own craters, lights their walls and spills a little over the rim
  if (ks > 0.0 && kr < 1.7) {
    int k = (int(kc.x) * 2 + int(kc.y) + 500000) % 5;
    float wall = sat(dot(N, normalize(vec3(-kq.x, 0.3, -kq.y)))), pool = 1.0 / (1.0 + 7.0 * kr * kr), spill = (1.0 - smoothstep(0.5, 1.7, kr));
    vec3 ink = mix(msInk(uKind[k]), vec3(0.4), b ? 0.36 : 0.2);
    ink = ink * (pool * pool * 0.5 + wall * wall * 0.26 * (1.0 - smoothstep(0.35, 1.04, kr)) + 0.1 * spill * spill) + (0.2 + ink) * 0.25 * exp(-kr * kr * 22.0);
    col += ink * msLv(k) * ks * (b ? 2.3 : 1.4) * smoothstep(b ? 0.7 : 1.2, b ? 1.8 : 2.8, t) * (0.5 + uEnergy) * (0.7 + 0.4 * n2.x + 0.2 * n4.x);
  }
  vec2 hd = at - msHitAt;
  col += msEmber * uHits * 2.6 * exp(-dot(hd, hd) * 3.4) * (0.15 + 0.85 * sat(dot(N, normalize(vec3(-hd.x, 0.35, -hd.y))))) * albedo;
  // glass beads in the dust answer the keys
  if (uKeys > 0.01 && foot < 0.04) {
    vec2 gc = floor(x * 11.0), gh = hash22(gc); float gd = length(x * 11.0 - gc - 0.2 - 0.6 * gh);
    col += mix(vec3(1.0, 0.6, 0.25), msLight, gh.x) * 1.6 * uKeys * step(0.6, gh.y) * exp(-gd * gd * 110.0) * (1.0 - smoothstep(0.012, 0.04, foot));
  }
  return col;
}
// Black sky, stars when the sun is down, hills behind the edge of the ground, and the dust that hangs there. q is (across, above the edge).
vec3 msSky(vec2 p, vec2 q, bool b) {
  float px = 1.0 / uRes.y;
  vec3 sky = vec3(0.0);
  if (b) {
    vec2 sc = floor(p * 40.0); vec3 sh = msHash(sc); float sl = length(p * 40.0 - sc - 0.15 - 0.7 * sh.xy), m = p.y - 0.36 - 0.42 * p.x;
    float milk = exp(-m * m * 18.0) * (0.5 + 0.5 * noise(p * 3.0));
    float mag = pow(sh.z, 16.0);
    sky = vec3(0.75, 0.85, 1.0) * mag * (1.0 - smoothstep(0.02, 0.05 + 0.06 * mag, sl)) * (0.35 + milk) + vec3(0.0015, 0.0035, 0.009) * milk;
  }
  for (int i = b ? 0 : 6; i < (b ? 6 : 9); i++) {
    vec3 c = vec3[9](vec3(-0.6, 0.2, 0.19), vec3(0.62, 0.24, 0.22), vec3(-0.3, 0.13, 0.085), vec3(0.36, 0.14, 0.11), vec3(-0.82, 0.26, 0.12), vec3(0.1, 0.12, 0.035),
      vec3(-0.2, 0.11, 0.1), vec3(-0.36, 0.13, 0.15), vec3(-0.52, 0.12, 0.07))[i];
    vec4 h = msHill(q, c.xy, c.z, px);
    if (h.a <= 0.0) continue;
    float up = (q.y + 0.02) / c.z;
    vec3 body;
    if (b) {
      body = msLight * (0.34 * pow(sat(dot(h.xyz, vec3(-0.8, 0.45, -0.39))) + 0.001, 1.3) + 0.012 + 0.02 * uLow) * (0.35 + 0.65 * up);
      // the last sun still on the highest tops
      float s = sat(dot(h.xyz, vec3(0.94, 0.28, -0.2))) * smoothstep(0.6, 0.85, up + 0.16 * h.x + 0.1 * h.y) * step(0.16, c.z);
      body += vec3(1.0, 0.56, 0.24) * s * (0.5 + 1.6 * uCue + 0.5 * uMic);
    } else {
      body = msLight * sat(dot(h.xyz, vec3(0.97, 0.22, 0.1)) - 0.14) * 1.5 * smoothstep(0.2, 0.75, up + 0.25 * h.x) * (1.0 + 0.6 * uMic) + vec3(0.002, 0.003, 0.005);
    }
    sky = mix(sky, body, h.a);
  }
  float e = max(q.y, 0.0), wide = q.x - (b ? 0.1 : 0.25);
  float veil = exp(-e * mix(60.0, 22.0, uSpace)) * (0.4 + noise(vec2(q.x * 7.0 - uTime * 0.01, e * 34.0 + uTime * 0.015)));
  sky += msLight * veil * (0.006 + 0.14 * uHigh * (0.5 + uEnergy));
  // a cue: the sun runs along the edge of the world
  return sky + (b ? vec3(1.0, 0.66, 0.36) : msLight) * uCue * 1.6 * (0.6 * exp(-e * 60.0) + exp(-e * 300.0)) * exp(-wide * wide / (0.03 + 0.5 * (1.0 - uCue)));
}
vec3 render(vec2 p) {
  bool b = uVar > 0.5;
  float px = 1.0 / uRes.y, zoom = b ? 1.15 : 1.05, high;
  msHump = b ? 0.16 : 0.12; msBall = b ? 60.0 : 38.0; high = msHump + 0.2; msEye = b ? 0.85 : 1.9;
  msAlt = b ? 0.3 : 0.132 + 0.02 * cos(TAU * uLoop);
  float az = (b ? 2.7 : 0.3) + 0.1 * sin(TAU * uLoop);
  msSun = vec2(cos(az), sin(az)); msTan = tan(msAlt);
  msLight = b ? vec3(0.25, 0.48, 1.0) : vec3(1.0, 0.93, 0.83);
  msEmber = mix(vec3(1.0, 0.93, 0.85), msInk(uKind[4]), 0.45);
  msGo = vec2(0.5 * sin(uTime * 0.013), uTravel * 0.035);
  mat2 tip = rot(b ? -0.12 : -0.52);
  vec3 rd = normalize(vec3(p, zoom));
  rd.yz = tip * rd.yz;
  msHitAt = b ? vec2(0.9 + 0.5 * sin(uTime * 0.11), 3.6) : vec2(-0.2 + 1.1 * sin(uTime * 0.09), 4.2);
  // the way down: the ground falls away like the side of a ball
  float a = dot(rd.xz, rd.xz) / (2.0 * msBall), disc = rd.y * rd.y - 4.0 * a * (msEye - high), far = max(-rd.y, 0.0) / (2.0 * a);
  float edge = rd.y + sqrt(2.0 * msEye / msBall) * length(rd.xz); // how far above the edge of the ground
  float cover = 0.0, t = 0.0, crest = 1e3; vec2 crestIn = vec2(0.0);
  if (disc > 0.0 && rd.y < 0.0) {
    t = 2.0 * (msEye - high) / (-rd.y + sqrt(disc));
    float back = t, before = t, was = 1e3, d = 0.0, dBack = 1.0, limit = far * (b ? 1.45 : 1.02);
    for (int i = 0; i < 30; i++) {
      d = msClear(rd, t, a);
      if (d < 0.0 || t > limit) break;
      // the closest the ray came to a crest it went over, to soften that edge
      if (d / t > was && was < crest) { crest = was; crestIn = vec2(before, t); }
      was = d / t; before = back; back = t; dBack = d;
      t += max(d * 0.85 / ((msPit < 0.0 ? 0.65 : b ? 0.24 : 0.3) - rd.y - 1.4 * a * t), 0.008 * t);
    }
    if (d < 0.0) {
      cover = 1.0;
      for (int i = 0; i < 4; i++) {
        float m = mix(back, t, i < 3 ? 0.5 : dBack / max(dBack - d, 1e-6)), dm = msClear(rd, m, a);
        if (dm < 0.0) { t = m; d = dm; } else { back = m; dBack = dm; }
      }
    } else if (edge < -0.004) { cover = 1.0; t = min(t, far); }
    if (crest < 4.0 * px) {
      for (int i = 0; i < 4; i++) {
        vec2 m = mix(crestIn.xx, crestIn.yy, vec2(0.38, 0.62));
        float d1 = msClear(rd, m.x, a) / m.x, d2 = msClear(rd, m.y, a) / m.y;
        if (d1 < d2) crestIn.y = m.y; else crestIn.x = m.x;
        crest = min(crest, min(d1, d2));
      }
    }
    crest = 1.0 - smoothstep(0.0, 1.2 * px, crest);
  } else crest = 0.0;
  vec3 col = vec3(0.0);
  if (cover > 0.0) col = msLand(p, rd, t, b);
  else col = msSky(p, vec2(atan(rd.x, max(rd.z, 1e-3)), edge), b);
  if (crest > 0.01) col = mix(col, msLand(p, rd, crestIn.x * (b ? 0.975 : 0.99), b), crest);
  // a hit: a small plume, thrown up in a cone and lit by the sun
  if (uHits > 0.01) {
    vec3 f = vec3(msHitAt.x, -msEye - dot(msHitAt, msHitAt) / (2.0 * msBall), msHitAt.y); f.yz = f.yz * tip;
    vec2 q = p - f.xy / f.z * zoom; float l = length(q), reach = 0.07 + 0.13 * (1.0 - uHits);
    if (l < 0.25 && q.y > -0.02) {
      float an = atan(q.x, max(q.y, 1e-4)), cone = abs(an) - 0.5;
      float fan = exp(-cone * cone * 26.0) + 0.4 * exp(-an * an * 5.0);
      fan *= (1.0 - smoothstep(reach * 0.25, reach, l)) * (0.4 + 1.1 * noise(vec2(an * 13.0, l * 34.0 - 2.0 * (1.0 - uHits)))) * smoothstep(-0.012, 0.012, q.y);
      col += msEmber * fan * uHits * 1.1;
    }
  }
  return screenOf(col);
}
