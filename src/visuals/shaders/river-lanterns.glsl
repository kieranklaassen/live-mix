// name: River lanterns
// a: Downstream
// b: From the bridge
// what: A wide dark river at night: small square paper lanterns drift away from you past low hills, each with a long wavering reflection, the near ones with slats and a raft, the far ones a bending string of points; or the same lanterns seen from a bridge, open at the top, passing between wet stones in rings of their own light.
// follows: Every lantern carries one kind of sound and warms as it plays; where the piece is loud more are lit, across for the loop and away for the room. Low swells the water and rocks them, high glints. A hit drops a ring that tips the nearest, a cue lights all, near to far. Keys brighten some, a voice spreads their light. The current follows the music.
const float rlHor = 0.25, rlSt = 0.33, rlC = 0.6, rlT = 0.185;
float rlWd; // how narrow the picture is
#define rlGone (1.0 - uHits)
float rlOff(float lo, float hi, float x) { return 1.0 - smoothstep(lo, hi, x); }
float rlIn(float w, float x) { return 1.0 - smoothstep(-w, w, x); }
// Noise on a lattice that comes round, so a long evening does not wear it out.
float rlN(vec2 p) {
  vec2 i = floor(p), f = p - i, a = mod(i, 289.0), b = mod(i + 1.0, 289.0);
  f *= f * (3.0 - 2.0 * f);
  return mix(mix(hash21(a), hash21(vec2(b.x, a.y)), f.x), mix(hash21(vec2(a.x, b.y)), hash21(b), f.x), f.y);
}
float rlK(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits; }
// Paper with a flame behind it and some of the colour of its kind.
vec3 rlPap(int k) {
  vec3 c = uKind[k]; c *= c; c /= max(max(c.r, max(c.g, c.b)), 0.05);
  return mix(vec3(1.0, 0.36, 0.075), c * vec3(1.0, 0.66, 0.5), 0.42);
}
// How brightly a lantern burns; far is 0 near and 1 far, the way a cue passes.
float rlB(int k, float h, float here, float far) {
  float breath = 0.5 + 0.5 * sin(uTime * (0.22 + 0.2 * h) + h * 40.0);
  float front = smoothstep(far - 0.3, far + 0.05, (1.0 - uCue) * 1.5) * uCue;
  return 0.36 + 0.16 * breath + (0.35 + uEnergy) * (0.8 * rlK(k) * (0.7 + 0.3 * breath) + 0.6 * here) + 1.6 * front;
}
// The middle of the stream, d below the far shore.
float rlMid(float d) { float q = sqrt(d); return rlWd * (-0.27 + 0.66 * q * sin(q * 4.3)); }
// The evening sky and three ranges of hills; e is the height over the far shore.
vec3 rlSky(float x, float e, float soft) {
  float gx = x / rlWd + 0.3, glow = exp(-gx * gx * 3.0);
  vec3 c = mix(vec3(0.026, 0.082, 0.122), vec3(0.004, 0.011, 0.038), smoothstep(0.0, 0.25, e));
  c += vec3(0.3, 0.12, 0.045) * glow * exp(-e * 19.0);
  c *= 1.0 - 0.5 * smoothstep(0.45, 0.8, noise(vec2(x * 1.4 + uTime * 0.004, e * 20.0))) * smoothstep(0.05, 0.16, e);
  if (e > 0.2) return c;
  vec3 mist = vec3(0.017, 0.043, 0.063) + vec3(0.07, 0.026, 0.01) * glow;
  float rough = 0.0075 * noise(vec2(x * 24.0, 1.0)) + 0.004 * noise(vec2(x * 83.0, 5.0));
  float y = x / rlWd;
  vec3 top = vec3(0.04 + 0.014 * sin(y * 5.3 + 0.4) + 0.008 * sin(y * 11.0), 0.012 + 0.1 * smoothstep(-0.2, 0.62, y) * (1.0 + 0.22 * sin(y * 7.0 + 1.0) + 0.1 * sin(y * 17.0)), 0.008 + 0.075 * rlOff(-0.95, -0.38, y) * (1.0 + 0.2 * sin(y * 13.0)));
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    vec3 hc = i == 0 ? vec3(0.013, 0.028, 0.044) : i == 1 ? vec3(0.004, 0.0105, 0.019) : vec3(0.002, 0.005, 0.01);
    hc = mix(mist, hc, smoothstep(-0.03, 0.085 - 0.025 * f, e));
    c = mix(c, hc, rlIn(soft, e - top[i] - rough * (0.4 + 0.6 * f)));
  }
  return c;
}
// A paper wall lit from within: u across -1 to 1, v up 0 to 1.
vec3 rlWl(float u, float v, vec3 paper, float lit, float aa, float seed) {
  float w = u * 0.55, h = (v - 0.3) * 1.1;
  float r = w * w * 1.5 + h * h, heart = exp(-r * 3.2), hot = exp(-r * 15.0);
  float fib = noise(vec2(u * 5.0, v * 30.0) + seed * 91.0) * 0.6 + noise(vec2(u * 19.0, v * 11.0) + seed * 37.0) * 0.4;
  vec3 c = mix(paper * paper * 0.7, mix(paper, vec3(1.0, 0.56, 0.2), 0.5), heart) * lit * (0.16 + 1.35 * heart) * (0.8 + 0.4 * fib) + vec3(1.0, 0.72, 0.36) * hot * lit * 1.1;
  float slat = max(rlOff(0.1 - aa * 2.0, 0.1 + aa * 2.0, 1.0 - abs(u)), rlOff(0.035 - aa, 0.035 + aa, min(v, 1.0 - v)));
  if (uVar < 0.5) slat = max(slat, 0.75 * rlOff(0.016 - aa, 0.016 + aa, abs(v - 0.68)));
  return mix(c, c * 0.22 + vec3(0.006, 0.003, 0.002), slat * rlOff(0.05, 0.22, aa));
}
// A wall seen from inside, through the open mouth.
vec3 rlIns(float u, float v, vec3 paper, float lit) {
  float h = (v - 0.2) * 1.2, heart = exp(-(u * u * 0.8 + h * h * 2.6));
  return mix(paper * paper * 0.8, mix(paper, vec3(1.0, 0.58, 0.2), 0.6), heart) * lit * (0.16 + 2.1 * heart * heart);
}
vec2 rlNr(float yaw, float sp) { return vec2(sin(yaw), -cos(yaw) * sp) * 0.105; }
vec2 rlR(float yaw, float sp) { return vec2(cos(yaw), sin(yaw) * sp) * 0.105; }
// The far edge of a lantern's square foot at x (N its near corner, R its right one).
float rlE(float x, vec2 N, vec2 R) { return x < -N.x ? mix(-R.y, -N.y, (x + R.x) / (R.x - N.x)) : mix(-N.y, R.y, (x + N.x) / (R.x + N.x)); }
// One near lantern: q from its foot, sp how far we look down on it.
void rlBox(inout vec3 c, vec2 q, float yaw, float sp, vec3 paper, float lit, float aa, float seed, float show) {
  float x = q.x;
  vec2 N = rlNr(yaw, sp), R = rlR(yaw, sp);
  // the raft
  vec2 b = vec2(x, q.y + 0.012) / 1.22;
  float lo = -rlE(-b.x, N, R), hi = rlE(b.x, N, R);
  float cov = rlIn(aa, abs(b.x) - R.x) * smoothstep(-aa, aa, b.y - lo + 0.02) * rlIn(aa, b.y - hi);
  c = mix(c, 0.004 + paper * paper * 0.2 * lit * smoothstep(-aa, aa, b.y - lo), cov * show);
  // the two walls
  bool left = x < N.x;
  float u = left ? (x + R.x) / (N.x + R.x) : (x - N.x) / (R.x - N.x);
  lo = -rlE(-x, N, R); hi = rlE(x, N, R);
  float up = q.y - lo - rlT, side = rlIn(aa, abs(x) - R.x);
  float wall = side * smoothstep(-aa, aa, q.y - lo) * rlIn(aa, up), mouth = side * smoothstep(-aa, aa, up) * rlIn(aa, q.y - hi - rlT);
  if (wall > 0.0) c = mix(c, rlWl(u * 2.0 - 1.0, (q.y - lo) / rlT, paper, lit, aa / rlT, seed) * (left ? 0.75 : 1.0), wall * show);
  // its open mouth
  if (mouth > 0.0) {
    bool far = x < -N.x;
    float uf = far ? (x + R.x) / (R.x - N.x) : (x + N.x) / (R.x + N.x), deep = hi + rlT - q.y, v = 1.0 - 1.7 * deep / rlT;
    c = mix(c, rlIns(uf * 2.0 - 1.0, v, paper, lit) * (far ? 1.0 : 0.8) * (0.2 + 0.8 * smoothstep(0.0, 0.008 + aa, min(deep, up + 0.003))), mouth * show);
  }
}
// A hit: the crest of its ring, and the light of ring and drop.
float rlCr(float z) { return (exp(-z * z) + 0.4 * exp(-(z + 2.6) * (z + 2.6))) * uHits; }
vec3 rlH(float ring, float r) { return (uKind[4] * uKind[4] + vec3(0.25, 0.2, 0.14)) * (ring + uHits * uHits * exp(-r * r)) * (0.4 + uEnergy); }
vec3 rlRiver(vec2 p) {
  float d = rlHor - p.y, px = 1.0 / uRes.y;
  if (d <= 0.0) return rlSky(p.x, -d, px * 1.2);
  d = max(d, 0.0015);
  float fl = uTravel * 0.03, S = -log(d) - fl, X = (p.x - rlMid(d)) / d;
  float swell = 0.55 + 1.1 * uLow;
  // ripples: long slow ones and short flat ones
  float n1 = rlN(vec2(X * 0.9 + uTime * 0.05, S * 9.0 - uTime * 0.06)) - 0.5;
  float n2 = rlN(vec2(X * 2.6 - uTime * 0.11, S * 25.0 - uTime * 0.1 + n1 * 3.0)) - 0.5;
  float n3 = rlN(vec2(X * 3.6 + uTime * 0.16 + 7.0, S * 58.0 - uTime * 0.17 + n1 * 5.0)) - 0.5;
  float rip = n1 * 0.5 + n2 * 0.7 * smoothstep(0.004, 0.04, d) + n3 * 0.75 * smoothstep(0.03, 0.14, d);
  // where a hit drops its ring
  vec2 at = vec2((0.16 + 0.14 * sin(uTime * 0.05)) * rlWd, 0.35 + 0.05 * cos(uTime * 0.043));
  vec2 to = vec2(p.x / d - at.x / at.y, (1.0 / d - 1.0 / at.y)) * at.y;
  float rr = length(to), z = (rr - rlGone * 0.5) * 44.0;
  float crest = rlCr(z), slope = -z * exp(-z * z * 0.7) * uHits;
  // the hills and the sky upside down
  float mir = d * 0.95 + rip * (0.03 + 0.12 * d) * swell * 1.4 + slope * 0.02;
  vec3 c = rlSky(p.x + n2 * 0.02, abs(mir) + 0.004, 0.006 + 0.025 * d) * mix(0.7, 0.3, smoothstep(0.0, 0.45, d));
  c += vec3(0.007, 0.018, 0.027) * smoothstep(0.1, 0.5, rip) * (0.25 + 0.75 * rlOff(0.1, 0.6, d)) * (0.7 + 0.8 * uHigh);
  c = mix(c, vec3(0.035, 0.05, 0.06), 0.6 * exp(-d * 110.0));
  // the lanterns, far rows first
  float L = 1.5 + 0.7 * uSpace, k0 = floor((-log(d / (1.0 + L)) - fl) / rlSt) + 1.0;
  vec3 air = vec3(0.0), hP = air; vec2 hQ = vec2(0.0); float hY = 0.0, hS = 0.1, hL = 0.0, hA = 1.0, hH = 0.0, hW = 0.0;
  for (int i = 0; i < 7; i++) {
    float k = k0 - float(i), D0 = exp(-(k * rlSt + fl));
    if (D0 > 1.15 * d / (1.0 - rlT - 0.1)) break;
    if (D0 < 0.0034) continue;
    float m = mod(k, 997.0), shift = hash11(m) * 5.0, mid = rlMid(D0);
    float cx = (p.x - mid) / D0 / rlC + shift, id = floor(cx);
    float lx = (id + 0.5 - shift) * rlC;
    float n = hash21(vec2(id + 141.0, m + 3.0));
    float dens = (0.3 + 0.65 * rlOff(0.03, 0.5, D0)) * exp(-lx * lx * 0.06) + 0.02;
    if (n > dens + 0.35) continue;
    vec2 h = vec2(fract(n * 91.7), n), g = fract(n * vec2(313.7, 47.1));
    lx += (h.x - 0.5) * 0.3 * rlC;
    float D = D0 * exp((g.x - 0.5) * 0.28), near = rlOff(0.02, 0.5, D);
    vec2 foot = vec2(mid + lx * D0, rlHor - D);
    vec4 pc = piece(vec2(foot.x / 1.78 + 0.5, sat(D / 0.75)));
    float show = max(rlOff(dens - 0.06, dens, h.y), smoothstep(0.1, 0.5, pc.a)) * smoothstep(0.0034, 0.007, D);
    if (show < 0.01) continue;
    int kd = int(g.y * 4.99);
    float burn = rlB(kd, h.x, pc.a, near * 0.9) * (1.0 - 0.25 * near) * show * (1.0 + 0.8 * uKeys * near);
    vec3 paper = rlPap(kd);
    float ph = h.x * 60.0 + g.x * 9.0, ax = at.x - foot.x;
    float tip = 4.0 * uHits * rlGone * exp(-(ax * ax * 5.0 + (D - at.y) * (D - at.y) * 16.0));
    foot.y += D * ((0.005 + 0.014 * uLow) * sin(uTime * 0.6 + ph) + 0.03 * tip * sin(ph));
    vec2 q = (p - foot) / D;
    float aa = px / D, e = 2.0 * abs(fract(cx) - 0.5), win = 1.0 - e * e * e * e;
    win *= win;
    if (win < 0.004) continue;
    // light in the air
    vec2 hq = q - vec2(0.0, 0.09);
    air += paper * burn * win * (0.15 + 0.1 * uSpace + 0.1 * uMic) * exp(-dot(hq, hq * vec2(1.0, 0.8)) * 40.0) * rlOff(0.1, 0.31, q.y);
    if (q.y < 0.02) {
      // the long reflection, broken into flat strokes further down
      float dy = max(-q.y, 0.0), t = dy / L;
      float wx = q.x + (n1 * 0.4 + n2 * 0.22) * (0.1 + dy) * swell * 0.6 + n3 * 0.05 + slope * 0.06;
      if (abs(wx) < 0.17 + aa) {
        float wide = 0.066 + 0.02 * dy, body = rlOff(wide - 0.03 - aa, wide + 0.03 + aa, abs(wx));
        float cut = smoothstep(-0.12, 0.1, rip * 0.9 + 0.4 - 0.72 * t - 0.16 * smoothstep(0.0, 0.1, dy));
        float fall = exp(-dy * 1.25) * rlOff(0.5, 1.0, t) * (0.35 + 0.65 * smoothstep(0.0, 0.07, dy)) * cut * burn * win;
        c += fall * (body * (paper * 0.55 + vec3(0.1, 0.03, 0.0)) * (0.8 + 0.4 * uTone) + vec3(1.0, 0.6, 0.24) * 0.5 * exp(-wx * wx * 380.0 - dy * 2.0));
      }
      // and the warm stain round its foot
      c += paper * burn * win * 0.22 * exp(-q.x * q.x * 22.0 - dy * 11.0) * (0.5 + rip) * rlOff(-0.08, 0.02, q.y);
    }
    if (q.y > -0.1 && q.y < 0.36) {
      float tiny = smoothstep(0.028, 0.05, aa), w2 = 0.055 + aa * 0.8; // far off, a point
      if (tiny > 0.0) {
        c += tiny * mix(paper, vec3(1.0, 0.55, 0.2), 0.45) * burn * exp(-dot(hq * vec2(1.0, 0.7), hq) / (w2 * w2)) * 1.3 * win;
      }
      if (tiny < 1.0 && abs(q.x) < 0.2) { // the nearest one here is drawn last
        q = rot(sin(uTime * 0.5 + ph * 1.7) * (0.02 + 0.06 * uLow) + 0.25 * tip * sin(ph * 2.3)) * q;
        float yaw = (g.x - 0.5) * 1.1 + 0.1 * sin(uTime * 0.13 + ph), sp = 0.08 + 0.6 * D, lo = -q.y - 0.037 - sp * 0.13;
        vec2 N = rlNr(yaw, sp), R = rlR(yaw, sp);
        if (max(abs(q.x) - R.x * (q.y < 0.02 ? 1.22 : 1.0), max(lo, q.y - rlT - rlE(q.x, N, R))) < aa) { hQ = q; hY = yaw; hS = sp; hP = paper; hL = burn * 1.15; hA = aa; hH = h.x; hW = smoothstep(0.0, 0.4, show) * (1.0 - tiny); }
      }
    }
  }
  if (hW > 0.0) rlBox(c, hQ, hY, hS, hP, hL, hA, hH, hW);
  c += air;
  return c + rlH(crest * (0.7 + 0.8 * rip) * exp(-rr * rr * 3.0), rr * 42.0);
}
// Where the stones stand along the current, and how big they are.
const vec3 rlS[5] = vec3[5](vec3(-0.3944, 0.3513, 0.17), vec3(0.3249, -0.3871, 0.2), vec3(-0.3386, -0.3129, 0.11), vec3(-0.1245, 0.3784, 0.075), vec3(0.6235, -0.3613, 0.07));
const mat2 rlM = mat2(0.9211, -0.3894, 0.3894, 0.9211);
const float rlLow = 0.8; // how much the slant shortens the water
// How far the current gives way at l from a stone, squared.
float rlRd(vec2 l, float R) {
  vec2 f = l / R; f *= f;
  float w = max(1.0 - f.x * 0.13, 0.0) * max(1.0 - f.y * 0.16, 0.0);
  return R * R * w * w;
}
// The current parts round each stone.
void rlPush(inout vec2 q, vec3 st) {
  vec2 l = q - st.xy; float w = rlRd(l, st.z + 0.045);
  if (w > 0.0) q.y += 0.5 * ((l.y < 0.0 ? -1.0 : 1.0) * sqrt(l.y * l.y + 4.0 * w) - l.y);
}
vec2 rlPart(vec2 q) { rlPush(q, rlS[0]); rlPush(q, rlS[1]); rlPush(q, rlS[2]); return q; }
vec3 rlTop(vec2 p) {
  float px = 1.2 / uRes.y, fl = uTravel * 0.014, swell = 0.6 + uLow;
  vec2 P = vec2(p.x, p.y / rlLow), q = rlM * P, sl = vec2(0.0), lane = q, sn = vec2(0.0);
  float stone = 0.0, shade = 1.0, squeeze = 0.0, dome = 0.0, grain = 0.0;
  for (int i = 0; i < 5; i++) {
    vec3 st = rlS[i]; vec2 l = q - st.xy; float R = st.z + 0.045, o2 = float(i);
    if (i < 3) { float w = rlRd(l, R); lane.y -= w * l.y / max(l.y * l.y, R * R); squeeze += w; }
    vec2 e = l * vec2(0.86, 1.1); float r = length(e);
    if (r > st.z + 0.2) continue;
    vec2 en = e / st.z; float rim = st.z * (0.94 + 0.05 * sin(en.x * 2.6 + o2 * 2.1) + 0.045 * sin(en.y * 3.1 + en.x + o2 * 4.7));
    float edge = r - rim, o = max(edge, 0.0), cov = rlIn(px, edge);
    vec2 out_ = e / max(r, 0.001);
    if (cov > stone) { stone = cov; float b = sat(r / rim); sn = out_ * b * b; dome = 1.0 - b * b; }
    // rings that leave the stone, stronger downstream
    sl += out_ * cos(o * 110.0 - uTime + o2) * rlOff(0.0, 0.2, o) * rlOff(-0.05, 0.2, o) * (0.65 + 0.35 * out_.x) * 0.8;
    shade *= 1.0 - 0.6 * rlOff(0.0, 0.06, o);
  }
  vec2 fw = q - vec2(fl * 1.1, 0.0);
  float n1 = rlN(fw * vec2(5.0, 10.0) + vec2(0.0, uTime * 0.1)) - 0.5, n2 = rlN(fw * vec2(13.0, 42.0) + n1 * 2.0 + vec2(uTime * 0.12, -uTime * 0.15)) - 0.5;
  float n3 = 0.5 * sin(fw.x * 61.0 + fw.y * 25.0 + n1 * 9.0 + uTime * 0.4) * sin(fw.y * 105.0 - fw.x * 17.0 + n2 * 7.0 + uTime * 0.5);
  sl += vec2(n2 + n3 * 0.5, n1 + n2 + n3) * swell * 0.7;
  vec2 at = vec2(0.16 * sin(uTime * 0.047), -0.12 + 0.1 * cos(uTime * 0.039)), to = P - at;
  float rr = length(to), z = (rr - rlGone * 0.4) * 60.0, tip = 4.0 * uHits * rlGone;
  if (rr > 0.001) sl -= rlM * to / rr * z * exp(-z * z * 0.6) * uHits * 1.2;
  // dark water, a little sky on it
  vec3 c = mix(vec3(0.004, 0.015, 0.02), vec3(0.002, 0.005, 0.014), smoothstep(-0.6, 0.6, p.x * 0.5 - p.y));
  float sky = dot(sl, rlM * vec2(0.2, 0.98));
  c += vec3(0.006, 0.02, 0.028) * smoothstep(0.15, 1.1, sky) * (0.25 + sat(p.y + 0.5)) * (0.8 + 0.6 * uHigh);
  c *= shade;
  // the stones: wet, dark, cool where they take the sky
  if (stone > 0.0) {
    grain = noise(q * 24.0) * 0.6 + noise(q * 85.0) * 0.4;
    float face = sat(0.35 + 0.8 * dot(sn, vec2(-0.011, 0.873)));
    vec3 sc = vec3(0.006, 0.0095, 0.014) * (0.35 + grain) * (0.25 + 2.2 * face) + vec3(0.02, 0.034, 0.045) * smoothstep(0.62, 0.8, grain) * face;
    c = mix(c, sc * (0.2 + 0.8 * smoothstep(0.0, 0.2, dome)), stone);
  }
  const float A = 0.04, CX = 0.33, CY = 0.2;
  float row0 = floor(lane.y / CY);
  vec3 lit = vec3(0.0), hP = lit; vec2 hB = vec2(0.0), hS = hB; float hCov = 0.0, hL = 0.0, hR = 0.0, hW = 0.0, hH = 0.0, wide = 0.0023 + 0.0006 * uSpace + 0.0005 * uMic;
  for (int i = 0; i < 6; i++) {
    float row = row0 + 1.0 - float(i / 2), stag = fract(row * 0.5);
    vec2 id = vec2(floor((lane.x - fl) / CX - 0.5 - stag) + 1.0 - float(i % 2), row);
    if (squeeze == 0.0 && abs((row + 0.5) * CY - lane.y) > 0.24) continue;
    float n = hash21(vec2(id.x + 5.0, id.y + 31.0));
    if (n > 0.78) continue;
    vec2 h = vec2(fract(n * 91.7), n), g = fract(n * vec2(313.7, 47.1));
    vec2 ctr = vec2((id.x + 0.5 + (h.x - 0.5) * 0.4 + stag) * CX + fl, (id.y + 0.5 + (g.x - 0.5) * 0.3) * CY), off = ctr - lane;
    if (dot(off, off) > 0.065) continue;
    ctr = rlPart(ctr);
    vec2 l = q - ctr;
    if (dot(l, l) > 0.042) continue;
    vec2 sp = ctr * rlM;
    vec4 pc = piece(vec2(sp.x / 1.78 + 0.5, 0.5 - sp.y * rlLow));
    float show = max(step(h.y, 0.4), smoothstep(0.1, 0.5, pc.a));
    if (show < 0.01) continue;
    int kd = int(g.y * 4.99);
    float ph = h.x * 60.0 + g.x * 9.0, there = smoothstep(0.0, 0.4, show);
    vec2 near = sp - at; float tp = tip * exp(-dot(near, near) * 8.0);
    ctr += vec2(sin(uTime * 0.31 + ph), cos(uTime * 0.27 + ph)) * (0.003 + 0.006 * uLow) + tp * 0.012 * vec2(sin(ph), cos(ph));
    float burn = rlB(kd, h.x, pc.a, sat(sp.y * rlLow + 0.5) * 0.9) * show * (1.0 + 0.4 * uKeys * sat(sin(ph + uTime)));
    vec3 paper = rlPap(kd);
    l = q - ctr;
    float r = length(l);
    vec2 dir = l / max(r, 0.001);
    // what it lights
    float win = rlOff(0.06, 0.2, r) * rlOff(0.04, 0.065, dot(off, off)), pool = win * wide / (r * r + 0.0012);
    float facing = dot(-dir, sl), f = sat(facing), facet = 0.16 + 1.5 * f * f;
    float glint = smoothstep(0.5, 0.9, sin(r * 150.0 - uTime * 1.2 + ph) + facing) * win * 0.5;
    float onStone = (0.1 + 1.6 * sat(dot(-dir, sn) + 0.05)) * (0.2 + 1.2 * grain);
    lit += paper * burn * mix(pool * facet + glint * (0.16 + 0.2 * uTone) * win, pool * onStone * 1.8, stone);
    // its short reflection towards the bridge
    vec2 at2 = l * rlM; float x = at2.x, y = -at2.y;
    if (y > 0.0 && y < 0.2) {
      float wx = x + (n1 + n2) * (0.01 + y * 0.25) * swell;
      lit += (paper * 0.8 + vec3(0.12, 0.05, 0.0)) * burn * 0.8 * win * rlOff(0.028, 0.05, abs(wx)) * exp(-y * 14.0) * smoothstep(-0.2, 0.15, n2 + n3 * 0.8 + 0.3 - y * 3.2) * rlOff(0.12, 0.2, y) * (1.0 - stone);
    }
    // the lantern here is drawn last
    vec2 lean = rlM * (vec2(sp.x * 0.03, 0.062 + sp.y * 0.03) + vec2(0.003, 0.002) * sin(uTime * 0.5 + ph)), mid = l - lean * 0.5;
    if (dot(mid, mid) < 0.0121) {
      mat2 m = rot(g.x * 6.0 + 0.2 * sin(uTime * 0.11 + ph) + tp * 0.3 * sin(ph * 3.0));
      vec2 b = m * l, s = m * lean, cb = abs(b - s * 0.5) - A - abs(s) * 0.5, nn = vec2(-s.y, s.x) / max(length(s), 0.001);
      float raft = rlIn(px, max(abs(b.x), abs(b.y)) - A * 1.22);
      float hull = rlIn(px, max(max(cb.x, cb.y), abs(dot(b, nn)) - A * (abs(nn.x) + abs(nn.y))));
      if (max(raft, hull) > min(hCov, 0.5)) { hCov = max(raft, hull); hB = b; hS = s; hP = paper; hL = burn; hR = raft * there; hW = hull * there; hH = h.x; }
    }
  }
  if (hCov > 0.0) {
    vec2 sd = vec2(hS.x < 0.0 ? -1.0 : 1.0, hS.y < 0.0 ? -1.0 : 1.0), aS = max(abs(hS), 0.001), e = hB * sd / aS, tn = e + A / aS, sh = smoothstep(0.0, 0.018, aS);
    float v = clamp(min(tn.x, tn.y), 0.0, 1.0);
    bool wx = tn.x < tn.y, ix = e.x - A / aS.x > e.y - A / aS.y;
    vec2 on = (hB - hS * v) / A, bt = abs(hB - hS); float rim = max(bt.x, bt.y) - A;
    vec3 body = rlWl(wx ? on.y : on.x, v, hP, hL * 1.25, px / 0.06, hH) * (wx ? 0.8 * sh.x : sh.y); // a wall seen edge on is only its slat
    // its mouth: the inner walls and the flame
    float vi = max(max(e.x - A / aS.x, e.y - A / aS.y), 0.0);
    vec2 in_ = (hB - hS * vi) / A, fv = hB - hS * 0.25;
    vec3 inner = rlIns(vi > 0.0 ? (ix ? in_.y : in_.x) : length(in_) * 0.8, vi, hP, hL * 1.1) * (ix ? 0.78 * sh.x : sh.y) + vec3(1.0, 0.74, 0.38) * hL * 2.0 * exp(-dot(fv, fv) * 5000.0);
    body = mix(body, inner, rlIn(px, rim));
    body *= 1.0 - 0.75 * rlOff(0.0022 - px, 0.0022 + px, abs(rim + 0.002));
    c = mix(mix(c, hP * hP * hL * 0.16 + 0.003, hR), body, hW);
    lit *= (1.0 - hR) * (1.0 - 0.95 * hW);
  }
  return c + lit + rlH(rlCr(z) * exp(-rr * rr * 6.0) * 0.4, rr * 39.0) * (1.0 - stone);
}
vec3 render(vec2 p) {
  rlWd = clamp(uRes.x / uRes.y / 1.78, 0.4, 1.15);
  return screenOf(uVar < 0.5 ? rlRiver(p) : rlTop(p));
}
