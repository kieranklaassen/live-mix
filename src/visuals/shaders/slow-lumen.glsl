// name: Slow lumen
// a: Unfolding
// b: Turning over
// what: Veils of silver and coloured light unfold in the dark out of threads, turn inside themselves and drift: where a sheet folds back it gathers into a bright edge, where it faces us it is gauze; or one sheet alone to the right, first a thread, then turning its face, then fading as the next thread comes.
// follows: Each kind of sound is a veil that brightens and widens, or in the second picture a length of the one sheet; the low opens it; the piece is dyed in; a hit runs a glint along the folds, a cue opens a veil wide; keys light the phrase veil or the foot of the sheet, a voice the folds; fuller music carries them on faster.
// own: 0 1 twice as many veils, -1 one alone (b: one broad fold); 1 they rise from one root like the petals of a flower, -1 they lie one above another like bands of mist; 2 the ground: 1 pale, the veils a dye on it, -1 deep in the colour of the drone; 3 1 a solid petal or cloth with light and shade, -1 spun of single threads; 4 1 broad and open like a bowl, -1 narrow as a ribbon; 5 1 wound like a screw, -1 hung straight and smooth; 6 1 both sides alike, as wings are, -1 over still water that mirrors it; 7 1 shot with all the colours of the sounds across the sheet, -1 made of grains of light; with any of 1 to 5 and 7 the bright folds, and a pale ground, take the colour of the hits
// A veil is a thin sheet seen through: at each height its cross-cut is a smooth curve, and the light at a point is how much of
// the sheet lies behind it. Where the sheet turns back on itself it piles up into a bright edge.
float slT, slGo; // the slow clock of the folds, and the one that goes faster with the music
struct SlVeil { float wide, deep, waves, phase, turn, twist, blur, seed, taper, fine; int parts; };
vec3 slSilver; float slDyed, slThread;
// The light of a veil at q (x across it, y along): x the light, y the light of its edges alone, z where across the sheet it
// comes from (weighted by the light).
vec3 slVeil(vec2 q, SlVeil v) {
  float y = q.y;
  float flare = mix(v.taper, 1.0, smoothstep(-0.5, 0.35, y)); // it opens out of a thread
  float wide = v.wide * flare, deep = v.deep * flare;
  float h = v.blur;
  if (abs(q.x) > 0.5 * wide + deep * 1.8 + h) return vec3(0.0);
  float th = v.turn + v.twist * y + 0.4 * sin(y * 2.3 + v.seed + slT * 0.5);
  float ct = cos(th) * 0.7 + 0.45, st = sin(th);
  if (abs(q.x) > 0.56 * wide * abs(st) + deep * 1.56 * abs(ct) + h) return vec3(0.0);
  float p1 = v.phase + y * 2.4 + 0.9 * sin(y * 3.1 - slT * 0.7 + v.seed);
  float p2 = -v.phase * 1.3 - y * 4.3 + v.seed * 2.0 + 0.8 * sin(y * 2.6 + slT * 0.4);
  vec3 sum = vec3(0.0);
  float n = float(v.parts);
  float c0 = 0.0, c1 = 0.0, step1 = TAU * v.waves / n, step2 = step1 * 1.83;
  // two waves across the sheet, each turned on by one step from point to point
  vec2 e1 = vec2(cos(p1 - 0.5 * step1), sin(p1 - 0.5 * step1)), e2 = vec2(cos(p2 - 0.5 * step2), sin(p2 - 0.5 * step2));
  mat2 m1 = rot(step1), m2 = rot(step2);
  for (int i = 0; i < min(v.parts, 12) + 2; i++) {
    float s = (float(i) - 0.5) / n;
    float c2 = (s - 0.5) * wide * st + deep * (e1.y + 0.55 * e2.y) * ct;
    e1 = e1 * m1; e2 = e2 * m2;
    if (i > 1) {
      // one piece of the curve: a parabola from the middle of c0 c1 to the middle of c1 c2
      float lo = min(min(c0, c2), c1), hi = max(max(c0, c2), c1);
      if (q.x > lo - h && q.x < hi + h) {
        float A = 0.5 * (c0 - 2.0 * c1 + c2), B = c1 - c0, C = 0.5 * (c0 + c1);
        A += A < 0.0 ? -2e-4 : 2e-4;
        vec2 r = sqrt(max(B * B - 4.0 * A * (C - q.x + vec2(-h, h)), 0.0));
        vec4 t = sat((vec4(-r, r) - B) / (2.0 * A));
        vec2 du = abs(t.yw - t.xz) / n, um = (float(i - 2) + 0.5 * (t.yw + t.xz)) / n;
        for (int k = 0; k < 2; k++) if (du[k] > 0.0) {
          float u = um[k], I = du[k] / (2.0 * h) * smoothstep(0.0, 0.5, u) * (1.0 - smoothstep(0.9, 1.0, u));
          I *= v.fine < 0.0 ? 0.8 : 0.4 + 0.8 * noise(vec2(u * 17.0 + v.seed, y * 1.5)); // the weave: a little thicker here, thinner there
          float f = v.fine * sat(1.0 - 45.0 * du[k]);
          if (f > 0.01) I *= 1.0 + 0.35 * f * sin(u * 210.0 + 4.0 * sin(u * 47.0 + y * 3.0 + v.seed));
          if (slThread > 0.0) { float b = sat(1.2 - 26.0 * du[k]), w = 0.5 + 0.5 * sin(u * 150.0 + v.seed); I *= mix(1.0, mix(0.8, 0.12 + 2.6 * w * w * w * w, b), slThread); }
          sum += I * vec3(1.0, smoothstep(2.5, 12.0, I), u);
        }
      }
    }
    c0 = c1; c1 = c2;
  }
  return sum;
}
vec3 slInk(vec3 c) { return c * c * 1.4 + c * 0.04; }
const vec3 SL_SILVER = vec3(0.72, 0.81, 0.95);
// The colour of a veil's light: silver at one hem, dyed at the other, and whitest where it folds.
vec3 slLight(vec3 s, vec3 ink, float much) {
  float u = s.z / max(s.x, 1e-3);
  if (uOwn[7] > 0.0) { float k = 4.0 - 4.0 * abs(1.0 - 2.0 * fract(u * 1.25 + 0.2)); ink = mix(ink, slInk(mix(mix(mix(mix(uKind[0], uKind[1], sat(k)), uKind[2], sat(k - 1.0)), uKind[3], sat(k - 2.0)), uKind[4], sat(k - 3.0))) * 1.4, uOwn[7]); much = mix(much, 0.85, uOwn[7]); u = mix(u, 1.0, uOwn[7]); }
  if (slDyed > 0.0) return mix(slSilver, ink * 1.5, 0.15 + max(much, 0.8 * slDyed) * smoothstep(0.1, 0.6, u)) * s.x + slSilver * (0.6 + 0.5 * uTone + 0.8 * uHigh + 0.8 * uMic) * s.y;
  return mix(SL_SILVER, ink, 0.15 + much * smoothstep(0.15, 0.75, u)) * s.x + SL_SILVER * (0.6 + 0.5 * uTone + 0.8 * uHigh + 0.8 * uMic) * s.y;
}
// A hit: a glint that runs up a sheet, brightest on its edges.
float slGlint(vec3 s, float y) {
  float g = y - mix(0.45, -0.12, uHits);
  return (0.06 * s.x + 0.5 * s.y) * uHits * exp(-g * g * 60.0);
}
// What the veils hang before, in another world.
vec3 slBase(vec3 was, vec2 p) {
  float pale = max(uOwn[2], 0.0), deep = max(-uOwn[2], 0.0), l = length(p - vec2(0.1, 0.12));
  if (pale > 0.0) was = mix(was, vec3(1.75, 1.67, 1.53) * mix(vec3(1.0), uKind[4] / max(max(uKind[4].r, uKind[4].g), max(uKind[4].b, 0.05)), 0.75) * (0.72 + 0.42 * exp(-l * l * 1.6) + 0.06 * uLevel), pale);
  if (deep > 0.0) was = mix(was, (slInk(uKind[0]) * 0.75 + 0.004) * (0.16 + 0.8 * exp(-l * l * 1.8)) * (0.85 + 0.35 * uLevel), deep);
  return was;
}
// A veil laid over what is behind it: light added, or a dye that takes light away, or a solid body.
vec3 slLay(vec3 col, vec3 c, vec3 s, vec3 dye, float L, float along, float y) {
  float pale = max(uOwn[2], 0.0), body = max(uOwn[3], 0.0), u = s.z / max(s.x, 1e-3);
  vec3 o = col + c * along * (1.0 + 0.35 * max(-uOwn[2], 0.0));
  if (uOwn[7] > 0.0) { float k = 4.0 - 4.0 * abs(1.0 - 2.0 * fract(u * 1.25 + 0.2)); dye = mix(dye, mix(mix(mix(mix(uKind[0], uKind[1], sat(k)), uKind[2], sat(k - 1.0)), uKind[3], sat(k - 2.0)), uKind[4], sat(k - 3.0)), uOwn[7]); }
  if (pale > 0.0) {
    float dens = (s.x * (0.12 + 0.5 * L) + 0.75 * s.y * (0.4 + 0.6 * L)) * along * (1.0 + 2.2 * uHits * exp(-30.0 * (y - mix(0.45, -0.12, uHits)) * (y - mix(0.45, -0.12, uHits))));
    vec3 gone = max(vec3(1.06) - dye, 0.03);
    o = mix(o, col * exp(-min(dens, 4.0) * gone * gone * 2.1) + (slInk(uKind[4]) + 0.2) * slGlint(s, y) * along * 0.4, pale);
  }
  if (body > 0.0) {
    float a = 1.0 - exp(-4.5 * s.x * along * along), round_ = 0.5 + 0.5 * sin(u * 9.0 + 1.0), far = sat(0.5 + 0.9 * y);
    vec3 d = mix(dye * dye, dye, 0.35);
    vec3 b = d * (0.1 + 0.4 * round_ * round_ + 0.55 * u) * (0.45 + 0.7 * far) * (0.62 + 0.85 * L) + mix(d, slSilver, 0.6) * (0.28 * min(s.y * 0.2, 1.2)) + (slInk(uKind[4]) + 0.3) * slGlint(s, y) * 0.5;
    o = mix(o, b * mix(1.0, 1.3, pale), a * body);
  }
  return o;
}
// Made of grains: a dot of light, or of dye, in each small cell, larger where there is more of it.
vec3 slGrains(vec3 col, vec3 base, vec2 p) {
  vec3 d = col - base; float much = dot(abs(d), vec3(0.4)) * (1.0 - 0.45 * max(uOwn[2], 0.0)), keep = -uOwn[7];
  float lit = 0.0;
  for (int i = 0; i < 2; i++) {
    float many = i == 0 ? 92.0 : 131.0, w = many / uRes.y;
    vec2 c = rot(0.35 + 0.8 * float(i)) * p * many + vec2(0.0, -0.25 * uTime), id = floor(c); vec2 f = fract(c) - 0.5 - 0.6 * (hash22(id + 3.0 * float(i)) - 0.5);
    float h = hash21(id + 7.7), r = (0.2 + 0.16 * h) * smoothstep(0.03 + 0.5 * h * h, 0.1 + 0.6 * h * h, much);
    lit = max(lit, (1.0 - smoothstep(r - w, r + w, length(f))) * step(0.03, r) * (i == 0 ? 1.0 : 0.6));
  }
  return mix(col, base + d * (0.12 + 2.3 * lit), keep);
}
vec3 slUnfolding(vec2 p) {
  vec2 d0 = p - vec2(0.1, 0.05);
  vec3 col = vec3(0.0012, 0.0016, 0.003) + vec3(0.0015, 0.003, 0.0065) * exp(-3.0 * dot(d0, d0));
  vec2 p0 = p; vec3 base = col;
  bool other = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[7] != 0.0;
  if (uOwn[2] != 0.0) base = col = slBase(col, p);
  float lv[4] = float[4](uDrone, uPad, uTexture, uPhrase);
  float open = 4.0 * uCue * (1.0 - uCue);
  p *= 0.97 + 0.06 * uSpace;
  for (int j = 0; j < (uOwn[0] > 0.0 ? 4 + int(ceil(uOwn[0] * 4.0)) : 4); j++) {
    int i = j < 4 ? j : j - 4;
    float fi = float(j), seed = 3.7 + fi * 11.3, L = lv[i], ink = 0.8, gain;
    float go = slGo * (0.8 + 0.13 * fi) + fi * 1.9;
    vec2 at; float ang, bend, curl, len; SlVeil v;
    v.seed = seed; v.phase = go * 0.9; v.turn = go * 0.7 + seed; v.blur = 0.0018 + 0.0025 * (1.0 - uTone); v.taper = 0.08; v.fine = i < 2 ? 0.0 : -1.0; v.parts = i == 2 ? 10 : i == 3 ? 8 : 9;
    if (i == 0)      { at = vec2(0.08, 0.0); ang = -0.95; bend = -0.8; curl = -0.8; len = 0.62; v.wide = 0.75 + 0.3 * uLow; v.deep = 0.17; v.waves = 1.5; v.twist = 1.6; gain = 0.045; }
    else if (i == 1) { at = vec2(0.22, 0.06); ang = 0.35; bend = 1.2; curl = 1.7; len = 0.42; v.wide = 0.5 + 0.5 * open; v.deep = 0.11; v.waves = 1.7; v.twist = -2.2; gain = 0.008; L += 0.7 * uCue; }
    else if (i == 2) { at = vec2(-0.47, 0.2); ang = 2.5; bend = 1.3; curl = 1.5; len = 0.34; v.wide = 0.3; v.deep = 0.11; v.waves = 2.4; v.twist = 3.0; ink = 0.6; gain = 0.003; v.blur *= 1.6; v.taper = 0.3; }
    else             { at = vec2(0.46, -0.17); ang = 1.35; bend = -0.7; curl = -1.3; len = 0.46; v.wide = 0.26; v.deep = 0.11; v.waves = 1.5; v.twist = 2.6; ink = 0.6; gain = 0.003; v.taper = 0.3; L = 0.85 * L + 0.4 * uKeys; }
    v.wide *= 1.0 + 0.25 * lv[i];
    float there = 1.0, foot = 0.0;
    if (other) {
      float root = max(uOwn[1], 0.0), beds = max(-uOwn[1], 0.0), broad = max(uOwn[4], 0.0), slim = max(-uOwn[4], 0.0);
      if (uOwn[0] < 0.0) { if (i > 0) { there = 1.0 + uOwn[0]; if (there <= 0.0) continue; } else { L = mix(L, max(max(lv[0], lv[1]), max(lv[2], lv[3])), -uOwn[0]); at = mix(at, vec2(0.02, 0.0), -uOwn[0]); } }
      if (j > 3) { there = sat(uOwn[0] * 4.0 - fi + 4.0); at = vec2(-at.x * 1.15 + 0.12, 0.1 - at.y); ang += 2.4; bend = -bend; len *= 0.85; }
      if (root > 0.0) {
        float f = fi < 4.0 ? (i == 0 ? 0.72 : i == 1 ? -0.12 : i == 2 ? 0.3 : -0.62) : (i == 0 ? -1.02 : i == 1 ? 1.1 : i == 2 ? -0.35 : 0.05);
        len = mix(len, 0.46 + 0.07 * hash11(seed), root); ang = mix(ang, f, root);
        at = mix(at, vec2(0.04, -0.47) + vec2(-sin(f), cos(f)) * len * 0.92, root);
        curl *= 1.0 - root; bend *= 1.0 - 0.6 * root; foot = bend * len * len * 0.85 * root; v.taper = mix(v.taper, 0.06, root);
        v.wide = mix(v.wide, 0.36 + 0.12 * lv[i], root);
      }
      if (beds > 0.0) {
        float f = fi < 4.0 ? fi : fi - 4.0 + 0.5;
        ang = mix(ang, (mod(fi, 2.0) < 0.5 ? 1.5708 : -1.5708) + 0.08 * sin(seed), beds); len = mix(len, 0.95, beds);
        at = mix(at, vec2(0.3 * sin(seed * 2.1), 0.33 - 0.2 * f), beds);
        curl *= 1.0 - beds; bend *= 1.0 - 0.8 * beds; v.taper = mix(v.taper, 0.75, beds); v.wide = mix(v.wide, 0.3, beds); v.deep *= 1.0 - 0.45 * beds; v.twist *= 1.0 - 0.6 * beds;
      }
      v.wide *= (1.0 + 0.9 * broad) * (1.0 - 0.72 * slim); v.deep *= (1.0 + 0.5 * broad) * (1.0 - 0.62 * slim); v.taper = mix(v.taper, 0.55, 0.8 * broad);
      if (slim > 0.0) { gain *= 1.0 - 0.5 * slim; len *= 1.0 + 0.2 * slim; }
      if (uOwn[5] > 0.0) { v.twist *= 1.0 + 3.0 * uOwn[5]; v.deep *= 1.0 + 0.35 * uOwn[5]; v.waves *= 1.0 - 0.35 * uOwn[5]; }
      if (uOwn[5] < 0.0) { float k = 1.0 + uOwn[5]; v.twist *= k; curl *= k; bend *= k; v.turn = mix(1.35 + 0.12 * sin(go + seed), v.turn, k); v.deep *= 0.35 + 0.65 * k; }
    }
    at += 0.07 * (1.0 - 0.75 * abs(uOwn[1])) * vec2(sin(go * 0.8 + seed), cos(go * 0.63 + seed));
    vec2 q = p - at;
    q = rot(curl * exp(-dot(q, q) * 5.0) + ang + 0.2 * (1.0 - 0.6 * abs(uOwn[1])) * sin(go * 0.5)) * q;
    q.x -= bend * q.y * q.y + 0.05 * sin(q.y * 5.0 + go);
    if (other) q.x += foot + 0.05 * max(uOwn[1], 0.0) * sin(go - 4.6 * len);
    q.y *= 0.6 / len; // along every veil alike, big or small
    float along = exp(-6.5 * q.y * q.y * q.y * q.y) * smoothstep(-1.0, -0.1, q.y);
    along = max(along - 0.015, 0.0); along *= along / (along + 0.06) * 1.05; // each end thins out to nothing
    if (along <= 0.0) continue;
    vec3 s = slVeil(q, v);
    vec3 c = slLight(s, slInk(uKind[i]), ink) * (gain + (i < 2 ? 0.12 : 0.085) * L * (0.8 + 0.45 * uEnergy));
    if (i < 2) { vec4 pc = piece(vec2(0.5 + 0.62 * q.y, s.z / max(s.x, 1e-3))); c += slInk(pc.rgb) * s.x * 0.06; } // the piece, dyed in
    if (i == 0) c += (slInk(uKind[4]) + 0.4) * slGlint(s, q.y); // a hit: a glint runs along its edges
    if (other) { col = mix(col, slLay(col, c, s, uKind[i], L, along, q.y), there); continue; }
    col += c * along;
  }
  if (uOwn[7] < 0.0) col = slGrains(col, base, p0);
  return screenOf(col);
}
// One sheet to the right of the middle. It comes as a thread, turns its face to us as gauze, and is gone as the next comes.
vec3 slTurning(vec2 p) {
  vec2 d0 = p - vec2(0.3, 0.0);
  vec3 col = vec3(0.0012, 0.0016, 0.003) + vec3(0.002, 0.0027, 0.005) * exp(-4.0 * dot(d0, d0));
  vec2 p0 = p; vec3 base = col;
  bool other = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[3] != 0.0 || uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[7] != 0.0;
  if (uOwn[2] != 0.0) base = col = slBase(col, p);
  float root = max(uOwn[1], 0.0), beds = max(-uOwn[1], 0.0), broad = max(uOwn[4], 0.0), slim = max(-uOwn[4], 0.0);
  p *= 0.97 + 0.06 * uSpace;
  float open = 4.0 * uCue * (1.0 - uCue);
  for (int k = 0; k < (uOwn[0] > 0.0 ? 4 : 2); k++) {
    float c = slGo * 0.16 + 0.5 * float(k) + (k > 1 ? 0.25 : 0.0), n = mod(floor(c), 32.0), life = fract(c);
    float env = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.41, 0.58, life));
    if (env <= 0.0) continue;
    float seed = n * 7.31 + 3.0 * float(k) + 1.0;
    SlVeil v;
    v.seed = seed; v.phase = seed * 3.0 + slGo * 0.6; v.turn = 0.02 + 2.6 * life; v.twist = 2.4 * life; v.blur = 0.0018 + 0.0015 * (1.0 - uTone); v.taper = 0.12; v.fine = 0.5; v.parts = 11;
    v.wide = 0.65 + 0.2 * uLow + 0.35 * open; v.deep = 0.012 + 0.2 * smoothstep(-0.05, 0.5, life); v.waves = 1.8;
    vec2 q = p - vec2(0.2 + 0.1 * (hash11(seed) - 0.5), -0.03);
    q = rot((0.7 + 0.8 * hash11(seed + 2.0)) * exp(-dot(q, q) * 5.0) + 0.5 + 1.1 * (hash11(seed + 1.0) - 0.5)) * q;
    q.x -= 0.08 * sin(q.y * 4.0 + seed) - 0.6 * q.y * q.y;
    if (other) {
      float lean = 0.5 + 1.1 * (hash11(seed + 1.0) - 0.5), curl = 0.7 + 0.8 * hash11(seed + 2.0), bend = 1.0;
      SlVeil o = v;
      vec2 at = vec2(0.2 + 0.1 * (hash11(seed) - 0.5), -0.03);
      if (k > 1) { at.x -= 0.62; lean = -lean; env *= uOwn[0]; }
      if (uOwn[0] < 0.0) { o.waves *= 1.0 + 0.6 * uOwn[0]; o.deep *= 1.0 - 0.3 * uOwn[0]; o.wide *= 1.0 - 0.35 * uOwn[0]; at.x += 0.12 * uOwn[0]; }
      at = mix(at, vec2(0.02 + 0.14 * lean, 0.0), root); at = mix(at, vec2(0.12 * lean, 0.05 * lean), beds);
      lean = mix(lean, 0.45 * lean - 0.2 + (k > 1 ? 0.5 : 0.0), root); lean = mix(lean, 1.45 + 0.15 * lean, beds);
      curl *= 1.0 - 0.8 * max(root, beds); bend *= 1.0 - 0.6 * max(root, beds);
      o.turn += 0.6 * root;
      o.wide *= (1.0 + 0.9 * broad) * (1.0 - 0.72 * slim); o.deep *= (1.0 + 0.5 * broad) * (1.0 - 0.62 * slim); o.taper = mix(o.taper, 0.6, max(0.8 * broad, beds));
      if (uOwn[5] > 0.0) { o.twist *= 1.0 + 3.0 * uOwn[5]; o.twist += 4.0 * uOwn[5]; o.deep *= 1.0 + 0.2 * uOwn[5]; o.waves *= 1.0 - 0.35 * uOwn[5]; }
      if (uOwn[5] < 0.0) { float k1 = 1.0 + uOwn[5]; o.twist *= k1; curl *= k1; bend *= k1; o.turn = mix(1.2 + 0.5 * life, o.turn, k1); o.deep *= 0.4 + 0.6 * k1; }
      vec2 q2 = p - at;
      q2 = rot(curl * exp(-dot(q2, q2) * 5.0) + lean) * q2;
      if (beds > 0.0) q2.y *= mix(1.0, 0.62, beds);
      q2.x -= 0.08 * sin(q2.y * 4.0 + seed) - 0.6 * bend * q2.y * q2.y;
      float along = exp(-9.4 * q2.y * q2.y * q2.y * q2.y) * smoothstep(-0.75, -0.3, q2.y);
      along = max(along - 0.015, 0.0); along *= along / (along + 0.06) * 1.05; // each end thins out to nothing
      if (along <= 0.0) continue;
      float row = sat(q2.y * 1.2 + 0.5) * 3.0;
      vec4 near = max(1.0 - abs(row - vec4(0.0, 1.0, 2.0, 3.0)) * 0.7, 0.0);
      float L = dot(near, vec4(uDrone + 0.4 * uKeys, uPad, uTexture, uPhrase)) + 0.4 * uDrone;
      vec3 ink = slInk(kindColour(row)), sum = vec3(0.0), whole = vec3(0.0);
      for (int j = 0; j < 2; j++) {
        vec3 s = slVeil(q2 + vec2(0.0036 * float(j) - 0.0018, 0.0), o);
        vec4 pc = piece(vec2(0.5 + 0.62 * q2.y, s.z / max(s.x, 1e-3)));
        whole += 0.5 * s;
        vec3 c = slLight(s, ink, 0.8) + slInk(pc.rgb) * s.x * 0.7 + (slInk(uKind[4]) + 0.4) * slGlint(s, q2.y) * 9.0;
        sum += c * (j == 0 ? vec3(1.0, 0.5, 0.0) : vec3(0.0, 0.5, 1.0));
      }
      col = mix(col, slLay(col, sum * (0.05 + 0.14 * L * (0.8 + 0.45 * uEnergy) + 0.06 * uCue), whole, kindColour(row), min(L, 1.2), along, q2.y), env);
      continue;
    }
    float along = exp(-9.4 * q.y * q.y * q.y * q.y) * smoothstep(-0.75, -0.3, q.y);
    along = max(along - 0.015, 0.0); along *= along / (along + 0.06) * 1.05; // each end thins out to nothing
    if (along <= 0.0) continue;
    // each kind has its own length of the sheet
    float at = sat(q.y * 1.2 + 0.5) * 3.0;
    vec4 near = max(1.0 - abs(at - vec4(0.0, 1.0, 2.0, 3.0)) * 0.7, 0.0);
    float L = dot(near, vec4(uDrone + 0.4 * uKeys, uPad, uTexture, uPhrase)) + 0.4 * uDrone;
    vec3 ink = slInk(kindColour(at)), sum = vec3(0.0);
    // red bends a little less than blue, so the folds have coloured rims
    for (int j = 0; j < 2; j++) {
      vec3 s = slVeil(q + vec2(0.0036 * float(j) - 0.0018, 0.0), v);
      vec4 pc = piece(vec2(0.5 + 0.62 * q.y, s.z / max(s.x, 1e-3)));
      vec3 c = slLight(s, ink, 0.8) + slInk(pc.rgb) * s.x * 0.7 + (slInk(uKind[4]) + 0.4) * slGlint(s, q.y) * 9.0;
      sum += c * (j == 0 ? vec3(1.0, 0.5, 0.0) : vec3(0.0, 0.5, 1.0));
    }
    col += sum * along * env * (0.05 + 0.14 * L * (0.8 + 0.45 * uEnergy) + 0.06 * uCue);
  }
  if (uOwn[7] < 0.0) col = slGrains(col, base, p0);
  return screenOf(col);
}
vec3 render(vec2 p) {
  slT = uTime * 0.2;
  slGo = uTravel * 0.06 + uTime * 0.02;
  slDyed = min(1.0, abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[7]));
  slSilver = mix(SL_SILVER, 0.12 + 0.95 * uKind[4] * uKind[4], slDyed * 0.85); slThread = max(-uOwn[3], 0.0);
  if (uOwn[6] > 0.0) { // as wings are: what is on the right is on the left too
    vec2 m = vec2(abs(p.x), p.y);
    vec3 c = uVar < 0.5 ? slUnfolding(m) : slTurning(m);
    if (uOwn[6] < 1.0 && p.x < 0.0) c = mix(uVar < 0.5 ? slUnfolding(p) : slTurning(p), c, uOwn[6]);
    return c;
  }
  if (uOwn[6] < 0.0 && p.y < -0.22) { // the water, its ripples longer the nearer they are
    float far = -0.22 - p.y, still = 1.0 + uOwn[6];
    vec2 m = vec2(p.x + (0.002 + 0.05 * far) * sin(far * 60.0 / (0.25 + far) + uTime * 0.6 + 2.0 * noise(vec2(p.x * 5.0, far * 30.0))) * smoothstep(0.0, 0.05, far), -0.22 + far * 1.25);
    vec3 c = (uVar < 0.5 ? slUnfolding(m) : slTurning(m)) * (0.78 - 0.5 * far) ;
    c *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.012, far));
    if (still > 0.0) c = mix(c, uVar < 0.5 ? slUnfolding(p) : slTurning(p), still);
    return c;
  }
  return uVar < 0.5 ? slUnfolding(p) : slTurning(p);
}
