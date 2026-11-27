// name: Grid land
// a: Low flight
// b: Contour map
// what: A low flight down a valley toward a setting sun, the hills on either side drawn in glowing lines and standing as tall as the spectrum is loud; or the piece itself as a land of contour lines seen from above, rolling toward you as the loop plays.
// follows: Each band of the spectrum raises its own ridge, low notes nearest the middle; the sun swells gently with the low band; a hit sends a line of light down the valley; in the contour map each sound is a hill in its own colour where it sits in the piece.
// own: 0 the land: 1 cut in steps and flat tops, -1 blown into dunes; 1 its lie: 1 wide open and low, -1 many peaks standing apart; 2 how it is drawn: 1 in dots, -1 in lines across only; 3 the ground: 1 pale paper by day with the lines in ink, -1 solid land in the colours of the kinds, lit from one side; 4 1 many fine lines, -1 few and broad; 5 the eye: 1 high up looking down, -1 low along the ground; 6 the sun: 1 a great one half risen, -1 a thin moon to one side; 7 1 water lies in the low land and mirrors, -1 mist lies there
vec3 glDeep(vec3 c) { return c * c * 2.0 + c * 0.12; }
// A world of its own: any of the own numbers brings in the colours of the kinds where the plain picture has its pinks.
#define glAny sat(4.0 * max(max(max(abs(uOwn[0]), abs(uOwn[1])), max(abs(uOwn[2]), abs(uOwn[3]))), max(max(abs(uOwn[4]), abs(uOwn[5])), max(abs(uOwn[6]), abs(uOwn[7])))))
#define glPale max(uOwn[3], 0.0)
#define glSolid max(-uOwn[3], 0.0)
#define glMany exp2(uOwn[4] * 1.2)
float glStep(float h, float s) { float k = h / s, i = floor(k); return (i + smoothstep(0.6, 1.0, k - i)) * s; }
float glCrest(float w) { float f = fract(w), t = min(f / 0.7, (1.0 - f) / 0.3); return t * t; }
// Variation a: the valley. The ridges stand where the spectrum is loud.
float glValley(vec2 x) {
  float u = abs(x.x) / 9.0;
  float rise = smoothstep(0.06, 0.3, u);
  float lv = band(u);
  if (uOwn[1] > 0.0) { u *= 1.0 - 0.62 * uOwn[1]; rise = smoothstep(0.06, 0.3, u); }
  float hills = noise(vec2(x.x * 0.3, x.y * 0.2)) * 0.85 + 0.15 * noise(vec2(x.x * 0.8 + 4.0, x.y * 0.7));
  float h = rise * (0.2 + 2.8 * lv + 0.5 * u) * hills * hills * 1.5;
  if (uOwn[1] > 0.0) h *= 1.0 - 0.3 * uOwn[1];
  if (uOwn[1] < 0.0) {
    float pk = noise(x * 0.55 + 7.3);
    h = mix(h, smoothstep(0.03, 0.16, u) * (1.2 + 2.6 * lv) * 1.9 * pk * pk * pk * (0.75 + 0.4 * noise(x * 1.7)), -uOwn[1]);
  }
  if (uOwn[0] < 0.0) {
    float w = x.y * 0.2 + x.x * 0.17 + 1.3 * noise(x * vec2(0.2, 0.13)) + 0.01 * uTime;
    h = mix(h, (0.5 + 0.5 * rise) * ((0.5 + 1.5 * mix(uBands[1], lv, rise)) * glCrest(w) + 0.14 * glCrest(w * 2.0 + 1.5 * noise(x * 0.4 + 9.0)) * lv * rise + 0.3 * u * rise), -uOwn[0]);
  }
  if (uOwn[0] > 0.0) h = mix(h, glStep(h, 0.36), uOwn[0]);
  return h;
}
// Lines of a grid at g (in cells), w cells wide on the screen; thin lines far off melt into a glow.
float glLine(float g, float w) {
  float d = abs(fract(g - 0.5) - 0.5);
  return (1.0 - smoothstep(0.02, 0.02 + w, d)) * sat(0.1 / w) + 0.16 * exp(-d * d * 260.0);
}
vec3 glSun(vec3 rd, float low) {
  vec3 col = vec3(0.0);
  vec2 s = vec2(rd.x, rd.y - 0.075) / (glAny > 0.0 ? max(rd.z, 0.05) : rd.z);
  float size = 0.2 + 0.018 * low, moon = max(-uOwn[6], 0.0);
  if (uOwn[6] > 0.0) size *= 1.0 + 1.1 * uOwn[6];
  if (moon > 0.0) { s -= moon * vec2(-0.13, 0.26); size = mix(size, 0.062 + 0.006 * low, moon); }
  float r = length(s);
  float disc = smoothstep(size, size - 0.004, r) * step(0.0, rd.y);
  float up = (s.y + size) / (2.0 * size); // 0 at the bottom of the sun, 1 at the top
  // the sun's face is the piece in dots: across is the loop, top to bottom is the room
  vec2 g = s / size * 9.0, id = floor(g) + 0.5;
  vec4 pc = piece(vec2(id.x / 18.0 + 0.5, 0.5 - id.y / 18.0));
  float dotR = 0.27 + 0.23 * sqrt(sat(pc.a * 1.3));
  float dots = smoothstep(dotR + 0.06, dotR - 0.06, length(g - id)) * step(length(id / 9.0), 0.97);
  vec3 body = mix(vec3(1.0, 0.03, 0.3), vec3(1.0, 0.6, 0.08), sat(up * 1.1));
  body = mix(body, glDeep(pc.rgb / max(pc.a, 0.02)) * 1.5, sat(pc.a * 1.5));
  vec3 glowing = vec3(1.0, 0.2, 0.3), haze = vec3(0.5, 0.05, 0.3);
  if (glAny > 0.0) {
    vec3 face = mix(glDeep(uKind[4]), glDeep(uKind[3]), sat(up)) * 1.1;
    face = mix(face, glDeep(pc.rgb / max(pc.a, 0.02)) * 1.2, 0.6 * sat(pc.a * 1.5));
    body = mix(body, face, glAny);
    glowing = mix(glowing, glDeep(uKind[4]), glAny); haze = mix(haze, glDeep(uKind[1]) * 0.8, glAny);
    if (moon > 0.0) {                  // a moon is a thin bow of light, with no piece on it
      float lit = smoothstep(-0.08, 0.08, (length(s - size * vec2(0.5, 0.28)) / size - 0.96));
      dots = mix(dots, lit + 0.03, moon); body = mix(body, mix(vec3(1.0), uKind[3], 0.3) * 1.6, moon); glowing *= 1.0 - 0.65 * moon;
    }
    if (glPale > 0.0) { disc *= rd.y < 0.0 ? 0.0 : 1.0; dots = mix(dots, 0.25 + 0.75 * dots, glPale); glowing *= 1.0 - glPale; haze *= 1.0 - glPale; }
  }
  col += body * disc * dots * (0.75 + 0.5 * low);
  col += glowing * (0.1 + 0.2 * low) * exp(-max(r - size, 0.0) * 16.0) * (1.0 - disc); // its glow in the air
  col += haze * 0.12 * exp(-abs(rd.y) * 30.0) * exp(-abs(s.x) * 1.8); // haze along the horizon
  return col;
}
float glStars(vec2 p, float n) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id);
  return pow(h.x, 14.0) * smoothstep(0.08, 0.0, length(f - (h - 0.5) * 0.7)) * 3.0 * (0.7 + 0.3 * sin(uTime * (0.8 + 2.0 * h.y) + h.y * 40.0));
}
// The sky of another world; night is the sky as it was.
vec3 glSky(vec3 rd, vec3 night) {
  float up = sat(max(rd.y, 0.0) * 1.9);
  vec3 c = night;
  if (glSolid > 0.0) {
    vec3 dusk = mix(glDeep(uKind[1]) * 0.55 + 0.03, glDeep(uKind[0]) * 0.18 + 0.006, sqrt(up));
    c = mix(c, dusk + night * vec3(1.0), glSolid);
  }
  if (glPale > 0.0) {
    vec3 day = mix(mix(vec3(1.0, 0.98, 0.95), uKind[1], 0.16) * 1.75, mix(vec3(1.0), uKind[0], 0.4) * 1.35, up * (2.0 - up));
    float l = sat(dot(night, vec3(0.4)) * 1.6);
    c = mix(c, mix(day, (night + 0.02) * 1.15, l), glPale);
  }
  return c;
}
// The land as a thing that is lit, for the pale and the solid ground. loud: how much of the sound's own colour lies there.
vec3 glBody(vec3 was, vec3 n, float h, float lines, float lit, vec3 hue, float loud, float wave, vec2 x) {
  const vec3 lamp = vec3(-0.62, 0.5, 0.6);
  float diff = sat(dot(n, normalize(lamp))) * lit;
  vec3 c = was;
  if (glSolid > 0.0) {
    float grain = noise(x * 9.0) * 0.5 + noise(x * 31.0) * 0.5;
    vec3 alb = kindColour(sat(h * 0.42 + 0.12 * (grain - 0.5) + 0.3 * (n.y - 0.75)) * 3.0);
    alb = mix(alb * alb, hue, 0.45 * loud) * (0.82 + 0.36 * grain);
    vec3 land = alb * (0.05 + 0.09 * n.y) * (uKind[1] + 0.5) + alb * diff * 2.2 * (0.6 + uKind[4] * 0.6);
    land *= 1.0 - 0.4 * lines;
    land += was * 0.05 + glDeep(uKind[4]) * wave * (0.35 + 1.2 * lines);
    c = mix(c, land, glSolid);
  }
  if (glPale > 0.0) {
    vec3 sheet = vec3(1.0, 0.975, 0.94) * (0.6 + 1.25 * diff) * (0.97 + 0.05 * noise(x * 14.0));
    sheet *= mix(vec3(1.0), 0.35 + 0.75 * sqrt(hue / (max(hue.r, max(hue.g, hue.b)) + 0.02) + 0.02), 0.5 * loud);
    vec3 ink = hue * 0.16 + 0.015;
    vec3 day = mix(sheet, ink, sat(lines * (1.35 + 0.4 * loud)));
    day = mix(day, uKind[4] * uKind[4] * 0.8, sat(wave * (0.9 + lines)) * 0.85);
    c = mix(c, day, glPale);
  }
  return c;
}
float glSeaAt() { return mix(-0.5, 0.2 + 0.25 * uVar, max(uOwn[7], 0.0)); }
vec3 glHorizon() { return glSky(vec3(0.0, 0.02, 1.0), glDeep(uKind[1]) * 0.035); }
// The mist that lies in the low land, up to a place t along the way.
vec3 glMisty(vec3 col, vec3 ro, vec3 rd, float t, float top, vec2 drift) {
  float f = 2.2 / top, dy = max(rd.y * t, -ro.y), k = abs(dy) < 0.02 ? t : t * (1.0 - exp(-dy * f)) / (dy * f);
  float d = (0.55 + 0.5 * uVar) * exp(-ro.y * f) * k;
  vec2 x = ro.xz + rd.xz * t;
  d *= mix(1.0, 0.25 + 1.5 * noise((x + drift) * 0.35), smoothstep(30.0, 8.0, t));
  vec3 c = mix(glDeep(uKind[1]) * 0.3 + 0.03, glHorizon() * 1.1, max(glPale, glSolid));
  return mix(col, c, (1.0 - exp(-d)) * -uOwn[7]);
}
float glLand(vec2 x);
float glHeight(vec2 x, float map) { return map < 0.5 ? glValley(x) : glLand(x); }
float glShade(vec3 q, float map) { // how much of the lamp gets there
  float s = 1.0, t = 0.12;
  int i = 0;
  do {
    vec3 r = q + normalize(vec3(-0.62, 0.5, 0.6)) * t;
    s = min(s, sat(0.5 + (r.y - glHeight(r.xz, map)) / (0.16 * t + 0.02)));
    t *= 1.7;
  } while (++i < 7);
  return s * s * (3.0 - 2.0 * s);
}
// Still water in the low land: it mirrors the sky and what stands behind it.
vec3 glWater(vec3 col, vec3 ro, vec3 rd, float t, float map) {
  if (uOwn[7] <= 0.0 || rd.y > -0.002) return col;
  float sea = glSeaAt(), tw = (sea - ro.y) / rd.y;
  if (tw >= t && t < 59.0) return col;
  vec3 q = ro + rd * tw;
  float deep = smoothstep(0.0, 0.1, sea - glHeight(q.xz, map)), near = exp(-tw * 0.07);
  vec2 rip = vec2(noise(q.xz * vec2(3.0, 7.0) + vec2(0.0, uTime * 0.35)) - 0.5, noise(q.xz * vec2(2.3, 6.0) - vec2(uTime * 0.25, 9.0)) - 0.5) * (0.012 + 0.05 * near) * (0.6 + 0.7 * uLow);
  vec3 rf = reflect(rd, normalize(vec3(rip.x, 1.0, rip.y))); rf.y = max(rf.y, 0.01);
  vec3 up = glSky(rf, glSun(rf, uLow)), land = glHorizon();
  float k = 0.12, met = 0.0;
  int i = 0;
  do {
    vec3 r = q + rf * k;
    float d = r.y - glHeight(r.xz, map);
    if (d < 0.0) { met = exp(-k * 0.05); land = mix(glDeep(kindColour(sat(r.y * 0.4) * 3.0)) * mix(0.2, 0.5, glSolid), vec3(0.75, 0.74, 0.72), glPale); break; }
    k += max(d * 0.7, 0.06 + 0.2 * k);
  } while (++i < 10);
  up = mix(up, land, met);
  float fres = 0.25 + 0.75 * pow(1.0 - sat(-rd.y), 3.0);
  vec3 water = mix(glDeep(uKind[0]) * mix(0.1, 0.5, glPale) + col * 0.15, up, fres);
  float ring = map < 0.5 ? (q.z - ro.z - 2.0 - 8.0 * uHits) * 0.25 : (length(q.xz - vec2(0.0, 5.0)) - 22.0 * (1.0 - uHits)) * 0.5;
  water += glDeep(uKind[4]) * 0.3 * sqrt(uHits) * exp(-ring * ring);
  return mix(col, mix(glHorizon(), water, exp(-tw * tw * 0.0007)), deep * sat(uOwn[7] * 3.0));
}
float glDots(vec2 g, vec2 w, float r) {
  float d = length(abs(fract(g - 0.5) - 0.5)), k = max(w.x, w.y) + 0.02, far = smoothstep(0.25, 0.8, k);
  return mix(smoothstep(r + k, r - k, d) * min(1.0, 2.0 * r / k), 3.1 * r * r, far);
}
vec3 glFlight(vec2 p) {
  float tz = uTravel * 1.6;
  vec3 ro = vec3(0.35 * sin(tz * 0.05), 0.62, tz);
  vec3 rd = normalize(vec3(p.x, p.y - 0.07, 0.9));
  rd.xy = rot(0.03 * sin(uTime * 0.11)) * rd.xy;
  if (uOwn[5] > 0.0) { ro.y += 4.4 * uOwn[5]; rd.yz = rot(-0.62 * uOwn[5]) * rd.yz; }
  if (uOwn[5] < 0.0) { ro.y += 0.34 * uOwn[5]; rd.yz = rot(-0.09 * uOwn[5]) * rd.yz; }
  if (uOwn[1] < 0.0 || uOwn[0] < 0.0 || uOwn[7] < 0.0) ro.y += max(max(-0.35 * uOwn[1], -0.9 * uOwn[0]), -0.5 * uOwn[7]);
  // march to the land
  float t = 0.3, hit = 0.0, back = 0.3;
  int i = 0;
  do {
    vec3 q = ro + rd * t;
    float d = q.y - glValley(q.xz);
    if (d < 0.0) { hit = 1.0; break; }
    if (t > 70.0) break;
    back = t;
    t += max(d * 0.45, 0.008 * t);
  } while (++i < 60);
  i = 0;
  if (hit > 0.5) do { // find the ground exactly, or the lines on the slopes come out ragged
    float mid = 0.5 * (back + t); vec3 q = ro + rd * mid;
    if (q.y - glValley(q.xz) < 0.0) t = mid; else back = mid;
  } while (++i < 5);
  vec3 sky = glSun(rd, uLow) + vec3(0.8, 0.85, 1.0) * glStars(rd.xy / rd.z, 30.0) * smoothstep(0.12, 0.3, rd.y) * (0.6 + 0.8 * uHigh) * (1.0 - glPale);
  if (glAny > 0.0) sky = glSky(rd, sky);
  if (hit < 0.5) { if (uOwn[7] == 0.0) return sky; t = 70.0; }
  vec3 q = ro + rd * t;
  float h = glValley(q.xz);
  float e = 0.02 + 0.004 * t;
  vec3 n = normalize(vec3(h - glValley(q.xz + vec2(e, 0.0)), e, h - glValley(q.xz + vec2(0.0, e))));
  float px = t / (uRes.y * 0.9); // the size of a pixel out there
  float gx = glLine(q.x * 2.5 * glMany, px * 2.5 * glMany * 1.5), gz = glLine(q.z * 2.5 * glMany, px * 2.5 * glMany * 1.5 / max(abs(dot(rd, n)), 0.08));
  float lines = max(gx, gz);
  if (uOwn[2] < 0.0) lines = mix(lines, gz, -uOwn[2]);
  if (uOwn[2] > 0.0) lines = mix(lines, 1.2 * glDots(q.xz * 2.5 * glMany, px * 2.5 * glMany * vec2(1.0, 1.0 / max(abs(dot(rd, n)), 0.1)), 0.11 + 0.14 * band(abs(q.x) / 9.0)), uOwn[2]);
  float u = abs(q.x) / 9.0;
  vec3 hue = mix(glDeep(kindColour(u * 4.4)), glAny > 0.0 ? mix(vec3(1.0, 0.25, 0.6), glDeep(uKind[3]), glAny) : vec3(1.0, 0.25, 0.6), sat(h * 0.5)); // each ridge in its own colour, hot at the top
  // a hit runs a line of light toward us down the valley; a cue runs one away
  float wave = sqrt(uHits) * exp(-pow((q.z - ro.z - 2.0 - 22.0 * uHits) * 0.7, 2.0)) + sqrt(uCue) * exp(-pow((q.z - ro.z - 36.0 * (1.0 - uCue)) * 0.6, 2.0));
  float lies = 0.0;
  if (uOwn[6] < 0.0) {               // no sun to carry the piece: it lies on the land, the loop across and the room going away
    vec4 pc = piece(vec2(q.x / 13.0 + 0.5, 1.0 - (q.z - ro.z - 0.5) / 15.0));
    lies = -uOwn[6] * sat(pc.a * 1.4);
    hue = mix(hue, glDeep(pc.rgb / max(pc.a, 0.02)) * 1.2, lies);
  }
  vec3 col = hue * lines * (0.15 + 0.35 * sat(h * 0.9) + 0.25 * uLevel + 4.0 * wave + 0.9 * lies);
  col += (glAny > 0.0 ? mix(vec3(1.0, 0.8, 0.9), uKind[4], glAny) : vec3(1.0, 0.8, 0.9)) * wave * (0.22 + 1.6 * lines);
  // the ground has a sheen: it takes the low sun
  vec3 rf = reflect(rd, normalize(n + vec3(0.0, 2.5, 0.0)));
  col += glSun(rf, uLow) * 0.1 * (1.0 - 0.6 * lines);
  col += hue * 0.004 * sat(h); // a breath of light on the slopes, so the hills have body
  float fog = exp(-t * 0.03);
  if (glAny == 0.0) return col * fog + vec3(0.5, 0.05, 0.3) * 0.03 * (1.0 - fog);
  float wide = wave + 0.6 * sqrt(uHits) * exp(-pow((q.z - ro.z - 2.0 - 8.0 * uHits) * 0.25, 2.0));
  if (max(glPale, glSolid) > 0.0) col = glBody(col, n, h, lines, glShade(q, 0.0), hue, sat(0.5 * band(u) + 0.25 * uLevel + lies), wide, q.xz);
  vec3 air = mix(vec3(0.5, 0.05, 0.3) * 0.03, glHorizon(), glAny);
  col = mix(air, col, mix(fog, exp(-t * t * 0.0009), max(glPale, glSolid)));
  if (hit < 0.5) col = sky;
  col = glWater(col, ro, rd, t, 0.0);
  return uOwn[7] < 0.0 ? glMisty(col, ro, rd, t, 0.55, vec2(uTime * 0.1, 0.0)) : col;
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
  float h = a * (1.3 + 1.6 * a) * (0.45 + 0.9 * rough) + 0.22 * rough;
  if (uOwn[1] > 0.0) h *= 1.0 - 0.62 * uOwn[1];
  if (uOwn[1] < 0.0) {
    float pk = glTile(vec2(x.x * 0.75 + 5.0, zw * 0.75), glLoop * 0.75);
    h = mix(h, (0.7 + 3.0 * a) * pk * pk * pk * (0.7 + 0.6 * rough) * 1.5 + 0.1 * rough, -uOwn[1]);
  }
  if (uOwn[0] < 0.0) {
    float w = zw * (9.0 / glLoop) + x.x * 0.17 + 1.2 * glTile(vec2(x.x * 0.25, zw * 0.25), glLoop * 0.25);
    h = mix(h, (0.35 + 2.2 * a) * glCrest(w) + 0.5 * a, -uOwn[0]);
  }
  if (uOwn[7] > 0.0) { float isle = glTile(vec2(x.x * 0.25 + 2.0, zw * 0.25), glLoop * 0.25) * 0.75 + 0.25 * rough; h += uOwn[7] * 1.15 * smoothstep(0.35, 0.95, isle); }
  if (uOwn[0] > 0.0) h = mix(h, glStep(h, 0.4), uOwn[0]);
  if (uOwn[5] < 0.0) h *= 1.0 + uOwn[5] * 0.85 * exp(-dot(x, x) * 0.14);
  return h;
}
vec3 glMap(vec2 p) {
  vec3 ro = vec3(0.0, 5.2, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y, 0.95));
  if (uOwn[5] > 0.0) ro += uOwn[5] * vec3(0.0, 2.8, 3.0);
  if (uOwn[5] < 0.0) ro.y += 3.4 * uOwn[5];
  rd.yz = rot(-0.52 - 0.8 * max(uOwn[5], 0.0) + max(0.44 * max(-uOwn[5], 0.0), 0.3 * abs(uOwn[6]) * (1.0 - abs(uOwn[5])))) * rd.yz;
  float t = 1.5, hit = 0.0, back = 1.5;
  int i = 0;
  do {
    vec3 q = ro + rd * t;
    float d = q.y - glLand(q.xz);
    if (d < 0.004 * t) { hit = 1.0; break; }
    if (t > 60.0) break;
    back = t;
    t += max(d * (0.4 + 0.12 * glSolid * max(uOwn[0], 0.0)), 0.008 * t);
  } while (++i < 56);
  vec3 over = vec3(0.0);
  if (glAny > 0.0) {
    i = 0;
    if (hit > 0.5) do {
      float mid = 0.5 * (back + t); vec3 m = ro + rd * mid;
      if (m.y - glLand(m.xz) < 0.0) t = mid; else back = mid;
    } while (++i < 9);
    if (hit < 0.5) {
      vec3 sky = glSky(rd, glSun(rd, uLow) + vec3(0.8, 0.85, 1.0) * glStars(rd.xy / max(rd.z, 0.1), 30.0) * smoothstep(0.02, 0.2, rd.y) * (1.0 - glPale));
      sky = mix(vec3(0.0), sky, glAny);
      if (uOwn[7] == 0.0) return sky;
      t = 60.0; over = sky;
    }
  }
  if (glAny == 0.0 && hit < 0.5) return vec3(0.8, 0.85, 1.0) * glStars(rd.xy / max(rd.z, 0.1), 30.0) * step(0.0, rd.y);
  vec3 q = ro + rd * t;
  float h = glLand(q.xz);
  float e = 0.03 + 0.003 * t;
  vec2 grad = vec2(glLand(q.xz + vec2(e, 0.0)) - h, glLand(q.xz + vec2(0.0, e)) - h) / e;
  vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
  float px = t / (uRes.y * 0.95) / max(abs(dot(rd, n)), 0.15);
  // contour lines: one every step of height, as wide on the screen wherever the slope
  float stepH = 0.2 / glMany;
  float w = px * length(grad) / stepH + 1e-4; // one pixel, as a part of the gap between two lines
  float d = abs(fract(h / stepH - 0.5) - 0.5);
  float line = (1.0 - smoothstep(0.25 * w, 1.0 * w, d)) * sat(0.3 / w);
  float major = (1.0 - smoothstep(0.1 * w, 0.4 * w, abs(fract(h / (stepH * 4.0) - 0.5) - 0.5))) * sat(1.2 / w);
  vec4 pc = glPiece(q.xz);
  vec3 hue = glDeep(pc.rgb / max(pc.a, 0.02));
  if (uOwn[0] > 0.0) { float cliff = mix(1.0, sat(length(grad) * 1.2 - 0.2), uOwn[0]); line *= cliff; major *= cliff; }
  if (uOwn[2] != 0.0) {
    float g = floor(44.0 * 1.6 * glMany + 0.5) / 44.0;
    vec2 gg = vec2(q.x, uLoop * glLoop + q.z - 5.0) * g, gw = t / (uRes.y * 0.95) * g * vec2(1.0, 1.0 / max(abs(dot(rd, n)), 0.1));
    if (uOwn[2] > 0.0) { line = mix(line, 0.75 * glDots(gg, gw, 0.12 + 0.22 * sat(pc.a)), uOwn[2]); major *= 1.0 - uOwn[2]; }
    else { line = mix(line, glLine(gg.y, gw.y * 1.5), -uOwn[2]); major *= 1.0 + uOwn[2]; }
  }
  vec3 ink = mix(glAny > 0.0 ? mix(vec3(0.05, 0.14, 0.24), glDeep(uKind[0]) * 0.4, glAny) : vec3(0.05, 0.14, 0.24), hue, sat(pc.a * 5.0)) * (0.3 + 1.5 * sat(h * 0.5) + 1.2 * pc.a + 0.5 * max(uOwn[2], 0.0));
  vec3 col = ink * (line + 0.9 * major);
  col += hue * pc.a * pc.a * 0.03 * sat(dot(n, normalize(vec3(-0.4, 0.5, -0.6))) * 2.0); // the lit side of a sounding hill glows a little
  // now: a line across the land where the loop is, and what it touches lights up
  float now = exp(-pow((q.z - 5.0) * 2.2, 2.0));
  col += (vec3(0.9, 0.95, 1.0) * 0.1 + hue * 1.5 * pc.a) * now * (0.04 + line + major) + vec3(0.9, 0.95, 1.0) * 0.25 * exp(-pow((q.z - 5.0) * 14.0, 2.0));
  // a hit or a cue: a ring of light going out over the land from the middle of the line
  float ring = length(q.xz - vec2(0.0, 5.0)), out_ = max(uHits, uCue);
  col += (vec3(1.0, 0.85, 0.8) * 0.3 + ink) * out_ * exp(-pow((ring - 22.0 * (1.0 - out_)) * 0.8, 2.0)) * (0.15 + 1.6 * (line + major));
  if (glAny == 0.0) return col * exp(-t * 0.028);
  if (max(glPale, glSolid) > 0.0) {
    float marks = sat(line + 0.9 * major), wave = out_ * exp(-pow((ring - 22.0 * (1.0 - out_)) * 0.8, 2.0)) + 0.5 * now * marks + 0.5 * exp(-pow((q.z - 5.0) * 14.0, 2.0));
    col = glBody(col, n, h, marks, glShade(q, 1.0), mix(glDeep(uKind[0]), hue, sat(pc.a * 5.0)), sat(pc.a * 1.3), wave, vec2(q.x, mod(uLoop * glLoop + q.z - 5.0, glLoop)));
  }
  col = mix(glHorizon() * glAny, col, mix(exp(-t * 0.028), exp(-t * t * 0.0012), max(glPale, glSolid)));
  if (hit < 0.5) col = over;
  col = glWater(col, ro, rd, t, 1.0);
  return uOwn[7] < 0.0 ? glMisty(col, ro, rd, t, 1.1, vec2(uTime * 0.1, 0.0)) : col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? glFlight(p) : glMap(p));
}
