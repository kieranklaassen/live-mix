// name: Upside room
// a: Plaster wall
// b: Attic
// what: A closed room turned into a camera: the day outside lies upside down across a plaster wall, its rail and a door left ajar, with clouds low down, poplars and roofs hanging from above and a canal along the ceiling; or over the boards, rafters and stacked crates of an attic, where the hills hang from the roof.
// follows: Drone brightens the sky that lies low, pad thickens and tints the clouds, texture stirs the trees, phrase and keys light the windows, bands lean the sixteen poplars, the piece tints the fields. Louder is brighter and softer. A hit is a bird in a flash of light; a cue lets white daylight in by the door or a shutter. The loop moves the sun up and down.
// own: 0 the land: 1 sea, the trees turned to sails, -1 high peaks; 1 the trees: 1 broad and round, -1 towers of a city; 2 1 sundown, -1 moonlit night; 3 1 a wide soft hole, only washes of colour, -1 many small holes, a picture from each; 4 1 a great bare room, -1 a small close one; 5 1 brick walls, -1 pleated cloth; 6 1 pale balls stand in it, -1 water on its floor; 7 1 the day in the sounds' colours, -1 a white room in daylight
float urAp, urB, urSun; // how open the hole is, how soft the picture, the height of the sun
vec3 urLow, urZen;
vec3 urQ, urN, urBn, urAlb, urOwn, urDayIn; float urAo, urShade, urPx, urT, urWet, urWall; vec3 urRo, urRd, urEarth;

void urSet() {
  float lv = sat(uLevel);
  urAp = (.75 + .75 * lv * (.6 + .9 * uEnergy)) * (.86 + .28 * uTone);
  bool b = uVar > .5;
  urB = (.0026 + .0065 * lv + .003 * (1. - uTone)) * (b ? .8 : 1.);
  urSun = (b ? .11 : .15) - .05 * cos(TAU * uLoop);
  urLow = mix(b ? vec3(1., .62, .36) : vec3(1., .84, .62), uKind[0] * 1.1, .18 * uDrone);
  urZen = mix(b ? vec3(.09, .23, .52) : vec3(.07, .23, .58), uKind[0], .12 * uDrone);
  urEarth = vec3(1.);
  if (uOwn[7] > 0.) { urLow = mix(urLow, uKind[1] * uKind[1] * 1.15 + .04, .9 * uOwn[7]); urZen = mix(urZen, uKind[0] * uKind[0] * .85, .9 * uOwn[7]); }
  if (uOwn[2] > 0.) { float k = uOwn[2] * (1. - .6 * max(uOwn[7], 0.)); urLow = mix(urLow, vec3(1.35, .46, .16), k); urZen = mix(urZen, vec3(.30, .17, .30), k); urSun *= 1. - .72 * uOwn[2]; urEarth = mix(urEarth, vec3(.62, .40, .38), uOwn[2]); urAp *= 1. + .25 * uOwn[2]; }
  if (uOwn[2] < 0.) { float k = -uOwn[2], d = max(uOwn[7], 0.); urLow = mix(urLow, mix(vec3(.10, .17, .30), urLow * .3, d), k); urZen = mix(urZen, mix(vec3(.010, .022, .07), urZen * .12, d), k); urEarth = mix(urEarth, vec3(.12, .17, .29), k); urAp *= 1. + 1.1 * k; }
  if (uOwn[3] > 0.) urB *= 1. + 9. * uOwn[3];
}
float urUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float urIn(float d, float b) { return smoothstep(-b, b, d); }
float urBox(vec2 q, vec2 h, float b) { return urIn(h.x - abs(q.x), b) * urIn(h.y - abs(q.y), b); }
float urAway(float d, float k) { return exp(-max(d, 0.) * k); }
float urLine(float d, float w, float px) { return 1. - urUp(w, w + px, abs(d)); }

vec3 urSky(vec2 w, float b) {
  float v = w.y;
  vec3 sky = mix(urLow, urZen, urUp(0., uVar > .5 ? .13 : .2, v)) * (.72 + .75 * uDrone * (.5 + uEnergy));
  float drift = uTravel * .012 + uTime * .0035;
  vec2 q = vec2(w.x * 5.2 / (.45 + 1.6 * v) + drift * 1.6, log(.07 + v) * 4.2 + 12.);
  float n = noise(q) * .55 + noise(q * 2.1 + 3.1) * .28 + noise(q * 4.7 + 8.7) * .17;
  float nl = noise(q + vec2(.14, .2)) * .55 + noise((q + vec2(.1, .15)) * 2.1 + 3.1) * .28, thick = .52 - .12 * uPad;
  float d = urUp(thick - 2. * b, thick + .08 + 4. * b, n);
  vec3 sh = mix(mix(vec3(.3, .34, .44), urLow, .25), uKind[1] * .75, .55 * uPad);
  vec3 hi = vec3(.88, .8, .69) + urLow * .52;
  if (uOwn[2] != 0. || uOwn[7] > 0.) { float a = max(abs(uOwn[2]), uOwn[7]); sh = mix(sh, urZen * .7 + urLow * .16, a); hi = mix(hi, urLow * (uOwn[2] < 0. ? 1. : .95) + (uOwn[2] < 0. ? .02 : .12), a); }
  sky = mix(sky, mix(sh, hi, sat(.2 + 3.6 * (n - nl))) * (.8 + .35 * uPad), d * .92);
  if (uOwn[2] < 0.) { vec2 g = w * 34., h = hash22(floor(g)), o = fract(g) - .25 - .5 * h; sky += vec3(.9, .95, 1.1) * -uOwn[2] * step(.72, h.y) * (1. - d) * exp(-dot(o, o) * (60. + 60. * h.x)) * urUp(.04, .14, v) * (.7 + .3 * sin(uTime * .5 + h.x * 40.)); }
  float ds = length(w - vec2(uVar > .5 ? .012 : -.085, urSun)), r = .016 + b;
  vec3 sunCol = vec3(1.7, uVar > .5 ? vec2(1., .5) : vec2(1.35, .9));
  if (uOwn[2] != 0.) { sunCol = mix(sunCol, uOwn[2] > 0. ? vec3(1.9, .75, .28) : vec3(.62, .68, .8), abs(uOwn[2])); r *= 1. + .6 * abs(uOwn[2]); }
  return sky + sunCol * ((1. - .6 * d) * 1.8 * urUp(r + 1.6 * b, r - 1.6 * b, ds) + (.28 + .3 * uMic) * exp(-ds * 15.));
}
const vec4 urH[6] = vec4[6]( // houses: middle, half width, wall height, roof height
  vec4(-.425, .046, .052, .042), vec4(-.335, .03, .062, .032), vec4(-.272, .025, .034, .028),
  vec4(-.212, .021, .026, .022), vec4(.3, .05, .056, .046), vec4(-.53, .04, .044, .044));
void urHouses(vec2 w, float b, inout vec3 c) {
  if (abs(w.y - .05) > .11) return;
  for (int i = 0; i < 6; i++) {
    vec4 h = urH[i]; vec2 q = w - vec2(h.x, -.014);
    if (abs(q.x) > h.y + .04) continue;
    float fi = float(i), top = h.z + h.w;
    vec3 wall = mix(vec3(.72, .62, .48), vec3(.55, .42, .34), hash11(fi + 2.)) * (.82 + .18 * q.x / h.y);
    vec3 roof = mix(vec3(.42, .16, .1), vec3(.22, .22, .26), step(.5, hash11(fi + 5.)));
    float rd = min(top - q.y, (h.y + .006 - abs(q.x)) * 1.6 - (q.y - h.z) * h.y * 1.1 / h.w);
    wall *= urEarth; roof *= urEarth;
    if (uOwn[7] > 0.) { wall = mix(wall, uKind[4] * .5 * urEarth, .7 * uOwn[7]); roof = mix(roof, uKind[3] * .3 * urEarth, .7 * uOwn[7]); }
    c = mix(c, roof * (.8 + .4 * urUp(h.z, top, q.y)), urIn(rd * .7, b) * urIn(q.y - h.z + .002, b));
    float body = urBox(q - vec2(0., h.z * .5 - .02), vec2(h.y, h.z * .5 + .02), b);
    c = mix(c, wall * (1. - .35 * urUp(.012, 0., h.z - q.y)), body);
    vec2 g = vec2(h.y * .62, .027), k = (q - vec2(0., h.z - .014)) / g, id = clamp(floor(k + .5), vec2(-1.), vec2(1., 0.));
    float pane = urBox((k - id) * g, vec2(.0058, .0085), b) * body, r1 = hash11(fi * 3.7 + id.x * 1.9 + id.y * 5.3);
    vec3 glow = mix(vec3(1.6, .85, .3), uKind[3] * 1.4, .35) * uPhrase;
    c = mix(c, vec3(.1), pane * .8) + glow * .1 * body + pane * (glow * (1.2 + 2.4 * r1) + vec3(1.6, 1.3, .8) * uKeys * step(.5, r1) + vec3(1.2, .72, .26) * max(-uOwn[2], 0.) * step(.45, r1));
  }
}
// Sixteen poplars: a row going away, or a row along a crest.
void urTrees(vec2 w, float b, float crest, inout vec3 c) {
  bool rowB = uVar > .5;
  float sea = max(uOwn[0], 0.) * (1. - abs(uOwn[1])), crown = max(uOwn[1], 0.), tower = max(-uOwn[1], 0.);
  if (rowB && abs(w.y - crest - .09) > .13 + .1 * max(tower, crown)) return;
  float i0 = floor(rowB ? (w.x + .55) / .072 : (.6 / max(w.x + .42, .05) - 1.) / .24);
  for (float k = 1.; k > -1.5; k -= 1.) {
    float i = i0 + k;
    if (i < -.5 || i > 15.5) continue;
    float z = 1. + .24 * i, r = hash11(i + 3.);
    vec2 foot = rowB ? vec2(-.55 + .072 * (i + .5 * r), crest - .008) : vec2(-.42 + .6 / z, -.034 / z);
    float h = rowB ? (.13 + .05 * r) * (.5 + .5 * urUp(5., 7., i)) : (.215 + .04 * r) / z;
    if (rowB) h *= 1. + .5 * max(tower, crown);
    vec2 q = (w - foot) / h;
    if (q.y < -.1 || q.y > 1.15 || abs(q.x) > .5) continue;
    q.x -= (1. - tower) * q.y * q.y * (.05 * (r - .5) + .24 * uBands[int(i)] * (.4 + .6 * uEnergy) + (.012 + .07 * uTexture) * sin(uTime * .55 + i * 1.3));
    float rag = noise(q * vec2(13., 9.) + i * 7.3) - .5, rag2 = noise(q * vec2(36., 30.) + i * 3.1) - .5;
    float t = sat(q.y), wd = .34 * sqrt(t + .004) * (1. - t) * (1.15 - .4 * t) + .1 * rag * (1. - t) + .04 * rag2;
    if (crown > 0.) wd = mix(wd, max(sqrt(max(.13 - (t - .62) * (t - .62), 0.)) * 1.1 + .05 * rag + .03 * rag2, .028 * step(t, .5)), crown);
    if (tower > 0.) wd = mix(wd, (.12 + .09 * hash11(i + 8.)) * (1. - .35 * step(.6 + .3 * r, t)) * step(t, .72 + .26 * hash11(i + 21.)), tower);
    if (sea > 0.) { wd = mix(wd, t < .1 ? .2 * urUp(0., .06, t) : .30 * (1. - t) * step(.13, t) + .012, sea); q.x += sea * .07 * (1. - t) * step(.1, t); }
    float m = urIn(min(wd - abs(q.x), 1.02 - q.y), b / h + .012) * urUp(0., .06, q.y);
    float side = sat(.5 + (q.x / max(wd, .03)) * -.42 + .9 * rag);
    vec3 leaf = mix(vec3(.022, .045, .03), vec3(.16, .19, .06), side * side);
    leaf = mix(leaf, mix(vec3(.4, .38, .14), uKind[2], .4), sat(.35 + rag2) * (.08 + .7 * uTexture) * side);
    m *= (1. - max(-uOwn[0], 0.) * (1. - abs(uOwn[1]))) * (1. - crown * step(.5, fract(i * .5)));
    if (!rowB) leaf = mix(leaf, urLow * .45, .02 * i);
    leaf *= urEarth;
    if (uOwn[7] > 0.) leaf = mix(leaf, uKind[2] * uKind[2] * (.16 + 1. * side * side) * urEarth, .85 * uOwn[7]);
    if (tower > 0.) {
      vec2 g = q * vec2(26., 30.), f = abs(fract(g) - .5); float lit = step(.84 - .5 * uBands[int(i)], hash21(floor(g) + i * 9.));
      vec3 wall = mix(vec3(.42, .40, .38), uKind[2] * .5, .2 + .5 * max(uOwn[7], 0.)) * (.14 + .4 * step(q.x, .02) * (.4 + r)) * urEarth;
      wall = mix(wall, mix(wall * .7, vec3(1.5, .95, .42), lit * max(max(-uOwn[2], .7 * uOwn[2]), .12)), urUp(.42, .3, f.x) * urUp(.42, .26, f.y) * urUp(.02, .004, b));
      leaf = mix(leaf, wall, tower);
    }
    if (sea > 0.) leaf = mix(leaf, (t < .115 ? vec3(.1, .06, .05) : mix(mix(vec3(.85, .78, .66), vec3(.62, .24, .14), step(.6, r)), uKind[2], .25 + .5 * max(uOwn[7], 0.)) * (.6 + .5 * step(0., q.x))) * urEarth, sea);
    c = mix(c, leaf, m);
  }
}
vec3 urTint(vec3 c, float x, float dv) { vec4 m = piece(vec2(.5 - x * .9, sat(.95 - dv * 3.6))); return mix(c, (.5 * m.rgb + .1) * (.3 + 2.5 * c), .65 * sat(m.a) * urUp(.55, .42, abs(x))); }
float urPeak(float x, float s) { return (1. - abs(2. * noise(vec2(x * 5.5 + s, s)) - 1.)) * .7 + (1. - abs(2. * noise(vec2(x * 13. + s, s)) - 1.)) * .24 + noise(vec2(x * 41., s)) * .06; }
vec3 urSeaAt(vec3 mir, float x, float dv) {
  float n = noise(vec2(x * 9. / (dv + .05), 24. * log(dv + .02) + uTime * .5)), m = noise(vec2(x * 24. / (dv + .05), 46. * log(dv + .02) - uTime * .7));
  vec3 c = mir * mix(vec3(.34, .46, .52), vec3(.62, .7, .72), n) * mix(vec3(1.), .5 + uKind[3], max(uOwn[7], 0.));
  float path = exp(-abs(x - (uVar > .5 ? .012 : -.085)) / (.03 + .5 * dv));
  return urTint(c, x, dv) + (uOwn[2] < 0. ? vec3(.5, .56, .7) : urLow) * 1.3 * path * urUp(.5, .75, .5 * n + .5 * m);
}
vec3 urDay(vec2 w, float b) {
  bool vb = uVar > .5;
  float x = w.x, below = urIn(-w.y - .004, b), y = abs(w.y);
  float h3 = -.015 + .024 * sin(x * 6. + .4) + .012 * sin(x * 13. + 3.), sea = max(uOwn[0], 0.), high = max(-uOwn[0], 0.);
  if (sea > 0.) h3 = mix(h3, -.004, sea);
  float dv = vb ? h3 - w.y : -1.;
  vec3 c = vec3(0.);
  if (dv < b + .001) {
  c = urSky(vec2(x, y), b);
  float h1 = (vb ? .028 : .038) + .02 * sin(x * 6.1 + 1.) + .008 * sin(x * 14.3 + 2.);
  float h2 = (vb ? .01 : .014) + .012 * sin(x * 8.7 + 4.) + .005 * sin(x * 23.);
  vec3 far = mix(urLow, urZen, .6) * .5, near = vec3(.17, .2, .13) * urEarth;
  if (sea > 0.) { h1 = mix(h1, h1 * .3 - .012, sea); h2 = mix(h2, -.03, sea); }
  near = mix(near, uKind[3] * .2 * urEarth, max(uOwn[7], 0.));
  if (high > 0.) {
    float p1 = urPeak(x, 3.), p2 = urPeak(x + .3, 7.), f1 = urPeak(x + .012 + .25 * y, 3.) - urPeak(x - .012 + .25 * y, 3.), f2 = noise(vec2(x * 22. + y * 30., y * 14.)) - .5;
    h1 += high * (.34 * p1 * p1 - .02); h2 += high * (.1 * p2 - .02);
    float lit = sat(.5 + 5. * f1 + .9 * f2), snow = urUp(-.02, .03, y - .07 - .08 * f2);
    far = mix(far, mix(urZen * .3, vec3(.15) + urLow * .25, lit), high);
    far = mix(far, mix(urZen * .6 + .12 * urLow, urLow * 1.1 + (uOwn[2] < 0. ? .12 : .4), lit), high * snow);
    near = mix(near, vec3(.05, .075, .07) * urEarth * (.7 + f2), high * .8);
  }
  c = mix(c, far, urIn(h1 - y, b + .002));
  c = mix(c, near, urIn(h2 - y, b + .001));
  if (vb) { urHouses(w - vec2(.09, -.16 * max(abs(uOwn[0]), max(-uOwn[1], 0.))), b, c); urTrees(w, b, h3, c); }
  }
  if (vb) {
    if (dv < -b - .001) return c;
    float row = log(max(dv, 0.) + .03) * 3. + x * 1.6, id = floor(row), f = fract(row);
    vec3 fld = mix(vec3(.15, .22, .07), vec3(.62, .46, .2), hash11(id + 11.));
    fld *= urEarth;
    if (uOwn[7] > 0.) fld = mix(fld, mix(uKind[3] * uKind[3], uKind[2] * uKind[2], hash11(id + 4.)) * .6 * urEarth, .85 * uOwn[7]);
    fld = urTint(fld, x, dv) * (.75 + .5 * noise(vec2(x * 60., dv * 120.)));
    fld = mix(fld, vec3(.04, .06, .03), urUp(.1 + 14. * b, 0., min(f, 1. - f)) * .8);
    if (sea > 0.) fld = mix(fld, urSeaAt(mix(urLow, urZen, sat(dv * 3.)), x, dv), sea);
    return mix(c, fld, urIn(dv, b + .001));
  }
  dv = max(-w.y, 0.) + .012;
  float gx = (x + .42) / dv;
  float water = urIn((gx - 1.6) * dv, b) * urIn((6.4 - gx) * dv * .8, b);
  vec3 fld = mix(vec3(.1, .15, .045), vec3(.3, .27, .1), noise(vec2(gx * .5, 4. * log(dv))));
  fld *= urEarth;
  if (uOwn[7] > 0.) fld = mix(fld, uKind[3] * uKind[3] * (.2 + .35 * noise(vec2(gx * .5, 4. * log(dv)))) * urEarth, .85 * uOwn[7]);
  fld = urTint(fld, x, dv) * (1. + .6 * (noise(vec2(gx * 1.5, 12. * log(dv))) - .5) * urUp(.02, .07, dv));
  vec3 mir = c * vec3(.66, .74, .78);
  if (sea > 0.) { mir = mix(mir, urSeaAt(c, x, dv), sea); water = mix(water, 1., sea); }
  urHouses(w + vec2(0., .16 * max(abs(uOwn[0]), max(-uOwn[1], 0.))), b, c);
  c = mix(c, mix(fld, mir, water), below);
  mir = c; urTrees(vec2(x, abs(w.y + .03) - .03), b, 0., mir);
  return mix(c, mir, mix(1., .75 * water, urIn(-w.y - .03, b)));
}
vec2 urPlaster(vec2 s, float px) {
  float a = noise(s * 1.4 + 3.), b = noise(s * 5.3), c = noise(s * 5.3 + vec2(.22, -.16));
  float f = (noise(s * 34.) - .5) * exp(-px * 60.);
  float crack = abs(noise(s * vec2(1.1, 1.5) + .16 * b + 7.) - .5);
  float cr = (1. - urUp(0., .004 + 1.2 * px, crack)) * urUp(.52, .75, a);
  return vec2(.8 + .2 * a + .1 * (b - .5) + .1 * f - .3 * cr, (b - c) * 1.2 + .25 * f);
}
vec3 urBoards(float across, float along, float w, float seed, vec3 dark, vec3 pale, float px) {
  float bx = across / w, bi = floor(bx), bf = abs(fract(bx) - .5);
  vec3 c = mix(dark, pale, hash11(bi + seed)) * (.82 + .3 * noise(vec2(across * 46., along * 2. + bi * 7.)));
  return c * (1. - .7 * urUp(.5 - (.006 + px) / w, .5 - .002 / w, bf));
}
const vec3 urHa = vec3(-.95, 1.92, -3.1), urHb = vec3(-.1, 1.82, -3.), urWhite = vec3(1., .97, .9), urPaint = vec3(.72, .68, .59);
vec3 urTurn(vec3 r, float yaw) { r.xz = r.xz * rot(-yaw); return normalize(r); }
void urPool(vec3 f, inout vec3 ro, inout vec3 rd) {
  float k = -uOwn[6], lies = .62 * noise(f.xz * 1.1 + 4.) + .38 * noise(f.xz * 2.9 + 11.);
  if (lies > .12 + .9 * k) return;
  urWet = (.42 + .5 * pow(1. - sat(-rd.y), 3.)) * urUp(.12 + .9 * k, .1 + .9 * k, lies);
  vec2 w = f.xz * 5.;
  vec2 rip = (vec2(noise(w + vec2(.3 * uTime, 2.)), noise(w * 1.2 + vec2(9., -.25 * uTime))) - .5) * (.03 + .05 * uLow);
  rd = normalize(vec3(rd.x + rip.x, -rd.y, rd.z + rip.y));
  ro = f - rd * dot(f - ro, urRd);
}
void urRoom(vec2 p, float op) {
  vec3 lo = vec3(-1.9, 0., -3.4), hi = vec3(3.4, 2.75, 2.4);
  if (uOwn[4] > 0.) { lo.x = mix(lo.x, -3.6, uOwn[4]); hi = mix(hi, vec3(5.2, 5.4, 5.6), uOwn[4]); }
  if (uOwn[4] < 0.) { lo.x = mix(lo.x, -1.15, -uOwn[4]); hi = mix(hi, vec3(1.75, 2.22, 1.15), -uOwn[4]); }
  vec3 ro = vec3(.35, 1.5, -2.1), rd = urTurn(vec3(p.x, p.y - .05, 1.18), -.2);
  urRd = rd; urRo = ro;
  if (uOwn[6] < 0. && rd.y < -1e-3) {
    float tf = -ro.y / rd.y; vec3 f = ro + rd * tf;
    vec2 ld = vec2(-cos(.46 + .22 * op), -sin(.46 + .22 * op)), ln = vec2(-ld.y, ld.x);
    float tl = dot(vec2(1.43, hi.z) - ro.xz, ln) / min(dot(rd.xz, ln), -1e-3), al = dot(ro.xz + rd.xz * tl - vec2(1.43, hi.z), ld);
    if (f.x > lo.x && f.x < hi.x && f.z < hi.z && !(tl > 0. && tl < tf && al > 0. && al < .88)) urPool(f, ro, rd);
  }
  vec3 sg = step(0., rd), m = (mix(lo, hi, sg) - ro) / (rd + (sg - .5) * 1e-5);
  float t = min(m.x, min(m.y, m.z));
  vec3 n = t == m.z ? vec3(0., 0., -1.) : t == m.x ? vec3(1. - 2. * sg.x, 0., 0.) : vec3(0., 1. - 2. * sg.y, 0.);
  vec3 q = ro + rd * t;
  const float dl = .55, dr = 1.43, dh = 2.06;
  float th = .46 + .22 * op;
  vec2 ld = vec2(-cos(th), -sin(th)), K = vec2(dr, hi.z), E = K + ld * (dr - dl);
  vec3 ln = vec3(sin(th), 0., -cos(th));
  int id = 0;
  vec2 uv = vec2(0.);
  float tl = dot(vec3(K.x, 0., K.y) - ro, ln) / min(dot(rd, ln), -1e-3);
  vec3 ql = ro + rd * tl; float al = dot(ql.xz - K, ld);
  if (tl > 0. && tl < t && al > 0. && al < dr - dl && ql.y < dh) { t = tl; q = ql; n = ln; id = 1; uv = vec2(al, ql.y); }
  else {
    float te = dot(E - ro.xz, ld) / min(dot(rd.xz, ld), -1e-3);
    vec3 qe = ro + rd * te; float ae = dot(qe.xz - E, ln.xz);
    if (te > 0. && te < t && ae < 0. && ae > -.045 && qe.y < dh) { t = te; q = qe; n = vec3(ld.x, 0., ld.y); id = 2; }
    else if (n.z < -.5 && q.x > dl && q.x < dr && q.y < dh) id = 3;
  }
  float px = 1.2 * t / uRes.y; urPx = px;
  vec3 alb = vec3(.84, .79, .7), bn = n, edge = min(q - lo, hi - q);
  if (id == 3) {
    float y = q.y + rd.y * 1.5 / rd.z;
    alb = vec3(0.);
    urOwn = urWhite * (.09 + .08 * uDrone + 1.4 * uCue) * urUp(-.5, 2.4, q.y) * (y < 0. ? .45 : y < .2 ? .8 : 1.) * urUp(dl - .12, dl + .1, q.x);
  } else if (id == 0 && n.y < .5) {
    vec2 s = n.z < -.5 ? q.xy : n.y < -.5 ? q.xz + 3. : vec2(q.z + 9., q.y);
    vec2 pl = urPlaster(s, px); alb *= pl.x;
    if (n.y > -.5) {
      float dado = urIn(.93 - q.y, px), worn = urUp(.8, .88, noise(s * 3.1 + 20.) + .25 * noise(s * 17.));
      alb = mix(alb, vec3(.66, .67, .58) * pl.x, dado * (1. - .8 * worn));
      float lift = pl.y * .55;
      float ry = (q.y - .95) / .045, sy = q.y - .17;
      vec2 dq = vec2(abs(q.x - .5 * (dl + dr)) - .5 * (dr - dl), q.y - dh);
      float fr = n.z < -.5 ? max(dq.x, dq.y) : 1., frame = urIn(.1 - fr, px);
      float rail = urIn(1. - abs(ry), px / .045) * (1. - frame), skirt = urIn(-sy, px) * (1. - frame);
      float wood = max(max(rail, skirt), frame);
      alb = mix(alb, urPaint, wood);
      lift = mix(lift, .9 * ry * abs(ry), rail);
      lift = mix(lift, urUp(-.05, -.005, sy) * .8, skirt);
      lift = mix(lift, (urLine(fr - .092, .006, px) - urLine(fr - .045, .005, px)) * .5, frame);
      urAo *= 1. - .55 * (1. - frame) * urUp(.075, 0., .905 - q.y) * step(q.y, .905);
      urAo *= 1. - .45 * (1. - wood) * urAway(fr - .1, 30.);
      bn = normalize(n + vec3(0., lift, 0.));
    }
  } else if (id == 0) {
    alb = urBoards(q.x + 5., q.z, .19, 3., vec3(.3, .2, .13), vec3(.42, .3, .2), px);
    urAo *= 1. - .5 * urAway(hi.z - q.z, 5.) * urAway(abs(q.x - 1.) - .6, 8.);
  } else {
    vec2 c = vec2(abs(uv.x - .44) - .205, uv.y < .92 ? abs(uv.y - .5) - .3 : abs(uv.y - 1.48) - .42);
    float d = max(abs(c.x) - .145, c.y), bev = urLine(d, .014, px);
    alb = urPaint * (.9 + .14 * noise(uv * vec2(50., 4.))) * (1. - .28 * bev);
    bn = normalize(n + vec3(0., d == c.y ? 1.1 * bev * sign((uv.y < .92 ? .5 : 1.48) - uv.y) : 0., 0.));
    float kn = length(uv - vec2(.81, 1.)) - .026;
    alb = mix(alb, vec3(.1, .08, .05), urIn(-kn, px));
    if (id == 2) alb = vec3(.5, .46, .39);
  }
  if (id == 0) { vec3 k = 1. - .45 * exp(-edge * 4.); urAo *= abs(n.x) > .5 ? k.y * k.z : abs(n.y) > .5 ? k.x * k.z : k.x * k.y; }
  if (id == 0 && n.z > -.5) {
    vec2 S = vec2(2.3, uOwn[4] == 0. ? 3.45 : hi.z + 1.05); float dz = S.y - q.z;
    float a = (q.x - S.x) / dz, aj = (dl - S.x) / (S.y - hi.z), ae = mix(aj, (E.x - S.x) / (S.y - E.y), .5);
    float g = urIn(a - aj - .03, .05) * urIn(ae - a, .05) * urIn(.16 + (1.9 - q.y) / dz, .05);
    urDayIn = urWhite * g * (.03 + 1.1 * uCue);
  }
  urQ = q; urN = n; urBn = bn; urAlb = alb; urT = t; urWall = id == 0 && abs(n.y) < .5 && q.y < hi.y - .02 ? 1. : 0.;
}

const vec4 urC[7] = vec4[7](vec4(1.12, .36, 2.35, .12), vec4(1., .93, 2.4, -.22), vec4(.36, .22, 2.45, .3), vec4(.98, .19, 1.45, -.35), vec4(-.95, .3, 2.6, -.1), vec4(-.9, .76, 2.62, .2), vec4(0., 2., 2.2, 0.));
const vec3 urS[7] = vec3[7](vec3(.44, .36, .4), vec3(.33, .21, .28), vec3(.28, .22, .26), vec3(.28, .19, .22), vec3(.42, .3, .3), vec3(.28, .16, .22), vec3(1.3, .08, .07));
float urCrates(vec3 ro, vec3 rd, float tmax, out int id, out vec3 n, out vec3 l) {
  id = -1; n = vec3(0.); l = vec3(0.);
  for (int i = 0; i < 7; i++) {
    vec2 cs = normalize(vec2(1., urC[i].w)); mat2 R = mat2(cs.x, -cs.y, cs.y, cs.x);
    float g = max(uOwn[4], 0.), left = i < 6 ? 1. - g : 1.;
    if (left < .02) continue;
    vec3 o = ro - urC[i].xyz * vec3(1., i < 6 ? left : 1. + .9 * g, 1.), d = rd;
    o.xz = o.xz * R; d.xz = d.xz * R;
    vec3 iv = 1. / (d + (step(0., d) - .5) * 1e-5), k = abs(iv) * urS[i] * left, a0 = -iv * o - k, a1 = -iv * o + k;
    float t0 = max(a0.x, max(a0.y, a0.z)), t1 = min(a1.x, min(a1.y, a1.z));
    if (t0 < t1 && t0 > .002 && t0 < tmax) {
      tmax = t0; id = i; l = o + d * t0;
      n = -sign(d) * vec3(a0.x == t0, a0.y == t0, a0.z == t0);
      n.xz = R * n.xz;
    }
  }
  return tmax;
}
void urAttic(vec2 p, float op) {
  const float k = 1.12, pitch = 1.15, rw = .1;
  float R = 2.75, knee = 1.95, zend = 3.3;
  if (uOwn[4] > 0.) { R = mix(R, 4.9, uOwn[4]); knee = mix(knee, 3.5, uOwn[4]); zend = mix(zend, 6.6, uOwn[4]); }
  if (uOwn[4] < 0.) { R = mix(R, 2.35, -uOwn[4]); knee = mix(knee, 1.55, -uOwn[4]); }
  vec3 ro = vec3(-.65, 1.3, -1.15), rd = urTurn(vec3(p.x, p.y - .02, 1.08), .33);
  urRd = rd; urRo = ro;
  if (uOwn[6] < 0. && rd.y < -1e-3) {
    float tf = -ro.y / rd.y; vec3 f = ro + rd * tf, sn, sl; int si;
    if (abs(f.x) < knee && f.z < zend) { urCrates(ro, rd, tf, si, sn, sl); if (si < 0) urPool(f, ro, rd); }
  }
  float tz = (zend - ro.z) / max(rd.z, 1e-3), tf = rd.y < 0. ? -ro.y / min(rd.y, -1e-4) : 1e4;
  float sx = rd.x > 0. ? 1. : -1., tk = (sx * knee - ro.x) / (rd.x + sx * 1e-4);
  float dn1 = k * rd.x + rd.y, dn2 = -k * rd.x + rd.y;
  float tr = dn1 > 1e-4 ? (R + .16 - k * ro.x - ro.y) / dn1 : 1e4, tl = dn2 > 1e-4 ? (R + .16 + k * ro.x - ro.y) / dn2 : 1e4;
  float ts = min(tr, tl), side = tr < tl ? 1. : -1., dn = max(tr < tl ? dn1 : dn2, 1e-4);
  float t = min(min(tz, tf), min(tk, ts));
  int id = t == tz ? 1 : t == tf ? 2 : t == tk ? 3 : 4; // the gable, the floor, the knee wall, the roof
  vec3 rn = normalize(vec3(-side * k, -1., 0.)), n = id == 1 ? vec3(0., 0., -1.) : id == 2 ? vec3(0., 1., 0.) : id == 3 ? vec3(-sx, 0., 0.) : rn;
  float t1 = ts - .16 / dn;
  if (t1 < t && t1 > 0.) {
    float f = fract((ro.z + rd.z * t1) / pitch + .1) * pitch, tn = t1 + (pitch - f) / max(rd.z, 1e-3);
    if (f < rw) { t = t1; id = 5; n = rn; }
    else if (tn < t) { t = tn; id = 5; n = vec3(0., 0., -1.); }
  }
  int ci; vec3 cn, cl;
  t = urCrates(ro, rd, t, ci, cn, cl);
  if (ci >= 0) { id = ci < 6 ? 6 : 5; n = cn; }
  vec3 q = ro + rd * t, alb;
  float px = 1.2 * t / uRes.y; urPx = px;
  if (id == 4 || id == 3 || id == 1) {
    float along = id == 1 ? q.y : q.z + 11. * side, across = id == 1 ? q.x + 10. : id == 3 ? q.y + 5. : (q.y - side * q.x / k) * .75 + 9.;
    alb = mix(vec3(.78, .72, .63), urBoards(across, along, .24, 2., vec3(.74, .68, .59), vec3(.86, .82, .74), px), .55);
    alb = mix(alb, alb * vec3(.72, .6, .47), urUp(.55, .8, noise(vec2(across * 9., along * 1.3))));
    if (id == 4) { float f = fract(q.z / pitch + .1) * pitch; urAo *= 1. - .6 * exp(-(pitch - f) * 9.) - .45 * urAway(f - rw, 12.); }
    if (id == 1) urAo *= 1. - .5 * urAway(R - k * abs(q.x) - q.y, 4.);
    urAo *= 1. - .45 * exp(-q.y * 5.);
  } else if (id == 2) {
    alb = urBoards(q.x + 10., q.z, .24, 7., vec3(.42, .33, .25), vec3(.55, .45, .35), px);
    urAo *= 1. - .5 * exp(-(knee - abs(q.x)) * 5.);
  } else if (id == 6) {
    vec3 h = urS[ci] * max(1. - max(uOwn[4], 0.), .02), a = abs(cl) / h; bool top = a.y > max(a.x, a.z), sd = a.x > a.z;
    vec2 u = top ? cl.xz : sd ? cl.zy : cl.xy, hu = top ? h.xz : sd ? h.zy : h.xy;
    float sz = hu.y * 2. / max(floor(hu.y * 13.), 2.), post = urIn(abs(u.x) - hu.x + .075, px);
    const vec3 wood = vec3(.6, .45, .29);
    alb = mix(urBoards(u.y + hu.y, u.x + float(ci), sz, float(ci) * 5., wood, vec3(.74, .6, .42), px + .005), wood, post);
    alb *= (1. - .45 * urLine(abs(u.x) - hu.x + .078, .004, px)) * (.7 + .3 * urUp(0., .03, min(hu.x - abs(u.x), hu.y - abs(u.y))));
  } else alb = vec3(.52, .42, .31) * (.75 + .45 * noise(vec2(q.y * 30., q.z * 50.)));
  urCrates(q + n * .006, normalize(urHb - q), 9., ci, cn, cl);
  if (ci >= 0) urShade = .15;
  const vec3 L = vec3(-.8, .59, -.11), A = vec3(-1.22, 1.4, 1.3);
  float lt = dot(n, L), wide = .08 + .24 * op;
  bool slope = id == 4 && side < 0.;
  if (lt > 0. || slope) {
    float tq = slope ? 0. : (R + k * q.x - q.y) / (L.y - k * L.x); vec3 w = q + L * tq;
    float g = urIn(.32 - abs(w.z - A.z), .02) * urIn(w.y - 1.3, .02) * urIn(1.3 + wide - w.y, .02);
    if (slope) urOwn = urWhite * g * (.4 + 1.2 * uCue);
    else if (g > .001) { urCrates(q + n * .006, L, 9., ci, cn, cl); if (ci < 0) urDayIn = urWhite * g * lt * (.4 + 3.4 * uCue); }
  }
  vec3 W = A - ro; float c = -dot(rd, L), wr = dot(W, rd), s = clamp((c * wr + dot(W, L)) / max(1. - c * c, .01), 0., 2.4);
  vec3 off = W - L * s - rd * (wr + s * c);
  urOwn += urWhite * (.008 + .24 * uCue) * exp(-dot(off, off) * 40.) * urUp(0., .3, t - wr - s * c) * (1. - .25 * s);
  urQ = q; urN = urBn = n; urAlb = alb; urT = t; urWall = id == 1 || id == 3 || id == 4 ? 1. : 0.;
}
void urMore(vec3 H, inout vec2 shift) {
  vec3 n = urN; float s = abs(n.z) > .5 ? urQ.x : urQ.z;
  vec3 along = abs(n.z) > .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.);
  if (uOwn[5] > 0. && urWall > 0.) {
    float y = urQ.y / .085, row = floor(y), x = s / .24 + .5 * mod(row, 2.); vec2 id = vec2(floor(x), row), f = vec2(fract(x), fract(y));
    float e = min(min(f.x, 1. - f.x) * .24, min(f.y, 1. - f.y) * .085), h = hash21(id + 3.), in0 = urUp(.002, .009 + urPx, e);
    vec3 c = mix(vec3(.40, .34, .29), mix(vec3(.46, .22, .15), vec3(.64, .40, .28), h) * (.7 + .5 * noise(vec2(s, urQ.y) * 40.)), in0);
    urAlb = mix(urAlb, c * 1.25, uOwn[5]);
    urBn = normalize(urBn + uOwn[5] * .5 * (along * (f.x - .5) * urUp(.03, .0, min(f.x, 1. - f.x)) + vec3(0., 1., 0.) * (f.y - .5) * urUp(.2, 0., min(f.y, 1. - f.y))));
  }
  if (uOwn[5] < 0. && urWall > 0.) {
    float k = -uOwn[5], a = s * 11. + 1.1 * sin(s * 2.3) + .35 * sin(urQ.y * 1.4 + s * 3.) + .12 * sin(uTime * .25 + s * 2.), fold = sin(a);
    urBn = normalize(mix(urBn, n + along * cos(a) * .75, k));
    urAlb = mix(urAlb, vec3(.86, .83, .78) * (.6 + .4 * urUp(-1., .5, fold)), k);
    urAo *= mix(1., .7 + .3 * fold, k);
    shift.x += k * .018 * cos(a);
  }
  if (uOwn[6] > 0.) {
    vec3 to = normalize(H - urQ); bool vb = uVar > .5; float best = urT;
    vec3 C = vec3(0.), here = urQ; float R = 0.;
    for (int i = 0; i < 4; i++) {
      float r = (i == 0 ? .58 : i == 1 ? .3 : i == 2 ? .46 : .17) * uOwn[6];
      vec3 c = vb ? (i == 0 ? vec3(-.05, 0., 1.5) : i == 1 ? vec3(.62, 0., .62) : i == 2 ? vec3(-1.25, 0., 1.45) : vec3(-.5, 0., .55)) : (i == 0 ? vec3(-.75, 0., 1.5) : i == 1 ? vec3(.2, 0., .85) : i == 2 ? vec3(1.75, 0., 1.0) : vec3(-.3, 0., .3));
      c.y = r;
      vec3 o = urRo - c; float bb = dot(o, urRd), cc = dot(o, o) - r * r, dd = bb * bb - cc;
      if (dd > 0.) { float t = -bb - sqrt(dd); if (t > 0. && t < best && urWet >= 1.) { best = t; C = c; R = r; } }
      vec3 l = c - here; float al = dot(l, to), off = sqrt(max(dot(l, l) - al * al, 0.));
      if (al > 0.) urShade *= mix(1., .15, urUp(r * 1.06, r * .94, off));
      float g = length(l) / r; urAo *= 1. - .6 * exp(-max(g - 1., 0.) * 3.);
    }
    if (R > 0.) {
      urQ = urRo + urRd * best; urN = urBn = (urQ - C) / R; urAlb = vec3(.8, .78, .75) * (1. + .3 * min(uOwn[7], 0.)); urOwn *= .3; urDayIn = vec3(0.); urShade = 1.; shift = vec2(0.);
      urAo = .55 + .45 * urUp(-1., .4, urN.y); urPx = 1.2 * best / uRes.y;
    }
  }
}
vec3 render(vec2 p) {
  urSet();
  urWet = 1.; urWall = 0.;
  urOwn = vec3(0.); urDayIn = vec3(0.); urShade = urAo = 1.;
  bool vb = uVar > .5;
  float op = 4. * uCue * (1. - uCue);
  if (vb) urAttic(p, op); else urRoom(p, op);
  vec3 H = vb ? urHb : urHa;
  vec2 shift = vec2(0.);
  if (uOwn[5] != 0. || uOwn[6] > 0.) urMore(H, shift);
  vec3 l = H - urQ;
  float d2 = dot(l, l), d = sqrt(d2), dz = max(-l.z, .4), zoom = (vb ? .66 : .72) * (1.06 - .12 * uSpace);
  vec2 w = l.xy / dz * zoom;
  float lam = dot(urBn, l) / d, e = (.12 + .88 * max(lam, 0.)) * urUp(-.12, .08, dot(urN, l) / d) * dz / d * (vb ? 47. * dz / d / (d2 + 9.) : 37. / (d2 + 4.));
  if (uOwn[4] != 0.) { e *= uOwn[4] > 0. ? 1. + 1.5 * uOwn[4] : 1. + .35 * uOwn[4]; }
  w += shift;
  float frame = 1.;
  if (uOwn[3] < 0.) {
    float k = -uOwn[3], big = mix(1., 3., k); vec2 s = mix(vec2(5., 4.), vec2(.27, .2), sqrt(k)), id = floor(w / s + .5);
    w -= id * s; vec2 ed = .5 * s - abs(w); w = w * big + vec2(0., .06 * k);
    frame = urUp(.004, .03, min(ed.x, ed.y)) * mix(1., .55 + .45 * hash21(id + 5.), k) + .04;
    urB *= mix(1., 1.6, k);
  }
  vec3 c = urDay(w, urB + urPx / dz * zoom);
  if (uOwn[3] < 0.) c *= frame;
  // a hit is a bird going over, with a flash of light about it
  float f = 1. - uHits;
  vec2 bq = w - vec2(.05 - .24 * f, .1 + .04 * f);
  bq *= rot(.25);
  float bx = abs(bq.x), bird = urIn(.0052 * (1. - 24. * bx) + .003 * urUp(.012, 0., bx) - abs(bq.y - bx * (.9 + .2 * cos(f * 12.) - 16. * bx)), urB * .4) * urUp(.042, .034, bx);
  c += mix(vec3(1., .9, .7), uKind[4], .4) * uHits * .9 * exp(-dot(bq, bq) * 260.);
  c *= 1. - .9 * bird * uHits;
  vec3 bounce = mix(urLow, urZen, .5) * .022 * urAp * (.8 + .4 * urN.y + .25 * urUp(0., 2.7, urQ.y));
  if (uOwn[7] < 0.) { float k = -uOwn[7]; bounce += k * vec3(.36, .355, .34) * (.7 + .25 * urN.y - .3 * urN.x) * urShade; urAlb = mix(urAlb, vec3(dot(urAlb, vec3(.33))) * .5 + .4, .7 * k); }
  if (urWet < 1.) urAlb *= urWet;
  return screenOf(urAlb * (c * e * urAp * urShade * mix(1., urAo, .75) + bounce * urAo + urDayIn) + urOwn * (urWet < 1. ? urWet : 1.));
}
