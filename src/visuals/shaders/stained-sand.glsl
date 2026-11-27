// name: Stained sand
// a: Planted sheets
// b: Wet evening
// what: Clear coloured sheets, a disc, a leaf, a ring, a wave, a comb and more, stand planted in white sand, and the low sun lays their long coloured shadows through one another, with a ball of clear resin among them; or the same at dusk after a wave, when the sand is a mirror and a pale sun stands behind a cherry disc.
// follows: The drone lowers the sun, the pad deepens the colours, texture makes sand glitter and the mirror tremble, a phrase lights the leaf, the spectrum sets the teeth of the comb. The piece stains the sand. A hit lights the ball, which hops, and sends a ring over the sand; a cue sways all the sheets once, keys raise slips, the loop swings the sun.
// own: 0 moonlit night at -1, a red late sun at 1; in the evening pale dawn at -1, moonlit night at 1; 1 black sand at -1, red desert sand at 1; 2 only the disc, the leaf and the ball at -1, giants at 1; 3 low by the sand at -1, seen from above at 1; 4 clear glass with bright edges at -1, painted with bands of cream at 1; 5 sea mist at -1, a wet mirror at 1; in the evening dry sand with long shadows at -1, rippled water at 1
const int SS_N = 9;
// each sheet, front to back: where its plane lies and how it is turned; how far it reaches to the side and up, how big, which shape
vec4 ssA[SS_N], ssE[SS_N];
vec3 ssL, ssSun, ssZen, ssHzn, ssAmb;   // to the sun, its colour, the sky above and at the horizon, what the sky gives
vec3 ssBall, ssSand, ssDeep;   // ssDeep: how deep every dye is
float ssMist, ssWet, ssGust, ssGrow, ssLean;

// how much of a pixel is inside, at d from an edge as soft as w
float ssIn(float d, float w) { d = sat(0.5 - 0.5 * d / w); return d * d * (3.0 - 2.0 * d); }
// a smooth wave, once up and down in 1
float ssHump(float x) { x = fract(x) * 2.0 - 1.0; return -4.0 * x * (1.0 - abs(x)); }
// which shape it is, as ones and zeros: 0 disc, 1 wave, 2 ring, 3 half disc; 4 leaf, 5 wedge, 6 comb, 7 slab with a hole; or slips the keys push up
vec4 ssM, ssN;
float ssO;
vec3 ssTooth;   // the tooth of the comb or the slip that is nearest: its middle, its height, its slant
void ssPick(int k, vec2 q) {
  ssM = vec4(equal(ivec4(k), ivec4(0, 1, 2, 3)));
  ssN = vec4(equal(ivec4(k), ivec4(4, 5, 6, 7)));
  ssO = float(k == 9);
  float wide = mix(0.2, 0.1375, ssN.z), left = mix(0.4, 1.1, ssN.z);
  float j = clamp(floor((q.x + left) / wide), 0.0, mix(3.0, 15.0, ssN.z)), h = ssHump(j * mix(0.366, 0.0875, ssN.z) + 0.06 * ssN.z);
  vec4 near = max(1.0 - abs(j - vec4(0.0, 3.0, 6.0, 9.0)) / 3.0, 0.0);
  vec2 far = max(1.0 - abs(j - vec2(12.0, 15.0)) / 3.0, 0.0);
  float loud = dot(near, vec4(uBands[0], uBands[3], uBands[6], uBands[9])) + dot(far, vec2(uBands[12], uBands[15]));
  ssTooth = vec3((j + 0.5) * wide - left, mix(uKeys * (0.45 + 0.2 * h) - 0.12, 0.34 + 0.24 * h + (0.5 + 0.12 * h) * loud, ssN.z), 0.06 * (j - 1.5) * ssO);
}
// How far outside the outline of its shape a place is (x), and the way out (yz); in metres, its foot at height 0.
vec3 ssShape(vec2 q) {
  float u = q.x * q.x, w = fract(mix(q.y * 0.239 - 0.048, (q.x + 0.75 * q.y * q.y) * 1.05 + 0.143, ssM.y)) * 2.0 - 1.0;
  float hump = -4.0 * w * (1.0 - abs(w)), lx = q.x - 0.17 * hump, sx = sign(lx + 1e-5), teeth = ssN.z + ssO;
  lx = abs(lx);
  vec2 tooth = vec2(abs(q.x - ssTooth.x - ssTooth.z * q.y) - 0.035, q.y - ssTooth.y);
  // every round shape is a distance from one point
  vec2 c = q - vec2(0.05 * ssM.w, dot(ssM, vec4(0.62, 0.0, 0.40, 0.38)) + 1.12 * ssN.w);
  c = mix(mix(c, vec2(lx + 1.35, q.y - 0.86), ssN.x), max(tooth, 0.0), teeth);
  float l = length(c), sc = sign(c.x + 1e-5), st = sign(q.x - ssTooth.x + 1e-5);
  vec2 n = c / max(l, 1e-4);
  vec3 a = vec3(l - dot(ssM, vec4(0.76, 0.0, 0.485, 0.86)) - dot(ssN, vec4(1.68, 0.0, 0.0, 0.38)), n.x * mix(1.0, sx, ssN.x), n.y);
  a = mix(a, vec3(abs(c.x) - 0.38, sc, 0.0), ssN.w * step(c.y, 0.0));
  a = mix(a, vec3(dot(q - vec2(0.52, 0.0), vec2(0.986, 0.166)), 0.986, 0.166), ssN.y);
  // the hole of the ring and of the slab, the straight side of the half disc and of the wedge
  float hole = ssM.z + ssN.w, side = ssM.w + ssN.y;
  vec3 b = vec3(dot(vec3(hole, ssM.z, ssN.w), vec3(-l, 0.285, 0.2)) - ssM.x - ssM.y - teeth, -n * hole);
  b += vec3(dot(q + vec2(0.58, 0.0) - vec2(0.63, 0.38) * ssM.w, vec2(-0.906, 0.423)) - 0.05 * ssM.w, -0.906, 0.423) * side;
  // the slits of the leaf
  float m = mod(q.y - lx * 1.1 + 0.1, 0.25) - 0.125, sm = sign(m + 1e-6), A = (abs(m) - 0.02 - 0.08 * lx) * 0.67, B = 0.085 - lx;
  b = mix(b, mix(vec3(-A, sx * (0.74 * sm + 0.05), -0.67 * sm), vec3(-B, sx, 0.0), step(A, B)), ssN.x);
  // the wave's back
  float r = 1.0 - u * u;
  a = mix(a, vec3(q.y - 0.02 - (0.31 + 0.17 * hump) * r, 1.43 * (1.0 - 2.0 * abs(w)) * r + 0.56 * u * q.x, 1.0) * 0.72, ssM.y);
  b.x = mix(b.x, abs(q.x) - 1.0, ssM.y);
  // teeth and slips, and the comb's bar
  float bar = max(q.y - 0.15, abs(q.x) - 1.1) + 9.0 * (1.0 - ssN.z), top = step(tooth.x, tooth.y);
  vec3 tt = vec3(l + min(max(tooth.x, tooth.y), 0.0) - 0.014, st * (1.0 - top), top);
  a = mix(a, mix(tt, vec3(bar, 0.0, 1.0), step(bar, tt.x)), teeth);
  return mix(a, b, step(a.x, b.x));
}
// the dye of the shape, with the colour of its kind of sound worked in
vec3 ssDye() {
  const mat4x3 one = mat4x3(0.92, 0.008, 0.05, 0.01, 0.62, 0.66, 1.0, 0.50, 0.02, 0.98, 0.10, 0.36), two = mat4x3(0.42, 0.80, 0.03, 0.27, 0.07, 0.78, 0.02, 0.40, 0.80, 0.01, 0.55, 0.42);
  vec3 t = one * ssM + two * ssN + vec3(0.98, 0.30, 0.10) * ssO;
  t += (uKind[0] * ssM.y + uKind[1] * ssM.w + uKind[2] * ssN.z + uKind[3] * ssN.x + uKind[4] * ssO + t * (ssM.x + ssM.z + ssN.y + ssN.w)) * 0.12 - 0.06 * t;
  return t * (ssDeep.x + ssDeep.y * t) + ssDeep.z;
}
// when few are wanted the others sink away into the sand, the far ones first
float ssSink(int i, int k) {
  float th = 0.07 * float(SS_N - 1 - i);
  return 2.4 * smoothstep(th, th + 0.36, sat(-uOwn[2])) * (1.0 - float(k == 0) - float(k == 4));
}
// the dye where bands of cream enamel are painted on: along the rim of the half disc, in slow waves on the others
vec3 ssBandDye(vec3 t, vec2 q, float d, float px) {
  float paint = max(0.85 * ssM.w, sat(uOwn[4])), b = mix((q.y + 0.35 * q.x) * 4.0 + 0.5 * ssHump(q.x * 0.7), -d / 0.17, ssM.w);
  float s = abs(fract(b) - 0.5) * 0.17;
  return mix(t, 0.2 * t + vec3(0.78, 0.72, 0.64), paint * smoothstep(0.043 - px, 0.047 + px, s));
}
vec3 ssSky(vec3 rd) {
  float e = max(rd.y, 0.0) / max(length(rd.xz), 1e-3);
  float st = noise(vec2(rd.x / max(rd.z, 0.2) * 1.6 + 3.0 + uTime * 0.004, e * 22.0)) - 0.5;
  vec3 c = uVar < 0.5 ? mix(ssHzn, ssZen, smoothstep(-0.02, 0.26, e + 0.06 * st)) : mix(ssHzn, ssZen, smoothstep(0.12, 0.36, e + 0.035 * st));
  float b = (e + 0.035 * st - 0.125) / 0.062;
  if (uVar > 0.5) c = mix(c, ssSun * 0.60, 0.92 * exp(-b * b));
  float s = dot(rd, ssL) / length(rd), s2 = s * s, s8 = s2 * s2 * s2 * s2;
  return c + ssSun * (0.2 * step(0.0, s) * s8 * s8 * s8 + 1.6 * smoothstep(0.9981, 0.9986, s));
}
// The ball of clear resin: how much of the way it covers, and its light.
float ssBallAt(vec3 ro, vec3 rd, float len, out vec3 b) {
  vec3 c = ro - ssBall, r = rd / len;
  float B = dot(c, r), near = sqrt(max(dot(c, c) - B * B, 0.0)) - 0.16, px = max(-B, 0.1) / (1.5 * uRes.y);
  vec3 n = (c + r * (-B - sqrt(max(B * B - dot(c, c) + 0.0256, 0.0)))) / 0.16;
  float f = sat(-dot(n, r)), in_ = sat(-dot(n, ssL)), g = sat(dot(n, normalize(ssL - r + 1e-4)));
  vec3 dye = mix(vec3(0.98, 0.20, 0.02), uKind[4] / max(max(uKind[4].r, uKind[4].g), max(uKind[4].b, 0.05)), 0.2);
  g *= g; g *= g; g *= g; g *= g; g *= g; g *= g;
  b = mix(ssAmb + ssSun * 0.2, ssHzn, 1.0 - smoothstep(-0.25, 0.35, n.y)) * mix(vec3(1.0, 0.62, 0.36), dye * dye, f);
  b += dye * ssSun * (0.9 * in_ * in_ * in_ + 0.08 + 0.4 * uMic + 1.3 * uHits) + ssSun * 1.6 * g * g + ssZen * 0.5 * (1.0 - f) * (1.0 - f);
  return B < 0.0 ? ssIn(near, px) : 0.0;
}
// One sheet's test against a way: t along it, q the place on the sheet. What is met goes on the front of a list, four bits each.
#define SS_MEET(I) dn = dot(rd.xz, vec2(-ssA[I].w, ssA[I].z)); t = (ssA[I].y - dot(ro.xz, vec2(-ssA[I].w, ssA[I].z))) / (dn + 1e-5); \
  q = vec2(dot(ro.xz + rd.xz * t, ssA[I].zw) - ssA[I].x, ro.y + rd.y * t); \
  met = int(all(lessThan(vec4(-t, abs(q.x) - ssE[I].x * ssGrow - ssLean, q.y - ssE[I].y * ssGrow, -q.y), vec4(0.0, 0.0, 0.0, 0.04)))); list = list * (1 + 15 * met) + (I + 1) * met;
#define SS_MEET_ALL SS_MEET(8) SS_MEET(7) SS_MEET(6) SS_MEET(5) SS_MEET(4) SS_MEET(3) SS_MEET(2) SS_MEET(1) SS_MEET(0)
// where on its own shape a sheet is met
vec2 ssOn(vec2 q, int i, int k, float sc) {
  q /= sc;
  q.y += ssSink(i, k);
  q.x -= ssGust * q.y * q.y * (0.7 + 0.2 * float(i & 3));
  ssPick(k, q);
  return q;
}
// The light that comes down one way through all the sheets: how much is let through, and what the sheets add of their own.
void ssThrough(vec3 ro, vec3 rd, out vec3 add, out vec3 let) {
  float len = length(rd), dn, t;
  vec2 q;
  vec3 ball;
  int list = 0, met;
  add = vec3(0.0); let = vec3(1.0);
  SS_MEET_ALL
  float cover = ssBallAt(ro, rd, len, ball), passed = 0.0;
  for (int n = 0; n < 7; n++) {
    int i = max((list & 15) - 1, 0);
    vec4 a = ssA[i], ee = ssE[i];
    vec2 ax = a.zw, nn = vec2(-ax.y, ax.x);
    dn = dot(rd.xz, nn); dn = abs(dn) < 1e-3 ? 1e-3 : dn;
    t = (a.y - dot(ro.xz, nn)) / dn;
    // the ball stands among them
    float now = list == 0 || ro.z + rd.z * t > ssBall.z ? cover * (1.0 - passed) : 0.0;
    passed = max(passed, step(1e-4, now));
    add += let * ball * now; let *= 1.0 - now;
    if (list == 0) break;
    list = list >> 4;
    int k = int(ee.w);
    float sc = ee.z * ssGrow;
    float y0 = ro.y + rd.y * t;
    q = ssOn(vec2(dot(ro.xz + rd.xz * t, ax) - a.x, y0), i, k, sc);
    float px = t * len / (1.5 * uRes.y) / sc;
    vec3 sh = ssShape(q);
    float d = sh.x;
    float foot = smoothstep(0.0, 0.010 + px, y0 - 0.008 - 0.016 * noise(vec2(q.x * 9.0, float(i) * 7.0)));
    vec3 dye = ssBandDye(ssDye(), q, d, px);
    // its far face a thumb behind: between the two outlines is the wall
    float inF = ssIn(d, px), inB = ssIn(d + dot(sh.yz, vec2(dot(rd.xz, ax), rd.y)) * (0.036 / sc / abs(dn)), px);
    vec2 ld = vec2(dot(ssL.xz, ax), ssL.y);
    ld /= max(length(ld), 1e-3);
    float lit = dot(sh.yz, ld);
    float wall = abs(inF - inB), body = max(inF, inB) * foot;
    float eg = max(wall, 0.75 * inF * smoothstep(mix(-0.045, -0.018, uTone) - px, -0.010, d));
    float face = 1.0 - sat(abs(dn) / len), fres = 0.022 + 0.6 * face * face * face * face;
    // the sheet: what it mirrors, a little light caught in its thickness and most near its rim
    float near = 1.0 / (1.0 + 90.0 * d * d);
    near *= near;
    float voice = ssN.x * uPhrase;
    vec3 s = mix(ssHzn, ssZen, sat(0.3 + 0.5 * q.y)) * fres + dye * ssAmb * (0.06 + 0.10 * uPad) + dye * ssSun * (near * (0.07 + 0.40 * uLevel) + 0.3 * voice + (uVar < 0.5 ? 0.0 : 0.05));
    // its bevel and its wall: light piped through the sheet comes out here
    float gp = (fract(q.x * 0.35 + q.y * 0.55 - uTime * 0.035 + float(i) * 0.37) - 0.5) * 9.0;
    float glint = 1.0 / (1.0 + 2.0 * gp * gp * gp * gp), up = sat(lit);
    vec3 pipe = mix(dye, vec3(1.0), 0.05 + 0.30 * up * up);
    float edge = 0.22 + 0.45 * uLevel + 1.0 * up + 0.12 * lit + glint * (0.25 + 1.2 * voice + 0.3 * uHigh) + 0.6 * voice + 0.6 * uCue;
    s += pipe * (ssSun * edge + ssAmb * 0.25) * eg * (uVar < 0.5 ? 0.85 : 1.2);
    float mound = inF * (1.0 - foot) * step(0.0, y0);
    float veil = 1.0 - 1.0 / (1.0 + ssMist * t * t);
    s = mix(s, ssHzn, veil);
    add += let * (s * body + mix(ssSand * (0.2 + 0.8 * dye), ssHzn, veil) * mound);
    let *= mix(vec3(1.0), dye * (1.0 - fres) * (1.0 - 0.8 * eg) * (1.0 - veil), body) * (1.0 - mound);
  }
}
// What of the sun reaches a place on the sand.
vec3 ssShade(vec3 ro, out float foot) {
  vec3 sun = vec3(1.0), rd = ssL;
  float dn, t;
  vec2 q;
  int list = 0, met;
  foot = 0.0;
  SS_MEET_ALL
  for (int n = 0; n < 7; n++) {
    if (list == 0) break;
    int i = (list & 15) - 1;
    list = list >> 4;
    vec4 a = ssA[i], ee = ssE[i];
    vec2 ax = a.zw, nn = vec2(-ax.y, ax.x);
    int k = int(ee.w);
    float sc = ee.z * ssGrow;
    dn = dot(ssL.xz, nn); dn = abs(dn) < 1e-3 ? 1e-3 : dn;
    t = (a.y - dot(ro.xz, nn)) / dn;
    q = ssOn(vec2(dot(ro.xz + ssL.xz * t, ax) - a.x, ssL.y * t), i, k, sc);
    float d = ssShape(q).x, soft = 0.006 + 0.012 * t;
    vec3 dye = ssDye();
    sun *= mix(vec3(1.0), ssBandDye(dye, q, d, soft), ssIn(d, soft));
    // the bevel throws a dark line with a bright one inside it
    float e1 = d / (soft + 0.012), e2 = (d + 0.034) / (soft + 0.008);
    e1 = 1.0 / (1.0 + e1 * e1 * e1 * e1); e2 = 1.0 / (1.0 + e2 * e2 * e2 * e2);
    sun *= 1.0 - 0.45 * e1;
    sun += (0.3 * dye + 0.02) * e2 / (1.0 + t * 0.6);
    foot = max(foot, ssIn(d, 0.05) / (1.0 + t * t * 200.0));
  }
  // the ball: a long soft oval with the light it gathers in the middle
  vec3 c = ssBall - ro;
  float al = max(dot(c, ssL), 0.0), d = length(c - ssL * al) - 0.16, sf = 0.012 + 0.012 * al, mid = (d + 0.16) / 0.06;
  sun *= mix(vec3(1.0), vec3(0.54, 0.12, 0.016), ssIn(d, sf));
  sun = mix(sun, vec3(1.0), smoothstep(0.75, 0.95, ssWet));
  return sun + vec3(0.98, 0.22, 0.03) * (1.6 + 2.0 * uHits) * exp(-mid * mid);
}
vec3 render(vec2 p) {
  bool eve = uVar > 0.5;
  float up = sat(uOwn[3]), down = sat(-uOwn[3]), mist = eve ? 0.0 : sat(-uOwn[5]);
  ssWet = eve ? 1.0 - 0.95 * sat(-uOwn[5]) : 0.9 * sat(uOwn[5]);
  ssMist = 0.07 * mist;
  float swell = eve ? sat(uOwn[5]) : 0.0;
  ssGrow = 1.0 + 0.7 * sat(uOwn[2]);
  float deep = 0.7 * uPad + 0.4 * (uTone - 0.5), clear = 0.85 * sat(-uOwn[4]);
  ssDeep = vec3((1.0 - 0.55 * deep) * (1.0 - clear) + 0.28 * clear, 0.6 * deep * (1.0 - clear), 0.72 * clear);
  ssGust = 0.10 * sin(TAU * (1.0 - uCue)) * uCue + 0.006 * sin(uTime * 0.23);
  ssLean = (0.07 + 4.0 * abs(ssGust)) * ssGrow;
  // the hour
  float late = eve ? 0.0 : sat(uOwn[0]), night = eve ? sat(uOwn[0]) : sat(-uOwn[0]), dawn = eve ? sat(-uOwn[0]) : 0.0;
  float az = (eve ? 0.36 : 0.92) + 0.07 * sin(TAU * uLoop) + 0.05 * sin(uTime * 0.021);
  float el = eve ? 0.135 - 0.05 * uDrone : mix(0.50, 0.27, sat(0.85 * uDrone)) - 0.12 * late;
  el = max(el, 0.08);
  ssL = normalize(vec3(sin(az), el, cos(az)));
  if (!eve) {
    ssSun = mix(mix(vec3(1.10, 0.98, 0.82), vec3(1.25, 0.60, 0.26), late), vec3(0.16, 0.23, 0.36), night);
    ssZen = mix(mix(vec3(0.07, 0.36, 0.70), vec3(0.42, 0.30, 0.52), late), vec3(0.012, 0.022, 0.06), night);
    ssHzn = mix(mix(vec3(0.92, 0.82, 0.66), vec3(1.0, 0.46, 0.24), late), vec3(0.05, 0.085, 0.15), night);
  } else {
    ssSun = mix(mix(vec3(1.30, 0.56, 0.16), vec3(1.0, 0.86, 0.60), dawn), vec3(0.26, 0.36, 0.50), night);
    ssZen = mix(mix(vec3(0.27, 0.19, 0.47), vec3(0.36, 0.52, 0.60), dawn), vec3(0.010, 0.016, 0.05), night);
    ssHzn = mix(mix(vec3(0.40, 0.23, 0.47), vec3(0.62, 0.60, 0.62), dawn), vec3(0.03, 0.04, 0.11), night);
  }
  ssSun *= 0.94 + 0.3 * uLevel * uEnergy;
  ssAmb = mix(ssZen, ssHzn, 0.5) * (eve ? 0.55 : 0.42);
  ssBall = eve ? vec3(-0.35, 0.15, 3.1) : vec3(0.22, 0.15, 3.2);
  float h1 = sat(uHits);
  ssBall.y += 0.42 * 4.0 * h1 * (1.0 - h1);
  // where each sheet stands, front to back
  ssA[0] = eve ? vec4(-0.0057, 2.6177, 0.8776, -0.4794) : vec4(-0.7777, 2.4795, 0.9759, 0.2182); ssE[0] = eve ? vec4(1.050, 0.620, 1.00, 1.0) : vec4(0.800, 1.400, 1.00, 0.0);
  ssA[1] = eve ? vec4(1.2888, 2.2779, 0.9211, 0.3894) : vec4(0.4877, 2.5916, 0.9553, 0.2955); ssE[1] = eve ? vec4(0.338, 0.465, 0.75, 9.0) : vec4(0.540, 0.792, 1.20, 9.0);
  ssA[2] = eve ? vec4(0.1445, 2.8747, 0.9394, 0.3429) : vec4(0.1618, 2.9286, 0.9553, -0.2955); ssE[2] = eve ? vec4(0.690, 2.185, 1.15, 4.0) : vec4(0.997, 0.589, 0.95, 1.0);
  ssA[3] = eve ? vec4(1.9006, 2.9689, 0.9004, 0.4350) : vec4(-1.7495, 2.8876, 0.9131, -0.4078); ssE[3] = eve ? vec4(0.416, 0.736, 0.80, 2.0) : vec4(0.494, 0.874, 0.95, 2.0);
  ssA[4] = eve ? vec4(-1.1844, 4.0323, 0.9689, -0.2474) : vec4(2.0237, 3.6657, 0.9553, 0.2955); ssE[4] = eve ? vec4(0.400, 1.600, 1.00, 7.0) : vec4(0.900, 1.300, 1.00, 3.0);
  ssA[5] = eve ? vec4(-0.7927, 4.9733, 0.9394, 0.3429) : vec4(-0.8281, 4.8298, 0.9838, -0.1790); ssE[5] = eve ? vec4(0.945, 1.365, 1.05, 3.0) : vec4(0.612, 1.938, 1.02, 4.0);
  ssA[6] = eve ? vec4(0.7537, 5.0264, 0.9928, -0.1197) : vec4(-0.5103, 5.4187, 0.8776, -0.4794); ssE[6] = eve ? vec4(0.840, 1.470, 1.05, 0.0) : vec4(0.651, 1.890, 1.05, 5.0);
  ssA[7] = eve ? vec4(0.4702, 6.6917, 0.9689, 0.2474) : vec4(-0.6221, 5.8741, 0.9872, 0.1593); ssE[7] = eve ? vec4(1.120, 1.300, 1.00, 6.0) : vec4(1.120, 1.300, 1.00, 6.0);
  ssA[8] = eve ? vec4(1.0285, 7.6936, 0.9689, -0.2474) : vec4(-3.3613, 6.4377, 0.9394, -0.3429); ssE[8] = eve ? vec4(0.682, 1.980, 1.10, 5.0) : vec4(0.460, 1.840, 1.15, 7.0);
  // the eye: verticals stay upright, the horizon is set where the picture wants it
  float high = (eve ? 0.62 : 0.95) * (1.0 - 0.62 * down) + 1.5 * up;
  float hor = (eve ? 0.06 : 0.215) - 0.20 * down + 0.42 * up;
  vec3 ro = vec3(0.16 * sin(uTravel * 0.035) + 0.06 * sin(uTime * 0.05), high, 0.0);
  vec3 rd = vec3(p.x, p.y - hor, 1.5);
  vec3 col, add, let, mirAdd = vec3(0.0), mirLet = vec3(1.0);
  float tg = rd.y < -1e-4 ? -high / rd.y : 1e4;
  float dark = sat(-uOwn[1]), red = sat(uOwn[1]);
  vec3 alb = mix(mix(vec3(0.80, 0.765, 0.70), vec3(0.085, 0.085, 0.10), dark), vec3(0.72, 0.30, 0.13), red);
  ssSand = alb * (ssSun * (eve ? 0.3 : 0.9) + ssAmb * 0.4);
  vec3 g = ro + rd * min(tg, 600.0);
  g.y = 0.0;
  // what is wet, and how the mirror trembles
  float w = 0.0, n1 = noise(g.xz * vec2(0.9, 1.7));
  vec3 rd2 = vec3(0.0, 1.0, 1.0);
  bool wet = ssWet > 0.01 && tg < 600.0;
  for (int n = 0; n < (wet ? 1 : 0); n++) {
    float pool = smoothstep(0.25, 0.62, n1 + 0.45 * ssWet - 0.1);
    w = ssWet * mix(0.55, 1.0, pool);
    vec2 wob = (vec2(noise(g.xz * vec2(2.2, 6.0) + 5.0 * sin(uTime * 0.022)), noise(g.xz * vec2(3.0, 7.0) - 5.0 * cos(uTime * 0.017))) - 0.5) * (0.02 + 0.05 * (1.0 - pool) + 0.2 * swell + 0.04 * uTexture) / (1.0 + 0.06 * tg * tg);
    rd2 = vec3(rd.x + wob.x * 1.5, abs(rd.y) * (1.0 + 2.0 * wob.y), 1.5);
  }
  // the eye's own way first, then the mirror's, where there is one
  for (int n = 0; n < (wet ? 2 : 1); n++) {
    vec3 a1, l1;
    ssThrough(n == 0 ? ro : g, n == 0 ? rd : rd2, a1, l1);
    if (n == 0) { add = a1; let = l1; } else { mirAdd = a1; mirLet = l1; }
  }
  float dist = min(tg, 600.0) * 1.5;
  vec3 far = ssSky(vec3(rd.x, max(rd.y, 0.0), rd.z));
  float pxg = dist / (1.5 * uRes.y), fine = 1.0 / (1.0 + dist * dist * 0.02);
  // the sand: ripples the wind left, dents, grains
  float n2 = noise(g.xz * 7.0);
  float ph = g.z * 34.0 + g.x * 9.0 + n1 * 15.0 + n2 * 1.6, fadeR = exp(-pxg * pxg * dist * dist * 700.0);
  float relief = (0.20 * sin(ph) * (0.3 + n1) * fadeR + 0.34 * (n2 - 0.5) * fine + 0.35 * (n1 - 0.5)) * (1.0 - 0.9 * ssWet);
  float grain = (hash21(floor(gl_FragCoord.xy) + 3.0) - 0.5) * (0.06 + 0.06 * uTexture);
  vec3 tint = alb / 0.76;
  alb *= 1.0 + grain;
  // the piece dyes the sand where its sounds are
  vec4 m = piece(vec2(0.5 + g.x / (2.0 + g.z), sat(1.0 - (g.z - 1.6) / 5.0)));
  vec3 dye = m.rgb / max(m.a, 0.004);
  dye /= max(max(dye.r, dye.g), max(dye.b, 0.05));
  vec3 stain = mix(vec3(1.0), dye * dye * 0.95 + 0.05, 0.8 * sat(m.a * (0.9 + 0.8 * uEnergy)));
  alb *= stain;
  float foot = 0.0;
  vec3 sun = vec3(1.0);
  for (int n = 0; n < (ssWet < 0.95 && g.z < 12.0 ? 1 : 0); n++) sun = ssShade(g, foot);
  vec3 lit = ssSun * sun * (1.0 + 1.1 * relief) * (eve ? 0.45 : 0.88) + ssAmb * (eve ? 0.62 : 0.26);
  col = alb * max(lit, 0.0) * 1.35 * (1.0 - 0.3 * foot);
  // wet: the sheets and the sky stand upside down in it
  float gr = 1.0 - sat(-rd.y / length(rd));
  vec3 mir = (mirAdd + mirLet * (ssWet > 0.01 ? ssSky(rd2) : vec3(0.0))) * tint * mix(vec3(1.0), stain, 0.8);
  col = mix(col * mix(1.0, 0.3, w), mir, w * (0.62 + 0.33 * gr * gr * gr));
  // the ring of a hit, running out over the sand from under the ball
  float rr = (length(g.xz - ssBall.xz) - 0.2 - 1.5 * (1.0 - h1)) * 5.0;
  col *= mix(vec3(1.0), uKind[4] * 1.3, 0.85 * h1 * exp(-rr * rr));
  // glitter
  vec2 gc = g.xz * 45.0;
  float gst = hash21(mod(floor(gc), 211.0));
  col += ssSun * (0.2 - 0.12 * ssWet + 3.0 * uTexture) * smoothstep(0.975, 0.985, gst) * fine * (0.5 + 0.5 * sin(uTime * 0.8 + gst * 900.0)) * (1.0 - smoothstep(0.1, 0.32, length(fract(gc) - 0.5)));
  // the tide coming in leaves a lace of foam
  if (swell > 0.0) {
    float la = abs(noise(g.xz * vec2(0.9, 2.0) + vec2(0.0, 2.0 * sin(uTime * 0.05))) + 0.35 * noise(g.xz * vec2(4.0, 7.0) - 2.0 * cos(uTime * 0.04)) - 0.66);
    col = mix(col, (ssSun + ssAmb) * 0.7, 0.75 * swell * (1.0 - smoothstep(0.01, 0.05 + 2.0 * pxg, la)));
  }
  // the sea and its edge
  float shore = 15.0 + 0.8 * sin(g.x * 0.35 + 1.0) + 0.5 * sin(g.x * 0.9 + uTime * 0.12) + 0.5 * sin(uTime * 0.17);
  float sea = smoothstep(shore - pxg * 8.0, shore + 0.3 + pxg * 8.0, g.z);
  float wav = noise(vec2(g.x * 0.5, g.z * 0.9 + 6.0 * sin(uTime * 0.04)));
  vec3 water = mix(mix(ssZen * 0.7 + vec3(0.0, 0.16, 0.15) * ssSun, ssHzn, 0.12), ssHzn, smoothstep(0.55 - 0.2 * uMic, 0.85, wav) * 0.6);
  if (eve) water = mix(far * 0.9, water * 0.6, 0.14);
  col = mix(col, water, sea);
  float fo = (g.z - shore) / 0.8;
  col = mix(col, (ssSun + ssAmb) * 0.75, (eve ? 0.35 : 0.8) * exp(-fo * fo));
  col = mix(col, ssHzn, 1.0 - exp(-dist * (0.006 + 0.012 * uSpace + 0.22 * mist)));
  col = mix(far, col, smoothstep(0.0, 2.0 / uRes.y, -rd.y));
  if (mist > 0.0) col = mix(col, ssHzn, mist * 0.6 * exp(-abs(rd.y) * 9.0));
  col = add + let * col;
  col = 1.0 - exp(-max(col, 0.0) * 1.75);
  return pow(col, vec3(0.4545));
}
