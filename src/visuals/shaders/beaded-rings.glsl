// name: Beaded rings
// a: In the weave
// b: Coming through
// what: Inside a weave of beaded rings, each threaded through every other: huge ivory, rust and slate beads overhead, small ones far back in grey haze, and low down an opening where a warm glow comes in and one straight string crosses; or, on pale bone, a bunch of tiny rings at the left opens, sweeps past the frame and comes back.
// follows: Each kind of sound beads four rings: the louder, the fatter and the more dyed. The piece tints each bead by its place, bands swell the small beads, travel carries all along, and the loop turns the weave through a fourth direction. A hit sends a lit bead round four rings, a cue opens the weave and brightens it, keys and voice fill the straight string.
// own: 0 night with an amber glow at -1 (terracotta ground outside), snow light at 1 (grey-blue ground outside); 1 the weave turned back the fourth way, rounder and closed, at -1, all rings gathered into one narrow coil at 1; 2 jet, coral and bone at -1, glazed sea green at 1; 3 seed pearls far apart on bare thread at -1, plump even beads that touch at 1; 4 from further off through a long lens at -1, close and wide at 1; 5 thick mist at -1, clear air at 1
// Everything lies on the round space around us, laid out flat: there every ring is a great circle and every bead a ball, and they
// stay a circle and a ball here. Five families of four rings lie about one common middle ring, on three nested tubes.
// A sixth string is the one ring that passes through infinity: a straight line.
float brCh[6], brSh[6], brBd[6], brBig[6], brSmall[6], brLv[6]; // of each family: its place, beads to a ring, their sizes, how loud
vec4 brR, brSinL, brCosL; vec2 brR2;
vec2 brG1, brG2;       // the turn through the fourth direction, and the turn about the middle ring
mat3 brM;              // both, as the rings see them
vec3 brLine;           // the straight string's place among the rings
vec4 brLineF;
float brPx, brCreep, brThr;
vec3 brG, brL;         // towards the glow, towards the light
int brI; vec3 brN;

vec2 brMul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec4 brTo(vec4 v) { v = vec4(brG1.x * v.xy - brG1.y * v.zw, brG1.y * v.xy + brG1.x * v.zw); v.zw = brMul(v.zw, brG2); return v; }
vec4 brBack(vec4 v) { v.zw = brMul(v.zw, vec2(brG2.x, -brG2.y)); return vec4(brG1.x * v.xy + brG1.y * v.zw, -brG1.y * v.xy + brG1.x * v.zw); }
// How far the nearest string is, on the round space.
float brMap(vec3 x, float k) {
  vec4 v = vec4(k * x, 1.0 - k);
  vec4 a = v * v;
  brN = brM * vec3(2.0 * (v.x * v.z + v.y * v.w), 2.0 * (v.x * v.w - v.y * v.z), a.x + a.y - a.z - a.w);
  vec2 q = abs(brN.xy), o = vec2(max(q.x, q.y), (q.x + q.y) * 0.70711);
  vec4 c = max(0.5 - 0.5 * (o.xxyx * brSinL + brN.z * brCosL), 0.0);
  vec2 c2 = max(vec2(0.5 - 0.5 * (o.y * brSinL.w + brN.z * brCosL.w), 0.5 - 0.5 * dot(brN, brLine)), 0.0);
  c = sqrt(c) * (1.0 + 0.1667 * c) - brR;
  c2 = sqrt(c2) * (1.0 + 0.1667 * c2) - brR2;
  float s = c.x; brI = 0;
  if (c.y < s) { s = c.y; brI = 1; }
  if (c.z < s) { s = c.z; brI = 2; }
  if (c.w < s) { s = c.w; brI = 3; }
  if (c2.x < s) { s = c2.x; brI = 4; }
  if (c2.y < s) { s = c2.y; brI = 5; }
  return s;
}
float brOpen(vec3 x) { float q = 1.0 + dot(x, x); return brMap(x, 2.0 / q); }

// What the ray meets inside a string: a bead (1 large, 2 small) or the thread (3), or nothing.
struct BrHit { vec4 ball; vec3 ax; float t, cov, j, r; int f, what; };
BrHit brTest(vec3 ro, vec3 rd, float t, float k) {
  BrHit h; h.f = brI; h.what = 0; h.r = 0.0;
  vec4 v = brTo(vec4(k * (ro + rd * t), 1.0 - k)), fb = brLineF;
  if (brI < 5) {
    vec2 a = abs(brN.xy), sg = vec2(brN.x < 0.0 ? -1.0 : 1.0, brN.y < 0.0 ? -1.0 : 1.0);
    vec2 e = brI == 2 || brI == 4 ? sg * 0.70711 : a.x > a.y ? vec2(sg.x, 0.0) : vec2(0.0, sg.y);
    h.r = e.x * 2.0 + e.y;
    fb = vec4(brCh[brI], 0.0, brSh[brI] * e);
  }
  vec2 w = vec2(dot(v, fb), dot(v, vec4(-fb.y, fb.x, -fb.w, fb.z)));
  float len = PI / brBd[brI], th = (atan(w.y, w.x) - brCreep) / len, j = 2.0 * floor(th * 0.5 + 0.5), big = brBig[brI], small = brSmall[brI], th0 = th;
  bool odd = abs(th - j) > big / (big + small);
  if (odd) j += th > j ? 1.0 : -1.0;
  float r = odd ? small : big; th = j * len + brCreep;
  vec2 e = vec2(cos(th), sin(th));
  vec4 c = vec4(brMul(fb.xy, e), brMul(fb.zw, e)), b = brBack(c);
  vec4 pa = brBack(c * cos(r) + vec4(-c.y, c.x, -c.w, c.z) * sin(r));
  h.ball = vec4(b.xyz, sin(r)) / max(cos(r) - b.w, 0.02);
  vec3 oc = h.ball.xyz - ro;
  h.ax = normalize(pa.xyz / max(1.0 - pa.w, 1e-3) - h.ball.xyz + 1e-5);
  float m = dot(oc, rd), d2 = dot(oc, oc) - m * m, px = brPx * t, rr = h.ball.w;
  h.cov = 1.0 - smoothstep(rr - px * 0.9, rr + px * 0.6, sqrt(max(d2, 0.0))); h.j = mod(j, 2.0 * brBd[brI]);
  float hh = sqrt(max(rr * rr - d2, 0.0));
  h.t = m - hh;
  if (h.cov > 0.04 && h.t > 0.35) { h.what = odd ? 2 : 1; return h; }
  // between two beads: the thread
  if (abs(th0 - j) * len > 0.85 * r) {
    vec2 u = w / max(length(w), 1e-4);
    c = vec4(brMul(fb.xy, u), brMul(fb.zw, u)); b = brBack(c); pa = brBack(c + 0.02 * vec4(-c.y, c.x, -c.w, c.z));
    oc = b.xyz / max(1.0 - b.w, 1e-3) - ro;
    h.ax = normalize(pa.xyz / max(length(pa) - pa.w, 1e-3) - oc - ro + 1e-5);
    vec3 cr = cross(rd, h.ax), dq = rd - h.ax * dot(rd, h.ax);
    float wide = max(brThr / k, 0.7 * px);
    h.cov = 1.0 - smoothstep(wide - px * 0.6, wide + px * 0.6, abs(dot(oc, cr)) / max(length(cr), 1e-3));
    h.t = dot(oc, dq) / max(dot(dq, dq), 1e-3);
    float off = length(ro + rd * h.t - h.ball.xyz);
    if (h.cov > 0.04 && h.t > 0.35 && off > 0.96 * rr && off < rr + 1.2 * max(len - big - small, 0.0) * r / ((big + small) * k)) h.what = 3;
  }
  return h;
}
vec3 brA0, brA1, brAG; float brFog;   // the air low and high, the glow in it, how thick it is
vec3 brAir(vec3 rd) {
  float m = max(dot(rd, brG), 0.0), m2 = m * m; m2 *= m2;
  return mix(brA0, brA1, smoothstep(-0.7, 0.7, rd.y)) + brAG * (0.16 * m2 + 0.84 * m2 * m2 * m2);
}
vec3 brPaint(vec3 k) { k *= k; float l = dot(k, vec3(0.3, 0.59, 0.11)); return clamp(mix(vec3(l), k, 0.8), 0.0, 1.0) * vec3(1.0, 0.86, 0.72) * 0.24 / max(0.24, l + 0.05); }
vec3 brKey, brSky;
vec3 brShade(BrHit h, vec3 ro, vec3 rd) {
  vec3 x = ro + rd * h.t, n = normalize(h.what == 3 ? h.ax * dot(rd, h.ax) - rd : x - h.ball.xyz);
  bool thread = h.what == 3, small = h.what == 2;
  float pole = thread ? 0.0 : abs(dot(n, h.ax)), rnd = hash21(vec2(h.j + 3.0, h.r * 3.0 + float(h.f) + 11.0));
  int kd = h.f == 0 ? 0 : h.f == 1 ? 1 : h.f == 3 ? 2 : h.f == 2 ? 3 : 4;
  float lv = brLv[h.f];
  // ivory, rust and slate; jet, coral and bone; or sea glass
  vec3 ivory = vec3(0.68, 0.57, 0.42), rust = vec3(0.36, 0.075, 0.025), slate = vec3(0.06, 0.085, 0.11);
  float j = max(-uOwn[2], 0.0), g = max(uOwn[2], 0.0);
  ivory = mix(mix(ivory, vec3(0.035, 0.032, 0.036), j), vec3(0.20, 0.56, 0.50), g);
  rust = mix(mix(rust, vec3(0.62, 0.15, 0.09), j), vec3(0.75, 0.74, 0.66), g);
  slate = mix(mix(slate, vec3(0.60, 0.52, 0.40), j), vec3(0.02, 0.15, 0.30), g);
  vec3 a = h.f == 1 ? slate : h.f == 2 && rnd > 0.75 ? rust : ivory;
  if (small) a = h.f == 3 || h.f == 0 ? slate : rust;
  if (h.f == 4) a = small ? ivory : mix(rust, slate, step(0.5, rnd));
  vec4 here = piece(vec2(h.j / (2.0 * brBd[h.f]), (float(h.f) + 0.6) / 6.0));
  a = mix(a, brPaint(uKind[kd]), (small ? 0.42 : 0.2) * lv);
  a = mix(a, brPaint(here.rgb / max(here.a, 0.05)), 0.45 * here.a);
  a *= 0.84 + 0.3 * fract(rnd * 7.0);
  if (h.f == 5 && uVar > 0.5) a = mix(a, small ? slate : rust, 0.9 * sat(1.2 * uKeys + uMic));
  if (thread) a = vec3(0.10, 0.085, 0.07);
  float sc = 0.5 * (1.0 + dot(x, x));
  // a line cut round the middle of some; the drilled ends lie dark
  float cut = small ? 0.0 : (1.0 - smoothstep(0.045, 0.075, pole)) * step(0.72, fract(rnd * 3.0));
  a *= 1.0 - 0.45 * cut;
  float far = smoothstep(2.5, 7.0, sc);
  float ao = (1.0 - 0.75 * smoothstep(0.6, 1.0, pole)) * mix(sat(0.25 + brOpen(x + n * 0.26 * sc) / 0.24), 0.8, far);
  float sh = sat(0.12 + brOpen(x + (brL * 0.75 + n * 0.25) * 0.34 * sc) / 0.17);
  sh = mix(sh, 0.8, far);
  float nl = dot(n, brL), wrap = mix(0.4, 0.12, uTone);
  vec3 c = a * (brKey * smoothstep(-wrap, 1.0, nl) * sh * (0.4 + 0.6 * ao) + brSky * (0.55 + 0.45 * dot(n, vec3(0.0, 0.0, 1.0))) * ao);
  // the glow comes round the edges
  float edge = 1.0 + dot(n, rd); edge *= edge;
  c += a * brAG * edge * max(dot(rd, brG), 0.0) * 0.9 * ao;
  vec3 hv = normalize(brL - rd);
  float sp = max(dot(n, hv), 0.0); sp *= sp; sp *= sp; sp *= sp;
  c += brKey * sh * (0.02 * sp + (0.5 * g + 0.15 * j) * sp * sp * sp * sp) * (thread ? 0.0 : 1.0);
  // a hit sends a lit bead round each of four rings; the keys light the straight string
  if (h.f == 1) {
    float d = fract(h.j / (2.0 * brBd[1]) + brCreep / TAU - 0.5 * (1.0 - uHits) + 0.02) - 0.5;
    c += mix(uKind[4], vec3(1.0, 0.8, 0.5), 0.6) * uHits * exp(-d * d * 600.0) * 1.7 * max(0.15 - 0.85 * dot(n, rd), 0.0);
  }
  if (h.f == 5) c += a * (mix(uKeys * 0.8 + uMic * 0.5, 0.0, uVar) + uCue * 0.6) * vec3(1.2, 1.0, 0.75);
  return c;
}
vec3 render(vec2 p) {
  bool away = uVar > 0.5;
  float wide = uRes.x / uRes.y, zoom = clamp(1.25 / wide, 1.0, 1.7);
  float lv[6] = float[6](uDrone, uPad, uPhrase, uTexture, 0.5 * uHits + 0.5 * uHigh, 0.6 * uKeys + 0.6 * uMic + 0.4 * uLevel);
  float bd[6] = float[6](30.0, 34.0, 34.0, 30.0, 30.0, 36.0), lat[6] = float[6](0.5, 1.2, 1.2, 2.0, 2.0, 0.0);
  if (away) lat = float[6](0.35, 0.75, 0.75, 1.2, 1.2, 0.0);
  float cue = 4.0 * uCue * (1.0 - uCue), R[6];
  lat[0] -= 0.10 * cue; lat[3] += 0.12 * cue; lat[4] += 0.12 * cue;
  for (int i = 0; i < 5; i++) lat[i] *= 1.0 - 0.45 * max(uOwn[1], 0.0);
  float tiny = max(-uOwn[3], 0.0), even = max(uOwn[3], 0.0);
  for (int i = 0; i < 6; i++) {
    float h = PI / bd[i], b = uBands[i * 3], l = sat(lv[i]);
    l = l * (0.6 + 0.8 * uEnergy) / (0.4 + 0.6 * l); l = min(l, 1.0); brLv[i] = l;
    float big = 0.45 + 0.2 * l, small = 0.25 + 0.04 * l + 0.1 * min(b, 1.0);
    if (away && i == 5) { big += 0.15 * l; small += 0.12 * l; }
    big = mix(mix(big, 0.23 + 0.12 * l, tiny), 0.51, even); small = mix(mix(small, 0.10 + 0.06 * b, tiny), 0.36 + 0.15 * l, even);
    brBd[i] = bd[i]; brBig[i] = h * big; brSmall[i] = h * small; R[i] = max(brBig[i], brSmall[i]) + 0.002;
    brCh[i] = cos(0.5 * lat[i]); brSh[i] = sin(0.5 * lat[i]);
  }
  brR = vec4(R[0], R[1], R[2], R[3]); brR2 = vec2(R[4], R[5]);
  vec4 l4 = vec4(lat[0], lat[1], lat[2], lat[3]); brSinL = sin(l4); brCosL = cos(l4);
  brThr = 0.0045; brCreep = mod(0.006 * uTravel + 0.004 * uTime, TAU);
  float spin = away ? 0.3 + mod(0.012 * uTime, TAU) : 0.3 + 0.1 * sin(0.031 * uTime);
  float psi = (away ? 0.62 : 0.29) + 0.045 * sin(TAU * uLoop) + 0.03 * sin(0.05 * uTime) + 0.3 * min(uOwn[1], 0.0);
  brG1 = vec2(cos(psi), sin(psi)); brG2 = vec2(cos(spin), sin(spin));
  float c2 = cos(2.0 * psi), s2 = sin(2.0 * psi);
  brM = mat3(brG2.x, brG2.y, 0.0, -brG2.y, brG2.x, 0.0, 0.0, 0.0, 1.0) * mat3(c2, 0.0, -s2, 0.0, 1.0, 0.0, s2, 0.0, c2);
  brLine = brM * vec3(0.0, 0.0, -1.0); brLineF = brTo(vec4(0.0, 0.0, 0.0, 1.0));
  vec3 ro = away ? vec3(-5.0, 1.2, 1.8) : vec3(0.63, -0.51, 2.37), ta = away ? vec3(0.0, -0.8, 0.2) : vec3(-0.96, -0.2, 0.0);
  float foc = (away ? 1.7 : 1.1) * exp2(-0.5 * uOwn[4]);
  ro *= 1.0 - 0.22 * uOwn[4];
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0.0, 0.0, 1.0))), up = cross(rt, fw);
  brPx = zoom / (uRes.y * foc);
  vec3 rd = normalize(fw * foc + (rt * p.x + up * p.y) * zoom);
  brG = normalize(fw + 0.42 * rt - 0.3 * up);
  brL = normalize(away ? up * 0.8 - rt * 0.6 - fw * 0.5 : up * 0.6 - rt * 0.35 - fw * 0.1 + brG * 0.3);
  // the hour
  float night = max(-uOwn[0], 0.0), white = max(uOwn[0], 0.0), warm = 1.0 + 0.5 * uCue + 0.25 * uLevel + 0.2 * uMic;
  if (away) {
    brA0 = mix(mix(vec3(0.72, 0.66, 0.56), vec3(0.30, 0.09, 0.05), night), vec3(0.16, 0.20, 0.23), white);
    brA1 = mix(mix(vec3(1.02, 0.95, 0.83), vec3(0.46, 0.16, 0.09), night), vec3(0.30, 0.36, 0.40), white);
    brAG = vec3(0.16, 0.12, 0.07) * warm;
    brKey = vec3(2.4, 2.1, 1.7) * (1.0 + 0.2 * uLevel + 0.5 * uCue); brSky = vec3(0.40, 0.37, 0.33);
    brFog = 0.065;
  } else {
    brA0 = mix(mix(vec3(0.085, 0.09, 0.096), vec3(0.006, 0.009, 0.016), night), vec3(0.62, 0.66, 0.70), white);
    brA1 = mix(mix(vec3(0.155, 0.168, 0.182), vec3(0.018, 0.026, 0.045), night), vec3(0.80, 0.84, 0.88), white);
    brAG = mix(mix(vec3(0.80, 0.47, 0.22), vec3(0.75, 0.36, 0.11), night), vec3(0.25, 0.17, 0.08), white) * warm;
    brKey = mix(vec3(2.7, 2.1, 1.5), vec3(0.75, 0.55, 0.4), night) * (1.0 + 0.25 * uLevel); brSky = mix(mix(vec3(0.24, 0.275, 0.325), vec3(0.06, 0.08, 0.13), night), vec3(0.6, 0.64, 0.7), white);
    brFog = 0.22;
  }
  brFog *= mix(1.25, 0.8, uSpace) * (1.0 - 0.25 * cue) * exp2(-1.4 * uOwn[5]);
  float t = 0.1, far = away ? 9.0 : 7.0;
  BrHit h, A, B; A.what = B.what = 0;
  int n = 0;
  // on to the next string; what is in it; and on again if the ray slips between two beads
  for (int go = 0; go < 12; go++) {
    float k = 1.0;
    bool in_ = false;
    for (; n < 66; n++) {
      vec3 x = ro + rd * t;
      float q = dot(x, x), r = 1.0 + q, s;
      k = 2.0 / r; s = brMap(x, k);
      in_ = s < 0.003 + 0.005 * t * k;
      if (in_ || t > far) break;
      float u = 0.5 * s; u += min(0.3 * u, 0.02);
      t += u * r / (1.0 + sqrt(q) * u) + 0.002 * t;
    }
    if (!in_) break;
    h = brTest(ro, rd, t, k);
    if (h.what > 0) {
      bool same = A.what == h.what && A.f == h.f && abs(A.j - h.j) < 0.5 && abs(A.r - h.r) < 0.5;
      if (A.what == 0 || same) { A = h; if (h.cov > 0.96) break; }
      else if (B.what == 0 || h.cov > B.cov) { B = h; if (h.cov > 0.5) break; }
      t = max(t, h.t) + 0.5 * brBig[h.f] / k;
    } else t += 0.7 * brBig[h.f] / k;
  }
  vec3 air = brAir(rd), col = air;
  // beads with the air between; where a bead's edge has nothing certain behind it, the air stands in, a little shaded
  if (B.what > 0) col = mix(air, brShade(B, ro, rd), B.cov * exp(-brFog * B.t) * (1.0 - smoothstep(0.5 * far, far, B.t)));
  else if (A.what > 0 && t < far) col *= 0.6;
  else if (A.what == 0 && t < far && n >= 66) col *= 1.0 - 0.4 * exp(-brFog * t);
  if (A.what > 0) col = mix(col, mix(air, brShade(A, ro, rd), exp(-brFog * A.t) * (1.0 - smoothstep(0.5 * far, far, A.t))), A.cov);
  return screenOf(col * 1.4);
}
