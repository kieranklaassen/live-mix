// name: Below the line
// a: Split view
// b: From beneath
// what: A still waterline near the top: over it a pale sky and one small white peak, under it the great body of the ice, white at the shoulders, hollowed and fluted, fading into grey-green water; or we look up from below at a bright rippled ceiling of water with the ice as one huge dark shape in it, its thin edges lit turquoise.
// follows: The drone is how far down the ice reaches, pad and voice its inner glow; texture lets fine bubbles go, phrase draws light along the flutes, which the bands carve; the piece tints the ice where it lies, loudness clears the water. A hit runs down two cracks with a puff of bubbles; a cue rolls a swell of light. The loop swings the sun; keys release bubbles.
// own: 0 the form: 1 tall narrow spires, -1 a broad flat slab; 1 how many: 1 a whole row, -1 one alone, far smaller; 2 the eye: 1 the line low under much sky and a tall peak (b: along under the water), -1 the line at the very top (b: straight up); 3 the stuff: 1 dark layered rock, -1 clear coloured glass; 4 the water: 1 pale and milky in the drone's colour, -1 night with a low moon and an inner glow; 5 the surface: 1 a heavy swell, -1 frozen over with snow; 6 1 rounded smooth, -1 broken into stacked plates; 7 1 long threads hang from it, -1 shafts of light
float blUp(float x) { return max(x, 0.0); }
float blDn(float x) { return max(-x, 0.0); }
// The faces one lump of ice is cut by: which way each looks and how far out it is. Most look outward and a little down.
const vec4 blP[12] = vec4[12](
  vec4(0.95, -0.30, 0.20, 0.92), vec4(0.45, -0.42, 0.80, 0.80), vec4(-0.25, -0.22, 0.95, 0.84), vec4(-0.85, -0.35, 0.42, 0.88),
  vec4(-0.80, -0.50, -0.40, 0.90), vec4(0.10, -0.40, -0.90, 0.90), vec4(0.75, -0.30, -0.60, 0.95), vec4(0.55, 0.75, 0.35, 0.62),
  vec4(-0.45, 0.80, 0.40, 0.60), vec4(0.05, 0.80, -0.60, 0.70), vec4(0.10, -0.75, 0.65, 0.82), vec4(-0.55, 0.20, 0.82, 0.90));
// Nothing beyond blEnd counts; blLean above 1 makes a lump run more to a point.
float blT, blThick, blCover, blEnd, blLean = 1.0, blWide = 1.0, blSide = 1.0; vec3 blN;
void blClear(float end) { blT = 9.0; blThick = 0.0; blCover = 0.0; blN = vec3(0.0, 0.0, 1.0); blEnd = end; }
void blLump(vec3 ro, vec3 rd, vec3 c, vec3 r, float yaw, float px) {
  mat2 R = rot(yaw);
  r *= vec3(blWide, 1.0, blWide);
  vec3 o = ro - c, d = rd;
  o.xz = R * o.xz; d.xz = R * d.xz;
  o /= r; d /= r;
  float a = -9.0, b = blEnd; vec3 n = vec3(0.0, 0.0, 1.0);
  for (int i = 0; i < 12; i++) {
    vec4 f = blP[i]; f.y *= blLean;
    float q = dot(f.xyz, d), s = f.w - dot(f.xyz, o);
    if (abs(q) < 1e-4) q = 1e-4;
    float t = s / q;
    if (q < 0.0) { float h = sat(0.5 + 0.5 * (t - a) / 0.014); n = mix(n, f.xyz / r, h); a = mix(a, t, h) + 0.008 * h * (1.0 - h); }
    else b = min(b, t);
    if (a > b && uOwn[6] <= 0.0) return;
  }
  float in_ = b - a;
  if (uOwn[6] > 0.0) {
    float A = max(dot(d, d), 1e-4), B = dot(o, d), h = B * B - A * (dot(o, o) - 0.86), s = sqrt(max(h, 0.0)), k = uOwn[6], ta = (-B - s) / A;
    in_ = mix(in_, h < 0.0 ? h : min(2.0 * s / A, blEnd - ta), k);
    n = mix(n, (o + d * ta) / r, k); a = mix(a, ta, k);
  }
  if (in_ <= 0.0) return;
  n.xz = n.xz * R;
  n = normalize(n);
  float cover = smoothstep(0.0, px, in_), front = blT > 8.0 ? 1.0 : cover * sat(0.5 + (blT - a) * 28.0);
  blN = mix(blN, n, front); blT = mix(blT, a, front);
  blThick += in_; blCover = max(blCover, cover);
}
vec3 blHue(vec3 c) {
  if (uOwn[4] == 0.0) return c;
  float l = dot(c, vec3(0.3, 0.6, 0.1));
  vec3 k = uKind[0];
  return mix(c, uOwn[4] > 0.0 ? mix(k, mix(k, vec3(1.0, 0.985, 0.95), 0.85), smoothstep(0.12, 0.85, l)) : k * mix(k, vec3(1.0), 0.3) * (0.05 + 0.5 * l * l) + vec3(0.5, 0.53, 0.5) * smoothstep(0.78, 1.15, l), abs(uOwn[4]));
}
float blCell(inout vec2 q, float D) {
  q *= 1.0 + (uOwn[1] > 0.0 ? 1.3 : -1.7) * uOwn[1];
  D = mix(4.5, D, blUp(uOwn[1]));
  float id = floor(q.x / D + 0.5);
  if (uOwn[1] <= 0.0) id = 0.0;
  q.x -= id * D;
  return id;
}
vec3 blStuff(vec3 ice, vec3 behind, vec2 q, vec3 n, float lit, float veil) {
  if (uOwn[3] > 0.0) {
    float y = q.y * 26.0 + q.x * 5.0 + 3.0 * veil, l = noise(vec2(y, 1.5)), g = noise(q * 90.0);
    vec3 a = uKind[1] * uKind[1], b = uKind[2] * uKind[2];
    ice = mix(ice, sqrt(mix(a, b, smoothstep(0.35, 0.7, l)) * (0.75 + 0.5 * g)) * (0.1 + 1.0 * lit) * (0.75 + 0.5 * l), uOwn[3]);
  }
  if (uOwn[3] < 0.0) {
    vec3 k = uKind[1], t = exp(-blThick * 3.2 * (1.12 - k));
    float e = 1.0 - sat(abs(n.z)), s = sat(dot(n, vec3(-0.45, 0.75, 0.5)));
    ice = mix(ice, behind * t * 1.1 + k * (0.16 + 0.35 * uPad) * (0.4 + veil) + k * 0.3 * e * e + vec3(1.0, 0.98, 0.94) * (0.5 * s * s * s * s + 0.12 * lit), -uOwn[3]);
  }
  return ice * (1.0 - 0.6 * blDn(uOwn[4])) + blDn(uOwn[4]) * uKind[1] * (0.35 + 0.8 * uPad) * veil * veil;
}
float blThread(vec2 q, float px) {
  float s = 0.0, y = max(-q.y, 0.0);
  for (int k = 0; k < 2; k++) {
    float n = k == 0 ? 34.0 : 21.0, x = (q.x + y * 0.1 * sin(uTime * 0.23 + y * 5.0 + q.x * 3.0 + float(k) * 2.0)) * n, id = floor(x), h = hash11(id + 40.0 * float(k));
    float in_ = (1.0 - smoothstep(0.25, 0.5, abs(id / n))), len = (0.5 + 0.5 * h) * in_ + 0.1 * uPhrase + 0.02, d = abs(fract(x) - 0.2 - 0.6 * hash11(id + 7.0)) / n;
    s += in_ * (1.0 - smoothstep(0.0, 2.0 * px, d)) * (1.0 - smoothstep(0.4 * len, len, y)) * (0.4 + 0.6 * h);
    float b = fract(y * 6.0 * (0.5 + h) - uTime * 0.05 + h * 9.0) - 0.5;
    s += in_ * exp(-(d * d * 9e4 + b * b * 60.0)) * (1.0 - smoothstep(0.6 * len, len, y)) * h;
  }
  return s;
}
float blBubbles(vec2 q, float cell, float seed, float size, float many, float px) {
  vec2 g = q / cell, id = mod(floor(g), 256.0), h = hash22(id + seed);
  float r = size * (0.3 + 0.7 * h.y * h.y);
  vec2 l = (fract(g) - 0.5 - (h - 0.5) * 0.6) * cell;
  float d = length(l), body = (1.0 - smoothstep(r - px, r + px, d));
  float rim = body * smoothstep(0.3 * r, r, d), glint = (1.0 - smoothstep(0.0, 0.4 * r + px, length(l - vec2(-0.3, 0.35) * r)));
  return (rim * 0.6 + glint) * smoothstep(0.0, 0.25, many - hash21(id + seed + 3.7));
}
float blSheet(float d, float px) { return (smoothstep(-1.5 * px, px, d) * (0.45 * exp(-max(d, 0.0) * 34.0) + 0.75 * exp(-max(d, 0.0) * 300.0))); }
float blZig(float x, float s) { float i = floor(x); return mix(hash11(i + s), hash11(i + 1.0 + s), x - i) - 0.5; }
float blFlute(float x) { return abs(sin(PI * x)) * (0.3 + 1.0 * band(sat(x / 16.0))); }
float blHollow(vec2 q) {
  float a = noise(q * 0.7), b = noise(q * 0.9 + 21.0);
  vec2 u = q * vec2(1.5, 1.3) + vec2(a, b) * 3.2;
  return 0.55 * a + 0.5 * b - 0.75 * sqrt(0.012 + abs(sin(u.x) * sin(u.y))) * a;
}
vec3 blSkin(vec2 q) { float h = blHollow(q); return vec3(blHollow(q + vec2(0.12, 0.0)) - h, blHollow(q + vec2(0.0, 0.12)) - h, h); }
float blKeyed(vec2 p, vec2 foot, vec2 head, float px) {
  float s = 0.0;
  if (uKeys < 0.002) return s;
  for (int k = 0; k < 6; k++) {
    float fk = float(k), at = fract(uTime * 0.07 + fk * 0.27), h = hash11(fk + 2.3);
    vec2 c = mix(foot + vec2((h - 0.5) * 0.7, 0.0), head + vec2((h - 0.5) * 0.3, 0.0), at) + vec2(0.012 * sin(uTime * 0.9 + fk * 2.0), 0.0);
    float rr = (0.011 + 0.007 * h) * mix(1.3, 0.7, at), d = length(p - c);
    s += ((1.0 - smoothstep(rr - px, rr + px, d)) * smoothstep(0.2 * rr, rr, d) * 0.7 + (1.0 - smoothstep(0.0, 0.4 * rr + px, length(p - c - vec2(-0.3, 0.35) * rr)))) * sin(PI * at);
  }
  return s * uKeys;
}
float blSea = 0.0;
vec3 blWater(vec2 p, float clear) {
  float y = p.y - blSea * 0.7;
  vec3 c = mix(vec3(0.63, 0.745, 0.705), vec3(0.36, 0.51, 0.49), (1.0 - smoothstep(-0.10, 0.28, y)));
  c = mix(c, vec3(0.125, 0.235, 0.24), (1.0 - smoothstep(-0.60, 0.02, y)) * (1.0 - 0.15 * clear));
  float beam = noise(vec2(p.x * 2.6 + p.y * 0.9 + 0.02 * uTime, 0.03 * uTime)) - 0.5;
  c += vec3(0.11, 0.12, 0.10) * beam * smoothstep(-0.45, 0.25, y);
  if (uOwn[7] < 0.0) {
    float s = noise(vec2(p.x * 7.0 - p.y * 3.0 + 0.05 * uTime, 0.06 * uTime)) * 0.7 + noise(vec2(p.x * 19.0 - p.y * 8.0, 0.05 * uTime + 5.0)) * 0.3;
    c += blDn(uOwn[7]) * vec3(0.5, 0.5, 0.42) * smoothstep(0.42, 0.85, s) * smoothstep(-0.6, 0.3, y);
  }
  c = blHue(c);
  return c * (1.0 - 0.16 * min(dot(p, p), 1.0));
}
vec3 blAir(vec2 p, float hor, vec3 L, float turn, float px) {
  vec3 sky = mix(vec3(0.875, 0.855, 0.81), vec3(0.60, 0.685, 0.715), smoothstep(0.29 + min(blSea, 0.2), 0.53, p.y + 0.03 * noise(p * vec2(2.0, 9.0))));
  if (uOwn[4] != 0.0) sky = blHue(sky);
  if (uOwn[4] < 0.0) { vec2 m = p - vec2(0.42, hor + 0.1 + 0.5 * blDn(blSea)); float d = length(m); sky += blDn(uOwn[4]) * vec3(0.9, 0.86, 0.74) * ((1.0 - smoothstep(0.031, 0.034, d)) + 0.1 * exp(-d * 9.0)); }
  float y = p.y - hor, far = p.x;
  vec2 cq = vec2(p.x + 0.12, y);
  if (uOwn[1] != 0.0 || blSea != 0.0) {
    float id = blCell(cq, 1.15), big = 1.0 + 4.6 * blDn(blSea);
    if (id != 0.0) cq.y /= 0.5 + hash11(id);
    p = vec2(cq.x / big - 0.12, p.y); y = cq.y / big; turn += id * 1.7;
  }
  vec2 q0 = vec2(p.x, y);
  blClear(9.0);
  if (y < 0.16 && abs(p.x + 0.15) < 0.42) {
    vec2 q = vec2(p.x + 0.20, y);
    if (uOwn[0] != 0.0) q *= vec2(1.0 + 0.5 * blUp(uOwn[0]) - 0.45 * blDn(uOwn[0]), 1.0 - 0.4 * blUp(uOwn[0]) + 0.9 * blDn(uOwn[0]));
    q.x = (q.x - 0.25 * y) * (1.0 + 7.0 * max(y, 0.0));
    q += (vec2(noise(p * 34.0), noise(p * 34.0 + 9.0)) - 0.5) * 0.016;
    vec3 ro = vec3(q, 2.0), rd = vec3(0.0, 0.03, -1.0);
    blLump(ro, rd, vec3(0.0, 0.0, 0.0), vec3(0.17, -0.115, 0.12), turn + 0.9, 2.0 * px);
    blLump(ro, rd, vec3(0.16, -0.01, 0.03), vec3(0.12, -0.055, 0.1), turn + 2.3, 2.0 * px);
    blLump(ro, rd, vec3(-0.12, -0.015, 0.03), vec3(0.09, -0.04, 0.08), turn + 4.0, 2.0 * px);
  }
  p.x = far; y = p.y - hor;
  float gx = p.x - 0.61 - 0.02 * noise(p * 60.0), ghost = (1.0 - smoothstep(-0.004, 0.004, y - 0.026 + abs(gx) * 0.55 + 0.2 * max(-gx, 0.0)));
  sky = mix(sky, blHue(vec3(0.90, 0.89, 0.865)), 0.6 * ghost);
  float s = sat(0.1 + 1.15 * dot(blN, L) + 0.16 * (noise(p * vec2(60.0, 150.0)) - 0.5));
  vec3 snow = mix(vec3(0.52, 0.65, 0.70), vec3(0.985, 0.98, 0.955), s);
  snow = mix(snow, vec3(0.60, 0.80, 0.80), 0.5 * (1.0 - smoothstep(0.0, 0.025, y)));
  if (uOwn[3] != 0.0 || uOwn[4] < 0.0) snow = blStuff(snow, sky, q0, blN, s, 0.3 + 0.15 * noise(p * 12.0));
  return mix(sky, snow, blCover * 0.96);
}
vec2 blPlate(vec2 q) {
  float y = q.y * 15.0 + q.x * 1.2, i = floor(y), f = y - i, h = mix(hash11(i), hash11(i + 1.0), smoothstep(0.86, 1.0, f));
  q.x += blDn(uOwn[6]) * 0.2 * (h - 0.5);
  q.y += blDn(uOwn[6]) * 0.05 * (f - 0.5);
  return q;
}
vec3 blSplit(vec2 p) {
  float px = 1.0 / uRes.y, t = uTime, clear = sat(uLevel);
  float c4 = 4.0 * uCue * (1.0 - uCue), sx = p.x - mix(-1.1, 1.1, 1.0 - uCue);
  blSea = uOwn[2] > 0.0 ? -0.5 * uOwn[2] : -0.175 * uOwn[2];
  float swell = blUp(uOwn[5]) * (0.03 + 0.012 * uLow) * (sin(p.x * 5.0 + t * 0.55) + 0.5 * sin(p.x * 11.0 - t * 0.7 + 1.0)), frozen = blDn(uOwn[5]);
  float line = 0.296 + blSea + swell + (0.0012 + 0.0016 * uLow) * sin(t * 0.5 + p.x * 3.0) + 0.0008 * sin(t * 0.31 - p.x * 7.0) + 0.026 * c4 * exp(-sx * sx * 9.0);
  float turn = 0.22 * sin(t * 0.011) + 0.1;
  vec3 L = normalize(vec3(0.5 * sin(TAU * uLoop) - 0.55, 0.75, 0.5));
  float hor = 0.3055 + blSea + swell;
  vec2 ps = p;
  if (p.y < hor) ps = vec2(p.x + 0.01 * (noise(vec2(p.x * 20.0, p.y * 400.0 + t * 0.2)) - 0.5), hor + 1.6 * (hor - p.y));
  vec3 air = p.y < line - 2.0 * px ? vec3(0.8) : blAir(ps, hor, L, turn, px);
  if (p.y < hor) air = mix(air, blHue(vec3(0.50, 0.62, 0.63)), 0.4);
  float eye = line - 0.026, up = smoothstep(eye - px, eye + px, p.y);
  float rip = noise(vec2(p.x * 9.0 + 40.0 * sin(t * 0.003), (p.y - eye) * 160.0 - 80.0 * sin(t * 0.0031 + 1.0))) - 0.5;
  vec2 w = p.y > eye ? vec2(p.x + rip * 0.02, 2.0 * eye - p.y - rip * 0.012) : p;
  vec3 water = blWater(w, clear), col = water;
  float reach = 0.86 + 0.34 * uDrone;
  vec2 q = vec2(w.x + 0.12, w.y - eye);
  float depth = max(-q.y, 0.0), id = 0.0, kk = uOwn[0];
  if (uOwn[7] > 0.0) { vec3 th = mix(vec3(0.8, 0.86, 0.8), uKind[2], 0.75) * blThread(q, px) * uOwn[7]; col = uOwn[4] > 0.0 ? col * (1.0 - 0.65 * sat(th)) : col + 0.65 * th; }
  if (uOwn[1] != 0.0 || kk != 0.0) {
    id = blCell(q, 1.15); turn += id * 1.7;
    float h = hash11(id);
    if (id != 0.0) reach *= 0.45 + 0.8 * h;
    reach *= 1.0 + 0.45 * blUp(kk) - 0.62 * blDn(kk);
    blWide = 1.0 - 0.5 * blUp(kk) + 0.55 * blDn(kk); blLean = 1.0 - 0.5 * blUp(kk);
    if (id != 0.0) blWide *= 0.7 + 0.35 * hash11(id + 5.0);
  }
  vec2 fine = vec2(noise(q * 24.0), noise(q * 24.0 + 7.0)) - 0.5;
  vec2 bent = q + (vec2(noise(q * 5.0 + 3.0), noise(q * 5.0 + 11.0)) - 0.5) * 0.05 + fine * 0.012;
  if (uOwn[6] < 0.0) bent = blPlate(bent);
  vec3 ro = vec3(bent * 0.64, 1.2), rd = vec3(bent * 0.3, -1.0);
  blClear(9.0);
  if (abs(q.x) < 0.62 + 0.3 * blDn(uOwn[0])) {
    blLump(ro, rd, vec3(-0.06, -0.17 * reach, 0.0), vec3(0.42, 0.38 * reach, 0.30), turn, 3.0 * px);
    if (q.x > -0.06) blLump(ro, rd, vec3(0.28, -0.22 * reach, 0.06), vec3(0.20, 0.27 * reach, 0.20), turn + 1.3, 3.0 * px);
    if (q.x < -0.06) blLump(ro, rd, vec3(-0.37, -0.16 * reach, -0.05), vec3(0.17, 0.22 * reach, 0.18), turn + 2.6, 3.0 * px);
    if (q.y < -0.04 && abs(q.x - 0.06) < 0.4) blLump(ro, rd, vec3(0.06, -0.40 * reach, -0.07), vec3(0.23, 0.36 * reach, 0.24), turn + 0.5, 3.0 * px);
  }
  if (blCover > 0.0) {
    vec3 pos = ro + rd * blT, n = blN, loc = pos + vec3(0.05, 0.0, 0.3);
    loc.xz = rot(turn) * loc.xz;
    float fx = (atan(loc.x, loc.z) / PI + 0.5) * 16.0 + 1.1 * (noise(vec2(loc.x * 3.0, loc.y * 3.5)) - 0.5), fy = loc.y / reach;
    float fl = blFlute(fx), dfl = (blFlute(fx + 0.06) - fl) / 0.06;
    vec3 skin = blSkin(vec2(fx * 2.0, fy * 22.0));
    n = normalize(n + vec3(dfl * 0.085 + skin.x * (0.4 + 0.7 * uTone), skin.y * (0.35 + 0.6 * uTone), 0.0));
    float sun = sat(dot(n, L));
    float lit = sat(0.22 * (0.5 + 0.5 * n.y) + 0.95 * sun) * (1.0 - 0.45 * smoothstep(0.0, 0.5, depth));
    vec3 ice = mix(vec3(0.27, 0.46, 0.485), vec3(1.08, 1.085, 1.05), lit);
    vec2 in2 = pos.xy - n.xy * 0.13;
    float veil = noise(in2 * vec2(8.0, 5.0)) * 0.6 + noise(in2 * vec2(23.0, 12.0) + 4.0) * 0.4;
    float lay = in2.y + 0.22 * in2.x + 0.03 * veil, seam = noise(vec2(lay * 34.0, 2.5));
    ice += vec3(0.12, 0.15, 0.14) * (veil - 0.5) + vec3(0.16, 0.15, 0.13) * smoothstep(0.62, 0.85, seam) - vec3(0.14, 0.07, 0.05) * (1.0 - smoothstep(0.18, 0.38, seam));
    vec3 thin = exp(-blThick * vec3(6.5, 2.8, 2.6));
    ice = mix(ice, vec3(0.53, 0.83, 0.80), 0.6 * thin.g);
    vec2 gc = in2 - vec2(-0.03, -0.2 * reach);
    ice += vec3(0.15, 0.20, 0.18) * exp(-dot(gc, gc) * 12.0) * (0.3 + (0.5 + uEnergy) * uPad + 0.4 * uMic) * (0.5 + veil);
    vec4 pc = piece(vec2(in2.x + 0.5, sat(-in2.y / 0.75)));
    vec3 hue = pc.rgb / max(pc.a, 0.02);
    ice = mix(ice, ice * (0.62 + 0.4 * dot(hue, vec3(0.33)) + 0.5 * (hue - dot(hue, vec3(0.33)))), 0.75 * sat(pc.a * 1.3) * (0.4 + 0.6 * veil));
    float run = 0.5 + 0.5 * sin(fy * 14.0 + t * 0.7 + 2.4 * floor(fx + 0.5)), edge = abs(cos(PI * fx)); edge *= edge; edge *= edge;
    ice += (0.5 + 0.5 * uKind[3]) * uPhrase * run * run * run * edge * edge * (0.12 + 0.35 * uEnergy);
    if (uOwn[3] != 0.0 || uOwn[4] < 0.0) ice = blStuff(ice, blWater(w + n.xy * 0.16, clear), in2, n, lit, veil);
    float cr = 0.0;
    if (uHits > 0.002) for (int k = 0; k < 2; k++) {
      float fk = float(k), along = (-in2.y - 0.09) / 0.36;
      float path = (k == 0 ? -0.10 - 0.16 * along : 0.06 + 0.15 * along) + 0.10 * blZig(along * 4.0, 3.0 + 7.0 * fk) + 0.015 * blZig(along * 13.0, 20.0 * fk);
      float d = (path - in2.x) * (fk * 2.0 - 1.0), at = (along - 0.15 - 0.85 * (1.0 - uHits)) * 2.4;
      cr += smoothstep(0.0, 0.05, along) * exp(-at * at) * blSheet(d, px);
    }
    ice += (0.95 + 0.5 * uKind[4]) * cr * uHits;
    float ca = (q.y + 0.02 + 0.75 * (1.0 - uCue) + 0.05 * sin(p.x * 5.0)) * 8.0;
    ice += vec3(0.32, 0.34, 0.31) * uCue * exp(-ca * ca);
    float fog = 1.0 - exp(-0.06 - depth * 0.3 - depth * depth * (3.8 + 1.4 * uSpace - 2.6 * clear));
    vec3 over = max(ice - 0.78, 0.0);
    ice = min(ice, 0.78) + 0.2 * (1.0 - exp(-over * 5.0));
    col = mix(water, mix(ice, water * 1.03, fog), blCover * (1.0 - smoothstep(0.42, 0.80 + 0.08 * clear, depth)));
  }
  col = mix(col, blHue(vec3(0.79, 0.87, 0.83)), up * (0.3 + 0.5 * rip));
  blWide = blLean = 1.0;
  if (abs(p.x - 0.62) < 0.2 && p.y < eye) {
    blClear(9.0);
    blLump(vec3(p.x - 0.62 + bent.x - q.x, bent.y, 2.0), vec3(0.0, 0.0, -1.0), vec3(0.0, -0.05, 0.0), vec3(0.13, 0.11, 0.1), turn + 5.0, 0.05);
    col = mix(col, blHue(vec3(0.74, 0.83, 0.80)) * (0.88 + 0.12 * blN.y), blCover * 0.22 * (1.0 - smoothstep(0.0, 0.26, depth)));
  }
  float sway = 0.006 * sin(t * 0.6 + p.y * 24.0), stream = smoothstep(0.45, 0.75, noise(vec2(p.x * 11.0, 4.0 + 0.02 * t)));
  float bm = (1.0 - smoothstep(0.2, 0.58, abs(q.x))) * smoothstep(-0.62, -0.3, p.y) * (1.0 - smoothstep(eye - 0.06, eye, p.y)) * (0.08 + 0.92 * stream) * (1.0 - 0.2 * blCover);
  vec2 pd = p - vec2(-0.22, -0.16 + 0.06 * (1.0 - uHits));
  float puff = uHits * exp(-dot(pd, pd) / (0.004 + 0.02 * (1.0 - uHits)));
  float many = 0.14 + 0.6 * uTexture + puff;
  float bub = blBubbles(p + vec2(sway, -t * 0.021), 0.024, 5.0, 0.0014, many, px) * 0.8 + blBubbles(p + vec2(sway * 1.4, -t * 0.034), 0.047, 14.0, 0.0029, many * 0.7, px);
  col += vec3(0.60, 0.66, 0.63) * bub * (bm * (0.4 + 0.9 * uTexture) + puff);
  col += vec3(0.07, 0.08, 0.075) * blBubbles(rot(0.4) * p + vec2(0.006 * uTravel, 0.002 * uTravel), 0.061, 31.0, 0.0014, 0.8, px) * (1.0 - smoothstep(eye - 0.05, eye, p.y));
  col += vec3(0.52, 0.57, 0.54) * blKeyed(p, vec2(-0.1, -0.38), vec2(-0.1, 0.24), px);
  float dl = p.y - line, thick = dl / (1.4 * px + 0.0012);
  col = mix(col, col * vec3(0.60, 0.72, 0.71), smoothstep(-0.012, 0.0, dl) * 0.7);
  col = mix(col, air, smoothstep(-px, px, dl));
  if (frozen > 0.0) {
    float lie = frozen * (0.028 + 0.02 * noise(vec2(p.x * 6.0, 3.0)) + 0.012 * noise(vec2(p.x * 25.0, 8.0))), under = frozen * (0.02 + 0.035 * noise(vec2(p.x * 9.0, 1.0)));
    vec3 snow = blHue(vec3(0.93, 0.95, 0.96) * (0.82 + 0.18 * smoothstep(-0.02, lie, dl)) + 0.1 * (noise(p * vec2(60.0, 200.0)) - 0.5));
    col = mix(col, snow * mix(vec3(0.5, 0.68, 0.72), vec3(1.0), smoothstep(-0.02, 0.005, dl)), (1.0 - smoothstep(lie - px, lie + px, dl)) * smoothstep(-under - 2.0 * px, -under, dl));
  }
  return mix(col, blHue(vec3(0.965, 0.975, 0.955)), exp(-thick * thick) * 0.8 * (1.0 - frozen));
}
vec3 blCeil(vec2 c, vec2 sun, float t) {
  float roll = (c.y - 2.6 + 3.0 * (1.0 - uCue) + 0.25 * sin(c.x * 1.3)) * 2.2;
  vec2 w = c * 1.7 + 0.5 * (vec2(noise(c * 1.9 + 0.03 * t), noise(c * 1.9 + 9.0 - 0.03 * t)) - 0.5) + 0.06 * (vec2(noise(c * 7.0 + 40.0 * sin(0.0025 * t)), noise(c * 7.0 + 5.0)) - 0.5);
  if (uOwn[5] > 0.0) w *= 1.0 - 0.7 * uOwn[5];
  float s = 0.34 * sin(dot(w, vec2(1.3, 8.0)) + 0.42 * t) + 0.30 * sin(dot(w, vec2(-4.6, 10.5)) + 1.0 + 0.5 * t) + 0.24 * sin(dot(w, vec2(5.2, 15.0)) + 0.63 * t);
  s += (0.20 * sin(dot(w, vec2(-9.0, 23.0)) + 0.8 * t) + 0.16 * sin(dot(w, vec2(14.0, 31.0)) + 2.0 - 0.95 * t) + 0.12 * sin(dot(w, vec2(-23.0, 47.0)) + 1.2 * t)) * (1.0 - smoothstep(0.5, 2.6, c.y));
  s *= 0.55 + 0.9 * noise(c * 1.4 + vec2(0.05 * t, 4.0));
  float sd = exp(-dot(c - sun, c - sun) * 0.9), day = smoothstep(-0.55, 0.65, s - 0.60 * (c.y - 0.85) + 0.35 * sd + 0.75 * uCue * exp(-roll * roll));
  vec3 col = mix(vec3(0.20, 0.335, 0.33), vec3(0.47, 0.62, 0.58), smoothstep(0.0, 0.55, day));
  col = mix(col, vec3(0.80, 0.875, 0.82), smoothstep(0.45, 1.0, day));
  if (uOwn[5] < 0.0) {
    float f = noise(c * 3.0) * 0.6 + noise(c * 11.0) * 0.4, k = 1.0, i = 0.0;
    for (; i < 3.0; i++) { vec2 q = rot(1.1 * i + 0.4) * c; k = min(k, abs(mod(q.x + i, 1.5) - 0.75 + 0.5 * blZig(q.y * 1.7, i) + 0.07 * blZig(q.y * 9.0, i + 5.0)) * (1.0 + i)); }
    col = mix(col, mix(vec3(0.5, 0.66, 0.68), vec3(0.93, 0.95, 0.93), f * (0.6 + 0.6 * sd)) - 0.5 * (1.0 - smoothstep(0.0, 0.02, k)) - 0.14 * (1.0 - smoothstep(0.0, 0.16, k)), -uOwn[5]);
  }
  col = blHue(col);
  return col + (1.0 - 0.6 * uOwn[4]) * vec3(0.20, 0.19, 0.14) * sd * (0.35 + (0.85 + 0.5 * uHigh) * smoothstep(0.1, 0.8, s));
}
vec3 blBeneath(vec2 p) {
  float px = 1.0 / uRes.y, t = uTime, clear = sat(uLevel);
  vec2 fine = vec2(noise(p * 23.0), noise(p * 23.0 + 5.0)) - 0.5;
  vec2 bent = p + (vec2(noise(p * 5.0 + 3.0), noise(p * 5.0 + 11.0)) - 0.5) * 0.05 + fine * 0.014;
  vec2 l = p; float id = 0.0;
  if (uOwn[1] != 0.0) {
    vec2 shift = l - bent;
    float u = blUp(uOwn[1]), dy = mix(4.5, 1.25, u) / (1.0 + 1.3 * u), row = u > 0.0 ? floor(l.y / dy + 0.5) : 0.0;
    l.y -= row * dy; l.x += 0.15 + 0.31 * row;
    id = blCell(l, 1.35) + 7.0 * row;
    l.x -= 0.15; bent = l - shift;
  }
  if (uOwn[6] < 0.0) bent = blPlate(bent);
  vec2 a = vec2(0.88, 0.47); float go = 0.0, kk = uOwn[0];
  if (uOwn[2] != 0.0) { a = mix(a, uOwn[2] > 0.0 ? vec2(0.42, 0.91) : vec2(1.0, 0.0), abs(uOwn[2])); go = 1.25 * blUp(uOwn[2]) - 0.65 * blDn(uOwn[2]); }
  vec3 rd = vec3(p.x, a.x + p.y * a.y, a.y - p.y * a.x), rb = vec3(bent.x, a.x + bent.y * a.y, a.y - bent.y * a.x);
  vec2 sun = vec2(0.95 + 0.15 * sin(TAU * uLoop), 0.55 + 0.1 * cos(TAU * uLoop));
  float top = 1.5 / max(rd.y, 0.2);
  float reach = 0.70 + 0.35 * uDrone, turn = 0.25 * sin(t * 0.012) + 0.5 + id * 1.7;
  if (id != 0.0) reach *= 0.6 + 0.6 * hash11(id);
  reach *= 1.0 + 0.3 * blUp(kk) - 0.6 * blDn(kk); blWide = 1.0 - 0.45 * blUp(kk) + 0.5 * blDn(kk);
  blClear(top); blLean = 1.6;
  blLump(vec3(0.0), rb, vec3(-0.30, 1.5, 0.65 + go), vec3(0.80, reach, 0.62), turn, 4.0 * px);
  blLump(vec3(0.0), rb, vec3(0.20, 1.5, 0.80 + go), vec3(0.58, reach * 0.8, 0.50), turn + 1.7, 4.0 * px);
  blLump(vec3(0.0), rb, vec3(-0.55, 1.5, 0.90 + go), vec3(0.55, reach * 0.7, 0.45), turn + 4.4, 4.0 * px);
  blLean = 1.0;
  vec3 sky = vec3(0.50, 0.63, 0.60);
  if (blCover < 1.0 || blThick < 0.6) sky = mix(blCeil(rd.xz * top, sun, t), sky, 0.16 * (1.0 - clear) + 0.08 * uSpace);
  if (uOwn[2] > 0.0) sky = mix(sky, blHue(vec3(0.17, 0.28, 0.28)), uOwn[2] * (1.0 - smoothstep(0.06, 0.42, rd.y)));
  if (uOwn[7] < 0.0) { vec2 s = p - vec2(0.32, 0.24); sky += blDn(uOwn[7]) * (0.16 + 0.1 * uHigh) * vec3(1.0, 0.97, 0.85) * smoothstep(0.4, 0.8, noise(vec2(9.0 * atan(s.x, 0.15 + abs(s.y)), 0.1 * t)) + 0.2 * exp(-4.0 * dot(s, s))) * exp(-1.2 * dot(s, s)); }
  vec3 col = sky;
  if (blCover > 0.0) {
    vec3 pos = rb * blT, n = blN, loc = pos - vec3(-0.2, 1.5, 0.75 + go);
    loc.xz = rot(turn) * loc.xz;
    float fx = 8.0 + loc.x * 7.0 + loc.y * 2.0 + 0.9 * (noise(vec2(loc.x * 3.0, loc.z * 3.0)) - 0.5);
    float fl = blFlute(fx), dfl = (blFlute(fx + 0.06) - fl) / 0.06;
    vec3 skin = blSkin(vec2(fx * 2.0, loc.y * 16.0 + loc.z * 7.0));
    n = normalize(n + vec3(dfl * 0.06 + skin.x * (0.5 + 0.8 * uTone), 0.0, skin.y * (0.4 + 0.7 * uTone)));
    float side = sat(0.45 + 0.6 * dot(n, normalize(vec3(0.75, -0.05, -0.1))));
    float thick = max(blThick - 0.04 * fl - 0.05 * skin.z, 0.0);
    vec3 thr = exp(-thick * vec3(8.5, 4.6, 4.3));
    vec2 in2 = pos.xz - n.xz * 0.2;
    float veil = noise(in2 * vec2(6.0, 4.0)) * 0.6 + noise(in2 * vec2(17.0, 10.0) + 4.0) * 0.4;
    vec3 ice = mix(vec3(0.045, 0.105, 0.112), vec3(0.17, 0.30, 0.295), side * side) * (0.6 + 0.8 * veil);
    vec2 gc = in2 - vec2(-0.25, 0.7);
    ice += vec3(0.14, 0.25, 0.235) * exp(-dot(gc, gc) * 5.0) * (0.15 + (0.3 + 0.8 * uEnergy) * uPad + 0.4 * uMic) * (0.4 + 1.1 * veil);
    vec4 pc = piece(vec2(0.5 + p.x * 0.8 - n.x * 0.08, 0.5 - p.y - n.z * 0.05));
    ice += (0.15 + 0.85 * pc.rgb / max(pc.a, 0.02)) * sat(pc.a) * (0.04 + 0.22 * veil * veil) * (0.5 + uEnergy);
    float run = 0.5 + 0.5 * sin(loc.z * 7.0 + t * 0.7 + 2.4 * floor(fx + 0.5)), edge = abs(cos(PI * fx)); edge *= edge; edge *= edge;
    ice += (0.3 + 0.7 * uKind[3]) * uPhrase * run * run * edge * edge * (0.08 + 0.25 * uEnergy);
    float cr = 0.0;
    if (uHits > 0.002) for (int k = 0; k < 2; k++) {
      float fk = float(k), along = 0.5 - p.y * 1.4;
      float path = -0.26 + 0.36 * along * (0.4 + fk) + 0.11 * blZig(along * 3.5, 5.0 + 7.0 * fk) + 0.02 * blZig(along * 12.0, 20.0 * fk);
      float d = (path - p.x + n.x * 0.03) * (fk * 2.0 - 1.0), at = (along - 1.0 + uHits) * 3.0;
      cr += exp(-at * at) * 0.8 * blSheet(d, px);
    }
    if (uOwn[3] != 0.0 || uOwn[4] < 0.0) ice = blStuff(ice, sky, vec2(loc.x + 0.6 * loc.z, loc.y), n, side * side, veil);
    ice += (vec3(0.34, 0.44, 0.43) + 0.35 * uKind[4]) * cr * uHits;
    ice += vec3(0.86, 0.93, 0.89) * thr * 0.95 * (1.0 - 0.9 * blUp(uOwn[3])) * (1.0 - 0.6 * blDn(uOwn[4])) * (1.0 - 0.75 * blDn(uOwn[3]));
    ice = mix(ice, sky, 0.4 * exp(-thick * 12.0));
    ice = mix(ice, vec3(0.22, 0.35, 0.34), 0.14 * (1.0 - clear) + 0.08 * uSpace);
    col = mix(sky, min(ice, 0.96), blCover);
  }
  if (uOwn[7] > 0.0) { vec2 z = vec2(0.0, 0.55) - p; col = mix(col, mix(vec3(0.75, 0.82, 0.78), uKind[2], 0.75), 0.8 * uOwn[7] * sat(blThread(vec2(0.4 * atan(z.x, z.y), 0.3 - length(z)), px))); }
  float puff = uHits * exp(-dot(p - vec2(0.02, -0.12), p - vec2(0.02, -0.12)) * 30.0), many = 0.2 + 0.6 * uTexture + puff, bub = 0.0;
  for (int k = 0; k < 3; k++) {
    float at = fract(t * 0.045 + float(k) / 3.0), s = exp(1.5 * at - 0.5);
    float sd = float(k) * 17.0 + 3.0 * mod(floor(t * 0.045 + float(k) / 3.0), 64.0);
    bub += blBubbles((p - vec2(0.0, 0.534)) * s + 40.0, 0.11, sd, 0.0065, many, px * s) * sin(PI * at);
  }
  float stream = smoothstep(0.42, 0.72, noise(vec2(8.0 * p.x / max(1.1 - p.y, 0.1), 2.0 + 0.02 * t)));
  col += vec3(0.40, 0.45, 0.43) * bub * ((0.1 + 0.9 * stream) * (0.3 + 0.9 * uTexture) + puff);
  col += vec3(0.52, 0.57, 0.54) * blKeyed(p, vec2(0.15, -0.5), vec2(0.05, 0.5), px);
  return col;
}
vec3 render(vec2 p) {
  vec3 c = vec3(0.0);
  if (uVar < 0.5) c = blSplit(p);
  if (uVar >= 0.5) c = blBeneath(p);
  return c * (0.93 + 0.12 * uTone);
}
