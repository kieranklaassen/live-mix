// name: Folded stone
// a: Lantern
// b: Crystal city
// what: A block of stone folded and pierced over and over until it is lace, turning slowly in the dark with a light burning inside it.
// follows: The tone dial and the place in the loop change the angle of the fold, the level feeds the light inside, the spectrum lights the windows, a hit sends a shell of light out from the middle.
// own: 0 1 the folds turn one way and the block opens into rings of its own pieces, -1 far the other way into knotted reefs; 1 1 fewer pieces and every one worn round, -1 folded only twice, great plain blocks; 2 1 cut to a ball (b: a round shaft bored through the streets), -1 drawn up into a tower (b: the roofs cut away, hills of stone under an open sky); 3 the light: 1 day on pale ground under a sky in the colour of the hits, -1 no light within and a great pale disc behind; 4 1 it stands in still water, -1 snow or sand lies on every ledge and the ground; 5 1 every window lit, -1 bare stone in layers in the colours of drone, pad and texture; 6 1 the pieces come apart and float, -1 they swell together with small holes; 7 the eye: 1 low and close, looking up, -1 from high above, looking down
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
mat2 gR1, gR2;
float gTrap; // how near the folds came to an edge: the lit seams
// the numbers of its own by name: how many folds and how much of the last, how much each enlarges, how round, the cuts
const float FSFOLDS = 4.0 + uOwn[1] * (uOwn[1] > 0.0 ? -1.6 : 2.0), FSLAST = FSFOLDS - ceil(FSFOLDS) + 1.0;
const int FSDEEP = int(ceil(FSFOLDS));
const float FSROUND = 0.9 * max(uOwn[1], 0.0), FSBIG = 3.0 + uOwn[6] * (uOwn[6] > 0.0 ? 0.8 : 0.5);
const float FSBALL = uOwn[2] > 0.0 ? 1.74 - 0.62 * uOwn[2] : 9.0, FSBORE = uOwn[2] > 0.0 ? 0.86 * uOwn[2] : -9.0, FSROOF = uOwn[2] < 0.0 ? 2.0 + 2.12 * uOwn[2] : 99.0;
const float FSDAY = max(uOwn[3], 0.0), FSMOON = max(-uOwn[3], 0.0), FSWET = max(uOwn[4], 0.0), FSSNOW = max(-uOwn[4], 0.0), FSBARE = max(-uOwn[5], 0.0), FSLIT = max(uOwn[5], 0.0);
const vec3 FSDRAW = vec3(1.0) + vec3(-0.44, 0.32, -0.44) * max(-uOwn[2], 0.0);
const bool FSOTHER = FSBARE > 0.0 || FSDAY > 0.0 || FSSNOW > 0.0;
vec3 fsSky, fsCore;
const vec3 FSSUN = vec3(-0.57, 0.68, 0.46);

float fsBox(vec3 p, float s) {
  vec3 b = abs(p) - (1.0 - FSROUND);
  return (length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) - FSROUND) / s;
}
float fsHill(float x) { x = abs(fract(x) - 0.5) * 2.0; return x * x * (3.0 - 2.0 * x); }
// Fold into one corner, turn a little, treble, pierce: four times over. What is left is a box.
// a is one block; b repeats it without end, so its holes join into streets.
float mapd(vec3 p) {
  vec3 w = p;
  if (uVar > 0.5) p = mod(p + 1.0, 2.0) - 1.0;
  else if (uOwn[2] < 0.0) p /= FSDRAW;
  vec3 was = p;
  float s = 1.0, wasS = 1.0, d;
  gTrap = 9.0;
  for (int i = 0; i < FSDEEP; i++) {
    if (FSLAST < 1.0) { was = p; wasS = s; }
    p = abs(p);
    if (p.x < p.y) p.xy = p.yx;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    p.xy = gR1 * p.xy;
    p.yz = gR2 * p.yz;
    p = p * FSBIG - (FSBIG - 1.0);
    if (p.z < -0.5 * (FSBIG - 1.0)) p.z += FSBIG - 1.0;
    s *= FSBIG;
    gTrap = min(gTrap, abs(abs(p.x) - 1.0) + abs(abs(p.y) - 1.0));
  }
  if (FSROUND > 0.0 || FSLAST < 1.0) d = fsBox(p, s);
  else {
    vec3 b = abs(p) - 1.0;
    d = (length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0)) / s;
  }
  if (FSLAST < 1.0) d = mix(fsBox(was, wasS), d, FSLAST);
  if (uOwn[2] > 0.0) d = max(d, uVar > 0.5 ? FSBORE - length(w.xy) : length(w) - FSBALL);
  if (uOwn[2] < 0.0) {
    if (uVar > 0.5) d = max(d, 0.75 * (w.y - FSROOF - 0.5 * fsHill(w.x * 0.21 + 0.3) * fsHill(w.z * 0.17) - 0.2 * fsHill(w.x * 0.4 + w.z * 0.31)));
    else d *= FSDRAW.x;
  }
  return d;
}
vec3 normalAt(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0) * e;
  vec3 n = k.xyy * mapd(p + k.xyy) + k.yyx * mapd(p + k.yyx) + k.yxy * mapd(p + k.yxy) + k.xxx * mapd(p + k.xxx);
  return dot(n, n) > 0.0 ? normalize(n) : vec3(0.0, 1.0, 0.0);
}
// Windows on a wall: a grid of small panes, some lit, each in the colour of a kind of sound and as bright as its band.
vec3 windows(vec3 pos, vec3 n, float size) {
  vec3 an = abs(n);
  vec2 uv = an.x > an.y && an.x > an.z ? pos.yz : an.y > an.z ? pos.xz : pos.xy;
  uv *= size;
  vec2 id = floor(uv), f = fract(uv) - 0.5;
  float h = hash21(id + 3.7), h2 = hash21(id * 1.7 + 11.0);
  float pane = smoothstep(0.34, 0.26, abs(f.x)) * smoothstep(0.4, 0.32, abs(f.y));
  float on = smoothstep(0.0, 0.06, 0.16 + 0.3 * uLevel + 0.9 * FSLIT - h);
  // which band a window follows goes by where it is: the city lights up district by district
  float zone = fract(floor(dot(pos, vec3(0.6, 0.9, 1.5))) / 8.0 + 0.16 * h2);
  float lv = band(zone);
  return rich(kindColour(zone * 4.0), 1.8) * pane * on * (0.04 + 2.4 * lv * lv + 0.4 * FSLIT) * (0.5 + 0.5 * h2) * (1.0 - FSBARE) * (FSSNOW > 0.0 ? 1.0 - FSSNOW * smoothstep(0.2, 0.6, n.y) : 1.0);
}
// The stone itself where it is seen: layers in the colours of drone, pad and texture, each a little brighter with its band.
float fsLine(float y) { float i = floor(y), f = y - i; return mix(fract(sin(i * 12.99) * 437.5), fract(sin(i * 12.99 + 12.99) * 437.5), f * f * (3.0 - 2.0 * f)); }
vec3 stone(vec3 pos, float grain) {
  float y = pos.y * 3.2 + 0.45 + 0.28 * sin(pos.x * 2.3 + 1.3 * sin(pos.z * 1.9)) + 0.17 * sin(pos.z * 4.1 + pos.x * 1.7);
  vec3 c = mix(mix(uKind[0], uKind[1], smoothstep(0.3, 0.7, fsLine(y * 1.7))), uKind[2], smoothstep(0.66, 0.78, fsLine(y * 4.1 + 40.0)));
  return c * c * (0.78 + 0.4 * grain) * (0.8 + 0.9 * band(fract(y * 0.13 + 8.0)));
}
vec3 fsAir(vec3 rd) {  // the sky of the day
  return fsSky * mix(1.5, 1.0, sat(rd.y * 0.5 + 0.5)) * (0.85 + 0.3 * uLevel);
}
vec3 fsDisc(vec2 p) {  // the great disc behind
  float r = length(p - vec2(0.0, 0.03));
  return fsSky * (0.8 + 0.5 * uLevel) * (smoothstep(0.585, 0.57, r) * 1.35 * (0.8 + 0.22 * fbm(p * 5.0 + 3.0) + 0.3 * band(r * 1.6) + uHits * exp(-120.0 * (r - 0.6 + 0.5 * uHits) * (r - 0.6 + 0.5 * uHits))) + 0.28 * exp(-max(r - 0.57, 0.0) * 4.5)) * FSMOON
    + (uKind[0] * uDrone + uKind[1] * uPad) * 0.35 * FSMOON * exp(-max(r - 0.57, 0.0) * 2.5) * smoothstep(0.57, 0.59, r);
}
// The ground about the block, at a place of it.
vec3 fsGround(vec3 at, vec3 back, float power, float sh) {
  float grain = noise(at.xz * 18.0), r2 = dot(at.xz, at.xz), far = smoothstep(2.0, 9.0, length(at.xz));
  vec3 c = FSSNOW * (uKind[1] * uKind[1] * (0.02 + FSMOON * 0.12) + fsCore * mix(vec3(1.0), uKind[1], 0.6) * power * 0.55 / (0.5 + r2 * r2 * 0.35) * (0.8 + 0.4 * grain) * (1.0 - FSMOON));
  float foot = smoothstep(0.0, 0.5, length(max(abs(at.xz) - FSDRAW.xz * 0.9, 0.0)));
  vec3 g = mix(fsSky, fsSky * mix(vec3(1.0), uKind[1] * 1.6, 0.4), FSSNOW) * (0.5 + 0.85 * sh) * (0.72 + 0.28 * foot) * (0.97 + 0.06 * grain) * (0.85 + 0.3 * uLevel);
  c = mix(c, g, FSDAY);
  return mix(c, back, far * max(FSDAY, 0.6));
}
// The stone in another light or another stuff than the plain one. side: how far a side lamp lights it; warm: the light within.
vec3 fsStuff(vec3 col, vec3 pos, vec3 n, float ao, float sun, float side, float warm, vec3 lamp) {
  float grain = noise(pos.xy * vec2(26.0, 29.0) + pos.z * 23.0);
  vec3 own = stone(pos, grain), snow = mix(vec3(0.9), uKind[1] * 1.15, 0.45);
  col = mix(col, own * ((0.05 + 0.75 * side * side) * ao * (0.5 + 0.7 * uLevel) * (1.0 - 0.75 * FSMOON) + lamp * warm), max(FSBARE, FSDAY));
  float lies = FSSNOW * smoothstep(0.25, 0.7, n.y + 0.3 * (grain - 0.5));
  own = mix(own, snow, lies);
  col = mix(col, snow * (0.08 + 0.34 * ao * (0.6 + uLevel) * (1.0 - 0.6 * FSMOON)) + warm * lamp, lies * (1.0 - FSDAY));
  return mix(col, own * (vec3(2.6, 2.4, 2.1) * sun * (0.72 + 0.5 * uLevel) + fsSky * (0.55 + 0.45 * n.y) * 0.9 * ao + 0.12), FSDAY);
}

vec3 render(vec2 p) {
  bool isCity = uVar > 0.5, wall = !isCity;
  fsSky = mix(vec3(1.0), uKind[4] * uKind[4] * 1.25 + 0.04, 0.8);
  float fsFloor = isCity ? -0.14 : -FSDRAW.y - 0.12 * max(uOwn[2], 0.0) + 0.55 * FSWET;
  float ang = isCity ? 0.02 + 0.06 * uTone + 0.015 * sin(uLoop * TAU) : 0.015 + 0.07 * uTone + 0.02 * sin(uLoop * TAU);
  ang += uOwn[0] * (uOwn[0] > 0.0 ? 0.24 : 0.62);
  gR1 = rot(ang); gR2 = rot((isCity ? 0.03 : 0.035) * cos(uLoop * TAU) + uOwn[0] * (uOwn[0] > 0.0 ? 0.3 : -0.5));
  fsCore = mix(mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.78, 0.5), uTone), uKind[3] * 1.1, abs(uOwn[5]));
  vec3 core = fsCore, endCol = mix(mix(vec3(0.45, 0.65, 1.0), vec3(1.0, 0.75, 0.55), uTone), uKind[3], abs(uOwn[5]));
  bool floored = FSWET > 0.0 || (wall && (FSDAY > 0.0 || FSSNOW > 0.0));
  float power = 0.3 + 1.5 * uLevel + 0.5 * uLow;
  // where the eye is
  vec3 ro, fw; vec2 pr = p; float lens = 1.45;
  if (wall) {
    float a = uTime * 0.07 + uTravel * 0.04;
    ro = vec3(sin(a) * 3.3, 1.3 + 0.5 * sin(a * 0.43), cos(a) * 3.3);
    if (uOwn[7] < 0.0) ro = mix(ro, vec3(sin(a) * 0.5, 3.6, cos(a) * 0.5), -uOwn[7]);
    if (uOwn[7] > 0.0) ro = mix(ro, vec3(sin(a) * 2.9, fsFloor + 0.35, cos(a) * 2.9), uOwn[7]);
    fw = normalize(vec3(0.0, 0.15 * max(uOwn[7], 0.0), 0.0) - ro);
  } else {
    float z = uTravel * 0.3;
    const float open = max(-uOwn[2], 0.0), tilt = uOwn[7] * (uOwn[7] > 0.0 ? 0.95 : 1.15) - 0.28 * open;
    ro = vec3(0.1 * sin(z * 0.7), 0.06 * sin(z * 0.9 + 1.0) + 0.9 * open, z);
    fw = normalize(vec3(0.3 * sin(uTime * 0.06), 0.16 * sin(uTime * 0.045 + 2.0), 1.0));
    if (tilt != 0.0) fw.yz = rot(tilt) * fw.yz;
    pr = rot(0.15 * sin(uTime * 0.04)) * p;
    lens = 0.62;
  }
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * lens + rt * pr.x + up * pr.y);
  vec3 all = vec3(0.0), through = vec3(1.0), disc = vec3(0.0);
  if (FSMOON > 0.0 && wall) disc = fsDisc(p);
  for (int look = 0; look < (FSWET > 0.0 ? 2 : 1); look++) {     // once, and once more for what still water mirrors
    float tf = floored && rd.y < -1e-3 ? (fsFloor - ro.y) / rd.y : 1e5;
    float t = 0.01, tmax = 9.0, d = 1.0, glow = 0.0, steps = 0.0;
    bool hit = false, there = true;
    if (wall) {
      float bq = dot(ro, rd), dq = bq * bq - dot(ro, ro) + 3.4 + 0.5 * max(-uOwn[2], 0.0);
      there = dq >= 0.0;
      t = max(-bq - sqrt(max(dq, 0.0)), 0.0); tmax = -bq + sqrt(max(dq, 0.0));
      if (tmax < 0.0) there = false;
    } else tmax = look > 0 ? 6.0 : 9.0 - 1.5 * FSDAY;
    tmax = min(tmax, tf);
    int lim = !there ? 0 : look > 0 ? 46 : isCity ? (FSDAY > 0.0 ? (uOwn[2] < 0.0 ? 50 : 36) : 72) : 64;
    for (int i = 0; i < lim && wall; i++) {
      vec3 q = ro + rd * t;
      d = mapd(q);
      if (d < 0.0015 * t) { hit = true; break; }
      if (t > tmax) break;
      float stp = d * 0.92;
      glow += stp * exp(-dot(q, q) * 5.0);   // the light in the middle, seen through the holes
      t += stp; steps += 1.0;
    }
    for (int i = 0; i < lim && isCity; i++) {
      d = mapd(ro + rd * t);
      if (d < 0.001 * (1.0 + t * 3.0)) { hit = true; break; }
      if (t > tmax) break;
      t += d * 0.92; steps += 1.0;
    }
    if (hit && t > tf) hit = false;
    float toEnd = sat(rd.z);
    vec3 back = disc;
    if (FSMOON > 0.0 && isCity) back = fsSky * FSMOON * (0.06 + 0.55 * pow(toEnd, 5.0) + 0.6 * smoothstep(0.955, 0.962, toEnd) * (hit && uOwn[2] < 0.0 ? 0.0 : 1.0)) * (0.75 + 0.5 * uLevel) * (1.0 + 0.9 * uHits);
    if (FSDAY > 0.0) back = mix(back, fsAir(rd) * (isCity ? 0.75 + 0.35 * smoothstep(0.6, 1.0, toEnd) : 1.0), FSDAY);
    bool ground = floored && !hit && tf < (isCity ? 9.0 : 1e4);
    if (ground) t = tf;
    vec3 pos = ro + rd * t, n = vec3(0.0, 1.0, 0.0), col = vec3(0.0);
    float seam = 0.0, sun = 0.0;
    if (hit) {
      n = normalAt(pos, isCity ? 0.0012 * (1.0 + t) : 0.0025);
      mapd(pos); seam = exp(-gTrap * (isCity ? 9.0 : 7.0));
    }
    if (FSDAY > 0.0 && (hit || ground)) {        // 0 in the shadow of the stone, 1 in the open
      sun = sat(dot(n, FSSUN));
      float st = 0.03, s = 1.0;
      vec3 from = pos + n * 0.012;
      for (int i = 0; i < (isCity && uOwn[2] >= 0.0 ? 3 : 7) && sun > 0.0; i++) {
        float sd = mapd(from + FSSUN * st);
        s = min(s, 14.0 * sd / st);
        if (s < 0.02) break;
        st += clamp(sd, 0.03, 0.4);
      }
      sun *= smoothstep(0.0, 1.0, sat(s));
    }
    if (hit && wall) {
      float ao = exp(-steps * 0.03), fres = pow(1.0 - sat(dot(n, -rd)), 3.0), r = length(pos);
      float inward = sat(dot(n, -pos / max(r, 1e-4)));
      float shell = exp(-pow((r - 0.2 - (1.0 - uHits) * 1.7) * 5.0, 2.0)) * uHits + exp(-pow((r - 0.2 - (1.0 - uCue) * 1.9) * 3.5, 2.0)) * uCue;
      float heat = inward * power * 0.8 / (0.15 + r * r * r) * ao * (1.0 - FSMOON);        // lit from inside
      col = mix(vec3(0.9, 0.16, 0.04), core, sat(heat * 0.7)) * heat * 0.75;
      col += vec3(0.12, 0.26, 0.7) * (0.006 + 0.05 * sat(dot(n, normalize(vec3(-0.5, 0.8, 0.2))))) * ao; // a cold light outside
      col += vec3(0.2, 0.4, 1.0) * fres * 0.05;
      if (FSOTHER) col = fsStuff(col, pos, n, ao, sun, sat(dot(n, normalize(vec3(-0.75, 0.45, 0.5)))), heat * 0.8, mix(vec3(1.0), core, 0.6));
      if (FSBARE < 1.0) col += windows(pos, n, 13.5) * ao * 0.8;
      col += core * seam * (0.03 + 0.25 * uHigh) * ao;
      col += (core + vec3(0.4, 0.3, 0.3)) * shell * (0.04 + 1.6 * seam + 0.7 * inward);
    }
    if (hit && isCity) {
      float ao = exp(-steps * 0.035), fres = pow(1.0 - sat(dot(n, -rd)), 3.0);
      float shell = exp(-pow((t - 0.3 - (1.0 - uHits) * 5.0) * 3.5, 2.0)) * uHits + exp(-pow((t - 0.3 - (1.0 - uCue) * 7.0) * 2.5, 2.0)) * uCue;
      vec3 l = normalize(vec3(0.0, 0.25, 1.0));     // the light at the end of the street
      float dif = sat(n.y) * 0.5 + 0.5 * sat(-n.z), wave = 0.5 + 0.5 * sin(pos.z * 0.8 + pos.y * 2.0);
      vec3 ice = mix(vec3(0.12, 0.3, 0.75), vec3(0.5, 0.35, 0.95), wave);
      if (FSBARE > 0.0) ice = mix(ice, mix(uKind[0], uKind[1], wave), FSBARE);
      float streak = pow(sat(dot(reflect(rd, n), l)), 6.0);
      col = ice * (0.004 + 0.04 * dif) * ao * (0.35 + 1.0 * uLevel);
      col += ice * fres * 0.04 * ao * (0.4 + uLevel);
      col += mix(endCol, ice, 0.5) * streak * 0.16 * ao * (0.3 + uLevel);
      if (FSOTHER) col = fsStuff(col, pos, n, ao, sun, 0.35 + 0.65 * sat(dot(n, normalize(vec3(-0.6, 0.6, -0.5)))), streak * 0.5 * ao * (1.0 - FSDAY), endCol);
      if (FSBARE < 1.0) col += windows(pos, n, 27.0) * ao * 1.5 / (1.0 + t * t * 0.5 * (1.0 - 0.85 * max(-uOwn[2], 0.0)));
      col += ice * seam * (0.05 + 0.4 * uHigh) * ao;
      col += mix(vec3(0.75, 0.85, 1.0), uKind[4], FSBARE) * shell * (0.02 + 0.8 * seam + 0.2 * fres) * (1.0 + 3.0 * max(-uOwn[2], 0.0));
    }
    float veil = 1.0;
    vec3 air = vec3(0.0);
    if (wall) {
      if (!hit) col = back;
      if (FSDAY > 0.0 || FSWET > 0.0 || FSSNOW > 0.0) if (ground) col = mix(back, fsGround(pos, back, power, sun / 0.68), max(FSDAY, max(FSWET, FSSNOW)));
      if (FSMOON < 1.0) air = core * glow * power * 1.6 * (1.0 - FSMOON) * (1.0 - 0.8 * FSDAY);
    }
    if (isCity) {
      veil = exp(-t * (0.36 - 0.12 * FSDAY));
      if (ground) col = uKind[0] * uKind[0] * (0.02 + 0.3 * FSDAY);
      col *= veil;
      if (FSMOON > 0.0 || FSDAY > 0.0) col += back * (hit || ground ? 1.0 - veil : 1.0);
      if (FSDAY < 1.0) col += endCol * (0.3 + 1.0 * uLevel) * (1.0 - exp(-t * 0.3)) * (pow(toEnd, 1500.0) * 2.0 + pow(toEnd, 80.0) * 0.14) * (1.0 - FSDAY);
    }
    if (FSWET == 0.0) { all = col + air; break; }
    bool mirrors = ground && look == 0;
    all += through * (col * (mirrors ? 1.0 - FSWET * (isCity ? 0.5 * veil : 1.0) : 1.0) + air);
    if (!mirrors) break;
    float edge = 0.5 + 0.5 * pow(1.0 - sat(-rd.y), 2.0);
    through *= FSWET * edge * veil * mix(vec3(0.85), mix(uKind[0], vec3(1.0), 0.5), 0.5);
    vec2 rip = 0.3 * vec2(sin(pos.x * 23.0 + 3.0 * sin(pos.z * 11.0 + uTime * 0.5) - uTime * 0.7), sin(pos.z * 27.0 + 3.0 * sin(pos.x * 9.0 - uTime * 0.4) + uTime * 0.6));
    ro = pos + vec3(0.0, 0.004, 0.0); rd.y = -rd.y; rd.xz += 0.05 * rip; rd = normalize(rd);
  }
  return screenOf(all);
}
