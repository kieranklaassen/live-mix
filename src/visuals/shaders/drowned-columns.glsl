// name: Drowned columns
// a: Lamp boat
// b: Broken roof
// what: A flooded hall underground: ranks of stone columns in black-green water, one huge and close, go off into the dark; a flat boat with one lamp hangs among them and lights their wet sides; or a piece of the roof has fallen, and noon comes down past hanging roots onto a small island with one green tree.
// follows: Drone opens the far dark, pads brighten lamp or noon, texture draws a net of water light on the vaults, a phrase drifts the boat or lights the leaves, the loop turns the boat. Each kind is a sunken lamp, the piece is dye on the water, bands light the ranks. A hit drops a ring whose bright line climbs the columns; a cue raises the sunken lamps. Keys spark.
// own: 0 clear air and light that reaches far at -1, pale mist at 1; 1 thin poles at -1, heavy piers at 1; 2 white stone and sea-blue water at -1, red brick and rust water at 1; 3 cold moonlight at -1, ember red at 1; 4 low vaults close over the water at -1, a towering hall at 1; 5 the eye high up among the capitals looking down on the water at -1, in the middle of a straight avenue of columns at 1; 6 square piers at -1, the vaults fallen in piece by piece until the columns stand under an open sky at 1; 7 sand or snow blown over the floor until the water is gone at -1, round leaves and flowers afloat at 1
// Columns stand on whole numbers of the plan; the water is y = 0.
const float dkF = .95;
#define dkNave max(uOwn[5], 0.)
#define dkHigh max(-uOwn[5], 0.)
#define dkOpen max(uOwn[6], 0.)
#define dkSq max(-uOwn[6], 0.)
#define dkLeaf max(uOwn[7], 0.)
#define dkSand max(-uOwn[7], 0.)
vec3 dkSkyLo, dkSkyHi;
vec2 dkRt, dkFw, dkHome, dkB, dkDrop, dkKp[5]; // right, ahead, our seat, boat or island, a hit, sunken lamps
vec3 dkL, dkLc, dkStone, dkMist, dkMurk, dkKc[5];
// A smooth step that may also run downwards.
float dkUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
bool dkBo;
float dkS, dkReach, dkH, dkPx, dkFog, dkChop, dkAge, dkGirth, dkYaw;

vec2 dkOff(vec2 d) { return mix(d, vec2(1e-4), lessThan(abs(d), vec2(1e-4))); } // never 0
vec2 dkAt(float x, float z) { return dkHome + x * dkRt + z * dkFw; }
vec3 dkWay(float q, vec3 lo, vec3 at, vec3 hi) { return mix(at, q > .0 ? hi : lo, abs(q)); }
void dkSet() {
  bool b = uVar > .5;
  float t = uTime, high = uOwn[4], turn = (b ? -.36 : .45) * (1. - dkNave);
  dkBo = !b;
  dkPx = 1. / uRes.y; dkAge = 1. - uHits;
  dkRt = vec2(cos(turn), -sin(turn)); dkFw = vec2(-dkRt.y, dkRt.x);
  dkHome = -(b ? .47 * dkRt + .8 * dkFw : -.385 * dkRt + .6 * dkFw);
  dkHome = mix(dkHome, vec2(-.5, -.62), dkNave);
  dkS = (b ? 1.15 : 1.22) * (1. + (high > .0 ? .75 : .45) * high);
  dkH = .5 * (1. + .35 * high);
  dkGirth = 1. + (uOwn[1] > .0 ? .75 : .55) * uOwn[1];
  dkChop = (.016 + .012 * uLow + .01 * uMid);
  dkFog = .3 * (1. - .4 * uDrone) / (.75 + .5 * uSpace) * exp2((uOwn[0] > .0 ? .9 : 2.) * uOwn[0]); dkReach = mix(.9, .35, sat(-uOwn[0]));
  dkMist = vec3(.0012, .0024, .0026) + vec3(.1, .16, .17) * ((b ? .02 : .0) + max(uOwn[0], .0));
  dkStone = dkWay(uOwn[2], vec3(.95, .97, .92), vec3(.5, .46, .38), vec3(.62, .23, .14));
  dkMurk = dkWay(uOwn[2], vec3(.03, .3, .42), vec3(.07, .17, .11), vec3(.2, .06, .05)) * 2.2;
  dkYaw = cos(.35 * sin(TAU * uLoop) + .5);
  dkB = b ? floor(dkAt(mix(.45 - .2 * dkHigh, .0, dkNave), 2.75 - .6 * dkHigh)) + .5 : dkAt(mix(.57, .0, max(dkNave, dkHigh)) + .1 * sin(t * .027) + .22 * uPhrase * sin(t * .09), mix(2.55, 2.1, dkHigh) + .12 * sin(t * .021 + 2.));
  dkL = b ? vec3(dkB, .42).xzy : vec3(dkB - .17 * dkYaw * dkRt, .335).xzy;
  dkLc = dkWay(uOwn[3], vec3(.34, .6, 1.), b ? vec3(.86, .92, .72) : vec3(1., .5, .17), vec3(1., .3, .07)) * (b ? 1.05 : .85) * (.8 + .9 * uPad * (.4 + uEnergy) + .25 * uLevel);
  dkSkyLo = dkSkyHi = vec3(.0);
  if (uOwn[6] > 0.) {
    vec3 w = dkWay(uOwn[3], vec3(.1, .17, .34), vec3(.5, .56, .6), vec3(.85, .36, .16)), z = dkWay(uOwn[3], vec3(.012, .03, .09), vec3(.13, .25, .4), vec3(.16, .1, .2));
    float up = dkOpen * (.6 + .5 * uPad + .25 * uDrone);
    dkSkyLo = w * mix(vec3(1.), uKind[1] * uKind[1] * 2., .35) * up; dkSkyHi = z * mix(vec3(1.), uKind[0] * uKind[0] * 2.2, .3) * up;
    dkMist = mix(dkMist, dkSkyLo, dkOpen); dkFog *= 1. - .45 * dkOpen;
  }
  dkDrop = dkAt(b ? .12 : .2, 1.75);
  float lv[5] = float[5](uDrone, .7 * uPad, uTexture, uPhrase, uHits);
  dkKp[0] = dkAt(-.75, 4.3); dkKp[1] = dkAt(1.75, 4.2); dkKp[2] = dkAt(-.15, 3.2); dkKp[3] = dkAt(1.75, 2.35); dkKp[4] = dkAt(-1.6, 3.);
  for (int k = 0; k < 5; k++) { vec3 c = uKind[k] * uKind[k]; dkKc[k] = c / max(dot(c, vec3(.35, .5, .15)), .06) * (lv[k] + 1.4 * uCue) * (.35 + uEnergy); }
}
// A column: its middle, girth, height.
vec4 dkNode(vec2 n) {
  if (n == vec2(.0)) return vec4(.0, .0, (dkBo ? mix(.172, .1, dkNave) : .1) * mix(1., dkGirth, .5), 9.);
  float h = hash21(n + vec2(31., 57.)), g = fract(h * 91.7), m = fract(h * 331.3);
  vec4 c = vec4(n + (vec2(g, fract(h * 37.9)) - .5) * .17 * (1. - .85 * dkNave), (.072 + .05 * fract(h * 17.3)) * dkGirth, 9.);
  vec2 far = n - dkHome;
  if (m < .2 * (1. - dkNave) + .35 * dkOpen && dot(far, far) > 9.) c.w = m < .12 ? .06 + 1.6 * m : -1.;
  return c;
}
// Where a way leaves an arch.
float dkOut(float u, float du, float y, float dy, float w, float h) {
  u /= w; du /= w; y /= h; dy /= h;
  float a = du * du + dy * dy + 1e-6, b = u * du + y * dy;
  return (sqrt(max(b * b - a * (u * u + y * y - 1.), .0)) - b) / a;
}
// How far into the stone beside an arch.
float dkIn(float u, float y, float w) {
  vec2 s = vec2(w, dkH * w * 2.), q = vec2(u, y) / s;
  return .5 * (dot(q, q) - 1.) / max(length(q / s), .1);
}
// Walk the plan from line to line. What is met: 0 a column, 1 an arch, 2 the vault, 3 the water, 4 the dark.
vec3 dkN; float dkMat, dkCov, dkPast; vec2 dkId;
float dkWalk(vec3 o, vec3 d, float far, float trav) {
  vec2 dx = dkOff(d.xz), iv = 1. / dx, st = sign(dx);
  vec2 tn = (floor(o.xz) + step(.0, st) - o.xz) * iv, dl = abs(iv);
  float a = dot(dx, dx), t0 = .0;
  dkCov = 1.;
  for (int i = 0; i < 10; i++) {
    bool xl = tn.x < tn.y;
    float t = xl ? tn.x : tn.y;
    vec3 P = o + d * t;
    vec2 n = floor(P.xz + .5);
    vec4 c = dkNode(n);
    vec2 m = o.xz - c.xy;
    float tc = -dot(m, dx) / a, perp = length(m + dx * tc), R = c.z;
    vec2 bq = vec2(-1e3, 1e3); float bz = 1.;
    if (uOwn[6] < 0.) {
      vec2 e = abs(iv) * R * .9, w = -m * iv;
      R *= 1. + .28 * dkSq;
      bq = vec2(max(w.x - e.x, w.y - e.y), min(w.x + e.x, w.y + e.y));
      bz = bq.x > w.x - e.x ? 2. : 3.;
      float sil = c.z * .9 * (abs(dx.x) + abs(dx.y)) * inversesqrt(a);
      perp += max(R - sil, 0.);
    }
    if (perp < R * 1.3 && tc > .0 && c.w > .0) {
      float hp = dkPx * (tc + trav) * .8, dt = sqrt(max(R * R - perp * perp, .0) / a), th = tc - dt, y = o.y + d.y * th;
      dkId = n; dkMat = .0; dkPast = tc + 1e-3;
      float Rb = R * 1.3, db = sqrt(max(Rb * Rb - perp * perp, .0) / a), tb = tc - db, yb = o.y + d.y * tb, lo = dkS - .09;
      if (c.w > 1. && yb < dkS + .02 && d.y > .0 && (perp > R || y > lo) && tb > .0 && uOwn[6] >= 0.) {
        if (yb > lo) { dkN = vec3(m + dx * tb, .0).xzy / Rb; dkCov = sat((Rb - perp) / (2. * hp) + .5); return tb; }
        float tu = (lo - o.y) / d.y;
        if (tu < tc + db) { dkN = vec3(0, -1, 0); return tu; }
      }
      if (uOwn[6] < 0.) { if (bq.x < th) bz = .0; th = max(th, bq.x); dt = max(tc - th, .0); y = o.y + d.y * th; }
      if (perp < R + hp && th > .0 && th < far && y < dkS + .01 && y < c.w) {
        dkN = vec3(m + dx * th, .0).xzy; dkN /= max(length(dkN), 1e-4);
        if (bz > 2.5) dkN = vec3(0, 0, -st.y); else if (bz > 1.5) dkN = vec3(-st.x, 0, 0);
        dkCov = sat((R - perp) / (2. * hp) + .5);
        return th;
      }
      float tt = d.y < .0 ? (c.w - o.y) / d.y : -1.;
      if (c.w < 1. && tt > tc - dt && tt < tc + dt && tt < far) { dkN = vec3(0, 1, 0); return tt; }
    }
    if (t0 > far || (trav > .0 && i > 6)) break;
    if (P.y > dkS) {
      float u = fract(xl ? P.z : P.x) - .5, y = o.y - dkS, py = P.y - dkS, pix = dkPx * (t + trav) + 1e-5;
      vec2 mid = floor(o.xz + d.xz * .5 * (t0 + t)) + .5;
      bool gone = false;
      if (dkIn(u, py, .5) > .0) {
        vec2 q = o.xz - mid;
        float tx = dkOut(q.x, d.x, y, d.y, .5, dkH), tz = dkOut(q.y, d.z, y, d.y, .5, dkH);
        if (uOwn[6] > 0.) {
          vec3 V = o + d * clamp(max(tx, tz), t0, t);
          gone = noise(V * 2.6) * .75 + .25 * noise(V.xz * 9.) < dkOpen * 2.6 - .3 || max(tx, tz) < t0 - 1e-3;
        }
        if (!gone) {
        t = clamp(max(tx, tz), t0, t); P = o + d * t; q = P.xz - mid;
        q *= -4. * dkH; y = (dkS - P.y) / dkH;
        dkN = normalize(tx > tz ? vec3(q.x, y, .0) : vec3(.0, y, q.y));
        dkMat = 2.; return t;
        }
      }
      if (uOwn[6] > 0. && (py > dkH + .12 || hash21(floor(P.xz + (xl ? vec2(.5, .0) : vec2(.0, .5))) + (xl ? 3.3 : 8.7)) < dkOpen * 1.8 - .8)) { t0 = t; if (xl) tn.x += dl.x; else tn.y += dl.y; continue; }
      float e = dkIn(u, py, .43) / pix + .5;
      vec3 face = xl ? vec3(-st.x, 0, 0) : vec3(0, 0, -st.y);
      dkMat = 1.; dkN = face; dkPast = t + 1e-3;
      if (e >= 1.) return t;
      // the under side of the arch
      float ts = t + .11 * (xl ? dl.x : dl.y);
      vec3 Q = o + d * ts;
      float v = fract(xl ? Q.z : Q.x) - .5, f = dkIn(v, Q.y - dkS, .43) / pix + .5;
      if (f > .0) {
        float hi = clamp(dkOut(u, (v - u) / max(ts - t, 1e-4), py, d.y, .43, .86 * dkH), .0, ts - t);
        float w = -2. * dkH * mix(u, v, hi / max(ts - t, 1e-4)), my = -.001 - py - d.y * hi;
        dkN = normalize(mix(normalize(xl ? vec3(.0, my, w) : vec3(w, my, .0)), face, sat(e))); dkCov = sat(f); dkPast = ts + 1e-3; return t + hi * (1. - sat(e));
      }
      if (e > .0) { dkCov = e; return t; }
    }
    t0 = t;
    if (xl) tn.x += dl.x; else tn.y += dl.y;
  }
  dkMat = t0 > far ? 3. : 4.;
  return min(t0, far);
}
// The lamp past the columns.
float dkShade(vec2 P) {
  vec2 o = dkL.xz, d = P - o;
  float len = length(d) + 1e-4, s = 1.;
  d /= len;
  vec2 dx = dkOff(d), iv = 1. / dx, dl = abs(iv);
  vec2 tn = (floor(o) + step(.0, dx) - o) * iv;
  for (int i = 0; i < 4; i++) {
    bool xl = tn.x < tn.y;
    float t = xl ? tn.x : tn.y;
    if (t > len + .3) break;
    vec4 c = dkNode(floor(o + d * t + .5));
    if (c.w > 1.) {
      vec2 m = c.xy - o;
      float al = dot(m, d), pe = abs(m.x * d.y - m.y * d.x), w = (.01 + .05 * uVar) * (len - al) / max(al, .1) + .006;
      if (al > .0 && al < len - c.z * 1.4) s = min(s, dkUp(c.z - w, c.z + w, pe));
    }
    if (xl) tn.x += dl.x; else tn.y += dl.y;
  }
  return s;
}
// The net of light that water throws.
float dkNet(vec2 q) {
  float t = uTime * .31;
  q += .45 * sin(q.yx * 1.3 + vec2(t, -t * .83));
  q += .22 * sin(q.yx * 2.9 + vec2(-t * 1.3, t * 1.1));
  float a = abs(sin(q.x * 1.6 + q.y * .6)), b = abs(sin(q.y * 1.7 - q.x * .8 + 1.)), c = smin(a, b, .25);
  c = 1. - sat(c * 1.5);
  return c * c * (.15 + c) * (1.1 + .8 * sin(q.x * .7 + t) * sin(q.y * .9 - 1.3 * t));
}
// A ring on the water.
vec2 dkRing(vec2 w, vec2 c, float far, float s) {
  vec2 d = w - c;
  float r = length(d) + 1e-3, x = (r - far) * 30.;
  return d / r * cos(x * 1.6) * exp(-x * x * .2) * s;
}
// The lamp's light in the air.
float dkAir(vec3 o, vec3 d, float t) {
  o -= dkL;
  float m = length(d), b = dot(o, d) / m, h = sqrt(max(dot(o, o) - b * b, .0) + .0012);
  return atan(t * m * h, h * h + (t * m + b) * b) / h;
}
// The stone, lit.
vec3 dkLit(vec3 P, vec3 d, float z) {
  vec3 alb = dkStone, N = dkN;
  bool col = dkMat < .5;
  float fine = sat(.0009 / (dkPx * z + 1e-5)), wet = .4, tex;
  if (col) {
    float an = atan(-N.x, -N.z + 1e-5), id = dkId.x * 7.3 + dkId.y * 13.1;
    if (uOwn[6] < 0.) an = mix(an, (P.x + P.z) * 9., dkSq);
    vec2 q = vec2(an * 1.6, P.y * 3.) + id;
    float str = noise(q * vec2(5., .5)), blot = noise(q * 2.1), near = fine * dkUp(5., 3.5, z), gr = near > .0 ? mix(.5, noise(q * vec2(17., 13.)), near) : .5;
    tex = .5 * (blot + gr) + .35 * str - .125;
    if (uOwn[6] < 0.) { vec2 f2 = vec2(an * .7, P.y * 9.); f2.x += .5 * mod(floor(f2.y), 2.); vec2 ff = abs(fract(f2) - .5); tex *= mix(1., (1. - .55 * max(dkUp(.43, .49, ff.y), dkUp(.44, .49, ff.x))) * (.7 + .6 * hash21(floor(f2))), min(fine * 4., 1.) * dkSq); }
    float tide = dkUp(.2, .05, P.y + .05 * str);
    alb *= mix(vec3(1.), vec3(.42, .55, .4), tide);
    N = normalize(N + .22 * dkUp(.5, 1.8, z) * vec3((str - .5) * N.z + gr - .5, blot - .5, (.5 - str) * N.x));
    wet = .25 + .75 * tide + .5 * dkUp(.45, .75, str);
  } else {
    vec2 q = dkMat < 1.5 ? vec2(P.x + P.z, P.y) : abs(dkN.x) > abs(dkN.z) ? P.zx : P.xz;
    q *= vec2(9., 22.); q.x += .5 * mod(floor(q.y), 2.);
    vec2 f = abs(fract(q) - .5);
    tex = (.35 + .5 * noise(q * vec2(.55, .23))) * mix(1., (1. - .5 * max(dkUp(.36, .48, f.y), dkUp(.42, .49, f.x))) * (.75 + .5 * hash21(floor(q))), fine);
    alb *= vec3(1.05, .9, .78);
  }
  vec3 l = dkL - P;
  float d2 = dot(l, l), di = sqrt(d2 + 1e-5), face = dot(N, l) / di, sh = face > (col ? -.2 : -.09) ? dkShade(P.xz) : .0;
  float  cap = dkBo ? 1. - .8 * dkUp(.2, .9, -l.y / di) : 1., att = 1. / ((dkBo ? .1 : .35) + dkReach * d2);
  vec3 c = dkLc * att * sat(face * .92 + .08) * sh * cap * .62;
  float nl = exp(-dot(l.xz, l.xz) * (dkBo ? .42 : .22)) * (.25 + 1.1 * uTexture) * (col ? sat(.1 + face) : sat(.75 - .4 * N.y));
  if (uOwn[6] > 0.) nl *= 1. - .9 * dkOpen;
  if (uOwn[7] < 0.) nl *= 1. - .8 * dkSand;
  if (nl > .01) c += dkLc * nl * dkNet(col ? vec2((P.x - P.z) * 6., P.y * 7.) : P.xz * 7.) * (dkBo ? .17 : .5) * (.4 + uEnergy);
  for (int k = 0; k < 5; k++) {
    vec3 e = vec3(dkKp[k], 1.8 * uCue * (1. - uCue) - .12).xzy - P;
    float e2 = dot(e, e);
    if (e2 < 3.) c += dkKc[k] * sat(.25 + .75 * dot(N, e) * inversesqrt(e2 + 1e-4)) * .22 / (.06 + e2) * (1. - e2 / 3.);
  }
  face = col ? 1. - abs(dot(normalize(d), dkN)) : .3;
  c += vec3(.5, .75, .85) * (.006 + .05 * band(z * .16) * (.3 + uEnergy)) * (.2 + 1.5 * face) * exp(-P.y * 1.2) * (.06 + dkUp(.7, 2.2, z)) * (1. + uVar);
  c *= alb * tex * 2.;
  if (uOwn[6] > 0.) c += alb * (.5 + tex) * mix(dkSkyLo, dkSkyHi, .5 + .4 * N.y) * (.05 + .42 * sat(dot(N.xz, dkRt) * .9 - .2 * dot(N.xz, dkFw) + .25)) * dkUp(-.2, .8, P.y);
  // wet streaks
  if (col) {
    vec2 hv = normalize(normalize(l.xz + 1e-4) - normalize(d.xz) + 1e-5);
    float s = sat(dot(dkN.xz, hv)); s *= s; s *= s; s *= s; s *= s;
    c += dkLc * s * s * wet * att * sh * .5 * exp(-l.y * l.y * 1.2);
    // a ring's line climbs
    float rr = dkAge * 1.9 - length(P.xz - dkDrop), ly = P.y - rr * 1.1;
    c += mix(vec3(1., .9, .7), uKind[4], .4) * uHits * dkUp(.0, .04, rr) * dkUp(.9, 1.3, z) * .75 * exp(-ly * ly * 3000.) * dkUp(1.1, .5, rr);
  }
  return c;
}
float dkSeg(vec2 p, vec2 a, vec2 b) { vec2 k = b - a; return length(p - a - k * sat(dot(p - a, k) / dot(k, k))); }
// The boat: colour and cover.
vec4 dkBoat(vec2 q, float px) {
  float cy = dkYaw, l = .31 * cy + .02, x = q.x / l, ax = abs(x);
  float top = .045 + .055 * x * x * x * x - .012 * x, hull = max(max(q.y - top, (ax - .84 - 1.6 * min(q.y, .1)) * l), -q.y - .01);
  vec2 sh = vec2(-.215 * cy, .4), lp = vec2(-.17 * cy, .335);
  float st = min(dkSeg(q, vec2(-.205 * cy, .04), sh) - .004, dkSeg(q, sh, lp + vec2(.0, .06)) - .003);
  // somebody sitting
  vec2 m = q - vec2(.09 * cy, .1);
  float man = min(length(m * vec2(1., .62)) - .045, length(m + vec2(.018, -.088)) - .024);
  float s = min(min(hull, st), man), a = sat(.5 - s / px);
  vec2 dl = lp - q;
  vec3 c = dkLc / (.6 + 60. * dot(dl, dl)) * (.03 + .4 * dkUp(.01, .002, abs(q.y - top + .005)) * step(ax, 1.) + .6 * dkUp(-.012, .004, man) * dkUp(.0, .05, -m.x) * step(man, hull));
  vec2 k = abs(q - lp) - vec2(.014, .022);
  float g = length(max(k, .0)) - .006, ga = sat(.5 - g / px);
  return vec4(mix(c, dkLc * 4. + .4, ga), max(a, ga));
}
// The island, its tree, the hanging roots.
vec4 dkIsle(vec2 q, float px) {
  float a;
  if (q.y > .75) {
    float x = q.x * 12., h = hash11(floor(x) + 5.), g = fract(h * 17.7);
    float y = dkS + dkH + .35 - q.y, len = .5 + .6 * g, k = sat(y / len);
    float w = abs(fract(x) - .5 + (h - .35) * .5 + (.16 * sin(y * 8. + h * 30.) + .08 * sin(y * 19. + h * 50.)) * k + .08 * sin(uTime * .3 + h * 9.) * k) / 12. - mix(.009 * g, .001, k) - .001;
    a = sat(.5 - w / px) * dkUp(1., .97, y / len) * step(h, .62) * dkUp(.4, .34, abs(q.x)) * (1. - dkUp(.2, .6, dkOpen));
    return vec4(vec3(.035, .032, .02) * dkLc, a);
  }
  // the tree
  float bend = .07 * q.y - .025 * sin(q.y * 8.);
  float tr = abs(q.x - bend + .01) - .015 + .014 * q.y;
  a = sat(.5 - tr / px) * step(q.y, .55);
  vec3 c = mix(vec3(.05, .04, .03), vec3(.3, .26, .2), dkUp(-.004, .0, tr + .2 * (bend - q.x))) * dkLc;
  vec2 rq = rot(.7) * q;
  float lf = noise(rq * 85. + .2 * sin(uTime * .5 + q.y * 8.)), ls = noise(rq * 31. + 9.);
  if (q.y > .22 && abs(q.x) < .4) for (int i = 0; i < 9; i++) {
    float k = float(i) / 8., h = fract(float(i) * .618 + .3), g = fract(h * 7.31);
    vec2 o = q - vec2((h - .5) * .4 * (1.1 - .5 * k) + .03, .64 - .28 * k + .06 * g);
    float r = .06 + .035 * g, e = length(o * vec2(.8, 1.25)) - r + .06 * (ls - .4) + .07 * (lf - .5), ca = sat(.5 - e / (px + .003));
    float lit = sat(.45 + .5 * o.y / r - .2 * o.x / r + .9 * (lf - .5)) * (1. - .55 * k);
    c = mix(c, mix(vec3(.006, .02, .008), vec3(.5, .66, .2), lit * lit) * dkLc * (1.3 + 1.6 * uPhrase * (.4 + uEnergy)), ca); a = max(a, ca);
  }
  // stones
  float mo = q.y - .1 * (1. - q.x * q.x * 5.) - .02 * ls, ma = sat(.5 - mo / px);
  c = mix(c, dkStone * dkLc * (.04 + .2 * ls * lf), ma); a = max(a, ma);
  if (q.y < .3) for (int i = 0; i < 10; i++) {
    float k = float(i) / 9., h = fract(float(i) * .414), g = fract(h * 23.7);
    vec2 o = q - vec2((fract(float(i) * .618) - .5) * (.35 + .55 * k), .13 - .14 * k + .03 * h);
    o *= rot((.5 - g) * 1.3);
    vec2 sz = vec2(.055 + .05 * h, .035 + .03 * g), w = abs(o) - sz + .012 * (ls - .5);
    float b = sat(.5 - max(w.x, w.y) / px), top = dkUp(.3, .7, o.y / sz.y + .2 * o.x / sz.x);
    c = mix(c, dkStone * dkLc * (.05 + .75 * top) * (.5 + .8 * lf) * (1.1 - .5 * k), b); a = max(a, b);
  }
  return vec4(c, a);
}
// The leaning shaft of noon, along a ray.
float dkShaft(vec3 o, vec3 d, float far) {
  vec3 A = vec3(-.158, -.987, .0), co = o - vec3(dkB, .0).xzy, n = cross(d, A);
  float top = dkS + dkH, da = dot(d, A), den = max(dot(d, d) - da * da, 1e-3), tn = (da * dot(co, A) - dot(d, co)) / den, x = dot(co, n) / sqrt(den) / .34, y = o.y + d.y * tn;
  if (abs(x) >= 1. || tn < .0) return .0;
  float hc = .34 * sqrt((1. - x * x) / den);
  float st = .45 + .8 * noise(vec2(x * 5. + .3 * sin(uTime * .05), 3. * sin(uTime * .011))) + .35 * noise(vec2(x * 19., 4. + sin(uTime * .02)));
  return (1. - x * x) * st * hc * dkUp(-.12, .12, y) * (.55 + .45 * y / top) * dkUp(top + .02, top - .15, y) * sat((far - tn) / (hc + 1e-3) * .5 + .5);
}
vec3 render(vec2 p) {
  dkSet();
  p.x += .17 * dkUp(1.2, .7, uRes.x / uRes.y); // when tall
  vec3 o = vec3(dkAt(.045 * sin(uTravel * .021), .07 * sin(uTravel * .017 + 1.)), .29).xzy, d = vec3(p.x * dkRt + dkF * dkFw, p.y + .125 - .43 * dkHigh).xzy, sun = mix(vec3(.8, .86, .72), dkLc, abs(uOwn[3])), air = dkLc * .0022 * (1. + 3. * max(uOwn[0], .0));
  bool b = uVar > .5;
  o.y += dkHigh * (dkS * .82 - o.y); o.xz += (b ? -.25 * dkRt + .1 * dkFw : .09 * dkRt - .35 * dkFw) * dkHigh;
  float tw = d.y < -1e-3 ? -o.y / d.y : 1e4, trav = .0, far = tw, k = length(d);
  vec3 col = vec3(.0), T = vec3(1.);
  bool done = false;
  for (int i = 0; i < 3; i++) {
    float t = dkWalk(o, d, far, trav), hole = 1., rim = .0;
    if (i == 2) dkCov = 1.;
    vec3 P = o + d * t, c = vec3(.0);
    if (b) {
      c = sun * dkShaft(o, d, t) * (.25 + .28 * uPad);
      col += T * c * (1. - dkOpen);
      if (dkMat == 2.) {
        vec2 e = P.xz - dkB;
        float an = atan(e.y, e.x + 1e-4);
        rim = length(e) + .035 * sin(an * 3. + 1.) + .02 * sin(an * 7.) - .36;
        hole = sat(.5 + rim / (dkPx * (t + trav) * 1.5));
      }
    }
    float tb = dot(dkB - o.xz, dkFw) / max(dot(d.xz, dkFw), .05);
    if (!done && tb > .0 && tb < (hole < .5 ? 9. : t)) {
      vec2 q = vec2(dot(o.xz + d.xz * tb - dkB, dkRt), o.y + d.y * tb);
      if (abs(q.x) < .6 && q.y < (b ? dkS + dkH + .4 : .6)) {
        float px = dkPx * (tb + trav) * 1.1;
        vec4 s = b ? dkIsle(q, px) : dkBoat(q, px);
        float fs = exp(-dkFog * tb * k);
        col += T * s.a * mix(dkMist, s.rgb, fs); T *= 1. - s.a;
      }
      done = true;
    }
    float fg = exp(-dkFog * t * k);
    bool sky = uOwn[6] > 0. && dkMat > 3.5;
    if (sky) fg = 1.;
    col += T * (c + dkMist * (1. - fg) + air * dkAir(o, d, t));
    T *= fg;
    if (dkMat == 3.) {
      // the water
      vec3 l = dkL - P, dn = d / k;
      vec2 e = P.xz - dkHome, lw = vec2(dot(e, dkRt), dot(e, dkFw)), rp = lw * vec2(5., 11.), tt = 5. * vec2(sin(uTime * .05), cos(uTime * .05)) + 9.;
      float n1 = noise(rp + tt), n2 = noise(rp * vec2(2.7, 2.3) - 1.3 * tt.yx), n3 = noise(rp * .42 - .3 * tt);
      vec2 sl = ((vec2(n1, n2) - .5) * 2.2 / (1. + tw * tw * .04) + n3 - .5) * dkChop;
      // the rings of a hit and of the half minute's drop
      float qf = fract(uTime / 29.);
      vec2 hit = dkRing(P.xz, dkDrop, dkAge * 1.9, .1 * uHits);
      sl += hit + dkRing(P.xz, dkAt(.1, 1.6), qf * 9., .05 * exp(-qf * 9.) * dkUp(.0, .01, qf));
      float d2 = dot(l, l), di = sqrt(d2), sh = dkShade(P.xz), f = 1. + dn.y, fr = f * f;
      // murk, and dye on it
      vec3 mk = dkLc * sh * .11 / (.05 + d2) * (l.y / di + .15);
      for (int j = 0; j < 5; j++) { vec2 v = P.xz - dkKp[j]; float e2 = dot(v, v); mk += dkKc[j] * (.052 / (.02 + e2)) / (1. + e2 * e2); }
      vec3 dye = piece(vec2(.5 + lw.x / (lw.y + .4) * .62, 1. - sat((lw.y - .7) / 4.5))).rgb;
      mk = mk * dkMurk + (dye * dye * .15 + dye * .008) * (.35 + uEnergy) * dkUp(.3, .75, .6 * n3 + .4 * n1);
      e = P.xz - dkDrop;
      mk += mix(vec3(1., .8, .5), uKind[4], .4) * (length(hit) * .9 + uHits * .09 * exp(-dot(e, e) * 4.));
      // the broken path
      vec3 hv = l / di - dn; vec2 need = hv.xz / max(hv.y, 1e-3) - sl * 3.;
      float gl = exp(-dot(need, need) / (.0006 + dkChop * dkChop * 2.5)) * dkUp(.35, .75, n2 * .6 + n1 * .5);
      if (uOwn[7] < 0.) {
        float du = noise(lw * vec2(1.3, 1.1) + 3.) * .62 + noise(lw * vec2(4., 5.) + 1.) * .28 + n1 * .1, ri = lw.y * 9. + lw.x * 3. + 2.5 * noise(lw * 1.7), fi = dkUp(5., .6, tw);
        float cv = dkUp(.0, .05, dkSand * 1.3 - .2 - du), gr = cos(ri * 4.) * fi;
        vec3 sa = mix(dkStone, vec3(.92, .9, .86), .3) * (.8 + .4 * du) * (1. - .12 * hash21(floor(P.xz * 190.)) * fi);
        vec3 lg = dkLc * sh * (.34 / ((dkBo ? .09 : .3) + dkReach * d2)) * sat(l.y / di * 1.1 + .05 + .1 * gr * l.x / di + .12 * (du - .5));
        for (int j = 0; j < 5; j++) { vec2 v = P.xz - dkKp[j]; lg += dkKc[j] * .035 / (.06 + dot(v, v)); }
        lg += (dkSkyLo + dkSkyHi * 2.) * (.2 + .03 * gr) + dkMist * .5 + dye * dye * .35 * (.35 + uEnergy);
        lg += mix(vec3(1., .8, .5), uKind[4], .4) * uHits * .3 * exp(-dot(e, e) * 5.);
        col += T * cv * sa * lg; T *= 1. - cv;
        if (cv > .99) break;
      }
      if (uOwn[7] > 0.) for (int j = 0; j < 2; j++) {
        float sc = j == 0 ? 3.1 : 5.7, px = dkPx * tw * sc / (f < 1. ? .3 + .7 * abs(dn.y) : 1.);
        vec2 g = P.xz * sc + .03 * sin(uTime * .3 + P.zx * 2.) + float(j) * 7.3, n = floor(g);
        float h = hash21(n + 2.7), h2 = fract(h * 57.3), ra = .3 + .17 * h2, an, rr;
        float on = step(h, (.25 + .75 * dkLeaf) * dkUp(.3, .62, noise(n * .33 / sc * 3.1) + .25 * dkLeaf));
        vec2 v = fract(g) - .5 - (vec2(fract(h * 91.), fract(h * 37.)) - .5) * (1. - 2. * ra);
        rr = length(v); an = atan(v.y, v.x + 1e-5) + h * 40.;
        float nt = abs(fract(an / TAU) - .5) * rr, cv = sat((ra - rr) / (px + .004) + .5) * on * max(dkUp(.0, .012, nt - .012), .0);
        vec3 lf = mix(vec3(.07, .15, .05), vec3(.2, .27, .07), h2) * (1. + .35 * cos(an * 9.) * dkUp(.02, .3, rr)) * (.75 + .5 * dkUp(.7, 1., rr / ra));
        vec3 lg = dkLc * sh * (.8 / ((dkBo ? .09 : .3) + dkReach * d2)) * sat(l.y / di + .1 + .25 * dot(v, vec2(h - .5, h2 - .5))) + (dkSkyLo + dkSkyHi) * .35 + dkMist * .4;
        lg += dkLc * .05 * (1. + uTexture);
        col += T * cv * lf * lg; T *= 1. - cv;
        if (j == 0) {
          // flowers stand a little over the water
          vec3 Q = P - d * (.05 / min(d.y, -1e-3));
          g = Q.xz * sc; n = floor(g); h = hash21(n + 2.7); v = fract(hash21(n + 9.1) * vec2(13.7, 71.3)) * .4 + .3 - fract(g);
          vec3 w = vec3(v / sc, .0).xzy; w -= dn * dot(w, dn);
          float fr2 = length(w) / .034, kk = floor(hash21(n + 5.5) * 4.99), up = w.y / .034;
          vec3 kc = uKind[int(kk)];
          float tip = .72 + .28 * abs(cos(atan(w.y, dot(w.xz, dkRt) + 1e-5) * 3.5));
          float fa = sat((tip - fr2) * .034 / (dkPx * tw) + .5) * step(hash21(n + 3.3), .3 * dkLeaf) * (w.y < .02 ? 1. : .0);
          kc = mix(kc * kc, vec3(1.), .25 + .4 * dkUp(.6, .0, fr2));
          col += T * fa * kc * (dkLc * sh * .6 / (.2 + dkReach * d2) + dkLc * .06 + dkSkyLo * .6 + dkMist * .5 + .05 + .25 * (kk < .5 ? uDrone : kk < 1.5 ? uPad : kk < 2.5 ? uTexture : kk < 3.5 ? uPhrase : uHits) * (.4 + uEnergy)) * (.75 - .25 * up);
          T *= 1. - fa;
        }
      }
      col += T * (mk + dkLc * gl * sh * (b ? .18 : 1.2));
      T *= (.05 + .95 * fr * fr) * vec3(.8, .95, .88);
      o = P; trav += t; d = reflect(d, normalize(vec3(sl.x, 1., sl.y))); d.y = max(abs(d.y), 1e-3);
      far = 1e4; done = false;
      continue;
    }
    if (sky) {
      float el = d.y / k, cl = noise(vec2(dot(d.xz, dkRt), dot(d.xz, dkFw)) * 1.7 / (abs(d.y) + .25) + uTime * .006);
      col += T * mix(dkSkyLo, dkSkyHi, dkUp(.0, .62, el)) * (1. + .5 * (cl * cl - .3) * dkUp(.0, .25, el));
    }
    if (dkMat > 3.5) break;
    c = dkLit(P, d, t + trav);
    if (hole < 1. || rim > .0) c = mix(uOwn[6] > 0. ? mix(sun * 2., dkSkyHi * 1.3, dkUp(.0, .3, dkOpen)) : sun * 2., c * (1. + 2.5 * exp(-max(rim, .0) * 14.)), hole);
    col += T * dkCov * c; T *= 1. - dkCov;
    if (dkCov > .98) break;
    o += d * dkPast; trav += dkPast; far -= dkPast;
  }
  // a hit's drop; the keys on others
  if (uHits + uKeys > .0) for (int i = 0; i < 5; i++) {
    float h = float(i), fa = fract(mod(uTime, 900.) / 9. + h * .37), st = uKeys * (1. - fa);
    vec2 q = p - vec2(.31 * h - .85, .35 - .5 * fa * fa);
    if (i == 0) { q = p - vec2(b ? .07 : .11, -.283); st = uHits * dkUp(.5, .0, dkAge); }
    if (q.y > .0) q.y *= .05;
    col += (dkLc + .3) * st * 1.6 * exp(-dot(q, q) * 3e4);
  }
  col += dkLc * uMic * .1 * exp(-abs(p.y + .1) * 24.) * noise(vec2(p.x * 4. + 3. * sin(uTime * .02), p.y * 14.));
  return screenOf(col * (1.5 + .5 * uTone));
}
