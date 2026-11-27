// name: Light doorway
// a: Door ajar
// b: Light well
// what: A dim bare room with a tall door standing ajar: the next room is never seen, only its coloured light, upright in the gap and lying in soft fans over the floorboards; or the foot of a high plain shaft with a small dark doorway, where light from an opening out of sight grades down the walls to dusk.
// follows: Drone, pads, texture and phrase are each a lamp in the next room with a fan of its own on the floor, or each a wall of the shaft; a hit lays down one more fan and lights the door frame, or runs down a corner; a cue lets a second veil of light in; the low band swells the dusk; the loop turns the colours a little; keys light the knob or the doorway.
// own: 0 the opening: 1 wide, -1 a tall slit (b: the shaft); 1 1 a row of openings, -1 a round head; 2 1 the leaf gone, -1 all but shut (b: more or less light above); 3 the floor: 1 still water, -1 rippled sand; 4 1 no walls but a sky over a plain (b: low walls under a sky), -1 stone blocks; 5 1 seen square on (b: straight up), -1 from high up (b: level, square on); 6 1 a painted room by day, -1 light hangs in the air; 7 the light crossed by 1 panes, -1 slats; any of them: the resting light in the sounds' colours
float ldHw = 0.46, ldHi = 2.24;   // the doorway: half its width, and its height
vec2 ldH;      // the hinge of the leaf, on the floor plan
vec3 ldInk[5];    // the five kinds' colours as light, as strong as their sounds
vec3 ldRay[5];    // the same as they come through the door
vec3 ldDusk[2];
vec3 ldHome, ldMean;
vec2 ldE, ldU, ldN; // the leaf: its free edge, the way along it, the way its face looks
float ldSoft, ldLong, ldRow, ldArch, ldWater, ldSand, ldAir, ldStone, ldDay, ldHaze, ldBar, ldPer;
bool ldForm;
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
  float an = TAU * (0.03 * sin(TAU * uLoop) + 0.025 * sin(uTime * 0.017)), ca = cos(an), sa = sin(an) * 0.57735;
  ldInk[0] = ldInkOf(uKind[0], uDrone, ca, sa); ldInk[1] = ldInkOf(uKind[1], uPad, ca, sa); ldInk[2] = ldInkOf(uKind[2], uTexture, ca, sa);
  ldInk[3] = ldInkOf(uKind[3], uPhrase, ca, sa); ldInk[4] = ldInkOf(uKind[4], uHits, ca, sa);
  float d = 0.5 + 0.5 * sin(uTime * 0.019 + 0.6);
  ldDusk[0] = mix(vec3(0.66, 0.15, 0.10), vec3(0.58, 0.12, 0.22), d);
  ldDusk[1] = mix(vec3(0.17, 0.08, 0.42), vec3(0.08, 0.12, 0.42), d);
  ldRow = max(uOwn[1], 0.0); ldArch = max(-uOwn[1], 0.0); ldWater = max(uOwn[3], 0.0); ldSand = max(-uOwn[3], 0.0);
  ldAir = max(uOwn[4], 0.0); ldStone = max(-uOwn[4], 0.0); ldDay = max(uOwn[6], 0.0); ldHaze = max(-uOwn[6], 0.0); ldBar = uOwn[7];
  ldForm = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[7] != 0.0;
  float dyed = sat(3.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
  if (dyed > 0.0) {
    vec3 k0 = ldRich(uKind[1], 1.25), k1 = ldRich(uKind[0], 1.25);
    ldDusk[0] = mix(ldDusk[0], k0 * k0 * 0.75, dyed);
    ldDusk[1] = mix(ldDusk[1], k1 * k1 * 0.7, dyed);
  }
}

float ldWrap(float x) { return ldRow > 0.0 ? x - ldPer * floor(x / ldPer + 0.5) : x; }
float ldGapD(vec2 q) {
  q.x = abs(ldWrap(q.x));
  float R = ldArch * ldHw;
  vec2 v = q - vec2(ldHw - R, ldHi - R);
  return ldArch > 0.0 ? length(max(v, 0.0)) - R + min(max(v.x, v.y), 0.0) : max(q.x - ldHw, q.y - ldHi);
}
float ldBars(vec2 q, float hw, float hi, float s) {
  if (uOwn[7] == 0.0) return 1.0;
  vec2 cell = ldBar > 0.0 ? vec2(2.0 * hw / max(floor(hw / 0.22 + 0.5), 2.0), hi / 4.0) : vec2(1e3, 0.115);
  vec2 w = ldBar > 0.0 ? vec2(0.016) : vec2(0.0, 0.034);
  vec2 d = abs(fract((q + vec2(hw, 0.0)) / cell + 0.5) - 0.5) * cell;
  vec2 k = (1.0 - smoothstep(w - s, w + s, d)) * w / (w + 0.5 * max(s - w, 0.0) + 1e-5);
  return 1.0 - abs(ldBar) * max(k.x, k.y);
}
vec3 ldSky(vec3 rd) {
  float u = sat(rd.y * 1.6);
  vec3 c = mix(uKind[1] * uKind[1], uKind[0] * uKind[0] * 0.5, sqrt(u)) * mix(0.14, 0.9, ldDay);
  vec2 g = rd.xy / (abs(rd.z) + 0.6) * 46.0, id = floor(g);
  float h = hash21(id);
  return c + (1.0 - ldDay) * 0.35 * step(0.955, h) * u * (1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5))) * (0.7 + 0.3 * sin(uTime * 0.5 + h * 900.0));
}
float ldBlocks(vec2 q, float px) {
  float row = floor(q.y / 0.36), h = hash11(row + 2.0);
  vec2 g = vec2(q.x / 0.74 + h * 7.0, q.y / 0.36), id = vec2(floor(g.x), row), f = fract(g) - 0.5;
  vec2 e = (0.5 - abs(f)) * vec2(0.74, 0.36);
  float d = min(e.x, e.y) + 0.016 * (noise(q * 14.0) - 0.5), own = hash21(id + 9.0);
  float face = (0.62 + 0.5 * own) * (0.72 + 0.35 * noise(q * 9.0) + 0.25 * noise(q * 31.0));
  face *= 1.0 + 0.28 * ((1.0 - smoothstep(0.0, 0.05, (0.5 - f.y) * 0.36)) - (1.0 - smoothstep(0.0, 0.06, (0.5 + f.y) * 0.36)));
  return face * mix(0.4, 1.0, smoothstep(0.0, 0.014 + px, d - 0.008));
}
float ldDunes(vec2 q, float px) {
  float r = sin(q.y * 26.0 + 5.0 * noise(q * 0.9) + 2.4 * noise(q * vec2(1.3, 3.1) + 7.0));
  return 0.86 + 0.3 * r * (1.0 - smoothstep(0.02, 0.12, px)) * (0.4 + 0.8 * noise(q * 0.7 + 3.0)) + 0.16 * noise(q * 60.0) * (1.0 - smoothstep(0.005, 0.03, px));
}
vec2 ldRipple(vec2 q) { return vec2(noise(q * 3.0 + vec2(0.0, 0.13 * uTime)), noise(q * 3.0 + vec2(17.0, -0.11 * uTime))) - 0.5; }

void ldPlace() {
  ldHome = mix(ldDusk[0], ldDusk[1], 0.45) * (0.34 + 0.15 * uLow + 0.2 * uMic) + vec3(0.5, 0.21, 0.09) * uCue * 0.7;
  if (ldDay > 0.0) ldHome *= 1.0 + 3.0 * ldDay;
  ldMean = (ldInk[0] + ldInk[1] + ldInk[2] + ldInk[3]) * 0.3 + ldInk[4] * 0.15 + ldHome * 0.5;
  float mm = ldMax(ldMean) + 1e-4;
  for (int i = 0; i < 5; i++) ldRay[i] = mix(ldInk[i], ldMean * (ldMax(ldInk[i]) / mm), 0.22);
  float a = 0.66 + 0.05 * ldWave.z;
  ldLong = 0.9;
  if (uOwn[0] > 0.0) { ldHw *= 1.0 + 1.7 * uOwn[0]; ldHi *= 1.0 + 0.04 * uOwn[0] - 0.38 * uOwn[0] * ldArch; }
  if (uOwn[0] < 0.0) { ldHw *= 1.0 + 0.72 * uOwn[0]; ldHi *= 1.0 - 0.18 * uOwn[0]; ldLong *= 1.0 + 0.72 * uOwn[0]; }
  ldPer = (2.0 * ldHw + 0.55) / max(ldRow, 1e-3);
  if (uOwn[2] > 0.0) { a = mix(a, 2.7, uOwn[2]); ldLong *= 1.0 - smoothstep(0.5, 1.0, uOwn[2]); }
  if (uOwn[2] < 0.0) a = mix(a, 0.07 + 0.012 * ldWave.z, -uOwn[2]);
  ldLong *= 1.0 - ldRow;
  ldH = vec2(-ldHw, 0.0);
  ldU = vec2(cos(a), -sin(a)); ldN = vec2(ldU.y, -ldU.x); ldE = ldH + ldLong * ldU;
  ldSoft = mix(0.3, 0.05, uTone) * (0.7 + 0.6 * uSpace);
  if (uOwn[7] != 0.0) ldSoft *= 1.0 - 0.8 * abs(uOwn[7]);
}
// How much of a light at L reaches P past the leaf; r is its radius.
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
  float hwy = ldHw, bars = 1.0;
  if (ldForm) {
    float y = P.y + d.y * s, R = ldArch * ldHw, e = max(y - ldHi + R, 0.0);
    x = ldWrap(x);
    hwy = e > 0.0 ? ldHw - R + sqrt(max(R * R - e * e, 0.0)) : ldHw;
    bars = ldBars(vec2(x, y), ldHw, ldHi, ldSoft * s * 0.5 + 0.004);
  }
  float m = sat(0.5 + (hwy - x) * iw) * sat((x + hwy) * iw) * past * bars;
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
  vec3 G = vec3(0.3, 1.0, 0.02), g = G - P; float g2 = dot(g, g) + 1e-5, gi = inversesqrt(g2);
  return c + ldMean * (sat(dot(N, g) * gi) * sat(g.z * gi + 0.05) / (g2 + 0.35) * (0.15 + 0.85 * ldPast(P, G, 0.6)) * 0.9);
}
// Where a ray ends: how far, and what it meets (1 the end wall, 2 the left wall, 3 the floor, 4 the ceiling, 5 the leaf, 6 its edge, 7 the knob, 8 the gap, 9 the head of the doorway).
vec2 ldMeet(vec3 ro, vec3 rd) {
  vec2 r = rd.z > 1e-4 ? vec2(-ro.z / rd.z, 1.0) : vec2(1e4, 0.0);
  float s = rd.x < -1e-4 ? (-2.7 - 12.0 * max(ldRow, ldAir) - 0.6 * max(uOwn[0], 0.0) - ro.x) / rd.x : 1e4;
  if (s < r.x) r = vec2(s, 2.0);
  s = rd.y < -1e-4 ? -ro.y / rd.y : 1e4;
  if (s < r.x) r = vec2(s, 3.0);
  s = rd.y > 1e-4 ? (2.95 - ro.y) / rd.y : 1e4;
  if (s < r.x) r = vec2(s, 4.0);
  vec2 q = ro.xy + rd.xy * r.x;
  if (r.y == 1.0 && (ldForm ? ldGapD(q) < 0.0 : abs(q.x) < ldHw && q.y < ldHi)) r.y = ldArch > 0.0 ? 8.0 : (ldHi - q.y) * rd.z < 0.2 * rd.y ? 9.0 : 8.0;
  // the leaf, a thin box
  vec2 o = vec2(dot(ro.xz - ldH, ldU) - 0.5 * ldLong, dot(ro.xz - ldH, ldN)), d = vec2(dot(rd.xz, ldU), dot(rd.xz, ldN));
  vec2 inv = (2.0 * step(0.0, d) - 1.0) / max(abs(d), 1e-5), hb = vec2(0.5 * ldLong, 0.021) * abs(inv);
  vec2 ta = -o * inv - hb, tb = -o * inv + hb;
  float t = max(ta.x, ta.y), y = ro.y + rd.y * t;
  if (t < min(tb.x, tb.y) && t > 0.0 && t < r.x && y > 0.008 * step(0.0, uOwn[2]) && y < ldHi + 0.006 && ldLong > 0.01) r = vec2(t, ta.x > ta.y ? 6.0 : 5.0);
  vec2 kn = ldE - ldU * 0.075 + ldN * 0.06 * sign(o.y);
  vec3 oc = vec3(kn.x, 1.0, kn.y) - ro; float b = dot(oc, rd), h = b * b - dot(oc, oc) + 0.0011 * sat(ldLong * 4.0 - 0.6);
  t = b - sqrt(max(h, 0.0));
  return h > 0.0 && t < r.x ? vec2(t, 7.0) : r;
}
// What is met along a ray. gl is the gap's colour as it is wanted there: on the head of the doorway, along the leaf's edge, or upside down on the floor.
vec3 ldRoom(vec3 ro, vec3 rd, float px, float t, int id, vec3 gl) {
  vec3 P = ro + rd * t, amb = vec3(0.0075, 0.008, 0.0145) + ldMean * 0.010;
  vec3 paint = vec3(1.0), day = vec3(0.0);
  if (ldDay > 0.0) {
    vec3 pk = id == 3 ? mix(uKind[0], uKind[2], ldSand) : uKind[1];
    paint = mix(vec3(1.0), pk * (0.35 + 0.95 * pk), ldDay);
    day = ldDay * vec3(1.0, 0.98, 0.95) * (id == 3 ? 0.62 : id == 4 ? 0.5 : 0.36 + 0.07 * P.y);
    amb += day * (id > 4 ? 0.9 : 1.0);
  }
  float face = sign(dot(rd.xz, ldN));
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
    if (ldDay > 0.0 && id < 9) alb *= mix(1.0, id == 7 ? 0.6 : 1.15, ldDay);
    return id < 9 ? alb * L * mix(vec3(1.0), 0.3 + uKind[2] * 0.8, ldDay * 0.8) : gl * (0.2 + 0.4 * smoothstep(0.0, 0.2, (ldHi - P.y) / max(rd.y, 1e-3) * rd.z));
  }
  vec3 N = id == 1 ? vec3(0.0, 0.0, -1.0) : id == 2 ? vec3(1.0, 0.0, 0.0) : id == 3 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, -1.0, 0.0);
  vec3 L = amb + ldAt(P, N, id == 3 ? 1.0 : 0.0), alb = vec3(0.62, 0.6, 0.59) * paint;
  const float bw = 0.165;
  float fb = P.z / bw, ib = floor(fb), h = hash21(vec2(ib, 7.0)), xe = P.x / 2.3 + h * 7.0, h2 = hash21(vec2(floor(xe), ib + 60.0));
  float gr = noise(id == 3 ? vec2(P.x * 4.0 + h2 * 50.0, P.z * 90.0 + h * 31.0) : (id == 2 ? P.zy : P.xy) * vec2(1.3, 0.8) + 3.0);
  vec3 plain = L;
  if (id != 2) L *= 1.0 - 0.45 * ldFade(max(P.x + 2.7 + 12.0 * max(ldRow, ldAir), 0.0) * 2.2);
  if (id != 1) L *= 1.0 - 0.4 * ldFade(-P.z * 2.2) * smoothstep(0.3, 1.2, abs(ldWrap(P.x)) - ldHw + 0.46);
  if (id != 4) L *= 1.0 - 0.3 * ldFade((2.95 - P.y) * 2.5);
  if (id != 3) {
    L = ldRich(L, 1.5);
    alb *= 0.96 + 0.08 * gr;
    if (ldStone > 0.0 && id != 4) alb *= mix(1.0, ldBlocks((id == 2 ? P.zy : P.xy) + 0.07, px * t), ldStone * smoothstep(0.09, 0.13, id == 1 ? ldGapD(P.xy) : 1.0));
    float dc = id == 1 ? ldGapD(P.xy) : 9.0, pw = px * t / max(abs(dot(rd, N)), 0.1);
    float wx = ldWrap(P.x), side = abs(wx) - ldHw > P.y - ldHi ? sign(wx) : 1.0, iw = 0.5 / (pw + 0.003);
    vec4 st = sat(0.5 + (dc - vec4(0.018, 0.03, 0.09, 0.102)) * iw), sk = sat(0.5 + (P.y - vec4(0.15, 0.168, 0.178, 0.19)) * iw);
    float on = sat(0.5 + (0.12 - dc) * iw);
    alb *= mix(1.0 - 0.4 * ldFade(max(dc - 0.12, 0.0) * 26.0), 1.14, on) * (1.0 - on * (0.4 * (st.x - st.y) + 0.3 * (st.z - st.w) * side));
    L += (amb + ldInk[4] * 0.4) * on * ldFade(max(dc, 0.0) * 120.0);
    float bare = max(ldAir, ldStone);
    alb *= (1.0 + (1.0 - bare) * (1.0 - on) * (1.0 - sk.w) * (0.12 - 0.5 * (sk.x - sk.y) + 0.35 * (sk.z - sk.w))) * (1.0 - 0.4 * ldFade(P.y * 30.0));
    if (ldAir > 0.0) {
      vec3 far = ldSky(rd);
      if (rd.y < 0.0) {
        float tf = -ro.y / rd.y;
        vec2 fq = ro.xz + rd.xz * tf;
        vec3 fk = mix(uKind[0], uKind[2], ldSand), g = vec3(0.6, 0.55, 0.48) * mix(vec3(1.0), fk * (0.35 + 0.95 * fk), ldDay) * (0.01 + ldMean * 0.05 + ldDay * 0.62) * mix(1.0, ldDunes(fq, px * tf / max(-rd.y, 0.02)), ldSand);
        g = mix(g, ldSky(vec3(rd.x, -rd.y, rd.z)) * 0.7, ldWater);
        far = mix(ldSky(vec3(rd.x, 0.0, rd.z)), g, exp(-0.03 * tf));
      }
      return mix(far, alb * L, (1.0 - ldAir) + ldAir * on);
    }
    return alb * L;
  }
  if (ldAir > 0.0) L = mix(L, plain, ldAir);
  float ff = fract(fb) - 0.5, fe = (fract(xe) - 0.5) * 2.3, pw = px * t / max(-rd.y, 0.05);
  float gap = sat(ldRise(pw * 0.7, abs(ff) * bw - bw * 0.5 + 0.004) + 0.5 * ldRise(px * t, abs(fe) - 1.148)) * 0.8 * min(1.0, 0.012 / max(pw, 0.001));
  gr = mix(0.5, gr, 1.0 - smoothstep(0.02, 0.1, pw));
  vec3 col = mix(vec3(0.46, 0.375, 0.31), vec3(0.58, 0.49, 0.42), h2) * (0.8 + 0.4 * gr) * L;
  col *= paint;
  if (ldSand > 0.0) {
    col = mix(col, vec3(0.6, 0.55, 0.48) * paint * L * ldDunes(P.xz, pw), ldSand);
    gap *= 1.0 - ldSand;
  }
  vec2 rp = vec2(0.0);
  if (ldWater > 0.0) {
    rp = ldRipple(P.xz * vec2(1.0, 2.4)) * (0.05 + 0.1 * uLow) * ldWater;
    col = mix(col, 0.22 * col, ldWater);
    gap *= 1.0 - ldWater;
    h2 = mix(h2, 0.5, ldWater); gr = mix(gr, 0.5, ldWater);
  }
  // a worn sheen: the gap stands on the floor upside down
  vec3 rr = vec3(rd.x + rp.x, abs(rd.y + rp.y * 0.6), max(rd.z, 0.01)), far = P - rr * (P.z / rr.z);
  float s = (far.y - P.y) / max(rr.y, 0.01), w = (0.012 + 0.10 * s * (0.7 + 0.6 * h2)) * (1.0 - 0.8 * ldWater);
  far.x = ldWrap(far.x);
  float m = ldRise(w, ldHw - far.x) * smoothstep(0.0, 2.0 * w, far.x + ldHw) * ldRise(w * 2.2, ldHi - far.y) * ldPast(P, far + rr * 0.02, w);
  float f1 = 1.0 - rr.y, f2 = f1 * f1;
  if (ldForm) m *= (1.0 - smoothstep(-w, w, ldGapD(far.xy))) * ldBars(far.xy, ldHw, ldHi, w);
  if (ldWater > 0.0) {
    vec3 wall = 0.55 * paint * (amb + ldRich(ldAt(vec3(far.xy, -0.02), vec3(0.0, 0.0, -1.0), 0.0), 1.5));
    wall = mix(wall, ldSky(rr), ldAir);
    col = mix(col, mix(wall, gl, m), ldWater * (0.12 + 0.75 * f2 * f1));
  }
  if (ldAir > 0.0) col = mix(col, ldSky(vec3(rd.x, 0.0, rd.z)), ldAir * (1.0 - exp(-0.03 * t)));
  col += gl * m * (1.0 - ldSand) * (0.03 + 0.6 * f2 * f2 * f1) * (0.6 + 0.4 * h2) * (0.7 + 0.6 * gr);
  return col * (1.0 - gap);
}
vec3 ldDoor(vec2 p) {
  ldPlace();
  float wide = uRes.x / uRes.y, px = 1.0 / uRes.y;
  vec3 ro = vec3(2.15 + 0.04 * ldWave.x, 1.45, -4.6);
  vec3 fw = normalize(vec3(-2.15, 0.0, 4.6)), rt = vec3(fw.z, 0.0, -fw.x);
  vec2 q = p + vec2(0.23 * smoothstep(0.4, 1.5, wide) - 0.02, -0.21);
  vec3 up = vec3(0.0, 1.0, 0.0);
  if (uOwn[5] != 0.0) {
    float on = max(uOwn[5], 0.0), high = max(-uOwn[5], 0.0);
    ro = mix(ro, vec3(0.04 * ldWave.x, 1.2, -5.4), on);
    ro = mix(ro, vec3(1.9 + 0.04 * ldWave.x, 2.85, -3.7), high);
    fw = normalize(mix(mix(fw, vec3(0.0, 0.0, 1.0), on), normalize(vec3(-0.36, -0.5, 1.0)), high));
    rt = normalize(vec3(fw.z, 0.0, -fw.x)); up = cross(fw, rt);
    q = mix(q, p + vec2(0.0, -0.1), on); q = mix(q, p, high);
  }
  vec3 s1 = normalize(fw * 1.26 + rt * (q.x + 0.25 * px) + up * (q.y - 0.25 * px)), s2 = normalize(fw * 1.26 + rt * (q.x - 0.25 * px) + up * (q.y + 0.25 * px));
  vec2 h1 = ldMeet(ro, s1), h2 = ldMeet(ro, s2);
  bool g1 = h1.y == 8.0, g2 = h2.y == 8.0;
  float open = (g1 ? 0.5 : 0.0) + (g2 ? 0.5 : 0.0);
  vec3 rg = g1 ? s1 : s2, rd = g1 ? s2 : s1;
  vec2 hit = g1 ? h2 : h1;
  vec3 at = open > 0.0 ? ro - rg * (ro.z / rg.z) : ro + rd * hit.x;
  if (open == 0.0 && hit.y == 3.0) at.y = -at.z * abs(rd.y) / max(rd.z, 0.01);
  vec3 gap = ldGlow(vec2(open > 0.0 ? ldWrap(at.x) / ldHw : 0.0, min(at.y / ldHi, 1.0)));
  vec3 c = open == 1.0 ? gap : ldRoom(ro, rd, px / 1.26, hit.x, int(hit.y), gap);
  if (ldDay > 0.0) gap *= 1.0 + 0.5 * ldDay;
  if (open > 0.0 && uOwn[7] != 0.0) {
    vec3 b = (vec3(0.02) + ldMean * 0.03 + 0.2 * ldDay * uKind[2]);
    gap = mix(b, gap, ldBars(vec2(ldWrap(at.x), at.y), ldHw, ldHi, px * 3.0));
  }
  c = mix(c, gap, open * open);
  if (ldHaze > 0.0) {
    vec3 ray = open > 0.5 ? rg : rd, air = vec3(0.0);
    float far = min(open > 0.5 ? -ro.z / max(ray.z, 0.05) : hit.x, 9.0), j = hash21(gl_FragCoord.xy);
    for (int i = 0; i < 18; i++) {
      vec3 P = ro + ray * far * (float(i) + j) / 18.0, L = i % 3 == 0 ? vec3(-2.3 + 0.2 * ldWave.x, 2.1, 2.1) : i % 3 == 1 ? vec3(-0.75, 2.2, 2.5 + 0.12 * ldWave.x) : vec3(-3.2, 1.9, 2.0);
      vec3 d = L - P, ink = i % 3 == 0 ? ldRay[0] + ldRay[1] : i % 3 == 1 ? ldRay[2] : ldRay[3];
      float s = -P.z / max(d.z, 0.5);
      vec2 X = P.xy + d.xy * s;
      float g = (1.0 - smoothstep(-0.1, 0.1, ldGapD(X))) * ldPast(P, L, 0.1) * ldBars(vec2(ldWrap(X.x), X.y), ldHw, ldHi, 0.03) * (1.0 - smoothstep(-0.1, 0.0, P.z));
      air += (ink + ldHome + ldMean * 0.5 + 0.3 * ldInk[4]) * g / (1.0 + 0.35 * dot(P, P));
    }
    c = c * (1.0 - 0.45 * ldHaze * (1.0 - open)) + ldHaze * air * far * 0.04 * (0.75 + 0.5 * noise(vec3(q * 3.0, uTime * 0.06)));
  }
  return c * 1.5;
}

// Light well: a plain square shaft with a slot of light along each side of its unseen lid.
float lwR = 2.0, lwSlot = 0.55;
const float lwTop = 6.6;
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
  float h = max(lwTop - y, 0.05); float W = 2.0 * lwR;
  vec4 dx = vec4(0.04, lwSlot, W - lwSlot, W), iv = inversesqrt(dx * dx + h * h);
  vec4 a = h * iv * (lwAtan((lwR - u) * iv) + lwAtan((lwR + u) * iv));
  vec4 z = vec4(-lwR, lwSlot - lwR, lwR - lwSlot, lwR) - u;
  vec4 b = h * (iv.y * lwAtan(z * iv.y) - iv.z * lwAtan(z * iv.z));
  vec3 c = mix(own, vec3(ldMax(own)), 0.4) * (a.x - a.y) * 0.5 + opp * (a.z - a.w) * 2.9 + (lo * (b.y - b.x) + hi * (b.w - b.z)) * 0.75;
  vec3 rich = lwAll * lwAll / (ldMax(lwAll) + 1e-3);
  c = c * 0.36 + mix(lwAll, rich, 0.6) * ((0.07 + 0.08 * uSpace) * ldFade(h * 0.5) + 0.005);
  return ldRich(c, 1.5) * mix(0.62 - 0.2 * uTone, 1.5, 1.0 - smoothstep(0.8, 6.0, h));
}
// The sun let in by a window in the lid.
float lwSun(vec3 P, float s) {
  vec2 X = P.xz - vec2(0.6, 0.5) * (lwTop - P.y) + vec2(0.35, 0.5) * lwR + 0.12 * ldWave.xy;
  float e = 0.05 + s;
  return (1.0 - smoothstep(-e, e, max(abs(X.x) - 0.75, abs(X.y) - 1.1))) * ldBars(X + vec2(0.0, 1.1), 0.75, 2.2, s + 0.01);
}
vec3 lwWall(vec3 P, vec3 N, float px) {
  bool side = abs(N.x) > 0.5;
  float u = side ? P.z : P.x;
  vec2 w = vec2(u + (side ? 9.0 * N.x : 0.0), P.y);
  float alb = 0.72 * (0.93 + 0.09 * noise(w * vec2(0.9, 0.5)) + 0.04 * noise(w * vec2(4.5, 1.6) + 5.0));
  float j = abs(abs(fract(w.y / 1.1 + 0.5) - 0.5) * 1.1 - 0.544);
  alb *= 1.0 - 0.14 * (1.0 - ldStone) * (1.0 - smoothstep(0.0, 0.005 + px, j)) * min(1.0, 0.012 / px);
  if (ldStone > 0.0) alb *= mix(1.0, ldBlocks(w, px), ldStone);
  bool lf = N.x > 0.0, fr = N.z < 0.0;
  vec3 own = side ? (lf ? lwQ[1] : lwQ[2]) : (fr ? lwQ[3] : lwQ[0]), opp = side ? (lf ? lwQ[2] : lwQ[1]) : (fr ? lwQ[0] : lwQ[3]);
  vec3 L = lwAt(u, P.y, own, opp, side ? lwQ[0] : lwQ[1], side ? lwQ[3] : lwQ[2]);
  L *= (1.0 - 0.35 * ldFade((lwR - abs(u)) * 2.0)) * (1.0 - 0.35 * ldFade(P.y * 2.5));
  vec3 paint = vec3(1.0);
  if (ldDay > 0.0) {
    paint = mix(vec3(1.0), (0.15 + (lf ? uKind[1] : fr ? mix(uKind[1], uKind[2], 0.3) : uKind[2])) * 1.1, ldDay * 0.85);
    L = L * (1.0 - 0.4 * ldDay) + ldDay * (lf ? 0.4 : fr ? 0.22 : 0.1) * (0.2 + 0.2 * P.y) * (1.0 - 0.3 * ldFade(P.y * 2.0)) * (1.0 - 0.25 * ldFade((lwR - abs(u)) * 3.0));
  }
  L *= paint;
  if (uOwn[7] != 0.0 && (side ? P.x * N.x < 0.0 && !lf : fr)) L += (lwQ[1] + lwQ[3] + 0.25 + 0.4 * ldDay) * 0.11 * abs(uOwn[7]) * lwSun(P, px);
  L *= 1.0 + 0.13 * sin(0.9 * (P.x + P.z) + 0.5 * P.y + 0.16 * uTime);
  // a hit: a pulse of light going down the corner
  float dn = (P.y - mix(0.8, 3.9, uHits)) / 1.1;
  L += ldInk[4] * 0.4 * ldFade((2.0 * lwR + P.x - P.z) * 3.0 / lwR) * ldFade(dn * dn);
  if (!fr) return alb * L;
  float d = P.x - 0.4 - 0.3 * P.y;
  L += vec3(0.60, 0.29, 0.13) * uCue * smoothstep(-2.0, -0.4, d) * (1.0 - smoothstep(0.2, 1.5, d)) * smoothstep(-0.5, 5.0, P.y) * 0.55;
  float q = max(abs(P.x + 0.62) - 0.2, P.y - 0.98);
  float kx = P.x;
  if (uOwn[1] != 0.0) {
    float big = 1.0 + 0.8 * ldArch + 0.5 * ldRow, per = 0.92 / max(ldRow, 1e-3), x = P.x + 0.62;
    if (ldRow > 0.0) x -= per * clamp(floor(x / per + 0.5), -1.0, 2.0);
    float dw = 0.2 * big, dh = 0.98 * big, R = dw * ldArch;
    vec2 v = vec2(abs(x) - dw + R, P.y - dh + R);
    q = length(max(v, 0.0)) - R + min(max(v.x, v.y), 0.0);
    kx = -0.62 + x + 0.2 - dw;
  }
  vec3 dark = lwAll * 0.004 + (lwQ[2] + lwAll) * 0.016 * smoothstep(-0.07, -0.066, kx + 0.42) + vec3(0.5, 0.25, 0.1) * (uMic + 0.4 * uKeys) * 0.15;
  if (ldDay > 0.0) dark = mix(dark, uKind[0] * uKind[0] * (0.1 + 0.3 * smoothstep(-0.07, -0.066, kx + 0.42)), ldDay * 0.6);
  return mix(alb * L * (1.0 - 0.15 * ldFade(max(q, 0.0) * 30.0)), dark, 1.0 - smoothstep(-px, px, q));
}
vec3 ldWell(vec2 p) {
  lwLights();
  float yaw = -0.30 + 0.015 * ldWave.x, tilt = 0.27;
  vec3 ro = vec3(1.1 + 0.04 * ldWave.y, 0.8, -1.75);
  if (uOwn[0] > 0.0) lwR += 2.6 * uOwn[0];
  if (uOwn[0] < 0.0) lwR += 0.95 * uOwn[0];
  if (uOwn[2] > 0.0) lwSlot = min(lwSlot + 0.8 * uOwn[2], 0.8 * lwR);
  if (uOwn[2] < 0.0) lwSlot *= 1.0 + 0.8 * uOwn[2];
  float gain = uOwn[2] == 0.0 ? 1.0 : pow(0.55 / lwSlot, 0.55), up1 = max(uOwn[5], 0.0), level = max(-uOwn[5], 0.0);
  for (int i = 0; i < 4; i++) lwQ[i] *= gain;
  if (uOwn[0] != 0.0) ro.xz *= lwR / 2.0;
  if (uOwn[5] != 0.0) {
    ro = mix(ro, vec3(0.05 * ldWave.y, 0.3, -0.25 * lwR), up1);
    ro = mix(ro, vec3(0.0, 1.0 + 0.2 * ldAir, -0.92 * lwR), level);
    tilt = mix(mix(tilt, 1.42, up1), 0.12, level);
    yaw = mix(yaw, 0.02 * ldWave.x, max(up1, level));
  }
  vec3 fw = vec3(sin(yaw) * cos(tilt), sin(tilt), cos(yaw) * cos(tilt)), rt = vec3(cos(yaw), 0.0, -sin(yaw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 0.66 + rt * p.x + up * p.y);
  vec3 sg = 2.0 * step(0.0, rd) - 1.0, m = sg / max(abs(rd), 1e-4);
  vec2 tw = (sg.xz * lwR - ro.xz) * m.xz;
  float tf = rd.y < 0.0 ? -ro.y * m.y : 1e4, t = min(tf, min(tw.x, tw.y)), fr = 1.0;
  vec3 P = ro + rd * t, add = vec3(0.0), eye = rd;
  float seen = t;
  if (t == tf) {
    vec2 f2 = smoothstep(-lwR, lwR, P.xz);
    add = (mix(lwQ[2], lwQ[1], f2.x) + mix(lwQ[3], lwQ[0], f2.y)) * 0.0045 * (1.0 - 0.6 * ldFade(2.5 * (lwR - max(abs(P.x), abs(P.z)))));
    float f = 1.0 + rd.y; f *= f;
    fr = 0.16 + 0.75 * f * f;
    rd.y = -rd.y;
    if (ldDay > 0.0) add = mix(add, (0.2 + uKind[0]) * 0.3 * (0.6 + 0.4 * fr) * (1.0 - 0.4 * ldFade(2.5 * (lwR - max(abs(P.x), abs(P.z))))), ldDay);
    if (uOwn[7] != 0.0) add += (lwQ[1] + lwQ[3] + 0.25 + 0.4 * ldDay) * 0.05 * abs(uOwn[7]) * lwSun(P, 2.0 * t / uRes.y);
    if (ldSand > 0.0) {
      float dn = ldDunes(P.xz * 1.3, 1.5 * t / uRes.y / max(rd.y, 0.05));
      vec3 bed = (add * 3.0 + lwAll * 0.035 + add * ldDay) * dn * dn;
      add = mix(add, bed, ldSand); fr *= 1.0 - ldSand;
    }
    if (ldWater > 0.0) {
      vec2 rp = ldRipple(P.xz * 1.6) * (0.05 + 0.1 * uLow) * ldWater;
      rd = normalize(rd + vec3(rp.x, 0.0, rp.y));
      m = sg / max(abs(rd), 1e-4);
      fr = mix(fr, 0.35 + 0.65 * f, ldWater); add *= 1.0 - 0.7 * ldWater;
    }
    tw = (sg.xz * lwR - P.xz) * m.xz;
    t += min(tw.x, tw.y); P += rd * min(tw.x, tw.y);
  }
  vec3 N = tw.x < tw.y ? vec3(-sg.x, 0.0, 0.0) : vec3(0.0, 0.0, -sg.z);
  vec3 wall = lwWall(P, N, 1.5 * t / uRes.y);
  if (ldAir > 0.0) wall = mix(wall, ldSky(rd) * 0.5, smoothstep(-0.01, 0.01, P.y - mix(9.0, 2.5, sqrt(ldAir)) - (N.z < 0.0 ? 0.0 : 0.9)));
  float open = sat(5.0 * max(up1, abs(uOwn[0])));
  if (ldAir == 0.0 && open > 0.0 && rd.y > 1e-3) {
    vec2 X = P.xz + rd.xz * (lwTop - P.y) / rd.y, ax = abs(X);
    float in1 = lwR - max(ax.x, ax.y), dx = fwidth(in1) + 0.01;
    vec3 sk = ax.x > ax.y ? (X.x < 0.0 ? lwQ[1] : lwQ[2]) : (X.y > 0.0 ? lwQ[3] : lwQ[0]);
    vec3 lid = mix(lwAll * 0.05, sk * 0.5 + 0.06, (1.0 - smoothstep(-dx, dx, in1 - lwSlot))) + sk * 0.12 * exp(-max(in1 - lwSlot, 0.0) * 3.0);
    if (uOwn[7] != 0.0) lid *= mix(1.0, ldBars(X, lwR, 2.0 * lwR, dx), 0.9);
    if (ldDay > 0.0) lid = mix(lid, (1.0 - smoothstep(-dx, dx, lwSlot - in1)) * 0.12 * uKind[2] + (1.0 - smoothstep(-dx, dx, in1 - lwSlot)) * vec3(0.5), 0.6 * ldDay);
    wall = mix(wall, lid, open * smoothstep(-0.02, 0.02, P.y - lwTop));
  }
  vec3 c = add + fr * wall;
  if (ldHaze > 0.0) {
    float j = fract(52.983 * fract(dot(gl_FragCoord.xy, vec2(0.0671, 0.0058)))); vec3 air = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      vec3 Q = ro + eye * min(seen, 9.0) * (float(i) + j) / 16.0;
      air += (lwQ[1] + lwQ[3] + lwAll) * lwSun(Q, 0.09) * ldFade(max(lwTop - Q.y, 0.0) * 0.16);
    }
    c = c * (1.0 - 0.45 * ldHaze) + ldHaze * air * min(seen, 9.0) * 0.0036 * (0.75 + 0.5 * noise(vec3(p * 3.0, uTime * 0.06)));
  }
  return 2.4 * c;
}

vec3 render(vec2 p) {
  ldLights();
  return screenOf(uVar > 0.5 ? ldWell(p) : ldDoor(p));
}
