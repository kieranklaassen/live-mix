// name: Sun instruments
// a: Shadow stair
// b: Sunk bowl
// what: A yard of rose plaster in early sun: a huge stair cut off by the sky, two quarter rings of marble, and the stair's edge laying one knife of blue shade across the left ring; or a white bowl sunk in the paving, ruled with a net of slate, half in its own shade, with a ring on a wire and the ring's shadow on its slope.
// follows: The loop is the sun: the shade goes out along the marble and back, and the piece, inlaid there, lights where it is. Drone deepens sky and shade, pad and voice warm it, texture wears the plaster, a phrase climbs the stair and opens the ring's shadow, the bands colour sixteen marks, keys are birds. A hit gilds the shade's line and drops a leaf; a cue is cloud.
// own: 0 moonlight with a lamp in the door at -1, a burning sunset at 1; 1 whitewash at -1, dark stone with brass scales at 1; 2 snow at -1, still water over the yard and in the bowl at 1; 3 clear deep blue air at -1, thick dust at 1; 4 the eye near the ground at -1, high above at 1; 5 a low long stair or a shallow dish at -1, a steep stair or a chequered bowl at 1
vec3 syS, syM, syE, syC; // towards the sun; noon, and along the stair's edge; the middle of the rings, on that edge
float syH, syH0, syPx, sySun; // the sun's hour as an angle, its middle; a pixel at distance one; how much sun no cloud hides
float syNight, syDusk, syLime, syDark, sySnow, syWet, syClear, syThick; // the other worlds
vec3 sySunC, sySkyC, syBounce; // the lights
const float SYW = 0.42, SYI = 0.29, SYR = 2.0, SYO = 2.34, SYB = 0.46, SYSW = 0.3; // half wall, half stair, ring inside and out, half its width, the swing
const float SYRIM = 1.5, SYOUT = 1.68; // the lip of the bowl
const vec3 SYEYE = vec3(1.9, 0, -5.6); // the middle of the wire over it
vec3 syBowl, syRingN; float syBR, syPool; // the bowl's sphere, how the little ring is turned, how high water stands
float syT, syNear, syK; int syId; vec3 syN, syQ, syOr, syRd; // what a ray met: how far, the nearest edge it grazed, how near the line of the shade, what, its facing, its own place; the ray

float syIn(float d, float w) { return 1.0 - smoothstep(-w, w, d); }
float syBell(float x) { return exp(-x * x); }
void syWorld() {
  syNight = max(-uOwn[0], 0.0); syDusk = max(uOwn[0], 0.0);
  syLime = max(-uOwn[1], 0.0); syDark = max(uOwn[1], 0.0);
  sySnow = max(-uOwn[2], 0.0); syWet = max(uOwn[2], 0.0);
  syClear = max(-uOwn[3], 0.0); syThick = max(uOwn[3], 0.0);
  float phi = 0.66 + (uVar < 0.5 ? 0.2 * uOwn[5] : 0.0);
  syE = vec3(0.0, sin(phi), cos(phi)); syM = vec3(0.0, cos(phi), -sin(phi));
  syH0 = 0.68 + 0.12 * syDusk;
  syH = syH0 - SYSW * cos(TAU * uLoop);
  syS = cos(syH) * syM + sin(syH) * vec3(1, 0, 0);
  syC = vec3(0, SYR * syM.y + 0.16, 0);
  float dish = 0.9 * max(-uOwn[5], 0.0);
  syBowl = SYEYE + vec3(0, dish, 0); syBR = sqrt(SYRIM * SYRIM + dish * dish);
  syPool = mix(-1.75, -0.3, smoothstep(0.0, 1.0, syWet));
  float lean = mix(1.02, 0.15, smoothstep(0.0, 0.9, uPhrase)) + 0.06 * sin(uTime * 0.23);
  syRingN = cos(lean) * syS + sin(lean) * normalize(cross(syS, vec3(0.3, 1, 0)));
  sySunC = vec3(2.8, mix(2.05, 2.3, uTone), mix(1.25, 1.75, uTone));
  sySunC = mix(sySunC, vec3(3, 1.2, 0.42), syDusk);
  sySunC = mix(sySunC, vec3(0.36, 0.47, 0.66), syNight);
  sySkyC = mix(vec3(0.19, 0.22, 0.37), vec3(0.05, 0.12, 0.38), 0.8 * uDrone);
  sySkyC = mix(sySkyC, vec3(0.25, 0.17, 0.4), syDusk);
  sySkyC = mix(sySkyC, vec3(0.03, 0.045, 0.11), syNight);
  sySkyC *= mix(vec3(1), vec3(0.4, 0.55, 0.95), syClear);
  syBounce = vec3(0.27, 0.115, 0.055) * (0.75 + 1.2 * sat(uPad + 0.5 * uMic)) * dot(sySunC, vec3(0.15));
}
vec3 sySky(vec3 rd) {
  float y = max(rd.y, 0.0);
  vec3 lo = mix(vec3(1.75, 1.22, 0.74), vec3(1.7, 0.6, 0.26), syDusk), hi = mix(vec3(0.25, 0.66, 0.82), vec3(0.06, 0.25, 0.58), uDrone);
  hi = mix(hi, vec3(0.02, 0.1, 0.34), syClear); lo = mix(lo, vec3(0.3, 0.62, 0.95), syClear);
  hi = mix(hi, vec3(0.36, 0.26, 0.52), syDusk);
  lo = mix(lo, vec3(0.06, 0.085, 0.16), syNight); hi = mix(hi, vec3(0.01, 0.016, 0.05), syNight);
  lo = mix(lo, vec3(0.72, 0.76, 0.8), 0.6 * sySnow * (1.0 - syNight));
  float k = smoothstep(-0.05, 0.7, y);
  return mix(lo, hi, (1.0 - (1.0 - k) * (1.0 - k)) * (1.0 - 0.85 * syThick));
}
// Something a ray may meet: inside its outline where m is above 0, and grazed where m is about 0.
void syHit(float t, float m, int id, vec3 n, vec3 q) {
  if (t < 0.001 || (id < 10 && syOr.y + syRd.y * t < 0.0)) return;
  if (abs(m) < t * syPx * 1.2) syNear = min(syNear, t);
  if (m > 0.0 && t < syT) { syT = t; syId = id; syN = n; syQ = q; }
}
void syBox(vec3 ro, vec3 rd, vec3 at, vec3 half_) {
  vec3 m = 1.0 / (rd + vec3(1e-5)), n = m * (ro - at), k = abs(m) * half_, t1 = -n - k, t2 = -n + k;
  float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
  syHit(tN, (tF - tN) * 0.6, 9, -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz), vec3(0));
}
void syTrace(vec3 ro, vec3 rd) {
  syT = 200.0; syNear = 200.0; syId = 0; syN = vec3(0, 1, 0); syQ = vec3(0); syOr = ro; syRd = rd;
  vec3 q, w = ro - syC;
  // ---- the ground, and in b the bowl sunk in it
  float tg = -ro.y / rd.y, hole = 9.0;
  if (uVar > 0.5) {
    vec3 oc = ro - syBowl; float r0 = length((ro + rd * tg).xz - SYEYE.xz), b = dot(oc, rd), k = b * b - dot(oc, oc) + syBR * syBR, t = -b + sqrt(max(k, 0.0));
    bool under = ro.y < 0.0 && length(oc.xz) < SYRIM;
    q = ro + rd * t; hole = r0 - SYRIM;
    syHit(t, k < 0.0 ? -1.0 : under ? -q.y : min(-hole, -rd.y * 1e3), 10, (syBowl - q) / syBR, q - syBowl);
    if (!under) syHit(tg, min(hole, SYOUT - r0), 11, vec3(0, 1, 0), ro + rd * tg - SYEYE);
  }
  if (tg > 0.001 && tg < 120.0 && hole > SYOUT - SYRIM && tg < syT) { syT = tg; syId = 1; syN = vec3(0, 1, 0); syQ = ro + rd * tg; }
  // ---- the wall of the stair
  float o = dot(w, syM), d = dot(rd, syM), tp = -o / d;
  float ix = 1.0 / (abs(rd.x) < 1e-5 ? 1e-5 : rd.x), x1 = (-SYW - ro.x) * ix, x2 = (SYW - ro.x) * ix;
  float tn = min(x1, x2), tf = max(x1, x2), zb = (7.0 - ro.z) / (abs(rd.z) < 1e-5 ? 1e-5 : rd.z);
  if (rd.z > 0.0) tf = min(tf, zb); else tn = max(tn, zb);
  float tw = tn;
  if (d < 0.0) tw = max(tn, tp); else tf = min(tf, tp);
  vec3 P = ro + rd * tw;
  float m = (tf - tw) * 0.6;
  if (d < 0.0 && tp > tn) {
    // the parapets, and down between them the steps
    float ts = -(o + 0.1) / d, tx = ((rd.x > 0.0 ? SYI : -SYI) - ro.x) * ix;
    if (abs(abs(P.x) - SYI) < tw * syPx) syNear = min(syNear, tw);
    if (abs(P.x) > SYI) syHit(tw, m, 3, syM, P);
    else if (tx < ts) { P = ro + rd * tx; syHit(tx, m, 3, vec3(-sign(rd.x), 0.0, 0.0), P); }
    else {
      vec3 S = ro + rd * ts;
      float D = 0.15, f = fract(S.z / D), tanp = syE.y / syE.z;
      float tr = rd.z > 0.0 ? (1.0 - f) * D / rd.z : 1e3, tt = rd.y < 0.0 ? f * D * tanp / -rd.y : 1e3;
      syNear = min(syNear, ts);
      if (tt < tr) syHit(ts + tt, m, 4, vec3(0, 1, 0), S + rd * tt);
      else syHit(ts + tr, m, 4, vec3(0, 0, -1), S + rd * tr);
    }
  } else syHit(tw, m, 2, vec3(-sign(rd.x), 0.0, 0.0), P);
  // ---- one of the two rings: the one on our side, or where we see over the stair the one beyond
  float me = ro.x < 0.0 ? -1.0 : 1.0, cross_ = (me * SYW - ro.x) * ix;
  float side = cross_ > 0.0 && o + d * cross_ > 0.0 ? -me : me;
  vec3 ax = vec3(side, 0, 0), oo = vec3(side * w.x - SYW, o, dot(w, syE)), dd = vec3(side * rd.x, d, dot(rd, syE));
  float a = dot(dd.xy, dd.xy), b = dot(oo.xy, dd.xy), c = dot(oo.xy, oo.xy), t;
  float k = b * b - a * (c - SYO * SYO);
  t = (-b - sqrt(max(k, 0.0))) / a; q = oo + dd * t;
  syHit(t, k > 0.0 ? min(min(SYB - abs(q.z), q.x), min(-q.y, 2.0 * k)) : -1.0, 6, (ax * q.x + syM * q.y) / SYO, q);
  k = b * b - a * (c - SYR * SYR);
  t = (-b + sqrt(max(k, 0.0))) / a; q = oo + dd * t;
  syHit(t, k > 0.0 ? min(min(SYB - abs(q.z), q.x), -q.y) : -1.0, 5, -(ax * q.x + syM * q.y) / SYR, q * vec3(side, 1, 1));
  t = (-sign(dd.z) * SYB - oo.z) / dd.z; q = oo + dd * t; k = length(q.xy);
  syHit(t, min(min(k - SYR, SYO - k), min(q.x, -q.y)), 7, -sign(dd.z) * syE, q);
  t = -oo.y / dd.y; q = oo + dd * t;
  syHit(t, min(min(q.x - SYR, SYO - q.x), SYB - abs(q.z)), 7, syM * -sign(dd.y), q);
  vec3 pier = syC + ax * (SYW + SYR + 0.2) - syM * 0.2;
  pier.y = 0.5 * pier.y - 0.1 * syE.y;
  syBox(ro, rd, pier, vec3(0.2, pier.y, 0.34));
  // ---- far back a drum with slits and a long wall
  vec3 dc = ro - vec3(-5.6, 0, 9); a = dot(rd.xz, rd.xz); b = dot(dc.xz, rd.xz); k = b * b - a * (dot(dc.xz, dc.xz) - 2.6); t = (-b - sqrt(max(k, 0.0))) / a;
  q = dc + rd * t;
  syHit(t, k > 0.0 ? min(2.0 * k, 1.9 - q.y) : -1.0, 8, vec3(q.x, 0, q.z) / 1.6, vec3(atan(q.x, q.z), q.y, 0));
  syBox(ro, rd, vec3(-8, 0.36, 13), vec3(16, 0.36, 0.28));
}
// How much sun comes to a place in the yard.
float syVis(vec3 P, int id, float wide) {
  vec3 r = P - syC; float v = dot(r, syM), t = dot(r, syE), ch = cos(syH), sh = sin(syH), s = 1.0;
  float u = -P.x - SYW;
  // towards evening of the wall: its edge throws the knife of shade
  float a = u * sh - v * ch, k = u * ch + v * sh, pen = 0.003 + 0.005 * max(a, 0.0) + wide;
  k += 0.06 * uHits * (1.0 - uHits) * sin(t * 23.0 + 9.0 * uHits) * float(id == 5);
  syK = step(0.02, u) * step(0.0, a) * exp(-40.0 * k * k);
  float west = 1.0 - syIn(k, pen) * step(0.0, a) * syIn(P.z + u / sh * syS.z - 6.95, 0.05);
  if (id != 5 && u * u + v * v > SYO * SYO * 0.999 && a > 0.0) west *= 1.0 - syIn(k - SYO * ch, pen) * syIn(abs(t) - SYB, pen);
  vec2 pc = vec2(-SYW - SYR - 0.2, 0.04 - 0.2 * syM.z) - P.xz;
  float al = dot(pc, syS.xz) / max(dot(syS.xz, syS.xz), 1e-4);
  if (id == 1) west *= 1.0 - syIn(length(pc - syS.xz * al) - 0.28, wide + 0.02) * step(0.0, al) * syIn(al * syS.y - syC.y, 0.05);
  // the other side: the ring there shades itself and what is within it
  float u2 = P.x - SYW, k2 = u2 * ch - v * sh;
  float east = 1.0 - step(u2 * u2 + v * v, SYR * SYR * 1.01) * step(k2 * k2, SYR * SYR) * syIn(sqrt(max(SYR * SYR - k2 * k2, 0.0)) * ch - k2 * sh, 0.03 + wide) * syIn(abs(t) - SYB, wide + 0.01);
  s = u > -0.001 ? west : east;
  bool stair = id == 4 || (id == 3 && abs(P.x) < SYI + 0.001);
  if (id == 3) s = 1.0;
  if (stair) s = smoothstep(-0.01 - wide, 0.01 + wide, SYI + v * sh / ch - P.x);
  if (uVar > 0.5) {
    // the bowl's lip shades half of it, and the wire and the ring across it throw a thread and an ellipse
    vec3 g = P - SYEYE; vec2 E = g.xz - syS.xz * g.y / max(syS.y, 0.05);
    float dn = dot(syRingN, syS), hoop = length(g - syS * dot(g, syRingN) / (abs(dn) < 0.05 ? 0.05 : dn)), w = 0.007 + wide;
    float lip = smoothstep(-0.012 - wide, 0.012 + wide, SYRIM - length(E)) * (1.0 - syIn(abs(hoop - 0.17) - 0.04, w));
    lip *= 1.0 - 0.8 * (1.0 - smoothstep(0.004, 0.011 + w, abs(dot(E, vec2(-0.42, 0.907))))) * min(1.0, 0.012 / w + 0.3) * step(0.17, hoop);
    if (id == 10) s = lip;
  }
  return s;
}
float syTick(float x, float every, float w, float px) {
  float d = abs(fract(x / every + 0.5) - 0.5) * every;
  return syIn(d - w, px) * min(1.0, 2.0 * w / px);
}
vec3 syInk(vec3 c) { float l = dot(c, vec3(0.3, 0.59, 0.11)); return max(mix(vec3(l), c, 1.3), 0.02) * 0.62; }
// The marble of a scale, along it by the hour and across from -1 to 1: marks, sixteen divisions, the piece inlaid.
vec3 syScale(vec3 c, float al, float tau, float ap, float tp, float tall, bool own, out vec3 glow) {
  float at = abs(tau);
  vec3 slate = mix(vec3(0.1, 0.12, 0.17), vec3(0.04), syDark);
  glow = vec3(0);
  c *= 1.0 - 0.25 * syTick(al, PI / 32.0, 0.002, ap * 1.2) * step(0.16, at);
  float minor = syTick(al, PI / 192.0, 0.0024, ap) * step(0.82, at) + syTick(al, PI / 64.0, 0.004, ap) * step(0.7, at);
  float rule = syIn(min(abs(at - 0.68), abs(at - 0.15)) - 0.012, tp) * min(1.0, 0.03 / tp);
  c = mix(c, slate, sat(max(minor, rule)) * 0.85 * step(at, 1.0));
  float g = clamp(al / (0.5 * PI) * 16.0, 0.0, 15.99); int gi = int(g);
  float b = uBands[gi], in_ = syIn(at - 0.14, tp) * step(0.0, al) * step(al, 0.5 * PI);
  vec3 bc = syInk(kindColour(float(gi) / 4.0));
  c = mix(c, mix(mix(c, slate * 1.6, mod(float(gi), 2.0) * 0.75), bc, sat(b * (0.5 + uEnergy))), in_);
  glow += bc * b * b * 0.5 * in_ * uEnergy;
  // the first half of the round lies in the near half of the marble, going out; the second in the far half, coming back
  float cell = SYSW / 7.0, ci = floor((al - syH0 + SYSW) / cell), ac = syH0 - SYSW + (ci + 0.5) * cell;
  float y = (at - 0.16) / 0.1275, ri = floor(y), lp = acos(clamp((syH0 - ac) / SYSW, -1.0, 1.0)) / TAU;
  vec4 m = piece(vec2(tau > 0.0 ? 1.0 - lp : lp, 0.2 + 0.2 * ri));
  vec2 f = vec2(al - ac, (fract(y) - 0.5) * 0.1275 * tall);
  float amp = sat(m.a * 1.4), r = cell * (0.11 + 0.37 * sqrt(amp));
  float on = syIn(abs(f.x) + abs(f.y) - r * 1.15, ap) * float(own && ci >= 0.0 && ci < 14.0 && ri >= 0.0 && ri < 4.0);
  vec3 ink = m.a > 0.004 ? syInk(m.rgb / m.a) : slate;
  c = mix(c, mix(slate * 1.5, ink, sat(amp * 4.0)), on * (0.5 + 0.5 * sat(amp * 3.0)));
  glow += ink * on * amp * syBell((ac - syH) / 0.06) * (1.2 + 2.2 * uEnergy);
  return c;
}
vec3 syShade(vec3 ro, vec3 rd) {
  vec3 P = ro + rd * syT, n = syN, r = P - syC, glow = vec3(0);
  float px = syT * syPx, face = max(dot(n, -rd), 0.2), ao = 1.0, low = 1.0, wide = 0.6 * px / face;
  float v = dot(r, syM), t = dot(r, syE), u = abs(P.x) - SYW;
  bool b = uVar > 0.5, ground = syId == 1, bowl = syId == 10;
  float vis = syVis(P, syId, wide);
  // where on its surface the place is, for the wear
  vec2 q = ground || syId == 3 || syId == 4 || syId == 11 ? P.xz : syId == 2 ? P.zy : P.xy + P.zy * vec2(1, 0.3);
  float al = atan(abs(syQ.x), max(-syQ.y, 1e-4)), tau = syQ.z / SYB;
  if (syId == 5) q = vec2(al * SYR, syQ.z);
  if (syId == 6 || syId == 7) q = vec2(al * length(syQ.xy), syId == 6 ? syQ.z : length(syQ.xy));
  if (bowl) q = syQ.xz;
  float worn = 0.35 + 0.65 * uTexture;
  float n1 = noise(q * 1.3 + 3.0), n2 = noise(q * 5.1 + 9.0), n3 = noise(q * 31.0), n4 = noise(vec2(q.x * 9.0, q.y * 0.6 + 7.0));
  // the three stuffs of the yard
  vec3 plaster = mix(vec3(0.7, 0.31, 0.175), vec3(0.83, 0.47, 0.27), n1);
  plaster = mix(plaster, vec3(0.88, 0.85, 0.8), syLime); plaster = mix(plaster, vec3(0.115, 0.12, 0.135), syDark);
  float peel = smoothstep(0.0, 0.05, n1 * 0.55 + n2 * 0.45 - (0.76 - 0.14 * worn));
  plaster *= mix(vec3(1), mix(vec3(0.82, 0.72, 0.66), vec3(1.4), syDark), peel * worn);
  plaster *= 1.0 - (0.35 + 0.3 * worn) * smoothstep(0.45, 0.9, n4) * exp(-max(-v, 0.0) * 0.9) * float(syId == 2);
  vec3 marble = vec3(0.92, 0.89, 0.83) * (0.92 + 0.1 * n1) * (0.97 + 0.05 * n2);
  marble = mix(marble, vec3(0.8, 0.55, 0.22) * (0.8 + 0.3 * n1), syDark);
  vec3 alb = plaster, slate = vec3(0.13, 0.15, 0.2);
  if (ground) {
    alb = mix(vec3(0.66, 0.42, 0.26), vec3(0.78, 0.55, 0.37), n1);
    alb = mix(alb, vec3(0.8, 0.77, 0.72), syLime * 0.8); alb = mix(alb, vec3(0.17, 0.165, 0.17), syDark);
    // flagstones, each a little its own tone
    vec2 g = rot(0.12) * q / vec2(0.82, 0.55); float row = floor(g.y); g.x += 0.37 * row;
    vec2 j = (0.5 - abs(fract(g) - 0.5)) * vec2(0.82, 0.55), w = vec2(px, px / face) + 0.004, sm = (1.0 - smoothstep(vec2(0), w + 0.008, j)) * min(vec2(1), 0.014 / w);
    alb *= (0.86 + 0.2 * hash21(vec2(floor(g.x), row))) * (0.95 + 0.1 * n3) * (0.9 + 0.2 * n2) * (1.0 - 0.45 * max(sm.x, sm.y));
    ao = 0.45 + 0.55 * smoothstep(0.0, 0.9, P.z > -syC.y * syE.z / syE.y - 0.2 && P.z < 7.0 ? u : 1.0);
  }
  if (syId == 2) {
    low = 0.35 + 1.2 * exp(-P.y * 0.7);
    ao = 0.72 + 0.28 * smoothstep(0.0, 0.5, P.y);
    // the lit marble throws its light back on the wall
    vec3 to = syC + vec3(-SYW - SYR * 0.93, 0, 0) - SYR * 0.36 * syM - P;
    glow = alb * sySunC * vec3(0.2, 0.17, 0.14) / (1.0 + 0.5 * dot(to, to)) * step(P.x, 0.0) * (0.6 + 0.8 * uPad);
    alb = mix(alb, marble * 0.95, syIn(-v - 0.07, px));
    // a door
    vec2 dq = vec2(P.z + 0.35, P.y); float dd = dq.y > 0.36 ? length(dq - vec2(0, 0.36)) - 0.13 : abs(dq.x) - 0.13;
    float in_ = syIn(dd, px), lamp = exp(-14.0 * dot(dq, dq - vec2(0, 0.4)) - 0.56);
    alb = mix(alb, alb * 1.25, syIn(dd - 0.035, px)) * (1.0 - 0.85 * in_);
    glow = glow * (1.0 - 0.85 * in_) + in_ * lamp * vec3(1.6, 0.75, 0.25) * (0.06 + 0.9 * uMic + 0.8 * syNight);
  }
  if (syId == 3 && abs(P.x) > SYI + 0.02) {
    alb = mix(marble, slate, 0.8 * syTick(t, 0.06, 0.006, px) * step(SYI + 0.07, abs(P.x)));
    // what is played as a phrase climbs the stair's edge as a warm light
    float go = fract(t * 0.16 - uTravel * 0.11);
    glow = syInk(uKind[3]) * uPhrase * syBell((go - 0.5) * 7.0) * (0.5 + uEnergy);
  }
  if (syId == 4) ao = 0.8;
  // the two scales share their marks: along the ring of a, along the sun's path in the bowl of b
  float ap = px / SYR / sqrt(face), tp = px / SYB / face, dec = 0.0;
  if (bowl) {
    vec3 d = normalize(P - SYEYE);
    dec = asin(clamp(dot(d, syE), -1.0, 1.0)); al = atan(-d.x, -dot(d, syM)); tau = dec / 0.46; ap = px / syBR / sqrt(face) / max(cos(dec), 0.3); tp = ap * 2.2;
  }
  vec3 light; vec3 c = syScale(marble, al, tau, ap, tp, bowl ? 0.46 : SYB / SYR, bowl || syQ.x < 0.0, light);
  if (bowl) syK = syBell((al - syH) / 0.11) * syBell(1.73 * dec);
  if (syId == 5) {
    alb = c; low = 0.9; ao = 0.75 + 0.25 * smoothstep(0.0, 0.7, u);
    glow = light * mix(0.6, 1.0, vis) + alb * sySunC * vec3(0.03, 0.024, 0.018) * (0.4 + 0.7 * uPad) * (1.0 - vis);
  }
  if (bowl) {
    // the net of slate over the marble, and its checks
    float hour = syTick(al, PI / 24.0, 0.006, ap), decl = syTick(dec, PI / 24.0, 0.006, ap), many = syTick(al, PI / 96.0, 0.003, ap) * 0.5;
    float net = max(max(hour, decl), many), fade = 1.0 - smoothstep(1.25, 1.5, abs(dec));
    float chk = sin(al * 24.0) * sin(dec * 24.0); chk = smoothstep(-0.5, 0.5, chk / max(24.0 * ap, 0.02));
    alb = abs(tau) < 1.0 ? c : mix(mix(marble, slate, chk * max(uOwn[5], 0.0) * fade), slate, net * 0.75 * fade);
    ao = 0.5 + 0.5 * smoothstep(-SYRIM, 0.0, syQ.y); low = 1.1;
    float rest = sat(0.5 + 0.5 * dot(n, vec3(-syS.x, 0, -syS.z)));
    glow = light * step(abs(tau), 1.0) * mix(0.6, 1.0, vis) + alb * sySunC * vec3(0.085, 0.065, 0.045) * (1.0 - rest) * (0.6 + 0.8 * uPad) * (1.0 - vis);
  }
  if (syId == 6 || syId == 7) {
    alb = syId == 7 ? mix(plaster, marble, syIn(length(syQ.xy) - SYR - 0.06, px)) : plaster;
    low = 1.2; ao = 0.6 + 0.4 * smoothstep(0.0, 0.6, P.y);
  }
  if (syId == 8) {
    float sl = (0.5 - abs(fract(syQ.x * 2.2) - 0.5)) * 0.65;
    alb *= 1.0 - 0.7 * syIn(max(sl - 0.12, abs(syQ.y - 1.0) - 0.55), px);
  }
  if (syId == 11) {
    float a = atan(syQ.x, syQ.z) / TAU * 48.0, rr = length(syQ.xz), g = clamp(floor(a / 3.0 + 8.0), 0.0, 15.0);
    alb = mix(marble, slate, 0.8 * syTick(a, 0.25, 0.012, px * 5.0) * step(SYOUT - 0.05, rr));
    alb = mix(alb, syInk(kindColour(g / 4.0)), sat(uBands[int(g)] * (0.4 + uEnergy)) * syIn(abs(rr - 1.565) - 0.045, px) * syIn(abs(fract(a / 3.0) - 0.5) - 0.47, 0.01));
    alb *= 1.0 - 0.4 * syTick(a, 3.0, 0.03, px * 5.0);
  }
  // snow
  float lie = sat(sySnow * 1.6 - 0.6 * n1) * smoothstep(0.35, 0.8, n.y - 0.2 * n2) * (syId == 5 || bowl ? 0.35 : 1.0);
  alb = mix(alb, vec3(0.86, 0.89, 0.94) * (0.88 + 0.17 * n1), lie);
  vec3 lit = alb * (sySunC * sat(dot(n, syS)) * vis * sySun + sySkyC * ao * (0.62 + 0.38 * n.y) + syBounce * ao * (0.55 - 0.45 * n.y) * low) + glow;
  if (!b || bowl) lit = mix(lit, alb * vec3(2.6, 1.3, 0.3), 0.8 * syK * uHits);
  // the sky, and haze before it
  vec3 air = sySky(syId == 0 ? rd : vec3(rd.x, 0.02, rd.z));
  float az = atan(rd.x, max(rd.z, 0.01)), tree = 0.014 + 0.016 * sin(az * 9.0 + 1.0) * sin(az * 23.0);
  vec3 woods = mix(air, vec3(0.42, 0.5, 0.44) * dot(air, vec3(0.33)), 0.5 - 0.2 * uSpace);
  if (syId == 0) return mix(air, woods, syIn(rd.y - tree, 0.002));
  float far = max(syT - mix(7.0, 2.5, syThick), 0.0) * (0.015 + 0.035 * uSpace + 0.2 * syThick * syThick) * (1.0 - 0.8 * syClear);
  return mix(lit, air, (0.75 + 0.2 * uSpace) * (1.0 - exp(-far)));
}
vec3 render(vec2 p) {
  syWorld();
  bool b = uVar > 0.5;
  float tall = 1.0 - smoothstep(0.6, 1.3, uRes.x / uRes.y), lo = max(-uOwn[4], 0.0), hi = max(uOwn[4], 0.0), off = 1.0 + 0.55 * tall;
  // the one cloud of a cue goes over from the left
  sySun = 1.0 - 0.9 * (1.0 - smoothstep(0.35, 0.95, abs(p.x - mix(1.6, -1.4, uCue) + 0.15 * sin(p.y * 5.0)))) * smoothstep(0.0, 0.2, uCue);
  float drift = 0.1 * sin(uTime * 0.021), fl = b ? 1.0 : 1.12;
  vec3 ro = mix(mix(vec3(-1.7, 1.6, -4.6), vec3(-2, 0.4, -3.9), lo), vec3(-4.6, 5.2, -3.7), hi), ta = mix(mix(vec3(-0.95, 1.42, 0), vec3(-1, 1.7, 0.6), lo), vec3(-1, 0.6, 0.5), hi);
  if (b) {
    ro = mix(mix(vec3(2.2, 1.16, -7.5), vec3(2.2, 0.75, -8), lo), vec3(2.5, 3.5, -7), hi);
    ta = mix(mix(vec3(1.6, 0.12, -5.2), vec3(1.6, -0.25, -5), lo), vec3(1.6, -0.4, -5.4), hi);
  }
  ro.x += drift;
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
  if (b) rt = -rt; // turned left for right, so that the sun stands on our left
  syPx = off / (uRes.y * fl);
  vec2 e = vec2(0.22, 0.31) * off / uRes.y, s = p * off;
  vec3 from = ro, rd = normalize(fw * fl + rt * (s.x + e.x) + up * (s.y + e.y)), col = vec3(0);
  float share = 0.0;
  // one ray is enough but at an edge, or where water mirrors
  for (int i = 0; i < 2; i++) {
    syTrace(from, rd);
    vec3 c = screenOf(1.1 * syShade(from, rd));
    col = i == 0 ? c : mix(col, c, share);
    if (i == 1) break;
    float tw = syId == 10 ? (syPool - from.y) / rd.y : syT;
    vec3 P = from + rd * tw;
    float film = 0.0;
    if (syId == 1) film = smoothstep(0.0, 0.12, syWet * 1.25 - noise(P.xz * 0.8 + 2.0) * 0.9 - 0.1);
    if (syId == 10 && tw < syT) film = smoothstep(0.0, 0.1, syWet);
    if (film > 0.0 && syWet > 0.0) {
      vec2 rip = vec2(noise(P.xz * 3.0 + uTime * 0.11), noise(P.xz * 3.0 - uTime * 0.09 + 8.0)) - 0.5;
      float f = 1.0 - sat(-rd.y); f = 0.3 + 0.7 * f * f * f;
      col *= mix(vec3(1), vec3(0.7, 0.8, 0.82), film); share = f * film;
      from = P + vec3(0, 0.002, 0); rd = normalize(vec3(rd.x, -rd.y, rd.z) + vec3(rip.x, 0, rip.y) * 0.012);
    } else if (syNear < syT * 1.01) { share = 0.5; rd = normalize(fw * fl + rt * (s.x - e.x) + up * (s.y - e.y)); }
    else break;
  }
  rd = normalize(fw * fl + rt * s.x + up * s.y);
  vec3 spot = syC + vec3(-SYW, 0, 0) + SYR * (-cos(syH) * syM - sin(syH) * vec3(1, 0, 0));
  if (b) {
    // the wire over the bowl, and its ring
    vec3 W = SYEYE - ro, wd = vec3(0.907, 0, 0.42), n = cross(rd, wd);
    float far = dot(W, rd), w = far * syPx, d = abs(dot(W, n)) / max(length(n), 1e-3), at = dot(cross(W, rd), n) / max(dot(n, n), 1e-4);
    float dn = dot(rd, syRingN); vec3 P = rd * dot(W, syRingN) / (abs(dn) < 0.04 ? 0.04 : dn) - W;
    col = mix(col, vec3(0.09, 0.07, 0.07), syIn(d - 0.006, w) * step(abs(at), SYRIM) * 0.9 * step(0.17, length(P)));
    col = mix(col, (0.35 + 0.65 * sat(0.5 + 6.0 * P.y)) * vec3(0.72, 0.46, 0.18) * (0.35 + 0.65 * sySun), syIn(abs(length(P) - 0.17) - 0.02, w));
    spot = syBowl - syS * syBR;
  }
  // a hit drops a leaf by the edge of the shade; the keys are green birds
  vec3 D = spot - ro; float dz = max(dot(D, fw), 0.1), c = uHits;
  vec2 lf = rot(5.0 * c) * (s - fl * vec2(dot(D, rt), dot(D, up)) / dz - vec2(0.03 * sin(c * 7.0), 0.02 + 0.2 * c)) * dz * 0.15;
  col = mix(col, vec3(0.3, 0.36, 0.1), syIn(length(vec2(lf.x, abs(lf.y) + 0.014)) - 0.02, 0.002) * sat(c * 3.0));
  for (int i = 0; i < 3; i++) {
    float f = float(i), go = fract(uTime * 0.03 + f * 0.09);
    vec2 g = p - vec2(1.1 - 2.2 * go, 0.3 - 0.07 * f + 0.05 * go + 0.02 * sin(uTime * 0.5 + f * 2.0));
    float x = abs(g.x) / 0.055, wing = max(abs(g.y - 0.05 * x * (0.5 + 0.3 * sin(uTime * 3.0 + f * 2.0) - 0.4 * x)) - 0.005 * sat(1.0 - x), g.x * g.x - 0.003);
    wing = min(wing, length(g * vec2(0.45, 1)) - 0.007);
    col = mix(col, vec3(0.16, 0.52, 0.2), syIn(wing, 0.0015) * sat(uKeys * 1.5) * sat(go * 10.0) * sat(10.0 - 10.0 * go));
  }
  return col;
}
