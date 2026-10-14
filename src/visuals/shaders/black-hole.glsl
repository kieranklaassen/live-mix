// name: Black hole
// a: Disc
// b: Bent ring
// what: A black hole with the piece wound round it as a disc of glowing matter, its far side bent up over the top by gravity; or the hole alone, bending five coloured lights behind it into a ring.
// follows: The disc is one turn of the loop with what plays now at the front, each sound an arc as bright as it is loud; the mix heats the inner edge; a hit sends a ring of heat out through the disc and a cue throws a flare round it; in the ring each light is one kind of sound, as bright as it is loud.
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
  return vec3(0.85, 0.9, 1.0) * st + vec3(0.25, 0.3, 0.6) * dust * dust * 0.06;
}
// The disc where a ray crosses its plane at c, heading along v. Gives light in rgb and how much it hides in a.
vec4 lnDisc(vec3 c, vec3 v) {
  const float rin = 2.6, rout = 9.5;
  float r = length(c.xz);
  if (r < rin || r > rout) return vec4(0.0);
  float ang = atan(c.x, -c.z); // 0 at the front, toward us
  float along = (r - rin) / (rout - rin);
  float turn = uTravel * 0.11;
  // streaks of gas, drawn out round the hole; two layers turning at different rates
  float a1 = ang + turn * 2.2, a2 = ang + turn * 1.3;
  float gas = noise(vec3(cos(a1) * 2.2, sin(a1) * 2.2, r * 3.4)) * 0.6 + 0.4 * noise(vec3(cos(a2) * 4.5, sin(a2) * 4.5, r * 8.0 + 3.0));
  gas = 0.25 + 1.5 * gas * gas;
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
  return vec4(light * gas * beam * edge, a);
}
vec3 lnHole(vec2 p) {
  float around = uTime * 0.035 + 1.0, above = 0.13 + 0.05 * sin(uTime * 0.05);
  vec3 ro = 15.0 * vec3(sin(around) * cos(above), sin(above), -cos(around) * cos(above));
  vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  p = rot(0.3) * (p - vec2(0.0, 0.02));
  vec3 vel = normalize(fw * 1.25 + rt * p.x + up * p.y), pos = ro;
  vec3 hv = cross(pos, vel); float h2 = dot(hv, hv);
  vec3 col = vec3(0.0); float T = 1.0, caught = 0.0;
  // turn the disc so the loop's start stays put while the camera goes round: the front is toward the camera
  float face = atan(ro.x, -ro.z);
  vec3 cs[3], vs[3]; int found = 0; // where the ray crosses the disc: shaded after the march, which is far cheaper
  for (int i = 0; i < 60; i++) {
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < 1.0) { caught = 1.0; break; }
    if (r > 16.0 && dot(pos, vel) > 0.0) break;
    float dt = 0.03 + 0.13 * (r - 1.0);
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    vec3 next = pos + vel * dt;
    if (pos.y * next.y < 0.0 && found < 3) {
      vec3 c = mix(pos, next, pos.y / (pos.y - next.y));
      float rc = dot(c.xz, c.xz);
      if (rc > 6.76 && rc < 90.25) { cs[found] = c; vs[found] = vel; found++; }
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
  return col;
}
// Where a ray ends up looking after passing the hole, or the zero vector if the hole takes it.
vec3 lnBend(vec3 pos, vec3 vel, float pull) {
  vec3 hv = cross(pos, vel); float h2 = dot(hv, hv) * pull;
  for (int i = 0; i < 40; i++) {
    float r2 = dot(pos, pos), r = sqrt(r2);
    if (r < 1.0) return vec3(0.0);
    if (r > 15.0 && dot(pos, vel) > 0.0) break;
    float dt = 0.05 + 0.2 * (r - 1.0);
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    pos += vel * dt;
  }
  return normalize(vel);
}
vec3 lnRing(vec2 p) {
  vec3 ro = vec3(0.0, 0.0, -14.0);
  vec3 rd = normalize(vec3(p * rot(0.05 * sin(uTime * 0.03)), 1.0));
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  vec3 col = vec3(0.0);
  for (int ch = 0; ch < 3; ch++) { // red, green and blue bend a little differently, as through glass
    vec3 d = lnBend(ro, rd, 1.0 + 0.03 * float(ch - 1));
    if (dot(d, d) < 0.5) continue;
    vec3 light = lnBehind(d);
    for (int k = 0; k < 5; k++) {
      float fk = float(k), a = uTravel * (0.1 + 0.017 * fk) + fk * 1.2566 + 0.6 * sin(uTime * 0.05 + fk);
      float wide = 0.2 * sin(uTime * 0.043 * (1.0 + 0.3 * fk) + fk * 2.0); // each light swings in behind the hole and out again
      vec3 at = normalize(vec3(wide * cos(a), wide * sin(a), 1.0));
      float near = 1.0 - dot(d, at);
      vec3 c = uKind[k]; c = c * c * 2.4 + c * 0.1;
      light += c * (0.03 + 3.0 * lv[k] + 0.6 * uCue) * (exp(-near * (5000.0 - 3000.0 * lv[k])) + 0.03 * exp(-near * 500.0));
    }
    col[ch] = light[ch];
  }
  return col;
}
vec3 render(vec2 p) {
  return screenOf(uVar < 0.5 ? lnHole(p) : lnRing(p));
}
