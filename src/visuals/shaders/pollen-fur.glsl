// name: Pollen fur
// a: In the coat
// b: On the stamens
// what: Inside a bumblebee's coat, small as a mite: feathered golden hairs rise rank behind rank into amber dusk over dark armour, with netted, spiked and furrowed pollen hanging between them and a low sun behind; or inside a flower, pale stamens under rose petals, their split heads crusted with grains, a soft striped visitor landing.
// follows: Each kind is one grain, at its place in the piece: it swells, lights, lengthens its spikes. Drone hums in hairs, pad lights the air, texture brightens barbs, crust and dust. Bands sway hairs and stamens, the phrase bends stamens. A hit shakes a puff loose, a cue lets daylight in and opens the wings; keys glint, Tone lengthens spikes, travel rolls a grain.
// own: 0 blue moonlight at -1, white noon at 1; 1 a white coat or pale green petals at -1, a fox red coat or scarlet petals at 1; 2 almost no pollen at -1, a crowd at 1; 3 grains small, smooth and furrowed at -1, large and long-spiked at 1; 4 bare hairs or straight stamens at -1, deep plumes or bowed stamens at 1; 5 near and low at -1, far back and high at 1; 6 hairs swept over by wind at -1, fanned out from one tuft at 1 (b: short petals under open sky at -1, many narrow ones at 1); 7 a specimen on pale paper at -1, dusk with far soft lights at 1, both dyed in the sounds' colours
#define PFP max(-uOwn[7], 0.)
#define PFK max(uOwn[7], 0.)
#define PFW max(-uOwn[6], 0.)
#define PFF max(uOwn[6], 0.)
float pfOff(float lo, float hi, float x) { return 1. - smoothstep(lo, hi, x); }
vec2 pfP, pfH, pfSun;
float pfPx, pfDay, pfSway, pfSide, pfPower, pfComb; // an edge; a cue's daylight; the lean of hairs; the sun's side and strength; barbs
vec3 pfLamp, pfAir, pfFill, pfCoat; // the sun's light, the lit haze, the light in the shade, what the fur lets through
// The one grain here: from its middle, radius, how much it plays, how far it has rolled, kind, toward the light.
vec2 pfQ;
float pfR, pfOn, pfRoll;
int pfK;
float pfBig() { return exp2(.4 * uOwn[3]); }
vec3 pfL;
float pfSq(float x) { return x * x; }
// Between three worlds, at -1, 0 and 1.
vec3 pfWorld(float o, vec3 low, vec3 here, vec3 high) { return o < 0. ? mix(here, low, -o) : mix(here, high, o); }
float pfWorld(float o, float low, float here, float high) { return o < 0. ? mix(here, low, -o) : mix(here, high, o); }
// 1 inside an edge, 0 outside, softened by b.
float pfIn(float x, float edge, float b) { x = sat((edge + b - x) / (2. * b)); return x * x * (3. - 2. * x); }
// The grains of drone, pad, texture, phrase and hit: pigment, and build (spikes, net, furrows).
const vec3 PF_SKIN[5] = vec3[5](vec3(.95, .58, .07), vec3(.95, .76, .22), vec3(.95, .38, .05), vec3(.96, .26, .03), vec3(.36, .13, .62));
const vec3 PF_MAKE[5] = vec3[5](vec3(0, 1, 0), vec3(0, .25, 1), vec3(.16, 0, 0), vec3(.34, 0, 0), vec3(.22, 0, 0));
void pfHear(int k, vec2 at) {
  float lv = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : sat(uHits + .5 * uCue);
  pfK = k;
  pfOn = sat(.75 * lv + .4 * piece(vec2(.5 + at.x / 1.8, .5 - at.y)).a);
}
vec3 pfDye() { return uOwn[7] != 0. ? mix(PF_SKIN[pfK], uKind[pfK] * uKind[pfK] * 1.1, .85 * abs(uOwn[7])) : PF_SKIN[pfK]; }
vec3 pfTint() { return pfDye() * mix(vec3(1.), .35 + 1.4 * uKind[pfK] * uKind[pfK], .35 * pfOn); }
vec3 pfFire() { return pfDye() * mix(vec3(1.), 2. * uKind[pfK] * uKind[pfK], .35) * pfOn * (.3 + .9 * uEnergy); }

// The light on a grain, or on a spike of it.
vec3 pfLit(vec3 n, vec2 q, vec3 skin) {
  vec2 side = pfL.xy / (length(pfL.xy) + 1e-3);
  float rim = 1. - sat(n.z);
  vec3 c = skin * (pfFill * (.65 + .35 * n.y) + pfLamp * sat(dot(n, pfL) * .63 + .22)) + skin * skin * pfLamp * .5 * smoothstep(-1.1, 1.2, dot(q, side));
  return c + pfLamp * rim * rim * sqrt(rim) * smoothstep(-.7, .8, dot(n.xy, side)) * mix(vec3(.6), skin, .6) * 1.1;
}
// The grain of pollen here.
void pfGrain(inout vec3 col) {
  vec2 q = pfQ / max(pfR, 1e-3);
  float r = length(q);
  if (r > 1.9) return;
  float b = 1.2 * pfPx / max(pfR, 1e-3), N = pfK == 1 ? 13. : pfK == 2 ? 11. : 8., space = PI / N;
  vec3 make = pfWorld(uOwn[3], vec3(0, 0, 1), PF_MAKE[pfK], vec3(.36, .15, 0)), skin = pfTint(), fire = pfFire();
  make.x *= 1. + .5 * pfOn + .5 * (uTone - .5);
  col += fire * .2 * exp(-r * r * .77) * pfOff(1., 1.75, r) * smoothstep(0., .02, pfR);
  vec2 t1 = vec2(.6 + 1.3 * float(pfK), (pfK == 1 ? -.5 : .5 + float(pfK)) - pfRoll), C = cos(t1), S = sin(t1);
  mat3 m = mat3(C.x, 0., -S.x, S.x * S.y, C.y, C.x * S.y, S.x * C.y, -S.y, C.x * C.y);
  float R = 1. + .45 * make.x;
  vec3 o = normalize(vec3(q, sqrt(max(R * R - r * r, 0.)) + 1e-4)) * m;
  vec3 body = r < 1. ? vec3(q, sqrt(1. - r * r)) : vec3(q / r, 0.);
  float th = acos(clamp(o.y, -1., 1.)), ph = atan(o.z, o.x + 1e-5);
  float row0 = floor(th / PI * N), f1 = 4., f2 = 4., zTop = -2., spike = 0., along = 0.;
  vec3 s1 = vec3(0.), s2 = vec3(0.), spikeN = vec3(0., 0., 1.);
  int j = 0;
  do { // the six spikes, or cells of the net, that may be here
    float row = clamp(row0 - 1. + float(j / 2), 0., N - 1.), tt = (row + .5) * space, n = max(floor(2. * N * sin(tt) + .5), 3.), off = hash11(row + 2.);
    float f = ph / TAU * n + off, c = floor(f) + (j % 2 == 0 ? 0. : fract(f) < .5 ? -1. : 1.);
    float h = hash21(vec2(mod(c, n), row) + .5), pa = (c + .5 + .4 * (h - .5) - off) / n * TAU, ta = tt + .3 * (fract(h * 57.) - .5) * space, st = sin(ta);
    vec3 s = m * vec3(st * cos(pa), cos(ta), st * sin(pa));
    float d = 2. - 2. * dot(s, body);
    if (d < f1) { f2 = f1; s2 = s1; f1 = d; s1 = s; } else if (d < f2 && d > f1) { f2 = d; s2 = s; }
    float len = make.x * (.85 + .3 * fract(h * 13.));
    vec2 e = s.xy * len, v = q - s.xy * .97;
    float t = sat(dot(v, e) / (dot(e, e) + 1e-4)), w = .12 * (.1 + .9 * (1. - t) * sqrt(1. - t)) * sat(make.x * 12.);
    v -= e * t;
    float dist = length(v), a = pfIn(dist, w, b) * step(.015, make.x) * (s.z < 0. ? smoothstep(1. - b, 1. + b, r) : 1.), z = s.z * (1. + len * t);
    if (a > .02 && z > zTop) {
      zTop = z; spike = a; along = t;
      v /= max(w, dist + 1e-4);
      spikeN = vec3(v, sqrt(max(1. - dot(v, v), 0.)) + .1) + .5 * s;
    }
  } while (++j < 6);
  f1 = sqrt(max(f1, 0.)); f2 = sqrt(max(f2, 0.));
  // the net: walls where two cells meet, hollow between; and three lens-shaped furrows from pole to pole
  float wall = 1. - smoothstep(0., .42 * space, f2 - f1), st = sin(th), fw = .2 * smoothstep(.25, .95, st) + .001;
  float slit = make.z * (1. - smoothstep(.35 * fw, fw + b, abs(fract(ph / TAU * 3.) - .5) * TAU / 3. * st));
  vec3 n = body + ((s1 - s2) * make.y * .55 * smoothstep(0., .5, wall) * (1. - smoothstep(.6, 1., wall)) + (body - s1) * .5 * make.z) / space;
  vec3 sk = skin * (1. - .55 * make.y * (1. - wall)) * (1. - .75 * slit) * mix(1., .5 + .5 * smoothstep(.1, .5, f1 / space), sat(make.x * 6.));
  float glow = .25 + .75 * smoothstep(-.9, 1., dot(body, vec3(pfL.xy, .5)));
  vec3 c = pfLit(normalize(n + vec3(0., 0., 1e-3)), q, sk) + fire * glow * (.25 + .75 * body.z) * mix(1., .3 + 1.1 * wall, make.y) * (1. - .6 * slit);
  vec3 cs = pfLit(normalize(spikeN), q, skin * (.85 + .6 * along)) + fire * glow * (.3 + .9 * along);
  col = mix(col, mix(c, cs, spike), max(pfIn(r, 1., b), spike) * step(.003, pfR));
}
// A puff of grains shaken loose by a hit, d from where: it spreads as the hit dies.
float pfPuff(vec2 d) {
  float age = max(1. - uHits, 0.), a = .5 * exp(-dot(d, d) / pfSq(.07 + .11 * age)), n = 0.;
  do {
    float h = fract(n * .618 + .3);
    vec2 at = vec2(cos(n * 2.4), .8 * sin(n * 2.4)) * (.05 + (.06 + .16 * h) * sqrt(age)) - vec2(.02, .05) * age * age;
    a += 1.4 * pfOff(.003, .012, distance(d, at));
  } while (++n < 10.);
  return a * uHits;
}
// Dust in the air, more of it with the texture.
float pfDust(vec2 p, float n) {
  vec2 q = p * n + vec2(.006, -.004) * n * uTime, id = floor(q);
  float h = hash21(id + n), g = fract(h * 91.);
  q -= id + .5 + .28 * vec2(sin(uTime * .21 + h * 40.), cos(uTime * .17 + g * 40.));
  return pfOff(0., .03 + .07 * g + pfPx * n, length(q)) * smoothstep(0., .2, .06 + .3 * uTexture - h) * (.4 + g);
}
// Where the eye stands (across, up, how near).
void pfZoom(vec3 near, vec3 far) {
  vec3 z = pfWorld(uOwn[5], near, vec3(0., 0., 1.), far);
  pfP = pfP / z.z + z.xy;
  pfPx = .8 / (uRes.y * z.z);
}

const vec3 PF_PAPER = vec3(1.75, 1.6, 1.36);
// Lights far off and out of focus.
vec3 pfLights(vec2 p) {
  vec3 c = mix(uKind[0] * uKind[0] * .12, uKind[1] * uKind[1] * .5, pfOff(-.5, .45, p.y));
  for (float i = 0.; i < 17.; i++) {
    float h = fract(i * .618 + .2), r = .035 + .1 * fract(i * .381 + .1);
    vec2 d = p - vec2(1.9 * h - .95, .85 * fract(i * .7549) - .36) - .03 * vec2(sin(uTime * .11 + i), cos(uTime * .09 + 2. * i));
    float l = length(d), k = .3 + .7 * fract(i * .291);
    vec3 t = kindColour(fract(i * .43) * 4.);
    c += t * t * k * (.85 + .5 * uPad + 1.2 * piece(vec2(.5 + (p.x - d.x) / 1.8, .5 - p.y + d.y)).a) * pfIn(l, r, .006) * (.45 + .5 * smoothstep(.6 * r, r, l));
  }
  return c;
}

// ---- a: inside the coat
// A near hair: its root, lean, curl and half width, and how long its barbs are.
void pfHair(inout vec3 col, vec4 hair, float seed, float barb) {
  barb *= pfComb;
  float y = pfH.y + .56, curl = hair.z + pfSway, dx = pfH.x - hair.x - hair.y * y - curl * y * y;
  float slope = hair.y + 2. * curl * y, c = inversesqrt(1. + slope * slope);
  float u = dx * c, s = y / c + dx * slope * c, w = hair.w * max(1.15 - .6 * y, .2), au = abs(u), e = clamp(u / w, -1., 1.);
  if (au > max(.6 * w + max(1.36 * barb, .005), w + pfPx)) return;
  float side = u > 0. ? 1. : 0., v = max(au - .6 * w, 0.), gap = .22 * barb + .011, tilt = 1. + .4 * sin(s * 8. + seed * 40. + side * 2.);
  float f = (s - v * tilt + .5 * (2. - tilt) * v * v / max(barb, .01)) / gap + .5 * side + seed * 7.3, k = floor(f);
  float h = hash11(k + seed * 37. + side * .37), len = barb * (.35 + h * (.6 + .4 * fract(h * 19.))), out_ = sat(v / max(len, .005));
  float bw = min(.16 * w + .0016, .3 * gap) * sqrt(1. - out_) * sat(barb * 60.), bd = (f - k - .5 - .5 * (fract(h * 31.) - .5)) * gap * .72;
  float ba = pfIn(abs(bd), bw, pfPx) * pfOff(.9, 1., out_) * min(1., (bw + .0005) / pfPx * 1.4);
  // a thin bright edge where the sun comes through, a dull cool edge away from it
  float lit = smoothstep(-.5, 1., e * pfSide);
  vec3 shaft = pfCoat * pfLamp * pfPower * (.015 + .32 * lit * lit * lit + 2. * pfSq(e * e * e) * (.06 + .94 * lit));
  shaft += pfCoat * (pfFill * .14 * pfOff(-1., -.2, e * pfSide) + pfAir * .012);
  vec3 br = pfCoat * pfLamp * pfPower * (.35 + .8 * out_) * (.6 + .6 * smoothstep(-bw - 1e-4, bw + 1e-4, bd)) + pfFill * .12;
  br = br * (1. + 1.4 * uTexture * (.4 + .6 * h)) + pfLamp * uKeys * smoothstep(.82, .95, h) * out_ * .9;
  col = mix(mix(col, br, ba), shaft, pfIn(au, w, pfPx));
}
// Five ranks of soft hairs: they come slowly toward us with the travel. air is the light behind them.
void pfRanks(inout vec3 col, vec3 air) {
  float i = 0., tr = uTravel * .02, y = pfH.y + .56;
  do {
    float t = (i + fract(tr)) / 5., seed = mod(i - floor(tr), 61.) + 1., show = smoothstep(0., .2, t) * pfOff(.8, 1., t) * (1. - .6 * PFK);
    float cell = mix(.07, .3, t * t) / (1. + .4 * uOwn[4]), w = mix(.0055, .032, t * t);
    float x = pfH.x - (.2 * pfH.x + .12 + .16 * sin(seed * 2.4) + pfSway) * y * y + seed * .371, n = floor(x / cell - .5), last = n + 1.5;
    do {
      float h = hash21(vec2(n, seed)), g = fract(h * 57.3);
      float d = (x - (n + .5 + .4 * (h - .5) + .5 * (g - .5) * y * y) * cell) / (w * (.6 + .8 * g) * (1.15 - .5 * min(y, 1.6)));
      float lit = smoothstep(-1.2, 1.2, d * pfSide);
      vec3 c = mix(air * (.5 + .6 * lit), pfCoat * (air * (.04 + 1.3 * lit * lit * lit) + pfLamp * .018 * lit), .35 + .6 * t);
      col = mix(col, c, show * max(.82 * pfIn(abs(d), 1., mix(.9, .35, t)), (.12 + .12 * t) / (1. + .2 * d * d)));
    } while (++n < last);
  } while (++i < 5.);
}
const vec3 PF_AT[9] = vec3[9](vec3(-.21, -.07, .155), vec3(.55, .17, .1), vec3(.06, .28, .066), vec3(.25, -.21, .072), vec3(.62, -.23, .058),
  vec3(-.47, .24, .11), vec3(.34, .36, .08), vec3(-.45, -.31, .085), vec3(.36, .03, .06));
void pfInCoat(inout vec3 col) {
  pfZoom(vec3(0., -.12, 1.35), vec3(0., .2, .78));
  vec2 p = pfP;
  pfH = p;
  if (uOwn[6] > 0.) {
    vec2 f = p - vec2(.06, -.6);
    pfH = mix(p, vec2(atan(f.x, f.y) * .6 + .04, length(f) - .5), PFF);
  }
  if (uOwn[6] < 0.) pfH.x += .42 * PFW;
  float hour = uOwn[0];
  pfSun = vec2(.33, pfWorld(hour, .2, -.03, .3));
  pfLamp = pfWorld(hour, vec3(.34, .5, .78), vec3(1.55, .86, .26), vec3(1.5, 1.35, 1.)) * (1. + .35 * uPad + .15 * uLevel) + vec3(.35, .42, .5) * pfDay;
  pfAir = pfWorld(hour, vec3(.05, .1, .19), vec3(.8, .36, .07), vec3(.8, .76, .56));
  pfFill = pfWorld(hour, vec3(.03, .05, .1), vec3(.075, .05, .055), vec3(.28, .3, .32)) + vec3(.18, .22, .28) * pfDay;
  pfCoat = pfWorld(uOwn[1], vec3(.85, .9, .88), vec3(.95, .6, .2), vec3(.75, .17, .06));
  if (uOwn[7] != 0.) {
    pfCoat = mix(pfCoat, uKind[1] * uKind[1] * 1.2, .75 * abs(uOwn[7]));
    pfLamp = mix(pfLamp, mix(vec3(1., .95, .85), uKind[3] * 1.3, PFK), .8 * abs(uOwn[7]));
    pfAir = mix(pfAir, mix(vec3(.9), uKind[1] * uKind[1] * .7, PFK), abs(uOwn[7]));
    pfFill = mix(pfFill, mix(vec3(.5, .48, .45), uKind[0] * .14, PFK), abs(uOwn[7]));
  }
  // how far the hairs here lean: a breath, the band of their rank, and the hum
  float rank = sat(.5 + p.x / 1.9);
  pfSway = .012 * sin(uTime * .31 + p.x * 2.3) + .05 * band(rank) * sin(uTime * .83 + rank * 13.) + .003 * uDrone * sin(uTime * 5.3 + p.y * 21. + p.x * 9.);
  if (uOwn[6] < 0.) pfSway += PFW * (.8 + .06 * sin(uTime * .43 + p.x * 3.));
  // the air: the sun low behind the fur
  vec2 d = p - pfSun;
  float sd = length(d * vec2(.9, 1.15)), ray = pfSq(noise(d / (length(d) + .02) * 5. + uTime * .02)), near = exp(-sd * 1.7);
  pfSide = clamp(-d.x * 9., -1., 1.);
  pfPower = .12 + 1.25 * near;
  vec3 air = pfAir * (.04 + 1.3 * exp(-sd * 3.) + (.2 + .9 * uPad) * ray * near) * (.9 + .25 * uLevel) + pfLamp * .6 * exp(-sd * sd * 34.);
  air *= mix(vec3(1., .5, .36), vec3(1.), near);
  air += vec3(.26, .34, .42) * pfDay * smoothstep(-.2, .6, p.y + .3 * p.x) * (.4 + 1.2 * ray);
  if (uOwn[7] < 0.) { air = mix(air, PF_PAPER * (.8 + .2 * near) * (.97 + .06 * noise(p * 130.)), PFP); pfPower *= 1. - .6 * PFP; }
  if (uOwn[7] > 0.) air = mix(air, pfLights(p), PFK);
  col = air + (1. - abs(uOwn[7])) * pfLamp * pfOff(.055, .075, sd) * .9;
  // grains far off and out of focus, behind the ranks
  float n = 0.;
  do {
    vec2 at = vec2(-.7 + 1.55 * fract(n * .618 + .33), -.2 + .56 * fract(n * .381 + .45) + .006 * sin(uTime * .23 + n));
    vec4 pc = piece(vec2(.5 + at.x / 1.8, .5 - at.y));
    float r = (.026 + .005 * n + .014 * pc.a) * smoothstep(-1., -.2, uOwn[2]) * (1. + .5 * max(uOwn[2], 0.)) * pfSq(pfBig());
    vec3 c = mix(pfCoat, vec3(.9, .36, .06), .6) * (.6 * pfFill + pfLamp * (.14 + .6 * smoothstep(-.8, 1.2, (p.x - at.x) / (r + .001))));
    col = mix(col, c + pc.rgb * pc.rgb * (.3 + uEnergy), pfIn(distance(p, at), r, .01) * sat(r * 80.));
  } while (++n < 6.);
  pfRanks(col, air);
  // the dark armour the hairs stand in
  float under = -.37 + .05 * cos(p.x * 2.1 - .5) - .03 * p.x - p.y, deep = max(under, 0.);
  float streak = (.5 + .5 * sin(p.x * 41. + 2. * sin(p.x * 17.))) * (.5 + .5 * sin(p.x * 11. + 1.));
  vec3 arm = vec3(.004, .003, .004) + pfLamp * pfAir * exp(-pfSq(d.x * 2.2)) * (.8 * streak * exp(-deep * 24.) + .5 * exp(-deep * 60.));
  if (uOwn[7] < 0.) arm = mix(arm, PF_PAPER * .5 * (.75 + .5 * streak * exp(-deep * 24.)), PFP);
  if (uOwn[6] > 0.) under -= .3 * PFF * dot(p - vec2(.06, 0.), p - vec2(.06, 0.)) ;
  col = mix(col, arm, smoothstep(-.005, .005, under));
  pfComb = pfWorld(uOwn[4], 0., 1., 1.7);
  pfHair(col, vec4(-.5, 0., .34, .016), .13, .055);
  pfHair(col, vec4(-.08, .02, .17, .012), .37, .05);
  pfHair(col, vec4(.17, .02, .36, .016), .71, .055);
  pfHair(col, vec4(.62, .02, .12, .018), .53, .06);
  // the grains we stand among: here the nearest
  int i = 0, m = 0;
  vec3 g = vec3(0., 0., 1.);
  float roll = .09 * sin(uTravel * .16), best = 1e3;
  do {
    vec3 at = PF_AT[i];
    if (i == 3) at.xy += vec2(roll, .5 * roll * roll);
    float far = distance(p, at.xy) / at.z;
    if (far < best) { best = far; m = i; g = at; }
  } while (++i < (uOwn[3] > 0. && uOwn[2] <= 0. ? 5 : 9));
  float few = float(m);
  pfHear(m < 5 ? m : m - 4, g.xy);
  pfR = g.z * pfBig() * (1. + .1 * pfOn) * (m == 0 ? 1. : m < 5 ? smoothstep(-1., -.5, uOwn[2]) : smoothstep(.1 * few - .5, .1 * few, uOwn[2]));
  pfRoll = m == 3 ? roll / g.z : 0.;
  pfQ = p - g.xy - .004 * sin(uTime * .37 + few * 2.);
  pfL = normalize(vec3(pfSun - g.xy, -.28));
}
void pfBefore(inout vec3 col) {
  pfHair(col, vec4(-.27, .05, -.22, .01), .91, .04);
  pfHair(col, vec4(.42, .06, .04, .011), .61, .05);
  pfHair(col, vec4(-.76, .1, -.04, .085), .47, .13);
}

// ---- b: in the flower
// A petal standing up round us: polar is angle and distance, shape its middle angle, half width and length.
void pfPetal(inout vec3 col, vec2 polar, vec3 shape, vec3 deep, vec3 pale, float seed) {
  float soft = .02 + .004 * seed, t = polar.y / shape.z, across = (polar.x - shape.x) / shape.y + .05 * sin(polar.y * 7. + seed * 5.);
  float wide = sqrt(1. - pfSq(pfSq(min(t, 1.)))) + 1e-3, e = abs(across) / wide, ss = soft / (shape.y * polar.y * wide + .02), a = pfIn(e, 1., ss) * pfIn(t, 1., soft);
  float fold = .5 + .5 * sin(across * 4.5 + seed * 3. + polar.y * 1.5), vein = .5 + .5 * sin(across * 47. + 3. * fold);
  vec3 c = mix(deep, pale, pfSq(smoothstep(.46, 1.06, t + .1 * fold))) * (.6 + .4 * fold) * (1. - .14 * vein * pfOff(.5, 1.1, t)) * (seed > 2.5 ? .82 : 1.);
  c += pale * .5 * smoothstep(.8, .99, e) * smoothstep(.3, .9, t);
  col *= 1. - .45 * pfOff(1., 1.4 + ss, e) * pfOff(.97, 1.02, t);
  col = mix(col, c, a);
}
// The stamens: root and head; bow, thickness, size and lean of the head.
const vec4 PF_PLACE[5] = vec4[5](vec4(-.78, -.85, -.32, -.04), vec4(-.14, -.8, .02, .26), vec4(.26, -.75, .25, .1), vec4(.66, -.75, .4, -.16), vec4(-1.5, -.2, -.68, .27));
const vec4 PF_BUILD[5] = vec4[5](vec4(.07, .075, .27, -.3), vec4(.05, .036, .15, .3), vec4(-.05, .026, .11, -.25), vec4(.06, .04, .165, .55), vec4(.1, .034, .14, -.7));
// A filament from a to b, blushing toward its root.
void pfFilament(inout vec3 col, vec2 a, vec2 b, vec4 build) {
  vec2 ab = b - a, nrm = vec2(-ab.y, ab.x), d = pfP - a;
  float bow = 4. * (build.x + pfWorld(uOwn[4], -build.x, 0., .2)), l2 = dot(ab, ab), h = sat(dot(d, ab) / l2);
  h = sat(h - .5 * bow * (1. - 2. * h) * (bow * h * (1. - h) - dot(d, nrm) / l2));
  d -= ab * h + nrm * bow * h * (1. - h);
  float w = build.y * mix(1.6, .65, h), e = clamp(dot(d, nrm) / (sqrt(l2) * w), -1., 1.), lit = pfOff(-1., 1., e);
  vec3 c = pfCoat * (pfFill + pfLamp * (.04 + .36 * lit * lit + .75 * e * e * e * e));
  c = mix(c, c * pfAir * 1.5 + pfAir * .12, 1. - smoothstep(.2, 1., h - .15 * e)) + pfLamp * .5 * exp(-pfSq((e + .5) * 6.)) * h;
  col = mix(col, c, pfIn(length(d), w, pfPx));
}
// The split head of a stamen, crusted with grains, d from its middle; then the great grain on it.
void pfHead(inout vec3 col, vec2 d, vec4 build) {
  float fk = float(pfK), size = build.z;
  mat2 turn = rot(-build.w);
  d = turn * d / size; // d.x across the head, d.y along it
  vec2 q = d;
  d.x += .3 * d.y * d.y - .08;
  pfL = normalize(vec3(turn * vec2(-.66, .7), .3));
  // two lobes side by side, split between
  float ya = clamp(d.y, -.74, .74), gap = .21 + .07 * pfSq(ya + .1) + .04 * pfOn, fat = .27 * sqrt(1. - .8 * ya * ya);
  vec2 l1 = vec2(abs(d.x) - gap, d.y - ya) / fat;
  float s = length(l1), cov = pfIn(s, 1., pfPx / (size * fat)), cleft = smoothstep(0., .2, abs(d.x));
  vec3 n = vec3(l1 * vec2(d.x > 0. ? 1. : -1., 1.), sqrt(max(1. - s * s, 0.))), skin = pfTint(), glow = pfFire();
  float form = (.18 + 1.4 * pfSq(sat(dot(n, pfL) * .7 + .4))) * (.45 + .55 * cleft);
  col = mix(col, skin * vec3(.3, .18, .16) * form * pfLamp, cov);
  float full = (1.25 - smoothstep(.55, 1., s) * (.2 + .75 * noise(d * 3.3 + fk * 5.))) * pfOff(.98, 1.12, s) * pfWorld(uOwn[2], .1, 1., 1.5), up = 0.;
  if (s < 1.12) do { // the crust, two layers of grains
    float many = (11. - 3. * up) / pfSq(pfBig());
    vec2 g = rot(.5 * up) * d * many + fk * 3.7 + up;
    g.x += .5 * mod(floor(g.y), 2.);
    float h = hash21(floor(g) + fk), r = max((.36 + .13 * fract(h * 43.)) * smoothstep(h - .1, h + .15, full * (1. - .4 * up)), .05), b = pfPx * many / (size * r);
    vec2 x = (fract(g) - .5 - .26 * (vec2(fract(h * 61.), fract(h * 91.)) - .5)) / r, y = rot(h * 3.) * x;
    float l2 = dot(x, x), l = sqrt(l2) * (1. + .6 * y.x * y.x * y.y * y.y / (l2 * l2 + .01)), z = sqrt(max(1. - l * l, 0.));
    vec3 c = pfLit(vec3(x, z), x, skin * (.6 + .4 * up) * (.7 + .5 * fract(h * 17.))) * (.3 + .7 * z) + glow * z * (.3 + h) + pfLamp * (uKeys * step(.86, h) * .5 + uTexture * pfSq(pfSq(fract(h * 29.))) * .35) * z;
    col = mix(col, c * form, pfIn(l, 1., b) * step(.06, r) * step(.02, full));
  } while (++up < 2.);
  float roll = pfK == 3 ? .4 * sin(uTravel * .16) : 0., r = (pfK == 2 ? .24 : .36) * (1. + .1 * pfOn) * pfWorld(uOwn[2], 0., 1., 1.15) * pfBig();
  q -= pfK == 0 ? vec2(.22, .34) : pfK == 1 ? vec2(-.26, .42) : pfK == 3 ? vec2(.1 - .3 * roll * roll, roll) : vec2(-.1, .4);
  col *= 1. - .6 * exp(-dot(q, q) / (r * r + 1e-3) * .6) * cov * sat(r * 9.);
  pfQ = q * size; pfR = r * size; pfRoll = roll / .36;
}
// The great soft visitor: a blur of stripes, never sharp.
void pfVisitor(inout vec3 col) {
  vec2 d = pfP - vec2(.66 + 1.2 * PFP, .15) - vec2(.012 * sin(uTime * .23), .018 * sin(uTime * .31 + 1.));
  vec3 gold = pfWorld(uOwn[1], vec3(.85, .86, .82), vec3(.98, .5, .06), vec3(.85, .16, .03));
  // the wings, two pale smears that a cue opens wider
  float open = .5 + 1.2 * uCue * (1. - uCue) + .02 * sin(uTime * .9), i = 0.;
  do {
    float e = length((rot(open + .7 * i) * (d - vec2(-.02, .14)) - vec2(0., .24)) / vec2(.085, .27));
    col = mix(col, col * .6 + pfLamp * (.22 + .5 * exp(-pfSq((e - .9) * 4.))) * (.7 + pfDay), pfOff(.6, 1.3, e) * (.45 + .3 * pfDay));
  } while (++i < 2.);
  vec2 b = rot(.62) * d; // b.x along the body, the tail end low at the left
  b.y += .5 * b.x * b.x;
  float x = b.x / .4, y = b.y / (.26 - .026 * x), e = length(vec2(x, y)) + .05 * (noise(b * 13. / (length(b) + .1)) - .5), s = x + .12 * y * y;
  vec3 c = mix(vec3(.95, .82, .6), vec3(.02, .01, .01), smoothstep(-.8, -.46, s));
  c = mix(c, gold, smoothstep(-.36, -.08, s) * pfOff(0., .28, s) + smoothstep(.42, .7, s));
  c = c * (pfFill + pfLamp * (.06 + .8 * sat(.4 - .34 * x + .62 * y + .2 * sqrt(max(1. - e * e, 0.))))) + pfLamp * gold * .8 * smoothstep(.62, 1.05, e) * smoothstep(-.5, .8, y - .4 * x);
  col = mix(col, c, pfOff(.7, 1.25, e));
}
void pfInFlower(inout vec3 col) {
  pfZoom(vec3(-.26, .06, 1.5), vec3(.04, -.03, .76));
  vec2 p = pfP;
  float hour = uOwn[0];
  pfLamp = pfWorld(hour, vec3(.36, .46, .85), vec3(1.5, 1.2, .8), vec3(1.5, 1.42, 1.25)) * (.95 + .25 * uPad + .1 * uLevel) + vec3(.3) * pfDay;
  pfFill = pfWorld(hour, vec3(.04, .05, .12), vec3(.16, .065, .085), vec3(.42, .36, .36)) + vec3(.06) * pfDay;
  pfCoat = vec3(.86, .9, .58);
  vec3 sky = pfWorld(hour, vec3(.06, .1, .26), vec3(2., 1.45, .85), vec3(2.2, 2.2, 2.1));
  vec3 light = pfLamp * .8;
  vec3 deep = pfWorld(uOwn[1], vec3(.03, .08, .1), vec3(.13, .004, .04), vec3(.14, .006, .003)) * light;
  vec3 pale = pfWorld(uOwn[1], vec3(.9, .98, .9), vec3(1.22, .33, .48), vec3(1., .17, .04)) * light;
  if (uOwn[7] != 0.) {
    vec3 k = uKind[0] * uKind[0], m = uKind[1] * uKind[1];
    deep = mix(deep, k * .45 * light, .9 * abs(uOwn[7])); pale = mix(pale, m * 1.3 * light, .9 * abs(uOwn[7]));
    pfLamp = mix(pfLamp, mix(vec3(1.25, 1.18, 1.05), uKind[3] * 1.4, PFK), .7 * abs(uOwn[7]));
    pfFill = mix(pfFill, mix(vec3(.5, .47, .44), k * .2 + .02, PFK), .8 * abs(uOwn[7]));
    sky = mix(sky, PF_PAPER, PFP);
  }
  pfAir = mix(deep, pale, .4);
  col = sky * (.55 + .6 * exp(-length(p - vec2(.3, .35)) * 2.));
  if (uOwn[7] > 0.) col = mix(col, pfLights(p), PFK);
  if (uOwn[7] < 0.) col = mix(col, PF_PAPER * (.9 + .1 * noise(p * 130.)), PFP);
  vec2 d = p - vec2(.02, -1.05), polar = vec2(atan(d.x, d.y + 1e-5) - .012 * sin(uTime * .19) - .02 * uLow * sin(uTime * .47), length(d));
#define PFSH * vec3(1., 1. - .66 * PFF, 1. + .04 * PFF - .62 * PFW)
  if (uOwn[6] > 0.) for (float i = 0.; i < 7.; i++) pfPetal(col, polar, vec3(-.95 + .31 * i + .1 * sin(i * 5.), .12 * PFF, 1.45 + .2 * sin(i * 2.4)), deep * .75, pale * .75, 6. + .3 * i);
  pfPetal(col, polar, vec3(.62, .34, 1.4) PFSH, deep, pale, 4.);
  pfPetal(col, polar, vec3(-.12, .4, 1.6) PFSH, deep, pale, 3.);
  pfPetal(col, polar, vec3(.27, .25, 1.16) PFSH, deep, pale, 2.);
  pfPetal(col, polar, vec3(-.62, .42, 1.75) PFSH, deep, pale, 1.);
  pfPetal(col, polar, vec3(1.02, .34, 1.6) PFSH, deep, pale, 5.);
  col += pfLamp * (.05 + .07 * uPad + .4 * pfDay) * exp(-2. * length(p - vec2(-.62, .7)));
  pfVisitor(col);
  // the stamens, and the head that is nearest here
  int k = 0, i = 4;
  vec2 head = vec2(0.);
  float best = 1e3;
  do {
    float fi = float(i);
    vec2 b = PF_PLACE[i].zw;
    b.x += .007 * sin(uTime * .27 + fi * 1.7) + .025 * uBands[3 * i] * sin(uTime * .71 + fi * 2.1) + .014 * uPhrase * sin(uTime * .47 - fi * 1.3) + .0015 * uDrone * sin(uTime * 5.1 + fi);
    pfFilament(col, PF_PLACE[i].xy, b, PF_BUILD[i]);
    float far = distance(p, b) / PF_BUILD[i].z;
    if (far < best) { best = far; k = i; head = b; }
  } while (--i >= 0);
  pfHear(k, head);
  pfHead(col, p - head, PF_BUILD[k]);
}

vec3 render(vec2 p) {
  vec3 col = vec3(0.);
  pfP = p;
  pfDay = uCue * (.6 + .4 * uEnergy);
  if (uVar < .5) pfInCoat(col); else pfInFlower(col);
  pfGrain(col);
  vec2 at = uVar < .5 ? PF_AT[4].xy : vec2(-.67, .32);
  if (uOwn[5] < 0.) at.x *= 1. + .7 * uOwn[5];
  float puff = pfPuff(pfP - at), ink = max(PFP, uVar * PFW);
  col += (pfLamp * .4 + uKind[4] * uKind[4] * .8) * (1. + .5 * uVar) * puff * (1. - ink);
  if (uOwn[7] < 0. || uOwn[6] < 0.) col = mix(col, uKind[4] * uKind[4] * .5, ink * sat(puff * 1.3 + .6 * uHits * exp(-dot(pfP - at, pfP - at) * 18.)));
  if (uVar < .5) pfBefore(col);
  col += pfLamp * vec3(.4, .3, .13) * pfDust(pfP, 12.) * (1. + uVar);
  return screenOf(col);
}
