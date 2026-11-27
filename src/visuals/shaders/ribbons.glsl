// name: Ribbons
// a: Hanging cloth
// b: Standing glass
// what: Five wide ribbons of thin coloured cloth hang and turn slowly in the dark, one behind another, their colours mixing where they cross and each throwing a soft shadow on those behind.
// follows: Each kind of sound is one ribbon, as wide and bright as it is loud; the place in the loop slides the colours along them; a hit sends a fold running down the front ribbon, a cue down all of them.
// own: 0 1 many narrow ones side by side, -1 each so wide that it fills the room; 1 1 blades pointed at both ends (b: spires), -1 narrow above and spread below (b: round discs); 2 1 they coil and wind about (b: zigzag like a screen), -1 straight, plumb and in line; 3 the ground: 1 a pale wall with their shadows, -1 a wall in the colour of the drone; 4 1 metal (b: frosted), -1 fine threads (b: drawn in outline); 5 1 many fine pleats (b: fine reeds), -1 smooth and flat (b: one clear pane); 6 1 they come in overhead (b: seen from the floor), -1 they lie on the ground and go off (b: seen from above); 7 1 blown sideways by a wind (b: water runs down), -1 woven in stripes and checks (b: leaded panes)
float gLv[5];
float gRich, gTurn;       // how deep the colours are and how far they turn
float gAny, gFine;      // how far from the plain picture; how fine the pleats
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// The wall behind, pale or in the colour of the drone.
vec3 wall(vec2 p) {
  float lamp = 0.6 + 0.55 * exp(-dot(p - vec2(-0.3, 0.25), p - vec2(-0.3, 0.25)) * 1.3), tooth = 0.96 + 0.05 * noise(p * 60.0) + 0.05 * noise(p * vec2(9.0, 5.0));
  vec3 k = uKind[0] * uKind[0];
  return (max(uOwn[3], 0.0) * mix(vec3(1.75, 1.68, 1.56), vec3(0.35) + 2.4 * k, 0.28) + max(-uOwn[3], 0.0) * (0.05 + 0.95 * k) * (0.8 + 0.3 * gLv[0])) * lamp * tooth;
}
// ---- a: cloth ----
const float gZ[5] = float[5](5.4, 4.4, 3.6, 3.0, 2.5);            // how far off each ribbon hangs (the drone farthest)
const float gX[5] = float[5](-0.42, 0.6, -0.78, 0.3, -0.06);
const float gLean[5] = float[5](0.14, -0.22, 0.26, -0.2, 0.1);
const float gEnd[5] = float[5](-9.0, -0.75, -9.0, -0.42, -0.2);   // where its lower end hangs, if it has one in sight
const float gSize[5] = float[5](1.2, 0.95, 0.75, 0.62, 0.5);
const float gHue[5] = float[5](0.13, 0.1, -0.1, 0.12, -0.1);      // the way each colour turns along its ribbon
float wide(int k) {
  float w = (0.07 + 0.8 * sqrt(gLv[k])) * gZ[k] * 0.3 * gSize[k];
  if (uOwn[0] > 0.0) w = mix(w, w * 0.2 + 0.018 * gZ[k], uOwn[0]);
  if (uOwn[0] < 0.0) w *= 1.0 - 1.9 * uOwn[0];
  return w;
}
// Up the picture at that ribbon, about -1 to 1.
float upAt(int k, float y) { return y / (gZ[k] * 0.5) - 0.3; }
float middle(int k, float y) {
  float fk = float(k), z = gZ[k], t = uTime * 0.1 + uTravel * 0.03;
  float free = 0.6 + 0.25 * sat(1.5 - y);   // the lower it hangs the more it swings
  if (gAny > 0.0) {
    float v = upAt(k, y);
    float lean = gLean[k] * z * 0.4 * y, swing = free * (0.1 * z * sin(y * 0.45 + t * (0.8 + 0.17 * fk) + fk * 2.1) + 0.035 * z * sin(y * 1.2 - t * 1.3 + fk * 4.0));
    float x = gX[k] * z;
    if (uOwn[2] < 0.0) {
      x = mix(x, (mod(fk * 3.0, 5.0) - 2.0) * 0.34 * z, -uOwn[2]);
      lean *= 1.0 + uOwn[2]; swing *= 1.0 + 0.85 * uOwn[2];
    }
    if (uOwn[2] > 0.0) x += uOwn[2] * z * (0.3 * sin(v * (2.4 + 0.5 * fk) - t * (0.7 + 0.1 * fk) + fk * 2.4) + 0.1 * sin(v * 5.3 + t + fk));
    if (uOwn[7] > 0.0) {
      float q = max(1.3 - v, 0.0);
      x += uOwn[7] * z * (0.26 * q * q - 0.35 + 0.07 * q * sin(v * 4.5 + uTime * 0.8 + fk * 1.9) + 0.02 * q * sin(v * 11.0 + uTime * 1.5 + fk));
    }
    return x + lean + swing;
  }
  return gX[k] * z + gLean[k] * z * 0.4 * y + free * (0.1 * z * sin(y * 0.45 + t * (0.8 + 0.17 * fk) + fk * 2.1) + 0.035 * z * sin(y * 1.2 - t * 1.3 + fk * 4.0));
}
// Where a place is across the ribbon nearest to it, and which of many that is.
float across(int k, vec2 P, out float id) {
  float dx = P.x - middle(k, P.y);
  id = 0.0;
  if (uOwn[0] > 0.0) {
    float pitch = gZ[k] * 0.4 * exp2(3.2 * (1.0 - uOwn[0]));
    id = floor(dx / pitch + 0.5);
    dx -= id * pitch;
    if (id != 0.0) dx += 0.1 * pitch * uOwn[0] * sin(P.y * (0.7 + 0.2 * sin(id * 5.0)) + id * 2.3 + uTime * 0.1) * (1.0 + min(uOwn[2], 0.0));
  }
  return dx;
}
// How its width goes along it, and where its lower end is.
float shape(int k, float y, float id) {
  float v = upAt(k, y), own = uOwn[1], h = hash11(id * 3.1 + float(k));
  if (own > 0.0) { float q = (v - 0.1 - 0.5 * (h - 0.5)) / (0.85 + 0.3 * h); return mix(1.0, 1.15 * max(1.0 - q * q, 0.0), own); }
  if (own < 0.0) { float q = max(1.0 - v, 0.0); return mix(1.0, 0.14 + 0.32 * q * q, -own); }
  return 1.0;
}
float end(int k, float id) {
  float e = gEnd[k];
  if (uOwn[0] > 0.0) e = mix(e, gZ[k] * (0.75 * hash11(id * 1.7 + float(k) * 2.9) - 0.42), uOwn[0] * smoothstep(0.0, 0.2, uOwn[0]));
  if (uOwn[2] < 0.0) e = mix(e, gZ[k] * (-0.3 - 0.02 * float(k)), -uOwn[2] * (1.0 - max(uOwn[0], 0.0)));
  if (gAny > 0.0) e -= 9.0 * max(max(uOwn[1], 0.0), max(abs(uOwn[6]), max(-uOwn[0], 0.0)));
  return e;
}
// The fold a hit sends down a ribbon: how much of it is at this height now.
float fold(int k, float y) {
  float go = k == 4 ? uHits : uCue;
  float at = 2.2 - (1.0 - go) * (4.2 + 0.3 * float(k));
  float d = (y - at) / 0.4;
  return sqrt(go) * exp(-d * d);
}
float twist(int k, float y) {
  float fk = float(k), t = uTime * 0.08 + uTravel * 0.025;
  if (gAny > 0.0) {
    float th = (0.85 * sin(y * (0.45 + 0.07 * fk) + t * (1.0 + 0.3 * fk) + fk * 1.9) + 0.25 * sin(y * 1.3 - t * 1.7 + fk)) * (1.0 + 0.9 * min(uOwn[2], 0.0));
    if (uOwn[2] > 0.0) th += uOwn[2] * 1.5 * sin(upAt(k, y) * (2.4 + 0.5 * fk) - t * (0.7 + 0.1 * fk) + fk * 2.4 + 0.9);
    if (uOwn[7] > 0.0) th += 0.4 * uOwn[7] * sin(upAt(k, y) * 5.0 + uTime * 0.8 + fk * 1.9);
    return th;
  }
  return 0.85 * sin(y * (0.45 + 0.07 * fk) + t * (1.0 + 0.3 * fk) + fk * 1.9) + 0.25 * sin(y * 1.3 - t * 1.7 + fk);
}
float cover(int k, vec2 P, float e) {
  if (gAny > 0.0) {
    float id, dx = across(k, P, id), wq = wide(k) * max(abs(cos(twist(k, P.y))), 0.05) * shape(k, P.y, id);
    return smoothstep(wq + e, wq - e, abs(dx)) * smoothstep(-e, e, P.y - end(k, id)) * smoothstep(0.0, 0.03, wq);
  }
  float wp = wide(k) * cos(twist(k, P.y)) * (1.0 + 0.1 * fold(k, P.y));
  return smoothstep(wp + e, wp - e, abs(P.x - middle(k, P.y))) * smoothstep(-e, e, P.y - gEnd[k]);
}
// The colour along a ribbon: its own, sliding through the hues beside it as the loop goes round.
vec3 along(int k, float y, out vec3 deep) {
  float fk = float(k);
  vec3 own = rich(uKind[k], gRich);
  float a = 0.5 + 0.5 * cos(TAU * (y * 0.2 + fk * 0.37 - uLoop));
  float b = 0.5 + 0.5 * cos(TAU * (y * 0.33 + fk * 0.21 + 2.0 * uLoop));
  deep = rich(hueShift(own, 1.5 * gTurn * gHue[k]), 1.3);
  vec3 c = mix(deep * 0.5, own, a);
  c = mix(c, rich(hueShift(own, -gTurn * gHue[k]), 1.25) * 1.1, 0.7 * b * a);
  return c * (0.4 + 0.6 * a);
}

vec3 cloth(vec2 p) {
  float sway = 0.3 * sin(uTime * 0.07), lift = 0.1 * sin(uTime * 0.05 + 1.0);
  vec3 ro = vec3(sway, lift, 0.0);
  vec3 rd = normalize(vec3(p.x - sway * 0.1, p.y, 1.05));
  if (uOwn[6] != 0.0) rd.yz *= rot(-0.2 - 0.3 * max(uOwn[6], 0.0) + 0.5 * max(-uOwn[6], 0.0)); else rd.yz *= rot(-0.2);                        // looking a little up: they hang from above
  vec3 L = normalize(vec3(-0.6, 0.45, -0.66)); // the light in front, up and to the left
  vec3 B = normalize(vec3(0.75, 0.15, 0.65));  // and one behind, to the right, that shines through the cloth
  vec3 col = vec3(0.0);
  float t = uTime * 0.12 + uTravel * 0.03;
  float pale = max(uOwn[3], 0.0), lie = abs(uOwn[6]), tip = -1.22 * min(uOwn[6], 0.0) - 1.05 * max(uOwn[6], 0.0);
  vec3 air = vec3(0.0);
  if (uOwn[3] != 0.0) {
    col = air = wall(p);
    if (lie < 1.0) {
      float wz = 6.4, dark = 1.0;
      vec2 W = ro.xy + rd.xy * wz / rd.z;
      for (int j = 0; j < 5; j++) { float gap = wz - gZ[j]; dark *= 1.0 - (0.2 + 0.25 * gLv[j]) * cover(j, W + L.xy / -L.z * gap * 0.3, 0.1 + 0.16 * gap); }
      col *= mix(dark, 1.0, lie);
    }
  }
  for (int k = 0; k < 5; k++) {
    float z = gZ[k], fk = float(k);
    vec2 P = ro.xy + rd.xy * (z - ro.z) / rd.z;
    float tt = z, there = 1.0;
    if (lie > 0.0) {
      vec3 N = vec3(0.0, sin(tip), -cos(tip)), C = vec3(0.0, 0.26 * uOwn[6] * z, z);
      float dn = min(dot(rd, N), -1e-3);
      tt = dot(C - ro, N) / dn;
      there = smoothstep(-0.02, -0.12, dot(rd, N)) * step(0.1, tt);
      vec3 q = ro + rd * max(tt, 0.1);
      P = vec2(q.x, dot(q - C, vec3(0.0, cos(tip), sin(tip))) * mix(1.0, 0.42, lie) + C.y);
    }
    float e = (0.004 + 0.006 * abs(z - 3.6) * (1.0 - 0.85 * gAny)) * max(tt, z);   // sharpest in the middle distance
    float fo = fold(k, P.y);
    float th = twist(k, P.y), ct = cos(th);
    float w = wide(k) * (1.0 + 0.1 * fo), wp = w * ct;
    float dx = P.x - middle(k, P.y), id = 0.0;
    if (gAny > 0.0) {
      dx = across(k, P, id);
      w *= shape(k, P.y, id);
      wp = w * (ct < 0.0 ? -1.0 : 1.0) * max(abs(ct), 0.06);
      wp = wp < 0.0 ? min(wp, -2e-3) : max(wp, 2e-3);
      th += 0.35 * sin(id * 2.0) * max(uOwn[0], 0.0);
    }
    float s = dx / wp;                               // where across the cloth, -1 to 1
    // the folds of the cloth, slowly passing along it
    float f1 = s * (4.2 + fk * 0.6) * gFine + P.y * 0.5 + t * (0.7 + 0.1 * fk) + fk * 1.7, f2 = s * (9.5 - fk) * gFine - P.y * 0.8 - t * 0.9 + fk * 0.6;
    float deep = 0.5 * sin(f1) + 0.22 * sin(f2);
    float slope = 0.62 * cos(f1) + 0.42 * cos(f2) + 0.5 * s;
    if (uOwn[5] < 0.0) { slope = mix(slope, 0.35 * s, -uOwn[5]); deep *= 1.0 + 0.9 * uOwn[5]; }
    if (uOwn[5] > 0.0) slope += uOwn[5] * 0.35 * cos(f2 * 1.6 + s);
    float d1 = (P.y - (2.2 - (1.0 - (k == 4 ? uHits : uCue)) * (4.2 + 0.3 * fk))) / 0.4;
    vec3 n = normalize(vec3(-slope, 0.25 * sin(P.y * 1.3 + fk * 2.0 + t) - 1.6 * fo * d1, -1.0));
    n.xz *= rot(th);
    if (ct < 0.0) n = -n;
    if (gAny > 0.0) n /= max(length(n), 0.2);
    float hem = end(k, id) + 0.07 * z * 0.3 * deep;       // the lower end shows the folds as a wavy edge
    float ew = gAny > 0.0 ? min(e, 0.5 * abs(wp)) : e, cov = smoothstep(1.0 + ew / abs(wp), 1.0 - ew / abs(wp), abs(s)) * smoothstep(-e, e, P.y - hem);
    if (gAny > 0.0) cov *= there * smoothstep(0.0, 0.012 * z, abs(wp) * max(shape(k, P.y, id) * 3.0, 0.0));
    float ndv = abs(dot(n, rd));
    // shadows of the ribbons in front, softer the farther in front they hang
    float sh = 1.0;
    for (int j = k + 1; j < min(k + 3, 5); j++) {
      float gap = z - gZ[j];
      sh *= 1.0 - 0.6 * cover(j, P + L.xy / -L.z * gap * 0.55, 0.05 + 0.12 * gap);
    }
    vec3 dk, c = along(k, P.y, dk);
    if (uOwn[7] < 0.0) {
      vec3 dk2, c2 = along((k + 1) % 5, P.y, dk2);
      float many = 3.0 + 2.0 * mod(fk, 2.0), sx = abs(wp) / cos(min(abs(th), 0.0)), row = P.y * 4.2 / sqrt(z) + 0.25 * deep, e2 = 0.06;
      float st = abs(fract(s * many * 0.5 + 0.5) - 0.5), rw = abs(fract(row) - 0.5), fine = abs(fract(row * 4.0) - 0.5);
      float a1 = smoothstep(0.25 - e2, 0.25 + e2, rw), a2 = smoothstep(0.25 - e2, 0.25 + e2, st), m = k == 1 || k == 3 ? a2 : k == 0 ? a1 : abs(a1 - a2);
      m = max(m, smoothstep(0.1, 0.02, fine) * step(0.4, rw) * 0.8);
      c = mix(c, mix(c2, vec3(0.75), 0.5) + 0.06, -uOwn[7] * m);
      c *= 1.0 + 0.3 * uOwn[7] * (0.5 + 0.5 * sin(P.y * 160.0 / z)) * smoothstep(0.004, 0.001, 1.0 / uRes.y);
    }
    float dif = sat(0.5 + 0.5 * dot(n, L)); dif *= dif;
    float thru = sat(dot(-n, B));
    float sheen = pow(sat(dot(n, normalize(L - rd))), 18.0);
    float light = exp(-pow((P.y - 0.5) / 2.1, 2.0));
    if (gAny > 0.0) light = mix(light, 1.0, max(lie, 0.8 * abs(uOwn[3])));
      // one soft light from above; they fall away into the dark below
    vec3 r = c * (0.1 + 1.15 * dif) * sh;
    r += rich(mix(c, dk * dot(c, vec3(0.33)), 0.6), 1.35) * thru * thru * 1.5 * (0.5 + 0.5 * sh);
    r += mix(c, vec3(1.0), 0.5) * sheen * 0.55 * sh;
    r += mix(c, vec3(1.0), 0.35) * fo * 0.7;
    if (uOwn[4] > 0.0) {
      // metal: it mirrors a bright window and a dark room
      vec3 m = reflect(rd, n);
      float el = m.y * 0.8 + m.x * 0.7 + 0.25 * sin(m.x * 5.0 + fk), bar = smoothstep(0.05, 0.5, el) * (1.0 - smoothstep(0.65, 0.95, el));
      vec3 tint = mix(c, rich(uKind[k], 1.5), 0.65) + 0.02;
      vec3 me = tint * (0.06 + 2.1 * bar + 0.5 * smoothstep(-0.2, -0.7, el)) + mix(tint, vec3(1.0, 0.96, 0.9), 0.6) * (pow(bar, 5.0) * 0.4 + sheen * 0.4);
      r = mix(r, (me * (0.5 + 0.5 * sh) + fo * tint) * 1.25, uOwn[4]);
    }
    if (uOwn[3] != 0.0) r *= 1.0 + (pale * 0.9 + 0.35 * max(-uOwn[3], 0.0)) * (1.0 - 0.4 * gLv[k]);
    r *= (0.2 + 1.55 * gLv[k]) * light * exp(-(z - 2.5) * 0.14);
    if (uOwn[4] < 0.0) {
      float fs = s * (9.0 + 2.0 * fk) * mix(1.0, 0.5, max(uOwn[0], 0.0)) + 0.7 * deep, q = abs(fract(fs) - 0.5), ws = fwidth(fs);
      float line = smoothstep(0.2 + ws, 0.2 - ws, q) * min(1.0, 0.75 / max(ws * 2.0, 0.75));
      cov *= mix(1.0, line, -uOwn[4]);
      r *= 1.0 - 0.6 * uOwn[4];
    }
    if (lie > 0.0) r = mix(r, air, uOwn[3] == 0.0 ? 0.0 : 1.0 - exp(-max(tt - z * 1.2, 0.0) * 0.1)) * mix(1.0, exp(-max(tt - z * 1.2, 0.0) * 0.12), 1.0 - abs(uOwn[3]));
    float a = cov * (0.62 + 0.38 * pow(1.0 - ndv, 2.0));
    if (uOwn[3] != 0.0) { a = mix(a, cov * 0.93, 0.85 * abs(uOwn[3])); r *= 1.0 - 0.22 * pale; }
    if (gAny > 0.0) col = col * (1.0 - mix(0.6, 1.0, max(abs(uOwn[3]), abs(uOwn[4]))) * a) + r * a * mix(1.0, 1.15, abs(uOwn[4]));
    else col = col * (1.0 - 0.6 * a) + r * a;
  }
  return col;
}

// ---- b: glass ----
// The light behind the glass: one wide soft lamp for each kind of sound on a far wall, melting into its neighbours.
vec3 lamps(vec2 P) {
  vec3 c = vec3(0.0);
  float t = uTime * 0.09 + uTravel * 0.02;
  for (int k = 0; k < 5; k++) {
    float fk = float(k), lv = gLv[k];
    vec2 at = vec2((fk - 2.0) * 2.1 + 0.7 * sin(t * (0.8 + 0.2 * fk) + fk * 2.3), 0.15 + 0.75 * sin(TAU * (uLoop + fk * 0.2)) + 0.3 * sin(t * 1.1 + fk));
    float r = 0.85 + 0.75 * lv;
    vec2 d = (P - at) / r;
    vec3 own = rich(uKind[k], gRich);
    vec3 hue = mix(rich(hueShift(own, gTurn * gHue[k]), 1.3), own, sat(0.5 + 0.55 * d.y - 0.3 * d.x));
    c += hue * (0.1 + 1.7 * lv) * exp(-dot(d, d) * 1.5);
  }
  return c;
}
// The floor is dark and polished: what lies under it here is the room seen in it, so everything is met twice, once upside down.
vec3 glass(vec2 p) {
  float sway = 0.5 * sin(uTime * 0.06);
  vec3 ro = vec3(sway, 0.25, 0.0);
  vec3 rd = normalize(vec3(p.x - sway * 0.08, p.y, 1.0));
  if (uOwn[6] != 0.0) rd.yz *= rot(0.12 + 0.42 * max(-uOwn[6], 0.0) - 0.34 * max(uOwn[6], 0.0)); else rd.yz *= rot(0.12);
  ro.y += 2.2 * max(-uOwn[6], 0.0) - 1.05 * max(uOwn[6], 0.0);
  ro.z -= 0.9 * max(-uOwn[6], 0.0);
  float pale = max(uOwn[3], 0.0);
  vec3 tint = vec3(1.0);
  float ink = 0.0;
  // the floor's own grain blurs what it gives back
  float low = step(rd.y * 3.0 + ro.y, -1.0);
  vec2 jit = vec2(grain(gl_FragCoord.xy + 11.0), grain(gl_FragCoord.yx + 37.0)) - 0.5;
  if (gAny > 0.0) jit *= mix(1.0, 0.1, smoothstep(0.0, 0.4, gAny));
  rd = normalize(rd + vec3(jit.x * 0.005, jit.y * 0.018, 0.0) * low);
  float t = uTime * 0.07 + uTravel * 0.02;
  vec3 bend = vec3(0.0), shine = vec3(0.0);
  float dim = 1.0, through = 0.0;
  vec3 L = normalize(vec3(-0.45, 0.5, -0.74));
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float al = 0.42 * sin(t * (1.0 + 0.23 * fk) + fk * 1.7);            // each sheet turns a little on its foot
    vec3 C = vec3((fk - 2.0) * 1.22, 0.0, 3.1 + 0.55 * mod(fk, 2.0));
    if (uOwn[2] < 0.0) { al *= 1.0 + 0.94 * uOwn[2]; C.z = mix(C.z, 3.2, -uOwn[2]); C.x *= 1.0 - 0.06 * uOwn[2]; }
    if (uOwn[2] > 0.0) { al = mix(al, (mod(fk, 2.0) * 2.0 - 1.0) * (0.82 + 0.08 * sin(t + fk)), uOwn[2]); C.z = mix(C.z, 3.3, uOwn[2]); C.x *= 1.0 - 0.2 * uOwn[2]; }
    vec3 N = vec3(sin(al), 0.0, -cos(al)), T = vec3(cos(al), 0.0, sin(al));
    float nd = dot(rd, N);
    if (gAny > 0.0 && abs(nd) < 1e-3) nd = -1e-3;
    float tt = dot(C - ro, N) / nd;
    vec3 Q = ro + rd * tt;
    float under = step(Q.y, -1.0);
    Q.y = abs(Q.y + 1.0) - 1.0;
    float u = dot(Q - C, T);
    float inside = step(abs(u), 0.72) * step(Q.y, 1.05) * step(0.0, tt), dEdge = -1.0, uu = u;
    if (gAny > 0.0) {
      float hw = 0.72, slat = 0.0, high = 1.05;
      if (uOwn[0] > 0.0) {
        float pitch = mix(2.1, 0.42, uOwn[0]);
        slat = clamp(floor(u / pitch + 0.5), -1.0, 1.0);
        uu = u - slat * pitch; hw = mix(0.72, 0.15, uOwn[0]);
        high += uOwn[0] * (0.75 * hash11(slat + fk * 3.0 + 1.0) - 0.45);
      }
      if (uOwn[0] < 0.0) hw = mix(0.72, 1.7, -uOwn[0]);
      dEdge = max(abs(uu) - hw, Q.y - high);
      if (uOwn[1] > 0.0) { float top = high + 0.5, g = sat((top - Q.y) / 2.3); dEdge = mix(dEdge, max(abs(uu) - hw * (1.0 - (1.0 - g) * (1.0 - g)), Q.y - top) * 0.8, uOwn[1]); }
      if (uOwn[1] < 0.0) { float rr = mix(0.92, 0.3, max(uOwn[0], 0.0)) * (1.0 + 0.5 * max(-uOwn[0], 0.0)); dEdge = mix(dEdge, length(vec2(uu, Q.y + 0.98 - rr)) - rr, -uOwn[1]); }
      float px = 1.2 * max(tt, 0.1) / uRes.y;
      inside = smoothstep(px, -px, dEdge) * step(0.0, tt);
    }
    float seen = inside * mix(1.0, 0.1 + 0.5 * pow(1.0 - abs(rd.y), 6.0), under);
    through = max(through, inside);
    float go = k == 4 ? uHits : uCue;
    float dy = (Q.y - (1.2 - (1.0 - go) * 2.5)) / 0.24, fo = sqrt(go) * exp(-dy * dy);
    float ribs = 3.4 + 1.5 * fk;
    if (uOwn[5] > 0.0) ribs *= 1.0 + 1.4 * uOwn[5];
    if (uOwn[5] < 0.0) ribs = mix(ribs, 0.62, -uOwn[5]);
    float f = fract(u * ribs + 0.45 * fo) - 0.5;
    if (uOwn[7] > 0.0) {
      // water runs down it, in wandering trails
      float lane = u * 5.0 + 0.5 * sin(Q.y * 2.3 + fk * 2.0) + 0.2 * sin(Q.y * 7.0 + floor(u * 5.0)), li = floor(lane), lf = fract(lane) - 0.5, h = hash11(li + fk * 7.0);
      float run = fract(Q.y * 0.45 + uTime * (0.06 + 0.07 * h) + h * 9.0), dr = exp(-lf * lf * 40.0) * (0.35 + 1.6 * exp(-run * 4.0) * smoothstep(0.0, 0.04, run));
      bend += inside * uOwn[7] * (T * lf * dr * 3.0 + vec3(0.0, 0.1 * dr, 0.0));
      shine += inside * uOwn[7] * 0.12 * dr * dr * (uKind[k] + 0.4) * step(0.0, lf);
    }
    // a rib is a little lens: it turns the ray aside, the more the nearer its edge
    bend += inside * T * (-(0.12 + 0.02 * fk) * 2.0 * f * (1.0 + 1.5 * fo));
    dim *= 1.0 - inside * (0.06 + 0.4 * smoothstep(0.3, 0.5, abs(f)) * (1.0 - 0.8 * max(-uOwn[5], 0.0)));
    if (uOwn[4] > 0.0) { bend *= 1.0 - 0.45 * uOwn[4] * inside; shine += inside * uOwn[4] * (0.03 + 0.3 * gLv[k]) * rich(uKind[k], 1.3) * (0.25 + 0.75 * exp(-(Q.y + 1.0) * 0.8)) * (0.9 + 0.2 * noise(Q.xy * 90.0)) * mix(1.0, 0.3, under); }
    if (uOwn[3] != 0.0 || uOwn[4] > 0.0) tint *= mix(vec3(1.0), (0.1 + 0.85 * rich(uKind[k], 1.5) + 0.15 * gLv[k]) * (1.0 - 0.4 * exp(min(dEdge, 0.0) * 9.0)), inside * max(0.9 * abs(uOwn[3]), 0.5 * uOwn[4]) * mix(1.0, 0.12 + 0.88 * gLv[k], max(-uOwn[4], 0.0)));
    if (uOwn[7] < 0.0) {
      vec2 g = vec2(u * 3.6, Q.y * 3.0 + 0.5 * mod(floor(u * 3.6), 2.0)), gi = floor(g), gf = abs(g - gi - 0.5);
      float h = hash21(gi + fk * 13.0), lead = smoothstep(0.43, 0.47, max(gf.x, gf.y));
      tint *= mix(vec3(1.0), (0.12 + 1.15 * rich(kindColour(h * 4.0), 1.5)) * (0.75 + 0.5 * fract(h * 37.0)) * (1.0 - 0.94 * lead), -uOwn[7] * inside);
      bend += inside * -uOwn[7] * T * (h - 0.5) * 0.25;
    }
    vec3 n = normalize(N + T * f * 1.5);
    float sp = pow(sat(dot(reflect(rd, n), L)), 26.0);
    if (uOwn[4] < 0.0) {
      float pxl = 1.1 * max(tt, 0.1) / uRes.y, rl = abs(abs(f) - 0.5) / ribs;
      float line = max(smoothstep(0.01 + pxl, 0.01, abs(dEdge)) * step(0.0, tt), 0.5 * inside * smoothstep(0.004 + pxl, 0.004, rl));
      ink = max(ink, line * mix(1.0, 0.25, under));
      shine += -uOwn[4] * line * mix(1.0, 0.25, under) * (1.0 - pale) * (0.12 + 0.6 * gLv[k]) * rich(uKind[k], 1.4);
    }
    float rim = smoothstep(0.69, 0.72, abs(u)) + smoothstep(1.02, 1.05, Q.y);
    if (gAny > 0.0) rim = smoothstep(-0.03, 0.0, dEdge);   // the cut edge of the sheet catches the light
    shine += seen * (vec3(0.75, 0.85, 1.0) * sp * 0.2 + rich(uKind[k], 1.6) * (rim * (0.1 + 0.7 * gLv[k]) + fo * 0.5 * (0.5 + f)));
  }
  vec3 d2 = normalize(rd + bend);
  vec3 W = ro + d2 * ((7.5 - ro.z) / d2.z);
  float under = step(W.y, -1.0);
  W.y = abs(W.y + 1.0) - 1.0;
  if (gAny > 0.0) {
    float keep = mix(1.0, 0.1 + 0.5 * pow(1.0 - abs(rd.y), 6.0), under);
    if (uOwn[4] < 0.0) { dim = mix(dim, 1.0, -uOwn[4]);  }
    vec3 back = lamps(W.xy) * (1.0 - 0.75 * pale) * mix(0.3, 1.0, through), wl = wall(vec2(W.x * 0.13, W.y * 0.13));
    float foot = exp(-abs(W.y + 1.0) * 1.5);
    if (uOwn[3] != 0.0) back = (back * mix(1.0, 0.6, pale) + wl * mix(1.0, 0.7 + 0.45 * smoothstep(-1.0, 2.0, W.y), 0.8)) * (1.0 - 0.25 * foot);
    keep = mix(keep, max(keep, 0.6), abs(uOwn[3]));
    keep = mix(keep, max(keep, 0.55), max(-uOwn[6], 0.0));
    if (uOwn[4] < 0.0) back *= 1.0 + 0.8 * uOwn[4] * (1.0 - abs(uOwn[3]));
    vec3 c = back * tint * mix(dim, sqrt(dim), 0.5 * abs(uOwn[3])) * keep + shine * (1.0 - 0.4 * pale);
    return mix(c, c * 0.12, ink * pale * max(-uOwn[4], 0.0));
  }
  return lamps(W.xy) * dim * mix(0.3, 1.0, through) * mix(1.0, 0.1 + 0.5 * pow(1.0 - abs(rd.y), 6.0), under) + shine;
}

vec3 render(vec2 p) {
  gLv = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  gAny = max(max(max(abs(uOwn[0]), abs(uOwn[1])), max(abs(uOwn[2]), abs(uOwn[3]))), max(max(abs(uOwn[4]), abs(uOwn[5])), max(abs(uOwn[6]), abs(uOwn[7]))));
  if (gAny > 0.0) for (int k = 0; k < 5; k++) gLv[k] = mix(gLv[k], (k == 4 ? 0.14 : 0.24) + 0.76 * gLv[k], 0.85 * smoothstep(0.0, 0.5, gAny));
  float any = smoothstep(0.0, 0.5, gAny);
  gRich = 2.0 - 0.65 * any; gTurn = 1.0 - 0.72 * any;
  gFine = uOwn[5] > 0.0 ? 1.0 + 2.4 * uOwn[5] : 1.0 + 0.5 * uOwn[5];
  vec3 col = uVar > 0.5 ? glass(p) : cloth(p);
  vec3 c = screenOf(col);
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  float g = grain(floor(gl_FragCoord.xy / max(1.0, floor(uRes.y / 540.0 + 0.5))) + floor(uTime * 12.0) * 17.0) - 0.5;
  return c + c * g * (0.2 - 0.1 * smoothstep(0.0, 0.5, gAny)) * (1.0 - lum);
}
