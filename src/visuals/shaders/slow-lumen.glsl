// name: Slow lumen
// a: Unfolding
// b: Turning over
// what: Veils of silver and coloured light unfold in the dark out of threads, turn inside themselves and drift: where a sheet folds back it gathers into a bright edge, where it faces us it is gauze; or one sheet alone to the right, first a thread, then turning its face, then fading as the next thread comes.
// follows: Each kind of sound is a veil that brightens and widens, or in the second picture a length of the one sheet; the low opens it; the piece is dyed in; a hit runs a glint along the folds, a cue opens a veil wide; keys light the phrase veil or the foot of the sheet, a voice the folds; fuller music carries them on faster.
// A veil is a thin sheet seen through: at each height its cross-cut is a smooth curve, and the light at a point is how much of
// the sheet lies behind it. Where the sheet turns back on itself it piles up into a bright edge.
float slT, slGo; // the slow clock of the folds, and the one that goes faster with the music
struct SlVeil { float wide, deep, waves, phase, turn, twist, blur, seed, taper, fine; int parts; };
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
  return mix(SL_SILVER, ink, 0.15 + much * smoothstep(0.15, 0.75, u)) * s.x + SL_SILVER * (0.6 + 0.5 * uTone + 0.8 * uHigh + 0.8 * uMic) * s.y;
}
// A hit: a glint that runs up a sheet, brightest on its edges.
float slGlint(vec3 s, float y) {
  float g = y - mix(0.45, -0.12, uHits);
  return (0.06 * s.x + 0.5 * s.y) * uHits * exp(-g * g * 60.0);
}
vec3 slUnfolding(vec2 p) {
  vec2 d0 = p - vec2(0.1, 0.05);
  vec3 col = vec3(0.0012, 0.0016, 0.003) + vec3(0.0015, 0.003, 0.0065) * exp(-3.0 * dot(d0, d0));
  float lv[4] = float[4](uDrone, uPad, uTexture, uPhrase);
  float open = 4.0 * uCue * (1.0 - uCue);
  p *= 0.97 + 0.06 * uSpace;
  for (int i = 0; i < 4; i++) {
    float fi = float(i), seed = 3.7 + fi * 11.3, L = lv[i], ink = 0.8, gain;
    float go = slGo * (0.8 + 0.13 * fi) + fi * 1.9;
    vec2 at; float ang, bend, curl, len; SlVeil v;
    v.seed = seed; v.phase = go * 0.9; v.turn = go * 0.7 + seed; v.blur = 0.0018 + 0.0025 * (1.0 - uTone); v.taper = 0.08; v.fine = i < 2 ? 0.0 : -1.0; v.parts = i == 2 ? 10 : i == 3 ? 8 : 9;
    if (i == 0)      { at = vec2(0.08, 0.0); ang = -0.95; bend = -0.8; curl = -0.8; len = 0.62; v.wide = 0.75 + 0.3 * uLow; v.deep = 0.17; v.waves = 1.5; v.twist = 1.6; gain = 0.045; }
    else if (i == 1) { at = vec2(0.22, 0.06); ang = 0.35; bend = 1.2; curl = 1.7; len = 0.42; v.wide = 0.5 + 0.5 * open; v.deep = 0.11; v.waves = 1.7; v.twist = -2.2; gain = 0.008; L += 0.7 * uCue; }
    else if (i == 2) { at = vec2(-0.47, 0.2); ang = 2.5; bend = 1.3; curl = 1.5; len = 0.34; v.wide = 0.3; v.deep = 0.11; v.waves = 2.4; v.twist = 3.0; ink = 0.6; gain = 0.003; v.blur *= 1.6; v.taper = 0.3; }
    else             { at = vec2(0.46, -0.17); ang = 1.35; bend = -0.7; curl = -1.3; len = 0.46; v.wide = 0.26; v.deep = 0.11; v.waves = 1.5; v.twist = 2.6; ink = 0.6; gain = 0.003; v.taper = 0.3; L = 0.85 * L + 0.4 * uKeys; }
    v.wide *= 1.0 + 0.25 * lv[i];
    at += 0.07 * vec2(sin(go * 0.8 + seed), cos(go * 0.63 + seed));
    vec2 q = p - at;
    q = rot(curl * exp(-dot(q, q) * 5.0) + ang + 0.2 * sin(go * 0.5)) * q;
    q.x -= bend * q.y * q.y + 0.05 * sin(q.y * 5.0 + go);
    q.y *= 0.6 / len; // along every veil alike, big or small
    float along = exp(-6.5 * q.y * q.y * q.y * q.y) * smoothstep(-1.0, -0.1, q.y);
    along = max(along - 0.015, 0.0); along *= along / (along + 0.06) * 1.05; // each end thins out to nothing
    if (along <= 0.0) continue;
    vec3 s = slVeil(q, v);
    vec3 c = slLight(s, slInk(uKind[i]), ink) * (gain + (i < 2 ? 0.12 : 0.085) * L * (0.8 + 0.45 * uEnergy));
    if (i < 2) { vec4 pc = piece(vec2(0.5 + 0.62 * q.y, s.z / max(s.x, 1e-3))); c += slInk(pc.rgb) * s.x * 0.06; } // the piece, dyed in
    if (i == 0) c += (slInk(uKind[4]) + 0.4) * slGlint(s, q.y); // a hit: a glint runs along its edges
    col += c * along;
  }
  return screenOf(col);
}
// One sheet to the right of the middle. It comes as a thread, turns its face to us as gauze, and is gone as the next comes.
vec3 slTurning(vec2 p) {
  vec2 d0 = p - vec2(0.3, 0.0);
  vec3 col = vec3(0.0012, 0.0016, 0.003) + vec3(0.002, 0.0027, 0.005) * exp(-4.0 * dot(d0, d0));
  p *= 0.97 + 0.06 * uSpace;
  float open = 4.0 * uCue * (1.0 - uCue);
  for (int k = 0; k < 2; k++) {
    float c = slGo * 0.16 + 0.5 * float(k), n = mod(floor(c), 32.0), life = fract(c);
    float env = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.41, 0.58, life));
    if (env <= 0.0) continue;
    float seed = n * 7.31 + 3.0 * float(k) + 1.0;
    SlVeil v;
    v.seed = seed; v.phase = seed * 3.0 + slGo * 0.6; v.turn = 0.02 + 2.6 * life; v.twist = 2.4 * life; v.blur = 0.0018 + 0.0015 * (1.0 - uTone); v.taper = 0.12; v.fine = 0.5; v.parts = 11;
    v.wide = 0.65 + 0.2 * uLow + 0.35 * open; v.deep = 0.012 + 0.2 * smoothstep(-0.05, 0.5, life); v.waves = 1.8;
    vec2 q = p - vec2(0.2 + 0.1 * (hash11(seed) - 0.5), -0.03);
    q = rot((0.7 + 0.8 * hash11(seed + 2.0)) * exp(-dot(q, q) * 5.0) + 0.5 + 1.1 * (hash11(seed + 1.0) - 0.5)) * q;
    q.x -= 0.08 * sin(q.y * 4.0 + seed) - 0.6 * q.y * q.y;
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
  return screenOf(col);
}
vec3 render(vec2 p) {
  slT = uTime * 0.2;
  slGo = uTravel * 0.06 + uTime * 0.02;
  return uVar < 0.5 ? slUnfolding(p) : slTurning(p);
}
