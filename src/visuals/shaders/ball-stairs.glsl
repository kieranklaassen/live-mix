// name: Ball stairs
// a: Slow flood
// b: Swimming bath
// what: A white staircase curves down from a bright opening, and a slow flood of matte balls comes down it, heaped deep at the turn and barred with shade, a gold ball on top, the nearest out of focus; or an empty swimming bath under long windows, full of balls to the brim, with a board over it and a red ring lying among them.
// follows: The drone deepens the heap, the pad lifts the skylight, a phrase sends swells through, texture specks the balls; each kind swells its own colour. Low, middle and high lift it left, middle and right, the piece tints it. Travel pours it; the loop moves the gold ball. A hit nudges a ring of balls, a cue rolls light through and lifts the gold, keys glow.
// own: 0 small balls at -1, great ones at 1; 1 moonlight at -1, a low golden sun at 1; 2 all the balls chalk white at -1, sorted into bands of one colour at 1; 3 a low heap on bare steps or the bath sunk low at -1, deeper at 1; 4 seen from low at -1, from high above at 1; 5 walls of rose plaster at -1, of deep green at 1; 6 out of doors under an open sky, the walls gone, at -1, a shut dark room with one lamp over the heap at 1; 7 every ball lit from inside like a lamp at -1, flat worn stones in place of balls at 1; with 6 or 7 the balls are dyed in the sounds' own colours
const float BS_R = 6.0, BS_HALF = 1.9, BS_SLOPE = 0.42, BS_TOP = 7.6, BS_RUN = 0.4;
#define BS_WHEN(x) for (int go = (x) ? 0 : 1; go < 1; go++)
#define BS_OUT sat(-uOwn[6])
#define BS_ONE sat(uOwn[6])
#define BS_GLOW sat(-uOwn[7])
#define BS_FLAT sat(uOwn[7])
#define BS_DYE sat(3.0 * max(abs(uOwn[6]), abs(uOwn[7])))
const mat2 BS_TURN = mat2(0.5, -0.8660254, 0.8660254, 0.5);
bool bsBath;
float bsA, bsPx, bsFlow, bsAmt; // a cell of the heap, a pixel, how far it has slid, how deep it lies
vec4 bsW1, bsW2, bsW3, bsW4;
vec3 bsSun, bsKey, bsSky, bsAir, bsWall; // toward the sun, its colour, fill, far air, walls
vec3 bsRay;
vec3 bsPaint[5]; // the five colours
vec4 bsC[10]; // the balls about a pixel: middle and size
vec4 bsGold; vec3 bsBump; // the gold ball; where a hit falls, how high it nudges
bool bsPast, bsRide; // the ray only grazed the heap, it meets the gold ball
float bsStep(float a, float b, float x) { return smoothstep(0.0, 1.0, (x - a) / (b - a)); }
float bsIn(float e, float d) { return sat(0.5 - 0.5 * d / e); }
float bsE(float d, float b) { return sat(0.5 + 0.5 * d / b); }
vec4 bsHash(vec2 p) {
  vec4 q = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); q += dot(q, q.wzxy + 33.33);
  return fract((q.xxyz + q.yzzw) * q.zywx);
}
float bsGrey(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec3 bsRich(vec3 c, float k) { return max(mix(vec3(bsGrey(c)), c, k), 0.0); }
float bsNose(float l) { return BS_SLOPE * min(l, BS_TOP); }
// How deep the heap lies: under 0 the floor is bare.
float bsDeep(vec2 w) {
  vec4 s = fract((w.y * bsW1 + w.x * bsW2 + bsW3) / TAU) * 2.0 - 1.0; s *= 4.0 * (abs(s) - 1.0);
  float d = bsAmt + dot(s.xyz, bsW4.xyz) + bsW4.w * dot(max(1.0 - abs(w.x * (bsBath ? 0.5 : 1.2) - vec3(-1.6, 0.0, 1.6)) * 0.6, 0.0), vec3(uLow, uMid, uHigh)), k = w.y - 1.2;
  if (bsBath) return d;
  float x = (w.x - 0.1 - 0.3 * s.w) / mix(1.95, 1.2, smoothstep(1.5, 6.0, w.y));
  d += 0.45 / (1.0 + 0.16 * k * k);
  return d > 0.0 ? d * (1.05 - x * x) : d;
}
float bsOver(float d, float l) { return bsBath ? d : bsNose(l) + 0.5 * (d + sqrt(d * d + 0.05)); }
float bsTop(vec2 w) { return bsOver(bsDeep(w), w.y); }
// How much sun reaches a place: between the balusters of a window in a, through the long windows in b.
float bsLight(vec3 w, float soft) {
  float lit1 = 1.0;
  if (uOwn[6] > 0.0) {
    vec2 f = (w.xz - (bsBath ? vec2(0.1, 4.4) : vec2(-0.1, -0.9))) * (bsBath ? 0.42 : 0.62);
    lit1 = exp(-dot(f, f) * dot(f, f)) * sat(1.4 - 0.3 * max(w.y, 0.0)) + 0.06;
  }
  float run = w.x + (bsBath ? 6.5 : BS_HALF), b = 0.02 + 0.018 * run + soft;
  if (bsBath) {
    float hi = w.y + run * 0.89, z = w.z - run * 0.42 + 0.6, f = abs(fract(z / 2.6) - 0.5) * 2.6;
    vec2 k = vec2(w.x - 1.13 * (1.0 - w.y) - 0.78, w.z - 0.48 * (1.0 - w.y) - 2.3);
    float board = max(abs(k.x) - 0.34, k.y);
    float was = bsE(0.85 - f, b) * bsE(abs(hi - 3.4) - 0.07, b) * bsE(f - 0.05, b)
      * bsE(hi - 1.2, b) * bsE(7.5 - hi, b) * bsE(board, 0.09);
    if (uOwn[6] < 0.0) was = mix(was, bsE(board, 0.09), BS_OUT);
    return uOwn[6] > 0.0 ? mix(was, lit1, BS_ONE) : was;
  }
  float l = w.z + 0.5 * run + 0.35 * (w.y - bsNose(w.z));
  float f = abs(fract(l / 0.88) - 0.5) * 0.88, f2 = abs(fract(l / 5.28 + 0.3) - 0.5) * 5.28;
  float was = bsE(f - 0.13, b) * bsE(1.75 - f2, 0.1);
  if (uOwn[6] < 0.0) was = mix(was, 0.9 + 0.1 * was, BS_OUT);
  return uOwn[6] > 0.0 ? mix(was, lit1, BS_ONE) : was;
}
// Open air: the sky along a ray, and under the horizon a wide still water.
vec3 bsOpen(vec3 rd) {
  float night = sat(-uOwn[1]), gold = sat(uOwn[1]), y = rd.y - 0.02;
  vec3 low = mix(mix(vec3(0.95, 0.98, 1.0), vec3(0.07, 0.11, 0.22), night), vec3(1.7, 0.95, 0.55), gold);
  vec3 top = mix(mix(vec3(0.18, 0.38, 0.72), vec3(0.004, 0.008, 0.024), night), vec3(0.4, 0.34, 0.55), gold);
  vec2 q = rd.xz / (abs(y) + 0.16);
  vec3 c = mix(top, low, exp(-abs(y) * 4.2));
  float cl = noise(q * 0.9 + vec2(uTime * 0.012, 0.0)) * 0.55 + noise(q * 2.1 + 5.0 + vec2(uTime * 0.016, 0.0)) * 0.3 + noise(q * 4.7) * 0.15;
  cl = smoothstep(0.46, 0.8, cl + 0.06 * uPad);
  if (y > 0.0) {
    c = mix(c, low * 1.05 + 0.1 * bsKey, cl * 0.75 * (1.0 - 0.6 * night));
    vec2 g = rd.xy / max(rd.z + 1.2, 0.2) * 38.0, f = fract(g) - 0.5; float st = hash21(floor(g));
    c += night * vec3(0.8, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.16, length(f))) * step(0.86, st) * (0.5 + 0.5 * sin(uTime * 0.7 + st * 90.0)) * 1.4 * sat(y * 5.0);
  } else {
    float l = noise(vec2(rd.x * 3.0, uTime * 0.05) + vec2(0.0, 1.5 / max(-y, 0.02)));
    c = mix(low * 0.75, top * 0.8 + vec3(0.0, 0.03, 0.03), sat(-y * 5.0)) * (0.82 + 0.3 * l);
  }
  return c;
}
vec3 bsAxis(vec4 h) { return normalize(vec3(h.x - 0.5, 0.75, h.y - 0.5)); }
vec3 bsDye(float k) { return k < 1.0 ? bsPaint[0] : k < 2.0 ? bsPaint[1] : k < 3.0 ? bsPaint[2] : k < 4.0 ? bsPaint[3] : bsPaint[4]; }
// One ball where the ray meets it, lit past its neighbours.
vec3 bsShade(vec4 ball, vec4 h, bool gold, vec3 q, vec3 w, vec4 pc) {
  vec3 n = (q - ball.xyz) / max(ball.w, 1e-3), alb = vec3(0.95, 0.58, 0.1);
  if (!gold) {
    float m = 0.86 + 0.28 * fract(h.x * 31.7), run = mod(bsBath ? w.z / 2.6 : w.z / 2.2 + 0.4 * w.x, 5.0), white = sat(-uOwn[2]);
    vec3 sorted = mix(bsDye(run), bsDye(mod(run + 1.0, 5.0)), smoothstep(0.7, 1.0, fract(run)));
    alb = mix(bsDye(h.z * 5.0), sorted, sat(uOwn[2])) * m;
    vec3 tint = pc.rgb / max(max(pc.r, max(pc.g, pc.b)), 0.001);
    alb = mix(alb, bsRich(tint, 1.4) * 0.75, 0.6 * sat(pc.a * 1.4) * step(0.6, fract(h.y * 5.7)));
    alb = mix(alb, vec3(0.86, 0.83, 0.77) * m, 0.94 * white);
    vec3 sp = n * 6.0 + h.xyz * 9.0;
    alb *= 1.0 - 0.65 * bsStep(0.32, 0.2, length(fract(sp) - 0.5)) * step(0.55, hash31(floor(sp))) * sat(uTexture * 1.4) * (abs(h.z - 0.5) < 0.1 ? 1.0 : 0.2);
  }
  if (uOwn[7] > 0.0 && !gold) {
    vec3 a = bsAxis(h); float k = 1.0 - 0.52 * BS_FLAT; n += (1.0 / (k * k) - 1.0) * a * dot(a, n); n /= max(length(n), 1e-3);
    float vein = abs(dot(n, vec3(h.w - 0.5, 0.5 - h.x, h.z)) + 0.25 * noise(n * 3.0 + h.xyz * 9.0) - 0.25 * h.w);
    alb *= 1.0 - BS_FLAT * (0.4 * noise(n * 7.0 + h.xyz * 7.0) - 0.12); alb = mix(alb, vec3(0.8, 0.78, 0.74), BS_FLAT * 0.6 * bsStep(0.05, 0.01, vein) * step(0.62, h.w));
  }
  vec3 back = vec3(0.0);
  float sh = 1.0, ao = 1.0;
  for (int i = 0; i < 10; i++) {
    vec4 c = bsC[i]; vec3 v = c.xyz - q; float r = c.w, b = dot(v, bsSun), l2 = max(dot(v, v), 1e-5), on = r < 0.01 || distance(c.xyz, ball.xyz) < 1e-3 ? 0.0 : 1.0;
    float d = sqrt(max(l2 - b * b, 0.0)) - r;
    sh *= 1.0 - 0.9 * on * sat(0.58 - 1.6 * d / max(r, 0.01)) * sat(0.3 + 1.4 * b / max(r, 0.01));
    float f = on * sat(0.15 + 0.85 * dot(n, v) * inversesqrt(l2)) * r * r / max(l2, r * r + 1e-5);
    ao *= 1.0 - 0.6 * f;
    back += f * (0.5 * alb + 0.22);
  }
  float sun = bsLight(w, 0.0) * sh * smoothstep(-0.1, 1.0, dot(n, bsSun));
  vec3 c = alb * (1.55 * bsKey * sun + 0.58 * bsSky * (0.55 + 0.45 * n.y) * ao * mix(1.0, ao, 0.6) + back * (0.07 * bsKey + 0.25 * bsSky) * ao);
  if (uOwn[7] < 0.0 && !gold) {
    float own = 0.3 + 1.5 * fract(h.x * 5.3) * fract(h.w * 9.1 + 0.3), vi = sat(-dot(n, bsRay));
    float hear = h.z < 0.2 ? uDrone : h.z < 0.4 ? uPad : h.z < 0.6 ? uTexture : h.z < 0.8 ? uPhrase : uHits;
    vec3 lamp = bsRich(alb, 1.5) * (0.25 + 1.3 * vi * vi) + vec3(0.9, 0.75, 0.5) * 0.28 * pow(vi, 4.0) + back * 0.35;
    c = mix(c, c * 0.35 + lamp * own * (1.9 + 1.0 * hear), BS_GLOW);
  }
  float g = length(w.xz - bsBump.xy), ring = g - (1.0 - uHits) * 2.2, roll = (bsBath ? w.z : w.z + 4.0) / 13.0 - 0.85 * uCue;
  c += (alb + 0.12) * (0.4 + 0.6 * n.y) * (uHits * exp(-ring * ring * 9.0) * 1.5 * bsStep(3.0, 1.0, g) + uCue * 2.2 * exp(-roll * roll * 50.0));
  if (gold) return c + vec3(0.9, 0.62, 0.2) * pow(sat(dot(n, normalize(bsSun + vec3(0.0, 0.3, -0.8)))), 12.0) * 0.6 + alb * (0.08 + 0.5 * uCue + 0.9 * BS_GLOW * (0.4 - 0.6 * dot(n, bsRay)));
  return c + alb * step(0.9, fract(h.y * 13.1)) * uKeys * (0.5 + 0.5 * n.y);
}
// The heap under a ray that has come to w; rd is in that place's own frame, s its scale.
vec4 bsHeap(vec3 rd, vec3 w, float s, float px, vec4 pc) {
  float den = min(rd.y - (bsBath ? 0.0 : ((w.z > BS_TOP ? 0.0 : BS_SLOPE * rd.z) - 0.5 * min(w.x, 0.0) * rd.x) / s), -0.22), t = (bsTop(w.xz) - 0.2 * bsA - w.y) / den, col = 0.0, off = 0.0;
  bsRay = rd;
  if (bsRide) t = 0.0;
  vec3 o = vec3(w.xz + rd.xz * t / s, w.y + rd.y * t);
  if (!bsRide) { t = clamp((bsTop(o.xy) - 0.15 * bsA - o.z) / den, -0.3, 0.3); o += vec3(rd.xz * t / s, rd.y * t); }
  vec2 lo = bsBath ? vec2(-4.0, 0.0) : vec2(-9.0), hi = bsBath ? vec2(4.0, 13.0) : vec2(1.66, 99.0), cell = clamp(o.xy, lo, hi - 0.06) / bsA;
  vec4 c1 = vec4(0.0), h1 = c1, h2 = c1, acc = c1; float t1 = 1e5, t2 = 1e5, f1 = 0.0; bool g1 = false, two = false;
  for (int i = 0; i < 10; i++) {
    vec4 ball, h = vec4(0.3);
    if (i == 9) ball = vec4(bsGold.x - o.x, bsGold.z - o.z, bsGold.y - o.y, bsGold.w) * vec4(s, 1.0, s, 1.0);
    else {
      if (i % 3 == 0) { col = floor(cell.x) + float(i / 3) - 1.0; off = fract(col * 0.618 + 0.3 * fract(col * 0.37)); }
      float row = floor(cell.y + bsFlow + off) + float(i % 3) - 1.0;
      h = bsHash(vec2(col + 100.0, mod(row, 256.0)));
      vec2 at = (vec2(col, row - off - bsFlow) + 0.5 + 0.44 * (h.xy - 0.5)) * bsA, b = max(at - hi, lo - at); float k = h.z * 5.0;
      float r = bsA * (0.44 + 0.18 * h.w * h.w) * (1.0 + 0.14 * (k < 1.0 ? uDrone : k < 2.0 ? uPad : k < 3.0 ? uTexture : k < 4.0 ? uPhrase : uHits));
      r *= bsStep(0.7 * r, 0.0, max(b.x, b.y)); at = clamp(at, lo + r, hi - r); b = at - bsBump.xy;
      float deep = bsDeep(at), y = bsOver(deep, at.y) - 0.35 * bsA - o.z + (r - 0.46 * bsA) * 0.4 + bsA * 0.2 * (fract(h.x * 7.3) - 0.5) + bsBump.z * max(1.0 - dot(b, b) * 3.0, 0.0);
      if (!bsBath) r *= smoothstep(0.02, 0.2, deep + 0.3 * (h.w - 0.5));
      at = (at - o.xy) * s; ball = vec4(at.x, y, at.y, r * s);
    }
    bsC[i] = ball;
    float b = dot(ball.xyz, rd), d2 = dot(ball.xyz, ball.xyz) - b * b, aa = 1.0;
    if (uOwn[7] > 0.0 && i < 9) {
      vec3 a = bsAxis(h); float k = 1.0 / (1.0 - 0.52 * BS_FLAT) - 1.0; vec3 cc = ball.xyz + k * a * dot(a, ball.xyz), dd = rd + k * a * dot(a, rd);
      aa = dot(dd, dd); b = dot(cc, dd) / aa; d2 = dot(cc, cc) - b * b * aa; ball.w *= 1.0 + 0.22 * BS_FLAT;
    }
    float cov = ball.w < 0.01 || (i == 9 && !bsRide) ? 0.0 : sat((ball.w - sqrt(max(d2, 0.0))) / px + 0.5), th = b - sqrt(max(ball.w * ball.w - d2, 0.0) / aa);
    if (cov > 0.0 && th < t1) {
      if (f1 > 0.5) { t2 = t1; h2 = h1; two = true; }
      t1 = th; c1 = ball; h1 = h; g1 = i == 9; f1 = cov;
    } else if (cov > 0.5 && th < t2) { t2 = th; h2 = h; two = true; }
  }
  BS_WHEN(f1 > 0.0) {
    vec3 q = rd * t1; acc = vec4(bsShade(c1, h1, g1, q, vec3(o.x + q.x / s, o.z + q.y, o.y + q.z / s), pc), 1.0) * f1;
    if (two) acc += vec4(mix(acc.rgb / f1, bsDye(h2.z * 5.0) * 0.4 * bsSky, 0.4), 1.0) * (1.0 - f1); // the ball behind, seen past its rim
  }
  vec3 on = w + vec3(rd.x / s, rd.y, rd.z / s) * 0.9;
  bsPast = !bsBath && acc.a < 0.98 && (w.x > 1.6 || on.y > bsTop(on.xz) - 0.1);
  if (uOwn[6] < 0.0 && w.x < -0.35 && w.z < 1.0) bsPast = false;
  return acc;
}
// How far along a ray a ball is met, 1e5 when it is not.
float bsMeet(vec3 v, vec3 rd, float r) { float b = dot(v, rd), q = r * r - dot(v, v) + b * b; return q > 0.0 ? b - sqrt(q) : 1e5; }
float bsAlong(vec3 p) { vec2 q = BS_TURN * vec2(p.x + BS_R, p.z); return BS_R * (atan(q.y, q.x) + PI / 3.0); }
vec2 bsPlace(vec3 p, out float rho) { rho = length(vec2(p.x + BS_R, p.z)); return vec2(2.0 * BS_R * (rho - BS_R) / (rho + BS_R), bsAlong(p)); }
vec3 render(vec2 p) {
  bsBath = uVar > 0.5; bsPast = bsRide = false;
  bsA = 0.33 * exp2(0.75 * uOwn[0]); bsPx = 1.0 / (uRes.y * 1.25);
  float night = sat(-uOwn[1]), gold = sat(uOwn[1]), o3 = uOwn[3], v = uOwn[4], jump = 4.0 * uHits * (1.0 - uHits), lp = TAU * uLoop;
  bsFlow = bsBath ? 0.6 * sin(uTravel * 0.05) : mod(uTravel * 0.35, 256.0);
  if (bsBath) {
    bsAmt = 0.05 + 0.12 * uDrone + (o3 < 0.0 ? 0.9 : 0.2) * o3;
    bsW1 = vec4(0.75, 0.4, 0.8, 0.0); bsW2 = vec4(0.25, 0.8, -0.15, 0.0); bsW3 = vec4(-0.11 * uTime, 0.09 * uTime, -0.5 * uTravel, 0.0); bsW4 = vec4(0.1, 0.07, 0.15 * uPhrase, 0.04 + 0.18 * uEnergy);
  } else {
    bsAmt = 0.5 + 0.22 * uDrone + (o3 < 0.0 ? 0.85 : 0.45) * o3;
    bsW1 = vec4(0.95, 0.53, 1.5, 0.55); bsW2 = vec4(0.8, -1.4, 0.0, 0.0); bsW3 = vec4(1.0, 2.0, 0.7 * uTravel, 0.6); bsW4 = vec4(0.1, 0.1, 0.12 * uPhrase, 0.06 + 0.22 * uEnergy);
  }
  bsKey = mix(mix(vec3(3.1, 2.65, 2.05), vec3(0.35, 0.45, 0.7), night), vec3(3.3, 1.7, 0.7), gold) * (0.85 + 0.35 * uTone);
  bsSky = mix(mix(vec3(0.5, 0.57, 0.68), vec3(0.1, 0.13, 0.22), night), vec3(0.42, 0.36, 0.5), gold) * (0.9 + 0.5 * uPad - 0.12 * uTone);
  if (uOwn[6] > 0.0) { bsSky = mix(bsSky, bsSky * 0.1 + vec3(0.012, 0.012, 0.016), BS_ONE); bsKey = mix(bsKey, bsKey * 0.95 * vec3(1.0, 0.94, 0.84), BS_ONE); }
  bsAir = bsSky * 0.9 + bsKey * 0.1;
  if (uOwn[6] < 0.0) bsAir = mix(bsAir, mix(mix(vec3(0.95, 0.98, 1.0), vec3(0.07, 0.11, 0.22), night), vec3(1.5, 0.9, 0.55), gold), BS_OUT);
  if (uOwn[6] > 0.0) bsAir = mix(bsAir, bsSky, BS_ONE);
  if (uOwn[6] < 0.0 && uOwn[1] < 0.0) bsSky *= 1.0 - 0.5 * BS_OUT * night;
  bsWall = mix(vec3(0.86, 0.85, 0.82), uOwn[5] < 0.0 ? vec3(0.78, 0.5, 0.44) : vec3(0.14, 0.3, 0.29), abs(uOwn[5]));
  bsSun = bsBath ? normalize(vec3(-0.7, 0.62, -0.3)) : normalize(vec3(-0.7, 0.78, -0.2));
  if (uOwn[6] > 0.0) bsSun = normalize(mix(bsSun, vec3(0.12, 0.95, 0.12), 0.75 * BS_ONE));
  bsPaint = vec3[5](vec3(0.05, 0.08, 0.25), vec3(0.88, 0.78, 0.58), vec3(0.3, 0.46, 0.3), vec3(0.88, 0.2, 0.12), vec3(0.8, 0.42, 0.44));
  for (int k = 0; k < 5; k++) {
    vec3 u = bsRich(uKind[k], 1.6); u *= bsGrey(bsPaint[k]) / max(bsGrey(u), 0.02);
    bsPaint[k] = mix(bsPaint[k], min(u, 0.95), 0.25);
    if (BS_DYE > 0.0) bsPaint[k] = mix(bsPaint[k], uKind[k] * uKind[k] * 0.95, BS_DYE);
  }
  bsBump = vec3(vec2(0.4 * sin(uTime * 0.03), 0.0) + (bsBath ? vec2(1.2, 4.2) : vec2(-0.3, -1.2)), 0.22 * jump);
  vec2 gp = bsBath ? vec2(-0.6 + 1.6 * sin(lp), 5.0 - 1.8 * cos(lp)) : vec2(0.35 * sin(lp), -0.1 - 1.1 * cos(lp));
  bsGold = vec4(gp, bsTop(gp) + 0.14 + 1.2 * uCue * (1.0 - uCue), 0.3);
  vec3 ro = bsBath ? vec3(1.6, 4.2 + 1.6 * v, -3.4) : vec3(-1.2 + 0.06 * sin(uTime * 0.05), 1.9 + (v < 0.0 ? 0.9 : 1.5) * v + 0.4 * max(o3, 0.0), -5.2);
  vec3 ta = bsBath ? vec3(-0.7, 0.3, 5.2 - 1.5 * max(v, 0.0)) : vec3(-0.4, 1.1 - 0.6 * v, 3.2);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt), rd = normalize(fw * 1.25 + rt * p.x + up * p.y);
  vec3 alb = bsWall, lit, emit = vec3(0.0); float amb = 0.6, dir = 0.0, soft = 0.0, veil = 0.0;
  bool heap = false; float t = 0.0, s = 1.0, tw = 0.0, tn = 1e5, tf = 1e5, rho; vec3 w = ro, rl = rd, pos, col = vec3(0.0); int what = 4;
  BS_WHEN(!bsBath) {
    vec2 o = ro.xz + vec2(BS_R, 0.0); float aa = dot(rd.xz, rd.xz), bb = dot(o, rd.xz), oo = dot(o, o), ri = BS_R - BS_HALF, rw = BS_R + BS_HALF;
    float di = bb * bb - aa * (oo - ri * ri); tw = (-bb + sqrt(max(bb * bb - aa * (oo - rw * rw), 0.0))) / aa;
    if (di > 0.0 && bb < 0.0) { tn = (-bb - sqrt(di)) / aa; tf = (-bb + sqrt(di)) / aa; }
    t = 0.3; what = 1; bool over = false; vec2 uv;
    for (int i = 0; i < 20; i++) {
      if (!over && t > tn) {
        over = true; t = tf; pos = ro + rd * t;
        if (pos.y < bsNose(bsAlong(pos))) { what = 2; break; }
      }
      if (t > tw + 0.4) { what = 4; break; }
      pos = ro + rd * t; uv = bsPlace(pos, rho);
      float d = pos.y - bsTop(uv) - bsA * (0.5 + 0.6 * smoothstep(1.2, 1.7, uv.x));
      if (d < 0.01) break;
      float fall = BS_SLOPE * BS_R * ((pos.x + BS_R) * rd.z - pos.z * rd.x) / (rho * rho) - rd.y;
      t += max(d * 0.75 / clamp(fall, 0.55, 1.0), 0.008);
    }
    if (what == 4) t = tw;
    float a = gp.y / BS_R, gr = BS_R * (12.0 + gp.x) / (12.0 - gp.x);
    float gt = bsMeet(vec3(gr * cos(a) - BS_R, bsGold.z, gr * sin(a)) - ro, rd, bsGold.w * gr / BS_R);
    if (gt < t + 0.35) { t = gt; what = 1; bsRide = true; }
    pos = ro + rd * t; uv = bsPlace(pos, rho); s = rho / BS_R; w = vec3(uv.x, pos.y, uv.y);
    vec2 er = vec2(pos.x + BS_R, pos.z) / rho; rl = vec3(dot(rd.xz, er), rd.y, dot(rd.xz, vec2(-er.y, er.x)));
    heap = what == 1;
    float below = bsNose(w.z) - pos.y;
    if (what == 2) { amb = (0.5 + 0.3 * exp(-below * 0.7)) * (0.75 + 0.25 * er.x); dir = 0.13 * exp(-below * 0.35); soft = 0.1; }
    lit = w;
  }
  BS_WHEN(bsBath) {
    // the bath
    float tl = rd.x < 0.0 ? (-6.5 - ro.x) / min(rd.x, -1e-4) : 1e5, tr = rd.x < 0.0 ? 1e5 : (6.5 - ro.x) / max(rd.x, 1e-4), tz = (16.5 - ro.z) / max(rd.z, 1e-3);
    float td = rd.y < 0.0 ? (0.35 - ro.y) / min(rd.y, -1e-4) : 1e5; tw = min(min(tl, tr), tz);
    t = min(td, tw); pos = ro + rd * t; float px = bsPx * t;
    if (td < tw) {
      float in1 = min(4.0 - abs(pos.x), min(pos.z, 13.0 - pos.z)), e = px / max(-rd.y, 0.1);
      vec2 tile = abs(fract(pos.xz / 0.5) - 0.5) * 0.5;
      amb = 0.85; dir = 0.55;
      alb *= 1.0 - 0.25 * bsStep(0.012 + e, 0.0, 0.25 - max(tile.x, tile.y)) / (1.0 + 30.0 * e);
      alb = mix(alb, vec3(0.1, 0.25, 0.42), bsIn(e, abs(in1 + 0.18) - 0.1));
      if (in1 > 0.0) {
        float tc = (bsAmt + 0.3 * bsA - ro.y) / rd.y;
        for (int i = 0; i < 3; i++) { vec3 q = ro + rd * tc; tc += (bsTop(q.xz) + 0.3 * bsA - q.y) / rd.y * 0.8; }
        float tx = (4.0 * sign(rd.x) - ro.x) / (abs(rd.x) < 1e-4 ? 1e-4 : rd.x), ts = min(tx, (13.0 - ro.z) / max(rd.z, 1e-3));
        float gt = bsMeet(bsGold.xzy - ro, rd, bsGold.w); bsRide = gt < tc + 0.35; tc = bsRide ? gt : tc;
        heap = tc < ts; t = min(tc, ts); pos = ro + rd * t;
        alb = vec3(0.6, 0.75, 0.8); amb = 0.6; dir = 0.0;
      }
    } else {
      bool left = tl < tz;
      amb = left ? 0.5 : 0.75; dir = left ? 0.0 : 0.42; alb *= 1.0 - 0.12 * bsIn(px, pos.y - 1.15);
      float g = abs(fract((pos.z + 0.6) / 2.6) - 0.5) * 2.6, win = max(max(g - 0.85, abs(pos.y - 4.35) - 3.15), max(0.05 - abs(pos.y - 3.4), 0.04 - g));
      if (left) { veil = bsIn(px, win); emit = mix(bsSky * 1.6, bsKey * 0.6 + bsSky, sat((pos.y - 1.2) / 6.0)); }
      if (uOwn[6] > 0.0) emit = mix(emit, bsSky * 0.4, BS_ONE);
      if (uOwn[6] < 0.0) { emit = mix(veil > 0.0 ? emit : vec3(0.0), bsOpen(rd), BS_OUT); veil = mix(veil, 1.0, BS_OUT); }
    }
    w = lit = pos;
  }
  vec4 pc = piece(bsBath ? vec2(0.5 + w.x / 8.4, sat(1.0 - w.z / 13.0)) : vec2(0.5 + 0.45 * w.x / BS_HALF, sat(1.0 - (w.z + 3.0) / 12.0)));
  vec4 h = vec4(0.0);
  BS_WHEN(heap) { h = bsHeap(rl, w, s, bsPx * t, pc); if (bsBath) { amb = 0.05; dir = 0.0; } }
  BS_WHEN(!bsBath && (what == 4 || bsPast)) {
    // the round wall, and at the landing a tall bright opening
    vec3 q = ro + rd * tw; float l = bsAlong(q), hi = q.y - bsNose(l), px = bsPx * tw;
    float m = (1.0 - 0.35 * exp(-max(hi, 0.0) * 2.2)) * (1.0 - 0.22 * bsIn(px, abs(hi - 1.15) - 0.03));
    amb = (0.66 + 0.1 * sin(l * 0.6) + 0.02 * q.y) * m; dir = 0.42 * m * smoothstep(-1.0, 0.5, hi) * bsStep(3.6, 3.0, hi); soft = 0.03; lit = vec3(BS_HALF, q.y, l);
    vec2 d = vec2((l - 8.9) * 1.3, hi);
    float door = max(abs(d.x) - 1.0, d.y < 2.0 ? -d.y : length(vec2(d.x, d.y - 2.0)) - 1.0);
    col = (bsKey * 0.2 + vec3(0.5, 0.3, 0.12) * uMic) * exp(-max(door, 0.0) * 0.9);
    veil = bsIn(px * 1.2, door); emit = bsKey * 0.8 + bsSky * 1.2;
    if (uOwn[6] > 0.0) { veil *= 1.0 - 0.9 * BS_ONE; col *= 1.0 - BS_ONE; }
    if (uOwn[6] < 0.0) { emit = mix(emit, bsOpen(rd), BS_OUT); veil = mix(veil, 1.0, BS_OUT); col *= 1.0 - BS_OUT; }
  }
  BS_WHEN(!bsBath && what == 1 && !bsPast && h.a < 0.98) {
    // the steps under the heap: a tread or a riser
    float tt = (bsNose(w.z) - w.y) / min(rl.y - BS_SLOPE * rl.z / s, -0.05), l = w.z + rl.z * tt / s, y = w.y + rl.y * tt, k = floor(l / BS_RUN), rise = BS_SLOPE * BS_RUN;
    float tread = rl.y < -1e-3 ? (k * rise - y) / rl.y : 1e4, riser = rl.z > 1e-3 ? ((k + 1.0) * BS_RUN - l) * s / rl.z : 1e4;
    bool level = tread < riser; vec3 q = rl * (tt + min(min(tread, riser), 2.0)); lit = w + vec3(q.x / s, q.y, q.z / s);
    float deep = bsDeep(lit.xz);
    amb = (level ? 0.65 + 0.35 * bsStep(1.0, 0.5, fract(lit.z / BS_RUN)) : 0.5 + 0.2 * fract(lit.y / rise)) * (0.06 + 0.94 * bsStep(0.3, -0.35, deep));
    dir = (level ? 0.7 : 0.12) * bsStep(0.35, 0.0, deep);
  }
  BS_WHEN(bsBath) {
    // the red ring and the board
    vec3 c = vec3(-1.7 + 0.5 * sin(uTravel * 0.03), 0.0, 7.4 + 0.6 * cos(uTravel * 0.023)), q, n = vec3(0.0, 1.0, 0.0);
    c.y = bsTop(c.xz) + 0.22;
    float tr = dot(c - ro, rd) - 1.3, d = 1.0, near = length(ro + rd * (tr + 1.3) - c);
    for (int i = near < 1.2 ? 0 : 14; i < 14; i++) {
      q = ro + rd * tr - c; q.y -= 0.2 * q.x;
      vec2 m = q.xz / max(length(q.xz), 1e-3) * 0.75; n = q - vec3(m.x, 0.0, m.y); d = length(n) - 0.2; tr += d * 0.95;
    }
    float e = bsPx * tr, red = smoothstep(-0.03, 0.03, abs(fract(atan(q.z, q.x + 1e-4) / TAU * 4.0) - 0.5) - 0.12);
    n /= max(length(n), 1e-3);
    float over = near < 1.2 ? bsIn(e, d - 2.0 * e) * bsStep(-0.2, -0.1, q.y) : 0.0;
    float tb = (1.0 - ro.y) / min(rd.y, -1e-3); vec3 a = ro + rd * tb; e = bsPx * tb * 2.0;
    float top = bsIn(e, max(abs(a.x - 0.78) - 0.34, a.z - 2.3)) * step(rd.y, 0.0);
    if (over > 0.0) { alb = mix(alb, mix(vec3(0.9, 0.88, 0.84), vec3(0.8, 0.06, 0.04), red), over); amb = mix(amb, 0.65 + 0.35 * n.y, over); dir = mix(dir, smoothstep(-0.1, 1.0, dot(n, bsSun)), over); lit = q + c; soft = 0.05; }
    if (top > 0.0) { alb = mix(bsWall, vec3(0.16, 0.32, 0.45), bsIn(e, 1.75 - a.z)); amb = mix(amb, 1.0, top); dir = mix(dir, 0.5, top); lit = a; soft = 0.02; }
    h *= (1.0 - over) * (1.0 - top);
    if (top > 0.5) { t = tb; veil = 0.0; }
  }
  col = mix(col + alb * (bsSky * amb + bsKey * dir * bsLight(lit, soft)), emit, veil);
  col = h.rgb + col * (1.0 - h.a);
  col = mix(col, bsAir, (1.0 - exp(-max(t - 6.0, 0.0) * (0.015 + 0.02 * uSpace))) * (1.0 - BS_OUT * veil * (1.0 - h.a)));
  // balusters and rail, far and near
  for (int k = tn > 1e4 ? 2 : 0; k < 2; k++) {
    float tr = k == 0 ? tf : tn; vec3 pr = ro + rd * tr; float l = bsAlong(pr), hi = pr.y - bsNose(l), e = bsPx * tr;
    float f = (fract(l / 0.4) - 0.5) * 0.4, b = 0.028, rail = bsIn(e, abs(hi - 0.93) - 0.05);
    vec3 c = mix(bsWall * (bsSky * 0.6 + (bsSky + bsKey) * 0.3 * sat(-f / b)), vec3(0.34, 0.15, 0.08) * (bsSky * 0.8 + bsKey * 0.25), rail);
    col = mix(col, c, max(rail, bsIn(e, abs(f) - b) * step(0.0, hi) * step(hi, 0.92)) * step(tr, t + 0.01) * step(0.1, tr));
  }
  // the nearest, out of focus
  for (int k = bsBath ? 2 : 0; k < 2; k++) {
    vec4 b = vec4(-0.5, -0.57, 0.2, 3.0); if (k == 1) b = vec4(0.66, -0.63, 0.29, 0.0);
    b.y += 0.012 * sin(uTravel * 0.13 + b.x * 9.0) + 0.25 * min(o3, 0.0);
    vec2 d = (p - b.xy) / b.z; float q = dot(d, d); vec3 n = vec3(d, sqrt(max(1.0 - q, 0.0)));
    col = mix(col, bsDye(b.w + 0.5) * (bsKey * 0.45 * smoothstep(-0.3, 1.0, dot(n, vec3(-0.62, 0.72, 0.3))) + bsSky * (0.45 + 0.4 * n.y)), bsStep(1.04, 0.86, sqrt(q)));
  }
  return screenOf(col);
}
