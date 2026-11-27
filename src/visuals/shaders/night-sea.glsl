// name: Night sea
// a: Moonlit
// b: Heavy sea
// what: A dark sea under the moon with the piece glowing beneath the waves, far sounds far out and near sounds close; or the same sea as heavy liquid metal under a sky lit in the colours of the sounds.
// follows: The low band raises the swell and the high band puts sparkle on it; each sound glows under the water where it sits in the piece; a hit is lightning on the horizon; over the metal each kind of sound is a pillar of light as tall as it is loud, and a hit drops a ring into the sea.
// own: 0 the eye: 1 high over the water looking down, -1 lifted to the sky, the sea a strip below; 1 the hour: 1 broad day, -1 the sun just under the edge of the sea; 2 1 great rollers with foam, -1 a calm like glass; 3 the lights: 1 one great disc low down (b: each a round lamp), -1 many small lamps along the far shore (b: many threads); 4 1 mountains stand round it, -1 ice floes lie on it; 5 1 drawn in dots, -1 in ruled lines; 6 1 heaped clouds, -1 rain; 7 1 clear shallows over ribbed sand, -1 dry matt dunes
float seWave(vec2 x, float f, float t, float sharp) {
  x += (vec2(noise(x * f * 0.35), noise(x * f * 0.35 + 9.0)) - 0.5) * 1.6 / f;
  float s = sin(x.x * f + t), c = sin(x.y * f * 0.83 - t * 0.7);
  float w = 0.5 + 0.25 * (s + c);
  return pow(w, sharp);
}
float oUp, oDown, oDay, oDusk, oWild, oCalm, oDisc, oLamps, oHills, oIce, oDots, oRules, oCloud, oRain, oShoal, oDune;
bool seWorldly;
vec3 seMoon = vec3(-0.2357, 0.2828, 0.9299);
vec3 seRing; // x, z of where the ring started, and how far it has gone
// The height of the water. n is how many layers of wave to add.
float seHeight(vec2 x, int n) {
  float t = uTime * 0.6, metal = uVar;
  if (seWorldly) t *= 1.0 - 0.93 * oDune;
  float swell = 0.2 + 0.5 * uLow + 0.1 * uEnergy;
  float h = swell * seWave(x * rot(0.3), 0.33, t, mix(1.7, 1.2, metal));
  h += (0.16 + 0.12 * uMid) * seWave(x * rot(-0.9) + 5.0, 0.85, t * 1.3, mix(2.0, 1.2, metal));
  if (n > 2) {
    h += 0.075 * mix(1.0, 0.8, metal) * seWave(x * rot(1.9) + 11.0, 2.2, t * 1.9, 2.2);
    h += (0.024 + 0.02 * uHigh) * mix(1.0, 0.5, metal) * seWave(x * rot(0.7) + 3.0, 5.9, t * 2.6, 2.0);
    if (n > 4) h += 0.008 * (1.0 - metal) * seWave(x * rot(2.6) + 7.0, 15.0, t * 3.5, 2.0);
  }
  // a ring spreading from where something fell in
  float r = length(x - seRing.xy);
  h += 0.12 * metal * sin((r - seRing.z) * 5.0) * exp(-pow((r - seRing.z) * 0.9, 2.0)) * max(uHits, uCue) / (1.0 + 0.25 * seRing.z);
  if (seWorldly) {
    h *= 1.0 - 0.96 * oCalm;
    h = mix(h, 0.5 * h + 0.45 * noise(x * 0.1 + 4.0), oDune * 0.6);
    if (oWild > 0.0) {
      vec2 w = x + 1.6 * vec2(noise(x * 0.16), noise(x * 0.16 + 30.0));
      float r = 0.5 + 0.5 * sin(w.y * 0.72 + 0.26 * w.x + t * 1.1 * (1.0 - 0.2 * oDune));
      h += oWild * (1.1 + 0.5 * uLow) * (r * r * (0.55 + 0.45 * r)) * (0.55 + 0.6 * noise(x * vec2(0.13, 0.07) + 9.0)) - 0.25 * oWild;
    }
    if (oIce > 0.0) h *= 1.0 - 0.9 * oIce;
  }
  return h;
}
float seStars(vec2 p, float n, float seed) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  float d = length(f - (h - 0.5) * 0.7);
  return pow(h.x, 14.0) * (0.7 + 0.3 * sin(uTime * (0.8 + 2.0 * h.y) + h.y * 40.0)) * smoothstep(0.08, 0.0, d) * 3.0;
}
// The night sky along a ray: moon, a bank of cloud on the horizon, stars, lightning inside the cloud.
vec3 seSky(vec3 rd, float soft) {
  float m = dot(rd, seMoon);
  vec3 col = vec3(0.9, 0.95, 1.0) * (smoothstep(0.99955, 0.9997, m) * 2.5 * (1.0 - soft) + 0.25 * pow(sat(m), 900.0) + 0.006 * pow(sat(m), 60.0));
  col += vec3(0.002, 0.004, 0.009) * pow(1.0 - sat(rd.y), 8.0); // a very little light low in the sky
  vec2 sp = rd.xy / max(rd.z, 0.05);
  float az = atan(rd.x, rd.z);
  float bank = fbm(vec2(az * 3.0 + uTime * 0.004, rd.y * 13.0)) * smoothstep(0.26, 0.02, rd.y);
  float edge = smoothstep(0.3, 0.42, bank) * smoothstep(0.62, 0.45, bank); // the thin rim of a cloud takes the moon
  bank = smoothstep(0.3, 0.55, bank);
  col *= 1.0 - 0.9 * bank;
  col += vec3(0.4, 0.47, 0.6) * (edge * 0.1 + bank * 0.004) * (0.08 + 2.5 * pow(sat(m), 8.0));
  float strike = 0.55 * sin(uTime * 0.19 + 0.5) + 0.25;
  float near = exp(-pow((az - strike) * 6.5, 2.0)) * exp(-rd.y * 9.0);
  col += mix(vec3(0.75, 0.8, 1.0), kindColour(4.0), 0.3) * uHits * near * (0.25 + 2.2 * bank + 2.0 * edge);
  col += vec3(0.8, 0.88, 1.0) * (seStars(sp, 24.0, 1.0) + 0.5 * seStars(sp * rot(0.3) + 4.0, 51.0, 3.0)) * (1.0 - bank) * (1.0 - soft) * smoothstep(0.0, 0.1, rd.y);
  return col;
}
// The sky over the metal sea: far off along the horizon, one tall light for each kind of sound, as bright as it is loud.
vec3 seGlowSky(vec3 rd) {
  vec3 col = vec3(0.0);
  float az = atan(rd.x, rd.z), y = max(rd.y, 0.0);
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float at = -0.62 + 0.31 * fk + 0.06 * sin(uTime * 0.07 + fk * 2.0);
    float d = az - at;
    float tall = 0.03 + 0.22 * lv[k];
    float g = (exp(-d * d * 420.0) + 0.8 * exp(-d * d * 6000.0)) * exp(-y / tall) + 0.1 * exp(-d * d * 30.0) * exp(-y / (tall * 0.4));
    vec3 c = uKind[k]; c = c * c * 2.2 + c * 0.1;
    col += c * g * (0.03 + 2.2 * lv[k]);
  }
  return col;
}
// From high up the piece lies wider over the water, and soft at its edges.
vec2 seWhere(vec2 under, vec2 uv) { return mix(uv, vec2(under.x / (9.0 + 0.55 * max(under.y, 0.0)) * 0.5 + 0.5, 1.0 - (under.y - 0.5) / 24.0), oUp); }
float seFade(vec2 uv) { vec2 d = 0.5 - abs(uv - 0.5); return mix(1.0, smoothstep(0.0, 0.16, d.x) * smoothstep(0.0, 0.16, d.y), max(oUp, max(oDay, max(oWild, oDune)))); }
float seFbm(vec2 p) { return 0.5 * noise(p) + 0.25 * noise(p * 2.03 + 7.1) + 0.14 * noise(p * 4.1 + 3.7) + 0.07 * noise(p * 8.3 + 1.1); }
float seHeap(vec2 p) {
  float s = 0.0, a = 0.52;
  for (int i = 0; i < 4; i++) { s += a * abs(2.0 * noise(p) - 1.0); p = rot(0.4) * p * 2.1 + 5.3; a *= 0.46; }
  return s * 1.35;
}
// The sky of a world: the hour, the disc, the lamps, clouds and the mountains round the water.
vec3 seAir(vec3 rd) {
  vec3 k0 = uKind[0] * uKind[0], k1 = uKind[1] * uKind[1], k4 = uKind[4] * uKind[4], c = vec3(0.0);
  float y = max(rd.y, 0.0), a = dot(normalize(rd.xz + 1e-4), normalize(seMoon.xz));
  c += oDay * mix(mix(vec3(0.98, 0.95, 0.88), k1 * 1.2, 0.4), k0 * 1.5 + 0.08, smoothstep(0.0, 0.42, y)) * (0.75 + 0.25 * uLevel);
  vec3 d = mix(k4 * (0.5 + 0.7 * pow(0.5 + 0.5 * a, 6.0)), k1 * 0.45, smoothstep(0.0, 0.16, y));
  c += oDusk * mix(d, k0 * 0.16, smoothstep(0.06, 0.5, y)) * (0.5 + 0.7 * uLevel);
  return c;
}
vec3 seSkyOf(vec3 rd, float soft) {
  float m = dot(rd, seMoon), az = atan(rd.x, rd.z), y = max(rd.y, 0.0), lit = max(oDay, oDusk);
  vec3 c = uVar < 0.5 ? seSky(rd, soft) : seGlowSky(rd);
  if (!seWorldly) return c;
  if (uVar < 0.5) c *= (1.0 - 0.9 * max(oDay, 0.45 * oDusk)) * (1.0 - 0.9 * oRain);
  else {
    if (oDisc + oLamps > 0.0) {
      float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
      vec3 o = vec3(0.0);
      for (int k = 0; k < 5; k++) {
        float fk = float(k);
        vec3 tint = uKind[k] * uKind[k] * 2.2 + uKind[k] * 0.1;
        if (oDisc > 0.0) {                                  // each light a round lamp hung over the sea
          vec2 v = vec2(az + 0.64 - 0.32 * fk - 0.05 * sin(uTime * 0.07 + fk * 2.0), rd.y - 0.1 - 0.06 * fract(fk * 0.618 + 0.2) - 0.07 * lv[k]);
          float r = 0.03 + 0.055 * lv[k], d = length(v) - r;
          o += oDisc * tint * (0.05 + 0.75 * lv[k]) * (smoothstep(0.006, -0.006, d) * (0.65 + 0.5 * sat(0.5 - 0.5 * v.y / r)) + 0.35 * exp(-max(d, 0.0) * 22.0));
        }
        if (oLamps > 0.0) {                                 // or many fine threads, some long and some short
          for (int i = 0; i < 2; i++) {
            float n = 3.0 + 2.0 * float(i), u = az * n + 0.37 * fk + 5.0 * float(i), id = floor(u), h = hash11(id + fk * 13.0 + 40.0 * float(i));
            float d = (fract(u) - 0.5 - 0.3 * (h - 0.5)) / n, tall = 0.02 + (0.05 + 0.5 * h * h) * lv[k];
            o += oLamps * tint * (0.02 + 1.3 * lv[k]) * (exp(-d * d * 60000.0) + 0.16 * exp(-d * d * 900.0)) * smoothstep(0.5, 0.2, abs(fract(u) - 0.5)) * smoothstep(tall * 1.6, tall * 0.4, y);
          }
        }
      }
      c = mix(c, o, oDisc + oLamps);
    }
    c *= 1.0 - 0.45 * oDay;
  }
  vec3 air = seAir(rd);
  c += air;
  if (oDisc > 0.0 && uVar < 0.5) {
    float edge = mix(0.9997, 0.982, oDisc), disc = smoothstep(edge - 0.0006, edge + 0.0006, m);
    vec2 sp = (rd.xy - seMoon.xy) * 14.0;
    vec3 face = mix(uKind[4], vec3(1.0, 0.96, 0.9), 0.4) * mix(vec3(0.9, 0.95, 1.0) * 0.62, vec3(2.4), max(oDusk, oDay)) * (0.6 + 0.4 * lit + 0.75 * seFbm(sp * 1.4 + 3.0) * (1.0 - lit));
    c = mix(c, face * (0.55 + 0.45 * smoothstep(0.0, 0.2, y) + 0.3 * uLevel), disc * min(oDisc * 3.0, 1.0) * smoothstep(0.004, 0.012, y));
    c += face * 0.12 * pow(sat(m), 24.0) * oDisc;
  }
  if (oCloud > 0.0) {
    vec2 q = vec2(az * 1.5 + uTime * 0.006, y * 3.4);
    float n = seHeap(q), n2 = seHeap(q + vec2(-0.05, 0.11));
    float body = smoothstep(0.5, 0.56, n + 0.09 - 0.34 * smoothstep(0.12, 0.5, y) + 0.1 * smoothstep(0.1, 0.02, y)) * oCloud * (1.0 - 0.55 * soft), top = sat(0.45 + (n - n2) * 3.2 + 0.5 * y);
    vec3 dark = air * mix(0.4, 0.72, oDay) + uKind[1] * uKind[1] * (0.02 + 0.06 * uLevel), bright = air + oDay * 0.55 + vec3(0.5, 0.56, 0.68) * 0.16 * (1.0 - lit) + uKind[4] * uKind[4] * 0.35 * lit;
    bright *= 0.7 + 1.2 * pow(sat(m), 6.0);
    c = mix(c, mix(dark, bright, top * top) + mix(vec3(0.75, 0.8, 1.0), uKind[4], 0.4) * uHits * 0.5 * top * exp(-pow((az - 0.3) * 2.5, 2.0)), body);
  }
  if (oHills > 0.0) {
    for (int i = 0; i < 3; i++) {
      float f = float(i), u = az * (2.4 + 1.3 * f) + f * 17.0 + 4.0;
      float ridge = 0.5 * (1.0 - abs(2.0 * noise(vec2(u, f)) - 1.0)) + 0.22 * abs(2.0 * noise(vec2(u * 2.3, f + 5.0)) - 1.0) + 0.1 * noise(vec2(u * 6.1, f)) + 0.05 * noise(vec2(u * 15.0, f));
      float side = 0.25 + 0.75 * smoothstep(0.02, 0.5, abs(az + 0.1 * (f - 1.0)));
      float tall = oHills * (0.5 - 0.11 * f) * ridge * mix(side, 1.0, 0.25 * (2.0 - f) * 0.5) * (0.75 + 0.1 * f);
      float in_ = smoothstep(tall + 0.0015, tall - 0.0015, rd.y), k = (2.0 - f) / 2.0;
      vec3 rock = mix(uKind[0] * uKind[0] * 0.12 * (0.15 + 1.6 * lit) + 0.002, air * 0.85 + vec3(0.03, 0.04, 0.06) * (1.0 - lit), 0.2 + 0.55 * k);
      rock += (air * 0.35 + vec3(0.05, 0.06, 0.09)) * smoothstep(0.03, 0.0, tall - rd.y) * 0.5 * (0.4 + noise(vec2(u * 9.0, rd.y * 60.0)));
      rock = mix(rock, air * 0.9 + 0.012, 0.6 * exp(-y * 30.0) * k);
      c = mix(c, rock, in_ * min(oHills * 2.0, 1.0));
    }
  }
  if (oLamps > 0.0 && uVar < 0.5) {
    for (int i = 0; i < 2; i++) {
      float n = 34.0 + 27.0 * float(i), u = az * n + float(i) * 7.3, id = floor(u), h = hash11(id + 3.0 * float(i)), h2 = fract(h * 37.7);
      vec2 v = vec2((fract(u) - 0.5 - 0.24 * (h - 0.5)) / n, rd.y - 0.006 - 0.05 * h2 * h2 * h2);
      int kind = int(h2 * 3.99);
      float lv = kind == 0 ? uDrone : kind == 1 ? uPad : kind == 2 ? uTexture : uPhrase;
      vec3 k = uKind[kind];
      c += oLamps * step(0.3, h) * (k * k + 0.05) * (0.35 + 2.6 * lv) * (exp(-dot(v, v) * n * n * 110.0) * 3.0 + 0.3 * exp(-dot(v, v) * n * n * 22.0)) * smoothstep(0.5, 0.25, abs(fract(u) - 0.5));
    }
  }
  return c;
}
// Plates of ice: how far in from the edge of the nearest, and its own number.
vec2 sePlate(vec2 x) {
  vec2 g = floor(x), f = fract(x), best = vec2(9.0), mine = vec2(0.0), at = vec2(0.0);
  float d1 = 9.0, d2 = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), h = hash22(g + o), v = o + 0.5 + 0.8 * (h - 0.5) + 0.04 * sin(uTime * 0.2 + h.yx * 20.0) - f;
    float d = dot(v, v) - 0.16 * h.x;
    if (d < d1) { d2 = d1; d1 = d; mine = h; } else d2 = min(d2, d);
  }
  return vec2(d2 - d1, fract(mine.x * 7.7 + mine.y));
}
// The skin of the sea in another stuff than water. was: the water's own light there.
vec3 seSkin(vec3 was, vec3 q, vec3 ro, vec3 rd, vec3 n, float t, float h0, float fres, vec3 hue, float loud) {
  vec3 k0 = uKind[0] * uKind[0], k2 = uKind[2] * uKind[2], col = was, air = seAir(vec3(0.0, 0.35, 0.9));
  vec3 sun = normalize(seMoon + vec3(-0.25, 0.14, -0.2));
  float lamp = 0.2 + 0.12 * uLevel + 0.95 * oDay + 0.45 * oDusk, far = exp(-t * 0.06);
  if (oDay > 0.0) {
    vec3 body = k0 * (0.1 + 0.6 * sat(h0)) * (0.4 + 1.2 * sat(dot(n, -rd)));
    col += oDay * body * (1.0 - fres) * (0.7 + 0.5 * uLevel);
  }
  if (oWild > 0.0) {
    float froth = noise(q.xz * 1.7 + uTime * 0.1) * 0.6 + noise(q.xz * 6.0) * 0.5 + 0.25 * noise(q.xz * 17.0) * far;
    float crest = smoothstep(1.3, 1.95, h0 + 0.9 * (froth - 0.6) + 0.3 * uHigh);
    float lace = smoothstep(0.035, 0.0, abs(seFbm(q.xz * rot(0.7) * 2.6 + 1.6 * seFbm(q.xz * 1.3)) - 0.48)) * smoothstep(0.2, 1.2, h0) * 0.4 * far;
    col = mix(col, (air * 0.8 + vec3(0.5, 0.56, 0.64) * lamp) * (0.3 + 0.5 * sat(n.y) + 0.45 * froth * (0.4 + 0.6 * far)), oWild * sat(crest + lace) * 0.85);
  }
  if (oShoal > 0.0) {
    vec3 in_ = refract(rd, normalize(mix(vec3(0.0, 1.0, 0.0), n, 0.5)), 0.75);
    vec2 b = q.xz + in_.xz / max(-in_.y, 0.2) * (0.35 + 0.3 * h0), w = b + 0.35 * vec2(noise(b * 1.1), noise(b * 1.1 + 20.0));
    float ribs = 0.5 + 0.5 * sin(w.y * 9.0 + 2.5 * noise(b * 0.6)), grit = noise(b * 24.0) * far;
    vec2 cw = b * 1.6 + 0.6 * vec2(noise(b * 1.9 + uTime * 0.22), noise(b * 1.9 - uTime * 0.19 + 11.0));
    float web = 1.0 - abs(2.0 * noise(cw) - 1.0), web2 = 1.0 - abs(2.0 * noise(cw * 1.3 + 8.0 + uTime * 0.1) - 1.0);
    web = pow(web * web2, 4.0) * 2.4;
    vec3 sand = mix(vec3(0.75, 0.68, 0.55), k2 * 1.2, 0.5) * (0.5 + 0.4 * ribs + 0.25 * grit) * (0.6 + web * (0.4 + 0.6 * max(lamp, 0.3)));
    vec3 deep = mix(sand, sand * (k0 * 1.5 + 0.15), sat(0.25 + 0.04 * t));
    deep = deep * (0.1 + 1.0 * lamp) + hue * hue * loud * (0.25 + 0.75 * web);
    col = mix(col, mix(deep, col, sat(fres * 1.4)), oShoal);
  }
  if (oIce > 0.0) {
    vec2 x = (q.xz + 1.5 * vec2(noise(q.xz * 0.3), noise(q.xz * 0.3 + 8.0))) * 0.42;
    vec2 pl = sePlate(x), near = sePlate(x - normalize(rd.xz + 1e-4) * 0.05);
    float here = step(0.16, pl.y), wide = 0.1 + 0.28 * fract(pl.y * 9.0);
    float on = smoothstep(wide, wide + 0.04 + 0.002 * t, pl.x) * here, lip = smoothstep(wide, wide + 0.04, near.x) * step(0.16, near.y);
    float snow = 0.75 + 0.3 * noise(q.xz * 1.3) + 0.2 * (noise(q.xz * 9.0) - 0.5) * far;
    vec3 ice = (air * 0.75 + vec3(0.52, 0.6, 0.72) * lamp * (0.5 + 0.8 * sat(dot(vec3(0.0, 1.0, 0.0), sun) + 0.2))) * snow * (0.85 + 0.25 * pl.y) + uKind[4] * 0.12 * pow(sat(dot(reflect(rd, vec3(0.0, 1.0, 0.0)), seMoon)), 12.0);
    ice += hue * hue * loud * 0.35;
    vec3 side = ice * vec3(0.4, 0.55, 0.65) * 0.6 + k0 * 0.05;
    col = mix(col, mix(ice, side, (1.0 - lip) * 0.8), oIce * max(on, 0.0));
  }
  if (oDune > 0.0) {
    float rip = noise(q.xz * rot(0.25) * vec2(2.0, 17.0) + 3.0 * noise(q.xz * 0.9));
    vec3 m = normalize(n * vec3(1.6, 1.0, 1.6) + vec3(0.0, 0.0, 0.9 * (rip - 0.5) * far));
    float s = sat(dot(m, vec3(-0.83, 0.36, 0.42))), back = sat(0.5 + 0.5 * m.z);
    lamp += 0.4 * (1.0 - oDay) * (1.0 - oDusk);
    vec3 sand = mix(k2, uKind[2], 0.15) * (0.85 + 0.3 * noise(q.xz * 30.0) * far);
    vec3 d = sand * (air * 0.35 + lamp * mix(vec3(0.62, 0.74, 1.0), vec3(1.0, 0.92, 0.8), max(oDay, oDusk)) * (0.07 + 1.9 * s * s)) + uKind[4] * uKind[4] * oDusk * 0.4 * (1.0 - back) * s;
    d += hue * hue * loud * (0.2 + 0.8 * s) * 0.8;
    if (uVar > 0.5) d += was * 0.5 * sand;
    col = mix(col, d, oDune);
  }
  float ring = length(q.xz - seRing.xy) - seRing.z;
  col += mix(uKind[4], vec3(1.0), 0.3) * max(uHits, uCue) * exp(-ring * ring * 0.5) * (0.15 + 0.5 * lamp);
  if (oRain > 0.0) {
    for (int i = 0; i < 2; i++) {
      vec2 g = q.xz * (2.2 + 1.7 * float(i)) + 9.0 * float(i), id = floor(g), h = hash22(id + float(i) * 5.0);
      float age = fract(uTime * 0.55 + h.x * 9.0), r = length(fract(g) - 0.5 - 0.3 * (h - 0.5));
      col += oRain * exp(-pow((r - 0.45 * age) * 22.0, 2.0)) * (1.0 - age) * smoothstep(0.5, 0.35, r) * far * (air * 0.25 + 0.1 * lamp + hue * 0.1);
    }
  }
  return col;
}
// Drawn in points, or in ruled lines: the light of the sea at q broken up.
vec3 seDrawn(vec3 c, vec3 q, float t, float h0, vec3 rd) {
  float l = log2(max(t, 1.0)), f = fract(l), g = exp2(4.6 - floor(l));
  float lum = dot(c, vec3(0.3, 0.5, 0.2));
  vec3 paper = vec3(0.9, 0.87, 0.8) * oDay * (0.55 + 0.45 * exp(-t * 0.01)) + seAir(vec3(0.0, 0.2, 1.0)) * 0.25 * oDusk;
  if (oDots > 0.0) {
    float a = 0.0;
    for (int i = 0; i < 2; i++) {
      float s = i == 0 ? g : g * 0.5;
      vec2 u = abs(fract(q.xz * s * vec2(1.0, 0.5) + 0.5) - 0.5);
      float r = (0.17 + 0.3 * sqrt(sat(lum * 1.6)) * (1.0 - oDay) + 0.2 * oDay * sat(1.0 - lum)) * (i == 0 ? 1.0 - f : 0.5 + 0.5 * f);
      a = max(a, smoothstep(r + 0.07, r - 0.05, length(u)) * (i == 0 ? smoothstep(1.0, 0.6, f) : 1.0));
    }
    c = mix(c, mix(paper + c * 0.06 * (1.0 - oDay), mix(c * 2.6 + uKind[0] * uKind[0] * 0.07 * (0.5 + h0), c * 0.5, oDay), a), oDots);
  }
  if (oRules > 0.0) {
    float a = 0.0;
    for (int i = 0; i < 2; i++) {
      float s = (i == 0 ? g : g * 0.5) * 0.55;
      float w = abs(fract(q.z * s + 0.6 * h0 * s + 0.5) - 0.5), r = (0.1 + 0.14 * mix(sat(lum), sat(1.0 - lum), oDay)) * (i == 0 ? 1.0 - f : 0.5 + 0.5 * f);
      a = max(a, smoothstep(r + 0.06, r - 0.05, w) * (i == 0 ? smoothstep(1.0, 0.6, f) : 1.0));
    }
    c = mix(c, mix(paper + c * 0.08 * (1.0 - oDay), mix(c * 2.4 + 0.012 * (0.5 + h0), c * 0.12, oDay), a), oRules);
  }
  return c;
}
float seStreaks(vec2 p) {
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    vec2 g = (p * rot(0.05)) * vec2(46.0 + 30.0 * f, 2.6 + f) + vec2(f * 9.0, mod(uTime * (3.2 + 0.7 * f), 1024.0));
    float c = floor(g.x); g.y += 17.0 * hash11(c + f * 41.0);
    float h = hash21(vec2(c, floor(g.y)) + f * 3.0), v = fract(g.y);
    s += step(0.72, h) * smoothstep(0.5, 0.1, abs(fract(g.x) - 0.5)) * smoothstep(0.0, 0.15, v) * smoothstep(0.75, 0.3, v) * (0.5 - 0.1 * f);
  }
  return s;
}
vec3 render(vec2 p) {
  float metal = uVar;
  oUp = max(uOwn[0], 0.0); oDown = max(-uOwn[0], 0.0); oDay = max(uOwn[1], 0.0); oDusk = max(-uOwn[1], 0.0);
  oWild = max(uOwn[2], 0.0); oCalm = max(-uOwn[2], 0.0); oDisc = max(uOwn[3], 0.0); oLamps = max(-uOwn[3], 0.0);
  oHills = max(uOwn[4], 0.0); oIce = max(-uOwn[4], 0.0); oDots = max(uOwn[5], 0.0); oRules = max(-uOwn[5], 0.0);
  oCloud = max(uOwn[6], 0.0); oRain = max(-uOwn[6], 0.0); oShoal = max(uOwn[7], 0.0); oDune = max(-uOwn[7], 0.0);
  seWorldly = oUp + oDown + oDay + oDusk + oWild + oCalm + oDisc + oLamps + oHills + oIce + oDots + oRules + oCloud + oRain + oShoal + oDune > 0.0;
  vec3 ro = vec3(0.0, 1.3, uTravel * 0.5);
  vec3 rd = normalize(vec3(p.x, p.y - 0.12, 1.0));
  if (seWorldly) {
    if (oDisc > 0.0) seMoon = normalize(mix(seMoon, vec3(-0.12, 0.13, 1.0), oDisc));
    if (oLamps > 0.0) seMoon = normalize(mix(seMoon, vec3(-0.9, 0.5, 0.4), oLamps));
    ro.y += 1.1 * oWild * (1.0 - 0.4 * oUp) + 6.5 * oUp - 0.35 * oDown * (1.0 - oWild);
    rd.yz = rot(0.33 * oDown - 0.72 * oUp) * rd.yz;
  }
  seRing = vec3(ro.x + 2.5 * sin(uTime * 0.21), ro.z + 8.0 + 2.0 * cos(uTime * 0.17), (1.0 - max(uHits, uCue * 0.999)) * mix(4.0, 9.0, step(uHits, uCue)));
  vec3 col;
  float top = 1.0 + 0.6 * uLow;
  if (seWorldly) top = mix(top, 0.25, max(oCalm, 0.85 * oIce)) + 1.7 * oWild;
  if (rd.y > 0.0) {
    col = seSkyOf(rd, 0.0);
  } else {
    // march down to the water
    float t = max((ro.y - top) / -rd.y, 0.2);
    for (int i = 0; i < 30; i++) {
      vec3 q = ro + rd * t;
      float d = q.y - seHeight(q.xz, 2);
      if (d < 0.003 * t || t > 90.0) break;
      t += d * 0.85 + 0.005 * t;
    }
    t = min(t, 120.0);
    vec3 q = ro + rd * t;
    float e = 0.01 + 0.012 * t;
    float h0 = seHeight(q.xz, 5);
    vec3 n = normalize(vec3(h0 - seHeight(q.xz + vec2(e, 0.0), 5), e, h0 - seHeight(q.xz + vec2(0.0, e), 5)));
    n = normalize(mix(n, vec3(0.0, 1.0, 0.0), sat(t / 110.0)));
    vec3 rf = reflect(rd, n); rf.y = abs(rf.y);
    float fres = 0.03 + 0.97 * pow(1.0 - sat(dot(-rd, n)), 5.0);
    if (metal < 0.5) {
      col = seSkyOf(rf, 1.0) * fres * 1.3;
      // the moon's path: the glitter of many small faces
      float m = sat(dot(rf, seMoon));
      col += vec3(0.85, 0.92, 1.0) * (0.5 * pow(m, 400.0) + 0.03 * pow(m, 20.0)) * (0.6 + 1.0 * uHigh);
      // sparkle: tiny faces that happen to catch the moon, more of them as the high band rises
      float grain = 64.0 / exp2(floor(log2(max(t, 1.0))));
      vec2 cell = floor(q.xz * grain);
      vec2 hh = hash22(cell);
      vec3 n2 = normalize(n + vec3(hh.x - 0.5, 0.0, hh.y - 0.5) * (0.3 + 0.5 * uHigh));
      vec3 r2 = reflect(rd, n2); r2.y = abs(r2.y);
      float m2 = sat(dot(r2, seMoon));
      float dot_ = smoothstep(0.32, 0.05, length(fract(q.xz * grain) - 0.5 - (hh.yx - 0.5) * 0.55)) * step(0.45, fract(hh.x * 7.3 + hh.y * 3.1));
      col += vec3(1.0, 0.98, 0.95) * pow(m2, 60.0) * dot_ * (2.0 + 4.0 * uHigh) * (0.5 + 0.5 * sin(uTime * (1.0 + 2.0 * hh.x) + hh.y * 50.0));
      // the piece under the water: across is the loop, far is the back of the room
      vec2 under = q.xz + n.xz * 1.2 - vec2(ro.x, ro.z);
      vec2 uv = vec2(under.x / (2.4 + 0.52 * under.y) * 0.5 + 0.5, 1.0 - (under.y - 2.0) / 30.0);
      if (oUp > 0.0) uv = seWhere(under, uv);
      vec4 pc = piece(uv);
      if (seWorldly) pc *= seFade(uv);
      vec3 hue = pc.rgb / max(pc.a, 0.02);
      float through = (1.0 - fres) * sat(0.25 + 2.2 * dot(n, -rd)); // faces turned to us let the light out
      float patchy = 0.35 + 0.65 * noise(q.xz * 0.7 + vec2(0.0, uTime * 0.05));
      col += hue * hue * 2.0 * pc.a * (0.1 + 1.6 * pc.a) * through * patchy * (0.25 + 1.6 * h0);
      col += vec3(0.002, 0.007, 0.012) * (0.3 + 2.0 * h0) * (1.0 - fres); // the water's own dark blue
    } else {
      vec3 sky = seSkyOf(rf, 1.0);
      col = sky * mix(0.8, 1.0, fres);
      col += vec3(0.6, 0.65, 0.8) * 0.035 * pow(1.0 - sat(dot(-rd, n)), 3.0) * (0.4 + 0.6 * uLevel); // a cold rim so the dark swell can be seen
    }
    if (seWorldly) {
      vec2 under = q.xz + n.xz * 1.2 - vec2(ro.x, ro.z);
      vec2 uv = vec2(under.x / (2.4 + 0.52 * under.y) * 0.5 + 0.5, 1.0 - (under.y - 2.0) / 30.0);
      if (oUp > 0.0) uv = seWhere(under, uv);
      vec4 pc = piece(uv) * seFade(uv);
      col = seSkin(col, q, ro, rd, n, t, h0, fres, pc.rgb / max(pc.a, 0.02), pc.a * (0.1 + pc.a));
      if (oDots + oRules > 0.0) col = seDrawn(col, q, t, h0, rd);
    }
    col *= exp(-t * 0.004);
    vec3 off = seSkyOf(vec3(rd.x, 0.004, rd.z), 1.0);
    col = mix(col, off, smoothstep(50.0, 110.0, t));
    if (seWorldly) col = mix(col, off, (1.0 - exp(-t * 0.012)) * max(oDay, oDusk) * (1.0 - 0.7 * max(oDots, oRules)) * (1.0 - 0.6 * oUp));
  }
  if (oRain > 0.0) col += oRain * seStreaks(p) * (0.03 + 0.25 * oDay + 0.12 * oDusk + 0.05 * uLevel);
  return screenOf(col);
}
