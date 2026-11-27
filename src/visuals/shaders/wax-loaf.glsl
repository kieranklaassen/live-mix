// name: Wax loaf
// a: Cut face
// b: Fanned slices
// what: A thick loaf of coloured wax comes forward under a steel blade in window light, its honey side thumbed, its cut face a garden of clay: ringed eye, leaves, tongues, ribbon, rolled core; slices and a curled shaving lie by; or twenty thin slices fanned in a curve over white paper, each a moment later of the same forms.
// follows: The forms flow on as the music travels. Drone swells the eye, pad the tongues, texture the leaves, phrase the ribbon, each staining its own clay; bands pinch everything from middle to rim; the rolled core is painted with the piece and sways with the loop. A hit lights and opens a seed; a cue drops a slice, or lifts them along the fan. A voice warms the rim.
// own: 0 dark wax with pale forms at -1, sea greens and blues at 1; 1 forms round and fat at -1, long and thin at 1; 2 few and huge at -1, folded into many mirrored ones at 1; 3 the hour: low evening sun and dark ground at -1, white snow light at 1; 4 close up at -1, from high above at 1; 5 the section: a round log at -1, a wide flat slab at 1
vec3 wlC[7]; // the clays: ground, rose, ochre, ink, green, terracotta, bone
vec3 wlHoney, wlSkin; // the loaf's skin, and as light counts it
vec2 wlH; float wlR; // half the width and height of the section, and how round its corners are
vec3 wlL; // towards the window
vec3 wlSun, wlSky; // the two lights

// Three sets of one colour: the world at -1, as designed, at 1.
vec3 wlThree(float k, vec3 a, vec3 b, vec3 c) { return k < 0. ? mix(b, a, -k) : mix(b, c, k); }

void wlSetUp() {
  float k = uOwn[0], s = uOwn[5], h = uOwn[3];
  wlC[0] = wlThree(k, vec3(.17, .15, .19), vec3(.91, .83, .7), vec3(.78, .87, .85));
  wlC[1] = wlThree(k, vec3(.43, .2, .27), vec3(.86, .6, .55), vec3(.42, .66, .72));
  wlC[2] = wlThree(k, vec3(.86, .6, .24), vec3(.82, .58, .22), vec3(.93, .8, .42));
  wlC[3] = wlThree(k, vec3(.9, .85, .76), vec3(.15, .16, .24), vec3(.11, .22, .38));
  wlC[4] = wlThree(k, vec3(.3, .5, .46), vec3(.36, .49, .36), vec3(.2, .5, .5));
  wlC[5] = wlThree(k, vec3(.8, .33, .22), vec3(.73, .32, .22), vec3(.93, .5, .42));
  wlC[6] = wlThree(k, vec3(.74, .66, .62), vec3(.95, .91, .83), vec3(.97, .96, .92));
  wlHoney = wlThree(k, vec3(.24, .19, .18), vec3(.8, .66, .44), vec3(.74, .83, .76));
  wlSkin = wlHoney * wlHoney;
  // each kind of sound stains its own clay
  float lv[4] = float[4](uDrone, uPad, uTexture, uPhrase);
  int at[4] = int[4](4, 1, 2, 3);
  for (int i = 0; i < 4; i++) wlC[at[i]] = mix(wlC[at[i]], uKind[i] * (i == 3 ? .6 : 1.), (.27 + .45 * uEnergy) * lv[i]);
  wlH = s < 0. ? vec2(.5 - .02 * s) : mix(vec2(.5), vec2(.74, .36), s);
  wlR = s < 0. ? mix(.07, wlH.x, -s) : .07;
  wlL = normalize(wlThree(h, vec3(-.86, .36, -.42), vec3(-.72, .58, -.42), vec3(-.5, .75, -.5)));
  wlSun = wlThree(h, vec3(1.9, 1.05, .46), vec3(1.42, 1.28, 1.06), vec3(1., 1.06, 1.12)) * (.92 + .16 * uLevel);
  wlSky = wlThree(h, vec3(.05, .065, .12), vec3(.44, .44, .455), vec3(.62, .68, .76));
}

// The outline of a slice, not quite true.
float wlSect(vec2 q) {
  vec2 a = abs(q) - wlH + wlR;
  return length(max(a, 0.)) + min(max(a.x, a.y), 0.) - wlR + .03 * q.x * q.y - .02 * q.x * q.x;
}

float wlTo(vec3 n, vec3 l) { return max(dot(n, l), 0.); }
float wlIn(float px, float d) { return 1. - smoothstep(-px, px, d); }
// A form laid over what is there: a thin rind, then the body.
void wlLay(inout vec3 c, float d, float rind, float px, vec3 rc, vec3 bc) {
  c = mix(c, rc, wlIn(px, d - rind));
  c = mix(c, bc, wlIn(px, d));
}
// What the knife meets at a place of the section (the middle is 0) and a depth in the block: clay colour; w is light of a hit.
vec4 wlClay(vec2 q, float z, float px, float hit) {
  float r0 = length(q);
  q *= 1. - .1 * (band(r0 * 1.5) - .25) * (.35 + .65 * cos(5. * atan(q.y, q.x + 1e-5) + z)) * smoothstep(0., .1, r0);
  q += .036 * sin(q.yx * 5. + vec2(z * .9, 1.7 - z * .7)) + .016 * sin(q.yx * 11. + vec2(2. - z, z * 1.3)) + .0035 * noise(q * 46. + 3.);
  // few and large, or the cane pulled thin, folded and pressed again
  float many = uOwn[2], sc = 1. + many * (many < 0. ? .42 : .95), rnd = sat(-uOwn[1]), lng = sat(uOwn[1]);
  q = q * sc + vec2(.1, -.06) * many;
  if (many > 0.) q = .5 - abs(mod(q + .5, 2.) - 1.);
  px = px * sc * 1.2 + .0012;

  // the ground: three large fields
  vec3 c = mix(mix(wlC[1], wlC[0], .25), wlC[0], wlIn(px, q.y - .12 - .16 * sin(q.x * 3.4 + z * .5) - .35 * q.x));
  c = mix(c, mix(wlC[2], wlC[0], .25), wlIn(px, q.y + .2 + .1 * sin(q.x * 4.6 - z * .6 + 1.) - .22 * q.x));

  // pad: three tongues out of one root, reaching up from the lower right
  vec2 p = q - vec2(.36, -.4) - .05 * vec2(sin(z * .7), cos(z * .9));
  for (int i = 0; i < 3; i++) {
    float f = float(i) - 1., s = sin(z * .7 + f * 2.), len = (.46 - .07 * abs(f - .2) + .05 * s) * (1. - .5 * rnd + .35 * lng);
    float fat = (.072 + .03 * rnd - .02 * lng) * (.8 + .5 * uPad + .08 * s);
    vec2 t = rot(2.15 + .42 * f + .16 * s) * p;
    float h = sat(t.x / len), d = length(t - vec2(h * len, .07 * s * h * h)) - mix(.028, fat, h * h);
    wlLay(c, d, .014, px, i == 1 ? wlC[6] : wlC[5], i == 1 ? wlC[3] : wlC[1]);
    c = mix(c, i == 1 ? wlC[2] : wlC[6], wlIn(px, d + .55 * fat));
  }

  // phrase: a ribbon folded back and forth along the lower left
  p = rot(-.28 - .1 * sin(z * .4)) * (q - vec2(-.2, -.33));
  float am = (.055 + .04 * uPhrase) * (1. - .6 * rnd), kx = 19. - 5. * lng, ph = kx * p.x + z * 1.1, sl = am * kx * cos(ph);
  float rb = abs(p.y - am * sin(ph)) / sqrt(1. + sl * sl) - (.018 + .018 * uPhrase) * (1. - smoothstep(.1, .34, abs(p.x)));
  wlLay(c, max(rb, abs(p.x + .05) - .2), .01, px, wlC[6], wlC[3]);

  // drone: the eye, rings pressed off their middle, notched
  float dr = .225 * (.84 + .34 * uDrone + .13 * sin(z * .5));
  p = rot(.5 + .3 * sin(z * .35)) * (q - vec2(-.17, .13) - .06 * vec2(sin(z * .6 + 1.), cos(z * .5)));
  p *= vec2(1. - .3 * lng, 1.12 + 1.5 * lng);
  vec2 off = .2 * dr * vec2(cos(z * .7), sin(z * .9));
  const int ring[5] = int[5](4, 6, 5, 2, 3);
  float ea = 7. * atan(p.y, p.x + 1e-5) + z;
  for (int i = 0; i < 5; i++) {
    float f = .2 * float(i), d = length(p - off * f) - dr * (1. - f * (.95 - .12 * uBands[i * 3])) * (1. + .035 * (1. - rnd) * (1. - f) * sin(ea + 10. * f));
    if (i == 0) c = mix(c, wlC[1], wlIn(px, d - .013));
    c = mix(c, wlC[ring[i]], wlIn(px, d));
  }

  // texture: leaves with their veins
  const vec4 leaf[3] = vec4[3](vec4(.05, .07, .44, .75), vec4(-.43, -.1, .27, -.9), vec4(.14, .06, .26, .1));
  const ivec2 clays[3] = ivec2[3](ivec2(2, 4), ivec2(6, 5), ivec2(5, 2));
  for (int i = 0; i < 3; i++) {
    float s = sin(z * .6 + float(i) * 2.), len = leaf[i].z * (1. - .25 * rnd + .35 * lng);
    p = rot(leaf[i].w - .3 * s) * (q - leaf[i].xy - .035 * vec2(s, -s));
    float x = p.x / len, u = sat(x), y = abs(p.y - .16 * len * u * (1. - u) * 4. * s);
    float prof = mix(u * (1. - u) * (4.8 - 2.4 * u), 2. * sqrt(u * (1. - u)), rnd) * len * (.22 + .36 * rnd - .09 * lng) * (.78 + .55 * uTexture);
    float d = max((y - prof) * .82, (abs(x - .5) - .5) * len);
    wlLay(c, d, .011, px, wlC[clays[i].x], wlC[clays[i].y]);
    float v = abs(fract((x - y / len * .9) * 7.) - .5) / 7. * len;
    v = min(y - .0055 * (1.2 - u), max(v - .0035, .02 * len - len * u));
    c = mix(c, mix(wlC[6], uKind[3], .5 * uKeys), wlIn(px, max(v, d + .012)) * .9);
  }

  // the core: a mat of the piece rolled up, the loop along it, the room across
  p = q - vec2(.02, -.14) - .05 * vec2(cos(z * .5), sin(z * .7));
  float R = .138 + .02 * uLevel, r = length(p), gap = R / 2.6, a = fract((atan(p.y, p.x + 1e-5) + .7 * sin(TAU * uLoop) + z * .5) / TAU);
  float n = floor(r / gap - a), f = r / gap - a - n;
  vec4 m = piece(vec2(sat((n + a + .3) / 2.9), .08 + .84 * f));
  vec3 roll = mix(wlC[3], mix(wlC[2], m.rgb / max(m.a, .01), sat(m.a * 2.) * .9), wlIn(px, (abs(f - .5) - .33) * gap));
  wlLay(c, r - R, .014, px, wlC[3], wlC[6]);
  c = mix(c, roll, wlIn(px, r - R + .008));

  // seeds; the first opens on a hit, and its light goes out into the wax
  const vec2 seed[4] = vec2[4](vec2(.1, .385), vec2(.4, -.05), vec2(-.4, .37), vec2(-.2, -.17));
  float lit = 0.;
  for (int i = 0; i < 4; i++) {
    p = rot(.7 + float(i) * 1.3) * (q - seed[i] - .02 * vec2(sin(z * .7 + float(i)), 0.));
    float op = i == 0 ? 4. * hit * (1. - hit) : 0., L = (i == 0 ? .078 : .047) * (1. + .3 * op), wd = L * (.45 + .5 * op + .4 * rnd);
    float d = length(vec2(p.x, p.y * wd / L)) - wd + .18 * abs(p.x);
    float in_ = wlIn(px, max(abs(p.x) - wd * (.12 + .42 * op) * (1. - sat(p.y * p.y / (L * L))), d + .006));
    wlLay(c, d, .011, px, wlC[6], i == 0 ? wlC[5] : wlC[3]);
    c = mix(c, i == 0 ? wlC[6] : wlC[2], in_);
    if (i == 0) lit = hit * (in_ + .5 * wlIn(px, d) + .75 * exp(-max(d, 0.) * 9.));
  }
  // clay is never one even colour
  return vec4(c * (.955 + .08 * noise(q * 30. + z * .4)), lit);
}
// A cut seen in light: honey skin at the rim, the forms inside, the light of a hit.
vec3 wlFace(vec4 m, vec2 q, float z, float px, float sd) {
  vec3 c = mix(m.rgb, wlHoney, smoothstep(-.038 - px, -.038 + px, sd + .008 * sin(q.x * 9. + z) * sin(q.y * 11. - z)));
  c = mix(c, wlHoney * 1.15, .35 * smoothstep(-.09, 0., sd));
  return mix(c * c, mix(vec3(1.7, 1.25, .6), uKind[4], .4), sat(m.w) * .85);
}

// Where a ray meets a thin slab: the place on it, the distance to its outline, how far along. edge: its side.
vec4 wlSlab(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 e1, vec3 e2, float th, out float edge) {
  float dn = dot(rd, n);
  dn = abs(dn) < 1e-3 ? (dn < 0. ? -1e-3 : 1e-3) : dn;
  float b = dot(c - ro, n), s = dn < 0. ? .5 * th : -.5 * th, t = (b + s) / dn;
  vec3 p = ro + rd * t - c, d = p - rd * 2. * s / dn;
  vec2 q = vec2(dot(p, e1), dot(p, e2));
  float d1 = wlSect(q), d2 = wlSect(vec2(dot(d, e1), dot(d, e2)));
  edge = d1 > 0. && d2 < d1 ? 1. : 0.;
  return t < 0. ? vec4(q, 9., 1e4) : vec4(q, min(d1, d2), t);
}
// The soft shadow of an upright box.
float wlBoxShade(vec3 o, vec3 h) {
  vec3 a = -o / wlL - h / abs(wlL), b = -o / wlL + h / abs(wlL);
  float tN = max(max(a.x, a.y), a.z), tF = min(min(b.x, b.y), b.z);
  return tF < 0. ? 1. : smoothstep(0., .14, (tN - tF) / max(.1, tN));
}
// The window's light on a place: two panes by three, soft.
float wlPane(vec3 pos, float soft) {
  vec3 lx = normalize(cross(vec3(0., 1., 0.), wlL)), ly = cross(wlL, lx);
  vec2 g = vec2(dot(pos, lx), dot(pos, ly)) - vec2(.3, .62), b = abs(g) - vec2(1.5, 1.15);
  float bars = min(abs(abs(g.x) - .5), abs(g.y + .62));
  return wlIn(soft, b.x) * wlIn(soft, b.y) * mix(.45, 1., smoothstep(.012, .03 + soft * .6, bars));
}
vec3 wlRay(vec3 ro, vec3 ta, float lens, vec2 p) {
  vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0., 1., 0.), f));
  return normalize(f * lens + r * p.x + cross(f, r) * p.y);
}
float wlDip; // how far the blade has come down
float wlUp(vec2 b) { return b.y - 2. * wlH.y - .03 - .3 * (b.x + .2) * (b.x + .2) + .3 * wlDip; }
// How much of the blade stands over a place: its edge is a bow.
float wlBlade(vec2 b, float w) { return smoothstep(-w, w, wlUp(b)) * wlIn(w, abs(b.x) - 1.2); }

// Thumbs pressed into the side: how deep, and its slope up and along.
vec3 wlThumb(float y, float along, int some) {
  float w = along / .46, id = floor(w);
  vec3 o = vec3(0.);
  for (int i = -1; i < some; i++) {
    float j = mod(id + float(i), 211.), h = hash11(j + .5), k = hash11(j + 77.5);
    vec2 r = vec2(.13, .1), t = vec2(y - wlH.y * (.5 + 1.1 * k), (w - id - float(i) - .75 + .5 * h) * .46) / r;
    float e = exp(-1.6 * dot(t, t)) * smoothstep(.3, .55, k);
    o += e * vec3(1., -3.2 * t / r);
  }
  return o;
}
// A shaving rolled up on itself, the roll's axis along x.
float wlCurl(vec3 q) {
  float r = length(q.yz), a = atan(q.z, q.y + 1e-5) / TAU + .5, gap = .066 - .03 * q.x;
  return max(abs(r - .03 - gap * (clamp(floor((r - .03) / gap - a + .5), 0., 1.) + a)) - .008, abs(q.x) - .2);
}

vec3 wlCutFace(vec2 p) {
  float near = sat(-uOwn[4]), high = sat(uOwn[4]), tall = wlIn(.15, uRes.x / uRes.y - .6);
  vec3 ta = mix(mix(vec3(.17, .47, 0.), vec3(-.02, .48, 0.), near), vec3(.35, .2, .2), high);
  vec3 ro = mix(mix(vec3(-.12, 1.6, -2.8), vec3(-.75, .86, -2.), near), vec3(-.5, 3.4, -2.9), high);
  ro += .04 * vec3(sin(uTime * .07), 0., 0.) + tall * vec3(-.25, .25, -1.6);
  ta.x -= .12 * tall;
  vec3 rd = wlRay(ro, ta, 1.85, p);
  // from here on x is across the loaf, y up, z along it
  const float C = .79, S = .613;
  mat3 own = mat3(C, 0., S, 0., 1., 0., -S, 0., C);
  vec3 wallN = own * vec3(0., 0., 1.);
  ro = own * ro; rd = own * rd; wlL = own * wlL;
  rd += vec3(lessThan(abs(rd), vec3(1e-4))) * 2e-4;
  float z0 = uTravel * .085, travel = uTravel * .077, px0 = .33 / uRes.y, s = 1. - uCue * uCue * (3. - 2. * uCue);
  wlDip = 4. * uCue * (1. - uCue);

  // the room: a bench, and a wall behind it
  vec3 col, alb, n = vec3(0., 1., 0.);
  float tg = rd.y < -1e-3 ? -ro.y / rd.y : 1e4, tw = (5.6 - dot(ro, wallN)) / max(dot(rd, wallN), 1e-3), best = min(tg, tw), rim = 0.;
  int id = tg < tw ? 0 : 1;

  // the loaf: its section drawn out along z
  vec3 bx = vec3(wlH + .03, 12.), bo = ro - vec3(0., wlH.y, 12.), k1 = -bo / rd - abs(1. / rd) * bx, k2 = -bo / rd + abs(1. / rd) * bx;
  float tN = max(max(k1.x, k1.y), k1.z), tF = min(min(k2.x, k2.y), k2.z), t = tN, close = 9., d = 9.;
  for (int i = 0; i < 20; i++) {
    if (t > min(tF, best) || tN < 0.) break;
    vec3 q = ro + rd * t;
    d = wlSect(q.xy - vec2(0., wlH.y)) + .006 * sin(5. * (q.z + travel) + 4. * q.y);
    close = min(close, d / t);
    if (d < .0004 + .0006 * t || (i == 19 && d < .03)) { best = t; id = k1.z > max(k1.x, k1.y) && i == 0 ? 2 : 3; break; }
    t += .9 * d;
  }
  if (id < 2) rim = 1. - smoothstep(0., 2. * px0, close - .0006);
  // the slices taken already, the last one on top; and after a cue one on its way
  vec3 rest = ro + rd * (.1 - ro.y) / min(rd.y, -1e-3);
  const float ST = .045, GAP = .42, TOP = 4. * ST;
  bool pile = uCue > .004 || max(abs(rest.x), abs(rest.z + GAP + wlH.y)) < 1.15;
  vec4 got = vec4(0.); float e, gotE = 0.; int lay = 0;
  for (int i = uCue > .004 ? -1 : 0; i < (pile ? 4 : 0); i++) {
    float f = float(max(i, 0)), a = i > 0 ? .07 * sin(f * 2.3) : 0.;
    vec3 c = vec3(0., TOP - ST * (f + .5), -GAP - wlH.y), e1 = vec3(1., 0., a), e2 = vec3(a, 0., -1.), nn = n;
    if (i > 0) c.xz += .06 * sin(vec2(f * 4., f * 7.));
    if (i < 0) {
      // it tips off the face about its lower edge
      float u = .5 * PI * s;
      e2 = vec3(0., cos(u), -sin(u)); nn = cross(e1, e2);
      nn *= -sign(dot(nn, rd) + 1e-6);
      c = vec3(0., (TOP - .5 * ST) * s, -GAP * s + .5 * ST * (1. - s)) + e2 * wlH.y;
    }
    vec4 sl = wlSlab(ro, rd, c, nn, e1, e2, ST, e);
    if (sl.w < best) rim = max(rim, 1. - smoothstep(0., 2.5 * px0 * sl.w, sl.z));
    if (sl.z < 0. && sl.w < best) { best = sl.w; id = 4; got = sl; gotE = e; lay = i; n = nn; rim = 0.; break; }
  }
  // the shaving
  vec3 cc = vec3(wlH.x + .34, .15, .22), o = ro - cc, r = rd;
  float bq = -dot(o, rd), hq = bq * bq - dot(o, o) + .075, far = bq + sqrt(max(hq, 0.));
  mat2 cr = rot(-.75);
  o.xz = cr * o.xz; r.xz = cr * r.xz;
  t = 2. * bq - far;
  for (int i = 0; i < 26; i++) {
    if (hq < 0. || t > far || t > best) break;
    d = wlCurl(o + r * t);
    if (d < .002) { best = t; id = 5; rim = 0.; break; }
    t += max(.7 * d, .002);
  }
  // the blade: a steel plate let down from above
  float tb = (-.02 - ro.z) / rd.z, blade = 0.;
  vec3 b = ro + rd * tb;
  if (tb > 0. && tb < best) blade = wlBlade(b.xy, px0 * tb * 1.5);

  vec3 pos = ro + rd * best, at = pos - vec3(0., wlH.y, 0.), q = at, shine = normalize(wlL - rd);
  float px = px0 * best, soft = .05 + .1 * uSpace, sd = wlSect(q.xy);
  // how much of the window's light gets there, and the dark at the foot of things
  float sh = wlPane(pos, soft), ao = 1.;
  if (id != 2 && lay >= 0) {
    float bt = (-.02 - pos.z) / wlL.z;
    if (bt > 0.) sh *= 1. - wlBlade((pos + wlL * bt).xy, .02 + .05 * bt);
  }
  if (id < 2 || id > 3) sh *= mix(1., wlBoxShade(pos - vec3(0., wlH.y, 12.), vec3(wlH, 12.)), lay < 0 ? s : 1.);
  float foot = length(vec2(max(abs(pos.x) - wlH.x, 0.), max(-pos.z, 0.)));
  if (id == 0) {
    vec2 f = vec2(pos.x, pos.z + GAP + wlH.y), g = cr * (pos.xz - cc.xz), h = abs(cr * (pos.xz + wlL.xz / wlL.y * .15 - cc.xz)) - vec2(.14, .06);
    ao = (1. - .6 * exp(-foot * 7.)) * (1. - .5 * exp(-max(wlSect(f), 0.) * 14.)) * (1. - .6 * exp(-dot(g * g, vec2(9., 46.))));
    sh *= smoothstep(-.04, .05, wlSect(f + wlL.xz / wlL.y * .1)) * smoothstep(-.02, .13, length(max(h, 0.)));
  }
  // the clay, for the face, for a slice, and dimly through the skin of the side
  vec4 clay = vec4(0.);
  bool cut = id == 2 || (id == 4 && gotE < .5);
  float z = z0;
  for (int i = 0; i < (cut || id == 3 ? 1 : 0); i++) {
    vec2 w = q.xy;
    if (id == 3) { w *= .86; z += pos.z * 1.1; }
    if (id == 4) { w = got.xy; sd = got.z; z -= .4 * (lay < 0 ? s : 1.) + .2 * float(max(lay, 0)); }
    clay = wlClay(w, z, id == 3 ? px + .02 : px * 1.3, id == 2 || lay < 0 ? uHits : 0.);
    q.xy = w;
  }
  float along = pos.z + travel;
  vec3 th = wlThumb(pos.y, along, id == 3 ? 2 : -1);
  if (id == 0) {
    // warm grey, worn, with the lines of the knife
    alb = vec3(.5, .465, .43) * (.9 + .14 * noise(vec2(pos.x * 3., pos.z * 40.)));
    col = alb * (wlSky * ao + wlSun * sh * wlL.y * (.4 + .6 * ao));
  } else if (id == 1) {
    col = vec3(.7, .665, .62) * (wlSky * (.95 + .2 * sat(pos.y)) + wlSun * (sh * .4 + .16 * exp(-.5 * max(C * pos.x + S * pos.z + 2., 0.))));
  } else if (id == 2 || id == 4) {
    // the fine chatter of the blade, drawn down the face
    float drag = noise(vec2(q.x * 120. + q.y * 12., q.y * 2.)) - .5;
    if (id == 2) n = vec3(0., 0., -1.);
    n = normalize(n + vec3(.14 * drag + q.x * smoothstep(-.03, 0., sd), 0., 0.));
    alb = cut ? wlFace(clay, q.xy, z, px, sd) * (1. + .07 * drag) : wlSkin;
    col = alb * (wlSky * mix(.75 + .35 * pos.y, 1., max(n.y, 0.)) + wlSun * sh * (cut ? wlTo(n, wlL) * .87 : .5) + wlHoney * smoothstep(-.14, 0., sd) * (.2 + .32 * uMic));
    col += wlSun * sh * pow(wlTo(n, shine), 14.) * .25 * uTone;
  } else if (id == 3) {
    vec2 ee = vec2(.006, 0.);
    th *= smoothstep(-.1, .02, at.x - wlH.x - at.y + wlH.y);
    n = normalize(vec3(wlSect(at.xy + ee) - sd, wlSect(at.xy + ee.yx) - sd, 0.) / ee.x + vec3(0., th.yz * .012 + .03 * cos(along * 5. + pos.y * 4.)) + 1e-5);
    alb = wlSkin * (.9 + .2 * noise(vec2(along * 3., pos.y * 9.)));
    alb = mix(alb, alb * clay.rgb * 1.1 + .2 * clay.rgb * clay.rgb, .45) * (1. - .1 * th.x);
    col = alb * (wlSky * (.5 + .5 * n.y + .25 * sat(1. - pos.y * 2.)) + wlSun * sh * sat(dot(n, wlL) * .8 + .2));
    // daylight coming through from the cut end, and through the top edge
    col += alb * wlSun * (.45 + .5 * uMic + .5 * uCue) * (.45 * exp(-pos.z * 3.2) + .3 * exp(-max(2. * wlH.y - pos.y, 0.) * 7.));
    col += wlSun * sh * pow(wlTo(n, shine), 14.) * .12;
    col *= 1. - .45 * exp(-9. * max(pos.y, 0.));
  } else {
    vec3 u = o + r * best;
    float len = length(u.yz), st = sin(u.x * 44. + 2.) + .5 * sin(u.x * 23. + 1.);
    n = vec3(0., u.yz / max(len, .01));
    n.xz = n.xz * cr;
    if (dot(n, rd) > 0.) n = -n;
    alb = mix(mix(wlHoney, wlC[1], smoothstep(.5, .6, st)), wlC[4], smoothstep(1., 1.1, -st));
    col = alb * alb * (wlSky * (.6 + .4 * n.y) + wlSun * sh * (.15 + sat(dot(n, wlL) * .65 + .35))) * (.35 + .65 * smoothstep(.03, .15, len));
  }
  col = mix(col, wlSkin * (wlSky + .35 * wlSun) * (id < 1 ? 1. - .8 * exp(-9. * foot) : 1.), rim * .8);
  // brushed steel with a ground edge
  float up_ = wlUp(b.xy), br = noise(vec2(b.x * 3., b.y * 190.)), w = wlPane(b, soft);
  vec3 st = mix(wlSky, wlSun, .35) * (.16 + .2 * sat(up_ * .9) + .1 * sin(b.x * 3.) + .06 * br) + wlSun * w * .06;
  st = mix(wlSky * .5 + wlSun * .33 * (.4 + .6 * w), st, smoothstep(.08, .084, up_));
  st += wlSun * (.45 * (1. - smoothstep(0., .008, abs(up_ - .004))) + .5 * uCue * exp(-9. * max(up_, 0.)));
  return mix(col, st, blade);
}

// Twenty slices fanned on white paper, near to far.
float wlNth(float z) { return 19. * (1.3 - sqrt(1.69 - 1.2 * sat((z + .16) / 4.6))) / .6; }
vec3 wlFan(vec2 p) {
  float near = sat(-uOwn[4]), high = sat(uOwn[4]), tall = wlIn(.15, uRes.x / uRes.y - .6);
  vec3 ta = mix(mix(vec3(.12, 0., .86), vec3(-.5, 0., .05), near), vec3(.6, 0., 1.5), high);
  vec3 ro = mix(mix(vec3(.1, 1.9, -2.1), vec3(-.75, 1.15, -1.15), near), vec3(.6, 5., -.4), high);
  ro += tall * vec3(0., 1.5, -1.6) + vec3(.03 * sin(uTime * .06), 0., 0.);
  vec3 rd = wlRay(ro, ta, 1.45, p), col = vec3(0.);
  float px0 = .43 / uRes.y, soft = .06 + .12 * uSpace, z0 = uTravel * .085, tg = rd.y < -1e-3 ? min(-ro.y / rd.y, 60.) : 60.;
  wlL = normalize(vec3(wlL.x * 1.25, wlL.y * .62, .22));
  vec3 g = ro + rd * tg, pn[2];
  float left = 1., shade = 0., ao = 0.; int seen = 0;
  vec4 ps[2], pm[2]; // the two topmost slices here; and their number, side or face, shadow, how much is seen
  // only those that can reach this place
  float n0 = wlNth(g.z - 1.6), n1 = wlNth(g.z + 1.1) + .5;
  for (int i = 0; i < 18; i++) {
    float k = ceil(n0) + float(i), s = k / 19., e;
    if (k > n1) break;
    s *= 1.3 - .3 * s;
    vec2 c = vec2(-.62 + 3.7 * s - .5 * sin(4.71 * s), -.16 + 4.6 * s), d = vec2(3.7 - 2.36 * cos(4.71 * s), 4.6);
    if (abs(c.x - g.x) > 1.6) continue;
    d = normalize(d + .14 * sin(k * 2.4 + .3 * sin(uTime * .05)) * vec2(-d.y, d.x));
    // a cue runs along and lifts each in turn
    float w = (1. - uCue) * 24. - 2. - k, lift = 4. * uCue * (1. - uCue) * exp(-w * w * .12);
    vec3 e2 = normalize(vec3(d.x, .085 + .3 * lift, d.y)), e1 = vec3(d.y, 0., -d.x), n = cross(e1, e2);
    n *= sign(n.y + 1e-6);
    vec4 sl = wlSlab(ro, rd, vec3(c.x, .03 + e2.y * wlH.y, c.y), n, e1, e2, .026, e);
    float px = px0 * sl.w / max(-dot(rd, n), .25), cov = wlIn(px, sl.z);
    if (cov > .004) {
      // the rim is thin enough to see through
      float a = cov * (1. - (e > .5 ? .15 : .5 * smoothstep(-.03, 0., sl.z)));
      ps[seen] = sl; pn[seen] = n;
      pm[seen] = vec4(k, e, shade, left * a);
      left *= 1. - a;
      seen++;
      if (left < .02 || seen > 1) break;
    }
    // its shadow on those under it
    vec2 off = vec2(dot(wlL.xz, e1.xz), dot(wlL.xz, e2.xz)) * (.07 + .2 * lift);
    shade = max(shade, wlIn(.04, wlSect(sl.xy + off) - .01));
    ao = max(ao, exp(-max(sl.z, 0.) * 13.));
  }
  for (int i = 0; i < seen; i++) {
    vec4 sl = ps[i], m = pm[i];
    vec3 n = pn[i], alb = wlSkin * 1.2;
    float k = m.x, px = px0 * sl.w / max(-dot(rd, n), .25), z = z0 + k * .4, w = (1. - uHits) * 22. - k, v = (1. - uCue) * 22. - k;
    vec4 clay = wlClay(sl.xy, z, px, uHits * exp(-w * w * .06));
    if (m.y < .5) alb = wlFace(clay, sl.xy, z, px, sl.z);
    float sun = wlPane(.5 * (ro + rd * sl.w), soft) * (1. - .75 * m.z);
    vec3 q = alb * (wlSky * (1. - .3 * m.z) + wlSun * 1.9 * sun * (m.y > .5 ? .55 : wlTo(n, wlL)));
    q += alb * wlHoney * smoothstep(-.12, 0., sl.z) * (.2 + .4 * uMic) + alb * wlSun * uCue * exp(-v * v * .1) * .5;
    // the newest are still glossy, with the window in them
    vec3 R = reflect(rd, n);
    vec2 wn = abs(abs(R.xz / max(R.y, .1) - vec2(-.43, 1.08)) - vec2(.08, 0.)) - vec2(.065, .17);
    q += wlSun * 1.4 * exp(-k * .9) * (.05 + .14 * uTone) * (1. - m.y) * wlIn(.03, max(wn.x, wn.y));
    col += m.w * q;
  }
  vec3 alb = wlThree(uOwn[3], vec3(.3, .31, .36), vec3(.86, .845, .81), vec3(.8, .84, .88));
  float sun = wlPane(.5 * g, soft) * (1. - .8 * shade);
  vec3 q = alb * (wlSky * (1. - .4 * ao) + wlHoney * .1 * ao + wlSun * 1.2 * sun * wlL.y * (.82 + .16 * noise(g.xz * 90.) + .1 * noise(g.xz * 1.7)));
  return col + left * mix(q, alb * wlSky, smoothstep(6., 14., tg) * .6);
}

vec3 render(vec2 p) {
  wlSetUp();
  vec3 c = max(uVar < .5 ? wlCutFace(p) : wlFan(p), 0.) * (1. - .15 * dot(p, p));
  return sqrt(c * 1.02 / (1. + .16 * c));
}
