// name: Spawning night
// a: On the reef
// b: Morning slick
// what: A coral reef under moonlit water, a diver's small lamp behind it: rose and cream beads sit in the brain coral, the shelves and the branches, let go and rise in loose columns to the surface; or the sea at dawn from a drifting boat, ribbons of pink beads winding to a low island, a turtle crossing, an oar's blade in the water.
// follows: Each kind is one coral or ribbon: its level is how many beads rise or lie there. Lows sway the water, bands and the piece thicken the beads by height, distance and place. Pads bring up moonlight or the glow of dawn, a voice the lamp or dawn. A hit frees one coral's crop, or runs out as a bright ring; a cue is a front through all. Keys light single beads.
// own: 0 no moon, the lamp alone, or night on the sea at -1, clear noon at 1; 1 tall spires, or loose rafts of beads at -1, low wide coral, or nearly straight ribbons at 1; 2 the reef higher, or looking down on the water at -1, up at the surface, or under a big sky at 1; 3 a few beads at -1, a whole sea of them at 1; 4 clear still water, or a breeze at -1, green surging water, or mist at 1; 5 pearl and grey at -1, red and amber at 1; 6 great brain corals alone at -1, a thicket of branches at 1 (b: an empty sea at -1, tall rocks standing in it at 1; the sky as pad and hits), all dyed as the sounds; 7 spawn as fine as smoke at -1, few great glassy eggs at 1, dyed as the sounds
float csPx, csWide, csSurge, csLit; // a pixel, how far things stand apart across, how far the water leans, how much of the lamp is here
vec3 csMoonC, csWater, csLampC;   // the moon's light, the far water, the lamp's light
vec2 csMoon, csLamp, csToLamp;
#define CS_UP max(uOwn[6], 0.)
#define CS_DN max(-uOwn[6], 0.)
#define CS_DYE max(max(abs(uOwn[6]), abs(uOwn[7])), 0.)
#define CS_EGG max(uOwn[7], 0.)
#define CS_COLD (max(-uOwn[0], 0.) * max(-uOwn[7], 0.))
#define CS_F exp2(uOwn[7] > 0. ? 1.9 * uOwn[7] : .9 * uOwn[7])
float csS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float csSeg(vec2 p, vec2 a, vec2 b, float r0, float r1) {
 vec2 d = b - a; float t = sat(dot(p - a, d) / dot(d, d));
 return length(p - a - d * t) - mix(r0, r1, t);
}
// How loud each of the five is, and a bead of a kind's colour k: a pearl tinted by it.
float csKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
vec3 csPearl(vec3 k, float h) {
 vec3 base = mix(vec3(1., .33, .36), vec3(1., .76, .58), h * h);
 base = mix(base, vec3(.8, .9, 1.) * (.75 + .25 * h), .85 * max(-uOwn[5], 0.));
 base = mix(base, mix(vec3(.95, .12, .04), vec3(1., .5, .08), h), .9 * max(uOwn[5], 0.));
 base = mix(base, base * .35 + k * k * .8, .4);
 return mix(base, mix(k, k * k, .6) * (.95 + .4 * h), .85 * CS_DYE);
}
// Water at night, with the silver underside of the surface above the line top.
vec3 csSea(vec2 p, float top) {
 vec2 m = p - csMoon; float r2 = dot(m * vec2(.75, 1.), m * vec2(.75, 1.)), up = p.y - top;
 vec3 col = csWater * (.25 + .75 * csS(-.5, .5, p.y)) + csMoonC * (.1 * exp(-r2 * 2.6) + .22 * exp(-r2 * 10.));
 if (r2 < 1.4) { // shafts falling from the moon
  float a = (p.x - csMoon.x + .06) / max(csMoon.y + .62 - p.y, .05);
  float sh = .72 * noise(vec2(a * 11., uTime * .05)) + .14 + .14 * sin(a * 47. + 3. * sin(a * 9. + uTime * .06));
  col += csMoonC * csS(.4, .95, sh) * (exp(-r2 * 2.4) - .034) * (.1 + .16 * uPad) * csS(-.5, .3, p.y);
 }
 if (up > 0.) {
  float z = .16 / (up + .012);
  vec2 w = vec2(p.x * z * 4., z * 4.4);
  w += (.7 + .5 * max(uOwn[4], 0.)) * (noise(w * .7 + vec2(uTime * .1, 0.)) - .5);
  float n1 = noise(w * vec2(1.3, 1.9) + vec2(uTime * .12, uTime * .09)), n2 = noise(w * vec2(3.1, 4.3) - vec2(uTime * .13, uTime * .06));
  float ridge = sat(1. - abs(n1 * 1.3 + .7 * n2 - 1.) * 1.7), glow = exp(-dot(m * vec2(.9, 1.5), m * vec2(.9, 1.5)) * 9.);
  ridge *= ridge * ridge;
  col += csMoonC * exp(-z * .5) * (ridge * (.16 + 2. * glow) + .1 * n1 + .8 * glow * csS(.5, .75, n1 * .6 + n2 * .4) + 2.2 * csS(.75, 1.2, glow + .7 * n2 + .4 * n1 - .35));
 }
 return col;
}
// How far the rising water leans at a height over a coral.
float csBend(float h, float k) { return h * h * (.16 + .1 * uOwn[4]) + sat(h * 4.) * csSurge * sin(h * 5.5 + k * 1.9 - uTime * .31); }
// One bead: d is the place from its middle, r its size, c its colour, deep how much water lies before it.
vec3 csBead(vec3 col, vec2 d, float r, vec3 c, float deep, float lit) {
 float l = length(d), px = csPx * .8;
 if (l > r + px) return col;
 vec2 n = d / max(r, 1e-4);
 float top = sat(.45 + .55 * dot(n, vec2(-.5, .8))), lamp = csLit * sat(.6 + .6 * dot(n, vec2(.78, .5)));
 vec3 light = c * (mix(csMoonC, vec3(csMoonC.g), .75) * (.3 + .9 * top) * .7 + csLampC * lamp * 1.1 + vec3(.13, .1, .1) + lit);
 light += (csMoonC * .5 + .12) * csS(.4, .05, length(n - vec2(-.35, .4)));
 if (uOwn[7] > 0.) {
  light *= mix(1., .5 + .6 * csS(.3, 1., length(n)), CS_EGG);
  light = mix(light, c * c * .35 * (csMoonC + csLampC * lamp + .2), .8 * CS_EGG * csS(.5, .32, length(n - vec2(.1 * sin(r * 900.), -.16))));
 }
 return mix(col, mix(light, csWater * 1.2, deep), csS(r + px, r - px, l) * min(1., r / csPx * .9));
}
// The beads over one coral. b: its foot, how wide there, how many abreast. size: how far apart upward, a bead, water before it.
vec4 csNow; float csAir, csMany, csR, csDeep, csGlow; vec2 csAt, csLook; int csWho;   // the piece here; the bead that lies foremost here
float csHump(float x) { x = sat(1. - abs(x)); return x * x; }
void csRise(vec2 p, int k, vec4 b, vec3 size, float loud, float hit) {
 if (uOwn[7] != 0.) { size.xy *= CS_F; b.w = max(floor(b.w / CS_F + .5), 3.); }
 float h = p.y - b.y, fk = float(k), x = p.x - b.x * csWide, W = b.z * (1. + 5. * h * h), u = (x - csBend(h, fk)) / W;
 float ix = floor(u * b.w), hx = fract(ix * .618 + fk * .37);
 float y = (h - (.022 * uTime + .02 * uTravel) * (.75 + .5 * hx)) / size.x + hx * 17., iy = floor(y);
 vec2 rnd = hash22(vec2(ix + fk * 25., mod(iy, 731.))), cell = vec2(W / b.w, size.x);
 float rr = min(size.y * (1. + .35 * uOwn[3]) * (.3 + .8 * rnd.y * rnd.y), .36 * min(cell.x, cell.y));
 vec2 f = (vec2(u * b.w - ix, y - iy) - .5 - (rnd - .5) * (1. - 2.6 * rr / cell)) * cell;
 float hb = h - f.y, ub = u - f.x / W; // where the bead itself is
 f.x = x - csBend(hb, fk) - ub * b.z * (1. + 5. * hb * hb);
 // whether it has been let go
 float front = csHump((hb - .1 - .9 * (1. - uCue)) * 2.8) * uCue, crop = csHump((hb - .6 * (1. - hit)) * 2.5) * hit;
 float swarm = .6 + .5 * sin(hb * 13. - .29 * uTime + 5. * ub + fk * 2.);
 float amount = (.13 + .1 * uLevel + (1.5 + .7 * uEnergy) * loud * csAir + .3 * csNow.a + .9 * front) * csMany * swarm * (1. - .75 * ub * ub) + 1.2 * crop + .12 * csS(.1, 0., hb);
 float th = fract(rnd.x * 7.3 + rnd.y * 3.1 + .07);
 rr *= csS(th - .13, th + .07, amount) * csS(-.025, .02, hb) * step(abs(ub), 1.);
 if (rr > 0. && dot(f, f) < (rr + csPx) * (rr + csPx)) {
  csAt = f; csR = rr; csWho = k; csLook = rnd; csDeep = sat(size.z + .25 * hb);
  csGlow = .3 * loud * uEnergy + uKeys * csS(.9, .95, rnd.x) * 2. + 1.6 * crop + .6 * front;
 }
}
// A branching coral grown by folding: how far from its wood, how near a tip, how far from the beads on it, n which way the wood faces.
mat2 csTurn;
vec3 csTree(vec2 q, vec2 h, out vec2 n) {
 float s = 1., d = 9., tip = 0., pearl = 9., len = .25 + .06 * h.y;
 mat2 way = mat2(1.);
 n = vec2(0.);
 for (int i = 0; i < 6 && uVar < .5 && dot(q - vec2(0., .4), q - vec2(0., .4)) < .6; i++) { // nothing grows further off than this
  float t = sat(q.y / len), odd = fract(h.x * 7.7 + float(i) * .43) - .5;
  vec2 v = vec2(q.x, q.y - t * len);
  float e = (length(v) - .042 + .013 * t) / s;
  if (e < d) { d = e; tip = float(i) + t; n = v * way * 24.; }
  if (i > 2) pearl = min(pearl, length(vec2(abs(q.x) - .04, abs(q.y - .6 * len) - .03)) / s);
  float x = q.x + .08 * odd;
  way = csTurn * mat2(x < 0. ? -1. : 1., 0., 0., 1.) * way;
  q = 1.22 * csTurn * vec2(abs(x) - .015, q.y - len * (.8 + .3 * odd));
  s *= 1.22;
 }
 return vec3(d, tip / 6., pearl);
}
// A coral's flesh with the moon and the lamp on it.
vec3 csShade(vec3 base, vec2 n, float deep) {
 float lamp = csLit * sat(.35 + .75 * dot(n, csToLamp));
 float moon = sat(.06 + dot(n, vec2(-.45, .85)));
 return mix(base * (csMoonC * moon * .8 + csLampC * lamp * 1.3 + csWater * .35), csWater * .8, deep);
}
vec3 csStag(vec3 col, vec2 p, vec2 foot, float H, vec2 h, float lean, float deep, int k) {
 vec2 q = (p - foot) / H; mat2 bow = rot(lean);
 q = bow * (q + vec2(csSurge * .15 * q.y * q.y, 0.));
 float px = csPx * (1. + 1.5 * deep) / H, loud = csKind(k);
 vec2 n;
 vec3 t = csTree(q, h, n);
 if (t.x < px) {
  vec3 base = mix(vec3(.16, .1, .08), vec3(.95, .75, .62), csS(.6, 1., t.y)) * (1. + .25 * sin((q.x + q.y) * 150.));
  base = mix(base, base * .4 + uKind[k] * .4, .5 * loud * t.y);
  col = mix(col, csShade(base, n * bow, deep), csS(px, -px, t.x));
 }
 float r = .012 * csS(-.2, .6, sin(q.x * 9. - q.y * 11. + h.x * 20.)) * (1. - .4 * loud);
 if (t.z > r + px) return col;
 r = max(r, 1e-4);
 return mix(col, mix(csPearl(uKind[k], .5) * (csMoonC * .4 + csLampC * csLit + .1) * (1.4 - .9 * t.z / r), csWater, deep), csS(r + px, r - px, t.z) * sat(r * 250. - .1));
}
// The winding grooves of a brain coral lie where five waves of one length cancel: their sum, and its slope.
const vec2 CS_DIR[5] = vec2[5](vec2(.980, .199), vec2(.675, .738), vec2(.111, .994), vec2(-.496, .868), vec2(-.912, .410));
vec3 csMaze(vec2 q) {
 q += .35 * vec2(sin(q.y * 1.7 + 1.), sin(q.x * 1.9));
 vec3 s = vec3(0.);
 for (int i = 0; i < 5; i++) {
  float ph = dot(q, CS_DIR[i]) * 5. + float(i * i) * 2.1;
  s += vec3(cos(ph), -sin(ph) * CS_DIR[i]);
 }
 return s;
}
vec3 csBrain(vec3 col, vec2 p, vec2 c, float R, float grain, float deep, int k) {
 float tall = max(-uOwn[1], 0.), low = max(uOwn[1], 0.), loud = csKind(k);
 vec2 sz = R * vec2(1. - .3 * tall + .35 * low, .86 + .7 * tall - .2 * low);
 vec2 q = (p - c + vec2(0., .25 * R * tall)) / sz;
 float l = length(q) + .03 * sin(q.x * 7. + R * 40.) + .02 * sin(q.x * 17. + q.y * 5.);
 if (l > 1.05) return col;
 vec2 g = q * grain * (1. + .5 * l * l) + R * 30.;
 vec3 m = csMaze(g);
 float px = csPx * (1. + 2. * deep) / R, dip = exp(-m.x * m.x * 2.3), edge = l - 1. + .025 * dip;
 if (edge > px) return col;
 vec3 base = mix(vec3(.42, .18, .13), vec3(.02, .015, .02), dip);
 base = mix(base, base + uKind[k] * (1. - dip) * .2, .7 * loud) * (.8 + .4 * noise(g * 9.));
 col = mix(col, csShade(base, q * (.8 + .35 * l) - m.yz * m.x * dip * .5, deep), csS(px, -px, edge));
 // the beads waiting in it
 vec2 b = g * 1.6, ib = floor(b), h = hash22(ib + 3.), o = b - ib - .5 - (h - .5) * .5;
 vec2 wide = vec2(1. - .3 * tall + .35 * low, (.86 + .7 * tall - .2 * low) / .86);
 float cell = R / (grain * 1.6), r = .27 * min(wide.x, min(wide.y, 1.)) * csS(-.4, .5, sin(ib.x * .7 + R * 9.) * sin(ib.y * .9) + .7 * h.x - .3) * (1. - .35 * loud) * csS(1., .8, l);
 return csBead(col, o * cell * wide, r * cell, csPearl(uKind[k], h.y), deep, .15 * loud + (k == 4 ? uHits * 1.6 : 0.));
}
// Shelves of a table coral, one over the other.
vec3 csPlates(vec3 col, vec2 p, vec2 foot, float R, float deep, int k) {
 if (abs(p.x - foot.x) > R * 1.6 || p.y > foot.y + R * 1.3) return col;
 float px = csPx * (1. + 3. * deep), loud = csKind(k);
 for (int i = 0; i < 3; i++) {
  float fi = float(i), w = R * (1.1 - .23 * fi) * (1. + .2 * uOwn[1]);
  vec2 c = p - foot - R * vec2(.3 * sin(fi * 2.3 + .4), .3 + .36 * fi - .1 * fi * max(uOwn[1], 0.));
  float x = c.x / w, in_ = max(1. - x * x, 0.), tilt = R * .07 * x * sin(fi * 5. + .6);
  if (abs(x) > 1.1 || abs(c.y) > .36 * R) continue;
  float nap = .5 + .3 * sin(p.x * 340. + 5. * sin(p.x * 61. + fi * 2.)) * sin(p.x * 97. + fi) + .2 * sin(p.x * 150. + fi);
  float y = c.y - tilt - R * (.05 * x * x + .075 * nap * sqrt(in_)), d = max(max(y, tilt - R * (.03 + .24 * in_ * in_ * in_) - c.y), (abs(x) - 1.) * w);
  if (d < px) {
   float lift = csS(-.07 * R, 0., y);
   vec3 base = mix(vec3(.04, .035, .045), vec3(.34, .27, .24), lift * (.4 + .6 * nap));
   base = mix(base, base * .5 + uKind[k] * .35 * lift, .6 * loud);
   col = mix(col, csShade(base, vec2(0., 1.5 * lift - .5), deep), csS(px, -px, d));
  }
  float ix = floor(x * 26.), hx = hash11(ix + fi * 31.);   // the beads along its upper edge
  col = csBead(col, vec2((x * 26. - ix - .25 - .5 * hx) * w / 26., y - .004), .005 * csS(.1, .5, hx) * step(abs(ix + .5), 24.), csPearl(uKind[k], hx), deep, .2 * loud);
 }
 return col;
}
// A shoulder of the reef: lumps and heads, the far ones fading into the water.
vec3 csRidge(vec3 col, vec2 p, float y0, float slope, float seed, float deep) {
 float y = y0 + slope * p.x, d = -1.;
 if (p.y > y + .36) return col;
 if (p.y > y - .06) {
  float x = p.x * (3. + seed) + seed * 7., ix = floor(x), hx = hash11(ix + seed), f = x - ix - .5 - .2 * (hx - .5);
  float head = sqrt(max(.16 - f * f, 0.)) * (.25 + hx) * .3 * deep * (1. + .8 * max(-uOwn[1], 0.));
  d = p.y - y - .035 * deep * (1. + sin(p.x * 7. + seed * 3.)) - .06 * noise(vec2(p.x * 19., seed)) - .006 * sin(p.x * 83. + 2. * sin(p.x * 31.)) - head;
 }
 vec3 c = mix(csMoonC * (.012 + .04 * csS(-.03, 0., d)), csWater * .75, deep);
 return mix(col, c, csS(1., -1., d / (csPx + .012 * deep)));
}
// The diver, small, hanging in the water behind the lamp.
vec3 csDiver(vec3 col, vec2 p) {
 vec2 q = p - csLamp; float r2 = dot(q, q), kick = .006 * sin(uTime * .8);
 if (r2 > .04) return col;
 float d = min(csSeg(q, vec2(.018, .012), vec2(.06, .028), .009, .008), length(q - vec2(.011, .018)) - .0075);
 d = min(d, csSeg(q, vec2(.06, .028), vec2(.128, .037 + 2. * kick), .006, .003));
 d = min(d, csSeg(q, vec2(.06, .026), vec2(.128, .016 - 2. * kick), .006, .003));
 col += csLampC * .05 * exp(-r2 * 160.);
 col = mix(col, csWater * .15, csS(csPx, -csPx, d));
 return col + csLampC * (csS(.006, .002, sqrt(r2)) + .00003 / (r2 + .0002));
}
vec3 csReef(vec2 p) {
 float view = uOwn[2], murk = uOwn[4], day = max(uOwn[0], 0.), dark = max(-uOwn[0], 0.), w = csWide, lift = -.16 * view;
 csSurge = (.012 + .03 * uLow) * (1. + .8 * murk);
 csMoon = vec2(-.52 * w, .45);
 csLamp = vec2(.42 * w, -.02 - .12 * view);
 csMoonC = mix(vec3(.36, .62, .8), vec3(.62, .7, .85), .3 * uTone) * (.55 + .5 * uPad) * (1. - .85 * dark);
 csMoonC = mix(csMoonC, vec3(.85, 1.25, 1.1), day);
 csWater = mix(vec3(.006, .026, .06), vec3(.05, .42, .46), day) * (1. - .75 * dark);
 csWater = mix(csWater, vec3(.045, .1, .07) * (1. - .6 * dark + 2. * day), .75 * max(murk, 0.));
 csWater = mix(csWater, mix(vec3(.04, .045, .055), vec3(.4, .4, .43), day) * (1. - .6 * dark), .85 * max(-uOwn[5], 0.));
 csWater = mix(csWater, vec3(.5, .2, .5) * csWater.b, .8 * max(uOwn[5], 0.));
 if (abs(uOwn[6]) + abs(uOwn[7]) > 0.) {
  csWater = mix(csWater, uKind[0] * uKind[0] * mix(.12, .62, day) * (1. - .7 * dark), .8 * CS_DYE);
  csMoonC = mix(csMoonC, (uKind[1] * .9 + .12) * mix(.75, 1.25, day) * (.55 + .5 * uPad) * (1. - .85 * dark), .7 * CS_DYE);
 }
 csLampC = mix(vec3(1.5, .8, .36), vec3(1.3, 1.15, .9), uTone * uTone) * (.8 + .8 * uMic + .8 * dark) * (1. - .5 * day);
 vec2 d = csLamp - p; float r = length(d) + 1e-3;
 csToLamp = d / r;
 csLit = csS(.25, 1., dot(csToLamp, vec2(.78, .626))) / (.35 + r * r * 14.) + .012 / (.02 + r * r * 10.);
 csTurn = rot(-.42 - .14 * uOwn[1]);
 float haze = .12 * (uSpace - .5) + .15 * murk;
 vec3 col = csSea(p, .2 - .22 * view) + csLampC * csLit * .03;
 float up = CS_UP, dn = CS_DN;
 vec2 g = vec2(p.x, p.y - lift), pl = vec2(-.52 * w, -.36 + lift), th = vec2(-.14 * w, -.4 + lift), bo = vec2(.2 * w, -.36 + lift), br = vec2(-.32 * w, -.6 + lift), st = vec2(.62 * w, -.58 + lift);
 pl.y -= .6 * (up + dn); th.y -= .4 * dn; bo.y -= .5 * up - .02 * dn; br.y -= .6 * up; st.y -= .25 * dn;
 col = csRidge(col, g, -.12, .16, 1., .82 - haze);
 col = csRidge(col, g, -.2, .2, 2., .6 - haze);
 col = csDiver(col, p);
 col = csPlates(col, p, pl, .24, .3 - haze, 1);
 for (float i = 0.; i < 3.; i++) col = csStag(col, p, th + vec2(.13 * (i - 1.) * (1. + 1.3 * up), -.02 * i), .22 + .03 * sin(i * 2.) + .16 * up, vec2(.3 + .21 * i, .8 - .3 * i), .2 * (i - 1.), .25 - haze, 2);
 if (uOwn[6] < 0.) {
  col = csBrain(col, p, vec2(-.02 * w, -.2 + lift - .3 * (1. - dn)), .1, 1.9, .5 - haze, 1);
  col = csBrain(col, p, vec2(-.6 * w, -.34 + lift - .5 * (1. - dn)), .24, 3.1, .3 - haze, 2);
 }
 col = csBrain(col, p, bo, .2 + .06 * dn, 2.6, .16 - haze, 4);
 col = csBrain(col, p, br, .44, 6.2, 0., 0);
 if (uOwn[6] < 0.) col = csBrain(col, p, vec2(.66 * w, -.62 + lift - .5 * (1. - dn)), .42, 5.2, 0., 3);
 if (dn < .8) {
 col = csStag(col, p, st + vec2(-.18 - .86 * up, -.04 * up), .5 + .36 * up, vec2(.2, .3), .3, 0., 3);
 col = csStag(col, p, st + vec2(.2, 0.), .68 + .16 * up, vec2(.75, .6), -.1, 0., 3);
 col = csStag(col, p, st + vec2(.02 - .42 * up, -.03), .62 - .14 * up, vec2(.45, .9), .1, 0., 3);
 }
 col = csRidge(col, vec2(p.x, p.y - .5 * lift), -.53, .04, 3., 0.);
 csNow = piece(vec2(p.x / 1.78 + .5, .5 - p.y));
 csAir = .5 + .7 * band(p.y + .4); csMany = exp2(3. * uOwn[3]);
 csAt = vec2(9.); csR = csDeep = csGlow = 0.; csLook = vec2(0.); csWho = 0;
 p += vec2(.013 * sin(p.y * 11. - uTime * .23), -lift);
 csRise(p, 1, vec4(-.5, -.12, .15, 17.), vec3(.02, .0048, .35), uPad, 0.);
 csRise(p, 2, vec4(-.14, -.28, .13, 19.), vec3(.016, .004, .3), uTexture, 0.);
 csRise(p, 4, vec4(.2, -.26, .12, 12.), vec3(.026, .0075, .15), .3 * uHits, uHits);
 csRise(p, 0, vec4(-.32, -.3, .22, 16.), vec3(.038, .0095, .05), 1.6 * uDrone, 0.);
 csRise(p, 3, vec4(.64, -.18, .22, 13.), vec3(.042, .0105, 0.), uPhrase, 0.);
 return csBead(col, csAt, csR, mix(csPearl(uKind[csWho], csLook.y), csNow.rgb / max(csNow.a, .02) * .7 + .3, .35 * sat(csNow.a * 1.5)), csDeep, csGlow);
}
// The dawn sky, y up from the waterline.
vec3 csSky(float y, float x) {
 float day = max(uOwn[0], 0.), dark = max(-uOwn[0], 0.);
 y = max(y, 0.);
 vec3 c = mix(vec3(1.15, .56, .3), vec3(.85, .5, .47), csS(0., .16, y));
 c = mix(c, vec3(.42, .34, .5), csS(.1, .4, y));
 c = mix(c, vec3(.17, .19, .36), csS(.3, .85, y));
 c += vec3(.8, .35, .1) * exp(-y * 9. - (x + .2) * (x + .2) * 4.) * (.45 + .6 * uPad + .5 * uMic);
 vec3 noon = mix(vec3(.85, .9, .8), vec3(.1, .36, .6), csS(0., .6, y));
 vec3 night = mix(vec3(.15, .19, .28), vec3(.015, .028, .075), csS(0., .5, y));
 c = mix(mix(c, noon, day), night, dark);
 c = mix(c, dot(c, vec3(.33)) * vec3(.85, 1.08, 1.), .8 * max(-uOwn[5], 0.));
 if (abs(uOwn[6]) + abs(uOwn[7]) > 0.) c = mix(c, mix(uKind[1] * uKind[1] * 1.2, uKind[4] * uKind[4] * .8, csS(0., .5, y)) * (1. + .25 * day) * (1. - .7 * dark), .75 * CS_DYE);
 return c * mix(vec3(1.), vec3(1.12, .66, .62), max(uOwn[5], 0.)) * mix(vec3(1., .94, .9), vec3(1., 1.06, 1.1), uTone);
}
// Low cloud and the island, up y from the waterline.
vec3 csShore(vec2 q) {
 vec3 c = csSky(q.y, q.x);
 float bar = noise(vec2(q.x * 2.2 + uTime * .002, q.y * 26.)) * .6 + .4 * noise(vec2(q.x * 6., q.y * 60. + 4.));
 c = mix(c, c * vec3(.72, .62, .8), .75 * csS(.5, .75, bar) * csS(.02, .06, q.y) * csS(.34, .12, q.y));
 if (q.y > .085 + .36 * CS_UP) return c;
 float x = q.x / csWide + .4, on = csS(.46, .3, abs(x - .12));
 float hill = .042 * exp(-x * x * 60.) + .02 * exp(-(x - .16) * (x - .16) * 70.) + .017 * exp(-(x - .36) * (x - .36) * 160.);
 hill += (.012 * noise(vec2(q.x * 26., 1.)) + .009 * noise(vec2(q.x * 80., 3.))) * on - .005 - .02 * (1. - on);
 if (uOwn[6] > 0.) {
  float X = q.x / csWide, rough = .05 * noise(vec2(q.x * 14., q.y * 9.)) + .02 * noise(vec2(q.x * 60., q.y * 30.));
  for (int i = 0; i < 4; i++) {
   float fi = float(i), cx = i == 0 ? .46 : i == 1 ? .26 : i == 2 ? .68 : -.36, tall = (i == 0 ? .36 : i == 1 ? .17 : i == 2 ? .22 : .26) * CS_UP;
   hill = max(hill, (tall - rough) * csS(.07 + .02 * sin(fi * 5.), .025, abs(X - cx + .06 * q.y * sin(fi * 3.)) + rough * .4));
  }
 }
 hill -= .12 * CS_DN;
 vec3 land = mix(csSky(.02, q.x) * vec3(.45, .36, .5), csSky(.4, 0.) * .2, csS(-.004, .03, q.y));
 return mix(c, land, csS(csPx, -csPx, q.y - hill));
}
// How thick the slick lies at a place on the water, and the colour of the kinds there. All of it runs to the island.
vec4 csSlick(vec2 w) {
 float f = uOwn[1], z = w.y, lz = log2(max(z, .3)), far = exp2(.75 * lz), X = w.x + .3 * csWide * z;
 X += (.36 * sin(lz * 2.9 + .2) + .12 * sin(lz * 6.3 + 1.)) * far * (1. - .85 * max(f, 0.));
 vec2 wp = vec2(noise(vec2(X * 2.4, z * 1.3) + 3.), noise(vec2(X * 2.4, z * 1.3) + 11.)) - .5;
 X += .45 * wp.x;
 float curd = noise(vec2(X * 5.5, z * 3.2) + wp * 2.), best = 0., all = 1e-3, many = uOwn[3];
 vec3 hue = uKind[0] * all;
 for (int i = 0; i < 4; i++) {
  float fi = float(i), c = (i == 0 ? .55 : i == 1 ? -.75 : i == 2 ? -2.2 : 1.75) + .2 * sin(z * 1.3 + fi * 2.);
  float wide = (i == 0 ? .2 : .12) * (1. + .5 * sin(lz * 4. + fi * 3.)) * exp2(1.3 * many) * (1. + .12 * z);
  float d = csS(wide * 1.7, wide * .1, abs(X - c)) * (.4 + .9 * uEnergy * csKind(i) + (i == 0 ? .08 : .2) * sin(lz * 3.4 + fi * 4. + 1.));
  best = max(best, d); all += d * d; hue += uKind[i] * d * d;
 }
 float wisp = noise(vec2(X * 1.3, z * .4) + 20.);
 float wisps = csS(.56 - .2 * many, .8, wisp) * (.16 + .3 * uTexture + .3 * max(many, 0.));
 float floes = csS(.42 - .15 * many, .72, .7 * wisp + .3 * curd) * .9;
 best = max(mix(best, floes, max(-f, 0.)), wisps) * (.4 + curd);
 return vec4(hue / all, best * (1. + .4 * min(many, 0.)));
}
// A layer of beads lying on the water, in cells seen square at its distance.
vec3 csDots(vec3 col, vec2 p, vec2 w, float lev, float grow, vec4 sl, float gap) {
 float z0 = exp2(lev / .72 + .5), cell = .013 * exp2(lev);
 if (uOwn[7] != 0.) cell *= CS_F;
 vec2 size = vec2(cell, cell * z0 / .6);
 mat2 turn = rot(.5 + lev * .9);
 vec2 g = turn * (w / size) + lev * 17.;
 g.x += hash11(mod(floor(g.y), 619.));
 vec2 id = floor(g), h = hash22(mod(id, 619.) + .5);
 float big = fract(h.x * 7.1 + h.y * 11.3); big *= big;
 vec2 wb = w - ((g - id - .5 - (h.yx - .5) * (.85 - .6 * big)) * turn) * size;
 wb.y = max(wb.y, .05);
 vec2 o = p - vec2(wb.x / wb.y, p.y + .6 / w.y - .6 / wb.y); // seen round
 float reach = cell / w.y * (.12 + .26 * big) * grow, l = length(o);
 if (uOwn[7] > 0.) reach *= mix(1., .88 * w.y / wb.y * min(1., z0 / wb.y), CS_EGG); // whole in its cell
 if (l > 2. * reach + csPx) return col;
 if (uOwn[7] > 0.) sl = csSlick(wb); // as it lies at the bead
 vec4 m = piece(vec2(p.x / 1.78 + .5, .5 - p.y));
 float amt = sl.a * (.5 + 1.1 * band(1. - sat(log2(w.y) * .3 + .15))) + .9 * m.a * csS(.02, .2, sl.a);
 float dh = length((p - vec2(-.1 * csWide, -.21 + .3 * max(-uOwn[2], 0.))) * vec2(1., 2.));
 float hit = csHump((dh - .5 * (1. - uHits)) * 2.2) * uHits, cue = csHump((p.y + .36 - .6 * (1. - uCue)) * 4.) * uCue;
 amt = (amt + (1.2 * hit + .9 * cue) * csS(0., .1, sl.a)) * gap;
 float th = .85 * fract(h.x * 5.3 + h.y * 2.7 + .1), gate = csS(th - .08, th + .12, amt);
 float r = reach * gate;
 vec3 c = csPearl(sl.rgb, h.y), lowSky = csSky(.02, p.x);
 c = mix(c, m.rgb / max(m.a, .02) * .7 + .25, .35 * sat(m.a * 1.5));
 vec2 n = o / max(r, 1e-4);
 // the bead's own shade on the water, then the bead
 col *= 1. - .45 * csS(1.5, .5, length(n * vec2(.8, 1.) + vec2(0., .8))) * gate;
 vec3 b = c * (csSky(.25, 0.) * .7 + lowSky * (.2 + .9 * sat(.3 + .8 * n.y)) + 3. * hit + 1.4 * cue + 1.3 * uKeys * csS(.9, .95, h.x));
 b += lowSky * .6 * csS(.5, .1, length(n - vec2(-.1, .45)));
 if (uOwn[7] < 0.) b += c * CS_COLD * (.9 + 1.4 * amt * csKind(h.x < .5 ? 0 : 3)); // light of its own by night
 if (uOwn[7] > 0.) b = mix(b, c * c * .4 * lowSky, .75 * CS_EGG * csS(.5, .3, length(n - vec2(.0, -.15))));
 return mix(col, b, csS(r + csPx, r - csPx, l) * min(1., r / csPx));
}
vec3 csMorning(vec2 p) {
 float yH = .22 - .3 * uOwn[2], mist = max(uOwn[4], 0.), breeze = max(-uOwn[4], 0.);
 float veil = exp(-abs(p.y - yH) * 4.) * mist;
 vec3 col, fog = mix(csSky(.1, p.x), vec3(dot(csSky(.2, p.x), vec3(.33))), .4);
 if (p.y > yH) return mix(csShore(vec2(p.x, p.y - yH)), fog, sat(veil * 1.1));
 float down = yH - p.y, z = .6 / (down + .004);
 vec2 w = vec2(p.x * z, z);
 vec4 sl = csSlick(w);
 // the turtle, and its wake opening behind it to the right
 vec2 tu = vec2(.14 * csWide + 2. * CS_DN, yH - .17 + .003 * sin(uTime * .5)), q = (p - tu) * vec2(1., 2.6);
 float back = max(q.x + .01, 0.), side = abs(q.y + .35 * back), arm = side - .26 * back, fade = csS(.5, .05, back) * csS(0., .02, back);
 float gap = 1. - fade * csS(.02 + .02 * back, -.02, arm);
 float wk = exp(-arm * arm / (.00002 + .0012 * back * back)) * fade + .5 * fade * exp(-side * side * 900.) * sin(back * 120. - side * 60.);
 // ripples, smoothed where the slick lies
 float n1 = noise(vec2(w.x * 3., w.y * 5. - uTime * .25)) - .5, n2 = noise(vec2(w.x * 8. + uTime * .1, w.y * 13. + uTime * .3)) - .5;
 float paws = breeze > 0. ? breeze * csS(.35, .65, noise(vec2(w.x * .5 + .02 * uTime, w.y * .8))) : 0.;
 float rip = (n1 + (.5 + .6 * uHigh + paws) * n2) * (.11 + .07 * uLow) * (1. - .6 * mist + 1.5 * paws) * sat(1.1 - .9 * sl.a) * sqrt(sat(down * 2.));
 col = csShore(vec2(p.x, max(down * .95 + rip + .06 * wk, 0.)));
 col *= mix(vec3(.92), vec3(.5, .5, .62), csS(0., .7, down)) * (1. - .4 * paws * (.5 + n2));
 col += csSky(.02, p.x) * .3 * wk;
 // the film of the slick, then its beads, in two sizes that change places with distance
 float film = sl.a * gap;
 vec3 tint = csPearl(sl.rgb, .3);
 col = mix(col, tint * tint * csSky(.15, p.x) * .75, .6 * csS(.06, .6, film));
 if (uOwn[7] < 0.) col += tint * CS_COLD * .4 * film * film;
 if (sl.a > .01 || uOwn[7] > 0.) {
  float L = log2(z) * .72, l0 = floor(L), lf = L - l0;
  col = csDots(col, p, w, l0, csS(1., .5, lf), sl, gap);
  col = csDots(col, p, w, l0 + 1., csS(0., .5, lf), sl, gap);
 }
 // the turtle's head and the top of its shell
 vec2 t = p - tu;
 float hd = min(length(t * vec2(1., 1.3) - vec2(0., .003)) - .0075, length((t - vec2(.036, -.003)) * vec2(.5, 1.2)) - .012);
 col = mix(col, csSky(.5, 0.) * .14, csS(csPx, -csPx, max(hd, -.003 - t.y)));
 col = mix(col, fog, sat(veil * 1.1));
 // an oar's blade resting in the water at the edge of the boat
 vec2 o = rot(.62) * (p - vec2(.62 * csWide + .7 * CS_DN, -.36));
 float blade = max(abs(o.y) - .034 * csS(-.16, -.1, o.x) * csS(.2, .08, o.x) - .011, -.15 - o.x);
 if (blade > .05) return col;
 vec3 wood = mix(vec3(.16, .07, .035), vec3(.42, .22, .12), noise(vec2(o.x * 9., o.y * 130.))) * (csSky(.3, 0.) + .6 * csSky(.03, p.x) * csS(-.04, .04, o.y));
 float wet = p.y + .385 + .003 * sin(p.x * 60. + uTime * .7), dry = csS(-csPx, csPx, wet);
 col += csSky(.03, p.x) * .18 * exp(-wet * wet * 9000.) * csS(.03, 0., blade);
 col = mix(col, mix(mix(col, wood * .35, .6 * csS(-.1, 0., wet)), wood, dry), csS(csPx, -csPx, blade));
 return col;
}
vec3 render(vec2 p) {
 csPx = 1. / uRes.y;
 csWide = clamp(uRes.x / uRes.y / 1.78, .5, 1.1);
 return screenOf(uVar < .5 ? csReef(p) : csMorning(p));
}
