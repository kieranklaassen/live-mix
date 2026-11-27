// name: Humming rods
// a: Five rods
// b: One long wire
// what: Five steel rods stand on plain plinths before a plaster wall, shaken so fast that each is a vase of blur: pinched at its still places, bellied between, bright at both outlines, its soft shadow behind it; or one long wire runs across a dark room under a single wall lamp and swings into long bellies and bright knots.
// follows: Each kind of sound is one rod, or one set of bellies on the wire: the louder, the wider. The drone has few still places, texture many; keys add one to the phrase. The bands are the inner outlines, low notes soften shadows, the loop moves the lamp. A hit whips the shortest rod or runs along the wire; a cue swells and brightens.
// own: 0 1 many slender ones (b: several wires), -1 a few great ones (b: one great belly); 1 1 solid turned bodies, -1 threaded smooth stones; 2 the room: 1 pale and bright, -1 night and each shines by itself; 3 1 they stand on still water and are mirrored, -1 they hang from above (b: steeply); 4 1 scattered near and far (b: drawn level across), -1 seen close up; 5 1 dyed in the sounds' colours, -1 dark shapes before a lit wall; 6 1 twice as many still places, -1 none, each is one spindle; 7 1 a cage of fine threads, -1 soft as a flame
vec3 hrLamp; // where the lamp hangs

float hrUp(float w, float x) { return smoothstep(-w, w, x); }
// How much of the time a swinging rod is over this place: x from its axis, A how far it swings, r half its thickness.
float hrOver(float x, float A, float r) {
 return (asin(clamp((x + r) / A, -1., 1.)) - asin(clamp((x - r) / A, -1., 1.))) / PI;
}
// A rod held at its foot and free at its tip, ringing with n - 1 still places: its swing at s (0 foot, 1 tip), and the slope of it.
vec2 hrMode(float n, float s) {
 if (n < 1.5) return vec2(s * s * (3. - s), 6. * s - 3. * s * s) * .5;
 float b = (n - .5) * PI, a = b * s - PI * .25;
 float e0 = exp(-b * s), e1 = (mod(n, 2.) < .5 ? -1. : 1.) * exp(-b * (1. - s));
 return .5 * vec2(e0 + 1.4142 * sin(a) + e1, b * (-e0 + 1.4142 * cos(a) + e1));
}
// Bare steel takes the hue a fire leaves on it: straw, bronze, violet, blue.
vec3 hrSteel(int k, float much) {
 vec3 c = uKind[k] * uKind[k];
 c /= max(dot(c, vec3(.3, .59, .11)), .05);
 return mix(vec3(1., .97, .93), min(c, 2.), much);
}
// The light a thin bright rod throws back when it lies along T: wide, and sharp.
vec2 hrShine(vec3 T, vec3 L, vec3 V) {
 T = normalize(T);
 float l = dot(T, L), h = dot(T, normalize(L + V)), w = max(1. - h * h, 0.);
 return vec2(sqrt(max(1. - l * l, 0.)), pow(w, mix(26., 90., uTone)));
}

float hrM, hrE, hrS, hrB, hrP, hrN, hrW, hrH, hrD, hrK, hrC, hrF;
void hrRead() {
 hrM = max(uOwn[0], 0.); hrE = max(-uOwn[0], 0.); hrS = max(uOwn[1], 0.); hrB = max(-uOwn[1], 0.);
 hrP = max(uOwn[2], 0.); hrN = max(-uOwn[2], 0.); hrW = max(uOwn[3], 0.); hrH = max(-uOwn[3], 0.);
 hrD = max(uOwn[5], 0.); hrK = max(-uOwn[5], 0.); hrC = max(uOwn[7], 0.); hrF = max(-uOwn[7], 0.);
}
// A body of another stuff (xyz light, w cover): side is across it, z how far it faces us, A half its width, bead a place on a stone.
vec4 hrBody(vec4 was, float side, float z, float along, float A, float w, vec2 bead, float bw, vec3 n, vec3 L, vec3 V, vec3 hue, vec3 lamp, vec3 fill, float loud, float turn) {
 float on = step(abs(side), .999) * (1. - hrB);
 if (hrP > 0.) was = mix(was, vec4(hue * hue * .55 * (.35 + .65 * z), 1. - (1. - was.w) * (1. - was.w) * (1. - .75 * hrD * on)), .85 * hrP * (1. - hrF));
 if (hrN > 0.) was.rgb = mix(was.rgb, was.rgb * .3 + hue * (.25 + 1.3 * loud) * (.5 + .9 * side * side), hrN);
 float b2 = dot(bead, bead), bz = sqrt(max(1. - b2, 0.));
 if (hrS > 0. || hrB > 0.) {
  vec3 stuff = mix(vec3(.72, .69, .65), hue * hue * 1.1 + .02, .35 + .6 * max(hrD, hrB));
  for (int f = 0; f < 2; f++) {
   float much = f == 0 ? hrS : hrB, zz = f == 0 ? z : bz;
   if (much <= 0.) continue;
   vec3 m = f == 0 ? n : normalize(vec3(bead, bz + .02));
   vec3 alb = stuff * (f == 0 ? .96 + .08 * sin(along * 260. + 3. * noise(vec2(along * 40., side * 2.))) : .85 + .3 * noise(bead * 3. + along * 9.));
   float gl = pow(sat(dot(m, normalize(L + V))), 50.);
   vec3 c = alb * (lamp * sat(dot(m, L) * .8 + .2) * (1.1 + .5 * loud) + fill * (.7 + .5 * m.y)) + lamp * gl * .5 + fill * (1. - zz) * .5;
   c += alb * hue * hrN * (.12 + .9 * loud) * (.4 + .6 * zz);
   was = mix(was, vec4(c, f == 0 ? 1. - hrUp(w, abs(side) * A - A + w) : 1. - smoothstep(1. - bw, 1. + bw, sqrt(b2))), much);
  }
 }
 if (hrC > 0.) {
  float a = asin(side), th = .0024 + w * .7;
  vec2 thr = vec2(0.);
  for (int f = 0; f < 2; f++) {                                             
   float off = (fract((f == 0 ? a : PI - a) * 11. / PI + turn) - .5) / 11. * PI * A * max(z, .12);
   float ring = (fract(along / .17) - .5) * .17 + (f == 0 ? -.05 : .05) * A * z;
   thr[f] = max(1. - smoothstep(th - w, th + w, abs(off)), .8 * (1. - smoothstep(th - w, th + w, abs(ring))));
  }
  vec3 lit = mix(vec3(.9), hue, .35 + .55 * hrD) * (lamp * (.35 + .65 * sat(dot(n, L) + .3)) + fill + hrN * hue * (.3 + 1.6 * loud)) * (1. - .72 * hrP);
  was = mix(was, vec4(lit * mix(.5, 1., thr.x), step(abs(side), .999) * (.2 + .8 * smoothstep(w, w + .03, A)) * max(thr.x, .6 * thr.y)), hrC);
 }
 if (hrK > 0.) was = mix(was, vec4(was.rgb * .05 + hue * hue * loud * .05, 1. - (1. - was.w) * (1. - was.w) * (1. - .8 * on)), hrK);
 return was;
}
// ---- a: five rods on plinths
const float hrZ = 1.; // how far the row stands from the wall
vec4 hrRod[9]; // where it stands, the plinth's height, the rod's length, how far it swings
const float hrKnot[5] = float[5](2., 3., 6., 4., 1.);
float hrDeep[9]; // how far each stands from the wall
int hrAll = 5;
const float hrHalf = .2; // half a plinth

// How far rod k swings at height y, and the slope: x the swing, y the slope
vec2 hrSwing(int k, float y) {
 float len = hrRod[k].z;
 len = max(len, .01);
 float s = sat((y - hrRod[k].y) / len);
 vec2 m = abs(uOwn[6]) < 1. ? hrMode(hrKnot[k % 5], s) : vec2(0.);
 m *= m.x < 0. ? -1. : 1.;
 if (uOwn[6] > 0.) {
  vec2 m2 = hrMode(2. * hrKnot[k % 5] + 2., s);
  m = mix(m, m2 * (m2.x < 0. ? -1. : 1.), uOwn[6]);
 }
 if (uOwn[6] < 0.) { // one spindle, fuller below
  float q = s * (2. - s * (1. - .45 * sin(float(k) * 2.4))) / (1. + .45 * sin(float(k) * 2.4)), e = sin(PI * sat(q));
  m = mix(m, vec2(.9 * e * e * (1.3 - .3 * e), .9 * 2. * PI * e * cos(PI * sat(q)) * .9), -uOwn[6]);
 }
 if (k == 3 && uOwn[6] == 0. && uKeys > .002) { // keys: one knot more
  vec2 m2 = hrMode(5., s);
  m = mix(m, m2 * (m2.x < 0. ? -1. : 1.), .85 * uKeys);
 }
 return m * hrRod[k].w * vec2(1., 1. / len);
}
float hrSpot(vec3 q) { // the lamp's beam on the wall
 vec2 d = (q.xy - vec2(hrLamp.x * .22 + .2, 1.75)) * vec2(.62, 1.);
 return .07 + 1.1 * exp(-dot(d, d) * mix(.62, .36, uSpace));
}
vec3 hrRoom(vec2 p) {
 float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, sat(uHits * uHits + .4 * uCue));
 float hw = .5 * uRes.x / uRes.y;
 float zoom = clamp(.8 / hw, 1., 1.6), tight = clamp(hw * zoom / .8, .55, 1.);
 p = p * zoom + vec2(0., (zoom - 1.) * .18 - .2 * hrW);
 float pxs = zoom / uRes.y, close = max(-uOwn[4], 0.), deepIn = max(uOwn[4], 0.);
 if (close > 0.) { p = p / (1. + 1.1 * close) + close * vec2(-.2, .12) * tight; pxs /= 1. + 1.1 * close; }
 // the five: pad, drone, texture, hit, phrase from left to right
 const float cx[5] = float[5](-1.18, -2.22, 0., 2.05, .86);
 const float ph[5] = float[5](.46, .86, 1., .6, .72);
 const float rl[5] = float[5](2.3, 1.55, 1.42, 1.92, 1.05);
 const float am[5] = float[5](.42, .34, .2, .34, .36);
 if (hrM > 0.) hrAll = 5 + int(ceil(hrM * 4.));
 for (int k = 0; k < 5; k++) {
  float fk = float(k);
  float breathe = .93 + .07 * sin(uTime * (.31 + .07 * fk) + fk * 2.1); // the orbit turns slowly, and looks wider and narrower
  float a = am[k] * (.04 + .8 * lv[k] * (.65 + .5 * uEnergy) / (.45 + .55 * lv[k]) + 1.2 * uCue * (1. - uCue));
  hrRod[k] = vec4(cx[k] * tight, ph[k], rl[k], a * breathe);
  hrDeep[k] = hrZ;
 }
 float yaw = -.2 + .03 * sin(uTime * .041), f = 2.26;
 vec3 fw = vec3(sin(yaw), 0., -cos(yaw)), rt = vec3(cos(yaw), 0., sin(yaw));
 vec3 ro = vec3(0., 1.38, hrZ) - fw * 7.5 + rt * .05;
 if (uOwn[0] != 0. || uOwn[3] != 0. || deepIn > 0. || uOwn[1] != 0.) {
  if (hrE > 0.) { lv[1] = mix(lv[1], max(lv[1], lv[2]), hrE); lv[3] = mix(lv[3], max(lv[3], lv[4]), hrE); }
  for (int k = 0; k < hrAll; k++) {
   float fk = float(k);
   vec3 h = fract(fk * vec3(.618, .381, .83) + .4);
   vec4 R = hrRod[k % 5];
   float here = 1.;
   if (k > 4) {
    here = smoothstep(0., .25, hrM - .25 * (fk - 5.));
    R.y = .3 + .7 * h.x; R.z = 1.1 + 1.1 * h.y;
    R.w *= .75 + .5 * h.z;
   }
   if (k > 4) R.x = vec4(-1.7, 1.46, -.58, 2.62)[k - 5] * tight;
   R.w *= 1. - .42 * hrM;
   if (hrE > 0.) {
    if (k == 2 || k == 4) here *= 1. - sat(hrE * 1.3);
    R.x = mix(R.x, (k == 0 ? -.1 : k == 1 ? -2. : 1.75) * tight, hrE);
    R.z *= 1. + .12 * hrE; R.w *= 1. + .75 * hrE; R.y *= 1. - .45 * hrE;
   }
   R.z *= here; R.w = max(R.w * here, 1e-4);
   R.w += (.05 * hrS + .03 * hrB) * here;
   if (hrW > 0.) { R.y *= 1. - hrW; R.z *= 1. - .28 * hrW; }
   if (hrH > 0.) { R.y = mix(R.y, 2.5 + .5 * h.x - .8 * R.z, hrH); R.z *= 1. - .25 * h.y * hrH; }
   hrDeep[k] = hrZ;
   if (deepIn > 0.) {
    float zz = mix(hrZ, .5 + 3.6 * fk / float(hrAll - 1), deepIn), d0 = (hrZ - ro.z) / fw.z, d1 = (zz - ro.z) / fw.z;
    R.x = ro.x + fw.x * d1 + (R.x - ro.x - fw.x * d0) * d1 / d0;
    hrDeep[k] = zz;
   }
   if (k < 5 || hrM > 0.) hrRod[k] = R;
  }
 }
 float ys = p.y + .034;
 vec3 rd = fw + rt * p.x / f + vec3(0., ys / f, 0.);
 hrLamp = vec3(-2.9 + .55 * sin(TAU * uLoop), 2.95 + .2 * cos(TAU * uLoop), 5.4);
 vec3 lamp = mix(vec3(1., .80, .60), vec3(1., .93, .84), uTone) * (1. + .12 * uLevel + .15 * uMic);
 if (uOwn[2] != 0.) lamp = mix(lamp * (1. - .72 * hrN), vec3(1.05, 1.02, .98), .75 * hrP);
 float soft = mix(.03, .09, uSpace) + .03 * uLow; // how soft a shadow's edge is on the wall

 // wall or floor
 float tw = -ro.z / rd.z, tf = rd.y < 0. ? -ro.y / rd.y : 1e5;
 bool isWall = tw < tf;
 vec3 q = ro + rd * min(tw, tf);
 bool mirror = false;
 float rip = 0.;
 vec3 qw = q;
 if (hrW > 0. && !isWall) { // still water shows the wall behind
  rip = noise(vec2(q.x * 1.6 + uTime * .11, q.z * 7. - uTime * .16)) + .6 * noise(vec2(q.x * 4. - uTime * .13, q.z * 17. + uTime * .21)) - .8;
  mirror = true; isWall = true;
  float back = -q.z / rd.z;
  q = vec3(q.x + rd.x * back, -rd.y * back + .12 * rip, 0.);
 }
 vec3 L = hrLamp - q; float ld = length(L); L /= ld;
 vec3 alb; float ndl, dark = 0.;
 float wear = noise(q.xy * vec2(2.1, 2.9)) * .6 + noise(q.xy * vec2(7., 9.) + 3.) * .4;
 if (isWall) {
  ndl = L.z;
  float comb = noise(q.xy * vec2(26., 60.) + wear * 4.);
  alb = vec3(.52, .465, .405) * (.88 + .15 * wear + .06 * comb);
  vec2 m = mix(hrLamp.xy, q.xy, (hrLamp.z - hrZ) / hrLamp.z); // the same ray where it passes the row
  if (hrK < 1. && (hrN < 1. || hrW < 1.)) for (int k = 0; k < hrAll; k++) {
   vec4 R = hrRod[k];
   if (uOwn[4] > 0.) m = mix(hrLamp.xy, q.xy, (hrLamp.z - hrDeep[k]) / hrLamp.z);
   float lo = R.y, hi = R.y + R.z;
   float x = m.x - R.x;
   float sb = soft * 1.5 + .06 * uLow;
   if (m.y < R.y + sb && abs(x) < hrHalf + sb + .05 && hrH < .5) {
    vec2 sx = smoothstep(vec2(hrHalf - sb), vec2(hrHalf + sb), abs(x + vec2(.05, -.05) * uLow));
    dark = max(dark, (1. - .5 * (sx.x + sx.y)) * (1. - smoothstep(R.y - sb, R.y + sb, m.y)) * .8 * (1. - hrW) * (1. - hrH));
   }
   if (abs(x) > R.w + 1.8 * soft || m.y < lo - .1 || m.y > hi + soft) continue;
   vec2 sw = hrSwing(k, m.y);
   float A = sw.x + soft * .35;
   if (hrS < 1.) {
   float c = hrOver(x, A, soft * .5) * .45 + hrOver(x, A + soft * .4, soft) * .275 + hrOver(x, A * .6, soft) * .12;
   dark = max(dark, (1. - exp(-c * 1.9)) * (1. - smoothstep(hi - soft, hi + soft, m.y)) * .8 * (hrH > 0. ? smoothstep(lo - soft, lo + soft, m.y) : 1.) * (1. - hrN) * (1. - .5 * hrB));
   }
   if (uOwn[1] != 0.) dark = max(dark, abs(uOwn[1]) * .7 * (1. - smoothstep(sw.x - soft, sw.x + soft, abs(x))) * smoothstep(lo - soft, lo + soft, m.y) * (1. - smoothstep(hi - soft, hi + soft, m.y)));
  }
  dark = max(dark, .35 * exp(-q.y * 9.));
 } else {
  ndl = L.y * 1.5;
  alb = vec3(.30, .275, .25) * (.9 + .2 * noise(q.xz * 3.));
  vec2 dir = hrLamp.xz - q.xz;
  dir += step(abs(dir), vec2(1e-4)) * 3e-4;
  for (int k = 0; k < hrAll; k++) {
 // where the way to the lamp passes over a plinth, seen from above
   if (hrH >= .5 || (k > 4 && hrRod[k].z < .05)) continue;
   vec2 o = q.xz - vec2(hrRod[k].x, hrDeep[k]);
   vec2 a = (-hrHalf * 1.02 - o) / dir, b = (hrHalf * 1.02 - o) / dir;
   vec2 lo = min(a, b), hi = max(a, b);
   float n = max(max(lo.x, lo.y), 0.), e = min(min(hi.x, hi.y), hrRod[k].y / hrLamp.y);
   dark = max(dark, smoothstep(-.006, .016 + .02 * n, e - n) * .85 * (1. - hrH));
   vec2 g = max(abs(o) - hrHalf, 0.);
   dark = max(dark, .7 * exp(-length(g) * 12.));
  }
  dark = max(dark, .3 * exp(-q.z * 5.));
 }
 float fall = 36. / (ld * ld);
 float spot = hrSpot(isWall ? q : vec3(q.x, -.2, 0.));
 vec3 fill = vec3(.07, .085, .11);
 if (uOwn[2] != 0. || hrD > 0. || hrK > 0.) {
  fill = mix(fill * (1. - .8 * hrN), vec3(.42, .44, .47), hrP);
  alb = mix(alb * (1. - .75 * hrN), vec3(isWall ? .8 : .7) * (.95 + .05 * wear), hrP);
  vec3 dye = mix(uKind[0], uKind[1], sat(q.y * .32 + .25 * (wear - .5)));
  alb = mix(alb, alb * (.1 + dye * dye * 2.2), hrD * (.9 - .6 * hrP));
  spot = mix(spot, .75 + .35 * spot, hrP);
  if (hrK > 0.) { vec2 b = (q.xy - vec2(.1, 1.5)) * vec2(.5, .75); spot = mix(spot, isWall ? .12 + 1.5 * exp(-dot(b, b)) : .25, hrK); dark *= 1. - hrK; fill *= 1. - .6 * hrK; }
 }
 // a hit: the short rod throws its light on the wall behind it
 vec2 hp = q.xy - vec2(hrRod[4].x + .1, isWall ? hrRod[4].y + .75 : .9);
 vec3 struck = hrSteel(4, .5) * uHits * exp(-dot(hp, hp) * 2.6) * .42;
 vec3 col = alb * (lamp * ndl * fall * spot * (1. - dark) + fill + struck);
 if (hrN > 0.) { // what shines lights the wall behind it
  for (int k = 0; k < hrAll; k++) {
   vec4 R = hrRod[k];
   vec2 o = vec2(q.x - R.x, (q.y - R.y - .5 * R.z) * .55);
   col += hrN * alb * uKind[k % 5] * (.05 + .75 * lv[k % 5]) * exp(-dot(o, o) * 3.2) * step(.05, R.z);
  }
 }
 if (mirror) {
  float fres = .5 + .45 * pow(1. - sat(-normalize(rd).y), 5.);
  vec3 deepC = mix(vec3(.012, .016, .018), vec3(.2, .23, .24), hrP);
  vec3 was = vec3(.30, .275, .25) * (lamp * .25 + fill);
  col = mix(was, mix(deepC, col, fres), smoothstep(0., .6, hrW));
  col *= .8 + .2 * smoothstep(0., 1.2, qw.z);
 }

 // plinths, then the rod on each
 for (int k = 0; k < hrAll; k++) {
  vec4 R = hrRod[k];
  if (R.z < .03) continue;
  float zK = hrDeep[k];
  vec3 c0 = vec3(R.x, 0., zK) - ro;
  float d = dot(c0, fw), w = pxs * d / f; // a pixel's size there
  float sx = p.x * d / f - dot(c0, rt); // sideways from the axis, in the axis's own plane
  float wy = ro.y + ys * d / f;
  if (abs(sx) > max(.36, R.w * 1.2 + .08) + .4 * hrF) continue;
  vec3 base = vec3(R.x, R.y, zK);
  vec3 Lr = normalize(hrLamp - base);
  float lit0 = 30. / dot(hrLamp - base, hrLamp - base);
  float beam = .45 + .55 * hrSpot(base + vec3(0., .2, 0.));
  float plinth = (1. - hrW) * sat(1. - 2. * hrH);
  if (wy < R.y + .2 && plinth > .02) {
   vec3 pa = mix(vec3(.60, .575, .54) * (1. - .8 * hrN) * (1. - .9 * hrK), vec3(.8), hrP);
   if (hrD > 0.) pa = mix(pa, pa * (.25 + 1.1 * uKind[0]), hrD);
 // top, side, front
   float tt = (R.y - ro.y) / min(rd.y, -1e-4); vec3 h = ro + rd * tt;
   vec2 g = abs(h.xz - base.xz) - hrHalf;
   float cov = R.y < ro.y ? (1. - hrUp(w, g.x)) * (1. - smoothstep(-w * 2., w * 4., g.y)) * step(rd.y, 0.) : 0.;
   float foot = exp(-length(h.xz - base.xz) * 16.);
   col = mix(col, pa * (lamp * lit0 * beam * (Lr.y * 1.15 + .15) * (1. - .45 * foot) + fill * 1.6), cov);
   float side = ro.x < R.x ? -1. : 1.;
   h = ro + rd * (R.x + side * hrHalf - ro.x) / (abs(rd.x) < 1e-5 ? 1e-5 : rd.x);
   cov = (1. - hrUp(w, abs(h.z - zK) - hrHalf - w)) * (1. - hrUp(w, h.y - R.y)) * hrUp(w, h.y);
   float grd = .55 + .45 * smoothstep(0., .6, h.y);
   col = mix(col, pa * (lamp * lit0 * beam * sat(side * Lr.x * 1.1) * grd + fill * grd), cov);
   h = ro + rd * (zK + hrHalf - ro.z) / rd.z;
   cov = (1. - hrUp(w, abs(h.x - R.x) - hrHalf)) * (1. - hrUp(w, h.y - R.y)) * hrUp(w, h.y);
   grd = .6 + .4 * smoothstep(0., .7, h.y);
   col = mix(col, pa * (.97 + .06 * noise(h.xy * 9. + R.x)) * (lamp * lit0 * beam * Lr.z * grd * .92 + fill * grd), cov);
  }
  float H = R.y + R.z, lo = R.y, hi = H, seen = 1.;
  if (hrW > 0. && wy < R.y) { // its image
   float far = (R.y - wy) * 1.02;
   sx += .05 * rip * smoothstep(0., .5, far); wy = R.y + far + .04 * rip * smoothstep(0., .5, far);
   seen = .6 * hrW;
  }
  if (hrF > 0. && wy > lo - .5 && wy < hi + .5) { // a soft light round it
   float y2 = clamp(wy, lo, hi), a2 = hrSwing(k, y2).x, far = length(vec2(max(abs(sx) - a2, 0.), wy - y2));
   col += hrF * seen * (1. - hrK) * uKind[k % 5] * lamp * (.1 + .6 * lv[k % 5]) * sat(.1 + a2 * 18.) * (exp(-far * 9.) * .5 + exp(-far * 30.) * .4) * (1. - .6 * hrP);
  }
  if (hrH > 0.) col = mix(col, mix(vec3(.03), uKind[k % 5] * .2, hrD), .8 * hrH * step(hi, wy) * (1. - smoothstep(w * .4, w * 1.6, abs(sx))));
  if (wy > hi + .12 || wy < lo - .03 - .1 * hrH || abs(sx) > R.w + .05 + .05 * hrB) continue;
 // the rod
  vec2 sw = hrSwing(k, wy);
  float A = max(sw.x, w + .018 * hrS), r = max(.0105, w * .95);
  float u = clamp(sx / A, -1., 1.), z = sqrt(1. - u * u);
  int kk = k % 5;
  float bnd = band((.08 + .2 * float(kk)));
  float c1 = hrOver(sx, A, r);
  float in1 = .28 + .5 * bnd, in2 = .62 + .25 * uBands[2 + 2 * kk];
  float c2 = 0., c3 = 0.;
  if (hrS < 1.) { c2 = hrOver(sx, max(A * in1, w), r); c3 = hrOver(sx, max(A * in2, w), r); }
  float cover = c1 + (.30 * c2 + .28 * c3) * sat(A / r * .2 - .1) ;
  float tipE = (H - ro.y) / d, tz = sqrt(max(hrRod[k].w * hrRod[k].w - sx * sx, 0.));
  float nearHalf = (1. - hrUp(w, wy - H - tipE * tz)), farHalf = (1. - hrUp(w, wy - H + tipE * tz));
  float op = (1. - exp(-cover * 3.2)) * .97 * mix(1., .55 + .45 * u * u, sat(A / r * .15 - .2));
  float ends = .5 * (nearHalf + farHalf) * smoothstep(R.y - w, R.y + w, wy);
  if (hrS > 0. || uOwn[6] < 0.) ends = mix(ends, smoothstep(lo - w, lo + w, wy) * smoothstep(hi + w, hi - w, wy), max(hrS, max(-uOwn[6], 0.)));
  op *= ends;
  vec3 V = -normalize(rd), Lw = normalize(hrLamp - vec3(R.x, wy, hrZ));
  vec3 Tn = rt * (sw.y * u) - fw * (sw.y * z) + vec3(0., 1., 0.), Tf = rt * (sw.y * u) + fw * (sw.y * z) + vec3(0., 1., 0.);
  vec2 s1 = hrShine(Tn, Lw, V), s2 = hrShine(Tf, Lw, V);
  vec3 tint = hrSteel(kk, .06 + .42 * sqrt(lv[kk]));
  if (hrD > 0.) tint = mix(tint, uKind[kk] * 1.15, hrD);
  float hit = (k == 4 ? uHits * 1.3 : 0.) + .8 * uCue;
  float lit = lit0 * beam;
  vec3 body = tint * (.23 * (s1.x * s1.x + s2.x * s2.x) + .35 * sat(-u) * sat(-u) + .25 * hit);
  vec3 steel = lamp * lit * (body + mix(tint, vec3(1.), .6) * (1.1 + 1.2 * hit) * (s1.y + s2.y * .6)) + fill * tint;
  vec4 made = vec4(steel, op);
  if (uOwn[1] != 0. || uOwn[7] != 0. || uOwn[2] != 0. || hrK > 0.) {
   if (hrF > 0.) { made.rgb = mix(made.rgb, tint * lamp * (.35 + 1. * lv[kk]) * (.5 + .5 * z), hrF); made.w = mix(made.w, ends * (.75 * z * z * sat(A * 14. - .15)) * (1. - hrUp(w, abs(sx) - A)), hrF); }
   vec3 nn = normalize(rt * u - fw * (z + .02) - vec3(0., sw.y, 0.));
   vec2 bead = vec2(2.);
   float gap = .115, rb = 1.;
   if (hrB > 0.) { // stones, each as wide as the swing at its middle
    float at = (wy - R.y) / gap, mid = (floor(at) + .5) * gap, full = floor(R.z / gap) * gap;
    rb = .035 + hrSwing(k, R.y + mid).x;
    bead = abs(mid) < full ? vec2(sx / rb, (fract(at) - .5) / .5) : vec2(9.);
   }
   made = hrBody(made, u, z, wy - R.y, A, w, bead, w / min(rb, gap * .5), nn, Lw, V, uKind[kk], lamp * lit * (1. - .8 * hrK), fill, lv[kk], uTime * .12 + float(k));
   made.w *= mix(ends, 1., hrB);
  }
  col = mix(col, made.rgb, made.w * seen);
 // a round foot that holds it
  float ch = (1. - hrUp(w, abs(sx) - .036 + .2 * max(wy - R.y, 0.))) * (1. - hrUp(w, wy - R.y - .055)) * hrUp(w, wy - R.y + .012);
  ch *= seen * (1. - hrW) * (1. - hrS) * (1. - hrF) * (1. - hrH);
  float cu = sx / .036;
  col = mix(col, vec3(.05, .048, .045) + lamp * lit0 * .5 * exp(-(cu + .35) * (cu + .35) * 14.), ch);
 // the ring the tip draws in the air
  float ring = min(abs(wy - H - tipE * tz), abs(wy - H + tipE * tz)), hoop = seen * (1. - hrS) * (1. - hrF) * (1. - hrK) * (1. - hrB) * (1. - max(-uOwn[6], 0.));
  col = mix(col, tint * lamp * lit0 * beam * 1., (1. - smoothstep(0., r * .4 + w, ring)) * (.28 + .25 * sat(-u)) * step(abs(sx), hrRod[k].w) * sat(tz / hrRod[k].w * 3.) * hoop);
 }
 return screenOf(col * 1.5);
}

// ---- b: one wire in a dark room
// each kind has its own stretch of the wire: where it begins, how long one belly is, and how far it swings
const vec2 hrEnds[4] = vec2[4](vec2(-9., .2), vec2(.2, .36), vec2(.56, 9.), vec2(.36, .56));
const vec3 hrPart[4] = vec3[4](vec3(.02, .18, .14), vec3(.20, .08, .075), vec3(.56, .05, .048), vec3(.36, .0667, .06));
// Where the wire hangs, how near it is, and how far along it one is, at x on the screen: the line runs away to the right
vec3 hrLine(float x) {
 float S = max(1. - .55 * x, .2);
 vec3 was = vec3(-.035 + .15 * x + .03 * x * x, S, .2 * (x + 1.25) / S);
 if (uOwn[4] > 0.) was = mix(was, vec3(-.01, 1., .34 * x + .36), uOwn[4]);
 was.z *= 1. - .55 * hrE;
 return was;
}
float hrAmp[4];
int hrAt(float u) { return u < .2 ? 0 : u < .36 ? 1 : u < .56 ? 3 : 2; }
vec2 hrBelly(int k, float u) { // how far it swings there, and its slope
 float more = exp2(uOwn[6] * (uOwn[6] > 0. ? 1. : 1.6)), pinch = 1.;
 if (uOwn[6] != 0.) { // the stretches keep their ends still
  float own = min(u - hrEnds[k].x, hrEnds[k].y - u);
  pinch = sqrt(sat(own * 14.)) * min(1., .6 + .4 / more);
 }
 float a = PI * (u - hrPart[k].x) / hrPart[k].y * more, s = sin(a), g = PI / hrPart[k].y * more;
 vec2 b = vec2(abs(s), g * cos(a) * (s < 0. ? -1. : 1.) * .36);
 if (k == 3 && uOwn[6] == 0.) { // keys: one knot more
  a *= 4. / 3.; s = sin(a);
  b = mix(b, vec2(abs(s), g * 1.333 * cos(a) * (s < 0. ? -1. : 1.) * .36), .85 * uKeys);
 }
 return b * hrAmp[k] * pinch;
}
float hrWireAt(int j) { return float((j + 1) / 2) * (j % 2 == 1 ? 1. : -1.); } // 0, 1, -1, 2, -2
vec3 hrWire(vec2 p) {
 float lv[4] = float[4](uDrone, uPad, uTexture, uPhrase);
 for (int k = 0; k < 4; k++) {
  float fk = float(k);
  hrAmp[k] = hrPart[k].z * ((.025 + .72 * lv[k] * (.8 + .4 * uEnergy) / (.35 + .65 * lv[k])) * (.92 + .08 * sin(uTime * (.27 + .06 * fk) + fk * 1.9)) + 1.6 * uCue * (1. - uCue));
 }
 float hw = .5 * uRes.x / uRes.y, zoom = clamp(.8 / hw, 1., 1.5);
 p *= vec2(clamp(.8 / hw, 1., 2.6), zoom);
 float px = zoom / uRes.y, close = max(-uOwn[4], 0.);
 if (close > 0.) { p = p / (1. + .9 * close) + close * vec2(-.1, 0.); px /= 1. + .9 * close; }
 for (int k = 0; k < 4; k++) hrAmp[k] = hrAmp[k] * (1. - .45 * hrM + .5 * hrE) + .02 * hrS;
 int wires = hrM > 0. ? 5 : 1;
 vec2 pw = p;                                                      
 if (hrH > 0.) pw = rot(1.2 * hrH) * p;
 float la = TAU * uLoop;
 hrLamp = normalize(vec3(-.55 + .3 * sin(la), .8, .55 + .15 * cos(la)));
 vec3 lamp = mix(vec3(1., .74, .5), vec3(1., .92, .82), uTone);
 // the room: a dark wall with a lamp hung close to it, shining down
 vec2 d = vec2(p.x - .22 - .05 * sin(la) - .03 * sin(uTime * .05), .72 - p.y);
 float near2 = mix(.03, .07, uSpace), dy = max(d.y, 0.), d3 = d.x * d.x * .75 + near2 + dy * dy, ca = dy / sqrt(d3);
 float pool = (.46 * ca * ca * smoothstep(.62, .97, ca) + .012) / (d3 + .12) * (1. + .15 * uMic);
 float wear = noise(p * vec2(5., 7.)) * .6 + noise(p * vec2(19., 27.) + 3.) * .4;
 vec3 wall = vec3(.15, .118, .096) * (.85 + .3 * wear), stone = vec3(.075, .056, .045);
 if (uOwn[2] != 0. || hrD > 0. || hrK > 0.) {
  pool = mix(pool * (1. - .8 * hrN), 1. + .45 * exp(-dot(p - vec2(.1, .25), p - vec2(.1, .25)) * 1.5), hrP);
  lamp = mix(lamp, vec3(1.05, 1.02, .97), .8 * hrP);
  wall = mix(wall * (1. - .4 * hrN), vec3(.6, .585, .56) * (.94 + .08 * wear), hrP);
  stone = mix(stone * (1. - .6 * hrN), vec3(.5, .48, .46), hrP);
  vec3 dye = mix(uKind[0], uKind[1], sat(p.y + .5 + .3 * (wear - .5)));
  wall = mix(wall, wall * (.1 + dye * dye * 2.6), .9 * hrD); stone = mix(stone, stone * (.15 + dye * 1.4), .9 * hrD);
  if (hrK > 0.) { vec2 b = (p - vec2(.05, -.26)) * vec2(.7, 1.75); pool = mix(pool, .15 + 2.6 * exp(-dot(b, b) * 1.6), hrK); }
  if (hrN > 0.) {
   float ux = clamp(hrLine(pw.x).z, 0., 1.), vy = pw.y - hrLine(pw.x).x; int kn = hrAt(ux);
   wall += hrN * .12 * kindColour(ux < .2 ? 0. : ux * 3.) * (.15 + lv[kn]) * exp(-vy * vy * 14.);
  }
 }
 // the wire's shadow: lower, to the right, wider and softer
 vec2 q = (pw - rot(1.2 * hrH) * vec2(.05 - .03 * sin(la), -.17)) / 1.12;
 vec3 ln = hrLine(q.x);
 float dark = 0., sv = q.y - ln.x, so = mix(.010, .026, uSpace) + .012 * uLow;
 for (int j = 0; j < wires; j++) {
  float oj = hrWireAt(j);
  int ks = hrAt(ln.z + .19 * oj);
  float As = hrBelly(ks, ln.z + .19 * oj).x * ln.y + so * .5, svj = sv - .2 * oj * hrM * ln.y;
  dark += .6 * (hrOver(svj, As, so * .6) + hrOver(svj, As + so * .5, so) * .7) ;
  if (uOwn[1] != 0.) dark += abs(uOwn[1]) * .8 * (1. - smoothstep(As - so, As + so, abs(svj)));
 }
 dark *= (1. - hrN) * (1. - hrK) * (1. - .6 * hrB);
 wall *= lamp * pool * (.85 + .25 * uLevel) * (1. - .75 * (1. - exp(-dark * 2.2))) ;
 // and a dark floor that holds a little of the light
 float fy = -.335 - .035 * p.x - p.y;
 vec2 d2 = vec2(d.x, fy - .07);
 vec3 ground = stone * lamp * (.06 + exp(-dot(d2, d2) * 7.) * (1. - hrN) + .9 * hrP) * (.6 + .5 * noise(vec2(p.x * 2. + fy * 1.2, fy * 34.)));
 ground *= .75 - .5 * exp(-max(fy, 0.) * 22.);
 float edge = smoothstep(-px * 1.5, px * 1.5, fy);
 vec3 col = mix(wall * (1. - .45 * exp(-max(-fy, 0.) * 11.)), ground, edge) + vec3(.005, .006, .009);
 // water for a floor: the wall and the wire are seen again in it
 float seen = 1.;
 if (hrW > 0.) {
  float rip = noise(vec2(p.x * 5. + uTime * .1, fy * 34. - uTime * .2)) + .5 * noise(vec2(p.x * 13. - uTime * .12, fy * 80. + uTime * .15)) - .75;
  float up2 = .14 * hrW;
  fy += up2; edge = smoothstep(-px * 1.5, px * 1.5, fy);
  if (fy > 0.) {
   float deep = smoothstep(0., .25, fy);
   col = mix(wall * .62, wall * .3, deep) * (1. + .2 * rip * deep) + vec3(.005, .006, .009);
   pw.y = p.y + 2. * fy + .03 * rip * deep;
   if (hrH > 0.) pw = rot(1.2 * hrH) * pw;
   seen = .6 * hrW;
  } else col = wall * (1. - .45 * exp(fy * 11.)) + vec3(.005, .006, .009);
 }
 p = pw;
 // the wire, as far as it swings for each kind of sound
 ln = hrLine(p.x);
 float tilt = .15 + .06 * p.x;
 if (uOwn[4] > 0.) tilt *= 1. - uOwn[4];
 for (int j = 0; j < wires; j++) {
 float oj = hrWireAt(j);
 if (j > 0 && hrM <= 0.) break;
 float v = (p.y - ln.x - .2 * oj * hrM * ln.y) / sqrt(1. + tilt * tilt), u = ln.z + .19 * oj * hrM, S = ln.y, there = j > 0 ? smoothstep(0., .3, hrM) : 1.;
 if (abs(v) < .5) {
  float r = max(.0032 * S, px);
  float light = .5 + .7 * exp(-(p.x - .2) * (p.x - .2) * 2.2) + .15 * uMic;
  vec3 m = u < 1. ? (piece(vec2(u, .3)).rgb + piece(vec2(u, .7)).rgb) * .5 : vec3(0.);
  float uh = .12 + .95 * (1. - uHits) , hg = exp(-(u - uh) * (u - uh) * 420.); // a hit runs along it
  int k = hrAt(u);
  vec2 b = hrBelly(k, u);
  float run = uHits * hg;
  b.x = (b.x + .065 * run) * S;
  float A = max(b.x, px);
  if (hrF > 0.) {
   float far = max(abs(v) - A, 0.);
   col += hrF * there * seen * (1. - hrK) * (1. - .6 * hrP) * sat(min(u - hrEnds[k].x, hrEnds[k].y - u) * 20.) * uKind[k] * lamp * (.06 + .5 * lv[k] + .5 * run) * (exp(-far * 12.) * .4 + exp(-far * 45.) * .5);
  }
  if (abs(v) < A + r + .02 * hrB) {
   float w = clamp(v / A, -1., 1.), z = sqrt(1. - w * w);
   float b1 = uBands[1 + k * 3];
   float cover = hrOver(v, A, r) + (.3 * hrOver(v, max(A * (.3 + .5 * b1), px), r) + .25 * hrOver(v, max(A * (.62 + .2 * uBands[2 + k * 3]), px), r)) * sat(A / r * .2 - .1);
   float op = (1. - exp(-cover * 2.4)) * .97 * mix(1., .25 + .75 * w * w, sat(A / r * .15 - .2));
   vec3 V = normalize(vec3(-.2, 0., 1.));
   vec2 s1 = hrShine(vec3(1., b.y * w + .06, b.y * z - .25), hrLamp, V), s2 = hrShine(vec3(1., b.y * w + .06, -b.y * z - .25), hrLamp, V);
   vec3 tint = mix(hrSteel(k, .06 + .34 * sqrt(lv[k])), hrSteel(4, .5), sat(run * 1.3));
   if (hrD > 0.) tint = mix(tint, uKind[k] * 1.15, hrD);
   float hit = 2. * run + uCue;
   float knot = exp(-A * A / (r * r * 5.));
   vec3 steel = lamp * light * (tint * (.5 * (s1.x * s1.x + s2.x * s2.x) + 1.2 * sat(w) * sat(w) + .5 * hit) * (1. - .5 * knot) + mix(tint, vec3(1.), .6) * (2. + hit) * (s1.y + .6 * s2.y) * (1. - .6 * knot)) + m * .45;
   vec4 made = vec4(steel, op);
   if (uOwn[1] != 0. || uOwn[7] != 0. || uOwn[2] != 0. || hrK > 0.) {
    if (hrF > 0.) { made.rgb = mix(made.rgb, tint * lamp * (.4 + 1.1 * lv[k]) * (.5 + .5 * z), hrF); made.w = mix(made.w, .8 * z * z * sat(A * 18.) * (1. - smoothstep(-px, px, abs(v) - A)), hrF); }
    vec3 nn = normalize(vec3(-b.y * .6, w, z + .02));
    vec2 bead = vec2(2.);
    float rb = .1, du = (hrLine(p.x + .01).z - hrLine(p.x).z) * 100., gap = .0125 * mix(1., 1.7, max(uOwn[4], 0.));
    if (hrB > 0.) {
     float at = u / gap, mid = (floor(at) + .5) * gap;
     k = hrAt(mid); rb = hrBelly(k, mid).x * S + .014 * S;
     bead = vec2((fract(at) - .5) / .5, v / rb);
    }
    made = hrBody(made, w, z, p.x * 1.2, A, px, bead, px / min(rb, gap * .5 / du), nn, normalize(hrLamp + vec3(0., 0., .25)), V, uKind[k], lamp * (light * .8 + .6 * hrP) * (1. - .8 * hrK), mix(vec3(.05, .06, .08), vec3(.4), hrP), lv[k] + 3. * run, uTime * .12 + oj);
   }
   col = mix(col, made.rgb, made.w * seen * there);
  }
 }
 }
 return screenOf(col * 1.5);
}

vec3 render(vec2 p) {
 hrRead();
 return uVar < .5 ? hrRoom(p) : hrWire(p);
}
