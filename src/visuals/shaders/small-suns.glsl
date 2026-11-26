// name: Small suns
// a: On the wall
// b: On white cloth
// what: A limewashed wall in leaf shade, scattered with round images of the sun, wide pale ones and small sharp ones, all rocking together; over some ten minutes a bite creeps into every one until all are crescents, at times thin rings, then they fill; or the same suns falling on white sheets pegged to a line, bending over the folds.
// follows: Drones open the wide faint suns, pads the next, texture the crowds of small ones, keys the smallest; the piece opens and tints those where it sounds, and the phrase is one bright wandering sun. Bands light them by size. Low is the wind. A hit shuts a branch across as a dark wave; a cue bares every gap. The loop leans the light; travel moves the eclipse.
// Like smoothstep, and it may also run down, from the higher edge to the lower.
float ssS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// What every part shares: the moon's place over the sun, how much it covers, how much the light is opened up for it.
vec2 ssMoon; float ssMr, ssGain, ssLone;
void ssEclipse() {
  float k = uTravel / 300.0, n = floor(k), w = fract(k) * 2.0 - 1.0;
  float odd = mod(n, 2.0), off = 4.5 * w * (0.22 + 0.78 * w * w);   // round for a while, then through slowly
  ssMr = 0.93;
  ssMoon = rot(0.75 - 1.2 * mod(n, 3.0)) * vec2(off, mix(0.015, 0.32, odd));
  ssGain = 1.0 + 1.6 * ssS(1.9, 0.0, length(ssMoon));
}
// One image of the sun: d from its middle, r its radius, s its penumbra, in one measure. Warmer and dimmer at its edge.
vec3 ssSun(vec2 d, float r, float s) {
  float l = length(d), m = length(d - ssMoon * r);
  float a = ssS(r + s, r - s, l) * ssS(ssMr * r - s, ssMr * r + s, m);
  float e = sat(l / r);
  return a * mix(vec3(1.0), vec3(0.92, 0.72, 0.5), e * e * e);
}
// All the suns that fall on a place q: how much light. at is the place in the picture, blur makes them softer.
vec3 ssSuns(vec2 q, vec2 at, vec4 pm, float blur) {
  vec3 sum = vec3(0.0);
  float px = 1.2 / uRes.y, soft = mix(1.5, 0.6, uTone);
  float wind = 0.35 + 0.9 * uLow + 0.4 * uSpace;
  float hitAt = mix(-0.6, 1.0, 1.0 - uHits), hit = uHits * (1.0 - 0.9 * uCue);
  mat2 turn = mat2(1.0, 0.0, 0.0, 1.0);
  const mat2 STEP = mat2(0.737, 0.676, -0.676, 0.737);
  float cell = 0.62, there = sat(0.5 * uLevel + pm.a);
  vec2 here = q + wind * 0.006 * vec2(sin(uTime * 0.29), cos(uTime * 0.37));
  vec3 own = mix(vec3(0.8), pm.rgb / (max(pm.r, max(pm.g, pm.b)) + 0.02), sat(4.0 * pm.a));
  for (int l = 0; l < (blur > 0.0 ? 3 : 6); l++) {
    float fl = float(l);
    cell *= 0.655; turn = STEP * turn;
    float heard = l == 0 ? uDrone : l == 1 ? uPad : l < 4 ? there : uTexture;
    vec3 kc = l < 2 ? uKind[l] : l < 4 ? own : uKind[2];
    float answer = heard * (0.4 + uEnergy);
    // the further the gap, the wider the sun and the more it rocks
    vec2 sway = wind * cell * 0.1 * vec2(sin(uTime * 0.47 + fl * 1.1 + at.x * 1.3), 0.6 * sin(uTime * 0.61 + fl * 2.0 + at.y * 1.7));
    vec2 u = turn * (here + sway) / cell + fl * vec2(7.31, 3.77), i0 = floor(u - 0.5);
    float most = (l > 3 ? 0.4 + 0.24 * heard : 0.66 + 0.4 * heard) + (l > 4 ? 0.35 * uKeys : 0.0) + 0.75 * uCue + 0.07;
    for (int j = 0; j < 4; j++) {
      vec2 id = i0 + vec2(j & 1, j >> 1);
      float h = hash21(id + fl * 19.7), gap = fract(h * 311.7);
      if (gap >= most) continue;                                    // a gap that cannot be open now
      float h2 = fract(h * 57.31), h3 = fract(h * 131.7), h4 = fract(h * 717.3);
      vec2 d = u - id - 0.5 - (vec2(h, h2) - 0.5) * 0.7;
      if (dot(d, d) > 0.4225) continue;
      float r = mix(0.17, 0.45, h3 * h3) * mix(0.88, 1.08, uSpace);
      float s = r * mix(0.05, 0.3, h4) * (1.6 - 0.2 * fl) * soft * (0.7 + 0.6 * uSpace) + (px + blur) / cell;
      s = min(s, 0.65 - r);
      float reach = r + s;
      if (dot(d, d) > reach * reach) continue;
      d = d * turn;
      vec2 c = q - d * cell;                                        // where this one lies
      // the canopy is thin here and thick there
      float thin = sat(0.42 + 0.5 * sin(c.x * 2.3 + c.y * 3.7 + 1.0) + 0.34 * sin(c.x * 5.3 - c.y * 4.1 + 0.6 + 1.6 * sin(c.y * 3.0)));
      float open = thin * (l > 3 ? 0.4 : 0.66) + (l > 3 ? 0.04 + 0.2 * thin : 0.08 + 0.32 * thin) * heard + (l > 4 ? 0.35 * uKeys : 0.0) + 0.75 * uCue - 0.03;
      open = ssS(-0.1, 0.12, open - gap);
      if (open <= 0.0) continue;
      float b = band((fl + 0.95 - 2.0 * r) / 5.5);
      if (hit > 0.004) {
        float shut = (c.x * 0.9 + c.y * 0.35 - hitAt) / 0.22;
        open *= 1.0 - 0.95 * hit * exp(-shut * shut);
      }
      float pale = mix(0.26 + 0.3 * heard * step(fl, 0.5), 0.85, fl / 5.0) * (1.2 - 1.3 * (r - 0.17)) * (0.4 + 1.1 * h2);
      vec3 tint = mix(vec3(1.0), kc * 1.3, 0.75 * sat(answer) * step(0.35, h4));
      sum += ssSun(d, r, s) * tint * open * pale * (0.95 + 0.4 * answer + 0.5 * b * uEnergy);
    }
  }
  // the phrase: one bright sun that wanders
  vec2 way = vec2(0.54 * sin(uTime * 0.093 - 2.3) - 0.1, 0.26 * sin(uTime * 0.131) - 0.02);
  ssLone = ssSun(q - way, 0.066, 0.009 * soft + px + blur).x;
  return sum;
}
// The wall: limewash above, a band of clay colour along its foot, and a little relief.
vec3 ssWall(vec2 p, out float relief) {
  float n1 = noise(p * 4.0 + 3.0), n2 = noise(p * vec2(17.0, 23.0)), fine = noise(p * 330.0);
  vec2 g = rot(0.9) * p * 70.0;
  relief = 0.95 * (noise(g) - noise(g + vec2(0.4, 0.2))) + 0.3 * (fine - 0.5) + 0.35 * (n2 - 0.5);
  vec3 lime = mix(vec3(0.86, 0.75, 0.60), vec3(0.84, 0.79, 0.70), n1) * (0.95 + 0.1 * n2);
  float edge = p.y + 0.285 + 0.003 * (n2 - 0.5) - 0.005 * sin(p.x * 2.0), aa = 0.8 / uRes.y;
  vec3 clay = mix(vec3(0.52, 0.31, 0.235), vec3(0.62, 0.41, 0.31), 0.6 * n1 + 0.4 * n2);
  vec3 c = mix(clay, lime, ssS(-aa, aa, edge));
  return c * (1.0 - 0.35 * ssS(0.0025 + aa, 0.0025 - aa, abs(edge - 0.001)) * (0.5 + 0.5 * n2));
}
vec3 ssOn(vec3 albedo, vec3 suns, float shade) {
  suns = 2.5 * (1.0 - exp(-0.9 * suns * ssGain));
  suns = mix(suns, mix(vec3(1.0), uKind[3] * 1.2, 0.25 * uPhrase) * 3.6, ssLone * (0.2 + 0.8 * uPhrase));
  return albedo * (vec3(0.27, 0.262, 0.318) * shade + suns * vec3(1.0, 0.80, 0.52) * (1.0 + 0.2 * uMic));
}
vec2 ssSlant(vec2 p) {
  float lean = cos(TAU * uLoop);
  vec2 q = rot(0.5) * p; q.x *= 0.82 + 0.02 * lean; q = rot(-0.5) * q;
  return q + vec2(0.012, 0.005) * sin(TAU * uLoop);
}
// The cloths. How deep the folds are at a place x, y below the line; seed is which cloth; ssPeg0 is where its first peg is.
float ssPeg0(float seed) { return seed < 2.0 ? -0.19 : seed < 5.0 ? -0.07 : 0.68; }
float ssFold(vec2 x, float seed) {
  float drop = max(0.36 - x.y, 0.0), e = 1.0 - exp(-drop * 5.0), bend = x.x + 0.03 * sin(x.y * 4.0 + seed);
  float wind = 0.5 + 0.8 * uLow;
  float u = fract((x.x - ssPeg0(seed)) * 5.0), near = min(u, 1.0 - u) * 0.2;      // how far the next peg is
  float pull = drop > 0.5 ? 0.0 : cos(near / (drop + 0.06) * 10.0) * exp(-drop * 8.0) * ssS(0.1, 0.05, near) * ssS(0.5, 0.4, drop);
  float a = bend * 23.0 + 1.6 * sin(bend * 4.3 + seed) + 0.5 * wind * sin(uTime * 0.31 + x.y * 2.0);
  a = sin(a + 0.6 * sin(a + 0.5));
  float b = sin(bend * 51.0 + 2.0 * sin(bend * 9.0 - seed) + x.y * 3.0);
  float c = sin(bend * 5.1 - x.y * 1.3 - uTime * 0.43 + seed);
  return 0.014 * pull + e * (0.024 * a * (0.65 + 0.35 * c) + 0.004 * b * (0.5 + 0.5 * a) + 0.03 * wind * c * drop);
}
// One cloth hanging from the line between x0 and x1 down to y0. Returns how much of it is here, and how near its hem.
vec2 ssCloth(vec2 p, float x0, float x1, float y0, float seed) {
  float drop = 0.36 - p.y, aa = 1.0 / uRes.y, wind = 0.5 + 0.8 * uLow;
  float wave = 0.02 * drop * wind * sin(uTime * 0.43 + p.y * 5.0 + seed);
  float l = p.x - x0 - wave - 0.015 * drop, r = x1 + wave * 0.8 - p.x - 0.02 * drop;
  float b = p.y - y0 - 0.008 * sin(p.x * 21.0 + 1.6 * sin(p.x * 4.3 + seed)) - 0.01 * wind * sin(p.x * 5.1 - uTime * 0.43 + seed);
  float in_ = min(min(l, r), b);
  return vec2(ssS(-aa, aa, in_) * ssS(-aa, aa, drop), b);
}
// Pegs only where a cloth hangs.
float ssPegged(float x) { return x < -0.15 || x > 0.64 || abs(x - 0.23) < 0.33 ? 1.0 : 0.0; }
vec3 render(vec2 p) {
  ssEclipse();
  vec4 pm = piece(sat(vec2(p.x / 1.78 + 0.5, 0.5 - p.y)));
  vec2 q = ssSlant(p);
  if (uVar < 0.5) {
    float relief;
    vec3 w = ssWall(p, relief);
    vec3 s = ssSuns(q, p, pm, 0.0) * (1.0 + 0.5 * relief);
    return screenOf(ssOn(w, s, (0.95 + 0.2 * relief) * (0.8 + 0.25 * ssS(-0.9, 0.9, p.x))));
  }
  float aa = 1.0 / uRes.y;
  p.y -= 0.012 * (p.x * p.x * 2.0 - 0.5);                                          // the line sags
  float seed = p.x < -0.13 ? 1.0 : p.x < 0.61 ? 4.0 : 7.0;
  vec3 hang = seed < 2.0 ? vec3(-1.7, -0.17, -0.8) : seed < 5.0 ? vec3(-0.09, 0.56, -0.31) : vec3(0.66, 1.7, -0.8);
  vec2 c = ssCloth(p, hang.x, hang.y, hang.z, seed);
  float on = c.x;
  // the wall behind, out of the sharp
  float n1 = noise(p * 4.0 + 3.0);
  vec3 back = mix(vec3(0.34, 0.2, 0.15), vec3(0.60, 0.53, 0.44), ssS(-0.31, -0.25, p.y)) * (0.8 + 0.25 * n1);
  float shadow = ssS(0.06, -0.06, max(max(-p.x - 0.1, p.x - 0.62), max(-p.y - 0.36, p.y - 0.32)));
  float h = 0.0; vec2 g = vec2(0.0);
  if (on > 0.0) {
    h = ssFold(p, seed);
    g = vec2(ssFold(p + vec2(0.004, 0.0), seed) - h, ssFold(p + vec2(0.0, 0.008), seed) - h) / vec2(0.004, 0.008);
    q += vec2(0.8, 0.5) * h;
  }
  vec3 s = ssSuns(q, p, pm, on > 0.0 ? 0.0 : 0.03);
  vec3 col = ssOn(back, s * (1.0 - 0.7 * shadow), 0.85 - 0.25 * shadow);
  if (on > 0.0) {
    vec3 n = normalize(vec3(-g, 1.0));
    float face = sat(dot(n, normalize(vec3(0.6, 0.45, 0.7)))), sky = 0.5 + 0.5 * dot(n, normalize(vec3(-0.75, 0.5, 0.3)));
    float weave = (noise(p * vec2(300.0, 420.0)) - 0.5);
    vec3 cloth = vec3(0.93, 0.90, 0.86) * (1.0 + 0.05 * weave);
    float hem = seed == 4.0 ? ssS(0.03 + aa, 0.03 - aa, c.y) : 0.0;
    cloth *= 1.0 - 0.06 * hem - 0.10 * ssS(2.0 * aa, 0.0, abs(c.y - 0.03)) * step(3.5, seed) * step(seed, 4.5);
    // another line, nearer the sun, lays its shadow over the folds
    float rope = p.y - 0.16 + 0.22 * p.x - 0.05 * p.x * p.x + 0.7 * h;
    s *= 1.0 - 0.7 * ssS(0.015, 0.0, abs(rope));
    vec3 lit = ssOn(cloth, s * (0.2 + 1.1 * face), 0.16 + 2.1 * sky * sky);
    col = mix(col, lit, on);
  }
  // the line and its pegs
  col = mix(col, vec3(0.10, 0.09, 0.085), ssS(0.0022 + aa, 0.0022 - aa, abs(p.y - 0.362)));
  float u = fract((p.x - ssPeg0(seed)) * 5.0 + 0.5) - 0.5;
  vec2 k = vec2(u * 0.2 + 0.06 * (p.y - 0.36) * sin(p.x * 17.0), p.y - 0.357);
  float peg = max(abs(k.x) - 0.0065 + 0.04 * max(k.y, 0.0), abs(k.y) - 0.021);
  vec3 wood = vec3(0.42, 0.29, 0.17) * (0.35 + 0.5 * ssS(-0.006, 0.006, k.x) + 0.5 * sat(dot(s, vec3(0.4))));
  col = mix(col, wood, ssS(aa, -aa, peg) * ssPegged(p.x));
  return screenOf(col);
}
