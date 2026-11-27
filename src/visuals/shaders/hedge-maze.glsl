// name: Hedge maze
// a: Fogged lanes
// b: Clipped court
// what: A round maze of clipped yew seen from a low tower after dawn, its lanes full of white mist, a pale pavilion in the middle and one lantern walking in; or a formal court on a still afternoon, box clipped to cones, balls and a spiral on pale gravel, their shadows all one way, and a canal leading to a jet of water.
// follows: The drone is the height of the mist, the pad the sun, texture the dew, the phrase a breath through the lanes. Each kind colours a quarter of the maze, or its own clipped bodies. The bands swell sixteen yew balls, or raise sixteen jets. The loop walks the lantern, or a glint on the water. A hit puts up a bird; a cue sends a ring or band of light across.
// own: 0 snow on the hedges at -1, rust-red beech at 1; 1 moonlit night at -1, low rose sun at 1; 2 a squared-off maze, or bodies all rounded to eggs, at -1; winding hedges, or bodies all spires, at 1; 3 the eye low at -1, high over the plan at 1; 4 lanes almost clear of mist, or a court of mown grass, at -1; mist to the brim, or fog in the court, at 1; 5 thin hedges and slim bodies at -1, stout ones at 1.
const float hmH = 1.5, hmS = 2.3, hmN = 7.0;  // how tall the hedges are, how far from ring to ring, the last ring
vec3 hmSun, hmSunC, hmAmb, hmHaze;    // where the sun is, its light, the light of the sky, the far air
float hmThick, hmPx, hmNap, hmNight, hmRose, hmSnow, hmRust, hmFog, hmDry, hmSq, hmWind;  // then the other worlds, 0 to 1
// Falls from 1 at lo to 0 at hi.
float hmOff(float hi, float lo, float x) { return 1.0 - smoothstep(lo, hi, x); }
// A soft edge, w wide; 1 where d is below 0.
float hmIn(float d, float w) { w = max(w, 1e-5); return hmOff(w, -w, d); }
#define HM_IF(x) for (int go = (x) ? 0 : 1; go < 1; go++)
float hmLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
// A soft hill, 1 at 0.
float hmBell(float x2) { x2 = 1.0 / (1.0 + x2); return x2 * x2; }
float hmFar(float x) { x = max(x, 0.0); return x / (1.0 + x); }
float hmOwn(float o, float lo, float hi) { return o * (o > 0.0 ? hi : lo); }
float hmHump(float c) { return 4.0 * c * (1.0 - c); }
float hmNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  vec4 n = fract((i.x + 57.0 * i.y + vec4(0.0, 1.0, 57.0, 58.0)) * 0.1031);
  n *= n + 33.33; n = fract(n * (n + n));
  vec2 m = mix(n.xz, n.yw, f.x);
  return mix(m.x, m.y, f.y);
}
// The shape of the rings: 1 is round.
float hmShape(vec2 d, float a) {
  float k = 1.0;
  HM_IF(uOwn[2] != 0.0) {
    vec2 m = rot(0.5) * d; m *= m; m *= m;
    k = mix(1.0, 1.12 * sqrt(sqrt(m.x + m.y)), hmSq) * (1.0 + 0.085 * hmWind * cos(a * 7.0));
  }
  return k;
}
// The opening the path takes through ring k, an angle from the tower's side.
float hmGate(float k) { return (fract(k * 0.5) < 0.25 ? -1.5 : 1.5) / k; }
// The angle of a direction, as atan(v.y, v.x).
float hmAngle(vec2 v) {
  vec2 b = abs(v);
  float m = min(b.x, b.y) / max(max(b.x, b.y), 1e-4), s = m * m, r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * m + m;
  r = b.y > b.x ? 0.5 * PI - r : r;
  r = v.x < 0.0 ? PI - r : r;
  return v.y < 0.0 ? -r : r;
}
// How far q is from the hedges on the plan, below 0 inside.
float hmPlan(vec2 q) {
  float len = length(q) + 1e-4, a = hmAngle(vec2(-q.y, q.x));
  float r = len * hmShape(q / len, a), k = clamp(floor(r / hmS + 0.5), 2.0, hmN), j = max(floor(r / hmS), 1.0), odd = fract(j * 0.5) < 0.25 ? 1.0 : -1.0;
  // two openings in the ring, two hedges across the lane
  vec4 w = vec4(hmGate(k), 0.9 + 2.0 * fract(k * 0.618), odd * (0.45 + 1.0 / j), -odd * (2.0 + fract(j * 0.618))) - a;
  w = abs(w - TAU * floor(w / TAU + 0.5)) * r;
  vec2 m = vec2(abs(r - k * hmS) - hmThick, 0.85 - min(w.x, w.y)) + 0.14;
  float d = min(max(m.x, m.y), 0.0) + length(max(m, 0.0));
  if (j > 1.5 && j < hmN) d = min(d, min(w.z, w.w) - hmThick + 0.14);
  return d - 0.14;
}
// The tops of trees.
float hmCrown(float u) { float c = 2.0 * fract(u) - 1.0; return (0.5 + fract(floor(u) * 0.618)) * (1.0 - c * c); }
float hmArc(float x) { return sqrt(max(1.0 - x * x, 0.0)); }
// Half the width of a body at height y. kind: 0 cone, 1 ball on a stem, 2 spiral, 3 tiers, 4 waisted, 5 dome.
float hmBody(float y, float h, float w, int kind) {
  float s = sat(y / h), r;
  if (kind == 0 || kind == 2) r = (1.0 - s) * (0.94 + 0.06 * s) + 0.05 * sqrt(1.0 - s);
  else if (kind == 1) r = max(hmArc((y - h) / w + 1.0), y < h - w ? 0.16 : 0.0);
  else if (kind == 3) {
    float k = min(floor(s * 3.0), 2.0), f = 2.0 * (s * 3.0 - k) - 1.0;
    r = max((1.0 - 0.3 * k) * hmArc(f * f), k > 1.5 && f > 0.0 ? 0.0 : 0.14);
  } else if (kind == 4) r = (0.56 + 0.4 * cos(s * 6.6) - 0.16 * s) * hmArc(s * s * s * s);
  else r = hmArc(s);
  r = mix(r, hmArc(2.0 * s - 1.0), hmSq);
  r = mix(r, 0.75 * (1.0 - s), hmWind);
  return y > h ? 0.0 : r * w;
}
// Leaves in the light; n is tipped by them.
vec3 hmLeaf(vec3 P, vec3 n, float lit, float t) {
  float fine = 1.0 / (1.0 + 0.004 * t * t), big = hmNoise(P.xz * 1.3 + P.y * 2.0), sharp = hmNoise(P.xz * 37.0 + P.y * vec2(-31.0, 35.0));
  hmNap = hmNoise(P.xz * 13.0 + P.y * vec2(9.0, 11.0)) * 0.5 + sharp * 0.5;
  float nap = mix(0.5, hmNap, 0.25 + 0.75 * fine);
  n = normalize(n + (vec3(nap, 0.5, 1.0 - hmNap) - 0.5) * 0.9 * fine);
  vec3 alb = mix(vec3(0.026, 0.06, 0.026), vec3(0.06, 0.1, 0.034), sat(big * 0.7 + nap * 1.1 - 0.4));
  alb = mix(alb, vec3(0.26, 0.085, 0.02) * (0.5 + nap), hmRust);
  alb = mix(alb, vec3(0.8), hmSnow * (0.1 + 0.9 * smoothstep(0.25, 0.85, n.y + nap * 0.8 - 0.4)));
  float sun = smoothstep(-0.02, 0.95, dot(n, hmSun)) * lit;
  vec3 c = alb * hmAmb * (0.5 + 0.5 * n.y) * (0.5 + 0.9 * nap);
  c += (alb + vec3(0.04, 0.034, 0.012) * (1.0 - hmSnow)) * hmSunC * sun * (0.3 + 1.5 * nap);
  float dew = smoothstep(0.9, 1.0, sharp);
  return c + dew * fine * (0.6 * uTexture + 4.0 * uKeys) * (0.15 + sun) * vec3(1.0, 0.93, 0.78);
}
// A round pavilion, u across and v up from its foot, in units of its half width.
vec4 hmPavilion(float u, float v, float px) {
  float ax = abs(u), between = hmIn(max(v - 1.5, 0.2 - v), px), cov = hmIn(ax - 0.86, px) * between;
  vec3 stone = vec3(0.9, 0.85, 0.76), c = hmAmb * 0.13 + vec3(1.0, 0.6, 0.25) * (0.12 + 0.8 * uMic + 0.7 * uCue + 0.9 * hmNight) * hmBell(u * u + (v - 0.8) * (v - 0.8));
  for (int i = 0; i < 6; i++) {
    float x = u - 0.95 * sin((float(i) - 2.5) * 0.52), m = hmIn(abs(x) - 0.085, px) * between;
    c = mix(c, stone * (hmAmb * 0.42 + hmSunC * 0.5 * smoothstep(-0.06, 0.08, -x)), m); cov = max(cov, m);
  }
  float beam = min(max(ax - 1.15, abs(v - 0.04) - 0.16), max(ax - 1.08, abs(v - 1.6) - 0.12)), dome = max(length(vec2(u, (v - 1.72) * 1.18)) - 0.97, 1.7 - v);
  float rest = hmIn(min(beam, min(dome, length(vec2(u, (v - 2.6) * 0.6)) - 0.09)), px);
  c = mix(c, stone * (hmAmb * 0.42 + hmSunC * 0.7 * smoothstep(-0.35, 1.0, -u * 0.9)) * (v > 1.72 ? vec3(0.72, 0.86, 0.92) : vec3(1.0)), rest);
  return vec4(c, max(cov, rest));
}
vec3 hmMaze(vec2 p) {
  vec3 ro = vec3(0.0, 6.0 + hmOwn(uOwn[3], 2.1, 7.0), 0.0), rd = normalize(vec3(p, 1.1));
  rd.yz = rot(-0.335 - hmOwn(uOwn[3], 0.12, 0.24)) * rd.yz;
  rd.xz = rot(0.05 * sin(uTravel * 0.025) + 0.02 * sin(uTime * 0.02)) * rd.xz;
  vec2 C = vec2(3.3, 15.6);
  hmPx = 0.91 / uRes.y;
  hmThick = 0.4 + hmOwn(uOwn[5], 0.16, 0.24);
  vec3 haze = hmHaze * (0.8 + 0.2 * uPad) + hmSunC * 0.32 * hmOff(0.35, -0.75, rd.x), col = haze;
  float thin = 0.01 + 0.02 * uSpace + 0.008 * uOwn[4], flat_ = length(rd.xz), sl = rd.y / flat_;
  // the sky, and the wood behind in three depths of mist
  HM_IF(sl > -0.065) {
    col = mix(haze, hmAmb * vec3(0.6, 0.72, 0.9), 0.6 * smoothstep(0.03, 0.5, sl));
    for (int i = 0; i < 3; i++) {
      float fi = float(i), w = rd.x / rd.z * (26.0 - 6.0 * fi) + fi * 13.3, base = 0.09 - 0.045 * fi;
      float leaf = hmNoise(vec2(w * 6.0, sl * 130.0)), slow = hmNoise(vec2(w * 0.8, fi));
      float top = base + 0.02 * slow + 0.02 * hmCrown(w + slow);
      vec3 tc = mix(hmAmb * vec3(0.10, 0.14, 0.13) * (0.4 + 0.9 * leaf), haze, 0.62 - 0.17 * fi);
      col = mix(col, mix(tc, haze, hmOff(0.0, -0.06, sl - base)), hmIn(sl - top, hmPx * 2.0));
    }
    col = mix(col, haze, hmOff(-0.03, -0.06, sl));
  }
  // the lantern, from the gate in to the middle and out again
  float way = 3.0 - 3.0 * cos(TAU * uLoop), done = min(floor(way), 5.0), part = way - done, ring = hmN - done;
  float la = mix(ring > 6.5 ? 0.0 : hmGate(ring + 1.0), hmGate(ring), smoothstep(0.0, 0.8, part));
  vec2 lan = vec2(sin(la), -cos(la));
  lan *= (ring + 0.5 - smoothstep(0.8, 1.0, part)) * hmS / hmShape(lan, la);
  vec3 lamp = vec3(1.5, 0.66, 0.16) * (0.4 + 0.35 * uEnergy + 0.5 * uLevel + 1.3 * hmNight);
  float tScene = 1e3, down = max(-rd.y, 0.05), t0 = (ro.y - hmH) / down;
  vec2 q0 = ro.xz + rd.xz * t0 - C, to = normalize(hmSun.xz);
  float ball = 0.0, bt = 0.0, br = 1.0; vec3 bo = vec3(0.0);
  float mistY = 0.66 + 0.26 * uDrone + 0.06 * sin(uTime * 0.13) + 0.34 * hmFog;
  float thick = (1.7 + 1.2 * uDrone) * (1.0 - 0.5 * hmHump(uCue)) * (1.0 + hmOwn(uOwn[4], 0.97, 0.6));
  vec3 hc = vec3(0.0), P = ro, n = vec3(0.0, 1.0, 0.0);
  vec2 q = q0, g = vec2(0.0), qm = q0 + rd.xz * (hmH - mistY) / down;
  float t = t0, d = 1.0, d0 = 1.0, got = 0.0, fill = 0.0, lit = 1.0, high = 1.0, inner = 0.0, mn = 0.0, rm = 0.0, breath = 0.0;
  bool land = rd.y < -0.06, roof = false;
  HM_IF(land) {
    // the mist's top, with a breath rolling outward through it
    vec2 mw = uTime * vec2(0.035, 0.02);
    rm = length(qm);
    mn = 0.6 * hmNoise(qm * 0.45 + mw) + 0.4 * hmNoise(qm * 1.3 - mw * 1.4 + 0.8 * sin(qm.yx));
    breath = uPhrase * (0.5 + 0.5 * sin(rm * 0.75 - uTime * 0.55));
    mistY += (mn - 0.5) * 0.5 + 0.2 * breath - 0.3 * hmHump(uCue);
    float yFloor = max(0.0, mistY - 4.5 * down / max(thick, 0.02)), tEnd = t0 + max((hmH - yFloor) / down, 0.01);
    for (int i = 0; i < 18 && got < 0.5 && t < tEnd; i++) {
      if (i > 0) t += max(d, 0.04) * 0.9 / flat_;
      d = hmPlan(ro.xz + rd.xz * t - C);
      if (i < 1) { d0 = d; roof = d <= 0.0; }
      got = d < 0.015 && t < tEnd ? 1.0 : 0.0;
    }
    t = tScene = min(t, tEnd);
    P = ro + rd * t; q = P.xz - C;
    float len = max(mistY + 0.1 - max(P.y, yFloor), 0.0) / down;
    fill = 1.0 - hmBell(0.5 * thick * len * len / (len + 0.3));
    // the hedge's slope, then the sun that gets in there
    float e = 0.05 + 0.002 * t, yl = mix(P.y, mistY, fill);
    vec2 ql = mix(q, qm, fill);
    for (int i = 0; i < 6 && (i < 2 || !(roof || t > 42.0)); i++) {
      float s = float(i - 1); s = 0.28 * s + 0.13 * s * s;
      float v = hmPlan(i < 1 ? q + vec2(e, 0.0) : i < 2 ? q + vec2(0.0, e) : ql + to * s);
      if (i < 2) g[i] = v - d;
      else lit *= 1.0 - hmOff(0.08, -0.16, yl + s * hmSun.y / length(hmSun.xz) - hmH) * hmOff(0.1, -0.18, v);
    }
    g /= length(g) + 1e-4;
    high = roof ? 1.0 : hmOff(0.35, 0.0, hmH - P.y);
    inner = roof ? hmOff(0.0, -0.26, d0) : 0.0;
    n = normalize(vec3(g.x * (1.0 - inner), 0.15 + 0.75 * high * high + 2.0 * inner, g.y * (1.0 - inner)));
  }
  float wide = clamp(fwidth(d0), 0.002, 0.3);
  // sixteen balls stand on the hedges, one for each band
  vec2 dir = vec2(0.1275, 0.9918);
  for (int i = 0; i < 16; i++) {
    vec2 at = C + dir * (6.0 - 2.0 * float(i % 3)) * hmS / hmShape(dir, hmAngle(vec2(-dir.y, dir.x)));
    vec2 e = rot(0.18264) * vec2(abs(dir.x), dir.y); dir = vec2((i & 1) < 1 ? -e.x : e.x, e.y);
    float b = (0.45 + 0.34 * uBands[i]) * (1.0 + 0.2 * uOwn[5]);
    vec3 o = vec3(at.x, hmH + 0.7 * b, at.y) - ro;
    float tb = dot(o, rd), px = hmPx * tb * 1.2, cov;
    vec3 off = rd * tb - o;
    cov = hmIn(length(off) - b, px);
    if (cov > 0.01 && tb > 1.0 && tb < tScene + 0.9) { ball = cov; bt = tb; bo = off; br = b; }
  }
  // the leaves: of the hedge, then of a ball
  vec3 bc = vec3(0.0);
  for (int i = got > 0.5 && fill < 0.98 ? 0 : 1; i < (ball > 0.01 ? 2 : 1); i++) {
    vec3 at = P, nn = n;
    if (i > 0) { nn = (bo - rd * br * hmArc(length(bo) / br)) / br; at = ro + rd * bt + nn * br * 2.0; }
    vec3 c = hmLeaf(at, nn, i > 0 || roof ? 1.0 : lit, i > 0 ? bt : t);
    if (i > 0) bc = c;
    else {
      // gold on the corner to the sun; a cue is a ring of light closing in
      float face = sat(dot(g, to) + 0.15), ringAt = length(q) - 13.0 * uCue;
      c += hmSunC * vec3(0.2, 0.15, 0.05) * face * (roof ? 1.0 - inner : lit * (0.35 + 0.65 * high)) * (0.25 + hmNap);
      c += hmSunC * uCue * hmBell(0.2 * ringAt * ringAt) * 0.25 * hmNap * high;
      hc = c * (roof ? 1.0 : mix(0.4, 1.0, smoothstep(0.1, hmH, P.y)));
    }
  }
  HM_IF(land) {
    if (got < 0.5) hc = mix(vec3(0.40, 0.34, 0.26), vec3(0.75), hmSnow) * (0.7 + 0.5 * mn) * (hmAmb * 0.7 + hmSunC * lit * 0.4);
    // the mist: blue in shade, gold in the sun, and the colours of what sounds
    vec3 mist = vec3(0.70, 0.76, 0.88) * hmAmb * (0.6 + 0.35 * mn) + hmSunC * (0.02 + 0.55 * lit) * (0.55 + 0.6 * mn), tint = vec3(0.0);
    float held = 1e-3;
    for (int i = 0; i < 4; i++) {
      float w = sat(0.25 + dot(qm / (rm + 0.1), vec2(i == 0 || i == 3 ? -0.7 : 0.7, i < 2 ? -0.7 : 0.7))); w = w * w * hmLv(i);
      tint += uKind[i] * w; held += w;
    }
    mist *= mix(vec3(1.0), tint / held * 1.2 + 0.15, sat(held * 0.85) * hmOff(17.5, 14.0, rm));
    vec3 pc = piece(vec2(0.5 + qm.x / 30.0, 0.5 - qm.y / 32.0)).rgb;
    mist += pc * (0.2 + pc * 0.3) * (0.35 + 0.9 * uEnergy) + hmSunC * breath * 0.12;
    vec2 hq = qm - vec2(-4.6 + 2.5 * sin(uTime * 0.037), -8.2);
    float hd = length(hq);
    mist += mix(vec3(1.4, 1.0, 0.6), uKind[4], 0.5) * uHits * hmBell(hd * hd * 0.2) * 1.5;
    hd = rm - 13.0 * uCue; hq = qm - lan;
    mist += vec3(1.0, 0.6, 0.2) * uCue * hmBell(0.25 * hd * hd) + lamp * 1.5 * hmBell(dot(hq, hq) * 0.9);
    hc += lamp * 0.16 * hmBell(0.4 * dot(q - lan, q - lan)) * (roof ? 0.3 : 1.0);
    col = mix(hc, mist, fill);
    float rim = hmOff(wide, 0.0, d0) * smoothstep(0.05, 0.3, t - t0) * hmOff(0.1, -0.3, mistY - hmH);
    col = mix(col, (hmAmb + hmSunC) * vec3(0.04, 0.048, 0.025), rim * 0.8);
    col = mix(col, haze, max(0.9 * hmFar((t - 9.0) * thin), smoothstep(32.0, 46.0, t)));
  }
  // the pavilion
  vec2 toC = normalize(C);
  float tc = length(C) / max(dot(rd.xz, toC), 1e-3);
  vec2 pq = vec2(dot(rd.xz, vec2(toC.y, -toC.x)) * tc, ro.y + rd.y * tc) / 1.12;
  HM_IF(tc < tScene + 2.5 && abs(pq.x) < 1.3 && pq.y > -0.1 && pq.y < 3.2) {
    vec4 pv = hmPavilion(pq.x, pq.y - 0.15, hmPx * tc);
    col = mix(col, mix(pv.rgb, haze * 0.9, 0.04 + hmOff(0.75, 0.05, pq.y) * 0.75 * (1.0 + min(uOwn[4], 0.0))), pv.a);
  }
  col = mix(col, mix(bc, haze, 0.9 * hmFar((bt - 9.0) * thin)), ball);
  // the lantern itself, over the mist
  vec3 toL = vec3(lan.x + C.x, hmH - 0.15, lan.y + C.y) - ro;
  float tl = dot(toL, rd), far = length(toL - rd * tl), seen = smoothstep(-0.2, 0.5, tScene - tl + 0.6);
  col += lamp * (0.3 * hmBell(far * far * 3.0) * (0.35 + 0.65 * seen) + 3.0 * hmOff(0.12 + hmPx * tl, 0.05, far) * seen);
  return col;
}
// The bodies of the court: across, away, height, twice the kind plus half the width.
const vec4 hmB[7] = vec4[7](vec4(-2.15, 3.7, 4.5, 1.25), vec4(1.35, 4.5, 0.95, 10.52), vec4(1.5, 8.4, 2.3, 2.85), vec4(-1.35, 10.5, 3.6, 4.95), vec4(-5.6, 12.5, 2.5, 3.0), vec4(0.1, 15.0, 3.1, 9.0), vec4(4.0, 17.0, 3.0, 7.15));
int hmKind, hmK; float hmTall, hmW;
vec2 hmPick(int i) {
  vec4 B = hmB[i];
  hmKind = int(B.w * 0.5); hmK = i & 3; hmTall = B.z;
  hmW = (B.w - 2.0 * float(hmKind)) * (1.0 + 0.35 * uOwn[5]);
  return B.xy;
}
float hmBank(float z) { return 1.6 + 0.28 * z; }
// The court's end.
vec3 hmEnd(vec3 ro, vec3 rd, float soft) {
  float w = rd.x / max(rd.z, 0.1), sl = rd.y / max(rd.z, 0.1), leaf = hmNoise(vec2(w * 60.0, sl * 90.0));
  float cl = hmNoise(vec2(w * 2.4 + uTime * 0.004, sl * 11.0));
  float up = max(rd.y, 0.0), m = sat(dot(rd, hmSun)); m *= m * m;
  vec3 c = mix(vec3(1.5, 1.25, 1.0), vec3(0.42, 0.62, 0.92), smoothstep(0.0, 0.5, up) * (1.0 - 0.5 * smoothstep(0.45, 0.8, cl)));
  c = mix(c, vec3(1.35, 0.8, 0.6) * (1.0 - up), hmRose * 0.8);
  c = mix(c, vec3(0.05, 0.075, 0.13) * (1.0 - up), hmNight) + hmSunC * (0.08 * m + 0.3 * m * m * m * m);
  float top = 0.085 + 0.07 * hmNoise(vec2(w * 2.6, 1.0)) + 0.022 * hmCrown(w * 17.0 + cl);
  vec3 tc = (hmAmb * 0.14 + hmSunC * 0.05 * hmOff(0.06, 0.0, top - sl)) * vec3(0.9, 1.1, 0.8) * (0.3 + leaf);
  c = mix(c, mix(tc, hmHaze, 0.42 + 0.25 * uSpace), hmIn(sl - top, soft));
  float t = 38.0 / max(rd.z, 0.1), x = ro.x + rd.x * t, y = ro.y + rd.y * t, s = soft * t, cx = abs(fract(x / 4.4 + 0.18) * 4.4 - 2.2);
  float arch = length(vec2(cx, max(y - 1.7, 0.0))) - 0.8;
  float wall = min(max(y - 3.5, -arch), length(vec2(cx - 2.2, y - 3.9)) - 0.5);
  vec3 wc = (hmAmb * vec3(0.04, 0.07, 0.04) + hmSunC * vec3(0.014, 0.013, 0.005) * smoothstep(2.6, 4.2, y)) * (0.6 + 0.8 * leaf);
  return mix(c, mix(wc, hmHaze, sat(0.14 + 0.2 * uSpace + 0.4 * uOwn[4])), hmIn(wall, s));
}
vec3 hmCourt(vec2 p) {
  vec3 ro = vec3(0.12 * sin(uTravel * 0.02), 2.2 + hmOwn(uOwn[3], 1.0, 3.2), 0.0);
  vec3 rd = normalize(vec3(p.x, p.y - 0.12 - hmOwn(uOwn[3], 0.02, 0.12), 1.2)), col = vec3(0.0);
  hmPx = 0.83 / uRes.y;
  float thin = 0.012 + 0.014 * uSpace + 0.07 * hmFog;
  // the clipped bodies, from the near ones to the far
  vec3 fore = vec3(0.0); float left = 1.0;
  for (int i = 0; i < 7 && left > 0.01; i++) {
    vec2 at = hmPick(i), to = at - ro.xz;
    float h = hmTall, w = hmW, far = length(to);
    to /= far; vec2 ac = vec2(to.y, -to.x);
    float run = max(dot(rd.xz, to), 0.05), e = -rd.y / run;
    float u = dot(rd.xz, ac) * far / run, v = ro.y + rd.y * far / run;
    HM_IF(abs(u) < w * 1.12 && v < h + 0.1 && v > -w * max(e, 0.0) - 0.1) {
      float y = min(v, h * 0.9), r = 0.0, z = 0.0, ry = 0.0;
      for (int j = 0; j < 5; j++) {
        float b = hmBody(max(j < 3 ? y : j < 4 ? y + 0.03 : y - 0.03, 0.0), h, w, hmKind);
        if (j < 3) { r = b; z = r * hmArc(u / max(r, 1e-3)); y = min(mix(y, v + z * e, 0.75), h * 0.998); }
        else ry += (j < 4 ? b : -b) / 0.06;
      }
      ry = clamp(ry, -3.0, 3.0);
      float c = clamp(u / max(r, 1e-3), -1.0, 1.0), th = asin(c), cut = 0.0;
      if (hmKind == 2) {
        float form = 1.0 - 0.7 * abs(uOwn[2]), f = fract(y / h * 4.5 - th / TAU);
        r *= 1.0 - 0.34 * form * (1.0 - smoothstep(0.0, 0.14, f) * hmOff(1.0, 0.45, f));
        cut = (0.55 - f) * 1.6 * form;
      }
      float tb = (far - z) / run, soft = hmPx * tb * sqrt(1.0 + ry * ry) + 0.011;
      float cov = hmIn(abs(u) - r, soft) * smoothstep(-0.01, 0.02 + hmPx * tb, y) * hmIn(v + z * e - h - 0.03, 0.03);
      c = clamp(u / max(r, 1e-3), -1.0, 1.0);
      vec2 side = ac * c - to * hmArc(c);
      vec3 n = normalize(vec3(side.x, cut - ry, side.y));
      vec3 lc = hmLeaf(ro + rd * tb, n, 1.0, tb) * (0.5 + 0.5 * smoothstep(0.0, 0.7, y));
      lc += hmAmb * vec3(0.05, 0.045, 0.03) * hmOff(1.0, 0.0, y) * (0.5 + hmNap);
      lc += uKind[hmK] * uKind[hmK] * hmLv(hmK) * (0.05 + 0.2 * hmNap * smoothstep(-0.4, 0.7, dot(n, hmSun))) * (0.5 + uEnergy);
      fore += left * cov * mix(lc, hmHaze, hmFar((tb - 6.0 + 5.0 * hmFog) * thin * 1.3));
      left *= 1.0 - cov;
    }
  }
  float t = ro.y / max(-rd.y, 1e-3);
  vec3 P = ro + rd * t;
  float ca = P.x - hmBank(P.z), edge = 0.02 + hmPx * t * 2.0;  // across the canal
  bool ground = rd.y < 0.0 && P.z < 38.0;
  float canal = ground ? smoothstep(0.0, edge, min(ca, 2.7 - ca)) * hmOff(35.5, 35.0, P.z) : 0.0;
  HM_IF(left > 0.01 && (!ground || canal > 0.0)) {
    vec3 rr = rd;
    float rip = hmNoise(vec2(P.x * 3.0, P.z * 1.6 - uTime * 0.16)) - 0.5 + 0.6 * (hmNoise(vec2(P.x * 9.0 + uTime * 0.1, P.z * 4.0)) - 0.5);
    if (ground) { rr.y = abs(rd.y) + rip * 0.05 * (0.4 + uMid); rr.x += rip * 0.02; }
    col = hmEnd(ro, rr, hmPx * (ground ? 6.0 : 1.5));
    if (ground) {
      col = mix(vec3(0.05, 0.09, 0.09) * hmAmb, col, 0.5 + 0.35 * sat(1.0 - 2.0 * abs(rd.y)));
      // a glint goes up the canal and back with the loop
      float gl = P.z - 16.0 + 9.0 * cos(TAU * uLoop);
      col += uKind[0] * uDrone * 0.12 * (0.6 + rip) + hmSunC * 0.5 * (hmBell(gl * gl * 0.2) + uKeys) * smoothstep(0.1, 0.5, rip);
    }
  }
  HM_IF(left > 0.01 && ground && canal < 1.0) {
    // the gravel, with every shadow lying one way
    float g1 = hmNoise(P.xz * vec2(1.3, 0.8)), g2 = mix(0.5, hmNoise(P.xz * 34.0), 1.0 / (1.0 + 0.02 * t * t));
    vec3 alb = vec3(0.62, 0.54, 0.43) * (0.78 + 0.2 * g1 + 0.3 * g2), kc = vec3(0.0);
    alb = mix(alb, vec3(0.13, 0.19, 0.06) * (0.9 + 0.5 * sat(4.0 * sin(P.x * 2.6))), hmDry);
    alb = mix(alb, vec3(0.75, 0.72, 0.66), hmIn(max(-0.32 - ca, ca - 3.02), edge));
    alb = mix(alb, vec3(0.85, 0.87, 0.9) * (0.85 + 0.2 * g1), hmSnow);
    vec2 to = normalize(hmSun.xz);
    float sun = 1.0, rise = hmSun.y / length(hmSun.xz);
    for (int i = 0; i < 7; i++) {
      vec2 w = hmPick(i) - P.xz;
      float al = dot(w, to), side = abs(dot(w, vec2(to.y, -to.x)));
      HM_IF(al > -hmW && al * rise < hmTall && side < hmW * 1.2) {
        float sf = (0.015 + 0.03 * max(al, 0.0)) * (1.0 + 4.0 * hmFog), dark = hmIn(side - hmBody(max(al * rise, 0.0), hmTall, hmW, hmKind), sf) * smoothstep(-hmW, 0.0, al);
        sun *= 1.0 - dark;
        kc += uKind[hmK] * hmLv(hmK) * dark;
      }
      sun *= 1.0 - 0.45 * hmBell(2.0 * max(dot(w, w) / (hmW * hmW) - 0.8, 0.0));
    }
    vec3 pc = piece(vec2(0.5 + P.x / 16.0, 1.07 - P.z / 30.0)).rgb;
    vec3 c = alb * (hmAmb * (0.3 + 0.2 * hmFog) + hmSunC * sun * 0.52 + (kc + pc * (0.4 + 0.6 * sun)) * (0.25 + 0.5 * uEnergy));
    float pass = P.z - mix(34.0, 2.0, uCue);
    c *= 1.0 + 0.8 * uCue * hmBell(pass * pass * 0.03);
    col = mix(mix(c, hmHaze, hmFar((t - 6.0) * thin * 1.3)), col, canal);
  }
  // a jet for each band, and the tall one
  HM_IF(left > 0.01 && p.x > 0.05 && p.y < 0.4) {
    float fall = 0.6 + 0.6 * hmNoise(vec2(p.x * 150.0, p.y * 60.0 - uTime * 0.6));
    for (int i = 0; i < 17; i++) {
      bool tall = i == 16;
      float z = tall ? 34.0 : 32.0 - 1.55 * float(i), h = tall ? 5.2 + 2.5 * hmHump(uCue) : 0.35 + 1.5 * uBands[i];
      vec2 q = (ro + rd * (z / rd.z)).xy - vec2(hmBank(z) + 1.35, 0.0);
      HM_IF(abs(q.x) < 1.3 && q.y < h && q.y > 0.0) {
        float v = q.y / h, wide = (tall ? 0.12 : 0.035) * (1.0 + 2.0 * v) + hmPx * z * 0.7;
        float m = hmBell(q.x * q.x / (wide * wide)) * hmOff(1.0, 0.75, v) * fall;
        col = mix(col, hmAmb * 0.75 + hmSunC * 0.35, sat(m));
      }
      if (i == 12) col += mix(vec3(1.0), uKind[4], 0.5) * uHits * hmBell(dot(q, q) * 0.5) * 2.4;
    }
  }
  return fore + left * col;
}
vec3 render(vec2 p) {
  hmSnow = max(-uOwn[0], 0.0); hmRust = max(uOwn[0], 0.0); hmNight = max(-uOwn[1], 0.0); hmRose = max(uOwn[1], 0.0);
  hmSq = max(-uOwn[2], 0.0); hmWind = max(uOwn[2], 0.0); hmDry = max(-uOwn[4], 0.0); hmFog = max(uOwn[4], 0.0);
  hmSun = normalize(uVar < 0.5 ? vec3(-0.9, 0.27 - 0.07 * hmRose, -0.05) : vec3(0.85, 0.42 - 0.2 * hmRose, 0.3));
  hmSunC = mix(mix(vec3(3.4, 2.35, 1.2), vec3(3.5, 1.5, 0.6), hmRose) * (0.7 + 0.3 * uPad + 0.25 * uTone), vec3(0.36, 0.46, 0.62), hmNight);
  hmAmb = mix(vec3(0.78, 0.92, 1.12), vec3(0.8, 0.72, 0.85), hmRose);
  hmAmb = mix(mix(hmAmb, vec3(0.8, 0.92, 1.15), hmSnow), vec3(0.07, 0.1, 0.17), hmNight);
  hmHaze = mix(mix(vec3(1.12, 1.07, 1.02), vec3(1.3, 0.85, 0.68), hmRose), vec3(0.06, 0.085, 0.13), hmNight);
  vec3 c = vec3(0.0);
  for (int i = 0; i < 1 && uVar < 0.5; i++) c = hmMaze(p);
  for (int i = 0; i < 1 && uVar >= 0.5; i++) c = hmCourt(p);
  // a bird put up by a hit
  float go = 1.0 - uHits, flap = 0.75 * sin(go * 16.0);
  vec2 q = p - (uVar < 0.5 ? vec2(-0.2 + 0.1 * sin(uTime * 0.037), -0.07) : vec2(0.2, 0.15)) - vec2(uVar < 0.5 ? 0.16 : -0.2, 0.3) * go;
  q.x = abs(q.x);
  float bird = hmOff(0.0045 + hmPx, 0.0015, abs(q.y - flap * q.x + 18.0 * q.x * q.x)) * hmOff(0.03, 0.016, q.x) * sat(uHits * 5.0);
  return screenOf(mix(c, hmAmb * 0.04, bird * 0.9));
}
