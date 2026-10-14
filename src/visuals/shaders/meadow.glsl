// name: Meadow
// a: Long grass
// b: Still water
// what: A field of long grass in the last light, seen from low among the blades, the piece lying in it as drifts of glowing seed heads: far sounds far off, near sounds close; or reeds standing in still water at dusk, mirrored, with mist.
// follows: The low band is the wind that leans the grass, each sound lights the seed heads where it sits in the piece, the high band glints on the blade edges, the mix brings out the fireflies, a hit or cue sends one wave of wind across the field and lifts a cloud of sparks (over the water it also drops a ring).
const float M_F = 0.9;   // how wide the eye is
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
  vec3 haze = mix(vec3(0.20, 0.085, 0.028), vec3(0.035, 0.018, 0.035), reeds) * (0.6 + 0.9 * nearSun);
  // far land: a line of trees in the haze (mirrored in b)
  float e = abs(p.y - yh);
  float ridge = 0.012 + 0.03 * noise(vec2(ps.x * 2.6 + 4.0, 1.0)) + 0.016 * noise(vec2(ps.x * 17.0, 5.0));
  float land = smoothstep(ridge + 0.004, ridge - 0.004, e);
  col = mix(col, mix(haze * 0.45, vec3(0.02, 0.02, 0.045), reeds * 0.6), land * mix(1.0, 0.8, inWater));
  col = mix(col, haze * vec3(0.45, 0.6, 0.3), (1.0 - reeds) * step(p.y, yh));     // a: the far field
  float back = exp(-2.6 * length(p - vec2(sun.x, max(sun.y, yh + 0.03))));       // how near the low light this pixel is
  // b: mist lying on the water between the far bank and the near reeds
  float my = p.y - yh;
  vec2 mq = vec2(p.x * 1.6 - uTime * 0.012, my * 9.0 + uTime * 0.008);
  float mist = reeds * sat((exp(-pow(my / 0.05, 2.0)) * 0.8 + 0.25 * exp(-abs(my) / 0.14)) * (0.3 + 2.6 * noise(mq) * noise(mq * 2.1 + 4.0)) * (0.7 + 0.5 * uSpace));
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
    float xs = xw - lean * tw * tw / (1.0 + 0.3 * tw);
    float near = smoothstep(0.7, 1.0, fi);
    float cw = mix(mix(0.055, 0.1, fi), mix(0.09, 0.17, fi), reeds);
    float c = xs / cw, id = floor(c), other = step(0.5, c - id) * 2.0 - 1.0;
    // the piece lies in the field: across is the loop, far is the back of the room
    vec4 m = piece(vec2(p.x / asp * 0.94 + 0.5, 0.04 + 0.92 * fi));
    float loud = sat(m.a * (0.65 + 0.6 * uEnergy));
    vec3 hue = m.rgb / max(m.a, 0.03);
    hue = hue * hue * (0.6 + hue) * 1.5;
    float blur = mix(0.028, 0.016, reeds) * max(1.0 / z - 0.6, 0.0) + 0.004 * mir;
    float aa = (px + blur) / s;
    // b: reeds stand in clumps, a far bank and the near sides, and leave the middle of the water open
    float clump = mix(1.0, smoothstep(0.0, 0.1, sin(xw * mix(1.1, 0.5, fi) + fi * 23.0) * sin(xw * 0.37 + fi * 9.0) + 0.25 - 0.5 * fi) * smoothstep(0.4, 0.5, abs(p.x + 0.1) * (0.35 + 0.6 * fi) + 0.55 * (1.0 - fi) * (1.0 - fi)), reeds);
    vec3 lc = vec3(0.0), lg = vec3(0.0); float la = 0.0;
    for (int j = 0; j < 2; j++) {
      float cid = id + float(j) * other;
      float hx = hash21(vec2(cid * 0.731 + 0.17, float(i) * 7.13 + 3.3 + reeds * 9.0));
      float hy = fract(hx * 57.31), h3 = fract(hx * 131.7), h4 = fract(hx * 717.3);
      float bh = mix(mix(0.5, 1.15, hy * hy), mix(1.1, 2.0, hy), reeds) * (1.0 + 0.5 * near * (1.0 - reeds));
      float t = tw / bh, tt = sat(t);
      float dx = xs - (cid + 0.5 + (hx - 0.5) * 0.4 + (h3 - 0.5) * 0.8 * tt * tt) * cw;
      float w0 = mix(0.011 + 0.011 * h4, 0.012 + 0.008 * h4, reeds) * (1.0 + 0.8 * fi + 0.6 * near * reeds);
      float w = w0 * (1.0 - tt * tt) * (0.45 + 0.55 * (1.0 - tt));
      // a seed head on some blades; on a reed a long plume
      float has = step(mix(0.55, 0.4, reeds), h4) * (1.0 - near * (1.0 - reeds));
      float h0 = mix(0.74, 0.66, reeds);
      float u = sat((t - h0) / (1.0 - h0)), bell = 4.0 * u * (1.0 - u);
      float hw = w0 * mix(1.5, 2.3, reeds) * sqrt(bell) * (1.0 - 0.4 * u) * has;
      float ww = max(w, hw);
      float ah = aa + 0.45 * hw;                             // a head has a soft feathered edge
      float cover = smoothstep(ww + ah, ww - ah, abs(dx)) * smoothstep(1.0, 0.985, t) * step(0.0, tw);
      cover *= mix(1.0, step(mix(0.6, 0.3, reeds), h3), near);              // the nearest are few
      // the blade: deep at the root, straw and gold toward the tip, one half of the fold in shade, light coming through it
      vec3 bc = mix(vec3(0.006, 0.026, 0.011), mix(vec3(0.035, 0.11, 0.02), vec3(0.15, 0.105, 0.026), hx * hx * 0.9), tt);
      bc = mix(bc, vec3(0.008, 0.018, 0.012) + vec3(0.02, 0.03, 0.012) * tt, reeds * 0.85);
      float side = sat(0.5 + 0.5 * dx / max(w, 1e-4) * sign(sun.x - p.x + 0.001));
      bc *= 0.5 + 0.65 * side;
      bc += vec3(0.45, 0.26, 0.05) * smoothstep(0.55, 1.0, side) * tt * (0.12 + 0.5 * back) * (1.0 - 0.6 * reeds);
      bc += vec3(0.7, 0.36, 0.05) * back * tt * (0.3 + 0.7 * side) * (0.9 + 0.6 * gust);
      bc += vec3(0.15, 0.14, 0.05) * (gust + wave * wave * (0.15 + 0.6 * uLow) * (1.0 - 0.6 * fi)) * tt * (1.0 - 0.7 * reeds);  // bowed grass shows its pale side
      float gl = 0.5 + 0.5 * sin(t * 7.0 - uTime * 1.1 + hy * 40.0); gl *= gl; gl *= gl; gl *= gl;
      bc += vec3(1.0, 0.85, 0.5) * gl * smoothstep(0.3, 0.9, side) * (0.04 + 0.8 * uHigh) * (0.25 + back);
      // the head: straw until its sound comes, then lit in the sound's colour
      vec3 hc = vec3(0.13, 0.08, 0.025) * (0.4 + 2.2 * back) * (1.0 - 0.8 * sat(m.a * 3.0)) + hue * (0.06 + 1.25 * loud) * (0.5 + 0.5 * bell) * (0.6 + 0.4 * side);
      bc = mix(bc, hc, has * smoothstep(0.0, 0.12, u));
      float ex = dx / (cw * 0.42), ey = (t - 0.5 - 0.5 * h0) / (1.0 - h0);
      float halo = max(1.0 - ex * ex - ey * ey, 0.0);
      lg += hue * loud * has * halo * halo * halo * 0.6;
      lc = mix(lc, bc, cover); la = max(la, cover);
    }
    // the ground the blades stand in (a)
    float foot = smoothstep(0.1, 0.0, tw) * (1.0 - reeds);
    lc = mix(lc, vec3(0.005, 0.016, 0.008), foot); la = max(la, foot);
    float fog = 1.0 - exp(-z * mix(0.11, 0.07, reeds));
    float dim = mix(1.0, mix(0.3, 0.15, reeds), near) * mix(1.0, 0.5, mir) * (1.0 - 0.35 * reeds);    // the nearest stand dark against the light
    col = mix(col, mix(lc * dim, haze, fog * mix(0.9, 0.8, reeds)), la * clump * mix(1.0, 0.8, mir));
    col += lg * clump * (1.0 - 0.5 * fog) * mix(1.0, 0.6, mir);
    col = mix(col, vec3(0.10, 0.07, 0.11) * (0.8 + 0.6 * uLevel) + 0.3 * sky, 0.8 * mist * step(3.5, float(i)) * step(float(i), 4.5));
  }
  // seeds and fireflies, more of them as the music fills; a hit lifts a cloud of them along the wave
  float front = mix(-1.15, 1.2, 1.0 - g);
  float lift = sqrt(g) * exp(-pow((p.x - front) * 2.2, 2.0));
  float much = 0.04 + 0.1 * uLevel + 0.08 * uTexture + 0.32 * lift;
  float zone = smoothstep(0.42, -0.05, p.y) * (0.5 + 0.6 * uLevel + 1.2 * lift);
  vec2 pm = vec2(p.x, mix(p.y, yh + abs(p.y - yh), reeds)); // b: the water doubles them
  vec3 motes = mMotes(pm * rot(-0.25), 8.0, 1.0, much, kindColour(2.0)) + 0.7 * mMotes(pm * rot(0.4) + 3.0, 15.0, 2.0, much, kindColour(3.0));
  col += motes * zone * mix(1.0, 0.5, inWater);
  col += vec3(1.0, 0.42, 0.09) * 0.14 * exp(-4.5 * length((p - sun) * vec2(1.0, 1.5))) * (1.0 - reeds) * (0.7 + 0.6 * uLevel);   // the low sun flares over the grass
  col /= 1.0 + 0.7 * dot(p, p);                              // the corners fall away
  return screenOf(col * 1.05);
}
