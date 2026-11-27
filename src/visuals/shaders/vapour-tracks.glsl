// name: Threads in vapour
// a: Cloud box
// b: Plate of curls
// what: A low look across the black velvet floor of a glass box full of mist, lit by a slit lamp from the right, where white trails condense, thicken and sink; or a pale photographic plate crossed by a sheaf of beaded lines, with one fork whose two threads curl into tightening spirals.
// follows: Each band shoots its own direction or line; the piece places the fat trails, or stains and darkens the beads; the phrase draws the curls, texture the crooked threads; the drone thickens the mist or clouds the plate, the pad widens trails; a hit is a fork, a cue bends the curls the other way, keys add beads.
// own: 0 no field, threads straight or very wide at -1, strong bends and small tight coils at 1; 1 an ember-lit floor or a black plate with white threads at -1, pale morning or a blue plate at 1; 2 seen from above, or the whole plate on its dark bench, at -1, low down in the mist, or close under a lens, at 1; 3 a lone few at -1, crowded at 1; 4 all one way at -1, all from one point at 1; 5 sharp thin new wire at -1, old drifting smoke or swollen soft beads at 1.
const float vtF = 1.35;
float vtH, vtHz;             // how high the eye is over the floor, and where the horizon is
float vtPx, vtSoft;          // a pixel, how soft what is out of focus is
vec2 vtPuff;                 // the mist's own unevenness here, fine and broad
// Where a point of the box (across, up, away) is on the picture.
vec2 vtAt(vec3 w) { return vec2(vtF * w.x, vtF * (w.y - vtH)) / w.z + vec2(0.0, vtHz); }
float vtZig(float x) { x = abs(fract(x) - 0.5) * 2.0; return x * x * (3.0 - 2.0 * x); }
// What is left of a trail as it breaks into puffs.
float vtGaps(float run, float old, float puff) {
  float loose = 0.3 * max(uOwn[5], 0.0);
  return smoothstep(0.7 * old - 0.3 - loose, 0.7 * old + 0.45 + 0.5 * loose, 0.2 * vtZig(run) + 0.8 * puff);
}
// One trail from A to B: how much mist it has gathered at this place. It grows from A, is old from 0 to 1, and its width is in the box's own measure.
float vtTrail(vec2 p, vec3 A, vec3 B, float wide, float grown, float old, float seed, float bend) {
  float ia = 1.0 / A.z, ib = 1.0 / B.z;
  vec2 a = vtF * vec2(A.x, A.y - vtH) * ia + vec2(0.0, vtHz), ab = vtF * vec2(B.x, B.y - vtH) * ib + vec2(0.0, vtHz) - a;
  float il = inversesqrt(dot(ab, ab) + 1e-8);
  vec2 along = ab * il, q = p - a;
  float f = dot(q, along), s = sat(f * il), iz = mix(ia, ib, s), zoom = vtF * iz;
  float d = dot(q, vec2(-along.y, along.x)), side = along.x < 0.0 ? -1.0 : 1.0;
  float u = s * ib / iz, run = u * (3.0 + 5.0 * s / il) + seed;
  d -= zoom * bend * 4.0 * u * (1.0 - u);
  float past = f - s / il, size = zoom * wide * (0.35 + 1.3 * old), puff = mix(vtPuff.x, vtPuff.y, smoothstep(0.003, 0.012, size));
  // fine and sharp when it is new, thick and hanging below itself when it is old
  float w = size * (0.6 + 0.8 * puff) * (1.0 + 1.6 * old * sat(0.5 - 0.6 * d * side / size));
  float blur = vtSoft * abs(iz - 0.6) + 0.6 * vtPx, ww = w * w, all = ww + blur * blur;
  float thread = all / (all + d * d + past * past);
  thread = (1.4 * thread * thread * thread + 0.05 * thread) * w * inversesqrt(all);
  return thread * vtGaps(run, old, puff) * (1.0 - smoothstep(grown - 0.12, grown, u)) * smoothstep(0.0, 0.14, u + 0.02);
}
// A spiral that tightens inward from radius R at angle `from`, seen from its middle. Gives the distance across it and how far along it is.
vec2 vtCoil(vec2 q, float R, float from, float tight, float turns) {
  float r = length(q) + 1e-5, a = r > 2e-5 ? atan(q.y, q.x) - from : 0.0;
  float lg = log(R / r) / tight;                      // the turning at which the spiral passes this radius
  float th = a + TAU * floor((lg - a) / TAU + 0.5);
  th = clamp(th, a - TAU * floor(a / TAU), a - TAU * floor(a / TAU) + TAU * turns);
  float rr = R * exp(-tight * th);
  return vec2(r - rr, R * (1.0 - exp(-tight * th)) / tight);
}
// Two places a hit can happen at, each for some seconds and then elsewhere: the place, and the share of the hit that is there now.
vec3 vtPlace(int s) {
  float beat = mod(uTime, 8192.0) / 16.0 + float(s) * 0.5;
  return vec3(hash22(vec2(floor(beat) + 0.37, 5.3 + float(s))), smoothstep(0.02, 0.06, fract(beat)) * (1.0 - smoothstep(0.54, 0.58, fract(beat))));
}
vec3 vtA; vec2 vtRnd, vtJit; float vtOld, vtFade, vtDrift;
// An event begins, at a place of its own each time: where it is, and how old.
void vtBegin(float k, float span) {
  float own = fract(k * 0.618 + 0.31), beat = uTime / span + own * 13.0, n = mod(floor(beat), 911.0);
  vtOld = fract(beat);
  vtRnd = hash22(vec2(k * 1.7 + 0.3, n + 0.7)); vtJit = fract(vtRnd.yx * vec2(37.3, 91.7));
  float z = 0.95 - 0.4 * max(uOwn[2], 0.0) + 2.3 * vtRnd.y * vtRnd.y;
  vtA = vec3((vtRnd.x - 0.5) * 1.5 * z + vtDrift, 0.03 + 0.09 * vtJit.x - 0.075 * vtOld * vtOld, z);
  vtFade = smoothstep(0.0, 0.1, 1.04 + min(uOwn[3], 0.0) - fract(k * 0.618)) * (1.0 - smoothstep(0.35 + 0.4 * max(uOwn[3], 0.0), 0.97, vtOld)) * (0.45 + 0.75 * (1.0 - vtOld) * (1.0 - vtOld) * (1.0 - vtOld));
}
// And it flies: how much mist its trail has gathered here.
float vtFly(vec2 p, vec2 dir, float len, float wide, float span, float bend) {
  float one = max(uOwn[4], 0.0), soft = uOwn[5];
  dir = mix(dir, vec2(dir.x * dir.x - dir.y * dir.y, 2.0 * dir.x * dir.y), one);
  dir = mix(dir, vec2(1.0, 0.13 + 0.16 * (vtJit.y - 0.5)), max(-uOwn[4], 0.0));
  dir *= inversesqrt(dot(dir, dir) + 1e-6);
  vec3 A = vec3(mix(vtA.xz, vec2(-0.22 + vtDrift, 1.5) + 0.05 * dir, one), vtA.y).xzy;
  vec3 B = A + vec3(dir.x * len, 0.05 * (vtJit.x - 0.5), dir.y * len);
  B.z = max(B.z, 0.5);
  return vtFade * vtTrail(p, A, B, wide, vtOld * span * 5.5 + 0.02, sat(vtOld + 0.3 * soft), vtRnd.x * 40.0, bend * len * (vtJit.y - 0.5));
}
vec3 vtCloud(vec2 p) {
  float field = uOwn[0], tone = uOwn[1], eye = uOwn[2], many = uOwn[3], src = uOwn[4], soft = uOwn[5];
  float up = max(-eye, 0.0), down = max(eye, 0.0), one = max(src, 0.0), rich = max(many, 0.0), t = 3600.0 - abs(mod(uTime, 7200.0) - 3600.0);
  vtH = 0.46 + 1.0 * up - 0.24 * down; vtHz = 0.24 + 0.8 * up - 0.14 * down;
  vtSoft = (0.006 + 0.004 * uSpace) * (1.0 + 1.0 * max(soft, 0.0));
  float right = 0.5 * uRes.x / uRes.y, across = max(right - p.x, 0.0) / max(right, 0.4);
  float lamp = 0.2 + 1.5 * exp(-across * 1.9);
  // the mist lies on the floor and thins upward: what the eye gathers of it before it meets the floor or the two panes of glass behind
  float m = p.x / vtF, el = (vtHz - p.y) / vtF;
  float wallA = 3.6 / max(1.0 + 0.12 * m, 0.3), wallB = 2.2 / max(0.35 - m, 0.05), wall = min(wallA, wallB);
  float far = el > vtH / wall ? vtH / el : wall;
  vec2 g = vec2(m * far, far);
  float roll = noise(vec2(g.x * 1.5 - t * 0.05, g.y * 1.5 + t * 0.03)), fine = noise(vec2(p.x * 7.0 + t * 0.07 + roll * 2.0, p.y * 20.0 - t * 0.05));
  vtPuff.x = noise(vec2(p.x * 52.0 + p.y * 31.0, p.y * 52.0 - p.x * 31.0 - t * 0.14) + roll * 4.0);
  vtPuff.y = 0.62 * noise(vec2(p.x * 19.0 - p.y * 9.0, p.y * 19.0 + p.x * 9.0 + t * 0.06) + vtPuff.x * 0.5) + 0.26 * vtPuff.x + 0.06;
  float thick = (0.036 + 0.035 * uDrone + 0.02 * uMic + 0.02 * max(soft, 0.0)) * (0.55 + 0.9 * roll);
  float dip = abs(el) < 0.004 ? 0.004 : el;
  float path = thick * (exp(-max(vtH - dip * far, 0.0) / thick) - exp(-vtH / thick)) / dip;
  float mist = pow(max(path, 0.0), 1.6) * 1.05 * (0.1 + 1.15 * roll * roll + 1.1 * fine * fine * roll) * (1.0 + 0.4 * uDrone + 0.3 * uLevel);
  vec3 cool = mix(vec3(0.6, 0.74, 0.92), vec3(1.0, 0.96, 0.9), sat(lamp - 0.3));
  cool = mix(cool, vec3(1.0, 0.52, 0.22) * (0.75 + 0.3 * lamp), max(-tone, 0.0));
  vec3 col = cool * mist * lamp * 0.62;
  // the panes: their foot, the corner between them, and the glare of the lamp
  float foot = p.y - vtHz + vtF * vtH / wall, above = smoothstep(-0.003, 0.003, foot), edge = foot / (0.0012 + vtPx * 0.5);
  float corner = (p.x + 0.328) / (0.0012 + vtPx * 0.5);
  col += cool * (0.055 * lamp * exp(-edge * edge * 0.4) + 0.02 * above * exp(-corner * corner - 2.5 * max(foot, 0.0)));
  float glare = p.x - right * 0.93;
  col += vec3(1.0, 0.94, 0.84) * exp(-abs(glare) * 5.0 - abs(p.y - vtHz + vtF * vtH * 0.4) * 6.0) * 0.18;
  // pale morning fills the whole box
  float pale = max(tone, 0.0);
  vec3 dawn = mix(vec3(0.035, 0.07, 0.1), vec3(0.62, 0.56, 0.48), smoothstep(-0.2, 1.1, 0.3 + 0.42 * p.x / right - 0.45 * sqrt(0.01 + (foot - 0.1) * (foot - 0.1))));
  col = mix(col, dawn * mix(0.8, 1.0, smoothstep(-0.02, 0.06, foot)) + col * 0.8, pale);
  // every trail: sixteen directions for the bands, five fat ones where the piece sounds, two crooked ones for the texture
  vec3 lit = vec3(0.0);
  vec2 dir = vec2(0.995, 0.098);
  float widen = (1.0 + 0.6 * uPad) * exp(0.8 * soft), drift = 0.14 * sin(TAU * uLoop), answer = 0.4 + 0.8 * uEnergy;
  float bend = 0.1 * (1.0 + field + 2.5 * max(field, 0.0)) * (1.0 - 8.0 * uCue * (1.0 - uCue));
  vtDrift = drift;
  for (int i = 0; i < 16; i++) {
    float k = float(i), own = fract(k * 0.618 + 0.31), span = 6.0 + 5.0 * own;
    dir = vec2(dir.x * 0.98079 - dir.y * 0.19509, dir.x * 0.19509 + dir.y * 0.98079);
    vtBegin(k, span);
    float amp = 0.28 * step(0.6, own) + 1.8 * rich + 1.6 * smoothstep(0.05 + 0.2 * own, 0.55 + 0.2 * own, uBands[i]) * answer;
    lit += mix(cool, uKind[4 - i / 4], 0.25) * amp * vtFly(p, dir, 0.7 + 1.3 * vtRnd.x, (0.0034 + 0.003 * vtJit.x) * widen, span, bend);
  }
  for (int i = 16; i < 21; i++) {
    float k = float(i), span = 4.0 + 0.4 * mod(k * 3.0, 7.0);
    vtBegin(k, span);
    vec4 here = piece(vec2(0.5 + vtF * vtA.x / vtA.z / 1.7, 1.0 - sat((vtA.z - 0.9) / 2.4)));
    vec3 tint = mix(cool, here.rgb / max(here.a, 0.02), 0.35 * smoothstep(0.0, 0.2, here.a));
    lit += tint * (3.0 * here.a * answer + 1.4 * rich) * vtFly(p, vtJit - vec2(0.48, 0.5), 0.22 + 0.3 * vtJit.x, (0.01 + 0.006 * vtJit.x) * widen, span, bend);
  }
  vec2 wry = p + 0.014 * (vec2(vtZig(p.y * 8.0 + p.x * 3.0), vtZig(p.x * 9.0 - p.y * 4.0)) + 0.7 * vec2(vtZig(p.y * 19.0 - p.x * 7.0), vtZig(p.x * 21.0 + p.y * 6.0)) + 0.12 * vec2(vtZig(p.y * 37.0), vtZig(p.x * 34.0)) - 1.0);
  for (int i = 21; i < 23; i++) {
    float k = float(i), span = 4.0 + 0.4 * mod(k * 3.0, 7.0);
    vtBegin(k, span);
    lit += mix(cool, uKind[2], 0.4) * (0.12 + 4.5 * uTexture + 1.5 * rich) * vtFly(wry, vtJit - vec2(0.48, 0.5), 0.5 + 0.4 * vtJit.x, 0.0042 * widen, span, bend);
  }
  // the phrase's long slow curls, lying in the mist
  float drop = (vtHz - p.y) / vtF;
  for (int i = 0; i < 2; i++) {
    float k = float(i), hang = 0.07 - 0.02 * k, z = (vtH - hang) / max(drop, 0.04);
    vec2 w = vec2(m * z, z), q = w - (i == 0 ? vec2(0.3 + drift, 1.66) : vec2(-0.6 + drift, 2.35));
    float beat = uTime / 17.0 + 0.5 * k + 0.1, age = fract(beat) * 17.0, n = mod(floor(beat), 911.0), old = age / 17.0;
    float R = (i == 0 ? 0.6 : 0.45) * exp(-0.8 * field), reach = vtF / z;
    for (int s = 0; s < 2 && drop > 0.04 && z < wall && dot(q, q) < R * R * 1.3; s++) {
      float amp = (0.06 + 0.8 * uPhrase + 0.6 * max(field, 0.0)) * (1.0 + min(field, 0.0)) * (s == 0 ? 1.0 - 0.8 * uCue : 1.1 * uCue);
      if (amp < 0.004) break;
      vec2 c = vtCoil(s == 0 ? q : vec2(q.x, -q.y), R, -2.2 + hash11(n + k) * 1.4, 0.19 + 0.04 * k - 0.04 * field, 2.2);
      vec2 slope = q / max(length(q), 1e-4) / vec2(reach, reach * (vtH - hang) / z);
      float d = c.x / max(length(slope), 1e-4);
      float wide = reach * 0.0045 * widen * (0.4 + 1.5 * old) * (0.6 + 0.8 * vtPuff.x), blur = vtSoft * abs(1.0 / z - 0.6) + 0.6 * vtPx;
      float all = sqrt(wide * wide + blur * blur), x = d * d / (all * all);
      float front = smoothstep(0.0, 0.3, age * 0.9 - c.y) * smoothstep(0.0, 0.5, c.y);
      lit += mix(cool, uKind[3], 0.35) * amp * (exp(-x) + 0.5 * exp(-x * 6.0)) * wide / all * front * (1.0 - smoothstep(0.5, 1.0, old)) * vtGaps(c.y * 6.0, 0.8 * old, 0.5 * (vtPuff.x + vtPuff.y));
    }
  }
  // a hit: a fork of three arms, and the mist around it lit
  for (int s = 0; s < 2; s++) {
    vec3 h = vtPlace(s);
    float amp = uHits * h.z;
    vec3 V = vec3((h.x - 0.5) * 1.1, 0.07, 1.15 + 0.5 * h.y), hue = mix(vec3(1.0), uKind[4], 0.25);
    float turn = 0.5 * (h.y - 0.5), grown = 0.6 + 0.8 * (1.0 - uHits);
    vec2 o = (p - vtAt(V)) * vec2(1.0, 1.6);
    lit += hue * amp * 0.16 * exp(-dot(o, o) * 60.0);
    for (int i = 0; i < 3 && amp > 0.01; i++) {
      float way = turn + (i == 0 ? 3.0 : i == 1 ? 0.5 : -0.65), l = i == 1 ? 0.6 : 0.4;
      lit += hue * amp * 2.2 * vtTrail(p, V, V + vec3(cos(way) * l, i == 1 ? 0.05 : -0.02, sin(way) * l), (i == 0 ? 0.015 : 0.009) * widen, grown, 0.15, float(i) + h.x * 30.0, 0.02);
    }
  }
  // the rain of droplets, and the single beads of the keys
  vec2 rain = vec2(p.x * 47.0 + p.y * 17.0, p.y * 47.0 - p.x * 17.0 + 1.4 * mod(uTime, 2000.0)), id = floor(rain);
  vec2 h = hash22(vec2(id.x, mod(id.y, 2800.0)) + 0.5), o = fract(rain) - 0.2 - 0.6 * h.yx;
  float bead = exp(-dot(o, o) * (70.0 + 260.0 * fract(h.x * 7.0))) * (1.0 - smoothstep(-0.06, 0.1, foot)) * 0.6;
  lit += cool * bead * ((0.1 + 0.3 * uDrone + 0.15 * uHigh) * smoothstep(0.55, 1.0, h.y) + 2.6 * uKeys * smoothstep(0.9, 0.95, h.x));
  col += lit * (0.35 + 0.65 * lamp) * (1.0 + 0.3 * pale);
  return screenOf(col * (1.0 + 0.4 * uTone));
}
// A row of beads: the ink at distance d from it, s along it.
float vtRow(float s, float d, float gap, float rad, float seed) {
  float c = s / gap, i = floor(c);
  vec2 h = hash22(vec2(mod(i, 1024.0) + 0.5, seed));
  float r = rad * (0.55 + 0.75 * h.x);
  float a = length(vec2((c - i - 0.3 - 0.4 * h.y) * gap, d + (h.x - 0.5) * rad * 0.8));
  float ink = sat((r - a) / (vtPx + vtSoft * r) + 0.5) * smoothstep(0.12, 0.2, h.y);
  return max(ink, (0.4 + 0.2 * vtSoft) * exp(-d * d / (rad * rad * (1.0 + 7.0 * vtSoft) + vtPx * vtPx)) * min(1.0, rad / vtPx));
}
vec3 vtPlate(vec2 p) {
  float field = uOwn[0], tone = uOwn[1], eye = uOwn[2], many = uOwn[3], src = uOwn[4], soft = uOwn[5];
  float right = 0.5 * uRes.x / uRes.y, near = max(eye, 0.0), rich = max(many, 0.0), zoom = exp(eye < 0.0 ? -0.5 * eye : -0.75 * eye), t = uTime;
  vec2 F = vec2(min(0.13, right * 0.3), -0.1), q = p * zoom + (F + vec2(0.1, 0.05)) * near * 0.8;
  vtPx = zoom / uRes.y; vtSoft = 0.7 * max(soft, 0.0);
  vec4 m = piece(vec2(q.x / 1.7 + 0.5, 0.5 - q.y));
  m *= (1.0 - smoothstep(0.7, 0.85, abs(q.x))) * (1.0 - smoothstep(0.4, 0.5, abs(q.y)));
  float loud = sat(m.a * (0.8 + 0.8 * uEnergy)), lone = max(-many, 0.0), one = max(-src, 0.0), rad = 0.0021 * exp(0.4 * soft + 0.3 * min(soft, 0.0)) * (1.0 + 0.35 * uPad), ink = 0.0;
  vec2 u = rot(0.17 - 0.75 * one) * (q - F);
  // the sheaf from below; one line of it ends in the fork
  float fan = mix(1.0 + 0.1 * u.y, 0.06 + 1.1 * abs(u.y + 0.62), max(src, 0.0));
  float lat = (u.x - 0.09 * (1.0 - one) * (1.0 + field) * u.y * u.y) / fan, cell = 0.045, id0 = floor(lat / cell);
  for (int i = -2; i <= 2; i++) {
    float id = id0 + float(i);
    vec2 h = hash22(vec2(id + 31.5, 7.7));
    float bell = (id * cell + 0.1) / 0.3;
    float on = smoothstep(0.0, 0.15, exp(-bell * bell) * (1.1 + 0.7 * many) + 0.1 + 0.9 * rich - h.x - 0.4 * lone + 0.5 * one * step(0.3, h.y));
    if (on < 0.01) continue;
    on *= (0.45 + 0.55 * h.y) * mix(1.0, smoothstep(-0.66, -0.6, u.y), max(src, 0.0));
    float d = (lat - (id + 0.5 + 0.7 * (h.y - 0.5)) * cell) * fan - 0.07 * (h.x - 0.4) * u.y * (1.0 - abs(src));
    float span = 12.0 + 9.0 * h.y, age = fract(t / span + h.x * 7.0) * span;
    float fresh = exp(-age * 0.22) * smoothstep(0.0, 0.15, age * 4.5 - 0.62 - u.y) * (1.0 - smoothstep(span - 2.0, span, age));
    float b = uBands[int(mod(id + 64.5, 16.0))];
    ink = max(ink, on * (0.34 + 0.25 * rich + (0.25 + 1.1 * b) * fresh + 0.65 * loud) * vtRow(u.y + 2.0, d, 0.0056 + 0.005 * h.x, rad * (0.65 + 0.7 * h.y), id));
    // small curls knocked off the line
    float row = floor(u.y / 0.19 + h.x * 5.0);
    vec2 k = hash22(vec2(id + 11.3, row + 40.7));
    float R = (0.01 + 0.018 * k.y * k.y) * min(fan, 1.0), side = k.x < 0.13 ? 1.0 : -1.0;
    vec2 c = vec2(d * side - R, -(u.y - (row + 0.5 - h.x * 5.0) * 0.19));
    if (k.x < 0.26 && dot(c, c) < R * R * 1.6) {
      vec2 w = vtCoil(c, R, PI, 0.17, 3.0);
      ink = max(ink, on * (0.5 + 0.5 * loud) * vtRow(w.y + 1.0, w.x, 0.0056, rad * 0.75, id + 3.0));
    }
  }
  // the fork: two threads of opposite turning, and the cue's mirrored pair; an old coil far off
  float age = fract(t / 23.0) * 23.0;
  if (u.y < 0.0) ink = max(ink, (0.6 + 0.4 * uPhrase) * vtRow(u.y + 2.0, u.x - 0.02 * u.y * u.y, 0.0056, rad * 1.2, 77.0));
  for (int s = 0; s < 2; s++) {
    float share = s == 0 ? 1.0 - 0.75 * uCue : uCue;
    for (int i = 0; i < 3 && share > 0.01; i++) {
      float R = (i == 0 ? 0.25 : i == 1 ? 0.1 : 0.2) * exp(-0.8 * field), side = (i == 1) != (s == 0) ? 1.0 : -1.0;
      vec2 o = i < 2 ? u : rot(-0.5) * (q - vec2(-0.62, 0.1)), c = vec2(o.x * side - R, -o.y);
      if (dot(c, c) > R * R * 1.5) continue;
      vec2 w = vtCoil(c, R, PI - 0.12, i == 0 ? 0.115 : i == 1 ? 0.085 : 0.15, i == 2 ? 2.6 : 5.0);
      float fresh = smoothstep(0.0, 0.1, age * 1.2 - w.y) * exp(-age * 0.12) * (1.0 - smoothstep(20.0, 23.0, age));
      ink = max(ink, share * (i == 2 ? 0.4 * (1.0 - lone) : 0.62 + 0.6 * uPhrase * (0.5 + fresh)) * vtRow(w.y + 1.0, w.x, 0.0056, rad * (i == 2 ? 0.8 : 1.25), 5.0 + float(i)));
    }
  }
  // long arcs that cross the plate, and the texture's short crooked ones
  for (int i = 0; i < 4; i++) {
    float k = float(i);
    vec2 h = hash22(vec2(k + 2.5, 8.1)), c = vec2(h.x * 2.0 - 1.0, i < 2 ? -1.4 - h.y : 1.2 + h.y);
    float R = 1.25 + 0.9 * h.y + 0.2 * k, r = length(q - c);
    float along = atan(q.x - c.x, (q.y - c.y) * (i < 2 ? 1.0 : -1.0)) * R;
    ink = max(ink, (0.25 + 0.5 * uMid * h.x + 0.5 * loud) * (1.0 - lone) * (1.0 - one) * vtRow(along + 8.0, r - R, 0.011, rad * 0.75, k + 20.0));
    float beat = t / (4.0 + k) + 0.3 * k, young = fract(beat);
    vec2 j = hash22(vec2(k + 0.5, mod(floor(beat), 911.0))), o = rot(j.x * 6.0) * (q - (j - 0.5) * vec2(1.5, 0.8));
    float amp = (0.15 + 1.8 * uTexture + 0.6 * rich) * (1.0 - smoothstep(0.3, 1.0, young));
    if (abs(o.y) < 0.06 && o.x > 0.0 && o.x < 0.2 * min(1.0, young * 20.0))
      ink = max(ink, amp * vtRow(o.x, o.y + 0.012 * sin(o.x * 40.0 + k) + 0.006 * sin(o.x * 90.0), 0.006, rad * 0.8, k + 50.0));
  }
  // a hit: a star of arms at a place that changes now and then, with a stain round it
  float stain = 0.0;
  for (int s = 0; s < 2; s++) {
    vec3 h = vtPlace(s);
    float amp = uHits * h.z;
    vec2 o = q - (h.xy - 0.5) * vec2(1.1, 0.6);
    stain = max(stain, amp * exp(-dot(o, o) * 45.0));
    for (int i = 0; i < 4 && amp > 0.01; i++) {
      vec2 a = rot(h.x * 6.0 + float(i) * 1.7 + 0.4 * float(i * i)) * o;
      if (a.x > 0.0 && a.x < (0.12 + 0.07 * float(i)) * (1.4 - 0.8 * uHits)) ink = max(ink, amp * 1.4 * vtRow(a.x, a.y + 0.3 * a.x * a.x, 0.0072, rad * (1.6 - 0.2 * float(i)), float(i) + 60.0));
    }
  }
  // single beads for the keys, and dust
  vec2 dust = q * 23.0, id = floor(dust), h = hash22(id + 0.5);
  ink = max(ink, (0.35 * step(0.86, h.y) + uKeys * step(0.75, h.x)) * sat((0.0012 + 0.003 * h.x * h.x - length(fract(dust) - 0.25 - 0.5 * h) / 23.0) / vtPx + 0.5));
  // four small crosses to measure from
  vec2 x = abs(abs(q - vec2(0.03, 0.0)) - vec2(0.48, 0.3));
  ink = max(ink, 0.6 * sat((0.0009 - min(x.x, x.y)) / vtPx + 0.5) * (1.0 - smoothstep(0.016, 0.018, max(x.x, x.y))));
  // the plate itself: uneven grey, the lamp behind it, the ring marks of the window
  float cloud = noise(q * 2.3 + 4.0 + 0.2 * sin(t * 0.05)), small = noise(q * 9.0), grain = noise(q * 240.0);
  vec2 off = q - vec2(0.3, 0.16);
  float lamp = 0.97 - 0.42 * dot(off, off) / (1.0 + 0.4 * dot(off, off)) + (0.1 + 0.16 * uDrone) * (cloud - 0.5) + 0.05 * (small - 0.5) + 0.045 * (grain - 0.5) + 0.04 * uMic;
  float ring = length(q - vec2(-0.22, 0.05)), r1 = (ring - 0.6) / 0.004, r2 = (ring - 0.588) / 0.008, r3 = (ring - 0.36) / 0.003;
  lamp += (0.5 + uDrone) * (-0.07 * exp(-r1 * r1) + 0.06 * exp(-r2 * r2) - 0.03 * exp(-r3 * r3));
  vec3 hue = m.rgb / max(m.a, 0.02);
  vec3 ground = vec3(0.8, 0.79, 0.75) * lamp, dark = mix(vec3(0.05, 0.055, 0.07), hue * 0.35, 0.6 * smoothstep(0.0, 0.25, loud));
  ground *= mix(vec3(1.0), 0.55 + 0.4 * hue, 0.3 * loud);
  ground *= mix(vec3(1.0), 0.35 + 0.35 * uKind[4], 0.6 * stain);
  // other plates: black with white threads, or blue
  float black = smoothstep(0.1, 0.9, max(-tone, 0.0)), blue = max(tone, 0.0);
  ground = mix(ground, ground * vec3(0.36, 0.66, 0.95), blue);
  dark = mix(dark, vec3(0.01, 0.03, 0.12), blue);
  ground = mix(ground, (vec3(0.16) - 0.11 * ground / max(lamp, 0.1) + 0.1 * loud * hue) * lamp, black);
  dark = mix(dark, vec3(0.93, 0.92, 0.88) * mix(vec3(1.0), hue, 0.4 * loud), black);
  vec3 col = mix(ground, dark, sat(ink * (1.0 + 0.25 * uTone - 0.6 * min(soft, 0.0) - 0.15 * max(soft, 0.0))));
  // past the plate's own edge lies the dark bench
  vec2 e = abs(q) - vec2(1.36, 0.7);
  float edge = max(e.x, e.y);
  return mix(col, vec3(0.03, 0.028, 0.026) * (1.0 + exp(-max(edge, 0.0) * 12.0)), smoothstep(-0.001, 0.003, edge));
}
vec3 render(vec2 p) {
  vtPx = 1.0 / uRes.y;
  return uVar < 0.5 ? vtCloud(p) : vtPlate(p);
}
