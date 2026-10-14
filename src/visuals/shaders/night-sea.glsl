// name: Night sea
// a: Moonlit
// b: Heavy sea
// what: A dark sea under the moon with the piece glowing beneath the waves, far sounds far out and near sounds close; or the same sea as heavy liquid metal under a sky lit in the colours of the sounds.
// follows: The low band raises the swell and the high band puts sparkle on it; each sound glows under the water where it sits in the piece; a hit is lightning on the horizon; over the metal each kind of sound is a pillar of light as tall as it is loud, and a hit drops a ring into the sea.
float seWave(vec2 x, float f, float t, float sharp) {
  x += (vec2(noise(x * f * 0.35), noise(x * f * 0.35 + 9.0)) - 0.5) * 1.6 / f;
  float s = sin(x.x * f + t), c = sin(x.y * f * 0.83 - t * 0.7);
  float w = 0.5 + 0.25 * (s + c);
  return pow(w, sharp);
}
vec3 seRing; // x, z of where the ring started, and how far it has gone
// The height of the water. n is how many layers of wave to add.
float seHeight(vec2 x, int n) {
  float t = uTime * 0.6, metal = uVar;
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
  return h;
}
float seStars(vec2 p, float n, float seed) {
  vec2 g = p * n, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id + seed);
  float d = length(f - (h - 0.5) * 0.7);
  return pow(h.x, 14.0) * (0.7 + 0.3 * sin(uTime * (0.8 + 2.0 * h.y) + h.y * 40.0)) * smoothstep(0.08, 0.0, d) * 3.0;
}
const vec3 seMoon = vec3(-0.2357, 0.2828, 0.9299);
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
vec3 render(vec2 p) {
  float metal = uVar;
  vec3 ro = vec3(0.0, 1.3, uTravel * 0.5);
  vec3 rd = normalize(vec3(p.x, p.y - 0.12, 1.0));
  seRing = vec3(ro.x + 2.5 * sin(uTime * 0.21), ro.z + 8.0 + 2.0 * cos(uTime * 0.17), (1.0 - max(uHits, uCue * 0.999)) * mix(4.0, 9.0, step(uHits, uCue)));
  vec3 col;
  float top = 1.0 + 0.6 * uLow;
  if (rd.y > 0.0) {
    col = metal < 0.5 ? seSky(rd, 0.0) : seGlowSky(rd);
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
      col = seSky(rf, 1.0) * fres * 1.3;
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
      vec4 pc = piece(uv);
      vec3 hue = pc.rgb / max(pc.a, 0.02);
      float through = (1.0 - fres) * sat(0.25 + 2.2 * dot(n, -rd)); // faces turned to us let the light out
      float patchy = 0.35 + 0.65 * noise(q.xz * 0.7 + vec2(0.0, uTime * 0.05));
      col += hue * hue * 2.0 * pc.a * (0.1 + 1.6 * pc.a) * through * patchy * (0.25 + 1.6 * h0);
      col += vec3(0.002, 0.007, 0.012) * (0.3 + 2.0 * h0) * (1.0 - fres); // the water's own dark blue
    } else {
      vec3 sky = seGlowSky(rf);
      col = sky * mix(0.8, 1.0, fres);
      col += vec3(0.6, 0.65, 0.8) * 0.035 * pow(1.0 - sat(dot(-rd, n)), 3.0) * (0.4 + 0.6 * uLevel); // a cold rim so the dark swell can be seen
    }
    col *= exp(-t * 0.004);
    col = mix(col, metal < 0.5 ? seSky(vec3(rd.x, 0.004, rd.z), 1.0) : seGlowSky(vec3(rd.x, 0.004, rd.z)), smoothstep(50.0, 110.0, t));
  }
  return screenOf(col);
}
