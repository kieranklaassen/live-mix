// name: Planet's ring
// a: Among lumps
// b: Combed lane
// what: Inside a planet's ring: lumps of dirty white ice from house size to dust in one thin sheet that runs to a bright line, the nearest pocked and cut by the left edge, before a great pale striped planet; or just over the sheet, along a black lane with scalloped edges that a small moon has cleared through hundreds of fine grooves.
// follows: Lumps gather and catch light where the piece sounds, or its colours lie on the grooves. Drone is the planet's shine, pad the dust, texture the grains; a phrase bends a wave along sheet or lane. Bands light stripes and grooves. A hit puffs ice where two lumps touch or at the moon, a cue takes the planet's shadow across. Keys glint, a voice lights the planet.
// own: 0 amber light from behind at -1, full light under a pale sky at 1; 1 the planet a small far ball at -1, a wall of light that fills the sky at 1; 2 rust-red rock at -1, blue-green ice at 1; 3 few lumps and bigger, or a thin crack of a lane, at -1, a crowd of lumps, or a wide lane with deep scallops, at 1; 4 from higher over the sheet at -1, the sheet a steep slope across the picture at 1; 5 clear air and black between the grooves at -1, thick lit dust at 1; 6 smooth round pearls, or grooves of separate beads, at -1, cut crystals, or a sheet cracked into plates, at 1; 7 the planet a crescent before a cloud of stars at -1, planet, lumps and grooves in the sounds' colours with round storms at 1
vec3 rrL, rrLs, rrSunC, rrShineC, rrIce, rrDirt, rrHazeC; // towards the sun, towards the planet, their lights, the lumps' two stuffs, the dust
float rrHw;   // half the picture's width
float rrCueX; // where the planet's shadow stands across the picture

#define rrCut max(uOwn[6], 0.0)
#define rrPearl max(-uOwn[6], 0.0)
#define rrDye max(uOwn[7], 0.0)
#define rrDark max(-uOwn[7], 0.0)
// One pock with a rim in each cell of space.
float rrPock(vec3 q) {
  vec3 i = floor(q);
  float h = hash31(i), r = 0.2 + 0.14 * fract(h * 17.1);
  float t = length(fract(q) - 0.5 - 0.3 * (vec3(h, fract(h * 37.7), fract(h * 91.3)) - 0.5)) / r;
  return t > 1.0 ? 0.0 : (1.25 * smoothstep(0.0, 0.8, t) - 1.0) * (1.0 - smoothstep(0.82, 1.0, t));
}
// Noise along a line, for grooves and stripes.
float rrH1(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float rrN1(float x) { float i = floor(x), f = x - i; return mix(rrH1(i), rrH1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
// How far a lump's skin stands out or in at a place on it: its shape, and its pocks.
float rrShape(vec3 q) { return 0.32 * (noise(q * 1.25) - 0.5) * (1.0 - 0.85 * rrPearl) * (1.0 - rrCut) + 0.2 * (noise(q * 3.3 + 3.0) - 0.5) * (1.0 - rrPearl) * (1.0 - 0.9 * rrCut); }
// A crystal's faces: how far a is past the furthest of them.
float rrGem(vec3 a) {
  float d = abs(a.y * 0.78 + a.z * 0.12) - 0.1;
  for (int i = 0; i < 4; i++) { float t = float(i) * 0.785 + 0.2; d = max(d, abs(a.x * cos(t) + a.z * sin(t) + a.y * (i % 2 == 0 ? 0.35 : -0.5)) - 0.015 * float(i)); }
  return (d - 0.55) * 0.8;
}
float rrPits(vec3 q) { if (rrPearl > 0.99 || rrCut > 0.99) return 0.0; return (1.0 - abs(uOwn[6])) * 0.085 * rrPock(q * 1.15 + 2.0) + (1.0 - abs(uOwn[6])) * 0.045 * rrPock(q * 3.1 + 5.3); }
// How much of the sun the passing shadow of the planet takes, and its red edge.
vec2 rrEclipse(float x) {
  float d = x - rrCueX, c = smoothstep(0.0, 0.25, uCue);
  float e = (abs(d) - 0.28) * 11.0;
  return vec2((1.0 - smoothstep(0.12, 0.34, abs(d))), exp(-e * e)) * c;
}
// The striped planet, cut in two by the sheet. Alpha is how much of it is there.
vec4 rrPlanet(vec2 q, vec2 c, float R) {
  vec2 d = (q - c) / R;
  float r = length(d), px = 1.0 / (R * uRes.y);
  float cover = 1.0 - smoothstep(1.0 - 3.0 * px - 0.004, 1.0 + 1.5 * px, r);
  float air = exp(-max(r - 1.0, 0.0) * 34.0);
  vec3 n = vec3(d, sqrt(max(1.0 - r * r, 0.0)));
  float v = d.y * (1.0 + 0.2 * d.x * d.x);
  float wob = 0.012 * sin(d.x * 7.0 + v * 30.0 + uTime * 0.02) + 0.008 * sin(d.x * 13.0 - v * 21.0);
  float b1 = rrN1((v + wob * 0.4) * 5.0 + 43.0), b2 = rrN1((v + wob * 0.7) * 15.0 + 70.0), b3 = rrN1((v + wob) * 44.0 + 190.0);
  vec3 col = mix(vec3(0.6, 0.35, 0.22), vec3(0.95, 0.79, 0.55), smoothstep(0.2, 0.75, 0.55 * b1 + 0.45 * b2));
  col = mix(col, vec3(0.6, 0.64, 0.68), 0.6 * smoothstep(0.45, 0.9, b2 * 0.5 + abs(v) * 0.6));
  if (rrDye > 0.0) {
    // painted in the sounds' colours, with storms
    vec2 sg = vec2(asin(clamp(d.x / max(sqrt(1.0 - min(d.y * d.y, 0.98)), 0.1), -1.0, 1.0)) * 1.3 + uTime * 0.002 + 0.37 * floor(v * 5.0 + 0.5), v * 5.0 + 0.5);
    vec3 sh = hash31(vec3(floor(sg), 3.0)) * vec3(1.0, 3.7, 7.3);
    float el = length((fract(sg) - 0.5 - 0.16 * (fract(sh.yz) - 0.5)) * vec2(1.0, 1.35)) / (0.2 + 0.25 * fract(sh.y)), on = step(0.5, sh.x) * (1.0 - smoothstep(0.7, 1.0, el));
    vec3 kc = kindColour(4.0 * fract(b1 * 0.9 + 0.35 * b2 + 0.4 * on));
    col = mix(col, kc * kc * 0.95 + 0.04, rrDye * 0.88) * (1.0 + rrDye * on * 0.35 * sin(el * 8.0 - d.x * 12.0));
  }
  col *= 0.82 + 0.26 * b3;
  col = mix(col, col * (0.5 + 1.4 * uKind[0]), 0.35 * uDrone);
  col *= 1.0 + 1.1 * uEnergy * band(sat(v * 0.95 + 0.02)) * (0.4 + b2);       // each stripe has its part of the spectrum
  // the thin shadows the ring throws on it
  float sv = v - 0.1 - 0.12 * n.z;
  float bars = smoothstep(0.0, 0.015, sv) * (1.0 - smoothstep(0.12, 0.15, sv)) * (0.35 + 0.65 * smoothstep(0.3, 0.7, rrN1(sv * 70.0 + 90.0)));
  col *= 1.0 - 0.6 * bars;
  float lam = smoothstep(-0.6, 0.95, dot(n, normalize(vec3(rrL.xy, rrL.z * 0.6) + vec3(-0.1, 0.25, -0.75))) + 0.7 * max(uOwn[1], 0.0));
  lam = mix(lam, smoothstep(0.02, 0.5, dot(n, normalize(vec3(rrL.xy, -1.05)))) * 1.1, rrDark);
  col = (col * 0.56 + 0.02) * rrSunC * (0.02 + lam);
  // and the thin air at its edge
  vec3 glow = rrSunC * vec3(0.8, 0.72, 0.62) * 0.16 * air * sat(dot(d, rrL.xy) + 0.3);
  return vec4(mix(glow, col, cover), cover);
}
// The sky: black and full of stars, or a pale lit veil.
vec3 rrSky(vec2 q) {
  float pale = max(uOwn[0], 0.0);
  vec2 g = q * 34.0, i = floor(g), h = hash22(i);
  float m = h.x * h.x; m *= m * m;
  vec3 cloud = vec3(0.0);
  if (rrDark > 0.0) {
    vec2 c = rot(0.5) * q + vec2(0.05, -0.12);
    float n1 = noise(c * vec2(3.0, 5.0) + 4.0), n2 = noise(c * vec2(8.0, 13.0) + 9.0), n3 = noise(c * 30.0), y = c.y * 4.2 + (n1 - 0.5) * 1.1;
    float b = exp(-y * y) * (0.35 + 0.8 * n1), lane = smoothstep(0.35, 0.75, n2 * 0.6 + n1 * 0.5) * exp(-y * y * 4.0), st = step(0.86, hash21(floor(q * 90.0))) * (1.0 - smoothstep(0.08, 0.3, length(fract(q * 90.0) - 0.3 - 0.4 * hash22(floor(q * 90.0) + 21.0))));
    cloud = (mix(uKind[0] * uKind[0], uKind[1] * uKind[1], sat(n2 * 1.3)) * 0.42 + 0.03) * b * (0.6 + 0.8 * n2 * n3) * (1.0 - 0.75 * lane) * (0.75 + 0.6 * uDrone) + vec3(0.9, 0.93, 1.0) * st * hash21(floor(q * 90.0) + 3.0) * (0.12 + 0.6 * b);
    cloud *= rrDark * (1.0 - pale);
  }
  return cloud + mix(vec3(0.005, 0.007, 0.012), vec3(0.55, 0.7, 0.85) * (0.9 - 0.5 * q.y), pale * pale) + vec3(0.8, 0.88, 1.0) * sat(1.0 - uOwn[5]) * (1.0 - pale) * m * 0.8 * (1.0 - smoothstep(0.0, 0.09, length(fract(g) - 0.1 - 0.8 * hash22(i + 9.0))));
}
// A lump in front of everything at a place: its cover, its normal, a place on its own skin and the same a step nearer the sun.
float rrCover, rrSun, rrLoud, rrRough, rrFine, rrMark, rrFog; vec3 rrN, rrS, rrSl, rrTint;
mat2 rrTurnA, rrTurnB; float rrSeed;
vec3 rrOwnPlace(vec3 q) { q.xz = rrTurnA * q.xz; q.xy = rrTurnB * q.xy; return q + rrSeed; }
// One lump, close: its relief is marched. uv is the place in the lump's own size.
void rrBoulder(vec2 uv, float px, float seed, float turn) {
  float r2 = dot(uv, uv), near = 1.0, d;
  rrTurnA = rot(turn); rrTurnB = rot(seed * 5.0); rrSeed = seed;
  vec3 q = vec3(uv, -sqrt(max(1.16 - r2, 0.0))), w = q, best = q, g = vec3(0.0);
  for (int i = 0; i < 13; i++) {
    if (r2 > 1.15) break;
    w = rrOwnPlace(q);
    d = mix(length(q) - 0.8, rrGem(w - rrSeed), rrCut) - rrShape(w) - rrPits(w);
    if (d < near) { near = d; best = q; }
    if (d < 0.006 || q.z > 0.3) break;
    q.z += d * 0.8;
  }
  rrCover = 1.0 - smoothstep(0.006, 2.5 * px + 0.006, near);
  q = best; w = rrOwnPlace(q);
  vec2 e = vec2(0.02, -0.02);
  float sh = 1.0;
  for (int k = 0; k < 4; k++) {
    if (rrCover <= 0.0) break;
    vec3 o = k == 0 ? e.xyy : k == 1 ? e.yyx : k == 2 ? e.yxy : e.xxx, a = rrOwnPlace(q + o);
    g += o * (mix(length(q + o), rrGem(a - rrSeed), rrCut) - rrShape(a) - rrPits(a));
    // what stands between here and the sun
    o = q + rrL * 0.085 * float(k + 1); a = rrOwnPlace(o);
    sh = min(sh, 1.15 + 3.0 * (mix(length(o) - 0.8, rrGem(a - rrSeed), rrCut) - rrShape(a) - rrPits(a)) / float(k + 1));
  }
  rrN = normalize(g + vec3(0.0, 0.0, -1e-5));
  rrS = w * 6.0; rrSl = rrOwnPlace(q + rrL * 0.04) * 6.0;
  rrSun = sat(sh); rrRough = 1.1; rrFine = (1.0 - smoothstep(0.006, 0.02, px)); rrMark = 1.0 + 2.5 * min(rrPits(w), 0.0); rrFog = 0.0; rrLoud = 0.0; rrTint = vec3(0.5);
}
// A lump in a shell: where it stands in the sheet and how big, from its cell. Every lump stays inside its cell.
vec2 rrCell; float rrK, rrDens, rrThick, rrHere, rrBig; mat2 rrTilt;
vec4 rrLumpAt(vec2 id) {
  vec2 h = hash22(id + rrK * 31.7), g = hash22(id + rrK * 17.3 + 71.0), mid = (id + 0.5) * rrCell;
  float Y = dot(mid, rrTilt[1]) / rrThick;
  float on = smoothstep(0.0, 0.2, rrDens * exp(-Y * Y) * (1.0 + 1.1 * rrHere) - g.x);
  float rad = rrCell.y * min(0.1 + 0.34 * g.y * g.y * rrBig, 0.45) * on;
  mid += (h - 0.5) * (rrCell - 2.2 * rad) * (0.94 + 0.06 * sin(uTime * 0.13 + h.x * 40.0));
  return vec4(mid, rad, h.x);
}
// How dark a lump's shadow lies at a place up-sun of which it stands.
float rrStreak(vec4 l, vec2 w) {
  float t = l.x - w.x;
  return (1.0 - smoothstep(l.z * 0.2, l.z * 1.2 + 1e-4, abs(w.y - l.y))) * smoothstep(0.0, l.z + 1e-4, t) * (1.0 - smoothstep(0.0, 1.0, t)) * smoothstep(0.02, 0.12, l.z);
}
float rrThrough; vec3 rrSum; // what is still seen past the shells, and the lit dust in them
float rrBehind;              // what was still seen where the front lump stands
void rrShells(vec2 q, vec2 ecl, float camY) {
  float px = 1.0 / uRes.y, o3 = uOwn[3], z = 1.3;
  float haze = (0.05 + 0.09 * uPad) * exp(1.9 * uOwn[5]) * (0.7 + 0.6 * uSpace);
  float d0 = 0.75 * exp(1.3 * o3), d1 = (0.8 + 0.7 * uTexture) * exp(1.1 * o3);
  mat2 back = transpose(rrTilt);
  rrBig = 1.0 + 0.6 * max(-o3, 0.0);
  vec4 hit = vec4(0.0); vec2 hitW = vec2(0.0), hitNb = vec2(0.0);
  float left = 1.0 - rrCover, own = rrCover, hitPx = 1.0; // own: how much of the front is a close lump's
  bool far = false;
  rrBehind = 1.0; rrThrough = 1.0;
  for (int k = 0; k < 9; k++) {
    vec2 W = q * z + vec2(uTravel * 0.014, camY);
    if (uVar > 0.5 || left < 0.03 || abs(W.y) > 0.95) break;
    float ppx = z * px, Y2 = exp(-W.y * W.y * 8.0);
    vec4 pc = piece(vec2(q.x / (2.0 * rrHw) + 0.5, sat(1.0 - float(k) / 9.0)));
    rrHere = pc.a;
    vec3 tint = pc.rgb / max(pc.a, 0.02);
    vec2 w = W * back;
    // dust and small lumps, then big ones with the shadow the next one throws
    rrK = float(k) + 20.0; rrCell = vec2(0.27, 0.17); rrThick = 0.5; rrDens = k > 1 ? d1 : 0.0;
    vec4 s = rrLumpAt(floor(w / rrCell));
    rrK = float(k); rrCell = vec2(0.95, 0.54); rrThick = 0.42; rrDens = d0;
    vec2 id = floor(w / rrCell);
    vec4 l = rrLumpAt(id), nb = rrLumpAt(id + vec2(1.0, 0.0));
    vec2 vs = w - s.xy, vl = w - l.xy;
    bool small = dot(vs, vs) < s.z * s.z && (abs(uOwn[6]) + abs(uOwn[7]) + abs(uOwn[3]) <= 0.0 || dot(vl, vl) > l.z * l.z);
    vec4 m = small ? s : l;
    vec2 u = (small ? vs : vl) / max(m.z, 1e-4);
    float rp = m.z / ppx, edge = 0.98 - 0.36 * smoothstep(3.0, 6.0, rp) * noise(u * 2.1 + m.w * 50.0);
    if (rrPearl > 0.0) edge = mix(edge, 0.98, rrPearl);
    if (rrCut > 0.0) { float an = atan(u.y, u.x + 1e-5) + m.w * 40.0 + uTime * 0.02 * (m.w - 0.5), k = TAU / (4.0 + floor(m.w * 2.99)); edge = mix(edge, 0.97 * cos(0.5 * k) / cos(mod(an, k) - 0.5 * k) * (1.0 - 0.3 * abs(sin(an * 0.5 + m.w * 9.0))), rrCut * smoothstep(2.0, 5.0, rp)); }
    float cover = (1.0 - smoothstep(edge - min(2.0 / max(rp, 1e-3), 0.9), edge, length(u))) * step(1e-4, m.z);
    float hz = 1.0 - exp(-haze * Y2 * (0.1 + z * 0.22)), lit = rrThrough * left;
    rrSum += lit * hz * rrHazeC * (1.0 - 0.8 * max(rrStreak(l, w), rrStreak(nb, w))) * (1.0 - 0.8 * ecl.x) * (0.7 + 0.5 * pc.a) * mix(vec3(1.0), tint * 1.6, 0.5 * pc.a);
    if (cover > own && own < 0.5) {
      own = cover; far = true; hit = m; hit.xyz = vec3(u / edge, rp); hitNb = vec2(w.y - nb.y, nb.x - w.x); hitPx = nb.z;
      rrBehind = rrThrough; rrLoud = pc.a; rrTint = tint; rrFog = 1.0 - exp(-z * 0.02 * exp(1.2 * uOwn[5]));
      if (small) hitPx = 0.0;
    }
    left *= 1.0 - cover; rrThrough *= 1.0 - hz * 0.8;
    z *= 1.42;
  }
  rrCover = 1.0 - left;
  if (far) {
    rrN = vec3(hit.xy, -sqrt(max(1.0 - dot(hit.xy, hit.xy), 0.0)));
    rrN.xy = rrN.xy * rrTilt;
    mat2 t = rot(uTime * (0.01 + 0.03 * hit.w));
    rrS = rrN * 2.1; rrSl = rrS + rrL * 0.24;
    rrS.xz = t * rrS.xz; rrSl.xz = t * rrSl.xz;
    if (rrCut > 0.0) { vec2 c = hit.xy; float an = atan(c.y, c.x + 1e-5) + hit.w * 40.0 + uTime * 0.02 * (hit.w - 0.5), k = TAU / (4.0 + floor(hit.w * 2.99)), a2 = (floor(an / k) + 0.5) * k - an + atan(c.y, c.x + 1e-5); rrN = normalize(mix(rrN, length(c) < 0.45 + 0.2 * hit.w ? vec3(0.25, 0.3, -1.0) : vec3(cos(a2), sin(a2), -0.5), rrCut)); }
    rrS += hit.w * 40.0; rrSl += hit.w * 40.0;
    rrRough = 0.7 * smoothstep(5.0, 12.0, hit.z); rrFine = 0.7 * smoothstep(18.0, 50.0, hit.z); rrMark = 0.85 + 0.3 * fract(hit.w * 71.0);
    rrSun = 1.0 - 0.9 * (1.0 - smoothstep(hitPx * 0.5, hitPx * 1.2 + 1e-4, abs(hitNb.x))) * step(0.0, hitNb.y) * smoothstep(0.0, 1e-3, hitPx) * (1.0 - smoothstep(0.6, 1.6, hitNb.y));
  }
}
// The front lump's colour: ice and snow in three lights, sun, planet, and the sheet's own.
vec3 rrShade(vec2 ecl) {
  float tone = noise(rrS * 0.45), bump = noise(rrS * 1.7) - noise(rrSl * 1.7) + 0.55 * (noise(rrS * 4.1 + 9.0) - noise(rrSl * 4.1 + 9.0)) * rrFine * step(rrRough, 0.9) + 0.5 * (rrPock(rrS * 0.8) - rrPock(rrSl * 0.8));
  bump *= (1.0 - 0.95 * rrPearl) * (1.0 - 0.8 * rrCut);
  vec3 n = normalize(rrN + rrL * bump * rrRough + vec3(0.0, 0.0, -1e-4));
  vec3 alb = mix(rrIce, rrDirt, 0.75 * smoothstep(0.3, 0.75, tone)) * rrMark * (1.0 + 0.7 * rrFine * (noise(rrS * 6.3) - 0.5));
  if (rrPearl > 0.0) { vec3 kc = kindColour(fract(rrMark * 9.7) * 4.0); alb = mix(alb, mix(rrIce * 0.5, kc * kc, 0.75), rrPearl); }
  if (rrDye > 0.0) { vec3 kc = kindColour(fract(rrMark * 23.7 + 0.2) * 4.99); alb = mix(alb, (kc * kc + 0.03) * (0.6 + 0.5 * tone), rrDye * 0.85); }
  float s = sat(dot(n, rrL) * 1.08 + 0.04), g = sat(dot(n, rrLs) * 0.6 + 0.4);
  s *= 0.55 + 0.45 * s;
  vec3 c = alb * (rrSunC * s * rrSun * (1.0 - 0.9 * ecl.x) + vec3(1.0, 0.3, 0.1) * ecl.y * (0.15 + s) * 0.9 + rrShineC * g * g + rrHazeC * 0.1 * sat(0.5 - 0.5 * n.y));
  if (rrPearl > 0.0) { float h = sat(dot(n, normalize(rrL + vec3(0.0, 0.0, -1.0)))), f = 1.0 - sat(-n.z); h *= h; h *= h; h *= h; c += rrPearl * (rrSunC * (0.5 * h * h * h + 0.08 * h) * (1.0 - 0.8 * ecl.x) + alb * f * f * (rrShineC + rrHazeC) * 0.8); }
  if (rrCut > 0.0) { float h = sat(dot(n, normalize(rrL + vec3(0.0, 0.15, -1.0)))); h *= h; h *= h; c = mix(c, c * 0.75 + rrIce * rrIce * (rrShineC * 0.35 + 0.1 * rrSunC * sat(0.4 + n.y)) + rrSunC * (0.35 * h * h * h + 0.05 * hash31(floor(n * 5.0 + 7.0))), rrCut); }
  c *= 1.0 + 1.2 * uEnergy * rrLoud;
  c += c * (rrTint - 0.3) * rrLoud * 1.1;
  c += rrSunC * 1.2 * uKeys * step(0.5, fract(rrMark * 33.0)) * smoothstep(0.6, 1.0, dot(n, normalize(rrL + vec3(0.0, 0.0, -1.0))));
  return mix(c, rrHazeC * 0.55, rrFog);
}
// What the far edge of the sheet adds: a bright line the playhead runs along.
vec3 rrLine(vec2 q, float px, float camY) {
  float y = q.y / (0.002 + px), ln = exp(-y * y) + 0.14 * exp(-abs(q.y) * 55.0);
  ln += 0.3 * smoothstep(-px, px, -q.y) * smoothstep(-camY / 18.0, -camY / 30.0, q.y);
  float head = q.x - (uLoop - 0.5) * 2.2 * rrHw, hf = sin(PI * uLoop);
  return ln * rrSunC * (0.4 + 0.3 * uMid + 0.9 * hf * hf * exp(-head * head * 90.0));
}
// Fine grooves across the sheet, the ones too fine to see at this distance smoothed away.
float rrComb(float r, float fp) {
  float s = 0.0, f = 1.3, a = 0.42;
  for (int i = 0; i < 8; i++) {
    float x = fp * f;
    if (x > 1.0 || uVar < 0.5) break;
    s += a * (rrN1(r * f + float(i) * 113.7 + 500.0) - 0.5) * (1.0 - smoothstep(0.35, 1.0, x));
    f *= 2.15; a *= 0.93;
  }
  return s;
}
// The middle of the lane, z away. A phrase bends a wave along it.
float rrMid(float z) { return 0.28 + 0.13 * z - 0.032 * z * z + 0.04 * uPhrase * sin(z * 1.7 - uTime * 0.25); }
// The sheet from just over it, with the lane. dy is how far under the horizon, sm how far along the moon is, mx where in the lane.
vec3 rrLane(vec2 q, float dy, float H, float hor, float sm, float mx, float w0, vec2 ecl) {
  float px = 1.0 / uRes.y, o5 = uOwn[5];
  dy = max(dy, 0.0015);
  float z = H / dy; vec2 w = vec2(q.x * z, z);
  float r = w.x - rrMid(z), ds = z - sm;
  float fp = px * length(vec2(z, (q.x - 0.13 + 0.064 * z) * z * z / H)), fz = px * z * z / H;
  // the two edges: scallops ahead of the moon on the near-planet side, behind it on the other
  float calmF = 1.0 - smoothstep(0.1, 0.5, fz);
  float aL = w0 * 0.75 * exp(-max(ds, 0.0) * 0.33) * smoothstep(-0.25, 0.5, ds) + 0.012;
  float aR = w0 * 0.75 * exp(-max(-ds, 0.0) * 0.45) * (1.0 - smoothstep(-0.5, 0.25, ds)) + 0.012;
  float dl = -w0 - r, dr = r - w0;                         // how far into the sheet on each side
  float slow = 0.15 * sin(uTime * 0.05);
  float fl = exp(-max(dl, 0.0) / (w0 * 1.5)), fr = exp(-max(dr, 0.0) / (w0 * 1.5));
  float phL = ds * 7.5 - max(dl, 0.0) * 9.0 + slow, phR = ds * 9.0 + max(dr, 0.0) * 9.0 - slow;
  float wl = (0.5 - abs(cos(phL * 0.5))) * calmF, wr = (0.5 - abs(cos(phR * 0.5))) * calmF;
  dl -= aL * wl * fl; dr -= aR * wr * fr;
  float e = max(fp * 0.8, 0.002) + 0.004;
  float inL = smoothstep(-e, e, dl), inR = smoothstep(-e, e, dr), sheet = min(inL + inR, 1.0);
  float rr = r < 0.0 ? -dl : dr; // the grooves run with the edge
  float g = rrComb(rr + (r < 0.0 ? 0.0 : 40.0), fp) * (1.0 - smoothstep(25.0, 90.0, z));
  // density waves: combs whose teeth draw together
  float cx = abs(rr) - 0.35, cw = exp(-cx * 1.1) * step(0.0, cx);
  g += 0.22 * sin(26.0 * cx + 15.0 * cx * cx) * cw * smoothstep(0.0, 0.1, cx) * (1.0 - smoothstep(0.15, 0.45, fp * (26.0 + 30.0 * cx) * 0.16)) * (1.0 - smoothstep(8.0, 30.0, z));
  float wide = smoothstep(0.15, 0.6, fp), broad = mix(rrN1(rr * 0.8 + 104.0), mix(1.3 * rrN1(rr * 0.13 + 61.0) - 0.15, 0.5, smoothstep(1.2, 5.0, fp)), wide);
  vec3 ring = mix(rrDirt, rrIce, sat(0.45 + 0.5 * broad));
  float hue = mix(rrN1(rr * 1.7 + 209.0), 0.45, wide);
  ring *= mix(vec3(0.82, 0.93, 1.06), mix(vec3(1.0), vec3(1.12, 0.84, 0.6), smoothstep(0.5, 0.85, hue)), smoothstep(0.2, 0.5, hue));
  if (rrDye > 0.0) { vec3 kc = kindColour(4.99 * sat(1.7 * mix(rrN1(rr * 1.35 + 300.0), rrN1(rr * 0.2 + 90.0), wide) - 0.35)); ring = mix(ring, kc * kc * 1.05 + 0.04, rrDye * 0.85); }
  float lum = sat(0.48 + 1.3 * g);
  lum = max(lum - 0.28 * max(-o5, 0.0), 0.0);
  lum = 0.02 + lum * lum * (3.0 - 2.0 * lum) * (0.3 + 1.0 * broad);
  // rubble near by, lit low from the right
  float nearF = 1.0 - smoothstep(0.35, 1.1, fz * 110.0), glintF = 1.0 - smoothstep(0.25, 0.6, fz * 22.0);
  float bump = 0.0;
  if (nearF > 0.0) {
    vec2 gq = vec2(w.x * 85.0, (z + uTravel * 0.004) * 62.0);
    bump = 0.9 * (noise(gq * 0.37) - noise(gq * 0.37 + vec2(0.4, 0.1)));
    bump += noise(gq) - noise(gq + vec2(0.45, 0.1));
    gq *= 2.3; bump += 0.7 * (noise(gq) - noise(gq + vec2(0.45, 0.1)));
    bump *= nearF * (0.5 + 1.3 * uTexture);
  }
  lum *= exp(clamp(bump, -1.6, 0.7));
  if (rrPearl > 0.0) {
    // every groove a row of beads
    for (int k = 0; k < 3; k++) {
      float sz = k == 0 ? 0.034 : k == 1 ? 0.085 : 0.22, see = (1.0 - smoothstep(0.25, 0.6, max(fp, fz) / sz)) * smoothstep(0.025, 0.07, max(fp, fz) / sz + (k == 0 ? 0.08 : 0.0)), row = floor(rr / sz);
      vec2 c = vec2(fract(rr / sz), fract((z + uTravel * 0.004) / sz + 7.3 * rrH1(row + 50.0))) - 0.5;
      if (r < 0.0) c.x = -c.x;
      float l = length(c), bl = (1.0 - smoothstep(0.34, 0.42, l)) * (0.25 + 1.5 * sat(0.45 + 2.0 * c.x - 0.7 * c.y)) * (0.35 + 1.1 * rrH1(row + 9.0)) + 1.6 * (1.0 - smoothstep(0.02, 0.1, length(c - vec2(0.15, -0.08))));
      lum = mix(lum, (0.2 + lum) * bl * 0.85, rrPearl * see);
    }
  }
  if (rrCut > 0.0) {
    // cracked into plates
    vec2 cw2 = vec2(rr * 5.0, z * 3.2 + 0.7 * sin(rr * 2.0) + uTravel * 0.012), ci = floor(cw2), cf = cw2 - ci; float m1 = 9.0, m2 = 9.0, hp = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)), hh = hash22(ci + o + 80.0); float dd = length(o + 0.1 + 0.8 * hh - cf); if (dd < m1) { m2 = m1; m1 = dd; hp = hh.x; } else m2 = min(m2, dd); }
    float gap = 0.06 + 0.1 * hp, aa = max(fp * 5.0, fz * 3.2), pl = smoothstep(gap, gap + 0.06 + aa, m2 - m1), see = 1.0 - smoothstep(0.4, 1.2, aa);
    lum = mix(lum, mix(0.01, (0.28 + 0.45 * lum) * (0.55 + 0.75 * hp) + 0.5 * (1.0 - smoothstep(0.0, 0.1, abs(m2 - m1 - gap - 0.09))) * 0.5, pl), rrCut * see);
  }
  // the spectrum, sixteen broad grooves either side
  float bd = band(sat(abs(rr) * 0.55));
  lum *= 1.0 + 1.1 * uEnergy * bd * smoothstep(0.3, 0.8, 0.5 + g);
  vec4 pc = piece(vec2(q.x / (2.0 * rrHw) + 0.5, sat(dy / (hor + 0.5))));
  vec3 tint = pc.rgb / max(pc.a, 0.02);
  // long shadows of the standing waves, thrown to the left over the sheet
  float s0 = ds - 0.16 * max(dl, 0.0);
  float tall = aL * 3.4 * pow(sat(1.0 - abs(cos((s0 * 7.5 + slow) * 0.5)) * 1.25), 1.5) * calmF;
  float shL = (1.0 - smoothstep(tall - e - 0.03, tall + e, dl)) * step(0.001, tall) * smoothstep(-e, e * 2.0, dl);
  vec2 ms = vec2(w.x - mx, ds);
  float moonSh = (1.0 - smoothstep(0.03, 0.11, abs(ms.y + 0.16 * ms.x))) * step(ms.x, 0.0) * exp(min(ms.x, 0.0) * 0.6);
  float sun = (1.0 - 0.9 * max(shL, moonSh)) * (1.0 - 0.93 * ecl.x);
  vec3 c = ring * lum * (rrSunC * 0.46 * sun + rrShineC * 0.2 + vec3(0.7, 0.18, 0.05) * ecl.y);
  c += c * (tint - 0.35) * pc.a + tint * pc.a * lum * 0.06;
  c += ring * rrSunC * 0.5 * exp(-dl * dl / (e * e * 6.0)) * inL * (0.3 + 3.0 * aL / w0 * sat(wl + 0.5)); // the edge that faces the sun
  c += rrSunC * uKeys * 2.2 * smoothstep(0.8, 0.95, hash21(floor(vec2(w.x * 30.0, z * 22.0)))) * (1.0 - smoothstep(0.0, 0.35, length(fract(vec2(w.x * 30.0, z * 22.0)) - 0.5))) * glintF;
  // thin dust in the lane: streamers bent to the moon
  float dust = 0.0;
  for (int k = 0; k < 4; k++) {
    float fk = float(k), side = k < 2 ? -1.0 : 1.0, x = -side * ds;
    if (uVar < 0.5) break;
    if (x < -0.05) continue;
    float lag = 0.28 + 0.24 * mod(fk, 2.0);
    float pathR = 0.02 + side * w0 * 1.15 * (1.0 - exp(-x / lag)) + 0.02 * sin(x * 9.0 - uTime * 0.2 + fk);
    float d = (r - pathR) / (0.008 + 0.02 * x + fp);
    dust += exp(-d * d) * smoothstep(-0.05, 0.05, x) * exp(-x * 1.1) * (0.6 + 0.5 * noise(vec2(x * 14.0 - uTime * 0.1, fk)));
  }
  vec3 lane = rrHazeC * (0.003 + 0.008 * uPad) + (rrSunC * 0.35 + uKind[1] * 0.25 * uPad) * dust * (1.0 - 0.8 * ecl.x);
  // a hit: a puff that runs along the lane from the moon
  float hx = abs(ds) - 1.8 * (1.0 - uHits);
  lane += (uKind[4] + 0.5) * rrSunC * 0.7 * uHits * smoothstep(0.75, 1.1, z) * exp(-hx * hx * 26.0) * exp(-r * r / (w0 * w0 * 1.2));
  vec3 col = mix(lane, c, sheet);
  // dust over all of it, thicker with distance
  float fog = 1.0 - exp(-(0.008 + 0.01 * uPad + 0.01 * uSpace) * exp(1.9 * o5) * (z - 0.5));
  col = mix(col, rrHazeC * 0.75 * (1.0 - 0.8 * ecl.x), fog);
  return col + rrSunC * 0.4 * exp(-dy / (0.002 + px));
}
vec3 render(vec2 p) {
  float o0 = uOwn[0], o2 = uOwn[2];
  rrHw = 0.5 * uRes.x / uRes.y;
  rrL = normalize(vec3(0.86, 0.2 + 0.03 * sin(TAU * uLoop), -0.08 - 0.8 * o0));
  rrLs = normalize(vec3(-0.62, 0.42, 0.45));
  rrSunC = 2.9 * mix(vec3(1.0, 0.95, 0.87), o0 < 0.0 ? vec3(1.0, 0.55, 0.22) : vec3(0.92, 0.98, 1.05), abs(o0)) * (0.9 + 0.2 * uTone);
  rrShineC = mix(vec3(0.42, 0.28, 0.16), vec3(0.3, 0.16, 0.1), max(-o0, 0.0)) * (0.55 + 0.7 * uDrone + 0.3 * uMic) * 0.8 * mix(vec3(1.0), 0.5 + uKind[0], 0.4 * uDrone);
  rrIce = mix(vec3(0.82, 0.85, 0.88), o2 < 0.0 ? vec3(0.52, 0.25, 0.14) : vec3(0.45, 0.83, 0.86), abs(o2));
  rrDirt = mix(vec3(0.42, 0.37, 0.33), o2 < 0.0 ? vec3(0.12, 0.08, 0.075) : vec3(0.12, 0.34, 0.46), abs(o2));
  rrHazeC = mix(rrIce, rrDirt, 0.4) * (rrSunC * vec3(0.27, 0.25, 0.23) + rrShineC * 0.4) * mix(vec3(1.0), 0.45 + 1.1 * uKind[1], 0.6 * uPad);
  rrCueX = -0.75 + 1.9 * (1.0 - uCue);
  bool b = uVar > 0.5;
  float o1 = uOwn[1], o4 = uOwn[4], o5 = uOwn[5], up = max(o4, 0.0), high = max(-o4, 0.0), px = 1.0 / uRes.y, hw = min(rrHw, 0.95);
  vec2 q = rot(b ? -0.05 - 0.3 * up : 0.09 + 0.42 * up) * p;
  float hor = b ? 0.25 + 0.3 * high - 0.08 * up : 0.02 + 0.22 * high - 0.012 * uPhrase * sin(q.x * 5.0 - uTime * 0.35);
  q.y -= hor;
  if (b) q.x += 0.12 * (1.0 - smoothstep(0.3, 0.6, rrHw)); // the moon stays inside a tall picture
  vec2 ecl = rrEclipse(b ? q.x + 1.1 * q.y * q.y : q.x);
  // in b: the eye's height, the moon's place in the lane, the lane's half width
  float H = 0.52 * exp(0.5 * high - 0.4 * up), sm = 1.6, w0 = 0.16 * exp(0.9 * uOwn[3]), mx = rrMid(sm) + 0.02;
  vec2 mq = vec2(mx / sm, 0.012 - H / sm);
  // in a: the near lump, cut by the left edge, and two that a hit knocks together
  float hr = (0.4 - 0.12 * high) * min(1.0, 0.45 + 0.6 * rrHw), part = 0.02 * 4.0 * uHits * (1.0 - uHits);
  vec2 ka = vec2(hw * 0.5, -0.2), kb = ka + vec2(-0.14 - part, 0.03), kd = q - (b ? mq : 0.5 * (ka + kb) - vec2(0.012, 0.0));
  ka.x += part;
  vec2 d0 = (q - vec2(-min(rrHw, 1.0) + 0.04, -0.24)) / hr, d1 = (q - ka) / 0.085, d2 = (q - kb) / 0.062;
  bool is0 = dot(d0, d0) < 1.15, is1 = !is0 && dot(d1, d1) < dot(d2, d2);
  float size = b ? 0.042 : is0 ? hr : is1 ? 0.085 : 0.062;
  rrBoulder(b ? (q - mq) / size : is0 ? d0 : is1 ? d1 : d2, px / size, b ? 7.7 : is0 ? 4.3 : is1 ? 9.1 : 5.3, uTime * (is0 ? 0.012 : is1 ? 0.021 : -0.027));
  if (!b && !is0 && !is1) rrSun *= 1.0 - 0.85 * (1.0 - smoothstep(0.03, 0.075, abs(q.y - ka.y + 0.2 * (q.x - ka.x))));
  float close = rrCover;
  rrTilt = rot(-0.2285); rrSum = vec3(0.0);
  float camY = 0.28 + 0.62 * high;
  rrShells(q, ecl, camY);
  vec3 lump = rrCover > 0.0 ? rrShade(ecl) : vec3(0.0);
  // behind everything: sky and planet
  float R = (b ? 0.62 : 0.74) * exp(o1 * (o1 > 0.0 ? 1.55 : 1.4));
  vec4 pl = rrPlanet(q, vec2(-hw * (b ? 0.9 : 0.62) - 0.25 * max(o1, 0.0), b ? 0.0 : -0.04 + 0.04 * o1), R);
  vec3 back = rrSky(p) * (1.0 - pl.a) + pl.rgb * (1.0 + 0.5 * uDrone + 0.3 * uMic);
  if (b) {
    back += rrSunC * 0.16 * exp(-max(q.y, 0.0) * 70.0) + rrHazeC * 0.3 * exp(-max(q.y, 0.0) * 16.0) * max(o5, 0.0);
    back = mix(back, rrLane(q, -q.y, H, hor, sm, mx, w0, ecl), 1.0 - smoothstep(0.0, px, q.y));
    lump *= 1.2 + 0.8 * uMic;
  } else {
    back *= 1.0 - (1.0 - smoothstep(-0.004, 0.004, q.y)) * (0.6 + 0.38 * sat(-q.y * 4.0)) * (1.0 - 0.75 * max(uOwn[0], 0.0));
    back = back * rrThrough + rrLine(q, px, camY) * (0.15 + 0.85 * rrThrough) * (1.0 - 0.85 * ecl.x);
  }
  vec3 col = rrSum + mix(back, lump * rrBehind, rrCover);
  // a hit: a puff of broken ice where the two touch, or round the moon
  float puff = (b ? 0.06 : 0.085) + 0.12 * (1.0 - uHits), kr = length(kd);
  col += (1.0 - 0.6 * close) * (uKind[4] * 0.7 + 0.4) * rrSunC * 0.4 * uHits * (0.5 + 0.7 * noise(kd * 28.0)) * (exp(-kr * kr / (puff * puff)) + 0.6 * exp(-(kr - puff) * (kr - puff) * 2500.0));
  return screenOf(col);
}
