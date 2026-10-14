// name: Colour field
// a: Fog
// b: Coarse print
// what: The piece laid on wet ground as light under a low fog, looked across from the front of the room to the back: each sound a bank of glowing colour, the far ones small on the horizon, all of them drawn out long in the wet floor; or the same field flat on, made only of grain, like a photograph printed coarse.
// follows: Each stroke of the piece glows in its colour and swells as it plays, melting into its neighbours; the place now playing is a seam of light drifting across, and a hit flares along it; a cue blooms where it fell; in the print the grain is as dense as the field is bright.

// The piece a little softer than it comes, so that strokes melt.
vec4 fiSoft(vec2 uv, float r) {
  vec4 m = piece(uv) * 0.36;
  m += 0.16 * (piece(uv + vec2(r, 0.0)) + piece(uv - vec2(r, 0.0)) + piece(uv + vec2(0.0, r * 0.7)) + piece(uv - vec2(0.0, r * 0.7)));
  return m;
}
// From what the piece holds to light: deep at the edge of a glow, hot at its heart, turning through the hues next to its own.
vec3 fiGlow(vec4 m) {
  float a = m.a;
  vec3 h = m.rgb / max(a, 0.03);
  float l = dot(h, vec3(0.3333));
  h = max(mix(vec3(l), h, 1.9), 0.0);
  h = hueShift(h, (0.42 - a) * 0.13);
  h = max(h, 0.0);
  return h * (a * a * 1.9 + a * 0.16) + vec3(1.0, 0.9, 0.8) * pow(a, 5.0) * 0.5;
}
// The light of the field at a place: x the loop, y the room. soft is how wide it is smeared.
vec3 fiLight(vec2 uv, float soft) {
  float edge = smoothstep(-0.02, 0.1, uv.x) * smoothstep(1.02, 0.9, uv.x) * smoothstep(-0.02, 0.1, uv.y) * smoothstep(1.02, 0.92, uv.y);
  vec4 m = fiSoft(clamp(uv, 0.004, 0.996), soft);
  vec3 col = fiGlow(m);
  // the place now playing: a seam of light
  float dx = uv.x - uLoop;
  float seam = (exp(-dx * dx / (0.00022 + soft * soft * 0.3)) + 0.3 * exp(-dx * dx / 0.006)) * (1.0 + 1.5 * uHits);
  col += (col * 2.2 + fiGlow(vec4(m.rgb, m.a) * 0.6 + vec4(0.02)) * 0.6 + vec3(0.012, 0.013, 0.016)) * seam * (0.5 + 0.8 * uLevel);
  return col * edge;
}

// The colour of the fog over a sound: purer than the piece's own, and turning toward the next hue as it rises.
vec3 fiDeep(vec4 m, float up) {
  vec3 h = m.rgb / max(m.a, 0.04);
  h = max(mix(vec3(dot(h, vec3(0.3333))), h, 1.75), 0.0);
  return max(hueShift(h, -0.03 + 0.045 * min(up, 2.5)), 0.0) * m.a;
}
// A place on the ground as a place in the piece: across is the loop, far is the back of the room.
vec2 fiGround(float x, float z) { return vec2(x / (5.2 + 0.9 * z) + 0.5, 1.0 - log(z / 2.1) / 2.9); }
float fiSeam(float x) { float d = x - uLoop; return (exp(-d * d / 0.00016) + 0.25 * exp(-d * d / 0.004)) * (1.0 + 1.2 * uHits) + 0.5 * uHits * exp(-d * d / 0.012); }
// The field laid on wet ground as light under a low fog, looked across from the front of the room to the back.
vec3 fiFog(vec2 p) {
  float eye = 1.9 + 0.12 * sin(uTime * 0.05);
  vec2 rd = vec2(p.x, p.y - 0.21);
  float jit = hash21(gl_FragCoord.xy + fract(uTime) * 37.0);
  float cx = 0.8 * sin(uTime * 0.043);
  // the ground under this ray: rough where dry, a mirror where water lies
  float zg = rd.y < -0.001 ? min(eye / -rd.y, 60.0) : 60.0;
  vec2 g = vec2(rd.x * zg + cx, zg);
  float pool = smoothstep(0.36, 0.68, noise(g * vec2(0.42, 0.26) + 2.0) * 0.75 + 0.25 * noise(g * 1.3));
  float mirror = rd.y < 0.0 ? mix(0.1, 0.46, pool) : 0.0;
  vec3 col = vec3(0.0);
  float through = 1.0; // how much of what lies further still reaches the eye
  for (int i = 0; i < 12; i++) {
    float z = 2.1 * pow(1.26, float(i) + jit);
    float y = eye + rd.y * z;
    float x = rd.x * z + cx;
    vec2 uv = fiGround(x, z);
    vec4 m = piece(uv) * smoothstep(0.0, 0.07, uv.x) * smoothstep(1.0, 0.93, uv.x); // the ends of the loop fade out
    float thick = 0.14 + 0.04 * z;
    float wisp = noise(vec2(x * 0.5 + uTime * 0.03, z * 0.5 - uTime * 0.05) + y);
    wisp = 0.25 + 2.6 * wisp * wisp;
    // under the ground lies the same fog as the wet floor holds it: drawn out long toward the eye, as wet ground does
    float dens = (y < 0.0 ? exp(y / (thick * 2.6)) * mirror : exp(-y / thick) * wisp) * z * 0.14;
    vec3 e = fiDeep(m, abs(y) / thick);
    col += through * e * (m.a * 2.7 + 0.07) * (1.0 + 3.5 * fiSeam(uv.x)) * dens;
    through *= exp(-m.a * dens * 1.6);
  }
  // the ground itself, lit by the fog over it: grit that catches the light, finer the further off
  if (rd.y < -0.001) {
    vec2 uv = fiGround(g.x, g.y);
    vec4 m = piece(uv);
    float grain = 48.0 / exp2(floor(log2(max(zg, 1.0))));
    vec2 id = floor(g * grain), ff = fract(g * grain) - 0.5;
    vec2 h = hash22(id);
    float speck = smoothstep(0.3, 0.1, length(ff - (h - 0.5) * 0.5)) * step(0.72, h.x) * (0.4 + 0.6 * sin(uTime * (0.4 + h.y) + h.y * 40.0));
    col += through * fiDeep(m, 0.0) * (m.a * 1.6 + 0.2) * (1.0 + 4.0 * fiSeam(uv.x)) * (0.1 + 0.9 * max(speck, 0.0)) * (1.0 - 0.8 * pool) * smoothstep(60.0, 20.0, zg);
  }
  return col;
}

// One layer of grain: a speck in each cell, there if the field is brighter than the cell's own threshold.
vec3 fiSpecks(vec2 uv, float asp, float rows, float seed, float turn) {
  vec2 g = rot(turn) * (uv * vec2(asp, 1.0)) * rows + seed * 13.7;
  vec2 id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  vec2 at = (h - 0.5) * 0.56;
  vec2 c = (rot(-turn) * ((id + 0.5 + at - seed * 13.7) / rows)) / vec2(asp, 1.0); // the place of this speck in the field
  vec3 light = fiLight(c, 0.02);
  float lum = dot(light, vec3(0.4, 0.45, 0.35));
  float dens = 1.0 - exp(-lum * 3.2);
  float th = fract(h.x * 7.31 + h.y * 3.17);
  th = sat(th + 0.07 * sin(uTime * (0.25 + 0.5 * h.y) + h.x * 50.0)); // the grain boils slowly
  float there = smoothstep(th - 0.06, th + 0.1, dens);
  float r = (0.16 + 0.3 * h.y) * there * (0.7 + 0.5 * dens);
  float aa = rows / uRes.y * 1.3;
  float dot_ = smoothstep(r + aa, r - aa, length(f - at)) * step(0.001, there);
  vec3 hue = light / max(lum, 0.02);
  hue = max(hueShift(hue, (h.x - 0.5) * 0.22), 0.0); // each speck its own dye
  return hue * dot_ * (0.5 + 0.9 * dens);
}
vec3 fiPrint(vec2 p) {
  float asp = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / asp * 1.04 + 0.5, 0.5 - p.y * 1.08);
  uv += 0.006 * vec2(sin(uTime * 0.07), cos(uTime * 0.053));
  vec3 col = fiSpecks(uv, asp, 118.0, 1.0, 0.31);
  col += fiSpecks(uv, asp, 171.0, 2.0, -0.52) * 0.8;
  col += fiSpecks(uv, asp, 67.0, 3.0, 1.13) * 0.9;
  // light spreading in the paper behind the brightest grain
  vec3 under = fiLight(uv, 0.06);
  col += hueShift(under, -0.04) * 0.13;
  return col;
}
vec3 render(vec2 p) {
  vec3 col = uVar > 0.5 ? fiPrint(p) : fiFog(p);
  col *= 1.0 - 0.35 * dot(p, p);
  // to the screen with the weight of film: colours stay deep, darks stay down
  vec3 c = screenOf(col);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.3));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.55);
}
