// name: Scratched film
// a: Scratches
// b: Clear leader
// what: A strip of black film on a lamp, scratched by hand: many-toothed cuts that spread, cross and run together, a looping scribble, hatching, dust, sound marks along the edge, each pose held and melted into the next; or clear film with pools of blue dye and one drag of an orange brush, dried to dark rims and crystals.
// follows: Drone, pad, texture and phrase are each a cut, or a dye, crystals and drops, that grow with their sound and with the piece there. The bands make the sound marks. A hit is a burst of scratches or a thrown blot, a cue a wipe of wet colour. The lit gate goes along with the loop. Keys add loops or drops, a voice shakes the thin line.
// own: 0 1 the strip is wound round a middle as on a reel, -1 it stands on end (b: lies on its side) with dark beyond it; 1 1 several narrow strips side by side (b: a sheet of many small paintings), -1 close up, with no holes and no sound marks; 2 1 the other way round: ink lines on clear film (b: dye that glows on black film), -1 the film toned in the colour of the drone; 3 1 the cuts heave into peaks (b: the dye stands in many drops), -1 drawn calm and straight (b: one great pool); 4 1 many fine teeth (b: crystals over everything), -1 a few wide cuts (b: smooth, no crystals); 5 1 burnt and blistered through, -1 cut into frames; 6 1 wholly in the colours of the sounds, -1 a great round of lamplight in which light and dark change places; 7 1 it goes away from us to the right, -1 a loose curl lying on a table
float sfS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
const vec3 SF_LAMP = vec3(1., .965, .9);
float sfPx, sfHw;   // a pixel, and half the picture's width
float sfEdge, sfInv;   // how much of the holes and marks there is; how far light and dark have changed places
vec2 sfId, sfAt;       // which strip, which frame; and where in its own frame a place is
bool sfCutUp;          // cut into frames
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
vec3 sfTint(vec3 house, int k) { return mix(house, sfKind(k), .22 + .78 * max(uOwn[6], 0.)); }
vec3 sfInk(vec3 house, int k) { vec3 c = sfKind(k); return -log(clamp(mix(mix(house, c * c * c, k == 1 ? .07 : .18), uKind[k] * (.45 + .65 * uKind[k]) + .02, max(uOwn[6], 0.)), .012, .98)); }
// What was light on black, as ink on clear film.
vec3 sfClear(vec3 c, vec2 p) {
 float l = dot(c, vec3(.3, .5, .2)), m = max(c.r, max(c.g, c.b));
 vec3 n = c / max(m, .02), lamp = vec3(.93, .905, .85) * (1. - .22 * dot(p, p)) * (.97 + .04 * noise(p * vec2(3., 160.)));
 lamp = mix(lamp, lamp * mix(vec3(1.), n, .6), sfS(.02, .12, l) * .25);
 return lamp * exp(-sfS(.07, .9, l) * 4.2 * (1. - .8 * n));
}
// Burnt through: how far from a hole's edge (over 0 in it), and the blisters round it.
vec2 sfBurn(vec2 q, float k) {
 float n = fbm(vec2(q.x * 1.5 + 2., q.y * 1.9) + .25 * noise(q * 9.)), cell = noise(q * 26.);
 return vec2(n + .05 * (cell - .5) - mix(.95, .63, k) + .01 * uHits + .02 * uLow, cell);
}
vec3 sfScratches(vec2 p) {
 vec2 q = vec2(p.x + 8. + 6. * sin(uTravel * .0018), p.y + .0015 * sin(uTime * .7));
 vec3 ember = vec3(1., .45, .1), ice = vec3(.2, .78, .9);
 float own6 = max(uOwn[6], 0.), heave = max(uOwn[3], 0.), still = max(-uOwn[3], 0.), many = max(uOwn[4], 0.), few = max(-uOwn[4], 0.);
 float hand = 1. + 1.1 * heave - .93 * still, amp = 1. + .9 * heave - .9 * still, teeth = (1. + .8 * many) , wide = (1. - .35 * many) * (1. + 2.2 * few) * (1. + .9 * max(uOwn[1], 0.) + .6 * max(uOwn[0], 0.));
 // the gate: a frame of lamplight that goes along with the loop
 float g = uLoop * 2. - 1., gateOn = sfS(1., .86, abs(g));
 float gd = sfBox(p - vec2(g * (sfHw + .1), .02), vec2(.245, .335), .03);
 float gate = sfS(.03, -.03, gd) * gateOn;
 // the emulsion: brown-black, thinner here and there, rubbed along its length
 float thick = .7 * noise(q * vec2(2., 4.)) + .15;
 float rub = noise(vec2(q.x * 1.4, q.y * 420.)); rub *= rub; rub *= rub;
 float pool = sfBell(length(p - vec2(-.3, .1)) * 1.26);
 vec3 stock = vec3(.066, .046, .037);
 if (uOwn[2] < 0.) stock = mix(stock, uKind[0] * uKind[0] * .55 + .012, -uOwn[2]);
 vec3 col = stock * (.35 + .9 * thick) * (.5 + .8 * pool + .5 * uLevel);
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
 if (uOwn[3] != 0.) { s0 *= hand; s1 *= hand; s2 *= hand; }
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
  vec2 l = sfComb(q, vec2(-.155 + .13 * s0.x, .0975 * s0.y), .035 * amp, floor(5. + 5. * many - 4. * few), (.018 + .015 * uDrone) * mix(1., 1.6, few) * teeth / (1. + .6 * many), (.0014 + .0024 * uDrone + .0016 * uLow + .003 * m) * wide, 211., 1.9);
  col = sfLay(col, sfTint(ice, 0), l, on * gain);
 }
 // pad: five teeth in a hand that swings across the whole height
 if (uPad > .004) {
  float m = sfMap(p.x, .5), on = sfS(0., .18, uPad);
  vec2 l = sfComb(q, vec2(.04 + .3 * s1.x, .45 * s1.y), .2 * amp, floor(2. + 5. * many - 1.5 * few), (.022 + .026 * uPad) * teeth / (1. + .4 * many), (.0016 + .0026 * uPad + .003 * m) * wide, 307., 1.6);
  col = sfLay(col, mix(ember, sfKind(1), .1 + .9 * own6), l, on * gain);
 }
 // phrase: a looping scribble above
 float want = max(uPhrase, .8 * uKeys);
 if (want > .004) {
  float l = sfCoil(q, .2 + .1 * clamp(s0.x, -.7, .7), (.02 + .07 * want) * (1. - .6 * still), 7.) * sfS(0., .2, want);
  col = sfOver(col, mix(sfTint(ember, 3), SF_LAMP, .5) * l * gain);
 }
 // the one thin line that is always there: it trembles, and a voice shakes it
 vec2 l = sfComb(q, vec2(.065 + .13 * s2.x, .065 * s2.y), .022 * amp + .12 * uMic, 0., 0., (.0024 + .0015 * uMic) * wide, 101., 1.3);
 col = sfLay(col, mix(vec3(1., .8, .5), sfKind(3), .6 * own6), l, gain);
 // the edges of the strip: holes above, hand-cut sound marks below
 col = sfOver(col, SF_LAMP * sfMark(q.x, p.x, .5 / sfHw, 90., p.y + .43) * (.8 + .2 * gate) * sfEdge);
 vec2 hp = vec2((fract(q.x / .476) - .5) * .476, p.y - .43);
 float hd = sfBox(hp, vec2(.04, .052), .016);
 float hole = sfS(sfPx, -sfPx, hd) * sfEdge;
 col = mix(col, SF_LAMP * (.80 + .14 * gate - .12 * sfS(.02, -.05, hp.y)), hole);
 col += vec3(.16, .08, .03) * exp(-max(hd, 0.) * 55.) * (1. - hole) * sfEdge;
 // a hit: a burst of scratches in one place
 if (uHits > .01) {
  vec2 v = p - sfSpot(.5);
  if (sfCutUp) v = sfAt - vec2(.3, .6) * sfSpot(.5);
  vec3 hot = sfTint(ember, 4);
  col = sfOver(col, (mix(hot, SF_LAMP, .6) * sfStar(v, uHits) + hot * .22 * sfBell(length(v) * 6.5)) * sat(uHits * 1.6));
 }
 return col;
}
// Drops of every size, one to a place.
float sfDrops(vec2 p, float n, float k) {
 vec2 g = rot(.5) * p * n, id = floor(g), f = g - id - .5;
 float d = 9.;
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 c = vec2(float(i), float(j)), h = hash22(id + c + mod(k, 61.) * 1.3);
  d = min(d, length(f - c - .7 * (h - .5)) - .05 - .42 * h.x * h.y * (.3 + .7 * h.x));
 }
 return d / n;
}
// One painted frame: how thick the cool dye, the warm dye and the ink lie. `age` runs 0 to 1 as it dries.
vec3 sfPaint(vec2 p, float k, float age, float m) {
 float sx = min(1., sfHw / .85);
 vec2 w = vec2(noise(p * 2.6 + k * 3.1), noise(p * 2.6 + k * 3.1 + 40.)) - .5;
 vec2 fine = vec2(noise(p * 17. + k), noise(p * 17. + k + 30.)) - .5;
 vec2 q = p + (.15 + .05 * age) * w + .016 * fine;
 float drops = max(uOwn[3], 0.), pool = max(-uOwn[3], 0.);
 vec4 h = vec4(hash11(k * 1.7 + 1.), hash11(k * 1.7 + 2.), hash11(k * 1.7 + 3.), hash11(k * 1.7 + 4.)) - .5;
 float small = .5 + .5 * sx, rimUp = .6 + .8 * uTone, grow = .03 * age + .05 * m + .13 * pool + .05 * drops, soft = .002 + .006 * uSpace;
 // the cool dye: blots run together low on the left
 float d = length((q - vec2((-.36 + .12 * h.x) * sx, -.1 + .12 * h.y)) * vec2(.9, 1.15)) - (.1 + .17 * uDrone) * small - grow;
 d = smin(d, length(q - vec2((-.02 + .3 * h.z) * sx, -.27 + .08 * h.w)) - (.05 + .1 * uDrone) * small - grow, .1);
 d = min(d, length(q - vec2((.3 + .3 * h.y) * sx, -.32 + .1 * h.x)) - .025 - .04 * uDrone);
 if (pool > 0.) d = mix(d, length((q - vec2(-.1 * sx, -.12)) * vec2(.62, 1.)) - .3 - .06 * uDrone - grow * .4, pool);
 if (drops > 0.) d = mix(d, max(sfDrops(q, 5.2, k), d - .26), drops);
 float in_ = sfS(soft, -soft, d), n5 = noise(q * 6. + k), rim = sfBell((d + .007) / .006);
 float cool = in_ * (.22 + .4 * n5 + .55 * sfS(0., -.2, d) + rimUp * (.7 * rim + .3 * sfBell((d + .04 + .03 * n5) / .004))) * (.2 + .85 * sfS(0., .6, uDrone));
 // the warm dye: one loaded brush dragged to the right until it runs dry
 vec2 v = rot(-.42 + .35 * h.z) * (p - vec2(.1 * sx, .08 + .1 * h.w)); v.x /= sx;
 v.y += .09 * sin(v.x * 2.9 + h.x * 6.) + .006 * fine.x;
 float half_ = (.03 + .1 * uPad) * small * (1. + .9 * pool) + .3 * grow, hairs = .6 * noise(vec2(v.x * 2.4 + k, v.y * 85.)) + .4 * noise(vec2(v.x * 5., v.y * 210. + k));
 float dry = sfS(-.35, .62 + .2 * h.y, v.x), e = abs(v.y) + .03 * (hairs - .5) + .02 * w.x;
 float cov = sfS(dry - .22, dry - .06, hairs) * sfS(half_, half_ - .01, e) * sfS(-.51, -.47, v.x);
 float load = length((v + vec2(.5, 0.) + .1 * w) * vec2(sx, 1.)) - half_ * 1.15, lin = sfS(soft, -soft, load);
 float warm = max(cov * (.25 + .75 * hairs * hairs + .5 * rimUp * sfS(half_ - .03, half_ - .012, e)), lin * (.6 + .4 * n5 + rimUp * sfBell((load + .006) / .006)));
 if (drops > 0.) {
  float dd = sfDrops(q + 3.7, 4.4, k + 5.), kept = sfS(-.1, .1, cov + lin - .25 + .5 * sfS(half_ + .22, half_ - .05, abs(v.y)) * sfS(-.6, -.4, v.x) * sfS(.7, .3, v.x));
  warm = mix(warm, sfS(soft, -soft, dd) * kept * (.4 + .4 * n5 + rimUp * sfBell((dd + .006) / .006)), drops);
 }
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
 if (sfId != vec2(0.)) ps.x = mod(ps.x + floor(40. * hash21(sfId + 5.)), 61.);
 float fr = fract(uTime / 11.);
 vec3 T = sfPaint(q, sfNo(ps, 0), .5 + .5 * fr, m) * sfPart(ps, 0) + sfPaint(q, sfNo(ps, 1), .5 * fr, m) * sfPart(ps, 1);
 vec2 s2 = sf1(q.x * .5 + 20., 29.);
 T.z += .9 * sfComb(q + vec2(20., 0.), vec2(.13 + .16 * s2.x, .08 * s2.y), .022 + .12 * uMic, 0., 0., .0022 + .0015 * uMic, 101., 1.6).x;
 float dye = T.x + T.y, where = sfS(.4, .62, noise(q * 3.4 + 3.) * .8 + .4 * m) * sfS(0., .5, uTexture) * sfS(.1, .4, dye);
 float frost = max(uOwn[4], 0.);
 if (frost > 0.) where = mix(where, (.4 + .6 * sfS(.3, .55, noise(q * 2.1 + 9.))) * (.65 + .35 * uTexture), frost);
 if (uOwn[4] < 0.) where *= 1. + uOwn[4];
 if (where > .004) {
  vec2 cr = sfCrystal(frost > 0. ? q * (1. - .5 * frost) : q) * where;
  if (frost > 0.) T.x += frost * (.12 + .55 * cr.x * (.6 + .5 * m)) * where;
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
 A += ink * 1.3 * sfMark(q.y, q.y, 1., 64., sfHw - .062 - q.x) * sfEdge;
 // the clear film on its lamp
 float g = uLoop * 2. - 1., gate = sfS(1., .8, abs(g)) * sfBell((p.x - g * (sfHw + .15)) * 3.);
 vec2 lp = p - vec2(-.12 * sfHw, .12); float far = dot(lp, lp);
 vec3 lamp = vec3(.965, .945, .895) * (1. - .17 * far / (1. + .6 * far)) * (.955 + .05 * gate);
 float rub = noise(vec2(q.x * 430., q.y * 1.6)); rub *= rub; rub *= rub;
 lamp *= 1. - .06 * rub - .03 * noise(q * 5.);
 lamp *= 1. - .6 * sfDust(q, 17., 3.);
 if (uOwn[2] < 0.) lamp = mix(lamp, lamp * (.12 + 1.05 * uKind[0]), -uOwn[2]);
 vec3 col = lamp * exp(-A);
 if (sfInv > 0.) {                                    // the dye as light on black film
  vec3 tr = exp(-A); float lo = min(tr.r, min(tr.g, tr.b)), hi = max(tr.r, max(tr.g, tr.b));
  vec3 glow = (tr / max(hi, .04)) * sfS(.04, 1., 1. - lo) * mix(.62, 1., hi);
  col = mix(col, vec3(.016, .015, .018) + .02 * rub + glow * (.82 + .2 * uLevel), sfInv);
 }
 vec2 hp = vec2(q.x + sfHw - .075, (fract(q.y / .476) - .5) * .476);
 float hd = sfBox(hp, vec2(.052, .04), .016);
 col *= 1. - (.42 * exp(-abs(hd) * 260.) + .1 * exp(-max(hd, 0.) * 50.)) * sfEdge;
 return mix(col, vec3(.995, .985, .955) , sfS(sfPx, -sfPx, hd + .002) * sfEdge);
}
// How the strip lies: the place on it that is seen at p. shade: the light on it; past: how far beyond its edge.
vec2 sfLie(vec2 p, inout float shade, inout float past) {
 bool b = uVar > .5;
 vec2 o = b ? p.yx : p;                                // x along the strip, y across it
 float end = b ? .5 : sfHw, side = b ? sfHw : .5;
 if (uOwn[7] > 0.) {                                   // away to the right
  float k = uOwn[7], den = max(1. - .86 * k * (o.x / (2. * end) + .5), .1);
  o = vec2((o.x + end) / den * mix(1., .75, k) - end, (o.y + .06 * k * step(end, side + .5)) / den * mix(1., .92, k) - .05 * k * (b ? 0. : 1.));
  shade *= mix(1., .35 + .65 * den, .8 * k);
 }
 if (uOwn[7] < 0.) {                                   // a loose curl
  float k = -uOwn[7], a = o.x * 2.7 + .5 + .06 * sin(uTime * .11), w = 1. - k * (.4 + .12 * cos(a));
  o = vec2(o.x + .06 * k * sin(a * 2.), o.y - .12 * k * sin(a)) / w;
  shade *= 1. + k * (b ? .2 : .42) * (cos(a + .6) - (b ? .6 : 0.));
 }
 if (uOwn[0] > 0.) {                                   // wound on a reel
  float k = uOwn[0], R = .2667 / k, w = mix(1., .44, k);
  vec2 v = o + vec2(0., R * (1. - k));
  o = vec2(atan(v.x, v.y + (abs(v.y) < 1e-5 ? 1e-5 : 0.)) * R, length(v) - R) / w;
  if (b) { float t = 1.2692, id = floor(o.x / t + .5); o.x -= id * t; sfId.y += id * 5.; o.y *= mix(1., 1.1, k); o.x *= mix(1., .84, k); side = mix(side, .55, k); }
 }
 if (b) { o = o.yx; sfHw = side; }
 if (uOwn[0] < 0.) { float a = -.5 * PI * uOwn[0]; o = mat2(cos(a), -sin(a), sin(a), cos(a)) * o * mix(1., 1.06, -uOwn[0]); sfHw = mix(sfHw, .53, -uOwn[0]); }
 if (uOwn[1] > 0.) {                                   // several
  float n = 1. + 1.5 * uOwn[1]; o *= n;
  if (!b) { sfId.x = floor(o.y / 1.04 + .5); o.y -= sfId.x * 1.04; o.x += sfId.x * 3.71; past = abs(o.y) - .5; }
  else { vec2 c = vec2(2. * sfHw + .06, 1.06), id = floor(o / c + .5); o -= id * c; sfId += id * vec2(1., 3.); past = max(abs(o.x) - sfHw, abs(o.y) - .5); }
 } else past = b ? abs(o.x) - sfHw : abs(o.y) - .5;
 if (uOwn[1] < 0.) { o /= 1. - .75 * uOwn[1]; sfEdge = 1. + uOwn[1]; }
 return o;
}
vec3 render(vec2 p) {
 sfPx = 1. / uRes.y; sfHw = .5 * uRes.x / uRes.y;
 sfEdge = 1.; sfInv = 0.; sfId = vec2(0.);
 if (uOwn[0] == 0. && uOwn[1] == 0. && uOwn[2] <= 0. && uOwn[5] == 0. && uOwn[6] >= 0. && uOwn[7] == 0.) return uVar < .5 ? sfScratches(p) : sfLeader(p);
 float shade = 1., past = -1., k = max(uOwn[2], 0.), hw = sfHw;
 if (k > 0.) k = sfS(0., .3, k * 1.45 - .85 * sat(p.x / (2. * hw) + .5) - .3 * noise(p * vec2(2., 5.)));   // it clears from the left
 if (uOwn[6] < 0.) {
  float r = length(p - vec2(-.16, .03) * hw) + .29 * uOwn[6] - .012 * cos(TAU * uLoop) - .015 * uLevel;
  k = mix(k, 1. - k, sat(-8. * uOwn[6]) * sfS(.006, -.006, r));
 }
 vec2 o = sfLie(p, shade, past), w = fwidth(o);
 float far = max(1., min(max(w.x, w.y), 8. * sfPx) / sfPx);
 sfPx *= far;
 float bar = 0.;
 sfCutUp = uOwn[5] < 0. && uVar < .5;
 if (uOwn[5] < 0.) {                                   // cut into frames, each a picture of its own
  float c = -uOwn[5], run = mix(2., .66, c), at = uVar < .5 ? o.x + run * .5 : o.y + run * .5, id = floor(at / run), e = abs(at / run - id - .5) * run;
  bar = sfS(.5 * run - .022 * c - sfPx, .5 * run - .022 * c, e) * c;
  sfId.y += id;
  sfAt = vec2(at - (id + .5) * run, o.y);
  if (uVar < .5) { o.x += id * 2.9 * c; if (hash11(id + 3. * sfId.x) > .5) o.y = mix(o.y, -o.y, step(abs(o.y), .36)); }
  else o.y = mix(o.y, (at - (id + .5) * run) * 1.4, c);
 }
 if (uVar > .5) sfInv = k;
 vec3 col = uVar < .5 ? sfScratches(o) : sfLeader(o);
 if (uVar < .5 && k > 0.) col = mix(col, sfClear(col, p), k);
 if (bar > 0.) col = mix(col, mix(vec3(.012), vec3(.9, .88, .83), uVar < .5 ? k : 1. - k), bar * mix(step(abs(o.y), .36), 1., uVar));
 if (uOwn[5] > 0.) {                                   // burnt through to the lamp, with blisters and a charred rim
  vec2 u = sfBurn(o + vec2(sfId.x * 3., sin(uTravel * .002)), uOwn[5]);
  float near = sfS(-.13, 0., u.x), in_ = sfS(0., .012, u.x);
  vec3 amber = mix(vec3(.95, .5, .14), sfKind(4), .6);
  float bub = sfS(.3, .62, u.y) * sfS(.95, .6, u.y);
  col = mix(col, (col + amber * .25) * mix(vec3(1.), amber, .8) * (.5 + .9 * bub) + amber * .3 * bub * bub * near, near * .85 * uOwn[5]);
  col *= 1. - .85 * sfS(-.045, -.008, u.x) * uOwn[5] * (.7 + .3 * u.y);
  col += amber * .8 * sfBell((u.x + .004) / .007) * uOwn[5];
  col = mix(col, vec3(1., .95, .84) * (.9 + .08 * uLevel + .06 * noise(o * 3.) - .5 * dot(p, p)) * mix(vec3(1.), amber, .45 * sfS(.09, 0., u.x)), in_ * sat(uOwn[5] * 4.));
 }
 // beyond the strip: the dark it hangs in, or the lit table it lies on, with its shadow
 float light = uVar < .5 ? 0. : 1. - max(uOwn[2], 0.);
 vec3 table = mix(vec3(.014, .012, .012) + .05 * uKind[0] * uKind[0] * (1. + uDrone), vec3(.30, .285, .27) * (.8 + .5 * uKind[0]), light * .55) * (1.1 - .7 * dot(p, p));
 if (uVar < .5) table = mix(table, vec3(.66, .63, .585) * (1. - .3 * dot(p, p)) * (.96 + .06 * noise(p * vec2(60., 9.))), max(uOwn[2], 0.) * step(uOwn[7], 0.));
 table *= 1. - .6 * exp(-max(past, 0.) * 14.) * step(uOwn[7], -.001);
 float beyond = sfS(-sfPx, sfPx, past) * sat(8. * max(max(abs(uOwn[0]), abs(uOwn[7])), max(uOwn[1], 0.)));
 return mix(col * shade, table, beyond);
}
