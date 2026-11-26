// name: Sun halos
// a: Ice haze
// b: Moon ring
// what: A wide pale winter sky through thin ice haze, over snowed stubble and a row of poplars: a veiled low sun in a ring, red-brown on its inner edge, with a false sun each side, an arc touching the top and a faint level band; or a small moon behind lace cloud in close pastel rings, inside one wide thin ring over snow and firs.
// follows: By day drone is the ring, pads the false suns, phrase the upper arc, texture the level band, a hit a pillar of ice dust, a cue the arcs above. By night drone is the wide ring, pads and texture the inner rings, phrase the mock moons, a hit a ring running out, a cue the wide ring. Low thickens the cloud, bands light it, highs add glitter or stars, keys glints.
float shS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// A sound's colour, thinned to a tint of white light.
vec3 shTint(int k, float rich) {
  vec3 c = uKind[k] * uKind[k];
  c /= max(dot(c, vec3(0.3, 0.59, 0.11)), 0.04);
  return mix(vec3(1.0), min(c, 2.2), rich);
}
// Light bent by ice, across its edge: s is how far past the edge, w how soft, l how far it trails away. Red comes first.
vec3 shIce(float s, float w, float l) {
  vec3 t = s - vec3(0.0, 1.0, 2.1) * w;
  return smoothstep(-w * 1.1, w * 1.1, t) * exp(-max(t, 0.0) / l);
}
float shShape() { return shS(0.6, 1.6, uRes.x / uRes.y); }
// Specks of ice in the air, one to a cell, each turning slowly so that it flashes now and then.
vec3 shDust(vec2 p, float g, float seed) {
  vec2 q = p * g, i = floor(q), h = hash22(i + seed);
  vec2 at = 0.5 + 0.26 * sin(TAU * h + uTime * (0.1 + 0.16 * h.yx));
  float px = g / uRes.y, d = length(q - i - at), r0 = 0.05 + 0.04 * h.x, r = max(r0, 0.75 * px);
  float tw = sin(uTime * (0.5 + 0.9 * h.y) + TAU * h.x * 3.0);
  tw = max(tw, 0.0); tw *= tw; tw *= tw;
  vec3 c = 0.72 + 0.28 * cos(TAU * (h.y * 1.7 + vec3(0.0, 0.33, 0.67)));
  return c * tw * shS(r, r * 0.25, d) * 1.3 * r0 / r;
}
// The day.
vec3 shDay(vec2 p) {
  float px = 1.0 / uRes.y, wide = shShape(), hz = -0.315;
  float R = mix(0.185, 0.262, wide), hand = 0.5 - 0.5 * cos(TAU * uLoop);
  vec2 sun = vec2(mix(0.03, 0.20, wide) - 0.026 * hand, -0.135 + 0.010 * hand);
  vec2 d = p - sun;
  float r = length(d), up = max(p.y - hz, 0.0);
  // the sky, and the thin ice haze drawn out in fibres over it
  vec2 s = vec2(p.x + 0.55, 1.0) / (up + 0.42);
  vec2 q = rot(0.62) * s + vec2(uTime * 0.0035 + uTravel * 0.006, 0.0);
  float w = noise(q * vec2(0.9, 1.6)), w2 = noise(q * vec2(1.7, 3.0) + 5.0 * w + 9.0);
  float f1 = noise(vec2(q.x * 0.9 + w, q.y * 4.2 + w2 * 1.2)), f2 = noise(vec2(q.x * 1.7, q.y * 17.0 + w * 2.6 + 3.0)), f3 = noise(vec2(q.x * 3.4 + w2, q.y * 54.0 + w2 * 5.0 + w * 4.0));
  float sheet = shS(0.2, 0.85, 0.55 * w + 0.45 * f1);
  float fib = sheet * (0.20 + 0.45 * f1 + 0.95 * f2 * (0.35 + 0.9 * f3));
  float heard = band(up * 1.25) * uEnergy * 2.0;
  float haze = (0.35 + 0.5 * sheet * uLow + 0.75 * fib) + fib * heard * 0.8;
  vec3 col = mix(vec3(0.76, 0.85, 0.93), vec3(0.125, 0.27, 0.48), shS(-0.12, 0.85, up));
  col += vec3(0.50, 0.57, 0.64) * (haze - 0.40) * 0.55;
  vec4 m = piece(vec2(p.x * 0.6 + 0.5, 1.0 - sat(up / 0.8))) * shS(0.83, 0.4, abs(p.x));
  col += (m.rgb * m.rgb * 0.6 + m.a * 0.1) * fib * 0.4;
  // less light inside the ring than outside it, then the veiled sun
  col *= 1.0 - 0.15 * shS(R + 0.012, R - 0.05, r);
  col += vec3(1.0, 0.955, 0.87) * (0.55 * exp(-r * 8.5) + 0.8 * exp(-r * 20.0) + 2.0 * exp(-r * 62.0)) * (0.9 + 0.15 * uLevel);
  col += vec3(1.0, 0.98, 0.93) * 1.8 * shS(0.028, 0.006, r);
  // the ice's own light: ring, false suns, upper arc, level band, and the bow at the zenith
  float soft = mix(1.25, 0.8, uTone), give = 0.55 + 0.7 * uEnergy, catchIt = 0.35 + 0.95 * (1.0 - exp(-1.5 * fib - 0.35 * uLow * sheet - 0.15));
  vec3 ice = vec3(0.0);
  float low = (0.7 + 0.3 * abs(d.y) / max(r, 1e-3)) * (0.5 + 0.9 * w2);
  ice += shTint(0, 0.2) * shIce(r - R, 0.0105 * soft, 0.055) * (0.24 + 0.9 * uDrone * give) * low;
  float lev = d.y - 0.05 * d.x * d.x, ax = abs(d.x), dogs = ax - R * 1.06;
  float side = d.x < 0.0 ? 0.45 : 0.08;
  float dogH = 0.036 * mix(0.9, 1.15, uPad), bow = dogs - 1.1 * lev * lev;
  vec3 dog = shIce(bow, 0.0140 * soft, 0.018) * exp(-lev * lev / (dogH * dogH)) * 1.5;
  dog += vec3(0.9, 0.95, 1.0) * 0.22 * shS(0.0, 0.03, dogs) * exp(-max(dogs, 0.0) * 11.0) * exp(-lev * lev / (0.012 * 0.012));
  ice += shTint(1, 0.16) * min(dog * (side + 2.3 * uPad * give), vec3(1.15, 1.1, 1.25));
  float T = sqrt(ax * ax * 0.55 + 0.006) - 0.0775, tv = d.y - R - T - 0.9 * ax * ax * ax;
  ice += shTint(3, 0.18) * shIce(tv * 0.9, 0.008 * soft, 0.026) * exp(-ax * ax / 0.045) * shS(-0.06, 0.07, ax) * (0.05 + 1.25 * uPhrase * give + 1.3 * uCue);
  float lw = 0.015 + 0.004 * sin(p.x * 3.0);
  ice += shTint(2, 0.18) * exp(-lev * lev / (lw * lw)) * (0.04 + 0.85 * uTexture * give) * shS(0.04, 0.3, ax) * (0.25 + 1.1 * w2) * shS(1.3, 0.3, ax) * (1.0 - 0.75 * exp(-dogs * dogs * 400.0));
  vec2 z = p - sun - vec2(0.0, R * 3.36);
  float zr = R * 1.25 - length(z);
  vec3 cza = shIce(zr, 0.008 * soft, 0.016) * shS(0.95, 0.35, abs(atan(z.x, max(-z.y, 1e-3))));
  ice += cza * (0.10 + 0.35 * uPhrase * give + 2.4 * uCue);
  // the wide faint outer ring, and the pillar a voice lifts over the sun
  ice += shIce(r - R * 2.09, 0.011, 0.05) * (0.03 + 0.10 * uSpace + 0.35 * uCue * shS(0.0, 0.5, d.y));
  ice += vec3(1.0, 0.96, 0.9) * exp(-d.x * d.x / 0.00022) * exp(-abs(d.y) * 7.0) * (0.10 + 0.8 * uMic);
  vec3 sky = col + ice * catchIt * 0.85;
  col = sky;
  // far woods under the haze, and a row of bare poplars
  float n1 = noise(vec2(p.x * 9.0, 3.0)), n2 = noise(vec2(p.x * 70.0, 8.0)), n3 = noise(vec2(p.x * 260.0, 1.0));
  vec3 far = mix(vec3(0.24, 0.29, 0.36), vec3(0.75, 0.73, 0.70), exp(-abs(d.x) * 5.0) * 0.55);
  float hill = hz + 0.010 + 0.016 * noise(vec2(p.x * 2.2 + 4.0, 0.5));
  col = mix(col, mix(sky, far, 0.35), shS(px, -px, p.y - hill));
  float wood = hz + (0.004 + 0.016 * shS(0.35, 0.8, n1)) * (0.6 + 0.4 * n2) + 0.003 * n3;
  col = mix(col, far * 0.75, 0.85 * shS(px, -px, p.y - wood));
  // the fields
  if (p.y < hz + 0.004) {
    float dn = max(hz - p.y, 0.0) + 0.004, zed = 0.06 / dn;
    vec2 g = vec2((p.x - 0.1) * zed * 6.0, zed);
    float drift = noise(g * vec2(1.1, 2.2) + 3.0) * 0.6 + noise(g * vec2(3.1, 7.0)) * 0.4;
    float fall = exp(-abs(d.x) * 2.6);
    vec3 snow = mix(vec3(0.50, 0.64, 0.82), vec3(0.92, 0.98, 1.04), shS(0.19, 0.0, dn));
    snow *= 0.78 + 0.4 * drift;
    snow += vec3(1.0, 0.96, 0.89) * 0.75 * fall * (0.2 + drift) * exp(-dn * 3.0);
    // stubble standing through the snow, in rows that run to the horizon
    float row = (p.x + 0.16) * zed * 46.0, rw = zed * 46.0 * px * (1.0 + 0.6 * abs(p.x + 0.16) / dn), ra = abs(fract(row) - 0.5), zw = zed / dn * px;
    float tuft = noise(vec2(floor(row) * 7.3, zed * 30.0 + 97.0 * hash11(floor(row)))) * 0.45 + mix(0.5, noise(vec2(row * 9.0, zed * 160.0)), shS(1.4, 0.6, 160.0 * zw)) * 0.55;
    float st = shS(0.26 + rw, 0.02, ra) * shS(0.45, 0.75, tuft + 0.7 * (0.5 - drift)) * shS(0.004, 0.02, dn);
    st = mix(st, 0.10, shS(0.12, 0.45, max(rw, 4.0 * zw)));
    snow = mix(snow, snow * vec3(0.50, 0.49, 0.48), 0.7 * st);
    snow += shDust(vec2(p.x, p.y * 1.6), 60.0, 5.0) * (0.15 + 2.0 * uKeys);
    snow = mix(snow, sky * 0.98, exp(-dn * 45.0) * 0.6);
    snow += ice * 0.14 * catchIt;
    col = mix(col, snow, shS(px, -px, p.y - hz));
  }
  for (int k = 0; k < 8; k++) {
    float fk = float(k), h = hash11(fk + 3.0);
    vec2 b = p - vec2(mix(-0.2, -0.60, wide) + fk * 0.019 + 0.013 * h + 0.03 * step(4.5, fk), hz - 0.004);
    float tall = 0.052 + 0.036 * hash11(fk * 1.7 + 8.0), y = b.y / tall;
    if (y < -0.1 || y > 1.1 || abs(b.x) > 0.03) continue;
    b.x += 0.0012 * sin(b.y * 60.0 + fk * 2.0);
    float body = 0.0150 * sqrt(sat(y * 1.6 - 0.25)) * sat(1.0 - y) * (0.6 + 0.8 * noise(vec2(b.x * 200.0 + fk * 9.0, b.y * 190.0)));
    float twig = noise(vec2((b.x - b.y * 0.3 * sign(b.x)) * 520.0 + fk, b.y * 110.0));
    float a = shS(1.5 * px, -2.0 * px, abs(b.x) - body) * (0.25 + 0.65 * twig), tw = 0.0013 * (1.0 - 0.8 * y);
    float tr = shS(px, 0.0, abs(b.x) - tw) * step(0.0, y) * step(y, 0.95) * min(1.0, 0.4 + tw / px);
    col = mix(col, vec3(0.085, 0.10, 0.13), max(a, tr) * 0.88);
  }
  // ice dust low in the air, and the column of it that a hit lights
  float cx = p.x + mix(0.1, 0.30, wide) + 0.05 * sin(uTime * 0.043);
  float column = exp(-cx * cx / 0.0022) * shS(-0.40, -0.25, p.y) * shS(0.32, -0.05, p.y);
  float air = (0.10 + 0.9 * uHigh) * exp(-abs(p.y + 0.22) * 6.0) * 0.6;
  col += (shDust(p, 46.0, 1.0) + shDust(rot(0.4) * p, 85.0, 2.0)) * (air + 3.5 * column * uHits);
  col += shTint(4, 0.1) * column * uHits * 0.3;
  return col;
}
// The colours close round the moon: each wave length has its own size of ring. x is how far out, in rings.
vec3 shCorona(float x, out vec3 rings) {
  vec3 v = x / vec3(1.17, 1.0, 0.86);
  vec3 a = cos(1.2876 * min(v, 1.22));
  vec3 fade = exp(-max(v - 1.22, 0.0) * 1.05);
  rings = step(1.22, v) * (0.5 - 0.5 * cos(TAU * (v - 1.22)) * (0.35 + 0.65 * fade)) * fade;
  return a * a;
}
// The night.
vec3 shNight(vec2 p) {
  float px = 1.0 / uRes.y, wide = shShape(), hz = -0.365;
  float R = mix(0.25, 0.45, wide), hand = 0.5 - 0.5 * cos(TAU * uLoop);
  vec2 moon = vec2(mix(-0.02, -0.27, wide) + 0.024 * hand, 0.10 + 0.012 * hand), d = p - moon;
  float r = length(d), up = max(p.y - hz, 0.0);
  // lace cloud: small cells of it in a sheet overhead, thinned out in places
  vec2 s = vec2(p.x, 1.0) / (up + 0.75);
  vec2 q = rot(0.45) * s * 9.0 + vec2(40.0 * sin(uTime * 0.00045) + 44.0 * sin(uTravel * 0.00045), 0.0);
  float w = noise(q * 0.3), w2 = noise(q * 0.75 + 7.0), w3 = noise(q * 3.4 + 2.0);
  vec2 c = q * vec2(1.25, 2.1) + 0.9 * vec2(w2, w) + 0.45 * (w3 - 0.5), ci = floor(c), cf = c - ci;
  float puff = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j), v = o + 0.1 + 0.8 * hash22(ci + o) - cf;
    puff += exp(-dot(v, v) * 3.6);
  }
  float fine = noise(q * 9.0 + 3.0 * w3) * 0.6 + noise(q * 21.0) * 0.4;
  float lace = shS(0.25, 1.15, puff + 0.55 * (fine - 0.5) + 0.35 * (w3 - 0.5));
  float cover = shS(0.22, 0.8, 0.65 * w + 0.35 * w2 + 0.34 * exp(-r * r * 7.0) + 0.14 * uLow);
  float cloud = cover * (0.14 + 0.86 * lace * (0.7 + 0.5 * fine));
  // the sky and its stars
  vec3 col = mix(vec3(0.016, 0.034, 0.064), vec3(0.003, 0.010, 0.030), shS(0.0, 0.8, up));
  vec2 sq = rot(0.5) * p * 30.0, si = floor(sq), sh = hash22(si + 3.0), so = hash22(si + 41.0);
  float sd = length(sq - si - 0.06 - 0.88 * so), sr = max(0.034, 0.85 * 30.0 * px);
  col += vec3(0.8, 0.9, 1.0) * shS(sr, 0.0, sd) * sh.x * sh.x * sh.x * sh.x * sh.y * min(1.0, 0.003 / (sr * sr)) * (0.75 + 0.25 * sin(uTime * 0.7 + 40.0 * sh.x)) * (0.6 + 1.6 * uHigh) * (1.0 - 0.95 * cloud) * shS(0.1, 0.5, r);
  // moonlight in the cloud, with its rings
  float give = 0.5 + 0.8 * uEnergy, heard = band(sat(r * 1.7)) * uEnergy;
  vec3 rings, cor = shCorona(r / (0.058 * (0.94 + 0.13 * w2)), rings);
  vec3 lit = vec3(0.38, 0.54, 0.80) * (0.030 + 0.20 * exp(-r * 4.5) + 0.35 * exp(-r * 13.0)) * (0.8 + 0.4 * uLevel + 1.4 * heard);
  lit += shTint(1, 0.14) * cor * (0.75 + 0.75 * uPad * give);
  lit += rings * (0.22 + 0.45 * uPad * give + shTint(2, 0.2) * 0.75 * uTexture * give);
  vec4 m = piece(vec2(p.x * 0.6 + 0.5, 1.0 - sat(up / 0.85))) * shS(0.83, 0.4, abs(p.x));
  lit += (m.rgb * m.rgb * 0.8 + 0.1 * m.a) * 0.13;
  vec3 run = r - vec3(0.123, 0.118, 0.114) - 0.36 * (1.0 - uHits);
  lit += shTint(4, 0.15) * 0.9 * uHits * (0.3 + 0.7 * uHits) * exp(-run * run / (0.0004 + 0.0022 * (1.0 - uHits)));
  col += lit * (0.12 + 1.1 * cloud);
  col += vec3(1.0, 0.98, 0.94) * (0.10 * exp(-r * 22.0) + (1.7 - 0.6 * cloud) * shS(0.0215, 0.0185, r) * (0.55 + 0.55 * shS(0.2, 0.7, noise(d * 95.0 + 4.0))));
  // the wide ring of the ice far above, with a mock moon on each side
  float soft = mix(1.3, 0.8, uTone), lev = d.y - 0.1 * d.x * d.x, dogs = abs(d.x) - R * 1.02;
  vec3 ice = shTint(0, 0.22) * shIce(r - R, 0.016 * soft, 0.06 + 0.03 * uSpace) * (0.034 + 0.12 * uDrone * give + 0.18 * uCue);
  ice = mix(ice, vec3(dot(ice, vec3(0.33))), 0.6);
  ice += shTint(3, 0.2) * shIce(dogs - lev * lev, 0.011 * soft, 0.026) * exp(-lev * lev / 0.0013) * (0.02 + 0.55 * uPhrase * give + 0.35 * uCue);
  ice += vec3(0.8, 0.9, 1.0) * exp(-d.x * d.x / 0.0003) * exp(-abs(d.y) * 6.0) * 0.25 * uMic;
  col += ice * (0.65 + 0.5 * w - 0.25 * lace * cover);
  vec3 sky = col;
  // firs, and the snow under the moon
  for (int k = 0; k < 2; k++) {
    float fk = float(k), f = 62.0 - 22.0 * fk, tu = p.x * f + 0.9 * noise(vec2(p.x * 7.0, fk)), id = floor(tu), a = 0.0;
    float stand = shS(0.34 + 0.1 * fk, 0.75, noise(vec2(p.x * 2.1 + 2.6 + 5.0 * fk, 4.0)));
    for (int n = -1; n <= 1; n++) {
      float h = hash11(id + float(n) + 31.0 * fk), top = stand * (0.014 + 0.012 * fk + (0.03 + 0.035 * fk) * h * h), y = (top - p.y + hz + 0.004) * f;
      float jag = 0.65 + 0.5 * fract(y * (4.2 + h)) + 0.35 * (noise(vec2(tu * 9.0, p.y * 420.0)) - 0.5);
      a = max(a, shS(f * px, -f * px, abs(tu - id - float(n) - 0.1 - 0.8 * fract(h * 7.0)) - 0.36 * y * jag / (0.6 + top * f * 0.35)) * step(0.0, y));
    }
    a = max(a, shS(px, -px, p.y - hz - 0.005));
    col = mix(col, mix(vec3(0.014, 0.022, 0.036), vec3(0.004, 0.007, 0.012), fk), a);
  }
  float dn = max(hz - p.y, 0.0) + 0.006, zed = 0.06 / dn;
  vec2 g = vec2(p.x * zed * 5.0, zed);
  float drift = noise(g * vec2(1.0, 2.0) + 3.0) * 0.5 + noise(g * vec2(3.7, 11.0)) * 0.27 + noise(g * vec2(9.0, 34.0)) * 0.15 + noise(vec2(g.x * 17.0 + 9.0 * g.y, g.y * 95.0)) * 0.13 * shS(0.02, 0.08, dn);
  drift = mix(0.5, drift, shS(0.006, 0.022, dn));
  vec3 snow = vec3(0.060, 0.095, 0.16) * (0.1 + 3.2 * drift * drift) * (0.5 + 0.8 * exp(-abs(d.x) * 2.2)) * (0.85 + 0.4 * uLevel);
  snow += vec3(0.5, 0.58, 0.68) * exp(-d.x * d.x * 16.0) * shS(0.45, 0.9, drift) * 0.22 * exp(-dn * 6.0);
  snow += vec3(0.6, 0.7, 0.85) * shDust(vec2(p.x, p.y * 1.6), 60.0, 5.0) * (0.12 + 2.0 * uKeys);
  return mix(col, snow, shS(px, -px, p.y - hz - 0.006 * noise(vec2(p.x * 3.0, 1.0))));
}
vec3 render(vec2 p) { return screenOf(uVar < 0.5 ? shDay(p) : shNight(p)); }
