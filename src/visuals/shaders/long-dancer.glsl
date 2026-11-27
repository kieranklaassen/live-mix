// name: Long dancer
// a: Silk on poles
// b: Lamp spine
// what: From an upper window at dusk, a cloth body sixty paces long, hooped pale silk with faded bands, coils over and under itself along a street of lit doors, carried on poles by a file of people; or at street level in the dark the same body hung with thousands of small paper lamps, near ones soft discs, wet paving doubling them.
// follows: The piece lies along the body and glows where it sounds; each kind of sound has its own bands or lamps. Travel carries it on, drone widens the coils, phrase throws one high, bands lift it, pad lights it from within, texture stirs paper and smoke. A hit is a jolt passed pole to pole, a cue opens the coil, keys light single hoops or lamps.
// own: 0 a snowy morning at -1, night by the doors at 1 (blue evening, warm fog); 1 indigo cloth and moon-white lamps at -1, red cloth and lamps at 1; 2 few wide loops at -1, many small at 1; 3 thin as a rope at -1, a great bolster at 1; 4 looking down from the roofs at -1, low and near at 1 (a long lens, right under it); 5 dry and clear at -1, smoke and paper or a flooded street at 1; 6 carried by nobody, over a sea of cloud, or over a lake under a moon, at -1, pale full day on bare sand, or a white morning and the lamps paper flowers, at 1; 7 a fin of cloth along its back, or the lamps in rings, at -1, painted scales, or large lamps, at 1
// One line carried by many people: a spine that coils over and under itself along a street, told by one number f.
// The camera looks along z; the street runs along ldE, the opposite houses stand on the side of -ldN.
#define LD_SKY max(-uOwn[6], 0.)
#define LD_DAY max(uOwn[6], 0.)
#define LD_FIN max(-uOwn[7], 0.)
#define LD_SCALE max(uOwn[7], 0.)
vec3 ldEye, ldF, ldU;
vec2 ldE, ldN, ldO;
float ldFoc, ldPx, ldA, ldB, ldC, ldHigh, ldUp, ldPh, ldR, ldJolt, ldJoltAt, ldFlip, ldFrom, ldTo, ldFocus, ldAlong, ldRoot;
float ldS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }   // either way round
float ldBell(float x) { return exp(-x * x); }
float ldEdge(float e, float x) { return ldS(-e, e, x); }
float ldLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : sat(uHits); }
float ldU01(float f) { return sat((f - ldFrom) / (ldTo - ldFrom)); }
// The spine at f, in metres, from the sine and cosine of its coil and m of a slower wandering; its height is opposite where
// it meets itself. The last number is how far along that is; what is carried slides by ldAlong.
vec4 ldPoint(float f, float s, float c, float m) {
  float big = 1. + .14 * m;
  vec2 d = vec2(f + 1.6, f - ldJoltAt), lift = max(1. - d * d * vec2(.25, .8), .0);
  float y = ldHigh + ldUp * s + .5 * uEnergy * band(ldU01(f)) + dot(lift * lift, vec2(.8 * uPhrase, ldJolt));
  vec2 g = ldO + ldE * (ldC * f + ldB * big * s) + ldN * (ldA * big * c + .4 * m);
  return vec4(g.x, y, g.y, .5 * (ldB + ldRoot) * (f + ldPh) + s * (ldC + .5 * (ldB - ldRoot) * c) - ldAlong);
}
vec3 ldPro(vec3 P) {
  vec3 r = P - ldEye;
  float z = dot(r, ldF);
  return vec3(ldFoc * vec2(r.x, dot(r, ldU)) / max(z, .2), z);
}
float ldRod(vec2 q, vec2 a, vec2 b) { q -= a; b -= a; return length(q - b * sat(dot(q, b) / dot(b, b))); }
// A person with a pole: x across, y up, in metres.
float ldPerson(vec2 q, float walk, float aa) {
  float d = min(length(q - vec2(0, 1.58)) - .115, ldRod(q, vec2(.02, .78), vec2(.02, 1.28)) - .155);
  for (int k = 0; k < 2; k++) {
    float side = float(k) * 2. - 1.;
    d = min(d, ldRod(q, vec2(.06 * side, .8), vec2(.17 * side * walk, .05)) - .075);
    d = min(d, ldRod(q, vec2(.17 * side, 1.3), vec2(.02, 1.5 + .3 * float(k))) - .042);
  }
  return ldEdge(aa, -min(d, ldRod(q, vec2(.02, 1.1), vec2(.02, 6.)) - .028));
}
// What is found at a pixel: two passes of the body (f, depth), a person, shadow, glow.
vec2 ldHit1, ldHit2;
vec4 ldMan;   // cover, x, y, depth
float ldShade, ldVeil;
// Walks only the length of the spine that the sight line can come near.
void ldTrace(vec2 pix, vec3 ray) {
  ldHit1 = ldHit2 = vec2(0, 1e4);
  ldMan = vec4(0, 0, 0, 1e4);
  ldVeil = ldShade = .0;
  const float gap = 1.7, man = 4.1;
  float df = min(.8, 4. / (ldB + ldC));   // short enough that no length has two people
  float wide = 2.1 * ldR, top = ldHigh + ldUp + .5 * uEnergy + .8 * uPhrase + ldJolt + wide, reach = 1.14 * ldA + .4 + wide;
  float ry = abs(ray.y) < 1e-3 ? 1e-3 : ray.y, rw = dot(ray.xz, ldN), rt = dot(ray.xz, ldE);
  rw = abs(rw) < 1e-3 ? 1e-3 : rw;
  vec2 from = vec2(dot(ldEye.xz - ldO, ldE), dot(ldEye.xz - ldO, ldN)), run = vec2(0, 60.);
  if (ldFlip < .0) run.y = (top + ldEye.y) / abs(ry);
  else if (ry < .0) run = vec2(max((top - ldEye.y) / ry, .0), min(-ldEye.y / ry, 60.));
  else run.y = min(60., (top - ldEye.y) / ry);
  vec2 slab = (vec2(-reach, reach) - from.y) / rw, t = vec2(max(run.x, min(slab.x, slab.y)), min(run.y, max(slab.x, slab.y)));
  if (t.x > t.y) return;
  t = from.x + t * rt;
  float more = 1.14 * ldB + wide, f1 = min((max(t.x, t.y) + more) / ldC, ldTo), f = floor(max((min(t.x, t.y) - more) / ldC, ldFrom) / df) * df;
  vec2 ground = ldEye.xz + ray.xz * (ldEye.y / max(-ry, .02)), by = vec2(cos(df), sin(df)), slow = vec2(cos(df * .37), sin(df * .37));
  vec2 turn = vec2(cos(f + ldPh), sin(f + ldPh)), roam = vec2(cos(f * .37 + .7), sin(f * .37 + .7));
  vec3 flip = vec3(1., ldFlip, 1.);
  vec4 P0 = ldPoint(f, turn.y, turn.x, roam.y), w1 = vec4(0, 0, 1e4, 0), w2 = w1;
  vec3 S0 = ldPro(P0.xyz * flip), turned;
  vec4 D0 = vec4(0);
  float near = 1e4;
  for (int i = 0; i < 56; i++) {
    if (f > f1) break;
    turn = vec2(turn.x * by.x - turn.y * by.y, turn.x * by.y + turn.y * by.x);
    roam = vec2(roam.x * slow.x - roam.y * slow.y, roam.x * slow.y + roam.y * slow.x);
    vec4 P1 = ldPoint(f + df, turn.y, turn.x, roam.y), D = P1 - P0;
    vec3 S1 = ldPro(P1.xyz * flip);
    if (min(S0.z, S1.z) > .5) {
      vec2 ab = S1.xy - S0.xy, pa = pix - S0.xy;
      float h = sat(dot(pa, ab) / max(dot(ab, ab), 1e-7)), z = mix(S0.z, S1.z, h), r = ldR * 1.5 * ldFoc / z;
      // between two samples it bows
      turned = .5 * h * (1. - h) / z * (i > 0 ? D.xyz - D0.xyz : vec3(0)) * flip;
      vec2 off = pa - ab * h + ldFoc * vec2(turned.x, dot(turned, ldU));
      float d2 = dot(off, off) / (r * r), soft = max(1. - d2 * .5, .0);
      ldVeil += D.w / z * soft * soft;
      if (d2 < 1.) {
        vec2 hit = vec2(f + df * h, z);
        if (z < ldHit1.y) { if (hit.x - ldHit1.x > gap) ldHit2 = ldHit1; ldHit1 = hit; }
        else if (hit.x - ldHit1.x > gap && z < ldHit2.y) ldHit2 = hit;
      }
      vec2 ga = ground - P0.xz, go = ga - D.xz * sat(dot(ga, D.xz) / max(dot(D.xz, D.xz), 1e-6));
      if (uOwn[3] < 0. || LD_DAY > 0.) { float gh = sat(dot(ga, D.xz) / max(dot(D.xz, D.xz), 1e-6)); go += i > 0 ? .5 * gh * (1. - gh) * (D.xz - D0.xz) : vec2(0); }
      near = min(near, dot(go, go));
    }
    // whoever walks under this length of it: the two nearest
    float n = floor(P1.w / man);
    if (n > floor(P0.w / man)) {
      vec3 at = P0.xyz + D.xyz * ((n * man - P0.w) / D.w);
      float s = at.z / max(ray.z, .05);
      vec4 who = vec4(ray.x * s - at.x, ray.y * s + ldEye.y, s * ldFoc, n);
      if (who.z > 1. && who.z < w2.z && abs(who.x) < .36 && abs(who.y - .5 * at.y) < .5 * at.y) {
        if (who.z < w1.z) { w2 = w1; w1 = who; } else w2 = who;
      }
    }
    f += df; D0 = D; P0 = P1; S0 = S1;
  }
  ldShade = max(1. - near / (wide * wide), .0) * (1. - LD_SKY);
  if (LD_SKY > .5) w1.z = w2.z = 1e4;
  for (int i = 0; i < 2; i++) {
    vec4 who = i == 0 ? w1 : w2;
    if (who.z > 9e3 || ldMan.x > .9) break;
    float c = ldPerson(who.xy, sin(ldAlong * 2.6 + who.w * 2.4), 1.2 * ldPx * who.z / ldFoc);
    if (c > ldMan.x) ldMan = vec4(c, who.xyz) + vec4(0, .0, .0, .8 * ldR);
  }
}
// A hit brought onto the curve itself: how far along and across it, how slanted, which way its skin looks.
struct LdSkin { float f, arc, v, z, off, slant; vec3 n, t, at; };
LdSkin ldSkin(vec2 hit, vec2 pix) {
  LdSkin k;
  vec3 flip = vec3(1., ldFlip, 1.), S, V = vec3(0);
  vec4 P = vec4(0);
  vec2 T = vec2(1., .0);
  k.f = hit.x;
  for (int i = 0; i < 2; i++) {
    float q = k.f + ldPh, s = sin(q), c = cos(q), m = .37 * k.f + .7, big = 1. + .14 * sin(m), n = cos(m);
    P = ldPoint(k.f, s, c, sin(m));
    vec2 g = ldE * (ldC + ldB * (big * c + .052 * n * s)) + ldN * (.052 * ldA * n * c - ldA * big * s + .148 * n);
    V = vec3(g.x, ldUp * c, g.y);
    S = ldPro(P.xyz * flip);
    vec3 d = V * flip;
    T = (ldFoc * vec2(d.x, dot(d, ldU)) - S.xy * dot(d, ldF)) / max(S.z, .2);
    if (i == 1) break;
    k.f = clamp(k.f + dot(pix - S.xy, T) / (dot(T, T) + .015 * dot(V, V) * pow(ldFoc / max(S.z, .2), 2.) + 1e-6), hit.x - .5, hit.x + .5);
  }
  float tl = max(length(T), 1e-4), scale = ldFoc / max(S.z, .2), r = ldR * scale;
  vec2 way = T / tl, side = vec2(-way.y, way.x), off = pix - S.xy;
  k.z = S.z;
  k.v = dot(off, side) / r;
  k.off = length(off) / r;
  k.t = V / max(length(V), 1e-4);
  k.slant = tl / (max(length(V), 1e-4) * scale);
  k.arc = P.w + dot(off, way) / (scale * max(k.slant, .45));
  k.at = P.xyz;
  k.n = normalize(vec3(side.x, .0, .0) * k.v + ldU * side.y * k.v - ldF * (sqrt(max(1. - k.v * k.v, .0)) + .02));
  return k;
}
// What sounds here: the piece lies along the spine.
vec3 ldSound(float f) {
  float u = ldU01(f);
  return .6 * (piece(vec2(u, .2)).rgb + piece(vec2(u, .5)).rgb + piece(vec2(u, .8)).rgb);
}
// The setts under the pixel: where, which stone and how far from its middle, joint, tone, wear; and the smoke in the air.
vec2 ldG;
vec4 ldStone = vec4(0);
float ldJoint = 0., ldTone = .5, ldWorn = .5, ldFade = 0., ldSmoke;
void ldStreet(vec2 p, vec3 ray) {
  float tt = min(ldEye.y / max(-ray.y, .002), 80.);
  ldG = ldEye.xz + ray.xz * tt;
  if (ray.y < 0. || uVar < .5) {
  vec2 b = vec2(dot(ldG, ldE) / .6, dot(ldG, ldN) / .37);
  float row = floor(b.y);
  b.x += .5 * mod(row, 2.) + .25 * hash11(row);
  ldStone = vec4(floor(b), fract(b) - .5);
  ldFade = ldS(.5, .06, ldPx * tt / max(-ray.y, .002));
  ldJoint = max(ldS(.39, .48, abs(ldStone.z)), ldS(.35, .47, abs(ldStone.w))) * ldFade;
  ldTone = mix(.5, hash21(ldStone.xy), ldFade);
  ldWorn = noise(ldG * 1.4);
  }
  vec2 q = rot(uVar < .5 ? -.45 : .1) * p;
  ldSmoke = noise(q * vec2(1.2, 3.2) + uTime * vec2(.021, -.023)) * .6 + .4 * noise(q * vec2(3.3, 7.5) + uTime * vec2(.033, -.04) + 1.2 * sin(q.x * 3.));
}
// Lays the two passes of the body over what is behind, and a person before, between or behind them.
vec3 ldLay(vec3 col, vec3 man, float there, vec4 pass[2]) {
  if (ldMan.w >= ldHit2.y) col = mix(col, man, there);
  col = col * (1. - pass[1].a) + pass[1].rgb;
  if (ldMan.w >= ldHit1.y && ldMan.w < ldHit2.y) col = mix(col, man, there);
  col = col * (1. - pass[0].a) + pass[0].rgb;
  return ldMan.w < ldHit1.y ? mix(col, man, there) : col;
}
// ---- a: dusk, from an upper window
const float ldD = 4.6, ldWallAt = -12.6;
const vec3 ldWarm = vec3(1.55, .6, .16);
float ldDoorOn(float k) { return .3 + .7 * ldS(.15, .6, hash11(mod(k, 37.) + 3.)); }
// The light of the doors: t along the street, w out from the wall.
float ldDoors(float t, float w) {
  float s = .8 + .4 * max(w, .0), k = floor(t / ldD - .5);
  float sum = ldDoorOn(k) * ldBell((t - (k + .5) * ldD) / s) + ldDoorOn(k + 1.) * ldBell((t - (k + 1.5) * ldD) / s);
  return sum / (1. + .1 * w * w) * ldS(-.2, .5, w);
}
// The houses; soft is how blurred they are seen.
vec3 ldWall(float t, float y, float soft, vec3 dusk, float lamps) {
  float k = floor(t / ldD), x = (fract(t / ldD) - .5) * ldD, on = ldDoorOn(k) * lamps, h = hash11(mod(k, 37.) + 11.);
  float bars = 1. - .7 * ldS(.06 + soft, .03, abs(fract(x * 1.6 + .5) - .5) / 1.6);
  vec3 c = mix(vec3(.16), vec3(.7, .64, .55), LD_DAY) * (.8 + .2 * sin(t * 31.) * step(soft, .2)) * dusk + vec3(.05, .02, .006) * on * ldBell(x / 2.) * ldS(3., 1., y);
  c = c * (1. - .6 * ldS(.3, .0, abs(y - 2.75))) + dusk * .3 * ldS(.12, .0, abs(y - 3.02));
  // a door, and the split curtain over its upper third
  float open = ldEdge(soft, min(.95 - abs(x), 2.3 - y));
  float hang = ldEdge(soft + .03, y - 1.52 + .05 * sin(x * 5. + h * 9.)) * ldS(.02, .05, abs(abs(x) - .32));
  vec3 warm = ldWarm * (.55 + .9 * ldS(2.4, .2, y)) * bars * on;
  return mix(c, mix(warm, mix(vec3(.3, .05, .03), vec3(.04, .09, .2), step(.5, h)) * (on + dusk), .85 * hang), open);
}
// One pass of the cloth body, and its cover.
vec4 ldCloth(LdSkin k, vec3 dusk, float lamps) {
  const float hoop = .4;
  float cell = k.arc / hoop, hid = floor(cell + .5), fr = cell - hid;
  vec3 sound = ldSound(k.f);
  float loud = max(sound.r, max(sound.g, sound.b)), fine = ldS(.5, .12, ldPx * k.z / ldFoc / hoop / max(k.slant, .2));
  float sag = .5 - .5 * cos(TAU * fr), ring = ldBell(fr * 11.) * fine;
  float wide = (1. + .14 * sat(loud) + .03 * sin(uTime * .5 + k.f)) * (1. - .1 * fine * sag);
  if (LD_FIN > 0.) wide *= 1. + .46 * LD_FIN * sat(k.n.y * 1.7 - .25) * (.3 + .7 * abs(2. * fract(cell * .5) - 1.));
  float aa = ldPx / (ldR * ldFoc / k.z) * 1.2, cover = ldEdge(aa, wide - k.off), v = clamp(k.v / wide, -1., 1.), up2 = 1. - v * v;
  // it hangs in, and wrinkles
  float wr = noise(vec2(cell * 1.7, v * 3. + hid * 3.7)) - .5;
  vec3 n = normalize(k.n + k.t * (.75 * sin(TAU * fr) + .9 * wr * sag) * fine);
  // bands, one for each kind of sound, and a ribbon down the back
  float bx = fract(cell / 9.) * 9., blue = sat(-uOwn[1]), red = sat(uOwn[1]);
  int kind = int(mod(floor(cell / 9.), 5.));
  float dyed = ldEdge(.06, 1.5 - abs(bx - 6.)) + .8 * ldEdge(.06, .2 - abs(bx - 8.3));
  vec3 cloth = mix(vec3(.66, .58, .45), vec3(.8, .75, .64), sat(.5 + wr)), dye = .1 + .8 * uKind[kind];
  cloth = mix(mix(cloth, vec3(.045, .085, .22), blue), vec3(.5, .06, .035), red);
  cloth = mix(cloth, dye * dye * (.75 + .35 * (blue + red)), dyed * (.6 + .35 * ldLv(kind)));
  if (LD_SCALE > 0.) {
    vec2 sq = vec2(cell * 1.1, asin(v) * 1.6);
    sq.y += .5 * mod(floor(sq.x), 2.);
    vec2 sf = fract(sq) - vec2(0., .5), si = floor(sq);
    float own_ = ldS(.62, .52, length(sf * vec2(.62, 1.05))), hs = hash21(vec2(mod(si.x, 97.), si.y + 20.));
    if (own_ < .5) hs = hash21(vec2(mod(si.x + 1., 97.), floor(sq.y + .5 - mod(si.x, 2.)) + 20.));
    int ks = int(hs * 4.99);
    vec3 paint = .06 + .9 * uKind[ks];
    paint = paint * paint * (.8 + .6 * ldLv(ks)) * (.55 + .5 * fract(hs * 7.)) + .12 * ldS(.1, .5, length(sf * vec2(.62, 1.05))) * own_;
    paint *= 1. - .55 * ldBell((length(sf * vec2(.62, 1.05)) - .57) * 14.);
    cloth = mix(cloth, mix(.1 + .3 * uKind[0], paint, fine), LD_SCALE);
  }
  if (LD_FIN > 0.) { vec3 fin = .1 + .85 * uKind[3]; cloth = mix(cloth, fin * fin, LD_FIN * ldS(.86, .98, k.off)); }
  float back = dot(k.n.xz, normalize(vec2(k.t.z, -k.t.x) + 1e-4));
  vec3 ribbon = mix(mix(vec3(.34, .07, .05), vec3(.8, .78, .72), blue), vec3(.75, .5, .12), red);
  cloth = mix(cloth, ribbon, .85 * ldEdge(aa * 1.5, .15 - abs(back)) * ldS(0., .2, k.n.y));
  float lit = ldDoors(dot(k.at.xz, ldE), dot(k.at.xz, ldN) - ldWallAt) * lamps;
  vec3 toDoor = normalize(vec3(-ldN.x, -.2, -ldN.y)), toEye = normalize(ldEye - k.at);
  float dd = dot(n, toDoor);
  vec3 light = dusk * (.28 + 1.75 * ldS(-.3, 1., n.y)) + ldWarm * (lit * (2.4 * max(dd, .0) + .3 * sat(.6 + dd)) + lamps * .07);
  vec3 c = cloth * light * (1. - .22 * ring - .18 * sag * fine);
  // a sheen
  c += dusk * .5 * pow(sat(dot(n, normalize(toEye + vec3(0, 1., .25)))), 14.) + ldWarm * .45 * lit * pow(sat(dot(n, normalize(toEye + toDoor))), mix(6., 18., uTone));
  c += cloth * vec3(1., .6, .28) * (.02 + .2 * uPad + .2 * uMic) * (.25 + .75 * up2) * (1. - .5 * ring);
  c += cloth * (vec3(.55, .36, .2) * sat(loud) + .45 * sound * sound) * (.12 + .5 * uEnergy) * (.2 + .8 * up2);
  c += (cloth + .1) * vec3(1., .72, .42) * (.9 * uHits * ldBell((k.f - ldJoltAt) * .7) + .4 * uCue * ldBell((k.f + 1.) * .3));
  c += vec3(1., .85, .6) * ring * uKeys * .8 * ldS(.6, .9, hash11(mod(hid, 53.)));
  return vec4(c, 1.) * cover;
}
vec3 ldDusk(vec2 p, vec3 ray) {
  float night = sat(uOwn[0]), snow = sat(-uOwn[0]), dry = sat(-uOwn[5]), thick = sat(uOwn[5]);
  vec3 dusk = vec3(.075, .135, .29) * (1. - .75 * night) + vec3(.36, .37, .38) * snow + vec3(.84, .66, .43) * LD_DAY + vec3(.16, .12, .13) * LD_SKY * (1. - night);
  float lamps = (.9 + .35 * uLevel + .25 * uCue) * (1. + .5 * night - .5 * snow) * (1. - .85 * LD_DAY) * (1. - LD_SKY);
  float tg = ray.y < -.01 ? -ldEye.y / ray.y : 1e3, rn = dot(ray.xz, ldN);
  float tw = rn < -.01 ? (ldWallAt - dot(ldEye.xz, ldN)) / rn : 1e3, tt = min(min(tg, tw), 60.), foot = ldPx * tt, far = .4 + .35 * uSpace;
  vec3 G = ldEye + ray * tt, haze = dusk * .42 + ldWarm * .03;
  vec2 g = G.xz;
  float st = dot(g, ldE), sw = dot(g, ldN) - ldWallAt, door = ldDoors(st, sw);
  // the houses, or what the wet stones see of them
  float tr = sw / max(-rn, .05), bump = (ldWorn - .5) * .7 + (ldTone - .5) * .3, onWall = tw < tg ? 1. : .0;
  vec2 seen = onWall > .5 ? vec2(st, G.y) : vec2(st + dot(ray.xz, ldE) * tr + bump * .7, bump - ray.y * tr);
  vec3 col = ldWall(seen.x, seen.y, mix(.35, .02 + foot, onWall), dusk, lamps);
  if (onWall < .5) {
    float under = 1. - .85 * ldShade * ldShade, wet = ldS(.25, .65, ldWorn) * (1. - dry);
    vec3 stone = vec3(.17, .16, .155) * (.6 + .7 * ldTone) * (1. - .6 * ldJoint) * (1.1 - .4 * wet) * (1. + .6 * dry);
    if (LD_DAY > 0.) { stone = mix(stone, vec3(.74, .6, .43) * (.8 + .2 * ldWorn + .12 * noise(g * vec2(9., 5.))), .94 * LD_DAY); wet *= 1. - LD_DAY; }
    stone = mix(stone, vec3(.8, .82, .86) * (.85 + .15 * ldWorn), snow);
    float fres = .05 + .5 * pow(sat(1. + ray.y / length(ray)), 2.5);
    col = fres * wet * (1. - ldJoint) * (1. - snow) * under * (col * 2.2 + dusk * .5 * ldS(3., 6., seen.y));
    col += stone * (dusk * under + ldWarm * lamps * 1.3 * door * (1. - .6 * ldShade * ldShade));
    vec2 pg = g / .42, pid = floor(pg), ph = hash22(pid + 7.), pq = rot(ph.x * 40.) * (pg - pid - .5 - (ph - .5) * .6);
    float have = ldS(0., .15, .3 + .3 * uTexture + .5 * uOwn[5] + .4 * (ldWorn - .5) - fract(ph.y * 13.7)), aa = foot / .42 + .01;
    col = mix(col, vec3(.62, .05, .035) * (dusk * 1.3 + ldWarm * door) * under, ldEdge(aa, .12 - max(abs(pq.x), abs(pq.y) + .05)) * have * (1. - LD_DAY));
  }
  if (LD_SKY > 0.) {
    float h = -ray.y / length(ray), tc = 24. / max(h, .03);
    vec2 cg = (ldEye.xz + ray.xz * tc) * .05 + vec2(uTime * .006, uTravel * .01);
    float n = fbm(cg), n2 = fbm(cg + vec2(.22, .12)) - n, o = ldS(.02, .3, h);
    vec3 lit = dusk * 1.9 + (1. - night) * vec3(.55, .33, .08), sea = mix(dusk * .5, lit, sat(ldS(.2, .8, n) * .75 - 2.4 * n2 + .12));
    float jf = mix(-2.5, 4., 1. - uHits); // a hit runs on over the cloud, under the body
    vec2 jp = p - ldPro(ldPoint(jf, sin(jf + ldPh), cos(jf + ldPh), sin(.37 * jf + .7)).xyz).xy;
    sea += (.5 * uKind[4] + vec3(.3, .2, .1)) * uHits * (.25 + n) * exp(-dot(jp, jp) * 9.) * .7;
    sea = mix(lit * .8, sea + .3 * ldSound(p.x * 3.) * ldS(.4, .7, n), o);
    col = mix(col, mix(sea, dusk * .9 + lit * .75 * exp(-sat(-h) * 9.), ldEdge(.006, -h)), LD_SKY);
  }
  // lanterns beside the doors
  float kk = floor((st - 1.5) / ldD);
  vec2 lg = ldE * ((kk + .5) * ldD + 1.5) + ldN * (ldWallAt + .5);
  vec3 L = ldPro(vec3(lg.x, 2.3, lg.y));
  vec2 lq = (p - L.xy) * L.z / ldFoc;
  float d = length(lq * vec2(1., .85)), aa = ldPx * L.z / ldFoc, on = ldDoorOn(kk + 5.) * lamps * step(1., L.z);
  col += ldWarm * .14 * on / (1. + 7. * d * d) * ldS(1.8, .5, d);
  col = mix(col, (ldWarm * vec3(1., .55, .5) + .12) * on * (1.5 - 2.2 * d) + LD_DAY * vec3(.5, .16, .1) * (1.1 - d), ldEdge(aa, .34 - d) * (1. - LD_SKY));
  col = mix(col, haze, far * ldS(14., 44., tt * ldFoc) * (1. - LD_SKY));
  vec4 pass[2] = vec4[2](vec4(0), vec4(0));
  for (int i = 0; i < 2; i++) {
    vec2 hit = i == 0 ? ldHit1 : ldHit2;
    if (hit.y > 9e3 || pass[0].a > .995) break;
    pass[i] = ldCloth(ldSkin(hit, p), dusk, lamps);
    pass[i].rgb = mix(pass[i].rgb, haze * pass[i].a, far * (1. - .7 * LD_SKY) * ldS(14., 44., hit.y));
  }
  vec3 man = mix(vec3(.07, .085, .14), vec3(.42, .36, .28), ldS(1.42, 1.48, ldMan.z));
  man *= (dusk * 1.2 + ldWarm * door * sat(.6 + 4. * ldMan.y) * 1.6);
  col = ldLay(col, man, ldMan.x, pass);
  // blue smoke drifting over, warm where a door is near
  float sm = ldS(.4, 1., ldSmoke + .12 * thick) * (.4 + .2 * uSpace + .25 * uTexture + .25 * thick) * (1. - dry);
  col = mix(col, dusk * .75 + .02 + ldWarm * .1 * door, sat(sm) * (1. - .75 * LD_DAY) * (1. - .7 * LD_SKY));
  // paper in the air
  for (int j = 0; j < 2; j++) {
    float fj = float(j), size = .15 + .1 * fj;
    vec2 q = p / size + vec2(uTime * .05 + fj * 3.3, uTime * (.11 + .05 * fj)), id = floor(q), h = hash22(id + 31. * fj);
    float a = uTime * (.5 + h.x) + h.y * 40., w = .01 + .022 * abs(sin(a)), e = ldPx / size * 1.3;
    q = rot(h.x * 30. + .5 * a) * (q - id - .5 - (h - .5) * .5 - vec2(.1 * sin(a * .7), .0));
    float have = (1. - .5 * LD_DAY) * ldS(0., .15, .2 + .4 * uTexture + .3 * uCue + .5 * uOwn[5] - fract(h.y * 7.7));
    col = mix(col, vec3(.5, .045, .03) * (dusk * 2. + .35 * ldWarm) * (.6 + .8 * abs(sin(a))), .9 * have * ldEdge(e, min(w - abs(q.x), .042 - abs(q.y))));
  }
  return col;
}
// ---- b: night, at street level
// The nine nearest lamps on their springs; out of focus they are soft discs, and wet stone softens them more.
vec3 ldLamps(LdSkin k, vec3 hue) {
  const float big = 1. + 1.3 * LD_SCALE, cell = .14 * big;
  float rows = .13 * big / ldR, slant = max(k.slant, .45), wet = ldFlip < .0 ? 1. : .0, out_ = k.z / ldFocus - 1.;
  vec2 q = vec2(k.arc / cell, k.v / rows), id0 = floor(q);
  float rw = max(.024 + max(-.2 * out_, .006 * out_), ldPx * k.z / ldFoc * 1.1);
  rw *= big;
  rw = mix(rw, .1 + 1.2 * rw, wet);
  float hot = 2. * ldBell(rw * 22.), sharp = .5 + .35 * ldS(.03, .08, rw);
  vec3 sum = vec3(0);
  for (int j = 0; j < 9; j++) {
    vec2 id = id0 + vec2(j % 3 - 1, j / 3 - 1), h = hash22(vec2(mod(id.x, 211.), id.y) + 5.);
    vec2 c = id + .5 + (h - .5) * .7 * (1. - .85 * LD_FIN) + .14 * (1. - .6 * LD_FIN) * sin(uTime * (.8 + h.yx) + h * 40.);
    float h3 = fract(h.y * 31.7), d = length((q - c) * vec2(cell * slant, rows * ldR)) / (rw * (.7 + .45 * h3));
    if (d >= 1. || abs(c.y * rows) > 1.15) continue;
    float disc = ldS(1., mix(sharp, .0, wet), d) * (1. + hot * ldBell(d * 2.) - .3 * ldBell(d * 1.3)) * (1. + LD_FIN * (mod(id.x, 3.) < .5 ? 1.2 : -.97));
    int kind = int(fract(h.x * 57.3) * 5.);
    float lv = ldLv(kind);
    vec3 glow = mix(hue, uKind[kind] * uKind[kind] * 1.4, .08 + .27 * lv) * (.15 + .85 * h3 * h3 + lv * uEnergy);
    sum += (glow + vec3(1., .95, .85) * uKeys * ldS(.85, .95, fract(h.y * 91.)) * 2.) * disc;
  }
  float strong = .55 + .25 * uLevel + 1.5 * uHits * ldBell((k.f - ldJoltAt) * .8) + .6 * uCue * ldBell((k.f + 1.) * .3);
  sum *= .018 * big * big / (rw * rw + .006 * big * big);
  // where it comes straight at us they close up and dim, and on wet stone its sides are soft
  sum = mix(hue * .12 * ldS(1., .3, k.off), sum, .4 + .6 * ldS(.1, .4, k.slant)) * mix(1., ldS(1.15, .25, k.off), wet);
  return sum * strong * (1. + .8 * ldSound(k.f));
}
vec3 ldNight(vec2 p, vec2 pix, float down) {
  float blue = sat(-uOwn[0]), fog = sat(uOwn[0]), dry = sat(-uOwn[5]) * (1. - LD_SKY), flood = max(sat(uOwn[5]), LD_SKY), h = abs(down);
  bool below = down > .0;
  vec3 hue = mix(mix(vec3(1., .38, .08), vec3(.58, .82, .8), sat(-uOwn[1])), vec3(1., .1, .07), sat(uOwn[1])), sky = mix(vec3(.002, .003, .007), vec3(.013, .013, .019), exp(-h * 5.)) + blue * mix(vec3(.02, .05, .14), vec3(.16, .2, .3), exp(-h * 4.));
  if (LD_DAY > 0.) sky = mix(sky, mix(vec3(.62, .68, .72), vec3(.96, .86, .74), exp(-h * 5.)), LD_DAY);
  if (LD_SKY > 0.) {
    vec2 m = vec2(p.x - .5, h - .29), sc = vec2(p.x, h) * 46., si = floor(sc), so = hash22(si + 9.);
    float l = length(m), mo = noise(m * 17. + 20.) * .6 + .4 * noise(m * 41.);
    sky += LD_SKY * (vec3(.05, .07, .11) * exp(-h * 4.) + vec3(.6, .66, .7) * .22 * exp(-max(l - .12, 0.) * 8.) + vec3(.8) * step(.8, so.x) * ldS(.07, .02, length(sc - si - .2 - .6 * fract(so * 7.))));
    sky = mix(sky, vec3(1.0, .96, .84) * (1.15 - .55 * ldS(.4, .75, mo)), LD_SKY * ldEdge(ldPx * 1.5, .12 - l));
  }
  // roofs against it
  float x = p.x * 3.1 + 3., rh = .10 + .12 * hash11(floor(x)) + .05 * (.5 - abs(fract(x) - .5)) + .06 * p.x;
  if (LD_SKY > 0.) rh = mix(rh, .015 + .11 * noise(vec2(p.x * 2.3 + 30., 1.)) + .02 * noise(vec2(p.x * 11. + 60., 2.)), LD_SKY);
  rh *= 1. - .3 * LD_DAY;
  sky = mix(sky, sky * (.3 + .48 * LD_DAY), ldEdge(ldPx, rh - h));
  float smoke = ldS(.25, .8, ldSmoke) * (1. - .8 * dry);
  vec3 veil = hue * ldVeil * .027 * (.15 + 1.5 * smoke) * (.7 + .6 * uPad + .4 * uMic + .4 * uSpace + 1.4 * fog) * (1. - .8 * LD_DAY);
  vec3 col = sky + fog * (hue * .05 + .03) * (.4 + smoke);
  vec3 man = (hue * .03 * ldS(1.35, 1.75, ldMan.z) + .002) * (1. + 2. * fog) + blue * .01 + LD_DAY * vec3(.05, .05, .055);
  vec4 pass[2] = vec4[2](vec4(0), vec4(0));
  for (int i = 0; i < 2; i++) {
    vec2 hit = i == 0 ? ldHit1 : ldHit2;
    if (hit.y > 9e3 || pass[0].a > .99) break;
    LdSkin k = ldSkin(hit, pix);
    float dark = ldS(1.05, .85, k.off);
    vec3 lam = ldLamps(k, hue);
    if (LD_DAY > 0.) { // by day: paper flowers on a pale skin
      float a = sat(1.6 * max(lam.r, max(lam.g, lam.b)));
      vec3 skin = vec3(.95, .9, .8) * (.35 + .55 * ldS(-.8, .9, k.n.y)), dye = lam / max(max(lam.r, max(lam.g, lam.b)), .02);
      lam = mix(lam, mix(skin, dye * dye * (.45 + .35 * ldS(-.8, .9, k.n.y)), a) * dark, LD_DAY);
    }
    if (LD_DAY > 0.) lam *= 1. + LD_DAY * (.5 * uHits * ldBell((k.f - ldJoltAt) * .6) + .25 * uCue);
    pass[i] = vec4(lam + hue * .012 * dark, dark);
  }
  col = ldLay(col, man, below ? .0 : ldMan.x, pass);
  col += veil;
  if (below) {
    float mirror = mix((.5 + .5 * ldS(.2, .75, ldWorn)) * (.7 + .5 * ldTone) * (1. - .75 * ldJoint), .9, flood) * (1. - .75 * dry);
    col = col * mirror + (vec3(.0025, .003, .0045) + hue * .035 * ldShade * ldShade * (1. - flood) * (.6 + .6 * uLevel) + blue * vec3(.01, .016, .03)) * mix((.5 + ldTone) * (1. - ldJoint), 1., flood);
    if (LD_DAY > 0.) col = mix(col, vec3(.6, .57, .53) * (.75 + .4 * ldTone) * (1. - .4 * ldJoint) * (1. - .55 * ldShade * ldShade), .62 * LD_DAY * (1. - .7 * flood));
    col = mix(col, man, ldMan.x);
  }
  return col;
}
vec3 render(vec2 p) {
  ldPx = 1. / uRes.y;
  bool b = uVar > .5;
  float ring = 4. * uCue * (1. - uCue), pitch, open = sat(-uOwn[2]), tight = sat(uOwn[2]), over = sat(-uOwn[4]), close = sat(uOwn[4]), fat = sat(uOwn[3]);
  float turn = (b ? .85 : .95) - (b ? .3 : .55) * LD_SKY + .35 * LD_DAY, coil = .9 + .15 * uDrone + .18 * ring;
  ldE = vec2(sin(turn), cos(turn)); ldN = vec2(ldE.y, -ldE.x);
  ldPh = .25 * sin(uTime * .031) - uTravel * .04;
  ldC = 1.1 + .6 * open - .35 * tight;
  ldA = (2.7 + .8 * open - 1. * tight) * coil; ldB = (3. + .7 * open - 1.1 * tight) * coil;
  ldRoot = sqrt(ldB * ldB + ldC * ldC);
  ldFrom = -15.4 / ldC; ldTo = 14.3 / ldC;
  ldJoltAt = mix(-4.5, 6., 1. - uHits); ldJolt = 2. * uHits * (1. - uHits);
  ldR = .43 * exp2(uOwn[3] * .8 - .4 * sat(-uOwn[3])); ldUp = .75 + .35 * fat;
  ldAlong = uTravel * .55; ldFocus = 6.5 + 4.5 * over - 1. * close;
  if (!b) {
    ldEye = vec3(0, 7. + 4.5 * over - 2.6 * close, .0); pitch = .72 + .5 * over - .22 * close - .42 * LD_SKY; ldFoc = 1.05 + .2 * over;
    ldHigh = 2.7 + .4 * fat; ldO = vec2(0, 8.2 - 3.4 * over - .4 * close);
  } else {
    ldEye = vec3(0, 1.1, .0); pitch = -.02; ldFoc = .9 + .6 * over - .2 * close;
    ldHigh = 2.4 + .4 * fat; ldO = vec2(0, 8.6 + 5. * over - 1. * close);
  }
  ldF = vec3(0, -sin(pitch), cos(pitch)); ldU = vec3(0, cos(pitch), sin(pitch));
  vec2 pix = p;
  vec3 ray = ldF * ldFoc + vec3(p.x, .0, .0) + ldU * p.y, col = vec3(0);
  float down = -ldFoc * ldF.y / ldU.y - p.y;
  ldFlip = 1.;
  ldStreet(p, ray);
  if (b && down > 0.) {
    // each stone is a little dome, tipped its own way
    float flood = max(sat(uOwn[5]), LD_SKY), far = 1. / (down + .05);
    pix += ldFade * (1. - flood) * (vec2(.03, .06) * ldStone.zw + (hash22(ldStone.xy) - .5) * vec2(.012, .03));
    pix += (noise(vec2(p.x * far * 1.5, far * 7. + uTime * .2)) - .5) * vec2(.008, .022) * ldS(0., .2, down);
    ldJoint *= 1. - flood;
    ldFlip = -1.;
  }
  ldTrace(pix, ray);
  if (b) col = ldNight(p, pix, down); else col = ldDusk(p, ray);
  return screenOf(col);
}
