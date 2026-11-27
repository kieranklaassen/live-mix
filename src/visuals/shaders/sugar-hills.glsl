// name: Sugar hills
// a: Iced buns
// b: Sweet counter
// what: Iced buns as big as hills on a pale pink tray, seen from crumb height: icing has run down in thick lobes, sprinkles throw small shadows, far buns go soft, and one cherry has rolled off. Or glass jars of balls and tube slices before a bright street, their colour lying on the marble.
// follows: Each kind ices its own bun, lower as it is louder, or fills its own jars; the bands set how long drips are and how bright sweets. The piece tints sprinkles or sweets. A hit drops fresh sprinkles, or a sweet; a cue pours a new coat over the near bun, or sends a shaft of sun along. Keys light sprinkles or glass, a voice the wall or marble.
// own: 0 dark cocoa at -1, white sugar at 1; 1 flat rings, or round bowls, at -1, tall domes, or narrow jars, at 1; 2 night with one warm lamp at -1, low gold sun at 1; 3 hardly iced, or nearly empty, at -1, iced far down, or full, at 1; 4 combed white icing on a checked cloth, or tiny beads, at -1, thick with big ones, or great balls, at 1; 5 near and low at -1, farther off at 1
vec3 suL, suSun, suAmb; // towards the sun, its light, the room's light
vec3 suAt[2]; // the two near buns: across, away, radius
vec3 suIc[4]; // the icing of each bun, the sweets of each jar
float suLv[4]; // how loud each kind is
vec4 suForm; // a bun's profile: ring, half width, half height, height of its waist
float suPx, suAns, suStrewn, suFine, suAo, suDark, suSnow, suNt, suGold;
float suS, suCoat; vec2 suTh; // of the last place asked: inside the icing, inside a fresh coat, where on the bun
const vec3 suCh = vec3(1.3, .21, 1.15); // the cherry
const float suChR = .21;
float suE(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
vec2 suE(vec2 a, vec2 b, vec2 x) { return vec2(suE(a.x, b.x, x.x), suE(a.y, b.y, x.y)); }
float suSq(float x) { return x * x; }
float suBell(float x) { return exp(-x * x); }
float suH(float n) { n = fract(n * .1031); n *= n + 33.33; n *= n + n; return fract(n); }
vec3 suInk(vec3 c) { return c * c * 1.2 + .02; }
vec3 suGround(vec3 c, vec3 dark, vec3 snow) { return mix(mix(c, dark, suDark), snow, suSnow); }
// The hour and the colours.
void suLight() {
 suPx = 1. / uRes.y;
 suAns = .55 + uEnergy;
 suDark = sat(-uOwn[0]); suSnow = sat(uOwn[0]);
 suNt = sat(-uOwn[2]); suGold = sat(uOwn[2]);
 suSun = mix(mix(vec3(2.6, 2.25, 1.75), vec3(2.5, 1.3, .62), suGold), vec3(1.15, .5, .17), suNt);
 suAmb = mix(mix(vec3(.42, .46, .6), vec3(.46, .33, .48), suGold), vec3(.06, .1, .27), suNt);
 suIc[0] = vec3(.4, .64, .6); suIc[1] = vec3(.8, .33, .38); suIc[2] = vec3(.86, .63, .3); suIc[3] = vec3(.54, .62, .34);
 suLv[0] = uDrone; suLv[1] = uPad; suLv[2] = uTexture; suLv[3] = uPhrase;
 for (int k = 0; k < 4; k++) {
  suLv[k] = sat(suLv[k] * suAns);
  vec3 c = mix(suIc[k], suInk(uKind[k]) * .8 + .1, .1 + .55 * suLv[k] * suLv[k]);
  suIc[k] = mix(suGround(c, vec3(.1, .038, .02) + .07 * c, vec3(.86)), c, .12 * suSnow);
 }
}
// How far inside the icing a place is: a cap with drips, each as long as its band.
float suIce(float th, float ph, int k, out float tip) {
 float n = k == 0 ? 19. : 13., sd = float(k) * 41., u = th / TAU * n, c0 = floor(u - .5);
 float cap = .84 + .22 * suLv[k] + .06 * uLevel + .32 * uOwn[3];
 float s = cap + .05 * sin(th * 3. + sd) - ph;
 tip = 0.;
 for (int i = 0; i < 2 && s < .3; i++) {
  float c = c0 + float(i), id = c - n * floor(c / n);
  float h = suH(id * 7.3 + sd + 1.), h2 = fract(h * 57.31);
  float x = (u - c - .5 - .5 * (h2 - .5)) * TAU / n, rho = (.2 + .17 * h2) * TAU / n;
  float len = (.1 + .62 * h * h + .3 * suLv[k] * h2 + .36 * suAns * uBands[int(id) % 16] * h) * (1. + .7 * uOwn[3]);
  float low = ph - cap - len;
  if (low > .3) continue;
  float bulb = 1. / (1. + 60. * suSq(low + .07)); bulb *= bulb;
  if (k == 0 && id > 2.5 && id < 3.5) rho *= 1. + .3 * bulb * (.5 + .5 * sin(uTime * .31));
  float d = rho * (.72 + .3 * bulb) - length(vec3(x, max(low, 0.), .03));
  tip += bulb * suE(-.02, .06, d);
  s = -smin(-s, -d, .11);
 }
 return s;
}
float suB(float y) { return suForm.z * (y < suForm.w ? 1.45 : 1.); } // a flat foot
// How far off a bun's surface is; q is in bun radii.
float suBun(vec3 q, int k) {
 vec2 ab = vec2(suForm.y, suB(q.y)), e = vec2(length(q.xz) + 1e-4 - suForm.x, q.y - suForm.w) / ab;
 float L = length(e) + 1e-4, g = length(e / ab) / L, tip;
 suS = -9.; suCoat = 0.;
 float most = uCue > .002 ? 1.13 : 1.085;
 if (L > most + .05) return (L - most) / g;
 suTh = vec2(atan(q.x, -q.z), abs(atan(e.x, e.y)));
 suS = suIce(suTh.x, suTh.y, k, tip);
 float w = sat(suS / .13), thick = (.052 + .03 * tip) * sqrt(w * (2. - w));
 if (k == 0 && uCue > .002) {
  // a new coat runs down over the near bun
  float c = .2 + 2.6 * (1. - uCue) + .12 * sin(suTh.x * 5. + 1.) + .07 * sin(suTh.x * 11.) - suTh.y, stay = suE(0., .35, uCue);
  w = sat(c / .12);
  suCoat = suE(0., .02, c) * stay;
  thick += .045 * sqrt(w * (2. - w)) * stay;
 }
 return (L - 1. - thick) / g;
}
vec3 suSc() { return vec3(suForm.x + suForm.y, suForm.z, suForm.x + suForm.y); }
// The sunlight that gets past the buns and the cherry; suAo is how open a place on the tray is.
float suSh(vec3 pos, int me) {
 float lit = 1.; suAo = 1.;
 for (int k = 0; k < 3; k++) {
  if (k == me) continue;
  vec3 c = suCh, rr = vec3(suChR);
  if (k < 2) { c = vec3(suAt[k].x, suForm.w * suAt[k].z, suAt[k].y); rr = suSc() * suAt[k].z; }
  vec3 o = (pos - c) / rr, l = suL / rr;
  float b = dot(o, l) / dot(l, l), d = length(o - l * b) - 1.03;
  lit *= mix(1., suE(-.05, .05, d), suE(0., .1, -b));
  if (me > 8) suAo *= 1. - .75 * exp(-5. * max(length(o.xz) - (k < 2 ? .62 : .15), 0.));
 }
 return lit;
}
// The room's window as a shiny thing shows it.
float suWin(vec3 r, float soft) {
 const vec3 w = vec3(-.619, .742, -.258), u = vec3(.385, 0., -.923);
 float z = max(dot(r, w), .05);
 vec2 c = abs(vec2(dot(r, u), dot(r, cross(u, w))) / z), a = suE(vec2(.36, .46) + soft, vec2(.36, .46) - soft, c) * suE(vec2(.02), vec2(.02 + soft * 1.6), c);
 return a.x * a.y;
}
// Sprinkles on a plane: x inside (above 0), y how round, z its number, w 1 for a pearl; n its slope, shade its shadow.
vec4 suStrew(vec2 w, vec2 shift, float dense, out vec2 n, out float shade) {
 vec2 id = floor(w), h = hash22(id), h2 = fract(h * 37.31 + h.yx * 11.7);
 n = vec2(0.); shade = -1.;
 float here = sat((dense - h2.x) * 6.);
 if (here <= .01) return vec4(-1., 0., 0., 0.);
 vec2 d = w - id - .5 - .5 * shift - .2 * (h - .5);
 float pearl = step(.8, h2.y), rad = mix(.12, .18, pearl) * here * (1. + .6 * sat(uOwn[4])), lg = .19 * (1. - pearl) * here;
 vec2 ax = normalize(fract(h2.yx * 23.) - .4983), ds = d + shift;
 shade = 1. - length(ds - ax * clamp(dot(ds, ax), -lg, lg)) / rad;
 n = (d - ax * clamp(dot(d, ax), -lg, lg)) / rad;
 float f = 1. - length(n);
 return vec4(f, sqrt(sat(1. - suSq(1. - f))), h.x, pearl);
}
// A place on bun k, or on the tray when k is 2.
vec3 suShade(vec3 q, vec3 pos, vec3 n, vec3 rd, int k, float s, vec2 tp, float coat, float px, vec3 tray) {
 bool bun = k < 2;
 float ph = bun ? tp.y : 0., ice = bun ? suE(-.006 - px, .006 + px, s) : 0., dense = suStrewn;
 vec2 rh = bun ? q.xz / (length(q.xz) + 1e-4) : vec2(1., 0.), w = (bun ? ph * rh * 12. + 60. : pos.xz * mat2(.8, .6, -.6, .8) * 7.5) * suFine;
 float cp = cos(ph);
 vec3 tr = vec3(rh.x * cp, -sin(ph), rh.y * cp), tt = vec3(-rh.y, 0., rh.x), alb = tray;
 // the dough: brown on top, a pale line at its waist, flour in its skin
 float fleck = ice > .99 ? 0. : noise(bun ? vec2(tp.x * 34., ph * 40.) : pos.xz * 1.3 + 4.), room = suE(.03, .008, px);
 if (bun) {
  alb = mix(vec3(.5, .215, .07), vec3(.78, .52, .24), suBell((ph + .06 * sin(tp.x * 4. + float(k)) - 1.75) * 3.6));
  alb = mix(alb * (.84 + .3 * fleck * suE(.03, .005, px)), vec3(.16, .08, .05), .6 * suDark);
  vec3 top = mix(suIc[k], vec3(.85, .8, .74) - .4 * suSnow, .85 * sat(-uOwn[4]) * suE(-.2, .2, sin(q.x * 19. + 1.6 * sin(q.z * 7.)) - .3)); // combed with white
  alb = mix(mix(alb, top, ice), mix(vec3(.75, .3, .3), suInk(uKind[4]), .5) * .75 + .16, .85 * coat);
  ice = max(ice, coat);
  room = suE(.05, .11, s) * suE(1.75, 1.2, ph) * (1. - coat) * suE(.04, .015, px);
 } else {
  dense *= .1 + .4 * fleck; // those that missed
  vec2 ce = vec2(.1 + px * 9.), check = suE(-ce, ce, sin(pos.xz * 6.));
  alb = mix(alb, vec3(.86, .82, .78) * (1. - .7 * suDark), .4 * sat(-uOwn[4]) * (check.x + check.y));
 }
 float lit = suSh(pos + n * .02, bun ? k : 9), gloss = ice;
 vec3 add = vec3(0.);
 if (room > .003) {
  // sprinkles, each with its shadow
  vec2 sn; float sh; vec2 dir = rh * dot(suL, tr) + tt.xz * dot(suL, tt);
  vec4 sp = suStrew(w, dir * .2, dense, sn, sh);
  alb *= 1. - .55 * room * suE(-.1, .4, sh) * lit;
  float in_ = suE(0., px * 30. + .04, sp.x) * room;
  vec4 m = bun ? piece(sat(.5 + ph * rh * vec2(.3, -.3))) : vec4(0.);
  vec3 sc = mix(sp.z < .6 ? suInk(uKind[int(sp.z * 8.3)]) : suIc[int(sp.z * 25.) % 4], vec3(.88, .86, .84), max(sp.w, .3 * suSnow));
  alb = mix(alb, mix(sc, m.a > .004 ? m.rgb / m.a * 1.1 : sc, sat(m.a * suAns)), in_);
  n = normalize(mix(n, normalize(n * (.25 + sp.y) + tr * dot(sn, rh) + tt * dot(sn, tt.xz) + vec3(0., 1e-4, 0.)), in_));
  float glint = suSq(suSq(suSq(sat(dot(n, normalize(suL - rd))))));
  add = (vec3(1., .93, .84) * sat(m.a * suAns) * .35 + sp.w * (.15 + uKeys)) * glint * in_ * suSun + (.3 + .5 * sp.w) * uKeys * in_ * sp.y * suSun;
  gloss *= 1. - in_;
  alb *= 1. + .6 * uHits * in_;
 }
 float dif = dot(n, suL), foot = bun ? mix(.35, 1., suE(-.1, .4, q.y)) : mix(.6, 1., lit) * suAo;
 vec3 c = alb * (suSun * mix(sat(dif), sat((dif + .22) / 1.22), ice) * lit * mix(foot, 1., ice) + (suAmb * (.55 + .45 * n.y) + tray * (.2 * suSun + .6 * suAmb) * sat(.5 - .6 * n.y)) * foot);
 vec3 ref = reflect(rd, n);
 float fr = .05 + .6 * suSq(suSq(1. - sat(dot(n, -rd))));
 gloss *= mix(.75, 1.25, uTone) * (1. - .85 * suSnow);
 if (gloss > .001) c += gloss * (suWin(ref, mix(.13, .05, uTone)) * (suSun * .2 + .5) * (1. - .6 * suNt) * (.5 + .5 * fr) + fr * .35 * (suAmb + suSun * .3) * suE(-.2, .6, ref.y));
 return c + add;
}
vec3 suBuns(vec2 p) {
 p.x += .17 * suE(1., .6, uRes.x * suPx);
 float tall = sat(uOwn[1]), ring = sat(-uOwn[1]), nearer = sat(-uOwn[5]), higher = sat(uOwn[5]);
 suForm = vec4(.5 * ring, 1. - .5 * ring, .5 + .42 * tall - .08 * ring, .42 + .3 * tall - .06 * ring);
 suStrewn = .6 + .6 * uOwn[4] + .06 * uTexture; suFine = exp2(-.9 * sat(uOwn[4]));
 suL = normalize(mix(vec3(-.6, .62, -.5), vec3(-.75, .34, -.5), max(suGold, suNt)) + vec3(0., 0., .1 * sin(TAU * uLoop)));
 suAt[0] = vec3(-1.75, 1.25, 1.5); suAt[1] = vec3(1., 3.2, 1.);
 vec3 ro = vec3(.05 * sin(uTime * .07), 1.2, -2. + .06 * sin(uTime * .05)) + nearer * vec3(-.15, -.4, .75) + higher * vec3(0., 2.2, -2.6);
 float pitch = .165 + .33 * higher - .1 * nearer, cp = cos(pitch), sp = sin(pitch), ph = .75 * suPx;
 vec3 rd = normalize(vec3(p.x, p.y * cp - 1.5 * sp, p.y * sp + 1.5 * cp));
 vec3 tray = suGround(vec3(.8, .47, .45), vec3(.085, .05, .045), vec3(.72, .76, .82));
 vec3 wall = suGround(vec3(.86, .66, .46), vec3(.16, .12, .12), vec3(.58, .66, .74)), air = wall * (suAmb + suSun * (.4 - .25 * suNt));
 float tf = rd.y < -.002 ? -ro.y / rd.y : 1e4, left = 1.;
 vec3 acc = vec3(0.);
 // a hit: sprinkles drop and bounce
 for (int i = 0; i < 13 && uHits > .003; i++) {
  float h = suH(float(i) * 3.7 + 2.), h2 = fract(h * 71.7), age = 1. - uHits, an;
  vec2 d = p - vec2(-.6 + .09 * float(i) + (h - .5) * (.1 + .16 * age), .12 - .3 * h2 * h + .2 * (1. - age) * abs(cos(age * 4.5 + h2))), ax;
  if (dot(d, d) > .0025) continue;
  an = h2 * 9. + 2.5 * age; ax = vec2(cos(an), sin(an));
  float f = length(d - ax * clamp(dot(d, ax), -.026, .026)) / .013, a = suE(1. + 80. * suPx, 1. - 80. * suPx, f) * suE(0., .3, uHits) * left;
  acc += a * mix(vec3(.85, .8, .7), uKind[4], h2) * (suAmb + suSun * (.8 - .3 * f));
  left -= a;
 }
 // one cherry and its stalk
 vec3 oc = ro - suCh; float b = dot(oc, rd); vec3 cl = oc - rd * b, n;
 float y = sat((cl.y - .13) / .42), stalk = suE(.008, -.004, abs(cl.x - .2 * y * y + .01) - .012 - .02 * suSq(suSq(y))) * step(.13, cl.y) * suE(.56, .55, cl.y);
 acc += left * stalk * vec3(.2, .19, .05) * (suAmb + suSun * .5);
 left *= 1. - stalk;
 float cd = length(cl), cov = suE(suChR + suPx * 2., suChR - suPx, cd) * left;
 if (cov > 0.) {
  n = normalize(cl - rd * sqrt(max(suChR * suChR - cd * cd, 0.)));
  float dent = suBell(length(n.xz + vec2(0., .1)) * 2.6) * step(0., n.y);
  n = normalize(n - vec3(n.x, 0., n.z) * dent);
  vec3 c = mix(vec3(.46, .02, .04), vec3(.2, .01, .03), .5 + .5 * n.x * n.y) * (1. - .5 * dent) * (suSun * sat((dot(n, suL) + .1) / 1.1) + suAmb * (.5 + .4 * n.y) + tray * sat(-n.y) * .5 * suSun);
  acc += cov * (c + .5 * suSun * suBell(6. * (n.x + .3)) * suBell(5. * (n.y - .5)) + suAmb * .25 * suSq(suSq(1. - sat(dot(n, -rd)))));
  left -= cov;
 }
 // the near buns, then the tray
 vec3 col = wall;
 for (int k = 0; k < 3; k++) {
  if (left < .01) break;
  float R = k < 2 ? suAt[k].z : 1., tm = tf, t, t1 = 0., s = -1., coat = 0., mn = 1e3, f0 = 0.;
  vec3 o = k < 2 ? (ro - vec3(suAt[k].x, 0., suAt[k].y)) / R : ro, d = rd / R, q = o, nd = vec3(0.), axis = nd;
  vec2 tp = vec2(0.); int feel = 0;
  cov = 0.;
  if (k < 2) {
   vec3 sc = suSc() + .11, os = (o - vec3(0., suForm.w, 0.)) / sc, ds = d / sc;
   float A = dot(ds, ds), B = dot(os, ds), D = B * B - A * (dot(os, os) - 1.);
   float root = sqrt(max(D, 0.));
   t = max((-B - root) / A, .02); t1 = min((-B + root) / A, tf);
   // walk to the surface, then feel its slope
   for (int i = 0; i < 38 && D > 0.; i++) {
    vec3 at = o + d * t;
    if (feel == 0 && (t > t1 || i > 33)) { cov = suE(2.7 * ph, 1.5 * ph, mn); feel = 1; }
    if (feel > 0) {
     if (cov <= 0.) break;
     q = o + d * tm; at = q;
     axis = vec3(equal(ivec3(feel), ivec3(2, 3, 4)));
     at += axis * max(.004, tm * ph / R);
    }
    float f = suBun(at, k);
    if (feel == 0) {
     if (suS > -8. && f * R < t * mn) { mn = f * R / t; tm = t; }
     if (suS > -8. && f * R < t * ph * 1.5) { cov = 1.; feel = 1; }
     t += max(f * R * .88, .7 * t * ph);
    } else if (feel == 1) {
     f0 = f; s = suS; coat = suCoat; tp = suTh; feel = 2;
  if ((s > .2 || s < -.06) && (k > 0 || uCue < .002)) {
       float r = length(q.xz) + 1e-4;
      nd = vec3(q.xz / r * (r - suForm.x) / suSq(suForm.y), (q.y - suForm.w) / suSq(suB(q.y))).xzy;
      break;
     }
    } else {
     nd += axis * (f - f0); feel++;
     if (feel > 4) break;
    }
   }
  } else cov = suE(.006, -.02, rd.y + .055 * (1. - higher * .4));
  if (cov > 0.) {
   vec3 c = suShade(q, ro + rd * tm, normalize(nd + vec3(0., k < 2 ? 1e-5 : 1., 0.)), rd, k, s, tp, coat, tm * ph / R, tray);
   if (k < 2) { acc += c * cov * left; left *= 1. - cov; }
   else col = mix(c, air, 1. - exp(-tf * mix(.012, .045, uSpace)));
  }
 }
 // the wall with the sun's window
 vec2 pw = abs(vec2(rd.x / rd.z - .26 - .45 * rd.y, rd.y - .14) / vec2(.2, .16));
 vec2 pane = suE(vec2(1.35), vec2(.7), pw) * suE(vec2(0., -.1), vec2(.3), pw);
 col = mix(wall * (suAmb * .9 + mix(suSun, vec3(.2, .45, 1.2), suNt) * (.2 - .18 * suNt + pane.x * pane.y * (.38 + .2 * uPad + .3 * max(uMic, uCue)) * (1. - .5 * suNt))), col, cov);
 // the far buns
 for (int i = left > .01 && abs(rd.y + .05) < .15 + .2 * (tall + higher) ? 2 : -1; i >= 0; i--) {
  float fi = float(i), bl = (.035 + .035 * fi) * mix(.7, 1.4, uSpace);
  vec3 at = i == 0 ? vec3(3.4, 5.4, 1.) : i == 1 ? vec3(-.15, 6.8, 1.02) : vec3(1.9, 9.6, 1.15);
  float u = (at.y - ro.z) / rd.z;
  vec3 rr = suSc() * at.z, o = ro - vec3(at.x, suForm.w * at.z, at.y), l = rd / rr, g = (o + rd * u) / at.z;
  col *= 1. - .4 * suBell(max(abs(g.x - .35) - .5, 0.) * 2.2) * suBell((g.y + suForm.w) * 4.5);
  o /= rr;
  float ll = dot(l, l); o -= l * dot(o, l) / ll;
  float cc = dot(o, o);
  cov = suE(bl, -bl, sqrt(cc) - 1.);
  if (cov <= 0.) continue;
  vec3 q = o - l * sqrt(max(1. - cc, 0.) / ll);
  n = normalize(q / rr);
  vec3 c = mix(vec3(.6, .34, .14) * (1. - .6 * suDark), i < 2 ? suIc[i + 2] : suIc[0], suE(-bl * 1.4, bl * 1.4, q.y - .25 + (i < 2 ? .65 * suLv[i + 2] : .3) + .16 * sin(q.x * 8. + at.x * 3.) + .1 * sin(q.x * 19.)));
  c *= suSun * sat((dot(n, suL) + .15) / 1.15) + suAmb * (.6 + .4 * n.y) * suE(-1.1, -.2, q.y);
  col = mix(col, mix(c, air, .04 + .08 * fi), cov);
 }
 return acc + col * left;
}
// The street through the window, out of focus.
vec3 suStreet(vec2 p) {
 vec3 c = mix(suSun * (.68 - .64 * suNt) + suAmb * .6, suAmb * .7 + suSun * (.07 - .06 * suNt), suE(.5, -.15, p.y + .06 * p.x)) * mix(1., .45, suDark);
 // a house over the way, its windows
 float soft = .2 + 2. * uSpace, house = suE(.045 * soft, -.045 * soft, abs(p.x + .34) - .34);
 c *= mix(vec3(1.), vec3(.84, .58, .46), house * .8);
 float holes = suE(.4 - .3 * soft, .4 + .3 * soft, cos(p.x * 24. + 7.)) * suE(.4 - .4 * soft, .4 + .4 * soft, cos(p.y * 19. - 3.4));
 c = mix(c, mix(vec3(.4, .5, .55) * suAmb, vec3(2.2, 1.1, .3), suNt), holes * house * .7);
 // somebody goes by
 float w = fract(uTime * .011 + .35);
 vec2 q = (p - vec2(1.3 - 2.6 * w, -.1)) * vec2(13., 4.2);
 return c * (1. - .5 * exp(-dot(q, q)) * suE(0., .1, w) * suE(1., .9, w));
}
int suFilled(float id, bool up) { return int(mod(id * 2. + (up ? 9.5 : 5.5), 5.)); }
vec3 suCounter(vec2 p) {
 p = p * (1. - .34 * sat(-uOwn[5]) + .45 * sat(uOwn[5])) + vec2(.2, -.06) * sat(-uOwn[5]);
 float px = suPx * 1.5, edge = -.235, plank = .075, left = 1., pitch = .375;
 vec3 acc = vec3(0.); vec2 see = p, up2 = normalize(vec2(-.5, .75));
 float sweep = suBell((p.x + .5 * p.y + 1.1 - 2.2 * (1. - uCue)) * 3.2) * uCue;
 // the great jar, then the shelf's jar here
 for (int i = 0; i < 2; i++) {
  bool big = i == 0, up = p.y > plank - .02 && !big;
  float wide = up ? .315 : pitch, shift = up ? .09 : .2, id = big ? 4. : floor((p.x + shift) / wide), h = suH(id * 3. + (up ? 51. : 7.));
  vec2 hs = big ? vec2(.26, .95) : up ? vec2(.122, .23 + .08 * h) : vec2(.15, .22 + .03 * h);
  vec2 at = big ? vec2(.58, -.43) : vec2((id + .5) * wide - shift, up ? plank + .008 : edge - .015), q = p - at;
  int kind = big ? 0 : suFilled(id, up);
  hs.x *= 1. - .3 * sat(uOwn[1]);
  float H = hs.y, R = hs.x, rd = min(R * mix(.3, .92, sat(-uOwn[1])), .42 * H);
  // the glass and its lid
  vec2 b = abs(q - vec2(0., .43 * H)) - vec2(R, .43 * H) + rd;
  float d = length(max(b, 0.)) + min(max(b.x, b.y), 0.) - rd;
  d = smin(d, max(abs(q.x) - .76 * R, abs(q.y - .85 * H) - .12 * H), .12 * R);
  vec2 lb = abs(q - vec2(0., H)) - vec2(.8 * R, .03 * H);
  float lid = min(length(max(lb, 0.)) + min(max(lb.x, lb.y), 0.) - .02 * H, length(q - vec2(0., 1.08 * H)) - .16 * R), X = q.x / R;
  float lv = kind < 4 ? suLv[kind] : .6 * uLevel, a = suE(px, -px, lid) * left;
  vec3 tint = suIc[kind % 4], c = tint * .5 + .12;
  acc += a * c * (suAmb * .8 + suSun * (.12 + .6 * suBell((X + .45) * 3.) + .5 * suE(1., 1.06, q.y / H)));
  left -= a;
  float in_ = suE(px * .7, -px * .7, d);
  if (in_ * left < .004) continue;
  // the sweets, piled
  float cell = (kind == 1 ? .021 : kind == 3 ? .027 : .034) * (big ? 1.75 : 1.) * (1. + uOwn[4] * (uOwn[4] < 0. ? .42 : .6)), best = -9.;
  float fill = H * (.3 + .28 * h + .2 * lv + .2 * uOwn[3] - (big ? .06 : 0.)) + R * .14 * (.5 - X * X + .4 * sin(X * 3. + id));
  vec2 g = vec2(q.x, q.y - .02 * H) / cell; vec3 bn = vec3(0.); vec4 bh = vec4(0.);
  for (int j = 0; j < 5 && in_ * left > .004; j++) {
   vec2 m = vec2(0., floor(g.y / .88 - .5) + float(j >> 1));
   float odd = .5 * mod(m.y, 2.);
   m.x = floor(g.x - odd - .5) + float(j & 1);
   vec2 hh = hash22(m + id * 17. + (up ? 90. : 40.));
   m = (m + vec2(odd, 0.) + .5) * vec2(1., .88) + .3 * (hh - .5);
   float r = .6 * sat((fill / cell - m.y) * 3.5);
   // a hit: one more drops in
   if (j > 3) { m = vec2(.6, fill / cell + 5.5 * uHits * abs(cos(4.5 * uHits - 4.5))); r = big ? .6 * sat(uHits * 5.) : 0.; hh = vec2(.7, .4); }
   float s = r * r - dot(g - m, g - m), z = sqrt(max(s, 0.)) + .4 * hh.x;
   if (s > 0. && r > .05 && z > best) { best = z; bn = vec3(g - m, sqrt(s)) / r; bh = vec4(hh, m); }
  }
  vec3 sweet = vec3(0.); float has = 0.;
  if (best > -1.) {
   vec2 w = at + bh.zw * cell;
   vec4 mp = piece(sat(vec2(.5 + w.x * .56, .5 - w.y)));
   c = kind == 1 ? mix(vec3(.3, .06, .035), tint * .6, .15 + .4 * lv) : kind == 3 ? mix(vec3(.8, .76, .7), tint, step(.45, bh.x)) : mix(tint, suIc[int(bh.y * 4.)], step(.4, bh.x) * (kind == 0 ? .85 : .2));
   c = mix(c, suInk(mp.rgb / max(mp.a, .01)), .35 * sat(mp.a * suAns));
   float gum = kind == 0 || kind == 4 ? 1. - .8 * suSnow : .12;
   if (kind == 2) {
    // a slice of a tube: rings on a tipped face, its side below
    vec2 ax = vec2(cos(bh.y * 25.), sin(bh.y * 25.));
    float r = length(vec2(dot(bn.xy, ax) / (.45 + .5 * bh.x), dot(bn.xy, vec2(-ax.y, ax.x))));
    c = mix(c, mix(vec3(.84, .79, .72), c, suE(.5, .74, r)), suE(1.02, .95, r)) * (1. - .7 * suE(.38, .2, r));
    bn = normalize(mix(bn, vec3(ax * sqrt(.81 - bh.x * .8), .8), suE(1.05, .9, r)));
   }
   float back = sat(.5 - .75 * dot(bn.xy, up2)) * (.4 + .6 * bn.z), front = sat(dot(bn, vec3(-.49, .76, .43)));
   vec3 through = c * c * mix(vec3(1.2), c, .3) * suSun * (.65 + .4 * lv + (big ? .4 * uHits : 0.) + .5 * uBands[int(mod(id * 3. + 5. + bh.x * 3., 16.)) & 15] * suAns) * (.3 + 1.9 * back);
   sweet = c * (suAmb * (.45 + .4 * bn.y) + suSun * front * front) * mix(1., .35, gum) + through * gum * (1. - .5 * suNt);
   sweet *= mix(.16, 1., suE(-.05, .75, best)) * (.45 + .55 * sqrt(sat(1. - X * X)));
   sweet += (.25 + .5 * uTone + 1.2 * sat(mp.a * suAns)) * suSun * .45 * pow(sat(dot(bn, vec3(-.42, .62, .66))), mix(14., 60., uTone)) * (1. - .8 * suSnow);
   has = suE(0., .25, bn.z);
  }
  // through the empty glass the street is seen bent
  see = mix(see, p - vec2(q.x * .7, -.03), in_ * step(.5, left));
  float line = exp(d / (.02 * R + .0015)) * .8, strip = suBell((X + .74) * 13.) * .7 + suBell((X - .82) * 26.) * .5;
  strip *= suE(.02, .1, q.y / H) * suE(.84, .76, q.y / H) * (1. + 2. * uKeys * suAns);
  c = mix(sweet, vec3(.1, .15, .14) * (suAmb + .3), line * .7);
  float cover = max(has, max(line, .14));
  acc += in_ * left * (c * (cover - .14 * (1. - max(has, line))) + vec3(.75, .86, .84) * (suAmb + suSun * .45) * strip * .5 + suSun * sweep * (.25 + strip));
  left *= 1. - in_ * cover;
  if (left < .01) return acc;
 }
 vec3 col = suStreet(see) * (1. + .5 * sweep);
 // the window's bars and the shelf of glass
 col = mix(col, vec3(.13, .2, .17) * (suAmb + .1), suE(.03, .02, abs(abs(p.x + .12) - .62)) * .9);
 col = mix(col, vec3(.3, .6, .5) * (suAmb * .8 + suSun * (.15 + .5 * suE(0., .008, p.y - plank))), suE(.009 + px, .009, abs(p.y - plank)) * .85);
 if (p.y < edge && left > .01) {
  // marble, with the colour that came through the jars lying on it
  float dn = edge - p.y, z = .1 / (dn + .16), v = noise(vec2(p.x * 3.2, 12.) * z + 2. * noise(vec2(p.x * 2.2, 5.5) * z)), shade = 0.;
  vec3 alb = suGround(vec3(.86, .8, .77), vec3(.13, .085, .07), vec3(.82, .84, .88)) * (1. - .3 * suBell((v - .5) * 18.)), through = vec3(0.);
  for (int i = 0; i < 4; i++) {
   bool big = i == 3;
   float id = floor((p.x + .2) / pitch) + float(i) - 1., f = big ? 1.8 : 1., dd = big ? -.43 - p.y : dn;
   float X = (p.x - (big ? .58 : (id + .5) * pitch - .2) + dd * .35) / (.135 * f + .12 * max(dd, 0.));
   float sp = exp(-X * X * X * X) * exp(-max(dd, 0.) * 6. / f) * suE(-.012, .015, dd);
   int kind = big ? 0 : suFilled(id, false);
   vec3 c = suIc[kind % 4];
   through += c * c * sp * (kind == 1 ? .15 : .4 + .7 * suLv[kind % 4]) * suE(.1, .9, noise(vec2(X * 5., dd * 30. / f + .6 * sin(uTime * .13)) + float(kind) * 9.)); shade = max(shade, sp);
  }
  col = alb * ((suAmb * .5 + suSun * .4) * (1. - .82 * shade) + suSun * through * (1.7 + .8 * uLevel + .5 * uMic) * (1. - .6 * suNt) + suSun * sweep * .2);
 }
 return acc + col * left;
}
vec3 render(vec2 p) {
 suLight();
 return screenOf(uVar < .5 ? suBuns(p) : suCounter(p));
}
