// name: Table
// a: Wood
// b: Cloth
// what: A table seen from straight above, to lay gear on: dark boards under one warm lamp, or the same table under a woven cloth. It stays quiet on purpose, so that what lies on it is what is looked at.
// follows: The lamp breathes with the mix and takes a little of the colour of what sounds; the piece glows along the far edge of the table, brightest at the place now playing; a hit or a cue sends one soft ring of light out from under the lamp; Glow turns the lamp up.

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

// Boards laid side by side along the table, each cut from another plank. `fine` is the fibre under the varnish.
vec3 tbWood(vec2 p, out float fine) {
  float wide = 0.21;
  float row = floor(p.y / wide);
  float v = fract(p.y / wide);
  float along = p.x + hash11(row * 7.3 + 1.7) * 3.1;
  float len = 1.9;
  float board = floor(along / len);
  float u = fract(along / len);
  float id = hash21(vec2(row * 1.37 + 3.1, board * 2.11 + 0.7));
  // the grain: long fibres that wander, the year rings cut along their length
  vec2 g = vec2(along * 0.9 + id * 31.0, p.y * 15.0 + id * 9.0);
  float wander = fbm(g * vec2(0.55, 0.4));
  float rings = sin(g.y * 4.2 + wander * 9.0 + 2.0 * sin(g.x * 0.7 + id * 6.0));
  fine = noise(vec2(g.x * 2.2, g.y * 7.0));
  float pore = noise(vec2(g.x * 6.0, g.y * 13.0));
  float tone = 0.46 + 0.2 * rings * (0.35 + 0.65 * wander) + 0.2 * (fine - 0.5) + 0.34 * (id - 0.5) - 0.1 * step(0.72, pore) * pore;
  vec3 col = mix(vec3(0.07, 0.034, 0.018), vec3(0.42, 0.235, 0.115), sat(tone));
  col = mix(col, col * vec3(1.08, 0.94, 0.82), wander); // warmer where the fibres bend
  // where two boards meet: a dark line, and the worn edge beside it catching a little light
  float edge = min(v, 1.0 - v) * wide;
  float butt = min(u, 1.0 - u) * len;
  float gap = smoothstep(0.0, 0.004, edge) * smoothstep(0.0, 0.003, butt);
  float worn = (1.0 - smoothstep(0.004, 0.016, edge)) * gap;
  return col * (0.16 + 0.84 * gap) * (1.0 + 0.3 * worn);
}

// A plain weave: each thread goes over one and under one. `fine` is how high the thread stands here.
vec3 tbCloth(vec2 p, out float fine) {
  // the cloth does not lie quite flat
  float lie = fbm(p * 1.1 + 4.0);
  vec2 q = p + 0.01 * vec2(fbm(p * 2.6 + 1.0), fbm(p * 2.6 + 9.0));
  float count = 96.0;
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
  float show = smoothstep(1.6, 4.0, px);
  fine = mix(0.6, thread, show);
  float tone = 0.5 + show * (0.34 * (thread - 0.6) + 0.16 * (spun - 0.5) + 0.14 * (slub - 0.5)) + 0.55 * (lie - 0.5);
  vec3 col = mix(vec3(0.035, 0.07, 0.068), vec3(0.15, 0.24, 0.215), sat(tone));
  return mix(col, col.grb * vec3(0.9, 1.0, 1.05), 0.12 * spun * show); // a thread of another dye here and there
}

vec3 render(vec2 p) {
  float fine;
  vec3 ground = uVar > 0.5 ? tbCloth(p, fine) : tbWood(p, fine);
  float matt = uVar > 0.5 ? 1.0 : 0.0;

  // the lamp hangs over the middle of the table, a little to the back, and sways a very little
  vec2 lamp = vec2(-0.06, 0.08) + 0.03 * vec2(sin(uTime * 0.11), cos(uTime * 0.083));
  float d = length(p - lamp);
  float pool = 1.0 / (1.0 + 9.0 * d * d);
  float up = 0.3 + 0.75 * uEnergy + 0.35 * uLevel + 0.15 * uLow;
  vec3 warm = vec3(1.0, 0.85, 0.66);
  vec3 sound = tbSound();
  vec3 light = mix(warm, warm * (0.55 + 0.6 * sound), 0.45 * sat(uLevel * 1.8)) * pool * up;
  light += vec3(0.028, 0.031, 0.04); // the room

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

  vec3 col = ground * light;
  // varnish over wood throws the lamp back along the fibres; cloth only where a thread stands up
  float gloss = exp(-d * d * 7.0) * (0.3 + 0.7 * fine);
  col += mix(warm * gloss * 0.05 * up, ground * gloss * 0.5 * up, matt);
  col *= mix(1.0, 0.8 + 0.4 * fine, 0.5 * matt);
  col *= 1.0 - 0.3 * dot(p, p);
  // to the screen deep and warm: the table is the dark under what lies on it, and grain shows least in the dark
  vec3 c = screenOf(col * 2.6);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.4));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.75) * 0.92;
}
