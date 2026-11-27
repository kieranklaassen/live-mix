// name: Sunflower
// a: Seed dome
// b: Funnel
// what: The piece set out as the seeds of a sunflower head: once round is the loop, from the middle to the rim is the room from back to front, and a seed is as big and bright as the sound there.
// follows: The head turns once a loop so that now is always nearest you, the piece sizes and colours the seeds, the low band sends a swell outward, a hit runs a ring from the middle to the rim.
// own: 0 1 many small seeds, -1 a few great ones; 1 a: 1 swells to a whole ball, -1 lies flat, b: 1 a long narrow well, -1 a wide shallow dish; 2 1 long overlapping petals in place of seeds, -1 emptied cells with walls; 3 the ground: 1 pale paper, -1 a cushion in the texture's colour; 4 1 clear drops, -1 dull striped seeds; 5 the eye: 1 low along it (b: turned to the wall), -1 straight over it (b: close on the far point); 6 1 a ring of ray petals (b: a bright far end), -1 many seeds are gone; 7 1 larger and smaller in turning arms, -1 in rings that run outward
const float GOLD = 1.61803398875;
float SEEDS;                       // seeds on the whole ball (dome), or down the whole funnel
const float DEEP = 3.0;
float SLANT = 2.45, CA = 0.848, SA = 0.53; // the funnel: its length along the wall, how far off its point is, its angle
// Where seed number i sits, each one the golden angle on from the last.
vec3 seedAt(float i, float cone) {
  float ph = TAU * fract(i * (GOLD - 1.0));
  if (cone < 0.5) {
    float zz = 1.0 - (2.0 * i + 1.0) / SEEDS, sr = sqrt(1.0 - zz * zz);
    return vec3(cos(ph) * sr, sin(ph) * sr, zz);
  }
  float s = SLANT * sqrt((i + 0.5) / SEEDS);
  return vec3(cos(ph) * s * SA, sin(ph) * s * SA, DEEP - s * CA);
}
// The seed nearest to p. phi is p's angle round the middle, ic the seed number that would sit at its distance out,
// and q says how many seeds go round there for each one going out (it picks which two spirals to walk along).
float seedNear(vec3 p, float phi, float ic, float q, float last, float cone, out vec3 at) {
  float k = max(2.0, floor(log(sqrt(5.0) * max(q, 1.0)) / log(GOLD * GOLD)));
  float Fk = pow(GOLD, k) / sqrt(5.0);
  vec2 F = vec2(round(Fk), round(Fk * GOLD));
  vec2 dphi = TAU * (fract(F * (GOLD - 1.0) + 0.5) - 0.5);
  mat2 B = mat2(dphi.x, F.x, dphi.y, F.y);
  vec2 c = floor(inverse(B) * vec2(phi, ic));
  float best = 1e3, bi = 0.0;
  at = seedAt(0.0, cone);
  for (int s = 0; s < 4; s++) {
    vec2 o = vec2(float(s & 1), float(s >> 1));
    float i = clamp(dot(F, c + o), 0.0, last);
    vec3 s3 = seedAt(i, cone);
    float d2 = dot(s3 - p, s3 - p);
    if (d2 < best) { best = d2; bi = i; at = s3; }
  }
  return bi;
}
// What another stuff than the plain seed needs of the place: the wall to the next seed, and where on a petal it is.
float sfWall;      // how much nearer this seed is than the next, in gaps
vec3 sfLeaf;       // across the petal (-1 to 1), up it (0 to 1), and 1 where there is one
float sfHold(float i, vec3 at) {
  if (uOwn[6] >= 0.0) return 1.0;
  float n = 0.62 * noise(at * 3.4 + 7.0) + 0.38 * hash11(i * 0.731 + 3.0);
  return 1.0 - smoothstep(0.0, 0.07, n - 1.0 + 0.60 * -uOwn[6]);
}
// The seed nearest to p again, but with its neighbours looked at: for cells, the wall; for petals, the one on top.
float sfNear(vec3 p, float phi, float ic, float q, float last, float cone, float gap, float i0, inout vec3 at) {
  float k = max(2.0, floor(log(sqrt(5.0) * max(q, 1.0)) / log(GOLD * GOLD)));
  float Fk = pow(GOLD, k) / sqrt(5.0), top = 1e6, next = 1e3, best = length(at - p);
  vec2 F = vec2(round(Fk), round(Fk * GOLD));
  vec2 dphi = TAU * (fract(F * (GOLD - 1.0) + 0.5) - 0.5);
  mat2 B = mat2(dphi.x, F.x, dphi.y, F.y);
  vec2 c = floor(inverse(B) * vec2(phi, ic));
  sfLeaf = vec3(0.0); sfWall = 0.0;
  float out_ = i0;
  vec3 was = at;
  bool petals = uOwn[2] > 0.0;
  float len = 0.75 + 1.05 * max(uOwn[2], 0.0), wide = 0.60 + 0.12 * max(uOwn[2], 0.0);
  for (int s = 0; s < 16; s++) {
    vec2 o = vec2(float(s & 3), float(s >> 2)) - 1.0;
    float i = dot(F, c + o);
    if (i < 0.0 || i > last) continue;
    vec3 s3 = seedAt(i, cone), off = p - s3;
    float d = length(off);
    if (i != i0) next = min(next, d);
    if (!petals || i > top) continue;
    float m = max(length(s3.xy), 1e-4);
    vec3 ep = vec3(-s3.y, s3.x, 0.0) / m, er = cone < 0.5 ? vec3(s3.xy / m * s3.z, -m) : vec3(s3.xy / m * SA, -CA);
    float h = hash11(i * 0.37 + 1.0), x = dot(off, ep) / gap + 0.16 * (h - 0.5), y = (dot(off, er) / gap + 0.55) / (len * (0.88 + 0.24 * h) + 0.55);
    if (y < 0.0 || y > 1.0 || d > 3.5 * gap) continue;
    float w = wide * sqrt(y * 1.7) * pow(1.0 - y, 0.55) * 1.35;
    if (abs(x) < w && sfHold(i, s3) > 0.5) { top = i; out_ = i; at = s3; sfLeaf = vec3(x / max(w, 1e-3), y, 1.0); }
  }
  sfWall = max(next - best, 0.0) / gap;
  return out_;
}
vec3 sfPaper(vec2 p) { return vec3(1.46, 1.40, 1.30) * (1.0 - 0.10 * dot(p, p)) * (0.97 + 0.05 * noise(p * 190.0)); }
// The ground round the head.
vec3 sfGround(vec2 p) {
  vec3 c = vec3(0.0);
  if (uOwn[3] > 0.0) {
    vec2 o = (p - vec2(0.07, uVar < 0.5 ? -0.10 : 0.0)) * vec2(1.0, 1.2) / 0.60;
    float d2 = dot(o, o);
    c = sfPaper(p) * (1.0 - 0.55 * exp(-d2 * d2)) * uOwn[3];
  }
  if (uOwn[3] < 0.0) c = -uOwn[3] * uKind[2] * uKind[2] * (0.10 + 0.22 * exp(-dot(p - vec2(-0.4, 0.4), p - vec2(-0.4, 0.4)) * 1.6)) * (0.85 + 0.3 * noise(p * 60.0) * noise(p * 5.0));
  return c;
}
// The light from one point of the head. p is the point in the head's own frame; nw is the way the head faces there,
// in the room, for the lamp. Returns colour, and in a how much of the pixel the seed covers.
vec4 seeds(vec3 p, vec3 nw, float i, vec3 at, float N, float gap, float px, float dim) {
  float v = sqrt((i + 0.5) / N);                           // the middle is the back of the room, the rim the front
  float place = fract(atan(at.y, at.x) / TAU);             // once round is the loop
  float row = mix(0.03, 0.97, v);
  vec4 m = piece(vec2(place, row));
  float join = min(place, 1.0 - place);                    // where the loop's end meets its start, blend the two
  if (join < 0.02) m = mix(0.5 * (piece(vec2(0.004, row)) + piece(vec2(0.996, row))), m, smoothstep(0.0, 0.02, join));
  float loud = sat(m.a * (0.65 + 0.6 * uEnergy));
  float kick = sat(uHits * 1.3) + 0.6 * uCue;
  float ringV = 1.15 * (1.0 - sat(uHits * 1.3));
  float ring = kick * exp(-pow((v - ringV) * 8.0, 2.0));
  float swell = 0.5 + 0.5 * sin(v * 13.0 - uTravel * 1.7), arm = 1.0, hold = 1.0;
  float dress = max(max(abs(uOwn[2]), abs(uOwn[3])), max(abs(uOwn[4]), abs(uOwn[6])));
  if (uOwn[7] != 0.0) {
    float ar = uOwn[7] > 0.0 ? 0.5 + 0.5 * sin(5.0 * atan(at.y, at.x) + 15.0 * v - uTime * 0.21) : 0.5 + 0.5 * sin(27.0 * v - uTime * 0.27);
    arm = mix(1.0, 0.30 + 1.0 * ar * sqrt(ar), abs(uOwn[7]));
  }
  if (uOwn[6] < 0.0) hold = sfHold(i, at);
  float r = gap * (0.13 + 0.42 * pow(loud, 0.6) * (0.88 + 0.24 * uLow * swell) + 0.03 * uLow * swell + 0.2 * ring);
  if (dress > 0.0) { r = max(r, gap * 0.40 * dress * (0.85 + 0.15 * loud + 0.10 * swell * uLow)); r = mix(r, min(r, gap * 0.53), max(abs(uOwn[3]), abs(uOwn[4]))); }
  if (uOwn[7] != 0.0) r = min(r * arm, gap * mix(0.62, 0.51, max(abs(uOwn[3]), abs(uOwn[4]))));
  if (uOwn[6] < 0.0) r = mix(r, min(r, gap * 0.42), min(-uOwn[6] * 4.0, 1.0)) * hold;
  vec3 off = p - at;
  float d = length(off);
  float cover = smoothstep(r + px, r - px, d);
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.4)) * 1.2 : vec3(0.5, 0.42, 0.3);
  vec3 rest = vec3(0.0);
  if (dress > 0.0) {
    rest = mix(uKind[1], uKind[0], sat(0.5 + 0.7 * (v - 0.45) + 0.35 * (hash11(i * 0.613) - 0.5)));
    rest = rest * (0.25 + 0.75 * rest) * 1.15;
    hue = mix(hue, rest, dress * (1.0 - 0.75 * smoothstep(0.0, 0.12, m.a)));
  }
  hue = mix(hue, uKind[4] * 1.3, sat(ring));
  // each seed is a little dome of its own, lit from up and to the left
  float rho = sat(d / max(r, 1e-4));
  vec3 lamp = normalize(vec3(-0.5, 0.75, -0.45));
  float body = sat(dot(nw, lamp) * 0.7 + 0.3);
  float glint = pow(sat(1.0 - length(off.xy / max(r, 1e-4) - vec2(-0.3, 0.35)) * 1.6), 3.0);
  vec3 col = hue * (0.05 + 0.12 * body) * (1.0 - 0.6 * rho * rho);                // a quiet seed: dark, just catching the lamp
  col += hue * loud * (0.5 + 1.3 * loud) * (0.45 + 0.55 * (1.0 - rho * rho)) * (0.3 + 0.7 * body); // a sounding seed glows
  col += vec3(1.0, 0.95, 0.85) * glint * (0.1 + 0.5 * loud + 0.5 * ring) * body;
  col += hue * ring * 0.8;
  col *= cover;
  col += hue * (loud * loud * 0.55 + ring * 0.5) * exp(-max(d - r, 0.0) / gap * 5.0) * (1.0 - cover); // light past the seed's edge
  if (dress > 0.0) {
    // the same seed, or petal, or cell, of another stuff and in a room with light in it
    float mm = max(length(at.xy), 1e-4), cut = SA < 0.0 ? 0.0 : 1.0;
    vec3 ep = vec3(-at.y, at.x, 0.0) / mm, er = uVar < 0.5 ? vec3(at.xy / mm * at.z, -mm) : vec3(at.xy / mm * SA, -CA);
    vec2 q = vec2(dot(off, ep), dot(off, er)) / max(r, 1e-4);
    float clear = max(uOwn[4], 0.0), dull = max(-uOwn[4], 0.0), pale = max(uOwn[3], 0.0);
    float up = off.y / max(r, 1e-4), left = off.x / max(r, 1e-4), cap = sqrt(max(1.0 - rho * rho, 0.0));
    float lit = sat(0.30 + 0.42 * body + 0.34 * (up * 0.8 - left * 0.6) * rho) * (0.55 + 0.45 * cap);
    vec3 under = uOwn[3] < 0.0 ? uKind[2] * uKind[2] * (0.08 + 0.22 * body) * -uOwn[3] : vec3(0.0);
    under = mix(under, vec3(1.35, 1.28, 1.18) * (0.45 + 0.55 * body), pale);
    under = mix(under, rest * (0.15 + 0.5 * body), pale * clear * 0.9);
    under = mix(under, rest * (0.4 + 0.8 * body) + 0.10, pale * dull * 0.55);
    under *= 1.0 - 0.6 * hold * exp(-max(d - r, 0.0) / gap * 5.5);
    vec3 skin = hue * (0.10 + 1.05 * lit) * (0.75 + 0.35 * loud) + hue * hue * loud * loud * 0.5;
    if (dull > 0.0) {
      float st = smoothstep(0.35, 0.75, 0.5 + 0.5 * sin(q.x * 7.5 + 1.5 * hash11(i))), grain = noise(vec2(q.x * 9.0, q.y * 2.5) + i);
      st = mix(st, 0.45, sat(px / r * 5.0 - 0.6)) * (1.0 - 0.8 * max(-uOwn[2], 0.0));
      vec3 hull = mix(hue * 0.22, mix(hue, vec3(1.0), 0.35), st * 0.8) * (0.15 + 0.95 * lit) * (0.85 + 0.25 * grain) * (0.75 + 0.6 * loud);
      skin = mix(skin, hull, dull);
    }
    if (clear > 0.0) {
      float spot = exp(-dot(vec2(left, up) - vec2(-0.36, 0.42), vec2(left, up) - vec2(-0.36, 0.42)) * 22.0), far = exp(-dot(vec2(left, up) - vec2(0.35, -0.42), vec2(left, up) - vec2(0.35, -0.42)) * 4.0);
      vec3 drop = hue * (0.10 + 0.22 * body + 0.5 * loud) * (0.5 + 0.5 * rho * rho) + hue * far * (0.65 + 0.8 * loud) * (0.4 + 0.6 * body) + mix(hue, vec3(1.0), 0.4) * 0.30 * pow(rho, 8.0);
      drop = mix(drop, (hue * 0.95 + 0.02) * (0.55 + 0.6 * far + 0.5 * loud) * (1.0 - 0.55 * pow(rho, 7.0)), pale) + vec3(1.0, 0.97, 0.92) * spot * (0.9 + 0.6 * uHigh);
      skin = mix(skin, drop, clear);
    }
    skin += hue * ring * 0.7;
    vec3 alt = mix(under, skin, cover) + (hue * (loud * loud * 0.25 + ring * 0.5) * exp(-max(d - r, 0.0) / gap * 5.0) * (1.0 - cover)) * (1.0 - 0.8 * pale);
    float all = cover;
    if (uOwn[2] > 0.0) {
      float x = sfLeaf.x, y = sfLeaf.y, rib = exp(-x * x * 60.0), vein = 0.5 + 0.5 * sin(x * 17.0 + y * 3.0);
      float turn = sat(0.5 + 0.5 * dot(normalize(ep * x * 0.9 + er * (0.35 - 0.5 * y) + nw * 0.9), lamp));
      vec3 tip = mix(hue, mix(hue, vec3(1.0, 0.96, 0.9), 0.26), smoothstep(0.55, 1.0, y) * 0.8 + 0.12 * smoothstep(0.75, 1.0, abs(x)));
      vec3 leaf = tip * (0.06 + 0.94 * smoothstep(0.0, 0.85, y)) * (0.18 + 0.95 * turn * turn) * (0.45 + 0.65 * body) * (0.85 + 0.12 * vein + 0.12 * rib) * (0.70 + 0.55 * loud) * (0.45 + 0.55 * arm);
      if (dull > 0.0) leaf = mix(leaf, leaf * (0.55 + 0.75 * step(0.5, fract(x * 2.5 + 0.25))), dull);
      if (clear > 0.0) leaf = mix(leaf, leaf * 0.75 + tip * (0.10 + 0.35 * pow(abs(x), 4.0) + 0.3 * loud), clear);
      leaf += tip * (loud * loud * 0.28 + ring * 0.55) * y;
      float w = smoothstep(0.0, 0.4, uOwn[2]);
      alt = mix(alt, sfLeaf.z > 0.5 ? leaf : under * 0.5 + hue * 0.12 * body, w); all = mix(all, max(sfLeaf.z, 0.0), w);
    }
    if (uOwn[2] < 0.0) {
      float e = px / gap, open = 0.20 * (2.0 - hold), wall = 1.0 - smoothstep(open - 0.06 - e, open + 0.04 + e, sfWall), lip = smoothstep(open + 0.20, open, sfWall);
      float deep = sat(0.35 + 0.5 * (left * 0.6 - up * 0.8) * (r / gap) * 2.2);
      vec3 wax = mix(rest, hue, 0.4) * (0.22 + 0.9 * body) * (0.75 + 0.25 * smoothstep(0.0, 0.15, sfWall)) + under * 0.25;
      vec3 pit = hue * (0.05 + 0.35 * deep * body) + hue * loud * (0.35 + 0.9 * loud) * (0.4 + 0.6 * deep) + wax * lip * 0.28;
      if (clear > 0.0) pit += clear * (hue * 0.25 + vec3(1.0, 0.95, 0.85) * exp(-dot(vec2(left, up) - vec2(-0.4, 0.5), vec2(left, up) - vec2(-0.4, 0.5)) * 14.0));
      if (dull > 0.0) pit = mix(pit, pit * 0.25 + skin * cover * 0.9, dull);
      pit += hue * ring * 0.6;
      alt = mix(alt, mix(pit * (0.4 + 0.6 * arm), wax, wall), smoothstep(0.0, 0.4, -uOwn[2])); all = mix(all, 1.0, smoothstep(0.0, 0.4, -uOwn[2]));
    }
    float kn = kick * (0.16 + 0.10 * hash11(i * 0.517)) + 0.5 * ring;
    alt = mix(alt * (1.0 + kn), mix(alt, uKind[4] * (0.25 + 0.6 * body), all * sat(kn * 1.3)), pale);
    alt *= mix(dim, sqrt(dim), 0.5);
    return vec4(mix(col * dim, alt, smoothstep(0.0, 0.6, dress)), all);
  }
  return vec4(col * dim, cover);
}
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  vec3 at;
  if (uVar < 0.5) {
    // a: a shallow dome leaning toward us, seen from a little above its rim
    float spin = PI * 0.5 - TAU * uLoop;
    float ball = max(uOwn[1], 0.0), flat_ = max(-uOwn[1], 0.0), stand = 0.86 + (uOwn[5] > 0.0 ? 0.44 * uOwn[5] : 0.80 * uOwn[5]);
    float tau = stand + 0.05 * sin(uTime * 0.13);
    vec3 a = vec3(0.0, sin(tau), -cos(tau)), e1 = vec3(1.0, 0.0, 0.0), e2 = vec3(0.0, -cos(tau), -sin(tau));
    vec3 ro = vec3(0.0, 0.72, -3.0), rd = normalize(vec3(p.x, p.y - 0.1, 3.0));
    if (uOwn[1] != 0.0 || uOwn[5] != 0.0 || uOwn[6] > 0.0) {
      float over = max(-uOwn[5], 0.0), low = max(uOwn[5], 0.0), k = (1.0 + 1.35 * ball * (2.0 - ball) - 0.50 * flat_) * (1.0 + 0.18 * over * (1.0 - ball) - 0.25 * low) * (1.0 + 0.56 * max(uOwn[6], 0.0)), w = 1.0 - ball;
      float cy = 0.1485 + 0.05 * max(uOwn[6], 0.0) - 0.1485 * max(max(ball, flat_), over) * (1.0 - low);
      ro.y = w * sin(stand) - (cy - 0.1) * k * (3.0 - w * cos(stand)) / 3.0;
      rd = normalize(vec3(p.x * k, (p.y - 0.1) * k, 3.0));
    }
    float b = dot(ro, rd), c = dot(ro, ro) - 1.0, h = b * b - c;
    float ends = 1.0;                                      // the ball's own outline, not a step
    if (uOwn[1] > 0.0 || uOwn[3] != 0.0) ends = smoothstep(0.0, max(2.0 * fwidth(h), 1e-4), h);
    if (h < 0.0) return uOwn[3] != 0.0 ? screenOf(sfGround(p) * 1.3) : col;
    float t = -b - sqrt(h);
    vec3 pw = ro + rd * t;
    vec3 pl = vec3(dot(pw, e1), dot(pw, e2), dot(pw, a));
    float capZ = 0.86 - 1.32 * ball + 0.115 * flat_;                                     // the dome is the top of the ball down to here
    SEEDS = 13000.0;
    if (uOwn[0] != 0.0 || uOwn[1] != 0.0) SEEDS = floor(SEEDS * exp2(2.3 * uOwn[0] * (uOwn[0] > 0.0 ? 0.75 : 1.0)) * (0.14 / (1.0 - capZ)));
    float N = floor(SEEDS * (1.0 - capZ) * 0.5);
    float edge = pl.z - capZ;
    vec3 around = uOwn[3] != 0.0 ? sfGround(p) : vec3(0.0);
    float rim = 0.0;
    vec3 ray = vec3(0.0);
    if (uOwn[6] > 0.0) {
      // two rows of ray petals round the rim
      float full = acos(clamp(capZ, -1.0, 1.0)), away = acos(clamp(pl.z, -1.0, 1.0)) / full - 1.0, an = atan(pl.y, pl.x + 1e-6) + spin * 0.0;
      vec2 turned = rot(spin) * pl.xy;
      an = atan(turned.y, turned.x + 1e-6);
      for (int k = 0; k < 3; k++) {
        float fk = float(k), n = 21.0 - 2.0 * fk, u = an / TAU * n + 0.37 * fk, id = mod(floor(u), n), h1 = hash11(id + 37.0 * fk), x = fract(u) - 0.5 + 0.22 * (h1 - 0.5);
        float y = (away + 0.10) / ((0.50 + 0.10 * fk + 0.16 * h1) * uOwn[6]);
        if (y < 0.0 || y > 1.0) continue;
        float w = (0.46 - 0.04 * fk) * sqrt(sat(y * 4.0)) * pow(1.0 - y, 0.5) * 1.15, q = x / max(w, 1e-3), aa = 0.02 + 0.03 * h1;
        float a = smoothstep(1.0, 1.0 - aa * 2.0, abs(q));
        vec4 m = piece(vec2(fract(an / TAU), 0.93));
        vec3 hue = mix(uKind[3], m.a > 0.004 ? m.rgb / m.a : uKind[3], 0.2 * sat(m.a));
        hue = hue * (0.3 + 0.7 * hue) * (0.75 + 0.5 * h1);
        vec3 c = hue * (0.22 + 0.78 * smoothstep(0.0, 0.6, y)) * (0.42 + 0.58 * sat(dot(pw, vec3(-0.45, 0.75, -0.48)) * 0.7 + 0.35 - 0.25 * q)) * (0.82 + 0.18 * sin(q * 12.0)) * (1.15 + 0.35 * uPad + 0.3 * uHits) * (1.05 - 0.24 * fk);
        ray = mix(c, ray, rim); rim = max(rim, a);
      }
    }
    if (edge < -0.03) return uOwn[3] != 0.0 || uOwn[6] > 0.0 ? screenOf(mix(around, ray, rim) * 1.3) : col;
    pl.xy = rot(spin) * pl.xy;
    float px = length(fwidth(pl)) * 0.75;
    float fog = exp(-(t - 2.2) * 1.6);
    float i = seedNear(pl, atan(pl.y, pl.x), (1.0 - pl.z) * SEEDS * 0.5 - 0.5, PI * SEEDS * (1.0 - pl.z * pl.z), N - 1.0, 0.0, at);
    float gap = sqrt(4.0 * PI / SEEDS);
    if (uOwn[2] != 0.0) i = sfNear(pl, atan(pl.y, pl.x), (1.0 - pl.z) * SEEDS * 0.5 - 0.5, PI * SEEDS * (1.0 - pl.z * pl.z), N - 1.0, 0.0, gap, i, at);
    vec4 s = seeds(pl, pw, i, at, N, gap, px, fog);
    col = s.rgb * smoothstep(-0.004, 0.004, edge);
    if (uOwn[1] != 0.0 || uOwn[3] != 0.0 || uOwn[6] > 0.0) col = mix(mix(around, ray, rim), s.rgb, smoothstep(-0.004, 0.004, edge / (1.0 - 0.85 * flat_)));
    if (ends < 1.0) col = mix(around, col, ends);
    return screenOf(col * 1.3);
  }
  // b: the same seeds down the inside of a funnel; we look in from its mouth, and the back of the room is far off at its point
  float spin = -PI * 0.5 - TAU * uLoop;
  SEEDS = 1700.0;
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[5] > 0.0) {
    float an = 0.5586 - 0.33 * max(uOwn[1], 0.0) + 0.66 * max(-uOwn[1], 0.0), more = 1.0 + 0.35 * abs(uOwn[1]) + 0.9 * max(uOwn[5], 0.0);
    if (uOwn[1] != 0.0) { SA = sin(an); CA = cos(an); }
    SLANT = 2.45 * more;
    SEEDS = floor(SEEDS * exp2(2.0 * uOwn[0] * (uOwn[0] > 0.0 ? 0.85 : 1.0)) * more * more * SA / 0.53);
  }
  vec2 sway = 0.035 * vec2(sin(uTime * 0.13), cos(uTime * 0.1));
  vec3 rd = normalize(vec3(p + sway, 0.9));
  if (uOwn[5] != 0.0) {
    rd = normalize(vec3(p + sway, 0.9 + 0.9 * max(-uOwn[5], 0.0)));
    rd.yz = rot(0.46 * max(uOwn[5], 0.0)) * rd.yz;
    rd.xy = rot(0.5 * max(uOwn[5], 0.0)) * rd.xy;
  }
  float ta = SA / CA;
  float t = ta * DEEP / max(length(rd.xy) + ta * rd.z, 0.02);
  vec3 pw = rd * t;
  float s = (DEEP - pw.z) / CA;                            // how far up the wall from the point
  vec3 pl = pw; pl.xy = rot(spin) * pl.xy;
  float phi = atan(pl.y, pl.x);
  vec3 nw = vec3(-CA * normalize(pw.xy + 1e-5), -SA);      // the wall faces the middle and us
  float ic = SEEDS * (s / SLANT) * (s / SLANT) - 0.5;
  float px = length(fwidth(pw)) * 0.75;
  float i = seedNear(pl, phi, ic, 4.0 * PI * SA * (ic + 0.5), SEEDS - 1.0, 1.0, at);
  float gap = sqrt(PI * SLANT * SLANT * SA / SEEDS);
  float fog = exp(-(t - 1.0) * 0.55);
  if (uOwn[2] != 0.0) i = sfNear(pl, phi, ic, 4.0 * PI * SA * (ic + 0.5), SEEDS - 1.0, 1.0, gap, i, at);
  // the lamp is at the mouth, up and to the left; the facing is bent a little so the far wall still takes some of it
  vec4 sd = seeds(pl, normalize(nw + vec3(-0.3, 0.5, -0.6)), i, at, SEEDS, gap, px, fog);
  col = sd.rgb;
  if (uOwn[3] > 0.0) col = mix(col, sfPaper(p) * (0.75 + 0.25 * fog), uOwn[3] * smoothstep(0.85, 1.15, s / SLANT));
  if (uOwn[6] > 0.0) {
    float end = s / SLANT, gl = uOwn[6];
    vec3 sky = mix(uKind[1], vec3(1.0, 0.97, 0.9), 0.55) * (0.75 + 0.35 * uLevel + 0.4 * uPad);
    col += gl * sky * (0.45 * exp(-end * 5.0) + 0.6 * exp(-end * 16.0));
    col = mix(col, sky * 1.25, gl * smoothstep(0.075, 0.060, end));
  }
  // a small light at the far point, where the back of the room is
  col += (uKind[0] * (0.3 + uDrone) + uKind[1] * uPad + uKind[4] * (sat(uHits * 1.3) + uCue)) * 0.05 * exp(-length(p + sway) * 30.0);
  return screenOf(col * 1.3);
}
