// name: Floating ink
// a: Breath rings
// b: Drawn comb
// what: A pale basin of water seen from above, black and grey ink floating on it in nests of hair-thin rings, bent like a fingerprint, pushing one another aside and throwing a faint shadow on the bottom; or a full bath of coloured stones, raked and drawn by a comb into scallops, with one swirl and a sheet of wet paper at the side.
// follows: Rings hold the piece from the heart, now, outward, darker where it sounds; drone, pad, phrase each swell a nest, texture clear drops, the low band bends all. In the bath, stones swell with the piece and the spectrum; a kind's colour deepens as it sounds. A hit sets one fresh drop. A cue draws one stroke under a passing light. Space thins ink, keys tint.
// own: 0 1 many fine rings (b: small stones, a fine comb), -1 few and broad; 1 1 bent hard, b combed all over, -1 at rest: rounds only; 2 1 wound into a great swirl, -1 drawn out sideways into strata; 3 the ground: 1 black water with pale ink, -1 water in the drone's colour; 4 1 every ring filled in the kinds' colours, -1 all of it told in dots; 5 1 raised and lit from one side, -1 bled into fibrous paper; 6 1 seen low along the water, -1 wrapped round a ball; 7 1 full (b the sheet lies over half), -1 bare: one nest alone (b few stones, no sheet)
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
float fiLit;       // how the ink just here leans to the lamp
float fiMine() { return max(max(abs(uOwn[3]), abs(uOwn[4])), 0.8 * abs(uOwn[5])); }   // how much of the kinds' own colours
// Where the eye is: p goes to its place on the water; how lit it is there, and how much is not water at all.
vec2 fiEye(inout vec2 p) {
  vec2 r = vec2(1.0, 0.0);
  if (uOwn[6] > 0.0) {
    float z = 0.6 / max(0.6 - p.y, 0.1);
    p = mix(p, vec2(p.x * z * 0.9, 0.36 * (z - 1.0) - 0.22), uOwn[6]);
    r = vec2(1.0, uOwn[6] * smoothstep(2.0, 5.6, z));
  } else {
    const float R = 0.43;
    float d = length(p) / R, z = sqrt(max(1.0 - d * d, 0.0)), px = 1.5 / (uRes.y * R);
    vec2 n = p / R, q = n * (d > 1e-3 ? asin(min(d, 0.999)) / d : 1.0) * 0.5 + vec2(0.12 * sin(uTime * 0.04), 0.0);
    float lit = sat(dot(vec3(n, z), normalize(vec3(-0.6, 0.5, 0.62))) * 0.95 + 0.1);
    r = vec2(mix(1.0, 0.08 + 1.1 * lit, -uOwn[6]), -uOwn[6] * smoothstep(1.0 - px, 1.0 + px, d));
    p = mix(p, d > 1.0 ? n * 0.78 / d : q, -uOwn[6]);
  }
  return r;
}
vec3 fiBeyond(vec2 p, vec3 pale) {
  if (uOwn[6] > 0.0) return mix(pale * 1.05, vec3(0.03, 0.035, 0.05) + 0.1 * uKind[1] * max(-uOwn[3], 0.0), abs(uOwn[3]));
  vec3 back = pale * (0.86 - 0.35 * dot(p, vec2(0.5, -0.6)) - 0.35 * exp(-dot(p - vec2(0.2, -0.25), p - vec2(0.2, -0.25)) * 9.0));
  return mix(back, vec3(0.008, 0.009, 0.014), abs(uOwn[3]));
}
// Bled into paper: each place is drawn a little along a fibre.
vec2 fiBleed(vec2 p) {
  float a = 6.0 * noise(p * 9.0);
  return p - uOwn[5] * (0.013 * (vec2(noise(p * 60.0 + a), noise(p * 60.0 + 31.0)) - 0.5) + 0.009 * (vec2(noise(p * 170.0), noise(p * 170.0 + 9.0)) - 0.5));
}
// Drawn out sideways, or wound up.
vec2 fiDraw(vec2 q) {
  if (uOwn[2] > 0.0) { vec2 v = q - vec2(0.02, -0.01); q += (rot(5.2 * uOwn[2] * exp(-dot(v, v) * 6.0)) * v - v); }
  else q *= 1.0 + uOwn[2] * vec2(0.66, -0.75);
  return q;
}
// All the ink that floats over p: how much, and its colour. `soft` is the blur of a shadow.
vec4 fiInk(vec2 p, float wide, float soft) {
  float t = uTime, px = 1.0 / uRes.y, cue = 4.0 * uCue * (1.0 - uCue), br = 0.7 + 0.5 * uLow, bb = 1.0 + uOwn[1] * (uOwn[1] > 0.0 ? 0.9 : 1.0), few = max(-uOwn[7], 0.0), full = max(uOwn[7], 0.0);
  // breath: shears one after the other, each keeps every area as it is
  vec2 q = p;
  if (uOwn[5] < 0.0) { q = fiBleed(q); soft -= 0.007 * uOwn[5]; }
  if (uOwn[2] != 0.0) q = fiDraw(q);
  br *= bb;
  q.x += 0.1 * bb * sin(q.y * 3.3 + 0.5 + 0.04 * t) + 0.03 * cue * sin(q.y * 9.0);
  q.y += 0.085 * bb * sin(q.x * 3.9 / wide + 2.0 - 0.033 * t) + 0.03 * cue * sin(q.x * 7.0);
  q.x += 0.034 * br * sin(q.y * 10.0 + 2.0 * sin(q.x * 3.0) + 0.06 * t);
  q.y += 0.028 * br * sin(q.x * 12.0 + 2.2 * sin(q.y * 4.0) - 0.05 * t);
  q.x += 0.010 * br * sin(q.y * 27.0 + 3.0 * sin(q.x * 7.0) - 0.07 * t);
  q.y += 0.008 * br * sin(q.x * 31.0 + 3.0 * sin(q.y * 8.0) + 0.08 * t);
  float edge = 1.0, open = 1.0, rim = 0.0, seam = 1.0;
  // clear drops between the rings
  for (int i = 0; i < 4; i++) {
    float fi = float(i), h = hash11(fi + 3.0), h2 = hash11(fi + 11.7);
    vec2 c = vec2((h - 0.5) * 1.1 * wide, (h2 - 0.5) * 0.66) + 0.02 * vec2(sin(t * 0.07 + fi * 2.0), cos(t * 0.06 + fi * 3.0));
    float r = 0.006 + 0.014 * h2 + 0.034 * uTexture * (0.4 + 0.6 * h), d = length(q - c);
    if (few > 0.0) r *= max(1.0 - 1.4 * few, 0.0) + 1e-3;
    if (uOwn[2] < 0.0) r *= max(1.0 + 1.2 * uOwn[2], 0.0) + 1e-3;
    edge = min(edge, smoothstep(0.0, 1.2 * px + 0.4 * soft, abs(d - r)));
    seam = min(seam, smoothstep(0.0, 0.006, abs(d - r) - 1.5 * px));
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
    if (few > 0.0) {
      if (i == 1) { c = mix(c, vec2(0.0), few); r = mix(r, 0.41, few); n *= 1.0 + 0.4 * few; }
      else if (i < 3) { r *= max(1.0 - 1.4 * few, 0.0) + 1e-3; }
      else s *= max(1.0 - 1.3 * few, 0.0);
    }
    if (full > 0.0) { if (i < 3) r *= 1.0 + 0.4 * full; else { r *= 1.0 + 0.5 * full; s += 0.4 * full; n *= 1.0 + 0.4 * full; } }
    if (uOwn[2] < 0.0 && i == 3) r *= 1.0 - 0.6 * uOwn[2];
    n *= exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.9 : 1.7));
    c.x *= wide;
    c += 0.02 * vec2(sin(t * 0.041 + fi * 2.1), cos(t * 0.047 + fi * 1.3));
    a += 0.08 * vec2(sin(t * 0.053 + fi), cos(t * 0.061 + fi * 2.0));
    vec2 v = q - c; float d = length(v);
    if (found < 0.5) {
      edge = min(edge, smoothstep(0.0, (d < r ? 3.0 : 2.2) * px + 0.4 * soft, abs(d - r)));
      seam = min(seam, smoothstep(0.0, 0.016, abs(d - r) - 2.0 * px));
      if (d < r) { found = 1.0; w = fiHeart(v / r, a); count = n; tone = s; row = fi; }
      else { q = fiBack(q, c, r * r); edge *= mix(0.12, 1.0, smoothstep(0.0, 0.06, d - r)); }   // pressed against a newer nest the ink thins away
    }
  }
  // the rings: equal steps of area, ever so slowly pushed outward by the next
  if (uOwn[2] < 0.0) w.x *= 1.0 + 0.85 * uOwn[2];
  float m = sat(dot(w, w)), rad = sqrt(m), x = count * mix(m, rad, 0.5), fw = fwidth(x) + soft * count * 1.5;
  fiLit = 0.0;
  vec2 gx = vec2(0.0);
  if (uOwn[5] > 0.0 || uOwn[4] < 0.0) gx = vec2(dFdx(x), dFdy(x)) * uRes.y;
  x -= uTravel * 0.12;
  float id = mod(floor(x), 89.0), f = fract(x), h = hash11(id + 13.0 * row), h2 = hash11(id * 3.7 + 5.0 * row);
  float at = fract(uLoop - 0.8 * rad), life = noise(q * 5.0 + 3.0 * row);
  vec4 pc = piece(vec2(at, 0.2 + 0.2 * row)) * smoothstep(0.0, 0.05, at) * (1.0 - smoothstep(0.95, 1.0, at));
  float loud = sat(pc.a * (0.6 + 0.5 * uEnergy) + 0.35 * band(rad));
  // some rings a hair, a few broad and black, some left clear
  float duty = (0.15 + 0.66 * h * h * h) * (0.4 + 1.2 * life) * (0.8 + 0.7 * loud) * step(0.12, h2);
  if (row > 2.5) duty = min(duty, 0.2 + 0.25 * h + 0.6 * full);
  if (uOwn[5] > 0.0) duty = mix(duty, 0.5, 0.8 * uOwn[5]);
  float ink = fiLine(f, min(duty, 0.82), fw) * (0.5 + 0.5 * h2) * (0.75 + 0.6 * loud) * mix(0.6, 1.0, f) * tone * (row > 2.5 ? 1.3 : 1.75);
  if (row > 2.5) ink *= smoothstep(0.34, 0.66, noise(q * 2.3 + 4.0) + 0.3 * (h - 0.4) + full);   // the old nest has thinned to nothing in places
  ink *= (1.0 - smoothstep(0.8, 1.0, rad + 0.3 * (life - 0.5))) * found * edge * open * (1.2 - 0.45 * uSpace) * (0.85 + 0.3 * uTone);
  vec3 hue = pc.a > 0.02 ? pc.rgb / pc.a : vec3(0.3);
  vec3 black = mix(vec3(0.06, 0.06, 0.075), hue * 0.4, 0.3 * sat(pc.a * 2.0));
  if (fiMine() > 0.0) black = mix(black, mix(uKind[row < 0.5 ? 3 : row < 1.5 ? 0 : row < 2.5 ? 1 : 2] * (0.35 + 0.4 * h2), hue * 0.6, sat(pc.a)), 0.75 * fiMine());
  if (uOwn[3] < 0.0) black *= 1.0 + 0.6 * uOwn[3];
  if (uOwn[3] > 0.0) black = mix(black, mix(vec3(0.9, 0.87, 0.8), mix(black * 2.4, hue, sat(pc.a)), 0.55) * (0.55 + 0.6 * h2), uOwn[3]);
  if (uOwn[4] > 0.0) {                               // every ring filled
    float h3 = hash11(mod(floor(x) - 1.0, 89.0) + 13.0 * row), to = smoothstep(0.0, clamp(fw, 0.02, 1.0), f), k = row < 0.5 ? 2.6 : row < 1.5 ? 0.3 : row < 2.5 ? 1.0 : 1.4;
    vec3 a = kindColour(mod(k + 2.2 * h, 4.0)) * (0.62 + 0.5 * fract(h * 7.0)), b = kindColour(mod(k + 2.2 * h3, 4.0)) * (0.62 + 0.5 * fract(h3 * 7.0));
    a = mix(b, a, max(to, 1.0 - 20.0 * seam));
    a = mix(a, hue, 0.4 * sat(pc.a * 1.5)) * (0.8 + 0.35 * loud);
    black = mix(black, a, uOwn[4]);
    ink = mix(ink, found * open * mix(0.35 + 0.65 * edge, 1.0, 0.3) * (1.0 - few * smoothstep(0.97, 1.0, rad)) * (row > 2.5 ? 1.0 - few : 1.0), uOwn[4]);
  }
  if (uOwn[4] < 0.0) {                               // told in dots, so many to each ring
    float N = 26.0 + floor(40.0 * h2) + (row > 2.5 ? 60.0 : 0.0), R = row < 0.5 ? 0.17 : row < 1.5 ? 0.3 : row < 2.5 ? 0.18 : 0.84;
    float step_ = TAU * max(rad, 0.02) * R / N, tall = 1.0 / max(length(gx), 1.0), along = (fract(dot(w, w) > 1e-6 ? atan(w.y, w.x) * N / TAU + h * 9.0 : 0.0) - 0.5) * step_;
    float dr = 0.4 * min(tall, 1.3 * step_) * (0.5 + 0.55 * h2 + 0.45 * loud) * (row > 2.5 ? 0.6 + 0.5 * full : 1.0), dd = length(vec2(along, (f - 0.5) * tall)) - dr;
    float dot_ = sat(0.5 - dd / (1.2 * px + soft)) * step(0.12, h2) * tone * 1.5 * found * edge * open * (1.0 - smoothstep(0.85, 1.0, rad)) * (0.6 + 0.4 * h2 + 0.4 * loud) * smoothstep(1.0, 3.0, tall / px) * smoothstep(0.0, 0.5, seam);
    ink = mix(ink, dot_, -uOwn[4]);
  }
  if (uOwn[5] > 0.0) {                               // each ring a ridge, lit from one side
    fiLit = -sin(TAU * f) * dot(gx / max(length(gx), 1e-3), vec2(-0.6, 0.8)) * found * edge * open * seam * (1.0 - smoothstep(0.25, 0.7, fw)) * (row > 2.5 ? mix(1.0, smoothstep(0.75, 0.4, rad), few) * (1.0 - few) : 1.0);
    ink *= 1.0 - 0.5 * uOwn[5] * (1.0 - sat(uOwn[4]));
  }
  // a hit: one fresh drop in the newest heart, its rings black with it; the keys tint that nest
  if (row < 0.5 || ((few > 0.5 || uOwn[6] != 0.0) && row < 1.5)) {
    black = mix(black, vec3(0.6, 0.16, 0.1), 0.8 * uKeys);
    ink = max(ink * (1.0 + uHits), found * open * uHits * (1.0 - smoothstep(-0.02, 0.02, rad - 0.58)) * smoothstep(0.0, 0.06, abs(rad - 0.44)));
    black = mix(black, uKind[4] * 0.3, 0.5 * uHits);
  }
  return vec4(black, sat(max(ink, 0.3 * rim)));
}
vec3 fiRings(vec2 p) {
  float t = uTime, wide = clamp(uRes.x / uRes.y / 1.7, 0.36, 1.15);
  vec2 was = p, see = vec2(1.0, 0.0);
  if (uOwn[6] != 0.0) see = fiEye(p);
  vec2 sl = fiSlope(p, t) * (0.004 + 0.004 * uMic + 0.003 * uHigh);
  // the basin under the water and the light that falls across it
  float lamp = sat(0.6 + 0.55 * dot(p / vec2(max(wide, 0.5), 1.0), vec2(-0.45, 0.6)));
  vec3 col = mix(vec3(0.7, 0.675, 0.63), vec3(0.955, 0.93, 0.87), lamp);
  col += 0.045 * (1.0 - abs(uOwn[5])) * fiNet(p * 4.0 + sl * 20.0, t) * (0.4 + lamp);
  vec3 pale = vec3(0.87, 0.845, 0.8);
  if (uOwn[3] > 0.0) col = mix(col, vec3(0.022, 0.026, 0.036) + 0.05 * uKind[0] * lamp + 0.03 * fiNet(p * 4.0 + sl * 20.0, t), uOwn[3]);
  if (uOwn[3] < 0.0) col = mix(col, (0.05 + uKind[0]) * (0.3 + 0.75 * lamp) + 0.06 * (1.0 - abs(uOwn[5])) * fiNet(p * 4.0 + sl * 20.0, t), -uOwn[3]);
  if (uOwn[5] != 0.0) col *= 1.0 + abs(uOwn[5]) * 0.11 * (noise(p * 210.0) + noise(p * vec2(90.0, 40.0)) - 1.0);
  float deep = 0.014 + 0.018 * uSpace;
  col *= 1.0 - 0.2 * vec3(1.0, 0.96, 0.88) * fiInk(p + deep * vec2(-0.8, 1.0) + sl * 0.3, wide, 0.012 + 0.6 * deep).a;
  vec4 ink = fiInk(p, wide, 0.0);
  col = mix(col, ink.rgb, ink.a);
  if (uOwn[5] > 0.0) col *= 1.0 + uOwn[5] * fiLit * (fiLit > 0.0 ? 0.5 : 0.85);
  if (uOwn[6] != 0.0) col = mix(col * see.x, fiBeyond(was, pale), see.y);
  // sheen: a window on the water
  vec2 s = rot(0.35) * (p - vec2(-0.5 * wide, 0.33)) + sl * 5.0;
  float pane = (1.0 - smoothstep(0.12, 0.2, abs(s.x))) * (1.0 - smoothstep(0.06, 0.16, abs(s.y)));
  col += 0.07 * pane * (1.0 - see.y) * (1.0 - 0.8 * max(abs(uOwn[5]), abs(uOwn[3])));
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
  if (fiMine() > 0.0) for (int k = 0; k < 4; k++) fiP[k] = mix(fiP[k], uKind[k], 0.8 * fiMine());
  if (uOwn[3] > 0.0) { fiP[5] = mix(bone, vec3(0.03, 0.033, 0.042), uOwn[3]); fiP[4] = mix(fiP[4], 0.25 + 0.55 * uKind[4], uOwn[3]); }
  if (uOwn[3] < 0.0) { fiP[5] = mix(bone, uKind[0] * 0.8 + 0.08, -uOwn[3]); fiP[0] = mix(fiP[0], bone, -uOwn[3]); }
}
float fiWave(float x) { x = abs(fract(x) - 0.5) * 2.0; return 1.0 - 2.0 * x * x * (3.0 - 2.0 * x); }
vec3 fiBath(vec2 p, float half_) {
  float t = uTime, px = 1.0 / uRes.y, cue = 4.0 * uCue * (1.0 - uCue);
  fiGrind();
  vec2 q = p;
  if (uOwn[5] < 0.0) q = fiBleed(q);
  if (uOwn[2] != 0.0) q = fiDraw(q);
  // the swirl, drawn last
  vec2 v = q - vec2(-0.2 * half_ / 0.9, -0.14);
  q = q - v + rot(3.6 * (1.0 - max(-uOwn[1], 0.0)) * exp(-dot(v, v) * 30.0)) * v;
  // the comb, strongest to the right
  float along = smoothstep(-0.3, 0.12, q.x), c = abs(fract(q.x * 9.5 + 0.2) - 0.5) * 2.0;
  if (uOwn[0] > 0.0) c = abs(fract(q.x * 9.5 * (1.0 + 0.9 * uOwn[0]) + 0.2) - 0.5) * 2.0;
  if (uOwn[1] > 0.0) along = mix(along, 1.25, uOwn[1]); else along *= 1.0 + uOwn[1];
  q.y += (0.13 + 0.03 * uLow + 0.01 * sin(t * 0.1)) * along * (1.0 - c) * (1.0 - c) + 0.03 * sin(q.x * 5.0 + 0.05 * t);
  // the long rakes before it, there and back
  q.x += 0.13 * along * sin(q.y * 15.0) + 0.04 * sin(q.y * 6.0 + 0.04 * t);
  q.x += 0.14 * cue * exp(-abs(q.y - 0.05) * 14.0);
  // no stone is quite round
  q.x += 0.012 * sin(q.y * 19.0 + 2.0 * sin(q.x * 9.0) + 0.05 * t);
  q.y += 0.012 * sin(q.x * 23.0 + 2.0 * sin(q.y * 11.0) - 0.04 * t);
  // a hit: one fresh drop among the stones
  vec2 ha = vec2(-0.44 * half_ / 0.9, 0.19);
  if (uOwn[6] < 0.0) ha.x -= 0.2 * uOwn[6];
  float hd = length(q - ha) / (1.0 + 0.4 * max(-uOwn[6], 0.0)), hit = (1.0 - smoothstep(-0.004, 0.004, hd - 0.125)) * uHits;
  q = ha + (q - ha) * (1.0 - 1.4 * uHits * (1.0 - uHits) * exp(-hd * hd * 60.0));
  fiLit = 0.0;
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
    if (uOwn[0] != 0.0) r *= uOwn[0] > 0.0 ? 1.0 - 0.58 * uOwn[0] : 1.0 - 0.75 * uOwn[0];
    if (uOwn[7] < 0.0) r *= mix(1.0, smoothstep(0.52, 0.6, fract(h.x * 13.7 + h.y * 5.1)) * 1.15, -uOwn[7]) + 1e-4;
    float there = uOwn[7] < 0.0 ? smoothstep(0.004, 0.012, r) : 1.0;
    vec2 u = q - at; float e = length(u), w = clamp(fwidth(e), px * 0.5, 0.02);
    if (uOwn[4] < 0.0) w = mix(w, 0.003, -uOwn[4]);
    if (uOwn[5] < 0.0) w -= 0.007 * uOwn[5];
    float in_ = (1.0 - smoothstep(-w, w, e - r)) * left;
    if (uOwn[7] < 0.0) in_ *= there;
    if (in_ > 0.002) {
      // a stone is one, two or three drops let into one another, a little off the middle
      float n = length(u + 0.22 * e * (h - 0.5)) / r, o = length(u - r * 0.3 * (h.yx - 0.5)) / r, wn = w / r;
      vec3 paint = fiP[k] * (0.82 + 0.26 * n);
      paint = mix(paint, fiP[5], (1.0 - smoothstep(-wn, wn, abs(n - 0.82) - 0.1 * h.y * h.y)));
      paint = mix(paint, fiP[(k + 1 + int(h.y * 3.0)) % 5], (1.0 - smoothstep(-wn, wn, o - 0.75 * h.x)) * 0.9);
      paint = mix(paint, fiP[5], (1.0 - smoothstep(-wn, wn, o - 0.4 * (h.x - 0.35))));
      if (uOwn[4] > 0.0) {                           // ring within ring
        float x = n * n * (3.0 + floor(5.0 * h.x)) + h.y, b = floor(x), bw = clamp(2.0 * n * 6.0 * wn, 0.02, 0.5);
        vec3 one = fiP[int(5.99 * hash11(b + fi * 3.0))], two = fiP[int(5.99 * hash11(b - 1.0 + fi * 3.0))];
        paint = mix(paint, mix(two, one, smoothstep(0.0, bw, x - b)) * (0.9 + 0.2 * loud), uOwn[4]);
      }
      if (uOwn[5] > 0.0) {                           // a raised drop of glaze
        vec2 dir = u / max(e, 1e-4);
        float n2 = sat(n * n), up = dot(dir, vec2(-0.6, 0.8)), sh = length(u / r - vec2(-0.3, 0.4));
        paint *= 1.0 + uOwn[5] * (0.75 * up * n2 - 0.25 * n2 * n2 + 0.12);
        paint += uOwn[5] * 0.5 * smoothstep(0.24, 0.04, sh);
      }
      col += in_ * paint;
      left -= in_;
    }
    if (uOwn[5] > 0.0) { float away = dot(u / max(e, 1e-4), vec2(0.6, -0.8)); fiLit = max(fiLit, left * exp(-max(e - r, 0.0) * 40.0) * (0.45 + 0.55 * away)); }
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
  if (uOwn[5] > 0.0) bare *= 1.0 - 0.6 * uOwn[5] * fiLit;
  if (uOwn[7] < 0.0) bare = mix(bare, fiP[5] * 0.97, -0.75 * uOwn[7]);
  col += left * bare;
  vec3 fresh = mix(mix(uKind[4] * 0.7, vec3(0.45, 0.07, 0.05), 0.5) * (0.8 + 2.0 * hd), fiP[5], (1.0 - smoothstep(0.0, 0.004, abs(hd - 0.1) - 0.003)));
  return mix(col, fresh, hit);
}
vec3 fiSheet(vec2 p) {
  float half_ = min(0.5 * uRes.x / uRes.y, 0.9), px = 1.0 / uRes.y;
  vec2 was = p, see = vec2(1.0, 0.0), dot_ = vec2(0.0);
  const float cell = 0.0165;
  if (uOwn[6] != 0.0) see = fiEye(p);
  if (uOwn[4] < 0.0) {                               // told in dots
    vec2 g = p / cell * vec2(1.0, 1.1547);
    g.x += 0.5 * mod(floor(g.y), 2.0);
    dot_ = (fract(g) - 0.5) * vec2(1.0, 0.866);
    p += uOwn[4] * dot_ * cell;
  }
  float edge = half_ * 0.76 - 0.12 * p.y + 0.012 * sin(p.y * 7.0 + uTime * 0.06) + 0.006 * (noise(vec2(p.y * 60.0, 1.0)) - 0.5) - p.x;
  vec3 col = fiBath(p, half_);
  if (uOwn[6] != 0.0 || uOwn[7] != 0.0) edge += max(uOwn[6] > 0.0 ? 6.0 * uOwn[6] : -0.9 * uOwn[6], max(-0.9 * uOwn[7], 0.0)) - 0.58 * max(uOwn[7], 0.0);
  if (uOwn[4] < 0.0) {
    float l = dot(col, vec3(0.333)), rim = px / cell;
    float big = 0.2 + 0.3 * abs(l - dot(fiP[5], vec3(0.333)));
    col = mix(col, mix(fiP[5], col, 1.0 - smoothstep(-rim, rim, length(dot_) - clamp(big * 1.35, 0.1, 0.47))), -uOwn[4]);
  }
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
  if (uOwn[6] != 0.0) return mix(mix(col, paper, on) * see.x, fiBeyond(was, vec3(0.88, 0.85, 0.78)), see.y);
  return mix(col, paper, on);
}
vec3 render(vec2 p) { return uVar < 0.5 ? fiRings(p) : fiSheet(p); }
