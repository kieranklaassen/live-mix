// name: Black hole
// a: Disc
// b: Bent ring
// what: A black hole with the piece wound round it as a disc of glowing matter, its far side bent up over the top by gravity; or the hole alone, bending five coloured lights behind it into a ring.
// follows: The disc is one turn of the loop with what plays now at the front, each sound an arc as bright as it is loud; the mix heats the inner edge; a hit sends a ring of heat out through the disc and a cue throws a flare round it; in the ring each light is one kind of sound, as bright as it is loud.
// own: 0 1 the disc is many thin rings with gaps (b: a lattice of small lights far behind, bent by the hole), -1 it is loose round stones (b: broad bands of colour behind); 1 1 a wide disc (b: great soft lights), -1 a thin hoop far out (b: small hard ones); 2 1 the eye high above (b: the lights far apart), -1 level with the disc (b: the lights hollow, ring in ring); 3 1 a pale sky, -1 clouds of colour behind; 4 1 a far stronger pull, -1 no pull at all and the hole a great ball; 5 1 a second hole goes round it, -1 a jet up and down; 6 1 two spiral arms (b: long arcs of stars), -1 smooth as satin (b: one great band of dust); 7 1 the hole is a lit ball of stone or gas and the disc lies in the same light, -1 it is a ball of clear glass
vec3 lnSun;                // own: where the light on a ball and its rings comes from
vec3 lnFar(vec3 d, inout vec3 ink);
float lnPull, lnBall, lnFine;  // how hard it pulls, how large it is; how little bent what is seen here is
float lnStars(vec3 d, float n, float seed) {
  vec3 g = d * n, id = floor(g), f = fract(g) - 0.5;
  float h = hash31(id + seed), h2 = hash31(id + seed + 17.0);
  float r = length(f - (vec3(h2, fract(h2 * 13.7), fract(h2 * 91.3)) - 0.5) * 0.6);
  return pow(h, 9.0) * smoothstep(0.11, 0.0, r) * 5.0 * (0.75 + 0.25 * sin(uTime * (0.6 + 2.0 * h2) + h2 * 30.0));
}
vec3 lnBehind(vec3 d) { // what is far behind: stars, and a faint band of dust to show the bending
  float st = lnStars(d, 26.0, 1.0) + 0.6 * lnStars(d.zxy, 55.0, 4.0);
  float lane = exp(-pow(dot(d, normalize(vec3(0.3, 1.0, 0.2))) * 3.2, 2.0));
  float dust = lane * (0.65 * noise(d * 3.5 + 2.0) + 0.35 * noise(d * 9.0));
  vec3 c = vec3(0.85, 0.9, 1.0) * st + vec3(0.25, 0.3, 0.6) * dust * dust * 0.06;
  if (uOwn[6] < 0.0 && uVar > 0.5) {    // one great band of dust
    float fine = fbm(d * 7.0 + 3.0);
    c -= uOwn[6] * exp(-pow(dot(d, normalize(vec3(0.3, 1.0, 0.2))) * 2.4, 2.0)) * mix(uKind[1] * uKind[1], uKind[2], fine) * (1.5 * fine * fine + 0.2 * dust) * (0.5 + 0.8 * uLevel);
  }
  if (uOwn[6] > 0.0 && uVar > 0.5) {    // long arcs of stars, about a pole that is not the hole
    vec3 z = normalize(vec3(0.42, 0.3, 1.0)), x = normalize(cross(vec3(0.0, 1.0, 0.0), z)), y = cross(z, x);
    float off = acos(clamp(dot(d, z), -1.0, 1.0)), id = floor(off * 70.0), h = hash11(id * 1.7 + 3.0), k = floor(h * 4.99);
    float a = fract(atan(dot(d, y), dot(d, x)) / TAU * 3.0 + h * 7.0 + uTime * 0.006 * (1.0 + h));
    float arc = smoothstep(0.0, 0.25, a) * smoothstep(0.25 + 0.7 * h, 0.2 + 0.7 * h, a), f = fract(off * 70.0) - 0.5;
    c += uOwn[6] * lnFine * arc * exp(-f * f * 60.0) * step(0.35, fract(h * 37.0)) * mix(vec3(0.9), uKind[int(k)] * 1.6, 0.7) * (0.35 + 1.1 * piece(vec2(a, 0.1 + 0.2 * k)).a + 0.3 * uLevel);
  }
  if (uOwn[3] < 0.0) {                  // clouds of colour
    float far = fbm(d * 2.9 + vec3(0.0, uTime * 0.01, 0.0)), thick = fbm(d.zxy * 6.0 - 4.0 + 1.8 * far);
    vec3 k = mix(uKind[0] * uKind[0] * (0.7 + 0.6 * uDrone), uKind[1] * uKind[1] * (0.7 + 0.6 * uPad), smoothstep(0.3, 0.6, thick));
    k = mix(k, uKind[2] * uKind[2] * (0.8 + 0.8 * uTexture), smoothstep(0.45, 0.7, noise(d * 3.1 + 9.0)));
    k += uKind[4] * uHits * 0.4 * exp(-pow((length(d.xy) - 0.9 + 0.9 * uHits) * 4.0, 2.0)) + uKind[3] * uKind[3] * uPhrase * 0.5 * smoothstep(0.6, 0.8, far);
    c -= uOwn[3] * k * smoothstep(0.28, 0.72, 0.5 * far + 0.5 * thick) * (1.1 + 1.0 * uLevel);
  }
  if (uOwn[3] > 0.0) c = mix(c, vec3(2.5, 2.3, 2.0) * (0.72 + 0.5 * d.y + 0.1 * noise(d * 2.0)), uOwn[3]);
  return c;
}
// The hole as a ball: hit at h, seen along v.
vec3 lnStone(vec3 h, vec3 v, float rin, float rout) {
  vec3 n = normalize(h);
  if (uOwn[7] < 0.0) {
    float f = 1.0 - sat(-dot(n, v)), g = pow(sat(dot(reflect(v, n), lnSun)), 60.0);
    vec3 to = normalize(v - 1.3 * n - 1.3 * n * dot(v, n)), ink = vec3(0.0), seen = lnBehind(to);
    if (uVar > 0.5 && uOwn[0] != 0.0) { lnFine = 1.0; seen += lnFar(to, ink); seen *= exp(-ink * 2.0 * max(uOwn[3], 0.0)); }
    vec3 c = seen * vec3(0.8, 0.9, 0.95) * (1.0 - f * f);
    return -uOwn[7] * (c + lnBehind(reflect(v, n)) * (0.1 + 0.9 * f * f * f) + uKind[1] * f * f * f * (0.25 + 1.2 * uPad) + vec3(1.0, 0.96, 0.9) * g * 1.5);
  }
  float y = n.y + 0.06 * (fbm(n * 4.0) - 0.5), band = noise(vec2(y * 9.0, 2.0)) * 0.65 + noise(vec2(y * 26.0 + 5.0, 7.0)) * 0.35;
  vec3 c = mix(uKind[1], uKind[2], smoothstep(0.3, 0.7, band));
  c = mix(c, uKind[0], 0.5 * smoothstep(0.2, 0.9, abs(n.y)));
  float lit = sat(dot(n, lnSun) * 1.05 + 0.02), edge = pow(1.0 - sat(-dot(n, v)), 3.0);
  if (uVar < 0.5 && lnSun.y * h.y < 0.0) {       // the disc's shadow lies on it
    vec3 s = h - lnSun * h.y / lnSun.y; float r = length(s);
    lit *= 1.0 - 0.75 * smoothstep(rin, rin + 0.2, r) * smoothstep(rout, rout - 0.4, r);
  }
  return uOwn[7] * (c * c * (lit * 1.9 + 0.012 + 0.1 * uLevel * lit) + uKind[1] * edge * lit * 0.5 + uKind[4] * uHits * 0.4 * lit);
}
// A jet out of both its poles, in the plane of the picture.
vec3 lnJet(vec2 p, float under) {
  float y = abs(p.y), w = p.x / (0.006 + 0.085 * y + 0.02 * y * sin(y * 22.0 - uTravel * 1.1 + (p.y > 0.0 ? 0.0 : 2.0)));
  float knots = 0.45 + 0.9 * noise(vec2(y * 13.0 - uTravel * 0.9, p.y > 0.0 ? 2.0 : 9.0));
  float b = exp(-w * w) * smoothstep(0.02, 0.12, y) * exp(-y * 1.5) * knots * 1.3 * (p.y > 0.0 ? 1.0 : under);
  return -uOwn[5] * (uKind[1] * uKind[1] * 2.2 + 0.25 * vec3(1.0, 0.95, 0.9) * exp(-w * w * 3.0)) * b * (0.6 + 1.6 * uPad + 1.5 * uHits);
}
// The disc where a ray crosses its plane at c, heading along v. Gives light in rgb and how much it hides in a.
vec4 lnDisc(vec3 c, vec3 v) {
  float rin = 2.6 + 3.6 * max(-uOwn[1], 0.0), rout = 9.5 + 3.5 * max(uOwn[1], 0.0) - 2.3 * max(-uOwn[1], 0.0);
  float r = length(c.xz);
  if (r < rin || r > rout) return vec4(0.0);
  float ang = atan(c.x, -c.z); // 0 at the front, toward us
  float along = (r - rin) / (rout - rin);
  float turn = uTravel * 0.11;
  // streaks of gas, drawn out round the hole; two layers turning at different rates
  float a1 = ang + turn * 2.2, a2 = ang + turn * 1.3;
  float gas = noise(vec3(cos(a1) * 2.2, sin(a1) * 2.2, r * 3.4)) * 0.6 + 0.4 * noise(vec3(cos(a2) * 4.5, sin(a2) * 4.5, r * 8.0 + 3.0));
  gas = 0.25 + 1.5 * gas * gas;
  float whole = 1.0, stones = max(-uOwn[0], 0.0);
  if (uOwn[6] > 0.0) {                  // two arms
    float s = 0.5 + 0.5 * cos(2.0 * (ang + turn * 0.7) + 7.0 * log(r / 2.0) + 0.8 * (gas - 0.6));
    gas *= mix(1.0, 0.12 + 1.5 * s * s * s, uOwn[6]); whole *= mix(1.0, 0.1 + 0.9 * smoothstep(0.05, 0.6, s), uOwn[6]);
  }
  if (uOwn[6] < 0.0) gas = mix(gas, 0.78 + 0.3 * sin(r * 2.3 - turn), -uOwn[6]);
  if (uOwn[0] > 0.0) {                  // thin rings with gaps between
    float n = 0.6 * noise(vec2(r * 4.2, 3.0)) + 0.4 * noise(vec2(r * 13.0, 8.0)), g = smoothstep(0.36, 0.56, n);
    whole *= mix(1.0, 0.03 + 0.97 * g, uOwn[0]); gas *= mix(1.0, 0.55 + 0.9 * noise(vec2(r * 9.0, 1.0)), uOwn[0]);
  }
  if (stones > 0.0) {                   // loose stones, each ring of them going at its own speed
    float at = r / 0.75, id = floor(at), rr = (id + 0.5) * 0.75, n = floor(TAU * rr / 0.8), s = (ang + turn * 9.0 / rr) / TAU * n + 0.37 * id;
    float cell = mod(floor(s), n), big = hash21(vec2(cell, id));
    vec2 q = vec2((fract(s) - 0.5) * 0.8 / 0.75, at - id - 0.5) * 2.0 + 0.8 * vec2(fract(big * 37.0) - 0.5, fract(big * 91.0) - 0.5);
    float d2 = dot(q, q) / mix(0.05, 0.42, big * big);
    float ball = smoothstep(1.0, 0.7, d2);
    whole *= mix(1.0, ball, stones); gas = mix(gas, (0.7 + 1.1 * big) * (1.15 - 0.7 * d2) * (0.8 + 0.4 * q.y), stones * ball);
    ang = mix(ang, ang + (0.5 - fract(s)) / n * TAU, stones * 0.999);
  }
  float edge = smoothstep(0.0, 0.05, along) * smoothstep(1.0, 0.75, along);
  // the piece: one turn is the loop, now at the front; the room runs from the back at the inner edge to the front at the outer
  float lx = fract(uLoop + ang / TAU), ly = 0.04 + 0.94 * along;
  vec4 pc = piece(vec2(lx, ly));
  // where the loop's end meets its start, blend the two so there is no cut in the disc
  float seam = max(smoothstep(0.035, 0.0, lx), smoothstep(0.965, 1.0, lx));
  if (seam > 0.0) pc = mix(pc, 0.5 * (piece(vec2(0.01, ly)) + piece(vec2(0.99, ly))), seam);
  vec3 hue = pc.rgb / max(pc.a, 0.02);
  vec3 light = hue * hue * 2.6 * pc.a * (0.25 + 1.6 * pc.a);
  // the hot inner edge, as bright as the mix
  float hot = pow(rin / r, 3.2);
  light += mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.9, 0.75), hot * hot) * hot * (0.05 + 1.3 * uLevel + 1.5 * uHits);
  // a hit: a ring of heat going out through the disc from the inner edge
  light += vec3(1.0, 0.8, 0.6) * 1.6 * uHits * exp(-pow((r - rin - 5.5 * (1.0 - uHits)) * 1.6, 2.0));
  // a cue: a flare thrown round the disc
  float fa = ang - (2.4 - 4.2 * (1.0 - uCue));
  fa = atan(sin(fa), cos(fa));
  float tail = fa > 0.0 ? exp(-fa * 1.3) : exp(fa * 9.0);
  light += vec3(1.0, 0.85, 0.7) * 5.0 * uCue * tail * exp(-pow((along - 0.3) * 4.5, 2.0));
  // matter coming toward us is brighter
  vec3 flow = normalize(vec3(-c.z, 0.0, c.x));
  float beam = pow(1.0 + 0.55 * dot(flow, -normalize(v)) * inversesqrt(r * 0.5), 3.0);
  float a = edge * sat(0.86 + 0.5 * gas * (0.4 + pc.a));
  a *= whole; gas *= whole;
  if (uOwn[7] > 0.0) {                  // in the same light as the ball, and in its shadow
    float b = dot(c, lnSun), off = length(c - b * lnSun), sh = b < 0.0 ? smoothstep(lnBall * 0.93, lnBall * 1.07, off) : 1.0;
    vec3 mine = mix(mix(uKind[0], uKind[2], noise(vec2(r * 1.3, 4.0))), hue, sat(pc.a * 1.5));
    light = mix(light, mine * mine * (0.5 + 1.5 * pc.a + 0.5 * uLevel) * mix(0.05, 1.0, sh) + light * 0.25, uOwn[7]);
    beam = mix(beam, 1.0, uOwn[7]);
  }
  return vec4(light * gas * beam * edge, a);
}
// A second hole, at h and of a weight: it bends a ray too, and takes it.
void lnSecond(vec3 pos, inout vec3 vel, vec3 h, float weight, inout float dt, inout float caught) {
  vec3 d = pos - h, c = cross(d, vel);
  float r2 = dot(d, d), r = sqrt(r2), size = 0.6 * weight;
  if (r < size) { caught = 1.0; return; }
  dt = min(dt, 0.03 + 0.16 * max(r - size, 0.0) + 2.0 * (1.0 - weight));
  vel += -1.5 * dot(c, c) * size * d / (r2 * r2 * r) * dt;
}
vec3 lnHole(vec2 p) {
  float around = uTime * 0.035 + 1.0, above = 0.13 + 0.05 * sin(uTime * 0.05);
  if (uOwn[2] != 0.0) above = mix(above, uOwn[2] > 0.0 ? 1.3 : 0.012, abs(uOwn[2]));
  float rin = 2.6 + 3.6 * max(-uOwn[1], 0.0), rout = 9.5 + 3.5 * max(uOwn[1], 0.0) - 2.3 * max(-uOwn[1], 0.0), rin2 = uOwn[1] < 0.0 ? rin * rin : 6.76, rout2 = uOwn[1] != 0.0 ? rout * rout : 90.25;
  vec3 ro = 15.0 * vec3(sin(around) * cos(above), sin(above), -cos(around) * cos(above));
  vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  p = rot(0.3) * (p - vec2(0.0, 0.02));
  lnSun = normalize(rt * -0.8 + up * 0.42 - fw * 0.42);
  vec3 hit = vec3(0.0), hole2 = 5.4 * vec3(cos(uTime * 0.06), 0.14 * sin(uTime * 0.05), sin(uTime * 0.06));
  float two = max(uOwn[5], 0.0);
  vec3 vel = normalize(fw * 1.25 + rt * p.x + up * p.y), pos = ro;
  vec3 hv = cross(pos, vel); float h2 = dot(hv, hv);
  vec3 col = vec3(0.0); float T = 1.0, caught = 0.0;
  // turn the disc so the loop's start stays put while the camera goes round: the front is toward the camera
  float face = atan(ro.x, -ro.z);
  vec3 cs[3], vs[3]; int found = 0; // where the ray crosses the disc: shaded after the march, which is far cheaper
  for (int i = 0; i < 100; i++) {
    if (i >= 60 && two <= 0.0) break;
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < lnBall) { caught = 1.0; hit = pos; break; }
    if (r > 16.0 && dot(pos, vel) > 0.0) break;
    float dt = 0.03 + 0.13 * (r - 1.0);
    if (lnPull != 1.0) vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt * lnPull;
    else vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    if (two > 0.0) lnSecond(pos, vel, hole2, two, dt, caught);
    if (caught > 0.5) break;
    vec3 next = pos + vel * dt;
    if (lnBall > 1.0) {               // where a straight ray meets a great ball
      float b = dot(pos, vel), k = dot(vel, vel), e = b * b - k * (r2 - lnBall * lnBall);
      if (e > 0.0 && b < 0.0) { float t = (-b - sqrt(e)) / k; if (t < dt) next = pos + vel * (max(t, 0.0) + 0.004); }
    }
    if (pos.y * next.y < 0.0 && found < 3) {
      vec3 c = mix(pos, next, pos.y / (pos.y - next.y));
      float rc = dot(c.xz, c.xz);
      if (rc > rin2 && rc < rout2) { cs[found] = c; vs[found] = vel; found++; }
    }
    pos = next;
  }
  mat2 turn = rot(-face);
  float nth = 1.0;
  for (int k = 0; k < 3; k++) {
    if (k >= found) break;
    vec3 c = cs[k], v = vs[k];
    c.xz = turn * c.xz; v.xz = turn * v.xz;
    vec4 d = lnDisc(c, v);
    col += T * d.rgb * nth; T *= 1.0 - d.a; nth *= 0.75; // each further image of the disc, round the back of the hole, is fainter
  }
  if (caught < 0.5) col += T * lnBehind(normalize(vel));
  else if (uOwn[7] != 0.0 && dot(hit, hit) > 0.1) col += T * lnStone(hit, normalize(vel), rin, rout);
  if (uOwn[5] < 0.0) col += lnJet(p, T);
  return col;
}
// Where a ray ends up looking after passing the hole, or the zero vector if the hole takes it.
#define LN_STRAIGHT (uOwn[4] == -1.0 && uOwn[5] <= 0.0)
vec3 lnBend(vec3 pos, vec3 vel, float pull, out vec3 hit, out vec3 way) {
  vec3 hv = cross(pos, vel); float h2 = dot(hv, hv) * pull;
  float two = max(uOwn[5], 0.0), caught = 0.0;
  vec3 hole2 = vec3(4.6 * cos(uTime * 0.05), 2.4 * sin(uTime * 0.05), 0.0);
  hit = vec3(0.0); way = vel;
  if (LN_STRAIGHT) {                    // nothing bends it: it meets the ball, or it does not
    float b = dot(pos, vel), k = dot(vel, vel), e = b * b - k * (dot(pos, pos) - lnBall * lnBall);
    if (e <= 0.0) return normalize(vel);
    hit = pos + vel * ((-b - sqrt(e)) / k + 0.004); return vec3(0.0);
  }
  for (int i = 0; i < 70; i++) {
    if (i >= 40 && two <= 0.0) break;
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < lnBall) { hit = pos; way = vel; return vec3(0.0); }
    if (r > 15.0 && dot(pos, vel) > 0.0) break;
    float dt = 0.05 + 0.2 * (r - 1.0);
    if (lnBall > 1.0) {
      float b = dot(pos, vel), k = dot(vel, vel), e = b * b - k * (r2 - lnBall * lnBall);
      if (e > 0.0 && b < 0.0) dt = min(dt, max((-b - sqrt(e)) / k, 0.0) + 0.004);
    }
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    if (two > 0.0) { lnSecond(pos, vel, hole2, two, dt, caught); if (caught > 0.5) return vec3(0.0); }
    pos += vel * dt;
  }
  return normalize(vel);
}
// What else may be far behind: a lattice of small lights, or broad bands, each lit by the piece.
vec3 lnFar(vec3 d, inout vec3 ink) {
  vec2 q = vec2(atan(d.x, d.z), asin(clamp(d.y, -1.0, 1.0)));
  vec4 pc = piece(sat(vec2(0.5 + 0.55 * q.x, 0.5 - 0.8 * q.y)) * 0.98 + 0.01);
  vec3 hue = pc.rgb / max(pc.a, 0.02);
  if (uOwn[0] > 0.0) {
    vec2 g = q * 26.0, id = floor(g), f = fract(g) - 0.5;
    float h = hash21(id), r = 0.1 + 0.2 * pc.a + 0.05 * h, k = floor(h * 2.99);
    hue = mix(uKind[int(k)], hue, sat(pc.a * 3.0));
    float dot_ = smoothstep(r + 0.07, r - 0.07, length(f)), w = uOwn[0] * mix(0.05, dot_, lnFine) * (1.5 * uHits * exp(-pow((length(q) - 1.0 + 1.0 * uHits) * 4.0, 2.0)) + 0.4 + 0.15 * sin(uTime * (0.3 + 0.4 * h) + h * 40.0) + 1.5 * pc.a);
    ink += (1.0 - hue) * w;
    return hue * hue * w * 1.6 * (1.0 - max(uOwn[3], 0.0));
  }
  float y = q.y * 8.0 + 0.25 * sin(q.x * 2.0 + 0.1 * uTime), id = floor(y), f = fract(y), h = hash11(id + 11.0);
  vec3 a = kindColour(4.0 * fract(h * 5.0)), b = kindColour(4.0 * fract(hash11(id + 12.0) * 5.0));
  float w = -uOwn[0] * mix(0.08 + 1.1 * h * h, 0.08 + 1.1 * pow(hash11(id + 12.0), 2.0), smoothstep(0.86, 1.0, f)) * (0.6 + 0.9 * pc.a + 0.4 * uLevel);
  a = mix(a, b, smoothstep(0.86, 1.0, f)); a = mix(a, hue, 0.6 * sat(pc.a * 2.0));
  ink += (1.0 - a) * w;
  return a * a * w * (1.0 - max(uOwn[3], 0.0));
}
vec3 lnRing(vec2 p) {
  vec3 ro = vec3(0.0, 0.0, -14.0);
  vec3 rd = normalize(vec3(p * rot(0.05 * sin(uTime * 0.03)), 1.0));
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec3 col = vec3(0.0), hit, way;
  lnSun = normalize(vec3(-0.75, 0.5, -0.45));
  float big = exp2(-2.2 * uOwn[1]), apart = max(uOwn[2], 0.0), hollow = max(-uOwn[2], 0.0), pale = max(uOwn[3], 0.0);
  float calm = max(max(pale, hollow), max(max(abs(uOwn[0]), -uOwn[4]), max(uOwn[6], 0.0)));
  for (int ch = 0; ch < 3; ch++) { // red, green and blue bend a little differently, as through glass
    vec3 d = lnBend(ro, rd, uOwn[4] != 0.0 || calm > 0.0 ? lnPull + 0.03 * (1.0 - 0.8 * calm) * min(lnPull, 1.0) * float(ch - 1) : 1.0 + 0.03 * float(ch - 1), hit, way);
    if (dot(d, d) < 0.5) {
      if (LN_STRAIGHT) { if (uOwn[7] != 0.0) col = lnStone(hit, normalize(way), 9.0, 9.0); break; }
      if (uOwn[7] != 0.0 && dot(hit, hit) > 0.1) col[ch] = lnStone(hit, normalize(way), 9.0, 9.0)[ch]; continue; }
    vec3 ink = vec3(0.0);
    lnFine = smoothstep(0.82, 0.97, dot(d, rd) * inversesqrt(dot(rd, rd)));
    vec3 light = lnBehind(d);
    if (uOwn[0] != 0.0) light += lnFar(d, ink);
    for (int k = 0; k < 5; k++) {
      float fk = float(k), a = uTravel * (0.1 + 0.017 * fk) + fk * 1.2566 + 0.6 * sin(uTime * 0.05 + fk);
      float wide = 0.2 * sin(uTime * 0.043 * (1.0 + 0.3 * fk) + fk * 2.0); // each light swings in behind the hole and out again
      vec3 at = normalize(vec3(wide * cos(a), wide * sin(a), 1.0));
      if (apart > 0.0) at = normalize(mix(at, vec3((0.24 + 0.1 * fk) * cos(a + 1.3 * fk), (0.16 + 0.05 * fk) * sin(a + 1.3 * fk), 1.0), apart));
      if (hollow > 0.0) at = normalize(mix(at, vec3(0.03 * cos(a), 0.03 * sin(a), 1.0), hollow));
      float near = 1.0 - dot(d, at);
      if (hollow > 0.0) { float s = sqrt(max(2.0 * near, 0.0)) - hollow * 0.1 * (fk + 0.6); near = mix(near, 0.5 * s * s * 1.6, hollow); }
      if (uOwn[1] != 0.0) near *= big;
      vec3 c = uKind[k]; c = c * c * 2.4 + c * 0.1;
      vec3 more = c * (0.03 + 3.0 * lv[k] + 0.6 * uCue) * (exp(-near * (5000.0 - 3000.0 * lv[k])) + 0.03 * exp(-near * 500.0));
      if (pale > 0.0) { ink += (1.0 - uKind[k]) * (0.25 + 1.5 * lv[k] + 0.5 * uCue) * (exp(-near * (5000.0 - 3000.0 * lv[k])) + 0.12 * exp(-near * 500.0)); more *= 1.0 - pale; }
      light += more;
    }
    if (pale > 0.0) light *= exp(-ink * 2.0 * pale);
    if (LN_STRAIGHT) { col = light; break; } // the three are one
    col[ch] = light[ch];
  }
  if (uOwn[5] < 0.0) col += lnJet(p, 0.7);
  return col;
}
vec3 render(vec2 p) {
  lnPull = 1.0 + (uOwn[4] > 0.0 ? 1.6 : 1.0) * uOwn[4]; lnBall = 1.0 + 1.0 * max(-uOwn[4], 0.0);
  return screenOf(uVar < 0.5 ? lnHole(p) : lnRing(p));
}
