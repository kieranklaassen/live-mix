// name: Sand figures
// a: Brass plate
// b: Water drum
// what: Fine pale sand on a square brass plate clamped at its middle, gathered by the sound into stars, loops and knots, every grain with its size and shadow under a low lamp, the figure sliding slowly into the next; or a round dish of water over black, standing in rings and petals with silver light along them.
// follows: Loudness draws the sand into sharp lines and raises the water; with nothing sounding the sand lies loose and the water faint. The bands lean on which figure stands. Each kind lights one side, the piece tints what swings, a hit throws up grains or sends out a ring, a cue shakes the figure loose until it settles. Keys brighten the far side, a voice the swing.
float sfGo; // the slow clock of the figures
vec3 sfRd; float sfF;
// How strongly the plate or the dish is driven, and how much of that a cue shakes loose for a moment.
float sfDrive() { return sat(0.1 + 0.75 * sqrt(sat(uLevel)) + 0.12 * uDrone + 0.1 * uKeys); }
float sfLoose() { return 4.0 * uCue * (1.0 - uCue); }
float sfG(float x) { return exp(-x * x); }
vec3 sfInk(vec3 c) { return c * c * 1.2 + 0.03; }
float sfFall(float a, float b, float x) { return 1.0 - smoothstep(b, a, x); } // falls from 1 at b to 0 at a
// The plate's standing wave at q (-1 to 1 each way): x its height, yz its slope. Eight figures, each coming and going on a long
// sine of its own and leaned on by its part of the spectrum.
vec3 sfPlate(vec2 q) {
  const ivec2 M[8] = ivec2[8](ivec2(1, 2), ivec2(1, 2), ivec2(1, 3), ivec2(1, 3), ivec2(2, 3), ivec2(2, 4), ivec2(0, 4), ivec2(1, 4));
  const float SG[8] = float[8](1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0);
  vec2 C[5], S[5];
  C[0] = vec2(1.0); S[0] = vec2(0.0);
  C[1] = cos(PI * q); S[1] = sin(PI * q);
  for (int k = 2; k < 5; k++) { C[k] = C[k - 1] * C[1] - S[k - 1] * S[1]; S[k] = S[k - 1] * C[1] + C[k - 1] * S[1]; }
  vec3 u = vec3(0.0); float ww = 0.0;
  float star = smoothstep(-0.45, 0.45, sin(sfGo * 0.83 + 0.4)); // the figures with a cross through the middle, or those without
  for (int i = 0; i < 8; i++) {
    float fi = float(i), cl = float(i & 1);
    float a = 0.5 + 0.5 * sin(sfGo * (1.0 + 0.27 * cl) + fi * 0.25 * PI + cl * 1.2 + 0.5 * sin(sfGo * 0.31 + fi * 1.9)); // of each sort one is always up
    a *= a; float w = a * a * (0.5 + 0.9 * uBands[i * 2]) * (SG[i] < 0.0 ? star : 1.0 - star);
    int n = M[i].x, m = M[i].y;
    float s = SG[i];
    u.x += w * (C[n].x * C[m].y + s * C[m].x * C[n].y);
    u.y -= w * PI * (float(n) * S[n].x * C[m].y + s * float(m) * S[m].x * C[n].y);
    u.z -= w * PI * (float(m) * C[n].x * S[m].y + s * float(n) * C[m].x * S[n].y);
    ww += w * w;
  }
  return u / sqrt(ww + 1e-6);
}
// The ray through p, for an eye tipped down by the angle whose sine and cosine are given.
vec3 sfEye(vec2 p, float D, float sn, float cs) {
  sfRd = vec3(p.x, p.y * sn + sfF * cs, min(p.y * cs - sfF * sn, -0.08));
  return vec3(0.0, -D * cs, D * sn);
}
float sfBox(vec2 q, float h, float r) { vec2 d = abs(q) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float sfSeg(vec2 q, vec2 b) { return length(q - b * sat(dot(q, b) / max(dot(b, b), 1e-6))); }
// One sowing of grains. Every grain has its place and its own threshold for good: it swells and fades there as the sand gathers.
void sfGrains(vec2 q, float cell, float seed, vec3 u, float sig, float amount, float loose, vec2 L, float px, vec3 lit, inout vec3 col) {
  vec2 g = q / cell, b = floor(g - 0.5);
  for (int k = 0; k < 4; k++) {
    vec2 id = b + vec2(float(k & 1), float(k >> 1));
    vec2 h = hash22(id + seed);
    float h2 = fract(h.x * 17.31 + h.y * 5.7); // when it comes
    vec2 c = id + 0.5 + (h - 0.5) * 0.6;
    vec2 d = g - c;
    float uu = u.x - dot(u.yz, d) * cell;
    float line = exp(-uu * uu / (sig * sig));
    float dens = loose + amount * line;
    float on = smoothstep(h2, h2 + 0.22, dens * 1.22);
    if (on <= 0.01) continue;
    float r = (0.22 + 0.2 * h.y) * on, aa = px / cell;
    vec2 e = d * rot(h.x * 6.0); e.x *= 0.72 + 0.28 * h.y; // no two alike
    float l = length(e);
    float body = sfFall(r + aa * 0.6, r - aa * 0.6, l) * min(1.0, r / (aa * 0.6));
    vec2 sd = d + L * r;
    float sh = sfFall(r * 1.5 + aa, r * 0.4, length(vec2(dot(sd, L) * 0.6, dot(sd, vec2(-L.y, L.x))))) * on;
    col *= 1.0 - 0.6 * sh;
    float lam = sat(0.45 + 0.6 * dot(d, L) / max(r, 0.02));
    vec3 skin = mix(vec3(0.82, 0.7, 0.5), vec3(0.95, 0.9, 0.8), h2 < 0.7 ? h.y : 1.0);
    skin *= h.x < 0.06 ? 0.3 : 0.75 + 0.35 * h.x;
    col = mix(col, skin * lit * (0.22 + 1.5 * lam * lam), body);
  }
}
// Grains a hit throws up at the middle of the plate: how much of one covers q.
float sfHop(vec2 q, float px) {
  const float cell = 0.034;
  vec2 g = q / cell, b = floor(g - 0.5);
  float most = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 id = b + vec2(float(k & 1), float(k >> 1)), h = hash22(id + 71.0);
    vec2 c = (id + 0.5 + (h - 0.5) * 0.6) * cell;
    float r = cell * (0.07 + 0.12 * h.y) * sfFall(0.5, 0.12, length(c)) * smoothstep(0.25, 0.45, h.x);
    most = max(most, sfFall(r + px * 0.6, r - px * 0.6, length(q - c)) * min(1.0, r / (px * 0.6)));
  }
  return most;
}
vec3 sfBrass(vec2 p) {
  sfF = 1.65;
  float D = 3.1 + 0.2 * uSpace;
  vec3 ro = sfEye(p - vec2(0.03, 0.03), D, 0.8, 0.6), rd = sfRd;
  mat2 yaw = rot(0.5);
  float t = ro.z / -rd.z;
  vec2 q = yaw * (ro + rd * t).xy, par = yaw * (rd.xy / -rd.z); // par: how far q slides for a unit of height
  float px = 1.15 * t / uRes.y;
  vec2 L = yaw * rot(0.12 * sin(uTime * 0.021)) * vec2(-0.86, 0.5); // the low lamp to the left, swaying over minutes
  float e = sfDrive() * (1.0 - 0.7 * sfLoose());
  vec3 col, warm = vec3(1.0, 0.86, 0.68);
  // each kind's lamp stands low at one side
  vec3 k0 = sfInk(uKind[0]) * (uDrone + 0.6 * uCue), k1 = sfInk(uKind[1]) * (uPad + 0.6 * uCue), k2 = sfInk(uKind[2]) * (uTexture + 0.6 * uCue), k3 = sfInk(uKind[3]) * (uPhrase + 0.4 * uKeys + 0.6 * uCue);
  vec4 near = exp(-3.2 * max(vec4(1.0 + q.y, 1.0 + q.x, 1.0 - q.x, 1.0 - q.y), 0.0));
  vec3 rim = k0 * near.x + k1 * near.y + k2 * near.z + k3 * near.w;
  float edge = sfBox(q, 1.0, 0.03);
  vec2 la = q - L * 0.85;
  float pool = (1.75 + 0.5 * uCue) * exp(-dot(la, la) * mix(0.35, 0.75, uTone)) + 0.12;
  if (edge > -px) {
    // the bench under it: black stone, the plate's shadow, spilt grains
    vec2 b = q + par * 0.5, lb = b - L * 1.7;
    float under = smoothstep(-0.15, 0.22, sfBox(b + L * 0.75, 1.0, 0.1));
    float lp = exp(-dot(lb, lb) * 0.28) * under;
    col = vec3(0.005, 0.0043, 0.004) * (0.7 + 0.6 * fbm(b * 3.0)) * (0.12 + 2.6 * lp);
    sfGrains(b, 0.016, 41.0, vec3(0.0), 1.0, 0.0, 0.11 * exp(-max(sfBox(b, 1.0, 0.1), 0.0) * 4.0), L, px, warm * (0.04 + 1.1 * lp), col);
    // the plate's thickness on its near sides
    float side = sfFall(px, -px, sfBox(q + par * 0.045, 1.0, 0.03));
    vec2 ql = q + par * 0.02;
    vec3 kc = abs(ql.x) > abs(ql.y) ? (ql.x > 0.0 ? k2 : k1) : (ql.y > 0.0 ? k3 : k0);
    col = mix(col, vec3(0.05, 0.032, 0.012) * (0.4 + pool) + kc * 0.22, side);
  }
  if (edge < px) {
    vec3 u = sfPlate(q);
    vec3 pc = sfInk(piece(vec2(q.x, -q.y) * 0.49 + 0.5).rgb);
    float r = length(q), swing = u.x * u.x / (1.0 + 0.6 * u.x * u.x) * smoothstep(0.1, 0.4, r);
    // dark polished brass: a window's light lies along the fine scratches
    float scr = noise(vec2(q.x * 4.0, q.y * 160.0)) + noise(vec2(q.x * 9.0 + 3.0, q.y * 390.0)) - 1.0;
    vec2 R = yaw * normalize(vec3(rd.xy, -rd.z)).xy + vec2(0.5, -0.36);
    float gloss = exp(-R.x * R.x * 9.0 - R.y * R.y * 22.0);
    float cloud = fbm(q * 2.3 + 9.0);
    vec3 plate = vec3(0.4, 0.25, 0.085) * (0.005 + 0.016 * pool * pool + 0.8 * gloss * cloud) * (1.0 + 0.3 * scr);
    plate += vec3(0.42, 0.28, 0.11) * sfFall(0.35, 0.0, abs(R.x * 0.6 + R.y - 0.02)) * sfFall(0.8, -0.2, R.x) * 0.17 * (0.7 + 0.5 * cloud) * (1.0 + 0.3 * scr);
    plate += vec3(0.5, 0.36, 0.2) * rim * (0.07 + 0.04 * scr);
    // where the plate swings it takes the colour of what sounds there; a hit sends a ring of light out through it
    float ring = r - 1.25 * (1.0 - uHits);
    plate += (pc * (0.02 + 0.055 * uEnergy) + vec3(0.5, 0.35, 0.16) * 0.08 * (uMic + uLevel * 0.2)) * swing;
    plate += (sfInk(uKind[4]) + 0.15) * uHits * exp(-ring * ring * 30.0) * (0.1 + 0.12 * swing);
    float sig = mix(0.8, 0.14, pow(e, 0.6)) * (0.4 + 0.6 * smoothstep(0.0, 7.0, length(u.yz))), amount = mix(0.34, 1.02, e), loose = 0.17 * (1.0 - 0.85 * e) + 0.02 * uTexture;
    float hold = smoothstep(0.12, 0.2, r) * sfFall(0.0, -0.03, edge);
    amount *= hold; loose *= hold;
    // the heap: shaded as a low ridge, with its soft shadow
    float line = exp(-u.x * u.x / (sig * sig)) * amount;
    float um = u.x + dot(u.yz, L) * 0.035;
    float thrown = exp(-um * um / (sig * sig)) * amount;
    float ridge = sat(0.62 + 0.04 * u.x * dot(u.yz, L) / (sig * sig) * line);
    vec3 lit = warm * pool * (0.25 + 1.7 * ridge) + rim * 0.9;
    lit += (sfInk(uKind[4]) + 0.3) * uHits * 1.2 * exp(-r * r * 9.0);
    col = plate * (1.0 - 0.8 * smoothstep(0.3, 0.9, thrown));
    col = mix(col, vec3(0.8, 0.68, 0.5) * lit * 0.6, smoothstep(0.5, 0.95, line));
    mat2 m1 = rot(0.6), m2 = rot(1.9);
    vec3 top = col;
    sfGrains(q, 0.0105, 3.0, u, sig, amount, loose, L, px, lit, top);
    sfGrains(m1 * q, 0.015, 9.0, vec3(u.x, m1 * u.yz), sig, amount * 0.9, loose * 0.8, m1 * L, px, lit, top);
    sfGrains(m2 * q, 0.0082, 17.0, vec3(u.x, m2 * u.yz), sig, amount, loose * 0.7, m2 * L, px, lit, top);
    // a hit: grains leap near the middle
    if (uHits > 0.01 && r < 0.75) {
      float z = 4.0 * uHits * (1.0 - uHits) * 0.16;
      top *= 1.0 - 0.6 * min(1.0, uHits * 3.0) * sfHop(q + L * z * 1.4, px * 2.0);
      top = mix(top, (warm * 1.2 + sfInk(uKind[4])) * (0.4 + pool), min(1.0, uHits * 3.0) * sfHop(q - par * z, px));
    }
    // the bevel, catching the lamp
    float bev = smoothstep(-0.014 - px, -0.014 + px, edge);
    vec2 out2 = abs(q.x) > abs(q.y) ? vec2(sign(q.x), 0.0) : vec2(0.0, sign(q.y));
    top = mix(top, vec3(0.5, 0.33, 0.13) * (0.02 + 0.9 * pool * sat(dot(out2, L) + 0.15)) + rim * 0.4, bev * 0.85);
    // the clamp at the middle: its shadow, a felt ring, a turned brass knob
    float cs = sfFall(0.05, -0.02, sfSeg(q, -L * 0.42) - 0.06) * sfFall(0.6, 0.1, r);
    top *= 1.0 - 0.85 * cs;
    top = mix(top, vec3(0.05, 0.008, 0.008) * (0.3 + pool), sfFall(px, -px, r - 0.098));
    vec2 cap = par * 0.13;
    float wall = sfSeg(q, cap) - 0.062;
    float across = dot(q, vec2(-cap.y, cap.x)) / max(length(cap), 1e-3) / 0.062;
    vec3 metal = vec3(0.42, 0.27, 0.1) * (0.03 + 0.5 * sfG((across * sign(dot(L, vec2(-cap.y, cap.x))) - 0.5) * 3.7)) * (0.8 + 0.2 * sin(across * 40.0));
    top = mix(top, metal + rim, sfFall(px, -px, wall));
    vec2 tq = q - cap; float tr = length(tq);
    float fan = pow(abs(dot(tq, L)) / max(tr, 1e-3), 6.0);
    vec3 disc = vec3(0.5, 0.33, 0.13) * (0.06 + 0.75 * fan * pool) * (0.9 + 0.1 * sin(tr * 900.0)) + (sfInk(uKind[4]) * uHits + sfInk(uKind[3]) * uKeys * 0.6) * 0.3;
    top = mix(top, disc, sfFall(px, -px, tr - 0.062));
    top += warm * 0.5 * pool * sfFall(px * 1.5, 0.0, abs(tr - 0.058)) * sat(dot(tq, L) * 16.0);
    col = edge > -px ? mix(col, top, sfFall(px, -px, edge)) : top;
  }
  return screenOf(col * 1.7);
}
// The rig over the water: a hoop of lamps hung round the place the eye sees mirrored, each kind with its arc, and a soft light
// inside it. k is how far off that place a ray goes.
vec3 sfRig(vec2 k, float blur) {
  float l = length(k), wd = mix(0.04, 0.018, uTone), w = (l - 0.3) / (wd + blur);
  vec2 d = k / max(l, 1e-3);
  vec4 arc = sat(vec4(-d.y, -d.x, d.x, d.y)); arc *= arc * arc;
  vec3 tint = sfInk(uKind[0]) * arc.x * uDrone + sfInk(uKind[1]) * arc.y * uPad + sfInk(uKind[2]) * arc.z * uTexture + sfInk(uKind[3]) * arc.w * (uPhrase + 0.5 * uKeys);
  vec3 c = (vec3(0.85, 0.89, 0.94) * (0.25 + 0.95 * sat(0.5 - 0.6 * d.x + 0.3 * d.y)) + 1.5 * tint) * exp(-w * w) * wd / (wd + blur);
  vec2 win = k - vec2(-0.2, 0.17);
  c += vec3(1.0, 0.97, 0.9) * (0.5 + 0.6 * uHigh) * exp(-dot(win, win) * 1100.0);
  return c + vec3(0.05, 0.06, 0.075) * exp(-l * l * 500.0);
}
// The standing waves on the water at q: g its slope, H its bend (xx, yy, xy), all for waves of one step each.
void sfDish(vec2 q, out vec2 g, out vec3 H) {
  const float K[3] = float[3](24.0, 31.0, 40.0);
  float r = length(q);
  g = vec2(0.0); H = vec3(0.0);
  float ww = 0.0;
  for (int s = 0; s < 3; s++) {
    float fs = float(s), a = 0.5 + 0.5 * sin(sfGo + fs * TAU / 3.0 + 1.5 + 0.5 * sin(sfGo * 0.37 + fs * 2.0));
    float w = (0.04 + a * a * a) * (0.5 + 0.9 * uBands[s * 5 + 1]);
    float k = K[s], kn = k / 36.0;
    ww += w * w * 6.0;
    for (int j = 0; j < 6; j++) {
      float th = PI * (float(j) + (s == 1 ? 0.5 : 0.0)) / 6.0 + 0.2;
      vec2 d = vec2(cos(th), sin(th));
      float o = (j & 1) == 0 ? w : -w, x = k * dot(d, q), c = o * cos(x); // one up, the next down: petals
      g -= o * sin(x) * d;
      H -= c * kn * vec3(d.x * d.x, d.y * d.y, d.x * d.y);
    }
  }
  float m = 1.0 / sqrt(ww * 0.35 + 0.02) / (0.85 + 0.4 * r);
  // rings that the wall sends back
  vec2 o = q / max(r, 1e-3);
  float y = 44.0 * (1.0 - r), we = 0.8 * exp(-(1.0 - r) * 7.0);
  g = g * m + we * sin(y) * o;
  H = H * m - we * cos(y) * vec3(o.x * o.x, o.y * o.y, o.x * o.y);
}
vec3 sfWater(vec2 p) {
  sfF = 1.65;
  float D = 2.55 + 0.15 * uSpace;
  vec3 ro = sfEye(p - vec2(0.2, -0.02), D, 0.82, 0.572), rd = sfRd, v = normalize(rd);
  float t = ro.z / -rd.z;
  vec2 q = (ro + rd * t).xy;
  float px = 1.15 * t / uRes.y, r = length(q);
  vec2 o = q / max(r, 1e-3), L = vec2(-0.8, 0.6);
  vec2 la = q - L * 0.55;
  float pool = 0.1 + (2.0 + 0.5 * uCue) * exp(-dot(la, la) * 1.5);
  vec3 col = vec3(0.0009, 0.001, 0.0013) * (1.0 + 4.0 * pool * exp(-max(r - 1.0, 0.0) * 4.0));
  if (r < 1.0 + px) {
    vec2 g; vec3 H;
    sfDish(q, g, H);
    float amp = sfDrive() * (1.0 - 0.85 * sfLoose());
    float A = 0.019 + 0.095 * amp;
    float ring = r - 1.1 * (1.0 - uHits);
    vec2 kick = o * uHits * 0.3 * exp(-ring * ring * 90.0) * cos(ring * 45.0);
    vec2 kf = v.xy / -v.z;
    vec4 pc = piece(q * vec2(0.49, -0.49) + 0.5);
    vec3 wat = vec3(0.0);
    float blur = px * (72.0 * A * sqrt(H.x * H.x + H.y * H.y + 2.0 * H.z * H.z) + 27.0 * uHits * exp(-ring * ring * 90.0));
    // the water swings too fast to see: what is seen is its two ends, one over the other
    for (int s = 0; s < 2; s++) {
      vec2 sl = g * (s == 0 ? A : -A) + kick;
      vec3 R = reflect(v, normalize(vec3(-sl, 1.0)));
      wat += sfRig(R.xy / max(R.z, 0.2) - kf, blur) * 0.5;
      // and the light it gathers on the floor of the dish
      float f = (s == 0 ? 4.5 : -4.5) * A;
      float ca = 1.0 / (abs(1.0 + f * (H.x + H.y) + f * f * (H.x * H.y - H.z * H.z)) + 0.2);
      wat += (vec3(0.008, 0.01, 0.013) + 0.09 * sfInk(pc.rgb) * (0.4 + 0.7 * uEnergy)) * max(ca * ca - 0.75, 0.0) * (0.5 + 0.5 * uMic);
    }
    wat *= pool * 1.1 * (1.0 + 1.6 * uHits * exp(-ring * ring * 9.0));
    wat *= 1.0 - exp(-r * r * 40.0) * sat(0.6 - 3.0 * dot(q, L)); // the still middle leans from the lamp
    wat = wat * wat / (wat + 0.03);
    wat += (sfInk(uKind[4]) + 0.2) * uHits * (0.07 * exp(-ring * ring * 140.0) + 0.3 * exp(-ring * ring * 900.0)) * sfFall(1.0, 0.75, r);
    col = mix(col, wat, sfFall(1.0 + px, 1.0 - px, r));
  }
  // the hoop that holds the skin: brass, with a bright line where the lamp lies along it
  float hp = (r - 1.035) / 0.035;
  float sp = sat(dot(o, L)), sp2 = sat(dot(o, vec2(0.75, -0.66)));
  vec3 hoop = vec3(0.9, 0.6, 0.26) * (0.006 + 0.1 * pow(sp, 3.0) * sfG((hp - 0.35) * 2.6) + 1.4 * pow(sp, 10.0) * sfG((hp + 0.4) * 7.0) + 0.12 * pow(sp2, 14.0) * sfG((hp - 0.5) * 6.0));
  vec4 side = sat(vec4(-o.y, -o.x, o.x, o.y));
  hoop += (sfInk(uKind[0]) * side.x * (uDrone + uCue) + sfInk(uKind[1]) * side.y * (uPad + uCue) + sfInk(uKind[2]) * side.z * (uTexture + uCue) + sfInk(uKind[3]) * side.w * (uPhrase + uKeys + uCue)) * 0.16 * sfG((hp + 0.15) * 3.2);
  col = mix(col, hoop, sfFall(1.0 + px / 0.035, 1.0 - px / 0.035, abs(hp)));
  return screenOf(col * 1.7);
}
vec3 render(vec2 p) {
  sfGo = uTime * 0.016 + uTravel * 0.022;
  return uVar < 0.5 ? sfBrass(p) : sfWater(p);
}
