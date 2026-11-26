// name: Scratched film
// a: Scratches
// b: Clear leader
// what: A strip of black film on a lamp, scratched by hand: many-toothed cuts that spread, cross and run together, a looping scribble, hatching, dust, sound marks along the edge, each pose held and melted into the next; or clear film with pools of blue dye and one drag of an orange brush, dried to dark rims and crystals.
// follows: Drone, pad, texture and phrase are each a cut, or a dye, crystals and drops, that grow with their sound and with the piece there. The bands make the sound marks. A hit is a burst of scratches or a thrown blot, a cue a wipe of wet colour. The lit gate goes along with the loop. Keys add loops or drops, a voice shakes the thin line.
float sfS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
const vec3 SF_LAMP = vec3(1., .965, .9);
float sfPx, sfHw;   // a pixel, and half the picture's width
// Noise along the strip, smooth or with the sharp turns of a hand: the value and its slope.
vec2 sf1(float x, float seed) {
 float i = floor(x), f = x - i, a = hash11(i + seed), b = hash11(i + 1. + seed) - a;
 return vec2(a + b * f * f * (3. - 2. * f) - .5, b * 6. * f * (1. - f));
}
vec2 sfKink(float x, float seed) {
 float i = floor(x), f = (x - i - .5) * 1.35, a = hash11(i + seed), b = hash11(i + 1. + seed) - a;
 return vec2(a + b * sat(f + .5) - .5, abs(f) < .5 ? b * 1.35 : 0.);
}
// The held pose: its number, the next one's share; `len` seconds a pose.
vec2 sfPose(float len, float off) { float t = uTime / len + off; return vec2(mod(floor(t), 61.), sfS(.1, .95, fract(t))); }
float sfPart(vec2 ps, int k) { return sin((k == 0 ? 1. - ps.y : ps.y) * .5 * PI); }
float sfNo(vec2 ps, int k) { return mod(ps.x + float(k), 61.); }
vec3 sfOver(vec3 under, vec3 light) { return 1. - (1. - under) * (1. - min(light, .97)); }
// A cut laid over: tinted where shallow, the bare lamp where deep.
vec3 sfLay(vec3 under, vec3 tint, vec2 cut, float gain) { return sfOver(under, mix(tint, SF_LAMP, cut.y / max(cut.x, .01)) * cut.x * gain); }
float sfCut(float d, float w) { return sfS(sfPx, -sfPx, d - max(w, .5 * sfPx)) * min(1., w / (.5 * sfPx)); }
// A toothed tool drawn along, turning. c is its path (place, slope), n the teeth each side. Gives the cut, and how much is deep.
vec2 sfComb(vec2 q, vec2 c, float amp, float n, float spread, float width, float seed, float len) {
 vec2 best = vec2(0.);
 if (abs(q.y - c.x) > .57 * amp + 2.1 * n * spread + 6. * width + .01) return best;
 vec2 ps = sfPose(len, seed * .137);
 float twist = 2. * sf1(q.x * 1.25 + 11., seed).x + .3 * sin(uTime * .09 + seed);
 for (int k = 0; k < 2; k++) {
  float sd = seed + 31. + sfNo(ps, k) * 5.3;
  vec2 j = sfKink(q.x * 4., sd), j2 = sfKink(q.x * 19., sd + 2.);
  float sl = c.y + amp * (j.y * 4. + .13 * j2.y * 19.);
  float d = q.y - c.x - amp * (j.x + .13 * j2.x);
  float sp = spread * (.7 + .6 * uSpace) * (twist + .5 * j.x), as = max(abs(sp), 1e-4);
  float kk = clamp(floor(d / as + .5), -n, n), id = kk * sign(sp);
  float e = (d - kk * as) / sqrt(1. + sl * sl), own = n < .5 ? 1. : sfS(0., .01, as), wide = width * mix(.8, .5 + 1.5 * hash11(id + seed) * hash11(id + seed), own);
  if (abs(e) > wide * 3. + .008) continue;
  float pr = sf1(q.x * 2. + id * 5., sd + id * 3.1).x * own + .5;
  float fine = noise(vec2(q.x * 120., id * 4. + sd)), burr = noise(vec2(q.x * 330. + e * 300., sd + id));
  burr *= burr; burr *= burr;
  float w = wide * (.15 + 1.3 * pr * pr) * (.6 + .7 * fine) + (e > 0. ? 1. : .1) * burr * (.002 + .7 * wide) * sfS(.35, .7, pr);
  float left = sfS(.35, .75, noise(vec2(q.x * 16. + sd, e * 800. + id * 9.))) * sfS(.0015, .005, w) * (1.15 - pr);
  float cut = sfCut(abs(e), w) * sfS(.1, .28, pr + .3 * fine) * (1. - .75 * left);
  float deep = sfS(.25, .75, pr + .4 * (uTone - .5)) * sfS(1., .45, abs(e) / max(w, sfPx));
  float share = sfPart(ps, k);
  best = max(best, vec2(cut, cut * deep * share) * share);
 }
 return best;
}
// A scribble of unlike loops; r must stay under 0.1.
float sfCoil(vec2 q, float y0, float r, float seed) {
 if (abs(q.y - y0) > r + .05) return 0.;
 vec2 ps = sfPose(1.9, .3);
 float all = 0., w = .0012 + .0022 * noise(q * 30.);
 const float DT = .01;
 const mat2 TURN = mat2(.88233, .47063, -.47063, .88233);
 for (int k = 0; k < 2; k++) {
  float sd = seed + sfNo(ps, k) * 3.7, m = 1., t0 = floor(q.x / DT) - 10.;
  float rr = r * (.55 + .45 * sin(q.x * 7.36 + sd * 2.3)), y = y0 + .02 * sin(q.x * 19.6 + sd), ph = t0 * DT * 49. + sd * 1.9 + 1.1 * sin(q.x * 12.3 + sd);
  vec2 a = vec2(0.), was = a, o = vec2(cos(ph), sin(ph));
  for (int i = 0; i <= 21; i++) {
   vec2 g = rr * vec2(.35 * o.x - o.y, o.x), b = vec2((t0 + float(i)) * DT, y) + g;
   if (i > 0) { vec2 v = b - a, u = q - a; float x = sat(dot(u, v) / max(dot(v, v), 1e-8)); m = min(m, length(u - v * x - (g + was) * .061 * x * (1. - x))); }
   a = b; was = g; o = TURN * o;
  }
  all = max(all, sfCut(m, w) * sfPart(ps, k));
 }
 return all;
}
// Patches of hatching; `want` is how many show here.
float sfHatch(vec2 q, float n, float ang, float want, float seed) {
 if (want < .005) return 0.;
 vec2 ps = sfPose(2.7, seed * .31), g = rot(ang) * q * n, id = floor(g);
 float all = 0.;
 for (int k = 0; k < 2; k++) {
  float pose = seed + sfNo(ps, k) * 1.7;
  vec2 h = hash22(id + pose), f = rot((h.y - .5) * .7) * (g - id - .5);
  float on = sfS(h.x, h.x + .15, want);
  float row = floor(f.y * 17.), hr = hash21(vec2(row, h.x * 91.)), v = (fract(f.y * 17.) - .5 + .5 * (hr - .5) + f.x * (h.y - .5)) / 17.;
  float half_ = .46 * (.35 + .65 * hr) * sfS(.42, .2, abs(row + .5) / 17.), x = f.x + .14 * (hr - .5);
  float taper = sfS(half_ + .001, half_ * .3, abs(x)) * sfS(-half_ - .01, -half_ + .1, x);
  all = max(all, on * taper * sfCut(abs(v) / n, .0016 * taper * (.5 + hr)) * sfPart(ps, k));
 }
 return all;
}
// Where the tool slipped: long thin cuts.
float sfSlip(vec2 q, float seed, float len) {
 vec2 ps = sfPose(len, seed * .21);
 float all = 0., span = 1.6, x = q.x + seed * .37, i = floor(x / span);
 for (int k = 0; k < 2; k++) {
  vec2 h = hash22(vec2(i, seed + sfNo(ps, k)));
  float u = x - (i + .5) * span, sl = (h.x - .5) * 1.1, y = q.y - .04 - (h.y - .5) * .35 - sl * u;
  float taper = 1. - sfS(.12, .2 + .5 * h.y, abs(u - .2 * h.x));
  all = max(all, sfCut(abs(y), .0014 * taper * (.4 + noise(vec2(u * 60., seed)))) * taper * sfPart(ps, k));
 }
 return all;
}
// Specks of dust.
float sfDust(vec2 q, float n, float seed) {
 vec2 g = rot(.4) * q * n, id = floor(g), h = hash22(id + seed), v = g - id - .1 - .8 * hash22(id + 7.7 + seed);
 v.x *= .3 + 1.4 * h.y;
 return sfCut(length(v) / n, .0006 + .0024 * pow(h.y, 8.)) * step(.72, h.x);
}
// Sound marks in a row: u along it (`at` on the screen), v across.
float sfMark(float u, float at, float wide, float n, float v) {
 float id = floor(u * n), f = fract(u * n) - .5, h = hash11(id * .37 + 30.), loud = band(sat((at - f / n) * wide + .5));
 float len = (.011 + .046 * loud) * (.6 + .6 * h), w = .0013 + .0019 * loud * h;
 return sfCut(abs((f + .35 * (h - .5)) / n + .08 * v * (h - .5)), w) * sfS(len + .004, len - .004, abs(v)) * step(.18, noise(vec2(id * .19, 2.))) * (.5 + .5 * loud);
}
vec2 sfSpot(float o) { return vec2(.5 * min(sfHw, .8) * sin(uTime * .11 + o), .06 + .13 * cos(uTime * .17)); }
float sfMap(float x, float y) { return piece(vec2(x / (2. * max(sfHw, .8)) + .5, y)).a; }
float sfBell(float x) { return exp(-x * x); }
float sfBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
// A burst of cuts from one point, run outward as it dies.
float sfStar(vec2 v, float s) {
 v = rot(.5) * v; v.y *= 1.35;
 v += .006 * (vec2(noise(v * 60.), noise(v * 60. + 9.)) - .5);
 float l = length(v) + 1e-4, all = 0.;
 for (int k = 0; k < 2; k++) {
  float n = k == 0 ? 13. : 8., a = fract(atan(v.y, v.x + 1e-5) / TAU + 1. + .031 * float(k)) * n, id = floor(a) + 40. * float(k);
  float h = hash11(id + 3.), h2 = hash11(id + 51.), off = abs(fract(a) - .3 - .4 * h2) * l * TAU / n;
  float len = k == 0 ? .05 + .1 * h : .1 + .24 * h * h, head = (1. - s) * len * .6 + .015 * h2;
  float along = sfS(len, len * .6, l) * sfS(head - .008, head + .012, l);
  all = max(all, along * sfCut(off, .0042 * sat(1. - l / len) * (.35 + h2)));
 }
 return all;
}
// A kind's colour worked into the house colour: as light, and as what a dye takes away.
vec3 sfKind(int k) { vec3 c = uKind[k]; return c / max(max(c.r, max(c.g, c.b)), .05); }
vec3 sfTint(vec3 house, int k) { return mix(house, sfKind(k), .22); }
vec3 sfInk(vec3 house, int k) { vec3 c = sfKind(k); return -log(clamp(mix(house, c * c * c, k == 1 ? .07 : .18), .012, .98)); }
vec3 sfScratches(vec2 p) {
 vec2 q = vec2(p.x + 8. + 6. * sin(uTravel * .0018), p.y + .0015 * sin(uTime * .7));
 vec3 ember = vec3(1., .45, .1), ice = vec3(.2, .78, .9);
 // the gate: a frame of lamplight that goes along with the loop
 float g = uLoop * 2. - 1., gateOn = sfS(1., .86, abs(g));
 float gd = sfBox(p - vec2(g * (sfHw + .1), .02), vec2(.245, .335), .03);
 float gate = sfS(.03, -.03, gd) * gateOn;
 // the emulsion: brown-black, thinner here and there, rubbed along its length
 float thick = .7 * noise(q * vec2(2., 4.)) + .15;
 float rub = noise(vec2(q.x * 1.4, q.y * 420.)); rub *= rub; rub *= rub;
 float pool = sfBell(length(p - vec2(-.3, .1)) * 1.26);
 vec3 col = vec3(.066, .046, .037) * (.35 + .9 * thick) * (.5 + .8 * pool + .5 * uLevel);
 col += vec3(.075, .042, .02) * gate * (.5 + thick) + vec3(.10, .06, .03) * gateOn * exp(-abs(gd) * 60.) * .5;
 col += vec3(.16, .14, .12) * rub * (.25 + .6 * gate) * sfS(.3, .7, noise(vec2(q.x * 2., q.y * 30.)));
 float gain = .74 + .2 * gate + .12 * uLevel + .12 * uEnergy;
 vec2 ps = sfPose(3.1, 0.);
 for (int k = 0; k < 2; k++) col = sfOver(col, SF_LAMP * sfDust(q, 19., sfNo(ps, k)) * (.3 + .35 * uHigh) * sfPart(ps, k));
 // a cue: a wet swath of colour wiped along the strip
 if (uCue > .005) {
  float c = sat(uCue), front = mix(-.75, 1.25, 1. - c) * sfHw + .07 * noise(vec2(p.y * 7., 3.)) + .03 * noise(vec2(p.y * 90., 1.)) - .25 * p.y;
  float bx = front - p.x, hair = noise(vec2(q.x * 2.2, p.y * 85.)), edge = abs(p.y - .02 + .03 * sin(q.x * 5.)) + .03 * hair;
  float wet = sfS(0., .012, bx) * sfS(.75, 0., bx + .35 * (hair - .5)) * sfS(.27, .255, edge);
  float lip = exp(-bx * bx * 900.) * wet;
  col = sfOver(col, (mix(vec3(.55, .1, .02), ember, .25 + .5 * hair) * (.35 + .5 * hair) + ember * lip * .6) * wet * sfS(0., .4, c));
 }
 vec2 s0 = sf1(q.x * .75, 3.), s1 = sf1(q.x * 1.5, 17.), s2 = sf1(q.x * .5, 29.);
 // slips of the tool
 float slip = .4 * sfSlip(q, 4., 7.);
 if (uMid > .05) slip = max(slip, sfSlip(q, 1., 2.1) * .9 * sfS(.05, .6, uMid));
 col = sfOver(col, vec3(.75, .8, .82) * slip);
 // texture: hatching, thickest where the piece is loud
 if (uTexture > .004) {
  float m = sfMap(p.x, .5 - p.y);
  float many = uTexture * (.45 + .5 * m) * sfS(.3, .65, noise(vec2(q.x * 1.7, q.y * 2. + 5.))) * sfS(.42, .22, abs(p.y - .02));
  float l = max(sfHatch(q, 3.6, .95, many, 5.), sfHatch(q, 4.3, -.5, many * .9, 23.));
  col = sfOver(col, mix(sfTint(ember, 2), SF_LAMP, .1) * l * gain * .9);
 }
 // drone: a wide tool, low on the strip
 if (uDrone > .004) {
  float m = sfMap(p.x, .84), on = sfS(0., .18, uDrone);
  vec2 l = sfComb(q, vec2(-.155 + .13 * s0.x, .0975 * s0.y), .035, 5., .018 + .015 * uDrone, .0014 + .0024 * uDrone + .0016 * uLow + .003 * m, 211., 1.9);
  col = sfLay(col, sfTint(ice, 0), l, on * gain);
 }
 // pad: five teeth in a hand that swings across the whole height
 if (uPad > .004) {
  float m = sfMap(p.x, .5), on = sfS(0., .18, uPad);
  vec2 l = sfComb(q, vec2(.04 + .3 * s1.x, .45 * s1.y), .2, 2., .022 + .026 * uPad, .0016 + .0026 * uPad + .003 * m, 307., 1.6);
  col = sfLay(col, mix(ember, sfKind(1), .1), l, on * gain);
 }
 // phrase: a looping scribble above
 float want = max(uPhrase, .8 * uKeys);
 if (want > .004) {
  float l = sfCoil(q, .2 + .1 * s0.x, .02 + .07 * want, 7.) * sfS(0., .2, want);
  col = sfOver(col, mix(sfTint(ember, 3), SF_LAMP, .5) * l * gain);
 }
 // the one thin line that is always there: it trembles, and a voice shakes it
 vec2 l = sfComb(q, vec2(.065 + .13 * s2.x, .065 * s2.y), .022 + .12 * uMic, 0., 0., .0024 + .0015 * uMic, 101., 1.3);
 col = sfLay(col, vec3(1., .8, .5), l, gain);
 // the edges of the strip: holes above, hand-cut sound marks below
 col = sfOver(col, SF_LAMP * sfMark(q.x, p.x, .5 / sfHw, 90., p.y + .43) * (.8 + .2 * gate));
 vec2 hp = vec2((fract(q.x / .476) - .5) * .476, p.y - .43);
 float hd = sfBox(hp, vec2(.04, .052), .016);
 float hole = sfS(sfPx, -sfPx, hd);
 col = mix(col, SF_LAMP * (.80 + .14 * gate - .12 * sfS(.02, -.05, hp.y)), hole);
 col += vec3(.16, .08, .03) * exp(-max(hd, 0.) * 55.) * (1. - hole);
 // a hit: a burst of scratches in one place
 if (uHits > .01) {
  vec2 v = p - sfSpot(.5);
  vec3 hot = sfTint(ember, 4);
  col = sfOver(col, (mix(hot, SF_LAMP, .6) * sfStar(v, uHits) + hot * .22 * sfBell(length(v) * 6.5)) * sat(uHits * 1.6));
 }
 return col;
}
// One painted frame: how thick the cool dye, the warm dye and the ink lie. `age` runs 0 to 1 as it dries.
vec3 sfPaint(vec2 p, float k, float age, float m) {
 float sx = min(1., sfHw / .85);
 vec2 w = vec2(noise(p * 2.6 + k * 3.1), noise(p * 2.6 + k * 3.1 + 40.)) - .5;
 vec2 fine = vec2(noise(p * 17. + k), noise(p * 17. + k + 30.)) - .5;
 vec2 q = p + (.15 + .05 * age) * w + .016 * fine;
 vec4 h = vec4(hash11(k * 1.7 + 1.), hash11(k * 1.7 + 2.), hash11(k * 1.7 + 3.), hash11(k * 1.7 + 4.)) - .5;
 float small = .5 + .5 * sx, rimUp = .6 + .8 * uTone, grow = .03 * age + .05 * m, soft = .002 + .006 * uSpace;
 // the cool dye: blots run together low on the left
 float d = length((q - vec2((-.36 + .12 * h.x) * sx, -.1 + .12 * h.y)) * vec2(.9, 1.15)) - (.1 + .17 * uDrone) * small - grow;
 d = smin(d, length(q - vec2((-.02 + .3 * h.z) * sx, -.27 + .08 * h.w)) - (.05 + .1 * uDrone) * small - grow, .1);
 d = min(d, length(q - vec2((.3 + .3 * h.y) * sx, -.32 + .1 * h.x)) - .025 - .04 * uDrone);
 float in_ = sfS(soft, -soft, d), n5 = noise(q * 6. + k), rim = sfBell((d + .007) / .006);
 float cool = in_ * (.22 + .4 * n5 + .55 * sfS(0., -.2, d) + rimUp * (.7 * rim + .3 * sfBell((d + .04 + .03 * n5) / .004))) * (.2 + .85 * sfS(0., .6, uDrone));
 // the warm dye: one loaded brush dragged to the right until it runs dry
 vec2 v = rot(-.42 + .35 * h.z) * (p - vec2(.1 * sx, .08 + .1 * h.w)); v.x /= sx;
 v.y += .09 * sin(v.x * 2.9 + h.x * 6.) + .006 * fine.x;
 float half_ = (.03 + .1 * uPad) * small + .3 * grow, hairs = .6 * noise(vec2(v.x * 2.4 + k, v.y * 85.)) + .4 * noise(vec2(v.x * 5., v.y * 210. + k));
 float dry = sfS(-.35, .62 + .2 * h.y, v.x), e = abs(v.y) + .03 * (hairs - .5) + .02 * w.x;
 float cov = sfS(dry - .22, dry - .06, hairs) * sfS(half_, half_ - .01, e) * sfS(-.51, -.47, v.x);
 float load = length((v + vec2(.5, 0.) + .1 * w) * vec2(sx, 1.)) - half_ * 1.15, lin = sfS(soft, -soft, load);
 float warm = max(cov * (.25 + .75 * hairs * hairs + .5 * rimUp * sfS(half_ - .03, half_ - .012, e)), lin * (.6 + .4 * n5 + rimUp * sfBell((load + .006) / .006)));
 warm *= .18 + .95 * sfS(0., .55, uPad);
 // ink: a chain of drops, and hairs that came off the brush
 float ink = 0., want = max(uPhrase, .8 * uKeys);
 if (want > .005) {
  float ph = p.x * 11. + k * 3., id = floor(ph), hr = hash11(id + k), hy = hash11(id + k + 70.);
  vec2 c = vec2((id + .5 - k * 3.) / 11. + .02 * (hy - .5), .27 + .07 * sin(id * .9 + k) + .12 * (hy - .5));
  float r = (.004 + .036 * hr * hr * hr) * sfS(0., .5, want) * (.6 + .5 * want + .5 * m);
  float dd = length(p - c + .012 * fine) - r;
  ink += sfS(.003, -.003, dd) * (.55 + .7 * rimUp * sfBell((dd + .004) / .004)) * sfS(0., .3, want);
 }
 for (int i = 0; i < 4; i++) {
  float f = float(i), h1 = hash11(k + f * 7. + 11.), h2 = hash11(k + f * 7. + 12.), R = .12 + .35 * h1;
  vec2 at = vec2((h2 - .5) * 1.3 * sx, (h1 - .5) * .7), dir = vec2(cos(h2 * 40.), sin(h2 * 40.)), u = p - at + dir * R;
  float l = length(u) + 1e-4, along = dot(u / l, dir);
  ink += sfCut(abs(l - R), .0011) * sfS(1. - .012 / (R * R), 1. - .008 / (R * R), along) * .8;
 }
 return vec3(cool, warm, ink);
}
// Crystals of drying dye: needles (x), and the line between fans (y).
vec2 sfCrystal(vec2 p) {
 vec2 g = p * 7., id = floor(g), f = g - id, to = vec2(0.), who = vec2(0.);
 float d1 = 9., d2 = 9.;
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 c = vec2(float(i), float(j)), o = c + hash22(id + c + 4.) - f;
  float d = dot(o, o);
  if (d < d1) { d2 = d1; d1 = d; to = o; who = id + c; } else if (d < d2) d2 = d;
 }
 float a = atan(to.y, to.x + 1e-5), l = sqrt(d1);
 float turn = hash21(who) * 50., needles = noise(vec2(a * 11. + turn, l * 2.5)) * .65 + .35 * noise(vec2(a * 29., l * 6. + turn));
 return vec2(sfS(.3, .75, needles), sfS(.09, 0., sqrt(d2) - l));
}
vec3 sfLeader(vec2 p) {
 vec2 q = p + .0025 * vec2(sin(uTime * .31), sin(uTime * .43 + 1.));
 vec3 cool = sfInk(vec3(.02, .4, .6), 0), warm = sfInk(vec3(.98, .32, .07), 1);
 float m = sfMap(p.x, .5 - p.y);
 // two paintings, one melting into the next
 vec2 ps = sfPose(11., 0.);
 float fr = fract(uTime / 11.);
 vec3 T = sfPaint(q, sfNo(ps, 0), .5 + .5 * fr, m) * sfPart(ps, 0) + sfPaint(q, sfNo(ps, 1), .5 * fr, m) * sfPart(ps, 1);
 vec2 s2 = sf1(q.x * .5 + 20., 29.);
 T.z += .9 * sfComb(q + vec2(20., 0.), vec2(.13 + .16 * s2.x, .08 * s2.y), .022 + .12 * uMic, 0., 0., .0022 + .0015 * uMic, 101., 1.6).x;
 float dye = T.x + T.y, where = sfS(.4, .62, noise(q * 3.4 + 3.) * .8 + .4 * m) * sfS(0., .5, uTexture) * sfS(.1, .4, dye);
 if (where > .004) {
  vec2 cr = sfCrystal(q) * where;
  T.xy *= 1. - .6 * where + .85 * cr.x;
  T.z += .12 * cr.y;
 }
 vec3 ink = vec3(2.5, 2.9, 2.4), A = (cool * T.x + warm * T.y) * (.87 + .3 * uEnergy) + ink * T.z;
 // a cue: a sheet of wet dye runs down the frame
 if (uCue > .005) {
  float c = sat(uCue), n = noise(vec2(p.x * 7., 2.)) + .5 * noise(vec2(p.x * 23., 4.));
  float by = p.y - (.38 - 1.1 * (1. - c)) - .12 * n;
  float sheet = sfS(0., .006, by) * sfS(.55, 0., by);
  A += warm * .5 * sheet * (.55 + 1.3 * exp(-by * by * 2500.) + .5 * exp(-by * 14.)) * sfS(0., .35, c);
 }
 // a hit: a thrown blot and its drops
 if (uHits > .01) {
  vec2 v = q - sfSpot(2.6);
  float l = length(v) + 1e-4, a = fract(atan(v.y, v.x + 1e-5) / TAU + 1.) * 17., id = floor(a), h = hash11(id + 5.), h2 = hash11(id + 45.);
  float R = (.08 + .16 * h) * (1. - .3 * uHits);
  vec2 o = vec2((l - R) * .6, (fract(a) - .5) * l * TAU / 17.);
  float blot = l - .045 - .022 * noise(vec2(a * .9, 3.) + v * 20.), drops = length(o) - .011 * h2 - .002;
  float spoke = abs(o.y) - .0035 * sfS(R, .04, l) - .0004, b = min(blot, min(drops, l < R ? spoke : 1.));
  float wash = l - .185 + .06 * uHits - .03 * noise(v * 14. + 20.);
  A += warm * .16 * sfS(.008, -.008, wash) * (.6 + 1.5 * sfBell(wash / .01)) * sat(uHits * 2.);
  A += sfInk(vec3(.95, .14, .07), 4) * sfS(2. * sfPx, -2. * sfPx, b) * (.7 + .6 * sfBell((b + .005) / .005)) * sat(uHits * 1.5);
 }
 A += ink * 1.3 * sfMark(q.y, q.y, 1., 64., sfHw - .062 - q.x);
 // the clear film on its lamp
 float g = uLoop * 2. - 1., gate = sfS(1., .8, abs(g)) * sfBell((p.x - g * (sfHw + .15)) * 3.);
 vec2 lp = p - vec2(-.12 * sfHw, .12); float far = dot(lp, lp);
 vec3 lamp = vec3(.965, .945, .895) * (1. - .17 * far / (1. + .6 * far)) * (.955 + .05 * gate);
 float rub = noise(vec2(q.x * 430., q.y * 1.6)); rub *= rub; rub *= rub;
 lamp *= 1. - .06 * rub - .03 * noise(q * 5.);
 lamp *= 1. - .6 * sfDust(q, 17., 3.);
 vec3 col = lamp * exp(-A);
 vec2 hp = vec2(q.x + sfHw - .075, (fract(q.y / .476) - .5) * .476);
 float hd = sfBox(hp, vec2(.052, .04), .016);
 col *= 1. - .42 * exp(-abs(hd) * 260.) - .1 * exp(-max(hd, 0.) * 50.);
 return mix(col, vec3(.995, .985, .955), sfS(sfPx, -sfPx, hd + .002));
}
vec3 render(vec2 p) {
 sfPx = 1. / uRes.y; sfHw = .5 * uRes.x / uRes.y;
 return uVar < .5 ? sfScratches(p) : sfLeader(p);
}
