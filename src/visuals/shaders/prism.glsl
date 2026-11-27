// name: Prism
// a: Beam
// b: Thin films
// what: A beam of white light crosses a dark room into a block of glass and comes out as a wide fan of colour that hangs in the air and climbs the far wall in long soft bands.
// follows: The fan is as wide as the music is full; each kind of sound brightens its own part of the spectrum; a hit sends a pulse of brightness along the beam, through the glass and out across the fan.
// own: 0 the room: 1 pale and in daylight (b: the sheets lie on a pale table), -1 dusk in the drone's colour; 1 1 the light goes out all round (b: the sheets stand round a middle as petals), -1 one narrow blade (b: a stair of sheets); 2 the glass: 1 a tall pillar (b: round discs), -1 a low slab (b: long strips); 3 1 combed into many fine rays (b: many fine film lines), -1 one smooth wash; 4 the air: 1 thick with drifting smoke (b: clear glass, each sheet seen through the next), -1 quite clear (b: dull solid colour, no sheen); 5 the eye: 1 from straight above, -1 low and close; 6 1 hard flat stripes, -1 all of it in dots; 7 1 three blocks in a row (b: twelve sheets), -1 no block, the light alone (b: two sheets)
vec3 gCol[5];       // the spectrum, red to violet, each part as bright as its sound
vec2 gIn, gA, gE;   // the way the beam comes, where it goes into the glass, where it leaves
float gDir, gSpread, gPulse, gTurn;
const float ZW = 4.6, TALL = 0.86;
float gTall;
vec2 gRow;
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// Colours cut into flat stripes, as far as own 6 says.
float cutx(float x) { float f = fract(x); return floor(x) + smoothstep(0.46, 0.54, f); }
void place() {
  // in the order light breaks: red (hits), amber (texture), green (phrase), teal (drone), violet (pad)
  gCol[0] = rich(uKind[4], 2.3) * (0.16 + 1.5 * max(uHits, 0.5 * uTexture));
  gCol[1] = rich(uKind[2], 2.3) * (0.16 + 1.5 * uTexture);
  gCol[2] = rich(uKind[3], 2.3) * (0.16 + 1.5 * uPhrase);
  gCol[3] = rich(uKind[0], 2.3) * (0.16 + 1.5 * uDrone);
  gCol[4] = rich(uKind[1], 2.3) * (0.16 + 1.5 * uPad);
  gTurn = 0.16 * sin(uTime * 0.06);
  gIn = normalize(vec2(1.0, 0.22));
  gDir = 1.0 + gTurn;
  gSpread = 0.15 + 0.33 * uLevel * sqrt(uLevel) + 0.08 * uCue;
  gTall = TALL;
  if (uOwn[2] != 0.0) gTall *= uOwn[2] > 0.0 ? 1.0 + 1.1 * uOwn[2] : 1.0 + 0.72 * uOwn[2];
  gRow = vec2(1.75, 0.55);
  if (uOwn[7] < 0.0) gTall *= 1.0 + 0.2 * uOwn[7];
  if (uOwn[1] > 0.0) gSpread = mix(gSpread, 1.75 + 0.35 * uLevel, uOwn[1]);
  if (uOwn[1] < 0.0) gSpread *= 1.0 + 0.72 * uOwn[1];
  gA = -gIn * 0.3;
  gE = vec2(cos(gDir), sin(gDir)) * 0.3;
  gPulse = -3.5 + 9.5 * (1.0 - uHits);
}
// The colours across the fan: x 0 red to 4 violet.
vec3 spectrum(float x) {
  vec3 sp = vec3(0.0);
  for (int i = 0; i < 5; i++) { float d = x - float(i); sp += gCol[i] * exp(-d * d * 1.5); }
  return sp;
}
// The fan as it lies in plan (x across, y away from us).
vec3 fan(vec2 q) {
  vec2 v = q - gE; float r = length(v), ph = atan(v.y, v.x) - gDir;
  if (uOwn[1] > 0.0) ph = mod(ph + PI, TAU) - PI;
  float s = ph / gSpread;
  float e = max(abs(s) - 0.8, 0.0) * 2.6, win = exp(-e * e);
  // brighter lines inside it, where the glass gathers the light, slowly moving across
  float t = uTime * 0.25 + uTravel * 0.1;
  float line = 0.5 + 0.5 * sin(s * 13.0 + t + 2.2 * sin(s * 4.1 - t * 0.6));
  if (uOwn[3] > 0.0) { float l2 = 0.5 + 0.5 * sin(s * (30.0 + 24.0 * uOwn[1]) + t + 1.4 * sin(s * 9.0 - t * 0.6)); line = mix(line, 1.35 * l2 * l2, uOwn[3]); }
  line = 0.6 + 1.0 * line * line * line * line;
  if (uOwn[3] > 0.0) line = mix(line, 1.25 * max(line - 0.6, 0.0), uOwn[3]);
  if (uOwn[3] < 0.0) line = mix(line, 1.0, -uOwn[3]);
  float fall = smoothstep(0.0, 0.3, r) / (1.0 + 0.08 * r), pu = (r - gPulse) / 0.8;
  float sx = clamp(s, -1.3, 1.3) * 2.0 + 2.0;
  if (uOwn[6] > 0.0) { sx = mix(sx, cutx(sx), uOwn[6]); win = mix(win, smoothstep(1.24, 1.20, abs(s)), uOwn[6]); line = mix(line, 1.0 + 0.5 * step(0.5, fract(s * 4.0 + 0.5)), uOwn[6] * (1.0 - max(uOwn[3], 0.0))); }
  if (uOwn[1] < 0.0) line *= 1.0 - 0.1 * uOwn[1];
  else line *= 1.0 - 0.4 * uOwn[1];
  return spectrum(sx) * (win * line * fall * (1.0 + 3.2 * pow(uHits, 0.3) * step(0.01, uHits) * exp(-pu * pu)));
}
vec3 fans(vec2 q) {
  vec3 c = fan(q);
  if (uOwn[7] > 0.0) c = mix(c, c * 0.55 + 0.55 * (fan(q - gRow) + fan(q - 2.0 * gRow)), uOwn[7]);
  return c;
}
// How much of the light reaches a height: it leaves the glass as tall as the glass, and opens upward as it goes.
float reach(vec3 P) { float r = length(P.xz), top = gTall + 0.32 * r; return smoothstep(top + 0.05, top - 0.3 - 0.4 * r, P.y); }
float lines(vec2 q, float t) { float n = noise(q + vec2(t, -t * 0.7)) + 0.5 * noise(q * 2.1 - vec2(t * 0.6, t)); return pow(1.0 - abs(n / 0.75 - 1.0), 10.0); }
// The room: a floor and a far wall, black but for the light that falls on them.
vec3 room(vec3 ro, vec3 rd, out float t) {
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e5, tw = rd.z > 0.0 ? (ZW - ro.z) / rd.z : 1e5;
  t = min(tf, tw);
  vec3 P = ro + rd * min(t, 50.0);
  vec3 base = vec3(0.0);
  if (uOwn[0] > 0.0) {
    // daylight on plaster: the floor lighter than the wall, darker where they meet and where the block stands
    float corner = exp(-1.1 * (tf < tw ? ZW - P.z : P.y));
    base = uOwn[0] * vec3(1.75, 1.68, 1.55) * (tf < tw ? 0.95 : 0.74) * (1.0 - 0.28 * corner) * exp(-0.018 * t);
    base *= 1.0 - 0.45 * step(tf, tw) * exp(-dot(P.xz, P.xz) * 2.4) * (1.0 + min(uOwn[7], 0.0));
    base *= 0.97 + 0.06 * noise(P.xz * 9.0 + P.y * 7.0);
    vec3 fa = fans(P.xz);
    float am = sat(1.9 * max(fa.r, max(fa.g, fa.b))) * reach(P);
    return mix(fans(P.xz) * (reach(P) * (tf < tw ? 0.5 : 0.85) * exp(-t * 0.02) * step(t, 1e4)), base * mix(vec3(1.0), fa / max(max(fa.r, max(fa.g, fa.b)), 0.02), 0.95 * am) * (1.0 + 0.2 * am), uOwn[0]);
  }
  if (uOwn[0] < 0.0) base = -uOwn[0] * uKind[0] * (tf < tw ? 0.10 + 0.10 * exp(-0.2 * t) : 0.10 + 0.34 * exp(-0.9 * P.y)) * exp(-0.015 * t) * (0.8 + 0.5 * uLevel);
  return base + fans(P.xz) * (reach(P) * (tf < tw ? 0.5 : 0.85) * exp(-t * 0.02) * step(t, 1e4));
}
// The block of glass: three upright faces and a flat top. Gives where a ray goes in (or out, from inside), the face, and how near an edge.
float glassAt(vec3 ro, vec3 rd, bool inside, out vec3 n, out float edge) {
  float tn = -1e5, tfar = 1e5; vec3 nn = vec3(0.0), nf = vec3(0.0);
  float tn2 = -1e5, tf2 = 1e5;
  for (int i = 0; i < 4; i++) {
    float a = gTurn * 0.5 + 0.35 + float(i) * TAU / 3.0;
    vec3 m = i < 3 ? vec3(cos(a), 0.0, sin(a)) : vec3(0.0, 1.0, 0.0);
    float off = i < 3 ? 0.34 : gTall;
    float den = dot(rd, m), dist = dot(ro, m) - off, tt = -dist / den;
    if (den < 0.0) { if (tt > tn) { tn2 = tn; tn = tt; nn = m; } else tn2 = max(tn2, tt); }
    else { if (tt < tfar) { tf2 = tfar; tfar = tt; nf = m; } else tf2 = min(tf2, tt); }
  }
  if (inside) { n = nf; edge = tf2 - tfar; return tfar; }
  n = nn; edge = min(tn - tn2, tfar - tn);
  return tn < tfar && tn > 0.0 ? tn : -1.0;
}
// Inside the glass: the beam crossing it and opening into colour, and thin bright lines that wander about in there.
vec3 within(vec3 P) {
  vec2 q = P.xz, ab = gE - gA;
  float h = sat(dot(q - gA, ab) / dot(ab, ab));
  vec2 off = q - gA - ab * h;
  float d = length(off), side = off.x * ab.y - off.y * ab.x > 0.0 ? 1.0 : -1.0;
  float up = (P.y - (uOwn[2] != 0.0 ? 0.45 * gTall / TALL : 0.45)) / (0.07 + 0.3 * h);
  vec3 hue = spectrum(2.0 + side * d * 30.0 / (0.25 + h));
  vec3 c = mix(vec3(1.0, 0.93, 0.8) * (0.6 + uLevel + 2.0 * uHits), hue * 1.5, h * h) * exp(-d * d / (0.0012 + 0.012 * h * h) - up * up);
  float tt = uTime * 0.2 + uTravel * 0.08;
  c += spectrum(2.0 + 2.5 * sin(q.x * 5.0 + P.y * 3.0 + tt)) * lines(q * 5.0 + P.y * 1.5, tt) * (0.45 + 1.4 * uHits);
  return c;
}

vec3 beamRoom(vec2 p) {
  float ca = 0.1 * sin(uTime * 0.05);
  vec3 ta = vec3(1.75, 0.5, 2.3);
  vec3 ro = ta + vec3(sin(ca - 0.5) * 7.0, 1.55 + 0.15 * sin(uTime * 0.04), -cos(ca - 0.5) * 7.0);
  if (uOwn[5] > 0.0) { ta = mix(ta, vec3(1.2, 0.2, 1.5), uOwn[5]); ro = mix(ro, ta + vec3(0.25 * sin(ca), 7.2, -1.6), uOwn[5]); }
  if (uOwn[5] < 0.0) { ta = mix(ta, vec3(0.55, 0.62 + 0.4 * max(gTall - TALL, 0.0), 0.8), -uOwn[5]); ro = mix(ro, ta + vec3(sin(ca - 0.35) * 3.1, -0.05, -cos(ca - 0.35) * 3.1), -uOwn[5]); }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.3 + rt * p.x + up * p.y);
  float ts; vec3 col = room(ro, rd, ts);
  vec3 n; float edge, tg = glassAt(ro, rd, false, n, edge);
  vec3 atRow = vec3(0.0);
  if (uOwn[7] > 0.0) {
    for (int k = 1; k < 3; k++) {
      vec3 n3, o3 = vec3(gRow.x, 0.0, gRow.y) * (float(k) * uOwn[7]); float e3, t3 = glassAt(ro - o3, rd, false, n3, e3);
      if (t3 > 0.0 && (tg < 0.0 || t3 < tg)) { tg = t3; n = n3; edge = e3; atRow = o3; }
    }
  }
  if (uOwn[7] < 0.0 && uOwn[7] < -0.98) tg = -1.0;
  vec3 noGlass = col;
  if (tg > 0.0 && tg < ts) {
    ts = tg;
    vec3 P = ro + rd * tg;
    float fres = 0.04 + 0.96 * pow(1.0 - sat(dot(-rd, n)), 5.0), t2, e2;
    vec3 ri = refract(rd, n, 1.0 / 1.48), n2;
    float tin = glassAt(P - atRow + ri * 0.001, ri, true, n2, e2);
    vec3 Pe = P + ri * tin;
    vec3 ro2 = refract(ri, -n2, 1.48);
    float turned = dot(ro2, ro2) < 0.5 ? 1.0 : 0.0;       // it cannot get out here: it turns back in
    ro2 = mix(ro2, reflect(ri, -n2), turned);
    vec3 seen = room(Pe, ro2, t2) * (1.0 - fres) * mix(0.9, 0.5, turned);
    // the light caught inside
    seen += (within(P - atRow + ri * tin * 0.3) + within(P - atRow + ri * tin * 0.7)) * tin * 1.3 * (1.0 - 0.45 * max(uOwn[0], 0.0));
    // its edges catch a little of everything
    float w = tg * 0.004;
    seen += (vec3(0.6, 0.75, 1.0) * (0.25 + 0.6 * uLevel + 1.0 * uCue) + spectrum(3.0 * P.y / gTall + 0.5) * 0.6) * (smoothstep(w * 3.0, w, edge) + 0.5 * smoothstep(0.02, 0.0, e2) * (1.0 - fres));
    seen += vec3(0.6, 0.75, 1.0) * (0.012 + 0.07 * fres) * (0.5 + uLevel);
    col = uOwn[7] < 0.0 ? mix(seen, noGlass, -uOwn[7]) : seen;
  }
  float jit = grain(gl_FragCoord.xy + fract(uTime * 1.7) * 43.0);
  if (uOwn[6] < 0.0) jit = mix(jit, hash21(floor(rot(0.5) * p / 0.0115) + 200.0), min(-4.0 * uOwn[6], 1.0));   // one for each dot, and it stays
  // the fan hanging in the air of the room, as dust shows it
  float dt = min(ts, 14.0) / 7.0;
  vec3 air = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    vec3 P = ro + rd * ((float(i) + jit) * dt);
    vec3 av = fans(P.xz) * reach(P);
    if (uOwn[4] > 0.0) { float sm = noise(P * vec3(1.3, 1.1, 1.3) + vec3(-0.05, -0.06, 0.03) * uTime) + 0.5 * noise(P * 3.1 + vec3(0.04, -0.09, 0.02) * uTime); av *= 1.0 + uOwn[4] * (2.0 * smoothstep(0.45, 1.05, sm) - 0.45); }
    air += av;
  }
  col += air * dt * 0.34 * (1.0 + 0.4 * max(uOwn[4], 0.0)) * (1.0 - 0.65 * max(uOwn[3], 0.0)) * (1.0 + 0.97 * min(uOwn[4], 0.0)) * (1.0 - 0.85 * max(uOwn[0], 0.0));
  // and the beam on its way in: a round pencil of light, seen by the dust in it
  vec3 A3 = vec3(gA.x, uOwn[2] != 0.0 ? 0.45 * gTall / TALL : 0.45, gA.y), d3 = vec3(gIn.x, 0.0, gIn.y), w0 = ro - A3;
  float b = dot(rd, d3), den = 1.0 - b * b;
  for (int k = 0; k < 3; k++) {
    if (k > 0 && uOwn[7] <= 0.0) break;
    vec3 wk = w0 - vec3(gRow.x, 0.0, gRow.y) * (float(k) * uOwn[7]);
    if (k == 0) wk = w0;
    float d = dot(rd, wk), e = dot(d3, wk);
    float t1 = (b * e - d) / den, al = (e - b * d) / den;          // how far along our ray, and along the beam, they pass closest
    float gap = length(wk + rd * t1 - d3 * al), pu = (al - gPulse) / 0.45;
    float lit = step(t1, ts) * smoothstep(0.02, -0.06, al) * exp(al * 0.1) / sqrt(den);
    if (k > 0) lit *= uOwn[7] * smoothstep(-1.75, -0.9, al);
    if (uOwn[7] < 0.0) lit *= 1.0 + uOwn[7];
    col += vec3(1.0, 0.92, 0.78) * lit * (0.55 + 0.8 * uLevel) * (exp(-gap * gap / 0.0018) * 1.2 + 0.07 * exp(-gap * gap / 0.02)) * (1.0 + 5.0 * sqrt(uHits) * exp(-pu * pu));
  }
  return col;
}

// ---- b: thin films ----
// Six sheets of dark glass lie fanned one on another, each with a film on it thinner than a wave of light.
const int SHEETS = 12;
float gMany;   // how many sheets there are
vec2 gPivot;
float gStep;
float sheetAt(int i, vec2 xz, out vec2 q) {
  q = (xz - gPivot) * rot(0.32 - float(i) * gStep) - vec2(1.75, 0.85);
  if (uOwn[1] > 0.0) { q += uOwn[1] * vec2(0.75, 0.85); q *= 1.0 + 0.7 * uOwn[1]; }
  if (uOwn[1] < 0.0) { float fs = float(i) - 2.5; q += uOwn[1] * (fs * vec2(0.30, 0.46) - vec2(0.0, 0.1)); }
  float gone = 1.6 * (1.0 - sat(gMany - float(i)));
  if (uOwn[2] != 0.0) {
    float s2 = abs(uOwn[2]);
    vec2 hf = uOwn[2] > 0.0 ? mix(vec2(2.1, 1.25), vec2(1.35), s2) : mix(vec2(2.1, 1.25), vec2(2.7, 0.34), s2);
    float rr = uOwn[2] > 0.0 ? mix(0.3, 1.35, s2) : mix(0.3, 0.06, s2);
    vec2 d2 = abs(q) - hf + rr;
    return length(max(d2, 0.0)) + min(max(d2.x, d2.y), 0.0) - rr + gone;
  }
  vec2 dd = abs(q) - vec2(2.1, 1.25) + 0.3;
  return length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0) - 0.3 + gone;
}
// The colours a film goes through as it thickens, taken round the piece's own: violet, teal, green, amber, red and round again.
vec3 filmHue(float ph) {
  float x = fract(ph) * 5.0;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 5; i++) { float d = abs(x - float(i)); d = min(d, 5.0 - d); c += rich(uKind[i == 0 ? 1 : i == 1 ? 0 : i == 2 ? 3 : i == 3 ? 2 : 4], 2.2) * exp(-d * d * 2.6); }
  return c;
}
vec3 sheetLight(vec3 ro, vec3 rd, vec3 P, vec2 hq, float hi, float hd, float lv[5]) {
  int kind = int(mod(hi * 2.0, 5.0));
  float loud = lv[kind];
  float tt = uTime * 0.05 + uTravel * 0.02;
  // the sheet is not quite flat, and its film not quite even
  vec2 wv = vec2(noise(P.xz * 0.6 + hi * 3.1 + tt) - 0.5, noise(P.xz * 0.6 + hi * 5.7 - tt + 9.0) - 0.5);
  vec3 n = normalize(vec3(wv.x * 0.22, 1.0, wv.y * 0.22));
  float cs = sat(dot(n, -rd));
  vec3 rr = reflect(rd, n);
  float ring = length(P.xz - gPivot) - (1.0 - uHits) * 6.0, pulse = sqrt(uHits) * exp(-ring * ring * 1.6);
  float thick = hi * 0.23 + 0.22 * hq.x + 0.1 * hq.y + 0.5 * (wv.x + wv.y) + 0.35 * loud + uLoop + 0.3 * pulse;
  float ph = thick + 1.9 * (1.0 - cs) * (1.0 - cs);
  if (uOwn[3] > 0.0) ph = (ph - uLoop) * (1.0 + 1.8 * uOwn[3]) + uLoop;
  if (uOwn[3] < 0.0) ph = mix(ph - uLoop, hi * 0.23 + 0.25 * loud, -0.85 * uOwn[3]) + uLoop;
  float band = pow(0.5 + 0.5 * cos(TAU * ph * 2.0 + hi), 1.5);
  if (uOwn[6] > 0.0) { band = mix(band, smoothstep(0.30, 0.36, band), uOwn[6]); ph = mix(ph, (cutx(ph * 5.0)) / 5.0, uOwn[6]); }
  vec3 hue = mix(rich(uKind[1], 2.0) * vec3(0.25, 0.2, 0.9) * 0.5, filmHue(ph), 0.1 + 0.9 * band);   // between its bright bands a film goes to deep blue, not to grey
  // what the film has to give back: one wide soft light low ahead, and a dimmer one high to the left
  vec3 L = normalize(vec3(-0.2, 0.48, 1.0));
  float lamp = pow(sat(dot(rr, L)), 14.0) + 0.12 * pow(sat(dot(rr, normalize(vec3(-0.8, 0.4, 0.45)))), 6.0);
  if (uOwn[5] > 0.0) lamp = mix(lamp, 0.12 + 0.75 * pow(sat(dot(rr, normalize(vec3(-0.05, 1.0, 0.42)))), 5.0), uOwn[5]);
  if (uOwn[0] > 0.0) lamp = mix(lamp, max(lamp, 0.32), uOwn[0]);
  float fres = 0.12 + 0.88 * pow(1.0 - cs, 2.5);
  // the sheets above keep the light off the ones below, softly
  float sh = 1.0;
  for (int j = 1; j < SHEETS; j++) {
    float over = step(hi + 0.5, float(j)); vec2 q;
    if (float(j) > gMany) break;
    float d = sheetAt(j, P.xz + rr.xz * ((float(j) - hi) * 0.1 / max(rr.y, 0.08)), q);
    sh *= 1.0 - over * 0.8 * smoothstep(0.25, -0.35, d);
  }
  if (uOwn[5] > 0.0) fres = mix(fres, max(fres, 0.5), uOwn[5]);
  if (uOwn[4] < 0.0) { hue = mix(hue, filmHue(hi * 0.23 + 0.15 * hq.x * (1.0 + uOwn[3])), -uOwn[4]); lamp = mix(lamp, 0.55 + 0.1 * (wv.x + wv.y), -uOwn[4]); fres = mix(fres, 0.5, -uOwn[4]); }
  vec3 col = hue * lamp * fres * sh * (uOwn[4] < 0.0 ? mix(0.08 + 1.5 * loud, 0.5 + 0.8 * loud, -uOwn[4]) : 0.08 + 1.5 * loud) * 2.4;
  // the cut edge of a sheet catches the light
  col += filmHue(ph + 0.3) * smoothstep(-0.035, 0.0, hd) * (0.06 + 0.9 * loud + 1.2 * pulse);
  col += hue * pulse * 0.6 * fres;
  return col;
}
vec3 films(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  p += (vec2(grain(gl_FragCoord.xy + fract(uTime * 3.7) * 61.0), grain(gl_FragCoord.yx + 31.0 + fract(uTime * 2.9) * 47.0)) - 0.5) / uRes.y;
  gPivot = vec2(-1.55, -0.9);
  gStep = 0.1 + 0.2 * uLevel + 0.04 * uCue;
  gMany = 6.0 + (uOwn[7] > 0.0 ? 6.0 : 4.0) * uOwn[7];
  if (uOwn[7] > 0.0) gStep *= 1.0 - 0.45 * uOwn[7];
  if (uOwn[7] < 0.0) gStep *= 1.0 - 1.3 * uOwn[7];
  if (uOwn[1] > 0.0) { gStep = mix(gStep, TAU / gMany + 0.06 * uLevel, uOwn[1]); gPivot = mix(gPivot, vec2(0.1, 0.5), uOwn[1]); }
  if (uOwn[1] < 0.0) { gStep *= 1.0 + 0.9 * uOwn[1]; gPivot += -uOwn[1] * vec2(0.0, 0.3); }
  float ca = 0.18 * sin(uTime * 0.05) + 0.15;
  vec3 ta = vec3(0.1, 0.2, 0.5);
  vec3 ro = ta + vec3(sin(ca) * 5.6, 1.9 + 0.2 * sin(uTime * 0.037), -cos(ca) * 5.6);
  if (uOwn[5] > 0.0) ro = mix(ro, ta + vec3(1.2 * sin(ca), 6.4, -1.4), uOwn[5]);
  if (uOwn[5] < 0.0) ro = mix(ro, ta + vec3(sin(ca) * 4.2, 0.95, -cos(ca) * 4.2), -uOwn[5]);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.5 + rt * p.x + up * p.y);
  if (uOwn[5] < 0.0) rd.y = min(rd.y, -0.002);
  // the table, where there is one
  float tb = (-0.06 - ro.y) / min(rd.y, -0.002);
  vec3 B = ro + rd * tb, table = vec3(0.0);
  if (uOwn[0] != 0.0) {
    float shd = 1.0;
    for (int j = 0; j < SHEETS; j++) { if (float(j) > gMany) break; vec2 q; shd *= 1.0 - 0.5 * smoothstep(0.22, -0.22, sheetAt(j, B.xz + vec2(-0.10, 0.14) * (0.6 + float(j) * 0.35), q)); }
    vec3 pale = vec3(1.7, 1.63, 1.5) * (0.97 + 0.06 * noise(B.xz * 14.0)) * exp(-0.06 * max(tb - 5.0, 0.0)) * (0.30 + 0.70 * shd);
    vec3 dusk = uKind[0] * (0.10 + 0.22 * exp(-0.22 * max(tb - 3.0, 0.0))) * (0.35 + 0.65 * shd) * (0.8 + 0.4 * uLevel);
    table = uOwn[0] > 0.0 ? uOwn[0] * pale : -uOwn[0] * dusk;
  }
  float found = 0.0, hi = 0.0, hd = 0.0; vec3 P = vec3(0.0); vec2 hq = vec2(0.0);
  float over[12];
  for (int i = SHEETS - 1; i >= 0; i--) {
    over[i] = 1.0;
    if (float(i) >= gMany) continue;
    float t = (float(i) * 0.1 - ro.y) / rd.y;
    vec3 Q = ro + rd * t; vec2 q;
    float d = sheetAt(i, Q.xz, q);
    if (t > 0.0) over[i] = d;
    if (found < 0.5 && d < 0.0 && t > 0.0) { found = 1.0; hi = float(i); hd = d; P = Q; hq = q; }
  }
  if (found < 0.5) return table;
  vec3 col = sheetLight(ro, rd, P, hq, hi, hd, lv);
  if (uOwn[0] > 0.0) col += uOwn[0] * 0.05 * vec3(0.9, 0.95, 1.0);
  if (uOwn[4] > 0.0) {
    // clear: what lies under is seen through it, each sheet a little of its own tint
    vec3 thru = table, tint = vec3(1.0), add = vec3(0.0);
    for (int i = 0; i < SHEETS; i++) {
      if (over[i] >= 0.0) continue;
      float fi = float(i), lo = lv[int(mod(fi * 2.0, 5.0))];
      vec3 k = filmHue(fi * 0.23 + 0.2); k /= max(max(k.r, max(k.g, k.b)), 0.05);
      tint *= mix(vec3(1.0), 0.16 + 0.84 * k, 0.8);
      add = add * 0.82 + k * (0.035 + 0.10 * lo) + filmHue(fi * 0.23 + 0.5) * smoothstep(-0.035, 0.0, over[i]) * (0.14 + 0.5 * lo);
    }
    vec3 clear = thru * tint + add * (uOwn[0] > 0.0 ? 0.35 : 1.6) + 0.75 * col;
    col = mix(col, clear, uOwn[4]);
  }
  return col * exp(-max(length(P - ro) - 5.0, 0.0) * 0.12);
}

vec3 render(vec2 p) {
  place();
  vec3 col = uVar > 0.5 ? films(p) : beamRoom(p);
  vec3 c = screenOf(col);
  if (uOwn[6] < 0.0) {
    // the light gathered into dots, the brighter the larger
    float g = 0.0115, l0 = dot(c, vec3(0.3, 0.59, 0.11));
    vec2 gp = rot(0.5) * p / g, f = fract(gp) - 0.5;
    float aa = clamp(1.2 * length(vec2(dFdx(gp.x), dFdy(gp.x))), 0.02, 0.5);
    float rr = 0.62 * sqrt(sat(1.15 * l0)), on = smoothstep(rr + aa, rr - aa, length(f)) * smoothstep(0.01, 0.06, l0);
    c = mix(c, min(c * 1.3 + 0.03, 1.0) * on, -uOwn[6]);
  }
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  float g = grain(floor(gl_FragCoord.xy / max(1.0, floor(uRes.y / 540.0 + 0.5))) + floor(uTime * 12.0) * 17.0) - 0.5;
  return c + c * g * 0.2 * (1.0 - lum) * (1.0 - 0.75 * max(uOwn[0], 0.0));
}
