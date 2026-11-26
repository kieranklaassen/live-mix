// name: Opening stars
// a: Carved plaster
// b: Under the dome
// what: A wall of white plaster cut two fingers deep into a net of woven straps and stars, seen at a slant, with the low sun falling on it through an arch out of sight and blue shade in the rest; or the same net inside a shallow dome, in rings that lessen toward a round of daylight, with one round of sun lying on the far side.
// follows: The mix opens one angle, and every star sharpens; Tone sets its middle, Space the depth of the cut. Pockets take the colours of the piece and the spectrum: great stars the drone, kites the pad, six points the phrase, edges the texture. Lows lower the sun, a hit runs as a deepening ring, a cue draws a blade of sun across. Keys and voice light the flowers.
float spC, spS;      // cosine and sine of the one angle at which all lines meet
float spRin;         // how far the hollow corners of the great stars lie from their middles
float spDeep;        // how deep the cut is here
float spFine;        // 1 near, 0 where a pixel is wider than the fine work
float spOff;         // out of the cut: how far from the nearest strap
vec2 spIn;           // where in the one folded triangle we are
float spEdge;        // how much of the pixel belongs to a strap the ray just missed
const float SPW = 0.025;    // half a strap
const float SPA = 0.009;    // how far a strap lifts where it goes over, and dips where it goes under
// One strap in one corner of the triangle: e along a side from the corner and out from it, r the reach of the side's midpoint,
// k the corner's tangent, t2 the cosine and sine of the whole corner, way which strand lies on top.
float spStrap(vec2 e, float r, float k, vec2 t2, float way, float z) {
  if (e.y > e.x * k) { e = vec2(dot(t2, e), t2.y * e.x - t2.x * e.y); way = -way; }
  vec2 q = vec2(r - e.x, e.y);
  float d = abs(q.x * spC - q.y * spS), t = q.x * spS + q.y * spC;
  spOff = min(spOff, d - SPW);
  float top = spFine * SPA * way * exp(-t * t * 600.0);
  float g = (d - 0.5 * SPW) / 0.0035;
  top -= spFine * 0.006 * exp(-g * g);
  // a strap's face falls off a little to its edges
  top -= 0.16 * max(d - SPW * 0.72, 0.0);
  return max(d - SPW + 0.12 * min(z, 0.0), z - top);
}
// The carved wall as a distance; z is 0 at its face.
float spCut(vec3 s) {
  const vec2 g = vec2(1.0, 1.7320508);
  vec2 a = mod(s.xy, g) - 0.5 * g, b = mod(s.xy - 0.5 * g, g) - 0.5 * g;
  vec2 h = dot(a, a) < dot(b, b) ? a : b;
  float way = h.x * h.y < 0.0 ? -1.0 : 1.0;
  h = abs(h);
  float k = 0.8660254 * h.y - 0.5 * h.x;
  if (k > 0.0) { h -= 2.0 * k * vec2(-0.5, 0.8660254); way = -way; }
  if (h.y < 0.0) { h.y = -h.y; way = -way; }
  spIn = h;
  spOff = 1.0;
  float d = spStrap(h, 0.3943376, 0.2679492, vec2(0.8660254, 0.5), way, s.z);
  d = min(d, spStrap(vec2(0.5 - h.x, h.y), 0.1056624, 1.0, vec2(0.0, 1.0), -way, s.z));
  d = min(d, spStrap(vec2(0.2886751 - h.y, 0.5 - h.x), 0.1830127, 0.5773503, vec2(0.5, 0.8660254), -way, s.z));
  // the floor of a pocket: a trench along the straps, a raised field inside it
  float fl = -spDeep * (1.0 - 0.42 * smoothstep(0.022, 0.034, spOff));
  // a flower of twelve petals on the field of each great star, and a button in it
  vec2 e = vec2(0.9659258 * h.x + 0.258819 * h.y, 0.258819 * h.x - 0.9659258 * h.y);
  float q = spRin * 0.8 - 0.05;
  vec2 el = vec2((e.x - 0.62 * q) / (0.4 * q), e.y / (0.14 * q));
  float pet = 1.0 - dot(el, el);
  fl += spFine * 0.45 * spDeep * smoothstep(0.0, 0.6, pet) * (1.0 - 0.35 * smoothstep(0.4, 1.0, pet));
  fl += 0.5 * spDeep * (1.0 - smoothstep(0.11, 0.17, length(h) / q));
  return min(d, (s.z - fl) * 0.8);
}
// Walks a ray down into the cut. w is how wide a pixel is here: spEdge says how much of it a strap just missed still covers.
vec3 spWalk(vec3 s, vec3 v, float w) {
  float t = 0.0, last = 0.0, near = 1.0;
  for (int i = 0; i < 12; i++) {
    float d = spCut(s + v * t);
    if (d > last && s.z + v.z * t > -0.03 && i > 0) near = min(near, last);
    last = d;
    t += d;
    if (d < 0.0008) break;
  }
  spEdge = sat(1.0 - near / w);
  return s + v * t;
}
vec3 spNormal(vec3 s, float e) {
  float d = spCut(s);
  return normalize(vec3(spCut(s + vec3(e, 0, 0)) - d, spCut(s + vec3(0, e, 0)) - d, spCut(s + vec3(0, 0, e)) - d) + vec3(0, 0, 1e-5));
}
// How much of a light in direction l comes down to s.
float spSun(vec3 s, vec3 l, float soft) {
  float t = 0.014, o = 1.0;
  for (int i = 0; i < 7; i++) {
    float d = spCut(s + l * t);
    o = min(o, 0.5 + 0.5 * d / (soft * t + 0.001));
    if (o < 0.02) break;
    t += max(d, 0.012);
    if (s.z + l.z * t > SPA) break;
  }
  return smoothstep(0.0, 1.0, sat(o));
}
// The colour that sounds in a pocket here: by the place in the piece, and by which shape it is.
vec3 spGlow(vec3 m) {
  float big = (1.0 - smoothstep(0.2, 0.34, length(spIn)));
  float six = (1.0 - smoothstep(0.1, 0.15, length(spIn - vec2(0.5, 0.2886751))));
  float four = (1.0 - smoothstep(0.06, 0.09, length(spIn - vec2(0.5, 0.0))));
  float kite = sat(1.0 - big - six - four);
  vec3 k = uKind[0] * big * uDrone + uKind[1] * kite * uPad + uKind[3] * six * uPhrase * 1.5;
  k += uKind[2] * (1.0 - smoothstep(0.012, 0.035, spOff)) * uTexture * 1.2;
  float heart = exp(-dot(spIn, spIn) * 90.0);
  return m * 1.5 + k * 0.85 + heart * (uKind[3] * uKeys * 1.6 + vec3(1.0, 0.7, 0.4) * uMic);
}
// Plaster under this light, its deep places stained by the colour g and throwing some of it back.
vec3 spPlaster(vec3 light, vec3 g, float deep, vec2 s) {
  float m = max(g.r, max(g.g, g.b));
  vec3 hue = pow(g / max(m, 0.001), vec3(2.6));
  float grit = noise(s * 60.0) * 0.6 + noise(s * 23.0) * 0.4;
  vec3 alb = vec3(0.95, 0.92, 0.87) * (0.94 + 0.1 * grit * spFine);
  float on = deep * (1.0 - exp(-m * 4.0));
  alb = mix(alb, alb * (0.1 + 0.9 * hue), 0.95 * on);
  return alb * (light + hue * on * (0.03 + 0.2 * uEnergy * m)) * 1.4;
}
vec3 render(vec2 p) {
  bool dome = uVar > 0.5;
  float th = 0.8 + 0.16 * (uTone - 0.5) + 0.05 * sin(uTime * 0.05) + 0.34 * uLevel;
  th = clamp(th, 0.66, 1.13);
  spC = cos(th); spS = sin(th);
  spRin = (0.3943376 - 0.1020614 / cos(th - 0.2617994) * spS) * 1.0352762;
  float px = 1.0 / uRes.y;
  vec3 light, s, n, glow;
  float deep;
  if (!dome) {
    float yaw = 0.62 + 0.03 * sin(uTime * 0.031);
    vec3 fw = normalize(vec3(sin(yaw), 0.2, -cos(yaw)));
    vec3 rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
    vec3 v = normalize(fw * 1.3 + rt * p.x + up * p.y);
    vec3 ro = vec3(0.2 * sin(uTime * 0.017) + 0.2, -0.2, 1.55);
    float vz = max(-v.z, 0.08);
    float t = (ro.z - SPA) / vz;
    float foot = t * px / 1.3 / vz;
    spFine = (1.0 - smoothstep(0.004, 0.016, foot));
    s = ro + v * t;
    float hr = (length(s.xy - vec2(0.95, 0.12)) - 0.1 - 2.4 * (1.0 - uHits)) / 0.3;
    float ring = uHits * exp(-hr * hr);
    spDeep = 0.105 + 0.03 * uSpace + 0.04 * ring;
    s = spWalk(s, v, t * px / 1.3);
    n = spNormal(s, max(0.002, 0.4 * foot));
    float off = spOff;
    float along = sat(s.x / 4.0 + 0.1);
    vec3 gl = spGlow(piece(vec2(along, sat(0.55 - s.y / 2.6))).rgb);
    float depth = sat(-s.z / spDeep) * (1.0 - spEdge);
    float el = 0.5 - 0.15 * uLow + 0.04 * sin(uTime * 0.023);
    vec3 l = normalize(vec3(0.72, 0.68, el));
    float lit = spSun(s + n * 0.003, l, 0.1) * sat(dot(n, l)) / l.z * 0.5;
    lit = mix(lit, 0.5, spEdge);
    float ao = mix(1.0, 0.25 + 0.75 * smoothstep(-0.005, 0.1, off), depth);
    // the sun comes through an arch out of sight: a bright field with a soft curved edge, the rest in shade
    vec2 a = s.xy - vec2(1.3, -0.65) - 0.12 * vec2(cos(TAU * uLoop), sin(TAU * uLoop));
    a.x = abs(mod(a.x - 0.45 * a.y + 1.75, 3.5) - 1.75);
    float arch = length(vec2(a.x + 0.5, max(a.y, 0.0) * 1.1)) - 1.8;
    float pool = 1.0 - smoothstep(-0.1 - 3.0 * foot, 0.06 + 3.0 * foot, arch);
    // a cue: a shaft of sun goes by
    float sh = s.x - 0.45 * s.y - 0.1 - 2.8 * (1.0 - uCue);
    pool = max(pool, uCue * (1.0 - smoothstep(0.2, 0.35, abs(sh))));
    // far along the wall the carving runs together into one tone
    float far = smoothstep(0.012, 0.05, foot);
    lit = mix(lit, 0.3, far); ao = mix(ao, 0.75, far); deep = depth * (1.0 - 0.5 * far);
    light = vec3(1.75, 1.3, 0.84) * lit * pool;
    light += vec3(0.23, 0.3, 0.42) * ao * (0.68 + 0.36 * n.y + 0.3 * n.x);
    light += vec3(0.42, 0.24, 0.12) * depth * ao * pool * sat(0.6 - 0.6 * dot(n, l));
    glow = gl + kindColour(along * 4.0) * band(along) * 0.35; deep *= ao;
    light += uKind[4] * ring * (0.08 + 0.9 * deep);
  } else {
    p.x -= 0.18 * (1.0 - smoothstep(0.6, 1.1, uRes.x * px)); // a tall picture has the opening in its middle
    vec3 fw = normalize(vec3(0.29, 1.0, -0.2)), rt = normalize(cross(fw, vec3(0.25, 0, 1))), up = cross(rt, fw);
    vec3 v = normalize(fw * 0.85 + rt * p.x + up * p.y);
    vec3 ro = vec3(-0.12, -0.2, 0.1);
    float b = dot(ro, v);
    float t = -b + sqrt(max(b * b - dot(ro, ro) + 1.0, 0.0));
    vec3 x = ro + v * t;
    float sn = length(x.xz) + 1e-4;
    vec3 ev = vec3(-x.z, 0, x.x) / sn, eu = vec3(x.x * x.y / sn, -sn, x.z * x.y / sn);
    const float N = 12.0, OPEN = 0.16;
    vec2 uv = vec2(atan(x.z, x.x + 1e-5), log(sn / max(1.0 + x.y, 0.01))) * N / TAU;
    vec3 lv = vec3(dot(v, ev), dot(v, eu), -dot(v, x));
    float foot = t * px / 0.85 * N / (TAU * sn) / max(-lv.z, 0.2);
    spFine = (1.0 - smoothstep(0.004, 0.016, foot));
    float row = sat(-uv.y / 4.2);
    float hr = (row * 4.2 - 1.0 - 3.6 * (1.0 - uHits)) / 0.4;
    float ring = uHits * exp(-hr * hr);
    spDeep = 0.1 + 0.03 * uSpace + 0.03 * ring;
    s = spWalk(vec3(uv, SPA), lv, t * px / 0.85 * N / (TAU * sn));
    n = spNormal(s, max(0.002, 0.4 * foot));
    float off = spOff, depth = sat(-s.z / spDeep) * (1.0 - spEdge);
    vec3 gl = spGlow(piece(vec2(fract(atan(x.x, x.z + 1e-5) / TAU + 0.5), 0.1 + 0.8 * row)).rgb);
    vec3 toward = vec3(0, 0.86, 0) - x;
    vec3 l = normalize(vec3(dot(toward, ev), dot(toward, eu), -dot(toward, x) + 0.12));
    // the round of sun that the opening throws on the far side
    vec3 sd = normalize(vec3(-0.8, 0.48 - 0.06 * uLow + 0.04 * cos(TAU * uLoop), 0.4 + 0.12 * sin(TAU * uLoop)));
    vec3 thr = x + sd * (cos(OPEN) - x.y) / sd.y;
    float spot = (1.0 - smoothstep(-0.03, 0.03, length(thr.xz) - 0.23));
    // a cue: a blade of sun goes over the vault
    float sh = dot(x.xz, vec2(0.95, 0.3)) + 0.5 - 1.3 * (1.0 - uCue);
    float blade = uCue * (1.0 - smoothstep(0.06, 0.16, abs(sh)));
    vec3 ls = vec3(dot(sd, ev), dot(sd, eu), -dot(sd, x));
    l = normalize(mix(l, ls, spot));
    float lit = spSun(s + n * 0.003, l, mix(0.25, 0.1, spot)) * sat(dot(n, l));
    lit = mix(lit, sat(l.z), spEdge);
    float ao = mix(1.0, 0.2 + 0.8 * smoothstep(-0.005, 0.1, off), depth);
    float d2 = dot(toward, toward);
    light = mix(vec3(0.75, 0.9, 1.1) * 0.5 / (0.4 + d2) * (0.92 + 0.55 * x.x), vec3(3.1, 2.25, 1.35), spot) * lit;
    light += vec3(1.8, 1.3, 0.75) * blade * lit;
    light += vec3(0.12, 0.085, 0.068) * ao * (0.7 + 0.6 * n.y);
    light += vec3(0.34, 0.2, 0.09) * exp(-3.5 * dot(thr.xz, thr.xz)) * ao;
    glow = gl + kindColour(row * 4.0) * band(1.0 - row) * 0.35; deep = depth * ao;
    light += uKind[4] * ring * (0.05 + 1.0 * deep);
    // the opening: a rim, then the sky
    float o = sn / sin(OPEN), oe = 4.0 * px;
    light = mix(light, vec3(0.9, 0.85, 0.8), (1.0 - smoothstep(1.3, 1.3 + oe, o)) * (0.75 + 0.2 * cos((o - 1.06) * 52.0)));
    light = mix(light, vec3(0.12, 0.09, 0.07), 1.0 - smoothstep(1.05 - oe, 1.05, o));
    light = mix(light, vec3(1.1, 1.5, 2.0) + 0.6 * noise(x.xz * 12.0 + uTime * 0.02), 1.0 - smoothstep(1.0 - oe * 2.0, 1.0, o));
    deep *= step(1.3, o);
  }
  return screenOf(spPlaster(light, glow, deep, s.xy));
}
