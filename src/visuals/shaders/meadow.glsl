// name: Meadow
// a: Long grass
// b: Still water
// what: A field of long grass in the last light, seen from low among the blades, the piece lying in it as drifts of glowing seed heads: far sounds far off, near sounds close; or reeds standing in still water at dusk, mirrored, with mist.
// follows: The low band is the wind that leans the grass, each sound lights the seed heads where it sits in the piece, the high band glints on the blade edges, the mix brings out the fireflies, a hit or cue sends one wave of wind across the field and lifts a cloud of sparks (over the water it also drops a ring).
// own: 0 1 short, fine and thick as turf, -1 few and tall as poles; 1 1 open flowers on thin stems, -1 broad bowed leaves; 2 the hour: 1 bright day, -1 a starry night; 3 1 snow lies on it all, -1 the blades dyed in the sounds' colours; 4 the eye: 1 high over the field, -1 down at its roots; 5 1 mountains behind, -1 a great moon in the sky; 6 1 thick fog, -1 flakes or petals falling; 7 1 planted in rows that run away from you, -1 in tussocks far apart
const float M_F = 0.9;   // how wide the eye is
float mDay, mNight, mSnow, mDye;
vec3 mAir;               // the light of the hour on what stands there
// The sky of another hour.
vec3 mHour(vec3 was, vec2 p, float e, vec2 sun) {
  float d = length(p - sun);
  if (mDay > 0.0) {
    vec3 c = mix(vec3(1.35, 1.38, 1.3), vec3(0.3, 0.6, 1.0), smoothstep(0.0, 0.55, e)) * (0.88 + 0.35 * uLevel);
    vec2 q = vec2(p.x * 1.5 + uTime * 0.008, e * 5.0 + 1.0);
    float n = 0.55 * noise(q) + 0.3 * noise(q * 2.2 + 7.0) + 0.15 * noise(q * 5.1);
    c = mix(c, vec3(1.8, 1.78, 1.75) - 0.9 * smoothstep(0.55, 0.9, n), smoothstep(0.45, 0.72, n) * smoothstep(0.02, 0.14, e) * 0.8);
    c += vec3(0.5, 0.45, 0.35) * exp(-d * 2.5) * (0.4 + 1.6 * uLevel);
    was = mix(was, c * mix(1.0, 0.82, mSnow), mDay);
  }
  if (mNight > 0.0) {
    vec3 c = mix(vec3(0.03, 0.055, 0.085), vec3(0.004, 0.008, 0.02), smoothstep(0.0, 0.45, e));
    c += vec3(0.07, 0.09, 0.12) * exp(-d * 3.5) * (0.6 + 0.8 * uLevel) * (1.0 - smoothstep(0.1, 0.6, -uOwn[5]));
    for (int i = 0; i < 2; i++) {
      vec2 q = p * (19.0 + 17.0 * float(i)) + float(i) * 5.3, id = floor(q), f = fract(q) - 0.5;
      float h = hash21(id + 3.0), h2 = fract(h * 91.3);
      vec2 o = f - 0.6 * (vec2(h2, fract(h * 517.0)) - 0.5);
      c += vec3(0.8, 0.88, 1.0) * smoothstep(0.075, 0.0, length(o)) * step(0.55, h) * (0.15 + h2 * h2) * (0.75 + 0.25 * sin(uTime * (0.4 + h2) + h * 40.0)) * smoothstep(0.03, 0.25, e);
    }
    was = mix(was, c, mNight);
  }
  if (uOwn[5] < 0.0) {                                    // the great moon
    vec2 q = (p - vec2(-0.75 * sun.x, sun.y + 0.2)) / (0.24 * smoothstep(0.0, 0.6, -uOwn[5]) + 0.01);
    float rr = dot(q, q), z = sqrt(max(1.0 - rr, 0.0)), on = smoothstep(1.01, 0.985, rr);
    vec3 n = vec3(q, z);
    float bands = noise(vec2(q.x * 1.4 + 2.0 * noise(q * 2.5), q.y * 5.0 + q.x * 1.2 + 7.0)), seas = noise(q * 2.1 + 11.0);
    float lit = sat(dot(n, normalize(vec3(sun.x > 0.0 ? 0.6 : -0.6, 0.3, 0.6))) * 1.1 + 0.08);
    vec3 m = mix(vec3(0.85, 0.82, 0.75), uKind[3], 0.5) * (0.55 + 0.35 * bands + 0.25 * seas) * (0.1 + 1.0 * lit) * (0.7 + 0.8 * uLevel);
    was = mix(was, m * mix(0.75, 1.3, mDay) + was * mix(0.35, 0.75, mDay), on * smoothstep(0.0, 0.15, -uOwn[5]));
    was += vec3(0.5, 0.48, 0.42) * 0.16 * exp(-3.0 * max(sqrt(rr) - 1.0, 0.0)) * (1.0 - on) * (1.0 - mDay) * -uOwn[5];
  }
  return was;
}
// Flakes or petals coming down, each at its own pace.
vec3 mFall(vec2 p) {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float f = float(i), n = 17.0 - 4.0 * f;
    vec2 q = p * n + vec2(uTime * (0.25 + 0.12 * f) + 0.6 * sin(uTime * 0.21 + p.y * 3.0 + f), uTime * (0.7 + 0.25 * f) + f * 7.7);
    float col = floor(q.x), hc = hash11(col * 1.7 + f * 31.0);
    q.y += hc * 9.0;
    vec2 id = vec2(col, mod(floor(q.y), 4096.0)), v = fract(q) - 0.5;
    float h = hash21(id + f * 13.0), h2 = fract(h * 77.7), a = uTime * (0.5 + h) + h * 40.0;
    v = rot(a) * (v - 0.5 * (vec2(h2, fract(h * 331.0)) - 0.5)); v.y *= mix(1.2 + 0.9 * sin(a * 1.3), 1.0, mSnow);
    float s = smoothstep(0.13, 0.13 - 0.05 - 0.05 * f * 0.4, length(v)) * step(0.45, h);
    c += s * mix(vec3(0.95), uKind[2] * 1.1, mix(0.75, 0.05, mSnow)) * (0.35 + 0.2 * f);
  }
  return c;
}
// The evening sky at a height e above the horizon.
vec3 mSky(vec2 p, float e, vec2 sun, float reeds) {
  vec3 low = mix(vec3(0.90, 0.32, 0.055), vec3(0.85, 0.30, 0.12), reeds);
  vec3 mid = mix(vec3(0.21, 0.05, 0.065), vec3(0.13, 0.03, 0.10), reeds);
  vec3 top = mix(vec3(0.004, 0.014, 0.045), vec3(0.002, 0.006, 0.028), reeds);
  vec3 c = mix(low, mid, smoothstep(0.0, mix(0.16, 0.13, reeds), e));
  c = mix(c, mix(vec3(0.030, 0.022, 0.075), vec3(0.016, 0.011, 0.055), reeds), smoothstep(0.07, 0.27, e));
  c = mix(c, top, smoothstep(0.18, 0.56, e));
  float d = length((p - sun) * vec2(1.0, 1.25));
  c += vec3(1.0, 0.5, 0.15) * (0.5 * exp(-d * 5.5) + mix(0.10, 0.04, reeds) * exp(-d * 2.4)) * (0.7 + 0.6 * uLevel) * mix(1.0, 1.25, reeds);
  c += vec3(2.6, 1.5, 0.5) * smoothstep(0.05, 0.04, d) * (1.0 - reeds);         // the sun itself, low and soft
  // long thin cloud, lit from under
  vec2 q = vec2(p.x * 1.2 + uTime * 0.006, e * 9.0 + 3.0);
  float n = 0.62 * noise(q) + 0.38 * noise(q * 2.3 + 5.0);
  float cl = smoothstep(0.5, 0.78, n) * smoothstep(0.04, 0.13, e) * smoothstep(0.5, 0.2, e);
  vec3 cc = mix(vec3(1.0, 0.33, 0.13), vec3(0.05, 0.025, 0.06), smoothstep(0.55, 0.85, n)) * (0.2 + 1.0 * exp(-d * 1.7));
  if (uOwn[2] != 0.0 || uOwn[5] < 0.0) return mHour(mix(c, cc, cl * mix(0.7, 0.45, reeds)), p, e, sun);
  return mix(c, cc, cl * mix(0.7, 0.45, reeds));
}
// Small slow lights: seeds in the last sun, fireflies.
vec3 mMotes(vec2 p, float n, float seed, float much, vec3 tint) {
  vec2 q = p * n + vec2(uTime * 0.03, -uTime * 0.018 * (1.0 + seed));
  vec2 id = floor(q), f = fract(q) - 0.5;
  float hx = hash21(id + seed * 13.1), hy = fract(hx * 91.7), h3 = fract(hx * 517.3);
  vec2 at = (vec2(hx, hy) - 0.5) * 0.44 + 0.08 * vec2(sin(uTime * 0.31 + hx * 40.0), cos(uTime * 0.27 + hy * 40.0));
  float d = length(f - at) / n, hl = max(1.0 - length(f - at) * 5.0, 0.0);
  float pulse = 0.5 + 0.5 * sin(uTime * (0.5 + 0.7 * hx) + hy * 50.0);
  float b = (2.2 * smoothstep(0.0055, 0.002, d) * (0.4 + 0.6 * h3) + 0.35 * hl * hl * hl) * (0.25 + 0.75 * pulse * pulse) * step(1.0 - much, h3);
  return mix(vec3(1.0, 0.8, 0.3), tint, 0.6 * step(0.5, hy)) * b;
}
vec3 render(vec2 p) {
  float reeds = step(0.5, uVar);
  float asp = uRes.x / uRes.y;
  float yh = mix(-0.07, -0.1, reeds);
  float camH = mix(0.4, 0.5, reeds);
  mDay = max(uOwn[2], 0.0); mNight = max(-uOwn[2], 0.0); mSnow = max(uOwn[3], 0.0); mDye = max(-uOwn[3], 0.0);
  mAir = mix(mix(vec3(0.34, 0.25, 0.21), vec3(1.25, 1.2, 1.1), mDay), vec3(0.075, 0.1, 0.15), mNight);
  if (uOwn[4] != 0.0) { yh += (uOwn[4] > 0.0 ? 0.36 : 0.27) * uOwn[4]; camH *= exp2(uOwn[4] * 1.1); }
  vec2 sun = mix(vec2(0.3, yh + 0.085), vec2(-0.3, yh - 0.05), reeds);
  float g = max(uHits, uCue);
  float px = 1.2 / uRes.y;
  // b: where on the water this pixel is, and the ring a hit drops into it
  float inWater = reeds * step(p.y, yh);
  float wz = camH * M_F / max(yh - p.y, 0.004), wx = p.x * wz / M_F;
  float rr = length(vec2(wx - 0.5, (wz - 3.2) * 0.8)), rad = (1.0 - g) * 3.6;
  float ring = inWater * g * sin((rr - rad) * 11.0) * exp(-pow((rr - rad) * 1.4, 2.0));
  float still = sin(wz * 21.0 + uTime * 0.5 + 2.0 * noise(vec2(wx * 2.0, wz * 5.0)));
  // the sky; in b the water mirrors it
  vec2 ps = mix(p, vec2(p.x + 0.002 * still + 0.02 * ring, 2.0 * yh - p.y + 0.03 * ring), inWater);
  vec3 sky = mSky(ps, max(ps.y - yh, 0.0), sun, reeds);
  vec3 col = sky * mix(1.0, 0.6 + 0.3 * ring, inWater);
  float nearSun = exp(-abs(p.x - sun.x) * 1.6);
  if (inWater > 0.0 && mSnow > 0.0) col = mix(col, mAir * vec3(0.62, 0.72, 0.82) * (0.75 + 0.4 * noise(vec2(wx * 2.0, wz * 3.0)) - 0.35 * smoothstep(0.03, 0.0, abs(noise(vec2(wx * 1.1, wz * 1.3) + 5.0) - 0.5))), 0.7 * mSnow);
  if (inWater > 0.0 && mDye > 0.0) col *= mix(vec3(1.0), 0.3 + 1.0 * uKind[0], mDye);
  vec3 haze = mix(vec3(0.20, 0.085, 0.028), vec3(0.035, 0.018, 0.035), reeds) * (0.6 + 0.9 * nearSun);
  if (uOwn[2] != 0.0) haze = mix(mix(haze, vec3(0.95, 1.0, 1.02), mDay), vec3(0.025, 0.042, 0.065) * (0.7 + 0.5 * nearSun), mNight);
  if (uOwn[6] > 0.0) haze = mix(haze, mAir * mix(vec3(0.95, 0.95, 1.0), vec3(1.2, 0.95, 0.8), (1.0 - abs(uOwn[2])) * nearSun), 0.8 * uOwn[6]);
  if (mSnow > 0.0) haze = mix(haze, mAir * vec3(0.8, 0.88, 1.0), 0.6 * mSnow);
  // far land: a line of trees in the haze (mirrored in b)
  float e = abs(p.y - yh);
  float ridge = 0.012 + 0.03 * noise(vec2(ps.x * 2.6 + 4.0, 1.0)) + 0.016 * noise(vec2(ps.x * 17.0, 5.0));
  float land = smoothstep(ridge + 0.004, ridge - 0.004, e);
  if (uOwn[5] > 0.0) {                                    // mountains, two ranges
    for (int i = 0; i < 2; i++) {
      float f = float(i), x = ps.x * (1.5 + 0.9 * f) + 3.0 + f * 9.0, n = 0.0, am = 0.5;
      for (int k = 0; k < 4; k++) { n += am * (1.0 - abs(2.0 * noise(vec2(x, 3.0 + f * 5.0)) - 1.0)); x = x * 2.1 + 1.7; am *= 0.45; }
      float top = uOwn[5] * (0.36 - 0.17 * f) * n * n * 2.1, in1 = smoothstep(0.003, -0.003, e - top) * step(1e-4, top);
      float face = noise(vec2(ps.x * 34.0 + e * 60.0, e * 25.0 + f * 7.0)), cap = smoothstep(0.35, 0.7, e / max(top, 0.01) + 0.35 * (face - 0.5)) * mix(0.35, 1.0, mSnow);
      vec3 rock = mix(mAir * vec3(0.16, 0.2, 0.27) * (0.7 + 0.6 * face), mAir * vec3(0.75, 0.8, 0.9) * (0.65 + 0.5 * face), cap * (1.0 - 0.6 * f) * mix(0.5, 1.0, max(mSnow, mDay)));
      col = mix(col, mix(rock, haze, (0.5 - 0.22 * f) * (1.1 - 0.9 * sat(e / max(top, 0.01)))), in1 * mix(1.0, 0.75, inWater));
    }
  }
  vec3 tree = mix(haze * 0.45, vec3(0.02, 0.02, 0.045), reeds * 0.6);
  if (uOwn[2] != 0.0 || mSnow > 0.0) tree = mix(tree, mAir * vec3(0.16, 0.2, 0.19) * (1.0 - 0.3 * mSnow) + haze * 0.25, max(max(mDay, mNight), mSnow));
  if (uOwn[6] > 0.0) tree = mix(tree, haze, 0.75 * uOwn[6]);
  col = mix(col, tree, land * mix(1.0, 0.8, inWater));
  float other1 = sat(abs(uOwn[2]) + abs(uOwn[6]) + mSnow + mDye);
  if (inWater > 0.0 && other1 > 0.0) {                   // the sounds' colours lie on the water
    vec4 m = piece(vec2(p.x / asp * 0.94 + 0.5, sat(0.1 + 0.9 * (yh - p.y) / (0.5 + yh))));
    col = mix(col, m.rgb / max(m.a, 0.03) * (mAir * 0.6 + 0.12), other1 * 0.42 * sat(m.a * (0.65 + 0.6 * uEnergy)) * (0.8 + 0.2 * still));
  }
  float plane = sat(max(max(abs(uOwn[7]), mSnow), max(uOwn[4], 0.0)) * 1.6);
  vec3 field = haze * vec3(0.45, 0.6, 0.3), soil = vec3(0.005, 0.016, 0.008), root = uKind[0] * uKind[0];
  if (uOwn[2] != 0.0) soil = mix(soil, mAir * mix(vec3(0.1, 0.17, 0.05), vec3(0.05, 0.07, 0.06), mNight), max(mDay, mNight));
  if (uOwn[7] != 0.0) soil = mix(soil, mAir * vec3(0.15, 0.1, 0.07), 0.8 * abs(uOwn[7]));
  if (mDye > 0.0) { soil = mix(soil, mAir * root * mix(0.28, 0.8, mDay), mDye); field = mix(field, mix(haze, mAir * root, 0.7), mDye); }
  if (uOwn[2] != 0.0) field = mix(field, mix(haze, soil * 2.5, 0.7), max(mDay, mNight));
  if (mSnow > 0.0) { soil = mix(soil, mAir * vec3(0.78, 0.86, 1.0), mSnow); field = mix(field, mAir * vec3(0.8, 0.88, 1.0), mSnow); }
  if (uOwn[6] > 0.0) field = mix(field, haze, uOwn[6]);
  if (reeds < 0.5 && plane > 0.0 && p.y < yh) {           // the open ground between
    float gz = camH * M_F / max(yh - p.y, 0.004), gx = p.x * gz / M_F, near = exp(-gz * 0.22);
    vec3 g = soil * mix(1.0, 0.75 + 0.35 * noise(vec2(gx * 1.6, gz * 2.2)) + 0.25 * near * noise(vec2(gx * 14.0, gz * 19.0)), near);
    if (uOwn[7] > 0.0) g *= 1.0 - 0.45 * uOwn[7] * cos((gx + 0.35) * TAU / 0.62 + PI) * exp(-gz * 0.12);
    if (uOwn[7] < 0.0) g *= 1.0 - 0.35 * uOwn[7] * (noise(vec2(gx * 0.7 + 3.0, gz * 1.3)) - 0.4);
    field = mix(field, mix(g, field, 1.0 - exp(-gz * mix(0.09, 0.4, max(uOwn[6], 0.0)))), plane);
  }
  col = mix(col, field, (1.0 - reeds) * step(p.y, yh));     // a: the far field
  float size = exp2(-uOwn[0] * (uOwn[0] > 0.0 ? 1.15 : 1.7)), leaf = max(-uOwn[1], 0.0), bloom = max(uOwn[1], 0.0), rows = max(uOwn[7], 0.0), tuft = max(-uOwn[7], 0.0);
  float back = exp(-2.6 * length(p - vec2(sun.x, max(sun.y, yh + 0.03))));       // how near the low light this pixel is
  // b: mist lying on the water between the far bank and the near reeds
  float my = p.y - yh;
  vec2 mq = vec2(p.x * 1.6 - uTime * 0.012, my * 9.0 + uTime * 0.008);
  float mist = reeds * sat((exp(-pow(my / 0.05, 2.0)) * 0.8 + 0.25 * exp(-abs(my) / 0.14)) * (0.3 + 2.6 * noise(mq) * noise(mq * 2.1 + 4.0)) * (0.7 + 0.5 * uSpace));
  if (uOwn[6] > 0.0 && p.y > yh) col = mix(col, haze, uOwn[6] * exp(-(p.y - yh) * 1.8) * 0.95);
  for (int i = 0; i < 8; i++) {
    float fi = float(i) / 7.0;
    float z = mix(13.0 * pow(0.665, float(i)), 6.5 * pow(0.75, float(i)), reeds);
    float s = M_F / z;
    float tw = (p.y - yh + camH * s) / s;                    // height above the ground here, in blades
    float mir = reeds * step(tw, 0.0);                       // b: under its foot a reed is its own reflection
    tw = mix(tw, -tw * 1.05 + 0.25 * ring, mir);
    float xw = p.x / s + float(i) * 17.3 + (0.006 * still * tw + 0.1 * ring) * mir;
    // the wind: slow waves crossing the field, and the one wave of a hit or cue
    float ph = xw * 0.4 + z * 0.8 - uTravel * 0.5;
    float wave = 0.5 + 0.5 * sin(ph + 1.3 * sin(ph * 0.37 + 1.7));
    float front = mix(-1.15, 1.2, 1.0 - g) - 0.22 * (1.0 - fi);
    float gd = (p.x - front) * 3.0;
    float gust = sqrt(g) * exp(-gd * gd);
    float lean = (0.04 + 0.08 * uEnergy + (0.05 + 0.5 * uLow) * wave * wave + 0.7 * gust) * mix(1.0, 0.4, reeds);
    if (uOwn[0] != 0.0) lean *= uOwn[0] < 0.0 ? 1.0 + 0.88 * uOwn[0] : 1.0 + 0.5 * uOwn[0];
    if (leaf > 0.0) lean += 0.1 * leaf * sin(xw * 1.9 + 2.0 * sin(xw * 0.6));
    float xs = xw - lean * tw * tw / (1.0 + 0.3 * tw);
    float near = smoothstep(0.7, 1.0, fi);
    float cw = mix(mix(0.055, 0.1, fi), mix(0.09, 0.17, fi), reeds);
    if (uOwn[0] != 0.0) cw *= uOwn[0] > 0.0 ? 1.0 - 0.45 * uOwn[0] : 1.0 - 1.1 * uOwn[0];
    cw *= 1.0 + 0.7 * bloom + 0.9 * leaf;
    float grow = 1.0, jit = 1.0 - 0.6 * max(bloom, leaf);
    float c = xs / cw, id = floor(c), other = step(0.5, c - id) * 2.0 - 1.0;
    // the piece lies in the field: across is the loop, far is the back of the room
    vec4 m = piece(vec2(p.x / asp * 0.94 + 0.5, 0.04 + 0.92 * fi));
    float loud = sat(m.a * (0.65 + 0.6 * uEnergy));
    vec3 hue = m.rgb / max(m.a, 0.03);
    hue = hue * hue * (0.6 + hue) * 1.5;
    float blur = mix(0.028, 0.016, reeds) * max(1.0 / z - 0.6, 0.0) + 0.004 * mir;
    float aa = (px + blur * (1.0 - 0.7 * max(leaf, bloom))) / s;
    // b: reeds stand in clumps, a far bank and the near sides, and leave the middle of the water open
    float clump = mix(1.0, smoothstep(0.0, 0.1, sin(xw * mix(1.1, 0.5, fi) + fi * 23.0) * sin(xw * 0.37 + fi * 9.0) + 0.25 - 0.5 * fi) * smoothstep(0.4, 0.5, abs(p.x + 0.1) * (0.35 + 0.6 * fi) + 0.55 * (1.0 - fi) * (1.0 - fi)), reeds);
    vec3 lc = vec3(0.0), lg = vec3(0.0); float la = 0.0;
    for (int j = 0; j < 2; j++) {
      float cid = id + float(j) * other;
      float hx = hash21(vec2(cid * 0.731 + 0.17, float(i) * 7.13 + 3.3 + reeds * 9.0));
      float hy = fract(hx * 57.31), h3 = fract(hx * 131.7), h4 = fract(hx * 717.3);
      float bh = mix(mix(0.5, 1.15, hy * hy), mix(1.1, 2.0, hy), reeds) * (1.0 + 0.5 * near * (1.0 - reeds));
      bh *= size;
      if (rows > 0.0) grow = mix(1.0, smoothstep(0.1, 0.55, 0.5 + 0.5 * cos(((cid + 0.5) * cw - float(i) * 17.3 + 0.35) * TAU / 0.62)), rows);
      if (tuft > 0.0) grow = mix(1.0, smoothstep(0.36, 0.7, noise(vec2((cid + 0.5) * cw * 1.15, float(i) * 5.3))) * 1.25, tuft);
      float tb = tw;
      if (plane > 0.0) tb += plane * (1.0 - reeds) * camH * 0.55 * (fract(hx * 913.7) - 0.5);
      if (uOwn[7] != 0.0) bh = max(bh * mix(1.0, grow, 0.75), 0.02);
      float t = tb / bh, tt = sat(t);
      float dx = xs - (cid + 0.5 + ((hx - 0.5) * 0.4 + (h3 - 0.5) * 0.8 * tt * tt) * jit) * cw;
      float w0 = mix(0.011 + 0.011 * h4, 0.012 + 0.008 * h4, reeds) * (1.0 + 0.8 * fi + 0.6 * near * reeds);
      if (uOwn[0] != 0.0) w0 *= uOwn[0] > 0.0 ? 1.0 - 0.4 * uOwn[0] : 1.0 - 0.75 * uOwn[0];
      float w = w0 * (1.0 - tt * tt) * (0.45 + 0.55 * (1.0 - tt));
      if (uOwn[0] < 0.0) w = mix(w, w0 * (1.0 - 0.3 * tt), -uOwn[0]);
      if (leaf > 0.0) w = mix(w, min(w0 * 2.7 * (0.16 + 1.5 * tt) * (1.0 - tt * tt * tt), 0.4 * cw), leaf);
      if (bloom > 0.0) w = mix(w, w0 * 0.45 * (1.0 - 0.5 * tt), bloom);
      // a seed head on some blades; on a reed a long plume
      float has = step(mix(0.55, 0.4, reeds), h4) * (1.0 - near * (1.0 - reeds));
      if (leaf > 0.0) has *= 1.0 - smoothstep(0.0, 0.7, leaf);
      float petals = 0.0, pr = 9.0, ro = 0.0;
      if (bloom > 0.0) {                                  // an open flower at the top of the stem
        ro = bloom * min(w0 * (3.6 + 2.0 * hy) * mix(1.0, 1.9, reeds), 0.58 * cw);
        vec2 v = vec2(dx, (tb - bh) * (1.15 + 0.5 * h3));
        float an = atan(v.y, v.x + 1e-5);
        pr = length(v) / max(ro, 1e-4);
        petals = step(0.15, h4) * smoothstep(1.0 + aa / max(ro, 1e-3), 1.0 - aa / max(ro, 1e-3) - 0.06, pr + 0.16 * (0.5 - 0.5 * cos(an * (5.0 + floor(3.0 * h3)) + hx * 30.0)));
        has *= 1.0 - smoothstep(0.0, 0.5, bloom);
      }
      float h0 = mix(0.74, 0.66, reeds);
      float u = sat((t - h0) / (1.0 - h0)), bell = 4.0 * u * (1.0 - u);
      float hw = w0 * mix(1.5, 2.3, reeds) * sqrt(bell) * (1.0 - 0.4 * u) * has;
      float ww = max(w, hw);
      float ah = aa + 0.45 * hw;                             // a head has a soft feathered edge
      float cover = smoothstep(ww + ah, ww - ah, abs(dx)) * smoothstep(1.0, 0.985, t) * step(0.0, tb);
      cover *= mix(1.0, step(mix(0.6, 0.3, reeds) * (1.0 - 0.6 * max(leaf, bloom)), h3), near);              // the nearest are few
      if (uOwn[7] != 0.0) cover *= smoothstep(0.05, 0.3, grow);
      if (plane > 0.0) cover *= mix(1.0, smoothstep(0.0, 0.09, tb), plane * (1.0 - reeds));
      if (uOwn[4] > 0.0) { float left = step(0.85 * uOwn[4] * near, fract(hx * 37.7) + 0.001); cover *= left; petals *= left; }
      // the blade: deep at the root, straw and gold toward the tip, one half of the fold in shade, light coming through it
      vec3 bc = mix(vec3(0.006, 0.026, 0.011), mix(vec3(0.035, 0.11, 0.02), vec3(0.15, 0.105, 0.026), hx * hx * 0.9), tt);
      bc = mix(bc, vec3(0.008, 0.018, 0.012) + vec3(0.02, 0.03, 0.012) * tt, reeds * 0.85);
      float side = sat(0.5 + 0.5 * dx / max(w, 1e-4) * sign(sun.x - p.x + 0.001));
      if (leaf > 0.0 || uOwn[0] < 0.0) side = mix(side, sat(0.5 + 0.5 * dx / max(w, 1e-4) * clamp((sun.x - p.x) * 5.0, -1.0, 1.0)), max(leaf, sat(-uOwn[0])));
      bc *= 0.5 + 0.65 * side;
      bc += vec3(0.45, 0.26, 0.05) * smoothstep(0.55, 1.0, side) * tt * (0.12 + 0.5 * back) * (1.0 - 0.6 * reeds);
      bc += vec3(0.7, 0.36, 0.05) * back * tt * (0.3 + 0.7 * side) * (0.9 + 0.6 * gust);
      bc += vec3(0.15, 0.14, 0.05) * (gust + wave * wave * (0.15 + 0.6 * uLow) * (1.0 - 0.6 * fi)) * tt * (1.0 - 0.7 * reeds);  // bowed grass shows its pale side
      float gl = 0.5 + 0.5 * sin(t * 7.0 - uTime * 1.1 + hy * 40.0); gl *= gl; gl *= gl; gl *= gl;
      if (leaf > 0.0) bc *= 1.0 - 0.45 * leaf * smoothstep(0.16, 0.0, abs(dx) / max(w, 1e-4)) + 0.25 * leaf * sin(dx / max(w, 1e-4) * 22.0) * (1.0 - fi * 0.3);
      if (uOwn[0] < 0.0) bc *= 1.0 + uOwn[0] * 0.5 * smoothstep(0.03, 0.0, abs(fract(tb * 1.9 + hy) - 0.5));
      if (uOwn[2] != 0.0) {                               // the green of day, the grey of night
        vec3 dc = mAir * mix(vec3(0.05, 0.1, 0.03), mix(vec3(0.2, 0.42, 0.09), vec3(0.55, 0.46, 0.16), hx * hx), tt) * (0.45 + 0.75 * side);
        if (leaf > 0.0) dc *= 1.0 - 0.4 * leaf * smoothstep(0.16, 0.0, abs(dx) / max(w, 1e-4));
        bc = mix(bc, dc * mix(vec3(1.0), vec3(0.7, 0.95, 1.1), mNight) + 0.16 * mAir * (gust + wave * wave * 0.5) * tt, max(mDay, mNight));
      }
      if (mDye > 0.0) bc = mix(bc, (mAir * 0.85 + vec3(0.5, 0.36, 0.2) * back * (1.0 - mDay) * (1.0 - mNight)) * mix(root * 0.35, mix(uKind[1], uKind[2], h3 * h3) * (0.5 + 0.5 * uKind[1]), tt) * (0.45 + 0.8 * side) * (1.0 + 0.9 * loud * hue) * (1.0 - 0.4 * leaf * smoothstep(0.16, 0.0, abs(dx) / max(w, 1e-4))), mDye);
      if (leaf > 0.0) bc += leaf * hue * loud * (0.1 + 0.4 * tt) * (0.5 + 0.5 * side);
      if (mSnow > 0.0) {
        float cap = smoothstep(0.35, 0.75, side * 0.6 + 0.5 * tt + 0.3 * (hy - 0.5));
        bc = mix(bc, mAir * mix(vec3(0.16, 0.15, 0.15), vec3(0.95, 1.0, 1.08), cap), mSnow * 0.9);
      }
      bc += vec3(1.0, 0.85, 0.5) * gl * smoothstep(0.3, 0.9, side) * (0.04 + 0.8 * uHigh) * (0.25 + back);
      // the head: straw until its sound comes, then lit in the sound's colour
      vec3 hc = vec3(0.13, 0.08, 0.025) * (0.4 + 2.2 * back) * (1.0 - 0.8 * sat(m.a * 3.0)) + hue * (0.06 + 1.25 * loud) * (0.5 + 0.5 * bell) * (0.6 + 0.4 * side);
      if (uOwn[2] != 0.0 || mSnow > 0.0) {
        vec3 sc = mAir * mix(vec3(0.62, 0.52, 0.3), mix(vec3(0.5, 0.44, 0.36), vec3(1.0), sat(side + u - 0.6)), mSnow) * (0.5 + 0.5 * side);
        hc = mix(hc, mix(sc, hue * (mAir * 0.5 + 0.1 + 0.7 * loud), sat(m.a * 2.5)) * (0.7 + 0.3 * bell), max(max(mDay, mNight), mSnow));
      }
      bc = mix(bc, hc, has * smoothstep(0.0, 0.12, u));
      if (petals > 0.0) {
        vec3 pc = mix(mix(uKind[1], uKind[2], step(0.5, hy)), uKind[3], step(0.8, h3));
        pc = mix(pc, m.rgb / max(m.a, 0.03), 0.7 * sat(m.a * 2.0));
        pc = pc * (0.25 + 0.75 * pc) * 1.15 * (mAir * (0.75 + 0.5 * side) + 0.25 * back + 0.9 * loud) * (0.55 + 0.45 * smoothstep(0.1, 0.9, pr)) * (0.85 + 0.3 * gust);
        pc = mix(pc, mAir * mix(vec3(0.12, 0.09, 0.03), vec3(0.6, 0.45, 0.12), step(0.5, hx)), smoothstep(0.27, 0.2, pr));
        pc = mix(pc, mAir * vec3(0.95, 1.0, 1.08), mSnow * 0.7 * smoothstep(0.2, 0.6, (tb - bh) / max(ro, 1e-3) + 0.3));
        bc = mix(bc, pc, petals); cover = max(cover, petals);
      }
      float ex = dx / (cw * 0.42), ey = (t - 0.5 - 0.5 * h0) / (1.0 - h0);
      float halo = max(1.0 - ex * ex - ey * ey, 0.0);
      lg += hue * loud * has * halo * halo * halo * 0.6;
      lc = mix(lc, bc, cover); la = max(la, cover);
    }
    // the ground the blades stand in (a)
    float foot = smoothstep(0.1, 0.0, tw) * (1.0 - reeds);
    foot *= 1.0 - plane;
    lc = mix(lc, soil, foot); la = max(la, foot);
    if (rows > 0.0 || tuft > 0.0) clump = mix(clump, 1.0, sat(2.0 * max(rows, tuft)));
    vec3 hz = haze;
    if (other1 > 0.0) hz += other1 * hue * loud * (0.04 + 0.4 * mAir) * max(0.35, max(uOwn[6], 0.0));
    float fog = 1.0 - exp(-z * mix(0.11, 0.07, reeds));
    if (uOwn[6] > 0.0) fog = mix(fog, 1.0 - exp(-z * 0.5), uOwn[6]);
    if (mDay > 0.0) fog *= 1.0 - 0.45 * mDay * (1.0 - max(uOwn[6], 0.0));
    float dim = mix(1.0, mix(0.3, 0.15, reeds), near) * mix(1.0, 0.5, mir) * (1.0 - 0.35 * reeds);    // the nearest stand dark against the light
    if (uOwn[2] != 0.0 || mSnow > 0.0) dim = mix(dim, mix(1.0, 0.55, mir) * mix(1.0, 0.72, near), max(max(mDay, mNight), mSnow));
    if (leaf > 0.0 || bloom > 0.0) dim = mix(dim, max(dim, 0.75 * mix(1.0, 0.5, mir)), max(leaf, bloom));
    col = mix(col, mix(lc * dim, hz, fog * mix(0.9, 0.8, reeds)), la * clump * mix(1.0, 0.8, mir));
    col += lg * clump * (1.0 - 0.5 * fog) * mix(1.0, 0.6, mir);
    vec3 bank = vec3(0.10, 0.07, 0.11) * (0.8 + 0.6 * uLevel) + 0.3 * sky;
    if (uOwn[2] != 0.0 || mSnow > 0.0) bank = mix(bank, mAir * vec3(0.6, 0.62, 0.65) + 0.25 * sky, max(max(mDay, mNight), mSnow));
    col = mix(col, bank, (0.8 - 0.5 * mDay) * mist * step(3.5, float(i)) * step(float(i), 4.5));
  }
  // seeds and fireflies, more of them as the music fills; a hit lifts a cloud of them along the wave
  float front = mix(-1.15, 1.2, 1.0 - g);
  float lift = sqrt(g) * exp(-pow((p.x - front) * 2.2, 2.0));
  float much = 0.04 + 0.1 * uLevel + 0.08 * uTexture + 0.32 * lift;
  float zone = smoothstep(0.42, -0.05, p.y) * (0.5 + 0.6 * uLevel + 1.2 * lift);
  vec2 pm = vec2(p.x, mix(p.y, yh + abs(p.y - yh), reeds)); // b: the water doubles them
  vec3 motes = mMotes(pm * rot(-0.25), 8.0, 1.0, much, kindColour(2.0)) + 0.7 * mMotes(pm * rot(0.4) + 3.0, 15.0, 2.0, much, kindColour(3.0));
  if (mDay > 0.0) motes *= 1.0 - 0.6 * mDay;
  col += motes * zone * mix(1.0, 0.5, inWater);
  if (uOwn[6] < 0.0) { vec3 fl = mFall(p) * -uOwn[6] * (0.8 + 1.5 * lift); col = mix(col, fl * (mAir + mix(0.12, 0.5, mSnow)) * 1.1, sat(dot(fl, vec3(0.5)))); }
  col += vec3(1.0, 0.42, 0.09) * 0.14 * exp(-4.5 * length((p - sun) * vec2(1.0, 1.5))) * (1.0 - reeds) * (0.7 + 0.6 * uLevel) * (1.0 - 0.75 * max(mDay, mNight));   // the low sun flares over the grass
  col /= 1.0 + 0.7 * dot(p, p);                              // the corners fall away
  return screenOf(col * 1.05);
}
