// name: Knit and ravel
// a: On the needles
// b: Coming undone
// what: Cream wool in stocking stitch hung from a pale wooden needle in slanting window light, with one cable and a loose strand running off along a warm wall; or the same cloth pulled undone from a dip in its edge, its freed yarn rising in crimped waves and lying loose above the rows that wait.
// follows: Rows are the loop, stitches the room: sounds dye the wool there and loud places stand out in bumps. Drone thickens the yarn, pad slackens it, texture raises fuzz, phrase swells the cable or tints the pulled strand, the bands draw rows up, keys add slubs. A hit runs along the edge in colour; a cue drops a stitch that ladders and is picked up.
const float krW = .08, krH = .051, krRows = 10.; // a stitch across and up, and the rows of one loop
const vec3 krSun = vec3(-.52, .6, .607);
bool krA; float krPx;
float krS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
// A window's light lying slantwise over wall and wool.
float krWindow(vec2 p) {
  float u = p.x * .9 + p.y * .55 + .05 * sin(uTime * .021), w = .05 + .04 * uSpace;
  return krS(-.95, -.8, u) * (1. - krS(.18 - w, .18 + w, u) * .75) * (1. - .5 * krS(.03, .0, abs(u + .22) - .012)) ;
}
float krBump(float x) { return exp(-x * x); }
float krHash(vec2 n) { vec3 q = fract(vec3(n.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// What lies on top so far: how high, which way it faces, how deep in a groove, along and across it.
float krZ, krEdge, krRow; vec3 krN; vec2 krIn;
// One length of yarn from A along U, len long, r thick: arched, its ends dipping under.
void krYarn(vec2 q, vec2 A, vec2 U, float len, float r, float lift, float arch, float side, float row) {
  vec2 d = q - A;
  float e = dot(d, U) / len * 2. - 1.;
  if (abs(e) >= 1. || r < .0008) return;
  float v = U.y * d.x - U.x * d.y, e2 = e * e;
  v -= .008 * e * (1. - e2);
  float R = r * sqrt(1. - e2 * e2), a = v / R;
  if (abs(a) >= 1.) return;
  float up = sqrt(1. - a * a), z = lift + arch * (1. - e2) + R * up;
  if (z <= krZ) return;
  krZ = z; krRow = row;
  krN = vec3((vec2(U.y, -U.x) * a + U * (3. * arch / len * e + .25 * e * e2)) * vec2(side, 1.), up + .05);
  krEdge = (1. - abs(a)) * R / krPx;
  krIn = vec2(e * len * .5, a * side);
}
// The plies wound round each other: the grooves turn the light.
float krPly(float s, float a, float seed, vec2 U) {
  float y = s / .0165 + .55 * a + seed, w = TAU * y, f = noise(vec2(y * 11., s * 45. - a * 2.2 + seed * 90.)) - .5;
  krN.xy += U * (sin(w) * .26 * (1. - .5 * a * a) + f * .5);
  return .5 + .5 * cos(w) + .9 * f;
}
vec3 krCream(float h) { return mix(vec3(.93, .87, .755), vec3(.965, .915, .83), h); }
// Dye as wool takes it: never quite even, never as loud as light.
vec3 krDyed(vec3 wool, vec4 m, float keep) {
  vec3 hue = m.rgb / max(m.a, .03);
  float l = max(hue.r, max(hue.g, hue.b));
  hue = hue / max(l, .05);
  hue = mix(vec3(.80, .75, .67), hue, .7) * mix(.62, .9, keep);
  return mix(wool, hue * (.55 + .45 * wool), sat(m.a * 1.7 - .04) * .86);
}
vec3 krLit(vec3 wool, vec3 n, float shade, float sun) {
  n = normalize(n);
  float d = dot(n, krSun), k = sat(d * .62 + .42);
  k = mix(k, k * k * 1.1, .2 + .6 * uTone);
  vec3 low = wool * wool * vec3(.50, .37, .31), high = wool * (1.06 + .12 * k);
  vec3 c = mix(low, high, sat(k * sun)) ;
  return c * mix(vec3(.40, .29, .24), vec3(1.), shade);
}
float krNeedleY(float x) { return .192 + .035 * x; }
float krEdgeY(float x) { // where the fabric ends in b, with the valley it is pulled from
  float v = (x - .16 - .05 * sin(TAU * uLoop)) / .24;
  return .085 - .05 * x + .012 * sin(x * 7. + 1.) - .15 * exp(-v * v);
}
const float krRight = .56; // seven stitches right of the middle
vec4 krPiece(float row, float x) { return piece(vec2(fract(row / krRows), clamp((x + .84) / 1.68, .02, .98))); }
// The cloth at g; a is how much of it is there.
vec4 krCloth(vec2 p) {
  float t = uTravel * .22;
  vec2 g = p;
  g.x += .006 * sin(p.y * 6. + t) + .004 * sin(p.y * 13. - t * .7 + p.x * 4.);
  float top = krA ? krNeedleY(p.x) : krEdgeY(p.x), base = krA ? top : .085 - .02 * p.x;
  float deep = max((base - g.y) / krH, -6.);
  float hang = 1. - exp(-max(deep, 0.) * .35);
  float ten = band((p.x + .85) / 1.7);
  deep += hang * (.32 * ten * (.5 + uEnergy) + uPad * .4 * sin(p.x * 8. + uTime * .17) + .22 * sin(p.x * 5.3 + t * .8));
  float R = uLoop * krRows, v = krA ? R - deep : -(R + deep);
  float col = g.x / krW, sunAll = 1., lean = 0., x = col;
  // the cable: two ropes of two stitches crossing, with a gutter each side
  float cab = 0., cx = (g.x + 4. * krW) / krW, gut = 0.;
  if (krA && abs(cx) < 3.) {
    cab = 1.;
    float th = v / 5., turn = PI * (floor(th) + krS(.12, .88, fract(th)));
    float c = cos(turn) * .96, s = sin(turn), pin = 1. - .06 * uPhrase;
    float X = cx / pin, r1 = X - c, r2 = X + c;
    bool one = s > 0. ? abs(r1) < 1.02 : abs(r2) >= 1.02;
    float l = one ? r1 : r2, o = one == (s > 0.) ? 1. : 0.;
    float oth = abs(one ? r2 : r1);
    if (abs(l) < 1.04) {
      x = l + 40.; lean = l;
      float sl = abs(s);
      sunAll *= mix(1., mix(krS(.95, 1.5, oth), 1., o), sl);
      sunAll *= mix(1., .55 + .45 * krS(1.04, .75, abs(l)), .5 + .5 * sl);
    } else { gut = 1.; x = cx; }
  }
  float c = floor(x), X = (x - c - .5) * krW, side = X < 0. ? -1. : 1., ax = abs(X), j0 = floor(v);
  float id = cab > 0. ? floor(cx) + 31. : c;
  krZ = -1.; krEdge = 0.; krRow = j0; krN = vec3(0, 0, 1); krIn = vec2(0);
  float thick = .0168 + .0022 * uDrone;
  float hx = .5 - 1.3 * (1. - uHits), tug = uHits * krBump((p.x - hx) / .15) * krS(5.5, 1., abs(deep - .5));
  thick *= 1. - .16 * tug;
  bool drop = c == (krA ? 3. : -5.);
  float cd = 4. * uCue * (1. - uCue) * 8., there = 0., lip = 1.;
  vec2 A = vec2(.0025, -.023), B = vec2(.0345, .0580), U = normalize(B - A);
  float len = length(B - A);
  for (int k = -1; k <= 1; k++) {
    float j = j0 + float(k), h = krHash(vec2(mod(j, krRows), id)), r = thick * (.95 + .1 * h);
    r *= 1. + .3 * uKeys * krS(.86, .95, h);
    float dj = krA ? R - j - .5 : -j - R - .5;
    float grow = 1.;
    if (drop) r *= krS(cd - .6, cd + .4, dj + (krA ? 0. : (top - base) / krH));
    if (!krA) { float under = dj - (base - top) / krH + (h - .5) * .5; grow = krS(-.4, .8, under); r *= krS(0., .2, grow); if (k == 0) { there = sat((under - 1.3) * krH / krPx); lip = krS(.4, .9, under); } }
    float jy = (v - j) * krH + (1. - grow) * .058, sink = .022 * (grow - 1.);
    if (gut < .5) krYarn(vec2(ax, jy + .001 * (h - .5)), A, U, len, r, sink, .014, side, j);
    // at an edge with no row above, the head of the loop shows
    if (!krA && dj < (base - top) / krH + 2.6 && grow > .05) {
      vec2 T = A + U * len, q = vec2(X, jy - T.y + .012), o = q / max(length(q), .001);
      float a = (length(q) - T.x + .011) / (r + 1e-4);
      if (q.y > -.004 && abs(a) < 1.) {
        float up = sqrt(1. - a * a), z = .003 + sink + r * up;
        if (z > krZ) { krZ = z; krRow = j; krN = vec3(o * a, up); krEdge = (1. - abs(a)) * r / krPx; krIn = vec2(atan(q.x, q.y + .01) * T.x, a); }
      }
    }
  }
  // purled: bumps in every other stitch where the piece is loud
  float ck = mod(floor(v) + c, 2.), pj = floor(v);
  vec4 mp = krPiece(krA ? pj + .5 : -pj - .5, p.x);
  float pur = gut > .5 ? 1. : krS(.3, .75, mp.a) * (cab > 0. ? 0. : ck);
  pur *= lip; bool bar = false;
  if (pur > .01 && !(drop && cd > .3)) {
    float was = krZ;
    if (gut > .5) { // two arcs a row, one bending up and one down
      float f = (v - pj) * 2., f0 = floor(f), b = mod(f0, 2.) * 2. - 1.;
      krYarn(vec2(X, (f - f0 - .5) * krH * .5 + b * (4.5 * X * X - .004)), vec2(-.5 * krW - .012, 0), vec2(1, 0), krW + .024, krH * .31, -.014, .012, 1., pj);
    } else krYarn(vec2(X, (v - pj - .55) * krH + 7. * X * X), vec2(-.42 * krW, 0), vec2(1, 0), .84 * krW, krH * .43 * (.6 + .4 * pur), .021 * pur - .014, .016 * pur, 1., pj);
    bar = krZ > was;
  }
  // where a stitch was dropped, the rungs of the ladder
  bool rung = drop && krZ < 0. && lip > .5;
  if (rung) krYarn(vec2(X, (v - j0 - .4) * krH - 4. * X * X), vec2(-.5 * krW - .03, 0), vec2(1, 0), krW + .06, .0105, -.02, .004, 1., j0);
  float hole = krZ > -.9 ? 0. : 1.;
  float seed = krHash(vec2(mod(krRow, krRows), id + 7. * side));
  vec4 m = krPiece(krA ? krRow + .5 : -krRow - .5, cab > 0. ? p.x : (floor(col) + .5) * krW);
  vec3 wool = krCream(seed);
  wool = krDyed(wool, m, seed);
  wool = mix(wool, wool * .4 + .6 * uKind[4], .88 * tug);
  if (drop) wool = mix(wool, uKind[4] * .7 + .25, uCue * max(.7 * krS(cd + 2.5, cd, abs(deep - cd)), .5 * krS(cd - 1., cd, deep)));
  if (krA && cab > 0. && gut < .5) wool = mix(wool, mix(vec3(.85, .8, .72), uKind[3], .6), uPhrase * .35);
  float gr = krPly(krIn.x, krIn.y, seed, bar ? vec2(1, 0) : U * vec2(side, 1.));
  float shade = krS(-.004, .02, krZ) * .75 + .25;
  if (rung) shade = .8;
  shade *= .78 + .22 * gr;
  shade *= .35 + .65 * krS(0., 2.2 + .004 / krPx, krEdge);
  // the folds of the whole cloth
  float f1 = p.x * 4.2 + .8 * sin(p.y * 2.2 + t * .4) + .4, f2 = p.x * 9. - p.y * 3. + t * .3;
  krN.x += .32 * cos(f1) + .12 * cos(f2);
  krN.y += .14 * cos(p.y * 5. + p.x * 2. + t * .5);
  if (cab > 0. && gut < .5) krN.x += lean * (.55 + .35 * uPhrase);
  if (gut > .5) sunAll *= .74;
  // the light leaves toward the lower right
  float fall = (1. - .25 * krS(-.2, 1.1, p.x * .6 - p.y * .9)) * mix(.72, 1.06, krWindow(p));
  if (krA) { sunAll *= mix(.5, 1., krS(.1, 1.3, deep)); float rim = (krRight - g.x) / krW; krN.x += .9 * krS(.7, 0., rim); sunAll *= .7 + .3 * krS(0., .6, rim); }
  // fibres standing off the yarn
  float fz = noise(p * 120.), hw = .026;
  vec2 hp = p + .006 * sin(p.yx * vec2(71., 63.) + 3. * sin(p * 29.)) + .002 * fz;
  float hair = max(krS(hw, 0., abs(noise(rot(.7) * hp * vec2(38., 120.)) - .5)), krS(hw, 0., abs(noise(rot(-.5) * hp * vec2(130., 34.)) - .5)));
  vec3 c3 = krLit(wool, krN, shade * (.93 + .14 * fz), sunAll * fall);
  c3 = mix(vec3(.40, .29, .235) * (.45 + .55 * wool), c3, 1. - hole);
  c3 = mix(c3, wool * (.75 + .25 * fall), hair * (.06 + .5 * uTexture) * (1. - .4 * hole));
  float here = 1.;
  if (krA) here = sat((krRight - g.x + .002 * sin(v * TAU)) / krPx + .5);
  else here = hole > .5 ? there : max(there, sat(krEdge));
  if (deep < -5.) here = 0.;
  return vec4(c3, here);
}
// A crimped strand: s along, d across; gives the place along and how far off it is.
vec2 krCrimp(float s, float d, float A, float k) {
  float x = s;
  for (int i = 0; i < 3; i++) { float f = A * sin(k * x), g = A * k * cos(k * x); x -= clamp(((x - s) + (f - d) * g) / max(1. + g * g - (f - d) * k * k * f, .5), -.012, .012); }
  float f = A * sin(k * x);
  return vec2(x, sign(d - f) * length(vec2(s - x, d - f)));
}
// Yarn laid loosely back and forth: s along it, d across, the way it runs.
vec3 krLay(vec2 q, float h, float xl, float xr) {
  float i = floor(q.y / h), L = xr - xl, r = h * .5, step_ = L + PI * r, even = mod(i, 2.) < .5 ? 1. : 0.;
  if (q.x > xr) { float yc = h * (2. * floor(q.y / (2. * h)) + 1.), b = 2. * floor(q.y / (2. * h)); vec2 e = vec2(q.x - xr, q.y - yc); return vec3(b * step_ + L + r * (atan(e.y, e.x + 1e-4) + PI * .5), length(e) - r, atan(e.x, -e.y)); }
  if (q.x < xl) { float n = floor(q.y / (2. * h) + .5), yc = h * 2. * n; vec2 e = vec2(xl - q.x, q.y - yc); return vec3((2. * n - 1.) * step_ + L + r * (atan(e.y, e.x + 1e-4) + PI * .5), -(length(e) - r), PI - atan(e.x, -e.y)); }
  float y = q.y - (i + .5) * h;
  return even > .5 ? vec3(i * step_ + q.x - xl, -y, 0.) : vec3(i * step_ + xr - q.x, y, PI);
}
vec2 krWarp(vec2 p, float n) {
  float t = uTime * .05;
  return p + (n < .5 ? vec2(.05 * sin(p.y * 7. + t), .05 * sin(p.x * 4.3 + t * 1.3 + 1.) + .02 * sin(p.x * 9. - t)) : vec2(.07 * sin(p.y * 5. - t + 2.), .07 * sin(p.x * 3.1 - t + 3.)));
}
vec3 krSkein(vec2 p, float n, bool soft) {
  float xr;
  vec2 q = rot(n < .5 ? .22 : -.3) * krWarp(p, n);
  float h = n < .5 ? .19 : .27; xr = n < .5 ? .5 : .62;
  float L = xr + .62, step_ = L + PI * h * .5;
  q.y += n * .07 - mod(uTravel * .0015, 2. * h);
  vec3 w = krLay(q, h, -.62, xr);
  float k = TAU * floor(step_ / .073) / step_, A = n < .5 ? .0112 : .0095;
  if (soft || abs(w.y) > .04) return vec3(0., (w.y - A * sin(k * w.x)) * .8, 0.);
  vec2 c = krCrimp(w.x, w.y, A, k);
  c.x = mod(c.x, 2. * step_);
  return vec3(c, w.z + atan(A * k * cos(k * c.x)));
}
vec3 krShadeStrand(vec3 w, float r, vec3 wool, out float cov) {
  float a = clamp(w.y / r, -1., 1.);
  cov = sat((r - abs(w.y)) / krPx + .5);
  vec2 T = vec2(cos(w.z), sin(w.z));
  krN = vec3(vec2(-T.y, T.x) * -a, sqrt(1. - a * a) + .08);
  float g = krPly(w.x, a, 0., T);
  return krLit(wool, krN, (.7 + .3 * g) * (.6 + .4 * krS(1., .55, abs(a))), 1.);
}
vec3 render(vec2 p) {
  krA = uVar < .5; krPx = 1. / uRes.y;
  float top = krA ? krNeedleY(p.x) + .03 : krEdgeY(p.x) + .07;
  vec4 cloth = p.y < top && (!krA || p.x < krRight + .02) ? krCloth(p) : vec4(0);
  // well inside the cloth nothing else is seen
  if (krA ? p.y < top - .1 && p.x < krRight - .03 : p.y < top - .18 && (p.y < -.1 || p.x < -.2)) return cloth.rgb;
  // the wall, and the light on it
  float lamp = krS(1.25, -.1, length((p - vec2(-.55, .55)) * vec2(.75, 1.)));
  vec3 wall = krA ? vec3(.885, .80, .705) : vec3(.75, .61, .515);
  wall *= mix(vec3(.74, .69, .67), vec3(1.07, 1.06, 1.04), lamp);
  wall *= .985 + .03 * noise(p * vec2(26., 19.)) * noise(p * 5.) + .015 * noise(p * 190.);
  wall *= mix(vec3(.86, .84, .86), vec3(1.05, 1.03, .99), krWindow(p));
  vec3 col = wall;
  float off = .7 + .6 * uSpace;
  if (krA) {
    float ny = krNeedleY(p.x);
    // shadows of the needle and the cloth
    float sh = krS(.05, -.02, p.x - .035 * off - krRight) * krS(.03, -.02, p.y - ny + .05);
    sh = max(sh, .8 * krS(.03, .0, abs(p.y + .035 * off - ny) - .012) * krS(.84, .74, p.x));
    // the strand that runs off
    float u = p.x - krRight + .02, tug = 4. * uHits * (1. - uHits);
    float f = krNeedleY(krRight) - 1.35 * u + 1.75 * u * u + (.012 * sin(uTime * .31 + u * 4.) + .02 * uMic * sin(u * 30. + uTime)) * sat(u * 6.) + .06 * tug * sat(u * 4.);
    float df = -1.35 + 3.5 * u, il = inversesqrt(1. + df * df);
    float us = u - .03 * off, fs = krNeedleY(krRight) - 1.35 * us + 1.75 * us * us - .045 * off;
    if (us > 0.) sh = max(sh, .75 * krS(.022, .0, abs(p.y - fs) * il - .006));
    col *= mix(vec3(1.), vec3(.60, .50, .46), sh * .85);
    col = mix(col, cloth.rgb, cloth.a * sat((ny - p.y) / krPx));
    if (u > 0.) {
      float cov; vec3 k = krShadeStrand(vec3(u / il, (p.y - f) * il, atan(df)), .0125, mix(krCream(.6), uKind[4], .5 * uHits * exp(-u * 3.)), cov);
      col = mix(col, k, cov);
    }
    // the needle
    float rn = .0225, rt = rn * sqrt(sat((.775 - p.x) / .13)) ;
    if (p.x < .645) rt = rn;
    float a = (p.y - ny) / max(rt, .0005);
    if (p.x < .775 && abs(a) < 1.) {
      float up = sqrt(1. - a * a), gr = noise(vec2(p.x * 9., a * 5. + 3.)) * .6 + .4 * noise(vec2(p.x * 40., a * 14.));
      vec3 wood = mix(vec3(.78, .60, .40), vec3(.90, .755, .56), gr);
      float li = sat(a * .62 + up * .62);
      vec3 w = wood * (.34 + .78 * li) + .22 * pow(sat(1. - abs(a - .5) * 2.4), 3.);
      col = mix(col, w, sat((1. - abs(a)) * rt / krPx));
    }
    // live loops over it
    float x = p.x / krW; float c = floor(x);
    if (c < krRight / krW - .5 && abs(p.y - ny) < .06) {
      krZ = -1.; float h = krHash(vec2(c, 5.));
      vec2 q = vec2((x - c - .5) * krW, p.y - ny);
      vec2 A = vec2(-.014 + .004 * h, -.038), U = normalize(vec2(.28 + .06 * h, 1.));
      krYarn(q, A, U, .077, .0165 + .002 * uDrone, 0., .012, 1., 0.);
      if (krZ > -.5) {
        krN.y += q.y * 24.;
        vec4 m = krPiece(uLoop * krRows, (c + .5) * krW);
        vec3 wool = krDyed(krCream(h), m, h);
        float hx = .5 - 1.3 * (1. - uHits), tg = uHits * krBump((p.x - hx) / .15);
        wool = mix(wool, wool * .4 + .6 * uKind[4], .88 * tg);
        float g = krPly(krIn.x, krIn.y, h, U);
        vec3 k = krLit(wool, krN, (.7 + .3 * g), 1.);
        col = mix(col * .8, k, sat(krEdge));
      } else if (abs(p.y - ny) < .0235) col *= 1. - .3 * krS(.027, .012, abs(q.x - q.y * .3 - .008));
    }
  } else {
    float e = krEdgeY(p.x);
    vec2 ds = vec2(-.018, .03) * off;
    for (int n = 1; n >= 0; n--) {
      float fn = float(n), r = .0120 + .0015 * uDrone;
      vec3 s = krSkein(p + ds * (1.3 - .5 * fn), fn, true);
      col *= mix(vec3(1.), vec3(.6, .5, .46), .75 * krS(.02, .0, abs(s.y) - .4 * r));
      vec3 w = krSkein(p, fn, false);
      if (abs(w.y) < r + .01) {
        float age = max(p.y - e, 0.) * .9 + fn * .2;
        vec4 m = piece(vec2(fract(uLoop - age), clamp((p.x + .84) / 1.68, .02, .98)));
        float cov; vec3 k = krShadeStrand(w, r, krDyed(krCream(.5), m, .6), cov);
        col = mix(col, k * mix(vec3(1.), vec3(.8, .75, .73), fn), cov);
      }
    }
    float e2 = krEdgeY(p.x - .03 * off), xw = .16 + .05 * sin(TAU * uLoop);
    col *= mix(vec3(1.), vec3(.60, .5, .46), .9 * krS(.02, -.06, p.y - e2 + .04 * off));
    col = mix(col, cloth.rgb, cloth.a);
    // the strand being pulled, up from the valley and away
    if (p.y > -.09) {
      float y = p.y + .09, r = .0125 + .0015 * uDrone, ease = exp(-y * 1.3);
      for (int k = 0; k < 2; k++) {
        vec2 q = k == 0 ? p + ds * .9 * vec2(sat(y * 8.)) : p;
        float yy = q.y + .09, wob = yy * 7. + uTime * .13, f = xw - .04 + .3 * yy * yy + (.05 + .03 * uMic) * sin(wob) * sat(yy * 5.), df = .6 * yy + .35 * cos(wob), il = inversesqrt(1. + df * df);
        float A = .004 + .0075 * ease, K = TAU / .073;
        if (abs(f - q.x) * il > .06) continue;
        if (k == 0) { col *= mix(vec3(1.), vec3(.6, .5, .46), .7 * krS(.02, .0, abs((f - q.x) * il - A * sin(K * q.y)) * .8 - .4 * r) * sat(y * 8.)); continue; }
        vec2 w = krCrimp(q.y, (f - q.x) * il, A, K);
        if (abs(w.y) < r + .01) {
          vec4 m = piece(vec2(fract(uLoop - y * .5), clamp((p.x + .84) / 1.68, .02, .98)));
          float cov; vec3 c = krShadeStrand(vec3(w, PI * .5 - atan(df) + atan(A * K * cos(K * w.x))), r, mix(mix(krDyed(krCream(.8), m, .7), uKind[3] * .8 + .15, .6 * uPhrase), uKind[4] * .7 + .2, uHits * krBump((y - .65 * (1. - uHits)) / .12)), cov);
          col = mix(col, c, cov * (1. - cloth.a * krS(.16, .12, y)));
        }
      }
    }
  }
  return col;
}
