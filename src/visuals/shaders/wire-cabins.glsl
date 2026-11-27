// name: Wire cabins
// a: Above the cloud
// b: Lit chain
// what: A cable sags over a white sea of cloud towards a station on a far blue peak, and round-cornered cabins ride it, one of them red, its shadow in a pale ring of colours on the cloud; or a night slope with firs seen from below, where lit cabins climb in a chain through torn mist, each with its cone of light on the snow.
// follows: Each kind of sound lights its own cabins; drone lifts the cloud, pad is its peach light, texture tears shreds from it, a phrase sways the line so cabins nod in turn. Bands are sixteen far peaks, the piece tints the banks, loop slants the sun or moon. A hit swings the nearest cabin, a cue opens a valley with a village. Keys light windows, voice the station.
// own: 0 the hour: over the cloud moonlit night at -1 and red evening at 1, on the slope white winter day at -1 and violet dusk at 1; 1 cloud or mist opens on the village at -1, thickens at 1; 2 round bubble cabins at -1 over flat cloud or under a great moon, long trams at 1 over heaped cloud or drifts; 3 a lone cabin at -1, a close string at 1; 4 horizon high or much sky at -1, close by one cabin at 1; 5 low domes, bare slopes at -1, needles, thick forest at 1
#define wcIf(c) for (int once = 0; once < 1 && (c); once++)
const vec3 wcWarm = vec3(1.0, 0.74, 0.4);
vec3 wcTop, wcMid, wcLow, wcLit, wcDim, wcDeep, wcInk, wcW; // the hour's colours; how much day, night, evening
vec4 wcKz, wcKw; vec3 wcSag; // the line: where its masts stand, how high, how it sags
float wcA, wcB, wcHz, wcH, wcSp, wcPh, wcPx, wcLc, wcOpen, wcClock, wcRnd, wcTram;
vec4 wcVil; vec2 wcMa, wcVc, wcFh; // the village, the masts, its place, the far peaks: how high, which side
float wcHash(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
vec2 wcN1s(float x) { float i = floor(x), f = x - i, a = wcHash(i), b = wcHash(i + 1.0); return vec2(mix(a, b, f * f * (3.0 - 2.0 * f)), (b - a) * 6.0 * f * (1.0 - f)); }
float wcN1(float x) { return wcN1s(x).x; }
float wcR(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); } // a soft step, up or down
float wcIn(float e, float d) { return 1.0 - wcR(-e, e, d); }
vec3 wcN2(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f), du = 6.0 * f * (1.0 - f);
  float a = hash21(i), b = hash21(i + vec2(1, 0)), c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1)), k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}
// Round lumps with creases between them, as a cloud has, and how they lean.
vec3 wcLumps(vec2 q, int n) {
  vec3 s = vec3(0.0); float a = 0.55, sc = 1.0; mat2 m = mat2(1.0);
  for (int i = 0; i < 4 && i < n; i++) {
    vec3 v = wcN2(q); float w = 2.0 * v.x - 1.0, r = sqrt(w * w + 0.04);
    s += vec3(r, ((w / r) * 2.0 * v.yz) * m * sc) * a;
    const mat2 t = mat2(0.8, 0.6, -0.6, 0.8);
    q = t * q * 2.05 + vec2(3.7, 1.9); m = t * m; sc *= 2.05; a *= 0.43;
  }
  return s;
}
float wcBox(vec2 q, vec2 h, float r) { q = abs(q) - h + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 wcHour(vec3 day, vec3 night, vec3 eve) { return day * wcW.x + night * wcW.y + eve * wcW.z; }
// ---- the line and its cabins
float wcZ(float x) { return abs(wcA) / max((x - wcB) * sign(wcA), 0.02); }
float wcWire(float z) {
  float n = step(wcKz.y, z) + step(wcKz.z, z);
  vec4 e = n < 0.5 ? vec4(wcKz.xy, wcKw.xy) : n < 1.5 ? vec4(wcKz.yz, wcKw.yz) : vec4(wcKz.zw, wcKw.zw);
  float u = sat((z - e.x) / (e.y - e.x)), sag = n < 0.5 ? wcSag.x : n < 1.5 ? wcSag.y : wcSag.z;
  return wcHz + (mix(e.z, e.w, u) - 4.0 * u * (1.0 - u) * sag) / z;
}
vec2 wcHang(float z) { return vec2(wcB + wcA / z, wcWire(z)); }
vec2 wcNear(float z, float more) { float k = floor((z - 0.5) / wcSp - fract(wcPh) + 0.5) + more; return vec2(0.5 + wcSp * (k + fract(wcPh)), k - floor(wcPh)); }
float wcThere(float z) { return wcR(0.5, 0.62, z) * (1.0 - wcR(wcKz.w - 0.5, wcKz.w - 0.15, z)); }
float wcPaint(float id) { return mod(id + 2.0, 3.0); }
// A cabin's light, and in w how loud its kind of sound is.
vec4 wcLamp(float id) {
  float k = uVar < 0.5 ? 3.0 : wcPaint(id), kind = mod(id, 5.0), lv = kind < 0.5 ? uDrone : kind < 1.5 ? uPad : kind < 2.5 ? uTexture : kind < 3.5 ? uPhrase : uHits;
  vec3 c = kindColour(kind);
  return vec4(mix(k < 0.5 ? vec3(1.0, 0.68, 0.28) : k < 1.5 ? vec3(1.0, 0.45, 0.46) : k < 2.5 ? vec3(0.42, 0.9, 0.62) : wcWarm, c / max(max(c.r, max(c.g, c.b)), 0.2), 0.5 * lv), lv);
}
// A cabin: q is the place seen from its grip; e one pixel there.
vec4 wcCabin(vec2 q, float e, float id, float lit, vec3 lamp, float door) {
  float hw = 0.5 + 0.22 * wcTram - 0.06 * wcRnd, hh = 0.37 + 0.06 * wcRnd - 0.03 * wcTram, paint = wcPaint(id);
  vec3 body = paint < 0.5 ? vec3(0.88, 0.2, 0.1) : paint < 1.5 ? vec3(0.93, 0.87, 0.74) : vec3(0.2, 0.39, 0.5);
  float arm = wcIn(e, min(min(max(abs(q.x - 0.09 * sin(PI * sat(-q.y / 0.55)) * (1.0 - wcRnd)) - 0.026, abs(q.y + 0.29) - 0.29), length(vec2(abs(q.x) - 0.11, q.y - 0.045)) - 0.05), max(abs(abs(q.y + 0.265) - 0.265) - 0.033, abs(q.x) - 0.16 + 0.3 * q.y)));
  float xc = -0.36 * hw, sx = q.x - xc, v = (q.y + 0.55 + hh) / (1.0 - 0.13 * max(sx, 0.0) - 0.28 * max(-sx, 0.0)), up = v / hh, side = 1.0 - wcIn(0.035 + 0.1 * wcRnd, sx);
  float a = wcIn(e, wcBox(vec2(q.x * (1.0 + 0.1 * sat(-up)), v), vec2(hw, hh), 0.14 + 0.25 * wcRnd - 0.1 * wcTram));
  vec3 light = mix(wcDim * 0.86, mix(wcLit, wcDim, 0.15), side) * (0.86 + 0.16 * up), c = body * light;
  c = mix(c, (paint < 0.5 ? vec3(0.95, 0.9, 0.8) : vec3(0.8, 0.22, 0.12)) * light, 0.9 * wcIn(e, abs(v + 0.5 * hh) - 0.03));
  c = mix(mix(c, wcInk, 0.75 * wcR(0.8, 0.88, -up)), wcLit, 0.6 * wcR(0.8, 0.86, up));
  // the windows: three along the side, one in the end
  float s = sx / (hw - xc), n = clamp(floor(s * 3.0), 0.0, 2.0), cw = (hw - xc) / 3.0, low = sx > 0.0 && n > 0.5 && n < 1.5 ? 0.1 + 0.26 * door : 0.0;
  float wd = wcBox(vec2(sx > 0.0 ? (s * 3.0 - n - 0.5) * cw : sx + 0.5 * (hw + xc), v + (low - 0.2) * hh), vec2(sx > 0.0 ? 0.42 * cw : 0.36 * (hw + xc), (0.46 + low) * hh), 0.05);
  vec3 glass = mix(wcLow, mix(wcTop, wcMid, 0.35), wcR(-0.3, 0.75, up + 0.25 * s));
  glass = mix(glass, wcLit, 0.5 * wcIn(0.03, abs(fract(s * 1.2 + v * 0.8 + 0.3) - 0.5) - 0.15)) * mix(0.72, 0.96, side);
  glass = mix(glass, mix(lamp, vec3(1.0, 0.97, 0.86), 0.25 * sat(up)) * (0.85 + 0.25 * up), lit);
  vec2 hd = vec2((abs(s - 0.5) - 0.33) * 0.62, v - 0.03);
  glass = mix(glass, wcInk, 0.6 * wcIn(e, min(length(hd) - 0.045, length(hd + vec2(0.0, 0.16)) - 0.095)) * (1.0 - door) * step(0.0, sx));
  c = mix(c * (1.0 - 0.5 * wcIn(e, wd - 0.015)), glass, wcIn(e, wd));
  return vec4(mix(mix(wcInk, wcLit * 0.6, 0.2 * step(0.0, q.x)), c, a / max(max(arm, a), 1e-3)), max(arm, a));
}
// The cable, the cabins.
vec3 wcLine(vec3 col, vec2 p, float lit0) {
  float z = wcZ(p.x), zs = min(z, wcKz.w), y = wcWire(zs), dy = (p.y - y) * z;
  wcIf(z < wcKz.w + 1.0 && dy < 0.12 && dy > -0.5) {
    float sl = (wcWire(min(wcZ(p.x + 0.004), wcKz.w)) - y) / 0.004, d = abs(p.y - y) / sqrt(1.0 + sl * sl), on = wcR(wcKz.w + 0.6, wcKz.w, z), th = max(0.0032 / z, 0.5 * wcPx);
    col = mix(col, wcInk, 0.9 * on * wcR(th + 1.4 * wcPx, th, d));
    // a hair of light that runs along it
    float g = (1.0 / z - 1.265 + fract(uTime * 0.02) * 1.43) * 7.0, hit = (z - 1.0 - 2.6 * (1.0 - uHits)) * 2.5;
    col = mix(col, mix(wcLit, vec3(1.0), 0.5), on * wcR(0.4 * th + 1.2 * wcPx, 0.4 * th, d) * sat((0.5 + 0.5 * uMid) * exp(-g * g) + uHits * exp(-hit * hit)));
    vec2 k = wcNear(z, 0.0), q = p - wcHang(max(k.x, 0.3));
    float there = wcThere(k.x), S = 0.235 / max(k.x, 0.3);
    wcIf(there > 0.0 && abs(q.x) < S && q.y < 0.15 * S && q.y > -1.6 * S) {
      vec4 lamp = wcLamp(k.y); float door = uVar > 0.5 && abs(mod(k.y, 5.0) - 2.0) < 0.5 ? 1.0 : 0.0, first = wcR(0.7, 0.95, k.x) * wcR(2.6, 1.9, k.x);
      float ang = (0.012 + 0.09 * uPhrase) * sin(wcClock * 0.8 - k.y * 1.1) + first * 0.2 * uHits * sin(TAU * 1.5 * (1.0 - uHits)) + door * 0.1 * sin(wcClock * 0.4 + k.y);
      col = mix(col, mix(wcWarm, vec3(1.0), 0.6), first * uHits * 0.8 * wcR(0.85, 0.2, length(q / S + vec2(0.0, 0.8))));
      vec4 c = wcCabin(rot(ang) * q / S, 0.8 * wcPx / S, k.y, sat(lit0 + lamp.w * (0.35 + 0.6 * uEnergy) + 0.5 * uKeys + first * uHits), lamp.rgb * (0.85 + 0.25 * first * uHits), door);
      col = mix(col, c.rgb, c.a * there);
    }
  }
  return col;
}
// Sixteen far peaks, one for each band.
vec2 wcFar(float x) {
  float u = x * 8.6 + 8.0, f = uOwn[5], jag = 0.5 * (wcN1(u * 7.0) - 0.5); vec2 h = vec2(0.0);
  float two = 0.0;
  for (int j = -1; j < 2; j++) {
    float i = floor(u) + float(j), r = wcHash(i + 71.0), t = u - i - 0.35 - 0.3 * wcHash(i + 7.0), s = abs(t) / (mix(0.62, 1.0, r) * 0.86 * (1.0 - 0.25 * max(f, 0.0)));
    s += jag * min(s, 0.3);
    float y = mix(max(1.0 - s * (1.25 - 0.25 * s), 0.0), exp(-s * s * 2.2), max(-f, 0.0)) * (0.03 + 0.075 * r * r + 0.04 * band(clamp(i / 15.0, 0.0, 1.0))) * (1.0 + 2.6 * max(f, 0.0) + 0.4 * max(-f, 0.0));
    if (y > h.x) { two = h.x; h = vec2(y, t); } else two = max(two, y);
  }
  return vec2(h.x, h.y * wcR(0.0, 0.035, h.x - two));
}
vec3 wcStars(vec2 p) {
  vec2 g = p * 44.0, i = floor(g); float h = hash21(i + 3.0);
  return vec3(0.8, 0.87, 1.0) * wcW.y * step(0.78, h) * wcR(0.07, 0.0, length(g - i - 0.2 - 0.6 * hash22(i))) * (h - 0.55) * 2.0;
}
vec4 wcVillage(vec2 p) {
  vec4 o = vec4(0.0); float lights = sat(0.4 + 0.6 * wcW.y + uCue + uKeys), e = wcPx / 0.026;
  vec3 wall = mix(mix(wcDim, wcLit, 0.6), wcInk * 1.6, uVar), roof = mix(wall * vec3(0.75, 0.3, 0.22), mix(wcDim, wcLit, 0.5), uVar);
  for (int j = 0; j < 11; j++) {
    float f = float(j), r = wcHash(f + 5.0), w = 0.5 + 0.22 * r;
    vec2 q = p / 0.026 - vec2((mod(f * 3.7, 9.0) - 4.4) * 1.05, 1.6 - 0.36 * f + 0.4 * r);
    float side = q.x > 0.0 ? 1.0 : 0.74, a = wcIn(e, max(abs(q.x) - w, abs(q.y - 0.06) - 0.36)), b = wcIn(e, max(0.6 * (q.y - 0.42) - 0.45 * (w * 1.15 - abs(q.x)), 0.37 - q.y));
    vec3 c = mix(wall * side, mix(wcInk, wcWarm, lights), wcIn(e, max(abs(abs(q.x) - 0.45 * w), abs(q.y - 0.12)) - 0.09));
    o = mix(mix(o, vec4(c, 1.0), a), vec4(roof * side, 1.0), b) + vec4(wcWarm * lights * 0.1 * exp(-dot(q, q) * 1.1), 0.0);
  }
  return o;
}
// The masts.
vec2 wcMasts(vec2 p) {
  vec2 o = vec2(0.0);
  for (int j = 0; j < 2; j++) {
    float z = j == 0 ? wcKz.y : wcKz.z; vec2 q = (p - wcHang(z)) * z;
    wcIf(abs(q.x) < 0.2 && q.y < 0.1) {
      float w = 0.028 - 0.02 * q.y, e = wcPx * z, x = abs(q.x), f = abs(fract(q.y * 9.0) - 0.5) * 2.0;
      float m = wcIn(e, min(max(min(abs(x - w) - 0.009, max(x - w, abs(x / w - f) * 0.03 - 0.006)), q.y), max(x - 0.16, abs(q.y) - 0.014))) * wcR(0.0, 0.3, (p.y - wcHz) * z + wcH);
      o[j] = m;
    }
  }
  return o;
}
// The station.
vec3 wcStation(vec3 col, vec2 b) {
  vec3 c = b.y > 0.013 ? wcLit * vec3(0.66, 0.24, 0.18) : mix(wcLit * 0.6, wcWarm, wcR(-0.012, 0.006, b.y));
  col = mix(col, c, wcIn(wcPx, min(max(abs(b.x) - 0.021, abs(b.y) - 0.015), max(b.y - 0.036 + 0.75 * abs(b.x), 0.013 - b.y))));
  return col + wcWarm * (0.12 * wcW.y + 0.5 * uMic) * exp(-length(b) * 28.0);
}
// ---- a: over the sea of cloud
// A cabin's shadow (a) and the ring round it (rgb).
vec4 wcShadow(vec2 p) {
  float z = (wcA - 0.5 - 0.15 * p.x) / min(p.x - wcB, -0.02); vec2 k = wcNear(z, 0.0);
  float zz = max(k.x, 0.3) + 0.15, s = wcR(1.0, 1.5, k.x) * (1.0 - wcR(2.4, 3.3, k.x)) * wcR(0.5, 0.4, abs(z - k.x) / wcSp);
  vec2 d = (p - vec2((wcA + wcB * k.x - 0.5) / zz, wcHz - wcH * 0.9 / zz)) * k.x;
  float r = length(d), m = 1.0 - wcR(-0.03, 0.05, wcBox(d, vec2(0.11, 0.075), 0.06));
  vec3 x = (r - vec3(0.265, 0.235, 0.205)) / 0.032;
  return vec4((exp(-x * x) * vec3(0.11, 0.08, 0.1) * (1.0 + uHits) + wcLit * 0.1 * exp(-r * r * 45.0)) * s * (1.0 - m) * (1.0 - 0.4 * wcW.y), m * s * 0.6);
}
// The valley under the cloud.
vec3 wcValley(vec2 q) {
  float dep = sat((0.2 - q.y) / 0.5), z = 1.0 / (0.12 + dep);
  float f = noise(vec2(q.x * z * 3.0, z * 3.0));
  vec3 day = mix(wcDim, wcLit, 0.5), col = mix(vec3(0.44, 0.6, 0.44), vec3(0.68, 0.7, 0.44), f) * day;
  col = mix(col, vec3(0.3, 0.46, 0.42) * day * (0.75 + 0.4 * f), wcR(0.5, 0.65, 0.85 * noise(vec2(q.x * 12.0, q.y * 40.0)) + 0.5 * abs(q.x)));
  col = mix(col, mix(wcLow, wcLit, 0.5), wcIn(0.003, abs(q.x - 0.1 - 0.045 * sin(q.y * 26.0) * (0.4 + dep)) - 0.003 - 0.016 * dep));
  col = col * (1.0 - wcVil.a) + wcVil.rgb;
  return mix(col, mix(wcMid, wcDim, 0.6), 0.12 + 0.6 * wcR(0.36, 0.05, dep));
}
vec3 wcSea(vec2 p) {
  vec2 ray = normalize(vec2(0.9, 0.3 + 0.4 * wcLc));
  vec3 col = vec3(0.0), peach = mix(wcLit, mix(wcLow, wcLit, 0.3), 0.3 + 0.7 * uPad), air = mix(wcMid, wcLow, wcR(-0.7, 0.8, p.x));
  float left = 1.0, z = 1.05, hole = -2.0, tall = 1.0 + 0.7 * wcTram - 0.6 * wcRnd, land = abs(uOwn[5]);
  wcIf(wcOpen > 0.003) hole = 1.0 - length((p - wcVc) / (vec2(0.36, 0.2) * (0.4 + 0.6 * wcOpen) + vec2(0.35, 0.06) * max(-uOwn[1], 0.0))) + 0.7 * (noise(p * vec2(8.0, 14.0)) - 0.5);
  for (int i = 0; i < 5; i++) {
    float fi = float(i), far = fi * 0.25, m = i == 2 ? wcMa.x : i == 3 ? wcMa.y : 0.0;
    // what stands between the banks: masts, the open valley, the blue peak
    col += left * m * mix(wcInk, air, 0.3 * far); left *= 1.0 - m;
    wcIf(i == 3 && hole > -0.3) { m = wcR(-0.28, -0.1, hole) * wcR(0.07, 0.13, wcHz - p.y) * wcR(0.0, 0.1, wcOpen); col += left * m * wcValley(p - wcVc); left *= 1.0 - m; }
    wcIf(i == 4 && p.x > -0.25) {
      vec2 q = p - wcHang(wcKz.w) - vec2(0.012, 0.0); float f = uOwn[5], x = q.x, s = abs(x);
      float line = -0.025 - s * mix(1.25, 2.2, max(f, 0.0)) * wcR(-0.02, 0.06, s) * (1.0 - 0.45 * wcR(0.05, 0.3, s));
      line = mix(line, -0.025 - 0.3 * (1.0 - exp(-x * x * 30.0)), max(-f, 0.0)) + 0.045 * (wcN1(x * 28.0 + 3.0) - 0.5) * wcR(0.0, 0.05, s);
      float dep = max(line - q.y, 0.0), fan = x / (max(-q.y, 0.0) + 0.05);
      vec3 c = mix(mix(wcDeep * 0.9, wcDim, 0.3), mix(wcLit, wcLow, 0.5) * 0.95, 0.85 * wcR(-0.1, 0.1, max(fan, 2.0 * fan - 0.7) - 0.7 + 0.8 * wcN1(fan * 6.0 + 2.0 + 1.5 * wcN1(dep * 14.0)) + 0.35 * wcN1(fan * 17.0 - dep * 9.0)));
      m = wcR(-wcPx, wcPx, line - q.y);
      col += left * m * mix(c, air, 0.2 + 0.5 * wcR(0.06, 0.26, dep)); left *= 1.0 - m;
    }
    float v = (p.y - wcHz + wcH / z) * z / 0.3, X = p.x * z + fi * 11.3 + uTravel * 0.008;
    wcIf(v < 0.7 + tall && left > 0.01) {
      vec2 T = wcN1s(X * 0.75 + fi), T2 = wcN1s(X * 1.9 + 4.0);
      vec3 b = wcLumps(vec2(X * mix(1.35, 0.6, wcRnd), v * mix(0.45, 0.9, wcRnd) + fi * 3.7 - uTime * 0.003), 4 - (i + 1) / 2);
      float d = 0.12 + tall * (0.75 * T.x + 0.28 * T2.x) - v + (b.x - 0.42) * mix(1.15, 0.8, wcRnd), gone = i < 3 ? wcR(-0.3, 0.2, hole) * wcR(0.0, 0.1, wcOpen) : 0.0;
      float shred = uTexture * wcR(0.42, 0.8, noise(vec2(X * 3.0 + v * 1.4 - uTime * 0.05, v * 5.0 + fi))) * wcR(-0.9, -0.05, d), rim = exp(-max(d, 0.0) * 2.0);
      m = sat(wcR(0.0, 0.18 + 0.22 * far, d) + 0.75 * shred) * (1.0 - wcR(0.3, 0.75, gone + 0.8 * (b.x - 0.45)));
      float lean = dot(vec2(-b.y * 0.85 - 0.5 * tall * T.y - 0.35 * T2.y, -b.z * 0.5 + 0.75 * rim), ray) * 1.15, tone = 0.4 + 0.2 * uTone + 0.5 * lean / sqrt(1.0 + lean * lean);
      vec3 c = mix(mix(wcDim, peach, wcR(0.2, 0.75, tone)), wcDeep, 0.5 * wcR(0.6, 0.1, b.x) * (1.0 - 0.6 * tone));
      c = mix(c, mix(wcDim, wcDeep, 0.6), 0.55 * wcR(0.35, 1.7, d + 0.35 * (1.0 - tone)) + 0.45 * gone);
      c = mix(c, wcLit, 0.5 * rim * tone);
      vec4 heard = piece(vec2(sat(p.x / 1.78 + 0.5), 1.0 - far)), sh = wcShadow(p + vec2(0.0, 0.03 * (b.x - 0.4)) / z);
      c = mix(c, c * 0.7 + heard.rgb * 0.5, sat(heard.a * (0.25 + 0.5 * uEnergy) * (0.3 + tone)));
      c = mix(c, mix(wcDeep, c, 0.2), sh.a) + sh.rgb;
      c = mix(c, vec3(1.0, 0.86, 0.65), 0.75 * uCue * exp(-dot(p - wcVc, (p - wcVc) * vec2(12.0, 40.0))));
      col += left * m * mix(c, air, far * far * mix(0.4, 0.75, uSpace)); left *= 1.0 - m;
    }
    if (left < 0.01) break;
    z *= 1.74;
  }
  wcIf(left > 0.01) {
    float up = p.y - wcHz;
    vec3 sky = mix(air, mix(wcMid, wcLow, 0.35 * wcR(-0.4, 0.9, p.x)), wcR(0.0, 0.14, up));
    sky = mix(sky, wcTop, wcR(0.06, 0.58, up - 0.12 * p.x));
    vec2 q = vec2(p.x * 1.3 + uTravel * 0.003, p.y * 9.0 - p.x * 1.6);
    sky = mix(sky, mix(wcLit, wcLow, 0.3), 0.5 * wcR(0.48, 0.85, 0.65 * noise(q) + 0.35 * noise(q * vec2(2.3, 2.9) + 4.0)) * wcR(0.08, 0.2, up)) + wcStars(p) * wcR(0.05, 0.3, up);
    vec3 c = mix(wcDim, wcDeep * (1.0 - 0.3 * land), 0.45 + 0.4 * land);
    c = mix(mix(c, mix(c, wcLow, 0.5), wcR(-0.05, 0.1, wcFh.y)), air, 0.3 - 0.2 * land + 0.55 * wcR(0.05, -0.01, up));
    col += left * mix(sky, c, wcR(-wcPx, wcPx, wcFh.x - 0.018 - up));
  }
  return col;
}
// ---- b: the night slope from below
vec3 wcSlope(vec2 p) {
  float lift = 0.07 * p.x * p.x - 0.03 * p.x, rim = wcHz - 0.072 + 0.02 * (wcN1(p.x * 3.0) - 0.5), gy = p.y - lift, up = gy - rim, zl = p.x > wcB + 0.04 ? wcZ(p.x) : 30.0, zs = wcH / max(wcHz - gy, 0.03);
  vec2 vq = (p - wcVc) * vec2(1.0, 1.8);
  vec3 air = mix(wcMid, wcLow, wcR(0.6, -0.8, p.x)), col = air, pool = vec3(0.0), beam = vec3(0.0), c;
  float z = 10.6, f = uOwn[5], thick = max(f, 0.0), dusk = 1.0 - 0.8 * wcW.x, shown = sat(1.6 * wcOpen), village = exp(-dot(vq, vq) * 60.0), lev = 0.1 + 0.25 * uDrone + 0.2 * uOwn[1];
  // the cabins' light on the snow and in the air
  for (int j = 0; j < 4; j++) {
    vec2 k = wcNear(min(j < 1 ? zs : zl, 14.0), j < 1 ? 0.0 : float(j) - 2.0);
    float kz = max(k.x, 0.3), dx = p.x - wcB - wcA / kz, there = wcThere(k.x);
    vec2 d = vec2(dx * zs, (zs - kz) * 0.8);
    wcIf(there > 0.0 && (j < 1 ? up < 0.0 && dot(d, d) < 0.6 : abs(dx) * kz < 0.4)) {
      vec4 la = wcLamp(k.y); float yb = wcWire(kz) - 0.3 / kz, t = (yb - p.y) / max(yb - wcHz + wcH / kz, 0.01);
      la *= there * dusk * (0.6 + 0.5 * la.w * (0.5 + uEnergy) + 0.6 * wcR(2.6, 1.9, kz) * uHits);
      if (j < 1) pool += la.rgb * exp(-dot(d, d) * 9.0) * wcR(0.5, 0.25, abs(zs - kz) / wcSp);
      else beam += la.rgb * 0.46 * wcR(1.0, 0.3, abs(dx) * kz / (0.09 + 0.26 * max(t, 0.0))) * wcR(1.1, 0.6, t) * wcR(0.0, 0.1, t);
    }
  }
  wcIf(up > -0.01) { // the sky and the far peaks
    col = mix(mix(air, wcMid, wcR(0.0, 0.1, up)), wcTop, wcR(0.02, 0.4, up)) + wcStars(p);
    float moon = length(p - vec2(0.36, 0.4));
    col = mix(col + wcLit * 0.6 * wcRnd * exp(-moon * 5.0), mix(wcLit, vec3(1.0), 0.5), wcR(0.0, 0.5, wcRnd) * wcIn(wcPx, moon - 0.1));
    c = mix(wcDeep * 0.55, mix(wcDim, wcLit, 0.2), mix(wcR(0.12, -0.12, wcFh.y), 0.4, sat(20.0 * wcFh.x - 0.2 - 16.0 * up)));
    col = mix(col, mix(c, air, 0.25 + 0.4 * wcR(0.07, 0.0, up)), wcR(-wcPx, wcPx, 1.3 * wcFh.x - 0.02 - up));
  }
  wcIf(up < 0.01) { // the snow, with two skiers' tracks
    vec2 w = vec2(p.x * zs, zs);
    vec3 n = wcN2(w * vec2(2.8, 2.0));
    float lean = (0.45 * n.z - 0.5 * n.y) * (1.2 - 0.7 * wcLc) * (1.0 + 2.0 * wcTram) / (1.0 + 0.05 * zs), tone = 0.4 + 0.2 * uTone + 0.5 * lean / sqrt(1.0 + lean * lean);
    c = mix(mix(wcDeep, wcDim, 0.1 + 0.9 * tone), wcLit, 0.25 * wcR(0.6, 0.95, tone));
    float tr = abs(abs(w.x - wcA - wcB * zs - 0.1 - 0.16 * sin(zs * 2.7)) - 0.022);
    c *= 1.0 - 0.28 * wcR(0.006 + wcPx * zs, 0.006, tr) * exp(-zs * 0.1);
    col = mix(col, mix(c + (c * 0.5 + 0.11) * pool * (2.0 - c), air, wcR(1.0, 8.0, zs) * (0.55 + 0.35 * uOwn[1])), wcR(wcPx, -wcPx, up));
  }
  // rows of firs, mist and a village, the far first
  for (int i = 0; i < 7; i++) {
    z *= 0.75;
    float fi = float(i), far = 1.0 - fi / 6.0, v = (gy - wcHz) * z + wcH, m = i == 1 ? wcMa.y : i == 4 ? wcMa.x : 0.0;
    col = mix(col, mix(wcInk * 1.3, air, 0.25 * far) + beam * 0.15, m);
    wcIf(i == 4 && shown > 0.0) col = mix(col, mix(col, mix(wcDeep, wcDim, 0.7), wcR(0.24, 0.12, length(vq + vec2(0.0, 0.04)))) * (1.0 - wcVil.a) + wcVil.rgb + wcWarm * 0.2 * dusk * village, shown);
    wcIf(v > -0.1 && v < 0.53 + 0.1 * thick && abs(p.x * z - wcA - wcB * z + 0.08) > 0.37) {
      float u = p.x * z / 0.18 + fi * 7.37, id = floor(u), k = wcHash(id + fi * 31.0), x = (u - id - 0.5 - 0.15 * (k - 0.5)) * 0.18, off = abs(p.x * z - x - wcA - wcB * z + 0.08);
      float h = (0.28 + 0.24 * wcHash(id + 3.7 + fi)) * wcR(0.0, 0.25, wcR(0.48, 0.8, off) - 0.25 * wcR(1.9, 0.8, off) - k * (0.6 - 0.5 * f) - 0.3 * max(-f, 0.0)) * (1.0 + 0.2 * thick);
      float y = (v + 0.1 * k) / max(h, 0.03), bough = fract(y * 8.0 + abs(x) * 9.0 + k * 3.0);
      m = wcIn(wcPx * z, abs(x) - min(h * 0.24, 0.062) * (1.0 - y) * (0.62 + 0.5 * (1.0 - bough))) * wcR(-0.02, 0.1, y - 0.4 * abs(x)) * step(y, 1.0) * wcR(0.03, 0.08, h);
      c = mix(wcInk, mix(wcDim, wcLit, 0.35), 0.5 * wcR(0.5, 0.15, bough) * wcR(0.03, -0.02, x));
      col = mix(col, mix(c, air, (0.55 + 0.4 * uOwn[1]) * far) + (pool * 0.4 + beam * 0.35) * (0.1 + c), m);
    }
    wcIf(v > -0.4 && v < 0.65 + 0.6 * max(lev, 0.0) && i % 2 == 1 && i < 5) {
      vec2 q = vec2(p.x * z * 0.9 + fi * 2.5 + uTravel * 0.02, v * 2.6 - fi * 1.5 + 0.3 * p.x);
      float n = 0.62 * noise(q) + 0.38 * noise(q * vec2(2.3, 2.7) + vec2(uTime * 0.01, 2.0)), torn = 0.16 + 0.12 * (1.0 - uTexture);
      m = wcR(0.5 - torn, 0.5 + torn, n + 0.04 * uTexture) * wcR(0.34 + max(lev, -0.1), 0.0, abs(v - 0.15 - 0.3 * lev)) * (0.3 + 0.2 * far + 0.3 * uDrone + 0.6 * uOwn[1]);
      vec4 heard = piece(vec2(sat(p.x / 1.78 + 0.5), 1.0 - far));
      c = mix(wcDim, wcLit, 0.15 + (0.35 + 0.2 * uPad) * n) * 0.85;
      col = mix(col, mix(c, c * 0.5 + heard.rgb * 0.6, sat(heard.a * (0.3 + 0.5 * uEnergy))) + beam * 0.5 + pool * 0.15, sat(m) * (1.0 - shown * village));
    }
  }
  return col + beam * 0.57 * (1.0 - 0.8 * col) + wcWarm * 0.3 * uCue * village;
}
vec3 render(vec2 p) {
  float o = uOwn[0], rise = uOwn[1], near = max(uOwn[4], 0.0), zoom = 1.0 - 0.48 * near;
  bool a = uVar < 0.5;
  wcW = vec3(1.0 - abs(o), max(-o, 0.0), max(o, 0.0)); if (!a) wcW = wcW.yxz;
  wcTop = wcHour(vec3(0.5, 0.68, 0.79), vec3(0.025, 0.05, 0.12), vec3(0.28, 0.19, 0.38));
  wcMid = wcHour(vec3(0.82, 0.87, 0.87), vec3(0.08, 0.14, 0.26), vec3(0.74, 0.37, 0.4));
  wcLow = wcHour(vec3(0.99, 0.84, 0.7), vec3(0.2, 0.28, 0.41), vec3(1.0, 0.6, 0.33));
  wcLit = wcHour(vec3(1.0, 0.95, 0.88), vec3(0.6, 0.7, 0.86), vec3(1.0, 0.69, 0.52));
  wcDim = wcHour(vec3(0.63, 0.71, 0.83), vec3(0.18, 0.26, 0.43), vec3(0.46, 0.31, 0.49));
  wcDeep = wcHour(vec3(0.43, 0.54, 0.71), vec3(0.07, 0.12, 0.24), vec3(0.27, 0.18, 0.38));
  wcInk = wcHour(vec3(0.13, 0.16, 0.22), vec3(0.02, 0.032, 0.06), vec3(0.1, 0.06, 0.13));
  wcClock = mod(uTime, 6283.1853); wcLc = 0.5 - 0.5 * cos(TAU * uLoop);
  wcOpen = sat(4.0 * uCue * (1.0 - uCue) + max(-rise, 0.0));
  wcSp = 1.15 * exp2(uOwn[3] < 0.0 ? -2.2 * uOwn[3] : -0.5 * uOwn[3]); wcPh = uTravel * 0.02 + 0.08;
  wcRnd = max(-uOwn[2], 0.0); wcTram = max(uOwn[2], 0.0);
  wcA = a ? -1.36 : 1.2; wcB = a ? 0.56 : -0.42; wcHz = a ? -0.02 : 0.36;
  wcH = a ? 0.56 - 0.1 * uDrone - 0.1 * max(rise, 0.0) : 1.05;
  wcKz = a ? vec4(0.5, 3.0, 5.6, 9.0) : vec4(0.5, 2.6, 6.0, 12.0);
  wcKw = a ? vec4(0.62, 0.47, 1.12, 2.5) : vec4(-0.22, -0.42, -0.52, -0.6);
  wcSag = (a ? vec3(0.24, 0.13, 0.16) : vec3(0.1, 0.1, 0.12)) + (0.004 + 0.03 * uPhrase) * sin(wcClock * 0.9 - vec3(0.0, 1.3, 2.6));
  p = p * zoom + near * (a ? vec2(-0.08, 0.02) : vec2(0.12, 0.0)); wcPx = 1.1 / uRes.y * zoom;
  p.y += 0.2 * max(-uOwn[4], 0.0) * (a ? -1.0 : 1.0);
  vec3 c = vec3(0.0); wcFh = c.xy; wcVil = vec4(0.0);
  wcIf(p.y > (a ? -0.06 : 0.2)) wcFh = wcFar(a ? p.x : p.x * 0.8 + 0.06);
  wcMa = wcMasts(p); wcVc = a ? vec2(0.26, wcHz - 0.27) : vec2(0.33, wcHz - 0.12);
  wcIf(wcOpen > 0.003 && length(p - wcVc + 0.03) < 0.2) wcVil = wcVillage(p - wcVc + vec2(a ? 0.06 : 0.0, 0.0));
  wcIf(a) c = wcSea(p);
  wcIf(!a) c = wcSlope(p);
  c = wcLine(wcStation(c, p - wcHang(wcKz.w) - vec2(a ? 0.012 : 0.0, -0.012)), p, a ? wcW.y * 0.85 + wcW.z * 0.3 : 0.8 - 0.4 * wcW.x);
  return sat(c);
}
