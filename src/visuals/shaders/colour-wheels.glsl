// name: Colour wheels
// a: Discs
// b: Half rounds
// what: Great painted wheels, ringed and quartered, cross one another on canvas; wherever one cuts another the rings slip half a step and the colours change places, so a red answers a green across the break. Or half rounds and quarter rounds in slanting rows, large and small, each band a short gradient laid with a dry brush.
// follows: Each wheel or row is a kind of sound, and the colour clears from the hubs outward as it sounds; the bands lighten the rings, the piece glazes them, the loop rocks the great wheel and the rows. A hit lights a ring and turns it a notch, or runs along a band; a cue passes one colour round every wheel or from fan to fan. Keys and the voice wake small parts.
// own: 0 1 the wheels small and apart (b: many small rows), -1 grown huge into one another (b: few great rows); 1 1 the wheels in a row by size (b: the rows bent round a middle), -1 one great wheel with small ones about it (b: even rows that meet as whole rounds); 2 1 many thin rings, -1 few broad ones; 3 1 square, -1 petalled; 4 1 coloured glass in dark lead with the light behind it, -1 carved in relief and lit from one side; 5 1 a line drawing on pale paper that sound fills with a wash, -1 dark, the paint seen only where it sounds; 6 1 many sectors, like the blades of a fan, -1 whole rings with no sectors; 7 1 wound into pinwheels that turn, -1 rings that waver like the rings of a tree
const int CW_N = 8;
const vec3 CW_CANVAS = vec3(0.86, 0.80, 0.69);
// the twelve pigments, in the order of the wheel: yellow round to green
const vec3 CW_PIG[12] = vec3[12](
  vec3(0.93, 0.79, 0.33), vec3(0.92, 0.64, 0.24), vec3(0.87, 0.45, 0.20), vec3(0.78, 0.27, 0.19),
  vec3(0.66, 0.19, 0.26), vec3(0.48, 0.19, 0.38), vec3(0.28, 0.20, 0.42), vec3(0.16, 0.21, 0.43),
  vec3(0.17, 0.36, 0.60), vec3(0.20, 0.51, 0.58), vec3(0.22, 0.50, 0.38), vec3(0.58, 0.66, 0.30));
// the wheels: middle and radius; the last is the ground, a wheel larger than the sheet
const vec3 CW_AT[CW_N] = vec3[CW_N](vec3(0.56, -0.36, 0.84), vec3(-0.53, 0.20, 0.50), vec3(-0.46, -0.62, 0.46), vec3(0.16, 0.50, 0.36),
  vec3(-0.10, -0.20, 0.17), vec3(1.05, 0.50, 0.40), vec3(-1.22, 0.40, 0.42), vec3(-1.0, 1.3, 9.0));
const float CW_RINGS[CW_N] = float[CW_N](7.0, 4.0, 4.0, 3.0, 3.0, 3.0, 4.0, 34.0);
const int CW_KIND[CW_N] = int[CW_N](0, 1, 2, 3, 4, 3, 1, 2);
const int CW_BASE[CW_N] = int[CW_N](8, 5, 1, 10, 3, 7, 0, 5);
// the straight cut each wheel has through its hub
const float CW_CUT[CW_N] = float[CW_N](2.25, 0.55, 1.2, 0.3, 0.0, 2.6, 1.0, 0.0);
float cwLv[CW_N];
// the wheels in a row, and one great wheel with small ones about it
const vec3 CW_ROWED[CW_N] = vec3[CW_N](vec3(0.0, 0.0, 0.24), vec3(-0.43, 0.0, 0.16), vec3(0.43, 0.0, 0.16), vec3(-0.70, 0.0, 0.09),
  vec3(0.70, 0.0, 0.09), vec3(-0.85, 0.0, 0.045), vec3(0.85, 0.0, 0.045), vec3(-1.0, 1.3, 9.0));
const vec3 CW_GREAT[CW_N] = vec3[CW_N](vec3(0.0, 0.0, 0.46), vec3(-0.70, 0.31, 0.13), vec3(-0.73, -0.27, 0.17), vec3(0.70, 0.30, 0.16),
  vec3(0.0, 0.0, 0.085), vec3(0.69, -0.33, 0.10), vec3(-0.93, 0.03, 0.06), vec3(-1.0, 1.3, 9.0));
float cwWorld;    // 0 as it draws itself, 1 another world: the paint is the piece's colours and no others
float cwA;        // how far the paint here sounds
vec2 cwSlope;     // which way is in from the edge
vec3 cwHue;       // the colour of the kind of sound here
bool cwBare = false; // only the edges are asked for
// A wheel's middle and radius, as the world has it.
vec3 cwW[CW_N];
vec3 cwSet(int k) {
  vec3 w = CW_AT[k];
  if (k == CW_N - 1) return w;
  if (uOwn[1] > 0.0) w = mix(w, CW_ROWED[k], uOwn[1]);
  if (uOwn[1] < 0.0) w = mix(w, CW_GREAT[k], -uOwn[1]);
  w.z *= uOwn[0] > 0.0 ? exp2(-0.95 * uOwn[0]) : 1.0 - 0.7 * uOwn[0] * (1.0 - 0.45 * abs(uOwn[1]));
  return w;
}
vec3 cwAt(int k) { return cwW[k]; }
// How far from its middle a place lies: round, square or petalled.
float cwLen(vec2 d) {
  float r = length(d);
  if (uOwn[3] > 0.0) { vec2 q = d * d; r = mix(r, sqrt(sqrt(dot(q, q) + 1e-9)) * 1.03, uOwn[3]); }
  if (uOwn[3] < 0.0 && r > 1e-4) {
    vec2 z = d / r, z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    float c3 = z2.x * z.x - z2.y * z.y;
    r *= 1.0 - 0.17 * uOwn[3] * (2.0 * c3 * c3 - 1.0);
  }
  return r;
}
vec2 cwWaver(vec2 d, float seed) {
  float l = length(d);
  return d * (1.0 - uOwn[7] * smoothstep(0.0, 0.12, l) * (0.3 * (noise(d * 5.0 + seed) - 0.5) + 0.07 * (noise(d * 17.0 + seed) - 0.5)));
}

float cwLum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec3 cwRich(vec3 c, float k) { return max(mix(vec3(cwLum(c)), c, k), 0.0); }
// The colour of one patch: step j of a choice of pigments that begins at pigment b, in the colour of its kind.
vec3 cwPaint(int kind, int b, int j) {
  vec3 own = uKind[kind];
  if (b < 0) {
    if (j == 0) return own;
    if (j == 1) return mix(vec3(0.90, 0.85, 0.75), own, 0.25);
    if (j == 2) return uKind[(kind + 1) % 5];
    if (j == 3) return own * 0.3 + 0.02;
    if (j == 4) return uKind[(kind + 2) % 5] * 0.9;
    return mix(uKind[(kind + 3) % 5], own, 0.5);
  }
  if (j == 0) return mix(CW_PIG[b], cwRich(own, 0.9), 0.45) * 0.97;
  if (j == 1) return mix(vec3(0.90, 0.85, 0.75), own, 0.14);
  if (j == 2) return mix(CW_PIG[(b + 6) % 12], own, 0.1);
  if (j == 3) return mix(vec3(0.10, 0.11, 0.19), own, 0.18);
  if (j == 4) return mix(CW_PIG[(b + 3) % 12], own, 0.2);
  return mix(CW_PIG[(b + 8) % 12], own, 0.15) * 0.9;
}
vec3 cwPatch(int kind, int b, int j) {
  vec3 c = cwPaint(kind, b, j);
  return cwWorld > 0.0 ? mix(c, cwPaint(kind, -1, j), cwWorld) : c;
}
// How loud makes a patch: greyed and quiet when its sound rests, clear and full when it sounds.
vec3 cwSound(vec3 c, float a) {
  vec3 rest = mix(cwRich(c, 0.68), vec3(0.54, 0.50, 0.45), 0.17) * 0.96;
  vec3 full = cwRich(c, 1.08 + 0.4 * uEnergy) * 1.07;
  return mix(rest, full, a);
}
// How far the sound of a wheel has come out from its hub; the voice warms every hub.
float cwLight(float f, float lv, float ring) {
  float a = smoothstep(f - 0.35, f + 0.2, 1.3 * lv * lv) * smoothstep(0.0, 0.2, lv);
  return sat(max(a * (0.6 + 0.6 * uEnergy), ring < 0.5 ? uMic : 0.0));
}
// The bands are the rings, the lowest at the hub: what is heard there lays more light into the paint.
vec3 cwBand(vec3 c, float f, float lv, float a) { return c + (1.0 - min(c, 1.0)) * c * 0.4 * band(f) * a * (0.3 + 0.7 * lv); }
// The piece glazes the paint: more where the paint is light, so the darks stay.
vec3 cwPiece(vec3 c, vec4 m) { float l = 0.25 + 0.6 * cwLum(c); return c * (1.0 - 0.28 * l * m.a) + 0.4 * l * cwRich(m.rgb, 1.5); }
// A place on the sheet: its colour, and the place in its patch (across the ring, along it) for the brush, and how near its edge.
vec3 cwDiscs(vec2 p, out vec3 brush, out float edge) {
  int o = CW_N - 1, over = 0, cutOver = 0;
  edge = 1.0;
  for (int k = 0; k < CW_N - 1; k++) {
    vec3 at = cwAt(k);
    vec2 d = p - at.xy;
    if (uOwn[7] < 0.0) d = cwWaver(d, float(k) * 7.0);
    float within = at.z - cwLen(d);
    edge = min(edge, abs(within));
    if (within < 0.0) continue;
    if (o == CW_N - 1 || k == 4) { over += o == CW_N - 1 ? 0 : 1; o = k; }
    else {
      // two wheels lock: the line between their hubs shares what both cover
      over++;
      vec2 ao = cwAt(o).xy, ab = at.xy - ao;
      float side = (ab.x * (p.y - ao.y) - ab.y * (p.x - ao.x)) / max(length(ab), 1e-3);
      edge = min(edge, abs(side));
      if (side > 0.0) o = k;
    }
  }
  vec3 ato = cwAt(o);
  vec2 d = p - ato.xy;
  if (uOwn[7] < 0.0 && o < CW_N - 1) d = cwWaver(d, float(o) * 7.0);
  bool ground = o == CW_N - 1;
  float fo = float(o), R = ato.z, n = CW_RINGS[o], r = ground ? length(d) : cwLen(d);
  if (!ground && uOwn[2] != 0.0) n = max(n * exp2(1.25 * uOwn[2]), 1.0);
  if (ground && uOwn[2] < 0.0) n *= exp2(0.8 * uOwn[2]);
  float dir = mod(fo, 2.0) < 0.5 ? 1.0 : -1.0;
  float turn = ground ? 0.0 : dir * (0.003 + 0.0008 * fo) * (1.0 + 9.0 * max(uOwn[7], 0.0)) * uTime + fo * 0.83 + 0.3 + (o == 0 ? 0.11 * sin(TAU * uLoop) : 0.0);
  // the cut through the hub: past it the rings are half a step out and take the colours across
  if (!ground && o != 4) {
    float ca = CW_CUT[o] + turn * 0.35, cut = d.x * sin(ca) - d.y * cos(ca);
    edge = min(edge, abs(cut) + 0.5 * max(-uOwn[6], 0.0));
    cutOver = over;
    if (cut > 0.0) over++;
  } else cutOver = over;
  // rings of unlike widths; each crossing shifts them by part of a ring
  float u0 = r / R * n + (ground ? 0.0 : 0.5 * float(over % 2) + 0.5 * min(uOwn[6], 0.0) * float(over - cutOver));
  float w = fo * 2.0 + 0.5, u = u0 + 0.12 * (1.0 + sin(5.0 * u0 + w));
  float du = (1.0 + 0.6 * cos(5.0 * u0 + w)) * n / R;
  float ring = floor(u), fu = u - ring;
  edge = min(edge, (fu > 0.5 || ring < 0.5 ? 1.0 - fu : fu) / du);
  float hr = hash21(vec2(ring, fo * 7.3));
  float kick = (o == 4 && ring == 1.0) || (o == 0 && ring == 4.0) ? 1.0 : 0.0;
  float ang = atan(d.y, d.x + 1e-6) - turn - (hr - 0.5) * 0.6 * step(1.0, ring);
  if (cwWorld > 0.0 && !ground && ring == floor(n * 0.55)) kick = max(kick, cwWorld * 0.8);
  ang -= kick * 1.2 * uHits * (1.0 - uHits);
  if (uOwn[7] > 0.0 && !ground) ang -= dir * uOwn[7] * 2.1 * r / R;
  float sect = ground ? 10.0 : 4.0;
  if (uOwn[6] > 0.0 && !ground) sect = 4.0 + 2.0 * floor(uOwn[6] * 7.0 + 0.5);
  float s = mod(ang / TAU * sect, sect), si = floor(s), fs = s - si;
  edge = min(edge, min(fs, 1.0 - fs) / sect * TAU * r + 0.5 * max(-uOwn[6], 0.0));
  if (cwBare) return vec3(0.0);
  int j = (int(ring) * 2 + int(si) + over * 3) % 6;
  float h = hash21(vec2(ring * 3.1 + fo, si + 5.0));
  vec3 c = cwPatch(CW_KIND[o], CW_BASE[o], j) * (0.92 + 0.14 * h);
  if (uOwn[6] < 0.0) c = mix(c, cwPatch(CW_KIND[o], CW_BASE[o], (int(ring) * 2 + cutOver * 3) % 6) * (0.92 + 0.14 * hash11(ring + fo * 3.0)), -uOwn[6]);
  // each patch is laid from full to thin along its ring, and paler to its outer edge
  float g = h > 0.5 ? fs : 1.0 - fs;
  if (uOwn[6] < 0.0) g = mix(g, 0.25 + 0.5 * abs(fract(ang / TAU + hr) - 0.5), -uOwn[6]);
  c = mix(c, mix(CW_CANVAS, c.gbr, 0.12), (j == 3 ? 0.14 : 0.34) * g * g);
  if (ground) c = mix(c, mix(vec3(0.74, 0.69, 0.60), uKind[2] * 0.75 + 0.04, 0.8 * cwWorld), 0.6 + 0.25 * cwWorld);
  // the sound fills a wheel from its hub out
  float f = (ring + 0.5) / n, a = cwLight(f, cwLv[o], ring);
  cwA = ground ? a * 0.35 : a; cwHue = ground ? uKind[2] * 0.5 : uKind[CW_KIND[o]];
  c = cwSound(c, a);
  if (!ground) c = cwBand(c, f, cwLv[o], a);
  // the great wheel also carries the piece, the loop once round it and the room from hub to rim
  if (o == 0) { vec4 m = piece(vec2(fract(ang / TAU), 0.95 - 0.9 * r / R)); c = mix(c, cwPiece(c, m), 0.7); }
  vec3 lit = cwRich(uKind[4], 1.2) * 1.05 + 0.04;
  c = mix(c, lit, kick * uHits * 0.75);
  // a cue hands one colour round every wheel, patch by patch
  float cw = fract((si + 0.5) / sect + uCue + 0.5 + fo * 0.21) - 0.5;
  c = mix(c, lit, 0.75 * uCue * exp(-cw * cw * 70.0) * (ground ? 0.0 : 1.0));
  brush = vec3(r, fs * TAU / sect * max(r, 0.05), si * 3.7 + ring * 11.3 + fo * 23.0);
  return c;
}
// the sheet of half rounds: the rows' heights, and the colour each row lies on
const float CW_ROW[5] = float[5](0.34, 0.205, 0.29, 0.165, 0.25);
const vec3 CW_LIE[5] = vec3[5](vec3(0.13, 0.17, 0.29), vec3(0.84, 0.77, 0.64), vec3(0.55, 0.22, 0.17), vec3(0.64, 0.66, 0.62), vec3(0.15, 0.22, 0.21));
vec3 cwHalf(vec2 p, out vec3 brush, out float edge) {
  // rows of unlike heights, laid a little aslant
  float tilt = 0.2 * (1.0 - abs(uOwn[1])), grow = uOwn[0] == 0.0 ? 1.0 : exp2(-0.9 * uOwn[0]);
  vec2 q = rot(0.2) * p;
  if (uOwn[1] != 0.0) q = rot(tilt) * p;
  if (uOwn[0] != 0.0) q /= grow;
  float bent = max(uOwn[1], 0.0), even = max(-uOwn[1], 0.0), roundAll = 0.0;
  if (bent > 0.0) {                  // the rows bent round a middle that comes up into the picture
    float D = 0.62 / bent - 0.62;
    vec2 e = p / grow + vec2(0.0, D);
    float l = length(e);
    q = vec2(atan(e.x, e.y + 1e-6) * (D + 0.6), l - D - 0.6 * (1.0 - bent));
    roundAll = smoothstep(0.85, 1.0, bent);
    q.y = mix(q.y, q.y - 0.5, roundAll);
  }
  if (uOwn[7] < 0.0) q += uOwn[7] * 0.13 * (vec2(noise(q * 4.0), noise(q * 4.0 + 40.0)) - 0.5) + uOwn[7] * 0.02 * (vec2(noise(q * 19.0), noise(q * 19.0 + 40.0)) - 0.5);
  float y = q.y + 0.60, lap = floor(y / 1.25);
  y -= lap * 1.25;
  int i = 0;
  for (int k = 0; k < 4; k++) { float h = mix(CW_ROW[i], 0.25, even); if (y < h) break; y -= h; i++; }
  float fi = float(i), R = mix(CW_ROW[i], 0.25, even);
  edge = min(abs(y), abs(R - y));
  bool down = i % 2 == 1;
  if (even > 0.5 && mod(lap, 2.0) > 0.5) down = !down;
  if (down) y = R - y;
  float cells = 1.0;
  if (roundAll > 0.0) { float m = 3.7699 / (2.0 * R); cells = max(floor(m + 0.5), 3.0); q.x *= mix(1.0, cells / m, roundAll); }
  float x = q.x + fi * 0.37 + lap * 0.5 + 0.03 * sin(uTime * 0.021 + fi * 1.9) + 0.015 * sin(TAU * uLoop + fi * 2.6);
  if (even > 0.0) x += even * (floor((lap * 5.0 + fi + 0.5) * 0.5) * 0.25 - fi * 0.37 - lap * 0.5);
  float x0 = x, id = floor(x / (2.0 * R)); x -= (id + 0.5) * 2.0 * R;
  if (roundAll > 0.99) id = mod(id, cells);
  float mid = q.x - x;
  float h0 = hash21(vec2(id + 11.0, fi + lap * 7.0 + 2.0));
  float side = x > 0.0 ? 1.0 : -1.0;
  // some are whole, some quartered, and now and then one comes apart into two quarters, back to back
  float wd = 0.42 - 0.4 * uOwn[6] - 0.2 * min(uOwn[6], 0.0);
  bool whole = h0 < wd, apart = h0 > 0.76 + 0.3 * max(-uOwn[6], 0.0), beside = hash21(vec2(id + side + 11.0, fi + lap * 7.0 + 2.0)) > 0.76 + 0.3 * max(-uOwn[6], 0.0);
  if (apart || beside) edge = min(edge, R - abs(x));
  if (apart) x = side * (R - abs(x));
  float r = cwLen(vec2(x, y)), n = i == 0 || i == 2 ? 4.0 : 3.0;
  if (uOwn[2] != 0.0) n = max(floor(n * exp2(1.25 * uOwn[2]) + 0.5), 1.0);
  bool outer = r > R;
  if (!whole && !(outer && !apart)) edge = min(edge, abs(x));
  edge = min(edge, abs(r - R));
  float w = fi * 2.0, u = r / R * n;
  if (uOwn[7] > 0.0 && !outer) u += uOwn[7] * (1.6 * atan(y, x + 1e-6) / PI - 0.8 + 0.4 * sin(uTime * 0.11 + id + fi)) * smoothstep(0.0, 0.3, r / R);
  u += 0.12 * (sin(4.0 * u + w) - sin(4.0 * n + w));
  float ring = outer ? 9.0 : clamp(floor(u), 0.0, n - 1.0), fu = u - ring;
  if (!outer) edge = min(edge, (fu > 0.5 || ring < 0.5 ? 1.0 - fu : fu) * R / (n * (1.0 + 0.48 * cos(4.0 * r / R * n + w))));
  float ang = atan(y, x + 1e-6) / PI;
  float blade = 0.0;
  if (uOwn[6] > 0.0 && !outer) {
    float m = 2.0 * floor(uOwn[6] * 5.0 + 0.5);
    if (m > 0.5) {
      float go = ang + uOwn[7] * 0.35 * r / R, b1 = go * m; blade = floor(b1);
      float fb = b1 - blade;
      edge = min(edge, min(fb, 1.0 - fb) / m * PI * r);
    }
  }
  if (cwBare) return vec3(0.0);
  vec3 c;
  float f = outer ? 1.0 : (ring + 0.5) / n, a = cwLight(f, cwLv[i], ring);
  if (apart) a = max(a, 0.85 * uKeys);
  if (outer) { c = mix(CW_LIE[i], i % 2 == 0 ? uKind[i] * uKind[i] * 0.45 + 0.03 : mix(vec3(0.84, 0.78, 0.68), uKind[i], 0.3), cwWorld); brush = vec3(y, x0, fi); }
  else {
    bool right = side > 0.0 && !whole;
    int j = (int(ring) * 2 + int(ring) / 2 + (right ? 3 : 0) + int(h0 * 5.0) * 2 + int(mod(blade, 2.0)) * 3) % 6;
    if (j < 0) j += 6;
    int b = (int[5](8, 4, 1, 10, 3)[i] + int(h0 * 17.0) % 3) % 12;
    c = cwPatch(i, b, j);
    // a short gradient, one way round in one fan and the other in the next
    float g = whole ? ang : (right ? 1.0 - 2.0 * ang : 2.0 - 2.0 * ang);
    g = sat(apart ? 1.0 - abs(g) : abs(g));
    if (fract(h0 * 31.0) > 0.5) g = 1.0 - g;
    vec3 to = j == 3 ? mix(c, uKind[i], 0.5) : (j == 1 ? mix(c, CW_PIG[(b + 11) % 12], 0.6) : (h0 * 5.0 - floor(h0 * 5.0) > 0.4
      ? mix(c, vec3(0.92, 0.86, 0.75), 0.62) : mix(c, CW_PIG[(b + j + 4) % 12] * 0.7, 0.6)));
    c = mix(c, to, smoothstep(0.1, 1.0, g));
    brush = vec3(r, ang * PI * r, id * 3.7 + ring * 11.3 + fi * 23.0 + (right ? 5.0 : 0.0));
  }
  cwA = outer ? 0.25 * a : a; cwHue = uKind[i] * (outer ? 0.4 : 1.0);
  c = cwSound(c, a);
  if (!outer) {
    c = cwPiece(cwBand(c, f, cwLv[i], a), piece(vec2(p.x / 1.78 + 0.5, 0.5 - p.y)));
    vec3 lit = cwRich(uKind[4], 1.2) * 1.05 + 0.04;
    // a hit runs along one band of the middle row; a cue hands one colour from fan to fan across the sheet
    float go = p.x - 0.5 + 0.8 * uHits;
    c = mix(c, lit, i == 2 && ring == 1.0 ? 0.85 * uHits * exp(-go * go * 14.0) : 0.0);
    go = mid + 0.35 * f - 1.2 + 1.9 * uCue;
    c = mix(c, lit, 0.75 * uCue * exp(-go * go * 12.0));
  }
  return c;
}

// Of another stuff than paint: a drawing, the dark, glass, a relief.
vec3 cwStuff(vec3 c, vec2 p, float edge, vec3 brush, float st2, float patchy, float px) {
  float line = 1.0 - smoothstep(0.0014, 0.0014 + px * 1.3, edge);
  if (uOwn[5] > 0.0) {
    float grain = noise(p * 260.0) * 0.5 + noise(p * 90.0) * 0.5, wash = smoothstep(0.0, 0.5, cwA) * (0.55 + 0.3 * patchy + 0.25 * exp(-edge * 60.0));
    vec3 paper = vec3(0.94, 0.92, 0.87) * (0.96 + 0.06 * grain);
    vec3 d = mix(paper, paper * mix(vec3(1.0), c * 1.25, 0.85), sat(0.07 + 0.93 * wash));
    d = mix(d, cwHue * 0.22 + 0.06, line * (0.5 + 0.5 * noise(p * 23.0)) * (0.6 + 0.4 * cwA));
    c = mix(c, d, uOwn[5]);
  }
  if (uOwn[5] < 0.0) {
    vec3 d = c * mix(c, vec3(1.0), 0.3) * (0.05 + 0.82 * cwA) + cwHue * (0.05 + 0.5 * cwA) * exp(-edge * 130.0) * (0.35 + 0.5 * cwA) + (cwHue + 0.1) * line * (0.28 + 0.3 * cwA);
    c = mix(c, d * (0.25 + 0.75 * smoothstep(0.0, 1.3 * px, edge)), -uOwn[5]);
  }
  if (uOwn[4] > 0.0) {
    float lamp = 0.4 + 0.7 * exp(-dot(p - vec2(-0.15, 0.1), p - vec2(-0.15, 0.1)) * 1.6);
    float seed = 0.8 + 0.35 * noise(p * 26.0 + brush.z) + 0.15 * st2;
    vec3 g = c * mix(vec3(1.0), c, 0.6) * lamp * seed * (0.55 + 0.75 * cwA) * (1.0 - 0.35 * exp(-edge * 45.0)) * 1.35;
    float lead = 1.0 - smoothstep(0.0045, 0.0045 + 2.0 * px, edge);
    g = mix(g, vec3(0.03, 0.032, 0.035) + 0.07 * smoothstep(0.004, 0.0, edge) * lamp, lead);
    c = mix(c, g, uOwn[4]);
  }
  if (uOwn[4] < 0.0) {
    vec2 slope = cwSlope;
    slope /= max(length(slope), 1.0);
    float bev = smoothstep(0.034, 0.0, edge);
    bev *= bev;
    float lit = dot(slope, normalize(vec2(0.62, -0.75))) * bev;
    float grain = 0.85 + 0.3 * noise(vec2(brush.x * 130.0, brush.y * 6.0 + brush.z));
    vec3 s = mix(c, c * c * 1.3, 0.4) * grain * (0.72 + 0.62 * lit + 0.16 * (1.0 - bev)) * (1.0 - 0.6 * exp(-edge * 210.0));
    s += vec3(1.0, 0.96, 0.9) * pow(max(lit, 0.0), 2.5) * 0.4;
    s *= 1.12 - 0.55 * smoothstep(-0.5, 1.2, p.x - p.y * 0.9);
    c = mix(c, s, -uOwn[4]);
  }
  return c;
}
vec3 render(vec2 p) {
  cwLv = float[CW_N](uDrone, uPad, uTexture, uPhrase, uHits, uKeys, uMic, 0.3 * smoothstep(0.35, 0.9, uLevel));
  float px = 1.0 / uRes.y;
  vec4 w0 = vec4(uOwn[0], uOwn[1], uOwn[2], uOwn[3]), w1 = vec4(uOwn[4], uOwn[5], uOwn[6], uOwn[7]);
  cwWorld = sat(2.0 * (dot(w0, w0) + dot(w1, w1)));
  // a hand drew it: every edge wanders a little
  vec2 q = p + 0.005 * (vec2(noise(p * 11.0), noise(p * 11.0 + 40.0)) - 0.5);
  if (uVar < 0.5) for (int k = 0; k < CW_N; k++) cwW[k] = cwSet(k);
  vec3 brush; float edge; cwSlope = vec2(0.0);
  vec3 c = uVar > 0.5 ? cwHalf(q, brush, edge) : cwDiscs(q, brush, edge);
  if (uOwn[4] < 0.0 && edge < 0.036) {
    vec3 b; vec2 e, a = vec2(max(1.2 * px, 0.0025), 0.0); cwBare = true;
    if (uVar > 0.5) { cwHalf(q + a, b, e.x); cwHalf(q + a.yx, b, e.y); } else { cwDiscs(q + a, b, e.x); cwDiscs(q + a.yx, b, e.y); }
    cwSlope = (e - edge) / a.x; cwBare = false;
  }
  // the brush goes along the ring in short pulls: bristle streaks, fuller dabs, thin places where the canvas comes through
  brush.x += 0.006 * noise(vec2(brush.y * 14.0 + brush.z, brush.x * 9.0));
  float st = noise(vec2(brush.x * 210.0, brush.y * 15.0 + brush.z));
  float st2 = noise(vec2(brush.x * 60.0 + 31.0, brush.y * 13.0 + brush.z * 1.7));
  float patchy = noise(vec2(brush.x * 17.0, brush.y * 9.0) + brush.z);
  vec2 thread = p * 640.0 + 1.6 * vec2(noise(p.yy * vec2(30.0, 7.0)), noise(p.xx * vec2(30.0, 7.0)));
  float weave = sin(thread.x) * sin(thread.y) * (1.0 - smoothstep(0.002, 0.004, px));
  float thin = smoothstep(0.5, 1.0, 0.35 * st + 0.4 * st2 + 0.45 * patchy + 0.1 * (uSpace - 0.5));
  c = mix(c, CW_CANVAS, (0.14 + 0.16 * uSpace) * thin);
  c *= 1.0 + (0.04 + 0.08 * uTone) * (st - 0.5) + 0.12 * (st2 - 0.5) + 0.16 * (patchy - 0.5) + (0.012 + 0.034 * thin) * weave;
  c *= (0.94 + 0.12 * uTone) * (1.03 - 0.12 * exp(-edge * 110.0)); // the paint lies heavier at the edge of its patch
  // bare canvas between patches, wider and narrower; where they touch, the drawing under the paint
  float wide = smoothstep(0.3, 0.95, noise(p * 9.0 + 3.0));
  vec3 seam = mix(vec3(0.36, 0.33, 0.32), CW_CANVAS * (0.9 + 0.05 * weave), smoothstep(0.1, 0.8, wide));
  c = mix(c, seam, 1.0 - smoothstep(0.0022 * wide, px * 1.1 + 0.0022 * wide, edge));
  if (uOwn[4] != 0.0 || uOwn[5] != 0.0) c = cwStuff(c, p, edge, brush, st2, patchy, px);
  // daylight from the upper left
  c *= 1.08 - 0.26 * smoothstep(-0.7, 1.3, p.x - p.y * 0.8);
  return clamp(c, 0.0, 1.0);
}
