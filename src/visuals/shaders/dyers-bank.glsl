// name: Dyer's bank
// a: Cloth on sand
// b: Vat yard
// what: Long strips of dyed cloth pegged out to dry on a pale river bank in low sun, one held up by the wind with its shadow under it, a bolt still rolled, someone walking by with the next bundle; or a yard of stone vats of dye seen from a roof, most of it in blue shade, one bar of sun crossing it.
// follows: Each kind of sound dyes its own cloths or vats, deeper and wetter as it plays, and the piece deepens them along their length or across the yard. Low lifts the wind's wave; the bands fill the vats. A hit is a flap along one cloth, or a drop in two vats; a cue rolls out the bolt, or sends rings through the big vats. Keys glint on water.
// own: 0 grey flat light at -1 with the whole yard in it, red evening at 1; 1 dark mud or earth-red walls at -1, a green meadow or blue walls at 1; 2 few broad cloths or great vats at -1, many narrow or small at 1; 3 seen from high up at -1, from low down at 1; 4 all blues at -1, reds and yellows at 1; 5 no wind or vats nearly empty at -1, all the cloths in the wind or vats brimming and the paving wet at 1; 6 night, with the cloths or the dyes giving off a light of their own, at -1, snow lying at 1; 7 the river up over the bank and the cloths streaming in it, or pools sunk in the ground, at -1, the cloths spotted and barred and running straight away from us, or all the vats alike in straight rows, at 1
const float DYF = 1.3;  // the lens
#define DY_NIGHT max(-uOwn[6], 0.0)
#define DY_SNOW max(uOwn[6], 0.0)
#define DY_WET max(-uOwn[7], 0.0)
#define DY_ROWS max(uOwn[7], 0.0)
float dyFine;  // how small a pixel is on the cloth
float dyH, dyHz, dySp;  // the eye's height, where the horizon lies, how far apart the strips are
vec3 dySun, dySunCol, dyAmb;  // where the sun is, its colour, the colour of the shade
vec2 dyCast;  // across the ground towards the sun, for each metre of height
float dyLv(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : 0.6 * uHits; }
float dyOff(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); }  // 1 up to b, gone at a
float dyBump(float x) { return 4.0 * x * (1.0 - x); }
vec3 dyShown(vec3 c) { return pow(1.0 - exp(-1.5 * max(c, 0.0)), vec3(0.4545)); }
float dySeg(vec2 q, vec2 a, vec2 b) {
  vec2 v = b - a;
  return length(q - a - v * sat(dot(q - a, v) / max(dot(v, v), 1e-5)));
}
// The dye of a kind of sound, as cloth shows it.
vec3 dyDye(int k) {
  vec3 c = k == 0 ? vec3(0.012, 0.05, 0.2) : k == 1 ? vec3(0.16, 0.03, 0.13) : k == 2 ? vec3(0.72, 0.36, 0.035)
         : k == 3 ? vec3(0.06, 0.2, 0.085) : vec3(0.46, 0.04, 0.022);
  c = mix(c, pow(uKind[k], vec3(2.4)) * 0.8, 0.3);
  float f = float(k) * 0.25;
  c = mix(c, mix(vec3(0.006, 0.02, 0.11), vec3(0.1, 0.32, 0.55), fract(f * 1.7 + 0.1)), 0.9 * sat(-uOwn[4]));
  return mix(c, mix(vec3(0.5, 0.02, 0.012), vec3(0.85, 0.33, 0.02), fract(f * 1.7 + 0.1)), 0.9 * sat(uOwn[4]));
}
// Sun and shade by the hour.
void dyHour(vec3 sun) {
  float grey = sat(-uOwn[0]), eve = sat(uOwn[0]);
  sun.y *= mix(1.0, 0.6, eve) * mix(1.0, 1.5, grey);
  dySun = normalize(sun);
  dyCast = dySun.xz / dySun.y;
  dySunCol = mix(vec3(2.75, 2.2, 1.5), vec3(2.6, 1.12, 0.42), eve) * mix(1.0, 0.22, grey) * (0.93 + 0.07 * uTone + 0.06 * uLevel);
  dyAmb = mix(mix(vec3(0.17, 0.25, 0.39), vec3(0.085, 0.125, 0.29), eve), vec3(0.45, 0.51, 0.59), grey);
  dySunCol = mix(dySunCol, vec3(0.1, 0.15, 0.26) * (1.0 - 0.5 * grey), DY_NIGHT);
  dyAmb = mix(dyAmb, vec3(0.018, 0.028, 0.062), DY_NIGHT);
}
// A person, feet at 0, in metres; returns colour and distance. load is 1 with a bundle on the head.
vec4 dyPerson(vec2 q, float stride, vec3 wrap, vec3 bundle, float load) {
  vec3 skin = vec3(0.1, 0.055, 0.035);
  float sw = 0.12 * stride;
  float legs = min(dySeg(q, vec2(-0.05, 0.7), vec2(-0.09 - sw, 0.07)), dySeg(q, vec2(0.05, 0.7), vec2(0.09 + sw, 0.07))) - 0.065;
  vec4 r = vec4(skin, legs);
  float hem = dySeg(q, vec2(0.0, 0.45), vec2(0.0, 0.95)) - 0.24 + 0.1 * q.y;
  if (hem < r.w) r = vec4(wrap, hem);
  float body = dySeg(q, vec2(0.0, 0.98), vec2(0.0, 1.27)) - 0.155;
  if (body < r.w) r = vec4(mix(skin, wrap, 0.75), body);
  vec2 m = vec2(abs(q.x), q.y);
  vec2 elbow = mix(vec2(0.27, 0.98), vec2(0.34, 1.5), load), hand = mix(vec2(0.2, 0.75), vec2(0.2, 1.75), load);
  float arm = min(dySeg(m, vec2(0.17, 1.3), elbow), dySeg(m, elbow, hand)) - 0.05;
  if (arm < r.w) r = vec4(skin, arm);
  float head = length((q - vec2(0.0, 1.57)) * vec2(1.1, 0.9)) - 0.115;
  if (head < r.w) r = vec4(skin * 0.7, head);
  float pack = dySeg(q, vec2(-0.4, 1.84), vec2(0.4, 1.88)) - 0.17 * load;
  if (load > 0.01 && pack < r.w) r = vec4(bundle * (0.75 + 0.35 * sin(q.x * 22.0 + 4.0 * q.y)), pack);
  r.rgb *= 0.55 + 0.75 * smoothstep(-0.16, 0.16, q.x);
  return r;
}

// The person on the spot foot, at height h, with the shadow.
void dyStand(inout vec3 col, vec2 p, vec2 foot, float h, float stride, vec3 wrap, vec3 bundle, float load, float sun) {
  float k = DYF / foot.y, w = 1.0 / (uRes.y * k);
  vec2 d = vec2(p.x / DYF, 1.0) * (dyH - h) * DYF / max(dyHz - p.y, 0.01) - foot;
  vec2 q = vec2(d.x - dyCast.x * d.y / dyCast.y, -d.y / dyCast.y);
  if (abs(q.x) < 0.8 && abs(q.y - 1.0) < 1.2) col *= 1.0 - 0.8 * sun * dyOff(0.03 + w, -0.03 - w, dyPerson(q, stride, wrap, bundle, load).w);
  q = (p - vec2(0.0, dyHz)) / k - vec2(foot.x, h - dyH);
  if (abs(q.x) < 0.8 && abs(q.y - 1.0) < 1.2) {
    vec4 m = dyPerson(q, stride, wrap, bundle, load);
    col = mix(col, m.rgb * (dySunCol * 0.55 * sun + dyAmb), dyOff(w, -w, m.w));
  }
}

// ---- a: cloth on sand
float dyLane(float i, float z) {
  float h = hash11(i + 3.7);
  float x = (i + 5.0 + 0.22 * (h - 0.5)) * dySp - mix(11.0, 4.5 * dySp, DY_ROWS) + 0.5 * (1.0 - DY_ROWS) * z + (fract(h * 17.3) - 0.5) * 0.05 * (z - 20.0) + 0.2 * sin(z * 0.15 + h * 20.0);
  if (uOwn[7] < 0.0) x += DY_WET * (0.3 * sin(z * 0.42 - uTime * 0.5 + h * 9.0) + 0.14 * sin(z * 0.97 - uTime * 0.8 + h * 31.0)) * sat((z - 6.0) * 0.08);
  return x;
}
// Where strip i begins and ends, and how wide it is.
vec3 dyReach(float i) {
  float h = hash11(i + 4.4);
  vec3 r = vec3(h < 0.75 ? 2.0 : 13.0 + 5.0 * fract(h * 7.3), 33.0 + 12.0 * fract(h * 13.7), 0.8 + 0.2 * fract(h * 23.1));
  if (abs(i + 3.0) < 0.5) r.x = 14.2 - 3.0 * dyBump(uCue);  // the bolt that a cue rolls out
  if (abs(i + 1.0) < 1.5 || i < -3.5) r.x = 2.0;
  return r;
}
// The wind under strip i: how high, where, over what length.
vec3 dyWind(float i) {
  float main = abs(i + 2.0) < 0.5 ? 1.0 : 0.0, h = hash11(i + 5.3), run = fract(uTravel * 0.009 + (main > 0.5 ? 0.14 : h));
  float a = mix(0.04 + 0.1 * uLow + 0.75 * sat(uOwn[5]), 0.55 + 0.4 * uLow, main) * smoothstep(0.0, 0.1, run) * dyOff(1.0, 0.85, run);
  return vec3(a * (1.0 - sat(-uOwn[5])) * (1.0 - DY_WET), mix(11.0, 34.0, run), 1.7 + 0.6 * h);
}
// How high that is at z, and how steeply it climbs there; a hit is a flap that runs away from us along strip 0.
vec2 dyLift(vec3 w, float i, float z) {
  float x = (z - w.y) / w.z, e = w.x * exp(-x * x);
  vec2 r = vec2(e, -2.0 * x * e / w.z);
  if (abs(i) < 0.5) {
    x = (z - 13.0 - 6.0 * (1.0 - uHits)) / 1.1; e = 0.8 * dyBump(uHits) * exp(-x * x);
    r += vec2(e, -2.0 * x * e / 1.1);
  }
  return r;
}
int dyKindOf(float i) { return int(mod(i * 2.0 + 20.0, 5.0)); }
// The relief of a strip: long soft folds, and puckers across.
float dyFold(vec2 q) { return 0.36 * noise(vec2(q.x * 4.0, q.y * 0.35)) + 0.26 * noise(vec2(q.x * 2.4 + q.y, q.y * 1.4)); }
vec3 dyCloth(float i, float u, float z, float y, float slope, float sh) {
  int k = dyKindOf(i);
  float h = hash11(i + 1.9), h2 = hash11(i + 6.4);
  float lv = dyLv(k), along = sat((z - 9.0) / 34.0);
  vec4 m = piece(vec2(along, sat((i + 5.5) / 15.0)));
  // two dyes, one running into the other where the dipping stopped
  vec3 deep = dyDye(k);
  vec3 pale = h2 < 0.5 ? vec3(0.84, 0.79, 0.68) : h2 < 0.75 ? vec3(0.8, 0.62, 0.3) : vec3(0.76, 0.45, 0.36);
  if (m.a > 0.004) deep = mix(deep, pow(m.rgb / m.a, vec3(2.6)) * 0.6, 0.18 * sat(m.a));
  float at = 0.2 + 0.45 * h, wide = 0.1 + 0.22 * h2;
  float g = smoothstep(at - wide, at + wide, along);
  if (h > 0.5) g = 1.0 - g;
  g *= 1.0 - 0.5 * sat(m.a) * (0.5 + uEnergy) - 0.2 * lv;
  vec3 c = exp(mix(log(deep + 0.004), log(pale), g));
  if (uOwn[7] > 0.5) {  // the undyed ground left in: spots, bars, lozenges, a border
    float hp = fract(h * 47.3), mz = z * 1.25, n = 0.0, e = 0.05 + dyFine * 2.5;
    vec2 q = vec2(u * 1.5, mz);
    if (hp < 0.3) { q.x += 0.5 * mod(floor(q.y * 2.0), 2.0); n = dyOff(0.26 + e, 0.26 - e, length(vec2(fract(q.x) - 0.5, fract(q.y * 2.0) - 0.5))); }
    else if (hp < 0.55) n = dyOff(0.16 + e, 0.16 - e, abs(fract(mz * (0.6 + h2)) - 0.5)) * 0.9;
    else if (hp < 0.8) n = dyOff(0.3 + e, 0.3 - e, abs(u) * 0.5 + abs(fract(mz * 0.8) - 0.5));
    else n = max(dyOff(0.12 + e, 0.12 - e, abs(abs(u) - 0.62)), dyOff(0.1 + e, 0.1 - e, abs(u)));
    c = mix(c, vec3(0.8, 0.76, 0.66), n * sat(2.0 * DY_ROWS - 1.0) * 0.92 * (1.0 - smoothstep(0.05, 0.22, dyFine)));
  }
  // wet in the middle, dry from the edges in
  float soak = 0.1 + 0.3 * lv + 0.15 * uLevel + 0.3 * sat(m.a) + 0.1 * sin(uTime * 0.05 + h * 30.0) + 0.25 * (hash11(i + 2.2) - 0.5);
  float wn = noise(vec2(u * 0.8 + i * 3.0, z * 0.16 + i)) + 0.05 * noise(vec2(u * 3.0, z * 0.9 + i));
  float wet = smoothstep(0.0, 0.07, soak - 0.4 * u * u - wn + 0.4);
  c = mix(c, c * (0.35 + 0.5 * c), wet * 0.8);
  // low light over the folds
  vec2 q = vec2(u * 0.7 + i * 11.0, z);
  float rel = dyFold(q + vec2(0.13, 0.05)) - dyFold(q);
  float lit = sat(dySun.y - 0.4 * rel - dySun.z * slope);
  float thin = sat(slope) * sat(y * 2.0);  // the sun through the cloth
  vec3 o = c * (dySunCol * (lit * (1.0 - sh) + 0.35 * thin) + dyAmb * (1.0 - 0.3 * rel));
  if (abs(i + 3.0) < 0.5) o *= 1.0 + 1.2 * uCue;
  if (uOwn[6] < 0.0) o += DY_NIGHT * (deep + 0.015 * sqrt(deep)) * (0.4 + 1.5 * lv + 1.4 * sat(m.a) + 0.4 * uLevel) * (1.0 - 0.75 * g) * (1.0 - 0.35 * u * u) * (1.0 - 0.6 * rel);
  float f = z - 19.0 + 6.0 * uHits;
  if (abs(i) < 0.5) o += (c + 0.05) * dySunCol * 0.6 * uHits * exp(-0.44 * f * f);
  return o;
}
vec3 dyGround(vec2 g, float gpz) {
  float big = noise(g * 0.3), soft = noise(g * vec2(1.3, 3.0) + 2.0 * big), e = noise(g * vec2(1.3, 3.0) + 2.0 * big + 0.22);
  vec3 c = mix(vec3(0.66, 0.54, 0.385), vec3(0.15, 0.12, 0.1), sat(-uOwn[1]));
  if (uOwn[1] > 0.0) c = mix(c, mix(vec3(0.08, 0.14, 0.03), vec3(0.2, 0.26, 0.07), noise(g * vec2(5.0, 2.5))), sat(uOwn[1]) * 0.92);
  if (uOwn[6] > 0.0) { c = mix(c, vec3(0.8, 0.84, 0.9), DY_SNOW * smoothstep(0.2, 0.5, 0.6 * soft + 0.35 * big + 0.55 * DY_SNOW - 0.2)); gpz += 0.05 * DY_SNOW; }
  return c * 0.95 * (1.0 + 0.45 * dyOff(0.16, 0.03, gpz) * (soft - e) + 0.5 * (big - noise(g * 0.3 + 0.35)));
}
vec3 dySand(vec2 p) {
  float high = sat(-uOwn[3]), lowv = sat(uOwn[3]), px = 1.0 / uRes.y;
  dyHour(vec3(0.84, 0.4, 0.36));
  float hard = sat(dySunCol.r * 0.5);  // how much of a shadow the light makes
  dyHz = 0.56 + 0.64 * high - 0.24 * lowv;
  dyH = 9.0 * mix(mix(1.0, 2.3, high), 0.62, lowv) * (0.97 + 0.06 * uSpace);
  dySp = 2.2 * exp2(-0.75 * uOwn[2]);
  vec3 sky = mix(dyAmb * 1.5 + 0.28 * dySunCol, dyAmb * 2.2, sat((p.y - dyHz) * 3.0 + 0.3)) + dySunCol * 0.08 * sat(p.x);
  // trees on the other bank
  float foot = dyHz - dyH * DYF / 97.0, tx = p.x * 58.0;
  float tree = foot + 0.018 + 0.03 * noise(vec2(tx * 0.09, 1.0)) + 0.016 * noise(vec2(tx * 0.6, 5.0));
  if (p.y > foot) {
    vec3 wood = DY_SNOW * 0.5 * smoothstep(0.3, 0.7, noise(vec2(tx * 0.7, p.y * 90.0))) * (dyAmb + 0.2 * dySunCol) + mix(vec3(0.02, 0.05, 0.04) * (dyAmb * 2.0 + dySunCol * (0.2 + 0.8 * noise(vec2(tx * 0.5, p.y * 60.0)))), sky, 0.07);
    return dyShown(mix(sky, wood, dyOff(px, -px, p.y - tree)));
  }
  float z0 = dyH * DYF / max(dyHz - p.y, 0.01);
  vec2 g = vec2(p.x * z0 / DYF, z0);
  float gp = px * z0 / DYF, gpz = gp * z0 / dyH;  // a pixel on the ground
  dyFine = gpz * 0.5;
  float i0 = floor((g.x - 0.5 * (1.0 - DY_ROWS) * g.y + mix(11.0, 4.5 * dySp, DY_ROWS)) / dySp - 4.5), hw0 = 0.31 * dySp;
  // what the wind holds up: its shadow, the cloth itself, the pegs
  float sh = 0.0, thin = 0.0, cover = 0.0, peg = 9.0, pegSh = 9.0;
  float at = 0.0, u = 0.0, z = 0.0, y = 0.0, slope = 0.0;
  for (int j = -1; j <= 2; j++) {
    float i = i0 + float(j);
    if (i < -5.5 - floor(10.0 * DY_ROWS) || i > 18.5) continue;
    vec3 wd = dyWind(i), r = dyReach(i);
    float hg = dyLift(wd, i, g.y).x;
    vec2 q = g + dyCast * hg;
    float w = hw0 * r.z, s = 0.03 + 0.12 * hg;
    sh = max(sh, dyOff(s, -s, abs(q.x - dyLane(i, q.y)) - w) * smoothstep(0.02, 0.1, hg) * smoothstep(0.0, 0.2, q.y - r.x));
    // where the eye's line meets the cloth
    float zc = g.y, prev = -1.0, zp = zc;
    for (int n = 4; n >= 0; n--) {
      float yn = 0.33 * float(n), zn = g.y * (1.0 - yn / dyH), f = dyLift(wd, i, zn).x - yn;
      if (f >= 0.0) { zc = mix(zn, zp, n < 4 ? f / max(f - prev, 1e-4) : 0.0); break; }
      prev = f; zp = zn;
    }
    vec2 l = dyLift(wd, i, zc);
    float off = g.x * zc / g.y - dyLane(i, zc), pz = zc * 0.4 + r.z * 7.0, flat_ = 1.0 - smoothstep(0.02, 0.12, l.x);
    w *= 1.0 - 0.06 * abs(sin(PI * pz));
    float run = smoothstep(-gpz, gpz, zc - r.x) * dyOff(gpz, -gpz, zc - r.y), c = run * dyOff(gp, -gp, abs(off) - w);
    if (c > 0.0 && c >= cover) { cover = c; at = i; u = off / w; z = zc; y = l.x; slope = l.y; }
    thin = max(thin, run * flat_ * dyOff(0.14 + gp, 0.0, abs(off + w + 0.05)));
    if (run * flat_ > 0.5 && gp < 0.045) {
      vec2 pq = vec2(off - (off < 0.0 ? -w - 0.03 : w + 0.03), (fract(pz + 0.5) - 0.5) / 0.4);
      peg = min(peg, dySeg(pq, vec2(0.0), vec2(g.x - 0.5 * g.y, g.y) * 0.27 / dyH) - 0.038);
      pegSh = min(pegSh, dySeg(pq, vec2(0.0), vec2(0.5 * dyCast.y - dyCast.x, -dyCast.y) * 0.25) - 0.03);
    }
  }
  // sand, darker where the river wets it
  float edge = 48.0 + 5.0 * sin(g.x * 0.055 + 0.6) + 1.6 * sin(g.x * 0.21), toW = edge - g.y;
  vec3 col = dyGround(g, gpz) * mix(0.45, 1.0, smoothstep(-0.5, 4.5, toW + 1.5 * noise(g * 0.5)));
  col *= dySunCol * dySun.y * (1.0 - 0.95 * sh) + dyAmb;
  // the river
  float rip = noise(vec2(g.x * 0.5, g.y * 0.9) + 6.0 * sin(uTime * vec2(0.013, 0.042))) + 0.6 * noise(vec2(g.x * 1.4, g.y * 2.4) - 8.0 * sin(uTime * 0.037 + 1.0));
  vec3 river = mix(vec3(0.03, 0.1, 0.14), sky * vec3(0.7, 0.85, 1.0), sat(0.05 + 0.4 * rip + 0.3 * smoothstep(0.0, 40.0, -toW)));
  river += dySunCol * (0.4 + 0.5 * uHigh + uKeys) * smoothstep(0.95, 1.5, rip) * sat(0.4 + p.x);
  col = mix(col, river, dyOff(0.0, -0.25 - gpz * 0.5, toW));
  if (uOwn[7] < 0.0) {  // the river up over the bank: stones under it, light drawn on them, the sky on top
    vec2 wq = g + 0.5 * vec2(sin(g.y * 0.7 + uTime * 0.4), sin(g.x * 0.9 - uTime * 0.33));
    float ca = 1.0 - abs(2.0 * noise(wq * 0.9 + uTime * vec2(0.05, 0.11)) - 1.0), cb = 1.0 - abs(2.0 * noise(wq * 1.4 - uTime * 0.09) - 1.0), st = noise(g * 2.6);
    vec3 bed = dyGround(g, gpz) * mix(vec3(0.2, 0.36, 0.36), vec3(0.4, 0.5, 0.42), st) * (dySunCol * dySun.y * (0.55 + 1.3 * pow(sat(ca * cb), 6.0) * dyOff(0.5, 0.1, gpz)) + dyAmb);
    col = mix(col, mix(bed, mix(river, sky * vec3(0.5, 0.68, 0.75), 0.55), smoothstep(10.0, 60.0, g.y)), sat(1.6 * DY_WET) * step(0.0, toW));
    thin *= 1.0 - DY_WET; sh *= 1.0 - 0.7 * DY_WET; peg += 9.0 * step(0.5, DY_WET); pegSh += 9.0 * DY_WET;
  }
  // the cloths on it
  col *= (1.0 - 0.6 * hard * thin) * (1.0 - 0.7 * hard * dyOff(gp, -gp, pegSh));
  col = mix(col, dyCloth(at, u, z, y, slope, sh * dyOff(0.35, 0.05, y)), cover);
  if (uOwn[7] < 0.0) {  // and over the cloth the same water
    float far = smoothstep(5.0, 50.0, g.y), line = smoothstep(1.0, 1.4, rip + 0.3 * noise(g * vec2(0.8, 6.0) - uTime * vec2(0.1, 0.4)));
    col = mix(col, col * vec3(0.68, 0.88, 0.9) + river * (0.04 + 0.12 * far), cover * DY_WET);
    col += DY_WET * (sky * 0.35 + dySunCol * (0.12 + 0.3 * uHigh + 0.5 * uKeys)) * line * (0.05 + 0.3 * far);
  }
  col = mix(col, vec3(0.12, 0.065, 0.035) * (dySunCol * 0.6 + dyAmb), dyOff(gp, -gp, peg));
  // the bolt that a cue rolls out, across its strip
  vec3 r = dyReach(-3.0);
  float rad = 0.3, w = hw0 * r.z * 1.05;
  vec2 bq = vec2(g.x - dyLane(-3.0, r.x), (g.y - r.x) * dyH / g.y - rad);
  col *= 1.0 - 0.75 * hard * dyOff(0.1, -0.1, abs(bq.x + 0.5) - w - 0.3) * dyOff(0.1, -0.1, abs(bq.y + rad + 0.06) - 0.15);
  float turn = bq.y / rad;
  vec3 bc = (dyDye(dyKindOf(-3.0)) + 0.01) * (1.0 + 1.2 * uCue);
  bc *= dySunCol * (0.2 + 0.6 * sat(0.4 + 0.6 * turn)) * (0.88 + 0.12 * sin(turn * 15.0 + 2.0 * noise(bq * 3.0))) + dyAmb * 0.8;
  float endR = length(vec2((bq.x - w) * 2.2, bq.y)) / rad;
  bc = mix(bc, (vec3(0.5, 0.42, 0.3) + 0.2 * sin(endR * 20.0)) * dySunCol * 0.5, dyOff(1.05, 0.95, endR));
  col = mix(col, bc, dyOff(gp, -gp, min(max(abs(bq.x) - w, abs(bq.y) - rad), (endR - 1.0) * rad * 0.5)));
  // the one who carries the next bundle
  float go = sin(uTime * 0.035 + 0.6), fz = 17.5 + 1.6 * go;
  dyStand(col, p, vec2(uOwn[7] > 0.0 ? mix(0.5 * fz - 14.1, dyLane(-4.5, fz), DY_ROWS) : 0.5 * fz - 14.1, fz), 0.0, sin(go * 8.0), vec3(0.75, 0.7, 0.62), dyDye(4) + 0.04, 1.0, hard);
  return dyShown(col * mix(0.84, 1.06, smoothstep(-0.9, 0.7, p.x + 0.3 * p.y)));
}

// ---- b: the vat yard
const float DYW = 23.0;  // how far off the back wall stands
const float DYT = 4.4;  // how high it is
#define DYYAW (0.3 * (1.0 - DY_ROWS))
float dyV;  // how far apart the vats are
// A vat of the slanted grid: its middle, how wide, how high its rim; one in three is big.
void dyVat(vec2 id, out vec2 c, out float R, out float h) {
  float a = hash21(id + 17.0), b = hash21(id + 41.0);
  bool big = mod(id.x - id.y + 60.0, 3.0) < 0.5;
  c = dyV * vec2(id.x + 0.5 * id.y, 0.866 * id.y) + (2.7 - dyV) * vec2(1.5, 4.33);
  if (!big) c += dyV * 0.1 * (1.0 - DY_ROWS) * (vec2(a, b) - 0.5);
  R = dyV * (big ? 0.59 + 0.05 * a : 0.33 + 0.09 * b);
  h = big ? 0.25 + 0.35 * b : 0.12 + 0.6 * a * a + 0.1 * b;
  if (uOwn[7] != 0.0) {  // all alike, or sunk
    R = mix(R, dyV * (0.43 + 0.03 * DY_WET), max(DY_ROWS, 0.6 * DY_WET));
    h = mix(h, 0.5 * DY_ROWS + 0.05 * DY_WET + (big ? 0.12 * DY_ROWS : 0.0), max(DY_ROWS, DY_WET));
  }
  c = c * rot(DYYAW) + vec2(0.3, 0.9);
  R *= dyOff(DYW - 1.0, DYW - 1.7, c.y + R);
}
// The vat of the grid nearest to a place of the yard.
vec2 dyNear(vec2 q) {
  q = (rot(DYYAW) * (q - vec2(0.3, 0.9)) - (2.7 - dyV) * vec2(1.5, 4.33)) / dyV;
  return floor(vec2(q.x - 0.577 * q.y, 1.155 * q.y) + 0.5);
}
// The bar of sun: 1 where it reaches a place at that height.
float dyBar(vec2 q, float y) {
  vec2 g = q - dyCast * y;
  float v = dot(g - vec2(0.5, 14.5), vec2(0.45, 0.893)), along = dot(g, vec2(0.893, -0.45));
  float notch = 0.7 * smoothstep(0.0, 0.1, sin(along * 0.5 + 0.6)), w = 2.2 + 14.0 * sat(-uOwn[0]) - 0.7 * sat(uOwn[0]);
  return smoothstep(-0.18, 0.18, v + w + notch) * dyOff(0.18, -0.18, v - w);
}
vec3 dyYard(vec2 p) {
  float high = sat(-uOwn[3]), lowv = sat(uOwn[3]), px = 1.0 / uRes.y, full = sat(uOwn[5]);
  dyHour(vec3(0.74, 0.8, -0.3));
  dyAmb *= mix(vec3(0.72, 0.84, 1.08), vec3(1.0), sat(-uOwn[0]));
  dyHz = 0.9 + 1.2 * high - 0.3 * lowv;
  dyH = 10.0 * mix(mix(1.0, 2.4, high), 0.74, lowv);
  dyV = 2.7 * exp2(-0.6 * uOwn[2]);
  float down = dyHz - p.y, z0 = down > 0.01 ? dyH * DYF / down : 1e4;
  vec3 plaster = mix(mix(vec3(0.64, 0.55, 0.42), vec3(0.36, 0.17, 0.085), sat(-uOwn[1])), vec3(0.2, 0.4, 0.66), 0.85 * sat(uOwn[1]));
  vec3 col = dyAmb * 2.0;
  if (z0 > DYW) {
  // the back wall: two doorways, cloths let down from the roof, a ladder
    float w = px * DYW / DYF;
    vec2 q = vec2(p.x * DYW / DYF, dyH - down * DYW / DYF);
    vec3 alb = plaster * (0.7 + 0.3 * noise(q * 1.3) + 0.12 * noise(q * vec2(5.0, 2.0)));
    alb *= mix(1.0, 0.07, dyOff(w, -w, dySeg(vec2(abs(q.x - 3.9), q.y), vec2(5.5, 0.0), vec2(5.5, 1.5)) - 0.6));
    for (int n = 0; n < 6; n++) {
      float fn = float(n), h = hash11(fn + 2.0), cx = -10.2 + 3.4 * fn + 1.2 * h + (n == 2 ? 2.4 : 0.0), wide = 0.55 + 0.3 * h;
      float foot = 0.7 + 1.1 * hash11(fn + 6.0) - (n == 4 ? 0.9 * dyBump(uCue) : 0.0);
      float ux = (q.x - cx - 0.03 * sin(uTime * 0.6 + fn * 2.0) * (DYT - q.y)) / wide;
      float on = dyOff(w, -w, max((abs(ux) - 1.0) * wide, foot - q.y));
      int k = int(mod(fn * 2.0, 5.0));
      vec3 cl = mix(vec3(0.7, 0.66, 0.56), dyDye(k), dyOff(0.9, -0.1, (q.y - foot) / DYT + 0.2 * h - 0.25 * dyLv(k)));
      alb = mix(alb, cl * (0.8 + 0.25 * sin(ux * 5.0 + fn * 3.0)), on);
    }
    float lx = abs(q.x - 5.6 - 0.16 * q.y), rungs = abs(fract(q.y * 2.4) - 0.5) / 2.4 - 0.035;
    alb = mix(alb, vec3(0.16, 0.1, 0.055), dyOff(w, -w, max(min(abs(lx - 0.3) - 0.045, max(rungs, lx - 0.3)), q.y - 3.9)));
    vec3 c = alb * (dySunCol * 0.45 * dyBar(vec2(q.x, DYW), q.y) + dyAmb * (0.35 + 0.65 * smoothstep(0.0, 1.6, q.y)));
    col = mix(col, c, dyOff(w, -w, q.y - DYT));
  } else {
    vec2 g = vec2(p.x * z0 / DYF, z0), at = g * (1.0 - 0.3 / dyH), id0 = dyNear(at), id = vec2(-99.0), c = vec2(0.0);
    float gp = px * z0 / DYF, rough = 0.12 * (noise(at * 1.1) - 0.5) + 0.035 * (noise(at * 5.0) - 0.5);
    if (uOwn[7] != 0.0) rough = rough * (1.0 - 0.8 * DY_ROWS) + dyV * DY_WET * (0.3 * (noise(at * 2.0 / dyV) - 0.5) + 0.14 * (noise(at * 5.0 / dyV) - 0.5));
  // the vat that stands here, if one does: the far ones first
    vec3 glow = vec3(0.0);
    float shut = 9.0, cov = 0.0, R = 0.0, h = 0.0;
    for (int j = 1; j >= -1; j--) for (int i = 1; i >= -1; i--) {
      vec2 c1; float R1, h1;
      dyVat(id0 + vec2(float(i), float(j)), c1, R1, h1);
      shut = min(shut, length(g - c1) - R1);
      float a = R1 < 0.1 ? 0.0 : dyOff(gp, -gp, dySeg(c1, g * (1.0 - h1 / dyH), g) - R1 - rough);
      if (a > 0.0) { id = id0 + vec2(float(i), float(j)); c = c1; R = R1; h = h1; cov = a; }
    }
  // the paving between, stained and wet
    float st = noise(g * 1.2) + 0.5 * noise(g * 4.0);
    vec3 pave = plaster * (0.3 + 0.45 * st * st) * (0.35 + 0.65 * smoothstep(-0.05, 0.55, shut)) * (1.0 - 0.6 * full);
    vec3 gleam = full * dyAmb * 0.6 * smoothstep(0.5, 0.85, st), alb = pave;
    if (uOwn[6] > 0.0) alb = mix(alb, vec3(0.8, 0.84, 0.9), DY_SNOW * smoothstep(0.05, 0.35, st + 0.5 * DY_SNOW - 0.35));
    if (uOwn[7] < 0.0) alb = mix(alb, plaster * (0.55 + 0.35 * st) * (0.9 + 0.1 * sin(shut * 22.0 + 4.0 * st)), DY_WET);
    float y = 0.0, sun = dySun.y, amb = 0.5 + 0.35 * max(DY_WET, DY_SNOW), own = 1.0;
    at = g;
    if (cov > 0.0) {
      float a = hash21(id + 5.0), b = hash21(id + 71.0);
      int k = int(mod(id.x + id.y + 62.0, 5.0));
      vec4 m = piece(vec2(sat(c.x / 22.0 + 0.5), sat(1.0 - (c.y - 9.0) / 15.0)));
      vec3 dye = dyDye(k);
      if (b > 0.85) dye = vec3(0.62, 0.6, 0.53);  // lime
      else if (b > 0.7) dye = mix(dye, vec3(0.13, 0.065, 0.03), 0.8);  // bark
      else if (m.a > 0.004) dye = mix(dye, pow(m.rgb / m.a, vec3(3.0)) * 0.6, 0.2 * sat(m.a));
      float wake = sat((0.9 * dyLv(k) + 0.6 * m.a) * (0.6 + 0.9 * uEnergy)), Ri = R - 0.15 - 0.08 * R + 0.5 * rough;
      Ri += DY_WET * 0.45 * rough;
      float lq = h - 0.12 * (1.0 - 0.7 * DY_WET) - (0.42 + 0.2 * b) * (1.0 - 0.75 * DY_WET) * (1.0 - 0.6 * uBands[int(mod(a * 97.0, 16.0))]) * (1.0 - 0.95 * full) * (1.0 + 1.6 * sat(-uOwn[5]));
      R += rough;
      vec2 q = g * (1.0 - h / dyH), ql = g * (1.0 - lq / dyH), v = q - c;
      float r = length(v), rl = length(ql - c), worn = noise(q * 2.1 + a * 30.0) + 0.5 * noise(q * 7.0);
      vec2 n = v / max(r, 1e-3);
      bool outside = r > R + gp, inside = r < Ri && rl > Ri;
      gleam = vec3(0.0);
      if (outside || inside) {
  // a wall, from outside or from inside
        float foot = outside ? 0.0 : lq, rad = outside ? R : Ri, way = outside ? -1.0 : 1.0;
        vec2 wd = (outside ? g : ql) - q;
        float A = max(dot(wd, wd), 1e-5), B = dot(v, wd), t = sat((-B + way * sqrt(max(B * B - A * (r * r - rad * rad), 0.0))) / A);
        y = mix(h, foot, t); at = q + wd * t; n = -way * (at - c) / max(rad, 0.01);
        float run = noise(vec2(atan(n.x, -n.y) * rad * 4.0, y * 0.8 + a * 9.0));
        alb = mix(plaster * (0.6 + 0.3 * worn), dye * 0.8 + 0.04, outside ? 0.75 * smoothstep(0.45, 0.8, run) * smoothstep(0.0, h, y) : smoothstep(0.25, 0.85, t + 0.3 * worn - 0.15));
        sun = sat(dot(n, dySun.xz)); amb = outside ? 0.35 + 0.5 * smoothstep(-0.1, 0.7, y) : 0.75 - 0.4 * t;
        at += n * 0.02;
        glow = inside ? (dye + 0.08 * sqrt(dye)) * (0.15 + 0.9 * wake) * t * t * step(b, 0.7) : vec3(0.0);
      } else if (r > Ri) {
  // the rim, worn and stained, its edges rounded
        float lip = (smoothstep(R - 0.07, R, r) - dyOff(Ri + 0.06, Ri, r)) * dot(n, dySun.xz);
        alb = plaster * (0.58 + 0.4 * worn);
        alb = mix(alb, dye + 0.05, 0.8 * smoothstep(0.75, 1.05, worn + 0.35 * dyOff(R, Ri, r)));
        if (uOwn[6] > 0.0) alb = mix(alb, vec3(0.84, 0.87, 0.92), DY_SNOW * smoothstep(0.2, 0.5, worn + 0.6 * DY_SNOW - 0.2));
        glow = (dye + 0.03) * (0.1 + 0.5 * wake) * dyOff(R, Ri, r) * step(b, 0.7) * (0.5 + 0.5 * worn);
        if (uOwn[7] < 0.0) alb = mix(alb, mix(plaster, dye + 0.1, 0.45) * (0.7 + 0.3 * worn), DY_WET * 0.8);
        y = h; at = q; sun = sat(dySun.y + 0.5 * lip); amb = (0.95 + 0.25 * lip) * smoothstep(Ri - 2.0 * gp, Ri + 2.0 * gp, r);
      } else {
  // the liquid: scum at the rim, deep in the middle, the sky lying on it
        float e = (Ri - rl) / max(Ri, 0.01), crust = noise(ql * 4.5 + a * 20.0) + 0.5 * noise(ql * 11.0);
        float scum = dyOff(0.2, 0.0, e - 0.16 * crust + 0.06) * (0.6 + 0.4 * b);
        dye = pow(dye, vec3(1.15));
        alb = mix(dye * (0.9 + 0.5 * wake), dye * (0.16 + 0.45 * wake), smoothstep(0.0, 0.75, e + 0.1 * crust));
        alb = mix(alb, mix(dye, vec3(0.5, 0.44, 0.34), 0.4) * 0.8, scum * 0.75);
  // rings: a drop for the keys, a drop for a hit in two vats, and a cue's in all the big ones
        float beat = fract(uTime * 0.23 + a), kr = length(ql - c - 0.4 * Ri * (vec2(b, a) - 0.5)) / max(Ri, 0.01), hr = kr - 1.0 + uHits, cr = kr - 1.0 + uCue;
        kr -= beat;
        float ring = (0.06 + uKeys) * step(0.5, b) * exp(-kr * kr * 180.0) * (1.0 - beat) * sat(beat * 5.0) * sin(kr * 40.0);
        if (abs(id.y - 5.0) + abs(id.x + 1.0) < 0.5 || abs(id.y - 4.0) + abs(id.x - 1.0) < 0.5) ring += uHits * (0.3 + exp(-hr * hr * 50.0) * cos(hr * 26.0));
        if (R > dyV * 0.5) ring += uCue * (0.25 + 0.9 * exp(-cr * cr * 24.0) * cos(cr * 17.0));
        float wob = noise(ql * 1.7 + vec2(4.0 * sin(uTime * 0.03), a * 9.0)) - 0.5;
        float sky = smoothstep(-0.1, 0.5, (Ri * 0.75 - ql.y + c.y) / max(Ri, 0.01) + 0.5 * wob + ring);
        y = lq; at = ql; sun = dySun.y * 0.95; amb = 1.0;
        glow = (dye + 0.03 * sqrt(dye)) * (0.16 + 0.9 * wake + 0.12 * sky) * (0.2 + 1.1 * smoothstep(0.0, 0.8, e + 0.07 * crust - 0.04)) * (0.25 + 0.75 * step(b, 0.7));
        gleam = dyAmb * (0.01 + 0.07 * sky * sky) * (1.0 - 0.8 * scum) * (1.0 + 2.0 * sat(ring)) + (dye + 0.15) * (dySunCol * 0.3 * dyBar(ql, lq) + dyAmb + 0.2) * sat(ring) * 0.5;
      }
      if (r < Ri) {  // down in a vat the sun comes in over the rim
        at += dyCast * (h - y); y = h;
        own = dyOff(0.05, -0.05, length(at - c) - Ri);
      }
    }
  // the sun, less the shadows of the other vats
    float lit = dyBar(at, y) * own * sun;
    if (lit > 0.0) {
      id0 = dyNear(at + dyCast * 0.4);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 c1, id1 = id0 + vec2(float(i), float(j)); float R1, h1;
        dyVat(id1, c1, R1, h1);
        if (abs(id1.x - id.x) + abs(id1.y - id.y) > 0.5 && h1 > y + 0.02) lit *= smoothstep(-0.06, 0.06, dySeg(c1, at, at + dyCast * (h1 - y)) - R1);
      }
    }
    col = alb * (dySunCol * lit + dyAmb * amb) + gleam;
    if (uOwn[6] < 0.0) col += glow * DY_NIGHT * 1.1;
    if (cov > 0.0) col *= 0.6 + 0.4 * cov;  // an edge, on whatever is behind
  }
  // two at work, each on the rim of a vat, with a pole
  for (int n = 0; n < 2; n++) {
    vec2 c; float R, h, side = n == 0 ? 1.0 : -1.0;
    dyVat(vec2(-side, 5.0), c, R, h);
    vec2 foot = c + R * 0.9 * vec2(-0.9 * side, 0.43), q = (p - vec2(0.0, dyHz)) * foot.y / DYF - vec2(foot.x, h - dyH);
    float pole = dySeg(q, vec2(0.18 * side, 1.15), vec2((0.85 + 0.12 * sin(uTime * 0.5 + side)) * side, -0.45)) - 0.03, w = px * foot.y / DYF, sun = dyBar(foot, h + 1.0);
    col = mix(col, vec3(0.2, 0.13, 0.07) * (dySunCol * 0.5 * sun + dyAmb), dyOff(w, -w, pole));
    vec3 wrap = n == 0 ? vec3(0.75, 0.7, 0.6) : dyDye(4);
    dyStand(col, p, foot, h, 0.5, wrap, wrap, 0.0, sun);
  }
  return dyShown(col);
}
vec3 render(vec2 p) { return uVar < 0.5 ? dySand(p) : dyYard(p); }
