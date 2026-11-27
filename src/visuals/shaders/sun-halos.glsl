// name: Sun halos
// a: Ice haze
// b: Moon ring
// what: A wide pale winter sky through thin ice haze, over snowed stubble and a row of poplars: a veiled low sun in a ring, red-brown on its inner edge, with a false sun each side, an arc touching the top and a faint level band; or a small moon behind lace cloud in close pastel rings, inside one wide thin ring over snow and firs.
// follows: By day drone is the ring, pads the false suns, phrase the upper arc, texture the level band, a hit a pillar of ice dust, a cue the arcs above. By night drone is the wide ring, pads and texture the inner rings, phrase the mock moons, a hit a ring running out, a cue the wide ring. Low thickens the cloud, bands light it, highs add glitter or stars, keys glints.
// own: 0 the eye: 1 looks straight up, no ground is left, -1 the horizon stands high and the ground lies wide; 1 the ground: 1 still water that gives the sky back, -1 bare dunes in the texture's colour; 2 1 a range of peaks on the horizon, -1 tall reeds (b: firs) close before the eye; 3 1 a nest of many rings, -1 one small tight ring; 4 1 the last light, the horizon in the pad's colour under the drone's, -1 white air with the rings washed in as if in ink; 5 1 a great near disc, -1 three suns whose rings cross; 6 1 cloud in long rows, -1 soft flakes fall; 7 1 engraved in lines round the sun, -1 set in dots
float shP(float x) { return max(x,0.0); }
float shRich;      // how much of its own colour a sound's light keeps over what it does plainly
vec2 shAt;         // where the sun stands
float shHz;        // where the horizon is
float shS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
vec3 shTint(int k, float rich) {
  vec3 c = uKind[k] * uKind[k];
  c /= max(dot(c, vec3(0.3,0.59,0.11)),0.04);
  return mix(vec3(1.0), min(c,2.2), rich + shRich);
}
vec3 shIce(float s, float w, float l) {
  vec3 t = s - vec3(0.0,1.0,2.1) * w;
  return smoothstep(-w * 1.1, w * 1.1, t) * exp(-max(t,0.0) / l);
}
float shShape() { return shS(0.6,1.6, uRes.x / uRes.y); }
vec3 shDust(vec2 p, float g, float seed) {
  vec2 q = p * g, i = floor(q), h = hash22(i + seed);
  vec2 at = 0.5 + 0.26 * sin(TAU * h + uTime * (0.1 + 0.16 * h.yx));
  float px = g / uRes.y, d = length(q - i - at), r0 = 0.05 + 0.04 * h.x, r = max(r0,0.75 * px);
  float tw = sin(uTime * (0.5 + 0.9 * h.y) + TAU * h.x * 3.0);
  tw = max(tw,0.0); tw *= tw; tw *= tw;
  vec3 c = 0.72 + 0.28 * cos(TAU * (h.y * 1.7 + vec3(0.0,0.33,0.67)));
  return c * tw * shS(r, r * 0.25, d) * 1.3 * r0 / r;
}
vec3 shPaper() { return vec3(1.85,1.81,1.72); }
float shLow(float hz) { return hz + 0.30 * shP(-uOwn[0]) - 0.60 * shP(uOwn[0]); }
float shNear() { return exp2(0.95 * min(uOwn[3],0.0)) * (1.0 + 0.1 * shP(uOwn[3])); }
vec2 shMirror(vec2 p, float hz) {
  float dn = hz - p.y, zed = 0.06 / (dn + 0.012);
  float a = noise(vec2(p.x * zed * 9.0, zed * 34.0 + uTime * 0.06)) - 0.5, b = noise(vec2(p.x * zed * 24.0 + 7.0, zed * 90.0 - uTime * 0.1)) - 0.5;
  float k = (a + 0.5 * b) * (0.25 + 0.35 * uLow);
  return vec2(p.x + 0.12 * k * dn, hz + dn * (1.0 + 0.22 * k));
}
vec3 shInk(vec3 paper, vec3 light) {
  light = min(light,2.0);
  float m = max(light.r, max(light.g, light.b));
  return paper * exp(-2.3 * (1.25 * m - light));
}
float shCrag(float x) {
  x += 0.28 * noise(vec2(x * 1.6,4.0));
  float a = 1.0 - abs(2.0 * noise(vec2(x,1.5)) - 1.0), b = 1.0 - abs(2.0 * noise(vec2(x * 2.7,8.5)) - 1.0), c = 1.0 - abs(2.0 * noise(vec2(x * 7.1,3.0)) - 1.0);
  return a * (0.36 + 0.34 * b) + 0.22 * b + 0.12 * c + 0.05 * noise(vec2(x * 23.0,5.0));
}
vec3 shPeaks(vec3 c, vec2 p, vec3 air, vec3 lit, float px) {
  for (int k = 0; k < 2; k++) {
    float fk = float(k), g = 2.3 + 1.5 * fk, x = p.x * g + 3.2 + 9.0 * fk, rise = uOwn[2] * (0.30 - 0.17 * fk);
    if (p.y > shHz + rise * 1.06) continue;
    float h = shCrag(x), dd = shHz + rise * h - p.y, tilt = (shCrag(x + 0.05 + dd * 0.5) - h) * clamp((shAt.x - p.x) * 7.0,-1.0,1.0);
    float v = noise(vec2(x * 11.0 + dd * 30.0, dd * 14.0)), v2 = noise(vec2(x * 34.0 - dd * 60.0, dd * 46.0));
    float face = shS(0.25,0.8,0.5 - tilt * 2.6 + 0.5 * (v - 0.5) + 0.35 * (v2 - 0.5)), high = shS(-0.05,0.16, p.y - shHz);
    vec3 rock = air * (0.16 + 0.18 * v2) + (air * 0.7 + lit) * face * mix(0.3,1.0, high);
    rock = mix(rock, air, (0.42 - 0.22 * fk) + 0.5 * exp(-max(p.y - shHz,0.0) * 26.0));
    c = mix(c, rock, shS(-px, px, dd));
  }
  return c;
}
vec3 shDunes(vec3 far, vec2 e, vec3 sand, float px) {
  vec3 c = far;
  float deep = shHz + 0.62;
  for (int k = 0; k < 5; k++) {
    float fk = float(k), z = (fk + 0.15) / 4.6, at = shHz - deep * z * z * 0.8 + 0.004, w = 5.2 - 0.75 * fk, x = e.x * w + fk * 5.7;
    float n = 1.0 - abs(2.0 * noise(vec2(x * 0.42, fk)) - 1.0), top = at + (0.012 + 0.10 * z) * (n - 0.5), dd = top - e.y;
    if (dd < -px) continue;
    float xs = x * 0.42 + dd * (1.3 + 0.5 * noise(vec2(dd * 14.0, fk))), sl = abs(2.0 * noise(vec2(xs - 0.03, fk)) - 1.0) - abs(2.0 * noise(vec2(xs + 0.03, fk)) - 1.0), toSun = clamp((shAt.x - e.x) * 5.0,-1.0,1.0), lean = sl * 3.6 * toSun, body = shS(0.0,0.09 + 0.1 * z, dd);
    float rip = sin(dd * (150.0 - 80.0 * z) + 5.0 * noise(vec2(x * 1.4, dd * 9.0)) + x * 2.0);
    vec3 s = sand * (0.36 + 0.75 * sat(0.42 - lean - 0.35 * body) + 0.05 * rip * z) + sand * 0.35 * exp(-dd * 40.0) * exp(-abs(shAt.x - e.x) * 2.0);
    c = mix(c, mix(far, s,0.45 + 0.55 * sat(z * 2.0)), shS(-px, px, dd));
  }
  return c;
}
vec3 shReeds(vec3 c, vec2 e, vec3 ink, vec3 rim, float px) {
  float tall = -uOwn[2];
  for (int k = 0; k < 2; k++) {
    float fk = float(k), f = 17.0 - 7.0 * fk, id = floor(e.x * f);
    for (int n = -2; n <= 2; n++) {
      float i = id + float(n), h = hash11(i + 31.0 * fk + 2.0), g = hash11(i * 1.7 + 9.0 + fk);
      float up = -0.55 + tall * (0.30 + 0.20 * fk + 0.52 * h * h), y = (e.y + 0.56) / (up + 0.561);
      if (y > 1.02 || y < 0.0) continue;
      float lean = (g - 0.42) * 0.17 + 0.006 * sin(uTime * (0.31 + 0.2 * g) + 6.0 * h), x = e.x - (i + 0.5 + 0.55 * (g - 0.5)) / f - lean * y * y;
      float w = (0.0016 + 0.0014 * fk) * (1.2 - 0.8 * y), head = shS(0.80,0.86, y) * shS(1.02,0.93, y);
      w += head * (0.0038 + 0.0035 * fk) * (0.55 + 0.75 * noise(vec2(x * 160.0, e.y * 240.0 + 20.0 * h)));
      float a = shS(px,-px, abs(x) - w);
      float l = y - 0.22 - 0.3 * g, side = h > 0.5 ? 1.0 : -1.0, lx = x - side * l * l * 0.36;
      a = max(a, shS(px,-px, abs(lx) - 0.0075 * (0.6 + 0.6 * fk) * sqrt(sat(l * 5.0)) * sat(1.0 - l * 2.3)) * step(0.0, l));
      float edge = sat(x * clamp((shAt.x - e.x) * 9.0,-1.0,1.0) / w * 0.6 + 0.4);
      c = mix(c, mix(ink, rim, (0.10 + 0.5 * edge * edge) * (0.5 + 0.5 * head) * (1.0 - 0.4 * fk)), a * (0.72 + 0.28 * fk));
    }
  }
  return c;
}
float shFlakes(vec2 p) {
  float s = 0.0;
  for (int k = 0; k < 4; k++) {
    float fk = float(k), g = 26.0 / (1.0 + 0.95 * fk);
    vec2 q = p * g + vec2(0.5 * sin(uTime * 0.13 + fk * 2.0) + 3.7 * fk, uTime * (0.55 + 0.1 * fk)), i = floor(q), h = hash22(i + 13.0 * fk);
    float r = 0.07 + 0.17 * h.x * h.x + 0.03 * fk, d = length(q - i - 0.3 - 0.4 * h);
    s += shS(r, r * 0.35, d) * step(0.3, h.y) * (0.95 - 0.2 * fk);
  }
  return s;
}
vec3 shDisc(vec3 c, vec2 d, float big, float px, vec3 skin) {
  float r = length(d), x = r / big, z = sqrt(max(1.0 - x * x,0.0));
  vec2 q = d / big * (1.6 - 0.5 * z);
  float n = noise(q * 2.3 + 11.0), n2 = noise(q * 6.5 + 2.0 * n + 4.0), n3 = noise(q * 19.0 + 3.0 * n2);
  vec3 s = skin * (0.34 + 0.8 * z) * (0.62 + 0.55 * shS(0.25,0.7,0.55 * n + 0.45 * n2) + 0.25 * (n3 - 0.5));
  return mix(c, s, sat(uOwn[5] * 1.4) * shS(px * 1.5,-px * 1.5, r - big));
}
vec3 shDrawn(vec3 c, vec2 p) {
  vec2 d = p - shAt;
  float px = 1.0 / uRes.y, r = length(d), l = shS(mix(0.46,0.06,uVar), mix(0.97,0.75, uVar), dot(screenOf(c), vec3(0.299,0.587,0.114))), lum = max(dot(c, vec3(0.299,0.587,0.114)),0.01);
  float run = (r - 0.6 * (1.0 - uHits)) * 13.0;
  l = min(l + 0.5 * uHits * exp(-run * run),1.0);
  if (uOwn[7] > 0.0) {
    float dn = max(shHz - p.y,0.0), f = p.y < shHz ? 20.0 / (dn + 0.12) : 76.0, at = p.y < shHz ? 20.0 * log(dn + 0.12) : r * 76.0;
    float wob = noise(p * 7.0) * 0.7 + noise(p * 45.0) * 0.12, tri = abs(fract(at + wob) - 0.5) * 2.0, aa = 2.4 * f * px, t = 0.05 + 0.98 * l;
    float lit = mix(sat(t), shS(t + aa, t - aa, tri), sat(1.6 - aa));
    vec3 tint = min(c / lum,1.8);
    c = mix(c, mix(tint * 0.035, mix(vec3(1.0,0.97,0.90), tint,0.5) * 1.45, lit), uOwn[7]);
  } else {
    float f = 46.0, i = floor(r * f), n = i < 0.5 ? 3.0 : floor(TAU * (i + 0.5)), a = atan(d.y, d.x + 1e-6) / TAU * n + 0.5 * mod(i,2.0) + uTime * 0.05 * (mod(i,2.0) - 0.5);
    vec2 q = vec2((fract(a) - 0.5) * TAU * (i + 0.5) / n, fract(r * f) - 0.5);
    float t = 0.05 + 0.5 * sqrt(l), on = shS(t + f * px, t - f * px, length(q));
    c = mix(c, mix(c * 0.05, c * 1.35, on),-uOwn[7]);
  }
  return c;
}
vec3 shDay(vec2 p) {
  float px = 1.0 / uRes.y, wide = shShape(), hz = shLow(-0.315), upward = shP(uOwn[0]), dusk = shP(uOwn[4]), white = shP(-uOwn[4]), sand = shP(-uOwn[1]);
  float R = mix(0.185,0.262, wide) * shNear(), hand = 0.5 - 0.5 * cos(TAU * uLoop);
  vec2 sun = vec2(mix(0.03,0.20, wide) - 0.026 * hand,-0.135 + 0.010 * hand);
  vec2 e = p;
  if (uOwn[0] != 0.0) sun += vec2(0.0,0.30 * shP(-uOwn[0])) + upward * (vec2(-0.02,0.0) - sun) * 0.9;
  shAt = sun; shHz = hz; shRich = 0.62 * white + 0.35 * dusk;
  if (uOwn[1] > 0.0 && p.y < hz) p = shMirror(p, hz);
  vec2 d = p - sun;
  float r = length(d), up = max(p.y - hz,0.0) * (1.0 - 0.4 * upward);
  // the sky, and the thin ice haze drawn out in fibres over it
  vec2 s = vec2(p.x + 0.55,1.0) / (up + 0.42);
  vec2 q = rot(0.62) * s + vec2(uTime * 0.0035 + uTravel * 0.006,0.0);
  float w = noise(q * vec2(0.9,1.6)), w2 = noise(q * vec2(1.7,3.0) + 5.0 * w + 9.0);
  float f1 = noise(vec2(q.x * 0.9 + w, q.y * 4.2 + w2 * 1.2)), f2 = noise(vec2(q.x * 1.7, q.y * 17.0 + w * 2.6 + 3.0)), f3 = noise(vec2(q.x * 3.4 + w2, q.y * 54.0 + w2 * 5.0 + w * 4.0));
  if (uOwn[6] > 0.0) {
    float turn = q.x * 1.3 + q.y * 15.0 + 2.4 * w2 + 1.6 * w, rows = 0.5 + 0.5 * sin(turn), fine = 0.5 + 0.5 * sin(q.x * 21.0 + 6.0 * w2 + 3.0 * f1);
    float seam = shS(0.15,0.85, rows * (0.72 + 0.28 * fine) + 0.25 * (f2 - 0.5));
    f1 = mix(f1, seam, uOwn[6]); f2 = mix(f2, seam * (0.5 + 0.5 * fine), uOwn[6]); w = mix(w,0.25 + 0.6 * w, uOwn[6]);
  }
  float sheet = shS(0.2,0.85,0.55 * w + 0.45 * f1);
  float fib = sheet * (0.20 + 0.45 * f1 + 0.95 * f2 * (0.35 + 0.9 * f3));
  float heard = band(up * 1.25) * uEnergy * 2.0;
  float haze = (0.35 + 0.5 * sheet * uLow + 0.75 * fib) + fib * heard * 0.8;
  vec3 col = mix(vec3(0.76,0.85,0.93), vec3(0.125,0.27,0.48), shS(-0.12,0.85, up));
  col += vec3(0.50,0.57,0.64) * (haze - 0.40) * 0.55;
  vec4 m = piece(vec2(p.x * 0.6 + 0.5,1.0 - sat(up / 0.8))) * shS(0.83,0.4, abs(p.x));
  col += (m.rgb * m.rgb * 0.6 + m.a * 0.1) * fib * 0.4;
  vec3 high = uKind[0] * uKind[0], low2 = uKind[1] * uKind[1];
  if (dusk > 0.0) {
    vec3 last = mix(low2 * 1.15, high * 0.20, shS(-0.06,0.5, up)) * (0.45 + 0.8 * haze) + low2 * 0.5 * exp(-r * 4.0);
    col = mix(col, last, dusk);
  }
  if (white > 0.0) col = mix(col, shPaper() * (1.02 - 0.30 * fib - 0.10 * shS(0.1,0.8, up)), white);
  // less light inside the ring than outside it, then the veiled sun
  col *= 1.0 - 0.15 * shS(R + 0.012, R - 0.05, r);
  col += vec3(1.0,0.955,0.87) * (0.55 * exp(-r * 8.5) + 0.8 * exp(-r * 20.0) + 2.0 * exp(-r * 62.0)) * (0.9 + 0.15 * uLevel) * (1.0 - white) * (1.0 - 0.45 * dusk);
  col += vec3(1.0,0.98,0.93) * 1.8 * shS(0.028,0.006, r) * (1.0 - white);
  // the ice's own light: ring, false suns, upper arc, level band, and the bow at the zenith
  float soft = mix(1.25,0.8, uTone), give = 0.55 + 0.7 * uEnergy, catchIt = 0.35 + 0.95 * (1.0 - exp(-1.5 * fib - 0.35 * uLow * sheet - 0.15));
  vec3 ice = vec3(0.0);
  float low = (0.7 + 0.3 * abs(d.y) / max(r,1e-3)) * (0.5 + 0.9 * w2);
  ice += shTint(0,0.2) * shIce(r - R,0.0105 * soft,0.055) * (0.24 + 0.9 * uDrone * give) * low;
  float lev = d.y - 0.05 * d.x * d.x, ax = abs(d.x), dogs = ax - R * 1.06;
  float side = d.x < 0.0 ? 0.45 : 0.08;
  float dogH = 0.036 * mix(0.9,1.15, uPad), bow = dogs - 1.1 * lev * lev;
  vec3 dog = shIce(bow,0.0140 * soft,0.018) * exp(-lev * lev / (dogH * dogH)) * 1.5;
  dog += vec3(0.9,0.95,1.0) * 0.22 * shS(0.0,0.03, dogs) * exp(-max(dogs,0.0) * 11.0) * exp(-lev * lev / (0.012 * 0.012));
  ice += shTint(1,0.16) * min(dog * (side + 2.3 * uPad * give), vec3(1.15,1.1,1.25));
  float T = sqrt(ax * ax * 0.55 + 0.006) - 0.0775, tv = d.y - R - T - 0.9 * ax * ax * ax;
  ice += shTint(3,0.18) * shIce(tv * 0.9,0.008 * soft,0.026) * exp(-ax * ax / 0.045) * shS(-0.06,0.07, ax) * (0.05 + 1.25 * uPhrase * give + 1.3 * uCue);
  float lw = 0.015 + 0.004 * sin(p.x * 3.0);
  ice += shTint(2,0.18) * exp(-lev * lev / (lw * lw)) * (0.04 + 0.85 * uTexture * give) * shS(0.04,0.3, ax) * (0.25 + 1.1 * w2) * shS(1.3,0.3, ax) * (1.0 - 0.75 * exp(-dogs * dogs * 400.0));
  vec2 z = p - sun - vec2(0.0, R * 3.36);
  float zr = R * 1.25 - length(z);
  vec3 cza = shIce(zr,0.008 * soft,0.016) * shS(0.95,0.35, abs(atan(z.x, max(-z.y,1e-3))));
  ice += cza * (0.10 + 0.35 * uPhrase * give + 2.4 * uCue);
  // the wide faint outer ring, and the pillar a voice lifts over the sun
  ice += shIce(r - R * 2.09,0.011,0.05) * (0.03 + 0.10 * uSpace + 0.35 * uCue * shS(0.0,0.5, d.y));
  ice += vec3(1.0,0.96,0.9) * exp(-d.x * d.x / 0.00022) * exp(-abs(d.y) * 7.0) * (0.10 + 0.8 * uMic);
  if (uOwn[3] > 0.0) {
    ice += uOwn[3] * (shTint(1,0.3) * shIce(r - R * 0.46,0.006 * soft,0.018) * (0.10 + 0.5 * uPad * give) + shTint(2,0.3) * shIce(r - R * 0.73,0.007 * soft,0.02) * (0.14 + 0.6 * uTexture * give));
    ice += uOwn[3] * (shTint(3,0.3) * shIce(r - R * 1.36,0.009 * soft,0.03) * (0.16 + 0.7 * uPhrase * give) + shTint(0,0.3) * shIce(r - R * 1.75,0.011 * soft,0.04) * (0.14 + 0.4 * uDrone * give) + shTint(1,0.3) * shIce(r - R * 2.6,0.014 * soft,0.05) * (0.12 + 0.3 * uPad * give));
  }
  if (uOwn[5] < 0.0) for (int k = 0; k < 2; k++) {
    float fk = float(k), rr = R * (0.78 - 0.26 * fk), r2 = length(p - sun - vec2(mix(-0.34,-0.50, wide) + 0.86 * fk * wide + 0.5 * fk * (1.0 - wide),0.185 + 0.095 * fk));
    col += -uOwn[5] * (1.0 - white) * (vec3(1.0,0.955,0.87) * (0.22 * exp(-r2 * 9.0) + 0.5 * exp(-r2 * 24.0) + 1.5 * exp(-r2 * 80.0)) + 1.6 * shS(0.020 - 0.005 * fk,0.005, r2));
    col = mix(col, shPaper() * 0.5 * mix(uKind[4], uKind[3], fk) * mix(uKind[4], uKind[3], fk),-uOwn[5] * white * shS(0.022,0.018, r2));
    ice += -uOwn[5] * shTint(1 + 2 * k,0.3) * shIce(r2 - rr,0.008 * soft,0.035) * (0.3 + 0.6 * (k == 0 ? uPad : uPhrase) * give);
  }
  vec3 sky = col + ice * catchIt * 0.85;
  if (white > 0.0) {
    sky = mix(sky, shInk(col, min(ice,0.75) * (0.25 + 0.3 * catchIt + 0.8 * f2)), white);
    sky = mix(sky, uKind[4] * uKind[4] * 1.1, white * shS(0.034,0.031, r) * (1.0 - shP(uOwn[5])));
  }
  if (uOwn[5] > 0.0) sky = shDisc(sky, d, mix(0.03,0.62 * R, uOwn[5]), px, mix(vec3(1.0,0.96,0.9), min(uKind[4] * uKind[4] / max(dot(uKind[4] * uKind[4], vec3(0.33)),0.05),2.0),0.6) * (0.85 - 0.25 * dusk + 0.1 * uLevel + 0.2 * uHits));
  col = sky;
  // far woods under the haze, and a row of bare poplars
  float n1 = noise(vec2(p.x * 9.0,3.0)), n2 = noise(vec2(p.x * 70.0,8.0)), n3 = noise(vec2(p.x * 260.0,1.0));
  vec3 far = mix(vec3(0.24,0.29,0.36), vec3(0.75,0.73,0.70), exp(-abs(d.x) * 5.0) * 0.55);
  if (dusk > 0.0) far = mix(far, low2 * 0.10 + high * 0.03, dusk);
  if (white > 0.0) far = mix(far, vec3(0.62,0.64,0.66), white);
  if (uOwn[2] > 0.0) {
    vec3 air = mix(mix(vec3(0.60,0.68,0.78), mix(low2 * 0.55, high * 0.3,0.35), dusk), shPaper() * 0.72, white);
    col = shPeaks(col, p, air, vec3(0.42,0.38,0.32) * (1.0 - 0.75 * dusk), px);
  }
  float hill = hz + 0.010 + 0.016 * noise(vec2(p.x * 2.2 + 4.0,0.5));
  col = mix(col, mix(sky, far,0.35), shS(px,-px, p.y - hill) * (1.0 - sand) * (1.0 - shP(uOwn[2])));
  float wood = hz + (0.004 + 0.016 * shS(0.35,0.8, n1)) * (0.6 + 0.4 * n2) + 0.003 * n3;
  col = mix(col, far * 0.75,0.85 * shS(px,-px, p.y - wood) * (1.0 - sand));
  // the fields
  if (e.y < hz + 0.004 + 0.05 * sand) {
    vec3 seen = col;
    float was = p.x;
    p = e;
    float dn = max(hz - p.y,0.0) + 0.004, zed = 0.06 / dn;
    vec2 g = vec2((p.x - 0.1) * zed * 6.0, zed);
    float drift = noise(g * vec2(1.1,2.2) + 3.0) * 0.6 + noise(g * vec2(3.1,7.0)) * 0.4;
    float fall = exp(-abs(d.x) * 2.6);
    vec3 snow = mix(vec3(0.50,0.64,0.82), vec3(0.92,0.98,1.04), shS(0.19,0.0, dn));
    snow *= 0.78 + 0.4 * drift;
    snow += vec3(1.0,0.96,0.89) * 0.75 * fall * (0.2 + drift) * exp(-dn * 3.0);
    // stubble standing through the snow, in rows that run to the horizon
    float row = (p.x + 0.16) * zed * 46.0, rw = zed * 46.0 * px * (1.0 + 0.6 * abs(p.x + 0.16) / dn), ra = abs(fract(row) - 0.5), zw = zed / dn * px;
    float tuft = noise(vec2(floor(row) * 7.3, zed * 30.0 + 97.0 * hash11(floor(row)))) * 0.45 + mix(0.5, noise(vec2(row * 9.0, zed * 160.0)), shS(1.4,0.6,160.0 * zw)) * 0.55;
    float st = shS(0.26 + rw,0.02, ra) * shS(0.45,0.75, tuft + 0.7 * (0.5 - drift)) * shS(0.004,0.02, dn);
    st = mix(st,0.10, shS(0.12,0.45, max(rw,4.0 * zw)));
    snow = mix(snow, snow * vec3(0.50,0.49,0.48),0.7 * st);
    snow += shDust(vec2(p.x, p.y * 1.6),60.0,5.0) * (0.15 + 2.0 * uKeys);
    snow = mix(snow, sky * 0.98, exp(-dn * 45.0) * 0.6);
    snow += ice * 0.14 * catchIt;
    if (dusk > 0.0) snow = mix(snow, snow * (low2 * 0.30 + high * 0.14) * (0.5 + 1.2 * fall) + shDust(vec2(p.x, p.y * 1.6),60.0,5.0) * uKeys * 0.6, dusk);
    if (white > 0.0) snow = mix(snow, shPaper() * (0.80 + 0.22 * drift - 0.3 * st), white);
    if (uOwn[1] > 0.0) snow = mix(snow, seen * (0.60 + 0.34 * exp(-dn * 9.0)) + shDust(vec2(p.x, p.y * 1.6),60.0,5.0) * 2.0 * uKeys * shS(0.01,0.05, dn), uOwn[1]);
    col = mix(col, snow, shS(px,-px, p.y - hz));
    if (sand > 0.0) {
      vec3 hue = mix(vec3(0.9), uKind[2] * uKind[2] * 1.9,0.8) * mix(vec3(1.0), low2 * 0.6 + 0.12, dusk) * (1.0 + 0.6 * white);
      col = mix(col, shDunes(hue * 0.45 + mix(vec3(0.42), low2 * 0.45, dusk), e, hue * (0.85 + 0.25 * uDrone), px), sand * shS(0.05,0.0, p.y - hz));
    }
    p = e.y < hz && uOwn[1] > 0.0 ? vec2(was,2.0 * hz - e.y) : e;
  }
  for (int k = 0; k < 8; k++) {
    float fk = float(k), h = hash11(fk + 3.0);
    vec2 b = p - vec2(mix(-0.2,-0.60, wide) + fk * 0.019 + 0.013 * h + 0.03 * step(4.5, fk), hz - 0.004);
    float tall = 0.052 + 0.036 * hash11(fk * 1.7 + 8.0), y = b.y / tall;
    if (y < -0.1 || y > 1.1 || abs(b.x) > 0.03) continue;
    b.x += 0.0012 * sin(b.y * 60.0 + fk * 2.0);
    float body = 0.0150 * sqrt(sat(y * 1.6 - 0.25)) * sat(1.0 - y) * (0.6 + 0.8 * noise(vec2(b.x * 200.0 + fk * 9.0, b.y * 190.0)));
    float twig = noise(vec2((b.x - b.y * 0.3 * sign(b.x)) * 520.0 + fk, b.y * 110.0));
    float a = shS(1.5 * px,-2.0 * px, abs(b.x) - body) * (0.25 + 0.65 * twig), tw = 0.0013 * (1.0 - 0.8 * y);
    float tr = shS(px,0.0, abs(b.x) - tw) * step(0.0, y) * step(y,0.95) * min(1.0,0.4 + tw / px);
    col = mix(col, vec3(0.085,0.10,0.13), max(a, tr) * 0.88 * (1.0 - sand) * (1.0 - 0.4 * sat(hz - e.y) / 0.1 * step(e.y, hz) * shP(uOwn[1]) * 0.5));
  }
  // ice dust low in the air, and the column of it that a hit lights
  float cx = p.x + mix(0.1,0.30, wide) + 0.05 * sin(uTime * 0.043);
  float column = exp(-cx * cx / 0.0022) * shS(-0.40,-0.25, p.y - hz - 0.315) * shS(0.32,-0.05, p.y);
  float air = (0.10 + 0.9 * uHigh) * exp(-abs(p.y + 0.22) * 6.0) * 0.6;
  col += (shDust(p,46.0,1.0) + shDust(rot(0.4) * p,85.0,2.0)) * (air + 3.5 * column * uHits);
  col += shTint(4,0.1) * column * uHits * 0.3;
  if (uOwn[2] < 0.0) col = shReeds(col, e, mix(vec3(0.05,0.052,0.055), low2 * 0.03, dusk), mix(vec3(0.75,0.72,0.66), low2 * 1.3 + 0.1, dusk), px);
  if (uOwn[6] < 0.0) col += -uOwn[6] * shFlakes(e) * mix(mix(vec3(0.55,0.57,0.6), low2 * 0.6 + 0.12, dusk), vec3(0.3) - col * 0.28, white);
  return col;
}
vec3 shCorona(float x, out vec3 rings) {
  vec3 v = x / vec3(1.17,1.0,0.86);
  vec3 a = cos(1.2876 * min(v,1.22));
  vec3 fade = exp(-max(v - 1.22,0.0) * 1.05);
  rings = step(1.22, v) * (0.5 - 0.5 * cos(TAU * (v - 1.22)) * (0.35 + 0.65 * fade)) * fade;
  return a * a;
}
vec3 shNight(vec2 p) {
  float px = 1.0 / uRes.y, wide = shShape(), hz = shLow(-0.365), upward = shP(uOwn[0]), dusk = shP(uOwn[4]), white = shP(-uOwn[4]), sand = shP(-uOwn[1]);
  float R = mix(0.25,0.45, wide) * shNear(), hand = 0.5 - 0.5 * cos(TAU * uLoop);
  vec2 moon = vec2(mix(-0.02,-0.27, wide) + 0.024 * hand,0.10 + 0.012 * hand);
  vec2 e = p;
  if (uOwn[0] != 0.0) moon += vec2(0.0,0.16 * shP(-uOwn[0])) + upward * (vec2(0.02,0.0) - moon) * 0.9;
  shAt = moon; shHz = hz; shRich = 0.55 * white + 0.3 * dusk;
  if (uOwn[1] > 0.0 && p.y < hz) p = shMirror(p, hz);
  vec2 d = p - moon;
  float r = length(d), up = max(p.y - hz,0.0) * (1.0 - 0.4 * upward);
  // lace cloud: small cells of it in a sheet overhead, thinned out in places
  vec2 s = vec2(p.x,1.0) / (up + 0.75);
  vec2 q = rot(0.45) * s * 9.0 + vec2(40.0 * sin(uTime * 0.00045) + 44.0 * sin(uTravel * 0.00045),0.0);
  float w = noise(q * 0.3), w2 = noise(q * 0.75 + 7.0), w3 = noise(q * 3.4 + 2.0);
  vec2 c = q * (vec2(1.25,2.1) + shP(uOwn[6]) * vec2(-0.7,2.2)) + 0.9 * vec2(w2, w) + 0.45 * (w3 - 0.5), ci = floor(c), cf = c - ci;
  float puff = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(i, j), v = o + 0.1 + 0.8 * hash22(ci + o) - cf;
    puff += exp(-dot(v, v) * 3.6);
  }
  float fine = noise(q * 9.0 + 3.0 * w3) * 0.6 + noise(q * 21.0) * 0.4;
  if (uOwn[6] > 0.0) puff = mix(puff,0.15 + 1.1 * shS(0.1,0.9,0.5 + 0.5 * sin(c.y * 2.6 + 2.6 * w2)) * (0.75 + 0.35 * puff), uOwn[6]);
  float lace = shS(0.25,1.15, puff + 0.55 * (fine - 0.5) + 0.35 * (w3 - 0.5));
  float cover = shS(0.22,0.8,0.65 * w + 0.35 * w2 + 0.34 * exp(-r * r * 7.0) + 0.14 * uLow);
  float cloud = cover * (0.14 + 0.86 * lace * (0.7 + 0.5 * fine));
  if (uOwn[6] > 0.0) cloud = mix(cloud, (0.4 + 0.6 * cover) * (0.18 + 0.82 * lace * (0.75 + 0.4 * fine)), uOwn[6]);
  if (uOwn[6] < 0.0) cloud = mix(cloud,0.55 * exp(-r * 2.6) + 0.2 * cloud,-uOwn[6]);
  vec3 high = uKind[0] * uKind[0], low2 = uKind[1] * uKind[1];
  // the sky and its stars
  vec3 col = mix(vec3(0.016,0.034,0.064), vec3(0.003,0.010,0.030), shS(0.0,0.8, up));
  if (dusk > 0.0) col = mix(col, mix(low2 * 0.95, high * 0.10, shS(-0.04,0.5, up)), dusk);
  vec2 sq = rot(0.5) * p * 30.0, si = floor(sq), sh = hash22(si + 3.0), so = hash22(si + 41.0);
  float sd = length(sq - si - 0.06 - 0.88 * so), sr = max(0.034,0.85 * 30.0 * px);
  col += vec3(0.8,0.9,1.0) * shS(sr,0.0, sd) * sh.x * sh.x * sh.x * sh.x * sh.y * min(1.0,0.003 / (sr * sr)) * (0.75 + 0.25 * sin(uTime * 0.7 + 40.0 * sh.x)) * (0.6 + 1.6 * uHigh) * (1.0 - 0.95 * cloud) * shS(0.1,0.5, r) * (1.0 - dusk * shS(0.5,0.1, up));
  vec3 base = col;
  // moonlight in the cloud, with its rings
  float give = 0.5 + 0.8 * uEnergy, heard = band(sat(r * 1.7)) * uEnergy;
  vec3 rings, cor = shCorona(r / (0.058 * (0.94 + 0.13 * w2) * (1.0 + 0.8 * shP(uOwn[3]) + 2.0 * shP(uOwn[5]))), rings);
  if (uOwn[3] > 0.0 || uOwn[5] > 0.0) { float pale = 0.45 * shP(uOwn[3]) + 0.6 * shP(uOwn[5]); cor = mix(cor, vec3(dot(cor, vec3(0.33))) * low2 * 1.5, min(pale,0.7)); rings = mix(rings, vec3(dot(rings, vec3(0.33))), min(pale,0.7)); }
  vec3 lit = vec3(0.38,0.54,0.80) * (0.030 + 0.20 * exp(-r * 4.5) + 0.35 * exp(-r * 13.0)) * (0.8 + 0.4 * uLevel + 1.4 * heard);
  lit += shTint(1,0.14) * cor * (0.75 + 0.75 * uPad * give);
  lit += rings * (0.22 + 0.45 * uPad * give + shTint(2,0.2) * 0.75 * uTexture * give);
  if (dusk > 0.0) lit += dusk * (low2 * 0.55 * shS(0.6,0.0, up) + high * 0.10);
  vec4 m = piece(vec2(p.x * 0.6 + 0.5,1.0 - sat(up / 0.85))) * shS(0.83,0.4, abs(p.x));
  lit += (m.rgb * m.rgb * 0.8 + 0.1 * m.a) * 0.13;
  vec3 run = r - vec3(0.123,0.118,0.114) - 0.36 * (1.0 - uHits);
  lit += shTint(4,0.15) * (0.9 + 1.6 * white + 1.2 * shP(uOwn[5])) * uHits * (0.3 + 0.7 * uHits) * exp(-run * run / (0.0004 + 0.0022 * (1.0 - uHits)));
  if (uOwn[5] < 0.0) for (int k = 0; k < 2; k++) {
    float fk = float(k), r2 = length(p - moon - vec2(0.34 + 0.36 * wide * fk - 0.1 * (1.0 - wide) * fk,0.16 - 0.34 * fk));
    vec3 rg, co = shCorona(r2 / (0.042 - 0.010 * fk), rg);
    lit += -uOwn[5] * (co * (0.6 + 0.5 * uPad * give) + rg * (0.2 + 0.6 * uTexture * give) + vec3(0.38,0.54,0.80) * 0.25 * exp(-r2 * 9.0));
    col += -uOwn[5] * (vec3(1.0,0.98,0.94) * 1.5 * shS(0.0165 - 0.005 * fk,0.014 - 0.005 * fk, r2) + 0.8 * shTint(3 - 2 * k,0.4) * shIce(r2 - R * (0.50 - 0.17 * fk),0.011,0.04) * (0.10 + 0.22 * uPhrase * give));
  }
  col += lit * (0.12 + 1.1 * cloud);
  col += vec3(1.0,0.98,0.94) * (0.10 * exp(-r * 22.0) + (1.7 - 0.6 * cloud) * shS(0.0215,0.0185, r) * (0.55 + 0.55 * shS(0.2,0.7, noise(d * 95.0 + 4.0))));
  // the wide ring of the ice far above, with a mock moon on each side
  float soft = mix(1.3,0.8, uTone), lev = d.y - 0.1 * d.x * d.x, dogs = abs(d.x) - R * 1.02;
  vec3 ice = shTint(0,0.22) * shIce(r - R,0.016 * soft,0.06 + 0.03 * uSpace) * (0.034 + 0.12 * uDrone * give + 0.18 * uCue);
  ice = mix(ice, vec3(dot(ice, vec3(0.33))),0.6);
  ice += shTint(3,0.2) * shIce(dogs - lev * lev,0.011 * soft,0.026) * exp(-lev * lev / 0.0013) * (0.02 + 0.55 * uPhrase * give + 0.35 * uCue);
  ice += vec3(0.8,0.9,1.0) * exp(-d.x * d.x / 0.0003) * exp(-abs(d.y) * 6.0) * 0.25 * uMic;
  if (uOwn[3] > 0.0) {
    ice += uOwn[3] * (shTint(1,0.4) * shIce(r - R * 0.62,0.011 * soft,0.03) * (0.07 + 0.22 * uPad * give) + shTint(3,0.4) * shIce(r - R * 0.8,0.012 * soft,0.03) * (0.06 + 0.25 * uPhrase * give));
    ice += uOwn[3] * (shTint(2,0.4) * shIce(r - R * 1.27,0.015 * soft,0.04) * (0.06 + 0.2 * uTexture * give) + shTint(0,0.4) * shIce(r - R * 1.62,0.018 * soft,0.05) * (0.06 + 0.16 * uDrone * give));
  }
  if (uOwn[3] < 0.0 || white > 0.0) ice *= 1.0 + 0.9 * shP(-uOwn[3]) + 1.5 * white;
  col += ice * (0.65 + 0.5 * w - 0.25 * lace * cover);
  if (white > 0.0) col = mix(col, shInk(shPaper() * (1.0 - 0.28 * cloud - 0.08 * shS(0.1,0.8, up)), (col - base) * 1.1 * shS(0.0,0.03, r - 0.012)), white);
  if (uOwn[5] > 0.0) col = shDisc(col, d, mix(0.022,0.21 * mix(0.75,1.0, wide), uOwn[5]), px, mix(vec3(1.0,0.96,0.9), min(uKind[4] * uKind[4] / max(dot(uKind[4] * uKind[4], vec3(0.33)),0.05),2.0),0.6) * (0.55 + 0.25 * white + 0.12 * uLevel + 0.22 * uHits));
  if (uOwn[2] > 0.0) col = shPeaks(col, p, mix(mix(vec3(0.05,0.075,0.12), low2 * 0.4 + high * 0.05, dusk), shPaper() * 0.7, white), mix(vec3(0.16,0.19,0.24), vec3(0.4,0.38,0.35), white), px);
  vec3 sky = col;
  // firs, and the snow under the moon
  for (int k = 0; k < 2; k++) {
    float fk = float(k), grow = 1.0 + 4.0 * shP(-uOwn[2]) * (0.7 + 0.5 * fk), f = (62.0 - 22.0 * fk) / grow, tu = p.x * f + 0.9 * noise(vec2(p.x * 7.0, fk)), id = floor(tu), a = 0.0;
    float stand = shS(0.34 + 0.1 * fk,0.75, noise(vec2(p.x * 2.1 + 2.6 + 5.0 * fk,4.0)));
    if (uOwn[2] < 0.0) stand = mix(stand, shS(0.1,0.75, abs(p.x - 0.10 + 0.2 * fk)) * 1.15,-uOwn[2]);
    for (int n = -1; n <= 1; n++) {
      float h = hash11(id + float(n) + 31.0 * fk), top = grow * stand * (0.014 + 0.012 * fk + (0.03 + 0.035 * fk) * h * h), y = (top - p.y + hz + 0.004) * f;
      float jag = 0.65 + 0.5 * fract(y * (4.2 + h)) + 0.35 * (noise(vec2(tu * 9.0, p.y * 420.0)) - 0.5);
      a = max(a, shS(f * px,-f * px, abs(tu - id - float(n) - 0.1 - 0.8 * fract(h * 7.0)) - 0.36 * y * jag / (0.6 + top * f * 0.35)) * step(0.0, y));
    }
    a = max(a, shS(px,-px, p.y - hz - 0.005));
    col = mix(col, mix(vec3(0.014,0.022,0.036), vec3(0.004,0.007,0.012), fk) + white * vec3(0.30,0.31,0.32) * (1.0 - 0.6 * fk), a * (1.0 - sand));
  }
  vec3 seen = col;
  p = e;
  float dn = max(hz - p.y,0.0) + 0.006, zed = 0.06 / dn;
  vec2 g = vec2(p.x * zed * 5.0, zed);
  float drift = noise(g * vec2(1.0,2.0) + 3.0) * 0.5 + noise(g * vec2(3.7,11.0)) * 0.27 + noise(g * vec2(9.0,34.0)) * 0.15 + noise(vec2(g.x * 17.0 + 9.0 * g.y, g.y * 95.0)) * 0.13 * shS(0.02,0.08, dn);
  drift = mix(0.5, drift, shS(0.006,0.022, dn));
  vec3 snow = vec3(0.060,0.095,0.16) * (0.1 + 3.2 * drift * drift) * (0.5 + 0.8 * exp(-abs(d.x) * 2.2)) * (0.85 + 0.4 * uLevel);
  snow += vec3(0.5,0.58,0.68) * exp(-d.x * d.x * 16.0) * shS(0.45,0.9, drift) * 0.22 * exp(-dn * 6.0);
  snow += vec3(0.6,0.7,0.85) * shDust(vec2(p.x, p.y * 1.6),60.0,5.0) * (0.12 + 2.0 * uKeys);
  if (dusk > 0.0) snow = mix(snow, snow * (0.4 + low2 * 2.2) + low2 * 0.10 * drift, dusk);
  if (white > 0.0) snow = mix(snow, shPaper() * (0.78 + 0.24 * drift), white);
  if (uOwn[1] > 0.0) snow = mix(snow, seen * (0.62 + 0.34 * exp(-dn * 9.0)) + vec3(0.6,0.7,0.85) * shDust(vec2(p.x, p.y * 1.6),60.0,5.0) * 2.0 * uKeys * shS(0.01,0.05, dn), uOwn[1]);
  col = mix(col, snow, shS(px,-px, p.y - hz - 0.006 * noise(vec2(p.x * 3.0,1.0)) * (1.0 - shP(uOwn[1]))));
  if (sand > 0.0 && p.y < hz + 0.05) {
    vec3 hue = mix(vec3(0.9), uKind[2] * uKind[2] * 1.9,0.8) * mix(mix(vec3(0.11,0.13,0.17) * (0.8 + 0.4 * uLevel), low2 * 0.5 + 0.06, dusk), vec3(1.5), white);
    col = mix(col, shDunes(hue * 0.5 + mix(vec3(0.03,0.045,0.07), low2 * 0.28, dusk), e, hue * (0.85 + 0.25 * uDrone), px), sand * shS(0.05,0.0, p.y - hz));
  }
  if (uOwn[6] < 0.0) col += -uOwn[6] * shFlakes(e) * mix(vec3(0.24,0.27,0.32) * (0.35 + 1.2 * exp(-r * 2.0)) + low2 * 0.2 * dusk, vec3(0.3) - col * 0.28, white);
  return col;
}
vec3 render(vec2 p) {
  vec3 c = uVar < 0.5 ? shDay(p) : shNight(p);
  if (uOwn[7] != 0.0) c = shDrawn(c, p);
  return screenOf(c);
}
