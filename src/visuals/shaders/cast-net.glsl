// name: Cast net
// a: Thrown open
// b: Lift nets
// what: A pearl-grey lake at sunrise: somebody in a wide hat stands in a flat boat and has thrown a net, which hangs in the air as a great ring of mesh with the sun through it, falls, and is drawn in. Or an estuary at dusk: shore nets on bent poles and long beams, held by stones, the near one dripping; a heron waits.
// follows: The fuller the music, the wider the net. The mesh shows the piece: round it or along it is the loop. Drone is mist and the sun's height, pad colour on the water, texture ripple, the phrase leans the net or dips a beam, bands light the weights or the drops. A hit is a ring of splashes; a cue a far throw, or the near beam dips. Keys are fish, a voice ripples.
// own: 0 a moonlit night at -1, a red dawn or dusk at 1; 1 white mist at -1, a dark storm at 1; 2 quite alone at -1, a fleet of boats, or a net on the other bank, at 1; 3 a low eye and a high sky at -1, a high eye and much water at 1; 4 a deep bell of a net, or a taut cloth, at -1, a flat open ring, or a deep bag, at 1; 5 seen from far off at -1, from very near at 1; 6 steep towers of rock stand round the water at -1, pads on the water and reeds before it at 1; 7 seen from under the water at -1, from straight above at 1
float cnPx, cnHz, cnTilt;
float cnFog, cnStorm;
vec2 cnSun;
vec3 cnTop, cnMid, cnLow, cnGlow, cnLit, cnDark;

float cnOn(float a, float b, float x) { return smoothstep(a, b, x); }
float cnOff(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float cnSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
 vec2 pa = p - a, ba = b - a;
 float h = sat(dot(pa, ba) / max(dot(ba, ba), 1e-6));
 return length(pa - ba * h) - mix(ra, rb, h);
}
// How far from a bent pole, or a slack rope.
float cnBow(vec2 p, vec2 a, vec2 b, float bow) {
 vec2 ba = b - a; float L = max(length(ba), 1e-4); ba /= L;
 vec2 q = vec2(dot(p - a, ba), dot(p - a, vec2(-ba.y, ba.x)));
 float h = sat(q.x / L), slope = bow * 4. * (1. - 2. * h) / L;
 return length(vec2((q.y - bow * 4. * h * (1. - h)) / sqrt(1. + slope * slope), q.x - h * L));
}
// Below a line on the water all is seen upside down.
vec2 cnTwice(vec2 q, float line, float shake) { return q.y < line ? vec2(q.x + shake, 2. * line - q.y) : q; }
float cnFill(float d) { return cnOff(-.5, .5, d / cnPx); }
float cnLine(float d, float w) { return cnOff(w - .5 * cnPx, w + .7 * cnPx, d) * min(1., w * 2. / cnPx + .35); }

// A net is a bowl: the place (x, y) of the cloth is seen at m * xy + k * (1 - (x*x + y*y) / s). The two places seen at q.
float cnRoots(vec2 q, mat2 m, vec2 k, float s, out vec2 one, out vec2 two) {
 mat2 im = inverse(m);
 vec2 w = im * (q - k), v = im * k / s;
 float a = dot(v, v), b = 2. * dot(w, v) - 1., c = dot(w, w), D = b * b - 4. * a * c;
 float Q = .5 * (-b + sqrt(max(D, .0)));
 one = two = vec2(9.);
 if (D < .0 || Q < 1e-4) return .0;
 one = w + v * (c / Q);
 two = w + v * (Q / max(a, 1e-4));
 return sat(D / max(length(4. * b * (v * im) - 8. * a * (w * im)) * cnPx, 1e-6));
}
// From a step on the cloth to a step in the picture, and slopes back.
mat2 cnLay(vec2 xy, mat2 m, vec2 k, float s, out mat2 back) {
 mat2 j = m - outerProduct(k, xy) * (2. / s);
 float det = determinant(j);
 back = mat2(j[1][1], -j[1][0], -j[0][1], j[0][0]) / (abs(det) < 1e-6 ? 1e-6 : det);
 return j;
}
// Threads where f crosses a whole number; g is how fast f runs across the picture.
float cnThreads(float f, vec2 g, out float dense) {
 const float width = .0008;
 float w = length(g) * cnPx, t = width * length(g);
 dense = cnOn(.16, .34, w);
 float d = abs(fract(f - .5) - .5) / max(w, 1e-5);
 float line = cnOff(width / cnPx - .4, width / cnPx + .8, d);
 return mix(line, min(.9, 2. * t + .6 * w), dense);
}

// The sky, and below it the water: the sky upside down, broken small, with a path of light under the sun.
vec3 cnGround(vec2 p, out float rip) {
 float d = max(cnHz - p.y, 1e-4), e = d / cnTilt, far = cnOn(.0, .16, d), wet = cnOff(-.005, .005, p.y - cnHz);
 vec2 w = vec2(p.x / (e + .12), log(e + .03));
 float a = noise(w * vec2(2.6, 6.) + vec2(sin(.05 * uTime), 2. * sin(.06 * uTime))) - .5;
 float b = noise(w * vec2(9., 24.) + vec2(cos(.07 * uTime), 3. * sin(.083 * uTime + 1.5))) - .5;
 rip = (a + b * (.35 + .8 * uTexture)) * far;
 vec2 up = p;
 if (p.y < cnHz) up = vec2(p.x + rip * .02, cnHz + abs(.95 * e + rip * (.06 + .07 * uTexture + .05 * cnStorm)));
 float h = up.y - cnHz, away = length((up - cnSun) * vec2(.8, 1.));
 vec3 c = mix(cnLow, cnMid, cnOn(-.02, .22, h));
 c = mix(c, cnTop, cnOn(.1, .62, h));
 c = mix(c, cnGlow, (1. - cnFog * .4) * (.6 * exp(-away * away * 22.) + .34 * exp(-away * 3.6)) * (1. - .5 * cnStorm));
 vec2 q = vec2(up.x * 1.1 + .006 * uTravel, h * 5.5 + .22 * up.x);
 float n = noise(q * 1.6) * .64 + noise(q * vec2(4.6, 5.6) + 3.) * .36;
 float bank = cnOn(.46 - .14 * cnStorm, .8 - .1 * cnStorm, n) * cnOn(.0, .2, h) * (1. - .6 * wet);
 c = mix(c, mix(cnTop * .86, cnGlow, .5 * exp(-2.4 * away)) * (1. - .25 * cnStorm), bank * (.45 + .4 * cnStorm) * (1. - cnFog));
 float disc = cnOff(-cnPx, cnPx, length(p - cnSun) - .047);
 c = mix(c, min(cnGlow * 1.14 + .06, 1.), disc * (1. - wet) * (.92 - .6 * cnFog) * (1. - .9 * cnStorm) * (1. - .5 * bank));
 if (uOwn[6] < .0) for (int i = 0; i < 3; i++) {
  float k = float(i), x = up.x * (2.3 - .45 * k) + 5.3 * k + .4, n1 = noise(vec2(up.x * 9., k * 7.)), id = floor(x), u = x - id - .5, t = hash11(id + 13. * k + 2.);
  u = abs(u + .10 * (n1 - .5)) / (.22 + .26 * t);
  float tall = -uOwn[6] * (.04 + .03 * n1 + (.10 + .4 * t * t) * max(1. - u * u * u * u, .0));
  float on = cnOn(-.004, .004, tall - h) * step(.0, h);
  c = mix(c, mix(mix(cnLow, cnMid, .6), mix(cnDark, cnTop, .25), (.22 + .27 * k) * (.35 + .65 * cnOn(.0, .16, h)) * (.85 + .3 * noise(vec2(up.x * 26., h * 9.))) * (1. - .5 * cnFog)), on);
 }
 c *= mix(1., mix(1., .72, cnOn(.0, .5, d)) + rip * .12, wet);
 float across = (p.x - cnSun.x + rip * .05) / (.05 + .22 * d), path = exp(-across * across);
 float glint = cnOn(-.1, .36, b + .4 * a + .1 * path) * far + (1. - far) * .4;
 c = mix(c, cnLit, wet * sat(path * (.22 + .75 * glint) * (1. - .75 * cnStorm) * (.85 - .5 * cnFog) + .2 * uCue * path));
 return mix(c, mix(cnLow, cnMid, .3), (.35 + .6 * cnFog) * exp(-abs(p.y - cnHz) * mix(40., 6., cnFog)));
}
// The colour the music lays on a thing at a place of the piece.
vec3 cnStain(vec3 c, vec4 m, float much) {
 float a = sat(m.a * (.7 + .8 * uEnergy));
 vec3 hue = m.rgb / max(m.a, .004);
 hue = mix(hue, hue * hue, .5);
 float l = dot(c, vec3(.3, .59, .11));
 return mix(c, hue * (.35 + .75 * l) + .1 * l, sat(a * much) * step(.004, m.a));
}

// One thrown net: its rim's middle, size, tilt and lean, and where its crown stands from there.
vec3 cnCast(vec3 col, vec2 p, vec2 c, float R, float ratio, float lean, vec2 k, float see) {
 vec2 q = p - c;
 if (see < .003 || length(q) > 1.1 * R + length(k) + .02) return col;
 mat2 m = rot(lean) * mat2(R, .0, .0, R * ratio);
 vec2 one, two;
 float hit = cnRoots(q, m, k, 1., one, two);
 if (one.y < two.y) { vec2 h = one; one = two; two = h; }
 for (int i = 0; i < 2 && hit > .0; i++) {
  bool near = i == 1;
  vec2 xy = near ? two : one;
  float s = dot(xy, xy);
  if (s > 1.4 || s < 1e-5) continue;
  float r = sqrt(s), th = atan(xy.y, xy.x);
  float edge = 1. + .035 * sin(3. * th + .23 * uTime) + .016 * sin(7. * th - .31 * uTime);
  r /= edge;
  mat2 G, J = cnLay(xy, m, k, 1., G);
  vec2 gr = G * xy / (r * edge * edge), gt = G * vec2(-xy.y, xy.x) / s;
  float inside = cnOff(-.5, .5, (r - 1.) / max(length(gr) * cnPx, 1e-5));
  float N = 72. / TAU, inner = max(r, .03), a = th * N, b = log(inner) * N * .85, dense;
  vec2 gA = gt * N, gB = gr / inner * N * .85;
  float u1 = cnThreads(a + b, gA + gB, dense), u2 = cnThreads(a - b, gA - gB, dense);
  float mesh = max(u1, u2), knots = u1 * u2 * (1. - dense);
  float gore = .5 + .5 * sin(11. * th + 2. * sin(2. * th) + .2 * uTime);
  float shine = exp(-dot(p - cnSun, p - cnSun) * 18.);
  float veil = ((near ? .05 : .12) + .13 * gore * cnOn(.1, .9, r) + .22 * cnOff(.0, .35, r)) * (1. - .7 * shine);
  float turn = fract(th / TAU + .75);
  vec2 mp = vec2(turn, .98 - .96 * min(r, 1.));
  vec4 mus = mix(piece(mp), piece(vec2(1. - turn, mp.y)), .5 * cnOn(.42, .5, abs(turn - .5)));
  vec3 cloth = mix(col, cnDark, veil * inside);
  cloth = cnStain(cloth, mus, .52 * inside);
  cloth = mix(cloth, mix(cnDark, cnGlow * .6, .6 * shine), mesh * inside * (near ? .75 : .26) * (1. - .45 * dense));
  cloth = mix(cloth, cnLit, knots * inside * sat(1.1 * mus.a + .3 * shine));
  cloth = mix(cloth, cnDark, cnLine(abs(r - 1.) / max(length(gr), 1e-5), .0014) * (near ? .9 : .5));
  float id = floor(th / TAU * 64. + .5), at = id / 64. * TAU, loud = band(.5 + .5 * sin(at));
  float bead = cnFill(length(J * (xy - edge * vec2(cos(at), sin(at)))) - min(.0032 + .0038 * loud, .04 * R) * (near ? 1. : .75));
  cloth = mix(cloth, mix(cnDark, mix(cnGlow, uKind[3], .4), .9 * sat(1.4 * loud)), bead);
  col = mix(col, cloth, see * hit);
 }
 return col;
}
// A net far out: a veil, its rope and a few threads.
vec3 cnVeil(vec3 col, vec2 p, vec2 c, float R, float lean, float see) {
 vec2 q = rot(-lean) * (p - c) / (R * vec2(1., .42));
 float r = length(q + vec2(.0, .12 * q.x * q.x)), th = atan(q.y, q.x + 1e-5) * 24., px = cnPx / (.6 * R);
 float threads = cnOn(.7, 1., max(sin(th + 15. * r), sin(th - 15. * r)));
 float a = cnOff(-px, px, r - 1.) * (.16 + .2 * threads * cnOn(.2, .8, r)) + .4 * (cnOff(.0, 1.5 * px, abs(r - 1.)));
 return mix(col, cnDark, see * a);
}
// A drop that falls at x from one height to another.
vec3 cnDrip(vec3 col, vec2 p, float x, float from, float to, float fall, float light) {
 float y = mix(from, to, fall * fall), thin = cnOff(.0005, .0005 + 1.4 * cnPx, abs(p.x - x));
 return mix(col, cnLit, sat(light) * thin * (cnOff(.0, .01 + .03 * fall, abs(p.y - y))) * sat((1. - fall) * 5.));
}
// The slow throw: gathered, opening, hanging, fallen, drawn in, gathered again.
vec4 cnPose(vec4 g, vec4 h, vec4 w, vec4 d, float t) {
 vec4 a = mix(g, h, cnOn(.05, .26, t));
 a = mix(a, w, cnOn(.66, .78, t));
 a = mix(a, d, cnOn(.84, .95, t));
 return mix(a, g, cnOn(.94, 1., t));
}
float cnMan(vec2 p) {
 float d = cnSeg(p, vec2(-.008, .0), vec2(-.002, .062), .007, .012);
 d = min(d, cnSeg(p, vec2(.022, .0), vec2(.008, .062), .007, .012));
 d = smin(d, cnSeg(p, vec2(.001, .058), vec2(.009, .122), .0165, .0185), .01);
 d = min(d, length(p - vec2(.013, .155)) - .0125);
 vec2 h = rot(.14) * (p - vec2(.013, .163));
 return min(d, max(abs(h.x) * .48 + h.y * .877 - .0245, -h.y - .003 + 1.2 * h.x * h.x));
}
// A long flat boat with somebody standing in it, at home round 0.
float cnBoat(vec2 p) {
 float u = abs((p.x + .12) / .44), bend = u * u * u * u;
 float hull = max(max(p.y - .022 - .042 * bend, -.02 + .085 * bend * u - p.y), u * .44 - .44);
 return min(hull * .9, cnMan(p - vec2(.02, .016)));
}
// The other boats: where, how far out, how large.
vec3 cnAfar(int i) { return i == 0 ? vec3(.66, .052, .42) : i == 1 ? vec3(-.47, .035, .36) : i == 2 ? vec3(-.84, .07, .48) : vec3(.62, .235, .78); }

// A ring of small splashes round a place on the water, as far out as grown.
float cnRing(vec2 e, float grown, float fine) {
 float r = length(e) - grown;
 return exp(-fine * r * r) * (.25 + .75 * pow(.5 + .5 * cos(40. * atan(e.y, e.x + 1e-5)), 3.));
}
vec3 cnPads(vec3 col, vec2 w, float px) {
 vec2 id = floor(w), h = hash22(mod(id, 97.) + 3.), v = w - id - .5 - (h - .5) * .3;
 float r = uOwn[6] * (.18 + .20 * h.x), l = length(v), there = cnOn(.36, .5, noise(id * .37 + 9.) + .25 * h.y), far = cnOn(.3, 1.2, px);
 float pad = mix(cnOff(r - px, r + px, l) * cnOn(-px, px, abs(atan(v.y, v.x + 1e-5) - 5. * h.y + 2.5) * l - .04), .4, far) * there;
 vec3 leaf = mix(uKind[2] * uKind[2], cnMid, .2) * dot(cnMid, vec3(.6)) * (.55 + .6 * l / max(r, 1e-4) + .3 * h.y);
 col = mix(col, leaf, pad * .94);
 float f = length(v - vec2(.05, .06)), pet = .12 + .03 * cos(6. * atan(v.y - .06, v.x - .0501));
 return mix(col, mix(cnLit, uKind[3], cnOn(.0, .1, f)) * dot(cnMid, vec3(.4)) * (1. + .4 * uPhrase), there * step(.72, fract(h.y * 7.7)) * cnOff(pet - px, pet + px, f) * (1. - far));
}
// What both pictures have on their water: the pad's colour, fish that flash for the keys, a ring for a hit.
vec3 cnOnWater(vec3 col, vec2 p, vec2 at) {
 float d = cnHz - p.y;
 if (d < .0) return col;
 float lie = noise(vec2(p.x * 1.6 - .02 * uTime, d * 9. / cnTilt + .013 * uTime));
 col = mix(col, col * (.35 + uKind[1]), uPad * cnOn(.35, .75, lie) * .6 * cnOn(.0, .1, d));
 if (uOwn[6] > .0) {
  float z = 1. / (d / cnTilt + .07);
  col = cnPads(col, vec2(p.x * z, .36 * z) * 2.6, cnPx * z * (.6 + z * .36) * 2.6);
 }
 vec2 e = (p - at) / vec2(.3, .051 * cnTilt);
 float o = length(e), ring = .75 + .9 * (1. - uHits);
 col = mix(col, cnLit, uHits * (.95 * cnRing(e, ring, 160.) + .42 * exp(-5. * (o - ring) * (o - ring))));
 col += .12 * uMic * sin(34. * o - 3. * uTime) * exp(-1.4 * o) * cnGlow;
 for (int i = 0; i < 3; i++) {
  float f = float(i);
  vec2 q = p - vec2(-.32 + .36 * f + .02 * sin(uTime * .13 + f * 2.), cnHz - (.2 + .06 * mod(f * 1.7, 2.)) * cnTilt);
  float fish = .4 * (length(q * vec2(1., 4.)) - .032), wink = sin(uTime * .7 + f * 1.6);
  col = mix(col, cnLit, (cnFill(fish) + .4 * exp(-60. * max(fish, .0))) * .8 * uKeys * (.4 + .6 * wink * wink));
 }
 return col;
}
vec3 cnThrown(vec2 p) {
 float rip;
 vec3 col = cnGround(p, rip);
 float t = fract(uTime / 45.), sea = cnHz - .27 * cnTilt;
 vec2 boat = vec2(-.6, cnHz - .31 * cnTilt + (.003 + .003 * uLow) * sin(.55 * uTime)), hand = boat + vec2(.044, .115);
 float deep = exp2(-uOwn[4]), open = 1. + .2 * (uLevel - .4) / .6;
 vec4 A = cnPose(vec4(hand + vec2(.004, -.1), .028, .4), vec4(.13, .1 + .01 * sin(uTime * .21), .34 * open, .52 + .13 * uOwn[4]), vec4(.13, sea, .36 * open, .17 * cnTilt), vec4(-.4, sea - .02, .05, .2), t);
 vec4 B = cnPose(vec4(-.004, .1, .0, 1.), vec4(-.15 * deep, .02 + .02 * deep, -.42 + .05 * sin(uTime * .17) + .12 * uPhrase, 1.), vec4(-.004, .006, .0, 1.), vec4(-.06, .06, .0, 1.), t);
 float sunk = cnOn(.77, .82, t) * cnOff(.87, .92, t), air = max(A.y - sea, .0);
 vec2 sh = vec2(A.x - .2 * air, sea - .14 * air * cnTilt);
 vec2 e = (p - sh) / (A.z * vec2(1., .17 * cnTilt));
 float net = cnOn(.1, .2, A.z), soft = .08 + air;
 if (p.y < cnHz) {
  col = mix(col, col * (.3 + .4 * cnMid), net * .62 * (cnOff(1. - soft, 1. + soft, length(e) + rip * .25)) * (1. - sunk));
  col = mix(col, cnLit, cnOn(.755, .775, t) * cnOff(.83, .92, t) * cnRing(e, 1. + .4 * cnOn(.76, .9, t), 320.));
 }
 col = cnOnWater(col, p, vec2(.1, sea - .05));
 for (int i = 0; i < 4; i++) {
  float there = i == 0 ? cnOn(-1., -.4, uOwn[2]) : cnOn(.0, .8, uOwn[2]);
  vec3 f = cnAfar(i); float sc = f.z;
  vec2 at = vec2(f.x + .02 * sin(.03 * uTravel + float(i) * 2.), cnHz - f.y * cnTilt), q = (p - at) / sc;
  q.x = (i == 0 || i == 3) ? -q.x : q.x;
  if (i == 1 || i == 2) {
   float lift = .5 + .5 * sin(.14 * uTime + 2.1 * float(i));
   col = cnVeil(col, p, at + sc * vec2(.56, .16 + .2 * lift), sc * (.28 + .14 * lift), -.35, there * .9);
   col = mix(col, cnDark, .6 * there * cnLine(cnSeg(p, at + sc * vec2(.05, .12), at + sc * vec2(.4, .15 + .2 * lift), .0, .0), .0006));
  }
  bool under = q.y < -.019;
  float k = cnPx / sc, dd = cnBoat(cnTwice(q, -.019, rip * .04));
  col = mix(col, mix(cnDark, cnMid, max(.0, .35 + .35 * cnFog + 3. * (.052 - f.y))), there * cnOff(-.5 * k, .5 * k, dd) * (under ? .5 * exp(q.y * 3.) : .92));
 }
 float c = uCue, up = 4. * c * (1. - c);
 vec2 land = vec2(.53, cnHz - .06 * cnTilt);
 if (c > .005) {
  float w = length((p - land) / vec2(1., .2 * cnTilt)) - .06 - .55 * (1. - c);
  if (p.y < cnHz) col = mix(col, cnLit, c * .7 * exp(-w * w * 900.));
  col = cnVeil(col, p, land + vec2(.0, .1 * c), .02 + .08 * cnOn(.0, .7, up), -.3 * c, cnOn(.0, .3, up));
 }
 vec2 q = p - boat;
 bool under = q.y < -.019;
 q = cnTwice(q, -.019, rip * .05);
 float rim = cnOn(-.001, .002, cnBoat(q + vec2(.0032, .0026)));
 col = mix(col, mix(cnDark, cnGlow, under ? .1 : .75 * rim), cnFill(cnBoat(q)) * (under ? .6 * exp(-2. * q.y) : 1.));
 vec2 crown = A.xy + B.xy; float rope = length(crown - hand);
 col = mix(col, cnDark, cnLine(cnBow(p, hand, crown, -.09 * rope), .0011) * .85 * cnOn(.01, .06, rope));
 float id = floor(p.x * 46.), h = hash11(id + 7.), u = (p.x - A.x) / max(A.z, .05);
 col = cnDrip(col, p, (id + .3 + .4 * h) / 46., A.y - A.z * A.w * sqrt(max(1. - u * u, .0)) - .8 * u * A.z * sin(B.z), sh.y, fract(uTime * .36 + h * 7.), (.4 + .8 * uTexture) * net * step(abs(u), .9) * cnOn(.02, .1, air));
 return cnCast(col, p, A.xy, A.z, A.w, B.z, B.xy, (1. - .45 * cnOn(.7, .77, t) * cnOff(.86, .92, t)) * (1. - sunk * .97));
}

// One shore net: a square cloth under four bent poles, on a beam that tips over its post and is held by stones.
vec3 cnLift(vec3 col, vec2 p, vec2 post, float sc, float tip, float haze, float deep) {
 vec2 l = (p - post) / sc;
 if (abs(l.x + .23) > 1. || abs(l.y + .06) > .8) return col;
 float px = cnPx; cnPx /= sc;
 mat2 turn = rot(-tip);
 vec2 ap = turn * vec2(-.58, .35), end = turn * vec2(.31, -.187);
 vec2 c = ap + vec2(.01 * sin(.4 * uTime + post.x * 9.), -.25);
 mat2 m = mat2(.33, .015, .1, .085 * cnTilt);
 vec2 k = vec2(.0, -.15 * deep), one, two;
 vec3 dark = mix(cnDark, mix(cnLow, cnMid, .5), haze);
 float hit = cnRoots(l - c, m, k, 2., one, two);
 if (one.y < two.y) { vec2 h = one; one = two; two = h; }
 for (int i = 0; i < 2 && hit > .0; i++) {
  vec2 xy = i == 1 ? two : one;
  if (max(abs(xy.x), abs(xy.y)) > 1.08) continue;
  mat2 G, J = cnLay(xy, m, k, 2., G);
  vec2 edge = (1. - abs(xy)) / max(vec2(length(G[0]), length(G[1])), 1e-5);
  float e = min(edge.x, edge.y), inside = cnOn(-.5, .5, e / cnPx), dense;
  float mesh = max(cnThreads(xy.x * 17., G[0] * 17., dense), cnThreads(xy.y * 17., G[1] * 17., dense));
  vec4 mus = piece(clamp(.5 + .48 * xy * vec2(1., -1.), .0, 1.));
  vec3 cloth = mix(col, dark, inside * (i == 1 ? .2 : .14));
  cloth = cnStain(cloth, mus, .58 * inside * (1. - .6 * haze));
  cloth = mix(cloth, dark, mesh * inside * (i == 1 ? .75 : .4));
  col = mix(col, mix(cloth, dark, cnLine(abs(e), .0022) * step(-.02, e)), hit);
 }
 float d = 1e3;
 for (int i = 0; i < 4; i++) {
  vec2 s = vec2(i < 2 ? -1. : 1., (i == 0 || i == 3) ? -1. : 1.);
  d = min(d, cnBow(l, ap, c + m * s, s.x * (s.y > .0 ? .035 : .06)) - .0042);
 }
 d = min(d, cnSeg(l, end, 1.04 * ap, .0125, .006));
 d = min(d, cnSeg(l, vec2(.0, .015), vec2(-.06, -.34), .009, .011));
 d = min(d, cnSeg(l, vec2(.0, .015), vec2(.06, -.34), .009, .011));
 d = min(d, cnSeg(l, vec2(-.2, -.222), vec2(.7, -.222), .007, .007));
 for (int i = 0; i < 4; i++) {
  float f = float(i);
  vec2 a = end * (.36 + .16 * f), b = a - vec2(.0, .055 + .02 * mod(f, 2.));
  d = min(d, min(cnSeg(l, a, b, .0016, .0016), length((l - b) * vec2(1., .85)) - .0155));
 }
 col = mix(col, dark, cnFill(d));
 cnPx = px;
 return col;
}
vec4 cnPlace(int i) { return i == 0 ? vec4(.6, 1., .0, .0) : i == 1 ? vec4(-.1, .5, .14, .3) : i == 2 ? vec4(-.44, .31, .3, .62) : i == 3 ? vec4(-.68, .2, .45, .0) : vec4(-.82, .74, .06, .8); }
float cnHeron(vec2 p) {
 vec2 b = rot(.5) * (p - vec2(.0, .075));
 float d = (length(b / vec2(.034, .0135)) - 1.) * .0135;
 d = min(d, cnSeg(vec2(abs(p.x + .001), p.y), vec2(.005, .0), vec2(.003, .07), .0016, .002));
 d = min(d, cnBow(p, vec2(.024, .088), vec2(.026, .125), -.012) - .0045);
 d = min(d, cnBow(p, vec2(.026, .125), vec2(.034, .152), .008) - .0036);
 return min(d, cnSeg(p, vec2(.036, .153), vec2(.076, .146), .0065, -.001));
}
vec3 cnShore(vec2 p) {
 float rip;
 vec3 col = cnGround(p, rip);
 float land = .012 + .02 * noise(vec2(p.x * 13., 2.)) + .02 * cnOn(.1, .9, p.x);
 float sh = abs(p.y - cnHz) + (p.y < cnHz ? rip * .02 : .0);
 col = mix(col, mix(cnDark, mix(cnLow, cnMid, .5), .55 + .3 * cnFog), cnOff(land - .002, land + .002, sh) * (p.y < cnHz ? .35 : .8));
 float deep = exp2(uOwn[4]), up = 4. * uCue * (1. - uCue);
 float tip0 = -.03 + .05 * sin(uTime * .13) + .16 * up;
 col = cnOnWater(col, p, vec2(.07, cnHz - .24 * cnTilt));
 for (int i = 4; i >= 0; i--) {
  vec4 n = cnPlace(i);
  float there = i == 0 ? 1. : i < 4 ? cnOn(-1., -.3, uOwn[2]) : cnOn(.0, .9, uOwn[2]);
  float yw = cnHz - .215 * n.y * cnTilt;
  vec2 post = vec2(n.x, yw + .27 * n.y);
  float turn = fract(uTime / 48. + n.w), dip = cnOn(.1, .3, turn) * cnOff(.5, .72, turn);
  float tip = i == 0 ? tip0 : (i == 4 ? .2 : .6) * dip - .03 + (i == 1 ? .25 * uPhrase * (1. - dip) : .0);
  vec2 q = cnTwice(p, yw, rip * .035 * (.4 + n.y));
  float side = i == 4 ? -1. : 1.;
  q.x = post.x + side * (q.x - post.x);
  if (there > .01) col = mix(col, cnLift(col, q, post, n.y, tip, sat(n.z * (.8 + cnFog)), deep), there * (p.y < yw ? .62 * exp((p.y - yw) * 1.4) : 1.));
  vec2 c = n.y * (rot(-tip) * vec2(-.58, .35) - vec2(.0, .25));
  c = post + vec2(side * c.x, c.y);
  float wet = sat((yw + .06 * n.y - c.y + .14 * n.y) / (.12 * n.y)), o = length((p - vec2(c.x, yw)) / (n.y * vec2(.36, .06 * cnTilt)));
  if (p.y < cnHz) col = mix(col, cnGlow, there * wet * .6 * exp(-50. * (o - 1.) * (o - 1.)));
 }
 float yw = cnHz - .215 * cnTilt;
 vec2 c = vec2(.6, yw + .02) + rot(-tip0) * vec2(-.58, .35);
 float id = floor((p.x - c.x) / .036 + 8.);
 float h = hash11(id + 3.), mid = c.x + (id - 7.5) * .036 + .012 * (h - .5), u = (mid - c.x) / .33;
 col = cnDrip(col, p, mid, c.y - .11 * deep * (1. - .6 * u * u) - .03, yw - .03, fract(uTime * .32 + h * 5.), step(abs(id - 7.5), 7.6) * (.3 + 1.8 * uBands[int(clamp(id, .0, 15.))] + .5 * uHits));
 vec2 m = cnTwice(p, yw, rip * .04) - vec2(.465, yw + .054);
 col = mix(col, cnDark, cnFill(.75 * cnMan(m / .75)) * (p.y < yw ? .5 : 1.));
 vec2 q = p - vec2(-.34, cnHz - .27 * cnTilt);
 bool under = q.y < .0;
 q = cnTwice(q, .0, rip * .03);
 float d = min(cnSeg(q, vec2(.0, -.02), vec2(.002, .052), .0085, .0075), cnHeron(q - vec2(.002, .056)));
 col = mix(col, cnDark, cnFill(d) * (under ? .55 : 1.));
 return col;
}
// The weather seen from above: open water, with the light lying on it.
vec3 cnSheet(vec2 p) {
 float a = noise(p * 3.1 + .02 * uTime) - .5, b = fbm(rot(.5) * p * vec2(9., 16.) + .07 * uTime) - .48, l = length(p - vec2(.45, .3));
 vec3 c = mix(cnMid, cnTop, .55 + .7 * a) * (.82 - .25 * cnStorm + .2 * a + .25 * b * (.6 + uTexture));
 c = mix(c, c * (.35 + uKind[1]), uPad * .5 * cnOn(.4, .8, noise(p * 2.2 - .02 * uTime)));
 return mix(c, cnLit, (.3 * exp(-3. * l) + .7 * exp(-1.8 * l) * cnOn(.08, .3, b)) * (1. - .7 * cnFog));
}
// A hat, and a boat, from above.
vec3 cnHat(vec3 col, vec2 m, float k, float there) {
 float r = length(m);
 return mix(col, mix(cnDark, cnGlow, .45 + .3 * dot(m, vec2(.5, .8)) / max(r, .01)), there * cnOff(-k, k, r - .05));
}
vec3 cnPlan(vec3 col, vec2 q) {
 float w = .052 - .28 * q.x * q.x, d = abs(q.y) - w;
 col = mix(col, col * .6, cnOff(-.01, .03, abs(q.y + .03) - w) * step(abs(q.x), .43));
 col = mix(col, mix(cnDark, cnGlow, .06 + .12 * step(d, -.008) * step(.12, abs(fract(q.x * 11.) - .5))), cnFill(d));
 return cnHat(col, q - vec2(.12, .0), cnPx, 1.);
}
vec3 cnAbove(vec2 p, bool a) {
 vec3 col = cnSheet(p);
 if (uOwn[6] > .0) col = cnPads(col, rot(.4) * p * 7.5 + 20., 7.5 * cnPx);
 float t = fract(uTime / 45.), deep = exp2(-uOwn[4]);
 vec2 e = p - (a ? vec2(.12, .02) : vec2(-.06, .02));
 col = mix(col, cnLit, uHits * .9 * cnRing(e, .30 + .25 * (1. - uHits), 900.) + .5 * uCue * exp(-pow(60. * (length(e) - .7 + .6 * uCue), 2.)));
 if (a) {
  vec2 boat = vec2(-.5, -.14) + .004 * sin(.4 * uTime), hand = boat + rot(-.35) * vec2(.14, .0);
  vec4 A = cnPose(vec4(hand, .03, .9), vec4(.14, .03, .36 + .07 * (uLevel - .4), .95), vec4(.14, .02, .40, .97), vec4(-.26, -.04, .06, .8), t);
  float net = cnOn(.1, .2, A.z);
  vec2 o = (p - A.xy - vec2(-.05, -.07)) / A.z;
  col = mix(col, col * .45, .6 * net * cnOff(.9, 1.1, length(o)) * cnOff(.66, .78, t));
  col = cnPlan(col, rot(.35) * (p - boat));
  vec2 crown = A.xy + vec2(-.10, .05) * deep;
  col = mix(col, cnDark, cnLine(cnBow(p, hand, crown, .02), .0011) * .85);
  return cnCast(col, p, A.xy, A.z, A.w, .1 * sin(uTime * .1) + .1 * uPhrase, crown - A.xy, 1.);
 }
 for (int i = 2; i >= 0; i--) {
  float k = float(i), there = i == 0 ? 1. : cnOn(-1., -.3, uOwn[2] - .8 * step(1.5, k)), sc = i == 0 ? 1. : .55 - .1 * k, px = cnPx / sc, dense;
  vec2 q = rot(i == 0 ? -.35 : .5 + 2. * k) * (p - (i == 0 ? vec2(-.08, .02) : i == 1 ? vec2(.62, .30) : vec2(-.66, -.28))) / sc, x = q / .27, y = abs(q), z = abs(x);
  if (there < .01) continue;
  vec2 xs = x * (1. + .12 * exp(-dot(x, x))), g = vec2(70. / sc, .0);
  float mesh = max(cnThreads(xs.x * 19., g, dense), cnThreads(xs.y * 19., g, dense));
  vec3 cloth = cnStain(mix(col, cnDark, .16 + .16 * exp(-dot(x, x) * (.6 + .5 * uOwn[4]))), piece(clamp(.5 + .48 * x, .0, 1.)), .6);
  cloth = mix(cloth, cnLit, .5 * uBands[int(clamp(x.x * 8. + 8., .0, 15.))] * mesh);
  col = mix(col, col * .5, there * .6 * cnOff(.9, 1.15, max(abs(x.x + .2), abs(x.y + .22))));
  col = mix(col, mix(cloth, cnDark, .7 * mesh), there * cnOff(-px * 4., px * 4., max(z.x, z.y) - 1. + .07 * (1. - min(z.x, z.y))));
  float d = min(abs(y.x - y.y) * .7 - .004 + step(.27, max(y.x, y.y)), cnSeg(q, vec2(.0), vec2(.86, .06 * uPhrase), .006, .012));
  d = min(d, max(abs(q.x - .62) - .13, abs(y.y - .09) - .014));
  for (int j = 0; j < 4; j++) d = min(d, length(q - vec2(.70 + .05 * float(j), .03)) - .016);
  col = cnHat(mix(col, cnDark, there * cnOff(-px, px, d)), q - vec2(.56, -.09), px, there);
 }
 return col;
}
vec3 cnUnder(vec2 p, bool a) {
 float top = .5 + p.y, t = uTime, rip = noise(vec2(p.x * 5. + sin(.1 * t), .7 / (.62 - min(p.y, .55)) * 3. + .1 * t));
 vec2 s = p - vec2(.22, .62);
 float ray = noise(vec2(atan(s.x, -s.y + 1e-4) * 13., .08 * t));
 vec3 col = mix(mix(cnDark, cnTop, .3), mix(cnTop, cnMid, .6), cnOn(-.1, 1., top)) * (.9 + .1 * uLevel);
 col = mix(col, cnLit, sat(.75 * exp(-3.2 * length(s * vec2(.8, 1.))) + (.30 + .4 * uPad) * cnOn(.35, .95, ray) * exp(-1.5 * length(s)) + .35 * rip * cnOn(.2, .5, p.y)) * (1. - .5 * cnStorm));
 vec2 h = p - vec2(-.48, .49 + .004 * sin(.5 * t));
 col = mix(col, cnDark, cnFill(.4 * h.x * h.x - .06 - h.y));
 float go = .5 + .5 * sin(.14 * t - 1.2), R = .36 + .05 * (uLevel - .4);
 vec2 c = a ? vec2(.10, .10 - .24 * go) : vec2(.05, -.04 - .05 * go);
 col = mix(col, cnLit, uHits * .85 * cnRing((p - c) / vec2(1., .5), .28 + .3 * (1. - uHits), 600.));
 for (int i = 0; i < 12; i++) {
  float k = float(i), an = k * .83 + .05 * t + .5 * sin(k * 3.), z = .5 + .5 * hash11(k + 4.);
  vec2 q = p - c - vec2(.62 * cos(an), -.20 + .16 * sin(an) + .08 * sin(k * 5.)); q.x *= -sign(sin(an) + 1e-4); z *= 1.5; q /= z * (.4 + .6 * abs(sin(an)));
  float w = min((length(q * vec2(1., 3.2)) - .05) * .4, max(abs(q.y) - .45 * (q.x - .035), abs(q.x - .055) - .02));
  col = mix(col, mix(mix(cnDark, col, .9 - .5 * z), cnLit, sat(.8 * uKeys)), cnOff(-cnPx, cnPx, w * z));
 }
 if (!a) return cnLift(col, p, c + vec2(.99, -.14), 1.75, .04 * sin(.13 * t) + .04 * uPhrase, .0, exp2(uOwn[4]));
 vec2 k = vec2(-.12 + .05 * sin(.17 * t), .30 * exp2(-uOwn[4]));
 col = mix(col, cnDark, .8 * cnLine(cnBow(p, c + k, vec2(-.40, .46), .03), .0012));
 return cnCast(col, p, c, R, .30 + .12 * uOwn[4], -.14 + .1 * uPhrase, k, 1.);
}
vec3 cnReeds(vec3 col, vec2 p) {
 for (int i = 0; i < 3; i++) {
  float k = float(i), n = 15. + 7. * k, y = p.y + .52;
  for (int j = -1; j <= 1; j++) {
   float id = floor(p.x * n + .5 * k) + float(j), h = hash11(id + 31. * k), h2 = hash11(id * 1.7 + 5. + k), c = (id + .2 + .6 * h - .5 * k) / n;
   float tall = uOwn[6] * (.10 + .30 * h2 + .30 * cnOn(.1, .75, abs(c + .08))) * (1. - .18 * k), v = y / max(tall, 1e-3);
   float x = p.x - c - ((h - .5) * .22 + .02 * sin(.4 * uTime + 6. * h)) * y * v, w = .0032 * (1. - .8 * v), hd = (length(vec2(x, (y - tall * .95) * .22)) - .0075) * step(.6, h2);
   float d = max(abs(x) - w, y - tall); if (h2 > .6) d = min(d, hd);
   col = mix(col, mix(cnDark, cnMid, .32 - .14 * k + .2 * cnFog), cnFill(d));
  }
 }
 return col;
}
void cnMix(float w, vec3 t, vec3 m, vec3 l, vec3 g, vec3 d) {
 cnTop = mix(cnTop, t, w); cnMid = mix(cnMid, m, w); cnLow = mix(cnLow, l, w); cnGlow = mix(cnGlow, g, w); cnDark = mix(cnDark, d, w);
}
vec3 render(vec2 p) {
 bool a = uVar < .5;
 float fit = max(1., 1.45 * uRes.y / uRes.x), zoom = fit * exp2(-.6 * uOwn[5]);
 cnPx = zoom / uRes.y;
 p = p * zoom + vec2(a ? -.02 : .05, .0) * uOwn[5];
 cnTop = cnMid = cnLow = cnGlow = cnDark = vec3(.0);
 if (a) cnMix(1., vec3(.62, .67, .72), vec3(.8, .81, .81), vec3(.92, .87, .8), vec3(1., .89, .7), vec3(.15, .14, .15));
 else cnMix(1., vec3(.45, .45, .56), vec3(.9, .66, .53), vec3(.98, .79, .57), vec3(1., .86, .6), vec3(.09, .06, .07));
 cnMix(sat(-uOwn[0]), vec3(.03, .05, .1), vec3(.09, .14, .22), vec3(.22, .29, .35), vec3(.8, .86, .9), vec3(.015, .02, .035));
 cnMix(sat(uOwn[0]), vec3(.28, .16, .3), vec3(.78, .3, .24), vec3(.97, .56, .28), vec3(1., .82, .48), vec3(.1, .03, .06));
 cnStorm = sat(uOwn[1]);
 float mist = sat(-uOwn[1]);
 cnMix(.75 * cnStorm, vec3(.16, .2, .23), vec3(.34, .4, .41), vec3(.74, .76, .68), vec3(.86, .87, .76), vec3(.06, .07, .08));
 vec3 pale = vec3(.5 * dot(cnMid, vec3(.33)) + .5 * cnMid + .06);
 cnMix(.75 * mist, pale, pale * 1.03, pale * 1.05, min(pale * 1.14, 1.), mix(cnDark, pale, .3));
 cnFog = sat(.1 + .8 * mist + .25 * uDrone + .1 * uSpace - .15 * cnStorm);
 cnGlow = min(cnGlow * (.97 + .08 * uTone + .06 * uLevel), 1.);
 cnLit = min(cnGlow * 1.12, 1.);
 cnHz = (a ? .05 : -.06) + .19 * uOwn[3];
 cnTilt = 1. + .5 * uOwn[3];
 cnSun = a ? vec2(.25, cnHz + .15 + .03 * uDrone) : vec2(-.22, cnHz + .055 + .03 * uDrone);
 vec3 col = vec3(.0);
 if (abs(uOwn[7]) < 1.) { col = a ? cnThrown(p) : cnShore(p); if (uOwn[6] > .0) col = cnReeds(col, p); }
 if (uOwn[7] > .0) col = mix(col, cnAbove(p, a), cnOn(.0, 1., uOwn[7]));
 if (uOwn[7] < .0) col = mix(col, cnUnder(p, a), cnOn(.0, 1., -uOwn[7]));
 return col;
}
