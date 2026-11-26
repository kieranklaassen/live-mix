// name: Cut paper shapes
// a: With its hole
// b: Folded cut
// what: Sheets brushed with gouache laid edge to edge, each with holes snipped by big scissors; the shapes that came out are pinned on the next panel, and a painted sheet shows through the holes; or one red sheet, folded, cut and opened off centre on a pale wall, its half leaves turned back on their hinges, three pods pinned beside it.
// follows: Each kind has its own paint: as it sounds the colour deepens, and its shapes sway, grow and lift on their pins, or its flaps open wider. The piece shows through the holes as brush strokes. The mix warms the plain panels and the window light; a voice lifts the paper; a hit lifts one flap, a cue brightens a row; keys light the pins; space deepens the shadows.
const vec2 clL = vec2(-0.6, 0.8); // where the light comes from, along the wall
const vec3 clRed = vec3(0.84, 0.23, 0.16);
float clPx;
float clMax(vec4 v) { v.xy = max(v.xy, v.zw); return max(v.x, v.y); }
float clIn(float d) { return (1.0 - smoothstep(-clPx, clPx, d)); }
float clOff(float x) { return abs(x) < 0.05 ? (x < 0.0 ? -0.05 : 0.05) : x; } // never 0, to divide by
// Six outlines cut with big scissors, all straight facets, no two alike: 0 a pod, 1 a bean, 2 half a leaf, 3 a pebble, 4 a leaf with two snips,
// 5 a paring. Each is how deep sixteen cuts go, and then what is bitten out.
struct ClForm { vec4 a, b, c, d, dx, dy, dc, ex, ey, ec; float one, two; };
ClForm clForm(int o) {
  ClForm f;
  f.one = o == 1 || o == 4 || o == 5 ? 0.0 : 9.0;
  f.two = o == 4 ? 0.0 : 9.0;
  f.dx = o == 1 ? vec4(-.76, -1., -.73, -.73) : o == 4 ? vec4(-.39, -.43, -.43, -.43) : vec4(.89, 1., .99, .92);
  f.dy = o == 1 ? vec4(-.65, .1, .68, .68) : o == 4 ? vec4(-.92, .9, .9, .9) : vec4(.45, .09, -.13, -.39);
  f.dc = o == 1 ? vec4(-.11, -.36, -.28, -.28) : o == 4 ? vec4(-.34, .2, .2, .2) : vec4(.21, .1, .12, .26);
  f.ex = vec4(-.71, -.31, -.31, -.31); f.ey = vec4(-.71, .95, .95, .95); f.ec = vec4(.03, -.29, -.29, -.29);
  f.a = o == 0 ? vec4(.42, .46, .57, .86) : o == 1 ? vec4(.61, .64, .73, .84) : o == 2 ? vec4(.32, .34, .42, .72) : o == 3 ? vec4(.62, .63, .74, .87) : o == 4 ? vec4(.51, .52, .57, .83) : vec4(.44, .46, .53, .76);
  f.b = o == 0 ? vec4(.96, .62, .44, .4) : o == 1 ? vec4(.96, .73, .67, .6) : o == 2 ? vec4(1.02, .8, .53, .33) : o == 3 ? vec4(.89, .78, .69, .65) : o == 4 ? vec4(.98, .64, .5, .46) : vec4(1., .74, .46, .29);
  f.c = o == 0 ? vec4(.38, .43, .57, .85) : o == 1 ? vec4(.61, .64, .69, .85) : o == 2 ? vec4(.23, .39, .62, .92) : o == 3 ? vec4(.62, .62, .64, .75) : o == 4 ? vec4(.46, .45, .58, .83) : vec4(.18, .37, .6, .91);
  f.d = o == 0 ? vec4(.94, .63, .46, .43) : o == 1 ? vec4(.97, .86, .72, .64) : o == 2 ? vec4(.94, .53, .35, .32) : o == 3 ? vec4(.83, .67, .65, .63) : o == 4 ? vec4(.98, .64, .53, .52) : vec4(.95, .64, .5, .45);
  return f;
}
float clPoly(vec2 q, ClForm f) {
  vec4 u = vec4(0.999, 0.972, 0.877, 0.559) * q.x + vec4(0.044, 0.234, 0.481, 0.829) * q.y, v = vec4(-0.214, -0.765, -0.938, -0.991) * q.x + vec4(0.977, 0.644, 0.346, 0.135) * q.y;
  float d = clMax(max(max(u - f.a, v - f.b), max(-u - f.c, -v - f.d)));
  return max(d, -min(clMax(f.dx * q.x + f.dy * q.y - f.dc) + f.one, clMax(f.ex * q.x + f.ey * q.y - f.ec) + f.two));
}
// Gouache: what the flat brush did at q, in the sheet's own frame. x how thick, y how dry.
vec2 clBrush(vec2 q, float seed) {
  seed = fract(seed * 0.618) * 8.0;
  q = rot(floor(seed) * 0.78 + 0.2 * fract(seed * 5.0)) * q + seed;
  float u = q.x + 0.007 * sin(q.y * 6.0 + seed * 5.0), l = u / 0.066, i = floor(l), f = l - i;
  float own = hash11(i + seed), tone = mix(hash11(i - 1.0 + seed), own, smoothstep(0.0, 0.22, f)) - 0.5;
  float y = q.y + 9.0 * own;
  float fine = noise(vec2(u * 380.0, y * 10.0)), wide = noise(vec2(u * 120.0, y * 2.6));
  return vec2(tone + 0.7 * (wide - 0.5), fine * 0.6 + wide * 0.4);
}
float clKind(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// The gouaches: first the five kinds' own, then the plain panels.
const vec3 clPot[13] = vec3[13](vec3(0.10, 0.25, 0.66), vec3(0.78, 0.27, 0.52), vec3(0.96, 0.69, 0.14), vec3(0.13, 0.50, 0.30), vec3(0.88, 0.25, 0.15),
  vec3(0.96, 0.75, 0.70), vec3(0.09, 0.11, 0.17), vec3(0.64, 0.81, 0.89), vec3(0.80, 0.89, 0.76), vec3(0.97, 0.84, 0.42), vec3(0.86, 0.87, 0.80), vec3(0.95, 0.58, 0.38), vec3(0.36, 0.28, 0.52));
// A kind's paint has some of its colour in it, and dries paler when the kind is quiet.
vec3 clPaint(int k) {
  vec3 c = mix(clPot[k], uKind[k], 0.22);
  return mix(mix(c, vec3(0.95, 0.91, 0.84), 0.19), c, sat(clKind(k) * (1.1 + uEnergy)));
}
// The sheet at the very back: bare paper with the piece laid on it in wide brush strokes, the loop across, the room downwards.
vec3 clUnder(vec2 p, vec3 paper) {
  float dry = noise(vec2(p.x * 5.0, p.y * 190.0)), l = (p.y + 0.008 * sin(p.x * 5.0) + 0.004 * dry) / 0.058, i = floor(l), f = l - i;
  float own = hash11(i + 41.0), x = 0.5 + p.x / 1.8 + 0.03 * (own - 0.5);
  // each stroke is one load of paint, and the next overlaps it a little
  vec4 m = mix(piece(vec2(x, 0.5 - (i - 0.5) * 0.058)), piece(vec2(x, 0.5 - (i + 0.5) * 0.058)), smoothstep(0.0, 0.14, f));
  vec3 ink = m.rgb / max(m.a, 0.02);
  ink = ink * ink * 0.4 + ink * 0.6;
  ink = max(mix(vec3(dot(ink, vec3(0.333))), ink, 1.18), 0.02);
  ink *= 0.84 + 0.16 * own + 0.14 * dry;
  return mix(paper, ink, 0.96 * smoothstep(dry * 0.4, dry * 0.4 + 0.12, m.a * 1.15 - 0.04));
}
// A pin; a note on the keys lights its head.
vec3 clPin(vec3 col, vec2 q) {
  col *= 1.0 - 0.4 * (1.0 - smoothstep(0.003, 0.011, length(q + clL * 0.009)));
  vec3 head = mix(vec3(0.16, 0.16, 0.18), vec3(0.95), (1.0 - smoothstep(0.0, 0.004, length(q - clL * 0.0025)))) + uKeys * vec3(0.9, 0.75, 0.4);
  return mix(col, head, clIn(length(q) - 0.0062 - 0.002 * uKeys));
}
// a: eight shapes. clHole: where each was cut, clPut: where it hangs now (its middle, and the way its tip points by its size).
const vec4 clHole[8] = vec4[8](vec4(-0.7, 0.17, -0.041, 0.257), vec4(0.0, 0.25, 0.039, 0.191), vec4(0.595, 0.345, -0.058, 0.105), vec4(0.67, 0.125, 0.071, 0.036), vec4(-0.385, -0.25, -0.02, 0.199), vec4(-0.215, -0.27, -0.026, -0.183), vec4(0.365, -0.23, -0.021, 0.214), vec4(0.8, 0.27, 0.019, 0.189));
const vec4 clPut[8] = vec4[8](vec4(-0.345, 0.215, 0.062, 0.253), vec4(0.325, 0.27, -0.039, 0.191), vec4(0.595, -0.315, 0.012, 0.119), vec4(0.63, -0.075, 0.063, 0.05), vec4(-0.795, -0.3, 0.069, 0.188), vec4(-0.6, -0.3, -0.071, -0.171), vec4(0.06, -0.25, 0.072, 0.203), vec4(0.825, -0.2, 0.038, 0.186));
const int clOut[8] = int[8](0, 1, 3, 3, 2, 5, 4, 2);
const int clWho[8] = int[8](0, 1, 2, 2, 3, 3, 4, 2);
// the panels, undermost first: middle and half size, and their paint
const vec4 clBox[14] = vec4[14](
  vec4(-0.33, 0.2, 0.22, 0.36), vec4(-0.72, 0.21, 0.215, 0.34), vec4(0.32, 0.25, 0.19, 0.3), vec4(-0.015, 0.26, 0.19, 0.265),
  vec4(0.71, -0.15, 0.215, 0.3), vec4(0.71, 0.30, 0.225, 0.275), vec4(0.06, -0.27, 0.22, 0.268), vec4(-0.7, -0.335, 0.225, 0.2),
  vec4(-0.295, -0.295, 0.19, 0.25), vec4(0.72, -0.52, 0.225, 0.075), vec4(0.36, -0.275, 0.152, 0.285),
  vec4(-1.23, -0.15, 0.32, 0.5), vec4(1.23, 0.3, 0.31, 0.34), vec4(1.23, -0.35, 0.31, 0.31));
const int clTint[14] = int[14](5, 0, 6, 1, 7, 2, 8, 9, 3, 5, 4, 10, 11, 12);
vec3 clPanel(int k) {
  int t = clTint[k];
  return t < 5 ? clPaint(t) : clPot[t] * mix(vec3(0.95, 0.975, 1.0), vec3(1.03, 1.0, 0.93), uLevel); // the plain panels warm with the mix
}
// which shape is nearest: far from the line down its middle
float clNear(vec4 h, vec2 p) {
  vec2 q = p - h.xy;
  q -= h.zw * clamp(dot(q, h.zw) / dot(h.zw, h.zw), -0.65, 0.65);
  return dot(q, q);
}
vec3 clA(vec2 p) {
  float sh = mix(0.004, 0.008, uSpace), deep = sh + 0.005, nh = 1e3, np = 1e3;
  int ih = 0, ip = 0;
  for (int i = 0; i < 8; i++) {
    float a = clNear(clHole[i], p), b = clNear(clPut[i], p);
    if (a < nh) { nh = a; ih = i; }
    if (b < np) { np = b; ip = i; }
  }
  // the hole
  vec4 h = clHole[ih];
  float z = length(h.zw);
  vec2 ay = h.zw / z, q0 = p - h.xy, toL;
  mat2 r = mat2(ay.y, ay.x, -ay.x, ay.y);
  ClForm fm = clForm(clOut[ih]);
  float dh = clPoly(r * q0 / z, fm) * z, dhS = clPoly(r * (q0 + clL * deep) / z, fm) * z;
  // the panels: which lies on top here, which under it, and their shadows
  float shade = 1.0, cov = 0.0, pd = 0.0, pds = 0.0;
  int top = 0, under = 0;
  for (int k = 0; k < 14; k++) {
    vec4 b = clBox[k];
    float tilt = (fract(float(k) * 0.618 + 0.3) - 0.5) * 0.05;
    vec2 q = p - b.xy;
    q += tilt * vec2(-q.y, q.x);
    vec2 e = abs(q) - b.zw, es = abs(q + clL * sh) - b.zw;
    float d = max(e.x, e.y), ds = max(es.x, es.y), c = clIn(d);
    shade = mix(shade * (1.0 - 0.42 * (1.0 - smoothstep(-sh, sh, ds))), 1.0, c);
    if (c > 0.0) { under = top; top = k; cov = c; pd = d; pds = ds; }
  }
  vec2 bc = p - clBox[top].xy;
  float seed = float(top) * 3.7 + 1.0, paint = clIn(dh) > 0.5 ? 0.15 : 1.0;
  vec3 col = mix(clPanel(under), clPanel(top), cov) * shade;
  col += 0.10 * smoothstep(-0.0025, 0.0, pd) * clamp((pds - pd) / sh, -1.0, 1.0) + 0.10 * (1.0 - smoothstep(0.0, 0.0025, abs(dh))) * clamp((dh - dhS) / deep, -1.0, 1.0);
  vec3 back = clUnder(p, vec3(0.955, 0.935, 0.89));
  col = mix(col, back * (1.0 - 0.45 * smoothstep(-deep, deep * 0.8, dhS)), clIn(dh));
  // the shape on its pin: it sways, and stands a little off the sheet toward its tips
  h = clPut[ip];
  int who = clWho[ip];
  float s = ip == 6 ? 0.0 : clKind(who), fi = float(ip);
  z = length(h.zw); ay = h.zw / z; q0 = p - h.xy;
  r = rot((0.012 + 0.05 * s) * sin(uTime * (0.43 + 0.06 * fi) + fi * 2.1)) * mat2(ay.y, ay.x, -ay.x, ay.y);
  z *= 1.0 + 0.07 * s;
  vec2 q = r * q0, pq = q - vec2(ip == 6 ? -0.02 : 0.0, 0.42 * z);
  float up = (0.004 + sh * (0.8 + 1.4 * s + uMic + 0.2 * sin(uTime * 0.31 + fi))) * (0.35 + 1.1 * length(pq) / z);
  toL = r * clL;
  vec2 qs = q + toL * up;
  vec3 c = clPaint(who);
  fm = clForm(clOut[ip]);
  float d = clPoly(q / z, fm) * z, ds = clPoly(qs / z, fm) * z;
  ds = max(ds, length(qs) - 1.03 * z);
  bool crease = ip == 6;
  float df = 9.0, flapShade = 1.0, cs = 1.0;
  if (crease) {
    // the red leaf is folded down its middle, and one half is the flap a hit lifts
    d = max(d, q.x); ds = max(ds, qs.x);
    float th = 0.45 + 0.08 * sin(uTime * 0.37) + 6.0 * uHits * (1.0 - uHits), sn = sin(th);
    cs = clOff(cos(th));
    float den = clOff(cs - toL.x * 0.55 * sn), v = q.x / den;
    df = max(clPoly(vec2(q.x / cs, q.y) / z, fm) * z * abs(cs), -q.x * sign(cs));
    float dfs = max(clPoly(vec2(v, q.y + toL.y * 0.55 * sn * v) / z, fm) * z, -v) * abs(den);
    flapShade = 1.0 - 0.42 * (1.0 - smoothstep(-0.012, 0.012, dfs)) * smoothstep(0.05, 0.2, abs(den));
  }
  float body = clIn(d), flap = clIn(df), face = clamp((ds - d) / up, -1.0, 1.0);
  col *= mix((1.0 - 0.45 * (1.0 - smoothstep(-up * 0.8, up * 0.8, ds))) * flapShade, 1.0, max(body, flap));
  vec3 front = c * (1.02 - (0.08 + 0.08 * s) * (q.x * 0.8 - q.y * 0.4) / z) + 0.10 * face * smoothstep(-0.0025, 0.0, d);
  col = mix(col, front * flapShade, body);
  if (crease) {
    vec3 fl = cs > 0.0 ? c * (0.78 + 0.3 * cs) : mix(vec3(0.97, 0.9, 0.84), c, 0.12) * (0.9 - 0.12 * cs);
    col = mix(col, fl + uKind[4] * uHits * 0.3, flap);
  }
  vec2 fp = p - clPut[6].xy;
  col += uKind[4] * uHits * 0.16 * exp(-dot(fp, fp) * 30.0) * (1.0 - body);
  if (min(d, df) < 0.0) { bc = q; seed = fi * 2.3 + 7.0; paint = 1.0; }
  col = clPin(col, pq);
  vec2 g = clBrush(bc, seed);
  col *= 1.0 - 0.10 * paint * g.x;
  col = mix(col, col * 0.75 + 0.25, 0.2 * paint * smoothstep(0.55, 0.85, g.y));
  // a cue brightens the lower row, from one side to the other
  float go = p.x + 1.0 - 2.4 * (1.0 - uCue);
  return mix(col, min(col * 1.3 + 0.05, 1.0), uCue * (1.0 - smoothstep(-0.06, 0.06, p.y)) * exp(-1.44 * go * go));
}
// b: the cuts in one half of the folded sheet. Each is a half leaf: where its hinge starts and which way it runs; how long, how deep, and whose it is.
const vec4 clCut[7] = vec4[7](vec4(0.36, 0.06, -0.0, 1.0), vec4(0.36, -0.34, -0.0, 1.0), vec4(0.31, 0.4, -1.0, -0.0), vec4(0.07, -0.4, 1.0, 0.0), vec4(0.085, -0.29, 0.557, 0.83), vec4(0.085, -0.06, 0.557, 0.83), vec4(0.085, 0.135, 0.697, 0.717));
const vec3 clDeep[7] = vec3[7](vec3(0.27, 0.1, 1.0), vec3(0.32, 0.105, 0.0), vec3(0.22, 0.08, 3.0), vec3(0.23, 0.075, 2.0), vec3(0.24, 0.085, 1.0), vec3(0.24, 0.085, 0.0), vec3(0.215, 0.075, 4.0));
// how far outside a half leaf lying on its hinge: u along, v out from it; len its length, dp its depth
float clHalf(float u, float v, float len, float dp) {
  float x = u / len;
  float d = clMax((v - dp * (vec4(0.0, 0.36, 1.66, 3.1) + vec4(3.2, 1.4, -1.05, -3.1) * x)) * vec4(0.65, 0.89, 0.93, 0.67));
  return max(max(d, -v), v - dp * (1.0 - 0.06 * x));
}
const vec2 clFold[3] = vec2[3](vec2(-0.275, 0.09), vec2(-0.035, 0.12), vec2(0.23, 0.13));
// a pod cut across a fold, so both its sides are the same
float clPod(vec2 q, float l) {
  float x = abs(q.x), y = q.y / l;
  return max((x - l * 0.52 * (1.0 - y)) * 0.887, max((x - l * 0.9 * (1.0 + y)) * 0.743, x - l * (0.4 - 0.1 * y)));
}
vec3 clB(vec2 p) {
  vec3 col = vec3(0.885, 0.88, 0.855) * (0.985 + 0.03 * noise(p * 14.0));
  mat2 r = rot(-0.09 + 0.004 * sin(uTime * 0.21));
  vec2 q = r * (p - vec2(-0.2, -0.01)), L = r * clL, bc = p;
  float seed = 0.0, paint = 0.0;
  // a painted sheet lies behind the cut one
  col = mix(col, clUnder(p, vec3(0.93, 0.915, 0.87)), clIn(max(abs(q.x) - 0.35, abs(q.y) - 0.39)));
  // the nearest cut and the nearest pod: the hand slipped a little between the halves
  float side = q.x < 0.0 ? -1.0 : 1.0, near = 9.0;
  vec2 m = vec2(q.x * side, q.y + (q.x > 0.0 ? 0.005 : 0.0)), Lm = vec2(L.x * side, L.y), w = vec2(9.0), lw = L;
  int at = 0;
  for (int i = 0; i < 7; i++) {
    vec4 k = clCut[i];
    vec2 a = k.zw, o = m - k.xy, u = vec2(dot(o, a), a.x * o.y - a.y * o.x);
    float d = clHalf(u.x, abs(u.y), clDeep[i].x, clDeep[i].y);
    if (d < near) { near = d; w = u; lw = vec2(dot(Lm, a), a.x * Lm.y - a.y * Lm.x); at = i; }
  }
  float len = clDeep[at].x, dp = clDeep[at].y, fi = float(at);
  int who = int(clDeep[at].z + 0.5);
  vec2 fold = q.y < -0.17 ? clFold[0] : q.y < 0.1 ? clFold[1] : clFold[2];
  // the sheet; its right half stands further off the wall than its left
  float z = (0.008 + 0.02 * sat(q.x / 0.4) + 0.008 * sat(-q.x / 0.4)) * (0.6 + 0.8 * uSpace + 0.3 * uMic);
  vec2 e = abs(q) - vec2(0.36, 0.40), es = abs(q + L * z) - vec2(0.36, 0.40);
  float d = max(max(max(e.x, e.y), -clHalf(w.x, w.y, len, dp)), -clPod(q - vec2(0.0, fold.x), fold.y));
  float ds = max(max(max(es.x, es.y), -clHalf(w.x + lw.x * z, w.y + lw.y * z, len, dp)), -clPod(q + L * z - vec2(0.0, fold.x), fold.y));
  float cov = clIn(d);
  col *= 1.0 - 0.36 * (1.0 - smoothstep(-z * 0.6, z * 0.6, ds));
  vec3 c = clRed * (q.x < 0.0 ? 1.0 : 0.88);
  c *= 1.0 + 0.16 * side * (1.0 - smoothstep(0.0, 0.03, abs(q.x - 0.006))) - 0.05 * (1.0 - smoothstep(0.0, 0.02, abs(q.y))) * sign(q.y);
  c += 0.10 * smoothstep(-0.0025, 0.0, d) * clamp((ds - d) / z, -1.0, 1.0);
  col = mix(col, c, cov);
  if (cov > 0.5) { bc = q; seed = 5.0; paint = 1.0; }
  // a cue brightens the row across the middle, from one side to the other
  float go = q.x + 0.6 - 1.4 * (1.0 - uCue);
  col = mix(col, min(col * 1.35 + 0.05, 1.0), uCue * (1.0 - smoothstep(0.09, 0.17, abs(q.y + 0.02))) * (1.0 - smoothstep(0.34, 0.36, abs(q.x))) * exp(-4.0 * go * go));
  // the flap, turned back on its hinge; it opens wider as its kind sounds, and a hit lifts one alone
  bool hit = who == 4 && side > 0.0;
  float s = who == 4 ? 0.0 : clKind(who);
  float th = 2.0 + 0.85 * s + 0.07 * sin(uTime * (0.33 + 0.05 * fi) + fi * 1.7 + side) + 0.14 * side * sin(fi * 2.3 + 0.6);
  th += hit ? 3.4 * uHits * (1.0 - uHits) : 0.0;
  float cs = clOff(cos(th)), sn = sin(th), den = clOff(cs - lw.y * 0.6 * sn), v = w.y / den;
  float df = clHalf(w.x, w.y / cs, len, dp) * abs(cs), dfs = clHalf(w.x + lw.x * 0.6 * sn * v, v, len, dp) * abs(den), bl = 0.003 + 0.012 * sn;
  float flap = clIn(df);
  col *= 1.0 - 0.36 * (1.0 - smoothstep(-bl, bl, dfs)) * smoothstep(0.05, 0.3, abs(den)) * (1.0 - flap);
  vec3 N = vec3(0.0, -sn, cs) * sign(cs);
  vec3 f = cs < 0.0 ? mix(vec3(0.96, 0.93, 0.87), clPaint(who), 0.45 + 0.5 * (hit ? uHits : s)) : clRed;
  f *= clamp(dot(N, normalize(vec3(lw, 1.3))) * 1.26, 0.6, 1.12);
  if (hit) f = mix(f, uKind[4] * 1.25, 0.6 * uHits);
  vec2 g = q - vec2(0.16, 0.2);
  col += (uKind[4] * 0.3 + 0.06) * uHits * exp(-dot(g, g) * 70.0);
  col = mix(col, f, flap);
  if (flap > 0.5) { bc = w; seed = fi + 20.0; paint = 0.8; }
  // the pods that fell out of the fold, pinned beside it
  int n = p.y < -0.16 ? 0 : p.x > 0.58 ? 1 : 2;
  float fn = float(n), l = clFold[n].y;
  vec2 o = p - (n == 0 ? vec2(0.47, -0.27) : n == 1 ? vec2(0.67, -0.03) : vec2(0.47, 0.19));
  mat2 t = rot((n == 0 ? 0.5 : n == 1 ? -0.3 : 0.16) + 0.03 * sin(uTime * (0.35 + 0.07 * fn) + fn * 2.0));
  w = t * o;
  float rise = 0.004 + 0.06 * abs(w.x), dd = clPod(w, l), dS = clPod(w + t * clL * rise, l), pod = clIn(dd);
  col *= 1.0 - 0.36 * (1.0 - smoothstep(-rise, rise, dS)) * (1.0 - pod);
  col = mix(col, clRed * (1.0 - 0.14 * smoothstep(-clPx, clPx, w.x)) + 0.1 * smoothstep(-0.0025, 0.0, dd) * clamp((dS - dd) / rise, -1.0, 1.0), pod);
  if (pod > 0.5) { bc = w; seed = 40.0 + fn; paint = 1.0; }
  col = clPin(col, p.x > 0.36 ? w - vec2(0.01, l * 0.4) : vec2(m.x - 0.335, q.y - 0.375));
  g = clBrush(bc, seed);
  col *= 1.0 - 0.09 * paint * g.x;
  return mix(col, col * 0.75 + 0.25, 0.18 * paint * smoothstep(0.55, 0.85, g.y));
}
vec3 render(vec2 p) {
  float back = uVar < 0.5 ? 1.0 : clamp(0.8 * uRes.y / uRes.x, 1.0, 1.4);   // in a narrow picture the folded sheet is seen whole
  p = p * back - vec2(0.5 * (back - 1.0), 0.0);
  clPx = 0.75 * back / uRes.y;
  vec3 col = uVar < 0.5 ? clA(p) : clB(p);
  // daylight from a window at the upper left, its bars soft on the wall, moving over minutes
  float fall = length(p - vec2(-0.5, 0.4));
  col *= mix(vec3(1.06, 1.04, 1.0), vec3(0.85, 0.845, 0.89), smoothstep(0.1, 1.7, fall));
  vec2 w = rot(0.5) * p + vec2(0.06 * sin(uTime * 0.011), 0.03 * sin(uTime * 0.017));
  float e = mix(0.07, 0.015, uTone), x = abs(w.x + 0.12);
  float pane = (1.0 - smoothstep(0.31 - e, 0.31 + e, x)) * smoothstep(0.004, 0.02 + e, x) * smoothstep(0.0, 0.02 + e, abs(abs(w.y) - 0.22));
  return col * (1.0 + vec3(0.12, 0.095, 0.04) * pane * (0.8 + 0.5 * uLevel));
}
