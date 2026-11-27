// name: Seed heads
// a: Clock
// b: In the wind
// what: One dandelion clock very near with the low sun behind it, every parasol a star of fine hairs, the far side seen through the near and three more heads lost in the soft green meadow; or a head half bare at dusk, its seeds carried off over a dark field past a blurred sun, some sharp, some out of focus.
// follows: The bands brighten the parasols from base to crown; the piece lies over the head in its colours. Each kind has a head, or sky, horizon, sun and seeds of its own. A hit lets five seeds go and sends a ring of light over the head; a cue is a breath across the head, or wind over the grass. Low sounds sway the stem; keys make single parasols shine.
// own: 0 the parasols of a head: 1 many and fine, -1 few and great; 1 what they are: 1 little flowers of six broad rays, -1 round beads of glass; 2 the ground: 1 pale paper with dark hairs on it, -1 a night of stars and a moon; 3 how many heads: 1 a whole field of them going away, -1 one so near that it rises like a planet; 4 1 blown nearly bare with the air full of seeds, -1 nothing in the air, and the head shut to a tuft on a scaly bulb; 5 1 dyed in the colours of the sounds, -1 dark against one great sun; 6 the form of a head: 1 a tall spindle, -1 a low wide cushion; 7 1 hung with drops of dew, -1 it stands in still water and is mirrored
#define ss smoothstep
float shN = 170.0, shS = 1.0, shHair = 0.009, shRays = 23.0, shPart = 0.0;
float shUp(float x) { return max(x, 0.0); }
float shSq(float x) { return x * x; }
float shAsp;
vec3 shCool, shWarm, shSun; // the shaded and the lit colour of a hair, and where the sun is from a head
vec3 shGlow, shTint; float shMore, shSwept;

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
 float w = shHair * L, gap = gapA * max(rho, 0.02 * L) * mix(k, 1.0, 0.5);
 if (uOwn[1] > 0.0) { float u_ = sat(len / own); w *= mix(1.0, 0.15 + 3.4 * u_ * (1.0 - 0.8 * u_), uOwn[1]); }
 float line = sat((w + b - off) / (2.0 * b)) * min(1.0, w / b + 0.12) + 0.035 * sat(1.0 - off / (0.09 * L));
 float even = min(0.9, 2.0 * w / gap);
 float cov = mix(line, even, ss(0.35, 1.0, b / gap));
 cov *= (1.0 - ss(own - b - 0.12 * L, own + b, len)) * ss(-b, b, len);
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
 vec3 hit = vec3(0.0, 0.0, D) + rd * (B - side * deep * deep / (deep + 0.15));
 vec3 o = normalize(hit) * m;
 float kk = max(2.0, floor(log2(max(shN * PI * 2.236068 * (1.0 - o.z * o.z), 0.01)) / 1.388484));
 float Fk = pow(PHI, kk) / 2.236068;
 vec2 F = vec2(floor(Fk + 0.5), floor(Fk * PHI + 0.5));
 vec2 ka = 2.0 * F / shN, kb = TAU * (fract((F + 1.0) * PHI) - (PHI - 1.0));
 mat2 iB = mat2(ka.y, -ka.x, kb.y, -kb.x) / (ka.y * kb.x - ka.x * kb.y);
 vec2 at = iB * vec2(atan(o.y, o.x + 1e-6), o.z - 1.0 + 1.0 / shN), base = floor(at + 0.5);
 float st2 = max(1.0 - o.z * o.z, 0.02);
 bool cap = abs(o.z) > 1.0 - 0.025 * shS * shS;
 float rim = (1.0 - ss(0.15, 0.6, abs(hit.z))), lim = mix(0.088, 0.18, rim) + 0.4 * (1.0 - ss(0.1, 0.35, st2)), nigh = mix(0.956, 0.91, rim);
 if (uOwn[0] != 0.0) { lim *= shS * shS; nigh = 1.0 - (1.0 - nigh) * shS * shS; }
 vec4 acc = vec4(0.0);
 for (int a = 0; a < 9; a++) {
  vec2 cell = base + vec2(float(a % 3) - 1.0, float(a / 3) - 1.0);
  vec2 off = vec2(dot(kb, cell - at), dot(ka, cell - at));
  if (!cap && st2 * off.x * off.x + off.y * off.y / st2 > lim) continue;
  float i = !cap ? dot(F, cell) : o.z > 0.0 ? float(a) : shN - 1.0 - float(a);
  if (i < 0.0 || i > shN - 0.5) continue;
  float ph = TAU * fract(i * PHI), ct = 1.0 - (2.0 * i + 1.0) / shN, st = sqrt(max(1.0 - ct * ct, 0.0));
  vec3 s = vec3(st * cos(ph), st * sin(ph), ct);
  if (dot(s, o) < nigh) continue;
  s = m * s;
  float vis = ss(-0.1, 0.1, s.z * side + 0.1 * side);
  if (vis <= 0.0) continue;
  float h = hash21(vec2(i, 3.0));
  if (uOwn[4] < 0.0 && s.y - 0.25 * h < -1.3 - 1.5 * uOwn[4]) continue;
  if (h < 0.035 || ((gone > 0.0 || shPart > 0.5) && dot(s, vec3(0.62, 0.62, 0.3)) + 0.5 * h > 0.75 - gone)) continue;
  float ra = RA * (0.97 + 0.05 * h), per = D / (D - s.z * ra), L = (0.205 + 0.03 * fract(h * 7.7)) * per * shS;
  vec2 d = q - s.xy * ra * per;
  float lx = length(s.xy);
  vec2 e = lx > 1e-3 ? s.xy / lx : vec2(0.0, 1.0);
  float k = abs(dot(s, normalize(vec3(0.0, 0.0, D) - s * ra)));
  float cup = 0.5 + 0.2 * (2.0 * fract(h * 13.0) - 1.0), c0 = cup * sqrt(max(1.0 - k * k, 0.0));
  d = vec2(d.x * e.y - d.y * e.x, dot(d, e));
  if (shSq(d.x) + shSq(d.y - c0 * L) > shSq(L + b)) continue;
  vec2 t = vec2(0.0);
  if (uOwn[1] > -1.0) t = shPar(d, k, c0, L, b, shRays, h, side > 0.0);
  float gem = shUp(-uOwn[1]), gl = 0.0, shade = 1.0;
  if (gem > 0.0) {
   vec2 g = (d - vec2(0.0, 0.35 * c0 * L)) / (0.43 * L);
   float gg = dot(g, g), nz = sqrt(max(1.0 - gg, 0.0)), gb = b / (0.43 * L);
   vec2 sd = vec2(shSun.x * e.y - shSun.y * e.x, dot(shSun.xy, e));
   float at_ = length(g - sd * 0.45), far_ = dot(g, sd);
   t = mix(t, vec2(1.0 - ss(1.0 - 2.0 * gb, 1.0 + 2.0 * gb, sqrt(gg)), 0.55), gem);
   shade = mix(1.0, 0.35 + 0.9 * (1.0 - nz) * (0.6 - 0.6 * far_) + 0.5 * ss(0.8, -0.8, far_) * nz, gem);
   gl = gem * exp(-at_ * at_ * 22.0);
  }
  if (uOwn[7] > 0.0) {
   float dr = 0.0;
   for (int j = 0; j < 2; j++) {
    float fj = float(j), an = h * 60.0 + 2.4 * fj, rr = (0.13 + 0.1 * fract(h * 31.0 + 0.4 * fj)) * L;
    vec2 g = d - vec2(cos(an) * 0.55, sin(an) * 0.55 * k + c0 * 0.6) * L * fj * 0.9;
    float gr = length(g) / rr;
    dr = max(dr, 0.8 - 0.8 - ss(0.9 - b / rr, 1.0 + b / rr, gr));
    gl += uOwn[7] * (3.5 * exp(-dot(g / rr - vec2(-0.3, 0.35), g / rr - vec2(-0.3, 0.35)) * 14.0) + 0.9 * ss(0.35, 0.9, gr - 0.5 * g.y / rr)) * step(gr, 1.0);
    shade *= 1.0 - 0.6 * uOwn[7] * step(gr, 1.0);
   }
   t = vec2(max(t.x, dr * uOwn[7]), t.y);
  }
  if (t.x <= 0.003) continue;
  float lit = 0.5 + 0.5 * dot(s, shSun);
  vec3 c = mix(shCool, shWarm, lit) * (0.3 + 1.1 * lit * lit + 0.4 * (1.0 - k));
  c = c * shMore + shTint * (0.25 + lit) + shGlow * (0.4 + lit) * (side > 0.0 ? 1.0 : 0.6);
  c *= (1.0 + 0.5 * uKeys * step(0.6, h)) * shSwept;
  c *= 0.75 + 0.6 * t.y * t.y;
  c *= mix(0.6, 1.75, ss(-0.45, 0.0, s.z));
  if (gem > 0.0 || uOwn[7] > 0.0) c = c * shade + gl * (shWarm * 0.5 + vec3(0.55, 0.6, 0.6)) * (0.35 + 0.65 * lit) * (1.0 - 0.4 * shUp(uOwn[2])) * shSwept;
  float cov = t.x * vis * (0.65 + 0.35 * sqrt(max(1.0 - k * k, 0.0)));
  acc += (1.0 - acc.a) * cov * vec4(c, 1.0);
  if (acc.a > 0.97) break;
 }
 return acc;
}
// A whole head laid over col: far half, the fine beaks running in to the heart, the heart, near half.
vec2 shForm(vec2 q) { return uOwn[6] == 0.0 ? q : q * exp2(uOwn[6] * vec2(0.75, -0.3) - vec2(0.3, 0.3) * min(uOwn[6], 0.0)); }
vec3 shHead(vec3 col, vec2 q, mat3 m, float b, float gone, vec3 kindC, float kindL, float wave) {
 q = shForm(q);
 float r = length(q);
 if (r > 1.11 + 0.3 * max(shS - 1.0, 0.0)) return col;
 col = mix(col, col * vec3(0.34, 0.36, 0.3), 0.85 * (1.0 - 0.8 * shUp(uOwn[2])) * (1.0 - ss(0.5, 1.02, r)) * (gone > 0.0 || shPart > 0.5 ? 0.6 * (1.0 - ss(-0.35, 0.25, dot(q, vec2(0.7)))) : 1.0));
 vec2 w0 = q / 0.93;
 vec4 pc = piece(vec2(0.5 + 0.46 * w0.x, 0.5 - 0.46 * w0.y));
 shGlow = pc.rgb * pc.rgb + uKind[3] * uKind[3] * uPhrase * 0.7 * ss(0.2, 0.9, w0.y);
 shGlow *= 0.5 + uEnergy;
 shTint = kindC * kindC * kindL * 0.75;
 float ink = max(shUp(uOwn[2]), 0.85 * shUp(-uOwn[5]));
 if (ink > 0.0) { shGlow *= 1.0 - 0.85 * ink; shTint *= 1.0 - 0.85 * ink; }
 shMore = 1.05 + (0.35 + 0.6 * uEnergy) * band(0.5 + 0.5 * w0.y);
 shSwept = 1.0 + 1.6 * wave * exp(-shSq((dot(w0, vec2(0.85, 0.5)) + 1.3 - 2.6 * (1.0 - uCue)) * 2.2));
 shSwept += (1.3 + 3.0 * shUp(gone)) * uHits * exp(-shSq((distance(w0, vec2(0.64 - 2.0 * shUp(gone))) - 1.5 * (1.0 - uHits)) * 3.2));
 vec4 f = shHalf(q, 1.0, m, b, gone), f2;
 vec3 front = f.rgb / max(f.a, 1e-3);
 if (f.a > 0.96) return front;
 float back = 1.0 - 2.0 * shUp(-uOwn[3]);
 if (back > 0.0) { f2 = shHalf(q, -1.0, m, b * 1.3, gone);
 col = mix(col, f2.rgb / max(f2.a, 1e-3), f2.a * 0.8 * back); }
 float a = atan(q.y, q.x + 1e-6);
 float n = 67.0, g = a / TAU * n, id = mod(floor(g), n);
 float h = hash11(id + 5.0), end_ = 0.84 * sqrt(1.0 - h * h);
 if (gone > 0.0 || shPart > 0.5) end_ *= step(dot(q / max(r, 1e-3), vec2(0.7, 0.7)), 0.75 - gone);
 if (uOwn[4] < 0.0) end_ *= ss(0.0, 0.1, q.y / max(r, 1e-3) + 1.15 + 1.2 * uOwn[4]);
 float off = abs(fract(g) - 0.5 - 0.25 * sin(h * 50.0)) / n * TAU * r;
 float u = (r - 0.1 - 0.1 * fract(h * 13.0)) / 0.075, fruit = sqrt(max(1.0 - u * u, 0.0));
 float w = 0.0032 + 0.0065 * fruit;
 float l = sat((w + b - off) / (2.0 * b)) * min(1.0, w / b + 0.1) * (1.0 - ss(end_ - 0.1, end_, r));
 vec3 c = mix(mix(vec3(0.62, 0.53, 0.27), shWarm * 0.45, max(max(uOwn[5], -uOwn[5]), abs(uOwn[2])) * 0.8) * (0.45 + 0.35 * dot(q, vec2(-0.6, 0.7))), vec3(0.1, 0.05, 0.016), fruit);
 col = mix(col, c + kindC * kindL * 0.08 + vec3(0.2, 0.15, 0.06) * uMic, l * (0.75 + 0.2 * fruit));
 float hr = r / 0.085;
 vec3 heart = mix(vec3(0.42, 0.36, 0.2), vec3(0.1, 0.065, 0.025), ss(0.1, 1.0, hr + 4.0 * dot(q, vec2(0.6, -0.8))));
 col = mix(col, heart + kindC * kindL * 0.14, (1.0 - ss(0.85 - b * 10.0, 1.0 + b * 10.0, hr)));
 if (uOwn[4] < 0.0) {
  float fa = atan(q.x, q.y + 0.35), fan = noise(vec2(fa * 26.0, r * 1.5)) * 0.6 + 0.4 * noise(vec2(fa * 70.0, r * 3.0));
  col = mix(col, mix(shCool, shWarm, sat(0.5 - q.x * sign(-shSun.x))) * (0.15 + fan * fan) * shMore, (1.0 - ss(0.75, 0.97, r + 0.1 * fan)) * ss(1.15, 0.75, abs(fa) + 0.2 * fan) * step(-0.2, q.y) * sat(-2.0 * uOwn[4]) * (0.35 + 0.6 * fan));
  vec2 u = (q - vec2(0.0, -0.14)) / (vec2(0.33, 0.36) * (0.3 - 0.7 * uOwn[4]));
  u.x *= 1.0 + 0.22 * u.y;
  float uu = dot(u, u), as = asin(clamp(u.x / sqrt(max(1.0 - u.y * u.y, 0.05)), -1.0, 1.0)) * 2.2, row = u.y * 3.6 - 0.5 * u.x * u.x;
  vec2 g = vec2(as + 0.5 * mod(floor(row), 2.0), row);
  float sc = fract(g.y) - 1.3 * abs(fract(g.x) - 0.5) + 0.3;
  vec3 bc = (shCool * 0.1 + shWarm * vec3(0.16, 0.2, 0.1) * sat(0.6 - 0.6 * u.x * sign(shSun.x) * -1.0)) * (0.35 + 1.0 * ss(0.05, 0.75, sc)) * (1.2 - 0.8 * uu);
  col = mix(col, bc, (1.0 - ss(1.0 - 5.0 * b, 1.0 + 5.0 * b, uu)) * sat(-3.0 * uOwn[4]));
 }
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
 float beak = sat((w + b - abs(bend)) / (2.0 * b)) * min(1.0, w / b + 0.1) * ss(0.0, 0.04, y) * (1.0 - ss(1.7 - b / L, 1.7 + b / L, y));
 acc += (1.0 - acc.a) * beak * vec4(0.75, 0.66, 0.42, 1.0);
 float u = (y - 1.95) / 0.33, fw = 0.07 * L * sqrt(max(1.0 - u * u, 0.001)) * (1.0 + 0.3 * u);
 float fr = sat((fw + b - abs(bend)) / (2.0 * b)) * (1.0 - ss(1.0 - b / L, 1.0 + 2.0 * b / L, abs(u))) * min(1.0, 0.08 * L / b);
 acc += (1.0 - acc.a) * fr * vec4(mix(vec3(0.07, 0.04, 0.02), vec3(0.6, 0.4, 0.18), (1.0 - ss(-fw, 0.0, bend))), 1.0);
 return acc;
}
// Round spots of light out of focus.
vec3 shSpots(vec2 p, float cell, float seed, float rim) {
 vec2 g = p / cell, id = floor(g), h = hash22(id + seed);
 float r = 0.2 + 0.2 * h.x, d = length(fract(g) - 0.5 - (h - 0.5) * 0.18);
 float on = ss(0.55, 0.9, h.y) * (0.7 + 0.3 * sin(uTime * 0.23 + h.x * 40.0));
 return vec3(on * (1.0 - ss(r - 0.07, r, d)) * (1.0 - rim + rim * d / r), h);
}
vec3 shMeadow(vec2 p) {
 vec2 s = p - vec2(-0.44, 0.27);
 float d2 = dot(s, s), g = exp(-d2 * mix(22.0, 12.0, uSpace)), g2 = exp(-d2 * mix(4.5, 2.5, uSpace));
 float n = noise(vec2(p.x * 4.0 + p.y * 1.3, p.y * 0.9 + 2.0)) * 0.6 + 0.4 * noise(vec2(p.x * 11.0 - p.y * 2.5, p.y * 1.4));
 vec3 col = mix(vec3(0.002, 0.007, 0.005), vec3(0.014, 0.034, 0.012), ss(-0.5, 0.45, p.y)) * (0.3 + 1.4 * n);
 col += (vec3(0.065, 0.085, 0.008) * g2 + vec3(0.85, 0.5, 0.11) * g * (0.75 + 0.3 * uLevel)) * (0.4 + 1.2 * n);
 vec3 sp = shSpots(p + vec2(0.0, 0.01 * sin(uTime * 0.2)), 0.17, 3.0, 0.25);
 col += sp.x * mix(vec3(0.6, 0.45, 0.08), vec3(0.18, 0.3, 0.05), sp.y) * (0.006 + 0.22 * g2 * g2);
 return col;
}
vec3 shGround(vec3 col, vec2 p, vec2 s, vec2 head, float land) {
 float d = length(s), n = noise(vec2(p.x * 2.1 + 3.0, p.y * 1.7)) * 0.6 + 0.4 * noise(p * 5.3 + 9.0);
 vec4 w = piece(vec2(0.5 + p.x / shAsp, 0.5 - p.y) + 0.16 * (vec2(noise(p * 6.0), noise(p * 5.0 + 20.0)) - 0.5));
 float ring = length(p - head) - 0.2 - 0.6 * (1.0 - uHits);
 ring = uHits * exp(-ring * ring * 60.0);
 if (uOwn[2] < 0.0) {
  vec3 ni = mix(vec3(0.012, 0.02, 0.045), vec3(0.002, 0.004, 0.014), sat(p.y + 0.5)) * (0.7 + 0.6 * n);
  ni += uKind[1] * uKind[1] * (0.02 + 0.12 * uPad) * exp(-abs(p.y + 0.25) * 5.0);
  vec2 g = p * 46.0, id = floor(g), h = hash22(id + 11.0);
  float st = length(fract(g) - 0.5 - 0.6 * (h - 0.5));
  ni += step(0.72, h.x) * ss(0.02 + 0.12 * h.y * h.y, 0.0, st) * (0.4 + 0.5 * sin(uTime * (0.3 + h.y) + h.x * 40.0) * 0.6 + 0.3 * uHigh) * vec3(0.8, 0.9, 1.1) * ss(-0.3, 0.0, p.y);
  ni += vec3(0.75, 0.85, 1.0) * (0.05 * exp(-d * 4.0) + 0.1 * exp(-d * 14.0) * (0.6 + 0.6 * uLevel) + 1.1 * (1.0 - ss(0.066, 0.07, d)) * (0.7 + 0.4 * noise(s * 34.0)));
  col = mix(col, mix(ni, vec3(0.002, 0.004, 0.006), land), -uOwn[2]);
 }
 if (uOwn[5] < 0.0) {
  float r = length(p - head), big = uVar < 0.5 ? 0.46 : 0.31, disc = 1.0 - ss(big, big + 0.006, r);
  vec3 sk = (uKind[0] * uKind[0] * 0.5 + 0.02) * (0.5 + 0.6 * sat(0.5 - p.y)) * (0.75 + 0.5 * n) + (uKind[4] * uKind[4] + 0.06) * 0.55 * exp(-max(r - big, 0.0) * 5.0) * (0.75 + 0.4 * uLevel);
  sk = mix(sk, (uKind[4] * uKind[4] + 0.05) * (1.5 + 0.5 * sat(1.0 - r * 2.0)) * (0.92 + 0.16 * n), disc);
  sk = sk * (1.0 + 0.6 * ring) + w.rgb * w.rgb * 0.4 * (0.2 + n) * (0.5 + disc);
  col = mix(col, mix(sk, uKind[0] * uKind[0] * 0.06, land), -uOwn[5]);
 }
 if (uOwn[5] > 0.0) {
  vec3 a = uKind[0] * uKind[0], z = uKind[1] * uKind[1], dy = mix(z * 0.8, a * 0.35, ss(-0.45, 0.5, p.y + 0.3 * n - 0.15)) * (0.7 + 0.6 * n);
  dy += (uKind[4] * uKind[4] * 0.5 + 0.02) * (0.5 * exp(-d * 3.2) * (0.7 + 0.4 * uLevel)) + uKind[1] * 0.1 * uPad * n;
  if (land >= 0.0 && uVar > 0.5) dy += (uKind[4] * 0.9) * (1.0 - ss(0.076, 0.108, d));
  col = mix(col, mix(dy, a * 0.1, land * 0.3), uOwn[5] * (1.0 + min(uOwn[2], 0.0)));
 }
 if (uOwn[2] > 0.0) {
  vec3 pa = mix(vec3(1.45, 1.38, 1.22), uKind[1] * uKind[1] * 1.6, 0.75 * shUp(uOwn[5]));
  pa *= (0.93 + 0.1 * noise(p * 170.0) * (0.5 + n)) * (1.0 - 0.3 * dot(p, p)) + 0.12 * exp(-d * 3.0);
  pa *= mix(vec3(1.0), 0.55 + 0.6 * uKind[0], 0.5 * land + 0.35 * ss(0.1, -0.5, p.y));
  pa *= mix(vec3(1.0), 0.35 + 0.65 * w.rgb / max(w.a, 0.02), sat(w.a * 1.2) * (0.45 + 0.4 * n)) * (1.0 - 0.4 * ring * (1.0 - uKind[4]));
  pa *= 1.0 - (1.0 - uKind[0]) * 0.22 * uDrone * ss(0.1, -0.5, p.y);
  col = mix(col, pa, uOwn[2]);
 }
 return col;
}
void shHour() {
 shN = floor(170.0 * exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.3 : 1.6)) + 0.5); shS = sqrt(170.0 / shN);
 if (uOwn[1] > 0.0) { shHair = mix(0.009, 0.1, uOwn[1]); shRays = floor(mix(23.0, 6.0, sqrt(max(uOwn[1], 1e-4))) + 0.5); }
 if (uOwn[2] < 0.0) { shCool = mix(shCool, vec3(0.2, 0.28, 0.45), -uOwn[2]); shWarm = mix(shWarm, vec3(0.8, 0.95, 1.15), -uOwn[2]); }
 if (uOwn[5] > 0.0) { shCool = mix(shCool, uKind[2] * uKind[2] * 1.1, uOwn[5]); shWarm = mix(shWarm, uKind[3] * (0.4 + uKind[3]), uOwn[5]); }
 if (uOwn[5] < 0.0) { shCool = mix(shCool, vec3(0.02) + 0.03 * uKind[0], -uOwn[5]); shWarm = mix(shWarm, 0.12 * uKind[4] + 0.02, -uOwn[5]); }
 if (uOwn[2] > 0.0) { vec3 k = mix(vec3(0.045, 0.037, 0.03), uKind[2] * uKind[2] * 0.25, 0.4 + 0.6 * shUp(uOwn[5])); shCool = mix(shCool, k, uOwn[2]); shWarm = mix(shWarm, k * 0.55 + uKind[3] * uKind[3] * 0.15, uOwn[2]); }
}
// A head far out of focus: a pale ball, brighter at its rim, on a soft stem.
vec3 shFar(vec3 col, vec2 q, float R, float b, float lean, vec3 kindC, float kindL) {
 float bend = q.x - lean * q.y - 0.1 * q.y * q.y;
 col = mix(col, vec3(0.04, 0.055, 0.012), 0.7 * (1.0 - ss(0.025 * R - b * 0.8, 0.025 * R + b * 0.8, abs(bend))) * (1.0 - ss(-R, 0.0, q.y)));
 q = shForm(q) / R; b /= R;
 float r2 = dot(q, q);
 if (r2 > 2.5) return col;
 float mot = noise(vec2(q.x * 0.8 + q.y * 0.6, q.y * 0.8 - q.x * 0.6) * (8.0 + 4.0 * r2) + R * 70.0);
 float body = (1.0 - ss(0.94 - b, 1.06 + b, sqrt(r2) + 0.03 * (mot - 0.5))) * (0.1 + 0.6 * r2 * r2 + 0.08 * mot);
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
 float sx = q.x + sway * 1.2 * q.y - 0.12 * q.y * q.y, w = 0.034 * R - 0.012 * R * ss(-1.3 * R, 0.0, q.y);
 vec3 stem = mix(vec3(0.045, 0.06, 0.014), shWarm * vec3(0.4, 0.42, 0.15), ss(0.1, 1.0, -sx / w * side)) * (0.8 + 0.4 * ss(0.6, 1.0, sx / w * side));
 return mix(col, stem, (1.0 - ss(w - px, w + px, abs(sx))) * step(q.y, -0.08 * R));
}
// A slow wave, one turn in 1.
float shWave(float x) { x = abs(fract(x) * 2.0 - 1.0); return 2.0 * x * x * (3.0 - 2.0 * x) - 1.0; }
vec3 shAir(vec3 col, vec2 p, vec2 sun, float W, float drift, float gust, float px) {
 float thin = uVar < 0.5 ? 0.85 * shUp(uOwn[4]) : uOwn[4] < 0.0 ? 0.78 * (1.0 + uOwn[4]) : 0.78 + 0.22 * uOwn[4];
 // seeds on the air, in four depths from far to near, each one seed to a wide cell
 for (int i = 0; i < 4; i++) {
  float z = float(i) / 3.0, cell = (0.27 + 0.2 * z + 0.4 * z * z) * (1.0 - 0.25 * shUp(uOwn[4])), fi = float(i);
  float x = p.x - 0.05 * gust - mod(drift * (0.8 + 2.2 * z), 64.0 * cell) + 0.19 * fi, id = floor(x / cell);
  vec2 h = hash22(vec2(mod(id, 64.0), 3.0 + fi * 5.0));
  float L = 0.042 + 0.055 * z + 0.035 * z * z * z, b = px + (i == 0 ? 0.0035 : 0.0) + (i == 3 ? 0.008 : 0.0);
  float room = max(0.5 * cell - 1.45 * L, 0.0);
  float y = p.y + 0.1 - 0.5 * h.y - 0.045 * shWave(uTime * 0.02 + h.x * 7.0 + p.x * 0.4);
  float dx = x - (id + 0.5) * cell - (2.0 * h.x - 1.0) * room;
  if (h.x > thin || abs(dx) > 1.45 * L + b || y > 1.25 * L + b || y < -2.5 * L - b) continue;
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
vec2 shFq; float shFR = 0.0, shFh, shFl; int shFk = 0;
vec3 shField(vec3 col, vec2 p, float sway) {
 if (uOwn[3] <= 0.0) return col;
 for (int i = 0; i < 13; i++) {
  float fi = float(i), z = fi / 12.0, h = hash11(fi * 1.31 + 2.7), on = sat(uOwn[3] * 14.0 - fi), R = mix(0.026, 0.11, z * z) * (0.8 + 0.4 * h);
  if (on <= 0.0) continue;
  float x = ((i < 5 ? fract(fi * 0.618034 + 0.31) : (mod(fi * 3.0, 8.0) + 0.3 + 0.4 * h) / 8.0 * 0.82 + 0.23 * step(2.5, mod(fi * 3.0, 8.0)) - 0.05) - 0.5) * (shAsp + 0.1), y = mix(0.0, -0.17, z) + 0.2 * (hash11(fi + 9.7) - 0.35) * (0.3 + z);
  vec2 q = p - vec2(x + sway * (0.3 + z), y - 0.6 * (1.0 - on));
  if (abs(q.x) > 2.2 * R + 0.05 || q.y > 2.0 * R) continue;
  int k = i % 4;
  float kl = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase;
  if (i < 5) { col = shFar(col, q, R, 0.004 + R * 0.08, 0.16 * (h - 0.5), uKind[k], kl); continue; }
  col = shStem(col, q, R, 0.1 * (h - 0.5), 0.7 / uRes.y, 1.0);
  vec2 w = shForm(q / R);
  if (dot(w, w) < 1.08 + shUp(shS - 1.0)) { shFq = q / R; shFR = R; shFk = k; shFh = h; shFl = kl; }
 }
 return col;
}
vec3 shClock(vec2 p) {
 float px = 0.7 / uRes.y;
 shCool = vec3(0.5, 0.6, 0.5); shWarm = vec3(1.4, 1.08, 0.6) * (0.85 + 0.3 * uTone); shSun = vec3(-0.52, 0.6, -0.6);
 shHour();
 vec3 col = shMeadow(p);
 float sway = (0.006 + 0.016 * uLow) * sin(uTime * 0.5) + 0.004 * sin(uTime * 0.83 + 1.0);
 float wide = sat((shAsp - 0.56) / 1.2), gust = 4.0 * uCue * (1.0 - uCue);
 float R = min(0.395, 0.475 * shAsp);
 vec2 c = vec2(-0.15 * wide + sway, 0.04 + 0.003 * sin(uTime * 0.31));
 if (uOwn[3] > 0.0) R *= 1.0 - 0.5 * uOwn[3];
 if (uOwn[7] < 0.0) { R *= 1.0 + 0.15 * uOwn[7]; c.y -= 0.08 * uOwn[7]; }
 if (uOwn[3] < 0.0) { R *= 1.0 - 0.95 * uOwn[3]; c = mix(c, vec2(0.12 * wide + sway, -0.44), -uOwn[3]); }
 if (uOwn[2] != 0.0 || uOwn[5] != 0.0) col = shGround(col, p, p - vec2(-0.44, 0.27), c, 0.0);
 float gone = 0.0;
 if (uOwn[4] > 0.0) { shPart = 1.0; gone = mix(-0.7, 1.1, uOwn[4]); }
 col = shField(col, p, sway);
 // heads further off
 col = shFar(col, p - vec2(0.37 + 0.5 * sway, 0.215 - 0.6 * shUp(uOwn[3])), 0.062, 0.016, 0.07, uKind[3], uPhrase);
 col = shFar(col, p - vec2(-0.75 + 0.5 * sway, -0.25 - 0.6 * shUp(uOwn[3])), 0.13, 0.034, -0.08, uKind[2], uTexture);
 col = shFar(col, p - vec2(0.64 + 0.8 * sway, -0.22 - 0.6 * shUp(uOwn[3])), 0.25, 0.05, 0.06, uKind[1], uPad);
 // the near head
 vec2 q = p - c;
 col = shStem(col, q, R, sway, px, 1.0);
 q += 0.0016 * vec2(sin(uTime * 1.1 + p.y * 17.0), sin(uTime * 0.9 + p.x * 15.0)) + 0.012 * gust * vec2(0.8, 0.3);
 q /= R;
 float turn = 0.3 + mod(uTime * 0.006, TAU);
 bool mine = shFR == 0.0 || dot(shForm(q), shForm(q)) < 1.1 + shS - 1.0;
 col = shHead(col, mine ? q : shFq, shTurn(mine ? turn : 6.0 * shFh, 0.35 + sway), px / (mine ? R : shFR), gone, uKind[shFk], mine ? uDrone : shFl, uCue);
 col = shLoose(col, p, c, R, 0.065);
 vec2 s = p - vec2(-0.44, 0.27);
 if (uOwn[4] > 0.0) col = shAir(col, p, s - p, 0.5 * shAsp + 0.3, uTime * 0.008 + uTravel * 0.008, gust, px);
 return col + vec3(0.3, 0.19, 0.05) * exp(-dot(s, s) * 9.0) * (0.25 + 0.2 * uLevel) * (1.0 - max(abs(uOwn[2]), abs(uOwn[5])));
}
vec3 shDusk(vec2 p, vec2 sun) {
 vec2 s = p - sun;
 float d = length(s), h = p.y + 0.2;
 vec3 col = mix(vec3(0.5, 0.24, 0.13), vec3(0.055, 0.075, 0.14), ss(-0.05, 0.5, h));
 col = mix(col, vec3(0.018, 0.03, 0.07), ss(0.25, 0.75, h));
 float cloud = noise(vec2(p.x * 1.7 + p.y * 3.0 - uTime * 0.004, p.y * 10.0 + p.x)) * ss(-0.2, 0.3, p.y);
 col += (vec3(0.05, 0.035, 0.05) + uKind[1] * uKind[1] * uPad * 0.35) * cloud * cloud;
 col += uKind[0] * uKind[0] * uDrone * 0.22 * exp(-abs(h) * 9.0);
 col += uKind[3] * uKind[3] * uPhrase * 0.35 * exp(-d * 6.0);
 col += vec3(0.75, 0.32, 0.1) * exp(-d * mix(5.5, 3.7, uSpace)) * (0.6 + 0.3 * uLevel);
 col += mix(vec3(0.9, 0.4, 0.14), vec3(1.15, 0.82, 0.46), ss(-0.09, 0.07, s.y)) * (1.0 - ss(0.076, 0.108, d));
 float far = -0.2 + 0.02 * sin(p.x * 3.0 + 1.0) + 0.005 * sin(p.x * 13.0);
 col = mix(col, vec3(0.085, 0.045, 0.04) + vec3(0.34, 0.13, 0.03) * exp(-d * 5.0), (1.0 - ss(-0.04, 0.03, p.y - far)));
 float blades = noise(vec2(p.x * 9.0 + p.y * 2.0, p.y * 0.7 + 3.0)) + 0.5 * noise(vec2(p.x * 23.0 - p.y * 5.0, 7.0));
 float gust = uCue * exp(-shSq((p.x + 1.1 - 2.2 * (1.0 - uCue)) * 3.0));
 return mix(col, (vec3(0.01, 0.012, 0.012) + vec3(0.3, 0.15, 0.06) * gust + vec3(0.16, 0.06, 0.015) * exp(-d * 4.5)) * (0.4 + blades), (1.0 - ss(-0.12, 0.06, p.y + 0.36 - 0.12 * blades)));
}
vec3 shWind(vec2 p) {
 float px = 0.7 / uRes.y, W = 0.5 * shAsp + 0.3;
 vec2 sun = vec2(min(0.36, 0.5 * shAsp - 0.1), -0.1);
 shCool = vec3(0.45, 0.5, 0.64); shWarm = vec3(1.35, 0.95, 0.64) * (0.85 + 0.3 * uTone); shSun = vec3(0.72, 0.1, -0.6);
 float gust = 4.0 * uCue * (1.0 - uCue), sway = (0.008 + 0.02 * uLow) * sin(uTime * 0.45) + 0.02 * gust;
 shHour();
 vec3 col = shDusk(p, sun);
 float R = min(0.25, 0.36 * shAsp);
 vec2 c = vec2(-min(0.55, 0.5 * shAsp - 0.2), -0.1) + vec2(sway, 0.0);
 if (uOwn[3] > 0.0) R *= 1.0 - 0.3 * uOwn[3];
 if (uOwn[3] < 0.0) { R *= 1.0 - 1.1 * uOwn[3]; c += vec2(0.1, 0.02) * -uOwn[3]; }
 if (uOwn[2] != 0.0 || uOwn[5] != 0.0) {
  float bl = 0.12 * noise(vec2(p.x * 9.0 + p.y * 2.0, p.y * 0.7 + 3.0));
  col = shGround(col, p, p - sun, mix(sun + vec2(-0.05, 0.12), c + vec2(0.06, 0.04), sat(-2.5 * uOwn[3])), max(0.6 * (1.0 - ss(-0.03, 0.02, p.y + 0.2 - 0.02 * sin(p.x * 3.0 + 1.0))), 1.0 - ss(-0.12, 0.06, p.y + 0.36 - bl)));
 }
 float gone = 0.35;
 if (uOwn[4] != 0.0) { shPart = 1.0; gone = uOwn[4] > 0.0 ? mix(0.35, 1.1, uOwn[4]) : mix(0.35, -0.7, -uOwn[4]); }
 col = shField(col, p, sway);
 float drift = uTime * 0.008 + uTravel * 0.008;
 vec4 here = piece(vec2(p.x / (2.0 * W - 0.6) + 0.5, 0.5 - p.y));
 float nearSun = exp(-dot(p - sun, p - sun) * 6.0), ring = uHits * exp(-shSq((length(p + vec2(0.5, 0.1)) - 0.15 - 0.9 * (1.0 - uHits)) * 5.0));
 vec3 fall = mix(shCool, shWarm, nearSun) * (0.05 + 0.3 * nearSun + 0.5 * band(p.y + 0.5) * (0.3 + 0.7 * uEnergy) + 1.2 * ring);
 fall += here.rgb * here.rgb * 0.8 + uKind[2] * uKind[2] * uTexture * 0.7;
 fall *= ss(-0.28, -0.1, p.y);
 for (int i = 0; i < 2; i++) {
  float fi = float(i), cell = 0.15 - 0.05 * fi;
  vec2 g = (p - vec2(mod(drift * (1.0 - 0.4 * fi), 64.0 * cell), 0.02 * shWave(uTime * 0.032 + p.x * 0.5))) / cell, id = floor(g);
  vec2 h = hash22(vec2(mod(id.x, 64.0), id.y) + 7.0 * fi);
  if (h.y < 0.58 - 0.25 * shUp(uOwn[4]) + 0.42 * shUp(-uOwn[4])) continue;
  vec2 d = (fract(g) - 0.5 - (h - 0.5) * 0.5) * rot(0.3 - h.x * 1.2) * (1.7 - 0.8 * fract(h.x * 13.0));
  float m = (1.0 - ss(0.06, 0.2, length(d * vec2(1.0, 1.3 + 0.5 * fi)))) + fi * 0.6 * (1.0 - ss(0.0, 0.03, abs(d.x))) * ss(-0.3, -0.2, d.y) * step(d.y, 0.0);
  col += ss(0.58, 0.95, h.y) * m * fall * (1.0 - 1.6 * shUp(uOwn[2]));
 }
 vec2 q = p - c;
 col = shStem(col, q, R, sway, px, -1.0);
 if (dot(q, q) < R * R * (uOwn[0] == 0.0 && uOwn[6] == 0.0 ? 1.24 : 6.0) || shFR > 0.0) {
 bool mine = shFR == 0.0 || dot(shForm(q), shForm(q)) < 1.2 * R * R;
 col = shHead(col, (mine ? q / R : shFq) + 0.004 * vec2(sin(uTime * 1.1 + p.y * 17.0), sin(uTime * 0.9 + p.x * 15.0)), shTurn(0.8 + 6.0 * shFh * float(!mine) + 0.1 * sin(uTime * 0.03), 0.3 + sway), px / (mine ? R : shFR), gone, uKind[shFk], mine ? uDrone : shFl, uCue); }
 col = shLoose(col, p, c, R, 0.07);
 return shAir(col, p, sun, W, drift, gust, px);
}
vec3 render(vec2 p) {
 shAsp = uRes.x / uRes.y;
 float wet = 0.0, line = 0.0;
 if (uOwn[7] < 0.0) {
  line = -0.6 + 0.4 * -uOwn[7];
  wet = 1.0 - ss(-0.001, 0.001, p.y - line);
  if (wet > 0.0) {
   float e = line - p.y;
   p = vec2(p.x + (0.004 + 0.02 * e) * (0.6 + uLow) * sin(130.0 * e / (0.25 + e) + uTime * 0.8 + 2.0 * sin(p.x * 5.0 + uTime * 0.3)), line + e * 1.15);
  }
 }
 vec3 col = uVar < 0.5 ? shClock(p) : shWind(p);
 if (wet > 0.0) col = mix(col, col * vec3(0.5, 0.56, 0.6) * (1.0 + 0.25 * uHits) + 0.01 * uKind[0], wet);
 return screenOf(col * 1.15);
}
