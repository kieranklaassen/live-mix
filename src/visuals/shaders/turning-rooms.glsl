// name: Turning rooms
// a: Grey rooms
// b: Open ceilings
// what: Grey rooms open one into the next, each turned a quarter on its side: a panelled door and a chair stand on this floor, then on what is our wall, then overhead, and a window lays its patch of light in each; or bare white rooms with arched openings and no ceiling, where sun falls past joists and pale sky looks in from four sides.
// follows: Each room is a later moment of the loop, its patch of light in strips coloured by what plays there. The drone warms the near room, pads widen the patches or bring clouds, texture is dust or leaf shade, a phrase opens the doors or thins the joists, bands light the panes; a hit lights a room ahead, a cue runs from near to far, keys touch the floor.
const float trW = 1.35, trL = 2.55, trD = 2.38;  // half a room's width, its pitch, its depth inside the walls
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
  q.x -= trDoor.x;
  if (uVar < 0.5) return max(abs(q.x) - trDoor.y, q.y - trDoor.w);
  float s = trDoor.w - trDoor.y + 0.1;
  return q.y < s ? abs(q.x) - trDoor.y : length(vec2(q.x, q.y - s)) - trDoor.y;
}
// Where a ray goes into a box and where out of it.
vec2 trBox(vec3 ro, vec3 inv, vec3 c, vec3 b) {
  vec3 k = (c - ro) * inv, h = abs(inv) * b, t1 = k - h, t2 = k + h;
  return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}
// From light to the screen, with a little more weight in the darks.
vec3 trTone(vec3 c, bool sky) { c = screenOf(c); return mix(c, c * c * (3.0 - 2.0 * c), sky ? 0.35 : 0.45); }
// A plain chair: seat, two back posts, two front legs, two rails.
const vec3 trChairMid = vec3(0.86, -0.69, trD - 0.26);
const vec3 trChairAt[7] = vec3[7](vec3(0.0, 0.0, 0.0), vec3(-0.165, 0.0, 0.17), vec3(0.165, 0.0, 0.17), vec3(-0.165, -0.15, -0.17), vec3(0.165, -0.15, -0.17), vec3(0.0, 0.27, 0.17), vec3(0.0, 0.14, 0.17));
const vec3 trChairBy[7] = vec3[7](vec3(0.185, 0.018, 0.19), vec3(0.018, 0.31, 0.018), vec3(0.018, 0.31, 0.018), vec3(0.018, 0.16, 0.018), vec3(0.018, 0.16, 0.018), vec3(0.15, 0.035, 0.012), vec3(0.15, 0.022, 0.012));
// How much of the sun the chair lets by.
float trShade(vec3 q) {
  q += trS * 0.004;
  vec3 inv = 1.0 / trS; float l = 1.0;
  vec2 g = trBox(q, inv, trChairMid, vec3(0.2, 0.32, 0.21));
  if (g.y > max(g.x, 0.0)) for (int k = 0; k < 7; k++) { g = trBox(q, inv, trChairMid + trChairAt[k], trChairBy[k]); l = min(l, (1.0 - smoothstep(0.0, 0.03, g.y - g.x))); }
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
  return alb * (l * ao + sun);
}
vec3 trFloor(vec3 q) {
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
// The walls: plaster above, a moulded dado and a skirting below; u runs along the wall.
vec3 trWall(vec3 q, float u, inout float ao) {
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
  // the walk: four rooms and it begins again; it lingers in a room and goes a little quicker through a door
  float w = mod(uTravel * 0.045 + 3.72, 4.0);
  float z = w - 0.105 * (sin(TAU * (w - 0.1)) + 0.588);
  z = mod(z, 4.0);
  float cell = floor(z), fz = z - cell;
  vec2 shift = vec2(0.13 * shape + 0.02 * sin(uTime * 0.051), (uVar < 0.5 ? 0.02 : -0.1) + 0.012 * sin(uTime * 0.037));
  float lens = mix(0.6, uVar < 0.5 ? 0.84 : 0.76, shape);
  vec3 rd = vec3(p - shift, lens);
  float far = length(rd), sharp = far / (uRes.y * lens);
  rd /= far;
  vec3 ro = vec3(vec2(-0.14, -0.12) * rot((uVar < 0.5 ? -0.5 : 0.5) * PI * z), fz * trL);
  // the room we stand in, seen in its own upright
  int turn = int(cell);
  float way = uVar < 0.5 ? -1.0 : 1.0;
  for (int k = 0; k < turn; k++) { ro.xy = way * vec2(-ro.y, ro.x); rd.xy = way * vec2(-rd.y, rd.x); }
  rd += vec3(equal(rd, vec3(0.0))) * 1e-5;
  vec3 col = vec3(0.0);
  float rem = 1.0;
  bool sky = uVar > 0.5;
  vec2 swing = vec2(cos(2.5 + 0.35 * uPhrase), -sin(2.5 + 0.35 * uPhrase));   // how the doors stand open
  vec3 air = sky ? vec3(0.62, 0.70, 0.78) : vec3(0.52, 0.53, 0.54);
  for (int i = 0; i < 7; i++) {
    int r = (turn + i) & 3;
    float fr = float(r);
    trFar = max(float(i) + 0.5 - fz, 0.0);
    // the sound this room carries: a later bar of the loop the farther it is
    float u = fract(uLoop + 0.07 * trFar), seam = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(0.9, 1.0, u));
    float cd = trFar - (1.0 - uCue) * 6.0, hd = (trFar - 1.7) * 1.5;
    float cue = uCue / (1.0 + cd * cd * cd * cd);
    float hit = uHits / (1.0 + hd * hd * hd * hd * 2.0);
    vec3 day = sky ? vec3(1.0, 0.90, 0.76) : vec3(1.0, 0.95, 0.87);
    trDay = day; trMore = mix(day, uKind[4], 0.5) * hit * 3.4 + day * cue * 1.6; trBar = vec2(u, seam);
    trSun = trLight(0.8);
    float both = sky ? 0.0 : 0.5 * sat(3.0 - trFar);
    if (both > 0.0) trSun = mix(trSun, trLight(0.4), both);
    trAmb = (sky ? vec3(0.62, 0.74, 0.9) : vec3(0.82, 0.88, 0.93)) * (0.95 + 0.22 * sin(fr * 1.9 + 0.8)) + mix(day, uKind[4], 0.3) * hit * 0.8;
    trAmb *= mix(vec3(1.0), vec3(1.2, 1.0, 0.76) * (0.8 + 0.4 * uKind[0]), 0.8 * uDrone * exp(-trFar * 0.7));
    trPaint = sky ? vec3(0.60, 0.57, 0.53) : (r == 0 ? vec3(0.31, 0.318, 0.315) : r == 1 ? vec3(0.40, 0.39, 0.36) : r == 2 ? vec3(0.27, 0.295, 0.31) : vec3(0.42, 0.42, 0.40));
    float slow = sin(uTime * 0.031 + fr * 1.7);
    trS = sky ? normalize(vec3(-0.62 + 0.12 * slow, 0.8, -0.35 - 0.1 * slow)) : normalize(vec3(-1.0, (r == 0 ? 0.17 : 0.42) + 0.05 * slow, (r == 0 ? -0.6 : r == 1 ? -0.36 : r == 2 ? -0.5 : -0.26) + 0.05 * slow));
    trWin = vec4(0.2, 1.15, 0.5, 0.36);
    trWide = 1.0 + 0.22 * uPad;
    trChair = r < 3 && i < 4;
    trBeam = 0.055 - 0.02 * uPhrase;
    trSoft = mix(0.07, 0.006, uTone);
    vec3 inv = 1.0 / rd;
    float tx = ((rd.x > 0.0 ? trW : -trW) - ro.x) * inv.x, ty = ((rd.y > 0.0 ? 1.0 : -1.0) - ro.y) * inv.y;
    float tz = (trD - ro.z) * inv.z;
    float tw = min(tx, ty), t = min(tw, tz);
    float fog = 1.0 - exp(-max(t - 1.0, 0.0) * (0.01 + 0.035 * uSpace));
    if (tz > 0.0) {
      // light standing in the air of the room
      if (!sky) {
        vec2 o = ro.yz + trS.yz * ((ro.x + trW) / -trS.x) - trWin.xy, dv = rd.yz + trS.yz * (rd.x / -trS.x);
        dv += vec2(equal(dv, vec2(0.0))) * 1e-4;
        vec2 iv = 1.0 / dv, h = abs(iv) * trWin.zw * trWide, t1 = -o * iv - h, t2 = -o * iv + h;
        float a = max(max(t1.x, t1.y), max(0.0, -ro.z * inv.z)), b = min(min(t2.x, t2.y), t);
        col += rem * trSun * max(b - a, 0.0) * (0.006 + 0.010 * uTexture);
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
        vec2 g = trBox(ro, inv, trChairMid, vec3(0.2, 0.32, 0.21));
        if (g.y > g.x && g.x > 0.0 && g.x < t) {
          float best = t, cov = 0.0; int at = -1;
          for (int k = 0; k < 7; k++) {
            g = trBox(ro, inv, trChairMid + trChairAt[k], trChairBy[k]);
            if (g.y > g.x && g.x > 0.0 && g.x < t) { cov = max(cov, smoothstep(0.0, sharp * g.x * 2.0, g.y - g.x)); if (g.x < best) { best = g.x; at = k; } }
          }
          if (at >= 0) {
            vec3 e = (ro + rd * best - trChairMid - trChairAt[at]) / trChairBy[at], ae = abs(e);
            vec3 n = sign(e) * (ae.x > max(ae.y, ae.z) ? vec3(1.0, 0.0, 0.0) : ae.y > ae.z ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0));
            col += rem * cov * trLit(ro + rd * best, n, sky ? vec3(0.13, 0.10, 0.08) : vec3(0.075, 0.058, 0.046), 1.0); rem *= 1.0 - cov;
          }
        }
      }
      // the open door of this room
      if (!sky) {
        vec2 hin = vec2(trDoor.x - trDoor.y, trD), nl = vec2(swing.y, -swing.x);
        float dn = dot(rd.xz, nl), tl = dot(hin - ro.xz, nl) / (abs(dn) < 1e-4 ? 1e-4 : dn);
        if (tl > 0.0 && tl < t) {
          vec3 q = ro + rd * tl; trPx = sharp * tl;
          vec2 lq = vec2(dot(q.xz - hin, swing), q.y + 1.0);
          float wd = trDoor.y * 1.96, cut = trRect(lq - vec2(wd * 0.5, 0.825), vec2(wd * 0.5, 0.81)), cov = (1.0 - smoothstep(-trPx, trPx, cut));
          if (cov > 0.0) {
            float ao = 1.0; vec3 alb = trLeaf(lq, wd, ao);
            vec3 c = trLit(q, vec3(nl.x, 0.0, nl.y) * -sign(dn), alb, ao);
            col += rem * cov * mix(c, air, fog); rem *= 1.0 - cov;
          }
        }
      }
      if (rem < 0.01) break;
    }
    if (tz > 0.0 && tw < tz) {
      // a wall, the floor, the ceiling, or the sky
      bool side = tx < ty;
      vec3 q = ro + rd * t, n = side ? vec3(-sign(rd.x), 0.0, 0.0) : vec3(0.0, -sign(rd.y), 0.0);
      trPx = sharp * t / max(abs(dot(rd, n)), 0.15);
      float ao = 1.0; vec3 c;
      if (side) {
        vec3 alb = trWall(q, q.z, ao);
        c = trLit(q, n, alb, ao);
        if (!sky && rd.x < 0.0) {
          // the window
          vec2 wq = q.yz - trWin.xy; float d = trRect(wq, trWin.zw);
          if (d < trPx) {
            vec2 g = vec2(wq.x / trWin.z * 2.0 + 2.0, wq.y / trWin.w + 1.0), e = abs(fract(g - 0.5) - 0.5) * vec2(trWin.z * 0.5, trWin.w);
            float bar = max((1.0 - smoothstep(0.015 - trPx, 0.015 + trPx, min(e.x, e.y))), smoothstep(-0.03 - trPx, -0.03 + trPx, d));
            vec3 pane = (vec3(0.80, 0.86, 0.90) + 0.12 * trSun) * (0.72 + 0.4 * smoothstep(-0.2, 0.4, wq.x + 0.1 * noise(q.zx * 5.0 + q.y)) + 0.4 * uMic);
            c = mix(c, mix(pane, vec3(0.32, 0.32, 0.31), bar * 0.8), (1.0 - smoothstep(-trPx, trPx, d)));
          }
          c *= 1.0 - 0.3 * trLine(d - 0.07, 0.008);
        }
      } else if (rd.y < 0.0) {
        if (trChair) { vec2 k = abs(q.xz - vec2(0.86, trD - 0.26)) - 0.1; ao = 1.0 - 0.55 * exp(-length(max(k, 0.0)) * 9.0); }
        c = trLit(q, n, trFloor(q), ao);
      }
      else if (!sky) {
        // the ceiling: a moulded border and a plaster rose
        vec2 m = q.xz - vec2(0.0, trD * 0.5);
        float b = trRect(m, vec2(trW - 0.32, trD * 0.5 - 0.32)), o = length(m);
        ao -= 0.34 * trLine(b, 0.014) - 0.16 * trLine(b + 0.03, 0.012) + 0.22 * trLine(b + 0.07, 0.008) + 0.22 * trLine(o - 0.29, 0.011) - 0.14 * trLine(o - 0.267, 0.009) + 0.17 * trLine(o - 0.19, 0.009) + 0.22 * trLine(o - 0.06, 0.012);
        c = trLit(q, n, vec3(0.6, 0.6, 0.585), ao);
      }
      else {
        vec2 sv = rd.xz * inv.y;
        float cl = noise(sv * 0.8 + vec2(uTime * 0.006, fr * 7.0)) * 0.6 + noise(sv * 2.1 + vec2(uTime * 0.011, fr)) * 0.3;
        c = mix(vec3(0.24, 0.45, 0.74), vec3(0.62, 0.75, 0.85), sat(1.1 - 1.2 * rd.y)) * (1.0 + 0.3 * uMic);
        c = mix(c, mix(vec3(1.2, 1.16, 1.12), trSun, 0.25), smoothstep(0.5 - 0.2 * uPad, 0.8, cl) * 0.75);
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
            alb = mix(alb, vec3(0.60, 0.59, 0.565), in1); ao = mix(ao, 1.0, in1);
            ao *= 1.0 - 0.3 * trLine(d - 0.11, 0.007) - 0.2 * trLine(d - 0.075, 0.006) + 0.12 * trLine(d - 0.085, 0.006) - 0.15 * trLine(d - 0.02, 0.006);
          }
        }
        vec3 c = trLit(q, vec3(0.0, 0.0, -1.0), alb, ao);
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
      vec3 c = (fl ? trFloor(q) : sky ? trPaint : vec3(0.58, 0.57, 0.55)) * trAmb * (1.0 + uMic) * (0.42 + 0.22 * n.x * (sky ? -0.2 : -1.0) + (sky ? 0.3 : 0.1) * n.y);
      col += rem * in2 * mix(c, air, fog); rem *= 1.0 - in2;
    }
    if (rem < 0.01) break;
    // into the next room, which lies a quarter on its side
    ro.z -= trL;
    ro.xy = way * vec2(-ro.y, ro.x); rd.xy = way * vec2(-rd.y, rd.x);
  }
  col += rem * air * 0.8;
  return trTone(col * (sky ? 1.05 : 1.35), sky);
}
