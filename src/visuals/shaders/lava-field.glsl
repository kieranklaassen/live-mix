// name: Lava field
// a: Crust
// b: Shore
// what: Cooling lava seen from a low height at dusk: plates of black, rope-wrinkled crust drift and part over red and orange seams, and an open channel winds through them carrying rafts; or a dark slope at night where five red fingers run down into the sea, each raising steam lit from below, their light broken on the water.
// follows: The low band widens the seams and fingers; on the crust the piece heats its own place, high sounds throw sparks and keys brighten the sheen; on the shore each kind of sound feeds its own finger and steam, highs glint on the sea and keys light surf and stars; a hit cracks a plate or bursts at one finger's foot; a cue sends a bright surge down the flow.
// The light of hot rock, 0 cold to 1 nearly white.
vec3 lfHot(float t) {
  t = max(t, 0.0);
  float t2 = t * t, t4 = t2 * t2;
  return vec3(2.6 * t2 * min(1.0, .25 + t * 1.2), .55 * t4, .05 * t4 * t4);
}
float lfS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// A number for a place, and the noise from it, that hold however far the flow has run.
float lfHash(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float lfVal(vec2 p) {
  vec2 i = floor(p), f = p - i; f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lfHash(i), lfHash(i + vec2(1, 0)), f.x), mix(lfHash(i + vec2(0, 1)), lfHash(i + vec2(1, 1)), f.x), f.y);
}
vec3 lfInk(vec3 k) { return k * k / max(max(k.r, max(k.g, k.b)), .05); }

// ---- a: the crust from above
float lfD, lfId; // distance to the plate's edge, a number of its own
vec2 lfN, lfC;     // the way to that edge, the plate's middle
vec3 lfPoint(vec2 c) {
  vec3 q = fract((c.xyx + 17.0) * vec3(.1031, .103, .0973)); q += dot(q, q.yzx + 33.33); q = fract((q.xxy + q.yzz) * q.zyx);
  vec2 o = abs(fract(uTime * (.003 + .008 * q.yx) + q.xy) - .5) * 4.0 - 1.0;
  return vec3(.5 + .28 * (q.xy * 2.0 - 1.0) + .08 * o, .2 * q.z);
}
// Plates of uneven size, corners rounded off.
void lfPlates(vec2 x) {
  vec2 ic = floor(x), f = x - ic, mo = vec2(0.0), mr = vec2(0.0);
  float best = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j);
    vec3 q = lfPoint(ic + o);
    vec2 r = o + q.xy - f;
    float d = dot(r, r) - q.z;
    if (d < best) { best = d; mo = o; mr = r; }
  }
  float b = 9.0, hard = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    if (i == 0 && j == 0) continue;
    vec2 o = mo + vec2(i, j);
    vec3 q = lfPoint(ic + o);
    vec2 r = o + q.xy - f, e = r - mr;
    float l = length(e) + 1e-4, d = (dot(r, r) - q.z - best) / (2.0 * l);
    if (d < hard) { hard = d; lfN = e / l; }
    b = smin(b, d, .07);
  }
  lfD = b; lfC = x + mr; lfId = hash21(ic + mo + 7.0);
}
// Small sharp pieces, in one pass.
float lfShards(vec2 x) {
  vec2 ic = floor(x), f = x - ic, r1 = vec2(1.0), r2 = vec2(2.0);
  float a = 9.0, b = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j), r = o + lfPoint(ic + o).xy - f;
    float d = dot(r, r);
    if (d < a) { b = a; r2 = r1; a = d; r1 = r; } else if (d < b) { b = d; r2 = r; }
  }
  float l = length(r2 - r1) + 1e-4;
  lfN = (r2 - r1) / l;
  return (b - a) / (2.0 * l);
}
// Noise, then its slope along x and y.
vec3 lfNoise(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = lfHash(i), b = lfHash(i + vec2(1, 0)), c = lfHash(i + vec2(0, 1)), d = lfHash(i + vec2(1, 1)), k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
// The skin of one plate: arched ropes, folds along the edge, grain. Its slope, then its height.
vec3 lfSkin(vec2 x, float e, vec2 n, float px) {
  mat2 R = rot((lfId - .5) * 2.6);
  vec2 q = R * (x - lfC);
  vec3 wob = lfNoise(x * 2.3 + lfId * 40.0), w2 = lfNoise(x * 6.5), g1 = lfNoise(rot(.6) * x * 40.0);
  wob.yz *= 2.3; w2.yz *= 6.5;
  float curl = 1.2 + 1.5 * fract(lfId * 13.0), fr = mix(33.0, 52.0, fract(lfId * 29.0));
  float v = fr * (q.y + curl * q.x * q.x + .34 * wob.x + .07 * w2.x), sv = sin(v);
  float m = .72 * (.3 + .7 * lfS(.14, .42, wob.x) * lfS(.03, .2, e)) / (1.0 + px * px * fr * fr * .6);
  vec2 s = m * cos(v) * sv / sqrt(sv * sv + .006) * (vec2(2.0 * curl * q.x, 1.0) * R + .34 * wob.yz + .07 * w2.yz);
  float fo = 30.0 * e + 4.0 * wob.x + 1.5 * w2.x, sf = sin(fo), far = 1.0 / (1.0 + e * e * 160.0);
  s += .024 * far / (1.0 + px * px * 500.0) * cos(fo) * sf / sqrt(sf * sf + .015) * (4.0 * wob.yz + 1.5 * w2.yz - 30.0 * n);
  s += .03 * w2.yz + .2 * g1.yz * (1.0 + 2.4 * exp(-max(e, 0.0) * 9.0)) / (1.0 + px * px * 1500.0);
  float grain = lfS(.013, .004, px);
  if (grain > 0.0) s += grain * .24 * lfNoise(rot(.3) * x * 116.0).yz;
  float ro = sat((e + .02) / .15);
  return vec3(s - n * 2.6 * ro * (1.0 - ro), m / fr * abs(sv));
}
// The crack of a hit, running out both ways from the middle of a plate: how far inside its gap we are.
float lfCrack(vec2 q, float open) {
  q = rot(lfId * 5.0) * q;
  if (open < .02) return -1.0;
  float y = q.y + .09 * (noise(vec2(q.x * 8.0 + 9.0, lfId * 90.0)) - .5) + .03 * (noise(vec2(q.x * 30.0 + 50.0, lfId * 70.0)) - .5);
  float l = .2 + .14 * (1.0 - uHits);
  return .016 * open * lfS(l, l - .17, abs(q.x)) - .003 - abs(y);
}
// Specks of fire that rise and go out.
float lfSparks(vec2 p) {
  vec2 q = p * 19.0; q.x += .3 * sin(q.y * .9 + uTime * .3);
  q.y -= uTime * .45;
  vec2 c = floor(q), h = vec2(lfHash(c), lfHash(c + 41.7));
  float l = length(q - c - .2 - .6 * h), tw = .5 + .5 * sin(uTime * (.8 + h.x) + TAU * h.y);
  return step(.6, fract(h.x * 17.0 + h.y * 5.0)) * tw * exp(-l * l * 260.0);
}
vec3 lfCrust(vec2 p) {
  // heat haze
  float far = sat(p.y + .5);
  p.x += .0016 * far * sin(p.y * 70.0 - uTime * 1.1 + 2.0 * sin(p.x * 13.0));
  float D = 1.0 / max(1.0 - p.y, .2);
  vec2 g = vec2(p.x * D, D);
  // the piece heats its own place
  vec4 m = piece(clamp(vec2((p.x + .88) / 1.76, .5 - p.y), .01, .99));
  float here = sat(m.a), px = p.x - 1.7 * (uLoop - .5);
  here = sat(here + .2 * uLevel * exp(-px * px * 30.0) * sin(PI * uLoop));
  vec3 ink = lfInk(m.rgb / max(max(m.r, max(m.g, m.b)), .02) + .02);
  vec3 tint = mix(vec3(1.0), .45 + ink, .36 * sat(m.a * 1.5));
  float glow = .86 + .22 * uEnergy;
  // the channel, an S from far right to near left
  float zz = g.y - .68;
  float cx = -.22 + .74 * zz + .2 * sin(zz * 4.4), sl = .74 + .88 * cos(zz * 4.4), il = 1.0 / sqrt(1.0 + sl * sl);
  float t = (g.x - cx) * il, hw = .115 + .03 * sin(g.y * 9.0 + 1.0) + .012 * uLow;
  t += .04 * (noise(g * 8.0) - .5) + .016 * (noise(g * 26.0) - .5);
  float side = hw - abs(t);
  bool run = side > 0.0;
  float SC = run ? 5.6 : 2.3;
  float s = g.y * 1.35 + uTravel * .06;
  vec2 x = run ? vec2(t, s * .62) * SC : (g + vec2(.004, .006) * uTravel) * SC;
  x += .34 * vec2(noise(x * 1.1 + 5.0), noise(x * 1.1 + 19.0)) + .05 * sin(x.yx * 5.1 + 2.0 * sin(x * 3.3));
  float vary = noise(g * 2.6 + vec2(uTime * .008, 7.0));
  // some plates are broken small
  float e2 = 9.0;
  vec2 n2 = vec2(0.0);
  float brk = lfS(.52, .76, noise(x * .75 + 13.0));
  if (brk > 0.0 && !run) {
    float sd = lfShards(x * 2.9 + 4.0);
    e2 = (sd - (.008 + .04 * uLow * vary + .02 * here) * brk + .5 * (1.0 - brk)) / 2.9; n2 = lfN * lfS(.09, .02, e2);
  }
  lfPlates(x);
  float w = run ? .04 + .09 * vary + .03 * uLow : .003 + .03 * lfS(.45, .8, vary) + .055 * uLow * vary * vary + .01 * here;
  float e = lfD - w;
  vec2 n = lfN;
  if (e2 < e) { e = e2; n = n2; }
  // ragged, near the edge
  if (e < .12) e -= lfS(.12, .05, e) * (.055 * (lfVal(x * 8.0) - .5) + .035 * (lfVal(x * 24.0) - .5));
  // open rock along both banks, and a lip that holds it
  float bank = (side - .035) * SC, lip = (.018 - abs(side)) * SC;
  if (run && bank < e) { e = bank; n = vec2(sign(t), 0.0); }
  vec2 across = run ? vec2(1.0, 0.0) : vec2(1.0, -sl) * il;
  if (lip > e) { e = lip; n = -sign(t) * across; if (!run) e = max(e, (.03 + side) * SC); }
  // a hit cracks the plate near one of two places; which one changes slowly
  float ck = -1.0, turn = uTime * .05;
  if (uHits > .01 && !run) {
    vec2 c = (lfC - .17) / SC - vec2(.004, .006) * uTravel;
    float one = lfS(.26, .16, length(c - vec2(.42, .9))) * lfS(-.2, .4, sin(turn)), two = lfS(.26, .16, length(c - vec2(-.4, .95))) * lfS(-.2, .4, -sin(turn));
    ck = lfCrack((x - lfC) / SC, uHits * max(one, two) * (1.0 - brk));
    if (-ck * SC < e) { e = -ck * SC; n = vec2(.5, .86); }
  }
  float pxl = D * SC / uRes.y, crust = lfS(-pxl, pxl, e);
  // molten rock
  float warm = .2 * uLow + .5 * here + .12 * uLevel + .08 * (uTone - .5);
  float cz = zz - .82 * uCue, surge = lfS(0.0, .4, uCue) * (cz > 0.0 ? exp(-cz * 1.6) : exp(-cz * cz * 40.0)), chan = run ? 1.0 : exp(side * 14.0);
  vec3 red = lfHot((.36 + .75 * warm + .3 * surge * chan) * glow) * tint, lava = vec3(0.0);
  if (crust < 1.0) {
    float deep = sat(-e / (w + .03));
    vec2 fl = run ? vec2(t * 34.0, s * 5.0) : x * 6.0;
    float skin = .6 * lfVal(fl + 3.0 * lfVal(fl * .5)) + .4 * lfVal(fl * 2.7);
    float thread = 1.0 - abs(2.0 * lfVal(fl * vec2(1.6, .8) + 5.0 * skin) - 1.0);
    float T = (run ? .3 : .2) + .36 * deep * (.35 + skin) + .95 * warm * (.35 + .65 * deep) + .12 * thread * thread * thread * deep;
    T -= (run ? .36 : .26) * lfS(.47, .62, skin) * lfS(.15, .6, deep) * (1.0 - .5 * warm);
    T = (T + .75 * surge * chan + .7 * uHits * lfS(-.01, .002, ck)) * glow;
    T = T < .6 ? T : .6 + .6 * (1.0 - exp(-(T - .6) * 1.7));
    lava = lfHot(T) * tint;
  }
  // the side of a plate that faces us
  float thick = .04 * max(-n.y, 0.0), wall = sat(-e / (thick + 1e-4));
  lava = mix(vec3(.006) + red * .5 * wall, lava, lfS(.8, 1.0, wall));
  vec3 col = lava;
  if (crust > 0.0) {
    vec3 sk = lfSkin(x, e, n, pxl);
    vec3 N = normalize(vec3(-sk.xy, .8).xzy);
    vec3 V = normalize(vec3(-p.x, 1.0, -.9 - p.y * .3)), L = normalize(vec3(-.62, .36, .7));
    float nl = sat(dot(N, L)), sp = sat(dot(N, normalize(L + V)));
    sp *= sp; sp *= sp * sp; sp *= sp;
    vec3 cold = vec3(.3, .42, .62) * mix(.75, 1.15, sat(.5 - p.x * .5 + p.y * .4));
    vec3 k = vec3(.045, .042, .046) * (.7 + .6 * fract(lfId * 3.7)) * (cold * nl * 2.0 + vec3(.1, .12, .2) * N.y * .5);
    k += cold * sp * (.26 + .2 * uKeys) * (.3 + fract(lfId * 5.7)) + cold * .1 * pow(1.0 - sat(dot(N, V)), 4.0);
    k *= .25 + .75 * lfS(0.0, .1, e);
    // light thrown up by the seam, and by the channel
    float tow = sat(dot(N, normalize(vec3(n.x, .15, n.y))));
    k += red * (tow * tow * .7 + .008) * exp(-max(e, 0.0) * 22.0) * sat(w * 24.0);
    vec2 to = -sign(t) * across;
    k += lfHot(.6 * glow + .3 * warm + .35 * surge) * (run ? .1 : .2 * exp(side * 14.0)) * sat(dot(N, normalize(vec3(to.x, .12, to.y)))) * (run ? .4 : 1.0);
    k += red * .7 * exp(-max(e, 0.0) * 70.0);
    k += lfHot(.72) * exp(ck * 60.0) * .6 * uHits * mix(vec3(1.0), lfInk(uKind[4]), .3);
    col = mix(lava, k, crust);
  }
  // haze, and sparks over the open rock
  vec3 air = vec3(.02, .026, .044) + lfHot(.33 + .15 * uLevel + .15 * uMic) * .22 * exp(-abs(t) * 2.5);
  col = mix(col, air, sat((D - .9) * (.26 + .2 * uSpace)));
  if (uHigh > .01 && abs(t) < .4) col += lfHot(.9) * 3.0 * uHigh * lfSparks(p) * exp(-max(abs(t) - .05, 0.0) * 12.0);
  return screenOf(col);
}
// ---- b: the shore at night
float lfSlope(float x) { return sat((x + .8) / 1.7); }
float lfTop(float x) { float s = lfSlope(x); return .34 * s * (.7 + .3 * s) + s * (.018 * sin(x * 8.0 + 1.0) + .008 * sin(x * 23.0 + 2.0 * sin(x * 7.0)) + .003 * sin(x * 71.0 + 3.0 * sin(x * 31.0))); }
float lfEdge(float x) { float s = lfSlope(x); return -.22 * s * (.82 + .18 * s) - s * (.016 * sin(x * 11.0 + 2.0) + .008 * sin(x * 27.0 + 2.0 * sin(x * 9.0)) + .004 * sin(x * 66.0 + 2.5 * sin(x * 29.0))); }
const int lfKind[5] = int[5](1, 2, 4, 0, 3);
const vec3 lfFoot[5] = vec3[5](vec3(-.43, -.0409, .589), vec3(-.20, -.0657, .738), vec3(.04, -.1058, .894), vec3(.30, -.1284, 1.062), vec3(.64, -.1805, 1.282));
// Billows; x is all of them, y the two large ones alone.
vec2 lfPuff(vec2 q) {
  float a = .55 * abs(2.0 * lfVal(q) - 1.0); q = rot(.7) * q * 2.07 + 3.3;
  float b = a + .275 * abs(2.0 * lfVal(q) - 1.0); q = rot(.7) * q * 2.07 + 3.3;
  return vec2(b + .14 * abs(2.0 * lfVal(q) - 1.0) + .07 * lfVal(q * 2.07), b);
}
float lfBig(vec2 q) { return .55 * abs(2.0 * lfVal(q) - 1.0) + .275 * abs(2.0 * lfVal(rot(.7) * q * 2.07 + 3.3) - 1.0); }
vec3 lfCoast(vec2 p) {
  float top = lfTop(p.x), edge = lfEdge(p.x), slope = lfSlope(p.x), px = 1.2 / uRes.y;
  float glow = .86 + .22 * uEnergy, tone = .08 * (uTone - .5);
  float lv[5]; vec3 fire[5], tin[5];
  for (int i = 0; i < 5; i++) {
    float at = lfFoot[i].x - 1.7 * (uLoop - .5);
    lv[i] = sat((i == 0 ? uPad : i == 1 ? uTexture : i == 2 ? uHits : i == 3 ? uDrone : uPhrase) + .2 * uLevel * sin(PI * uLoop) / (1.0 + 30.0 * at * at));
    tin[i] = mix(vec3(1.0), .45 + lfInk(uKind[lfKind[i]]), .3);
    fire[i] = lfHot((.36 + .5 * lv[i] + tone) * glow) * tin[i];
  }
  // sky
  vec3 col = mix(vec3(.016, .026, .05), vec3(.003, .005, .013), lfS(-.02, .42, p.y));
  col += vec3(.02, .03, .045) * exp(-abs(p.y) * 14.0) * lfS(.6, -.9, p.x);
  if (p.y > 0.0) {
    vec2 sc = floor(p * 46.0), sh = hash22(sc + 4.0);
    float sl = length(p * 46.0 - sc - .15 - .7 * sh);
    col += vec3(.5, .6, .8) * step(.8, hash21(sc + 9.0)) * exp(-sl * sl * 260.0) * (.4 + sh.x) * lfS(.02, .2, p.y) * (.8 + .2 * sin(uTime * .4 + TAU * sh.y) + 1.6 * uKeys);
  }
  // the land
  float v = max(p.y - edge, 0.0) / max(top - edge, .01), land = lfS(-px, px, top - p.y) * lfS(0.0, .01, top - edge);
  if (p.y < top + .01 && p.y > edge - .02 && land > 0.0) {
    // old flows down to a dark cliff
    float rise = top - edge, u = p.x - .35 * v + .05 * noise(p * 12.0), cliff = lfS(.34, .2, v + .14 * noise(vec2(u * 12.0, 3.0)));
    vec2 a1 = vec2(u * 26.0, v * rise * mix(42.0, 20.0, cliff));
    float b1 = noise(a1), rk = b1 - noise(a1 + vec2(.3, -.35)) - .35 * dot(lfNoise(vec2(u * 90.0, v * rise * 110.0 + 4.0 * b1)).yz, vec2(.4, -.5));
    float grit = noise(p * 210.0);
    vec3 k = vec3(.016, .023, .036) * sat(.22 + rk * 1.3) * (.5 + grit) * mix(.5 + .9 * v, .2, cliff);
    k += vec3(.02, .028, .042) * exp(-(top - p.y) * 90.0);
    // thin threads between the fingers
    float some = lfS(.5, .75, noise(vec2(u * 9.0 + 3.0, v * 4.0 + 9.0))) * lfS(.95, .6, v);
    if (some > 0.0) {
      float cr = abs(noise(vec2(u * 26.0 + .8 * noise(vec2(u * 14.0, v * 6.0)), v * 2.0 + 20.0)) - .5);
      k += lfHot((.3 + .45 * uLow + .15 * uLevel) * glow) * lfS(.045, 0.0, cr) * some * (.2 + grit);
    }
    for (int i = 0; i < 5; i++) {
      float fi = float(i), w = .013 * lfFoot[i].z * (1.15 - .5 * v) * (1.0 + .5 * lv[i] + .4 * uLow);
      float mid = lfFoot[i].x + v * (.16 + .05 * fi) + .11 * (noise(vec2(v * 3.2, fi * 7.0)) - .5) * lfS(0.0, .2, v);
      float dx = p.x - mid;
      if (abs(dx) > .22) continue;
      float fork = .04 * lfFoot[i].z * lfS(.75, .1, v) * (i == 1 || i == 4 ? 1.0 : .5);
      float two = min(abs(dx - fork), abs(dx + fork * .7));
      two += .9 * w * (noise(vec2(p.x * 50.0, v * 14.0 + fi)) - .5) + .5 * w * (grit - .5);
      float in_ = lfS(w + px, w - px, two), core = sat(1.0 - two / w);
      float crust = lfS(.42, .66, noise(vec2(dx / w * .7 + fi * 9.0, v * 16.0 * (.5 + slope) + uTravel * .12)));
      float cq = v - uCue * .55, surge = lfS(0.0, .5, uCue) * (cq > 0.0 ? exp(-cq * 1.2) : exp(-cq * cq * 60.0));
      float T = (.3 + .3 * core + (.2 + .35 * core) * lv[i] + .1 * exp(-v * 9.0) + tone + .7 * surge) * glow - crust * (.28 - .1 * lv[i]);
      in_ *= lfS(.98, .7, v + .15 * noise(vec2(p.x * 30.0, fi)));
      k += fire[i] * (.3 + 1.0 * surge) * exp(-two / w * .55) * (.06 + .8 * sat(.2 + rk * 1.6)) * (.5 + grit);
      k = mix(k, lfHot(T) * tin[i], in_);
    }
    k = mix(vec3(.012, .018, .033), k, lfS(0.0, .4, slope + .1));
    col = mix(col, k, land);
  }
  // the sea
  float wet = lfS(px, -px, p.y - min(edge, 0.0));
  if (wet > 0.0) {
    float d = max(-p.y, .002), ld = log(d + .004);
    vec2 rq = vec2(p.x / (d + .07) * 2.0, ld * 13.0 + uTime * .3);
    float fade = lfS(0.0, .05, d);
    float r1 = lfVal(rq + vec2(uTime * .12, 0.0)), r2 = lfVal(rq * vec2(2.7, 2.3) - vec2(uTime * .2, 4.0)), r3 = lfVal(rq * vec2(6.5, 5.5) + vec2(uTime * .3, 9.0)), rip = mix(.5, .5 * r1 + .36 * r2 + .14 * r3, fade);
    float gl = lfS(.46, .68, rip);
    vec3 k = vec3(.003, .006, .011) + vec3(.016, .026, .045) * exp(-d * 9.0) + vec3(.012, .018, .026) * gl * lfS(.5, -.8, p.x);
    for (int i = 0; i < 5; i++) {
      float dd = max(lfFoot[i].y - p.y, 0.0), rx = p.x - lfFoot[i].x + (rip - .5) * (.06 + .5 * dd);
      float wi = .022 * lfFoot[i].z + .16 * dd;
      float ex = exp(-dd * 4.8), nar = sat(1.0 - rx * rx / (3.0 * wi * wi)), wide = 1.0 / (1.0 + rx * rx * 9.0 / lfFoot[i].z);
      k += fire[i] * ex * (nar * nar * (.08 + 1.5 * gl * (1.0 + 2.5 * uHigh * r3 * r3)) * lfS(-.03, .01, lfFoot[i].y - p.y) + wide * wide * (.015 + .09 * gl));
    }
    // surf at the foot of the rock
    float off = edge - p.y;
    if (off < .06 && slope > 0.0) {
      float wave = .5 + .5 * sin(uTime * .5 + p.x * 5.0 + 3.0 * noise(vec2(p.x * 6.0, 0.0)));
      float foam = lfS(.016, 0.0, abs(off - .014 * slope * (.4 + wave))) * slope * lfS(.3, .75, noise(vec2(p.x * 38.0 + p.y * 60.0, p.y * 130.0 + 3.0 * sin(p.x * 41.0))));
      vec3 near = vec3(.02, .03, .045);
      for (int i = 0; i < 5; i++) { float rx = p.x - lfFoot[i].x; near += fire[i] * exp(-rx * rx * 160.0); }
      k += near * foam * (1.2 + 3.0 * uKeys);
    }
    col = mix(col, k, wet);
  }
  // steam, lit from below
  float dens = 0.0; vec3 lit = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float h = (p.y - lfFoot[i].y) / lfFoot[i].z;
    if (h < -.06) continue;
    float hp = max(h, 0.0), cx = lfFoot[i].x - lfFoot[i].z * (.32 * hp + .5 * hp * hp), wd = lfFoot[i].z * (.045 + (.3 + .1 * uSpace) * hp);
    float dx = (p.x - cx) / wd, kn = sat(1.0 - .28 * dx * dx), ex = exp(-hp * 1.4), e2 = ex * ex;
    if (kn <= 0.0) continue;
    float a = kn * kn * kn * lfS(-.06, .02, h) * ex * (i == 2 ? .65 : .5 + .5 * lv[i]);
    dens += a; lit += a * fire[i] * (e2 * e2 * 1.9 + .035) * (1.0 + .6 * uMic);
  }
  if (dens > .01) {
    vec2 q = vec2(p.x * 6.5 + p.y * 2.0, p.y * 6.5) + vec2(uTime * .05, -uTime * .11);
    q += .16 * sin(q.yx * 1.7 + 2.0 * sin(q * .9));
    vec2 pu = lfPuff(q);
    float f = pu.x, dif = pu.y - lfBig(q + vec2(.16, -.2)) + 1.2 * (pu.x - pu.y - .1);
    float a = lfS(.38, .74, dens * 1.35 + (f - .4) * .9);
    float under = sat(.4 + dif * 1.9);
    vec3 fl = lit / dens, st = mix(fl, vec3(1.0, .7, .58) * dot(fl, vec3(.6, .3, .1)), .32) * (.06 + 1.9 * under * under);
    st += vec3(.03, .04, .06) * (.35 + 1.3 * sat(.5 - dif * 1.8)) * (.5 + f);
    col = mix(col, st, a * .93);
    col += lit * .08;
  }
  // a hit: drops thrown up at the middle finger
  if (uHits > .01 && length(p - lfFoot[2].xy) < .4) {
    float t = 1.12 - uHits, b = 0.0;
    for (int i = 0; i < 14; i++) {
      vec2 h = hash22(vec2(i, 3)), at = lfFoot[2].xy + vec2((h.x - .5) * .34, .14 + .3 * h.y) * t - vec2(0.0, .26 * t * t);
      float l = length(p - at);
      b += .0000035 * (.5 + h.y) / (l * l + .000006);
    }
    col += lfHot(1.0) * tin[2] * b * uHits * 2.0 * lfS(0.0, .1, uHits);
  }
  return screenOf(col);
}
vec3 render(vec2 p) { if (uVar < .5) return lfCrust(p); return lfCoast(p); }
