// name: Colony
// a: Huddle
// b: Pink flight
// what: A pale ice shelf under a thin sun: a huddle of upright birds fills the right, pale fronts and gold throats, each loose one with a long blue shadow, and late ones walk in file from a far blue berg; or a salt lake from the air, milky jade to rust with white crust lines, pink birds in flight over their dark twins, others wading.
// follows: Loudness draws the huddle closer and the flock fuller; each kind lights a ring of the crowd or lanes of the flight; more birds stand where the piece is loud; bands flap wings. A hit sends a ring of nudges or of light on water; a cue blows snow across or banks the flock and lights it. Pad and voice thicken steam, sheen or mist; keys send out single birds.
// own: 0 moonlit night at -1, low golden sun at 1; 1 clear hard light with deep colour at -1, blown snow or lake mist at 1; 2 a small far knot or a handful of birds at -1, a crowd over the whole plain or a full flock at 1; 3 bare dark stones showing through the snow or black-green water at -1, cracked blue ice or a white salt flat at 1; 4 a low eye with big near birds at -1, high above and no horizon at 1; 5 downy grey chicks or white birds at -1, tall slender golden ones or scarlet birds at 1; 6 a ring round a frozen pool or a flight wheeling in a ring at -1, long columns marching or skeins of arrowheads at 1; 7 a raft of ice in open black water or green reed islands at -1, a lower horizon under a great mountain or a crust of salt polygons at 1

const float CL_C = .030;        // how far apart two ranks stand, in the logarithm of their distance
const float CL_STEP = .046;     // the room beside a bird, on the ground
float clCam, clHor, clD, clPx;   // the eye's height, the horizon, how far under it the pixel is, a pixel
float clTall, clInner, clMost, clMany;   // a bird's height; how deep in no shadow shows; the most birds near this pixel; how many at all
float clNight, clGold, clFog, clClear, clBare, clIce, clYoung, clSleek;
vec2 clMid, clRad, clHitAt;      // the crowd's middle and reach; where a hit falls
vec2 clW, clChurn;               // the pixel's place on the ground; the way round the middle
float clHere, clShift;           // how deep in the crowd that is; where a rank begins
vec3 clFill;                     // from which depth to which the crowd fills, and how full
vec4 clBody, clHead, clLimb; float clJoin, clThick;   // a bird's shape: two ovals and a line
vec3 clLit, clLow, clShadow, clSun, clDark;

float clN[7], clWave; vec2 clNudge;  // the noises both pictures share; a hit's ring of nudges
// the bird nearest the eye at this pixel, found first and painted once
vec2 clB; vec3 clRn; float clBest, clDeepOf, clSize, clCover, clDim;

#define clSea max(-uOwn[7], .0)
#define clPeak max(uOwn[7], .0)
#define clRing max(-uOwn[6], .0)
#define clFile max(uOwn[6], .0)
// from 0 at a to 1 at b, either way round
float clS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
vec2 clGround(float x, float d) { return vec2(x, 1.) * clCam / d; }
float clSine(float x) { x = fract(x * .15915) * 2. - 1.; return -4. * x * (1. - abs(x)); }   // near enough
// How deep inside the crowd: 1 in its middle, 0 at its edge, less outside.
float clDeep(vec2 w) {
 bool ice = uVar < .5;
 float s = clSine(w.x * 2.9 + .6) * clSine(w.y * 4.1 + .8), t = clSine(w.x * 5.3 - w.y * 3.1);
 if (ice && uOwn[6] < .0) return 1. + .05 * s + .03 * t - mix(length((w - clMid) / clRad), abs(length((w - clMid) / clRad) - .72) * 3., clRing);
 if (ice && uOwn[6] > .0) {
  float x = w.x + .34 * clSine(w.y * 1.1 + 2.) + .12 * clSine(w.y * 2.9), u = abs(fract(x / 1.5 + .3) - .5) * 1.5;
  return mix(1. + .05 * s + .03 * t - length((w - clMid) / clRad), .55 + .12 * t - u * 3.6 - .25 * max(w.y - 7., .0), clFile);
 }
 return 1. + (ice ? .05 * s + .03 * t - length((w - clMid) / clRad) : .35 * s - abs(w.y - clMid.y - .34 * w.x - .05 * t) / clRad.y);
}
float clFull(float dep) {
 float out_ = min(dep, .0), far = 1. / (1. + 34. * out_ * out_);
 return clS(clFill.x, clFill.y, dep) * clFill.z + (uVar < .5 ? .12 * far * far * mix(1., clS(-.2, -.1, dep), clSea) : .0);
}
// where the piece is loud, more stand
float clPiece(vec2 w) {
 vec2 uv = uVar < .5 ? vec2(.56 + w.x / w.y * .6, 1.16 - .62 * log(1. + w.y)) : vec2(.5 + w.x / w.y * .56, 1.55 - .6 * w.y), in_ = sat(12. * uv * (1. - uv));
 return max(piece(uv).a - .08, .0) * in_.x * in_.y * (uVar < .5 ? .06 * (1. - clSea) : .24);
}

// The bird at place i of a rank: where it stands, its chances, how much there is of it.
float clHome(float k, float zk, float i, out vec2 w, out float dep, out vec3 rn) {
 float chance = hash21(vec2(i, k) + 3.1);
 rn = fract(vec3(chance * 91.7 + i * .37, chance * 331.3 + k * .71, chance * 733.9 + i * .13));
 w = vec2((i + .5 + (rn.x - .5) * .16 - clShift) * CL_STEP, zk * (1. - CL_C * (rn.y - .5) * .6));
 dep = -1.;
 if (chance > clMost + .01) return .0;                        // nobody can stand here
 dep = clDeep(w);
 float full = clFull(dep);
 if (dep < .125 && abs(chance - full - .1) < .16) full += sat(1. - 8. * dep) * clPiece(w);
 float here = clS(.0, .006 + .045 * sat(full), full - max(chance, .006));
 // the churn: each is carried round the middle a little way, steps back, and begins again; two halves of the crowd by turns
 float ph = fract(uTravel * .016 + .5 * mod(i, 2.) + .3 * rn.z);
 w += clChurn * (ph - .5) * vec2(.25 * CL_STEP, .4 * CL_C * zk);
 return here * sat(ph * 20.) * sat((1. - ph) * 20.);
}

// How far outside a bird's shape. q: across, and up from the feet, the bird one high.
float clShape(vec2 q, float face, float wing) {
 vec2 a = (q - clBody.xy) / clBody.zw, h = (q - vec2(clHead.x * face, clHead.y)) / clHead.zw;
 if (uVar > .5) h.x += face * 1.6 * clSine(q.y * 9. - .6);
 float d = smin((length(a) - 1.) * min(clBody.z, clBody.w), (length(h) - 1.) * clHead.z, clJoin);
 vec2 s = uVar < .5 ? vec2(abs(q.x), q.y) : q, e = clLimb.zw + vec2(.16, .12) * wing * step(uVar, .5) - clLimb.xy;
 vec2 f = s - clLimb.xy;
 return min(d, length(f - e * sat(dot(f, e) / dot(e, e))) - clThick);
}
// A bird at b is offered: the one that covers most of what is still open is kept.
void clOffer(vec2 b, float dep, vec3 rn, float here, float tall, float wing) {
 if (abs(b.x) > .45 || abs(b.y - .5) > .6) return;
 float px = .75 * clPx / tall, face = rn.y < .5 ? -1. : 1.;
 float c = clS(px, -px, clShape(b, uVar < .5 ? rn.y * 2. - 1. : face, wing)) * sat(here * 14.) * (1. - clCover);
 if (c > clBest) { clBest = c; clB = b; clDeepOf = dep; clRn = rn; clSize = tall; }
 clCover += c;
}
// A shadow laid to the right and toward the eye. b: from the feet, in bird heights, across and down.
void clShade(vec2 b, float here, float len, float slope, float px) {
 float along = b.x / len, wide = .13 * (1. - .4 * along), soft = .03 + .07 * max(along, .0) + px;
 clDim = max(clDim, here * clS(wide + soft, wide - soft, abs(b.y - slope * b.x)) * clS(-.06, .02, along) * clS(1., .5, along));
}

// The crowd over the ground: the nearest bird at the pixel, and the shadows between.
void clPeople(vec2 p, float len, float slope) {
 float r = clTall / clCam, q = log(clD / clCam) / CL_C, back = .5 * len * r * clD;
 vec2 w1 = clGround(p.x - back, clD - slope * back);
 float d0 = clDeep(clW), d1 = clDeep(w1), near = max(d0, d1) + .15;
 clMost = clFull(near) + max(clPiece(clW), clPiece(w1)) * 1.2;
 clHere = d0;
 vec2 v = (clW - clMid) / clRad, w = clW;
 clChurn = vec2(-v.y, v.x) / max(length(v), .3);
 float dep, flap = clS(.05, .5, band(abs(fract(clW.x * .31) - .5) * 2.));
 vec3 rn;
 float top = ceil(q - log(1. - 1.1 * r) / CL_C + .5), zk = exp(-CL_C * (top + 1.)), next = exp(CL_C);
 for (int n = 0; n < 9; n++) {
  float k = top - float(n);
  if (k < q - .5 || clCover > .97 || clMost < .004) break;
  zk *= next;
  clShift = .5 * mod(k, 2.) + .5 * hash11(k + .5);
  float here = clHome(k, zk, floor(p.x * zk / CL_STEP + clShift), w, dep, rn);
  float db = clCam / w.y, tall = r * db * (.65 + .35 * here) * (.86 + .28 * rn.x);
  vec2 b = vec2(p.x - w.x / w.y, db - clD) / tall;
  b.y -= clNudge.y; b.x += clNudge.x * b.y;
  if (here > .01) clOffer(b, dep, rn, here, tall, flap * sat(1.2 - 4. * dep) * abs(fract(uTime * .17 + rn.z * 6.) * 2. - 1.));
 }
 float first = floor(q + .5), rows = len * r * slope / CL_C + .9;
 zk = exp(-CL_C * (first + 1.));
 for (int n = 0; n < 8; n++) {
  if (float(n) > rows || clCover > .97 || clDim > .95 || clMost < .004 || d0 > clInner) break;
  float k = first - float(n);
  zk *= next;
  clShift = .5 * mod(k, 2.) + .5 * hash11(k + .5);
  float i0 = floor((p.x - (clD - clCam / zk) / slope) * zk / CL_STEP + clShift - .5);
  for (int m = -1; m < 3; m++) {
   if (clCam < 1.2 && m * (1 - m) < 0) continue;
   float here = clHome(k, zk, i0 + float(m), w, dep, rn);
   float db = clCam / w.y, tall = r * db * (.65 + .35 * here);
   clShade(vec2(p.x - w.x / w.y, clD - db) / tall, here, len, slope, clPx / tall);
  }
 }
}
// One bird by itself, with its shadow.
void clOne(vec2 p, vec2 w, float seed, float here) {
 float db = clCam / w.y, tall = clTall / clCam * db;
 vec2 b = vec2(p.x - w.x / w.y, db - clD) / tall;
 clShade(vec2(b.x, -b.y), here, 3.6, .4, clPx / tall);
 if (here > .02) clOffer(b + vec2(.05 * sin(uTime * 1.1 + seed * 9.) * b.y, .0), -.5, fract(seed * vec3(.37, .71, .13)), here, tall, .0);
}
float clKind(float dep) { return uVar < .5 ? clamp((.78 - dep) * 5.6, .0, 4.) : clamp(1.5 + 1.2 * dep, .0, 4.); }
float clVolAt(float k) { float v[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits); int i = int(k); return mix(v[i], v[min(i + 1, 4)], fract(k)); }

// The bird that was found, painted: an upright dab with a pale front, or a wader's pink body.
vec3 clPaint() {
 vec2 q = clB;
 float kd = clKind(clDeepOf), vol = clVolAt(kd), px = .75 * clPx / clSize;
 vec3 hue = kindColour(kd), c;
 if (uVar < .5) {
  vec2 way = clChurn;                                 // they face the way the crowd turns
  float face = clamp(way.x + clRn.y - .5, -1., 1.), toward = sat(.45 - .75 * way.y + .9 * (clRn.x - .5));
  vec2 f = (q - vec2(.11 * face, .4)) / vec2(.13, .35), n = (q - vec2(.09 * face, .73)) * vec2(1., .8);
  float front = clS(.025 + px, -.025 - px, (length(f) - 1.) * .13) * toward;
  c = clDark * (.7 + .6 * q.y);
  c = mix(c, mix(vec3(.5, .45, .41), vec3(.64), q.y) * clLit, .9 * clYoung * clS(.92, .7, q.y));
  c = mix(c, clLit * mix(.6, .95, clS(.05, .6, q.y)), front * (1. - .6 * clYoung));
  c = mix(c, mix(vec3(.98, .72, .3), hue, .2 + .4 * vol) * clLit, exp(-dot(n, n) * 130.) * (.3 + .7 * toward) * (1. - .8 * clYoung));
  c = mix(c, vec3(.95, .6, .26) * clLit * (.4 + .6 * q.y), clSleek * .85 * clS(-.2, .15, q.x * (face < .0 ? -1. : 1.)) * clS(.95, .75, q.y));
  if (uOwn[5] < .0) {                                    // a chick's pale cheeks under a dark cap, and its bill
   vec2 m = (abs(q - vec2(.05 * face, .82)) - vec2(.034, .0)) / vec2(.04, .06), k = q - vec2(.075 * face, .8);
   float see = clYoung * clS(.2, .5, toward);
   c = mix(c, clLit * .97, see * clS(1.15, .75, length(m)));
   c = mix(c, clDark, see * clS(1.1, .8, length(k / vec2(.016, .05))));
   c = mix(c, c * .8 + .1 * clLit, see * clS(1.1, .4, length((q - vec2(.03 * face, .42)) / vec2(.17, .3))));
  }
  c += clLit * .22 * clS(.0, -.18, q.x) * clS(.1, .7, q.y);       // the sun's side
  c = mix(c, c * .6 + mix(hue, vec3(.95, .85, .75), .4) * clLit * .5, vol * (.1 + .6 * uEnergy) * clS(.1, .9, q.y) * step(.0, clDeepOf + .3));
  c *= mix(1., clS(-.6, .7, q.y), clS(.0, .25, clDeepOf));
 } else {
  float s = clRn.y < .5 ? -1. : 1.;
  vec3 pink = mix(mix(vec3(.97, .66, .62), vec3(.88, .4, .4), clRn.x), hue, .3 * vol);
  pink = mix(pink, vec3(.96, .94, .9), clYoung * .9); pink = mix(pink, vec3(.86, .16, .16), clSleek * .8);
  c = pink * clLit * mix(.72, 1.08, clS(.42, .66, q.y));
  c = mix(c, clDark, clS(-.08, -.2, q.x * s) * .5);
 }
 return c + (vec3(1., .92, .76) * clLit - c) * .75 * clWave;
}

float clPath(float z) { float t = (z - 3.2) / 8.8; return -.2 - 2.75 * t + .42 * sin(t * 6.); }

// Sky, a thin sun, the far berg.
vec3 clSky(vec2 p, vec2 sun) {
 float ds = length(p - sun), up = p.y - clHor, bx = p.x + .27;
 vec3 high = mix(mix(vec3(.72, .8, .87), vec3(.05, .09, .2), clNight), vec3(.62, .6, .74), clGold);
 high = mix(high, high * vec3(.5, .68, .86), clClear);
 vec3 col = mix(mix(clLow, clLit, .75), high, clS(.0, .2, up));
 col = mix(col, clSun, .75 * exp(-ds * 5.));
 col = mix(col, mix(clSun, vec3(1.), .55), .85 * clS(.013 + clPx, .013 - clPx, ds) * (1. - clFog));
 float crag = abs(fract(bx * 17.) - .5) + .6 * abs(fract(bx * 41. + .3) - .5);
 float tip = min(min(.062 + .12 * bx, (.15 - bx) * .8), (bx + .13) * 1.6) + .009 * crag, ice = max(tip, min(.034 - .05 * (bx - .2), (bx - .07) * .5) + .004 * crag);
 ice = max(ice, .008 + .003 * sin(p.x * 23.) * sin(p.x * 9.));
 float fold = bx + .75 * up - .03 + .016 * abs(fract(up * 31. + bx * 9.) - .5), facet = abs(fract(bx * 13. + up * 21.) - .5) * 2.;
 vec3 berg = mix(clShadow, vec3(.5, .69, .84) * clLit, .4 + .3 * facet);
 berg = mix(berg, mix(clLow, clLit, .2 + .3 * facet), clS(clPx, -clPx, fold) * clS(.0, .004, tip - .011));
 if (uOwn[7] > .0) {
  float x = p.x * 1.35 + 2.63, y = .0, a = .5;
  for (int i = 0; i < 5; i++) { y += a * abs(fract(x) * 2. - 1.); x = x * 2.03 + .31; a *= .48; }
  float top = (.1 + .46 * y * y) * clPeak * clS(-1.5, .0, p.x) + .02, m = up / max(top, .01), q = noise(vec2(p.x * 13. + up * 9., up * 5.)) * .6 + noise(vec2(p.x * 31. - up * 34., up * 12.)) * .4;
  vec3 rock = mix(clDark * 1.3, mix(clShadow, clLit, .45 + .4 * clS(.3, .7, q)), clS(.5, .62, q + .16 * m - .05));
  col = mix(col, mix(rock, mix(clLow, clLit, .6), .75 * clS(.5, .0, m) + .1), clS(clPx, -clPx, up - top) * sat(8. * clPeak) * (1. - .8 * clFog));
  ice = mix(ice, -.01, clPeak);
 }
 return mix(col, berg, clS(clPx, -clPx, up - ice) * mix(.55, .95, clS(.0, .04, up)) * (1. - .8 * clFog));
}
// Above 0 where ice floats: the crowd's own raft, and floes about it.
float clRaft(vec2 w) {
 float c = noise(w * 2.2 + 4.) + .25 * noise(w * 7.);
 return max(clDeep(w) + .2 + .5 * (c - .6), (noise(w * vec2(1.25, 1.7) + 9.) + .3 * noise(w * 4.) - .86) * 1.6);
}
vec3 clIceShelf(vec2 p) {
 vec2 sun = vec2(-.6, clHor + .078);
 if (clD < .004) return clSky(p, sun);
 float nearBy = clS(.03, .5, clD);
 float rough = mix(.5, .6 * clN[0] + .2, clS(.02, .2, clD)) + nearBy * (.3 * clN[1] - .15) + nearBy * nearBy * (.16 * clN[2] - .08);
 vec3 snow = mix(clLow, clLit, .3 + (.6 + .2 * uHigh) * clS(.3, .75, rough));
 snow = mix(snow, clSun, .35 * exp(-length((p - sun) * vec2(1., .7)) * 2.2));
 // bare stones, or glass ice with white cracks
 vec3 stone = mix(vec3(.15, .145, .15), vec3(.44, .41, .38), .6 * clN[2] + .5 * clN[1] * clN[3]) * clLit;
 snow = mix(snow, stone, clBare * clS(.66, .54, mix(.58, clN[0] + .1 * clN[2], clS(.03, .2, clD))));
 float fine = 1.6 * clPx * clCam / (clD * clD), cr = min(abs(clN[0] + .12 * clN[1] - .5), abs(clN[3] + .1 * clN[2] - .5));
 vec3 glass = mix(vec3(.16, .42, .57), vec3(.5, .74, .82), rough) * clLit;
 snow = mix(snow, mix(glass, clLit, clS(.012 + fine, .0, cr) * .8), clIce * .85);
 clShadow = mix(clShadow, snow * .4, max(clBare, .6 * clIce));
 if (uOwn[6] < .0) {                                    // the pool inside the ring
  float l = length((clW - clMid) / clRad) + .06 * (clN[3] - .5) + .05 * (clN[1] - .5);
  vec3 pool = mix(vec3(.1, .24, .36), vec3(.3, .55, .68), .6 * clN[0] + .4 * clS(.0, .4, l)) * clLit;
  snow = mix(snow, mix(pool, clLit, .5 * clS(.03 + fine, .0, cr)), clRing * clS(.36, .33, l));
  snow = mix(snow, clLit, clRing * .7 * clS(.03, .0, abs(l - .35)));
 }
 if (uOwn[7] < .0) {
  float r0 = clRaft(clW), r1 = clRaft(clGround(p.x, max(clD - .012 - .05 * clD, .004))), e = .006 + 1.5 * clPx * clCam / (clD * clD);
  vec3 sea = mix(clDark * vec3(.35, .55, .75), mix(clLow, clShadow, .4), .75 * exp(-clD * 5.) + .18 * clS(.45, .75, clN[2] * .5 + clN[5] * .5));
  sea = mix(sea, clSun, .6 * exp(-abs(p.x - sun.x) * 7.) * clS(.45, .7, clN[2] * .6 + clN[1] * .4) * exp(-clD * 2.));
  sea = mix(sea, vec3(.2, .5, .62) * clLit, .45 * clS(-.16, .0, r0));
  sea = mix(sea, mix(vec3(.22, .5, .66), vec3(.6, .8, .88), clN[3]) * clLit * .85, clS(-e, e, r1));
  snow = mix(snow, sea, clS(e, -e, r0) * clSea);
  clShadow = mix(clShadow, sea * .5, clS(e, -e, r0) * clSea);
 }
 // the late ones, walking in, and the trodden line they keep to
 float off = abs(clW.x - clPath(clW.y)), t = clS(2.9, 3.6, clW.y) * clS(13., 10.5, clW.y) * (1. - max(clSea, abs(uOwn[6])));
 snow = mix(snow, clShadow, .3 * t * clS(.05 + 2. * clPx * clW.y, .0, off));
 float walk = uTravel * .02, k0 = ceil(log(clD / clCam) / .085 - walk) - 2.;
 for (int i = 3; i >= 0; i--) {
  if (off > .32 || uOwn[7] < -.9 || abs(uOwn[6]) > .9) break;
  float k = k0 + float(i), z = exp(-.085 * (k + walk)), h = hash11(k * .37 + .2);
  clOne(p, vec2(clPath(z) + .05 * (h - .5), z), h * 7., clS(2.9, 3.4, z) * clS(13., 11., z) * step(.12, h) * (1. - max(clSea, abs(uOwn[6]))));
 }
 // two that stand alone, those the keys send off, and one that slides on its belly and leaves its groove
 for (int i = 0; i < 5; i++) {
  if (p.x > .1 || abs(clW.y - 1.75) > .5) break;
  float f = float(i), alone = step(2.5, f);
  clOne(p, mix(vec2(-.5 + .23 * f, 2.05 - .24 * f), vec2(-1.11 + .06 * f, 1.77 - .05 * f), alone), f * 2.3 + .4, mix(uKeys, 1., alone) * (1. - clSea));
 }
 float s = fract(uTravel * .007), run = clS(.0, .1, s) * clS(1., .85, s) * (1. - clSea);
 vec2 sl = vec2(mix(-1.75, -.7, s), 2.25); sl.y += .12 * sin(sl.x * 2.);
 float gr = abs(clW.y - 2.25 - .12 * sin(clW.x * 2.)) * clD * clD / clCam;
 snow = mix(snow, clShadow, .45 * run * clS(.004 + clPx, .001, gr) * clS(sl.x, sl.x - .04, clW.x) * clS(-1.9, -1.5, clW.x));
 float sd = clCam / sl.y, st = clTall / clCam * sd;
 vec2 b = vec2(p.x - sl.x / sl.y, sd - clD) / st - vec2(.0, .16);
 clDim = max(clDim, .9 * run * clS(.1, -.1, (length((b - vec2(.5, -.22)) / vec2(1., .13)) - 1.) * .2));
 clOffer(vec2(.03 - b.y, b.x + .5), -.5, vec3(.3, .62, .0), run, st, .0);
 snow = mix(snow, clShadow, max(-uOwn[2], .0) * .6 * clWave);
 clPeople(p, 3.6, .4);
 vec3 col = mix(snow, clShadow * mix(1., .55, clS(-.1, .2, clHere)), max(clDim * (.75 + .15 * clClear), .85 * clS(.0, .2, clHere)));
 col = mix(col, clPaint(), clCover);
 col = mix(col, mix(clLow, clLit, .82), sat(.6 * exp(-clD * (26. - 12. * uSpace)) + clFog * (.2 + .8 * exp(-clD * 4.))));
 // steam over the thick of it
 return mix(col, mix(clLit, clSun, .5), clS(.1, .9, clHere) * clS(.35, .75, clN[4] * .65 + clN[5] * .35) * (.35 + .45 * uPad + .3 * uMic) * (1. - .8 * clClear));
}

// A bird on the wing from above. q: along its way and across, half its span 1. How much of it covers, then its colour.
float clWings(vec2 q, float beat, float px, out float wing, out float trail) {
 float v = abs(q.y) / (.72 + .28 * beat), t = sat(v), chord = (.44 + .12 * clYoung - .1 * clSleek) * sqrt(1. - t * t * .92) * (1. - .28 * t), lead = .2 + .12 * t - .5 * t * t;
 float w = max(abs(q.x - lead + .5 * chord) - .5 * chord, (v - 1.) * .6);
 float body = (length(q / vec2(.36, .12)) - 1.) * .12, thin = max(.028, .55 * px);
 float line = max(abs(q.y) - .02 * sat(q.x * 9. - 8.), abs(q.x) - .97);
 wing = clS(px, -px, w) * clS(-.01, .03 + px, body); trail = (lead - q.x) / max(chord, .05) + .45 * clS(.55, 1., v);
 return max(clS(px, -px, min(w, body)), clS(thin + px, thin - px, line) * min(1., .03 / thin + .15));
}
// The flight over place w: which bird is there, if any. q, then its chances, how much of it there is.
vec4 clFlight(vec2 w, out vec2 of) {
 const vec2 way = vec2(-.9, .436);
 float al = dot(w, way), ac = dot(w, vec2(-way.y, way.x)) - .1 * sin(al * 1.3);
 float round_ = 1.;
 if (uOwn[6] < .0) {                                    // a ring, twelve places round
  vec2 c = (w - vec2(.1, 1.2)) * vec2(1., -1.);
  round_ = max(length(c), .1) / .573;
  ac = mix(ac, length(c) - .573 - 1.1, clRing); al = mix(al, .573 * atan(c.x, c.y), clRing);
 }
 float j0 = floor(ac / .15), best = 1.6;
 vec4 got = vec4(9., 9., .0, .0); of = vec2(.0);
 for (int n = -1; n <= 1; n++) {
  if (abs(ac + 1.1) > .8) break;                   // no lanes so far out
  float j = j0 + float(n), h = hash11(j * .71 + .13), b0 = (j + .5) * .15;
  float lane = exp(-(b0 + 1.1) * (b0 + 1.1) * (9. + 13. * clRing - 5.5 * clFile)), many = lane * ((.85 + .2 * uLevel + .9 * clRing) * clMany + .3 * uKeys);
  float a0 = al - uTravel * (.024 + .012 * mix(h, .5, clFile)) + h * 9. * (1. - clFile) + 1.15 * abs(b0 + 1.1) * clFile, i0 = floor(a0 / .3 - .5);
  for (int m = 0; m < 2; m++) {
   float i = i0 + float(m), chance = hash21(vec2((uOwn[6] < -.5 ? mod(i, 12.) : i) + 5., j + 71.));
   if (uOwn[6] > .0) chance = mix(chance, mod(i, 3.) < 1. ? .04 + .1 * fract(chance * 7.) : 2., clFile);
   vec2 rn = fract(chance * vec2(137.3, 517.9));
   float here = clS(.0, .04, many - chance);
   vec2 q = vec2(a0 - (i + .5 + (rn.x - .5) * .5 * (1. - .8 * clFile)) * .3, ac - b0 - (rn.y - .5) * .08 * (1. - .6 * clFile)) / (.064 * (.85 + .3 * rn.y) * (.5 + .5 * here));
   float d = dot(q, q) + 9. * step(here, .01);
   if (d < best) { best = d; got = vec4(q * vec2(uOwn[6] < .0 ? mix(1., round_, clRing) : 1., 1.), rn.x, sat(here * 12.)); of = vec2(rn.y, mod(j + 10., 5.)); }
  }
 }
 got.xy = rot(.35 * (got.z - .5) - 2.8 * uCue * (1. - uCue)) * got.xy;
 of.x = sin(uTime * 1.3 + of.x * 30.) * (.35 + .65 * band(got.z)) * .5 + .5;
 return got;
}
vec3 clLake(vec2 p) {
 float f = .5 * clN[0] + .28 * clN[1] + .22 * clN[2], tide = .62 * clW.x - .9 * (clW.y - 1.25) + 1.7 * (f - .48) + .03 * sin(uTime * .05);
 float hue = tide + .12 * (uLow - .4);
 vec3 col = mix(vec3(.5, .74, .67), vec3(.72, .86, .78), clS(-1., -.3, hue));
 col = mix(col, vec3(.86, .8, .66), clS(-.25, .05, hue));
 col = mix(col, vec3(.82, .54, .4), clS(.05, .4, hue));
 col = mix(col, vec3(.6, .27, .2), clS(.4, 1., hue));
 col = mix(col, mix(vec3(.04, .09, .12), vec3(.1, .26, .26), clS(-.9, .5, tide)), .92 * clBare);
 col = mix(col, mix(vec3(.93, .92, .9), mix(vec3(.62, .8, .82), vec3(.93, .66, .64), clS(-.6, .4, tide)), clS(.52, .4, f)), clIce * .9);
 if (uOwn[7] > .0) {                                    // the salt dried into polygons, their edges heaved up
  vec2 g = clW * 3.4 + .25 * (vec2(clN[1], clN[2]) - .5), i0 = floor(g), f0 = g - i0; float a = 9., b = 9., h = .0;
  for (int j = 0; j < 9; j++) {
   vec2 o = vec2(j % 3, j / 3) - 1., d = o + .5 + .75 * (hash22(i0 + o) - .5) - f0; float l = dot(d, d);
   if (l < a) { b = a; a = l; h = hash21(i0 + o + 3.7); } else b = min(b, l);
  }
  float e = sqrt(b) - sqrt(a), w = 6. * clPx * clCam / (clD * clD);
  col = mix(col, mix(col, vec3(.95, .93, .9), .25 + .6 * h) * (.9 + .14 * h), .85 * clPeak);
  col = mix(col, col * vec3(.62, .66, .74), clPeak * clS(.34, .1, e) * .7);
  col = mix(col, vec3(1., .99, .97), clPeak * clS(.12 + w, .06, e + .06 * (clN[3] - .5)));
 } else if (uOwn[7] < .0) {                             // islands of reeds, each with its pale rim
  vec2 g = clW * 2.3 + .3 * (vec2(clN[1], clN[0]) - .5), i0 = floor(g); float a = 9., h = .0;
  for (int j = 0; j < 9; j++) {
   vec2 o = vec2(j % 3, j / 3) - 1., r = hash22(i0 + o + 8.); float l = length((o + .5 + .5 * (r - .5) + i0 - g) * vec2(1., 1.2)) - .1 - .42 * r.y * r.x - .12 * step(.6, r.x);
   if (l < a) { a = l; h = r.x; }
  }
  a += .1 * (clN[3] - .5) + .12 * (clN[4] - .5);
  float w = 3. * clPx * clCam / (clD * clD);
  col = mix(col, mix(vec3(.12, .3, .27), vec3(.3, .52, .44), clS(-.6, .5, tide)), .8 * clSea);
  col = mix(col, vec3(.72, .74, .5), clSea * .8 * clS(.09 + w, .05, abs(a - .02)));
  col = mix(col, mix(vec3(.1, .2, .1), vec3(.42, .5, .2), clN[5] * .6 + .5 * h * clN[3]), clSea * clS(.02 + w, -.02, a));
  col = mix(col, vec3(.05, .1, .07), clSea * .6 * clS(-.03, -.12, a + .12 * clN[5]) * clS(.45, .7, clN[3]));
 }
 float lines = tide * 2.7 + .25 * clN[3] + .5 * clN[4], fw = 4. * clPx * clCam / (clD * clD), ragged = .06 * (clN[5] - .5) + .05 * (clN[3] - .5);
 float thick = .012 + .2 * clN[4] * clN[4] * clN[2];
 float at = abs(fract(lines) - .5) + ragged, crust = clS(thick + fw, thick - fw, at) * min(1., 3. * thick / (fw + .001));
 crust = max(crust * clS(.28, .42, clN[1] * .6 + clN[4] * .4), .5 * clS(.02 + fw, .0, abs(abs(at - .17 * clN[2]) - .05)) * clS(.4, .6, clN[4]));
 col = mix(col, vec3(.97, .95, .91) * (.86 + .14 * clN[5] + .08 * clN[3]), .88 * crust * (1. - .4 * clIce) * (1. - .9 * abs(uOwn[7])) * (1. - .75 * clRing));
 col *= (.95 + .1 * clN[5]) * clLit;
 col += clSun * (.1 + .2 * uPad) * exp(-length((p - vec2(-.5, .4)) * vec2(1., 1.6)) * 2.5) * (.6 + .6 * clN[5]);
 col = mix(col, col * col * 1.12, .8 * clClear);
 vec3 shade = col * mix(vec3(.42, .5, .56), vec3(.6, .64, .68), clFog);
 clPeople(p, 1.6, .8);
 col = mix(col, shade, .75 * clDim);
 // a hit rings on the water
 float ring = length(clW - clHitAt) - .07 - .55 * (1. - uHits);
 col = mix(col, clLit, uHits * .7 * exp(-ring * ring * 420.));
 col = mix(col, clPaint(), clCover);
 float high = 4. * uCue * (1. - uCue), wing, trail, px = .6 * clPx * clCam / (clD * clD) / .064;
 vec2 of;
 vec4 g = clFlight(clW - vec2(.075, -.1) * (.8 + .4 * uSpace + .5 * high), of);
 col = mix(col, shade * .9, .7 * g.w * clWings(g.xy, of.x, px + .05, wing, trail));
 g = clFlight(clW, of);
 float a = g.w * clWings(g.xy, of.x, px, wing, trail);
 vec3 pink = mix(mix(vec3(.99, .75, .7), vec3(.95, .55, .53), g.z), kindColour(of.y), .08 + .34 * clVolAt(min(of.y, 4.)) * uEnergy), rim = vec3(.83, .27, .27);
 pink = mix(mix(pink, vec3(.97, .96, .93), clYoung * .9), vec3(.88, .2, .18), clSleek * .8);
 rim = mix(rim, vec3(.9, .88, .84), clYoung * .9);
 vec3 c = mix(pink, rim, wing * clS(.12, .3, trail)) * clLit;
 c = mix(c, clDark, wing * clS(.5 - px, .6 + px, trail));
 float gx = p.x - .45 + 1.4 * (1. - uCue);
 c = mix(c, vec3(1., .95, .92) * clLit, .85 * uCue * exp(-gx * gx * 5.));
 col = mix(col, c, a);
 // mist lying on the lake
 return mix(col, mix(clLow, clLit, .72), sat(clFog * (1. - .4 * clNight) * (.12 + 1.1 * clS(.2, .8, clN[6] * .7 + .3 * clN[4]) + .25 * clS(.0, .5, p.y)) * clS(-.75, .1, p.y) + .35 * uMic * clS(.35, .8, clN[6])) * .75);
}

vec3 render(vec2 p) {
 clNight = max(-uOwn[0], .0); clGold = max(uOwn[0], .0);
 clClear = max(-uOwn[1], .0); clFog = max(uOwn[1], .0);
 clBare = max(-uOwn[3], .0); clIce = max(uOwn[3], .0);
 clYoung = max(-uOwn[5], .0); clSleek = max(uOwn[5], .0);
 clPx = 1. / uRes.y;
 clB = vec2(.0); clRn = vec3(.0); clBest = .0; clDeepOf = .0; clSize = 1.; clCover = .0; clDim = .0;
 float up = max(uOwn[4], .0), down = max(-uOwn[4], .0);
 clMany = 1. + uOwn[2] * (uOwn[2] > .0 ? .8 : .85);
 clLit = mix(mix(vec3(.97, .955, .93), vec3(.4, .5, .66), clNight), vec3(1., .82, .66), clGold);
 clLow = mix(mix(vec3(.68, .76, .86), vec3(.12, .17, .3), clNight), vec3(.6, .55, .74), clGold);
 clShadow = mix(mix(vec3(.42, .55, .73), vec3(.05, .08, .17), clNight), vec3(.4, .36, .6), clGold);
 clSun = mix(mix(vec3(1., .95, .84), vec3(.8, .88, 1.), clNight), vec3(1., .7, .42), clGold);
 clShadow *= mix(vec3(1.), vec3(.45, .6, .85), clClear) * (1.1 - .2 * uTone); clSun = mix(clSun, clSun * vec3(1., .94, .84), uTone);
 clDark = vec3(.1, .12, .175) * (1. - .6 * clNight);
 bool ice = uVar < .5;
 if (ice) {
  clCam = 1. + .8 * up - .4 * down; clHor = .37 + .4 * up - .13 * down - .24 * clPeak; clTall = .067 * (1. + .25 * clSleek); clInner = .16 + .04 * clClear;
  clMid = vec2(2., 2.75); clRad = vec2(2.2, 1.72) * (1.05 - .1 * uLevel) * (1. + uOwn[2] * .6);
  clHitAt = vec2(.8 + 1.1 * min(uOwn[2], .0), 2.1);
  if (uOwn[6] < .0) { clMid = mix(clMid, vec2(.25, 2.5), clRing); clRad = mix(clRad, vec2(1.75, 1.1) * (1.05 - .1 * uLevel) * (1. + uOwn[2] * .4), clRing); }
  if (uOwn[7] < .0) clMid.x -= 1.1 * clSea;
  clFill = vec3(-.05, .12, 1. + .12 * uLevel);
  float broad = mix(mix(.205, .255, clYoung), .14, clSleek);
  clBody = vec4(.0, .42, broad, .44); clHead = vec4(.05, .88 - .06 * clYoung, .095 - .03 * clSleek + .02 * clYoung, .11); clJoin = .13 - .08 * clYoung;
  clLimb = vec4(.13, .64, .19, .36); clThick = .032;
 } else {
  clCam = 1. + 1. * up - .38 * down; clHor = .95 + .95 * up - .35 * down; clTall = .043; clInner = 9.;
  clMid = vec2(.0, 1.42); clRad = vec2(1.5, .3);
  clHitAt = vec2(.2, 1.);
  clFill = vec3(-.1, 1., (.22 + .25 * uLevel) * clMany * (1. - .85 * clRing - .7 * clFile));
  clBody = vec4(.0, .56, .25, .125); clHead = vec4(.22, .77, .036, .21); clJoin = .04;
  clLimb = vec4(.0, .0, .0, .5); clThick = .022;
 }
 clD = max(clHor - p.y, ice ? -9. : .05);
 clW = clGround(p.x, max(clD, .004));
 vec2 g = rot(.35) * clW, warp = clW + .1 * sin(clW.yx * vec2(5.1, 4.3) + vec2(.0, 1.3));
 clN[0] = noise(ice ? clW * vec2(1.3, 2.6) + 3. : warp * 1.3 + vec2(.0012, .0006) * uTime + 4.);
 clN[1] = noise(ice ? g * vec2(3.2, 11.) : warp * 2.7 + 9.);
 clN[2] = noise(ice ? g * vec2(9., 34.) : rot(.6) * clW * 5.9 + 2.);
 clN[3] = noise(ice ? clW * 3.1 + 11. : clW * 11.);
 clN[4] = noise(ice ? vec2(p.x * 4. - uTime * .02, p.y * 7. - uTime * .045) : clW * 2.3 + 8.);
 clN[5] = noise(ice ? vec2(p.x * 9. - uTime * .03, p.y * 15. - uTime * .08) : clW * vec2(14., 46.) + uTime * .03);
 clN[6] = noise(ice ? vec2(p.x * 4. - uTime * .6, p.y * 30. + p.x * 5.) : vec2(p.x * 2.2 - uTime * .02, p.y * 5. + .6 * clN[0] + uTime * .006));
 float dw = length(clW - clHitAt) - .12 - 1.7 * (1. - uHits);
 clWave = uHits * exp(-dw * dw * 34.);
 clNudge = vec2(.05 * sin(uTime * .31 + clW.x * 7.) + .3 * clWave * (1. - uHits), .7 * clWave * (1. - uHits));
 vec3 col;
 if (ice) {
  col = clIceShelf(p);
  // a gust of blown snow
  float gx = p.x + .35 - 1.5 * (1. - uCue), gust = uCue * exp(-gx * gx * 9.) + clFog * .5;
  col = mix(col, clLit, sat(gust) * clS(.3, .75, clN[6] * .7 + clN[5] * .3) * .85);
 } else col = clLake(p);
 return col;
}
