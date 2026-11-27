// name: Roost rings
// a: First light
// b: Rain band
// what: A pale relief map seen at a slant before sunrise, a coast with a river and two islands, and over it thousands of fine specks: birds leaving their roosts in wide broken rings of slate, rose, ochre and green that drift and thin with the wind. Or the same coast as a bowed band of rain in mist grey and indigo grains comes over.
// follows: Each kind has a roost and its ring thickens as it sounds. Drone lays haze or deepens the rain, pad widens the trailing veil, texture is dust and insects, phrase sends birds along the coast or round the band's end. The spectrum draws spokes, the loop sweeps round once. A hit puts up one flock, a cue a ring from each roost or a line ahead. Keys are red specks.
// own: 0 a dark night map with pale grains at -1, a warm sandy sunrise at 1; 1 seen from nearly overhead and close at -1, from low down with a horizon at 1; 2 the sea come up and more islands at -1, mountains and a long sea inlet at 1; 3 nearly still air, or a straighter front, at -1, a strong wind that drags the rings, or a front bent into a tight bow, at 1; 4 fine dust at -1, large grains at 1; 5 one lone roost that answers to every kind, or scattered showers, at -1, more rings from each roost, or a second line of rain behind the first, at 1
vec4 rrLv; float rrHit, rrMost; // how loud each kind is, and the loudest
float rrPx;          // how wide one pixel is there
float rrGrain;       // how large the grains are, 1 as designed
float rrNight;       // 0 on a pale map, 1 on a dark one
const vec2 rrWind = vec2(0.93, 0.37);
// Noise with its slope: value, then the slope across and away.
vec3 rrNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
}
// The larger of two heights, rounded where they meet; each carries its slope.
vec3 rrJoin(vec3 a, vec3 b, float k) {
  float h = sat(0.5 + 0.5 * (a.x - b.x) / k);
  vec3 m = mix(b, a, h); m.x += k * h * (1.0 - h);
  return m;
}
vec3 rrIsland(vec2 m, vec2 c, vec2 s, float turn, float r) {
  mat2 t = rot(turn);
  vec2 q = t * (m - c) * s;
  float l = length(q) + 1e-4;
  return vec3(r - l, -((q / l) * s) * t);
}
// The land: how high over the sea (below 0 is water), and its slope.
vec3 rrLand(vec2 m) {
  float w1 = m.x * 2.9 + 0.6, w2 = m.x * 6.7 + 2.0;
  vec3 h = vec3(0.86 * m.y - 0.5 * m.x + 0.05 + 0.1 * sin(w1) + 0.03 * sin(w2), -0.5 + 0.29 * cos(w1) + 0.2 * cos(w2), 0.86);
  h.x += 0.5 * uOwn[2];
  h.yz *= 0.75; h.x *= 0.75;
  h = rrJoin(h, rrIsland(m, vec2(0.5, -0.1), vec2(1.0, 1.7), 0.45, 0.21), 0.03);
  h = rrJoin(h, rrIsland(m, vec2(0.16, -0.36), vec2(1.4, 1.0), -0.5, 0.115), 0.03);
  // own 2: below 0 more islands come up as the coast goes under
  float isles = max(-uOwn[2], 0.0) * 0.35 - 0.21;
  if (isles > -0.21) {
    h = rrJoin(h, rrIsland(m, vec2(-0.42, 0.16), vec2(1.0, 1.5), 0.9, isles + 0.04), 0.04);
    h = rrJoin(h, rrIsland(m, vec2(0.02, 0.5), vec2(1.2, 1.0), 0.2, isles + 0.06), 0.04);
    h = rrJoin(h, rrIsland(m, vec2(0.72, 0.62), vec2(1.0, 1.8), -0.5, isles + 0.06), 0.04);
  }
  float amp = 0.17 + 0.17 * max(uOwn[2], 0.0), fr = 2.3;
  mat2 turn = mat2(1.0);
  const mat2 step1 = mat2(0.8, -0.6, 0.6, 0.8);
  float rise = 0.26 + 0.2 * max(uOwn[2], 0.0);
  if (h.x > 0.0) { float e = exp(-h.x / rise); h = vec3(rise * (1.0 - e), h.yz * e); }
  vec3 n = rrNoise(m * fr + 11.3);
  h += vec3(n.x - 0.5, n.yz * fr) * amp;
  // the river, winding down to its mouth
  float y = m.y, c = -0.13 + 0.16 * y + 0.10 * sin(4.6 * y + 0.4) + 0.028 * sin(13.0 * y + 1.0), dc = 0.16 + 0.46 * cos(4.6 * y + 0.4) + 0.364 * cos(13.0 * y + 1.0);
  float k = 0.85 / sqrt(1.0 + dc * dc), off = m.x - c, sg = off < 0.0 ? -1.0 : 1.0;
  float up = y + 0.17, wide = 0.0035 + 0.07 * exp(-5.5 * (up + sqrt(up * up + 0.003))) + (0.012 * sin(27.0 * y + 1.0) + 0.006 * sin(61.0 * y)) * (1.0 - smoothstep(-0.1, 0.05, y)) + 0.010 * exp(-max(y, 0.0) * 3.0);
  vec3 bank = 2.4 * vec3(abs(off) * k - wide + 0.2 * max(y - 0.9, 0.0), sg * k, -sg * dc * k);
  float plain = smoothstep(0.0, 0.28, bank.x);
  h = -rrJoin(-h, -bank, 0.05);
  // finer hills, cut by valleys, calmer by the river and under water
  for (int i = 1; i < 4; i++) {
    turn = step1 * turn; amp *= 0.5; fr *= 2.13;
    n = rrNoise(turn * m * fr + 11.3 + float(i) * 4.7);
    float v = 2.0 * n.x - 1.0, e = sqrt(v * v + 0.03);
    h += vec3(e - 0.45, (vec2(2.0 * v / e * n.yz) * turn) * fr) * amp * plain * (i < 2 ? 1.0 : 0.3 + 0.7 * smoothstep(-0.07, 0.0, h.x));
  }
  return h;
}
// One layer of grains. g is the place in cells, pg a pixel in cells, size a grain's radius in cells, dens how many of them are there.
// Returns cover, then a grain's own random number, then the side of it that is lit.
vec3 rrDots(vec2 g, float pg, float size, float dens, float seed) {
  g += 0.9 * abs(fract(g.yx * vec2(0.23, 0.29) + seed * 0.17) - 0.5);   // the rows are bent, so that no grid shows
  vec2 id = floor(g);
  vec2 h = hash22(mod(id, 512.0) + seed), h2 = vec2(fract(h.x * 37.7 + h.y * 11.3), fract(h.y * 53.1 + h.x * 7.9));
  float r = min(size * (0.6 + 0.75 * h2.y), 0.40);
  vec2 d = fract(g) - 0.5 - (h - 0.5) * (1.0 - 2.0 * r);
  float l = length(d);
  float there = sat((dens * 1.12 - h2.x) * 7.0) * step(0.0005, dens);
  float a = (1.0 - smoothstep(r - pg * 0.7, r + pg * 0.7, l)) * there;
  float mean = min(dens, 1.0) * 2.4 * size * size;
  float blur = smoothstep(0.35, 0.9, pg);
  return vec3(mix(a, min(mean, 0.9), blur), mix(h2.y, 0.5, blur), mix(dot(d, vec2(-0.7, 0.7)) / r, 0.0, blur));
}
vec3 rrInk(int k) {
  vec3 base = k == 0 ? vec3(0.16, 0.24, 0.31) : k == 1 ? vec3(0.50, 0.24, 0.30) : k == 2 ? vec3(0.60, 0.40, 0.13) : k == 3 ? vec3(0.24, 0.33, 0.25) : vec3(0.55, 0.20, 0.14);
  vec3 kc = k == 0 ? uKind[0] : k == 1 ? uKind[1] : k == 2 ? uKind[2] : k == 3 ? uKind[3] : uKind[4];
  base = mix(base * 0.85, kc * kc * 0.7, 0.4);
  return mix(base, 0.45 + 0.55 * kc, rrNight);
}
void rrPut(inout vec3 col, vec3 ink, vec3 grain, float most) {
  vec3 c = ink * (0.84 + 0.3 * grain.y) * (1.0 + 0.22 * grain.z) + 0.04 * max(grain.z, 0.0);
  col = mix(col, c, grain.x * most);
}
// A tight flock: grains that thin out from its middle.
void rrFlock(inout vec3 col, vec3 ink, vec2 q, float wide, float K, float dens, float seed) {
  float x = dot(q, q) / (wide * wide);
  if (x > 4.0 || dens < 0.004) return;
  K /= rrGrain;
  rrPut(col, ink, rrDots(q / wide * K + seed * 17.0, rrPx * K / wide, min(0.0034 * rrGrain * K / wide, 0.32), dens * exp(-x * 1.4), seed), 0.95);
}
// The map itself with its light.
vec3 rrGround(vec3 h) {
  float own0 = uOwn[0];
  float px = rrPx * length(h.yz) + 1e-4;
  float land = smoothstep(-px, px, h.x);
  float slopeK = land * smoothstep(0.0, 0.04, h.x) + 0.12 * (1.0 - land);
  vec3 n = normalize(vec3(-h.yz * (0.20 + 0.12 * max(uOwn[2], 0.0)) * slopeK, 1.0));
  float lit = dot(n, normalize(vec3(-0.62, 0.45, 0.85))) / 0.743 - 1.0;
  lit /= 1.0 + 1.2 * abs(lit);
  vec3 landC = mix(vec3(0.885, 0.86, 0.80), vec3(0.90, 0.80, 0.66), max(own0, 0.0));
  vec3 seaC = mix(vec3(0.735, 0.765, 0.775), vec3(0.80, 0.66, 0.55), max(own0, 0.0));
  landC = mix(landC, vec3(0.155, 0.18, 0.25), rrNight);
  seaC = mix(seaC, vec3(0.075, 0.09, 0.145), rrNight);
  vec3 col = mix(seaC, landC, land);
  // sea lines that keep to the coast, as an engraver draws them
  float sea = max(-h.x, 0.0), ln = sqrt(sea * 110.0), gl = length(h.yz) * 55.0 / max(ln, 0.4) * rrPx;
  float line = 1.0 - smoothstep(0.05, 0.07 + 1.6 * gl, abs(fract(ln) - 0.5));
  col *= 1.0 - 0.15 * line * (1.0 - land) * exp(-sea * 9.0) * (1.0 - smoothstep(0.15, 0.4, gl)) * smoothstep(0.6, 1.0, ln);
  col *= 1.0 + lit * mix(0.62, 0.9, rrNight);
  // the edge of the land: a line, dark on a pale map and pale on a dark one, and a lit lip
  float edge = 1.0 - smoothstep(0.4 * px, 1.6 * px, abs(h.x + 0.4 * px));
  col = mix(col, mix(col * 0.56, vec3(0.42, 0.46, 0.54), rrNight), edge * (1.0 - 0.45 * rrNight));
  col += 0.045 * land * exp(-max(h.x, 0.0) * 50.0) * (1.0 - rrNight * 0.6);
  return col;
}
// The roosts: where, how far a ring goes, and how long it takes.
vec4 rrRoost(int k) {
  return k == 0 ? vec4(-0.60, -0.10, 0.62, 67.0) : k == 1 ? vec4(-0.16, 0.06, 0.52, 53.0) : k == 2 ? vec4(0.30, 0.34, 0.40, 43.0) : k == 3 ? vec4(0.50, -0.10, 0.36, 47.0) : vec4(-0.30, 0.50, 0.44, 59.0);
}
float rrLoud, rrR, rrX, rrLife, rrDown, rrSeed;
vec2 rrAt;
// One ring of one roost: returns how thick its birds are here. rrAt is the place in it, carried outward with them.
float rrRing(int k, int j, vec2 m, float gale) {
  vec4 ro = rrRoost(k);
  float fj = float(j), fk = float(k);
  // own 5: below 0 only the second roost is left, and it answers to every kind; above 0 each sends more rings
  float lone = max(-uOwn[5], 0.0), one = k == 1 ? 1.0 : 1.0 - lone;
  rrLoud = k == 0 ? rrLv.x : k == 1 ? rrLv.y : k == 2 ? rrLv.z : k == 3 ? rrLv.w : rrHit;
  if (k == 1) { rrLoud = mix(rrLoud, rrMost, lone); ro.z *= 1.0 + 0.3 * lone; }
  if (j == 2 || (j == 1 && k == 4)) one *= max(uOwn[5], 0.0);
  float turn = uTime / ro.w + fj * 0.43 + fk * 0.31 + 0.1, age = fract(turn);
  rrLife = one * sat(age * 10.0) * sat(2.6 - 2.6 * age) * (0.15 + (k == 1 ? 0.09 : 0.0) + 0.95 * rrLoud);
  rrSeed = fk * 7.3 + fj * 3.1 + mod(floor(turn), 61.0) * 1.7;
  rrR = ro.z * (0.13 + 0.87 * age);
  vec2 q = m - ro.xy - rrWind * gale * 0.17 * age;
  float r = length(q) + 1e-4;
  vec2 dir = q / r;
  rrDown = dot(dir, rrWind);
  rrAt = q / rrR;
  vec4 lobe = 2.0 * fract(rrSeed * vec4(0.371, 0.713, 0.157, 0.531)) - 1.0;
  float dent = dot(dir, lobe.yx * vec2(1.0, -1.0));
  float R2 = rrR * (1.0 + 0.24 * dot(dir, lobe.xy) * dot(dir, lobe.zw) + 0.12 * dent * dent * dent) * (1.0 + 0.16 * gale * rrDown);
  rrX = (r - R2) / ((0.010 + 0.11 * rrR) * (1.0 + 0.9 * max(rrDown, 0.0) * max(gale, 0.0)));
  float env = max(1.0 - rrX * rrX * (rrX > 0.0 ? 0.6 : 0.14), 0.0);
  return rrLife * env * env;
}
// How thick the rain is at a place, how deep in the band it lies (below 0 is ahead of it), and where along it.
vec2 rrTip;          // the end of the band
vec3 rrBand(vec2 m, float gale, vec2 drift) {
  float R = 1.15 * exp2(-0.9 * uOwn[3]);
  vec2 out_ = normalize(vec2(-0.80, -0.60));
  vec2 nose = vec2(-0.10, -0.04) + out_ * (0.10 * sin(uTime * 0.021) + 0.05 * sin(uTime * 0.0133 + 1.0));
  rrTip = nose - out_ * R + R * (out_ * cos(0.86 / R) + vec2(-out_.y, out_.x) * sin(0.86 / R));
  vec2 q = m - nose + out_ * R;
  float r = length(q) + 1e-4;
  float s = atan(dot(q, vec2(-out_.y, out_.x)), dot(q, out_) + 1e-5) * R;
  float x = R - r;
  float n = noise(vec2(s * 4.2 - uTime * 0.004, 3.0)), n2 = noise(vec2(s * 13.0 - uTime * 0.011, 9.0));
  x += 0.11 * (n - 0.5) + 0.035 * (n2 - 0.5);
  float cell = noise(vec2(s * 9.0 - uTime * 0.008, x * 8.0 + uTime * 0.013));
  float lone = max(-uOwn[5], 0.0), two = max(uOwn[5], 0.0);
  float heart = smoothstep(-0.004, 0.022, x) * exp(-max(x, 0.0) * 5.0) * (0.20 * (1.0 - lone) + 0.72 * smoothstep(0.1 + 0.35 * lone, 0.65 + 0.15 * lone, cell * 0.75 + n2 * 0.35));
  float x2 = x - 0.36 - 0.10 * n2;
  heart = max(heart * (1.0 - 0.6 * two * smoothstep(0.1, 0.22, x) * (1.0 - smoothstep(-0.05, 0.0, x2))), 1.1 * two * smoothstep(-0.004, 0.022, x2) * exp(-max(x2, 0.0) * 10.0) * (0.4 + 0.8 * noise(vec2(s * 8.0 + 4.0, x * 9.0))));
  float veil = smoothstep(0.08, 0.26, x) * (1.0 - smoothstep(0.5, 1.15, x)) * (0.35 + 0.8 * noise(m * 4.0 - drift * 2.0)) * (1.0 - 0.75 * lone);
  float ends = smoothstep(-1.5, -1.0, s) * (1.0 - smoothstep(0.65, 1.1, s + 0.5 * x));
  heart *= ends; veil *= ends;
  heart *= 0.62 + 0.45 * uDrone;
  veil *= 0.42 + 0.35 * uPad;
  return vec3(heart + veil * (1.0 - heart), x, s);
}
vec3 rrRain(vec3 col, vec2 m, vec3 h, vec2 drift, float gale, float sweep, float spoke) {
  vec3 b = rrBand(m, gale, drift);
  float x = b.y, s = b.z, dens = b.x;
  // hills comb it: streaks down the wind where the ground stands up
  vec2 wq = vec2(dot(m, rrWind), dot(m, vec2(-rrWind.y, rrWind.x)));
  float comb = noise(vec2(wq.x * 5.0, wq.y * 60.0));
  dens *= 1.0 - 0.6 * smoothstep(0.02, 0.2, h.x) * smoothstep(0.35, 0.75, comb) * (1.0 - smoothstep(0.5, 0.9, dens));
  dens *= 1.0 + 0.25 * spoke + 0.2 * sweep;
  float ends = smoothstep(-1.5, -1.0, s) * (1.0 - smoothstep(0.65, 1.1, s + 0.5 * x));
  // the ground goes dim under it, and a little ahead of it
  float shade = smoothstep(-0.10, 0.10, x) * (1.0 - smoothstep(0.5, 1.1, x)) * ends;
  col *= 1.0 - shade * vec3(0.17, 0.12, 0.07) - sat(dens) * vec3(0.24, 0.20, 0.13);
  vec3 pale = mix(vec3(0.58, 0.61, 0.64), vec3(0.34, 0.39, 0.50), rrNight), slate = mix(mix(vec3(0.36, 0.41, 0.49), uKind[1] * uKind[1], 0.15), vec3(0.55, 0.64, 0.80), rrNight);
  vec3 deep = mix(mix(vec3(0.14, 0.13, 0.29), uKind[0] * uKind[0] * 0.5, 0.2), vec3(0.86, 0.90, 1.0), rrNight);
  float clear = smoothstep(-0.22, -0.02, x) * (1.0 - smoothstep(0.0, 0.03, x)) * ends;
  // insects and clutter ahead of it, gone in the clear line
  float cell = 0.0105 * rrGrain;
  float hz = noise(m * 3.1 - drift * 3.0);
  float dust = (0.07 + 0.26 * rrLv.z) * smoothstep(0.25, 0.75, hz) * (1.0 - clear) * (1.0 - smoothstep(0.0, 0.2, x) * 0.7) + 0.08 * spoke * spoke;
  rrPut(col, mix(mix(vec3(0.36), rrInk(2), 0.6), vec3(0.62, 0.66, 0.72), rrNight), rrDots(rot(0.5) * (m - drift) / cell, rrPx / cell, 0.2, dust, 3.0), 0.75);
  // the rain, small grains first
  float e = sat(dens);
  cell = 0.0055 * rrGrain;
  vec3 d = rrDots(rot(0.2) * (m - drift * 1.6) / cell, rrPx / cell, 0.22 + 0.10 * e, e * 1.2, 21.0);
  rrPut(col, mix(pale, slate, smoothstep(0.15, 0.6, e + 0.5 * (d.y - 0.5))), d, 0.85);
  cell = 0.0078 * rrGrain;
  d = rrDots(rot(0.8) * (m - drift * 1.3) / cell, rrPx / cell, 0.2 + 0.14 * e, e * 1.15 - 0.08, 22.0);
  rrPut(col, mix(mix(pale, slate, 0.7), deep, smoothstep(0.3, 0.8, e + 0.6 * (d.y - 0.5))), d, 0.92);
  cell = 0.0115 * rrGrain;
  d = rrDots(rot(1.3) * (m - drift) / cell, rrPx / cell, 0.17 + 0.16 * e, e * 1.2 - 0.45, 23.0);
  rrPut(col, mix(slate, deep, smoothstep(0.35, 0.75, e + 0.4 * (d.y - 0.5))), d, 0.95);
  // the thin line that runs before it; a cue sends one further ahead
  float wl = x + 0.11 + 0.02 * noise(vec2(s * 8.0, 5.0)), wc = x + 0.11 + 0.35 * (1.0 - uCue);
  float ahead = (exp(-wl * wl * 9000.0) * (0.35 + 0.4 * uPad) * smoothstep(0.2, 0.6, noise(vec2(s * 6.0 + 2.0, 1.0))) + exp(-wc * wc * 2500.0) * uCue) * ends;
  cell = 0.0058 * rrGrain;
  rrPut(col, slate, rrDots(rot(0.4) * m / cell, rrPx / cell, 0.3, ahead, 31.0), 0.9);
  // small flocks going round its end
  for (int i = 0; i < 4; i++) {
    float fi = float(i), a = -0.047 * uTime + fi * 1.5708 + 0.3 * fi, far = 0.12 + 0.03 * sin(uTime * 0.03 + fi * 2.0);
    vec2 way = vec2(cos(a), sin(a)), fq = m - rrTip - far * way;
    fq = vec2(dot(fq, way) * 1.6, dot(fq, vec2(-way.y, way.x)) * 0.7);
    rrFlock(col, rrInk(3), fq, 0.048 + 0.010 * sin(fi * 5.0), 6.0, 0.2 + 0.8 * rrLv.w, fi + 50.0);
  }
  return col;
}
vec3 render(vec2 p) {
  rrNight = smoothstep(0.1, 0.7, -uOwn[0]);
  rrGrain = exp2((uOwn[4] > 0.0 ? 0.9 : 0.55) * uOwn[4]) * clamp(sqrt(540.0 / uRes.y), 0.8, 1.7);
  float high = max(-uOwn[1], 0.0), low = max(uOwn[1], 0.0);
  float tip = 0.80 + 0.62 * high - 0.40 * low, D = 1.32 - 0.22 * high - 0.1 * low, f = 1.3;
  float ct = cos(tip), st = sin(tip);
  vec3 rd = vec3(p.x, p.y * ct - f * st, p.y * st + f * ct);
  float sky = rd.y;
  rd.y = min(rd.y, -0.04);
  float t = D * st / -rd.y;
  vec2 m = vec2(rd.x * t, rd.z * t - D * ct);
  m = rot(0.30) * m + vec2(0.04, 0.05);
  float el = -rd.y / length(rd);
  rrPx = t / uRes.y / sqrt(max(el, 0.05)) * 1.1;
  vec3 h = rrLand(m);
  vec3 col = rrGround(h);
  float land = smoothstep(-0.01, 0.02, h.x);
  float gain = 0.7 + 0.65 * uEnergy;
  float gale = 1.0 + 0.9 * uOwn[3];
  vec2 drift = rrWind * (uTravel * 0.010 + uTime * 0.0015);
  gain *= 0.85 + 0.3 * uLevel;
  rrLv = clamp(vec4(uDrone, uPad, uTexture, uPhrase + 0.5 * uMic) * gain, 0.0, 1.0);
  rrHit = sat(0.5 * uHits * gain);
  rrMost = max(max(max(rrLv.x, rrLv.y), max(rrLv.z, rrLv.w)), rrHit);

  // the sweep, once round in a loop, and the spokes of the spectrum
  vec2 sq = m - vec2(-0.12, 0.02);
  float az = atan(sq.y, sq.x + 1e-5) / TAU;
  float arm = fract(-az - uLoop);
  float sweep = exp(-arm * 7.0) * smoothstep(0.0, 0.012, arm);
  float spoke = band(abs(fract(az) * 2.0 - 1.0)) * smoothstep(0.05, 0.25, length(sq)) * (0.3 + 0.9 * smoothstep(-0.2, 1.0, cos(16.0 * TAU * az)));
  col *= 1.0 + 0.05 * sweep;

  if (uVar < 0.5) {
    // the dust of the air: clutter, haze on the low ground, insects, a stream along the coast
    float hz = noise(m * 3.1 - drift * 3.0), hz2 = noise(m * 9.0 - drift * 9.0 + 4.0);
    float haze = rrLv.x * exp(-abs(h.x - 0.03) * 8.0) * (0.3 + 0.7 * hz);
    float dust = (0.07 + 0.22 * rrLv.z) * smoothstep(0.2, 0.75, hz * 0.6 + hz2 * 0.4) + 0.20 * spoke * spoke + 0.3 * haze;
    col = mix(col, mix(vec3(0.93, 0.92, 0.90), vec3(0.25, 0.28, 0.36), rrNight), 0.30 * haze);
    float cell = 0.0095 * rrGrain;
    vec2 g = (m - drift) / cell;
    vec3 d = rrDots(rot(0.5) * g, rrPx / cell, 0.20 + 0.05 * spoke, dust * (1.0 + sweep), 3.0);
    rrPut(col, mix(mix(vec3(0.38), rrInk(0), haze), vec3(0.62, 0.66, 0.72), rrNight), d, 0.75);
    // the phrase: a stream of small birds that keeps to the coast
    float along = dot(m, vec2(0.86, 0.5)), beat = noise(vec2(along * 6.0 - uTravel * 0.06, 2.0));
    float stream = exp(-(h.x + 0.055) * (h.x + 0.055) * 680.0) * (1.0 - smoothstep(0.14, 0.24, abs(0.86 * m.y - 0.5 * m.x + 0.05))) * (0.03 + rrLv.w) * smoothstep(0.25, 0.8, beat);
    cell = 0.0105 * rrGrain;
    if (stream > 0.0005) rrPut(col, rrInk(3), rrDots(rot(0.9) * (m - vec2(0.86, 0.5) * (uTravel * 0.02 + uTime * 0.002)) / cell, rrPx / cell, 0.25, stream, 15.0), 0.9);
    // five roosts, the rings of each growing from it with the wind: find the two rings that show most here, then draw their birds
    vec2 best = vec2(0.0), which = vec2(0.0);
    int each = uOwn[5] > 0.0 ? 3 : 2;
    float nearCue = 9.0; vec2 cueQ = vec2(1.0); int cueK = 0;
    for (int k = 0; k < 5; k++) {
      int many = k == 4 ? each - 1 : each;
      for (int j = 0; j < many; j++) {
        float w = rrRing(k, j, m, gale);
        float me = float(k * 3 + j);
        if (w > best.x) { best = vec2(w, best.x); which = vec2(me, which.x); }
        else if (w > best.y) { best.y = w; which.y = me; }
      }
      // a cue: every roost lets one more ring go, blown along a little
      if (uCue > 0.004) {
        vec2 cq = m - rrRoost(k).xy - rrWind * 0.10 * (1.0 - uCue);
        float cd = abs(length(cq * vec2(0.9, 1.1)) - 0.05 - 0.36 * (1.0 - uCue));
        if (cd < nearCue) { nearCue = cd; cueQ = cq; cueK = k; }
      }
    }
    for (int i = 1; i >= 0; i--) {
      float most = i == 0 ? best.x : best.y;
      if (most <= 0.002) continue;
      int n = int((i == 0 ? which.x : which.y) + 0.5), k = n / 3;
      rrRing(k, n - k * 3, m, gale);
      float patchy = noise(rrAt * 4.4 + rrSeed), open = smoothstep(-1.1, 0.1, rrDown + (patchy - 0.5) * 1.7);
      float K = 38.0 / rrGrain, size = min((0.0033 + 0.0025 * rrLoud) * rrGrain * K / rrR, 0.29);
      // the flock's faint shade on the map, then the birds
      col *= 1.0 - 0.18 * rrLife * open * exp(-(rrX + 0.8) * (rrX + 0.8) * 0.7);
      rrPut(col, rrInk(k), rrDots(rrAt * K + rrSeed * 13.0, rrPx * K / rrR, size, most * open * (0.4 + 1.3 * patchy), float(k)), 0.92);
    }
    if (uCue > 0.004) {
      float ck = 0.0135 * rrGrain * (1.2 - uCue), torn = noise(cueQ * 9.0 + float(cueK) * 5.0);
      rrPut(col, rrInk(cueK), rrDots(cueQ / ck, rrPx / ck, 0.32, uCue * exp(-nearCue * nearCue * 1100.0) * smoothstep(0.3, 0.62, torn), 41.0), 0.95);
    }
  } else {
    col = rrRain(col, m, h, drift, gale, sweep, spoke);
  }
  // a hit: one flock goes up, tight, and is gone
  vec2 at = vec2(0.06 * sin(uTime * 0.031), -0.37 + 0.04 * sin(uTime * 0.043));
  col *= 1.0 - 0.15 * uHits * exp(-16.0 * dot(m - at, m - at));
  rrFlock(col, rrInk(4), m - at, 0.11 + 0.12 * (1.0 - uHits), 12.0, sqrt(uHits), 5.0);
  // keys: single specks over the water
  if (uKeys > 0.004) {
    float kc = 0.05;
    vec3 kd = rrDots(rot(0.3) * (m - drift) / kc, rrPx / kc, 0.10, 0.16 * uKeys, 77.0);
    rrPut(col, mix(vec3(0.78, 0.22, 0.12), vec3(1.0, 0.72, 0.5), rrNight), kd, 1.0);
  }
  // the side the sun will come from is warmer
  col *= mix(mix(vec3(0.965, 0.99, 1.02), vec3(1.035, 0.985, 0.945), smoothstep(-0.7, 1.1, p.x + 0.8 * p.y)), vec3(1.0), max(rrNight, 0.6 * (1.0 - land))) * (0.93 + 0.14 * uTone);
  // far off the map goes soft in the morning
  float fog = smoothstep(1.2 + 0.3 * uSpace, 2.6 + uSpace, t * length(rd) / f);
  fog = max(fog, smoothstep(-0.2, -0.05, sky));
  vec3 air = mix(vec3(0.90, 0.875, 0.845), vec3(0.95, 0.83, 0.76), smoothstep(-0.2, 0.9, p.x));
  air = mix(air, vec3(0.14, 0.16, 0.24), rrNight);
  col = mix(col, air, fog);
  return col;
}
