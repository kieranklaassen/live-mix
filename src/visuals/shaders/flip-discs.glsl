// name: Flip board
// a: Waiting hall
// b: Rolling front
// what: A station hall in grey morning light: over one waiting traveller hangs a long board of small round plates, black on one side and chalk yellow on the other, turning into dunes and weather. Or close along the board, near plates out of focus, each on its pins over a well, a front of turning rolling away from us.
// follows: The piece turns plates bright in its colours, the loop along the board, the room up it. Bands stand along its foot. Each kind tints a window; its colour falls on the floor. The loop is a seam of plates on edge. A hit lights and tips a ring of plates; a cue turns every plate over in one slanting wave. Keys turn single plates; Space is haze and focus.
// own: 0 blue night with the board lit at -1, low golden sun at 1; 1 a cream board with bottle green plates at -1, a red board with white plates at 1; 2 few big plates at -1, many small ones at 1; 3 square shutters and broad square windows at -1, slim blades and tall slits of windows at 1; 4 the weather is slanting rain bands at -1, drifting islands at 1; 5 right up under the board, or down along its face, at -1, far back in the hall, or high over it, at 1
// A smooth step that may also run downward.
float fdS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec3 fdOn, fdOff, fdField;    // the two sides of a plate and the board between them
float fdNight, fdGold;
float fdRows;                 // how many plates high the board is

void fdSet() {
  fdNight = max(-uOwn[0], 0.0); fdGold = max(uOwn[0], 0.0);
  float pale = max(-uOwn[1], 0.0), red = max(uOwn[1], 0.0);
  fdOn = mix(mix(vec3(1.0, 0.86, 0.40), vec3(0.04, 0.36, 0.29), pale), vec3(0.97, 0.93, 0.85), red);
  fdOff = mix(mix(vec3(0.125, 0.13, 0.14), vec3(0.87, 0.85, 0.79), pale), vec3(0.58, 0.15, 0.10), red);
  fdField = mix(mix(vec3(0.075, 0.078, 0.085), vec3(0.62, 0.60, 0.55), pale), vec3(0.34, 0.075, 0.055), red);
  fdRows = 22.0 * exp2((uOwn[2] < 0.0 ? 0.95 : 0.6) * uOwn[2]);
}
// How a kind of sound colours a window, 0 to 4 from the left.
vec3 fdGlass(float k, vec3 pale) {
  int i = int(clamp(k, 0.0, 4.0));
  float s = i == 0 ? uDrone : i == 1 ? uPad : i == 2 ? uTexture : i == 3 ? uPhrase : uHits;
  vec3 c = uKind[i];
  c = c / max(max(c.r, max(c.g, c.b)), 0.05);
  c = mix(vec3(dot(c, vec3(0.333))), c, 0.75);
  return pale * mix(vec3(1.0), 0.5 + 0.62 * c, 0.7 * sat(s * 1.2)) * (1.0 + 0.08 * s + 0.1 * uCue);
}
// How far the weather on the board has turned the plates at a place: below -1 all dark, above 1 all bright.
float fdWeather(vec2 u) {
  float y = 1.0 - u.y, t = uTime;
  float rain = max(-uOwn[4], 0.0), isles = max(uOwn[4], 0.0), v;
  if (uVar < 0.5) {
    float hill = 0.34 + 0.16 * sin(u.x * 5.2 - t * 0.037 + 0.6) + 0.06 * sin(u.x * 12.7 + t * 0.053 + 1.0);
    float far = 0.52 + 0.17 * sin(u.x * 3.7 + t * 0.029 + 3.5);
    v = (hill - y) / 0.13;
    v = max(v, 0.75 - 12.0 * abs(y - far) + 0.7 * sin(u.x * 9.0 - t * 0.045 + 2.0));
  } else {
    v = 1.9 * sin(u.x * 15.0 - t * 0.065 + 0.9 * sin(u.y * 3.1 + 0.7) + 0.35 * sin(u.y * 7.7 + t * 0.03)) - 0.2;
  }
  float r = 1.7 * sin(u.x * 19.0 + y * 13.0 - t * 0.12) - 0.3;
  float s = 2.6 * sin(u.x * 13.0 + 0.8 * sin(y * 4.0 + t * 0.05) + t * 0.041) * sin(y * 8.5 + 0.9 * sin(u.x * 9.0) - t * 0.06) - 0.6;
  return mix(mix(v, r, rain), s, isles);
}
// Where the ring of a hit is on its way out over the board.
float fdRing(vec2 u) {
  vec2 d = uVar < 0.5 ? (u - vec2(0.62, 0.45)) * vec2(3.2, 1.0) : (u - vec2(0.15, 0.5)) * vec2(2.1, 1.55);
  float ring = length(d) - 0.12 - 1.1 * (1.0 - uHits);
  return exp(-ring * ring * 60.0);
}
// The angle of one plate: 0 shows the dark side, half a turn the bright one. m is the piece there.
float fdTurn(vec2 u, vec2 id, out vec4 m) {
  m = piece(u) * fdS(0.0, 0.03, u.x) * fdS(1.0, 0.95, u.x);
  float h = hash21(id), h2 = hash21(id + 71.3), y = 1.0 - u.y;
  float v = fdWeather(u);
  v = max(v, mix(v, 1.3, sat(m.a * (1.0 + 1.0 * uEnergy))));
  // the bands stand along the foot of the board: a dark skyline in the hall, bright strips close to
  float along = uVar < 0.5 ? u.x : u.y;
  float b = along > 0.0 && along < 1.0 ? band(along) * (0.6 + 0.7 * uEnergy) : 0.0;
  if (uVar < 0.5) v -= 2.6 * fdS(-0.03, 0.05, 0.30 * b - 0.04 - y);
  else v = max(v, mix(v, 1.4, fdS(-0.03, 0.07, 0.34 * b * (0.55 + 0.45 * sin(u.y * 50.0)) - 0.06 - u.x)));
  float a = PI * fdS(-1.0, 1.0, v + 0.6 * (h - 0.5));
  a += (0.16 + 0.12 * uLevel) * sin(u.x * 29.0 + y * 19.0 + 2.0 * sin(u.x * 7.0) - uTime * 0.19) + 0.16 * (h2 - 0.5);
  // where the loop is, a seam of plates stands on edge
  float q = (u.x - uLoop) * (uVar < 0.5 ? 64.0 : 26.0);
  a = mix(a, 0.5 * PI, 0.92 * exp(-q * q) * fdS(0.0, 0.04, uLoop) * fdS(1.0, 0.96, uLoop));
  a += 1.1 * uKeys * fdS(0.9, 0.93, h2);
  // a hit tips a ring of plates, a cue turns every plate once over along a diagonal
  a += 6.0 * uHits * (1.0 - uHits) * fdRing(u);
  float diag = sat((u.x + 0.4 * y) / 1.4);
  a += TAU * fdS(diag, diag + 0.3, 1.3 * (1.0 - uCue));
  return a;
}
// How far a place on a plate is from its middle: round, or square, or a blade.
float fdForm(vec2 q) {
  float sq = max(-uOwn[3], 0.0), bl = max(uOwn[3], 0.0);
  float d = mix(length(q), max(abs(q.x), abs(q.y)), sq);
  return mix(d, length(q * vec2(0.92, 1.6)), bl);
}
// The bright side takes some of the colour of the sound that turned it.
vec3 fdPaint(vec4 m) {
  vec3 hue = m.a > 0.004 ? m.rgb / m.a : vec3(0.5);
  hue /= max(max(hue.r, max(hue.g, hue.b)), 0.1);
  return mix(fdOn, fdOn * 0.25 + 0.75 * mix(vec3(0.5), hue, 0.9) * max(max(fdOn.r, fdOn.g), fdOn.b), 0.62 * sat(m.a * 1.4));
}

// ---- the hall ----
const float FD_BACK = 24.0;   // how far off the wall of windows is
vec3 fdO, fdU, fdV, fdN;      // the board: its lower left corner, along, up, and out
float fdLean;                 // how high the sun stands

// Where a ray meets the board, in metres along and up.
vec3 fdBoard(vec3 ro, vec3 rd) {
  float k = dot(rd, fdN);
  k = abs(k) < 1e-4 ? 1e-4 : k;
  float t = dot(fdO - ro, fdN) / k;
  vec3 q = ro + rd * t - fdO;
  return vec3(dot(q, fdU), dot(q, fdV), t);
}
// The five tall windows: how far outside the nearest one, and which.
float fdWindow(vec2 w, out float k, out vec2 in_) {
  float sq = max(-uOwn[3], 0.0), slit = max(uOwn[3], 0.0), hw = 1.6 + 0.75 * sq - 0.85 * slit;
  k = clamp(floor((w.x + 12.35) / 5.5), 0.0, 4.0);
  vec2 q = vec2(w.x + 9.6 - 5.5 * k, w.y - 11.4 - 1.5 * slit + 2.0 * sq);
  in_ = q;
  float top = mix(length(q), max(abs(q.x), q.y), sq);
  return q.y < 0.0 ? max(abs(q.x) - hw, -9.6 - 1.5 * slit + 2.0 * sq - q.y) : top - hw;
}
float fdSeg(vec2 q, vec2 a, vec2 b, float r) {
  vec2 pa = q - a, ba = b - a;
  return length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))) - r;
}
// Somebody waiting in a long coat, seen from behind, a suitcase set down beside.
float fdFigure(vec2 q) {
  if (abs(q.x) > 1.5 || q.y > 2.4) return 1.0;
  float d = fdSeg(q, vec2(-0.10, 0.04), vec2(-0.07, 0.6), 0.06);
  d = min(d, fdSeg(q, vec2(0.13, 0.04), vec2(0.07, 0.6), 0.06));
  float w = mix(0.25, 0.185, fdS(0.36, 1.05, q.y)) + 0.03 * fdS(1.0, 1.35, q.y);
  d = min(d, max(abs(q.x) - w + 0.05, abs(q.y - 0.88) - 0.49) - 0.05);
  d = smin(d, fdSeg(q, vec2(-0.1, 1.40), vec2(0.1, 1.40), 0.075), 0.06);
  d = smin(d, fdSeg(q, vec2(-0.18, 1.34), vec2(-0.215, 0.82), 0.06), 0.06);
  d = smin(d, fdSeg(q, vec2(0.18, 1.34), vec2(0.24, 0.95), 0.06), 0.06);
  d = smin(d, fdSeg(q, vec2(0.0, 1.4), vec2(0.01, 1.55), 0.05), 0.05);
  d = min(d, length((q - vec2(0.015, 1.605)) * vec2(1.12, 0.92)) - 0.098);
  d = min(d, fdSeg(q, vec2(-0.115, 1.655), vec2(0.15, 1.67), 0.014));
  d = min(d, fdSeg(q, vec2(-0.03, 1.70), vec2(0.06, 1.705), 0.058));
  vec2 c = abs(q - vec2(0.62, 0.27)) - vec2(0.24, 0.19);
  d = min(d, max(c.x, c.y) - 0.03);
  return min(d, abs(fdSeg(q, vec2(0.56, 0.5), vec2(0.68, 0.5), 0.05)) - 0.014);
}
vec3 fdHall(vec2 p) {
  float near = max(-uOwn[5], 0.0), far = max(uOwn[5], 0.0);
  float FL = 1.0 + 0.2 * near;
  vec2 vp = vec2(-0.2 + 0.1 * far - 0.14 * near, -0.2 - 0.07 * near + 0.04 * far);
  vec3 ro = vec3(0.04 * sin(uTime * 0.05), 1.25 + 0.6 * far, -7.0 * far + 1.6 * near);
  vec3 rd = vec3(p - vp, FL);
  float e = 1.0 / uRes.y;                                   // a pixel
  fdO = vec3(-3.3, 3.2, 15.0);
  fdU = vec3(0.866, 0.0, -0.5);
  fdV = normalize(vec3(-0.05, 1.0, -0.0866));
  fdN = normalize(cross(fdV, fdU));
  fdLean = 0.5 - 0.12 * fdGold;
  vec3 pale = mix(mix(vec3(0.95, 0.965, 0.96), vec3(0.16, 0.25, 0.40), fdNight), vec3(1.0, 0.80, 0.54), fdGold);
  vec3 stone = mix(mix(vec3(0.565, 0.585, 0.59), vec3(0.13, 0.145, 0.18), fdNight), vec3(0.58, 0.45, 0.34), fdGold);
  float sun = mix(1.0, 0.35, fdNight) * (1.0 + 0.25 * fdGold) * (0.85 + 0.3 * uTone) * (1.0 + 0.1 * uLevel + 0.1 * uCue);

  // the board
  vec3 b = fdBoard(ro, rd);
  float LEN = 24.0, HI = 4.2, cell = HI / fdRows;
  vec3 bx = fdBoard(ro, rd + vec3(e, 0.0, 0.0)), by = fdBoard(ro, rd + vec3(0.0, e, 0.0));
  float bpx = 0.5 * (length(bx.xy - b.xy) + length(by.xy - b.xy));
  float edge = max(max(-b.x, b.x - LEN), max(-b.y, b.y - HI)) - 0.22;
  float onBoard = b.z > 0.0 ? fdS(bpx, -bpx, edge) : 0.0;
  vec3 col = vec3(0.0);

  if (onBoard < 1.0) {
    // the room is a box: floor, back wall, two sides, a roof
    float tb = (FD_BACK - ro.z) / rd.z;
    float tf = rd.y < -1e-4 ? -ro.y / rd.y : 1e5;
    float tr = rd.y > 1e-4 ? (17.0 - ro.y) / rd.y : 1e5;
    float tx = rd.x < -1e-4 ? (-14.5 - ro.x) / rd.x : rd.x > 1e-4 ? (19.0 - ro.x) / rd.x : 1e5;
    float t = min(min(tb, tf), min(tr, tx));
    vec3 q = ro + rd * t;
    float px = t * e / FL, k; vec2 w;
    if (t == tb) {
      float d = fdWindow(q.xy, k, w);
      float on = fdS(px, -px, d);
      vec3 sky = fdGlass(k, pale) * (0.92 + 0.08 * fdS(2.0, 13.0, q.y)) * (1.0 - 0.10 * noise(vec2(q.x * 0.8 + k * 7.0, q.y * 0.35)));
      // glazing bars
      vec2 c = vec2(abs(fract(w.x / 0.8 + 0.5) - 0.5) * 0.8, abs(fract(w.y / 1.6) - 0.5) * 1.6);
      float bar = fdS(0.05 + px, 0.05 - px, c.x) * 0.65;
      bar = max(bar, fdS(0.06 + px, 0.06 - px, 0.8 - c.y) * 0.65);
      vec3 wall = stone * (0.62 + 0.1 * fdS(0.0, 14.0, q.y));
      wall *= 1.0 - 0.16 * fdS(0.5 + px, 0.5 - px, abs(d - 0.2) + 0.28);
      wall += pale * 0.09 * exp(-max(d, 0.0) * 0.9);
      wall *= 1.0 - 0.25 * fdS(1.25 + px, 1.25 - px, q.y);
      col = mix(wall, sky * (1.0 - bar), on);
    } else if (t == tf) {
      // the floor: worn square tiles, the windows thrown across it, and their dim likeness in the polish
      float dz = FD_BACK - q.z;
      vec2 sw = vec2(q.x - 0.34 * dz, fdLean * dz);
      float soft = mix(0.55, 0.12, uTone) + dz * 0.012;
      float d = fdWindow(sw, k, w);
      float lit = fdS(soft, -soft, d);
      float bar = fdS(0.3, 0.05, abs(abs(fract(w.x / 0.8 + 0.5) - 0.5) * 0.8)) * 0.22 + fdS(0.35, 0.0, 0.8 - abs(fract(w.y / 1.6) - 0.5) * 1.6) * 0.22;
      lit *= 1.0 - bar;
      vec2 tile = q.xz / 1.1 + 0.5;
      vec2 ti = floor(tile), tq = abs(fract(tile) - 0.5);
      float tpx = px / 1.1 * max(1.0, t * FL / 1.25 * 0.35);
      float line = fdS(0.485 - tpx, 0.485 + tpx, max(tq.x, tq.y)) * 0.28 / (1.0 + 18.0 * tpx);
      float tone = 0.94 + 0.08 * (hash21(ti) - 0.5) + 0.1 * (mod(ti.x + ti.y, 2.0) - 0.5) + 0.06 * (noise(q.xz * 3.0) - 0.5);
      vec3 stoneF = stone * 0.62 * tone * (1.0 - line);
      // the shadow of the one who waits
      float sz = 10.4 - q.z;
      float sh = sz > 0.0 ? fdS(0.04 + 0.05 * sz, -0.02 - 0.02 * sz, fdFigure(vec2(q.x - 0.34 * sz + 0.15, fdLean * sz))) : 0.0;
      lit *= 1.0 - 0.95 * sh;
      col = stoneF + fdGlass(k, pale) * stone * tone * (1.0 - line) * mix(vec3(1.0, 0.94, 0.84), vec3(1.0), max(fdNight, fdGold)) * lit * 0.71 * sun;
      vec3 rr = vec3(rd.x, -rd.y, rd.z);
      float f = 0.10 + 0.5 * pow(1.0 - sat(-rd.y / length(rd)), 6.0);
      vec2 rw = vec2(q.x + rd.x / FL * dz, rr.y / FL * dz);
      float k2; vec2 w2;
      float d2 = fdWindow(rw, k2, w2);
      col += fdGlass(k2, pale) * f * 0.4 * fdS(0.7, -0.7, d2) * (1.0 - 0.6 * lit) * (0.8 + 0.4 * tone);
      vec3 rb = fdBoard(q, rr);
      if (rb.z > 0.0) {
        float ob = fdS(0.6, -0.3, max(max(-rb.x, rb.x - LEN), max(-rb.y, rb.y - HI)));
        float v = sat(0.5 + 0.5 * fdWeather(vec2(rb.x / 13.4, 1.0 - rb.y / HI)));
        col = mix(col, mix(fdOff, fdOn, v) * (0.7 + 0.3 * stone), ob * f * 0.6);
      }
      // where the floor meets the side walls
      col = mix(stone * 0.36, col, fdS(0.0, 1.5 * t * (1.0 + abs(rd.x) * t) * e, min(q.x + 14.5, 19.0 - q.x)));
      // at night the lamps of the board pool on the tiles under it
      col += fdNight * vec3(0.62, 0.46, 0.22) * tone * (1.0 - line) * 0.6 * exp(-0.048 * (q.z - 12.0 + 0.5 * q.x) * (q.z - 12.0 + 0.5 * q.x)) * fdS(-5.0, 3.0, q.x);
      float foot = length((q.xz - vec2(0.0, 10.4)) * vec2(0.8, 1.6));
      col *= 1.0 - 0.45 * exp(-foot * foot * 5.0);
    } else if (t == tx) {
      float side = rd.x < 0.0 ? 1.0 : 0.0;
      float bay = abs(fract(q.z / 4.0) - 0.5) * 4.0;
      vec3 wall = stone * mix(0.95, 0.5, side) * (0.8 + 0.2 * fdS(0.0, 10.0, q.y));
      wall *= 1.0 - 0.22 * fdS(0.35 - px, 0.35 + px, bay) * (1.0 - 0.5 * fdS(0.35, 2.0, bay));
      wall *= 1.0 - 0.25 * fdS(1.25 + px, 1.25 - px, q.y);
      col = wall;
    } else {
      float rib = abs(fract(q.z / 3.0) - 0.5) * 3.0;
      col = stone * (0.5 + 0.2 * fdS(0.3 + px, 0.3 - px, rib));
    }
    // the light standing in the air
    float dith = hash21(mod(gl_FragCoord.xy, 977.0) + 3.7) * 0.8 + 0.1;
    vec3 air = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float s = (float(i) + dith) / 8.0;
      vec3 a = ro + rd * mix(0.25, 1.0, s) * t;
      float dz = FD_BACK - a.z, kk; vec2 ww;
      float d = fdWindow(vec2(a.x - 0.34 * dz, a.y + fdLean * dz), kk, ww);
      air += fdGlass(kk, pale) * fdS(1.0, -1.1, d);
    }
    col += air / 8.0 * (0.16 + 0.15 * uSpace + 0.08 * uMic + 0.05 * uCue) * sun;
    float haze = 1.0 - exp(-t * (0.006 + 0.014 * uSpace));
    col = mix(col, pale * mix(0.62, 0.5, fdNight), haze * 0.5);
    // the one who waits
    vec2 fq = (ro + rd * ((10.4 - ro.z) / rd.z)).xy;
    float fp = (10.4 - ro.z) * e / FL;
    float fd = fdFigure(fq - vec2(0.004 * sin(uTime * 0.4) * fq.y, 0.0) + vec2(0.15, 0.0));
    vec3 coat = stone * 0.16 + pale * 0.35 * fdS(-0.06, 0.0, fd) * fdS(0.1, -0.35, fq.x + 0.15) * fdS(0.2, 1.2, fq.y);
    col = mix(col, coat, fdS(fp, -fp, fd));
    // the rods it hangs by
    for (int i = 0; i < 2; i++) {
      vec3 at = fdO + fdU * (1.2 + 7.0 * float(i));
      float z = at.z - ro.z;
      float x = abs(p.x - vp.x - (at.x - ro.x) / z * FL) - 0.035 / z;
      if (b.y > HI) col = mix(col, stone * 0.22, fdS(e, -e, x));
    }
  }
  if (onBoard > 0.0) {
    vec2 g = b.xy / cell, id = floor(g), f = g - id - 0.5;
    float gp = bpx / cell;
    vec2 u = vec2((id.x + 0.5) * cell / 13.4, 1.0 - (id.y + 0.5) / fdRows);
    float grown = fdS(0.0, 1.0, fdRows - id.y) * step(0.0, id.y) * step(0.0, id.x);
    vec3 face = fdField;
    // a lamp trough along the top lights the board from above, the windows from its left end
    float lamp = mix(1.0, 0.72, fdS(0.0, 1.0, 1.0 - b.y / HI));
    float grey = mix(0.86, 1.02, exp(-max(b.x, 0.0) * 0.16)) * mix(1.0, 0.8, fdNight);
    vec3 tint = mix(vec3(1.0), pale / max(pale.r, pale.b), 0.35);
    if (grown > 0.0) {
      vec4 m;
      float a = fdTurn(u, id, m), c = cos(a), s = sin(a), ac = max(abs(c), 0.1);
      float r = 0.47 * grown;
      vec2 q = vec2(0.7071 * (f.x + f.y), 0.7071 * (f.y - f.x));
      face = mix(face, fdField * 0.45, fdS(gp, -gp, length(f) - r - 0.01));   // the well
      float dd = (fdForm(vec2(q.x, q.y / ac)) - r) * mix(ac, 1.0, 0.3);
      float on = fdS(gp, -gp, dd);
      float sg = c < 0.0 ? -1.0 : 1.0;
      vec3 n = vec3(-0.7071 * s, 0.7071 * s, c) * sg;                                // out of the board is z
      float lit = 0.50 + 0.62 * sat(dot(n, normalize(vec3(-0.4, 0.75, 0.62))));
      float glint = pow(sat(dot(n, normalize(vec3(-0.55, 0.55, 0.62)))), 14.0);
      vec3 paint = mix(fdOff, fdPaint(m), fdS(0.12, -0.12, c));
      face = mix(face, paint * lit + glint * 0.16, on);
      face += 0.45 * fdS(0.35, 0.0, abs(c)) * fdS(gp + 0.05, 0.0, abs(q.y)) * on; // an edge catches the light
      face += fdPaint(m) * 0.35 * uHits * fdRing(u) * on;
    }
    face *= lamp * grey * mix(1.22, 1.6, fdNight) * tint;
    float rim = fdS(-0.22 - bpx, -0.22 + bpx, edge);
    vec3 frame = stone * (0.26 + 0.35 * fdS(0.06, 0.0, abs(edge + 0.2)) + 0.3 * fdS(HI, HI + 0.2, b.y));
    face = mix(face, frame, rim);
    col = mix(col, face, onBoard);
  }
  return col;
}

// ---- close to the board ----
// The hall behind, far out of focus: p.y is the height over the far edge of the board.
vec3 fdBehind(vec2 p, vec3 pale, vec3 stone) {
  float wx = p.x * 2.6 + 0.35, k = clamp(floor(wx + 2.5), 0.0, 4.0), q = abs(wx + 2.0 - k);
  float wide = 0.31 + 0.1 * max(-uOwn[3], 0.0) - 0.15 * max(uOwn[3], 0.0);
  float win = fdS(wide + 0.17, wide - 0.17, q) * fdS(0.0, 0.16, p.y);
  vec3 c = stone * (0.62 + 0.55 * fdS(0.0, 0.5, p.y)) + pale * 0.10 * exp(-p.x * p.x * 3.0 - p.y * p.y * 12.0);
  return mix(c, fdGlass(k, pale) * (0.96 + 0.1 * uMic), win * (0.92 - 0.3 * fdS(0.15, 0.6, p.y)));
}
vec3 fdClose(vec2 p) {
  float low = max(-uOwn[5], 0.0), high = max(uOwn[5], 0.0);
  p = rot(0.17 + 0.16 * low - 0.1 * high) * p;
  float sc = 22.0 / fdRows;                                  // how big a plate is
  float H = (3.3 - 1.1 * low + 3.4 * high) / sc, FL = 1.15, hy = 0.27 - 0.04 * low + 0.2 * high;
  float e = 1.0 / uRes.y;
  vec3 pale = mix(mix(vec3(0.95, 0.965, 0.96), vec3(0.17, 0.26, 0.42), fdNight), vec3(1.0, 0.80, 0.54), fdGold);
  vec3 stone = mix(mix(vec3(0.50, 0.52, 0.53), vec3(0.09, 0.10, 0.135), fdNight), vec3(0.54, 0.41, 0.30), fdGold);
  vec3 lamp = mix(mix(vec3(1.0), vec3(0.60, 0.72, 0.96), fdNight), vec3(1.0, 0.86, 0.66), fdGold) * (1.0 + 0.2 * uCue + 0.08 * uLevel);
  vec3 rd = vec3(p.x, p.y - hy, FL);
  vec3 bg = fdBehind(rd.xy, pale, stone);
  float DEEP = 50.0 / sc;
  float dy = min(rd.y, -1e-3);
  float t1 = H / -dy;                                        // where the ray meets the board
  float z = t1 * FL;
  float onB = fdS(DEEP + 1.0, DEEP - 1.0, z);
  if (onB <= 0.0) return bg;
  mat2 gr = rot(0.32);
  vec3 ro = vec3(0.0, H, 0.0);
  vec2 dir = gr * rd.xz;                                     // in the board's own rows
  vec3 way = vec3(dir.x, dy, dir.y), ray = normalize(way);
  float t0 = max((H - 0.46) / -dy, t1 - 7.0 / length(dir));
  vec2 at = dir * t0, id = floor(at);
  vec2 stp = vec2(dir.x < 0.0 ? -1.0 : 1.0, dir.y < 0.0 ? -1.0 : 1.0), inv = 1.0 / max(abs(dir), 1e-4);
  vec2 tn = t0 + (stp * (id - at + 0.5) + 0.5) * inv;
  float px = z / FL * e;                                     // a pixel there, in plates
  float fz = 11.0 / sc;                                      // the rows in focus
  float blur = min(abs(z - fz) / z * 0.10 * (0.6 + 0.8 * uSpace), 0.14);
  vec3 L = normalize(vec3(-0.55, 0.62, -0.28));
  L.xz = gr * L.xz;
  vec3 acc = vec3(0.0);
  float left = 1.0;
  for (int i = 0; i < 9; i++) {
    vec2 c = id + 0.5, back = c * gr;                        // the middle of this plate, and where it is seen from us
    bool last = min(tn.x, tn.y) >= t1;
    vec2 u = vec2((back.y * sc - 4.0) / 46.0, 0.5 + back.x * sc / 34.0);
    vec4 m;
    float a = fdTurn(u, id, m), ca = cos(a), sa = sin(a);
    vec3 n = vec3(0.0, ca, sa), lie = vec3(0.0, -sa, ca);
    float sg = dot(ray, n) > 0.0 ? -1.0 : 1.0;
    float thin = max(0.10 - abs(dot(ray, n)), 0.0);          // a plate has a thickness: on edge it is still a line
    vec3 nt = n * sg - ray * thin;
    float t = dot(vec3(c.x, -H, c.y), nt) / min(dot(way, nt), -1e-3);
    vec3 q = way * t - vec3(c.x, -H, c.y);
    float d = fdForm(vec2(q.x, dot(q, lie))) - 0.44;
    float soft = max(px, 0.004) / max(abs(dot(ray, nt)), 0.12);
    float on = fdS(min(soft + blur, 0.07), -soft - blur, d);
    // below the board a plate shows only through its own well
    float above = fdS(-px, px, q.y);
    on *= last ? max(above, fdS(px + 0.02, -px - 0.02, length(way.xz * t1 - c) - 0.465)) : above;
    if (on > 0.0 && t > 0.0) {
      vec3 nn = n * sg;
      float lam = 0.5 + 0.5 * dot(nn, L);
      vec3 paint = sg > 0.0 ? fdOff : fdPaint(m);
      vec3 shade = paint * (0.28 + 0.86 * lam * lam) * lamp;
      // satin: the windows lie mirrored in it
      vec3 mir = reflect(ray, nn);
      mir.xz = mir.xz * gr;
      float f = 0.13 + 0.5 * pow(1.0 - sat(-dot(ray, nn)), 4.0);
      vec2 mp = mir.z > 0.15 ? mir.xy / mir.z * FL : vec2(0.0, 2.0);
      shade += (fdBehind(mp, pale, stone) - 0.45 * stone) * f * (0.5 + 0.5 * fdS(0.1, 0.4, mir.z));
      shade += lamp * 0.25 * pow(sat(dot(nn, normalize(L - ray))), mix(12.0, 40.0, uTone));
      shade *= 1.0 - 0.45 * fdS(0.1, -0.4, q.y);       // the half that dips into its well
      shade += lamp * 0.13 * fdS(0.03 + soft + blur, 0.0, abs(d + 0.02)) * lam * fdS(0.1, 0.3, abs(dot(ray, n)));
      shade += fdPaint(m) * 0.22 * uHits * fdRing(u);
      acc += left * on * shade; left *= 1.0 - on;
    }
    if (last || left < 0.02) break;
    if (tn.x < tn.y) { id.x += stp.x; tn.x += inv.x; } else { id.y += stp.y; tn.y += inv.y; }
  }
  if (left > 0.02) {
    // the board itself, the wells in it, and the pins of each axle
    vec2 f = fract(dir * t1) - 0.5;
    float far = length(f) - 0.465, s = px / max(-ray.y, 0.1) + 0.008 + blur;
    vec3 face = (fdField * 1.25 + 0.03) * lamp;
    vec2 to = dir / length(dir);
    face += pale * 0.10 * pow(1.0 - sat(-ray.y), 3.0);
    face += lamp * 0.14 * fdS(0.03 + s, 0.0, abs(far - 0.012)) * sat(0.4 + dot(f, to) * (1.0 - sat(blur * 10.0)));
    vec3 pit = mix(fdField * (0.3 + 0.8 * fdS(-0.1, 0.45, dot(f, to))), face, 0.35 * sat(blur * 8.0)) * lamp;
    acc += left * mix(face, pit, fdS(min(s, 0.035), -s, far));
    float pin = max(abs(f.y) - 0.03, 0.36 - abs(f.x));
    acc += left * (vec3(0.45) * lamp - acc) * 0.5 * fdS(s, -s, pin);
  }
  acc = mix(acc, mix(stone, pale, 0.3), 0.45 * fdS(0.35 * DEEP, DEEP, z));
  return mix(bg, acc, onB);
}
vec3 render(vec2 p) {
  fdSet();
  return uVar < 0.5 ? fdHall(p) : fdClose(p);
}
