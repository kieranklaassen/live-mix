// name: One jar
// a: On the sill
// b: Night side
// what: A big round white porcelain jar in the Korean way, a little lopsided, stands on a pale wooden shelf in morning light; the window lies slanting on the plaster and the jar throws one long soft shadow across it. Or, closer, a jar in the Chinese oil-spot glaze, iron black flecked with silver, the window bent small in its shoulder.
// follows: The drone deepens the shadows, the pad warms the glaze, texture lifts crackle or silver, the phrase sends a light round the shoulder, the bands are throwing rings. The piece tints the window's light, and the loop swings the sun. A hit is a ring of light sinking from lip to foot; a cue opens the window wider; keys glow from the mouth, a voice fills the room.
bool mjB;              // the black jar
vec3 mjL, mjS;         // towards the sun, and its colour
const vec3 mjW = normalize(vec3(-0.9, 0.36, -0.36)); // towards the window's sky
vec3 mjJ;              // the sun as the jar is lit by it, a little more from the side
float mjTop, mjC, mjGain;   // height of the lip, middle of the belly, how strongly things answer
float mjPx;            // a pixel's width at the jar

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
// The thrown jar sags: its upper half leans off the lower, and it is not quite round.
vec3 mjSag(vec3 q) {
  float h = q.y - mjC;
  q.x -= 0.06 * smoothstep(-0.5, 0.9, h) - 0.03;
  q.x *= 1.0 + 0.035 * (1.0 - smoothstep(-0.6, 0.1, h)) * (1.0 - smoothstep(-0.6, 0.6, q.x));
  q.y += 0.03 * q.x * smoothstep(-0.4, 0.8, h);
  return q;
}
float mjJar(vec3 q, float hollow) { q = mjSag(q); return mjCut(vec2(length(q.xz), q.y), hollow); }
float mjJar(vec3 q) { return mjJar(q, 1.0); }

// How much of a light of some width the jar lets by.
float mjY; // how high up the jar the last shadow asked for was thrown from
float mjShade(vec3 q, vec3 l, float wide, float shake) {
  vec3 o = q - vec3(0.0, 1.0, 0.0);
  float t = -dot(o, l), u = -dot(q.xz, l.xz) / dot(l.xz, l.xz);
  float y = q.y + l.y * u;
  float far = max(max(t, u), 0.0);
  mjY = y;
  float d = smin(mjJar(q + l * t, 0.0), mjJar(q + l * u, 0.0), 0.12) + 0.02 + shake * sin(y * 8.0 + uHits * 20.0);
  float w = wide * far + 0.015;
  return mix(1.0, smoothstep(-w, w, d), smoothstep(-0.3, 0.25, max(t, u)));
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
  return e.x * e.y * (mjB ? 1.0 : bars) * (1.0 + 0.1 * fold);
}
float mjRing() { return mix(0.0, mjTop - 0.04, uHits); } // how far a struck ring has sunk
vec3 mjLit(vec3 q, vec3 n) {
  vec3 hue;
  float shake = 0.06 * 4.0 * uHits * (1.0 - uHits);
  float lit = mjShade(q, mjL, mix(mjB ? 0.16 : 0.11, 0.04, uTone), shake);
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
  // what the struck lip or the keys in the mouth throw on the wall
  vec3 o = vec3(0.0, mix(1.2, mjTop, uHits), 0.0) - q, o2 = vec3(0.0, mjTop + 0.15, 0.0) - q;
  room += (uKind[4] * 0.6 + 0.4) * vec3(1.0, 0.9, 0.75) * 0.5 * uHits * mjGain * sat(dot(n, o) / length(o)) / (0.5 + dot(o, o))
        + (uKind[3] * 0.4 + 0.6) * vec3(1.0, 0.82, 0.6) * 0.6 * uKeys * mjGain * sat(dot(n, o2) / length(o2)) / (0.4 + dot(o2, o2));
  return mjS * hue * sun + vec3(0.38, 0.385, 0.39) * sky * (0.7 + 0.5 * near) + room * ao;
}
vec3 mjWall(vec3 q) {
  float big = noise(q.xy * 0.9 + 3.0), mid = noise(q.xy * vec2(2.3, 3.1) + 9.0 * big);
  vec2 tq = rot(0.5) * q.xy * vec2(2.6, 7.0);
  float rake = noise(tq) - noise(tq + vec2(0.16, 0.3)) + 0.35 * (noise(q.xy * 24.0) - 0.5);
  vec3 alb = mix(vec3(0.8, 0.735, 0.635), vec3(0.87, 0.86, 0.83), float(mjB));
  alb *= 0.95 + 0.07 * big + 0.05 * mid;
  vec3 c = alb * mjLit(q, normalize(vec3(rake * (mjB ? 0.05 : 0.08), 0.0, -1.0)));
  return c * (1.0 - 0.45 * exp(-q.y * 9.0)) * (1.0 - 0.16 * smoothstep(2.0, 4.5, q.y));
}
vec3 mjWood(vec2 q) {
  float w = noise(q * vec2(0.5, 1.6) + 4.0);
  float ring = noise(vec2(q.x * 0.35 + 2.0, q.y * 8.0 + 5.0 * w)), fib = noise(vec2(q.x * 2.2, q.y * 26.0));
  return mix(vec3(0.72, 0.58, 0.43), vec3(0.95, 0.83, 0.68), sat(0.25 + 0.55 * ring + 0.35 * fib)) * (0.92 + 0.14 * w);
}
// Everything but the jar.
vec3 mjRoom(vec3 ro, vec3 rd) {
  const float zE = -1.2, zW = 1.2, deep = 0.34;
  float tE = (zE - ro.z) / rd.z, tW = (zW - ro.z) / rd.z;
  vec3 e = ro + rd * tE;
  if (rd.z > 0.0 && ro.z < zE && e.y < 0.0) {
    if (e.y < -deep) return vec3(0.12, 0.11, 0.105) * (0.5 + 0.5 * exp((e.y + deep) * 1.2));
    vec3 hue;
    float s = mjPatch(vec3(e.x, 0.0, zE), hue);
    vec3 c = mjWood(vec2(e.x, e.y * 0.8 + 7.0)) * (mjS * hue * s * 0.36 + vec3(0.26, 0.28, 0.31)) * (0.55 + 0.35 * exp(e.y * 5.0));
    return c * (1.0 + 0.5 * mjBell(e.y / 0.016));
  }
  float tF = -ro.y / min(rd.y, -1e-4);
  if (rd.y < 0.0 && (rd.z <= 0.0 || tF < tW)) {
    vec3 q = ro + rd * tF;
    return mjWood(q.xz) * mjLit(q, vec3(0.0, 1.0, 0.0)) * (1.0 - 0.4 * exp((q.z - zW) * 7.0));
  }
  return mjWall(ro + rd * tW);
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
  return c + step(r.x, -0.01) * in2.x * in2.y * bars * vec3(5.0, 5.2, 5.5) * (0.8 + 0.4 * uLevel + 0.5 * uCue);
}
// Distance to the nearest crack of a craze.
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
  vec3 light = mjS * 1.05 * sun * mix(1.0, sat(0.2 + 1.2 * g.x), ins) + vec3(0.36, 0.4, 0.46) * sky * ao + (room + back + up) * ao;
  float rake = mjBell((nl - 0.3) / 0.34);
  float ring = uHits * mjBell((y - mjRing()) / (mjB ? 0.08 : 0.12));
  float ph = 0.35 + 0.8 * sin(uTravel * 0.21 + uTime * 0.05);
  float run = mjBell((y - (mjB ? 1.55 : 1.56) - 0.03 * sin(th * 2.0)) / 0.06) * mjBell((th - ph) / 0.6) * uPhrase * mjGain;
  vec3 white = vec3(1.0, 0.97, 0.92);
  vec3 c;
  float fres = 0.045 + 0.75 * pow(1.0 - face, 5.0);
  vec3 rr = reflect(rd, normalize(mix(n0, n, 0.25)));
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
    c += min(fres, 0.2) * mjMirror(q, rr, 1.6) * 0.5 * (1.0 - ins);
    c += run * mix(white, uKind[3], 0.4) * 0.8;
    c = mix(c, mix(white, uKind[4], 0.4) * 1.15, 0.75 * ring);
  } else {
    // iron black, thin and rusty at the lip, stopped in a wavering roll above the bare clay of the foot
    float edge = y - 0.27 - 0.035 * sin(th * 2.0 + 0.6) - 0.02 * sin(th * 5.0);
    float clay = (1.0 - smoothstep(-0.012, 0.012, edge)), lip = smoothstep(mjTop - 0.075, mjTop - 0.01, y);
    vec3 alb = mix(vec3(0.012, 0.0105, 0.011), vec3(0.16, 0.07, 0.03), lip * 0.8) + (uKind[1] * 0.5 + 0.5) * vec3(0.13, 0.042, 0.016) * uPad * mjGain * (0.12 + smoothstep(0.8, 1.75, y) * smoothstep(0.3, 0.7, noise(g * vec3(13.0, 1.6, 13.0)))) * (1.0 - lip);
    rr = normalize(rr + vec3(0.0, 0.6 * mjBell(edge / 0.03) * edge / 0.03, 0.0));
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
    c += (fres * 1.35 + 0.015) * (1.0 - 0.45 * sp) * mix(0.3, 1.0, body) * mjMirror(q, rr, 0.12) * (1.0 - 0.8 * ins) * (0.5 + 0.5 * ao);
    c = mix(c, vec3(0.3, 0.2, 0.135) * light * (0.85 + 0.3 * noise(g * 9.0)), clay);
    c += run * mix(white, uKind[3], 0.45) * 0.4 + ring * mix(white, uKind[4], 0.4) * 0.3;
  }
  c += ins * uKeys * mjGain * mix(vec3(1.0, 0.8, 0.5), uKind[3], 0.3) * 0.35 * smoothstep(mjTop - 0.35, mjTop, y);
  return c;
}
vec3 render(vec2 p) {
  mjB = uVar > 0.5;
  mjGain = 0.4 + 1.3 * uEnergy;
  mjTop = 1.93; mjC = mjB ? 1.1 : 0.95;
  float az = 0.05 * sin(TAU * uLoop), el = 0.18 + 0.025 * cos(TAU * uLoop);
  mjL = normalize(vec3(-0.82, el, (mjB ? -0.5 : -0.58) - az));
  mjJ = normalize(vec3(-0.86, el + 0.12, -0.25 - az));
  mjS = mix(vec3(1.22, 1.05, 0.84), vec3(1.12, 1.08, 1.0), mjB ? 0.8 : uTone * 0.8) * (0.95 + 0.25 * uLevel + 0.25 * uCue) * (1.0 + 0.04 * sin(uTime * 0.17));
  float asp = uRes.x / uRes.y, D = 9.0;
  float zoom = min((mjB ? 1.4 : 0.98) * mix(1.06, 0.94, uSpace), asp * 1.6), foc = 2.15 * zoom;
  float sway = 0.25 * sin(uTime * 0.043);
  vec3 ro = vec3(sway, 2.8, -D);
  vec2 at = vec2((mjB ? -0.14 : 0.19) * smoothstep(0.6, 1.6, asp) + sway * foc / D, (mjB ? -0.385 : -0.335) + ro.y * foc / D);
  vec3 rd = normalize(vec3(p - at, foc));
  mjPx = D / (foc * uRes.y);

  // march to the jar inside a ball round it
  vec3 oc = ro - vec3(0.0, 1.0, 0.0);
  float b = dot(oc, rd), disc = b * b - dot(oc, oc) + 1.35;
  float cover = 0.0, best = 1.0, tb = 0.0;
  if (disc > 0.0) {
    float t = -b - sqrt(disc), tEnd = -b + sqrt(disc);
    if (rd.y < 0.0) tEnd = min(tEnd, -ro.y / rd.y); // not under the shelf
    for (int i = 0; i < 36; i++) {
      if (t > tEnd) break;
      float d = mjJar(ro + rd * t);
      if (d < best) { best = d; tb = t; }
      if (d < 0.0005) break;
      t += max(d * 0.92, 0.002);
    }
    cover = (1.0 - smoothstep(0.1, 1.1, best / mjPx));
    if (best < 0.002) tb += mjJar(ro + rd * tb);
    cover *= smoothstep(0.0, 1.5 * mjPx, ro.y + rd.y * tb);
  }
  vec3 c = vec3(0.0);
  if (cover < 1.0) c = mjRoom(ro, rd);
  if (cover > 0.0) c = mix(c, mjSkin(ro + rd * tb, rd), cover);
  c = 1.0 - exp(-1.45 * max(c, 0.0));
  return pow(c, vec3(0.4545));
}
