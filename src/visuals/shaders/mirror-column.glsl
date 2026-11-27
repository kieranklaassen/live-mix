// name: Mirror column
// a: Round column
// b: Pointed cone
// what: A curved smear of paint on a sheet on a sunlit table, and in the polished column standing in it the smear is a pear tree on a hill, a boat and two birds. Or, from nearly overhead, a ring of red and black petals turned inside out, which closes in a mirror cone into a pond with one long fish.
// follows: The drone raises the hill or deepens the pond, the pad fills the crown, texture stirs leaves or scales, the phrase moves boat or fish. The bands are branches or petals, the piece washes into sky and water, the loop swings the sun. A hit drops a pear or rings the water; a cue steps our view aside; keys are berries, a voice warms the light.
// own: 0 moonlight at -1, low evening sun at 1; 1 dark slate paper at -1, brown paper on a red table at 1; 2 winter at -1 (bare tree, snow, blue petals), autumn at 1 (rust leaves, gold petals); 3 closer at -1, farther off at 1; 4 a short column or blunt cone with a small or wide smear at -1, a tall or steep one at 1; 5 dark steel at -1, copper at 1
bool mcB;              // the cone
float mcH, mcT;        // the column's height, the cone's steepness (both are 1 round the foot)
float mcD, mcE;        // the eye the painting is made for: how far off, how high
vec3 mcSun; vec2 mcS;  // towards the sun, and the same along the table
float mcG, mcWin, mcAut, mcDark;
vec3 mcC;              // the colour under the brush

float mcSq(float x) { return x * x; }
float mcBell(float x) { return exp(-x * x); }
float mcLine(vec2 p, vec2 a, vec2 b) { vec2 d = b - a, o = p - a; return length(o - d * sat(dot(o, d) / max(dot(d, d), 1e-5))); }
// A pigment turned towards a kind's colour, as light as it was.
vec3 mcInk(vec3 c, int k, float m) { vec3 u = uKind[k] + .1, w = vec3(.3, .59, .11); return mix(c, u * (dot(c, w) + .1) / (dot(u, w) + .05), sat(m)); }
vec3 mcWash(vec3 c, vec4 m) { return mix(c, (.2 + .8 * c) * (.3 + .7 * m.rgb / max(max(m.r, max(m.g, m.b)), .05)), sat(m.a * .6 * mcG)); }
// One flat of gouache: its edge follows the pixel, its rim holds a little more pigment.
void mcLay(float d, vec3 col, float soft, float op) {
  float w = min(fwidth(d), .05) * .75 + soft + 1e-4;
  float a = (1. - smoothstep(-w, w, d)) * op;
  col *= 1. - .16 * exp(min(d, 0.) * 40.) * (1. - smoothstep(0., .03, soft));
  mcC = mix(mcC, col, a);
}
void mcLay(float d, vec3 col) { mcLay(d, col, 0., 1.); }
// The painting as the round column shows it: x across the metal -1 to 1, y up it.
vec3 mcTree(vec2 q, vec3 paper) {
  mcC = paper;
  float br = noise(vec2(q.x * 2.3 + 4., q.y * 30.)), bg = noise(q * vec2(3., 5.) + 11.);
  float edge = max(abs(q.x + .02) - .88 - .05 * noise(vec2(q.y * 2.2, 3.)), q.y - 2.95 + .16 * noise(vec2(q.x * 5., 2.)));
  float in0 = 1. - smoothstep(-.012, .012, edge);
  // sky, with what sounds in the piece washed into it
  vec3 sky = mix(vec3(.94, .66, .43), vec3(.22, .47, .64), smoothstep(.7, 2.4, q.y + .3 * (bg - .5)));
  sky = mix(sky, vec3(.63, .66, .7), .55 * mcWin); sky = mix(sky, vec3(.93, .74, .5), .45 * mcAut);
  sky = mcWash(sky, piece(vec2(.5 + .52 * q.x, 1. - sat((q.y - .5) / 1.9))));
  mcLay(-.3, sky * (.93 + .12 * br), 0., .94);
  // one cloud going by
  float cx = fract(uTravel * .011 + uTime * .004 + .3), cf = smoothstep(0., .15, cx) * (1. - smoothstep(.85, 1., cx));
  vec2 k = q - vec2(1.3 - 2.6 * cx, 2.03);
  float cl = smin(smin(length(k * vec2(1., 1.5)) - .19, length((k - vec2(.24, -.06)) * vec2(1., 1.7)) - .15, .08), length((k + vec2(.26, .07)) * vec2(1., 1.9)) - .15, .08);
  mcLay(cl + .04 * (bg - .5), vec3(.97, .94, .89), .004, cf * .95);
  // far shore, hill, water
  mcLay(q.y - .72 - .1 * sin(q.x * 2.6 + 2.2), vec3(.5, .58, .62), .004, .9);
  float tx = .14, top = .7 + .26 * uDrone * mcG, hill = .34 + (top - .34) * exp(-mcSq(q.x - tx) * 2.1);
  vec3 grass = mix(vec3(.72, .6, .25), vec3(.43, .5, .2), smoothstep(-.25, 0., q.y - hill + .15 * bg));
  grass = mix(grass, vec3(.9, .91, .92), .85 * mcWin); grass = mix(grass, vec3(.72, .46, .18), .6 * mcAut);
  mcLay(q.y - hill, mcInk(grass, 0, .3 * uDrone * mcG) * (.88 + .2 * br));
  vec3 lake = mix(vec3(.1, .28, .44), vec3(.2, .5, .6), smoothstep(0., .35, q.y));
  lake += .2 * smoothstep(.55, .9, sin(q.y * 60. + 2. * sin(q.x * 5. + uTime * .3))) * (.15 + .6 * uMic);
  mcLay(q.y - .335 - .012 * sin(q.x * 7. + 1.), lake * (.9 + .2 * br));
  // the pear tree
  vec2 t = q - vec2(tx, top - .03);
  float fill = .86 + .2 * uPad * mcG;
  vec3 bark = vec3(.21, .12, .09);
  float trunk = max(abs(t.x - .03 * sin(t.y * 5.)) - .045 - .04 * exp(-max(t.y, 0.) * 12.), max(-t.y, t.y - .95));
  vec2 g = (t - vec2(0., .66)) / fill;
  float wide = .48 - .3 * smoothstep(-.25, .7, g.y);
  float crown = smin(length(g * vec2(1., 1.1)) - .44, length(g - vec2(.03, .48)) - .23, .22);
  float stir = sat(uTexture * mcG), leaf = noise(q * 13. + vec2(.4 * sin(uTime * .5 + q.y * 5.), .3 * sin(uTime * .37 + q.x * 6.)) * (.4 + 1.6 * stir));
  crown += (leaf - .5) * (.07 + .1 * stir);
  vec3 gr = mix(vec3(.16, .33, .15), vec3(.5, .58, .16), smoothstep(-.25, .4, g.x * mcS.x + .7 * g.y + .5 * (leaf - .5)));
  gr = mix(gr, vec3(.72, .24, .1) * (.8 + .5 * leaf), .85 * mcAut);
  mcLay(trunk, bark);
  mcLay(crown, mcInk(gr, 1, .22 * uPad * mcG), 0., 1. - .96 * mcWin);
  // sixteen branches, one for each band
  float by = (t.y - .36 - .75 * abs(t.x) - .12 * (leaf - .5)) / .105, bi = clamp(floor(by), 0., 7.), bf = by - bi - .5;
  float bv = uBands[int(bi) * 2 + (t.x > 0. ? 1 : 0)] * mcG;
  float len = (.12 + .3 * sat(bv * 1.3) + .12 * mcWin) * (1. - .07 * bi);
  mcLay(max(abs(bf) * .084 - .017 * (1. - abs(t.x) / max(len, .02)), abs(t.x) - len), mix(bark, uKind[2] * .5, .35 * sat(bv)), 0., (.55 + .3 * mcWin) * step(abs(by - 4.), 4.));
  // pears, and the berries of the keys
  vec2 gi = floor(t * vec2(5., 4.6)), gf = t * vec2(5., 4.6) - gi - .5; vec2 gh = hash22(gi + 5.3);
  gf -= (gh - .5) * .4;
  float pear = smin(length(gf) - .15, length(gf - vec2(0., .19)) - .07, .1) * .2;
  float hang = step(.3, gh.x) * smoothstep(.03, .12, -crown);
  mcLay(pear, mix(vec3(.95, .73, .2), vec3(.85, .3, .12), .6 * mcAut), 0., hang * (1. - mcWin));
  mcLay(length(gf + vec2(.3, .26)) * .2 - .03, mcInk(vec3(.8, .16, .12), 3, .3), 0., sat(uKeys * 1.5) * smoothstep(0., .06, -crown));
  // the boat
  vec2 b = q - vec2(-.44 + .1 * sin(uTime * .043) + .22 * uPhrase * mcG, .2);
  float hull = max(abs(b.x) - .2 + 12. * mcSq(min(b.y - .02, 0.)), abs(b.y) - .042 - .5 * b.x * b.x);
  vec2 s = b - vec2(0., .07);
  float sail = max(-s.y, s.y - .36 + (s.x > 0. ? 2.2 : -1.5) * s.x);
  mcLay(sail * .5, mcInk(vec3(.95, .9, .78), 3, .6 * uPhrase * mcG));
  mcLay(hull, vec3(.62, .17, .1));
  // two birds
  for (int i = 0; i < 2; i++) {
    float f = float(i);
    vec2 w = q - vec2(-.5 + .2 * f + .05 * sin(uTime * .11 + f), 1.5 + .22 * f + .03 * sin(uTime * .17 + 2. * f));
    float ax = abs(w.x);
    mcLay(max(abs(w.y - .5 * ax + 2.6 * ax * ax) - .018 * (1. - ax / .13), ax - .125), vec3(.14, .13, .17));
  }
  // a pear let go, and its streak
  float y1 = top + .75, y0 = mix(.16, y1 - .15, uHits * (.6 + .4 * uHits));
  vec2 f = q - vec2(tx - .34, 0.);
  float fall = min(mcLine(f, vec2(0., y0), vec2(0., y1)) - .04, smin(length(f - vec2(0., y0)) - .11, length(f - vec2(0., y0 + .13)) - .055, .06));
  mcLay(fall, mcInk(vec3(.98, .78, .16), 4, .45), 0., uHits);
  return mix(paper, mcC, in0);
}
// The painting as the cone shows it: a round pond.
vec3 mcPond(vec2 q, vec3 paper) {
  mcC = paper;
  float r = length(q), th = atan(q.y, q.x + 1e-5);
  vec2 u = q / max(r, 1e-3);
  float br = noise(vec2(r * 26., 3.) + u * 2.2), bg = noise(q * 4. + 11.);
  vec3 wat = mix(vec3(.62, .74, .66), vec3(.9, .88, .76), smoothstep(.25, .95, r + .25 * (bg - .5)));
  wat = mix(wat, vec3(.55, .66, .78), .6 * mcWin); wat = mix(wat, vec3(.85, .68, .4), .55 * mcAut);
  wat = mcInk(mcWash(wat, piece(.5 + .48 * q)), 1, .3 * uPad * mcG);
  mcLay(r - .97 + .05 * bg, wat * (.92 + .13 * br), 0., .95);
  // the drone's dark pool
  mcLay(length(q - vec2(-.12, .1)) - .36 - .2 * uDrone * mcG + .06 * bg, mcInk(vec3(.1, .3, .32), 0, .35), .02, .72);
  // sixteen leaves at the brim, one for each band
  float n = (th / TAU + .5) * 16., ni = min(floor(n), 15.), nf = n - ni - .5, hh = hash11(ni + 3.);
  float bv = uBands[int(ni)] * mcG, deep = .17 + .3 * hh + .25 * sat(bv);
  float v = (.99 - r) / deep, lw = .4 * sin(PI * sat(.2 + .8 * v)) * (1. - .35 * v);
  float lean = nf - (hh - .5) * .5 * v;
  bool ink = mod(ni, 3.) < .5;
  vec3 pet = ink ? mix(vec3(.1, .09, .11), vec3(.13, .18, .33), mcAut + mcWin) : mix(mix(vec3(.72, .13, .09), vec3(.8, .52, .12), mcAut), vec3(.35, .5, .7), mcWin);

  mcLay(max((abs(lean) - lw) * .3 * r, (v - 1.) * deep), mix(pet, kindColour(ni / 4.) * .8, .25 * sat(bv)) * (.85 + .25 * br), 0., step(.16, hh));
  mcLay(abs(lean) * .3 * r - .004, pet * 1.5 + .12, .002, .7 * step(.16, hh) * step(v, .8));
  // the fish: three curves, going round
  float go = uTravel * .035 + uTime * .02;
  float al = (mod(th - go + PI, TAU) - PI) / 1.6; // -1 tail, 1 nose
  float sp = .5 + (.085 + .03 * uPhrase) * sin(al * 3.6 - uTime * .5);
  float e = r - sp;
  float body = .175 * sqrt(sat(1. - al)) * smoothstep(-1.15, .5, al) + .018 * step(al, .6);
  float tl = sat((-.62 - al) / .45);
  float tail = max(abs(e) - .02 - .15 * tl * (1. - .3 * tl), max(al + .66, -al - .9 - 1.3 * abs(e)) * .6);
  float fish = min(max(abs(e) - body, max(al - .95, -al - .8) * .5), tail);
  float fin = max(abs(e) - body - .11 * mcBell((al - .3) / .12), abs(al - .2) - .35);
  float stir = sat(uTexture * mcG);
  vec3 red = mcInk(vec3(.86, .22, .08), 3, .18 * uPhrase * mcG);
  mcLay(fish - .02, vec3(.1, .25, .27), .03, .4);
  mcLay(fin, red * 1.05 + vec3(.06, .1, .08), 0., .9);
  mcLay(fish, vec3(.96, .93, .86));
  float patchy = noise(vec2(al * 3.4 + 2., e * 6. + 3.));
  mcLay(max(fish, .12 * (.42 - patchy)), red, .002, 1.);
  mcLay(max(fish, .14 * (patchy - .31)), vec3(.1, .09, .1), .002, 1.);
  vec2 sc = vec2(al * 13., e * 24.); sc.x += .5 * mod(floor(sc.y), 2.); sc = fract(sc) - vec2(.2, .5);
  mcLay(max(abs(length(sc) - .5) * .03 - .0022, fish + .012), vec3(.3, .08, .05), .001, .12 + .4 * stir);
  mcLay(length(vec2((al - .82) * .6, abs(e) - .045)) - .016, vec3(.06));
  // berries for the keys, a ripple for the hit
  mcLay(length(fract(q * 5.) - .5) * .2 - .028, mcInk(vec3(.95, .75, .25), 3, .3), 0., sat(uKeys * 1.5) * step(.6, hash21(floor(q * 5.))) * step(r, .85));
  float rip = length(q - vec2(.25, -.3)) - .07 - .5 * (1. - uHits);
  mcLay(abs(rip) - .025, mcInk(vec3(.98, .85, .4), 4, .5), .004, uHits);
  return mix(paper, mcC, 1. - smoothstep(.93, 1., r));
}
// From a place on the table back to the painting, for the one eye it is made for.
vec2 mcUnroll(vec2 P) {
  float rho = length(P);
  if (mcB) {
    float s = sqrt(1. + mcT * mcT);
    vec2 nn = vec2(mcT, 1.) / s;
    float d = (mcE - mcT) / s, dr = mcT * (rho - 1.) / s;
    vec2 e = vec2(0., mcE) - 2. * d * nn;
    float k = d / max(d + dr, 1e-3), r = e.x + k * (rho - e.x), z = e.y * (1. - k);
    float seen = r * mcE / max(mcE - z, .1);
    return P / max(rho, 1e-3) * (rho < 1. ? 1.2 : max(seen, 0.));
  }
  rho = max(rho, 1.);
  float ph = atan(P.x, -P.y + 1e-5), t = ph * (.5 + .5 / rho), a = 0.;
  for (int i = 0; i < 5; i++) {
    float c = cos(t), sn = sin(t);
    a = atan(sn, mcD - c);
    float da = (mcD * c - 1.) / (mcD * mcD + 1. - 2. * mcD * c);
    float df = rho * cos(2. * t + a - ph) * (2. + da) - cos(t + a) * (1. + da);
    t -= clamp((rho * sin(2. * t + a - ph) - sin(t + a)) / max(df, .3), -.4, .4);
    t = clamp(t, -1.7, 1.7);
  }
  float L = max(rho * cos(2. * t + a - ph) - cos(t + a), 0.), d1 = sqrt(mcD * mcD + 1. - 2. * mcD * cos(t));
  return vec2(abs(t) > 1.45 ? sign(t) * 1.3 : sin(t), .95 * mcE * L / (d1 + L) * 2.75 / mcH);
}
// How much sun comes to a place on the table past the mirror.
float mcShade(vec2 P) {
  float al = dot(P, mcS), pe = abs(dot(P, vec2(-mcS.y, mcS.x))), tn = mcSun.y / max(length(mcSun.xz), .05);
  float soft = mix(.5, 1.6, 1. - uTone);
  if (mcB) {
    float tip = mcT / tn, sn = 1. / max(tip, 1.05), w = soft * (.02 + .06 * max(-al, 0.));
    float d = max(pe * sqrt(1. - sn * sn) - (tip + al) * sn, al + sn);
    return smoothstep(-w, w, d);
  }
  float u = -al - sqrt(max(1. - pe * pe, 0.)), w = soft * (.02 + .035 * max(u, 0.));
  return 1. - (1. - smoothstep(1. - w, 1. + w, pe)) * (1. - smoothstep(mcH - 2. * w, mcH + 2. * w, u * tn)) * smoothstep(-.3, .1, u);
}
// The fan of light the column throws back.
float mcFan(vec2 P) {
  vec2 q = vec2(dot(P, vec2(mcS.y, -mcS.x)), dot(P, mcS));
  float rho = max(length(q), 1.), ph = atan(q.x, q.y + 1e-5), t = ph * (.5 + .5 / rho);
  for (int i = 0; i < 3; i++) {
    float df = 2. * rho * cos(2. * t - ph) - cos(t);
    t = clamp(t - clamp((rho * sin(2. * t - ph) - sin(t)) / max(df, .3), -.4, .4), -1.6, 1.6);
  }
  float L = max(rho * cos(2. * t - ph) - cos(t), 0.), h = L * mcSun.y / max(length(mcSun.xz), .05);
  float lines = .7 + .35 * sin(t * 31. + 1.5 * sin(t * 13.)) + .25 * sin(t * 73.);
  float top = mcH * (1. - .02 * sin(t * 9.));
  return max(cos(t), 0.) / (max(cos(t), .02) + 1.1 * L) * mix(1., lines, sat(L * .7)) * (1. - smoothstep(top - .16, top + .05, h)) * (1. + .8 * mcBell((h - top + .1) / .1));
}
// The table, its sheet and what lies on it, lit.
vec3 mcTable(vec2 P, float metal) {
  float rho = length(P), n1 = noise(P * 7.), tooth = noise(P * 41.) * .5 + noise(P.yx * 67. + 5.) * .5;
  float back = P.y - (mcB ? 2.45 : 2.5) - .16 * P.x * (mcB ? -1. : 1.) - .02 * noise(P * 3.);
  if (mcB) back = max(back, -P.x - 2.75 - .1 * P.y);
  if (mcB) back -= 60. * metal; // the cone shows only the painted ring
  float pw = min(fwidth(back), .2) + .008, on = 1. - smoothstep(-pw, pw, back);
  vec3 sheet = mix(vec3(.94, .915, .86), vec3(.13, .15, .2), mcDark);
  float kraft = max(uOwn[1], 0.);
  sheet = mix(sheet, vec3(.72, .52, .34), kraft);
  sheet *= .97 + .07 * tooth;
  vec2 q = mcUnroll(P + .014 * (vec2(n1, noise(P.yx * 7. + 3.)) - .5));
  vec3 paint = mcB ? mcPond(q, sheet) : mcTree(q, sheet);
  float rw = .5 * mcT * mcT / max(.25 * (mcT * mcT - 1.), .1) + .34 + .3 * max(-uOwn[4], 0.) + .12 * noise(P * 1.7) + .05 * noise(P * 9.);
  if (mcB) paint = mix(paint, sheet, smoothstep(-.02, .02, rho - rw) * (1. - metal));
  paint = mix(paint, paint * (sheet * .8 + .15), .7 * max(kraft, .5 * mcDark));
  paint = mix(paint, sheet, (.02 + .2 * tooth * tooth) * (1. - .6 * metal));
  // the table: planed wood with the grain running away
  vec2 wq = P * vec2(.55, 5.) + 3. * noise(P * .5);
  vec3 wood = mix(vec3(.47, .35, .25), vec3(.66, .52, .38), noise(wq) * .7 + .3 * noise(wq * vec2(2., 5.)));
  wood = mix(wood, vec3(.17, .19, .24) * (.8 + .4 * noise(wq)), mcDark * .8);
  wood = mix(wood, vec3(.36, .13, .09) * (.8 + .4 * noise(wq)), .8 * kraft);
  wood *= 1. - .45 * exp(-max(back, 0.) * 7.);
  vec3 c = mix(wood, paint, on);
  // a brush laid down across the corner
  vec2 a = mcB ? vec2(2.2, -1.7) : vec2(-4.6, 1.2), b = mcB ? vec2(3.6, .5) : vec2(-2.5, 2.9), dir = normalize(b - a);
  float bd = dot(P - a, vec2(-dir.y, dir.x)), bk = dot(P - a, dir) / length(b - a), bw = mix(.035, .075, sat(bk * 1.3)) * (1. - .95 * smoothstep(.85, 1., bk));
  c *= 1. - .45 * (1. - smoothstep(.02, .14, mcLine(P + mcS * .14, a, b) - .02)) * (mcB ? 1. - metal : 1.);
  float bcov = (1. - smoothstep(bw - .015, bw + .015, abs(bd))) * step(0., bk) * step(bk, 1.) * (mcB ? 1. - metal : 1.);
  vec3 bc = bk < .62 ? vec3(.3, .1, .07) : bk < .8 ? vec3(.76, .72, .6) : vec3(.16, .13, .12);
  c = mix(c, bc * (.7 + .6 * mcBell((bd - bw * .3) / .025)), bcov);
  // light
  float sh = mcShade(P);
  float night = max(-uOwn[0], 0.), eve = max(uOwn[0], 0.);
  vec3 sun = mix(mix(vec3(1., .92, .78), vec3(1.05, .66, .36), eve), vec3(.42, .54, .78), night) * (.86 + .14 * uLevel + .12 * uMic);
  vec3 amb = mix(mix(vec3(.3, .34, .42), vec3(.25, .24, .36), eve), vec3(.09, .12, .22), night);
  float pool = .62 + .38 * exp(-dot(P - mcS * .8, P - mcS * .8) * .045);
  vec3 light = sun * .95 * sh * pool + amb * (.68 + .25 * sh) * (1. - .45 * exp(-max(rho - 1., 0.) * 5.));
  if (!mcB) light += sun * mcFan(P) * (.5 + .7 * uCue + .2 * uMic) * smoothstep(-.2, .5, dot(P, mcS) + .6);
  float ring = uHits * mcBell((rho - 1.05 - 3.2 * (1. - uHits)) / .2);
  light += sun * mix(vec3(1.), uKind[4], .5) * ring * mcG * .7;
  return c * light;
}
vec3 render(vec2 p) {
  mcB = uVar > .5;
  mcG = .35 + 1.4 * uEnergy;
  mcWin = max(-uOwn[2], 0.); mcAut = max(uOwn[2], 0.); mcDark = max(-uOwn[1], 0.);
  mcH = 2.75 * (1. + .2 * uOwn[4]); mcT = 2.2 + .5 * uOwn[4];
  float el = (mcB ? .86 : .6) - .22 * max(uOwn[0], 0.) + .05 * cos(TAU * uLoop);
  float az = (mcB ? 2.45 : 1.95) + .16 * sin(TAU * uLoop) + .08 * sin(uTime * .021);
  mcS = vec2(sin(az), cos(az));
  mcSun = vec3(mcS.x * cos(el), sin(el), mcS.y * cos(el));
  float asp = uRes.x / uRes.y, zoom = mix(1.06, .95, uSpace) * (1. - .2 * uOwn[3]);
  zoom *= mix(mcB ? .78 : .82, 1., smoothstep(.5, 1.4, asp));
  float aside = 4. * uCue * (1. - uCue);
  float wide = smoothstep(.6, 1.6, asp), foc;
  vec3 ro, fw, rt, up; vec2 at;
  if (mcB) {
    mcE = 9.;
    ro = vec3(-.9 * aside, mcE, -.1);
    fw = normalize(-ro); foc = mcE / 3.3 * zoom;
    at = vec2(.17 * wide, .035);
    rt = vec3(1., 0., 0.); up = normalize(cross(fw, rt)); rt = cross(up, fw);
  } else {
    mcD = 12.; mcE = 8.2;
    vec3 ta = vec3(0., mcH * .5, 0.);
    ro = vec3(0., mcE, -mcD);
    ro.xz *= rot(.16 * aside);
    fw = normalize(ta - ro); rt = normalize(cross(vec3(0., 1., 0.), fw)); up = cross(fw, rt);
    foc = length(ta - ro) / 5.5 * zoom; at = vec2(.24 * wide, .17);
  }
  vec3 rd = normalize(fw * foc + rt * (p.x - at.x) + up * (p.y - at.y));
  vec2 P = ro.xz - rd.xz * (ro.y / min(rd.y, -1e-3));
  float side = 0., cap = 0., cov = 1., px = length(ro) / (foc * uRes.y);
  vec3 h = vec3(0.), n = vec3(0., 1., 0.);
  if (mcB) {
    float k = 1. / (mcT * mcT), y0 = ro.y - mcT;
    float qa = dot(rd.xz, rd.xz) - k * rd.y * rd.y, qb = dot(ro.xz, rd.xz) - k * y0 * rd.y, qc = dot(ro.xz, ro.xz) - k * y0 * y0;
    float ds = qb * qb - qa * qc;
    if (ds > 0. && length(P) < 1.) { side = 1.; h = ro + rd * ((-qb - sqrt(ds)) / min(qa, -1e-4)); }
    float rr = max(length(h.xz), 1e-4);
    n = normalize(vec3(h.x / rr * mcT, 1., h.z / rr * mcT));
  } else {
    float A = dot(rd.xz, rd.xz), bq = dot(ro.xz, rd.xz), cq = dot(ro.xz, ro.xz) - 1., ds = bq * bq - A * cq;
    vec3 tp = ro - rd * ((ro.y - mcH) / min(rd.y, -1e-3));
    cap = 1. - smoothstep(1. - px, 1. + px, length(tp.xz));
    if (ds > 0.) {
      h = ro + rd * ((-bq - sqrt(ds)) / A);
      if (h.y > 0. && h.y < mcH) { side = 1.; cov = sat((1. - sqrt(max(cq + 1. - bq * bq / A, 0.))) / (1.5 * px)); n = vec3(h.x, 0., h.z); }
    }
    if (cap > .5) h = tp;
  }
  vec3 tint = mix(mix(vec3(.84, .87, .89), vec3(.95, .5, .26), max(uOwn[5], 0.)), vec3(.36, .39, .45), max(-uOwn[5], 0.));
  vec3 r = reflect(rd, n);
  if (side > .5) P = h.xz - r.xz * (h.y / min(r.y, -.02));
  vec3 c = mcTable(P, side), seen = c;
  if (side > .5) {
    float face = sat(-dot(n, rd));
    c *= tint;
    float sun = max(dot(normalize(n.xz + 1e-4), mcS), 0.);
    c *= 1. - .6 * pow(1. - face, 5.);
    if (mcB) {
      float rr = length(h.xz), away = dot(normalize(n.xz + 1e-4), vec2(-mcS.y, mcS.x));
      c *= .84 + .24 * away * away;
      c += tint * ((.3 + .4 * uCue) * pow(sun, 24.) + .1 * mcBell((away - .75) / .1)) * smoothstep(0., .25, rr) * (.85 + .15 * sin(rr * 160.));
      c = mix(c, tint * .95, mcBell((rr - .975) / .012) * (.35 + .5 * sun));
    }
    else { c += tint * .1 * mcBell((dot(n.xz, mcS) - .93) / .04); c *= 1. - .5 * exp(-h.y * 30.); c = mix(c, tint, .6 * mcBell((h.y - mcH + .04) / .02)); c = mix(seen, c, cov); }
  }
  if (cap > 0.) {
    float rr = length(h.xz), lt = dot(normalize(h.xz + 1e-4), normalize(vec2(.75, .66)));
    vec3 lid = tint * (.4 + .1 * h.z + .3 * pow(abs(lt), 7.) * smoothstep(0., .3, rr)) * (1. + .03 * sin(rr * 38.));
    c = mix(c, lid * (1. - .35 * smoothstep(.93, .95, rr) + .7 * smoothstep(.965, .98, rr)), cap);
  }
  c = pow(1. - exp(-1.75 * max(c, 0.)), vec3(.75));
  return mix(c, c * c * (3. - 2. * c), .45);
}
