// name: Haze beams
// a: Pale hall
// b: Sheet
// what: An empty pale hall with a row of square piers: a few wide soft beams slant in from the left through slow haze and dust, cut by the piers, and lie as pools on the floor and the far wall; or the hall at night, crossed by flat sheets of light seen nearly edge-on, slices of drifting smoke shining in them, the piers' shadows across.
// follows: Drone, pads, texture and phrase are each a beam or a sheet of their own, opening and brightening as they sound; a hit lights one more and dies; a cue widens them all and fills the haze; the low band thickens the haze, the bands light it from floor to roof by day, highs and keys bring out dust or fine smoke; a voice mists the hall or lifts the night walls.
vec3 hbS[5], hbA[5], hbC[5], hbF[5];  // each beam: where it comes from, its way, its colour as light, the middle of its pool
float hbR[5], hbLen[5];               // how wide it opens, how far it goes
float hbHaze;                         // how thick the haze is
const vec3 hbEye = vec3(0.6, 2.7, -6.6);
const float hbPx = -3.2, hbPw = 0.30, hbWall = 5.0, hbEnd = 8.0;  // the row of piers, half a pier, the right wall, the end wall
const float hbFocal = 1.25, hbShift = 0.10;
#define HB_ALL(F) F(0) F(1) F(2) F(3) F(4)

// What a sound's colour is as a gel in front of a lamp.
vec3 hbGel(vec3 c, float rich) {
  c *= c;
  c /= max(dot(c, vec3(0.3, 0.59, 0.11)), 0.03);
  return mix(vec3(1.0, 0.95, 0.87), min(c, 2.4), rich);
}
float hbFade(float q) { return 1.0 / (1.0 + q * (1.0 + q * (0.5 + 0.2 * q))); } // like exp(-q), for q of 0 and over
// Across a beam: y is 1 on its axis, 0 at its rim.
float hbRound(float y) { return y * mix(y, 2.0 - y, 0.15 + 0.85 * uTone); }

void hbBeam(out vec3 S, out vec3 A, out vec3 C, out vec3 F, out float R, out float len, vec3 from, vec3 to, float wide, float l, float rest, float give, vec3 kind, vec2 sway) {
  F = to; S = from; F.xz += sway;
  A = F - S; len = length(A); A /= len;
  R = wide * (0.84 + 0.26 * l + 0.9 * uCue * (1.0 - uCue)) * (0.85 + 0.3 * uSpace);
  C = hbGel(kind, 0.42 * smoothstep(0.0, 0.5, l + 0.1)) * (rest * (1.0 - 0.6 * l) + l * give * (0.55 + 0.85 * uEnergy));
}
void hbBeams() {
  vec4 w = sin(uTime * vec4(0.047, 0.031, 0.061, 0.039) + vec4(0.0, 2.1, 4.0, 1.3)) * 0.85;
#define HB_B(k, from, to, wide, l, rest, give, sway) hbBeam(hbS[k], hbA[k], hbC[k], hbF[k], hbR[k], hbLen[k], from, to, wide, l, rest, give, uKind[k], sway);
  HB_B(0, vec3(-13.0, 7.4, 6.5), vec3(2.8, 0.0, 3.1), 0.068, uDrone, 1.0, 1.05, w.xy)
  HB_B(1, vec3(-4.8, 13.0, 4.5), vec3(-0.9, 0.0, 3.6), 0.085, uPad, 0.85, 0.85, w.zw)
  HB_B(2, vec3(-9.0, 10.0, -1.0), vec3(0.6, 0.0, 6.2), 0.066, uTexture, 0.0, 1.0, w.wz)
  HB_B(3, vec3(-9.0, 13.0, 7.5), vec3(1.7, 0.0, 0.5), 0.043, uPhrase, 0.0, 0.85, w.yx)
  HB_B(4, vec3(-12.0, 10.5, 1.0), vec3(0.6, 3.6, 8.0), 0.048, uHits, 0.0, 1.3, vec2(0.4 * w.z, 0.0))
  hbHaze = 0.18 * (0.8 + 0.6 * uLow + 0.3 * uSpace);
}
// How much of a beam reaches a place past the row of piers.
float hbPast(vec3 P, vec3 S) {
  const float at = hbPx + 0.9 * hbPw;
  float s = (at - S.x) / max(P.x - S.x, 0.01), q = abs(mod(mix(S.z, P.z, s) + 2.5, 3.0) - 1.5), w = 0.03 + 0.4 * max(1.0 - s, 0.0);
  return s > 1.0 ? 1.0 : smoothstep(hbPw - w, hbPw + w, q);
}
// The light of a beam on a surface at P: its round, its falling off.
float hbAt(vec3 S, vec3 A, float R, float len, vec3 P) {
  vec3 v = P - S;
  float a = max(dot(v, A), 0.5), y = 1.0 - max(dot(v, v) - a * a, 0.0) / (a * a * R * R);
  return y <= 0.0 ? 0.0 : hbRound(y) * len / a * hbPast(P, S);
}
// The smoke in the air.
float hbSmoke(vec3 P) {
  vec2 q = vec2(P.x - 0.55 * P.z, P.y + 0.3 * P.z) + vec2(-0.10, -0.03) * uTime - vec2(0.06, 0.0) * uTravel;
  q = rot(0.5) * q;
  float n = 0.5 + 0.5 * sin(0.7 * q.x + 1.3 * sin(0.8 * q.y + 0.5 * q.x)), m = noise(q * vec2(1.1, 2.6) + vec2(1.7, 2.6) * n + 9.0);
  return 0.6 + 0.3 * n + (0.5 + 0.9 * n) * m * m;
}
// The haze that a beam lights along a ray as far as t1. The light across a beam is a bowl, so its sum along the ray is known.
float hbRay(vec3 S, vec3 A, float R, float len, vec3 ro, vec3 rd, float t1, bool smoke) {
  vec3 co = ro - S;
  float da = dot(rd, A), ca = dot(co, A), den = max(1.0 - da * da, 0.04), tn = (da * ca - dot(rd, co)) / den;
  vec3 v = co + rd * tn;
  float al = max(dot(v, A), 0.5), r = al * R, y = 1.0 - max(dot(v, v) - al * al, 0.0) / (r * r);
  float sum = (0.04 + 0.2 * uCue) * hbFade(0.35 * (1.0 - y)) * hbFade(max(tn - t1, 0.0)) * r;
  if (y > 0.0) {
    float hc = r * sqrt(y / den), x = clamp((t1 - tn) / (hc + 1e-4), -1.0, 1.0), x0 = clamp(-tn / (hc + 1e-4), -1.0, 1.0);
    float f = 0.5 * (x * (1.5 - 0.5 * x * x) - x0 * (1.5 - 0.5 * x0 * x0)) * hbRound(y) * hc * 1.6;
    if (smoke && f > 0.0) {
      vec3 a = ro + rd * max(tn - 0.5 * hc, 0.0), b = ro + rd * min(tn + 0.5 * hc, t1);
      f *= hbSmoke(0.5 * (a + b)) * (hbPast(a, S) + hbPast(b, S)) * 0.5;
    }
    sum += f;
  }
  return sum * 2.0 * len / (al + len + 1.0);
}
vec3 hbAir(vec3 ro, vec3 rd, float t1) {
  vec3 sum = vec3(0.0);
#define HB_R(k, smoke) if (hbC[k].g > 0.004) sum += hbC[k] * hbRay(hbS[k], hbA[k], hbR[k], hbLen[k], ro, rd, t1, smoke);
  HB_R(0, true) HB_R(1, true) HB_R(2, true) HB_R(3, true) HB_R(4, false)
  return sum * hbHaze * (0.8 + 0.9 * uEnergy * band((ro.y + rd.y * min(t1, 9.0)) * 0.11));
}
// The bare room along a ray: how far, which way the surface looks.
float hbRoom(vec3 ro, vec3 rd, out vec3 N) {
  float ix = 1.0 / (abs(rd.x) < 1e-4 ? 1e-4 : rd.x), tx = ((rd.x > 0.0 ? hbWall : -8.0) - ro.x) * ix, tz = (hbEnd - ro.z) / rd.z, ty = rd.y < -1e-4 ? -ro.y / rd.y : 1e4;
  float t = min(min(tx, tz), ty);
  N = t == ty ? vec3(0, 1, 0) : t == tx ? vec3(-sign(rd.x), 0, 0) : vec3(0, 0, -1);
  for (int i = 0; i < 4; i++) {
    vec2 c = vec2(hbPx, -1.0 + 3.0 * float(i)) - ro.xz, m = vec2(ix, 1.0 / rd.z), n = c * m, e = abs(m) * hbPw;
    float n0 = max(n.x - e.x, n.y - e.y), n1 = min(n.x + e.x, n.y + e.y);
    if (n0 < n1 && n0 > 0.0 && n0 < t) { t = n0; N = n.x - e.x > n.y - e.y ? vec3(-sign(rd.x), 0, 0) : vec3(0, 0, -1); }
  }
  return t;
}
// What the surfaces are made of, with the dark in their corners: pale plaster and stone slabs.
float hbStuff(vec3 P, vec3 N, float px) {
  float alb, ao = 1.0, grain = noise(N.y > 0.5 ? P.xz * vec2(1.0, 0.7) : (abs(N.x) > 0.5 ? P.zy : P.xy) * vec2(1.7, 0.6));
  if (N.y > 0.5) {
    vec2 s = (P.xz - vec2(hbPx, 0.5)) / 3.0, g = (0.5 - abs(fract(s) - 0.5)) * 3.0, w = vec2(px, 3.0 * px);
    vec2 j = (1.0 - smoothstep(vec2(0.006), vec2(0.012) + w, g)) * min(vec2(1.0), 0.016 / (0.008 + w));
    alb = (0.63 + 0.05 * hash21(floor(s)) + 0.13 * grain) * (1.0 - 0.4 * max(j.x, j.y));
    vec2 q = max(abs(vec2(P.x - hbPx, mod(P.z + 2.5, 3.0) - 1.5)) - hbPw, 0.0);
    ao -= 0.5 * hbFade(4.0 * length(q));
  } else {
    alb = 0.66 + 0.08 * grain;
    ao -= 0.4 * hbFade(1.8 * max(P.y, 0.0));
  }
  if (abs(N.x) < 0.5) ao -= 0.35 * hbFade(1.4 * max(hbWall - P.x, 0.0));
  if (abs(N.z) < 0.5) ao -= 0.3 * hbFade(1.4 * max(hbEnd - P.z, 0.0));
  if (N.z < -0.5 && P.z > hbEnd - 0.01) {
    vec2 q = abs(P.xy - vec2(2.6, 0.9)) - vec2(0.5, 1.3);
    alb *= 1.0 - 0.9 * (1.0 - smoothstep(-px, px, max(q.x, q.y)));
  }
  return alb * ao;
}
// The dust: specks that hang in the air and show only where a beam takes them.
float hbDust(vec2 p) {
  float sum = 0.0;
  for (int i = 0; i < 2; i++) {
    float f = float(i), g = 26.0 + 14.0 * f, w = g / uRes.y;
    vec2 q = p * g + vec2(0.05, 0.03 - 0.06 * f) * uTime + vec2(0.1 * uTravel, 7.3 * f), h = hash22(floor(q) + 31.0 * f);
    float r = w * (0.25 + 0.5 * h.x * h.y) + 0.008;
    sum += (1.0 - smoothstep(r - w, r + w, length(fract(q) - 0.15 - 0.7 * h))) * h.y * smoothstep(0.35, 0.9, h.x);
  }
  return sum * (0.12 + 1.2 * uHigh + 2.5 * uKeys);
}
// A beam on a surface, and what its pool throws back into the room.
vec3 hbLit(vec3 S, vec3 A, vec3 C, vec3 F, float R, float len, vec3 P, vec3 N) {
  vec3 to = S - P, f = F + vec3(0.0, 0.3, 0.0) - P;
  float d = 1.0 / (1.0 + 0.35 * dot(f, f));
  return C * (hbAt(S, A, R, len, P) * sat(dot(N, to) / len) * 4.6 + 0.3 * d * (0.35 + 0.9 * d * max(dot(N, f), 0.0)));
}
vec3 hbHall(vec2 p, vec3 ro, vec3 rd, float t, vec3 P, vec3 N, float stuff) {
  hbBeams();
  // the light of the day outside, from nowhere one can see
  vec3 L = mix(vec3(0.95, 0.96, 1.0), vec3(1.0, 0.96, 0.9), 0.5 + 0.5 * N.x) * mix(0.10, 1.0, smoothstep(-6.5, 5.5, P.x)) * (0.56 + 0.28 * N.y - 0.40 * N.x) * (0.2 + 0.8 * hbFade(0.16 * max(P.y, 0.0)));
#define HB_L(k) if (hbC[k].g > 0.004) L += hbLit(hbS[k], hbA[k], hbC[k], hbF[k], hbR[k], hbLen[k], P, N);
  HB_ALL(HB_L)
  vec3 col = L * stuff;
  float fog = 1.0 - hbFade(t * 0.03 * (0.6 + 0.5 * uLow + 0.4 * uSpace + 0.4 * uMic));
  col = mix(col, vec3(0.24, 0.243, 0.245) * (0.45 + 0.55 * hbFade(0.2 * max(P.y, 0.0))) * mix(0.4, 1.15, smoothstep(-5.0, 4.0, P.x)), fog);
  // the floor is a little polished, and the steep beam shows in it
  if (N.y > 0.5) {
    float fr = 1.0 + rd.y, tm = min((hbEnd - P.z) / rd.z, 9.0);
    vec3 m = hbC[1] * hbRay(hbS[1], hbA[1], hbR[1], hbLen[1], P, vec3(rd.x, -rd.y, rd.z), tm, false);
    fr *= fr; col += m * hbHaze * (0.08 + 0.5 * fr * fr);
  }
  vec3 air = hbAir(ro, rd, t);
  return col + air * (1.0 / (1.0 + 0.3 * air.g) + hbDust(p));
}

// Sheet. One flat fan of light from S, lying square to n: the slice of smoke in it, and the line it draws on what it meets.
vec3 hbPage(vec3 ro, vec3 rd, float t1, vec3 P1, vec3 N1, float px, vec3 S, vec3 n, vec2 c, float wide, float l, float rest, vec3 kind, float f, vec2 tip) {
  float amp = rest * (1.0 - 0.5 * l) + l * (0.55 + 0.85 * uEnergy);
  if (amp < 0.004) return vec3(0.0);
  n = normalize(n + vec3(tip.x, 0.0, tip.y));
  float nd = dot(rd, n), t = dot(S - ro, n) / (abs(nd) < 1e-3 ? 1e-3 : nd), soft = mix(0.16, 0.02, uTone);
  wide *= 0.85 + 0.2 * l + 1.0 * uCue * (1.0 - uCue);
  // where the ray meets the sheet, or else the wall; the edge between the two is a pixel soft
  float side = dot(P1 - S, n), fc = dot(n, N1), slant = sqrt(max(1.0 - fc * fc, 0.02));
  float meets = t > 0.0 ? smoothstep(-0.9, 0.9, side * (dot(S - ro, n) > 0.0 ? 1.0 : -1.0) / (px * slant)) : 0.0;
  vec3 P = ro + rd * (meets > 0.0 ? min(t, t1) : t1), w = P - S;
  float gx = dot(w.xz, c), half_ = max(gx * 1.07 * wide, 0.1), foot = meets > 0.0 ? min(px / (max(abs(nd), 0.02) * half_), 0.6) : 0.0;
  float m = smoothstep(-0.1, 0.4, gx) * (1.0 - smoothstep(1.0 - soft - foot, 1.02 + 0.3 * foot, abs(dot(w.xz, vec2(-c.y, c.x))) / half_)), past = hbPast(P, S);
  // the line it draws, and its light on what is near
  float dl = abs(side), lw = (0.032 + 1.28 * px) * slant, near = max(1.0 - 0.25 * dl, 0.0);
  float sum = (1.0 - smoothstep(0.0, lw, dl)) * 0.52 * past + (0.036 + 0.048 * uCue + 0.032 * uMic) * near * near * near;
  if (meets > 0.0) {
    // a slice of the smoke
    vec2 q = P.xz * 0.6 + vec2(-0.035, 0.012) * uTime - vec2(0.03, 0.0) * uTravel + 7.0 * f;
    float n1 = noise(q), n2 = noise(q * 2.1 + 2.2 * n1 + vec2(0.02, 0.05) * uTime), n3 = noise(q * 5.0 + vec2(3.2, -2.2) * n2 - n1);
    float s = smoothstep(0.30, 0.72, 0.5 * n1 + 0.33 * n2 + 0.2 * n3);
    sum += smoothstep(0.0, 1.5, gx) * (0.06 + 1.2 * s * s + (0.5 * uHigh + 1.2 * uKeys) * n3 * n3 * n3) * min(1.0 / max(abs(nd), 0.02), 9.0) * 0.19 * past * meets;
  }
  return hbGel(kind, 0.6 * smoothstep(0.0, 0.5, l + 0.1)) * amp * sum * m * 8.0 / (4.0 + length(w));
}
vec3 hbSheet(vec3 ro, vec3 rd, float t, vec3 P, vec3 N, float px, float stuff) {
  vec3 col = stuff * vec3(0.8, 0.9, 1.0) * 0.02 * (0.8 + 0.4 * N.y - 0.3 * N.z), L = vec3(0.0);
  vec4 w = sin(uTime * vec4(0.053, 0.037, 0.071, 0.044) + vec4(0.0, 2.1, 4.0, 1.3)) * vec4(0.03, 0.02, 0.03, 0.02);
#define HB_P(k, S, n, c, wide, l, rest, tip) L += hbPage(ro, rd, t, P, N, px, S, n, c, wide, l, rest, uKind[k], float(k), tip);
  HB_P(0, vec3(-7.0, 1.9, 5.0), vec3(0.06, 1.0, 0.03), vec2(0.94, -0.34), 0.50, uDrone, 0.8, w.xy)
  HB_P(1, vec3(-7.5, 5.0, 6.0), vec3(0.16, 1.0, -0.02), vec2(0.955, -0.296), 0.36, uPad, 0.0, w.zw)
  HB_P(2, vec3(-6.5, 0.35, 2.5), vec3(-0.22, 1.0, -0.07), vec2(0.989, 0.149), 0.36, uTexture, 0.0, w.zy)
  HB_P(3, vec3(-7.0, 7.4, 4.0), vec3(0.62, 1.0, 0.22), vec2(1.0, 0.0), 0.22, uPhrase, 0.0, w.xw)
  HB_P(4, vec3(-7.0, 3.6, 7.0), vec3(0.12, 1.0, -0.10), vec2(0.955, -0.296), 0.24, 1.3 * uHits, 0.0, w.zw)
  return col + L * (0.75 + 0.5 * uLow + 0.2 * uSpace);
}
vec3 render(vec2 p) {
  vec3 rd = normalize(vec3(p.x, p.y - hbShift, hbFocal)), N;
  float t = hbRoom(hbEye, rd, N), px = t / (uRes.y * hbFocal);
  vec3 P = hbEye + rd * t;
  float stuff = hbStuff(P, N, px);
  if (uVar > 0.5) return screenOf(hbSheet(hbEye, rd, t, P, N, px, stuff));
  return screenOf(hbHall(p, hbEye, rd, t, P, N, stuff));
}
