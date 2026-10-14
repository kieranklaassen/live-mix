// name: Liquid metal
// a: Mirror drops
// b: Soap film
// what: Five drops of liquid metal drift, touch and run together over a floor that is the piece, each mirroring tall bars of light in the piece's colours.
// follows: Each kind of sound is one drop, as big as it is loud, and one bar of light, as bright; a hit sends a shiver across the surface, a cue pushes the drops apart.
vec3 gC[5]; float gR[5];
vec3 gShake; // where the shiver starts
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }

void place() {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  float t = uTime * 0.16 + uTravel * 0.05;
  float apart = 1.0 + 0.3 * uCue;
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float a = t * (0.7 + 0.23 * fk) + fk * 2.4, b = t * (0.5 + 0.17 * fk) + fk * 1.7;
    vec3 c = vec3(cos(a) * (0.75 + 0.2 * sin(b * 1.3)), sin(b) * 0.55, sin(a) * (0.7 + 0.2 * cos(b)));
    gC[k] = c * apart * mix(1.0, 1.1, uVar);
    gR[k] = (0.27 + 0.47 * sqrt(lv[k])) * mix(1.0, 1.12, uVar);
  }
  gShake = gC[4] + normalize(gC[4] + 0.01) * gR[4];
}
float map(vec3 p) {
  float d = 9.0;
  for (int k = 0; k < 5; k++) d = smin(d, length(p - gC[k]) - gR[k], 0.42);
  // small beads drifting up through the room; they join a drop when they come near one
  vec3 q = p * 0.85 + vec3(0.3, -uTime * 0.06 - uTravel * 0.04, 0.1);
  q.xz = q.xz * 0.8776 + vec2(-q.z, q.x) * 0.4794;
  vec3 id = floor(q);
  float br = 0.02 + 0.1 * sin(id.x * 1.7 + id.y * 2.3 + id.z * 3.1) + 0.04 * uHigh - 0.3 * sat((dot(p, p) - 2.9) * 0.7);
  d = smin(d, (length(q - id - 0.32 - 0.36 * fract(id.yzx * vec3(0.37, 0.61, 0.79))) - br) / 0.85, 0.2);
  // slow swell of a liquid, then the shiver from a hit: rings running out from where it struck
  d += 0.02 * sin(p.x * 3.1 + uTime * 0.7) * sin(p.y * 3.7 - uTime * 0.5 + p.z * 2.9);
  if (uHits > 0.01) {
    float r = length(p - gShake);
    d += 0.035 * uHits * sin(r * 16.0 - (1.0 - uHits) * 12.0) / (1.0 + r * r);
  }
  return d;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.003;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
// The room: black, with one tall bar of light for each kind of sound standing round, a soft white box overhead,
// a glow along the horizon and, underfoot, the piece itself as a lit floor.
vec3 room(vec3 d, vec3 from, float air) {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  float u = (atan(d.x, d.z) - uTime * 0.03) / TAU * 5.0;
  float fk = floor(u + 0.5);
  float da = abs(u - fk) * TAU / 5.0;         // how far round from the nearest bar
  int k = int(mod(fk, 5.0));
  float w = 0.15 + 0.07 * mod(fk, 2.0);
  float bar = smoothstep(w, w * 0.85, da) * smoothstep(0.7, 0.64, abs(d.y - 0.12 - 0.05 * sin(fk * 3.0)));
  vec3 c = rich(uKind[k], 1.9) * bar * (0.22 + 3.4 * lv[k]) * (0.55 + 0.45 * smoothstep(w, 0.0, da));
  c += rich(uKind[k], 1.2) * smoothstep(0.014, 0.006, abs(da - w - 0.1)) * step(abs(d.y - 0.1), 0.8) * (0.15 + 1.2 * lv[k]);
  vec3 white = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.9, 0.75), uTone);
  float top = smoothstep(0.72, 0.84, d.y);
  c += white * top * (0.4 + 1.6 * uLevel);
  c += white * exp(-abs(d.y + 0.2) * 9.0) * (0.05 + 0.25 * uLevel) * air; // the horizon
  c += vec3(0.05, 0.07, 0.11) * smoothstep(-0.2, 0.9, d.y) * (0.5 + uLevel) * air;
  if (d.y < -0.22) {
    vec3 f = from + d * ((-1.5 - from.y) / d.y);
    vec4 m = piece(vec2(f.x / 9.0 + 0.5, f.z / 6.0 + 0.5));
    vec2 g = abs(fract(vec2(f.x, f.z) * 2.0) - 0.5);
    c += rich(m.rgb, 1.8) * (0.5 + 1.2 * smoothstep(0.38, 0.5, max(g.x, g.y))) * 1.3;
  }
  return c;
}
float march(vec3 ro, vec3 rd, float t, int steps, float tmax) {
  for (int i = 0; i < 28; i++) {
    if (i >= steps) break;
    float d = map(ro + rd * t);
    if (d < 0.004) return t;
    if (t > tmax) break;
    t += d;
  }
  return -1.0;
}
// Which drop a point of the skin belongs to, as a colour.
vec3 tintAt(vec3 p) {
  vec3 c = vec3(0.0); float s = 0.0;
  for (int k = 0; k < 5; k++) { float w = exp(-7.0 * max(length(p - gC[k]) - gR[k], -0.2)); c += uKind[k] * w; s += w; }
  return rich(c / s, 1.5);
}
// The same, with the way the skin faces worked out from the drops themselves (cheap, for things seen second hand).
vec3 facing(vec3 p, out vec3 tint) {
  vec3 n = vec3(0.0), c = vec3(0.0); float s = 0.0;
  for (int k = 0; k < 5; k++) { vec3 v = p - gC[k]; float l = length(v); float w = exp(-7.0 * max(l - gR[k], -0.2)); n += v * (w / l); c += uKind[k] * w; s += w; }
  tint = rich(c / s, 1.5);
  return normalize(n);
}
// Colours of a thin film of soap, from its thickness (nm) and the angle it is seen at.
vec3 film(float nm, float cosv) {
  float ct = sqrt(1.0 - (1.0 - cosv * cosv) / 1.77);
  vec3 ph = 4.0 * PI * 1.33 * nm * ct / vec3(650.0, 530.0, 460.0);
  vec3 c = 0.5 - 0.5 * cos(ph);
  return c * c;
}

vec3 render(vec2 p) {
  place();
  float ca = uTime * 0.07 + 0.6;
  vec3 ro = vec3(sin(ca) * 3.6, 0.5 + 0.3 * sin(uTime * 0.05), cos(ca) * 3.6);
  vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.15 + rt * p.x + up * p.y);
  // nothing lives outside a ball round the middle
  float bq = dot(ro, rd), disc = bq * bq - dot(ro, ro) + 2.2 * 2.2;
  vec3 col = vec3(0.0);
  vec3 back = room(rd, ro, 0.0); back *= 0.05 / (1.0 + 0.6 * max(back.r, max(back.g, back.b)));
  if (disc < 0.0) return screenOf(back);
  float t = march(ro, rd, max(-bq - sqrt(disc), 0.0), 28, -bq + sqrt(disc));
  bool soap = uVar > 0.5;
  if (t < 0.0) {
    // light spilling off the skin into the dark
    return screenOf(back);
  }
  vec3 pos = ro + rd * t, n = normalAt(pos);
  float ndv = sat(dot(n, -rd)), fres = pow(1.0 - ndv, 4.0);
  vec3 rr = reflect(rd, n);
  if (!soap) {
    vec3 tint = mix(vec3(0.92), tintAt(pos), 0.42);
    // the mirror: it sees the room, and the other drops, which see the room in their turn
    float t2 = march(pos + n * 0.02, rr, 0.02, 10, 3.0);
    vec3 seen;
    if (t2 > 0.0) {
      vec3 p2 = pos + n * 0.02 + rr * t2, tint2;
      vec3 m2 = facing(p2, tint2);
      seen = room(reflect(rr, m2), p2, 1.0) * mix(vec3(0.92), tint2, 0.42) * 0.75 + vec3(0.01);
    } else seen = room(rr, pos, 1.0);
    col = seen * tint * (0.82 + 0.18 * fres);
    col += tint * 0.012 + vec3(0.6, 0.8, 1.0) * fres * 0.05;
  } else {
    // a skin of soap: the front, then the far side seen through it
    float swirl = noise(pos * 2.2 + vec3(0.0, uTime * 0.12, uTime * 0.05)) + 0.5 * noise(pos * 5.0 - vec3(uTime * 0.1));
    float nm = 180.0 + 560.0 * sat(0.42 - 0.3 * pos.y + 0.42 * (swirl - 0.75) + 0.3 * uTone - 0.15) + 120.0 * uHits * sin(length(pos - gShake) * 9.0);
    vec3 sheen = film(nm, ndv);
    col = sheen * (0.05 + 0.95 * pow(1.0 - ndv, 1.6)) * (0.5 + 1.2 * uLevel);
    col += room(rr, pos, 1.0) * (0.05 + 0.6 * fres) * (0.6 + 0.4 * sheen);
    // through to the back wall
    float tb = 0.06, db = 0.0;
    for (int i = 0; i < 10; i++) { db = -map(pos + rd * tb); if (db < 0.006 || tb > 4.5) break; tb += db; }
    vec3 tintb;
    vec3 pb = pos + rd * tb, nb = -facing(pb, tintb);
    float nvb = sat(dot(nb, -rd));
    float nmb = 180.0 + 560.0 * sat(0.42 - 0.3 * pb.y + 0.42 * (noise(pb * 2.2 + vec3(0.0, uTime * 0.12, uTime * 0.05)) - 0.5) + 0.3 * uTone - 0.15);
    col += film(nmb, nvb) * (0.03 + 0.6 * pow(1.0 - nvb, 1.6)) * (0.4 + 0.9 * uLevel);
    col += room(reflect(rd, nb), pb, 1.0) * (0.03 + 0.35 * pow(1.0 - nvb, 4.0));
  }
  return screenOf(col);
}
