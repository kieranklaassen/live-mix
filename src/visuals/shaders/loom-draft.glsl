// name: Shed and shuttle
// a: Linen
// b: Point paper
// what: Cream cloth on a loom in window light, every thread lying over or under its neighbour; above the last pick the bare warp hangs taut over a grey board, a stick through it, and a wooden shuttle lies beside; or the weaver's plan on ruled paper: threading above, treadling at the side and the pattern in small squares of ink.
// follows: The cloth is what was just heard, read down from the playhead: where the piece sounds, plain weave turns to twill and takes its dye; or a ruler reads down the plan. Kinds tint their warps or treadles, bands lift the warp or redden the threading, highs shine on thread. A hit opens the shed or wets a few squares; a cue throws a weft or lays a wash.
// own: 0 1 many fine threads (b: small squares), -1 a few thick ones; 1 1 thin and open, gone astray, the ground seen between (b: scattered round dots), -1 tufted in deep wool (b: squares that touch like tiles); 2 1 lies going away from the eye, -1 hangs in folds that sway; 3 1 great nested diamonds, -1 checks; 4 1 a dark ground (b: pale marks on it), -1 lit from behind; 5 1 night and one lamp, -1 the shade of moving leaves; 6 1 glossy wire or silk (b: round glass beads), -1 flat strips of cane (b: cross stitches); 7 1 dyed in stripes both ways in the sounds' colours, -1 all one shot colour, the ground in the drone's
const float ldN = 24.0; // picks a loop
float ldP; // from one thread to the next
float ldFell, ldEdge; // the last pick, and the right selvedge
float ldPx;
vec2 ldAt; // where on the screen, before the cloth is laid down or hung
float ldFold, ldOut, ldFar, ldStir; // the light on a fold; the tools put away; how far off it is; whether hits go through the cloth
// From 0 at a to 1 at b.
float ldS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// The draft: which of eight shafts a warp hangs on, which treadle a pick is woven on, and whether that lifts the warp.
float ldShaft(float i) {
  float b = mod(i, 46.0);
  return b < 16.0 ? mod(b, 8.0) : b < 32.0 ? 7.0 - abs(b - 24.0) : mod(floor((b - 32.0) * 0.5) + 1.0, 8.0);
}
float ldTread(float k) {
  float b = floor(k / 6.0), h = b > 0.5 && b < 2.5 ? 0.0 : hash11(b + 3.7);
  float s = h < 0.4 ? k : h < 0.72 ? 48.0 - k : floor(k * 0.5);
  return mod(s + (h > 0.0 ? floor(hash11(b + 9.1) * 4.0) : 0.0), 8.0);
}
float ldTie(float d) { d = mod(d, 8.0); return d < 2.5 || (d > 3.5 && d < 4.5) ? 1.0 : 0.0; }
float ldUp(float i, float k) { return ldTie(ldShaft(i) - ldTread(k)); }
// Plain cloth, turning into an even twill over two and under two where s is 1; eight picks are always a herringbone.
float ldHerring(float k) { k = mod(k, ldN); return k > 5.5 && k < 13.5 ? 1.0 : 0.0; }
// Nested diamonds, or checks; 2 where there is none.
float ldFig(float i, float k, float per) {
  vec2 c = vec2(i, k) / per, b = floor(c * 2.0);
  if (hash21(mod(b, 64.0) + 3.0) > abs(uOwn[3]) * 1.001) return 2.0;
  vec2 e = abs(2.0 * fract(c + 0.25) - 1.0);
  if (uOwn[3] > 0.0) return step(0.5, fract(0.12 + 1.5 * mix(e.x + e.y, 1.4 * length(e), 0.35)));
  vec2 q = floor(c * 4.0 + 0.001);
  return mod(q.x + q.y, 2.0);
}
// Which sound dyes the thread, 24 threads round.
vec3 ldSett(float n) {
  n = mod(n, 24.0);
  return n < 8.0 ? uKind[1] : n < 10.0 ? uKind[3] : n < 12.0 ? uKind[1] : n < 20.0 ? uKind[2] : n < 21.0 ? uKind[4] : uKind[2];
}
float ldWas(float i, float k, float s) { return mix(mod(i + k, 2.0), step(mod(ldShaft(i) - ldTread(mod(k, ldN)), 4.0), 1.5), max(s, ldHerring(k))); }
float ldCross(float i, float k, float s) {
  if (uOwn[3] != 0.0) {
    float f = ldFig(i, mod(k, ldN), ldN);
    if (f < 1.5) return step(mod(i + k, 4.0), f > 0.5 ? 2.5 : 0.5);
  }
  return ldWas(i, k, s);
}
// A natural dye on flax: the colour of the sound, quietened and soaked in.
vec3 ldDye(vec3 c, float a) {
  float l = dot(c, vec3(0.3, 0.6, 0.1));
  c = mix(vec3(l), c, 0.85);
  return mix(vec3(1.0), c * 0.95 + 0.1, a);
}
// The window's light: two tall panes laid slantwise, drifting over minutes. 0 is shade, 1 is sun.
float ldSun(vec2 p) {
  float soft = mix(0.05, 0.13, uSpace);
  float x = p.x + 0.62 * p.y + 0.09 * sin(uTravel * 0.021) + 0.02 * sin(uTime * 0.13);
  float y = p.y - 0.16 * p.x + 0.03 * sin(uTravel * 0.017 + 1.0);
  float s = ldS(-0.78 - soft, -0.78 + soft, x) * ldS(0.52 + soft, 0.52 - soft, x);
  s *= 1.0 - 0.8 * ldS(0.03 + soft * 0.6, 0.03 - soft * 0.4, abs(x + 0.12));
  s *= 1.0 - 0.7 * ldS(0.028 + soft * 0.6, 0.028 - soft * 0.4, abs(y + 0.14));
  if (uOwn[5] > 0.0) {
    vec2 d = (ldAt - vec2(-0.3 + 0.05 * sin(uTravel * 0.05), -0.2 + 0.03 * sin(uTime * 0.11))) * vec2(0.85, 1.1);
    s = mix(s, 1.06 * exp(-dot(d, d) * 4.2) * (1.0 + 0.1 * uLevel), uOwn[5]);
  }
  if (uOwn[5] < 0.0) {
    vec2 d = p + 0.02 * vec2(sin(uTime * 0.37 + p.y * 3.0), cos(uTime * 0.29 + p.x * 2.0));
    float lv = 0.0;
    for (int n = 0; n < 2; n++) {
      float fn = float(n);
      vec2 e = rot(0.75 - 1.35 * fn) * (d + fn * 0.012 * sin(uTime * 0.61 + p.x * 5.0)) * vec2(6.5, 17.0) * (1.0 + 0.3 * fn), b = floor(e);
      e.x += 0.5 * mod(b.y, 2.0); b = floor(e);
      vec2 h = hash22(b + 7.0 * fn), q = e - b - 0.5 + 0.2 * (h - 0.5);
      lv = max(lv, ldS(0.14, -0.1, abs(q.y) - 0.5 * (0.25 - q.x * q.x) * (1.2 + h.x)) * ldS(0.35, 0.6, noise(b * vec2(0.21, 0.12) + 5.0 * fn)));
    }
    s = mix(s, 1.0 - 0.9 * lv, -uOwn[5]);
  }
  return s;
}
vec3 ldLight(vec3 was, float sun) {
  if (uOwn[5] > 0.0) was = mix(was, mix(vec3(0.07, 0.08, 0.115), vec3(1.34, 1.08, 0.8), sun), uOwn[5]);
  if (uOwn[5] < 0.0) was = mix(was, mix(vec3(0.58, 0.63, 0.66), vec3(1.14, 1.1, 1.0), sun), -uOwn[5]);
  return was;
}
// Where a hit or a cue has got to: a soft ring going out through the threads.
float ldRing() {
  float l = length(ldAt - vec2(-0.25, -0.25)), a = l - 0.95 * (1.0 - uHits), b = l - 1.2 * (1.0 - uCue);
  return ldStir * (uHits * exp(-a * a * 45.0) + uCue * exp(-b * b * 30.0));
}
vec3 ldGround(vec3 was, float sunk) {
  if (uOwn[7] != 0.0) was = mix(was, uKind[0] * (0.75 + 0.3 * was), abs(uOwn[7]));
  if (uOwn[4] > 0.0) was = mix(was, was * sunk, uOwn[4]);
  if (uOwn[4] < 0.0) was = mix(was, 0.35 * was + vec3(0.78, 0.76, 0.72), -uOwn[4]);
  return was;
}
// How much of its kind's dye a warp carries: drone and pad in wide stripes, texture in every third, phrase in pairs.
vec3 ldWarpDye(float i) {
  float j = -i;
  vec3 c = vec3(1.0);
  c *= ldDye(uKind[0], 0.62 * uDrone * step(42.5, j) * step(j, 54.5));
  c *= ldDye(uKind[1], 0.6 * uPad * step(22.5, j) * step(j, 31.5));
  c *= ldDye(uKind[2], 0.6 * uTexture * step(9.5, j) * step(j, 20.5) * step(mod(j, 3.0), 0.5));
  c *= ldDye(uKind[3], 0.75 * uPhrase * step(abs(abs(j - 36.5) - 2.0), 0.6));
  return c;
}
vec3 ldLinen(vec2 p) {
  float sun = ldSun(uOwn[2] > 0.0 ? ldAt : p);
  vec3 L = normalize(vec3(-0.8, 0.42, mix(0.62, 0.38, uTone)));
  vec3 lit = ldLight(mix(vec3(0.68, 0.7, 0.745), vec3(1.16, 1.11, 1.02) * (1.0 + 0.03 * uMic), sun), sun);
  float open = max(uOwn[1], 0.0), fat = max(-uOwn[1], 0.0), wire = max(uOwn[6], 0.0), cane = max(-uOwn[6], 0.0), back = max(-uOwn[4], 0.0);
  float q = uLoop * ldN, K = floor(q), f = q - K;
  float above = p.y - ldFell;
  // the table: pale grey board
  vec3 col = vec3(0.76, 0.755, 0.74) * (0.965 + 0.05 * noise(p * vec2(240.0, 30.0)) + 0.03 * noise(p * 9.0));
  float fan = 1.0 - 0.045 * max(above, 0.0); // the bare warp spreads a little towards the reed
  float x = p.x;
  float u = (x * fan - ldEdge) / ldP;
  float grain = sat(1.25 - ldPx / ldP * 2.2); // 0 when a thread is near a pixel
  float w = fwidth(p.y) / ldP;
  // picks counted down the cloth, the last one beaten in not quite straight
  float v = q + above / ldP + 0.1 * sin(u * 0.43) + 0.07 * sin(u * 1.1 + 2.0);
  // shadow the cloth throws on the board
  col = ldGround(col, 0.13);
  if (uOwn[6] < 0.0 || uOwn[2] > 0.0) col *= 1.0 + (0.3 * max(cane, uOwn[2])) * (noise(p * vec2(31.0, 37.0)) + noise(p * vec2(90.0, 110.0)) * 0.6 - 0.8) * sat(1.4 - ldPx * 90.0);
  col *= lit * (1.0 - (0.5 - 0.5 * max(back, 0.7 * open)) * ldS(0.05, 0.0, x - ldEdge) * ldS(ldFell, ldFell - 0.04, p.y));
  // the pick that lies loose in its bow above the cloth, and how it is beaten down
  float bow = (1.0 - f) * (1.0 - f);
  float looseY = ldFell + (0.5 - f) * ldP;
  float s01 = (x + 1.0) / (ldEdge + 1.0);
  float arc = 0.024 * bow * sat(s01 * (1.0 - s01) * 4.0 + 0.35 * s01);
  float band0 = band(sat((x + 0.85) / 1.35));
  if (u < 0.0 && v >= K) {
    float bend = uKeys * 0.45 * sin(PI * sat(above / 0.4)) * step(0.72, hash11(floor(u) + 5.0));
    float i = floor(u), fx = u - i - 0.5;
    float lift = 0.45 + 1.0 * band0 * (0.5 + uEnergy);
    float us = u - lift * 0.9 - 0.2;
    float fs = fract(us) - 0.5;
    float blur = 0.12 + 0.16 * lift;
    float sh = ldS(0.2 + blur, 0.2 - blur * 0.6, abs(fs));
    sh *= ldS(-0.2, 0.4, -us) * 0.42 / (0.7 + lift);
    col *= 1.0 - mix(0.2, sh, grain) * (0.35 + 0.65 * sun);
    float wedge = ldS(0.0, 0.02, above) * ldS(0.14, 0.03, above);
    float shed = max(uHits, 0.8 * uCue) * wedge * ldS(-0.95, -0.1, x) * ldS(0.02, 0.0, x - ldEdge);
    col *= 1.0 - 0.62 * shed;
    float odd = mod(i, 2.0);
    // the round stick that keeps the cross: every other warp runs over it
    float ry = (p.y - 0.385 - 0.012 * x - 4.0 * ldOut) / 0.017;
    float rod = ldS(1.0 + ldPx / 0.017, 1.0 - ldPx / 0.017, abs(ry));
    float rsh = ldS(1.9, 0.6, abs(ry + 1.5)) * 0.45;
    col *= 1.0 - rsh;
    float rz = sqrt(max(1.0 - ry * ry, 0.0));
    vec3 wood = vec3(0.62, 0.44, 0.28) * (0.86 + 0.28 * noise(vec2(x * 14.0, ry * 3.0 + 4.0)));
    wood *= lit * (0.55 + 0.5 * sat(dot(vec3(0.0, ry, rz), L) + 0.15)) + 0.12 * pow(sat(rz * 0.75 + ry * 0.6), 18.0) * sun;
    col = mix(col, wood, rod);
    fx += bend - 0.5 * bend * bend;
    float r = 0.25 + 0.03 * sin(p.y * 260.0 + i * 2.1);
    if (uOwn[1] != 0.0 || uOwn[6] != 0.0) r *= 1.0 - 0.5 * open + 0.65 * max(cane, fat);
    float on = ldS(r + w, r - w * 0.6, abs(fx)) * (1.0 - rod * (1.0 - odd));
    float nx = clamp(fx / r, -1.0, 1.0);
    float nz = sqrt(1.0 - nx * nx * 0.98);
    if (ldP < 0.019 || uOwn[2] > 0.0) { nx *= grain; nz = mix(0.75, nz, grain); }
    if (cane > 0.0) { nx = mix(nx, nx * nx * nx * nx * nx, cane); nz = sqrt(max(1.0 - nx * nx * 0.98, 0.0)); }
    nx += 0.35 * sin((p.y / ldP * 2.0 + fx * 3.0) * TAU) * grain * nz * (1.0 - cane) * (1.0 - 0.7 * wire);
    vec3 c = vec3(0.93, 0.89, 0.8) * (0.95 + 0.1 * hash11(i + 2.0)) * ldWarpDye(i);
    if (uOwn[7] != 0.0) c = mix(c, (uOwn[7] > 0.0 ? ldSett(i) : uKind[1]) * (0.9 + 0.2 * hash11(i + 2.0)), abs(uOwn[7]));
    c *= 1.0 + cane * 0.5 * (noise(vec2(fx * 14.0 + i * 5.0, p.y * 9.0)) - 0.5);
    vec3 sha = lit * (0.5 + 0.62 * sat(dot(vec3(nx, 0.0, nz), L)));
    if (wire > 0.0) sha = mix(sha, lit * (0.16 + 0.35 * nz + 1.5 * pow(sat(1.0 - abs(nx + 0.3)), 5.0)), wire);
    if (back > 0.0) sha = mix(sha, lit * (0.3 + 0.5 * nx * nx), back);
    sha *= 1.0 + shed * mix(-0.45, 0.35, odd) + 0.14 * odd * uKeys * step(0.72, hash11(i + 5.0));
    col = mix(col, c * sha, mix(0.5, on, grain));
    // a cue throws a glossy weft through the open shed
    float front = mix(0.1, -1.3, sat((1.0 - uCue) * 1.5));
    float cd = (p.y - ldFell - 0.034 - 0.02 * sin((x + 1.0) * 2.1) - 0.003 * sin(x * 17.0)) / 0.0105;
    float through = ldS(front - 0.015, front + 0.015, x) * sat(uCue * 1.5) * (1.0 - odd * on);
    col *= 1.0 - 0.45 * through * ldS(2.6, 0.4, abs(cd + 1.3));
    vec3 silk = mix(uKind[4], vec3(0.8, 0.6, 0.45), 0.3) * (0.6 + 0.4 * sat(0.5 + cd * 0.5)) * lit + 0.55 * pow(sat(1.0 - abs(cd - 0.3)), 3.0) * (0.75 + 0.25 * sin((x * 60.0 + cd * 0.6) * TAU));
    col = mix(col, silk, through * ldS(1.0 + ldPx / 0.0105, 0.9, abs(cd)));
    float d = (p.y - looseY - arc) / (0.33 * ldP);
    float lo = ldS(1.0 + ldPx / (0.33 * ldP), 0.8, abs(d)) * ldS(0.0, 0.2, f) * (1.0 - mod(i + K, 2.0) * on);
    vec4 m0 = piece(vec2((K + 0.5) / ldN, sat((x + 0.85) / 1.35)));
    vec3 wc = vec3(0.86, 0.8, 0.69) * ldDye(m0.rgb / max(m0.a, 0.05), sat(m0.a));
    if (uOwn[7] != 0.0) wc = mix(wc, mix(uOwn[7] > 0.0 ? ldSett(K) : uKind[2], m0.rgb / max(m0.a, 0.05), 0.7 * sat(m0.a)), abs(uOwn[7]));
    col *= 1.0 - 0.3 * ldS(2.6, 0.5, abs(d + 1.2)) * ldS(0.0, 0.2, f);
    col = mix(col, wc * lit * (0.55 + 0.5 * sat(0.6 + d * 0.5)), lo);
  }
  if (u < 0.45 && v < K + 1.0) {
    float av = TAU * v / ldN; // whole turns a loop, so nothing leaps as it begins again
    u += (0.1 * sin(av * 2.0 + x * 9.0) + 0.06 * sin(av * 5.0 - x * 31.0)) * ldS(0.0, 2.0, abs(u)) * ldS(0.0, 3.0, q - v);
    vec2 sag = vec2(0.0);
    if (open > 0.0) {
      sag = open * vec2(0.26 * sin(av * 3.0 + u * 1.3) + 0.14 * sin(av * 8.0 - u * 2.1), 0.24 * sin(u * 0.33 + av * 2.0) + 0.14 * sin(u * 0.9 - av * 5.0)) * ldS(0.0, 2.0, abs(u)) * ldS(0.5, 4.0, q - v);
      u += sag.x; v += sag.y;
    }
    float k = floor(v), i = min(floor(u), -1.0), kk = mod(k, ldN);
    float fx = u - i - 0.5, fy = v - k - 0.5;
    float room = sat((x + 0.85) / 1.35);
    float at = fract(v / ldN);
    vec4 m = piece(vec2(at, room));
    float st = ldS(0.1, 0.5, m.a);
    float hk = hash11(kk + 1.3);
    vec4 md = piece(vec2((kk + 0.5) / ldN, sat(room + (hk - 0.5) * 0.07)));
    float take = ldS(0.42 * hash11(kk + 7.7), 0.42 * hash11(kk + 7.7) + 0.4, md.a);
    vec3 dye = ldDye(md.rgb / max(md.a, 0.05), take * 0.95);
    float sx = fx < 0.0 ? -1.0 : 1.0, sy = fy < 0.0 ? -1.0 : 1.0;
    float a = ldCross(i, k, st), b = ldCross(i, k + sy, st), c = ldCross(i + sx, k, st);
    float ey = 2.0 * abs(fy), ex2 = 2.0 * abs(fx);
    float hw = a + (b - a) * 0.5 * ey * ey, hf = 1.0 - (a + (c - a) * 0.5 * ex2 * ex2);
    float rw = 0.43 + 0.03 * hash11(i + 0.7) + 0.035 * sin(av * 4.0 + i * 2.3), rf = 0.44 + 0.03 * hk + 0.035 * sin(u * 0.7 + kk * 2.9);
    if (uOwn[1] != 0.0 || uOwn[6] != 0.0) {
      rw = rw * (1.0 - 0.66 * open) + 0.04 * cane; rf = rf * (1.0 - 0.66 * open) + 0.04 * cane;
    }
    float tx = clamp(fx / rw, -1.0, 1.0), ty = clamp(fy / rf, -1.0, 1.0);
    float gone = step(0.999, abs(tx)), goneF = step(0.999, abs(ty));
    if (cane > 0.0) { tx = mix(tx, tx * tx * tx * tx * tx, cane); ty = mix(ty, ty * ty * ty * ty * ty, cane); }
    float zx = sqrt(max(1.0 - tx * tx, 0.0)), zy = sqrt(max(1.0 - ty * ty, 0.0));
    float zw = hw + 0.75 * zx - gone, zf = hf + 0.75 * zy - goneF;
    float top = ldS(-0.06 - w * 1.2, 0.06 + w * 1.2, zw - zf);
    vec3 nw = vec3(tx, -(b - a) * ey * sy * 0.9, zx + 0.25);
    float ply = (1.0 - cane) * (1.0 - 0.75 * wire);
    nw.x += 0.3 * sin((v * 2.0 + fx * 2.4) * TAU) * grain * ply;
    vec3 nf = vec3((c - a) * ex2 * sx * 0.9, ty, zy + 0.25);
    nf.y += 0.3 * sin((u * 2.0 - fy * 2.4) * TAU) * grain * ply;
    vec3 n = normalize(mix(nf, nw, top));
    float z = max(zw, zf);
    vec3 warpC = vec3(0.93, 0.89, 0.8) * (0.95 + 0.1 * hash11(i + 2.0)) * ldWarpDye(i);
    vec3 weftC = vec3(0.86, 0.8, 0.69) * (0.94 + 0.12 * hk - 0.1 * ldHerring(k)) * dye;
    if (uOwn[7] != 0.0) {
      vec3 wa = uOwn[7] > 0.0 ? ldSett(i) : uKind[1], we = uOwn[7] > 0.0 ? ldSett(kk) : uKind[2];
      warpC = mix(warpC, wa * (0.9 + 0.2 * hash11(i + 2.0)), abs(uOwn[7]));
      weftC = mix(weftC, mix(we, md.rgb / max(md.a, 0.05), 0.75 * take) * (0.9 + 0.2 * hk), abs(uOwn[7]));
    }
    if (cane > 0.0) {
      warpC *= 1.0 + cane * 0.7 * (noise(vec2(fx * 15.0 + i * 5.0, (kk + fy) * 0.5)) - 0.5);
      weftC *= 1.0 + cane * 0.7 * (noise(vec2(u * 0.5, fy * 15.0 + kk * 5.0)) - 0.5);
    }
    // at the selvedge the weft turns back round the last warp
    float turn = u > 0.0 ? ldS(1.0, 0.8, length(vec2(u / 0.42, fy / rf))) : 1.0;
    if (u > 0.0) { top = 0.0; n = normalize(vec3(u * 2.4, ty, 0.6)); z = 1.2; }
    vec3 base = mix(weftC, warpC, top);
    float ao = mix(0.62, 1.0, ldS(0.0, 1.15, z));
    float lam = sat(dot(n, L));
    float sheen = pow(sat(dot(n, normalize(L + vec3(0.0, 0.0, 1.0)))), 24.0);
    float tone = mix(0.76, 0.46 + 0.6 * lam, grain) * mix(0.85, ao, grain);
    vec3 cloth = base * lit * tone + sheen * grain * sun * (0.05 + 0.3 * uHigh) * mix(vec3(1.0), base, 0.4);
    if (wire > 0.0) {
      float e = dot(n, normalize(vec3(-0.5, 0.45, 0.75)));
      vec3 metal = base * lit * (0.1 + 0.3 * sat(lam) + 0.75 * ldS(0.35, 0.95, e)) + mix(base, vec3(1.0), 0.45) * lit * (0.85 + 0.5 * uHigh) * ldS(0.88, 1.0, e);
      cloth = mix(cloth, metal * mix(0.6, ao, grain), wire);
    }
    if (fat > 0.0) {
      vec2 d = vec2(fx, fy) + 0.22 * (vec2(noise(vec2(u, kk + fy) * 3.1), noise(vec2(u + 40.0, kk + fy) * 3.1)) - 0.5);
      float rr = 4.0 * dot(d, d), hair = noise(vec2(u * 2.0 + 3.0 * d.y, kk + fy) * 8.0);
      vec3 tuft = mix(weftC, warpC, step(0.5, a)) * lit * (0.36 + 0.75 * exp(-rr * 1.1) + 0.5 * dot(d, vec2(-0.75, 0.6))) * (0.65 + 0.6 * hair);
      cloth = mix(cloth, mix(base * lit * 0.72, tuft, grain), fat);
    }
    float held = 1.0;
    if (open > 0.0) {
      vec2 sf = abs(fract(vec2(u + 0.3 + 0.1 * open, v + 0.28)) - 0.5);
      float shade = max(ldS(rw + 0.15, rw - 0.05, sf.x), ldS(rf + 0.15, rf - 0.05, sf.y));
      held = mix(mix(1.0, 2.4 * (rw + rf) - 4.0 * rw * rf, open), max(ldS(rw + w, rw - w, abs(fx)), ldS(rf + w, rf - w, abs(fy))), grain);
      held = max(held, 1.0 - ldS(0.0, 0.12, open));
      col *= 1.0 - 0.4 * shade * (0.4 + 0.6 * sun) * (1.0 - 0.8 * back) * grain * ldS(0.0, 0.3, q - v);
    }
    if (back > 0.0) {
      float thin = 1.0 - mix(zy, zx, top) * 0.75;
      cloth = mix(cloth, base * (0.3 + 0.7 * base) * lit * mix(0.85, 0.42 + 1.1 * thin * thin, grain), back);
    }
    if (ldStir > 0.0) cloth += (0.12 + base) * mix(uKind[4], vec3(1.0), 0.3) * (0.15 + lit) * ldRing() * (0.2 + 0.65 * z) * 0.55;
    // it curves away at the selvedge and is darker under the fell
    cloth *= mix(0.82, 1.0, ldS(0.0, 1.5, -u)) * mix(0.8, 1.0, ldS(-1.0, 1.0, q - v));
    // the pick just thrown is taken into the cloth little by little
    col = mix(col, cloth, turn * (k < K ? 1.0 : ldS(0.35, 1.0, f)) * held);
  }
  if (p.x < ldEdge) col *= ldFold;
  col = mix(col, ldGround(vec3(0.75), 0.13) * lit, ldFar);
  // shuttle, lying on the board
  vec2 lie = vec2(0.705 + ldEdge - 0.5 + 2.5 * ldOut, -0.1), g = rot(0.13) * (p - lie);
  float L2 = 0.29;
  float t = sat(1.0 - g.y * g.y / (L2 * L2));
  float hwid = 0.044 * sqrt(t) * (0.35 + 0.65 * t);
  vec2 gs = rot(0.13) * (p - lie - vec2(0.022, -0.016));
  float ts = sat(1.0 - gs.y * gs.y / (L2 * L2));
  float hs = 0.046 * sqrt(ts) * (0.35 + 0.65 * ts);
  if (p.x > ldEdge) {
    col *= 1.0 - 0.5 * ldS(0.016, -0.016, abs(gs.x) - hs) * ldS(0.0, 0.08, ts) * (0.4 + 0.6 * sun);
    float ins = ldS(ldPx, -ldPx, abs(g.x) - hwid) * step(0.001, t);
    float nx = clamp(g.x / max(hwid, 0.004), -1.0, 1.0);
    vec3 wood = vec3(0.66, 0.46, 0.28) * (0.84 + 0.3 * noise(vec2(g.x * 90.0 + sin(g.y * 9.0), g.y * 5.0)));
    float l = sat(dot(normalize(vec3(nx, 0.25, sqrt(max(1.0 - nx * nx, 0.0)) + 0.3)), L));
    vec3 wc = wood * lit * (0.5 + 0.62 * l) + 0.18 * pow(sat(1.0 - abs(nx + 0.45)), 14.0) * lit;
    vec2 sl = abs(g) - vec2(0.02, 0.12);
    float slot = length(max(sl, -0.012) + 0.012) - 0.012;
    col = mix(col, wc, ins);
    col = mix(col, vec3(0.16, 0.11, 0.08) * lit, ldS(ldPx, -ldPx, slot) * ins);
    float bl = ldS(ldPx, -ldPx, abs(g.x) - 0.016 * sqrt(sat(1.0 - g.y * g.y * g.y * g.y / 0.000157)));
    float bn = clamp(g.x / 0.016, -1.0, 1.0);
    vec3 yarn = vec3(0.84, 0.77, 0.64) * ldDye(uKind[3], 0.25 + 0.6 * uPhrase);
    yarn *= lit * (0.45 + 0.6 * sat(dot(vec3(bn, 0.0, sqrt(1.0 - bn * bn)), L))) * (0.86 + 0.14 * sin(g.y * 700.0 + g.x * 90.0));
    col = mix(col, yarn, bl * ins);
    // the thread from its eye to the cloth
    float reach = 0.185 + 2.5 * ldOut, s = (p.x - ldEdge) / reach;
    if (s < 1.0) {
      float y0 = ldFell + 0.3 * ldP * cos(TAU * f), dy = -0.015 - y0, sag = -0.16 * s * (1.0 - s) * (1.0 - 0.5 * s);
      float sl2 = (dy - 0.16 * (1.0 - 3.0 * s + 1.5 * s * s)) / reach, d = (p.y - y0 - dy * s - sag) / sqrt(1.0 + sl2 * sl2);
      col *= 1.0 - 0.4 * ldS(0.012, 0.0, abs(d + 0.013)) * (1.0 - ins);
      vec3 tc = vec3(0.93, 0.87, 0.76) * lit * (0.8 + 0.25 * d / 0.0045 + 0.1 * sin((s * 34.0 + d * 120.0) * TAU));
      col = mix(col, tc, ldS(0.0045 + ldPx, 0.0045 - ldPx, abs(d)));
    }
  }
  return col;
}
float ldInk(vec2 f, float size, float seed) {
  vec2 o = (vec2(hash11(seed), hash11(seed + 3.1)) - 0.5) * 0.1;
  float rd = 0.1;
  if (uOwn[1] > 0.0) { o *= 1.0 + 4.5 * uOwn[1]; size *= 1.0 - uOwn[1] * (0.15 + 0.35 * hash11(seed + 7.7)); rd = mix(rd, size, uOwn[1]); }
  if (uOwn[1] < 0.0) { o *= 1.0 + 0.8 * uOwn[1]; size = mix(size, 0.485, -uOwn[1]); rd = mix(rd, 0.04, -uOwn[1]); }
  if (uOwn[6] > 0.0) { o *= 1.0 - 0.7 * uOwn[6]; rd = mix(rd, size, uOwn[6]); }
  vec2 d = abs(f + o) - size + rd;
  float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - rd;
  float w = ldPx / ldP;
  if (uOwn[6] < 0.0) {
    vec2 x = vec2(f.x - f.y, f.x + f.y) * 0.7071;
    float st = min(max(abs(x.x) - 0.17, abs(x.y) - 0.6), max(abs(x.y) - 0.17, abs(x.x) - 0.6));
    e = mix(e, st, -uOwn[6]);
  }
  float body = ldS(w, -w, e);
  return body * (0.86 + 0.2 * ldS(-0.18, -0.02, e));
}
vec3 ldPaper(vec2 p) {
  float sun = ldSun((uOwn[2] > 0.0 ? ldAt : p) * vec2(0.9, 1.0) + vec2(0.1, 0.0));
  vec3 lit = ldLight(mix(vec3(0.79, 0.795, 0.815), vec3(1.05, 1.03, 0.99) * (1.0 + 0.03 * uMic), sun), sun);
  float many = 0.0195 / ldP, bead = max(uOwn[6], 0.0), stitch = max(-uOwn[6], 0.0), night = max(uOwn[4], 0.0), back = max(-uOwn[4], 0.0);
  vec2 g = rot(0.022) * p;
  vec3 paper = vec3(0.945, 0.92, 0.855) * (0.97 + 0.04 * noise(p * 260.0) + 0.03 * noise(p * 5.0));
  paper = ldGround(paper, 0.1);
  vec2 c = vec2((g.x - ldEdge) / ldP, (ldFell - g.y) / ldP);
  float w = ldPx / ldP;
  float grain = sat(1.3 - w * 2.2);
  vec2 f = fract(c) - 0.5, id = floor(c);
  vec2 near = 0.5 - abs(f);
  float ln = max(ldS(0.05 + w, 0.0, near.x), ldS(0.05 + w, 0.0, near.y));
  vec2 c8 = abs(fract(c / 8.0 + 0.5) - 0.5) * 8.0;
  float ln8 = max(ldS(0.08 + w, 0.0, c8.x), ldS(0.08 + w, 0.0, c8.y));
  float bare = 1.0 - abs(uOwn[6]); ln *= bare; ln8 *= bare;
  vec3 col = paper * mix(vec3(1.0), vec3(0.74, 0.8, 0.85), mix(0.35, ln, grain) * 0.6);
  col *= mix(vec3(1.0), vec3(0.68, 0.74, 0.82), ln8 * 0.55 * grain);
  if (night > 0.0) col += night * (0.16 * ln + 0.22 * ln8) * grain * (0.3 + paper * 3.0);
  if (stitch > 0.0) {
    vec2 th = abs(fract(c * 4.0) - 0.5), hole = 0.5 - abs(f);
    col *= 1.0 + stitch * grain * (0.22 * (mod(floor(c.x * 4.0) + floor(c.y * 4.0), 2.0) < 0.5 ? th.x : th.y) - 0.06 - 0.5 * ldS(0.15, 0.03, length(hole)));
  }
  vec3 ink = vec3(0.12, 0.14, 0.2);
  if (night > 0.0) ink = mix(ink, vec3(0.84, 0.86, 0.88), night);
  if (uOwn[7] < 0.0) ink = mix(ink, uKind[1] * (1.0 + 0.25 * night), -uOwn[7]);
  float rows = uOwn[0] == 0.0 ? 36.0 : max(floor(36.0 * many + 0.5), 10.0);
  float figs = rows / max(floor(rows / 20.0 + 0.01), 1.0);
  float seed = id.x * 3.7 + id.y * 11.3;
  float room = sat(((id.x + 0.5) * ldP + ldEdge - 0.6 + 1.45) / 1.45);
  if (uOwn[7] > 0.0) ink = mix(ink, ldSett(24.0 * hash21(floor(vec2(id.x, mod(id.y, rows)) / figs + 0.25) + 64.0)) * (1.0 + 0.25 * night), uOwn[7]);
  float now = uLoop * rows;
  float a = 0.0; vec3 pig = ink;
  if (id.x < 0.0 && id.y >= 0.0) {
    // the drawdown
    float kr = mod(id.y, rows);
    vec4 m = piece(vec2((kr + 0.5) / rows, room));
    float age = fract(uLoop - (kr + 0.5) / rows);
    float fresh = exp(-age * 2.2);
    float loud = ldS(0.06, 0.55, m.a);
    float on = ldUp(id.x, kr);
    if (uOwn[3] != 0.0) { float fg = ldFig(id.x, kr, figs); if (fg < 1.5) on = fg; }
    vec3 mc = m.rgb / max(m.a, 0.05);
    pig = mix(ink, mc * (0.8 + 0.4 * max(night, 0.5 * stitch)), 0.75 * loud);
    a = on * ldInk(f, 0.38 + 0.09 * loud, seed) * (0.84 + 0.2 * hash11(seed + 8.0)) * mix(0.72 + 0.35 * fresh * (0.6 + 0.9 * uEnergy), 0.96, loud) * (0.85 + 0.15 * uTone);
    col = mix(col, col * ldDye(mc, 1.0), (0.2 + 0.16 * hash11(seed + 5.0)) * loud * (1.0 - on) * ldInk(f, 0.47, seed));
    float run = mix(-0.45, 0.6, 1.0 - uHits);
    float hit = uHits * ldS(0.3, 0.05, abs((id.x + 0.5) * ldP + 0.6 - run)) * ldS(-6.0, -1.0, id.y - now) * ldS(1.5, 0.5, id.y - now);
    hit = sat(hit * 1.5);
    pig = mix(pig, uKind[4] * 0.82, hit); a = mix(a, (0.4 + 0.5 * on) * ldInk(f, 0.46, seed), hit);
  } else if (id.x < 0.0 && id.y < -1.5 && id.y > -9.5) {
    float on = step(abs(ldShaft(id.x) - (-2.0 - id.y)), 0.5);
    float b = band(sat((g.x + 0.85) / 1.45));
    a = on * ldInk(f, 0.34 + 0.13 * b, seed) * (0.6 + 0.4 * b);
    pig = mix(ink, vec3(0.72, 0.2, 0.13), sat(0.15 + b));
  } else if (id.x > 1.5 && id.x < 9.5 && id.y >= 0.0) {
    float kr = mod(id.y, rows), t = id.x - 2.0;
    float on = step(abs(ldTread(kr) - t), 0.5);
    float lv = t < 2.0 ? uDrone : t < 4.0 ? uPad : t < 6.0 ? uTexture : uPhrase;
    pig = mix(ink, kindColour(floor(t * 0.5)) * 0.85, sat(0.2 + lv));
    a = on * ldInk(f, 0.46, seed) * (0.85 + 0.1 * lv);
  } else if (id.x > 1.5 && id.x < 9.5 && id.y < -1.5 && id.y > -9.5) {
    float on = ldTie((-2.0 - id.y) - (id.x - 2.0));
    a = on * ldInk(f, 0.4, seed) * 0.85;
    pig = mix(ink, vec3(0.72, 0.2, 0.13), uKeys);
  }
  // a cue lays a wash along eight rows
  vec2 wq = vec2(g.x - mix(-0.3, 0.75, sat((1.0 - uCue) * 1.3)), id.y + 0.5 - clamp(now, 5.0, 31.0));
  float wash = sat(uCue * 1.6) * ldS(0.02, -0.02, wq.x + 0.02 * sin(id.y * 5.0)) * step(abs(wq.y), 4.0) * step(id.x, -0.5);
  col *= mix(vec3(1.0), ldDye(uKind[4], 0.9), wash * (0.65 + 0.2 * hash11(id.y) + 0.15 * ldS(-0.1, 0.0, wq.x)));
  if (bead > 0.0 && id.x < 0.0 && id.y >= 0.0) {
    vec2 b = f / 0.47;
    float rr = dot(b, b), z = sqrt(max(1.0 - rr, 0.0)), in1 = ldS(1.0 + 2.5 * w, 1.0 - 2.5 * w, rr);
    vec3 blank = mix(paper, vec3(0.5) * (0.2 + paper), 0.3), hue = mix(blank, pig, sat(a * 1.1));
    float face = sat(dot(vec3(b.x, -b.y, z), normalize(vec3(-0.5, 0.6, 0.62))));
    vec3 gl = hue * (0.28 + 0.6 * face) + hue * hue * 1.1 * pow(sat(0.5 + 0.45 * dot(b, vec2(0.6, 0.6)) + 0.1), 3.0) + 0.9 * pow(face, 40.0) + 0.1 * pow(1.0 - z, 3.0);
    gl *= 1.0 - 0.75 * ldS(0.2, 0.05, length(b));
    gl = mix(hue * 0.75, gl, grain);
    col = mix(col, mix(col * (1.0 - 0.55 * ldS(1.5, 0.6, length(b - vec2(0.2, 0.25)))), gl, in1), bead);
    a *= 1.0 - bead;
  }
  if (stitch > 0.0) {           
    vec2 x = vec2(f.x - f.y, f.x + f.y) * 0.7071;
    float over = ldS(0.2, 0.17, abs(x.x)), t = over > 0.5 ? x.x : x.y, along = over > 0.5 ? x.y : x.x;
    float rise = 1.0 - 0.55 * t * t / 0.029;
    pig = mix(pig, pig * (0.5 + 0.6 * sat(rise) + 0.08 * grain * sin((along * 7.0 + t * 4.0) * TAU)) * (over > 0.5 ? 1.08 : 0.85 - 0.3 * ldS(0.32, 0.17, abs(x.x))) + 0.05, stitch);
    float lo = ldInk(f + vec2(-0.1, -0.12), 0.46, seed);
    col *= 1.0 - 0.4 * stitch * lo * step(0.01, a) * (1.0 - a) * grain;
  }
  if (ldStir > 0.0 && id.x < 0.0 && id.y >= 0.0) {
    float rg = sat(ldRing() * 1.3);
    pig = mix(pig, uKind[4] * (0.85 + 0.45 * night), rg);
    col = mix(col, uKind[4] * (0.8 + 0.3 * bead), rg * (0.3 + 0.4 * bead) * ldInk(f, 0.44, seed) * (1.0 - a));
  }
  if (back > 0.0) pig = mix(pig, paper * (0.25 + 1.1 * pig), 0.7 * back);
  col = mix(col, pig * (0.9 + 0.25 * noise(p * 60.0)), a * mix(0.8, 1.0, grain));
  col *= lit;
  // the reading strip, a card laid under the row that sounds
  float seen = ldS(0.0, 0.03, uLoop) * ldS(1.0, 0.97, uLoop);
  float ry = ldFell - (now + 2.75) * ldP - g.y, rx = g.x - 0.845 + 6.0 * ldOut;
  float card = ldS(ldPx, -ldPx, max(abs(ry - 0.017) - 0.017, rx)) * seen;
  float csh = ldS(0.02, -0.006, max(abs(ry - 0.024) - 0.017, rx - 0.008)) * seen;
  col *= 1.0 - 0.42 * csh * (0.4 + 0.6 * sun);
  vec3 cc = vec3(0.86, 0.79, 0.66) * (0.95 + 0.06 * noise(g * vec2(60.0, 400.0))) * lit;
  cc *= 1.0 - 0.5 * ldS(ldPx * 1.2, 0.0, abs(fract(c.x) - 0.5) * ldP) * step(ry, mod(id.x, 8.0) < 0.5 ? 0.014 : 0.008);
  cc *= 1.0 + 0.12 * ldS(0.003, 0.0, ry);
  col = mix(col, cc, card);
  // a pencil left on the sheet
  vec2 e = rot(-0.3) * (p - vec2(0.66 + 6.0 * ldOut, -0.375));
  float pw2 = 0.0135 * sat((e.x + 0.21) / 0.045), pe = max(max(abs(e.y) - pw2, e.x - 0.5), -0.205 - e.x);
  vec2 es = e + vec2(-0.006, 0.014);
  col *= 1.0 - 0.45 * ldS(0.012, -0.008, max(abs(es.y) - 0.0135 * sat((es.x + 0.21) / 0.045), max(es.x - 0.5, -0.2 - es.x))) * (0.4 + 0.6 * sun);
  float face = e.y > 0.005 ? 1.12 : e.y > -0.005 ? 0.9 : 0.6;
  vec3 pc = e.x < -0.195 ? vec3(0.2) : e.x < -0.158 + 0.006 * cos(e.y * 700.0) ? vec3(0.86, 0.68, 0.46) : vec3(0.62, 0.16, 0.11);
  col = mix(col, pc * face * lit, ldS(ldPx, -ldPx, pe));
  return col;
}
vec3 render(vec2 p) {
  ldPx = 1.0 / uRes.y;
  ldP = 0.0195;
  if (uOwn[0] != 0.0) ldP *= exp2(-uOwn[0] * (uOwn[0] > 0.0 ? 0.85 : 1.6));
  ldAt = p; ldStir = sat(2.0 * (abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7]))); ldFold = 1.0; ldFar = 0.0; ldOut = 0.0;
  if (uVar < 0.5) { ldFell = 0.1; ldEdge = 0.5; } else { ldFell = 0.26; ldEdge = 0.6; ldOut = sat(abs(uOwn[6]) * 1.3); }
  if (uOwn[2] > 0.0) {
    float z = 1.0 / max(1.0 - 1.55 * uOwn[2] * p.y, 0.11);
    p *= z; ldPx *= max(z, 0.3 * z * z); ldFar = 0.85 * uOwn[2] * ldS(1.6, 6.5, z);
    ldEdge += uOwn[2] * (uVar < 0.5 ? 2.2 : 2.0); ldOut = max(ldOut, uOwn[2]);
  }
  if (uOwn[2] < 0.0) {
    float h = -uOwn[2], x = p.x * 6.5 + 0.7 * sin(p.y * 1.7 + uTime * 0.23) + uTime * 0.11, y = p.x * 15.0 - p.y * 1.3 - uTime * 0.17;
    float on = uVar < 0.5 ? ldS(0.5, 0.2, p.x) : 1.0;
    p.x += h * on * (0.055 * sin(x) + 0.02 * sin(y)); p.y -= h * on * 0.03 * cos(x);
    ldFold = 1.0 + h * on * (0.36 * cos(x) + 0.26 * cos(y) - 0.1);
    ldOut = max(ldOut, h);
  }
  if (uVar < 0.5) return ldLinen(p);
  ldEdge += 0.75 * ldOut; ldFell += 0.5 * ldOut + 5.0 * max(uOwn[2], 0.0);
  vec3 c = ldPaper(p);
  return mix(c * ldFold, ldGround(vec3(0.85), 0.1), ldFar);
}
