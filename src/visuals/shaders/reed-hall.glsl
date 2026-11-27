// name: Reed hall
// a: Arches inside
// b: Over the marsh
// what: Inside a long hall built only of reeds: bundles bend overhead in arch after arch, white marsh light comes through a lattice at the far end and lies in lozenges on the mats, a thread of smoke rises over coffee pots; or the same hall from a boat at dawn, mirrored in still water, with someone poling past in the mist.
// follows: Each arch is a place in the loop: what sounds there warms its reeds, the playhead walks down. Drone is the far light or sun, pad the gold, texture dust or ripples, phrase the smoke or the boat's lamp. Bands open columns of the lattice and ruffle the water. A hit flares the hearth as someone passes, or is a fish ring; a cue lets the sun in, keys light holes.
// own: 0 moonlit night at -1, red sunset at 1; 1 fresh green reeds at -1, bleached grey ones in dusty air at 1; 2 a low wide hall at -1 (outside long as well), a tall pointed one at 1; 3 few stout arches at -1 (outside bare water, no boat), many thin ones at 1 (more reeds and boats); 4 clear air at -1, thick smoke or mist at 1; 5 seen from low down at -1, from high up at 1; 6 bare ribs with no mats on them at -1, the floor under water at 1 (b: ice and lying snow at 1); 7 lying down and looking up at -1 (b: straight at its lit end), the far end open to the sun at 1 (b: standing back, with other halls beyond)
float rhW, rhH, rhPeak, rhTall; // the hall: half its width, its height, how pointed, its curve's height
float rhStep, rhR, rhN; // from arch to arch, how thick, how many in the loop
float rhFar, rhPx, rhGain; // where the lattice stands, a pixel at distance 1, how strong the answers
float rhNight, rhEve, rhDrone, rhPad, rhTex, rhPhr;
vec3 rhSky, rhGlow, rhReed, rhDay, rhBeam, rhSun, rhLamp;
const float rhFirst = .95;
const vec2 rhHearth = vec2(1., 3.1);
vec3 rhInk(vec3 k) { return k / max(max(k.r, max(k.g, k.b)), .05); }
float rhSq(float x) { return x * x; }
// Falls from 1 at lo to 0 at hi.
float rhOff(float hi, float lo, float x) { return 1. - smoothstep(lo, hi, x); }
// 1 inside an edge (d below 0), w its softness.
float rhIn(float w, float d) { return rhOff(w, -w, d); }
// The curve of an arch: how far outside it q is, which way is out, how far up (0 foot, 1 crown).
float rhCurve(vec2 q, out vec2 n, out float s) {
 vec2 e = 1. / vec2(rhW + rhPeak, rhTall), c = vec2(abs(q.x) + rhPeak, q.y) * e, g = c * e;
 float k0 = length(c), k1 = max(length(g), 1e-3), y = max(q.y / rhH, .0);
 n = g / k1; if (q.x < .0) n.x = -n.x;
 s = y / (abs(q.x) / rhW + y + 1e-3);
 s -= .36 * s * (1. - s) * (1. - 2. * s);
 return k0 * (k0 - 1.) / k1;
}
// Where a line enters and leaves the vault drawn k as big (misses: enters after it leaves).
vec2 rhVault(vec3 o, vec3 d, float k) {
 vec2 e = 1. / vec2(rhW + rhPeak, rhTall), r = vec2(-1e3, 1e3), v = d.xy * e;
 float a = max(dot(v, v), 1e-5);
 for (int i = 0; i < 2; i++) {
  vec2 u = (o.xy + vec2(i == 0 ? rhPeak : -rhPeak, .0)) * e;
  float b = dot(u, v), h = b * b - a * (dot(u, u) - k * k);
  if (h < .0) return vec2(1e3, -1e3);
  h = sqrt(h);
  r = vec2(max(r.x, (-b - h) / a), min(r.y, (h - b) / a));
 }
 return r;
}
// How open the lattice is, blurred by soft; keyed is 1 in the holes the keys light.
float rhLattice(vec2 w, float soft, out float keyed) {
 vec2 n, d = mat2(1., 1., 1., -1.) * vec2(w.x / rhW * 5.18, w.y * 1.5), id = floor(d), f = abs(d - id - .5);
 float s, c = rhCurve(w, n, s), b = soft * 2.2, open = .17 + .14 * sat(band((id.x + id.y + 1.) / 20.7 + .5) * rhGain);
 keyed = smoothstep(.72, .9, hash21(id + 3.));
 float hole = mix(rhOff(open + b, open - b, max(f.x, f.y)), 4. * open * open, smoothstep(.2, .7, b));
 float post = min(abs(abs(w.x) - .36 * rhW), abs(w.x));
 hole = hole * rhOff(.02, -.03, c + .3) * smoothstep(.26, .31, w.y) * smoothstep(.06, .11, post);
 if (uOwn[7] > .0 && uVar < .5) hole = mix(hole, rhOff(.02 + soft, -.03 - soft, c + .24) * smoothstep(.0, .05, w.y), uOwn[7]);
 return hole;
}
// The light the piece puts in the reeds, and how strong.
vec3 rhSounds(float place, float room, out float on) {
 vec4 m = piece(vec2(clamp(place, .0, 1.), .06 + .88 * room));
 float ph = place - uLoop;
 on = sat(m.a * 1.5 * rhGain) + .6 * exp(-ph * ph * 100.) * sin(PI * uLoop) * sat(uLevel * 2.);
 return mix(vec3(1., .8, .5), rhInk(m.rgb), .5 * sat(m.a * 8.));
}
// ---- inside ----
#define RH_BARE (-min(uOwn[6], .0))
#define RH_WET max(uOwn[6], .0)
#define RH_OPEN max(uOwn[7], .0)
float rhRib(vec3 q) {
 vec2 n; float s, c = rhCurve(q.xy, n, s), z = mod(q.z - rhFirst + .5 * rhStep, rhStep) - .5 * rhStep;
 float t = abs(fract(s * 6. + .5) - .5);
 return length(vec2(c + .8 * rhR, z)) - rhR * (1.18 - .5 * s) * (1. - .07 * rhOff(.1, .0, t));
}
// From the middle of a cushion at the foot of the walls.
vec3 rhSeat(vec3 q) {
 vec3 d = vec3(q.x < .0 ? q.x + .74 * rhW : q.x - .74 * rhW, (q.y - .14) * 1.2, mod(q.z - rhFirst, rhStep) - .5 * rhStep);
 d.z -= clamp(d.z, -.2 * rhStep, .2 * rhStep);
 return d;
}
float rhSeatD(vec3 q) { return .83 * (length(rhSeat(q)) - .2); }
// Someone passes outside, at a hit.
float rhPasser(vec2 w, float soft) {
 vec2 q = w - vec2((1.3 * uHits - .5) * rhW * .6, .0);
 float d = length(vec2(q.x, q.y - clamp(q.y, .2, 1.4))) - .45 + .15 * q.y;
 return 1. - uHits * rhOff(.06 + soft, -.04, d);
}
// All light that falls at q.
vec3 rhLight(vec3 q, vec3 N, float ao) {
 // the door behind us, the bright end, what the floor throws up
 vec3 v = vec3(-.6, 1.5, -2.2) - q, e = vec3(.0, 1.3, rhFar) - q;
 float d = dot(v, v), f = dot(e, e), b = e.z - 2.6, keyed;
 vec3 c = rhLamp * sat(dot(N, v) / sqrt(d) * .75 + .25) * 12. / (2.5 + d + .16 * d * d) * (.7 + .8 * rhPad);
 c += rhDay * sat(dot(N, e) / sqrt(f) * .8 + .2) * 6. / (1.5 + f) * (.5 + .8 * rhDrone);
 c += rhBeam * vec3(.8, .5, .22) * (.6 - .4 * N.y) * .3 / (1. + .3 * b * b) + rhDay * vec3(.013, .011, .01);
 c *= ao;
 // the sun through the lattice; at a cue it reaches our feet
 vec2 w = q.xy + rhSun.xy / rhSun.z * e.z;
 float m = rhLattice(w, .01 + .005 * e.z, keyed) * rhPasser(w, .1), wave = e.z / rhFar - 1.05 * (1. - uCue);
 m *= .2 + .8 * rhOff(rhFar, 1.5, e.z) + 2.2 * uCue * exp(-wave * wave * 7.);
 if (uOwn[6] < .0) {
  // with no mats the sun comes between the ribs as well
  const vec3 L = vec3(-.5, .75, .43);
  float tl = max(rhVault(q + L * .05, L, 1.).y, .0), z = (q.z + L.z * tl - rhFirst) / rhStep;
  c += RH_BARE * (rhDay * .16 * ao + rhBeam * .55 * smoothstep(rhR * .8, rhR * 1.3, abs(z - floor(z + .5)) * rhStep) * sat(dot(N, L) * 1.4));
 }
 return c + rhBeam * m * (1. + 1.5 * keyed * uKeys * rhGain) * sat(dot(N, rhSun) * 2.2);
}
// The sky seen from inside, over water where the end is open.
vec3 rhOutOf(vec3 d) {
 vec2 g = d.xy / max(d.z, .15);
 float cl = fbm(vec2(d.x * 2., d.y * 4.) / (.45 + abs(d.y)) + vec2(.01 * uTime, 3.));
 vec3 c = rhDay * mix(vec3(1., .94, .86), vec3(.2, .33, .5), smoothstep(.0, .9, abs(d.y))) * (.42 + .5 * cl) * (.9 + .3 * rhDrone);
 vec2 s = vec2(g.x, abs(g.y)) - vec2(-.1, .19);
 c += RH_OPEN * rhBeam * (.12 * exp(-dot(s, s) * 14.) + 1.2 * rhOff(.055, .048, length(s)) * step(.0, g.y));
 if (g.y < .0) {
  float z = 1. / max(-g.y, .01), w = noise(vec2(g.x * z * 5., z * 5. + uTime * .3)) + .5 * noise(vec2(g.x * z * 13., z * 11. - uTime * .4));
  c = mix(c, rhSky * .7, .45) * (.7 + .4 * w) + rhBeam * exp(-s.x * s.x * 90.) * smoothstep(.75, 1.15, w) * .5;
 }
 float far = .018 + .03 * noise(vec2(g.x * 7., 2.)); 
 vec2 st = d.xy / max(d.z + d.y * .5, .2) * 34.; float sr = hash21(floor(st));
 c += rhNight * step(.9, sr) * rhOff(.13, .03, length(fract(st) - .5)) * smoothstep(.0, .3, d.y) * vec3(.5, .55, .6) * (.6 + .4 * sin(uTime * .6 + sr * 700.));
 return mix(c, rhDay * rhReed * .35, RH_OPEN * rhIn(.004, abs(g.y) - far));
}
// What the flooded floor shows of the hall.
vec3 rhMirror(vec3 q, vec3 rd) {
 vec2 g = q.xz * vec2(2.4, 1.1), sl = vec2(noise(g + vec2(.0, uTime * .17)), noise(g * 1.7 - vec2(uTime * .13, 4.))) - .5;
 sl += .2 * (vec2(noise(g * 5.1 + vec2(uTime * .3, .0)), noise(g * 4.3 - vec2(2., uTime * .35))) - .5) * (.4 + rhTex);
 vec2 fq = q.xz - rhHearth * vec2(.3, 1.2); float fr = length(fq) + 1e-3, fx = (fr - .2 - 1.8 * (1. - uHits)) * 9., ring = exp(-fx * fx * .25) * uHits;
 sl = sl * .16 / (1. + .25 * length(q - vec3(.0, 1., .0))) + fq / fr * cos(fx) * ring * .3;
 vec3 r = normalize(vec3(rd.x + sl.x, max(-rd.y + sl.y * .6, .02), rd.z));
 float tr = max(min(rhVault(q, r, 1. - .8 * rhR / rhW).y, (rhFar - q.z) / r.z), .0), s, keyed, on;
 vec3 y = q + r * tr, c; vec2 n; rhCurve(y.xy, n, s);
 if (y.z > rhFar - .02) {
  float m = rhLattice(y.xy, .03 + .02 * length(sl), keyed);
  c = mix(rhReed * .04, mix(rhDay * 1.6 * (.75 + .6 * rhDrone), rhOutOf(r), RH_OPEN), m * rhPasser(y.xy, .05)) * (1. + keyed * uKeys * rhGain);
 } else {
  float z = (y.z - rhFirst) / rhStep, k = floor(z + .5), rib = rhIn(.05, abs(z - k) * rhStep - rhR * (1.18 - .5 * s));
  vec3 ink = rhSounds((k + .5) / rhN, y.x < .0 ? .5 * s : 1. - .5 * s, on);
  c = rhReed * mix(.3, .95, rib) * (rhLight(y, vec3(-n, .0), .9) + ink * on * on * .45 * rhGain);
 }
 float f = 1. + rd.y;
 return c * mix(.35, 1., sat(f * f * f)) + rhDay * ring * sat(sin(fx)) * .2;
}
// A coffee pot, from its side.
float rhPot(vec2 q) {
 float d = (length((q - vec2(.0, .11)) / vec2(.1, .115)) - 1.) * .1;
 d = smin(d, length(vec2(q.x, q.y - clamp(q.y, .2, .27))) - .045, .05);
 d = smin(d, length((q - vec2(.0, .3)) * vec2(.6, 1.2)) - .035, .02);
 d = min(d, max(length(q - vec2(-.09, .27)) - .065, .045 - length(q - vec2(-.115, .305))));
 return min(d, abs(length((q - vec2(.09, .18)) * vec2(1., .7)) - .06) - .011);
}
vec3 rhInside(vec2 p) {
 float wide = smoothstep(.5, 1.5, uRes.x / uRes.y), v = uOwn[5], foc = .86 * mix(.8, 1., wide), ember = .35 + .4 * rhPhr + .9 * rhNight + 1.2 * uHits;
 vec3 ro = vec3(-.42 * wide, 1.32 + (v > .0 ? 1. : .85) * v, .5 * sin(uTravel * .03) - .1);
 vec3 rd = normalize(vec3(p.x + .17 * wide, p.y + .06 - .2 * v, foc));
 if (uOwn[7] < .0) { rd.yz *= rot(.82 * uOwn[7]); rd.z = max(rd.z, .02); rd = normalize(rd); }
 rhPx = 1. / (foc * uRes.y);
 rhFar = 10.2; rhN = (rhFar - rhFirst) / rhStep + .2; rhSun = normalize(vec3(-.2, .29, 1.));
 float ends = (rhFar - ro.z) / rd.z, tf = rd.y < -1e-3 ? -ro.y / rd.y : 1e3, tx = min(min(tf, ends), rhVault(ro, rd, 1.).y);
 // arches and cushions: only the part they fill is searched
 float a = max(dot(rd.xy, rd.xy), 1e-5), t = max(rhVault(ro, rd, 1. - 1.85 * rhR / rhW).y, .05);
 vec2 oc = ro.xy - vec2(rd.x * 10. + ro.x > .0 ? .74 * rhW : -.74 * rhW, .13);
 float b = dot(oc, rd.xy), h = b * b - a * (dot(oc, oc) - .06), best = 1e3, last = 1e3;
 if (h > .0 && b < .0) t = min(t, max((-b - sqrt(h)) / a, .05));
 bool hit = false;
 for (int i = 0; i < 28; i++) {
  if (t > tx) break;
  vec3 q = ro + rd * t;
  float d = rhRib(q), m; if (q.y < .4 && uOwn[6] <= .0) d = min(d, rhSeatD(q));
  m = d / (t * rhPx);
  if (m < .6) { hit = true; break; }
  if (m > last) best = min(best, last);
  last = m;
  t += d * .92;
 }
 if (!hit) t = tx;
 vec3 q = ro + rd * t, alb = rhReed, N = vec3(.0, .0, -1.), col, add = vec3(.0);
 vec2 n;
 float s, c = rhCurve(q.xy, n, s), z = (q.z - rhFirst) / rhStep, k = floor(z + .5), side = q.x < .0 ? 17. : 3., fp = t * rhPx, ao = 1., lath = .0, keyed, seat = hit && q.y < .4 && uOwn[6] <= .0 ? rhSeatD(q) - rhRib(q) : 1.;
 float on;
 vec3 ink = rhSounds((k + .5) / rhN, q.x < .0 ? .5 * s : 1. - .5 * s, on);
 z = (z - k) * rhStep;
 if (hit && seat > .0) {
  // reeds along a bundle, rope round it
  c += .8 * rhR;
  float y = atan(z, c + 1e-4), t0 = abs(fract(s * 6. + .5) - .5), w = rhSq(fp / rhR), f1 = 1. / (1. + w * 300.), f2 = 1. / (1. + w * 3000.);
  float l0 = noise(vec2(y * 4. + k * 9., s * 9. + side)), l1 = noise(vec2(y * 18. + .6 * l0 + side, s * 9. + k * 5.)), l2 = noise(vec2(y * 55. + l0, s * 13. + k * 3. + side));
  float str = (l0 - .5) * .35 + (l1 - .5) * .8 * f1 + (l2 - .5) * 1.3 * f2;
  N = normalize(vec3(n * c, z) + 1e-5);
  N = normalize(N + cross(vec3(-n.y, n.x, .0), N) * ((l1 - .5) * f1 + (l2 - .5) * f2) * .9);
  alb *= (.75 + 1.1 * str);
  alb = mix(alb, rhReed * vec3(.45, .38, .31) * (.8 + .3 * sin(t0 * 260. + y * 2.) * f1), rhOff(.075, .05, t0));
  ao = .35 + .65 * smoothstep(-1.1, .4, -c / rhR) * smoothstep(-.1, .5, q.y);
  on *= .9 + .8 * str;
 } else if (hit) {
  N = normalize(rhSeat(q) + 1e-4);
  alb = mix(vec3(.36, .06, .035), vec3(.40, .29, .16), step(.5, hash11(floor((q.z - rhFirst) / rhStep) * 3. + side))) * (.85 + .3 * noise(q.zx * 9.));
  ao = smoothstep(-.06, .2, q.y); on = .0;
 } else if (tx == tf) {
  // mats, with a run of rugs along each wall
  N = vec3(.0, 1., .0);
  fp /= max(-rd.y, .04);
  vec2 g = rot(.785) * q.xz * 15., f = abs(fract(g) - .5);
  float f1 = 1. / (1. + fp * fp * 600.);
  alb *= (.85 + .35 * noise(q.xz * vec2(1.4, .9))) * mix(1., rhOff(.6, .3, mod(floor(g.x) + floor(g.y), 2.) > .5 ? f.y : f.x), f1);
  float rx = (abs(q.x) - .52 * rhW) / (.2 * rhW), zz = q.z / 1.9 + (q.x > .0 ? .3 : .0), rk = floor(zz), rf = zz - rk, st = abs(fract(rf * 7.) - .5);
  vec3 r = hash11(rk + side) > .5 ? vec3(.30, .045, .03) : vec3(.04, .06, .12);
  r = mix(r, vec3(.5, .3, .1), mix(.35, rhOff(.34, .28, abs(abs(rx) - .45) + st * .9), f1));
  r *= smoothstep(.0, .02, rf) * rhOff(1., .98, rf);
  alb = mix(alb, r, rhOff(1. + fp * 2., 1. - fp * 2., abs(rx)));
  // the hearth: a ring of clay with embers in it
  float hr = length(q.xz - rhHearth);
  alb = mix(alb, mix(vec3(.30, .2, .12), vec3(.1), rhOff(.36, .33, hr)), rhOff(.47 + fp, .46 - fp, hr));
  add = vec3(1., .25, .04) * ember * rhOff(.3, .05, hr) * smoothstep(.35, .8, noise(q.xz * 26.) + .2 * sin(uTime * .6 + 9. * hr));
  ao = .2 + .6 * rhOff(.85 * rhW, .6 * rhW, abs(q.x)); on = .0;
  if (uOwn[6] > .0) { alb *= 1. - .92 * RH_WET; add = mix(add, rhMirror(q, rd), RH_WET); }
 } else if (tx == ends) {
  alb *= .7; on = .0;
 } else {
  // the vault: bundles laid lengthwise
  float x = s * 14., f = fract(x) - .5, w = fp * 3.5, fade = 1. / (1. + w * w * 9.);
  float l1 = noise(vec2(x * 6. + side, q.z * .8)), l2 = noise(vec2(x * 21. + side, q.z * 1.5));
  float str = ((l1 - .5) * .6 + (l2 - .5) * fade) * fade;
  N = normalize(vec3(-n, .0) + vec3(-n.y, n.x, .0) * (q.x < .0 ? -1. : 1.) * f * 2.4 * fade);
  alb *= vec3(.78, .7, .62) * (.8 + .8 * str) * mix(1., rhOff(.5, .3, abs(f)), .9 * fade);
  ao = .75 * (.2 + .8 * smoothstep(rhR * .5, rhR * 2.6, abs(z))) * smoothstep(-.2, .9, q.y);
  on *= .7 + .4 * str;
  lath = abs(f);
 }
 col = alb * (rhLight(q, N, ao) + ink * on * on * .45 * rhGain) + add;
 if (uOwn[6] != .0 || uOwn[7] != .0) col += alb * rhLamp * uHits * .9 * exp(-rhSq((q.z - 1. - 8. * (1. - uHits)) * 1.2)); // a hit runs down the hall
 if (!hit && tx == ends) {
  float m = rhLattice(q.xy, 1.2 * fp, keyed);
  col = mix(col, rhDay * (1.6 + .6 * smoothstep(.5, 2.5, q.y)) * (.75 + .6 * rhDrone) * (1. + 1.6 * keyed * uKeys * rhGain) * (.12 + .88 * rhPasser(q.xy, .02)), m);
  if (uOwn[7] > .0) col = mix(col, rhOutOf(rd) * (.12 + .88 * rhPasser(q.xy, .02)), m * RH_OPEN);
 }
 if (uOwn[6] < .0 && !hit && lath > .0) {
  // no mats: the sky between the lengths of reed
  float w = min(fp * 3.5, .3);
  col = mix(col, rhOutOf(rd), RH_BARE * smoothstep(.13 - w, .15 + w, lath));
 }
 if (!hit) col = mix(col, rhReed * (.04 + .1 * rhLamp), .6 * sat(1.6 - best));
 // air, and the shafts of light in it
 vec2 e = rd.xy / rd.z - (vec2(.0, 1.4) - ro.xy) / (rhFar - ro.z), A = ro.xy + rhSun.xy / rhSun.z * (rhFar - ro.z), B = ro.xy + rd.xy * ends;
 float glow = exp(-dot(e, e) * 14.), mist = max(uOwn[4], .0), thin = 1. + .8 * min(uOwn[4], .0), sh = .0, zt = sat(t / ends);
 col = mix(col, rhDay * (.04 + .55 * glow + .08 * mist), (1. - exp(-t * (.02 + .03 * uSpace + .09 * mist))) * .8 * thin);
 for (int i = 0; i < 5; i++) {
  float f = (float(i) + .5) / 5. * zt; vec2 w = mix(A, B, f);
  sh += (.5 + .4 * cos(w.x * 14. / rhW + 2. * w.y)) * (.6 + sat(band(w.x / rhW * .5 + .5) * rhGain)) * smoothstep(.1, .5, w.y) * rhOff(rhH * .9, rhH * .55, w.y + .12 * w.x * w.x) * rhOff(rhW * .95, rhW * .75, abs(w.x)) * (.3 + .7 * f);
 }
 col += rhBeam * sh / 5. * zt * (.02 + .02 * uSpace + .07 * mist + .04 * uCue) * thin;
 // coffee pots, and the smoke over them
 float th = (rhHearth.y - ro.z) / rd.z, px = th * rhPx;
 vec2 hq = (ro + rd * th).xy - vec2(rhHearth.x, .0);
 if (th < t + .4 && abs(hq.x) < 1.2 && uOwn[6] < .5 && uOwn[7] > -.4) {
  col += vec3(1., .32, .07) * ember * .35 * exp(-dot(hq * vec2(1., 1.4), hq * vec2(1., 1.4)) * 7.);
  float d = hq.y > -.05 && hq.y < .6 ? min(min(rhPot(hq - vec2(-.16, .02)), rhPot((hq - vec2(.07, .0)) * 1.3)), rhPot((hq - vec2(.27, .02)) * 1.6)) : 1.;
  col = mix(col, vec3(.012, .01, .008) + rhDay * .3 * rhOff(.014, .0, -d) * sat(.4 - 4. * hq.x + hq.y) + vec3(1., .35, .08) * ember * .12 * rhOff(.2, .0, hq.y), rhIn(px, d));
  float y = max(hq.y - .2, .0), off = y * (.07 * sin(y * 4. - uTime * .5) + .12 * sin(y * 1.7 - uTime * .21 + 1.)), w = .012 + .035 * y;
  col += (rhDay * .5 + .3 * rhInk(uKind[3])) * (exp(-rhSq((hq.x + .02 - off) / w)) + .5 * exp(-rhSq((hq.x - .02 - .5 * off) / (1.7 * w)))) * smoothstep(.18, .3, hq.y) / (1. + 2.2 * y) * (.14 + .5 * rhPhr);
 }
 // dust hanging in the light
 vec2 g = p * 19. + vec2(.6 * sin(uTime * .09), .5 * cos(uTime * .07)), r = hash22(floor(g));
 g = (fract(g) - .2 - .6 * r) / (.04 + .04 * r.x);
 return col + rhDay * exp(-dot(g, g)) * smoothstep(.0, .25, .1 + .8 * rhTex - fract(r.x * 7.7 + r.y * 3.1)) * .35 * (.15 + glow);
}
// ---- over the marsh ----
vec3 rhEnd, rhAxis; float rhThin; vec2 rhDisc;
vec3 rhVeil(vec3 c, float z) { return mix(rhSky, c, exp(-z * rhThin)); }
// A clump of reeds in the water (middle, half width, height).
float rhClump(vec2 q, vec3 c, float seed, float px) {
 float x = (q.x - c.x) / c.y, cov = .0;
 if (abs(x) > 1.2 || q.y > c.z * 1.2) return .0;
 float dome = sqrt(max(1. - x * x * .7, .0)), sway = .03 * q.y * q.y * sin(uTime * .35 + q.x * 1.3) / c.z;
 for (int i = 0; i < 3; i++) {
  float f = 6. + 4. * float(i), y = q.y / c.z, u = (q.x - (x + .5 * (float(i) - .8)) * .35 * y * y - sway) * f + seed * (1. + float(i)), id = floor(u), h = hash11(id + seed), top = (.45 + .6 * h) * dome - y;
  // a stem, and a plume that hangs to one side at its tip
  float pl = smoothstep(.0, .05, top) * rhOff(.26, .06, top) * step(.3, h), w = .07 + .06 * smoothstep(.0, .9, top) + (.16 + .16 * rhTex) * pl, e = px * f + .02 + .12 * pl;
  cov = max(cov, rhIn(e, abs(u - id - .35 - .3 * h + .2 * pl) - w) * smoothstep(.0, .03, top) * min(1., (w + .1) / e));
 }
 return max(cov, rhIn(px, q.y - .13 * c.z * (1. - x * x) * (.7 + .5 * noise(vec2(q.x * 12., seed)))));
}
// A boat from its side, prow to the left, someone in its stern with a pole.
float rhLine(vec2 q, vec2 a, vec2 b) { b -= a; q -= a; return length(q - b * sat(dot(q, b) / dot(b, b))); }
float rhBoat(vec2 q) {
 float x = clamp(q.x / 2.7, -1., 1.), l = max(-x, .0), r = max(x, .0), sway = .06 * sin(uTime * .45);
 float d = max(max(q.y - .2 - .1 * x * x - .8 * pow(l, 7.) - .25 * pow(r, 6.), .66 * pow(l, 5.) + .3 * pow(r, 5.) - .05 - q.y) * .75, abs(q.x) - 2.7);
 q -= vec2(1.5, .12); q.x -= sway * q.y;
 float y = clamp(q.y, .0, 1.32);
 d = min(d, min(length(q - vec2(-.05 * y, y)) - .23 + .083 * y, length(q - vec2(-.09, 1.57)) - .1));
 d = min(d, rhLine(q, vec2(-.05, 1.25), vec2(-.45, 1.05)) - .055);
 return min(d, rhLine(q, vec2(-.85, 2.15), vec2(.6 + 2. * sway, -.3)) - .022);
}
vec3 rhOutside(vec2 p) {
 float wide = smoothstep(.5, 1.5, uRes.x / uRes.y), v = uOwn[5], foc = .95, long_ = 15. - 4. * uOwn[2], eye = .8 + .03 * sin(uTime * .3) + (v > .0 ? 2.6 : .45) * v;
 rhPx = 1. / (foc * uRes.y); rhN = long_ / rhStep;
 rhH += .5 * uOwn[2]; rhTall += .5 * uOwn[2];
 rhEnd = vec3(-5.7 + 3.4 * (1. - wide), .0, 10.6 + 2.6 * v); rhAxis = normalize(vec3(.58 - .2 * uOwn[2], .0, .82)); rhDisc = vec2(.36, .19);
 if (uOwn[7] < .0) { float a = -uOwn[7]; rhEnd = mix(rhEnd, vec3(-1.2, .0, 6.6), a); rhAxis = normalize(mix(rhAxis, vec3(.02, .0, 1.), a)); rhDisc = mix(rhDisc, vec2(.48, .3), a); }
 if (uOwn[7] > .0) { rhEnd += vec3(-1.2, .0, 3.4) * uOwn[7]; }
 rhThin = .03 * exp(-.6 * uSpace + 1.1 * uOwn[4]);
 vec2 k = vec2(p.x, p.y - .06 - .1 * v) / foc, sl = vec2(.0);
 float px = rhPx, down = max(-k.y, .0), ring = .0, fx = .0;
 vec3 warm = vec3(1., .6, .25), c;
 if (k.y < .0) {
  // water: a slow swell, and ripples each band raises at its own distance
  float t = eye / max(down, 2e-3), bd = sat(band(1. - log2(1. + t) * .22) * rhGain);
  vec2 w = vec2(k.x * t, t), g = w * vec2(.8, 1.3);
  sl = vec2(.5, 1.) * (vec2(noise(g * .9 + vec2(.0, uTime * .13)), noise(g * vec2(.7, 1.6) + vec2(3., uTime * .17))) - .5) * .03;
  sl += vec2(.6, 1.) * (vec2(noise(g * 5. + vec2(uTime * .3, 2.)), noise(g * vec2(3., 9.) - vec2(5., uTime * .4))) - .5) * (.012 + .05 * bd * uEnergy + .03 * rhTex);
  // a fish rings it
  vec2 fq = w - vec2(.45, 2.7); float fr = length(fq) + 1e-3;
  fx = (fr - .3 - 1.4 * (1. - uHits)) * 8.; ring = exp(-fx * fx * .25) * uHits;
  sl = (sl + fq / fr * cos(fx) * ring * .1) / (1. + .02 * t * t);
  px += .0015;
 }
 // the morning, its sun low in the mist
 vec2 m = k + sl, d = vec2(m.x, abs(m.y)), s2 = d - rhDisc;
 float r = length(s2), cl = noise(vec2(d.x * 1.6 + .004 * uTime, d.y * 11.));
 c = mix(rhSky, rhSky * vec3(.34, .5, .7), smoothstep(.0, .6, d.y + .2 * (cl - .5)));
 c += rhGlow * (.7 * exp(-r * 4.5) + .3 * exp(-abs(d.y - .04) * 9. - s2.x * s2.x * 2.)) * (.55 + .9 * rhDrone + .5 * uCue) + rhGlow * rhOff(.036, .03, r) * .5;
 // the far shore
 vec2 sh = eye + k.y * 60. < .0 ? m : k;
 float x = sh.x * 60., up = 1.6 + noise(vec2(x * .6, 5.)) + 3. * smoothstep(.5, .8, noise(vec2(x * .08 + 3.3, 8.)));
 c = mix(c, rhVeil(rhReed * .25, 40.), rhIn(px * 60., abs(eye + sh.y * 60.) - up));
 if (uOwn[7] > .0) {
  // other halls, one behind another
  for (int i = 0; i < 4; i++) {
   float f = float(3 - i), z = 19. + 8. * f; vec2 h = eye + k.y * z < .0 ? m : k;
   vec2 q = vec2(h.x * z - (f < .5 ? 5. : f < 1.5 ? 14.5 : f < 2.5 ? 6. : 23.) + 9. * (1. - wide), abs(eye + h.y * z));
   float L = 4.6, A = 1.35, hh = rhH * (.9 + .25 * hash11(f + 4.)), x = q.x + L - A, tt = sat((q.x + L) / (2. * L)), y = q.y / hh, on;
   float face = length(vec2(x / A, y)) - 1., body = max(max(y - 1. + .3 * tt + .7 * rhSq(max(tt * 6. - 5., .0)), -x), q.x - L), spike = max(abs(abs(x) - A) - .11, y - 1.3);
   vec3 ink = rhSounds((f + .5) / 4., .5, on);
   vec2 g = abs(fract(mat2(1.4, 1.4, 1.6, -1.6) * vec2(x, q.y)) - .5);
   vec3 hc2 = rhReed * (.24 + .12 * sin(q.x * 5.2)) * (rhSky + rhGlow * .5 * y);
   hc2 = mix(hc2, mix(rhReed * (rhSky * .8 + rhGlow * .2), warm * (.12 + .9 * rhNight + uHits) + ink * on, rhIn(px * z * 1.4, max(g.x, g.y) - .3) * rhIn(.05, face + .18)), rhIn(px * z, face));
   if (uOwn[6] > .0) hc2 = mix(hc2, rhSky * .8 + rhGlow * .1, RH_WET * smoothstep(.5, .8, y));
   c = mix(c, rhVeil(hc2, z), uOwn[7] * rhIn(px * z, min(min(face * A, body * hh), spike)));
  }
 }
 // the hall and its mirror image: the whole round of it is drawn
 vec3 ex = vec3(rhAxis.z, .0, -rhAxis.x), o = vec3(.0, eye, .0) - rhEnd, dir = vec3(k, 1.), ld, hc;
 o = vec3(dot(o, ex), eye, dot(o, rhAxis));
 float s0, ta, chord; vec2 vt;
 for (int i = 0; i < 2; i++) {
  ld = vec3(dot(dir, ex), dir.y, max(dot(dir, rhAxis), .05));
  s0 = -o.z / ld.z; vt = rhVault(o, ld, 1.); ta = max(vt.x, s0);
  chord = min(vt.y, (long_ - o.z) / ld.z) - ta;
  if (eye + dir.y * (chord > .0 ? ta : s0) > .0) break;
  dir.xy = m;
 }
 float cov = s0 > vt.x ? 1. : sat(chord * chord / (11. * rhW * px * max(ta, .1)));
 if (chord > .0 && ta > .0) {
  vec3 q = o + ld * ta; q.y = abs(q.y);
  vec2 n; float s; rhCurve(q.xy, n, s);
  if (s0 > vt.x) {
   float keyed, h = rhLattice(q.xy, px * ta * 1.2, keyed);
   hc = rhReed * 1.15 * (rhSky * .8 + rhGlow * .2);
   hc = mix(hc, vec3(.02, .016, .015) + warm * (.1 + 1.4 * sat(band(q.x / rhW * .5 + .5) * rhGain) * uEnergy + 1.2 * rhNight + 1.8 * uCue + 1.8 * keyed * uKeys + (uOwn[6] != .0 || uOwn[7] != .0 ? 1.3 * uHits : .0)), max(h, rhIn(.02, max(abs(q.x) - .42, q.y - 1.7))));
  } else {
   // its back; each bay is a place in the loop, lamplight in its mats
   float z = (q.z - .6) / rhStep, kk = floor(z + .5), w = px * ta / rhStep, fine = 1. / (1. + 60. * w), strip = noise(vec2(s * 60., q.z * 1.5)), on;
   z -= kk;
   vec3 N = normalize(ex * n.x + vec3(.0, n.y, .0) + rhAxis * z * 1.6 * rhOff(.5, .2, abs(z)));
   hc = rhReed * vec3(.5, .45, .42) * (.4 + .8 * rhOff(.5, .0, abs(z)) + .6 * (strip - .5) * fine);
   hc *= 1. - .6 * rhOff(.04 + w, .0, abs(abs(z) - .32)) * fine;
   hc *= rhSky * (.18 + .4 * sat(N.y)) + rhGlow * (.3 + 1.1 * rhPad) * (rhSq(sat(.45 + dot(N, normalize(vec3(rhDisc, 1.))))) + .2);
   vec3 ink = rhSounds((kk + .5) / rhN, .5 - .5 * n.x, on);
   if (uOwn[6] > .0) hc = mix(hc, rhSky * .75 + rhGlow * (.1 + .25 * rhPad), RH_WET * smoothstep(.62, .92, N.y + .3 * (strip - .5)));
   if (uOwn[6] < .0) { float lw = abs(fract(s * 7.) - .5); cov *= 1. - RH_BARE * .93 * smoothstep(.24, .3 + w, abs(z)) * (1. - .9 * rhIn(.04 + 3. * w, lw - .07)); }
   hc += ink * on * .9 * smoothstep(.15, .5, abs(z)) * (.35 + strip) * rhOff(.75, .2, s);
  }
  c = mix(c, rhVeil(hc, ta), cov);
 }
 // standing bundles at its end, taller than its roof
 vec2 e = abs((o + ld * s0).xy), tall = rhH * vec2(1.06, 1.3), pd = max(abs(e.x - rhW * (uOwn[7] < .0 ? mix(vec2(.98, .4), vec2(1.14, 1.42), -uOwn[7]) : vec2(.98, .4))) - mix(vec2(.28), vec2(.13), sat(e.y / tall)), e.y - tall);
 cov = rhIn(px * s0 * 1.3, min(pd.x, pd.y));
 c = mix(c, rhVeil(rhReed * .8 * (.6 + .6 * noise(e * vec2(40., 2.))) * (rhSky * .7 + rhGlow * .2), s0), cov);
 // islands, the bank, the boats, the near reeds
 float grow = .7 * max(uOwn[3], .0);
 for (int i = 0; i < 6; i++) {
  float f = float(i), z = i == 0 ? 24. : i == 1 ? 11.3 : i == 5 ? 5.4 : 30. - 5.3 * f, many = i == 1 ? 1. : sat(1. + 1.3 * uOwn[3]);
  vec2 h = eye + k.y * z < .0 ? m : k, q = vec2(h.x * z, abs(eye + h.y * z));
  vec3 lc = rhReed * (.06 + .16 * sat(q.y * .6)) * (rhSky + (.3 + 1.3 * rhPad * sat(q.y - .5)) * rhGlow);
  if (i < 2 || i == 5) cov = many * rhClump(q, i == 0 ? vec3(9.5 - 6. * grow, 2.8 + 6. * grow, 2.4 + grow) : i == 1 ? vec3(-3.6, 5., .5) : vec3(3.7 - 2.3 * (1. - wide), 1.2 + grow, (2.5 + grow) * many + .01), 7. + f * 13., px * z * 1.2);
  else {
   float way = fract(.62 + .44 * (4. - f) - mod(uTravel, 400.) * .0025), x = (way - .5) * 2.4;
   q.x -= x * z;
   float here = sat((i == 2 ? .0 : 1.) + 1.4 * uOwn[3]) * smoothstep(.0, .1, way) * rhOff(1., .9, way);
   cov = abs(q.x) < 3.2 && q.y < 2.8 ? here * rhIn(px * z, rhBoat(q)) : .0;
   lc = vec3(.016, .014, .016) + .05 * rhSky;
   // a lamp at its prow
   q -= vec2(-2.3, .75);
   c += mix(warm, rhInk(uKind[3]), .3) * rhPhr * here * (.15 * exp(-dot(q, q)) + exp(-dot(q, q) * 60.));
   z *= 1. - .6 * rhPhr;
  }
  c = mix(c, rhVeil(lc, z), cov);
  // mist lies on the water
  if (i == 1) c = mix(c, rhSky + rhGlow * .25 * exp(-rhSq((k.x - rhDisc.x) * 2.2)), sat(exp(-abs(k.y + .04 * eye) * 22.) * (.25 + .45 * noise(vec2(p.x * 2. + .02 * uTime, k.y * 8.))) * (.8 + .6 * uOwn[4])));
 }
 if (k.y < .0) {
  c = mix(c, rhSky * vec3(.12, .15, .16), .62 * smoothstep(.02, .55, down));
  c += rhGlow * (ring * (.5 * sat(sin(fx)) + .25) + exp(-rhSq((k.x - rhDisc.x) * 5.)) * smoothstep(.004, .009, sl.y) * .4 * (.5 + .8 * rhDrone + uCue));
 }
 if (uOwn[6] > .0) {
  // ice with snow blown over it, and snow in the air
  if (k.y < .0) {
   float t = eye / max(down, 4e-3); vec2 w = vec2(k.x * t, t);
   float dr = fbm(w * vec2(.22, .6)), cr = noise(w * vec2(.9, 1.6)), crack = abs(noise(w * .7 + 9.) - .5);
   vec3 sn = rhVeil(rhSky * 1.15 + rhGlow * (.16 + .3 * exp(-rhSq((k.x - rhDisc.x) * 2.))) * (.7 + .6 * smoothstep(.4, .65, dr)), t * .6);
   sn *= .86 + .24 * cr;
   c = mix(c, sn, RH_WET * (.35 + .65 * smoothstep(.3, .55, dr)) * smoothstep(.004, .03, down));
   c += RH_WET * warm * ring * .5 * sat(1. - abs(fx) * .3);
   c *= 1. - .3 * RH_WET * rhIn(.012, crack - .004) * smoothstep(.03, .1, down) * (1. - smoothstep(.3, .55, dr));
  }
  for (int i = 0; i < 3; i++) {
   float f = float(i), sc = 22. - 5. * f; vec2 g = p * sc + vec2(uTime * (.12 + .05 * f) + sin(uTime * .2 + f), uTime * (.5 + .12 * f)) + f * 7.3, hh = hash22(floor(g));
   g = fract(g) - .2 - .6 * hh;
   c += RH_WET * (.3 * rhSky + .12) * rhOff(.09 + .02 * f, .02, length(g)) * step(.4, hh.x) * (.5 + .5 * rhTex);
  }
 }
 return c * (.72 + .5 * c);
}
vec3 rhHour(vec3 day, vec3 eve, vec3 night) { return mix(mix(day, eve, rhEve), night, rhNight); }
vec3 render(vec2 p) {
 rhGain = .35 + 1.4 * uEnergy;
 rhDrone = sat(uDrone * rhGain); rhPad = sat(uPad * rhGain); rhTex = sat(uTexture * rhGain); rhPhr = sat(uPhrase * rhGain);
 rhEve = max(uOwn[0], .0); rhNight = max(-uOwn[0], .0);
 rhW = 2.3 - .35 * uOwn[2]; rhH = 3.35 + .8 * uOwn[2]; rhPeak = .04 + .04 * uOwn[2] + .5 * max(uOwn[2], .0);
 rhTall = rhH / sqrt(1. - rhSq(rhPeak / (rhW + rhPeak)));
 rhStep = 1.4 - .4 * uOwn[3]; rhR = .23 - .07 * uOwn[3];
 rhReed = mix(vec3(.66, .42, .17), uOwn[1] < .0 ? vec3(.34, .42, .13) : vec3(.45, .44, .42), abs(uOwn[1]));
 float bright = .9 + .25 * uTone + .2 * uMic;
 rhLamp = rhHour(vec3(1., .72, .40), vec3(1., .45, .22), vec3(.10, .12, .20));
 rhDay = rhHour(vec3(.92, .98, 1.), vec3(1., .5, .22), vec3(.14, .2, .36)) * bright;
 rhBeam = rhHour(vec3(1.5, 1.4, 1.2), vec3(1.5, .68, .22), vec3(.3, .42, .72)) * (2.2 + 1.2 * rhDrone);
 rhSky = rhHour(vec3(.43, .51, .57), vec3(.62, .34, .30), vec3(.035, .05, .085)) * mix(vec3(1.), uOwn[1] < .0 ? vec3(.62, 1., .72) : vec3(1.4, 1.04, .66), abs(uOwn[1]));
 rhGlow = rhHour(vec3(1., .66, .36), vec3(1.2, .36, .12), vec3(.35, .42, .52)) * bright;
 return screenOf(uVar < .5 ? rhInside(p) : rhOutside(p));
}
