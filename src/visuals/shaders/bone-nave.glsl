// name: Bone nave
// a: Sea floor lamp
// b: Daylit hall
// what: Inside a whale's bones on the dark sea floor: ribs like the arches of a nave, the near ones cut by the frame, a stump and a gap among them, a lamp outside laying their shadows on pale silt, the long skull dim past the end; or the same bones hung in a hall with a glass roof, their shadows on a sunlit wall, a visitor below.
// follows: Each rib pair is a band of sound and glows up from its tips; the piece tints the silt or the wall. Drone lights the far end, pad thickens the haze, texture is flakes or dust, the phrase a slow eel of light, or a sway of the bones. A hit puffs up silt, or lights one pair; a cue brings a second lamp, or walks the shadows. Keys light anemones, or lamps.
// own: 0 black water and an amber lamp at -1, sunlit shallows at 1; in the hall night at -1, golden evening at 1; 1 few ribs far apart at -1, a full close row at 1; 2 narrow pointed arches at -1, low wide ones at 1; 3 the eye near the floor at -1, high at 1; 4 old dark bone at -1, bone grown over at 1; 5 a straight row at -1, a hard bend at 1; in the hall bent and seen from either side
// A block skipped whole where it is not needed.
#define bnWhen(c) for (int bnOnce = 0; bnOnce < 1 && (c); bnOnce++)
bool bnH; // the hall, not the sea floor
float bnGain, bnPeak, bnPx; // answer, pointedness, a pixel at distance 1
float bnDrone, bnPad, bnTex, bnPhr; // four kinds of sound, with that
// The rib pair in hand: place, middle, top, half width / thickness, lean, splay, turn / how far up, down, tip.
vec4 bnA, bnB, bnC;
float bnLost, bnForm, bnLift, bnThin, bnMend;
float bnZ0, bnStep, bnBend, bnSway, bnNext; // first rib, gap, bend, sway, next bone
vec3 bnRo, bnMilk, bnDeep;

float bnSq(float x) { return x * x; }
// 1 inside an edge, soft over w.
float bnIn(float d, float w) { w = max(w, 1e-6); return 1. - smoothstep(-w, w, d); }
// The body: middle, height, half width.
vec3 bnAxis(float z) {
  float u = z - (bnH ? 7. : 3.5), u2 = u * u;
  if (bnH) return vec3(bnBend * .022 * bnSq(max(u + 3., 0.)) + bnSway * (1. + .1 * u), 4.5 - .012 * u2, 1.9 * (1. + .3 * uOwn[2]) * max(1. - .0155 * u2, .16));
  return vec3(bnBend * .05 * bnSq(max(z - 2.5, 0.)) - .1, (2.5 - .0105 * u2) * (1. - .22 * uOwn[2]), (1.3 - .0075 * u2) * (1. + .33 * uOwn[2]));
}
void bnSet() {
  bnForm = 1. / ((bnH ? 1.9 : 1.3) * (1. + (bnH ? .3 : .33) * uOwn[2]));
  float s = bnPeak / (1. / bnForm + bnPeak);
  bnLift = 1. / sqrt(1. - s * s);
  bnThin = (bnH ? .07 : .066) * (1. + .25 * max(uOwn[1], 0.));
  bnMend = 1. - sat(uOwn[1] * 1.5);
}
// Takes rib pair f in hand.
void bnTake(float f) {
  vec4 h = fract(f * vec4(.618, .755, .570, .381) + vec4(.1, .43, .77, .23)) - .5;
  float z = bnZ0 + bnStep * (f + .3 * h.x);
  vec3 x = bnAxis(z);
  float body = x.z * bnForm, turn = -bnBend * (bnH ? .044 * max(z - 4., 0.) : .1 * max(z - 2.5, 0.));
  bnA = vec4(z, x.x + .06 * h.z, x.y, x.z * (1. + .12 * h.w));
  bnB = vec4(bnThin * (1. + .2 * h.y) * (.4 + .6 * body), bnH ? -.38 + .12 * h.y : .05 + .36 * h.z, (bnH ? -.1 : .04) + .2 * h.w, turn + .1 * h.y);
  bnB.x *= sat((.9 + .55 * min(uOwn[1], 0.) - .8 * fract(f * .618 + .36)) * 10.);
  float up = bnH ? 1.33 * body : .46 * x.y, down = bnH ? 2.47 * body : .76 * x.y;
  bnC = vec4(up, up * bnLift, down, bnH ? x.y - up - down * (.74 + .2 * h.y) * min(1., .5 + .13 * f) : -.2);
  // one rib is a stump, one is gone
  bnLost = bnMend * (f == (bnH ? 4. : 2.) ? -2.2 : f == 5. ? 9. : 0.);
}
// In the rib's plane: how far q is from its curve, which way is out, u how far down.
float bnCurve(vec2 q, out vec2 n, out float u) {
  vec4 A = bnA, C = bnC;
  float y = q.y - A.z + C.x;
  vec2 e = 1. / vec2(A.w + bnPeak, y > 0. ? C.y : C.z), c = vec2(abs(q.x - A.y) + bnPeak, y) * e, ce = c * e;
  float k0 = length(c), k1 = max(length(ce), 1e-3);
  n = ce / k1; n.x *= q.x < A.y ? -1. : 1.;
  u = (A.z - q.y) / (A.z - C.w) * (1. + max(q.x < A.y ? -bnLost : bnLost, 0.));
  return k0 * (k0 - 1.) / k1;
}
float bnThick(float u) {
  float k = sat(u);
  return bnB.x * (.8 + 1.3 * k * (1. - k) - .3 * k) * sqrt(sat((1. - u) * 14.));
}
// Where a line meets the rib's leaning plane. inv is 1 / d.z; s its fall sideways.
float bnPlane(vec3 o, vec3 d, float inv, out float s) {
  vec4 A = bnA, B = bnB;
  s = B.w + (o.x + d.x * (A.x - o.z) * inv < A.y ? -B.z : B.z);
  float g = d.z + B.y * d.y - s * d.x;
  return (A.x + B.y * (A.z - o.y) + s * (o.x - A.y) - o.z) / (abs(g) < 1e-3 ? 1e-3 : g);
}
// The light that comes by the ribs along v.
float bnShadow(vec3 o, vec3 v, float soft, int first, int last) {
  float sh = 1., inv = 1. / (abs(v.z) < 1e-3 ? 1e-3 : v.z), len = length(v), far = bnH ? 30. : .97, u, s;
  vec2 n;
  for (int i = max(first, 0); i < min(last, 16); i++) {
    bnTake(float(i));
    float t = bnPlane(o, v, inv, s);
    vec2 q = o.xy + v.xy * t;
    float d = abs(bnCurve(q, n, u)), w = bnThick(u), pen = .012 + soft * t * len;
    float k = .94 * min(1., 1.5 * w / pen) * bnIn(d - w, pen) * smoothstep(.05, .3, abs(v.z + bnB.y * v.y - s * v.x) / len);
    sh *= t < .02 || t > far ? 1. : 1. - k;
  }
  return sh;
}
// One bone of the spine after another.
float bnSpine(vec3 q) {
  float k = floor((q.z - bnZ0) / bnStep + .5);
  vec3 ax = bnAxis(q.z);
  float sc = bnH ? .35 + .35 * ax.z : .5 + .4 * ax.z, hz = bnStep * .5;
  vec3 v = vec3(q.x - ax.x, q.y - ax.y, q.z - bnZ0 - k * bnStep), a = abs(v);
  float e = v.z / hz;
  bnNext = hz - v.z;
  float body = max(length(v.xy) - sc * (.1 + .06 * e * e), (a.z - hz * .8) * .8) - .02;
  vec2 w = vec2(max(a.x - .4 * sc, 0.), max(abs(v.z + .45 * bnStep * a.x) - .08 * sc, 0.));
  float wing = sqrt(dot(w, w) + bnSq(v.y + .12 * a.x)) - .035 * sc;
  w = vec2(max(abs(v.y - .36 * sc) - .24 * sc, 0.), max(abs(v.z - .4 * v.y) - .07 * sc, 0.));
  float fin = sqrt(dot(w, w) + v.x * v.x) - .04 * sc;
  return smin(smin(body, wing, .06), fin, .05) * .85;
}
// The skull from its side, x 0 at the back to 1 at the snout.
float bnSkull(vec2 q) {
  float x = clamp(q.x, .02, 1.);
  float crown = (length((q - vec2(.13, .03)) / vec2(.17, .13)) - 1.) * .13;
  float beak = abs(q.y - .07 + .2 * x * x - .2 * x * (1. - x)) - .065 * (1. - x * .85);
  float jaw = abs(q.y + .08 + .05 * x + .4 * x * (1. - x)) - .03 * (1.15 - x * .75);
  return min(smin(crown, beak, .05), jaw) + abs(q.x - x);
}
// Bone: cream, stained and pitted. s is a place on it.
vec3 bnBone(vec2 s, float id, float h) {
  float big = noise(s * vec2(2., 3.) + id * 7.3), fine = noise(s * vec2(28., 8.) + id * 3.1);
  vec3 c = mix(vec3(.88, .82, .68), vec3(.50, .42, .30), smoothstep(.35, .9, big) * .7);
  c *= .8 + .32 * fine - .4 * smoothstep(.74, .9, fine);
  c = bnH ? mix(c, vec3(.8, .78, .73) * (.85 + .2 * fine), .5) : c;
  c = mix(c, vec3(.07, .072, .08) * (.6 + .9 * fine), max(-uOwn[4], 0.) * .92);
  vec3 grown = bnH ? mix(vec3(.10, .19, .06), vec3(.34, .40, .14), fine) : mix(vec3(.80, .20, .17), vec3(.95, .62, .30), fine);
  return mix(c, grown, max(uOwn[4], 0.) * (1. - smoothstep(.4, 1., big + .25 * h)));
}

// A line of width 2w every period.
float bnBar(float x, float period, float w, float fw) {
  float a = abs(fract(x / period) - .5) * period;
  return bnIn(a - w, fw) * min(1., w / fw);
}
vec4 bnPiece(vec2 at) { return piece(at) * smoothstep(0., .15, min(min(at.x, 1. - at.x), min(at.y, 1. - at.y))); }

// ---- the sea floor ----
vec3 bnLamp, bnLamp2, bnAim, bnHaze;
float bnBeam, bnFog;
vec3 bnLit(vec3 q, vec3 N, float wrap) {
  vec3 v = bnLamp - q; float d2 = dot(v, v), d = max(sqrt(d2), 1e-3);
  return bnMilk * bnBeam * smoothstep(mix(.45, .68, uTone), .99, -dot(v, bnAim) / d) * sat((dot(N, v) / d + wrap) / (1. + wrap)) * exp(-.16 * d) / (.5 + .2 * d2);
}
vec3 bnWater(vec3 rd) {
  vec3 ax = bnAxis(10.5), d = vec3(ax.x, 1., 10.5) - bnRo;
  vec2 o = rd.xy / max(rd.z, .1) - d.xy / d.z, b = (rd.xy - vec2(-.52, .16)) * vec2(1., 1.3);
  bnHaze = bnMilk * bnBeam * (.005 + .013 * bnPad) * exp(-dot(b, b) * 4.5);
  return bnHaze + bnDeep * (.5 + .5 * smoothstep(-.5, .6, rd.y)) + mix(vec3(.02, .15, .16), uKind[0] * .25, .3) * exp(-dot(o, o) * 8.) * (.22 + 1.2 * bnDrone);
}
vec3 render(vec2 p) {
  bnH = uVar > .5;
  bnGain = .35 + 1.4 * uEnergy;
  bnDrone = sat(uDrone * bnGain); bnPad = sat(uPad * bnGain); bnTex = sat(uTexture * bnGain); bnPhr = sat(uPhrase * bnGain);
  float wide = smoothstep(.6, 1.5, uRes.x / uRes.y), cq = 1. - uCue, up0 = max(uOwn[0], 0.), dn0 = max(-uOwn[0], 0.), dn3 = max(uOwn[3], 0.);
  bnBend = 1. + uOwn[5] * (uOwn[5] < 0. ? (bnH ? 2.6 : 1.) : (bnH ? 1.6 : .8));
  bnPeak = .16 - (uOwn[2] < 0. ? .75 : .14) * uOwn[2];
  bnZ0 = bnH ? 3.8 : .95;
  bnStep = (bnH ? .5 : .66) * (1. - .2 * uOwn[1]);
  bnSway = bnH ? (.015 + .09 * bnPhr) * sin(uTime * .5) : 0.;
  float foc = (bnH ? .8 : .72) * mix(.62, 1., wide);
  bnPx = 1. / (foc * uRes.y);
  bnSet();
  vec3 rd;
  float glide = .25 * sin(uTravel * .017);
  if (bnH) {
    bnRo = vec3(-.9 - 1.2 * uOwn[5] + .1 * sin(uTime * .037), .95 + (uOwn[3] < 0. ? .7 : 1.6) * uOwn[3], -.6 + glide);
    rd = vec3(p.x + .2 * wide, p.y + .3 - .2 * dn3, foc);
  } else {
    bnRo = vec3(-.45 + .05 * sin(uTime * .043), .46 + (uOwn[3] < 0. ? .25 : 1.2) * uOwn[3], -.1 + glide);
    rd = vec3(p.x + .08 * wide, p.y + .15 - .2 * dn3, foc);
  }
  rd = normalize(rd);
  // a lamp outside on the left; at a cue a second passes on the right
  bnLamp = vec3(-2.25 + .12 * sin(uTime * .11), 1.55, .5);
  bnAim = normalize(vec3(.5, .35, 3.3) - bnLamp);
  bnLamp2 = vec3(2.5 - .3 * cq, 1.7, 1. + 6. * cq * (1.6 - .6 * cq));
  bnMilk = mix(vec3(.56, 1., .70), vec3(1., .66, .34), dn0);
  bnDeep = mix(mix(vec3(.002, .013, .02), vec3(.001, .002, .005), dn0), vec3(.07, .30, .30), up0);
  bnBeam = (4.2 + .8 * uLevel * bnGain + 1.4 * uMic + .7 * uLow * bnGain) * (1. - .45 * up0);
  bnFog = mix(.15, .09, uSpace) * (1. - .3 * up0);

  // the first rib met, and one behind its edge
  int h1 = -1;
  vec3 hT, hB; vec4 hIt = vec4(0.); // off its middle line, thickness, how far down, which side
  hT = hB = vec3(0., 1., 0.);
  float c1 = 0., c2 = 0., t1 = 1e3, inv = 1. / max(rd.z, 1e-3), low = bnH ? .9 : -.1;
  for (int i = 0; i < 16; i++) {
    bnTake(float(i));
    float s, u, t = bnPlane(bnRo, rd, inv, s), l = -bnB.y;
    vec2 q = bnRo.xy + rd.xy * t, n;
    // nothing more on this way
    if ((rd.y < 0. && q.y < low) || (rd.y > 0. && q.y > bnA.z + .5) || (abs(rd.x) > rd.z * (.9 * abs(bnBend) + .1) && (q.x - bnA.y) * sign(rd.x) > bnA.w + .5)) break;
    float d = bnCurve(q, n, u), w = bnThick(u), px = t * bnPx;
    vec3 T = vec3(-n.y, n.x, l * n.x - s * n.y), B = cross(T, rd);
    float sd = dot(vec3(n * d, (l * n.y + s * n.x) * d), B) / max(length(B), 1e-3), side = q.x < bnA.y ? 16. : 0.;
    float c = bnIn(abs(sd) - w, px) * smoothstep(0., .006, w) * step(abs(d), w * 6. + .02) * step(.12, t);
    c *= bnH ? 1. : smoothstep(-.02, .04, q.y);
    if (c > .01 && h1 >= 0) { c2 = c; break; }
    if (c > .01) { h1 = i; c1 = c; t1 = t; hT = T; hB = B; hIt = vec4(sd, w, u, side); }
    if (c1 > .98) break;
  }
  // the spine
  float ts = 1e3, cs = 0.;
  bnWhen(rd.y > 0. || bnRo.y > 1.2) {
    float lo = bnH ? 3.4 : 1.5, w = bnH ? .75 : .6, t = .15, best = 1e3;
    vec2 iv = vec2(abs(rd.x) < 1e-3 ? 1e3 : 1. / rd.x, abs(rd.y) < 1e-3 ? 1e3 : 1. / rd.y);
    float y0 = (lo - bnRo.y) * iv.y, y1 = ((bnH ? 5.2 : 3.4) - bnRo.y) * iv.y, x0 = (-w - (bnH ? max(.2, -bnBend) : .1) - bnRo.x) * iv.x, x1 = (w + 3.4 * max(bnBend, 0.) - bnRo.x) * iv.x;
    t = max(t, max(min(x0, x1), min(y0, y1)));
    float tEnd = min(min((bnZ0 + bnStep * 15.6 - bnRo.z) * inv, t1), min(max(x0, x1), max(y0, y1)));
    for (int i = 0; i < 30; i++) {
      if (t > tEnd) break;
      float d = bnSpine(bnRo + rd * t), m = d / (t * bnPx);
      if (m < best) { best = m; ts = t; }
      if (m < .5) break;
      t += max(d > .45 ? d - .2 : min(d, bnNext + .03), .01);
    }
    cs = 1. - smoothstep(.5, 1.6, best);
  }
  bool back = cs > .02;
  if (back) c2 = c1;
  float keys = 0., cov = back ? cs : c1, tb = back ? ts : t1, tf = rd.y < -1e-3 ? -bnRo.y / rd.y : 1e3, u = 0., fi = 0.;
  bool bone = cov > 0.;
  vec3 q = bnRo + rd * (bone ? tb : min(tf, 60.)), N = vec3(0., 1., 0.), alb = vec3(.5), col = vec3(0.);
  bnWhen(bone && !back) {
    fi = float(h1); u = hIt.z;
    vec3 T = normalize(hT), B = hB / max(length(hB), 1e-3), F = cross(B, T);
    float h = clamp(hIt.x / max(hIt.y, 1e-4), -1., 1.);
    N = normalize(B * h + F * (dot(F, rd) > 0. ? -1. : 1.) * sqrt(1. - h * h) + vec3(1e-5));
    alb = bnBone(vec2(u * 3., h * .7), fi + hIt.w, 1. - u);
    // anemones sit on the bones in the sea
    float at = u * 5. + (fi + hIt.w) * .37, id = floor(at) + fi * 3.1;
    vec2 a = vec2((fract(at) - .5) * .5, (h - .6 * sin(id * 5.)) * hIt.y);
    float k = length(a) / (bnH || sin(id * 9.) < 0. ? 1e-4 : .045 + .02 * sin(id * 7.)), x = k > 1e-3 ? atan(a.x, a.y) : 0.;
    keys = (1. - smoothstep(.6, 1., k)) * mix(1., .5 + .5 * cos(x * 17. + 2. * sin(x * 2. + uTime * .4) * k), smoothstep(.3, .9, k));
    alb = mix(alb * mix(.5, 1., smoothstep(.6, 1.6, k)), mix(vec3(.8, .52, .42), vec3(1.2, 1.15, 1.05), smoothstep(0., .4, k)), keys);
  }
  bnWhen(back) {
    vec2 e = vec2(.008, 0.);
    vec3 o = q - rd * .025;
    N = normalize(vec3(bnSpine(o + e.xyy), bnSpine(o + e.yxy), bnSpine(o + e.yyx)) - bnSpine(o) + 1e-6);
    alb = bnBone(vec2(q.z * 1.3, q.x * 3. + q.y * 2.), 3., .5);
    fi = clamp((q.z - bnZ0) / bnStep, 0., 15.);
  }
  // the skull, past the last rib
  float zs = bnH ? 12.3 : 11.8, skull = 1.;
  vec3 ks = bnAxis(zs);
  vec2 sk = ((bnRo + rd * ((zs - bnRo.z) * inv)).xy - ks.xy + (bnH ? vec2(.35, .3) : vec2(-.6, ks.y - 1.2))) / (bnH ? vec2(3.4) : vec2(2.4 + 3. * sat(bnBend), 5.4));
  bnWhen(cov < 1. && abs(sk.x - .5) < .6 && abs(sk.y) < .35) skull = bnSkull(sk);
  float skin = 1. - smoothstep(-.05, .01, skull);
  // each band lights its own pair
  float glow = uBands[int(fi + .5)] * bnGain, rim = sat(1. + dot(N, rd));
  vec3 own = mix(kindColour(fi * .2667), vec3(.8, .95, .85), .2) * glow * (.15 + 1. - smoothstep(.1, 1.1, u + .7 - glow));

  bnWhen(!bnH) {
    vec3 water = bnWater(rd), bg, skyL = vec3(.25, .6, .6) * up0, mat = bnHaze;
    bnWhen(!bone && tf < 40.) {
      // the silt, and the piece lying down the nave
      float foot = tf * bnPx / max(-rd.y, .03), near = 1. / (1. + foot * foot * 500.);
      vec2 g = q.xz;
      float big = noise(g * .9), mid = noise(g * 3.1), rip = sin(g.y * 15. + g.x * 5. + 5. * noise(g * 1.4)) * big;
      N = normalize(vec3(.5 - mid, 1.6, .35 * rip * near + .5 * (big - .5)));
      alb = mix(vec3(.36, .35, .29), vec3(.68, .66, .57), big * .5 + .5 * mid) * (.75 + .5 * noise(rot(.6) * g * 41.) * near);
      alb = mix(alb, vec3(.85, .8, .66), up0 * .6);
      vec4 m = bnPiece(vec2((q.z - 1.2) / 10., .5 - .3 * (q.x - bnAxis(q.z).x)));
      alb *= mix(vec3(1.2), m.rgb / max(m.a, .02) * 1.5, sat(m.a * bnGain) * .7);
      mat += m.rgb * bnGain * .4 * (.2 + smoothstep(.35, .8, mid));
    }
    float sh = 1., sh2 = 1.;
    int last = bone ? h1 : int((q.z - bnZ0) / bnStep + 1.5);
    bnWhen((bone && !back) || (!bone && tf < 40.)) sh = bnShadow(q, bnLamp - q, .03, bone ? last - 3 : 0, min(last, 8));
    bnWhen(!bone && tf < 20. && uCue > .01) sh2 = bnShadow(q, bnLamp2 - q, .03, 0, 8);
    vec3 v = bnLamp2 - q; float d2 = dot(v, v) + 1e-4;
    vec3 li = bnLit(q, N, .08) * sh + vec3(3.6, 3., 2.1) * uCue * sh2 * sat(dot(N, v) / sqrt(d2) * .8 + .2) / (.5 + d2) + bnDeep * (.8 + .6 * N.y) + skyL * (.3 + .7 * sat(N.y));
    li += mix(vec3(1., .8, .6), uKind[4], .3) * uKeys * bnGain * 1.5 * keys;
    if (bone) li += own * (.1 + 1.2 * rim * rim) * (back ? .5 : 1.);
    vec3 w = vec3(.2, .4 - .25 * uHits, 2.1) - bnRo;
    vec2 o = (rd.xy * inv - w.xy / w.z) * w.z;
    float R = .42 + .5 * (1. - uHits), r = length(o * vec2(.75, 1.2)) / R, kf = exp(-tf * bnFog) * smoothstep(0., .004, -rd.y);
    vec3 here = mix(water, alb * li + (bone ? vec3(0.) : mat), bone ? exp(-tb * bnFog) : kf);
    bg = bone ? mix(water, .6 * (bnLit(bnRo + rd * min(tf, 60.), vec3(0., 1., 0.), .08) + bnDeep + skyL), kf) : here;
    bg = mix(bg, water * .25 + bnMilk * (.035 + .06 * bnDrone) * skin * (.6 + sk.y * 2.5), .9 * bnIn(skull - .004, .008));
    bg = mix(bg, vec3(.5, .46, .36) * (1. - .85 * max(-uOwn[4], 0.)) * bnLit(q, -rd, 1.) * 1.4 + water * .4, c2);
    col = bone ? mix(bg, here, cov) : bg;
    // the eel of light
    bnWhen(bnPhr > .01) {
      float head = 6.4 - 2.8 * cos(uTravel * .06), eel = 1e3, eelZ = 1., eelT = 1e3;
      vec2 e0 = vec2(0.), m = rd.xy * inv + .004 * sin(p.yx * 24. + vec2(0., uTime * .9));
      for (int i = 0; i < 9; i++) {
        float z = head + .5 * float(i) - 2.;
        vec3 ax = bnAxis(z), k = vec3(ax.x + 1.15 * ax.z * sin(z * 1.4 + 1.), .8 + .35 * sin(z * 1.1 + uTime * .23), z) - bnRo;
        vec2 e1 = k.xy / max(k.z, .05), ab = e1 - e0, am = m - e0;
        float hh = sat(dot(am, ab) / max(dot(ab, ab), 1e-5)), dd = length(am - ab * hh) * k.z;
        if (i > 0 && dd < eel) { eel = dd; eelZ = z - .5 * (1. - hh); eelT = k.z; }
        e0 = e1;
      }
      float ea = max(1. - bnSq((eelZ - head) * .5), 0.), thin = .015 + .03 * ea;
      ea *= bnPhr * (eelT < tb * rd.z ? 1. : 0.);
      col += mix(uKind[3], vec3(.8, 1., .9), .35) * ea * exp(-eelT * bnFog * .6) * (.8 * exp(-eel * eel / (thin * thin)) + .1 * exp(-eel * 5.));
    }
    // a hit stirs the silt in one place
    float puff = exp(-r * r * 1.6) * (.2 + noise(rot(.6) * o * 4. + 3.) + .5 * noise(o * 9.));
    col = mix(col, mix(vec3(.8), uKind[4], .35) * bnMilk * (.7 + .5 * puff), sat(puff * uHits * .9) * smoothstep(-.4, -.1, o.y));
  }

  // ---- the hall ----
  bnWhen(bnH) {
    float sc = 4. * uCue * cq, haze = sat(.15 * uSpace + .3 * bnPad);
    vec3 sun = normalize(vec3(-.85, .3 + .05 * sc - .08 * up0, -.32 - .25 * sc + .06 * sin(uTime * .02)));
    vec3 day = mix(mix(vec3(1., .92, .77), vec3(1., .55, .24), up0), vec3(.16, .22, .36), dn0) * (1.9 + .3 * uMic + .5 * uCue + .3 * uLevel);
    vec3 fill = mix(mix(vec3(.17, .215, .275), vec3(.2, .18, .26), up0), vec3(.018, .027, .05), dn0);
    vec3 air = mix(mix(mix(vec3(.75, 1.1, 1.5), vec3(1.6, 1.7, 1.75), sat(1.1 - 1.3 * rd.y)), vec3(1.5, .95, .6), .75 * up0), vec3(.03, .05, .1), dn0);
    // walls, floor, roof of glass
    float tr = rd.x > 0. ? (5.2 - bnRo.x) / max(rd.x, 1e-4) : (-6.5 - bnRo.x) / min(rd.x, -1e-4), te = (24. - bnRo.z) * inv;
    float g1 = rd.y + .45 * rd.x, g2 = rd.y - .45 * rd.x;
    float ta = g1 > 1e-3 ? (8.4 - bnRo.y - .45 * bnRo.x) / g1 : 1e3, tc = g2 > 1e-3 ? (8.4 - bnRo.y + .45 * bnRo.x) / g2 : 1e3, tg = min(ta, tc);
    float tw = min(min(tr, te), min(tf, tg)), foot = tw * bnPx;
    vec3 qw = bnRo + rd * tw, bg;
    bool glass = tw == tg, flr = tw == tf, wallR = tw == tr && rd.x > 0., wallL = tw == tr && rd.x <= 0.;
    if (!bone) { q = qw; N = flr ? vec3(0., 1., 0.) : tw == te ? vec3(0., 0., -1.) : vec3(-sign(rd.x), 0., 0.); }
    // the sun through the bones
    float sh = 1., soft = mix(.02, .008, uTone) + .02 * haze + (bone ? 0. : .07 * foot / max(abs(rd.x), .2));
    bnWhen((bone && !back) || (!bone && !glass && !wallL)) {
      float s0 = (q.x - .1) / -sun.x; vec3 z0 = q + sun * s0;
      int k = int((z0.z - bnZ0) / bnStep + .5);
      sh = bnShadow(q, sun, soft, bone ? h1 - 2 : k - 3, bone ? h1 : k + 4);
      if (!bone && s0 > 0.) {
        vec3 ax = bnAxis(z0.z);
        float y = z0.y - ax.y, kk = .3 + .35 * ax.z, pen = .02 + soft * s0 * .6, m = abs(fract((z0.z - bnZ0 - .35 * y) / bnStep + .5) - .5);
        float d = smin(abs(y) - kk * (.13 + .5 * m * m), max(bnStep * m - .11 + .06 * y, max(-y, y - .6 * kk)), .06);
        sh *= 1. - .92 * bnIn(d, pen) * (1. - smoothstep(12., 12.3, z0.z));
        float zb = q.z + sun.z * (10.7 - q.y) / .68;
        sh *= 1. - .45 * bnBar(zb + .5, 4.4, .13, .16);
      }
    }
    vec3 wall = mix(vec3(.82, .79, .73), vec3(.68, .67, .64), noise(vec2(qw.z * .5, qw.y * .35)));
    bg = wall * (fill * (wallL ? .6 : .95) + day * (flr ? sun.y : wallR ? -sun.x : tw == te ? -.5 * sun.z : 0.) * (bone ? 1. : sh));
    if (glass) {
      float fw = foot * 1.4 / max(abs(ta < tc ? g1 : g2), .1), bar = max(max(bnBar(qw.z, 1.1, .035, fw), bnBar(qw.x, 1.2, .03, fw)), bnBar(qw.z + .5, 4.4, .13, fw));
      bg = mix(air * (.62 + .5 * smoothstep(.2, .75, noise(qw.xz * .35 + vec2(uTime * .01, 3.)))), fill * .6 + .08 * air, bar * .95);
    }
    float eave = glass ? min(min(5.2 - qw.x, qw.x + 6.5), 24. - qw.z) : flr ? 1. : 8.4 - .45 * abs(qw.x) - qw.y;
    if (wallL) {
      float zz = abs(fract(qw.z / 2.4) - .5) * 2.4, win = bnIn(zz - .8, foot * 2.) * bnIn(.8 - qw.y, foot) * bnIn(qw.y + .8 * zz * zz - 4.7, foot);
      bg = mix(bg, air, win * (1. - .8 * max(bnBar(qw.z, .6, .03, foot * 2.5), bnBar(qw.y, .95, .03, foot * 1.2))));
    }
    bg = mix(bg, fill * .6 + .08 * air, bnIn(eave - .1, foot));
    if (wallR) {
      vec4 m = bnPiece(vec2((qw.z - 4.) / 15., 1. - (qw.y - .3) / 4.8));
      bg = bg * mix(vec3(1.), m.rgb / max(m.a, .02) * 1.2, sat(m.a * bnGain) * .6) + m.rgb * .06 * bnGain;
      bg *= 1. - .25 * (1. - smoothstep(.28, .28 + foot, qw.y));
      // lamps at the foot of the wall
      float lz = fract(qw.z / 1.5) - .5, ly = qw.y - .3;
      bg += mix(vec3(1., .75, .4), uKind[4], .25) * (uKeys * bnGain + .8 * dn0) * .8 * exp(-max(ly, 0.) * 1.6 - abs(lz) * (5. - 2. * sat(ly))) * step(0., ly);
    }
    if (tw == te) {
      // a doorway
      vec2 d = vec2(abs(qw.x + .2), qw.y); float door = (d.y > 3. ? length(d - vec2(0., 3.)) : d.x) - 2.;
      bg = mix(bg, fill * .5 + mix(vec3(1., .8, .5), uKind[0], .4) * (.12 + 1.6 * bnDrone) * exp(-.12 * dot(d, d)), bnIn(door, foot));
    }
    if (flr) {
      bg *= vec3(.62, .6, .58) * (.9 + .2 * noise(qw.xz * .8));
      bg += (wall * fill * .6 + day * .2 * smoothstep(-1., 5., qw.x)) * exp(rd.y * 5.) * (.6 + .8 * uLow * bnGain);
    }
    vec3 v = bnRo + rd * ((8.6 - bnRo.z) * inv);
    bnWhen(cov < 1. && !glass && abs(v.x - 3.4) < 1.2) {
      // a visitor and a bench
      vec2 d = v.xy - vec2(2.7, 0.), b = vec2(abs(v.x - 3.7), v.y - .3);
      float px = 8.6 * bnPx, man = min(length(d - vec2(0., .93)) - .075, max(abs(d.x) - .11 - .06 * (.8 - d.y), max(d.y - .83, .36 - d.y)));
      man = min(man, max(abs(abs(d.x) - .06) - .035, abs(d.y - .2) - .2));
      man = min(man, min(max(b.x - .55, abs(b.y) - .04), max(abs(b.x - .4) - .04, abs(b.y + .15) - .15)));
      bg = mix(bg, vec3(.04) + fill * .12, bnIn(man, px));
    }
    bg = mix(bg, wall * (fill * (1.1 + sk.y * 2.) + day * .3 * skin * sat(.5 + 3. * sk.y)), bnIn(skull, 3.7 * bnPx));
    // wires from the roof
    for (int i = 0; i < 4; i++) {
      float z = 1.6 + 3.1 * float(i), t = (z - bnRo.z) * inv; vec2 w = bnRo.xy + rd.xy * t; vec3 ax = bnAxis(z);
      bg *= 1. - .75 * (1. - smoothstep(0., 1.5 * t * bnPx, abs(w.x - ax.x) - .006)) * step(ax.y, w.y) * step(t, tw);
    }
    bg = mix(bg, vec3(.7, .67, .61) * (fill * 1.1 + day * .15), c2);
    vec3 li = fill * (1. + .5 * N.y) + wall * day * .1 * (1. - .6 * N.y) + day * .8 * sat(dot(N, sun)) * sh + own * .5;
    // a hit ticks one bone
    li += mix(vec3(1., .9, .7), uKind[4], .4) * uHits * 2.2 * exp(-bnSq(fi - 3.)) * (.4 + .6 * exp(-9. * bnSq(u - (1. - uHits) * 1.1)));
    col = mix(bg, alb * li, cov);
    float shaft = .4 + .6 * noise(vec2(p.x * 2.5 + p.y * 5., uTime * .03));
    col = mix(col, air * .45 + day * .2, (.05 + haze * .32) * shaft * (1. - smoothstep(-.5, .6, p.x * .5 - p.y)));
  }

  // flakes, or dust
  vec3 fleck = bnH ? vec3(.22, .2, .16) * (1. - .8 * dn0) : bnMilk * .03 * (1. + bnBeam);
  for (int k = 0; k < 2; k++) {
    float fk = float(k), sc = 9. + 13. * fk;
    vec2 g = p * sc + vec2(.5 * sin(uTime * .07 + fk * 2.), uTime * (bnH ? .06 : .24) + fk * 13.), id = floor(g), h = hash22(mod(id, 97.) + fk * 31.);
    g -= id + .2 + .6 * h;
    float z = .03 + .05 * h.x * h.y, on = smoothstep(0., .25, .16 + .75 * bnTex - fract(h.x * 7.7 + h.y * 3.1));
    col += fleck * exp(-dot(g, g) / (z * z)) * on * (.3 + h.y * h.y);
  }
  return screenOf(col);
}
