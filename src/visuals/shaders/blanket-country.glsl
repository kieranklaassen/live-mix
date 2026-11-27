// name: Blanket country
// a: Under the lamp
// b: Moonlit pillows
// what: A country seen from a pillow under one warm lamp: a checked fold at the left, hills of felted wool in moss, rust and oatmeal stitched along their hems, a blue satin ribbon winding between, a small wooden house with lit windows; or white pillows as snow peaks in moonlight, a dark crease for a road, a toy boat high up.
// follows: The piece dyes the cloth where it lies. Drones lift the hills in a deep breath; pads warm the lamp or moon; textures raise the nap and creases; a phrase is a foot moving under the cloth. Bands swell sixteen creases. A hit pats, a cue draws up a blanket edge. The loop runs a gleam down the satin or road. Keys light stitches, voice the windows or lantern.
// own: 0 night with only the windows lit (a) or an amber night light (b) at -1, morning at 1; 1 a smooth low bed at -1, steep and heaped at 1; 2 undyed wool (a) or dark blue linen (b) at -1, blues and plums (a) or striped ticking (b) at 1; 3 eye low and close at -1, high or far at 1; 4 no house or boat at -1, a village at lamp-lighting or a lit fleet at 1; 5 no ribbon or road at -1, a wide water at 1
float bcRel, bcWide, bcPull, bcPat, bcDay, bcNight;
vec2 bcPatAt, bcFootAt; float bcFoot;
vec3 bcLight, bcFill, bcN = vec3(0.0, 1.0, 0.0);
float bcBlob(vec2 d) { float a = max(1.0 - 0.25 * dot(d, d), 0.0); return a * a; }
#define BC_UP(T, E) T bcUp(E a, E b, T x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
BC_UP(float, float)
BC_UP(vec2, float)
BC_UP(vec3, vec3)
BC_UP(vec4, float)
float bcOn(float d, float px) { return bcUp(px, -px, d); }
// A slow wave.
float bcS(float x) { x = abs(fract(x * 0.159155) - 0.5) * 2.0; return 2.0 * x * x * (3.0 - 2.0 * x) - 1.0; }
float bcRidge(vec2 q) { float n = 1.0 - abs(2.0 * noise(q) - 1.0); return n * n; }
// The dye of the piece at a place.
vec3 bcDye(vec2 uv) {
  vec4 pc = piece(uv);
  vec3 kc = pc.rgb / max(pc.a, 0.02); kc = kc * kc + 0.03 + 0.17 * uVar;
  return mix(vec3(1.0), kc / dot(kc, vec3(0.3, 0.55, 0.15)), (0.33 + 0.6 * uEnergy) * sat(pc.a * 1.3));
}
vec3 bcDyeAt(vec2 q) { return bcDye(vec2(0.5 + 0.42 * q.x / (0.6 + 0.45 * q.y), 1.125 - q.y * 0.125)); }
// The gleam down the satin and the road.
float bcGleam(float z) { z = (z - 1.0 - 7.0 * uLoop) * 1.6; return exp(-z * z) * sin(PI * uLoop); }
// Sixteen creases that fan out over the bed, each as high as its band is loud.
float bcFan(vec2 q, float n) {
  float k = (q.x / (0.8 + 0.38 * q.y) + 1.0) * 8.0;
  return (0.01 + 0.06 * band((k - 0.5) / 15.0)) * bcUp(0.5, 0.0, abs(fract(k + 1.5 * n) - 0.5)) * bcUp(0.2, 0.7, n);
}
// Blanket stitch, s in from an edge. Below 0 is yarn.
float bcStitch(float s, float along) { return min(max(abs(fract(along) - 0.5) / 5.6 - 0.016, s - 0.19), abs(s - 0.03) - 0.018); }
float bcBone(vec2 q) { return bcS((q.y * 14.0 + abs(fract(q.x * 3.3) - 0.5) * 4.2) * 7.5); }
const float bcWall = 10.6;
vec3 bcEye, bcLamp;
// Where the satin ribbon runs.
float bcPath(float z) { return 0.12 + (0.62 + 0.05 * z) * bcS(z * 1.22 - 2.42); }
// The near edges of the four farther cloths.
vec4 bcHems(float x) {
  float s = bcS(x * 0.83 - 1.0), s2 = bcS(x * 1.9 - 2.0);
  return vec4(2.55 + 0.34 * s + 0.1 * s2 - bcPull, 4.05 - 0.42 * s + 0.16 * s2, 5.95 + 0.4 * s2 - 0.2 * s, 8.25 + 0.1 * s);
}
// The edge of the big near fold.
float bcFoldEdge(float z) { return -0.42 - 0.2 * (z - 1.6) + 0.1 * bcS(z * 2.6 - 1.6); }
float bcH(vec2 q) {
  float w = bcS(q.x * 0.9 - 1.5), off = abs(q.x - bcPath(q.y)), in_ = bcFoldEdge(q.y) - q.x;
  vec3 a = vec3(q.y - 3.35 - 0.35 * w, q.y - 4.95 + 0.3 * q.x, q.y - 6.9 - 0.3 * w) * vec3(1.5, 1.3, 1.3);
  a = max(1.0 - 0.25 * a * a, 0.0);
  vec3 side = bcUp(vec3(-0.4, -0.6, -0.5), vec3(1.9, -2.2, -3.0), q.xxx);
  float h = dot(a * a, vec3(0.14 + 0.46 * side.x + 0.3 * side.y, 0.85 * side.z, 0.55 - 0.3 * w));
  h += 0.95 * bcBlob((q - vec2(1.35, 5.15)) * vec2(1.2, 1.5)) + 0.05 * bcS(q.x * 2.3 + q.y * 1.3 + 2.0 * w);
  h *= mix(0.1, 1.0, bcUp(0.1, 0.85 + 0.5 * bcWide, off));
  h = bcRel * (h + 0.95 * bcUp(0.0, 0.95, in_) * bcUp(3.5, 1.7, q.y));
  float roll = (q.y - 8.95) * 1.5; roll *= roll; // the sheet turned down at the far end
  return h + 0.62 * max(1.0 - roll * roll * 0.25, 0.0) + bcFoot * bcBlob((q - bcFootAt) * 1.7);
}
// What lies on it: hems, the satin, creases, a pat.
float bcThick(vec2 q) {
  vec4 hem = bcUp(0.0, 0.06, q.y - bcHems(q.x));
  float n = noise(q * vec2(1.9, 2.6) + 11.0), off = bcWide * 0.17 - abs(q.x - bcPath(q.y));
  return 0.06 * dot(hem, vec4(1.0)) * bcUp(0.03, 0.0, off) + 0.06 * bcUp(-0.02, 0.03, bcFoldEdge(q.y) - q.x) * bcUp(3.6, 2.9, q.y)
    + 0.08 * n + 1.55 * bcFan(q, n) + 0.035 * bcUp(0.0, 0.05, off)
    - bcPat * bcBlob((q - bcPatAt) * 3.4);
}
// Cuts a body by a plane: a ray comes in at t0, at the face bcN, and goes out at t1.
void bcCut(vec3 o, vec3 d, vec3 n, float at, inout float t0, inout float t1) {
  float den = dot(d, n), dist = at - dot(o, n);
  float t = dist / (abs(den) < 1e-5 ? 1e-5 : den);
  if (den < 0.0) { if (t > t0) { t0 = t; bcN = n; } } else t1 = min(t1, t);
}
void bcPair(vec3 o, vec3 d, vec3 n, float at, inout float t0, inout float t1) { bcCut(o, d, n, at, t0, t1); bcCut(o, d, -n, at, t0, t1); }
float bcFall(float d2) { return 1.0 / (0.3 + 0.055 * d2); }
// A little wooden house. Returns how far off it is.
float bcHouse(vec2 at2, float size, float turn, vec3 rd, float far, float window, inout vec3 col) {
  vec3 o = bcEye - vec3(at2.x, bcH(at2) - 0.1 * size, at2.y), d = rd;
  bool near = length(o.xy - d.xy * o.z - vec2(0.0, 0.5 * size)) < 0.9 * size;
  vec3 l = normalize(bcLamp - vec3(at2.x, 1.2, at2.y));
  o /= size; d /= size;
  o.xz = rot(turn) * o.xz; d.xz = rot(turn) * d.xz; l.xz = rot(turn) * l.xz;
  float best = far;
  for (int k = 0; k < 4 && near; k++) {
    float t0 = 0.0, t1 = 1e3, side = k == 1 ? 1.0 : -1.0;
    vec3 r = vec3(0.7071 * side, 0.7071, 0.0), r2 = vec3(-r.x, r.y, 0.0);
    bool roof = k == 1 || k == 2;
    vec3 oo = o - (k == 3 ? vec3(0.17, 0.72, 0.18) : vec3(0.0, 0.3, 0.0));
    if (roof) { // a board of the roof
      bcCut(oo, d, r, 0.4, t0, t1); bcCut(oo, d, -r, -0.33, t0, t1); bcCut(oo, d, r2, 0.4, t0, t1);
      bcCut(oo, d, vec3(r.x, -r.y, 0.0), 0.25, t0, t1);
    } else { bcPair(oo, d, vec3(1, 0, 0), k == 3 ? 0.06 : 0.34, t0, t1); bcPair(oo, d, vec3(0, 1, 0), k == 3 ? 0.3 : 0.5, t0, t1); }
    bcPair(oo, d, vec3(0, 0, 1), k == 3 ? 0.06 : roof ? 0.47 : 0.4, t0, t1);
    if (k == 0) { bcCut(oo, d, r, 0.34, t0, t1); bcCut(oo, d, r2, 0.34, t0, t1); }
    if (near && t0 < t1 && t0 > 0.0 && t0 < best) {
      best = t0;
      vec3 at = oo + d * t0, n = bcN, alb = k == 0 ? vec3(0.66, 0.46, 0.27) : roof ? vec3(0.36, 0.09, 0.05) * (0.8 + 0.3 * step(0.5, fract(at.y * 11.0))) : vec3(0.3, 0.14, 0.08);
      col = alb * (bcLight * 0.8 * sat(0.14 + 0.86 * dot(n, l)) + bcFill * (2.0 + n.y));
      if (k == 0) {
        vec2 w = abs(n.z) > 0.5 ? vec2(at.x, at.y + 0.02) : vec2(at.z, at.y + 0.06);
        float px = t0 / (size * uRes.y), pane = bcOn(max(abs(w.x) - 0.13, abs(w.y) - 0.14), px);
        vec2 bar = bcUp(-px, px, abs(w) - 0.012);
        col = mix(col, vec3(1.0, 0.5, 0.12) * window, pane * mix(0.3, 1.0, bar.x * bar.y));
      }
    }
  }
  return best;
}
// The wall and the headboard, at w across and up.
vec3 bcRoom(vec2 w, float lit, vec3 wall, float pw) {
  wall = mix(wall, vec3(0.56, 0.52, 0.45), bcDay) * (0.94 + 0.06 * bcUp(-0.2, 0.2, bcS(w.x * 7.0)));
  vec3 col = wall * (bcLight * lit * 0.5 + bcFill);
  float top = 1.75 + 0.45 * exp(-w.x * w.x * 0.12), ax = abs(w.x) - 4.15;
  float board = bcOn(max(w.y - top, abs(w.x) - 4.0), pw);
  float post = bcOn(min(max(abs(ax) - 0.17, w.y - 2.3), length(vec2(ax, w.y - 2.5)) - 0.27), pw);
  vec3 wood = vec3(0.13, 0.07, 0.035) * (0.75 + 0.5 * noise(vec2(w.x * 1.2, w.y * 14.0)));
  col = mix(col, wood * (bcLight * lit * 0.6 + bcFill) + wood * bcLight * lit * 2.0 * bcUp(0.07, 0.0, abs(w.y - top + 0.06)), board);
  return mix(col, wood * (bcLight * (lit * 0.4 + 0.5 * sat(0.3 + ax * (2.5 - 6.5 * uVar))) + bcFill), post);
}
vec3 bcCountry(vec2 p) {
  float px = 1.0 / (1.12 * uRes.y), high = uOwn[3], more = sat(uOwn[4]), one = 1.0 + min(uOwn[4], 0.0);
  bcEye = vec3(0.3 * sin(uTravel * 0.021) + 0.1 * sin(uTime * 0.03), 0.95 + (high > 0.0 ? 1.7 : 0.3) * high + 0.05 * uSpace, 0.0);
  vec3 rd = vec3(p.x / 1.12, (p.y - 0.16 - 0.16 * high) / 1.12, 1.0);
  bcLight = mix(vec3(1.0, 0.64, 0.24 + 0.2 * uTone) * (2.9 + 1.2 * uPad) * (1.0 - 0.9 * bcNight) * (1.0 - 0.4 * more), vec3(0.95, 0.92, 0.9) * 2.6, bcDay);
  bcFill = mix(mix(vec3(0.026, 0.03, 0.05), vec3(0.028, 0.04, 0.085), bcNight), vec3(0.14, 0.16, 0.2), bcDay);
  bcLamp = vec3(5.0, 2.5, 6.0) + vec3(0.5, 2.0, -1.5) * bcDay;
  // long strides down to the cloth, then closer
  float t = 0.8, st = 0.0, was = 1.0, lo = 0.8, hi = -1.0, above = 1.0, under = 0.0, halo = 0.0, haloT = 0.0, falling = 0.0;
  float topH = 1.4 * bcRel + 0.06;
  if (bcEye.y > topH && rd.y < 0.0) t = max(t, (topH - bcEye.y) / rd.y);
  int closer = 0;
  for (int i = 0; i < 30; i++) {
    if (uVar > 0.5 || t > bcWall || closer > 3 || (bcEye.y + rd.y * t > topH && rd.y > 0.0)) break;
    float at = hi < 0.0 ? t : mix(lo, hi, clamp(above / max(above - under, 1e-5), 0.1, 0.9));
    float d = bcEye.y + rd.y * at - bcH(bcEye.xz + rd.xz * at);
    if (d < 0.0 || hi > 0.0) closer++;
    if (d < 0.0) { hi = at; under = d; } else { lo = at; above = d; }
    if (hi < 0.0) {
      float near = 1.0 - was / (0.012 + 0.006 * t);
      if (d > was && falling > 0.5 && near > halo) { halo = near; haloT = t - st; } // the nap of a crest
      falling = d < was ? 1.0 : 0.0;
      was = d;
      st = max(d * 0.85, (0.012 + 0.0024 * float(i)) * t);
      t += st;
    }
  }
  t = hi > 0.0 ? hi : bcWall;
  vec3 col, seen = bcEye + rd * t;
  if (t >= bcWall) {
    vec3 l = bcLamp - seen;
    col = bcRoom(seen.xy, 0.9 * bcFall(dot(l, l)) * (0.6 + 0.9 * bcUp(-0.3, 0.4, l.y - 0.06 * length(l.xz))), vec3(0.2, 0.17, 0.12), px * bcWall);
  } else {
    vec2 q = seen.xz;
    float e = 0.004 * t, pr[3];
    for (int k = 0; k < 3; k++) { vec2 g = q + e * vec2(k == 1, k == 2); pr[k] = bcH(g) + bcThick(g); }
    vec3 n = normalize(vec3(pr[0] - pr[1], e, pr[0] - pr[2]));
    float fade = 1.0 / (1.0 + 0.05 * t * t), pw = t * px;
    vec4 hem = bcHems(q.x), ds = q.y - hem + 0.02;
    vec3 alb = vec3(0.5, 0.4, 0.27), thread = vec3(0.3, 0.06, 0.03);
    float nap = 1.0, s = 1e3, along = q.x * 5.6, weave = 1.0, check = 0.0, front = 9.0;
    if (ds.x > 0.0) { alb = vec3(0.13, 0.15, 0.05); thread = vec3(0.72, 0.6, 0.4); weave = 0.0; s = ds.x; } else front = -ds.x;
    if (ds.y > 0.0) { alb = vec3(0.38, 0.115, 0.05); thread = vec3(0.75, 0.62, 0.42); s = ds.y; } else front = min(front, -ds.y);
    if (ds.z > 0.0) { alb = vec3(0.46, 0.38, 0.27); thread = vec3(0.13, 0.15, 0.06); s = ds.z; check = 0.7; } else front = min(front, -ds.z);
    if (ds.w > 0.0) { alb = vec3(0.78, 0.75, 0.68); thread = vec3(0.6); nap = 0.25; s = ds.w; check = 0.0; }
    float in_ = q.y < 3.5 ? bcFoldEdge(q.y) - q.x : -9.0;
    if (in_ > 0.0) { alb = vec3(0.045, 0.085, 0.07); thread = vec3(0.78, 0.6, 0.36); s = in_ + 0.02; along = q.y * 5.6; weave = 0.6; front = 9.0; check = 1.0; }
    else front = min(front, -in_);
    vec2 lines = abs(fract(vec2(q.x - 0.8 * seen.y, q.y) * 1.7 + 0.2) - 0.5) / 1.7;
    lines = bcUp(0.022 + pw, 0.022 - pw, abs(lines - 0.06));
    alb = mix(alb, thread * vec3(0.6, 0.6 - 0.4 * lines.y, 0.6 - 0.45 * lines.y), check * 0.35 * (lines.x + lines.y));
    float grey = dot(alb, vec3(0.3, 0.6, 0.1));
    alb = mix(alb, vec3(0.62, 0.55, 0.44) * (0.5 + 0.8 * grey), sat(-uOwn[2]));
    alb = mix(alb, mix(mix(alb.bgr, alb.gbr, 0.35), vec3(grey), 0.3) + 0.03 * vec3(1.0, 0.4, 1.4), sat(uOwn[2]));
    alb *= 1.0 - 0.55 * bcUp(0.09, 0.0, front); // the shadow in front of the next hem
    float off = abs(q.x - bcPath(q.y)) - bcWide * 0.17, satin = bcOn(off, pw) * sat(bcWide * 9.0);
    float hair = noise(q * vec2(90.0, 60.0)), clump = noise(q * 9.0);
    float stitch = bcStitch(s, along + 0.2 * clump), yarn = bcUp(pw, -pw - 0.01, stitch) * (1.0 - satin);
    nap *= 1.0 - satin; weave *= (1.0 - satin) * (1.0 - yarn);
    alb = mix(alb, thread, yarn) * (1.0 - 0.4 * bcUp(0.03, 0.0, stitch) * (1.0 - yarn));
    alb = mix(alb, vec3(0.06, 0.12, 0.3), satin) * mix(vec3(1.0), bcDyeAt(q), 1.0 - 0.6 * yarn);
    alb *= 1.0 + weave * 0.3 * bcBone(q) * bcUp(0.02, 0.006, pw);
    n = normalize(n + nap * fade * vec3(hair - 0.5, 0.0, clump - 0.5) * (0.5 + 0.5 * uTexture));
    alb *= 1.0 + nap * ((hair - 0.5) * 0.6 * fade + 0.15 * (clump - 0.5));
    vec3 l = bcLamp - seen;
    float ld = length(l), sh = 1.0; l /= ld;
    for (int k = 1; k < 4; k++) {
      float a = 0.16 * float(k * k);
      vec3 at = seen + n * 0.04 + l * a;
      sh = min(sh, bcUp(-0.12 * a - 0.01, 0.1 * a + 0.02, at.y - bcH(at.xz)));
    }
    vec3 v = -normalize(rd), up = bcLight * bcFall(ld * ld);
    col = alb * (up * sat((dot(n, l) + 0.2) / 1.2) * sh + bcFill * (0.65 + 0.5 * n.y));
    float rim = 1.0 - sat(dot(n, v)); rim *= rim * rim;
    col += alb * up * rim * nap * (0.3 + 0.7 * sh) * (0.4 + 0.8 * uTexture) * (0.5 + hair);
    if (satin > 0.0) {
      float g = sat(dot(n, normalize(l + v)));
      col += satin * vec3(0.5, 0.65, 1.0) * up * (0.2 + 0.8 * sh) * (0.25 * pow(g, 12.0) + 0.9 * pow(g, 60.0) + 0.5 * bcGleam(q.y));
    }
    col += yarn * thread * vec3(1.0, 0.6, 0.25) * (0.8 * uKeys + 0.7 * uCue);
    col += alb * vec3(1.0, 0.5, 0.15) * (0.5 + bcNight) * bcBlob((q - vec2(1.2, 4.6)) * 2.5);
  }
  float there = t, window = 1.5 + 0.6 * uMic + bcNight + more;
  const vec4 homes[4] = vec4[4](vec4(1.35, 5.1, 0.46, 0.55), vec4(-1.75, 5.5, 0.42, -0.4), vec4(0.62, 3.1, 0.3, 0.9), vec4(1.85, 3.5, 0.32, 0.3));
  for (int k = 0; k < 4; k++) {
    if (uVar > 0.5 || (k > 0 && more <= 0.0)) break;
    there = bcHouse(homes[k].xy, homes[k].z * max(k == 0 ? one : more, 0.01), homes[k].w, rd, there, window, col);
  }
  vec2 lamp = p - vec2(0.29 - 0.22 * bcEye.x, 0.2 + 0.16 * high + (0.95 * bcRel - bcEye.y) * 0.22);
  col += vec3(1.0, 0.5, 0.15) * (0.05 + 0.1 * bcNight + 0.1 * uMic + 0.1 * more) * one * exp(-dot(lamp, lamp) * 120.0);
  if (halo > 0.0 && haloT < there) {
    vec3 at = bcEye + rd * haloT, l = bcLamp - at;
    float hair = 0.3 + noise(at.xz * 60.0);
    col = mix(col, vec3(0.4, 0.25, 0.14) * (bcLight * bcFall(dot(l, l)) + bcFill), sat(halo * hair * 0.7));
  }
  return col;
}

vec3 bcMoon;
// The moon through the panes.
float bcPanes(vec2 w) {
  vec2 f = abs(fract(w) - 0.5);
  return mix(0.16 + 0.84 * bcUp(0.475, 0.445, f.x) * bcUp(0.475, 0.445, f.y), 1.0, max(bcNight, 0.7 * bcDay));
}
// The threads of the cotton.
float bcWeft(vec2 q) { return 0.86 + 0.14 * noise(q * vec2(340.0, 70.0)) + 0.14 * noise(q * vec2(70.0, 340.0) + 9.0); }
vec3 bcCotton(vec3 alb, vec2 at) { // plain, dark linen, or ticking
  float line = bcUp(0.2, 0.34, abs(fract(at.x * 5.0) - 0.5));
  alb = mix(alb, alb * vec3(0.16, 0.18, 0.26), sat(-uOwn[2]));
  return alb * mix(vec3(1.0), mix(vec3(0.95, 0.9, 0.8), vec3(0.2, 0.3, 0.5), line), sat(uOwn[2]));
}
// A pillow's roundness at u, and how far in from its edge.
float bcPuff(vec2 u, out float in_) {
  vec2 a = abs(u) * (1.17 - 0.17 * min(u * u, 1.0).yx);
  in_ = 1.0 - max(a.x, a.y);
  a = min(a * 1.12, 1.0);
  a = 1.0 - a * a * a;
  return a.x * a.y * (1.9 - 0.9 * a.x * a.y);
}
// Creases from the corners.
float bcCreased(vec2 u, float seed) {
  vec2 c = 1.04 - min(abs(u), 1.0); float r = length(c);
  return bcRidge(vec2(7.0 * c.x / (c.x + c.y) + seed + 5.0 * step(0.0, u.x) + 9.0 * step(0.0, u.y), r * 1.6)) * max(1.0 - 0.9 * r, 0.0) * bcUp(0.0, 0.2, min(abs(u.x), abs(u.y)));
}
// One pillow (at: its middle and half sizes), behind what is there (left is what still shows).
void bcPillow(vec2 p, vec4 at, vec4 how, float seed, inout vec3 col, inout float left, inout float shade) {
  at.w *= bcRel;
  mat2 m = rot(how.x);
  vec2 d = p - at.xy, u = (m * d) / at.zw;
  float in_, z = bcPuff(u, in_), e = 0.005, deep = 0.22 + 0.12 * uTexture, tall = how.y * (0.08 + 0.02 * bcRel), pr[3], no;
  float cover = bcUp(-0.6, 0.9, in_ * min(at.z, at.w) * uRes.y);
  for (int k = 0; k < 3; k++) {
    vec2 g = u + (m * vec2(k == 1, k == 2)) * e / at.zw;
    pr[k] = bcPuff(g, no) + deep * bcCreased(g, seed);
  }
  vec3 n = normalize(vec3((pr[0] - pr[1]) * tall / e, (pr[0] - pr[2]) * tall / e, 1.0));
  float run = abs(u.x) > abs(u.y) ? u.y * at.w : u.x * at.z;
  float stitch = bcUp(0.014, 0.004, abs(in_ - 0.075)) * bcUp(0.1, 0.2, abs(fract(run * 60.0) - 0.5));
  vec3 alb = bcCotton(vec3(0.8) - fract(seed * 0.618) * vec3(0.12, 0.09, 0.02), u * vec2(at.z / at.w, 1.0)) * bcDye(vec2(0.5 + 0.52 * p.x, how.z));
  alb *= bcWeft(u * at.zw) * (1.0 - 0.35 * bcUp(0.03, 0.0, abs(in_ - 0.11)));
  float sh = shade * bcPanes(vec2(p.x * 2.6 + 0.9 * z * tall + p.y * 0.8 + 0.15, p.y * 3.0 - p.x * 0.5 + z * 0.3 + 0.1));
  vec3 c = alb * (bcLight * sat(dot(n, bcMoon) * 0.8 + 0.2) * sh + (bcFill * (0.8 + 0.5 * n.y) + bcLight * 0.09 * sat(-n.y)) * (0.5 + 0.5 * sat(in_ * 6.0 + 0.4)));
  c += stitch * vec3(0.5, 0.45, 0.4) * (0.25 * bcLight * sh + vec3(1.0, 0.75, 0.45) * uKeys);
  col += left * cover * c; left *= 1.0 - cover;
  // its shadow on what is behind
  bcPuff((m * (d - vec2(0.06, -0.05))) / at.zw, no);
  shade *= 1.0 - 0.85 * bcUp(-0.25, 0.15, no);
}
// The toy boat: its colour, and how much it covers.
vec4 bcBoat(vec2 b, float px) {
  float x = b.x, y = (b.y - 0.36) / 0.85;
  float sail = min(max(max(x + 0.02, -y), -x - 0.38 * (1.0 - y)), max(max(0.07 - x, -y), x - 0.07 - 0.3 * (0.85 - y)));
  float m = bcOn(max(abs(x - 0.025) - 0.016, max(0.2 - b.y, b.y - 1.28)), px), s = bcOn(sail, px);
  float hull = bcOn(max(max(b.y - 0.24 - 0.3 * x * x, -b.y), max(-x - 0.34 - 0.25 * b.y, x - 0.28 - 0.75 * b.y)), px);
  vec3 alb = mix(vec3(0.85, 0.8, 0.7), vec3(0.3, 0.19, 0.11), m);
  alb = mix(alb, mix(vec3(0.6, 0.07, 0.04), vec3(0.75, 0.7, 0.6), bcOn(0.17 - b.y, px)) * (1.0 - bcUp(-0.4, 0.5, x)), hull);
  return vec4(alb * (bcLight * (0.75 - 0.5 * bcUp(0.0, 0.06, x)) + bcFill), max(hull, max(m, s)) * step(length(b), 1.5));
}
// The creased sheet; off is how far off the road is.
float bcSheet(vec2 q, out float off) {
  float n = noise(q * vec2(1.6, 1.1) + 11.0);
  off = abs(q.x - 0.12 - 0.4 * bcS(q.y * 1.3 - 2.6) - 0.12 * bcS(q.y * 3.1));
  return 0.16 * n + 0.04 * bcRidge(q * vec2(2.2, 1.6) + 2.0 * n) + 0.03 * bcS(q.x * 1.6 - q.y * 2.6 + 5.0 * n) + 0.6 * bcFan(q, n)
    - 0.1 * sat(4.0 * bcWide) * bcUp(0.1 + 0.13 * bcWide * bcWide, 0.02, off) + bcFoot * bcBlob((q - bcFootAt) * 2.0);
}
vec3 bcPeaks(vec2 p) {
  float high = uOwn[3], sway = 0.05 * sin(uTravel * 0.021) + 0.02 * sin(uTime * 0.03), px = 1.0 / uRes.y;
  bcLight = mix(mix(vec3(0.68, 0.79, 0.9 + 0.2 * uTone) * (2.0 + 0.7 * uPad), vec3(1.0, 0.52, 0.22) * 1.4, bcNight), vec3(1.0, 0.8, 0.72) * 1.2, bcDay);
  bcFill = mix(mix(vec3(0.02, 0.034, 0.08), vec3(0.03, 0.022, 0.035), bcNight), vec3(0.2, 0.2, 0.28), bcDay);
  bcMoon = normalize(vec3(-0.8, 0.45 - 0.4 * bcNight, 0.4));
  vec3 col = vec3(0.0); float left = 1.0, shade = 1.0;
  vec2 s = p * (1.0 + (high > 0.0 ? 0.35 : 0.22) * high) - vec2(0.0, 0.04 * high);
  // the wool blanket
  float z = 0.95 / max(0.16 - s.y, 0.01) * 1.12;
  vec2 q = vec2(s.x * z / 1.12 - 2.0 * sway, z);
  float edge = 1.86 + 0.22 * q.x + 0.06 * bcS(q.x * 3.0) + 1.1 * bcPull - q.y, pw = z * px;
  {
    float st = bcStitch(edge + 0.02, q.x * 5.6), yarn = bcUp(pw, -pw - 0.01, st), wool = bcUp(-0.02, -0.02 + pw, edge) * step(s.y, 0.0);
    vec3 c = mix(vec3(0.13, 0.045, 0.055) * (1.0 + 0.2 * bcBone(q)), vec3(0.6, 0.58, 0.52), yarn);
    c *= bcDye(vec2(0.5 + 0.5 * p.x, 0.95)) * (1.0 - 0.5 * bcUp(0.03, 0.0, st) * (1.0 - yarn));
    c *= bcLight * 0.7 * bcUp(-0.02, 0.06, edge + 0.04) + bcFill * 2.0;
    col += wool * (c + yarn * vec3(0.5, 0.4, 0.3) * (0.5 * uKeys + 1.2 * uCue));
    left -= wool;
  }
  const vec4 ats[6] = vec4[6](vec4(-0.84, -0.2, 0.36, 0.22), vec4(0.64, -0.03, 0.38, 0.19), vec4(-0.47, 0.06, 0.34, 0.2),
    vec4(0.18, 0.1, 0.29, 0.15), vec4(-0.2, 0.14, 0.2, 0.2), vec4(0.5, 0.16, 0.26, 0.17));
  const vec4 how[6] = vec4[6](vec4(-0.3, 1.4, 0.8, -1.6), vec4(0.1, 1.3, 0.6, -0.8), vec4(-0.14, 1.2, 0.45, -0.3),
    vec4(0.07, 1.0, 0.3, 0.4), vec4(0.72, 1.0, 0.2, 0.4), vec4(-0.35, 1.0, 0.15, 0.4));
  vec3 front = col; float keep = left, more = sat(uOwn[4]);
  for (int i = 0; i < 6; i++) {
    if (uVar < 0.5 || left < 0.003) break;
    bcPillow(s - vec2(how[i].w * sway, 0.0), ats[i], how[i], float(i + 1), col, left, shade);
    if (i < 3) { front = col; keep = left; }
  }
  {
    float e = 0.004 * z, off, no, pr[3];
    for (int k = 0; k < 3; k++) pr[2 - k] = bcSheet(q + e * vec2(k == 1, k == 0), off);
    vec3 n = normalize(vec3(pr[0] - pr[1], e * (1.0 + 0.05 * z * z), pr[0] - pr[2]));
    float road = bcUp(0.05 + pw, -pw, off - 0.12 * bcWide * bcWide) * sat(4.0 * bcWide), here = left * bcUp(0.041, 0.039, s.y);
    vec3 alb = bcCotton(vec3(0.76, 0.78, 0.8), q) * bcDyeAt(q) * bcWeft(q * 0.4);
    alb = mix(alb, vec3(0.1, 0.14, 0.22), road) * (1.0 - 0.5 * bcUp(0.14, 0.0, -edge));
    float sh = shade * bcPanes(vec2(q.x * 0.5 + 0.2 * q.y + 0.1 + pr[0], q.y * 0.45 - 0.2 * q.x + pr[0]));
    vec3 l = vec3(-0.8, 0.5, 0.15), c = alb * (bcLight * sat(dot(n, l) * 0.95 + 0.17) * sh + bcFill * (0.5 + 0.5 * n.y) * (0.4 + 0.6 * shade));
    float g = sat(dot(n, normalize(l - vec3(p.x, p.y - 0.16, 1.0))));
    c += road * vec3(0.6, 0.75, 1.0) * bcLight * (0.6 * pow(g, 8.0) + 0.4 * bcGleam(z)) * (0.3 + 0.7 * shade);
    col += here * c / (1.0 + 0.02 * z * z); left -= here;
  }
  {
    // the window on the wall
    vec2 w = vec2(s.x - 0.5 * sway, s.y - 0.16) * bcWall / 1.12 + vec2(0.0, 0.95);
    vec2 f = vec2(w.x - 5.0, w.y - 4.0 + 0.22 * w.x) * 0.42, g = abs(fract(f) - 0.5);
    float lit = 0.03 + 0.4 * bcUp(0.47, 0.42, g.x) * bcUp(0.47, 0.42, g.y) * step(max(abs(f.x), abs(f.y)), 1.0) * (1.0 - bcNight);
    col += left * bcRoom(w, lit, vec3(0.2, 0.24, 0.3), px * bcWall);
  }
  // the boat and its fleet
  const vec3 spots[3] = vec3[3](vec3(0.07, 0.112, 0.1), vec3(0.2, 0.116, 0.075), vec3(0.32, 0.127, 0.115));
  for (int i = 0; i < 3; i++) {
    if (uVar < 0.5 || (i > 0 && more <= 0.0)) break;
    float big = i == 0 ? 1.0 + min(uOwn[4], 0.0) : more, size = spots[i].z * max(big, 0.01);
    vec2 at = s - vec2(spots[i].x + 0.4 * sway, 0.11 + spots[i].y * bcRel), lamp = at - spots[i].z * vec2(0.08, 0.3);
    vec4 b = bcBoat(rot(0.15 - 0.1 * float(i) + 0.03 * sin(uTime * 0.4 + float(i))) * at / size, px / size);
    col = mix(col, front + keep * b.rgb, b.w);
    float r2 = dot(lamp, lamp); // its lantern
    col += vec3(1.0, 0.55, 0.2) * big * (0.5 + uMic) * (1.6 * bcUp(0.006, 0.003, sqrt(r2)) + 0.16 * exp(-r2 * 300.0) + 0.15 * more * exp(-r2 * 16.0));
  }
  return col;
}
vec3 render(vec2 p) {
  bool snow = uVar > 0.5;
  if (!snow) p.x += 0.1 * (1.0 - bcUp(0.6, 1.2, uRes.x / uRes.y));
  bcDay = sat(uOwn[0]); bcNight = sat(-uOwn[0]);
  // the breath, and how rumpled the bed is
  bcRel = (1.0 + (snow ? 0.22 : 0.4) * uOwn[1]) * (1.0 + (snow ? 0.02 : 0.035) * sin(uTime * TAU / 20.0) + (snow ? 0.1 : 0.16) * uDrone);
  bcWide = 1.0 + (uOwn[5] < 0.0 ? 1.0 : 1.5) * uOwn[5];
  bcPull = 1.4 * uCue * (1.0 - uCue); bcPat = 0.6 * uHits * (1.0 - uHits);
  vec2 roam = vec2(sin(uTime * 0.11), cos(uTime * 0.09));
  bcPatAt = vec2(0.75, 2.45) + 0.3 * roam;
  vec2 k = p - (snow ? vec2(0.5, 0.0) + 0.08 * roam : vec2(0.0, 0.16) + 1.12 * vec2(bcPatAt.x, -0.95) / bcPatAt.y);
  float walk = fract(uTime / 34.0);
  bcFootAt = vec2(-2.4 + 4.8 * walk, (snow ? 2.6 : 4.4) + 0.7 * sin(walk * 9.0));
  bcFoot = (0.04 + 0.32 * uPhrase) * bcUp(0.0, 0.15, walk) * bcUp(1.0, 0.85, walk);
  return screenOf((1.6 + 1.6 * uHits * exp(-dot(k, k) * 60.0)) * (snow ? bcPeaks(p) : bcCountry(p)));
}
