// name: Light doorway
// a: Door ajar
// b: Light well
// what: A dim bare room with a tall door standing ajar: the next room is never seen, only its coloured light, upright in the gap and lying in soft fans over the floorboards; or the foot of a high plain shaft with a small dark doorway, where light from an opening out of sight grades down the walls to dusk.
// follows: Drone, pads, texture and phrase are each a lamp in the next room with a fan of its own on the floor, or each a wall of the shaft; a hit lays down one more fan and lights the door frame, or runs down a corner; a cue lets a second veil of light in; the low band swells the dusk; the loop turns the colours a little; keys light the knob or the doorway.
const float ldHw = 0.46, ldHi = 2.24;   // the doorway: half its width, and its height
const vec2 ldH = vec2(-ldHw, 0.0);      // the hinge of the leaf, on the floor plan
vec3 ldInk[5];    // the five kinds' colours as light, as strong as their sounds
vec3 ldRay[5];    // the same as they come through the door
vec3 ldDusk[2];   // the light that is there with nothing sounding: low and high
vec3 ldHome, ldMean;   // the light of the next room itself, and what all its lights come to
vec2 ldE, ldU, ldN; // the leaf: its free edge, the way along it, the way its face looks
float ldSoft;
vec3 ldWave;
float ldCross(vec2 a, vec2 b) { return a.x * b.y - a.y * b.x; }
float ldRise(float w, float x) { return smoothstep(-w, w, x); }
float ldFade(float q) { return 1.0 / (1.0 + q * (1.0 + q * (0.5 + 0.2 * q))); } // like exp(-q), for q of 0 and over
float ldMax(vec3 c) { return max(c.r, max(c.g, c.b)); }
vec3 ldRich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }

vec3 ldInkOf(vec3 c, float lv, float ca, float sa) {
  c = ldRich(c, 1.6); c *= c;
  c = c * ca + vec3(c.b - c.g, c.r - c.b, c.g - c.r) * sa + dot(c, vec3(0.3333)) * (1.0 - ca);
  return max(c, 0.0) * lv * (0.4 + 0.6 * lv) * (0.65 + 0.8 * uEnergy);
}
void ldLights() {
  ldWave = sin(uTime * vec3(0.031, 0.048, 0.065) + vec3(0.0, 2.0, 4.0));
  // the colours turn a little, with the loop and over minutes
  float an = TAU * (0.03 * sin(TAU * uLoop) + 0.025 * sin(uTime * 0.017)), ca = cos(an), sa = sin(an) * 0.57735;
  ldInk[0] = ldInkOf(uKind[0], uDrone, ca, sa); ldInk[1] = ldInkOf(uKind[1], uPad, ca, sa); ldInk[2] = ldInkOf(uKind[2], uTexture, ca, sa);
  ldInk[3] = ldInkOf(uKind[3], uPhrase, ca, sa); ldInk[4] = ldInkOf(uKind[4], uHits, ca, sa);
  float d = 0.5 + 0.5 * sin(uTime * 0.019 + 0.6);
  ldDusk[0] = mix(vec3(0.66, 0.15, 0.10), vec3(0.58, 0.12, 0.22), d);
  ldDusk[1] = mix(vec3(0.17, 0.08, 0.42), vec3(0.08, 0.12, 0.42), d);
}

// Door ajar.
void ldPlace() {
  ldHome = mix(ldDusk[0], ldDusk[1], 0.45) * (0.34 + 0.15 * uLow + 0.2 * uMic) + vec3(0.5, 0.21, 0.09) * uCue * 0.7;
  ldMean = (ldInk[0] + ldInk[1] + ldInk[2] + ldInk[3]) * 0.3 + ldInk[4] * 0.15 + ldHome * 0.5;
  // the next room's walls blend its lamps a little before they come through
  float mm = ldMax(ldMean) + 1e-4;
  for (int i = 0; i < 5; i++) ldRay[i] = mix(ldInk[i], ldMean * (ldMax(ldInk[i]) / mm), 0.22);
  float a = 0.66 + 0.05 * ldWave.z;
  ldU = vec2(cos(a), -sin(a)); ldN = vec2(ldU.y, -ldU.x); ldE = ldH + 0.9 * ldU;
  ldSoft = mix(0.3, 0.05, uTone) * (0.7 + 0.6 * uSpace);
}
// How much of a light at L reaches P past the leaf of the door; r is the light's radius.
float ldPast(vec3 P, vec3 L, float r) {
  float a = ldCross(ldU, P.xz - ldH), b = ldCross(ldU, L.xz - ldH), s = a / (abs(a - b) < 1e-5 ? 1e-5 : a - b);
  vec2 X = mix(P.xz, L.xz, s) - ldE;
  return a * b >= 0.0 || X.y + ldE.y > 0.0 ? 1.0 : ldRise(r * s + 0.002, dot(X, ldU));
}
void ldVeil(inout vec4 c, vec3 ink, vec2 d) {
  d *= vec2(0.55, 2.1);
  float g = 0.5 + 1.8 * ldFade(dot(d, d));
  c += vec4(ink * 2.2, ldMax(ink) * 1.9) * g;
}
// What is seen in the gap: no wall, no depth, only colour, each sound a veil at its own height. q is across (-1 to 1) and up (0 to 1).
vec3 ldGlow(vec2 q) {
  vec4 c4 = vec4(mix(ldDusk[0], ldDusk[1], smoothstep(-0.1, 0.95, q.y)), 1.0) * 0.6;
  vec2 m = vec2(0.2, 0.06);
  ldVeil(c4, ldInk[0], q - vec2(0.6, 0.74) - m * ldWave.x);
  ldVeil(c4, ldInk[1], q - vec2(0.1, 1.0) - m * ldWave.y);
  ldVeil(c4, ldInk[2], q - vec2(0.8, 0.06) - m * ldWave.z);
  ldVeil(c4, ldInk[3], q - vec2(0.2, 0.42) - m * ldWave.x);
  ldVeil(c4, ldInk[4], q - vec2(0.9, 0.22) - m * ldWave.y);
  vec3 c = c4.rgb; float w = c4.a;
  // the second veil, risen by a cue
  float v = (q.y - 1.2 * (1.0 - uCue)) * 2.2, g = uCue * ldFade(v * v) * 2.0;
  c += vec3(1.2, 0.6, 0.27) * g; w += g;
  return ldRich(c / w, 1.15) * (0.72 + 0.6 * (1.0 - ldFade((w - 0.6) * 0.6)) + 0.2 * uMic + 0.1 * uLow);
}
// One lamp of the next room: what falls straight on the floor past the doorway and the leaf, and what the floor throws back
// up from the place where it lies (foot). a is P's side of the leaf.
vec3 ldLamp(vec3 P, vec3 N, float onFloor, float a, vec3 col, vec3 L, vec2 foot, float back) {
  vec3 d = L - P;
  float s = -P.z / max(d.z, 0.5), iw = 0.5 / (ldSoft * s + 0.0015), x = P.x + d.x * s, r = inversesqrt(dot(d, d));
  float b = ldCross(ldU, L.xz - ldH), h = a / (abs(a - b) < 1e-5 ? 1e-5 : a - b);
  vec2 X = P.xz + d.xz * h;
  float past = a * b >= 0.0 || X.y > 0.0 ? 1.0 : sat(0.5 + dot(X - ldE, ldU) * 0.5 / (ldSoft * h + 0.002));
  float m = sat(0.5 + (ldHw - x) * iw) * sat((x + ldHw) * iw) * past;
  m *= onFloor * m * (3.0 - 2.0 * m) * L.y * r * r * r * 25.0;
  vec3 g = vec3(foot.x, 0.0, foot.y) - P; float g2 = dot(g, g) + 1e-5, gi = inversesqrt(g2);
  return col * (m + sat(dot(N, g) * gi + 0.1) * sat(0.15 - g.y * gi) / (g2 + 0.4) * back);
}
// The light arriving at a place in the room.
vec3 ldAt(vec3 P, vec3 N, float onFloor) {
  float a = ldCross(ldU, P.xz - ldH), back = 0.42 * (0.7 + 0.6 * uSpace);
  vec3 w = ldWave;
  vec3 c = ldLamp(P, N, onFloor, a, ldRay[0], vec3(-2.3 + 0.2 * w.x, 1.75, 2.1 + 0.12 * w.y), vec2(1.170, -0.981), back);
  c += ldLamp(P, N, onFloor, a, ldRay[1], vec3(-4.3 + 0.2 * w.y, 1.3, 1.7 + 0.12 * w.z), vec2(2.727, -1.365), back);
  c += ldLamp(P, N, onFloor, a, ldRay[2], vec3(-0.75 + 0.2 * w.z, 1.9, 2.5 + 0.12 * w.x), vec2(0.618, -0.901), back);
  c += ldLamp(P, N, onFloor, a, ldRay[3], vec3(-3.2 + 0.2 * w.x, 1.6, 2.0 + 0.12 * w.y), vec2(1.806, -1.185), back);
  c += ldLamp(P, N, onFloor, a, ldRay[4] * 1.5, vec3(-1.5 + 0.2 * w.y, 0.9, 2.0 + 0.12 * w.z), vec2(0.989, -1.028), back * 0.57);
  c += ldLamp(P, N, onFloor, a, ldHome, vec3(-1.9 + 0.2 * w.z, 1.45, 2.2 + 0.12 * w.x), vec2(0.961, -0.915), back);
  // the gap itself as one tall soft light
  vec3 G = vec3(0.3, 1.0, 0.02), g = G - P; float g2 = dot(g, g) + 1e-5, gi = inversesqrt(g2);
  return c + ldMean * (sat(dot(N, g) * gi) * sat(g.z * gi + 0.05) / (g2 + 0.35) * (0.15 + 0.85 * ldPast(P, G, 0.6)) * 0.9);
}
// Where a ray ends: how far, and what it meets (1 the end wall, 2 the left wall, 3 the floor, 4 the ceiling, 5 the leaf, 6 its edge, 7 the knob, 8 the gap, 9 the head of the doorway).
vec2 ldMeet(vec3 ro, vec3 rd) {
  vec2 r = rd.z > 1e-4 ? vec2(-ro.z / rd.z, 1.0) : vec2(1e4, 0.0);
  float s = rd.x < -1e-4 ? (-2.7 - ro.x) / rd.x : 1e4;
  if (s < r.x) r = vec2(s, 2.0);
  s = rd.y < -1e-4 ? -ro.y / rd.y : 1e4;
  if (s < r.x) r = vec2(s, 3.0);
  s = rd.y > 1e-4 ? (2.95 - ro.y) / rd.y : 1e4;
  if (s < r.x) r = vec2(s, 4.0);
  vec2 q = ro.xy + rd.xy * r.x;
  if (r.y == 1.0 && abs(q.x) < ldHw && q.y < ldHi) r.y = (ldHi - q.y) * rd.z < 0.2 * rd.y ? 9.0 : 8.0;
  // the leaf, a thin box
  vec2 o = vec2(dot(ro.xz - ldH, ldU) - 0.45, dot(ro.xz - ldH, ldN)), d = vec2(dot(rd.xz, ldU), dot(rd.xz, ldN));
  vec2 inv = (2.0 * step(0.0, d) - 1.0) / max(abs(d), 1e-5), hb = vec2(0.45, 0.021) * abs(inv);
  vec2 ta = -o * inv - hb, tb = -o * inv + hb;
  float t = max(ta.x, ta.y), y = ro.y + rd.y * t;
  if (t < min(tb.x, tb.y) && t > 0.0 && t < r.x && y > 0.008 && y < ldHi + 0.006) r = vec2(t, ta.x > ta.y ? 6.0 : 5.0);
  vec2 kn = ldE - ldU * 0.075 + ldN * 0.06 * sign(o.y);
  vec3 oc = vec3(kn.x, 1.0, kn.y) - ro; float b = dot(oc, rd), h = b * b - dot(oc, oc) + 0.0011;
  t = b - sqrt(max(h, 0.0));
  return h > 0.0 && t < r.x ? vec2(t, 7.0) : r;
}
// What is met along a ray. gl is the gap's colour as it is wanted there: on the head of the doorway, along the leaf's edge, or upside down on the floor.
vec3 ldRoom(vec3 ro, vec3 rd, float px, float t, int id, vec3 gl) {
  vec3 P = ro + rd * t, amb = vec3(0.0075, 0.008, 0.0145) + ldMean * 0.010;
  float face = sign(dot(rd.xz, ldN));
  // the leaf
  if (id > 4) {
    float u = dot(P.xz - ldH, ldU), alb = 0.62;
    vec3 N = id == 6 ? vec3(ldU.x, 0.0, ldU.y) : vec3(-ldN.x * face, 0.0, -ldN.y * face);
    vec3 L = amb * 1.3;
    vec2 kn = ldE - ldU * 0.075 - ldN * 0.06 * face;
    if (id == 7) {
      N = (P - vec3(kn.x, 1.0, kn.y)) * 30.0;
      float e = sat(dot(N.xz, ldU)); e *= e; e *= e;
      L += gl * e * 0.7 + uKind[3] * uKeys * 0.15 * sat(dot(N, -rd));
      alb = 0.45;
    } else if (id == 5) {
      // two sunk panels, and the soft dark under the knob
      bool low = P.y < 0.98;
      vec2 q = vec2(abs(u - 0.45) - 0.30, low ? abs(P.y - 0.52) - 0.33 : abs(P.y - 1.58) - 0.5);
      float d = max(q.x, q.y), w = px * t / max(abs(dot(rd.xz, ldN)), 0.1);
      float lip = ldRise(w + 0.005, d + 0.02) - ldRise(w + 0.005, d - 0.004);
      float dir = q.x > q.y ? sign(u - 0.45) : 0.8 * sign(P.y - (low ? 0.52 : 1.58));
      alb *= (1.0 - 0.14 * ldRise(w, -d - 0.016)) * (1.0 + 0.5 * dir * lip);
      vec2 k2 = vec2(u - 0.815, P.y - 0.985);
      alb *= 1.0 - 0.4 * ldFade(dot(k2, k2) * 900.0);
      L += gl * 0.3 * ldFade((0.9 - u) * 110.0);
    } else L += gl * 0.15 * (1.0 + uKeys);
    vec3 bk = vec3(1.2, 0.0, -1.3) - P; float bk2 = dot(bk, bk);
    L += ldMean * sat(0.3 + 0.7 * dot(N, bk) * inversesqrt(bk2)) / (bk2 + 0.8) * 0.3;
    return id < 9 ? alb * L : gl * (0.2 + 0.4 * smoothstep(0.0, 0.2, (ldHi - P.y) / max(rd.y, 1e-3) * rd.z));
  }
  vec3 N = id == 1 ? vec3(0.0, 0.0, -1.0) : id == 2 ? vec3(1.0, 0.0, 0.0) : id == 3 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, -1.0, 0.0);
  vec3 L = amb + ldAt(P, N, id == 3 ? 1.0 : 0.0), alb = vec3(0.62, 0.6, 0.59);
  // boards running along the wall, each its own tone
  const float bw = 0.165;
  float fb = P.z / bw, ib = floor(fb), h = hash21(vec2(ib, 7.0)), xe = P.x / 2.3 + h * 7.0, h2 = hash21(vec2(floor(xe), ib + 60.0));
  float gr = noise(id == 3 ? vec2(P.x * 4.0 + h2 * 50.0, P.z * 90.0 + h * 31.0) : (id == 2 ? P.zy : P.xy) * vec2(1.3, 0.8) + 3.0);
  // corners gather the dark
  if (id != 2) L *= 1.0 - 0.45 * ldFade((P.x + 2.7) * 2.2);
  if (id != 1) L *= 1.0 - 0.4 * ldFade(-P.z * 2.2) * smoothstep(0.3, 1.2, abs(P.x));
  if (id != 4) L *= 1.0 - 0.3 * ldFade((2.95 - P.y) * 2.5);
  if (id != 3) {
    // plaster, very slightly uneven
    L = ldRich(L, 1.5);
    alb *= 0.96 + 0.08 * gr;
    float dc = id == 1 ? max(abs(P.x) - ldHw, P.y - ldHi) : 9.0, pw = px * t / max(abs(dot(rd, N)), 0.1);
    // the moulding round the doorway
    float side = abs(P.x) - ldHw > P.y - ldHi ? sign(P.x) : 1.0, iw = 0.5 / (pw + 0.003);
    vec4 st = sat(0.5 + (dc - vec4(0.018, 0.03, 0.09, 0.102)) * iw), sk = sat(0.5 + (P.y - vec4(0.15, 0.168, 0.178, 0.19)) * iw);
    float on = sat(0.5 + (0.12 - dc) * iw);
    alb *= mix(1.0 - 0.4 * ldFade(max(dc - 0.12, 0.0) * 26.0), 1.14, on) * (1.0 - on * (0.4 * (st.x - st.y) + 0.3 * (st.z - st.w) * side));
    L += (amb + ldInk[4] * 0.4) * on * ldFade(max(dc, 0.0) * 120.0);
    // the skirting
    alb *= (1.0 + (1.0 - on) * (1.0 - sk.w) * (0.12 - 0.5 * (sk.x - sk.y) + 0.35 * (sk.z - sk.w))) * (1.0 - 0.4 * ldFade(P.y * 30.0));
    return alb * L;
  }
  float ff = fract(fb) - 0.5, fe = (fract(xe) - 0.5) * 2.3, pw = px * t / max(-rd.y, 0.05);
  float gap = sat(ldRise(pw * 0.7, abs(ff) * bw - bw * 0.5 + 0.004) + 0.5 * ldRise(px * t, abs(fe) - 1.148)) * 0.8 * min(1.0, 0.012 / max(pw, 0.001));
  gr = mix(0.5, gr, 1.0 - smoothstep(0.02, 0.1, pw));
  vec3 col = mix(vec3(0.46, 0.375, 0.31), vec3(0.58, 0.49, 0.42), h2) * (0.8 + 0.4 * gr) * L;
  // a worn sheen: the gap stands on the floor upside down
  vec3 rr = vec3(rd.x, abs(rd.y), max(rd.z, 0.01)), far = P - rr * (P.z / rr.z);
  float s = (far.y - P.y) / max(rr.y, 0.01), w = 0.012 + 0.10 * s * (0.7 + 0.6 * h2);
  float m = ldRise(w, ldHw - far.x) * smoothstep(0.0, 2.0 * w, far.x + ldHw) * ldRise(w * 2.2, ldHi - far.y) * ldPast(P, far + rr * 0.02, w);
  float f1 = 1.0 - rr.y, f2 = f1 * f1;
  col += gl * m * (0.03 + 0.6 * f2 * f2 * f1) * (0.6 + 0.4 * h2) * (0.7 + 0.6 * gr);
  return col * (1.0 - gap);
}
vec3 ldDoor(vec2 p) {
  ldPlace();
  float wide = uRes.x / uRes.y, px = 1.0 / uRes.y;
  vec3 ro = vec3(2.15 + 0.04 * ldWave.x, 1.45, -4.6);
  vec3 fw = normalize(vec3(-2.15, 0.0, 4.6)), rt = vec3(fw.z, 0.0, -fw.x);
  vec2 q = p + vec2(0.23 * smoothstep(0.4, 1.5, wide) - 0.02, -0.21);
  // two rays to a pixel say how much of it is the gap; the room is drawn once, along one that meets it
  vec3 s1 = normalize(fw * 1.26 + rt * (q.x + 0.25 * px) + vec3(0.0, q.y - 0.25 * px, 0.0)), s2 = normalize(fw * 1.26 + rt * (q.x - 0.25 * px) + vec3(0.0, q.y + 0.25 * px, 0.0));
  vec2 h1 = ldMeet(ro, s1), h2 = ldMeet(ro, s2);
  bool g1 = h1.y == 8.0, g2 = h2.y == 8.0;
  float open = (g1 ? 0.5 : 0.0) + (g2 ? 0.5 : 0.0);
  vec3 rg = g1 ? s1 : s2, rd = g1 ? s2 : s1;
  vec2 hit = g1 ? h2 : h1;
  // the colour of the gap: as it is seen, or on the floor where its upside-down lies, or at the same height
  vec3 at = open > 0.0 ? ro - rg * (ro.z / rg.z) : ro + rd * hit.x;
  if (open == 0.0 && hit.y == 3.0) at.y = -at.z * abs(rd.y) / max(rd.z, 0.01);
  vec3 gap = ldGlow(vec2(open > 0.0 ? at.x / ldHw : 0.0, min(at.y / ldHi, 1.0)));
  vec3 c = open == 1.0 ? gap : ldRoom(ro, rd, px / 1.26, hit.x, int(hit.y), gap);
  return mix(c, gap, open * open) * 1.5;
}

// Light well: a plain square shaft with a slot of light along each side of its unseen lid.
const float lwR = 2.0, lwTop = 6.6, lwSlot = 0.55;
vec3 lwQ[4];  // the light of each slot: behind us, left, right, far
vec3 lwAll;
vec3 lwSlotOf(int k, vec3 ink) { return mix(ldDusk[1], ldDusk[0], 0.36 + 0.36 * sin(uTime * 0.019 - float(k) * 1.9 + 2.8)) * (1.0 + 0.3 * uLow + 0.3 * uMic) + ink * 3.3; }
void lwLights() {
  lwQ[0] = lwSlotOf(0, ldInk[0]); lwQ[1] = lwSlotOf(1, ldInk[1]); lwQ[2] = lwSlotOf(2, ldInk[2]); lwQ[3] = lwSlotOf(3, ldInk[3]);
  lwAll = (lwQ[0] + lwQ[1] + lwQ[2] + lwQ[3]) * 0.25;
}
vec4 lwAtan(vec4 u) { vec4 x = abs(u) * 0.63662; return 1.5708 * sign(u) * x * (0.596 + x) / (1.0 + x * (1.192 + x)); }
// The light on a wall at a place u along it (-2 to 2) and y up: from its own slot, the one opposite, and those at its two ends.
vec3 lwAt(float u, float y, vec3 own, vec3 opp, vec3 lo, vec3 hi) {
  float h = max(lwTop - y, 0.05); const float W = 2.0 * lwR;
  vec4 dx = vec4(0.04, lwSlot, W - lwSlot, W), iv = inversesqrt(dx * dx + h * h);
  vec4 a = h * iv * (lwAtan((lwR - u) * iv) + lwAtan((lwR + u) * iv));
  vec4 z = vec4(-lwR, lwSlot - lwR, lwR - lwSlot, lwR) - u;
  vec4 b = h * (iv.y * lwAtan(z * iv.y) - iv.z * lwAtan(z * iv.z));
  vec3 c = mix(own, vec3(ldMax(own)), 0.4) * (a.x - a.y) * 0.5 + opp * (a.z - a.w) * 2.9 + (lo * (b.y - b.x) + hi * (b.w - b.z)) * 0.75;
  // and what the walls hand down to one another
  vec3 rich = lwAll * lwAll / (ldMax(lwAll) + 1e-3);
  c = c * 0.36 + mix(lwAll, rich, 0.6) * ((0.07 + 0.08 * uSpace) * ldFade(h * 0.5) + 0.005);
  return ldRich(c, 1.5) * mix(0.62 - 0.2 * uTone, 1.5, 1.0 - smoothstep(0.8, 6.0, h));
}
vec3 lwWall(vec3 P, vec3 N, float px) {
  bool side = abs(N.x) > 0.5;
  float u = side ? P.z : P.x;
  vec2 w = vec2(u + (side ? 9.0 * N.x : 0.0), P.y);
  float alb = 0.72 * (0.93 + 0.09 * noise(w * vec2(0.9, 0.5)) + 0.04 * noise(w * vec2(4.5, 1.6) + 5.0));
  // the pours of the wall, one above another
  float j = abs(abs(fract(w.y / 1.1 + 0.5) - 0.5) * 1.1 - 0.544);
  alb *= 1.0 - 0.14 * (1.0 - smoothstep(0.0, 0.005 + px, j)) * min(1.0, 0.012 / px);
  bool lf = N.x > 0.0, fr = N.z < 0.0;
  vec3 own = side ? (lf ? lwQ[1] : lwQ[2]) : (fr ? lwQ[3] : lwQ[0]), opp = side ? (lf ? lwQ[2] : lwQ[1]) : (fr ? lwQ[0] : lwQ[3]);
  vec3 L = lwAt(u, P.y, own, opp, side ? lwQ[0] : lwQ[1], side ? lwQ[3] : lwQ[2]);
  L *= (1.0 - 0.35 * ldFade((lwR - abs(u)) * 2.0)) * (1.0 - 0.35 * ldFade(P.y * 2.5));
  // a slow unevenness in the light, as if a cloud went over
  L *= 1.0 + 0.13 * sin(0.9 * (P.x + P.z) + 0.5 * P.y + 0.16 * uTime);
  // a hit: a pulse of light going down the corner
  float dn = (P.y - mix(0.8, 3.9, uHits)) / 1.1;
  L += ldInk[4] * 0.4 * ldFade((4.0 + P.x - P.z) * 1.5) * ldFade(dn * dn);
  if (!fr) return alb * L;
  // a cue: a second veil, slanting down the far wall
  float d = P.x - 0.4 - 0.3 * P.y;
  L += vec3(0.60, 0.29, 0.13) * uCue * smoothstep(-2.0, -0.4, d) * (1.0 - smoothstep(0.2, 1.5, d)) * smoothstep(-0.5, 5.0, P.y) * 0.55;
  // a small plain way in, for size
  float q = max(abs(P.x + 0.62) - 0.2, P.y - 0.98);
  vec3 dark = lwAll * 0.004 + (lwQ[2] + lwAll) * 0.016 * smoothstep(-0.07, -0.066, P.x + 0.42) + vec3(0.5, 0.25, 0.1) * (uMic + 0.4 * uKeys) * 0.15;
  return mix(alb * L * (1.0 - 0.15 * ldFade(max(q, 0.0) * 30.0)), dark, 1.0 - smoothstep(-px, px, q));
}
vec3 ldWell(vec2 p) {
  lwLights();
  float yaw = -0.30 + 0.015 * ldWave.x; const float tilt = 0.27;
  vec3 ro = vec3(1.1 + 0.04 * ldWave.y, 0.8, -1.75);
  vec3 fw = vec3(sin(yaw) * cos(tilt), sin(tilt), cos(yaw) * cos(tilt)), rt = vec3(cos(yaw), 0.0, -sin(yaw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 0.66 + rt * p.x + up * p.y);
  vec3 sg = 2.0 * step(0.0, rd) - 1.0, m = sg / max(abs(rd), 1e-4);
  vec2 tw = (sg.xz * lwR - ro.xz) * m.xz;
  float tf = rd.y < 0.0 ? -ro.y * m.y : 1e4, t = min(tf, min(tw.x, tw.y)), fr = 1.0;
  vec3 P = ro + rd * t, add = vec3(0.0);
  if (t == tf) {
    // the floor, dark and polished: its own dim light, and the walls again in it
    vec2 f2 = smoothstep(-lwR, lwR, P.xz);
    add = (mix(lwQ[2], lwQ[1], f2.x) + mix(lwQ[3], lwQ[0], f2.y)) * 0.0045 * (1.0 - 0.6 * ldFade(2.5 * (lwR - max(abs(P.x), abs(P.z)))));
    float f = 1.0 + rd.y; f *= f;
    fr = 0.16 + 0.75 * f * f;
    rd.y = -rd.y;
    tw = (sg.xz * lwR - P.xz) * m.xz;
    t += min(tw.x, tw.y); P += rd * min(tw.x, tw.y);
  }
  vec3 N = tw.x < tw.y ? vec3(-sg.x, 0.0, 0.0) : vec3(0.0, 0.0, -sg.z);
  return 2.4 * (add + fr * lwWall(P, N, 1.5 * t / uRes.y));
}

vec3 render(vec2 p) {
  ldLights();
  return screenOf(uVar > 0.5 ? ldWell(p) : ldDoor(p));
}
