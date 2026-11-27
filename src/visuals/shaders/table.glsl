// name: Table
// a: Wood
// b: Cloth
// what: A table seen from straight above, to lay gear on: dark boards under one warm lamp, or the same table under a woven cloth. It stays quiet on purpose, so that what lies on it is what is looked at.
// follows: The lamp breathes with the mix and takes a little of the colour of what sounds; the piece glows along the far edge of the table, brightest at the place now playing; a hit or a cue sends one soft ring of light out from under the lamp; Glow turns the lamp up.
// own: 0 1 many thin boards (b: fine threads in narrow stripes), -1 a few great ones (b: a coarse sack weave close up); 1 1 cut into square blocks with their year rings (b: patchwork, sewn and puffed), -1 chevrons; 2 1 pale scrubbed wood (b: white linen), -1 stone with veins (b: thick felt); 3 1 painted in the colours of the sounds, board by board or patch by patch, -1 the piece soaks over the whole table as stains; 4 1 daylight through a window, its bars lying across, -1 coins of sun under moving leaves; 5 1 a round table on a floor (b: the cloth hangs in folds), -1 seen along, going away from you; 6 1 old: cracks, knots and wide gaps (b: deep creases), -1 wet, with drops lying on it; 7 1 a lattice of round studs lit by the piece, -1 five bowls, one for each kind of sound

// The colour of what sounds now: each kind's colour by how loud it is, white where nothing sounds.
vec3 tbSound() {
  float sum = uDrone + uPad + uTexture + uPhrase + uHits;
  vec3 c = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  c /= max(sum, 0.001);
  c /= max(max(c.r, max(c.g, c.b)), 0.2);
  return mix(vec3(1.0), c, sat(sum * 1.4));
}
// The piece as it lies along the far edge: every sound at this place in the loop together, a little smeared.
vec4 tbEdge(float x) {
  vec4 m = vec4(0.0);
  for (int i = 0; i < 5; i++) {
    float y = (float(i) + 0.5) / 5.0;
    m += piece(vec2(x, y)) * 0.5 + 0.25 * (piece(vec2(x - 0.02, y)) + piece(vec2(x + 0.02, y)));
  }
  return m / 5.0;
}
// A ring of light going out as `fall` goes from 1 to nothing.
float tbRing(float d, float fall) {
  float x = (d - (1.0 - fall) * 1.25) / 0.09;
  return exp(-x * x) * fall * fall;
}

// What the numbers add to the plain table.
float tbPx;        // one pixel of the screen in the table's lengths
vec2 tbSlope;      // how the surface leans here
// A colour as a surface has it.
vec3 tbDye(vec3 c) { return c * c; }
// Folds and creases of a cloth that was not smoothed out.
float tbFold(vec2 p) {
  vec2 w = p + 0.3 * vec2(noise(p * 1.7 + 3.0), noise(p * 1.7 + 17.0));
  float a = noise(w * vec2(2.1, 1.3) + 5.0), b = noise(rot(0.9) * w * vec2(4.2, 1.9) + 11.0), c = noise(rot(-0.7) * w * vec2(6.4, 3.0) + 2.0);
  vec3 f = 2.0 * vec3(a, b, c) - 1.0;
  f = 1.02 - sqrt(f * f + vec3(0.003, 0.006, 0.012)); a = f.x; b = f.y; c = f.z;
  return 0.15 * a * a + 0.075 * b * b * (0.4 + a) + 0.03 * c * c;
}
// Drops lying on it: how deep the water is (0 none), which way it leans, and how big the drop.
vec4 tbDrops(vec2 p, float k, float many, float seed) {
  vec2 g = p * many, i0 = floor(g - 0.5);
  vec4 o = vec4(0.0);
  for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
    vec2 id = i0 + vec2(float(i), float(j)), h = hash22(id * 1.37 + seed), v = g - id - 0.2 - 0.6 * h;
    float l2 = dot(v, v);
    if (l2 > 0.64 || fract(h.y * 17.3) < 0.3) continue;
    float size = fract(h.x * 57.3 + h.y * 7.1);
    float r = max(k * (0.08 + 0.4 * size * size * size), 0.02);
    if (l2 > r * r * 2.2) continue;
    v *= 1.0 + 0.16 * (h - 0.5) + 0.1 * (h.y - 0.5) * v.yx / r;   // no drop is quite round
    l2 = dot(v, v);
    float l = sqrt(l2);
    if (r > 0.02 && l < r * 1.4) {
      float e = l / r;
      float deep = sqrt(max(1.0 - e * e, 0.0));
      if (e < 1.0 && deep > o.x) o = vec4(deep, v / r, r);
      if (e >= 1.0 && o.x == 0.0) o.w = max(o.w, 1.5 * (1.4 - e) * max(0.0, dot(v / l, vec2(0.6, -0.8)) * 0.8 + 0.2));
    }
  }
  return o;
}
// Coins of sun that leaves let through.
float tbCoins(vec2 p) {
  float s = 0.0, open_ = smoothstep(0.05, 0.5, noise(p * 1.9 + 0.05 * vec2(sin(uTime * 0.1), cos(uTime * 0.13)) + 30.6));
  if (open_ < 0.004) return 0.0;
  for (int k = 0; k < 2; k++) {
    float f = float(k), many = 2.7 + 2.2 * f;
    vec2 sway = 0.05 * vec2(sin(uTime * 0.31 + f * 2.0 + p.y * 2.0), cos(uTime * 0.23 + f + p.x * 2.0));
    vec2 g = (rot(0.5 + f) * (p + sway)) * many, i0 = floor(g - 0.5);
    for (int j = 0; j <= 1; j++) for (int i = 0; i <= 1; i++) {
      vec2 id = i0 + vec2(float(i), float(j)), h = hash22(id + 7.7 + f * 31.0);
      vec2 c = id + 0.5 + 0.6 * (h - 0.5) + 0.1 * vec2(sin(uTime * 0.37 + h.x * 40.0), cos(uTime * 0.29 + h.y * 40.0));
      float r = 0.17 + 0.24 * fract(h.x * 13.7);
      vec2 v = (g - c) * vec2(1.0, 1.25);
      if (dot(v, v) > (r + 0.12) * (r + 0.12)) continue;
      float open = 0.5 + 0.5 * sin(uTime * 0.21 + h.y * 50.0);
      s += (0.4 + 0.6 * open) * (0.5 + 0.5 * h.x) * smoothstep(r + 0.12, r - 0.12, length(v));
    }
  }
  return s * open_;
}
// The floor the round table stands on, and the cloth that hangs over its edge. `r` is from the table's middle.
vec3 tbStone(vec2 p, float id, float dark) {
  float cloud = fbm(p * 2.3 + id * 40.0), vein = fbm(rot(0.6) * p * vec2(1.6, 3.4) + cloud * 1.6 + id * 17.0 + 9.0);
  float v = smoothstep(0.035, 0.0, abs(vein - 0.5)) * smoothstep(0.3, 0.6, cloud), grit = noise(p * 120.0);
  vec3 c = mix(vec3(0.2), tbDye(uKind[0]), 0.72) * (0.34 + 0.8 * cloud + 0.5 * (id - 0.5)) * (0.82 + 0.36 * grit);
  c += v * (0.22 * tbDye(uKind[3]) + 0.1);
  return c * (1.0 - 0.4 * dark * smoothstep(0.7, 0.75, noise(p * 60.0 + 3.0)));
}

// Boards laid side by side along the table, each cut from another plank. `fine` is the fibre under the varnish.
vec3 tbWood(vec2 p, out float fine) {
  float wide = 0.21;
  if (uOwn[0] != 0.0) wide *= exp2(-1.7 * max(uOwn[0], 0.0) - 1.15 * min(uOwn[0], 0.0));
  float blocks = max(uOwn[1], 0.0), zig = max(-uOwn[1], 0.0), old = max(uOwn[6], 0.0), pale = max(uOwn[2], 0.0), stone = max(-uOwn[2], 0.0), dyed = max(uOwn[3], 0.0);
  float fold = 1.0, column = 0.0;
  vec2 whole = p;
  if (zig > 0.0) {
    float w = wide * 2.6, x = p.x / w;
    column = floor(x * 2.0);
    fold = (0.5 - abs(fract(x * 2.0) - 0.5)) * 0.5 * w;
    p.y += zig * abs(fract(x) - 0.5) * w * 0.9;
  }
  float row = floor(p.y / wide);
  float v = fract(p.y / wide);
  float along = p.x + hash11(row * 7.3 + 1.7) * 3.1;
  float len = 1.9;
  if (uOwn[0] > 0.0) len *= exp2(-0.9 * uOwn[0]);
  if (blocks > 0.0) { len = exp2(mix(log2(len), log2(wide), blocks)); along += blocks * 0.5 * wide * mod(row, 2.0); }
  float board = floor(along / len);
  float u = fract(along / len);
  float id = hash21(vec2(row * 1.37 + 3.1, board * 2.11 + 0.7));
  if (zig > 0.0) id = mix(id, hash21(vec2(id * 7.0, column)), zig);
  // the grain: long fibres that wander, the year rings cut along their length
  vec2 g = vec2(along * 0.9 + id * 31.0, p.y * 15.0 + id * 9.0);
  float knot = 0.0;
  if (uOwn[0] < 0.0) {                                     // a wide board shows the arches of its rings
    float k = -uOwn[0], y = (v - 0.35 - 0.3 * id) * wide;
    g.y = mix(g.y, g.y * 0.55 + 46.0 * (0.06 + y * y * 2.2) * (1.0 - 1.5 * (u - 0.5) * (id > 0.5 ? 1.0 : -1.0)) - 3.0 * u, k);
  }
  if (old > 0.0) {                                         // the fibres go round a knot
    vec2 k = vec2(u * len - len * (0.2 + 0.6 * fract(id * 13.7)), (v - 0.3 - 0.4 * fract(id * 29.3)) * wide);
    float kd = length(k * vec2(0.55, 1.5));
    knot = old * exp(-kd * kd * 900.0) * step(0.35, fract(id * 51.1));
    g.y += old * 1.1 * step(0.35, fract(id * 51.1)) * exp(-kd * kd * 190.0) * (k.y > 0.0 ? 1.0 : -1.0) * smoothstep(0.0, 0.02, abs(k.y));
  }
  float wander = fbm(g * vec2(0.55, 0.4));
  float rings = sin(g.y * 4.2 + wander * 9.0 + 2.0 * sin(g.x * 0.7 + id * 6.0));
  if (blocks > 0.0) {                                      // sawn across: rings round where the heart of the tree was
    vec2 c = vec2(u * len - (hash11(id * 91.0) * 1.6 - 0.3) * wide, (v - (hash11(id * 37.0 + 2.0) * 1.6 - 0.3)) * wide);
    c = rot(id * 6.0) * c;
    float rr = length(c * vec2(1.0, 1.15)) / wide;
    rings = mix(rings, sin(rr * (26.0 + 16.0 * id) + wander * 3.0 + 2.5 * noise(c / wide * 2.5 + id * 20.0)), blocks);
  }
  fine = noise(vec2(g.x * 2.2, g.y * 7.0));
  float pore = noise(vec2(g.x * 6.0, g.y * 13.0));
  float tone = 0.46 + 0.2 * rings * (0.35 + 0.65 * wander) + 0.2 * (fine - 0.5) + 0.34 * (id - 0.5) - 0.1 * step(0.72, pore) * pore;
  vec3 col = mix(vec3(0.07, 0.034, 0.018), vec3(0.42, 0.235, 0.115), sat(tone));
  col = mix(col, col * vec3(1.08, 0.94, 0.82), wander); // warmer where the fibres bend
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] > 0.0 || uOwn[6] > 0.0) {
    if (zig > 0.0) { float lean = mod(column, 2.0) * 2.0 - 1.0; tone += zig * 0.12 * lean; col *= 1.0 + zig * 0.2 * lean; }
    col *= 1.0 + 0.7 * max(blocks, abs(uOwn[0]) * 0.8) * (id - 0.5);
    if (pale > 0.0) col = mix(col, mix(vec3(0.3, 0.27, 0.23), vec3(0.8, 0.77, 0.71), sat(0.25 + tone * 0.9)), pale);
    if (stone > 0.0) { col = mix(col, tbStone(whole + id * 3.0, id, 1.0), stone); fine = mix(fine, 0.5, stone); }
    if (dyed > 0.0) {
      float paint = dyed * (1.0 - old * smoothstep(0.5, 0.58, fbm(whole * vec2(5.0, 11.0) + id * 8.0) + 0.16 * (fine - 0.5)));
      col = mix(col, tbDye(uKind[int(min(hash11(id * 57.0 + 0.3) * 5.0, 4.0))]) * (0.5 + 0.75 * tone), paint * 0.93);
    }
    if (old > 0.0) {
      float split = abs(noise(vec2(along * 1.3 + id * 9.0, p.y * 34.0 + id * 5.0)) - 0.5);
      float run = smoothstep(0.52, 0.66, noise(vec2(along * 1.1 + id * 21.0, row * 3.0 + v * 1.3)));
      col *= 1.0 - 0.8 * old * smoothstep(0.055, 0.0, split) * run;
      col *= 1.0 - 0.6 * knot;
      col *= 1.0 - 0.35 * old * smoothstep(0.45, 0.75, fbm(whole * 2.2 + 40.0));
    }
  }
  // where two boards meet: a dark line, and the worn edge beside it catching a little light
  float edge = min(v, 1.0 - v) * wide;
  float butt = min(u, 1.0 - u) * len;
  float gap = smoothstep(0.0, 0.004, edge) * smoothstep(0.0, 0.003, butt);
  if (uOwn[6] > 0.0 || uOwn[2] < 0.0 || uOwn[1] != 0.0 || uOwn[5] < 0.0) {
    float open = 1.0 + 1.6 * old + 1.2 * stone;
    edge += (old + stone) * 0.006 * (noise(whole * 30.0) - 0.6);
    gap = smoothstep(0.0, 0.004, edge / open) * smoothstep(0.0, 0.003, butt / open);
    gap *= mix(1.0, smoothstep(0.0, 0.003, fold), zig);
    gap = mix(gap, 1.0, 0.7 * smoothstep(0.004, 0.02, tbPx) );
  }
  float worn = (1.0 - smoothstep(0.004, 0.016, edge)) * gap;
  return col * (0.16 + 0.84 * gap) * (1.0 + 0.3 * worn);
}

// A plain weave: each thread goes over one and under one. `fine` is how high the thread stands here.
vec3 tbCloth(vec2 p, out float fine) {
  // the cloth does not lie quite flat
  float lie = fbm(p * 1.1 + 4.0);
  vec2 q = p + 0.01 * vec2(fbm(p * 2.6 + 1.0), fbm(p * 2.6 + 9.0));
  float count = 96.0 * exp2(uOwn[0] * (uOwn[0] < 0.0 ? 2.1 : 1.2));
  vec2 t = q * count;
  vec2 id = floor(t), f = fract(t) - 0.5;
  float over = mod(id.x + id.y, 2.0);
  // the thread on top here runs across (over) or up (under); it is round, and dips where it goes under its neighbours
  float across = cos(f.y * PI) * (0.62 + 0.38 * cos(f.x * PI));
  float up = cos(f.x * PI) * (0.62 + 0.38 * cos(f.y * PI));
  float thread = mix(up, across, over);
  // no two threads are spun alike
  float spun = mix(hash11(id.x * 1.31 + 5.0), hash11(id.y * 1.73 + 11.0), over);
  float slub = noise(mix(vec2(id.x * 3.1, t.y * 0.35), vec2(t.x * 0.35, id.y * 3.1), over));
  // threads finer than a few pixels are not drawn one by one: the weave would shimmer
  float px = uRes.y * (0.5 + uSize) / count;
  if (uOwn[5] < 0.0) px = 1.0 / (max(tbPx, 1e-5) * count);
  if (uOwn[0] > 0.0) px *= 1.0 - 0.7 * uOwn[0];
  float show = smoothstep(1.6, 4.0, px);
  fine = mix(0.6, thread, show);
  float tone = 0.5 + show * (0.34 * (thread - 0.6) + 0.16 * (spun - 0.5) + 0.14 * (slub - 0.5)) + 0.55 * (lie - 0.5);
  vec3 col = mix(vec3(0.035, 0.07, 0.068), vec3(0.15, 0.24, 0.215), sat(tone));
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] > 0.0) {
    float coarse = max(-uOwn[0], 0.0), many = max(uOwn[0], 0.0), sewn = max(uOwn[1], 0.0), zig = max(-uOwn[1], 0.0), pale = max(uOwn[2], 0.0), felt = max(-uOwn[2], 0.0), dyed = max(uOwn[3], 0.0);
    float id = 0.5, seam = 1.0, light = 0.0, mark = 1.0;
    if (coarse > 0.0) {                                    // thick yarn: fibres run along it, and it is dark in the holes
      float fibre = noise(mix(vec2(t.x * 9.0 + f.y * 6.0, t.y * 2.2), vec2(t.x * 2.2, t.y * 9.0 + f.x * 6.0), over));
      tone += coarse * show * (0.28 * (fibre - 0.5) + 0.5 * (thread - 0.75));
      light -= coarse * show * 0.75 * smoothstep(0.45, 0.1, thread);
    }
    if (many > 0.0) {                                      // narrow stripes, no two of one width
      float s = q.x * 26.0, w = floor(s), e = fract(s) - 0.15 - 0.7 * hash11(w + 3.0);
      float stripe = hash11(w + step(0.0, e) * 0.5 + 0.7), soft = 1.0;
      id = mix(id, stripe, many); light += many * 0.55 * (stripe - 0.5);
    }
    if (zig > 0.0) {
      float w = 0.36 * exp2(-0.5 * uOwn[0]), y = (q.y + zig * abs(fract(q.x / w) - 0.5) * w * 1.1) / (w * 0.42);
      float b = floor(y), e = fract(y);
      float h = hash11(b * 3.7 + 0.2), h2 = hash11((b - 1.0) * 3.7 + 0.2);
      float s = smoothstep(0.0, 0.05, e);
      id = mix(id, h, zig);
      light += zig * 0.8 * (mix(h2, h, s) - 0.5);
      light += zig * 0.1 * (step(0.5, fract(q.x / w)) - 0.5);
    }
    if (sewn > 0.0) {                                      // patches, each of one or of two pieces
      float w = 0.235 * exp2(-0.7 * uOwn[0]);
      vec2 c = q / w, ci = floor(c), cf = fract(c);
      float h = hash21(ci + 4.4), cut = fract(h * 23.0);
      float diag = cut < 0.3 ? cf.x - cf.y : cut < 0.6 ? cf.x + cf.y - 1.0 : 9.0;
      float half_ = step(0.0, diag);
      id = mix(id, fract(h * 7.7 + half_ * 0.41), sewn);
      float e = min(min(min(cf.x, 1.0 - cf.x), min(cf.y, 1.0 - cf.y)), abs(diag) * 0.7) * w;
      seam = mix(1.0, smoothstep(0.0, 0.03, e) * 0.5 + 0.5, sewn) * mix(1.0, smoothstep(0.0, 0.006, e), 0.6 * sewn);
      float away = exp(-e * 70.0);
      vec2 d = cf - 0.5;
      tbSlope += sewn * 0.5 * d * smoothstep(0.1, 0.5, max(abs(d.x), abs(d.y)));
      light += sewn * 0.75 * (fract(h * 5.3 + half_ * 0.37) - 0.5);
      float run = (cf.x < 0.5 ? cf.x : cf.y), dash = step(0.35, fract((abs(d.x) > abs(d.y) ? cf.y : cf.x) * w * 70.0));
      mark += sewn * 0.5 * dash * smoothstep(0.0016, 0.0006, abs(e - 0.016)) * smoothstep(0.006, 0.002, tbPx);
    }
    tone += light;
    col = mix(vec3(0.035, 0.07, 0.068), vec3(0.15, 0.24, 0.215), sat(tone)) * (1.0 + 0.6 * min(light, 0.0) + 0.9 * max(light, 0.0));
    if (pale > 0.0) col = mix(col, mix(vec3(0.34, 0.31, 0.27), vec3(0.84, 0.81, 0.76), sat(0.35 + tone * 0.85)), pale);
    if (felt > 0.0) {
      float mat_ = 0.3 * noise(p * 46.0 + 3.0 * noise(p * 17.0)) + 0.3 * noise(p * 150.0) + 0.2 * noise(p * 11.0) + 0.1;
      float hair = smoothstep(0.06, 0.0, abs(noise(rot(1.1) * p * vec2(24.0, 70.0) + 4.0 * noise(p * 9.0)) - 0.5));
      vec3 wool = (tbDye(uKind[0]) * 0.8 + 0.02) * (0.45 + 0.9 * mat_ + 0.22 * hair) * (1.0 + 1.1 * light) * (0.6 + 0.8 * lie);
      col = mix(col, wool, felt); fine = mix(fine, mat_ + 0.2, felt);
    }
    if (dyed > 0.0) {                                      // a plaid, where nothing else says which dye
      float w = 4.6 * exp2(0.6 * uOwn[0]);
      vec2 b = floor(q * w + 0.4), e = fract(q * w + 0.4);
      vec2 k = vec2(hash11(b.x + 2.3 + 0.5 * step(0.62, e.x)), hash11(b.y + 9.1 + 0.5 * step(0.62, e.y)));
      vec3 one = tbDye(uKind[int(min(k.x * 5.0, 4.0))]), two = tbDye(uKind[int(min(k.y * 5.0, 4.0))]);
      vec3 plaid = mix(one, two, mix(0.5, over, show));
      col = mix(col, mix(plaid, tbDye(uKind[int(min(id * 5.0, 4.0))]), sat(1.6 * max(max(sewn, zig), many))) * (0.35 + 1.1 * sat(tone - 0.6 * light)), dyed * 0.95);
    }
    col *= seam * mark;
  }
  return mix(col, col.grb * vec3(0.9, 1.0, 1.05), 0.12 * spun * show * (1.0 - abs(uOwn[2]))); // a thread of another dye here and there
}

vec3 render(vec2 p) {
  float fine;
  vec2 seen = p;
  float matt = uVar > 0.5 ? 1.0 : 0.0, away = 0.0;
  float any = max(max(max(abs(uOwn[3]), abs(uOwn[4])), max(abs(uOwn[5]), abs(uOwn[6]))), max(abs(uOwn[7]), max(abs(uOwn[2]), abs(uOwn[1]))));
  tbPx = 1.0 / (uRes.y * (0.5 + uSize)); tbSlope = vec2(0.0);
  if (uOwn[5] < 0.0) {                                     // along the table, which goes away from us
    float w = 1.0 + 1.5 * uOwn[5] * (p.y + 0.1);
    away = smoothstep(0.62, 0.16, w) * -uOwn[5];
    w = max(w, 0.1);
    p = vec2(p.x, p.y + 0.1) / w - vec2(0.0, 0.1);
    tbPx /= w * w;
  }
  float round_ = max(uOwn[5], 0.0), R = mix(1.7, 0.45 - 0.07 * matt, sqrt(round_)), rim = 1.0;
  vec4 drop = vec4(0.0);
  vec2 at = p;
  if (uOwn[6] < 0.0) {
    drop = tbDrops(p, min(1.0, -1.4 * uOwn[6]), 7.0, 1.0);
    vec4 small = tbDrops(p, min(1.0, -1.4 * uOwn[6]), 19.0, 9.0);
    if (drop.x == 0.0 && small.x > 0.0) drop = vec4(small.xyz, small.w * 0.36); else if (drop.x == 0.0) drop.w = max(drop.w, small.w * 0.6);
    if (drop.x > 0.0) at -= drop.yz * drop.x * drop.w * 0.1;    // a drop is a lens
  }
  if (uOwn[6] > 0.0 && uVar > 0.5) {                       // creased
    float h = tbFold(p);
    tbSlope = uOwn[6] * vec2(tbFold(p + vec2(0.004, 0.0)) - h, tbFold(p + vec2(0.0, 0.004)) - h) / 0.004;
    at += 0.03 * tbSlope;
  }
  vec3 ground = uVar > 0.5 ? tbCloth(at, fine) : tbWood(at, fine);

  // the lamp hangs over the middle of the table, a little to the back, and sways a very little
  vec2 lamp = vec2(-0.06, 0.08) + 0.03 * vec2(sin(uTime * 0.11), cos(uTime * 0.083));
  float d = length(seen - lamp);
  float pool = 1.0 / (1.0 + 9.0 * d * d);
  float up = 0.3 + 0.75 * uEnergy + 0.35 * uLevel + 0.15 * uLow;
  vec3 warm = vec3(1.0, 0.85, 0.66);
  vec3 sound = tbSound();
  vec3 light = mix(warm, warm * (0.55 + 0.6 * sound), 0.45 * sat(uLevel * 1.8)) * pool * up;
  light += vec3(0.028, 0.031, 0.04); // the room

  vec3 sun = normalize(vec3(-0.6, 0.55, 0.62));
  if (any > 0.0) {
    // pale things want an even light
    float wide = 0.5 * max(uOwn[2], 0.0);
    light = mix(light, (warm * 0.6 + 0.4) * (0.1 + 0.36 * up) * (0.75 + 0.5 * pool) * mix(vec3(1.0), sound, 0.3 * sat(uLevel * 1.5)) * 0.95, wide);
    if (uOwn[4] > 0.0) {                                   // a window, its panes lying slanting over the table
      vec2 s = vec2(p.x + 0.52 * p.y, p.y - 0.12 * p.x) + 0.012 * vec2(sin(uTime * 0.05), cos(uTime * 0.04)) - vec2(0.03, 0.02);
      vec2 c = s / vec2(0.36, 0.43) + vec2(1.5, 1.0), in_ = fract(c), n = floor(c);
      float soft = 0.05 + 0.1 * sat(0.5 - p.y);
      vec2 b = smoothstep(0.02, 0.02 + soft, in_) * smoothstep(0.98, 0.98 - soft, in_);
      float pane = b.x * b.y * step(0.0, n.x) * step(n.x, 2.0) * step(0.0, n.y) * step(n.y, 1.0);
      vec3 day = vec3(1.0, 0.93, 0.8) * (0.42 + 0.35 * uEnergy + 0.4 * uLevel) * pane * (0.8 + 0.35 * noise(s * 2.0 + uTime * 0.03));
      day *= mix(vec3(1.0), sound, 0.3 * sat(uLevel * 1.5));
      day += vec3(0.05, 0.065, 0.085) * (1.0 + uEnergy + uLevel);
      light = mix(light, day, uOwn[4]);
    }
    if (uOwn[4] < 0.0) {                                   // under leaves
      float coin = tbCoins(p);
      vec3 day = vec3(1.0, 0.9, 0.7) * (0.42 + 0.3 * uEnergy + 0.4 * uLevel) * coin + vec3(0.06, 0.085, 0.075) * (1.0 + uEnergy + uLevel);
      day *= mix(vec3(1.0), sound, 0.3 * sat(uLevel * 1.5));
      light = mix(light, day, -uOwn[4]);
    }
    vec3 to = normalize(vec3(lamp - seen, 0.3));
    to = normalize(mix(to, sun, max(abs(uOwn[4]), 0.45)));
    float lean = dot(normalize(vec3(-tbSlope, 1.0)), to) / to.z;
    light *= mix(1.0, max(lean, 0.06), step(1e-9, dot(tbSlope, tbSlope)));
  }

  // a hit, and a cue slower and wider: one ring of light going out from under the lamp
  light += (0.3 * warm + 0.5 * sound) * (tbRing(d, uHits) * 0.5 + tbRing(d * 0.8, uCue) * 0.6) * pool * 2.0;

  // the piece along the far edge, as if a strip of light lay behind what is on the table
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 m = tbEdge(uv.x);
  float far = 1.0 - uv.y;
  float dx = uv.x - uLoop;
  float here = exp(-dx * dx / 0.0016);
  vec3 strip = m.rgb * (0.8 + 2.4 * here) + warm * here * 0.02;
  light += strip * (exp(-far * 6.0) * 1.2 + exp(-far * 26.0) * 2.0) * (0.4 + 0.6 * uEnergy);

  if (any > 0.0) light += (0.25 * warm + 0.35 * sound) * (tbRing(d, uHits) + tbRing(d * 0.8, uCue)) * max(max(abs(uOwn[2]), abs(uOwn[7])), max(-uOwn[5], 0.0)) * (0.5 + pool);
  if (uOwn[3] < 0.0) {                                     // what sounds soaks in, and dries with a darker rim
    vec2 on = vec2(seen.x / 1.78 + 0.5, 0.5 - seen.y) + 0.07 * (vec2(fbm(seen * 4.0 + 1.0), fbm(seen * 4.0 + 21.0)) - 0.5);
    vec4 s = piece(sat(on));
    vec4 sw = 0.5 * s + 0.125 * (piece(sat(on + vec2(0.02, 0.0))) + piece(sat(on - vec2(0.02, 0.0))) + piece(sat(on + vec2(0.0, 0.03))) + piece(sat(on - vec2(0.0, 0.03))));
    float a = smoothstep(0.02, 0.3, sw.a), rimmed = smoothstep(0.02, 0.1, sw.a) * smoothstep(0.24, 0.1, sw.a);
    vec3 hue = sw.rgb / max(sw.a, 0.02);
    ground = mix(ground, tbDye(hue) * (0.12 + 1.7 * dot(ground, vec3(0.34))), -uOwn[3] * a * 0.9);
    ground *= 1.0 + uOwn[3] * 0.4 * rimmed;
    light += -uOwn[3] * tbDye(hue) * a * (0.1 + 0.5 * sw.a) * (0.5 + 0.5 * uEnergy);
  }
  vec3 over = vec3(0.0);                                   // what shines on top
  if (uOwn[7] > 0.0) {                                     // studs
    float cell = 0.085 * exp2(-0.6 * uOwn[0]);
    vec2 g = p / cell, gi = floor(g), v = fract(g) - 0.5, c = (gi + 0.5) * cell;
    vec2 cs = c;
    if (uOwn[5] < 0.0) { float w = 1.0 / max(1.0 - 1.5 * uOwn[5] * (c.y + 0.1), 0.05); cs = (c + vec2(0.0, 0.1)) * w - vec2(0.0, 0.1); }
    vec4 m1 = piece(sat(vec2(cs.x / 1.78 + 0.5, 0.5 - cs.y)));
    float a = sat(m1.a * 1.2), r = uOwn[7] * (0.2 + 0.2 * a), l = length(v), px = tbPx / cell;
    float sh = smoothstep(r * 1.9, r * 0.6, length(v - vec2(0.09, -0.12)));
    light *= 1.0 - 0.65 * sh * smoothstep(0.0, 0.3, uOwn[7]);
    float in_ = smoothstep(r + px, r - px, l);
    vec3 n = vec3(v / max(r, 0.01), sqrt(max(1.0 - l * l / max(r * r, 1e-4), 0.0)));
    vec3 to = normalize(vec3(mix(lamp - seen, vec2(-0.5, 0.5), 0.5), 0.45));
    float lit = sat(dot(n, to)), spec = pow(sat(2.0 * lit * n.z - to.z), 24.0);
    vec3 hue = m1.rgb / max(m1.a, 0.02);
    vec3 brass = mix(tbDye(uKind[2]) * 0.5 + 0.05, tbDye(hue), sat(m1.a * 2.0));
    vec3 body = brass * (0.1 + 0.9 * lit) * (0.35 * max(light.r, max(light.g, light.b)) + 0.9 * a * (0.6 + 0.6 * uEnergy) + 0.06) + (vec3(1.0, 0.9, 0.75) * 0.5 + 0.5 * hue * a) * spec * (0.25 * up * pool + 0.25 * a + 0.06);
    ground = mix(ground, vec3(0.0), in_); over += body * in_;
    over += tbDye(hue) * a * 0.12 * exp(-l * 4.0) * (1.0 - in_) * uOwn[7];
  }
  if (uOwn[7] < 0.0) {                                     // bowls, and what is in them
    for (int i = 0; i < 5; i++) {
      float f = float(i), loud = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : uHits * 0.7;
      vec2 c = i == 0 ? vec2(-0.3, -0.06) : i == 1 ? vec2(0.12, 0.13) : i == 2 ? vec2(0.47, -0.16) : i == 3 ? vec2(0.06, -0.27) : vec2(-0.52, 0.24);
      float r = (i == 0 ? 0.185 : i == 1 ? 0.15 : i == 2 ? 0.125 : i == 3 ? 0.085 : 0.065) * -uOwn[7];
      c *= mix(1.0, 0.62, round_);
      r *= mix(1.0, 0.75, round_);
      vec2 v = p - c, dir = normalize(v + vec2(1e-5, 0.0));
      float l = length(v) / max(r, 1e-3), px = tbPx / max(r, 1e-3);
      if (l > 2.2) continue;
      vec2 from = normalize(mix(lamp - c, vec2(-0.6, 0.55), max(0.35, abs(uOwn[4]))) + vec2(1e-4, 0.0));
      float lean = dot(dir, from);
      light *= 1.0 - 0.7 * smoothstep(1.5, 0.75, length(v + from * r * 0.28) / max(r, 1e-3)) * smoothstep(0.0, 0.3, -uOwn[7]);
      float in_ = smoothstep(1.0 + px, 1.0 - px, l), pot = smoothstep(0.84 - px, 0.84 + px, l), wet = smoothstep(0.72 + px, 0.72 - px, l);
      vec3 hue = tbDye(uKind[i]);
      float base = 0.25 + 0.45 * max(light.r, max(light.g, light.b)) + 0.12 * up * pool;
      float speck = step(0.8, noise(v * 160.0 + f * 9.0)) * 0.35;
      vec3 glaze = mix(vec3(0.5, 0.47, 0.42), hue, 0.3) * (1.0 - speck);
      float lip = 0.6 + 0.5 * lean * smoothstep(0.82, 1.0, l) - 0.55 * lean * smoothstep(0.95, 0.75, l) * (1.0 - wet);
      vec3 bowl = glaze * lip * base;
      float inner = smoothstep(0.86, 0.3, length(v / max(r, 1e-3) + from * 0.2));
      float ring = sin(l * 26.0 - uTime * 1.1 + f) * exp(-l * 2.0) * (0.04 + 0.12 * loud);
      vec3 tea = hue * (0.2 + 0.5 * inner + ring) * base * 1.1 + hue * (0.1 + 0.9 * loud) * (0.25 + 0.75 * inner) * (0.35 + 0.65 * uEnergy);
      tea += vec3(1.0, 0.93, 0.82) * smoothstep(0.2, 0.1, length((v / max(r, 1e-3) - from * 0.36) * vec2(1.0, 1.0))) * 0.2 * (0.5 + up * pool);
      bowl = mix(bowl, glaze * 0.28 * base * (1.0 - 0.6 * lean), (1.0 - pot) * 0.6);
      bowl = mix(bowl, tea, wet);
      ground = mix(ground, vec3(0.0), in_);
      over = mix(over, bowl, in_);
    }
  }
  if (uOwn[6] < 0.0) {                                     // wet: darker, and every drop holds the lamp
    float k = -uOwn[6];
    ground *= 1.0 - 0.3 * k;
    if (drop.x > 0.0) {
      vec2 n = drop.yz;
      vec2 from = normalize(mix(lamp - seen, vec2(-0.6, 0.6), 0.6));
      float lean = dot(n, from), e = length(n);
      light *= 1.0 + 0.9 * max(-lean, 0.0) * e - 0.6 * max(lean, 0.0) * e - 0.3 * smoothstep(0.75, 1.0, e);
      vec2 s = n - from * 0.5;
      over += (warm * (0.3 + 0.7 * pool * up) + sound * uLevel * 0.6) * smoothstep(0.05, 0.01, dot(s, s)) * k * 0.7;
      over += sound * 0.1 * max(-lean, 0.0) * e * e * (0.4 + uLevel) * k;
    } else light *= 1.0 - 0.45 * drop.w * k;
  }
  vec3 col = ground * light;
  // varnish over wood throws the lamp back along the fibres; cloth only where a thread stands up
  float gloss = exp(-d * d * 7.0) * (0.3 + 0.7 * fine);
  col += mix(warm * gloss * 0.05 * up, ground * gloss * 0.5 * up, matt);
  col *= mix(1.0, 0.8 + 0.4 * fine, 0.5 * matt);
  if (any > 0.0) {
    col += over * mix(1.0, pool * 1.2 + 0.5, 0.3);
    vec3 floor_ = mix(vec3(0.012, 0.01, 0.009), vec3(0.05), max(uOwn[4], 0.0)) + tbDye(uKind[0]) * 0.06;
    if (round_ > 0.0) {
      vec2 v = p - vec2(0.0, -0.02);
      float l = length(v), px = tbPx, a = atan(v.y, v.x + 1e-5);
      float hang = matt * (0.07 + 0.012 * sin(a * 17.0 + 2.0 * sin(a * 3.0))) * round_;
      float top = smoothstep(R + px, R - px, l), over_ = smoothstep(R + hang + px, R + hang - px, l);
      float grain = noise(rot(0.35) * v * vec2(3.0, 40.0)), board = fract((rot(0.35) * v).y * 4.5);
      vec3 under = mix(floor_, mix(vec3(0.3, 0.28, 0.25), tbDye(uKind[0]), 0.4), 0.45 * max(uOwn[2], 0.0)) * (0.7 + 0.5 * grain) * (0.5 + 0.5 * smoothstep(0.0, 0.03, min(board, 1.0 - board)));
      under *= (0.35 + 1.1 * exp(-max(l - R, 0.0) * 2.4)) * (0.5 + 0.9 * up);
      under *= 1.0 - 0.75 * smoothstep(0.3, 0.0, length(v - vec2(0.05, -0.06)) - R - hang);
      under += tbDye(uKind[0]) * uDrone * 0.04 * exp(-max(l - R, 0.0) * 3.0);
      // the edge of a board is turned and catches the lamp; a cloth goes over it and hangs
      float turn = smoothstep(R - 0.022, R, l);
      vec3 side = col * mix(1.0, 0.45 + 0.6 * (0.5 - 0.5 * dot(v / max(l, 1e-3), vec2(0.6, -0.75))), turn * (1.0 - matt));
      vec3 drape = col * (0.75 + 0.22 * sin(a * 17.0 + 2.0 * sin(a * 3.0) + 1.0) + 0.2 * dot(v / max(l, 1e-3), vec2(-0.6, 0.7))) * 0.75;
      side = mix(side, max(drape, 0.0), matt * (1.0 - top));
      col = mix(under, side, max(top, over_));
    }
    if (uOwn[5] < 0.0) col = mix(col, floor_ * (0.5 + up) * 0.6 + m.rgb * 0.02, away * 0.9);
  }
  col *= 1.0 - 0.3 * dot(seen, seen);
  // to the screen deep and warm: the table is the dark under what lies on it, and grain shows least in the dark
  vec3 c = screenOf(col * 2.6);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.4));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.75) * 0.92;
}
