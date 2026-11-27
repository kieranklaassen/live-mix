// name: Brushed sand
// a: Marsh
// b: Harbour town
// what: Brown sand on a lit milk glass, drawn by fingers: a wide marsh with water in bare level swipes, flicked reeds, a far line of dabbed trees and one heron standing near; or a steep town at night rubbed out of a dark sheet, its windows and stairs, a quay lamp with its long reflection, a small boat and one under sail.
// follows: Drone deepens the sand at the frame or in the night sky, pad wipes the sky open, texture strews grains, a phrase redraws the heron's neck or fills the sail. The piece bares and tints the water; bands are the reeds or the windows. The loop is one finger crossing, a hit a smear of light that fills in, a cue softens all edges, keys are gaps between grains.
// own: 0 sifted over, a dark night at -1, swept nearly clear at 1; 1 blue glass at -1, ember glass at 1; 2 bare shore with no reeds or trees, or a few cottages at -1, tall thick reeds, or a whole town awake at 1; 3 far off at -1, close to the heron or the boat and lamp at 1; 4 fine black sand at -1, coarse red sand at 1; 5 low horizon, the heron bowed or the mast bare at -1, high water, the neck stretched or the sail full at 1
float bsD;                  // how deep the sand lies here
vec3 bsGel;                 // the colour of the light under the glass
float bsHalf, bsPx, bsSoft, bsGain; // half the picture's width, a pixel, how soft an edge lies, how strongly things answer

float bsBell(float x) { return exp(-x * x); }
// 0 below zero, 1 above, over a few grains.
float bsIn(float d, float e) { return smoothstep(-e, e, d); }
// Distance to a tapered stroke from a to b, and the place along it.
vec2 bsSeg(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 d = b - a, q = p - a;
  float t = sat(dot(q, d) / dot(d, d));
  return vec2(length(q - d * t) - mix(ra, rb, t), t);
}
// Sand laid on: to the depth amt inside a shape.
void bsLay(float d, float amt) { bsD = mix(bsD, max(bsD, amt), bsIn(-d, bsSoft)); }
// Sand wiped off inside a shape down to what the finger leaves, and pushed up in a ridge outside its edge.
void bsWipe(float d, float left, float ridge, float strong) {
  float m = bsIn(-d, bsSoft) * strong;
  bsD = mix(bsD, min(bsD, left), m);
  bsD += strong * ridge * min(bsD + 0.35, 1.4) * bsBell((d - 1.6 * bsSoft) / (1.5 * bsSoft)) * (1.0 - m);
}
// One finger swiped level across: with bristle lines in it and tapering ends.
void bsSwipe(vec2 p, vec2 c, float len, float wide, float bow, float left, float strong) {
  vec2 q = p - c;
  float t = q.x / len;
  if (abs(t) > 1.15 || abs(q.y) > wide + 0.07 + abs(bow)) return;
  q.y += bow * (1.0 - t * t);
  float w = wide * (sqrt(max(1.0 - t * t, 0.0)) - 0.25 * t);
  float line = noise(vec2(q.x * 5.0 + c.y * 91.0, q.y / wide * 4.0));
  float d = abs(q.y) - w * (0.75 + 0.5 * noise(vec2(q.x * 16.0, c.x * 37.0 + c.y * 71.0))) + max(abs(t) - 1.0, 0.0);
  bsWipe(d, left + 0.45 * smoothstep(0.6, 0.9, line), 0.9, strong);
}
// The heron's neck: two bent lengths through five places. Distance to it.
float bsNeck(vec2 h, vec2 a, vec2 b, vec2 c, vec2 d, vec2 e) {
  float best = 9.0;
  vec2 last = a;
  for (int i = 1; i <= 10; i++) {
    float t = float(i) * 0.2;
    vec2 q = t <= 1.001 ? mix(mix(a, b, t), mix(b, c, t), t) : mix(mix(c, d, t - 1.0), mix(d, e, t - 1.0), t - 1.0);
    float r = mix(0.044, 0.018, sat(t * 0.62));
    best = min(best, bsSeg(h, last, q, r, r).x);
    last = q;
  }
  return best;
}
void bsHeron(vec2 p, vec2 foot, float size) {
  vec2 h = (p - foot) / size;
  if (h.x < -0.62 || h.x > 0.5 || h.y < -0.3 || h.y > 1.25) return;
  float keep = bsSoft;
  bsSoft /= size;
  // the poses of the neck, drawn over through the phrase
  float turn = cos(uTime * 0.23);
  float up = sat(sat(turn) * sat(turn) * uPhrase * 0.9 + sat(uOwn[5])), low = sat(sat(-turn) * sat(-turn) * uPhrase * 0.7 + sat(-uOwn[5])) * (1.0 - up);
  vec2 n0 = vec2(-0.1, 0.6);
  vec2 n1 = vec2(-0.3, 0.6) + up * vec2(0.08, 0.1) + low * vec2(0.0, 0.06);
  vec2 n2 = vec2(-0.175, 0.77) + up * vec2(0.0, 0.08) + low * vec2(-0.12, -0.04);
  vec2 n3 = vec2(-0.06, 0.93) + up * vec2(-0.07, 0.1) + low * vec2(-0.2, -0.1);
  vec2 n4 = vec2(-0.185, 0.965) + up * vec2(0.0, 0.1) + low * vec2(-0.27, -0.27);
  vec2 bill = mix(vec2(-0.225, -0.05), vec2(-0.13, -0.2), low) + up * vec2(0.0, 0.07);
  vec2 along = bill / length(bill);
  // legs
  float legs = bsSeg(h, vec2(0.045, 0.46), vec2(0.07, 0.235), 0.017, 0.008).x;
  legs = min(legs, bsSeg(h, vec2(0.07, 0.235), vec2(0.03, 0.0), 0.009, 0.006).x);
  legs = min(legs, bsSeg(h, vec2(0.095, 0.44), vec2(0.15, 0.24), 0.017, 0.008).x);
  legs = min(legs, bsSeg(h, vec2(0.15, 0.24), vec2(0.135, 0.02), 0.009, 0.006).x);
  bsLay(legs, 2.8);
  // the body, the wing folded over it and the tail
  float body = bsSeg(h, vec2(-0.06, 0.575), vec2(0.17, 0.46), 0.086, 0.06).x;
  body = smin(body, bsSeg(h, vec2(0.1, 0.5), vec2(0.36, 0.345), 0.07, 0.004).x, 0.04);
  float neck = bsNeck(h, n0, n1, n2, n3, n4);
  float bird = smin(body, neck, 0.05);
  bird = min(bird, bsSeg(h, n4, n4 + along * 0.05, 0.028, 0.017).x);
  bird = min(bird, bsSeg(h, n4 + along * 0.05, n4 + bill, 0.015, 0.001).x);
  // the plume behind the eye, and the hair of the breast
  bird = min(bird, bsSeg(h, n4 + vec2(0.0, 0.018), n4 + vec2(0.15, -0.075) + 0.2 * low * vec2(0.0, 0.4), 0.010, 0.001).x);
  bird = min(bird, bsSeg(h, vec2(-0.135, 0.585), vec2(-0.15, 0.44), 0.013, 0.001).x);
  bird = min(bird, bsSeg(h, vec2(-0.105, 0.56), vec2(-0.105, 0.4), 0.013, 0.001).x);
  // pushed clear all round first, so that it stands off from what is behind
  bsWipe(bird - 0.022, 0.12, 0.35, 0.8 * smoothstep(0.25, 0.4, h.y));
  bsLay(bird, 3.1);
  // feathers: thin lines of light taken back with a stick
  vec2 hb = h - vec2(-0.06, 0.575), uv = vec2(dot(hb, vec2(0.877, -0.48)), dot(hb, vec2(0.48, 0.877)));
  for (int i = 0; i < 4; i++) {
    float k = float(i), v = uv.y - (0.042 - 0.032 * k) * (1.15 - 1.9 * uv.x) - 0.25 * (uv.x - 0.2) * (uv.x - 0.2);
    float d = max(abs(v) - 0.0075 * sat(2.0 - 4.0 * uv.x), abs(uv.x - 0.21 - 0.015 * k) - 0.16 + 0.02 * k);
    bsWipe(d, 0.3, 0.1, 0.95 * bsIn(-body - 0.012, 0.012));
  }
  bsWipe(length(h - n4 - along * 0.022) - 0.0085, 0.05, 0.0, 0.95);
  bsSoft = keep;
}
// A clump of flicked stems: sixteen, each as tall as its band.
void bsReeds(vec2 p, vec2 root, float wide, float tall, float depth) {
  float y = p.y - root.y;
  if (y < -0.02 || y > 1.1 * tall + 0.06 || abs(p.x - root.x) > wide + 0.35 * tall) return;
  float near = 9.0;
  for (int i = 0; i < 16; i++) {
    float k = float(i), r = hash11(k + 3.7 + root.x * 13.0), r2 = fract(r * 47.3);
    float show = smoothstep(0.0, 0.2, 1.2 + 1.2 * min(uOwn[2], 0.0) - fract(k * 0.618));
    if (show <= 0.0) continue;
    float high = tall * (0.4 + 0.42 * r2 + 0.3 * bsGain * uBands[i]) * show, t = y / high;
    if (t > 1.05) continue;
    float lean = (r - 0.5) * 0.5 + 0.16 + 0.02 * sin(uTime * 0.31 + k * 1.7);
    float x = root.x + wide * (r2 * 2.0 - 1.0) * 0.7 + (fract(k * 0.618) - 0.5) * 0.4 * wide + lean * y * (0.35 + 0.65 * t);
    float w = 0.0045 * show * (1.0 - 0.8 * sat(t));
    float d = abs(p.x - x) * 0.93 - w + max(t - 1.0, 0.0) * high;
    if (r > 0.62) d = min(d, max(abs(t - 0.86) - 0.09, 0.0) * high + abs(p.x - x) - 0.008);
    near = min(near, d);
  }
  bsLay(near, depth);
}

void bsMarsh(vec2 p) {
  float fit = sat(bsHalf / 0.85);
  float zoom = uOwn[3] > 0.0 ? 1.0 - 0.36 * uOwn[3] : 1.0 - 0.55 * uOwn[3];
  vec2 eye = vec2(0.36 * fit, uOwn[3] > 0.0 ? 0.12 : -0.12), q = (p - eye) * zoom + eye;
  float side = p.x / max(bsHalf, 0.3), season = uOwn[2], tide = 0.06 + 0.16 * uOwn[5], night = uOwn[0];
  // the sift of the sky, dragged on the slant by the side of a hand
  vec2 s = rot(-0.16) * q;
  float drag = noise(s * vec2(2.2, 17.0)) * 0.6 + noise(s * vec2(5.0, 48.0) + 9.0) * 0.4;
  float high = sat((q.y - tide - 0.02) / 0.45);
  bsD = 0.1 + 0.55 * high + 0.9 * smoothstep(0.42, 0.75, drag) * (0.35 + 0.65 * high) + 0.25 * noise(q * 3.0);
  // the pad wipes the sky open in one long arc
  float arc = q.y - tide - 0.21 - 0.1 * q.x + 0.1 * (q.x + 0.1) * (q.x + 0.1);
  float w = 0.05 + 0.07 * uPad + 0.03 * uSpace;
  bsWipe(abs(arc + 0.02 * (drag - 0.5)) - w * (0.6 + 0.4 * noise(q * vec2(3.0, 8.0))), 0.08 + 0.5 * smoothstep(0.5, 0.8, noise(vec2(q.x * 3.0, arc * 50.0))), 0.5, 0.75 + 0.25 * uPad);
  // two treelines of fingertip dabs
  for (int k = 0; k < 2; k++) {
    float fk = float(k), cw = 0.052 - 0.014 * fk, gx = q.x / cw + 7.3 * fk, base = tide + 0.007 + 0.018 * fk;
    float d = 9.0;
    for (int i = -1; i <= 1; i++) {
      float id = floor(gx) + float(i), r = hash11(id + 40.0 * fk);
      vec2 c = vec2((id + 0.5 + 0.5 * (r - 0.5) - gx) * cw, (q.y - base - 0.02 * r * (1.0 + noise(vec2(id * 0.23, 3.0 + fk)) * 2.0)) / (1.0 + 1.1 * max(season, 0.0)));
      d = min(d, length(vec2(c.x, max(c.y * 0.75, 0.0))) - cw * (0.42 + 0.26 * r));
    }
    float gap = smoothstep(0.3, 0.55, noise(vec2(q.x * 2.6 + 5.0 * fk, 8.0)));
    bsLay(max(d, base - 0.012 - q.y), gap * (1.0 - 0.45 * fk) * 1.45 * sat(1.0 + season));
  }
  // the water: level drags of the hand, and the swipes that bare the glass
  float wet = 1.0 - bsIn(q.y - tide, 0.004);
  float lines = noise(q * vec2(1.6, 46.0) + 3.0) * 0.55 + noise(q * vec2(5.0, 110.0)) * 0.45;
  float pool = mix(0.28, 0.75, smoothstep(-0.5, 0.6, -side)) + 1.5 * smoothstep(0.52, 0.8, lines) * smoothstep(-0.12, 0.5, -q.y) + 0.8 * smoothstep(0.6, 0.75, lines);
  bsD = mix(bsD, pool + 1.1 * bsBell((q.y - tide + 0.012) / 0.012), wet);
  if (wet > 0.0) {
    for (int i = 0; i < 8; i++) {
      float k = float(i), r = hash11(k + 2.3), deep = (k + 0.5) / 8.0;
      vec2 c = vec2(mix(-0.5, 0.62, fract(k * 0.618 + 0.1)) * (0.4 + 0.6 * fit) + 0.02 * sin(uTime * 0.05 + k), tide - 0.03 - 0.46 * pow(deep, 1.25));
      vec4 m = piece(vec2(0.5 + p.x / 1.8, deep));
      float open = sat(m.a * 1.4) * bsGain;
      bsGel += (m.rgb - bsGel * m.a) * bsBell((q.y - c.y) * 22.0);
      bsSwipe(q, c, 0.3 + 0.35 * r, (0.011 + 0.028 * deep) * (0.75 + 0.8 * open), 0.02 * (r - 0.4), 0.03, 0.9);
    }
  }
  // the whole sheet sifted over, or swept nearly clear
  bsD = max(bsD + 1.1 * max(-night, 0.0) * smoothstep(0.02, 0.7, bsD + 0.25 * noise(q * vec2(3.0, 9.0)) + 0.15) - 0.75 * max(night, 0.0) * smoothstep(-1.6, -0.4, -bsD), 0.02);
  // the bank in front, and stems flicked out of it
  float bank = q.y + 0.43 - 0.05 * noise(vec2(q.x * 3.0, 1.0)) - 0.14 * smoothstep(0.0, 0.75, -q.x) + 0.05 * smoothstep(-0.1, 0.3, q.x);
  bsLay(bank, 2.4 + 0.8 * noise(q * vec2(8.0, 30.0)));
  bsD += 0.5 * bsBell((bank - 0.004) / 0.012);
  bsReeds(q, vec2(mix(-0.12, -0.36, fit), -0.4), 0.24 + 0.1 * max(season, 0.0), 0.62 + 0.2 * max(season, 0.0), 2.7);
  if (season > 0.0) bsReeds(q, vec2(mix(0.2, 0.08, fit), -0.5), 0.3, 0.75 * season, 2.6);
  bsReeds(q, vec2(0.83, -0.46), 0.13, 0.36, 2.5);
  // the sand left thick at the frame, its edge ragged by fingers
  float deep = 0.015 + 0.06 * uDrone - 0.03 * uSpace - 0.05 * night;
  float lobes = noise(vec2(p.x * 5.0, 2.0)) * 0.1 + noise(vec2(p.x * 17.0 + p.y * 9.0, 5.0)) * 0.03;
  float lobes2 = noise(vec2(p.y * 6.0, 7.0)) * 0.11 + noise(vec2(p.y * 19.0, 11.0)) * 0.03;
  float frame = smin(0.5 - p.y - deep - lobes - 0.07 * sat(-side), p.x + bsHalf - (deep + lobes2 + 0.02) * (0.4 + 0.6 * fit), 0.12);
  float rake = noise(rot(-0.45) * p * vec2(3.0, 42.0)) * 0.6 + noise(rot(-0.45) * p * vec2(7.0, 90.0)) * 0.4;
  bsD += 1.5 * bsIn(0.1 - frame, 0.1) * smoothstep(0.35, 0.7, rake);
  float heap = frame + 0.09 * smoothstep(0.5, 0.75, rake);
  bsLay(heap, 2.5 + 0.9 * rake);
  // stems flicked out of the dark with a stick
  for (int i = 0; i < 7 && q.y < -0.12 && q.x < -0.2; i++) {
    float k = float(i), tall = 0.17 + 0.2 * fract(k * 0.618), t = (q.y + 0.52) / tall;
    if (t > 1.1) continue;
    float x = -0.84 * bsHalf / 0.89 + 0.056 * k + 0.03 * sin(k * 5.0) + (0.02 + 0.05 * sin(k * 3.1 + 0.2 * sin(uTime * 0.2))) * t * t;
    bsWipe(abs(q.x - x) - 0.0062 * (1.0 - 0.75 * sat(t)) + max(t - 1.0, 0.0) * tall, 0.3, 0.2, 0.9 * smoothstep(1.0, 2.2, bsD) * sat(1.0 + season));
  }
  // rings where the legs stand, then the bird
  vec2 foot = vec2(mix(-0.1, 0.43, fit), -0.37);
  vec2 rg = (q - foot - vec2(0.05, 0.0)) / vec2(0.15, 0.028);
  bsWipe(abs(length(rg) - 1.0) * 0.028 - 0.005, 0.1, 0.8, 0.85);
  bsWipe(length(rg * vec2(1.5, 2.0)) * 0.014 - 0.012, 0.15, 0.6, 0.8);
  vec2 mir = vec2(q.x - foot.x + 0.012 * sin(q.y * 90.0), foot.y - q.y);
  bsLay(max(abs(mir.x - 0.03) - 0.006, -mir.y), 1.5);
  bsHeron(q, foot, mix(0.5, 0.62, fit));
}

// b: the town, taken away out of a sheet of dark sand.
void bsTown(vec2 p) {
  float fit = sat(bsHalf / 0.85);
  vec2 eye = vec2(0.28 * fit, -0.2), q = (p - eye) * (uOwn[3] > 0.0 ? 1.0 - 0.36 * uOwn[3] : 1.0 - 0.5 * uOwn[3]) * (1.6 - 0.6 * fit) + eye;
  q.x += 0.46 * (1.0 - fit);
  q.y -= 0.12 * uOwn[5];
  float quay = -0.16, day = uOwn[0];
  vec2 s = rot(0.12) * q;
  float drag = noise(s * vec2(1.8, 15.0)) * 0.6 + noise(s * vec2(4.5, 44.0) + 4.0) * 0.4;
  // the sky, rubbed thin behind the hill
  float far = length((q - vec2(0.42, 0.0)) * vec2(0.7, 1.1));
  bsD = 0.35 + 2.5 * smoothstep(0.0, 0.8 + 0.2 * uPad, far) + 1.0 * smoothstep(0.4, 0.8, drag) + 1.5 * uDrone * smoothstep(0.1, 0.5, p.y);
  for (int i = 0; i < 3; i++) {
    float k = float(i);
    bsSwipe(rot(-0.2 - 0.05 * k) * (q - vec2(0.3 + 0.2 * k - 0.15 * k * k, 0.18 + 0.11 * k)), vec2(0.0), 0.62 - 0.07 * k, 0.014 + 0.022 * uPad + 0.004 * k, 0.05, 0.25 + 0.25 * k, 0.7 + 0.3 * uPad);
  }
  bsD = max(bsD - 1.0 * sat(day) * smoothstep(-0.2, 0.4, q.x), 0.1) + 1.0 * sat(-day);
  // the far headland
  bsLay(max(q.y + 0.035 - 0.05 * noise(vec2(q.x * 5.0, 2.0)), -0.2 - q.y), 2.7);
  // the hill, a dark mass
  float hill = q.y - (0.4 - 0.62 * smoothstep(-0.72, 0.3, q.x)) - 0.02 * noise(vec2(q.x * 12.0, 3.0));
  bsLay(hill, 3.4);
  // six terraces of houses, the highest first
  for (int j = 5; j >= 0; j--) {
    float fj = float(j), base = quay + 0.085 * fj + 0.012 * sin(q.x * 6.0 + fj * 2.0), cw = 0.115 - 0.006 * fj;
    float gx = q.x / cw + fj * 0.37 + 20.0, id = floor(gx), r = hash21(vec2(id, fj + 3.0)), r2 = fract(r * 57.0), r3 = fract(r * 331.0);
    float edge = 0.24 - 0.145 * fj;                 // where the terrace ends
    float mid = (id + 0.5 - fj * 0.37 - 20.0) * cw;
    if (mid > edge + 0.02 || q.y < base - 0.01 || q.y > base + 0.2) continue;
    float show = smoothstep(-1.0, 0.0, uOwn[2] * 6.0 + 5.0 - fj + r);
    if (show <= 0.0) continue;
    vec2 h = vec2((fract(gx) - 0.5) * cw, q.y - base);
    float hw = cw * (0.3 + 0.17 * r2), high = 0.065 + 0.055 * r3, gable = r > 0.45 ? 0.75 * (hw - abs(h.x)) : 0.004;
    float wall = max(abs(h.x) - hw, max(h.y - high, -h.y)), house = max(abs(h.x) - hw, max((h.y - high - gable) * 0.8, -h.y));
    bsLay(house, 3.4);
    // the wall rubbed half bare, its roof line drawn with a stick
    bsD = mix(bsD, mix(0.0, 0.7, r2) + 0.3 + 1.0 * smoothstep(0.05, 0.9, length(q - vec2(0.2, 0.0))) - 0.5 * max(uOwn[2], 0.0) + 0.6 * noise(h * vec2(60.0, 20.0)) + 1.1 * smoothstep(-0.3, 0.6, -h.x / hw) - 0.25 * uLow - 0.9 * sat(day) + 0.8 * sat(-day), bsIn(-wall - 0.003, bsSoft) * show);
    bsWipe(abs(max((h.y - high - gable) * 0.8, abs(h.x) - hw)) - 0.0034 + step(h.y, high * 0.9), 0.3, 0.2, 0.85 * show);
      vec2 wc = vec2(h.x / (hw * 0.95), (h.y - 0.018) / 0.034), wi = floor(wc);
    vec2 wf = (fract(wc) - 0.5) * vec2(hw * 0.95, 0.034);
    float rw = hash21(wi + vec2(id * 7.0, fj * 13.0)), bnd = uBands[int(mod(id * 5.0 + fj * 3.0, 16.0))];
    float lit = smoothstep(0.0, 0.15, 0.42 + 0.5 * uOwn[2] + 0.35 * bsGain * bnd - rw) * step(abs(wc.x), 1.0) * step(0.0, wc.y) * step(wi.y, floor((high - 0.02) / 0.034) - 0.5) * show;
    bsWipe(max(abs(wf.x) - 0.0085, abs(wf.y) - 0.0115), 0.04, 0.5, lit);
    bsD -= lit * 0.5 * exp(-dot(wf, wf) * 2500.0) * min(bsD, 1.0);
  }
  // the stairs, up between the houses
  vec2 st[4] = vec2[4](vec2(0.06, quay), vec2(-0.2, 0.02), vec2(-0.09, 0.12), vec2(-0.46, 0.32));
  for (int i = 0; i < 3; i++) {
    vec2 g = bsSeg(q, st[i], st[i + 1], 0.0, 0.0);
    bsLay(g.x - 0.032, 3.2);
    float n = 0.0155 - 0.0015 * float(i), y = (fract((q.y - quay) / n) - 0.5) * n;
    bsWipe(max(abs(y) - 0.0034, g.x - 0.024 + 0.003 * float(i)), 0.35, 0.3, 0.9 * smoothstep(0.0, 0.06, g.y) * (1.0 - 0.3 * float(i)));
  }
  // the harbour: dark again, with level swipes
  float wet = bsIn(quay - q.y, bsSoft);
  float lines = noise(q * vec2(2.0, 60.0)) * 0.6 + noise(q * vec2(7.0, 140.0)) * 0.4;
  float sea = 2.9 - 0.9 * smoothstep(-0.3, 0.5, q.x) - 1.5 * smoothstep(0.5, 0.75, lines) * smoothstep(-0.5, 0.4, q.x) - 1.2 * sat(day) + 0.5 * sat(-day);
  float col = noise(vec2(q.x * 40.0 + 2.5 * (lines - 0.5), 1.0));
  sea -= (2.6 + 1.2 * uOwn[2]) * smoothstep(0.55 - 0.1 * uOwn[2], 0.72, col) * smoothstep(0.32, 0.5, lines) * smoothstep(-0.35, 0.0, -q.x) * smoothstep(-0.44, -0.2, q.y) * (0.75 + 0.4 * uMid);
  bsD = mix(bsD, max(sea, 0.08), wet);
  if (wet > 0.0) for (int i = 0; i < 5; i++) {
    float k = float(i), deep = (k + 0.5) / 5.0;
    vec4 m = piece(vec2(0.5 + p.x / 1.8, deep));
    vec2 c = vec2(mix(0.0, 0.75, fract(k * 0.618)) + 0.02 * sin(uTime * 0.05 + k), quay - 0.04 - 0.28 * deep);
    bsGel += (m.rgb - bsGel * m.a) * bsBell((q.y - c.y) * 20.0);
    bsSwipe(q, c, 0.16 + 0.1 * k, (0.004 + 0.008 * deep) * (0.6 + 1.4 * sat(m.a * 1.4) * bsGain), 0.01, 0.15, 0.85);
  }
  // a small boat left in front, on a rubbed patch
  vec2 rb = q - vec2(-0.47, -0.35 + 0.002 * sin(uTime * 0.37));
  if (abs(rb.x) < 0.4) {
    bsSwipe(rb, vec2(0.02, -0.012), 0.33, 0.017, -0.004, 0.5, 0.85);
    float rim = 0.012 + 0.55 * rb.x * rb.x;
    bsLay(max(rb.y - rim, max(-0.032 + 0.6 * max(abs(rb.x) - 0.09, 0.0) - rb.y, abs(rb.x) - 0.15)), 3.3);
    bsWipe(max(abs(rb.y - rim) - 0.0038, abs(rb.x) - 0.147), 0.1, 0.3, 0.9);
  }
  // the edge of the quay
  bsWipe(abs(q.y - quay - 0.006) - 0.004 + 2.0 * max(q.x - 0.26, 0.0), 0.35, 0.4, 0.95);
  bsLay(max(abs(q.y - quay + 0.008) - 0.009, q.x - 0.27), 3.3);
  // the lamp on its post, its ring of rubbed light, its long reflection
  vec2 l = q - vec2(0.2, 0.005);
  float glow = 1.0 + 0.5 * uLow + 0.4 * uMic;
  bsD = mix(bsD, min(bsD, 0.25 + 10.0 * length(l) / glow), 0.8 * smoothstep(-0.15 - 0.1 * uSpace, 0.0, -length(l)) * (0.75 + 0.25 * noise(l / (length(l) + 1e-4) * 4.0 + 9.0)));
  bsLay(max(abs(l.x) - 0.0035, max(l.y + 0.01, quay - q.y)), 3.2);
  bsWipe(length(l) - 0.017, 0.0, 0.6, 1.0);
  float ww = 0.012 + 0.05 * (quay - q.y);
  float rx = abs(l.x + 0.02 * (noise(vec2(q.y * 60.0, 4.0)) - 0.5)) - ww * (0.35 + noise(vec2(q.y * 95.0, 8.0)));
  bsWipe(max(rx, q.y - quay + 0.02), 0.06, 0.6, 0.95 * smoothstep(-0.5, -0.42, q.y));
  // the boat: hull, mast, boom, stays, and a sail that fills
  vec2 b = q - vec2(0.52, -0.235 + 0.003 * sin(uTime * 0.4));
  b = rot(0.02 * sin(uTime * 0.31)) * b;
  if (abs(b.x) < 0.36 && b.y > -0.14 && b.y < 0.62) {
    float fill = 0.3 + 0.3 * uOwn[5] + 1.1 * uPhrase * (0.5 + 0.5 * cos(uTime * 0.23));
    float spread = sat(0.75 + uOwn[5] * 0.8);
    float luff = b.x + 0.012, top = 0.44, y = sat((b.y - 0.07) / (top - 0.07));
    float leech = -0.2 * spread * pow(1.0 - y, 0.8) - 0.05 * fill * spread * sin(PI * y);
    float sail = max(max(luff, leech - b.x), max(0.07 - b.y, b.y - top));
    if (spread > 0.05) {
      bsWipe(sail, 0.12 + 0.5 * smoothstep(0.35, 0.8, noise(vec2((b.x - leech) * 14.0, b.y * 4.0))) + 0.2 * y, 0.6, 0.95);
    }
    float jib = max(max(0.02 - b.x, (b.x - 0.02) * 0.86 + (b.y - 0.36) * 0.5), 0.09 + 0.1 * fill * sin(PI * sat(b.x * 5.0)) * 0.2 - b.y);
    bsWipe(jib, 0.4 + 0.8 * noise(b * vec2(30.0, 6.0)), 0.5, 0.75 * spread);
    float rig = bsSeg(b, vec2(0.005, 0.5), vec2(0.23, 0.04), 0.0028, 0.0028).x;
    rig = min(rig, bsSeg(b, vec2(0.005, 0.5), vec2(-0.21, 0.04), 0.0028, 0.0028).x);
    rig = min(rig, bsSeg(b, vec2(0.16, 0.03), vec2(0.27, 0.07), 0.003, 0.0015).x);
    bsWipe(rig, 0.2, 0.3, 0.9);
    bsLay(bsSeg(b, vec2(0.002, 0.0), vec2(0.002, 0.52), 0.006, 0.003).x, 3.0);
    bsLay(bsSeg(b, vec2(0.0, 0.065), vec2(-0.22, 0.06), 0.005, 0.003).x, 3.0);
    float sheer = 0.02 + 0.42 * b.x * b.x + 0.05 * b.x;
    float hull = max(b.y - sheer, -0.045 + 0.5 * max(abs(b.x - 0.01) - 0.14, 0.0) - b.y);
    bsLay(max(hull, abs(b.x) - 0.215), 3.4);
    bsWipe(max(abs(b.y - sheer) - 0.0045, abs(b.x) - 0.205), 0.05, 0.4, 0.95);
  }
}

vec3 render(vec2 p) {
  bsHalf = 0.5 * uRes.x / uRes.y; bsPx = 1.0 / uRes.y;
  bsGain = 0.5 + uEnergy;
  float shake = 4.0 * uCue * (1.0 - uCue);
  bsSoft = 0.0026 + 0.01 * shake + 0.0006 * (0.5 - uTone);
  bsGel = vec3(0.0);
  float grain = max(0.0036, 1.9 * bsPx) * (1.0 + 0.7 * max(uOwn[4], 0.0) + 0.3 * min(uOwn[4], 0.0));
  vec2 g = rot(0.4) * p / grain;
  // a hand's line is never true, and the edges creep
  vec2 wob = vec2(noise(p * 13.0 + 0.4 * sin(uTime * 0.11)), noise(p * 13.0 + 31.0)) - 0.5;
  vec2 q = p + 0.006 * wob + shake * 0.012 * (vec2(noise(p * 40.0), noise(p * 40.0 + 17.0)) - 0.5);
  bsD = 0.0;
  if (uVar < 0.5) bsMarsh(q); else bsTown(q);
  // the loop: one finger going slowly across
  float lx = mix(-1.15, 1.15, uLoop) * (bsHalf + 0.1), ly = (uVar < 0.5 ? 0.13 : -0.4) + 0.02 * sin(q.x * 3.0);
  float tail = sat(1.0 - (lx - q.x) / 0.5) * smoothstep(0.0, 0.1, uLoop) * smoothstep(-1.0, -0.9, -uLoop);
  bsWipe(max(abs(q.y - ly) - 0.02 * sqrt(tail * smoothstep(0.0, 0.03, lx - q.x) + 1e-4), q.x - lx), 0.1, 0.3, 0.85 * tail);
  // a hit: a fingertip's smear, which fills in again
  vec2 hc = (uVar < 0.5 ? vec2(-0.22, 0.29) : vec2(-0.04, -0.365)) * vec2(sat(bsHalf / 0.85), 1.0) + vec2(0.05 * sin(uTime * 0.13), 0.025 * cos(uTime * 0.17));
  float hr = 0.1 * sqrt(uHits + 1e-5);
  vec2 hq = rot(0.1) * (q - hc) * (uVar < 0.5 ? vec2(0.6, 1.8) : vec2(0.4, 1.8));
  bsWipe(length(hq) - hr * (0.65 + 0.6 * noise(hq * 24.0)), 0.03 + 0.4 * smoothstep(0.6, 0.9, noise(hq * vec2(9.0, 50.0))), 0.5, smoothstep(0.0, 0.25, uHits));
  bsD *= 1.0 - 0.45 * uHits * exp(-dot(hq, hq) * 70.0);
  bsGel = mix(bsGel, uKind[4], 0.35 * uHits * exp(-dot(hq, hq) * 60.0));
  // grains
  float n1 = noise(g), n2 = noise(rot(0.7) * g * 1.37 + 40.0), n3 = noise(rot(1.9) * g * 0.61 + 9.0);
  float cover = 1.0 - exp(-1.25 * bsD);
  float aa = 0.1 + 0.1 * (0.5 - uTone) + 0.1 * sat(1.0 - 0.0036 / bsPx * 0.5);
  float top = mix(0.1, 0.94, cover) - 0.06;
  float s1 = smoothstep(-aa, aa, top - n1), s2 = smoothstep(-aa, aa, top - 0.02 - n2), s3 = smoothstep(-aa, aa, top - 0.1 - n3);
  float loose = 0.02 + 0.1 * uTexture;
  float strew = smoothstep(0.93 - loose, 0.96 - loose, noise(g * 0.83 + 3.0 * vec2(sin(uTime * 0.05), cos(uTime * 0.041)))) * 0.9;
  float dens = 0.16 * bsD + 0.75 * s1 + 0.8 * s2 + 0.7 * s3 + strew;
  dens += 0.9 * smoothstep(1.2, 3.4, bsD) * (0.6 + 0.4 * n2);
  // a key: single gaps between grains
  float gap = smoothstep(0.86, 0.9, noise(g * 0.5 + 77.0)) * step(0.6, hash21(floor(g * 0.12)));
  dens *= 1.0 - 0.9 * uKeys * gap;
  // the lamp under the glass
  vec2 lc = p - (uVar < 0.5 ? vec2(0.5 * bsHalf, -0.22) : vec2(0.25 * bsHalf, -0.05));
  float lamp = 0.58 + 0.5 * exp(-dot(lc, lc * vec2(1.3, 2.3)));
  lamp *= 0.97 + 0.03 * sin(uTime * 0.19) + 0.06 * uLevel + 0.05 * uMic + 0.1 * uCue * exp(-dot(lc, lc) * 4.0);
  vec3 glass = vec3(1.0, 0.94, 0.8) * vec3(pow(lamp, 0.75), lamp, pow(lamp, 1.25));
  glass *= mix(vec3(1.0), uOwn[1] < 0.0 ? vec3(0.72, 0.9, 1.22) : vec3(1.1, 0.72, 0.52), abs(uOwn[1]));
  float gelL = max(max(bsGel.r, bsGel.g), bsGel.b);
  glass = mix(glass, glass * (0.45 + 0.75 * bsGel / max(gelL, 0.05)), 0.75 * sat(gelL));
  vec3 soak = vec3(0.62, 0.98, 1.5);
  soak = mix(soak, uOwn[4] < 0.0 ? vec3(1.05, 1.07, 1.1) : vec3(0.42, 1.2, 1.7), abs(uOwn[4]));
  vec3 colr = glass * exp(-dens * soak * 1.05);
  // a little of the room on the top of the heap
  colr += vec3(0.05, 0.038, 0.03) * s1 * (0.4 + 0.9 * n2) * smoothstep(0.6, 2.5, bsD);
  return clamp(colr, 0.0, 1.0);
}
