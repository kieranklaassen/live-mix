// name: Knotted cords
// a: Fanned
// b: Hung straight
// what: A twisted cord slung across a sunlit plaster wall, and from it some thirty cotton cords in undyed, rust, indigo and brown, fanned out like a half-opened skirt, knotted at different heights, each with a blue shadow beside it; or cords longer than the picture hung straight from a pole on a clay wall, thin side cords tied to some.
// follows: Left to right is the piece, top to bottom the room: where it is loud a knot is tied, fat and dyed with that sound. Drone swings them all, pad and texture sway neighbours, phrases tip some cords or the side cords, bands stir each in order. A hit plucks and lights the cord at the playhead; a cue runs down the row. Keys light knots, travel moves the sun.
// own: 0 1 a few great ropes, -1 a host of fine threads; 1 a: 1 a wheel of cords all round a ring that turns slowly, -1 the fan curls over (b: 1 gathered into a sheaf, -1 streaming aside in a wind); 2 1 strung with round beads, -1 no knots at all; 3 the ground: 1 night, -1 a far sky in the drone's and the pad's colour; 4 1 dyed in the sounds' colours, -1 all in the phrase's; 5 1 metal, -1 smooth clear glass; 6 1 longer than the picture (b: what they hang from is out of sight), -1 short, the ends in a waving hem; 7 1 a second row stands behind in mist, -1 one low lamp and the dark round it
bool kcA;             // the fanned one
float kcPx, kcN, kcAmp;
vec2 kcFall;          // how far a shadow falls from its cord
vec3 kcSun;
vec2 kcMid = vec2(-.14, .95);   // the middle of the fan
const float kcPole = .05;              // how far above its main cord the pole lies
float kcArc = .63, kcStep = .06, kcGap = .087, kcTop = .33, kcThick = 1., kcRound = 0., kcBead = 0.;
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
  if (!kcA && uOwn[1] != 0.) {
    float o = max(kcTop - p.y, 0.), u = (o - .46) * 3.;
    if (uOwn[1] > 0.) p.x = (p.x + .04) / (1. - .74 * uOwn[1] * exp(-u * u)) - .04;
    else p.x += uOwn[1] * o * (.85 * o + .04 * sin(o * 7. - uTime * .4));
  }
  if (!kcA) return vec2((p.x + kcGap * (uOwn[0] == 0. ? 10. : kcN * .5)) / kcGap, kcTop - p.y);
  vec2 d = p - kcMid;
  float s = length(d) - kcArc, o = max(s, 0.);
  if (uOwn[1] < 0.) d *= rot(uOwn[1] * (1.5 * o + .9 * o * o + .02 * sin(o * 8. - uTime * .4)));
  if (kcRound > .5) d *= rot(uTime * .011);
  if (uOwn[1] > 0.) return vec2(atan(d.x, max(-d.y - .3 * (1. - uOwn[1]) * o * o * d.x * d.x / (dot(d, d) + .01), mix(.01, -9., uOwn[1]))) / kcStep + kcN * .5 - 1.5, s);
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
float kcAtHead(float t) { float d = abs(fract(t - uLoop + .5) - .5) * kcN; if (uOwn[0] < 0.) d *= exp2(1.3 * uOwn[0]); return exp(-d * d * .9); }
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
  if (uOwn[5] < 0. && n < 3) {         // a smooth rod
    float w = 1. - .6 * max(uOwn[2], 0.), v = X / w, u = sqrt(max(1. - v * v, 0.));
    kcNo = mix(kcNo, vec3(v, 0, u), -uOwn[5]); kcD = mix(kcD, abs(X) - w, -uOwn[5]); kcZ = mix(kcZ, u, -uOwn[5]); kcDim = mix(kcDim, 1., -uOwn[5]); kcPly *= 1. + uOwn[5];
  }
}
void kcCoil(float X, float Y, float tilt, float R, float m) {
  float t = (Y - tilt * X) / m, c = sqrt(max(1. - t * t, 0.)), w = R + m * c;
  float d = max(abs(X) - w, (abs(t) - 1.) * m * .8), z = sqrt(max(w * w - X * X, 0.)) - 3. * max(d, 0.);
  kcD = min(kcD, d);
  if (z > kcZ) { kcZ = z; kcNo = vec3(X / w * (c + .1), t, sqrt(max(1. - X * X / (w * w), 0.)) * (c + .1)); kcPly = step(0., sin(X * 2.4 + t * 1.6)); kcGrain = vec2(t, X * 1.3); kcDim = .35 + .65 * kcS(1., .55, abs(t)); }
}
// A cord: across it, its radius, length and twist, its place in the piece and number, where it is tied, to how thick a cord (-1: to another cord).
vec3 kcBeadDye(float n) { vec3 k = kindColour(floor(kcH(n) * 4.99)); return k * k * 1.1 + .01; }
// A cord's colour where the cords are dyed in the sounds' colours, or all in one.
vec3 kcPaint(vec3 was, float i, float ply) {
  if (uOwn[4] == 0.) return was;
  if (uOwn[4] > 0.) { vec3 k = uKind[int(mod(floor(kcH(i * 5.3 + 2.) * 11. + ply * step(.6, kcH(i * 2.9)) * 2.), 5.))]; return mix(was, k * k * .85, uOwn[4]); }
  return mix(was, uKind[3] * uKind[3] * (.7 + .3 * kcH(i * 9.1)) * (1. - .2 * ply), -uOwn[4]);
}
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
  if (uOwn[2] > 0.) { pitch = mix(pitch, 4., uOwn[2]); kcSz = max(kcSz, uOwn[2] * (h2 < .35 ? 0. : .5 + .4 * h3)); }
  if (uOwn[2] < 0.) kcSz *= 1. + uOwn[2];
  n = min(n, max(floor((tier * .6 / r) / pitch), 1.));
  kcKn = vec3((s - at) / r, pitch, n);
  return m;
}
// The knots' own outline at X, added to the plain cord's.
float kcKnotCell() { float o = (kcKn.z - 1.) * .5, id = clamp(floor(kcKn.x / kcKn.y + o + .5), 0., max(kcKn.z - 1., 0.)); return kcKn.x - (id - o) * kcKn.y; }
void kcTie(float X) {
  if (kcSz < .02) return;
  float y = kcKnotCell(), R = mix(.15, .92, kcSz), m = mix(.3, .62, min(kcSz, 1.));
  if (uOwn[2] > 0.) {
    float B = 2.05 * min(kcSz, 1.) * uOwn[2], rr = X * X + y * y, z = sqrt(max(B * B - rr, 0.));
    kcD = min(kcD, sqrt(rr) - B);
    if (rr < B * B && z > kcZ) { kcZ = z; kcNo = vec3(X, y, z) / B; kcPly = 0.; kcGrain = vec2(X, y) * .4; kcDim = 1.; kcBead = 1.; }
    R *= 1. - uOwn[2]; m *= 1. - .7 * uOwn[2];
  }
  if (kcLong) kcCoil(X, y, .12, R * .95, min(m, .56)); else { kcCoil(X, y - .12, -.42, R * .85, m); kcCoil(X, y + .12, .42, R, m); }
}
// How far outside its shadow's outline.
float kcBlob(float X) {
  float y = kcKnotCell(), R = mix(.15, .92, kcSz), m = kcLong ? .6 : 1.05;
  if (uOwn[2] > 0. && kcSz >= .02) return min(abs(X) - .95, length(vec2(X, y)) - 2.05 * min(kcSz, 1.) * uOwn[2]);
  return kcSz < .02 ? abs(X) - .95 : min(abs(X) - .95, max(abs(X) - R - .5 * sqrt(max(1. - y * y / (m * m), 0.)), abs(y) - m));
}
// Cord number i as it hangs: how far we are across it; per is cells for a length.
Kc kcCord(float i, vec2 f, float per, float lean) {
  Kc c; float i0 = i;
  if (kcRound > .5) i = mod(i, kcN);
  float h = kcH(i * 1.7 + 5.);
  c.i = i; c.t = kcTime(i); c.code = kcA ? (i < 0. || i >= kcN ? 99 : kcCords[int(mod(i + .5, 34.))]) : kcCords[int(mod(i + 10., 34.))];
  if (!kcA && uOwn[1] > .2 && abs(i + .5 - kcN * .5) > kcN * .5) c.code = 99;
  float o = max(f.y, 0.);
  float bend = (kcA ? .07 : .016) * (fract(h * 29.3) - .5) * o * (1. - (kcA ? 2. : 3.) * o) + (kcA ? .03 * (h - .5) * o : 0.);
  if (kcA && mod(i, 3.) < .5) bend += uPhrase * kcAmp * .022 * sin(uTime * 1.15 + i * .8) * kcS(.25, .7, o);
  lean += (kcAmp * band(c.t) * .022 + .004 * h * h) * sin(uTime * (1. + .7 * h) + h * 40.);
  bend += lean * o;
  if (uHits > .001) bend += kcAtHead(c.t) * uHits * (1. - uHits) * .08 * sin(uHits * 16.) * sin(min(o * 3.5, PI));
  c.x = (f.x - i0 - .5 - (kcA ? .16 : .25) * (h - .5)) / per - bend;
  c.r = (kcA ? .0115 : .0155) * (.85 + .3 * fract(h * 13.7)) * kcThick;
  c.len = kcA ? .48 + .5 * fract(h * 71.3) : 1.6;
  if (uOwn[6] > 0.) c.len += 1.4 * uOwn[6];
  if (uOwn[6] < 0.) c.len = mix(c.len, (kcA ? .25 : .34) + (kcA ? .07 : .16) * sin(i * 17. / kcN + 1.) + .05 * (fract(h * 71.3) - .5), -uOwn[6]);
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
vec3 kcAcc, kcSunC, kcAirC, kcFill; float kcAl, kcNear, kcSunIn, kcLamp = 1.; vec2 kcAx, kcDn;
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
  kcBead = 0.;
  kcTie(X);
  kcCoil(X, (s - from) / c.r, .2, .75, .6);
  // stray fibres along its edge
  float end = s - c.len, hair = 0.;
  if (end > -.03) end += .02 * noise(vec2(X * 4., i));
  if (kcD > -.06) hair = kcS(.4, -.05, kcD) * kcS(.6, .8, noise(vec2(S * 2.6 + X * 2. * c.hand, X * 1.5 + i * 7.))) * .7 * kcCov(end);
  hair *= 1. - abs(uOwn[5]);
  float cov = max(kcCov(max(kcD * c.r, end)), hair);
  if (main > 0.) cov *= kcCov(-s - main * .9 - c.r * .9 * sqrt(max(1. - X * X, 0.)));
  else cov *= kcCov(from - s - c.r * (.5 + .8 * sqrt(max(1. - X * X, 0.))));
  if (cov <= 0.) return;
  vec3 dye = kcDye[kcPly > .5 ? c.code / 10 : c.code % 10];
  vec3 own = m.rgb / max(m.a, .05); own = max(mix(vec3(dot(own, vec3(.3, .59, .11))), own, 1.2), .01); own *= own; own *= .17 / max(dot(own, vec3(.3, .59, .11)), .03);
  dye = kcPaint(dye, i, kcPly);
  float half_ = kcKn.y * kcKn.z * .5;
  dye = mix(dye, own, kcS(half_ + 2., half_ - .5, abs(kcKn.x)) * sat(1.5 * m.a * (.5 + uEnergy)) * .8 * sat(kcSz * 1.6));
  if (kcBead > .5) dye = mix(dye, kcBeadDye(floor(i) * 3.1 + floor((s - kcKnotCell() * c.r) * 90. + .5)), .85 * (1. - sat(1.5 * m.a)) * step(0., uOwn[4])) ;
  float fine = kcS(2.2, .6, kcPx / c.r * 6.) * (1. - max(abs(uOwn[5]), kcBead));
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
  if (uOwn[5] != 0. || kcBead > .5) {
    float hl = sat(dot(n, normalize(kcSun + vec3(0., 0., 1.2)))), env = sat(.5 + .6 * n.y), rim = 1. - sat(n.z), sun = .3 + .7 * kcSunIn;
    float tight = hl * hl; tight *= tight; tight *= tight; tight *= tight; tight *= tight;
    if (kcBead > .5) k += kcSunC * sun * tight * .7;
    if (uOwn[5] > 0.) k = mix(k, (dye * (.14 + 1.1 * env * env * env) + (.25 + dye) * (tight * 1.5 + .35 * hl * hl * hl * hl)) * sun * mix(.3, 1., kcDim), uOwn[5]);
    if (uOwn[5] < 0.) {
      float far_ = sat(.45 - .9 * dot(n.xy, kcSun.xy) / (length(kcSun.xy) + .01));
      k = mix(k, dye * (.12 + 1.25 * far_ * far_ * (.35 + .65 * rim)) * sun + (.15 + .5 * kcAirC) * rim * rim + kcSunC * sun * tight * 1.3, -uOwn[5]);
      cov *= mix(1., .5 + .5 * rim + .4 * tight, -uOwn[5]); cov = min(cov, 1.);
    }
  }
  if (uOwn[5] != 0.) k *= 1. + kcAtHead(c.t) * uHits * .8 + kcCueAt(c.t) * uCue * .4;
  if (uOwn[4] != 0.) k = mix(k, uKind[4] * uKind[4] * (.25 + 1.1 * lit), min(1.5 * abs(uOwn[4]), .8) * uHits * kcAtHead(c.t));
  if (uOwn[7] < 0.) k *= kcLamp;
  if (z > kcNear) { kcAcc = kcAcc * (1. - cov) + k * cov; kcNear = z; } else kcAcc += k * cov * (1. - kcAl);
  kcAl = cov + kcAl * (1. - cov);
}
// A thinner cord tied to some of them, beside them: how far across it.
bool kcSide(inout Kc c, float s) {
  float i = c.i, from, h = kcH(i * 3.7 + 41.), sgn = fract(h * 17.) > .3 ? 1. : -1.;
  from = .1 + .34 * fract(h * 57.);
  float o = s - from;
  if (kcA || h > .62 || o < -.02 || (uOwn[6] < 0. && from + .06 > c.len)) return false;
  o = max(o, 0.);
  c.x -= sgn * (.031 * (1. - exp(-o * 26.)) + o * (.012 + kcAmp * uPhrase * .065 * sin(uTime * 1.15 + i * .8)));
  c.x -= .004 * sin(o * 19. + h * 30.) * sat(o * 9.);
  c.i += .37; c.from = from; c.main = -1.; c.r *= .6; c.len = from + .2 + .26 * fract(h * 91.) * (1. + .6 * min(uOwn[6], 0.));
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
  if (uOwn[0] != 0.) {
    float z = exp2(uOwn[0] * .85);
    kcN = floor(kcN / z + .5); kcThick = z; kcStep = .06 * 34. / kcN; kcGap = .087 * 20. / kcN;
  }
  if (kcA && uOwn[1] > 0.) {
    kcMid = mix(kcMid, vec2(0), uOwn[1]); kcArc = mix(kcArc, .13, uOwn[1]); kcStep = mix(kcStep, TAU / kcN, uOwn[1]);
    kcRound = step(.99, uOwn[1]);
  }
  if (!kcA) kcTop += .34 * max(uOwn[6], 0.);
  float turn = sin(uTravel * .013) , far = .75 + .5 * uSpace;
  kcFall = (kcA ? vec2(.034 + .006 * turn, -.03 + .006 * turn) : vec2(.04 + .004 * turn, -.02 + .006 * turn)) * far;
  kcSun = normalize(vec3(-kcFall / far, .034));
  float pend = (.0015 + .016 * uDrone * kcAmp) * sin(uTime * .61);
  vec2 q = p; if (kcA) q = kcMid + (p - kcMid) * rot(pend);
  // the two lookups, here and where a shadow here would be thrown from
  float back = max(uOwn[7], 0.);
  vec2 qs = q - kcFall;
  if (back > 0.) { vec2 m_ = vec2(0., kcA ? kcMid.y : kcTop); qs = mix(qs, m_ + (q - m_ - vec2(.05, -.06)) * 1.6 + vec2(.013, 0.), back); }
  vec2 f = kcField(q), fs = kcField(qs);
  vec2 gu = vec2(dFdx(f.x), dFdy(f.x)) / kcPx; float per = clamp(length(gu), 1., 60.);
  float perS = clamp(length(vec2(dFdx(fs.x), dFdy(fs.x))) / kcPx, 1., 60.);
  if (kcRound > .5) {                  // the angle begins again somewhere: there the steps are taken half a turn off
    float a = mod(f.x + kcN * .5, kcN), b = mod(fs.x + kcN * .5, kcN);
    vec2 g = vec2(dFdx(a), dFdy(a)) / kcPx, h = vec2(dFdx(b), dFdy(b)) / kcPx;
    if (dot(g, g) < dot(gu, gu)) gu = g;
    per = clamp(length(gu), 1., 60.); perS = clamp(min(perS, length(h)), 1., 60.);
  }
  vec2 ax = gu / max(length(gu), 1e-4), dn = vec2(ax.y, -ax.x);  // across and down the cord
  float soft = mix(.007, .0016, uTone) + kcPx, main = kcA ? .024 : .022;
  float lean = kcLean(f.x - .5), leanS = kcLean(fs.x - .5);
  kcSunIn = 1. - .95 * kcS(-.012, .012, kcA ? p.y - .62 + .5 * p.x + .03 * turn : -.425 - .2 * p.x - p.y + .03 * turn);
  kcSunC = vec3(1., .9, .74) * (.95 + .1 * uLevel); kcAirC = vec3(.12, .21, .40); kcFill = kcA ? vec3(.15, .12, .085) : vec3(.15, .085, .045);
  if (uOwn[7] < 0.) { vec2 l = p - vec2(-.4, -.05); kcLamp = mix(1., .06 + 1.5 * exp(-dot(l, l) * 3.2), -uOwn[7]); kcSunIn = mix(kcSunIn, 1., -uOwn[7]); }
  if (uOwn[3] != 0. || back > 0. || kcRound > .5) kcSunIn = mix(kcSunIn, 1., max(max(abs(uOwn[3]), back), kcRound));
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
      kcAcc += k * kcLamp * cov; kcAl += cov;
    }
    // the main cord
    if (abs(f.y) < main + .004) {
      float along = f.x * (kcA ? kcStep * kcArc : kcGap);
      kcRope(f.y / main, along / main, 3, 1.);
      float cov = kcCov(kcD * main);
      vec3 n = normalize(vec3(dn * kcNo.x + ax * kcNo.y, max(kcNo.z, .02)));
      vec3 dye = kcPaint(kcPly > .5 ? kcDye[2] : kcDye[1], 3., kcPly) * (1. + .12 * sin(kcGrain.y * 6. + kcGrain.x * 4.) + .25 * (noise(vec2(along * 90., f.y * 200.)) - .5));
      vec3 k = dye * (kcSunC * kcSunIn * sat(dot(n, kcSun) * .9 + .1) * 1.2 + kcAirC * (.8 + .3 * n.y) + kcFill * .5) * mix(.35, 1., kcDim);
      k *= kcLamp;
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
      kcAcc += k * kcLamp * cov; kcAl += cov;
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
    if (uOwn[3] > 0.) { wall = mix(wall, vec3(.006, .007, .01) + .06 * uKind[0] * uKind[0] * kcS(-.6, .6, p.y), uOwn[3]); bump *= 1. - .6 * uOwn[3]; }
    if (uOwn[3] < 0.) {
      vec3 sky = mix(uKind[0], uKind[1], kcS(-.5, .5, p.y + .3 * (noise(p * vec2(1.5, 3.4) + 7.) + .5 * noise(p * vec2(3.7, 8.)) - .75)));
      wall = mix(wall, sky * sky * .95, -uOwn[3]); bump *= 1. + .95 * uOwn[3]; dark *= 1. + .85 * uOwn[3] * (1. - back); wallAir = mix(wallAir, vec3(.12), -uOwn[3]);
    }
    float row = dark; dark *= 1. - back;
    col = wall * (kcSunC * kcSunIn * (1. - dark) * (.86 + bump) + wallAir * (1. + .4 * bump) + vec3(.03, .02, .01));
    if (back > 0.) { vec3 k = kcPaint(vec3(.2), floor(fs.x), 0.); col = mix(col, col * .42 + .22 * k, row * back * .9); }
    if (uOwn[7] < 0.) col *= kcLamp;
  }
  col = col * (1. - kcAl) + kcAcc;
  col *= 1. + .12 * col;
  return pow(sat(col), vec3(.4545));
}
