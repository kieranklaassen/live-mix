// name: Between tides
// a: Drying harbour
// b: Under the pier
// what: A stone harbour at low water: three boats lean on ribbed shining mud, a pale measuring board stands by the wall, and as the piece fills, a sheet of water lifts them upright and doubles them; or under an old pier rows of posts, black with weed and pale with shells, go out to sea over bars of light on sand.
// follows: Drone and pad bring the tide in. Drone deepens its breath, pad milks the water, texture roughens mud, ripples and foam, a phrase swings a boat or colours the foam, low rocks boats, bands stir sixteen strips of water or light, the piece tints the water. A hit rings, a cue sends sun through the gap or planks, keys light lamps or shells, the loop turns the sun.
// own: 0 night at -1, red evening at 1; 1 dried out at -1, full flood at 1; 2 sea fog at -1, hard blue day at 1; 3 dark peat and slate at -1, white sand and green sea at 1; 4 an eye low by the water at -1, at 1 close to the boats or higher under the pier; 5 small skiffs or thin poles at -1, big boats or stout posts at 1; 6 gabled houses on the walls (b: standing beside the pier) at -1, no walls at all but an islet far out (b: only broken posts, no deck) at 1; 7 a low sun straight ahead at -1, snow, ice floes and icicles at 1
vec3 btSun, btSunC, btLow, btHigh; // the sun and the sky
vec3 btMud, btSea, btRock; // ground, water, stone and wood
float btF, btPx, btH, btW, btNight, btFog, btTide; // lens, pixel, eye, water
vec2 btHor; float btDown; // straight ahead; 0 there, 1 at the lower edge
mat3 btM[3]; vec3 btO[3]; float btS[3], btBeam; // the boats
#define btA max(uOwn[6], 0.0)
#define btB max(-uOwn[6], 0.0)
#define btC max(-uOwn[7], 0.0)
#define btD max(uOwn[7], 0.0)
float btFine(float px, float size) { return 1.0 - smoothstep(0.18, 0.55, px / size); }
// 1 below an edge and 0 above it; 1 up to lo and 0 from hi.
float btIn(float d, float px) { return 1.0 - smoothstep(-px, px, d); }
float btFall(float lo, float hi, float x) { return 1.0 - smoothstep(lo, hi, x); }
void btSetup() {
  float red = sat(uOwn[0]), clear = sat(uOwn[2]), pale = sat(uOwn[3]), dark = sat(-uOwn[3]);
  btNight = sat(-uOwn[0]); btFog = sat(-uOwn[2]);
  btTide = smoothstep(0.1, 1.1, 0.6 * uDrone + 0.4 * uPad);
  btSun = normalize(vec3(-0.8, 0.58 - 0.26 * red + 0.04 * cos(TAU * uLoop), 0.14 + 0.08 * sin(TAU * uLoop)));
  btSunC = mix(vec3(1.9, 1.6, 1.22), vec3(2.1, 0.8, 0.3), red) * (1.0 + 0.4 * clear - 0.75 * btFog);
  btLow = mix(vec3(0.8, 0.755, 0.67) + 0.08 * uMic, vec3(1.15, 0.5, 0.24), red) * mix(vec3(1.0), vec3(0.74, 0.94, 1.12), clear * (1.0 - red));
  btHigh = mix(vec3(0.33, 0.42, 0.51), vec3(0.3, 0.27, 0.44), red) * mix(vec3(1.0), vec3(0.3, 0.66, 1.25), clear);
  btHigh = mix(btHigh, btLow * 0.8, btFog);
  if (uOwn[7] < 0.0) btSun = normalize(mix(btSun, vec3(0.03, 0.115, 0.95), btC));
  btSunC = mix(btSunC, vec3(0.3, 0.38, 0.56), btNight);
  btLow = mix(btLow, vec3(0.085, 0.13, 0.2), btNight);
  btHigh = mix(btHigh, vec3(0.012, 0.024, 0.06), btNight);
  btMud = mix(mix(vec3(0.225, 0.18, 0.145), vec3(0.06, 0.052, 0.05), dark), vec3(0.66, 0.58, 0.45), pale);
  btSea = mix(mix(vec3(0.08, 0.125, 0.12), vec3(0.03, 0.028, 0.022), dark), vec3(0.06, 0.4, 0.38), pale);
  btRock = mix(mix(vec3(1.0), vec3(0.38, 0.41, 0.46), dark), vec3(1.7, 1.6, 1.4), pale);
  if (uOwn[7] > 0.0) { btMud = mix(btMud, vec3(0.72, 0.77, 0.84), btD); btRock = mix(btRock, vec3(1.3, 1.4, 1.55), btD * 0.6); }
}
// Milk, long thin clouds, the sun's glow.
vec3 btSky(vec3 rd) {
  float el = max(rd.y, 0.0), s = sat(dot(rd, btSun));
  vec3 c = mix(btLow, btHigh, smoothstep(0.0, 0.4, el)) + btSunC * (0.42 * s * s * s * s + 0.06 * s);
  if (uOwn[7] < 0.0) { float a = length(rd - btSun); c += btSunC * btC * (2.5 * btFall(0.036, 0.04, a) + 0.5 * exp(-a * 7.0)); }
  vec2 q = vec2(rd.x / (el + 0.22), 0.55 / (el + 0.16));
  float cl = noise(q * vec2(1.1, 2.8) + vec2(uTime * 0.006, 3.0));
  cl += 0.3 * sin(q.x * 3.0 + q.y * 9.0 + 5.0 * cl);
  return mix(c, btLow * 1.05 + 0.06 * btSunC, (1.0 - btFog) * smoothstep(0.45, 1.0, cl) * smoothstep(0.0, 0.12, el) * 0.65);
}
vec3 btAir(vec3 c, float t) { return mix(c, btLow * 0.9 + 0.06 * btSunC, 1.0 - exp(-max(t, 0.0) * ((0.0025 + 0.003 * uSpace) * (1.0 - 0.8 * max(uOwn[2], 0.0)) + 0.036 * btFog * btFog))); }

// The ripples' slope and height.
vec3 btRipple(vec2 q, float fine) {
  q += 40.0 * vec2(cos(uTime * 0.005), -sin(uTime * 0.005));
  float r1 = noise(q * vec2(0.9, 1.7)) - 0.5, r2 = noise(q * vec2(2.2, 4.6) + 5.0) - 0.5;
  return vec3(0.02 * r1 + 0.03 * r2, 0.05 * r1 + 0.05 * r2 * fine, r1 + r2);
}
// A ray's bounce, and how much of it.
vec4 btBounce(vec3 rd, vec3 n) {
  vec3 r = reflect(rd, n);
  return vec4(normalize(vec3(r.x, max(r.y, 0.015), r.z)), 0.06 + 0.94 * pow(1.0 - sat(-dot(rd, n)), 3.0));
}
// The piece's light on the water; a hit's ring.
vec3 btTint(float x) {
  vec2 uv = vec2(x / 1.78 + 0.5, btDown);
  return piece(uv).rgb * smoothstep(0.0, 0.06 + 0.3 * btNight, uv.x) * btFall(0.94 - 0.3 * btNight, 1.0, uv.x) * (0.4 + 0.4 * uEnergy);
}
vec3 btRing(vec2 q) {
  float l = length(q), d = (l - 0.5 - 2.6 * (1.0 - uHits)) * 2.6;
  return mix(uKind[4], vec3(1.0, 0.95, 0.85), 0.5) * (0.35 + 0.6 * btLow + 0.4 * btNight + 2.0 * btD) * (exp(-d * d) * uHits + 0.6 * uHits * uHits * exp(-l * l));
}

float btWallX(float z) { return -9.84 + 0.105 * z; }
// 0 in the wall's shade.
float btShade(vec3 P) { return btA + (1.0 - btA) * smoothstep(-1.1, 1.7, P.x - btWallX(P.z) + (5.0 - P.y) * btSun.x / btSun.y); }
// How high the mud lies, with the creek in it.
float btBed(vec2 q) {
  float d = (q.x + 1.7 - 1.5 * sin(q.y * 0.16 + 0.4) * btFall(24.0, 50.0, q.y) + 0.2 * sin(q.y * 0.9 + 0.5 * q.x)) / (0.9 + 0.035 * q.y);
  return 0.26 - 0.6 * exp(-d * d * 0.5) + 0.22 * (noise(q * 0.27) - 0.5) + 0.012 * min(q.x - 1.0, 20.0) - 2.2 * smoothstep(38.0, 52.0, q.y);
}
vec2 btE(vec2 q, float px) {
  q = q * 0.55 + 0.25 * vec2(noise(q), noise(q + 9.0)); q += 0.3 * vec2(sin(uTime * 0.03), cos(uTime * 0.023));
  vec2 i = floor(q), f = q - i; float a = 9.0, b = 9.0, id = 0.0;
  for (int k = 0; k < 9; k++) {
    vec2 c = vec2(float(k % 3) - 1.0, float(k / 3) - 1.0), h = hash22(i + c), d = c + 0.15 + 0.7 * h - f; float l = dot(d, d);
    if (l < a) { b = a; a = l; id = h.x; } else b = min(b, l);
  }
  float e = sqrt(b) - sqrt(a);
  return vec2(smoothstep(0.1 - px * 0.5, 0.2 + px * 0.5, e) * step(1.0 - 0.96 * btD, id + 0.02), (0.6 + 0.4 * id) * (0.75 + 0.25 * smoothstep(0.1, 0.35, e)));
}
vec4 btG(vec2 q, float px) {
  float id = floor(q.x / 3.1), x = q.x - (id + 0.5) * 3.1, f = abs(x), h = hash11(id + 2.0), tall = (2.3 + 2.4 * h) * btB, top = tall + 1.5 * btB * (1.0 - f / 1.55), k = q.y / 1.2;
  vec2 g = abs(vec2(f - 0.62, (fract(k) - 0.5) * 1.2)) - vec2(0.24, 0.34);
  vec3 c = mix(vec3(0.62, 0.57, 0.5), 1.7 * uKind[int(mod(id, 5.0))], 0.6) * (btLow * 0.6 + btSunC * 0.3);
  float lit = step(0.45, hash21(vec2(id * 2.0 + step(0.0, x), floor(k)))), wind = btIn(max(g.x, g.y), px) * step(q.y, tall);
  c = mix(c, vec3(0.03) + 0.15 * btHigh + lit * vec3(1.3, 0.8, 0.34) * (btNight + 0.25 + uKeys), wind);
  c = mix(c, mix(vec3(0.16, 0.06, 0.04), vec3(0.8, 0.85, 0.9), btD) * (btLow * 0.8 + 0.2 * btSunC), btIn(top - q.y - 0.3, px));
  return vec4(c, btIn(q.y - top, px));
}
// Granite, weed up to the tide's line.
vec3 btStone(vec2 q, float px) {
  float row = floor(q.y / 0.62), along = (q.x + hash11(row + 3.0) * 1.3) / 1.45, n = noise(q * vec2(2.0, 4.0));
  vec2 f = vec2(fract(along) * 1.45, fract(q.y / 0.62) * 0.62);
  float e = min(min(f.x, 1.45 - f.x), min(f.y, 0.62 - f.y)), fine = btFine(px, 0.5), tone = hash21(vec2(floor(along), row));
  vec3 c = mix(vec3(0.3, 0.29, 0.285), vec3(0.44, 0.405, 0.36), mix(0.5, tone, fine));
  c *= mix(0.9, 0.4 + 0.6 * smoothstep(0.0, 0.035 + px, e), fine) * (0.72 + 0.5 * n);
  float line = 2.05 + 0.12 * sin(q.x * 0.7) + 0.45 * n;
  return mix(c * btRock, mix(vec3(0.03, 0.04, 0.02), vec3(0.1, 0.1, 0.035), n), 0.94 * (1.0 - smoothstep(line - 0.25, line + 0.1, q.y)));
}
// The two walls on a ray.
vec2 btWallT(vec3 ro, vec3 rd) {
  return vec2((btWallX(ro.z) - ro.x) / min(rd.x - 0.105 * rd.z, -1e-4), (50.0 - 0.08 * ro.x - ro.z) / max(rd.z + 0.08 * rd.x, 1e-3));
}
vec3 btFar(vec3 ro, vec3 rd) {
  vec2 tt = btWallT(ro, rd), px = max(abs(tt), 0.1) * btPx;
  vec3 q = ro + rd * tt.x, r = ro + rd * tt.y, day = btSunC * 0.5 + btLow * 0.45, c = btSky(rd);
  float m = step(0.0, tt.x) * btIn(q.y - 5.0 + 7.0 * btA, px.x) * btIn(q.z - 46.0, 3.0 * px.x), mr = step(0.0, tt.y) * btIn(1.6 - r.x, px.y) * btIn(r.y - 4.7 + 6.7 * btA, px.y);
  float tl = (46.0 - ro.z) / max(rd.z, 1e-3), pl = abs(tl) * btPx;
  vec2 l = (ro + rd * tl).xy - vec2(-6.1 + 12.0 * btA, 5.0 - 3.9 * btA);
  if (uOwn[6] > 0.0) {
    c = mix(c, btAir(btLow * 0.4, 70.0), btA * btIn(rd.y - 0.04 * noise(rd.xx * 5.0), 0.003));
    c = mix(c, btAir(btMud * 0.35 * btLow, tl), btA * btIn(l.y - 1.5 * exp(-l.x * l.x * 0.06) + 1.2, pl));
  }
  if (uOwn[6] < 0.0) {
    c = mix(c, btAir(btLow * (0.5 + 0.2 * btD), 34.0), btB * btIn(rd.y - 0.1 - 0.2 * noise(rd.xx * 2.2 + 4.0), 0.004));
    float z = q.z + 1.0;
    vec4 hs = btG(vec2(r.x - 1.6, r.y - 4.7), px.y); c = mix(c, btAir(hs.rgb, tt.y), hs.a * step(1.6, r.x) * step(4.6, r.y));
    hs = btG(vec2(z, q.y - 5.0), px.x * 1.6); c = mix(c, btAir(hs.rgb, tt.x), hs.a * step(0.0, tt.x) * step(abs(z - 18.6), 18.6) * step(4.9, q.y));
  }
  vec3 w = mix(vec3(0.85, 0.82, 0.76), vec3(0.6, 0.16, 0.1), btIn(abs(l.y - 2.1) - 0.45, pl)) * (btLow * 0.35 + btSunC * 0.55 * sat(0.45 - 0.7 * l.x));
  c = mix(c, btAir(w, tl), btIn(max(abs(l.x) - mix(0.95, 0.66, sat(l.y / 3.4)), l.y - 3.4), pl));
  c = mix(c, vec3(1.0, 0.65, 0.28) * (0.4 + 1.2 * btNight + 0.8 * uKeys), btIn(max(abs(l.x), abs(l.y - 4.0)) - 0.45, pl));
  c = mix(c, btAir(0.07 * day, tl), btIn(min(max(abs(l.x) - 0.9, abs(l.y - 3.5) - 0.1), max(abs(l.x) + l.y - 4.95, 4.4 - l.y)), pl));
  l.y -= 4.0; c += vec3(1.0, 0.6, 0.25) * (0.5 * btNight + 0.3 * uKeys) * exp(-dot(l, l) * 0.35);
  // stone, coping, measuring board
  bool left = m > 0.0;
  vec3 k = left ? vec3(q.y - 4.86 + 7.0 * btA, px.x, tt.x) : vec3(r.y - 4.56 + 6.7 * btA, px.y, tt.y);
  w = left ? btStone(q.zy, px.x * 2.0) * (btLow * 0.34 + btSunC * 0.06) : btStone(r.xy, px.y) * day;
  w = mix(w, left ? btLow * 0.26 + btSunC * 0.18 : day * 0.5, 0.8 * btIn(abs(k.x) - 0.14, k.y));
  if (uOwn[7] > 0.0) w = mix(w, vec3(0.85, 0.9, 1.0) * (btLow * 0.75 + btSunC * 0.15), btD * btIn(-k.x - 0.1 - 0.5 * noise(left ? q.zz : r.xx), k.y));
  float b = q.z - 19.2, pz = px.x * 2.5, tick = btIn(abs(fract(q.y / 0.4) - 0.5) * 0.4 - 0.1, px.x) * btIn(abs(b + 0.1) - 0.18, pz);
  vec3 bc = btLow * mix(vec3(0.75, 0.72, 0.63), vec3(0.03), tick) * mix(vec3(0.3, 0.34, 0.2), vec3(1.0), smoothstep(1.6, 2.15, q.y));
  w = mix(w, bc, float(left) * btIn(max(abs(b) - 0.38, (abs(q.y - 2.35) - 2.25) * 2.5), pz));
  return mix(c, btAir(w, k.z), left ? m : mr);
}
float btPart; // what of the boat was nearest: 0 the planks outside, 1 inside, 2 the house
float btTop(float u) { return 0.9 + 0.26 * u * u + 0.12 * u; }
float btHull(vec3 q, bool house) {
  float u = q.x / 2.7, a = abs(q.z), top = btTop(u);
  float bow = sat((u + 0.1) / 1.1), st = sat((-u - 0.1) / 0.9), b2 = bow * bow, keel = 0.62 * b2 * b2 * b2;
  float v = sat((q.y - keel) / (top - keel));
  float b = btBeam * (1.0 - b2 * (0.35 + 0.65 * bow)) * (1.0 - 0.36 * st * st);
  b *= sqrt(v * (1.5 - 0.5 * v) + 0.001) * mix(1.0, 0.45 + 0.55 * v, max(bow, st * 0.8));
  float d = max(max(a - b, q.y - top), max(keel - q.y, abs(q.x - 0.02) - 2.64));
  float cav = max(max(a - b + 0.07, (house ? top - 0.14 : 0.42) - q.y), -q.x - 2.5);
  btPart = cav < 0.03 && -cav > d - 0.004 ? 1.0 : 0.0;
  d = max(d, -cav);
  if (house) {
    vec3 w = abs(q - vec3(-0.75, 1.2, 0.0)) - vec3(0.62, 0.62, 0.42 * btBeam);
    float h = max(w.x, max(w.y, w.z));
    if (h < d) { d = h; btPart = 2.0; }
  }
  return d * 0.8;
}
// The boat a ray meets, where, how far, how much.
int btWhich; vec3 btQ; float btGone, btCover;
void btMarch(vec3 ro, vec3 rd, float tmax, int steps) {
  for (int i = 0; i < 3; i++) {
    if (btCover > 0.9) break;
    vec3 o = (ro - btO[i]) * btM[i] / btS[i], r = rd * btM[i] / btS[i], ir = 1.0 / (r + vec3(1e-5));
    float tall = i == 0 ? 0.93 : 0.65, best = 1e3;
    vec3 n0 = (vec3(0.0, tall, 0.0) - o) * ir, k = abs(ir) * vec3(2.78, tall + 0.03, 1.05 * btBeam);
    float t = max(max(max(n0.x - k.x, n0.y - k.y), n0.z - k.z), 0.0), t1 = min(min(min(n0.x + k.x, n0.y + k.y), n0.z + k.z), tmax), bt = t;
    for (int n = 0; n < steps && t < t1; n++) {
      float d = btHull(o + r * t, i == 0), rel = d / btPx / (t + 0.01);
      if (rel < best) { best = rel; bt = t; }
      if (d < 0.006) { best = 0.0; break; }
      t += d * btS[i];
    }
    best = btFall(0.15, 1.4, best);
    if (best > btCover) { btCover = best; btGone = bt; btWhich = i; btQ = o + r * bt; }
  }
}
vec3 btPaint(vec3 P) {
  if (btCover <= 0.0) return vec3(0.0);
  bool house = btWhich == 0, pale = btWhich == 1;
  vec3 q = btQ, n = vec3(0.0, 1e-5, 0.0);
  for (int k = 0; k < 5; k++) {
    vec3 e = k > 3 ? vec3(0.0) : vec3(k == 0 || k == 3 ? 1.0 : -1.0, k > 1 ? 1.0 : -1.0, k == 1 || k == 3 ? 1.0 : -1.0);
    n += e * btHull(q + e * 0.007, house);
  }
  n = normalize(n);
  vec3 nw = btM[btWhich] * n, c;
  float u = q.x / 2.7, top = btTop(u), line = q.y - 0.36 - 0.05 * u * u, grime = noise(q.xy * vec2(2.2, 9.0) + float(btWhich) * 7.0);
  if (btPart < 0.5) {
    c = house ? vec3(0.03, 0.085, 0.16) : pale ? vec3(0.62, 0.56, 0.45) : vec3(0.06, 0.18, 0.13);
    c *= mix(vec3(0.9), 2.0 * uKind[house ? 0 : pale ? 1 : 3], 0.4);
    c = mix(pale ? vec3(0.09, 0.15, 0.18) : vec3(0.28, 0.07, 0.04), c, smoothstep(-0.012, 0.012, line));
    c = mix(c, c * 0.4 + vec3(0.03, 0.04, 0.02), 0.8 * btFall(0.0, 0.32, q.y - 0.18 * grime));
    c = mix(c, pale ? vec3(0.09, 0.18, 0.26) : vec3(0.78, 0.73, 0.64), smoothstep(-0.155, -0.14, q.y - top));
    c *= 0.74 + 0.26 * smoothstep(0.0, 0.14, fract((q.y - 0.12 * u * u) * 7.5)) * (0.75 + 0.5 * grime);
  } else if (btPart < 1.5) {
    c = mix(vec3(0.22, 0.15, 0.09), vec3(0.36, 0.28, 0.19), grime) * (0.5 + 0.5 * smoothstep(top - 0.5, top, q.y));
  } else {
    vec2 w = abs(vec2(abs(n.x) > 0.5 ? q.z / (0.42 * btBeam) : (q.x + 0.75) / 0.62, q.y - 1.42)) - vec2(0.42, 0.15);
    c = mix(vec3(0.78, 0.73, 0.64), vec3(0.5, 0.17, 0.08), smoothstep(1.66, 1.7, q.y));
    c = mix(c, vec3(0.04) + btLow * 0.12 + vec3(1.2, 0.75, 0.3) * (btNight + uKeys), btIn(max(abs(w.x) - 0.3, w.y), 0.015) * step(abs(n.y), 0.5));
  }
  if (q.y > top - 0.035 && btPart < 1.5) c = vec3(0.45, 0.32, 0.2);
  if (uOwn[7] > 0.0) c = mix(c, vec3(0.85, 0.88, 0.94), btD * smoothstep(0.35, 0.7, nw.y + 0.2 * grime));
  c *= btSunC * sat(dot(nw, btSun)) * mix(0.3, 1.0, btShade(P)) * 1.15 + btLow * (0.26 + 0.2 * nw.y) + btHigh * (0.18 + 0.1 * nw.y) + btMud * btSunC * 0.25 * sat(0.3 - nw.y);
  return btAir(c, btGone);
}
float btLine(vec2 p, vec2 a, vec2 b, float w) {
  vec2 d = b - a;
  return btIn(length(p - a - d * sat(dot(p - a, d) / (dot(d, d) + 1e-6))) - w, 0.8 / uRes.y);
}
vec2 btSee(vec3 P) { return vec2(P.x, P.y - btH) * btF / max(P.z, 0.5) + btHor; }
// Masts, ropes, lights, and their doubles.
vec4 btRig(vec2 p, vec2 pm, bool low, out vec4 mir) {
  vec4 c = vec4(0.0); mir = c;
  for (int k = 0; k < (low ? 4 : 2); k++) {
    int i = k & 1;
    vec3 X = btM[i][0] * btS[i], Y = btM[i][1] * btS[i], o = btO[i] + X * (i == 0 ? 0.75 : 0.5), g = o + Y * (i == 0 ? 3.9 : 4.7);
    vec2 F = btSee(o + Y * 0.8), G = btSee(g), at = k < 2 ? p : vec2(pm.x, 2.0 * (btHor.y + (btW - btH) * btF / btO[i].z) - pm.y);
    float d = length(at - mix(F, G, 0.72)) * g.z, lit = uKeys + 0.9 * btNight;
    vec4 h = mix(k < 2 ? c : mir, vec4(0.07 * btLow, 1.0), btLine(at, G, btSee(btO[i] + X * 2.6 + Y * 1.2), 0.0));
    h = mix(h, vec4(btAir(vec3(0.2, 0.14, 0.08) * (btLow + btSunC), g.z), 1.0), btLine(at, F, G, 0.055 * btF / g.z));
    h = mix(h, vec4(vec3(1.0, 0.72, 0.36) * (0.3 + lit), 1.0), btFall(0.1, 0.17, d));
    h.rgb += vec3(0.5, 0.3, 0.12) * lit * exp(-d * 2.2);
    if (k < 2) c = h; else mir = h;
  }
  return c;
}
// The quay and its iron ring.
vec3 btCorner(vec2 p, float dep, float e) {
  vec2 r = rot(0.2) * ((p - vec2(0.7, -0.445)) * vec2(1.0, 1.55));
  float n = noise(vec2(p.x - 0.5 * dep, dep * 2.2) * 150.0);
  vec3 st = vec3(0.43, 0.4, 0.37) * (0.7 + 0.45 * n) * btRock * (btLow * 0.36 + btSunC * 0.42) * (1.0 + 0.4 * btFall(0.008, 0.016, dep));
  vec3 iron = vec3(0.2, 0.1, 0.065) * (0.6 + 0.8 * n) * (btLow + btSunC * 0.3) * sat(0.6 - r.x * 7.0 + r.y * 5.0);
  return mix(st, iron, btIn(abs(length(r) - 0.062) - 0.01, e));
}
vec3 btHarbour(vec2 p) {
  float dep = -0.315 - p.y + 0.36 * (p.x - 0.86) - 0.4 * btA, e = 1.2 / uRes.y;
  if (dep > e) return btCorner(p, dep, e);
  btBeam = 1.02 + 0.2 * uOwn[5];
  btW = -0.12 + 0.72 * btTide + 0.05 * sin(uTime * 0.05) + 0.012 * sin(uTime * 0.7) * (0.4 + uDrone) + 1.1 * uOwn[1];
  vec3 at[3] = vec3[3](vec3(2.3, 0.22, 12.2), vec3(-3.4, -0.02, 17.5), vec3(9.2, 0.22, 24.0));
  vec4 how[3] = vec4[3](vec4(0.913, 0.408, -0.34, 1.1), vec4(-0.77, 0.638, -0.4, 0.95), vec4(0.939, -0.343, 0.42, 1.0));
  for (int i = 0; i < 3; i++) {
    btS[i] = how[i].w * (1.0 + 0.28 * uOwn[5]);
    float dr = 0.42 * btS[i], up = smoothstep(at[i].y, at[i].y + dr, btW), n = float(i) * 2.0;
    float y = up * (0.05 * sin(uTime * 0.11 + n) + (i == 1 ? 0.35 * uPhrase : 0.0)), l = how[i].z * (1.0 - up) + up * 0.025 * sin(uTime * 0.53 + n) * (0.5 + uLow);
    btO[i] = vec3(at[i].x, 0.18 * abs(l) - smin(0.03 - at[i].y, dr - btW, 0.1), at[i].z);
    vec2 h = normalize(how[i].xy + y * vec2(-how[i].y, how[i].x)), k = normalize(vec2(1.0 - 0.5 * l * l, l));
    btM[i] = mat3(h.x, 0.0, h.y, -h.y * k.y, k.x, h.x * k.y, -h.y * k.x, -k.y, h.x * k.x);
  }
  vec3 ro = vec3(0.0, btH, 0.0), rd = normalize(vec3(p - btHor, btF));
  float down = min(rd.y, -1e-3), tw = (btW - btH) / down;
  vec3 P = ro + rd * tw;
  float depth = btW - btBed(P.xz), wat = smoothstep(-0.03, 0.03, depth), tg = mix((btW - depth - btH) / down, tw, wat);
  vec2 tt = btWallT(ro, rd);
  if (uOwn[6] > 0.0) { if (ro.y + rd.y * tt.x > 5.0 - 7.0 * btA) tt.x = -1.0; if (ro.y + rd.y * tt.y > 4.7 - 6.7 * btA) tt.y = 0.0; }
  bool low = rd.y < -1e-3 && tg < (ro.z + rd.z * tt.x < 46.0 && tt.x > 0.0 ? tt.x : rd.x * tt.y > 1.6 ? tt.y : 1e4);
  P = ro + rd * tg;
  vec2 g = P.xz;
  float pz = g.y * g.y * btPx / btH, shade = mix(btShade(P), 1.0, btFog * 0.7), under = 1.0;
  for (int i = 0; i < 3; i++) under *= 1.0 - 0.75 * btFall(0.6, 2.2, length(g - btO[i].xz + btSun.xz / btSun.y * 0.5) / btS[i]);
  // ribs in the mud, a film of water between them
  float n2 = noise(g * 0.21 + 9.0), n3 = noise(g * vec2(1.1, 2.2) + 20.0);
  float ph = (g.y + 0.35 * g.x * (0.4 + n2) + 1.6 * n2 + 0.45 * n3) * TAU / 0.42;
  float amp = btFine(pz, 0.42) * smoothstep(0.15, 0.6, n3) * (0.7 + 0.5 * uTexture + 0.2 * uTone), s = sin(ph), ds = cos(ph);
  float wet = btFall(-0.1, 0.5, 0.25 * (0.5 - n2) - depth);
  float film = btFall(-0.45, 0.3, s * amp + 0.75 - 1.1 * wet - 1.1 * (n2 - 0.45));
  vec3 nm = normalize(vec3(vec2(-0.1, -0.34) * ds * amp * (1.0 - film), 1.0).xzy);
  vec3 sl = btRipple(g, 0.3 + 1.6 * band(1.0 - btDown) + 0.6 * uTexture);
  sl.xy *= 0.3 + 0.7 * smoothstep(0.0, 0.4, depth);
  vec4 back = btBounce(rd, normalize(mix(nm, vec3(-sl.x, 1.0, -sl.y), wat)));
  float look = max(wat, film * 0.8), fr = back.w;
  float sharp = btPx;
  if (low) btPx *= 5.0;
  vec3 col = btFar(low ? P : ro, low ? back.xyz : rd);
  btPx = sharp;
  vec4 rigTwin, rig = btRig(p, p + sl.xy * vec2(0.9, 0.7), low, rigTwin);
  bool twin = false;
  btPart = btCover = 0.0; btGone = 1.0; btWhich = 0; btQ = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    if (btCover > 0.0 || (k == 1 && (!low || look < 0.1))) break;
    twin = k == 1;
    btMarch(twin ? P : ro, twin ? back.xyz : rd, twin ? 60.0 : low ? tg : 1e3, twin ? 14 : 20);
  }
  vec3 boat = btPaint((twin ? P : ro) + (twin ? back.xyz : rd) * btGone);
  if (low) {
    vec3 mir = mix(mix(col, boat, twin ? btCover : 0.0), rigTwin.rgb, rigTwin.a * wat), tint = btTint(p.x);
    vec3 mud = btMud * (0.7 + 0.6 * n3) * mix(1.0, 0.6, wet);
    vec3 base = mud * (btSunC * 1.25 * sat(dot(nm, btSun)) * mix(0.25, 1.0, shade) * under + (btLow * 0.36 + btHigh * 0.2) * mix(0.55, 1.0, under));
    base *= 1.0 - 0.35 * amp * btFall(-0.9, 0.1, ds);
    col = mix(base, mix(base * 0.5, mix(mir, btLow, 0.2) * mix(0.6, 1.0, shade), 0.3 + 0.6 * fr), film) + tint * film * 0.4;
    // water over it, the bed showing where it is thin
    vec3 body = btSea * (btLow * 0.7 + btSunC * 0.4) * mix(0.7, 1.0, shade);
    vec3 sea = mix(mix(base * 0.55, body, 1.0 - exp(-max(depth, 0.0) * 3.2)), mir, sat(0.16 + 0.95 * fr) * (1.0 - 0.45 * abs(uOwn[3])));
    sea = mix(sea, sea * 0.6 + btLow * 0.4, 0.3 * uPad) + tint * (0.4 + 0.5 * sea.g);
    if (uOwn[7] > 0.0) { vec2 fl = btE(g, pz); sea = mix(sea, vec3(0.8, 0.86, 0.93) * fl.y * (btLow * 0.7 + btSunC * 0.35 * mix(0.35, 1.0, shade) * under) + tint * 0.4, fl.x * btD * smoothstep(0.0, 0.2, depth)); }
    col = mix(col, sea, wat) + btRing(g - vec2(-0.4, 9.6)) * (0.3 + 0.6 * look);
    // a cue's sun along the creek
    float lane = (p.x - btHor.x + 0.045 + 0.01 * sl.z) / (0.03 + 0.2 * btDown);
    col += vec3(1.3, 0.85, 0.42) * uCue * exp(-lane * lane) * (0.1 + 0.6 * look) * max(0.55 + sl.z, 0.0) * btFall(0.4, 1.0, btDown);
    col = btAir(col, tg);
  }
  col += vec3(1.1, 0.72, 0.36) * uCue * exp(-13.0 * length((p - btHor + vec2(0.045, -0.01)) * vec2(1.0, 1.7)));
  if (!twin) col = mix(col, boat, btCover);
  col = mix(col, rig.rgb, rig.a) + rig.rgb * (1.0 - rig.a);
  return dep < -e ? col : mix(col, btCorner(p, dep, e), btIn(-dep, e));
}

const float btDeck = 4.3;
// How much sun comes between the planks to a place.
float btBars(vec3 P, float px) {
  vec2 q = P.xz + btSun.xz / btSun.y * (btDeck - P.y);
  float f = q.y / 0.46, w = 0.1 + 0.12 * hash11(floor(f)), soft = 0.05 + px / 0.46, slit = mix(0.24, btIn(abs(fract(f) - 0.5) - w, soft), btFine(px, 0.46));
  slit *= 0.25 + 0.75 * smoothstep(0.06, 0.16, abs(fract(q.x / 1.3 + 0.5) - 0.5) * 2.0);
  return mix(slit, 1.0, max(btA, smoothstep(4.6, 4.9, abs(q.x))));
}
vec4 btR(vec3 o, vec3 d, float far) {
  float t = (4.65 - o.x) / min(d.x, -1e-3), px = (t + far) * btPx; vec3 q = o + d * t;
  float y = q.y - btDeck, z = abs(fract(q.z / 3.3 + 0.06) - 0.5) * 3.3, pz = px * max(q.z / max(o.x - 4.65, 1.0), 1.0);
  float m = max(btIn(abs(y + 0.1) - 0.2, px), max(btIn(abs(y - 1.0) - 0.05, px), btIn(max(abs(y - 0.5) - 0.5, abs(fract(q.z / 0.55) - 0.5) * 0.55 - 0.03), pz)));
  m = max(m, btIn(max(1.65 - z - 0.06, abs(y - 1.2) - 1.2), pz));
  float g = (fract(q.z / 3.3 + 0.56) - 0.5) * 3.3 / max(q.z, 1.0), l = length(vec2(g * (o.x - 4.65), y - 2.5 - g * (q.y - o.y))), lit = 0.25 + 1.5 * btNight + uKeys;
  vec3 c = mix(btAir(0.09 * btLow, t + far), vec3(1.3, 0.85, 0.42) * lit, btIn(l - 0.2, px));
  return vec4(c + vec3(0.6, 0.35, 0.12) * lit * exp(-l * 8.0), max(max(m, btIn(l - 0.2, px)), btNight * exp(-l * 8.0))) * btB * step(0.0, t) * step(q.z, 24.0);
}
vec3 btPier(vec2 p) {
  const float slope = 0.085;
  btW = -0.98 + 0.5 * btTide + 0.05 * sin(uTime * 0.045) + 0.045 * sin(uTime * 0.55) * (0.6 + 0.4 * uDrone) + 0.65 * uOwn[1];
  vec3 ro = vec3(0.7 + 8.5 * btB, btH, 0.0), rd = normalize(vec3(p - btHor, btF));
  float den = rd.y + slope * rd.z, tb = -btH / min(den, -1e-4), tw = (btW - btH) / min(rd.y, -1e-3);
  vec2 w = (ro + rd * tw).xz;
  float lap = 0.15 * (noise(vec2(w.x * 0.7, 9.0 * sin(uTime * 0.014))) - 0.5), depth = btW + slope * w.y + lap;
  float wat = smoothstep(-0.012, 0.012, depth), tg = mix(tb, tw, wat);
  bool low = den < -1e-4 && (rd.y < -1e-3 || wat < 0.5);
  vec3 P = ro + rd * tg;
  float px = tg * btPx, pz = px * max(P.z, 0.1) / btH;
  float wet = btFall(0.0, 0.42, -depth), n3 = noise(P.xz * vec2(2.2, 3.4) + 9.0);
  vec3 sl = btRipple(P.xz, 1.0 + 0.6 * uTexture);
  sl.xy *= wat + 0.15;
  vec4 back = btBounce(rd, normalize(vec3(-sl.x, 1.0, -sl.y)));
  // the planks overhead, or the open sky
  vec3 o = low ? P : ro, r = low ? back.xyz : rd, col = btSky(r);
  float td = (btDeck - o.y) / max(r.y, 1e-3), pd = (low ? 3.0 * (td + tg) : td) * btPx * max(td * r.z, 1.0) / 3.0;
  vec3 c = o + r * td;
  float gap = btFall(0.05, 0.1 + pd, abs(fract(c.z / 0.46) - 0.5)) * btFine(pd, 0.46) * step(0.1, abs(fract(c.x / 1.3 + 0.5) - 0.5));
  vec3 wood = vec3(0.09, 0.073, 0.057) * btRock * (0.7 + 0.5 * hash11(floor(c.z / 0.46 + 0.5))) * (btLow * 0.6);
  col = mix(col, btAir(mix(wood, btLow * 1.2 + btSunC * 0.3, gap), 5.0 * td), btFall(4.65, 4.75, abs(c.x)) * step(1e-3, r.y) * (1.0 - smoothstep(0.0, 0.25, btA - hash11(floor(c.z / 0.46 + 0.5)) * 0.7)) * (1.0 - sat(btB * 3.0) * step(24.0, c.z)));
  if (uOwn[6] < 0.0 && low) { vec4 f = btR(P, back.xyz, tg); col = mix(col, f.rgb, f.a); }
  // the posts, then their doubles
  vec4 posts = vec4(0.0), twin = posts;
  float ice = 0.0;
  for (int k = 0; k < 14; k++) {
    if (posts.a > 0.98 || (k > 6 && (!low || twin.a > 0.98 || max(wat, wet) < 0.1))) break;
    bool up = k < 7;
    float z = 3.1 + 3.3 * float(k % 7), t = up ? z / rd.z : (z - P.z) / max(back.z, 1e-3);
    vec3 q = up ? ro + rd * t : P + back.xyz * t;
    if (t < 0.0 || (up && low && t > tg) || q.y > btDeck) continue;
    if (uOwn[7] > 0.0) ice = btD * 0.9 * pow(noise(vec2(q.x * 8.0, z)), 3.0);
    float id = clamp(floor(q.x / 2.6), -2.0, 1.0), h = hash21(vec2(id + 5.0, z)), p1 = t * btPx;
    float grain = noise(vec2(q.x * 34.0 + h * 40.0, q.y * 2.0)), lump = noise(rot(0.7) * q.xy * 21.0 + h * 9.0);
    float y = q.y - 0.16 * (grain - 0.5), weed = btFall(0.5, 0.72, y), shell = btFall(1.2, 1.5, y - 0.2 * lump) * (1.0 - weed);
    float R = 0.17 * (0.85 + 0.3 * h) * (1.0 + 0.6 * uOwn[5]) + 0.025 * shell * lump + 0.03 * weed * lump, d = q.x - (id + 0.5 + (h - 0.5) * 0.4 * btA) * 2.6 - (h - 0.5) * (0.05 + 0.2 * btA) * q.y;
    float u = clamp(d / R, -1.0, 1.0), beam = btIn(max(abs(q.x) - 4.6, btDeck - 0.36 - ice - q.y), p1) * step(btA, 0.15 + 0.3 * h);
    float brace = btIn(abs(q.y - mix(1.5, 3.7, abs(2.0 * fract(q.x / 5.2 + 0.25) - 1.0))) - 0.085, 1.5 * p1) * step(abs(q.x), 3.9) * float(k % 7 & 1) * step(btA, 0.2);
    float post = btIn(abs(d) - R, p1);
    if (uOwn[6] > 0.0) post *= btIn(q.y - 0.3 * grain * btA - mix(btDeck, -0.4 + 4.2 * hash21(vec2(z, id)), btA), 2.0 * p1);
    float m = max(post, max(beam, brace));
    if (m <= 0.0) continue;
    vec3 nn = post > 0.5 ? vec3(u, 0.0, -sqrt(1.0 - u * u)) : vec3(0.0, 0.0, -1.0);
    vec3 cc = mix(vec3(0.17, 0.13, 0.1) * btRock * (0.5 + 0.9 * grain), vec3(0.66, 0.61, 0.53) * (0.2 + lump * lump * 1.3), post * shell);
    cc = mix(cc, vec3(0.02) + vec3(0.03, 0.035, 0.012) * lump, post * weed);
    if (uOwn[7] > 0.0) cc = mix(cc, vec3(0.75, 0.82, 0.9), btD * max(0.7 * (shell + weed) * post, btIn(q.y - btDeck + 0.36, p1) * beam * (1.0 - post)));
    vec3 L = btLow * (0.07 + 0.4 * u * u * post * (0.7 - 0.3 * u)) + btSunC * btBars(q, p1) * (sat(dot(nn, btSun)) + 0.04) * 1.5;
    cc = btAir(cc * L + post * shell * lump * exp(-0.25 * t) * (0.5 * uKind[4] * uHits + 0.6 * btLow * uKeys), 3.0 * (up ? t : t + tg));
    if (up) posts += vec4(cc, 1.0) * m * (1.0 - posts.a); else twin += vec4(cc, 1.0) * m * (1.0 - twin.a);
  }
  if (low) {
    vec3 tint = btTint(p.x);
    float wave = (P.z - 18.0 + 16.0 * uCue) * 0.28;
    vec3 sun = btSunC * btBars(P, pz) * (0.75 + 0.8 * band(1.0 - btDown) * uEnergy + 2.0 * uCue * exp(-wave * wave)) * (1.0 + 1.5 * tint);
    vec3 base = btMud * mix(1.25, 0.62, wet) * (0.8 + 0.4 * n3) * (sun * 0.9 + btLow * 0.3);
    vec3 mir = col * (1.0 - twin.a) + twin.rgb;
    col = mix(base, mir, wet * sat(0.08 + 0.8 * back.w) * (0.6 + 0.4 * n3));
    vec3 sea = mix(base * 0.8, btSea * (btLow * 0.8 + sun * 0.35), 1.0 - exp(-max(depth, 0.0) * 3.5));
    if (uOwn[7] > 0.0) { vec2 fl = btE(P.xz * 1.3, pz); sea = mix(sea, vec3(0.8, 0.86, 0.93) * fl.y * (btLow * 0.6 + sun * 0.4), fl.x * btD * smoothstep(0.1, 0.4, depth)); back.w *= 1.0 - fl.x * btD; }
    sea = mix(sea, mir, sat(0.1 + 0.95 * back.w)) * (1.0 - 0.15 * uPad) + 0.13 * uPad * btLow + tint * 0.3;
    col = mix(col, sea, wat);
    col += (btLow * 0.5 + sun * 0.25) * btFall(0.0, 0.03, abs(depth - 0.015)) * smoothstep(-0.3, 0.3, sl.z) * (0.4 + 0.6 * uTexture) * (1.0 + 1.2 * uPhrase * uKind[3]);
    col = btAir(col + btRing(P.xz - vec2(-0.8, 7.2)) * max(wat, wet) * 1.4, 1.5 * tg);
  }
  col = col * (1.0 - posts.a) + posts.rgb;
  if (uOwn[6] < 0.0) { vec4 f = btR(ro, rd, 0.0); col = mix(col, f.rgb, f.a * (low && tg < (4.65 - ro.x) / min(rd.x, -1e-3) ? 0.0 : 1.0)); }
  return col;
}
vec3 render(vec2 p) {
  btSetup();
  float lowEye = sat(-uOwn[4]), near = sat(uOwn[4]);
  bool pier = uVar > 0.5;
  float tall = 1.0 - smoothstep(0.7, 1.3, uRes.x / uRes.y); // stand back
  btF = pier ? 1.0 : (1.3 + 0.65 * near) * (1.0 - 0.2 * tall);
  btH = pier ? 1.6 - 0.85 * lowEye + 1.2 * near : 4.2 - 2.3 * lowEye;
  btHor = pier ? vec2(0.15, -0.03 - 0.06 * lowEye + 0.1 * near) - vec2(0.12 * tall - 0.35 * btB, 0.0) : vec2(-0.14 * near - 0.1 * tall, 0.25 - 0.13 * lowEye + 0.2 * near);
  if (pier) btSun = normalize(vec3(-0.42, 0.85 - 0.25 * sat(uOwn[0]), 0.3 + btSun.z * 0.2));
  if (pier && uOwn[7] < 0.0) btSun = normalize(mix(btSun, vec3(-0.05, 0.2, 0.95), btC));
  btPx = 1.0 / (uRes.y * btF);
  btDown = (btHor.y - p.y) / (btHor.y + 0.5);
  vec3 c = screenOf((pier ? btPier(p) : btHarbour(p)) * 1.4);
  if (uOwn[7] < 0.0) c = min(c, 1.0);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.5);
  if (uOwn[7] > 0.0) for (int i = 0; i < 3; i++) {
    float sc = 9.0 + 7.0 * float(i); vec2 g = p * sc + vec2(0.6 * sin(uTime * 0.2 + float(i)), uTime * (0.9 + 0.2 * float(i))), id = floor(g), h = hash22(id + 31.0 * float(i));
    c = mix(c, vec3(0.94, 0.96, 1.0), btD * 0.8 * btFall(0.02, 0.05 + 0.05 * h.x, length(g - id - 0.25 - 0.5 * h)) * step(0.45, h.y));
  }
  return c;
}
