// name: Marble
// a: Twisted canes
// b: Flower weight
// what: One glass marble hugely enlarged on white paper in window light: five ribbons of coloured glass twist round a white netted core, and sun comes through it as a patch of colours in its shadow; or a low clear dome close by, rings of cut flower canes under the thick glass, on a blue foot with white threads.
// follows: Each kind of sound is a ribbon, or a ring of flowers: louder is wider and deeper, and the piece tints it. Bands are the fine white threads. Travel turns the glass, the loop passes as a light, drone slides the window's reflection. A hit lights a bubble and the sun through the glass, a cue rolls or turns the glass and back, keys make canes glint.
// own: 0 1 a scatter of smaller ones round it, -1 a row of its like going off; 1 the eye: 1 low along the table, -1 from straight above; 2 the ground: 1 black lacquer that mirrors, -1 rippled sand in the drone's colour; 3 the hour: 1 a low warm sun and long shadows, -1 a moon overhead; 4 1 wound tight, -1 straight lengthwise (b: 1 many small canes, -1 a few great ones); 5 1 drawn out to fine lace (b: small far dots), -1 melted and run like ink; 6 1 of solid banded stone (b: the flowers on its skin), -1 a hollow bubble; 7 1 paper in the drone's colour and the glass milky in the kinds' own, -1 all of bottle glass in the pad's colour
vec3 MR_L;  // towards the window's sun, behind on the right
vec3 mrAlb, mrSun, mrSky;             // the ground, the sun on it, the sky on it
float mrLow;                          // one when one of the others is drawn: it stands alone
vec4 mrSet[7];                        // the others: where, how large, how turned
bool mrB;
vec3 mrC;              // middle of the marble
mat3 mrF;              // world to the marble's own frame, the cane's axis is its z
float mrPx, mrGain, mrTw, mrTurn;  // a pixel there, how strongly things answer, the twist, its phase
float mrAmt[5];        // how full each kind is
vec3 mrCol[5];         // each kind as clear glass
const vec3 MR_E = vec3(1.0, 0.74, 1.0);       // how the dome is squashed
const vec3 MR_K = vec3(0.60, 0.30, 0.60);     // the cushion of canes in it

float mrBell(float x) { return exp(-x * x); }
float mrIs(float w, float x) { return 1.0 - smoothstep(-w, w, x); }
// Both meetings of a ray with the spindle of width c inside the ball (it touches the ball at its poles).
vec2 mrSpindle(vec3 o, vec3 d, float c) {
  vec3 s = vec3(1.0, 1.0, c);
  o *= s; d *= s;
  float a = dot(d, d), b = dot(o, d), h = b * b - a * (dot(o, o) - c * c);
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h) / a;
}
// One pass through a layer of ribbon: what it scatters, what it takes away.
void mrRibbon(vec3 q, vec3 d, float c, float s, inout vec3 col, inout vec3 thr) {
  float a = (atan(q.y, q.x + 1e-6) - mrTw * q.z + mrTurn) / TAU * 5.0;
  float id = floor(mod(floor(a) + 0.5, 5.0)), f = fract(a) - 0.5;
  int k = min(int(id), 4);
  if (uOwn[5] < 0.0) {
    vec3 g = q * 2.6 + vec3(0.0, 0.0, mrTurn);
    a -= uOwn[5] * (2.2 * noise(g) + 0.8 * noise(g * 2.7) - 1.5); id = floor(mod(floor(a) + 0.5, 5.0)); f = fract(a) - 0.5; k = min(int(id), 4);
  }
  float R = sqrt(max(1.0 - q.z * q.z, 1e-4)), m = mrAmt[k];
  float hw = (0.2 + 0.2 * m) * (1.0 - 0.45 * s * s) * (0.75 + 0.25 * R);
  vec3 n = normalize(vec3(q.xy, q.z * c * c));
  float face = abs(dot(n, d));
  float w = 5.0 * mrPx / (TAU * c * R + 1e-3) * 1.2 / (0.2 + face) + 0.012;
  float e = mrIs(w, abs(f) - hw) * smoothstep(0.02, 0.16, face);
  if (e > 0.0 && uOwn[5] > 0.0) { float cw = 8.0 * w; e *= mix(1.0, mrIs(0.06 + cw, abs(fract(f * 8.0) - 0.5) - 0.1) / (1.0 + cw), uOwn[5]); }
  if (e <= 0.0) return;
  float v = f / hw;
  // the cane's own drawing: milk glass laid in stripes under the colour
  float stripes = k == 0 ? mrBell(v / 0.24) : k == 1 ? mrBell((abs(v) - 0.8) / 0.16) : k == 2 ? 0.5 + 0.5 * cos(v * 9.4) : k == 3 ? mrBell((v - 0.45) / 0.22) : mrBell((abs(v) - 0.4) / 0.2);
  vec4 pm = piece(vec2(0.5 + 0.48 * q.z, (id + 0.5) / 5.0));
  vec3 tint = mix(mrCol[k], sat(pm.rgb / max(max(max(pm.r, pm.g), pm.b), 0.05)), 0.25 * sat(pm.a * 1.5));
  float deep = (0.55 + 0.9 * m + 0.5 * pm.a * mrGain) / max(face, 0.4);
  vec3 T = exp(-(1.0 - tint) * 1.15 * deep);
  float run = mrBell((q.z - (3.2 * uLoop - 1.6)) / 0.28);
  float gather = 0.5 - 0.5 * dot(q * mrF, MR_L);
  float lit = 0.34 + 0.5 * abs(dot(n * mrF, MR_L)) + 1.1 * gather * gather * gather;
  vec3 body = mix(tint, vec3(0.95, 0.94, 0.9), stripes * (0.65 - 0.25 * m)) * lit * (1.0 + 0.7 * run * m * mrGain + (k == 4 ? 0.7 * uHits : 0.0));
  float op = e * mix(0.3, 0.62, stripes) * (0.75 + 0.3 * m);
  float glint = uKeys * pow(0.5 + 0.499 * sin(q.z * 9.0 + id * 2.1 + uTime * 0.7), 6.0) * (0.2 + stripes);
  col += thr * op * (body + glint * 2.0);
  thr *= mix(vec3(1.0), T, e) * (1.0 - op);
}
// White threads: the net, or sixteen filaments.
void mrThread(vec3 q, vec3 d, float c, bool net, inout vec3 col, inout vec3 thr) {
  float an = atan(q.y, q.x + 1e-6) / TAU, R = sqrt(max(1.0 - q.z * q.z, 1e-4));
  vec3 n = normalize(vec3(q.xy, q.z * c * c));
  float face = abs(dot(n, d)), len = TAU * c * R + 1e-3, o;
  float px = mrPx * 1.2 / len / (0.2 + face);
  float gather = 0.5 - 0.5 * dot(q * mrF, MR_L), lit = 0.5 + 0.35 * abs(dot(n * mrF, MR_L)) + 0.9 * gather * gather;
  if (net) {
    vec2 a = vec2(an - 0.42 * q.z, an + 0.42 * q.z) * 12.0 + vec2(1.0, -0.5) * mrTurn * 12.0 / TAU;
    vec2 f = abs(fract(a) - 0.5);
    float w = 12.0 * px + 0.04;
    vec2 e = 1.0 - smoothstep(-w, w, f - 0.1);
    o = max(e.x, e.y) * 0.85 + 0.12;
    lit *= 1.0 + 0.8 * uMic * mrGain;
  } else {
    float a = (an + (mrTurn - mrTw * q.z) / TAU) * 16.0;
    float b = uBands[min(int(mod(floor(a) + 0.5, 16.0)), 15)];
    float f = abs(fract(a) - 0.5), w = 16.0 * px + 0.02;
    o = mrIs(w, f - 0.02 - 0.035 * b) * (0.15 + 0.7 * sat(b * 1.3));
  }
  col += thr * o * vec3(0.95, 0.95, 0.92) * lit;
  thr *= 1.0 - o;
}
// What a ray meets in the ball, in the ball's frame.
void mrGlass(vec3 o, vec3 d, out vec3 col, out vec3 thr) {
  col = vec3(0.0); thr = vec3(1.0);
  vec2 h0 = mrSpindle(o, d, 0.66), h1 = mrSpindle(o, d, 0.57), h2 = mrSpindle(o, d, 0.51), h3 = mrSpindle(o, d, 0.45), h4 = mrSpindle(o, d, 0.23);
  if (h0.x > 0.0) mrThread(o + d * h0.x, d, 0.66, false, col, thr);
  if (h1.x > 0.0) mrRibbon(o + d * h1.x, d, 0.57, 1.0, col, thr);
  if (h2.x > 0.0) mrRibbon(o + d * h2.x, d, 0.51, 0.0, col, thr);
  if (h3.x > 0.0) mrRibbon(o + d * h3.x, d, 0.45, 1.0, col, thr);
  if (h4.x > 0.0) { mrThread(o + d * h4.x, d, 0.23, true, col, thr); mrThread(o + d * h4.y, d, 0.23, true, col, thr); }
  if (h3.y > 0.0) mrRibbon(o + d * h3.y, d, 0.45, 1.0, col, thr);
  if (h2.y > 0.0) mrRibbon(o + d * h2.y, d, 0.51, 0.0, col, thr);
}
// The colour sunlight keeps past the ribbons.
vec3 mrTint(vec3 q, float w) {
  float a = (atan(q.y, q.x + 1e-6) - mrTw * q.z + mrTurn) / TAU * 5.0, f = fract(a) - 0.5;
  int k = min(int(mod(floor(a) + 0.5, 5.0)), 4);
  return mix(vec3(1.0), mrCol[k], (0.6 + 0.3 * mrAmt[k]) * mrIs(w, abs(f) - 0.22 - 0.18 * mrAmt[k])) * (1.0 + 0.22 * cos(f * TAU * 5.0));
}
// The room as the glass sees it, and a tall window with bars.
vec3 mrRoom(vec3 r, float slide, float soft) {
  vec3 c = mix(vec3(0.1, 0.105, 0.12), vec3(0.62, 0.64, 0.68), smoothstep(0.1, 0.95, r.y));
  c *= 0.8 + 0.4 * r.x;
  if (uOwn[2] > 0.0) c *= 1.0 - 0.95 * uOwn[2];
  if (uOwn[7] > 0.0) c *= mix(vec3(1.0), uKind[0] * 1.1, uOwn[7]);
  vec3 W = normalize(vec3(0.55, 0.66, -0.2));
  W.xz = rot(slide) * W.xz;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), W)), v = cross(W, u);
  float k = dot(r, W);
  c += vec3(2.6, 2.7, 2.8) * (1.0 - smoothstep(0.04, 0.1, abs(r.x + 0.78 - 0.1 * r.y))) * smoothstep(0.1, 0.3, r.y) * (1.0 - smoothstep(0.45, 0.62, r.y)) * (0.6 + 0.5 * uLevel);
  if (k < 0.2) return c;
  vec2 q = vec2(dot(r, u), dot(r, v)) / k;
  vec2 hw = vec2(0.3, 0.46) * (0.85 + 0.3 * uSpace);
  vec2 e = 1.0 - smoothstep(hw - soft, hw + soft, abs(q));
  float bar = smoothstep(0.02, 0.035 + soft, abs(q.x)) * smoothstep(0.016, 0.03 + soft, abs(q.y - 0.12));
  return c + e.x * e.y * bar * vec3(13.0, 13.4, 14.0) * (0.85 + 0.5 * q.y) * (1.0 + 0.5 * uCue);
}
// Nine rings of sunlight: how far out each enters, and where it lands at a distance s: y - s * z.
const vec3 MR_SUN[9] = vec3[9](vec3(0.052, 0.052, 0.035), vec3(0.157, 0.158, 0.106), vec3(0.263, 0.267, 0.181), vec3(0.368, 0.381, 0.264), vec3(0.473, 0.503, 0.358), vec3(0.578, 0.640, 0.473), vec3(0.684, 0.807, 0.626), vec3(0.789, 1.042, 0.861), vec3(0.894, 1.511, 1.361));
// Sun through the marble on the paper, in the colours it passed.
vec3 mrCaustic(vec3 t, float s) {
  float y = length(t), sum = 0.0, side = 0.0;
  if (y > 1.1 || s < 0.8) return vec3(0.0);
  float sg = mix(0.13, 0.06, uTone);
  for (int i = 0; i < 9; i++) {
    float b = MR_SUN[i].x, yi = MR_SUN[i].y - s * MR_SUN[i].z, g = sg + 0.035 * abs(yi);
    float w = b * 0.105 * mrBell((y - abs(yi)) / g) / (1.77 * g * max(y, 0.7 * g));
    sum += w; side += w * b * sign(yi);
  }
  if (sum < 0.004) return vec3(0.0);
  vec3 e = t / max(y, 1e-3) * clamp(side / sum, -0.95, 0.95);
  e += MR_L * sqrt(max(1.0 - dot(e, e), 0.0));
  vec3 d = mrF * refract(-MR_L, e, 1.0 / 1.5);
  e = mrF * e;
  vec2 h = mrSpindle(e, d, 0.51);
  float w = 0.03 + 0.007 / (y + 0.06);
  vec3 thr = mix(vec3(1.0), mrTint(e + d * h.x, w) * mrTint(e + d * h.y, w), smoothstep(0.0, 0.4, h.y - h.x));
  thr = mix(thr * (0.4 + 0.6 * thr) * 1.12 / max(sqrt(max(max(thr.r, thr.g), thr.b)), 0.4), vec3(1.0, 0.95, 0.86), mrBell(y / 0.05));
  return sum * thr * 0.98 * smoothstep(0.85, 1.2, s);
}
// The kinds' colours round the dome, one running into the next.
vec3 mrRound(float th) {
  float a = th / TAU * 20.0 + 20.0;
  vec3 k = mix(mrCol[min(int(mod(floor(a) + 0.5, 5.0)), 4)], mrCol[min(int(mod(floor(a) + 1.5, 5.0)), 4)], smoothstep(0.35, 1.0, fract(a)));
  return k * k;
}
// What the dome gathers beside its foot.
vec3 mrPool(vec3 o, float s, float y) {
  vec3 k = mix(mrRound(atan(o.x, o.z + 1e-5)), vec3(1.0, 0.95, 0.86), 0.3 + 0.5 * smoothstep(0.6, 0.72, y));
  return k * 1.5 * (1.0 - smoothstep(0.7, 0.77, y)) * exp(-max(0.71 - y, 0.0) * 4.5) * smoothstep(0.35, 0.9, s);
}
// The paper and the light on it; extra shines there too.
vec3 mrPaper(vec3 q, vec3 extra) {
  // a wide patch of sun from the window, its bars across
  vec2 a = rot(-0.52) * (q.xz - vec2(0.2, mrB ? -1.4 : 0.2));
  float so = 0.5, wide = uSpace - 0.5;
  vec2 z = vec2(4.6, 3.3) + wide, e = 1.0 - smoothstep(z - so, z + so, abs(a + vec2(0.6, 1.0)));
  float sun = e.x * e.y * (1.0 - 0.6 * mrBell((a.y + 3.0) / 0.2));
  if (uOwn[1] != 0.0 || uOwn[2] != 0.0) sun = mix(sun, 1.0, max(abs(uOwn[1]), max(-uOwn[2], 0.0)) * 0.8);
  vec3 sky = mrSky * (0.85 + 0.05 * q.x), o = q - mrC, l = MR_L;
  if (mrB) { o /= MR_E; l = normalize(l / MR_E); }
  float s = -dot(o, l), y = length(o + l * s);
  float pen = (0.06 + 0.09 * max(s, 0.0)) * mix(1.6, 0.5, uTone);
  float sh = mix(1.0, smoothstep(1.0 - pen, 1.0 + pen, y), smoothstep(-0.6, 0.2, s));
  float occ = 0.75 / pow(dot(o, o), 1.5);
  if (uOwn[0] != 0.0 && mrLow < 0.5) for (int i = 0; i < 7; i++) {
    vec4 b = mrSet[i];
    vec3 m = (q - vec3(b.x, 0.0, b.y)) / b.z - vec3(0.0, mrB ? 0.3 : 1.0, 0.0);
    if (mrB) m /= MR_E;
    float z = -dot(m, l), g = length(m + l * z), pe = (0.06 + 0.09 * max(z, 0.0)) * mix(1.6, 0.5, uTone);
    sh *= mix(1.0, smoothstep(1.0 - pe, 1.0 + pe, g), smoothstep(-0.6, 0.2, z));
    occ = max(occ, 0.75 / pow(max(dot(m, m), 0.8), 1.5));
  }
  if (uOwn[6] < 0.0) sh = mix(sh, 1.0, -0.8 * uOwn[6]);
  return mrAlb * (sky * (1.0 - min(occ, 1.0)) * 0.72 + mrSun * sun * (sh + extra + 0.1 * (1.0 - sh)));
}
// The paper as it is looked at.
vec3 mrTable(vec3 ro, vec3 rd) {
  vec3 q = ro - rd * (ro.y / min(rd.y, -0.01)), o = q - mrC, l = MR_L, ca;
  if (mrB) { o /= MR_E; l = normalize(l / MR_E); }
  float s = -dot(o, l);
  vec3 t = o + l * s;
  float many = 1.0;
  if (uOwn[0] != 0.0) { 
    float near = s > 0.0 ? length(t) : 9.0;
    for (int i = 0; i < 7; i++) {
      vec4 b = mrSet[i];
      vec3 m = (q - vec3(b.x, 0.0, b.y)) / b.z - vec3(0.0, mrB ? 0.3 : 1.0, 0.0);
      if (mrB) m /= MR_E;
      float z = -dot(m, l), g = length(m + l * z);
      if (z > 0.5 && g < near && b.z > 0.02) { near = g; s = z; t = m + l * z; o = m; many = smoothstep(0.02, 0.15, b.z); }
    }
  }
  ca = mrB ? mrPool(o, s, length(t)) : mrCaustic(t, s);
  if (uOwn[6] != 0.0) ca *= 1.0 - abs(uOwn[6]);
  if (uOwn[3] < 0.0) ca *= 1.0 - 1.6 * uOwn[3];
  ca *= many * (1.0 + (2.0 + 9.0 * sat(uLevel + 0.4)) * max(uOwn[2], 0.0));
  ca *= 1.0 + 1.3 * uHits + 0.6 * uCue;
  ca /= 1.0 + 0.16 * ca;
  vec3 c = mrPaper(q, ca) * (0.985 + 0.02 * noise(q.xz * 41.0) + 0.02 * noise(rot(0.7) * q.xz * vec2(9.0, 60.0)));
  vec3 wall = vec3(0.4, 0.43, 0.47);
  if (uOwn[2] < 0.0) {
    float far = length(q.xz), hz = q.z * 5.0 + 1.6 * q.x + 2.4 * noise(q.xz * 0.9), fade = (1.0 - smoothstep(2.0, 9.0, far));
    float slope = cos(hz + 0.5 * sin(hz)) * (0.5 + noise(q.xz * 1.7 + 9.0));
    c *= 1.0 - uOwn[2] * ((slope * 0.34) * fade + 0.22 * (hash21(floor(q.xz * 90.0)) - 0.5) * fade);
  }
  float oth = abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[7]);
  if (oth > 0.0) wall = mix(wall, (mrAlb * 0.9 + 0.01) * (mrSky * 0.75 + mrSun * 0.12) * (0.75 + 0.5 * smoothstep(-0.2, 0.25, rd.y)), sat(2.0 * oth));
  return mix(c, wall, smoothstep(7.0, 14.0, length(q.xz)));
}
// What a ray comes to outside.
vec3 mrOut(vec3 q, vec3 d) {
  vec3 g = q - d * (q.y / min(d.y, -1e-3));
  return mix(mrPaper(g, vec3(0.0)), mrRoom(d, 0.0, 0.1), d.y > -1e-3 ? 1.0 : smoothstep(7.0, 14.0, length(g.xz)));
}
const vec4 MR_AIR[5] = vec4[5](vec4(-0.40, 0.46, -0.56, 0.062), vec4(-0.52, 0.26, -0.60, 0.026), vec4(0.14, -0.28, -0.80, 0.034),
  vec4(0.46, 0.06, -0.72, 0.022), vec4(-0.18, 0.72, -0.40, 0.03));
vec3 mrRoll(vec3 v) { v.xy = rot(-mrC.x) * v.xy; return v; }
// A bubble of air in the glass.
void mrBubble(vec3 o, vec3 d, vec4 s, float hit, inout vec3 c) {
  vec3 m = s.xyz - o;
  float b = dot(m, d), r = length(m - d * b) / s.w, w = mrPx / s.w;
  if (b < 0.0) return;
  c += (uKind[4] * 0.7 + 0.5) * hit * mrGain * 1.1 * exp(-r * 0.55);
  if (r > 1.2) return;
  vec3 n = (d * b - m) / s.w;
  float ring = smoothstep(0.45, 0.82, r) * (1.0 - smoothstep(0.9, 1.06, r));
  float spot = mrBell(length(n - vec3(0.34, 0.42, 0.0)) / 0.24) + 0.5 * mrBell(length(n + vec3(0.36, 0.42, 0.0)) / 0.3);
  vec3 k = c * (1.0 - 0.72 * ring) + spot * 0.9 + 0.12 * (1.0 - ring) + hit * mrGain * 2.0 * (uKind[4] * 0.5 + 0.6) * (1.0 - 0.6 * ring);
  c = mix(c, k, mrIs(w, r - 1.0));
}
// Banded stone, where e is on the ball.
vec3 mrStone(vec3 e, out float loud) {
  float wob = fbm(e * 2.3 + vec3(0.0, 0.0, 4.0)), lat = e.z * 4.6 + 1.7 * wob + 0.35 * sin(mrTw * e.z) + 8.0, b = fract(lat);
  int k = int(mod(floor(lat), 5.0)), k2 = (k + 1) % 5;
  float h = smoothstep(0.55, 1.0, b);
  loud = mix(mrAmt[k], mrAmt[k2], h);
  vec3 c = mix(mrCol[k], mrCol[k2], h);
  c *= 0.5 + 0.35 * wob + 0.35 * noise(vec3(e.xy * 3.0, lat * 9.0)) + 0.25 * loud;
  return mix(c * c, vec3(dot(c, vec3(0.4))), 0.25) + 0.35 * mrBell((b - 0.5) / 0.04) * wob;
}
// A hollow one: what stands behind, the rim, and oil on it.
vec3 mrHollow(vec3 behind, vec3 e, vec3 n, vec3 rd, float fr) {
  float rim = 1.0 - sat(-dot(rd, n)), sw = fbm(e * 1.7 + vec3(0.0, uTime * 0.03, mrTurn)) * 4.0 + e.y * 2.0 + 20.0;
  vec3 oil = kindColour(mod(sw, 1.0) * 3.0 * (1.0 - smoothstep(0.75, 1.0, mod(sw, 1.0)))), room = mrRoom(reflect(rd, n), 0.5 * uDrone - 0.2, 0.02);
  vec3 flip = reflect(rd, n); flip.xy = -flip.xy;
  vec4 pm = piece(vec2(0.5 + 0.49 * e.x, 0.5 - 0.49 * e.y));
  return behind * (1.0 - 0.75 * rim * rim) * (1.0 - 0.3 * pm.a * mrGain) + pm.rgb * pm.rgb * 0.8 * mrGain + oil * oil * (0.06 + 1.1 * rim * rim + (3.6 * uLevel * mrGain + 1.2 * band(0.5 + 0.5 * e.x)) * rim) + (uKind[4] * 0.7 + 0.2) * uHits * mrBell((length(n + vec3(0.2, -0.4, 0.8)) - 2.0 * (1.0 - uHits)) / 0.25) + room * (0.05 + 0.35 * fr) + 0.025 * mrRoom(flip, 0.0, 0.1);
}
vec3 mrBall(vec3 ro, vec3 rd, float t) {
  vec3 q = ro + rd * t, n = normalize(q - mrC);
  vec3 d = refract(rd, n, 1.0 / 1.5);
  vec3 e = q - mrC, col, thr;
  float L = -2.0 * dot(e, d);
  vec3 x = e + d * L;
  mrGlass(mrF * e, mrF * d, col, thr);
  vec3 out1 = refract(d, -x, 1.5);
  float fr = 0.04 + 0.96 * pow(1.0 - sat(-dot(rd, n)), 5.0);
  vec3 c = col + thr * exp(-vec3(0.06, 0.025, 0.04) * L) * mrOut(x + mrC, out1);
  if (uOwn[7] < 0.0) c *= mix(vec3(1.0), exp(-(1.05 - uKind[1]) * (0.35 + 0.9 * L)) * 1.5, -uOwn[7]);
  for (int i = 0; i < 5; i++) mrBubble(e, d, vec4(mrRoll(MR_AIR[i].xyz), MR_AIR[i].w), i == 0 ? uHits : 0.0, c);
  if (uOwn[6] > 0.0) {
    float loud; vec3 st = mrStone(mrF * e, loud);
    float sun = sat(dot(n, MR_L) * 0.8 + 0.2);
    st *= mrSun * 2.1 * sun * sun + mrSky * (0.28 + 0.3 * n.y) + 0.25 * loud * loud + 0.3 * mrAlb * sat(-n.y);
    float g = length(n - normalize(vec3(-0.3, 0.8, -0.5)));
    st += (uKind[4] * 0.6 + 0.3) * mrGain * (uHits * mrBell((g - 1.7 * (1.0 - uHits)) / 0.2) + uCue * 0.4 * mrBell((g - 2.0 * (1.0 - uCue)) / 0.4));
    c = mix(c, st, uOwn[6]); fr *= 1.0 - 0.5 * uOwn[6];
  }
  if (uOwn[6] < 0.0) c = mix(c, mrHollow(mrOut(q, rd), mrF * e, n, rd, fr), -uOwn[6]);
  return mix(c, mrRoom(reflect(rd, n), 0.5 * uDrone - 0.2, mix(0.045, 0.008, uTone)), fr);
}
float mrIn;  // how far inside a squashed ball's outline the ray that met it went
vec2 mrEgg(vec3 o, vec3 d, vec3 e) {
  o /= e; d /= e;
  float a = dot(d, d), b = dot(o, d), h = b * b - a * (dot(o, o) - 1.0);
  if (h < 0.0) return vec2(-1.0);
  mrIn = 1.0 - sqrt(max(1.0 - h / a, 0.0));
  h = sqrt(h);
  return vec2(-b - h, -b + h) / a;
}
// One cut cane, v from its middle to its rim at 1.
vec3 mrCane(vec2 v, int k, float odd, float m, float w) {
  vec3 ink = mix(vec3(dot(mrCol[k], vec3(0.33))), mrCol[k], 0.45 + 0.55 * m);
  vec3 white = vec3(0.97, 0.95, 0.9), deep = ink * ink * (0.75 - 0.35 * m);
  vec3 other = mrCol[(k + 2 + int(odd)) % 5];
  float r = length(v), a = atan(v.y, v.x + 1e-4) + odd * 0.3, open = 0.86 + 0.16 * m;
  float n = k == 0 ? 12.0 : k == 1 ? 6.0 : k == 2 ? 10.0 : k == 3 ? 5.0 : 8.0, star = cos(n * a);
  float edge = (k == 0 ? 0.84 + 0.07 * star : k == 1 ? 0.76 + 0.16 * star : k == 2 ? 0.86 + 0.05 * star : k == 3 ? 0.78 + 0.13 * star : 0.8) * open;
  vec3 c = mix(deep, white, mrIs(w, r - edge));
  c = mix(c, odd > 0.5 ? ink : mix(ink, deep, 0.6), mrIs(w, r - edge + 0.15));
  if (k == 4 || k == 1) { // a bundle of small rods
    float f = mod(a, TAU / 6.0) - PI / 6.0;
    float q = length(r * vec2(cos(f), sin(f)) - vec2(0.38, 0.0));
    c = mix(c, white, mrIs(w, q - 0.16));
    c = mix(c, other * 0.8, mrIs(w, q - 0.09));
  } else {
    c = mix(c, white, mrIs(w, r - 0.46 - 0.05 * star));
    c = mix(c, other * 0.85, mrIs(w, r - 0.34));
  }
  c = mix(c, white, mrIs(w, r - 0.18));
  return mix(c, deep, mrIs(w, r - 0.09));
}
// The deep glass under the canes, white threads pulled over it, six for each band.
vec3 mrSkirt(float th, float tau, float w) {
  float a = th / TAU * 96.0 + (tau - 1.4) * 9.0, b = uBands[min(int(mod(floor(a) + 0.5, 16.0)), 15)];
  w = 96.0 * w / (TAU * MR_K.x) + 0.03;
  return mix(mrCol[0] * vec3(0.05, 0.07, 0.15) + vec3(0.01, 0.015, 0.035), vec3(0.85, 0.9, 0.95), mrIs(w, abs(fract(a) - 0.5) - 0.02 - 0.13 * b) * smoothstep(1.485, 1.52, tau) * min(1.0, 0.2 / w) * (0.35 + 0.6 * b));
}
// The cushion: rows of canes, their cut ends up.
vec3 mrCushion(vec3 q, vec3 d) {
  vec3 u = q / MR_K, n = normalize(u / MR_K);
  float tau = atan(length(u.xz), u.y), th = atan(u.x, u.z + 1e-5) + mrTurn;
  float H = 0.27, rows = 5.5;
  if (uOwn[4] != 0.0) { rows = floor(5.0 * exp2(uOwn[4]) + 0.5) + 0.5; H = 1.485 / rows; }
  if (uOwn[5] < 0.0) {
    float st = (1.0 - smoothstep(1.1, 1.55, tau)), g = st * (noise(u * 4.0 + 3.0) - 0.5), g2 = st * (noise(u * 3.4 + 40.0) - 0.5);
    tau = max(tau - uOwn[5] * 0.34 * g * smoothstep(0.0, 0.3, tau), 0.0); th -= uOwn[5] * 0.9 * g2;
  }
  float j = floor(tau / H + 0.5);
  float gather = sat(0.5 - 0.55 * dot(u, MR_L));
  float face = abs(dot(n, d));
  if (j > rows) return mrSkirt(th, tau, mrPx / (0.2 + face)) * (0.4 + 0.9 * gather * gather) * (1.0 - smoothstep(1.6, 2.6, tau));
  int k = 4 - max(int(j) - 1, 0);
  if (uOwn[4] != 0.0) k = 4 - int(clamp((j - 1.0) * 5.5 / rows, 0.0, 4.0));
  float N = max(6.0 * j, 1.0), a = th / TAU * N + 0.5 * mod(j, 2.0), id = floor(mod(floor(a) + 0.5, N)), odd = mod(id, 2.0);
  vec2 v = j < 0.5 ? u.xz / (0.5 * H) : vec2((fract(a) - 0.5) * 2.0 * min(1.0, sin(tau) * TAU / (N * H) * 1.12), (tau / H - j) * 2.0);
  float z = hash21(vec2(id, j + 3.0));
  vec2 v0 = v;
  v += 0.14 * (vec2(z, fract(z * 13.7)) - 0.5);
  if (uOwn[5] > 0.0) { v *= 1.0 + 1.5 * uOwn[5]; v0 *= 1.0 + 1.5 * uOwn[5]; }
  v = rot(z * 6.0) * v * (0.93 + 0.1 * fract(z * 7.3));
  float w = 2.0 * mrPx / (MR_K.x * H) / (0.25 + face) + 0.02, m = mrAmt[k];
  vec3 c = mrCane(v, k, odd, 0.35 + 0.65 * m, w) * (0.86 + 0.28 * fract(z * 5.1));
  float r = max(length(v), 1.04 * abs(v0.y)), tip = dot(v0, vec2(sin(th - mrTurn - 2.1), 0.8));
  c *= 1.0 + 0.22 * clamp(tip, -1.0, 1.0);
  c = mix(c, vec3(0.035, 0.05, 0.1), smoothstep(0.92, 1.05, r) * 0.9) * (1.0 - 0.3 * smoothstep(0.6, 1.0, r));
  float at = fract(th / TAU + 0.5);
  vec4 pm = piece(vec2(at, (rows - j) / rows)) * smoothstep(0.0, 0.06, min(at, 1.0 - at));
  c = mix(c, c * (0.35 + 1.2 * pm.rgb / max(pm.a, 0.05)), 0.4 * sat(pm.a * mrGain));
  float glow = pm.a * 0.3 + mrBell((tau - 2.6 * uLoop + 0.5) / 0.2) * 0.5 * m
    + (k == 4 ? uHits : 0.0) + uKeys * pow(0.5 + 0.499 * sin(id * 2.4 + j * 1.7 + uTime * 0.6), 8.0) * 0.7;
  return c * (0.3 + 0.6 * sat(dot(n, MR_L)) + 0.75 * gather * gather + 0.6 * glow * mrGain + 0.3 * uMic * mrBell(tau / 0.6));
}
vec3 mrDome(vec3 ro, vec3 rd, float t) {
  vec3 e = ro + rd * t - mrC, n = normalize(e / MR_E / MR_E);
  vec3 d0 = refract(rd, n, 1.0 / 1.5), d = d0, o = e, c = vec3(0.0);
  float fr = 0.04 + 0.96 * pow(1.0 - sat(-dot(rd, n)), 5.0);
  vec3 thr = vec3(1.0);
  for (int i = 0; i < 2; i++) {
    vec3 k = o + vec3(0.0, 0.13, 0.0);
    float tb = d.y < -1e-3 ? (-0.97 * mrC.y - o.y) / d.y : 1e3, tx = mrEgg(o, d, MR_E).y;
    vec2 h = mrEgg(k, d, MR_K);
    if (tb < tx) { // the paper under the foot, the dome's light gathered on it
      vec3 g = o + d * tb;
      float gr = length(g.xz), ga = sat(0.5 - 0.62 * dot(g, MR_L) / max(gr, 0.1));
      c = thr * (vec3(0.66, 0.72, 0.76) * 0.5 + vec3(0.75, 0.7, 0.6) * (2.6 * ga * ga * ga + 0.12)) * (0.25 + 0.75 * smoothstep(0.4, 0.85, gr)) * (1.0 - 0.5 * smoothstep(0.86, 0.97, gr));
      c *= mix(vec3(1.0), mrCol[0] * 0.5 + 0.3, mrBell((gr - 0.66) / 0.11) * 0.6);
      c *= mix(vec3(1.0), mrRound(atan(g.x, g.z + 1e-5)) * 0.6 + 0.45, 0.8 * mrBell((gr - 0.84) / 0.09));
    }
    if (h.x > 0.0 && h.x < tb) { c = mix(c, thr * mrCushion(k + d * h.x, d), tb < tx ? smoothstep(0.0, 1.0, mrIn * MR_K.x / mrPx * 0.7) * smoothstep(0.0, 2.0 * mrPx, o.y + d.y * h.x + 0.97 * mrC.y) : 1.0); break; }
    if (tb < tx) break;
    vec3 x = o + d * tx, nx = normalize(x / MR_E / MR_E), q = refract(d, -nx, 1.5);
    c = thr * vec3(0.26, 0.28, 0.3);
    if (dot(q, q) > 0.5) { c = thr * mrRoom(q, 0.0, 0.1); break; }
    d = reflect(d, -nx); o = x; thr *= vec3(0.86, 0.92, 0.92);
  }
  for (int i = 0; i < 5; i++) mrBubble(e, d0, vec4(MR_AIR[i].x * 0.7, 0.36, MR_AIR[i].z * 0.5 + 0.2, MR_AIR[i].w * 0.8), i == 0 ? uHits : 0.0, c);
  if (uOwn[7] < 0.0) c *= mix(vec3(1.0), exp(-(1.05 - uKind[1]) * (0.8 + 1.3 * mrIn)) * 1.6, -uOwn[7]);
  if (uOwn[6] > 0.0) {
    vec3 sk = mrCushion(e / MR_E * MR_K, rd) * (mrSun * 1.5 * sat(dot(n, MR_L) * 0.8 + 0.25) + mrSky * (0.35 + 0.3 * n.y));
    float g = length(e - vec3(-0.3, 0.6, -0.4));
    sk += (uKind[4] * 0.6 + 0.2) * mrGain * uHits * mrBell((g - 1.4 * (1.0 - uHits)) / 0.2);
    c = mix(c, sk * 1.2, uOwn[6]); fr *= 1.0 - 0.75 * uOwn[6];
  }
  if (uOwn[6] < 0.0) {
    vec3 hol = mrHollow(mrOut(e + mrC, rd), e, n, rd, fr);
    c = mix(c, hol, -uOwn[6]);
  }
  c *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.35, -dot(rd, n)));
  return mix(c, mrRoom(reflect(rd, n), 0.5 * uDrone - 0.2, mix(0.045, 0.008, uTone)), fr);
}
// Whichever stands nearest along a ray, and how far it covers what is behind.
vec4 mrThings(vec3 ro, vec3 rd) {
  float best = 1e3, miss = 2.0, r = 1.0; int at = -1;
  vec3 C0 = vec3(0.0, mrB ? 0.3 : 1.0, 0.0), from = ro - mrC + C0, was = mrC;
  for (int i = -1; i < 7; i++) {
    float z = 1.0; vec3 o = from;
    if (i >= 0) { if (uOwn[0] == 0.0) break; vec4 b = mrSet[i]; z = b.z; o = (ro - vec3(b.x, 0.0, b.y)) / z; }
    if (z < 0.03) continue;
    vec3 m = o - C0, d = rd;
    if (mrB) { m /= MR_E; d = rd / MR_E; }
    float dd = dot(d, d), bb = -dot(m, d) / dd, g = length(m + d * bb);
    if (bb < 0.0 || g > 1.0 + 2.0 * mrPx / z) continue;
    float t = (bb - sqrt(max(1.0 - g * g, 0.0) / dd)) * z;
    if (mrB && ro.y + rd.y * t < -mrPx) continue;
    if (t < best) { best = t; miss = g; at = i; r = z; }
  }
  if (best > 900.0) return vec4(0.0);
  float px = mrPx, turn = mrTurn;
  vec3 o = at < 0 ? ro : (ro - vec3(mrSet[max(at, 0)].xy, 0.0).xzy) / r;
  if (at >= 0) { mrC = C0; mrPx /= r; mrTurn += mrSet[at].w; mrLow = 1.0; }
  float cov = mrIs(0.8, (miss - 1.0) / mrPx);
  if (mrB) cov *= smoothstep(-mrPx, mrPx, o.y + rd.y * best / r);
  if (mrB) mrEgg(o - mrC, rd, MR_E);
  vec3 c = mrB ? mrDome(o, rd, best / r) : mrBall(o, rd, best / r);
  mrC = was; mrPx = px; mrTurn = turn; mrLow = 0.0;
  return vec4(c, cov);
}
vec3 render(vec2 p) {
  mrB = uVar > 0.5;
  mrGain = 0.45 + uEnergy;
  float asp = uRes.x / uRes.y, zoom = min(1.0, asp / (mrB ? 1.12 : 0.95));
  float amt[5] = float[5](uDrone, uPad, uTexture, uPhrase, uLow);
  for (int k = 0; k < 5; k++) {
    mrAmt[k] = sat(amt[k] * (0.6 + 0.8 * uEnergy));
    vec3 c = uKind[k]; float hi = max(max(c.r, c.g), max(c.b, 0.05)), lo = min(min(c.r, c.g), c.b);
    mrCol[k] = sat((c - 0.66 * lo) / (hi - 0.66 * lo + 0.02));
    if (uOwn[7] > 0.0) mrCol[k] = mix(mrCol[k], uKind[k], uOwn[7]);
  }
  MR_L = normalize(vec3(0.70, 0.585, 0.40));
  mrAlb = vec3(0.95, 0.955, 0.96); mrSun = vec3(0.74, 0.69, 0.61); mrSky = vec3(0.66, 0.72, 0.80); mrLow = 0.0;
  if (uOwn[7] > 0.0) mrAlb = mix(mrAlb, uKind[0], uOwn[7]);
  if (uOwn[2] > 0.0) mrAlb = mix(mrAlb, vec3(0.005, 0.005, 0.007), uOwn[2]);
  if (uOwn[2] < 0.0) mrAlb = mix(mrAlb, uKind[0], -uOwn[2]);
  if (uOwn[3] > 0.0) { MR_L = normalize(mix(MR_L, vec3(0.80, 0.30, 0.46), uOwn[3])); mrSun = mix(mrSun, vec3(1.0, 0.6, 0.3), uOwn[3]); mrSky = mix(mrSky, vec3(0.38, 0.36, 0.46), uOwn[3]); }
  if (uOwn[3] < 0.0) { MR_L = normalize(mix(MR_L, vec3(0.3, 0.9, 0.25), -uOwn[3])); mrSun = mix(mrSun, vec3(0.2, 0.25, 0.33), -uOwn[3]); mrSky = mix(mrSky, vec3(0.06, 0.085, 0.15), -uOwn[3]); }
  if (uOwn[0] != 0.0) for (int i = 0; i < 7; i++) {
    float n = float(i), in1 = smoothstep(0.1 * n, 0.1 * n + 0.35, abs(uOwn[0]));
    vec4 b = n < 1.0 ? vec4(-2.1, 0.7, 0.55, 1.1) : n < 2.0 ? vec4(1.55, 1.5, 0.62, 2.7) : n < 3.0 ? vec4(-1.35, -1.3, 0.34, 4.0) : n < 4.0 ? vec4(-0.75, 2.9, 0.7, 5.2) : n < 5.0 ? vec4(1.25, -0.95, 0.3, 0.4) : n < 6.0 ? vec4(-3.0, 2.6, 0.45, 3.3) : vec4(-2.6, -0.7, 0.22, 2.0);
    if (uOwn[0] < 0.0) { float k = n < 5.0 ? n + 1.0 : 4.0 - n; b = vec4(vec2(-1.66, 1.2) * k, 1.0, n * 1.9); }
    if (mrB && uOwn[0] < 0.0) b.xy = vec2(-1.85, 1.0) * (n < 5.0 ? n + 1.0 : 4.0 - n);
    if (mrB && uOwn[0] > 0.0) b.xy *= 1.12;
    mrSet[i] = vec4(b.xy, max(b.z * in1, 0.01), b.w);
  }
  float E = mrB ? 0.66 : 0.42;
  if (uOwn[1] > 0.0) E = mix(E, mrB ? 0.2 : 0.1, uOwn[1]);
  if (uOwn[1] < 0.0) E = mix(E, 1.45, -uOwn[1]);
  p = (p - (mrB ? vec2(0.2 * sat((asp - 0.5) / 1.28), -0.07) : vec2(0.19 * min(1.0, asp / 1.78), 0.06))) / zoom;
  vec3 F = vec3(0.0, -sin(E), cos(E)), U = vec3(0.0, cos(E), sin(E));
  float fl = mrB ? 0.24 : 0.41, D = 8.0;
  mrPx = D * fl / uRes.y / zoom;
  float c4 = 4.0 * uCue * (1.0 - uCue);
  mrC = mrB ? vec3(0.0, 0.3, 0.0) : vec3(0.14 * sin(TAU * uLoop) - 0.45 * c4, 1.0, 0.0);
  vec3 A = mrRoll(normalize(vec3(0.5, 0.74, -0.46))), X = normalize(cross(A, vec3(0.0, 0.0, 1.0)));
  mrF = transpose(mat3(X, cross(A, X), A));
  mrTw = 2.5 + 0.25 * sin(uTime * 0.04);
  if (uOwn[4] != 0.0) mrTw += uOwn[4] * (uOwn[4] > 0.0 ? 5.0 : 2.5);
  mrTurn = mod(uTravel * 0.06 + uTime * 0.012, TAU);
  if (mrB) mrTurn = mod(uTravel * 0.03, TAU) + 0.3 * c4;
  vec3 ro = vec3(0.0, mrC.y, 0.0) - F * D, rd = normalize(F + (vec3(p.x, 0.0, 0.0) + U * p.y) * fl);
  vec3 c = vec3(0.0);
  float miss, cov;
  if (uOwn[0] != 0.0 || uOwn[2] > 0.0) {
    vec4 th = mrThings(ro, rd);
    if (th.a < 1.0) {
      c = mrTable(ro, rd);
      if (uOwn[2] > 0.0 && rd.y < -0.01) {
        vec3 q = ro - rd * (ro.y / rd.y), up = rd * vec3(1.0, -1.0, 1.0);
        float fr = uOwn[2] * (mrB ? 0.55 : 1.0) * (0.07 + 0.6 * pow(1.0 - sat(-rd.y), 4.0));
        vec4 m = mrThings(q, up);
        c += fr * mix(mrRoom(up, 0.3, 0.06) * 0.35, m.rgb, m.a);
      }
    }
    c = mix(c, th.rgb, th.a);
  } else if (mrB) {
    vec3 o = (ro - mrC) / MR_E, d = normalize(rd / MR_E);
    miss = length(o - d * dot(o, d)); cov = mrIs(0.8, (miss - 1.0) / mrPx);
    float t = mrEgg(ro - mrC, rd, MR_E).x;
    d = rd / MR_E;
    if (t < 0.0) t = -dot(o, d) / dot(d, d);
    cov *= smoothstep(-mrPx, mrPx, ro.y + rd.y * t);
    if (cov < 1.0) c = mrTable(ro, rd);
    if (cov > 0.0) c = mix(c, mrDome(ro, rd, t), cov);
  } else {
    vec3 o = ro - mrC;
    float b = dot(o, rd); miss = length(o - rd * b); cov = mrIs(0.7, (miss - 1.0) / mrPx);
    if (cov < 1.0) c = mrTable(ro, rd);
    if (cov > 0.0) c = mix(c, mrBall(ro, rd, -b - sqrt(max(1.0 - miss * miss, 0.0))), cov);
  }
  if (uOwn[3] < 0.0) c *= mix(vec3(1.0), vec3(0.62, 0.7, 0.85), -uOwn[3]);
  c = 1.0 - exp(-1.55 * max(c, 0.0));
  return pow(c, vec3(0.4545));
}
