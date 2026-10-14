// name: Grid land
// a: Low flight
// b: Contour map
// what: A low flight down a valley toward a setting sun, the hills on either side drawn in glowing lines and standing as tall as the spectrum is loud; or the piece itself as a land of contour lines seen from above, rolling toward you as the loop plays.
// follows: Each band of the spectrum raises its own ridge, low notes nearest the middle; the sun swells gently with the low band; a hit sends a line of light down the valley; in the contour map each sound is a hill in its own colour where it sits in the piece.
vec3 glDeep(vec3 c) { return c * c * 2.0 + c * 0.12; }
// Variation a: the valley. The ridges stand where the spectrum is loud.
float glValley(vec2 x) {
  float u = abs(x.x) / 9.0;
  float rise = smoothstep(0.06, 0.3, u);
  float lv = band(u);
  float hills = noise(vec2(x.x * 0.3, x.y * 0.2)) * 0.85 + 0.15 * noise(vec2(x.x * 0.8 + 4.0, x.y * 0.7));
  return rise * (0.2 + 2.8 * lv + 0.5 * u) * hills * hills * 1.5;
}
// Lines of a grid at g (in cells), w cells wide on the screen; thin lines far off melt into a glow.
float glLine(float g, float w) {
  float d = abs(fract(g - 0.5) - 0.5);
  return (1.0 - smoothstep(0.02, 0.02 + w, d)) * sat(0.1 / w) + 0.16 * exp(-d * d * 260.0);
}
vec3 glSun(vec3 rd, float low) {
  vec3 col = vec3(0.0);
  vec2 s = vec2(rd.x, rd.y - 0.075) / rd.z;
  float r = length(s), size = 0.2 + 0.018 * low;
  float disc = smoothstep(size, size - 0.004, r) * step(0.0, rd.y);
  float up = (s.y + size) / (2.0 * size); // 0 at the bottom of the sun, 1 at the top
  // the sun's face is the piece in dots: across is the loop, top to bottom is the room
  vec2 g = s / size * 9.0, id = floor(g) + 0.5;
  vec4 pc = piece(vec2(id.x / 18.0 + 0.5, 0.5 - id.y / 18.0));
  float dotR = 0.27 + 0.23 * sqrt(sat(pc.a * 1.3));
  float dots = smoothstep(dotR + 0.06, dotR - 0.06, length(g - id)) * step(length(id / 9.0), 0.97);
  vec3 body = mix(vec3(1.0, 0.03, 0.3), vec3(1.0, 0.6, 0.08), sat(up * 1.1));
  body = mix(body, glDeep(pc.rgb / max(pc.a, 0.02)) * 1.5, sat(pc.a * 1.5));
  col += body * disc * dots * (0.75 + 0.5 * low);
  col += vec3(1.0, 0.2, 0.3) * (0.1 + 0.2 * low) * exp(-max(r - size, 0.0) * 16.0) * (1.0 - disc); // its glow in the air
  col += vec3(0.5, 0.05, 0.3) * 0.12 * exp(-abs(rd.y) * 30.0) * exp(-abs(s.x) * 1.8); // haze along the horizon
  return col;
}
float glStars(vec2 p, float n) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id);
  return pow(h.x, 14.0) * smoothstep(0.08, 0.0, length(f - (h - 0.5) * 0.7)) * 3.0 * (0.7 + 0.3 * sin(uTime * (0.8 + 2.0 * h.y) + h.y * 40.0));
}
vec3 glFlight(vec2 p) {
  float tz = uTravel * 1.6;
  vec3 ro = vec3(0.35 * sin(tz * 0.05), 0.62, tz);
  vec3 rd = normalize(vec3(p.x, p.y - 0.07, 0.9));
  rd.xy = rot(0.03 * sin(uTime * 0.11)) * rd.xy;
  // march to the land
  float t = 0.3, hit = 0.0, back = 0.3;
  for (int i = 0; i < 60; i++) {
    vec3 q = ro + rd * t;
    float d = q.y - glValley(q.xz);
    if (d < 0.0) { hit = 1.0; break; }
    if (t > 70.0) break;
    back = t;
    t += max(d * 0.45, 0.008 * t);
  }
  if (hit > 0.5) for (int i = 0; i < 5; i++) { // find the ground exactly, or the lines on the slopes come out ragged
    float mid = 0.5 * (back + t); vec3 q = ro + rd * mid;
    if (q.y - glValley(q.xz) < 0.0) t = mid; else back = mid;
  }
  vec3 sky = glSun(rd, uLow) + vec3(0.8, 0.85, 1.0) * glStars(rd.xy / rd.z, 30.0) * smoothstep(0.12, 0.3, rd.y) * (0.6 + 0.8 * uHigh);
  if (hit < 0.5) return sky;
  vec3 q = ro + rd * t;
  float h = glValley(q.xz);
  float e = 0.02 + 0.004 * t;
  vec3 n = normalize(vec3(h - glValley(q.xz + vec2(e, 0.0)), e, h - glValley(q.xz + vec2(0.0, e))));
  float px = t / (uRes.y * 0.9); // the size of a pixel out there
  float gx = glLine(q.x * 2.5, px * 2.5 * 1.5), gz = glLine(q.z * 2.5, px * 2.5 * 1.5 / max(abs(dot(rd, n)), 0.08));
  float lines = max(gx, gz);
  float u = abs(q.x) / 9.0;
  vec3 hue = mix(glDeep(kindColour(u * 4.4)), vec3(1.0, 0.25, 0.6), sat(h * 0.5)); // each ridge in its own colour, hot at the top
  // a hit runs a line of light toward us down the valley; a cue runs one away
  float wave = sqrt(uHits) * exp(-pow((q.z - ro.z - 2.0 - 22.0 * uHits) * 0.7, 2.0)) + sqrt(uCue) * exp(-pow((q.z - ro.z - 36.0 * (1.0 - uCue)) * 0.6, 2.0));
  vec3 col = hue * lines * (0.15 + 0.35 * sat(h * 0.9) + 0.25 * uLevel + 4.0 * wave);
  col += vec3(1.0, 0.8, 0.9) * wave * (0.22 + 1.6 * lines);
  // the ground has a sheen: it takes the low sun
  vec3 rf = reflect(rd, normalize(n + vec3(0.0, 2.5, 0.0)));
  col += glSun(rf, uLow) * 0.1 * (1.0 - 0.6 * lines);
  col += hue * 0.004 * sat(h); // a breath of light on the slopes, so the hills have body
  float fog = exp(-t * 0.03);
  return col * fog + vec3(0.5, 0.05, 0.3) * 0.03 * (1.0 - fog);
}
// Variation b: the piece as land. The loop runs away from us; now is the bright line.
const float glLoop = 44.0;
float glTile(vec2 p, float period) { // noise that comes round again every period along y
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, period), y1 = mod(i.y + 1.0, period);
  return mix(mix(hash21(vec2(i.x, y0)), hash21(vec2(i.x + 1.0, y0)), f.x), mix(hash21(vec2(i.x, y1)), hash21(vec2(i.x + 1.0, y1)), f.x), f.y);
}
vec4 glPiece(vec2 x) { // x.x across the room, x.y along the loop from now
  vec2 uv = vec2(fract(uLoop + (x.y - 5.0) / glLoop), x.x / 16.0 + 0.5);
  vec4 pc = piece(uv);
  float seam = max(smoothstep(0.03, 0.0, uv.x), smoothstep(0.97, 1.0, uv.x));
  if (seam > 0.0) pc = mix(pc, 0.5 * (piece(vec2(0.01, uv.y)) + piece(vec2(0.99, uv.y))), seam);
  return pc;
}
float glLand(vec2 x) {
  float zw = uLoop * glLoop + x.y - 5.0;
  float rough = glTile(vec2(x.x * 0.5, zw * 0.5), glLoop * 0.5) * 0.7 + 0.3 * glTile(vec2(x.x * 1.25 + 3.0, zw * 1.25), glLoop * 1.25);
  float a = glPiece(x).a;
  return a * (1.3 + 1.6 * a) * (0.45 + 0.9 * rough) + 0.22 * rough;
}
vec3 glMap(vec2 p) {
  vec3 ro = vec3(0.0, 5.2, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y, 0.95));
  rd.yz = rot(-0.52) * rd.yz;
  float t = 1.5, hit = 0.0;
  for (int i = 0; i < 56; i++) {
    vec3 q = ro + rd * t;
    float d = q.y - glLand(q.xz);
    if (d < 0.004 * t) { hit = 1.0; break; }
    if (t > 60.0) break;
    t += max(d * 0.4, 0.008 * t);
  }
  if (hit < 0.5) return vec3(0.8, 0.85, 1.0) * glStars(rd.xy / max(rd.z, 0.1), 30.0) * step(0.0, rd.y);
  vec3 q = ro + rd * t;
  float h = glLand(q.xz);
  float e = 0.03 + 0.003 * t;
  vec2 grad = vec2(glLand(q.xz + vec2(e, 0.0)) - h, glLand(q.xz + vec2(0.0, e)) - h) / e;
  vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
  float px = t / (uRes.y * 0.95) / max(abs(dot(rd, n)), 0.15);
  // contour lines: one every step of height, as wide on the screen wherever the slope
  const float stepH = 0.2;
  float w = px * length(grad) / stepH + 1e-4; // one pixel, as a part of the gap between two lines
  float d = abs(fract(h / stepH - 0.5) - 0.5);
  float line = (1.0 - smoothstep(0.25 * w, 1.0 * w, d)) * sat(0.3 / w);
  float major = (1.0 - smoothstep(0.1 * w, 0.4 * w, abs(fract(h / (stepH * 4.0) - 0.5) - 0.5))) * sat(1.2 / w);
  vec4 pc = glPiece(q.xz);
  vec3 hue = glDeep(pc.rgb / max(pc.a, 0.02));
  vec3 ink = mix(vec3(0.05, 0.14, 0.24), hue, sat(pc.a * 5.0)) * (0.3 + 1.5 * sat(h * 0.5) + 1.2 * pc.a);
  vec3 col = ink * (line + 0.9 * major);
  col += hue * pc.a * pc.a * 0.03 * sat(dot(n, normalize(vec3(-0.4, 0.5, -0.6))) * 2.0); // the lit side of a sounding hill glows a little
  // now: a line across the land where the loop is, and what it touches lights up
  float now = exp(-pow((q.z - 5.0) * 2.2, 2.0));
  col += (vec3(0.9, 0.95, 1.0) * 0.1 + hue * 1.5 * pc.a) * now * (0.04 + line + major) + vec3(0.9, 0.95, 1.0) * 0.25 * exp(-pow((q.z - 5.0) * 14.0, 2.0));
  // a hit or a cue: a ring of light going out over the land from the middle of the line
  float ring = length(q.xz - vec2(0.0, 5.0)), out_ = max(uHits, uCue);
  col += (vec3(1.0, 0.85, 0.8) * 0.3 + ink) * out_ * exp(-pow((ring - 22.0 * (1.0 - out_)) * 0.8, 2.0)) * (0.15 + 1.6 * (line + major));
  return col * exp(-t * 0.028);
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? glFlight(p) : glMap(p));
}
