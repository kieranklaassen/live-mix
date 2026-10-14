// name: Dot land
// a: Plain
// b: Twin plains
// what: The piece laid out as a plain of lamps on stems over black glass, flown over toward a glow at the horizon; the crest of tall lamps just ahead is what sounds now.
// follows: The flight keeps pace with the loop; loudness swells and lifts each lamp, highest at the playing line, where the spectrum shapes the crest; a hit or cue sends a ring out over the plain.
const float W = 30.0, LEN = 96.0; // lamps across the room, and along one turn of the loop
const float LIFT = 2.3, AHEAD = 15.0; // how high a lamp can rise, and how far ahead of the camera the playing line lies

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; } // a soft hill, 1 at 0 and nothing past 1

struct Dot { vec3 c; float r; vec3 hue; float loud; float ring; };

// The lamp of one cell: id.x across the room, id.y along the loop. The room repeats to either side, turned over and fainter.
Dot dotAt(vec2 id) {
  float x = id.x + 0.5;
  float u = x / W + 0.5, v = abs(fract(u * 0.5) * 2.0 - 1.0);
  vec2 uv = vec2(fract((id.y + 0.5) / LEN), 1.0 - v);
  vec4 m = piece(uv);
  float far = 1.0 / (1.0 + 1.6 * (u - 0.5) * (u - 0.5));
  Dot d;
  float dz = (fract(uv.x - uLoop + 0.5) - 0.5) * LEN; // lamps ahead of the playing line
  float head = bump(dz * 0.14);
  float crest = head > 0.0 ? head * band(uv.y) * far : 0.0; // the spectrum stands up along the playing line
  d.loud = sat(m.a * (0.6 + 0.6 * uEnergy)) * far;
  d.hue = m.rgb / max(m.a, 0.001);
  d.hue = max(mix(vec3(dot(d.hue, vec3(0.3333))), d.hue, 1.9), 0.0);
  d.hue = mix(vec3(0.5, 0.72, 1.0), d.hue, sat(m.a * 5.0));
  float lift = LIFT * d.loud * sqrt(d.loud) * (0.16 + 0.84 * head) + 1.2 * crest;
  d.loud = max(d.loud, 0.45 * crest);
  float dist = length(vec2(x, dz));
  d.ring = 0.0;
  if (uHits > 0.01) d.ring = uHits * bump((dist - (1.0 - uHits) * 22.0) * 0.4) + 0.7 * uCue * bump((dist - (1.0 - uCue) * 40.0) * 0.25);
  d.r = min(0.42, 0.055 + 0.27 * sqrt(d.loud) + 0.14 * d.ring);
  d.c = vec3(x, d.r + 0.04 + lift + 1.0 * d.ring, id.y + 0.5);
  return d;
}

vec3 shadeDot(Dot d, float ndv) {
  vec3 e = d.hue * d.loud * (0.06 + 1.2 * ndv * ndv * sqrt(ndv));
  float n4 = ndv * ndv; n4 *= n4;
  e += mix(d.hue, vec3(1.0), 0.25) * n4 * n4 * n4 * d.loud * d.loud;
  float rim = 1.0 - ndv;
  e += d.hue * rim * rim * (0.03 + 0.5 * d.loud);
  e += vec3(0.03, 0.04, 0.06) * (0.4 + ndv);
  e += mix(d.hue, vec3(1.0, 0.92, 0.82), 0.3) * d.ring * (0.15 + 0.85 * ndv * ndv);
  return e;
}

// One plain along a ray that starts above it. The glass floor is at y = 0.
vec3 plain(vec3 ro, vec3 rd, float fogK, float nowZ, float most) {
  if (rd.y > -1e-4) return vec3(0.0);
  rd += step(abs(rd), vec3(1e-4)) * 2e-4; // never exactly along a row of cells
  vec3 inv = 1.0 / rd;
  // lamps stand tall only near the playing line: further out the ray can start lower down
  float ringUp = 1.0 * max(uHits, 0.7 * uCue);
  float H = LIFT + 1.2 * most + ringUp + 0.95;
  float t0 = max((H - ro.y) * inv.y, 0.0), tg = -ro.y * inv.y, t1 = tg;
  if (ro.z + rd.z * t0 - nowZ > 12.0) { H = 0.16 * LIFT + 0.9 + ringUp; t0 = max((H - ro.y) * inv.y, 0.0); }
  if (t0 > 130.0) return vec3(0.0);
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  float hh = dot(rd.xz, rd.xz);
  vec3 col = vec3(0.0); float alpha = 0.0, gain = 1.0;
  bool mirrored = false;
  for (int i = 0; i < 46; i++) {
    Dot d = dotAt(id);
    vec3 oc = d.c - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca, dd = sqrt(max(d2, 0.0));
    float fog = exp(-tca * fogK) * gain * step(0.0, tca);
    float px = tca * 1.2 / uRes.y;
    float w = clamp(0.012 + px + (mirrored ? 0.04 : 0.0), 0.004, 0.49 - d.r);
    float cov = smoothstep(d.r + w, d.r - w, dd);
    if (cov > 0.0) {
      float ndv = sqrt(sat(1.0 - d2 / (d.r * d.r)));
      col += (1.0 - alpha) * cov * shadeDot(d, ndv) * fog;
      alpha += (1.0 - alpha) * cov;
    }
    float g = sat((0.5 - dd) / (0.5 - d.r));
    g *= g;
    col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.35 + 0.4 * d.ring) * g * g * fog;
    // the stem the lamp stands on
    float top = d.c.y - d.r;
    if (top > 0.12) {
      float ts = dot(d.c.xz - ro.xz, rd.xz) / hh;
      vec3 q = ro + rd * ts;
      float ds = length(q.xz - d.c.xz), ws = 0.02 + px;
      float cs = bump(ds / (0.03 + ws)) * min(1.0, 0.045 / ws) * step(0.0, q.y) * step(q.y, top);
      col += (1.0 - alpha) * cs * d.hue * (0.25 + 0.5 * d.loud) * (0.35 + 0.65 * q.y / top) * fog;
    }
    if (alpha > 0.985) break;
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) {
      if (mirrored || tg > 70.0) break;
      // the ray has reached the glass: the lamp here pools a little light on it, then the ray carries on a few lamps as its mirror image
      vec3 q = ro + rd * tg;
      vec3 lv = d.c - q; float l2 = dot(lv, lv);
      float pool = d.loud * d.r * d.r * 2.0 * lv.y / (l2 * sqrt(l2) + 0.02) * bump(length(fract(q.xz) - 0.5) * 2.0);
      col += (1.0 - alpha) * d.hue * pool * exp(-tg * fogK);
      float f = 1.0 + rd.y; f *= f;
      gain = 0.22 + 0.6 * f * f;
      ro.y = -ro.y; rd.y = -rd.y;
      t1 = tg + min(H / rd.y, 6.0 / sqrt(hh));
      mirrored = true;
      continue;
    }
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  return col;
}

vec3 render(vec2 p) {
  float twin = step(0.5, uVar);
  float mid = 5.2;
  float camY = mix(7.0, mid, twin) + 0.5 * sin(uTime * 0.13) * (1.0 - twin);
  float nowZ = uLoop * LEN;
  vec3 ro = vec3(4.0 * sin(uTime * 0.07), camY, nowZ - mix(AHEAD, AHEAD * 0.75, twin));
  float pitch = mix(-0.26, 0.0, twin), yaw = 0.07 * sin(uTime * 0.05 + 1.0), roll = mix(0.04, 0.1, twin) * sin(uTime * 0.083);
  p = rot(roll) * p;
  vec3 rd = normalize(vec3(p.x, p.y, mix(0.85, 0.62, twin)));
  rd.yz = rot(pitch) * rd.yz;
  rd.xz = rot(yaw) * rd.xz;
  float fogK = 0.024;
  float most = 0.0;
  for (int i = 0; i < 16; i++) most = max(most, uBands[i]);
  vec3 col;
  if (twin > 0.5 && rd.y > 0.0) { // the twin overhead: the same piece, the room turned over
    vec3 r2 = vec3(-ro.x, 2.0 * mid - ro.y, ro.z), d2 = vec3(-rd.x, -rd.y, rd.z);
    col = plain(r2, d2, fogK, nowZ, most);
  } else col = plain(ro, rd, fogK, nowZ, most);
  // the glow at the horizon, in the colours of what sounds now
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.6), 0.0);
  float ey = abs(rd.y), ex = rd.x;
  float sun = exp(-ey * 40.0 - ex * ex * 5.0) * (0.15 + 0.8 * uLevel) + exp(-ey * 220.0 - ex * ex * 2.0) * (0.3 + 0.8 * uLevel);
  col += now * sun;
  return tone(col * 1.25);
}
