// name: Silk
// a: Dark satin
// b: Falling ink
// what: A sheet of black satin moving in slow wind, dyed with the piece so each sound is a band of its own colour that swells as it plays; or the sounds as coloured ink falling and curling through dark water.
// follows: The fuller the music the deeper the folds; each sound lights its own colour where it sits in the piece; a hit sends a ripple out through the cloth, a cue sends a gust across it; in the water each kind of sound pours its own ink.
// own: 0 1 many fine folds (b: many thin plumes), -1 a few great ones; 1 1 the folds wind round one point as in a rose (b: the ink opens outward from the middle), -1 they lie across us like waves (b: it comes in from the side in beds); 2 1 pressed straight even pleats (b: straight falling threads), -1 crushed into creases (b: round billows); 3 the ground: 1 pale undyed cloth by day (b: ink in clear pale water), -1 cloth dyed through in the colour of the drone (b: water of that colour, lit from above); 4 1 velvet, bright at its edges (b: soft smoke with no lines), -1 a coarse dull weave (b: nothing but drawn lines); 5 the eye: 1 low, with a sky (b: the ink rises), -1 from straight above (b: it fills the whole water); 6 1 woven with spots (b: many more sheets), -1 striped with the kinds of sound (b: round drops that run together); 7 1 bright metal thread (b: shining dust in the ink), -1 thin, with the light behind it (b: a round lamp behind the water)
vec3 skDeep(vec3 c) { return c * c * 2.0 + c * 0.1; }
vec3 skTap; // where the cloth was tapped (x, z) and how far the ripple has gone
float skMany, skTall; // how many folds as against the plain cloth, and how high they stand
// The height of the cloth at x: long folds with round backs and pinched valleys, a second set across them.
float skCloth(vec2 x) {
  float t = uTravel * 0.1 + uTime * 0.02;
  float deep = 0.1 + 0.3 * uLevel + 0.06 * uEnergy;
  vec2 x0 = x;
  if (uOwn[1] < 0.0) x = rot(1.4 * uOwn[1]) * (x - vec2(0.0, 2.5)) + vec2(0.0, 2.5);
  if (skMany != 1.0) x *= skMany;
  vec2 w = vec2(noise(x * 0.3 + vec2(t, 0.0)), noise(x * 0.3 + vec2(5.0, -t)));
  float even = max(uOwn[2], 0.0);
  if (even > 0.0) w = mix(w, vec2(0.5), 0.97 * even);
  float f1 = x.x * 2.6 + x.y * 0.55 + w.x * 5.0 + t * 1.5;
  float a = abs(sin(f1));
  a = a * (1.6 - 0.6 * a); // round backs, pinched valleys
  float f2 = x.x * 6.1 + x.y * 1.6 + w.y * 7.0 + 1.3 * sin(f1) - t;
  float b = 0.5 + 0.5 * sin(f2);
  if (even > 0.0) { // a pressed pleat: a long slope and a short one
    float s = fract(f1 / PI), k = min(s / 0.8, (1.0 - s) / 0.2);
    a = mix(a, 1.3 * k, even); b *= 1.0 - even;
  }
  float h = deep * (a * (0.5 + 1.0 * w.y) + 0.3 * b * (0.25 + w.x)) + 0.16 * (w.x + w.y - 1.0);
  if (uOwn[2] < 0.0) { // crushed: creases of every length, none of them along another
    vec2 y = x * 0.5 + 0.9 * w + t * 0.2; float c = 0.0, m = 0.8;
    for (int i = 0; i < 5; i++) {
      y.x += 0.9 * abs(fract(y.y * 0.8) - 0.5);
      c += m * abs(fract(y.x) - 0.5);
      y = rot(1.15) * y * 1.4 + 3.1; m *= 0.7;
    }
    h = mix(h, (0.2 + 0.9 * deep) * 1.5 * (c - 0.35) + 0.16 * (w.x + w.y - 1.0), -uOwn[2]);
  }
  if (uOwn[1] > 0.0) { // gathered: the folds wind into one point
    vec2 y = x0 - vec2(0.15, 1.75);
    float r = length(y) + 1e-4, g = atan(y.y, y.x + 1e-5), lr = log(r + 0.16), f = 4.0 * lr * skMany + 2.2 * (w.x - w.y);
    float k1 = abs(sin(2.0 * g + f - t * 2.0)), k2 = abs(sin(3.0 * g - 1.6 * f + 2.0 * w.y));
    k1 = k1 * (1.6 - 0.6 * k1);
    float ros = deep * smoothstep(0.0, 1.1, r) * (1.35 * k1 + 0.35 * k2) + 0.45 * exp(-r * 1.1) - 0.1;
    h = mix(h, ros / skTall, uOwn[1]);
    a = mix(a, k1, uOwn[1]);
  }
  if (skMany != 1.0) h *= skTall;
  if (skMany != 1.0 || uOwn[1] < 0.0) x = x0;
  // a gust: a swell that crosses from left to right
  float gust = x.x - (-8.0 + 16.0 * (1.0 - uCue)) - 0.4 * x.y;
  h += 0.3 * uCue * exp(-gust * gust * 0.6) * (0.6 + a);
  // a tap: a ring going out
  float r = length(x - skTap.xy) - skTap.z;
  h += 0.11 * uHits * sin(r * 7.0) * exp(-r * r * 1.6) / (1.0 + 0.4 * skTap.z);
  return h;
}
// The air over the cloth.
vec3 skSky(vec3 rd, vec2 p) {
  vec3 c = vec3(0.0);
  float up = sat(rd.y * 2.2 + 0.1);
  if (uOwn[3] > 0.0) c = uOwn[3] * mix(vec3(0.8, 0.77, 0.73), vec3(0.5, 0.55, 0.6), up) * (0.9 + 0.2 * uLevel);
  if (uOwn[3] < 0.0) c = -uOwn[3] * mix(skDeep(uKind[1]) * 0.5 + 0.02, skDeep(uKind[0]) * 0.12, sqrt(up)) * (0.7 + 0.4 * uLevel);
  return c;
}
vec3 skSatin(vec2 p) {
  vec3 ro = vec3(0.5 * sin(uTime * 0.04), 2.3, -1.4);
  vec3 rd = normalize(vec3(p.x, p.y, 1.0));
  float low = max(uOwn[5], 0.0), over = max(-uOwn[5], 0.0), tilt = -0.66;
  if (uOwn[5] != 0.0) { tilt += 0.5 * low - 0.86 * over; ro += vec3(0.0, -0.75 * low + 0.9 * over, 3.4 * over); }
  if (uOwn[5] == 0.0) rd.yz = rot(-0.66) * rd.yz; else rd.yz = rot(tilt) * rd.yz;
  skTap = vec3(1.4 * sin(uTime * 0.23), 3.0 + 1.0 * cos(uTime * 0.19), (1.0 - uHits) * 3.0);
  if (rd.y > -0.02) return skSky(rd, p);
  float t = (ro.y - 0.7) / -rd.y, back = t, hit = 0.0;
  if (skTall > 1.0) { t = max(ro.y - 0.7 * skTall, 0.1) / -rd.y; back = t; }
  for (int i = 0; i < 40; i++) {
    vec3 q = ro + rd * t;
    float d = q.y - skCloth(q.xz);
    if (d < 0.0) { hit = 1.0; break; }
    back = t;
    t += max(d * 0.5, 0.008 * t);
    if (t > 40.0) break;
  }
  if (hit > 0.5) for (int i = 0; i < 4; i++) {
    float mid = 0.5 * (back + t); vec3 q = ro + rd * mid;
    if (q.y - skCloth(q.xz) < 0.0) t = mid; else back = mid;
  }
  vec3 q = ro + rd * t;
  float e = 0.006 + 0.003 * t;
  float h = skCloth(q.xz);
  vec3 n = normalize(vec3(h - skCloth(q.xz + vec2(e, 0.0)), e, h - skCloth(q.xz + vec2(0.0, e))));
  float white = max(uOwn[3], 0.0), dyed = max(-uOwn[3], 0.0), vel = max(uOwn[4], 0.0), weave = max(-uOwn[4], 0.0), gilt = max(uOwn[7], 0.0), thin = max(-uOwn[7], 0.0);
  float thread = 0.0;
  if (weave > 0.0) { // the threads, over and under
    vec2 y = vec2(q.x + 0.35 * h, q.z) * 26.0;
    float o = mod(floor(y.x) + floor(y.y), 2.0); vec2 f = fract(y) - 0.5;
    float clear = 1.0 / (1.0 + 0.02 * t * t * t);
    thread = weave * clear * ((o < 0.5 ? cos(PI * f.x) * (0.75 + 0.25 * cos(TAU * f.y)) : cos(PI * f.y) * (0.75 + 0.25 * cos(TAU * f.x))) - 0.55 + 0.5 * (noise(y * vec2(0.13, 1.0)) - 0.5));
    n = normalize(n + weave * clear * 0.45 * vec3(o < 0.5 ? f.x : 0.0, 0.0, o < 0.5 ? 0.0 : f.y));
  }
  vec3 L = normalize(vec3(-0.7, 0.55, -0.2)), V = -rd, H = normalize(L + V);
  float deep = 0.1 + 0.3 * uLevel + 0.06 * uEnergy;
  // does the fold next door stand in the light; and the bottoms of folds are dark
  float lit = sat(1.0 - 5.0 * (skCloth(q.xz + L.xz * 0.2) - h - L.y * 0.12));
  float lap = sat(0.3 + 0.9 * h / deep);
  // the dye: the piece laid on the cloth, across is the loop, far is the back of the room
  vec2 uv = vec2(q.x / (4.2 + 0.6 * q.z) * 0.5 + 0.5, 1.0 - (q.z + 0.7) / 9.5);
  vec4 pc = piece(uv);
  vec3 hue = skDeep(pc.rgb / max(pc.a, 0.02));
  float dye = pc.a * (0.3 + 1.5 * pc.a);
  float mark = 0.0; vec3 markHue = vec3(0.0);
  if (uOwn[6] != 0.0) {
    vec2 y = vec2(q.x + 0.4 * h, q.z);
    float lv, w = 0.04 + 0.02 * t;
    if (uOwn[6] < 0.0) {
      float s = y.x * 1.15 + 20.0, k = mod(floor(s), 4.0), f = fract(s), g = fract(s * 4.0);
      lv = k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : uPhrase;
      markHue = k < 0.5 ? uKind[0] : k < 1.5 ? uKind[1] : k < 2.5 ? uKind[2] : uKind[3];
      mark = smoothstep(0.05, 0.05 + w, f) * smoothstep(0.75, 0.75 - w, f) + 0.6 * smoothstep(0.82, 0.82 + w * 0.5, f) * smoothstep(0.92, 0.92 - w * 0.5, f);
      mark *= -uOwn[6];
    } else {
      vec2 c = y * 2.1; c.x += 0.5 * mod(floor(c.y), 2.0);
      vec2 id = floor(c), f = fract(c) - 0.5;
      float k = floor(hash21(id + 3.3) * 4.0);
      lv = k < 0.5 ? uDrone : k < 1.5 ? uPad : k < 2.5 ? uTexture : uPhrase;
      markHue = k < 0.5 ? uKind[0] : k < 1.5 ? uKind[1] : k < 2.5 ? uKind[2] : uKind[3];
      mark = uOwn[6] * smoothstep(0.26 + w, 0.26 - w, length(f));
    }
    mark *= exp(-t * 0.04);
    markHue = skDeep(markHue) * (0.8 + 0.5 * lv);
    hue = mix(hue, markHue, mark);
    dye = mix(dye * (1.0 - 0.55 * abs(uOwn[6])), max(dye, 0.45 + 0.9 * lv), mark);
  }
  float facing = sat(dot(n, L));
  vec3 col = hue * dye * (0.06 + 0.9 * facing * facing * lit) * lap;
  // sheen: satin throws a broad soft shine, and at a low angle it turns paler
  float shine = pow(sat(dot(n, H)), 14.0), glint = pow(sat(dot(n, H)), 90.0);
  float graze = pow(1.0 - sat(dot(n, V)), 4.0);
  vec3 pale = mix(vec3(0.42, 0.47, 0.6), mix(hue, vec3(1.0), 0.35), sat(pc.a * 3.0));
  col += pale * shine * (0.16 + 1.3 * dye) * lit * (0.7 + 0.5 * uLevel);
  col += vec3(0.9, 0.95, 1.0) * glint * (0.3 + 0.6 * dye) * lit;
  col += pale * graze * (0.012 + 0.3 * dye) * lap;
  if (over > 0.0) col *= 1.0 - 0.5 * over;
  if (uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[7] != 0.0) {
    // the stuff itself, what lies in it of the piece, and the light of a day on it
    float there = sat(1.25 * dye);
    vec3 base = 0.02 * white + white * vec3(0.80, 0.775, 0.735) + dyed * (skDeep(uKind[0]) * 0.55 + 0.012);
    vec3 alb = mix(base, mix(hue, hue * 0.75 + 0.1, white), there * mix(1.0, 0.85, white));
    alb *= 1.0 + 0.55 * thread;
    float lam = sat(0.2 + 0.8 * dot(n, L)), sky = 0.5 + 0.5 * n.y;
    vec3 day = vec3(1.05, 1.0, 0.92) * lam * lam * mix(0.25, 1.0, lit) * 1.25 + vec3(0.62, 0.7, 0.82) * sky * (0.12 + 0.3 * white) * (0.25 + 0.75 * lap);
    vec3 body = alb * day * (0.85 + 0.3 * uLevel);
    body += mix(alb, vec3(1.0), 0.4) * (shine * 0.22 + glint * 0.3) * lit * (1.0 - weave) * (1.0 - vel);
    vec3 was = mix(col, body, max(abs(uOwn[3]), weave));
    if (vel > 0.0) { // the nap: dark where it faces us, bright where it turns away
      float turned = 1.0 - sat(dot(n, V)), nap = turned * turned * 1.6 + 0.35 * pow(sat(dot(n, normalize(vec3(0.6, 0.5, 0.6)))), 3.0);
      vec3 pile = (alb + 0.015) * (0.05 + 1.9 * nap * (0.3 + 0.7 * lam) * (0.5 + 0.5 * lit)) * (0.4 + 0.6 * lap) * (0.8 + 0.4 * uLevel);
      pile *= 0.86 + 0.28 * noise(q.xz * 60.0);
      was = mix(was, pile, vel);
    }
    if (gilt > 0.0) { // metal: a dark room with two bright windows in it, mirrored
      vec3 r = reflect(rd, n + 0.03 * exp(-t * 0.35) * (noise(q.xz * 40.0) - 0.5));
      float win = smoothstep(0.25, 0.75, dot(r, L)) + 0.5 * smoothstep(0.55, 0.95, dot(r, normalize(vec3(0.75, 0.35, 0.3)))) + 0.14 * sat(r.y);
      vec3 tint = mix(skDeep(uKind[3]), hue, 0.7 * there);
      vec3 m = (0.05 + tint) * (0.07 + 1.35 * win * mix(0.35, 1.0, lit)) * (0.75 + 0.5 * uLevel) + vec3(1.0, 0.97, 0.9) * glint * 0.8;
      was = mix(was, m + white * 0.12 * tint, gilt);
    }
    if (thin > 0.0) { // gauze: what comes through is less where it stands steep and where it lies double
      vec2 sun = p - vec2(0.22, 0.14);
      float behind = 0.16 + 1.15 * exp(-dot(sun, sun) * 3.2) + 0.15 * uLevel, much = exp(-0.9 * (1.0 / max(n.y, 0.12) - 1.0));
      vec3 through = mix(skDeep(uKind[1]) * 0.7 + 0.12 + 0.5 * white, hue * 1.5 + 0.08, sat(there * 1.1));
      vec3 g = through * behind * (0.12 + 0.95 * much) * (0.65 + 0.35 * lap) + mix(through, vec3(1.0), 0.5) * (0.1 * shine + 0.25 * graze * behind);
      was = mix(was, g * (1.0 + 0.4 * thread), thin);
    }
    col = was;
  }
  // the tap shows as a ring of light
  float r = length(q.xz - skTap.xy) - skTap.z;
  col += (vec3(1.0, 0.9, 0.85) * 0.6 + hue * dye) * sqrt(uHits) * exp(-r * r * 3.0) * 1.3 * (0.3 + facing);
  if (uOwn[3] != 0.0) return mix(skSky(vec3(0.0), p), col, mix(exp(-t * 0.07) * smoothstep(30.0, 12.0, t), exp(-t * t * 0.006) * smoothstep(30.0, 12.0, t), abs(uOwn[3])));
  return col * exp(-t * 0.07) * smoothstep(30.0, 12.0, t);
}
// Ink: noise curled twice. Where it passes through its middle value there is a thin veil.
float skInk(vec2 x, float fine) {
  vec2 w = vec2(noise(x * 0.8 + 3.0), noise(x * 0.8 + 31.0)) - 0.5;
  if (uOwn[2] > 0.0) w *= 1.0 - 0.8 * uOwn[2];
  x += w * 1.8;
  w = vec2(noise(x * 1.7 + 7.0), noise(x * 1.7 + 19.0)) - 0.5;
  x += w * 0.6;
  if (uOwn[2] < 0.0) { // billows: round heads with creases between
    float a = 0.0, m = 0.6; vec2 y = x * 0.8;
    for (int i = 0; i < 3; i++) { float k = 2.0 * noise(y) - 1.0; a += m * (1.0 - sqrt(k * k + 0.002)); y = rot(0.7) * y * 2.0 + 4.0; m *= 0.42; }
    return mix(noise(x * 1.1) * 0.85 + 0.15 * fine * noise(x * 3.1 + 2.0) + 0.075 * (1.0 - fine), 0.75 * a, -uOwn[2]);
  }
  return noise(x * 1.1) * 0.85 + 0.15 * fine * noise(x * 3.1 + 2.0) + 0.075 * (1.0 - fine);
}
vec3 skWater(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec3 col = vec3(0.0);
  float fall = uTravel * 0.08;
  vec2 sway = vec2(0.06 * sin(uTime * 0.07), 0.03 * cos(uTime * 0.05));
  float T = 1.0;
  // which way the ink comes, how far off it enters, and what stands behind it
  float bloom = max(uOwn[1], 0.0), pale = max(uOwn[3], 0.0), dyed = max(-uOwn[3], 0.0), threads = max(uOwn[2], 0.0), lamp = max(-uOwn[7], 0.0);
  float way = PI * max(uOwn[5], 0.0) - 1.5708 * max(-uOwn[1], 0.0), all = max(-uOwn[5], 0.0), enter = 0.5, wayLong = 1.0;
  if (way != 0.0) { enter = 0.5 * abs(cos(way)) + 0.89 * abs(sin(way)); wayLong = enter * 2.0; }
  if (uOwn[6] < 0.0) enter -= 0.16 * uOwn[6];
  vec3 soak = vec3(0.0);
  float wideBy = uOwn[0] == 0.0 ? 1.0 : exp2(-0.9 * uOwn[0]), few = max(-uOwn[0], 0.0), many = max(uOwn[0], 0.0);
  for (int i = 0; i < 10; i++) {
    float fi = float(i), z = fi / 9.0; // 0 nearest
    int kind = (i * 3 + 1) % 5; // each layer of water holds one plume of ink, of one kind of sound
    float amount = lv[kind], seed = fi * 17.3 + 2.0;
    vec2 x = (p + sway * (1.0 - 2.5 * z)) * (0.75 + 0.9 * z), seen = x;
    if (way != 0.0) x = rot(way) * x;
    if (few > 0.0) amount *= 1.0 - few * (1.0 - step(1.5, fi) * step(fi, 6.5));
    float sharp = 1.0 - sat(abs(z - 0.4) * 1.3); // one depth is in focus
    // the plume: in at the top, further down the louder its sound, spreading as it falls
    float cx = (hash11(seed) - 0.5) * 1.5 * (0.75 + 0.9 * z) + 0.06 * sin(uTime * 0.11 + seed);
    float reach = (0.5 * (0.75 + 0.9 * z) - x.y); // 0 at the top
    if (way != 0.0 || uOwn[6] < 0.0) { reach = enter * (0.75 + 0.9 * z) - x.y; cx *= mix(1.0, 0.62, sat(wayLong - 1.0)); }
    float apart = 1.0;
    if (bloom > 0.0) { // each plume has a way of its own out of the middle
      vec2 y = seen - vec2(0.0, 0.02);
      float to = TAU * fract(0.618 * fi + 0.13) + 0.06 * sin(uTime * 0.11 + seed), g = atan(y.y, y.x + 1e-5) - to;
      g -= TAU * floor(g / TAU + 0.5);
      float r = length(y);
      apart = mix(1.0, smoothstep(3.1, 2.2, abs(g)), smoothstep(0.0, 0.3, bloom));
      x = mix(x, vec2(g * (0.12 + 0.5 * r), -r), bloom); cx *= 1.0 - bloom;
      reach = mix(reach, r * 1.15 - 0.03, bloom);
    }
    vec2 s2 = vec2(2.0, 1.5);
    if (uOwn[0] != 0.0) s2 *= exp2(uOwn[0] * 0.75);
    if (threads > 0.0) s2 *= mix(vec2(1.0), vec2(3.4, 0.22), threads);
    float n = skInk(vec2(x.x * s2.x + seed, x.y * s2.y + fall * (0.8 + 0.4 * hash11(seed + 1.0)) * (s2.y / 1.5)), sharp);
    float len = (0.1 + 1.15 * amount) * (0.75 + 0.5 * hash11(seed + 5.0));
    if (way != 0.0) len *= wayLong;
    float wide = 0.035 + 0.15 * sat(reach / max(len, 0.2)) + 0.04 * amount;
    wide *= wideBy;
    if (bloom > 0.0) wide *= 1.0 + 1.1 * bloom;
    float dx = (x.x - cx + (n - 0.5) * 0.3) / wide;
    float env = exp(-dx * dx) * smoothstep(len, len * 0.55, reach + (n - 0.5) * 0.4) * smoothstep(-0.02, 0.06, reach);
    if (many > 0.0) { // and two more beside it
      float d2 = dx + 0.42 / wide, d3 = dx - (0.31 + 0.2 * hash11(seed + 3.0)) / wide;
      env = max(env, many * (exp(-d2 * d2) + exp(-d3 * d3)) * smoothstep(len, len * 0.55, reach * 1.25 + (n - 0.5) * 0.4) * smoothstep(-0.02, 0.06, reach));
    }
    env *= apart;
    if (all > 0.0) env = mix(env, max(env, smoothstep(0.35, 0.62, noise(x * 1.3 + seed * 3.0 + n * 0.7)) * sat(0.25 + amount * 1.4)), all);
    // veils: each rises slowly to a sharp edge, like a thin sheet seen where it folds over
    float sheets = mix(6.0, 11.0, sharp);
    if (uOwn[6] != 0.0) sheets *= exp2(uOwn[6] * (uOwn[6] > 0.0 ? 1.0 : 2.2));
    float v = fract(n * sheets + seed);
    float streak = smoothstep(0.25, 0.75, noise(vec2(x.x * 2.5 + seed, x.y * 1.4 + fall) + n * 3.0)); // not every sheet catches the light
    float veil = (v * v * v + 0.8 * pow(v, 16.0) * sharp) * smoothstep(1.0, mix(0.8, 0.95, sharp), v) * (0.15 + 0.85 * streak);
    if (uOwn[4] > 0.0) veil = mix(veil, 0.2 + 0.75 * smoothstep(0.1, 0.9, n) * smoothstep(0.2, 0.8, streak + 0.3), uOwn[4]);
    if (uOwn[4] < 0.0) {
      float f = n * sheets + seed, px = max(fwidth(f), 1e-4), e = abs(fract(f + 0.5) - 0.5);
      veil = mix(veil, 1.2 * (1.0 - smoothstep(0.35 * px, 1.35 * px + 0.004, e)) * smoothstep(0.9, 0.3, px), -uOwn[4]);
    }
    float body = env * (0.04 + 0.96 * veil);
    if (uOwn[4] < 0.0) body = mix(body, env > 0.0 ? smoothstep(0.02, 0.3, env) * veil : 0.0, -uOwn[4]);
    if (uOwn[6] < 0.0) { // not veils but round drops of it, that run together where they meet
      float f = 0.0, k = 0.75 + 0.9 * z; vec2 g = vec2(0.0);
      for (int j = 0; j < 4; j++) {
        float u = hash11(seed + 2.7 * float(j)), w = hash11(seed + 9.1 + 1.3 * float(j)), go = fract(u + fall * (0.35 + 0.3 * w));
        float r = (0.028 + 0.1 * w * w) * (0.5 + 0.85 * amount) * k * wideBy * smoothstep(0.0, 0.2, go) * smoothstep(1.0, 0.8, go);
        vec2 d = x - vec2(cx + 0.5 * k * (u - 0.5) + 0.03 * sin(uTime * 0.21 + u * 40.0), mix(enter, -enter, go) * k * mix(1.15, 0.75, sat(uOwn[1])));
        float q = r * r / (dot(d, d) + 0.25 * r * r); f += q; g += q * d / (dot(d, d) + 0.25 * r * r);
      }
      float fw = max(fwidth(f), 1e-3) * (1.2 + 10.0 * (1.0 - sharp)), gl = length(g) + 1e-5, up = sqrt(sat((f - 0.8) / 3.2));
      vec2 side2 = g / gl; if (way != 0.0) side2 = side2 * rot(way);
      vec3 face = normalize(vec3(side2 * sqrt(max(1.0 - up * up, 0.0)), up + 0.05));
      float in_ = smoothstep(-fw, fw, f - 0.8), key = sat(dot(face, vec3(-0.5, 0.6, 0.62))), rim = 1.0 - up;
      float drop = in_ * (0.1 + 0.35 * key + 0.8 * smoothstep(0.93, 0.985, key) + 0.75 * pow(sat(dot(face, vec3(0.5, -0.62, 0.5))), 3.0) + 0.3 * rim * rim * rim);
      body = mix(body, drop, -uOwn[6]);
    }
    vec3 hue = skDeep(uKind[kind]);
    vec3 light = mix(hue, vec3(1.0), 0.25 * sat(veil - 0.6) * env) * body * (0.05 + 1.7 * amount) * (0.45 + 0.55 * sharp);
    // a hit or a cue: a drop bursts into a ring near the depth that is sharp
    vec2 dv = x - vec2(0.4 * sin(uTime * 0.31 + 1.0), 0.02 + 0.14 * cos(uTime * 0.27)) + (n - 0.5) * 0.08;
    float out_ = max(uHits, uCue), ring = length(dv) - 0.4 * (1.0 - out_) * (1.0 + step(uHits, uCue));
    light += (skDeep(uKind[4]) + vec3(0.25)) * out_ * exp(-ring * ring * 300.0) * (0.3 + veil) * exp(-pow((z - 0.35) * 4.0, 2.0)) * 1.3;
    if (uOwn[7] > 0.0) { // dust that shines as it turns
      vec2 y = seen * 90.0 + vec2(seed, fall * 60.0), id = floor(y); float g = hash21(id + fi);
      light += uOwn[7] * smoothstep(0.86, 0.99, g) * smoothstep(0.4, 0.1, length(fract(y) - 0.5)) * (0.5 + 0.5 * sin(uTime * (0.5 + g) + g * 90.0)) * smoothstep(0.1, 0.7, body + 0.5 * env) * (hue + 0.35) * (0.15 + 1.6 * amount) * sharp * 1.6;
    }
    col += T * light;
    soak += (1.12 - sqrt(hue) * 0.95) * body * (0.1 + 1.9 * amount) * (0.55 + 0.45 * sharp);
    T *= uOwn[6] < 0.0 ? 1.0 - mix(0.6, 0.95, -uOwn[6]) * sat(body * 2.0) * sat(amount * 3.0) : 1.0 - 0.6 * body * sat(amount * 3.0);
  }
  if (dyed > 0.0 || lamp > 0.0 || pale > 0.0) {
    vec2 at = p - vec2(0.12, 0.06);
    float disc = lamp > 0.0 ? lamp * (smoothstep(0.262, 0.25, length(at)) + 0.35 * exp(-max(length(at) - 0.25, 0.0) * 5.0)) : 0.0;
    vec3 under = vec3(0.0);
    if (dyed > 0.0) under = dyed * (skDeep(uKind[0]) * 0.5 + 0.012) * (0.2 + 0.95 * smoothstep(-0.55, 0.6, p.y + 0.12 * noise(vec2(p.x * 3.0 + p.y, uTime * 0.07)))) * (0.8 + 0.4 * uLevel) * (0.75 + 0.6 * smoothstep(0.35, 0.8, noise(vec2(p.x * 4.0 + p.y * 1.6 + 0.05 * uTime, 0.04 * uTime))) * smoothstep(-0.5, 0.5, p.y));
    under += disc * (skDeep(uKind[3]) * 0.6 + vec3(0.42, 0.4, 0.36)) * (0.8 + 0.4 * uLevel);
    vec3 dark = exp(-soak * 1.1);
    vec3 pond = vec3(0.93, 0.915, 0.88) * (0.8 + 0.3 * smoothstep(0.9, 0.0, length(p - vec2(-0.2, 0.15)))) + disc * 0.2;
    col = mix(under * mix(vec3(T), dark, 0.6) + col, pond * exp(-soak * 3.6) * 2.1 + col * 0.15, pale);
  }
  return col;
}
vec3 render(vec2 p) {
  skMany = skTall = 1.0;
  if (uOwn[0] != 0.0) { skMany = exp2(uOwn[0] * 1.1); skTall = exp2(uOwn[0] * -0.75); }
  return screenOf(uVar < 0.5 ? skSatin(p) : skWater(p));
}
