// name: Worn passage
// a: Desert slot
// b: Melt hall
// what: Between two leaning walls of sandstone that flow past each other in beds of apricot and rust, violet where the light fails, with a crooked strip of sky high up and pale sand at the foot; or a hall melted through a glacier, its blue walls cupped all over and letting the day in, a stream running out of the light.
// follows: The piece is written up the walls bed by bed and the playhead climbs it; drone parts the walls, pad warms the light, phrase lights one seam, texture sifts sand or lets drops fall, the bands brighten their own beds or lengths of ice, keys glint. A hit stands a shaft of sun in the passage, a cue floods it from far to near, and the music walks us on.
float wpGap, wpZ; // how far the walls stand apart, where the eye is along the passage
const float wpFoot = -0.8, wpRim = 2.9;
bool wpIce;
// A smooth step that may run either way.
float wpS(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
// The middle of the passage at a height and a place along it (all repeats after 64).
float wpMid(float y, float z) {
  vec3 s = wpIce ? sin(vec3(0.58905 * z + 0.5, 0.98175 * z + 0.7 * y, 0.0)) : sin(vec3(0.98175 * z + 0.4 * y, 1.9635 * z - 0.9 * y + 1.0, 0.58905 * z + 2.0));
  return wpIce ? 1.15 * s.x + 0.1 * s.y : 0.62 * s.x + 0.17 * s.y + 0.12 * y * s.z;
}
float wpWall(vec3 p) {
  float dx = p.x - wpMid(p.y, p.z), side = wpIce ? clamp(dx * 1.6, -1.2, 1.2) : dx > 0.0 ? 1.0 : -1.0;
  float bend = sin(0.7854 * p.z - 1.1 * p.y + side);
  vec2 s = sin(vec2((wpIce ? 0.98175 : 1.66897) * p.z + 1.3 * p.y + side * 1.2 + 1.1 * bend, 2.65072 * p.z - 2.1 * p.y + side));
  float rid = sqrt(s.x * s.x + 0.008);
  if (!wpIce) return (wpGap + 0.5 * rid + 0.05 * s.y - 0.07 * p.y + 1.8 * wpS(2.1, 3.4, p.y) - abs(dx)) * 0.5;
  // an arch, higher and steeper on one side
  vec2 q = vec2(dx, p.y + 0.5 - 0.25 * dx) / vec2(1.35 + wpGap, 1.3);
  return (1.0 + 0.26 * rid + 0.06 * s.y - length(q)) * 0.7;
}
float wpMap(vec3 p) { return smin(wpWall(p), p.y - wpFoot, wpIce ? 0.04 : 0.1); }
vec3 wpNormal(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0) * e;
  return normalize(k.xyy * wpMap(p + k.xyy) + k.yyx * wpMap(p + k.yyx) + k.yxy * wpMap(p + k.yxy) + k.xxx * wpMap(p + k.xxx) + 1e-9);
}
// Noise that repeats along the passage with everything else (n cells in 64).
float wpNoise(vec2 q, float n) {
  vec2 i = floor(q), f = q - i; f = f * f * (3.0 - 2.0 * f);
  vec4 c = vec4(i, i + 1.0); c.yw = mod(c.yw, n);
  return mix(mix(hash21(c.xy), hash21(c.zy), f.x), mix(hash21(c.xw), hash21(c.zw), f.x), f.y);
}
// Height within the beds of the rock.
float wpBed(vec3 p) {
  return p.y + 0.45 * p.x + 0.18 * sin(0.98175 * p.z + 1.7 * p.x) + 0.1 * sin(1.9635 * p.z + p.x * 2.0 + p.y * 1.4);
}
// What the piece has at a height (time, the oldest bed lowest) and a distance (the front of the room is near).
vec4 wpPiece(float h, float far) { return piece(vec2(clamp((h + 0.8) / 2.9, 0.02, 0.98), clamp(1.05 - 0.2 * far, 0.03, 0.97))); }
vec3 wpInk(vec3 k) { return k * k / max(max(k.r, max(k.g, k.b)), 0.05); }
// How near a ray passes a line of light standing in the passage: 1 on it. tc gets how far along the ray.
float wpShaft(vec3 ro, vec3 rd, vec3 foot, vec3 d, float w, out float tc, out float up) {
  vec3 r = ro - foot;
  float b = dot(rd, d), dd = max(1.0 - b * b, 1e-3), e = dot(rd, r), f = dot(d, r);
  tc = (b * f - e) / dd; up = (f - b * e) / dd;
  vec3 g = r + rd * tc - d * up;
  return exp(-dot(g, g) / (w * w));
}
// Facing the light, softly: the bounce comes from everywhere on that side.
float wpWrap(vec3 n, vec3 l) { float a = 0.5 + 0.5 * dot(n, l); return a * a; }

vec3 wpSlot(vec3 ro, vec3 rd, float t, bool sky, vec2 sp, float px) {
  float zs = wpZ + 2.3 + 0.15 * sin(TAU * uLoop);
  vec3 col, foot = vec3(wpMid(wpFoot, zs), wpFoot, zs), sd = normalize(vec3(wpMid(2.6, zs + 1.0), 2.6, zs + 1.0) - foot);
  float zone = 0.0;
  if (sky) col = mix(vec3(1.0, 0.95, 0.9), vec3(0.45, 0.68, 1.0), sat(rd.y * 1.3)) * 1.9;
  else {
    vec3 p = ro + rd * t, n = wpNormal(p, 0.003 + 0.002 * t);
    float h = wpBed(p), fp = px * t / max(abs(dot(n, rd)), 0.15), far = p.z - wpZ;
    float sand = wpS(0.35, 0.8, n.y) * wpS(wpFoot + 0.12, wpFoot + 0.05, p.y);
    vec4 m = wpPiece(h, far);
    // beds: broad, fine and finest
    float b0 = wpNoise(vec2(h * 4.5, p.z * 0.5), 32.0), b1 = wpNoise(vec2(h * 17.0 + 9.0, p.z * 0.5 + p.x), 32.0), b2 = wpNoise(vec2(h * 58.0, p.z + p.x), 64.0);
    float b3 = wpNoise(vec2(h * 190.0, p.z * 4.0), 256.0), f3 = 1.0 / (1.0 + fp * fp * 300000.0);
    float f1 = 1.0 / (1.0 + fp * fp * 2000.0), f2 = 1.0 / (1.0 + fp * fp * 30000.0);
    float lay = (b0 - 0.5) * 1.3 + ((b1 - 0.5) * 0.7 * f1 + (b2 - 0.5) * 0.6 * f2 + (b3 - 0.5) * 0.8 * f3) * (1.1 + 0.4 * uTone + 0.8 * m.a);
    // sand grains, and the small shelves the softer beds leave
    float grain = wpNoise(vec2(h * 210.0, mod(p.z, 8.0) * 210.0), 1680.0) * 0.6 + wpNoise(vec2(h * 90.0 + 7.0, mod(p.z, 8.0) * 60.0), 480.0) * 0.4;
    grain = (grain - 0.5) * f2 * 0.6;
    float shelf = (b2 - wpNoise(vec2(h * 58.0 + 0.6, p.z + p.x), 64.0)) * f2;
    // how open the place is, how the bounce meets it
    float o1 = sat(wpMap(p + n * 0.25) / 0.14), o2 = sat(wpMap(p + n * 0.3 + vec3(0.0, 0.5, 0.0)) / 0.2);
    vec3 l = normalize(vec3(0.85, 0.75 + 0.2 * cos(TAU * uLoop), -0.15));
    float key = wpWrap(n, l), low = sat((wpRim - p.y) / (wpRim - wpFoot));
    zone = 0.5 + 0.5 * sin(0.98175 * p.z + 0.5 * p.y + 1.4 + 0.5 * sin(TAU * uLoop));
    float nb = -0.2 + 3.2 * low * (1.0 - 0.4 * zone) + 1.5 * (1.0 - o1) + 1.0 * (1.0 - o2) + 2.6 * (1.0 - key) - 1.2 * zone - lay * 1.5 - 0.5 * uPad * key + 0.9 * wpS(1.7, 0.0, far);
    nb = max(nb, 0.0);
    col = pow(vec3(0.95, 0.64, 0.41), vec3(nb)) * exp(-0.22 * nb) * 1.8;
    col += mix(vec3(0.09, 0.06, 0.26), vec3(0.22, 0.07, 0.16), 0.6 * uPad) * (0.25 + 0.75 * o1) * (0.5 + 0.35 * n.y) * (1.0 + 1.6 * lay) * (1.0 - 0.5 * key);
    col += vec3(0.34, 0.10, 0.03) * wpWrap(n, normalize(vec3(-0.8, 0.1, -0.5 * cos(0.98175 * p.z)))) * (0.2 + 0.8 * o1) * zone * low * (1.0 + lay);
    col *= 1.0 + grain + 0.55 * shelf;
    vec3 sc = pow(vec3(0.97, 0.76, 0.58), vec3(nb * 0.7)) * exp(-0.14 * nb) * 1.3;
    float rip = wpNoise(vec2(p.x * 5.0, p.z * 16.0 + 3.0 * wpNoise(p.xz * vec2(3.0, 2.0), 128.0)), 1024.0);
    col = mix(col, sc * (0.8 + 0.4 * rip), sand);
    // the piece tints its beds; the bands brighten theirs; the playhead climbs
    vec3 ink = wpInk(m.rgb / max(max(m.r, max(m.g, m.b)), 0.02));
    col = mix(col, col * (0.5 + 1.6 * ink), 0.6 * sat(m.a * 1.4) * (0.5 + 0.5 * b1) * (1.0 - 0.8 * sand));
    float lv = band((h + 0.8) / 3.6);
    col *= 1.0 + uEnergy * lv * lv * wpS(0.4, 0.8, b1) * 1.2;
    float ph = (h + 0.8) / 2.9 - uLoop;
    col *= 1.0 + 0.4 * exp(-ph * ph * 260.0) * sin(PI * uLoop);
    // one seam answers the phrase
    float se = h - 0.35 - 0.05 * sin(1.27627 * p.z), sw = 0.007 + fp * 1.2;
    col += (0.7 * wpInk(uKind[3]) + vec3(0.5, 0.28, 0.1)) * uPhrase * exp(-se * se / (sw * sw)) * (0.4 + uEnergy) * (0.4 + key) * (1.0 - sand);
    float gl = wpNoise(vec2(h * 70.0, p.z * 64.0), 4096.0);
    col += vec3(1.0, 0.9, 0.75) * uKeys * wpS(0.82, 0.95, gl) * f2 * (0.3 + key) * (1.0 - sand);
    // a flood of light from far to near
    float cz = far - mix(0.2, 5.0, uCue);
    col *= 1.0 + 2.2 * uCue * exp(-cz * cz * 0.8) * (0.4 + key);
    vec3 pf = p - foot; pf -= sd * dot(pf, sd);
    float pool = exp(-dot(pf, pf) * 10.0);
    col += vec3(1.0, 0.78, 0.5) * pool * (0.4 + 0.9 * uHits + 0.3 * uMic) * (0.15 + 0.85 * sat(n.y)) * (0.8 + 0.4 * rip);
  }
  vec3 air = mix(vec3(0.16, 0.07, 0.14), vec3(1.0, 0.5, 0.22), zone);
  col = mix(col, air * 0.6, (1.0 - exp(-(0.03 + 0.06 * uSpace) * t)) * (sky ? 0.3 : 1.0));
  float tc, up, sh = wpShaft(ro, rd, foot, sd, 0.12, tc, up);
  sh *= wpS(tc - 0.7, tc + 0.1, t);
  float dust = 0.55 + 0.9 * wpNoise(sp * 14.0 + vec2(0.0, 0.2 * uTime), 4096.0) * wpNoise(sp * 33.0 + vec2(3.0, 0.11 * uTime), 4096.0);
  col += vec3(1.0, 0.76, 0.46) * sh * (0.04 + 1.0 * uHits + 0.2 * uCue) * dust;
  // sand sifting from a ledge
  sh = wpShaft(ro, rd, vec3(wpMid(0.0, wpZ + 1.9) + 0.22, wpFoot, wpZ + 1.9), vec3(0.0, 1.0, 0.0), 0.05, tc, up);
  float fall = 0.35 * wpNoise(vec2(sp.x * 90.0, up * 2.0 + mod(0.9 * uTime, 4096.0)), 4096.0) + wpNoise(vec2(sp.x * 260.0, up * 14.0 + mod(6.0 * uTime, 4096.0)), 4096.0);
  col += vec3(1.0, 0.72, 0.42) * sh * fall * uTexture * 0.55 * wpS(tc - 0.1, tc + 0.05, t) * wpS(1.5, 0.9, up) * wpS(-0.05, 0.1, up);
  return col * (0.8 + 0.3 * uTone + 0.2 * uLevel);
}

// Cups in the ice: the way to the middle of the cup, then how near its middle. They run together softly at the crests.
vec3 wpCups(vec2 x, float n, float k) {
  vec2 i = floor(x), f = x - i, g = vec2(0.0); float a = 0.0;
  for (int m = 0; m < 9; m++) {
    vec2 o = vec2(m % 3 - 1, m / 3 - 1), c = i + o; c.y = mod(c.y, n);
    vec2 r = o + 0.5 + 0.8 * (hash22(c) - 0.5) - f;
    float w = exp(-k * dot(r, r)) + 1e-6;
    a += w; g += w * r;
  }
  return vec3(g / a, -log(a) / k);
}
// Light let through the ice at a place: thin under the roof here and there, thick low down.
vec3 wpThrough(vec3 p, float lay) {
  float far = p.z - wpZ;
  float th = 1.1 + 1.1 * sat(0.6 - p.y) + 1.1 * sin(0.7854 * p.z + 1.3 * p.x + 1.0) * sin(1.27627 * p.z - p.y + 0.8 * p.x) + lay - 0.1 * far + 0.9 * wpS(2.2, 0.0, far);
  th = 0.5 * (th + sqrt(th * th + 0.25));
  return exp(-th * vec3(2.8, 0.8, 0.36)) * (1.0 + 0.9 * exp(-2.0 * th)) * mix(vec3(1.05, 1.15, 1.2), vec3(1.9, 1.35, 1.1), uPad);
}
// A drip: how far aside and ahead it falls, and how far it has come (it lands at 0.45, then its ring spreads).
vec3 wpDrip(int i) { float k = float(i); return vec3(0.3 - 0.45 * k, 2.1 + 0.9 * k, fract(uTime * (0.23 + 0.06 * k) + 0.4 * k)); }
vec3 wpHall(vec3 ro, vec3 rd, float t, bool sky, vec2 sp, float px) {
  vec3 mouth = vec3(0.82, 0.94, 1.0) * 1.7, col = mouth;
  float zs = wpZ + 2.4 + 0.15 * sin(TAU * uLoop);
  vec3 foot = vec3(wpMid(wpFoot, zs) + 0.45, wpFoot, zs), sd = normalize(vec3(-0.3, 1.0, 0.15));
  if (!sky) {
    vec3 p = ro + rd * t, n = wpNormal(p, 0.004 + 0.002 * t);
    float far = p.z - wpZ, dx = p.x - wpMid(p.y, p.z), wall = wpWall(p), fp = px * t / max(abs(dot(n, rd)), 0.15);
    bool ground = wall > p.y - wpFoot;
    float near = exp(-max(6.0 - far, 0.0) * 0.32), arc = atan(p.y + 0.95, dx) * 1.6, fine = 1.0 / (1.0 + fp * 40.0);
    // cups melted in the walls, stones on the ground
    vec2 cu = vec2(arc * 5.0, p.z * 3.5) + vec2(0.35, 0.3) * sin(vec2(1.9635 * p.z + arc, 3.0 * arc));
    vec3 cup = wpCups(ground ? p.xz * vec2(13.0, 12.0) + 0.6 * sin(p.zx * vec2(3.92699, 9.0)) : cu, ground ? 768.0 : 224.0, 42.0 / (1.0 + fp * (ground ? 900.0 : 250.0)));
    vec3 L = normalize(vec3(0.15, 0.4, 0.85));
    float flood = far - mix(0.3, 6.0, uCue);
    flood = uCue * exp(-flood * flood * 0.5);
    float h = wpBed(p);
    vec4 m = wpPiece(1.5 * h + 0.4, far);
    vec3 ink = wpInk(m.rgb / max(max(m.r, max(m.g, m.b)), 0.02));
    vec3 pf = p - foot; pf -= sd * dot(pf, sd);
    float pool = exp(-dot(pf, pf) * 12.0) * (0.06 + 0.9 * uHits + 0.3 * uMic);
    if (!ground) {
      vec3 T1 = normalize(cross(vec3(0.0, 0.0, 1.0), n) + 1e-6), T2 = cross(n, T1);
      vec3 N = normalize(n + (-cup.x * T1 + cup.y * T2) * 1.6 * fine);
      float b1 = wpNoise(vec2(h * 7.0, p.z * 0.5), 32.0), b2 = wpNoise(vec2(h * 31.0, p.z), 64.0);
      float lay = (0.7 + 0.6 * m.a) * (b1 - 0.5) + 0.35 * (b2 - 0.5), crest = wpS(0.0, 0.3, cup.z), dif = sat(dot(N, L)) * wpS(0.0, 0.25, dot(n, -rd));
      float lv = band(sat(far / 6.5)), ph = 0.5 + 0.35 * h - uLoop;
      col = wpThrough(p, lay + (0.9 * crest - 0.4) * fine);
      col = mix(col, col * (0.4 + 1.8 * ink) + 0.03 * ink, 0.6 * sat(m.a * 1.4) * b1);
      col *= (0.5 + 1.4 * wpWrap(N, L)) * (0.35 + 0.65 * sat((p.y - wpFoot) / 0.2)) * (1.0 + 0.9 * uEnergy * lv * lv + 2.0 * flood + 0.4 * exp(-ph * ph * 200.0) * sin(PI * uLoop));
      col += mouth * dif * dif * near * 1.1 * (1.0 + flood) * sat((p.y - wpFoot) / 0.12);
      vec3 hh = normalize(L - rd + 1e-4);
      col += mouth * pow(sat(dot(N, hh)), 160.0) * (0.03 + 0.5 * near + 0.7 * uKeys) * 0.7 * wpS(0.0, 0.3, dot(n, -rd));
      col += mouth * uKeys * wpS(0.82, 0.95, wpNoise(vec2(arc * 45.0, p.z * 32.0), 2048.0)) * fine * fine * 0.6;
      float se = h - 0.3 - 0.12 * sin(1.27627 * p.z + arc) - 0.1 * cup.z, sw = 0.03 + fp * 1.2;
      col += (0.5 * wpInk(uKind[3]) + vec3(0.1, 0.25, 0.35)) * uPhrase * exp(-se * se / (sw * sw)) * (0.5 + 0.9 * uEnergy) * (0.3 + b2);
      col += mouth * pool * 0.5;
    } else {
      float g = wpNoise(p.xz * vec2(60.0, 48.0), 3072.0), g2 = wpNoise(p.xz * vec2(5.0, 4.0), 256.0), g3 = wpNoise(p.xz * vec2(21.0, 16.0), 1024.0);
      float rib = abs(dx - 0.25 * sin(0.98175 * p.z) - 0.1) - 0.62 - 0.14 * sin(1.27627 * p.z + 1.0) - 0.16 * (g2 - 0.5) - 0.05 * (g3 - 0.5);
      float wet = wpS(0.02, -0.02, rib);
      // the stream runs toward us
      vec2 wq = vec2(dx, p.z) * vec2(16.0, 5.0) + vec2(0.0, mod(0.5 * uTime, 320.0));
      vec2 wv = vec2(wpNoise(wq, 320.0) + 0.5 * wpNoise(wq * 2.0 + 5.0, 640.0), wpNoise(wq + 31.0, 320.0) + 0.5 * wpNoise(wq * 2.0 + 47.0, 640.0)) - 0.75;
      for (int i = 0; i < 2; i++) {
        vec3 d = wpDrip(i);
        vec2 to = p.xz - vec2(wpMid(wpFoot, wpZ + d.y) + d.x, wpZ + d.y);
        float rr = length(to), f = sat((d.z - 0.45) / 0.55), w = rr - 0.7 * f;
        wv += to / (rr + 1e-3) * exp(-w * w * 900.0) * step(0.001, f) * (1.0 - f) * uTexture * 9.0;
      }
      vec3 sn = vec3(-cup.x, 0.6, -cup.y) + 0.5 * vec3(g3 - 0.5, 0.0, g - 0.5);
      vec3 wn = normalize(mix(normalize(sn), vec3(0.035 * wv.x, 1.0, 0.05 * wv.y), wet));
      vec3 r = reflect(rd, wn); r.y = abs(r.y);
      float u = 0.06;
      for (int i = 0; i < 7; i++) u += wpMap(p + r * u);
      vec3 q = p + r * u;
      float qf = q.z - wpZ, fre = 0.1 + 0.9 * pow(1.0 - sat(dot(wn, -rd)), 4.0);
      vec3 rc = mix(wpThrough(q, 0.0) + mouth * exp(-max(6.0 - qf, 0.0) * 0.4) * 0.25, mouth, wpS(5.0, 10.0, qf));
      vec3 stone = vec3(0.012, 0.015, 0.018) * (0.4 + g) + (vec3(0.01, 0.03, 0.05) + mouth * near * 0.07) * sat(dot(wn, L)) * (0.4 + 0.6 * g3) + rc * fre * (0.12 + 0.6 * wpS(0.12, 0.0, rib));
      col = mix(stone, rc * (0.3 + 0.7 * fre) + vec3(0.0, 0.015, 0.025), wet);
      col = col * (0.3 + 0.7 * sat(wall / 0.18)) * (1.0 + 1.5 * flood) + mouth * pool * (0.15 + 0.3 * wet);
    }
    col = mix(col, mouth * vec3(0.36, 0.60, 0.78), 1.0 - exp(-max(far, 0.0) * max(far, 0.0) * (0.003 + 0.005 * uSpace)));
  }
  float tc, up, sh = wpShaft(ro, rd, foot, sd, 0.13, tc, up);
  sh *= wpS(tc - 0.5, tc + 0.1, t) * wpS(1.8, 0.7, up);
  col += vec3(0.7, 0.92, 1.0) * sh * (0.02 + 0.6 * uHits + 0.2 * uCue) * (0.7 + 0.6 * wpNoise(sp * 14.0 + vec2(0.0, mod(0.2 * uTime, 4096.0)), 4096.0));
  for (int i = 0; i < 2; i++) {
    vec3 d = wpDrip(i);
    float f = min(d.z / 0.45, 1.0), y = 1.3 - 1.3 * f * f;
    sh = wpShaft(ro, rd, vec3(wpMid(wpFoot, wpZ + d.y) + d.x, wpFoot, wpZ + d.y), vec3(0.0, 1.0, 0.0), 0.01, tc, up);
    y = (up - y) * 12.0;
    col += mouth * sh * exp(-y * y) * step(f, 0.999) * wpS(0.0, 0.08, f) * step(tc, t) * uTexture;
  }
  return col * (0.8 + 0.3 * uTone + 0.2 * uLevel);
}
// About what colour an edge has that a ray only just passes, to lay softly over what is behind it.
vec3 wpEdge(vec3 p) {
  float far = p.z - wpZ, key = p.x > wpMid(p.y, p.z) ? 0.3 : 0.7, low = sat((wpRim - p.y) / (wpRim - wpFoot)), zone = 0.5 + 0.5 * sin(0.98175 * p.z + 0.5 * p.y + 1.4 + 0.5 * sin(TAU * uLoop));
  float nb = max(-0.1 + 3.2 * low * (1.0 - 0.4 * zone) + 2.6 * (1.0 - key) - 1.2 * zone + 0.9 * wpS(1.7, 0.0, far), 0.0);
  return (pow(vec3(0.95, 0.64, 0.41), vec3(nb)) * exp(-0.22 * nb) * 1.8 + vec3(0.07, 0.04, 0.10)) * (0.8 + 0.3 * uTone + 0.2 * uLevel);
}
vec3 render(vec2 p) {
  wpIce = uVar > 0.5;
  wpGap = 0.34 + 0.02 * sin(uTime * 0.11) + 0.06 * uDrone + 0.04 * uSpace;
  wpZ = mod(uTravel * 0.05, 64.0);
  float z1 = wpZ + 2.2;
  vec3 ro = vec3(wpMid(0.0, wpZ), wpIce ? -0.2 : 0.0, wpZ), at = vec3(wpMid(0.4, z1) + (wpIce ? 0.35 : 0.0), wpIce ? 0.1 : 0.66, z1);
  vec3 fw = normalize(at - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * (wpIce ? 0.8 : 0.7) + rt * p.x + up * p.y);
  float t = 0.05, px = 1.0 / uRes.y, last = 9.0, tl = 0.0, e = 9.0, te = 0.0; bool sky = false;
  for (int i = 0; i < 52; i++) {
    vec3 q = ro + rd * t;
    float d = wpMap(q);
    if (d < 0.0012 * t) break;
    float g = d / t;   // an edge the ray only just passes
    if (!wpIce) { if (g > last && last < e) { e = last; te = tl; } last = g; tl = t; }
    t += d;
    if (q.y > 3.4 && !wpIce || t > 13.0) { sky = true; break; }
  }
  vec3 c; if (wpIce) c = wpHall(ro, rd, t, sky, p, px); else c = wpSlot(ro, rd, t, sky, p, px);
  float soft = 1.0 - sat((e - 0.0012) / (0.9 * px));
  if (soft > 0.0) c = mix(c, wpEdge(ro + rd * te), soft * 0.75);
  return screenOf(pow(max(c, 0.0), vec3(wpIce ? 1.4 : 1.25)) * 1.2);
}
