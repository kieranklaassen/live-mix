// name: Still life
// a: Low sun
// b: Stipple
// what: Five matte balls stand on a plain before a half-sunk glowing disc, in low soft light with long shadows, like a still life on film.
// follows: Each kind of sound is one ball, as large as it is loud; the disc is the piece at this place in the loop, and the light swings round with the loop; a hit lights the small ball from inside, a cue sends a ring over the plain.
// own: 0 the form: 1 turned pots and bottles with necks, -1 cut blocks and pillars; 1 how many: 1 nine and smaller, strewn about, -1 one great one with the others small at its foot; 2 how they stand: 1 close in a row, -1 piled flat on one another; 3 the floor: 1 still water that mirrors, -1 rippled dunes they lie sunk in; 4 the air: 1 pale day (b: ink on paper), -1 dusk with the light behind; 5 the eye: 1 from high above, -1 low along the ground; 6 the stuff: 1 clear glass, -1 drawn in engraved lines; 7 the disc: 1 small and whole up in the air, -1 a tall arch
const int gMost = 9, gDisc = 100, gFloor = 101;
int gN;       // how many stand there
vec4 gS[gMost];   // the balls: middle and radius
vec3 gA[gMost];   // their colours
vec3 gL;      // towards the low light
vec4 gD;      // the disc: middle (x, y, z) and radius
vec3 gGlow;   // the light inside the small ball
const float gTurn[5] = float[5](0.12, 0.09, -0.1, 0.12, -0.1); // which way each ball's colour turns in its shadow
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

vec3 discLight(float h);
bool gShaped;             // are they another form than balls
float gFlat, gCut, gTurned; // how flat, how much a block, how much a pot
vec2 gEnd[5];             // how far each kind of form goes down and up
float gAcross[5];         // and across
vec3 gBox[5];             // half of a block
vec4 gPot[5];             // a pot: its body's flat part, half its height, its rounding, its neck
float gNeck[5];           // how high the neck goes
vec4 gSeen; vec3 gFace; int gWhat; float gFar; // what the last ray met: where, its face, which
// The form that is being looked at.
vec3 fBox; vec4 fPot; float fNeck; mat2 fRot;
vec4 gB[gMost];           // a ball round each, its radius squared
void take(int k) {
  int i = k % 5;
  fBox = gBox[i]; fPot = gPot[i]; fNeck = gNeck[i];
  if (gCut > 0.0) fRot = rot(gCut * (0.5 + 1.3 * float(i)));
}
// 1 large: how far off its skin.
float formAt(vec3 q) {
  q.y /= gFlat;
  float d;
  if (gCut > 0.0) {
    q.xz *= fRot;
    float rr = mix(1.0, 0.045, gCut);
    vec3 e = abs(q) - (fBox - rr);
    d = length(max(e, 0.0)) + min(max(e.x, max(e.y, e.z)), 0.0) - rr;
  } else {
    vec4 o = fPot;
    float w = length(q.xz);
    vec2 e = vec2(w - o.x, abs(q.y) - o.y);
    d = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - o.z;
    if (gTurned > 0.0) {
      e = vec2(w - o.w, abs(q.y - 0.5 * fNeck) - 0.5 * fNeck) + 0.04;
      d = smin(d, length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.04, 0.3 * gTurned + 0.01);
    }
  }
  return d * gFlat;
}
// The forms, worked out once.
void formed() {
  gCut = max(-uOwn[0], 0.0); gTurned = max(uOwn[0], 0.0); gFlat = 1.0 - 0.36 * max(-uOwn[2], 0.0);
  gShaped = uOwn[0] != 0.0 || uOwn[2] < 0.0;
  const vec3 box[5] = vec3[5](vec3(0.62, 1.1, 0.62), vec3(0.8), vec3(1.1, 0.55, 0.75), vec3(0.44, 1.55, 0.44), vec3(0.85));
  const vec4 pot[5] = vec4[5](vec4(0.46, 0.62, 0.14, 0.15), vec4(0.4, 0.1, 0.46, 0.2), vec4(0.5, 0.2, 0.32, 0.5), vec4(0.3, 0.85, 0.12, 0.13), vec4(0.3, 0.05, 0.45, 0.1));
  const float neck[5] = float[5](1.6, 1.15, 0.72, 2.0, 1.15);
  for (int i = 0; i < 5; i++) {
    gBox[i] = mix(vec3(1.0), box[i], gCut);
    gPot[i] = mix(vec4(0.0, 0.0, 1.0, 0.1), pot[i], gTurned);
    gNeck[i] = mix(0.5, neck[i], gTurned);
    gEnd[i] = gCut > 0.0 ? gBox[i].yy : vec2(gPot[i].y + gPot[i].z, max(gPot[i].y + gPot[i].z, gNeck[i]));
    gEnd[i] *= gFlat;
    gAcross[i] = gCut > 0.0 ? mix(1.0, length(gBox[i].xz), gCut) : gPot[i].x + gPot[i].z;
  }
}
float formHit(vec3 ro, vec3 rd, int k) {
  vec4 s = gB[k]; vec3 oc = ro - s.xyz;
  float b = dot(oc, rd), h = b * b - dot(oc, oc) + s.w;
  if (h < 0.0) return -1.0;
  s = gS[k];
  vec3 o = (ro - s.xyz) / s.w; b /= s.w; h /= s.w * s.w;
  take(k);
  h = sqrt(h);
  float t = max(-b - h, 0.0), end = -b + h;
  for (int n = 0; n < 15; n++) {
    float d = formAt(o + rd * t);
    if (d < 0.004) return t * s.w;
    t += d;
    if (t > end) return -1.0;
    if (n == 14 && d < 0.03) return t * s.w;
  }
  return -1.0;
}
float formShade(vec3 ro, vec3 rd, int of, float k) {
  vec4 s = gB[of]; vec3 oc = ro - s.xyz;
  float b = -dot(oc, rd), q = dot(oc, oc) - b * b;
  if (b < 0.0 && b * b > s.w) return 1.0;
  float rr = sqrt(s.w), reach = rr + max(b + rr, 0.0) / (2.5 * k);
  if (q > reach * reach) return 1.0;
  s = gS[of];
  vec3 o = (ro - s.xyz) / s.w; b /= s.w; rr /= s.w;
  take(of);
  float t = max(b - rr * 1.1, 0.02), end = b + rr, l = 1.0;
  for (int n = 0; n < 8; n++) {
    float d = formAt(o + rd * t);
    l = min(l, 2.5 * k * d / t);
    t += clamp(d, 0.08, 0.5);
    if (l < 0.01 || t > end) break;
  }
  return smoothstep(0.0, 1.0, l);
}
vec3 gSky1, gUp, gOut; // the day's blue; the air straight up, and at the horizon
vec3 airAt(vec3 rd);
void others(float lv[5]);
void place() {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec2 at[5] = vec2[5](vec2(-0.8, 0.95), vec2(1.0, 0.1), vec2(-1.75, -0.6), vec2(2.25, 1.35), vec2(-0.15, -1.0));
  float big[5] = float[5](0.98, 0.74, 0.52, 0.56, 0.34);
  for (int k = 0; k < 5; k++) {
    float r = big[k] * (0.2 + 0.8 * sqrt(lv[k]));
    if (k == 4) r = 0.2 + 0.14 * uHits;
    gS[k] = vec4(at[k].x, r, at[k].y, r);
    gA[k] = rich(uKind[k], 1.8) * 0.8;
  }
  gN = 5;
  if (uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] < 0.0 || gShaped) others(lv);
  gL = normalize(mix(vec3(-0.95, 0.21, -0.12), vec3(-0.88, 0.36, -0.3), uVar));
  if (uOwn[4] > 0.0) gL = normalize(mix(gL, vec3(-0.72, 0.62, -0.42), uOwn[4]));
  if (uOwn[4] < 0.0) gL = normalize(mix(gL, vec3(-0.34, 0.3, 0.86), -uOwn[4]));
  gL.xz *= rot(0.4 * sin(TAU * uLoop)); // the light goes round a little with the loop, and the shadows with it
  gD = vec4(0.55, 0.0, 3.6, 1.7 + 0.5 * uLevel);
  gD.y = gD.w * 0.22;
  if (uOwn[4] != 0.0) {
    gSky1 = vec3(0.75) + 0.6 * rich(uKind[1] * uKind[1], 0.7);
    gUp = airAt(vec3(0.0, 1.0, 0.0)); gOut = airAt(vec3(0.0, 0.0, 1.0));
  }
  if (uOwn[7] > 0.0) gD = mix(gD, vec4(1.25, 2.05, 5.0, 0.62 + 0.12 * uLevel), uOwn[7]);
  if (uOwn[7] < 0.0) gD = mix(gD, vec4(0.35, 1.7, 3.4, 1.2 + 0.12 * uLevel), -uOwn[7]);
  gGlow = rich(uKind[4], 2.1) * uHits * 5.0;
}
float ballAt(vec3 ro, vec3 rd, vec4 s) {
  vec3 oc = ro - s.xyz; float b = dot(oc, rd), h = b * b - dot(oc, oc) + s.w * s.w;
  return h < 0.0 ? -1.0 : -b - sqrt(h);
}
// Where else they may stand: in a crowd, alone, in a row, piled up, sunk.
void others(float lv[5]) {
  float crowd = max(uOwn[1], 0.0), alone = max(-uOwn[1], 0.0), row = max(uOwn[2], 0.0), pile = max(-uOwn[2], 0.0), sunk = max(-uOwn[3], 0.0);
  const vec2 by[5] = vec2[5](vec2(0.35, 1.7), vec2(1.75, -0.35), vec2(-1.55, -0.55), vec2(-1.9, 0.75), vec2(0.35, -1.15));
  const int line[5] = int[5](2, 0, 4, 1, 3);
  const int heap[5] = int[5](0, 1, 3, 2, 4);
  float still[5];
  for (int k = 0; k < 5; k++) {
    float w = gS[k].w;
    const float big[5] = float[5](0.98, 0.74, 0.52, 0.56, 0.34);
    if (k < 4) w = mix(w, big[k] * (0.6 + 0.45 * sqrt(lv[k])), min(max(max(abs(uOwn[0]), abs(uOwn[2])), max(crowd, sunk)) * 1.2, 1.0)); // none is ever quite gone
    w = mix(w, k == 0 ? 1.0 + 0.5 * sqrt(lv[0]) : w * 0.5 + 0.06, alone);
    w = mix(w, w * 0.62 + 0.08, crowd);
    w = mix(w, k == 4 ? w : w * 0.5 + 0.2, pile);
    gS[k].xz = mix(gS[k].xz, by[k], alone);
    gS[k].w = w;
    still[k] = k == 4 ? 0.28 : w;         // a hit moves none of the others
  }
  if (row > 0.0) {
    float x = 0.0, all = 0.0;
    for (int n = 0; n < 5; n++) all += 2.0 * still[line[n]] * gAcross[line[n]] * mix(1.0, 0.82, gCut) + 0.05;
    for (int n = 0; n < 5; n++) {
      int k = line[n];
      float w = still[k] * gAcross[k] * mix(1.0, 0.82, gCut);
      gS[k].xz = mix(gS[k].xz, vec2(0.3 - 0.5 * all + x + w, 0.15 + (k == 4 ? -0.25 : 0.1 * sin(float(k) * 2.4))), row);
      x += 2.0 * w + 0.05;
    }
  }
  float y = 0.0;
  for (int n = 0; n < 5; n++) {
    int k = heap[n];
    gS[k].y = gS[k].w * gEnd[k].x;
    if (pile > 0.0) {
      vec2 lean = vec2(0.1 + 0.09 * sin(float(n) * 2.3 + 0.6), 0.2 + 0.05 * sin(float(n) * 3.7));
      gS[k].xyz = mix(gS[k].xyz, vec3(lean.x, y + gS[k].y, lean.y), pile);
      y += still[k] * (gEnd[k].x + gEnd[k].y) * 0.985;
    }
    gS[k].y -= sunk * (1.0 - pile) * gS[k].w * (gEnd[k].x + gEnd[k].y) * (k == 4 ? 0.1 : 0.2 + 0.08 * sin(float(k) * 2.1));
  }
  if (crowd > 0.0) {
    const vec3 more[4] = vec3[4](vec3(0.02, 0.15, 0.34), vec3(1.75, -0.55, 0.36), vec3(-1.05, -0.5, 0.3), vec3(1.35, 1.7, 0.46));
    gN = gMost;
    for (int k = 5; k < gMost; k++) {
      vec3 m = more[k - 5]; int i = (k * 3) % 5;
      float w = max(m.z * crowd * (0.7 + 0.35 * lv[i == 4 ? 1 : i]), 0.002);
      gS[k] = vec4(m.x, w * gEnd[k % 5].x * (1.0 - 0.35 * sunk), m.y, w);
      gA[k] = gA[i] * (0.6 + 0.5 * fract(float(k) * 0.61));
    }
  }
  if (gShaped) for (int k = 0; k < gN; k++) {
    int i = k % 5; float a = gEnd[i].x, b = gEnd[i].y, w = gS[k].w;
    gB[k] = vec4(gS[k].xyz + vec3(0.0, 0.5 * (b - a) * w, 0.0), (0.25 * (a + b) * (a + b) + gAcross[i] * gAcross[i]) * w * w);
  }
}
// How much of the light a ball lets by: soft, and softer the farther its shadow has fallen.
float shade(vec3 ro, vec3 rd, vec4 s, float k) {
  vec3 oc = ro - s.xyz; float b = dot(oc, rd), h = b * b - dot(oc, oc) + s.w * s.w;
  float d = sqrt(max(0.0, s.w * s.w - h)) - s.w, t = -b - sqrt(max(h, 0.0));
  return t < 0.0 ? 1.0 : smoothstep(0.0, 1.0, 2.5 * k * d / t);
}
float shadeAt(vec3 ro, vec3 rd, int k) {
  if (gShaped) return formShade(ro, rd, k, 2.4 + 2.4 * max(uOwn[4], 0.0));
  return shade(ro, rd, gS[k], 2.4);
}
// Is one of them too far off to shade or to colour this place?
bool past(vec3 ro, vec4 s) {
  vec3 r = s.xyz - ro; float l2 = dot(r, r), b = dot(r, gL), w = s.w * (gShaped ? 1.7 : 1.0);
  float off = w + max(b + w, 0.0) * 0.17;
  return l2 > 14.0 * s.w * s.w && (b < 0.0 || l2 - b * b > off * off);
}
// How far inside the disc's edge, by its own size: round, or an arch that stands on the plain.
float inDisc(vec2 q) {
  vec2 v = q - gD.xy;
  if (uOwn[7] < 0.0 && v.y < 0.0) v.y *= 1.0 + uOwn[7];
  return length(v);
}
// The air, by day and at dusk.
vec3 airAt(vec3 rd) {
  float day = max(uOwn[4], 0.0), dusk = max(-uOwn[4], 0.0), h = sat(rd.y * 1.6);
  vec3 c = day * mix(vec3(1.9, 1.82, 1.7), gSky1, smoothstep(0.0, 1.0, h));
  if (dusk == 0.0) return c;
  vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k2 = mix(uKind[2], uKind[4], 0.4); k2 *= k2;
  vec3 low = exp(-max(rd.y, 0.0) * 5.0) * k2 * 1.25;
  c += dusk * (low + (0.05 + 0.55 * k1) * exp(-max(rd.y, 0.0) * 2.2) * 0.6 + k0 * 0.12) * (0.75 + 0.5 * uLevel);
  return c;
}
// What clear stuff sees behind it: the floor with no shadow, the air, the disc.
vec3 behindAt(vec3 ro, vec3 rd) {
  vec3 c = airAt(rd);
  float air = abs(uOwn[4]), t = rd.y < -0.01 ? -ro.y / rd.y : 1e4, d = rd.z > 0.01 ? (gD.z - ro.z) / rd.z : 1e4;
  vec3 q = ro + rd * d;
  if (t < 30.0 && t > 0.0) {
    vec2 g = (ro + rd * t).xz - vec2(0.3, 0.8);
    float pool = mix(exp(-dot(g, g) / 6.5), 1.0, air * 0.9);
    c = mix(c, (mix(vec3(0.21, 0.18, 0.19), vec3(0.62, 0.6, 0.57), max(uOwn[4], 0.0)) * pool * sat(gL.y) * 2.6), exp(-t * 0.08));
  }
  if (d < t && d > 0.0 && q.y > 0.0) c += rich(piece(vec2(uLoop, 0.94 - 0.88 * sat(q.y / (gD.y + gD.w)))).rgb, 1.8) * (0.5 + 1.3 * uLevel) * smoothstep(gD.w, gD.w * 0.8, inDisc(q.xy));
  return c;
}
// The disc's own light at a height on it (0 the plain, 1 its top): the piece here in the loop, the front of the room lowest.
vec3 discLight(float h) {
  float y = 1.0 - 0.06 - 0.88 * sat(h);
  vec3 m = piece(vec2(uLoop, y)).rgb * 0.4 + piece(vec2(uLoop, y - 0.09)).rgb * 0.3 + piece(vec2(uLoop, y + 0.09)).rgb * 0.3;
  return rich(m, 1.8) * (0.5 + 1.3 * uLevel);
}

vec3 scene(vec3 ro, vec3 rd) {
  bool dots = uVar > 0.5;
  float tb = 1e5; int id = -1;
  for (int k = 0; k < gN; k++) { float t = gShaped ? formHit(ro, rd, k) : ballAt(ro, rd, gS[k]); if (t > 0.0 && t < tb) { tb = t; id = k; } }
  float td = (gD.z - ro.z) / rd.z; vec3 qd = ro + rd * td;
  float top = gD.y + gD.w;
  if (td > 0.0 && td < tb && qd.y > 0.0 && inDisc(qd.xy) < gD.w) { tb = td; id = gDisc; }
  float tf = -ro.y / rd.y;
  if (rd.y < 0.0 && tf < tb) { tb = tf; id = gFloor; }
  gWhat = id; gFar = tb; gFace = -rd;

  vec3 key = mix(vec3(1.0, 0.8, 0.6), vec3(0.86, 0.9, 1.0), dots ? 0.6 : 0.35 - 0.35 * uTone) * (1.2 + 0.9 * uLevel);
  vec3 sky = mix(uKind[0], uKind[1], 0.6) * vec3(0.5, 0.6, 1.0) * (dots ? 0.012 : 0.035);
  vec3 dl = (discLight(0.2) + discLight(0.5) + discLight(0.8)) / 3.0; // what the disc throws forward
  vec3 col = vec3(0.0);
  if (uOwn[4] != 0.0 && id < 0) col = airAt(rd);
  if (id >= 0) {
    vec3 pos = ro + rd * tb, n, alb;
    if (id < gDisc) {
      n = (pos - gS[id].xyz) / gS[id].w; alb = gA[id];
      if (gShaped) {
        vec3 q = n; q.y /= gFlat;
        take(id);
        if (gCut > 0.0) {
          q.xz *= fRot;
          float rr = mix(1.0, 0.045, gCut);
          vec3 e = abs(q) - (fBox - rr);
          vec3 m = max(e, 0.0) + 1e-4 * step(max(e.x, max(e.y, e.z)), e);
          n = m * sign(q);
          n.xz = fRot * n.xz;
        } else {
          const vec2 e = vec2(0.004, 0.0);
          vec2 f = vec2(length(q.xz), q.y * gFlat); vec3 o = vec3(f, 0.0);
          float d0 = formAt(o);
          vec2 g = vec2(formAt(o + e.xyy), formAt(o + e.yxy)) - d0;
          n = vec3(q.xz * g.x / max(f.x, 1e-3), g.y).xzy;
        }
        n.y /= gCut > 0.0 ? gFlat : 1.0;
        n = normalize(n + vec3(0.0, 1e-7, 0.0));
      }
      if (uOwn[4] > 0.0) alb = mix(alb, alb * alb * 1.1 + 0.02, uOwn[4]);
    }
    else if (id == gDisc) { n = vec3(0.0, 0.0, -1.0); alb = vec3(0.07, 0.065, 0.08); }
    else { n = vec3(0.0, 1.0, 0.0); alb = dots ? vec3(0.17, 0.17, 0.3) : vec3(0.21, 0.18, 0.19);
      if (uOwn[4] > 0.0) alb = mix(alb, vec3(0.64, 0.62, 0.59), uOwn[4]);
      if (uOwn[3] < 0.0) {
        // dunes: long swells and the wind's ripples on them
        float far = exp(-max(tb - 3.0, 0.0) * 0.22);
        vec2 w = pos.xz + 0.25 * sin(pos.zx * 1.1 + vec2(0.0, 2.0));
        float a = 13.0 * (w.y + 0.35 * w.x) + 3.0 * noise(w * 1.1);
        vec2 sl = vec2(0.35, 1.0) * cos(a) * 0.2 * far * smoothstep(0.1, 0.7, noise(w * 0.8 + 20.0));
        sl += vec2(0.1, 0.13) * cos(pos.xz * vec2(1.3, 1.6) + 1.7 * sin(pos.zx * vec2(0.8, 0.6) + vec2(1.0, 4.0)));
        n = normalize(vec3(-sl.x * uOwn[3], 1.0, -sl.y * uOwn[3]) * vec3(-1.0, 1.0, -1.0));
        alb *= 1.0 + uOwn[3] * 0.25 * (0.5 - noise(pos.xz * 60.0)) * far;
      }
    }
    vec3 sp = pos + n * 0.002;
    float ndl = dot(n, gL);
    float sh = 1.0, ao = 1.0;
    vec3 bounce = vec3(0.0);
    vec2 q = pos.xz - vec2(0.3, 0.8);
    float pool = exp(-dot(q, q) / (dots ? 5.0 : 6.5));
    if (uOwn[4] != 0.0) pool = mix(pool, 1.0, abs(uOwn[4]) * 0.9);
    // the light falls in one wide pool
    key *= mix(vec3(0.3, 0.12, 0.9), vec3(1.0), sat(pool * 1.35));  // and cools to violet towards its edge
    gFace = n;
    vec3 tint = vec3(1.0);
    for (int k = uOwn[6] < 1.0 || id >= gDisc ? 0 : gN; k < gN; k++) {
      if (gN > 5 && (k == id || past(sp, gS[k]))) continue;
      float me = k == id ? 0.0 : 1.0;
      vec3 r = gS[k].xyz - pos; float l = length(r);
      float sk = gShaped && ndl < -0.3 ? 1.0 : shadeAt(sp, gL, k);
      if (uOwn[6] > 0.0) tint *= mix(vec3(1.0), mix(gA[k] * 0.9 + 0.1, vec3(1.0), sk), uOwn[6] * me);
      sh *= mix(1.0, uOwn[6] > 0.0 ? mix(sk, 1.0, 0.75 * uOwn[6]) : sk, me);
      float ff = sat(dot(n, r) / l) * gS[k].w * gS[k].w / (l * l);   // how much of what this point sees is that ball
      ao *= 1.0 - me * ff * 0.85;
      // the light that ball throws back, in its own colour, from the side of it turned this way
      float lit = sat(0.45 + 0.55 * dot(-r / l, gL));
      bounce += me * gA[k] * lit * ff;
    }
    // a long gradient round a ball from its lit side to its dark side
    float turn = smoothstep(-0.3, 0.95, ndl);
    float wide = id < gDisc ? pow(turn, 1.7) * 1.1 : sat(ndl) * (dots ? 1.0 : 1.6);
    vec3 light = key * pool * wide * sh;
    light += key * pool * bounce * (id < gDisc ? 0.9 : 2.2);
    if (uOwn[6] > 0.0) light *= tint;
    if (id < gDisc) {
      // the plain throws light up under a ball, most on the side where the plain is lit
      vec2 out2 = normalize(n.xz + 1e-4);
      light += key * pool * vec3(0.2, 0.175, 0.19) * sat(0.5 - 0.5 * n.y) * sat(0.5 + 0.5 * dot(out2, normalize(gL.xz))) * 0.55;
      ao *= 0.55 + 0.45 * sat(0.5 + 0.5 * n.y + pos.y * 0.6);
      float side = 0.5 - 0.5 * ndl;                 // 0 facing the light, 1 turned away
      alb = rich(hueShift(alb, gTurn[id % 5] * (side - 0.2)), 1.0 + 0.35 * side); // the hue turns as it goes into the dark
    }
    light += sky * ao * (0.6 + 0.4 * n.y);
    // the disc's light, falling forward over everything in front of it
    vec3 v = vec3(gD.x, gD.w * 0.55, gD.z) - pos; float d2 = dot(v, v), d1 = sqrt(d2);
    float fwd = sat(v.z / d1);
    light += dl * sat(0.12 + 0.88 * dot(n, v) / d1) * fwd * gD.w * gD.w / (d2 + gD.w * gD.w) * ao * (dots ? 0.5 : 1.3) * float(id != gDisc);
    if (uOwn[4] > 0.0) {
      // by day the whole air lights them, and the pale plain throws it up again
      light *= mix(1.0, 1.25, uOwn[4]);
      light += uOwn[4] * mix(vec3(0.52, 0.5, 0.47), 0.75 * gUp, 0.5 + 0.5 * n.y) * ao * (id == gFloor ? 0.95 : 0.62);
    }
    if (uOwn[4] < 0.0) light += -uOwn[4] * ao * (airAt(normalize(n + vec3(0.0, 0.25, 0.001))) * 0.55 + 0.25 * gOut * sat(0.6 + 0.4 * n.z));
    // the small ball lit from inside
    vec3 g = gS[4].xyz - pos; float g2 = dot(g, g);
    light += gGlow * sat(0.08 + 0.92 * dot(n, g) * inversesqrt(g2)) * gS[4].w * gS[4].w / (g2 + 0.02) * float(id != 4);
    if (id == gFloor) {
      // a cue: a ring of light running out over the plain from the small ball
      float rr = length(pos.xz - gS[4].xz) - (1.0 - uCue) * 5.5;
      light += rich(uKind[4], 2.1) * uCue * uCue * exp(-rr * rr * 9.0) * 2.0;
    }
    col = alb * light;
    if (id == 4) { float core = pow(sat(dot(n, -rd)), 2.2); col += gGlow * (0.1 + 0.5 * core) + vec3(1.0, 0.75, 0.5) * uHits * core * core * 2.5; }
    if (id < gDisc && uOwn[6] > 0.0) {
      // clear: what lies behind it is seen bent and upside down, light gathers on its far side
      vec3 in_ = refract(rd, n, 0.7);
      float thick = 2.0 * gS[id].w * max(dot(-in_, n), 0.02);
      vec3 m = n - 2.0 * dot(n, in_) * in_, go = refract(in_, normalize(-m + 1e-4), 1.42);
      if (dot(go, go) < 0.01) go = reflect(in_, normalize(-m + 1e-4));
      vec3 hue = gA[id] / max(max(gA[id].r, max(gA[id].g, gA[id].b)), 0.05), bb = behindAt(pos + in_ * thick, go);
      float f = 1.0 - sat(dot(n, -rd)), hl = sat(dot(reflect(rd, n), gL));
      vec3 gl = bb * mix(vec3(1.0), hue * hue * 1.15, 0.45 + 0.5 * f) * (0.85 + 0.2 * f);
      gl += hue * hue * key * pool * 0.6 * sat(-ndl) * sat(0.25 + f);
      gl += airAt(reflect(rd, n)) * f * f * f * 0.6 + hue * 0.03 * key * f;
      gl += key * (pow(hl, 90.0) * 2.2 + pow(hl, 12.0) * 0.12);
      if (id == 4) gl += gGlow * 0.5;
      col = mix(col, gl, uOwn[6]);
    }
    if (id == gDisc) {
      float h = pos.y / top, edge = (gD.w - inDisc(pos.xy)) / gD.w;
      if (uOwn[7] > 0.0) h = mix(h, 0.5 + 0.5 * (pos.y - gD.y) / gD.w, uOwn[7]);
      float sd = 1.0;
      for (int k = 0; k < gN; k++) if (gN < 6 || !past(sp, gS[k])) sd *= shadeAt(sp, gL, k);
      col += discLight(h) * (0.3 + 0.7 * smoothstep(0.0, 0.6, edge)) * (dots ? 0.5 : 0.75) + alb * key * 0.5 * sd * sat(ndl + 0.2);
    }
    // far things sink into the dark of the room
    float left = exp(-max(tb - 5.0, 0.0) * (id == gFloor ? 0.2 : 0.05));
    if (uOwn[4] == 0.0) col *= left;
    else {
      if (id == gDisc && uOwn[4] < 0.0) col += -uOwn[4] * (0.5 - 0.35 * uLevel) * mix(gOut * 1.4, rich(uKind[2] * uKind[2], 1.2), 0.4) * (0.6 + 0.4 * pos.y / top);
      if (id == gDisc && uOwn[4] > 0.0) col += uOwn[4] * (0.3 - 0.2 * uLevel) * (uKind[1] + 0.15);
      if (id == gDisc && uOwn[4] > 0.0) col = mix(col, rich(discLight(0.5) + 0.02, 1.0) * 0.5 + col * 0.45, uOwn[4] * 0.5);
      if (id == gFloor && uOwn[4] < 0.0) col += -uOwn[4] * airAt(vec3(rd.x, -rd.y, rd.z)) * 0.35 * pow(1.0 - sat(-rd.y), 6.0) * sh;
      col = mix(gOut, col, id == gFloor ? exp(-max(tb - 5.0, 0.0) * 0.17) : exp(-max(tb - 4.0, 0.0) * 0.07 * float(id != gDisc)));
    }
  }
  // light in the air round the small ball
  gSeen = vec4(ro + rd * min(tb, 60.0), tb);
  vec3 oc = gS[4].xyz - ro; float tc = dot(oc, rd), m2 = dot(oc, oc) - tc * tc;
  col += gGlow * 0.08 * exp(-m2 / (gS[4].w * gS[4].w * 2.6)) * step(tc, tb + gS[4].w);
  return col;
}

vec3 render(vec2 p) {
  gFlat = 1.0; gShaped = false; gCut = gTurned = 0.0;
  if (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] < 0.0) formed();
  place();
  bool dots = uVar > 0.5;
  vec2 px = gl_FragCoord.xy;
  // film: every ray a hair off its place, so an edge is made of grain
  if (uOwn[6] > -0.999) p += (1.0 + min(uOwn[6], 0.0)) * (vec2(grain(px + fract(uTime * 3.7) * 61.0), grain(px.yx + 31.0 + fract(uTime * 2.9) * 47.0)) - 0.5) / uRes.y;
  float a = 0.2 * sin(uTime * 0.06) + 0.08 * sin(uTime * 0.023 + 1.0) + (dots ? -0.28 : -0.12);
  float far = dots ? 5.4 : 5.6, high = dots ? 2.9 : 1.15 + 0.15 * sin(uTime * 0.04);
  vec3 ta = vec3(0.3, dots ? 0.3 : 0.62, 0.2);
  float lens = dots ? 1.35 : 1.75, above = max(uOwn[5], 0.0), low = max(-uOwn[5], 0.0), pile = max(-uOwn[2], 0.0);
  if (pile > 0.0) { ta.y += pile * (dots ? 0.85 : 0.72); far += 1.1 * pile; high += pile * (dots ? -0.8 : 0.1); }
  if (above > 0.0) { far = mix(far, 1.3, above); high = mix(high, dots ? 5.6 : 6.6, above); ta = mix(ta, vec3(0.2, 0.0, 0.25), above); }
  if (low > 0.0) { far = mix(far, 4.5, low); high = mix(high, 0.26, low); ta.y = mix(ta.y, 1.15 + 0.35 * pile, low); lens = mix(lens, 1.3, low); }
  vec3 ro = ta + vec3(sin(a) * far, high - ta.y, -cos(a) * far);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * lens + rt * p.x + up * p.y);
  vec3 raw = scene(ro, rd);
  float lie = p.y;
  if (uOwn[6] < 0.0) {
    // where an engraved line lies: level on the plain, bent round a form
    float front = sat(dot(gFace, -rd));
    if (gWhat >= 0 && gWhat < gDisc) lie += (0.1 + 0.25 * gFace.y) * front * gS[gWhat].w / max(gFar, 1.0) - 0.12 * gFace.x * gS[gWhat].w / max(gFar, 1.0);
    else if (gWhat == gDisc) lie = 0.8 * p.y + 0.6 * p.x;
  }
  if (uOwn[3] > 0.0 && gWhat == gFloor) {
    // still water
    vec3 at = gSeen.xyz; float d = gSeen.w;
    vec2 w = at.xz * vec2(1.0, 2.6);
    vec2 sl = 0.5 * (vec2(noise(w * 1.6 + uTime * 0.12), noise(w * 1.6 + 30.0 - uTime * 0.1)) - 0.5) + 0.25 * (vec2(noise(w * 5.0 - uTime * 0.3), noise(w * 5.0 + 50.0 + uTime * 0.26)) - 0.5);
    sl *= 0.1 * (0.6 + 0.8 * uLow) / (1.0 + 0.1 * d * d);
    float rr = length(at.xz - gS[4].xz) - (1.0 - uCue) * 5.5;
    sl.y += 0.05 * uCue * sin(rr * 14.0) * exp(-rr * rr * 3.0);
    vec3 n = normalize(vec3(sl.x, 1.0, sl.y)), r = reflect(rd, n);
    r.y = max(r.y, 0.002);
    float f = 0.16 + 0.84 * pow(1.0 - sat(-rd.y), 3.0);
    vec3 deep = raw * mix(0.45, 0.8, max(uOwn[4], 0.0));
    raw = mix(raw, mix(deep, scene(at + vec3(0.0, 0.004, 0.0), normalize(r)), f), uOwn[3]);
  }
  vec3 c = screenOf(raw * (dots ? mix(1.9, 1.0, abs(uOwn[4])) : 1.0));
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  // an engraver's line: as thick as the place is light, or on paper as it is dark
  float cut = 0.0, ink = max(uOwn[4], 0.0), line = 0.0;
  if (uOwn[6] < 0.0) {
    float many = 62.0, u = abs(fract(lie * many + 0.06 * noise(p * 40.0)) - 0.5) * 2.0, soft = 2.6 * many / uRes.y;
    line = u; cut = -uOwn[6];
    if (!dots) {
      float light = pow(lum, 1.15) * 1.15 - soft, dark = pow(sat(1.04 - lum), 1.25) * 1.15 - soft * 0.5;
      vec3 hue = c / max(max(c.r, max(c.g, c.b)), 0.001);
      vec3 night = rich(hue, 1.15) * smoothstep(light + soft, light - soft, u) * (0.6 + 0.4 * lum);
      vec3 day = mix(vec3(0.95, 0.925, 0.87), rich(hue, 1.25) * hue * 0.3, smoothstep(dark + soft, dark - soft, u));
      c = mix(c, mix(night, day, ink), cut);
    }
  }
  if (!dots) {
    // the grain of the film: most in the middle tones, none in the black
    float cell = max(1.0, uRes.y / 540.0);
    float g = grain(floor(px / cell) + floor(uTime * 12.0) * 17.0) - 0.5;
    if (uOwn[4] != 0.0) g *= 1.0 - 0.5 * abs(uOwn[4]);
    c += c * g * 0.16 * (1.0 - lum) + g * 0.02 * smoothstep(0.0, 0.15, lum);
    return c;
  }
  // all in stipple: a grain for every little square, lit where the picture is brighter than the grain's own number
  float cell = max(1.0, floor(uRes.y / 320.0 + 0.5));
  vec2 gq = px / cell, gi = floor(gq), gf = fract(gq) - 0.5;
  float n = fract(grain(gi) + uTime * 0.03 * (0.5 + grain(gi + 7.7)));
  if (cut > 0.0) n = mix(n, line, cut);
  float dens = min(pow(lum, 1.6) * 1.6, 0.9);
  float on = smoothstep(n - 0.03, n + 0.03, dens);
  if (cut > 0.0) on = smoothstep(n - mix(0.03, 2.6 * 62.0 / uRes.y, cut), n + mix(0.03, 2.6 * 62.0 / uRes.y, cut), dens);
  float dotShape = cell < 1.5 ? 1.0 : smoothstep(0.7, 0.35, length(gf + (vec2(grain(gi + 3.1), grain(gi + 9.3)) - 0.5) * 0.7));
  vec3 hue = c / max(max(c.r, max(c.g, c.b)), 0.001);
  if (cut > 0.0) dotShape = mix(dotShape, 1.0, cut);
  if (ink > 0.0) {
    // ink on paper: a grain is dark where the picture is darker than its number
    float dark = min(smoothstep(0.1, 0.95, 1.02 - lum) * 1.25, 0.97), wet = mix(0.03, 2.6 * 62.0 / uRes.y, cut);
    vec3 paper = mix(vec3(0.95, 0.925, 0.87), rich(hue, 1.25) * hue * 0.34, smoothstep(n - wet, n + wet, dark) * mix(dotShape, 1.0, dark * dark));
    return mix(rich(hue, 1.3) * on * dotShape * (0.72 + 0.28 * lum), paper, ink);
  }
  return rich(hue, 1.3) * on * dotShape * (0.72 + 0.28 * lum);
}
