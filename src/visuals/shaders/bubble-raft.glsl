// name: Bubble raft
// a: From above
// b: Low window
// what: Thousands of equal soap bubbles on pale water, seen from straight above: they pack into a few great grains, each a crystal with rows of its own, parted by crooked seams of open water, with a bubble missing here and there; or the same raft seen low toward a bright window, near bubbles as glass domes, far ones a silver sheet.
// follows: Where the piece sounds, the windows in the bubbles widen and their films take its colour. Each kind darkens or lightens its own grains. The spectrum, left to right, brightens the light the bubbles gather. The seams creep with the music. A hit makes one row slip by a bubble; a cue tilts the light and the grains flash in turn. Keys catch here and there.
// All lengths in the raft are counted in bubbles: one bubble is 1 across. A grain is a patch of one hexagonal lattice.
const float BR_ROW = 0.8660254;
float brCell, brPx, brHome, brFrom;              // the size of a grain and of a pixel, in bubbles; about which row one slips
vec2 brSlipId;                           // in which grain
vec2 brSite[3]; vec2 brId[3];           // the three grains nearest the pixel: their middles and their names
mat2 brTurn[3]; vec3 brWay[3];            // how each is turned, and the lines midway between 0 and 1, 0 and 2, 1 and 2
int brMost;                              // how many near bubbles to weigh by a seam
vec4 brSlip; int brSlipK;               // the row that slips: where its front is (along, up, in the grain's own turn), which row, how strong; and which of the three grains
// what brFind found: the nearest bubble's middle and size, how far off its rim (under 0 is inside), its grain, its own number, how near the slip
vec2 brMid; float brRad, brOff, brOwn, brGlint; int brGrain;
// Where the seams run: grains are parted by which middle is nearer, seen through a bent glass so that the seams are crooked.
vec2 brWave(vec2 x) { x = 2.0 * fract(x) - 1.0; return 4.0 * x * (abs(x) - 1.0); }                // near enough a sine, once round in 1
vec2 brBend(vec2 c) { return c + 1.1 * brWave(c.yx * 0.0493 + vec2(0.064, 0.318)) + 0.5 * brWave(c.yx * 0.1321 + vec2(0.493, 0.111)); }
float brAngle(vec2 id) { return fract(id.x * 0.382 + id.y * 0.236 + 0.17) * PI / 3.0; }
vec3 brMidway(vec2 a, vec2 b) { vec2 o = (a - b) / max(length(a - b), 1e-3); return vec3(o, dot(0.5 * (a + b), o)); }
void brGrains(vec2 w) {
  vec2 b = brBend(w), id0 = floor(b / brCell), creep = 3.4 * vec2(sin(uTravel * 0.013), cos(uTravel * 0.013));
  vec3 best = vec3(1e9);
  for (int j = 0; j < 9; j++) {
    vec2 id = id0 + vec2(j % 3, j / 3) - 1.0;
    vec2 h = hash22(id + 31.7);
    vec2 s = (id + 0.5 + 0.74 * (h - 0.5)) * brCell + vec2(dot(h - 0.5, creep), dot(h.yx - 0.5, vec2(creep.y, -creep.x)));   // the seams creep
    float d = dot(b - s, b - s);
    if (d < best.x) { best = vec3(d, best.xy); brSite[2] = brSite[1]; brId[2] = brId[1]; brSite[1] = brSite[0]; brId[1] = brId[0]; brSite[0] = s; brId[0] = id; }
    else if (d < best.y) { best = vec3(best.x, d, best.y); brSite[2] = brSite[1]; brId[2] = brId[1]; brSite[1] = s; brId[1] = id; }
    else if (d < best.z) { best.z = d; brSite[2] = s; brId[2] = id; }
  }
  // now and then another row is the one to slip; its light is dim while the choice changes
  float k13 = uTime / 13.0, turn = floor(mod(k13, 400.0)), ready = smoothstep(0.0, 0.04, fract(k13)) * (1.0 - smoothstep(0.97, 1.0, fract(k13)));
  brWay[0] = brMidway(brSite[0], brSite[1]); brWay[1] = brMidway(brSite[0], brSite[2]); brWay[2] = brMidway(brSite[1], brSite[2]);
  brSlipK = -1; brSlip = vec4(0.0);
  for (int k = 0; k < 3; k++) {
    brTurn[k] = rot(brAngle(brId[k]));
    if (brId[k] == brSlipId) {
      brSlipK = k;
      vec2 mid = (brSlipId + 0.5) * brCell * brTurn[k];
      brHome = floor(mid.y / BR_ROW);
      float row = brHome + floor(5.0 * hash11(turn + 3.0)) - 2.0;
      brSlip = vec4(mid.x + brFrom + 26.0 * (1.0 - uHits), row * BR_ROW, row, ready * uHits);
    }
  }
}
// How deep inside grain k a place is; b is the place as the seams see it.
float brDeep(int k, vec2 b) {
  vec3 d = vec3(dot(b, brWay[0].xy), dot(b, brWay[1].xy), dot(b, brWay[2].xy)) - vec3(brWay[0].z, brWay[1].z, brWay[2].z);
  return k == 0 ? min(d.x, d.y) : k == 1 ? min(-d.x, d.z) : min(-d.y, -d.z);
}
// The nearest whole bubble to w. A bubble belongs to the grain its middle is in, or it is left out.
void brFind(vec2 w) {
  brOff = 1e3; brRad = 0.5; brMid = w; brOwn = 0.5; brGlint = 0.0; brGrain = 0;
  vec2 bent = brBend(w);
  for (int k = 0; k < 3; k++) {
    float deep = brDeep(k, bent);
    if (deep < -1.1) continue;
    vec2 q = w * brTurn[k];
    float row0 = floor(q.y / BR_ROW);
    for (int j = 0; j < 4; j++) {
      if (j >= (deep > 1.35 ? 2 : brMost)) break; // by a seam the next nearest counts too
      float row = row0 + float(j & 1), shift = 0.5 * mod(row, 2.0);
      bool slips = k == brSlipK && row == brSlip.z;
      float x = q.x - shift - (slips ? (1.0 - smoothstep(-4.0, 4.0, q.x - brSlip.x)) : 0.0), col = floor(x + 0.5);
      if (j > 1) col += x > col ? 1.0 : -1.0;
      vec2 c = vec2(col + shift, row * BR_ROW);
      if (slips) c.x += (1.0 - smoothstep(-4.0, 4.0, c.x - brSlip.x));                        // behind the front the row has moved on by one bubble
      float own = k == brSlipK && abs(row - brHome) < 3.5 ? 0.5 : hash21(vec2(col, row) + brId[k] * 37.0 + 400.0);
      if (own < 0.005) continue;                                                     // a missing bubble
      vec2 m = brTurn[k] * c;
      float rad = deep > 1.5 ? 0.49 : 0.49 * smoothstep(0.25, 0.3, brDeep(k, brBend(m))), off = length(w - m) - rad;
      if (rad > 0.02 && off < brOff) {
        brOff = off; brMid = m; brRad = rad; brOwn = own; brGrain = k; brGlint = 0.0;
        if (k == brSlipK) {
          // the row gleams behind its front; about the front the raft is squeezed on one side and drawn apart on the other
          vec2 e = c - brSlip.xy;
          float trail = slips ? smoothstep(-24.0, 0.0, e.x) * (1.0 - smoothstep(-1.0, 2.0, e.x)) : 0.0;
          brGlint = brSlip.w * (trail + (slips ? 0.0 : 0.62 * exp(-0.045 * dot(e, e)) * clamp(e.y * 0.9, -0.8, 1.0)));
        }
      }
    }
    if (deep > 1.1) break;
  }
}
float brKind(vec2 id) { return mod(id.x + 2.0 * id.y, 4.0); }
// How a grain stands to the light: its rows lean with one kind of sound, and a cue passes over the grains in turn.
float brLean(vec2 id) {
  float k = brKind(id), s = k < 0.5 ? -uDrone : k < 1.5 ? uPad : k < 2.5 ? -uTexture : uPhrase;
  return 0.5 + 0.5 * cos(brAngle(id) * 6.0 + 1.1 + 0.45 * sin(uTime * 0.045) + 2.4 * uCue * (1.0 - uCue)) + 0.38 * s;
}
// A note on the keys catches in a few bubbles here and there.
float brKeyed() { return 0.6 * uKeys * step(0.88, brOwn); }
float brTurnOf(vec2 id) { float a = (1.0 - uCue) * 1.15 - fract(id.x * 0.29 + id.y * 0.53 + 0.1); return uCue * exp(-a * a * 30.0); }
vec3 brAbove(vec2 p) {
  const float S = 0.03;
  brCell = 19.0; brPx = 1.0 / (uRes.y * S);
  vec2 w = p / S + vec2(1.2 * sin(uTime * 0.011), 0.8 * sin(uTime * 0.014)) + vec2(9.0, 7.0);
  brSlipId = vec2(0.0); brFrom = -2.0; brMost = 4;
  brGrains(w);
  brFind(w);
  float asp = uRes.x / uRes.y;
  vec2 id = brId[brGrain];
  float lean = brLean(id), flash = brTurnOf(id);
  vec2 at = p + (brMid - w) * S;                                                   // the bubble's middle on the screen
  vec4 pc = piece(vec2(at.x / asp + 0.5, 0.5 - at.y));
  float play = sat(pc.a * (0.6 + 0.5 * uEnergy));
  vec2 L = normalize(vec2(-0.55, 0.83)), d = (w - brMid) / brRad;
  float t = length(d), aa = brPx * 1.3 / brRad;
  // the light falls from the window at the upper left and pales across the raft; a long low swell passes
  float far = dot(at, L), swell = sin(dot(at, vec2(4.3, -3.1)) + uTime * 0.13) + sin(dot(at, vec2(2.1, 5.7)) - uTime * 0.09);
  float fall = 0.5 + (0.38 + 0.16 * uSpace) * far + 0.03 * swell * (0.6 + uLow);
  float tone = mix(0.51, 0.9, lean) + 0.75 * (fall - 0.5) + 0.2 * flash;
  tone = max(min(tone, 0.72 + 0.35 * (tone - 0.72)), 0.2 + 0.58 * tone);
  // the water between
  vec3 water = vec3(0.9, 0.93, 0.95) * (0.46 + 0.46 * smoothstep(0.0, 0.36, brOff)) * (0.75 + 0.5 * fall);
  // the bubble: a clear floor, the thin dark ring where the film stands upright, a bright edge where films touch
  float n = sqrt(max(1.0 - t * t, 0.0));
  float thick = 1.6 * far + 0.5 * lean + 0.5 * t * t + 0.12 * brOwn + 0.06 * swell + 0.25 * uHigh;
  vec3 film = pal(thick, vec3(1.0), vec3(0.04, 0.03, 0.05), vec3(1.0), vec3(0.0, 0.33, 0.62));
  float body = tone * (0.97 + 0.06 * brOwn) * (1.0 - 0.14 * dot(d, L));
  vec3 c = body * vec3(0.97, 0.99, 1.0) * film;
  vec3 tint = pc.a > 0.01 ? pc.rgb / pc.a : vec3(0.5);
  tint = mix(vec3(dot(tint, vec3(0.3, 0.6, 0.1))), tint, 0.8);
  c = mix(c, (c * 0.9 + 0.1) * (0.35 + 1.25 * tint), play * 0.8);
  float fine = (1.0 - smoothstep(0.06, 0.32, brPx)), spark = brKeyed();
  float ring = fine * smoothstep(0.66, 0.86, t) * (1.0 - smoothstep(0.92, 1.04, t));
  c *= 1.0 - (0.5 + 0.16 * uTone) * ring;
  c += 0.3 * smoothstep(0.9, 1.0, t) * body;
  // light gathered at the far side of each bubble
  c += (0.3 * body + 0.05) * (1.0 - smoothstep(0.0, 0.16, abs(t - 0.68))) * smoothstep(0.1, 1.0, dot(d, -L) / max(t, 0.05)) * (1.0 + 0.6 * play + 1.4 * band(at.x / asp + 0.5) + 1.5 * uMic);
  // the window, bent in the dome
  float wide = 0.34 + 0.12 * play + 0.05 * uMid + 0.06 * max(brGlint, 0.0), wa = aa * 1.7;
  vec2 wq = 2.0 * n * d - vec2(-0.42, 0.56), we = abs(wq) - vec2(wide * 0.95, wide);
  float win = (1.0 - smoothstep(-wa, wa, max(we.x, we.y))) * (1.0 - smoothstep(0.71 - 0.5 * aa, 0.71 + 0.5 * aa, t));
  win *= 1.0 - 0.5 * (1.0 - smoothstep(0.0, 0.8 * wa + 0.03, min(abs(wq.x), abs(wq.y)))) * (1.0 - smoothstep(0.05, 0.17, aa));
  c = mix(c, vec3(1.0), win * fine * sat(0.78 + 0.2 * lean + 0.3 * play + 0.3 * flash + spark));
  c += (brGlint * (0.16 + 0.6 * uKind[4]) + 0.4 * spark) * (1.0 - t * 0.5);
  return mix(c, water, brOff > 10.0 ? 1.0 : smoothstep(-aa, aa, t - 1.0));
}
const float BR_SKY = 0.275, BR_HIGH = 3.5, BR_LENS = 1.45, BR_CAP = 0.72;   // the far edge on the screen, the eye's height, its lens, how high a dome stands
// The bright window ahead: two tall lights and a transom. a is a direction, across and up.
float brWindow(vec2 a, float soft, float grow) {
  vec2 q = 1.0 - smoothstep(-soft, soft, abs(a - vec2(0.2, 0.52)) - vec2(0.3, 0.44) * grow), m = abs(a - vec2(0.2, 0.3));
  float bar = 1.0 - smoothstep(0.016 - soft, 0.016 + soft, min(m.x, m.y));
  return q.x * q.y * (1.0 - bar * 0.02 / (0.02 + 0.4 * soft));
}
vec3 brWall(vec2 a, float soft) {
  float glow = exp(-1.7 * length((a - vec2(0.2, 0.25)) * vec2(1.0, 0.8)));
  vec3 c = mix(vec3(0.56, 0.585, 0.61), vec3(0.93, 0.93, 0.91), glow);
  return mix(c, vec3(0.97, 0.975, 0.965), brWindow(a, soft, 1.0));
}
// What one dome shows where the ray meets it. rd is the ray and hit the place met, in the dome's own measure; here is where the eye stands.
vec3 brDome(vec2 p, vec3 ray, vec3 rd, vec3 hit, vec2 here) {
  vec3 nrm = normalize(vec3(hit.xy, hit.z / BR_CAP)), r1 = reflect(ray, nrm);
  float face = sat(-dot(ray, nrm)), edge = 1.0 - face;
  vec2 rel = brMid - here;
  float away = max(rel.y, 0.5) / BR_LENS;
  vec2 on = vec2(rel.x, -BR_HIGH) / away;                                            // the dome's middle on the screen, from the far edge down
  vec4 pc = piece(vec2(on.x * uRes.y / uRes.x + 0.5, sat(-on.y / (BR_SKY + 0.5))));
  float play = sat(pc.a * (0.6 + 0.5 * uEnergy));
  vec3 tint = pc.a > 0.01 ? pc.rgb / pc.a : vec3(0.5);
  tint = mix(vec3(dot(tint, vec3(0.3, 0.6, 0.1))), tint, 0.8);
  vec2 id = brId[brGrain];
  float lean = brLean(id), tone = mix(0.68, 1.03, lean) + 0.06 * (0.4 + uLow) * sin(rel.y * 0.35 + rel.x * 0.2 + uTime * 0.13) + 0.25 * brTurnOf(id);
  // through the film to the water under it, and the far foot of the dome
  vec2 g = (hit.xy - rd.xy * hit.z / rd.z) / brRad;
  float gl = length(g);
  vec3 under = brWall(vec2(p.x + 0.05 * g.x, BR_SKY - p.y + 0.06 * g.y) / BR_LENS * 1.3, 0.16) * tone;
  vec3 c = under * (gl < 1.0 ? 0.86 - 0.1 * g.y : 1.0);
  c += 0.4 * tone * (1.0 - smoothstep(0.0, 0.5, abs(gl - 0.62))) * smoothstep(0.1, 1.0, -g.y / max(gl, 0.05)) * (1.0 + play + 0.9 * band(on.x * uRes.y / uRes.x + 0.5) + uMic);   // the light it gathers on the near side
  c *= 1.0 - 0.38 * (1.0 - smoothstep(0.0, 0.16, abs(gl - 0.97)));
  vec3 film = pal(1.3 * edge + 0.5 * hit.z + 0.15 * brOwn + lean * 0.6 + on.x + 0.25 * uHigh, vec3(1.0), vec3(0.06, 0.045, 0.065), vec3(1.0), vec3(0.0, 0.33, 0.62));
  c *= film;
  c = mix(c, (c * 0.9 + 0.1) * (0.35 + 1.25 * tint), play * 0.7);
  c *= 1.0 - (0.42 + 0.2 * uTone) * smoothstep(0.5, 0.95, edge) * (1.0 - smoothstep(0.9, 1.05, edge));
  // the room and the window in the outer skin
  float fres = 0.1 + 0.6 * edge * edge * edge;
  c = mix(c, vec3(0.8, 0.82, 0.83) * (0.6 + 0.4 * r1.z), fres * 0.8);
  if (r1.y > 0.02) c = mix(c, vec3(1.0, 0.995, 0.97), brWindow(r1.xz / r1.y * vec2(1.25, 1.0), 0.045 + 1.5 * brPx, 1.0 + 0.4 * play + 0.15 * uMid) * sat(0.6 + 0.3 * uTone + 0.3 * play + brKeyed()));
  return c + brGlint * (0.12 + 0.36 * uKind[4]) * (0.4 + edge);
}
vec3 brLow(vec2 p) {
  brCell = 13.0;
  float down = BR_SKY - p.y;
  vec3 wall = brWall(vec2(p.x, -down) / BR_LENS * 1.3, 0.05);
  if (down < 0.002) return wall;
  vec3 ray = normalize(vec3(p.x, BR_LENS, -down));
  float way = BR_HIGH / down, size = 1.0 / way;         // how far the surface is, and how large a bubble is on the screen there
  brPx = way / uRes.y;
  vec2 here = vec2(4.0, 3.0) + vec2(0.4 * sin(uTime * 0.011), 0.3 * sin(uTime * 0.014));
  vec2 foot = vec2(p.x, BR_LENS) * way + here;
  brSlipId = vec2(-1.0, 1.0); brFrom = 4.0; brMost = 2;
  brGrains(foot);
  // far off, the raft is one silver sheet cut by seams
  float deep = brDeep(0, brBend(foot)), blur = 0.3 + way * way / (uRes.y * BR_HIGH) * 2.0;
  vec3 sheet = brWall(vec2(p.x, down) / BR_LENS * 1.3, 0.14) * (mix(0.84, 1.06, mix(0.5, brLean(brId[0]), smoothstep(0.006, 0.02, size))) + 0.25 * brTurnOf(brId[0]));
  sheet *= 1.0 - 0.12 * (1.0 - smoothstep(0.0, 0.4 + blur, deep)) * smoothstep(0.006, 0.02, size);
  vec3 c = sheet;
  float near = smoothstep(0.022, 0.036, size);
  if (near > 0.0) {
    // walk down from the tops of the domes to the water; the first dome met lies over the rest
    c = vec3(0.0);
    float left = 1.0;
    vec2 last = vec2(1e3);
    for (int i = 0; i < 4; i++) {
      float z = 0.48 * BR_CAP * (1.0 - (float(i) + 0.35) / 4.0);
      vec2 at = foot - ray.xy / -ray.z * z;
      brFind(at);
      if (brOff > 0.7 || brMid == last) continue;
      last = brMid;
      vec3 rd = ray / vec3(1.0, 1.0, BR_CAP), o = vec3(at - brMid, z / BR_CAP);
      float A = dot(rd, rd), B = dot(o, rd), off = sqrt(max(dot(o, o) - B * B / A, 0.0));
      float hold = 1.0 - smoothstep(-brPx * 0.8, brPx * 0.8, off - brRad);
      if (hold <= 0.0) continue;
      vec3 hit = o - rd * (B + sqrt(A * max(brRad * brRad - off * off, 0.0))) / A;
      hold *= smoothstep(-brPx, brPx, hit.z);
      if (hold <= 0.0) continue;
      c += left * hold * brDome(p, ray, rd, hit, here);
      left *= 1.0 - hold;
      if (left < 0.02) break;
    }
    if (left > 0.01) {
      brMost = 4; brFind(foot);
      c += left * brWall(vec2(p.x, down) / BR_LENS * 1.3, 0.12) * (0.5 + 0.42 * smoothstep(0.0, 0.36, brOff));
    }
    c = mix(sheet, c, near);
  }
  c = mix(c, wall, 0.7 * uSpace * exp(-9.0 * down));                                    // the air between
  return mix(wall, c, smoothstep(0.002, 0.03, down));
}
vec3 render(vec2 p) { return uVar < 0.5 ? brAbove(p) : brLow(p); }
