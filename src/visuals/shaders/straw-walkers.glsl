// name: Straw walkers
// a: Over the snow
// b: Rag coats
// what: Five walking sheaves of straw taller than any fence, with no face and no hands, come in file over a blue-shadowed snowfield under a low white sun, the nearest too tall for the picture; or the same five in a yard before a limewashed wall, in coats of cloth strips that fly out as they turn, fall, and wrap the other way.
// follows: Each kind of sound is a walker, its loudness the step and sway, or how wide the coat flies. The drone is the near one; the pad fluffs the second, the phrase turns the third. Texture is loose straw in the air. Bands ruffle the tiers, the piece tints them. A hit is a stamp of snow and a jolt of all the bells, a cue a bow, or a whirl, from near to far.
// own: 0 a moonlit night at -1, a rose sunset at 1; 1 green rushes at -1, rust-red bracken at 1 (b: bleached pale strips, strips of every bright dye); 2 low round stacks at -1, tall thin ones at 1; 3 bare stubble rows at -1, thick falling snow at 1 (b: a straw yard under thatch); 4 seen from near the ground at -1, from high and farther off at 1; 5 stalks wound round like rope at -1, standing open at 1 (b: coats hanging wrapped, all out in a bell)
float swHor, swRat, swA, swB, swPx, swNt, swRose, swEa, swSnow, swSq, swTall, swStir, swJolt, swDim, swBack, swWide, swStride, swOpen, swWound;
// the walker at hand: where it stands, and what it does
float swX, swD, swLv, swSpin, swFl, swBow, swLean, swLift, swPull;
vec2 swSun; vec3 swKey, swAmb;

float swFall(float a, float b, float x) { return 1. - smoothstep(b, a, x); }
// A slow wave like a sine, one turn in 1.
float swSin(float u) { u = fract(u + 0.5) - 0.5; return 8. * u * (1. - 2. * abs(u)); }
// A colour by day, at sunset and by night; or by day and by night.
vec3 swDay(vec3 d, vec3 r, vec3 n) { return mix(mix(d, r, swRose), n, swNt); }
vec3 swEve(vec3 d, vec3 n) { return mix(d, n, swNt); }
void swBegin() {
  swB = step(0.5, uVar); swA = 1. - swB;
  swNt = sat(-uOwn[0]); swRose = sat(uOwn[0]);
  swEa = sat(-uOwn[3]); swSnow = sat(uOwn[3]);
  swSq = sat(-uOwn[2]); swTall = sat(uOwn[2]);
  swOpen = sat(uOwn[5]); swWound = sat(-uOwn[5]);
  swWide = clamp(uRes.x / uRes.y / 1.6, 0.56, 1.);
  float eye = exp2(uOwn[4] * (uOwn[4] > 0. ? 0.7 : 0.9)); swBack = eye * (1. - 0.3 * sat(uOwn[4]));
  swHor = 0.1 + 0.03 * swB + (uOwn[4] > 0. ? 0.13 : 0.11) * uOwn[4];
  swRat = mix(2.15, 1.62, swB) / eye;
  swPx = 1. / uRes.y;
  swJolt = 4. * uHits * (1. - uHits); swDim = 1. - 0.45 * swNt;
  swStride = uTravel * 0.25; swStir = uTime * 0.08;
  swSun = mix(vec2(0.17 * swWide, 0.19), vec2(-0.9, 0.5), swB);
  swKey = swDay(vec3(1., 0.9, 0.7), vec3(1.15, 0.68, 0.36), vec3(0.4, 0.52, 0.72)) * (1.15 + 0.2 * uTone + 0.15 * uLevel);
  swAmb = swDay(vec3(0.53, 0.52, 0.53), vec3(0.5, 0.4, 0.5), vec3(0.14, 0.19, 0.3));
}
// Where walker i stands (across, and how far under the horizon its feet are), and what it does.
void swWalker(int i) {
  vec2 w = i == 0 ? vec2(-0.47, 0.56) : i == 1 ? vec2(-0.04, 0.29) : i == 2 ? vec2(0.27, 0.155) : i == 3 ? vec2(0.45, 0.085) : vec2(0.58, 0.024);
  vec2 r = i == 0 ? vec2(0.33, 0.5) : i == 1 ? vec2(-0.36, 0.39) : i == 2 ? vec2(0.02, 0.27) : i == 3 ? vec2(-0.74, 0.2) : vec2(0.68, 0.165);
  w = mix(w, r, swB);
  float f = float(i);
  bool b = swB > 0.5;
  swLv = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uPhrase : (i == 3) == b ? uTexture : uHits;
  swX = w.x * swWide + (i == 4 ? 0.04 * swA * sin(TAU * uLoop) : 0.); swD = w.y * swBack;
  float t = sat((1. - uCue - 0.1 * f) / 0.55), bow = 4. * t * (1. - t), moved = i == (b ? 4 : 3) ? 0. : sqrt(sat(swLv));
  float st = swSin(swStride + f * 0.33);
  swBow = bow * bow;
  if (b) {
    // a turn one way, then on past and the other way round: the coat stands out while it is quick
    float u = uTime / (15. + 3. * f) + 0.29 * f, c = swSin(u + 0.25);
    swSpin = (0.5 + 1.5 * moved + 1.8 * swOpen) * swSin(u) + f * 1.7;
    swFl = sat((0.07 + 0.85 * moved) * c * c + 0.12 * moved + (i == 4 ? 0.5 * swJolt : 0.) + 0.75 * swBow);
    swFl = mix(swFl, 0.95 - 0.06 * f, 0.85 * swOpen) * (1. - 0.9 * swWound);
    swPull = -c; swLift = 0.;
    swLean = 0.03 * swSin(2. * u + 0.16 * f) * (0.4 + moved);
  } else {
    swSpin = f * 2.3 + (i == 2 ? 1.5 * uPhrase : 0.) + 0.1 * st;
    swFl = (i == 1 ? 0.5 * uPad : 0.12 * moved) + 0.7 * swOpen + (i == 3 ? 0.35 * swJolt : 0.) + 0.2 * swBow - 0.2 * swWound;
    swPull = 0.; swLift = 0.012 * (0.3 + moved) * abs(st);
    swLean = (0.008 + 0.06 * moved) * st + 0.012 * swSin(uTime * 0.037 + f * 0.3) + 0.12 * swBow;
  }
}
// The place q in the walker's own measure: 0 its feet, 1 its top.
vec2 swOwn(vec2 p, float f) {
  vec2 q = (p - vec2(swX, swHor - swD)) / (swD * swRat);
  q.y /= 1. - 0.14 * swBow * swA - 0.2 * swSq + 0.14 * swTall;
  q.x -= swLean * q.y * (0.6 + 0.8 * q.y);
  q.y -= 0.004 * swSin(uTime * 0.143 + f * 0.16) * q.y + swLift;
  return q;
}
// Half as wide as a walker is at a height: a stack, drawn in where the head begins.
float swProf(float y) {
  float k = (y - 0.79) * 13., y2 = y * y; y2 *= y2;
  return (0.195 - 0.03 * y - 0.16 * y2 * y2 - 0.024 * max(1. - k * k, 0.)) * (1. + 0.5 * swSq - 0.34 * swTall);
}
vec3 swStraw(float h) {
  vec3 c = mix(vec3(0.5, 0.31, 0.12), vec3(0.97, 0.75, 0.41), h);
  vec3 g = mix(vec3(0.16, 0.24, 0.09), vec3(0.6, 0.68, 0.36), h), k = mix(vec3(0.17, 0.08, 0.07), vec3(0.6, 0.28, 0.2), h);
  return mix(mix(c, g, 0.95 * sat(-uOwn[1])), k, 0.95 * sat(uOwn[1]));
}
vec3 swRag(float h, float g) {
  vec3 c = h < 0.3 ? vec3(0.56, 0.2, 0.08) : h < 0.52 ? vec3(0.055, 0.05, 0.055) : h < 0.78 ? vec3(0.86, 0.79, 0.64) : vec3(0.68, 0.07, 0.06);
  c = mix(c, vec3(0.9, 0.86, 0.76) * (0.75 + 0.25 * h), 0.92 * sat(-uOwn[1]));
  c = mix(c, 0.36 + 0.28 * cos(TAU * (h * 2. + vec3(0., 0.33, 0.6))), 0.92 * sat(uOwn[1]));
  return c * (0.8 + 0.35 * g);
}
// The two stubs, or boots, a walker goes on.
float swFeet(vec2 q, float px, float st) {
  float sg = q.x < 0. ? -1. : 1.;
  vec2 c = (q - vec2(0.055 * sg, 0.03 + max(0., sg * st) * swA)) / vec2(0.042, 0.05);
  c.y = c.y > 0. ? c.y * mix(0.4, 0.15, swB) : c.y;
  return swFall(px * 25., -px * 25., length(c) - 1.);
}
// Loose stalks (thin is 1), or flakes, adrift in the air.
float swAir(vec2 p, float size, float seed, float most, float thin) {
  vec2 q = vec2(p.x + 60. * size * fract(uTime * 0.0011 * (1. + 0.3 * seed) + seed * 0.37), p.y + 0.02 * swSin(p.x * 0.8 + uTime * 0.05 + seed)) / size;
  q.y += (1. - thin) * 60. * fract(uTime * 0.0016);
  vec2 c = floor(q), f = fract(q) - 0.5; c = mod(c, 60.);
  float h = hash21(c + seed * 13.1), h2 = fract(h * 61.7), h3 = fract(h * 317.3), pw = swPx / size;
  f -= 0.5 * (vec2(h2, h3) - 0.5);
  vec2 d = normalize(vec2(0.5 + h3, 0.7 * swSin(uTime * 0.05 + h2 * 9.)));
  f -= d * clamp(dot(f, d), -0.16, 0.16) * thin;
  pw += 0.05 * (1. - thin);
  return swFall(pw, -pw, length(f) - mix(0.02 + 0.07 * h2, 0.009, thin)) * smoothstep(0., 0.06, most - h);
}

// The place behind the walkers. sh is their shadow there, g the ground's own place.
vec3 swPlace(vec2 p, vec2 g, float z, float base, float sh, vec3 haze) {
  bool b = swB > 0.5, low = p.y < base;
  float up = p.y - swHor, x = p.x, dn = base - p.y, far = exp(-(swHor - p.y) * 11.);
  float u = p.x / 0.16, v = -(dn - 0.003 * swSin(p.x * 3.1)) / 0.16; // on the wall
  // noise, laid where this part of the picture needs it
  vec2 c1, c2, c3, c4, c5;
  if (b && low) { c1 = g * 3.4; c2 = c1 - vec2(0.24, 0.17); c3 = g * 9.5; c4 = c3 - vec2(0.6, 0.45); c5 = g * 0.9 + 2.; }
  else if (b) { c1 = vec2(u * 1.1, v * 0.7); c2 = vec2(u * 6., v * 2.2); c3 = vec2(u * 0.9 + 7., v * 1.2); c4 = vec2(u * 26., v * 1.6); c5 = vec2(u * 9., v * 9.); }
  else if (low) { c1 = g * vec2(0.7, 0.45) + 3.; c2 = c1 + vec2(0.14, -0.31); c3 = g * vec2(4., 2.4); c4 = c3 + vec2(0.2, -0.4); c5 = vec2(g.x * 0.8 + 0.077 * uTravel, z * 2.2); }
  else { c1 = vec2(x * 1.6 + 3. * swSin(uTime * 0.0003), p.y * 9.); c2 = vec2(x * 4. - 3. * swSin(uTime * 0.0004), p.y * 22.); c3 = vec2(x * 44., 1.); c4 = vec2(x * 260. + 30. * up, p.y * 60.); c5 = vec2(x * 180. - 60. * p.y, p.y * 110.); }
  float n1 = noise(c1), n2 = noise(c2), n3 = noise(c3), n4 = noise(c4), n5 = noise(c5);
  vec3 dim = swDay(vec3(1.), vec3(1.05, 0.8, 0.66), vec3(0.2, 0.26, 0.4));
  vec3 col;
  if (low) {
    // the ground: drifts lit from the side of the sun, or a trampled yard
    vec3 lit, shade; float slope;
    if (b) {
      slope = 1.6 * (n1 - n2) + n3 - n4;
      float mud = smoothstep(0.5, 0.75, 0.75 * n5 + 0.7 * (0.5 - 0.6 * n1 - 0.4 * n3));
      lit = mix(mix(vec3(0.9, 0.885, 0.86), vec3(0.47, 0.38, 0.3), mud * 0.85 * (1. - swSnow)), vec3(0.72, 0.56, 0.32) * (0.6 + 0.5 * n3 + 0.3 * n1), swEa);
      shade = lit * swDay(vec3(0.55, 0.62, 0.74), vec3(0.5, 0.42, 0.6), vec3(0.06, 0.085, 0.15));
      lit *= dim;
      col = mix(mix(shade, lit, sat(0.75 + slope)), shade * 0.95, 0.85 * sh);
    } else {
      slope = 1.2 * (n1 - n2) * (1. - far) + 0.18 * (n3 - n4) * smoothstep(0.1, 0.35, dn);
      // the way they came, trodden
      float dd = (swHor - p.y) / swBack, tx = (x / swWide - 0.64 + 2.55 * dd - dd * dd) / (dd * 0.3 + 1e-3), tw = 2.6 / max(dd, 0.02) + 0.25 * tx;
      vec2 tq = vec2((tx - (fract(tw * 0.5) < 0.5 ? -0.45 : 0.45) + 0.3 * n3 - 0.15) * 2.4, (fract(tw) - 0.5) * 2.6);
      slope -= smoothstep(0.03, 0.1, dd) * swFall(0.62, 0.5, dd) * (0.55 * exp(-dot(tq, tq) * 2.5) + 0.22 * exp(-tx * tx) * (n3 - 0.5));
      float stub = smoothstep(0.1, 0.4, abs(fract((x - swSun.x) * z * 1.7 + 0.3 * n1) - 0.5)) * (0.4 + 0.9 * n3) * (1. - far) + 0.5 * far;
      lit = mix(swDay(vec3(0.91, 0.905, 0.895), vec3(0.98, 0.78, 0.62), vec3(0.36, 0.45, 0.6)), swEve(vec3(0.82, 0.65, 0.36), vec3(0.3, 0.27, 0.22)) * (0.55 + 0.6 * stub), swEa);
      shade = mix(swDay(vec3(0.5, 0.62, 0.8), vec3(0.45, 0.4, 0.62), vec3(0.07, 0.11, 0.2)), swEve(vec3(0.36, 0.26, 0.2), vec3(0.05, 0.05, 0.07)) * (0.7 + 0.5 * stub), swEa);
      float k = sat(0.62 + 0.75 * slope), gl = exp(-length((p - vec2(swSun.x, swHor)) * vec2(1.3, 0.8)) * 2.6);
      col = mix(mix(shade, lit, k), shade * (0.94 + 0.12 * slope), sh * 0.88);
      col += swEve(vec3(0.1, 0.085, 0.05), vec3(0.06, 0.08, 0.12)) * gl * (1. - sh) * (1. - 0.5 * swEa) * k;
      // the blown snow that runs low over the ground, as far as has been travelled
      col = mix(col, lit * 1.03, 0.4 * smoothstep(0.55, 0.9, n5) * (0.35 + 0.5 * uHigh) * (1. - swEa) * (1. - 0.7 * sh));
      col = mix(col, haze, (0.65 + 0.2 * uSpace) * far);
    }
  } else if (b) {
    // a limewashed wall with its timbers, under a roof deep in snow
    float st = 0.6 * n1 + 0.4 * n2, px = swPx / 0.16;
    col = vec3(0.79, 0.755, 0.69) * (0.8 + 0.3 * st);
    col = mix(col, vec3(0.52, 0.43, 0.34), 0.75 * swFall(0.75, 0., v + 0.6 * (st - 0.5)));
    vec2 bq = vec2(u * 3. + 0.5 * floor(v * 8.), v * 8.), bf = abs(fract(bq) - 0.5);
    col = mix(col, vec3(0.5, 0.26, 0.18) * (1. - 0.4 * smoothstep(0.38, 0.46, max(bf.y, bf.x))), 0.85 * smoothstep(0.82, 0.86, n3 + 0.12 * n5));
    float post = abs(fract(u * 0.36 + 0.28) - 0.5) / 0.36, rail = abs(v - 1.75), wood = swFall(px, -px, min(post - 0.12, rail - 0.09));
    col = mix(col, vec3(0.2, 0.16, 0.13) * (0.6 + 0.8 * n4), wood);
    col = mix(col, vec3(0.085, 0.075, 0.07) * (0.6 + 0.7 * n4), swFall(px, -px, max(abs(u + 1.05) - 0.62, v - 1.3)));
    vec2 wq = abs(vec2(u - 3.4, v - 1.12)), wb = abs(wq - vec2(0.15, 0.12));
    float win = swFall(px, -px, max(wq.x - 0.34, wq.y - 0.26)), bar = swFall(0.15, 0.12, wb.x) * swFall(0.12, 0.095, wb.y);
    col = mix(col, mix(vec3(0.17, 0.12, 0.09), mix(vec3(0.16, 0.17, 0.19), vec3(0.95, 0.6, 0.25), sat(0.2 + 0.7 * uKeys + 0.7 * swNt)), bar), win);
    col *= mix(dim, vec3(1.), 0.6 * win * swNt);
    float thick = p.y - (0.405 + 0.03 * x + 0.25 * max(uOwn[4], -0.35) - 0.012 * swSin(x * 0.63)) + 0.005 * n4;
    col *= 1. - 0.45 * smoothstep(-0.1, 0., thick);
    vec3 snow = mix(vec3(0.6, 0.68, 0.8), vec3(0.92, 0.92, 0.91), smoothstep(0., 0.04, thick)) * dim * (0.9 + 0.1 * n1);
    col = mix(col, mix(snow, vec3(0.6, 0.45, 0.25) * (0.6 + 0.6 * n4) * dim, 0.85 * swEa), smoothstep(-swPx, swPx, thick));
  } else {
    // pale air round a low sun, a village behind the rise, a bare hedge
    float r = length(p - vec2(swSun.x, swHor + swSun.y)), h1 = p.y - base;
    col = mix(vec3(0.84, 0.85, 0.855), vec3(0.6, 0.685, 0.77), smoothstep(-0.02, 0.5, up));
    col = mix(col, mix(vec3(0.93, 0.62, 0.42), vec3(0.42, 0.36, 0.56), smoothstep(0., 0.42, up)), swRose);
    col = mix(col, mix(vec3(0.2, 0.27, 0.38), vec3(0.03, 0.055, 0.12), smoothstep(0., 0.4, up)), swNt);
    col *= 1. + 0.1 * (0.6 * n1 + 0.4 * n2 - 0.5) * smoothstep(0., 0.2, up);
    vec3 g2 = swDay(vec3(1., 0.97, 0.9), vec3(1., 0.8, 0.5), vec3(0.8, 0.88, 1.));
    col = mix(col, g2 * 0.97, (0.65 * exp(-r * 4.2) + (0.5 + 0.3 * uMic) * exp(-r * 15.)) * (1. - 0.6 * swNt) * (1. - 0.6 * swSnow));
    col = mix(col, g2, swFall(0.034, 0.03, r) * (1. - 0.8 * swSnow));
    float rx = (x + 0.07) * 13., rc = floor(rx), rf = abs(fract(rx) - 0.5), rh = hash11(rc + 2.);
    float roof = (0.016 + 0.026 * rh + 0.05 * (0.5 - max(rf, 0.12))) * step(rf, 0.36 + 0.14 * rh) * swFall(0.52, 0.34, abs(x + 0.36));
    col = mix(col, mix(haze, swEve(vec3(0.47, 0.52, 0.6), vec3(0.1, 0.13, 0.2)), 0.5), swFall(swPx, -swPx, h1 - roof));
    float hx = smoothstep(0.26, 0.34, x) + swFall(-0.6, -0.75, x) * 0.8, hh = (0.024 + 0.04 * n3) * hx + 1e-3;
    float hedge = swFall(hh, hh * 0.75, h1) * smoothstep(0.25, 0.65, 0.6 * n4 + 0.4 * n5 + 0.5 * (1. - h1 / hh)) * sat(hx * 2.);
    col = mix(col, mix(haze, swEve(vec3(0.24, 0.2, 0.2), vec3(0.04, 0.04, 0.06)), 0.6), hedge);
  }
  return col;
}

vec3 render(vec2 p) {
  swBegin();
  bool b = swB > 0.5;
  vec3 haze = swDay(vec3(0.86, 0.86, 0.85), vec3(0.95, 0.66, 0.46), vec3(0.22, 0.29, 0.4));
  // the edge of the ground, and the place on it seen here
  float base = b ? swHor - 0.145 * exp2(0.5 * uOwn[4]) + 0.035 * p.x + 0.003 * swSin(p.x * 3.1) : swHor + 0.006 * swSin(p.x * 0.49 + 0.1) + 0.004 * swSin(p.x * 1.3);
  float z = 1. / max(swHor - p.y, b ? 0.03 : 0.004), rise = b ? 0.62 : swSun.y * 1.2, sh = 0.;
  vec2 g = vec2(p.x * z, z), dir = b ? vec2(-0.977, -0.215) : normalize(vec2(swSun.x, 1.));
  float fray = (0.02 + 0.06 * swA) * (noise(vec2(dot(g, dir) * 9., 2. * g.x * dir.y)) - 0.5);
  // the nearest two walkers that may be seen here, and the shadow of all
  vec4 a0 = vec4(0.), a1 = a0, b0 = a0, b1 = a0;
  float many = 0., puff = 0., puffer = 0.;
  for (int i = 0; i < 5; i++) {
    float f = float(i);
    swWalker(i);
    vec2 q = swOwn(p, f);
    float px = swPx / (swD * swRat), u = sat(q.y), u3 = u * u * u, reach = (b ? 0.28 + 0.28 * swFl - (0.12 + 0.2 * swFl) * u3 : 0.35 + 0.16 * swFl - 0.17 * u3) + 0.1 * swSq;
    if (abs(q.x) < reach && q.y > -0.06 - 0.15 * swD && q.y < 1.06) {
      vec4 m0 = vec4(q, px, swD), m1 = vec4(swFl, swSpin, swPull, f);
      if (many < 0.5) { a0 = m0; a1 = m1; } else if (many < 1.5) { b0 = m0; b1 = m1; }
      many += 1.;
    }
    vec2 to = vec2(swX, 1.) / swD - g;
    float t = dot(to, dir), y = t * rise / swRat, side = to.x * dir.y - to.y * dir.x + fray + swLean * y * swRat;
    float w = (swProf(sat(y)) * (1.2 - 0.2 * swB) + 0.28 * swFl * swFall(0.75, 0.3, y) * (0.3 + swB)) * swRat, soft = 0.02 + 0.055 * max(t, 0.);
    sh = max(sh, swFall(soft, -soft, abs(side) - w) * swFall(1.12, 0.98, y) * smoothstep(-0.16, 0., t) * (1. - 0.35 * sat(y)));
    vec2 o = (p - vec2(swX, swHor - swD)) / (swD * swRat);
    vec2 o2 = o / vec2(0.4 + 0.3 * swFl, 0.11);
    float foot = max(1. - dot(o2, o2), 0.);
    sh = max(sh, 0.8 * foot * swB);
    // a stamp: snow thrown up round their feet
    o.y = (o.y - 0.02 - 0.16 * (1. - uHits)) * 2.;
    float pf = max(1. - dot(o, o) / (0.22 + 0.5 * (1. - uHits)), 0.);
    pf *= pf * uHits * (i == (b ? 4 : 3) ? 1. : 0.6);
    if (pf > puff) { puff = pf; puffer = f; }
  }
  // down the tiers of strands, from the top, until something is in front here
  float T = b ? 7. : 19., sp = b ? 0.076 : 0.045, y00 = b ? 0.93 : 0.945;
  float alpha = 0., best = 0., under = 0., feet = 0., inside = 0., done = 0., k = 0., k1 = -9., ruff = 0., strands = 1., who = a1.w, hidWho = who, hitWho = who;
  vec4 hit = vec4(0.), hid = hit, m0 = a0, m1 = a1; vec3 nor = vec3(0., 0., 1.), nid = nor;
  for (int j = 0; j < 20; j++) {
    if (alpha > 0.7) break;
    if (k > k1) {
      // this walker has nothing more to show here: the next
      if (inside > 0.5 || done > min(many, 2.) - 0.5) break;
      if (done > 0.5) { m0 = b0; m1 = b1; }
      done += 1.; who = m1.w;
      strands = b ? 30. + 2. * m0.w : who < 0.5 ? 160. : who < 1.5 ? 115. : who < 2.5 ? 76. : who < 3.5 ? 50. : 28.;
      ruff = band(1. - m0.y);
      feet = max(feet, swFeet(m0.xy, m0.z, 0.03 * swSin(swStride + who * 0.33) * uLevel));
      inside = smoothstep(-m0.z, m0.z, swProf(sat(m0.y)) * (b ? 0.8 : 0.94) - abs(m0.x)) * swFall(0.94, 0.91, m0.y) * smoothstep(0.1, 0.16, m0.y - 0.24 * swB);
      float eq = m0.w * (1. - m0.y * swRat);
      k = b ? -1. : max(-1., floor((y00 - m0.y - 0.22 - max(eq + 0.08, 0.) * 0.3) / sp));
      k1 = b ? T - 1. : min(T - 1., floor((y00 - m0.y + max(0.08 - eq, 0.) * 0.3) / sp) + 1.);
    }
    bool top = k < -0.5;
    float px = m0.z, fl = m1.x, kn = sat(k / T), fm = top ? 0. : fract(k * 0.5) * 2.; // every other tier is loose ends that stand off
    float y0 = top ? 0.925 : y00 - k * sp, e = m0.w * (1. - y0 * swRat), yh = y0 * y0;
    if (!b) y0 += 0.016 * swSin(k * 0.38 + m0.x * 3.7 + m1.y * 0.16 + who * 0.3);
    float L0 = top ? 0.12 : b ? 0.2 + 0.24 * min(kn * 1.6, 1.) : min(0.215, max(y0 - 0.015, 0.05));
    float M = 0.9 * yh * yh * yh + (b ? 0.06 + 0.06 * fm + 0.12 * ruff + fl * (0.3 + 0.5 * kn) + fl * fl * 2.6 * kn * kn : 0.09 + 0.13 * ruff * (0.4 + uEnergy) + 0.16 * fm + fl * (0.25 + 0.3 * kn));
    M = top ? -0.35 - 0.2 * fl : M;
    float r0 = top ? 0.032 : swProf(y0) * 0.94, Q = M * e, P = r0 + M * (y0 - m0.y), A = 1. - Q * Q;
    A = abs(A) < 0.02 ? 0.02 : A;
    float B = P * Q, dis = B * B - A * (m0.x * m0.x - P * P);
    float ic = (top ? -1. : 1.) * sqrt(1. + M * M), rt = abs(sqrt(max(dis, 0.)) / A), Z = -B / A + rt, v = (y0 - m0.y - e * Z) * ic;
    if (b && (Z < 0. || v < 0. || v > 0.92 * L0)) { Z = -B / A - rt; v = (y0 - m0.y - e * Z) * ic; }
    if (dis >= 0. && v > 0. && v < L0 * 1.1 && (Z > 0. || b)) {
      float R = sqrt(m0.x * m0.x + Z * Z) + 1e-4, phi = atan(m0.x, Z + 1e-5), vn = v / L0, seed = k * 3. + who * 91.;
      float bend = b ? 0.5 * vn * vn * fl * m1.z + 0.1 * swSin(vn * 0.8 + k * 0.16 + swStir) * vn : 0.06 * vn * swSin(phi * 1.4 + k * 0.32 + swStir);
      bend += 0.8 * vn * swWound;
      float N = b ? floor(strands + 1.5 * max(k, 0.)) : top ? floor(strands * 0.3) : strands;
      float gg = (phi + m1.y + bend + k * 0.37) * N / TAU, id = mod(floor(gg), N), f = fract(gg) - 0.5;
      float h = hash21(vec2(id, seed)), h2 = fract(h * 57.31 + id * 0.317), cl = hash21(vec2(floor(id * 0.2), seed + 2.));
      float aw = 1.3 * px * N / (TAU * max(abs(Z), 0.1 * R)), soft = sat(aw * 1.5 - 0.5);
      float wd = b ? 0.38 + 0.12 * h2 : 0.25 + 0.25 * h2, off = fm * step(h2, b ? 0.12 : 0.5);
      float cov = mix(sat((wd - abs(f)) / max(aw, 1e-3) + 0.5) * (1. - off), 0.85 - 0.4 * fm, soft);
      float len = L0 * (b ? 0.78 + 0.22 * h : 0.5 + 0.22 * h + 0.35 * cl);
      cov *= mix(sat((len - v) / (px * 1.4) + 0.5), swFall(1., 0.6, vn), soft * soft);
      float ff = f * (1. - soft), pn = ff * (b ? 0.16 : 0.7);
      vec4 what = vec4(h, cl, vn, ff + floor(h2 * 50.));
      vec3 n = vec3(m0.x / R + pn * Z / R, 0.9 * M, Z / R - pn * m0.x / R) / abs(ic);
      if (Z > 0.) {
        if (cov > best) { hit = what; nor = n; best = cov; hitWho = who; }
        alpha += cov * (1. - alpha);
      } else if (cov * sat(8. * fl - 1.) > under) { hid = what; nid = n; under = cov * sat(8. * fl - 1.); hidWho = who; }
    }
    k += 1.;
  }
  float behind = alpha < 0.5 && under > 0.1 && inside < 0.5 ? 1. : 0.;
  if (behind > 0.5) { hit = hid; nor = -nid; hitWho = hidWho; alpha += under * (1. - alpha); }
  alpha = sat(alpha * 1.4);
  // the light on it
  int w = int(hitWho + 0.5);
  swWalker(w);
  vec2 q = swOwn(p, hitWho); float px = swPx / (swD * swRat);
  vec3 L = b ? vec3(-0.78, 0.49, 0.39) : normalize(vec3((swSun.x - swX) * 1.7, 0.3, -0.3));
  vec3 tint = uKind[w < 2 ? w : w == 2 ? 3 : (w == 3) == b ? 2 : 4];
  tint /= max(max(tint.r, max(tint.g, tint.b)), 0.1);
  float h = hit.x, cl = hit.y, vn = hit.z, h2 = floor(hit.w + 0.5) / 50., ff = hit.w - h2 * 50.;
  float occ = mix(b ? 0.5 : 0.42, 1., smoothstep(0., 0.8, vn + (b ? 0. : 0.6 * (cl - 0.5)))) * (1. - 0.35 * smoothstep(0.2, 0.5, abs(ff))) * (1. - 0.5 * behind);
  vec3 alb;
  if (b) {
    alb = swRag(h, h2);
    alb *= 1. - 0.3 * step(0.6, cl) * step(0.5, fract(vn * 8. + h)); // some were cut from a check
    alb = mix(alb, (0.3 + alb) * tint * 0.75, step(0.72, h2) * 0.8 * (0.2 + 0.8 * swLv));
  } else {
    alb = swStraw(sat(0.15 + 0.5 * h + 0.3 * cl + 0.25 * vn)) * (0.75 + 0.35 * h2);
    alb = mix(alb, (0.35 + alb) * tint * 0.75, (0.02 + 0.1 * cl) * (0.2 + 0.8 * swLv));
  }
  vec4 mp = piece(vec2(0.5 + 1.9 * q.x, 0.97 - 0.94 * q.y));
  alb += mp.rgb * mp.a * 0.3 * (0.3 + uEnergy) * (0.4 + 0.6 * h);
  float side = nor.x * inversesqrt(nor.x * nor.x + nor.z * nor.z + 1e-4), rim = 1. - sqrt(max(1. - side * side, 0.));
  rim *= rim * sat(0.2 + side * sign(L.x) * (1. - 0.4 * swB) + swA * 0.3 * abs(L.z));
  float call = 1. - uCue - 0.18 * hitWho; call = uCue * exp(-call * call * 12.);
  float thin = (b ? 0.12 * rim + 0.2 * swFl * vn * abs(nor.y) : 0.5 * rim * (0.5 + 0.5 * vn) + 0.05 * vn) + call * (0.1 + 0.4 * rim), dif = sat(dot(nor, L) * 0.75 + 0.25);
  vec3 c = alb * (swAmb * (0.7 + 0.3 * nor.y) * occ + swKey * (dif * dif * 1.25 * occ + thin));
  vec3 core = mix(swStraw(0.1), vec3(0.5, 0.2, 0.12), swB) * swAmb * 0.35, foot = mix(swStraw(0.2), vec3(0.17, 0.12, 0.09) * 0.7, swB) * swAmb * (0.7 + 0.2 * swB);
  // the belt of bells
  float Rb = swProf(0.52) + 0.03 + 0.06 * min(swFl, 0.5), sx = clamp(q.x / Rb, -0.99, 0.99), cz = sqrt(1. - sx * sx), an = asin(sx), gb = (an + swSpin) * 18. / TAU;
  float yy = q.y - (0.52 + 0.07 * sin(an + swSpin) - swD * (1. - 0.52 * swRat) * Rb * cz) + swJolt * 0.012 * swSin(floor(gb) * 0.39);
  vec2 bc = vec2((fract(gb) - 0.5) * TAU / 18. * Rb * cz, yy + 0.011) / 0.0155;
  float br = length(bc), on = step(abs(q.x), 0.93 * Rb) * step(0.5, many) * step(0.01, alpha + inside);
  vec3 bn = vec3(bc, sqrt(max(1. - br * br, 0.)));
  float gl = sat(dot(bn, normalize(vec3(L.xy, 0.8)))); gl *= gl; gl *= gl; gl *= gl;
  vec3 brass = mix(vec3(0.16, 0.1, 0.04), vec3(0.75, 0.55, 0.22), sat(0.5 + 0.6 * dot(bn, vec3(L.xy, 0.4)))) + vec3(1., 0.9, 0.65) * gl * (0.4 + 2.5 * uHits);
  brass *= 1. - 0.6 * swFall(0.16, 0., abs(bc.y + 0.35)) * step(br, 0.8);
  float bell = on * swFall(px / 0.0155, -px / 0.0155, br - 1.), cord = on * swFall(px, -px, abs(yy) - 0.006);

  vec3 col = swPlace(p, g, z, base, sh, haze);
  col = mix(col, foot, feet);
  col = mix(col, core, inside);
  col = mix(col, c, alpha);
  col = mix(mix(col, vec3(0.16, 0.08, 0.05) * swDim, cord), brass * swDim, bell);
  col = mix(col, haze, exp(-swD * 11.) * 0.6 * swA * max(alpha, inside));
  puff *= 1. - max(alpha, inside) * step(hitWho + 0.5, puffer);
  vec3 white = swDay(vec3(0.97), vec3(1., 0.88, 0.78), vec3(0.6, 0.68, 0.8));
  col = mix(col, mix(white, vec3(0.75, 0.6, 0.4) * swDim, 0.7 * swEa), sat(puff * 0.85));
  // loose straw in the air, and falling snow
  float loose = swAir(p, 0.075, 1., 0.02 + 0.3 * uTexture + 0.25 * uKeys, 1.);
  col = mix(col, (b ? swRag(fract(p.x * 1.7), 0.5) : swStraw(0.8)) * (swAmb + 0.5 * swKey), loose * 0.9);
  col = mix(col, haze, 0.35 * swSnow * swFall(0.6, -0.1, swD * max(max(alpha, inside), feet)));
  col = mix(col, white, 0.85 * max(swAir(p, 0.04, 3., 0.8 * swSnow, 0.), swAir(p + 0.2, 0.095, 4., 0.6 * swSnow, 0.)));
  return col;
}
