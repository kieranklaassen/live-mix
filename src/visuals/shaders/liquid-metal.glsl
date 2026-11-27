// name: Liquid metal
// a: Mirror drops
// b: Soap film
// what: Five drops of liquid metal drift, touch and run together over a floor that is the piece, each mirroring tall bars of light in the piece's colours.
// follows: Each kind of sound is one drop, as big as it is loud, and one bar of light, as bright; a hit sends a shiver across the surface, a cue pushes the drops apart.
// own: 0 1 each drop drawn out tall, -1 pressed flat into a disc; 1 1 the five stand one on another in a column, -1 they lie in one level ring; 2 1 broken up into a cloud of many beads, -1 no beads at all and every drop large; 3 the place: 1 a pale studio the colour of the drone with shadows on its floor, -1 open air over still water under a low sun; 4 1 dull clay, -1 clear glass; 5 1 rings with a hole through them, -1 tumbling blocks; 6 the eye: 1 low and close, -1 from straight above; 7 1 turned in fine level ribs, -1 cut in facets
vec3 gC[5]; float gR[5];
vec3 gShake; // where the shiver starts
vec4 lmTurn[5]; vec3 lmSun, lmKey; float lmBig;
#define lmForm (uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0 || uOwn[5] != 0.0 || uOwn[7] > 0.0)
#define lmTall exp2(vec3(0.42, -0.85, 0.42) * (uOwn[0] > 0.0 ? uOwn[0] : uOwn[0] * 1.15))
#define lmSmooth (0.42 * (1.0 - 0.72 * abs(uOwn[5])) * (1.0 - 0.45 * abs(uOwn[1])))
#define lmWarp (1.0 - 0.8 * abs(uOwn[5]))
#define lmLip (1.0 / max(1.0, max(lmTall.x, lmTall.y)))
#define lmCell mix(vec2(0.32, 0.36), vec2(0.38, 0.24), max(uOwn[2], 0.0))
#define lmMany (1.0 + 0.4 * max(uOwn[2], 0.0))
#define lmNone (0.9 * max(-uOwn[2], 0.0))
#define lmJoin (0.2 - 0.12 * max(uOwn[2], 0.0))
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }

void place() {
  float lv[5] = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  float t = uTime * 0.16 + uTravel * 0.05;
  float apart = 1.0 + 0.3 * uCue;
  int k = 0;
  do {
    float fk = float(k);
    float a = t * (0.7 + 0.23 * fk) + fk * 2.4, b = t * (0.5 + 0.17 * fk) + fk * 1.7;
    vec3 c = vec3(cos(a) * (0.75 + 0.2 * sin(b * 1.3)), sin(b) * 0.55, sin(a) * (0.7 + 0.2 * cos(b)));
    gC[k] = c * apart * mix(1.0, 1.1, uVar);
    gR[k] = (0.27 + 0.47 * sqrt(lv[k])) * mix(1.0, 1.12, uVar);
    if (lmForm) {
      float turn = uTime * (0.07 + 0.013 * fk) + fk * 1.9;
      lmTurn[k] = vec4(cos(turn), sin(turn), cos(turn * 0.7 + fk), sin(turn * 0.7 + fk));
      if (uOwn[1] > 0.0) gC[k] = mix(gC[k], vec3(0.16 * sin(b), -1.28 + 0.66 * fk, 0.16 * cos(b)) * vec3(1.0, 0.9 + 0.1 * apart, 1.0), uOwn[1]);
      if (uOwn[1] < 0.0) { float w = t * 0.5 + fk * TAU / 5.0; gC[k] = mix(gC[k], vec3(1.25 * cos(w) * apart, 0.06 * sin(a), 1.25 * sin(w) * apart), -uOwn[1]); }
      gC[k].y *= 1.0 - 0.45 * max(uOwn[0], 0.0);
      gR[k] *= 1.0 - 0.5 * max(uOwn[2], 0.0);
      gR[k] = mix(gR[k], 0.3 + gR[k] * 0.78, max(-uOwn[2], 0.0));
      gR[k] *= 1.0 - 0.12 * max(uOwn[1], 0.0) - 0.27 * max(-uOwn[1], 0.0);
    }
  } while (++k < 5);
  lmBig = 0.55 * abs(uOwn[5]) * max(max(max(gR[0], gR[1]), max(gR[2], gR[3])), gR[4]) + 0.02;
  gShake = gC[4] + normalize(gC[4] + 0.01) * gR[4];
}
// A drop of another form: q from its middle, r how large.
float drop(vec3 w, float r, vec4 tu) {
  w.xy = vec2(w.x * tu.x - w.y * tu.y, w.x * tu.y + w.y * tu.x);
  w.yz = vec2(w.y * tu.z - w.z * tu.w, w.y * tu.w + w.z * tu.z);
  if (uOwn[5] > 0.0) return length(vec2(length(w.xz) - 1.15 * r * uOwn[5], w.y)) - r * (1.0 - 0.66 * uOwn[5]);
  vec3 e = abs(w) - 0.72 * r;
  return mix(length(w) - r, length(max(e, 0.0)) + min(max(e.x, max(e.y, e.z)), 0.0) - 0.07 * r - 0.02, -uOwn[5]);
}
float map(vec3 p) {
  float d = 9.0;
  int k = 0;
  do d = smin(d, length((p - gC[k]) * lmTall) - gR[k], lmSmooth); while (++k < 5);
  if (uOwn[5] != 0.0) {
    d -= lmBig;                                     // far off, no more than that it is no nearer than this
    float off = d;
    if (off < 0.46) {
      d = 9.0; k = 0;
      do d = smin(d, drop((p - gC[k]) * lmTall, gR[k], lmTurn[k]), lmSmooth); while (++k < 5);
    }
  }
  d *= lmLip;
  // small beads drifting up through the room; they join a drop when they come near one
  if (lmNone < 0.4) {                             // past that none is left to be seen
  vec3 q = p * 0.85 + vec3(0.3, -uTime * 0.06 - uTravel * 0.04, 0.1);
  q.xz = q.xz * 0.8776 + vec2(-q.z, q.x) * 0.4794;
  q *= lmMany;
  vec3 id = floor(q), to = q - id - lmCell.x - lmCell.y * fract(id.yzx * vec3(0.37, 0.61, 0.79));
  float lump = sin(id.x * 1.7 + id.y * 2.3 + id.z * 3.1), wall = 9.0;
  float br = 0.02 + 0.1 * lump + 0.04 * uHigh - 0.3 * sat((dot(p, p) - 2.9) * 0.7);
  if (uOwn[2] > 0.0) {
    vec3 pc = -to / (0.85 * lmMany), edge = 0.5 - abs(q - id - 0.5);
    pc.xz = pc.xz * 0.8776 + vec2(pc.z, -pc.x) * 0.4794;
    pc += p;                                      // where the middle of the bead is
    wall = (min(edge.x, min(edge.y, edge.z)) + 0.05 + 0.07 * uOwn[2]) / (0.95 * lmMany);
    br = mix(0.03 + 0.1 * lump, 0.14 + 0.085 * lump, uOwn[2]) + 0.03 * uHigh - 0.3 * sat((dot(pc, pc) - 2.4) * 0.75);
  }
  d = smin(d, (length(to) - br) / (0.85 * lmMany) + lmNone, lmJoin);
  if (uOwn[2] > 0.0) d = min(d, mix(d, wall, smoothstep(0.0, 0.2, uOwn[2])));
  }
  // slow swell of a liquid, then the shiver from a hit: rings running out from where it struck
  float sx = sin(p.x * 3.1 + uTime * 0.7);
  d += 0.02 * lmWarp * sx * sin(p.y * 3.7 - uTime * 0.5 + p.z * 2.9);
  if (uOwn[7] > 0.0) d += 0.024 * uOwn[7] * smoothstep(0.12, 0.03, d) * sin(p.y * 30.0 + sx + 2.0 * p.z);
  if (uHits > 0.01) {
    float r = length(p - gShake);
    d += 0.035 * uHits * sin(r * 16.0 - (1.0 - uHits) * 12.0) / (1.0 + r * r);
  }
  return d;
}
vec3 normalAt(vec3 p) {
  vec3 n = vec3(0.0);
  int i = 0;
  do { vec3 e = (i == 3 ? vec3(1.0) : i == 0 ? vec3(1.0, -1.0, -1.0) : i == 1 ? vec3(-1.0, -1.0, 1.0) : vec3(-1.0, 1.0, -1.0)) * 0.003; n += e * map(p + e); } while (++i < 4);
  return normalize(n);
}
// The other places: a lit studio, or open air over water. The colour seen that way, with no drops in it.
vec3 studio(vec3 d, vec3 from) {
  vec3 cloth = mix(vec3(0.86, 0.84, 0.8), uKind[0], 0.62); cloth *= cloth;
  float lit = 0.62 + 0.4 * smoothstep(-0.5, 0.9, dot(d, lmKey)) + 0.12 * uLevel;
  vec3 wall = mix(cloth, cloth * mix(vec3(1.0), uKind[1] + 0.25, 0.5), smoothstep(-0.1, 0.8, d.y)) * lit;
  if (d.y > -0.02) return wall;
  float t = (-1.5 - from.y) / d.y;
  vec3 f = from + d * t;
  float far = smoothstep(2.5, 7.5, length(f.xz));
  float sh = 1.0;
  int k = 0;
  do {
    float h = max(gC[k].y + 1.5, 0.05), r = gR[k] / lmTall.x * (1.0 + 0.16 * h);
    vec2 o = f.xz - gC[k].xz + lmKey.xz / max(lmKey.y, 0.3) * h * 0.8;
    sh *= 1.0 - 0.62 / (1.0 + 0.35 * h * h) * exp(-dot(o, o) / (r * r) * 1.1);
  } while (++k < 5);
  vec4 m = piece(vec2(f.x / 7.0 + 0.5, f.z / 5.0 + 0.5));
  m.a *= smoothstep(3.5, 2.6, abs(f.x)) * smoothstep(2.5, 1.7, abs(f.z));
  vec3 ink = m.rgb / max(max(m.r, max(m.g, m.b)), 0.03) * 0.8;
  vec3 ground = cloth * 1.12 * mix(vec3(1.0), ink * ink * 1.2 + 0.1, 0.62 * smoothstep(0.02, 0.8, m.a)) * (0.96 + 0.06 * noise(f.xz * 40.0));
  return mix(ground * sh * (0.72 + 0.4 * smoothstep(-1.0, 1.0, dot(f.xz, normalize(lmKey.xz)) / (1.2 + length(f.xz)))), wall, far);
}
vec3 skyAt(float y, float by) {
  vec3 low = mix(uKind[1], uKind[3], 0.35 + 0.3 * by), high = uKind[0] * 0.75;
  vec3 c = mix(low * low * 1.15, high * high * 0.8, smoothstep(0.0, 0.62, sqrt(y * sqrt(y)))) * (0.75 + 0.35 * uLevel);
  float b2 = by * by, b8 = b2 * b2; b8 *= b8;
  return c + mix(uKind[3], vec3(1.0, 0.9, 0.75), 0.5) * (1.6 * smoothstep(0.9974, 0.9982, by) + 0.55 * pow(by, 60.0) + 0.22 * b8) * (0.7 + 0.5 * uLevel);
}
vec3 open_(vec3 d, vec3 from) {
  vec3 r = d, c = vec3(0.0), n = vec3(0.0, 1.0, 0.0);
  float fr = 1.0, under = step(d.y, 0.0);
  float t = min((-1.5 - from.y) / min(d.y, -1e-3), 200.0);
  vec3 f = from + d * t;
  if (d.y < 0.0) {
    float calm = 0.16 * exp(-t * 0.16);
    vec2 w = f.xz * 1.7;
    vec2 rip = vec2(noise(w * vec2(1.0, 2.3) + uTime * 0.21), noise(w * vec2(1.9, 1.1) + 31.0 - uTime * 0.18)) - 0.5 + 0.5 * vec2(noise(w * 4.1 - uTime * 0.3), noise(w * 4.3 + 11.0 + uTime * 0.27)) - 0.25;
    r = reflect(d, normalize(vec3(rip.x * calm, 1.0, rip.y * calm)));
    r.y = abs(r.y) + 0.005;
    fr = 0.25 + 0.75 * pow(1.0 - sat(-d.y), 3.0);
    vec4 m = piece(vec2(f.x / 9.0 + 0.5, f.z / 6.0 + 0.5));
    c = m.rgb * m.rgb * 0.75 * (1.0 - fr * 0.6) + uKind[0] * uKind[0] * 0.07 * (1.0 - fr);
  }
  float y = max(r.y, 0.0), by = sat(dot(r, lmSun));
  vec3 sky = skyAt(y, by);
  vec2 cl = r.xz / (y + 0.16), az = normalize(r.xz + 1e-4);
  float streak = smoothstep(0.5, 0.8, noise(cl * 0.8 + uTime * 0.012) * 0.65 + 0.35 * noise(cl * 2.3 + 9.0)) * smoothstep(0.02, 0.2, y);
  sky += streak * mix(uKind[1] * uKind[1], vec3(0.8), 0.2) * (0.16 + 0.35 * by);
  float hill = 0.032 + 0.077 * noise(az * 3.1 + 7.0) + 0.018 * noise(az * 17.0), soft = 0.004 + 0.008 * under;
  vec3 land = mix(uKind[0] * uKind[0] * 0.14, mix(uKind[1], uKind[3], 0.4) * mix(uKind[1], uKind[3], 0.4), 0.35);
  return c + mix(sky, land, smoothstep(soft, -soft, r.y - hill)) * mix(1.0, fr * 0.92, under);
}
// The same places as a mirror has them: no more of them than is seen in a curve.
vec3 mirrored(vec3 d, vec3 from) {
  vec3 cloth = mix(vec3(0.86, 0.84, 0.8), uKind[0], 0.62), c;
  if (uOwn[3] > 0.0) {
    c = cloth * cloth * (0.62 + 0.4 * smoothstep(-0.5, 0.9, dot(d, lmKey)) + 0.12 * uLevel) * mix(1.0, 0.8, smoothstep(0.0, -0.8, d.y));
    float dark = smoothstep(0.12, 0.5, dot(d, vec3(sin(uTime * 0.07 + 1.45), 0.02, cos(uTime * 0.07 + 1.45)))) * smoothstep(0.75, 0.5, abs(d.y - 0.05));
    c *= 1.0 - 0.9 * dark;
    c += vec3(1.0, 0.98, 0.94) * smoothstep(0.80, 0.9, dot(d, lmKey)) * 0.9;
  } else {
    float a = d.x * 3.0 + d.z * 2.0, hill = 0.07 + 0.03 * sin(a) + 0.02 * sin(a * 2.3 + d.z * 4.0);
    float fr = d.y < 0.0 ? 0.25 + 0.75 * pow(1.0 - sat(-d.y), 3.0) : 1.0;
    vec3 land = mix(uKind[0] * uKind[0] * 0.14, mix(uKind[1], uKind[3], 0.4) * mix(uKind[1], uKind[3], 0.4), 0.35);
    c = mix(skyAt(abs(d.y), sat(dot(vec3(d.x, abs(d.y), d.z), lmSun))), land, smoothstep(0.012, -0.012, abs(d.y) - hill)) * fr + uKind[0] * uKind[0] * 0.07 * (1.0 - fr);
  }
  return c;
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
  if (uOwn[3] != 0.0) {
    // the bars stay, thinner, as cards of colour; behind the eye it is dark
    vec3 e = mirrored(d, from);
    if (uOwn[3] > 0.0) e = mix(e, e * mix(vec3(1.0), uKind[k] * uKind[k], 0.9), bar * (0.35 + 0.65 * lv[k]));
    else e += rich(uKind[k], 1.3) * bar * lv[k] * 0.55 * smoothstep(-0.05, 0.2, d.y);
    c = mix(c, e, abs(uOwn[3]));
  }
  return c;
}
float march(vec3 ro, vec3 rd, float t, int steps, float tmax) {
  int i = 0;
  do {
    float d = map(ro + rd * t);
    if (d < 0.004) return t;
    if (t > tmax) break;
    t += d;
  } while (++i < steps);
  return -1.0;
}
// Which drop a point of the skin belongs to, as a colour.
vec3 tintAt(vec3 p) {
  vec3 c = vec3(0.0); float s = 0.0;
  int k = 0;
  do { float w = exp(-7.0 * max(length(p - gC[k]) - gR[k], -0.2)); c += uKind[k] * w; s += w; } while (++k < 5);
  return rich(c / s, 1.5);
}
// The same, with the way the skin faces worked out from the drops themselves (cheap, for things seen second hand).
vec3 facing(vec3 p, out vec3 tint) {
  vec3 n = vec3(0.0), c = vec3(0.0); float s = 0.0;
  int k = 0;
  do { vec3 v = p - gC[k]; float l = length(v); float w = exp(-7.0 * max(l - gR[k], -0.2)); n += v * (w / l); c += uKind[k] * w; s += w; } while (++k < 5);
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

// Of another stuff than a mirror or a film: dull clay, or clear glass.
vec3 stuffAt(vec3 was, vec3 pos, vec3 rd, vec3 n, float ndv, vec3 mirror, vec3 far, vec3 tb3, float tb, vec3 ri) {
  vec3 tint = tintAt(pos);
  vec3 made = was;
  if (uOwn[4] > 0.0) {
    float wrap = sat(dot(n, lmKey) * 0.62 + 0.38), up = 0.5 + 0.5 * n.y;
    float shut = sat(0.5 + 2.2 * map(pos + n * 0.22)) * sat(0.45 + 1.3 * map(pos + lmKey * 0.42 + n * 0.05));
    shut = mix(shut, 0.85, sat(uOwn[2] * 3.0));
    vec3 body = tint * (0.35 + 0.65 * tint);
    vec3 c = body * (1.15 * wrap * wrap * (0.35 + 0.65 * shut) + 0.16 * up * shut + 0.05) * (0.8 + 0.4 * uLevel);
    c += body * vec3(1.0, 0.7, 0.5) * 0.12 * smoothstep(0.15, 0.4, wrap) * smoothstep(0.65, 0.4, wrap);   // light that has gone in a little
    c += 0.10 * pow(1.0 - ndv, 3.0) * (0.4 + wrap) * mix(vec3(1.0), tint, 0.5);
    c += vec3(1.0, 0.96, 0.9) * 0.16 * pow(sat(dot(reflect(rd, n), lmKey)), 14.0);
    if (uOwn[3] < 0.0) c = mix(c, c * (skyAt(abs(n.y), sat(dot(n, lmSun))) * 1.4 + 0.45), -uOwn[3]);
    made = mix(was, c, uOwn[4]);
  }
  if (uOwn[4] < 0.0) {
  vec3 c = far * mix(vec3(1.0), 0.15 + 0.95 * mix(tint, tb3, 0.4), sat(0.35 + 0.4 * tb)) * exp(-(1.0 - tint) * tb * 0.5);
  c += tint * tint * (0.03 + 0.16 * uLevel) * sat(tb * 0.6);
  float fr = 0.05 + 0.75 * pow(1.0 - ndv, 4.0);
  c = c * (1.0 - fr) + mirror * fr * 1.1;
  c *= 1.0 - 0.45 * pow(1.0 - ndv, 3.0) * max(uOwn[3], 0.0);
  c += vec3(1.0, 0.97, 0.92) * (0.9 * pow(sat(dot(reflect(rd, n), lmKey)), 60.0) + 0.35 * pow(sat(dot(ri, lmKey)), 3.0) * tint);
  made = mix(was, c, -uOwn[4]);
  }
  return made;
}
// What is seen past the drops; on water, the drops again upside down.
vec3 beyond(vec3 was, vec3 rd, vec3 ro) {
  vec3 all = was;
  if (uOwn[3] != 0.0) {
  vec3 c = uOwn[3] > 0.0 ? studio(rd, ro) : open_(rd, ro);
  if (uOwn[3] < 0.0 && rd.y < -0.03) {
    float t = (-1.5 - ro.y) / rd.y;
    vec3 f = ro + rd * t, r = vec3(rd.x, -rd.y, rd.z);
    r = normalize(r + 0.035 * vec3(noise(f.xz * vec2(3.0, 5.0) + uTime * 0.3) - 0.5, 0.0, noise(f.xz * vec2(4.0, 3.0) - uTime * 0.26) - 0.5));
    float bq = dot(f, r), disc = bq * bq - dot(f, f) + 2.2 * 2.2;
    if (disc > 0.0) {
      float ts = march(f, r, max(-bq - sqrt(disc), 0.0), 18, -bq + sqrt(disc));
      if (ts > 0.0) {
        vec3 tint, ps = f + r * ts, ns = facing(ps, tint);
        vec3 seen = uOwn[4] > 0.0 ? tint * tint * (0.25 + 0.5 * sat(dot(ns, lmKey))) : mirrored(reflect(r, ns), ps) * mix(vec3(0.9), tint, 0.5);
        c = mix(c, seen * (uVar > 0.5 && uOwn[4] <= 0.0 ? 0.75 : 1.0), 0.62 * (0.35 + 0.65 * pow(1.0 - sat(-rd.y), 2.0)) * (uVar > 0.5 && uOwn[4] <= 0.0 ? 0.45 : 1.0));
      }
    }
  }
  all = mix(was, c, abs(uOwn[3]));
  }
  return all;
}
vec3 render(vec2 p) {
  place();
  float ca = uTime * 0.07 + 0.6;
  vec3 ro = vec3(sin(ca) * 3.6, 0.5 + 0.3 * sin(uTime * 0.05), cos(ca) * 3.6);
  vec3 ta = vec3(0.0);
  float lens = 1.15;
  if (uOwn[6] > 0.0) { ro = mix(ro, vec3(sin(ca) * 2.9, -1.02, cos(ca) * 2.9), uOwn[6]); ta.y = 0.16 * uOwn[6]; lens += 0.1 * uOwn[6]; }
  if (uOwn[6] < 0.0) { ro = mix(ro, vec3(sin(ca) * 0.05, 3.9, cos(ca) * 0.05), sin(0.5 * PI * -uOwn[6])); lens += 0.25 * -uOwn[6]; }
  lmSun = normalize(vec3(-sin(ca + 0.4), 0.1, -cos(ca + 0.4)));
  lmKey = normalize(vec3(sin(ca - 1.15), 1.0, cos(ca - 1.15)));
  if (uOwn[3] < 0.0) lmKey = normalize(mix(lmKey, vec3(sin(ca - 1.9), 0.55, cos(ca - 1.9)), -uOwn[3]));
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * lens + rt * p.x + up * p.y);
  // nothing lives outside a ball round the middle
  float bq = dot(ro, rd), disc = bq * bq - dot(ro, ro) + 2.2 * 2.2;
  vec3 col = vec3(0.0);
  vec3 back = room(rd, ro, 0.0); back *= 0.05 / (1.0 + 0.6 * max(back.r, max(back.g, back.b)));
  back *= 1.0 + max(-uOwn[6], 0.0);
  vec3 past = beyond(back, rd, ro);
  if (disc < 0.0) return screenOf(past);
  float t = march(ro, rd, max(-bq - sqrt(disc), 0.0), lmForm ? (uOwn[2] > 0.3 ? 72 : 40) : 28, -bq + sqrt(disc));
  bool soap = uVar > 0.5;
  if (t < 0.0) {
    // light spilling off the skin into the dark
    return screenOf(past);
  }
  vec3 pos = ro + rd * t, n = normalAt(pos);
  if (uOwn[7] < 0.0) {                          // facets: the way it faces goes in steps
    vec3 m = n * 1.7, w = floor(m + 0.5);
    n = normalize(mix(n, normalize(w + m * 0.05 + vec3(0.013, 0.021, 0.017)), -uOwn[7]));
    if (dot(n, rd) > -0.02) n = normalize(n - rd * (dot(n, rd) + 0.03));
  }
  float ndv = sat(dot(n, -rd)), fres = pow(1.0 - ndv, 4.0);
  vec3 rr = reflect(rd, n);
  vec3 dirA = rr, fromA = pos, tint2 = vec3(0.0), ri = rd, tintb = vec3(0.0), far = vec3(0.0), nb = -n, pb = pos;
  float t2 = -1.0, tb = 0.06, db = 0.0;
  if (!soap && uOwn[4] < 1.0) {
    // the mirror: it sees the room, and the other drops, which see the room in their turn
    t2 = march(pos + n * 0.02, rr, 0.02, 10, 3.0);
    if (t2 > 0.0) {
      fromA = pos + n * 0.02 + rr * t2;
      vec3 m2 = facing(fromA, tint2);
      dirA = reflect(rr, m2);
    }
  }
  if (soap || uOwn[4] < 0.0) {
    // through to the back wall
    if (!soap) ri = refract(rd, n, 0.74);
    int i = 0;
    do { db = -map(pos + ri * tb); if (db < 0.006 || tb > 4.5) break; tb += db; } while (++i < 10);
    pb = pos + ri * tb; nb = -facing(pb, tintb);
    vec3 dirB = reflect(rd, nb);
    if (uOwn[4] < 0.0) {
      dirB = refract(ri, nb, soap ? 1.1 : 1.3);
      if (dot(dirB, dirB) < 0.01) dirB = reflect(ri, nb);
    }
    far = room(dirB, pb, 1.0);
  }
  vec3 mirror = room(dirA, fromA, 1.0);
  if (!soap) {
    vec3 tint = mix(vec3(0.92), tintAt(pos), 0.42);
    vec3 seen = mirror;
    if (t2 > 0.0) seen = mirror * mix(vec3(0.92), tint2, 0.42) * 0.75 + vec3(0.01);
    col = seen * tint * (0.82 + 0.18 * fres);
    col += tint * 0.012 + vec3(0.6, 0.8, 1.0) * fres * 0.05;
  } else {
    // a skin of soap: the front, then the far side seen through it
    float swirl = noise(pos * 2.2 + vec3(0.0, uTime * 0.12, uTime * 0.05)) + 0.5 * noise(pos * 5.0 - vec3(uTime * 0.1));
    float nm = 180.0 + 560.0 * sat(0.42 - 0.3 * pos.y + 0.42 * (swirl - 0.75) + 0.3 * uTone - 0.15) + 120.0 * uHits * sin(length(pos - gShake) * 9.0);
    vec3 sheen = film(nm, ndv);
    col = sheen * (0.05 + 0.95 * pow(1.0 - ndv, 1.6)) * (0.5 + 1.2 * uLevel);
    col += mirror * (0.05 + 0.6 * fres) * (0.6 + 0.4 * sheen);
    float nvb = sat(dot(nb, -rd));
    float nmb = 180.0 + 560.0 * sat(0.42 - 0.3 * pb.y + 0.42 * (noise(pb * 2.2 + vec3(0.0, uTime * 0.12, uTime * 0.05)) - 0.5) + 0.3 * uTone - 0.15);
    col += film(nmb, nvb) * (0.03 + 0.6 * pow(1.0 - nvb, 1.6)) * (0.4 + 0.9 * uLevel);
    col += far * (0.03 + 0.35 * pow(1.0 - nvb, 4.0));
    if (uOwn[3] != 0.0) {                       // the place is seen through the skin
      vec3 through = past * abs(uOwn[3]) * (0.9 - 0.75 * pow(1.0 - ndv, 2.5));
      if (uOwn[3] > 0.0) through *= mix(vec3(1.0), 0.35 + 1.3 * sheen, 0.4 + 0.5 * pow(1.0 - ndv, 1.5));
      col = col * (1.0 - 0.45 * max(uOwn[3], 0.0)) + through;
    }
  }
  if (uOwn[4] != 0.0) {
    vec3 other = stuffAt(col, pos, rd, n, ndv, t2 > 0.0 ? mirror * 0.7 : mirror, far, tintb, tb, ri);
    if (soap) {                                 // a film still lies over it, as on a pearl
      float nm = 200.0 + 520.0 * sat(0.5 - 0.25 * pos.y + 0.5 * (noise(pos * 1.6 + vec3(0.0, uTime * 0.08, 0.0)) - 0.5));
      other = mix(other, other * (0.45 + 1.2 * film(nm, ndv)) + film(nm, ndv) * 0.10 * pow(1.0 - ndv, 1.5) * (0.5 + uLevel), abs(uOwn[4]));
    }
    col = other;
  }
  return screenOf(col);
}
