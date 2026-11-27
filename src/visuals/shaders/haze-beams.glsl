// name: Haze beams
// a: Pale hall
// b: Sheet
// what: An empty pale hall with a row of square piers: a few wide soft beams slant in from the left through slow haze and dust, cut by the piers, and lie as pools on the floor and the far wall; or the hall at night, crossed by flat sheets of light seen nearly edge-on, slices of drifting smoke shining in them, the piers' shadows across.
// follows: Drone, pads, texture and phrase are each a beam or a sheet of their own, opening and brightening as they sound; a hit lights one more and dies; a cue widens them all and fills the haze; the low band thickens the haze, the bands light it from floor to roof by day, highs and keys bring out dust or fine smoke; a voice mists the hall or lifts the night walls.
// own: 0 the piers: 1 a wood of round trunks stands all over, -1 they are gone; 1 the room: 1 no walls, open to the haze, -1 a round low vault; 2 1 dark but for the beams, -1 bright day; 3 1 each beam is broken into many fine rays, as through leaves (b: into blades), -1 wide and soft; 4 where from: 1 straight down from above (b: upright blades), -1 up from the floor; 5 the floor: 1 still water that mirrors, -1 mist lies on it; 6 1 painted in the colours of the kinds, -1 rough rock and bark; 7 the eye: 1 low and looking up, -1 high and looking down
vec3 hbS[5], hbA[5], hbC[5], hbF[5];  // each beam: where it comes from, its way, its colour as light, the middle of its pool
float hbR[5], hbLen[5];               // how wide it opens, how far it goes
float hbHaze;                         // how thick the haze is
const vec3 hbEye = vec3(0.6, 2.7, -6.6);
const float hbPx = -3.2, hbPw = 0.30, hbWall0 = 5.0, hbEnd0 = 8.0;  // the row of piers, half a pier, the right wall, the end wall
float hbWood;
// where the walls are and how thick half a pier is, in this world; whether there is one
#define hbOpen max(uOwn[1], 0.0)
#define hbWall (hbWall0 + 70.0 * hbOpen)
#define hbEnd (hbEnd0 + 80.0 * hbOpen)
#define hbLeft (-8.0 - 70.0 * hbOpen)
#define hbP (hbPw * (1.0 - abs(uOwn[0])))
#define hbAny sat(4.0 * max(max(max(abs(uOwn[0]), abs(uOwn[1])), max(abs(uOwn[2]), abs(uOwn[3]))), max(max(abs(uOwn[4]), abs(uOwn[5])), max(abs(uOwn[6]), abs(uOwn[7])))))
// the trunks: where they stand, how thick; the first ten are near enough to throw a shadow
const int HB_TRUNKS = 16;
const vec3 hbT[HB_TRUNKS] = vec3[HB_TRUNKS](vec3(-5.565, -0.923, 0.147), vec3(-1.747, 0.295, 0.245), vec3(2.06, -0.133, 0.235), vec3(5.083, 0.498, 0.262), vec3(-5.262, 2.695, 0.23), vec3(-1.931, 3.113, 0.186), vec3(2.045, 2.87, 0.155), vec3(7.929, 1.855, 0.176), vec3(-11.523, 4.156, 0.181), vec3(-1.976, 4.789, 0.264), vec3(0.268, 4.846, 0.197), vec3(9.136, 4.383, 0.22), vec3(-8.891, 7.513, 0.243), vec3(-3.383, 8.352, 0.235), vec3(5.978, 6.817, 0.219), vec3(9.946, 6.989, 0.214));
#define HB_EACH(work) { int k = 0; do { work } while (++k < 5); } // written so that nothing is worked out once more than it is needed
const float hbFocal = 1.25, hbShift = 0.10;

// What a sound's colour is as a gel in front of a lamp.
vec3 hbGel(vec3 c, float rich) {
  c *= c;
  c /= max(dot(c, vec3(0.3, 0.59, 0.11)), 0.03);
  return mix(vec3(1.0, 0.95, 0.87), min(c, 2.4), rich);
}
float hbFade(float q) { return 1.0 / (1.0 + q * (1.0 + q * (0.5 + 0.2 * q))); } // like exp(-q), for q of 0 and over
// Across a beam: y is 1 on its axis, 0 at its rim.
float hbRound(float y) { return y * mix(y, 2.0 - y, (0.15 + 0.85 * uTone) * (1.0 - 0.9 * max(-uOwn[3], 0.0))); }
// The fine rays a beam is broken into, across it.
float hbFine(float x, float seed) { float n = noise(vec2(x * 5.0 + seed * 7.0, uTime * 0.05 + seed)) * 0.6 + 0.4 * noise(vec2(x * 13.0 - seed * 3.0, seed * 5.0 - uTime * 0.04)); return 2.3 * smoothstep(0.42, 0.75, n); }

void hbBeam(out vec3 S, out vec3 A, out vec3 C, out vec3 F, out float R, out float len, vec3 from, vec3 to, float wide, float l, float rest, float give, vec3 kind, vec2 sway) {
  F = to; S = from; F.xz += sway;
  if (uOwn[4] > 0.0 && F.y > 1.0) F = mix(F, vec3(-2.4 + sway.x, 0.0, 2.4), uOwn[4]);
  if (uOwn[4] > 0.0) S = mix(S, vec3(F.x * 0.9 - 0.8, 12.5, F.z + 0.9), uOwn[4]);
  if (uOwn[4] < 0.0) { S = mix(S, vec3(F.x * 1.5 - 1.6, -0.4, F.z * 0.45 + 2.2), -uOwn[4]); F = mix(F, vec3(F.x * 2.6 - 2.5 + 1.2 * sway.y, 11.0, 5.5 + 2.0 * sway.x), -uOwn[4]); wide *= 1.0 - 0.7 * uOwn[4]; }
  if (uOwn[3] != 0.0) wide *= 1.0 + 0.5 * uOwn[3] + 1.3 * max(-uOwn[3], 0.0);
  A = F - S; len = length(A); A /= len;
  R = wide * (0.84 + 0.26 * l + 0.9 * uCue * (1.0 - uCue)) * (0.85 + 0.3 * uSpace);
  C = hbGel(kind, (0.42 + 0.46 * hbAny) * smoothstep(0.0, 0.5, l + 0.1 + 0.4 * hbAny)) * (rest * (1.0 - 0.6 * l) + l * give * (0.55 + 0.85 * uEnergy));
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
  if (hbAny == 0.0) return s > 1.0 ? 1.0 : smoothstep(hbPw - w, hbPw + w, q);
  float k = 1.0;
  if (hbP > 0.0) k = s > 1.0 ? 1.0 : mix(1.0, smoothstep(hbP - w, hbP + w, q), smoothstep(0.0, 0.1, hbP) * (1.0 - smoothstep(-1.0, 0.0, S.x - at)));
  if (uOwn[0] > 0.0) {
    vec2 d = P.xz - S.xz;
    float dd = max(dot(d, d), 1e-3), il = inversesqrt(dd), id = il * il;
#define HB_SHADE(TX, TZ, TR) { vec2 c = vec2(TX, TZ) - S.xz; float a = dot(c, d) * id, w2 = 0.34 - 0.3 * a; k *= a > 0.0 && a < 0.98 ? 1.0 - uOwn[0] * (1.0 - smoothstep(-w2, w2, abs(c.x * d.y - c.y * d.x) * il - TR * uOwn[0])) : 1.0; }
    int i = 0;
    do HB_SHADE(hbT[i].x, hbT[i].y, hbT[i].z) while (++i < 10);
  }
  return k;
}
// The light of a beam on a surface at P: its round, its falling off.
float hbAt(vec3 S, vec3 A, float R, float len, vec3 P) {
  vec3 v = P - S;
  float a = max(dot(v, A), 0.5), y = 1.0 - max(dot(v, v) - a * a, 0.0) / (a * a * R * R), fine = 1.0;
  if (y > 0.0 && uOwn[3] > 0.0) {                  // it lies there in spots, as under leaves
    vec2 q = (v / a - A).xz / R * 3.2 + S.xy;
    fine = mix(1.0, 2.4 * smoothstep(0.42, 0.72, noise(q * 1.2 + uTime * 0.04) * 0.55 + 0.45 * noise(q * 2.9 - uTime * 0.05)), uOwn[3]);
  }
  return y <= 0.0 ? 0.0 : fine * hbRound(y) * len / a * hbPast(P, S);
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
    if (uOwn[3] > 0.0) { vec3 sd = cross(A, rd); f *= mix(1.0, hbFine(dot(v, sd) / (max(length(sd), 0.05) * r), S.z), uOwn[3]); }
    if (smoke && f > 0.0) {
      vec3 a = ro + rd * max(tn - 0.5 * hc, 0.0), b = ro + rd * min(tn + 0.5 * hc, t1);
      f *= hbSmoke(0.5 * (a + b)) * (hbPast(a, S) + hbPast(b, S)) * 0.5;
    }
    sum += f;
  }
  if (uOwn[4] != 0.0) sum *= smoothstep(-0.3, 1.2, dot(v, A));
  return sum * 2.0 * len / (al + len + 1.0);
}
vec3 hbAir(vec3 ro, vec3 rd, float t1) {
  vec3 sum = vec3(0.0);
  HB_EACH(if (hbC[k].g > 0.004) sum += hbC[k] * hbRay(hbS[k], hbA[k], hbR[k], hbLen[k], ro, rd, t1, k < 4);)
  return sum * hbHaze * (0.8 + 0.9 * uEnergy * band((ro.y + rd.y * min(t1, 9.0)) * 0.11));
}
// The bare room along a ray: how far, which way the surface looks.
float hbRoom(vec3 ro, vec3 rd, out vec3 N) {
  float ix = 1.0 / (abs(rd.x) < 1e-4 ? 1e-4 : rd.x), tx = ((rd.x > 0.0 ? hbWall : hbLeft) - ro.x) * ix, tz = (hbEnd - ro.z) / rd.z, ty = rd.y < -1e-4 ? -ro.y / rd.y : 1e4;
  float t = min(min(tx, tz), ty);
  N = t == ty ? vec3(0, 1, 0) : t == tx ? vec3(-sign(rd.x), 0, 0) : vec3(0, 0, -1);
  if (hbP > 0.0) for (int i = 0; i < 4; i++) {
    vec2 c = vec2(hbPx, -1.0 + 3.0 * float(i)) - ro.xz, m = vec2(ix, 1.0 / rd.z), n = c * m, e = abs(m) * hbP;
    float n0 = max(n.x - e.x, n.y - e.y), n1 = min(n.x + e.x, n.y + e.y);
    if (n0 < n1 && n0 > 0.0 && n0 < t) { t = n0; N = n.x - e.x > n.y - e.y ? vec3(-sign(rd.x), 0, 0) : vec3(0, 0, -1); }
  }
  if (uOwn[1] < 0.0) {                             // the vault comes down round the hall
    float big = 4.7 + 40.0 * (1.0 + uOwn[1]);
    vec2 o = vec2(ro.x + 0.5, ro.y - 0.6), d = rd.xy;
    float a = max(dot(d, d), 1e-5), b = dot(o, d), c = dot(o, o) - big * big, h = b * b - a * c;
    float tv = h > 0.0 ? (sqrt(h) - b) / a : -1.0;
    if (tv > 0.0 && tv < t) { t = tv; N = vec3(-(o + d * tv) / big, 0.0); }
  }
  if (uOwn[0] > 0.0) {
    float a = max(dot(rd.xz, rd.xz), 1e-5), ia = 1.0 / a;
    vec3 on = vec3(0.0);
#define HB_STAND(TX, TZ, TR) { vec2 o = ro.xz - vec2(TX, TZ); float q = o.x * rd.z - o.y * rd.x, h = a * TR * TR * uOwn[0] * uOwn[0] - q * q; if (h > 0.0) { float tt = (-dot(o, rd.xz) - sqrt(h)) * ia; if (tt > 0.0 && tt < t) { t = tt; on = vec3(o, TR * uOwn[0]); } } }
    int i = 0;
    do HB_STAND(hbT[i].x, hbT[i].y, hbT[i].z) while (++i < HB_TRUNKS);
    if (on.z > 0.0) { vec2 n2 = (on.xy + rd.xz * t) / max(on.z, 1e-3); N = vec3(n2.x, 0.0, n2.y); hbWood = 1.0; }
  }
  return t;
}
// What the surfaces are made of, with the dark in their corners: pale plaster and stone slabs.
float hbStuff(vec3 P, vec3 N, float px) {
  float alb, ao = 1.0, grain = noise(N.y > 0.5 ? P.xz * vec2(1.0, 0.7) : (abs(N.x) > 0.5 ? P.zy : P.xy) * vec2(1.7, 0.6));
  if (N.y > 0.5) {
    vec2 s = (P.xz - vec2(hbPx, 0.5)) / 3.0, g = (0.5 - abs(fract(s) - 0.5)) * 3.0, w = vec2(px, 3.0 * px);
    vec2 j = (1.0 - smoothstep(vec2(0.006), vec2(0.012) + w, g)) * min(vec2(1.0), 0.016 / (0.008 + w));
    float slab = 1.0;
    if (hbAny > 0.0) slab = (1.0 - max(uOwn[1], 0.0)) * (1.0 - max(uOwn[0], 0.0)) * (1.0 - max(-uOwn[6], 0.0));
    alb = (0.63 + 0.05 * hash21(floor(s)) * slab + 0.13 * grain) * (1.0 - 0.4 * max(j.x, j.y) * slab);
    vec2 q = max(abs(vec2(P.x - hbPx, mod(P.z + 2.5, 3.0) - 1.5)) - hbPw, 0.0);
    if (hbP > 0.0) ao -= 0.5 * hbFade(4.0 * length(q)) * (hbAny > 0.0 ? smoothstep(0.0, 0.1, hbP) : 1.0);
    float foot = 1e3;
    if (uOwn[0] > 0.0) {
      int i = 0;
      do foot = min(foot, length(P.xz - hbT[i].xy) - hbT[i].z * uOwn[0]); while (++i < HB_TRUNKS);
      ao *= 1.0 - 0.55 * hbFade(3.0 * max(foot, 0.0)) * smoothstep(0.0, 0.1, 0.2 * uOwn[0]);
    }
  } else {
    alb = 0.66 + 0.08 * grain;
    ao -= 0.4 * hbFade(1.8 * max(P.y, 0.0));
  }
  if (abs(N.x) < 0.5) ao -= 0.35 * hbFade(1.4 * max(hbWall - P.x, 0.0));
  if (abs(N.z) < 0.5) ao -= 0.3 * hbFade(1.4 * max(hbEnd - P.z, 0.0));
  if (N.z < -0.5 && P.z > hbEnd - 0.01) {
    vec2 q = abs(P.xy - vec2(2.6, 0.9)) - vec2(0.5, 1.3);
    alb *= 1.0 - 0.9 * (1.0 - smoothstep(-px, px, max(q.x, q.y))) * (hbAny > 0.0 ? 1.0 - max(uOwn[1], 0.0) : 1.0);
  }
  if (uOwn[6] < 0.0) {                             // rock and bark
    vec2 q = N.y > 0.5 ? P.xz : hbWood > 0.5 ? vec2((P.x + P.z) * 6.0, P.y * 0.8) : vec2(P.z + P.x, P.y) * 1.2;
    float fine = (1.0 - smoothstep(0.02, 0.12, px)), r = fbm(q * 1.1 + 4.0), v = noise(q * 4.1 + 2.0 * r);
    r = mix(0.52, r, (1.0 - smoothstep(0.05, 0.3, px))); alb *= mix(1.0, (0.12 + 1.15 * r * r) * mix(1.0, 0.35 + 1.2 * v, fine), -uOwn[6]);
  }
  return alb * ao;
}
// The colours the surfaces are painted in.
vec3 hbPaint(vec3 P, vec3 N) {
  vec3 k = hbWood > 0.5 ? uKind[0] : N.y > 0.5 ? uKind[2] : abs(N.x) > 0.5 && P.x < hbWall - 0.1 ? uKind[0] : uKind[1];
  if (uOwn[1] < 0.0 && N.y < -0.02) k = uKind[1];
  return mix(vec3(1.0), k * k * 1.7 + 0.03, uOwn[6] > 0.0 ? uOwn[6] : 0.3 * hbAny);
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
// Water on the floor, or mist.
vec3 hbRip(vec3 P, float t) { // the still water's face
  float a = 0.016 * hbFade(0.12 * t) * (1.0 + uLow);
  vec2 q = P.xz * vec2(1.4, 2.6);
  return normalize(vec3(a * (noise(q + vec2(0.0, 0.3 * uTime)) - 0.5), 1.0, 2.0 * a * (noise(q * 1.3 + vec2(0.2 * uTime, 9.0)) - 0.5)));
}
vec3 hbFloor(vec3 col, vec2 p, vec3 ro, vec3 rd, float t, vec3 P, vec3 N) {
  if (uOwn[5] > 0.0 && N.y > 0.9 && P.y < 0.02) {
    vec3 rf = reflect(rd, hbRip(P, t)), N2;
    rf.y = max(rf.y, 0.01); rf.z = max(rf.z, 0.02); if (abs(rf.x) < 3e-4) rf.x = 3e-4;
    float wood = hbWood; hbWood = 0.0;
    float t2 = hbRoom(P + vec3(0.0, 0.01, 0.0), rf, N2);
    vec3 P2 = P + rf * t2, L = vec3(0.0);
    float st = hbStuff(P2, N2, 0.06);
    vec3 back = hbPaint(P2, N2) * st * mix(0.12, 1.0, smoothstep(-6.5, 5.5, P2.x)) * 0.42 * hbFade(0.1 * P2.y);
    hbWood = wood;
    vec3 far = mix(vec3(0.95, 0.97, 1.0), uKind[1], 0.6) * 0.3;
    back = mix(back, far, 1.0 - hbFade((t + t2) * 0.035)) * (1.0 - 0.95 * max(uOwn[2], 0.0) + 2.0 * max(-uOwn[2], 0.0));
    back += hbAir(P, rf, t2) * 0.9;
    float fr = 0.3 + 0.7 * pow(sat(1.0 + rd.y), 3.0);
    col = mix(col, col * 0.16 + back * fr * 1.15, uOwn[5]);
  }
  if (uOwn[5] < 0.0) {
    const float top = 1.0;
    float t0 = rd.y < -1e-3 ? max((top - ro.y) / rd.y, 0.0) : ro.y < top ? 0.0 : 1e3;
    if (t0 < t) {
      vec3 E = ro + rd * mix(t0, t, 0.3);
      float n = noise(E.xz * 0.5 + vec2(0.08, -0.03) * uTime) * 0.6 + 0.4 * noise(E.xz * 1.3 - vec2(0.05, 0.04) * uTime + 5.0), D = 1.0 - exp(-(t - t0) * (0.25 + 1.6 * n * n));
      vec3 c = mix(vec3(0.95, 0.97, 1.0), uKind[1], 0.5) * 0.3 * (1.0 - 0.93 * max(uOwn[2], 0.0) + 1.8 * max(-uOwn[2], 0.0)) * (0.6 + 0.7 * n);
      HB_EACH(if (hbC[k].g > 0.004) c += hbC[k] * hbAt(hbS[k], hbA[k], hbR[k] * 1.2, hbLen[k], E) * 0.9 * (0.4 + n);)
      col = mix(col, c, D * -uOwn[5]);
    }
  }
  return col;
}
vec3 hbHall(vec2 p, vec3 ro, vec3 rd, float t, vec3 P, vec3 N, float stuff) {
  hbBeams();
  // the light of the day outside, from nowhere one can see
  vec3 L = mix(vec3(0.95, 0.96, 1.0), vec3(1.0, 0.96, 0.9), 0.5 + 0.5 * N.x) * mix(0.10, 1.0, smoothstep(-6.5, 5.5, P.x)) * (0.56 + 0.28 * N.y - 0.40 * N.x) * (0.2 + 0.8 * hbFade(0.16 * max(P.y, 0.0)));
  if (hbAny > 0.0) {
    vec3 sky = mix(mix(vec3(0.95, 0.96, 1.0), uKind[1], 0.45 * hbAny), vec3(1.0, 0.97, 0.92), max(-uOwn[2], 0.0) * 0.4);
    L *= mix(vec3(1.0), sky, hbAny) * (1.0 - 0.96 * max(uOwn[2], 0.0) + 1.5 * max(-uOwn[2], 0.0));
    if (uOwn[1] != 0.0) L *= 1.0 + max(uOwn[1], 0.0) * 0.5 + 0.45 * uOwn[1] * step(uOwn[1], 0.0);
    if (uOwn[6] < 0.0) L *= 1.0 + uOwn[6] * 0.25;
  }
  HB_EACH(if (hbC[k].g > 0.004) L += hbLit(hbS[k], hbA[k], hbC[k], hbF[k], hbR[k], hbLen[k], P, N);)
  vec3 col = L * stuff;
  if (hbAny > 0.0) col *= hbPaint(P, N);
  float fog = 1.0 - hbFade(t * 0.03 * (0.6 + 0.5 * uLow + 0.4 * uSpace + 0.4 * uMic));
  col = mix(col, vec3(0.24, 0.243, 0.245) * (0.45 + 0.55 * hbFade(0.2 * max(P.y, 0.0))) * mix(0.4, 1.15, smoothstep(-5.0, 4.0, P.x)), fog);
  if (hbAny > 0.0) {
    vec3 far = mix(vec3(0.95, 0.97, 1.0), uKind[1], 0.6) * 0.3 * (1.0 - 0.95 * max(uOwn[2], 0.0) + 2.6 * max(-uOwn[2], 0.0));
    if (uOwn[1] > 0.0) far *= 1.0 + 0.6 * uOwn[1] * hbFade(abs(rd.y) * 5.0);
    vec3 was = L * stuff * hbPaint(P, N);
    col = mix(col, mix(was, far * mix(0.75, 1.1, smoothstep(-8.0, 5.0, P.x)), mix(fog, 1.0, max(uOwn[1], 0.0) * smoothstep(12.0, 45.0, t))), hbAny);
    if (uOwn[5] != 0.0) col = hbFloor(col, p, ro, rd, t, P, N);
  }
  // the floor is a little polished, and the steep beam shows in it
  if (N.y > 0.5 && uOwn[5] <= 0.0 && uOwn[6] >= 0.0) {
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
  vec3 ax = vec3(c.x, 0.0, c.y);
  if (uOwn[4] != 0.0) {                            // upright: blades that come down from above, or stand up from the floor
    float o = abs(uOwn[4]), dn = uOwn[4] > 0.0 ? 1.0 : 0.0, x = f - 2.0;
    S = mix(S, mix(vec3(1.0 + 1.5 * x, -0.6, 1.0 + 1.1 * f), vec3(1.0 + 2.3 * x + (f == 1.0 ? 0.7 : 0.0), 10.5, 10.5 - 0.8 * f), dn), o);
    ax = normalize(mix(ax, mix(vec3(0.1 * x, 0.95, 0.3), vec3(-0.06 * x, -0.95, -0.25), dn), o));
    n = mix(n, vec3(0.8, 0.1 * x, 0.5 + 0.14 * x), o);
    n -= ax * dot(n, ax) * o; n = dot(n, n) > 1e-4 ? n : vec3(1.0, 0.0, 0.0); wide *= 1.0 + 0.5 * o;
  }
  if (uOwn[3] < 0.0) wide *= 1.0 - 0.9 * uOwn[3];
  n = normalize(n + vec3(tip.x, 0.0, tip.y));
  float nd = dot(rd, n), t = dot(S - ro, n) / (abs(nd) < 1e-3 ? 1e-3 : nd), soft = mix(0.16, 0.02, uTone);
  wide *= 0.85 + 0.2 * l + 1.0 * uCue * (1.0 - uCue);
  // where the ray meets the sheet, or else the wall; the edge between the two is a pixel soft
  float side = dot(P1 - S, n), fc = dot(n, N1), slant = sqrt(max(1.0 - fc * fc, 0.02));
  float meets = t > 0.0 ? smoothstep(-0.9, 0.9, side * (dot(S - ro, n) > 0.0 ? 1.0 : -1.0) / (px * slant)) : 0.0;
  vec3 P = ro + rd * (meets > 0.0 ? min(t, t1) : t1), w = P - S;
  float gx = uOwn[4] != 0.0 ? dot(w, ax) : dot(w.xz, c), off = uOwn[4] != 0.0 ? dot(w, cross(n, ax)) : dot(w.xz, vec2(-c.y, c.x)), half_ = max(gx * 1.07 * wide, 0.1), foot = meets > 0.0 ? min(px / (max(abs(nd), 0.02) * half_), 0.6) : 0.0;
  float m = smoothstep(-0.1, 0.4, gx) * (1.0 - smoothstep(1.0 - soft - foot, 1.02 + 0.3 * foot, abs(off) / half_)), past = hbPast(P, S);
  if (uOwn[3] > 0.0) m *= mix(1.0, hbFine(1.1 * off / half_ + 3.0 * tip.x, f + 1.0) * 1.3, uOwn[3] * (1.0 - smoothstep(0.08, 0.5, foot)));
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
  return hbGel(kind, (0.6 + 0.3 * hbAny) * smoothstep(0.0, 0.5, l + 0.1 + 0.4 * hbAny)) * amp * sum * m * 8.0 / (4.0 + length(w));
}
const vec3 hbPS[5] = vec3[5](vec3(-7.0, 1.9, 5.0), vec3(-7.5, 5.0, 6.0), vec3(-6.5, 0.35, 2.5), vec3(-7.0, 7.4, 4.0), vec3(-7.0, 3.6, 7.0));
const vec3 hbPN[5] = vec3[5](vec3(0.06, 1.0, 0.03), vec3(0.16, 1.0, -0.02), vec3(-0.22, 1.0, -0.07), vec3(0.62, 1.0, 0.22), vec3(0.12, 1.0, -0.10));
const vec3 hbPC[5] = vec3[5](vec3(0.94, -0.34, 0.50), vec3(0.955, -0.296, 0.36), vec3(0.989, 0.149, 0.36), vec3(1.0, 0.0, 0.22), vec3(0.955, -0.296, 0.24));
vec3 hbSheet(vec3 ro, vec3 rd, float t, vec3 P, vec3 N, float px, float stuff) {
  vec3 col = stuff * vec3(0.8, 0.9, 1.0) * 0.02 * (0.8 + 0.4 * N.y - 0.3 * N.z), L = vec3(0.0);
  vec4 w = sin(uTime * vec4(0.053, 0.037, 0.071, 0.044) + vec4(0.0, 2.1, 4.0, 1.3)) * vec4(0.03, 0.02, 0.03, 0.02);
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, 1.3 * uHits);
  vec2 tip[5] = vec2[5](w.xy, w.zw, w.zy, w.xw, w.zw);
#define HB_PAGES(a, b, d, e, g, h) HB_EACH(L += hbPage(a, b, d, e, g, h, hbPS[k], hbPN[k], hbPC[k].xy, hbPC[k].z, lv[k], k < 1 ? 0.8 : 0.0, uKind[k], float(k), tip[k]);)
  HB_PAGES(ro, rd, t, P, N, px)
  if (hbAny > 0.0) {
    vec3 sky = mix(vec3(0.95, 0.96, 1.0), uKind[1], 0.5), far = mix(vec3(1.0), uKind[1], 0.6);
    float day = max(-uOwn[2], 0.0), open = max(uOwn[1], 0.0), fog = mix(1.0 - hbFade(t * 0.05), 1.0, max(uOwn[1], 0.0) * smoothstep(12.0, 45.0, t));
    vec3 own = stuff * hbPaint(P, N) * sky * (0.03 + 0.95 * day + 0.12 * abs(uOwn[6])) * (0.6 + 0.3 * N.y - 0.3 * N.x) * (0.25 + 0.75 * hbFade(0.12 * max(P.y, 0.0)));
    own = mix(own, far * (0.02 + 0.85 * day) * (1.0 + 1.4 * open * hbFade(abs(rd.y) * 5.0)), fog);
    col = mix(col, own * (1.0 - 0.6 * max(uOwn[2], 0.0)), hbAny);
    if (uOwn[5] > 0.0 && N.y > 0.9 && P.y < 0.02) {
      vec3 rf = reflect(rd, hbRip(P, t)), N2, R = vec3(0.0), O = P + vec3(0.0, 0.01, 0.0);
      rf.y = max(rf.y, 0.01); rf.z = max(rf.z, 0.02); if (abs(rf.x) < 3e-4) rf.x = 3e-4;
      float wood = hbWood; hbWood = 0.0;
      float t2 = hbRoom(O, rf, N2);
      vec3 P2 = O + rf * t2, keep = L, back = hbPaint(P2, N2) * 0.5 * sky * (0.03 + 0.8 * day);
      hbWood = wood; L = vec3(0.0);
      HB_PAGES(O, rf, t2, P2, N2, 0.03)
      R = mix(back, far * (0.02 + 0.5 * day), 1.0 - hbFade((t + t2) * 0.05)) + L * (0.75 + 0.5 * uLow);
      L = keep; col = mix(col, col * 0.15 + R * (0.3 + 0.7 * pow(sat(1.0 + rd.y), 3.0)), uOwn[5]);
    }
    if (uOwn[5] < 0.0) {
      float t0 = rd.y < -1e-3 ? max((0.9 - ro.y) / rd.y, 0.0) : 1e3;
      if (t0 < t) {
        vec3 E = ro + rd * mix(t0, t, 0.3);
        float n2 = noise(E.xz * 0.5 + vec2(0.08, -0.03) * uTime) * 0.6 + 0.4 * noise(E.xz * 1.3 - vec2(0.05, 0.04) * uTime + 5.0), D = -uOwn[5] * (1.0 - exp(-(t - t0) * (0.2 + 1.5 * n2 * n2)));
        col = mix(col, (far * (0.05 + 0.5 * day) + 0.12 * uKind[1] + 0.5 * uKind[0] * uKind[0] * uDrone) * (0.5 + 0.8 * n2), D);
        L *= 1.0 + 0.6 * D * n2;
      }
    }
    if (day > 0.0) {                               // by day a sheet is a film of colour, and takes light away
      float mx = max(L.r, max(L.g, L.b));
      col *= mix(vec3(1.0), exp(-(mx - L) * 2.4 - 0.3 * mx), day); L *= 1.0 - 0.8 * day;
    }
  }
  return col + L * (0.75 + 0.5 * uLow + 0.2 * uSpace);
}
vec3 render(vec2 p) {
  vec3 rd = normalize(vec3(p.x, p.y - hbShift, hbFocal)), N, eye = hbEye;
  hbWood = 0.0;
  if (hbAny > 0.0) {
    if (uOwn[7] > 0.0) { eye.y -= 1.9 * uOwn[7]; rd.yz = rot(0.42 * uOwn[7]) * rd.yz; }
    if (uOwn[7] < 0.0) { eye.y -= 6.0 * uOwn[7]; eye.z -= 0.6 * uOwn[7]; rd.yz = rot(0.66 * uOwn[7]) * rd.yz; }
    if (uOwn[1] < 0.0) eye.y = min(eye.y, 4.3 + 40.0 * (1.0 + uOwn[1]));
    rd.z = max(rd.z, 0.02);
  }
  float t = hbRoom(eye, rd, N), px = t / (uRes.y * hbFocal);
  vec3 P = eye + rd * t;
  float stuff = hbStuff(P, N, px);
  if (uVar > 0.5) return screenOf(hbSheet(eye, rd, t, P, N, px, stuff));
  return screenOf(hbHall(p, eye, rd, t, P, N, stuff));
}
