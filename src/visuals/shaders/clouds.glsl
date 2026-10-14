// name: Clouds
// a: Heaps
// b: Rain
// what: A wide calm sky of great soft heaps of cloud drifting over a low strip of land, lit from one side by a low sun; or rain coming over open land from a dark bank, grey veils slanting down with light under the cloud's edge.
// follows: The mix is how much cloud there is and the low band swells the heaps; each kind of sound tints the light on one bank of cloud; the tone dial moves the day from blue afternoon to rose evening; a hit or a cue is a slow shaft of sun breaking through; in the rain each veil is one kind of sound and the bank comes lower as the music fills.
float clLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
float clH1(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float clN1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(clH1(i), clH1(i + 1.0), f); }
vec3 clDay(vec3 a, vec3 b, vec3 c) { return uTone < 0.5 ? mix(a, b, uTone * 2.0) : mix(b, c, uTone * 2.0 - 1.0); }
// Round lumps with creases between them, as the top of a heap of cloud has. x is the whole of it, y only its broad shapes.
const mat2 clM = mat2(1.73, 1.19, -1.19, 1.73);
vec2 clLumps(vec2 q, float t) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * abs(2.0 * noise(q + t) - 1.0); q = clM * q + 3.3; a *= 0.5; t = -t * 1.6; }
  float broad = s * 1.1;
  for (int i = 0; i < 2; i++) { s += a * abs(2.0 * noise(q + t) - 1.0); q = clM * q + 3.3; a *= 0.5; t = -t * 1.6; }
  return vec2(s, broad);
}
float clBroad(vec2 q, float t) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * abs(2.0 * noise(q + t) - 1.0); q = clM * q + 3.3; a *= 0.5; t = -t * 1.6; }
  return s * 1.1;
}
// How tall the heaps of a bank stand at x (in the bank's own measure: a heap is about 0.6 tall); 0 where there is none.
float clTall(float x, float seed, float cover, float swell) {
  float n = clN1(x * 0.42 + seed) + 0.3 * clN1(x * 1.1 + seed * 3.0);
  float e = smoothstep(cover, cover + 0.3, n);
  e *= 2.0 - e; // round shoulders, not a tent
  return max(e * (0.5 + 0.55 * clN1(x * 0.8 + seed * 5.0)) * 0.84 * swell - 0.05, 0.0);
}
// How deep inside the bank the place q is, given its lumps there. clEdge is how far it is from the top and sides alone.
float clEdge, clBase;
float clBank(vec2 q, float seed, float tall, float lumps) { // seed: how ragged the base is here
  float there = min(1.0, tall * 5.0);
  clEdge = (tall - q.y) / 0.6 + (min(lumps, 0.61) - 0.36) * 1.35 * there - 0.1 * (1.0 - there);
  clBase = q.y + 0.09 * lumps + seed;
  return min(clEdge, clBase * 4.5);
}
vec3 clHeaps(vec2 p) {
  float lvl = uLevel;
  vec2 sun = vec2(-0.5, mix(0.02, -0.2, uTone));
  float horizon = -0.4;
  vec3 sunC = clDay(vec3(1.0, 0.9, 0.72), vec3(1.0, 0.6, 0.28), vec3(1.0, 0.32, 0.15)) * 1.4;
  vec3 zen = clDay(vec3(0.008, 0.04, 0.15), vec3(0.006, 0.022, 0.1), vec3(0.01, 0.01, 0.055));
  vec3 mid = clDay(vec3(0.03, 0.11, 0.26), vec3(0.035, 0.085, 0.19), vec3(0.085, 0.045, 0.14));
  vec3 low = clDay(vec3(0.16, 0.28, 0.4), vec3(0.46, 0.3, 0.15), vec3(0.45, 0.14, 0.1));
  vec3 shade = clDay(vec3(0.03, 0.055, 0.12), vec3(0.028, 0.04, 0.1), vec3(0.04, 0.025, 0.075));
  // the sky
  float up = sat((p.y - horizon) * 1.3);
  vec3 col = mix(mix(low, mid, smoothstep(0.0, 0.3, up)), zen, smoothstep(0.2, 0.9, up));
  float ds = length(p - sun);
  float ev = max(uHits, uCue);
  vec3 sunGlow = sunC * (0.9 + 0.5 * ev) * exp(-ds * 11.0);
  vec3 paleC = mix(sunC, vec3(0.7, 0.85, 0.9), 0.55);
  col += paleC * 0.26 * exp(-ds * 2.0) + sunC * 0.3 * exp(-ds * 4.5);
  vec3 air = col + sunGlow * 0.4;
  col += sunGlow + sunC * 5.0 * smoothstep(0.034, 0.03, ds);
  // thin high cloud
  vec2 cq = vec2(p.x * 1.5 + uTime * 0.003, p.y * 7.0 + p.x * 1.2);
  float ci = 0.55 * noise(cq) + 0.3 * noise(cq * 2.1 + 5.0) + 0.15 * noise(cq * 4.3 + 9.0);
  col += mix(low, sunC, 0.5) * smoothstep(0.5, 0.85, ci) * smoothstep(0.0, 0.3, p.y) * 0.1;
  float ang = atan(p.y - sun.y, p.x - sun.x);
  float rays = noise(vec2(ang * 5.0, uTime * 0.02)) * noise(vec2(ang * 13.0 + 4.0, uTime * 0.035));
  float shaftAng = mix(-0.2, -0.5, 0.5 + 0.5 * sin(uTime * 0.05));
  float shaft = ev * (exp(-pow((ang - shaftAng) * 7.0, 2.0)) + 0.4 * exp(-pow((ang - shaftAng) * 2.5, 2.0))) * step(-1.6, ang) * step(ang, 1.6);
  float wind = uTravel * 0.02 + uTime * 0.004;
  float cover = mix(0.67, 0.5, lvl), swell = 0.96 + 0.32 * uLow;
  vec2 toSun = normalize(sun - p);
  float nearSun = exp(-ds * 3.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i), z = 7.0 / (1.0 + 0.36 * fi + 0.06 * fi * fi), seed = fi * 7.3 + 1.0;
    vec2 q = vec2(p.x + wind / z * 4.0, p.y - horizon - 0.55 / z) * z;
    float t = uTime * 0.006;
    float tall = clTall(q.x, seed, cover, swell);
    vec2 lumps = clLumps(q * 1.45 + seed, t + seed);
    float ragged = 0.05 * clN1(q.x * 2.3 + seed);
    float lump = lumps.x;
    float d = clBank(q, ragged, tall, lump), edge = clEdge, base = clBase;
    float d1 = max(clBank(q, ragged, tall, lumps.y), 0.0);
    vec2 q2 = q + toSun * 0.13;
    float tall2 = clTall(q2.x, seed, cover, swell);
    float d2 = max(clBank(q2, ragged, tall2, clBroad(q2 * 1.45 + seed, t + seed)), 0.0);
    float a = smoothstep(0.0, 0.07, edge) * smoothstep(0.0, 0.1, base);
    float high = sat(q.y / 0.55);
    // round the cloud off towards its edges, and see which way that roundness faces
    float lit = 0.22 + (1.0 / (1.0 + 3.2 * d2) - 1.0 / (1.0 + 3.2 * d1)) * 3.6 + clamp((tall - tall2) * 2.6, -0.35, 0.35) + 0.3 * high;
    float lv = clLv(i);
    vec3 kc = uKind[i];
    vec3 tint = (kc * kc * 1.6 + kc * 0.6 + 0.15) * 1.3;
    vec3 light = mix(sunC, tint, 0.22 * lv) * (0.9 + 0.4 * lvl);
    vec3 c = (shade + kc * kc * lv * 0.09) * (0.25 + 1.1 * high) + light * smoothstep(0.15, 1.25, lit) * (0.4 + 0.6 * high) * (0.55 + 1.1 * lump);
    c *= 0.6 + 0.4 * smoothstep(-0.02, 0.2, q.y);
    // a bright edge where the cloud is thin and the sun is behind it
    float thin = max(edge, 0.0);
    c += light * (1.6 / (1.0 + 5.0 * thin + 9.0 * thin * thin) + 2.0 / (1.0 + 300.0 * thin * thin)) * smoothstep(0.0, 0.4, d - edge + 0.4) * nearSun;
    float haze = exp(-z * 0.2);
    c = mix(air, c, 0.2 + 0.8 * haze);
    col = mix(col, c, a);
    // rays of sun in the air between the banks
    if (i == 1) col += paleC * (0.2 + 0.4 * lvl) * rays * 0.7 * nearSun;
  }
  col += sunC * shaft * 0.5 * exp(-ds * 0.9) * step(horizon, p.y);
  // a low strip of land: far trees in the haze, then open fields with patches of sun moving over them
  float px = 1.2 / uRes.y;
  float x = p.x + wind * 0.3;
  float toS = exp(-abs(p.x - sun.x) * 1.5);
  float h1 = horizon + 0.004 + 0.012 * noise(vec2(x * 7.0, 1.0)) + 0.006 * noise(vec2(x * 31.0, 2.0));
  col = mix(col, mix(shade * 0.7, low * 0.6 + sunGlow * 0.3, 0.45), smoothstep(-px, px, h1 - p.y));
  float dep = 0.05 / max(horizon - p.y, 0.002);
  vec2 g = vec2(x * dep * 3.0 + wind * 2.0, dep * 2.0);
  float patch_ = smoothstep(0.42, 0.75, noise(g * vec2(0.45, 1.0)));
  float fields = 0.6 + 0.4 * noise(vec2(g.x * 2.0, floor(g.y * 6.0) * 3.1));
  vec3 ground = shade * 0.22 * fields + sunC * vec3(0.5, 0.42, 0.2) * 0.12 * patch_ * fields * (0.5 + lvl);
  float sx = sun.x + cos(shaftAng) * (horizon - 0.04 - sun.y) / sin(min(shaftAng, -0.05));
  ground += sunC * vec3(0.6, 0.5, 0.25) * 0.5 * ev * exp(-pow((p.x - sx) * 3.0, 2.0)) * fields * exp(-(horizon - p.y) * 5.0);
  ground = mix(ground, low * 0.5 + sunGlow * 0.3, exp(-(horizon - p.y) * 40.0) * 0.7);
  col = mix(col, ground, smoothstep(-px, px, horizon - p.y));
  return col;
}
vec3 clRain(vec2 p) {
  float lvl = uLevel, px = 1.2 / uRes.y;
  float horizon = -0.14;
  vec3 gapC = clDay(vec3(0.85, 0.9, 0.8), vec3(1.0, 0.64, 0.28), vec3(1.0, 0.33, 0.17)) * 1.15;
  vec3 gapHigh = clDay(vec3(0.1, 0.2, 0.26), vec3(0.07, 0.15, 0.17), vec3(0.11, 0.07, 0.14));
  vec3 cloudC = clDay(vec3(0.018, 0.03, 0.055), vec3(0.018, 0.024, 0.05), vec3(0.028, 0.018, 0.045));
  float wind = uTravel * 0.02 + uTime * 0.004;
  float ev = max(uHits, uCue);
  float below = horizon - p.y;
  // below the horizon lies still water, which shows the sky again, drawn out by its ripples
  float dep = 0.05 / max(below, 0.002);
  float rip = noise(vec2(p.x * dep * 5.0 + wind * 4.0, dep * 16.0 + uTime * 0.12)) - 0.5;
  float water = step(0.0, below);
  float e = water > 0.5 ? below * 1.05 + rip * 0.07 * sat(below * 5.0) : -below;
  e = max(e, 0.0);
  float x = p.x + water * rip * 0.02;
  float toS = exp(-pow((x + 0.3) * 1.15, 2.0));
  // where the far edge of the bank stands above the horizon: lower as the music fills
  float edge = mix(0.21, 0.14, lvl) - 0.07 * x + 0.05 * (noise(vec2(x * 1.9 + wind, 3.0)) - 0.5) + 0.016 * noise(vec2(x * 8.0 + wind * 2.0, 7.0));
  // the light under it: gold low down and towards the sun, cooling as it rises to the bank
  float k = exp(-e * 11.0);
  vec3 gap = gapC * (0.1 + 0.9 * toS) * (0.5 + 0.6 * lvl) * (k + 0.6 * exp(-e * 60.0)) + gapHigh * (1.0 - k) * (0.5 + 0.5 * toS) * (0.7 + 0.5 * lvl);
  // the underside of the bank, rolling away to its edge, lit a little from the gap
  vec2 uv = vec2(x, 1.0) / max(e, 0.03) * 0.4;
  uv.x += wind * 2.0;
  float t = uTime * 0.004;
  vec2 rolls = clLumps(uv * vec2(0.7, 1.3), t);
  float roll = rolls.x, roll2 = clBroad((uv + vec2(0.0, 0.14)) * vec2(0.7, 1.3), t);
  float big = noise(uv * vec2(0.3, 0.8) + 4.0);
  float under = sat(0.5 + (roll2 - rolls.y) * 3.5);
  float past = max(e - edge, 0.0);
  vec3 bank = cloudC * (0.2 + 1.6 * big * roll + 0.8 * roll + 1.6 * under * roll) * mix(1.15, 0.5, sat(e * 1.5));
  bank += mix(gapC, gapHigh * 3.0, 0.4) * (0.1 + 0.9 * toS) * (0.25 + 0.5 * lvl) * (0.2 * under * exp(-past * 9.0) + 0.45 * exp(-past * 30.0));
  float inBank = smoothstep(-0.015, 0.02, e - edge + 0.05 * (roll - 0.35));
  vec3 col = mix(gap, bank, inBank);
  // veils of rain, far to near, each hung from the bank and leaning with the wind
  for (int i = 0; i < 6; i++) {
    float fi = float(i), near = fi / 5.0;
    int kind = min(i, 4);
    float lv = i == 5 ? 0.0 : clLv(kind);
    vec3 kc = uKind[kind];
    float cx = fract(0.37 + fi * 0.39 + wind * mix(0.1, 0.3, near)) * 2.6 - 1.0;
    float wide = mix(0.07, 0.34, near * near) * (0.75 + 0.5 * hash11(fi + 2.0));
    float lean = 0.45 * e + 0.5 * e * e;
    float xs = x - lean - cx + 0.05 * (noise(vec2(e * 5.0 + fi * 9.0, uTime * 0.05)) - 0.5);
    float streak = noise(vec2((x - lean) * mix(170.0, 70.0, near), e * 1.2 - uTime * mix(0.2, 0.5, near) + fi));
    float sheet = noise(vec2((x - lean) * mix(18.0, 6.0, near) + fi * 3.0, e * 0.9 - uTime * 0.05));
    float a = smoothstep(wide, wide * 0.1, abs(xs)) * (0.45 + 0.55 * sheet) * (0.7 + 0.3 * streak) * smoothstep(0.0, 0.012, e);
    a *= (0.55 + 0.45 * lvl + 0.5 * lv) * mix(1.0, 0.7, near) * smoothstep(edge + 0.16, edge - 0.04, e);
    vec3 veil = cloudC * (0.75 + 0.5 * streak) + gap * 0.12;
    veil += (kc * kc * 1.4 + kc * 0.3) * lv * 0.45 * exp(-e * 5.0) * (0.3 + 0.7 * sheet);
    col = mix(col, veil, sat(a));
  }
  // a shaft of sun let through the bank
  float sx = 0.3 + 0.3 * sin(uTime * 0.05);
  col += gapC * ev * 0.4 * exp(-pow((x - sx + e * 0.3) * 6.0, 2.0)) * smoothstep(0.6, 0.0, e) * (0.4 + 0.6 * exp(-e * 8.0));
  // the far shore and its trees, and low spits of land lying out in the water
  float shore = 0.004 + 0.012 * noise(vec2(p.x * 9.0 + wind * 0.6, 1.0)) * smoothstep(0.3, 0.6, noise(vec2(p.x * 2.6 + wind * 0.6, 5.0))) + 0.003 * noise(vec2(p.x * 40.0, 2.0));
  vec3 landC = vec3(0.008, 0.012, 0.012) + gap * 0.05;
  col = mix(col, landC, smoothstep(px, -px, abs(below + 0.001) - shore));
  float spit = smoothstep(0.52, 0.62, noise(vec2(p.x * 1.4 + wind * 1.5 + 9.0, 2.0))) * 0.014 * smoothstep(0.0, 0.3, noise(vec2(p.x * 6.0 + wind * 1.5, 8.0)) + 0.3);
  col = mix(col, landC, smoothstep(px, -px, abs(below - 0.045) - spit + 2.0 * px));
  float spit2 = smoothstep(0.5, 0.64, noise(vec2(p.x * 0.9 + wind * 2.6 + 3.0, 6.0))) * 0.03;
  col = mix(col, landC * 0.8, smoothstep(px, -px, abs(below - 0.13) - spit2 * (0.7 + 0.3 * noise(vec2(p.x * 9.0 + wind * 2.6, 1.5))) + 2.0 * px));
  // the water: darker than what it shows, darker still close by, and pocked with rain
  float nearW = sat(below * 2.6);
  col = mix(col, col * mix(vec3(0.8, 0.85, 0.85), vec3(0.3, 0.42, 0.45), nearW) + vec3(0.0, 0.004, 0.006) * nearW, water);
  vec2 rg = vec2(p.x * dep * 26.0 + wind * 20.0, dep * 26.0), ri = floor(rg);
  vec2 rh = hash22(ri);
  float age = fract(uTime * (0.2 + 0.15 * rh.x) + rh.y * 9.0);
  float ringR = length(fract(rg) - 0.5 - (rh - 0.5) * 0.5);
  float drop = smoothstep(0.09, 0.0, abs(ringR - age * 0.3)) * (1.0 - age) * step(0.55, rh.x);
  col += (gap * 0.45 + vec3(0.015, 0.022, 0.028)) * drop * water * smoothstep(0.015, 0.1, below) * (0.3 + 0.7 * lvl) * (0.4 + uHigh);
  // reeds at the near edge, moving a little
  for (int k = 0; k < 2; k++) {
    float fk = float(k), n = 21.0 + 13.0 * fk;
    float ru = p.x * n + fk * 3.7 + 1.5 * noise(vec2(p.x * 3.0, fk));
    float id = floor(ru), rnd = hash21(vec2(id, fk + 3.0)), rnd2 = hash21(vec2(id, fk + 9.0));
    float tall = (0.04 + 0.26 * rnd * rnd) * smoothstep(0.3, 0.62, noise(vec2(id / n * 1.6 + 2.0 + fk, 9.0)));
    float up = max(p.y + 0.52, 0.0) / max(tall, 0.001);
    float bend = up * up * tall * n * ((rnd2 - 0.5) * 1.6 + 0.25 * sin(uTime * 0.45 + id * 1.3));
    float wide = 0.11 * (1.0 - up) + 0.012;
    float blade = smoothstep(wide, wide - 0.9 * n / uRes.y, abs(fract(ru) - 0.5 - (rnd - 0.5) * 0.5 - bend)) * step(up, 1.0);
    col = mix(col, vec3(0.004, 0.007, 0.006), blade);
  }
  col = mix(col, vec3(0.004, 0.007, 0.006), smoothstep(-0.52, -0.6, p.y)); // the near bank, if the view is pulled back
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? clHeaps(p) : clRain(p));
}
