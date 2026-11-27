// name: One jar
// a: On the sill
// b: Night side
// what: A big round white porcelain jar in the Korean way, a little lopsided, stands on a pale wooden shelf in morning light; the window lies slanting on the plaster and the jar throws one long soft shadow across it. Or, closer, a jar in the Chinese oil-spot glaze, iron black flecked with silver, the window bent small in its shoulder.
// follows: The drone deepens the shadows, the pad warms the glaze, texture lifts crackle or silver, the phrase sends a light round the shoulder, the bands are throwing rings. The piece tints the window's light, and the loop swings the sun. A hit is a ring of light sinking from lip to foot; a cue opens the window wider; keys glow from the mouth, a voice fills the room.
// own: 0 1 tall and slender, -1 low and broad; 1 1 a narrow neck, -1 a wide mouth on a narrow foot; 2 1 two smaller ones stand by, -1 a row along the shelf; 3 1 dry grasses stand in it, -1 a flowering branch; 4 1 a deep wet glaze in the pad's colour, -1 bare rough clay in the drone's; 5 1 painted with dots and bands in the texture's colour, -1 lobed like a melon; 6 1 a dark room with one low warm lamp, -1 an even white light from everywhere; 7 1 wall and shelf in the colours of drone and texture, -1 out of doors with the eye low, a sea and far hills behind
#define IF_(c) for (bool go = (c); go; go = false)
bool mjB;              // the black jar
vec3 mjL, mjS;         // towards the sun, and its colour
const vec3 mjW = normalize(vec3(-0.9, 0.36, -0.36)); // towards the window's sky
vec3 mjJ;              // the sun as the jar is lit by it, a little more from the side
float mjTop, mjC, mjGain;   // height of the lip, middle of the belly, how strongly things answer
float mjPx;            // a pixel's width at the jar
vec3 mjF = vec3(1.0);   // taller, broader, and how far a step may go

float mjSq(float x) { return x * x; }
float mjBell(float x) { return exp(-x * x); }
// The jar cut down its middle: distance from a point (r out from the axis, y up).
float mjCut(vec2 q, float hollow) {
  vec2 e = q.y > mjC ? (mjB ? vec2(1.04, 0.8) : vec2(1.03, 0.93)) : (mjB ? vec2(1.04, 1.13) : vec2(1.03, 0.94));
  vec2 b = vec2(q.x, q.y - mjC);
  float k0 = length(b / e), k1 = length(b / (e * e));
  float d = k0 * (k0 - 1.0) / max(k1, 1e-3);
  d = max(d, 0.04 - q.y);
  float foot = max(abs(q.y + 0.03) - 0.17, abs(q.x - 0.22) - (mjB ? 0.21 : 0.23) - 0.12 * max(q.y, 0.0));
  d = smin(d, foot, 0.05);
  float rl = mjB ? 0.34 : 0.45, y0 = mjTop - 0.16;
  vec2 s = vec2(q.x - rl - 1.25 * mjSq(max(q.y - y0, 0.0)), abs(q.y - mjTop + 0.3) - 0.278);
  d = smin(d, length(max(s, 0.0)) + min(max(s.x, s.y), 0.0) - 0.024, hollow > 0.5 ? 0.04 : 0.16);
  return hollow > 0.5 ? max(d, -max(q.x - rl + 0.024, y0 - 0.12 - q.y)) : d;
}
// The thrown jar sags.
vec3 mjSag(vec3 q) {
  float h = q.y - mjC;
  q.x -= 0.06 * smoothstep(-0.5, 0.9, h) - 0.03;
  q.x *= 1.0 + 0.035 * (1.0 - smoothstep(-0.6, 0.1, h)) * (1.0 - smoothstep(-0.6, 0.6, q.x));
  q.y += 0.03 * q.x * smoothstep(-0.4, 0.8, h);
  return q;
}
// A place at the vessel, put where it would be on the plain one.
vec3 mjPre(vec3 q) {
  q.xz /= mjF.y; q.y /= mjF.x;
  if (uOwn[1] > 0.0) q.xz /= 1.0 - 0.62 * uOwn[1] * smoothstep(0.75, 1.75, q.y);
  if (uOwn[1] < 0.0) q.xz /= 1.0 + uOwn[1] * (0.42 * (1.0 - smoothstep(0.1, 1.0, q.y)) - 0.62 * smoothstep(0.9, 1.95, q.y));
  IF_(uOwn[5] < 0.0) {
    float c = q.x / max(length(q.xz), 1e-4), c3 = c * (4.0 * c * c - 3.0), c6 = 2.0 * c3 * c3 - 1.0, a = sqrt(max(1.0 - c6 * c6, 0.0) + 1e-6);
    q.xz *= 1.0 - uOwn[5] * 0.13 * (0.75 - a) * smoothstep(0.1, 0.4, q.y) * (1.0 - smoothstep(mjTop - 0.5, mjTop - 0.15, q.y));
  }
  return q;
}
float mjOne(vec3 q, float hollow) {
  IF_(mjF.z < 1.0) q = mjPre(q);
  q = mjSag(q);
  return mjCut(vec2(length(q.xz), q.y), hollow) * mjF.z;
}
vec4 mjWho = vec4(0.0, 0.0, 0.0, 1.0);
float mjGap() { return max(2.35 * mjF.y, 1.6) / max(-uOwn[2], 0.02); }
vec4 mjNth(float id) { return vec4(id * mjGap(), 0.0, 0.0, abs(id) < 0.5 ? 1.0 : 0.6 + 0.45 * fract(id * 0.618 + 0.2)); }
vec4 mjMate(float k) { return k < 0.5 ? vec4(-1.28 * mjF.y - 0.5, 0.0, 0.3, 0.02 + 0.68 * uOwn[2]) : vec4(1.02 * mjF.y + 0.4, 0.0, -0.62, 0.02 + 0.45 * uOwn[2]); }
float mjJar(vec3 q, float hollow) {
  float gap = mjGap(), wide = mjF.y * (1.04 + 0.16 * max(-uOwn[1], 0.0)), best = 1e3, next = 1e3;
  mjWho = uOwn[2] < 0.0 ? mjNth(floor(q.x / gap + 0.5)) : vec4(0.0, 0.0, 0.0, 1.0);
  for (float k = uOwn[2] > 0.0 ? 0.0 : 9.0; k < 2.5; k++) {
    vec4 m = k < 1.5 ? mjMate(k) : vec4(0.0, 0.0, 0.0, 1.0);
    float l = length(q.xz - m.xz), w = wide * m.w, e = l * l - w * w;
    if (e < best) { mjWho = m; best = e; }
    next = min(next, abs(l - w) + 0.06);
  }
  float d = mjOne((q - mjWho.xyz) / mjWho.w, hollow) * mjWho.w;
  if (uOwn[2] != 0.0) d = min(d, uOwn[2] > 0.0 ? next : 0.3 + 0.5 * gap - abs(q.x - mjWho.x));
  return d;
}
float mjJar(vec3 q) { return mjJar(q, 1.0); }
// What stands in it, in a flat sheet: x how much is there, y 1 for a flower or an ear.
vec2 mjSt(vec2 q, float soft) {
  float y0 = mjTop * mjF.x - 0.12, grow = abs(uOwn[3]);
  vec2 got = vec2(0.0);
  IF_(q.y > y0 - 0.1 && q.y < y0 + 3.4 && abs(q.x) < 3.2) {
  if (uOwn[3] > 0.0) {
    for (float i = 0.0; i < 13.0; i++) {
      float h = fract(i * 0.618 + 0.13), h2 = fract(i * 0.382 + 0.57), long_ = (1.15 + 1.0 * h2) * grow, u = (q.y - y0) / long_;
      if (u < 0.0 || u > 1.08) continue;
      float lean = (h - 0.5) * 2.0;
      float x = 0.16 * lean + lean * (0.35 * u + 0.75 * u * u) * long_ * 0.7 + 0.05 * u * u * sin(uTime * 0.31 + i * 1.7);
      float slope = 0.7 * lean * (0.35 + 1.5 * u), w = (0.011 + 0.045 * smoothstep(0.62, 0.8, u) * (1.0 - smoothstep(0.86, 1.06, u)) * (0.7 + 0.3 * sin(u * 150.0))) * step(u, 1.06);
      float d = abs(q.x - x) / sqrt(1.0 + slope * slope);
      float m = (1.0 - smoothstep(w - soft, w + soft, d)) * min(1.0, w / soft);
      if (m > got.x) got = vec2(m, smoothstep(0.6, 0.72, u));
    }
  } else for (float i = 0.0; i < 4.0; i++) {
    vec2 a = i < 0.5 ? vec2(0.0, y0) : vec2(0.18, y0) + vec2(0.3, 0.52) * grow * (0.3 + 0.75 * i) * vec2(0.5 + 0.2 * i, 0.75);
    vec2 to = (i < 0.5 ? vec2(1.5, 1.75) : i < 1.5 ? vec2(-0.85, 0.95) : i < 2.5 ? vec2(1.05, 0.12) : vec2(-0.25, 0.85)) * grow;
    vec2 v = q - a;
    float u = sat(dot(v, to) / max(dot(to, to), 1e-4));
    vec2 side = vec2(-to.y, to.x) * (0.16 * sin(u * 3.1)) + vec2(0.0, 0.02 * u * sin(uTime * 0.3 + i));
    float d = length(v - to * u - side), w = (i < 0.5 ? 0.034 : 0.02) * (1.15 - 0.8 * u);
    float m = (1.0 - smoothstep(w - soft, w + soft, d)) * min(1.0, w / soft);
    if (m > got.x) got = vec2(m, got.y);
    for (float k = 0.0; k < 6.0; k++) {
      float b = (k + 0.9) / 6.4, h = fract(i * 0.37 + k * 0.618);
      vec2 c = v - to * b - vec2(-to.y, to.x) * (0.16 * sin(b * 3.1)) - (h - 0.5) * vec2(0.16, -0.13) - vec2(0.0, 0.02 * b * sin(uTime * 0.3 + i));
      float r = (0.055 + 0.07 * fract(h * 7.3)) * grow * (0.82 + 0.18 * cos(5.0 * atan(c.y, c.x + 1e-5) + k));
      m = 1.0 - smoothstep(r - soft, r + soft, length(c * vec2(1.0, 1.15)));
      if (m > 0.01) got = vec2(max(m, got.x), mix(got.y, 0.45 + 0.55 * smoothstep(0.01, 0.1, length(c)), m));
    }
  }
  }
  return got;
}
float mjTw = 1.0;
float mjDark() { return max(uOwn[6], 0.0); }

// How much of a light of some width the jar lets by.
float mjY; // how high up the jar the last shadow asked for was thrown from
float mjShadeOf(vec3 q, vec3 l, float wide, float shake) {
  vec3 o = q - vec3(0.0, mjF.x, 0.0);
  float t = -dot(o, l), u = -dot(q.xz, l.xz) / dot(l.xz, l.xz);
  float y = q.y + l.y * u;
  float far = max(max(t, u), 0.0);
  mjY = y;
  float d = smin(mjOne(q + l * t, 0.0), mjOne(q + l * u, 0.0), 0.12) + 0.02 + shake * sin(y * 8.0 + uHits * 20.0);
  float w = wide * far + 0.015;
  return mix(1.0, smoothstep(-w, w, d), smoothstep(-0.3, 0.25, max(t, u)));
}
float mjShade(vec3 q, vec3 l, float wide, float shake) {
  float s = 1.0, x = (q.x - l.x * q.z / l.z) / mjGap(), id = floor(x - 0.5);
  for (float k = uOwn[2] == 0.0 ? 2.0 : 0.0; k < 2.5; k++) {
    vec4 a = uOwn[2] < 0.0 ? mjNth(id + k) : k < 1.5 ? mjMate(k) : vec4(0.0, 0.0, 0.0, 1.0);
    float d = mjShadeOf((q - a.xyz) / a.w, l, wide, shake);
    s *= uOwn[2] < 0.0 ? mix(d, 1.0, smoothstep(0.9, 1.45, abs(x - id - k))) : d;
  }
  return s;
}
// The sun through the window, as it lies at a place in the room; hue is the light the piece lets through.
float mjPatch(vec3 q, out vec3 hue) {
  float t = (-7.0 - q.x) / mjL.x, open = 4.0 * uCue * (1.0 - uCue);
  vec2 w = q.yz + mjL.yz * t;
  float s = mix(0.42, 0.14, uTone);
  if (mjB) s *= 3.0;
  vec2 a = vec2(w.x - 2.5, w.y + 4.75);
  vec2 hw = (mjB ? vec2(2.4, 1.9) : vec2(1.95, 1.65)) + open * vec2(0.5, 0.9);
  vec2 e = (1.0 - smoothstep(hw - s, hw + s, abs(a)));
  float bars = 1.0 - 0.45 * mjBell(a.y / (0.1 + 0.4 * s)) - 0.3 * mjBell((a.x - 0.35) / (0.1 + 0.4 * s));
  float fold = sin(a.y * 7.0 + 0.8 * sin(a.x * 0.8 + uTime * 0.11) + 0.6 * sin(uTime * 0.07)) * sin(a.y * 3.1 - uTime * 0.05 + 1.0);
  vec2 uv = 0.5 - a.yx / (mjB ? vec2(5.4, 6.0) : vec2(3.8, 4.4)), in1 = (1.0 - smoothstep(0.36, 0.5, abs(uv - 0.5)));
  vec4 m = piece(uv) * 0.5 + piece(uv + vec2(0.02, 0.05)) * 0.25 + piece(uv - vec2(0.02, 0.05)) * 0.25;
  hue = mix(vec3(1.0), m.rgb / max(max(m.r, max(m.g, m.b)), 0.02) * 1.15, sat(m.a * 0.6 * mjGain) * in1.x * in1.y);
  {
    float bare = max(-uOwn[7], -0.75 * uOwn[6]);
    return mix(e.x * e.y * (mjB ? 1.0 : bars) * (1.0 + 0.1 * fold), mix(0.62, 1.0, max(-uOwn[7], 0.0)), bare);
  }
  return e.x * e.y * (mjB ? 1.0 : bars) * (1.0 + 0.1 * fold);
}
float mjRing() { return mix(0.0, mjTop - 0.04, uHits); } // how far a struck ring has sunk
vec3 mjLit(vec3 q, vec3 n) {
  vec3 hue;
  float shake = 0.06 * 4.0 * uHits * (1.0 - uHits);
  float lit = mjShade(q, mjL, mix(mjB ? 0.16 : 0.11, 0.04, uTone) * (1.0 + 2.5 * max(-uOwn[6], 0.0)), shake);
  if (q.z > 1.19) lit *= mjTw;
  float ring = uHits * mjBell((mjY - mjRing()) / 0.16);
  float sun = mjPatch(q, hue) * sat(dot(n, mjL) * 1.15) * (lit + 0.5 * (1.0 - lit) * ring);
  float sky = sat(dot(n, mjW)) * mjShade(q, mjW, 0.34, shake);
  vec3 v = vec3(0.0, 1.0, 0.0) - q;
  float d2 = dot(v, v), ao = 1.0 - 0.8 * sat(dot(n, v) / sqrt(d2)) / max(d2, 1.0);
  ao *= 1.0 - 0.6 * exp(-max(length(q.xz) - 0.4, 0.0) * 5.0) * exp(-q.y * 8.0);
  float near = exp(-max(q.x + 3.0, 0.0) * 0.14);
  vec3 room = vec3(0.31, 0.295, 0.275) * (0.72 + 0.35 * near) * (1.0 + 0.35 * uCue + 0.3 * uMic * mjGain);
  float deep = sat(uDrone * mjGain) * (1.0 - lit);
  room *= mix(vec3(1.0), uKind[0] * 0.55 + 0.1, 0.6 * deep);
  sky *= 1.0 - 0.45 * deep;
  if (uOwn[6] != 0.0) {
    float even = max(-uOwn[6], 0.0);
    room *= mix(vec3(1.0), vec3(0.13, 0.16, 0.22), mjDark()) * (1.0 + 0.75 * even); sky *= (1.0 - 0.85 * mjDark()) * (1.0 + 0.4 * even);
  }
  // what the struck lip or the keys in the mouth throw on the wall
  vec3 o = vec3(0.0, mix(1.2, mjTop, uHits) * mjF.x, 0.0) - q, o2 = vec3(0.0, mjTop * mjF.x + 0.15, 0.0) - q;
  room += (uKind[4] * 0.6 + 0.4) * vec3(1.0, 0.9, 0.75) * 0.5 * uHits * mjGain * sat(dot(n, o) / length(o)) / (0.5 + dot(o, o))
        + (uKind[3] * 0.4 + 0.6) * vec3(1.0, 0.82, 0.6) * 0.6 * uKeys * mjGain * sat(dot(n, o2) / length(o2)) / (0.4 + dot(o2, o2));
  return mjS * hue * sun + vec3(0.38, 0.385, 0.39) * sky * (0.7 + 0.5 * near) + room * ao;
}
vec3 mjWall(vec3 q) {
  float big = noise(q.xy * 0.9 + 3.0), mid = noise(q.xy * vec2(2.3, 3.1) + 9.0 * big);
  vec2 tq = rot(0.5) * q.xy * vec2(2.6, 7.0);
  float rake = noise(tq) - noise(tq + vec2(0.16, 0.3)) + 0.35 * (noise(q.xy * 24.0) - 0.5);
  vec3 alb = mix(vec3(0.8, 0.735, 0.635), vec3(0.87, 0.86, 0.83), float(mjB));
  if (uOwn[7] > 0.0) alb = mix(alb, uKind[0] * uKind[0] * 0.9 + 0.02, uOwn[7]);
  alb *= 0.95 + 0.07 * big + 0.05 * mid;
  vec3 c = alb * mjLit(q, normalize(vec3(rake * (mjB ? 0.05 : 0.08), 0.0, -1.0)));
  return c * (1.0 - 0.45 * exp(-q.y * 9.0)) * (1.0 - 0.16 * smoothstep(2.0, 4.5, q.y));
}
vec3 mjWood(vec2 q) {
  float w = noise(q * vec2(0.5, 1.6) + 4.0);
  float ring = noise(vec2(q.x * 0.35 + 2.0, q.y * 8.0 + 5.0 * w)), fib = noise(vec2(q.x * 2.2, q.y * 26.0));
  vec3 plank = mix(vec3(0.72, 0.58, 0.43), vec3(0.95, 0.83, 0.68), sat(0.25 + 0.55 * ring + 0.35 * fib)) * (0.92 + 0.14 * w);
  if (uOwn[7] > 0.0) plank = mix(plank, uKind[2] * uKind[2] * (0.55 + 0.4 * ring + 0.2 * fib), uOwn[7]);
  if (uOwn[7] < 0.0) plank = mix(plank, (uKind[0] * uKind[0] * 0.8 + 0.12) * (0.7 + 0.35 * noise(q * 7.0) + 0.3 * noise(q * 31.0)), -uOwn[7]);
  return plank;
}
vec3 mjAir(vec3 rd) {
  float el = rd.y / max(length(rd.xz), 1e-3), a = rd.x / max(rd.z, 0.1), day = 1.0 - 0.93 * mjDark();
  vec3 low = uKind[3] * uKind[3], high = mix(uKind[3], uKind[2], 0.5) * uKind[3];
  vec3 c = mix(low * 1.05 + 0.05, high * 0.75, smoothstep(0.0, 0.42, el));
  vec2 vq = vec2(a * 2.2 + uTravel * 0.006, el * 11.0);
  float veil = 0.6 * noise(vq) + 0.35 * noise(vq * 2.7 + 5.0);
  c *= 0.9 + 0.3 * smoothstep(0.4, 0.75, veil);
  float glow = exp(-mjSq((a + 0.42) * 2.6) - mjSq((el - 0.03) * 7.0));
  c += (uKind[4] * 0.5 + 0.5) * glow * (0.28 + 0.4 * uLevel) * mjS * 0.5;
  for (float i = 0.0; i < 3.0; i++) {
    float top = (0.075 - 0.02 * i) * (0.25 + 1.3 * noise(vec2(a * (2.0 + i) + i * 7.3, 2.0 + i)) + 0.2 * noise(vec2(a * 11.0, i))) * smoothstep(-0.1, 0.35, abs(a + 0.12 + 0.25 * i));
    c = mix(c, mix(low, uKind[2] * uKind[2], 0.4 + 0.2 * i) * (0.75 - 0.14 * i), (1.0 - smoothstep(-0.0015, 0.0015, el - top)) * step(0.0, el));
  }
  if (el < 0.0) {
    float z = 1.0 / max(-el, 0.004), rip = noise(vec2(a * z * 5.0, z * 2.6 + uTime * 0.12)) * exp(-z * 0.012);
    vec3 sea = mix(uKind[2] * uKind[2] * 0.6, low, exp(el * 7.0) * 0.75) * (0.82 + 0.3 * rip);
    sea += glow * mjS * 0.3 * rip + uKind[4] * uHits * rip * rip * 0.15;
    c = mix(c, sea, smoothstep(0.0, 0.003, -el));
  }
  return c * day * (0.85 + 0.3 * uLevel);
}
// Everything but the jar.
vec3 mjRoom(vec3 ro, vec3 rd) {
  const float zE = -1.2, zW = 1.2, deep = 0.34;
  float tE = (zE - ro.z) / rd.z, tW = (zW - ro.z) / rd.z;
  vec3 e = ro + rd * tE;
  if (rd.z > 0.0 && ro.z < zE && e.y < 0.0) {
    if (e.y < -deep + 3.0 * min(uOwn[7], 0.0)) return vec3(0.12, 0.11, 0.105) * (0.5 + 0.5 * exp((e.y + deep) * 1.2));
    vec3 hue;
    float s = mjPatch(vec3(e.x, 0.0, zE), hue);
    vec3 c = mjWood(vec2(e.x, e.y * 0.8 + 7.0)) * (mjS * hue * s * 0.36 + vec3(0.26, 0.28, 0.31) * (1.0 - 0.8 * mjDark())) * (0.55 + 0.35 * exp(e.y * 5.0));
    return c * (1.0 + 0.5 * mjBell(e.y / 0.016));
  }
  float tF = -ro.y / min(rd.y, -1e-4);
  if (rd.y < 0.0 && (rd.z <= 0.0 || tF < tW)) {
    vec3 q = ro + rd * tF;
    return mjWood(q.xz) * mjLit(q, vec3(0.0, 1.0, 0.0)) * (1.0 - 0.4 * exp((q.z - zW) * 7.0) * (1.0 - max(-uOwn[7], 0.0)));
  }
  vec3 c = vec3(0.0);
  IF_(uOwn[7] > -1.0) c = mjWall(ro + rd * tW);
  IF_(uOwn[7] < 0.0) c = mix(c, mjAir(rd), -uOwn[7]);
  return c;
}
// What the glaze mirrors: shelf, wall, the dark of the room and the window in it.
vec3 mjMirror(vec3 q, vec3 r, float soft) {
  vec3 wall = mix(vec3(0.06, 0.064, 0.072), vec3(0.4, 0.385, 0.36), smoothstep(0.05, 0.5, r.z)), c = wall;
  if (r.y < 0.0) {
    vec3 s = q - r * (q.y / min(r.y, -1e-3));
    float lit = mjShade(vec3(s.x, 0.0, s.z), mjL, 0.2, 0.0);
    c = mix(vec3(0.05), vec3(0.72, 0.62, 0.5) * (0.26 + 0.5 * lit), smoothstep(-1.4, -1.0, s.z) * (1.0 - smoothstep(4.0, 10.0, abs(s.x))));
    c = mix(c, wall * (0.55 + 0.45 * lit), smoothstep(1.1, 1.4, s.z));
  }
  float t = (-6.0 - q.x) / min(r.x, -1e-3);
  vec2 w = (q + r * t).yz - vec2(3.7, -3.6);
  vec2 hw = vec2(2.0, 2.1 + 1.2 * 4.0 * uCue * (1.0 - uCue));
  vec2 in2 = (1.0 - smoothstep(hw - soft, hw + soft, abs(w)));
  float bars = 1.0 - (1.0 - min(soft, 1.0)) * max((1.0 - smoothstep(0.1, 0.2, abs(w.y))), (1.0 - smoothstep(0.1, 0.2, abs(w.x - 0.4))));
  if (uOwn[7] < 0.0) c = mix(c, uKind[3] * uKind[3] * step(0.0, r.y) * 0.8 + c * step(r.y, 0.0), -uOwn[7] * 0.8);
  if (uOwn[6] > 0.0) { c *= 1.0 - 0.8 * uOwn[6]; in2 *= 1.0 - 0.45 * uOwn[6]; }
  return c + step(r.x, -0.01) * in2.x * in2.y * bars * vec3(5.0, 5.2, 5.5) * (0.8 + 0.4 * uLevel + 0.5 * uCue);
}
// A craze's nearest crack.
float mjCraze(vec2 p) {
  vec2 i = floor(p), f = p - i, a = vec2(9.0), b = vec2(9.0);
  float da = 99.0, db = 99.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = g + 0.02 + 0.96 * hash22(i + g) - f;
    float d = dot(o, o);
    if (d < da) { db = da; b = a; da = d; a = o; } else if (d < db) { db = d; b = o; }
  }
  return (db - da) / (2.0 * max(length(b - a), 1e-3));
}
// Oil spots: in every little box of space a ball, cut by the skin into a disc.
float mjSpots(vec3 q, float f, float seed, float px, float wob) {
  q.xy *= rot(seed); q.yz *= rot(seed * 1.7);
  q = q * f + seed;
  vec3 i = floor(q), o = q - i - 0.5;
  float h = hash31(i + seed), h2 = hash31(i.zxy + 3.7 + seed), h3 = hash31(i.yzx + 9.1 + seed);
  float r = 0.12 + 0.3 * h * h;
  o -= (vec3(h2, h3, fract(h * 7.3)) - 0.5) * (0.96 - 2.0 * r);
  float w = px * f * 0.65 + 0.015;
  return (1.0 - smoothstep(r - w, r + w, length(o) + wob)) * step(0.25, h3) * (0.6 + 0.4 * h2);
}
vec3 mjSkin(vec3 q, vec3 rd) {
  vec2 h = vec2(0.003, -0.003);
  vec3 n = normalize(h.xyy * mjJar(q + h.xyy) + h.yyx * mjJar(q + h.yyx) + h.yxy * mjJar(q + h.yxy) + h.xxx * mjJar(q + h.xxx) + vec3(0.0, 1e-7, 0.0));
  vec3 q0 = q;
  IF_(uOwn[2] != 0.0) { mjJar(q); q = (q - mjWho.xyz) / mjWho.w; }
  IF_(mjF.z < 1.0) q = mjPre(q);
  vec3 g = mjSag(q);
  float r = length(g.xz), y = g.y, th = atan(g.x, -g.z - 1e-5);
  float rl = mjB ? 0.34 : 0.45, ins = (1.0 - smoothstep(rl - 0.02, rl, r)) * step(mjTop - 0.35, y);
  float body = (1.0 - ins) * smoothstep(0.12, 0.2, y) * (1.0 - smoothstep(mjTop - 0.22, mjTop - 0.1, y));
  // the marks of throwing, one ring for each band, and the seam where the halves were joined
  float f = clamp((y - 0.16) / (mjTop - 0.34), 0.0, 0.9999) * 16.0;
  float fi = floor(f), fr = f - fi, bd = uBands[int(fi)] * mjGain;
  float bump = mjSq(sin(PI * fr));
  vec3 n0 = n;
  n.y += body * (0.01 + 0.07 * bd) * sin(TAU * fr) * (0.6 + 0.4 * sin(th * 2.0 + fi * 1.7));
  float se = (y - mjC + 0.012 * sin(th * 3.0 + 1.0)) / 0.028;
  if (!mjB) n.y += 0.26 * se * mjBell(se) * (0.65 + 0.35 * sin(th * 2.3 + 0.5));
  n += body * 0.05 * (vec3(noise(g * 3.1), noise(g * 3.1 + 7.0), noise(g * 3.1 + 13.0)) - 0.5);
  n = normalize(n);

  float nl = dot(n, mjJ), nw = dot(n, mjW), face = sat(-dot(n, rd));
  float sun = nl > 0.16 ? nl : mjSq(max(nl + 0.16, 0.0)) / 0.64;
  float sky = mjSq(sat(nw * 0.68 + 0.32));
  float flank = (1.0 - smoothstep(-0.5, 0.35, nl));
  vec3 k0 = uKind[0] * 0.55 + 0.25;
  vec3 room = vec3(0.066, 0.078, 0.102) * mix(vec3(1.0), k0 * vec3(0.55, 0.6, 0.75), sat(0.9 * uDrone * mjGain) * flank);
  float wallB = sat(dot(n, normalize(vec3(0.75, 0.0, 0.5)))), under = sat(0.35 - 0.65 * n.y);
  vec3 back = vec3(0.08, 0.074, 0.068) * wallB * wallB * (1.0 + 1.5 * uMic * mjGain);
  vec3 up = vec3(0.34, 0.28, 0.2) * under * (0.12 + 0.88 * sat(0.45 - 0.6 * n.x));
  float ao = mix(1.0 - 0.45 * mjBell((y - mjTop + 0.16) / 0.07) * smoothstep(-0.1, 0.3, n.y), 0.12 + 0.5 * smoothstep(mjTop - 0.25, mjTop, y), ins);
  ao *= (0.4 + 0.6 * smoothstep(0.0, 0.5, y)) * smoothstep(-0.02, 0.07, y);
  if (uOwn[6] != 0.0) { float k = 1.0 - 0.86 * mjDark() + 0.7 * max(-uOwn[6], 0.0); room *= k; back *= k; sky *= k * 0.8 + 0.2; up *= 1.0 - 0.7 * mjDark(); }
  if (uOwn[6] < 0.0) { sun = mix(sun, 0.5 + 0.25 * nl, -0.6 * uOwn[6]); room += 0.16 * -uOwn[6]; }
  vec3 light = mjS * 1.05 * sun * mix(1.0, sat(0.2 + 1.2 * g.x), ins) + vec3(0.36, 0.4, 0.46) * sky * ao + (room + back + up) * ao;
  float rake = mjBell((nl - 0.3) / 0.34);
  float ring = uHits * mjBell((y - mjRing()) / (mjB ? 0.08 : 0.12));
  float ph = 0.35 + 0.8 * sin(uTravel * 0.21 + uTime * 0.05);
  float run = mjBell((y - (mjB ? 1.55 : 1.56) - 0.03 * sin(th * 2.0)) / 0.06) * mjBell((th - ph) / 0.6) * uPhrase * mjGain;
  vec3 white = vec3(1.0, 0.97, 0.92);
  vec3 c;
  float fres = 0.045 + 0.75 * pow(1.0 - face, 5.0);
  vec3 rr = reflect(rd, normalize(mix(n0, n, 0.25)));
  float brim = y - 0.27 - 0.035 * sin(th * 2.0 + 0.6) - 0.02 * sin(th * 5.0);
  if (mjB) rr = normalize(rr + vec3(0.0, 0.6 * mjBell(brim / 0.03) * brim / 0.03, 0.0));
  vec3 mir = mjMirror(q0, rr, uOwn[4] > 0.0 ? mix(mjB ? 0.12 : 1.6, 0.16, uOwn[4]) : mjB ? 0.12 : 1.6);
  if (!mjB) {
    vec3 alb = vec3(0.9, 0.895, 0.865);
    // blush: peach where the fire reached, most where light rakes
    float bl = noise(g * vec3(1.5, 1.8, 1.5) + vec3(4.2, 1.0, 0.3)), bl2 = noise(g * 4.3 + 8.0);
    float blush = smoothstep(0.42, 0.72, bl + 0.35 * (bl2 - 0.5)) * body;
    vec3 peach = mix(vec3(0.93, 0.7, 0.55), uKind[1] * 0.6 + 0.4, 0.25);
    alb = mix(alb, alb * peach, sat(blush * (0.3 + 1.1 * uPad * mjGain) * (0.5 + 0.6 * rake)));
    alb *= 0.97 + 0.05 * bl2;
    // the crackle
    float la = clamp((y - mjC) / 0.94, -0.97, 0.97);
    vec2 cu = vec2(th, log((1.0 + sin(la)) / cos(la * 1.2))) * 7.5 + 1.4 * vec2(noise(g * 3.0), noise(g * 3.0 + 5.0));
    float cr = mjCraze(cu), wpx = mjPx * 7.5 / max(r * face, 0.12);
    float line = (1.0 - smoothstep(0.004, 0.012 + wpx, cr)) * min(1.0, 1.0 / (0.6 + 8.0 * wpx)) * body * smoothstep(0.1, 0.35, face);
    alb *= 1.0 - line * vec3(0.42, 0.5, 0.58) * sat(0.2 + 1.2 * uTexture * mjGain) * (0.12 + 0.88 * rake) * (0.35 + 0.65 * smoothstep(0.3, 0.6, noise(g * 2.1 + 4.0) + 0.2 * uTexture));
    alb *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.1, y));
    c = alb * light;
    c *= 1.0 + 0.1 * bd * (bump - 0.5) * body;
    c += min(fres, 0.2) * mir * 0.5 * (1.0 - ins);
    c += run * mix(white, uKind[3], 0.4) * 0.8;
    c = mix(c, mix(white, uKind[4], 0.4) * 1.15, 0.75 * ring);
  } else {
    // iron black, thin and rusty at the lip, stopped in a wavering roll above the bare clay of the foot
    float edge = brim;
    float clay = (1.0 - smoothstep(-0.012, 0.012, edge)), lip = smoothstep(mjTop - 0.075, mjTop - 0.01, y);
    vec3 alb = mix(vec3(0.012, 0.0105, 0.011), vec3(0.16, 0.07, 0.03), lip * 0.8) + (uKind[1] * 0.5 + 0.5) * vec3(0.13, 0.042, 0.016) * uPad * mjGain * (0.12 + smoothstep(0.8, 1.75, y) * smoothstep(0.3, 0.7, noise(g * vec3(13.0, 1.6, 13.0)))) * (1.0 - lip);
    float px = mjPx / max(face, 0.15);
    float crowd = noise(g * 1.7 + 2.0), thick = smoothstep(0.3, 0.75, crowd);
    float wob = 0.16 * (noise(g * 24.0) - 0.5);
    float sp = mjSpots(g, 6.1, 1.3, px, wob) * thick;
    sp = max(sp, 0.95 * mjSpots(g, 9.7, 5.1, px, wob));
    sp = max(sp, 0.9 * mjSpots(g, 14.5, 8.7, px, wob));
    sp = max(sp, 0.8 * mjSpots(g, 22.0, 2.9, px, 0.0));
    sp = max(sp, 0.7 * mjSpots(g, 33.0, 6.3, px, 0.0) * (1.0 - 0.6 * thick));
    sp *= body * (1.0 - clay) * smoothstep(0.3, 0.5, y) * (0.7 + 0.5 * noise(g * 40.0));
    vec4 m = piece(vec2(0.5 + th * 0.3, 1.0 - y / mjTop));
    vec3 silver = mix(vec3(0.5, 0.53, 0.56), vec3(0.2) + m.rgb, sat(m.a * 0.8 * mjGain));
    float gl = 0.07 + 0.3 * light.g + 0.75 * pow(sat(dot(rr, mjW)), 3.0);
    silver *= gl * (0.6 + 0.6 * uTexture * mjGain + 0.9 * bd * (0.3 + 0.7 * bump) + 0.3 * m.a);
    c = alb * light + silver * sp * 0.8;
    c += (fres * 1.35 + 0.015) * (1.0 - 0.45 * sp) * mix(0.3, 1.0, body) * mir * (1.0 - 0.8 * ins) * (0.5 + 0.5 * ao);
    c = mix(c, vec3(0.3, 0.2, 0.135) * light * (0.85 + 0.3 * noise(g * 9.0)), clay);
    c += run * mix(white, uKind[3], 0.45) * 0.4 + ring * mix(white, uKind[4], 0.4) * 0.3;
  }
  float fine = 0.5, patchy = 0.5;
  IF_(uOwn[4] != 0.0 || uOwn[5] > 0.0) { fine = noise(g * 26.0); patchy = noise(g * vec3(2.0, 3.0, 2.0) + 2.0); }
  IF_(uOwn[4] > 0.0) {
    float end = y - 0.24 - 0.05 * sin(th * 3.0 + 1.1) - 0.03 * sin(th * 7.0), foot = 1.0 - smoothstep(-0.012, 0.012, end);
    float run2 = noise(vec2(sin(th) * 5.0 + 9.0, cos(th) * 5.0 + y * 0.8)), thick = sat(1.15 - 0.42 * y + 0.45 * (run2 - 0.5) + 0.5 * mjBell(end / 0.06));
    vec3 k = uKind[1] * uKind[1];
    vec3 deep = mix(k * 1.15 + 0.14, k * 0.8, sat(thick * 1.3)); deep = mix(deep, k * k * 0.9, smoothstep(0.55, 1.2, thick));
    deep = mix(deep, vec3(0.5, 0.42, 0.32), 0.55 * smoothstep(mjTop - 0.07, mjTop - 0.01, y) + 0.12 * mjBell(se) * body);
    deep *= (0.86 + 0.28 * fine * (0.4 + uTexture * mjGain)) * (1.0 + 0.5 * bd * (bump - 0.3) * body) * (1.0 + 0.35 * uPad * mjGain * (run2 - 0.3));
    vec3 wet = deep * light + (fres * 1.2 + 0.012) * mir * (1.0 - 0.8 * ins) * (0.5 + 0.5 * ao);
    wet = mix(wet, vec3(0.34, 0.24, 0.16) * light * (0.85 + 0.3 * patchy), foot);
    wet += run * mix(white, uKind[3], 0.4) * 0.5 + ring * mix(white, uKind[4], 0.4) * 0.45;
    c = mix(c, wet, uOwn[4]);
  }
  IF_(uOwn[4] < 0.0) {
    vec3 clay = (uKind[0] * uKind[0] * 0.85 + 0.015) * (0.66 + 0.4 * fine + 0.35 * patchy);
    clay = mix(clay, uKind[1] * uKind[1] * 0.8 + 0.06, 0.6 * smoothstep(0.35, 0.95, n.y + 0.5 * (patchy - 0.5) + 0.25 * fine) * (0.5 + 0.5 * uPad) * (1.0 - ins));
    clay *= 1.0 - 0.22 * (0.5 - 0.5 * cos(TAU * fr * 2.0)) * body * (0.35 + bd);
    clay *= 1.0 - 0.5 * smoothstep(0.72, 0.85, fine) * (0.3 + 0.7 * uTexture * mjGain);
    vec3 dry = clay * light * 1.05 + run * mix(white, uKind[3], 0.5) * 0.35 + ring * mix(white, uKind[4], 0.5) * 0.9;
    c = mix(c, dry, -uOwn[4]);
  }
  IF_(uOwn[5] > 0.0) {
    float rows = (y - mjC) / 0.235 + 0.5, row = floor(rows), many = 13.0;
    vec2 cell = vec2(fract(th / TAU * many + 0.5 * mod(row, 2.0)) - 0.5, rows - row - 0.5) * vec2(TAU / many * max(r, 0.2), 0.235);
    float w = mjPx * 1.2 + 0.004, dot_ = 1.0 - smoothstep(0.066 - w, 0.066 + w, length(cell) + 0.02 * (patchy - 0.5));
    dot_ *= step(abs(row), 2.0);
    float bandAt = min(abs(y - mjC - 0.66), min(abs(y - mjC - 0.73) + 0.012, abs(y - mjC + 0.64)));
    float ink = max(dot_, 1.0 - smoothstep(0.022 - w, 0.022 + w, bandAt + 0.008 * sin(th * 5.0)));
    ink *= (0.62 + 0.38 * fine) * (1.0 - ins) * (0.75 + 0.25 * uTexture);
    c = mix(c, (uKind[2] * uKind[2] * 0.8 + 0.01) * light * (0.9 + 0.8 * bd) + c * 0.12, uOwn[5] * ink);
  }
  c += ins * uKeys * mjGain * mix(vec3(1.0, 0.8, 0.5), uKind[3], 0.3) * 0.35 * smoothstep(mjTop - 0.35, mjTop, y);
  return c;
}
vec3 render(vec2 p) {
  mjB = uVar > 0.5;
  mjGain = 0.4 + 1.3 * uEnergy;
  mjTop = 1.93; mjC = mjB ? 1.1 : 0.95;
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[5] < 0.0) {
    mjF.xy = uOwn[0] > 0.0 ? mix(vec2(1.0), vec2(1.36, 0.74), uOwn[0]) : mix(vec2(1.0), vec2(0.62, 1.2), -uOwn[0]);
    mjF.z = min(mjF.x, mjF.y) * (1.0 - 0.45 * max(-uOwn[1], 0.0) - 0.62 * max(uOwn[1], 0.0)) * (1.0 + 0.3 * min(uOwn[5], 0.0)) * 0.97;
  }
  float az = 0.05 * sin(TAU * uLoop), el = 0.18 + 0.025 * cos(TAU * uLoop);
  mjL = normalize(vec3(-0.82, el, (mjB ? -0.5 : -0.58) - az));
  mjJ = normalize(vec3(-0.86, el + 0.12, -0.25 - az));
  mjS = mix(vec3(1.22, 1.05, 0.84), vec3(1.12, 1.08, 1.0), mjB ? 0.8 : uTone * 0.8) * (0.95 + 0.25 * uLevel + 0.25 * uCue) * (1.0 + 0.04 * sin(uTime * 0.17));
  if (uOwn[6] > 0.0) mjS *= mix(vec3(1.0), vec3(1.0, 0.58, 0.27), uOwn[6]);
  if (uOwn[7] < 0.0 && uOwn[6] <= 0.0) mjS *= mix(vec3(1.0), uKind[4] * 0.35 + 0.75, -uOwn[7]);
  float asp = uRes.x / uRes.y, D = 9.0;
  float zoom = min((mjB ? 1.4 : 0.98) * mix(1.06, 0.94, uSpace), asp * 1.6), foc = 2.15 * zoom;
  float sway = 0.25 * sin(uTime * 0.043);
  vec3 ro = vec3(sway, 2.8 - 1.55 * max(-uOwn[7], 0.0), -D);
  vec2 at = vec2((mjB ? -0.14 : 0.19) * smoothstep(0.6, 1.6, asp) + sway * foc / D, (mjB ? -0.385 : -0.335) + ro.y * foc / D);
  vec3 rd = normalize(vec3(p - at, foc));
  mjPx = D / (foc * uRes.y);

  // march to the jar inside a ball round it
  vec3 oc = ro - vec3(0.0, 1.0, 0.0);
  float b = dot(oc, rd), disc = b * b - dot(oc, oc) + 1.35;
  float cover = 0.0, best = 1.0, tb = 0.0;
  bool more = mjF.z < 1.0 || uOwn[2] != 0.0;
  float tFlat = -ro.z / rd.z, tall = mjTop * mjF.x * 1.08 + 0.1, zR = 1.1 * mjF.y * (1.0 + 0.16 * max(-uOwn[1], 0.0)) + 0.1 + 0.15 * max(uOwn[2], 0.0);
  if (more) { float at0 = (-zR - ro.z) / rd.z, at1 = (zR - ro.z) / rd.z; disc = min(ro.y + rd.y * at0, ro.y + rd.y * at1) < tall ? 1.0 : 0.0; if (uOwn[2] == 0.0 && abs(ro.x + rd.x * tFlat) > 1.3 * mjF.y + 0.35) disc = 0.0; }
  if (disc > 0.0) {
    float t = -b - sqrt(disc), tEnd = -b + sqrt(disc);
    if (more) { t = (-zR - ro.z) / rd.z; tEnd = (zR - ro.z) / rd.z; if (rd.y < 0.0) t = max(t, (tall - ro.y) / rd.y); }
    if (rd.y < 0.0) tEnd = min(tEnd, -ro.y / rd.y); // not under the shelf
    for (int i = 0; i < 56; i++) {
      if (t > tEnd || (i > 35 && !more)) break;
      float d = mjJar(ro + rd * t);
      if (d < best) { best = d; tb = t; }
      if (d < 0.0005) break;
      t += max(d * 0.92, more ? 0.004 : 0.002);
    }
    cover = (1.0 - smoothstep(0.1, 1.1, best / mjPx));
    if (best < 0.002) tb += mjJar(ro + rd * tb);
    cover *= smoothstep(0.0, 1.5 * mjPx, ro.y + rd.y * tb);
  }
  vec2 st = vec2(0.0);
  for (int k = 0; k < (uOwn[3] != 0.0 ? 2 : 0); k++) {
    float tz = -1.2 / mjL.z;
    vec2 at2 = k < 1 ? (ro + rd * ((1.2 - ro.z) / rd.z)).xy + mjL.xy * tz : ro.xy + rd.xy * tFlat;
    st = mjSt(at2, k < 1 ? 0.03 + 0.02 * tz : mjPx * 1.2);
    if (k < 1) mjTw = 1.0 - 0.8 * st.x;
  }
  vec3 c = vec3(0.0);
  if (cover < 1.0) c = mjRoom(ro, rd);
  if (cover > 0.0) c = mix(c, mjSkin(ro + rd * tb, rd), cover);
  IF_(uOwn[3] != 0.0 && (cover < 0.5 || tb > tFlat)) {
    vec3 q = ro + rd * tFlat;
    if (st.x > 0.0) {
      vec3 hue, stem = uKind[2] * uKind[2] * 0.4 + 0.015, ear = uKind[3] * uKind[3] * 0.95 + 0.06;
      float in_ = mjPatch(q, hue);
      vec3 lit = mjS * hue * in_ * 0.8 + vec3(0.33, 0.35, 0.38) * (1.0 - 0.85 * mjDark()) * (1.0 + 0.5 * max(-uOwn[6], 0.0));
      c = mix(c, mix(stem, uOwn[3] > 0.0 ? mix(stem, ear, 0.75) : mix(uKind[4] * 0.5, ear, smoothstep(0.45, 0.8, st.y)), st.y) * lit, st.x * step(-0.02, q.y));
    }
  }
  c = 1.0 - exp(-1.45 * max(c, 0.0));
  return pow(c, vec3(0.4545));
}
