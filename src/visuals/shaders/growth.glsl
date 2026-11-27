// name: Growth
// a: Rings
// b: Delta
// what: The cut face of a trunk under a low light: each turn of the loop lays one more ring round the rim, thick and warm where the piece is loud, so the wood is the piece's own record; or a river delta seen from the air at dusk, its channels branching away toward the sea.
// follows: Once round the trunk is the loop and the rim grows where the music is now; ring after ring steps through the room from back to front; a sounding stroke makes its rings glow; a hit throws a shoot from the growing tip and a cue sends a swell in through the rings. In the delta the sounds flow out from the source at your feet, a hit runs a bright pulse down the channels, and the fuller the mix the further the water reaches.
// own: 0 1 many fine rings (b: channels), -1 few and broad; 1 the eye: 1 straight from above, -1 low and close; 2 the line: 1 in lobes like petals (b: wide bends), -1 straight edged and six sided (b: cracked in plates); 3 1 a pale day, rings as ink on paper, -1 dark, drawn only in its own light; 4 the stuff: 1 clear polished ice, -1 dry clay in deep relief; 5 age: 1 overgrown with moss (b: trees), -1 hollow in the middle (b: under flood); 6 1 two hearts grown together (b: spread over the whole plain), -1 the heart far to one side in great arcs (b: one narrow stream); 7 1 rises as a stepped hill (b: mountains beyond), -1 sinks as a bowl (b: mist)
#define grS smoothstep
#define grO0 uOwn[0]
#define grO1 uOwn[1]
#define grO2 uOwn[2]
#define grO3 uOwn[3]
#define grO4 uOwn[4]
#define grO5 uOwn[5]
#define grO6 uOwn[6]
#define grO7 uOwn[7]
const float GR_G = .12; // how much smaller each ring is than the one outside it
const float GR_R0 = .8; // the rim, where the newest wood is
float grSq(float x) { return x * x; }
vec3 grDeep(vec3 c) { return c * c * 1.15 + .004; }
vec3 grK0, grK1, grK2, grK3, grK4;
float grAny, grWide; // any own number brings the colours of the kinds in; how wide a ring is
// Where a place lies on the wood of another world; jac: how much larger it lies there.
vec2 grBent(vec2 Q, out float jac) {
 jac = 1.;
 if (grO6 > .0) { // z to z * z - c: two hearts in one trunk
  float w = grO6;
  Q.y *= 1. + .12 * w;
  vec2 z2 = vec2(Q.x * Q.x - Q.y * Q.y, 2. * Q.x * Q.y) - vec2(.2, .0);
  jac = length(Q * 2. * w / .62 + vec2(1. - w, .0));
  Q = mix(Q, z2 / .62, w);
 }
 if (grO6 < .0) Q = mix(Q, (Q + vec2(1.35, -.45)) * .32, -grO6);
 if (grO6 < .0) jac = 1. + .68 * grO6;
 return Q;
}
// How many rings in from the growing rim a place is (below 0 the wood is not grown yet); d is how long ago,
// in loops, the growing tip went by; a01 is the place in the loop; r how far from the heart.
float grRing(vec2 Q, out float d, out float a01, out float r) {
 if (grO6 != .0) { float j; Q = grBent(Q, j); }
 r = length(Q);
 vec2 rh = Q / max(r, 1e-4);
 if (grO2 > .0) {
  float an = r > 1e-4 ? atan(Q.y, Q.x) : .0;
  float lobe = abs(cos(an * 4. + 2.2 * r + .4 * sin(r * 9.)));
  r *= 1. - grO2 * .3 * (sqrt(lobe + .02) - .75) * grS(.0, .5, r);
 }
 if (grO2 < .0) {
  vec2 q = abs(rot(.12) * Q);
  r = mix(r, max(q.x, .5 * q.x + .866 * q.y) * 1.07, -grO2);
 }
 a01 = fract(atan(Q.y, Q.x) / TAU + .25);
 float x = -log(max(r, 1e-4) / GR_R0) / grWide;
 x += .5 * (noise(rh * 1.7 + 3.) - .5) + .5 * (noise(Q * 2.3 + 11.) - .5) * grS(.0, 4., x); // the trunk is not quite round
 float born = uTime / 16. - x; // some years the tree grew fast and some slow
 x += .2 * sin(born * 2.31 + 2. * sin(a01 * TAU)) + .25 * sin(born * .83 + 1. + sin(a01 * TAU * 2. + 1.));
 d = fract(uLoop - a01);
 return x - d;
}
// The dense band of a ring stands proud: fr is 0 at the ring's outer edge and 1 at its inner; loud rings have a wide band.
float grBand(float fr, float l) {
 float wl = .3 + .55 * l;
 return grS(.0, .12, fr) * grS(wl, wl * .3, fr);
}
float grHeight(float xr, float l) { float fr = fract(xr); return (.65 * grBand(fr, l) * (.3 + .7 * l) + .35 * (1. - fr) * (1. - fr) + .05 * sin(fr * 25.)) * step(.0, xr); }
vec3 grNow() {
 vec3 c = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
 return c / max(uDrone + uPad + uTexture + uPhrase + uHits, .3);
}
// What the rings are made of in another world.
vec3 grStuff(vec3 was, vec3 hue, float n, float fr, float l, float lateS, float grainD, float fine, vec2 Q, vec2 rh, float pale, float glass, float clay) {
 vec3 c = was;
 if (glass > .0) {
  float b = hash11(mod(n, 251.)), b2 = hash11(mod(n + 1., 251.));
  vec3 band = mix(grDeep(kindColour(b * 3.)), grDeep(kindColour(b2 * 3.)), grS(.2, 1., fr)) * (.45 + .75 * hash11(mod(n, 251.) + .5));
  band *= .72 + .28 * mix(.5, sin(fr * 19. + b * 30.) * .5 + .5, fine);
  band += .16 * grS(.12, .0, fr) * fine;
  band *= .85 + .3 * noise(Q * 4. + 9.);
  c = mix(c, mix(band, hue * hue * 1.2, .55 * l), glass);
 }
 if (clay > .0) {
  vec3 body = mix(grK1 * .8, grK0 * .6, grS(.1, .9, grainD));
  body = mix(body, hue * hue * .9, .6 * l) * (.8 + .25 * noise(Q * 33.) + .2 * noise(Q * 90.));
  c = mix(c, body, clay);
 }
 if (pale > .0) {
  float ink = max(lateS, .8 * grainD * grainD);
  vec3 sheet = mix(vec3(1.05, 1., .94), uKind[1], .18) * (.95 + .08 * noise(Q * 60.)) * (.92 + .08 * noise(rh * 46.));
  vec3 mark = mix(grK0 * .25 + .02, hue * hue * .8, sat(l * 1.4));
  c = mix(c, mix(sheet * mix(1., .6, glass), mark, ink * (.35 + .65 * fine)) * mix(vec3(1.), .4 + .8 * hue, .45 * l) + .2 * glass * c, pale);
 }
 return c;
}
// How high the wood stands at a place: flat, a hill or a bowl.
float grHill(vec2 P) { float r = sat(1. - length(P - vec2(.05, .0)) / 1.02); return grO7 * (grO7 > .0 ? .46 : .75) * r * (.45 + .55 * r); }
vec3 grRings(vec2 p) {
 vec3 ro = vec3(.0, .62, -.82);
 vec3 f = normalize(vec3(.0, -.62, .75));
 vec3 up = vec3(.0, f.z, -f.y);
 float eye = grO1;
 if (eye != .0) {
  ro = eye > .0 ? mix(ro, vec3(.04, 1.55, -.02), eye) : mix(ro, vec3(.0, .36, -.86), -eye);
  f = normalize(eye > .0 ? mix(f, vec3(.0, -1., .0), eye) : mix(f, vec3(.0, -.4, .9), -eye));
  up = vec3(.0, f.z, -f.y);
 }
 vec3 rd = normalize(f * .85 + p.x * vec3(1., .0, .0) + p.y * up);
 float pale = max(grO3, .0), dark = max(-grO3, .0), glass = max(grO4, .0), clay = max(-grO4, .0);
 float lies = max(pale, clay); // there is a ground it lies on
 vec3 far = mix(clay * (grK2 * .22 + .01) * (1. - dark), vec3(1.35, 1.3, 1.22), pale);
 if (rd.y > -.03) return far;
 float tHit = -ro.y / rd.y;
 if (grO7 != .0) { // a hill or a bowl
  float t = grO7 > .0 ? max((.5 - ro.y) / rd.y, .0) : tHit, back = t, end = grO7 > .0 ? tHit : (-.76 - ro.y) / rd.y, m;
  for (int i = 0; i < 40; i++) {
   if (ro.y + rd.y * t < grHill((ro + rd * t).xz)) break;
   back = t; t = min(t + .035 + .02 * t, end);
  }
  for (int i = 0; i < 6; i++) { m = .5 * (back + t); if (ro.y + rd.y * m < grHill((ro + rd * m).xz)) t = m; else back = m; }
  tHit = t;
 }
 vec2 P = (ro + rd * tHit).xz;
 float foot = tHit * tHit / (ro.y * .85 * uRes.y);
 vec2 Q = P - vec2(.05 + .02 * sin(uTime * .07), .03 * cos(uTime * .05));
 float d, a01, r, d1, a1, r1;
 float xr = grRing(Q, d, a01, r);
 vec2 rh = Q / max(r, 1e-4);
 float pitch = grWide * max(r, .04);
 if (grO6 != .0) { float j; grBent(Q, j); pitch /= max(j, .12); }
 float n = floor(xr), fr = xr - n;
 float born = uTime / 16. - d - n;
 float cyc = fract(born / 12.);
 float row = mix(.05, .95, 1. - abs(cyc * 2. - 1.));
 vec4 m = piece(vec2(a01, row));
 float join = min(a01, 1. - a01);
 if (join < .02) m = mix(.5 * (piece(vec2(.004, row)) + piece(vec2(.996, row))), m, grS(.0, .02, join));
 float l = sat(m.a * 2.2);
 vec3 hue = m.a > .004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.2 : vec3(.6, .45, .3);
 float live = grS(.35, 1., m.a);
 // relief and a low lamp on the far left
 float fine = grS(1.2, 4., pitch / foot);
 vec3 L = normalize(vec3(-.72, .3, .5));
 float e = .07 * pitch + foot * .5;
 float h0 = grHeight(xr, l);
 float ha = grHeight(grRing(Q + vec2(e, .0), d1, a1, r1), l), hb = grHeight(grRing(Q + vec2(.0, e), d1, a1, r1), l);
 float hs = grHeight(grRing(Q + normalize(L.xz) * .3 * pitch, d1, a1, r1), l);
 float k = .3 * pitch / e * fine;
 vec3 nrm = normalize(vec3(-(ha - h0) * k, 1., -(hb - h0) * k));
 if (clay > .0) nrm = normalize(mix(nrm, normalize(vec3(-(ha - h0) * k * 1.8, 1., -(hb - h0) * k * 1.8)), clay));
 if (grO7 != .0) {
  float hh = grHill(P);
  nrm = normalize(nrm + vec3(hh - grHill(P + vec2(.02, .0)), .0, hh - grHill(P + vec2(.0, .02))) * 38.);
 }
 float shade = 1. - .8 * sat((hs - h0) * 2.5) * fine;
 float dif = sat(dot(nrm, L)) / L.y * shade;
 float spec = pow(sat(dot(nrm, normalize(L - rd))), 24.) * shade;
 float pool = exp(-dot(P - vec2(-.4, .05), P - vec2(-.4, .05)) * 1.5);
 if (lies > .0 || grO6 != .0 || grO7 != .0 || eye > .0) pool = mix(pool, .35 + .45 * sqrt(pool), max(max(lies, abs(grO6)), max(abs(grO7), max(eye, .0))));
 // the wood
 float heart = grS(.0, .8, r / GR_R0);
 vec3 early = mix(vec3(.16, .055, .025), vec3(.34, .165, .055), heart);
 vec3 dense = mix(vec3(.04, .014, .008), vec3(.085, .03, .012), heart);
 vec3 lampHue = vec3(1., .82, .58);
 if (grAny > .0) {
  early = mix(early, grK1 * mix(.28, .5, heart), grAny);
  dense = mix(dense, grK0 * mix(.08, .16, heart), grAny);
  lampHue = mix(lampHue, mix(vec3(1.), uKind[1], .4), grAny);
 }
 float late = grBand(fr, l);
 float lateS = late * fine + .35 * (1. - fine);
 float grainD = mix(.4, max(late, pow(1. - fr, 2.5)) * .85 + .15 * (.5 + .5 * sin(fr * 25.)) * (1. - fr), fine);
 vec3 wood = mix(early, dense, grainD);
 wood *= .75 + .5 * noise(Q * 3.1 + 5.);
 wood = mix(wood, hue * (.25 + .4 * l), lateS * sat(l * 1.4) * .85);
 wood *= .74 + .5 * noise(rh * 46. + xr * .2);
 wood *= .88 + .24 * noise(Q * 70.);
 float ck = min(abs(fract(a01 - .37 + .012 * sin(xr * 2.)) - .5), abs(fract(a01 - .83 + .008 * sin(xr * 3.1 + 1.)) - .5)) * TAU * r;
 wood *= 1. - .8 * sat(1. - ck / (.003 + .014 * r)) * grS(.8, .3, r / GR_R0); // two drying cracks from the heart
 if (grAny > .0) wood = grStuff(wood, hue, n, fr, l, lateS, grainD, fine, Q, rh, pale, glass, clay);
 vec3 col = wood * lampHue * (.03 + pool * (.06 + 1.5 * dif));
 col += vec3(1., .8, .55) * spec * .3 * pool;
 if (grAny > .0) {
  if (glass > .0) {
   vec3 gn = normalize(nrm * vec3(.25, 1., .25)), rf = reflect(rd, gn);
   float lamp = pow(sat(dot(rf, normalize(vec3(.35, .75, .6)))), 26.) + .35 * pow(sat(dot(rf, normalize(vec3(-.7, .5, .35)))), 10.);
   vec3 inside = wood * (.35 + .5 * pool + .6 * l) * lampHue;
   col = mix(col, inside * 1.1 + vec3(1., .98, .95) * lamp * .5 * (.6 + .6 * uLevel), glass);
  }
  if (clay > .0) col = mix(col, wood * lampHue * (.1 + .9 * pool * dif * shade), clay * (1. - pale));
  if (pale > .0) col = mix(col, wood * (.35 + .85 * sat(dif)) * mix(1., 1.25, pool), pale * (1. - .75 * glass));
  if (dark > .0) {
   float w = foot * 1.2 / max(pitch, 1e-3), edge = min(fr, 1. - fr);
   float line = grS(.05 + w, .03, edge) * sat(.14 / (w + .05)) + .05 * exp(-edge * 9.) * fine;
   vec3 c = mix(mix(grK0, grK1, noise(vec2(n * .7, 3.))) * (.2 + .5 * noise(rh * 2. + n * .37)), hue * hue * 1.6, sat(l * 1.3));
   col = mix(col, c * line * (1.1 + 1.4 * l), dark);
  }
 }
 // what sounds now glows from inside its rings
 col += hue * hue * live * lateS * (.3 + .7 * heart) * 1.5;
 col += hue * live * .14 * (1. - lateS) * heart;
 float wave = uCue * exp(-grSq((xr - (1. - uCue) * 12.) / 1.3)); // a cue sends a swell in from the rim
 if (grAny > .0) {
  wave += .5 * grAny * uHits * exp(-grSq((xr - 3. - (1. - uHits) * 7.) / 1.3));
  col *= mix(vec3(1.), uKind[4] * .8, sat(wave) * pale);
 }
 col += mix(vec3(1., .7, .4), uKind[4] * uKind[4] * 2.5, .6) * wave * (.08 + .5 * late);
 float lit = 1. - .7 * pale;
 // the newest ring, brightest at the growing tip
 vec3 now = grNow();
 float tip = .07 * exp(-d * 5.) + exp(-d * 45.);
 float newest = step(n, .5);
 col += mix(vec3(.4, .7, .12), now * now * 2.4, .65) * lit * newest * (.03 + .5 * tip * (.3 + .7 * uLevel)) * (.05 + exp(-fr * 7.)) * (.6 + .8 * noise(rh * 46. + xr * .2));
 col += now * exp(-min(d, 1. - d) * 260.) * exp(-max(xr - .5, .0) * 1.1) * .5; // where new wood meets old
 if (pale > .0) col = mix(col, col * (.45 + .6 * now), pale * sat(newest * tip * 4. + exp(-min(d, 1. - d) * 160.) * exp(-max(xr - .5, .0))));
 // bark, and nothing beyond it
 float bx = -xr;
 if (grO0 != .0 || pale > .0) bx *= mix(grWide / GR_G, 2.2, .6 * max(grO3, .0));
 float bark = grS(1.55, 1.4, bx + .6 * noise(rh * 17.) + .25 * noise(rh * 60.));
 float bn = .6 * noise(vec2(a01 * 110., bx * 1.5)) + .4 * noise(Q * 40.);
 float moss = grS(.5, .75, noise(Q * 13. + 7.)) * (.5 + .5 * noise(Q * 60.));
 vec3 barkCol = mix(vec3(.16, .085, .05) * (.05 + 2. * bn * bn * bn), vec3(.1, .24, .05) * (.3 + bn), moss) * (.05 + (.3 + 1.2 * pool) * sat(.35 + .9 * dot(rh, normalize(L.xz)))) * grS(-.1, .4, bx);
 if (grAny > .0) {
  vec3 own = mix(grK0, grK1, .5) * (.12 + .5 * bn) * (.15 + (.3 + 1.2 * pool) * sat(.5 + .8 * dot(rh, normalize(L.xz))));
  own = mix(own, (uKind[0] * .5 + .08) * (.3 + 1.1 * bn * bn), pale);
  own = mix(own, barkCol, sat(grO5) * .6) * (1. - .85 * dark);
  barkCol = mix(barkCol, own, grAny);
  if (lies > .0) {
   float sh = grS(2.6, .3, bx) * sat(.6 + .6 * dot(rh, normalize(vec2(.72, -.5))));
   vec3 floor_ = mix(grK2 * (.1 + .5 * pool) * (.6 + .6 * noise(Q * 22.)), vec3(1.35, 1.3, 1.22) * (.97 + .05 * noise(Q * 60.)), pale) * (1. - .65 * sh);
   floor_ = mix(floor_, far, grS(1.2, 3.5, tHit));
   barkCol = mix(barkCol, mix(barkCol, floor_, 1. - bark), lies); bark = mix(bark, 1., lies);
  }
 }
 barkCol += lit * mix(vec3(.5, .75, .2), now * 1.5, .6) * exp(-max(bx, .0) * 22.) * (.03 + .5 * tip);
 if (grO5 != .0) {
  if (grO5 > .0) { // moss comes in over the wood from the rim
   float on = grS(.36, .5, fbm(rot(.6) * Q * 5. + 3.) + .34 * (r / GR_R0 - .7));
   float tuft = noise(Q * 90.) * .6 + noise(Q * 41.) * .4;
   vec3 mc = mix(grK2, grK3 * .8, grS(.4, .8, noise(Q * 8. + 20.))) * (.1 + .9 * tuft * tuft);
   col = mix(col, mc * mix(.15 + .9 * pool, 1.7, pale) * (1. - .8 * dark) + hue * live * lateS * .2, on * grO5);
  } else { // the heart is gone
   float edge = .36 * GR_R0 * (.92 + .16 * noise(rh * 2.3 + 5.)), in_ = grS(edge + .006 + foot, edge - .006, r) * -grO5;
   float depth = sat((edge - r) / edge), lip = sat(.5 - .7 * dot(rh, normalize(L.xz)));
   vec3 pit = wood * lampHue * .25 * exp(-depth * 5.) * lip;
   pit = mix(pit, far * (.35 + .65 * grS(.05, .6, depth * (.5 + lip))), lies);
   col = mix(col, pit, in_);
  }
 }
 col = mix(barkCol * bark, col, grS(-.03, .03, xr));
 // a hit throws a shoot from the growing tip
 float ta = (uLoop - .25) * TAU;
 vec2 tdir = vec2(cos(ta), sin(ta));
 vec2 tq = Q - tdir * GR_R0;
 float out_ = dot(tq, tdir), side = dot(tq, vec2(-tdir.y, tdir.x));
 float grow = sat(uHits * 1.4 + .8 * uCue);
 float len = .03 + .13 * grow;
 float stem = grS(.008, .002, abs(side - .25 * out_ * out_ / len)) * step(.0, out_) * step(out_, len);
 vec2 cv = vec2(out_ - len, side - .25 * len - .035);
 float cr = length(cv), ca = atan(cv.y, cv.x);
 float arm = abs(fract(cr / .022 - ca / TAU + .25 + .8 * grow) - .5) * .022;
 float curl = grS(.006, .002, arm) * grS(.037, .03, cr);
 vec3 shootCol = mix(vec3(.45, .9, .25), uKind[4] * 1.6, .4);
 col += shootCol * (max(stem, curl) * 1.5 + .45 * exp(-dot(tq, tq) / .01)) * grow;
 if (grAny > .0) return col * 1.15 * mix(exp(-max(tHit - 1., .0) * .35), 1., max(max(pale, clay * .6), max(eye, .0)));
 return col * 1.15 * exp(-max(tHit - 1., .0) * .35);
}
// The dusk sky: orange at the horizon, plum above it, then deep blue.
vec3 grSky(float y, float toSun) {
 vec3 c = mix(vec3(.85, .33, .07), vec3(.42, .12, .2), grS(.0, .08, y));
 c = mix(c, vec3(.09, .06, .2), grS(.04, .2, y));
 c = mix(c, vec3(.01, .025, .08), grS(.14, .5, y));
 c = c * (.25 + .75 * toSun) + vec3(1., .72, .36) * pow(toSun, 6.) * exp(-y * 14.) * 1.1;
 if (grAny > .0) {
  vec3 o = mix(grK2, grK1 * .7, grS(.0, .1, y));
  o = mix(o, grK0 * .35, grS(.05, .42, y));
  o = o * (.35 + .65 * toSun) + grK4 * pow(toSun, 6.) * exp(-y * 14.) * .9;
  if (grO3 < .0) o *= 1. + .94 * grO3;
  if (grO3 > .0) o = mix(o, mix(mix(vec3(1., .98, .95), uKind[2], .25) * 1.6, mix(vec3(1.), uKind[0], .55) * 1., grS(.0, .45, y)), grO3);
  c = mix(c, o, grAny);
 }
 return c;
}
// How far a place is from the crack between two plates.
float grCrack(vec2 c) {
 vec2 id = floor(c), f = fract(c);
 float a = 8., b = 8.;
 for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
  vec2 o = vec2(float(i), float(j)), v = o + .15 + .7 * hash22(id + o) - f;
  float d = dot(v, v);
  if (d < a) { b = a; a = d; } else b = min(b, d);
 }
 return sqrt(b) - sqrt(a);
}
// The land of the delta: below 1 is water, above it sand rising to the bars between the channels.
float grFoot;
float grLand(vec2 P, float reach) {
 vec2 rel = P - vec2(.0, -2.5);
 float rad = length(rel), ang = atan(rel.x, rel.y);
 float fan = grS(1., .45, abs(ang)) * grS(reach + 2., reach - 2., rad);
 float t = uTime * .006;
 if (grO6 > .0) fan = mix(fan, grS(reach + 6., reach, rad), grO6);
 if (grO6 < .0) fan = mix(fan, grS(.42, .1, abs(ang + .16 * sin(rad * .55))) * grS(reach + 2., reach - 2., rad), -grO6);
 vec2 c = vec2(ang * 6., rad * .55);
 if (grO6 > .0) c = mix(c, P * .62 + 1.7, grO6);
 if (grO6 < .0) c.x = mix(c.x, ang * 3.4 + 1.1 * sin(rad * .55), -grO6);
 if (grO0 != .0) c *= exp2(grO0 * .8);
 if (grO2 > .0) c += grO2 * .75 * vec2(sin(c.y * 2.3 + 1. + sin(c.x * .9)), .8 * sin(c.x * 2. + .5 * c.y));
 c += .4 * vec2(sin(c.y * 1.7 + .6 * sin(c.x * 1.3)), sin(c.x * 1.9 + .7 * sin(c.y * 1.1) + 2.));
 float w1 = abs(noise(c + vec2(3.7, -t)) - .5) * 2.;
 float w2 = abs(noise(rot(.5) * c * 2.6 + vec2(17.1, -t * 1.6)) - .5) * 2.;
 float w3 = abs(noise(rot(1.1) * c * 6.4 + vec2(41.3, -t * 2.4)) - .5) * 2.;
 if (grO2 < .0) {
  w1 = mix(w1, 1.25 * grCrack(c * .9 + vec2(3.7, -t)), -grO2);
  w2 = mix(w2, 1.3 * grCrack(c * 2.3 + vec2(17.1, -t)), -grO2);
 }
 float g2 = grS(4.5, 7.5, rad) * grS(.2, .05, grFoot), g3 = grS(7., 11., rad) * grS(.07, .02, grFoot);
 float thin = .04 * (1. - fan);
 float h = (w1 + thin) / (.2 * fan + 1e-3);
 h = min(h, (w2 + thin + .04 * (1. - g2)) / (.17 * fan * g2 + 1e-3));
 h = min(h, (w3 + thin + .04 * (1. - g3)) / (.14 * fan * g3 + 1e-3));
 if (grO5 < .0) h *= 1. + .62 * grO5;
 return h;
}
// Mountains beyond the plain.
vec3 grRange(vec3 sk, vec3 rd, float toSun, float pale) {
 float x = rd.x / max(rd.z, .2);
 for (int k = 0; k < 3; k++) {
  float fk = float(k), y = (.34 - .11 * fk) * grO7 * (.2 + 1. * fbm(vec2(x * (2.2 + 1.3 * fk) + 7. * fk + 2., 3. * fk)));
  float on = grS(y + .003, y - .003, rd.y);
  float lit = noise(vec2(x * 14. + rd.y * 40. + 9. * fk, rd.y * 26. - x * 9.));
  vec3 c = mix(grK0, grK1, lit) * mix(.5, .14, fk * .5) * (.5 + .7 * toSun) + grK2 * .12 * (2. - fk) * (.3 + toSun);
  c = mix(c, mix(vec3(1.2), uKind[0] * .8, .4 + .2 * fk) * (.75 + .35 * lit), pale);
  sk = mix(sk, mix(c, sk, .2 * (2. - fk) * grS(.06, .0, rd.y)), on);
 }
 return sk;
}
vec3 grDelta(vec2 p) {
 vec3 rd = normalize(vec3(p.x, p.y, 1.3));
 float eye = grO1, tall = 1.6;
 if (eye > .0) tall += 5.2 * eye;
 if (eye < .0) tall += .85 * eye;
 rd.yz = rot(-.22 - 1.12 * max(eye, .0) + .1 * max(-eye, .0)) * rd.yz;
 float pale = max(grO3, .0), dark = max(-grO3, .0), ice = max(grO4, .0), dry = max(-grO4, .0);
 vec3 sun = normalize(vec3(.3, .03, 1.));
 float toSun = sat(dot(normalize(vec2(rd.x, rd.z)), normalize(sun.xz)));
 toSun = pow(toSun, 5.);
 float dusk = .4 + .5 * grS(.3, 1., uLevel);
 if (rd.y > .0) {
  vec3 sk = grSky(rd.y, toSun);
  float cl = noise(vec2(rd.x * 2.5 + uTime * .004, rd.y * 34.)) * noise(vec2(rd.x * 7. + 3., rd.y * 60. + 5.));
  cl = grS(.22, .5, cl) * grS(.0, .05, rd.y);
  sk = mix(sk, sk * .55 + vec3(.9, .35, .12) * .25 * toSun * exp(-rd.y * 9.), cl);
  if (grAny > .0) {
   if (dark > .0) { vec2 g = rd.xy / max(rd.z, .2) * 34., st = hash22(floor(g)); sk = mix(sk, grSky(rd.y, toSun) + pow(st.x, 16.) * grS(.1, .0, length(fract(g) - .5 - (st - .5) * .6)) * 2., dark); }
   if (pale > .0) sk = mix(sk, mix(grSky(rd.y, toSun), vec3(1.7), .5 * cl) / dusk, pale);
   if (grO7 > .0) sk = grRange(sk, rd, toSun, pale);
   if (grO7 < .0) sk = mix(sk, grSky(.0, toSun) * 1.1, -grO7 * exp(-rd.y * 9.) * .9);
  }
  return sk * dusk;
 }
 if (grAny > .0) rd.y = min(rd.y, -1e-4);
 float t = tall / -rd.y;
 vec2 P = rd.xz * t + vec2(.15 * sin(uTime * .05), .0);
 if (eye > .0) P.y += 4.2 * eye;
 float reach = 8.5 + 8. * grS(.3, 1., uLevel) + 2. * uCue;
 float foot = t * t / (tall * 1.3 * uRes.y);
 float e = max(.012, foot * .6);
 grFoot = foot;
 float h = grLand(P, reach), hx = grLand(P + vec2(e, .0), reach), hz = grLand(P + vec2(.0, e), reach);
 float sea = grS(15., 22., P.y);
 float soften = .2 + 4. * foot;
 float water = max(grS(1. + soften, 1. - soften, h), sea);
 vec2 rel = P - vec2(.0, -2.5);
 float rad = length(rel), ang = atan(rel.x, rel.y);
 // the further down the channels, the longer ago
 float s = sat((rad - 4.) / 14.);
 s = sqrt(s);
 vec4 m = piece(vec2(fract(uLoop - s * .97), sat(.5 + ang * .75)));
 vec3 hue = m.a > .004 ? pow(m.rgb / m.a, vec3(1.4)) * 1.3 : vec3(.5);
 float l = sat(m.a * 1.6) * grS(1., .7, s);
 float kick = sat(uHits * 1.3);
 float pulse = kick * exp(-grSq((rad - 4. - (1. - kick) * 9.) / (.3 + .05 * rad)));
 vec3 nrm = normalize(vec3(-(min(hx, 2.6) - min(h, 2.6)), e * 5., -(min(hz, 2.6) - min(h, 2.6))));
 float bank = sat(dot(nrm.xz, normalize(sun.xz)) * 2.2);
 float wet = grS(5., 1., h);
 vec3 sand = vec3(.012, .011, .014) * (.4 + .8 * noise(P * 9.) * grS(.08, .01, foot));
 sand += vec3(1., .5, .22) * bank * .1 * grS(1.9, 1.15, h) * (.3 + .7 * toSun) * dusk + vec3(.02, .016, .03) * wet * dusk;
 float rip = mix(.5, noise(vec2(ang * 70., rad * 2.5 - uTravel * .6)), grS(.25, .03, foot));
 vec3 mirror = grSky(-rd.y * (.45 + .3 * rip), toSun) * dusk;
 mirror += vec3(1., .75, .4) * toSun * toSun * rip * rip * rip * exp(rd.y * 6.) * (.5 + 1.2 * uHigh);
 mirror *= .9 + .2 * noise(vec2(p.x * 5. + uTime * .01, log(t) * 16. - uTime * .02)) * sea;
 vec3 wat = mirror * (.5 + .5 * exp(rd.y * 4.)) * (.45 + .55 * grS(1.1, .3, h)) * (.8 + .4 * rip);
 wat += hue * hue * l * (.3 + 1.3 * l) * (1. - .7 * sea) * (.35 + .65 * grS(1.2, .2, h)) * (.7 + .6 * rip);
 wat += mix(vec3(1., .7, .4), uKind[4] * uKind[4] * 2.5, .6) * pulse * (.5 + .6 * rip);
 vec3 col = mix(sand, wat, water);
 col += hue * l * l * .1 * grS(7., 1., h) * (1. - water);
 if (grAny > .0) {
  float lean = sat(.5 + 2.6 * (nrm.x * -.8 + nrm.z * -.1)), grit = noise(P * 9.) * .6 + noise(P * 26.) * .4;
  grit = mix(.5, grit, grS(.08, .01, foot));
  vec3 k2 = grK2, k0 = grK0;
  vec3 land = k2 * (.04 + .3 * lean * lean * dusk) * (.55 + .8 * grit) * (1. - .5 * wet);
  vec3 flow = hue * hue * l * (.3 + 1.3 * l) * (1. - .7 * sea) * (.7 + .6 * rip);
  vec3 other = mix(land, wat, water) + hue * l * l * .1 * wet * (1. - water);
  if (dry > .0) {
   float deep = grS(1.25, .1, h) * (1. - sea);
   vec3 bed = k2 * (.1 + .75 * lean * lean) * (.5 + .8 * grit) * mix(vec3(1.), .55 + .4 * uKind[0], deep) * (1. - .7 * deep * (1. - lean));
   bed += hue * hue * l * deep * (.25 + .5 * grit) + grK4 * pulse * deep * .7;
   other = mix(other, mix(bed, k2 * .4, sea), dry);
  }
  if (ice > .0) { // snow and cracked ice
   float ck = min(grCrack(P * 1.6), 1.6 * grCrack(P * 4.3 + 9.)), crack = grS(.05 + foot * 3., .0, ck) * grS(.2, .03, foot);
   vec3 snow = mix(vec3(.9, .95, 1.), uKind[1], .25) * (.4 + .75 * lean) * (.85 + .3 * grit) * (.5 + .7 * dusk);
   vec3 frozen = mix(k0 * .35 + .02, mirror, .35) + flow * .8 + vec3(.75, .85, .95) * crack * (.16 + .4 * l) + grK4 * pulse * (.4 + crack);
   other = mix(other, mix(snow, frozen, water), ice);
  }
  if (pale > .0) {
   vec3 sheet = mix(vec3(1.05, 1., .93), uKind[2], .3) * (.75 + .6 * lean) * (.93 + .12 * grit);
   vec3 clear = mix(mix(vec3(.95), uKind[0], .75) * (.75 + .35 * rip), mix(vec3(1.), uKind[0], .4) * 1.2, sea);
   clear = mix(clear, (.15 + hue) * hue * 1.5, sat(l * 1.1) * (1. - sea)) * mix(vec3(1.), uKind[4], sat(pulse));
   clear *= .75 + .25 * grS(1.1, .6, h);
   vec3 day = mix(sheet, clear, water * (1. - .6 * dry));
   other = mix(other, day / max(dusk, .3) * .62, pale);
  }
  if (grO5 > .0) { // trees
   vec2 g = rot(.5) * P * 2. + .25 * sin(P.yx * 3.), hs = hash22(floor(g)), v = fract(g) - .5 - .2 * (hs - .5);
   float rr = .28 + .14 * fract(hs.x * 17.3), tree = max(1. - dot(v, v) / (rr * rr), .0), top = .5 + .5 * dot(v / rr, vec2(-.8, .4));
   float on = grS(1.35, 2.1, h) * (1. - sea) * grS(.0, .12 + foot * 4., tree) * grS(.35, .1, foot);
   vec3 leaf = mix(grK2 * .5, grK3, top * top) * (.1 + .9 * top) * (.35 + .6 * dusk) * (.6 + .7 * noise(P * 14.));
   other = mix(other, mix(leaf, leaf * 1.5 + .05, pale), on * grO5);
  }
  if (dark > .0) {
   float w = abs(h - 1.) / max(length(vec2(hx - h, hz - h)) / e, .6), line = exp(-grSq(w / (.012 + foot * .9)));
   vec3 c = mix(grK0 * .8, hue * hue * 1.6, sat(l * 2.)) * (.5 + 1.6 * l);
   other = mix(other, c * line * (1. - sea) + flow * water * .35 + grK4 * pulse * (line + .3 * water) + mirror * sea, dark);
  }
  col = mix(col, other, grAny);
 }
 // haze toward the horizon
 float haze = 1. - exp(-t * .006);
 col = mix(col, grSky(.0, toSun) * dusk * .7, haze * haze);
 if (grO7 < .0) {
  float bank = noise(vec2(P.x * .35 + uTime * .02, P.y * .5)) * .6 + .4 * noise(P * 1.1 - uTime * .015);
  col = mix(col, grSky(.0, toSun) * dusk * mix(.75, 1.1, bank), -grO7 * sat((1. - exp(-t * .09)) * (.35 + 1.1 * bank)));
 }
 return col;
}
vec3 render(vec2 p) {
 grK0 = grDeep(uKind[0]); grK1 = grDeep(uKind[1]); grK2 = grDeep(uKind[2]); grK3 = grDeep(uKind[3]); grK4 = grDeep(uKind[4]);
 grAny = sat(4. * max(max(max(abs(grO0), abs(grO1)), max(abs(grO2), abs(grO3))), max(max(abs(grO4), abs(grO5)), max(abs(grO6), abs(grO7)))));
 grWide = GR_G * exp2(-grO0 * (grO0 > .0 ? 1.1 : 1.35));
 if (uVar < .5) return screenOf(grRings(p));
 return screenOf(grDelta(p));
}