// name: Worn floor
// a: Dry stone
// b: Rained on
// what: An old floor of ivory, rose and dark green marble lozenges that read as boxes standing up or sinking in, seen at a slant, chipped, veined and trodden hollow, low window light in one long bar across it; or the same stones in a yard after rain, from straight above, hollow ones holding sky and bare branches, a few leaves fallen.
// follows: The drone warms the rose stones, the pad the ivory, texture the green, in their veins too; a melody lights veins and leaves; the piece polishes the floor or tints the sky. Lows deepen the hollows or raise the water. A hit lights one box, in the rain with a drop. A cue moves the sun across and back, the loop a little. Keys glint, a voice warms, Tone sharpens.
// own: 0 1 a chequer of large squares, -1 crazy paving of broken slabs; 1 1 wedges laid in rings round a middle, -1 herringbone brick; 2 1 rounded cobbles standing up, -1 stones trodden to deep bowls; 3 1 drifted over (a: sand, b: snow), -1 moss and grass in the joints; 4 1 sun through a lattice of panes (b: full sun and the tree's shadow), -1 no sun, even grey light (b: night, a moon in the pools); 5 of a, the eye: 1 low along the floor, -1 from straight above; of b, the water: 1 clear water over all of it, -1 dry; 6 1 many small stones, -1 a few great ones; 7 1 dyed in the sounds' colours, -1 all of one pale stone
const vec2 wfE0 = vec2(0.8660254, 0.5), wfE1 = vec2(-0.8660254, 0.5), wfE2 = vec2(0.0, -1.0);
const vec2 wfS = vec2(1.7320508, 3.0);
vec2 wfMid;   // the middle of the box
float wfK;    // which of its three faces
vec2 wfUV;    // place on the face, 0 to 1 along its two edges
vec2 wfGu, wfGv; // how those two grow over the floor
float wfEdge; // how far in from its edge
vec2 wfOut, wfDish; // straight in from that edge; the slope of a stone that is dished
vec3 wfH;     // three numbers of the stone's own
// A soft step from a to b, whichever is the larger.
float wfStep(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float wfSq(float x) { return x * x; }
// The middle of the box that a place on the floor falls in (a box is one long).
vec2 wfBox(vec2 w) {
  vec2 a = w - wfS * floor(w / wfS + 0.5), b = w - wfS * 0.5;
  b -= wfS * floor(b / wfS + 0.5);
  return w - (dot(a, a) < dot(b, b) ? a : b);
}
// The floor laid another way: wholly at 1, in patches before it.
void wfLaid(vec2 w) {
  float N = 0.02 + 0.96 * noise(w * 0.3 + 30.0), a = abs(uOwn[0]), b = abs(uOwn[1]), e1 = 9.0, seam = 9.0;
  vec2 id = vec2(0.0), size = vec2(1.0), u, gu = vec2(1.0, 0.0), gv = vec2(0.0, 1.0);
  if (b < 1.0 && b > 0.0) seam = abs(b - N) * 2.2;
  if (a < 1.0 && a > 0.0) seam = min(seam, abs(a - N) * 2.2);
  if (b > N && uOwn[1] > 0.0) {          // rings
    vec2 q = w - vec2(0.4, 0.5);
    float l = length(q), i = floor(l / 0.95 + 0.5), many = max(6.0 * i, 1.0), th = fract(atan(q.y, q.x + 1e-5) / TAU + 0.5 + i * 0.137) * many, j = floor(th), arc = max(TAU * l / many, 0.1);
    gu = q / max(l, 1e-3); gv = vec2(-gu.y, gu.x);
    u = vec2(l / 0.95 + 0.5 - i, th - j); size = vec2(0.95, arc);
    float at = ((j + 0.5) / many - 0.5 - i * 0.137) * TAU;
    wfMid = vec2(0.4, 0.5) + 0.95 * i * vec2(cos(at), sin(at));
    wfK = mod(i + j, 3.0); id = vec2(i, j);
    if (i < 0.5) { u = 0.5 + q / 0.95; e1 = 0.475 - l; size = vec2(0.95); gv = vec2(0.0, 1.0); gu = vec2(1.0, 0.0); }
  } else if (b > N) {                    // herringbone
    vec2 p = rot(0.785) * w * 1.45, c = floor(p);
    float d = mod(c.x - c.y, 4.0);
    size = d < 1.5 ? vec2(2.0, 1.0) : vec2(1.0, 2.0);
    id = d < 0.5 || d > 2.5 ? c : d < 1.5 ? c - vec2(1.0, 0.0) : c - vec2(0.0, 1.0);
    u = (p - id) / size; wfMid = (id + 0.5 * size) * rot(0.785) / 1.45;
    gu *= rot(0.785); gv *= rot(0.785); size /= 1.45;
    wfK = floor(hash21(id + 3.0) * 2.99);
    if (d > 1.5) id += 50.0;
  } else if (a > N && uOwn[0] > 0.0) {   // squares
    id = floor(w / 1.3); u = w / 1.3 - id; size = vec2(1.3);
    wfMid = (id + 0.5) * 1.3; wfK = 2.0 * mod(id.x + id.y, 2.0);
  } else if (a > N) {                    // broken slabs
    vec2 p = w / 1.25, c = floor(p), off = vec2(0.0);
    float near = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 n = c + vec2(float(i), float(j)), o = n + 0.5 + 0.75 * (hash22(n + 17.0) - 0.5) - p;
      if (dot(o, o) < near) { near = dot(o, o); off = o; id = n; }
    }
    for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
      vec2 n = id + vec2(float(i), float(j)), o = n + 0.5 + 0.75 * (hash22(n + 17.0) - 0.5) - p, v = o - off;
      if (dot(v, v) < 1e-4) continue;
      float e = dot(0.5 * (o + off), normalize(v)) * 1.25;
      if (e < e1) { e1 = e; wfOut = -normalize(v) * 1.1547; }
    }
    u = clamp(0.5 - off * 0.62, 0.02, 0.98); wfMid = w + off * 1.25; size = vec2(2.0);
    wfK = floor(hash21(id + 5.0) * 2.99);
  } else { wfEdge = min(wfEdge, seam); return; }
  wfUV = u; wfGu = gu / size; wfGv = gv / size;
  vec2 f = 4.0 * u * (1.0 - u), e = min(u, 1.0 - u) * size;
  wfDish = -4.0 * (wfGu * (1.0 - 2.0 * u.x) * f.y + wfGv * (1.0 - 2.0 * u.y) * f.x);
  wfEdge = min(e.x, e.y);
  if (e1 < 8.0) wfEdge = e1; else wfOut = 1.1547 * (e.x < e.y ? gu * sign(0.5 - u.x) : gv * sign(0.5 - u.y));
  wfEdge = min(wfEdge, seam);
  float h = hash21(id * 0.731 + 43.1);
  wfH = vec3(h, hash21(id + h * 9.7), hash21(id * 1.37 + h * 31.1 + 5.0));
}
void wfStone(vec2 w) {
  wfMid = wfBox(w);
  vec2 q = w - wfMid, ei = wfE0, ej = wfE1;
  float a = dot(q, wfE0), b = dot(q, wfE1), c = dot(q, wfE2);
  wfK = 0.0;
  if (a < b && a < c) { wfK = 1.0; ei = wfE1; ej = wfE2; }
  else if (b < c) { wfK = 2.0; ei = wfE2; ej = wfE0; }
  wfGu = 1.333333 * (ei + 0.5 * ej); wfGv = 1.333333 * (ej + 0.5 * ei);
  wfUV = vec2(dot(q, wfGu), dot(q, wfGv));
  vec2 u = wfUV, f = 4.0 * u * (1.0 - u), e = min(u, 1.0 - u) * 0.8660254;
  wfDish = -4.0 * (wfGu * (1.0 - 2.0 * u.x) * f.y + wfGv * (1.0 - 2.0 * u.y) * f.x);
  wfEdge = min(e.x, e.y);
  wfOut = e.x < e.y ? wfGu * sign(0.5 - u.x) : wfGv * sign(0.5 - u.y);
  vec2 id = floor(wfMid / (wfS * 0.5) + 0.5) + 40.0 + 100.0 * wfK;
  float h = hash21(id * 0.731 + 3.1);
  wfH = vec3(h, hash21(id + h * 9.7), hash21(id * 1.37 + h * 31.1 + 5.0));
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0) wfLaid(w);
  if (uOwn[2] > 0.0) {                   // round at the corners
    vec2 c = abs(2.0 * wfUV - 1.0); c *= c;
    float d = sqrt(dot(c, c) + 1e-5), g = 0.5 / (length(wfGu) + length(wfGv));
    wfEdge = mix(wfEdge, min(wfEdge, (1.0 - d) * g * 1.1), uOwn[2]);
  }
}
// Whether the stone here is the one at a place.
float wfIs(vec2 at) { return uOwn[0] != 0.0 || uOwn[1] != 0.0 ? max(step(length(at - wfMid), 0.93), 0.4 * step(length(at - wfMid), 1.9)) : step(length(wfBox(at) - wfMid), 0.1); }
// What lies over the stones: x how much, y its light.
vec2 wfOver(vec2 w, float gap, float aa) {
  float a = abs(uOwn[3]), lie = noise(w * 0.42 + 50.0) * 0.65 + noise(w * 1.3 + 8.0) * 0.35, f = noise(w * 23.0), d = noise(w * 9.0);
  if (uOwn[3] > 0.0) {
    float at = lie + 0.18 * wfStep(0.14, 0.0, gap) - 0.05 * d - 0.82 + 0.5 * a, on = wfStep(0.0, 0.07 + aa, at);
    float rip = uVar < 0.5 ? sin(dot(w, vec2(7.0, 10.0)) + 5.0 * noise(w * 0.8)) / (1.0 + 9.0 * aa) : 0.0;
    return vec2(on * sat(a * 4.0), 0.85 + 0.13 * rip + 0.1 * (f - 0.5) + 0.7 * (noise(w * 1.3 + vec2(8.1, 7.92)) - noise(w * 1.3 + 8.0)) + 0.25 * (lie - 0.5));
  }
  float g = wfStep(0.0, 0.05 + aa, (0.03 + 0.34 * lie * lie) * a * 1.3 - max(gap, -0.02) + 0.06 * (d - 0.5) + 0.09 * a * (f - 0.6));
  return vec2(g * sat(a * 4.0), 0.35 + 0.9 * f * d + 0.5 * d);
}
// The marble's colour; vein is how much of a vein runs here.
vec3 wfMarble(vec2 w, float k, float aa, out float vein, out float cloud) {
  vec2 m = rot(wfH.x * TAU) * w + wfH.yz * 60.0;
  cloud = noise(m * 1.7);
  float c2 = noise(m * 4.3 + 8.0 * cloud);
  vec2 g = m * vec2(0.55, 2.5) + vec2(0.3, 1.25) * cloud + vec2(0.06, 0.34) * c2;
  float n = abs(noise(g) - 0.5), n2 = abs(noise(rot(0.6) * g * vec2(2.1, 2.6) + 11.0) - 0.5);
  float broad = wfStep(0.20, 0.0, n), thin = wfStep(0.006 + 0.05 * wfH.y * c2 + aa, 0.0, n), hair = wfStep(0.03 + 2.0 * aa, 0.0, n2) * wfStep(0.4, 0.75, c2 * 0.6 + cloud * 0.4);
  float far = 1.0 / (1.0 + 14.0 * aa);
  vein = sat(thin * 0.8 + hair * 0.5) * far;
  float own = 0.82 + 0.36 * wfH.y;
  vec3 c;
  if (k < 0.5) { // ivory white, grey veined
    c = mix(vec3(0.74, 0.69, 0.59), vec3(0.60, 0.585, 0.55), cloud * 0.8 + 0.3 * c2) * own;
    c = mix(c, vec3(0.30, 0.31, 0.33), broad * 0.35 * wfH.z + vein * 0.6);
  } else if (k < 1.5) { // brick rose, clouded, pale veined
    c = mix(vec3(0.34, 0.155, 0.105), vec3(0.46, 0.27, 0.175), wfStep(0.25, 0.75, 0.6 * cloud + 0.4 * c2)) * own;
    c = mix(c, vec3(0.66, 0.53, 0.42), broad * 0.22 * wfH.z + vein * 0.55);
  } else { // green so dark it is nearly black
    c = mix(vec3(0.022, 0.035, 0.032), vec3(0.06, 0.085, 0.07), cloud * 0.6 + 0.4 * c2 * c2) * own;
    c = mix(c, vec3(0.36, 0.40, 0.35), broad * 0.10 * wfH.z + vein * 0.6);
  }
  if (uOwn[7] > 0.0) {                   // as glazed clay, in the sounds' colours
    vec3 hue = k < 0.5 ? uKind[1] : k < 1.5 ? uKind[0] : uKind[2];
    c = mix(c, hue * hue * (0.75 + 0.4 * wfH.y) * (0.8 + 0.4 * cloud) + 0.25 * vein * hue, uOwn[7]);
  }
  if (uOwn[7] < 0.0) c = mix(c, (vec3(0.6, 0.55, 0.465) - 0.07 * k) * (0.72 + 0.4 * wfH.y) * (0.8 + 0.35 * cloud) * (1.0 - 0.35 * vein), -uOwn[7]);
  return c * (0.92 + 0.16 * c2);
}
// Which marble it is of: its face's, but for a few mended with another.
float wfKind() { return wfH.z > 0.955 ? mod(wfK + 1.0, 3.0) : wfK; }
// How much the marble's sounds are heard, and their colour.
vec3 wfWarm(float k, out float s) {
  if (k < 0.5) { s = uPad; return uKind[1]; }
  if (k < 1.5) { s = uDrone; return uKind[0]; }
  s = uTexture; return uKind[2];
}
// A stone whose sounds are heard: warmer in itself, its veins in their colour.
vec3 wfSing(vec3 col, vec3 hue, float s, float vein) {
  vec3 tint = hue / max(dot(hue, vec3(0.3, 0.59, 0.11)), 0.25);
  col *= mix(vec3(1.0), vec3(1.5, 1.38, 1.22) * mix(vec3(1.0), tint, 0.14), s);
  return mix(col, hue * hue * 0.75 + 0.06, vein * s * 0.8);
}
// Whose turn it is to answer a hit.
float wfSlot(float o) { return floor(uTime / 3.0 + o); }
// The piece where it lies on the floor, soft at its ends.
vec4 wfSaid(vec2 p) {
  vec2 e = smoothstep(vec2(0.0), vec2(0.12, 0.05), 0.5 - abs(p * vec2(0.562, 0.98)));
  return piece(vec2(p.x * 0.562 + 0.5, 0.5 - p.y * 0.98)) * e.x * e.y;
}
const vec2 wfLong = vec2(1.0, 0.8); // the stones are cut a little long, away from the eye
vec3 wfDry(vec2 p) {
  const float F = 1.25;
  float M = uOwn[6] == 0.0 ? 1.0 : exp2(uOwn[6] * 0.9), tip = 0.76 - 0.33 * max(uOwn[5], 0.0) + 0.7 * max(-uOwn[5], 0.0), st = uOwn[5] == 0.0 ? sin(0.76) : sin(tip), ct = uOwn[5] == 0.0 ? cos(0.76) : cos(tip);
  float high = 5.0 + 1.2 * (uSpace - 0.5);
  // the eye looks down at a slant
  vec3 rd = normalize(vec3(p.x, p.y * ct - F * st, p.y * st + F * ct));
  rd.y = min(rd.y, -0.05);
  float dist = high / -rd.y;
  vec2 g = rd.xz * dist; // the floor
  g.y -= high / (uOwn[5] == 0.0 ? tan(0.76) : tan(tip));
  vec2 gx = dFdx(g), gy = dFdy(g);
  mat2 turn = rot(-0.36);
  g += 0.12 * vec2(sin(uTime * 0.021), cos(uTime * 0.017));
  vec2 w = turn * (g * wfLong) * M + vec2(0.35, 0.2);
  gx = turn * (gx * wfLong) * M; gy = turn * (gy * wfLong) * M;
  float foot = 0.7 * (length(gx) + length(gy));
  wfStone(w);
  vec2 u = wfUV;
  float k = wfKind();
  // a way that people took
  float wob = noise(w * 0.55 + 4.0);
  float way = g.x + 0.9 - 0.55 * g.y + 1.1 * sin(g.y * 0.33 + 0.6);
  float wear = exp(-way * way * 0.42) * (0.65 + 0.6 * wob);
  // slopes
  vec2 slope = (wfH.xy - 0.5) * 0.085;
  float soft = k < 0.5 ? 1.0 : k < 1.5 ? 0.75 : 0.4;
  float bowl = 16.0 * u.x * (1.0 - u.x) * u.y * (1.0 - u.y);
  float deep = (0.016 + wear * soft * 0.06) * (0.75 + 0.6 * uLow);
  slope += wfDish * deep;
  if (uOwn[2] != 0.0) slope += wfDish * (uOwn[2] > 0.0 ? -0.2 * uOwn[2] : -0.13 * uOwn[2]);
  vec2 acrossWay = turn * vec2(1.0, -0.55 + 0.36 * cos(g.y * 0.33 + 0.6));
  slope += acrossWay * way * wear * 0.14 * (0.6 + 0.7 * uLow);
  float rough = noise(w * 5.0 + wfH.xy * 30.0), fine = noise(w * 19.0);
  float corner = max(u.x * u.y, (1.0 - u.x) * (1.0 - u.y)), odd = wfH.z * wfH.z;
  float chip = wfStep(0.62, 0.9, rough) * (0.012 + 0.10 * odd * odd * odd) + 0.10 * wfStep(0.75, 0.95, wfH.x * corner + 0.15 * rough) + 0.03 * max(uOwn[2], 0.0);
  float gap = wfEdge - chip - 0.008 - 0.010 * rough;
  float ef = 0.5 * (abs(dot(gx, wfOut)) + abs(dot(gy, wfOut))) + 0.002;
  float stone = wfStep(-ef, ef, gap);
  stone = mix(stone, 0.96, sat(ef * 9.0 - 0.25));
  slope += wfOut * 0.866 * wfStep(0.035 + 0.07 * wear, 0.0, gap) * (0.35 - 0.1 * wear) / (1.0 + ef * 30.0);
  slope += (vec2(fine, noise(w * 19.0 + 7.3)) - 0.5) * 0.05 * (1.0 - 0.7 * wear) / (1.0 + 20.0 * foot);
  if (uOwn[5] > 0.0) slope /= 1.0 + 6.0 * uOwn[5] * foot;
  float h = -bowl * deep - wear * 0.25 * (0.65 + 0.6 * uLow) + (wfH.z - 0.5) * 0.05;
  float vein, cloud;
  vec3 col = wfMarble(w, k, foot, vein, cloud);
  float s; vec3 hue = wfWarm(k, s);
  col = wfSing(col, hue, s, vein);
  col += uKind[3] * vein * uPhrase * 0.5;
  // a crack across a few
  if (wfH.x > 0.84) {
    vec2 cd = vec2(cos(wfH.y * 6.3), sin(wfH.y * 6.3));
    vec2 mid = wfMid + (wfK < 0.5 ? vec2(0.0, 0.5) : vec2(wfK < 1.5 ? -0.433 : 0.433, -0.25));
    float cr = abs(dot(w - mid, cd) + (cloud - 0.5) * 0.35 + (rough - 0.5) * 0.12);
    col *= 1.0 - 0.75 * wfStep(0.012 + foot, 0.0, cr) / (1.0 + 18.0 * foot);
  }
  // dirt: in the joints, and dust off the way
  float dust = (1.0 - sat(wear * 1.3)) * (0.35 + 0.65 * cloud);
  col = mix(col, vec3(0.30, 0.265, 0.22), 0.20 * dust + 0.35 * dust * wfStep(0.16, 0.0, wfEdge));
  col *= 0.72 + 0.28 * wfStep(0.0, 0.10, gap);
  col = mix(vec3(0.075, 0.063, 0.05) * (0.6 + 0.8 * fine), col, stone);
  vec2 over = vec2(0.0);
  if (uOwn[3] != 0.0) {
    over = wfOver(w, gap, foot);
    col = mix(col, uOwn[3] > 0.0 ? vec3(0.62, 0.49, 0.34) * over.y : vec3(0.05, 0.085, 0.022) * over.y, over.x);
    slope *= 1.0 - 0.8 * over.x;
    vein *= 1.0 - over.x;
  }
  vec2 L = turn * normalize(vec2(-0.93, 0.36));
  float graze = clamp(1.0 - dot(slope, L) * 4.2, 0.0, 2.1);
  float move = 1.3 * 4.0 * uCue * (1.0 - uCue) + 0.35 * (0.5 - 0.5 * cos(TAU * uLoop)) + 0.45 * sin(uTime * 0.03);
  vec2 gs = g + vec2(-0.93, 0.36) * (-h) * 2.6;
  float across = dot(gs, normalize(vec2(-0.42, 1.0))) - 0.15 - move;
  float along = dot(gs, normalize(vec2(1.0, 0.42)));
  float pen = mix(0.13, 0.035, uTone) * (1.0 + 0.09 * max(along + 4.0, 0.0)) + foot;
  float half_ = 0.80 + 0.03 * along;
  float bar = wfStep(-pen, pen, across + half_) * wfStep(pen, -pen, across - half_);
  bar *= 1.0 - 0.8 * wfStep(0.13 + pen * 0.5, 0.02, abs(across + 0.12)); // the mullion
  float leaf = noise(gs * 1.3 + vec2(uTime * 0.05, 0.4 * sin(uTime * 0.11)));
  float dapple = wfStep(0.22, 0.5, leaf + 0.12 * (wob - 0.5));
  if (uOwn[4] > 0.0) {                   // a lattice of many panes
    vec2 la = vec2(along + across, along - across) / 1.05, lo = abs(fract(la) - 0.5);
    float pane = wfStep(0.42 + pen, 0.42 - pen, max(lo.x, lo.y)) * wfStep(3.4, 3.2, abs(across)) * (0.75 + 0.25 * hash21(floor(la) + 60.0));
    bar = mix(bar, pane, uOwn[4]);
  }
  bar *= mix(0.62, 1.0, dapple);
  bar *= wfStep(9.0, 2.0, along - 1.5);
  float next = across - 5.2; // the next window's bar, far off
  bar += 0.5 * wfStep(-pen, pen, next + 0.6) * wfStep(pen, -pen, next - 0.6);
  vec3 sun = vec3(1.0, 0.75, 0.46) * (2.7 + 0.7 * uLevel + 1.1 * uCue);
  vec3 sky = vec3(0.34, 0.41, 0.52) * (0.27 - 0.03 * clamp(g.x, -5.0, 5.0));
  sky *= max(1.0 - dot(slope, L) * 2.2, 0.2);
  vec4 pc = wfSaid(p);
  if (uOwn[4] < 0.0) { bar *= 1.0 + uOwn[4]; sky *= 1.0 - 3.6 * uOwn[4] * (0.8 + 0.2 * uLevel + 0.6 * uCue); sky = mix(sky, vec3(dot(sky, vec3(0.36))), -0.6 * uOwn[4]); }
  vec3 light = col * (sky + sun * bar * graze);
  light += col * vec3(0.5, 0.36, 0.22) * (0.18 + 0.35 * uMic) * exp(-across * across * 0.25);
  // polish: the far window mirrored in the stones, broken by each one's tilt
  vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
  n.xz = n.xz * turn;
  vec3 r = reflect(rd, n);
  float fr = 0.05 + 0.6 * pow(1.0 - sat(dot(-rd, n)), 4.0);
  float polish = sat(0.25 + 0.75 * wear + pc.a) * stone * (1.0 - 0.5 * vein) * (1.0 - over.x);
  vec2 rr = r.xz / max(r.y, 0.05);
  float win = exp(-wfSq((rr.x + 0.25) * 2.2)) * wfStep(0.7, 1.7, rr.y);
  light += fr * polish * win * vec3(0.75, 0.85, 1.0) * (1.5 + 1.0 * uMid + 1.4 * uKeys);
  light += pc.rgb * (col * 0.55 + polish * (0.004 + 0.45 * fr)) * (0.5 + 1.1 * uEnergy);
  float f = fract(uTime / 3.0), lit = 0.0;
  if (uHits > 0.004) for (int i = 0; i < 2; i++) {
    float sl = wfSlot(float(i));
    vec2 at = (vec2(hash11(sl), hash11(sl + 7.7)) - 0.5) * vec2(min(uRes.x / uRes.y, 1.8) * 2.6, 3.2) * (1.0 - 0.6 * max(uOwn[5], 0.0));
    vec2 m = turn * (at * wfLong) * M + vec2(0.35, 0.2);
    float fade = wfStep(0.85, 1.0, f);
    lit += (i == 0 ? 1.0 - fade : fade) * wfIs(m);
  }
  float face = wfK < 0.5 ? 1.0 : (wfK < 1.5 ? 0.62 : 0.4);
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0) face = max(face, 0.9);
  light += lit * uHits * stone * face * (col * 3.4 + 0.14) * mix(vec3(1.0, 0.85, 0.65), uKind[4], 0.5) * (0.6 + uEnergy);
  light *= 1.0 - (0.45 + 0.3 * max(uOwn[5], 0.0)) * wfStep(1.0, 6.5 + 9.0 * max(uOwn[5], 0.0), g.y);
  return screenOf(light * 1.25);
}
// A bare branch lying along x from 0 to len, with twigs on twigs: how dark it is at q.
float wfBranch(vec2 q, float len, float wide, float seed, float aa) {
  if (q.x < 0.0 || q.x > len || abs(q.y) > 0.6 * len) return 0.0;
  q.y += 0.07 * len * sin(q.x * 2.9 / len + seed) + 0.010 * len * sin(q.x * 15.0 / len + seed * 3.0);
  float dark = 0.0, room = 0.6 * len, alive = 1.0;
  for (int i = 0; i < 4; i++) {
    float y = abs(q.y), t = q.x / len;
    if (t > 1.0) break;
    alive *= sat((room - y) / (0.25 * room));
    float w = wide * (1.0 - t) + 0.12 * aa;
    dark = max(dark, wfStep(0.7 * aa, -0.7 * aa, y - w) * sat(w / aa * 1.8) * alive);
    // step into the twig of this stretch
    float side = q.y < 0.0 ? 5.0 : 0.0, pace = len * (i == 0 ? 0.19 : 0.27);
    float lean = 0.75 + 0.35 * hash11(seed + side);
    float x = q.x - y * lean + side * 0.09 * pace + 0.22 * y * y / len;
    float n = floor(x / pace);
    if (n < 0.0) break;
    float h = hash21(vec2(n + seed, side + seed * 1.7)), h2 = fract(h * 37.7);
    float c = 1.0 / sqrt(1.0 + lean * lean), at = 0.3 + 0.4 * h2;
    float from = (n + at) * pace - side * 0.09 * pace;
    float tw = 1.0 - from / len;
    q = vec2(y / c, (x - (n + at) * pace) * c);
    len *= sat(tw * 1.2) * (0.30 + 0.42 * h);
    if (len < 0.015 || from < 0.0) break;
    q.y += (h2 - 0.5) * 0.15 * q.x * q.x / len + 0.025 * len * sin(q.x * 9.0 / len + h * 30.0);
    room = pace * c * (0.5 - abs(at - 0.5));
    wide *= (0.25 + 0.75 * tw) * 0.6; seed += h * 17.0 + n;
  }
  return dark;
}
// A fallen leaf, curled: x how much of it is here, y its light, z its shadow.
vec3 wfLeaf(vec2 q, float turn, float size) {
  if (dot(q, q) > size * size * 4.0) return vec3(0.0);
  vec2 s = rot(turn) * q / size;
  s.y -= 0.22 * s.x * s.x;
  float px = 1.3 / (uRes.y * size);
  float side = 0.40 * (1.0 - s.x * s.x) * (1.0 - 0.35 * s.x);
  float d = abs(s.y) - side * (0.96 + 0.04 * sin(s.x * 46.0));
  float stalk = max(abs(s.y) - 0.025, abs(s.x + 1.2) - 0.3);
  float in_ = wfStep(px, -px, min(d, stalk));
  vec2 o = rot(turn) * (q + vec2(-0.010, 0.013)) / size; o.y -= 0.22 * o.x * o.x;
  float sh = wfStep(0.22, -0.16, abs(o.y) - 0.40 * (1.0 - o.x * o.x) * (1.0 - 0.35 * o.x));
  float rib = wfStep(0.035 + px, 0.0, abs(s.y)) + 0.5 * wfStep(0.5, 0.95, sin((s.x - abs(s.y) * 1.1) * 26.0));
  return vec3(in_, 0.72 + 1.375 * s.y + 0.28 * rib, sh);
}
// Rings of one drop: slope in xy, and a bright line in z. age 0 to 1.
vec3 wfRing(vec2 p, vec2 at, float age, float size, float amount) {
  vec2 d = p - at; float l = length(d) + 1e-4, x = (l - age * size) / (0.02 + 0.03 * age);
  float env = exp(-x * x * 0.35) * amount;
  return vec3(d / l * cos(x * 2.4) * env, sin(x * 2.4) * env);
}
vec3 wfRain(vec2 p) {
  float px = 1.0 / uRes.y;
  float scale = (4.3 + 0.8 * (uSpace - 0.5)) * exp2(uOwn[6] * 0.9), flood = max(uOwn[5], 0.0), night = max(-uOwn[4], 0.0);
  vec2 g = p + 0.02 * vec2(sin(uTime * 0.021), cos(uTime * 0.017));
  vec2 w = rot(0.21) * g * scale + vec2(0.3, 0.55);
  float foot = px * scale;
  if (flood > 0.0) w += flood * 0.09 * vec2(noise(g * 7.0 + uTime * 0.17) - 0.5, noise(g * 7.0 - uTime * 0.15 + 30.0) - 0.5);
  wfStone(w);
  vec2 u = wfUV;
  float k = wfKind();
  float big = noise(w * 0.5 + 9.0), mid = noise(w * 1.6 + 2.0);
  float rough = noise(w * 5.0 + wfH.xy * 30.0), fine = noise(w * 21.0);
  // the low way runs from lower left to upper right
  float way = g.y - 0.55 * g.x + 0.10 - 0.13 * sin(g.x * 3.3 + 0.8);
  float wear = exp(-way * way * 9.0) * (0.55 + 0.8 * big);
  float odd = wfH.z * wfH.z, corner = max(u.x * u.y, (1.0 - u.x) * (1.0 - u.y));
  float chip = wfStep(0.62, 0.9, rough) * (0.015 + 0.07 * odd * odd * odd) + 0.08 * wfStep(0.8, 0.98, wfH.x * corner + 0.12 * rough) + 0.03 * max(uOwn[2], 0.0);
  float gap = wfEdge - chip - 0.014 - 0.012 * rough;
  float ef = foot * 0.9;
  float stone = wfStep(-ef, ef, gap);
  // the film of rain
  float own = fract(wfH.y * 7.13 + wfH.x);
  float brim = wfStep(-0.02, 0.26, gap);
  float deep = 0.66 * wear + 0.80 * (own - 0.5) + 0.26 * brim + 0.35 * (big - 0.5) + 0.32 * (mid - 0.5) + 0.05 * (rough - 0.5);
  deep += 0.08 * (uLow - 0.2) - 0.58 + (uOwn[5] < 0.0 ? 0.9 * uOwn[5] : 1.3 * flood);
  if (uOwn[2] > 0.0) deep -= uOwn[2] * (0.5 * brim - 0.22); else deep -= uOwn[2] * 0.3 * (16.0 * u.x * (1.0 - u.x) * u.y * (1.0 - u.y) - 0.4);
  vec2 over = vec2(0.0);
  if (uOwn[3] != 0.0) { over = wfOver(w, gap, foot); deep -= over.x * 0.8; }
  float pool = deep - 0.26 * brim + 0.26 - 0.8 * (own - 0.5) + 0.8 * min(own - 0.5, 0.0);
  float film = wfStep(-0.006 - foot, 0.012 + foot, deep) * max(wfStep(-ef, ef, gap - 0.004), 0.62 * wfStep(0.02, 0.22, pool));
  if (flood > 0.0) film = mix(film, 1.0, wfStep(0.1, 0.9, flood));
  float lip = exp(-wfSq((deep - 0.03) * 30.0)) * film;
  float vein, cloud;
  vec3 col = wfMarble(w, k, foot, vein, cloud);
  float s; vec3 hue = wfWarm(k, s);
  col = wfSing(col, hue, s, vein) + uKind[3] * vein * uPhrase * 0.3;
  col *= 0.85 + 0.3 * rough * fine;
  col = mix(col, vec3(0.26, 0.25, 0.22), 0.22 * cloud);
  float damp = wfStep(0.25, -0.35, deep + 0.5 * (mid - 0.5) + 0.12 * (rough - 0.5));
  col *= mix(0.40, 1.0, damp) * (1.0 - 0.35 * film);
  vec3 joint = mix(vec3(0.05, 0.042, 0.033), vec3(0.055, 0.075, 0.025), wfStep(0.45, 0.7, mid)) * (0.6 + 0.8 * fine);
  col *= 0.72 + 0.28 * wfStep(0.0, 0.10, gap);
  col = mix(joint, col, stone);
  if (uOwn[3] != 0.0) col = mix(col, uOwn[3] > 0.0 ? vec3(0.78, 0.8, 0.84) * over.y : vec3(0.06, 0.1, 0.025) * over.y, over.x);
  vec2 slope = (wfH.xy - 0.5) * 0.14 + wfDish * 0.03 + wfOut * 0.866 * wfStep(0.06, 0.0, gap) * 0.35;
  slope += (vec2(fine, noise(w * 21.0 + 7.3)) - 0.5) * 0.12;
  if (uOwn[2] != 0.0) slope += wfDish * (uOwn[2] > 0.0 ? -0.22 * uOwn[2] : -0.12 * uOwn[2]);
  slope *= 1.0 - 0.8 * over.x;
  float lit = max(1.0 + dot(-slope, vec2(-0.75, 0.66)) * 1.5, 0.15);
  vec3 light = col * vec3(0.80, 0.88, 1.0) * 0.78 * lit * (0.85 - 0.35 * g.x + 0.5 * g.y);
  // a thin sun in one band
  float move = 0.35 * 4.0 * uCue * (1.0 - uCue) + 0.10 * (0.5 - 0.5 * cos(TAU * uLoop)) + 0.05 * sin(uTime * 0.03);
  float band_ = dot(g, vec2(-0.5, 0.866)) - 0.16 + move;
  band_ = wfStep(0.17, 0.07, abs(band_) + 0.05 * (mid - 0.5)) * (0.6 + 0.7 * uCue + 0.25 * uLevel);
  light *= 1.0 + band_ * vec3(1.5, 1.0, 0.52) * lit;
  if (uOwn[4] != 0.0) {
    if (uOwn[4] > 0.0) {                 // full sun, and the tree's shadow on the stones
      vec2 t = g + 0.03 * (noise(g * 3.0) - 0.5);
      float sh = wfBranch(rot(-0.5) * (t - vec2(-1.05, -0.62)), 2.0, 0.085, 1.0, 0.012);
      sh = max(sh, wfBranch(rot(-0.95) * (t - vec2(-0.6, -0.8)), 1.6, 0.06, 23.0, 0.012));
      sh = max(sh, wfBranch(rot(-0.08) * (t - vec2(-1.2, -0.3)), 1.9, 0.045, 9.0, 0.012));
      light *= mix(vec3(1.0), vec3(1.9, 1.62, 1.22) * mix(1.0, 0.2, sh) * lit, uOwn[4]);
    }
    light *= mix(vec3(1.0), vec3(0.13, 0.17, 0.25) * (0.6 + 0.8 * lit), night);
  }
  if (flood > 0.0) {                     // light gathered by the water
    vec2 q = g * 5.5;
    float n1 = noise(vec3(q, uTime * 0.12)), n2 = noise(vec3(q * 1.7 + 9.0, uTime * 0.15)), ca = 1.0 - abs(n1 + 0.5 * n2 - 0.75) * 3.0;
    light *= mix(vec3(1.0), (1.3 + 5.5 * wfSq(max(ca, 0.0)) * (0.6 + 0.5 * uMid)) * vec3(0.78, 1.0, 0.98), flood);
  }
  // rings on the water
  vec3 ring = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float t = uTime / 7.3 + float(i) * 0.37, sl = floor(t), age = fract(t);
    float x = (hash11(sl + float(i) * 31.0) - 0.5) * min(uRes.x / uRes.y, 1.7);
    ring += wfRing(g, vec2(x, 0.55 * x - 0.10 + 0.13 * sin(x * 3.3 + 0.8)), age, 0.5, sat(age * 20.0) * wfSq(1.0 - age) * 0.45);
  }
  float hitLit = 0.0, splash = 0.0, f3 = wfStep(0.85, 1.0, fract(uTime / 3.0));
  if (uHits > 0.004) for (int i = 0; i < 2; i++) {
    float x = (hash11(wfSlot(float(i)) + 3.0) - 0.5) * min(uRes.x / uRes.y, 1.3), on = (i == 0 ? 1.0 - f3 : f3) * uHits;
    vec2 at = vec2(x, 0.55 * x - 0.10 + 0.13 * sin(x * 3.3 + 0.8));
    ring += wfRing(g, at, 1.0 - uHits, 0.22, on * (1.0 - uHits) * 5.0);
    splash += on * exp(-dot(g - at, g - at) * 700.0);
    hitLit += on * wfIs(rot(0.21) * at * scale + vec2(0.3, 0.55));
  }
  // the sky in it
  vec2 drift = 8.0 * vec2(cos(uTime * 0.037), sin(uTime * 0.037)) + 20.0;
  vec2 m = g + ring.xy * 0.022 + wfOut * lip * 0.02 + 0.0022 * vec2(noise(g * 14.0 + drift), noise(g * 14.0 - drift.yx + 25.0)) * (1.0 + 3.0 * uHigh);
  float cl = noise(m * 2.1 + vec2(uTime * 0.02, 3.0)) * 0.65 + 0.35 * noise(m * 5.0 - vec2(0.0, uTime * 0.013));
  vec3 sky = mix(vec3(0.27, 0.38, 0.54), vec3(1.15, 1.10, 1.0), wfStep(0.3, 0.7, cl + 0.25 * (uTone - 0.5)));
  sky *= 0.72 + 0.55 * wfStep(-0.5, 0.6, g.x * 0.7 + g.y) + band_ * vec3(0.30, 0.24, 0.15) + 0.35 * uMic * vec3(1.0, 0.7, 0.4);
  if (night > 0.0) {
    vec2 c = g * 26.0, o = fract(c) - 0.5; float h = hash21(floor(c) + 70.0), d = length(m - vec2(0.02, -0.1));
    vec3 dark = vec3(0.012, 0.022, 0.05) * (0.6 + 1.2 * cl) + wfStep(0.1, 0.0, length(o - 0.5 * vec2(fract(h * 17.0) - 0.5, fract(h * 53.0) - 0.5))) * step(0.72, h) * 0.5 * wfStep(0.75, 0.4, cl);
    dark += vec3(1.5, 1.4, 1.15) * wfStep(0.085, 0.078, d) * (0.75 + 0.3 * cl) + vec3(0.16, 0.2, 0.3) * exp(-d * 5.0) * (0.4 + cl);
    sky = mix(sky, dark, night);
  }
  vec4 pc = wfSaid(p);
  float said = sat(pc.a * (0.9 + 1.6 * uEnergy));
  vec3 tint = pc.rgb / max(pc.a, 0.05);
  sky = mix(sky, sky * (0.25 + 1.45 * tint), 0.75 * said);
  light *= mix(vec3(1.0), 0.7 + 0.9 * tint, 0.5 * said);
  float sway = 0.012 * sin(uTime * 0.23) + 0.008 * sin(uTime * 0.37 + 1.0);
  float aa = px * 1.3, tree = 0.0;
  if (film > 0.0) {
    tree = wfBranch(rot(-0.50 + sway) * (m - vec2(-1.05, -0.60)), 2.0, 0.036, 1.0, aa);
    tree = max(tree, wfBranch(rot(-0.95 + sway) * (m - vec2(-0.62, -0.75)), 1.5, 0.024, 23.0, aa));
    tree = max(tree, wfBranch(rot(-0.08 - sway) * (m - vec2(-1.2, -0.28)), 1.9, 0.016, 9.0, aa));
    tree = max(tree, wfBranch(rot(-0.66 - sway) * (m - vec2(-0.25, -0.72)), 1.6, 0.013, 41.0, aa));
    tree = max(tree, wfBranch(rot(2.75 - sway) * (m - vec2(1.15, 0.62)), 1.3, 0.014, 5.0, aa));
  }
  sky *= clamp(1.0 + 0.5 * ring.z, 0.5, 1.6);
  sky = mix(sky, vec3(0.02, 0.02, 0.024), 0.96 * tree);
  float mirror = film * (0.52 + 0.14 * tree + 0.30 * wfStep(0.0, 0.5, deep)) * (1.0 - 0.9 * flood);
  light = mix(light, sky * 0.95, mirror);
  light += (lip * (0.10 + 0.5 * uKeys) + splash * 0.9) * vec3(0.8, 0.88, 1.0);
  float face = wfK < 0.5 ? 1.0 : (wfK < 1.5 ? 0.62 : 0.35);
  light += hitLit * stone * face * (light * 0.9 + 0.12) * mix(vec3(1.0, 0.9, 0.75), uKind[4], 0.5) * (0.6 + uEnergy);
  // a few leaves came down with it
  for (int i = 0; i < 5; i++) {
    float f = float(i), h = hash11(f + 2.3);
    vec2 at = i == 0 ? vec2(-0.205, 0.035) : i == 1 ? vec2(0.13, -0.315) : i == 2 ? vec2(0.205, 0.335) : i == 3 ? vec2(-0.62, 0.21) : vec2(0.66, -0.20);
    float afloat = i < 3 ? 1.0 : 0.0;
    vec3 lf = wfLeaf(g - at - ring.xy * 0.004 * afloat, h * TAU + 0.06 * afloat * sin(uTime * 0.2 + f * 2.0), 0.034 + 0.016 * hash11(f + 8.0));
    vec3 c = mix(vec3(0.42, 0.20, 0.045), vec3(0.20, 0.07, 0.03), hash11(f + 5.0));
    c = mix(c, uKind[3] * uKind[3] * 0.8 + 0.06, 0.45 * uPhrase) * (1.0 + 0.8 * uPhrase);
    light *= 1.0 - 0.55 * lf.z * (1.0 - lf.x);
    light = mix(light, c * max(lf.y, 0.1) * 1.3, lf.x);
  }
  return screenOf(light * 1.15);
}
vec3 render(vec2 p) { return uVar < 0.5 ? wfDry(p) : wfRain(p); }
