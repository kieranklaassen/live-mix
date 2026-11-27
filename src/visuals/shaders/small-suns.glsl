// name: Small suns
// a: On the wall
// b: On white cloth
// what: A limewashed wall in leaf shade, scattered with round images of the sun, wide pale ones and small sharp ones, all rocking together; over some ten minutes a bite creeps into every one until all are crescents, at times thin rings, then they fill; or the same suns falling on white sheets pegged to a line, bending over the folds.
// follows: Drones open the wide faint suns, pads the next, texture the crowds of small ones, keys the smallest; the piece opens and tints those where it sounds, and the phrase is one bright wandering sun. Bands light them by size. Low is the wind. A hit shuts a branch across as a dark wave; a cue bares every gap. The loop leans the light; travel moves the eclipse.
// own: 0 1 crowds of small suns, -1 a few great ones; 1 1 all bitten to crescents whose horns turn slowly, -1 the light of small paned windows; 2 1 night, no light but the suns' own, -1 a bright pale day; 3 1 laid stones (b: sharp pleats), -1 moving water with the lights drawn down it (b: watered silk); 4 1 coloured in the sounds' colours, the ground in the drone's, -1 the suns are shadows and all round them is lit; 5 a: 1 a floor running back among tree trunks, -1 drawn out long by a low sun; b: 1 one cloth fills the picture, -1 the cloths shrunk to a few kerchiefs; 6 1 in an even grid, -1 gathered in one pool of light; 7 1 rings only, -1 the lights fall slowly, the small ones faster
// Like smoothstep, and it may also run down, from the higher edge to the lower.
float ssS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// What every part shares: the moon's place over the sun, how much it covers, how much the light is opened up for it.
float ssZ, ssPx; vec2 ssRip, ssOff;   // how near the eye is to one cloth and where, and how wide a pixel is there
const float SS_HOR = 0.72;
vec2 ssMoon; float ssMr, ssGain, ssLone;
void ssEclipse() {
  float k = uTravel / 300.0, n = floor(k), w = fract(k) * 2.0 - 1.0;
  float odd = mod(n, 2.0), off = 4.5 * w * (0.22 + 0.78 * w * w);   // round for a while, then through slowly
  ssMr = 0.93;
  ssMoon = rot(0.75 - 1.2 * mod(n, 3.0)) * vec2(off, mix(0.015, 0.32, odd));
  if (uOwn[1] > 0.0) {
    float a = 0.6 + uTime * 0.021;
    ssMoon = mix(ssMoon, (0.34 + 0.12 * sin(uTime * 0.043)) * vec2(cos(a), sin(a)), uOwn[1]);
  }
  ssGain = 1.0 + 1.6 * ssS(1.9, 0.0, length(ssMoon));
}
// One image of the sun: d from its middle, r its radius, s its penumbra, in one measure. Warmer and dimmer at its edge.
vec3 ssSun(vec2 d, float r, float s) {
  float l = length(d), m = length(d - ssMoon * r);
  float bite = ssS(ssMr * r - s, ssMr * r + s, m);
  if (uOwn[1] < 0.0) {                 // a window of four panes, the light a little askew
    vec2 b = abs(d + vec2(0.22 * d.y, 0.0)) * vec2(1.2, 0.92);
    l = mix(l, max(b.x, b.y), -uOwn[1]);
    float bar = ssS(0.03 * r, 0.03 * r + 0.8 * s + 0.07 * r, b.x) * ssS(0.03 * r, 0.03 * r + 0.8 * s + 0.07 * r, b.y);
    bite = mix(bite, bar, -uOwn[1]);
  }
  float a = ssS(r + s, r - s, l) * bite;
  if (uOwn[7] > 0.0) a *= 1.0 - uOwn[7] * 0.93 * ssS(r * 0.94, r * 0.76 - s, l);
  float e = sat(l / r);
  return a * mix(vec3(1.0), vec3(0.92, 0.72, 0.5), e * e * e);
}
// Where in the piece the middle of a sun lies, so that one sun is of one colour: the slant and the floor taken off again.
vec2 ssPlace(vec2 c) {
  if (uOwn[3] < 0.0) c.y /= 1.0 + 0.5 * uOwn[3];
  if (uVar < 0.5 && uOwn[5] < 0.0) { c = vec2(0.9131 * c.x + 0.4078 * c.y, 0.9131 * c.y - 0.4078 * c.x); c *= vec2(1.0 - 2.4 * uOwn[5], 1.0 / (1.0 - 0.25 * uOwn[5])); c = vec2(0.9131 * c.x - 0.4078 * c.y, 0.9131 * c.y + 0.4078 * c.x); }
  c = rot(0.5) * c; c.x /= 0.82; c = rot(-0.5) * c;
  if (uVar > 0.5) c = (c - ssOff) / ssZ;
  else if (uOwn[5] > 0.0) { float w = 1.0 / (1.0 + uOwn[5] / SS_HOR * max(c.y + 0.5, 0.0)); c = vec2(c.x * w, (c.y + 0.5) * w - 0.5); }
  return sat(vec2(c.x / 1.78 + 0.5, 0.5 - c.y));
}
// All the suns that fall on a place q: how much light. at is the place in the picture, blur makes them softer.
vec3 ssSuns(vec2 q, vec2 at, vec4 pm, float blur) {
  vec3 sum = vec3(0.0);
  float px = 1.2 / uRes.y * ssPx, soft = mix(1.5, 0.6, uTone);
  float wind = 0.35 + 0.9 * uLow + 0.4 * uSpace;
  float hitAt = mix(-0.6 + 1.0 * clamp(-uOwn[6], 0.0, 0.55), 1.0, 1.0 - uHits), hit = uHits * (1.0 - 0.9 * uCue);
  mat2 turn = mat2(1.0, 0.0, 0.0, 1.0);
  const mat2 STEP = mat2(0.737, 0.676, -0.676, 0.737);
  float cell = 0.62 * exp2(-uOwn[0]) * ssZ, there = sat(0.5 * uLevel + pm.a);
  vec2 here = q + wind * 0.006 * vec2(sin(uTime * 0.29), cos(uTime * 0.37));
  vec3 own = mix(vec3(0.8), pm.rgb / (max(pm.r, max(pm.g, pm.b)) + 0.02), sat(4.0 * pm.a));
  float even = max(uOwn[6], 0.0), dyed = abs(uOwn[4]), panes = max(-uOwn[1], 0.0);
  vec2 pooled = vec2(0.17 + 0.1 * sin(uTime * 0.037), 0.03 * sin(uTime * 0.051) - 0.03);
  vec2 fall = max(-uOwn[7], 0.0) * ssZ * uTime * vec2(-0.012, 0.034);
  for (int l = 0; l < (blur > 0.0 ? 3 : 6); l++) {
    float fl = float(l);
    cell *= 0.655; turn = STEP * turn;
    float heard = l == 0 ? uDrone : l == 1 ? uPad : l < 4 ? there : uTexture;
    vec3 kc = l < 2 ? uKind[l] : l < 4 ? own : uKind[2];
    float answer = heard * (0.4 + uEnergy);
    // the further the gap, the wider the sun and the more it rocks
    vec2 sway = wind * cell * 0.1 * vec2(sin(uTime * 0.47 + fl * 1.1 + at.x * 1.3), 0.6 * sin(uTime * 0.61 + fl * 2.0 + at.y * 1.7));
    sway += fall * (1.25 - 0.1 * fl);
    vec2 u = turn * (here + sway) / cell + fl * vec2(7.31, 3.77), i0 = floor(u - 0.5);
    float most = (l > 3 ? 0.4 + 0.24 * heard : 0.66 + 0.4 * heard) + (l > 4 ? 0.35 * uKeys : 0.0) + 0.75 * uCue + 0.07;
    float only = l == 2 ? 1.0 : 1.0 - even;
    only *= l < 3 ? 1.0 : 1.0 - panes;
    if (only <= 0.0) continue;
    most += 2.0 * even;
    if (uOwn[6] < 0.0) most -= 0.7 * uOwn[6];
    for (int j = 0; j < 4; j++) {
      vec2 id = i0 + vec2(j & 1, j >> 1);
      float h = hash21(id + fl * 19.7), gap = fract(h * 311.7);
      if (gap >= most) continue;                                    // a gap that cannot be open now
      float h2 = fract(h * 57.31), h3 = fract(h * 131.7), h4 = fract(h * 717.3);
      vec2 d = u - id - 0.5 - (vec2(h, h2) - 0.5) * 0.7 * (1.0 - even);
      if (dot(d, d) > 0.4225) continue;
      float r = mix(0.17, 0.45, h3 * h3) * mix(0.88, 1.08, uSpace);
      r = mix(r, 0.3 + 0.05 * heard + 0.05 * h3, even);
      float s = r * mix(0.05, 0.3, h4) * (1.6 - 0.2 * fl) * soft * (0.7 + 0.6 * uSpace) + (px + blur) / cell;
      s = min(s, 0.65 - r);
      float reach = r + s;
      r *= 1.0 - 0.3 * panes; reach *= 1.0 + 0.15 * panes;
      if (dot(d, d) > reach * reach) continue;
      d = d * turn;
      vec2 c = q - d * cell;                                        // where this one lies
      // the canopy is thin here and thick there
      float thin = sat(0.42 + 0.5 * sin(c.x * 2.3 + c.y * 3.7 + 1.0) + 0.34 * sin(c.x * 5.3 - c.y * 4.1 + 0.6 + 1.6 * sin(c.y * 3.0)));
      float open = thin * (l > 3 ? 0.4 : 0.66) + (l > 3 ? 0.04 + 0.2 * thin : 0.08 + 0.32 * thin) * heard + (l > 4 ? 0.35 * uKeys : 0.0) + 0.75 * uCue - 0.03;
      open += even * 1.2;
      if (uOwn[6] < 0.0) {
        vec2 o = (c - ssOff) / ssZ - pooled;
        float pool = exp(-dot(o, o) * 7.5);
        open += -uOwn[6] * (1.3 * pool - 0.62);
      }
      open = ssS(-0.1, 0.12, open - gap);
      if (open <= 0.0) continue;
      float b = band((fl + 0.95 - 2.0 * r) / 5.5);
      if (hit > 0.004) {
        vec2 hc = (c - ssOff) / ssZ;
        float shut = (hc.x * 0.9 + hc.y * 0.35 - hitAt) / 0.22;
        open *= 1.0 - 0.95 * hit * exp(-shut * shut);
      }
      float pale = mix(0.26 + 0.3 * heard * step(fl, 0.5), 0.85, fl / 5.0) * (1.2 - 1.3 * (r - 0.17)) * (0.4 + 1.1 * h2);
      vec3 tint = mix(vec3(1.0), kc * 1.3, 0.75 * sat(answer) * step(0.35, h4));
      if (dyed > 0.0) {
        vec4 pc = piece(ssPlace(c));
        vec3 dye = mix(h2 > 0.93 ? uKind[3] : h4 > 0.385 ? uKind[2] : uKind[1], mix(vec3(0.8), pc.rgb / (max(pc.r, max(pc.g, pc.b)) + 0.02), sat(4.0 * pc.a)), 0.65 * sat(3.0 * pc.a));
        tint = mix(tint, dye * dye * 1.8, dyed);
      }
      sum += only * ssSun(d, r, s) * tint * open * pale * (0.95 + 0.4 * answer + 0.5 * b * uEnergy);
    }
  }
  // the phrase: one bright sun that wanders
  vec2 way = vec2(0.54 * sin(uTime * 0.093 - 2.3) - 0.1, 0.26 * sin(uTime * 0.131) - 0.02);
  way = way * ssZ + ssOff;
  ssLone = ssSun(q - way, 0.066 * ssZ, 0.009 * soft * ssZ + px + blur).x;
  return sum;
}
// Ripples: how far they push what is seen in them, across and along.
vec2 ssWater(vec2 p) {
  float t = uTime, y = p.y * (1.0 + 0.5 * p.y);
  vec2 q = vec2(p.x * 1.7, y * 7.0);
  float a = noise(q * 3.1 + vec2(0.11 * t, 0.23 * t)) - 0.5, b = noise(q * 7.3 + vec2(-0.19 * t, 0.31 * t)) - 0.5, c = noise(q * 1.3 - vec2(0.05 * t, 0.12 * t)) - 0.5;
  return vec2(0.042 * a + 0.026 * b, 0.05 * c + 0.03 * a) * (0.75 + 0.5 * uLow);
}
// The wall: limewash above, a band of clay colour along its foot, and a little relief.
vec3 ssWall(vec2 p, out float relief) {
  float n1 = noise(p * 4.0 + 3.0), n2 = noise(p * vec2(17.0, 23.0)), fine = noise(p * 330.0);
  vec2 g = rot(0.9) * p * 70.0;
  relief = 0.95 * (noise(g) - noise(g + vec2(0.4, 0.2))) + 0.3 * (fine - 0.5) + 0.35 * (n2 - 0.5);
  vec3 lime = mix(vec3(0.86, 0.75, 0.60), vec3(0.84, 0.79, 0.70), n1) * (0.95 + 0.1 * n2);
  float edge = p.y + 0.285 + 0.003 * (n2 - 0.5) - 0.005 * sin(p.x * 2.0), aa = 0.8 / uRes.y;
  if (uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] > 0.0) edge = mix(edge, 1.0, sat(4.0 * max(abs(uOwn[3]), max(abs(uOwn[4]), uOwn[5]))));
  if (uOwn[4] != 0.0) lime = mix(lime, uKind[0] * uKind[0] * (0.82 + 0.3 * n1 + 0.1 * n2), abs(uOwn[4]));
  if (uOwn[3] > 0.0) {                 // stones laid in courses, each with a worn round top
    vec2 w = p + 0.012 * vec2(noise(p * 7.0) - 0.5, noise(p * 7.0 + 31.0) - 0.5) * 2.0;
    vec2 g2 = w / vec2(0.21, 0.135);
    float row = floor(g2.y);
    g2.x += 0.5 * mod(row, 2.0) + 0.3 * (hash11(row + 3.0) - 0.5);
    vec2 id = floor(g2), f = fract(g2) - 0.5;
    float h = hash21(id + 5.0), h2 = fract(h * 91.7);
    vec2 b = (vec2(0.5) - abs(f)) * vec2(0.21, 0.135);
    float in_ = min(smin(b.x, b.y, 0.03), 0.06) - 0.004 - 0.004 * n2;
    float top = ssS(0.0, 0.03, in_), joint = ssS(-0.002, 0.005 + 0.001 * ssPx, in_);
    vec2 tilt = f * vec2(0.9, 1.0) * (1.0 - top) + 0.16 * (vec2(h, h2) - 0.5);
    float rel = dot(tilt, vec2(-1.1, 1.5)) + 0.4 * (noise(p * 46.0 + h * 9.0) - 0.5);
    relief = mix(relief, rel + 0.5 * relief, uOwn[3]);
    vec3 stone = lime * (0.62 + 0.5 * h) * mix(vec3(1.0), vec3(1.05, 0.97, 0.9), h2) * (0.8 + 0.3 * noise(p * 23.0 + h * 40.0));
    lime = mix(lime, mix(lime * 0.2, stone, joint), uOwn[3]);
  }
  if (uOwn[3] < 0.0) {                 // water: dark, with a little sky on the far side of each ripple
    vec2 w = ssRip = ssWater(p);
    relief = mix(relief, w.x * 9.0, -uOwn[3]);
    lime = mix(lime, lime * (0.30 + 2.6 * max(w.x, 0.0)), -uOwn[3]);
  }
  vec3 clay = mix(vec3(0.52, 0.31, 0.235), vec3(0.62, 0.41, 0.31), 0.6 * n1 + 0.4 * n2);
  vec3 c = mix(clay, lime, ssS(-aa, aa, edge));
  return c * (1.0 - 0.35 * ssS(0.0025 + aa, 0.0025 - aa, abs(edge - 0.001)) * (0.5 + 0.5 * n2));
}
vec3 ssOn(vec3 albedo, vec3 suns, float shade) {
  vec3 all = suns * ssGain;
  suns = 2.5 * (1.0 - exp(-0.9 * suns * ssGain));
  if (uOwn[4] != 0.0) {                  // many lights of one colour on each other stay that colour
    float top = max(all.r, max(all.g, all.b)) + 1e-4;
    suns = mix(suns, all / top * 2.2 * (1.0 - exp(-0.8 * top)), 0.85 * abs(uOwn[4]));
  }
  vec3 lone = mix(vec3(1.0), uKind[3] * 1.2, 0.25 * uPhrase) * 3.6;
  if (uOwn[4] != 0.0) lone = mix(lone, uKind[3] * uKind[3] * 2.4, abs(uOwn[4]));
  suns = mix(suns, lone, ssLone * (0.2 + 0.8 * uPhrase));
  if (uOwn[2] != 0.0 || uOwn[4] != 0.0) {
    vec3 amb = vec3(0.27, 0.262, 0.318), sun = vec3(1.0, 0.80, 0.52);
    sun = mix(sun, vec3(1.0, 0.93, 0.84), max(abs(uOwn[4]), max(uOwn[2], 0.0)));
    if (uOwn[4] < 0.0) suns = mix(suns, 1.75 * exp(-1.9 * dot(suns, vec3(0.35, 0.4, 0.25))) + 0.16 * suns, -uOwn[4]);
    if (uOwn[2] > 0.0) amb *= 1.0 - 0.9 * uOwn[2];
    if (uOwn[2] < 0.0) { amb = mix(amb, vec3(0.86, 0.89, 0.97), -uOwn[2]); sun *= 1.0 + 0.3 * uOwn[2]; }
    if (uOwn[4] < 0.0) amb = mix(amb, uKind[1] * uKind[1] * 0.75, -0.8 * uOwn[4]);
    return albedo * amb * shade + mix(albedo, vec3(0.8), 0.8 * max(uOwn[2], 0.0)) * suns * sun * (1.0 + 0.2 * uMic);
  }
  return albedo * (vec3(0.27, 0.262, 0.318) * shade + suns * vec3(1.0, 0.80, 0.52) * (1.0 + 0.2 * uMic));
}
vec2 ssSlant(vec2 p) {
  float lean = cos(TAU * uLoop);
  vec2 q = rot(0.5) * p; q.x *= 0.82 + 0.02 * lean; q = rot(-0.5) * q;
  if (uVar < 0.5 && uOwn[5] < 0.0) { q = vec2(0.9131 * q.x + 0.4078 * q.y, 0.9131 * q.y - 0.4078 * q.x); q *= vec2(1.0 / (1.0 - 2.4 * uOwn[5]), 1.0 - 0.25 * uOwn[5]); q = vec2(0.9131 * q.x - 0.4078 * q.y, 0.9131 * q.y + 0.4078 * q.x); }
  if (uOwn[3] < 0.0) q = mix(q, q * vec2(1.0, 0.5), -uOwn[3]);
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
  if (uOwn[3] > 0.0) {                 // pressed into pleats
    float w = bend * 92.0 + 0.5 * wind * sin(uTime * 0.31 + x.y * 2.0), z = asin(0.97 * sin(w)) / 1.4;
    a = mix(a, 1.15 * z, uOwn[3]); b *= 1.0 - uOwn[3]; c *= 1.0 - 0.6 * uOwn[3];
  }
  if (uOwn[3] < 0.0) {
    float w = noise(vec2(bend * 9.0, x.y * 34.0 + 0.1 * uTime)) + 0.6 * noise(vec2(bend * 21.0 + 5.0, x.y * 80.0)) - 0.8;
    a = mix(a, 0.45 * a + 0.5 * w, -uOwn[3]);
  }
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
// What stands behind the floor under the trees: light between the trunks, the nearer ones darker.
vec3 ssTrunks(vec2 p, vec3 col) {
  float k = uOwn[5], far = 1.0 - k * (p.y + 0.5) / SS_HOR;
  vec3 tone = mix(vec3(0.42, 0.40, 0.33), uKind[0] * uKind[0], abs(uOwn[4])), air = mix(vec3(0.9, 0.82, 0.64), mix(uKind[3], uKind[1], 0.3) * mix(uKind[3], uKind[1], 0.3), abs(uOwn[4]));
  air *= mix(0.62, 0.05, max(uOwn[2], 0.0)) * (1.0 + 0.6 * max(-uOwn[2], 0.0)) * (0.8 + 0.4 * noise(vec2(p.x * 3.0, p.y * 4.0 + 0.02 * uTime)));
  vec3 back = air;
  float hor = SS_HOR / k - 0.5;
  for (int i = 0; i < 3; i++) {
    float fi = float(i), dens = 9.0 - 2.6 * fi, x = p.x * dens + fi * 3.7 + 0.12 * sin(p.y * 2.0 + fi * 5.0), id = floor(x);
    float h = hash11(id + fi * 17.0), d = abs(x - id - 0.5 - 0.4 * (h - 0.5)) - (0.09 + 0.11 * fract(h * 37.0)) * (1.0 + 0.25 * exp(-max(p.y - hor, 0.0) * 12.0));
    float on = ssS(0.02, -0.02, d / dens * 8.0) * step(0.25, fract(h * 7.3)) * ssS(-0.006, 0.006, p.y - hor + 0.05 * fi * k - 0.012 * (noise(vec2(p.x * 40.0, fi)) - 0.3));
    back = mix(back, mix(air * 0.75, tone * 0.1 * (1.0 - 0.85 * max(uOwn[2], 0.0)), (fi + 1.0) / 3.0), on);
    col = mix(col, back, on * step(p.y, hor) * step(0.5, fi));
  }
  float haze = ssS(0.34, 0.02, far) * k;
  return mix(col, back, max(haze * 0.9, ssS(0.02, 0.0, far)));
}
vec3 render(vec2 p) {
  ssEclipse();
  ssZ = 1.0; ssPx = 1.0; ssOff = vec2(0.0);
  vec4 pm = piece(sat(vec2(p.x / 1.78 + 0.5, 0.5 - p.y)));
  vec2 eye = p;
  if (uVar < 0.5 && uOwn[5] > 0.0) {
    float w = max(1.0 - uOwn[5] * (p.y + 0.5) / SS_HOR, 0.03);
    p = vec2(p.x / w, (p.y + 0.5) / w - 0.5);
    ssPx = 1.0 / w;
  }
  if (uVar > 0.5 && uOwn[5] > 0.0) {
    ssZ = mix(1.0, 0.355, uOwn[5]); ssOff = vec2(0.235, -0.015) * uOwn[5]; ssPx = ssZ;
    p = p * ssZ + ssOff;
  }
  vec2 q = ssSlant(p);
  if (uVar < 0.5) {
    float relief;
    vec3 w = ssWall(p, relief);
    if (uOwn[3] < 0.0) q -= uOwn[3] * ssRip;
    if (uOwn[5] > 0.0) relief *= sat(1.6 / ssPx);
    vec3 s = ssSuns(q, eye, pm, 0.0) * (1.0 + 0.5 * relief);
    vec3 wet = vec3(0.0);
    if (uOwn[3] < 0.0 && uOwn[4] >= 0.0) wet = -uOwn[3] * (0.55 - 0.45 * max(uOwn[2], 0.0)) * (1.0 - exp(-0.9 * s * ssGain)) * vec3(1.0, 0.92, 0.8);
    vec3 col = wet + ssOn(w, s, (0.95 + 0.2 * relief) * (0.8 + 0.25 * ssS(-0.9, 0.9, eye.x)));
    if (uOwn[5] > 0.0) col = ssTrunks(eye, col);
    return screenOf(col);
  }
  float aa = 1.0 / uRes.y;
  p.y -= 0.012 * (p.x * p.x * 2.0 - 0.5);                                          // the line sags
  float seed = p.x < -0.13 ? 1.0 : p.x < 0.61 ? 4.0 : 7.0;
  vec3 hang = seed < 2.0 ? vec3(-1.7, -0.17, -0.8) : seed < 5.0 ? vec3(-0.09, 0.56, -0.31) : vec3(0.66, 1.7, -0.8);
  if (uOwn[5] < 0.0) hang = mix(hang, seed < 2.0 ? vec3(-0.62, -0.36, 0.02) : seed < 5.0 ? vec3(0.08, 0.31, -0.08) : vec3(0.70, 0.83, 0.08), -uOwn[5]);
  vec2 c = ssCloth(p, hang.x, hang.y, hang.z, seed);
  float on = c.x;
  // the wall behind, out of the sharp
  float n1 = noise(p * 4.0 + 3.0);
  vec3 back = mix(vec3(0.34, 0.2, 0.15), vec3(0.60, 0.53, 0.44), ssS(-0.31, -0.25, p.y)) * (0.8 + 0.25 * n1);
  if (uOwn[4] != 0.0) back = mix(back, mix(uKind[0], uKind[1], 0.8) * mix(uKind[0], uKind[1], 0.8) * 0.45 * (0.8 + 0.3 * n1), abs(uOwn[4]));
  float shadow = ssS(0.06, -0.06, max(max(-p.x - 0.1, p.x - 0.62), max(-p.y - 0.36, p.y - 0.32)));
  if (uOwn[5] != 0.0) shadow *= 1.0 - abs(uOwn[5]);
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
    if (uOwn[4] != 0.0) cloth = mix(cloth, uKind[0] * uKind[0] * (1.0 + 0.10 * weave), abs(uOwn[4]));
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
  col = mix(col, wood, ssS(aa, -aa, peg) * (uOwn[5] < 0.0 ? mix(ssPegged(p.x), step(hang.x, p.x) * step(p.x, hang.y), ssS(0.0, 0.2, -uOwn[5])) : ssPegged(p.x)));
  return screenOf(col);
}
