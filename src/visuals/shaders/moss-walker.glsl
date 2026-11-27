// name: Moss walker
// a: In the moss
// b: Ash grey
// what: A fat soft eight-legged beast in a wrinkled coat walks slowly through wet moss, the sun behind leaves like sails, drops that hold the wood upside down, red stalks with spore lanterns above; or the same beast in matt silver with bright rims on a field of pierced shells and broken blades, another rolled up asleep behind it.
// follows: Travel carries its step, the bands how high each leg lifts; in silence it stops and curls a little. Drone is its girth, pad the light, texture leaf edges or dust, phrase lifts the snout. The piece glows in leaf cells or in shells. A hit drops a drop and sends out a ring, a cue fills the drops with sun or draws a beam down, keys light lanterns or shells.
// own: 0 moonlit at -1 (b: only the rims), pale mist at 1 (b: pale ground); 1 rust autumn at -1 (b: copper), frost at 1 (b: rose beast, blue shells); 2 lean and smooth at -1, broad plates at 1; 3 seen from far off at -1, close by its head at 1; 4 a bare place at -1, a wet thicket at 1 (b: a fuller heap); 5 drawn up with its legs in at -1, reared up at 1
// an if that is stepped over whole
#define MW_IF(c) for (int go = (c) ? 1 : 0; go > 0; go--)
float mwPx, mwBase, mwBow, mwWalk, mwDoze, mwArm, mwThin, mwRear, mwTun, mwGirth, mwLen, mwSlow;
float mwNight, mwMist, mwRust, mwFrost, mwLots, mwBare;
vec4 mwHx, mwHy, mwHz, mwAx, mwAy, mwAz, mwBx, mwBy, mwBz; // the hips, the feet of the far side, of the near side
vec3 mwSn, mwSunC, mwPlain, mwM; float mwGrain; // the light, a plain leaf, the piece here, a grain
float mwSq(float x) { return x * x; }
// the beast
// The middle line of its body: x from the snout (-1) to the tail (0.8).
float mwSpine(float a) {
  float up = sat((0.45 - a) * 0.77);
  return mwBase - mwBow * a * a + mwRear * 0.75 * up * up;
}
// Where four feet stand; hung is how far each hangs in the air.
vec4 mwFoot(vec4 cs, vec4 sn, vec4 bands, vec4 hung, out vec4 fy, out vec4 fz) {
  vec4 lift = max(sn, 0.0);
  vec4 x = mwHx + vec4(-0.05, -0.05, -0.05, 0.2) + 0.15 * mwWalk * cs;
  fy = -0.58 + 0.2 * mwWalk * (0.5 + 0.7 * bands) * lift * lift;
  x = mix(x, mwHx - 0.16 - 0.04 * cs, hung);
  fy = mix(mix(fy, mwHy - 0.3, hung), mwHy - 0.15, 0.85 * mwTun);
  fz = mix(mix(vec4(0.42, 0.44, 0.44, 0.26), mwHz + 0.2, hung), mwHz + 0.1, 0.85 * mwTun);
  return mix(x, mwHx, 0.85 * mwTun);
}
void mwBegin() {
  mwDoze = 0.6 * (1.0 - smoothstep(0.02, 0.3, uLevel));
  mwLen = 1.0 - 0.1 * mwDoze - 0.24 * mwTun + 0.12 * mwThin;
  mwBase = 0.03 - 0.1 * mwDoze - 0.2 * mwTun; mwBow = 0.05 + 0.24 * mwDoze + 0.15 * mwTun;
  mwGirth = (1.0 + 0.014 * sin(TAU * uTime / 7.0) * (1.0 + uDrone) + 0.07 * uDrone) * (1.0 - 0.24 * mwThin) * (1.0 + 0.08 * mwTun + 0.04 * mwDoze);
  mwSlow = mix(0.95, 0.75, max(mwRear, 0.6 * mwArm));
  mwHx = vec4(-0.58, -0.15, 0.28, 0.68) * mwLen;
  mwHy = vec4(mwSpine(mwHx.x), mwSpine(mwHx.y), mwSpine(mwHx.z), mwSpine(mwHx.w)) - 0.2 * mwGirth;
  mwHz = vec4(0.23, 0.23, 0.23, 0.15) * mwGirth;
  vec4 ph = TAU * (fract(uTravel * 0.2) - vec4(0.0, 0.23, 0.46, 0.69)), hung = mwRear * (1.0 - smoothstep(-0.4, 0.1, mwHx)), cs = cos(ph), sn = sin(ph);
  mwAx = mwFoot(cs, sn, vec4(uBands[1], uBands[4], uBands[7], uBands[10]), hung, mwAy, mwAz);
  mwBx = mwFoot(-cs, -sn, vec4(uBands[2], uBands[5], uBands[8], uBands[12]), hung, mwBy, mwBz);
  mwSn = vec3(-0.84 * mwLen - 0.29 + 0.12 * mwTun, mwSpine(-0.84 * mwLen) + 0.18 * uPhrase - 0.05 * mwDoze + 0.015 * sin(uTime * 0.37) - 0.04, 0.0);
}
float mwFold; // how deep in a fold the last place was
float mwMap(vec3 q) {
  float a = clamp(q.x, -0.8 * mwLen, 0.64 * mwLen), sy = mwSpine(a), s = a / mwLen;
  vec3 d = q - vec3(a, sy, 0.0);
  float ld = length(d), f = (q.x / mwLen + 0.15 * d.y * (1.0 - d.y)) * 2.35 + 0.28, t = fract(f), w = 4.0 * t * (1.0 - t);
  float g = fract(3.0 * f + abs(fract(d.y * 1.6 + d.z * 0.8 + 0.5 * f) - 0.5)), v = 4.0 * g * (1.0 - g);
  float head = smoothstep(-0.94, -0.75, q.x / mwLen), big = mwSq(mwSq(1.0 - min(w * 1.3, 1.0))) * head, small = mwSq(1.0 - min(v * 1.7, 1.0)) * sat(0.85 - 1.8 * d.y) * w;
  float R = (0.26 + 0.2 * smoothstep(-0.95, -0.15, s) - 0.07 * smoothstep(0.25, 0.7, s)) * mwGirth;
  R += 0.035 * w - (0.05 - 0.025 * mwThin) * big - 0.018 * (1.0 - mwThin) * small + mwArm * 0.2 * (t - 0.5) * sat(0.6 + 2.2 * d.y) * head * (1.0 - big);
  mwFold = big + 0.35 * small;
  float b = smin(ld - R, length(q - mwSn) - 0.1 - 0.06 * sat(q.x - mwSn.x), 0.17);
  b = max(b, 0.042 - length(q - mwSn + vec3(0.105, 0.0, 0.0)));
  // the legs of this side, and the claws of the nearest
  MW_IF(q.y < sy + 0.1) {
    float z = abs(q.z), near = step(0.0, q.z);
    vec4 fx = mix(mwAx, mwBx, near), fy = mix(mwAy, mwBy, near), fz = mix(mwAz, mwBz, near);
    vec4 ax = q.x - mwHx, ay = q.y - mwHy, az = z - mwHz, bx = fx - mwHx, by = fy - mwHy, bz = fz - mwHz;
    vec4 h = sat((ax * bx + ay * by + az * bz) / (bx * bx + by * by + bz * bz + 1e-3));
    ax -= bx * h; ay -= by * h; az -= bz * h;
    vec4 l = sqrt(ax * ax + ay * ay + az * az) - 0.19 + (0.085 + 0.022 * abs(fract(h * 4.5) - 0.5)) * h + 0.045 * mwThin;
    float leg = min(min(l.x, l.y), min(l.z, l.w));
    b = smin(b, leg, 0.1);
    vec4 on = vec4(equal(l, vec4(leg)));
    float foot = dot(on, fy) / max(dot(on, vec4(1.0)), 1.0);
    b = min(b, 0.3);
    MW_IF(q.y < foot + 0.25) {
    vec3 k = vec3(q.x - dot(on, fx), q.y - dot(on, fy), z - dot(on, fz)) / max(dot(on, vec4(1.0)), 1.0), cb = vec3(0.03, -0.12, 0.06);
    k.x = abs(abs(k.x + 0.02) - 0.035);
    k -= vec3(0.0, -0.06, 0.02);
    float u = sat(dot(k, cb) / 0.0189);
    b = min(b, length(k - cb * u) - 0.018 * (1.0 - 0.6 * u));
    }
  }
  return b;
}
// What a look finds of it: how much, how open, how deep in a fold, where, how it faces.
float mwCov, mwAo, mwBig; vec3 mwQ, mwN, mwR, mwU, mwB, mwV;
void mwLook(vec2 q, float th, float ps, float pix) {
  mwR = vec3(cos(ps), 0.0, sin(ps)); mwB = vec3(-sin(ps) * cos(th), sin(th), cos(ps) * cos(th)); mwU = cross(mwB, mwR);
  vec3 ro = mwB * 6.0, rd = normalize(mwR * q.x + mwU * q.y - ro), g = vec3(0.0);
  float best = 9.0, mid = 6.0 + sin(ps) * clamp(q.x / cos(ps), -0.95, 0.95), deep = 0.62 / cos(ps), t = mid - deep, bt = t, e = max(0.007, 1.1 * pix);
  int stage = 0;
  mwV = -rd; mwCov = 0.0; mwQ = ro; mwN = -rd; mwAo = 1.0; mwBig = 0.0;
  for (int i = 0; i < 24; i++) {
    vec3 o = vec3(equal(ivec3(stage), ivec3(1, 2, 3)));
    float d = mwMap(stage == 0 ? ro + rd * t : stage < 4 ? mwQ + e * o : mwQ + mwN * 0.12);
    if (stage == 0) {
      if (d < best) { best = d; bt = t; }
      t += d * mwSlow;
      if (d < 0.5 * pix || t > mid + deep || i > 18) {
        mwCov = 1.0 - smoothstep(0.55 * pix, pix, best);
        mwQ = ro + rd * bt;
        if (mwCov <= 0.0) break;
        stage = 1;
      }
    } else if (stage < 4) {
      g += o * (d - best); mwBig += 0.33 * sat(mwFold);
      if (stage == 3) mwN = normalize(g + 1e-6);
      stage++;
    } else { mwAo = sat(0.4 + 5.0 * d); break; }
  }
}
// a: the moss
const vec2 mwSun = vec2(0.46, 0.3);
float mwGlow(vec2 p) { return exp(-length(p - mwSun) * 1.5); }
// The ring a hit sends out.
float mwRing(vec2 q) { return uHits * exp(-mwSq((length(q * vec2(1.0, 1.6)) - 0.9 * (1.0 - uHits)) / 0.22)); }
// What colour the light has come through a leaf; g how near the sun, h the leaf's own.
vec3 mwThinC(float g, float h) {
  vec3 c = mix(vec3(0.03, 0.3, 0.04), vec3(0.6, 0.74, 0.03), sat(0.1 + 0.95 * g + 0.5 * (h - 0.5)));
  c = mix(c, mix(vec3(0.3, 0.05, 0.02), vec3(0.95, 0.4, 0.04), sat(g + 0.5 * h)), mwRust);
  return mix(c, mix(vec3(0.16, 0.3, 0.38), vec3(0.75, 0.85, 0.82), sat(g + 0.4 * (h - 0.3))), 0.85 * mwFrost);
}
// A leaf from base to tip: cover, along, across (-1 to 1), half its width.
vec4 mwLeaf(vec2 p, vec2 base, vec2 tip, float bow, float W, float soft) {
  vec2 ab = tip - base; float L = length(ab); ab /= L;
  p -= base;
  float u = dot(p, ab) / L, v = dot(p, vec2(-ab.y, ab.x)) - bow * L * 4.0 * u * (1.0 - u), t = sat(u);
  float w = W * (0.5 + 2.8 * t) * (1.0 - t) * (1.0 - 0.3 * t) * (1.0 + 0.12 * uTexture * abs(fract(u * L * 55.0) - 0.5) * step(soft, 0.005));
  return vec4(sat(0.5 + 0.5 * (w - abs(v)) / soft) * step(u, 1.0), t, v / max(w, 1e-3), w);
}
// Its light: the sun from behind, the net of cells, the piece in them. l as above, L its length.
vec3 mwLeafCol(vec2 p, float g, vec4 l, float seed, float L, float fine) {
  float v = l.z * l.w / 0.0115, row = floor(v), u = l.y * L / 0.025 + 0.5 * row, h = hash21(vec2(floor(u), row) + seed);
  vec2 f = abs(vec2(fract(u), fract(v)) - 0.5);
  float wall = smoothstep(0.3, 0.46, max(f.y, f.x + f.y * 0.3)) * fine, rib = (1.0 - l.y) / (1.0 + mwSq(mwSq(l.z * l.w / 0.004)));
  float rim = smoothstep(0.8, 1.0, abs(l.z)), side = mix(0.5, 1.15, smoothstep(-0.06, 0.06, l.z)), curl = 0.6 + 0.55 * sqrt(max(1.0 - l.z * l.z, 0.0));
  vec3 thin = mwThinC(g, fract(seed * 0.39));
  vec3 c = thin * mwSunC * (0.015 + (1.1 + 0.8 * uPad) * g) * side * curl * (0.12 + 0.88 * l.y) * (1.0 + 0.4 * wall) * (0.82 + 0.36 * h * fine) * (1.0 - 0.65 * rib);
  c += thin * rim * (0.04 + 0.4 * g) * mwSunC * (0.8 + 0.8 * uTexture) + vec3(0.6, 0.75, 0.8) * mwFrost * (rim * 0.35 + 0.12 * h * wall) * (0.3 + 0.7 * mwSunC);
  return c + mwM * mwM * (1.0 - wall) * (0.25 + 0.75 * h * h) * (1.0 - smoothstep(0.1, 0.55, length(f))) * fine * (0.4 + 1.2 * uEnergy) * 1.3;
}
// A drop, the wood bent and upside down in it. q is -1 to 1, c where it lies.
vec3 mwDropCol(vec2 q, vec2 c) {
  float z = sqrt(max(1.0 - dot(q, q), 0.0));
  vec2 to = normalize(mwSun - c), s = q / (0.3 + 0.7 * z);
  float stems = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(s.x * 5.0 + 1.5 * sin(s.y * 1.5) + c.x * 30.0));
  vec3 col = mix(vec3(0.004, 0.028, 0.012), mwPlain * 0.75, sat(0.4 - 0.75 * dot(q, to)) * (0.25 + 0.75 * stems));
  col += vec3(1.0, 0.85, 0.5) * mwSunC * exp(-dot(q + to * 0.5, q + to * 0.5) * 8.0) * (0.7 + 0.6 * uPad + 2.5 * uCue);
  col *= 0.15 + 0.85 * smoothstep(0.0, 0.45, z);
  return col + vec3(1.0, 0.95, 0.85) * (1.0 - smoothstep(0.06, 0.17, length((q - to * 0.55) * vec2(1.0, 1.4)))) * (0.4 + mwSunC);
}
// The leaves: base and tip, then bow and width. Four behind the beast, three before it.
const vec4 mwA[7] = vec4[7](vec4(-0.75, -0.75, -0.36, 0.38), vec4(0.38, -0.8, 0.24, 0.46), vec4(1.12, -0.7, 0.66, 0.26), vec4(0.74, -0.8, 0.86, 0.42), vec4(-0.1, -0.78, -0.42, -0.17), vec4(0.36, -0.8, 0.06, -0.17), vec4(0.66, -0.75, 0.5, -0.12));
const vec2 mwW[7] = vec2[7](vec2(0.06, 0.22), vec2(0.07, 0.22), vec2(0.08, 0.17), vec2(-0.08, 0.2), vec2(0.13, 0.17), vec2(-0.11, 0.17), vec2(-0.1, 0.17));
// The wood behind, out of focus.
vec3 mwBack(vec2 p, float g) {
  float d = length((p - mwSun) * vec2(0.8, 1.0));
  float k = 0.2 + 1.6 * smoothstep(0.2, 0.85, mwGrain);
  vec3 c = mix(vec3(0.002, 0.016, 0.014), mix(vec3(0.1, 0.32, 0.015), vec3(0.4, 0.16, 0.03), mwRust), exp(-d * 1.9)) * k * (0.3 + 0.7 * mwSunC) * smoothstep(-1.2, 0.5, p.x + 0.6 * p.y);
  c += vec3(1.0, 0.85, 0.2) * (2.2 * exp(-d * d * 14.0) + 0.3 * exp(-d * 2.8) * k) * (0.75 + 0.5 * uPad) * mwSunC;
  c *= mix(vec3(1.0), vec3(0.65, 0.85, 1.1), mwFrost);
  c = mix(c, vec3(0.5, 0.62, 0.52) * (0.55 + 0.5 * g) * mix(vec3(1.0), vec3(1.1, 0.95, 0.85), mwRust), mwMist * 0.85);
  float tx = p.x / 0.19 + uTravel * 0.006;
  for (int k = 0; k < 2; k++) {
    float i = floor(tx - 0.5) + float(k), h = hash11(mod(i, 997.0) + 3.1), y = (p.y + 0.6) / (0.55 + 0.5 * h), x = tx - i - 0.5 - (h - 0.5) * 1.2 * y * y;
    float w = 0.66 * (1.0 - y) * (0.6 + y);
    vec3 lc = mwPlain * (0.6 + 0.8 * h) * (0.012 + 0.9 * g * g) * (0.7 + 0.4 * smoothstep(-0.1, 0.1, x));
    c = mix(c, mix(lc, c, 0.55 * mwMist), 0.8 * smoothstep(-0.14, 0.14, w - abs(x)) * (1.0 - smoothstep(0.9, 1.0, y)));
  }
  return c;
}
// The beast in its light.
vec3 mwFlesh() {
  vec3 sun = normalize(mwR * 0.6 + mwU * 0.75 - mwB * 0.3), K = normalize(-mwR * 0.5 + mwU * 0.6 + mwB * 0.7);
  vec2 sk = vec2(mwQ.x, mwQ.y - 0.6 * mwQ.z), ci = floor(sk * 15.0);
  float h = hash21(ci), grain = mwGrain, cell = (1.0 - smoothstep(0.2, 0.34, length(sk * 15.0 - ci - 0.5 - 0.3 * (vec2(h, fract(h * 57.0)) - 0.5)))) * h;
  vec3 n = normalize(mwN + 0.22 * (grain - 0.5) * vec3(1.0, 0.3, 0.3));
  float nv = sat(dot(n, mwV)), wrap = sat((dot(n, sun) + 0.4) / 1.4), key = sat(0.5 + 0.5 * dot(n, K)), low = smoothstep(-0.75, -0.15, mwQ.y);
  vec3 skin = mix(mix(vec3(0.62, 0.29, 0.13), vec3(0.7, 0.42, 0.22), grain), vec3(0.75, 0.2, 0.07), 0.7 * mwArm);
  vec3 c = skin * (vec3(1.0, 0.8, 0.45) * 2.3 * wrap * wrap * mwSunC + vec3(0.09, 0.17, 0.13) * key * key * (0.35 + 0.65 * mwSunC) * (1.0 + 2.0 * mwMist));
  c *= mwAo * (1.0 - 0.6 * mwBig) * (0.55 + 0.45 * sat(0.6 + n.y));
  c += skin * vec3(1.0, 0.28, 0.07) * (0.3 * mwBig * wrap + 0.16 * (1.0 - low)) * mwSunC;
  c += vec3(1.0, 0.82, 0.45) * mwSq(1.0 - nv) * sat(dot(n, sun) + 0.5) * 1.6 * mwSunC;
  c += vec3(0.1, 0.25, 0.03) * sat(-n.y + 0.2) * 0.35 * mwSunC;
  c += vec3(0.9, 0.95, 0.85) * mwSq(mwSq(1.0 / (1.0 + 30.0 * (1.0 - dot(n, normalize(K + mwV)))))) * (0.15 + 0.4 * uTone + 0.4 * uMic) * (1.0 - mwBig) * (0.3 + 0.7 * mwSunC);
  // store-cells in the coat
  c += cell * (1.0 - mwBig) * nv * (0.05 * skin * mwSunC + mwM * mwM * 0.5 * uEnergy);
  return c * mix(0.3, 1.0, low);
}
vec3 mwMoss(vec2 p, vec2 scr) {
  float g = mwGlow(scr), wind = sin(uTime * 0.31);
  vec2 sway = vec2((0.006 + 0.022 * mwWalk) * sin(TAU * fract(uTravel * 0.2)), (0.006 + 0.012 * uLow) * wind);
  mwPlain = mwThinC(g, 0.5) * mwSunC;
  vec3 col = vec3(0.0);
  MW_IF(mwCov < 1.0) col = mwBack(scr, g);
  // lanterns on red stalks
  for (int i = 0; i < 3; i++) {
    float x0 = i == 0 ? -0.24 : i == 1 ? 0.34 : 0.46, top = i == 0 ? 0.36 : i == 1 ? 0.41 : 0.26;
    float e0 = p.x - x0 - 0.1 * (p.y - top) * (1.0 + p.y - top) - 0.012 * (p.y + 0.5) * wind, lamp = uKeys * 1.6 + 0.9 * mwNight, has = 1.0 - mwBare;
    col = mix(col, vec3(0.42, 0.04, 0.012) * (0.1 + g) * mwSunC * (1.0 + 0.8 * clamp(e0 / 0.002, -1.0, 1.0)), (1.0 - smoothstep(0.0035, 0.0055, abs(e0))) * step(p.y, top) * has);
    vec2 cp = rot(0.8) * vec2(e0 - 0.028, p.y - top + 0.004);
    float e = length(cp / vec2(0.055, 0.026 * (1.0 - 7.0 * clamp(cp.x, -0.05, 0.06)))), lid = smoothstep(0.024, 0.03, cp.x);
    vec3 cap = mix(vec3(0.16, 0.05, 0.008), vec3(1.0, 0.5, 0.05), sat(0.5 + cp.y * 18.0)) * mix(vec3(1.0), vec3(0.4, 0.15, 0.3), lid) * (0.1 + 1.3 * g) * mwSunC;
    cap += vec3(1.0, 0.55, 0.16) * lamp * (1.0 - lid) * sat(1.0 - 0.6 * e * e);
    col += vec3(1.0, 0.5, 0.12) * 0.3 * lamp / (1.0 + e * e * e) * has;
    col = mix(col, cap, (1.0 - smoothstep(0.94, 1.06, e)) * has);
  }
  // of the leaves behind it and before it only the foremost is painted
  vec4 L = vec4(0.0), F = vec4(0.0); float id = 0.0, fid = 0.0, len = 1.0, flen = 1.0;
  for (int i = 0; i < 7; i++) {
    bool fore = i > 3;
    MW_IF(fore ? p.y < 0.0 : mwCov < 1.0) {
    vec2 base = mwA[i].xy, tip = mwA[i].zw + vec2((i % 2 == 0 ? 1.0 : -1.0) * (fore ? sway.x : sway.y), 0.0);
    vec4 l = mwLeaf(p, base, tip, mwW[i].x, mwW[i].y * (1.0 + 0.4 * mwLots - (i % 3 == 0 ? 0.0 : 0.93 * mwBare)), i < 2 ? 0.003 + 0.006 * uSpace : 1.2 * mwPx);
    if (l.x > 0.01 && fore) { F = l; fid = float(i); flen = length(tip - base); }
    if (l.x > 0.01 && !fore) { L = l; id = float(i); len = length(tip - base); }
    }
  }
  bool fore = F.x > 0.02;
  vec3 lc = vec3(0.0);
  MW_IF(max(L.x, F.x) > 0.0) lc = mwLeafCol(p, g, fore ? F : L, fore ? fid : id, fore ? flen : len, fore || id > 1.5 ? 1.0 : 0.5);
  lc *= 1.0 + 1.6 * mwRing(p - vec2(0.56, -0.28));
  col = mix(col, (fore ? mwPlain * g * 0.4 : lc) + col * 0.2, L.x);
  MW_IF(mwCov > 0.0) col = mix(col, mwFlesh(), mwCov);
  // the cushion it walks on
  float bump = abs(fract(p.x * 2.3 + 0.15) - 0.5), tuft = abs(fract(p.x * 31.0 + 3.0 * bump) - 0.5), bed = -0.395 + 0.11 * smoothstep(0.0, 0.36, p.x) + 0.1 * (0.25 - bump * bump) - p.y;
  MW_IF(bed > -0.02) {
    float n = noise(p * vec2(70.0, 45.0)), under = sat(bed * 9.0);
    vec3 bc = mwPlain * (0.1 + 0.9 * g) * (1.0 - 0.85 * under) * (0.35 + 0.9 * n) * (1.0 + 0.8 * tuft);
    col = mix(col, bc, smoothstep(-0.006, 0.006, bed - 0.022 * (1.0 - tuft) * n));
  }
  if (fore) col = mix(col, lc * 0.9 + col * 0.12, F.x);
  // drops
  vec4 dr = vec4(0.0, 0.0, 1.0, 9.0); float spot = 0.0;
  for (int i = 0; i < 5; i++) {
    vec3 d = i == 0 ? vec3(0.56, -0.28, 0.085) : i == 1 ? vec3(-0.42, -0.185, 0.03) : i == 2 ? vec3(0.06, -0.185, 0.026) : i == 3 ? vec3(0.665, 0.235, 0.034) : vec3(0.79, 0.4, 0.035);
    d.z *= 1.0 - mwBare + 0.7 * mwLots;
    if (i == 3) d.xy += vec2(0.008, -0.12) * (0.5 - 0.5 * cos(uTime * 0.06));
    if (i == 4) { float fall = 1.0 - uHits; d.y -= 0.8 * fall * fall; d.z *= smoothstep(0.0, 0.3, uHits); }
    float k = length(p - d.xy) / max(d.z, 1e-3);
    if (k < dr.w) dr = vec4(d, k);
    MW_IF(uCue > 0.0) {
    vec2 off = (p - d.xy + d.z * vec2(0.9, 1.1)) / (2.0 * d.z + 1e-3);
    spot += 1.0 / (1.0 + mwSq(1.5 * dot(off, off)));
    }
  }
  col += col * spot * uCue * vec3(3.0, 2.4, 1.2);
  MW_IF(dr.w < 1.0) col = mix(col, mwDropCol((p - dr.xy) / max(dr.z, 1e-3), dr.xy), 1.0 - smoothstep(1.0 - 3.0 * mwPx / max(dr.z, 1e-3), 1.0, dr.w));
  // a dark leaf close to the eye
  vec4 l = mwLeaf(p, vec2(-1.22, -0.8), vec2(-0.62, 0.6), -0.1, 0.22, 0.04);
  col = mix(col, vec3(0.002, 0.009, 0.005) + mwPlain * 0.2 * smoothstep(0.2, 1.0, -l.z), l.x);
  return screenOf(max(col * 1.3 - 0.004, 0.0));
}
// b: ash grey
// The nearest shells behind the beast and before it.
vec3 mwS1, mwS2, mwI1, mwI2;
void mwHeap(vec2 p) {
  mwS1 = mwS2 = vec3(0.0, 0.0, 1.0); mwI1 = mwI2 = vec3(0.0);
  for (int j = 0; j < 8; j++) {
    float row = float(j), f = row / 7.0, cw = mix(0.05, 0.3, f * f), y = (p.y - mix(0.15, -0.45, f)) / cw, x = p.x / cw + 7.3 * row;
    MW_IF(abs(y) < 0.92 && (j > 5 || mwCov < 1.0)) for (int k = 0; k < 2; k++) {
      float i = floor(x - 0.5) + float(k), h = hash21(vec2(i, row + 0.5)), h2 = fract(h * 57.3), r = 0.3 + 0.27 * h * h + 0.1 * mwLots;
      r *= smoothstep(0.0, 0.3, h2 * 0.97 + 0.3 - 1.25 * mwBare);
      vec2 q = vec2(x - i - 0.5 - 0.35 * (h2 - 0.5), y - 0.6 * (fract(h * 91.0) - 0.5)) / max(r, 1e-3);
      float a = 1.0 - smoothstep(1.0 - 3.0 * mwPx / (cw * max(r, 1e-3)), 1.0, length(q));
      if (a > 0.0 && j < 6) { mwI1 = vec3(max(a, mwI1.x), f, h); mwS1 = vec3(q, r * cw); }
      if (a > 0.0 && j > 5) { mwI2 = vec3(max(a, mwI2.x), f, h); mwS2 = vec3(q, r * cw); }
    }
  }
}
vec3 mwShell(vec3 S, float seed) {
  vec2 q = S.xy;
  float z = sqrt(1.0 - min(dot(q, q), 1.0)), id = fract(seed * 31.7);
  vec3 n = vec3(q, z);
  // some are broken open
  vec3 way = normalize(vec3(6.0 * id - 1.0, 0.75, 0.8));
  float open = step(id, 0.3) * smoothstep(0.57, 0.6, dot(n, way) + 0.1 * abs(fract(q.x * 2.3 + 2.0 * abs(fract(q.y * 1.7) - 0.5)) - 0.5) - 0.025);
  vec3 s = mix(n, vec3(q, -z), open), o = id > 0.6 ? s.yxz : s;
  o.xy = rot(0.5) * o.xy; o.yz = rot(0.8) * o.yz;
  float N = 7.0 + floor(6.0 * id), la = asin(clamp(o.y, -1.0, 1.0)) / PI * N, lr = floor(la), cnt = max(floor(2.0 * N * (1.0 - 4.0 * mwSq((lr + 0.5) / N))), 3.0);
  float lo = (atan(o.z, o.x + 1e-5) / TAU + 0.5) * cnt, hd = length(vec2(fract(lo), fract(la)) - 0.5);
  float hole = (1.0 - smoothstep(0.28, 0.36, hd)), fine = smoothstep(0.012, 0.035, S.z) * smoothstep(0.05, 0.4, z);
  float light = 0.2 + 0.42 * sat(dot(n, vec3(-0.5, 0.6, 0.6))) + 0.7 * mwSq(1.0 - z);
  light = mix(light, 0.05 + 0.2 * sat(dot(s, vec3(0.5, -0.6, -0.6))), open);
  light *= 1.0 - 0.88 * hole * fine;
  light *= 0.12 + 0.88 * smoothstep(-1.0, 0.4, q.y);
  return vec3(light) + (mwM * max(mwM.r, max(mwM.g, mwM.b)) * (0.4 + uEnergy) + vec3(1.0, 0.9, 0.7) * uKeys * 0.4 * step(0.5, id)) * hole * fine;
}
// How electrons show a surface: lit from the left, how it faces us, how deep in a fold.
float mwSem(float lit, float nv, float deep) {
  return (mix(mix(0.07, 0.02, mwNight), 0.5, mwMist) + mix(0.34, 0.05, mwNight) * lit + mix(0.65 + 0.3 * uTone, -0.45, mwMist) * mwSq(1.0 - nv)) * (1.0 - 0.65 * deep);
}
vec3 mwAsh(vec2 p, vec2 scr) {
  vec3 fog = vec3(mix(0.01, 0.52, mwMist)), col = fog;
  vec3 tb = mix(mix(vec3(1.0), vec3(1.2, 0.85, 0.55), mwRust), vec3(1.2, 0.78, 0.6), mwFrost), ts = mix(mix(vec3(0.96, 1.0, 1.03), vec3(1.1, 0.72, 0.45), mwRust), vec3(0.55, 0.95, 1.1), mwFrost);
  float near = (1.0 - smoothstep(-0.5, 0.22, p.y));
  col += (0.05 + 0.1 * uTexture) * near * mwGrain * ts;
  mwHeap(p);
  bool fore = mwI2.x > 0.0;
  vec3 sh = vec3(0.0);
  MW_IF(max(mwI1.x, mwI2.x) > 0.0) sh = mwShell(fore ? mwS2 : mwS1, fore ? mwI2.z : mwI1.z) * ts * (1.0 + 2.2 * mwRing(p + vec2(0.1, 0.3)));
  float dep = smoothstep(-0.1 - 0.1 * uSpace, 0.95, mwI1.y) * (0.8 + 0.5 * uPad);
  col = mix(col, mix(fog, (fore ? vec3(0.06) : sh) * 0.8, sat(dep)), mwI1.x);
  // one more, rolled up asleep
  vec2 e = rot(-0.25) * (p - vec2(0.64, 0.06)) / (vec2(0.125, 0.08) * (1.0 + 0.012 * sin(uTime * 0.6)));
  e.y *= 1.0 - 0.06 * cos(e.x * 9.0);
  float ez = sqrt(max(1.0 - dot(e, e), 0.0)), et = fract(e.x * 2.2 / sqrt(1.0 - 0.35 * min(e.y * e.y, 1.0)) + 0.3), ew = 4.0 * et * (1.0 - et);
  col = mix(col, mix(fog, tb * mwSem(sat(dot(vec3(e.x + 0.5 * (et - 0.5), e.y, ez), vec3(-0.55, 0.6, 0.5))), ez, mwSq(1.0 - min(ew * 1.6, 1.0))) * smoothstep(-1.0, 0.1, e.y), 0.5), 1.0 - smoothstep(1.0 - 25.0 * mwPx, 1.0, dot(e, e)));
  // broken blades
  for (int i = 0; i < 3; i++) {
    vec4 ab = i == 0 ? vec4(-0.62, -0.22, -0.8, 0.12) : i == 1 ? vec4(0.8, -0.2, 0.42, 0.03) : vec4(0.36, -0.62, 0.84, -0.27);
    MW_IF(i == 2 && mwCov > 0.0) {
      float g = mwSem(sat(dot(mwN, normalize(-mwR * 0.6 + mwU * 0.6 + mwB * 0.5))), sat(dot(mwN, mwV)), mwBig) * mwAo;
      g *= 0.86 + 0.28 * mwGrain;
      col = mix(col, tb * g * mix(0.35, 1.0, smoothstep(-0.7, -0.2, mwQ.y)), mwCov);
    }
    vec2 dir = ab.zw - ab.xy; float L = length(dir); dir /= L;
    float u = dot(p - ab.xy, dir) / L, v = dot(p - ab.xy, vec2(-dir.y, dir.x)), w = (i < 2 ? 0.022 : 0.034) * (1.0 - 0.35 * u), x = v / max(w, 1e-3);
    float end = 1.0 - 0.06 * abs(fract(x * 0.7 + 0.3 * float(i)) - 0.5) * 2.0 - 0.05 * x, px = 1.2 * mwPx;
    float g = (i < 2 ? 0.2 : 0.34) * (0.5 + 0.5 * x * x + 0.35 * abs(fract(u * L * 45.0) - 0.5)) * (0.5 + 0.5 * u) + 0.3 * (1.0 - smoothstep(0.0, 0.03, end - u)) + 0.14 * smoothstep(0.75, 1.0, abs(x));
    col = mix(col, ts * mix(g, 0.4 + 0.6 * g, mwMist), smoothstep(-px, px, w - abs(v)) * smoothstep(-px, px, (end - u) * L) * step(0.0, u) * (1.0 - mwBare));
  }
  if (fore) col = mix(col, sh * 0.55, mwI2.x);
  // a cue draws the beam down once more
  col *= 1.0 + 1.8 * uCue * exp(-mwSq((scr.y - 0.72 * uCue + 0.55) / 0.1));
  return pow(sat(col), vec3(0.72));
}
vec3 render(vec2 p) {
  mwNight = sat(-uOwn[0]); mwMist = sat(uOwn[0]); mwRust = sat(-uOwn[1]); mwFrost = sat(uOwn[1]);
  mwArm = sat(uOwn[2]); mwThin = sat(-uOwn[2]); mwBare = sat(-uOwn[4]); mwLots = sat(uOwn[4]); mwRear = sat(uOwn[5]); mwTun = sat(-uOwn[5]);
  mwSunC = mix(vec3(1.0), vec3(0.13, 0.28, 0.62), mwNight);
  mwWalk = smoothstep(0.04, 0.4, uLevel);
  bool a = uVar < 0.5;
  // how near we stand
  float z = exp2(uOwn[3] > 0.0 ? 0.6 * uOwn[3] : 0.7 * uOwn[3]) * clamp(uRes.x / uRes.y / 1.3, 0.5, 1.0);
  vec2 s = p / z + (z > 1.0 ? vec2(-0.7, -0.02) : vec2(0.0, -0.48)) * (1.0 - 1.0 / z) + vec2(0.0, 0.1 * mwRear);
  mwPx = 1.0 / (uRes.y * z);
  float S = a ? 2.35 : 2.1;
  vec2 q = (s - (a ? vec2(-0.02, -0.035) : vec2(0.0, 0.01))) * S;
  mwCov = 0.0;
  float over = 0.75 * mwRear * (1.0 - smoothstep(-0.4, 0.6, q.x));
  MW_IF(length(vec2(max(abs(q.x + 0.08) - (a ? 0.75 : 0.45), 0.0), q.y < 0.0 ? q.y * (a ? 0.6 : 0.5) : max(q.y - over, 0.0))) < 0.6 + 0.15 * mwArm) {
    mwBegin();
    mwLook(q, a ? 0.12 : 0.3, a ? 0.5 : 0.95, 1.5 * mwPx * S);
  }
  mwM = piece(vec2(0.5 + s.x / 1.7, 0.5 - s.y)).rgb;
  mwGrain = noise(mwCov > 0.5 ? vec2(mwQ.x, mwQ.y - 0.6 * mwQ.z) * vec2(90.0, 65.0) : a ? rot(0.35) * p * vec2(3.4, 1.9) + vec2(uTravel * 0.004, 2.0) : rot(0.6) * vec2(s.x, s.y * 1.8) * 90.0);
  vec3 c = vec3(0.0);
  MW_IF(a) c = mwMoss(s, p);
  MW_IF(!a) c = mwAsh(s, p);
  return c;
}
