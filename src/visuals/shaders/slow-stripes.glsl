// name: Slow stripes
// a: Leaning waves
// b: Folded cloth
// what: Broad soft stripes of grey, brick and sea blue on pale paper, swelling and thinning so that the flat sheet seems to roll in slow leaning waves; or the stripes of a hanging cloth, broad and fine by turns, parting and crowding as long folds lean across it and slowly pass.
// follows: Low sound deepens the waves and folds. Each sound dyes and swells the stripes where it lies in the piece; the bands heard set their widths. Pads make them breathe more, textures open fine lines, the melody widens the warm stripes, keys the blue. A hit is a narrow pinch that runs across, a cue a wide one. Tone adds stripes, space opens the waves.
// own: 0 1 many fine stripes, -1 a few great ones; 1 1 rings round one place, -1 a fan of rays from the edge; 2 1 hills and hollows, so the stripes close into loops as on a map, -1 straight, and the stripes themselves travel slowly; 3 1 round cords that cast shadows, -1 cut layers stepping down; 4 1 night, the stripes lit in the sounds' colours, -1 a ground in the colour of the drone, the stripes in the other sounds'; 5 1 broad bands that touch, -1 hair lines; 6 1 rows of beads, -1 dry brush strokes; 7 1 laid down as a ground to a far horizon under a sky, -1 folded in sharp zigzags
float ssSq(float x) { return x * x; }
float ssAsp() { return 0.5 * uRes.x / uRes.y; }
// The hit: a narrow pinch that runs from left to right, 1 in its middle.
float ssHit(float s) {
  float d = (s - mix(-0.62, 1.15, 1.0 - uHits) * ssAsp()) / 0.055;
  return uHits * exp(-d * d);
}
// The cue: a wide pinch that opens low on the left and goes up and across.
float ssCue(float s) {
  float d = (s - mix(-0.3, 0.75, 1.0 - uCue)) / 0.24;
  return uCue * exp(-d * d);
}
float ssSwell() { return 4.0 * uCue * (1.0 - uCue); }
// a: the height of the leaning sheet. The waves are tight on the right and open to the left; the top left lies almost flat.
float ssWaves(vec2 p) {
  float t = uTime, deep = 0.55 + 0.35 * uLow + 0.12 * uDrone;
  float x = (p.x + 0.26 * p.x * p.x) * mix(1.08, 0.92, uSpace);
  float calm = smoothstep(-0.7, 0.4, 0.8 * p.x - 0.75 * p.y + 0.12 * sin(t * 0.047));
  float q = 6.4 * x - 4.8 * p.y + 0.5 * sin(p.y * 2.6 + 1.2 * p.x + t * 0.06);
  float w = sin(q + t * 0.095 + 0.32 * sin(q + t * 0.095));
  float roll = sin(2.3 * p.x + 3.1 * p.y - t * 0.071);
  return deep * ((0.016 + 0.084 * calm) * w + 0.026 * roll + 0.014 * ssSwell() * sin(5.0 * p.y + 2.0 * p.x));
}
// b: the height of the hanging cloth: long folds that lean, come and go, broad on the near side and steep on the far one.
float ssFolds(vec2 p) {
  float t = uTime, deep = 0.62 + 0.3 * uLow + 0.08 * uDrone;
  float q = mix(7.4, 6.4, uSpace) * (p.x + 0.42 * p.y + 0.2 * p.y * p.y) + 0.45 * sin(p.y * 2.4 - t * 0.05 + 1.0) - t * 0.075;
  float f = sin(q - 0.38 * sin(q));
  float come = 0.5 + 0.5 * sin(2.1 * p.x - 1.5 * p.y + t * 0.052 + 0.4);
  float g = sin(2.7 * p.x - 2.4 * p.y + t * 0.06);
  return deep * ((0.018 + 0.066 * come) * f + 0.022 * g + 0.012 * ssSwell() * sin(q * 0.5));
}
float ssHills(vec2 p) {
  vec2 q = p + vec2(0.11 * sin(p.y * 3.1 + uTime * 0.041), 0.12 * sin(p.x * 2.7 - uTime * 0.036 + 1.0));
  float s = sin(2.9 * q.x + 1.1 + 0.6 * sin(uTime * 0.029)) * cos(3.4 * q.y - 0.5) + 0.62 * sin(4.7 * q.x - 3.3 * q.y + uTime * 0.033 + 2.0);
  return 0.24 * s + 0.1 * sin(2.1 * q.x + 5.2 * q.y + 4.0 - uTime * 0.027);
}
float ssHeight(vec2 p) {
  float h = uVar < 0.5 ? ssWaves(p) : ssFolds(p);
  if (uOwn[2] < 0.0) h *= 1.0 + 0.94 * uOwn[2];
  if (uOwn[2] > 0.0) h += uOwn[2] * (ssHills(p) * (0.85 + 0.3 * uLow) - 0.82 * (uVar < 0.5 ? p.y : p.x));
  if (uOwn[7] < 0.0) {
    float a = uVar < 0.5 ? p.x + 0.25 * p.y : p.y + 0.15 * p.x;
    h = mix(h, 0.45 * h + 0.052 * asin(0.985 * sin(a * 15.0)), -uOwn[7]);
  }
  if (uOwn[7] > 0.0) h *= exp(-uOwn[7] * 0.22 * max(length(p) - 0.8, 0.0));
  return h;
}
// The ground laid down: how far off its horizon is above the lower edge, and a place on it back in the picture.
const float SS_HOR = 0.76;
vec2 ssSeen(vec2 p) {
  if (uOwn[7] <= 0.0) return p;
  float y = max(p.y + 0.5, -0.3), k = uOwn[7] / SS_HOR;
  y /= 1.0 + k * y;
  return vec2(p.x * (1.0 - k * y), y - 0.5);
}
vec3 render(vec2 p) {
  bool b = uVar > 0.5;
  vec2 eye = p;
  float far = 1.0;
  if (uOwn[7] > 0.0) {
    far = 1.0 - uOwn[7] * (p.y + 0.5) / SS_HOR;
    float w = max(far, 0.012);
    p = vec2(p.x / w, (p.y + 0.5) / w - 0.5);
  }
  float e = 0.002, h = ssHeight(p);
  vec2 g = vec2(ssHeight(p + vec2(e, 0.0)) - h, ssHeight(p + vec2(0.0, e)) - h) / e;
  // the light comes from high on the left, in the cloth from the right
  vec3 n = normalize(vec3(-g * 1.3, 1.0));
  float lit = dot(n, normalize(b ? vec3(0.8, 0.3, 0.72) : vec3(-0.5, 0.62, 0.75)));
  float shade = smoothstep(0.0, 1.0, lit);
  float count = b ? mix(19.0, 27.0, uTone) : mix(18.0, 26.0, uTone);
  vec2 ac = b ? p : p.yx; // x across the stripes, y along them
  bool other = uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[7] != 0.0;
  vec2 gF = b ? vec2(1.0, 0.0) : vec2(0.0, 1.0), gA = gF.yx;   // which way they run across and along
  float ang = 0.0, ring = 0.0;
  if (uOwn[0] != 0.0) count *= exp2(uOwn[0] * (uOwn[0] > 0.0 ? 1.0 : 1.8));
  if (uOwn[1] > 0.0) {                 // round a place that comes in from far off
    ring = 1.1 * (1.0 / max(uOwn[1], 1e-4) - 1.0);
    vec2 d = p - (b ? vec2(-0.3, 0.07) : vec2(0.22, -0.1)) + gF * ring;
    float R = length(d) + 1e-4, al = dot(d, gA);
    ang = atan(al, dot(d, gF) + (abs(al) < 1e-5 ? 1e-5 : 0.0));
    ac = vec2(R - ring, abs(ang) * (ring + 0.4));
    gF = d / R; gA = vec2(-gF.y, gF.x) * ((ring + 0.4) / max(R, 0.05)) * (ang < 0.0 ? -1.0 : 1.0);
  }
  if (uOwn[1] < 0.0) {                 // rays from beyond the left edge, in the cloth from above
    float L = (b ? 0.6 : ssAsp() + 0.03) / -uOwn[1];
    vec2 dir = b ? vec2(0.0, -1.0) : vec2(1.0, 0.0), d = p - (b ? vec2(0.12, 0.0) : vec2(0.0, -0.1)) * -uOwn[1] + dir * L;
    float R = length(d) + 1e-4, dn = dot(d, dir), dc = dot(d, gF);
    ac = vec2(L * atan(dc, dn + (abs(dc) < 1e-5 ? 1e-5 : 0.0)), R - L);
    gA = d / R; gF = (b ? vec2(-gA.y, gA.x) : vec2(-gA.y, gA.x)) * (L / max(R, 0.05));
  }
  float roam = -0.11 * uTime * max(-uOwn[2], 0.0);
  float ph = count * (ac.x + h) + 120.0;
  if (uOwn[2] < 0.0) ph += roam;
  float px = length(vec2(dFdx(ph), dFdy(ph)));
  float id = floor(ph), f = ph - id - 0.5;
  // where the middle of this stripe lies, and what the piece holds there, softened along the stripe; each stripe takes the dye a little
  // earlier or later than the next, as tied and dyed threads do
  float mid = ac.x - f / (count * max(0.3, 1.0 + (b ? g.x : g.y)));
  vec2 G = gF + g, T = vec2(-G.y, G.x) / (length(G) + 1e-4), core = p;
  float along = ac.y;
  if (other || uOwn[6] != 0.0) {
    core = p - G * (f / (count * max(dot(G, G), 0.12)));
    along = ac.y - f / count * dot(gA, G) / max(dot(G, G), 0.12);
  }
  vec4 m = vec4(0.0);
  float late = (hash11(mod(id, 97.0)) - 0.5) * (b ? 0.15 : 0.10);
  for (int i = -2; i <= 2; i++) {
    float o = late + float(i) * 0.02;
    vec2 at = b ? vec2(mid, ac.y + o) : vec2(ac.y + o, mid);
    if (other) at = ssSeen(core + T * o);
    m += piece(clamp(vec2(at.x / (2.0 * ssAsp()) + 0.5, 0.5 - at.y), 0.02, 0.98));
  }
  m *= 0.2;
  float heard = sat(m.a * (0.65 + uEnergy));
  float run = b ? eye.x + 0.5 * eye.y : eye.x - 0.3 * eye.y;
  float hit = ssHit(run), cue = ssCue(eye.y * 0.8 + eye.x * 0.5);
  float bd = band(abs(fract(id / 32.0) * 2.0 - 1.0));
  // the order the stripes come in: two greys, a warm and a cool colour; in the cloth every second stripe is a fine one
  float c1 = pow(sat(0.5 + 0.5 * cos(TAU * id / 9.0)), 5.0), c2 = pow(sat(0.5 + 0.5 * cos(TAU * (id - 4.0) / 11.0)), 5.0);
  float fine = b ? mod(id, 2.0) : 0.0;
  // how wide the stripe is in its place: thin on the crests, full in the hollows
  float wide = (b ? 0.3 : 0.25) + (b ? 0.06 : 0.17) * (0.6 - shade) + 0.09 * heard + 0.05 * bd;
  wide += (b ? 0.03 : 0.055) * sin(3.2 * ac.y - 4.3 * mid - uTime * 0.11) * (0.8 + 0.7 * uPad); // it breathes
  wide += 0.05 * (c1 * uPhrase + c2 * uKeys) + 0.07 * uMic * exp(-dot(eye, eye) * 9.0);
  wide *= 1.0 - 0.55 * fine;
  wide *= 1.0 - 0.72 * hit - 0.5 * cue;
  wide = clamp(wide, 0.025, 0.42);
  float soft = px * 0.8 + 0.012;
  if (uOwn[5] > 0.0) wide = mix(wide, 0.5, uOwn[5] * (1.0 - 0.5 * hit));
  if (uOwn[5] < 0.0) wide = mix(wide, 0.045 + 0.11 * heard + 0.03 * bd, -uOwn[5] * (1.0 - 0.75 * max(hit, cue)));
  if (uOwn[5] < 0.0) wide = mix(wide, min(wide, max(0.012, (0.004 + 0.005 * heard) * px * uRes.y)), -uOwn[5]);
  float d = abs(f) - wide, v = 0.0;
  if (uOwn[6] > 0.0) {                 // beads along the stripe, as many on a ring as it has room for
    float t = count * along;
    if (uOwn[1] > 0.0) t = ang / TAU * max(floor(TAU * (ring * count + id + 0.5 - 120.0 - roam)), 1.0);
    float pxA = count * length(vec2(dFdx(ac.y), dFdy(ac.y))), k = uOwn[6] * (1.0 - smoothstep(0.35, 0.9, pxA));
    v = (fract(t + hash11(mod(id, 97.0) + 0.5)) - 0.5) * k / 0.44;
    wide = mix(wide, min(wide * 1.45, 0.46), k);
    d = (length(vec2(f / wide, v)) - 1.0) * wide;
    soft = max(soft, 0.35 * pxA * k);
  }
  if (uOwn[6] < 0.0) d += -uOwn[6] * 0.22 * (noise(vec2(along * count * 0.3, id * 7.31 + (f > 0.0 ? 3.0 : 0.0))) - 0.5) * (1.0 - smoothstep(0.2, 0.6, px));
  float ink = 1.0 - smoothstep(-soft, soft, d);
  // a fine line opens down the middle of one stripe in four with the textures
  ink *= 1.0 - 0.75 * sat(uTexture * 1.2) * (1.0 - sat(max(uOwn[6], -uOwn[5]))) * step(abs(mod(id, 4.0) - 2.0), 0.5) * (1.0 - smoothstep(-soft, soft, abs(f) - 0.035));
  if (uOwn[6] < 0.0) {                 // the brush runs dry: the ground shows between the hairs
    float hair = noise(vec2(along * count * 0.11 + 3.0, id * 11.7 + f * 22.0)), dry = noise(vec2(along * 2.3, id * 3.7));
    ink *= 1.0 + uOwn[6] * (0.25 + 0.75 * dry) * smoothstep(0.75 - 0.45 * dry, 0.95 - 0.35 * dry, hair) * (1.0 - smoothstep(0.1, 0.4, px));
  }
  ink = mix(ink, 2.0 * wide, smoothstep(0.3, 0.75, px));
  vec3 cool = b ? vec3(0.55, 0.58, 0.63) : vec3(0.53, 0.59, 0.63), warm = b ? vec3(0.70, 0.64, 0.57) : vec3(0.72, 0.67, 0.62);
  vec3 col = mix(cool, warm, 0.5 + 0.5 * cos(TAU * id / 7.0));
  col = mix(col, b ? vec3(0.70, 0.33, 0.28) : vec3(0.82, 0.48, 0.37), c1 * 0.85);
  col = mix(col, b ? vec3(0.24, 0.33, 0.50) : vec3(0.25, 0.48, 0.53), c2 * 0.85);
  if (uOwn[4] != 0.0) {
    vec3 own = mix(uKind[1], uKind[2], 0.5 + 0.5 * cos(TAU * id / 7.0));
    own = mix(mix(own, uKind[3], c1 * 0.9), uOwn[4] < 0.0 ? mix(uKind[4], uKind[2], max(uOwn[7], 0.0)) : uKind[0], c2 * 0.85);
    col = mix(col, own, abs(uOwn[4]));
  }
  // each sound dyes the stripes where it lies: one in three to the full, the two between only a little
  float third = 0.5 + 0.5 * cos(TAU * id / 3.0);
  vec3 dye = m.rgb / max(m.a, 0.001);
  dye = mix(vec3(dot(dye, vec3(0.3, 0.6, 0.1))), dye, b ? 0.76 : 0.88) * 0.84 + 0.08;
  if (uOwn[4] != 0.0) dye = mix(dye, m.rgb / max(m.a, 0.001), abs(uOwn[4]));
  if (uOwn[4] < 0.0) dye = mix(dye, col * 0.78, -uOwn[4] * smoothstep(0.3, 0.08, distance(dye, uKind[0])));
  col = mix(col, dye, heard * (b ? 0.12 + 0.78 * third : 0.4 + 0.5 * third));
  col = mix(col, uKind[4] * 0.85, sat(hit * 0.8));
  col *= mix(b ? vec3(0.88, 0.88, 0.91) : vec3(0.80, 0.82, 0.88), vec3(1.09, 1.06, 1.02), shade);
  vec3 ground = b ? mix(vec3(0.82, 0.81, 0.80), vec3(0.95, 0.93, 0.885), shade) : mix(vec3(0.89, 0.885, 0.885), vec3(0.955, 0.94, 0.91), shade);
  ink *= 1.0 - 0.3 * uSpace * smoothstep(-0.1, 0.6, eye.y); // far off it pales
  if (uOwn[4] < 0.0) ground = mix(ground, uKind[0] * (0.8 + 0.26 * shade), -uOwn[4]);
  float lamp = 1.0;
  if (uOwn[4] > 0.0) {                 // night: a stripe gives light, more where it sounds, and lights the dark beside it
    lamp = 0.5 + 0.62 * heard + 0.2 * bd + 0.3 * cue;
    if (uOwn[7] > 0.0) lamp += uOwn[7] * 1.1 * exp(-ssSq((eye.x - 0.27) / (0.05 + 0.16 * sat(0.3 - eye.y)))) * (0.5 + 0.5 * uLevel);
    vec3 dark = uKind[0] * uKind[0] * 0.07 + 0.006;
    dark += col * lamp * 0.34 * exp(-max(d, 0.0) * 9.0) * (1.0 - smoothstep(0.3, 0.75, px));
    vec3 lit2 = col * lamp * (0.5 + 0.6 * shade);
    col = mix(col, lit2 / (1.0 + 0.22 * lit2 * lit2), uOwn[4]);
    ground = mix(ground, dark, uOwn[4]);
  }
  if (uOwn[3] != 0.0) {
    float crisp = 1.0 - smoothstep(0.25, 0.6, px), cut = uOwn[3] < 0.0 ? 1.0 : 0.0;
    float gap = sat((0.5 - abs(f)) / max(0.5 - wide, 0.04));
    if (uOwn[3] > 0.0) {
      vec2 u = vec2(clamp(f / max(wide, 0.03), -1.0, 1.0), clamp(v, -1.0, 1.0)), N = G / (length(G) + 1e-4);
      vec3 nn = vec3(N * u.x + T * u.y, sqrt(max(1.0 - dot(u, u), 0.02)));
      vec3 sun = normalize(b ? vec3(0.62, 0.4, 0.6) : vec3(-0.5, 0.65, 0.6));
      float l = dot(nn, sun) / length(nn);
      float ply = sin(count * along * 9.0 + u.x * 2.6) * (1.0 - smoothstep(0.03, 0.1, px)) * (1.0 - sat(uOwn[6] * 2.0));
      vec3 rnd = col * (0.22 + 0.95 * sat(0.3 + 0.75 * l) + 0.1 * ply) + 0.3 * pow(sat(l), 14.0) * (0.35 + col);
      col = mix(col, rnd, uOwn[3] * crisp);
      float side = 0.5 - 0.5 * clamp(dot(N, sun.xy) * sign(f) * 2.0, -1.0, 1.0);
      ground *= 1.0 - uOwn[3] * crisp * 0.72 * pow(gap, 1.4) * (0.35 + 0.65 * side) * (1.0 - sat(uOwn[6]) * smoothstep(0.0, 0.5, d));
    } else {
      float fall = sat(1.0 - (f + wide) / max(2.0 * wide, 0.1)), lip = exp(-ssSq((f - wide + 0.02) / 0.035));
      col *= 1.0 + uOwn[3] * crisp * (0.62 * fall * fall * sqrt(fall) - 0.22 * lip);
      ground *= 1.0 + uOwn[3] * crisp * 0.6 * step(0.0, f) * pow(gap, 1.6);
    }
  }
  vec3 seen = mix(ground, col, ink);
  if (uOwn[7] > 0.0) {                 // the air before the horizon, and the sky
    float k = uOwn[7], bare = k * smoothstep(0.28, 0.85, px);
    vec3 all = mix(mix(cool, warm, 0.5), mix(uKind[1], uKind[2], 0.5), abs(uOwn[4])) * mix(1.0, 0.55 * lamp, max(uOwn[4], 0.0));
    seen = mix(seen, mix(ground, mix(all, dye * mix(1.0, 0.6 * lamp, max(uOwn[4], 0.0)), 0.6 * heard), sat(2.0 * wide)), bare);
    float up = sat((eye.y + 0.5 - SS_HOR / k) / 0.4);
    vec3 low = mix(vec3(0.94, 0.91, 0.86), uOwn[4] < 0.0 ? uKind[4] : mix(uKind[3], uKind[2], 0.4), abs(uOwn[4]) * 0.8), high = mix(vec3(0.62, 0.69, 0.74), uOwn[4] < 0.0 ? mix(uKind[4], vec3(0.5, 0.58, 0.66), 0.6) : uKind[0], abs(uOwn[4]) * 0.8);
    float dim = 1.0 - 0.72 * max(uOwn[4], 0.0);
    vec3 sky = mix(low * mix(1.0, dim, 0.45), high * dim, sqrt(up)) * (0.94 + 0.12 * uLevel);
    vec2 o = eye - vec2(0.27, SS_HOR / k - 0.385);          // a low sun or moon
    float disc = k * (smoothstep(0.052, 0.046, length(o)) + 0.3 * exp(-dot(o, o) * 40.0));
    sky = mix(sky, mix(vec3(0.99, 0.96, 0.9), uKind[3] * 0.5 + 0.5, 0.5), sat(disc) * mix(0.75, 1.0, max(uOwn[4], 0.0)));
    float haze = exp(-max(far, 0.0) * 8.0) * k;
    seen = mix(seen, sky, max(haze, smoothstep(0.012, 0.0, far)));
  }
  return seen;
}
