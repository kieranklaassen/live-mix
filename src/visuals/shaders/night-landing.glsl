// name: Night landing
// a: Window seat
// b: Squid boats
// what: A plain of towns seen at night from a descending aeroplane: streets as beaded strings, a dark river with its bridges, lamps crowding to dust under a last green dusk, the tip of a wing with its red lamp; or a black sea under low cloud, where a fleet of fishing boats burns with pale pillars of light, one boat close by.
// follows: The quarters and boats light up where the piece sounds, low notes to the left and high to the right; each kind has its own family of lamps, the drone the dusk. A hit is lightning inside a far cloud, a cue sends a wave of light over the plain and tips the horizon; keys are headlights or glitter, the voice lights the haze or the near boat.
// own: 0 rose dusk at -1, midnight with pale water at 1; 1 amber lamps at -1, cold white or blue at 1; 2 a few villages or lone boats at -1, towns to the horizon or a full fleet at 1; 3 clear with stars at -1, cloud between or thick haze and bright pillars at 1; 4 the sea comes in or the water lies smooth at -1, snow and hills or drifting ice at 1; 5 low at -1, high up at 1
float nlPx, nlR;          // the size of a pixel; how big a lamp is, in pixels
float nlDusk, nlNight, nlLit; vec3 nlB1, nlB2;   // the hour, and the light left along the edge of the world
vec2 nlF;          // how much ground one pixel takes, across and away
vec3 nlHash(vec2 p) { vec3 q = fract(p.xyx * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
float nlUp(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
float nlE(vec2 v) { return exp(-dot(v, v)); }
float nlSheet(vec2 g) { return noise(g) * 0.5 + noise(g * 2.4 + 7.0) * 0.28 + noise(g * 6.0 + 2.0) * 0.15 + noise(g * 14.0) * 0.07; }
float nlLevel(int k) { return k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : uPhrase; }
vec3 nlInk(int k) { return uKind[k] * uKind[k] * 1.3 + 0.08; }
// The colour of a lamp: 0 old amber, 1 white and cool.
vec3 nlLamp(float k) {
  k = sat(k + 0.75 * uOwn[1]);
  return k < 0.5 ? mix(vec3(1.0, 0.36, 0.07), vec3(1.0, 0.68, 0.34), k * 2.0) : mix(vec3(1.0, 0.68, 0.34), vec3(0.66, 0.92, 1.0), k * 2.0 - 1.0);
}
// Lamps in a row: d is how far off the line we are, s how far along it, n the line's normal, gap from lamp to lamp.
// Far away they are one thin line of the same light.
float nlRow(float d, float s, vec2 n, float gap, float seed) {
  vec2 a = n / nlF, b = vec2(-n.y, n.x) / nlF;
  float bb = dot(b, b), k = d * dot(a, b) / bb, e = s + k, id = round(e / gap), lpx = gap * sqrt(bb);
  vec2 v = a * d + b * (e - gap * id - k);
  float pd = d / length(n * nlF), rr = nlR * nlR;
  float bead = exp(-dot(v, v) / rr) * (0.45 + 1.1 * hash21(vec2(id, seed)));
  float line = exp(-pd * pd / rr) * min(0.6, 1.4 * nlR / lpx);
  return mix(line, bead, nlUp(2.4, 4.5, lpx));
}
// Streets side by side, each with its row; far away they are one even glow.
float nlStreets(float x, float s, vec2 n, float wide, float gap, float seed) {
  float id = round(x / wide), spx = wide / length(n * nlF), lpx = gap * length(vec2(-n.y, n.x) / nlF);
  float far = min(1.0, 1.77 * nlR / spx) * min(1.0, 1.77 * nlR / lpx), see = nlUp(1.6, 4.5, spx);
  if (see <= 0.0) return far * 0.7;
  float keep = 0.12 + nlUp(0.25, 0.5, hash21(vec2(id, seed + 7.0)));
  return mix(far * 0.7, keep * nlRow(x - wide * id, s + 3.1 * id, n, gap, seed + id), see);
}
vec3 nlStars(vec2 q, float more) {
  vec3 h = nlHash(floor(q * 47.0)); vec2 v = (fract(q * 47.0) - 0.1 - 0.8 * h.xy) / 47.0 / max(nlPx, 0.0012);
  return vec3(0.8, 0.9, 1.0) * exp(-dot(v, v) * 1.5) * pow(nlUp(0.8 - 0.25 * more, 1.02, h.z), 3.0) * (0.6 + 0.5 * more);
}
// The plain: d is how far below the edge of the world, edge the colour of the air there.
vec3 nlLand(vec2 q, float d, vec3 edge) {
  float wx = uOwn[3], place = uOwn[4], H = exp2(1.2 * uOwn[5]);
  float z = H / d;
  nlF = vec2(z, z * z / H) * nlPx;
  nlR = 0.62 + 0.26 * (1.0 - uTone) + 0.0009 / (nlPx * (0.6 + 0.25 * z));
  vec2 go = vec2(0.3, 1.0) * uTravel * 0.0042;
  vec2 g = vec2(q.x * z, z) + go, gg = g;
  float ax = g.x - 0.3 * g.y;
  // the river, and the sea when there is one
  float my = g.y + 0.45 * sin(ax * 1.7 + 0.6);
  float rx = ax + 0.35 - 0.5 * sin(my * 0.95 + 0.5) - 0.22 * sin(my * 2.1 + 1.0);
  float o = 1.0 + min(place, 0.0);
  float sea = ax + 0.25 * sin(g.y * 1.3) + 0.12 * sin(g.y * 3.1 + ax) + 0.3 + 60.0 * o * o * o + o;
  float rd = abs(rx) - 0.085 - 0.03 * sin(g.y * 0.8), bankD = min(rd, sea);
  float bend = 0.48 * cos(my * 0.95 + 0.5) + 0.46 * cos(my * 2.1 + 1.0);
  vec2 bn = rd < sea ? vec2(1.0, -0.3 - bend) : vec2(1.0, -0.2);
  float bd = bankD / length(bn), rim; bn = normalize(bn); rim = length(bn * nlF);
  float land = nlUp(-rim, rim + 0.004, bd);
  // where people live
  float pop = 0.62 * noise(g * 0.45 + 3.0) + 0.38 * noise(g * 1.25 + 9.0);
  pop += 0.1 * noise(g * 4.5 + 2.0) + 0.13 * exp(-bd * bd * 3.0) + 0.26 * uOwn[2];
  pop = nlUp(0.42, 0.78, pop + 0.07 * nlUp(1.5, 7.0, z)); pop *= pop;
  // the quarters, each with its streets turned its own way
  g += 0.13 * vec2(sin(g.y * 2.1 + 1.0), sin(g.x * 1.7)) + 0.03 * vec2(sin(g.y * 7.3), sin(g.x * 6.1 + 2.0));
  vec2 v = g * 1.25, c0 = floor(v), r1 = vec2(9.0), r2 = vec2(9.0), id = vec2(0.0); float m1 = 99.0, m2 = 99.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j)), r = c + 0.12 + 0.76 * nlHash(c).xy - v; float m = dot(r, r);
    if (m < m1) { m2 = m1; r2 = r1; m1 = m; r1 = r; id = c; } else if (m < m2) { m2 = m; r2 = r; }
  }
  vec3 h = nlHash(id + 41.0);
  vec2 sn = normalize(r2 - r1 + 1e-4), st = vec2(-sn.y, sn.x);
  float ed = 0.5 * (m2 - m1) / max(length(r2 - r1), 0.05) / 1.25;
  // what is heard there
  vec2 sc = r1 / 1.25 + g - go; float sz = max(sc.y, 0.3);
  float su = 0.5 + sc.x / sz / 1.8;
  vec4 pc = piece(clamp(vec2(su, pow(sat(H / sz / 0.75), 0.6)), 0.01, 0.99));
  int kd = int(h.z * 3.99);
  float heard = pc.a * 1.5 + 0.9 * nlLevel(kd) + 0.8 * band(sat(su)) * (0.4 + 0.6 * uLevel);
  float wave = uCue * exp(-20.0 * (d - 0.75 * uCue) * (d - 0.75 * uCue));
  float live = 0.42 + 1.6 * wave + (0.45 + 1.2 * uEnergy) * heard;
  vec3 tint = mix(vec3(1.0), nlInk(kd) * 1.8, 0.28 * sat(nlLevel(kd) * 1.5));
  tint = mix(tint, pc.rgb * pc.rgb * 2.4 / max(pc.a * pc.a, 0.05), 0.22 * sat(pc.a * 1.5));
  float twk = 1.0 - 0.3 * nlUp(1.5, 6.0, z) * (0.5 + 0.5 * sin(uTime * 1.3 + 40.0 * noise(vec2(q.x * 60.0, d * 300.0))));
  float dim = 1.0 / (1.0 + 0.16 * z * z / (H * H));
  float thin = 1.0 / (1.0 + 0.05 * z * z);
  mat2 R = rot(1.5 * h.x - 0.75); vec2 w = R * g;
  vec2 nx = vec2(1.0, 0.0) * R, ny = vec2(0.0, 1.0) * R;
  float inside = nlUp(0.0, 0.03, ed) * land, gap = 0.072 + 0.035 * h.y;
  float streets = nlStreets(w.x, w.y, nx, gap, 0.03, h.x * 90.0) + 0.8 * nlStreets(w.y, w.x, ny, gap * 1.6, 0.034, h.y * 90.0 + 50.0);
  float full = nlUp(0.25 * h.z, 0.35 + 0.4 * h.z, pop);
  vec3 lampC = nlLamp(h.y < 0.7 ? 0.1 + 0.25 * h.y : 0.4 + 0.6 * h.x);
  vec3 L = lampC * tint * live * streets * 3.0 * inside * full * exp(-0.07 * z);
  // the roads between the quarters
  float road = nlRow(ed - 0.004, dot(g, st), sn, 0.026, 3.0);
  L += nlLamp(0.3) * road * 3.0 * land * pop * nlUp(0.0, 0.25, pop) * (0.5 + 0.5 * live) * thin * mix(vec3(1.0), tint, 0.5);
  // the embankments
  L += nlLamp(0.55) * nlRow(bd - 0.022, my, bn, 0.034, 5.0) * 2.2 * (0.25 + 0.75 * pop) * (0.6 + 0.4 * live);
  // two kinds of great road, over the water by their bridges
  float y1 = gg.y + 0.3 * sin(gg.x * 0.7), i1 = round(y1 / 2.3), d1 = y1 - 2.3 * i1;
  vec2 n1 = normalize(vec2(0.21 * cos(gg.x * 0.7), 1.0));
  float x2 = gg.x - 0.62 * gg.y + 0.35 * sin(gg.y * 0.6), i2 = round(x2 / 3.1), d2 = x2 - 3.1 * i2;
  vec2 n2 = normalize(vec2(1.0, -0.62 + 0.21 * cos(gg.y * 0.6))); d2 *= n2.x;
  float shore = nlUp(-0.5, 0.0, sea);
  float hw = nlRow(abs(d1) - 0.008, gg.x, n1 * sign(d1 + 1e-6), 0.032, i1) + nlRow(d2, gg.y * 1.15, n2, 0.034, i2 + 40.0);
  L += mix(nlLamp(0.45), nlInk(3), 0.3 * uPhrase) * hw * (1.7 + 1.6 * uPhrase) * thin * (0.25 + 0.75 * sqrt(pop)) * shore;
  float car = uTime * 0.011;
  float cars = nlRow(d1 - 0.002, gg.x + car, n1, 0.061, i1 + 60.0) + nlRow(d2 - 0.006, gg.y * 1.15 + car, n2, 0.053, i2 + 80.0);
  float tails = nlRow(d1 + 0.002, gg.x - car, n1, 0.071, i1 + 90.0);
  L += (vec3(1.0, 0.95, 0.82) * cars + vec3(1.0, 0.1, 0.05) * tails) * (0.35 + 3.5 * uKeys) * 1.4 * thin * shore;
  // windows and yards: single lamps
  float lz = max(log2(z), 0.0), lf = floor(lz);
  for (int k = 0; k < 2; k++) {
    float lv = lf + float(k), wt = 1.0 - abs(lz - lv), s0 = max(0.015, 6.0 * nlPx);
    vec2 cs = s0 * vec2(exp2(lv), exp2(2.0 * lv) * 0.8 / H), gc = gg / cs, ci = floor(gc);
    vec3 hh = nlHash(ci + lv * 17.0), h2 = nlHash(ci + lv * 31.0 + 7.0);
    vec2 e = (gc - ci - 0.12 - 0.76 * hh.xy) * cs / nlF;
    float on = nlUp(hh.z, hh.z + 0.2, 0.03 + (0.6 + 0.4 * noise(gg * 9.0)) * pop), big = h2.y * h2.y; big *= big * big;
    int kk = int(h2.z * 3.99);
    vec3 c = nlLamp(h2.x * 0.95) * (1.0 + 2.0 * nlInk(kk) * nlLevel(kk));
    float rr = nlR * (0.8 + 0.7 * big);
    L += c * exp(-dot(e, e) / (rr * rr)) * on * wt * max(land, 0.02 * nlUp(0.0, -0.5, sea)) * (0.16 + 0.24 * nlUp(1.5, 5.0, z) + 7.0 * big) * (0.4 + 0.6 * live) * (1.0 + 0.16 * z * z) / (1.0 + 0.022 * z * z);
  }
  L *= twk * dim;
  // the ground itself: streets that shine a little, dark fields
  float field = noise(gg * 4.0) * 0.5 + noise(gg * vec2(11.0, 7.0)) * 0.5;
  vec3 earth = (vec3(0.0022, 0.0034, 0.006) + nlDusk * vec3(0.01, 0.012, 0.03) + nlNight * vec3(0.003, 0.005, 0.009)) * (0.5 + field);
  earth += sat(place) * vec3(0.08, 0.11, 0.17) * (0.2 + 0.8 * field) * (1.0 + nlDusk);
  vec3 town = lampC * tint * pop * full * live * (0.011 + 0.03 * sat(uOwn[2])) * (1.0 + 1.5 * sat(place));
  vec3 water = vec3(0.0015, 0.003, 0.006) + (nlLit * nlB2 * 0.35 + nlNight * vec3(0.05, 0.065, 0.09)) * nlUp(0.9, 0.0, d);
  vec3 gnd = mix(water, earth + town, land);
  gnd += nlLamp(0.35) * 0.06 * pop * live * exp(-abs(bd) / 0.028) * (1.0 - land) * noise(vec2(q.x * 90.0, d * 22.0));
  L += gnd;
  // air: far away all of it goes to a warm haze under the dusk
  float air = 1.0 - exp(-z * (0.045 + 0.05 * sat(wx) + 0.03 * min(wx, 0.0) - 0.02 * uSpace) / H);
  vec3 haze = nlLamp(0.12) * (0.012 + 0.02 * uLevel + 0.03 * uMic) * (1.0 + 0.35 * uOwn[2]) + edge * 0.07;
  L = mix(L, haze, air * 0.92);
  // thin cloud between
  float zc = 0.36 / d; vec2 cg = vec2(q.x, 1.0) * zc + go * 4.5;
  float cn = nlSheet(cg * vec2(1.7, 2.2)), fog = max(wx, 0.0);
  float cover = nlUp(0.56 - 0.36 * fog, 0.86 - 0.18 * fog, cn + 0.2 * min(wx, 0.0)) * nlUp(9.0 + 20.0 * fog, 1.5, zc) * (0.62 + 0.22 * fog);
  vec3 vapour = vec3(0.012, 0.016, 0.026) + nlDusk * vec3(0.06, 0.05, 0.1) + nlNight * vec3(0.04, 0.05, 0.07) + lampC * 0.02 * pop + nlLamp(0.15) * 0.016 * live;
  L = mix(L, vapour * (0.6 + 0.8 * cn) * (1.0 + 4.5 * fog * max(cn - 0.4, 0.0)), cover);
  return L;
}
vec3 nlWindow(vec2 p) {
  float bank = 4.0 * uCue * (1.0 - uCue), high = uOwn[5], wx = uOwn[3], place = uOwn[4];
  vec2 q = rot(-0.075 - 0.05 * bank - 0.012 * sin(uTime * 0.05)) * p;
  float hy = 0.25 - 0.06 * high - 0.02 * bank;
  float d = hy - (0.06 + 0.05 * max(high, 0.0)) * q.x * q.x - q.y;
  // the sky: the last green of the day along the edge of the world
  float up = max(-d, 0.0);
  vec3 sky = vec3(0.0035, 0.006, 0.017) + nlDusk * vec3(0.035, 0.03, 0.09);
  float side = 0.55 + 0.45 * nlUp(-0.9, 0.5, q.x);
  sky += nlLit * side * (nlB1 * 4.0 * exp(-up * 60.0) + nlB1 * 0.5 * exp(-up * 18.0) + nlB2 * 0.6 * exp(-up * 7.0));
  vec3 edge = sky;
  // stars
  sky += nlStars(q, max(nlNight, -wx)) * nlUp(0.05, 0.2, up);
  // a far bank of cloud, where the lightning is
  float cx = q.x + 0.0008 * uTime;
  float top = -0.016 + 0.07 * min(wx, 0.0) + 0.085 * nlUp(0.35, -0.35, q.x) * (0.15 + noise(vec2(cx * 4.0, 1.0))) + 0.034 * noise(vec2(cx * 15.0, 4.0));
  float lump = noise(vec2(cx * 22.0, up * 40.0)) * 0.6 + noise(vec2(cx * 55.0, up * 90.0 + 3.0)) * 0.4;
  float bankA = nlUp(0.0, 0.012, top - up) * (0.62 + 0.36 * lump);
  vec3 cloudC = vec3(0.007, 0.012, 0.02) + nlDusk * vec3(0.04, 0.025, 0.05) + nlLit * nlB1 * 0.35 * (1.0 - nlUp(0.0, 0.02, top - up)) + 0.1 * nlLit * nlB2;
  vec2 bq = (q - vec2(-0.36, 0.0)) * vec2(0.8, 0.0) + vec2(0.0, up - 0.045) * 1.5;
  cloudC += vec3(0.75, 0.8, 1.0) * uHits * (0.8 + 1.2 * uEnergy) * exp(-dot(bq, bq) * 55.0) * (0.25 + 2.0 * lump * lump);
  sky = mix(sky, cloudC, bankA) + vec3(0.1, 0.12, 0.17) * uHits * exp(-dot(bq, bq) * 22.0);
  // hills along the edge
  float ridge = sat(place) * (0.02 + 0.06 * noise(vec2(q.x * 4.0, 2.0)));
  sky = mix(sky, vec3(0.006, 0.009, 0.016) + nlLit * nlB2 * 0.2, nlUp(-nlPx, nlPx, ridge - up) * sat(place * 8.0));
  vec3 col = mix(sky, nlLand(q, max(d, 0.0006), edge), nlUp(0.0, 0.004 + nlPx, d));
  // the wing
  vec2 wp = p - vec2(0.42, -0.215);
  vec2 wd = normalize(vec2(0.86, -0.42)), wn = vec2(-wd.y, wd.x);
  float s = dot(wp, wd), t = dot(wp, wn);
  float lead = t - 0.012 - 0.03 * s, trail = -0.012 - 0.34 * s - t;
  float a = nlUp(nlPx, -nlPx, max(max(lead, trail), -s - 0.02 * sin(t * 60.0)));
  vec3 wc = vec3(0.006, 0.009, 0.014) + (nlLit * nlB1 * 0.25 + nlDusk * vec3(0.03)) * exp(lead * 30.0) + nlNight * vec3(0.02, 0.025, 0.035) * 0.5;
  wc *= 1.0 - 0.5 * exp(-abs(t + 0.004 + 0.2 * s) / (0.6 * nlPx + 0.0006));
  wc *= 1.0 - 0.35 * exp(-abs(fract(s * 5.0 + t) - 0.5) / (8.0 * nlPx)) * nlUp(0.0, 0.02, -lead - 0.03 * s);
  wc += (nlLit * nlB1 * 0.9 + nlNight * vec3(0.06, 0.07, 0.09)) * exp(-abs(lead + 0.002) / (0.0016 + nlPx));
  col = mix(col, wc, a);
  float ld = length(wp - vec2(-0.004, 0.006));
  vec3 red = mix(vec3(1.0, 0.12, 0.06), uKind[4], 0.15);
  col += red * (0.7 + 0.8 * uCue + 0.3 * uMic) * (4.0 * exp(-ld * ld / 0.000016) + 0.2 * exp(-ld / 0.012) + 0.02 * exp(-ld / 0.06));
  return col;
}
// The close boat, about 1 long, its waterline at y 0. x: how much of it covers, y: how lit.
vec2 nlHull(vec2 q, float px) {
  float bow = sat(q.x * 2.1 + 0.15), deck = 0.07 + 0.1 * bow * bow * bow + 0.03 * sat(-q.x * 2.0 - 0.3);
  float hull = max(max(q.y - deck, max(0.83 * (q.x - 0.36 - 0.62 * q.y + 1.2 * q.y * q.y), -q.x - 0.47 - 0.15 * q.y)), -q.y - 0.02);
  float house = max(abs(q.x + 0.2 + 0.1 * (q.y - 0.1)) - 0.1 - 0.03 * nlUp(0.15, 0.145, q.y), abs(q.y - 0.13) - 0.085);
  house = min(house, max(abs(q.x + 0.205) - 0.065, abs(q.y - 0.225) - 0.03));
  float roof = max(abs(q.x + 0.2) - 0.125, abs(q.y - 0.214) - 0.005);
  float masts = max(abs(q.x - 0.37 + 0.06 * q.y) - 0.0045, abs(q.y - 0.24) - 0.16);
  masts = min(masts, max(abs(q.x + 0.4) - 0.005, abs(q.y - 0.25) - 0.2));
  masts = min(masts, max(abs(fract(q.x * 6.0 + 0.1) - 0.5) / 6.0 - 0.003, max(abs(q.y - 0.17) - 0.12, abs(q.x - 0.02) - 0.34)));
  float box = min(house, roof), d = min(min(hull, box), masts);
  float lit = 0.012 + 0.7 * exp(-max(deck - q.y, 0.0) * 90.0) + 0.09 * exp(-max(deck - q.y, 0.0) * 22.0);
  lit += 0.07 * exp(-abs(deck - 0.032 - q.y) * 400.0);
  if (box < hull) {
    float win = max(abs(abs(q.x + 0.2) - 0.04) - 0.02, abs(q.y - 0.165) - 0.014);
    lit = roof < house ? 0.9 : mix(0.02 + 0.2 * exp(-max(0.21 - q.y, 0.0) * 30.0), 1.75, nlUp(px, -px, win));
  }
  if (masts < min(hull, box)) lit = 0.16;
  return vec2(nlUp(px, -px, d), lit);
}
// The close boat's two rows of lamps: the cores in x, the glow in y.
vec2 nlRowLamps(vec2 q, float px) {
  vec2 o = vec2(0.0);
  float sag = 0.022 * q.x * q.x / 0.13, r = 0.0042 + 0.8 * px;
  for (int j = 0; j < 2; j++) {
    float y0 = 0.272 + 0.04 * float(j), gap = 0.05 - 0.003 * float(j), off = 0.013 * float(j);
    float n = clamp(round((q.x - off) / gap), -7.0, 7.0);
    for (int k = -1; k <= 1; k++) {
      float i = n + float(k); vec2 e = q - vec2(off + gap * i, y0); e.y -= sag;
      float m = dot(e, e), f = (j == 0 ? 1.0 : 0.7) * step(abs(i), 7.5);
      o += f * vec2(exp(-m / (r * r)), 0.00014 / (m + 0.00014) * exp(-m * 90.0));
    }
  }
  return o;
}
vec3 nlBoats(vec2 p) {
  float roll = 4.0 * uCue * (1.0 - uCue), high = uOwn[5], wx = uOwn[3], place = uOwn[4];
  vec2 q = rot(-0.012 - 0.03 * roll - 0.006 * sin(uTime * 0.23)) * p;
  float hy = 0.02 + 0.15 * high + 0.004 * sin(uTime * 0.31);
  float up = q.y - hy, d = -up, H = exp2(0.8 * high), thick = exp2(1.2 * wx);
  vec3 green = mix(vec3(0.6, 1.0, 0.8), uOwn[1] < 0.0 ? vec3(1.0, 0.56, 0.2) : vec3(0.4, 0.5, 1.0), abs(uOwn[1]));
  // low cloud, seen from beneath
  float cn = 0.0, cloud = 0.0, rip = 0.0, glint = 0.0, floe = 0.0, ih = 0.0;
  if (up > -0.001) {
    float zc = 0.6 / (up + 0.07);
    vec2 cg = vec2(q.x * zc, zc + uTravel * 0.006);
    cn = nlSheet(cg * vec2(1.0, 1.5));
    cloud = nlUp(0.08, 0.36, cn + 0.45 * min(wx, 0.0) + 0.2 * max(wx, 0.0)) * nlUp(0.0, 0.1, up);
  } else {
    // the ripples
    float zw = 0.2 * H / max(d, 0.0015); vec2 wg = vec2(q.x * zw, zw);
    rip = 0.6 * (noise(wg * vec2(5.0, 11.0) + vec2(0.0, uTime * 0.16)) - 0.5) + 0.75 * nlUp(14.0, 2.0, zw) * (noise(wg * vec2(28.0, 52.0) + vec2(3.0, -uTime * 0.23)) - 0.5)
        + 0.8 * nlUp(4.0, 0.6, zw) * (noise(wg * vec2(85.0, 125.0) + vec2(uTime * 0.2, 9.0)) - 0.5)
        + 0.8 * nlUp(1.4, 0.4, zw) * (noise(wg * vec2(190.0, 330.0) + vec2(5.0, uTime * 0.3)) - 0.5);
    rip *= exp2(-1.6 * max(-place, 0.0));
    glint = 0.3 + 1.6 * nlUp(-0.15, 0.5, rip);
    // broken ice
    if (place > 0.0) {
      vec2 iq = wg * vec2(9.0, 10.0), ic = floor(iq - 0.5); float m1 = 9.0;
      for (int k = 0; k < 4; k++) {
        vec2 c = ic + vec2(float(k & 1), float(k >> 1)); vec3 h = nlHash(c + 50.0); float e = length(c + 0.3 + 0.4 * h.xy - iq) - 0.06 * h.z;
        if (e < m1) { m1 = e; ih = h.z; }
      }
      floe = nlUp(0.4, 0.35, m1) * nlUp(1.0 - place, 1.3 - place, ih + 0.25) * nlUp(9.0, 2.0, zw);
      ih = 0.6 + 0.7 * ih + 0.6 * nlUp(0.24, 0.36, m1);
    }
  }
  vec3 air = vec3(0.0), under = vec3(0.0), pool = vec3(0.0), cores = vec3(0.0);
  float many = 0.72 + 0.65 * uOwn[2], col0 = round(q.x / 0.115);
  for (int k = 0; k < 6; k++) {
    // two boats to a column of sea, one far out and one nearer
    float nr = float(k / 3), ci = col0 + float(k - 3 * (k / 3)) - 1.0;
    vec3 h = nlHash(vec2(ci + 70.0, 3.0 + nr)); float h4 = fract(h.x * 13.0 + h.z * 7.0);
    float x = (ci + 0.7 * (h.x - 0.5)) * 0.115, dx = q.x - x, ax = abs(dx), on = nlUp(many, many - 0.1, h4);
    float dy = mix(0.0025 + 0.016 * h.y, 0.018 + 0.075 * h.y * h.y, nr) * H, sc = 0.1 + dy * 10.0 / H, yb = up + dy - 0.0015 * sin(uTime * 0.4 + ci) * sc, yl = yb - 0.006 - 0.02 * sc;
    int kd = int(h.z * 3.99);
    float live = 0.3 + 0.4 * fract(h.z * 7.0) + (0.35 + 1.0 * uEnergy) * (piece(vec2(sat(0.5 + x / 2.2), 0.06 + 0.4 * nr + 0.45 * h.y)).a * 1.3 + 1.6 * nlLevel(kd) + 0.7 * band(sat(0.5 + x / 2.0)) * (0.4 + 0.6 * uLevel));
    vec3 c = green * mix(vec3(1.0), nlInk(kd) * 1.8, 0.55 * sat(nlLevel(kd) * 1.4)) * live * on * nlUp(0.13, 0.08, ax);
    if (yb > -0.02) {
      // the lamps, the pillar above them, and what they light of the cloud
      float cr = 0.001 + 0.65 * nlPx + 0.0011 * sc, e = max(ax - 0.008 * sc, 0.0), m = e * e + yl * yl, hi = max(yl, 0.0);
      cores += c * (6.0 * exp(-m / (cr * cr)) + 0.2 * exp(-sqrt(m) / (0.004 + 0.012 * sc)));
      float pw = (0.002 + 0.005 * sc + 0.05 * hi) * (1.4 - 0.8 * uTone), tall = (0.025 + 0.07 * h.x * h.x + 0.05 * sc) * (0.6 + 0.4 * thick) * (0.7 + 0.6 * uSpace);
      air += c * thick * (exp(-dx * dx / (pw * pw) - hi / tall) * nlUp(-0.002, 0.01, yl) * (0.05 + 0.3 * h.x) + 0.03 * exp(-(dx * dx + yl * yl) / (0.0008 + 0.006 * sc)));
      float pr = 0.05 + 0.02 * sc, py = (up - 0.06 - dy * 2.5) * 2.0 + 0.22 * (cn - 0.5), px = dx + 0.16 * (cn - 0.5);
      under += c * exp(-(px * px + py * py) / (pr * pr)) * 0.12 * nlUp(0.12, 0.02, ax);
    }
    if (up < 0.02) {
      // its pool, and its road of light on the water
      float down = max(-yb, 0.0), rw = 0.003 + 0.004 * sc + 0.05 * down, dr = dx + rip * (0.006 + 0.1 * down);
      vec2 pl = vec2(dx / (0.014 + 0.05 * sc), yb / (0.003 + 0.012 * sc));
      pool += c * (0.14 * nlE(pl) * (0.4 + 0.6 * glint) + 0.8 * glint * exp(-dr * dr / (rw * rw) - down / (0.025 + 0.08 * sc)) * nlUp(0.001, -0.001, yb) / (1.0 + 14.0 * down));
    }
  }
  // the sky between the cloud and the sea
  vec3 col = vec3(0.003, 0.0055, 0.011) + nlDusk * vec3(0.03, 0.03, 0.08) + nlLit * nlB1 * exp(-abs(up) * 24.0);
  if (up > -0.01) {
    col += nlStars(q, 0.6) * nlUp(0.04, 0.12, up) * sat(nlNight - 2.0 * wx);
    vec3 cloudC = (vec3(0.006, 0.009, 0.013) + nlDusk * vec3(0.06, 0.045, 0.08) + nlNight * vec3(0.012, 0.016, 0.024)) * (0.3 + 1.2 * cn) + nlLit * nlB1 * 0.12 * exp(-up * 7.0);
    // the lightning in it, far off at the right
    vec2 bq = (vec2(q.x - 0.46, up - 0.15) + 0.03 * (cn - 0.5)) * vec2(0.75, 1.5);
    cloudC += vec3(0.7, 0.8, 1.0) * uHits * (0.7 + uEnergy) * exp(-dot(bq, bq) * 70.0) * (0.15 + 1.6 * cn * cn);
    cloudC += (under + green * (0.007 + 0.02 * uLevel) * exp(-up * 4.0)) * (6.0 * cn * cn * cn + 0.2) * (1.0 + 0.4 * uMic);
    col = mix(col, cloudC, cloud);
  }
  // the sea
  vec3 sea = vec3(0.0014, 0.003, 0.0045) * (1.0 + rip) + nlDusk * vec3(0.03, 0.026, 0.05) * (0.6 + rip) + nlLit * nlB1 * 0.5 * exp(-d * 10.0) * (0.6 + rip) + nlNight * vec3(0.006, 0.009, 0.013) * (0.5 + glint * exp(-q.x * q.x * 8.0) * 2.0);
  sea = mix(sea, vec3(0.035, 0.05, 0.06) * ih + nlDusk * vec3(0.05, 0.04, 0.06), floe) + pool * (1.0 - 0.5 * floe) + green * 0.4 * uKeys * nlUp(0.2, 0.6, rip) * exp(-d * 4.0);
  float isSea = nlUp(-nlPx, nlPx, d);
  col = mix(col, sea, isSea);
  // the close boat, at the left
  float room = nlUp(0.3, 0.8, 0.5 * uRes.x / uRes.y), S = mix(0.48, 0.6, room) * exp2(-0.4 * high);
  vec2 bc = vec2(mix(-0.03, -0.45, room), hy - 0.19 * H + 0.003 * sin(uTime * 0.55)), bl = rot(0.01 * sin(uTime * 0.43)) * (q - bc) / S;
  float bp = nlPx / S, own = 0.6 + 0.5 * uEnergy * (piece(vec2(0.28, 0.5)).a + uLevel) + 0.5 * uMic + 0.4 * uCue;
  vec3 bcol = mix(green, vec3(1.0), 0.3) * own;
  float fade = nlUp(1.3, 0.5, abs(bl.x));
  // its light on the sea; the boat, and its image below
  float wet = step(bl.y, 0.0), down = max(-bl.y, 0.0);
  vec2 w1 = vec2(bl.x * 1.35, (bl.y + 0.08) * 3.6);
  col += isSea * fade * bcol * (mix(vec3(0.4, 0.95, 0.85), vec3(0.8), abs(uOwn[1])) * 0.13 * nlE(w1) * (0.25 + glint + 2.0 * floe * ih));
  vec2 m = mix(bl, vec2(bl.x + rip * (0.03 + 0.3 * down), down * 0.92 + rip * 0.5 * (0.03 + down)), wet);
  vec2 hu = nlHull(m, bp * (1.0 + wet) + 0.03 * wet), lamps = nlRowLamps(bl, bp);
  float there = hu.x * nlUp(0.62, 0.58, abs(bl.x)) * fade;
  vec3 paint = (vec3(0.5, 0.52, 0.5) * hu.y * bcol + vec3(0.0015, 0.0025, 0.003)) * (0.45 + 0.55 * exp(-bl.x * bl.x * 5.0));
  paint = mix(paint, vec3(0.9, 0.42, 0.13) * own, nlUp(1.0, 1.7, hu.y));
  col = mix(col, mix(paint, col * 0.3, wet), there);
  col *= 1.0 - 0.5 * (1.0 - wet) * nlUp(0.0016 + bp, 0.0, abs(bl.y - 0.281 - 0.17 * bl.x * bl.x)) * step(abs(bl.x), 0.37);
  vec2 hz = (bl - vec2(0.0, 0.29)) * vec2(1.0, 1.6);
  col += bcol * mix(lamps.x * 5.0 + lamps.y * 0.9, 1.5 * exp(-11.0 * (down - 0.34) * (down - 0.34)) * nlUp(0.48, 0.3, abs(m.x)) * nlUp(-0.05, 0.5, rip + 0.06 * max(-place, 0.0)) * (1.0 - 0.9 * floe) * (1.0 - 0.6 * there), wet);
  col += bcol * (1.0 - 0.85 * there) * thick * (0.07 * exp(-dot(hz, hz) * 6.0) + 0.06 * exp(-bl.x * bl.x * 9.0 - max(bl.y - 0.3, 0.0) * 2.2) * nlUp(0.1, 0.45, bl.y));
  return col + (air + cores) * (1.0 - there * (1.0 - wet));
}
vec3 render(vec2 p) {
  nlPx = 1.0 / uRes.y;
  nlDusk = sat(-uOwn[0]); nlNight = sat(uOwn[0]);
  nlLit = (0.5 + 0.06 * sin(uTime * 0.07) + 0.8 * uDrone) * (1.0 - 0.88 * nlNight) * (1.0 - 0.35 * uVar);
  nlB1 = mix(vec3(0.075, 0.16, 0.1) * (1.0 - 0.45 * uVar), vec3(0.4, 0.16, 0.14), nlDusk);
  nlB2 = mix(vec3(0.012, 0.045, 0.06), vec3(0.14, 0.08, 0.2), nlDusk);
  return screenOf(uVar < 0.5 ? nlWindow(p) : nlBoats(p));
}
