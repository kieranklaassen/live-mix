// name: Night landing
// a: Window seat
// b: Squid boats
// what: A plain of towns seen at night from a descending aeroplane: streets as beaded strings, a dark river with its bridges, lamps crowding to dust under a last green dusk, the tip of a wing with its red lamp; or a black sea under low cloud, where a fleet of fishing boats burns with pale pillars of light, one boat close by.
// follows: The quarters and boats light up where the piece sounds, low notes to the left and high to the right; each kind has its own family of lamps, the drone the dusk. A hit is lightning inside a far cloud, a cue sends a wave of light over the plain and tips the horizon; keys are headlights or glitter, the voice lights the haze or the near boat.
// own: 0 rose dusk at -1, midnight with pale water at 1; 1 amber lamps at -1, cold white or blue at 1; 2 a few villages or lone boats at -1, towns to the horizon or a full fleet at 1; 3 clear with stars at -1, cloud between or thick haze and bright pillars at 1; 4 the sea comes in or the water lies smooth at -1, snow and hills or drifting ice at 1; 5 low at -1, high up at 1; 6 northern lights at -1, broad pale morning at 1; 7 single fires and no streets, or a rock with a lighthouse for the near boat, at -1, at 1 streets in rings, or a sail on the near boat
float nlPx, nlR;          // the size of a pixel; how big a lamp is, in pixels
float nlDu, nlNi, nlLit; vec3 nlB1, nlB2;   // the hour, and the light left along the edge of the world
vec2 nlF;          // how much ground one pixel takes, across and away
#define nlDay max(uOwn[6], .0)
#define nlNor max(-uOwn[6], .0)
vec3 nlHash(vec2 p) { vec3 q = fract(p.xyx * vec3(.1031, .1030, .0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
float nlUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float nlE(vec2 v) { return exp(-dot(v, v)); }
float nlS(vec2 g) { return noise(g) * .5 + noise(g * 2.4 + 7.0) * .28 + noise(g * 6.0 + 2.0) * .15 + noise(g * 14.0) * .07; }
float nlV(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
vec3 nlInk(int k) { return uKind[k] * uKind[k] * 1.3 + .08; }
// The colour of a lamp: 0 old amber, 1 white and cool.
vec3 nlLamp(float k) {
  k = sat(k + .75 * uOwn[1]);
  return k < .5 ? mix(vec3(1.0, .36, .07), vec3(1.0, .68, .34), k * 2.0) : mix(vec3(1.0, .68, .34), vec3(.66, .92, 1.0), k * 2.0 - 1.0);
}
// Lamps in a row: d is how far off the line we are, s how far along it, n the line's normal, gap from lamp to lamp.
// Far away they are one thin line of the same light.
float nlRow(float d, float s, vec2 n, float gap, float seed) {
  vec2 a = n / nlF, b = vec2(-n.y, n.x) / nlF;
  float bb = dot(b, b), k = d * dot(a, b) / bb, e = s + k, id = round(e / gap), lpx = gap * sqrt(bb);
  vec2 v = a * d + b * (e - gap * id - k);
  float pd = d / length(n * nlF), rr = nlR * nlR;
  float bead = exp(-dot(v, v) / rr) * (.45 + 1.1 * hash21(vec2(id, seed)));
  float line = exp(-pd * pd / rr) * min(.6, 1.4 * nlR / lpx);
  return mix(line, bead, nlUp(2.4, 4.5, lpx));
}
// Streets side by side, each with its row; far away they are one even glow.
float nlSt(float x, float s, vec2 n, float wide, float gap, float seed) {
  float id = round(x / wide), spx = wide / length(n * nlF), lpx = gap * length(vec2(-n.y, n.x) / nlF);
  float far = min(1.0, 1.77 * nlR / spx) * min(1.0, 1.77 * nlR / lpx), see = nlUp(1.6, 4.5, spx);
  if (see <= .0) return far * .7;
  float keep = .12 + nlUp(.25, .5, hash21(vec2(id, seed + 7.0)));
  return mix(far * .7, keep * nlRow(x - wide * id, s + 3.1 * id, n, gap, seed + id), see);
}
vec3 nlStars(vec2 q, float more) {
  vec3 h = nlHash(floor(q * 47.0)); vec2 v = (fract(q * 47.0) - .1 - .8 * h.xy) / 47.0 / max(nlPx, .0012);
  return vec3(.8, .9, 1.0) * exp(-dot(v, v) * 1.5) * pow(nlUp(.8 - .25 * more, 1.02, h.z), 3.0) * (.6 + .5 * more);
}
vec3 nlNorth(float x, float up) {
  vec3 o = vec3(.0);
  for (int k = 0; k < 2; k++) {
    float f = float(k), xx = x * (1.0 + .4 * f) + 5.0 * f + .0035 * uTime, v = up - .05 - .09 * f - .14 * noise(vec2(xx * 2.4, .02 * uTime + f * 9.0));
    float ray = .35 + .9 * noise(vec2(xx * 24.0, .05 * uTime)) * noise(vec2(xx * 5.0 + 3.0, .03 * uTime + 4.0)) * 1.6;
    o += (mix(nlInk(0), nlInk(1), sat(v * 7.0)) * 1.3 + .02) * nlUp(-.025, .012, v) * exp(-max(v, .0) * 9.0) * ray * (1.0 - .35 * f);
  }
  return o * nlNor * (.42 + .7 * uDrone + .25 * uPad + .35 * uHits);
}
vec3 nlM(float up) {
  return mix(mix(vec3(1.0, .86, .7), uKind[1] * uKind[1] * 1.25, .75), mix(vec3(.3, .44, .66), uKind[0] * uKind[0] + .03, .75), 1.0 - exp(-max(up, .0) * 5.0)) * (.85 + .25 * uPad);
}
// The plain: d is how far below the edge of the world, edge the colour of the air there.
vec3 nlLand(vec2 q, float d, vec3 edge) {
  float wx = uOwn[3], place = uOwn[4], H = exp2(1.2 * uOwn[5]);
  float z = H / d;
  nlF = vec2(z, z * z / H) * nlPx;
  nlR = .62 + .26 * (1.0 - uTone) + .0009 / (nlPx * (.6 + .25 * z));
  vec2 go = vec2(.3, 1.0) * uTravel * .0042;
  vec2 g = vec2(q.x * z, z) + go, gg = g;
  float ax = g.x - .3 * g.y;
  // the river, and the sea when there is one
  float my = g.y + .45 * sin(ax * 1.7 + .6);
  float rx = ax + .35 - .5 * sin(my * .95 + .5) - .22 * sin(my * 2.1 + 1.0);
  float o = 1.0 + min(place, .0);
  float sea = ax + .25 * sin(g.y * 1.3) + .12 * sin(g.y * 3.1 + ax) + .3 + 60.0 * o * o * o + o;
  float rd = abs(rx) - .085 - .03 * sin(g.y * .8), bankD = min(rd, sea);
  float bend = .48 * cos(my * .95 + .5) + .46 * cos(my * 2.1 + 1.0);
  vec2 bn = rd < sea ? vec2(1.0, -.3 - bend) : vec2(1.0, -.2);
  float bd = bankD / length(bn), rim; bn = normalize(bn); rim = length(bn * nlF);
  float land = nlUp(-rim, rim + .004, bd);
  // where people live
  float pop = .62 * noise(g * .45 + 3.0) + .38 * noise(g * 1.25 + 9.0);
  pop += .1 * noise(g * 4.5 + 2.0) + .13 * exp(-bd * bd * 3.0) + .26 * uOwn[2];
  pop = nlUp(.42, .78, pop + .07 * nlUp(1.5, 7.0, z)); pop *= pop;
  // the quarters, each with its streets turned its own way
  g += .13 * vec2(sin(g.y * 2.1 + 1.0), sin(g.x * 1.7)) + .03 * vec2(sin(g.y * 7.3), sin(g.x * 6.1 + 2.0));
  vec2 v = g * 1.25, c0 = floor(v), r1 = vec2(9.0), r2 = vec2(9.0), id = vec2(.0); float m1 = 99.0, m2 = 99.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j)), r = c + .12 + .76 * nlHash(c).xy - v; float m = dot(r, r);
    if (m < m1) { m2 = m1; r2 = r1; m1 = m; r1 = r; id = c; } else if (m < m2) { m2 = m; r2 = r; }
  }
  vec3 h = nlHash(id + 41.0);
  vec2 sn = normalize(r2 - r1 + 1e-4), st = vec2(-sn.y, sn.x);
  float ed = .5 * (m2 - m1) / max(length(r2 - r1), .05) / 1.25;
  // what is heard there
  vec2 sc = r1 / 1.25 + g - go; float sz = max(sc.y, .3);
  float su = .5 + sc.x / sz / 1.8;
  vec4 pc = piece(clamp(vec2(su, pow(sat(H / sz / .75), .6)), .01, .99));
  int kd = int(h.z * 3.99);
  float heard = pc.a * 1.5 + .9 * nlV(kd) + .8 * band(sat(su)) * (.4 + .6 * uLevel);
  float wave = uCue * exp(-20.0 * (d - .75 * uCue) * (d - .75 * uCue));
  float live = .42 + 1.6 * wave + (.45 + 1.2 * uEnergy) * heard;
  vec3 tint = mix(vec3(1.0), nlInk(kd) * 1.8, .28 * sat(nlV(kd) * 1.5));
  tint = mix(tint, pc.rgb * pc.rgb * 2.4 / max(pc.a * pc.a, .05), .22 * sat(pc.a * 1.5));
  float twk = 1.0 - .3 * nlUp(1.5, 6.0, z) * (.5 + .5 * sin(uTime * 1.3 + 40.0 * noise(vec2(q.x * 60.0, d * 300.0))));
  float dim = 1.0 / (1.0 + .16 * z * z / (H * H));
  float thin = 1.0 / (1.0 + .05 * z * z);
  mat2 R = rot(1.5 * h.x - .75); vec2 w = R * g;
  vec2 nx = vec2(1.0, .0) * R, ny = vec2(.0, 1.0) * R;
  float inside = nlUp(.0, .03, ed) * land, gap = .072 + .035 * h.y;
  float streets = nlSt(w.x, w.y, nx, gap, .03, h.x * 90.0) + .8 * nlSt(w.y, w.x, ny, gap * 1.6, .034, h.y * 90.0 + 50.0);
  if (uOwn[7] > .0) {
    float rr = length(r1) / 1.25 + 1e-4, a = atan(r1.y, r1.x + 1e-5), wi = gap * .8, ri = max(round(rr / wi), 1.0), per = TAU * wi * ri, gp = per / floor(per / .03 + 1.0), ai = round(a * 8.0 / TAU);
    vec2 e = r1 / (rr * 1.25);
    float see = nlUp(1.6, 4.5, wi / length(e * nlF));
    float rings = 1.3 * nlRow(rr - wi * ri, a * wi * ri, e, gp, ri + h.x * 90.0) + nlRow((a - ai * TAU / 8.0) * rr, rr, vec2(-e.y, e.x), .03, ai) * nlUp(.5 * wi, wi, rr);
    streets = mix(streets, mix(min(1.0, 1.77 * nlR * length(e * nlF) / wi) * .5, rings, see), uOwn[7]);
  }
  float strt = 1.0 - max(-uOwn[7], .0); streets *= strt;
  float full = nlUp(.25 * h.z, .35 + .4 * h.z, pop);
  vec3 lampC = nlLamp(h.y < .7 ? .1 + .25 * h.y : .4 + .6 * h.x);
  vec3 L = lampC * tint * live * streets * 3.0 * inside * full * exp(-.07 * z);
  // the roads between the quarters
  float road = nlRow(ed - .004, dot(g, st), sn, .026, 3.0);
  L += nlLamp(.3) * road * 3.0 * land * pop * nlUp(.0, .25, pop) * (.5 + .5 * live) * thin * mix(vec3(1.0), tint, .5) * strt;
  // the embankments
  L += nlLamp(.55) * nlRow(bd - .022, my, bn, .034, 5.0) * 2.2 * (.25 + .75 * pop) * (.6 + .4 * live);
  // two kinds of great road, over the water by their bridges
  float y1 = gg.y + .3 * sin(gg.x * .7), i1 = round(y1 / 2.3), d1 = y1 - 2.3 * i1;
  vec2 n1 = normalize(vec2(.21 * cos(gg.x * .7), 1.0));
  float x2 = gg.x - .62 * gg.y + .35 * sin(gg.y * .6), i2 = round(x2 / 3.1), d2 = x2 - 3.1 * i2;
  vec2 n2 = normalize(vec2(1.0, -.62 + .21 * cos(gg.y * .6))); d2 *= n2.x;
  float shore = nlUp(-.5, .0, sea);
  float hw = nlRow(abs(d1) - .008, gg.x, n1 * sign(d1 + 1e-6), .032, i1) + nlRow(d2, gg.y * 1.15, n2, .034, i2 + 40.0);
  L += mix(nlLamp(.45), nlInk(3), .3 * uPhrase) * hw * (1.7 + 1.6 * uPhrase) * thin * (.25 + .75 * sqrt(pop)) * shore * (.1 + .9 * strt);
  float car = uTime * .011;
  float cars = nlRow(d1 - .002, gg.x + car, n1, .061, i1 + 60.0) + nlRow(d2 - .006, gg.y * 1.15 + car, n2, .053, i2 + 80.0);
  float tails = nlRow(d1 + .002, gg.x - car, n1, .071, i1 + 90.0);
  L += (vec3(1.0, .95, .82) * cars + vec3(1.0, .1, .05) * tails) * (.35 + 3.5 * uKeys) * 1.4 * thin * shore;
  // windows and yards: single lamps
  float lz = max(log2(z), .0), lf = floor(lz);
  for (int k = 0; k < 2; k++) {
    float lv = lf + float(k), wt = 1.0 - abs(lz - lv), s0 = max(.015, 6.0 * nlPx);
    vec2 cs = s0 * vec2(exp2(lv), exp2(2.0 * lv) * .8 / H), gc = gg / cs, ci = floor(gc);
    vec3 hh = nlHash(ci + lv * 17.0), h2 = nlHash(ci + lv * 31.0 + 7.0);
    vec2 e = (gc - ci - .12 - .76 * hh.xy) * cs / nlF;
    float on = nlUp(hh.z, hh.z + .2, .03 + (.6 + .4 * noise(gg * 9.0)) * pop), big = h2.y * h2.y; big *= big * big;
    int kk = int(h2.z * 3.99);
    vec3 c = nlLamp(h2.x * .95) * (1.0 + 2.0 * nlInk(kk) * nlV(kk));
    float rr = nlR * (.8 + .7 * big);
    if (strt < 1.0) { rr *= 1.0 + (1.0 - strt) * .9 * h2.y; big = mix(big, .2 + .6 * h2.y * h2.y, 1.0 - strt); on *= mix(1.0, step(.55, h2.z), 1.0 - strt); c *= mix(vec3(1.0), vec3(1.0, .62, .36) * (.8 + .2 * sin(uTime * (.7 + h2.x) + 40.0 * hh.x)), 1.0 - strt); }
    L += c * exp(-dot(e, e) / (rr * rr)) * on * wt * max(land, .02 * nlUp(.0, -.5, sea)) * (.16 + .24 * nlUp(1.5, 5.0, z) + 7.0 * big) * (.4 + .6 * live) * (1.0 + .16 * z * z) / (1.0 + .022 * z * z);
  }
  L *= twk * dim;
  vec3 lamps = L;
  // the ground itself: streets that shine a little, dark fields
  float field = noise(gg * 4.0) * .5 + noise(gg * vec2(11.0, 7.0)) * .5;
  vec3 earth = (vec3(.0022, .0034, .006) + nlDu * vec3(.01, .012, .03) + nlNi * vec3(.003, .005, .009)) * (.5 + field);
  earth += sat(place) * vec3(.08, .11, .17) * (.2 + .8 * field) * (1.0 + nlDu);
  vec3 town = lampC * tint * pop * full * live * (.011 + .03 * sat(uOwn[2])) * (1.0 + 1.5 * sat(place));
  vec3 water = vec3(.0015, .003, .006) + (nlLit * nlB2 * .35 + nlNi * vec3(.05, .065, .09)) * nlUp(.9, .0, d);
  vec3 gnd = mix(water, earth + town, land);
  gnd += nlLamp(.35) * .06 * pop * live * exp(-abs(bd) / .028) * (1.0 - land) * noise(vec2(q.x * 90.0, d * 22.0));
  L += gnd;
  // air: far away all of it goes to a warm haze under the dusk
  float air = 1.0 - exp(-z * (.045 + .05 * sat(wx) + .03 * min(wx, .0) - .02 * uSpace) / H);
  vec3 haze = nlLamp(.12) * (.012 + .02 * uLevel + .03 * uMic) * (1.0 + .35 * uOwn[2]) + edge * .07;
  L = mix(L, haze, air * .92);
  // thin cloud between
  float zc = .36 / d; vec2 cg = vec2(q.x, 1.0) * zc + go * 4.5;
  float cn = nlS(cg * vec2(1.7, 2.2)), fog = max(wx, .0);
  float cover = nlUp(.56 - .36 * fog, .86 - .18 * fog, cn + .2 * min(wx, .0)) * nlUp(9.0 + 20.0 * fog, 1.5, zc) * (.62 + .35 * fog);
  vec3 vapour = vec3(.012, .016, .026) + nlDu * vec3(.06, .05, .1) + nlNi * vec3(.04, .05, .07) + (lampC * .02 + nlLamp(.5) * .2 * fog * fog * (.5 + 1.2 * uLevel)) * pop + nlLamp(.15) * .016 * live;
  if (nlDay > .0) {
    // by day: fields of the sounds' colours, the towns pale, the water bright
    vec2 fq = w * vec2(4.6, 3.1), fe = fq + .12 * sin(fq.yx * 1.7), fc = floor(fe); fe = abs(fract(fe) - .5);
    vec3 fh = nlHash(fc + id * 7.0), fd = mix(vec3(.12, .16, .06), nlInk(1 + int(3.99 * fh.x)) * .5, .7);
    float ff = nlUp(.3, .05, nlF.y), fw = .03 + 5.0 * nlF.x + 2.0 * nlF.y;
    fd *= (.6 + .5 * fh.y) * (1.0 - .6 * ff * nlUp(.5 - fw, .5, max(fe.x, fe.y)));
    fd = mix(vec3(.12, .16, .06) * .3 + (nlInk(1) + nlInk(2) + nlInk(3)) * .09, fd, .25 + .75 * ff) * (.75 + .45 * field);
    fd = mix(fd, vec3(.78, .84, .95) * (.6 + .4 * field), sat(place) * .85);
    fd = mix(fd, vec3(.5, .44, .37), .55 * pop * full) * (1.0 + .5 * heard * pop) + min(lamps * .4, .5);
    fd = mix(nlM(.8 * d) * (.75 + .2 * field + .5 * uHits) * (1.0 + nlUp(.35, .0, abs(q.x + .15)) * .4), fd, land);
    fd = mix(fd, nlM(.0) * .95, sat(air * (.62 + .2 * wx)));
    float shade = nlUp(.6, .9, nlS((cg + vec2(.35, .1)) * vec2(1.7, 2.2)));
    L = mix(L, fd * (1.0 - .4 * shade), nlDay);
    vapour = mix(vapour, (.35 + nlM(.0) * .9) * (.55 + .7 * cn), nlDay);
  }
  L = mix(L, vapour * (.6 + .8 * cn) * (1.0 + 4.5 * fog * max(cn - .4, .0)), cover);
  return L;
}
vec3 nlWindow(vec2 p) {
  float bank = 4.0 * uCue * (1.0 - uCue), high = uOwn[5], wx = uOwn[3], place = uOwn[4];
  vec2 q = rot(-.075 - .05 * bank - .012 * sin(uTime * .05)) * p;
  float hy = .25 - .06 * high - .02 * bank;
  float d = hy - (.06 + .05 * max(high, .0)) * q.x * q.x - q.y;
  // the sky: the last green of the day along the edge of the world
  float up = max(-d, .0);
  vec3 sky = vec3(.0035, .006, .017) + nlDu * vec3(.035, .03, .09);
  float side = .55 + .45 * nlUp(-.9, .5, q.x);
  sky += nlLit * side * (nlB1 * 4.0 * exp(-up * 60.0) + nlB1 * .5 * exp(-up * 18.0) + nlB2 * .6 * exp(-up * 7.0));
  if (nlNor > .0) sky += nlNorth(q.x, up);
  vec3 edge = sky;
  sky += nlStars(q, max(nlNi, -wx)) * nlUp(.05, .2, up);
  // a far bank of cloud, where the lightning is
  float cx = q.x + .0008 * uTime;
  float top = -.016 + .07 * min(wx, .0) + .085 * nlUp(.35, -.35, q.x) * (.15 + noise(vec2(cx * 4.0, 1.0))) + .034 * noise(vec2(cx * 15.0, 4.0));
  float lump = noise(vec2(cx * 22.0, up * 40.0)) * .6 + noise(vec2(cx * 55.0, up * 90.0 + 3.0)) * .4;
  float bankA = nlUp(.0, .012, top - up) * (.62 + .36 * lump);
  vec3 cloudC = vec3(.007, .012, .02) + nlDu * vec3(.04, .025, .05) + nlLit * nlB1 * .35 * (1.0 - nlUp(.0, .02, top - up)) + .1 * nlLit * nlB2;
  vec2 bq = (q - vec2(-.36, .0)) * vec2(.8, .0) + vec2(.0, up - .045) * 1.5;
  cloudC += vec3(.75, .8, 1.0) * uHits * (.8 + 1.2 * uEnergy) * exp(-dot(bq, bq) * 55.0) * (.25 + 2.0 * lump * lump);
  sky = mix(sky, cloudC, bankA) + vec3(.1, .12, .17) * uHits * exp(-dot(bq, bq) * 22.0);
  if (nlDay > .0) sky = mix(sky, mix(nlM(up), nlM(.0) * (.75 + .4 * lump) + .9 * uHits * exp(-dot(bq, bq) * 22.0), bankA * .7), nlDay);
  float ridge = sat(place) * (.02 + .06 * noise(vec2(q.x * 4.0, 2.0)));
  sky = mix(sky, vec3(.006, .009, .016) + nlLit * nlB2 * .2 + nlDay * nlM(.3) * .75, nlUp(-nlPx, nlPx, ridge - up) * sat(place * 8.0));
  vec3 col = mix(sky, nlLand(q, max(d, .0006), edge), nlUp(.0, .004 + nlPx, d));
  // the wing
  vec2 wp = p - vec2(.42, -.215);
  vec2 wd = normalize(vec2(.86, -.42)), wn = vec2(-wd.y, wd.x);
  float s = dot(wp, wd), t = dot(wp, wn);
  float lead = t - .012 - .03 * s, trail = -.012 - .34 * s - t;
  float a = nlUp(nlPx, -nlPx, max(max(lead, trail), -s - .02 * sin(t * 60.0)));
  vec3 wc = vec3(.006, .009, .014) + (nlLit * nlB1 * .25 + nlDu * vec3(.03)) * exp(lead * 30.0) + nlNi * vec3(.02, .025, .035) * .5;
  wc *= 1.0 - .5 * exp(-abs(t + .004 + .2 * s) / (.6 * nlPx + .0006));
  wc *= 1.0 - .35 * exp(-abs(fract(s * 5.0 + t) - .5) / (8.0 * nlPx)) * nlUp(.0, .02, -lead - .03 * s);
  wc += (nlLit * nlB1 * .9 + nlNi * vec3(.06, .07, .09)) * exp(-abs(lead + .002) / (.0016 + nlPx));
  wc += nlDay * (.35 + .5 * exp(lead * 20.0)) * nlM(.25);
  col = mix(col, wc, a);
  float ld = length(wp - vec2(-.004, .006));
  vec3 red = mix(vec3(1.0, .12, .06), uKind[4], .15);
  col += red * (.7 + .8 * uCue + .3 * uMic) * (4.0 * exp(-ld * ld / .000016) + .2 * exp(-ld / .012) + .02 * exp(-ld / .06));
  return col;
}
// The close boat, about 1 long, its waterline at y 0. x: how much of it covers, y: how lit.
vec2 nlHull(vec2 q, float px) {
  float bow = sat(q.x * 2.1 + .15), deck = .07 + .1 * bow * bow * bow + .03 * sat(-q.x * 2.0 - .3);
  float hull = max(max(q.y - deck, max(.83 * (q.x - .36 - .62 * q.y + 1.2 * q.y * q.y), -q.x - .47 - .15 * q.y)), -q.y - .02);
  float house = max(abs(q.x + .2 + .1 * (q.y - .1)) - .1 - .03 * nlUp(.15, .145, q.y), abs(q.y - .13) - .085);
  house = min(house, max(abs(q.x + .205) - .065, abs(q.y - .225) - .03));
  float roof = max(abs(q.x + .2) - .125, abs(q.y - .214) - .005);
  float masts = max(abs(q.x - .37 + .06 * q.y) - .0045, abs(q.y - .24) - .16);
  masts = min(masts, max(abs(q.x + .4) - .005, abs(q.y - .25) - .2));
  masts = min(masts, max(abs(fract(q.x * 6.0 + .1) - .5) / 6.0 - .003, max(abs(q.y - .17) - .12, abs(q.x - .02) - .34)));
  float box = min(house, roof), d = min(min(hull, box), masts);
  float lit = .012 + .7 * exp(-max(deck - q.y, .0) * 90.0) + .09 * exp(-max(deck - q.y, .0) * 22.0);
  lit += .07 * exp(-abs(deck - .032 - q.y) * 400.0);
  if (box < hull) {
    float win = max(abs(abs(q.x + .2) - .04) - .02, abs(q.y - .165) - .014);
    lit = roof < house ? .9 : mix(.02 + .2 * exp(-max(.21 - q.y, .0) * 30.0), 1.75, nlUp(px, -px, win));
  }
  if (masts < min(hull, box)) lit = .16;
  return vec2(nlUp(px, -px, d), lit);
}
// The close boat's two rows of lamps: the cores in x, the glow in y.
vec2 nlRowLamps(vec2 q, float px) {
  vec2 o = vec2(.0);
  float sag = .022 * q.x * q.x / .13, r = .0042 + .8 * px;
  for (int j = 0; j < 2; j++) {
    float y0 = .272 + .04 * float(j), gap = .05 - .003 * float(j), off = .013 * float(j);
    float n = clamp(round((q.x - off) / gap), -7.0, 7.0);
    for (int k = -1; k <= 1; k++) {
      float i = n + float(k); vec2 e = q - vec2(off + gap * i, y0); e.y -= sag;
      float m = dot(e, e), f = (j == 0 ? 1.0 : .7) * step(abs(i), 7.5);
      o += f * vec2(exp(-m / (r * r)), .00014 / (m + .00014) * exp(-m * 90.0));
    }
  }
  return o;
}
vec3 nlBoats(vec2 p) {
  float roll = 4.0 * uCue * (1.0 - uCue), high = uOwn[5], wx = uOwn[3], place = uOwn[4];
  vec2 q = rot(-.012 - .03 * roll - .006 * sin(uTime * .23)) * p;
  float hy = .02 + .15 * high + .004 * sin(uTime * .31);
  float up = q.y - hy, d = -up, H = exp2(.8 * high), thick = exp2(1.2 * wx);
  vec3 green = mix(vec3(.6, 1.0, .8), uOwn[1] < .0 ? vec3(1.0, .56, .2) : vec3(.4, .5, 1.0), abs(uOwn[1]));
  // low cloud, seen from beneath
  float cn = .0, cloud = .0, rip = .0, glint = .0, floe = .0, ih = .0;
  if (up > -.001) {
    float zc = .6 / (up + .07);
    vec2 cg = vec2(q.x * zc, zc + uTravel * .006);
    cn = nlS(cg * vec2(1.0, 1.5));
    cloud = nlUp(.08, .36, cn + .45 * min(wx, .0) + .2 * max(wx, .0)) * nlUp(.0, .1, up);
  } else {
    float zw = .2 * H / max(d, .0015); vec2 wg = vec2(q.x * zw, zw);
    rip = .6 * (noise(wg * vec2(5.0, 11.0) + vec2(.0, uTime * .16)) - .5) + .75 * nlUp(14.0, 2.0, zw) * (noise(wg * vec2(28.0, 52.0) + vec2(3.0, -uTime * .23)) - .5)
        + .8 * nlUp(4.0, .6, zw) * (noise(wg * vec2(85.0, 125.0) + vec2(uTime * .2, 9.0)) - .5)
        + .8 * nlUp(1.4, .4, zw) * (noise(wg * vec2(190.0, 330.0) + vec2(5.0, uTime * .3)) - .5);
    rip *= exp2(-1.6 * max(-place, .0));
    glint = .3 + 1.6 * nlUp(-.15, .5, rip);
    if (place > .0) {
      vec2 iq = wg * vec2(9.0, 10.0), ic = floor(iq - .5); float m1 = 9.0;
      for (int k = 0; k < 4; k++) {
        vec2 c = ic + vec2(float(k & 1), float(k >> 1)); vec3 h = nlHash(c + 50.0); float e = length(c + .3 + .4 * h.xy - iq) * (.85 + .35 * noise(iq * 2.6 + h.z * 9.0)) - .06 * h.z;
        if (e < m1) { m1 = e; ih = h.z; }
      }
      floe = nlUp(.4, .35, m1) * nlUp(1.0 - place, 1.3 - place, ih + .25) * nlUp(9.0, 2.0, zw);
      ih = .6 + .7 * ih + .6 * nlUp(.24, .36, m1);
    }
  }
  vec3 air = vec3(.0), under = vec3(.0), pool = vec3(.0), cores = vec3(.0);
  float many = .72 + .65 * uOwn[2], col0 = round(q.x / .115);
  for (int k = 0; k < 6; k++) {
    // two boats to a column of sea, one far out and one nearer
    float nr = float(k / 3), ci = col0 + float(k - 3 * (k / 3)) - 1.0;
    vec3 h = nlHash(vec2(ci + 70.0, 3.0 + nr)); float h4 = fract(h.x * 13.0 + h.z * 7.0);
    float x = (ci + .7 * (h.x - .5)) * .115, dx = q.x - x, ax = abs(dx), on = nlUp(many, many - .1, h4);
    float dy = mix(.0025 + .016 * h.y, .018 + .075 * h.y * h.y, nr) * H, sc = .1 + dy * 10.0 / H, yb = up + dy - .0015 * sin(uTime * .4 + ci) * sc, yl = yb - .006 - .02 * sc;
    int kd = int(h.z * 3.99);
    float live = .3 + .4 * fract(h.z * 7.0) + (.35 + 1.0 * uEnergy) * (piece(vec2(sat(.5 + x / 2.2), .06 + .4 * nr + .45 * h.y)).a * 1.3 + 1.6 * nlV(kd) + .7 * band(sat(.5 + x / 2.0)) * (.4 + .6 * uLevel));
    vec3 c = green * mix(vec3(1.0), nlInk(kd) * 1.8, .55 * sat(nlV(kd) * 1.4)) * live * on * nlUp(.13, .08, ax);
    if (yb > -.02 - .2 * max(max(wx, high), .0)) {
      // the lamps, the pillar above them, and what they light of the cloud
      float cr = .001 + .65 * nlPx + .0011 * sc, e = max(ax - .008 * sc, .0), m = e * e + yl * yl, hi = max(yl, .0);
      cores += c * (6.0 * exp(-m / (cr * cr)) + .2 * exp(-sqrt(m) / (.004 + .012 * sc)));
      float pw = (.002 + .005 * sc + .05 * hi) * (1.4 - .8 * uTone), tall = (.025 + .07 * h.x * h.x + .05 * sc) * (.6 + .4 * thick) * (.7 + .6 * uSpace);
      air += c * thick * (exp(-dx * dx / (pw * pw) - hi / tall) * nlUp(-.002, .01, yl) * (.05 + .3 * h.x) + .03 * exp(-(dx * dx + yl * yl) / (.0008 + .006 * sc)));
      float pr = .05 + .02 * sc, py = (up - .06 - dy * 2.5) * 2.0 + .22 * (cn - .5), px = dx + .16 * (cn - .5);
      under += c * exp(-(px * px + py * py) / (pr * pr)) * .12 * nlUp(.12, .02, ax);
    }
    if (up < .02) {
      // its pool, and its road of light on the water
      float down = max(-yb, .0), rw = .003 + .004 * sc + .05 * down, dr = dx + rip * (.006 + .1 * down);
      vec2 pl = vec2(dx / (.014 + .05 * sc), yb / (.003 + .012 * sc));
      pool += c * (.14 * nlE(pl) * (.4 + .6 * glint) + .8 * glint * exp(-dr * dr / (rw * rw) - down / (.025 + .08 * sc)) * nlUp(.001, -.001, yb) / (1.0 + 14.0 * down));
    }
  }
  // the sky between the cloud and the sea
  vec3 col = vec3(.003, .0055, .011) + nlDu * vec3(.03, .03, .08) + nlLit * nlB1 * exp(-abs(up) * 24.0);
  if (up > -.01) {
    col += nlStars(q, .6) * nlUp(.04, .12, up) * sat(nlNi - 2.0 * wx);
    vec3 cloudC = (vec3(.006, .009, .013) + nlDu * vec3(.06, .045, .08) + nlNi * vec3(.012, .016, .024)) * (.3 + 1.2 * cn) + nlLit * nlB1 * .12 * exp(-up * 7.0);
    // the lightning in it, far off at the right
    vec2 bq = (vec2(q.x - .46, up - .15) + .03 * (cn - .5)) * vec2(.75, 1.5);
    cloudC += vec3(.7, .8, 1.0) * uHits * (.7 + uEnergy) * exp(-dot(bq, bq) * 70.0) * (.15 + 1.6 * cn * cn);
    cloudC += (under + green * (.007 + .02 * uLevel) * exp(-up * 4.0)) * (6.0 * cn * cn * cn + .2) * (1.0 + .4 * uMic);
    if (nlDay > .0) { col = mix(col, nlM(up), nlDay); cloudC = mix(cloudC, nlM(.0) * (.55 + .75 * cn) + under, nlDay); }
    if (nlNor > .0) { vec3 nor = nlNorth(q.x, up); col += nor; cloudC += .25 * nor; }
    col = mix(col, cloudC, cloud * (1.0 - .45 * nlDay));
  }
  // the sea
  vec3 sea = vec3(.0014, .003, .0045) * (1.0 + rip) + nlDu * vec3(.03, .026, .05) * (.6 + rip) + nlLit * nlB1 * .5 * exp(-d * 10.0) * (.6 + rip) + nlNi * vec3(.006, .009, .013) * (.5 + glint * exp(-q.x * q.x * 8.0) * 2.0);
  sea += nlDay * nlM(d * 1.4) * (.72 + .5 * rip + .5 * uHits * nlUp(.0, .3, rip)) * mix(vec3(.75, .85, .9), vec3(1.0), exp(-d * 5.0));
  if (nlNor > .0) sea += (nlNorth(q.x + .02 * rip, d * .8 + .03 * rip) + nlNor * .05 * nlInk(0)) * (.3 + .55 * glint);
  sea = mix(sea, vec3(.5, .55, .6) * nlDay * ih + (vec3(.035, .05, .06) + nlNor * .07 * nlInk(0)) * ih + nlDu * vec3(.05, .04, .06), floe) + pool * (1.0 - .5 * floe) + green * .4 * uKeys * nlUp(.2, .6, rip) * exp(-d * 4.0);
  float isSea = nlUp(-nlPx, nlPx, d);
  col = mix(col, sea, isSea);
  // the close boat, at the left
  float room = nlUp(.3, .8, .5 * uRes.x / uRes.y), S = mix(.48, .6, room) * exp2(-.4 * high);
  vec2 bc = vec2(mix(-.03, -.45, room), hy - .19 * H + .003 * sin(uTime * .55)), bl = rot(.01 * sin(uTime * .43)) * (q - bc) / S;
  float bp = nlPx / S, own = .6 + .5 * uEnergy * (piece(vec2(.28, .5)).a + uLevel) + .5 * uMic + .4 * uCue;
  float afl = 1.0 - max(-uOwn[7], .0);
  vec3 bcol = mix(green, vec3(1.0), .3) * own * (1.0 - .6 * nlDay) * afl;
  float fade = nlUp(1.3, .5, abs(bl.x)) * afl;
  // its light on the sea; the boat, and its image below
  float wet = step(bl.y, .0), down = max(-bl.y, .0);
  vec2 w1 = vec2(bl.x * 1.35, (bl.y + .08) * 3.6);
  col += isSea * fade * bcol * (mix(vec3(.4, .95, .85), vec3(.8), abs(uOwn[1])) * .13 * nlE(w1) * (.25 + glint + 2.0 * floe * ih));
  vec2 m = mix(bl, vec2(bl.x + rip * (.03 + .3 * down), down * .92 + rip * .5 * (.03 + down)), wet);
  vec2 hu = nlHull(m, bp * (1.0 + wet) + .03 * wet), lamps = nlRowLamps(bl, bp);
  float there = hu.x * nlUp(.62, .58, abs(bl.x)) * fade;
  vec3 paint = (vec3(.5, .52, .5) * hu.y * bcol + vec3(.0015, .0025, .003)) * (.45 + .55 * exp(-bl.x * bl.x * 5.0));
  paint += nlDay * vec3(.06, .055, .06) + nlDay * .25 * hu.y * nlM(.1);
  if (uOwn[7] > .0) {
    float sy = (m.y - .13 - .16 * m.x) / .6, bs = 2.0 * abs(fract(sy * 6.0) - .5), bx = max(.2 * sy - .2 - m.x, m.x - .29 + .06 * sy * sy + .05 * bs * (2.0 - bs));
    float sl = nlUp(bp, -bp, max(bx, max(-sy, sy - 1.0 - .7 * m.x) * .6)) * uOwn[7], bat = exp(-bs / (.06 + 8.0 * bp));
    vec3 cloth = (nlInk(1) * 1.6 + .03) * (1.0 - .55 * bat) * (.8 + .2 * noise(m * vec2(14.0, 60.0))) * (bcol * (.9 * exp(-abs(sy - .2) * 3.0) + .1) + nlDay * (.5 + .5 * sy) + nlNi * .12 + .02);
    paint = mix(paint, cloth, sl * (1.0 - there)); there = max(there, sl * fade * (1.0 - .45 * wet));
  }
  paint = mix(paint, vec3(.9, .42, .13) * own, nlUp(1.0, 1.7, hu.y));
  col = mix(col, mix(paint, col * .3, wet), there);
  col *= 1.0 - .5 * (1.0 - wet) * nlUp(.0016 + bp, .0, abs(bl.y - .281 - .17 * bl.x * bl.x)) * step(abs(bl.x), .37) * afl;
  vec2 hz = (bl - vec2(.0, .29)) * vec2(1.0, 1.6);
  col += bcol * mix(lamps.x * 5.0 + lamps.y * .9, 1.5 * exp(-11.0 * (down - .34) * (down - .34)) * nlUp(.48, .3, abs(m.x)) * nlUp(-.05, .5, rip + .06 * max(-place, .0)) * (1.0 - .9 * floe) * (1.0 - .6 * there), wet);
  col += bcol * (1.0 - .85 * there) * thick * (.07 * exp(-dot(hz, hz) * 6.0) + .06 * exp(-bl.x * bl.x * 9.0 - max(bl.y - .3, .0) * 2.2) * nlUp(.1, .45, bl.y));
  if (afl < 1.0) {
    float x0 = mix(.0, -.4, room), rx = q.x - x0, y0 = q.y - hy + .05 * H, top = .15 * exp(-rx * rx * 30.0) + .05 * exp(-(rx - .22) * (rx - .22) * 160.0) + (.05 * noise(vec2(rx * 26.0, 2.0)) + .02 * noise(vec2(rx * 90.0, 5.0))) * exp(-rx * rx * 14.0) - .03;
    vec2 t = vec2(rx, y0 - .13), l = vec2(rx, y0 - .335);
    float rock = nlUp(-nlPx, nlPx, top - abs(y0) - .01), tow = nlUp(nlPx, -nlPx, max(abs(t.x) - .019 + .04 * t.y, abs(t.y - .1) - .1)), low = step(y0, .0);
    vec3 rc = (vec3(.004, .006, .008) + (nlDu * .03 + nlNi * .02 + nlDay * .25) * (.3 + noise(rot(.6) * q * vec2(50.0, 160.0)))) * mix(1.0, .5, low);
    col = mix(col, rc, rock * (1.0 - afl) * (1.0 - .35 * low));
    col = mix(col, (vec3(.05) + nlDay * .7) * (.6 + .5 * nlUp(-.015, .015, -t.x)) * mix(vec3(1.0), nlInk(4) * .6, nlUp(.45, .55, abs(fract(t.y * 12.0) - .5) * 2.0)), tow * (1.0 - afl));
    float c = cos(uTime * .11), beam = exp(-l.y * l.y / pow(.004 + .07 * abs(l.x), 2.0) - abs(l.x) * 1.1 / max(abs(c), .06)), m2 = dot(l, l), lit = (own - .2 + .7 * uLevel + .5 * uPad) * (1.0 + .5 * uHits) * (1.0 - afl);
    col += mix(green, vec3(1.0, .85, .6), .5) * lit * (1.0 - .6 * nlDay) * (beam * (.1 + .16 * thick) + 5.0 * exp(-m2 / .00008) + .35 * exp(-sqrt(m2) / .03) + isSea * .5 * glint * exp(-pow((rx + .1 * rip) / (.02 + .1 * d), 2.0) - d * 5.0) * (1.0 - rock));
    there = max(there * (1.0 - wet), rock * (1.0 - low) * (1.0 - afl)); wet = .0;
  }
  return col + (air + cores) * (1.0 - there * (1.0 - wet));
}
vec3 render(vec2 p) {
  nlPx = 1.0 / uRes.y;
  nlDu = sat(-uOwn[0]); nlNi = sat(uOwn[0]);
  nlLit = (.5 + .06 * sin(uTime * .07) + .8 * uDrone) * (1.0 - .88 * nlNi) * (1.0 - .35 * uVar);
  nlB1 = mix(vec3(.075, .16, .1) * (1.0 - .45 * uVar), vec3(.4, .16, .14), nlDu);
  nlB2 = mix(vec3(.012, .045, .06), vec3(.14, .08, .2), nlDu);
  return screenOf(uVar < .5 ? nlWindow(p) : nlBoats(p));
}
