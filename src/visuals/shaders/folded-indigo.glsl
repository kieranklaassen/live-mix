// name: Folded dye
// a: Clamped triangles
// b: Stitched rings
// what: A white cotton sheet opened after dyeing: it was folded to a triangle and clamped, so feathered indigo stars and bands repeat over it round white hearts, its creases catching a low light; or a sheet bound and stitched, then let down into the vat: one large pleated disc of rings, small ones beside it, rows of dots around it.
// follows: Drone and pad soak in from their own folds, or climb the sheet. Texture and voice fray the edges; phrase and keys draw rings or fill the dots. Sixteen bands set the feathers along each fold, or the rings from the middle out. A hit drops dye that spreads and fades; a cue eases the folds and deepens their shadows. The piece darkens the cloth in its places.
float fiGain, fiPx, fiSoft;             // how strongly it answers, the size of a pixel, how far a dyed edge blurs
vec2 fiLamp;                            // where the low lamp stands
vec3 fiInk;                             // what the dye takes out of white, for one measure of it
vec3 fiTint(int k) { return mix(fiInk, (1.0 - uKind[k]) * 2.0 + 0.3, 0.2); }
// From 0 at a to 1 at b, whichever is the greater.
float fiS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float fiRoot(float x) { return sqrt(max(x, 0.0)); }
// The threads of the cloth at q: x how raised, y the unevenness of warp and weft, each thread its own.
vec2 fiWeave(vec2 q) {
  vec2 g = q * 130.0, c = floor(g), f = g - c - 0.5;
  float up = mod(c.x + c.y, 2.0);
  vec2 r = 1.0 - 4.0 * f * f;
  float rise = mix(r.y * (0.75 + 0.25 * r.x), r.x * (0.75 + 0.25 * r.y), up);
  float s = noise(vec2(q.x * 130.0, q.y * 6.0)) + noise(vec2(q.x * 6.0 + 40.0, q.y * 130.0));
  return vec2((rise - 0.62) * fiS(0.38, 0.1, 130.0 * fiPx), s - 1.0);
}
// White cotton with this much taken out, under a low lamp from the upper left.
vec3 fiCloth(vec2 p, vec2 weave, vec3 taken, float lit) {
  vec3 cotton = vec3(0.925, 0.912, 0.88) * (1.0 + 0.02 * weave.y);
  vec3 col = cotton * exp(-taken * (1.0 + 0.3 * weave.y + 0.1 * weave.x));
  float fall = 0.99 - 0.1 * dot(p, vec2(0.6, -0.75));
  float shade = fall + lit + 0.07 * weave.x;
  return col * mix(vec3(0.78, 0.84, 0.95), vec3(1.0), sat(shade)) * shade;
}
// How much dye lies at distance d from where it came in, having reached r: deep at first, thin further on, and a tide mark.
float fiSoak(float d, float r, float soft) {
  float s = r - d;
  float body = fiS(-soft, soft, s) * (0.3 + 0.7 * sat(s / (r + 0.02)));
  float mark = (s - soft) / (soft * 0.8);
  return body + 0.16 * exp(-mark * mark);
}
// a: the sheet opened from a stack of triangles.
vec3 fiTriangles(vec2 p) {
  vec2 q = rot(0.12) * p;
  vec2 weave = fiWeave(q);
  vec2 f = q + 0.07 * vec2(sin(uTravel * 0.041), cos(uTravel * 0.033)) + vec2(0.03, 0.05);
  vec2 bend = vec2(noise(q * 2.3), noise(q * 2.3 + 17.0)) - 0.5;
  f += bend * 0.03;
  const float H = 0.37;
  const vec2 N0 = vec2(0.0, 1.0), N1 = vec2(-0.8660254, -0.5), N2 = vec2(0.8660254, -0.5);
  vec3 c = vec3(dot(f, N0), dot(f, N1), dot(f, N2)) / H;
  vec3 id = floor(c), fr = c - id;
  float down = step(1.5, fr.x + fr.y + fr.z);
  vec3 b = mix(fr, 1.0 - fr, down);       // how near each corner of the triangle, summing to 1
  float m = mod(id.x - id.y + 3.0, 3.0), k = mod(m + mix(1.0, 2.0, down), 3.0);
  // put the corners in the order of the stack, so neighbours mirror each other
  vec3 w;
  vec3 kinds = mod(vec3(k, m + mix(2.0, 1.0, down), m) + 0.5, 3.0);
  w.x = dot(b, step(kinds, vec3(1.0)));
  w.y = dot(b, step(vec3(1.0), kinds) * step(kinds, vec3(2.0)));
  w.z = 1.0 - w.x - w.y;
  // each triangle is a layer of its own: outer layers drank more, and lay a little crooked
  vec3 h = vec3(hash21(id.xy + down * 7.7), hash21(id.yz + 3.1 + down * 5.3), hash21(id.zx + 9.4 + down * 2.9));
  vec2 mid = (N0 * (id.x + mix(0.333, 0.667, down)) + N1 * (id.y + mix(0.333, 0.667, down)) + N2 * (id.z + mix(0.333, 0.667, down))) * H * 0.6667;
  float broad = noise(mid * 1.7 + 4.0);
  float near_ = fiS(0.0, 2.5 * fiPx, min(min(b.x, b.y), b.z) * H);   // the change from layer to layer falls in the crease
  h = mix(vec3(0.5), h, near_);
  float layer = 0.5 + 0.4 * h.x + 0.9 * (broad - 0.5) - 0.25 * dot(p, vec2(-0.5, 0.8));
  vec4 here = piece(vec2(mid.x / 1.9 + 0.5, 0.5 - mid.y * 0.9));
  layer = max(layer + 0.4 * here.a * fiGain, 0.15);
  float open = 4.0 * uCue * (1.0 - uCue);
  w += (h - dot(h, vec3(0.3333))) * 0.05 + open * vec3(0.05, -0.03, -0.02) * (2.0 * down - 1.0);
  w = max(w, 0.0);
  float hair = noise(vec2(q.x * 70.0, q.y * 9.0)) + noise(vec2(q.x * 9.0, q.y * 70.0)) - 1.0;
  float blot = noise(q * 9.0) - 0.5;
  float rough = hair * (0.03 + 0.07 * fiRoot(max(uTexture, uMic)) * fiGain) + blot * 0.07;
  float ma = 0.5 + 0.5 * sin(uTravel * 0.017 + 0.6), mb = 0.5 + 0.5 * sin(uTravel * 0.013 + 2.6);
  // sixteen feathers along each edge
  float u = w.y / (w.y + w.z + 1e-4), fx = u * 15.999, ff = fract(fx) * 2.0 - 1.0;
  float feather = (0.02 + 0.2 * uBands[int(clamp(fx, 0.0, 15.0))] * fiGain) * (1.0 - ff * ff);
  // the three dips
  vec3 taken = vec3(0.0);
  float r0 = (0.07 + 0.3 * fiRoot(uDrone) * fiGain) * layer + feather;
  float r1 = (0.02 + 0.03 * mb + 0.3 * fiRoot(uPad) * fiGain) * layer + feather * 0.5;
  taken += fiTint(0) * fiSoak(w.x + rough, r0, fiSoft) * (0.28 + 0.75 * fiRoot(uDrone)) * layer;
  taken += fiTint(1) * fiSoak(w.y + rough, r1, fiSoft) * (0.14 + 0.75 * fiRoot(uPad)) * layer;
  // the corners, dipped deepest: starbursts
  float da = sqrt(w.y * w.y + w.y * w.z + w.z * w.z), dc = sqrt(w.x * w.x + w.x * w.y + w.y * w.y);
  float arms = 0.5 + 0.5 * cos(u * TAU * 3.0);
  arms *= arms;
  float rs = (0.2 + 0.12 * ma + 0.22 * fiRoot(uLevel)) * (0.5 + 0.5 * arms) * (0.6 + 0.5 * layer);
  taken += fiInk * fiSoak(da + rough * 1.3, rs, fiSoft) * (0.4 + 0.9 * fiRoot(uDrone)) * layer;
  float lines = 0.5 + 0.5 * cos((dc + rough * 0.25) * 62.0);
  lines *= lines;
  float rings = fiS(0.52, 0.4, dc), ph = fiRoot(max(uPhrase, 0.8 * uKeys)) * fiGain;
  taken += fiTint(3) * rings * ((lines - 0.45) * 0.9 * ph + 0.05 * lines) * layer;
  // the clamped board keeps the middle white
  float heart = min(w.x, min(w.y, w.z)) + rough * 0.5;
  float held = fiS(0.1 - fiSoft, 0.1 + fiSoft, heart - 0.07 * h.z);
  taken = max(taken, 0.0) * (1.0 - 0.9 * held);
  // a drop on every white heart, strongest near one wandering place
  vec2 at = vec2(0.45 * sin(uTime * 0.13), 0.2 * cos(uTime * 0.17));
  float near = 0.12 + 0.88 * exp(-dot(p - at, p - at) * 7.0);
  float dh = length(b - 0.3333) * 0.816;
  vec3 ray = abs(b - 0.3333);
  dh *= 1.25 - 0.9 * (max(ray.x, max(ray.y, ray.z)) / (ray.x + ray.y + ray.z + 1e-4) - 0.5) * 2.0 * fiRoot(1.0 - uHits);
  taken += (fiTint(4) + fiInk) * uHits * near * fiSoak(dh + rough * 1.6, 0.12 + 0.2 * fiRoot(1.0 - uHits), fiSoft * 1.5) * 0.6;
  // creases under the raking light
  vec3 e = min(fr, 1.0 - fr) * H, sg = sign(fr - 0.5) * (1.0 - 2.0 * mod(id + step(0.5, fr), 2.0));
  vec3 tilt = sg * exp(-e / 0.03) * vec3(dot(N0, fiLamp), dot(N1, fiLamp), dot(N2, fiLamp)) * vec3(0.16, 0.1, 0.1);
  float lit = (tilt.x + tilt.y + tilt.z) * (1.0 + 1.3 * uCue) + (h.y - 0.5) * 0.04;
  vec3 ridge = exp(-e * e / (2e-6 + 3.0 * fiPx * fiPx));
  lit += dot(ridge, vec3(0.1, 0.06, 0.06)) * (1.0 + uCue * 2.0);
  lit += 0.5 * (noise(q * 4.0) - noise(q * 4.0 + fiLamp * 0.12)) + 0.2 * (noise(q * 11.0) - noise(q * 11.0 + fiLamp * 0.2));
  return fiCloth(p, weave, taken, lit);
}
// b: the sheet that was gathered up, bound and stitched.
// The pleats gathered to a binding, seen in direction d: x which are raised, y the same a little further round.
vec2 fiPleats(vec2 d, float n, float seed) {
  vec2 e = d + 0.22 / n * vec2(-d.y, d.x);
  float a = noise(d * n + seed), b = noise(e * n + seed);
  float a2 = noise(d * n * 2.7 + seed + 9.0), b2 = noise(e * n * 2.7 + seed + 9.0);
  return vec2(a * 0.65 + a2 * 0.35, b * 0.65 + b2 * 0.35);
}
vec3 fiRings(vec2 p) {
  vec2 q = rot(-0.07) * p;
  vec2 weave = fiWeave(q);
  vec2 bend = vec2(noise(q * 2.1), noise(q * 2.1 + 17.0)) - 0.5;
  float hair = noise(vec2(q.x * 70.0, q.y * 9.0)) + noise(vec2(q.x * 9.0, q.y * 70.0)) - 1.0;
  float blot = noise(q * 8.0) - 0.5;
  float open = 4.0 * uCue * (1.0 - uCue), thready = 0.3 + 0.9 * fiRoot(max(uTexture, uMic)) * fiGain;
  float lit = 0.5 * (noise(q * 4.0) - noise(q * 4.0 + fiLamp * 0.12)) + 0.25 * (noise(q * 11.0) - noise(q * 11.0 + fiLamp * 0.2));
  // the sheet was let down into the vat: deep at the foot, pale at the top, each dip with its own edge
  float y = q.y + 0.5 - 0.16 * q.x + bend.x * 0.12 + (hair * 0.02 + weave.y * 0.03) * thready + blot * 0.04 + 0.02 * sin(uTravel * 0.03);
  float g0 = 0.24 + 0.36 * fiRoot(uDrone) * fiGain, g1 = 0.3 + 0.42 * fiRoot(uPad) * fiGain;
  vec4 here = piece(vec2(q.x / 1.9 + 0.5, 0.5 - q.y * 0.9));
  vec3 ground = fiTint(0) * (0.06 + fiSoak(y, g0, 0.4 * fiSoft + 0.02) * (0.26 + 0.5 * fiRoot(uDrone)) + 0.2 * here.a * fiGain);
  ground += fiTint(1) * fiSoak(y, g1, 0.4 * fiSoft + 0.03) * (0.1 + 0.36 * fiRoot(uPad));
  // which binding are we in: one of the few large ones, or a small one of the rows that go round the largest
  float wide = min(1.0, uRes.x / uRes.y / 1.78), tall = 1.0 - wide;
  vec2 f = q + bend * 0.03;
  vec3 large[4] = vec3[4](vec3(-0.36 * wide, -0.03 - 0.1 * tall, mix(0.25, 0.33, wide)), vec3(0.56 * wide, 0.2 + 0.18 * tall, 0.145), vec3(0.4 * wide + 0.06 * tall, -0.24 - 0.3 * tall, 0.085), vec3(0.72 * wide, -0.1 + 0.22 * tall, mix(0.018, 0.055, wide)));
  vec2 x = f - large[0].xy, o = large[0].xy;
  float R = large[0].z, big = 1.0, seed = 3.0, tone = 0.0, ro = length(x), there = 1.0;
  if (ro > R * 1.3) {
    float rad0 = R + 0.135, row = floor((ro - rad0) / 0.078 + 0.5), rad = rad0 + 0.078 * row, many = floor(TAU * rad / 0.082);
    float a = atan(x.y, x.x) / TAU * many, ac = floor(a);
    vec2 h = hash22(vec2(mod(ac, many), row) + 5.0);
    float am = (ac + 0.5 + (h.x - 0.5) * 0.14) / many * TAU;
    vec2 mid = o + (rad + (h.y - 0.5) * 0.008) * vec2(cos(am), sin(am));
    there = step(-0.5, row) * step(row, 2.5) * step(h.y, 0.97);
    x = f - mid; R = 0.023 + 0.004 * h.x; seed = h.x * 60.0 + 40.0; big = 0.0; tone = fract(h.y * 13.0);
    for (int i = 1; i < 4; i++) {
      there *= step(large[i].z * 1.3 + 0.03, length(mid - large[i].xy));
      if (length(f - large[i].xy) < large[i].z * 1.3) { x = f - large[i].xy; R = large[i].z; seed = 21.0 + float(i) * 13.0; big = 0.15 + 3.0 * R; there = 1.0; break; }
    }
  }
  bool small = big <= 0.0;
  float r = length(x), n = small ? 1.6 : mix(3.2, 5.5, big), far = r / R;
  if (small) far = mix(far, (abs(x.x + x.y * 0.2) + abs(x.y)) / R, 0.45) * 0.92;
  float edge = fiS(1.3, 1.0, far) * there;
  vec2 d = x / max(r, 1e-4);
  vec2 pl = fiPleats(d, n, seed);
  float tooth = (pl.x - 0.5) * (1.0 - 0.35 * open), rr = far * (1.0 + tooth * 0.22) + (hair * 0.02 + weave.y * 0.02) * big * thready;
  float in_ = fiS(1.02, small ? 0.7 : 0.9, rr) * there;
  float M = big > 0.8 ? 8.0 : big > 0.5 ? 5.0 : 3.0;
  float pos = rr * M - 0.25, gap = abs(fract(pos) - 0.5) * 2.0;
  // dye crept in between the bindings, most along the raised pleats; the sixteen bands lie from the middle out
  float b = band(sat(small ? tone : rr));
  float creep = 0.12 + 0.05 * sin(uTime * 0.23 - rr * 5.0 + seed) + 0.3 * fiRoot(uPad) + 0.5 * b * fiGain + 0.25 * fiRoot(uPhrase);
  float up = fiS(0.3, 0.72, pl.x + 0.12 * blot);
  float stain = fiS(0.43 - 7.0 * fiSoft, 0.43 + 7.0 * fiSoft, creep * (0.5 + 0.55 * up) * (small ? 1.0 : 0.75 + 0.35 * big) + 0.32 - min(gap, 0.84) * 0.85);
  float fade = 0.45 + 0.55 * fiS(0.1, 1.0, rr);
  vec3 ringInk = (fiInk * (0.12 + 0.5 * creep) + fiTint(3) * (0.1 + 0.6 * fiRoot(uPhrase)) * up) * stain * fade * fiS(0.1, 0.17, rr + 0.2 * (1.0 - big));
  if (small) ringInk = fiInk * fiS(0.14 + 0.3 * creep, 0.02 + 0.2 * creep, rr) * (0.35 + 0.8 * creep + uKeys);
  else {
    float wave = (rr - (1.05 - uHits)) * 5.0;
    ringInk += fiTint(4) * uHits * exp(-wave * wave) * (0.3 + up);
  }
  // dye pooled against the outer binding
  ground *= 1.0 + edge * (0.25 + 1.4 * tooth) * mix(0.6, 1.4, uSpace);
  ground += fiInk * 0.16 * edge * (0.4 + up);
  vec3 taken = mix(ground, ringInk + ground * 0.1, in_);
  // light on the pleats and on the little hill that stays where it was bound
  float turn = dot(vec2(-d.y, d.x), fiLamp), gather = edge * fiS(0.0, 0.2, rr);
  lit += (pl.x - pl.y) * turn * gather * mix(0.25, 1.0, big) * (1.0 + 1.2 * uCue);
  lit += dot(d, fiLamp) * gather * sat(0.3 + 2.0 * big) * (0.12 * exp(-far * far) + 0.07 * (fract(pos) - 0.5) * in_);
  return fiCloth(p, weave, max(taken, 0.0), lit);
}
vec3 render(vec2 p) {
  float lamp = 2.27 + 0.45 * sin(uTravel * 0.05);
  fiLamp = vec2(cos(lamp), sin(lamp));
  fiGain = 0.75 + 0.55 * uEnergy; fiPx = 1.0 / uRes.y; fiSoft = mix(0.05, 0.018, uTone) * mix(0.8, 1.2, uSpace); fiInk = vec3(1.95, 1.3, 0.7);
  return uVar < 0.5 ? fiTriangles(p) : fiRings(p);
}
