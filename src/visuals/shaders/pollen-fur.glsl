// name: Pollen fur
// a: In the coat
// b: On the stamens
// what: Inside a bumblebee's coat, small as a mite: feathered golden hairs rise rank behind rank into amber dusk over dark armour, with netted, spiked and furrowed pollen hanging between them and a low sun behind; or inside a flower, pale stamens under rose petals, their split heads crusted with grains, a soft striped visitor landing.
// follows: Each kind is one grain, at its place in the piece: it swells, lights, lengthens its spikes. Drone hums in hairs, pad lights the air, texture brightens barbs, crust and dust. Bands sway hairs and stamens, the phrase bends stamens. A hit shakes a puff loose, a cue lets daylight in and opens the wings; keys glint, Tone lengthens spikes, travel rolls a grain.
// own: 0 blue moonlight at -1, white noon at 1; 1 a white coat or pale green petals at -1, a fox red coat or scarlet petals at 1; 2 almost no pollen at -1, a crowd at 1; 3 grains small, smooth and furrowed at -1, large and long-spiked at 1; 4 bare hairs or straight stamens at -1, deep plumes or bowed stamens at 1; 5 near and low at -1, far back and high at 1
float pfOff(float lo, float hi, float x) { return 1. - smoothstep(lo, hi, x); }
vec2 pfP, pfSun;
float pfPx, pfDay, pfSway, pfSide, pfPower, pfComb; // an edge; a cue's daylight; the lean of hairs; the sun's side and strength; barbs
vec3 pfLamp, pfAir, pfFill, pfCoat; // the sun's light, the lit haze, the light in the shade, what the fur lets through
// The one grain here: from its middle, radius, how much it plays, how far it has rolled, kind, toward the light.
vec2 pfQ;
float pfR, pfOn, pfRoll;
int pfK;
float pfBig() { return exp2(0.4 * uOwn[3]); }
vec3 pfL;
float pfSq(float x) { return x * x; }
// Between three worlds, at -1, 0 and 1.
vec3 pfWorld(float o, vec3 low, vec3 here, vec3 high) { return o < 0.0 ? mix(here, low, -o) : mix(here, high, o); }
float pfWorld(float o, float low, float here, float high) { return o < 0.0 ? mix(here, low, -o) : mix(here, high, o); }
// 1 inside an edge, 0 outside, softened by b.
float pfIn(float x, float edge, float b) { x = sat((edge + b - x) / (2.0 * b)); return x * x * (3.0 - 2.0 * x); }
// The grains of drone, pad, texture, phrase and hit: pigment, and build (spikes, net, furrows).
const vec3 PF_SKIN[5] = vec3[5](vec3(0.95, 0.58, 0.07), vec3(0.95, 0.76, 0.22), vec3(0.95, 0.38, 0.05), vec3(0.96, 0.26, 0.03), vec3(0.36, 0.13, 0.62));
const vec3 PF_MAKE[5] = vec3[5](vec3(0, 1, 0), vec3(0, 0.25, 1), vec3(0.16, 0, 0), vec3(0.34, 0, 0), vec3(0.22, 0, 0));
void pfHear(int k, vec2 at) {
  float lv = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : sat(uHits + 0.5 * uCue);
  pfK = k;
  pfOn = sat(0.75 * lv + 0.4 * piece(vec2(0.5 + at.x / 1.8, 0.5 - at.y)).a);
}
vec3 pfTint() { return PF_SKIN[pfK] * mix(vec3(1.0), 0.35 + 1.4 * uKind[pfK] * uKind[pfK], 0.35 * pfOn); }
vec3 pfFire() { return PF_SKIN[pfK] * mix(vec3(1.0), 2.0 * uKind[pfK] * uKind[pfK], 0.35) * pfOn * (0.3 + 0.9 * uEnergy); }

// The light on a grain, or on a spike of it.
vec3 pfLit(vec3 n, vec2 q, vec3 skin) {
  vec2 side = pfL.xy / (length(pfL.xy) + 1e-3);
  float rim = 1.0 - sat(n.z);
  vec3 c = skin * (pfFill * (0.65 + 0.35 * n.y) + pfLamp * sat(dot(n, pfL) * 0.63 + 0.22)) + skin * skin * pfLamp * 0.5 * smoothstep(-1.1, 1.2, dot(q, side));
  return c + pfLamp * rim * rim * sqrt(rim) * smoothstep(-0.7, 0.8, dot(n.xy, side)) * mix(vec3(0.6), skin, 0.6) * 1.1;
}
// The grain of pollen here.
void pfGrain(inout vec3 col) {
  vec2 q = pfQ / max(pfR, 1e-3);
  float r = length(q);
  if (r > 1.9) return;
  float b = 1.2 * pfPx / max(pfR, 1e-3), N = pfK == 1 ? 13.0 : pfK == 2 ? 11.0 : 8.0, space = PI / N;
  vec3 make = pfWorld(uOwn[3], vec3(0, 0, 1), PF_MAKE[pfK], vec3(0.36, 0.15, 0)), skin = pfTint(), fire = pfFire();
  make.x *= 1.0 + 0.5 * pfOn + 0.5 * (uTone - 0.5);
  col += fire * 0.2 * exp(-r * r * 0.77) * pfOff(1.0, 1.75, r) * smoothstep(0.0, 0.02, pfR);
  vec2 t1 = vec2(0.6 + 1.3 * float(pfK), (pfK == 1 ? -0.5 : 0.5 + float(pfK)) - pfRoll), C = cos(t1), S = sin(t1);
  mat3 m = mat3(C.x, 0.0, -S.x, S.x * S.y, C.y, C.x * S.y, S.x * C.y, -S.y, C.x * C.y);
  float R = 1.0 + 0.45 * make.x;
  vec3 o = normalize(vec3(q, sqrt(max(R * R - r * r, 0.0)) + 1e-4)) * m;
  vec3 body = r < 1.0 ? vec3(q, sqrt(1.0 - r * r)) : vec3(q / r, 0.0);
  float th = acos(clamp(o.y, -1.0, 1.0)), ph = atan(o.z, o.x + 1e-5);
  float row0 = floor(th / PI * N), f1 = 4.0, f2 = 4.0, zTop = -2.0, spike = 0.0, along = 0.0;
  vec3 s1 = vec3(0.0), s2 = vec3(0.0), spikeN = vec3(0.0, 0.0, 1.0);
  int j = 0;
  do { // the six spikes, or cells of the net, that may be here
    float row = clamp(row0 - 1.0 + float(j / 2), 0.0, N - 1.0), tt = (row + 0.5) * space, n = max(floor(2.0 * N * sin(tt) + 0.5), 3.0), off = hash11(row + 2.0);
    float f = ph / TAU * n + off, c = floor(f) + (j % 2 == 0 ? 0.0 : fract(f) < 0.5 ? -1.0 : 1.0);
    float h = hash21(vec2(mod(c, n), row) + 0.5), pa = (c + 0.5 + 0.4 * (h - 0.5) - off) / n * TAU, ta = tt + 0.3 * (fract(h * 57.0) - 0.5) * space, st = sin(ta);
    vec3 s = m * vec3(st * cos(pa), cos(ta), st * sin(pa));
    float d = 2.0 - 2.0 * dot(s, body);
    if (d < f1) { f2 = f1; s2 = s1; f1 = d; s1 = s; } else if (d < f2 && d > f1) { f2 = d; s2 = s; }
    float len = make.x * (0.85 + 0.3 * fract(h * 13.0));
    vec2 e = s.xy * len, v = q - s.xy * 0.97;
    float t = sat(dot(v, e) / (dot(e, e) + 1e-4)), w = 0.12 * (0.1 + 0.9 * (1.0 - t) * sqrt(1.0 - t)) * sat(make.x * 12.0);
    v -= e * t;
    float dist = length(v), a = pfIn(dist, w, b) * step(0.015, make.x) * (s.z < 0.0 ? smoothstep(1.0 - b, 1.0 + b, r) : 1.0), z = s.z * (1.0 + len * t);
    if (a > 0.02 && z > zTop) {
      zTop = z; spike = a; along = t;
      v /= max(w, dist + 1e-4);
      spikeN = vec3(v, sqrt(max(1.0 - dot(v, v), 0.0)) + 0.1) + 0.5 * s;
    }
  } while (++j < 6);
  f1 = sqrt(max(f1, 0.0)); f2 = sqrt(max(f2, 0.0));
  // the net: walls where two cells meet, hollow between; and three lens-shaped furrows from pole to pole
  float wall = 1.0 - smoothstep(0.0, 0.42 * space, f2 - f1), st = sin(th), fw = 0.2 * smoothstep(0.25, 0.95, st) + 0.001;
  float slit = make.z * (1.0 - smoothstep(0.35 * fw, fw + b, abs(fract(ph / TAU * 3.0) - 0.5) * TAU / 3.0 * st));
  vec3 n = body + ((s1 - s2) * make.y * 0.55 * smoothstep(0.0, 0.5, wall) * (1.0 - smoothstep(0.6, 1.0, wall)) + (body - s1) * 0.5 * make.z) / space;
  vec3 sk = skin * (1.0 - 0.55 * make.y * (1.0 - wall)) * (1.0 - 0.75 * slit) * mix(1.0, 0.5 + 0.5 * smoothstep(0.1, 0.5, f1 / space), sat(make.x * 6.0));
  float glow = 0.25 + 0.75 * smoothstep(-0.9, 1.0, dot(body, vec3(pfL.xy, 0.5)));
  vec3 c = pfLit(normalize(n + vec3(0.0, 0.0, 1e-3)), q, sk) + fire * glow * (0.25 + 0.75 * body.z) * mix(1.0, 0.3 + 1.1 * wall, make.y) * (1.0 - 0.6 * slit);
  vec3 cs = pfLit(normalize(spikeN), q, skin * (0.85 + 0.6 * along)) + fire * glow * (0.3 + 0.9 * along);
  col = mix(col, mix(c, cs, spike), max(pfIn(r, 1.0, b), spike) * step(0.003, pfR));
}
// A puff of grains shaken loose by a hit, d from where: it spreads as the hit dies.
float pfPuff(vec2 d) {
  float age = max(1.0 - uHits, 0.0), a = 0.5 * exp(-dot(d, d) / pfSq(0.07 + 0.11 * age)), n = 0.0;
  do {
    float h = fract(n * 0.618 + 0.3);
    vec2 at = vec2(cos(n * 2.4), 0.8 * sin(n * 2.4)) * (0.05 + (0.06 + 0.16 * h) * sqrt(age)) - vec2(0.02, 0.05) * age * age;
    a += 1.4 * pfOff(0.003, 0.012, distance(d, at));
  } while (++n < 10.0);
  return a * uHits;
}
// Dust in the air, more of it with the texture.
float pfDust(vec2 p, float n) {
  vec2 q = p * n + vec2(0.006, -0.004) * n * uTime, id = floor(q);
  float h = hash21(id + n), g = fract(h * 91.0);
  q -= id + 0.5 + 0.28 * vec2(sin(uTime * 0.21 + h * 40.0), cos(uTime * 0.17 + g * 40.0));
  return pfOff(0.0, 0.03 + 0.07 * g + pfPx * n, length(q)) * smoothstep(0.0, 0.2, 0.06 + 0.3 * uTexture - h) * (0.4 + g);
}
// Where the eye stands (across, up, how near).
void pfZoom(vec3 near, vec3 far) {
  vec3 z = pfWorld(uOwn[5], near, vec3(0.0, 0.0, 1.0), far);
  pfP = pfP / z.z + z.xy;
  pfPx = 0.8 / (uRes.y * z.z);
}

// ---- a: inside the coat
// A near hair: its root, lean, curl and half width, and how long its barbs are.
void pfHair(inout vec3 col, vec4 hair, float seed, float barb) {
  barb *= pfComb;
  float y = pfP.y + 0.56, curl = hair.z + pfSway, dx = pfP.x - hair.x - hair.y * y - curl * y * y;
  float slope = hair.y + 2.0 * curl * y, c = inversesqrt(1.0 + slope * slope);
  float u = dx * c, s = y / c + dx * slope * c, w = hair.w * max(1.15 - 0.6 * y, 0.2), au = abs(u), e = clamp(u / w, -1.0, 1.0);
  if (au > max(0.6 * w + max(1.36 * barb, 0.005), w + pfPx)) return;
  float side = u > 0.0 ? 1.0 : 0.0, v = max(au - 0.6 * w, 0.0), gap = 0.22 * barb + 0.011, tilt = 1.0 + 0.4 * sin(s * 8.0 + seed * 40.0 + side * 2.0);
  float f = (s - v * tilt + 0.5 * (2.0 - tilt) * v * v / max(barb, 0.01)) / gap + 0.5 * side + seed * 7.3, k = floor(f);
  float h = hash11(k + seed * 37.0 + side * 0.37), len = barb * (0.35 + h * (0.6 + 0.4 * fract(h * 19.0))), out_ = sat(v / max(len, 0.005));
  float bw = min(0.16 * w + 0.0016, 0.3 * gap) * sqrt(1.0 - out_) * sat(barb * 60.0), bd = (f - k - 0.5 - 0.5 * (fract(h * 31.0) - 0.5)) * gap * 0.72;
  float ba = pfIn(abs(bd), bw, pfPx) * pfOff(0.9, 1.0, out_) * min(1.0, (bw + 0.0005) / pfPx * 1.4);
  // a thin bright edge where the sun comes through, a dull cool edge away from it
  float lit = smoothstep(-0.5, 1.0, e * pfSide);
  vec3 shaft = pfCoat * pfLamp * pfPower * (0.015 + 0.32 * lit * lit * lit + 2.0 * pfSq(e * e * e) * (0.06 + 0.94 * lit));
  shaft += pfCoat * (pfFill * 0.14 * pfOff(-1.0, -0.2, e * pfSide) + pfAir * 0.012);
  vec3 br = pfCoat * pfLamp * pfPower * (0.35 + 0.8 * out_) * (0.6 + 0.6 * smoothstep(-bw - 1e-4, bw + 1e-4, bd)) + pfFill * 0.12;
  br = br * (1.0 + 1.4 * uTexture * (0.4 + 0.6 * h)) + pfLamp * uKeys * smoothstep(0.82, 0.95, h) * out_ * 0.9;
  col = mix(mix(col, br, ba), shaft, pfIn(au, w, pfPx));
}
// Five ranks of soft hairs: they come slowly toward us with the travel. air is the light behind them.
void pfRanks(inout vec3 col, vec3 air) {
  float i = 0.0, tr = uTravel * 0.02, y = pfP.y + 0.56;
  do {
    float t = (i + fract(tr)) / 5.0, seed = mod(i - floor(tr), 61.0) + 1.0, show = smoothstep(0.0, 0.2, t) * pfOff(0.8, 1.0, t);
    float cell = mix(0.07, 0.3, t * t) / (1.0 + 0.4 * uOwn[4]), w = mix(0.0055, 0.032, t * t);
    float x = pfP.x - (0.2 * pfP.x + 0.12 + 0.16 * sin(seed * 2.4) + pfSway) * y * y + seed * 0.371, n = floor(x / cell - 0.5), last = n + 1.5;
    do {
      float h = hash21(vec2(n, seed)), g = fract(h * 57.3);
      float d = (x - (n + 0.5 + 0.4 * (h - 0.5) + 0.5 * (g - 0.5) * y * y) * cell) / (w * (0.6 + 0.8 * g) * (1.15 - 0.5 * min(y, 1.6)));
      float lit = smoothstep(-1.2, 1.2, d * pfSide);
      vec3 c = mix(air * (0.5 + 0.6 * lit), pfCoat * (air * (0.04 + 1.3 * lit * lit * lit) + pfLamp * 0.018 * lit), 0.35 + 0.6 * t);
      col = mix(col, c, show * max(0.82 * pfIn(abs(d), 1.0, mix(0.9, 0.35, t)), (0.12 + 0.12 * t) / (1.0 + 0.2 * d * d)));
    } while (++n < last);
  } while (++i < 5.0);
}
const vec3 PF_AT[9] = vec3[9](vec3(-0.21, -0.07, 0.155), vec3(0.55, 0.17, 0.1), vec3(0.06, 0.28, 0.066), vec3(0.25, -0.21, 0.072), vec3(0.62, -0.23, 0.058),
  vec3(-0.47, 0.24, 0.11), vec3(0.34, 0.36, 0.08), vec3(-0.45, -0.31, 0.085), vec3(0.36, 0.03, 0.06));
void pfInCoat(inout vec3 col) {
  pfZoom(vec3(0.0, -0.12, 1.35), vec3(0.0, 0.2, 0.78));
  vec2 p = pfP;
  float hour = uOwn[0];
  pfSun = vec2(0.33, pfWorld(hour, 0.2, -0.03, 0.3));
  pfLamp = pfWorld(hour, vec3(0.34, 0.5, 0.78), vec3(1.55, 0.86, 0.26), vec3(1.5, 1.35, 1.0)) * (1.0 + 0.35 * uPad + 0.15 * uLevel) + vec3(0.35, 0.42, 0.5) * pfDay;
  pfAir = pfWorld(hour, vec3(0.05, 0.1, 0.19), vec3(0.8, 0.36, 0.07), vec3(0.8, 0.76, 0.56));
  pfFill = pfWorld(hour, vec3(0.03, 0.05, 0.1), vec3(0.075, 0.05, 0.055), vec3(0.28, 0.3, 0.32)) + vec3(0.18, 0.22, 0.28) * pfDay;
  pfCoat = pfWorld(uOwn[1], vec3(0.85, 0.9, 0.88), vec3(0.95, 0.6, 0.2), vec3(0.75, 0.17, 0.06));
  // how far the hairs here lean: a breath, the band of their rank, and the hum
  float rank = sat(0.5 + p.x / 1.9);
  pfSway = 0.012 * sin(uTime * 0.31 + p.x * 2.3) + 0.05 * band(rank) * sin(uTime * 0.83 + rank * 13.0) + 0.003 * uDrone * sin(uTime * 5.3 + p.y * 21.0 + p.x * 9.0);
  // the air: the sun low behind the fur
  vec2 d = p - pfSun;
  float sd = length(d * vec2(0.9, 1.15)), ray = pfSq(noise(d / (length(d) + 0.02) * 5.0 + uTime * 0.02)), near = exp(-sd * 1.7);
  pfSide = clamp(-d.x * 9.0, -1.0, 1.0);
  pfPower = 0.12 + 1.25 * near;
  vec3 air = pfAir * (0.04 + 1.3 * exp(-sd * 3.0) + (0.2 + 0.9 * uPad) * ray * near) * (0.9 + 0.25 * uLevel) + pfLamp * 0.6 * exp(-sd * sd * 34.0);
  air *= mix(vec3(1.0, 0.5, 0.36), vec3(1.0), near);
  air += vec3(0.26, 0.34, 0.42) * pfDay * smoothstep(-0.2, 0.6, p.y + 0.3 * p.x) * (0.4 + 1.2 * ray);
  col = air + pfLamp * pfOff(0.055, 0.075, sd) * 0.9;
  // grains far off and out of focus, behind the ranks
  float n = 0.0;
  do {
    vec2 at = vec2(-0.7 + 1.55 * fract(n * 0.618 + 0.33), -0.2 + 0.56 * fract(n * 0.381 + 0.45) + 0.006 * sin(uTime * 0.23 + n));
    vec4 pc = piece(vec2(0.5 + at.x / 1.8, 0.5 - at.y));
    float r = (0.026 + 0.005 * n + 0.014 * pc.a) * smoothstep(-1.0, -0.2, uOwn[2]) * (1.0 + 0.5 * max(uOwn[2], 0.0)) * pfSq(pfBig());
    vec3 c = mix(pfCoat, vec3(0.9, 0.36, 0.06), 0.6) * (0.6 * pfFill + pfLamp * (0.14 + 0.6 * smoothstep(-0.8, 1.2, (p.x - at.x) / (r + 0.001))));
    col = mix(col, c + pc.rgb * pc.rgb * (0.3 + uEnergy), pfIn(distance(p, at), r, 0.01) * sat(r * 80.0));
  } while (++n < 6.0);
  pfRanks(col, air);
  // the dark armour the hairs stand in
  float under = -0.37 + 0.05 * cos(p.x * 2.1 - 0.5) - 0.03 * p.x - p.y, deep = max(under, 0.0);
  float streak = (0.5 + 0.5 * sin(p.x * 41.0 + 2.0 * sin(p.x * 17.0))) * (0.5 + 0.5 * sin(p.x * 11.0 + 1.0));
  vec3 arm = vec3(0.004, 0.003, 0.004) + pfLamp * pfAir * exp(-pfSq(d.x * 2.2)) * (0.8 * streak * exp(-deep * 24.0) + 0.5 * exp(-deep * 60.0));
  col = mix(col, arm, smoothstep(-0.005, 0.005, under));
  pfComb = pfWorld(uOwn[4], 0.0, 1.0, 1.7);
  pfHair(col, vec4(-0.5, 0.0, 0.34, 0.016), 0.13, 0.055);
  pfHair(col, vec4(-0.08, 0.02, 0.17, 0.012), 0.37, 0.05);
  pfHair(col, vec4(0.17, 0.02, 0.36, 0.016), 0.71, 0.055);
  pfHair(col, vec4(0.62, 0.02, 0.12, 0.018), 0.53, 0.06);
  // the grains we stand among: here the nearest
  int i = 0, m = 0;
  vec3 g = vec3(0.0, 0.0, 1.0);
  float roll = 0.09 * sin(uTravel * 0.16), best = 1e3;
  do {
    vec3 at = PF_AT[i];
    if (i == 3) at.xy += vec2(roll, 0.5 * roll * roll);
    float far = distance(p, at.xy) / at.z;
    if (far < best) { best = far; m = i; g = at; }
  } while (++i < 9);
  float few = float(m);
  pfHear(m < 5 ? m : m - 4, g.xy);
  pfR = g.z * pfBig() * (1.0 + 0.1 * pfOn) * (m == 0 ? 1.0 : m < 5 ? smoothstep(-1.0, -0.5, uOwn[2]) : smoothstep(0.1 * few - 0.5, 0.1 * few, uOwn[2]));
  pfRoll = m == 3 ? roll / g.z : 0.0;
  pfQ = p - g.xy - 0.004 * sin(uTime * 0.37 + few * 2.0);
  pfL = normalize(vec3(pfSun - g.xy, -0.28));
}
void pfBefore(inout vec3 col) {
  pfHair(col, vec4(-0.27, 0.05, -0.22, 0.01), 0.91, 0.04);
  pfHair(col, vec4(0.42, 0.06, 0.04, 0.011), 0.61, 0.05);
  pfHair(col, vec4(-0.76, 0.1, -0.04, 0.085), 0.47, 0.13);
}

// ---- b: in the flower
// A petal standing up round us: polar is angle and distance, shape its middle angle, half width and length.
void pfPetal(inout vec3 col, vec2 polar, vec3 shape, vec3 deep, vec3 pale, float seed) {
  float soft = 0.02 + 0.004 * seed, t = polar.y / shape.z, across = (polar.x - shape.x) / shape.y + 0.05 * sin(polar.y * 7.0 + seed * 5.0);
  float wide = sqrt(1.0 - pfSq(pfSq(min(t, 1.0)))) + 1e-3, e = abs(across) / wide, ss = soft / (shape.y * polar.y * wide + 0.02), a = pfIn(e, 1.0, ss) * pfIn(t, 1.0, soft);
  float fold = 0.5 + 0.5 * sin(across * 4.5 + seed * 3.0 + polar.y * 1.5), vein = 0.5 + 0.5 * sin(across * 47.0 + 3.0 * fold);
  vec3 c = mix(deep, pale, pfSq(smoothstep(0.46, 1.06, t + 0.1 * fold))) * (0.6 + 0.4 * fold) * (1.0 - 0.14 * vein * pfOff(0.5, 1.1, t)) * (seed > 2.5 ? 0.82 : 1.0);
  c += pale * 0.5 * smoothstep(0.8, 0.99, e) * smoothstep(0.3, 0.9, t);
  col *= 1.0 - 0.45 * pfOff(1.0, 1.4 + ss, e) * pfOff(0.97, 1.02, t);
  col = mix(col, c, a);
}
// The stamens: root and head; bow, thickness, size and lean of the head.
const vec4 PF_PLACE[5] = vec4[5](vec4(-0.78, -0.85, -0.32, -0.04), vec4(-0.14, -0.8, 0.02, 0.26), vec4(0.26, -0.75, 0.25, 0.1), vec4(0.66, -0.75, 0.4, -0.16), vec4(-1.5, -0.2, -0.68, 0.27));
const vec4 PF_BUILD[5] = vec4[5](vec4(0.07, 0.075, 0.27, -0.3), vec4(0.05, 0.036, 0.15, 0.3), vec4(-0.05, 0.026, 0.11, -0.25), vec4(0.06, 0.04, 0.165, 0.55), vec4(0.1, 0.034, 0.14, -0.7));
// A filament from a to b, blushing toward its root.
void pfFilament(inout vec3 col, vec2 a, vec2 b, vec4 build) {
  vec2 ab = b - a, nrm = vec2(-ab.y, ab.x), d = pfP - a;
  float bow = 4.0 * (build.x + pfWorld(uOwn[4], -build.x, 0.0, 0.2)), l2 = dot(ab, ab), h = sat(dot(d, ab) / l2);
  h = sat(h - 0.5 * bow * (1.0 - 2.0 * h) * (bow * h * (1.0 - h) - dot(d, nrm) / l2));
  d -= ab * h + nrm * bow * h * (1.0 - h);
  float w = build.y * mix(1.6, 0.65, h), e = clamp(dot(d, nrm) / (sqrt(l2) * w), -1.0, 1.0), lit = pfOff(-1.0, 1.0, e);
  vec3 c = pfCoat * (pfFill + pfLamp * (0.04 + 0.36 * lit * lit + 0.75 * e * e * e * e));
  c = mix(c, c * pfAir * 1.5 + pfAir * 0.12, 1.0 - smoothstep(0.2, 1.0, h - 0.15 * e)) + pfLamp * 0.5 * exp(-pfSq((e + 0.5) * 6.0)) * h;
  col = mix(col, c, pfIn(length(d), w, pfPx));
}
// The split head of a stamen, crusted with grains, d from its middle; then the great grain on it.
void pfHead(inout vec3 col, vec2 d, vec4 build) {
  float fk = float(pfK), size = build.z;
  mat2 turn = rot(-build.w);
  d = turn * d / size; // d.x across the head, d.y along it
  vec2 q = d;
  d.x += 0.3 * d.y * d.y - 0.08;
  pfL = normalize(vec3(turn * vec2(-0.66, 0.7), 0.3));
  // two lobes side by side, split between
  float ya = clamp(d.y, -0.74, 0.74), gap = 0.21 + 0.07 * pfSq(ya + 0.1) + 0.04 * pfOn, fat = 0.27 * sqrt(1.0 - 0.8 * ya * ya);
  vec2 l1 = vec2(abs(d.x) - gap, d.y - ya) / fat;
  float s = length(l1), cov = pfIn(s, 1.0, pfPx / (size * fat)), cleft = smoothstep(0.0, 0.2, abs(d.x));
  vec3 n = vec3(l1 * vec2(d.x > 0.0 ? 1.0 : -1.0, 1.0), sqrt(max(1.0 - s * s, 0.0))), skin = pfTint(), glow = pfFire();
  float form = (0.18 + 1.4 * pfSq(sat(dot(n, pfL) * 0.7 + 0.4))) * (0.45 + 0.55 * cleft);
  col = mix(col, skin * vec3(0.3, 0.18, 0.16) * form * pfLamp, cov);
  float full = (1.25 - smoothstep(0.55, 1.0, s) * (0.2 + 0.75 * noise(d * 3.3 + fk * 5.0))) * pfOff(0.98, 1.12, s) * pfWorld(uOwn[2], 0.1, 1.0, 1.5), up = 0.0;
  if (s < 1.12) do { // the crust, two layers of grains
    float many = (11.0 - 3.0 * up) / pfSq(pfBig());
    vec2 g = rot(0.5 * up) * d * many + fk * 3.7 + up;
    g.x += 0.5 * mod(floor(g.y), 2.0);
    float h = hash21(floor(g) + fk), r = max((0.36 + 0.13 * fract(h * 43.0)) * smoothstep(h - 0.1, h + 0.15, full * (1.0 - 0.4 * up)), 0.05), b = pfPx * many / (size * r);
    vec2 x = (fract(g) - 0.5 - 0.26 * (vec2(fract(h * 61.0), fract(h * 91.0)) - 0.5)) / r, y = rot(h * 3.0) * x;
    float l2 = dot(x, x), l = sqrt(l2) * (1.0 + 0.6 * y.x * y.x * y.y * y.y / (l2 * l2 + 0.01)), z = sqrt(max(1.0 - l * l, 0.0));
    vec3 c = pfLit(vec3(x, z), x, skin * (0.6 + 0.4 * up) * (0.7 + 0.5 * fract(h * 17.0))) * (0.3 + 0.7 * z) + glow * z * (0.3 + h) + pfLamp * (uKeys * step(0.86, h) * 0.5 + uTexture * pfSq(pfSq(fract(h * 29.0))) * 0.35) * z;
    col = mix(col, c * form, pfIn(l, 1.0, b) * step(0.06, r) * step(0.02, full));
  } while (++up < 2.0);
  float roll = pfK == 3 ? 0.4 * sin(uTravel * 0.16) : 0.0, r = (pfK == 2 ? 0.24 : 0.36) * (1.0 + 0.1 * pfOn) * pfWorld(uOwn[2], 0.0, 1.0, 1.15) * pfBig();
  q -= pfK == 0 ? vec2(0.22, 0.34) : pfK == 1 ? vec2(-0.26, 0.42) : pfK == 3 ? vec2(0.1 - 0.3 * roll * roll, roll) : vec2(-0.1, 0.4);
  col *= 1.0 - 0.6 * exp(-dot(q, q) / (r * r + 1e-3) * 0.6) * cov * sat(r * 9.0);
  pfQ = q * size; pfR = r * size; pfRoll = roll / 0.36;
}
// The great soft visitor: a blur of stripes, never sharp.
void pfVisitor(inout vec3 col) {
  vec2 d = pfP - vec2(0.66, 0.15) - vec2(0.012 * sin(uTime * 0.23), 0.018 * sin(uTime * 0.31 + 1.0));
  vec3 gold = pfWorld(uOwn[1], vec3(0.85, 0.86, 0.82), vec3(0.98, 0.5, 0.06), vec3(0.85, 0.16, 0.03));
  // the wings, two pale smears that a cue opens wider
  float open = 0.5 + 1.2 * uCue * (1.0 - uCue) + 0.02 * sin(uTime * 0.9), i = 0.0;
  do {
    float e = length((rot(open + 0.7 * i) * (d - vec2(-0.02, 0.14)) - vec2(0.0, 0.24)) / vec2(0.085, 0.27));
    col = mix(col, col * 0.6 + pfLamp * (0.22 + 0.5 * exp(-pfSq((e - 0.9) * 4.0))) * (0.7 + pfDay), pfOff(0.6, 1.3, e) * (0.45 + 0.3 * pfDay));
  } while (++i < 2.0);
  vec2 b = rot(0.62) * d; // b.x along the body, the tail end low at the left
  b.y += 0.5 * b.x * b.x;
  float x = b.x / 0.4, y = b.y / (0.26 - 0.026 * x), e = length(vec2(x, y)) + 0.05 * (noise(b * 13.0 / (length(b) + 0.1)) - 0.5), s = x + 0.12 * y * y;
  vec3 c = mix(vec3(0.95, 0.82, 0.6), vec3(0.02, 0.01, 0.01), smoothstep(-0.8, -0.46, s));
  c = mix(c, gold, smoothstep(-0.36, -0.08, s) * pfOff(0.0, 0.28, s) + smoothstep(0.42, 0.7, s));
  c = c * (pfFill + pfLamp * (0.06 + 0.8 * sat(0.4 - 0.34 * x + 0.62 * y + 0.2 * sqrt(max(1.0 - e * e, 0.0))))) + pfLamp * gold * 0.8 * smoothstep(0.62, 1.05, e) * smoothstep(-0.5, 0.8, y - 0.4 * x);
  col = mix(col, c, pfOff(0.7, 1.25, e));
}
void pfInFlower(inout vec3 col) {
  pfZoom(vec3(-0.26, 0.06, 1.5), vec3(0.04, -0.03, 0.76));
  vec2 p = pfP;
  float hour = uOwn[0];
  pfLamp = pfWorld(hour, vec3(0.36, 0.46, 0.85), vec3(1.5, 1.2, 0.8), vec3(1.5, 1.42, 1.25)) * (0.95 + 0.25 * uPad + 0.1 * uLevel) + vec3(0.3) * pfDay;
  pfFill = pfWorld(hour, vec3(0.04, 0.05, 0.12), vec3(0.16, 0.065, 0.085), vec3(0.42, 0.36, 0.36)) + vec3(0.06) * pfDay;
  pfCoat = vec3(0.86, 0.9, 0.58);
  vec3 sky = pfWorld(hour, vec3(0.06, 0.1, 0.26), vec3(2.0, 1.45, 0.85), vec3(2.2, 2.2, 2.1));
  vec3 light = pfLamp * 0.8;
  vec3 deep = pfWorld(uOwn[1], vec3(0.03, 0.08, 0.1), vec3(0.13, 0.004, 0.04), vec3(0.14, 0.006, 0.003)) * light;
  vec3 pale = pfWorld(uOwn[1], vec3(0.9, 0.98, 0.9), vec3(1.22, 0.33, 0.48), vec3(1.0, 0.17, 0.04)) * light;
  pfAir = mix(deep, pale, 0.4);
  col = sky * (0.55 + 0.6 * exp(-length(p - vec2(0.3, 0.35)) * 2.0));
  vec2 d = p - vec2(0.02, -1.05), polar = vec2(atan(d.x, d.y + 1e-5) - 0.012 * sin(uTime * 0.19) - 0.02 * uLow * sin(uTime * 0.47), length(d));
  pfPetal(col, polar, vec3(0.62, 0.34, 1.4), deep, pale, 4.0);
  pfPetal(col, polar, vec3(-0.12, 0.4, 1.6), deep, pale, 3.0);
  pfPetal(col, polar, vec3(0.27, 0.25, 1.16), deep, pale, 2.0);
  pfPetal(col, polar, vec3(-0.62, 0.42, 1.75), deep, pale, 1.0);
  pfPetal(col, polar, vec3(1.02, 0.34, 1.6), deep, pale, 5.0);
  col += pfLamp * (0.05 + 0.07 * uPad + 0.4 * pfDay) * exp(-2.0 * length(p - vec2(-0.62, 0.7)));
  pfVisitor(col);
  // the stamens, and the head that is nearest here
  int k = 0, i = 4;
  vec2 head = vec2(0.0);
  float best = 1e3;
  do {
    float fi = float(i);
    vec2 b = PF_PLACE[i].zw;
    b.x += 0.007 * sin(uTime * 0.27 + fi * 1.7) + 0.025 * uBands[3 * i] * sin(uTime * 0.71 + fi * 2.1) + 0.014 * uPhrase * sin(uTime * 0.47 - fi * 1.3) + 0.0015 * uDrone * sin(uTime * 5.1 + fi);
    pfFilament(col, PF_PLACE[i].xy, b, PF_BUILD[i]);
    float far = distance(p, b) / PF_BUILD[i].z;
    if (far < best) { best = far; k = i; head = b; }
  } while (--i >= 0);
  pfHear(k, head);
  pfHead(col, p - head, PF_BUILD[k]);
}

vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  pfP = p;
  pfDay = uCue * (0.6 + 0.4 * uEnergy);
  if (uVar < 0.5) pfInCoat(col); else pfInFlower(col);
  pfGrain(col);
  col += (pfLamp * 0.4 + uKind[4] * uKind[4] * 0.8) * (1.0 + 0.5 * uVar) * pfPuff(pfP - (uVar < 0.5 ? PF_AT[4].xy : vec2(-0.67, 0.32)));
  if (uVar < 0.5) pfBefore(col);
  col += pfLamp * vec3(0.4, 0.3, 0.13) * pfDust(pfP, 12.0) * (1.0 + uVar);
  return screenOf(col);
}
