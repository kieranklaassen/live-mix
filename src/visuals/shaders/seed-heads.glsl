// name: Seed heads
// a: Clock
// b: In the wind
// what: One dandelion clock very near with the low sun behind it, every parasol a star of fine hairs, the far side seen through the near and three more heads lost in the soft green meadow; or a head half bare at dusk, its seeds carried off over a dark field past a blurred sun, some sharp, some out of focus.
// follows: The bands brighten the parasols from base to crown; the piece lies over the head in its colours. Each kind has a head, or sky, horizon, sun and seeds of its own. A hit lets five seeds go and sends a ring of light over the head; a cue is a breath across the head, or wind over the grass. Low sounds sway the stem; keys make single parasols shine.
const float SH_N = 170.0;
float shSq(float x) { return x * x; }
float shAsp;
vec3 shCool, shWarm, shSun; // the shaded and the lit colour of a hair, and where the sun is from a head
vec3 shGlow, shTint; float shMore, shSwept; // what lights a head here

// One parasol: hairs that leave one point on a wide cone, seen from any side. q is measured from that point with y along the
// axis as it is seen, k how far the mouth of the cone faces us, c how far its axis leans in the picture, L the length of a
// hair, b half the softness of an edge. x is how much of it is here, y how far out along a hair.
vec2 shWall(vec2 q, float rho, float k, float c, float L, float b, float n, float seed) {
  vec2 u = vec2(q.x, (q.y - c * rho) / k);
  u *= inversesqrt(dot(u, u) + 1e-9); // the way out from the middle, seen flat on
  float gapA = TAU / n, a = atan(u.y, u.x + 1e-6), j = floor(a / gapA + 0.5);
  float odd = fract(j * 0.618 + seed * 41.0), turn = (j + 0.5 * (odd - 0.5)) * gapA - a;
  u += vec2(-u.y, u.x) * turn - 0.5 * turn * turn * u;
  vec2 d = vec2(u.x, k * u.y + c);
  float dl = length(d) + 1e-4;
  float off = abs(q.x * d.y - q.y * d.x) / dl, len = dot(q, d) / (dl * dl);
  float own = L * (0.8 + 0.2 * fract(odd * 7.0));
  float w = 0.009 * L, gap = gapA * max(rho, 0.02 * L) * mix(k, 1.0, 0.5);
  float line = sat((w + b - off) / (2.0 * b)) * min(1.0, w / b + 0.12) + 0.035 * sat(1.0 - off / (0.09 * L));
  float even = min(0.9, 2.0 * w / gap);
  float cov = mix(line, even, smoothstep(0.35, 1.0, b / gap));
  cov *= (1.0 - smoothstep(own - b - 0.12 * L, own + b, len)) * smoothstep(-b, b, len);
  return vec2(cov, sat(len / own));
}
vec2 shPar(vec2 q, float k, float c, float L, float b, float n, float seed, bool two) {
  k = max(k, 0.07);
  float A = k * k - c * c, B = q.y * c, C = k * k * q.x * q.x + q.y * q.y;
  float S = sqrt(max(B * B + A * C, 0.0));
  vec2 r = vec2(0.0);
  if (B + S > 1e-6) { float rho = C / (B + S); if (rho < L * 1.12 + b) r = shWall(q, rho, k, c, L, b, n, seed); }
  if (two && B - S > 1e-6) { float rho = C / (B - S); if (rho < L * 1.12 + b) { vec2 r2 = shWall(q, rho, k, c, L, b, n, seed + 0.37); r = vec2(max(r.x, r2.x), max(r.y, r2.y)); } }
  return r;
}

// One half of a head (side 1 is the near one): the parasols standing on a ball, found by the numbering of a sunflower's seeds.
// The ball has radius 1; b is the softness, gone how bare one side is, m turns it.
vec4 shHalf(vec2 q, float side, mat3 m, float b, float gone) {
  const float D = 4.5, RL = 0.93, RA = 0.83, PHI = 1.61803399;
  vec3 rd = normalize(vec3(q, -D));
  float B = -D * rd.z, deep = sqrt(max(B * B - D * D + RL * RL, 0.0));
  vec3 hit = vec3(0.0, 0.0, D) + rd * (B - side * deep * deep / (deep + 0.15)); // eased at the rim, where the ball turns away fast
  vec3 o = normalize(hit) * m;
  float kk = max(2.0, floor(log2(max(SH_N * PI * 2.236068 * (1.0 - o.z * o.z), 0.01)) / 1.388484));
  float Fk = pow(PHI, kk) / 2.236068;
  vec2 F = vec2(floor(Fk + 0.5), floor(Fk * PHI + 0.5));
  vec2 ka = 2.0 * F / SH_N, kb = TAU * (fract((F + 1.0) * PHI) - (PHI - 1.0));
  mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
  vec2 at = iB * vec2(atan(o.y, o.x + 1e-6), o.z - 1.0 + 1.0 / SH_N), base = floor(at + 0.5);
  float st2 = max(1.0 - o.z * o.z, 0.02);
  bool cap = abs(o.z) > 0.975; // round the two ends of the numbering the nine nearest are known
  float rim = (1.0 - smoothstep(0.15, 0.6, abs(hit.z))), lim = mix(0.088, 0.18, rim) + 0.4 * (1.0 - smoothstep(0.1, 0.35, st2)), nigh = mix(0.956, 0.91, rim);
  vec4 acc = vec4(0.0);
  for (int a = 0; a < 9; a++) {
    vec2 cell = base + vec2(float(a % 3) - 1.0, float(a / 3) - 1.0);
    vec2 off = vec2(dot(kb, cell - at), dot(ka, cell - at));
    if (!cap && st2 * off.x * off.x + off.y * off.y / st2 > lim) continue;
    float i = !cap ? dot(F, cell) : o.z > 0.0 ? float(a) : SH_N - 1.0 - float(a);
    if (i < 0.0 || i > SH_N - 0.5) continue;
    float ph = TAU * fract(i * PHI), ct = 1.0 - (2.0 * i + 1.0) / SH_N, st = sqrt(max(1.0 - ct * ct, 0.0));
    vec3 s = vec3(st * cos(ph), st * sin(ph), ct);
    if (dot(s, o) < nigh) continue;
    s = m * s;
    float vis = smoothstep(-0.1, 0.1, s.z * side + 0.1 * side);
    if (vis <= 0.0) continue;
    float h = hash21(vec2(i, 3.0));
    if (h < 0.035 || (gone > 0.0 && dot(s, vec3(0.62, 0.62, 0.3)) + 0.5 * h > 0.75 - gone)) continue;
    float ra = RA * (0.97 + 0.05 * h), per = D / (D - s.z * ra), L = (0.205 + 0.03 * fract(h * 7.7)) * per;
    vec2 d = q - s.xy * ra * per;
    float lx = length(s.xy);
    vec2 e = lx > 1e-3 ? s.xy / lx : vec2(0.0, 1.0);
    float k = abs(dot(s, normalize(vec3(0.0, 0.0, D) - s * ra)));
    float cup = 0.5 + 0.2 * (2.0 * fract(h * 13.0) - 1.0), c0 = cup * sqrt(max(1.0 - k * k, 0.0));
    d = vec2(d.x * e.y - d.y * e.x, dot(d, e));
    if (shSq(d.x) + shSq(d.y - c0 * L) > shSq(L + b)) continue; // no hair reaches past this round
    vec2 t = shPar(d, k, c0, L, b, 23.0, h, side > 0.0);
    if (t.x <= 0.003) continue;
    float lit = 0.5 + 0.5 * dot(s, shSun);
    vec3 c = mix(shCool, shWarm, lit) * (0.3 + 1.1 * lit * lit + 0.4 * (1.0 - k));
    c = c * shMore + shTint * (0.25 + lit) + shGlow * (0.4 + lit) * (side > 0.0 ? 1.0 : 0.6);
    c *= (1.0 + 0.5 * uKeys * step(0.6, h)) * shSwept;
    c *= 0.75 + 0.6 * t.y * t.y;
    c *= mix(0.6, 1.75, smoothstep(-0.45, 0.0, s.z));
    float cov = t.x * vis * (0.65 + 0.35 * sqrt(max(1.0 - k * k, 0.0)));
    acc += (1.0 - acc.a) * cov * vec4(c, 1.0);
    if (acc.a > 0.97) break;
  }
  return acc;
}
// A whole head laid over col: far half, the fine beaks running in to the heart, the heart, near half.
vec3 shHead(vec3 col, vec2 q, mat3 m, float b, float gone, vec3 kindC, float kindL, float wave) {
  float r = length(q);
  if (r > 1.11) return col;
  col = mix(col, col * vec3(0.34, 0.36, 0.3), 0.85 * (1.0 - smoothstep(0.5, 1.02, r)) * (gone > 0.0 ? 0.6 * (1.0 - smoothstep(-0.35, 0.25, dot(q, vec2(0.7)))) : 1.0));
  // the bands from base to crown, the piece laid over the ball, a cue's breath crossing it, a hit spreading from the shoulder
  vec2 w0 = q / 0.93;
  vec4 pc = piece(vec2(0.5 + 0.46 * w0.x, 0.5 - 0.46 * w0.y));
  shGlow = pc.rgb * pc.rgb + uKind[3] * uKind[3] * uPhrase * 0.7 * smoothstep(0.2, 0.9, w0.y);
  shGlow *= 0.5 + uEnergy;
  shTint = kindC * kindC * kindL * 0.75;
  shMore = 1.05 + (0.35 + 0.6 * uEnergy) * band(0.5 + 0.5 * w0.y);
  shSwept = 1.0 + 1.6 * wave * exp(-shSq((dot(w0, vec2(0.85, 0.5)) + 1.3 - 2.6 * (1.0 - uCue)) * 2.2));
  shSwept += (1.3 + 3.0 * gone) * uHits * exp(-shSq((distance(w0, vec2(0.64 - 2.0 * gone)) - 1.5 * (1.0 - uHits)) * 3.2));
  vec4 f = shHalf(q, 1.0, m, b, gone), f2;
  vec3 front = f.rgb / max(f.a, 1e-3);
  if (f.a > 0.96) return front;
  f2 = shHalf(q, -1.0, m, b * 1.3, gone);
  col = mix(col, f2.rgb / max(f2.a, 1e-3), f2.a * 0.8);
  // the beaks, and the brown fruits they end in round the heart
  float a = atan(q.y, q.x + 1e-6);
  float n = 67.0, g = a / TAU * n, id = mod(floor(g), n);
  float h = hash11(id + 5.0), end_ = 0.84 * sqrt(1.0 - h * h);
  if (gone > 0.0) end_ *= step(dot(q / max(r, 1e-3), vec2(0.7, 0.7)), 0.75 - gone);
  float off = abs(fract(g) - 0.5 - 0.25 * sin(h * 50.0)) / n * TAU * r;
  float u = (r - 0.1 - 0.1 * fract(h * 13.0)) / 0.075, fruit = sqrt(max(1.0 - u * u, 0.0));
  float w = 0.0032 + 0.0065 * fruit;
  float l = sat((w + b - off) / (2.0 * b)) * min(1.0, w / b + 0.1) * (1.0 - smoothstep(end_ - 0.1, end_, r));
  vec3 c = mix(vec3(0.62, 0.53, 0.27) * (0.45 + 0.35 * dot(q, vec2(-0.6, 0.7))), vec3(0.1, 0.05, 0.016), fruit);
  col = mix(col, c + kindC * kindL * 0.08 + vec3(0.2, 0.15, 0.06) * uMic, l * (0.75 + 0.2 * fruit));
  float hr = r / 0.085;
  vec3 heart = mix(vec3(0.42, 0.36, 0.2), vec3(0.1, 0.065, 0.025), smoothstep(0.1, 1.0, hr + 4.0 * dot(q, vec2(0.6, -0.8))));
  col = mix(col, heart + kindC * kindL * 0.14, (1.0 - smoothstep(0.85 - b * 10.0, 1.0 + b * 10.0, hr)));
  return mix(col, front, f.a * 0.95);
}
mat3 shTurn(float a, float tip) {
  float c = cos(a), s = sin(a), d = cos(tip), e = sin(tip);
  return mat3(c, e * s, -d * s, 0.0, d, e, s, -e * c, d * c);
}
// A loose seed: parasol, beak and fruit. ang leans it, k turns its mouth to us.
vec4 shSeed(vec2 d, float ang, float L, float k, float b, float seed) {
  d = rot(ang) * d;
  float side = abs(d.x), y = -d.y / L;
  if (side > 1.15 * L + b || y < -1.2 - b / L || y > 2.4 + b / L) return vec4(0.0);
  float c = 0.55 * sqrt(max(1.0 - k * k, 0.0));
  vec2 t = y < 0.7 ? shPar(d, k, c, L, b, 30.0, seed, true) : vec2(0.0);
  vec3 cc = vec3(1.0, 0.94, 0.8) * (0.6 + 0.5 * t.y);
  vec4 acc = vec4(cc * t.x, t.x);
  float bend = d.x - 0.05 * L * sin(y * 1.4 + seed * 9.0);
  float w = 0.014 * L;
  float beak = sat((w + b - abs(bend)) / (2.0 * b)) * min(1.0, w / b + 0.1) * smoothstep(0.0, 0.04, y) * (1.0 - smoothstep(1.7 - b / L, 1.7 + b / L, y));
  acc += (1.0 - acc.a) * beak * vec4(0.75, 0.66, 0.42, 1.0);
  float u = (y - 1.95) / 0.33, fw = 0.07 * L * sqrt(max(1.0 - u * u, 0.001)) * (1.0 + 0.3 * u);
  float fr = sat((fw + b - abs(bend)) / (2.0 * b)) * (1.0 - smoothstep(1.0 - b / L, 1.0 + 2.0 * b / L, abs(u))) * min(1.0, 0.08 * L / b);
  acc += (1.0 - acc.a) * fr * vec4(mix(vec3(0.07, 0.04, 0.02), vec3(0.6, 0.4, 0.18), (1.0 - smoothstep(-fw, 0.0, bend))), 1.0);
  return acc;
}
// Round spots of light out of focus.
vec3 shSpots(vec2 p, float cell, float seed, float rim) {
  vec2 g = p / cell, id = floor(g), h = hash22(id + seed);
  float r = 0.2 + 0.2 * h.x, d = length(fract(g) - 0.5 - (h - 0.5) * 0.18);
  float on = smoothstep(0.55, 0.9, h.y) * (0.7 + 0.3 * sin(uTime * 0.23 + h.x * 40.0));
  return vec3(on * (1.0 - smoothstep(r - 0.07, r, d)) * (1.0 - rim + rim * d / r), h);
}
vec3 shMeadow(vec2 p) {
  vec2 s = p - vec2(-0.44, 0.27);
  float d2 = dot(s, s), g = exp(-d2 * mix(22.0, 12.0, uSpace)), g2 = exp(-d2 * mix(4.5, 2.5, uSpace));
  // grass far behind, only long soft strokes
  float n = noise(vec2(p.x * 4.0 + p.y * 1.3, p.y * 0.9 + 2.0)) * 0.6 + 0.4 * noise(vec2(p.x * 11.0 - p.y * 2.5, p.y * 1.4));
  vec3 col = mix(vec3(0.002, 0.007, 0.005), vec3(0.014, 0.034, 0.012), smoothstep(-0.5, 0.45, p.y)) * (0.3 + 1.4 * n);
  col += (vec3(0.065, 0.085, 0.008) * g2 + vec3(0.85, 0.5, 0.11) * g * (0.75 + 0.3 * uLevel)) * (0.4 + 1.2 * n);
  vec3 sp = shSpots(p + vec2(0.0, 0.01 * sin(uTime * 0.2)), 0.17, 3.0, 0.25);
  col += sp.x * mix(vec3(0.6, 0.45, 0.08), vec3(0.18, 0.3, 0.05), sp.y) * (0.006 + 0.22 * g2 * g2);
  return col;
}
// A head far out of focus: a pale ball, brighter at its rim, on a soft stem.
vec3 shFar(vec3 col, vec2 q, float R, float b, float lean, vec3 kindC, float kindL) {
  float bend = q.x - lean * q.y - 0.1 * q.y * q.y;
  col = mix(col, vec3(0.04, 0.055, 0.012), 0.7 * (1.0 - smoothstep(0.025 * R - b * 0.8, 0.025 * R + b * 0.8, abs(bend))) * (1.0 - smoothstep(-R, 0.0, q.y)));
  q /= R; b /= R;
  float r2 = dot(q, q);
  if (r2 > 2.5) return col;
  float mot = noise(vec2(q.x * 0.8 + q.y * 0.6, q.y * 0.8 - q.x * 0.6) * (8.0 + 4.0 * r2) + R * 70.0);
  float body = (1.0 - smoothstep(0.94 - b, 1.06 + b, sqrt(r2) + 0.03 * (mot - 0.5))) * (0.1 + 0.6 * r2 * r2 + 0.08 * mot);
  body *= 1.0 - 0.5 * exp(-r2 * 25.0);
  float lit = sat(0.5 + 0.5 * dot(q, vec2(-0.65, 0.65)));
  vec3 c = mix(shCool, shWarm, lit) * (0.2 + 0.8 * lit * lit) + kindC * kindC * kindL * (0.25 + 0.9 * lit) + band(0.5 + 0.5 * q.y) * 0.12;
  return mix(col, c, sat(body));
}
// Seeds a hit lets go from the rim of a head at c with radius R.
vec3 shLoose(vec3 col, vec2 p, vec2 c, float R, float L) {
  float px = 0.7 / uRes.y, go = 1.0 - uHits;
  if (uHits < 0.01) return col;
  for (int i = 0; i < 5; i++) {
    float fi = float(i), h = hash11(fi + 5.0), a = 0.2 + 0.29 * fi;
    vec2 at = c + R * 0.95 * vec2(cos(a), sin(a)) + go * vec2(0.2 + 0.16 * h, 0.02 + 0.1 * fract(h * 9.0));
    vec4 sd = shSeed(p - at, mix(a - 1.57, -0.35 - 0.3 * h, go * (2.0 - go)), L * (0.8 + 0.4 * h), 0.3 + 0.4 * h, px, h);
    col = mix(col, sd.rgb / max(sd.a, 1e-3) * shWarm * (0.85 + 0.7 * uKind[4]), sd.a * sat(uHits * 1.4));
  }
  return col;
}
// The stem of a head.
vec3 shStem(vec3 col, vec2 q, float R, float sway, float px, float side) {
  float sx = q.x + sway * 1.2 * q.y - 0.12 * q.y * q.y, w = 0.034 * R - 0.012 * R * smoothstep(-1.3 * R, 0.0, q.y);
  vec3 stem = mix(vec3(0.045, 0.06, 0.014), shWarm * vec3(0.4, 0.42, 0.15), smoothstep(0.1, 1.0, -sx / w * side)) * (0.8 + 0.4 * smoothstep(0.6, 1.0, sx / w * side));
  return mix(col, stem, (1.0 - smoothstep(w - px, w + px, abs(sx))) * step(q.y, -0.08 * R));
}
vec3 shClock(vec2 p) {
  float px = 0.7 / uRes.y;
  shCool = vec3(0.5, 0.6, 0.5); shWarm = vec3(1.4, 1.08, 0.6) * (0.85 + 0.3 * uTone); shSun = vec3(-0.52, 0.6, -0.6);
  vec3 col = shMeadow(p);
  float sway = (0.006 + 0.016 * uLow) * sin(uTime * 0.5) + 0.004 * sin(uTime * 0.83 + 1.0);
  float wide = sat((shAsp - 0.56) / 1.2), gust = 4.0 * uCue * (1.0 - uCue);
  // heads further off
  col = shFar(col, p - vec2(0.37 + 0.5 * sway, 0.215), 0.062, 0.016, 0.07, uKind[3], uPhrase);
  col = shFar(col, p - vec2(-0.75 + 0.5 * sway, -0.25), 0.13, 0.034, -0.08, uKind[2], uTexture);
  col = shFar(col, p - vec2(0.64 + 0.8 * sway, -0.22), 0.25, 0.05, 0.06, uKind[1], uPad);
  // the near head
  float R = min(0.395, 0.475 * shAsp);
  vec2 c = vec2(-0.15 * wide + sway, 0.04 + 0.003 * sin(uTime * 0.31)), q = p - c;
  col = shStem(col, q, R, sway, px, 1.0);
  q += 0.0016 * vec2(sin(uTime * 1.1 + p.y * 17.0), sin(uTime * 0.9 + p.x * 15.0)) + 0.012 * gust * vec2(0.8, 0.3);
  col = shHead(col, q / R, shTurn(0.3 + mod(uTime * 0.006, TAU), 0.35 + sway), px / R, 0.0, uKind[0], uDrone, uCue);
  col = shLoose(col, p, c, R, 0.065);
  vec2 s = p - vec2(-0.44, 0.27);
  return col + vec3(0.3, 0.19, 0.05) * exp(-dot(s, s) * 9.0) * (0.25 + 0.2 * uLevel);
}
vec3 shDusk(vec2 p, vec2 sun) {
  vec2 s = p - sun;
  float d = length(s), h = p.y + 0.2;
  vec3 col = mix(vec3(0.5, 0.24, 0.13), vec3(0.055, 0.075, 0.14), smoothstep(-0.05, 0.5, h));
  col = mix(col, vec3(0.018, 0.03, 0.07), smoothstep(0.25, 0.75, h));
  // thin cloud, which the pads light, and the glow along the horizon, which the drone does
  float cloud = noise(vec2(p.x * 1.7 + p.y * 3.0 - uTime * 0.004, p.y * 10.0 + p.x)) * smoothstep(-0.2, 0.3, p.y);
  col += (vec3(0.05, 0.035, 0.05) + uKind[1] * uKind[1] * uPad * 0.35) * cloud * cloud;
  col += uKind[0] * uKind[0] * uDrone * 0.22 * exp(-abs(h) * 9.0);
  col += uKind[3] * uKind[3] * uPhrase * 0.35 * exp(-d * 6.0);
  col += vec3(0.75, 0.32, 0.1) * exp(-d * mix(5.5, 3.7, uSpace)) * (0.6 + 0.3 * uLevel);
  col += mix(vec3(0.9, 0.4, 0.14), vec3(1.15, 0.82, 0.46), smoothstep(-0.09, 0.07, s.y)) * (1.0 - smoothstep(0.076, 0.108, d));
  // the meadow, blurred
  float far = -0.2 + 0.02 * sin(p.x * 3.0 + 1.0) + 0.005 * sin(p.x * 13.0);
  col = mix(col, vec3(0.085, 0.045, 0.04) + vec3(0.34, 0.13, 0.03) * exp(-d * 5.0), (1.0 - smoothstep(-0.04, 0.03, p.y - far)));
  float blades = noise(vec2(p.x * 9.0 + p.y * 2.0, p.y * 0.7 + 3.0)) + 0.5 * noise(vec2(p.x * 23.0 - p.y * 5.0, 7.0));
  float gust = uCue * exp(-shSq((p.x + 1.1 - 2.2 * (1.0 - uCue)) * 3.0));
  return mix(col, (vec3(0.01, 0.012, 0.012) + vec3(0.3, 0.15, 0.06) * gust + vec3(0.16, 0.06, 0.015) * exp(-d * 4.5)) * (0.4 + blades), (1.0 - smoothstep(-0.12, 0.06, p.y + 0.36 - 0.12 * blades)));
}
// A slow wave, one turn in 1.
float shWave(float x) { x = abs(fract(x) * 2.0 - 1.0); return 2.0 * x * x * (3.0 - 2.0 * x) - 1.0; }
vec3 shWind(vec2 p) {
  float px = 0.7 / uRes.y, W = 0.5 * shAsp + 0.3;
  vec2 sun = vec2(min(0.36, 0.5 * shAsp - 0.1), -0.1);
  shCool = vec3(0.45, 0.5, 0.64); shWarm = vec3(1.35, 0.95, 0.64) * (0.85 + 0.3 * uTone); shSun = vec3(0.72, 0.1, -0.6);
  float gust = 4.0 * uCue * (1.0 - uCue), sway = (0.008 + 0.02 * uLow) * sin(uTime * 0.45) + 0.02 * gust;
  vec3 col = shDusk(p, sun);
  float drift = uTime * 0.008 + uTravel * 0.008;
  // seeds far off, small and soft, lit by the bands from low to high
  vec4 here = piece(vec2(p.x / (2.0 * W - 0.6) + 0.5, 0.5 - p.y));
  float nearSun = exp(-dot(p - sun, p - sun) * 6.0), ring = uHits * exp(-shSq((length(p + vec2(0.5, 0.1)) - 0.15 - 0.9 * (1.0 - uHits)) * 5.0));
  vec3 fall = mix(shCool, shWarm, nearSun) * (0.05 + 0.3 * nearSun + 0.5 * band(p.y + 0.5) * (0.3 + 0.7 * uEnergy) + 1.2 * ring);
  fall += here.rgb * here.rgb * 0.8 + uKind[2] * uKind[2] * uTexture * 0.7;
  fall *= smoothstep(-0.28, -0.1, p.y);
  for (int i = 0; i < 2; i++) {
    float fi = float(i), cell = 0.15 - 0.05 * fi;
    vec2 g = (p - vec2(mod(drift * (1.0 - 0.4 * fi), 64.0 * cell), 0.02 * shWave(uTime * 0.032 + p.x * 0.5))) / cell, id = floor(g);
    vec2 h = hash22(vec2(mod(id.x, 64.0), id.y) + 7.0 * fi);
    if (h.y < 0.58) continue;
    vec2 d = (fract(g) - 0.5 - (h - 0.5) * 0.5) * rot(0.3 - h.x * 1.2) * (1.7 - 0.8 * fract(h.x * 13.0));
    float m = (1.0 - smoothstep(0.06, 0.2, length(d * vec2(1.0, 1.3 + 0.5 * fi)))) + fi * 0.6 * (1.0 - smoothstep(0.0, 0.03, abs(d.x))) * smoothstep(-0.3, -0.2, d.y) * step(d.y, 0.0);
    col += smoothstep(0.58, 0.95, h.y) * m * fall;
  }
  // the head they come from, half bare
  float R = min(0.25, 0.36 * shAsp);
  vec2 c = vec2(-min(0.55, 0.5 * shAsp - 0.2), -0.1) + vec2(sway, 0.0), q = p - c;
  col = shStem(col, q, R, sway, px, -1.0);
  if (dot(q, q) < R * R * 1.24) col = shHead(col, q / R + 0.004 * vec2(sin(uTime * 1.1 + p.y * 17.0), sin(uTime * 0.9 + p.x * 15.0)), shTurn(0.8 + 0.1 * sin(uTime * 0.03), 0.3 + sway), px / R, 0.35, uKind[0], uDrone, uCue);
  col = shLoose(col, p, c, R, 0.07);
  // seeds on the air, in four depths from far to near, each one seed to a wide cell
  for (int i = 0; i < 4; i++) {
    float z = float(i) / 3.0, cell = 0.27 + 0.2 * z + 0.4 * z * z, fi = float(i);
    float x = p.x - 0.05 * gust - mod(drift * (0.8 + 2.2 * z), 64.0 * cell) + 0.19 * fi, id = floor(x / cell);
    vec2 h = hash22(vec2(mod(id, 64.0), 3.0 + fi * 5.0));
    float L = 0.042 + 0.055 * z + 0.035 * z * z * z, b = px + (i == 0 ? 0.0035 : 0.0) + (i == 3 ? 0.008 : 0.0);
    float room = max(0.5 * cell - 1.45 * L, 0.0);
    float y = p.y + 0.1 - 0.5 * h.y - 0.045 * shWave(uTime * 0.02 + h.x * 7.0 + p.x * 0.4);
    float dx = x - (id + 0.5) * cell - (2.0 * h.x - 1.0) * room;
    if (h.x > 0.78 || abs(dx) > 1.45 * L + b || y > 1.25 * L + b || y < -2.5 * L - b) continue;
    float w = shWave(uTime * 0.035 + h.y * 9.0), h2 = fract(h.x * 37.0);
    vec4 sd = shSeed(vec2(dx, y), -0.2 - 0.35 * h2 + 0.12 * w, L, 0.2 + 0.4 * fract(h.y * 23.0) + 0.1 * w, b, h2);
    if (sd.a < 0.003) continue;
    vec2 at = vec2(p.x - dx, p.y - y);
    int kd = int(fract(h.y * 11.0) * 3.999);
    float kl = kd == 0 ? uDrone : kd == 1 ? uPad : kd == 2 ? uTexture : uPhrase;
    float near = exp(-dot(at - sun, at - sun) * 3.5);
    vec4 pc = piece(vec2(0.5 + at.x / (2.0 * W - 0.6), 0.5 - at.y));
    float gl = uCue * exp(-shSq((at.x + W - 2.0 * W * (1.0 - uCue)) * 3.0));
    vec3 c2 = sd.rgb / max(sd.a, 1e-3) * (mix(shCool, shWarm, near) * (0.75 + 0.75 * near + 1.5 * gl) + uKind[kd] * uKind[kd] * kl * 0.9 + pc.rgb * uEnergy);
    col = mix(col, c2, sd.a * (i == 3 ? 0.65 : 0.95));
  }
  return col;
}
vec3 render(vec2 p) {
  shAsp = uRes.x / uRes.y;
  vec3 col = uVar < 0.5 ? shClock(p) : shWind(p);
  return screenOf(col * 1.15);
}
