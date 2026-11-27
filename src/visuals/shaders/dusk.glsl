// name: Dusk
// a: Over water
// b: Ribbed glass
// what: The sky after sunset over still water: long soft bands of colour from a glow at the horizon up into blue-black, thin streaks of cloud lit from below, the last of the sun behind a far shore; or the sun still up, seen through ribbed glass that cuts the sky into slipped slices.
// follows: Each band is a kind of sound, as thick and bright as that sound is loud (texture lowest in amber, then the phrase in rose, the pads in violet, and the drone highest in deep teal); the low band swells the sun; a hit is a flare low along the horizon that lights the clouds from under; a cue sends a slow ring out from the sun.
// own: 0 1 a great disc of sun stands over the horizon, -1 the sun is gone and a thin moon hangs high; 1 1 ridge behind ridge of hills, -1 reeds stand close by; 2 1 a floor of cloud in place of the water, -1 a rough sea; 3 1 a whole sky of rippled cloud, -1 no cloud and a field of stars; 4 1 a pale bright sky, -1 the bands stand up as curtains of light; 5 1 all in the colours of the kinds, sun and cloud too, -1 the glow is overhead and the horizon dark; 6 1 the bands cut from paper with wavy edges, -1 all in dots; 7 1 lanterns adrift over the water (b: round lenses), -1 rain hangs from the sky in shafts (b: a few broad ribs)

float duLv[4];
vec3 duCol[4];
float duSunX, duSunE, duDisc, duCover;

// A colour of the sun's, or of cloud lit by it, in the colours of the kinds.
vec3 duDyed(vec3 was) {
  if (uOwn[5] <= 0.0) return was;
  vec3 k = uKind[2] * uKind[2];
  return mix(was, k / max(max(k.r, max(k.g, k.b)), 0.02) * max(was.r, max(was.g, was.b)) * 0.95, uOwn[5]);
}
float duStars(vec2 p) {
  vec2 g = p * 46.0, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id);
  return pow(h.x, 18.0) * smoothstep(0.1, 0.0, length(f - (h - 0.5) * 0.7)) * (0.7 + 0.3 * sin(uTime * (0.6 + h.y) + h.y * 30.0));
}
// The bands of the sky at x across and e above the horizon, without cloud.
vec3 duAir(float x, float e) {
  float dx = x - duSunX;
  if (uOwn[5] < 0.0) e = mix(e, abs(0.6 - e), -uOwn[5]);
  float ee = e + 0.06 * dx * dx; // the bands arch over the sun
  float cut = 1.0;
  if (uOwn[6] > 0.0) { // sheets laid one behind another, each with its own edge
    float n = ee * 9.0 + 0.55 * sin(x * 2.3 + floor(ee * 4.0) * 1.9) + 0.22 * sin(x * 5.1 + ee * 9.0 + uTime * 0.02), k = floor(n), f = n - k;
    ee = mix(ee, max((k + 0.5) / 9.0, 0.0), uOwn[6]);
    cut = 1.0 - uOwn[6] * (0.6 * exp(-(1.0 - f) * 4.0) - 0.15);
  }
  vec3 col = vec3(0.0);
  float c = 0.0, before = 0.0;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float w = 0.02 + (0.07 + 0.018 * fk) * duLv[k];
    c += (before + w) * 0.8;
    before = w;
    float d = (ee - c) / w;
    float side = exp(-dx * dx * (1.1 - 0.25 * fk)); // low bands keep close to where the sun went down
    // within a band the hue turns: warmer on its lower side, deeper on its upper
    vec3 hue = max(hueShift(duCol[k], -0.055 * clamp(d, -1.6, 1.6)), 0.0);
    col += hue * (exp(-d * d) + 0.22 * exp(-d * d * 0.2)) * (0.006 + 1.05 * duLv[k] * duLv[k] + 0.2 * duLv[k]) * side * exp(-c * 2.4);
  }
  if (uOwn[4] < 0.0) { // curtains: each hangs from nowhere over a winding hem
    vec3 cur = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      float fk = float(k), xx = x + 0.05 * sin(x * 4.0 + uTime * 0.07 + fk * 2.0);
      float hem = 0.09 + 0.085 * fk + 0.06 * sin(xx * (2.2 + 0.4 * fk) + fk * 2.4 + uTime * 0.03) + 0.025 * sin(xx * 7.0 - uTime * 0.05 + fk);
      float up = e - hem, fold = noise(vec2(xx * 5.0 + 20.0 * fk + 60.0, uTime * 0.05)), ray = noise(vec2(xx * 38.0 + fk * 31.0 + 90.0 + 4.0 * fold, uTime * 0.11 + 4.0));
      float tall = (0.07 + 0.2 * duLv[k]) * (0.5 + fold);
      cur += duCol[k] * smoothstep(-0.004, 0.02, up) * exp(-max(up, 0.0) / tall) * (0.3 + 0.7 * fold) * (0.45 + 0.55 * ray) * (0.05 + 1.5 * duLv[k]);
    }
    col = mix(col * 0.12 + cur, col, 1.0 + uOwn[4]);
  }
  if (uOwn[6] > 0.0) col *= cut;
  // what is left of the day, low down, and the deep of the sky above
  col += duDyed(vec3(0.55, 0.15, 0.04)) * (1.0 + min(uOwn[4], 0.0)) * exp(-e / 0.03) * (0.04 + 0.22 * uLow) * exp(-dx * dx * 0.8);
  col += vec3(0.002, 0.005, 0.016) * smoothstep(0.7, 0.0, e) * (0.4 + 0.6 * uLevel);
  return col;
}
// The sun and the light round it.
vec3 duSun(float x, float e) {
  vec2 d = vec2((x - duSunX) * 0.62, e - duSunE);
  float gone = max(-uOwn[0], 0.0), great = max(uOwn[0], 0.0);
  float r = 0.05 + 0.1 * uLow, dd = dot(d, d);
  if (gone > 0.0) r *= 1.0 - 0.6 * gone;
  vec3 col = duDyed(vec3(1.0, 0.55, 0.16)) * exp(-dd / (r * r)) * (0.35 + 2.2 * uLow);
  col += duDyed(vec3(1.0, 0.2, 0.12)) * exp(-sqrt(dd) / (r * 1.25)) * (0.06 + 0.5 * uLow);
  // the sun itself, when it is still up: hot above, red where it nears the water
  float disc = length(vec2(x - duSunX, e - duSunE));
  float R = (0.085 + 0.03 * uLow) * (1.0 + 1.1 * great);
  if (gone > 0.0) {
    col *= 1.0 - 0.85 * gone;
    vec2 m = vec2(x - duSunX, e - duSunE);
    col += gone * vec3(1.0, 0.97, 0.9) * (smoothstep(0.05, 0.047, length(m)) * smoothstep(0.044, 0.05, length(m - vec2(-0.016, 0.014))) * (1.2 + 0.8 * uLow) + (0.015 + 0.05 * uLow) * exp(-length(m) * 9.0));
  }
  col += duDyed(mix(vec3(1.0, 0.16, 0.1), vec3(1.0, 0.82, 0.4), sat(0.5 + (e - duSunE) / (2.0 * R)))) * smoothstep(R, R - 0.012, disc) * 1.6 * duDisc;
  if (great > 0.0) { duCover = great * duDisc * smoothstep(R, R - 0.006, disc); col = mix(col, duDyed(mix(vec3(1.0, 0.16, 0.1), vec3(1.0, 0.82, 0.4), sat(0.5 + (e - duSunE) / (2.0 * R)))) * (1.1 + 0.5 * uLow), duCover); }
  // a cue: a slow ring going out from the sun
  float ring = 0.08 + 0.75 * (1.0 - uCue);
  col += duDyed(vec3(1.0, 0.55, 0.35)) * uCue * 0.6 * exp(-pow((disc - ring) / 0.035, 2.0)) * smoothstep(0.0, 0.05, 1.0 - uCue);
  return col;
}
// The sky made pale: what lit the dark colours the light.
vec3 duPale(vec3 c, float up) {
  float m = max(c.r, max(c.g, max(c.b, 1e-3))), a = 1.0 - exp(-3.5 * m);
  vec3 h = c / m;
  return vec3(1.3, 1.26, 1.2) * (0.8 + 0.25 * exp(-up * 3.0)) * mix(vec3(1.0), 0.06 + 0.97 * h, 0.85 * a) + c * 0.25;
}
// Ridge behind ridge over the view.
vec3 duRidges(vec3 col, float x, float e, float much, float pale) {
  vec3 near = duAir(x, 0.06) * 0.8, deep = (duCol[3] * (0.12 + 0.75 * duLv[3]) + duCol[2] * (0.1 + 0.5 * duLv[2])) * 0.75 + 0.008, flare = mix(kindColour(4.0), vec3(1.0, 0.3, 0.16), 0.4) * uHits * exp(-pow((x - 0.6 * sin(uTime * 0.13 + 1.0) + 0.1) * 2.6, 2.0));
  for (int i = 0; i < 5; i++) {
    float f = float(i) * 0.25, xx = x * (1.6 - 0.5 * f) + 17.0 * float(i) + 40.0 + uTime * 0.0012 * float(i);
    float n = noise(vec2(xx * 1.7, 3.0)) * 0.6 + noise(vec2(xx * 4.3, 8.0)) * 0.27 + noise(vec2(xx * 11.0, 1.0)) * 0.1 + noise(vec2(xx * 29.0, 5.0)) * 0.035;
    float top = mix(0.1, -0.25, f) + (0.2 + 0.03 * f) * (n - 0.35) - 0.16 * (1.0 - much), in_ = smoothstep(-0.002, 0.002, top - e);
    int k = int(min(f * 4.0, 3.0));
    vec3 haze = near * (1.1 - 0.3 * f) + duCol[k] * (0.03 + 0.3 * duLv[k] * duLv[k]) + vec3(0.01, 0.013, 0.02);
    haze = mix(haze, deep, 0.3 + 0.6 * f);
    if (pale > 0.0) haze = mix(haze, duPale(haze, 0.1) * 0.9, pale);
    vec3 c = haze * mix(0.62, 0.045, f) + mix(0.25, 0.5, f) * haze * smoothstep(0.0, 0.2, top - e) * (1.0 - 0.6 * f);
    c = mix(c, c * 0.6 + 0.8 * flare, 0.33 * uHits * exp(-max(top - e, 0.0) * 9.0) * exp(-pow((x - 0.6 * sin(uTime * 0.13 + 1.0) + 0.1) * 2.6, 2.0)));
    col = mix(col, c, in_ * min(much * 2.0, 1.0));
  }
  return col;
}
// Reeds close by, dark against the light: how much of the view they take, and how much light runs along them.
vec2 duReeds(vec2 p) {
  vec2 s = vec2(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float n = 11.0 + 6.0 * i, id0 = floor(p.x * n);
    for (float j = -2.0; j <= 2.0; j++) {
      float id = id0 + j, h = hash11(id + 71.0 * i), h2 = fract(h * 57.3), y = p.y + 0.72, tall = (0.35 + 0.75 * h * h) * (1.05 - 0.16 * i);
      float t = y / tall, lean = (h2 - 0.5) * 0.35 + 0.03 * sin(uTime * (0.3 + 0.2 * h2) + id);
      if (t < 1.0) {
        float d = abs(p.x - (id + 0.2 + 0.6 * h2) / n - lean * t * t * tall), w = 0.0065 * (1.0 - 0.8 * t) * (1.0 - 0.2 * i);
        float head = step(0.45, h2) * 0.0125 * sqrt(sat(sin(PI * sat((t - 0.7) / 0.28)))) * (1.0 - 0.2 * i);
        float a = smoothstep(0.0016, -0.0016, d - max(w, head));
        s = max(s, vec2(a, a * smoothstep(0.35, 1.0, t)));
      }
    }
  }
  return s;
}
// Lanterns adrift: the light of them at x across, d over the water.
vec3 duLanterns(float x, float d) {
  vec3 c = vec3(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float n = 2.4 + 2.6 * i, size = 0.024 - 0.007 * i;
    vec2 g = vec2(x * n + 0.06 * uTime * (0.4 + 0.2 * i) / n + 90.0 + 13.0 * i, d * n * 1.3 - 0.05 * uTime * (0.5 + 0.2 * i) + 70.0), id = mod(floor(g), 97.0), h = hash22(id + 31.0 * i);
    vec2 q = (fract(g) - 0.5 - (h - 0.5) * 0.5) / vec2(n, n * 1.3), ff = fract(g), ed = smoothstep(0.0, 0.22, min(ff, 1.0 - ff));
    vec4 m = piece(vec2(sat(x / 1.78 + 0.5), h.x));
    float on = step(h.y, 0.4), r = length(q * vec2(1.0, 0.8)), here = 0.35 + 1.2 * sat(m.a) + 0.15 * sin(uTime * 0.7 + h.x * 40.0);
    vec3 hue = mix(duDyed(vec3(1.0, 0.62, 0.25)), m.rgb / max(m.a, 0.05), 0.5 * sat(m.a * 2.0));
    c += on * hue * here * (smoothstep(size, size * 0.5, r) * 1.1 + 0.22 * exp(-r * r / (size * size * 5.0)) * ed.x * ed.y) * (1.0 - 0.2 * i);
  }
  return c;
}
// The whole view at a point of the screen: h is where the horizon lies.
vec3 duView(vec2 p, float h) {
  float x = p.x, e = p.y - h;
  float wet = step(e, 0.0);
  float d = abs(e);
  // still water: glass where no wind is, and long darker lanes that hold the sky a little higher up
  float pz = 1.0 / (d + 0.03);
  float lane = noise(vec2(x * 0.7 * pz * 0.2 + 3.0, pz * 1.9 + uTime * 0.03)) * 0.65 + 0.35 * noise(vec2(x * 2.0 * pz * 0.2, pz * 6.0 - uTime * 0.05));
  float glass = smoothstep(0.3, 0.66, lane);
  float up = mix(d, d * mix(1.7, 1.03, glass), wet);
  float rough = max(-uOwn[2], 0.0), pale = max(uOwn[4], 0.0), face = 0.5;
  if (rough > 0.0 && wet > 0.5) { // the faces of waves hold other heights of the sky
    face = 0.6 * noise(vec2(x * pz * 0.3 + 60.0 + 0.04 * uTime, pz * 1.1 + 50.0 - uTime * 0.12)) + 0.4 * noise(vec2(x * pz * 0.8 + 90.0, pz * 3.0 + 80.0 - uTime * 0.2));
    up = mix(up, 0.01 + 0.95 * face * face * face, rough);
  }
  duCover = 0.0;
  vec3 sun = duSun(x, up), col = duAir(x, up) * (1.0 - duCover) + sun;
  if (pale > 0.0) col = mix(col, mix(duPale(col, up), sun * 1.3, duCover), pale);
  // a hit: a flare low along the horizon
  float fx = 0.6 * sin(uTime * 0.13 + 1.0) - 0.1;
  float fd = x - fx;
  float flare = uHits * exp(-fd * fd / 0.09);
  float core = uHits * exp(-(fd * fd + up * up * 3.0) / 0.007);
  vec3 flareCol = mix(kindColour(4.0), vec3(1.0, 0.22, 0.12), 0.6);
  col += flareCol * flare * (1.3 * exp(-up / 0.035) + 0.3 * exp(-up / 0.12)) + (flareCol + vec3(0.5, 0.35, 0.2)) * core * 2.2;
  if (pale > 0.0) col = mix(col, col * (0.25 + 0.6 * flareCol), pale * 0.8 * flare * exp(-up / 0.14));
  // thin cloud, a flat layer seen from under so it gathers into streaks toward the horizon
  float cz = 1.0 / (up + 0.045);
  vec2 cq = vec2(x * cz * 0.42 + uTime * 0.006, cz * 0.62);
  float ripple = max(uOwn[3], 0.0), clear = max(-uOwn[3], 0.0);
  if (ripple > 0.0) cq *= 1.0 + vec2(0.9, 0.5) * ripple;
  float cl = fbm(cq + vec2(0.0, uTravel * 0.004));
  float under = fbm(cq + vec2(0.0, uTravel * 0.004) + vec2(-clamp((x - duSunX) * 3.0, -1.0, 1.0) * 0.05, 0.11)); // the same cloud a little nearer the sun
  float show = smoothstep(0.0, 0.03, up) * smoothstep(0.62, 0.22, up);
  if (ripple > 0.0) { // rows of small cloud up to the top of the sky
    float rows = 0.11 * sin(cq.y * 13.0 + 3.0 * noise(cq * 1.3 + 40.0) + cq.x * 1.5) * noise(cq * 0.8 + 70.0);
    cl += ripple * (rows + 0.07); under += ripple * (0.07 - 0.6 * rows);
    show = mix(show, smoothstep(0.0, 0.03, up), ripple);
  }
  float body = smoothstep(0.52, 0.76, cl) * show;
  body *= 1.0 - clear;
  float edge = sat((cl - under) * 7.0 + 0.2) * smoothstep(0.44, 0.6, cl) * show * (1.0 - clear); // the side of a cloud turned to the sun
  float dxs = x - duSunX;
  float lit = exp(-dxs * dxs * 1.3) * exp(-up * 5.5);
  col *= 1.0 - (0.8 - 0.5 * pale) * body;
  if (ripple > 0.0) col += ripple * edge * (duAir(x, up * 0.6) * 1.4 + duCol[1] * (0.02 + 0.2 * duLv[1])) * (1.0 - 0.7 * pale);
  col += (duDyed(vec3(1.0, 0.33, 0.2)) * (0.1 + 1.6 * uLow) * lit + flareCol * flare * exp(-up * 14.0) * 1.2) * edge;
  // stars where the sky is dark
  col += vec3(0.7, 0.8, 1.0) * duStars(vec2(x, up) * rot(0.2)) * smoothstep(0.3, 0.6, up) * (1.0 - body) * (1.0 - wet) * 0.8;
  if (clear > 0.0) {
    vec2 s = vec2(x, up);
    float lane2 = exp(-pow((x * 0.75 - up + 0.12 + 0.1 * noise(s * 4.0 + 20.0)) * 5.0, 2.0));
    col += clear * vec3(0.75, 0.82, 1.0) * (duStars(s * rot(0.5)) * 1.3 + duStars(s * 1.9 + 7.0) * (0.5 + 2.2 * lane2) + duStars(s * 3.1 + 19.0) * 1.6 * lane2 + 0.02 * lane2 * fbm(s * 5.0 + 30.0)) * smoothstep(0.0, 0.3, up) * (1.0 - 0.5 * wet) * (1.0 - pale) * (1.0 - duCover);
  }
  // the sun's road on the water: short bright dashes that thin out toward the eye
  float road = exp(-pow((x - duSunX) / (0.05 + 0.5 * d), 2.0)) * wet;
  float dash = smoothstep(0.62, 0.8, noise(vec2(x * 14.0 * pz * 0.12 + 5.0, pz * 9.0 - uTime * 0.2)));
  col += duDyed(vec3(1.0, 0.55, 0.25)) * road * dash * (0.1 + 1.2 * uLow) * exp(-d * 5.0) * (1.0 + 2.0 * duDisc);
  // the water takes less than the sky gives, and less still close by
  col *= mix(1.0, (0.78 - 1.0 * d) * mix(0.5, 1.0, glass), wet);
  if (rough > 0.0 && wet > 0.5) col *= mix(1.0, (0.2 + 2.3 * face * face), rough);
  if (uOwn[7] > 0.0 && uVar < 0.5) col += uOwn[7] * duLanterns(x + wet * 0.03 * (lane - 0.5), d) * mix(1.0, 0.4, wet) * (1.0 - 0.5 * pale);
  if (uOwn[7] < 0.0 && uVar < 0.5) { // rain
    vec2 r = vec2(x + up * 0.28, up);
    float shaft = smoothstep(0.3, 0.75, noise(vec2(r.x * 4.0 + 50.0 - uTime * 0.02, r.y * 0.7 + 9.0)) * 0.7 + 0.3 * noise(vec2(r.x * 17.0 + 30.0 - uTime * 0.03, r.y * 1.1)));
    float fine = noise(vec2(r.x * 150.0 + 300.0, r.y * 5.0 + 40.0 + mod(uTime * 1.6, 512.0)));
    col *= 1.0 + uOwn[7] * 0.85 * shaft * smoothstep(0.75, 0.1, up);
    col += -uOwn[7] * (duAir(x, 0.05) * 0.5 + 0.01) * (1.0 - shaft) * (0.25 + 0.5 * fine) * smoothstep(0.5, 0.0, up);
  }
  if (uOwn[2] > 0.0) { // the tops of cloud, from above
    float z = 1.0 / (d + 0.06);
    vec2 c = vec2(x * z * 0.8 + 30.0, z * 1.0 + 20.0 + uTravel * 0.006), to = vec2(-clamp((x - duSunX) * 2.0, -1.0, 1.0) * 0.12, 0.2);
    float n1 = fbm(c), n2 = fbm(c + to), lit = sat(0.45 + (n1 - n2) * 5.0), hump = 0.02 + 0.05 * (noise(vec2(x * 5.0 + 9.0, 2.0)) * 0.6 + noise(vec2(x * 13.0, 6.0)) * 0.3 + noise(vec2(x * 31.0, 7.0)) * 0.12) ;
    vec3 far = duAir(x, 0.02) + duSun(x, 0.03) * 0.35 + duCol[1] * (0.02 + 0.2 * duLv[1]), low = duCol[3] * (0.03 + 0.16 * duLv[3]) + duCol[2] * (0.02 + 0.14 * duLv[2]);
    if (pale > 0.0) { far = mix(far, duPale(far, 0.0), pale); low = mix(low, duPale(low, 0.4) * 0.3, pale); }
    far = mix(far + (1.0 - pale) * 0.5 * flare * flareCol, far * (0.2 + 0.6 * flareCol), 0.75 * pale * flare);
    vec3 top = mix(low, far * (0.75 + 0.5 * uLevel), lit * lit * (0.3 + 0.7 * exp(-d * 2.5))) * (0.25 + 1.2 * n1);
    col = mix(col, mix(top, far, exp(-d * 22.0) * 0.8), uOwn[2] * smoothstep(hump * 0.3 + 0.004, hump * 0.3 - 0.004, e));
  }
  // the far shore, and a little mist lying on the water before it
  float hill = 0.004 + 0.016 * noise(vec2(x * 2.3 + 4.0, 0.5)) * noise(vec2(x * 7.0 + 1.0, 3.5)) + 0.006 * noise(vec2(x * 31.0, 7.5));
  if (uOwn[2] > 0.0) hill = mix(hill, -0.02, uOwn[2]);
  col *= mix(1.0, 0.04, smoothstep(hill + 0.002, hill - 0.002, e) * smoothstep(-hill * 0.5 - 0.004, -hill * 0.5, e) * step(0.0, hill));
  col += duCol[0] * (0.02 + 0.25 * duLv[0]) * exp(-pow((e + 0.012) / 0.006, 2.0)) * exp(-pow((x - duSunX) * 1.2, 2.0));
  if (uOwn[1] > 0.0) col = duRidges(col, x, e, uOwn[1], pale);
  return col;
}
vec3 render(vec2 p) {
  vec2 at = p, middle = p;
  float dots = max(-uOwn[6], 0.0);
  if (dots > 0.0) { // each dot is of one place
    vec2 g = p * 44.0; g.x += 0.5 * mod(floor(g.y), 2.0);
    middle = floor(g) + 0.5; middle.x -= 0.5 * mod(floor(g.y), 2.0); middle /= 44.0;
    p = mix(p, middle, dots);
  }
  duLv[0] = uTexture; duLv[1] = uPhrase; duLv[2] = uPad; duLv[3] = uDrone;
  vec3 amber = uKind[2], violet = uKind[1], teal = uKind[0];
  duCol[0] = max(hueShift(max(mix(vec3(dot(amber, vec3(0.333))), amber, 1.9), 0.0), -0.03), 0.0) * vec3(1.25, 0.9, 0.7);
  duCol[1] = vec3(1.0, 0.2, 0.34); // the phrase is the rose between the amber and the violet
  duCol[2] = max(hueShift(max(mix(vec3(dot(violet, vec3(0.333))), violet, 1.9), 0.0), 0.025), 0.0) * vec3(0.85, 0.7, 0.95);
  duCol[3] = max(hueShift(max(mix(vec3(dot(teal, vec3(0.333))), teal, 2.0), 0.0), 0.045), 0.0) * 0.8;
  if (uOwn[5] > 0.0) {
    duCol[0] = mix(duCol[0], uKind[2] * uKind[2] * 1.2, uOwn[5]); duCol[1] = mix(duCol[1], uKind[3] * uKind[3] * 1.1, uOwn[5]);
    duCol[2] = mix(duCol[2], uKind[1] * uKind[1], uOwn[5]); duCol[3] = mix(duCol[3], uKind[0] * uKind[0], uOwn[5]);
  }
  duSunX = 0.16 + 0.1 * sin(uTime * 0.021);
  vec3 col;
  if (uVar < 0.5) {
    duSunE = -0.03; duDisc = 0.0;
    if (uOwn[0] > 0.0) { duSunE += 0.21 * uOwn[0]; duDisc = uOwn[0]; duSunX -= 0.14 * uOwn[0]; }
    if (uOwn[0] < 0.0) duSunE -= 0.36 * uOwn[0];
    col = duView(p, -0.2);
  } else {
    // ribbed glass: each rib is a long lens that turns its strip of the view about and slips it sideways
    duSunE = 0.13 - 0.14 * min(uOwn[0], 0.0); duDisc = 1.0 + min(uOwn[0], 0.0); duSunX = -0.1 + 0.1 * sin(uTime * 0.021);
    vec2 dir = vec2(cos(0.3), sin(0.3));
    float n = 15.0, lens = max(uOwn[7], 0.0);
    if (uOwn[7] < 0.0) n *= exp2(1.7 * uOwn[7]);
    float u = dot(p, dir) * n + uTime * 0.02;
    float id = floor(u), f = fract(u) - 0.5;
    float bend = f * (2.4 + 0.6 * sin(id * 1.7)) + 0.35 * sin(id * 2.4 + uTime * 0.11);
    vec2 q = p - dir * bend / n * 1.0;
    float round_ = sqrt(max(1.0 - 4.0 * f * f, 0.0)), rib = 1.0;
    if (lens > 0.0) { // a pane of round lenses, each with the whole view small and upside down in it
      vec2 g = p * 7.0 + vec2(0.02 * uTime, 60.0); g.x += 0.5 * mod(floor(g.y), 2.0);
      vec2 c = fract(g) - 0.5;
      float r = length(c), glass = sqrt(max(1.0 - 4.2 * r * r, 0.0));
      q = mix(q, p * 0.8 - c * (0.42 + 1.1 * r * r), lens);
      round_ = mix(round_, (0.2 + 1.15 * glass) * (0.06 + 0.94 * smoothstep(0.49, 0.45, r)) - 1.12 * (1.0 - smoothstep(0.49, 0.45, r)), lens); rib = 1.0 - lens;
    }
    col = duView(q * 0.92, -0.17);
    col *= 0.62 + 0.5 * round_;
    if (lens > 0.0) { vec2 c = vec2(p.x * 7.0 + 0.02 * uTime, p.y * 7.0 + 60.0); c.x += 0.5 * mod(floor(c.y), 2.0); col *= 1.0 - 0.9 * lens * smoothstep(0.44, 0.48, length(fract(c) - 0.5)); }
    col += col * 1.4 * smoothstep(0.1, 0.0, abs(f - 0.3)) * 0.35 * rib; // a line of shine down each rib
    col += vec3(0.02, 0.025, 0.035) * smoothstep(0.06, 0.0, abs(f + 0.36)) * (0.3 + uLevel) * rib;
  }
  if (uOwn[1] < 0.0) {
    vec2 r = duReeds(at);
    col *= 1.0 + uOwn[1] * 0.965 * r.x;
    col += -uOwn[1] * r.y * r.x * (duAir(p.x, 0.04) * 0.025 + duCol[0] * 0.015 * duLv[0]);
  }
  if (dots > 0.0) {
    float l = sqrt(sat(dot(col, vec3(0.35, 0.45, 0.2)))), w = fwidth(at.y) * 44.0;
    col *= mix(1.0, 1.5 * smoothstep(w, -w, length((at - middle) * 44.0) - 0.12 - 0.4 * l) + 0.02, dots);
  }
  col *= 1.0 - 0.3 * dot(p, p);
  // to the screen with the weight of film: colours stay deep, darks stay down
  vec3 c = screenOf(col);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.3));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.6);
}
