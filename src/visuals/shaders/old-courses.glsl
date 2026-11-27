// name: Old courses
// a: Flood plain
// b: Crescent lake
// what: Early morning from a balloon: one river in great loops, the sun lying along two of its bends, and round it the pale combed lines of every bed it has left, with poplars and crescent lakes; or winter close above one cut-off lake under thin ice, old banks round it as rows of bare willow, and one thread of fox tracks.
// follows: The piece colours fields and willow rows; the loop runs through the beds in turn. Drone widens the river or mists the ice, pad brings mist and sun, texture pale reeds or rime, phrase grows a bend or sways the willow, low, mid and high swell bends, bands light rows. A hit runs glitter or a crack, a cue floods the plain or lights rows, keys bring birds.
// own: 0 moonlight at -1, clear noon (b: red evening) at 1; 1 snow (b: green spring, open water) at -1, autumn (b: white hoar) at 1; 2 low water and sand, or a shrunken pool, at -1, the plain in flood, or a brimming lake, at 1; 3 no trees at -1, thick with them at 1; 4 a nearly straight river, or an island in a round lake, at -1, wide tight loops, or a thin crescent, at 1; 5 low, near the ground, under much sky at -1, high above, looking down, at 1
float ocPx, ocHour, ocCold, ocGold, ocWet, ocWood, ocForm, ocHigh, ocHz, ocH; // a pixel, the world it is, the horizon, the eye's height
vec3 ocTop, ocLow, ocSun, ocMist, ocDay; // sky high and low, the sun, the mist, what the light does to the land
vec2 ocSunAt; vec3 ocPoint;
const float OC_F = .95;
vec3 ocBy(vec3 low, vec3 mid, vec3 high, float q) { return q < 0. ? mix(mid, low, -q) : mix(mid, high, q); }
float ocUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float ocIn(float d, float w) { return ocUp(w, -w, d); }
float ocGrey(vec3 c) { return dot(c, vec3(.3, .55, .15)); }
vec3 ocSky(vec2 p) {
  float up = max(p.y - ocHz, 0.), ds = length((p - ocSunAt) * vec2(.62, 1.));
  vec3 c = mix(ocLow, ocTop, ocUp(-.03, .34, up));
  float ci = noise(vec2(p.x * 1.7 + p.y + uTime * .006, up * 22.)) * .65 + noise(vec2(p.x * 5. - uTime * .004, up * 60. + p.x * 3.)) * .35;
  c = mix(c, mix(ocMist, ocSun, .4), .5 * ocUp(.5, .85, ci) * ocUp(0., .1, up));
  c = mix(c, ocSun, (.5 + .2 * uPad) * exp(-ds * 4.6) + .45 * exp(-ds * 15.));
  return mix(c, min(ocSun + .07, 1.), .85 * ocIn(length(p - ocSunAt) - .021, .0025));
}
// One bed of the river in the valley's own measure: arcs of circles through fixed crossings, over and under in turn. How far above
// it we are; the arc's middle and the angle are left for what grows along it.
vec2 ocV; float ocR, ocK, ocSide;
const float OC_TALL = .09;
float ocBed(vec2 q, float h) {
  float s = q.y > 0. ? 1. : -1.;
  ocK = s > 0. ? 2. * floor(q.x * .5 + .5) : 2. * floor((q.x - 1.) * .5 + .5) + 1.;
  ocR = sqrt(.25 + h * h);
  ocSide = s;
  ocV = vec2(q.x - ocK, abs(q.y) - h);
  return (length(ocV) - ocR) * s;
}
float ocBend;
float ocHump(float x) { return exp(-2. * x * x); }
vec2 ocValley(vec2 g) {
  vec2 q = rot(-1.02) * (g - vec2(.45, 1.25));
  q = vec2(q.x + .2 * sin(q.y * 1.1 + .6) + .16 * sin(q.x * 1.7 + 1.), q.y + .36 * sin(q.x * .62 + .4) + .1 * sin(q.x * 2.3));
  return vec2(q.x, q.y / (1. + .2 * sin(q.x * 1.05 + 1.9) + ocBend * ocHump(q.x + 1.) + .12 * uLow * ocHump(q.x) + .2 * uMid * ocHump(q.x + 2.) + .3 * uHigh * ocHump(q.x + 3.4)));
}
// How deep bed j swings: 0 is the river now, 8 the oldest.
vec2 ocAge(float j) {
  float sw = sin(TAU * (uLoop - j / 9.));
  return vec2(.32 + (ocForm > 0. ? .15 : .5) * ocForm - j * .052 + .014 * sw + .02 * sin(uTime * .021 - j * .7), j * .052 + .012 * sw);
}
// The row of trees along the bed last asked for, where a line of sight crosses it at height h (the eye looks along v, the
// ground behind is r away), n trees to the circle: how much is seen, and how far up the tree.
vec2 ocRow(float h, vec2 v, float r, float n, float seed, float px) {
  float u = (atan(ocV.y, ocV.x + 1e-5) / TAU + .5) * n, c = floor(u), h1 = hash21(vec2(c, seed)), l = TAU * ocR / n, s = ocSide;
  float there = step(.14 - .14 * ocWood, h1) * ocUp(.36, .42, noise(vec2(u * .09, seed)) + .55 * ocWood);
  vec2 e = ocV / max(length(ocV), .01), along = vec2(-e.y, e.x * s);
  float du = (u - c - .5) * l, tall = OC_TALL * (.4 + .6 * fract(h1 * 7.)) * there + 1e-4;
  float y = (h + ocH * du * dot(along, v) / r) / tall, x = du * (abs(along.x * v.y - along.y * v.x) + .12);
  float w = tall * (.17 + .13 * fract(h1 * 37.)) * pow(sat(1. - y), .6) * (.25 + .75 * ocUp(.0, .3, y)) * ocUp(-.03, .02, y);
  return vec2(there * ocIn(abs(x) - w, px) * step(y, 1.) * step(-.03, y), sat(y));
}
// Low scrub: round crowns, one to a cell, darker where they turn from the sun.
vec2 ocScrub(vec2 g, float f, float want, float soft) {
  vec2 c = floor(g * f), j = hash22(c), o = g * f - c - .5 - .56 * (j - .5);
  float r = .1 + .2 * j.x;
  return step(hash21(c + 11.), want) * vec2(ocIn(length(o * vec2(1., .7)) - r, soft * f + .05), ocIn(length(o * vec2(1., .5) + vec2(.04, .16)) - r, soft * f + .12));
}
// A few birds going over as keys are played.
vec3 ocBirds(vec3 c, vec2 p, vec3 tint) {
  if (uKeys < .01) return c;
  for (int i = 0; i < 5; i++) {
    float f = float(i), s = .016 - .0015 * f;
    vec2 q = (p - vec2(1.3 - 2.6 * fract(uTime * .009 + .37 + .19 * f), .11 * hash11(f + 2.) + .02 * f - .06)) / s;
    float flap = .5 * sin(uTime * 2.1 + f * 1.9), x = abs(q.x), y = q.y - flap * x + (.35 + .6 * abs(flap)) * x * x * .7;
    float b = max(ocIn(abs(y) - .16 * (1. - x), ocPx / s) * step(x, 1.), ocIn(length(q * vec2(.6, 1.)) - .2, ocPx / s));
    c = mix(c, tint, b * uKeys);
  }
  return c;
}
vec3 ocPlain(vec2 p) {
  float down = ocHz - p.y;
  vec3 fc = mix(mix(ocLow, ocMist, .5), ocSun, .5 * exp(-abs(p.x - ocSunAt.x) * 2.4));
  if (down < .004) return mix(ocSky(p), fc, ocUp(.06, 0., -down));
  float z = OC_F * ocH / down;
  vec2 g = vec2(p.x * z / OC_F, z);
  float px = ocPx * z / OC_F, aa = px * (1. + .45 * z);
  vec2 ls = vec2(.2, .98), q = ocValley(g), qn = ocValley(g * (1. - OC_TALL / ocH)), qs = ocValley(g + ls * .35), look = rot(-1.02) * normalize(g), look2 = rot(-1.02) * ls;
  // the rows of trees: seen against what lies behind them, and their shadows
  float tree = 0., treeV = 0., shade = 0., far = length(g);
  int row = 0;
  for (int k = 0; k < 6; k++) {
    // the next row met: the first four by the line of sight, then by the line to the sun
    bool met = false, sun = false;
    float fj = 0., n = 0., sa = 0., sb = 0.;
    vec2 a = vec2(0.);
    for (; row < 8; row++) {
      sun = row > 3;
      int r = row & 3;
      fj = r == 0 ? 3. : r == 1 ? 7. : r == 2 ? -3. : -8.;
      n = r == 0 ? 33. : r == 1 ? 30. : r == 2 ? 40. : 52.;
      a = ocAge(fj); sa = ocBed(q - vec2(a.y, 0.), a.x); sb = ocBed((sun ? qs : qn) - vec2(a.y, 0.), a.x);
      if (sa * sb < 0. || (!sun && min(abs(sa), abs(sb)) < .012)) { met = true; break; }
    }
    row++;
    if (!met) break;
    float d = sat(sa / (sa - sb + (sa > sb ? 1e-4 : -1e-4))), h = OC_TALL * d;
    float s = ocBed((sun ? q : ocValley(g * (1. - h / ocH))) - vec2(a.y, 0.), a.x);
    vec2 m = ocRow(h, sun ? look2 : look, sun ? 1e3 : far, n, ocK * 7. + fj, sun ? .012 : px * .7);
    if (sun) shade = max(shade, m.x * (1. - .6 * d));
    else {
      m.x *= ocIn(abs(s) - .025, .015);
      if (m.x > tree) { tree = m.x; treeV = m.y; }
    }
  }
  // the nine beds, the newest first
  float flood = 4. * uCue * (1. - uCue), age = 20., prev = 0., lines = 0., tone = 0., s0 = 0.;
  float wide = .05 + .022 * uDrone + .05 * flood + (ocWet > 0. ? .06 : .036) * ocWet;
  float n1 = noise(g * 2.3), n2 = noise(g * 9.), n3 = noise(q * vec2(40., 60.)) * sat(1. - aa * 30.);
  for (int j = 0; j < 9; j++) {
    float fj = float(j);
    vec2 a = ocAge(fj);
    float s = ocBed(q - vec2(a.y, 0.), a.x);
    if (j == 0) s0 = s;
    else {
      if (prev * s < 0. && age > 10.) age = fj - 1. + prev / (prev - s);
      float w = .011 + .01 * n2, al = w / (w + aa);
      if (age > 10. || age > fj - .6) {
        float l = ocIn(abs(s) - w, aa + w * .7) * al * (1. - fj / 12.);
        lines = max(lines, l);
        tone += l * (.5 + .5 * cos(TAU * (uLoop - fj / 9.)));
      }
    }
    prev = s;
  }
  // the land
  vec3 c, straw = vec3(.87, .79, .6), sage = vec3(.63, .65, .51), dun = vec3(.7, .6, .48), wet = vec3(.36, .41, .36);
  float inner = s0 * q.y < 0. ? 1. : 0., tint = .5;
  if (age < 10.) {
    tint = mod(floor(age), 2.);
    float id = floor(age) + 1.;
    c = mix(straw, sage, ocUp(.2, .9, fract(id * .37) + .5 * (n1 - .5)));
    c = mix(c, dun, .5 * ocUp(.3, .9, hash11(id)));
    c *= 1. + sat(.06 / (aa + .03) - .3) * (.2 * cos(age * TAU * 2.) + .1 * cos(age * TAU * 5. + 3. * n1));
    c = mix(c, vec3(.93, .86, .7), .9 * ocUp(.85, .1, age + .3 * (n2 - .5)));
  } else {
    vec2 o = g - (q.y > 2.3 ? vec2(5., -2.) : q.y > 0. ? vec2(3.1, 2.2) : q.y > -1.9 ? vec2(-1.5, .4) : vec2(-4., 6.));
    float hh = length(o) + .12 * sin(g.x * 1.3 + g.y) + .05 * (n1 - .5), u = atan(o.y, o.x) * 3., v = hh * 7.;
    vec2 at = vec2(u + .37 * floor(v), v), cell = floor(at), f = at - cell;
    float r = hash11(cell.y + 3.), r2 = hash21(cell);
    c = r < .4 ? mix(straw, dun, r * 2.) : r < .8 ? sage : mix(wet, sage, .6);
    c = mix(c, r2 < .5 ? straw : sage, .45 * r2);
    c *= 1. + .1 * cos(hh * 88.) * sat(1. - aa * 26.);
    tint = step(.45, r2);
    c *= 1. - .3 * ocIn(min(min(f.x, 1. - f.x) * hh / 3., min(f.y, 1. - f.y) / 7.) - .008, aa) * sat(.03 / aa);
  }
  c *= .84 + .22 * n2 + .16 * n3 + .1 * n1;
  c = mix(c, vec3(1.15, .75, .5) * c, .7 * ocGold);
  c = mix(c, vec3(.96, 1., 1.06) * (.72 + .36 * ocGrey(c)), .92 * ocCold);
  c *= .84 + .3 * ocUp(.3, .7, noise(g * .62 + 2. + vec2(uTime * .006, 0.)));
  c = mix(c, wet * .6, lines * .8);
  c = mix(c, vec3(.98, .9, .68), min(.5 * tone * (.3 + 3. * uTexture), .9));
  vec4 snd = piece(vec2(.5 + p.x * .56, .5 - p.y * .95));
  c = mix(c, snd.rgb / max(snd.a, .05) * (.35 + .8 * ocGrey(c)), tint * sat(snd.a) * (.2 + .45 * uEnergy));
  // lakes that were bends
  vec2 lq = vec2(q.x - (2. * floor(q.x * .5) + 1.), abs(q.y));
  if (q.y < 0.) lq.x = q.x - 2. * floor(q.x * .5 + .5);
  lq -= vec2(.08, 1.02);
  float lake = max(length(lq) - .34, .27 - length(lq - vec2(.02, -.1))) + .02 * sin(uTime * .013);
  float dry = max(-ocWet, 0.), bank = min(abs(s0) - wide, lake + .06 * dry), water = max(ocIn(bank, aa), lines * sat(flood * 1.4 + 1.2 * ocWet - .2));
  water = max(water, .95 * ocUp(0., .07, .7 * flood + .5 * max(ocWet, 0.) - .65 * n1 - .3 * n2 - .12 * abs(q.y)));
  c = mix(c, vec3(.9, .83, .68), dry * ocIn(abs(s0) - .085 + .03 * (n2 - .5), .01 + aa));
  c = mix(c, wet * .7, .75 * ocUp(.05, 0., bank + .09 * (n2 - .5)) * (1. - inner * step(abs(s0) - wide, lake)));
  float want = (age < 10. ? .22 : .5) * ocUp(.62, .75, n1) + .6 * ocUp(.13, .03, bank) * (1. - inner) + .2 * lines;
  vec2 sc = z < 7. ? ocScrub(g + .07 * vec2(n2, 3. * n1), 34., want * (1. + ocWood) + .5 * max(ocWood, 0.), aa) : vec2(want * .4, 0.);
  c *= 1. - .5 * max(shade, sc.y);
  c = mix(c, mix(vec3(.27, .3, .2), c * .7, .3) * (.75 + .6 * n3), sc.x * .85);
  c *= ocDay * mix(vec3(1.05, 1., .94), vec3(.84, .87, .95), sat(down * 1.1 - .12));
  // the sky lies in the water
  if (water > 0.) {
    float lane = noise(vec2(q.x * 5., s0 * 30.)), rip = noise(vec2(p.x * 190., p.y * 480. + 60. * sin(uTime * .005)));
    vec2 m = vec2(p.x, ocHz + down * .5);
    vec3 w = mix(ocSky(m), mix(ocTop, ocLow, .3) * .8, .1 + .5 * sat(down * 1.2 - .1)) * (.93 + .14 * lane);
    // a cut bank lies dark in it on the outer side, sand shows through on the inner
    if (bank < .01) w = mix(w, inner > .5 && bank < lake ? vec3(.8, .73, .6) * ocDay : w * .5, ocUp(inner > .5 ? -.03 : -.012 - .014 * n2, .004, bank) * .8);
    w *= 1. - .3 * ocCold;
    float gl = (p.x - ocSunAt.x) / (.07 + .12 * down);
    w = mix(w, ocSun, sat(exp(-gl * gl) * (1.05 + .35 * uPad) * (.6 + .5 * rip + .2 * lane)));
    float hx = q.x + .55 + 1.2 * (1. - uHits), spark = uHits * exp(-hx * hx * 12.) * ocUp(.45, .8, rip);
    w = mix(w, mix(vec3(1., .97, .9), uKind[4], .15), sat(spark * 1.6 + .5 * uCue * lane));
    c = mix(c, w * (1. - .45 * shade), water);
  }
  vec3 bark = mix(vec3(.1, .12, .11), mix(vec3(.34, .3, .18), vec3(.75, .4, .14), ocGold), treeV) * ocDay;
  c = mix(c, bark, tree * ocUp(9., 4.5, z));
  // air and mist
  float fog = 1. - exp(-max(z - 1.3, 0.) * (.09 + .05 * uSpace));
  float mz = noise(g * .55 + vec2(uTime * .012, 0.)) * .6 + noise(g * vec2(1.4, 2.4) - vec2(uTime * .009, 3.)) * .4;
  float belt = exp(-q.y * q.y * .7);
  float lie = (.25 + .45 * belt + .4 * uPad) * ocUp(.42, .72, mz + .12 * belt + .05 * z - .12) * ocUp(1., 2.4, z) * (1. - .7 * treeV);
  c = mix(c, fc, sat(fog + lie - fog * lie));
  return ocBirds(c, p, vec3(.97, .96, .93) * (.4 + .6 * ocGrey(ocDay)));
}
// Bare shrubs along a wall of old bank, at u along it (one shrub to each whole number) and v up; wide is a shrub's room over
// its height and tip how the height changes with its depth. How much twig, and how far out from the root.
vec2 ocTwigs(float u, float v, float seed, float wide, float tip, float off, float soft) {
  vec2 best = vec2(0.);
  for (int i = 0; i < 2; i++) {
    float fi = float(i), x = u + fi * .5, c = floor(x), h1 = hash21(vec2(c, seed + fi * 31.)), h2 = fract(h1 * 57.31);
    float tall = (.45 + .55 * fract(h1 * 13.7)) * ocUp(.14, .2, h2 + .14 * ocWood), du = x - c - .5 - .2 * (h2 - .5);
    vec2 d = vec2(du * wide + off, v + du * tip) / max(tall, .05);
    float r = length(d);
    if (r > 1. || d.y < -.02) continue;
    float a = atan(d.x, d.y + .16) + .12 * sin(r * 7. + h1 * 40.), dome = ocUp(1.35, .9, abs(a));
    float stem = noise(vec2(a * 12. + h2 * 90., r * 1.6)), m = .62;
    if (soft < .9) m = mix(max(ocUp(.5, .66, stem) * ocUp(1., .5, r), (.2 + .8 * ocUp(.4, .66, noise(vec2(a * (20. + 16. * r) + h1 * 70., r * 5.)))) * ocUp(.05, .5, r)), m, soft);
    m = max(m * dome * ocUp(1., .55, r + .25 * (stem - .5)), ocUp(.2, .05, r) * .8) * ocUp(.05, .1, tall);
    m *= ocUp(.5, .34, abs(x - c - .5));
    if (m > best.x) best = vec2(m, r);
    if (m > .8) break;
  }
  return best;
}
// A fan of long shoots from the head of a willow: n of them to a radian, beginning at r0 and len long.
float ocShoots(float a, float r, float n, float r0, float len, float thick) {
  float u = a * n + 1.3 * sin(r * 9. + n) * r, c = floor(u), h = hash11(c + n * 3.), l = len * (.45 + .55 * h), k = (r - r0) / l;
  float d = abs(u - c - .5 + .5 * (h - .5)) * r / n;
  return k < 0. || k > 1. || r < .01 ? 0. : ocIn(d - thick * (1. - k), ocPx);
}
// The old banks as circles: the first four stand round the far side of the lake, the rest are the point it bends about.
vec3 ocBank(int i) {
  float f = float(i);
  return i < 4 ? vec3(.8 + .12 * f, 3.1 + .2 * f, 2.3 + .42 * f) : vec3(ocPoint.xy + vec2(.1, .06) * (f - 4.), ocPoint.z * (1. - .17 * (f - 4.)));
}
vec3 ocLake(vec2 p) {
  float down = ocHz - p.y, up = max(-down, 0.), hoar = max(uOwn[1], 0.), thaw = max(-uOwn[1], 0.);
  vec3 air = mix(mix(ocLow, ocMist, .5), ocSun, (.4 + .2 * uPad) * exp(-abs(p.x - ocSunAt.x) * 2.4));
  vec2 dir = vec2(p.x / OC_F, 1.), ls = normalize(vec2(ocSunAt.x / OC_F, 1.));
  float z = down > .01 ? OC_F * ocH / down : 95. * ocH, A = dot(dir, dir), lenD = sqrt(A);
  vec2 g = dir * z;
  float px = ocPx * z / OC_F, aa = px * (1. + .4 * z);
  vec3 c = vec3(0.), b0 = ocBank(0), b4 = ocBank(4);
  // the rows, the near ones first
  vec3 stand = vec3(0.);
  float left = 1.;
  vec3 osier = mix(mix(vec3(.58, .35, .24), vec3(.62, .64, .22), sat(thaw * 1.5)), vec3(.9, .92, .95), max(.85 * hoar, .5 * uTexture));
  vec3 foot = mix(vec3(.22, .18, .2), vec3(.6, .63, .7), .7 * hoar);
  int i = 14;
  for (int k = 0; k < 8; k++) {
    // the next wall of shrubs this line of sight meets
    bool met = false;
    int id = 0;
    vec3 b = b0;
    float t = 0., y = 0., hm = 0., ds = 0.;
    for (; i >= 0; i--) {
      id = i == 14 ? 0 : i < 4 ? 3 - i : i < 9 ? i : 17 - i;
      b = ocBank(id); hm = (i > 13 ? .22 : id < 4 ? .36 : .3) * (1. + .45 * ocWood);
      float B = dot(dir, b.xy);
      ds = B * B - A * (dot(b.xy, b.xy) - b.z * b.z);
      t = (B + (i < 9 ? 1. : -1.) * sqrt(max(ds, 0.))) / A; y = ocH - t * down / OC_F;
      if (ds > -.7 * A && t > .4 && y > -.01 && y < hm) { met = true; break; }
    }
    i--;
    if (!met) break;
    float rank = float(id < 4 ? 3 - id : id) / 9.;
    vec2 h = dir * t - b.xy, e = h / b.z;
    float n = floor((id < 4 ? 2.3 + .42 * float(id) : 1.6 - .272 * float(id - 4)) * 24.), l = TAU * b.z / n, ang = atan(h.y, h.x) / TAU + .5, off = ds < 0. ? length(h) - b.z : 0.;
    if (off > .4 * hm) continue;
    float turn = abs(dot(e, dir)) / lenD, deep = dot(vec2(-e.y, e.x), dir) / A;
    vec2 m = ocTwigs(ang * n, y / hm, float(id) * 13., l * (turn + .2) / hm * 1.1, l * deep * down / OC_F / hm, off / hm, ocPx * t * 14.);
    m.x *= ocUp(.4, .2, off / hm);
    if (m.x < .01) continue;
    float run = uCue * ocHump((rank - 1. + uCue) * 2.83), lit = .3 * (.5 + .5 * cos(TAU * (uLoop - rank))) + .5 * band(abs(fract(ang * 2.) * 2. - 1.)) + run;
    vec3 tc = mix(foot, osier, ocUp(.1, .8, m.y));
    vec4 snd = piece(vec2(.5 + p.x * .56, .12 + .76 * (1. - t / 7.)));
    tc = mix(tc, snd.rgb / max(snd.a, .05) * .8, sat(snd.a) * (.4 + .6 * uEnergy)) + osier * lit * (.15 + .4 * uEnergy) * m.y;
    tc = mix(tc, ocSun, sat(.6 * exp(-abs(p.x - ocSunAt.x) * 3.) + run) * m.y) * ocDay;
    tc = mix(tc, air, 1. - exp(-max(t - 1.5, 0.) * .13));
    m.x *= left * (1. - .5 * (id < 4 ? float(id) / 4. : float(id - 4) / 5.)) * ocUp(-1., -.6, ocWood);
    stand += tc * m.x; left -= m.x;
    if (left < .08) break;
  }
  if (down <= .02 && left > .08) {
    // sky, and far woods
    c = mix(ocSky(p), air, ocUp(.09, 0., up));
    float wood = .008 + .016 * noise(vec2(p.x * 5., 3.)) + .001 * sin(p.x * 90.);
    c = mix(c, mix(air, ocTop * .8, .5), .6 * ocIn(up - wood, .003) * ocUp(-.02, .004, -down));
  }
  if (down > .01 && left > .08) {
    float n1 = noise(g * 1.2), n2 = noise(g * 5. + 3.), n3 = noise(g * 31.);
    float level = .16 - .03 * sin(uTime * .017) - (ocWet > 0. ? .3 : .34) * ocWet;
    float bank = max(length(g - b0.xy) - b0.z + level, b4.z + level - length(g - b4.xy)) + .12 * (n1 - .5) + .03 * (n2 - .5), ice = ocIn(bank, aa);
    vec3 snow = mix(vec3(.58, .65, .8), vec3(.95, .92, .9), sat(.42 + .5 * n1 + .3 * (n2 - .5) + .14 * (n3 - .5)));
    vec3 grass = mix(vec3(.42, .45, .27), vec3(.72, .66, .45), sat(n2 * .7 + n3 * .4));
    snow = mix(snow, grass, ocUp(.25, .6, thaw * 1.4 + .5 * (n1 - .6) + .25 * (n2 - .5)));
    // the rows throw their shadows along the snow, towards us
    float sh = 0.;
    if (z < 8.) for (int i = 0; i < 9; i++) {
      vec3 b = ocBank(i);
      vec2 o = g - b.xy;
      float bb = dot(o, ls), ds = bb * bb - dot(o, o) + b.z * b.z;
      if (ds < 0.) continue;
      float root = sqrt(ds), t = -bb - root > 0. ? -bb - root : root - bb, v = t * 1.5;
      if (t < 0. || v > 1.) continue;
      vec2 h = o + ls * t;
      sh = max(sh, (1. - v) * ocUp(0., .07, t) * ocUp(.25, .75, noise(vec2(atan(h.y, h.x) * b.z * 19., float(i) * 9. + v * 1.5))) * (i < 4 ? 1. : 1.1 - .14 * float(i - 4)));
    }
    sh *= sat(1. + ocWood);
    c = snow * mix(vec3(1.), vec3(.6, .67, .86), sh * .8);
    c += (.1 + .9 * uTexture) * ocUp(.93, 1., hash21(floor(g * 240.))) * sat(1. - aa * 60.) * (.5 + .5 * sin(uTime * .7 + 40. * n2));
    if (ice > 0.) {
      vec3 w = mix(vec3(.3, .4, .46), mix(mix(ocLow, ocTop, sat(.2 + down)), ocTop * .6, .2 + .3 * sat(down)), .55);
      w *= mix(1.05, .66, ocUp(.3, .6, n1 * .7 + n2 * .3)) + .07 * sin(bank * 24. + 6. * n1);
      // a few long cracks, drifts of snow
      float frozen = 1. - ocUp(.1, .7, thaw);
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 k = rot(.5 + fi * 1.9) * (g - vec2(-.1 + .3 * fi, 1.7 + .5 * fi));
        float d = abs(k.y + .05 * sin(k.x * 4.1 + fi * 3.) + .02 * sin(k.x * 13. + 3. * n2) + .03 * n2), run = ocHump((k.x + .5 - 1.3 * (1. - uHits)) * 1.41) * uHits * (i == 1 ? 1. : 0.);
        w = mix(w, mix(vec3(.96), uKind[4], .45 * run), frozen * sat((.75 + 2. * run) * ocIn(d - .005, .005 + aa) * .005 / (.005 + aa) + (.14 + .8 * run) * exp(-d * 30.)) * ocUp(1.6, .6, abs(k.x - .3)));
      }
      float drift = frozen * ocUp(.58, .76, noise(rot(.6) * g * vec2(1.1, 4.5)) * .7 + .3 * n2 + .4 * ocUp(-.35, 0., bank) + .35 * hoar);
      w = mix(w, snow, max(drift * .85, ocUp(-.05, -.01, bank)));
      float gl = (p.x - ocSunAt.x) / (.09 + .2 * down);
      w = mix(w, ocSun, (.6 + .2 * uDrone + .3 * uPad) * exp(-gl * gl) * (.4 + .7 * n2) * (1. - .5 * drift));
      c = mix(c, w * mix(vec3(1.), vec3(.75, .8, .93), sh * .7), ice);
    }
    // one thread of fox tracks
    float fx = -.62 + .34 * (g.y - 1.) + .1 * sin(g.y * 2.1), st = g.y / .06, k = floor(st);
    vec2 f = vec2((g.x - fx) + (mod(k, 2.) - .5) * .016, (st - k - .5) * .06);
    c = mix(c, c * vec3(.42, .48, .6), .9 * (1. - sat(thaw * 2.)) * ocIn(length(f * vec2(1., .8)) - .009, aa * .5) * sat(.018 / (aa + .01)) * ocUp(7., 5., g.y));
    c *= ocDay;
    float mz = noise(g * vec2(.7, 1.6) + vec2(uTime * .02, 0.)) * .8 + .2 * n2;
    c = mix(c, air, max(1. - exp(-max(z - 1.5, 0.) * (.06 + .04 * uSpace)), (.2 + .5 * uDrone) * ice * ocUp(.4, .75, mz)));
  }
  c = stand + c * left;
  // the near willow
  vec2 w = p - vec2(-clamp(.5 * uRes.x / uRes.y, .28, .89) + .06, -.03);
  if (w.x < .55) {
    float trunk = abs(w.x + .02 * sin(w.y * 9.) + .05 * w.y) - .038 - .034 * exp(-(w.y + .02) * (w.y + .02) * 260.) - .02 * ocUp(-.3, -.5, w.y);
    float wood = ocIn(max(trunk, w.y - .03), ocPx), a = atan(w.x, w.y + .06001), r = length(w + vec2(0., .06));
    a -= uPhrase * .06 * r * sin(uTime * .9 + r * 3.);
    if (w.y > -.1 && abs(a) < 1.35) wood = max(wood, max(max(ocShoots(a, r, 4.5, .02, .6, .011), ocShoots(a + .1, r, 8., .1, .5, .0045)), max(ocShoots(a, r, 17., .2, .36, .0024), ocShoots(a - .02, r, 29., .25, .28, .0016))));
    vec3 bark = mix(vec3(.12, .11, .13), mix(vec3(.45, .28, .18), osier, .5 * ocUp(.1, .5, r)), sat(w.x * 9. + .2)) * (.8 + .4 * noise(w * vec2(90., 20.)));
    bark = mix(bark, vec3(.85, .88, .93), hoar * .6 * ocUp(.1, .4, w.y));
    c = mix(c, bark * ocDay, wood);
    // a hit shakes snow down out of it
    vec2 f = w - vec2(.13, .2 - .22 * (1. - uHits));
    c = mix(c, vec3(.97) * ocDay, uHits * exp(-dot(f * vec2(1.4, 1.), f) * 45.) * ocUp(.45, .75, noise(w * vec2(120., 80.) + vec2(0., 9. * (1. - uHits))) * .8 + .1));
  }
  return ocBirds(c, p, vec3(.16, .15, .18));
}
void ocWorld() {
  ocPx = 1. / uRes.y; ocHour = uOwn[0]; ocCold = max(-uOwn[1], 0.); ocGold = max(uOwn[1], 0.);
  ocWet = uOwn[2]; ocWood = uOwn[3]; ocForm = uOwn[4]; ocHigh = uOwn[5];
  bool b = uVar > .5;
  ocHz = (b ? .37 : .35) + .5 * max(ocHigh, 0.) + .16 * min(ocHigh, 0.); ocH = 1. + 1.1 * max(ocHigh, 0.) + .4 * min(ocHigh, 0.);
  ocBend = .24 * uPhrase;
  ocPoint = vec3(1.85, 3.45, 1.6) + (ocForm > 0. ? vec3(-.2, -.1, .22) * ocForm : vec3(.55, .25, .95) * ocForm);
  ocSunAt = vec2(b ? -.14 : .14, ocHz + .06 + .25 * max(ocHour, 0.) * (b ? 0. : 1.));
  ocTop = ocBy(vec3(.05, .08, .17), b ? vec3(.46, .56, .74) : vec3(.5, .61, .72), b ? vec3(.3, .27, .46) : vec3(.34, .54, .78), ocHour);
  ocLow = ocBy(vec3(.2, .25, .36), b ? vec3(.91, .82, .81) : vec3(.96, .84, .74), b ? vec3(.93, .55, .4) : vec3(.84, .91, .95), ocHour);
  ocSun = ocBy(vec3(.8, .87, 1.), b ? vec3(1., .88, .7) : vec3(1., .88, .64), b ? vec3(1., .62, .34) : vec3(1., .98, .92), ocHour);
  ocMist = ocBy(vec3(.26, .32, .44), b ? vec3(.9, .9, .93) : vec3(.93, .89, .84), b ? vec3(.7, .47, .5) : vec3(.92, .95, .97), ocHour);
  ocDay = ocBy(vec3(.22, .29, .44), b ? vec3(.98, .96, .95) : vec3(.95, .89, .8), b ? vec3(.86, .62, .62) : vec3(1.06), ocHour);
}
vec3 render(vec2 p) {
  ocWorld();
  vec3 c = sat(uVar < .5 ? ocPlain(p) : ocLake(p));
  return sat(mix(c, c * c * (3. - 2. * c), .12 + .2 * uTone));
}
