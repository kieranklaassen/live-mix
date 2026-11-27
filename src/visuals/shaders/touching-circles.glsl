// name: Touching circles
// a: Painted board
// b: Ink lines
// what: Weathered cedar planks painted with circles that all touch: a great ring holds a few, the gaps hold smaller ones, down to seeds, in chalk white, oxide red and indigo worn back to the wood; or the same family in double ink lines on an old folded sheet, standing on a ruled line, each with the prick of the compass at its middle.
// follows: The family slides with the music, big circles shrinking as seeds open; the loop rocks it. Each circle reads the piece at its place: loud ones take full paint or a wash. The bands, low to high, fill great to small; drone weighs the ring or the lines, texture the grain, phrases mark the touching points. A hit repaints one, a cue runs through the sizes.
// own: 0 1 every circle holds a family, -1 only great ones; 1 1 balls, -1 bowls; 2 the ground: 1 pale, -1 night; 3 1 wrapped round a turning ball, -1 a floor to a horizon; 4 1 petals, -1 cut stones; 5 1 clear, only rims, -1 cut into rings; 6 1 many small wheels (b: the line bent into a ring), -1 grown past the picture (b: rows of lines); 7 1 full paint in the sounds' colours, -1 bare but where it sounds
float tcPx; // one pixel
float tcBend, tcBare, tcFar1, tcLamp; // the line bent; off the ball; far off; lamplight
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
  if (tcBend > 0.0) { tcB += 2.0 * tcBend * tcY + tcBend * tcBend * tcK; tcY += tcBend * tcK; }
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
    o.d = b < 1.0 ? -dot(f, m) / (1.0 + length(b * z - bc)) : 1.0 / b - length(z - o.c);
    o.r = 1.0 / b; o.k = dot(m, vec4(0, 1, 2, 3));
    o.rim = uVar < 0.5 ? step(b - (dot(o.c, o.c) * b - o.r), 3.0) : step(abs(o.c.y * b - 1.0 - tcBend * (dot(bc, bc) - 1.0) / b), 0.02);
    break;
  }
  return o;
}

// One circle of the chain takes the hit.
float tcStruck(float v, float rim) {
  float L = log(abs(v) + 1e-6), n = (L - log(tcM)) / 0.962424, near = floor(n + 0.5);
  float odd = mod(near, 2.0), sg = v < 0.0 ? 0.0 : 1.0;
  return rim * step(abs(n - near), 0.03) * step(abs(odd - sg), 0.5) * smoothstep(0.15, 0.75, 1.0 - abs(L) / (uVar < 0.5 ? 0.962424 : 1.924848)) * max(sg, 1.0 - uVar);
}
float tcSize(float r) { return sat(log2(0.3 / max(r, 1e-4)) / 6.0); } // 0 a great circle, 1 a seed
// The cue goes down the sizes, great ones first.
float tcCue(float size) { float f = (size - 1.15 * (1.0 - uCue)) * 5.0; return sat(uCue * 1.6) * exp(-f * f); }
vec4 tcPiece(vec2 c) { return piece(clamp(vec2(c.x / 1.5 + 0.5, 0.5 - c.y), 0.01, 0.99)); }
// How far along another wheel or row is.
float tcOther(float n) { return exp(tcFar * (fract(0.0085 * uTravel + 0.02 * sin(TAU * uLoop) + 0.17 + n) - 0.5)); }
// The family inside a circle. z is the place in it, r its radius on the picture.
void tcInner(inout TcC t, vec2 c, vec2 z, float r, float px) {
  float was = tcM, open = sat(uOwn[0]);
  tcM = tcOther(0.31 + 0.17 * t.k);
  tcRing();
  TcC u = tcFind(z / 0.94, px / (r * 0.94));
  tcM = was;
  float d = u.d - 0.5 * (1.0 - open) - 1.2 * u.r * (1.0 - open);
  if (u.r > 0.0 && d > 0.0) { t.k = mod(t.k + 1.0 + mod(u.k, 3.0), 4.0); t.r = u.r * 0.94; t.d = d * 0.94; t.c = u.c * 0.94; t.rim = 2.0; }
}
// The form in a circle: v the place in it, d the way in from its rim.
float tcForm(vec2 v, float d, float r, float k) {
  float a = atan(v.y, v.x + (v.x == 0.0 ? 1e-6 : 0.0)), q = length(v);
  if (uOwn[4] > 0.0) {
    float n = k < 0.5 ? 8.0 : k < 1.5 ? 5.0 : k < 2.5 ? 12.0 : 6.0, w = abs(cos(0.5 * n * (a + 0.25 * sin(uTime * 0.07 + k))));
    float leaf = 0.34 + 0.65 * sqrt(w + 0.002) - q;
    return mix(d, min(leaf, d / r) * r * 0.8, uOwn[4]);
  }
  float n = k < 0.5 ? 6.0 : k < 1.5 ? 4.0 : k < 2.5 ? 8.0 : 5.0, part = TAU / n;
  float f = mod(a + 0.7 * k + 0.12 * sin(uTime * 0.06 + k * 2.0), part) - 0.5 * part;
  return mix(d, (cos(0.5 * part) * 1.02 - q * cos(f)) * r, -uOwn[4]);
}
// Raised or sunk: the light on it.
vec3 tcRelief(vec3 c, vec2 v, float clear) {
  float k = abs(uOwn[1]), q = min(dot(v, v), 1.0), up = uOwn[1] > 0.0 ? 1.0 : -1.0;
  vec3 n = vec3(v * up, sqrt(1.0 - q + 1e-3));
  const vec3 l = vec3(-0.52, 0.56, 0.645);
  float lam = max(dot(n, l), 0.0), e = dot(reflect(vec3(0.0, 0.0, -1.0), n), l);
  float shade = up > 0.0 ? 0.16 + 1.15 * lam + 0.16 * q * max(-dot(v, l.xy), 0.0) : (0.12 + 1.2 * lam) * (1.0 - 0.25 * (1.0 - q));
  vec3 lit = c * shade;
  if (up > 0.0) lit += vec3(1.0, 0.97, 0.92) * (0.5 * smoothstep(0.90, 0.985, e) + 0.12 * smoothstep(0.5, 1.0, e)) * (1.0 - 0.5 * clear) * (1.0 - 0.65 * max(uOwn[2], 0.0));
  else lit += c * 0.5 * smoothstep(0.75, 1.0, q) * max(dot(v, -l.xy), 0.0);
  return mix(c, lit, k * (1.0 - 0.75 * clear));
}
// Clear inside: a bright rim, and the sky's light on it when it stands up.
vec3 tcClear(vec2 v, vec3 tint, float loud) {
  float q = min(length(v), 1.0), up = max(uOwn[1], 0.0);
  vec2 g = v * rot(0.6) - vec2(-0.03, 0.62), h = v * rot(0.6) + vec2(0.0, 0.72);
  return (tint * (0.5 * q * q * q * q + 0.1 * q + 0.35 * loud * q * q) + up * (0.65 * exp(-g.y * g.y * 190.0 - g.x * g.x * 12.0) + 0.22 * exp(-h.y * h.y * 240.0 - h.x * h.x * 9.0))) * (0.4 + 0.6 * loud + up * 0.25);
}
// The kind of sound a family is painted for.
vec3 tcDye(float k) { return k < 0.5 ? uKind[1] : k < 1.5 ? uKind[3] : k < 2.5 ? uKind[0] : uKind[2]; }
// Fine rings, w apart.
float tcRings(float d, float w, float px) { float f = abs(fract(d / w) - 0.5) * w; return mix(smoothstep(0.25 * w - px, 0.25 * w + px, f), 0.5, smoothstep(0.2, 0.6, px / w)); }
// The ground when it is neither wood nor old paper.
vec3 tcGround(vec3 c, vec2 p, float soft) {
  float m = noise(p * 2.3 + 11.0), g = noise(p * 61.0) * 0.5 + noise(p * 170.0) * 0.5;
  if (uOwn[2] > 0.0) return mix(c, mix(vec3(0.83, 0.815, 0.775), uKind[1], 0.14) * (0.95 + 0.07 * m + 0.07 * (g - 0.5)), uOwn[2]);
  return mix(c, (vec3(0.02, 0.023, 0.031) + 0.07 * uKind[0] * uKind[0]) * (0.7 + 0.5 * m + 0.4 * (g - 0.5) * soft), -uOwn[2]);
}
// Where the eye's way meets the board or page.
vec2 tcEye(vec2 p) {
  tcBare = 0.0; tcFar1 = 0.0; tcLamp = 1.0;
  if (uOwn[3] > 0.0) {
    float k = uOwn[3], R = 0.43 / k;
    vec2 n = p / R;
    float q = dot(n, n);
    if (q >= 1.0) { tcBare = (sqrt(q) - 1.0) * R + 1e-4; return p; }
    vec3 v = vec3(n, sqrt(1.0 - q)), l = vec3(-0.5, 0.55, 0.67);
    tcLamp = mix(1.0, (0.12 + 0.2 * max(uOwn[2], 0.0) + 1.15 * max(dot(v, l), 0.0)) * (1.0 - 0.35 * q * q), k);
    float nz = v.z, a = k * k * 0.45 * sin(uTime * 0.021), b = k * k * 0.9 * sin(uTime * 0.017 + 0.6);
    v.yz = rot(a) * v.yz; v.xz = rot(b) * v.xz;
    float w = max(1.0 + v.z, 0.02);
    tcPx *= 2.0 / w / max(sqrt(nz), 0.3);
    return 2.0 * R * v.xy / w;
  }
  float k = -uOwn[3], w = 1.0 - k * 2.6 * p.y;
  if (w < 0.03) { tcBare = -1.0; return p; }
  tcFar1 = 1.0 - smoothstep(0.03, 0.5, w);
  float s = mix(1.0, 2.1, k);
  tcPx *= s / pow(w, 1.5);
  return vec2(p.x, p.y) * s / w + vec2(0.0, 0.08 * k);
}
vec3 tcBeyond(vec3 col, vec2 p) {
  float sh = smoothstep(0.62, 0.34, length(p - vec2(0.1, -0.1))), pale = max(uOwn[2], 0.0);
  return col * (0.62 - 0.45 * sh * (1.0 - 0.3 * pale)) * (1.0 + 0.5 * pale);
}
vec3 tcSky(vec2 p) {
  float y = sat((p.y - 0.28) * 4.0), n = fbm(p * vec2(2.2, 8.0) + vec2(uTime * 0.006, 3.0));
  vec3 day = mix(vec3(0.80, 0.755, 0.69), vec3(0.50, 0.555, 0.60), y), pale = mix(mix(vec3(0.93, 0.91, 0.87), uKind[1], 0.2), mix(vec3(0.72, 0.76, 0.80), uKind[0], 0.25), y);
  vec3 dark = mix(mix(vec3(0.13, 0.14, 0.17), uKind[1], 0.16), vec3(0.02, 0.024, 0.036), y);
  vec3 c = mix(mix(day, pale, max(uOwn[2], 0.0)), dark, max(-uOwn[2], 0.0));
  return c * (0.9 + 0.2 * n) * (0.9 + 0.2 * uLevel);
}
// ---- the board: three cedar planks, silvered. h is the height of the grain.
float tcHeight(vec2 p, out float kn, out float line) {
  float id = p.y > 0.205 ? 1.0 : p.y > -0.235 ? 0.0 : 2.0;
  vec2 q = p + vec2(id * 5.3, id * 1.7);
  float y = p.y - (id < 0.5 ? -0.06 : id < 1.5 ? 0.50 : -0.47) + 0.05 * noise(q * vec2(1.4, 1.1)) + 0.012 * noise(q * vec2(6.0, 5.0));
  vec2 k = p - vec2(0.62, 0.03), e = k * vec2(0.8, 1.5);
  kn = exp(-dot(e, e) * 55.0);
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
  float s = min(abs(p.y - 0.205), abs(p.y + 0.235));
  vec2 nl = vec2(abs(p.x) - 0.8, p.y > 0.205 ? p.y - 0.35 : p.y > -0.235 ? p.y + 0.02 : p.y + 0.37);
  float nd = length(nl) - 0.0062;
  float made = 1.0 - abs(uOwn[2]);
  wood *= mix(vec3(1.0), vec3(0.6, 0.42, 0.33), (1.0 - smoothstep(0.0, 0.011, abs(nl.x + 0.003 * sin(p.y * 60.0)))) * (1.0 - smoothstep(-0.01, 0.0, nl.y)) * smoothstep(-0.17, 0.0, nl.y) * 0.75);
  vec3 white = vec3(0.755, 0.715, 0.63), red = vec3(0.62, 0.185, 0.11), indigo = vec3(0.10, 0.155, 0.285), ochre = vec3(0.70, 0.49, 0.21);
  float wide = clamp(uRes.x / uRes.y / 1.78, 0.3, 1.1);
  vec2 at = vec2(-0.27 * wide, -0.085);
  float R = 0.535, spin = 0.0;
  if (uOwn[2] != 0.0) { wood = tcGround(wood, p, 1.0); h = mix(0.36, h, made); rake *= made; }
  vec3 ground = wood;
  if (tcBare != 0.0) return tcBeyond(wood, p) * (0.84 + 0.22 * uTone);
  if (uOwn[3] > 0.0) { at = mix(at, vec2(0.0), uOwn[3]); R = mix(R, 0.46, uOwn[3]); }
  if (uOwn[3] < 0.0) at = mix(at, vec2(0.0, 0.2), -uOwn[3]);
  if (uOwn[6] < 0.0) { R *= exp2(1.35 * -uOwn[6]); at = mix(at, vec2(-0.35, 0.3), -uOwn[6]); }
  if (uOwn[6] > 0.0) {
    float l = uOwn[6], apart = 1.0 - l;
    R *= exp2(-1.75 * l);
    float L = 2.22 * R + 3.0 * apart * apart;
    at = mix(at, vec2(0.0), l);
    vec2 q = (p - at) / L, best = vec2(0.0);
    float j0 = floor(q.y / 0.8660254), far = 1e3;
    for (float j = 0.0; j < 1.5; j++) {
      float row = j0 + j, off0 = 0.5 * mod(row, 2.0), i = floor(q.x - off0 + 0.5);
      vec2 m = vec2(i + off0, row * 0.8660254), e = q - m;
      if (dot(e, e) < far) { far = dot(e, e); best = m; spin = (i == 0.0 && row == 0.0) ? 0.0 : hash21(vec2(i, row) + 3.0); }
    }
    at += best * L;
    if (spin > 0.0) tcM = tcOther(spin);
    spin *= TAU;
  }
  float far1 = R / 0.535;
  vec2 z = rot(-0.5) * (p - at) / R;
  if (spin != 0.0) z = rot(-spin) * z;
  float rr = length(z);
  bool off = rr > 1.0;
  float less = 1.0, out1 = 1.0;
  if (off && uOwn[3] > 0.0) { off = false; out1 = smoothstep(0.2, 0.8, uOwn[3]); float k = rr * rr; z /= k; px /= k; rr = 1.0 / rr; }
  tcRing();
  TcC t = tcFind(off ? z / max(dot(z, z), 1e-6) : z, px / R);
  vec3 col = wood;
  // how worn the paint is
  float wear = 0.46 * noise(p * vec2(2.6, 4.2) + 1.7) + 0.20 * noise(p * vec2(13.0, 30.0) + 5.0) + 0.17 * noise(p * vec2(38.0, 150.0)) + 0.1 * noise(rot(0.7) * p * 230.0) + 0.3 * h - 0.06;
  float age = 0.1 * uPad * ans, wet = 0.0;
  if (!off && t.r > 0.0) {
    if (spin != 0.0) t.c = rot(spin) * t.c;
    TcC par = t;
    if (uOwn[0] > 0.0 && t.r * R > 0.022) {
      vec2 zc = rot(spin) * z;
      tcInner(t, t.c, (zc - t.c) / t.r, t.r * R, px);
      if (t.rim > 1.5) { t.c = par.c + t.c * par.r; t.r *= par.r; t.d *= par.r; t.rim = 0.0; }
    }
    vec2 c = rot(0.5) * t.c * R + at, e = t.c / max(length(t.c), 1e-5); // the middle, on the board
    vec2 here = rot(0.5) * rot(spin) * z * R + at, v = (here - c) / max(t.r * R, 1e-5);
    if (spin != 0.0) e = rot(-spin) * par.c / max(length(par.c), 1e-5); else if (uOwn[0] > 0.0) e = par.c / max(length(par.c), 1e-5);
    float r = t.r * R, d = t.d * R, see = smoothstep(px, 3.5 * px, r), size = tcSize(r);
    vec4 m = tcPiece(c);
    float loud = sat(m.a * 0.95 * ans), bd = band(size) * ans;
    vec3 paint = t.k < 0.5 ? white : t.k < 1.5 ? red : t.k < 2.5 ? indigo : ochre;
    vec3 tint = t.k < 0.5 ? uKind[1] : t.k < 1.5 ? uKind[3] : t.k < 2.5 ? uKind[0] : uKind[2];
    float base = t.k < 2.5 ? 0.46 + 0.1 * smoothstep(0.35, 0.6, size) : 0.2 + 0.2 * smoothstep(0.2, 0.5, size), own = t.k < 0.5 ? uPad : t.k < 1.5 ? uPhrase : t.k < 2.5 ? uDrone : uTexture;
    tint = mix(tint, m.rgb / max(m.a, 0.02), 0.6 * loud);
    float lum = dot(paint, vec3(0.3, 0.6, 0.1)), tl = max(dot(tint, vec3(0.3, 0.6, 0.1)), 0.08);
    paint = mix(paint, min(tint * (lum + 0.05) / tl, 1.0), 0.1 + (t.k < 0.5 ? 0.16 : 0.38) * loud);
    float hit = tcStruck(-e.y / max(1.0 - e.x, 1e-5), par.rim) * uHits;
    if (uOwn[0] < 0.0) less = smoothstep(0.75, 1.15, r / (0.085 * -uOwn[0] * min(1.0, far1)));
    if (uOwn[7] > 0.0) paint = mix(paint, mix(tcDye(t.k), m.rgb / max(m.a, 0.02), 0.3 * loud) * (0.8 + 0.35 * loud), uOwn[7]);
    wet = max(hit, tcCue(size));
    float A = base + 0.42 * loud + 0.13 * bd + age + 0.07 * own * ans + wet;
    if (uOwn[7] != 0.0) A += uOwn[7] > 0.0 ? 0.5 * uOwn[7] : base * uOwn[7] * 1.25;
    if (uOwn[4] != 0.0) d = tcForm(rot(0.5) * v, d, r, t.k);
    float inset = min(0.0034, 0.16 * r);
    A -= 0.14 * exp(-max(d - inset, 0.0) / (0.01 + 0.05 * r));
    float th = min(0.12 + 0.68 * A, 0.585) + 0.3 * wet + 0.25 * max(uOwn[7], 0.0);
    float on = smoothstep(wear - 0.035, wear + 0.035, th), thin = smoothstep(wear, wear + 0.4, th);
    on = mix(sat(th * 1.4), on, smoothstep(2.0 * px, 7.0 * px, r));
    on *= smoothstep(inset - 0.7 * px, inset + 0.7 * px, d);
    paint *= 0.80 + 0.16 * noise(p * vec2(9.0, 60.0)) + 0.24 * worn;
    paint *= mix(vec3(1.0), 0.75 + 0.5 * wood, 0.6 - 0.4 * thin);
    paint *= 0.94 + 0.22 * bd;
    paint = mix(paint, min(paint * 1.35 + 0.05, 1.0), wet);
    see *= less * out1;
    if (uOwn[5] < 0.0) {
      float w = 0.026 * clamp(far1, 0.45, 1.5), g = tcRings(d, w, px);
      paint = mix(paint, mix(ground, paint, 0.16) * (1.0 - 0.1 * g), -uOwn[5] * g * (1.0 - 0.5 * wet));
    }
    if (uOwn[5] > 0.0) {
      float rim = 1.0 - smoothstep(0.0, 0.0035 + 0.05 * r, max(d - inset, 0.0)), k = uOwn[5];
      on *= mix(1.0, max(rim, 0.55 * loud * loud + 0.75 * wet), k);
      vec3 cl = tcClear(v, paint, loud) * smoothstep(0.0, 2.0 * px, d) * k * see * smoothstep(2.0 * px, 7.0 * px, r);
      col = col * (1.0 - 0.35 * k * see * max(uOwn[1], 0.0) * smoothstep(0.0, 2.0 * px, d)) + cl * mix(1.0, 0.25, max(uOwn[2], 0.0));
      if (uOwn[2] > 0.0) col = mix(col, col * mix(vec3(1.0), paint, 0.75), k * uOwn[2] * see * smoothstep(0.0, 2.0 * px, d) * (0.3 + 0.5 * dot(v, v)));
    }
    if (uOwn[4] != 0.0) col *= 1.0 - 0.5 * abs(uOwn[4]) * less * smoothstep(px, -px, d) * exp(min(d, 0.0) / (0.006 + 0.08 * r));
    col = mix(col, paint, on * (0.82 + 0.15 * thin) * see);
    rake *= 1.0 - 0.6 * on * thin;
    col *= 1.0 - 0.5 * on * (1.0 - on) * see;
    vec2 g = rot(0.5) * (uOwn[3] > 0.0 ? v : (p - c) / r) - vec2(0.0, 0.3);
    col += vec3(0.16, 0.17, 0.18) * wet * on * exp(-g.y * g.y * 22.0 - g.x * g.x * 2.0) * (0.5 + rake * 2.0 + 0.5 * h);
    if (uOwn[1] != 0.0) { float in1 = see * smoothstep(0.0, 2.0 * px, d); col = mix(col, tcRelief(col, v, max(uOwn[5], 0.0) * (1.0 - on)), in1); }
    float edge = d - 0.5 * inset, face = dot(uOwn[3] > 0.0 ? v : (p - c) / r, vec2(0.55, -0.83));
    col *= 1.0 - 0.65 * see * (1.0 - smoothstep(0.0, 0.0012 + 0.6 * px, abs(edge)));
    col *= 1.0 + 0.35 * see * face * (1.0 - smoothstep(0.0, 0.0025 + px, abs(edge - 0.0022))) * smoothstep(0.01, 0.03, r);
    float q = length(uOwn[3] > 0.0 ? v * r : p - c), big = smoothstep(0.012, 0.03, r);
    if (uOwn[1] != 0.0 || uOwn[0] < 0.0) big *= less * (1.0 - abs(uOwn[1]));
    if (uOwn[3] > 0.0) big *= out1;
    col = mix(col, white, uKeys * big * (1.0 - smoothstep(-px, px, q - min(0.011, 0.2 * r))));
    col *= 1.0 - 0.85 * big * (1.0 - smoothstep(0.0012, 0.0022 + px, q));
  }
  // the great ring
  float wr = 0.026 + 0.016 * uDrone * ans, dr = (rr - 1.0) * R;
  if (uOwn[6] > 0.0) wr *= mix(1.0, 1.4 * far1, uOwn[6]);
  if (uOwn[3] > 0.0) wr *= 1.0 - 0.5 * uOwn[3];
  float bandOn = smoothstep(-px, px, dr) * (1.0 - smoothstep(wr - px, wr + px, dr)), on = smoothstep(wear - 0.04, wear + 0.04, 0.56 + 0.2 * uDrone * ans + age);
  if (uOwn[7] > 0.0) indigo = mix(indigo, uKind[0], uOwn[7]);
  col = mix(col, mix(indigo * 0.62, uKind[0] * 0.28, 0.25 + 0.2 * uDrone) * (0.85 + 0.3 * h), bandOn * (0.3 + 0.64 * on));
  col *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.0012 + px, abs(dr - wr - 0.007)));
  if (off && t.r > 0.0) {
    float r = t.r * R, spot = min(0.0085 * min(far1, 1.0), 0.25 * r);
    if (spin != 0.0) t.c = rot(spin) * t.c;
    vec2 o = rot(0.5) * t.c / max(length(t.c), 1e-5) * (R + 0.5 * wr) + at;
    col = mix(col, mix(white, uKind[3], 0.25), t.rim * (0.12 + 0.88 * sat(uPhrase * 1.6 * ans)) * (1.0 - smoothstep(-px, px, length(p - o) - spot)) * smoothstep(2.0 * px, 5.0 * px, r));
  }
  px = tcPx;
  col *= 1.0 - 0.85 * made * (1.0 - smoothstep(0.0012, 0.003 + px, s));
  col = mix(col, vec3(0.13, 0.11, 0.10) * (1.0 + 60.0 * max(dot(nl, vec2(-0.6, 0.8)), 0.0)), made * (1.0 - smoothstep(-px, px, nd)));
  // daylight under the eaves
  float eave = dot(p, vec2(0.94, 0.34)) - 0.46 - 0.02 * sin(uTime * 0.05) - 0.25 * (wide - 1.0);
  float lit = 1.25 - 0.22 * smoothstep(-0.9, 0.7, dot(p, vec2(0.7, -0.7))) - 0.5 * made * (1.0 - abs(uOwn[3])) * smoothstep(-0.16 - 0.2 * uSpace, 0.16 + 0.2 * uSpace, eave);
  if (uOwn[3] < 0.0) lit = mix(lit, 1.0, -uOwn[3]);
  col *= lit * (0.84 + 0.22 * uTone + 0.08 * uMic) * (1.0 + rake * 1.2);
  return col * mix(vec3(0.94, 0.97, 1.06), vec3(1.03, 1.0, 0.95), sat(lit));
}
// ---- the page
vec3 tcPaper(vec2 p) {
  float px = tcPx, ans = 0.55 + uEnergy;
  float wide = clamp(uRes.x / uRes.y / 1.78, 0.45, 1.25), y0 = -0.315;
  float fib = 0.5 * noise(rot(0.35) * p * vec2(16.0, 150.0)) + 0.3 * noise(rot(-1.2) * p * vec2(22.0, 170.0) + 7.0) + 0.2 * noise(p * vec2(7.0, 260.0)), damp = fbm(p * 1.9 + 3.0);
  vec3 col = mix(vec3(0.80, 0.69, 0.49), vec3(0.905, 0.835, 0.675), smoothstep(0.25, 0.75, damp) * 0.75 + 0.25 * noise(p * 70.0) - 0.04);
  col *= 0.965 + (0.05 + 0.05 * uTexture) * fib;
  float tide = length((p - vec2(0.86 * wide, 0.42)) * vec2(0.8, 1.0)) - 0.36 - 0.09 * noise(p * 4.5) - 0.02 * uPad;
  col *= mix(vec3(1.0), vec3(0.93, 0.87, 0.77), (0.35 + 0.65 * exp(-abs(tide) * 70.0)) * (1.0 - smoothstep(-0.004, 0.004, tide)));
  for (int i = 0; i < 2; i++) {
    float f = p.x - (i == 0 ? -0.335 : 0.345) * wide - 0.002 * sin(p.y * 9.0);
    col *= uOwn[3] != 0.0 ? 1.0 : 1.0 - 0.10 * exp(-abs(f) * 340.0) * noise(vec2(p.y * 60.0, f * 200.0)) - 0.045 * exp(-max(f, 0.0) * 26.0) * step(0.0, f) + 0.03 * exp(min(f, 0.0) * 40.0) * step(f, 0.0);
  }
  vec2 gp = p;
  float lies = 1.0;
  if (uOwn[2] != 0.0) col = tcGround(col, p, 1.0);
  if (tcBare != 0.0) return tcBeyond(col, p) * (0.9 + 0.16 * uTone);
  vec3 ground = col;
  if (uOwn[3] > 0.0) y0 = mix(y0, -0.3, uOwn[3]);
  if (uOwn[6] < 0.0) {
    float l = -uOwn[6], apart = 1.0 - l, H = 0.262 + 2.4 * apart * apart, y1 = mix(y0, -0.455, l), row = floor((p.y - y1) / H);
    wide *= mix(1.0, 0.4, l);
    y0 = y1 + row * H;
    if (row != 0.0 || l > 0.6) { float n = hash11(row + 4.0); gp.x += (n - 0.5) * 0.9; tcM = tcOther(n * 3.0); }
  }
  tcBend = 0.0;
  if (uOwn[6] > 0.0) { tcBend = 1.12 * uOwn[6] / (uOwn[3] > 0.0 ? 1.0 + uOwn[3] : 1.0); y0 = mix(y0, uOwn[3] > 0.0 ? -0.315 : -0.45, uOwn[6]); }
  vec2 z = (gp - vec2(0.0, y0)) / wide, bent = vec2(0.0);
  bool under = z.y < 0.0;
  float rule = abs(p.y - y0);
  if (tcBend > 0.0) {
    vec2 s = z, k = vec2(1.0 - tcBend * s.y, tcBend * s.x);
    float kk = max(dot(k, k), 1e-4);
    z = vec2(dot(s, k), s.y * k.x - s.x * k.y) / kk;
    under = z.y < 0.0;
    vec2 j = vec2(1.0 + tcBend * z.y, -tcBend * z.x);
    rule = abs(z.y) / max(dot(j, j), 1e-4) * wide;
    z.y = abs(z.y);
    j = vec2(1.0 + tcBend * z.y, -tcBend * z.x);
    float jj = max(dot(j, j), 1e-4);
    if (under) px /= max(1.0, 0.5 * abs(jj * kk)) ;
    bent = z;
    z = vec2(dot(z, j), z.y * j.x - z.x * j.y) / jj;
  } else z.y = abs(z.y);
  tcLine();
  TcC t = tcFind(z, px / wide);
  vec3 ink = vec3(0.085, 0.075, 0.075);
  float dry = 0.75 + 0.35 * noise(p * vec2(40.0, 55.0));
  float lay = under ? 0.1 + 0.15 * uMic : 1.0, land = 0.0, night = max(-uOwn[2], 0.0), dyed = max(uOwn[7], 0.0), less = 1.0;
  if (night > 0.0) ink = mix(ink, mix(vec3(0.80, 0.78, 0.71), uKind[1], 0.25), night);
  if (under && uOwn[3] != 0.0) lay = mix(lay, uOwn[3] > 0.0 ? 1.0 : 0.6, abs(uOwn[3]));
  if (t.r > 0.0) {
    TcC par = t;
    if (uOwn[0] > 0.0 && t.r * wide > 0.022 && t.r < 1.6) {
      tcInner(t, t.c, (z - t.c) / t.r, t.r * wide, px);
      if (t.rim > 1.5) { t.c = par.c + t.c * par.r; t.r *= par.r; t.d *= par.r; t.rim = 0.0; }
    }
    float r = t.r * wide, size = tcSize(r), see = smoothstep(px, 3.5 * px, r);
    vec2 c = t.c * wide + vec2(0.0, y0), pp = tcBend > 0.0 ? z * wide + vec2(0.0, y0) : vec2(gp.x, y0 + z.y * wide), v = (pp - c) / r;
    float q = length(pp - c), d = t.d * wide, foot = par.c.x;
    if (tcBend > 0.0) {                                  // where it touches the bent line, on the straight one
      vec2 C = vec2(0.0, 0.5 / tcBend), o = par.c - C, a = C + o / max(length(o), 1e-5) * C.y, k = vec2(1.0 - tcBend * a.y, tcBend * a.x);
      foot = dot(a, k) / max(dot(k, k), 1e-4);
    }
    vec4 m = tcPiece(c - (gp - p));
    float loud = sat(m.a * 1.2 * ans) * (1.0 - smoothstep(1.0, 2.6, r)), bd = band(size) * ans;
    float hit = tcStruck((foot + 0.62) / (abs(0.8 - foot) < 1e-4 ? 1e-4 : 0.8 - foot), par.rim) * uHits * mix(1.0, 0.16 + 0.84 * exp(-max(d, 0.0) / 0.035), smoothstep(0.08, 0.22, r)), cue = tcCue(size), wet = max(0.85 * hit, 0.5 * cue * (1.0 - smoothstep(0.12, 0.7, r)));
    if (uOwn[0] < 0.0) less = smoothstep(0.75, 1.15, r / (0.07 * -uOwn[0] * min(1.0, 1.6 * wide)));
    if (uOwn[4] != 0.0) d = tcForm(v, d, r, t.k);
    vec3 wash = t.k < 0.5 ? vec3(0.78, 0.30, 0.18) : t.k < 1.5 ? vec3(0.24, 0.34, 0.50) : t.k < 2.5 ? vec3(0.80, 0.62, 0.28) : vec3(0.45, 0.47, 0.42);
    vec3 tint = t.k < 0.5 ? uKind[3] : t.k < 1.5 ? uKind[0] : t.k < 2.5 ? uKind[1] : uKind[2];
    tint = mix(tint, m.rgb / max(m.a, 0.02), 0.6 * loud);
    wash = mix(wash, sat(tint * 1.15), 0.2 + 0.3 * loud);
    wash = mix(wash, mix(vec3(0.93, 0.30, 0.17), uKind[4], 0.25), 0.75 * hit);
    float pool = 0.66 + 0.5 * exp(-max(d, 0.0) / 0.007) + 0.22 * exp(-max(d, 0.0) / 0.04) + 0.18 * (c.y - pp.y) / r + 0.16 * (fib - 0.5) + 0.5 * (damp - 0.5);
    float small = smoothstep(0.35, 0.6, size) * 0.35;
    float W = sat((small * step(t.k, 1.5) + 0.06 * step(t.k, 0.5) + 0.66 * loud + 0.35 * bd * step(t.k, 2.5) + wet) * pool) * see * smoothstep(0.0, 2.0 * px, d);
    if (uOwn[7] != 0.0) { wash = mix(wash, mix(tcDye(t.k), m.rgb / max(m.a, 0.02), 0.3 * loud) * (0.85 + 0.3 * loud), dyed); W = uOwn[7] > 0.0 ? mix(W, sat((0.72 + 0.3 * loud + wet) * (0.75 + 0.35 * pool)) * see * smoothstep(0.0, 2.0 * px, d), dyed) : W * mix(1.0, sat(1.3 * loud + wet), -uOwn[7]); }
    float rg = uOwn[5] < 0.0 ? tcRings(d, 0.024 * clamp(wide, 0.5, 1.2), px) : 0.5;
    if (uOwn[0] < 0.0 || uOwn[4] != 0.0) { W *= less * smoothstep(-px, px, d); see *= less; }
    if (uOwn[5] < 0.0) W *= 1.0 + uOwn[5] * 0.9 * rg;
    if (uOwn[5] > 0.0) W *= mix(1.0, sat(0.35 * loud + wet + exp(-max(d, 0.0) / (0.004 + 0.06 * r))), uOwn[5]);
    float over = max(night, dyed);
    vec3 laid = col * mix(vec3(1.0), wash, W * (under ? mix(0.12, 0.9, max(uOwn[3], 0.0)) : 0.9));
    if (over > 0.0) laid = mix(laid, mix(col, wash * (0.6 + 0.45 * loud + 0.4 * wet), W * (under ? 0.9 * lay : 0.95)), over);
    col = laid;
    if (uOwn[5] > 0.0) { col += tcClear(v, wash, loud) * uOwn[5] * see * smoothstep(0.0, 2.0 * px, d) * lay * (night + 0.25 * max(uOwn[1], 0.0)); }
    if (uOwn[1] != 0.0) col = mix(col, tcRelief(col, v, max(uOwn[5], 0.0)), see * smoothstep(0.0, 2.0 * px, d) * max(lay, 0.15) * smoothstep(3.0, 1.0, r));
    float w = 0.0008 + 0.0016 * smoothstep(0.02, 0.2, r) + (0.0008 * uDrone * ans + 0.0016 * cue) * smoothstep(0.03, 0.2, r);
    float l = (1.0 - smoothstep(w - 0.6 * px, w + 0.6 * px, abs(d - w))) * dry;
    float gap = min(0.0085, 0.2 * r) + 2.0 * w;
    l = max(l, 0.75 * dry * (1.0 - smoothstep(0.0, 0.0005 + 0.6 * px, abs(d - gap))) * smoothstep(4.0 * px, 8.0 * px, r));
    l = max(l, 0.8 * (1.0 - smoothstep(0.005, 0.0075, r)));
    if (uOwn[4] != 0.0) l *= smoothstep(-2.0 * w, 0.0, d);
    if (uOwn[5] < 0.0) l = max(l, -uOwn[5] * 0.5 * dry * (1.0 - abs(rg * 2.0 - 1.0)) * smoothstep(0.0, px, d));
    l = mix(0.55, l, see);
    if (uOwn[0] < 0.0) l *= less;
    if (uOwn[1] != 0.0 || dyed > 0.0) l *= 1.0 - max(0.8 * abs(uOwn[1]), 0.6 * dyed);
    float big = smoothstep(0.012, 0.03, r), drops = (1.0 - max(uOwn[6], 0.0)) * (1.0 - abs(uOwn[1])) * (1.0 - max(uOwn[3], 0.0)) * (1.0 - dyed);
    if (uOwn[1] != 0.0 || uOwn[0] < 0.0) big *= less * (1.0 - abs(uOwn[1]));
    // a plumb from each middle to the ground; phrases ink them
    float ph = sat(uPhrase * 1.5 * ans), drop = (1.0 - smoothstep(0.0, 0.0004 + 0.0004 * ph + 0.8 * px, abs(pp.x - c.x))) * step(pp.y, c.y);
    land = ph * t.rim * see * (1.0 - smoothstep(-px, px, length(pp - vec2(c.x, y0)) - min(0.009, 0.22 * r))) * drops;
    col = mix(col, vec3(0.66, 0.16, 0.09), drop * big * (0.4 + 0.6 * ph) * t.rim * lay * drops);
    l = max(l, big * (1.0 - smoothstep(0.0008, 0.0016 + 0.7 * px, q)));
    l = max(l, uKeys * big * (1.0 - smoothstep(-px, px, q - min(0.011, 0.2 * r))));
    col = mix(col, ink, sat(l) * lay * 0.92);
  } else col = mix(col, ink, 0.5 * lay * (1.0 - sat(-uOwn[0] * 2.0)));
  col = mix(col, ink, dry * (1.0 - smoothstep(-px, px, rule - 0.0016 - 0.0012 * uDrone * ans)));
  col = mix(col, mix(vec3(0.70, 0.15, 0.08), uKind[3], 0.25), land);
  col *= mix(vec3(1.0), vec3(0.8, 0.68, 0.5), 0.75 * (1.0 - abs(uOwn[2])) * (1.0 - abs(uOwn[3])) * smoothstep(0.36, 0.56, abs(p.y) + 0.05 * damp));
  float lit = 1.06 - 0.22 * smoothstep(-0.8, 0.9, dot(p, vec2(0.8, -0.6)));
  return col * lit * (0.9 + 0.16 * uTone);
}
vec3 render(vec2 p) {
  tcPx = 1.0 / uRes.y;
  tcM = exp(tcSlide());
  if (uOwn[3] == 0.0) { tcBare = tcFar1 = 0.0; tcLamp = 1.0; return uVar < 0.5 ? tcBoard(p) : tcPaper(p); }
  vec2 at = tcEye(p);
  vec3 col;
  if (tcBare < 0.) return tcSky(p + vec2(0, .28 + .373 / max(uOwn[3], 1e-4)));
  if (tcBare > 0.0) { tcPx = 1.0 / uRes.y; col = uVar < 0.5 ? tcBoard(p) : tcPaper(p); }
  else {
    col = (uVar < 0.5 ? tcBoard(at) : tcPaper(at)) * tcLamp;
    if (uOwn[3] > 0.0) { float R = 0.43 / max(uOwn[3], 1e-4), e = smoothstep(R - 2.0 / uRes.y, R, length(p)); if (e > 0.0) col = mix(col, tcBeyond(tcGround(uVar < 0.5 ? vec3(0.4, 0.33, 0.27) : vec3(0.86, 0.78, 0.6), p, 1.0), p), e); }
  }
  return tcFar1 > 0.0 ? mix(col, tcSky(vec2(p.x, 0.28)), tcFar1 * tcFar1) : col;
}
