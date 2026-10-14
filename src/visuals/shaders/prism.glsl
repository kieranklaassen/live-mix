// name: Prism
// a: Beam
// b: Thin films
// what: A beam of white light crosses a dark room into a block of glass and comes out as a wide fan of colour that hangs in the air and climbs the far wall in long soft bands.
// follows: The fan is as wide as the music is full; each kind of sound brightens its own part of the spectrum; a hit sends a pulse of brightness along the beam, through the glass and out across the fan.
vec3 gCol[5];       // the spectrum, red to violet, each part as bright as its sound
vec2 gIn, gA, gE;   // the way the beam comes, where it goes into the glass, where it leaves
float gDir, gSpread, gPulse, gTurn;
const float ZW = 4.6, TALL = 0.86;
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, k), 0.0); }
float grain(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

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
  vec2 v = q - gE; float r = length(v), ph = atan(v.y, v.x) - gDir, s = ph / gSpread;
  float e = max(abs(s) - 0.8, 0.0) * 2.6, win = exp(-e * e);
  // brighter lines inside it, where the glass gathers the light, slowly moving across
  float t = uTime * 0.25 + uTravel * 0.1;
  float line = 0.5 + 0.5 * sin(s * 13.0 + t + 2.2 * sin(s * 4.1 - t * 0.6));
  line = 0.6 + 1.0 * line * line * line * line;
  float fall = smoothstep(0.0, 0.3, r) / (1.0 + 0.08 * r), pu = (r - gPulse) / 0.8;
  return spectrum(clamp(s, -1.3, 1.3) * 2.0 + 2.0) * (win * line * fall * (1.0 + 3.2 * pow(uHits, 0.3) * step(0.01, uHits) * exp(-pu * pu)));
}
// How much of the light reaches a height: it leaves the glass as tall as the glass, and opens upward as it goes.
float reach(vec3 P) { float r = length(P.xz), top = TALL + 0.32 * r; return smoothstep(top + 0.05, top - 0.3 - 0.4 * r, P.y); }
float lines(vec2 q, float t) { float n = noise(q + vec2(t, -t * 0.7)) + 0.5 * noise(q * 2.1 - vec2(t * 0.6, t)); return pow(1.0 - abs(n / 0.75 - 1.0), 10.0); }
// The room: a floor and a far wall, black but for the light that falls on them.
vec3 room(vec3 ro, vec3 rd, out float t) {
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e5, tw = rd.z > 0.0 ? (ZW - ro.z) / rd.z : 1e5;
  t = min(tf, tw);
  vec3 P = ro + rd * min(t, 50.0);
  return fan(P.xz) * (reach(P) * (tf < tw ? 0.5 : 0.85) * exp(-t * 0.02) * step(t, 1e4));
}
// The block of glass: three upright faces and a flat top. Gives where a ray goes in (or out, from inside), the face, and how near an edge.
float glassAt(vec3 ro, vec3 rd, bool inside, out vec3 n, out float edge) {
  float tn = -1e5, tfar = 1e5; vec3 nn = vec3(0.0), nf = vec3(0.0);
  float tn2 = -1e5, tf2 = 1e5;
  for (int i = 0; i < 4; i++) {
    float a = gTurn * 0.5 + 0.35 + float(i) * TAU / 3.0;
    vec3 m = i < 3 ? vec3(cos(a), 0.0, sin(a)) : vec3(0.0, 1.0, 0.0);
    float off = i < 3 ? 0.34 : TALL;
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
  float up = (P.y - 0.45) / (0.07 + 0.3 * h);
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
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.3 + rt * p.x + up * p.y);
  float ts; vec3 col = room(ro, rd, ts);
  vec3 n; float edge, tg = glassAt(ro, rd, false, n, edge);
  if (tg > 0.0 && tg < ts) {
    ts = tg;
    vec3 P = ro + rd * tg;
    float fres = 0.04 + 0.96 * pow(1.0 - sat(dot(-rd, n)), 5.0), t2, e2;
    vec3 ri = refract(rd, n, 1.0 / 1.48), n2;
    float tin = glassAt(P + ri * 0.001, ri, true, n2, e2);
    vec3 Pe = P + ri * tin;
    vec3 ro2 = refract(ri, -n2, 1.48);
    float turned = dot(ro2, ro2) < 0.5 ? 1.0 : 0.0;       // it cannot get out here: it turns back in
    ro2 = mix(ro2, reflect(ri, -n2), turned);
    vec3 seen = room(Pe, ro2, t2) * (1.0 - fres) * mix(0.9, 0.5, turned);
    // the light caught inside
    seen += (within(P + ri * tin * 0.3) + within(P + ri * tin * 0.7)) * tin * 1.3;
    // its edges catch a little of everything
    float w = tg * 0.004;
    seen += (vec3(0.6, 0.75, 1.0) * (0.25 + 0.6 * uLevel + 1.0 * uCue) + spectrum(3.0 * P.y / TALL + 0.5) * 0.6) * (smoothstep(w * 3.0, w, edge) + 0.5 * smoothstep(0.02, 0.0, e2) * (1.0 - fres));
    seen += vec3(0.6, 0.75, 1.0) * (0.012 + 0.07 * fres) * (0.5 + uLevel);
    col = seen;
  }
  float jit = grain(gl_FragCoord.xy + fract(uTime * 1.7) * 43.0);
  // the fan hanging in the air of the room, as dust shows it
  float dt = min(ts, 14.0) / 7.0;
  vec3 air = vec3(0.0);
  for (int i = 0; i < 7; i++) {
    vec3 P = ro + rd * ((float(i) + jit) * dt);
    air += fan(P.xz) * reach(P);
  }
  col += air * dt * 0.34;
  // and the beam on its way in: a round pencil of light, seen by the dust in it
  vec3 A3 = vec3(gA.x, 0.45, gA.y), d3 = vec3(gIn.x, 0.0, gIn.y), w0 = ro - A3;
  float b = dot(rd, d3), d = dot(rd, w0), e = dot(d3, w0), den = 1.0 - b * b;
  float t1 = (b * e - d) / den, al = (e - b * d) / den;          // how far along our ray, and along the beam, they pass closest
  float gap = length(w0 + rd * t1 - d3 * al), pu = (al - gPulse) / 0.45;
  float lit = step(t1, ts) * smoothstep(0.02, -0.06, al) * exp(al * 0.1) / sqrt(den);
  col += vec3(1.0, 0.92, 0.78) * lit * (0.55 + 0.8 * uLevel) * (exp(-gap * gap / 0.0018) * 1.2 + 0.07 * exp(-gap * gap / 0.02)) * (1.0 + 5.0 * sqrt(uHits) * exp(-pu * pu));
  return col;
}

// ---- b: thin films ----
// Six sheets of dark glass lie fanned one on another, each with a film on it thinner than a wave of light.
const int SHEETS = 6;
vec2 gPivot;
float gStep;
float sheetAt(int i, vec2 xz, out vec2 q) {
  q = (xz - gPivot) * rot(0.32 - float(i) * gStep) - vec2(1.75, 0.85);
  vec2 dd = abs(q) - vec2(2.1, 1.25) + 0.3;
  return length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0) - 0.3;
}
// The colours a film goes through as it thickens, taken round the piece's own: violet, teal, green, amber, red and round again.
vec3 filmHue(float ph) {
  float x = fract(ph) * 5.0;
  vec3 c = vec3(0.0);
  for (int i = 0; i < 5; i++) { float d = abs(x - float(i)); d = min(d, 5.0 - d); c += rich(uKind[i == 0 ? 1 : i == 1 ? 0 : i == 2 ? 3 : i == 3 ? 2 : 4], 2.2) * exp(-d * d * 2.6); }
  return c;
}
vec3 films(vec2 p) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  p += (vec2(grain(gl_FragCoord.xy + fract(uTime * 3.7) * 61.0), grain(gl_FragCoord.yx + 31.0 + fract(uTime * 2.9) * 47.0)) - 0.5) / uRes.y;
  gPivot = vec2(-1.55, -0.9);
  gStep = 0.1 + 0.2 * uLevel + 0.04 * uCue;
  float ca = 0.18 * sin(uTime * 0.05) + 0.15;
  vec3 ta = vec3(0.1, 0.2, 0.5);
  vec3 ro = ta + vec3(sin(ca) * 5.6, 1.9 + 0.2 * sin(uTime * 0.037), -cos(ca) * 5.6);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.5 + rt * p.x + up * p.y);
  float found = 0.0, hi = 0.0, hd = 0.0; vec3 P = vec3(0.0); vec2 hq = vec2(0.0);
  for (int i = SHEETS - 1; i >= 0; i--) {
    float t = (float(i) * 0.1 - ro.y) / rd.y;
    vec3 Q = ro + rd * t; vec2 q;
    float d = sheetAt(i, Q.xz, q);
    if (found < 0.5 && d < 0.0 && t > 0.0) { found = 1.0; hi = float(i); hd = d; P = Q; hq = q; }
  }
  if (found < 0.5) return vec3(0.0);
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
  float band = pow(0.5 + 0.5 * cos(TAU * ph * 2.0 + hi), 1.5);
  vec3 hue = mix(rich(uKind[1], 2.0) * vec3(0.25, 0.2, 0.9) * 0.5, filmHue(ph), 0.1 + 0.9 * band);   // between its bright bands a film goes to deep blue, not to grey
  // what the film has to give back: one wide soft light low ahead, and a dimmer one high to the left
  vec3 L = normalize(vec3(-0.2, 0.48, 1.0));
  float lamp = pow(sat(dot(rr, L)), 14.0) + 0.12 * pow(sat(dot(rr, normalize(vec3(-0.8, 0.4, 0.45)))), 6.0);
  float fres = 0.12 + 0.88 * pow(1.0 - cs, 2.5);
  // the sheets above keep the light off the ones below, softly
  float sh = 1.0;
  for (int j = 1; j < SHEETS; j++) {
    float over = step(hi + 0.5, float(j)); vec2 q;
    float d = sheetAt(j, P.xz + rr.xz * ((float(j) - hi) * 0.1 / max(rr.y, 0.08)), q);
    sh *= 1.0 - over * 0.8 * smoothstep(0.25, -0.35, d);
  }
  vec3 col = hue * lamp * fres * sh * (0.08 + 1.5 * loud) * 2.4;
  // the cut edge of a sheet catches the light
  col += filmHue(ph + 0.3) * smoothstep(-0.035, 0.0, hd) * (0.06 + 0.9 * loud + 1.2 * pulse);
  col += hue * pulse * 0.6 * fres;
  return col * exp(-max(length(P - ro) - 5.0, 0.0) * 0.12);
}

vec3 render(vec2 p) {
  place();
  vec3 col = uVar > 0.5 ? films(p) : beamRoom(p);
  vec3 c = screenOf(col);
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  float g = grain(floor(gl_FragCoord.xy / max(1.0, floor(uRes.y / 540.0 + 0.5))) + floor(uTime * 12.0) * 17.0) - 0.5;
  return c + c * g * 0.2 * (1.0 - lum);
}
