// name: Salt steps
// a: Mountain pans
// b: Shore cones
// what: A steep brown valley side at first sun, stepped with small hand-built salt pools behind crusted white lips, some dry, some holding tea-brown, rose or sky, a rake left across one and someone at work higher up; or level shore flats at evening, rows of white salt cones leading to a windmill, pink ponds that repeat the sky.
// follows: Each pool is a place of the piece: it fills and colours as it sounds, then dries white. The drone floods the top rows, the pad tints the sky, texture sparkles on crystals, the phrase is running or bright water; bands light the rows or raise the cones. A hit rings in one pool, a cue sends the sun over the slope or along the cones, keys glint, clouds travel.
// own: 0 moonlight at -1, a red evening at 1; 1 nearly all dry and white at -1, every pool brim full or the flats flooded at 1; 2 few and large pools or cones at -1, many and small at 1; 3 seen from higher up at -1, from low down at 1; 4 jade water, dark slope at -1, wine red water, red slope or pink salt at 1; 5 shallow steps or low broad cones at -1, tall steps or tall narrow cones at 1
vec3 slSun, slSunC, slAmb, slTop, slHor;  // towards the sun, its light, the light of the shade, the sky above and low down
float slPx;
float slKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : 2. * uHits * (1. - uHits); }
float slS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3. - 2. * x); }
vec3 slShown(vec3 c) { return pow(1. - exp(-1.5 * max(c, .0)), vec3(.4545)); }
float slSeg(vec2 q, vec2 a, vec2 b) { vec2 v = b - a; return length(q - a - v * sat(dot(q - a, v) / max(dot(v, v), 1e-5))); }
float slN(vec2 q) { return noise(q) + .5 * noise(q * 2.5); }
// Noise that runs, round again after 64.
float slRun(vec2 q, float v) {
 q.y = mod(q.y + v * uTime, 64.);
 float n = noise(q);
 return q.y < 62. ? n : mix(n, noise(q - vec2(.0, 64.)), .5 * q.y - 31.);
}
float slRise(vec2 q, vec2 d) { return noise(q + d) - noise(q); }
// How loud the piece is at a place; the brine there takes its colour.
float slHeard(vec2 uv, inout vec3 br) {
 vec4 m = piece(sat(uv));
 float a = slS(.0, .55, m.a * (.7 + .7 * uEnergy));
 if (m.a > .004) br = mix(br, pow(m.rgb / m.a, vec3(2.6)) * .5, .3 * a);
 return a;
}
vec3 slBrine(int k) {
 vec3 c = k == 0 ? vec3(.11, .05, .022) : k == 1 ? vec3(.4, .12, .13) : k == 2 ? vec3(.42, .23, .08) : k == 3 ? vec3(.09, .17, .16) : vec3(.36, .09, .05);
 c = mix(c, pow(uKind[k], vec3(2.2)) * .6, .35);
 float j = fract(float(k) * .43);
 c = mix(c, mix(vec3(.03, .2, .17), vec3(.16, .36, .24), j), .85 * sat(-uOwn[4]));
 return mix(c, mix(vec3(.34, .02, .06), vec3(.6, .17, .12), j), .85 * sat(uOwn[4]));
}
vec3 slSky(vec3 d) {
 d = normalize(d);
 float el = sat(d.y), toSun = sat(dot(d, slSun));
 vec3 c = mix(slHor, slTop, sqrt(sat(el * 1.5))) + slSunC * .3 * toSun * toSun * toSun;
 vec2 q = d.xz / (el + .22) * vec2(.9, 1.7);
 float cl = slN(q + vec2(uTravel * .02, 3.));
 return mix(c, mix(slHor, slSunC * .5, .6) * 1.15, .6 * slS(.75, 1.15, cl) * slS(.0, .2, el));
}

// ---- a: the pans on the slope. A place of it is s along the slope and u up it, in rows of pools.
const float SLC = .68, SLS = .733;
float slBend(float s) { return 1.9 * sin(s * .17 + .9) + .5 * sin(s * .41 + 2.); }
// The front edge of row k at s; cell: which pool, its middle along s, how far to its side walls, where in it (0 to 1).
float slFront(float k, float s, float u, out vec4 cell) {
 float h = hash11(k * .37 + 5.), wide = mix(1., 2.1, h), slant = 1.1 * (fract(h * 7.3) - .5);
 float f0 = k + .24 * sin(s * .8 + h * 40.);
 float c = (s + slant * max(u - f0, .0)) / wide + h * 19., i = floor(c);
 float b = i + .7 * (hash21(vec2(i, k)) - .5), b1;
 if (c < b) { b1 = b; i -= 1.; b = i + .7 * (hash21(vec2(i, k)) - .5); }
 else {
  b1 = i + 1. + .7 * (hash21(vec2(i + 1., k)) - .5);
  if (c >= b1) { b = b1; i += 1.; b1 = i + 1. + .7 * (hash21(vec2(i + 1., k)) - .5); }
 }
 float x = (c - b) / (b1 - b), e = 2. * x - 1.;
 cell = vec4(i, (.5 * (b + b1) - h * 19.) * wide, min(x, 1. - x) * (b1 - b) * wide, x);
 // now and then two lie open to each other: a kidney
 float odd = mod(i, 2.), join = odd < .5 ? i : i + 1.;
 if (hash21(vec2(join, k) + 51.) < .42) cell.xyz = vec3(join + .5, ((odd < .5 ? b : b1) - h * 19.) * wide, (odd < .5 ? b1 - c : c - b) * wide);
 e *= e;
 return f0 - (.04 + .46 * hash21(vec2(i, k) + 7.7)) * (1. - e * e);
}
float slIn(float k, float s, float u, out vec4 cell) {
 vec4 other;
 float f = slFront(k, s, u, cell), f1 = slFront(k + 1., s, u, other);
 return smin(smin(u - f, f1 - u + .05, .2), cell.z, .3);
}
float slEdge(vec3 rd, float t, float s, float u) {
 return rd.x * t * .8 + t * .45 - 5.6 - 4. * uLevel - 64. * uCue * (1. - uCue) + 1.6 * sin(s * .5) + 1.2 * noise(vec2(s * .7, u * .5));
}
float slLip(float d) { return .07 * slS(.17, .07, d); }
float slRake(vec2 q) { return min(slSeg(q, vec2(.0), vec2(-1.4, -.2)) - .022, slSeg(q, vec2(.03, .3), vec2(-.03, -.3)) - .05); }
vec3 slPans(vec2 p) {
 float high = sat(-uOwn[3]), low = sat(uOwn[3]);
 float m = .26 * exp2(.62 * uOwn[5]), hz = .24 + .4 * high - .1 * low, f = 1.15;
 float H = 3.1 * exp2(.5 * uOwn[2]) * mix(mix(1., 1.5, high), .75, low) * (.985 + .03 * uSpace);
 slSun = normalize(vec3(-.97, .42, .16));
 vec2 L = normalize(vec2(.85, -.5));  // along s and u, towards the sun
 vec3 rd = vec3(p.x / f, (p.y - hz) / f, 1.);
 float vr = SLC + rd.x * SLS, sr = SLS - rd.x * SLC, den = m * vr - rd.y;
 // the far valley side and the sky
 float tx = p.x * 3., ridge = hz + .16 + .05 * sin(tx + 2.) + .05 * slN(vec2(tx * 1.6, 3.));
 vec3 haze = mix(slHor, slAmb * 1.6, .6);
 vec3 col = slSky(vec3(rd.x, max(rd.y, .0) + .05, 1.));
 float rock = slN(vec2(p.x * 9. + p.y * 5., p.y * 7. - p.x * 6.));
 vec3 farHill = mix(vec3(.2, .115, .075) * (slAmb + slSunC * (.6 + 1.2 * uCue) * slS(.4, 1.1, rock)), haze, .3);
 col = mix(col, farHill, slS(slPx, -slPx, p.y - ridge));
 float crest = H * (.0066 + .006 * noise(vec2(p.x * 8., 9.)));
 if (den < crest) return slShown(col);
 float t0 = H / den, s = t0 * sr;
 t0 = (H + m * slBend(s)) / den; s = t0 * sr;
 t0 = (H + m * slBend(s)) / den; s = t0 * sr;
 // up the steps until one stops the eye
 float u = t0 * vr - slBend(s), um = u, sm = s, k = floor(u - .9), down = -1., t = t0;
 vec4 cell, other;
 for (int j = 0; j < 5; j++) {
  float over = H - k * m;
  if (rd.y < -1e-3 && over > .0) {
   float tt = over / -rd.y, st = tt * sr, ut = tt * vr - slBend(st), ga = ut - slFront(k, st, k - 1., cell);
   if (ga < .0) {
    float ta = tt, tb = tt + m / -rd.y, gb = tb * vr - slBend(tb * sr) - slFront(k, tb * sr, k - 1., other);
    for (int n = 0; n < 2; n++) {
     t = mix(ta, tb, sat(-ga / max(gb - ga, 1e-3)));
     s = t * sr;
     float gm = t * vr - slBend(s) - slFront(k, s, k - 1., cell);
     if (gm < .0) { ta = t; ga = gm; } else { tb = t; gb = gm; }
    }
    down = sat((t * -rd.y - over) / m);
    break;
   }
   if (ut < slFront(k + 1., st, k, other)) { t = tt; s = st; u = ut; break; }
  } else {
   float way = max(vr, .1), tf = (k + slBend(s)) / way;
   tf = (slFront(k, tf * sr, k - 1., cell) + slBend(tf * sr)) / way;
   float y = H + tf * rd.y - k * m;
   if (y < .0) { down = sat(-y / m); t = tf; s = tf * sr; break; }
  }
  k += 1.;
 }
 if (down >= .0) u = t * vr - slBend(s);
 bool wall = down >= .0;
 vec2 o = vec2(s, u);
 float px = slPx * t / f, far = 1. - exp(-max(t - 6., .0) * .017);
 // the edge of the sun on the slope
 float edge = slEdge(rd, t, s, u);
 float lamp = um - 11. + 13. * (1. - uCue), sun = max(slS(.5, -.5, edge), uCue * exp(-lamp * lamp * .15));
 vec3 earth = mix(mix(vec3(.27, .155, .085), vec3(.06, .06, .065), sat(-uOwn[4])), vec3(.36, .11, .055), sat(uOwn[4]));
 float grain = noise(o * 6.) * .6 + noise(o * 21.) * .4;
 vec3 salt = vec3(.88, .85, .8) * mix(vec3(.75, .66, .56), vec3(1.), slS(.2, .7, noise(o * 1.3) + .4 * grain));
 float rowLight = .75 + .9 * uBands[int(mod(k + 64., 16.))] * (.4 + uEnergy);
 vec3 c;
 float ripple = .0;
 if (wall) {
 // a wall, crusted white
  vec2 dq = vec2(s * 17., k * 1.7 + down);
  float drip = noise(vec2(s * 4., k * 3.1)) * .6 + noise(dq) * .55;
  float crust = slS(.2, -.15, down - drip * .95 + .1);
  float face = sat(.36 + .9 * (cell.w - .5) + .35 * (grain - .5) + .45 * slRise(dq, vec2(.6, .0)));
  c = mix(earth * (.5 + .9 * grain), salt, crust);
  c *= (slSunC * face * sun * mix(1., rowLight, crust) + slAmb * mix(.95, .45, down) * mix(1., rowLight, .6)) * mix(.35, 1., slS(1.02, .8, down));
  c = mix(c, salt * (slSunC * .5 * sun * rowLight + slAmb), .5 * slS(1.3, .0, min(down, 1. - down) * m / px));
 } else {
  float d = slIn(k, s, u, cell);
  vec2 q = L * .07;
  float d1 = slIn(k, s + q.x, u + q.y, other);
  float h1 = hash21(cell.xx * .713 + k * 1.37), h2 = hash21(vec2(k, cell.x) + 3.3);
  int kd = int(h2 * 4.99);
  float lump = slN(o * 9.), lump1 = slN((o + q * .6) * 9.);
  d += .07 * (lump - .75); d1 += .07 * (lump1 - .75);
  vec3 br = slBrine(kd);
  float a = slHeard(vec2(.9 - cell.y / 14., .88 - k / 14.), br);
  float full = sat(slS(.3, .6, h1) + .9 * a * step(.12, h2) + .3 * slKind(kd) + .6 * uDrone * slS(1., 6., k) + 1.4 * uOwn[1]);
   float rag = .12 * (noise(o * 4.) - .5) + .05 * (grain - .5);
  float shore = d - .12 + .07 * sat(uOwn[1]) - .5 * (1. - full) + rag * (1.5 - full);
  float water = slS(-.02 - px, .02 + px, shore) * slS(.02, .2, full);
  float bump = slLip(d1) - slLip(d) + .022 * (lump1 - lump) * slS(.06, .015, px);
  float lit = sat(slSun.y * 1.25 - bump * 8.);
  vec3 ground = salt * mix(vec3(1.), vec3(.8, .66, .5), .8 * slS(.35, .0, shore + .3) * slS(-.3, .1, shore) * step(shore, .1));
  float dead = step(.95, hash21(vec2(cell.x * 3.1, k))) * (1. - sat(uOwn[1]));
  ground = mix(ground, earth * (.7 + .6 * grain), dead);
  water *= 1. - dead;
  c = ground * (slSunC * lit * sun * rowLight + slAmb * (1. - 2. * max(bump, .0)));
  // brine, the sky on it, the wall behind
  float deep = slS(.0, .35, shore);
  vec3 wet = mix(br + .08, br * .55, deep) * (slSunC * .5 * sun + slAmb) * (.6 + .6 * a + (kd == 4 ? uHits : .0));
  vec3 rf = vec3(rd.x + .08 * (h1 - .5), -rd.y + .02, 1.);
  float cosN = rf.y / length(rf), fres = .16 + .6 * slS(.5, .95, h1) + .5 * pow(1. - sat(cosN), 3.) + .35 * sat(uOwn[1]);
  vec3 sky = slSky(rf + vec3(.0, .015 * (slRun(vec2(s * 3., u * 8.), .2) - .5), .0));
  float back = slFront(k + 1., s + sr * .3, u, other) - u;
  float wallAt = slS(.02, -.02, -back * rd.y / max(vr, .05) - m * .9);
  sky *= mix(vec3(1.), .4 + uKind[1], .9 * uPad);
  vec3 mir = mix(sky, earth * (slAmb + slSunC * .3 * sun) * 1.3 + .04, wallAt * .8);
  wet = mix(wet, mir, sat(fres)) + slSunC * uKeys * .5 * slS(.75, .95, slRun(vec2(s * 9., u * 30.), 1.));
  wet *= mix(.6, 1., slS(.0, .1, shore));
  c = mix(c, wet, water);
 // sparkle of crystals
  vec2 gq = o * 30.;
  float gh = hash21(floor(gq)), gl = slS(.35, .0, length(fract(gq) - .5)) * step(.9, gh) * slS(.035, .012, px);
  gl *= .5 + .5 * sin(uTime * 1.3 + gh * 900.);
  c += slSunC * gl * (1. - water) * (.15 + 1.5 * uTexture) * (.3 + .7 * sun);
  c *= 1. + .35 * uTexture * (1. - water) * slS(.4, .7, grain);
  ripple = water;
 }
 // a thread of water from step to step, and a hit in one pool
 float sp = 3.2 + .45 * u + .7 * sin(u * 1.1), off = abs(s - sp), run = slS(-4., -2., u) * slS(12., 9., u);
 float thread = wall ? run * slS(.06 + px, .03, off) * (.6 + .4 * slRun(vec2(s * 30., (u - m * down) * 5.), 1.)) : .0;
 float drop = u - down * .6 - 9. + 11. * fract(uTime * .035);
 float spill = u - 2.4 + 4. * (1. - uHits);
 vec3 shine = slSunC * (.25 + .6 * sun) + slAmb;
 c += shine * thread * (.04 + 1.2 * uPhrase + .5 * exp(-drop * drop * 3.) + 2. * uHits * exp(-spill * spill * 1.6));
 if (wall && uOwn[1] > .0) c += shine * .55 * uOwn[1] * slS(.45, .6, noise(vec2(s * 2.4, k * 3.1 + 7.))) * (.35 + .65 * slRun(vec2(s * 26., (u - m * down) * 5.), 1.));
 float rr = length(vec2(s - 4.4, (u - 2.15) * 1.2)), wave = rr - .75 * (1. - uHits);
 c += shine * uHits * ripple * step(abs(k - 2.), .5) * (.5 * exp(-rr * rr * 1.5) + exp(-wave * wave * 90.) * (.6 + .6 * cos(wave * 60.)));
 float blur = slPx / f * H * (abs(vr) + .35) / (den * den);
 c = mix(c, mix(earth, vec3(.8), .45) * (slSunC * .45 * sun + slAmb), slS(.2, .55, blur));
 // above the pans the bare hill
 float topOf = 11.5 + 3.4 * sin(sm * .19 + 1.6) + 2. * noise(vec2(sm * .6, um * .4));
 float bare = slS(topOf, topOf + 1.2, um);
 if (bare > .0) {
  sun = mix(sun, max(slS(.5, -.5, slEdge(rd, t0, sm, um)), uCue * exp(-lamp * lamp * .15)), bare);
  vec2 q = vec2(sm * .9, um * 1.4);
  float hg = slN(q), hr = hg - slN(q + vec2(.25, -.17));
  vec3 hill = earth * 1.15 * (slSunC * sat(.42 + .9 * hr) * sun + slAmb * (1. + .9 * hr)) * mix(1., .45, slS(.85, 1.2, hg));
  c = mix(c, mix(hill, mix(slAmb, haze, .3 + .7 * sun), far * .6), bare);
 }
 float tr = (H - 3. * m - .06) / max(-rd.y, .02), rp = slPx * tr / f;
 vec2 rq = vec2(tr * sr, tr * vr - slBend(tr * sr)) - vec2(3.4, 3.15);
 c *= 1. - .45 * slS(.04 + rp, -.02, slRake(rq + vec2(.1, -.06)));
 c = mix(c, vec3(.3, .17, .08) * (slSunC * .6 * sun + slAmb), slS(rp, -rp, slRake(rq)));
 c = mix(c, mix(slAmb * vec3(1.1, 1.2, 1.35), haze, .3 + .7 * sun), far);
 col = mix(col, mix(c, farHill, slS(34., 60., t)), slS(.0, 2. * slPx, den - crest));
 // someone at work on a lip, with a rake of their own
 float fu = 7.75, fs = 7. + .4 * sin(uTime * .03), fv = fu + slBend(fs);
 vec3 at = vec3(fv * SLS - fs * SLC, 8. * m - H, fv * SLC + fs * SLS);
 vec2 fq = (p - vec2(.0, hz) - f * at.xy / at.z) * at.z / f / .36;
 float fw = slPx * at.z / f / .36, bow = .1 * sin(uTime * .4);
 if (abs(fq.x) < 2.2 && abs(fq.y - .8) < 1.2) {
  float body = min(slSeg(fq, vec2(-.12, .0), vec2(.0, .8)), slSeg(fq, vec2(.16, .0), vec2(.03, .8))) - .09;
  body = min(body, slSeg(fq, vec2(.0, .85), vec2(-.16, 1.3)) - .18);
  body = min(body, length(fq - vec2(-.26, 1.62)) - .14);
  float hat = slSeg(fq, vec2(-.5, 1.7), vec2(-.03, 1.74)) - .045, pole = slSeg(fq, vec2(.0, 1.15), vec2(-1.7, .1 + bow)) - .035;
  col = mix(col, vec3(.12, .07, .05) * (slAmb + slSunC), slS(fw, -fw, pole));
  col = mix(col, mix(vec3(.34, .05, .035), vec3(.03, .035, .06), slS(.9, .8, fq.y)) * (slAmb + slSunC * slS(.1, -.25, fq.x)), slS(fw, -fw, body));
  col = mix(col, vec3(.5, .36, .2) * (slAmb + slSunC * .6), slS(fw, -fw, hat));
 }
 return slShown(col);
}

// ---- b: cones on the shore
// The edge of a cone (below 0 is inside), and its width there.
vec2 slCone(vec2 q, float R, float Hc, float sink, float seed) {
 float y = sat(q.y / Hc), l = 1. - y, wob = sin(q.y / R * 9. + seed * 3.) * sin(q.x / R * 7. + seed * 1.7) + .6 * sin(q.y / R * 41. + seed * 3.);
 float w = R * sqrt(l * l + .09 * l * y) * (1. + .035 * wob);
 float foot = length(vec2(q.x, min(q.y, .0) / max(sink, .03))) - R * (1. + .035 * wob);
 return vec2(max(max((abs(q.x) - w) * .75, q.y - Hc), foot), w);
}
vec3 slHeap(float x, float y, float seed, float fine) {
 float turn = asin(clamp(x, -1., 1.));
 vec2 g = vec2(turn * 4. + seed, y * 4. - abs(turn)), dg = vec2(.22, .05);
 float bump = -slRise(g, dg) - .5 * slRise(g * 3.1, dg * 1.8);
 if (fine > .0) { vec2 s = vec2(turn * 30. + y * 9., y * 42. + seed * 9.); bump -= fine * .9 * slRise(s * 1.4, vec2(.7, .4)); }
 float lit = slS(-.02, .8, x * .85 - sqrt(max(1. - x * x, .0)) * .16 + .1 + .3 * bump);
 vec3 c = slSunC * vec3(.9, .84, .78) * lit * (1. + .4 * bump) + slAmb * vec3(.5, .68, .88) * (.6 + .35 * y + .4 * bump);
 c *= mix(mix(vec3(1.), vec3(.75, .92, .86), sat(-uOwn[4])), vec3(1., .72, .68), sat(uOwn[4]));
 return c * mix(.6, 1., slS(.0, .14, y + .1 * bump));
}
// Someone with a barrow.
float slBarrow(vec2 q, float stride) {
 float d = slSeg(q, vec2(.0, .85), vec2(.16 * stride - .03, .05)) - .08;
 d = min(d, slSeg(q, vec2(.0, .85), vec2(-.16 * stride - .06, .05)) - .08);
 d = min(d, slSeg(q, vec2(.0, .9), vec2(.1, 1.35)) - .17);
 d = min(d, length(q - vec2(.17, 1.64)) - .13);
 d = min(d, slSeg(q, vec2(.12, 1.33), vec2(.5, .82)) - .055);
 d = min(d, slSeg(q, vec2(.4, .8), vec2(1.5, .35)) - .035);
 d = min(d, length(q - vec2(1.55, .22)) - .2);
 d = min(d, slSeg(q, vec2(.85, .75), vec2(1.45, .75)) - .04 - .22 * sat(1. - abs(q.x - 1.15) * 1.6) * step(.7, q.y));
 return d;
}
vec3 slCones(vec2 p) {
 float high = sat(-uOwn[3]), low = sat(uOwn[3]), px = slPx;
 float eye = .48 + .04 * uSpace + .5 * high - .16 * low, flood = sat(uOwn[1]), hz = -.06 + .2 * high - .1 * low, vx = .36;
 slSun = normalize(vec3(.92, .25, .12));
 float dn = hz - p.y, up = abs(dn), z = eye / max(dn, .002);
 vec2 g = vec2(p.x * z, z);
 float rip = (slRun(vec2(g.x * 2., g.y * 7.), .25) - .5) * slS(.0, .1, dn);
 slHor = mix(slHor, slHor * (.5 + .8 * uKind[0]), .6 * uDrone);
 slTop = mix(slTop, slTop * (.4 + uKind[1]), .9 * uPad);
 vec3 sky = slSky(vec3(p.x, up + .006 * rip + .004, 1.));
 vec3 col = sky, ground = vec3(.0);
 float rr = length(g - vec2(1., 2.9)), wave = rr - 1.3 * (1. - uHits);
 float ring = dn > .0 ? uHits * (.55 * exp(-rr * rr * 2.5) + exp(-wave * wave * 25.) * (.5 + .5 * cos(wave * 34.))) : .0;
 float streak = dn > .0 ? slS(.62, .9, slRun(vec2(g.x * 3., g.y * 9.), -.5)) * (.06 + 1.3 * uPhrase + 1.2 * uKeys) * exp(-abs(p.x - vx - .06) * 5.) : .0;
 float gp = px * z, wet = .0;
 // the heaps, two rows of them, the near ones first
 float shade = .0, cov = .0, mcov = .0;
 vec4 hit = vec4(.0), mir = vec4(.0);
 vec2 Lh = normalize(slSun.xz);
 float rise = slSun.y / length(slSun.xz), S = exp2(-.5 * uOwn[2]);
 float big = exp2(.7 * uOwn[5]) * S, girth = .46 * exp2(-.2 * uOwn[5]) * S;
 if ((p.y - hz) * 1.08 < max(.72 * big - eye, .0) + .02) for (int n = 0; n < 18; n++) {
  if (cov >= 1.) break;
  float row = float(n & 1), zc = 1.08 + S * (1.4 * float(n >> 1) + .8 * row);
  float cx = vx * zc - (row < .5 ? 1.12 : 2.4), seed = fract(float(n) * .618 + .83) * 6.;
  float bd = uBands[(n * 5 + 3) & 15] * (.4 + uEnergy);
  float R = girth * (.9 + .03 * seed), Hc = .5 * big * (.84 + .2 * fract(seed * 3.7) + .28 * bd);
  vec2 q = vec2(p.x * zc - cx, (p.y - hz) * zc + eye);
  vec2 e = g - vec2(cx, zc);
  float along = max(-dot(e, Lh), .0), tall = along * rise;
  if (dn > .0 && tall < Hc) shade = max(shade, slS(.03 + .06 * along, -.03 - .03 * along, length(e + Lh * along) - R * (1. - tall / Hc)));
  if (abs(q.x) > R * 1.2 || abs(q.y) > Hc * 1.1) continue;
  float w = px * zc, sink = eye / zc;
  vec2 m = slCone(q, R, Hc, sink, seed);
  float c = slS(w, -w, m.x);
  if (c > .0) {
   if (cov < .5) { hit = vec4(q.x / max(m.y, .03 * R), q.y / Hc, seed, zc); cov = cov > .0 ? max(c, .99) : c; }
   else cov = 1.;
  }
  if (q.y < .0 && mcov <= .0) {
   m = slCone(vec2(q.x + .1 * rip * sink, -q.y), R, Hc, sink, seed);
   mcov = slS(2. * w, -2. * w, m.x);
   mir = vec4(q.x / max(m.y, .03 * R), -q.y / Hc, seed, .0);
  }
 }
 if (dn > .0 && cov < 1.) {
 // ruled ponds whose lines all end at the mill
  float a = (g.x - vx * g.y + .5) / 2.6, ia = floor(a);
  float b = g.y / 5. + .37 * ia, ib = floor(b);
  float ja = 1.3 - abs(fract(a) - .5) * 2.6, jb = 2.5 - abs(fract(b) - .5) * 5.;
  float grit = noise(g * 12.), wob = .06 * (noise(g * 2.) - .5) + .015 * (grit - .5);
  float dike = min(ja, jb) - .08 + wob + .25 * flood + .3 * slS(.04, .25, gp * z / eye);
  float h = hash21(vec2(ia, ib) + 2.);
  int kd = int(h * 4.99);
  vec3 br = mix(slBrine(kd), vec3(.42, .1, .11), .5 * (1. - abs(uOwn[4])));
  float lv = slHeard(vec2(.45 + ia * .19, 1.05 - b * .14), br);
  float view = dn / length(vec3(p.x, dn, 1.)), fres = mix(.15 + .2 * h, .85, pow(1. - view, 5.));
  vec3 dyed = mix(vec3(1.), br / max(max(br.r, br.g), max(br.b, .01)), .22 + .5 * abs(uOwn[4]) + .45 * lv);
  vec3 pond = mix(br * (.9 + lv + .6 * slKind(kd) - .4 * uDrone) * (slSunC * .4 + slAmb), sky * dyed, fres);
  pond += (slSunC * .35 + slAmb) * (1.6 * ring + streak);
  float full = min((abs(ia + .5) < .6 ? 1.4 : .62 + .4 * fract(h * 7.)) + .3 * lv + 1.5 * uOwn[1], 1.4);
  float ragged = .75 * noise(g * vec2(1.1, .8) + 7.) + .2 * grit + .3 * slS(.7, .0, dike);
  float dry = slS(full, full + .06 + gp, ragged);
  wet = slS(-.01, .02 + gp, dike) * (1. - dry);
  vec3 bank = mix(vec3(.86, .8, .77), vec3(.2, .12, .09), slS(-.02, -.04 - gp, dike)) * (.8 + .3 * grit) * (slSunC * .32 + slAmb);
  ground = mix(bank, pond * mix(.55, 1., slS(.0, .12 + gp, dike)), wet);
 }
 // a crust of crystals in the near corner
 float cr = 1.65 - 2. * flood + .7 * sat(-uOwn[1]) - g.y + .75 * (g.x - .75);
 if (dn > .0 && cov < 1. && cr > -.3) {
  cr += .5 * (noise(g * 4.) - .5);
  vec2 q = g * vec2(14., 8.), id0 = floor(q - .5);
  float near = -99., tone = .3, on = slS(.3, .5, cr);
  for (int n = 0; n < 4; n++) {
   vec2 id = id0 + vec2(n & 1, n >> 1), h = hash22(id), mid = .35 + .3 * h - vec2(.0, .2), o = q - id - mid;
   float size = (.3 + .26 * h.y) * slS(.0, .12, cr + .2 * (h.x - .5)) + 1e-3, turn = h.x * 1.6 - .8;
   vec2 w = rot(turn) * (o - vec2(.0, size)) / size, v = abs(w), s = abs(rot(turn) * o) / size;
   float top = max(v.x, v.y), side = max(s.x, s.y), by = -id.y - mid.y;
   if (min(top, side) < 1. && by > near) {
    near = by; on = 1.;
    float ledge = fract(top * 2.6);
    tone = top < 1. ? (.75 + .25 * h.x + (.1 + .9 * uTexture + .6 * uKeys) * step(.6, h.x) * sat(sin(uTime * .5 + h.x * 50.))) * (.8 + .2 * ledge + .2 * (v.x > v.y ? sign(w.x) : .5 * sign(w.y)) * slS(.1, .4, top)) : s.x > s.y ? .6 : .42;
   }
  }
  tone = mix(tone, .68, slS(.06, .26, gp * 14.));
  vec3 cs = vec3(.95, .87, .85) * (slSunC * .62 * tone + slAmb * (.3 + .7 * tone));
  ground = mix(ground, cs, on); wet *= 1. - on;
 }
 if (dn > .0) {
  ground *= mix(vec3(1.), vec3(.42, .5, .66), shade * (1. - .55 * wet));
  col = ground;
  if (mcov > .0) col = mix(col, mix(col, slHeap(mir.x, mir.y, mir.z, .0), .7), mcov * wet);
 }
 float lh = .008 + .012 * noise(vec2(p.x * 7., 1.));
 col = mix(col, mix(slHor, slAmb, .75), slS(px, -px, up - lh) * .85);
 col = mix(col, slHor, .6 * uMic * exp(-up * 25.));
 vec2 mq = vec2(p.x - vx - .02, up) / .12;
 float mill = max(abs(mq.x) - .2 + .07 * mq.y, mq.y - 1.);
 mill = min(mill, max(abs(mq.x) + 1.1 * (mq.y - 1.) - .16, .98 - mq.y));
 vec2 sq = rot(uTravel * .15) * (mq - vec2(.0, 1.02));
 float sail = 9.;
 if (dot(mq, mq) < 5.) for (int n = 0; n < 3; n++) {
  sq = rot(PI / 3.) * sq;
  sail = min(sail, min(max(abs(sq.x) - .02, abs(sq.y) - .75), max(abs(sq.x - .07 * sign(sq.y)) - .06, abs(abs(sq.y) - .52) - .2)));
 }
 float mw = px / .12;
 vec3 millC = mix(vec3(.7, .6, .55) * (slAmb + slSunC * .5 * slS(-.1, .18, mq.x)), slHor, .15);
 float seen = dn > .0 ? .6 * wet : 1.;
 col = mix(col, millC, slS(mw, -mw, mill) * seen);
 col = mix(col, vec3(.3, .2, .18) * slAmb, slS(mw, -mw, sail) * seen * .8);
 // someone going home with a barrow
 float go = .62 + .1 * sin(uTime * .02), pz = 13.;
 vec2 bq = vec2((p.x - go) * pz, (p.y - hz) * pz + eye);
 if (abs(bq.x) < 2.2 && abs(bq.y) < 2.) {
  float bw = px * pz, bd = slBarrow(vec2(-bq.x, abs(bq.y)), sin(uTime * .9));
  col = mix(col, vec3(.12) * slAmb, slS(bw, -bw, bd) * (bq.y > .0 ? 1. : .55 * wet));
 }
 if (cov > .0) {
  float go = hit.w - 1. - 10. * (1. - uCue);
  col = mix(col, slHeap(hit.x, hit.y, hit.z, slS(6., 1.5, hit.w)) * (1. + 1.3 * uCue * exp(-go * go * .2)), cov);
 }
 return slShown(col);
}
vec3 slHour(vec3 c, vec3 night, vec3 red) { return mix(mix(c, night, sat(-uOwn[0])), red, sat(uOwn[0])); }
vec3 render(vec2 p) {
 slPx = 1. / uRes.y;
 bool b = uVar > .5;
 if (b) p.x += .19 * slS(1.3, .6, uRes.x / uRes.y);
 slSunC = slHour(b ? vec3(2.1, 1.2, .66) : vec3(1.9, 1.5, 1.02), vec3(.28, .38, .62), vec3(2., .66, .28)) * (.92 + .08 * uTone + .08 * uLevel);
 slAmb = slHour(b ? vec3(.21, .23, .38) : vec3(.2, .27, .4), vec3(.032, .048, .1), vec3(.15, .11, .25));
 slTop = slHour(b ? vec3(.34, .38, .6) : vec3(.2, .36, .62), vec3(.015, .03, .08), vec3(.18, .14, .36));
 slHor = slHour(b ? vec3(1., .55, .36) : vec3(.85, .66, .5), vec3(.06, .1, .18), vec3(.93, .27, .14));
 return b ? slCones(p) : slPans(p);
}
