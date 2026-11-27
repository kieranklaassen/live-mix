// name: Umbrella square
// a: Morning rain
// b: Lit from shops
// what: A wet stone square seen from a high balcony, its rail and one leaf soft in the corner: people under black umbrellas cross the tram rails in loose streams, one saffron umbrella among them; or the same at night, a crowd waiting with gold rims in the light of shops, round a pool of lamplight where one red umbrella turns.
// follows: More sound brings more people, where the piece lies. Drone wets the stones, pad brightens the sky, texture is rain, phrase sends a file along a curve (at night round the lamp; each kind is a shop window). Bands widen umbrellas, keys light ribs, the loop walks the saffron one over; a hit twirls it and flings a ring of drops, a cue tips all to the light.
// own: 0 snow on stones and umbrellas at -1, dry stones with hard shadows at 1; 1 blue dusk at -1 (cold shop light by night), rose dawn at 1 (violet evening); 2 only a few people at -1, the square full at 1; 3 straight down at -1, a lower and wider view at 1; 4 white umbrellas at -1, every one another colour at 1; 5 flat parasols at -1, deep bells at 1; 6 bare sand for stones at -0.5, with surf running in at -1, a polished chequered floor in the colours of drone and pad at 1; 7 all in straight even ranks at -1, umbrellas dyed in the sounds' colours at 0.5 and in two-coloured gores at 1. The bright umbrella stays.
#define usSand clamp(-2. * uOwn[6], 0., 1.)
#define usSeaK clamp(-2. * uOwn[6] - 1., 0., 1.)
#define usChess max(uOwn[6], 0.)
#define usRank max(-uOwn[7], 0.)
#define usDye clamp(2. * uOwn[7], 0., 1.)
#define usGore clamp(2. * uOwn[7] - 1., 0., 1.)
// A smooth step that may run either way.
float usT(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
float usEdge;                 // how far inside its cell a place is, for what usFind last found
vec3 usRo, usRd, usL, usSun, usLo, usHi; // the eye, its ray, the light that falls aslant, the sky's light and its bright side
vec2 usPool;                  // where the lamp stands (b)
vec3 usS, usSC;               // the one bright umbrella: place and size; its colour
mat2 usRoll; bool usB; float usPit, usFoc, usPx, usG, usNt, usSnow, usDry, usH, usDens, usMost, usFile, usWet, usMany, usStone, usRain;
const vec4 usOne = vec4(.3, .4, 1., .5); // its chance numbers

// The hour: as it is, or carried to dusk or to dawn.
vec3 usHour(vec3 m, vec3 lo, vec3 hi) { return mix(mix(m, lo, sat(-uOwn[1])), hi, sat(uOwn[1])); }
float usV(float x) { return sat(x * usG); }
float usSq(float x) { return x * x; }
float usBell(float x) { return exp(-x * x); }
vec3 usRay(vec2 p) {
  vec3 d = vec3(usRoll * p, usFoc);
  d.yz = rot(-usPit) * d.yz;
  return normalize(d);
}
// Where the ray meets a level plane.
vec2 usAt(float y) { return usRo.xz + usRd.xz * (y - usRo.y) / min(usRd.y, -.05); }
vec3 usHold(vec3 k) { return k / max(max(k.r, max(k.g, k.b)), .05); }
vec4 usMap(vec2 c) { return piece(vec2(.5 + c.x / (19. + .5 * c.y), .46 - c.y / 19.)); }

const vec2 usWay[4] = vec2[4](vec2(-.7237, .6901), vec2(-.9125, .4091), vec2(.9553, .2955), vec2(.4976, .8674)); // which way the lanes run
// How far out in the sea a place is (under 0: on the sand); the waves run in and out.
float usSurf(vec2 q) { return dot(q, vec2(.6, .8)) - 3.6 + .7 * sin(dot(q, vec2(.8, -.6)) * .55 + .6 * sin(uTime * .07)) + .5 * (noise(q * .7 + vec2(0., uTime * .05)) - .5) + .45 * sin(uTime * .31) * (1. + uLow); }
// Who stands near a place, in one of two streams of lanes. Gives the size of the umbrella (0: nobody), where it is, its chance
// numbers (the third: how much they are there) and which way it goes.
float usFind(int k, vec2 w, out vec2 c, out vec4 h, out vec2 go) {
  float fk = float(k), amp = (usB ? .15 : .8) * (1. - usRank), fr = .3 - .05 * fk, ph = 1.7 * fk;
  vec2 e = usWay[k + int(usNt) * 2], o = vec2(-e.y, e.x), cell = (usB ? vec2(2.) : vec2(2.7, 2.35)) * (1. - usRank * (usB ? vec2(.1, -.15) : vec2(.1, -.2))), u = vec2(dot(w, e), dot(w, o));
  u.y -= amp * sin(u.x * fr + ph) + fk * 1.1;
  float lane = floor(u.y / cell.y), l1 = mix(fract(lane * .618 + fk * .37 + .2), .35, usRank), off = 0.;
  if (!usB) off = mod(uTravel * .42 * (l1 > .82 ? -.5 : .55 + .4 * l1), cell.x * 128.);
  vec2 in_ = abs(fract(vec2((u.x - off) / cell.x, u.y / cell.y)) - .5);
  usEdge = .5 - max(in_.x, in_.y);
  float i = floor((u.x - off) / cell.x), jit = (usB ? .2 : .3) * (1. - usRank);
  h.xy = hash22(vec2(mod(i, 128.), lane + 40. * fk) + 3.7); h.zw = fract(h.xy * vec2(17.3, 23.9));
  go = e; c = w;
  if (h.z > usMost) return 0.;
  vec2 v = vec2((i + .5 + jit * (h.x - .5)) * cell.x + off, (lane + .5 + jit * (h.y - .5)) * cell.y + .05 * sin(uTime * .3 + h.x * 40.));
  go = normalize(e + o * amp * fr * cos(v.x * fr + ph)) * (l1 > .82 ? -1. : 1.);
  v.y += amp * sin(v.x * fr + ph) + fk * 1.1;
  c = e * v.x + o * v.y;
  if (usRank > 0. && k > 0) h.z += usRank;
  float d = usDens + .6 * usMap(c).a * usG * usMany, far = length(c - usPool), on = 1.;
  if (usSeaK > 0.) d -= 3. * usSeaK * usT(-.9, -.2, usSurf(c));
  if (usB) {
    d = d * mix(1.1, .3, usT(1.5, 8., c.x)) + .8 * usFile * usBell((far - 4.6) / .9);
    on = usT(3.7, 3.75, far);
  } else {
    // they keep to a broad way over the square; the file bends away from it
    d = d * mix(sat(.2 + .5 * uOwn[2]), 1., usBell(dot(c - vec2(.6, 0.), vec2(.62, .78)) / 4.)) + usFile * usBell((length(c - vec2(-9.5, -7.)) - 10.) / 1.1);
  }
  d += usRank;
  on *= usT(h.z, h.z + .03, d);
  h.z = usT(0., .25, on); // how much they are there at all
  return (on > 0. ? mix(.55, 1., on) : 0.) * (1. - .12 * usRank) * (.5 + .2 * h.x + .16 * usV(uBands[int(h.w * 15.99)])) * (usB ? 1.15 : 1.);
}
// The sky as wet things mirror it.
vec3 usSky(vec3 r) {
  r.y = abs(r.y);
  float lobe = sat(dot(r, normalize(vec3(-.55, .62, .62))));
  return usLo * (.55 + .45 * r.y) + usHi * (pow(lobe, 7.) + .3 * lobe);
}
vec3 usSilk(vec4 h, vec2 c) {
  vec4 m = usMap(c);
  vec3 s = mix(vec3(.008, .009, .012), vec3(.03, .037, .05), usT(.35, 1., h.w));
  float tint = usV(m.a);
  vec3 k = usHold(m.rgb);
  s *= 1. - .45 * usNt;
  s = mix(s, s * .6 + mix(.034, .02, usNt) * k * k, .7 * tint);
  vec3 bright = pal(h.w, vec3(.42, .3, .26), vec3(.4, .28, .24), vec3(1.), vec3(0., .18, .42));
  s = mix(s, bright * bright * 1.2, sat(uOwn[4]));
  if (usDye > 0.) {
    vec3 kd = uKind[int(fract(h.w * 7.3 + h.x) * 4.99)]; kd *= kd;
    s = mix(s, kd * (.75 + .35 * h.x) * (1. + .5 * tint), usDye * .94);
  }
  return mix(s, vec3(.62, .6, .55) * (.8 + .2 * h.w) * mix(vec3(1.), k, .35 * tint), sat(-uOwn[4]));
}
// The light of five shop windows on the right, one to each kind of sound.
vec3 usShops(vec2 q) {
  vec3 c = vec3(0.);
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  for (int i = 0; i < 5; i++) {
    float y = q.y + .03 * (q.x - 9.) * (float(i) - 2.) - (float(i) - 2.) * 2.9 - .2, soft = .1 + .035 * max(10. - q.x, 0.);
    float w = usT(1.15 + soft, 1.15 - soft, abs(y));
    c += mix(vec3(1., .56, .15), usHold(uKind[i]) * .85, .27) * w * (.55 + 1.3 * usV(lv[i]));
  }
  return c * (.14 + 1.1 * exp(-max(9. - q.x, 0.) * .13));
}
// A place met on a dome: from its middle, way out, axis, height over the rim, seen from under, rib, pixel.
struct UsD { vec3 X, N, A; float up, under, ph, px; };
// One dome along the ray: how much of the pixel it fills.
float usHit(vec2 c, float hgt, float R, vec3 n, float spin, out UsD o) {
  float hh = R * usH, Rs = (R * R + hh * hh) / (2. * hh);
  vec3 C = vec3(c.x, hgt, c.y), oc = usRo - C - n * (hh - Rs);
  float b = dot(oc, usRd), q2 = dot(oc, oc) - b * b, ds = Rs * Rs - q2;
  o.A = n; o.N = n; o.X = n; o.up = o.under = o.ph = 0.; o.px = -b * usPx;
  if (ds <= 0.) return 0.;
  o.X = usRo - usRd * (b + sqrt(ds)) - C; o.up = dot(o.X, n);
  if (o.up < 0.) { o.X += usRd * 2. * sqrt(ds); o.up = dot(o.X, n); o.under = 1.; if (o.up < 0.) return 0.; }
  vec3 a1 = normalize(vec3(n.y, -n.x, 0.));
  o.ph = (atan(dot(o.X, cross(n, a1)), dot(o.X, a1) + 1e-5) + spin) / TAU * 8.;
  o.N = (o.X - n * (hh - Rs)) / Rs;
  // the hem is drawn in between the ribs
  o.up -= hh * .18 * (1. - 4. * usSq(fract(o.ph) - .5));
  return sat(.5 + min(o.up / max(length(cross(o.N, n)), .2), Rs - sqrt(max(q2, 0.))) / o.px);
}
// The silk there. thru: how much light comes through it.
vec3 usCloth(UsD o, vec2 c, float hgt, float R, vec3 silk, vec4 h, vec3 shop, float thru) {
  vec3 n = o.A, X = o.X, N = o.N, up = X - n * dot(X, n);
  float r = length(up), g = fract(o.ph) - .5, s = r / R, px = o.px, slope = max(length(cross(N, n)), .2);
  vec3 rad = up / max(r, 1e-4), tau = cross(rad, n);
  N = normalize(N + tau * g * (TAU / 8.) * 1.9 * slope);
  if (o.under > .5) N = -N;
  float rd = (.5 - abs(g)) * TAU / 8. * r;
  float seam = (1. - usT(.008, .012 + px, rd)) * usT(.03, .2, s), hem = usT(.03 * R + px, 0., o.up);
  vec3 rf = reflect(usRd, N), sky = usSky(rf);
  float fr = .03 + .8 * pow(1. - sat(dot(-usRd, N)), 3.), lit = dot(N, usL), wet = .25 + .75 * usRain, facing = sat(dot(N, vec3(-.53, .6, .6)));
  vec3 col = silk * (usLo * (.55 + .5 * N.y) + usHi * (.25 + .75 * facing)) + sky * fr * wet * (.6 + .6 * h.x);
  col += usHi * wet * .22 * usSq(usSq(facing)) * facing * facing * (1. - usNt) * (.5 + h.y);
  // light aslant, and the lamp over the pool
  vec3 sun = usSun * shop, lp = vec3(usPool.x, 5.5, usPool.y) - X - vec3(c.x, hgt, c.y); float l2 = dot(lp, lp); lp /= sqrt(l2);
  col += sun * (silk * 1.1 * max(lit, 0.) + (.5 * pow(sat(dot(rf, usL)), 12.) + .1 * sat(lit + .2) * usSq(1. - sat(dot(-usRd, N)))) * wet);
  vec3 lamp = vec3(1., .74, .42) * usNt * 12. / (4. + l2) * exp(-.03 * l2);
  col += lamp * (silk * max(dot(N, lp), 0.) * 1.3 + .14 * pow(sat(dot(rf, lp)), 14.) * wet) + silk * thru * (lamp + usLo + usHi * .5) * .3;
  col *= 1. - .5 * seam;
  col += (sky + sun) * .1 * seam * (.5 + .5 * sign(g) * dot(tau, usL)) + vec3(1., .85, .6) * seam * usV(uKeys) * .6;
  col += ((sky * .15 + sun * 1.5 * usT(0., .8, dot(rad, usL))) * wet + silk * .6 * (usHi + lamp)) * hem;
  col *= 1. - .7 * o.under;
  // snow lies on the crown
  float sn = usSnow * (1. - o.under) * usT(.62, .9, N.y + .25 * noise(X.xz * 7. + h.xy * 30.) - .28 * s);
  col = mix(col, .75 * (usLo + usHi * .5) * (.5 + .5 * N.y) + sun * max(lit, 0.) * .8 + lamp * .5, sn);
  return mix(col, usLo * .2 + sky * .3, usT(.045 + px / R, .03, s) * (1. - o.under));
}
// Somebody's coat, seen aslant from above: x aside of the middle, y up.
float usBody(vec2 d, float walk, float bag, float px) {
  float y = d.y, w = mix(.27, .17, usT(.36, .95, y)) + .07 * usT(.9, 1.35, y), leg = abs(abs(d.x - .03 * walk) - .09);
  float c = y < .36 ? usT(.065 + px, .065 - px, leg) * usT(-.02, .03, y - .05 * walk * sign(d.x)) : usT(w + px, w - px, abs(d.x));
  return max(c, bag * usT(px, -px, max(abs(d.x - .31) - .12, abs(y - .5) - .17))) * usT(1.6, 1.45, y);
}
// Aside and up, for an upright thing standing at c.
vec2 usUp(vec2 c) {
  vec2 o = c - usRo.xz; float l = max(length(usRd.xz), .04); vec2 d = usRd.xz / l;
  return vec2(d.x * o.y - d.y * o.x, usRo.y + usRd.y * dot(o, d) / l);
}
vec3 usGround(vec2 q, float tg, float mir, vec3 mcol, float foot, float shade, vec3 shop) {
  float px = tg * usPx / max(-usRd.y, .2);
  // tram rails, bent like a bow
  vec2 rc = usB ? vec2(6., -22.) : vec2(15., -5.);
  vec2 rq = q - rc; float rr = length(rq), rR = usB ? 28.6 : 17., rd = rr - rR, bed = usT(1.16 + px, 1.16 - px, abs(rd));
  float bare = max(usSand, usT(0., .6, usChess)); bed *= 1. - bare;
  vec2 s = abs(rd) < 1.16 && bare < .5 ? vec2(atan(rq.y, -rq.x) * rR, rd) : rot(.5) * q;
  // the setts
  vec2 sz = vec2(.5, .29), g = s / sz;
  g.x += .5 * mod(floor(g.y), 2.) + .3 * hash11(floor(g.y) * 1.7);
  vec2 id = floor(g), f = (g - id - .5) * sz, h = hash22(id + 7.);
  vec2 bd = .5 * sz - abs(f);
  float joint = usT(-.004, .04 + px, min(bd.x, bd.y)), fine = sat(1.3 - px * 9.);
  joint = mix(.8, joint, fine);
  if (bare > 0.) { joint = mix(joint, .9, bare); fine *= 1. - bare; }
  float n0 = noise(q * .42 + 3.), n1 = noise(q * 2.3), n2 = noise(q * 17.);
  float pud = usT(.5, .58, n0 + .14 * n1 + .1 * uLow * usG - .07) * (1. - bed * .7) * usRain * (1. - bare);
  vec2 nn = ((h - .5) * .14 * (1. - .9 * bare) + f / sz * .16 * fine) * (1. - .9 * pud) * (1. - .8 * usSnow) * mix(1.3, .7, uTone);
  // rings of rain
  vec2 rg = q * 1.4, ri = floor(rg); float ph = uTime * .6 + hash21(ri + 2.), fl = floor(ph);
  ph -= fl;
  float ring = sin(sat((length(rg - ri - .35 - .3 * hash22(ri + mod(fl, 64.) * vec2(1.3, .7))) - .33 * ph) / .18 + .5) * TAU) * (1. - ph) * usT(0., .15, ph) * (.3 + 1.7 * usV(uTexture)) * usRain;
  nn += .1 * ring * (.5 + .5 * pud) * vec2(.4, -.9);
  vec3 N = normalize(vec3(nn.x, 1., nn.y)), r = reflect(usRd, N), sky = usSky(r);
  // the houses over the way, upside down in the wet
  vec3 r1 = vec3(usRd.x - .5 * nn.x * usRd.y, -usRd.y, usRd.z - .5 * nn.y * usRd.y);
  float zt = (15. - q.y) / max(r1.z, .15), hx = q.x + r1.x * zt, hy = r1.y * zt, roof = 12. + 8. * usT(-2.2, -1.2, hx) - 5. * usT(5., 6., hx) + 1.5 * n1;
  sky = mix(sky, usLo * .5, .75 * usT(roof + 1.2, roof - 1.2, hy));
  vec4 m = usMap(q);
  vec3 tint = mix(vec3(1.), usHold(m.rgb) * 1.15, .5 * usV(m.a));
  vec3 alb = mix(vec3(.085, .083, .085), vec3(.15, .145, .14), h.x) * (.8 + .4 * n2) * (.85 + .3 * n1);
  alb = mix(alb, vec3(.36, .32, .27) * (.75 + .35 * h.x) * (.85 + .25 * n2), usDry);
  float sea = -9., foam = 0., damp = 0.;
  if (usSand > 0.) {
    float rip = sin(dot(q, vec2(4.2, 6.1)) + 3. * n1 + 5. * n0), dune = noise(q * 1.1 + 5.);
    nn += usSand * (usB ? .3 : 1.) * (vec2(.05, .07) * rip + .16 * (vec2(n2, noise(q * 19. + 7.)) - .5)) * usT(.3, .1, px);
    alb = mix(alb, vec3(.5, .41, .28) * (.8 + .2 * dune + .14 * n2 + .05 * rip), usSand);
  }
  if (usChess > 0.) {
    vec2 t = rot(.5) * q / 1.7, tf = (abs(fract(t) - .5) - .25) * 2., tw = fwidth(t) * .8 + .002;
    float even = smoothstep(-tw.x, tw.x, tf.x * .5) , evz = smoothstep(-tw.y, tw.y, tf.y * .5); even = even + evz - 2. * even * evz;
    vec3 kd = usHold(uKind[0]), kp = usHold(uKind[1]);
    alb = mix(alb, mix(.035 * kd * kd + .008, .5 * mix(vec3(1.), kp * kp, .6), even) * (.85 + .15 * n2) * (.9 + .2 * n1), usT(0., .7, usChess));
  }
  if (usSeaK > 0.) {
    sea = usSurf(q); damp = usT(-1.6, -.1, sea) * usSeaK;
    alb = mix(alb, alb * vec3(.55, .56, .6), damp);
    float w1 = sea + .35 * noise(q * vec2(2.1, 1.7) + uTime * .06), lace = noise(q * 4.3 + vec2(uTime * .05, 0.)) + .5 * noise(q * 11.);
    foam = usT(.35, .0, abs(w1 - .12)) * usT(.45, .95, lace + .35) + .75 * usT(.25, .0, abs(fract(w1 * .42 - uTime * .045) - .5)) * usT(.75, 1.1, lace) * usT(0., .6, sea) * usT(7., 2., sea);
    foam *= usSeaK * step(0., w1 + .3);
    alb = mix(alb, mix(vec3(.13, .3, .3), vec3(.012, .07, .1), usT(0., 4.5, sea)), usSeaK * usT(-.02, .25, sea));
    nn += usSeaK * usT(0., .3, sea) * .1 * (vec2(noise(q * 2.6 + uTime * .2), noise(q * 2.9 - uTime * .17)) - .5);
    alb = mix(alb, vec3(.86), sat(foam));
  }
  alb = mix(alb, vec3(.8, .82, .86) * (.9 + .1 * n1), usSnow * (.75 + .25 * usT(.3, .6, n0 + .3 * n1)));
  alb *= mix(.45, 1., joint) * (1. - usSnow) + usSnow * mix(.9, 1., joint);
  float wet = usWet * (1. - .85 * usDry) * (1. - .9 * usSnow);
  if (usSand > 0.) wet *= mix(1., .08 + .4 * damp, usSand);
  if (usChess > 0.) wet = mix(wet, max(wet, .5), usChess);
  float F = (.22 + .6 * pow(1. - sat(-usRd.y), 1.3)) * wet * mix(.45 + .55 * h.y, 1.5, pud) * mix(.3, 1., joint);
  vec3 col = alb * (usLo * .8 + usHi * .3) * (1. - .55 * foot) + mix(sky * tint, mcol, mir) * F;
  vec3 sun = usSun * shop * (1. - shade);
  float rake = usB ? sat(usL.y * .9 + dot(nn, usL.xz) * 5.) : max(dot(N, usL), 0.);
  col += sun * (alb * rake * 2.6 * (1. - .5 * foot) + wet * .22 * pow(sat(.5 + nn.x * 5.), 3.) * joint * usNt);
  // the pool of lamplight
  vec2 lq = q - usPool; float l2 = dot(lq, lq);
  vec3 lamp = vec3(1., .76, .44) * usNt * (exp(-l2 * .17) + .12 * exp(-l2 * .05)) * (1. - .6 * usSnow);
  lq = q - usS.xy; lamp = mix(lamp, lamp * (.25 + 2. * usSC), .75 * exp(-dot(lq, lq) * .9));
  col += lamp * (alb * 3.2 + wet * .14 * (.5 + h.y) * joint) * (1. - .5 * foot);
  // the rails
  float rl = abs(abs(rd) - .72), steel = usT(.05 + px, .05 - px * .2, rl) * min(1., .06 / px) * (1. - bare), slot = usT(.1 + px, .06, abs(abs(rd) - .64)) * (1. - bare);
  col *= 1. - .5 * slot * (1. - usSnow * .6);
  col = mix(col, (sky * mix(tint, vec3(1.), .6) * .8 + .5 * sun + .35 * lamp) * (1. - .7 * mir) + .01, steel * .85);
  return col;
}
vec3 render(vec2 p) {
  usG = .35 + 1.45 * uEnergy; usNt = step(.5, uVar); usB = usNt > .5;
  usSnow = sat(-uOwn[0]); usDry = sat(uOwn[0]);
  float hw = .5 * uRes.x / uRes.y, cue = 4. * uCue * (1. - uCue), asp = usT(.3, .8, hw), pad = usV(uPad);
  usPit = mix(.94, 1.03, usNt) + (uOwn[3] < 0. ? -.5 : -.17) * uOwn[3];
  usFoc = 1.32 * mix(1.06, .94, uSpace) * mix(1., 1.3, usNt) * exp2(-.25 * max(uOwn[3], 0.));
  usRoll = rot(mix(.05, -.07, usNt));
  usRo = 15.5 * vec3(0., sin(usPit), -cos(usPit)) + vec3(.15 * sin(uTime * .03), 0., .2 * sin(uTime * .023));
  usPx = 1. / (uRes.y * usFoc);
  usH = .46 * exp2(1.15 * uOwn[5]);
  usWet = .6 + .5 * usV(uDrone);
  usRain = 1. - max(usDry, usSnow);
  usStone = usT(.15, .4, (1. - .85 * usDry) * (1. - .9 * usSnow));
  usMany = exp2(1.2 * uOwn[2]);
  usDens = (mix(.12, .34, usNt) + mix(.4, .6, usNt) * usV(uLevel)) * usMany;
  usFile = .6 * usV(uPhrase) * min(usMany, 1.);
  usMost = usRank + usDens * 1.1 + usFile * 1.4 + .7 * usG * usMany;
  if (!usB) {
    usLo = usHour(vec3(.29, .37, .46), vec3(.1, .16, .3), vec3(.45, .36, .42));
    usHi = usHour(vec3(1.75, 1.58, 1.28), vec3(.3, .42, .65), vec3(1.6, .95, .5)) * (.8 + .5 * pad + .4 * uCue);
    usSun = usDry * usHour(vec3(2.2, 1.9, 1.5), vec3(.4, .55, .9), vec3(2.6, 1.4, .7));
    usL = normalize(vec3(-.62, .62, .42));
  } else {
    usLo = usHour(vec3(.02, .03, .062), vec3(.01, .02, .05), vec3(.14, .13, .3));
    usHi = usLo * (.8 + .8 * pad);
    usSun = usHour(vec3(2.5, 1.8, .95), vec3(.8, 1.3, 2.), vec3(2.2, 1.05, .9)) * (1. + .5 * uCue);
    usL = normalize(vec3(.93, .34, .12));
  }
  usPool = vec2(-2.2 * asp, .6);
  // the bright one: the loop walks it across, or it stands in the lamplight
  if (!usB) {
    float l = fract(uLoop + .36); l += .09 * sin(TAU * l);
    vec3 d = usRay(mix(vec2(hw + .1, -.46), vec2(-hw - .1, .4), l) + vec2(0., .06 * sin(PI * l)));
    usS = vec3(usRo.xz + d.xz * (1.6 - usRo.y) / min(d.y, -.1), .74); usSC = vec3(.85, .36, .015);
  } else { usS = vec3(usPool + vec2(.3, -.2), .95); usSC = vec3(.5, .012, .012); }
  if (usDye > 0.) { vec3 kd = uKind[4]; usSC = mix(usSC, kd * kd * 1.05, usDye); }
  usRd = usRay(p);
  vec2 lean = (usB ? vec2(.8, .2) : vec2(-.7, .7)) * .42 * cue, c, go, cc = vec2(0.);
  float dc = 0., dh = 0., dR = 1., bc = 0., mir = 0., foot = 0., shade = 0., tg = -usRo.y / min(usRd.y, -.05), px = tg * usPx, R, a;
  vec2 q = usRo.xz + usRd.xz * tg; vec4 h, hh = vec4(.5);
  vec3 bcol = vec3(0.), mcol = vec3(0.), col;
  UsD met, best;
  // the umbrellas, the highest first
  for (int k = 2; k >= 0; k--) {
    float hgt = 1.72 + .26 * float(k);
    if (k == 2) { R = usS.z; c = usS.xy; h = usOne; go = usB ? vec2(.6, .8) : vec2(-.8, .6); }
    else R = usFind(k, usAt(hgt + .14), c, h, go);
    if (R < .03) continue;
    vec2 tip = go * (.12 + .05 * sin(uTime * .7 + h.x * 30.)) + .1 * (h.zw - .5) + lean;
    a = usHit(c, hgt, R, normalize(vec3(tip.x, 1., tip.y)), h.y * 6. + (k == 2 ? mod(uTime * mix(.06, .2, usNt), TAU) + 4.8 * uHits * (1. - uHits) : .1 * sin(uTime * .2 + h.x * 20.)), met) * h.z;
    if (a > dc) { dc = a; dh = k == 2 ? 9. : hgt; dR = R; cc = c; hh = h; best = met; }
    if (dc > .5) break;
  }
  if (dc < .99) for (int k = 0; k < 3; k++) {
    float hgt = 1.72 + .26 * float(k);
    R = usS.z; c = usS.xy; h = usOne;
    // coats
    if (k < 2) R = usFind(k, usAt(.68), c, h, go);
    if (R > .03) {
      a = h.z;
      vec2 d = usUp(c), e = q - c;
      float b = usBody(d, usB ? .4 : sin(uTravel * 1.3 + h.x * 40.), step(.55, h.y), px * .7) * a;
      if (uOwn[3] < 0.) b *= usT(.03, .1, length(usRd.xz)); // right under the eye nobody's coat shows
      bcol = mix(bcol, mix(vec3(.02, .022, .028), vec3(.07, .055, .045), h.w) * (usLo + usHi * (.35 - .8 * d.x) + usSun * (.4 + 2. * d.x * sign(usL.x))), b);
      bc = max(bc, b);
      foot = max(foot, a * exp(-dot(e, e) * 2.5));
    }
    // what the stones hold of them
    if (k < 2 && usStone > 0. && usSand < 1.) R = usFind(k, usAt(-1.3), c, h, go);
    if (R > .03 && usStone > 0. && usSand < 1.) {
      vec2 e = usAt(-hgt - .1) - c, d = usUp(c); e.y *= .8; a = h.z * usStone * (1. - usSand) * (k < 2 ? usT(0., .14, usEdge) : 1.);
      float m = usT(1.25, .65, length(e) / R) * a * .85, n = usT(.34, .1, abs(d.x)) * usT(.05, -.1, d.y) * usT(-1.75, -1.2, d.y) * a * .8;
      mcol = mix(mcol, (k == 2 ? usSC : vec3(.02)) * (usLo + usHi * .6 + usNt * .5), m);
      mcol *= 1. - n * (1. - m); mir = max(mir, max(m, n));
    }
    // and what they keep the low light from
    if (usDry + usNt > .01) {
      vec2 sw = q + usL.xz * (hgt / usL.y);
      if (k < 2) R = usFind(k, sw, c, h, go);
      shade = max(shade, usT(1.06, .92, length(sw - c) / max(R, .01)) * h.z * step(.03, R) * mix(.9, .65, usNt));
    }
  }
  vec3 shop = vec3(1.);
  if (usB) shop = usShops(dc > .5 ? cc + vec2(1.2, 0.) : q);
  col = vec3(0.);
  if (dc < .99) col = mix(usGround(q, tg, mir, mcol, foot, shade, shop), bcol * (usB ? .3 + shop : vec3(1.)), bc);
  if (dc > .01) {
    bool one = dh > 5.;
    vec3 sk = one ? usSC : usSilk(hh, cc);
    if (usGore > 0. && !one) sk = mix(sk, mix(vec3(.66, .62, .54), uKind[1] * uKind[1], .25 * step(.6, hh.y)), usGore * usT(.5 - .02, .5 + .02, abs(fract(best.ph * .5) - .5) * 2.) );
    col = mix(col, usCloth(best, cc, one ? 2.24 : dh, dR, sk, hh, shop, one ? 1. + usV(uMic) : .3), dc);
  }
  // rain, falling toward the foot of the balcony
  vec2 np = usRoll * p + vec2(0., usFoc / max(tan(usPit), .2)); float nr = length(np);
  vec2 rs = vec2(atan(np.x, np.y + 1e-5) * 70., nr * 2.2 + mod(uTime * 2., 64.)), ri = floor(rs); rs.y += hash11(ri.x) * 8.; ri.y = mod(floor(rs.y), 64.);
  float fy = fract(rs.y), drop = step(.62, hash21(ri + .3)) * usT(0., .1, fy) * usT(.35, .1, fy) * usT(.09, 0., abs(fract(rs.x) - .5)) * usT(.1, .4, nr);
  col += (usLo * .35 + usHi * .16 + usSun * .06 * usNt * shop) * drop * (.15 + usV(uTexture)) * usRain;
  // drops flung off the bright one by a hit, and a ring of light on the stones
  vec2 e = usAt(2.1) - usS.xy; float er = length(e), ra = usS.z * (2.15 - 1.1 * uHits), ea = (atan(e.y, e.x + 1e-5) / TAU + .15 * uHits) * 22.;
  float hd = length(vec2((fract(ea) - .5) * TAU * er / 22., er - ra - .12 * (hash11(mod(floor(ea), 22.)) - .5)));
  col += uHits * usG * ((usHi + usSun * .5 + usSC * .6 + .4) * (.9 * usT(.055 + px, .02, hd) + .22 * usBell((er - ra) / .16))
    + (usHi * .22 + usSC * .35) * usBell((length(q - usS.xy) - 3. + 1.6 * uHits) / .4) * (1. - dc));
  // the balcony: an iron rail and one leaf, too near to be sharp
  vec2 f = (p - vec2(-min(hw, .89), -.5)) / mix(.6, 1., asp);
  float al = dot(f, vec2(.42, .908)) - .135, bar = max(usT(.034, .018, abs(al)), usT(.026, .012, abs(dot(f - vec2(.12, 0.), vec2(.985, .17)))) * usT(0., -.02, al));
  col = mix(col, usLo * .035 + (usHi * .1 + usSun * .05 * usNt) * usT(.004, .022, al), bar * .96);
  f -= vec2(.16 + .004 * sin(uTime * .5), .135); f = rot(.75 + .04 * sin(uTime * .37) + .2 * cue) * f; f.y *= 1.4;
  float la = atan(f.x, -f.y + 1e-5), ll = length(f), edge = .1 * (1. + .035 * cos(la * 11.)) * (1. - .6 * usT(.35, 0., PI - abs(la)));
  vec3 leaf = mix(vec3(.06, .1, .04), vec3(.035, .06, .025), usT(.025, 0., abs(ll - .062)) * .6) * (.85 + 4. * f.y + .15 * cos(la * 11.));
  col = mix(col, leaf * (usLo + usHi * .55 + .12 * usSun * usNt), usT(edge + .013, edge - .013, ll));
  return screenOf(col * 1.15);
}
