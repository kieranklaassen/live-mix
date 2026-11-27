// name: Hide shadows
// a: Lit cloth
// b: Players side
// what: A cotton cloth glows amber round an oil flame; on it play shadows of pierced, stained hide: a heavy tree, a long boat, a deer with flowers in its flank, herons, hill and cloud; or the stage from behind: the naked lamp, coloured hides on their sticks, huge dark ones at the frame, the watchers' heads through the sheet.
// follows: Each sound presses its hide to the cloth, from a huge soft stain to a sharp shadow, or lifts and lights it: drone tree, pad hill and cloud, texture deer, phrase herons and wingbeats, the mix the boat, the bands its oars and the hill's scales. A hit makes the lamp flare and jump, a cue sends a great shadow across, keys open leaves, the loop rows the boat.
// own: 0 grey morning at -1, ember lamp at 1; 1 bare winter tree at -1, a wide one in blossom at 1; 2 black hide at -1, clear bright stain at 1; 3 boat and tree alone at -1, a giant deer and herons at 1; 4 close to the hides at -1, far back in the night at 1; 5 water along the foot at -1, steep peaks at 1
// The puppet last looked at: its outline (under 0 inside), its holes, its black drawing, its stain.
float hsD, hsHole, hsInk, hsTone;
float hsPx, hsWide; // a pixel; 0 in a tall picture, 1 in a wide one
vec3 hsThrough, hsCol; // a: the lamp's light still reaching the cloth; b: the picture so far
vec2 hsLamp, hsSway; // the flame, and how far it has leaned
float hsSharp, hsBack; // how sharp the light is, how far back a puppet goes
float hsR, hsPower, hsFlare, hsThread; // the way to the lamp, its strength, a hit's light, the weave
float hsPr[5]; // how closely each kind is pressed to the cloth; 4 is the boat
float hsBeat, hsThere; // the herons' wings; whether the beasts are on
float hsGlow, hsSkin, hsClear; vec3 hsSheet; // the lamp's light here, the hide's clouding and how clear it is, b's sheet
float hsX(float tall, float wide) { return mix(tall, wide, hsWide); }
// a soft step from 1 inside to 0 outside, the edge as wide as the blur
float hsIn(float d, float s) { return smoothstep(-s, s, -d); }
// the same for a hole of size r, closed by a wide blur
float hsCut(float d, float r, float s) { return hsIn(d, s) * sat(1.7 * r / s - .35); }
// a limb from ab.xy to ab.zw, ra thick at first and rb at last
float hsLimb(vec2 p, vec4 ab, float ra, float rb) {
  vec2 e = ab.zw - ab.xy, v = p - ab.xy;
  float h = sat(dot(v, e) / dot(e, e));
  return length(v - e * h) - mix(ra, rb, h);
}
// The tree, its foot at 0, about .9 tall: two fans of branches feathered with pierced leaves.
void hsTree(vec2 q, float s, float bloom) {
  float cx = .028 * sin(q.y * 8. + .4);
  float w = .03 + .08 * exp(-max(q.y, 0.) * 15.);
  float trunk = max(abs(q.x - cx) - w, max(-q.y, q.y - .36)) * .85;
  // slanted slots up the trunk
  float k = fract(q.y * 17. + (q.x - cx) * 9.) - .5;
  hsHole = hsCut(max(abs(k) / 17. - .006, abs(q.x - cx) - w * .5), .006, s) * hsIn(q.y - .28, .01) * hsIn(.03 - q.y, .01);
  hsInk = hsIn(-trunk - .008, s);
  hsTone = .6;
  vec2 v = (q - vec2(.012, .36)) * (1. - .24 * bloom);
  float r = length(v), bend = 1. + .45 * min(r, .7);
  hsD = min(trunk, r - .05);
  float a0 = atan(v.x, v.y + 1e-5) * bend + .05 * r * sin(uTravel * .6 + 5. * r);
  const float da = .42, lr = .052;
  for (int i = 0; i < 2; i++) {
    float f = float(i), a = a0 + .5 * da * f;
    float id = clamp(floor(a / da + .5), -5. + f, 5.);
    float t = (a - id * da) * r / bend;
    float n = id * 2. - f;
    float R = mix(.4, .5, f) + .03 * sin(n * 2.3 + 1.) - .0016 * n * n;
    float stem = max(abs(t) - mix(.010, .0025, sat(r / R)), r - R);
    float m = .56 * da * r / bend * (1. + .86 * min(bloom, 0.)) * sqrt(sat((R - r) * 5.)) + 1e-3;
    float tt = abs(t) / m, side = t > 0. ? .5 : 0.;
    float u = (r - .75 * abs(t)) / lr + side, j = floor(u), fu = fract(u) - .5;
    float h = hash21(vec2(n * 2. + side, j + 9.));
    float leaf = max((abs(fu) - 1.2 * sqrt(tt) * (1. - tt)) * lr * .75, r - R);
    // blossom: a round of hide at the leaf's end
    float b = max(length(vec2(fu * lr, (tt - .55) * m)) - .024, r - R) + .03 - .03 * sat(bloom * 2.) + step(h, .4);
    float d = min(stem, min(leaf, b));
    // each leaf is slit along its rib; a key opens some of them wide
    float slit = max(abs(fu) * lr - .0032 * sat(m * 40.) - .009 * uKeys * step(.72, h), (abs(tt - .42) - .28) * m);
    float cut = max(hsCut(slit, .0032, s) * hsIn(.1 - r, .02) * hsIn(-b, s), hsCut(abs(b + .012) - .0028, .0028, s) * sat(bloom * 2.));
    float on = hsIn(d, s);
    hsHole = mix(hsHole, cut * (1. - hsIn(abs(trunk), .01) * step(q.y, .34)), on);
    hsInk = mix(hsInk, max(hsIn(abs(t) - .006, s), .75 * hsIn(abs(leaf) - .0012, s + .001) * hsIn(-b, s)), on);
    hsTone = mix(hsTone, max(hsIn(b, s), .5 + .5 * sin(n * 2.6)), on);
    hsD = min(hsD, d);
  }
}
// A flower of eight petals round 0, as wide as r.
float hsFlower(vec2 q, float r) {
  float l = length(q), a = atan(q.y, q.x + 1e-5);
  float f = abs(mod(a + PI / 8., PI / 4.) - PI / 8.);
  float petal = abs(l - .66 * r) * .55 + l * f * 1.15 - .2 * r;
  return min(petal, l - .2 * r);
}
// The deer, walking right, its middle at 0, from -1.15 to 1.65 tall.
void hsDeer(vec2 q, float s) {
  float d = hsLimb(q, vec4(-.4, .02, .36, .05), .28, .25);
  float neck = hsLimb(q, vec4(.46, .14, .8, .74), .2, .085);
  d = smin(d, neck, .16);
  float head = hsLimb(q, vec4(.8, .79, 1.16, .64), .115, .05);
  d = smin(d, head, .05);
  d = min(d, hsLimb(q, vec4(.72, .85, .42, .97), .055, .012));
  d = min(d, hsLimb(q, vec4(-.63, .14, -.86, 0.), .075, .02));
  float leg = min(hsLimb(q, vec4(.44, -.08, .47, -.58), .115, .05), hsLimb(q, vec4(.47, -.58, .42, -1.12), .05, .038));
  leg = min(leg, min(hsLimb(q, vec4(.4, -.06, .78, -.4), .11, .05), hsLimb(q, vec4(.78, -.4, .68, -.82), .05, .036)));
  leg = min(leg, min(hsLimb(q, vec4(-.52, -.04, -.66, -.52), .19, .055), hsLimb(q, vec4(-.66, -.52, -.56, -1.12), .055, .038)));
  leg = min(leg, min(hsLimb(q, vec4(-.42, -.1, -.36, -.55), .17, .05), hsLimb(q, vec4(-.36, -.55, -.2, -1.04), .05, .036)));
  d = smin(d, leg, .05);
  // both antlers at once, folded about the brow
  vec2 m = vec2(abs(q.x - .76), q.y);
  float horn = min(hsLimb(m, vec4(.02, .86, .28, 1.2), .035, .03), hsLimb(m, vec4(.28, 1.2, .2, 1.66), .03, .012));
  horn = min(horn, min(hsLimb(m, vec4(.15, 1.03, .06, 1.3), .026, .01), hsLimb(m, vec4(.28, 1.22, .5, 1.48), .026, .01)));
  hsD = min(d, horn);
  // lace: three flowers, beads along the belly and up the neck
  float cell = clamp(floor(q.x / .36 + .5), -1., 1.);
  float lace = hsFlower(q - vec2(cell * .36, .05 + .02 * cell), .165);
  vec2 n = mat2(.49, .87, .87, -.49) * (q - vec2(.48, .2));
  float bead = max(length(vec2(mod(q.x, .1) - .05, q.y + .18 - .03 * q.x)) - .027, abs(q.x) - .5);
  bead = min(bead, max(abs(mod(n.x, .11) - .055) + abs(n.y) * .6 - .036, abs(n.x - .28) - .26));
  float eye = length(q - vec2(.87, .79)) - .026;
  hsHole = max(max(hsCut(lace, .03, s), hsCut(bead, .024, s)), hsCut(eye, .026, s));
  hsInk = max(hsIn(-d - .035, s * .7 + .008), hsIn(abs(lace - .02) - .012, s));
  hsTone = hsIn(leg + .02, .06);
}
// A heron in flight to the right, wings up by lift; about 1 each way.
void hsHeron(vec2 q, float s, float lift) {
  float d = hsLimb(q, vec4(-.3, -.03, .14, .03), .045, .13);
  d = smin(d, hsLimb(q, vec4(.16, .04, .45, .02), .11, .06), .08);
  d = smin(d, hsLimb(q, vec4(.45, .02, .62, .17), .06, .045), .05);
  d = min(d, hsLimb(q, vec4(.64, .19, .72, .2), .065, .045));
  d = min(d, hsLimb(q, vec4(.7, .2, 1.06, .15), .045, .006));
  d = min(d, hsLimb(q, vec4(.62, .24, .28, .31), .022, .004));
  d = min(d, hsLimb(vec2(q.x, abs(q.y - .13 * q.x + .03) - .06), vec4(-.22, -.04, -.96, 0.), .024, .014));
  hsHole = hsCut(length(q - vec2(.67, .205)) - .02, .02, s);
  float bx = mod(q.x, .085) - .0425;
  hsHole = max(hsHole, hsCut(max(length(vec2(bx, q.y - .02 - .06 * q.x)) - .024, abs(q.x - .05) - .3), .024, s));
  hsInk = hsIn(-d - .022, s * .7 + .006) * hsIn(d, s);
  float wings = 9.;
  hsTone = 0.;
  for (int i = 0; i < 2; i++) {
    float f = float(i);
    vec2 v = q - vec2(mix(.1, .04, f), .05);
    float r = length(v);
    float a = atan(v.y, v.x + 1e-5) - (mix(1.05, 1.9, f) + lift * mix(-.7, .8, f) * .6);
    a = mod(a + PI, TAU) - PI;
    float x = a / .92 + .14 * r;
    float fe = x * 8., id = clamp(floor(fe), 0., 7.), ff = fe - id - .5;
    float R = mix(1., .86, f) * (1. - .085 * id) - .22 * ff * ff;
    float w = max(max(-x, x - 1.) * r * .8, r - R);
    wings = min(wings, w);
    float slot = max(abs(ff) * r * .1 - .011, abs(r - .74 * R) - .16 * R);
    float cut = max(hsCut(slot, .011, s), hsCut(length(vec2(ff * r * .115, r - .42 * R)) - .026, .024, s));
    float inside = hsIn(w, s), body = hsIn(d, s);
    hsHole = mix(hsHole, max(cut, hsHole * body), inside * (1. - body));
    hsInk = max(hsInk * body, inside * max(hsIn(.5 - abs(ff) - .07, s * 6. + .05), hsIn(abs(r - .52 * R) - .012, s)));
    hsTone = max(hsTone, hsIn(.52 * R - r, s));
  }
  hsTone *= 1. - hsIn(d, s);
  hsD = min(d, wings);
}
// The long boat, its middle at 0, about 1.1 each way, an oar for each of the bands.
void hsBoat(vec2 q, float s) {
  float x2 = q.x * q.x, ax = abs(q.x);
  float top = .02 + .2 * x2 + .14 * x2 * x2, low = -.2 + .2 * x2 + .3 * x2 * x2;
  float d = max(max(q.y - top, low - q.y) * .85, ax - 1.02);
  // the carved ends curl up and in
  vec2 e = vec2(ax, q.y);
  d = min(d, min(hsLimb(e, vec4(.95, .3, 1.13, .6), .055, .045), hsLimb(e, vec4(1.13, .6, 1.06, .84), .045, .035)) * .9);
  d = min(d, abs(length(e - vec2(.96, .83)) - .1) - .03);
  // the deck house: a curved roof on posts
  vec2 c = vec2(q.x + .12, q.y - .05);
  float rise = .34 - .55 * c.x * c.x;
  float roof = max(abs(c.y - rise) - .05, abs(c.x) - .52);
  float house = max(abs(c.x) - .42, max(c.y - rise, -c.y));
  d = min(d, min(roof, house));
  // the oars
  float lean = .5 + .1 * sin(uTime * .8);
  float ox = q.x + q.y * lean, id = clamp(floor(ox * 9. + 8.), 0., 15.);
  float len = .36 + .3 * uBands[int(id)];
  float of = ox - (id + .5 - 8.) / 9.;
  d = min(d, max(abs(of) - .011 - .02 * (1.0 - smoothstep(.12, .17, abs(q.y + len - .02))), max(q.y, -len - q.y)) * .85);
  hsD = d;
  float v = (q.y - low) / max(top - low, .02);
  float lens = max(abs(mod(q.x, .14) - .07) * .9 + abs(v - .62) * .13 - .04, ax - .86);
  float dots = max(length(vec2(mod(q.x + .07, .07) - .035, (v - .22) * .16)) - .016, ax - .8);
  float win = max(max(abs(mod(c.x + .07, .14) - .07) - .045, abs(c.y - .14) - .075 + .3 * abs(mod(c.x + .07, .14) - .07)), abs(c.x) - .35);
  hsHole = max(hsCut(min(lens, win), .035, s), hsCut(dots, .016, s));
  hsInk = max(hsIn(-d - .02, s * .7 + .006), hsIn(abs(v - .4) * .2 - .006, s) * step(ax, .9));
  hsTone = hsIn(min(roof, house), s);
}
// The hill, or waves when steep is under 0: overlapped scales with cut rims, heaped under a ridge.
void hsHill(vec2 q, float s, float steep) {
  float up = max(steep, 0.), low = max(-steep, 0.), x = q.x;
  float ridge = .27 * exp(-x * x * mix(14., 22., up)) * (1. + .45 * up) + (.15 + .32 * up) * exp(-(x - .34) * (x - .34) * 26.) + .16 * exp(-(x + .33) * (x + .33) * 20.) - .14 * smoothstep(.3, .62, abs(x));
  ridge = mix(ridge, .085 + .02 * sin(x * 4. + uTime * .3), low);
  const float g = .074;
  vec2 c = q / vec2(g * 1.25, g * .46) * mix(vec2(.8) + vec2(1.3, .9) * max(q.y, 0.), vec2(1.), low);
  float rim = 9., row = 0., own = 0.;
  for (int i = 0; i < 2; i++) { // the scale in front covers the one above it
    float n = floor(c.y) - 1. + float(i), odd = mod(n, 2.);
    float xx = c.x + .5 * odd + (uTime * .012 + .1 * sin(uTime * .4 + n)) * low;
    float d = length(vec2(fract(xx) - .5, (c.y - n) * .3)) - .56;
    if (i == 0 ? d < 0. : rim > 8.) { rim = d; row = odd; own = hash21(vec2(floor(xx), n + 3.)); }
  }
  hsD = max((q.y - ridge - .012 * abs(sin(x * 42.))) * .7, -q.y - .1);
  hsHole = max(hsCut((abs(rim + .13) - .045) * g, .004, s), hsCut((abs(rim + .28) - .05 * band(own)) * g, .004, s)) * hsIn(hsD + .015, s);
  hsInk = max(hsIn(-hsD - .008, s), hsIn(abs(rim) - .05, s * 8. + .02));
  hsTone = sat(row + .7 * (own - .5));
}
// A cloud: rolls of hide along a line, each with a curl cut in it.
void hsCloud(vec2 q, float s) {
  float id = clamp(floor(q.x / .15 + .5), -2., 2.);
  float d = 9.;
  vec2 near = vec2(0.);
  float nr = .1;
  for (int i = -1; i <= 1; i++) {
    float k = clamp(id + float(i), -2., 2.);
    float r = .098 - .015 * abs(k) + .012 * sin(k * 5.);
    vec2 v = q - vec2(k * .15, .03 * sin(k * 2.1 + 1.));
    float l = length(v) - r;
    if (l < d) { d = l; near = v; nr = r; }
  }
  hsD = min(d, (abs(q.y + .06 + .03 * sin(q.x * 7.)) - .034 * (1. - q.x * q.x * 3.)) * .8);
  float a = atan(near.y, near.x + 1e-5) / TAU;
  float spiral = abs(fract(length(near) / nr * 2.6 - a) - .5) * nr / 2.6;
  hsHole = hsCut(spiral - .005, .005, s) * hsIn(d + .02, s) * hsIn(.018 - length(near), s);
  hsInk = hsIn(-hsD - .008, s);
  hsTone = 0.;
}
// Looks at puppet w from q, in its own measure.
const vec4 hsBox[6] = vec4[6](vec4(-.72, -.1, .72, 1.05), vec4(-9., -.2, 9., .7), vec4(-.6, -.2, .6, .2),
  vec4(-1.3, -.8, 1.3, 1.1), vec4(-1., -1.2, 1.3, 1.75), vec4(-1.1, -.35, 1.15, 1.2));
bool hsLook(int w, vec2 q, float s) {
  vec4 box = hsBox[w];
  if (any(lessThan(q + s, box.xy)) || any(greaterThan(q - s, box.zw))) return false;
  if (w == 0) hsTree(q, s, uOwn[1]);
  else if (w == 1) hsHill(q, s, uOwn[5]);
  else if (w == 2) hsCloud(q, s);
  else if (w == 3) hsBoat(q, s);
  else if (w == 4) hsDeer(q, s);
  else hsHeron(q, s, hsBeat);
  return true;
}
// The two stains of a kind's puppet: the dyer's own colours, leaning to the kind's.
const vec3 hsDye[10] = vec3[10](vec3(.05, .2, .06), vec3(.45, .05, .02), vec3(.06, .13, .36), vec3(.55, .22, .03), vec3(.85, .42, .06),
  vec3(.5, .06, .02), vec3(.05, .3, .2), vec3(.75, .1, .04), vec3(.66, .05, .02), vec3(.06, .28, .09));
// The stick a puppet is held by, from 0 down to b, hanging slack by sag.
float hsRod(vec2 v, vec2 b, float sag) {
  float h = sat(v.y / b.y);
  return max(abs(v.x - b.x * h - sag * 4. * h * (1. - h)) - .0026, max(v.y, b.y - v.y));
}
const int hsKinds[6] = int[6](0, 1, 1, 4, 2, 3);
// Lays puppet w: in a as a shadow on the cloth (where, how big, how turned; how far back; how much there), in b as m says:
// 1 its shadow on the sheet, 2 the hide on its stick, 3 a near one dark at the frame.
void hsPut(int w, int m, vec2 p, vec4 a, float h, float there, vec4 b) {
  bool front = uVar < .5;
  int k = hsKinds[w];
  float press = hsPr[k], s = (hsPx * 1.2 + .11 * h) * hsSharp;
  if (!front) {
    a = b; there = 1.; h = 0.;
    if (m == 1) { a.xy += (p - hsLamp) * mix(.09, .035, press) + vec2(0., -.012) + hsSway; h = .04; }
    s = m == 1 ? mix(.02, .005, press) * hsSharp : m == 3 ? .004 * hsSharp : hsPx * 1.2;
  }
  if (w > 3) there *= hsThere;
  float z = a.z;
  if (there * z < 1e-3) return;
  vec2 v = (p - a.xy) * (1. - h) - hsSway * h * 2.5;
  if (w > 2 && m < 3) {
    float rod = hsRod(v, w == 4 && !front ? vec2(-.2, -.5) : vec2(.03, -.46), w == 4 ? -.05 : .004);
    if (front) hsThrough *= 1. - .6 * there * hsIn(rod, s) * min(1., .004 / s);
    else if (m == 2) hsCol = mix(hsCol, vec3(.3, .13, .04) * hsGlow + .006, hsIn(rod, s) * there);
  }
  s /= z;
  if (!hsLook(w, rot(a.w) * v / z, s)) return;
  float on = hsIn(hsD, s) * there;
  vec3 stain = mix(mix(hsDye[2 * k], hsDye[2 * k + 1], hsTone), uKind[k] * uKind[k], .3 * (1. - .6 * hsTone)), hide;
  if (front) {
    hide = mix(vec3(.03, .012, .006), stain, sat(press * 1.25 - .2) * hsClear * (w == 0 ? .6 + .6 * max(uOwn[1], 0.) : 1.));
    hide = mix(hide * (1. - .92 * hsInk * sat(2. * press - .6)), vec3(1. + .35 * uHigh), hsHole);
    hsThrough *= mix(vec3(1.), hide, on * mix(.3, 1., smoothstep(0., .75, press)));
  } else if (m == 1) hsCol *= 1. - (.68 - .4 * hsHole) * on;
  else if (m == 3) { // the sheet glimmers through
    hide = vec3(.006, .003, .002) + stain * hsSheet * (.04 + .9 * press * press) * hsClear * hsClear * 1.4 * (1. - hsInk);
    hsCol = mix(hsCol, hide, on * (1. - .85 * hsHole));
  } else { // clouded skin lit through, its cut edge catching the lamp
    stain *= hsClear / .72;
    hide = stain * stain * 1.6 * (.3 * hsSheet + hsGlow * (.06 + 1.4 * press)) * (1. - .95 * hsInk) * (.55 + .9 * hsSkin) + vec3(.005, .003, .002);
    hide += vec3(.9, .5, .16) * hsGlow * .3 * hsIn(abs(hsD + 1.6 * hsPx / z) - .8 * hsPx / z, s) * (.4 + press) * hsClear;
    hsCol = mix(hsCol, hide, on * (1. - .92 * hsHole));
  }
}
void hsPlay(vec2 p) {
  float land = uOwn[5], big = 1. + .5 * max(uOwn[3], 0.), go = sin(TAU * uLoop), h = hsBack * (1. - hsPr[3]);
  // the herons: two in a, one with its shadow in b
  vec2 at = vec2(hsX(.08, .13), .25) + .012 * vec2(sin(uTime * .31), cos(uTime * .27));
  vec4 b = vec4(hsX(.1, .4), .08 + .12 * hsPr[3], hsX(.15, .24) * big, .16 - .26 * hsPr[3] + .03 * sin(uTime * .31));
  hsPut(5, 1, p, vec4(at + vec2(-.16, -.18), hsX(.07, .11) * big, -.22), h, 1., b);
  hsPut(5, 2, p, vec4(at, hsX(.13, .2) * big, -.16), h, 1., b);
  // the long boat, carried to and fro with the loop
  h = hsBack * (1. - hsPr[4]);
  b = vec4(hsX(0., .27) + .05 * go, -.2 + .06 * hsPr[4], hsX(.16, .25), .12 - .1 * hsPr[4] + .02 * sin(uTime * .43));
  hsPut(3, 1, p, vec4(0.), h, 0., b);
  hsPut(3, 2, p, vec4(.02 + hsX(.06, .13) * go, -.14 + .008 * sin(uTime * .5), hsX(.15, .22), .03 * sin(uTime * .43)), h, 1., b);
  // the deer on the hill; in b lifted by a slack rod
  h = hsBack * (1. - hsPr[2]);
  at = vec2(hsX(-.17, -.49), hsX(-.015, .026) + .15 * land + .14 * (big - 1.));
  b = vec4(hsX(-.08, -.31), -.14 + .14 * hsPr[2], hsX(.12, .17) * big, .2 - .2 * hsPr[2] + .03 * sin(uTime * .6));
  hsPut(4, 1, p, vec4(0.), h, 0., b);
  hsPut(4, 2, p, vec4(at, hsX(.1, .14) * big, .025 * sin(uTime * .6 + 2.)), h, 1., b);
  // cloud, hill, and the heavy tree at the side; in b these two stand close to the eye
  h = hsBack * (1. - hsPr[1]);
  hsPut(2, 3, p, vec4(hsX(-.16, -.58) + .02 * sin(uTime * .05), .375, 1., 0.), .7 * h, 1., vec4(0.));
  hsPut(1, 3, p, vec4(hsX(-.22, -.47), -.405, 1., 0.), .5 * h, 1., vec4(hsX(.5, .86) - .12 * max(land, 0.), -.56 + .16 * abs(land), 1.15 + .3 * abs(land), 0.));
  hsPut(0, 3, p, vec4(hsX(.42, .68) + hsSway.x * .35 * p.y, -.42, 1.05, 0.), .12 * (1. - hsPr[0]), 1., vec4(hsX(-.6, -.93) - hsSway.x * .4, -.72, 1.45, 0.));
}
// The hour: grey morning through the cloth under 0, an ember of a lamp over it.
vec3 hsHour(vec3 c, float y) {
  float day = max(-uOwn[0], 0.);
  c = c * (1. - .75 * day) + vec3(.34, .42, .5) * (.75 + .6 * y) * day;
  return mix(c, dot(c, vec3(.4, .5, .1)) * vec3(1.15, .2, .035), .85 * max(uOwn[0], 0.));
}
float hsFlame(vec2 v, float size) {
  v.x -= hsSway.x * 1.6 * (v.y + .03);
  return length(vec2(v.x * mix(2.6, 5., sat(v.y * 9. + .3)), v.y)) - size;
}
// The log at the foot of the cloth, its top at y: how it is lit, and how much of the pixel it is.
vec4 hsLog(vec2 p, float y, vec3 light) {
  float u = max(y - p.y, 0.) * 8.;
  float grain = noise(p * vec2(9., 120.));
  vec3 wood = vec3(.0045, .002, .001) + light * vec3(.9, .7, .45) * exp(-u * 4.) * .26 * grain * grain * (.5 + exp(-u * 18.));
  return vec4(wood, hsIn(p.y - y, hsPx * 1.5));
}
// A cue draws a huge vague tree across the whole cloth.
float hsWipe(vec2 p) {
  p.x -= mix(-1.6, 1.6, uCue);
  return hsIn(length(vec2(abs(p.x) + .35, p.y * .75 + .075)) - .66, .09) * smoothstep(0., .3, uCue);
}
vec3 hsFront(vec2 p) {
  hsThrough *= 1. - .85 * hsWipe(p);
  // the light on the cloth, and the flame itself through the weave
  float fall = hsPower / pow(1. + hsR * hsR * 5.5, 2.1);
  vec3 light = mix(vec3(.9, .17, .012), vec3(1.2, .55, .11), smoothstep(0., .65, fall)) * fall * 1.7;
  light += vec3(1.2, .75, .3) * exp(-hsR * hsR * 45.) * (1. + .6 * uHits) + vec3(.5, .22, .05) * uCue * exp(-hsR * hsR * 9.);
  light += vec3(2.4, 1.9, 1.) * hsIn(hsFlame(p - hsLamp, .045), .03);
  light = hsHour(light * (1. + hsFlare), p.y);
  float fold = .3 * (noise(vec2(p.x * 9. + p.y * 1.5, p.y * .8)) - .4) * (1.0 - smoothstep(-.45, .15, p.y));
  vec3 col = light * (hsThrough + vec3(.02, .011, .006)) * (hsThread - fold);
  // seen from far off, the cloth is a lit square in the night
  float far = sat(uOwn[4]);
  col *= mix(1., .06 + .94 * hsIn(max(abs(p.x) - 1.12, p.y - .56), hsPx * 2.), far);
  col *= .35 + .65 * smoothstep(0., .03, p.y + .405);
  vec4 wood = hsLog(p, -.405, light);
  wood.rgb += light * .5 * hsIn(length(vec2(mod(p.x + .04, .16) - .08, p.y + .427)) - .006, hsPx * 1.5);
  return mix(col, wood.rgb, wood.a);
}
void hsBehind(vec2 p) {
  hsGlow = hsPower / pow(1. + hsR * hsR * 5., 1.8) * (1. + hsFlare);
  // the sheet from the lamp's side, and the watchers' heads through it
  hsSheet = mix(vec3(.55, .22, .07), vec3(1., .77, .42), smoothstep(0., .8, hsGlow)) * hsGlow + vec3(.016, .034, .055) * (1.0 - smoothstep(-.3, .3, p.y));
  float heads = 0.;
  for (int i = 0; i < 2; i++) {
    float f = float(i), c = p.x / .17 + .37 * f, id = floor(c), h = hash11(id + 7. * f + 3.);
    vec2 v = vec2((c - id - .5 - .3 * (h - .5)) * .17, p.y - mix(-.14, -.21, f) - .06 * h - .004 * sin(uTime * .3 + h * 20.));
    heads = max(heads, hsIn(length(vec2(v.x * 1.1, max(v.y, v.y * -.28))) - .05, .018) * mix(.6, 1., f));
  }
  hsSheet = hsHour(hsSheet, p.y) * (1. - .72 * heads) * hsThread;
  hsCol = hsSheet * (1. - .6 * hsWipe(p));
  // the log the hides stand in
  vec4 wood = hsLog(p, -.355, vec3(.8, .55, .22) * hsGlow + hsSheet);
  hsCol = mix(hsCol * (.4 + .6 * smoothstep(-.355, -.32, p.y)), wood.rgb, wood.a);
  // the lamp: a hung bowl, the naked flame, its smoke
  vec2 v = p - hsLamp + vec2(0., .05);
  float bowl = max(length(v * vec2(1., 1.7)) - .062, v.y);
  float chain = max(abs(abs(v.x) - .06 * (1. - v.y * 3.)) - .0018, -v.y);
  hsCol = mix(hsCol, vec3(.05, .022, .008) + vec3(.45, .22, .06) * smoothstep(.02, .06, v.x - v.y), hsIn(min(bowl, chain), hsPx * 1.3));
  hsCol += vec3(1., .55, .18) * (exp(-hsR * hsR * 40.) * (.5 + .5 * uHits) + .35 * uCue * exp(-hsR * hsR * 9.));
  hsCol = mix(hsCol, vec3(5., 3.6, 1.8), hsIn(hsFlame(p - hsLamp, .042), .008));
  float w = v.x - .035 * (noise(vec2(v.y * 7. - uTime * .25, 3.)) - .5) * sat(v.y * 9.);
  hsCol *= 1. - .3 * exp(-w * w * 6000. / (1. + 60. * max(v.y, 0.))) * smoothstep(.1, .16, v.y);
}
vec3 render(vec2 p) {
  hsPx = 1. / uRes.y;
  hsWide = smoothstep(.28, .85, .5 * uRes.x / uRes.y);
  hsSharp = mix(1.5, .6, uTone);
  hsBack = .36 * mix(.75, 1.2, uSpace);
  // the vantage: close to the cloth, or far back in the dark
  float zoom = exp2(.7 * uOwn[4]);
  p = p * zoom + vec2(.16, -.06) * max(-uOwn[4], 0.) + vec2(0., .12) * max(uOwn[4], 0.);
  hsPx *= zoom;
  // the flame leans, and a hit makes the lamp jump
  hsSway = vec2(.016 * sin(uTime * .23) + .007 * sin(uTime * .71 + 1.), .006 * sin(uTime * .37)) + 4. * uHits * (1. - uHits) * vec2(.05, .02);
  hsLamp = mix(vec2(hsX(-.06, -.2), .2), vec2(-.06 * hsWide, .3), step(.5, uVar)) + hsSway;
  hsR = length((p - hsLamp) * vec2(.82, 1.));
  hsPower = .95 + .35 * uLevel * (.5 + uEnergy) + .12 * uMic + .03 * sin(uTime * 1.1) * sin(uTime * .7);
  // a hit: a ring of brighter light runs out from the lamp
  float ring = (hsR - .9 * (1. - uHits)) / .1;
  hsFlare = (.9 * exp(-ring * ring) + .3 * exp(-hsR * 5.)) * uHits * (.6 + .6 * uEnergy);
  hsThread = .86 + .13 * (noise(p * vec2(60., 420.)) + noise(p * vec2(420., 46.) + 7.));
  vec4 loud = vec4(uDrone, uPad, uTexture, uPhrase);
  for (int i = 0; i < 4; i++) hsPr[i] = 1. - exp(-2.6 * loud[i]) * mix(vec4(.4, .75, .98, .98), vec4(.9), uVar)[i];
  hsPr[4] = 1. - mix(.64, .9, uVar) * exp(-1.3 * uLow - 1. * uMid - .8 * uLevel);
  hsBeat = (.12 + .4 * uPhrase) * sin(uTime * .9);
  hsThere = 1. + min(uOwn[3], 0.);
  hsThrough = vec3(1.);
  hsSkin = noise(p * 34.);
  hsClear = .72 + (uOwn[2] < 0. ? .72 : .7) * uOwn[2];
  if (uVar > .5) hsBehind(p);
  hsPlay(p);
  if (uVar < .5) hsCol = hsFront(p);
  return screenOf(hsCol * 1.2);
}
