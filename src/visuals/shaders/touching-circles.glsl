// name: Touching circles
// a: Painted board
// b: Ink lines
// what: Weathered cedar planks painted with circles that all touch: a great ring holds a few, the gaps hold smaller ones, down to seeds, in chalk white, oxide red and indigo worn back to the wood; or the same family in double ink lines on an old folded sheet, standing on a ruled line, each with the prick of the compass at its middle.
// follows: The family slides with the music, big circles shrinking as seeds open; the loop rocks it. Each circle reads the piece at its place: loud ones take full paint or a wash. The bands, low to high, fill great to small; drone weighs the ring or the lines, texture the grain, phrases mark the touching points. A hit repaints one, a cue runs through the sizes.
float tcPx; // one pixel
// One whole exchange of the family is this far along; afterwards every circle lies where another lay.
const float tcFar = 5.774542, tcPhi2 = 2.618034;
// The four circles that touch, in the picture's own units: bend, bend times middle, and bend times (middle squared less radius squared).
vec4 tcB, tcX, tcY, tcK;
// What is found at a place: middle, radius (0 when it is too fine to see), the way in from its edge, which of the four
// families it is of, and whether it touches the ring or the line.
struct TcC { vec2 c; float r, d, k, rim; };
float tcM; // how far along the three are
// The slide comes from the distance travelled; the loop rocks it a little.
float tcSlide() { return tcFar * (fract(0.0085 * uTravel + 0.02 * sin(TAU * uLoop) + 0.17) - 0.5); }
// The ring and three circles inside it. The three slide along the ring from one side to the other.
void tcRing() {
  float m = tcM;
  vec3 v = m * vec3(-1.0, 1.0 / tcPhi2, tcPhi2), n = 1.0 + v * v;
  vec3 d = abs(v - v.yzx); // 12, 23, 31
  vec3 q = d.xyz * d.zxy / (d.yzx * n); // radius over what is left of the ring's
  tcB = vec4(1.0 / q + 1.0, -1.0);
  tcX = vec4((v * v - 1.0) / (n * q), 0.0);
  tcY = vec4(-2.0 * v / (n * q), 0.0);
  tcK = vec4(tcB.xyz - 2.0, 1.0);
}
// A line and three circles standing on it. They slide from a place at the left to one at the right.
void tcLine() {
  float m = tcM;
  vec3 v = m * vec3(-1.0, 1.0 / tcPhi2, tcPhi2);
  vec3 W = 1.0 + v, X = -0.62 + 0.8 * v;
  vec3 D = 1.42 * abs(v - v.yzx);
  vec3 g = 2.0 * D.yzx / (D.xyz * D.zxy);
  tcB = vec4(g * W * W, 0.0);
  tcX = vec4(g * W * X, 0.0);
  tcY = vec4(1.0, 1.0, 1.0, -1.0);
  tcK = vec4(g * X * X, 0.0);
}
// Which circle of the family is at z (in units where one pixel is px).
TcC tcFind(vec2 z, float px) {
  vec4 B = tcB, X = tcX, Y = tcY;
  vec4 f = B * dot(z, z) - 2.0 * (X * z.x + Y * z.y) + tcK;
  TcC o = TcC(z, 0.0, 0.0, 0.0, 0.0);
  vec4 m = step(f, vec4(0.0));
  m.w = 0.0;
  float most = 1.0 / (0.6 * px);
  for (int i = 0; i < 34; i++) {
    if (dot(m, vec4(1.0)) < 0.5) {
      float t = max(max(f.x, f.y), max(f.z, f.w));
      m = f.x == t ? vec4(1, 0, 0, 0) : f.y == t ? vec4(0, 1, 0, 0) : f.z == t ? vec4(0, 0, 1, 0) : vec4(0, 0, 0, 1);
      f += m * (2.0 * dot(f, vec4(1.0)) - 4.0 * t);
      B += m * (2.0 * dot(B, vec4(1.0)) - 4.0 * dot(B, m));
      X += m * (2.0 * dot(X, vec4(1.0)) - 4.0 * dot(X, m));
      Y += m * (2.0 * dot(Y, vec4(1.0)) - 4.0 * dot(Y, m));
      if (dot(B, m) > most) break;
      if (dot(f, m) > 0.0) { m = vec4(0.0); continue; }
    }
    float b = max(dot(B, m), 1e-4);
    vec2 bc = vec2(dot(X, m), dot(Y, m));
    o.c = bc / b;
    o.d = b < 1.0 ? -dot(f, m) / (1.0 + length(b * z - bc)) : 1.0 / b - length(z - o.c); // a circle nearly straight has its middle far away
    o.r = 1.0 / b; o.k = dot(m, vec4(0, 1, 2, 3));
    o.rim = uVar < 0.5 ? step(b - (dot(o.c, o.c) * b - o.r), 3.0) : step(abs(o.c.y * b - 1.0), 0.02);
    break;
  }
  return o;
}

// One circle of the chain takes the hit: the one nearest the middle of the way, its neighbour taking over as it goes by.
float tcStruck(float v, float rim) {
  float L = log(abs(v) + 1e-6), n = (L - log(tcM)) / 0.962424, near = floor(n + 0.5);
  float odd = mod(near, 2.0), sg = v < 0.0 ? 0.0 : 1.0;
  return rim * step(abs(n - near), 0.03) * step(abs(odd - sg), 0.5) * smoothstep(0.15, 0.75, 1.0 - abs(L) / (uVar < 0.5 ? 0.962424 : 1.924848)) * max(sg, 1.0 - uVar);
}
float tcSize(float r) { return sat(log2(0.3 / max(r, 1e-4)) / 6.0); } // 0 a great circle, 1 a seed
// The cue goes down the sizes, great ones first.
float tcCue(float size) { float f = (size - 1.15 * (1.0 - uCue)) * 5.0; return sat(uCue * 1.6) * exp(-f * f); }
vec4 tcPiece(vec2 c) { return piece(clamp(vec2(c.x / 1.5 + 0.5, 0.5 - c.y), 0.01, 0.99)); }
// ---- the board: three cedar planks, silvered. h is the height of the grain.
float tcHeight(vec2 p, out float kn, out float line) {
  float id = p.y > 0.205 ? 1.0 : p.y > -0.235 ? 0.0 : 2.0;
  vec2 q = p + vec2(id * 5.3, id * 1.7);
  float y = p.y - (id < 0.5 ? -0.06 : id < 1.5 ? 0.50 : -0.47) + 0.05 * noise(q * vec2(1.4, 1.1)) + 0.012 * noise(q * vec2(6.0, 5.0));
  vec2 k = p - vec2(0.62, 0.03), e = k * vec2(0.8, 1.5);
  kn = exp(-dot(e, e) * 55.0);
  // the year rings as a saw cuts them: long flames in the middle of a plank, close lines at its edges
  float u = 135.0 * (y * y * 1.7 + 0.034 * q.x) + 2.0 * noise(q * vec2(2.0, 9.0));
  u = mix(u, length(k * vec2(0.55, 1.0)) * 90.0 + 2.0 * noise(k * 9.0), smoothstep(0.08, 0.9, kn));
  float f = fract(u), own = hash11(floor(u) + id * 31.0);
  line = smoothstep(0.15, 0.9, f) * (1.0 - smoothstep(0.9, 1.0, f)) * (0.35 + 0.65 * own);
  float fine = noise(vec2(q.x * 9.0, q.y * 150.0 + line * 2.0)), hair = noise(vec2(q.x * 26.0, q.y * 330.0));
  return 0.42 * line + 0.36 * fine + 0.22 * hair;
}
vec3 tcBoard(vec2 p) {
  float px = tcPx, ans = 0.55 + uEnergy, kn, line, skip;
  float h = tcHeight(p, kn, line), h2 = tcHeight(p + vec2(-0.0015, 0.0032), skip, skip);
  float rake = clamp((h - h2) * (0.8 + 0.3 * uTone + 0.9 * uTexture * ans), -0.45, 0.45);
  float worn = noise(p * vec2(1.3, 2.7) + 4.0);
  vec3 wood = mix(vec3(0.25, 0.17, 0.12), vec3(0.62, 0.475, 0.345), 1.0 - smoothstep(0.1, 0.75, h + 0.08 * uTexture));
  wood *= 1.0 - 0.5 * smoothstep(0.80, 0.93, noise(vec2(p.x * 3.5 + 9.0, p.y * 95.0))) * smoothstep(0.35, 0.6, noise(p * vec2(2.0, 8.0) + 8.0));
  wood = mix(wood, vec3(0.50, 0.465, 0.42), 0.5 * worn);
  wood *= (1.0 - 0.6 * smoothstep(0.55, 1.0, kn)) * (p.y > 0.205 ? 0.94 : p.y > -0.235 ? 1.03 : 0.98);
  // seams, and a pair of nails in each plank with the rust they have wept
  float s = min(abs(p.y - 0.205), abs(p.y + 0.235));
  vec2 nl = vec2(abs(p.x) - 0.8, p.y > 0.205 ? p.y - 0.35 : p.y > -0.235 ? p.y + 0.02 : p.y + 0.37);
  float nd = length(nl) - 0.0062;
  wood *= mix(vec3(1.0), vec3(0.6, 0.42, 0.33), (1.0 - smoothstep(0.0, 0.011, abs(nl.x + 0.003 * sin(p.y * 60.0)))) * (1.0 - smoothstep(-0.01, 0.0, nl.y)) * smoothstep(-0.17, 0.0, nl.y) * 0.75);
  vec3 white = vec3(0.755, 0.715, 0.63), red = vec3(0.62, 0.185, 0.11), indigo = vec3(0.10, 0.155, 0.285), ochre = vec3(0.70, 0.49, 0.21);
  float wide = clamp(uRes.x / uRes.y / 1.78, 0.3, 1.1);
  vec2 at = vec2(-0.27 * wide, -0.085);
  float R = 0.535;
  vec2 z = rot(-0.5) * (p - at) / R;
  float rr = length(z);
  bool off = rr > 1.0;
  tcRing();
  TcC t = tcFind(off ? z / max(dot(z, z), 1e-6) : z, px / R);
  vec3 col = wood;
  // how worn the paint is at each place of the board: patches, flakes along the grain, the hard ridges rubbed first
  float wear = 0.46 * noise(p * vec2(2.6, 4.2) + 1.7) + 0.20 * noise(p * vec2(13.0, 30.0) + 5.0) + 0.17 * noise(p * vec2(38.0, 150.0)) + 0.1 * noise(rot(0.7) * p * 230.0) + 0.3 * h - 0.06;
  float age = 0.1 * uPad * ans, wet = 0.0;
  if (!off && t.r > 0.0) {
    vec2 c = rot(0.5) * t.c * R + at, e = t.c / max(length(t.c), 1e-5); // the middle, on the board
    float r = t.r * R, d = t.d * R, see = smoothstep(px, 3.5 * px, r), size = tcSize(r);
    vec4 m = tcPiece(c);
    float loud = sat(m.a * 0.95 * ans), bd = band(size) * ans;
    vec3 paint = t.k < 0.5 ? white : t.k < 1.5 ? red : t.k < 2.5 ? indigo : ochre;
    vec3 tint = t.k < 0.5 ? uKind[1] : t.k < 1.5 ? uKind[3] : t.k < 2.5 ? uKind[0] : uKind[2];
    float base = t.k < 2.5 ? 0.46 + 0.1 * smoothstep(0.35, 0.6, size) : 0.2 + 0.2 * smoothstep(0.2, 0.5, size), own = t.k < 0.5 ? uPad : t.k < 1.5 ? uPhrase : t.k < 2.5 ? uDrone : uTexture;
    tint = mix(tint, m.rgb / max(m.a, 0.02), 0.6 * loud);
    float lum = dot(paint, vec3(0.3, 0.6, 0.1)), tl = max(dot(tint, vec3(0.3, 0.6, 0.1)), 0.08);
    paint = mix(paint, min(tint * (lum + 0.05) / tl, 1.0), 0.1 + (t.k < 0.5 ? 0.16 : 0.38) * loud);
    float hit = tcStruck(-e.y / max(1.0 - e.x, 1e-5), t.rim) * uHits;
    wet = max(hit, tcCue(size));
    float A = base + 0.42 * loud + 0.13 * bd + age + 0.07 * own * ans + wet;
    float inset = min(0.0034, 0.16 * r);
    A -= 0.14 * exp(-max(d - inset, 0.0) / (0.01 + 0.05 * r));
    float th = min(0.12 + 0.68 * A, 0.585) + 0.3 * wet;
    float on = smoothstep(wear - 0.035, wear + 0.035, th), thin = smoothstep(wear, wear + 0.4, th);
    on = mix(sat(th * 1.4), on, smoothstep(2.0 * px, 7.0 * px, r));
    on *= smoothstep(inset - 0.7 * px, inset + 0.7 * px, d);
    paint *= 0.80 + 0.16 * noise(p * vec2(9.0, 60.0)) + 0.24 * worn; // chalk, laid with a wide brush
    paint *= mix(vec3(1.0), 0.75 + 0.5 * wood, 0.6 - 0.4 * thin);       // the grain comes through where it is thin
    paint *= 0.94 + 0.22 * bd;
    paint = mix(paint, min(paint * 1.35 + 0.05, 1.0), wet);
    col = mix(col, paint, on * (0.82 + 0.15 * thin) * see);
    rake *= 1.0 - 0.6 * on * thin;
    col *= 1.0 - 0.5 * on * (1.0 - on) * see;
    // wet paint holds the light of the sky along its upper left
    vec2 g = rot(0.5) * (p - c) / r - vec2(0.0, 0.3);
    col += vec3(0.16, 0.17, 0.18) * wet * on * exp(-g.y * g.y * 22.0 - g.x * g.x * 2.0) * (0.5 + rake * 2.0 + 0.5 * h);
    // the scribed line and its lit lip
    float edge = d - 0.5 * inset, face = dot((p - c) / r, vec2(0.55, -0.83));
    col *= 1.0 - 0.65 * see * (1.0 - smoothstep(0.0, 0.0012 + 0.6 * px, abs(edge)));
    col *= 1.0 + 0.35 * see * face * (1.0 - smoothstep(0.0, 0.0025 + px, abs(edge - 0.0022))) * smoothstep(0.01, 0.03, r);
    // the hole of the compass; the keys dot it with chalk
    float q = length(p - c), big = smoothstep(0.012, 0.03, r);
    col = mix(col, white, uKeys * big * (1.0 - smoothstep(-px, px, q - min(0.011, 0.2 * r))));
    col *= 1.0 - 0.85 * big * (1.0 - smoothstep(0.0012, 0.0022 + px, q));
  }
  // the great ring in its dark paint; phrases ink where a circle touches it
  float wr = 0.026 + 0.016 * uDrone * ans, dr = (rr - 1.0) * R;
  float bandOn = smoothstep(-px, px, dr) * (1.0 - smoothstep(wr - px, wr + px, dr)), on = smoothstep(wear - 0.04, wear + 0.04, 0.56 + 0.2 * uDrone * ans + age);
  col = mix(col, mix(indigo * 0.62, uKind[0] * 0.28, 0.25 + 0.2 * uDrone) * (0.85 + 0.3 * h), bandOn * (0.3 + 0.64 * on));
  col *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.0012 + px, abs(dr - wr - 0.007)));
  if (off && t.r > 0.0) {
    float r = t.r * R, spot = min(0.0085, 0.25 * r);
    vec2 o = rot(0.5) * t.c / max(length(t.c), 1e-5) * (R + 0.5 * wr) + at;
    col = mix(col, mix(white, uKind[3], 0.25), t.rim * (0.12 + 0.88 * sat(uPhrase * 1.6 * ans)) * (1.0 - smoothstep(-px, px, length(p - o) - spot)) * smoothstep(2.0 * px, 5.0 * px, r));
  }
  // the seams and the nail heads
  col *= 1.0 - 0.85 * (1.0 - smoothstep(0.0012, 0.003 + px, s));
  col = mix(col, vec3(0.13, 0.11, 0.10) * (1.0 + 60.0 * max(dot(nl, vec2(-0.6, 0.8)), 0.0)), (1.0 - smoothstep(-px, px, nd)));
  // daylight under the eaves: low from the upper left, and the eave's own soft shadow down the right
  float eave = dot(p, vec2(0.94, 0.34)) - 0.46 - 0.02 * sin(uTime * 0.05) - 0.25 * (wide - 1.0);
  float lit = 1.25 - 0.22 * smoothstep(-0.9, 0.7, dot(p, vec2(0.7, -0.7))) - 0.5 * smoothstep(-0.16 - 0.2 * uSpace, 0.16 + 0.2 * uSpace, eave);
  col *= lit * (0.84 + 0.22 * uTone + 0.08 * uMic) * (1.0 + rake * 1.2);
  return col * mix(vec3(0.94, 0.97, 1.06), vec3(1.03, 1.0, 0.95), sat(lit));
}
// ---- the page
vec3 tcPaper(vec2 p) {
  float px = tcPx, ans = 0.55 + uEnergy;
  float wide = clamp(uRes.x / uRes.y / 1.78, 0.45, 1.25), y0 = -0.315;
  // old paper: long fibres, damp, a brown edge, two folds
  float fib = 0.5 * noise(rot(0.35) * p * vec2(16.0, 150.0)) + 0.3 * noise(rot(-1.2) * p * vec2(22.0, 170.0) + 7.0) + 0.2 * noise(p * vec2(7.0, 260.0)), damp = fbm(p * 1.9 + 3.0);
  vec3 col = mix(vec3(0.80, 0.69, 0.49), vec3(0.905, 0.835, 0.675), smoothstep(0.25, 0.75, damp) * 0.75 + 0.25 * noise(p * 70.0) - 0.04);
  col *= 0.965 + (0.05 + 0.05 * uTexture) * fib;
  float tide = length((p - vec2(0.86 * wide, 0.42)) * vec2(0.8, 1.0)) - 0.36 - 0.09 * noise(p * 4.5) - 0.02 * uPad;
  col *= mix(vec3(1.0), vec3(0.93, 0.87, 0.77), (0.35 + 0.65 * exp(-abs(tide) * 70.0)) * (1.0 - smoothstep(-0.004, 0.004, tide)));
  for (int i = 0; i < 2; i++) {
    float f = p.x - (i == 0 ? -0.335 : 0.345) * wide - 0.002 * sin(p.y * 9.0);
    col *= 1.0 - 0.10 * exp(-abs(f) * 340.0) * noise(vec2(p.y * 60.0, f * 200.0)) - 0.045 * exp(-max(f, 0.0) * 26.0) * step(0.0, f) + 0.03 * exp(min(f, 0.0) * 40.0) * step(f, 0.0);
  }
  vec2 z = (p - vec2(0.0, y0)) / wide;
  bool under = z.y < 0.0;
  z.y = abs(z.y);
  tcLine();
  TcC t = tcFind(z, px / wide);
  vec3 ink = vec3(0.085, 0.075, 0.075);
  float dry = 0.75 + 0.35 * noise(p * vec2(40.0, 55.0));
  float lay = under ? 0.1 + 0.15 * uMic : 1.0, land = 0.0;
  if (t.r > 0.0) {
    float r = t.r * wide, size = tcSize(r), see = smoothstep(px, 3.5 * px, r);
    vec2 c = t.c * wide + vec2(0.0, y0), pp = vec2(p.x, y0 + z.y * wide);
    float q = length(pp - c), d = t.d * wide;
    vec4 m = tcPiece(c);
    float loud = sat(m.a * 1.2 * ans) * (1.0 - smoothstep(1.0, 2.6, r)), bd = band(size) * ans;
    float hit = tcStruck((t.c.x + 0.62) / (abs(0.8 - t.c.x) < 1e-4 ? 1e-4 : 0.8 - t.c.x), t.rim) * uHits * mix(1.0, 0.16 + 0.84 * exp(-max(d, 0.0) / 0.035), smoothstep(0.08, 0.22, r)), cue = tcCue(size), wet = max(0.85 * hit, 0.5 * cue * (1.0 - smoothstep(0.12, 0.7, r)));
    // a thin wash, pooled at its rim
    vec3 wash = t.k < 0.5 ? vec3(0.78, 0.30, 0.18) : t.k < 1.5 ? vec3(0.24, 0.34, 0.50) : t.k < 2.5 ? vec3(0.80, 0.62, 0.28) : vec3(0.45, 0.47, 0.42);
    vec3 tint = t.k < 0.5 ? uKind[3] : t.k < 1.5 ? uKind[0] : t.k < 2.5 ? uKind[1] : uKind[2];
    tint = mix(tint, m.rgb / max(m.a, 0.02), 0.6 * loud);
    wash = mix(wash, sat(tint * 1.15), 0.2 + 0.3 * loud);
    wash = mix(wash, mix(vec3(0.93, 0.30, 0.17), uKind[4], 0.25), 0.75 * hit);
    float pool = 0.66 + 0.5 * exp(-max(d, 0.0) / 0.007) + 0.22 * exp(-max(d, 0.0) / 0.04) + 0.18 * (c.y - pp.y) / r + 0.16 * (fib - 0.5) + 0.5 * (damp - 0.5);
    float small = smoothstep(0.35, 0.6, size) * 0.35;
    float W = sat((small * step(t.k, 1.5) + 0.06 * step(t.k, 0.5) + 0.66 * loud + 0.35 * bd * step(t.k, 2.5) + wet) * pool) * see * smoothstep(0.0, 2.0 * px, d);
    col *= mix(vec3(1.0), wash, W * (under ? 0.12 : 0.9));
    float w = 0.0008 + 0.0016 * smoothstep(0.02, 0.2, r) + (0.0008 * uDrone * ans + 0.0016 * cue) * smoothstep(0.03, 0.2, r);
    float l = (1.0 - smoothstep(w - 0.6 * px, w + 0.6 * px, abs(d - w))) * dry;
    float gap = min(0.0085, 0.2 * r) + 2.0 * w;
    l = max(l, 0.75 * dry * (1.0 - smoothstep(0.0, 0.0005 + 0.6 * px, abs(d - gap))) * smoothstep(4.0 * px, 8.0 * px, r));
    l = max(l, 0.8 * (1.0 - smoothstep(0.005, 0.0075, r)));
    l = mix(0.55, l, see);
    float big = smoothstep(0.012, 0.03, r);
    // red guide lines of the compass: a plumb from each middle to the ground, and where it lands; phrases ink them
    float ph = sat(uPhrase * 1.5 * ans), drop = (1.0 - smoothstep(0.0, 0.0004 + 0.0004 * ph + 0.8 * px, abs(pp.x - c.x))) * step(pp.y, c.y);
    land = ph * t.rim * see * (1.0 - smoothstep(-px, px, length(pp - vec2(c.x, y0)) - min(0.009, 0.22 * r)));
    col = mix(col, vec3(0.66, 0.16, 0.09), drop * big * (0.4 + 0.6 * ph) * t.rim * lay);
    l = max(l, big * (1.0 - smoothstep(0.0008, 0.0016 + 0.7 * px, q)));
    l = max(l, uKeys * big * (1.0 - smoothstep(-px, px, q - min(0.011, 0.2 * r))));
    col = mix(col, ink, sat(l) * lay * 0.92);
  } else col = mix(col, ink, 0.5 * lay);
  col = mix(col, ink, dry * (1.0 - smoothstep(-px, px, abs(p.y - y0) - 0.0016 - 0.0012 * uDrone * ans)));
  col = mix(col, mix(vec3(0.70, 0.15, 0.08), uKind[3], 0.25), land);
  col *= mix(vec3(1.0), vec3(0.8, 0.68, 0.5), 0.75 * smoothstep(0.36, 0.56, abs(p.y) + 0.05 * damp));
  float lit = 1.06 - 0.22 * smoothstep(-0.8, 0.9, dot(p, vec2(0.8, -0.6)));
  return col * lit * (0.9 + 0.16 * uTone);
}
vec3 render(vec2 p) {
  tcPx = 1.0 / uRes.y;
  tcM = exp(tcSlide());
  return uVar < 0.5 ? tcBoard(p) : tcPaper(p);
}
