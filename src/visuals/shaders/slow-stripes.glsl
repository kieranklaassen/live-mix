// name: Slow stripes
// a: Leaning waves
// b: Folded cloth
// what: Broad soft stripes of grey, brick and sea blue on pale paper, swelling and thinning so that the flat sheet seems to roll in slow leaning waves; or the stripes of a hanging cloth, broad and fine by turns, parting and crowding as long folds lean across it and slowly pass.
// follows: Low sound deepens the waves and folds. Each sound dyes and swells the stripes where it lies in the piece; the bands heard set their widths. Pads make them breathe more, textures open fine lines, the melody widens the warm stripes, keys the blue. A hit is a narrow pinch that runs across, a cue a wide one. Tone adds stripes, space opens the waves.
float ssAsp() { return 0.5 * uRes.x / uRes.y; }
// The hit: a narrow pinch that runs from left to right, 1 in its middle.
float ssHit(float s) {
  float d = (s - mix(-0.62, 1.15, 1.0 - uHits) * ssAsp()) / 0.055;
  return uHits * exp(-d * d);
}
// The cue: a wide pinch that opens low on the left and goes up and across.
float ssCue(float s) {
  float d = (s - mix(-0.3, 0.75, 1.0 - uCue)) / 0.24;
  return uCue * exp(-d * d);
}
float ssSwell() { return 4.0 * uCue * (1.0 - uCue); }
// a: the height of the leaning sheet. The waves are tight on the right and open to the left; the top left lies almost flat.
float ssWaves(vec2 p) {
  float t = uTime, deep = 0.55 + 0.35 * uLow + 0.12 * uDrone;
  float x = (p.x + 0.26 * p.x * p.x) * mix(1.08, 0.92, uSpace);
  float calm = smoothstep(-0.7, 0.4, 0.8 * p.x - 0.75 * p.y + 0.12 * sin(t * 0.047));
  float q = 6.4 * x - 4.8 * p.y + 0.5 * sin(p.y * 2.6 + 1.2 * p.x + t * 0.06);
  float w = sin(q + t * 0.095 + 0.32 * sin(q + t * 0.095));
  float roll = sin(2.3 * p.x + 3.1 * p.y - t * 0.071);
  return deep * ((0.016 + 0.084 * calm) * w + 0.026 * roll + 0.014 * ssSwell() * sin(5.0 * p.y + 2.0 * p.x));
}
// b: the height of the hanging cloth: long folds that lean, come and go, broad on the near side and steep on the far one.
float ssFolds(vec2 p) {
  float t = uTime, deep = 0.62 + 0.3 * uLow + 0.08 * uDrone;
  float q = mix(7.4, 6.4, uSpace) * (p.x + 0.42 * p.y + 0.2 * p.y * p.y) + 0.45 * sin(p.y * 2.4 - t * 0.05 + 1.0) - t * 0.075;
  float f = sin(q - 0.38 * sin(q));
  float come = 0.5 + 0.5 * sin(2.1 * p.x - 1.5 * p.y + t * 0.052 + 0.4);
  float g = sin(2.7 * p.x - 2.4 * p.y + t * 0.06);
  return deep * ((0.018 + 0.066 * come) * f + 0.022 * g + 0.012 * ssSwell() * sin(q * 0.5));
}
float ssHeight(vec2 p) { return uVar < 0.5 ? ssWaves(p) : ssFolds(p); }
vec3 render(vec2 p) {
  bool b = uVar > 0.5;
  float e = 0.002, h = ssHeight(p);
  vec2 g = vec2(ssHeight(p + vec2(e, 0.0)) - h, ssHeight(p + vec2(0.0, e)) - h) / e;
  // the light comes from high on the left, in the cloth from the right
  vec3 n = normalize(vec3(-g * 1.3, 1.0));
  float lit = dot(n, normalize(b ? vec3(0.8, 0.3, 0.72) : vec3(-0.5, 0.62, 0.75)));
  float shade = smoothstep(0.0, 1.0, lit);
  float count = b ? mix(19.0, 27.0, uTone) : mix(18.0, 26.0, uTone);
  vec2 ac = b ? p : p.yx; // x across the stripes, y along them
  float ph = count * (ac.x + h) + 120.0;
  float px = length(vec2(dFdx(ph), dFdy(ph)));
  float id = floor(ph), f = ph - id - 0.5;
  // where the middle of this stripe lies, and what the piece holds there, softened along the stripe; each stripe takes the dye a little
  // earlier or later than the next, as tied and dyed threads do
  float mid = ac.x - f / (count * max(0.3, 1.0 + (b ? g.x : g.y)));
  vec4 m = vec4(0.0);
  float late = (hash11(mod(id, 97.0)) - 0.5) * (b ? 0.15 : 0.10);
  for (int i = -2; i <= 2; i++) {
    float o = late + float(i) * 0.02;
    vec2 at = b ? vec2(mid, ac.y + o) : vec2(ac.y + o, mid);
    m += piece(clamp(vec2(at.x / (2.0 * ssAsp()) + 0.5, 0.5 - at.y), 0.02, 0.98));
  }
  m *= 0.2;
  float heard = sat(m.a * (0.65 + uEnergy));
  float run = b ? p.x + 0.5 * p.y : p.x - 0.3 * p.y;
  float hit = ssHit(run), cue = ssCue(p.y * 0.8 + p.x * 0.5);
  float bd = band(abs(fract(id / 32.0) * 2.0 - 1.0));
  // the order the stripes come in: two greys, a warm and a cool colour; in the cloth every second stripe is a fine one
  float c1 = pow(sat(0.5 + 0.5 * cos(TAU * id / 9.0)), 5.0), c2 = pow(sat(0.5 + 0.5 * cos(TAU * (id - 4.0) / 11.0)), 5.0);
  float fine = b ? mod(id, 2.0) : 0.0;
  // how wide the stripe is in its place: thin on the crests, full in the hollows
  float wide = (b ? 0.3 : 0.25) + (b ? 0.06 : 0.17) * (0.6 - shade) + 0.09 * heard + 0.05 * bd;
  wide += (b ? 0.03 : 0.055) * sin(3.2 * ac.y - 4.3 * mid - uTime * 0.11) * (0.8 + 0.7 * uPad); // it breathes
  wide += 0.05 * (c1 * uPhrase + c2 * uKeys) + 0.07 * uMic * exp(-dot(p, p) * 9.0);
  wide *= 1.0 - 0.55 * fine;
  wide *= 1.0 - 0.72 * hit - 0.5 * cue;
  wide = clamp(wide, 0.025, 0.42);
  float soft = px * 0.8 + 0.012;
  float ink = 1.0 - smoothstep(-soft, soft, abs(f) - wide);
  // a fine line opens down the middle of one stripe in four with the textures
  ink *= 1.0 - 0.75 * sat(uTexture * 1.2) * step(abs(mod(id, 4.0) - 2.0), 0.5) * (1.0 - smoothstep(-soft, soft, abs(f) - 0.035));
  ink = mix(ink, 2.0 * wide, smoothstep(0.3, 0.75, px));
  vec3 cool = b ? vec3(0.55, 0.58, 0.63) : vec3(0.53, 0.59, 0.63), warm = b ? vec3(0.70, 0.64, 0.57) : vec3(0.72, 0.67, 0.62);
  vec3 col = mix(cool, warm, 0.5 + 0.5 * cos(TAU * id / 7.0));
  col = mix(col, b ? vec3(0.70, 0.33, 0.28) : vec3(0.82, 0.48, 0.37), c1 * 0.85);
  col = mix(col, b ? vec3(0.24, 0.33, 0.50) : vec3(0.25, 0.48, 0.53), c2 * 0.85);
  // each sound dyes the stripes where it lies: one in three to the full, the two between only a little
  float third = 0.5 + 0.5 * cos(TAU * id / 3.0);
  vec3 dye = m.rgb / max(m.a, 0.001);
  dye = mix(vec3(dot(dye, vec3(0.3, 0.6, 0.1))), dye, b ? 0.76 : 0.88) * 0.84 + 0.08;
  col = mix(col, dye, heard * (b ? 0.12 + 0.78 * third : 0.4 + 0.5 * third));
  col = mix(col, uKind[4] * 0.85, sat(hit * 0.8));
  col *= mix(b ? vec3(0.88, 0.88, 0.91) : vec3(0.80, 0.82, 0.88), vec3(1.09, 1.06, 1.02), shade);
  vec3 ground = b ? mix(vec3(0.82, 0.81, 0.80), vec3(0.95, 0.93, 0.885), shade) : mix(vec3(0.89, 0.885, 0.885), vec3(0.955, 0.94, 0.91), shade);
  ink *= 1.0 - 0.3 * uSpace * smoothstep(-0.1, 0.6, p.y); // far off it pales
  return mix(ground, col, ink);
}
