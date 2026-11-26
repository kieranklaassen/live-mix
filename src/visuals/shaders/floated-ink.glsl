// name: Floating ink
// a: Breath rings
// b: Drawn comb
// what: A pale basin of water seen from above, black and grey ink floating on it in nests of hair-thin rings, bent like a fingerprint, pushing one another aside and throwing a faint shadow on the bottom; or a full bath of coloured stones, raked and drawn by a comb into scallops, with one swirl and a sheet of wet paper at the side.
// follows: Rings hold the piece from the heart, now, outward, darker where it sounds; drone, pad, phrase each swell a nest, texture clear drops, the low band bends all. In the bath, stones swell with the piece and the spectrum; a kind's colour deepens as it sounds. A hit sets one fresh drop. A cue draws one stroke under a passing light. Space thins ink, keys tint.
// One drop let into the water: what lay outside it was pushed out by its area. q is followed back to where it lay before.
vec2 fiBack(vec2 q, vec2 c, float r2) {
  vec2 v = q - c;
  return c + v * sqrt(max(1.0 - r2 / max(dot(v, v), 1e-6), 0.0));
}
// Moves the heart of a nest off its middle while its rim stays a circle; z in the disc of radius 1.
vec2 fiHeart(vec2 z, vec2 a) {
  vec2 n = z - a, d = vec2(1.0 - dot(a, z), a.y * z.x - a.x * z.y);
  return vec2(n.x * d.x + n.y * d.y, n.y * d.x - n.x * d.y) / max(dot(d, d), 1e-4);
}
// A line as wide as `duty` of its ring, drawn no sharper than a pixel.
float fiLine(float f, float duty, float w) {
  float l = sat((0.5 * duty - abs(f - 0.5)) / max(w, 0.02) + 0.5);
  return mix(l, duty, smoothstep(0.5, 1.2, w));
}
// Slopes of the water's skin, and the pale net of light it throws on the basin.
vec2 fiSlope(vec2 p, float t) {
  return vec2(cos(p.x * 9.0 + 4.0 * p.y + t * 0.5) + 0.7 * cos(p.x * 17.0 - 11.0 * p.y - t * 0.6),
              cos(p.y * 8.0 - 5.0 * p.x - t * 0.45) + 0.7 * cos(p.y * 19.0 + 7.0 * p.x + t * 0.7));
}
float fiNet(vec2 s, float t) {
  float a = noise(s + 9.0 * vec2(sin(t * 0.011), cos(t * 0.008))), b = noise(s * 1.7 - 9.0 * vec2(sin(t * 0.009), cos(t * 0.01)) + 25.0);
  float c = sat(1.0 - abs(a - b) * 2.4);
  return c * c * c;
}
// All the ink that floats over p: how much, and its colour. `soft` is the blur of a shadow.
vec4 fiInk(vec2 p, float wide, float soft) {
  float t = uTime, px = 1.0 / uRes.y, cue = 4.0 * uCue * (1.0 - uCue), br = 0.7 + 0.5 * uLow;
  // breath: shears one after the other, each keeps every area as it is
  vec2 q = p;
  q.x += 0.1 * sin(q.y * 3.3 + 0.5 + 0.04 * t) + 0.03 * cue * sin(q.y * 9.0);
  q.y += 0.085 * sin(q.x * 3.9 / wide + 2.0 - 0.033 * t) + 0.03 * cue * sin(q.x * 7.0);
  q.x += 0.034 * br * sin(q.y * 10.0 + 2.0 * sin(q.x * 3.0) + 0.06 * t);
  q.y += 0.028 * br * sin(q.x * 12.0 + 2.2 * sin(q.y * 4.0) - 0.05 * t);
  q.x += 0.010 * br * sin(q.y * 27.0 + 3.0 * sin(q.x * 7.0) - 0.07 * t);
  q.y += 0.008 * br * sin(q.x * 31.0 + 3.0 * sin(q.y * 8.0) + 0.08 * t);
  float edge = 1.0, open = 1.0, rim = 0.0;
  // clear drops between the rings
  for (int i = 0; i < 4; i++) {
    float fi = float(i), h = hash11(fi + 3.0), h2 = hash11(fi + 11.7);
    vec2 c = vec2((h - 0.5) * 1.1 * wide, (h2 - 0.5) * 0.66) + 0.02 * vec2(sin(t * 0.07 + fi * 2.0), cos(t * 0.06 + fi * 3.0));
    float r = 0.006 + 0.014 * h2 + 0.034 * uTexture * (0.4 + 0.6 * h), d = length(q - c);
    edge = min(edge, smoothstep(0.0, 1.2 * px + 0.4 * soft, abs(d - r)));
    rim = max(rim, sat(1.4 - abs(d - 0.9 * r) / (0.9 * px + 0.5 * soft)) * smoothstep(0.015, 0.04, r));
    if (d < r) open = 0.0; else q = fiBack(q, c, r * r);
  }
  // the nests, the newest first, the old wide one last
  vec2 w = vec2(2.0); float count = 1.0, tone = 0.0, row = 0.0, found = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 c, a; float r, n, s;
    if (i == 0) { c = vec2(0.36, 0.17); r = 0.15 + 0.035 * uPhrase; n = 13.0; a = vec2(-0.25, 0.3); s = 0.62 + 0.38 * uPhrase; }
    else if (i == 1) { c = vec2(-0.32, -0.06); r = 0.29 + 0.03 * uDrone; n = 27.0; a = vec2(0.34, 0.22); s = 0.68 + 0.32 * uDrone; }
    else if (i == 2) { c = vec2(0.24, -0.2); r = 0.16 + 0.04 * uPad; n = 13.0; a = vec2(0.1, -0.3); s = 0.5 + 0.5 * uPad; }
    else { c = vec2(0.1, 0.04); r = 0.84; n = 36.0; a = vec2(-0.48, -0.16); s = 0.42 + 0.12 * uLevel; }
    float fi = float(i);
    c.x *= wide;
    c += 0.02 * vec2(sin(t * 0.041 + fi * 2.1), cos(t * 0.047 + fi * 1.3));
    a += 0.08 * vec2(sin(t * 0.053 + fi), cos(t * 0.061 + fi * 2.0));
    vec2 v = q - c; float d = length(v);
    if (found < 0.5) {
      edge = min(edge, smoothstep(0.0, (d < r ? 3.0 : 2.2) * px + 0.4 * soft, abs(d - r)));
      if (d < r) { found = 1.0; w = fiHeart(v / r, a); count = n; tone = s; row = fi; }
      else { q = fiBack(q, c, r * r); edge *= mix(0.12, 1.0, smoothstep(0.0, 0.06, d - r)); }   // pressed against a newer nest the ink thins away
    }
  }
  // the rings: equal steps of area, ever so slowly pushed outward by the next
  float m = sat(dot(w, w)), rad = sqrt(m), x = count * mix(m, rad, 0.5), fw = fwidth(x) + soft * count * 1.5;
  x -= uTravel * 0.12;
  float id = mod(floor(x), 89.0), f = fract(x), h = hash11(id + 13.0 * row), h2 = hash11(id * 3.7 + 5.0 * row);
  float at = fract(uLoop - 0.8 * rad), life = noise(q * 5.0 + 3.0 * row);
  vec4 pc = piece(vec2(at, 0.2 + 0.2 * row)) * smoothstep(0.0, 0.05, at) * (1.0 - smoothstep(0.95, 1.0, at));
  float loud = sat(pc.a * (0.6 + 0.5 * uEnergy) + 0.35 * band(rad));
  // some rings a hair, a few broad and black, some left clear
  float duty = (0.15 + 0.66 * h * h * h) * (0.4 + 1.2 * life) * (0.8 + 0.7 * loud) * step(0.12, h2);
  if (row > 2.5) duty = min(duty, 0.2 + 0.25 * h);
  float ink = fiLine(f, min(duty, 0.82), fw) * (0.5 + 0.5 * h2) * (0.75 + 0.6 * loud) * mix(0.6, 1.0, f) * tone * (row > 2.5 ? 1.3 : 1.75);
  if (row > 2.5) ink *= smoothstep(0.34, 0.66, noise(q * 2.3 + 4.0) + 0.3 * (h - 0.4));   // the old nest has thinned to nothing in places
  ink *= (1.0 - smoothstep(0.8, 1.0, rad + 0.3 * (life - 0.5))) * found * edge * open * (1.2 - 0.45 * uSpace) * (0.85 + 0.3 * uTone);
  vec3 hue = pc.a > 0.02 ? pc.rgb / pc.a : vec3(0.3);
  vec3 black = mix(vec3(0.06, 0.06, 0.075), hue * 0.4, 0.3 * sat(pc.a * 2.0));
  // a hit: one fresh drop in the newest heart, its rings black with it; the keys tint that nest
  if (row < 0.5) {
    black = mix(black, vec3(0.6, 0.16, 0.1), 0.8 * uKeys);
    ink = max(ink * (1.0 + uHits), found * open * uHits * (1.0 - smoothstep(-0.02, 0.02, rad - 0.58)) * smoothstep(0.0, 0.06, abs(rad - 0.44)));
    black = mix(black, uKind[4] * 0.3, 0.5 * uHits);
  }
  return vec4(black, sat(max(ink, 0.3 * rim)));
}
vec3 fiRings(vec2 p) {
  float t = uTime, wide = clamp(uRes.x / uRes.y / 1.7, 0.36, 1.15);
  vec2 sl = fiSlope(p, t) * (0.004 + 0.004 * uMic + 0.003 * uHigh);
  // the basin under the water and the light that falls across it
  float lamp = sat(0.6 + 0.55 * dot(p / vec2(max(wide, 0.5), 1.0), vec2(-0.45, 0.6)));
  vec3 col = mix(vec3(0.7, 0.675, 0.63), vec3(0.955, 0.93, 0.87), lamp);
  col += 0.045 * fiNet(p * 4.0 + sl * 20.0, t) * (0.4 + lamp);
  float deep = 0.014 + 0.018 * uSpace;
  col *= 1.0 - 0.2 * vec3(1.0, 0.96, 0.88) * fiInk(p + deep * vec2(-0.8, 1.0) + sl * 0.3, wide, 0.012 + 0.6 * deep).a;
  vec4 ink = fiInk(p, wide, 0.0);
  col = mix(col, ink.rgb, ink.a);
  // sheen: a window on the water
  vec2 s = rot(0.35) * (p - vec2(-0.5 * wide, 0.33)) + sl * 5.0;
  float pane = (1.0 - smoothstep(0.12, 0.2, abs(s.x))) * (1.0 - smoothstep(0.06, 0.16, abs(s.y)));
  col += 0.07 * pane;
  float cueAt = dot(p, vec2(0.9, -0.4)) - mix(-0.6, 0.9, 1.0 - uCue);
  col += 0.12 * uCue * exp(-cueAt * cueAt * 18.0);
  return col;
}
// The colours of the bath, earths with a little of each kind's own; a colour is thin until its kind sounds.
vec3 fiP[6];
void fiGrind() {
  const vec3 bone = vec3(0.88, 0.845, 0.765);
  float thin = 0.1 + 0.2 * uSpace;
  fiP[0] = mix(mix(vec3(0.1, 0.2, 0.24), uKind[0], 0.16), bone, thin * (1.0 - uDrone));
  fiP[1] = mix(mix(vec3(0.5, 0.15, 0.1), uKind[1], 0.14), bone, thin * (1.0 - uPad));
  fiP[2] = mix(mix(vec3(0.72, 0.5, 0.22), uKind[2], 0.22), bone, thin * (1.0 - uTexture));
  fiP[3] = mix(mix(vec3(0.42, 0.45, 0.37), uKind[3], 0.22), bone, thin * (1.0 - uPhrase));
  fiP[4] = vec3(0.1, 0.098, 0.11);
  fiP[5] = bone;
}
float fiWave(float x) { x = abs(fract(x) - 0.5) * 2.0; return 1.0 - 2.0 * x * x * (3.0 - 2.0 * x); }
vec3 fiBath(vec2 p, float half_) {
  float t = uTime, px = 1.0 / uRes.y, cue = 4.0 * uCue * (1.0 - uCue);
  fiGrind();
  vec2 q = p;
  // the swirl, drawn last
  vec2 v = q - vec2(-0.2 * half_ / 0.9, -0.14);
  q = q - v + rot(3.6 * exp(-dot(v, v) * 30.0)) * v;
  // the comb, strongest to the right
  float along = smoothstep(-0.3, 0.12, q.x), c = abs(fract(q.x * 9.5 + 0.2) - 0.5) * 2.0;
  q.y += (0.13 + 0.03 * uLow + 0.01 * sin(t * 0.1)) * along * (1.0 - c) * (1.0 - c) + 0.03 * sin(q.x * 5.0 + 0.05 * t);
  // the long rakes before it, there and back
  q.x += 0.13 * along * sin(q.y * 15.0) + 0.04 * sin(q.y * 6.0 + 0.04 * t);
  q.x += 0.14 * cue * exp(-abs(q.y - 0.05) * 14.0);
  // no stone is quite round
  q.x += 0.012 * sin(q.y * 19.0 + 2.0 * sin(q.x * 9.0) + 0.05 * t);
  q.y += 0.012 * sin(q.x * 23.0 + 2.0 * sin(q.y * 11.0) - 0.04 * t);
  // a hit: one fresh drop among the stones
  vec2 ha = vec2(-0.44 * half_ / 0.9, 0.19);
  float hd = length(q - ha), hit = (1.0 - smoothstep(-0.004, 0.004, hd - 0.125)) * uHits;
  q = ha + (q - ha) * (1.0 - 1.4 * uHits * (1.0 - uHits) * exp(-hd * hd * 60.0));
  vec3 col = vec3(0.0); float left = 1.0, loud = 0.0, gap = 1.0;
  for (int i = 0; i < 24; i++) {
    float fi = float(i), g = mod(fi * 7.0, 24.0), row = floor(g / 6.0);
    vec2 cell = vec2(g - 6.0 * row, row), h = hash22(cell + 2.3);
    vec2 at = (cell - vec2(2.6, 1.5) + (h - 0.5) * 0.8) * vec2(0.32, 0.29);
    at += 0.015 * vec2(fiWave(t * 0.008 + h.x), fiWave(t * 0.007 + h.y));
    // every other stone is the piece at its place, the rest each hear one band
    loud = (i & 1) == 0 ? piece(vec2(0.5 + at.x * 0.55, 0.5 - at.y)).a : 0.6 * uBands[i >> 1];
    int k = i % 5;
    float r = (0.07 + 0.1 * h.x + 0.002 * fi) * (0.9 + 0.24 * loud + 0.08 * fiWave(t * 0.013 + h.x * 5.0)) * (k == 4 ? 0.82 : 1.0);
    vec2 u = q - at; float e = length(u), w = clamp(fwidth(e), px * 0.5, 0.02);
    float in_ = (1.0 - smoothstep(-w, w, e - r)) * left;
    if (in_ > 0.002) {
      // a stone is one, two or three drops let into one another, a little off the middle
      float n = length(u + 0.22 * e * (h - 0.5)) / r, o = length(u - r * 0.3 * (h.yx - 0.5)) / r, wn = w / r;
      vec3 paint = fiP[k] * (0.82 + 0.26 * n);
      paint = mix(paint, fiP[5], (1.0 - smoothstep(-wn, wn, abs(n - 0.82) - 0.1 * h.y * h.y)));
      paint = mix(paint, fiP[(k + 1 + int(h.y * 3.0)) % 5], (1.0 - smoothstep(-wn, wn, o - 0.75 * h.x)) * 0.9);
      paint = mix(paint, fiP[5], (1.0 - smoothstep(-wn, wn, o - 0.4 * (h.x - 0.35))));
      col += in_ * paint;
      left -= in_;
    }
    gap = min(gap, abs(e - r));
    q = fiBack(q, at, r * r);
  }
  // what is left between the stones is the first colour thrown
  vec2 g = q * 10.0, id = floor(g), j = hash22(id);
  float sw = clamp(length(fwidth(g)) * 0.7, 0.02, 0.5), sr = 0.1 + 0.2 * j.x * j.x, sd = length(fract(g) - 0.5 - (j - 0.5) * 0.38);
  vec3 small = fiP[int(j.y * 4.99)];
  small = mix(small, fiP[5], (1.0 - smoothstep(-sw, sw, abs(sd - sr * 0.6) - 0.03)) * step(0.3, j.x));
  float shown = smoothstep(0.0, 5.0 * px, gap), sp = (1.0 - smoothstep(-sw, sw, sd - sr)) * (1.0 - smoothstep(0.25, 0.5, sw)) * step(0.25, fract(j.x * 7.0 + j.y));
  vec3 bare = mix(fiP[5] * 0.97, small, sp * shown);
  g = rot(0.7) * q * 27.0; j = hash22(floor(g));
  sd = length(fract(g) - 0.5 - (j - 0.5) * 0.4) - 0.22 * j.x * j.y - 0.03;
  bare = mix(bare, mix(vec3(0.2, 0.22, 0.24), vec3(0.8, 0.55, 0.15), uKeys), (1.0 - smoothstep(-2.5 * sw, 2.5 * sw, sd)) * (1.0 - smoothstep(0.1, 0.2, sw)) * shown * (1.0 - sp));
  col += left * bare;
  vec3 fresh = mix(mix(uKind[4] * 0.7, vec3(0.45, 0.07, 0.05), 0.5) * (0.8 + 2.0 * hd), fiP[5], (1.0 - smoothstep(0.0, 0.004, abs(hd - 0.1) - 0.003)));
  return mix(col, fresh, hit);
}
vec3 fiSheet(vec2 p) {
  float half_ = min(0.5 * uRes.x / uRes.y, 0.9), px = 1.0 / uRes.y;
  float edge = half_ * 0.76 - 0.12 * p.y + 0.012 * sin(p.y * 7.0 + uTime * 0.06) + 0.006 * (noise(vec2(p.y * 60.0, 1.0)) - 0.5) - p.x;
  vec3 col = fiBath(p, half_);
  // light across the bath, and a window's sheen on it
  float lamp = 0.5 + 0.5 * dot(p, vec2(-0.5, 0.8));
  col = mix(col, vec3(dot(col, vec3(0.333))), 0.1) * (0.74 + 0.36 * lamp);
  vec2 sl = fiSlope(p, uTime) * (0.004 + 0.004 * uMic + 0.003 * uHigh);
  col += 0.05 * fiNet(p * 3.0 + sl * 16.0 + 7.0, uTime) * lamp;
  vec2 s = rot(0.35) * (p - vec2(-0.5 * half_ / 0.9, 0.3)) + sl * 6.0;
  col += (0.07 + 0.08 * uTone) * (1.0 - smoothstep(0.1, 0.22, abs(s.x))) * (1.0 - smoothstep(0.05, 0.17, abs(s.y)));
  float cueAt = dot(p, vec2(0.95, 0.3)) - mix(-0.6, 0.8, 1.0 - uCue);
  col += 0.16 * uCue * exp(-cueAt * cueAt * 40.0);
  // the paper, lifted off at one side: its shadow, its wet edge, the print showing through
  float on = (1.0 - smoothstep(-px, px, edge)), bend = sat(-edge / 0.16);
  col *= 1.0 - 0.5 * exp(-max(edge, 0.0) * 24.0);
  vec3 paper = vec3(0.945, 0.92, 0.865) * (0.72 + 0.3 * smoothstep(0.0, 0.3, bend) - 0.1 * smoothstep(0.4, 1.0, bend)) * (0.975 + 0.04 * noise(p * vec2(60.0, 160.0)));
  paper *= mix(vec3(1.0), 0.42 + 0.64 * col, 0.6 * (1.0 - 0.6 * bend));
  return mix(col, paper, on);
}
vec3 render(vec2 p) { return uVar < 0.5 ? fiRings(p) : fiSheet(p); }
