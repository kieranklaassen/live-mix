// name: Shed and shuttle
// a: Linen
// b: Point paper
// what: Cream cloth on a loom in window light, every thread lying over or under its neighbour; above the last pick the bare warp hangs taut over a grey board, a stick through it, and a wooden shuttle lies beside; or the weaver's plan on ruled paper: threading above, treadling at the side and the pattern in small squares of ink.
// follows: The cloth is what was just heard, read down from the playhead: where the piece sounds, plain weave turns to twill and takes its dye; or a ruler reads down the plan. Kinds tint their warps or treadles, bands lift the warp or redden the threading, highs shine on thread. A hit opens the shed or wets a few squares; a cue throws a weft or lays a wash.
const float ldN = 24.0;       // picks a loop
const float ldP = 0.0195;     // from one thread to the next
const float ldFell = 0.1, ldEdge = 0.5; // the last pick, and the right selvedge
float ldPx;
// From 0 at a to 1 at b, whichever is the greater.
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
float ldCross(float i, float k, float s) { return mix(mod(i + k, 2.0), step(mod(ldShaft(i) - ldTread(mod(k, ldN)), 4.0), 1.5), max(s, ldHerring(k))); }
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
  return s;
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
  float sun = ldSun(p);
  vec3 L = normalize(vec3(-0.8, 0.42, mix(0.62, 0.38, uTone)));
  vec3 lit = mix(vec3(0.68, 0.7, 0.745), vec3(1.16, 1.11, 1.02) * (1.0 + 0.03 * uMic), sun);
  float q = uLoop * ldN, K = floor(q), f = q - K;
  float above = p.y - ldFell;
  // the table: pale grey board
  vec3 col = vec3(0.76, 0.755, 0.74) * (0.965 + 0.05 * noise(p * vec2(240.0, 30.0)) + 0.03 * noise(p * 9.0));
  float fan = 1.0 - 0.045 * max(above, 0.0); // the bare warp spreads a little towards the reed
  float x = p.x;
  float u = (x * fan - ldEdge) / ldP;
  float grain = sat(1.25 - ldPx / ldP * 2.2);       // 0 when a thread is near a pixel
  float w = fwidth(p.y) / ldP;
  // picks counted down the cloth, the last one beaten in not quite straight
  float v = q + above / ldP + 0.1 * sin(u * 0.43) + 0.07 * sin(u * 1.1 + 2.0);
  // shadow the cloth throws on the board
  col *= lit * (1.0 - 0.5 * ldS(0.05, 0.0, x - ldEdge) * ldS(ldFell, ldFell - 0.04, p.y));
  // the pick that lies loose in its bow above the cloth, and how it is beaten down
  float bow = (1.0 - f) * (1.0 - f);
  float looseY = ldFell + (0.5 - f) * ldP;
  float s01 = (x + 1.0) / (ldEdge + 1.0);
  float arc = 0.024 * bow * sat(s01 * (1.0 - s01) * 4.0 + 0.35 * s01);
  float band0 = band(sat((x + 0.85) / 1.35));
  if (u < 0.0 && v >= K) {
    // bare warp over the board
    float bend = uKeys * 0.45 * sin(PI * sat(above / 0.4)) * step(0.72, hash11(floor(u) + 5.0));
    float i = floor(u), fx = u - i - 0.5;
    float lift = 0.45 + 1.0 * band0 * (0.5 + uEnergy);
    float us = u - lift * 0.9 - 0.2;
    float fs = fract(us) - 0.5;
    float blur = 0.12 + 0.16 * lift;
    float sh = ldS(0.2 + blur, 0.2 - blur * 0.6, abs(fs));
    sh *= ldS(-0.2, 0.4, -us) * 0.42 / (0.7 + lift);
    col *= 1.0 - mix(0.2, sh, grain) * (0.35 + 0.65 * sun);
    // a hit: the shed, a wedge of shadow
    float wedge = ldS(0.0, 0.02, above) * ldS(0.14, 0.03, above);
    float shed = max(uHits, 0.8 * uCue) * wedge * ldS(-0.95, -0.1, x) * ldS(0.02, 0.0, x - ldEdge);
    col *= 1.0 - 0.62 * shed;
    float odd = mod(i, 2.0);
    // the round stick that keeps the cross: every other warp runs over it
    float ry = (p.y - 0.385 - 0.012 * x) / 0.017;
    float rod = ldS(1.0 + ldPx / 0.017, 1.0 - ldPx / 0.017, abs(ry));
    float rsh = ldS(1.9, 0.6, abs(ry + 1.5)) * 0.45;
    col *= 1.0 - rsh;
    float rz = sqrt(max(1.0 - ry * ry, 0.0));
    vec3 wood = vec3(0.62, 0.44, 0.28) * (0.86 + 0.28 * noise(vec2(x * 14.0, ry * 3.0 + 4.0)));
    wood *= lit * (0.55 + 0.5 * sat(dot(vec3(0.0, ry, rz), L) + 0.15)) + 0.12 * pow(sat(rz * 0.75 + ry * 0.6), 18.0) * sun;
    col = mix(col, wood, rod);
    // the thread itself
    fx += bend - 0.5 * bend * bend;
    float r = 0.25 + 0.03 * sin(p.y * 260.0 + i * 2.1);
    float on = ldS(r + w, r - w * 0.6, abs(fx)) * (1.0 - rod * (1.0 - odd));
    float nx = clamp(fx / r, -1.0, 1.0);
    float nz = sqrt(1.0 - nx * nx * 0.98);
    nx += 0.35 * sin((p.y / ldP * 2.0 + fx * 3.0) * TAU) * grain * nz;
    vec3 c = vec3(0.93, 0.89, 0.8) * (0.95 + 0.1 * hash11(i + 2.0)) * ldWarpDye(i);
    vec3 sha = lit * (0.5 + 0.62 * sat(dot(vec3(nx, 0.0, nz), L)));
    sha *= 1.0 + shed * mix(-0.45, 0.35, odd) + 0.14 * odd * uKeys * step(0.72, hash11(i + 5.0));
    col = mix(col, c * sha, mix(0.5, on, grain));
    // a cue throws a glossy weft through the open shed
    float front = mix(0.1, -1.3, sat((1.0 - uCue) * 1.5));
    float cd = (p.y - ldFell - 0.034 - 0.02 * sin((x + 1.0) * 2.1) - 0.003 * sin(x * 17.0)) / 0.0105;
    float through = ldS(front - 0.015, front + 0.015, x) * sat(uCue * 1.5) * (1.0 - odd * on);
    col *= 1.0 - 0.45 * through * ldS(2.6, 0.4, abs(cd + 1.3));
    vec3 silk = mix(uKind[4], vec3(0.8, 0.6, 0.45), 0.3) * (0.6 + 0.4 * sat(0.5 + cd * 0.5)) * lit + 0.55 * pow(sat(1.0 - abs(cd - 0.3)), 3.0) * (0.75 + 0.25 * sin((x * 60.0 + cd * 0.6) * TAU));
    col = mix(col, silk, through * ldS(1.0 + ldPx / 0.0105, 0.9, abs(cd)));
    // the loose pick
    float d = (p.y - looseY - arc) / (0.33 * ldP);
    float lo = ldS(1.0 + ldPx / (0.33 * ldP), 0.8, abs(d)) * ldS(0.0, 0.2, f) * (1.0 - mod(i + K, 2.0) * on);
    vec4 m0 = piece(vec2((K + 0.5) / ldN, sat((x + 0.85) / 1.35)));
    vec3 wc = vec3(0.86, 0.8, 0.69) * ldDye(m0.rgb / max(m0.a, 0.05), sat(m0.a));
    col *= 1.0 - 0.3 * ldS(2.6, 0.5, abs(d + 1.2)) * ldS(0.0, 0.2, f);
    col = mix(col, wc * lit * (0.55 + 0.5 * sat(0.6 + d * 0.5)), lo);
  }
  if (u < 0.45 && v < K + 1.0) {
    // the cloth
    float av = TAU * v / ldN; // whole turns a loop, so nothing leaps as it begins again
    u += (0.1 * sin(av * 2.0 + x * 9.0) + 0.06 * sin(av * 5.0 - x * 31.0)) * ldS(0.0, 2.0, abs(u)) * ldS(0.0, 3.0, q - v);
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
    float tx = clamp(fx / rw, -1.0, 1.0), ty = clamp(fy / rf, -1.0, 1.0);
    float zx = sqrt(1.0 - tx * tx), zy = sqrt(1.0 - ty * ty);
    float zw = hw + 0.75 * zx - step(0.999, abs(tx)), zf = hf + 0.75 * zy - step(0.999, abs(ty));
    float top = ldS(-0.06 - w * 1.2, 0.06 + w * 1.2, zw - zf);
    vec3 nw = vec3(tx, -(b - a) * ey * sy * 0.9, zx + 0.25);
    nw.x += 0.3 * sin((v * 2.0 + fx * 2.4) * TAU) * grain;
    vec3 nf = vec3((c - a) * ex2 * sx * 0.9, ty, zy + 0.25);
    nf.y += 0.3 * sin((u * 2.0 - fy * 2.4) * TAU) * grain;
    vec3 n = normalize(mix(nf, nw, top));
    float z = max(zw, zf);
    vec3 warpC = vec3(0.93, 0.89, 0.8) * (0.95 + 0.1 * hash11(i + 2.0)) * ldWarpDye(i);
    vec3 weftC = vec3(0.86, 0.8, 0.69) * (0.94 + 0.12 * hk - 0.1 * ldHerring(k)) * dye;
    // at the selvedge the weft turns back round the last warp
    float turn = u > 0.0 ? ldS(1.0, 0.8, length(vec2(u / 0.42, fy / rf))) : 1.0;
    if (u > 0.0) { top = 0.0; n = normalize(vec3(u * 2.4, ty, 0.6)); z = 1.2; }
    vec3 base = mix(weftC, warpC, top);
    float ao = mix(0.62, 1.0, ldS(0.0, 1.15, z));
    float lam = sat(dot(n, L));
    float sheen = pow(sat(dot(n, normalize(L + vec3(0.0, 0.0, 1.0)))), 24.0);
    float tone = mix(0.76, 0.46 + 0.6 * lam, grain) * mix(0.85, ao, grain);
    vec3 cloth = base * lit * tone + sheen * grain * sun * (0.05 + 0.3 * uHigh) * mix(vec3(1.0), base, 0.4);
    // it curves away at the selvedge and is darker under the fell
    cloth *= mix(0.82, 1.0, ldS(0.0, 1.5, -u)) * mix(0.8, 1.0, ldS(-1.0, 1.0, q - v));
    // the pick just thrown is taken into the cloth little by little
    col = mix(col, cloth, turn * (k < K ? 1.0 : ldS(0.35, 1.0, f)));
  }
  // shuttle, lying on the board
  vec2 g = rot(0.13) * (p - vec2(0.705, -0.1));
  float L2 = 0.29;
  float t = sat(1.0 - g.y * g.y / (L2 * L2));
  float hwid = 0.044 * sqrt(t) * (0.35 + 0.65 * t);
  vec2 gs = rot(0.13) * (p - vec2(0.705, -0.1) - vec2(0.022, -0.016));
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
    float s = (p.x - ldEdge) / 0.185;
    if (s < 1.0) {
      float y0 = ldFell + 0.3 * ldP * cos(TAU * f), dy = -0.015 - y0, sag = -0.16 * s * (1.0 - s) * (1.0 - 0.5 * s);
      float sl2 = (dy - 0.16 * (1.0 - 3.0 * s + 1.5 * s * s)) / 0.185, d = (p.y - y0 - dy * s - sag) / sqrt(1.0 + sl2 * sl2);
      col *= 1.0 - 0.4 * ldS(0.012, 0.0, abs(d + 0.013)) * (1.0 - ins);
      vec3 tc = vec3(0.93, 0.87, 0.76) * lit * (0.8 + 0.25 * d / 0.0045 + 0.1 * sin((s * 34.0 + d * 120.0) * TAU));
      col = mix(col, tc, ldS(0.0045 + ldPx, 0.0045 - ldPx, abs(d)));
    }
  }
  return col;
}
float ldInk(vec2 f, float size, float seed) {
  vec2 o = (vec2(hash11(seed), hash11(seed + 3.1)) - 0.5) * 0.1;
  vec2 d = abs(f + o) - size + 0.1;
  float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.1;
  float w = ldPx / ldP;
  float body = ldS(w, -w, e);
  return body * (0.86 + 0.2 * ldS(-0.18, -0.02, e));
}
vec3 ldPaper(vec2 p) {
  float sun = ldSun(p * vec2(0.9, 1.0) + vec2(0.1, 0.0));
  vec3 lit = mix(vec3(0.79, 0.795, 0.815), vec3(1.05, 1.03, 0.99) * (1.0 + 0.03 * uMic), sun);
  vec2 g = rot(0.022) * p;
  vec3 paper = vec3(0.945, 0.92, 0.855) * (0.97 + 0.04 * noise(p * 260.0) + 0.03 * noise(p * 5.0));
  vec2 c = vec2((g.x - 0.6) / ldP, (0.26 - g.y) / ldP);
  float w = ldPx / ldP;
  float grain = sat(1.3 - w * 2.2);
  vec2 f = fract(c) - 0.5, id = floor(c);
  // ruling
  vec2 near = 0.5 - abs(f);
  float ln = max(ldS(0.05 + w, 0.0, near.x), ldS(0.05 + w, 0.0, near.y));
  vec2 c8 = abs(fract(c / 8.0 + 0.5) - 0.5) * 8.0;
  float ln8 = max(ldS(0.08 + w, 0.0, c8.x), ldS(0.08 + w, 0.0, c8.y));
  vec3 col = paper * mix(vec3(1.0), vec3(0.74, 0.8, 0.85), mix(0.35, ln, grain) * 0.6);
  col *= mix(vec3(1.0), vec3(0.68, 0.74, 0.82), ln8 * 0.55 * grain);
  vec3 ink = vec3(0.12, 0.14, 0.2);
  const float rows = 36.0;
  float seed = id.x * 3.7 + id.y * 11.3;
  float room = sat(((id.x + 0.5) * ldP + 1.45) / 1.45);
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
    vec3 mc = m.rgb / max(m.a, 0.05);
    pig = mix(ink, mc * 0.8, 0.75 * loud);
    a = on * ldInk(f, 0.38 + 0.09 * loud, seed) * (0.84 + 0.2 * hash11(seed + 8.0)) * mix(0.72 + 0.35 * fresh * (0.6 + 0.9 * uEnergy), 0.96, loud) * (0.85 + 0.15 * uTone);
    col = mix(col, col * ldDye(mc, 1.0), (0.2 + 0.16 * hash11(seed + 5.0)) * loud * (1.0 - on) * ldInk(f, 0.47, seed));
    float run = mix(-0.45, 0.6, 1.0 - uHits);
    float hit = uHits * ldS(0.3, 0.05, abs((id.x + 0.5) * ldP + 0.6 - run)) * ldS(-6.0, -1.0, id.y - now) * ldS(1.5, 0.5, id.y - now);
    hit = sat(hit * 1.5);
    pig = mix(pig, uKind[4] * 0.82, hit); a = mix(a, (0.4 + 0.5 * on) * ldInk(f, 0.46, seed), hit);
  } else if (id.x < 0.0 && id.y < -1.5 && id.y > -9.5) {
    // threading
    float on = step(abs(ldShaft(id.x) - (-2.0 - id.y)), 0.5);
    float b = band(sat((g.x + 0.85) / 1.45));
    a = on * ldInk(f, 0.34 + 0.13 * b, seed) * (0.6 + 0.4 * b);
    pig = mix(ink, vec3(0.72, 0.2, 0.13), sat(0.15 + b));
  } else if (id.x > 1.5 && id.x < 9.5 && id.y >= 0.0) {
    // treadling
    float kr = mod(id.y, rows), t = id.x - 2.0;
    float on = step(abs(ldTread(kr) - t), 0.5);
    float lv = t < 2.0 ? uDrone : t < 4.0 ? uPad : t < 6.0 ? uTexture : uPhrase;
    pig = mix(ink, kindColour(floor(t * 0.5)) * 0.85, sat(0.2 + lv));
    a = on * ldInk(f, 0.46, seed) * (0.85 + 0.1 * lv);
  } else if (id.x > 1.5 && id.x < 9.5 && id.y < -1.5 && id.y > -9.5) {
    // tie-up
    float on = ldTie((-2.0 - id.y) - (id.x - 2.0));
    a = on * ldInk(f, 0.4, seed) * 0.85;
    pig = mix(ink, vec3(0.72, 0.2, 0.13), uKeys);
  }
  // a cue draws one broad wash of colour along eight rows
  vec2 wq = vec2(g.x - mix(-0.3, 0.75, sat((1.0 - uCue) * 1.3)), id.y + 0.5 - clamp(now, 5.0, 31.0));
  float wash = sat(uCue * 1.6) * ldS(0.02, -0.02, wq.x + 0.02 * sin(id.y * 5.0)) * step(abs(wq.y), 4.0) * step(id.x, -0.5);
  col *= mix(vec3(1.0), ldDye(uKind[4], 0.9), wash * (0.65 + 0.2 * hash11(id.y) + 0.15 * ldS(-0.1, 0.0, wq.x)));
  col = mix(col, pig * (0.9 + 0.25 * noise(p * 60.0)), a * mix(0.8, 1.0, grain));
  col *= lit;
  // the reading strip, a card laid under the row that sounds
  float seen = ldS(0.0, 0.03, uLoop) * ldS(1.0, 0.97, uLoop);
  float ry = 0.26 - (now + 2.75) * ldP - g.y, rx = g.x - 0.845;
  float card = ldS(ldPx, -ldPx, max(abs(ry - 0.017) - 0.017, rx)) * seen;
  float csh = ldS(0.02, -0.006, max(abs(ry - 0.024) - 0.017, rx - 0.008)) * seen;
  col *= 1.0 - 0.42 * csh * (0.4 + 0.6 * sun);
  vec3 cc = vec3(0.86, 0.79, 0.66) * (0.95 + 0.06 * noise(g * vec2(60.0, 400.0))) * lit;
  cc *= 1.0 - 0.5 * ldS(ldPx * 1.2, 0.0, abs(fract(c.x) - 0.5) * ldP) * step(ry, mod(id.x, 8.0) < 0.5 ? 0.014 : 0.008);
  cc *= 1.0 + 0.12 * ldS(0.003, 0.0, ry);
  col = mix(col, cc, card);
  // a pencil left on the sheet
  vec2 e = rot(-0.3) * (p - vec2(0.66, -0.375));
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
  return uVar < 0.5 ? ldLinen(p) : ldPaper(p);
}
