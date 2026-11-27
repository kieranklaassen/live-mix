// name: Turning rooms
// a: Grey rooms
// b: Open ceilings
// what: Grey rooms open one into the next, each turned a quarter on its side: a panelled door and a chair stand on this floor, then on what is our wall, then overhead, and a window lays its patch of light in each; or bare white rooms with arched openings and no ceiling, where sun falls past joists and pale sky looks in from four sides.
// follows: Each room is a later moment of the loop, its patch of light in strips coloured by what plays there. The drone warms the near room, pads widen the patches or bring clouds, texture is dust or leaf shade, a phrase opens the doors or thins the joists, bands light the panes; a hit lights a room ahead, a cue runs from near to far, keys touch the floor.
// own: 0 the opening: 1 a round one, -1 wide, a thin frame left; 1 how far each room is turned: 1 a twelfth round, -1 not at all; 2 1 shallow rooms, many of them, -1 long great halls; 3 1 a flight of steps stands where the chair was, -1 nothing stands there; 4 1 water stands on the floor, -1 sand or snow has drifted in; 5 the walls: 1 coursed blocks, -1 lit paper on a lattice; 6 the hour: 1 a low red sun, -1 night, with a lamp in some rooms; 7 1 each room painted in a sound's colour, -1 bleached white
float trW, trL, trD;  // half a room's width, its pitch, its depth inside the walls
vec3 trGlow, trAir; // a wall's own light; the colour of the air
const vec4 trDoor = vec4(0.1, 0.48, -1.0, 0.66);             // the doorway: middle, half width, foot, top
vec3 trSun, trS, trAmb, trPaint;   // this room's patch: colour and the way to its light; its shade; its paint
float trFar, trWide, trSoft, trPx; // how far this room is, how wide and how soft its patch, the size of a pixel here
vec4 trWin;                        // the window: middle (y, z) and half sizes
bool trChair;                      // a chair in this room
float trBeam;                      // half a joist
vec3 trDay, trMore; vec2 trBar;    // plain daylight, what a hit or a cue adds, and which bar of the loop this room carries

float trLine(float d, float w) { return (1.0 - smoothstep(w - trPx, w + trPx, abs(d))) * min(1.0, w / trPx); }
float trNear(float d) { d = 1.0 + 2.2 * max(d, 0.0); return 1.0 / (d * d * d); }  // how close to a corner
float trRect(vec2 q, vec2 b) { q = abs(q) - b; return max(q.x, q.y); }
// How far outside the doorway, on the wall.
float trHole(vec2 q) {
  vec2 o = q;
  q.x -= trDoor.x;
  float s = trDoor.w - trDoor.y + 0.1, d = uVar < 0.5 ? max(abs(q.x) - trDoor.y, q.y - trDoor.w) : q.y < s ? abs(q.x) - trDoor.y : length(vec2(q.x, q.y - s)) - trDoor.y;
  if (uOwn[0] > 0.0) return mix(d, length(o - vec2(0.1 - 0.05 * uOwn[0], -0.02)) - 0.76, uOwn[0]);
  if (uOwn[0] < 0.0) return mix(d, uVar < 0.5 ? max(abs(o.x) - 0.9, o.y - 0.84) : max(abs(o.x) - 0.92, length(vec2(o.x * 0.55, max(o.y + 0.1, 0.0))) - 0.96), -uOwn[0]);
  return d;
}
// Where a ray goes into a box and where out of it.
vec2 trBox(vec3 ro, vec3 inv, vec3 c, vec3 b) {
  vec3 k = (c - ro) * inv, h = abs(inv) * b, t1 = k - h, t2 = k + h;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}
// From light to the screen, with a little more weight in the darks.
vec3 trTone(vec3 c, bool sky) { c = screenOf(c); return mix(c, c * c * (3.0 - 2.0 * c), sky ? 0.35 : 0.45); }
// A plain chair: seat, two back posts, two front legs, two rails.
vec3 trChairMid, trHull, trHullBy; // where it stands, and the box round it
const vec3 trChairAt[7] = vec3[7](vec3(0.0, 0.0, 0.0), vec3(-0.165, 0.0, 0.17), vec3(0.165, 0.0, 0.17), vec3(-0.165, -0.15, -0.17), vec3(0.165, -0.15, -0.17), vec3(0.0, 0.27, 0.17), vec3(0.0, 0.14, 0.17));
const vec3 trChairBy[7] = vec3[7](vec3(0.185, 0.018, 0.19), vec3(0.018, 0.31, 0.018), vec3(0.018, 0.31, 0.018), vec3(0.018, 0.16, 0.018), vec3(0.018, 0.16, 0.018), vec3(0.15, 0.035, 0.012), vec3(0.15, 0.022, 0.012));
// One of its seven parts: where, and half how large.
void trPart(int k, out vec3 at, out vec3 by) {
  at = trChairAt[k]; by = trChairBy[k];
  if (uOwn[3] < 0.0) { float s = 1.0 + uOwn[3]; at = at * s - vec3(0.0, 0.31 * (1.0 - s), 0.0); by *= s; }
  if (uOwn[3] > 0.0) {
    float f = float(k);
    at = mix(at, vec3(0.02, -0.31 + 0.085 * (f + 1.0), -0.66 + 0.145 * f), uOwn[3]);
    by = mix(by, vec3(0.27, 0.085 * (f + 1.0), 0.074), uOwn[3]);
  }
}
// How much of the sun the chair lets by.
float trShade(vec3 q) {
  q += trS * 0.004;
  vec3 inv = 1.0 / trS; float l = 1.0;
  vec2 g = trBox(q, inv, trHull, trHullBy);
  vec3 at, by;
  if (g.y > max(g.x, 0.0)) for (int k = 0; k < 7; k++) { trPart(k, at, by); g = trBox(q, inv, trChairMid + at, by); l = min(l, (1.0 - smoothstep(0.0, 0.03, g.y - g.x))); }
  return l;
}
// The colour of the light that carries the sound at one depth y of the piece.
vec3 trLight(float y) {
  vec4 m = piece(vec2(trBar.x, y));
  vec3 hue = m.rgb / max(max(m.r, max(m.g, m.b)), 0.02);
  float loud = smoothstep(0.0, 0.6, m.a) * trBar.y;
  bool sky = uVar > 0.5;
  return (mix(trDay, 0.1 + 0.9 * hue * hue, (sky ? 0.5 : 0.62) * smoothstep(0.0, 0.5, loud)) * ((sky ? 2.1 : 1.5) + (sky ? 0.7 : 1.1) * uEnergy * loud) + trMore) * (sky ? 1.25 : 1.5);
}
// The light that comes straight from the window, or over the wall's top, to a place in the room.
vec3 trPatch(vec3 q, vec3 n) {
  float c = dot(n, trS);
  if (c <= 0.0) return vec3(0.0);
  if (uVar < 0.5) {
    float far = (q.x + trW) / -trS.x;
    vec2 w = (q + trS * far).yz - trWin.xy;
    float s = 0.012 + trSoft * far;
    vec2 b = trWin.zw * trWide;
    float in0 = (1.0 - smoothstep(-s, s, trRect(w, b)));
    if (in0 <= 0.0) return vec3(0.0);
    // the panes, four along and two up, each with its own band
    vec2 g = vec2(w.x / b.x * 2.0 + 2.0, w.y / b.y + 1.0), e = abs(fract(g - 0.5) - 0.5) * vec2(b.x * 0.5, b.y);
    vec2 bar = smoothstep(0.018 - s * 0.7, 0.018 + s * 0.9, e);
    vec2 id = clamp(floor(g), vec2(0.0), vec2(3.0, 1.0));
    float bd = band((id.x * 2.0 + id.y) / 7.0);
    return trLight(0.18 + 0.22 * id.x) * c * in0 * (0.2 + 0.8 * bar.x * bar.y) * (0.85 + 0.9 * bd);
  }
  float far = (1.0 - q.y) / trS.y;
  vec2 w = (q + trS * far).xz;
  float s = 0.01 + trSoft * far;
  float lit = smoothstep(-s, s, trW - abs(w.x)) * smoothstep(-s, s, trD * 0.5 - abs(w.y - trD * 0.5));
  if (lit <= 0.0) return vec3(0.0);
  // bare joists lie across the room
  float g = w.y / trD * 4.0, e = (0.5 - abs(fract(g) - 0.5)) * trD / 4.0;
  float bar = smoothstep(trBeam - s, trBeam + s, e);
  int id = int(clamp(g, 0.0, 3.9));
  // leaves somewhere above shade it
  if (uTexture > 0.01) { vec2 v = w * 5.0 + 0.15 * vec2(sin(uTime * 0.4), cos(uTime * 0.31)); lit *= 1.0 - 0.75 * uTexture * smoothstep(0.5, 0.72, 0.62 * noise(v) + 0.38 * noise(v * 2.3 + 5.0)); }
  return trLight(0.18 + 0.22 * float(id)) * c * lit * (0.08 + 0.92 * bar) * (0.85 + 0.9 * band(float(id) / 3.0));
}
// What a place in the room looks like: n its face, alb its paint.
vec3 trLit(vec3 q, vec3 n, vec3 alb, float ao) {
  vec3 l;
  vec3 e = vec3(trW - abs(q.x), min(q.y + 1.0, 1.0), q.z) + abs(n) * 9.0;
  ao *= (1.0 - 0.34 * trNear(e.x)) * (1.0 - 0.38 * trNear(e.y));
  float ez = min(abs(trD - q.z), abs(q.z)) + abs(n.z) * 9.0;
  ao *= 1.0 - 0.36 * trNear(ez);
  if (uVar < 0.5) {
    ao *= 1.0 - 0.3 * trNear(1.0 - q.y + abs(n.y) * 9.0);
    vec3 w = vec3(-trW - 0.1, trWin.x, trWin.y) - q;
    float d2 = dot(w, w), d = sqrt(d2);
    float ff = max(0.0, (dot(n, w) / d + 0.2) / 1.2) * sat((q.x + trW) / d + 0.06);
    l = trAmb * (0.055 + 2.0 * ff / (d2 + 0.25));
    l += trAmb * vec3(1.0, 0.86, 0.7) * 0.09 * sat(0.5 - 0.5 * n.y + 0.2 * -q.y);
    // what the patch throws back into the room
    vec3 b = vec3(0.75, -0.75, 1.7) - q;
    float b2 = dot(b, b);
    l += mix(vec3(dot(trSun, vec3(0.33))), trSun, 0.5) * 0.05 * max(0.0, dot(n, b) / sqrt(b2 + 0.01) + 0.4) / (b2 + 0.5);
  } else {
    float h = 1.0 - q.y;
    l = trAmb * (0.16 + (n.y > 0.5 ? 0.55 : 0.62 * (1.0 - h / sqrt(h * h + 1.7))));
    l += trSun * vec3(1.0, 0.88, 0.74) * 0.12 * sat(0.6 - 0.5 * n.x);
  }
  // keys knock on the floor of the near room
  if (n.y > 0.5) { vec2 k = q.xz - vec2(-0.35, 1.7); l += mix(vec3(1.0), uKind[3], 0.4) * uKeys * exp(-dot(k, k) * 6.0 - trFar * 0.4) * 2.5; }
  vec3 sun = trPatch(q, n);
  if (trChair && sun.x > 0.01) sun *= trShade(q);
  return alb * (l * ao + sun) + trGlow;
}
vec3 trFloorWas(vec3 q) {
  if (uVar < 0.5) {
    // wide boards, waxed long ago
    float x = q.x * 4.2 + 0.3, i = floor(x), f = abs(fract(x) - 0.5);
    float h = hash11(i + 3.0), grain = noise(vec2(q.x * 46.0, q.z * 2.4 + h * 31.0)) - 0.5;
    vec3 c = vec3(0.155, 0.127, 0.104) * (0.8 + 0.4 * h + 0.22 * grain);
    float joint = trLine(abs(q.z - 0.55 - 1.4 * h), 0.004);
    return c * (1.0 - 0.55 * max(smoothstep(0.5 - 0.016 - trPx * 4.0, 0.5, f), joint));
  }
  vec2 g = vec2(q.x, q.z) * 1.55 + 0.5, f = abs(fract(g) - 0.5);
  float h = hash21(floor(g));
  return vec3(0.36, 0.33, 0.29) * (0.9 + 0.2 * h) * (1.0 - 0.35 * smoothstep(0.5 - 0.012 - trPx * 2.0, 0.5, max(f.x, f.y)));
}
vec3 trFloor(vec3 q) {
  vec3 c = trFloorWas(q);
  if (uOwn[7] > 0.0) c = mix(c, trPaint * (dot(c, vec3(0.33)) / (uVar < 0.5 ? 0.2 : 0.5)), 0.8 * uOwn[7]);
  if (uOwn[7] < 0.0) c = mix(c, vec3(0.66, 0.645, 0.61) * (0.7 + 0.3 * smoothstep(0.02, uVar < 0.5 ? 0.12 : 0.32, c.x)), -uOwn[7]);
  return c;
}
// The walls: plaster above, a moulded dado and a skirting below; u runs along the wall.
vec3 trWallWas(vec3 q, float u, inout float ao) {
  vec3 c = trPaint;
  if (uVar > 0.5) { float m = noise(vec2(u, q.y) * vec2(2.2, 3.0) + trPaint.x * 50.0); return c * (0.94 + 0.12 * m) * mix(vec3(1.0), vec3(0.8, 0.76, 0.72), 0.5 * (1.0 - smoothstep(-1.0, -0.8, q.y + 0.1 * m))); }
  float y = q.y + 1.0;
  vec3 wood = mix(trPaint, vec3(0.66, 0.645, 0.61), 0.62);
  c = mix(c, wood, (1.0 - smoothstep(0.585 - trPx, 0.585 + trPx, y)));
  if (y < 0.63) {
    ao *= 1.0 - 0.3 * trLine(y - 0.575, 0.006) + 0.2 * trLine(y - 0.592, 0.007);
    ao *= 1.0 - 0.28 * trLine(y - 0.175, 0.005) + 0.15 * trLine(y - 0.186, 0.005);
    // long panels in the dado
    float pu = (fract(u / 0.9 + 0.5) - 0.5) * 0.9, pd = trRect(vec2(pu, y - 0.38), vec2(0.37, 0.125));
    ao *= 1.0 - 0.26 * trLine(pd, 0.006) + 0.12 * trLine(pd + 0.014, 0.006);
  }
  // the cornice
  float cy = 2.0 - y;
  if (cy < 0.2) ao *= 1.0 - 0.22 * trLine(cy - 0.11, 0.006) - 0.12 * trLine(cy - 0.05, 0.02);
  return c;
}
vec3 trWall(vec3 q, float u, inout float ao) {
  float was = ao;
  vec3 c = trWallWas(q, u, ao);
  if (uOwn[7] > 0.0) c = mix(c, trPaint, 0.8 * uOwn[7]);
  if (uOwn[5] > 0.0) {
    // courses of blocks, each with a face of its own
    float y = (q.y + 1.0) / 0.25, row = floor(y), x = u / 0.56 + 0.5 * mod(row, 2.0) + 0.2 * hash11(row), id = floor(x);
    vec2 f = abs(vec2(fract(x), fract(y)) - 0.5);
    float e = min((0.5 - f.x) * 0.56, (0.5 - f.y) * 0.25), h = hash21(vec2(id, row) + 7.0), m = noise(vec2(u, q.y) * 9.0) * 0.6 + noise(vec2(u, q.y) * 31.0) * 0.4;
    vec3 b = trPaint * (0.72 + 0.4 * h) * (0.75 + 0.5 * m) * (1.0 - 0.6 * (1.0 - smoothstep(0.0, 0.016 + trPx, e))) * (1.0 + 0.12 * smoothstep(0.04, 0.02, e));
    c = mix(c, b, uOwn[5]);
    ao = mix(ao, was, uOwn[5]);
  }
  if (uOwn[5] < 0.0) {
    // paper, with the light of the day or a lamp behind it
    float k = -uOwn[5];
    vec2 g = vec2(u / 0.34 + 0.5, (q.y + 1.0) / 0.4), f = (0.5 - abs(fract(g) - 0.5)) * vec2(0.34, 0.4);
    float post = 1.0 - smoothstep(0.035, 0.035 + trPx, (0.5 - abs(fract(u / 1.36 + 0.125) - 0.5)) * 1.36), l = max(1.0 - smoothstep(0.009, 0.009 + trPx, min(f.x, f.y)), post);
    float id = hash21(floor(g)), fib = noise(vec2(u, q.y) * vec2(60.0, 18.0)) * 0.5 + noise(vec2(u, q.y) * 7.0) * 0.5;
    vec3 tint = mix(trPaint / max(max(trPaint.x, trPaint.y), max(trPaint.z, 0.05)), vec3(1.0, 0.93, 0.8), 0.45 - 0.35 * max(uOwn[7], 0.0));
    c = mix(c, mix(vec3(0.7) * tint, vec3(0.06, 0.045, 0.035), l), k);
    trGlow = k * (1.0 - l) * tint * (0.2 + 0.2 * uLevel + 0.2 * band(id) * (0.4 + uEnergy)) * (0.8 + 0.4 * fib) * mix(dot(trDay + trMore * 0.25, vec3(0.33)), 0.8 + 0.12 * dot(trMore, vec3(1.0)), max(-uOwn[6], 0.0));
    ao = mix(ao, was, k);
  }
  return c;
}
// The sky over a room.
vec3 trSky(vec3 rd, float fr) {
  vec2 sv = rd.xz / max(rd.y, 0.02);
  float cl = noise(sv * 0.8 + vec2(uTime * 0.006, fr * 7.0)) * 0.6 + noise(sv * 2.1 + vec2(uTime * 0.011, fr)) * 0.3;
  vec3 c = mix(vec3(0.24, 0.45, 0.74), vec3(0.62, 0.75, 0.85), sat(1.1 - 1.2 * rd.y)) * (1.0 + 0.3 * uMic);
  vec3 cloud = mix(vec3(1.2, 1.16, 1.12), trSun, 0.25);
  if (uOwn[6] > 0.0) { c = mix(c, mix(vec3(0.42, 0.40, 0.56), vec3(1.15, 0.66, 0.42), sat(1.2 - 1.3 * rd.y)), uOwn[6]); cloud = mix(cloud, vec3(1.3, 0.72, 0.5), uOwn[6]); }
  if (uOwn[6] < 0.0) {
    vec2 g = sv * 9.0, h = hash22(floor(g)), o = fract(g) - 0.3 - 0.4 * h;
    vec3 n = mix(vec3(0.012, 0.022, 0.06), vec3(0.06, 0.09, 0.17), sat(1.1 - 1.2 * rd.y)) + vec3(0.8, 0.85, 1.0) * step(0.55, h.x) * exp(-dot(o, o) * 700.0) * (0.7 + 0.3 * sin(uTime * 0.4 + h.y * 40.0));
    c = mix(c, n, -uOwn[6]); cloud = mix(cloud, vec3(0.10, 0.12, 0.18), -uOwn[6]);
  }
  return mix(c, cloud, smoothstep(0.5 - 0.2 * uPad, 0.8, cl) * 0.75);
}
// Water on the floor at q: what it gives back of the room.
vec3 trWater(vec3 q, vec3 rd, vec3 floorCol, float far, float fr) {
  vec2 w = q.xz * 2.2;
  vec2 rip = vec2(noise(w * 2.0 + vec2(0.25 * uTime, 3.0)) - 0.5, noise(w * 1.3 + vec2(7.0, -0.2 * uTime)) - 0.5) * (0.05 + 0.05 * uLow) / (1.0 + 0.4 * far);
  vec3 r = normalize(vec3(rd.x + 0.25 * rip.x, abs(rd.y) + 0.004, rd.z + rip.y));
  r += vec3(equal(r, vec3(0.0))) * 1e-5;
  vec3 back;
  float tx = ((r.x > 0.0 ? trW : -trW) - q.x) / r.x, ty = (1.0 - q.y) / r.y, tz = r.z > 0.0 ? (trD - q.z) / r.z : 1e3, t = min(tx, min(ty, tz));
  vec3 e = q + r * t;
  float ao = 1.0, px = trPx;
  trPx *= 1.6;
  if (t == tx) { vec3 a = trWall(e, e.z, ao); back = trLit(e, vec3(-sign(r.x), 0.0, 0.0), a, ao); }
  else if (t == tz) {
    float d = trHole(e.xy);
    vec3 a = trWall(e, e.x, ao);
    back = mix(trAir * 0.7, trLit(e, vec3(0.0, 0.0, -1.0), a, ao), smoothstep(-0.02, 0.02, d));
  }
  else back = uVar > 0.5 ? trSky(r, fr) : trLit(e, vec3(0.0, -1.0, 0.0), vec3(0.6, 0.6, 0.585), 1.0);
  trGlow = vec3(0.0); trPx = px;
  float f = 1.0 - sat(abs(rd.y)); f = 0.16 + 0.84 * f * f * f;
  vec3 deep = floorCol * mix(vec3(0.42, 0.52, 0.5), uKind[0], 0.35 + 0.4 * max(uOwn[7], 0.0)) * 0.8;
  return mix(deep, back, f) + vec3(0.25) * uKeys * exp(-abs(length(q.xz - vec2(-0.35, 1.7)) - 0.9 * (1.0 - uKeys)) * 18.0);
}
// A door's own face: six panels; q runs from 0 to its width and from its foot up.
vec3 trLeaf(vec2 q, float w, inout float ao) {
  float H = trDoor.w - trDoor.z;
  vec2 g = vec2(abs(q.x - w * 0.5) - w * 0.235, q.y);
  float d = min(trRect(g - vec2(0.0, 0.3), vec2(w * 0.155, 0.19)), min(trRect(g - vec2(0.0, 0.93), vec2(w * 0.155, 0.36)), trRect(g - vec2(0.0, H - 0.18), vec2(w * 0.155, 0.1))));
  ao *= 1.0 - 0.36 * trLine(d, 0.008) + 0.16 * trLine(d + 0.02, 0.008) - 0.06 * step(d, 0.0);
  float knob = length(q - vec2(w - 0.06, 0.66));
  return mix(vec3(0.58, 0.57, 0.545), vec3(0.12, 0.09, 0.05), (1.0 - smoothstep(0.022 - trPx, 0.022 + trPx, knob)));
}
vec3 render(vec2 p) {
  float shape = min(1.0, uRes.x / uRes.y / 1.5);
  trW = 1.35; trD = 2.38; trGlow = vec3(0.0);
  if (uOwn[2] != 0.0) { trW = mix(trW, uOwn[2] > 0.0 ? 1.12 : 1.9, abs(uOwn[2])); trD = mix(trD, uOwn[2] > 0.0 ? 0.8 : 5.4, abs(uOwn[2])); }
  trL = trD + 0.17;
  trChairMid = vec3(min(0.86, trW - 0.26), -0.69, trD - 0.26);
  trHull = trChairMid + vec3(0.02, 0.285, -0.225) * max(uOwn[3], 0.0);
  trHullBy = mix(vec3(0.2, 0.32, 0.21), vec3(0.28, 0.605, 0.52), max(uOwn[3], 0.0));
  // the walk: four rooms and it begins again; it lingers in a room and goes a little quicker through a door
  // a room is turned by this; when it is not a quarter the walk is one of very many rooms
  float around = uOwn[1] == 0.0 ? 4.0 : 4096.0, by1 = 0.5 * PI * (1.0 - (uOwn[1] > 0.0 ? 0.6667 * uOwn[1] : -uOwn[1]));
  float w = mod(uTravel * 0.045 + 3.72, around);
  float z = w - 0.105 * (sin(TAU * (w - 0.1)) + 0.588);
  z = mod(z, around);
  float cell = floor(z), fz = z - cell;
  vec2 shift = vec2(0.13 * shape + 0.02 * sin(uTime * 0.051), (uVar < 0.5 ? 0.02 : -0.1) + 0.012 * sin(uTime * 0.037));
  float lens = mix(0.6, uVar < 0.5 ? 0.84 : 0.76, shape);
  vec3 rd = vec3(p - shift, lens);
  float far = length(rd), sharp = far / (uRes.y * lens);
  rd /= far;
  vec3 ro = vec3(vec2(-0.14, -0.12) * rot((uVar < 0.5 ? -1.0 : 1.0) * (uOwn[1] == 0.0 ? 0.5 * PI * z : mod(by1 * z, TAU))), fz * trL);
  // the room we stand in, seen in its own upright
  int turn = int(cell);
  float way = uVar < 0.5 ? -1.0 : 1.0;
  mat2 turned = mat2(1.0);
  if (uOwn[1] != 0.0) { mat2 m = rot(-way * mod(by1 * cell, TAU)); ro.xy = m * ro.xy; rd.xy = m * rd.xy; turned = rot(-way * by1); turn = int(mod(cell, 4.0)); }
  else for (int k = 0; k < turn; k++) { ro.xy = way * vec2(-ro.y, ro.x); rd.xy = way * vec2(-rd.y, rd.x); }
  rd += vec3(equal(rd, vec3(0.0))) * 1e-5;
  vec3 col = vec3(0.0);
  float rem = 1.0;
  bool sky = uVar > 0.5;
  vec2 swing = vec2(cos(2.5 + 0.35 * uPhrase), -sin(2.5 + 0.35 * uPhrase));   // how the doors stand open
  vec3 air = sky ? vec3(0.62, 0.70, 0.78) : vec3(0.52, 0.53, 0.54);
  if (uOwn[6] > 0.0) air = mix(air, vec3(0.74, 0.50, 0.42), uOwn[6]);
  if (uOwn[6] < 0.0) air = mix(air, vec3(0.05, 0.075, 0.14), -uOwn[6]);
  if (uOwn[7] > 0.0) air = mix(air, mix(uKind[1], vec3(0.8), 0.3) * (uOwn[6] < 0.0 ? 1.0 + 0.75 * uOwn[6] : 1.0), 0.6 * uOwn[7]);
  trAir = air;
  int rooms = uOwn[2] > 0.0 ? 7 - int(1.5 * uOwn[2] + 0.2) : 7;
  for (int i = 0; i < 7; i++) {
    if (i >= rooms) break;
    int r = (turn + i) & 3;
    float fr = float(r);
    trFar = max(float(i) + 0.5 - fz, 0.0);
    // the sound this room carries: a later bar of the loop the farther it is
    float u = fract(uLoop + 0.07 * trFar), seam = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.9, 1.0, u));
    float cd = trFar - (1.0 - uCue) * 6.0, hd = (trFar - 1.7) * 1.5;
    float cue = uCue / (1.0 + cd * cd * cd * cd);
    float hit = uHits / (1.0 + hd * hd * hd * hd * 2.0);
    vec3 day = sky ? vec3(1.0, 0.90, 0.76) : vec3(1.0, 0.95, 0.87);
    if (uOwn[6] > 0.0) day = mix(day, vec3(1.35, 0.66, 0.34), uOwn[6]);
    if (uOwn[6] < 0.0) day = mix(day, vec3(0.16, 0.23, 0.38), -uOwn[6]);
    trDay = day; trMore = mix(day, uKind[4], 0.5) * hit * 3.4 + (uOwn[6] < 0.0 ? max(day, vec3(0.5, 0.36, 0.2)) : day) * cue * 1.6; trBar = vec2(u, seam);
    trSun = trLight(0.8);
    float both = sky ? 0.0 : 0.5 * sat(3.0 - trFar);
    if (both > 0.0) trSun = mix(trSun, trLight(0.4), both);
    trAmb = (sky ? vec3(0.62, 0.74, 0.9) : vec3(0.82, 0.88, 0.93)) * (0.95 + 0.22 * sin(fr * 1.9 + 0.8)) + mix(day, uKind[4], 0.3) * hit * 0.8;
    trAmb *= mix(vec3(1.0), vec3(1.2, 1.0, 0.76) * (0.8 + 0.4 * uKind[0]), 0.8 * uDrone * exp(-trFar * 0.7));
    trPaint = sky ? vec3(0.60, 0.57, 0.53) : (r == 0 ? vec3(0.31, 0.318, 0.315) : r == 1 ? vec3(0.40, 0.39, 0.36) : r == 2 ? vec3(0.27, 0.295, 0.31) : vec3(0.42, 0.42, 0.40));
    if (uOwn[6] > 0.0) trAmb *= mix(vec3(1.0), vec3(0.74, 0.60, 0.68), uOwn[6]);
    if (uOwn[6] < 0.0) trAmb = mix(trAmb, trAmb * vec3(0.09, 0.13, 0.22) + vec3(0.95, 0.56, 0.24) * (r == 1 ? 0.5 + 0.5 * uDrone : r == 3 ? 0.16 : 0.0) + mix(vec3(0.5, 0.4, 0.3), uKind[4], 0.3) * hit * 0.5, -uOwn[6]);
    if (uOwn[7] > 0.0) { vec3 k = r == 0 ? uKind[1] : r == 1 ? uKind[0] : r == 2 ? uKind[3] : uKind[2]; trPaint = mix(trPaint, k * k * (sky ? 0.95 : 0.8) + 0.05 * k, uOwn[7]); }
    if (uOwn[7] < 0.0) trPaint = mix(trPaint, vec3(0.80, 0.79, 0.765), -uOwn[7]);
    float slow = sin(uTime * 0.031 + fr * 1.7);
    trS = sky ? normalize(vec3(-0.62 + 0.12 * slow, 0.8, -0.35 - 0.1 * slow)) : normalize(vec3(-1.0, (r == 0 ? 0.17 : 0.42) + 0.05 * slow, (r == 0 ? -0.6 : r == 1 ? -0.36 : r == 2 ? -0.5 : -0.26) + 0.05 * slow));
    trWin = vec4(0.2, 1.15, 0.5, 0.36);
    if (uOwn[2] != 0.0) { trWin.y = 0.48 * trD; trWin.w = min(0.36 * trD / 2.38, 0.8); }
    if (uOwn[6] > 0.0) trS = normalize(mix(trS, vec3(-1.0, 0.1 + 0.03 * slow, trS.z * 0.7), uOwn[6] * (sky ? 0.45 : 0.75)));
    trWide = 1.0 + 0.22 * uPad;
    trChair = r < 3 && i < 4 && uOwn[3] > -0.97;
    trBeam = 0.055 - 0.02 * uPhrase;
    trSoft = mix(0.07, 0.006, uTone);
    vec3 inv = 1.0 / rd;
    float tx = ((rd.x > 0.0 ? trW : -trW) - ro.x) * inv.x, ty = ((rd.y > 0.0 ? 1.0 : -1.0) - ro.y) * inv.y;
    float tz = (trD - ro.z) * inv.z;
    float tw = min(tx, ty);
    float in0 = max(0.0, -ro.z * inv.z), td = 1e4, bank = 0.0;
    if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0) tw = max(tw, in0);
    if (uOwn[4] < 0.0) {
      // what has drifted in lies higher toward one wall
      bank = 0.36 / trW * -uOwn[4];
      float h0 = ro.y + 1.0 - bank * (trW + ro.x), dh = rd.y - bank * rd.x;
      if (h0 + dh * in0 < 0.0) td = in0; else if (dh < -1e-4) {
        vec2 f = (ro + rd * min(-h0 / dh, 20.0)).xz;
        float hump = 0.24 * noise(f * vec2(1.3, 1.1) + fr * 5.0) * smoothstep(-trW, 0.2, f.x) * -uOwn[4] * sat(-dh * 3.0) / (1.0 + 2.0 * trFar * trFar);
        td = max((hump - h0) / dh, in0);
      }
      tw = min(tw, td);
    }
    float t = min(tw, tz);
    float fog = 1.0 - exp(-max(t - 1.0, 0.0) * (0.01 + 0.035 * uSpace));
    if (tz > 0.0) {
      // light standing in the air of the room
      if (!sky && uOwn[2] < 0.65) {
        vec2 o = ro.yz + trS.yz * ((ro.x + trW) / -trS.x) - trWin.xy, dv = rd.yz + trS.yz * (rd.x / -trS.x);
        dv += vec2(equal(dv, vec2(0.0))) * 1e-4;
        vec2 iv = 1.0 / dv, h = abs(iv) * trWin.zw * trWide, t1 = -o * iv - h, t2 = -o * iv + h;
        float a = max(max(t1.x, t1.y), max(0.0, -ro.z * inv.z)), b = min(min(t2.x, t2.y), t);
        col += rem * trSun * max(b - a, 0.0) * (0.006 + 0.010 * uTexture) * (uOwn[2] > 0.0 ? 1.0 - smoothstep(0.2, 0.65, uOwn[2]) : 1.0);
      }
      // dust, where the sun stands in the room
      if (!sky && i == 0 && uTexture > 0.01) {
        float td = (1.9 - ro.z) * inv.z;
        if (td > 0.3 && td < t) {
          vec3 q = ro + rd * td; vec2 g = q.xy * 17.0 + vec2(0.5 * sin(uTime * 0.05), 0.6 * cos(uTime * 0.04 + fr));
          vec2 h = hash22(floor(g)), c = fract(g) - 0.25 - 0.5 * h - 0.12 * sin(uTime * 0.3 + h * 40.0);
          float px = sharp * td * 17.0, rr = 0.010 + 0.022 * h.x * h.x, spot = (1.0 - smoothstep(rr - px, rr + px, length(c))) * step(0.3, h.y) * min(1.0, rr / px);
          if (spot > 0.0) col += rem * spot * trPatch(q, trS) * 0.3 * uTexture * smoothstep(0.3, 0.8, td) * smoothstep(0.0, 0.1, fz);
        }
      }
      // one chair, by the wall
      if (trChair) {
        vec2 g = trBox(ro, inv, trHull, trHullBy);
        vec3 pa, pb;
        if (g.y > g.x && g.x > 0.0 && g.x < t) {
          float best = t, cov = 0.0; int at = -1;
          for (int k = 0; k < 7; k++) {
            trPart(k, pa, pb);
            g = trBox(ro, inv, trChairMid + pa, pb);
            if (g.y > g.x && g.x > 0.0 && g.x < t) { cov = max(cov, smoothstep(0.0, sharp * g.x * 2.0, g.y - g.x)); if (g.x < best) { best = g.x; at = k; } }
          }
          if (at >= 0) {
            trPart(at, pa, pb);
            vec3 e = (ro + rd * best - trChairMid - pa) / pb, ae = abs(e);
            vec3 n = sign(e) * (ae.x > max(ae.y, ae.z) ? vec3(1.0, 0.0, 0.0) : ae.y > ae.z ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0));
            col += rem * cov * trLit(ro + rd * best, n, mix(sky ? vec3(0.13, 0.10, 0.08) : vec3(0.075, 0.058, 0.046), trPaint * (0.9 + 0.1 * n.y), max(uOwn[3], 0.0)), 1.0); rem *= 1.0 - cov;
          }
        }
      }
      // the open door of this room
      if (!sky && abs(uOwn[0]) < 0.95) {
        vec2 hin = vec2(trDoor.x - trDoor.y, trD), nl = vec2(swing.y, -swing.x);
        float dn = dot(rd.xz, nl), tl = dot(hin - ro.xz, nl) / (abs(dn) < 1e-4 ? 1e-4 : dn);
        if (tl > 0.0 && tl < t) {
          vec3 q = ro + rd * tl; trPx = sharp * tl;
          vec2 lq = vec2(dot(q.xz - hin, swing), q.y + 1.0);
          float wd = trDoor.y * 1.96 * (1.0 - abs(uOwn[0])), cut = trRect(lq - vec2(wd * 0.5, 0.825), vec2(wd * 0.5, 0.81)), cov = (1.0 - smoothstep(-trPx, trPx, cut));
          if (cov > 0.0 && abs(uOwn[0]) < 0.95) {
            float ao = 1.0; vec3 alb = trLeaf(lq, wd, ao);
            if (uOwn[7] != 0.0) alb = mix(alb, trPaint * (uOwn[7] > 0.0 ? 0.8 : 1.0), abs(uOwn[7]));
            vec3 c = trLit(q, vec3(nl.x, 0.0, nl.y) * -sign(dn), alb, ao);
            col += rem * cov * mix(c, air, fog); rem *= 1.0 - cov;
          }
        }
      }
      if (rem < 0.01) break;
    }
    if (tz > 0.0 && tw < tz) {
      // a wall, the floor, the ceiling, or the sky
      bool side = tx < ty, sand = td <= tw;
      vec3 q = ro + rd * t, n = sand ? normalize(vec3(-bank, 1.0, 0.0)) : side ? vec3(-sign(rd.x), 0.0, 0.0) : vec3(0.0, -sign(rd.y), 0.0);
      trPx = sharp * t / max(abs(dot(rd, n)), 0.15);
      float ao = 1.0; vec3 c;
      if (sand) {
        float rip = sin(q.x * 20.0 + 5.0 * noise(q.xz * 1.7) + q.z * 34.0 + 2.5 * noise(q.xz * 4.0)), near = exp(-trPx * 60.0), up = bank * (trW + q.x);
        vec3 a = mix(uOwn[7] < 0.0 ? mix(vec3(0.60, 0.47, 0.34), vec3(0.86, 0.87, 0.89), -uOwn[7]) : vec3(0.60, 0.47, 0.34), uKind[2], 0.3 + 0.4 * max(uOwn[7], 0.0)) * (0.92 + 0.16 * noise(q.xz * 50.0) * near);
        n = normalize(n + vec3(0.10, 0.0, 0.17) * rip * near);
        c = trLit(q, n, mix(trFloor(q), a, smoothstep(0.0, 0.10, up)), 1.0);
      }
      else if (side) {
        vec3 alb = trWall(q, q.z, ao);
        c = trLit(q, n, alb, ao); trGlow = vec3(0.0);
        if (!sky && rd.x < 0.0) {
          // the window
          vec2 wq = q.yz - trWin.xy; float d = trRect(wq, trWin.zw);
          if (d < trPx) {
            vec2 g = vec2(wq.x / trWin.z * 2.0 + 2.0, wq.y / trWin.w + 1.0), e = abs(fract(g - 0.5) - 0.5) * vec2(trWin.z * 0.5, trWin.w);
            float bar = max((1.0 - smoothstep(0.015 - trPx, 0.015 + trPx, min(e.x, e.y))), smoothstep(-0.03 - trPx, -0.03 + trPx, d));
            vec3 pane = ((uOwn[6] != 0.0 ? mix(vec3(0.80, 0.86, 0.90), uOwn[6] > 0.0 ? vec3(1.25, 0.72, 0.42) : vec3(0.13, 0.19, 0.32), abs(uOwn[6])) : vec3(0.80, 0.86, 0.90)) + 0.12 * trSun) * (0.72 + 0.4 * smoothstep(-0.2, 0.4, wq.x + 0.1 * noise(q.zx * 5.0 + q.y)) + 0.4 * uMic);
            c = mix(c, mix(pane, vec3(0.32, 0.32, 0.31), bar * 0.8), (1.0 - smoothstep(-trPx, trPx, d)));
          }
          c *= 1.0 - 0.3 * trLine(d - 0.07, 0.008);
        }
      } else if (rd.y < 0.0) {
        if (trChair) { vec2 k = abs(q.xz - vec2(0.86, trD - 0.26)) - 0.1; ao = 1.0 - 0.55 * exp(-length(max(k, 0.0)) * 9.0); }
        c = trLit(q, n, trFloor(q), ao);
        if (uOwn[4] > 0.0) c = mix(c, trWater(q, rd, c, trFar, fr), uOwn[4]);
      }
      else if (!sky) {
        // the ceiling: a moulded border and a plaster rose
        vec2 m = q.xz - vec2(0.0, trD * 0.5);
        float b = trRect(m, vec2(trW - 0.32, trD * 0.5 - 0.32)), o = length(m);
        ao -= 0.34 * trLine(b, 0.014) - 0.16 * trLine(b + 0.03, 0.012) + 0.22 * trLine(b + 0.07, 0.008) + 0.22 * trLine(o - 0.29, 0.011) - 0.14 * trLine(o - 0.267, 0.009) + 0.17 * trLine(o - 0.19, 0.009) + 0.22 * trLine(o - 0.06, 0.012);
        c = trLit(q, n, vec3(0.6, 0.6, 0.585), ao);
      }
      else {
        c = trSky(rd, fr);
        float g = q.z / trD * 4.0, e = (0.5 - abs(fract(g) - 0.5)) * trD / 4.0;
        c = mix(c, trPaint * 0.3, (1.0 - smoothstep(trBeam - trPx, trBeam + trPx, e)));
      }
      col += rem * mix(c, air, fog); rem = 0.0;
      break;
    }
    float cov = 1.0;
    if (tz > 0.0) {
      // the wall at the end and its doorway
      vec3 q = ro + rd * tz; trPx = sharp * tz;
      float d = trHole(q.xy); cov = (1.0 - smoothstep(-trPx, trPx, d));
      if (cov < 1.0) {
        float ao = 1.0; vec3 alb = trWall(q, q.x, ao);
        if (!sky) {
          float in1 = (1.0 - smoothstep(0.115 - trPx, 0.115 + trPx, d));
          if (in1 > 0.0) {
            alb = mix(alb, uOwn[7] > 0.0 ? mix(vec3(0.60, 0.59, 0.565), trPaint * 1.25 + 0.03, uOwn[7]) : vec3(0.60, 0.59, 0.565), in1); ao = mix(ao, 1.0, in1);
            ao *= 1.0 - 0.3 * trLine(d - 0.11, 0.007) - 0.2 * trLine(d - 0.075, 0.006) + 0.12 * trLine(d - 0.085, 0.006) - 0.15 * trLine(d - 0.02, 0.006);
          }
        }
        vec3 c = trLit(q, vec3(0.0, 0.0, -1.0), alb, ao); trGlow = vec3(0.0);
        col += rem * (1.0 - cov) * mix(c, air, fog);
        rem *= cov;
      }
    }
    if (rem < 0.01) break;
    // the thickness of the wall
    float tb = (trL - ro.z) * inv.z; vec3 q = ro + rd * tb; trPx = sharp * tb;
    float d = trHole(q.xy), in2 = smoothstep(-trPx, trPx, max(d, -1.0 - q.y));
    if (in2 > 0.0) {
      vec2 g = vec2(trHole(q.xy + vec2(0.01, 0.0)) - d, trHole(q.xy + vec2(0.0, 0.01)) - d) * -100.0;
      bool fl = -1.0 - q.y > d;
      vec3 n = fl ? vec3(0.0, 1.0, 0.0) : vec3(g, 0.0);
      vec3 c = (fl ? trFloor(q) : sky ? trPaint : uOwn[7] > 0.0 ? mix(vec3(0.58, 0.57, 0.55), trPaint * 1.1, uOwn[7]) : vec3(0.58, 0.57, 0.55)) * trAmb * (1.0 + uMic) * (0.42 + 0.22 * n.x * (sky ? -0.2 : -1.0) + (sky ? 0.3 : 0.1) * n.y);
      col += rem * in2 * mix(c, air, fog); rem *= 1.0 - in2;
    }
    if (rem < 0.01) break;
    // into the next room, which lies a quarter on its side
    ro.z -= trL;
    if (uOwn[1] != 0.0) { ro.xy = turned * ro.xy; rd.xy = turned * rd.xy; rd += vec3(equal(rd, vec3(0.0))) * 1e-5; }
    else { ro.xy = way * vec2(-ro.y, ro.x); rd.xy = way * vec2(-rd.y, rd.x); }
  }
  col += rem * air * 0.8;
  return trTone(col * (sky ? 1.05 : 1.35), sky);
}
