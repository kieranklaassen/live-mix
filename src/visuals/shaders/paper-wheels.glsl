// name: Paper wheels
// a: Stacked discs
// b: Nested frames
// what: Seven wheels of heavy rag paper, scalloped, slotted and hand-washed, on one brass pin over the page of an open book; through slots that happen to line up one sees a vermilion ground, a sliver or a whole wedge. Or seven square frames turned against each other, a well of stepped paper corners with slits down to the same red.
// follows: The sheets turn at 1 to 7 parts of one long period and all agree about every nine minutes, when the red opens. Each kind of sound lifts its own sheet and deepens its wash, the bands open sixteen windows, the piece tints the printed border, a hit sends light out over the cut edges, a cue spreads the pile, the thread is the hand of the loop.
// own: 0 1 the page is full of small wheels in rows, -1 wheels of several sizes stand about like a train of gears; 1 1 the sheets are slid apart in a row, -1 they float one above another and are seen from low down; 2 1 cut as petals (b: round frames), -1 cut with straight sides (b: eight corners); 3 the ground: 1 a black table, -1 bare cloth in the colour of the drone; 4 1 brushed metal, -1 thin film that lets the lower sheets through; 5 1 dyed whole in the colours of the sounds, -1 blank paper with nothing on it; 6 1 pierced all over like lace, -1 no slot or hole; 7 1 sheets far apart with long shadows, -1 all flat, drawn in outline
// Seven sheets of rag paper, 0 the lowest and 6 the top one, on one pin.
const vec2 pwL = vec2(-0.62, 0.78);                              // towards the window
const vec3 pwInk = vec3(0.23, 0.17, 0.13), pwRed = vec3(0.88, 0.19, 0.09);
const float pwW = 0.0635, pwV = 0.07;                            // how wide a ring of a disc, and a step of the well
bool pwB, pwWide;
float pwPx, pwPhi, pwNud, pwWin, pwZ[7];
vec2 pwPin, pwFan;
vec4 pwPig[7];                                                   // each sheet's pigment, and how far its kind sounds
// Left by the last sheet looked at: its ring, the place across the ring, the distance out, the turn round it, its edge, its own place.
float pwJ, pwY, pwM, pwA, pwE; vec2 pwG;

float pwLine(float d, float w) { float W = max(w, pwPx); return w / W * (1.0 - smoothstep(W - pwPx, W + pwPx, abs(d))); }
float pwBox(vec2 q, vec2 b) { q = abs(q) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
// A round of x, as sin(TAU * x), near enough for a hand that cuts paper.
float pwSin(float x) { x = fract(x + 0.5) - 0.5; return x * (8.0 - 16.0 * abs(x)); }
float pwTurn(float fk) {
  float nud = fk == (pwB ? 1.0 : 5.0) ? pwNud : 0.0;
  return pwB ? -0.05 + (fract(fk * 0.5) > 0.25 ? -1.0 : 1.0) * (0.165 - 0.018 * fk) * pwSin(0.5 * (7.0 - fk) * pwPhi) + nud : fract(0.358 + (fk + 1.0) * pwPhi + nud * 0.16);
}
// One sheet: negative on paper, positive off it or in a hole.
float pwSheet(int k, vec2 p) {
  float fk = float(k), i = 6.0 - fk, T = pwTurn(fk), d, h = 1.0, x, w, hh, rd, R;
  vec2 q = p - pwPin - pwFan * fk;
  if (pwB) {
    // a square sheet with a square opening, turned a little
    pwG = (q + T * vec2(q.y, -q.x)) * inversesqrt(1.0 + T * T);
    vec2 g = pwG, s = abs(g);
    float u = min(s.x, s.y), side = s.x > s.y ? g.y : g.x, e;
    pwM = max(s.x, s.y);
    if (uOwn[2] > 0.0) pwM = mix(pwM, length(g) * 0.97, uOwn[2]);
    if (uOwn[2] < 0.0) pwM = mix(pwM, max(pwM, (s.x + s.y) * 0.72), -uOwn[2]);
    float v = (0.465 - pwM) / pwV;
    pwJ = max(floor(v), 0.0); pwY = (v - pwJ - 0.5) * pwV; pwA = side;
    vec2 o = abs(g - vec2(0.021, -0.017)); x = side;
    float ot = max(o.x, o.y);
    if (uOwn[2] > 0.0) ot = mix(ot, length(o) * 0.97, uOwn[2]);
    if (uOwn[2] < 0.0) ot = mix(ot, max(ot, (o.x + o.y) * 0.72), -uOwn[2]);
    d = ot - 0.478 - 0.005 * i + 0.0016 * pwSin(x * 7.3 + i * 0.37) * pwSin(x * 19.0 + 0.3 * pwSin(x * 4.1));
    // the opening, plain or cut in scallops, or with its corners taken
    float H = 0.395 - pwV * i, f = fract(u * 22.0) - 0.5;
    e = k == 5 || k == 3 ? 0.028 * f * f - 0.004 : 0.001 * pwSin(u * 13.0);
    pwE = k > 1 ? pwM - H : 1.0;
    h = k > 1 ? pwM - H - e : 1.0;
    if (k == 4) h = min(h, length(abs(g) - H) - 0.026);
    // slits along the arms, the same in every sheet below: they open only when the sheets agree
    float M = 0.43 - pwV * pwJ;
    x = abs((s.x > s.y ? side * sign(g.x) : -side * sign(g.y)) - 0.58 * M); w = 0.30 * M; hh = 0.030 * M + 0.0015; rd = 0.0;
    if (pwJ < 0.5) { pwY -= 0.011; x = abs(side - 0.2 * clamp(floor(side * 5.0) + 0.5, -1.5, 1.5)); w = 0.072; hh = 0.013 * pwWin; }
    if (pwJ > i + 0.1 || (pwJ < 0.5 && k < 6) || pwJ > 4.5) w = -1.0;
    if (k <= 1 && pwM < 0.115) return max(d, -max(abs(s.x - s.y) - 0.058, abs(s.x + s.y - 0.085 - (k == 0 ? 0.06 * abs(pwSin(0.5 * pwPhi)) : 0.0)) - 0.012));
  } else {
    // a disc, pinned a little off its own middle
    float r = length(q), a = fract(atan(q.y, q.x + 1.37e-5) / TAU - T + 0.5) - 0.5, b = fract(a + 0.31 * fk) * 2.0 - 1.0;
    b = abs(b);
    pwG = r * vec2(pwSin(a + 0.25), pwSin(a));
    if (uOwn[2] > 0.0) { float fl = abs(cos(0.5 * TAU * a * (k == 6 ? 5.0 : 8.0 + float(k % 3)))); r *= 1.0 + uOwn[2] * (0.26 - 0.30 * fl) * smoothstep(0.0, 0.06, r); }
    if (uOwn[2] < 0.0) r *= mix(1.0, 1.07 * cos((fract(a * 6.0 + 0.5) - 0.5) / 6.0 * TAU), -uOwn[2]);
    R = 0.455 - pwW * fk;
    float n = k == 1 ? 36.0 : k == 3 ? 18.0 : k == 5 ? 30.0 : k == 6 ? 8.0 : 1.0;
    float f = fract(a * n + 0.5) - 0.5, dep = k == 1 ? 0.034 : k == 3 ? 0.052 : k == 5 ? 0.026 : k == 6 ? 0.062 : 0.0;
    if (k > 0 && k < 6) R += 0.032 * R * (1.0 - 2.0 * b * b * (3.0 - 2.0 * b));
    R += 0.0013 * pwSin(a * 7.0 + fk * 0.3) * pwSin(a * 29.0 + 0.4 * pwSin(a * 11.0));
    d = r - R + dep * f * f;
    pwE = R - r; pwM = r; pwA = a;
    float back = (0.5 - abs(a)) * TAU * r;
    // a pointing tongue on two of them
    if (k == 2 || k == 4) d = min(d, max(back - 0.16 * (R + 0.050 - r), R - 0.02 - r));
    // the wedge every disc has
    float arc = abs(a) * TAU * r, hw = 0.235 + 0.011 * fk;
    h = max(arc - hw * r, max(0.032 - r, r - (k == 0 ? 0.362 : 0.431 - pwW * fk)));
    // and its ring of slots: windows, slits, holes, arcs, seeds, one round
    float v = (0.455 - r) / pwW;
    pwJ = clamp(floor(v), 0.0, 6.0); pwY = (v - pwJ - 0.5) * pwW;
    vec4 c = pwJ < 0.5 ? vec4(16.0, 0.052, 0.0125 * pwWin, 0.0) : pwJ < 1.5 ? vec4(19.0 - fk, 0.0056, 0.0125, 0.002) :
      pwJ < 2.5 ? vec4(k == 2 ? 14.0 : 13.0, 0.0, 0.0, 0.0105 + 0.0012 * fk) : pwJ < 3.5 ? vec4(k == 3 ? 4.0 : k == 2 ? 5.0 : 3.0, k == 3 ? 0.33 : 0.08, 0.0035, 0.006) :
      pwJ < 4.5 ? vec4(12.0, 0.0, 0.008, 0.005) : vec4(1.0, 0.0, 0.0, 0.0205);
    float at = a + (pwJ > 2.5 && pwJ < 3.5 && k == 3 ? 0.125 : pwJ > 4.5 ? 0.5 : 0.0), cell = fract(at * c.x + 0.5) - 0.5;
    x = abs(cell) / c.x * TAU * r; w = c.y; hh = c.z; rd = c.w;
    float mid = abs(fract(at - cell / c.x + 0.5) - 0.5) * TAU;
    bool none = fk > pwJ + 0.1 || (pwJ > 3.5 && fk < pwJ - 0.1) || pwJ > 5.5 || (pwJ > 0.5 && pwJ < 4.6 && c.x > 6.0 && mid * r < hw * r + 0.035);
    if (none) w = -1.0;
  }
  if (w >= 0.0) h = min(h, pwBox(vec2(x, pwY), vec2(w, hh)) - rd);
  if (uOwn[6] < 0.0) h = min(h - 0.3 * uOwn[6], pwB && k > 1 ? pwE : 9.0);
  if (uOwn[6] > 0.0) {                          // lace: rings of round holes and almonds between them
    float W = 0.046, at = pwM / W, ring = floor(at), y = (at - ring - 0.5) * W, mid = (ring + 0.5) * W, n = max(floor(TAU * mid / W * 0.5) * 2.0, 4.0);
    float turn = pwB ? atan(pwG.y, pwG.x + 1.37e-5) / TAU : pwA, x2 = (abs(fract(turn * n + 0.5 * mod(ring, 2.0)) - 0.5)) / n * TAU * mid;
    float o = length(vec2(x2, y) * (mod(ring, 2.0) > 0.5 ? vec2(1.0) : vec2(1.6, 0.85))) - 0.0165 * uOwn[6] - 0.004 * (uOwn[6] - 1.0);
    float rim = 0.014 - min(-d, pwB && k > 1 ? pwE : 1.0);       // a whole rim is left
    if (mid < 0.05) o = 1.0;
    h = min(h, max(o, rim));
  }
  return max(d, -h);
}
float pwD(int k, vec2 p) {
  float fk = float(k), way = -1.0, d = 0.0;
  if (pwWide) {
    vec2 q = p - pwPin - pwFan * fk;
    way = pwB ? max(abs(q.x), abs(q.y)) - 0.58 : length(q) - 1.12 * (0.455 - pwW * fk) - 0.02;
  }
  if (way > 0.0) { pwE = -0.1; pwJ = 0.0; pwY = 0.0; pwM = 0.6; pwA = 0.0; pwG = p; d = way + (pwB ? 0.06 : 0.03); }   // well clear of it
  else d = pwSheet(k, p);
  return d;
}
float pwWash(float fk) {
  return pwB ? 1.0 - smoothstep(0.02, 0.18, (6.0 - fk) - (0.465 - pwM) / pwV) : 1.0 - smoothstep(-0.15, 0.05, (0.455 - pwM) / pwW - fk - 1.0);
}
vec3 render(vec2 p) {
  vec2 p0 = p;
  pwWide = uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[7] > 0.0 || uOwn[6] > 0.0;
  float bare = abs(uOwn[3]), say = 0.0, room1 = 9.0;
  pwB = uVar > 0.5; pwPx = 0.75 / uRes.y;
  pwPhi = 2.0 * fract((uTime - 103.0) / 1080.0);
  float c4 = 4.0 * uCue * (1.0 - uCue);
  pwNud = 0.10 * uHits * sin(TAU * 1.5 * (1.0 - uHits));
  pwPin = pwB ? vec2(-0.12, 0.0) : vec2(0.17, -0.10);
  if (!pwB) { p = pwPin + (p - pwPin) / 1.08; pwPx /= 1.08; }
  pwFan = c4 * vec2(0.010, 0.007);
  if (bare > 0.0) pwPin = mix(pwPin, vec2(0.0), bare);
  if (uOwn[0] > 0.0) {                          // in rows
    float z = exp2(1.75 * uOwn[0]), cell = (pwB ? 1.28 : 1.12) + 2.5 * (1.0 - smoothstep(0.0, 0.35, uOwn[0]));
    vec2 v = (p - pwPin) * z / cell; float row = floor(v.y + 0.5); v.x += 0.5 * mod(row, 2.0) * smoothstep(0.3, 1.0, uOwn[0]);
    vec2 id = vec2(floor(v.x + 0.5), row); say = hash21(id + 7.0) * step(0.5, abs(id.x) + abs(id.y));
    p = pwPin + (v - id) * cell; pwPx *= z;
    vec2 hv = 0.5 - abs(v - id); room1 = min(hv.x, hv.y) * cell;
    pwPhi = fract(0.5 * pwPhi + floor(say * 16.0) / 16.0) * 2.0;
  }
  if (uOwn[0] < 0.0) {                          // of several sizes
    vec4 b = vec4(pwPin, 1.0 + 0.45 * uOwn[0], 0.0);
    float t = smoothstep(0.0, 1.0, -uOwn[0]), least = length(p - b.xy) - 0.55 * b.z, n = 0.0, next = 9.0;
    const vec3 other[6] = vec3[6](vec3(-0.66, 0.24, 0.48), vec3(-0.46, -0.31, 0.32), vec3(0.62, 0.28, 0.44), vec3(0.70, -0.30, 0.56), vec3(-0.17, 0.43, 0.24), vec3(0.25, -0.46, 0.22));
    for (int i = 0; i < 6; i++) {
      vec3 w = vec3(other[i].xy * mix(3.0, 1.0, t), other[i].z * (pwB ? 0.78 : 0.92));
      float d = length(p - w.xy) - 0.55 * w.z;
      if (d < least) { next = least; least = d; b = vec4(w, 0.0); n = float(i + 1); } else next = min(next, d);
    }
    room1 = (next - least) / b.z;
    say = n / 7.0;
    p = pwPin + (p - b.xy) / b.z; pwPx /= b.z;
    pwPhi = fract(0.5 * pwPhi + floor(say * 16.0) / 16.0) * 2.0;
  }
  if (uOwn[1] > 0.0) { pwFan += uOwn[1] * vec2(0.125, 0.052) * (pwB ? 0.55 : 1.0); pwPin -= uOwn[1] * vec2(0.40, 0.13) * (pwB ? 0.5 : 1.0) * vec2(1.0); }
  if (uOwn[1] < 0.0) {
    float sq = 1.0 - 0.52 * -uOwn[1];
    p.y = pwPin.y + (p.y - pwPin.y - 0.10 * uOwn[1]) / sq; pwPx /= sq;
    pwFan += -uOwn[1] * vec2(0.0, 0.145);
  }
  // who lifts which sheet, and its pigment
  float g = 0.6 + 0.9 * uEnergy, gap = (pwB ? 0.0125 : 0.0055) + 0.004 * uSpace + 0.010 * c4;
  if (uOwn[7] != 0.0) gap *= uOwn[7] > 0.0 ? 1.0 + (pwB ? 4.0 : 8.5) * uOwn[7] : 1.0 + 0.8 * uOwn[7];
  float s1 = sat(uDrone * g), s2 = sat(uPad * g), s3 = sat(uTexture * g), s4 = sat(uPhrase * g), s5 = sat(uHits * g), s6 = sat(max(uKeys, uMic) * g);
  vec4 g1 = vec4(mix(vec3(0.20, 0.36, 0.42), uKind[0] * 0.72, 0.42), s1), g2 = vec4(mix(vec3(0.50, 0.38, 0.46), uKind[1] * 0.72, 0.42), s2);
  vec4 g3 = vec4(mix(vec3(0.36, 0.48, 0.36), uKind[2] * 0.72, 0.42), s3), g4 = vec4(mix(vec3(0.22, 0.27, 0.40), uKind[3] * 0.72, 0.42), s4);
  vec4 g5 = vec4(mix(vec3(0.72, 0.55, 0.28), uKind[4] * 0.72, 0.42), s5), g0 = vec4(0.62, 0.52, 0.40, 0.0);
  if (pwB) pwPig = vec4[7](g0, g5, g4, g3, g2, g1, vec4(0.80, 0.60, 0.30, s6)); else pwPig = vec4[7](g0, g1, g2, g3, g4, g5, vec4(0.80, 0.60, 0.30, s6));
  float z = 0.006 + gap;
  pwZ[0] = z; z += gap + 0.02 * (pwB ? 0.0 : s1); pwZ[1] = z; z += gap + 0.02 * (pwB ? s4 : s2); pwZ[2] = z; z += gap + 0.02 * s3; pwZ[3] = z;
  z += gap + 0.02 * (pwB ? s2 : s4); pwZ[4] = z; z += gap + 0.02 * (pwB ? s1 : 0.0); pwZ[5] = z; z += gap + 0.01 * s6; pwZ[6] = z;
  // where to begin looking, and how wide the window here stands open
  vec2 q0 = p - pwPin, qw = q0 - (pwB ? 6.0 * pwFan : vec2(0.0));
  float r0 = length(q0), a0 = atan(qw.y, qw.x + 1.37e-5) / TAU, m0 = max(abs(q0.x), abs(q0.y));
  float wi = floor(fract(a0 - pwTurn(0.0) + 0.5) * 16.0 + 0.5);
  if (pwB) wi = floor(fract(a0 - pwTurn(6.0) / TAU) * 16.0);
  pwWin = 0.12 + 0.88 * sat(uBands[int(wi) & 15] * 1.5);
  int from = pwB ? 6 - int(clamp((0.465 - m0) / pwV - 1.0, 0.0, 6.0)) : int(clamp((0.455 - r0) / pwW + 1.8, 0.0, 6.0));
  bool near = pwB ? m0 < 0.70 : r0 < 0.53;
  float more = 0.0, least = 0.004 + 0.05 * max(-uOwn[4], 0.0); int upto = from + 2;
  if (pwWide) {
    float row = length(q0 - pwFan * clamp(dot(q0, pwFan) / max(dot(pwFan, pwFan), 1e-6), 0.0, 6.0));
    more = (pwB ? 1.6 : 1.0) * 0.56 + max(uOwn[7], 0.0) * 0.40 + 0.1 - row;       // how far inside the reach of their shadows
    near = row < (pwB ? 0.80 : 0.55);
    from = 6;
    if (!pwB && uOwn[1] == 0.0) from = int(clamp((0.455 - (r0 - 0.04) / 1.12) / pwW + 1.0, 0.0, 6.0));
    upto = 6;
  }
  // front to back: what is seen here, and how high it lies
  vec3 col = vec3(0.0);
  float left = 1.0, zz = 0.0, best = 0.0, dd = -1.0, e = 0.0, dM = r0, dA = a0, dE = 1.0;
  vec2 dG = p; int dk = -1;
  for (int k = from; k >= 0 && near && left > least; k--) {
    float fk = float(k), d = pwD(k, p), c = left * (1.0 - smoothstep(-pwPx, pwPx, d));
    if (uOwn[4] < 0.0) c *= 1.0 + 0.55 * uOwn[4] * (k == 0 ? 0.6 : 1.0);
    vec4 pg = pwPig[k];
    float seen = pwWash(fk), amt = mix(pwB ? 0.25 + 0.6 * pg.a : 0.92, (pwB ? 0.03 : 0.15) + 0.5 * pg.a, seen);
    if (k == (pwB ? 6 : 0)) amt = pwB ? 0.03 : seen > 0.5 ? 0.04 : 0.4;
    vec3 paper = mix(vec3(0.925, 0.88, 0.785), vec3(0.97, 0.94, 0.87), fk / 6.0);
    if (k == 1 || k == 3) paper *= vec3(0.955, 0.965, 0.965);
    if (pwB) paper *= 0.82 + 0.03 * fk;
    // a wash lies uneven, and dries darker along its edge
    float lay = 0.88 + 0.14 * pwSin(pwG.x * 3.7 + 0.5 * pwSin(pwG.y * 4.9 + fk * 0.21)) * pwSin(pwG.y * 3.1 + 0.5 * pwSin(pwG.x * 5.7)) + 0.25 * (1.0 - smoothstep(0.024, 0.034, pwE + (pwB ? 0.011 : 0.0)));
    vec3 face = paper * mix(vec3(1.0), pg.rgb, sat(amt * lay) * smoothstep(0.019, 0.023, pwE + (pwB ? 0.011 : 0.0)));
    if (uOwn[5] < 0.0) face = mix(face, paper, -uOwn[5]);
    if (uOwn[5] > 0.0) {
      float w = mod((pwB ? 6.0 - fk : fk) + floor(say * 5.0) + 4.0, 5.0);
      vec3 dye = kindColour(w) * (0.86 + 0.14 * lay) * (1.0 + 0.35 * pg.a);
      face = mix(face, dye * (k == 6 && !pwB ? 1.15 : 1.0), uOwn[5]);
    }
    if (uOwn[4] > 0.0) {                        // turned and brushed
      vec2 n = p - pwPin - pwFan * fk; n *= inversesqrt(dot(n, n) + 1e-6);
      float hl = abs(dot(n, pwL)); hl = pwB ? 0.5 + 0.5 * cos(3.0 * dot(p, pwL) * 4.0 + 1.3 * fk + 5.0 * pwTurn(fk)) : hl * hl * hl;
      float fine2 = noise(vec2(pwM * 420.0, 3.0 + fk)) * 0.6 + 0.4 * noise(vec2(pwM * 120.0, pwA * 9.0));
      vec3 m = face * (pwB ? 1.0 : 0.96) * (0.42 + 0.95 * hl) * (0.72 + 0.5 * fine2) + vec3(0.9, 0.86, 0.78) * 0.22 * hl * hl * hl;
      face = mix(face, m, uOwn[4]);
    }
    col += c * face;
    zz += c * pwZ[k]; left -= c;
    if (c > best) { best = c; dk = k; dd = d; dM = pwM; dA = pwA; dE = pwE; dG = pwG; }
  }
  if (uOwn[4] < 0.0 ? best < 0.2 : left > 0.5) { dk = -1; dG = uOwn[0] != 0.0 ? p0 : p; dE = 1.0; }
  // the page, and the red ground under the wheels
  float ink = 0.0, fine = noise(dG * vec2(90.0, 260.0)), pool = noise(dG * 17.0 + float(dk) * 5.0);
  vec3 page = vec3(0.855, 0.78, 0.635), red = pwRed;
  if (uOwn[5] > 0.0) red = mix(red, uKind[4], uOwn[5]);
  if (uOwn[5] < 0.0) red = mix(red, vec3(0.80, 0.77, 0.71), -uOwn[5]);
  if (uOwn[3] > 0.0) page = mix(page, vec3(0.040, 0.041, 0.048) * (0.8 + 0.5 * noise(p0 * 5.0)), smoothstep(0.0, 1.0, uOwn[3]));
  if (uOwn[3] < 0.0) page = mix(page, uKind[0] * (0.92 + 0.10 * noise(p0 * vec2(160.0, 40.0)) + 0.08 * noise(p0 * vec2(40.0, 160.0))), -uOwn[3]);
  vec3 bareOf = page;
  float mB = m0;
  if (uOwn[2] > 0.0) mB = mix(m0, r0, uOwn[2]);
  if (uOwn[2] < 0.0) mB = mix(m0, max(m0, (abs(q0.x) + abs(q0.y)) * 0.72), -uOwn[2]);
  if (pwB) page = mix(page, red, (1.0 - smoothstep(0.398, 0.402, mB)));
  else {
    if (uOwn[4] < 0.0) red = mix(red, page, -0.8 * uOwn[4]);
    vec3 rim = mix(vec3(0.20, 0.23, 0.27), pwPig[1 + (int(wi) & 3)].rgb * 0.9, 0.75);
    page = mix(mix(red, rim, smoothstep(0.383, 0.386, r0)), page, smoothstep(0.440, 0.442, r0));
    // the printed ring, washed with the piece
    float room = (r0 - 0.470) / 0.056;
    vec4 m = piece(vec2(fract(0.25 - a0), 0.06 + 0.88 * sat(room)));
    float in_ = smoothstep(-0.03, 0.03, room) * (1.0 - smoothstep(0.97, 1.03, room)), l = max(m.r, max(m.g, m.b));
    page *= mix(vec3(1.0), mix(vec3(0.55), m.rgb / max(l, 0.01), 0.72) * 0.86, in_ * sat(m.a * 1.3));
    float x = (fract(a0 * 72.0 + 0.5) - 0.5) / 72.0 * TAU * r0, y = (fract(a0 * 12.0 + 0.5) - 0.5) / 12.0 * TAU * r0, far = length(q0 + vec2(0.62, 0.0));
    ink = max(pwLine(abs(r0 - 0.498) - 0.028, 0.0008), pwLine(x, 0.0005) * step(abs(r0 - 0.5285), 0.0028));
    ink = max(ink, max(pwLine(y, 0.0006) * step(abs(r0 - 0.498), 0.028), pwLine(r0 - 0.531, 0.0004)));
    // the compass work on the bare side of the page
    ink = max(ink, 0.55 * max(pwLine(q0.y, 0.0005) * step(abs(r0 - 0.733), 0.217), pwLine(abs(far - 0.1325) - 0.0275, 0.0005)));
    ink = dk < 0 ? 0.8 * ink : 0.0;
    if (bare > 0.0) {
      ink *= 1.0 - bare;
      page += uOwn[3] > 0.0 ? uOwn[3] * in_ * m.rgb * 0.4 : vec3(0.0);
    }
    if (pwWide) page = mix(page, bareOf, smoothstep(0.0, 0.3, max(abs(uOwn[1]), abs(uOwn[2]))) * smoothstep(0.30, 0.31, r0) * step(r0, 0.442));
  }
  // the gutter of the book
  float gut = p0.x + 0.80 + 0.01 * p0.y;
  page *= 1.0 - (1.0 - bare) * 0.78 * exp(-abs(gut) * (gut > 0.0 ? 11.0 : 22.0)) + (1.0 - bare) * 0.05 * exp(-(gut - 0.2) * (gut - 0.2) * 81.0);
  col += left * page;
  // what is printed on the sheet
  if (dk >= 0) {
    float fk = float(dk), seen = pwWash(fk), y = dE;
    if (pwB) y += 0.011;
    ink = max(pwLine(y - 0.0185, 0.0008), pwLine(y - 0.0145, 0.0005));
    // graduations on the even discs, a mitre at the corners of the frames, a moon behind the round window
    float n = dk == 0 ? 180.0 : dk == 2 ? 120.0 : dk == 4 ? 72.0 : 30.0, tick = (fract(dA * n) - 0.5) / n * TAU * dM;
    if (!pwB && (dk & 1) == 0) ink = max(ink, pwLine(tick, 0.0006) * step(abs(y - 0.0165), dk == 6 ? 0.002 : 0.0055));
    if (dk == 6) ink *= pwB ? 1.0 : 0.6;
    ink *= seen;
    if (uOwn[5] < 0.0) ink *= 1.0 + uOwn[5];
    // on the top frame the printed band runs round the border, washed with the piece
    if (pwB && dk == 6) {
      float room = (0.474 - dM) / 0.030, turn = atan(dG.x, dG.y + 1.37e-5) / TAU;
      vec4 m = piece(vec2(fract(turn), 0.06 + 0.88 * sat(room)));
      float in_ = smoothstep(-0.05, 0.05, room) * (1.0 - smoothstep(0.95, 1.05, room)), l = max(m.r, max(m.g, m.b));
      col *= mix(vec3(1.0), mix(vec3(0.60), m.rgb / max(l, 0.01), 0.55) * 0.9, in_ * sat(m.a * 1.2));
      ink = max(ink, pwLine(abs(dM - 0.459) - 0.015, 0.0006) * 0.7);
    }
  }
  col *= 0.955 + 0.06 * fine + 0.05 * pool + 0.010 * sin(dG.y * 820.0);
  col = mix(col, pwInk, 0.8 * ink * (0.55 + 0.6 * pool));
  // the light of the window: every sheet above keeps some of it off
  float s = 1.0;
  bool by = pwB ? m0 < 0.82 : r0 < 0.62;
  if (pwWide) by = more > 0.0;
  if (uOwn[4] < -0.5) upto = min(upto, max(dk, 0) + 1);
  if (uOwn[1] != 0.0) upto = min(upto, max(dk, 0) + 3);
  for (int j = max(dk, 0); j < 7 && j <= upto && by; j++) {
    float dz = max(pwZ[j] - zz, 0.0) * (dk < 0 && m0 < 0.40 && r0 < 0.45 ? 0.2 : 1.0), b = 0.0022 + dz * mix(0.55, 0.3, uTone);
    float d = pwD(j, p + pwL * (j == dk ? 0.002 : dz));
    if (j == dk) e = (d - dd) / 0.002;
    else s *= 1.0 - mix(0.52, 0.36, sat(dz * 10.0)) * (1.0 - smoothstep(-b, b, d));
  }
  if (uOwn[7] < 0.0) s = mix(s, 1.0, -uOwn[7]);
  if (dk < 0) s = mix(1.0, s, smoothstep(0.0, 0.12, room1));
  if (uOwn[4] < 0.0) s = mix(s, 1.0, -0.45 * uOwn[4]);
  col *= mix(dk < 0 ? vec3(0.36, 0.28, 0.28) : vec3(0.26, 0.23, 0.26), vec3(1.0), s);
  if (uOwn[7] < 0.0 && dk >= 0) { col = mix(col, uOwn[3] > 0.5 ? pwInk * 0.4 : pwInk, -uOwn[7] * 0.9 * pwLine(dd + 0.0012, 0.0013)); e = mix(e, 0.0, -uOwn[7]); }
  // the cut edge of the sheet: bright towards the window, brown away from it
  float lip = dk < 0 ? 0.0 : smoothstep(-0.0045, -0.0005, dd);
  col *= 1.0 + lip * clamp(e, -1.0, 1.0) * 0.18;
  col += vec3(1.0, 0.72, 0.3) * lip * uCue * 0.30;
  // a hit is a light that runs outward over the cut edges
  float run = (pwB ? m0 : r0) - 0.06 - 0.5 * (1.0 - uHits);
  run = uHits * exp(-run * run * 260.0);
  col *= 1.0 + run * 0.16; col += mix(vec3(1.0, 0.8, 0.45), uKind[4], 0.5) * run * (0.05 + 0.35 * lip);
  // the thread and its bead, the hand of the loop
  float za = pwZ[6] + 0.006, ta = PI * 0.5 - TAU * uLoop, len = 0.498, dz = za - zz;
  vec2 pc = pwPin + pwFan * (pwB ? 1.0 : 6.0), dir = vec2(cos(ta), sin(ta)), across = vec2(-dir.y, dir.x), q = p + pwL * dz - pc;
  for (int t = 0; t < 2; t++) {
    float al = dot(q, dir), b = t == 0 ? 0.002 + dz * 0.35 : pwPx, rr = al > 0.25 ? 0.0095 : 0.0145;
    float line = (1.0 - smoothstep(-b, b, max(abs(dot(q, across)) - 0.0011, max(-al, al - len))));
    vec2 n = (q - dir * (al > 0.25 ? len : 0.0)) / rr;
    float ball = (1.0 - smoothstep(-b, b, (length(n) - 1.0) * rr));
    vec3 br = mix(vec3(0.30, 0.19, 0.07), vec3(0.86, 0.66, 0.32), sat(0.5 + 0.55 * dot(n, pwL)));
    br += vec3(1.0, 0.9, 0.66) * (0.55 + 0.5 * uCue) * (1.0 - smoothstep(0.1, 0.42, length(n - pwL * 0.45))) + vec3(0.16, 0.12, 0.05) * uLevel;
    if (t == 0) col *= 1.0 - (dk < 0 ? smoothstep(0.0, 0.14, room1) : 1.0) * max(line * 0.5, ball * 0.55) * vec3(0.8, 0.83, 0.8);
    else col = mix(mix(col, vec3(0.16, 0.18, 0.26) * (0.85 + 0.3 * sin(al * 900.0)), line), br, ball);
    q = p - pc;
  }
  // the window, up on the left
  float fall = length(p0 - vec2(-0.55, 0.55));
  col *= mix(vec3(1.05, 1.03, 0.98), vec3(0.80, 0.79, 0.82), smoothstep(0.15, 1.6, fall));
  return col * (1.0 + 0.05 * uLevel + 0.18 * uCue * exp(-dot(p0 - pwPin, p0 - pwPin) * 18.0) * vec3(1.0, 0.8, 0.5));
}
