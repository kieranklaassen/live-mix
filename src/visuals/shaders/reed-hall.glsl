// name: Reed hall
// a: Arches inside
// b: Over the marsh
// what: Inside a long hall built only of reeds: bundles bend overhead in arch after arch, white marsh light comes through a lattice at the far end and lies in lozenges on the mats, a thread of smoke rises over coffee pots; or the same hall from a boat at dawn, mirrored in still water, with someone poling past in the mist.
// follows: Each arch is a place in the loop: what sounds there warms its reeds, the playhead walks down. Drone is the far light or sun, pad the gold, texture dust or ripples, phrase the smoke or the boat's lamp. Bands open columns of the lattice and ruffle the water. A hit flares the hearth as someone passes, or is a fish ring; a cue lets the sun in, keys light holes.
// own: 0 moonlit night at -1, red sunset at 1; 1 fresh green reeds at -1, bleached grey ones in dusty air at 1; 2 a low wide hall at -1 (outside long as well), a tall pointed one at 1; 3 few stout arches at -1 (outside bare water, no boat), many thin ones at 1 (more reeds and boats); 4 clear air at -1, thick smoke or mist at 1; 5 seen from low down at -1, from high up at 1
float rhW, rhH, rhPeak, rhTall; // the hall: half its width, its height, how pointed, its curve's height
float rhStep, rhR, rhN; // from arch to arch, how thick, how many in the loop
float rhFar, rhPx, rhGain; // where the lattice stands, a pixel at distance 1, how strong the answers
float rhNight, rhEve, rhDrone, rhPad, rhTex, rhPhr;
vec3 rhReed, rhDay, rhBeam, rhSun, rhLamp;
const float rhFirst = 0.95;
const vec2 rhHearth = vec2(1.0, 3.1);
vec3 rhInk(vec3 k) { return k / max(max(k.r, max(k.g, k.b)), 0.05); }
float rhSq(float x) { return x * x; }
// Falls from 1 at lo to 0 at hi.
float rhOff(float hi, float lo, float x) { return 1.0 - smoothstep(lo, hi, x); }
// 1 inside an edge (d below 0), w its softness.
float rhIn(float w, float d) { return rhOff(w, -w, d); }
// The curve of an arch: how far outside it q is, which way is out, how far up (0 foot, 1 crown).
float rhCurve(vec2 q, out vec2 n, out float s) {
  vec2 e = 1.0 / vec2(rhW + rhPeak, rhTall), c = vec2(abs(q.x) + rhPeak, q.y) * e, g = c * e;
  float k0 = length(c), k1 = max(length(g), 1e-3), y = max(q.y / rhH, 0.0);
  n = g / k1; if (q.x < 0.0) n.x = -n.x;
  s = y / (abs(q.x) / rhW + y + 1e-3);
  s -= 0.36 * s * (1.0 - s) * (1.0 - 2.0 * s);
  return k0 * (k0 - 1.0) / k1;
}
// Where a line enters and leaves the vault drawn k as big (misses: enters after it leaves).
vec2 rhVault(vec3 o, vec3 d, float k) {
  vec2 e = 1.0 / vec2(rhW + rhPeak, rhTall), r = vec2(-1e3, 1e3), v = d.xy * e;
  float a = max(dot(v, v), 1e-5);
  for (int i = 0; i < 2; i++) {
    vec2 u = (o.xy + vec2(i == 0 ? rhPeak : -rhPeak, 0.0)) * e;
    float b = dot(u, v), h = b * b - a * (dot(u, u) - k * k);
    if (h < 0.0) return vec2(1e3, -1e3);
    h = sqrt(h);
    r = vec2(max(r.x, (-b - h) / a), min(r.y, (h - b) / a));
  }
  return r;
}
// How open the lattice is, blurred by soft; keyed is 1 in the holes the keys light.
float rhLattice(vec2 w, float soft, out float keyed) {
  vec2 n, d = mat2(1.0, 1.0, 1.0, -1.0) * vec2(w.x / rhW * 5.18, w.y * 1.5), id = floor(d), f = abs(d - id - 0.5);
  float s, c = rhCurve(w, n, s), b = soft * 2.2, open = 0.17 + 0.14 * sat(band((id.x + id.y + 1.0) / 20.7 + 0.5) * rhGain);
  keyed = smoothstep(0.72, 0.9, hash21(id + 3.0));
  float hole = mix(rhOff(open + b, open - b, max(f.x, f.y)), 4.0 * open * open, smoothstep(0.2, 0.7, b));
  float post = min(abs(abs(w.x) - 0.36 * rhW), abs(w.x));
  return hole * rhOff(0.02, -0.03, c + 0.3) * smoothstep(0.26, 0.31, w.y) * smoothstep(0.06, 0.11, post);
}
// The light the piece puts in the reeds, and how strong.
vec3 rhSounds(float place, float room, out float on) {
  vec4 m = piece(vec2(clamp(place, 0.0, 1.0), 0.06 + 0.88 * room));
  float ph = place - uLoop;
  on = sat(m.a * 1.5 * rhGain) + 0.6 * exp(-ph * ph * 100.0) * sin(PI * uLoop) * sat(uLevel * 2.0);
  return mix(vec3(1.0, 0.8, 0.5), rhInk(m.rgb), 0.5 * sat(m.a * 8.0));
}
// ---- inside ----
float rhRib(vec3 q) {
  vec2 n; float s, c = rhCurve(q.xy, n, s), z = mod(q.z - rhFirst + 0.5 * rhStep, rhStep) - 0.5 * rhStep;
  float t = abs(fract(s * 6.0 + 0.5) - 0.5);
  return length(vec2(c + 0.8 * rhR, z)) - rhR * (1.18 - 0.5 * s) * (1.0 - 0.07 * rhOff(0.1, 0.0, t));
}
// From the middle of a cushion at the foot of the walls.
vec3 rhSeat(vec3 q) {
  vec3 d = vec3(q.x < 0.0 ? q.x + 0.74 * rhW : q.x - 0.74 * rhW, (q.y - 0.14) * 1.2, mod(q.z - rhFirst, rhStep) - 0.5 * rhStep);
  d.z -= clamp(d.z, -0.2 * rhStep, 0.2 * rhStep);
  return d;
}
float rhSeatD(vec3 q) { return 0.83 * (length(rhSeat(q)) - 0.2); }
// Someone passes outside, at a hit.
float rhPasser(vec2 w, float soft) {
  vec2 q = w - vec2((1.3 * uHits - 0.5) * rhW * 0.6, 0.0);
  float d = length(vec2(q.x, q.y - clamp(q.y, 0.2, 1.4))) - 0.45 + 0.15 * q.y;
  return 1.0 - uHits * rhOff(0.06 + soft, -0.04, d);
}
// All light that falls at q.
vec3 rhLight(vec3 q, vec3 N, float ao) {
  // the door behind us, the bright end, what the floor throws up
  vec3 v = vec3(-0.6, 1.5, -2.2) - q, e = vec3(0.0, 1.3, rhFar) - q;
  float d = dot(v, v), f = dot(e, e), b = e.z - 2.6, keyed;
  vec3 c = rhLamp * sat(dot(N, v) / sqrt(d) * 0.75 + 0.25) * 12.0 / (2.5 + d + 0.16 * d * d) * (0.7 + 0.8 * rhPad);
  c += rhDay * sat(dot(N, e) / sqrt(f) * 0.8 + 0.2) * 6.0 / (1.5 + f) * (0.5 + 0.8 * rhDrone);
  c += rhBeam * vec3(0.8, 0.5, 0.22) * (0.6 - 0.4 * N.y) * 0.3 / (1.0 + 0.3 * b * b) + rhDay * vec3(0.013, 0.011, 0.01);
  c *= ao;
  // the sun through the lattice; at a cue it reaches our feet
  vec2 w = q.xy + rhSun.xy / rhSun.z * e.z;
  float m = rhLattice(w, 0.01 + 0.005 * e.z, keyed) * rhPasser(w, 0.1), wave = e.z / rhFar - 1.05 * (1.0 - uCue);
  m *= 0.2 + 0.8 * rhOff(rhFar, 1.5, e.z) + 2.2 * uCue * exp(-wave * wave * 7.0);
  return c + rhBeam * m * (1.0 + 1.5 * keyed * uKeys * rhGain) * sat(dot(N, rhSun) * 2.2);
}
// A coffee pot, from its side.
float rhPot(vec2 q) {
  float d = (length((q - vec2(0.0, 0.11)) / vec2(0.1, 0.115)) - 1.0) * 0.1;
  d = smin(d, length(vec2(q.x, q.y - clamp(q.y, 0.2, 0.27))) - 0.045, 0.05);
  d = smin(d, length((q - vec2(0.0, 0.3)) * vec2(0.6, 1.2)) - 0.035, 0.02);
  d = min(d, max(length(q - vec2(-0.09, 0.27)) - 0.065, 0.045 - length(q - vec2(-0.115, 0.305))));
  return min(d, abs(length((q - vec2(0.09, 0.18)) * vec2(1.0, 0.7)) - 0.06) - 0.011);
}
vec3 rhInside(vec2 p) {
  float wide = smoothstep(0.5, 1.5, uRes.x / uRes.y), v = uOwn[5], foc = 0.86 * mix(0.8, 1.0, wide), ember = 0.35 + 0.4 * rhPhr + 0.9 * rhNight + 1.2 * uHits;
  vec3 ro = vec3(-0.42 * wide, 1.32 + (v > 0.0 ? 1.0 : 0.85) * v, 0.5 * sin(uTravel * 0.03) - 0.1);
  vec3 rd = normalize(vec3(p.x + 0.17 * wide, p.y + 0.06 - 0.2 * v, foc));
  rhPx = 1.0 / (foc * uRes.y);
  rhFar = 10.2; rhN = (rhFar - rhFirst) / rhStep + 0.2; rhSun = normalize(vec3(-0.2, 0.29, 1.0));
  float ends = (rhFar - ro.z) / rd.z, tf = rd.y < -1e-3 ? -ro.y / rd.y : 1e3, tx = min(min(tf, ends), rhVault(ro, rd, 1.0).y);
  // arches and cushions: only the part they fill is searched
  float a = max(dot(rd.xy, rd.xy), 1e-5), t = max(rhVault(ro, rd, 1.0 - 1.85 * rhR / rhW).y, 0.05);
  vec2 oc = ro.xy - vec2(rd.x * 10.0 + ro.x > 0.0 ? 0.74 * rhW : -0.74 * rhW, 0.13);
  float b = dot(oc, rd.xy), h = b * b - a * (dot(oc, oc) - 0.06), best = 1e3, last = 1e3;
  if (h > 0.0 && b < 0.0) t = min(t, max((-b - sqrt(h)) / a, 0.05));
  bool hit = false;
  for (int i = 0; i < 28; i++) {
    if (t > tx) break;
    vec3 q = ro + rd * t;
    float d = rhRib(q), m; if (q.y < 0.4) d = min(d, rhSeatD(q));
    m = d / (t * rhPx);
    if (m < 0.6) { hit = true; break; }
    if (m > last) best = min(best, last);
    last = m;
    t += d * 0.92;
  }
  if (!hit) t = tx;
  vec3 q = ro + rd * t, alb = rhReed, N = vec3(0.0, 0.0, -1.0), col, add = vec3(0.0);
  vec2 n;
  float s, c = rhCurve(q.xy, n, s), z = (q.z - rhFirst) / rhStep, k = floor(z + 0.5), side = q.x < 0.0 ? 17.0 : 3.0, fp = t * rhPx, ao = 1.0, keyed, seat = hit && q.y < 0.4 ? rhSeatD(q) - rhRib(q) : 1.0;
  float on;
  vec3 ink = rhSounds((k + 0.5) / rhN, q.x < 0.0 ? 0.5 * s : 1.0 - 0.5 * s, on);
  z = (z - k) * rhStep;
  if (hit && seat > 0.0) {
    // reeds along a bundle, rope round it
    c += 0.8 * rhR;
    float y = atan(z, c + 1e-4), t0 = abs(fract(s * 6.0 + 0.5) - 0.5), w = rhSq(fp / rhR), f1 = 1.0 / (1.0 + w * 300.0), f2 = 1.0 / (1.0 + w * 3000.0);
    float l0 = noise(vec2(y * 4.0 + k * 9.0, s * 9.0 + side)), l1 = noise(vec2(y * 18.0 + 0.6 * l0 + side, s * 9.0 + k * 5.0)), l2 = noise(vec2(y * 55.0 + l0, s * 13.0 + k * 3.0 + side));
    float str = (l0 - 0.5) * 0.35 + (l1 - 0.5) * 0.8 * f1 + (l2 - 0.5) * 1.3 * f2;
    N = normalize(vec3(n * c, z) + 1e-5);
    N = normalize(N + cross(vec3(-n.y, n.x, 0.0), N) * ((l1 - 0.5) * f1 + (l2 - 0.5) * f2) * 0.9);
    alb *= (0.75 + 1.1 * str);
    alb = mix(alb, rhReed * vec3(0.45, 0.38, 0.31) * (0.8 + 0.3 * sin(t0 * 260.0 + y * 2.0) * f1), rhOff(0.075, 0.05, t0));
    ao = 0.35 + 0.65 * smoothstep(-1.1, 0.4, -c / rhR) * smoothstep(-0.1, 0.5, q.y);
    on *= 0.9 + 0.8 * str;
  } else if (hit) {
    N = normalize(rhSeat(q) + 1e-4);
    alb = mix(vec3(0.36, 0.06, 0.035), vec3(0.40, 0.29, 0.16), step(0.5, hash11(floor((q.z - rhFirst) / rhStep) * 3.0 + side))) * (0.85 + 0.3 * noise(q.zx * 9.0));
    ao = smoothstep(-0.06, 0.2, q.y); on = 0.0;
  } else if (tx == tf) {
    // mats, with a run of rugs along each wall
    N = vec3(0.0, 1.0, 0.0);
    fp /= max(-rd.y, 0.04);
    vec2 g = rot(0.785) * q.xz * 15.0, f = abs(fract(g) - 0.5);
    float f1 = 1.0 / (1.0 + fp * fp * 600.0);
    alb *= (0.85 + 0.35 * noise(q.xz * vec2(1.4, 0.9))) * mix(1.0, rhOff(0.6, 0.3, mod(floor(g.x) + floor(g.y), 2.0) > 0.5 ? f.y : f.x), f1);
    float rx = (abs(q.x) - 0.52 * rhW) / (0.2 * rhW), zz = q.z / 1.9 + (q.x > 0.0 ? 0.3 : 0.0), rk = floor(zz), rf = zz - rk, st = abs(fract(rf * 7.0) - 0.5);
    vec3 r = hash11(rk + side) > 0.5 ? vec3(0.30, 0.045, 0.03) : vec3(0.04, 0.06, 0.12);
    r = mix(r, vec3(0.5, 0.3, 0.1), mix(0.35, rhOff(0.34, 0.28, abs(abs(rx) - 0.45) + st * 0.9), f1));
    r *= smoothstep(0.0, 0.02, rf) * rhOff(1.0, 0.98, rf);
    alb = mix(alb, r, rhOff(1.0 + fp * 2.0, 1.0 - fp * 2.0, abs(rx)));
    // the hearth: a ring of clay with embers in it
    float hr = length(q.xz - rhHearth);
    alb = mix(alb, mix(vec3(0.30, 0.2, 0.12), vec3(0.1), rhOff(0.36, 0.33, hr)), rhOff(0.47 + fp, 0.46 - fp, hr));
    add = vec3(1.0, 0.25, 0.04) * ember * rhOff(0.3, 0.05, hr) * smoothstep(0.35, 0.8, noise(q.xz * 26.0) + 0.2 * sin(uTime * 0.6 + 9.0 * hr));
    ao = 0.2 + 0.6 * rhOff(0.85 * rhW, 0.6 * rhW, abs(q.x)); on = 0.0;
  } else if (tx == ends) {
    alb *= 0.7; on = 0.0;
  } else {
    // the vault: bundles laid lengthwise
    float x = s * 14.0, f = fract(x) - 0.5, w = fp * 3.5, fade = 1.0 / (1.0 + w * w * 9.0);
    float l1 = noise(vec2(x * 6.0 + side, q.z * 0.8)), l2 = noise(vec2(x * 21.0 + side, q.z * 1.5));
    float str = ((l1 - 0.5) * 0.6 + (l2 - 0.5) * fade) * fade;
    N = normalize(vec3(-n, 0.0) + vec3(-n.y, n.x, 0.0) * (q.x < 0.0 ? -1.0 : 1.0) * f * 2.4 * fade);
    alb *= vec3(0.78, 0.7, 0.62) * (0.8 + 0.8 * str) * mix(1.0, rhOff(0.5, 0.3, abs(f)), 0.9 * fade);
    ao = 0.75 * (0.2 + 0.8 * smoothstep(rhR * 0.5, rhR * 2.6, abs(z))) * smoothstep(-0.2, 0.9, q.y);
    on *= 0.7 + 0.4 * str;
  }
  col = alb * (rhLight(q, N, ao) + ink * on * on * 0.45 * rhGain) + add;
  if (!hit && tx == ends) {
    float m = rhLattice(q.xy, 1.2 * fp, keyed);
    col = mix(col, rhDay * (1.6 + 0.6 * smoothstep(0.5, 2.5, q.y)) * (0.75 + 0.6 * rhDrone) * (1.0 + 1.6 * keyed * uKeys * rhGain) * (0.12 + 0.88 * rhPasser(q.xy, 0.02)), m);
  }
  if (!hit) col = mix(col, rhReed * (0.04 + 0.1 * rhLamp), 0.6 * sat(1.6 - best));
  // air, and the shafts of light in it
  vec2 e = rd.xy / rd.z - (vec2(0.0, 1.4) - ro.xy) / (rhFar - ro.z), A = ro.xy + rhSun.xy / rhSun.z * (rhFar - ro.z), B = ro.xy + rd.xy * ends;
  float glow = exp(-dot(e, e) * 14.0), mist = max(uOwn[4], 0.0), thin = 1.0 + 0.8 * min(uOwn[4], 0.0), sh = 0.0, zt = sat(t / ends);
  col = mix(col, rhDay * (0.04 + 0.55 * glow + 0.08 * mist), (1.0 - exp(-t * (0.02 + 0.03 * uSpace + 0.09 * mist))) * 0.8 * thin);
  for (int i = 0; i < 5; i++) {
    float f = (float(i) + 0.5) / 5.0 * zt; vec2 w = mix(A, B, f);
    sh += (0.5 + 0.4 * cos(w.x * 14.0 / rhW + 2.0 * w.y)) * (0.6 + sat(band(w.x / rhW * 0.5 + 0.5) * rhGain)) * smoothstep(0.1, 0.5, w.y) * rhOff(rhH * 0.9, rhH * 0.55, w.y + 0.12 * w.x * w.x) * rhOff(rhW * 0.95, rhW * 0.75, abs(w.x)) * (0.3 + 0.7 * f);
  }
  col += rhBeam * sh / 5.0 * zt * (0.02 + 0.02 * uSpace + 0.07 * mist + 0.04 * uCue) * thin;
  // coffee pots, and the smoke over them
  float th = (rhHearth.y - ro.z) / rd.z, px = th * rhPx;
  vec2 hq = (ro + rd * th).xy - vec2(rhHearth.x, 0.0);
  if (th < t + 0.4 && abs(hq.x) < 1.2) {
    col += vec3(1.0, 0.32, 0.07) * ember * 0.35 * exp(-dot(hq * vec2(1.0, 1.4), hq * vec2(1.0, 1.4)) * 7.0);
    float d = hq.y > -0.05 && hq.y < 0.6 ? min(min(rhPot(hq - vec2(-0.16, 0.02)), rhPot((hq - vec2(0.07, 0.0)) * 1.3)), rhPot((hq - vec2(0.27, 0.02)) * 1.6)) : 1.0;
    col = mix(col, vec3(0.012, 0.01, 0.008) + rhDay * 0.3 * rhOff(0.014, 0.0, -d) * sat(0.4 - 4.0 * hq.x + hq.y) + vec3(1.0, 0.35, 0.08) * ember * 0.12 * rhOff(0.2, 0.0, hq.y), rhIn(px, d));
    float y = max(hq.y - 0.2, 0.0), off = y * (0.07 * sin(y * 4.0 - uTime * 0.5) + 0.12 * sin(y * 1.7 - uTime * 0.21 + 1.0)), w = 0.012 + 0.035 * y;
    col += (rhDay * 0.5 + 0.3 * rhInk(uKind[3])) * (exp(-rhSq((hq.x + 0.02 - off) / w)) + 0.5 * exp(-rhSq((hq.x - 0.02 - 0.5 * off) / (1.7 * w)))) * smoothstep(0.18, 0.3, hq.y) / (1.0 + 2.2 * y) * (0.14 + 0.5 * rhPhr);
  }
  // dust hanging in the light
  vec2 g = p * 19.0 + vec2(0.6 * sin(uTime * 0.09), 0.5 * cos(uTime * 0.07)), r = hash22(floor(g));
  g = (fract(g) - 0.2 - 0.6 * r) / (0.04 + 0.04 * r.x);
  return col + rhDay * exp(-dot(g, g)) * smoothstep(0.0, 0.25, 0.1 + 0.8 * rhTex - fract(r.x * 7.7 + r.y * 3.1)) * 0.35 * (0.15 + glow);
}
// ---- over the marsh ----
vec3 rhSky, rhGlow, rhEnd, rhAxis; float rhThin; vec2 rhDisc;
vec3 rhVeil(vec3 c, float z) { return mix(rhSky, c, exp(-z * rhThin)); }
// A clump of reeds in the water (middle, half width, height).
float rhClump(vec2 q, vec3 c, float seed, float px) {
  float x = (q.x - c.x) / c.y, cov = 0.0;
  if (abs(x) > 1.2 || q.y > c.z * 1.2) return 0.0;
  float dome = sqrt(max(1.0 - x * x * 0.7, 0.0)), sway = 0.03 * q.y * q.y * sin(uTime * 0.35 + q.x * 1.3) / c.z;
  for (int i = 0; i < 3; i++) {
    float f = 6.0 + 4.0 * float(i), y = q.y / c.z, u = (q.x - (x + 0.5 * (float(i) - 0.8)) * 0.35 * y * y - sway) * f + seed * (1.0 + float(i)), id = floor(u), h = hash11(id + seed), top = (0.45 + 0.6 * h) * dome - y;
    // a stem, and a plume that hangs to one side at its tip
    float pl = smoothstep(0.0, 0.05, top) * rhOff(0.26, 0.06, top) * step(0.3, h), w = 0.07 + 0.06 * smoothstep(0.0, 0.9, top) + (0.16 + 0.16 * rhTex) * pl, e = px * f + 0.02 + 0.12 * pl;
    cov = max(cov, rhIn(e, abs(u - id - 0.35 - 0.3 * h + 0.2 * pl) - w) * smoothstep(0.0, 0.03, top) * min(1.0, (w + 0.1) / e));
  }
  return max(cov, rhIn(px, q.y - 0.13 * c.z * (1.0 - x * x) * (0.7 + 0.5 * noise(vec2(q.x * 12.0, seed)))));
}
// A boat from its side, prow to the left, someone in its stern with a pole.
float rhLine(vec2 q, vec2 a, vec2 b) { b -= a; q -= a; return length(q - b * sat(dot(q, b) / dot(b, b))); }
float rhBoat(vec2 q) {
  float x = clamp(q.x / 2.7, -1.0, 1.0), l = max(-x, 0.0), r = max(x, 0.0), sway = 0.06 * sin(uTime * 0.45);
  float d = max(max(q.y - 0.2 - 0.1 * x * x - 0.8 * pow(l, 7.0) - 0.25 * pow(r, 6.0), 0.66 * pow(l, 5.0) + 0.3 * pow(r, 5.0) - 0.05 - q.y) * 0.75, abs(q.x) - 2.7);
  q -= vec2(1.5, 0.12); q.x -= sway * q.y;
  float y = clamp(q.y, 0.0, 1.32);
  d = min(d, min(length(q - vec2(-0.05 * y, y)) - 0.23 + 0.083 * y, length(q - vec2(-0.09, 1.57)) - 0.1));
  d = min(d, rhLine(q, vec2(-0.05, 1.25), vec2(-0.45, 1.05)) - 0.055);
  return min(d, rhLine(q, vec2(-0.85, 2.15), vec2(0.6 + 2.0 * sway, -0.3)) - 0.022);
}
vec3 rhOutside(vec2 p) {
  float wide = smoothstep(0.5, 1.5, uRes.x / uRes.y), v = uOwn[5], foc = 0.95, long_ = 15.0 - 4.0 * uOwn[2], eye = 0.8 + 0.03 * sin(uTime * 0.3) + (v > 0.0 ? 2.6 : 0.45) * v;
  rhPx = 1.0 / (foc * uRes.y); rhN = long_ / rhStep;
  rhH += 0.5 * uOwn[2]; rhTall += 0.5 * uOwn[2];
  rhEnd = vec3(-5.7 + 3.4 * (1.0 - wide), 0.0, 10.6 + 2.6 * v); rhAxis = normalize(vec3(0.58 - 0.2 * uOwn[2], 0.0, 0.82)); rhDisc = vec2(0.36, 0.19);
  rhThin = 0.03 * exp(-0.6 * uSpace + 1.1 * uOwn[4]);
  vec2 k = vec2(p.x, p.y - 0.06 - 0.1 * v) / foc, sl = vec2(0.0);
  float px = rhPx, down = max(-k.y, 0.0), ring = 0.0, fx = 0.0;
  vec3 warm = vec3(1.0, 0.6, 0.25), c;
  if (k.y < 0.0) {
    // water: a slow swell, and ripples each band raises at its own distance
    float t = eye / max(down, 2e-3), bd = sat(band(1.0 - log2(1.0 + t) * 0.22) * rhGain);
    vec2 w = vec2(k.x * t, t), g = w * vec2(0.8, 1.3);
    sl = vec2(0.5, 1.0) * (vec2(noise(g * 0.9 + vec2(0.0, uTime * 0.13)), noise(g * vec2(0.7, 1.6) + vec2(3.0, uTime * 0.17))) - 0.5) * 0.03;
    sl += vec2(0.6, 1.0) * (vec2(noise(g * 5.0 + vec2(uTime * 0.3, 2.0)), noise(g * vec2(3.0, 9.0) - vec2(5.0, uTime * 0.4))) - 0.5) * (0.012 + 0.05 * bd * uEnergy + 0.03 * rhTex);
    // a fish rings it
    vec2 fq = w - vec2(0.45, 2.7); float fr = length(fq) + 1e-3;
    fx = (fr - 0.3 - 1.4 * (1.0 - uHits)) * 8.0; ring = exp(-fx * fx * 0.25) * uHits;
    sl = (sl + fq / fr * cos(fx) * ring * 0.1) / (1.0 + 0.02 * t * t);
    px += 0.0015;
  }
  // the morning, its sun low in the mist
  vec2 m = k + sl, d = vec2(m.x, abs(m.y)), s2 = d - rhDisc;
  float r = length(s2), cl = noise(vec2(d.x * 1.6 + 0.004 * uTime, d.y * 11.0));
  c = mix(rhSky, rhSky * vec3(0.34, 0.5, 0.7), smoothstep(0.0, 0.6, d.y + 0.2 * (cl - 0.5)));
  c += rhGlow * (0.7 * exp(-r * 4.5) + 0.3 * exp(-abs(d.y - 0.04) * 9.0 - s2.x * s2.x * 2.0)) * (0.55 + 0.9 * rhDrone + 0.5 * uCue) + rhGlow * rhOff(0.036, 0.03, r) * 0.5;
  // the far shore
  vec2 sh = eye + k.y * 60.0 < 0.0 ? m : k;
  float x = sh.x * 60.0, up = 1.6 + noise(vec2(x * 0.6, 5.0)) + 3.0 * smoothstep(0.5, 0.8, noise(vec2(x * 0.08 + 3.3, 8.0)));
  c = mix(c, rhVeil(rhReed * 0.25, 40.0), rhIn(px * 60.0, abs(eye + sh.y * 60.0) - up));
  // the hall and its mirror image: the whole round of it is drawn
  vec3 ex = vec3(rhAxis.z, 0.0, -rhAxis.x), o = vec3(0.0, eye, 0.0) - rhEnd, dir = vec3(k, 1.0), ld, hc;
  o = vec3(dot(o, ex), eye, dot(o, rhAxis));
  float s0, ta, chord; vec2 vt;
  for (int i = 0; i < 2; i++) {
    ld = vec3(dot(dir, ex), dir.y, max(dot(dir, rhAxis), 0.05));
    s0 = -o.z / ld.z; vt = rhVault(o, ld, 1.0); ta = max(vt.x, s0);
    chord = min(vt.y, (long_ - o.z) / ld.z) - ta;
    if (eye + dir.y * (chord > 0.0 ? ta : s0) > 0.0) break;
    dir.xy = m;
  }
  float cov = s0 > vt.x ? 1.0 : sat(chord * chord / (11.0 * rhW * px * max(ta, 0.1)));
  if (chord > 0.0 && ta > 0.0) {
    vec3 q = o + ld * ta; q.y = abs(q.y);
    vec2 n; float s; rhCurve(q.xy, n, s);
    if (s0 > vt.x) {
      float keyed, h = rhLattice(q.xy, px * ta * 1.2, keyed);
      hc = rhReed * 1.15 * (rhSky * 0.8 + rhGlow * 0.2);
      hc = mix(hc, vec3(0.02, 0.016, 0.015) + warm * (0.1 + 1.4 * sat(band(q.x / rhW * 0.5 + 0.5) * rhGain) * uEnergy + 1.2 * rhNight + 1.8 * uCue + 1.8 * keyed * uKeys), max(h, rhIn(0.02, max(abs(q.x) - 0.42, q.y - 1.7))));
    } else {
      // its back; each bay is a place in the loop, lamplight in its mats
      float z = (q.z - 0.6) / rhStep, kk = floor(z + 0.5), w = px * ta / rhStep, fine = 1.0 / (1.0 + 60.0 * w), strip = noise(vec2(s * 60.0, q.z * 1.5)), on;
      z -= kk;
      vec3 N = normalize(ex * n.x + vec3(0.0, n.y, 0.0) + rhAxis * z * 1.6 * rhOff(0.5, 0.2, abs(z)));
      hc = rhReed * vec3(0.5, 0.45, 0.42) * (0.4 + 0.8 * rhOff(0.5, 0.0, abs(z)) + 0.6 * (strip - 0.5) * fine);
      hc *= 1.0 - 0.6 * rhOff(0.04 + w, 0.0, abs(abs(z) - 0.32)) * fine;
      hc *= rhSky * (0.18 + 0.4 * sat(N.y)) + rhGlow * (0.3 + 1.1 * rhPad) * (rhSq(sat(0.45 + dot(N, normalize(vec3(rhDisc, 1.0))))) + 0.2);
      vec3 ink = rhSounds((kk + 0.5) / rhN, 0.5 - 0.5 * n.x, on);
      hc += ink * on * 0.9 * smoothstep(0.15, 0.5, abs(z)) * (0.35 + strip) * rhOff(0.75, 0.2, s);
    }
    c = mix(c, rhVeil(hc, ta), cov);
  }
  // standing bundles at its end, taller than its roof
  vec2 e = abs((o + ld * s0).xy), tall = rhH * vec2(1.06, 1.3), pd = max(abs(e.x - rhW * vec2(0.98, 0.4)) - mix(vec2(0.28), vec2(0.13), sat(e.y / tall)), e.y - tall);
  cov = rhIn(px * s0 * 1.3, min(pd.x, pd.y));
  c = mix(c, rhVeil(rhReed * 0.8 * (0.6 + 0.6 * noise(e * vec2(40.0, 2.0))) * (rhSky * 0.7 + rhGlow * 0.2), s0), cov);
  // islands, the bank, the boats, the near reeds
  float grow = 0.7 * max(uOwn[3], 0.0);
  for (int i = 0; i < 6; i++) {
    float f = float(i), z = i == 0 ? 24.0 : i == 1 ? 11.3 : i == 5 ? 5.4 : 30.0 - 5.3 * f, many = i == 1 ? 1.0 : sat(1.0 + 1.3 * uOwn[3]);
    vec2 h = eye + k.y * z < 0.0 ? m : k, q = vec2(h.x * z, abs(eye + h.y * z));
    vec3 lc = rhReed * (0.06 + 0.16 * sat(q.y * 0.6)) * (rhSky + (0.3 + 1.3 * rhPad * sat(q.y - 0.5)) * rhGlow);
    if (i < 2 || i == 5) cov = many * rhClump(q, i == 0 ? vec3(9.5 - 6.0 * grow, 2.8 + 6.0 * grow, 2.4 + grow) : i == 1 ? vec3(-3.6, 5.0, 0.5) : vec3(3.7 - 2.3 * (1.0 - wide), 1.2 + grow, (2.5 + grow) * many + 0.01), 7.0 + f * 13.0, px * z * 1.2);
    else {
      float way = fract(0.62 + 0.44 * (4.0 - f) - mod(uTravel, 400.0) * 0.0025), x = (way - 0.5) * 2.4;
      q.x -= x * z;
      float here = sat((i == 2 ? 0.0 : 1.0) + 1.4 * uOwn[3]) * smoothstep(0.0, 0.1, way) * rhOff(1.0, 0.9, way);
      cov = abs(q.x) < 3.2 && q.y < 2.8 ? here * rhIn(px * z, rhBoat(q)) : 0.0;
      lc = vec3(0.016, 0.014, 0.016) + 0.05 * rhSky;
      // a lamp at its prow
      q -= vec2(-2.3, 0.75);
      c += mix(warm, rhInk(uKind[3]), 0.3) * rhPhr * here * (0.15 * exp(-dot(q, q)) + exp(-dot(q, q) * 60.0));
      z *= 1.0 - 0.6 * rhPhr;
    }
    c = mix(c, rhVeil(lc, z), cov);
    // mist lies on the water
    if (i == 1) c = mix(c, rhSky + rhGlow * 0.25 * exp(-rhSq((k.x - rhDisc.x) * 2.2)), sat(exp(-abs(k.y + 0.04 * eye) * 22.0) * (0.25 + 0.45 * noise(vec2(p.x * 2.0 + 0.02 * uTime, k.y * 8.0))) * (0.8 + 0.6 * uOwn[4])));
  }
  if (k.y < 0.0) {
    c = mix(c, rhSky * vec3(0.12, 0.15, 0.16), 0.62 * smoothstep(0.02, 0.55, down));
    c += rhGlow * (ring * (0.5 * sat(sin(fx)) + 0.25) + exp(-rhSq((k.x - rhDisc.x) * 5.0)) * smoothstep(0.004, 0.009, sl.y) * 0.4 * (0.5 + 0.8 * rhDrone + uCue));
  }
  return c * (0.72 + 0.5 * c);
}
vec3 rhHour(vec3 day, vec3 eve, vec3 night) { return mix(mix(day, eve, rhEve), night, rhNight); }
vec3 render(vec2 p) {
  rhGain = 0.35 + 1.4 * uEnergy;
  rhDrone = sat(uDrone * rhGain); rhPad = sat(uPad * rhGain); rhTex = sat(uTexture * rhGain); rhPhr = sat(uPhrase * rhGain);
  rhEve = max(uOwn[0], 0.0); rhNight = max(-uOwn[0], 0.0);
  rhW = 2.3 - 0.35 * uOwn[2]; rhH = 3.35 + 0.8 * uOwn[2]; rhPeak = 0.04 + 0.04 * uOwn[2] + 0.5 * max(uOwn[2], 0.0);
  rhTall = rhH / sqrt(1.0 - rhSq(rhPeak / (rhW + rhPeak)));
  rhStep = 1.4 - 0.4 * uOwn[3]; rhR = 0.23 - 0.07 * uOwn[3];
  rhReed = mix(vec3(0.66, 0.42, 0.17), uOwn[1] < 0.0 ? vec3(0.34, 0.42, 0.13) : vec3(0.45, 0.44, 0.42), abs(uOwn[1]));
  float bright = 0.9 + 0.25 * uTone + 0.2 * uMic;
  rhLamp = rhHour(vec3(1.0, 0.72, 0.40), vec3(1.0, 0.45, 0.22), vec3(0.10, 0.12, 0.20));
  rhDay = rhHour(vec3(0.92, 0.98, 1.0), vec3(1.0, 0.5, 0.22), vec3(0.14, 0.2, 0.36)) * bright;
  rhBeam = rhHour(vec3(1.5, 1.4, 1.2), vec3(1.5, 0.68, 0.22), vec3(0.3, 0.42, 0.72)) * (2.2 + 1.2 * rhDrone);
  rhSky = rhHour(vec3(0.43, 0.51, 0.57), vec3(0.62, 0.34, 0.30), vec3(0.035, 0.05, 0.085)) * mix(vec3(1.0), uOwn[1] < 0.0 ? vec3(0.62, 1.0, 0.72) : vec3(1.4, 1.04, 0.66), abs(uOwn[1]));
  rhGlow = rhHour(vec3(1.0, 0.66, 0.36), vec3(1.2, 0.36, 0.12), vec3(0.35, 0.42, 0.52)) * bright;
  return screenOf(uVar < 0.5 ? rhInside(p) : rhOutside(p));
}
