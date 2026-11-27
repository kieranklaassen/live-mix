// name: Moss walker
// a: In the moss
// b: Ash grey
// what: A fat soft eight-legged beast in a wrinkled coat walks slowly through wet moss, the sun behind leaves like sails, drops that hold the wood upside down, red stalks with spore lanterns above; or the same beast in matt silver with bright rims on a field of pierced shells and broken blades, another rolled up asleep behind it.
// follows: Travel carries its step, the bands how high each leg lifts; in silence it stops and curls a little. Drone is its girth, pad the light, texture leaf edges or dust, phrase lifts the snout. The piece glows in leaf cells or in shells. A hit drops a drop and sends out a ring, a cue fills the drops with sun or draws a beam down, keys light lanterns or shells.
// own: 0 moonlit at -1 (b: only the rims), pale mist at 1 (b: pale ground); 1 rust autumn at -1 (b: copper), frost at 1 (b: rose beast, blue shells); 2 lean and smooth at -1, broad plates at 1; 3 seen from far off at -1, close by its head at 1; 4 a bare place at -1, a wet thicket at 1 (b: a fuller heap); 5 drawn up with its legs in at -1, reared up at 1; 6 a herd of small ones in file at -1, turned to face us at 1 (b: seen from above); 7 a wood of toadstools at -1, open ground before a huge disc at 1 (b: crystals of salt for the shells at -1, ribbed wheels before a moon at 1)
#define MWH max(-uOwn[6], 0.)
#define MWF max(uOwn[6], 0.)
#define MWT max(-uOwn[7], 0.)
#define MWD max(uOwn[7], 0.)
#define MW_IF(c) for (int go = (c) ? 1 : 0; go > 0; go--)
float mwPx, mwBase, mwBow, mwWalk, mwDoze, mwArm, mwThin, mwRear, mwTun, mwId, mwGirth, mwLen, mwSlow;
float mwNight, mwMist, mwRust, mwFrost, mwLots, mwBare;
vec4 mwHx, mwHy, mwHz, mwAx, mwAy, mwAz, mwBx, mwBy, mwBz; // the hips, the feet of the far side, of the near side
vec3 mwSn, mwSunC, mwPlain, mwM; float mwGrain; // the light, a plain leaf, the piece here, a grain
float mwSq(float x) { return x * x; }
float mwSpine(float a) {
  float up = sat((.45 - a) * .77);
  return mwBase - mwBow * a * a + mwRear * .75 * up * up;
}
vec4 mwFoot(vec4 cs, vec4 sn, vec4 bands, vec4 hung, out vec4 fy, out vec4 fz) {
  vec4 lift = max(sn, 0.);
  vec4 x = mwHx + vec4(-.05, -.05, -.05, .2) + .15 * mwWalk * cs;
  fy = -.58 + .2 * mwWalk * (.5 + .7 * bands) * lift * lift;
  x = mix(x, mwHx - .16 - .04 * cs, hung);
  fy = mix(mix(fy, mwHy - .3, hung), mwHy - .15, .85 * mwTun);
  fz = mix(mix(vec4(.42, .44, .44, .26), mwHz + .2, hung), mwHz + .1, .85 * mwTun);
  return mix(x, mwHx, .85 * mwTun);
}
void mwBegin() {
  mwDoze = .6 * (1. - smoothstep(.02, .3, uLevel));
  mwLen = 1. - .1 * mwDoze - .24 * mwTun + .12 * mwThin;
  mwBase = .03 - .1 * mwDoze - .2 * mwTun; mwBow = .05 + .24 * mwDoze + .15 * mwTun;
  mwGirth = (1. + .014 * sin(TAU * uTime / 7.) * (1. + uDrone) + .07 * uDrone) * (1. - .24 * mwThin) * (1. + .08 * mwTun + .04 * mwDoze);
  mwSlow = mix(.95, .75, max(mwRear, .6 * mwArm));
  mwHx = vec4(-.58, -.15, .28, .68) * mwLen;
  mwHy = vec4(mwSpine(mwHx.x), mwSpine(mwHx.y), mwSpine(mwHx.z), mwSpine(mwHx.w)) - .2 * mwGirth;
  mwHz = vec4(.23, .23, .23, .15) * mwGirth;
  vec4 ph = TAU * (fract(uTravel * .2 + .37 * mwId) - vec4(0., .23, .46, .69)), hung = mwRear * (1.0 - smoothstep(-.4, .1, mwHx)), cs = cos(ph), sn = sin(ph);
  mwAx = mwFoot(cs, sn, vec4(uBands[1], uBands[4], uBands[7], uBands[10]), hung, mwAy, mwAz);
  mwBx = mwFoot(-cs, -sn, vec4(uBands[2], uBands[5], uBands[8], uBands[12]), hung, mwBy, mwBz);
  mwSn = vec3(-.84 * mwLen - .29 + .12 * mwTun, mwSpine(-.84 * mwLen) + .18 * uPhrase - .05 * mwDoze + .015 * sin(uTime * .37) - .04, 0.);
}
float mwFold; // how deep in a fold the last place was
float mwMap(vec3 q) {
  float a = clamp(q.x, -.8 * mwLen, .64 * mwLen), sy = mwSpine(a), s = a / mwLen;
  vec3 d = q - vec3(a, sy, 0.);
  float ld = length(d), f = (q.x / mwLen + .15 * d.y * (1. - d.y)) * 2.35 + .28, t = fract(f), w = 4. * t * (1. - t);
  float g = fract(3. * f + abs(fract(d.y * 1.6 + d.z * .8 + .5 * f) - .5)), v = 4. * g * (1. - g);
  float head = smoothstep(-.94, -.75, q.x / mwLen), big = mwSq(mwSq(1. - min(w * 1.3, 1.))) * head, small = mwSq(1. - min(v * 1.7, 1.)) * sat(.85 - 1.8 * d.y) * w;
  float R = (.26 + .2 * smoothstep(-.95, -.15, s) - .07 * smoothstep(.25, .7, s)) * mwGirth;
  R += .035 * w - (.05 - .025 * mwThin) * big - .018 * (1. - mwThin) * small + mwArm * .2 * (t - .5) * sat(.6 + 2.2 * d.y) * head * (1. - big);
  mwFold = big + .35 * small;
  float b = smin(ld - R, length(q - mwSn) - .1 - .06 * sat(q.x - mwSn.x), .17);
  b = max(b, .042 - length(q - mwSn + vec3(.105, 0., 0.)));
  MW_IF(q.y < sy + .1) {
    float z = abs(q.z), near = step(0., q.z);
    vec4 fx = mix(mwAx, mwBx, near), fy = mix(mwAy, mwBy, near), fz = mix(mwAz, mwBz, near);
    vec4 ax = q.x - mwHx, ay = q.y - mwHy, az = z - mwHz, bx = fx - mwHx, by = fy - mwHy, bz = fz - mwHz;
    vec4 h = sat((ax * bx + ay * by + az * bz) / (bx * bx + by * by + bz * bz + 1e-3));
    ax -= bx * h; ay -= by * h; az -= bz * h;
    vec4 l = sqrt(ax * ax + ay * ay + az * az) - .19 + (.085 + .022 * abs(fract(h * 4.5) - .5)) * h + .045 * mwThin;
    float leg = min(min(l.x, l.y), min(l.z, l.w));
    b = smin(b, leg, .1);
    vec4 on = vec4(equal(l, vec4(leg)));
    float foot = dot(on, fy) / max(dot(on, vec4(1.)), 1.);
    b = min(b, .3);
    MW_IF(q.y < foot + .25) {
    vec3 k = vec3(q.x - dot(on, fx), q.y - dot(on, fy), z - dot(on, fz)) / max(dot(on, vec4(1.)), 1.), cb = vec3(.03, -.12, .06);
    k.x = abs(abs(k.x + .02) - .035);
    k -= vec3(0., -.06, .02);
    float u = sat(dot(k, cb) / .0189);
    b = min(b, length(k - cb * u) - .018 * (1. - .6 * u));
    }
  }
  return b;
}
float mwCov, mwAo, mwBig; vec3 mwQ, mwN, mwR, mwU, mwB, mwV;
void mwLook(vec2 q, float th, float ps, float pix) {
  mwR = vec3(cos(ps), 0., sin(ps)); mwB = vec3(-sin(ps) * cos(th), sin(th), cos(ps) * cos(th)); mwU = cross(mwB, mwR);
  vec3 ro = mwB * 6., rd = normalize(mwR * q.x + mwU * q.y - ro), g = vec3(0.);
  float best = 9., mid = 6. + sin(ps) * clamp(q.x / cos(ps), -.95, .95), deep = .62 / cos(ps), t = mid - deep, bt = t, e = max(.007, 1.1 * pix);
  int stage = 0;
  mwV = -rd; mwCov = 0.; mwQ = ro; mwN = -rd; mwAo = 1.; mwBig = 0.;
  for (int i = 0; i < 24; i++) {
    vec3 o = vec3(equal(ivec3(stage), ivec3(1, 2, 3)));
    float d = mwMap(stage == 0 ? ro + rd * t : stage < 4 ? mwQ + e * o : mwQ + mwN * .12);
    if (stage == 0) {
      if (d < best) { best = d; bt = t; }
      t += d * mwSlow;
      if (d < .5 * pix || t > mid + deep || i > 18) {
        mwCov = 1. - smoothstep(.55 * pix, pix, best);
        mwQ = ro + rd * bt;
        if (mwCov <= 0.) break;
        stage = 1;
      }
    } else if (stage < 4) {
      g += o * (d - best); mwBig += .33 * sat(mwFold);
      if (stage == 3) mwN = normalize(g + 1e-6);
      stage++;
    } else { mwAo = sat(.4 + 5. * d); break; }
  }
}
const vec2 mwSun = vec2(.46, .3);
float mwGlow(vec2 p) { return exp(-length(p - mwSun) * 1.5); }
float mwRing(vec2 q) { return uHits * exp(-mwSq((length(q * vec2(1., 1.6)) - .9 * (1. - uHits)) / .22)); }
vec3 mwThinC(float g, float h) {
  vec3 c = mix(vec3(.03, .3, .04), vec3(.6, .74, .03), sat(.1 + .95 * g + .5 * (h - .5)));
  c = mix(c, mix(vec3(.3, .05, .02), vec3(.95, .4, .04), sat(g + .5 * h)), mwRust);
  return mix(c, mix(vec3(.16, .3, .38), vec3(.75, .85, .82), sat(g + .4 * (h - .3))), .85 * mwFrost);
}
vec4 mwLeaf(vec2 p, vec2 base, vec2 tip, float bow, float W, float soft) {
  vec2 ab = tip - base; float L = length(ab); ab /= L;
  p -= base;
  float u = dot(p, ab) / L, v = dot(p, vec2(-ab.y, ab.x)) - bow * L * 4. * u * (1. - u), t = sat(u);
  float w = W * (.5 + 2.8 * t) * (1. - t) * (1. - .3 * t) * (1. + .12 * uTexture * abs(fract(u * L * 55.) - .5) * step(soft, .005));
  return vec4(sat(.5 + .5 * (w - abs(v)) / soft) * step(u, 1.), t, v / max(w, 1e-3), w);
}
vec3 mwLeafCol(vec2 p, float g, vec4 l, float seed, float L, float fine) {
  float v = l.z * l.w / .0115, row = floor(v), u = l.y * L / .025 + .5 * row, h = hash21(vec2(floor(u), row) + seed);
  vec2 f = abs(vec2(fract(u), fract(v)) - .5);
  float wall = smoothstep(.3, .46, max(f.y, f.x + f.y * .3)) * fine, rib = (1. - l.y) / (1. + mwSq(mwSq(l.z * l.w / .004)));
  float rim = smoothstep(.8, 1., abs(l.z)), side = mix(.5, 1.15, smoothstep(-.06, .06, l.z)), curl = .6 + .55 * sqrt(max(1. - l.z * l.z, 0.));
  vec3 thin = mwThinC(g, fract(seed * .39));
  vec3 c = thin * mwSunC * (.015 + (1.1 + .8 * uPad) * g) * side * curl * (.12 + .88 * l.y) * (1. + .4 * wall) * (.82 + .36 * h * fine) * (1. - .65 * rib);
  c += thin * rim * (.04 + .4 * g) * mwSunC * (.8 + .8 * uTexture) + vec3(.6, .75, .8) * mwFrost * (rim * .35 + .12 * h * wall) * (.3 + .7 * mwSunC);
  return c + mwM * mwM * (1. - wall) * (.25 + .75 * h * h) * (1.0 - smoothstep(.1, .55, length(f))) * fine * (.4 + 1.2 * uEnergy) * 1.3;
}
vec3 mwDropCol(vec2 q, vec2 c) {
  float z = sqrt(max(1. - dot(q, q), 0.));
  vec2 to = normalize(mwSun - c), s = q / (.3 + .7 * z);
  float stems = smoothstep(.2, .8, .5 + .5 * sin(s.x * 5. + 1.5 * sin(s.y * 1.5) + c.x * 30.));
  vec3 col = mix(vec3(.004, .028, .012), mwPlain * .75, sat(.4 - .75 * dot(q, to)) * (.25 + .75 * stems));
  col += vec3(1., .85, .5) * mwSunC * exp(-dot(q + to * .5, q + to * .5) * 8.) * (.7 + .6 * uPad + 2.5 * uCue);
  col *= .15 + .85 * smoothstep(0., .45, z);
  return col + vec3(1., .95, .85) * (1.0 - smoothstep(.06, .17, length((q - to * .55) * vec2(1., 1.4)))) * (.4 + mwSunC);
}
const vec4 mwA[7] = vec4[7](vec4(-.75, -.75, -.36, .38), vec4(.38, -.8, .24, .46), vec4(1.12, -.7, .66, .26), vec4(.74, -.8, .86, .42), vec4(-.1, -.78, -.42, -.17), vec4(.36, -.8, .06, -.17), vec4(.66, -.75, .5, -.12));
const vec2 mwW[7] = vec2[7](vec2(.06, .22), vec2(.07, .22), vec2(.08, .17), vec2(-.08, .2), vec2(.13, .17), vec2(-.11, .17), vec2(-.1, .17));
vec3 mwBack(vec2 p, float g) {
  float d = length((p - mwSun) * vec2(.8, 1.));
  float k = .2 + 1.6 * smoothstep(.2, .85, mwGrain);
  vec3 c = mix(vec3(.002, .016, .014), mix(vec3(.1, .32, .015), vec3(.4, .16, .03), mwRust), exp(-d * 1.9)) * k * (.3 + .7 * mwSunC) * smoothstep(-1.2, .5, p.x + .6 * p.y);
  c += vec3(1., .85, .2) * (2.2 * exp(-d * d * 14.) + .3 * exp(-d * 2.8) * k) * (.75 + .5 * uPad) * mwSunC;
  c *= mix(vec3(1.), vec3(.65, .85, 1.1), mwFrost);
  c = mix(c, vec3(.5, .62, .52) * (.55 + .5 * g) * mix(vec3(1.), vec3(1.1, .95, .85), mwRust), mwMist * .85);
  if (uOwn[7] > 0.) {
    vec2 q = p - vec2(.06, .05); float e = length(q), n = fbm(rot(.6) * q * 6. + 4.);
    vec3 sky = mix(uKind[1] * uKind[1] * .9, uKind[0] * uKind[0] * .4, smoothstep(-.35, .5, p.y));
    vec2 gi = floor(p * 26.); float h = hash21(gi);
    sky += uKind[3] * step(.8, h) * (1.0 - smoothstep(.04, .09, length(p * 26. - gi - .5 - .6 * (vec2(h * 7. - 5.6, fract(h * 91.)) - .5)))) * (.3 + .7 * fract(h * 41.)) * smoothstep(-.2, .2, p.y);
    vec3 disc = mix(uKind[2] * uKind[2] * 1.2, vec3(1.), .08) * (.6 + .5 * n) * (.75 + .35 * uPad) * (1. + .5 * q.y);
    sky = mix(sky + uKind[2] * .35 * exp(-3. * max(e - .38, 0.)), disc, (1.0 - smoothstep(.377, .383, e)));
    sky += uKind[3] * uHits * .7 * exp(-mwSq((e - .38 - .3 * (1. - uHits)) / .035)) + disc * .5 * uHits * step(e, .38) * exp(-mwSq((e - .36 * (1. - uHits)) / .1));
    c = mix(c, sky * (.35 + .65 * mwSunC), MWD);
  }
  float tx = p.x / .19 + uTravel * .006;
  for (int k = 0; k < 2; k++) {
    float i = floor(tx - .5) + float(k), h = hash11(mod(i, 997.) + 3.1), y = (p.y + .6) / (.55 + .5 * h), x = tx - i - .5 - (h - .5) * 1.2 * y * y;
    float w = .66 * (1. - y) * (.6 + y);
    vec3 lc = mwPlain * (.6 + .8 * h) * (.012 + .9 * g * g) * (.7 + .4 * smoothstep(-.1, .1, x));
    c = mix(c, mix(lc, c, .55 * mwMist), .8 * (1. - MWD) * smoothstep(-.14, .14, w - abs(x)) * (1.0 - smoothstep(.9, 1., y)));
  }
  return c;
}
const vec4 mwCap[7] = vec4[7](vec4(-.62, .02, .1, .75), vec4(.22, .2, .09, .8), vec4(.62, .1, .12, .7), vec4(-.3, .16, .13, .5), vec4(.42, .33, .2, .25), vec4(-.64, .26, .25, 0.), vec4(.8, .2, .2, 0.));
vec3 mwStools(vec2 p, vec3 col, float g) {
  for (int i = 0; i < 7; i++) {
    vec4 m = mwCap[i]; float f = float(i), R = m.z * MWT, sd = i % 2 == 0 ? 1. : -1.;
    vec2 c = m.xy + vec2(.008 * sin(uTime * .23 + f), 0.), q = (p - c) / R;
    if (abs(q.x) > 1.6) continue;
    vec3 tint = kindColour(1. + fract(f * .618) * 1.6), far = col;
    float u = sat((c.y - p.y) / (c.y + .55)), sx = (p.x - c.x - sd * .1 * u * u) / (R * (.13 + .12 * u * u)), px = 1.5 * mwPx / R + .06 * m.w;
    float lamp = .25 + .9 * uTexture + 1.2 * uKeys;
    col += tint * lamp * .12 * MWT * exp(-3. * dot(q, q)) * (1. - m.w);
    vec3 stem = mix(tint, vec3(.9, .85, .7), .6) * (.04 + .75 * g + .3 * lamp * exp(-u * 6.)) * (.35 + .5 * sat(1. - sx * sx) + .35 * sx) * mix(.8, 1.15, noise(vec2(sx * 4. + f, p.y * 12.)));
    col = mix(col, stem, smoothstep(1. + 4. * px, 1. - 4. * px, abs(sx)) * step(p.y, c.y));
    float e = length(vec2(q.x, (q.y + .02) * 4.2)), gill = abs(fract(q.x / (.25 + .75 * sqrt(max(1. - q.x * q.x, 0.))) * 9.) - .5);
    col = mix(col, tint * (.1 + .55 * lamp + .3 * g) * (.45 + gill), smoothstep(1. + px, 1. - px, e));
    vec2 k = vec2(q.x, (q.y + .12 * (1. - q.x * q.x)) / (.62 + .25 * fract(f * .37))); float r = length(k), z = sqrt(max(1. - r * r, 0.));
    vec2 sp = vec2(k.x / (.35 + .65 * z), k.y) * 3.2 + f; vec2 si = floor(sp); vec2 sh = hash22(si + f);
    float spot = (1.0 - smoothstep(.26, .32, length(sp - si - .35 - .3 * sh))) * step(.35, sh.x) * z;
    float lit = sat(dot(vec3(k, z), normalize(vec3(mwSun - c, .35))) * .6 + .4);
    vec3 cap = mix(tint * .85, vec3(.95, .9, .8), .8 * spot) * (.05 + (.25 + 1.2 * g) * lit * lit) * mix(vec3(1.), mwSunC, .7) + tint * (.5 + g) * (1. - z) * (1. - z) * .5 * lit;
    col = mix(col, cap, smoothstep(1. + px, 1. - px, r) * smoothstep(-px, px, q.y + .1 * (1. - q.x * q.x)));
    col = mix(col, far, m.w * .55);
  }
  return col;
}
vec3 mwFlesh() {
  vec3 sun = normalize(mwR * .6 + mwU * .75 - mwB * .3), K = normalize(-mwR * .5 + mwU * .6 + mwB * .7);
  vec2 sk = vec2(mwQ.x, mwQ.y - .6 * mwQ.z), ci = floor(sk * 15.);
  float h = hash21(ci), grain = mwGrain, cell = (1.0 - smoothstep(.2, .34, length(sk * 15. - ci - .5 - .3 * (vec2(h, fract(h * 57.)) - .5)))) * h;
  vec3 n = normalize(mwN + .22 * (grain - .5) * vec3(1., .3, .3));
  float nv = sat(dot(n, mwV)), wrap = sat((dot(n, sun) + .4) / 1.4), key = sat(.5 + .5 * dot(n, K)), low = smoothstep(-.75, -.15, mwQ.y);
  vec3 skin = mix(mix(vec3(.62, .29, .13), vec3(.7, .42, .22), grain), vec3(.75, .2, .07), .7 * mwArm);
  if (uOwn[7] != 0.) skin = mix(skin, uKind[4] * (.45 + .5 * grain), .75 * abs(uOwn[7]));
  vec3 c = skin * (vec3(1., .8, .45) * 2.3 * wrap * wrap * mwSunC + vec3(.09, .17, .13) * key * key * (.35 + .65 * mwSunC) * (1. + 2. * mwMist));
  c *= mwAo * (1. - .6 * mwBig) * (.55 + .45 * sat(.6 + n.y));
  c += skin * vec3(1., .28, .07) * (.3 * mwBig * wrap + .16 * (1. - low)) * mwSunC;
  c += vec3(1., .82, .45) * mwSq(1. - nv) * sat(dot(n, sun) + .5) * 1.6 * mwSunC;
  c += vec3(.1, .25, .03) * sat(-n.y + .2) * .35 * (1. - MWD) * mwSunC;
  c += vec3(.9, .95, .85) * mwSq(mwSq(1. / (1. + 30. * (1. - dot(n, normalize(K + mwV)))))) * (.15 + .4 * uTone + .4 * uMic) * (1. - mwBig) * (.3 + .7 * mwSunC);
  c += cell * (1. - mwBig) * nv * (.05 * skin * mwSunC + mwM * mwM * .5 * uEnergy);
  return c * mix(.3, 1., low);
}
vec3 mwMoss(vec2 p, vec2 scr) {
  float g = mwGlow(scr), wind = sin(uTime * .31);
  vec2 sway = vec2((.006 + .022 * mwWalk) * sin(TAU * fract(uTravel * .2)), (.006 + .012 * uLow) * wind);
  mwPlain = mwThinC(g, .5) * mwSunC;
  vec3 col = vec3(0.);
  MW_IF(mwCov < 1.) col = mwBack(scr, g);
  if (uOwn[7] < 0. && mwCov < 1.) col = mwStools(p, col, g);
  for (int i = 0; i < 3; i++) {
    float x0 = i == 0 ? -.24 : i == 1 ? .34 : .46, top = i == 0 ? .36 : i == 1 ? .41 : .26;
    float e0 = p.x - x0 - .1 * (p.y - top) * (1. + p.y - top) - .012 * (p.y + .5) * wind, lamp = uKeys * 1.6 + .9 * mwNight, has = 1. - max(mwBare, MWT);
    col = mix(col, vec3(.42, .04, .012) * (.1 + g) * mwSunC * (1. + .8 * clamp(e0 / .002, -1., 1.)), (1.0 - smoothstep(.0035, .0055, abs(e0))) * step(p.y, top) * has);
    vec2 cp = rot(.8) * vec2(e0 - .028, p.y - top + .004);
    float e = length(cp / vec2(.055, .026 * (1. - 7. * clamp(cp.x, -.05, .06)))), lid = smoothstep(.024, .03, cp.x);
    vec3 cap = mix(vec3(.16, .05, .008), vec3(1., .5, .05), sat(.5 + cp.y * 18.)) * mix(vec3(1.), vec3(.4, .15, .3), lid) * (.1 + 1.3 * g) * mwSunC;
    cap += vec3(1., .55, .16) * lamp * (1. - lid) * sat(1. - .6 * e * e);
    col += vec3(1., .5, .12) * .3 * lamp / (1. + e * e * e) * has;
    col = mix(col, cap, (1.0 - smoothstep(.94, 1.06, e)) * has);
  }
  vec4 L = vec4(0.), F = vec4(0.); float id = 0., fid = 0., len = 1., flen = 1.;
  for (int i = 0; i < 7; i++) {
    bool fore = i > 3;
    MW_IF((fore ? p.y < 0. && uOwn[7] < .99 : mwCov < 1. && abs(uOwn[7]) < .99)) {
    vec2 base = mwA[i].xy, tip = mwA[i].zw + vec2((i % 2 == 0 ? 1. : -1.) * (fore ? sway.x : sway.y), 0.);
    vec4 l = mwLeaf(p, base, tip, mwW[i].x, mwW[i].y * (1. + .4 * mwLots - (i % 3 == 0 ? 0. : .93 * mwBare)) * (1. - (fore ? MWD : max(MWD, MWT))), i < 2 ? .003 + .006 * uSpace : 1.2 * mwPx);
    if (l.x > .01 && fore) { F = l; fid = float(i); flen = length(tip - base); }
    if (l.x > .01 && !fore) { L = l; id = float(i); len = length(tip - base); }
    }
  }
  bool fore = F.x > .02;
  vec3 lc = vec3(0.);
  MW_IF(max(L.x, F.x) > 0.) lc = mwLeafCol(p, g, fore ? F : L, fore ? fid : id, fore ? flen : len, fore || id > 1.5 ? 1. : .5);
  lc *= 1. + 1.6 * mwRing(p - vec2(.56, -.28));
  col = mix(col, (fore ? mwPlain * g * .4 : lc) + col * .2, L.x);
  MW_IF(mwCov > 0.) col = mix(col, mwFlesh(), mwCov);
  float bump = abs(fract(p.x * 2.3 + .15) - .5), tuft = abs(fract(p.x * 31. + 3. * bump) - .5), bed = -.395 + .11 * smoothstep(0., .36, p.x) + .1 * (.25 - bump * bump) + .025 * MWD - p.y;
  MW_IF(bed > -.02) {
    float n = noise(p * vec2(70., 45.)), under = sat(bed * 9.);
    vec3 bc = mix(mwPlain, (uKind[1] * .5 + .1) * mwSunC, MWD) * (.1 + .9 * g) * (1. - .85 * under) * (.35 + .9 * n) * (1. + .8 * tuft);
    col = mix(col, bc, smoothstep(-.006, .006, bed - .022 * (1. - tuft) * n));
  }
  if (fore) col = mix(col, lc * .9 + col * .12, F.x);
  vec4 dr = vec4(0., 0., 1., 9.); float spot = 0.;
  for (int i = 0; i < 5; i++) {
    vec3 d = i == 0 ? vec3(.56, -.28, .085) : i == 1 ? vec3(-.42, -.185, .03) : i == 2 ? vec3(.06, -.185, .026) : i == 3 ? vec3(.665, .235, .034) : vec3(.79, .4, .035);
    d.z *= 1. - mwBare + .7 * mwLots;
    if (uOwn[7] != 0. && i != 4) d.z *= 1. - max(MWD, i == 3 ? MWT : 0.);
    if (i == 3) d.xy += vec2(.008, -.12) * (.5 - .5 * cos(uTime * .06));
    if (i == 4) { float fall = 1. - uHits; d.y -= .8 * fall * fall; d.z *= smoothstep(0., .3, uHits); }
    float k = length(p - d.xy) / max(d.z, 1e-3);
    if (k < dr.w) dr = vec4(d, k);
    MW_IF(uCue > 0.) {
    vec2 off = (p - d.xy + d.z * vec2(.9, 1.1)) / (2. * d.z + 1e-3);
    spot += 1. / (1. + mwSq(1.5 * dot(off, off)));
    }
  }
  col += col * spot * uCue * vec3(3., 2.4, 1.2);
  MW_IF(dr.w < 1.) col = mix(col, mwDropCol((p - dr.xy) / max(dr.z, 1e-3), dr.xy), 1. - smoothstep(1. - 3. * mwPx / max(dr.z, 1e-3), 1., dr.w));
  vec4 l = mwLeaf(p, vec2(-1.22, -.8), vec2(-.62, .6), -.1, .22, .04);
  col = mix(col, vec3(.002, .009, .005) + mwPlain * .2 * smoothstep(.2, 1., -l.z), l.x * (1. - MWD));
  return screenOf(max(col * 1.3 - .004, 0.));
}
vec3 mwS1, mwS2, mwI1, mwI2;
void mwHeap(vec2 p) {
  mwS1 = mwS2 = vec3(0., 0., 1.); mwI1 = mwI2 = vec3(0.);
  for (int j = 0; j < 8; j++) {
    float row = float(j), f = row / 7., cw = mix(.05, .3, f * f), y = (p.y - mix(.15, -.45, f)) / cw, x = p.x / cw + 7.3 * row;
    MW_IF(abs(y) < .92 && (j > 5 || mwCov < 1.)) for (int k = 0; k < 2; k++) {
      float i = floor(x - .5) + float(k), h = hash21(vec2(i, row + .5)), h2 = fract(h * 57.3), r = .3 + .27 * h * h + .1 * mwLots;
      r *= smoothstep(0., .3, h2 * .97 + .3 - 1.25 * mwBare);
      vec2 q = vec2(x - i - .5 - .35 * (h2 - .5), y - .6 * (fract(h * 91.) - .5)) / max(r, 1e-3);
      float me = length(q);
      if (uOwn[7] < 0.) { vec2 o = abs(rot(3. * h) * q); me = mix(me, max(o.x * .866 + o.y * .5, o.y) * 1.08, MWT); }
      if (uOwn[7] > 0.) { vec2 o = rot(6. * h) * q; me = length(o * vec2(1., 1. + 1.1 * MWD * h2)); }
      float a = 1. - smoothstep(1. - 3. * mwPx / (cw * max(r, 1e-3)), 1., me);
      if (a > 0. && j < 6) { mwI1 = vec3(max(a, mwI1.x), f, h); mwS1 = vec3(q, r * cw); }
      if (a > 0. && j > 5) { mwI2 = vec3(max(a, mwI2.x), f, h); mwS2 = vec3(q, r * cw); }
    }
  }
}
vec3 mwOther(vec3 S, float seed) {
  vec2 q = S.xy; vec3 glow = mwM * max(mwM.r, max(mwM.g, mwM.b)) * (.4 + uEnergy) + vec3(1., .9, .7) * uKeys * .4 * step(.5, fract(seed * 31.7));
  float fine = smoothstep(.012, .035, S.z), low = .2 + .8 * smoothstep(-1., .5, q.y);
  if (uOwn[7] < 0.) {
    vec2 o = rot(3. * seed) * q; float an = atan(o.y, o.x + 1e-5) / TAU + 1. / 6., se = floor(an * 3.), am = (fract(an * 3.) - .5) * TAU / 3., r = length(o);
    vec2 k = r * vec2(cos(am), sin(am)); // the face: its far corner along x
    vec2 uv = vec2(k.x + k.y * .577, k.x - k.y * .577) / 1.07;
    float st = max(abs(uv.x - .5), abs(uv.y - .5)) * 2., step_ = fract(st * 4.), line = smoothstep(.75, 1., step_) * fine;
    float face = mod(se + 3., 3.); vec2 up = rot(-3. * seed) * vec2(cos(se / 3. * TAU), sin(se / 3. * TAU));
    float light = .16 + .3 * mwMist + .3 * sat(.5 + .9 * dot(up, vec2(-.5, .75))) + .35 * smoothstep(.9, 1., st) + .28 * line - .12 * (1. - st) * fine;
    return vec3(light * low) + glow * (1. - st) * fine;
  }
  vec2 o = rot(6. * seed) * q; o.y *= 1. + 1.1 * MWD * fract(seed * 57.3);
  float r = length(o), N = 9. + floor(9. * fract(seed * 31.7)), an = abs(fract(atan(o.y, o.x + 1e-5) / TAU * N) - .5), ring = abs(fract(r * 4.) - .5);
  float hole = smoothstep(.16, .26, .5 - an) * smoothstep(.08, .2, .5 - ring) * fine * step(r, .93) * step(.2, r);
  float light_ = .3 + .35 * sat(.5 + dot(q, vec2(-.5, .6))), light = light_ + .4 * smoothstep(.9, 1., r) - .75 * hole * (light_);
  return vec3(light * low) + glow * hole;
}
vec3 mwShell(vec3 S, float seed) {
  if (uOwn[7] != 0.) { vec3 ot = mwOther(S, seed); if (abs(uOwn[7]) > .3) return ot; }
  vec2 q = S.xy;
  float z = sqrt(1. - min(dot(q, q), 1.)), id = fract(seed * 31.7);
  vec3 n = vec3(q, z);
  vec3 way = normalize(vec3(6. * id - 1., .75, .8));
  float open = step(id, .3) * smoothstep(.57, .6, dot(n, way) + .1 * abs(fract(q.x * 2.3 + 2. * abs(fract(q.y * 1.7) - .5)) - .5) - .025);
  vec3 s = mix(n, vec3(q, -z), open), o = id > .6 ? s.yxz : s;
  o.xy = rot(.5) * o.xy; o.yz = rot(.8) * o.yz;
  float N = 7. + floor(6. * id), la = asin(clamp(o.y, -1., 1.)) / PI * N, lr = floor(la), cnt = max(floor(2. * N * (1. - 4. * mwSq((lr + .5) / N))), 3.);
  float lo = (atan(o.z, o.x + 1e-5) / TAU + .5) * cnt, hd = length(vec2(fract(lo), fract(la)) - .5);
  float hole = (1.0 - smoothstep(.28, .36, hd)), fine = smoothstep(.012, .035, S.z) * smoothstep(.05, .4, z);
  float light = .2 + .42 * sat(dot(n, vec3(-.5, .6, .6))) + .7 * mwSq(1. - z);
  light = mix(light, .05 + .2 * sat(dot(s, vec3(.5, -.6, -.6))), open);
  light *= 1. - .88 * hole * fine;
  light *= .12 + .88 * smoothstep(-1., .4, q.y);
  return vec3(light) + (mwM * max(mwM.r, max(mwM.g, mwM.b)) * (.4 + uEnergy) + vec3(1., .9, .7) * uKeys * .4 * step(.5, id)) * hole * fine;
}
float mwSem(float lit, float nv, float deep) {
  return (mix(mix(.07, .02, mwNight), .5, mwMist) + mix(.34, .05, mwNight) * lit + mix(.65 + .3 * uTone, -.45, mwMist) * mwSq(1. - nv)) * (1. - .65 * deep);
}
vec3 mwAsh(vec2 p, vec2 scr) {
  vec3 fog = vec3(mix(.01, .52, mwMist)), col = fog;
  vec3 tb = mix(mix(vec3(1.), vec3(1.2, .85, .55), mwRust), vec3(1.2, .78, .6), mwFrost), ts = mix(mix(vec3(.96, 1., 1.03), vec3(1.1, .72, .45), mwRust), vec3(.55, .95, 1.1), mwFrost);
  if (uOwn[7] != 0.) { tb = mix(tb, uKind[4] * 1.5, .85 * abs(uOwn[7])); ts = mix(ts, uKind[2] * 1.5, .85 * abs(uOwn[7])); fog = mix(fog, uKind[1] * (.06 + .8 * mwMist), .8 * abs(uOwn[7])); col = fog; }
  if (uOwn[7] > 0.) {
    vec2 q = p - vec2(-.3, .27); float e = length(q), n = fbm(rot(.6) * q * 8. + 4.);
    float big = mix(.16 + .3 * n, .62 + .3 * n, mwMist);
    col = mix(col + .09 * exp(-5. * max(e - .27, 0.)) * MWD, vec3(big) * ts * (1. + 1.2 * q.x * -1. + .4 * uPad), MWD * (1.0 - smoothstep(.267, .273, e)) * smoothstep(.15, .32, p.y));
  }
  float near = (1.0 - smoothstep(-.5, .22, p.y));
  col += (.05 + .1 * uTexture) * near * mwGrain * ts;
  mwHeap(p);
  bool fore = mwI2.x > 0.;
  vec3 sh = vec3(0.);
  MW_IF(max(mwI1.x, mwI2.x) > 0.) sh = mwShell(fore ? mwS2 : mwS1, fore ? mwI2.z : mwI1.z) * ts * (1. + 2.2 * mwRing(p + vec2(.1, .3)));
  float dep = smoothstep(-.1 - .1 * uSpace, .95, mwI1.y) * (.8 + .5 * uPad);
  col = mix(col, mix(fog, (fore ? vec3(.06) : sh) * .8, sat(dep)), mwI1.x);
  vec2 e = rot(-.25) * (p - vec2(.64, .06)) / (vec2(.125, .08) * (1. + .012 * sin(uTime * .6)));
  e.y *= 1. - .06 * cos(e.x * 9.);
  float ez = sqrt(max(1. - dot(e, e), 0.)), et = fract(e.x * 2.2 / sqrt(1. - .35 * min(e.y * e.y, 1.)) + .3), ew = 4. * et * (1. - et);
  col = mix(col, mix(fog, tb * mwSem(sat(dot(vec3(e.x + .5 * (et - .5), e.y, ez), vec3(-.55, .6, .5))), ez, mwSq(1. - min(ew * 1.6, 1.))) * smoothstep(-1., .1, e.y), .5), 1. - smoothstep(1. - 25. * mwPx, 1., dot(e, e)) * (1. - MWF));
  for (int i = 0; i < 3; i++) {
    vec4 ab = i == 0 ? vec4(-.62, -.22, -.8, .12) : i == 1 ? vec4(.8, -.2, .42, .03) : vec4(.36, -.62, .84, -.27);
    MW_IF(i == 2 && mwCov > 0.) {
      float g = mwSem(sat(dot(mwN, normalize(-mwR * .6 + mwU * .6 + mwB * .5))), sat(dot(mwN, mwV)), mwBig) * mwAo;
      g *= .86 + .28 * mwGrain;
      if (uOwn[4] < 0. || uOwn[6] > 0.) g *= 1. + 1.6 * mwRing(p + vec2(.1, .1));
      col = mix(col, tb * g * mix(.35, 1., smoothstep(-.7, -.2, mwQ.y)), mwCov);
    }
    vec2 dir = ab.zw - ab.xy; float L = length(dir); dir /= L;
    float u = dot(p - ab.xy, dir) / L, v = dot(p - ab.xy, vec2(-dir.y, dir.x)), w = (i < 2 ? .022 : .034) * (1. - .35 * u), x = v / max(w, 1e-3);
    float end = 1. - .06 * abs(fract(x * .7 + .3 * float(i)) - .5) * 2. - .05 * x, px = 1.2 * mwPx;
    float g = (i < 2 ? .2 : .34) * (.5 + .5 * x * x + .35 * abs(fract(u * L * 45.) - .5)) * (.5 + .5 * u) + .3 * (1.0 - smoothstep(0., .03, end - u)) + .14 * smoothstep(.75, 1., abs(x));
    col = mix(col, ts * mix(g, .4 + .6 * g, mwMist), smoothstep(-px, px, w - abs(v)) * smoothstep(-px, px, (end - u) * L) * step(0., u) * (1. - mwBare));
  }
  if (fore) col = mix(col, sh * .55, mwI2.x);
  col *= 1. + 1.8 * uCue * exp(-mwSq((scr.y - .72 * uCue + .55) / .1));
  return pow(sat(col), vec3(.72));
}
vec3 render(vec2 p) {
  mwNight = sat(-uOwn[0]); mwMist = sat(uOwn[0]); mwRust = sat(-uOwn[1]); mwFrost = sat(uOwn[1]);
  mwArm = sat(uOwn[2]); mwThin = sat(-uOwn[2]); mwBare = sat(-uOwn[4]); mwLots = sat(uOwn[4]); mwRear = sat(uOwn[5]); mwTun = sat(-uOwn[5]);
  mwSunC = mix(vec3(1.), vec3(.13, .28, .62), mwNight);
  mwWalk = smoothstep(.04, .4, uLevel);
  bool a = uVar < .5;
  float z = exp2(uOwn[3] > 0. ? .6 * uOwn[3] : .7 * uOwn[3]) * clamp(uRes.x / uRes.y / 1.3, .5, 1.);
  vec2 s = p / z + (z > 1. ? vec2(-.7, -.02) : vec2(0., -.48)) * (1. - 1. / z) + vec2(0., .1 * mwRear);
  mwPx = 1. / (uRes.y * z);
  float S = a ? 2.35 : 2.1;
  vec2 q = (s - (a ? vec2(-.02, -.035) : vec2(0., .01))) * S;
  mwCov = 0.;
  if (uOwn[6] < 0.) {
    float P = mix(9., 2.3, MWH), k = 1. + 1.1 * MWH;
    q.y = (q.y + .72) * k - .72; q.x *= k;
    mwId = floor(q.x / P + .5); q.x -= P * mwId;
    float small = 1. + MWH * (.2 + .5 * hash11(mwId + 4.));
    q *= small; q.y += .72 * (small - 1.); q.y += .16 * MWH * hash11(mwId + 9.);
    S *= k * small;
  }
  float over = .75 * mwRear * (1.0 - smoothstep(-.4, .6, q.x));
  MW_IF(length(vec2(max(abs(q.x + .08) - (a ? .75 : .45 + .3 * MWF), 0.), q.y < 0. ? q.y * (a ? .6 : .5) : max(q.y - over, 0.))) < .6 + .15 * mwArm + (a ? 0. : .25 * MWF)) {
    mwBegin();
    mwLook(q, (a ? .12 : .3) + (a ? .08 : .65) * MWF, (a ? .5 : .95) + (a ? .75 : -.75) * MWF, 1.5 * mwPx * S);
  }
  mwM = piece(vec2(.5 + s.x / 1.7, .5 - s.y)).rgb;
  mwGrain = noise(mwCov > .5 ? vec2(mwQ.x, mwQ.y - .6 * mwQ.z) * vec2(90., 65.) : a ? rot(.35) * p * vec2(3.4, 1.9) + vec2(uTravel * .004, 2.) : rot(.6) * vec2(s.x, s.y * 1.8) * 90.);
  vec3 c = vec3(0.);
  MW_IF(a) c = mwMoss(s, p);
  MW_IF(!a) c = mwAsh(s, p);
  return c;
}
