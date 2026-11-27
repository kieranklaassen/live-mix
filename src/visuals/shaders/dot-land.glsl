// name: Dot land
// a: Plain
// b: Twin plains
// what: The piece laid out as a plain of lamps on stems over black glass, flown over toward a glow at the horizon; the crest of tall lamps just ahead is what sounds now.
// follows: The flight keeps pace with the loop; loudness swells and lifts each lamp, highest at the playing line, where the spectrum shapes the crest; a hit or cue sends a ring out over the plain.
// own: 0 1 half as many again and finer, -1 a third of them and great; 1 1 drawn up into reeds that sway, -1 flat round pads; 2 1 the plain rises and falls in hills, -1 everything lies low on the ground; 3 1 no stems, the lamps hover at every height, -1 thick trunks; 4 1 pale snow and a white sky, -1 water under a dusk sky with a low sun; 5 1 matte, lit from one side with long shadows, -1 dark against the light with bright edges; 6 1 strewn and many gone, -1 planted in rows that run away from you; 7 1 the eye high above and looking down (b: the two plains far apart), -1 low down among them
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

#define own0 uOwn[0]
#define own1 uOwn[1]
#define own2 uOwn[2]
#define own3 uOwn[3]
#define own4 uOwn[4]
#define own5 uOwn[5]
#define own6 uOwn[6]
#define own7 uOwn[7]
// how many times as many, W and LEN as this world has them, how much taller, and how high the tallest can be
#define gMany exp2(own0 * (own0 > 0.0 ? 0.6 : 1.5))
#define gLen floor(LEN * gMany + 0.5)
#define gW (W * gMany)
#define gUp mix(1.0, gMany, 0.6)
#define gTop (0.95 + gUp * (3.4 * max(own2, 0.0) + 3.3 * max(own3, 0.0) + 0.85 * max(-own3, 0.0)) + 2.6 * max(own1, 0.0))
#define gDrawn exp2(own1 * (own1 > 0.0 ? 2.6 : 2.7)) // how tall a lamp is beside its width
#define gSteps int(46.0 - 30.0 * sat(max(own3, 0.0) + 0.7 * max(own1, 0.0) + 0.6 * max(own2, 0.0) + 0.5 * max(-own0, 0.0)))
#define world (abs(own0) + abs(own1) + abs(own2) + abs(own3) + abs(own4) + abs(own5) + abs(own6) + abs(own7) > 0.0)
vec3 gSun;
float gDisc; // whether the sun's disc is seen

float tri(float x) { x = abs(fract(x) - 0.5) * 2.0; return x * x * (3.0 - 2.0 * x); } // a smooth wave, 0 to 1

struct Lamp { vec3 c; float r; vec3 hue; float loud; float ring; float tall; float h; };

Lamp lampAt(vec2 id) {
  float x = id.x + 0.5, u = x / gW + 0.5, v = abs(fract(u * 0.5) * 2.0 - 1.0), zc = mod(id.y, gLen);
  vec2 uv = vec2((zc + 0.5) / gLen, 1.0 - v);
  vec4 m = texture(uMap, uv);
  float far = 1.0 / (1.0 + 1.6 * (u - 0.5) * (u - 0.5));
  float h = hash21(vec2(id.x, zc)), h2 = fract(h * 57.31 + 0.37), strewn = max(own6, 0.0), rows = max(-own6, 0.0), reed = max(own1, 0.0);
  Lamp d;
  float dz = (fract(uv.x - uLoop + 0.5) - 0.5) * LEN, head = bump(dz * 0.14);
  float crest = head * band(uv.y) * far, sound = sat(m.a * (0.6 + 0.6 * uEnergy)) * far;
  vec3 hue = m.rgb / max(m.a, 0.001);
  hue = max(mix(vec3(dot(hue, vec3(0.3333))), hue, 1.9), 0.0);
  vec3 rest = mix(mix(uKind[1], uKind[0], smoothstep(0.15, 0.85, uv.y)), uKind[2], 0.5 * h2 * h2);
  d.hue = mix(rest, hue, smoothstep(0.0, 0.25, m.a));
  float lift = LIFT * sound * sqrt(sound) * (0.16 + 0.84 * head) + 1.2 * crest;
  lift *= 1.0 - 0.94 * max(-own2, 0.0);
  float hill = tri(3.0 * uv.x + u * 0.8) * (0.1 + 0.9 * tri(2.0 * uv.x - u * 0.5 + 0.16));
  lift += max(own2, 0.0) * (2.9 * hill + 0.5 * h2);
  lift += max(own3, 0.0) * (0.4 + 2.6 * h2 + 0.5 * tri(uTime * (0.05 + 0.05 * h) + h * 7.0));
  lift = (lift + 0.55 * max(-own3, 0.0) * (0.5 + h)) * gUp;
  float dist = length(vec2(x / gMany, dz));
  d.ring = (uHits > 0.01 ? uHits * bump((dist - (1.0 - uHits) * 22.0) * 0.4) + 0.7 * uCue * bump((dist - (1.0 - uCue) * 40.0) * 0.25) : 0.0) + 0.25 * uHits * step(0.75, h2);
  d.loud = max(sqrt(sound * sound + 0.05), 0.45 * crest);
  float r0 = 0.055 + 0.27 * sqrt(max(sound, 0.45 * crest)) + 0.1 * d.ring, r = sqrt(r0 * r0 + 0.02);
  float kept = mix(1.0, smoothstep(0.36, 0.46, fract(h * 31.7 + h2)), strewn) * (1.0 - rows * step(0.5, mod(id.x, 3.0)));
  r *= mix(1.0, 0.55 + 0.7 * h2, strewn) * mix(1.0, 0.5, reed) * (1.0 + 0.22 * rows);
  d.loud *= kept; d.ring *= kept; lift *= kept;
  r = mix(r, 0.3 + 0.42 * r, max(-own1, 0.0));
  d.r = clamp(r * kept, 0.004, 0.45);
  float half_ = d.r * gDrawn + 0.5 * reed * lift;
  d.tall = half_ / d.r; d.h = h;
  vec2 by = (vec2(h, h2) - 0.5) * 2.0 * strewn * max(0.46 - d.r, 0.0);
  by.x += reed * min(0.3, 0.46 - d.r) * (2.0 * tri(uTime * 0.11 + 9.0 * uv.x + x * 0.037 + 0.16 * h) - 1.0);
  by.x = clamp(by.x, d.r - 0.48, 0.48 - d.r);
  d.c = vec3(x + by.x, half_ + 0.03 + lift * (1.0 - reed) + 0.6 * d.ring * gUp * (1.0 - reed), id.y + 0.5 + by.y);
  return d;
}

// The sky of a world.
vec3 sky(vec3 rd) {
  float y = max(rd.y, 0.0), pale = max(own4, 0.0), dusk = max(-own4, 0.0);
  vec3 up = uKind[1] * uKind[1], low = mix(uKind[2], uKind[3], 0.55); low *= low;
  vec3 c = dusk * (mix(up * 0.28, low * 0.85, exp(-y * 4.5)) + low * exp(-y * 14.0) * 0.35);
  float s = dot(normalize(rd), normalize(vec3(0.16, 0.045, 1.0)));
  c += dusk * uKind[3] * uKind[3] * (0.5 * exp((s - 1.0) * 60.0) + 1.3 * smoothstep(0.99935, 0.9996, s) * gDisc) * (0.6 + 0.5 * uLevel);
  c *= 0.94 + 0.12 * noise(vec2(rd.x * 5.0 + uTime * 0.01, y * 26.0));
  c += pale * mix(vec3(0.8, 0.79, 0.77), 0.2 + 0.6 * uKind[1], 0.15 + 0.4 * smoothstep(0.0, 0.5, y));
  return c;
}

// A lamp of a world: n its face, v from the eye.
vec3 stuff(Lamp d, vec3 n, vec3 v) {
  Dot was; was.c = d.c; was.r = d.r; was.hue = d.hue; was.loud = d.loud; was.ring = d.ring;
  float ndv = sat(-dot(n, v)), pale = max(own4, 0.0), dark = max(-own5, 0.0), day = max(max(own5, 0.0), pale * (1.0 - dark));
  vec3 c = shadeDot(was, ndv), pig = d.hue * (0.3 + 0.7 * d.hue);
  float wrap = sat(dot(n, gSun) * 0.7 + 0.3);
  vec3 clay = pig * (0.14 + 0.2 * (0.5 + 0.5 * n.y) * (0.5 + pale) + 1.15 * wrap * wrap) * (0.7 + 0.6 * d.loud) * (0.85 + 0.3 * d.h);
  clay += pow(sat(dot(reflect(v, n), gSun)), 20.0) * 0.14 + mix(d.hue, vec3(1.0, 0.92, 0.82), 0.3) * d.ring * 0.9 + d.hue * d.loud * d.loud * 0.12 * (1.0 - pale);
  c = mix(c, clay, day);
  float rim = 1.0 - ndv; rim *= rim;
  vec3 edge = pig * (0.006 + 0.035 * d.loud * d.loud) + mix(d.hue, uKind[3], 0.5) * rim * rim * (0.35 + 0.9 * d.loud) * (0.4 + 0.6 * sat(0.5 + 0.6 * n.y)) + d.hue * d.ring * 0.7;
  return mix(c, edge, dark);
}

// The lamp of cell k.xy along a ray (k.z: along its mirror image).
vec3 drawn(vec3 k, vec3 ro, vec3 rd, float fogK, vec3 haze) {
  if (k.z > 0.5) { ro.y = -ro.y; rd.y = -rd.y; }
  Lamp d = lampAt(k.xy);
  vec3 sq = vec3(1.0, 1.0 / d.tall, 1.0), o2 = (d.c - ro) * sq, r2 = rd * sq;
  float rr = dot(r2, r2), tca = dot(o2, r2) / rr, d2 = max(dot(o2, o2) - tca * tca * rr, 0.0);
  vec3 n = ((r2 * tca - o2) / d.r - r2 / sqrt(rr) * sqrt(sat(1.0 - d2 / (d.r * d.r)))) * sq;
  return mix(haze, stuff(d, n / max(length(n), 1e-4), rd), exp(-max(tca, 0.0) * fogK));
}

// One plain of a world along a ray, as plain() has it. behind: what is seen where nothing is, far off.
vec3 field(vec3 ro, vec3 rd, float fogK, float nowZ, float most) {
  float lie = abs(own4), pale = max(own4, 0.0);
  float disc = gDisc; gDisc = 0.0;
  vec3 haze = lie > 0.0 ? sky(normalize(vec3(rd.x, 0.012, max(rd.z, 0.2)))) : vec3(0.0);
  gDisc = disc;
  if (rd.y > -1e-4 && ro.y > gTop + 0.5) return sky(rd);
  rd += step(abs(rd), vec3(1e-4)) * 2e-4;
  vec3 inv = 1.0 / rd, first = rd, r00 = ro, k1 = vec3(0.0), k2 = k1;
  float w1 = 0.0, w2 = 0.0, wb = 0.0, wg = 0.0, solid = max(pale, max(own5, 0.0) * (1.0 - max(-own4, 0.0)));
  float ringUp = 0.6 * max(uHits, 0.7 * uCue) * gUp;
  float H = gTop + ((LIFT + 1.2 * most) * (1.0 - 0.94 * max(-own2, 0.0))) * gUp + ringUp;
  bool downward = rd.y < 0.0;
  float t0 = downward ? max((H - ro.y) * inv.y, 0.0) : 0.0, tg = downward ? -ro.y * inv.y : 1e4, t1 = downward ? tg : max((H - ro.y) * inv.y, 0.0);
  if (!downward && ro.y > H) return sky(rd);
  if (downward && ro.z + rd.z * t0 - nowZ > 12.0 * gMany) { H = gTop + 0.2 * LIFT * gUp + ringUp; t0 = max((H - ro.y) * inv.y, 0.0); }
  vec3 p = ro + rd * (t0 + 1e-3);
  vec2 id = floor(p.xz), stp = sign(rd.xz);
  vec2 tMax = (id + max(stp, 0.0) - ro.xz) * inv.xz, tDel = abs(inv.xz);
  float hh = dot(rd.xz, rd.xz);
  vec3 col = vec3(0.0); float alpha = 0.0, gain = 1.0;
  bool mirrored = false;
  for (int i = 0; i < gSteps; i++) {
    if (t0 > 130.0 * gMany) break;
    Lamp d = lampAt(id);
    float fade = sat(float(gSteps - i) * 0.12);
    vec3 oc = d.c - ro, sq = vec3(1.0, 1.0 / d.tall, 1.0), o2 = oc * sq, r2 = rd * sq;
    float rr = dot(r2, r2), tca = dot(o2, r2) / rr, d2 = max(dot(o2, o2) - tca * tca * rr, 0.0), dd = sqrt(d2);
    float fog = exp(-max(tca, 0.0) * fogK), px = tca * 1.2 / uRes.y, seen = step(0.0, tca);
    float w = min(clamp(0.012 + px + (mirrored ? 0.04 : 0.0), 0.004, 0.5 - d.r), max(d.r, 0.02));
    float cov = smoothstep(d.r + w, d.r - w, dd) * seen * smoothstep(0.3, 1.2, tca) * step(0.02, d.r) * fade;
    if (cov > 0.004) {   // the two nearest lamps are remembered, and drawn once at the end
      float wn = (1.0 - alpha) * cov * gain;
      vec3 k = vec3(id, mirrored ? 1.0 : 0.0);
      if (w1 <= 0.0) { k1 = k; w1 = wn; }
      else { if (wn > wb) { k2 = k; wb = wn; } w2 += wn; }
      alpha += (1.0 - alpha) * cov;
    }
    float g = sat((0.5 - dd) / (0.5 - d.r));
    g *= g;
    col += (1.0 - alpha) * d.hue * (d.loud * d.loud * 0.35 + 0.4 * d.ring) * g * g * fog * gain * seen * (1.0 - max(pale, abs(own5)));
    // the stem the lamp stands on
    float top = d.c.y - d.r * d.tall * 0.6;
    float ts = dot(d.c.xz - ro.xz, rd.xz) / hh;
    vec3 q = ro + rd * ts;
    float ds = length(q.xz - d.c.xz), thick = 0.2 * max(-own3, 0.0) * (0.5 + 0.5 * sat(1.6 * d.r)), ws = 0.02 + thick + max(px, 0.0);
    float cs = bump(ds / (0.03 + ws)) * min(1.0, (0.045 + thick * 1.2) / ws) * step(0.0, q.y) * step(q.y, top) * step(0.12, top) * step(0.02, d.r) * smoothstep(0.3, 1.2, ts) * fade;
    cs = mix(cs, min(1.0, cs * 3.0), max(-own3, 0.0)) * (1.0 - max(own3, 0.0));
    vec3 bark = d.hue * (0.25 + 0.5 * d.loud) * (0.35 + 0.65 * q.y / max(top, 0.1));
    float side = sat(0.5 + 0.45 * dot(q.xz - d.c.xz, gSun.xz) / max(ws, 0.02));
    bark = mix(bark, d.hue * d.hue * mix(0.08 + 0.5 * side, 0.3, 0.3 * pale), max(pale, max(own5, 0.0)));
    bark *= 1.0 - 0.85 * max(-own5, 0.0);
    col += (1.0 - alpha) * cs * mix(haze, bark, fog) * gain;
    alpha += (1.0 - alpha) * cs * max(lie, max(abs(own5), max(-own3, 0.0)));
    if (alpha > 0.985) break;
    float tn = min(tMax.x, tMax.y);
    if (tn > t1) {
      if (mirrored || tg > 70.0 * gMany) break;
      float f = 1.0 + rd.y; f *= f;
      wg = 1.0 - alpha;
      alpha += (1.0 - alpha) * solid;   // snow, or dry earth by day, stops the ray
      if (alpha > 0.985) break;
      gain = 0.22 + 0.6 * f * f;
      ro.y = -ro.y; rd.y = -rd.y;
      t1 = tg + min(H / rd.y, 6.0 / sqrt(hh));
      mirrored = true;
      continue;
    }
    if (tMax.x < tMax.y) { tMax.x += tDel.x; id.x += stp.x; } else { tMax.y += tDel.y; id.y += stp.y; }
  }
  if (w1 > 0.0) col += w1 * drawn(k1, r00, first, fogK, haze);
  if (w2 > 0.0) col += w2 * drawn(k2, r00, first, fogK, haze);
  if (downward && !mirrored && wg <= 0.0) { wg = 1.0 - alpha; alpha += (1.0 - alpha) * solid; }
  if (wg > 0.0) {
    vec3 qg = r00 + first * tg;
    Lamp d = lampAt(floor(qg.xz));
    float ff = exp(-tg * fogK);
    vec3 lv = d.c - qg; float l2 = dot(lv, lv);
    float pool = d.loud * d.r * d.r * 2.0 * lv.y / (l2 * sqrt(l2) + 0.02) * bump(length(fract(qg.xz) - 0.5) * 2.0);
    col += wg * d.hue * pool * ff * (1.0 - pale) * (1.0 - abs(own5));
    float sh = exp(-dot(lv.xz, lv.xz) * 5.0 / (d.r + 0.1)) * 0.45 * sat(d.r * 4.0) / (1.0 + max(d.c.y - d.r * d.tall, 0.0));
    for (int k = 1; k < 4; k++) {
      if (solid <= 0.0) break;
      vec3 qs = qg + gSun * (float(k) * 1.15 - 0.4) / length(gSun.xz);
      Lamp e = lampAt(floor(qs.xz));
      vec3 le = e.c - qg; float along = dot(le, gSun);
      float off = length(vec2(length(le.xz - gSun.xz * along), (le.y - gSun.y * along) / max(e.tall * 0.8, 0.6)));
      sh = max(sh, smoothstep(e.r + 0.12, e.r - 0.08, off) * 0.6 * step(0.02, e.r) * max(own5, 0.35));
      float al = dot(le.xz, gSun.xz) / dot(gSun.xz, gSun.xz), st = length(le.xz - gSun.xz * al);
      sh = max(sh, smoothstep(0.1 + 0.2 * max(-own3, 0.0), 0.0, st) * 0.4 * step(gSun.y * al, e.c.y) * step(0.02, e.r) * (1.0 - max(own3, 0.0)) * max(own5, 0.2) * step(0.0, al));
    }
    vec2 wz = vec2(qg.x, mod(qg.z, gLen));
    vec3 earth = mix(uKind[0] * uKind[0] * 0.5 + 0.03, vec3(0.9, 0.9, 0.91), pale);
    earth *= (0.9 + 0.2 * noise(wz * vec2(0.6, 0.9) / gMany) + 0.1 * (noise(wz * 6.0) - 0.5) * ff) * mix(0.7, 0.92, pale);
    earth = mix(earth, earth * mix(vec3(0.25), 0.3 + 0.5 * uKind[1], pale), sh * 1.2);
    col += wg * solid * mix(haze, earth, ff);
  }
  if (lie > 0.0) {
    vec3 far = haze;
    if (downward) {
      float f = 1.0 + first.y; f *= f;
      vec3 m = vec3(first.x + 0.02 * (noise(vec2(first.x * 8.0 + uTime * 0.05, 1.3 / max(-first.y, 0.02) + uTime * 0.4)) - 0.5), -first.y, first.z);
      gDisc = 0.0;
      far = mix(haze, sky(m) * (0.22 + 0.6 * f * f) * 0.92, exp(-tg * fogK * 0.7));
    } else far = sky(first);
    col += (1.0 - alpha) * far;
  }
  return col;
}

// To the screen: worlds that are lit, and not all lamps, keep the colours of things.
vec3 shown(vec3 col) {
  vec3 was = tone(col * 1.25);
  float lit = sat(max(max(own4, 0.0), 0.8 * max(own5, 0.0)));
  return lit > 0.0 ? mix(was, pow(1.0 - exp(-1.75 * max(col, 0.0)), vec3(0.4545)), lit) : was;
}

vec3 render(vec2 p) {
  gDisc = 1.0 - uVar;
  gSun = normalize(vec3(-0.72, 0.46, mix(0.1, 0.5, uVar)));
  float twin = step(0.5, uVar);
  float mid = 5.2;
  float camY = mix(7.0, mid, twin) + 0.5 * sin(uTime * 0.13) * (1.0 - twin);
  float nowZ = uLoop * LEN;
  vec3 ro = vec3(4.0 * sin(uTime * 0.07), camY, nowZ - mix(AHEAD, AHEAD * 0.75, twin));
  float pitch = mix(-0.26, 0.0, twin), yaw = 0.07 * sin(uTime * 0.05 + 1.0), roll = mix(0.04, 0.1, twin) * sin(uTime * 0.083);
  if (world) {
    float high = max(own7, 0.0), deep = max(-own7, 0.0), s = gUp;
    nowZ = uLoop * gLen;
    mid = mix(mix(mid, 8.5, high), 2.6, deep) * s + 0.55 * gTop * (1.0 - deep) * twin;
    ro.x *= mix(1.0, 0.5, deep) * s;
    ro.y = twin > 0.5 ? mid : (mix(mix(camY, 17.0, high), 1.7, deep)) * s + 0.35 * gTop * (1.0 - deep);
    ro.z = nowZ - mix(AHEAD, AHEAD * 0.75, twin) * gMany * mix(mix(1.0, 0.75, high), 0.8, deep);
    pitch += (1.0 - twin) * (-0.5 * high + 0.2 * deep);
    roll *= 1.0 - 0.6 * max(abs(own4), abs(own5));
  }
  p = rot(roll) * p;
  vec3 rd = normalize(vec3(p.x, p.y, mix(0.85, 0.62, twin)));
  rd.yz = rot(pitch) * rd.yz;
  rd.xz = rot(yaw) * rd.xz;
  float fogK = 0.024;
  float most = 0.0;
  for (int i = 0; i < 16; i++) most = max(most, uBands[i]);
  vec3 col, r1 = ro, d1 = rd;
  if (twin > 0.5 && rd.y > 0.0) { // the twin overhead: the same piece, the room turned over
    r1 = vec3(-ro.x, 2.0 * mid - ro.y, ro.z); d1 = vec3(-rd.x, -rd.y, rd.z);
  }
  if (world) col = field(r1, d1, fogK / gMany * (1.0 - 0.3 * max(own4, 0.0) - 0.5 * max(-own5, 0.0)), nowZ, most);
  else col = plain(r1, d1, fogK, nowZ, most);
  // the glow at the horizon, in the colours of what sounds now
  vec3 now = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  now = now / (0.4 + uDrone + uPad + uTexture + uPhrase + uHits);
  now = max(mix(vec3(dot(now, vec3(0.3333))), now, 1.6), 0.0);
  float ey = abs(rd.y), ex = rd.x;
  float sun = exp(-ey * 40.0 - ex * ex * 5.0) * (0.15 + 0.8 * uLevel) + exp(-ey * 220.0 - ex * ex * 2.0) * (0.3 + 0.8 * uLevel);
  if (world) sun *= (1.0 - max(own4, 0.0)) * sat(1.0 - 1.3 * max(-own4, 0.0)) * (1.0 - 0.6 * max(own5, 0.0));
  col += now * sun;
  return shown(col);
}
