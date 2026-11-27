// name: Spilled strips
// a: On the board
// b: On edge
// what: A dozen strips of veneer, felt, slate and card lie spilled towards one corner of an old painted board, each with its shadow on what lies under it, much of the board left bare; or the same strips stand on edge, some bent, seen from above in low sun, their long shadows running over the board, tinted where the sun comes through.
// follows: Drone, pad, texture and phrase each have their own strips, which lengthen, rise and take its colour; card shows the piece along its length. Bands stretch the slivers, keys too. The low raises the pile, or the walls. A hit kicks a red strip and throws a bar of light, a cue warms the light and lengthens every shadow; a voice brightens the bare board.
// own: 0 1 all lie in line side by side (b: rank behind rank), -1 round a middle as spokes (b: a ring of walls); 1 1 broad slabs (b: tall), -1 thin as straws (b: low); 2 1 pointed like leaves (b: fins and sails), -1 winding like ribbons; 3 1 hundreds of small ones lie all about (b: stand as pegs), -1 only five are left and those are larger; 4 the ground: 1 black and smooth, -1 rippled sand, snow or water in the drone's colour; 5 1 coloured glass that lets light through, -1 painted in its sound's colour; 6 1 each glows in a dark room, -1 they hang high over the ground (b: the sun stands very low); 7 1 the eye low along the ground, -1 turned square, a lattice (b: folded zigzag)
float tpPx, tpGain, tpKick, tpCue;   // a pixel; how strongly it answers; a hit's push and a cue's reach, each nothing, out, and back
vec4 tpSl, tpTn;                     // weightless drifts: slides along a strip, turns of a degree
vec4 tpB;                            // four bands
float tpSoft(float d, float w) { return 1.0 - smoothstep(-w, w, d); }
float tpGrey(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
// What a strip is made of (0 wood, 1 felt, 2 slate, 3 card), at a place along and across it, dyed by its sound.
vec3 tpStuff(vec3 c, float m, float s, vec2 q, float L, float lv, vec3 ink) {
  float fine = sat(1.3 - 260.0 * tpPx);
  vec4 f = m < 0.5 ? vec4(3.5, 12.0, 11.0, 330.0) : m < 1.5 ? vec4(22.0, 22.0, 190.0, 210.0) : m < 2.5 ? vec4(14.0, 34.0, 80.0, 130.0) : vec4(11.0, 9.0, 150.0, 300.0);
  float big = noise(q * f.xy + s * vec2(9.0, 3.0)), small = noise(q * f.zw + s);
  float pore = noise(vec2(m < 0.5 ? q.x : q.x + q.y, q.y) * vec2(34.0, 480.0) * (m < 0.5 ? vec2(1.0) : vec2(9.0, 0.4)) + s * 5.0);
  if (m < 0.5) {
    float ring = 0.5 + 0.5 * sin((q.y * 70.0 + big * 2.6 + q.x * 1.5) * 4.0);
    c *= 1.0 + 0.28 * (big - 0.5) + 0.12 * (ring - 0.5) + fine * (0.3 * (small - 0.5) - 0.2 * smoothstep(0.66, 0.9, pore));
    c = mix(c, c * vec3(1.05, 0.95, 0.84), ring * 0.5);
  } else if (m < 1.5) c *= 1.0 + fine * 0.28 * (small + 0.7 * pore - 0.85) + 0.14 * (big - 0.5);
  else if (m < 2.5) c = c * (0.9 + 0.22 * big + 0.1 * (small - 0.5)) + 0.05 * (1.0 - smoothstep(0.0, 0.03, abs(big - 0.55))) * small;
  else c *= 1.0 + fine * 0.1 * (small - 0.5) + 0.09 * (big - 0.5);
  vec3 soft = mix(vec3(tpGrey(ink)), ink, 0.54);
  c = mix(c, soft * min(tpGrey(c) / max(tpGrey(soft), 0.1), 1.8), (0.08 + 0.44 * lv) * (1.15 - 0.45 * tpGrey(c)));
  if (m > 2.5) { // card takes the piece along its length
    vec4 pc = piece(vec2(0.5 + 0.47 * clamp(q.x / L, -1.0, 1.0), fract(s * 0.31) * 0.6 + 0.2 - q.y * 1.5));
    vec3 hue = pc.rgb / max(max(pc.r, max(pc.g, pc.b)), 0.1);
    c *= mix(vec3(1.0), 0.42 + 0.55 * mix(vec3(tpGrey(hue)), hue, 0.6), 0.85 * pc.a);
  }
  return c;
}
// Off-white ground laid on with a dry brush, cracked by age.
vec3 tpBoard(vec2 p) {
  float patchy = noise(p * 2.3 + 3.0);
  float st1 = noise(rot(0.45) * p * vec2(5.0, 62.0)), st2 = noise(rot(-0.9) * p * vec2(60.0, 6.0) + 9.0);
  float st = mix(st1, st2, smoothstep(0.35, 0.65, noise(p * 3.1 + 11.0)));
  float bristle = noise(rot(0.45) * p * vec2(14.0, 260.0)) - 0.5;
  vec3 c = mix(vec3(0.875, 0.865, 0.835), vec3(0.94, 0.933, 0.91), 0.55 * st + 0.45 * patchy);
  c = mix(c, vec3(0.80, 0.80, 0.785), 0.4 * smoothstep(0.62, 0.9, noise(rot(0.2) * p * vec2(3.0, 9.0) + 21.0)) * st);
  c *= 1.0 + 0.035 * bristle * sat(1.3 - 160.0 * tpPx);
  // hair cracks: the edges of an uneven net, only where the ground is old
  float old = smoothstep(0.5, 0.8, noise(p * 1.7 + 31.0) + 0.25 * (noise(p * 9.0) - 0.5));
  if (old > 0.0) {
    vec2 q = p * vec2(24.0, 30.0) + 1.1 * vec2(noise(p * 34.0), noise(p * 34.0 + 5.0)), id = floor(q), f = q - id;
    float d1 = 9.0, d2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), r = o + hash22(id + o) - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    c *= 1.0 - 0.15 * old * (1.0 - smoothstep(0.0, max(0.0012, 1.2 * tpPx), (sqrt(d2) - sqrt(d1)) / 27.0)) * min(1.0, 0.0018 / tpPx);
  }
  return c;
}

// The strips are laid one after another: flat, each on those before (a), or standing, each behind those before (b).
float tpE, tpPxV, tpBlur, tpFuzz, tpLift;   // 1 in b; a pixel across a strip; how soft shadows are; an uneven edge; how the low raises the pile
vec2 tpP, tpUp, tpSun;      // where we look on the board; which way height runs in the picture; towards the sun, as far as a shadow runs
vec2 tpG; float tpH;        // the place seen so far: where on the board, how high above it
vec3 tpDay, tpUnder; float tpAo, tpCov;   // the sun it gets, what shows beside its edge, the dark of a corner
vec3 tpHalo; float tpN, tpSl2;      // what the glowing ones throw on the ground; which strip is next; how steeply it winds
vec3 tpTone, tpInk; vec4 tpQ, tpMd, tpC;          // what it is: colours; place on the strip, length, loudness; stuff, seed, direction; half width, bend, edge, hit
float tpMany(float i) { return i > 9.5 || i == 7.0 ? 0.0 : smoothstep(0.0, 0.5, -uOwn[3] - 0.05 * i); } // how far gone, where only five are left
// Another lie of the same strips: where one is (middle, direction) and how it is cut.
void tpLay(float i, inout vec4 a, inout vec4 cut) {
  float h = fract(i * 0.618 + 0.13), slot = mod(i * 4.0, 15.0), side = mod(i, 2.0), odd = side * 2.0 - 1.0;
  if (uOwn[0] > 0.0) {
    vec2 to = mix(vec2((slot - 7.0) * 0.125, (h - 0.5) * 0.3), vec2((h - 0.5) * 0.8, -0.6 + i * 0.085), tpE);
    vec2 td = mix(vec2(0.165, 0.986), vec2(0.995, 0.1), tpE) * (dot(a.zw, vec2(0.165, 0.986)) < 0.0 && tpE < 0.5 ? -1.0 : 1.0);
    a = vec4(mix(a.xy, to, uOwn[0]), normalize(mix(a.zw, td, uOwn[0])));
    cut.xy = mix(cut.xy, vec2(0.24 + 0.6 * cut.x, 0.026 + 0.32 * cut.y), uOwn[0]);
  }
  if (uOwn[0] < 0.0) {
    float an = TAU * (i + 0.4 * h) / 15.0, y = (i - 7.0) / 7.3, x = odd * sqrt(max(1.0 - y * y, 0.0));
    vec2 ro = vec2(cos(an), sin(an)), td = tpE > 0.5 ? vec2(-0.62 * y, 0.36 * x) : ro;
    vec2 to = tpE > 0.5 ? vec2(0.62 * x, 0.40 * y - 0.03) : vec2(0.1, 0.02) + ro * (0.17 + 0.2 * h * h + 0.8 * cut.x);
    if (tpE > 0.5) { td *= td.x < 0.0 ? -1.0 : 1.0; td.x = max(td.x, 0.35 * length(td) + 0.01); }
    else td *= dot(td, a.zw) < 0.0 ? -1.0 : 1.0;
    a = vec4(mix(a.xy, to, -uOwn[0]), normalize(mix(a.zw, normalize(td), -uOwn[0])));
    cut.x = mix(cut.x, tpE > 0.5 ? 0.1 + 0.15 * cut.x : 0.08 + 0.8 * cut.x, -uOwn[0]);
  }
  if (uOwn[7] < 0.0) {
    vec2 to = side > 0.5 ? vec2((h - 0.5) * 0.7, (slot - 7.0) * 0.062) : vec2((slot - 7.0) * 0.115, (h - 0.5) * 0.3), td = side > 0.5 ? vec2(0.998, 0.06) : vec2(-0.06, 0.998);
    if (tpE > 0.5) { td = vec2(0.8, 0.6 * odd); to = vec2((mod(i, 3.0) - 1.0) * 0.6 + (h - 0.5) * 0.2, -0.55 + i * 0.078); }
    td *= dot(td, a.zw) < 0.0 && tpE < 0.5 ? -1.0 : 1.0;
    a = vec4(mix(a.xy, to, -0.85 * uOwn[7]), normalize(mix(a.zw, td, -uOwn[7])));
    cut.x = mix(cut.x, 0.2 + 0.6 * cut.x, -uOwn[7]);
  }
  if (tpE > 0.5) { a.z = max(a.z, 0.3); a.zw = normalize(a.zw); }
  if (uOwn[1] > 0.0) cut.y = mix(cut.y, 0.032 + (1.5 - 0.4 * tpE) * cut.y, uOwn[1]);
  if (uOwn[1] < 0.0) { cut.y = mix(cut.y, tpE > 0.5 ? -0.013 : 0.0034 + 0.05 * cut.y, -uOwn[1]); cut.x *= 1.0 - (0.2 + h) * uOwn[1]; }
  if (uOwn[2] > 0.0) { cut.zw *= 1.0 - uOwn[2] * vec2(0.5, 1.0); cut.xy *= 1.0 + uOwn[2] * vec2(0.15 - 0.5 * tpE, 0.35 + 0.35 * tpE); }
  if (uOwn[3] < 0.0) { cut.xy *= 1.0 - 0.45 * uOwn[3]; a.xy = mix(a.xy, a.xy * 0.8 - vec2(0.1, 0.0), -uOwn[3]); cut.xy *= 1.0 - tpMany(i); }
}
// How far from its middle line a leaf reaches, at a place along it.
float tpLeaf(float x) { x = clamp(x, -1.0, 1.0); float t = 0.5 + 0.5 * x; return mix(1.0, mix((1.0 - x * x) * (1.1 - 0.3 * x), 2.1 * (1.0 - t) * smoothstep(0.0, 0.42, t) * (1.0 - 0.25 * t), tpE), max(uOwn[2], 0.0)); }
// How far aside a winding one goes, and how steeply.
float tpWind(float u, float L) { return -uOwn[2] * (0.055 + 0.16 * L) * (1.0 - 0.4 * tpE) * sin(u * 9.0 + 40.0 * L + tpTn.x * 9.0) ; }
float tpSteep(float u, float L) { return -uOwn[2] * (0.055 + 0.16 * L) * (1.0 - 0.4 * tpE) * 9.0 * cos(u * 9.0 + 40.0 * L + tpTn.x * 9.0); }
// The other grounds: black and smooth, or rippled in the colour of the drone.
vec3 tpGround(vec3 was, vec2 p, vec2 sun, float px) {
  if (uOwn[4] > 0.0) {
    vec3 k = uKind[0] * uKind[0];
    float sheen = noise(rot(0.5) * p * vec2(1.3, 3.4) + 4.0), dust = noise(p * 210.0);
    was = mix(was, (vec3(0.013) + 0.09 * k) * (0.55 + 0.9 * sheen) + 0.02 * smoothstep(0.8, 1.0, dust) * sat(1.3 - 160.0 * px), min(1.0, 1.25 * uOwn[4]));
  }
  if (uOwn[4] < 0.0) {
    vec2 q = rot(0.35) * p;
    float big = noise(p * 1.4 + 2.0), w = noise(q * vec2(2.2, 4.0) + 7.0) + 0.5 * noise(q * vec2(6.0, 9.0));
    float ph = q.y * 46.0 + 7.0 * w + mod(uTime * 0.16, TAU), see = sat(1.4 - 110.0 * px);
    float ridge = 0.6 * sin(ph) + 0.25 * sin(2.0 * ph + 1.0);
    float grit = noise(p * 320.0) - 0.5;
    vec3 k = mix(vec3(tpGrey(uKind[0])), uKind[0], 0.9);
    k = k * (0.93 + 0.2 * (big - 0.5) + see * (0.11 * ridge) * (0.4 + 1.2 * smoothstep(0.25, 0.75, big)) + 0.12 * grit * sat(1.3 - 240.0 * px));
    k += 0.07 * see * smoothstep(0.55, 0.85, ridge) * smoothstep(0.3, 0.7, big);
    was = mix(was, k, min(1.0, -1.2 * uOwn[4]));
  }
  return was;
}
// The many small ones, lying (a) or standing as pegs (b), on the ground at a place; their shadows with them.
vec3 tpLitter(vec3 c, vec2 p, vec2 sun, float px) {
  float many = uOwn[3], leaf = max(uOwn[2], 0.0), first = 1e3, dark = 0.0, top = 0.0;
  vec3 paint = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float cell = (k == 0 ? 0.115 : 0.074) * (1.3 - 0.3 * tpE), fk = float(k);
    vec2 q = (tpE > 0.5 ? p : rot(0.6 + fk) * p) / cell + fk * 5.3, id0 = floor(tpE > 0.5 ? q : q - 0.5), run = (tpE > 0.5 ? tpSun : rot(0.6 + fk) * sun * (0.5 - 1.0 * min(uOwn[6], 0.0))) * (tpE > 0.5 ? min(1.0, 1.5 / length(tpSun)) : 0.16);
    for (int j = tpE > 0.5 ? -1 : 0; j <= (tpE > 0.5 ? 2 : 1); j++) for (int i = tpE > 0.5 ? -1 : 0; i <= (tpE > 0.5 ? 2 : 1); i++) {
      vec2 id = id0 + vec2(float(i), float(j)), r = hash22(id + 17.0 * fk), v = q - id - 0.5 - 0.7 * (r - 0.5);
      float h = fract(r.x * 37.7 + r.y * 11.3), sz = smoothstep(0.8 * h, 0.8 * h + 0.2, many), loud = h < 0.25 ? uDrone : h < 0.5 ? uPad : h < 0.75 ? uTexture : uPhrase;
      vec3 ink = h < 0.25 ? uKind[0] : h < 0.5 ? uKind[1] : h < 0.75 ? uKind[2] : uKind[3];
      float d, s, at = 0.0;
      if (tpE > 0.5) {
        float hz = (0.35 + 0.5 * r.y + 0.12 * loud) * sz, rad = 0.05 * sz * (1.0 + 0.6 * uOwn[1]);
        float y = sat(v.y / max(tpUp.y * hz, 1e-3)), n = sat(-dot(v, run) / max(dot(run, run) * hz, 1e-3));
        at = y;
        d = length(v - tpUp * hz * y) - rad * mix(1.0, 1.0 - 0.9 * y, leaf);
        s = length(v + run * hz * n) - rad * (1.0 + 0.6 * n);
      } else {
        float an = TAU * r.y;
        vec2 dv = vec2(cos(an), sin(an)), w = v + run;
        if (uOwn[0] > 0.0) { vec2 to = rot(0.6 + fk) * vec2(0.165, 0.986); dv = normalize(mix(dv * (dot(dv, to) < 0.0 ? -1.0 : 1.0), to, 0.94 * uOwn[0])); }
        if (uOwn[7] < 0.0) { vec2 to = rot(0.6 + fk) * (r.x < 0.5 ? vec2(0.998, 0.06) : vec2(-0.06, 0.998)); dv = normalize(mix(dv * (dot(dv, to) < 0.0 ? -1.0 : 1.0), to, -0.94 * uOwn[7])); }
        if (uOwn[0] < 0.0) { vec2 to = (id + 0.5 - fk * 5.3) * cell - rot(0.6 + fk) * vec2(0.1, 0.02); to /= length(to) + 1e-3; dv = normalize(mix(dv * (dot(dv, to) < 0.0 ? -1.0 : 1.0), to, -0.94 * uOwn[0]) + 1e-4); }
        float hl = (0.28 + 0.24 * r.x) * (0.4 + 0.6 * sz) * (1.0 + 0.2 * loud), hw = hl * (0.11 + 0.13 * h + 0.07 * leaf) * exp2(1.1 * uOwn[1]) * sz;
        vec2 u = vec2(dot(v, dv), dv.x * v.y - dv.y * v.x), o = vec2(dot(w, dv), dv.x * w.y - dv.y * w.x);
        float cu = max(-uOwn[2], 0.0) * (r.y - 0.5) * 2.2;
        u.y -= cu * u.x * u.x; o.y -= cu * o.x * o.x;
        d = max(abs(u.x) - hl, abs(u.y) - hw * tpLeaf(u.x / hl));
        s = max(abs(o.x) - hl, abs(o.y) - hw * tpLeaf(o.x / hl));
        at = 0.5 + 0.5 * u.y / max(hw, 1e-3);
      }
      dark = max(dark, sz * (1.0 - smoothstep(-0.02, 0.06, s)));
      float cv = sat(0.5 - d * cell / px) * step(0.01, sz), key = tpE > 0.5 ? (id.y + 0.7 * r.y) * cell : 0.0;
      if (cv > 0.0 && key < first) {
        vec3 to = mix(mix(vec3(0.66, 0.53, 0.38), vec3(0.3, 0.27, 0.25), h), ink * (0.8 + 0.4 * r.x), 0.3 + 0.7 * max(abs(uOwn[5]), max(uOwn[6], 0.0))) * (0.78 + 0.4 * sat(at));
        if (uOwn[5] > 0.0) to = mix(to, c * (0.35 + ink) + 0.1 * ink, 0.65 * uOwn[5]);
        to += ink * uHits * 0.25;
        paint = mix(paint, to, cv); top = max(top, cv);
        if (tpE > 0.5 && cv > 0.6) first = key;
        tpHalo += max(uOwn[6], 0.0) * ink * ink * (0.12 + 0.5 * loud) * cv;
      }
    }
  }
  c *= 1.0 - 0.42 * dark * sat(1.4 - 14.0 * px);
  return top > 0.0 ? mix(c, paint / max(top, 0.01) * min(top, 1.0) + paint * 0.0, top) : c;
}
// How far aside a bent strip stands, where a slanting line meets it: found in two steps.
float tpBend(float bend, float u, float L, float lean) {
  float m = L * L, c = bend * min(u * u, m), w = u - c * lean;
  if (uOwn[2] < 0.0) { c += tpWind(u, L); if (tpE < 0.5) return c; w = u - c * lean; return bend * min(w * w, m) + tpWind(w, L); }
  return bend * min(w * w, m);
}
// One strip. a, b: middle and direction, flat and standing. cut: half length, half width, taper, slant of the ends. w: rest height,
// stuff, seed, curl. s: bend and how much light it lets through, when standing. v: how far it lengthens as it sounds and to which
// side, how loud it is, its drift and its turn. hit: does a hit kick it.
void tpBar(vec4 a, vec4 b, vec4 cut, vec4 w, vec2 s, vec3 tone, vec4 v, vec3 ink, float hit) {
  a = mix(a, b, tpE);
  float no = tpN; tpN += 1.0;
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] < 0.0 || uOwn[7] < 0.0) tpLay(no, a, cut);
  if (uOwn[3] < 0.0 && tpMany(no) > 0.98) return;
  if (uOwn[5] != 0.0 || uOwn[6] > 0.0) tone = mix(tone, ink * (0.55 + 0.75 * fract(no * 0.618 + 0.2)), min(1.0, 1.1 * max(abs(uOwn[5]), uOwn[6])));
  float lv = sat(v.y * tpGain), L = cut.x * (1.0 + abs(v.x) * lv), bend = s.x * tpE * (1.0 - 0.75 * max(uOwn[0], 0.0) - 0.45 * max(-uOwn[0], 0.0)) * (1.0 + 0.85 * min(uOwn[7], 0.0)), hw = cut.y;
  vec2 d = a.zw + v.w * vec2(-a.w, a.z), n = vec2(-d.y, d.x);
  a.xy += d * (v.z + cut.x * v.x * lv * 0.8 + hit * 0.12 * tpKick);
  hw = mix(hw, (hw + 0.022) * (0.8 + 0.3 * lv + 0.25 * uLow), tpE);
  // along it and up it
  vec2 r = tpP - a.xy, V = mix(n, tpUp, tpE);
  float k = 1.0 / (d.x * V.y - d.y * V.x), u = (r.x * V.y - r.y * V.x) * k, lean = dot(n, vec2(V.y, -V.x)) * k;
  float c = tpBend(bend, u, L, lean);
  vec2 q = vec2(u - c * lean, (d.x * r.y - d.y * r.x - c) * k);
  float x = clamp(q.x / L, -1.2, 1.2), wide = hw * (1.0 + cut.z * x) * (uOwn[2] > 0.0 ? tpLeaf(q.x / L) : 1.0), thick = (0.0025 + 0.09 * w.x) * (1.0 + tpE);
  float st = 0.0;
  if (uOwn[2] < 0.0) { st = tpSteep(u, L); q.y /= tpE < 0.5 ? sqrt(1.0 + st * st) : 1.0; }
  q.y -= tpE * wide;
  vec2 e = vec2(abs(q.x + cut.w * q.y) - L, abs(q.y) - wide);
  float far = max(e.x, e.y);
  // the same towards the sun, from the place seen so far
  float top = w.x * tpLift + 0.014 * lv + hit * 0.02 * tpKick + w.w * x * x * tpLift + thick + (uOwn[6] < 0.0 ? -uOwn[6] * (1.0 - tpE) * (0.06 + 0.013 * no) : 0.0), dz = max(top - tpH, 0.001);
  r = mix(tpP + tpSun * dz, tpG, tpE) - a.xy; V = mix(n, -tpSun, tpE);
  k = d.x * V.y - d.y * V.x; k = 1.0 / (abs(k) < 0.03 ? 0.03 : k);
  float off = d.x * r.y - d.y * r.x;
  u = (r.x * V.y - r.y * V.x) * k; lean = dot(n, vec2(V.y, -V.x)) * k;
  c = tpBend(bend, u, L, lean); off -= c;
  vec2 o = vec2(u - c * lean, off * k);
  if (uOwn[2] < 0.0 && tpE < 0.5) o.y /= sqrt(1.0 + st * st);
  float sw = wide;
  if (uOwn[2] > 0.0) wide = hw * (1.0 + cut.z * clamp(o.x / L, -1.2, 1.2)) * tpLeaf(o.x / L);
  float run = mix(dz, max(o.y, 0.0), tpE), hh = mix(wide, max(wide - 0.5 * tpH, 0.0), tpE);
  vec2 f = vec2(abs(o.x + cut.w * o.y * (1.0 - tpE)) - L, abs(o.y - tpE * hh) - hh);
  float pen = 0.0014 + tpBlur * run, sh = tpSoft(max(f.x, f.y), pen) * (1.0 - 0.3 * sat(mix(dz * 14.0, 2.5 * run, tpE)));
  wide = sw;
  vec3 thru = mix(tone, ink * 1.25, 0.65 * lv) * s.y * tpE;
  if (uOwn[5] > 0.0) thru = mix(thru, 0.25 + 0.75 * tone, 0.8 * uOwn[5]);
  if (uOwn[6] > 0.0) {
    vec2 oe = max(mix(e, vec2(f.x, abs(off) - 0.5 * hw), tpE), 0.0);
    float fall = dot(oe, oe) / (0.0012 + 0.0035 * lv);
    vec3 hue = mix(vec3(tpGrey(ink)), ink, 0.75);
    tpHalo += uOwn[6] * hue * hue * (0.12 + 0.5 * lv + 0.7 * hit * uHits) / (1.0 + fall);
    sh *= 1.0 - uOwn[6];
  }
  tpDay *= 1.0 - sh * (1.0 - thru); tpUnder *= 1.0 - 0.6 * sh * (1.0 - tpE);
  // the dark where it touches
  float foot = mix(0.003 + 0.2 * dz, 0.5 * hw, tpE), near = foot / (foot + max(mix(far, max(abs(off), f.x), tpE), 0.0));
  near *= near * near;
  tpAo *= 1.0 - mix(0.2, 0.3, tpE) * near;
  far += w.y == 1.0 ? tpFuzz : 0.0;
  float cov = sat(0.5 - far / tpPxV);
  if (cov > 0.0 && tpE * tpCov == 0.0) {
    tpUnder = tpTone * (0.42 + 0.58 * tpDay) * tpAo; tpCov = cov;
    vec3 was = tpTone;
    tpDay = vec3(1.0); tpAo = 1.0;
    tpTone = tone; tpInk = ink;
    if (uOwn[5] > 0.0) tpTone = mix(tone, was * (0.22 + 1.05 * tone) + 0.06 * ink, 0.85 * uOwn[5]);
    tpSl2 = st; tpQ = vec4(q, L, lv); tpMd = vec4(w.yz, d);
    tpC = vec4(wide, mix(w.w, bend, tpE), 1.0 - smoothstep(0.0, max(0.5 * thick, 1.4 * tpPx), -far), 4.0 * hit + s.y);
    float z = q.y + wide;
    tpH = mix(mix(tpH, top, cov), z, tpE); tpG = tpP - tpUp * z * tpE;
  } else if (uOwn[5] > 0.0 && cov > 0.0) tpTone *= mix(vec3(1.0), 0.45 + 0.6 * tone, 0.7 * uOwn[5] * cov);
}
vec3 tpPicture(vec2 p) {
  vec2 sun = rot((0.28 - 0.08 * tpE) * sin(TAU * uLoop)) * mix(vec2(-0.75, 0.66), vec2(0.62, 0.78), tpE);
  tpSun = sun * (mix(1.7, 1.2, tpE) + (0.9 - 0.2 * tpE) * uSpace + (2.0 - 0.7 * tpE) * tpCue);
  tpP = mix(p, vec2(p.x, p.y * 1.21) * (1.0 + 0.16 * p.y), tpE);   // standing strips are seen from above, leaning over a little
  tpUp = vec2(0.0, 0.68);
  float haze = 0.0;
  if (uOwn[7] > 0.0) {
    float hi = 1.0 - 1.15 * uOwn[7] * (p.y + 0.12), s = 1.0 / max(hi, 0.1);
    haze = (1.0 - smoothstep(0.14, 0.45, hi));
    tpP = vec2(p.x * s, (p.y + 0.12 * uOwn[7]) * s * (1.0 + 0.7 * uOwn[7]));
    tpPx *= min(s, 5.0); tpUp.y *= 1.0 + 0.75 * uOwn[7];
  }
  if (uOwn[6] < 0.0) tpSun *= 1.0 - 1.5 * tpE * uOwn[6];
  tpPxV = tpPx * (1.0 + 0.5 * tpE);
  tpBlur = mix(mix(0.55, 0.2, uTone), mix(0.2, 0.07, uTone), tpE);
  tpLift = 0.8 + 0.8 * uLow;
  if (uOwn[6] < 0.0) { tpLift += -(1.0 - tpE) * uOwn[6] * (3.0 + uLow); tpBlur *= 1.0 + (0.3 - 0.6 * tpE) * -uOwn[6]; }
  tpFuzz = (1.0 - tpE) * (0.0035 * (noise(tpP * 260.0) - 0.5) + 0.002 * (noise(tpP * 60.0) - 0.5));
  vec3 board = vec3(0.0);
  if (abs(uOwn[4]) < 0.84) board = tpBoard(tpP);
  tpFuzz *= sat(1.0 - max(uOwn[6], -uOwn[1]));
  tpHalo = vec3(0.0); tpN = tpSl2 = 0.0;
  if (uOwn[4] != 0.0) board = tpGround(board, tpP, sun, tpPx);
  if (uOwn[3] > 0.0) board = tpLitter(board, tpP, sun, tpPx);
  vec2 m = p - vec2(-0.45, 0.08);
  board *= 1.0 + 0.07 * uMic * exp(-3.0 * dot(m, m)); // a voice lets more day in over the empty board
  tpTone = board; tpInk = tpUnder = vec3(0.0); tpDay = vec3(1.0); tpAo = 1.0; tpCov = tpH = 0.0; tpG = tpP;
  tpQ = tpMd = tpC = vec4(1.0);
  tpBar(vec4(-0.45, 0.27, 0.8139, -0.581), vec4(0.42, -0.5, 0.995, 0.0998), vec4(0.075, 0.004, 0.3, 0.5), vec4(0.003, 0.0, 12.2, 0.004), vec2(0.0, 0.1), vec3(0.16, 0.13, 0.12), vec4(1.0, tpB.x, tpSl.x, tpTn.y), uKind[0], 0.0);
  tpBar(vec4(-0.02, 0.25, 0.8776, -0.4794), vec4(0.62, -0.42, 0.9211, -0.3894), vec4(0.08, 0.0048, -0.2, 0.5), vec4(0.004, 0.0, 13.9, 0.006), vec2(0.8, 0.3), vec3(0.72, 0.57, 0.38), vec4(-1.0, tpB.y, tpSl.y, tpTn.y), uKind[1], 0.0);
  tpBar(vec4(0.53, 0.25, 0.9131, 0.4078), vec4(-0.16, -0.45, 0.9759, 0.2182), vec4(0.1, 0.0036, 0.2, 0.4), vec4(0.003, 3.0, 14.4, 0.006), vec2(0.0, 0.1), vec3(0.2, 0.22, 0.25), vec4(-0.8, tpB.z, tpSl.z, tpTn.z), uKind[2], 0.0);
  tpBar(vec4(-0.35, -0.15, 0.9553, -0.2955), vec4(-0.45, -0.28, 0.9689, -0.2474), vec4(0.08, 0.0042, 0.2, 0.5), vec4(0.003, 0.0, 15.8, 0.006), vec2(0.6, 0.2), vec3(0.5, 0.33, 0.22), vec4(0.9, tpB.w, tpSl.w, tpTn.z), uKind[3], 0.0);
  tpBar(vec4(0.79, -0.22, 0.2092, 0.9779), vec4(0.68, -0.29, 0.9888, 0.1494), vec4(0.15, 0.027, 0.0, 0.0), vec4(0.006, 1.0, 7.4, 0.004), vec2(0.9, 0.05), vec3(0.55, 0.31, 0.24), vec4(0.5, uPhrase, tpSl.x, tpTn.w), uKind[3], 0.0);
  tpBar(vec4(-0.2, 0.1, 0.5403, -0.8415), vec4(0.1, -0.26, 0.9888, 0.1494), vec4(0.12, 0.022, 0.25, 0.3), vec4(0.004, 0.0, 10.1, 0.016), vec2(-1.0, 0.5), vec3(0.56, 0.35, 0.23), vec4(0.6, uPhrase, tpSl.y, tpTn.w), uKind[3], 0.0);
  tpBar(vec4(0.66, -0.42, 0.9359, -0.3523), vec4(0.33, -0.1, 0.995, -0.0998), vec4(0.28, 0.031, -0.04, 0.2), vec4(0.008, 0.0, 6.6, 0.018), vec2(0.45, 0.4), vec3(0.67, 0.5, 0.33), vec4(-0.35, uTexture, tpSl.z, tpTn.x), uKind[2], 0.0);
  tpBar(vec4(0.72, -0.005, 0.9611, -0.2764), vec4(0.835, -0.035, 0.7518, -0.6594), vec4(0.2, 0.062, -0.05, 0.04), vec4(0.01, 1.0, 3.1, 0.005), vec2(0.35, 0.0), vec3(0.45, 0.48, 0.41), vec4(-0.4, uPad, tpSl.w, tpTn.x), uKind[1], 0.0);
  tpBar(vec4(0.44, 0.065, 0.9872, -0.1593), vec4(-0.4, 0.06, 0.8525, -0.5227), vec4(0.23, 0.016, 0.04, 0.3), vec4(0.016, 3.0, 9.5, 0.01), vec2(0.0, 0.0), vec3(0.21, 0.21, 0.225), vec4(0.3, uTexture, tpSl.x, tpTn.y), uKind[2], 0.0);
  tpBar(vec4(0.37, -0.135, 0.8419, -0.5396), vec4(0.16, 0.14, 0.9394, -0.3429), vec4(0.44, 0.035, 0.02, 0.12), vec4(0.012, 0.0, 2.7, 0.012), vec2(0.2, 0.05), vec3(0.34, 0.235, 0.175), vec4(-0.3, uDrone, tpSl.y, tpTn.y), uKind[0], 0.0);
  tpBar(vec4(0.6, -0.29, 0.557, 0.8305), vec4(0.5, 0.24, 0.9131, 0.4078), vec4(0.22, 0.094, 0.06, 0.0), vec4(0.022, 2.0, 1.3, 0.0), vec2(0.0, 0.0), vec3(0.36, 0.4, 0.44), vec4(0.25, uDrone, tpSl.z, tpTn.z), uKind[0], 0.0);
  tpBar(vec4(0.205, 0.0, 0.6675, -0.7446), vec4(-0.02, 0.36, 0.9872, 0.1593), vec4(0.34, 0.021, 0.05, -0.3), vec4(0.024, 0.0, 5.2, 0.03), vec2(-0.6, 0.6), vec3(0.82, 0.71, 0.55), vec4(0.28, uTexture, tpSl.w, tpTn.z), uKind[2], 0.0);
  tpBar(vec4(0.09, -0.225, 0.9131, -0.4078), vec4(0.27, 0.46, 0.8139, -0.581), vec4(0.25, 0.033, 0.0, 0.0), vec4(0.01, 3.0, 8.8, 0.024), vec2(0.5, 0.6), vec3(0.86, 0.8, 0.7), vec4(-0.35, uPhrase, tpSl.x, tpTn.w), uKind[3], 0.0);
  tpBar(vec4(0.21, -0.385, 0.9801, 0.1987), vec4(0.68, 0.48, 0.9759, -0.2182), vec4(0.19, 0.054, 0.32, 0.1), vec4(0.005, 3.0, 4.9, 0.007), vec2(0.0, 0.4), vec3(0.67, 0.665, 0.64), vec4(-0.4, uPad, tpSl.y, tpTn.w), uKind[1], 0.0);
  tpBar(vec4(0.24, -0.05, 0.9801, -0.1987), vec4(-0.61, 0.325, 0.9553, 0.2955), vec4(0.125, 0.0056, 0.2, 0.6), vec4(0.03, 0.0, 17.6, 0.007), vec2(0.0, 0.0), vec3(0.66, 0.27, 0.17), vec4(0.0, 0.0, tpSl.z, tpTn.x), uKind[4], 1.0);
  vec3 col = board, warm = mix(vec3(0.99), vec3(1.02, 0.955, 0.85), sat(0.15 + 0.2 * uLevel + 0.5 * uCue));
  vec3 dark = mix(vec3(0.88, 0.79, 0.69), vec3(0.86, 0.79, 0.71), tpE) * (mix(0.62, 0.66, tpE) + 0.1 * uCue);   // a shadow, as what it takes away
  if (tpCov > 0.0) {
    vec2 q = tpQ.xy, d = tpMd.zw, to = vec2(dot(sun, d), d.x * sun.y - d.y * sun.x);
    float hit = step(3.5, tpC.w);
    vec3 c = tpStuff(tpTone, tpMd.x, tpMd.y, q, tpQ.z, tpQ.w, tpInk);
    float rim = tpC.z * (abs(q.x) - tpQ.z > abs(q.y) - tpC.x ? sign(q.x) * to.x * (1.0 - tpE) : sign(q.y) * mix(to.y, 1.0, tpE));
    // lying, a strip curls towards the window at one end and away at the other
    if (uOwn[2] < 0.0 || uOwn[5] > 0.0) c = mix(c, tpTone, 0.7 * max(uOwn[5], 0.0));
    float lit = 1.0 - 1.9 * tpC.y * q.x / tpQ.z * to.x;
    // standing, we see the side turned to us, in the sun or against it
    float side = (d.x < 0.0 ? 1.0 : -1.0) * dot(vec2(-2.0 * tpC.y * q.x, 1.0), to);
    if (uOwn[2] < 0.0) { side = (d.x < 0.0 ? 1.0 : -1.0) * dot(vec2(-2.0 * tpC.y * q.x - tpSl2, 1.0), to) / sqrt(1.0 + tpSl2 * tpSl2); lit *= 1.0 + 0.14 * clamp(tpSl2, -1.5, 1.5) * to.x; }
    vec3 stand = vec3(0.60, 0.62, 0.66) + 0.18 * exp(-(q.y + tpC.x) / 0.05) + tpDay * 0.62 * max(side, 0.0);
    stand += (0.25 + c) * tpDay * max(-side, 0.0) * 0.65 * (tpC.w - 4.0 * hit);       // and the sun behind it, through it
    c *= mix(vec3(lit) * (1.0 - (1.0 - tpDay) * dark) * tpAo, stand, tpE);
    c *= 1.0 + (rim > 0.0 ? 0.25 + 0.3 * tpE : 0.45) * rim;
    c += max(rim, 0.0) * (0.05 + 0.1 * tpE * tpDay) + hit * uHits * vec3(0.5, 0.34, 0.16) * (0.5 + 0.5 * uEnergy);
    if (uOwn[5] > 0.0) c = mix(c, c * 0.9 + 0.16 * tpC.z * (0.3 + tpDay) + tpInk * 0.16 * (0.3 + tpQ.w) * tpDay + 0.05 * (1.0 - smoothstep(0.0, 0.25, abs(fract(q.x * 1.7 + q.y * 3.0 + tpMd.y) - 0.5))), uOwn[5]);
    if (uOwn[6] > 0.0) c = mix(c, mix(vec3(tpGrey(tpInk)), tpInk, 0.85) * (0.4 + 0.2 * tpC.z + 0.75 * tpQ.w) * (0.75 + 0.35 * tpGrey(c)) + (0.04 + 0.3 * tpQ.w) * (1.0 - smoothstep(0.0, 1.0, abs(q.y) / max(tpC.x, 1e-3))) * mix(tpInk, vec3(0.9), 0.4), uOwn[6]);
    vec3 un = uOwn[6] > 0.0 ? tpUnder * (1.0 - 0.9 * uOwn[6]) + tpHalo * (0.3 + board) : tpUnder;
    col = mix(un, c, tpCov);
  } else col *= (1.0 - (1.0 - tpDay) * dark) * tpAo;
  if (uOwn[6] > 0.0 && tpCov <= 0.0) col = col * (1.0 - 0.9 * uOwn[6]) + tpHalo * (0.3 + board);
  float day = 1.0 + 0.1 * dot(p, sun) - 0.06 * dot(p, p);
  col *= day * warm;
  if (haze > 0.0) col = mix(col, mix(vec3(tpGrey(board)), board, 0.5) * 0.9 + 0.06, haze * uOwn[7]);
  // and the bar of light the kicked one throws, sliding off over the board
  vec2 t = rot(-0.42) * (p - mix(vec2(0.1, 0.1), vec2(-0.2, -0.24), tpE) - vec2(-0.45, 0.1) * (1.0 - uHits));
  float bar = tpSoft(abs(t.y) - 0.045, 0.02) * tpSoft(abs(t.x) - 0.24, 0.05);
  return mix(col, min(col * vec3(1.26, 1.18, 1.06) + vec3(0.06, 0.035, 0.01), vec3(1.0, 0.965, 0.88)), bar * uHits * (0.6 + 0.4 * uEnergy));
}
vec3 render(vec2 p) {
  float wide = uRes.x / uRes.y, narrow = sat((1.2 - wide) / 0.6), fit = 1.0 + 0.55 * narrow;
  p = p * fit + vec2(0.28 * narrow, 0.0);
  tpPx = fit / uRes.y;
  tpGain = 0.55 + uEnergy;
  tpKick = 4.0 * uHits * (1.0 - uHits);
  tpCue = 4.0 * uCue * (1.0 - uCue);
  tpSl = 0.022 * sin(uTime * vec4(0.043, 0.037, 0.051, 0.033) + vec4(0.6, 2.9, 4.4, 1.7)) + 0.026 * sin(uTravel * vec4(0.11, 0.09, 0.07, 0.13) + vec4(1.3, 5.2, 3.1, 0.2));
  tpTn = 0.022 * sin(uTime * vec4(0.031, 0.027, 0.036, 0.023) + vec4(2.0, 0.4, 5.1, 3.3));
  tpB = 0.65 * vec4(uBands[1], uBands[4], uBands[7], uBands[11]) + 0.6 * uKeys;
  tpE = step(0.5, uVar);
  return tpPicture(p);
}
