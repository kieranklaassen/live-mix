// name: Small squares
// a: Watercolour
// b: Sandbanks
// what: A hand-ruled net of uneven squares and oblongs on rough paper, each a watercolour wash with its own dried edge, stepping from dark blue and wine at the edges to pale yellow near the middle; or long sandbanks at low tide seen from the air, with bare paper channels between them running into one winding creek.
// follows: Each stroke of the piece stains the washes where it lies with its own colour; each band deepens its row and parts the light squares from the dark; a soft light goes with the playhead; a hit pales the washes under one soft circle there, and a cue sends a warm step out from it. A drone deepens the low rows, a voice clears the middle, keys darken the edges.
// own: 0 1 many small pieces, -1 a few great ones; 1 1 round discs and pebbles, -1 each cut across into shards; 2 1 a dark ground, the pieces lit from behind like panes, -1 a ground in the colour of the drone with the pieces in thick paint; 3 1 raised glazed tiles with shadows, -1 patches of woven cloth, stitched round; 4 1 coloured in the sounds' colours only, -1 all in one ink of the drone's colour from thick to thin; 5 1 laid down to a far horizon under a sky, -1 strewn loose, turned, some gone; 6 1 bent round into rings about the middle, -1 draped over folds and hills in slanting light; 7 1 wet, the washes running into each other, -1 outlines only

vec2 sqHalf;   // half the painted sheet
vec2 sqGrid, sqAt, sqM;   // the half of the laid sheet, its middle, and how a place is stretched on it
vec2 sqP;
float sqStruck, sqLoud, sqFold;   // how loud this wash is, and the light on the fold
vec3 sqHue;   // the bare ground
float sqPx;    // one pixel
float sqGrain, sqTooth, sqWob, sqCloud; // the paper's tooth and the hand's wobble at this place

// Pigments, dark to light, as light let through by one full wash: a warm line and a cool one.
vec3 sqWarm(float t) {
  vec3 c = mix(vec3(0.40, 0.17, 0.24), vec3(0.70, 0.27, 0.22), smoothstep(0.0, 0.3, t));
  c = mix(c, vec3(0.86, 0.50, 0.25), smoothstep(0.25, 0.52, t));
  c = mix(c, vec3(0.95, 0.74, 0.38), smoothstep(0.48, 0.74, t));
  return mix(c, vec3(0.985, 0.91, 0.66), smoothstep(0.7, 1.0, t));
}
vec3 sqCool(float t) {
  vec3 c = mix(vec3(0.20, 0.23, 0.40), vec3(0.22, 0.39, 0.49), smoothstep(0.0, 0.3, t));
  c = mix(c, vec3(0.40, 0.50, 0.48), smoothstep(0.25, 0.52, t));
  c = mix(c, vec3(0.67, 0.73, 0.60), smoothstep(0.48, 0.74, t));
  return mix(c, vec3(0.90, 0.91, 0.78), smoothstep(0.7, 1.0, t));
}
float sqSq(float x) { return x * x; }
float sqWrap(float x) { return abs(fract(x + 0.5) - 0.5); }
const float SQ_HOR = 0.74;
float sqRing() { return 0.27 / max(uOwn[6], 1e-4); }
// A place of the picture on the sheet, and one on the sheet back in the picture.
vec2 sqLay(vec2 p) {
  if (uOwn[5] > 0.0) {
    float w = max(1.0 - uOwn[5] * (p.y + 0.5) / SQ_HOR, 0.01);
    p = vec2(p.x / w, (p.y + 0.5) / w - 0.5);
    sqPx /= w;
  }
  if (uOwn[6] > 0.0) {
    float l = sqRing(), k = uOwn[6], s = 1.0 + k;
    vec2 d = p + vec2(0.0, l - 0.27 * k);
    float r = length(d) + 1e-4, wide = mix(l, sqHalf.x / PI, k);
    float a = atan(d.x, d.y + (abs(d.x) < 1e-5 ? 1e-5 : 0.0));
    p = vec2(a * wide, (r - l) * s);
    sqM = vec2(r / wide, 1.0 / s);
  }
  if (uOwn[6] < 0.0) {
    vec2 q = p * vec2(1.0, 1.3);
    float t = uTime * 0.07, a = 3.1 * q.x + 4.3 * q.y + t + 0.9 * sin(2.3 * q.x - 1.7 * q.y), b = 6.1 * q.x - 2.7 * q.y - 0.8 * t + 1.0;
    float far = exp(-max(length(p) - 0.9, 0.0));
    p += far * uOwn[6] * vec2(-0.012 * sin(b) + 0.03 * cos(a), 0.062 * sin(a) + 0.02 * sin(b));
    sqFold = 1.0 - far * uOwn[6] * (0.3 * cos(a) + 0.16 * cos(b) - 0.06);
  }
  return p;
}
vec2 sqSeen(vec2 c) {
  if (uOwn[6] > 0.0) {
    float l = sqRing(), k = uOwn[6], r = c.y / (1.0 + k) + l, a = c.x / mix(l, sqHalf.x / PI, k);
    c = r * vec2(sin(a), cos(a)) - vec2(0.0, l - 0.27 * k);
  }
  if (uOwn[5] > 0.0) {
    float y = max(c.y + 0.5, -0.2), k = uOwn[5] / SQ_HOR;
    y /= 1.0 + k * y;
    c = vec2(c.x * (1.0 - k * y), y - 0.5);
  }
  return c;
}
// What a wash at place c (its own middle) is made of: the pigment and how much of it. r is the wash's own four numbers.
vec3 sqPigment(vec2 c, float row, float odd, vec4 r, out float dens) {
  if (uOwn[5] > 0.0 || uOwn[6] > 0.0) c = sqSeen(c);
  vec2 uv = vec2(0.5 + 0.5 * c.x / sqHalf.x, 0.5 - 0.5 * c.y / sqHalf.y);
  float answer = 0.55 + 1.0 * uEnergy;
  // the light in the sheet: a place that wanders over minutes, and a soft column at the playhead
  vec2 sun = vec2(0.16 * sqHalf.x + 0.14 * sqHalf.x * sin(uTime * 0.031), 0.05 + 0.06 * sin(uTime * 0.043 + 1.0));
  float t = 1.06 - length((c - sun) / (sqHalf * vec2(0.98, 1.12)));
  float head = sqWrap(uv.x - uLoop) / 0.16;
  float col = exp(-head * head);
  t += 0.09 * uPad * exp(-dot(c - sun, c - sun) * 6.0) + 0.12 * uMic * exp(-dot(c - sun, c - sun) * 9.0) + 0.1 * col * (0.3 + uLevel) + 0.03 * sin(uTime * 0.21 + r.x * TAU);
  t += (r.y - 0.5) * 0.24 + (odd - 0.5) * 0.1;
  float b = band(0.06 + 0.88 * row);
  t += answer * b * (0.04 + 0.16 * (odd - 0.5)) + 0.08 * (uTone - 0.5);
  // warm against cool: a slow turn across the sheet, with every other wash leaning the other way
  float w = 0.46 + 0.1 * uVar + 0.3 * sin(c.x * 2.3 - c.y * 3.1 + 0.6 + 0.12 * sin(uTime * 0.05)) + (odd - 0.5) * 0.62 + (r.z - 0.5) * 0.34;
  // a drone lies low: the lower rows go deeper and cooler
  float low = uDrone * smoothstep(0.0, 0.4, -c.y);
  t -= 0.12 * low; w -= 0.3 * low;
  // the cue: a warm step that goes out from the playhead
  float at = sqWrap(uv.x - uLoop) * 2.0 + 0.1 * abs(c.y) - 1.25 * (1.0 - uCue);
  float ripple = uCue * exp(-at * at * 14.0);
  w += 1.1 * ripple; t += 0.22 * ripple;
  t = sat(t);
  vec3 ink = mix(sqCool(t), sqWarm(t), smoothstep(0.15, 0.85, w));
  if (uOwn[4] > 0.0) {
    vec3 own = mix(mix(uKind[0], mix(uKind[1], uKind[2], smoothstep(0.2, 0.8, w)), smoothstep(0.08, 0.5, t + (r.x - 0.5) * 0.3)), uKind[3], smoothstep(0.55, 0.95, t + (r.y - 0.5) * 0.3));
    own = mix(own, uKind[4], smoothstep(0.9, 0.94, r.w)) * (0.9 + 0.2 * r.z);
    ink = mix(ink, own, uOwn[4]);
  }
  if (uOwn[4] < 0.0) ink = mix(ink, mix(uKind[0], vec3(0.97, 0.955, 0.92), smoothstep(0.0, 1.1, t + (r.z - 0.5) * 0.35)), -uOwn[4]);
  // the piece: where a stroke lies the wash takes the stroke's colour, worked into its step of light
  vec4 m = piece(clamp(uv, 0.01, 0.99));
  float loud = sat(m.a * 1.25 * answer);
  float top = max(m.r, max(m.g, m.b));
  vec3 hue = m.rgb / max(top, 0.02);
  hue = mix(hue, vec3(dot(hue, vec3(0.3, 0.55, 0.15))), 0.3);
  if (uOwn[4] < 0.0) hue = mix(hue, uKind[0], -0.7 * uOwn[4]);
  if (uOwn[4] > 0.0) hue = mix(hue, m.rgb / max(m.a, 0.02), uOwn[4]);
  sqLoud = loud;
  float lift = sat(t + 0.2 * loud);
  ink = mix(ink, sqWarm(lift) * 0.5 + sqCool(lift) * 0.5, 0.4 * loud * (1.0 - abs(uOwn[4])));
  vec3 lean = mix(vec3(0.90, 0.98, 1.10), vec3(1.12, 0.96, 0.82), sat(w));
  ink = mix(ink, pow(hue * 0.94 * lean + 0.04, vec3(mix(mix(1.9, 0.62, lift), mix(1.25, 0.9, lift), abs(uOwn[4])))), 0.68 * loud);
  ink *= 1.0 - vec3(-0.03, 0.15, 0.08) * smoothstep(0.7, 0.8, r.w) * (1.0 - 0.85 * abs(uOwn[4]));
  if (uOwn[2] < 0.0) ink *= 1.0 + 0.36 * uOwn[2] * smoothstep(0.26, 0.06, distance(ink, sqHue));
  dens = mix(0.74 + 0.5 * r.w, 1.2, 0.5 * loud) * (1.0 + 0.25 * b);
  // a hit: the washes under one soft circle pale
  vec2 hc = vec2(sqWrap(uv.x - uLoop) * 2.0 * sqHalf.x, c.y - 0.1 * sin(TAU * uLoop));
  float hit = sat(uHits) * exp(-dot(hc, hc) * 26.0);
  dens *= 1.0 - 0.72 * hit;
  sqStruck = hit;
  dens *= 1.12 - 0.24 * uTone;
  return clamp(ink, 0.02, 1.0);
}
// One wash laid on the paper: d is how far inside its edge, q the place in it from -1 to 1.
vec3 sqWash(vec3 ground, vec3 ink, float dens, float d, vec2 q, vec4 r) {
  float e = max(sqPx, 0.0008 + 0.0026 * uSpace * uSpace);
  if (uOwn[7] > 0.0) {                                  // wet: it runs past its edge, and softly
    e += uOwn[7] * (0.008 + 0.016 * sqCloud);
    d += uOwn[7] * (0.036 * (sqCloud - 0.36) + 0.012 * (sqWob - 0.5));
  }
  float on = smoothstep(-e, e, d);
  float ds = max(d, 0.0);
  if (uOwn[7] < 0.0) {
    float line = smoothstep(0.0075 + e, 0.0045, ds + 0.004 * (sqWob - 0.5)) + 0.10 * sqLoud;
    on *= mix(1.0, sat(line + 0.06), -uOwn[7]);
  }
  float rim = exp(-ds / (0.0030 + 0.0012 * r.x));
  float inner = exp(-sqSq((ds - 0.011) / 0.008));
  float lean = dot(q, vec2(cos(r.y * TAU), sin(r.y * TAU)) * 0.5);       // the sheet was tipped: pigment ran one way
  float pool = 0.84 - 0.04 * uSpace + 0.30 * lean + (0.28 + 0.5 * uSpace) * (sqCloud - 0.5);
  // a bloom: water dropped back into the half dry wash
  float bl = length(q - (r.zw - 0.5) * 1.3) - 0.35 - 0.5 * r.z + (sqWob - 0.5) * 0.5;
  float has = step(0.62, r.x);
  pool += has * (-0.22 * (1.0 - smoothstep(-0.5, 0.1, bl)) + 0.24 * exp(-bl * bl * 160.0));
  float dark = 1.0 - dot(ink, vec3(0.3, 0.5, 0.2));
  float shore = ds + (sqCloud - 0.5) * 0.02;
  float tide = uVar * (smoothstep(0.010, 0.018, shore) * 0.16 + 0.03 * exp(-sqSq((shore - 0.0145) / 0.0018)) - 0.09);
  float k = dens * on * (pool + tide + (1.0 - 0.4 * uSpace + 0.5 * uKeys) * rim - 0.10 * inner + (sqGrain - 0.5) * (0.22 + 0.5 * dark + 0.3 * uTexture));
  vec3 was = ground * pow(ink, vec3(max(k, 0.0)));
  if (uOwn[2] == 0.0 && uOwn[3] == 0.0) return was;
  float up = max(uOwn[3], 0.0), cloth = max(-uOwn[3], 0.0);
  if (uOwn[2] < 0.0) {                                  // thick paint
    vec3 paint = ink * (0.97 + 0.22 * (pool - 0.84) + 0.10 * (sqGrain - 0.5) - 0.10 * rim * (1.0 - up)) * (0.92 + 0.16 * sqLoud);
    paint = mix(paint, ground * 0.5 + 0.5, 0.75 * sqStruck);
    was = mix(was, mix(ground, paint, on), -uOwn[2]);
  }
  if (uOwn[2] > 0.0) {                                  // lit from behind
    float lamp = (0.5 + 0.62 * sqLoud + 0.12 * uLevel) * mix(0.35, 1.0, sat(dens)) * (0.86 + 0.25 * (pool - 0.84)) * (1.0 - 0.4 * rim) * (0.28 + 0.72 * smoothstep(0.2, 0.5, r.w + 0.3 * sqLoud));
    vec3 pane = mix(ink * ink, ink, 0.45) * lamp * 1.25;
    vec3 lit = mix(ground + ink * lamp * 0.24 * exp(min(d, 0.0) / 0.010) * smoothstep(-0.022, -0.012, d), pane, on);
    was = mix(was, lit / (1.0 + 0.12 * lit * lit), uOwn[2]);
  }
  if (up > 0.0) {                                       // a tile with a worn edge, under one lamp
    vec2 q4 = q * q; q4 *= q4;
    vec2 face = q * q4 / (length(q * q4) + 0.25);
    float bev = exp(-ds / 0.009), l = dot(face, vec2(-0.55, 0.83));
    float sheen = exp(-sqSq(dot(q, vec2(0.62, -0.78)) + 0.62 + 0.3 * (r.y - 0.5)) * 18.0) * smoothstep(0.004, 0.012, ds);
    vec3 tile = was * (1.0 + 0.62 * l * bev - 0.12 * bev) * (0.94 + 0.14 * dot(q, vec2(-0.4, 0.5))) + vec3(1.0, 0.97, 0.92) * sheen * (0.07 + 0.16 * r.z) * mix(1.0, 0.4, sat(uOwn[2]));
    float sh = exp(min(d, 0.0) / 0.008) * smoothstep(-0.022, -0.012, d) * (0.55 - 0.45 * clamp(l * 1.5, -1.0, 1.0));
    vec3 low = was * (1.0 - 0.75 * sh);
    was = mix(was, mix(low, tile, on), up);
  }
  if (cloth > 0.0) {                                    // woven, puffed a little, and stitched round
    vec2 w = r.z > 0.5 ? sqP : sqP.yx;
    float fine = 1.0 - smoothstep(0.0009, 0.0026, sqPx), f = 560.0 + 260.0 * r.w;
    float weave = sin(w.x * f + 1.5 * sin(w.y * f * 0.5)) * sin(w.y * f * 0.55), rib = r.y > 0.55 ? sin((w.x + w.y * (r.x - 0.3)) * 190.0) : 0.0;
    vec3 patch_ = was * (1.0 + fine * (0.20 * weave + 0.12 * rib)) * (0.84 + 0.26 * smoothstep(0.0, 0.03, ds)) * (1.0 + 0.16 * dot(q, vec2(-0.4, 0.5)) * exp(-ds / 0.016));
    float along = abs(q.x) > abs(q.y) ? sqP.y : sqP.x, st = smoothstep(0.0016 + sqPx, 0.0006, abs(ds - 0.0085)) * smoothstep(-0.2, 0.3, sin(along * 330.0));
    patch_ = mix(patch_, mix(sqHue, vec3(0.93, 0.9, 0.84), 0.5 + 0.4 * uKeys), st * 0.75);
    was = mix(was, mix(was, patch_, on), cloth);
  }
  return was;
}
float sqSkip() { return uOwn[7] > 0.0 || uOwn[2] > 0.0 || uOwn[3] > 0.0 ? -0.03 : -0.004; }
float sqLine(float d, float w) { return 1.0 - smoothstep(w - sqPx * 0.5, w + sqPx, abs(d)); }

// a: the net of squares
vec3 sqNet(vec2 p, vec3 col) {
  float many = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.25));
  vec2 n = vec2(max(3.0, floor(sqGrid.x * 2.0 / 0.118 * many + 0.5)), floor(8.0 * sqGrid.y / 0.43 * many + 0.5));
  float strewn = max(-uOwn[5], 0.0), even = 1.0 - max(uOwn[6], 0.0);
  p -= sqAt;
  vec2 h = p + 0.008 * sin(p.yx * vec2(5.3, 4.1) + vec2(0.4, 2.0) + 0.3 * sin(uTime * 0.06)) + 0.0035 * sin(p.yx * vec2(17.0, 14.0) + vec2(1.0, 4.0));
  vec2 u = 0.5 + 0.5 * h / sqGrid;
  vec2 bend = n * vec2(0.031, 0.0425);
  vec2 g = u * n + bend * sin(TAU * u * 2.0 + vec2(0.0, 2.6)) - vec2(0.0, bend.y * sin(2.6));
  vec2 slope = 2.0 * sqGrid / (n + bend * TAU * 2.0 * cos(TAU * u * 2.0 + vec2(0.0, 2.6))); // size of one step here
  if (uOwn[6] > 0.0) slope *= mix(vec2(1.0), sqM, uOwn[6]);
  vec2 lo = floor(g - 0.5);
  // the pencil net, ruled by hand and a little past the edge of the painting
  vec2 gl = g - floor(g + 0.5);
  vec2 past = 1.0 - smoothstep(vec2(0.0), vec2(0.035), abs(h) - sqGrid);
  float pen = max(sqLine(gl.x * slope.x, 0.0006) * past.y * step(abs(h.x), sqGrid.x + 0.01), sqLine(gl.y * slope.y, 0.0006) * past.x * step(abs(h.y), sqGrid.y + 0.01));
  col *= 1.0 - (0.22 + 0.25 * uKeys) * pen * (0.35 + 0.9 * sqGrain) * (1.0 - strewn) * (1.0 - max(uOwn[5], 0.0));
  for (int b = 0; b < 2; b++) {
    float j = lo.y + float(b);
    if (j < 0.0 || j > n.y - 0.5) continue;
    float jr = hash11(j + 3.7);
    float gx = g.x + (jr - 0.5) * 0.34 * even + 0.07 * band((j + 0.5) / n.y) * sin(uTime * 0.3 + j * 2.0);
    float i0 = floor(gx - 0.5), was = -9.0;
    for (int a = 0; a < 2; a++) {
      float i = i0 + float(a);
      if (i < 0.0 || i > n.x - 0.5) continue;
      // some squares join their neighbour into an oblong
      float pair = floor((i + mod(j, 2.0)) * 0.5) * 2.0 - mod(j, 2.0);
      float start = i, wide = 1.0;
      if (hash21(vec2(pair, j) + 31.0) < 0.2 * (1.0 - strewn) && pair >= 0.0 && pair + 1.5 < n.x) { start = pair; wide = 2.0; }
      if (start == was) continue;
      was = start;
      vec4 r = vec4(hash22(vec2(start, j) + 1.5), hash22(vec2(j, start) + 8.5));
      vec2 x = vec2(gx - start, g.y - j);
      float idSum = start + j;
      vec4 edge = (vec4(hash22(vec2(start, j) + 40.5), hash22(vec2(start, j) + 60.5)) - 0.5) * 0.15 + 0.03;
      vec2 tilt = (r.zy - 0.5) * 0.12;
      float L = edge.x + tilt.x * (x.y - 0.5), R = wide - edge.y + tilt.x * (x.y - 0.5);
      float B = edge.z + tilt.y * (x.x - 0.5), T = 1.0 - edge.w + tilt.y * (x.x - 0.5);
      // and some are cut in two, upright or lying
      float cut = r.x;
      if (wide < 1.5 && cut < 0.13 * (1.0 - strewn)) { float s = 0.4 + 0.25 * r.y; if (x.x < s) R = s - 0.03; else { L = s + 0.03; r = r.zwxy; idSum += 1.0; } }
      else if (cut > 0.86 + 0.15 * strewn) { float s = 0.38 + 0.25 * r.y; if (x.y < s) T = s - 0.03; else { B = s + 0.03; r = r.wzyx; idSum += 1.0; } }
      vec2 mid = vec2(0.5 * (L + R), 0.5 * (B + T));
      float gone = 0.0, half_ = 0.0;
      if (strewn > 0.0) {                  // turned about its middle, moved a little, or gone
        vec2 o = (x - mid) * slope - (r.wx - 0.5) * 0.34 * strewn * slope;
        x = mid + rot((r.y - 0.5) * 2.6 * strewn) * o / slope;
        float sm = strewn * (0.03 + 0.12 * r.z);
        sm = min(sm, 0.22 * min(R - L, T - B));
        vec2 hf = 0.5 * vec2(R - L, T - B);
        hf = mix(hf, min(hf, 0.48 * min(slope.x, slope.y) / slope), strewn);
        L = mid.x - hf.x; R = mid.x + hf.x; B = mid.y - hf.y; T = mid.y + hf.y;
        L += sm; R -= sm; B += sm; T -= sm;
        gone = smoothstep(1.0 - 0.24 * strewn, 1.03 - 0.24 * strewn, fract(r.w * 7.13 + r.z)) * strewn;
      }
      float d = smin(min(x.x - L, R - x.x) * slope.x, min(x.y - B, T - x.y) * slope.y, 0.012);
      if (uOwn[1] != 0.0) {
        vec2 hs = 0.5 * vec2(R - L, T - B) * slope, v = (x - mid) * slope / max(hs, 0.002);
        float most = min(hs.x, hs.y);
        if (uOwn[1] > 0.0) d = mix(d, (1.0 - length(v)) * most, uOwn[1]);
        else {
          float s = dot(v, vec2(r.z > 0.5 ? 0.707 : -0.707, 0.707));
          half_ = step(0.0, s) * -uOwn[1];
          d = min(d, abs(s) * most - 0.0035 + 0.09 * (1.0 + uOwn[1]));
        }
        r = mix(r, r.zwxy, half_);
      }
      d -= gone * 0.1;
      d += (sqWob - 0.5) * 0.007;
      if (d < sqSkip()) continue;
      // where this wash's middle is on the sheet
      vec2 gm = (vec2(start + mid.x - (jr - 0.5) * 0.34 * even, j + mid.y) + vec2(0.0, bend.y * sin(2.6))) / n;
      vec2 um = gm - bend / n * sin(TAU * gm * 2.0 + vec2(0.0, 2.6));
      vec2 c = (um * 2.0 - 1.0) * sqGrid + sqAt;
      float dens;
      vec3 ink = sqPigment(c, (j + 0.5) / n.y, abs(mod(idSum, 2.0) - half_), r, dens);
      col = sqWash(col, ink, dens, d, (x - mid) / vec2(R - L, T - B) * 2.0, r);
    }
  }
  return col;
}
// b: banks of sand between channels of bare paper, seen from the air
vec3 sqBanks(vec2 p, vec3 col) {
  float many = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.1)), curl = min(many, 1.0);
  float n = floor(13.0 * sqGrid.y / 0.43 * many + 0.5), strewn = max(-uOwn[5], 0.0);
  float sway = uTime * 0.02;
  // the creek that all the channels run down to
  float bed = 0.03 - 0.27 * p.x + 0.085 * sin(p.x * 3.6 + 1.2) + 0.055 * sin(p.x * 7.6 - 0.4);
  float lean = -0.27 + 0.306 * cos(p.x * 3.6 + 1.2) + 0.418 * cos(p.x * 7.6 - 0.4);
  float creek = abs(p.y - bed) / sqrt(1.0 + lean * lean) - 0.009 - 0.020 * exp(-sqSq((p.x - 0.22) / 0.4)) - 0.006 * sin(p.x * 10.0);
  float q = p.y - bed;
  vec2 tape = sqGrid + vec2(0.004, 0.0) - abs(p - sqAt + 0.004 * sin(p.yx * 6.0 + 1.0));
  float frame = min(tape.x, tape.y);
  float y = p.y + 0.034 * sin(p.x * 2.3 + 0.9 + 0.5 * sin(sway)) + 0.020 * sin(p.x * 4.6 + 2.4 * p.y + 2.0) + 0.06 * exp(-q * q * 9.0);
  float ph = 9.0 * y + 2.2 * sin(p.x * 1.7 - 0.5), ph2 = 5.0 * y - 2.6 * p.x + 1.0;
  float g = (0.5 + 0.5 * (y - sqAt.y) / sqGrid.y) * n + curl * (0.5 * sin(ph) + 0.8 * sin(ph2));
  float slope = 1.0 / (0.5 * n / sqGrid.y + curl * (4.5 * cos(ph) + 4.0 * cos(ph2)));
  if (uOwn[6] > 0.0) slope *= mix(1.0, sqM.y, uOwn[6]);
  float lo = floor(g - 0.5);
  for (int b = 0; b < 2; b++) {
    float j = lo + float(b);
    if (j < 0.0 || j > n + 0.5) continue;
    float jr = hash11(j + 5.3), row = min((j + 0.5) / n, 1.0);
    float loud = band(0.06 + 0.88 * row);
    // how broad the bank is here: it swells, thins to a tip and is gone, with the tide
    float h = 0.40 + 0.19 * sin(p.x * 2.4 + j * 2.4 + 0.5 * sin(uTime * 0.05 + j)) + 0.13 * sin(p.x * 5.3 - j * 1.7) + 0.02 * sin(uTime * 0.13 + j * 1.9) + 0.05 * loud;
    h = min(h, 0.53);
    float off = g - j - 0.5 + 0.05 * sin(p.x * 6.0 + j * 3.0);
    float db = (h - abs(off)) * slope;
    if (db < min(-0.01, sqSkip() * 1.4)) continue;
    // doubled: where a bank is broad a channel opens along it
    float gut = 0.7 * smoothstep(0.30, 0.5, h) * smoothstep(-0.3, 0.8, sin(p.x * 3.1 + j * 2.9)) - 0.52;
    db = min(smin(min(db, (abs(off - 0.1 * sin(p.x * 3.4 + j)) - gut) * slope), frame, 0.018), creek);
    float f = mix(1.8, 5.2, hash11(j + 14.7)) * many;
    if (uOwn[1] > 0.0) f *= 1.0 + 0.5 * uOwn[1];
    float gx = p.x * f + jr * 7.0 + (fract(jr * 9.0) - 0.5) * 0.5 * off + 0.3 * sin(p.x * 3.0 + j);
    float i0 = floor(gx - 0.5);
    for (int a = 0; a < 2; a++) {
      float i = i0 + float(a);
      vec4 r = vec4(hash22(vec2(i, j) + 1.5), hash22(vec2(j, i) + 8.5));
      vec2 ed = (hash22(vec2(i, j) + 40.5) - 0.55) * 0.05;
      float x = gx - i;
      float d = smin(db, min(x - ed.x, 1.0 - ed.y - x) / f, 0.008) + (sqWob - 0.5) * 0.006;
      float half_ = 0.0;
      if (uOwn[1] > 0.0) {
        vec2 v = vec2((x - 0.5) * 2.0, off / max(h, 0.02));
        d = min(mix(d, (1.0 - length(v)) * min(0.5 / f, h * slope), uOwn[1]), min(creek, frame + 0.012));
      }
      if (uOwn[1] < 0.0) {
        float s = (x - 0.5) * 1.5 + off * (r.z > 0.5 ? 1.2 : -1.2);
        half_ = step(0.0, s) * -uOwn[1];
        d = min(d, abs(s) * min(0.5 / f, slope * 0.5) - 0.003 + 0.09 * (1.0 + uOwn[1]));
        r = mix(r, r.zwxy, half_);
      }
      if (strewn > 0.0) d -= strewn * (0.10 * smoothstep(0.62, 0.66, fract(r.w * 7.13 + r.z)) + 0.004 + 0.012 * r.y * (sqCloud + 0.4));
      if (d < sqSkip()) continue;
      vec2 c = vec2((i + 0.5 - jr * 7.0) / f, ((j + 0.5) / n - 0.5) * 2.0 * sqGrid.y + sqAt.y);
      float dens;
      vec3 ink = sqPigment(c, row, abs(mod(i + j, 2.0) - half_), r, dens);
      col = sqWash(col, ink, dens, d, vec2(x * 2.0 - 1.0, off * 1.6), r);
    }
  }
  return col;
}
vec3 render(vec2 p) {
  sqPx = 1.0 / uRes.y;
  sqHalf = vec2(clamp(0.5 * uRes.x / uRes.y - 0.075, 0.2, 0.95), 0.43);
  sqGrid = sqHalf; sqAt = vec2(0.0); sqM = vec2(1.0); sqLoud = 0.0; sqFold = 1.0;
  if (uOwn[5] > 0.0) {                   // laid down, the sheet goes on to all sides
    sqGrid *= 1.0 + vec2(8.0, 9.0) * uOwn[5];
    sqAt.y = sqGrid.y - 0.43 - 0.15 * uOwn[5];
  }
  vec2 eye = p;
  sqTooth = noise(p * 190.0);
  float tooth2 = noise(p * 190.0 + vec2(-0.45, 0.45));
  sqGrain = 0.6 * sqTooth + 0.4 * noise(p * 420.0 + 9.0);
  float lump = noise(p * 34.0);
  sqWob = 0.75 * lump + 0.25 * sqTooth;
  sqCloud = 0.65 * noise(p * 11.0 + 3.0) + 0.35 * lump;
  vec3 paper = vec3(0.955, 0.925, 0.865) * (1.0 + 0.05 * (sqTooth - tooth2));
  paper *= 1.0 + 0.02 * sin(p.x * 3.1 + 1.3 * sin(p.y * 4.0)) - 0.08 * dot(p, p);
  if (uOwn[2] > 0.0) paper = mix(paper, (0.012 + 0.07 * uKind[0] * uKind[0]) * (0.7 + 0.6 * sqGrain), uOwn[2]);
  if (uOwn[2] < 0.0) paper = mix(paper, uKind[0] * (0.86 + 0.1 * sqCloud + 0.08 * sqGrain) * (1.0 - 0.1 * dot(p, p)), -uOwn[2]);
  if (uOwn[2] < 0.0) {
    vec2 hc = vec2(sqWrap(0.5 + 0.5 * p.x / sqHalf.x - uLoop) * 2.0 * sqHalf.x, p.y - 0.1 * sin(TAU * uLoop));
    paper = mix(paper, paper * 0.7 + 0.3, -0.5 * uOwn[2] * sat(uHits) * exp(-dot(hc, hc) * 26.0));
  }
  sqHue = paper;
  if (uOwn[5] > 0.0 || uOwn[6] != 0.0) p = sqLay(p);
  sqP = p;
  vec3 col = uVar < 0.5 ? sqNet(p, paper) : sqBanks(p, paper);
  if (uOwn[6] < 0.0) col *= sqFold > 1.0 ? 1.0 + 0.3 * (sqFold - 1.0) : sqFold;
  if (uOwn[5] > 0.0) {                   // the air, and the sky
    float k = uOwn[5], far = 1.0 - k * (eye.y + 0.5) / SQ_HOR, up = sat((eye.y + 0.5 - SQ_HOR / k) / 0.3);
    vec3 low = mix(vec3(0.96, 0.89, 0.78), uKind[4], 0.75 * abs(uOwn[4])), high = mix(vec3(0.66, 0.74, 0.78), mix(uKind[4], vec3(0.5, 0.58, 0.66), 0.6), 0.75 * abs(uOwn[4]));
    float dim = 1.0 - 0.68 * max(uOwn[2], 0.0);
    float cloud = fbm(vec2(eye.x * 1.6 + uTime * 0.004, (eye.y - SQ_HOR / k + 0.5) * 7.0 + 3.0));
    vec3 sky = mix(low * mix(1.0, dim, 0.5), high * dim, sqrt(up)) * (0.93 + 0.14 * cloud + 0.06 * (sqGrain - 0.5));
    col = mix(col, sky, k * max(smoothstep(0.20, 0.03, far), smoothstep(0.012, 0.0, far)));
  }
  return col;
}
