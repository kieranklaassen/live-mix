// name: Flung iron
// a: Town wall
// b: Dripping roof
// what: A winter night before a long cold town wall with a black gate: someone small in a sheepskin coat flings molten iron at the stones, and gold grains fan out, bend and fall on the snow; or an open frame roofed with willow boughs that drips fire, curtains of grains falling past dark branches and posts, with puddles to double them.
// follows: A hit throws: grains burst from the strike, which wanders with the loop; a cue throws across the whole wall or roof. The mix keeps grains flying, bands set their reach. Strokes light the stones or thicken the curtain where they lie. Drone is the furnace or the glow, pad embers and smoke, texture bouncing grains, phrase one long arc, keys a handful more.
// own: 0 red dusk at -1, blue moonlight at 1; 1 copper green at -1, white metal at 1; 2 a low strike flung flat at -1, a high one that weeps at 1, or the curtain blown left, or right; 3 far off at -1, close to the fire at 1; 4 a few drops at -1, a whole cauldron at 1; 5 bare earth at -1, wet stone at 1, or snow under the roof at -1, a flooded yard at 1
float fiPx;    // one pixel
float fiT;     // the sparks' slow clock
vec3 fiHot, fiGold, fiRed, fiWarm;   // the metal as it leaves, as it flies, as it dies, and its light on things
vec3 fiCold;   // the light of the night
vec2 fiS;       // where the iron strikes
float fiL, fiG, fiFar, fiAmp;   // its light, its fall, its reach, how much flies all the time
float fiDusk, fiMoon, fiDry, fiWet, fiRise, fiBig, fiHalf, fiVeil = 1.;   // hour and ground, a hit's light, a cue's, half the width, past the boughs
float fiIn(float d) { return 1. - smoothstep(-fiPx, fiPx, d); }
float fiDot(float d, float w) { return sat((w + fiPx - d) / (2. * fiPx)); }
float fiFall(vec2 d, float k) { return 1. / (1. + k * dot(d, d)); }
// The piece at a place across the picture.
vec4 fiSound(float x, float room) {
  float u = x / min(fiHalf, .89);
  return piece(vec2(sat(u * .5 + .5), sat(room))) * (1. - smoothstep(.75, 1.05, abs(u)));
}
float fiDn(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float fiSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 q = p - a, d = b - a;
  float k = sat(dot(q, d) / dot(d, d));
  return length(q - d * k) - mix(ra, rb, k);
}
// A grain's colour: 1 just thrown, 0 cold.
vec3 fiHeat(float h) {
  vec3 c = mix(fiRed, fiGold, smoothstep(0.0, .5, h));
  return mix(c, fiHot, smoothstep(.45, 1., h));
}
// One sheet of thrown grains, all at one speed v, so through each place pass two paths at most, and both can be worked out.
// amp: how many fly all the time. open: a burst's age, 0 to 1. lo: the ground.
vec3 fiSheet(vec2 q, float v, float G, float seed, float amp, float open, float burst, float lo) {
  float K = G / (2. * v * v), D = 1. - 4. * K * (q.y + K * q.x * q.x);
  const float N = 140.;  // how many paths
  vec3 sum = vec3(0.0);
  float s = sqrt(max(D, 0.0));
  for (int k = 0; k < 2 && D > 0.0 && q.y > lo - .12; k++) {
    float up = (1. + (k == 0 ? -s : s)) / (2. * K), r = length(vec2(q.x, up)) + 1e-5, t = r / v;
    if (t > 2.8) continue;
    float an = atan(up, q.x + 1e-6), a = (an / TAU + .5) * N, id = floor(a), h = hash11(mod(id, N) + seed), h2 = fract(h * 57.31), h3 = fract(h * 311.7);
    float sn = up / r, w = length(vec2(v * q.x / r, v * sn - G * t)) + 1e-4;
    float per = v * t * abs(v - G * t * sn) / w * TAU / N;  // how wide one path's share is here
    float d = abs(fract(a) - .3 - .4 * h2) * per;
    if (d > .013) continue;
    float few = smoothstep(0.0, .15, fract(h * 1733.1) - .42 + .4 * uOwn[4] + .2 * uKeys);
    float wide = (.0005 + .0016 * h3 * h3 * h3 * h3 * (1. - .9 * uOwn[4])) * (1. + .6 * exp(-2. * t));
    float line = fiDot(d, wide) * min(1., wide / fiPx) + .12 * exp(-d * 220.) * h3 * h3 * fiDn(.008, .013, d);
    line *= smoothstep(1., 6., per / fiPx) * few;
    // the splash is uneven, and leans away from the throw
    float clump = .5 + .5 * sin(an * 3. + seed) * sin(an * 5. - 2. * seed);
    float far = (.45 + 1.1 * band(fract(abs(fract(an / TAU + .19) * 2. - 1.) * .8 + .2 * h)) + .5 * h2) * (.3 + 1.35 * clump) * (1. + (.21 * up - .28 * q.x) / r);
    float land = smoothstep(lo - .01 - .1 * h3, lo + .02 - .1 * h3, q.y);
    // the grains that fly all the time, one after another along the path
    float f = t * 1.5 - fiT + h * 31., g = floor(f), x = f - g, hg = hash11(mod(g, 977.) + 3.7 * h3 + seed), hl = fract(hg * 41.3);
    float len = .15 + .6 * hl, soft = min(.02 + 1.5 * fiPx / w, .12);
    float dash = smoothstep(1. - len, 1. - soft, x) * fiDn(1. - soft, 1., x);
    float seen = (.15 + 1.1 * hl * hl + .5 * h3) * smoothstep(hg, hg + .3, amp * 1.35) * dash * fiDn(.5 * far, 1.4 * far, t);
    // and the burst
    float bl = 1.9 * open * (.55 + .45 * h2) - t;
    float bs = (.15 + 1.3 * clump * h2) * burst * smoothstep(0.0, .03, bl) * fiDn(.06, .3 + .75 * h3, bl);
    float heat = exp(-t * (.75 + .6 * h));
    sum += line * land * (fiHeat(heat * 1.1) * seen * (.5 + 1.6 * heat) + fiHeat(heat + .2 * burst) * bs * (.5 + 2. * heat));
  }
  return sum;
}
// Embers drifting down.
float fiEmbers(vec2 p, float amp) {
  float sum = 0.0;
  for (int k = 0; k < 3 && uVar < .5; k++) {
    float f = float(k), n = 13. - 3. * f;
    vec2 g = vec2(p.x * n + .35 * sin(p.y * (3. + f) + uTime * .21 + f * 2.) + f * 3.7, p.y * n * .42 + mod(uTime * (.1 + .035 * f), 977.));
    vec2 id = floor(g), h = hash22(vec2(id.x, mod(id.y, 977.)) + 41. * f);
    vec2 e = (g - id - vec2(.15 + .7 * h.x, .2 + .6 * h.y)) / vec2(n, .42 * n);
    float w = (.0005 + .0005 * f) * (.7 + .9 * h.x), hh = fract(h.y * 37.7);
    e.y /= 2. + 4. * hh;
    float d = length(e);
    sum += (fiDot(d, w) * min(1., w / fiPx) + .08 * exp(-d * d * 90000.)) * (.3 + h.x) * smoothstep(hh, hh + .25, amp * 1.1);
  }
  return sum;
}
// Grains hopping on the ground, e up from a line of it.
float fiHops(vec2 e, float n, float high, float seed, float amp) {
  if (e.y > high * 1.1 + .03 || e.y < -.04) return 0.0;
  float g = e.x * n + seed, id = floor(g), h = hash11(mod(id, 977.) + seed), T = uTime * (.5 + .3 * h) + 9. * h, b = floor(T), u = T - b, h2 = hash11(mod(b, 311.) + 17. * h);
  vec2 d = vec2((g - id - .3 - .4 * h2 - (u - .5) * .5 * (h - .5)) / n, e.y + .06 * h - .03 - high * (.35 + .65 * h2) * 4. * u * (1. - u));
  d.y /= 1. + 2.5 * abs(1. - 2. * u);
  float r = length(d);
  return (fiDot(r, .0011) + .1 * exp(-r * r * 20000.)) * (.2 + 1.2 * fract(h2 * 7.7)) * smoothstep(h2, h2 + .3, amp * 1.3) * smoothstep(0.0, .1, u) * fiDn(.85, 1., u);
}
// The one who throws, feet at 0, with a long ladle.
float fiThrower(vec2 q, float swing) {
  if (abs(q.x + .06) > .16 || abs(q.y - .12) > .17) return 1.;
  vec2 hand = vec2(-.004, .118) + rot(-.5 * swing) * vec2(-.058, .02), tip = hand + rot(-.8 * swing) * vec2(-.085, .062);
  float d = min(fiSeg(q, vec2(.012, 0.0), vec2(.01, .05), .008, .012), fiSeg(q, vec2(-.026, 0.0), vec2(-.006, .05), .008, .012));
  d = min(d, fiSeg(q, vec2(.004, .052), vec2(-.004, .118), .032, .019));
  d = min(d, fiSeg(q, vec2(-.006, .116), hand, .012, .007));
  d = min(d, fiSeg(q, hand - (tip - hand) * .25, tip, .0022, .0022));
  return min(d, min(length(q - vec2(-.01, .15)) - .016, length(q - tip) - .009));
}
// A phrase's arc.
vec3 fiStray(vec2 q, float G) {
  float x = uTime / 9., T = 2.4 * fract(x), t = clamp(-q.x / (mod(floor(x), 2.) < .5 ? .4 : .52), 0.0, 2.4), age = T - t;
  float d = abs(q.y - t * (.5 - .3 * G * t)) / (1. + 1.5 * abs(.5 - .6 * G * t));
  float tail = exp(-age * 1.6) * smoothstep(0.0, .35, t) * fiDn(2., 2.4, T);
  return uPhrase * (fiHeat(.95 - .4 * sat(age)) * .75 + uKind[3] * .4) * tail * (1.3 * fiDot(d, .0011) * smoothstep(0.0, .02, age) + .2 * exp(-d * 200.) * smoothstep(0.0, .12, age));
}
// The night sky with its stars, or dusk; up is 0 at the horizon.
vec3 fiSky(vec2 p, float up) {
  vec2 g = p * 15., id = floor(g), h = hash22(id + 7.);
  float star = step(.72, fract(h.x * 51.)) * fiDot(length(g - id - .2 - .6 * h) / 15., .0012) * (.25 + .5 * h.y) * smoothstep(.02, .4, up) * (1. - fiDusk);
  vec3 night = mix(vec3(.005, .008, .016), vec3(.0011, .0016, .0045), up) + vec3(.02, .035, .07) * fiMoon * (1. - .5 * up);
  return mix(night, mix(vec3(.36, .1, .05), vec3(.02, .018, .06), smoothstep(0.0, .75, up)), fiDusk) + vec3(.75, .85, 1.) * star;
}
vec3 fiWall(vec2 p, float F, vec2 gp) {
  vec2 S = fiS, q = p - S;
  float L = fiL;
  // where this place is on the wall, which runs away to the left
  vec2 vp = vec2(-1.2, -.21), e = p - vp;
  float s = max(e.x, .05), hgt = e.y / s, U = 1.2 / s, ap = fiPx / s;
  vec2 fp = gp + vec2(-.21, .035);  // the furnace
  vec3 col = fiSky(p, sat((p.y + .25) / .75));
  // the wall: courses of stone, one gate, a notched top
  float merl = smoothstep(-ap * 1.5, ap * 1.5, abs(fract(U / .15) - .5) * .15 - .032);
  float top = .4 + .036 * merl, foot = -.092 + .012 * noise(vec2(U * 7., 2.)) * (1. - fiDry);
  float wall = fiDn(top - ap, top + ap, hgt) * smoothstep(.19, .19 + fiPx, e.x);
  if (wall > 0.0 && hgt > foot - 2. * ap) {
    float row = floor(hgt / .026), y = fract(hgt / .026), x = U / .075 + .5 * mod(row, 2.) + .2 * hash11(row + 3.), id = floor(x); x -= id;
    float fade = fiDn(.15, .6, ap / .026), tone = mix(.5, hash21(vec2(id, row)), fade), rough = noise(vec2(U * 60., hgt * 80.));
    float jy = min(y, 1. - y) * .026, jx = min(x, 1. - x) * .075;
    float joint = 1. - (1. - smoothstep(.0012 - ap, .0012 + ap, min(jy, jx))) * fade;
    vec3 stone = mix(vec3(.34, .31, .29), vec3(.52, .46, .4), tone) * (.55 + .5 * rough) * mix(.35, 1., joint);
    // how the fire falls on it
    vec2 ds = vec2(U - 1.2 / (S.x - vp.x), hgt - (S.y - vp.y) / (S.x - vp.x)), df = vec2(U - 1.2 / (fp.x + .02 - vp.x), hgt + .07);
    float l = 1.25 * L * fiFall(ds, 38.) * (fiFall(ds, 6.) + .1);
    float bev = (y - .5) * sign(-ds.y) * smoothstep(.25, .5, abs(y - .5)) * fade;
    float lf = F * .26 * fiFall(df, 30.);
    vec3 m = fiSound(p.x, 1. - (hgt + .09) / .5).rgb;
    vec3 lit = fiCold * (1.2 + .7 * hgt) * (1. + .8 * fiMoon) + fiWarm * l * (1. + 1.6 * bev) * .9 + fiRed * 1.6 * lf * (1. - bev);
    lit += m * mix(vec3(1.), fiWarm, .75) * (.03 + .5 * uEnergy) * (.1 + .55 * tone) * (1. + bev);
    vec3 w = stone * lit;
    // the gate
    float gx = -min(.4, .62 * fiHalf), gu = 1.2 / (gx - vp.x), dx = U - gu;
    float arch = hgt < .075 ? abs(dx) - .15 : length(vec2(dx, hgt - .075)) - .15;
    w = mix(w, vec3(.42, .38, .33) * lit * (.6 + .5 * rough), fiDn(.034 - ap, .034 + ap, arch));
    w = mix(w, vec3(.0012, .0012, .0016), fiDn(-ap, ap, arch));
    // snow on top
    w = mix(w, vec3(.5, .55, .6) * (fiCold * 4. + fiWarm * l * .7), (1. - fiDry) * smoothstep(top - .012 - ap, top - .012 + ap, hgt + .006 * rough));
    col = mix(col, w, wall);
  }
  // the ground: snow, or bare earth, or wet stone
  float gy = e.x > 0.0 ? foot * s : -.002;
  float gnd = fiIn(e.y - gy);
  if (gnd > 0.0) {
    float dep = .1 / max(-e.y, .006);
    vec2 g = vec2(p.x * dep * 5., dep * 9.);
    float b1 = noise(g), b2 = noise(g * 3.3 + 5.), bump = b1 * .65 + b2 * .35;
    vec2 a = (p - vec2(S.x, gy + vp.y)) * vec2(1., 2.6), b = (p - fp - vec2(-.01, 0.0)) * vec2(1., 2.4);
    float l = L * (.5 * fiFall(a, 9.) + .06) + .2 * fiBig, lf = F * .1 / (.12 + 7. * dot(b, b));
    float slope = (b1 - noise(g + vec2(.25, 0.0))) * 2.;
    vec3 alb = mix(mix(vec3(.75, .82, .95), vec3(.16, .11, .08), fiDry), vec3(.1, .11, .13), fiWet);
    vec3 lit = fiCold * 2.2 * (.75 + .5 * bump) + fiWarm * l * (.35 + .9 * bump + slope) + fiRed * 2.2 * lf * (.3 + 1. * bump + slope);
    lit += fiSound(p.x, .93).rgb * fiWarm * .12 * (.3 + bump);
    vec3 c = alb * lit * (.55 + .45 * smoothstep(0.0, .06, foot * s - e.y));
    // wet stone gives the fire back, drawn long
    float rx = (p.x - S.x) * 2.2 + .25 * (b2 - .5);
    c += fiWet * fiWarm * L * 1.7 * exp(-rx * rx) * smoothstep(.25, .8, bump);
    col = mix(col, c, gnd);
  }
  // smoke that drifts along the wall
  float sm = noise(vec2(p.x * 2.6 - uTravel * .1, p.y * 4.5));
  col += (fiWarm * L * .035 * fiFall(q - vec2(0.0, .08), 9.) + (uKind[1] * .006 * uPad + fiCold * .1)) * sm * sm * smoothstep(-.4, 0.0, p.y);
  return col;
}
// A curtain of grains dropping from a roof: drop is the height fallen so far, sc the curtain's size on the screen.
vec3 fiCurtain(float x, float drop, float sc, float n, float seed, float amp, vec3 tint, float wind) {
  float t = sqrt(max(drop, 0.0) * 2.), x0 = (x - wind * t * t) * n, id = floor(x0), h = hash11(mod(id, 977.) + seed), h2 = fract(h * 57.31), h3 = fract(h * 311.7);
  float d = abs(x0 - id - .2 - .6 * h2) / n * sc, few = smoothstep(0.0, .15, fract(h * 1733.1) - .34 + .36 * uOwn[4]);
  if (few <= 0.0 || d > .016) return vec3(0.0);
  float wide = (.0006 + .0012 * h3 * h3 * h3) * (.5 + .5 * sc);
  float f = t * 2.2 - fiT + 31. * h, g = floor(f), u = f - g, hg = hash11(mod(g, 977.) + 3.7 * h3 + seed), hl = fract(hg * 41.3);
  float len = .2 + .7 * hl, k = smoothstep(1. - len, 1., u), heat = exp(-t * (.5 + .7 * h2));
  float light = (fiDot(d, wide * (.5 + .5 * k)) * min(1., wide / fiPx) + .09 * exp(-d * 230.) * h3 * fiDn(.4, .95, k)) * k * fiDn(.985, 1., u);
  return few * light * smoothstep(.02, .25, t) * smoothstep(hg, hg + .3, amp) * (.25 + 1.1 * hl * hl + .5 * h3) * mix(fiHeat(heat * 1.05), tint * 1.4, .16) * (.5 + 1.3 * heat);
}
// Willow boughs hanging from a pole heaped with leaves; y how far down from it.
float fiBoughs(vec2 q, float n, float len, float seed, float w) {
  float m = 0.0;
  if (q.y < -.06 || q.y > len) return m;
  m = smoothstep(-.05 - w, -.05 + w, q.y) * fiDn(-.01, .01, q.y - .07 * noise(vec2(q.x * 60., q.y * 20.)) + .03);
  for (int k = 0; k < 2; k++) {
    float g = (q.x + .03 * sin(q.y * 6. + seed + float(k)) + .03 * q.y * sin(uTime * .37 + q.x * 3. + float(k))) * n + .5 * float(k), id = floor(g), h = hash11(id + seed + 31. * float(k)), h2 = fract(h * 91.7);
    float l = len * (.2 + .8 * h * h), x = (g - id - .35 - .3 * h2) / n, st = fiDn(l - .03, l, q.y);
    if (abs(x) > .03 || st <= 0.0) continue;
    m = max(m, fiDn(.0016 - w, .0016 + w, abs(x)) * st);
    for (int j = 0; j < 2; j++) {
      float side = j == 0 ? -1. : 1., v = q.y * 26. + 7. * h + .5 * float(j), vi = floor(v);
      vec2 c = rot(side * (.1 + .7 * hash11(vi + 9. * h + 3. * side))) * vec2(x - side * .008, (v - vi - .5) / 26.);
      c /= vec2(.0042, .018) * (.75 + .5 * h2);
      m = max(m, fiDn(.7, 1.15, dot(c, c)) * st);
    }
  }
  return m;
}
vec3 fiRoof(vec2 p) {
  const float hy = -.27, H = .74, hg = .2;  // the horizon, the roof's height, the eye's height
  float wind = .02 + .04 * sin(uTime * .09) + .4 * uOwn[2], u = sat(p.x / min(fiHalf, .89) * .5 + .5), L = fiL;
  vec2 S = fiS, q = p - S;
  float mid = exp(-5. * q.x * q.x);
  float far = hy + H / 3.2;
  vec3 col = p.y < far + .03 ? fiSky(p + vec2(.3, 0.0), sat((p.y - hy) / .4)) : vec3(0.0);
  // the ground and its puddles
  float pud = 0.0, wob = 0.0;
  if (p.y < hy) {
    float z = hg / (hy - p.y + .002);
    vec2 g = vec2(p.x * z, z), a = (p - vec2(S.x, -.34)) * vec2(1., 2.4);
    float n = noise(g * vec2(2.2, 2.6) + 3.) * .65 + noise(g * vec2(7., 8.)) * .35, n2 = noise(g * vec2(40., 24.)), cut = .5 - .6 * fiWet + .6 * fiDry;
    pud = smoothstep(cut, cut + .05, n);
    wob = .005 * (n2 - .5 + sin(p.y * 260. + uTime * 1.3) * .2);
    vec3 alb = mix(vec3(.11, .08, .06), vec3(.8, .85, .95), fiDry) * (.5 + .8 * n2);
    float gx = (p.x - S.x) * 2.6 + .2 * (n2 - .5);
    col = mix(alb * (fiCold * 3. + fiWarm * L * (.03 + .28 * fiFall(a, 9.))), fiCold * .8 + vec3(.1, .03, .015) * fiDusk + fiWarm * L * (.2 + .25 * fiWet) * exp(-gx * gx) * (.4 + .8 * n2), pud);
  }
  // far posts of the frame
  for (int k = 0; k < 2 && uVar > .5; k++) {
    float z = k == 0 ? 2.9 : 1.9, b = hy - hg / z;
    col = mix(col, vec3(.002), fiIn(abs(abs(p.x * z + .1) - .92) / z - .03 / z) * step(b, p.y));
  }
  // the roof over us: poles one way and the other, willow leaves heaped on them
  if (p.y > far - .03) {
    float z = H / max(p.y - hy, .05), w = fiPx * z;
    vec2 g = vec2(p.x * z, z);
    float lv = noise(g * 4.), leafy = 0.0;
    for (int k = 0; k < 2 && uVar > .5; k++) {
      vec2 c = rot(.5 + 1.2 * float(k)) * g * 27., id = floor(c), h = hash22(id + 40. * float(k));
      c = rot(2.4 * (h.x - .5)) * (c - id - .35 - .3 * h);
      leafy = max(leafy, fiDn(.3 - 27. * w, .4 + 27. * w, length(c * vec2(1., 4.))) * (.1 + .9 * h.y * h.y));
    }
    vec3 m = fiSound(p.x, 1. - (z - .9) / 2.3).rgb;
    float l = L * (.04 + .9 * fiFall(q, 18.));
    vec3 leaf = (vec3(.5, .42, .14) * l * leafy + m * .4 * leafy) * fiWarm * (.1 + 3. * lv * lv * lv) + fiCold * .15 * leafy;
    float pole = fiDn(.02 - w, .02 + w, abs(fract(g.x / .5 + .3) - .5) * .5), cross_ = fiDn(.028 - 2. * w, .028 + 2. * w, abs(fract(g.y / .5) - .5) * .5);
    leaf = mix(leaf, vec3(.002) + vec3(.25, .16, .08) * fiWarm * l * .05, max(pole, cross_));
    col = mix(col, leaf, smoothstep(0.0, .02, p.y - far + .03 * lv));
  }
  // the glow that hangs in the smoke
  float sm = noise(vec2(p.x * 2.4 - uTravel * .08, p.y * 4.));
  col += (fiWarm * L * .17 * fiFall((p - vec2(S.x, 0.0)) * vec2(1., .9), 26. - 12. * uSpace) * (.3 + 1.6 * sm * sm) + (uKind[0] * .012 * uDrone + uKind[1] * .018 * uPad) * sm * sm) * smoothstep(hy - .02, hy + .06, p.y);
  // the curtains, far to near, the boughs hanging between them
  vec3 fire = vec3(0.0);
  for (int k = 0; k < 4 && uVar > .5; k++) {
    float f = float(k), z = 3. / (1. + .36 * f + .11 * f * f), s = 1. / z, yR = hy + H * s, yG = hy - hg * s;
    bool below = p.y < yG;
    float y = below ? 2. * yG - p.y : p.y, x = p.x + (below ? wob : 0.0);
    if (y < yR && (!below || pud > .01)) {
      vec4 m = fiSound(p.x, .08 + .28 * f);
      float amp = (fiAmp + .3 * uKeys) * (.4 + 1.1 * band(u)) * (.25 + mid) + m.a * (.35 + .8 * uEnergy) + .35 * fiRise * mid + .6 * fiBig;
      vec3 tint = m.a > .004 ? m.rgb / m.a : uKind[1];
      fire += fiCurtain(x * z, (yR - y) * z, s, 60. - 11. * f, 7. + 13. * f, sat(amp), tint, wind) * (below ? 1.5 * pud : 2.5);
    }
    if ((k == 1 || k == 3) && p.y > hy + .1) {
      float bo = fiBoughs(vec2(p.x * z + .3 * f, (yR - p.y) * z - (k == 1 ? 0.0 : .12)), k == 1 ? 9. : 7., k == 1 ? .62 : .56, 5. + f, fiPx * z);
      fire *= 1. - bo;
      if (k == 3) fiVeil = 1. - bo;
      col = mix(col, vec3(.0012, .0013, .0008), bo);
    }
  }
  return col + fire;
}
// The sheets of a throw, where each starts and how fast: three at the wall, one for a hit, two for a cue, two for the roof.
const vec2 fiFrom[8] = vec2[8](vec2(-.1, .055), vec2(.075, -.02), vec2(0.0), vec2(0.0), vec2(-.48, -.07), vec2(.44, .06), vec2(0.0), vec2(.09, .03));
const float fiFast[8] = float[8](.38, .54, .8, 1.1, .72, .72, .42, .75);
vec3 render(vec2 p) {
  bool wall = uVar < .5;
  float zoom = exp2(-.6 * uOwn[3]), green = max(-uOwn[1], 0.0), white = max(uOwn[1], 0.0), hit = uHits, swing = sat(4. * hit * (1. - hit));
  fiPx = .75 / uRes.y * zoom;
  p = (p - vec2(0.0, (wall ? -.04 : -.1) * uOwn[3])) * zoom;
  fiHalf = max(.5 * uRes.x / uRes.y, .2);
  fiT = mod(uTime * .42, 977.);
  fiDusk = max(-uOwn[0], 0.0); fiMoon = max(uOwn[0], 0.0); fiDry = max(-uOwn[5], 0.0); fiWet = max(uOwn[5], 0.0);
  fiHot = mix(mix(vec3(2.6, 1.75, .85), vec3(1.5, 2.6, 1.5), green), vec3(2.2, 2.3, 2.5), white) * (.7 + .6 * uTone);
  fiGold = mix(mix(vec3(1.7, .66, .14), vec3(.25, 1.15, .55), green), vec3(1.1, 1.15, 1.35), white);
  fiRed = mix(mix(vec3(.62, .1, .015), vec3(.03, .3, .22), green), vec3(.3, .32, .55), white);
  fiWarm = fiGold * vec3(1., .85, .75);
  fiCold = (wall ? 1. : .65) * (vec3(.01, .016, .03) * (1. + 2.3 * fiMoon) + vec3(.03, .01, .012) * fiDusk);
  fiRise = .25 * hit + .75 * swing; fiBig = .3 * uCue + .7 * sat(4. * uCue * (1. - uCue));
  float F = .22 + .04 * sin(uTime * .7) + .9 * uDrone + .3 * uMic, pin = min(fiHalf, .89);
  vec2 gp = wall ? vec2(clamp(fiHalf * .7, .17, .6), -.452) : vec2(.14, -.365);  // the thrower's feet
  vec3 col;
  if (wall) {
    fiS = vec2(.06 + .09 * sin(TAU * uLoop), .1 + .13 * uOwn[2]);
    fiG = .62 * exp2(1.5 * uOwn[2]); fiFar = (.75 + .5 * uSpace) * exp2(.35 * uOwn[2]);
    fiAmp = sat((.35 + .75 * uEnergy) * (.55 * uLevel + .25 * uPhrase + .2 * uHigh) * (1. + .7 * uOwn[4]));
    fiL = (.08 * fiAmp + .5 * fiAmp * fiAmp + .9 * fiRise + .9 * fiBig) * (1. + .6 * uOwn[4]);
    col = fiWall(p, F, gp);
  } else {
    fiS = vec2(-.06 + .1 * sin(TAU * uLoop), .13); fiG = .62; fiFar = 1.;
    fiAmp = (.27 + (.3 + .6 * uEnergy) * .45 * uLevel) * (1. + .5 * uOwn[4]);
    fiL = .12 + .6 * fiAmp + .3 * uDrone + .2 * uMic + .7 * fiRise + .9 * fiBig;
    col = fiRoof(p);
  }
  // the fire itself
  vec2 q = p - fiS;
  int last = wall ? (uCue > .004 ? 6 : hit > .004 ? 4 : 3) : hit > .004 ? 8 : 6;
  for (int i = wall ? 0 : 6; i < last; i++) {
    float own = i == 4 || i == 5 ? uCue : hit;
    col += fiVeil * fiSheet(q - fiFrom[i], fiFast[i] * fiFar, fiG, 3. + 9. * float(i), i < 3 ? fiAmp + (i < 2 ? .7 * uKeys : 0.0) : 0.0, 1. - own, .9 * smoothstep(0.0, .5, own), -.36 - fiS.y - fiFrom[i].y);
  }
  float am = wall ? .35 * fiAmp * fiAmp : 0.0;
  col += fiVeil * (fiStray(q, fiG) + fiHot * (am + .8 * hit + .4 * uCue) * (.0003 / (dot(q, q) + .00022))) + fiGold * fiL * (wall ? .0022 : .0008) / (dot(q, q) + .012);
  if (wall) col += (fiHeat(.3) * .7 + .25 * uKind[1] * uPad) * fiEmbers(p, sat(.14 + .6 * uPad + .4 * fiSound(p.x, .5 - p.y).a)) * smoothstep(-.44, -.3, p.y);
  // grains bouncing on the ground
  float tx = (.95 * uTexture + .3 * hit) * exp(-1.8 * q.x * q.x), hops = 0.0;
  for (int k = 0; k < 3 && tx > .003; k++) { float f = float(k); hops += fiHops(vec2(p.x, p.y + .34 + .053 * f), 24. - 4. * f, .045 + .015 * f, 3. + 6. * f, tx); }
  col += fiHeat(.65) * 1.2 * hops;
  // the furnace, a few sparks always rising
  vec2 f = p - gp - vec2(-.21, .035), mo = f + vec2(.01, .022);
  if (wall) {
    float clay = noise(f * 70.), fw = .048 - .14 * f.y - 1.1 * f.y * max(f.y, 0.0) + .004 * clay, side = sat(-f.x / fw);
    float fm = fiIn(max(abs(f.x) - fw, max(-f.y - .05, f.y - .085 + .002 * clay)));
    float mouth = max(length(mo * vec2(1., .75)) - .018 + .004 * clay, -mo.y - .02);
    vec3 skin = fiCold * .2 + (fiWarm * fiL * (.02 + .1 * side * side) + fiRed * F * .35 * exp(-max(mouth, 0.0) * 70.)) * (.35 + clay);
    vec3 hearth = mix(fiRed * 1.1, fiGold * 1.3, sat(F * .7 - .25 - mo.y * 12.)) * (.6 + .6 * clay) * (.4 + .9 * F);
    col = mix(col, mix(skin, hearth, fiDn(-.003, .003, mouth)), fm);
    col += fiRed * F * .05 * fiFall(mo, 900.) + fiGold * F * .1 * fiFall(f - vec2(0.0, .092), 4000.);
  }
  for (int k = 0; k < 3 && wall; k++) {
    float x = uTime / (6. + float(k)) + .35 * float(k), u = fract(x), h = hash11(mod(floor(x), 977.) + 7. * float(k));
    vec2 c = f - vec2((h - .6) * .3 * u + .012 * sin(u * 11. + 9. * h), .095 + (.18 + .2 * h) * u);
    float d = length(c * vec2(1., .6));
    col += fiHeat(.9 - .6 * u) * sin(PI * sqrt(u)) * (1.2 * fiDot(d, .0013) + .15 * exp(-d * 200.));
  }
  // the one who throws, near the wall or small under the roof
  float size = wall ? 1. : .62, th = fiThrower((p - gp) / size, swing) * size;
  vec3 rim = (fiWarm * fiL * .06 + (wall ? fiRed * F * .1 : vec3(0.0))) * smoothstep(-.005, 0.0, th) * fiDn(-.03, .02, p.x - gp.x);
  col = mix(col, vec3(.0021) + rim, fiIn(th));
  // the near posts and their beam
  float by = .415 + .03 * p.x, beam = abs(p.y - by) - .018;
  if (!wall) col = mix(col, vec3(.0016) + fiWarm * fiL * .03 * smoothstep(-.008, 0.0, beam) * step(p.y, by), fiIn(beam));
  for (int k = 0; k < 2 && !wall; k++) {
    float x = k == 0 ? p.x + .7 * pin - .02 * p.y : p.x - .6 * pin - .03 * p.y, bark = noise(vec2(x * 160., p.y * 9.)), d = abs(x) - (k == 0 ? .042 : .026) - .003 * bark;
    float edge = smoothstep(-.014, 0.0, d) * smoothstep(0.0, .01, k == 0 ? x : -x);
    col = mix(col, vec3(.0016, .0013, .0013) + fiWarm * fiL * edge * bark * .14, fiIn(d));
  }
  return screenOf(col);
}
