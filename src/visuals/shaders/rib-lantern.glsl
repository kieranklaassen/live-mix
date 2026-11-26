// name: Rib lantern
// a: White room
// b: Only lamp
// what: A huge squashed moon of a paper lantern, thin paper over uneven bamboo ribs, hangs in a pale plaster corner in daylight, hardly lit, its soft shadow bent over two walls. Or a dark boarded room where the only lamp is a tall paper lantern pinched at the waist, its ribs thrown as wide rings of shade over walls, ceiling and floor.
// follows: The level is the lamp. The drone widens its glow, the pad warms it, texture brings up the fibres, the phrase is a small light gliding behind the paper; the low end fills the paper between its ribs. Sixteen gaps hold the bands, the piece tints the paper, the loop carries the lamp round. A hit taps it and a ring of light runs; a cue turns it full up.
bool rlB;               // the tall lamp in the dark room
float rlA, rlH, rlYc;   // the body: widest radius, half height, and where paper stops at the openings
float rlGain, rlI;      // how strongly things answer; how bright the lamp is
float rlSagD;           // how deep the paper hangs between two ribs
vec3 rlLamp, rlHue;     // where the lamp is inside, and its colour
vec3 rlSun;             // towards the window
const vec3 rlTap = vec3(-0.42, 0.22, -0.85); // where a hit taps the paper

float rlSq(float x) { return x * x; }
float rlBell(float x) { return exp(-x * x); }
// The body's radius at a height.
float rlR(float y) {
  if (!rlB) { float h = y / (y > 0.0 ? rlH : rlH * 1.08); return rlA * sqrt(max(1.0 - h * h, 0.0)); }
  float h = y / rlH, h2 = h * h;
  return rlA * sqrt(max(1.0 - h2 * h2 * h2, 0.0)) * (1.0 - 0.47 * rlBell((y - 0.12) / 0.5)) * (1.0 - 0.06 * h);
}
// Counts the ribs upwards, 0 to 16, unevenly, each rib tipped its own way; d is the direction round the axis.
float rlF(float y, vec2 d) {
  float f = 8.0 + 8.0 * (rlB ? y / rlYc : asin(clamp(y / (y > 0.0 ? rlH : rlH * 1.08), -0.999, 0.999)) / 1.32);
  return f + 0.12 * sin(f * 3.7 + 1.0) + 0.2 * sin(f * 0.83 + 2.0) + 0.22 * sin(f * 1.1) * dot(d, vec2(0.8, 0.6));
}
float rlSag(float f) { float k = fract(2.0 * f); return 4.0 * k * (1.0 - k); }
float rlSkin(vec3 q) {
  float r = max(length(q.xz), 1e-3), f = rlF(q.y, q.xz / r), d;
  if (rlB) d = (r - rlR(q.y)) * 0.75;
  else {
    vec2 e = vec2(rlA, q.y > 0.0 ? rlH : rlH * 1.08), c = vec2(r, q.y);
    float k0 = length(c / e), k1 = length(c / (e * e));
    d = k0 * (k0 - 1.0) / max(k1, 1e-3);
  }
  return max(d + rlSagD * rlSag(f), abs(q.y) - rlYc);
}
// What the lamp sends out through gap number f: the band's gap, and the shade of its ribs. soft blurs the ribs.
float rlGap(float f, float w) {
  float k = fract(f), m = min(k, 1.0 - k);
  float bd = uBands[int(clamp(floor(f), 0.0, 15.0))];
  return (1.0 + 1.1 * bd * rlGain * rlSq(sin(PI * k))) * (1.0 - 0.75 * rlBell(m / w));
}
// Light from the lantern on a wall: rings of rib shade, bare light where it comes out of an opening.
vec3 rlThrow(vec3 q, vec3 n) {
  vec3 v = q - rlLamp;
  float d2 = dot(v, v), d = sqrt(d2);
  float r = max(length(v.xz), 1e-3), y = rlB ? rlLamp.y + 0.36 * v.y / r : rlH * sin(atan(v.y, r));
  float ya = abs(y), edge = 0.05 + 0.06 * d;
  float open = smoothstep(rlYc - edge, rlYc + edge, ya);
  float f = clamp(rlF(clamp(y, -rlYc, rlYc), v.xz / r), 0.0, 15.999);
  float g = rlGap(f, mix(0.34, 0.2, uTone));
  g = mix(1.0, g, rlB ? 0.92 : 0.06);
  float e = sat(-dot(n, v) / d + 0.06) / (d2 + (rlB ? 0.3 : 0.6));
  // a tap sends one ring of light up the room
  float ring = uHits * rlBell((f - 1.0 - 17.0 * (1.0 - uHits)) / 1.3);
  return rlHue * e * (rlI * mix(g, 1.7 + 2.0 * uKeys * rlGain, open) + (rlB ? 1.1 : 0.25) * rlGain * ring);
}
// Long fibres of bark in the paper, one bent strand to a cell.
float rlStrands(vec2 s, float px) {
  vec2 i = floor(s), h = hash22(i), q = rot(h.x * 6.0) * (s - i - 0.5);
  q.y += (h.y - 0.5) * 1.6 * q.x * q.x + 0.02 * sin(q.x * 9.0 + h.x * 9.0);
  float w = 0.006 + 0.008 * h.y + px;
  return (1.0 - smoothstep(0.3 * w, w, abs(q.y))) * (1.0 - smoothstep(0.2, 0.46, length(s - i - 0.5))) * step(0.2, fract(h.x * 7.3)) * (0.5 + 0.5 * h.y) * min(1.0, 0.015 / px);
}
// How the paper lets light by: ribs, seams, fibres, clouds. x: transmission, y: shade of the surface, z: crease.
vec3 rlPaper(vec3 q, float th, float f, float px) {
  float k = fract(2.0 * f), m = 0.5 * min(k, 1.0 - k);
  float gw = TAU / (rlB ? 9.0 : 13.0), gi = floor((th + 10.0) / gw), gf = (th + 10.0) / gw - gi;
  float lap = smoothstep(0.0, 0.012 + px * 2.0, gf) * (1.0 - smoothstep(0.088 - px * 2.0, 0.1, gf));
  vec2 s = vec2(th + gi * 3.7, q.y + gi * 5.1);
  float tone = hash11(gi + 3.0);
  float cloud = noise(s * 5.0) * 0.6 + noise(s * 14.0) * 0.4;
  if (rlB) { s *= 0.62; px *= 0.62; }
  float fib = rlStrands(s * 3.1, px * 3.1) + 0.8 * rlStrands(rot(1.1) * s * 5.3 + 7.0, px * 5.3) + 0.8 * rlStrands(rot(2.3) * s * 7.0 + 3.0, px * 7.0) + 0.6 * rlStrands(rot(0.6) * s * 9.0 + 5.0, px * 9.0);
  float cr = noise(vec2(th * 34.0, floor(2.0 * f) * 7.0 + k * 1.6)) - 0.5;
  cr *= 0.35 + 0.65 * (1.0 - rlSag(f));
  float tx = 0.4 + 2.6 * sat(uTexture * rlGain);
  float t = (0.95 + 0.07 * tone) * (1.0 + (0.14 + 0.28 * tx) * (cloud - 0.5)) * (1.0 - (rlB ? 0.16 : 0.26) * lap) * (1.0 - 0.25 * min(fib, 1.0) * tx) * (1.0 + 0.16 * cr);
  float rib = rlBell(m / 0.05);
  t *= 1.0 - 0.62 * rib;
  float sh = (0.97 + 0.04 * tone) * (0.97 + 0.06 * cloud) * (1.0 - 0.05 * lap) * (1.0 - 0.1 * min(fib, 1.0) * tx) * (1.0 - 0.16 * rib);
  return vec3(t, sh, cr);
}

// Light of day at a place: how much of the window's light the lantern lets by.
float rlShadow(vec3 q) {
  vec3 e = vec3(rlA, rlH * 1.04, rlA) * 0.99, o = q / e, d = rlSun / e;
  float dd = dot(d, d), t = max(-dot(o, d) / dd, 0.0);
  float m = length(o + d * t), w = mix(0.26, 0.14, uTone);
  float s = smoothstep(1.0 - w, 1.0 + w, m);
  // the cord's thin shadow
  float u = (q.x * rlSun.z - q.z * rlSun.x) / length(rlSun.xz);
  float y = q.y - rlSun.y * dot(q.xz, rlSun.xz) / dot(rlSun.xz, rlSun.xz);
  return s * (1.0 - 0.2 * rlBell(u / 0.045) * smoothstep(0.6, 0.8, y));
}
vec3 rlRoomA(vec3 ro, vec3 rd, vec3 day) {
  const vec3 n1 = vec3(0.2079, 0.0, -0.9781), n2 = vec3(-0.8746, 0.0, -0.4848), cn = vec3(0.98, 0.0, 1.2);
  float top = 1.36, t1 = dot(cn - ro, n1) / dot(rd, n1), t2 = dot(cn - ro, n2) / dot(rd, n2);
  t1 = dot(rd, n1) < -1e-3 ? t1 : 1e4; t2 = dot(rd, n2) < -1e-3 ? t2 : 1e4;
  float t = min(t1, t2);
  vec3 n = t1 < t2 ? n1 : n2;
  if (rd.y > 1e-3) { float tc = (top - ro.y) / rd.y; if (tc < t) { t = tc; n = vec3(0.0, -1.0, 0.0); } }
  vec3 q = ro + rd * t;
  vec2 s = n.y < -0.5 ? q.xz : vec2(dot(q.xz, vec2(-n.z, n.x)), q.y);
  float big = noise(s * 1.1 + 3.0), mid = noise(s * vec2(4.0, 3.0) + 4.0 * big), fine = noise(rot(0.6) * s * vec2(9.0, 30.0));
  vec3 alb = vec3(0.87, 0.835, 0.775) * (0.95 + 0.06 * big + 0.04 * mid + 0.02 * fine);
  float sh = rlShadow(q);
  float dl = sat(dot(n, rlSun));
  float d2 = dot(q, q);
  float ao = 1.0 - 0.55 * sat(-dot(n, q) / sqrt(d2)) / max(d2, 1.0);
  // corners gather a little shade
  float c1 = abs(dot(q - cn, n1)), c2 = abs(dot(q - cn, n2)), c3 = top - q.y;
  float gather = (1.0 - 0.22 * exp(-(n == n1 ? c2 : c1) * 3.0)) * (n.y < -0.5 ? (1.0 - 0.2 * exp(-c1 * 3.0)) * (1.0 - 0.2 * exp(-c2 * 3.0)) : 1.0 - 0.22 * exp(-c3 * 3.0));
  float fall = 1.0 - 0.3 * (1.0 - smoothstep(-1.8, 0.2, q.y));
  vec3 light = day * vec3(1.06, 0.97, 0.85) * 0.5 * dl * sh * fall + day * vec3(0.2, 0.235, 0.29) * (n.y < -0.5 ? 0.75 : 0.9) * ao;
  return alb * (light * gather + 0.5 * rlThrow(q, n));
}
const float rlFloor = -1.55;
vec3 rlRoomB(vec3 ro, vec3 rd) {
  float tx = (rd.x > 0.0 ? 2.1 - ro.x : 3.6 + ro.x) / max(abs(rd.x), 1e-4), ty = (rd.y > 0.0 ? 1.75 - ro.y : ro.y - rlFloor) / max(abs(rd.y), 1e-4), tz = (2.1 - ro.z) / rd.z;
  float t = min(tx, min(ty, tz));
  vec3 q = ro + rd * t, n, alb;
  if (t == ty) n = vec3(0.0, rd.y > 0.0 ? -1.0 : 1.0, 0.0); else if (t == tx) n = vec3(-sign(rd.x), 0.0, 0.0); else n = vec3(0.0, 0.0, -1.0);
  float big = noise(q.xy * 1.2 + q.z + 5.0);
  vec3 c;
  if (n.y > 0.5) {
    float bx = q.x / 0.36, bi = floor(bx), bf = bx - bi, w = 0.012 + t / uRes.y * 2.0;
    float gap = smoothstep(0.0, w, min(bf, 1.0 - bf));
    float gr = noise(vec2(q.x * 26.0, q.z * 1.6 + bi * 9.0));
    alb = vec3(0.36, 0.25, 0.17) * (0.75 + 0.3 * hash11(bi + 2.0) + 0.3 * (gr - 0.5)) * (0.4 + 0.6 * gap);
    c = alb * rlThrow(q, n) * 1.4;
    // the lamp lies long and soft in the polish
    vec3 m = reflect(rd, n);
    float u = -dot(q.xz, m.xz) / max(dot(m.xz, m.xz), 1e-3);
    vec3 a = q + m * max(u, 0.0);
    float r = length(a.xz) , R = rlR(clamp(a.y, -rlYc, rlYc)), s = 0.1 + 0.08 * max(a.y - rlFloor, 0.0);
    c += rlI * rlHue * vec3(1.0, 0.72, 0.45) * 0.16 * (1.0 - smoothstep(R - s, R + s, r)) * (1.0 - smoothstep(rlYc - s, rlYc + s, abs(a.y))) * (0.8 + 0.4 * gr) * gap * exp(-0.8 * (a.y - rlFloor));
  } else {
    alb = vec3(0.64, 0.5, 0.37) * (0.92 + 0.14 * big);
    c = alb * rlThrow(q, n) * 0.75;
  }
  vec3 k = vec3(2.1 - q.x, q.y - rlFloor, 2.1 - q.z), k2 = vec3(q.x + 3.6, 1.75 - q.y, 9.0);
  k = min(k, k2) + abs(n) * 9.0;
  c *= (1.0 - 0.35 * exp(-k.x * 4.0)) * (1.0 - 0.35 * exp(-k.y * 4.0)) * (1.0 - 0.35 * exp(-k.z * 4.0));
  return c + alb * vec3(0.007, 0.012, 0.026);
}
vec3 render(vec2 p) {
  rlB = uVar > 0.5;
  rlGain = 0.35 + 1.4 * uEnergy;
  rlA = rlB ? 0.6 : 1.0; rlH = rlB ? 1.36 : 0.72; rlYc = rlB ? 1.25 : rlH * 0.968;
  rlSagD = (rlB ? 0.014 : 0.018) * (0.95 + 0.12 * sin(uTime * 0.35) - 0.62 * sat(uLow * rlGain));
  rlLamp = vec3(0.26 * sin(TAU * uLoop), 0.05 * cos(TAU * uLoop), -0.26 * cos(TAU * uLoop));
  if (rlB) rlLamp = vec3(0.12, 0.0, 0.12) * rlLamp / 0.26 + vec3(0.0, -0.45, 0.0);
  rlI = (rlB ? 0.42 : 0.16) + (rlB ? 1.3 : 1.1) * uLevel * rlGain + 1.3 * uCue;
  rlHue = mix(vec3(1.0, 0.8, 0.56), mix(vec3(1.0, 0.6, 0.3), uKind[1], 0.2), sat(0.1 + 0.9 * uPad * rlGain));
  rlHue *= mix(vec3(1.0, 0.72, 0.45), vec3(1.0), smoothstep(0.1, 1.1, rlI)); // a low lamp is redder
  rlSun = normalize(vec3(-0.75, 0.3, -0.6));
  vec3 day = vec3(1.15) * (1.0 - 0.72 * sat(uLevel * rlGain + 0.5 * uCue)) * (1.0 + 0.15 * uMic) * (1.0 + 0.05 * sin(uTime * 0.13));

  float asp = uRes.x / uRes.y;
  float D = rlB ? 4.7 : 4.4, zoom = min(1.0, asp * 0.95) * mix(1.06, 0.94, uSpace), foc = (rlB ? 1.24 : 2.3) * zoom;
  float sway = 0.16 * sin(uTime * 0.041);
  vec3 ro = vec3(sway, rlB ? 0.2 : -1.35, -D);
  vec2 at = rlB ? vec2(0.26, 0.015) : vec2(-0.2, -0.015);
  at.x *= smoothstep(0.6, 1.6, asp);
  vec3 rd = normalize(vec3(p - at - ro.xy * foc / D, foc));
  float px = D / (foc * uRes.y);

  // the lantern's own space: it swings from its cord, or rocks on its legs, and turns a few degrees a minute
  float sw = 0.006 * sin(uTime * 0.5) + (rlB ? 0.012 : 0.03) * 4.0 * uHits * (1.0 - uHits);
  vec3 pv = vec3(0.0, rlB ? rlFloor : 1.9, 0.0), lo = ro - pv, ld = rd;
  mat2 M = rot(sw), T = rot(0.4 * sin(uTime * 0.008));
  lo.xy *= M; ld.xy *= M; lo += pv;
  lo.xz *= T; ld.xz *= T;

  float cover = 0.0, tb = 0.0;
  {
    float Rb = rlA + 0.03, Hb = rlYc + 0.01;
    float a = dot(ld.xz, ld.xz), b = dot(lo.xz, ld.xz), disc = b * b - a * (dot(lo.xz, lo.xz) - Rb * Rb);
    if (disc > 0.0) {
      disc = sqrt(disc);
      float iy = 1.0 / (abs(ld.y) < 1e-4 ? 1e-4 : ld.y), y1 = (-Hb - lo.y) * iy, y2 = (Hb - lo.y) * iy;
      float t = max((-b - disc) / a, min(y1, y2)), tEnd = min((-b + disc) / a, max(y1, y2)), best = 1.0;
      for (int i = 0; i < 34; i++) {
        if (t > tEnd) break;
        float d = rlSkin(lo + ld * t);
        if (d < best) { best = d; tb = t; }
        if (d < 0.0006) break;
        t += max(d * 0.9, 0.002);
      }
      cover = (1.0 - smoothstep(0.1, 1.2, best / px));
      if (best < 0.01) tb += rlSkin(lo + ld * tb);
    }
  }
  vec3 c = vec3(0.0);
  if (cover < 1.0) {
    c = rlB ? rlRoomB(ro, rd) : rlRoomA(ro, rd, day);
    // the cord, or the legs
    if (!rlB) {
      float u = -lo.z / ld.z; vec3 a = lo + ld * u;
      float w = (1.0 - smoothstep(0.011 - px, 0.011 + px, abs(a.x))) * step(0.5, a.y);
      c = mix(c, (vec3(0.2, 0.185, 0.17) - 8.0 * a.x) * day, w);
    } else {
      for (int i = 0; i < 3; i++) {
        float an = 0.6 + TAU * float(i) / 3.0;
        vec3 l0 = vec3(0.22 * vec2(sin(an), cos(an)), -rlYc).xzy, l1 = vec3(0.42 * vec2(sin(an), cos(an)), rlFloor).xzy;
        vec3 u = l1 - l0, w0 = l0 - ro;
        float b = dot(u, rd), s = sat((b * dot(rd, w0) - dot(u, w0)) / max(dot(u, u) - b * b, 1e-4));
        w0 += u * s;
        float w = (1.0 - smoothstep(0.011 - px, 0.011 + px, sqrt(max(dot(w0, w0) - rlSq(dot(w0, rd)), 0.0))));
        c = mix(c, vec3(0.02, 0.016, 0.012) + rlI * rlHue * 0.03 * (1.0 - s), w);
      }
    }
  }
  if (cover > 0.0) {
    vec3 q = lo + ld * tb, pc;
    float r = max(length(q.xz), 1e-3);
    vec2 dr = q.xz / r;
    vec3 vl = rlLamp - lo;
    float m2 = max(dot(vl, vl) - rlSq(dot(vl, ld)), 0.0); // how near the eye's line passes the lamp
    if (!rlB && q.y < -rlYc + 0.004 && r < rlR(-rlYc) - 0.004) {
      // in at the lower opening: the far inside of the paper, and the lamp
      vec3 e = vec3(rlA, rlH, rlA), o = q / e, d = ld / e;
      float dd = dot(d, d), bb = dot(o, d), t = (-bb + sqrt(max(bb * bb - dd * (dot(o, o) - 1.0), 0.0))) / dd;
      vec3 q2 = q + ld * t, v = q2 - rlLamp;
      float f2 = rlF(q2.y, q2.xz / max(length(q2.xz), 1e-3));
      pc = (rlI / (1.0 + 0.3 * rlI) * rlHue * (1.0 + 0.5 / (dot(v, v) + 0.15)) + day * 0.2) * (1.0 - 0.25 * rlBell((abs(fract(2.0 * f2) - 0.5) - 0.5) / 0.12));
      pc *= 0.75 + 0.35 * smoothstep(-0.6, 0.3, q2.y);
      pc += rlI * rlHue * (1.0 + 3.0 * uKeys * rlGain) * exp(-m2 / 0.03);
      float in2 = smoothstep(-1.0, 1.0, (rlR(-rlYc) - 0.03 - r) / (px * 2.0));
      pc = mix(vec3(0.1, 0.085, 0.07) * (day + rlI * rlHue), pc, in2);
    } else {
      float f = rlF(q.y, dr), e = 0.004;
      float dR = (rlR(q.y + e) - rlR(q.y - e)) / (2.0 * e);
      dR -= rlSagD * (rlSag(rlF(q.y + e, dr)) - rlSag(rlF(q.y - e, dr))) / (2.0 * e);
      float ny = -clamp(dR, -8.0, 8.0);
      float th = atan(q.x, -q.z - 1e-5);
      vec3 P = rlPaper(q, th, f, px);
      vec3 n = normalize(vec3(dr.x, ny, dr.y) + vec3(dr.y, 0.0, -dr.x) * P.z * 0.35);
      float face = sat(-dot(n, ld));
      f = clamp(f, 0.0, 15.999);
      // from inside
      vec3 v = q - rlLamp;
      float d2 = dot(v, v), wide = sat(uDrone * rlGain);
      float core = sat(0.3 + 0.7 * dot(n, v) / sqrt(d2)) / (d2 * 1.3 / (rlB ? 0.3 : 1.0) + 0.3);
      float s2 = mix(0.05, 0.22, wide) * (rlB ? 0.5 : 1.3);
      float thru = exp(-m2 / s2) + 0.4 * exp(-m2 / (s2 * 4.0));
      vec4 m = piece(vec2(0.5 + th * 0.31, 0.5 - 0.46 * q.y / rlYc));
      vec3 tint = mix(vec3(1.0), m.rgb / max(max(m.r, max(m.g, m.b)), 0.03) * 1.2, sat(m.a * 0.6 * rlGain)) * (1.0 + 0.35 * m.a * rlGain);
      vec3 rim = exp(-(1.0 - face) * vec3(0.6, 1.35, 2.5));
      float k = fract(f), bd = uBands[int(floor(f))];
      vec3 in_ = rlI / (1.0 + 0.36 * rlI) * rlHue * tint * rim * (rlB ? 1.7 : 1.15) * ((rlB ? 0.14 : 0.24) + 0.42 * core + 1.05 * thru * face) * (1.0 + 1.0 * bd * rlGain * rlSq(sin(PI * k)));
      // the small lamp of the phrase
      vec3 sp = vec3(sin(0.8 * sin(uTravel * 0.17)), 0.0, -cos(0.8 * sin(uTravel * 0.17))) * 0.8;
      sp.y = 0.4 * rlH * sin(uTravel * 0.11 + 1.0); sp.xz *= rlR(sp.y);
      vec3 sv = q - sp;
      in_ += mix(uKind[3], vec3(1.0, 0.9, 0.75), 0.35) * uPhrase * rlGain * 0.05 / (dot(sv, sv) + 0.035);
      // a tap runs over the paper as a ring
      vec3 tq = rlTap; if (rlB) tq = vec3(-0.35, 0.65, -0.4);
      float td = length(q - tq);
      in_ += mix(uKind[4], vec3(1.0, 0.85, 0.65), 0.5) * uHits * rlGain * 1.3 * rlBell((td - 1.7 * (1.0 - uHits)) / 0.26);
      pc = in_ * P.x;
      // from the room
      if (!rlB) {
        float nl = dot(n, rlSun), w = max(nl, 0.0);
        float wr = rlSq(sat(nl * 0.6 + 0.4));
        vec3 bounce = vec3(0.3, 0.28, 0.25) * sat(0.5 + 0.5 * dot(n, vec3(0.8, 0.0, 0.5)));
        vec3 dl = vec3(1.06, 0.98, 0.88) * (0.48 * w + 0.28 * wr) + vec3(0.18, 0.2, 0.23) * (0.75 + 0.25 * n.y) + bounce * 0.5 + 0.09 * P.x;
        pc += day * dl * P.y * vec3(0.95, 0.93, 0.885);
      } else pc += vec3(0.01, 0.012, 0.018) * P.y;
      // the hoops at the openings
      float hoop = (1.0 - smoothstep(0.02, 0.035, rlYc - abs(q.y)));
      pc = mix(pc, pc * 0.3, hoop);
    }
    c = mix(c, pc, cover);
  }
  // a breath of light in the air round it
  {
    vec3 vl = -ro; float m = sqrt(max(dot(vl, vl) - rlSq(dot(vl, rd)), 0.0));
    c += rlI * rlHue * (rlB ? 0.06 : 0.03) * (0.4 + sat(uDrone * rlGain) + 0.6 * uMic) * exp(-m * 2.0);
  }
  c = 1.0 - exp(-1.35 * max(c, 0.0));
  return pow(c, vec3(0.4545));
}
