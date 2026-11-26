// name: Knotted cords
// a: Fanned
// b: Hung straight
// what: A twisted cord slung across a sunlit plaster wall, and from it some thirty cotton cords in undyed, rust, indigo and brown, fanned out like a half-opened skirt, knotted at different heights, each with a blue shadow beside it; or cords longer than the picture hung straight from a pole on a clay wall, thin side cords tied to some.
// follows: Left to right is the piece, top to bottom the room: where it is loud a knot is tied, fat and dyed with that sound. Drone swings them all, pad and texture sway neighbours, phrases tip some cords or the side cords, bands stir each in order. A hit plucks and lights the cord at the playhead; a cue runs down the row. Keys light knots, travel moves the sun.
bool kcA;             // the fanned one
float kcPx, kcN, kcAmp;
vec2 kcFall;          // how far a shadow falls from its cord
vec3 kcSun;
const vec2 kcMid = vec2(-.14, .95);   // the middle of the fan
const float kcPole = .05;              // how far above its main cord the pole lies
const float kcArc = .63, kcStep = .06, kcGap = .087, kcTop = .33;
float kcCov(float d) { return sat(.5 - d / kcPx); }
float kcS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float kcH(float n) { n = fract(n * .1031 + .137); n *= n + 33.33; n *= n + n; return fract(n); }
// Cotton as it comes, and dyed.
const vec3 kcDye[9] = vec3[9](
  vec3(.76, .67, .52), vec3(.66, .53, .36), vec3(.43, .27, .135), vec3(.21, .105, .05), vec3(.07, .042, .032),
  vec3(.46, .125, .045), vec3(.05, .085, .2), vec3(.17, .27, .4), vec3(.55, .31, .075));
// Each cord's two plies; 99 is no cord, a gap between groups.
const int kcCords[34] = int[34](0, 55, 11, 0, 99, 22, 33, 0, 44, 99, 66, 0, 66, 60, 11, 99, 55, 0, 22, 55, 3, 33, 99, 0, 77, 0, 66, 11, 99, 88, 0, 55, 22, 0);
// Which cord (a whole number and a half is its middle) and how far down it.
vec2 kcField(vec2 p) {
  if (!kcA) return vec2((p.x + kcGap * 10.) / kcGap, kcTop - p.y);
  vec2 d = p - kcMid;
  float s = length(d) - kcArc, o = max(s, 0.);
  d.y += .3 * o * o * d.x * d.x / (dot(d, d) + .01);  // the outer cords droop
  return vec2(atan(d.x, max(-d.y, .01)) / kcStep + kcN * .5 - 1.5, s);
}
// How far a cord is pushed aside, as the tangent of its lean.
float kcTime(float i) { return (i + .5) / kcN; }
float kcCueAt(float t) { float c = (t - 1.1 + 1.1 * uCue) * 4.5; return exp(-c * c); }  // the cue runs down the row
float kcLean(float i) {
  float t = kcTime(i);
  return kcAmp * ((kcA ? 0. : uDrone * .016 * sin(uTime * .61)) + uPad * .022 * sin(uTime * .9 - i * .22) + uTexture * .018 * sin(uTime * 1.37 + i * .5))
    + uMic * .02 * sin(uTime * 1.05 - t * 5.) + .26 * uCue * (1. - uCue) * kcCueAt(t);
}
float kcAtHead(float t) { float d = abs(fract(t - uLoop + .5) - .5) * kcN; return exp(-d * d * .9); }
// What is seen of a cord at a place across X and along S, all in its own radius.
vec3 kcNo; float kcZ, kcD, kcPly, kcDim; vec2 kcGrain;
void kcRope(float X, float S, int n, float hand) {
  float k = n > 2 ? 1.05 : 1.6, a = n > 2 ? .54 : .5, b = n > 2 ? .52 : .56;
  kcZ = -9.; kcD = 9.; kcNo = vec3(0, 0, 1); kcDim = 1.;
  for (int j = 0; j < n; j++) {
    float q = k * S * hand + float(j) * TAU / float(n), sl = -a * k * hand * sin(q), f = inversesqrt(1. + sl * sl);
    float x = (X - a * cos(q)) * f, v = clamp(x / b, -1., 1.), up = sqrt(1. - v * v), z = a * sin(q) + b * up - 3. * max(abs(x) - b, 0.);
    kcD = min(kcD, abs(x) - b);
    if (z > kcZ) { kcZ = z; kcNo = vec3(v * f, -v * f * sl, up); kcPly = float(j & 1); kcGrain = vec2(v, S); }
  }
  kcDim = kcS(-.45, .5, kcZ);
  kcNo.x += .55 * X;
}
void kcCoil(float X, float Y, float tilt, float R, float m) {
  float t = (Y - tilt * X) / m, c = sqrt(max(1. - t * t, 0.)), w = R + m * c;
  float d = max(abs(X) - w, (abs(t) - 1.) * m * .8), z = sqrt(max(w * w - X * X, 0.)) - 3. * max(d, 0.);
  kcD = min(kcD, d);
  if (z > kcZ) { kcZ = z; kcNo = vec3(X / w * (c + .1), t, sqrt(max(1. - X * X / (w * w), 0.)) * (c + .1)); kcPly = step(0., sin(X * 2.4 + t * 1.6)); kcGrain = vec2(t, X * 1.3); kcDim = .35 + .65 * kcS(1., .55, abs(t)); }
}
// A cord: across it, its radius, length and twist, its place in the piece and number, where it is tied, to how thick a cord (-1: to another cord).
struct Kc { float x, r, len, hand, t, i, from, main; int code; };
// A knot or knots in their room on a cord: how big (0 none), where, how far one from the next, how many, long or single.
vec3 kcKn; bool kcLong; float kcSz;
vec4 kcKnot(Kc c, float s) {
  float tier = kcA ? .155 : .13, r = c.r;
  float k = floor((s - .05) / tier), h = kcH(c.i * 7.1 + k * 3.3);
  if (k < 0. || (k + 1.) * tier + .05 > c.len || (c.main < 0. && s < c.from + .04)) { kcSz = 0.; kcKn = vec3(9, 1, 0); return vec4(0); }
  float at = .05 + tier * (k + .5 + .36 * (h - .5)), h2 = fract(h * 31.7), h3 = fract(h * 173.3);
  vec4 m = piece(vec2(c.t, (k + .5) / (kcA ? 5. : 6.)));
  float base = h3 > .72 ? .8 : 0.;
  kcSz = h2 < .12 ? 0. : base + (1.2 - base) * (1. - exp(-(1.2 + 3. * fract(h * 919.)) * m.a));
  kcLong = h2 > .55;
  float n = kcLong ? 2. + floor(fract(h * 77.) * 4.) : 1. + floor(h2 * 5.4), pitch = kcLong ? 1.02 : 3.1;
  n = min(n, max(floor((tier * .6 / r) / pitch), 1.));
  kcKn = vec3((s - at) / r, pitch, n);
  return m;
}
// The knots' own outline at X, added to the plain cord's.
float kcKnotCell() { float o = (kcKn.z - 1.) * .5, id = clamp(floor(kcKn.x / kcKn.y + o + .5), 0., max(kcKn.z - 1., 0.)); return kcKn.x - (id - o) * kcKn.y; }
void kcTie(float X) {
  if (kcSz < .02) return;
  float y = kcKnotCell(), R = mix(.15, .92, kcSz), m = mix(.3, .62, min(kcSz, 1.));
  if (kcLong) kcCoil(X, y, .12, R * .95, min(m, .56)); else { kcCoil(X, y - .12, -.42, R * .85, m); kcCoil(X, y + .12, .42, R, m); }
}
// How far outside its shadow's outline.
float kcBlob(float X) {
  float y = kcKnotCell(), R = mix(.15, .92, kcSz), m = kcLong ? .6 : 1.05;
  return kcSz < .02 ? abs(X) - .95 : min(abs(X) - .95, max(abs(X) - R - .5 * sqrt(max(1. - y * y / (m * m), 0.)), abs(y) - m));
}
// Cord number i as it hangs: how far we are across it; per is cells for a length.
Kc kcCord(float i, vec2 f, float per, float lean) {
  Kc c; float h = kcH(i * 1.7 + 5.);
  c.i = i; c.t = kcTime(i); c.code = kcA ? (i < 0. || i >= kcN ? 99 : kcCords[int(i)]) : kcCords[int(mod(i + 10., 34.))];
  float o = max(f.y, 0.);
  float bend = (kcA ? .07 : .016) * (fract(h * 29.3) - .5) * o * (1. - (kcA ? 2. : 3.) * o) + (kcA ? .03 * (h - .5) * o : 0.);
  if (kcA && mod(i, 3.) < .5) bend += uPhrase * kcAmp * .022 * sin(uTime * 1.15 + i * .8) * kcS(.25, .7, o);
  lean += (kcAmp * band(c.t) * .022 + .004 * h * h) * sin(uTime * (1. + .7 * h) + h * 40.);
  bend += lean * o;
  if (uHits > .001) bend += kcAtHead(c.t) * uHits * (1. - uHits) * .08 * sin(uHits * 16.) * sin(min(o * 3.5, PI));
  c.x = (f.x - i - .5 - (kcA ? .16 : .25) * (h - .5)) / per - bend;
  c.r = (kcA ? .0115 : .0155) * (.85 + .3 * fract(h * 13.7));
  c.len = kcA ? .48 + .5 * fract(h * 71.3) : 1.6;
  c.main = kcA ? .024 : .022; c.from = c.main + c.r * .5;
  c.hand = fract(h * 39.) > .3 ? 1. : -1.;
  return c;
}
vec3 kcWall(vec2 p, out float bump) {
  vec2 q = p * rot(.5) * vec2(2.1, 6.3); q.y += .7 * sin(q.x * .8 + 1.);
  float n0 = noise(q), n = n0 - noise(q + vec2(-.06, .12)), m = noise(p * mat2(33., 27., -29., 36.) + 3.), g = noise(p * mat2(151., 113., -127., 173.));
  bump = n * .7 + (m - .5) * .1 + (g - .5) * .16;
  vec3 c = kcA ? vec3(.71, .605, .465) : vec3(.42, .25, .135);
  float pit = kcS(.80, .93, m);
  bump -= pit * .14;
  if (!kcA) {  // chopped straw in the clay
    vec2 u = p * 17., id = floor(u), h = hash22(id); u = (u - id - .5 - .5 * (h - .5)) * rot(h.x * 6.3);
    float d = max(abs(u.y + .5 * u.x * u.x) - .014, abs(u.x) - .05 - .25 * h.y) / 17.;
    float at = sat(.5 - d / max(kcPx, .0008)) * step(.45, fract(h.y * 37.)) * .5;
    c = mix(c, vec3(.6, .42, .2), at); bump += at * .06;
  }
  return c * (.9 + .2 * n0 + .06 * (g - .5));
}
// What has been laid so far: its colour, how much of the pixel, how near to us.
vec3 kcAcc, kcSunC, kcAirC, kcFill; float kcAl, kcNear, kcSunIn; vec2 kcAx, kcDn;
float kcHidden(Kc c, vec2 f, float soft) {
  return kcS(soft, -soft, max(kcBlob(c.x / c.r) * c.r, f.y - c.len + .007 * sin(c.x / c.r * 4. + c.t * 90.)));
}
// Lays one cord, tied at from.
void kcLay(Kc c, float s) {
  vec4 m = kcKnot(c, s);
  float i = c.i, from = c.from, main = c.main, z = main < 0. ? .02 : .012 * mod(i, 2.);
  float X = c.x / c.r, S = s / c.r;
  float fray = kcS(c.len - .028, c.len, s);
  kcRope(X / (1. + .6 * fray), S, 2, c.hand);
  kcTie(X);
  kcCoil(X, (s - from) / c.r, .2, .75, .6);
  // stray fibres along its edge
  float end = s - c.len, hair = 0.;
  if (end > -.03) end += .02 * noise(vec2(X * 4., i));
  if (kcD > -.06) hair = kcS(.4, -.05, kcD) * kcS(.6, .8, noise(vec2(S * 2.6 + X * 2. * c.hand, X * 1.5 + i * 7.))) * .7 * kcCov(end);
  float cov = max(kcCov(max(kcD * c.r, end)), hair);
  if (main > 0.) cov *= kcCov(-s - main * .9 - c.r * .9 * sqrt(max(1. - X * X, 0.)));
  else cov *= kcCov(from - s - c.r * (.5 + .8 * sqrt(max(1. - X * X, 0.))));
  if (cov <= 0.) return;
  vec3 dye = kcDye[kcPly > .5 ? c.code / 10 : c.code % 10];
  vec3 own = m.rgb / max(m.a, .05); own = max(mix(vec3(dot(own, vec3(.3, .59, .11))), own, 1.2), .01); own *= own; own *= .17 / max(dot(own, vec3(.3, .59, .11)), .03);
  float half_ = kcKn.y * kcKn.z * .5;
  dye = mix(dye, own, kcS(half_ + 2., half_ - .5, abs(kcKn.x)) * sat(1.5 * m.a * (.5 + uEnergy)) * .8 * sat(kcSz * 1.6));
  float fine = kcS(2.2, .6, kcPx / c.r * 6.);
  // the spun thread: fibres that slant along each ply, and its thick and thin places
  vec2 g = vec2(kcGrain.x * 3.2 - kcGrain.y * 2.6 * c.hand + i * 7., kcGrain.y * .55 + kcPly * 5.);
  float fib = noise(g) + .6 * noise(g * vec2(2.3, 1.7) + 9.) - .8;
  dye *= 1. + .75 * fib * fine + .13 * sin(S * .31 + i * 9. + sin(S * .13));
  kcNo.y += .5 * fib * fine;
  float ride = clamp((s + main * .1) / main, -1., 0.) * step(0., main);  // it goes over the main cord
  kcNo.y += ride * 1.6; kcNo.z *= 1. + ride * .6;
  vec3 n = normalize(vec3(kcAx * kcNo.x + kcDn * kcNo.y, max(kcNo.z, .02)));
  float nl = sat(dot(n, kcSun) * .85 + .15);
  float under = kcS(main * 3., main * 2., s) * kcS(main * 1., main * 1.5, s);  // the main cord's shade on it
  vec3 lit = kcSunC * kcSunIn * nl * 1.15 * (1. - .85 * under) + kcAirC * (.75 + .35 * n.y) + kcFill * (.5 - .5 * n.y + .4 * (1. - n.z));
  lit *= mix(.32, 1., kcDim) * (1. + kcAtHead(c.t) * uHits * .8 + kcCueAt(c.t) * uCue * .4 + (mod(i, 3.) < .5 ? uKeys * .6 * sat(kcSz) : 0.));
  z += kcZ * c.r;
  vec3 k = dye * lit;
  if (z > kcNear) { kcAcc = kcAcc * (1. - cov) + k * cov; kcNear = z; } else kcAcc += k * cov * (1. - kcAl);
  kcAl = cov + kcAl * (1. - cov);
}
// A thinner cord tied to some of them, beside them: how far across it.
bool kcSide(inout Kc c, float s) {
  float i = c.i, from, h = kcH(i * 3.7 + 41.), sgn = fract(h * 17.) > .3 ? 1. : -1.;
  from = .1 + .34 * fract(h * 57.);
  float o = s - from;
  if (kcA || h > .62 || o < -.02) return false;
  o = max(o, 0.);
  c.x -= sgn * (.031 * (1. - exp(-o * 26.)) + o * (.012 + kcAmp * uPhrase * .065 * sin(uTime * 1.15 + i * .8)));
  c.x -= .004 * sin(o * 19. + h * 30.) * sat(o * 9.);
  c.i += .37; c.from = from; c.main = -1.; c.r *= .6; c.len = from + .2 + .26 * fract(h * 91.);
  c.code = h < .16 ? 0 : h < .3 ? 55 : h < .42 ? 11 : h < .52 ? 66 : 22;
  return true;
}
// Keeps the two cords that are nearest.
void kcKeep(Kc c, inout Kc a, inout Kc b) {
  float w = abs(c.x) / c.r, wa = abs(a.x) / a.r, wb = abs(b.x) / b.r;
  if (wa < wb) { if (w < wb) b = c; } else if (w < wa) a = c;
}
vec3 render(vec2 p) {
  kcA = uVar < .5; kcN = kcA ? 34. : 20.; kcPx = max(fwidth(p.y), 1e-5); kcAmp = .6 + .75 * uEnergy;
  float turn = sin(uTravel * .013) , far = .75 + .5 * uSpace;
  kcFall = (kcA ? vec2(.034 + .006 * turn, -.03 + .006 * turn) : vec2(.04 + .004 * turn, -.02 + .006 * turn)) * far;
  kcSun = normalize(vec3(-kcFall / far, .034));
  float pend = (.0015 + .016 * uDrone * kcAmp) * sin(uTime * .61);
  vec2 q = p; if (kcA) q = kcMid + (p - kcMid) * rot(pend);
  // the two lookups, here and where a shadow here would be thrown from
  vec2 f = kcField(q), fs = kcField(q - kcFall);
  vec2 gu = vec2(dFdx(f.x), dFdy(f.x)) / kcPx; float per = clamp(length(gu), 1., 60.);
  float perS = clamp(length(vec2(dFdx(fs.x), dFdy(fs.x))) / kcPx, 1., 60.);
  vec2 ax = gu / max(length(gu), 1e-4), dn = vec2(ax.y, -ax.x);  // across and down the cord
  float soft = mix(.007, .0016, uTone) + kcPx, main = kcA ? .024 : .022;
  float lean = kcLean(f.x - .5), leanS = kcLean(fs.x - .5);
  kcSunIn = 1. - .95 * kcS(-.012, .012, kcA ? p.y - .62 + .5 * p.x + .03 * turn : -.425 - .2 * p.x - p.y + .03 * turn);
  kcSunC = vec3(1., .9, .74) * (.95 + .1 * uLevel); kcAirC = vec3(.12, .21, .40); kcFill = kcA ? vec3(.15, .12, .085) : vec3(.15, .085, .045);
  kcAcc = vec3(0); kcAl = 0.; kcNear = -9.; kcAx = ax; kcDn = dn;
  // the cords near here, the two nearest at most
  Kc c0 = Kc(9., 1., 1., 1., 0., 0., 0., 0., 99), c1 = c0; int n = 0;
  for (int j = 0; j < 2; j++) {
    Kc c = kcCord(floor(f.x - lean * max(f.y, 0.) * per - .5) + float(j), f, per, lean);
    if (c.code == 99 || f.y < -main * 1.6) continue;
    if (abs(c.x) < c.r * 2.4 + kcPx) { kcKeep(c, c0, c1); n++; }
    if (kcSide(c, f.y) && abs(c.x) < c.r * 2.4 + kcPx) { kcKeep(c, c0, c1); n++; }
  }
  for (int j = 0; j < min(n, 2); j++) { if (j > 0) c0 = c1; kcLay(c0, f.y); }
  for (int top = 0; top < 1 && abs(f.y + .03) < .07; top++) {  // only along the top
    // it is lashed to the pole where no cord hangs
    float lx = p.x + .39; if (abs(p.x - .2175) < abs(lx)) lx = p.x - .2175; if (abs(p.x - .74) < abs(lx)) lx = p.x - .74;
    lx += .12 * (f.y + .029);
    float w = lx / .0105, v = clamp(floor(w + 2.), 0., 3.), t = (w + 1.5 - v) * 2., u = (f.y + .029 + .003 * sin(v * 2.4)) / .052;
    if (!kcA && abs(t) < 1.3 && abs(u) < 1.3) {
      float round_ = sqrt(max(1. - t * t, 0.)), d = max((abs(t) - 1.) * .005, (abs(u) - .86 - .16 * round_) * .052);
      vec3 n = normalize(vec3(t * .9, -u * u * u * 1.2, round_ * .8 + .2));
      vec3 k = kcDye[1] * (1. + .2 * sin(u * 34. + t * 2.)) * (kcSunC * kcSunIn * sat(dot(n, kcSun) * .85 + .15) * 1.1 + kcAirC * (.8 + .3 * n.y) + kcFill * .5) * (.3 + .7 * round_);
      float cov = kcCov(d) * (1. - kcAl);
      kcAcc += k * cov; kcAl += cov;
    }
    // the main cord
    if (abs(f.y) < main + .004) {
      float along = f.x * (kcA ? kcStep * kcArc : kcGap);
      kcRope(f.y / main, along / main, 3, 1.);
      float cov = kcCov(kcD * main);
      vec3 n = normalize(vec3(dn * kcNo.x + ax * kcNo.y, max(kcNo.z, .02)));
      vec3 dye = (kcPly > .5 ? kcDye[2] : kcDye[1]) * (1. + .12 * sin(kcGrain.y * 6. + kcGrain.x * 4.) + .25 * (noise(vec2(along * 90., f.y * 200.)) - .5));
      vec3 k = dye * (kcSunC * kcSunIn * sat(dot(n, kcSun) * .9 + .1) * 1.2 + kcAirC * (.8 + .3 * n.y) + kcFill * .5) * mix(.35, 1., kcDim);
      kcAcc += k * cov * (1. - kcAl); kcAl = max(kcAl, cov);
    }
    // the pole
    float y = (f.y + kcPole + .004 * sin(p.x * 5. + 1.)) / .03;
    if (!kcA && abs(y) < 1.2) {
      float g = noise(vec2(p.x * 7., y * 5. + noise(p * 9.) * 2.)), g2 = noise(vec2(p.x * 22., y * 17.));
      vec3 n = normalize(vec3(0, -y * .95, sqrt(max(1. - y * y, 0.)) + .03) + vec3(0, g2 - .5, 0) * .5);
      vec3 k = mix(vec3(.13, .075, .042), vec3(.3, .2, .13), g) * (.7 + .5 * g2);
      k *= kcSunC * kcSunIn * sat(dot(n, kcSun)) * 1.3 + kcAirC * (.8 + .4 * n.y) + kcFill * (.5 - .5 * n.y);
      float cov = kcCov((abs(y) - 1.) * .03) * (1. - kcAl);
      kcAcc += k * cov; kcAl += cov;
    }
  }
  vec3 col = vec3(0);
  if (kcAl < .995) {
    // the shadows on the wall, and the wall
    float dark = 0.;
    for (int j = 0; j < 2; j++) {
      Kc c = kcCord(floor(fs.x - leanS * max(fs.y, 0.) * perS - .5) + float(j), fs, perS, leanS);
      if (c.code == 99 || fs.y < -.01) continue;
      if (abs(c.x) < c.r * 2.4 + soft) { kcKnot(c, fs.y); dark = max(dark, kcHidden(c, fs, soft)); }
      if (kcSide(c, fs.y) && abs(c.x) < c.r * 2.4 + soft) { kcSz = 0.; dark = max(dark, kcHidden(c, fs, soft)); }
    }
    dark = max(dark, kcS(soft, -soft, abs(fs.y) - main));
    if (!kcA) dark = max(dark, kcS(soft, -soft, abs(fs.y + kcPole) - .03));
    float bump; vec3 wall = kcWall(p, bump);
    vec3 wallAir = kcA ? vec3(.1, .2, .42) : mix(vec3(.11, .26, .74), vec3(.12, .18, .26), kcS(0., .9, kcSunIn * (1. - dark)));
    col = wall * (kcSunC * kcSunIn * (1. - dark) * (.86 + bump) + wallAir * (1. + .4 * bump) + vec3(.03, .02, .01));
  }
  col = col * (1. - kcAl) + kcAcc;
  col *= 1. + .12 * col;
  return pow(sat(col), vec3(.4545));
}
