// name: Ribbons
// a: Hanging cloth
// b: Standing glass
// what: Five wide ribbons of thin coloured cloth hang and turn slowly in the dark, one behind another, their colours mixing where they cross and each throwing a soft shadow on those behind.
// follows: Each kind of sound is one ribbon, as wide and bright as it is loud; the place in the loop slides the colours along them; a hit sends a fold running down the front ribbon, a cue down all of them.
float gLv[5];
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// ---- a: cloth ----
const float gZ[5] = float[5](5.4, 4.4, 3.6, 3.0, 2.5);            // how far off each ribbon hangs (the drone farthest)
const float gX[5] = float[5](-0.42, 0.6, -0.78, 0.3, -0.06);
const float gLean[5] = float[5](0.14, -0.22, 0.26, -0.2, 0.1);
const float gEnd[5] = float[5](-9.0, -0.75, -9.0, -0.42, -0.2);   // where its lower end hangs, if it has one in sight
const float gSize[5] = float[5](1.2, 0.95, 0.75, 0.62, 0.5);
const float gHue[5] = float[5](0.13, 0.1, -0.1, 0.12, -0.1);      // the way each colour turns along its ribbon
float wide(int k) { return (0.07 + 0.8 * sqrt(gLv[k])) * gZ[k] * 0.3 * gSize[k]; }
float middle(int k, float y) {
  float fk = float(k), z = gZ[k], t = uTime * 0.1 + uTravel * 0.03;
  float free = 0.6 + 0.25 * sat(1.5 - y);   // the lower it hangs the more it swings
  return gX[k] * z + gLean[k] * z * 0.4 * y + free * (0.1 * z * sin(y * 0.45 + t * (0.8 + 0.17 * fk) + fk * 2.1) + 0.035 * z * sin(y * 1.2 - t * 1.3 + fk * 4.0));
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
  return 0.85 * sin(y * (0.45 + 0.07 * fk) + t * (1.0 + 0.3 * fk) + fk * 1.9) + 0.25 * sin(y * 1.3 - t * 1.7 + fk);
}
float cover(int k, vec2 P, float e) {
  float wp = wide(k) * cos(twist(k, P.y)) * (1.0 + 0.1 * fold(k, P.y));
  return smoothstep(wp + e, wp - e, abs(P.x - middle(k, P.y))) * smoothstep(-e, e, P.y - gEnd[k]);
}
// The colour along a ribbon: its own, sliding through the hues beside it as the loop goes round.
vec3 along(int k, float y, out vec3 deep) {
  float fk = float(k);
  vec3 own = rich(uKind[k], 2.0);
  float a = 0.5 + 0.5 * cos(TAU * (y * 0.2 + fk * 0.37 - uLoop));
  float b = 0.5 + 0.5 * cos(TAU * (y * 0.33 + fk * 0.21 + 2.0 * uLoop));
  deep = rich(hueShift(own, 1.5 * gHue[k]), 1.3);
  vec3 c = mix(deep * 0.5, own, a);
  c = mix(c, rich(hueShift(own, -gHue[k]), 1.25) * 1.1, 0.7 * b * a);
  return c * (0.4 + 0.6 * a);
}

vec3 cloth(vec2 p) {
  float sway = 0.3 * sin(uTime * 0.07), lift = 0.1 * sin(uTime * 0.05 + 1.0);
  vec3 ro = vec3(sway, lift, 0.0);
  vec3 rd = normalize(vec3(p.x - sway * 0.1, p.y, 1.05));
  rd.yz *= rot(-0.2);                        // looking a little up: they hang from above
  vec3 L = normalize(vec3(-0.6, 0.45, -0.66)); // the light in front, up and to the left
  vec3 B = normalize(vec3(0.75, 0.15, 0.65));  // and one behind, to the right, that shines through the cloth
  vec3 col = vec3(0.0);
  float t = uTime * 0.12 + uTravel * 0.03;
  for (int k = 0; k < 5; k++) {
    float z = gZ[k], fk = float(k);
    vec2 P = ro.xy + rd.xy * (z - ro.z) / rd.z;
    float e = (0.004 + 0.006 * abs(z - 3.6)) * z;   // sharpest in the middle distance
    float fo = fold(k, P.y);
    float th = twist(k, P.y), ct = cos(th);
    float w = wide(k) * (1.0 + 0.1 * fo), wp = w * ct;
    float dx = P.x - middle(k, P.y);
    float s = dx / wp;                               // where across the cloth, -1 to 1
    // the folds of the cloth, slowly passing along it
    float f1 = s * (4.2 + fk * 0.6) + P.y * 0.5 + t * (0.7 + 0.1 * fk) + fk * 1.7, f2 = s * (9.5 - fk) - P.y * 0.8 - t * 0.9 + fk * 0.6;
    float deep = 0.5 * sin(f1) + 0.22 * sin(f2);
    float slope = 0.62 * cos(f1) + 0.42 * cos(f2) + 0.5 * s;
    float d1 = (P.y - (2.2 - (1.0 - (k == 4 ? uHits : uCue)) * (4.2 + 0.3 * fk))) / 0.4;
    vec3 n = normalize(vec3(-slope, 0.25 * sin(P.y * 1.3 + fk * 2.0 + t) - 1.6 * fo * d1, -1.0));
    n.xz *= rot(th);
    float hem = gEnd[k] + 0.07 * z * 0.3 * deep;       // the lower end shows the folds as a wavy edge
    float cov = smoothstep(1.0 + e / wp, 1.0 - e / wp, abs(s)) * smoothstep(-e, e, P.y - hem);
    float ndv = abs(dot(n, rd));
    // shadows of the ribbons in front, softer the farther in front they hang
    float sh = 1.0;
    for (int j = k + 1; j < min(k + 3, 5); j++) {
      float gap = z - gZ[j];
      sh *= 1.0 - 0.6 * cover(j, P + L.xy / -L.z * gap * 0.55, 0.05 + 0.12 * gap);
    }
    vec3 dk, c = along(k, P.y, dk);
    float dif = sat(0.5 + 0.5 * dot(n, L)); dif *= dif;
    float thru = sat(dot(-n, B));
    float sheen = pow(sat(dot(n, normalize(L - rd))), 18.0);
    float light = exp(-pow((P.y - 0.5) / 2.1, 2.0));    // one soft light from above; they fall away into the dark below
    vec3 r = c * (0.1 + 1.15 * dif) * sh;
    r += rich(mix(c, dk * dot(c, vec3(0.33)), 0.6), 1.35) * thru * thru * 1.5 * (0.5 + 0.5 * sh);
    r += mix(c, vec3(1.0), 0.5) * sheen * 0.55 * sh;
    r += mix(c, vec3(1.0), 0.35) * fo * 0.7;
    r *= (0.2 + 1.55 * gLv[k]) * light * exp(-(z - 2.5) * 0.14);
    float a = cov * (0.62 + 0.38 * pow(1.0 - ndv, 2.0));
    col = col * (1.0 - 0.6 * a) + r * a;
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
    vec3 own = rich(uKind[k], 2.0);
    vec3 hue = mix(rich(hueShift(own, gHue[k]), 1.3), own, sat(0.5 + 0.55 * d.y - 0.3 * d.x));
    c += hue * (0.1 + 1.7 * lv) * exp(-dot(d, d) * 1.5);
  }
  return c;
}
// The floor is dark and polished: what lies under it here is the room seen in it, so everything is met twice, once upside down.
vec3 glass(vec2 p) {
  float sway = 0.5 * sin(uTime * 0.06);
  vec3 ro = vec3(sway, 0.25, 0.0);
  vec3 rd = normalize(vec3(p.x - sway * 0.08, p.y, 1.0));
  rd.yz *= rot(0.12);
  // the floor's own grain blurs what it gives back
  float low = step(rd.y * 3.0 + ro.y, -1.0);
  vec2 jit = vec2(grain(gl_FragCoord.xy + 11.0), grain(gl_FragCoord.yx + 37.0)) - 0.5;
  rd = normalize(rd + vec3(jit.x * 0.005, jit.y * 0.018, 0.0) * low);
  float t = uTime * 0.07 + uTravel * 0.02;
  vec3 bend = vec3(0.0), shine = vec3(0.0);
  float dim = 1.0, through = 0.0;
  vec3 L = normalize(vec3(-0.45, 0.5, -0.74));
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float al = 0.42 * sin(t * (1.0 + 0.23 * fk) + fk * 1.7);            // each sheet turns a little on its foot
    vec3 C = vec3((fk - 2.0) * 1.22, 0.0, 3.1 + 0.55 * mod(fk, 2.0));
    vec3 N = vec3(sin(al), 0.0, -cos(al)), T = vec3(cos(al), 0.0, sin(al));
    float tt = dot(C - ro, N) / dot(rd, N);
    vec3 Q = ro + rd * tt;
    float under = step(Q.y, -1.0);
    Q.y = abs(Q.y + 1.0) - 1.0;
    float u = dot(Q - C, T);
    float inside = step(abs(u), 0.72) * step(Q.y, 1.05) * step(0.0, tt);
    float seen = inside * mix(1.0, 0.1 + 0.5 * pow(1.0 - abs(rd.y), 6.0), under);
    through = max(through, inside);
    float go = k == 4 ? uHits : uCue;
    float dy = (Q.y - (1.2 - (1.0 - go) * 2.5)) / 0.24, fo = sqrt(go) * exp(-dy * dy);
    float ribs = 3.4 + 1.5 * fk;
    float f = fract(u * ribs + 0.45 * fo) - 0.5;
    // a rib is a little lens: it turns the ray aside, the more the nearer its edge
    bend += inside * T * (-(0.12 + 0.02 * fk) * 2.0 * f * (1.0 + 1.5 * fo));
    dim *= 1.0 - inside * (0.06 + 0.4 * smoothstep(0.3, 0.5, abs(f)));
    vec3 n = normalize(N + T * f * 1.5);
    float sp = pow(sat(dot(reflect(rd, n), L)), 26.0);
    float rim = smoothstep(0.69, 0.72, abs(u)) + smoothstep(1.02, 1.05, Q.y);   // the cut edge of the sheet catches the light
    shine += seen * (vec3(0.75, 0.85, 1.0) * sp * 0.2 + rich(uKind[k], 1.6) * (rim * (0.1 + 0.7 * gLv[k]) + fo * 0.5 * (0.5 + f)));
  }
  vec3 d2 = normalize(rd + bend);
  vec3 W = ro + d2 * ((7.5 - ro.z) / d2.z);
  float under = step(W.y, -1.0);
  W.y = abs(W.y + 1.0) - 1.0;
  return lamps(W.xy) * dim * mix(0.3, 1.0, through) * mix(1.0, 0.1 + 0.5 * pow(1.0 - abs(rd.y), 6.0), under) + shine;
}

vec3 render(vec2 p) {
  gLv = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec3 col = uVar > 0.5 ? glass(p) : cloth(p);
  vec3 c = screenOf(col);
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  float g = grain(floor(gl_FragCoord.xy / max(1.0, floor(uRes.y / 540.0 + 0.5))) + floor(uTime * 12.0) * 17.0) - 0.5;
  return c + c * g * 0.2 * (1.0 - lum);
}
