// name: Ripples
// a: Sea of dots
// b: Rain pond
// what: A sea of dots at night under one low light on the horizon; the piece lies on the water, the loop across and the room going away, and rings spread through it.
// follows: The piece sizes and colours the dots, the low band raises the swell, every hit or cue drops a ring that travels out and lifts and lights the dots on its crest.
// own: 0 1 a fine field of many dots, -1 a few great ones; 1 1 the dots run together into lines across, -1 open rings; 2 1 strewn out of line, -1 the rows bent into wide arcs; 3 the ground: 1 pale water by day, -1 deep water in the colours of drone and pad; 4 1 round balls lit from one side, with shadows, -1 no dots, the water itself; 5 the eye: 1 low over the water (b: lying away), -1 from high above (b: close to); 6 1 a great disc on the horizon (b: mirrored in the pond), -1 islands (b: floating leaves); 7 1 a great slow swell (b: few great rings), -1 calm (b: a fine close rain)
float rpBend(float x) { return -min(uOwn[2], 0.0) * (0.7 * x * x / (1.0 + 0.45 * x * x) + 0.12 * cos(x * 5.2)); }
float rpAny, rpS;          // how far from the plain picture; how large the rings of the rain are
float kH, kC, RH, RC;      // how strong the rings of a hit and of a cue are, and how far they have got
vec2 hitAt, cueAt;
// The water's height at a place on the sea (x across, y away), and how much of it is each ring.
float sea(vec2 c, out float ringH, out float ringC) {
  float T = uTravel;
  float h = (0.22 + 0.78 * uLow) * (0.6 * sin(c.x * 2.3 + c.y * 3.1 - T * 1.4) + 0.4 * sin(c.y * 5.6 - c.x * 1.7 - T * 1.0 + 1.7));
  if (uOwn[7] > 0.0) h = mix(h, (1.2 + 1.0 * uLow) * (sin(c.y * 2.2 + 0.7 * sin(c.x * 0.9 + 1.0) - T * 0.7) + 0.25 * sin(c.y * 4.9 + c.x * 1.3 - T * 0.9)), uOwn[7]);
  if (uOwn[7] < 0.0) h *= 1.0 + 0.85 * uOwn[7];
  float d = length(c - hitAt) - RH;
  ringH = kH * exp(-d * d * 26.0) * cos(d * 20.0);
  d = length(c - cueAt) - RC;
  ringC = kC * exp(-d * d * 14.0) * cos(d * 15.0);
  return h + 1.7 * ringH + 1.9 * ringC;
}
// The pond from above: rain rings, each where the piece sounds. Gives the height, which way it slopes, and the rings' colour.
const float G = 0.36, TP = 3.0;
vec2 pondUV(vec2 q) { return vec2(q.x / (uRes.x / uRes.y) + 0.5, 0.5 - q.y); }
float pond(vec2 q, out vec2 grad, out vec3 tint) {
  float h = 0.0; grad = vec2(0.0); tint = vec3(0.0);
  vec2 q0 = q;
  if (rpS != 1.0) q /= rpS;
  vec2 gid = floor(q / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cid = gid + vec2(float(i), float(j));
    float tt = uTime + hash21(cid) * TP * 7.0;
    float n = floor(tt / TP), life = tt / TP - n;
    vec2 o = (cid + 0.15 + 0.7 * hash22(cid + n * 7.31)) * G;
    vec4 m = piece(pondUV(rpS == 1.0 ? o : o * rpS));
    float a = 0.2 + 0.3 * uLevel + 1.0 * sat(m.a) + 0.12 * rpAny + 0.3 * max(-uOwn[7], 0.0);        // a drizzle everywhere, rain where the piece sounds
    vec2 v = q - o;
    float dist = length(v) + 1e-4, d = dist - 0.84 * G * life;
    float env = a * (1.0 - life) * (1.0 - life) * smoothstep(0.0, 0.12, life);
    float e = exp(-d * d * 220.0), cs = cos(d * 52.0), sn = sin(d * 52.0);
    float w = env * e * cs;
    h += w;
    grad += env * e * (-440.0 * d * cs - 52.0 * sn) * v / dist;
    tint += mix(vec3(0.5, 0.65, 0.8), m.rgb / max(m.a, 1e-3), smoothstep(0.03, 0.12, m.a)) * abs(env * e);
  }
  if (rpS != 1.0) { q = q0; h *= sqrt(rpS); grad /= sqrt(rpS); }
  // a hit or a cue drops one big ring that crosses the whole pond
  vec2 v = q - hitAt; float dist = length(v) + 1e-4, d = dist - RH;
  float e = kH * 1.5 * exp(-d * d * 120.0), cs = cos(d * 40.0);
  h += e * cs; grad += e * (-240.0 * d * cs - 40.0 * sin(d * 40.0)) * v / dist; tint += uKind[4] * 1.4 * e;
  v = q - cueAt; dist = length(v) + 1e-4; d = dist - RC;
  e = kC * 1.6 * exp(-d * d * 70.0); cs = cos(d * 30.0);
  h += e * cs; grad += e * (-140.0 * d * cs - 30.0 * sin(d * 30.0)) * v / dist; tint += vec3(1.0, 0.85, 0.6) * 1.2 * e;
  return h;
}
vec3 rpDeep(vec3 k) { return k * k * 0.85 + k * 0.1; }
// The sky over the sea: h is how high over the horizon, 0 to about 0.6.
vec3 rpSky(float h) {
  float up = sat(h * 1.9);
  vec3 a = rpDeep(uKind[0]), b = rpDeep(uKind[1]);
  vec3 day = mix(b * 1.15 + 0.42, a * 0.95 + 0.4, smoothstep(0.0, 1.0, up)) * 1.05, deep = mix(b * 1.35 + a * 0.1, a * 0.13, smoothstep(0.0, 0.85, sqrt(up)));
  return mix(deep * -min(uOwn[3], 0.0), day, max(uOwn[3], 0.0));
}
// Water as one skin: n is its face (z off the water), away how flat it is looked at.
vec3 rpWater(vec3 n, float away, vec3 hue, float loud, vec3 sky, vec3 lamp) {
  vec3 base = mix(rpDeep(uKind[0]) * 0.3, rpDeep(uKind[0]) * 0.4 + 0.3, max(uOwn[3], 0.0));
  base += rpDeep(hue) * loud * (0.35 + 0.9 * loud);
  float s = dot(n.xy, normalize(vec2(-0.6, 0.8)));
  vec3 c = base * (1.0 + 1.5 * s);
  c = mix(c, sky + lamp * 0.1, sat(0.08 + 0.8 * away + 0.35 * max(s, 0.0)));
  return c + lamp * (0.9 * pow(sat(s * 1.5), 4.0) + 0.1 * sat(s)) + mix(vec3(0.5), hue, 0.6) * 0.12 * sat(-s * 1.4);
}
// What a dot is where there is a ground under it or it is a ball.
vec3 rpBody(vec3 lit, vec3 hue, float loud, float crest, vec2 l, vec3 lamp) {
  float pale = max(uOwn[3], 0.0), ball = max(uOwn[4], 0.0);
  vec3 c = mix(lit, rpDeep(hue) * (0.28 + 0.4 * loud) + 0.2 * sat(lit - 0.3), pale * 0.9);
  if (ball > 0.0) {
    float zz = sqrt(max(1.0 - dot(l, l), 0.0));
    vec3 n = vec3(l, zz), s = vec3(-0.5, 0.62, 0.6);
    float df = sat(dot(n, s)), sp = pow(sat(2.0 * dot(n, s) * zz - s.z), 22.0);
    vec3 own = mix(rpDeep(hue), hue, 0.35);
    c = mix(c, own * (0.07 + 0.12 * pale + (0.75 + 0.5 * loud) * df * df + 0.3 * crest * df) + own * loud * 0.25 + lamp * sp * 0.6 + lit * 0.12, ball);
  }
  return c;
}
vec3 ringTintOf(vec3 c) { return c / max(max(c.r, max(c.g, c.b)), 1e-3); }
vec3 render(vec2 p) {
  rpAny = smoothstep(0.0, 0.4, max(max(max(abs(uOwn[0]), abs(uOwn[1])), max(abs(uOwn[2]), abs(uOwn[3]))), max(max(abs(uOwn[4]), abs(uOwn[5])), max(abs(uOwn[6]), abs(uOwn[7])))));
  rpS = uOwn[7] == 0.0 ? 1.0 : exp2(uOwn[7] * (uOwn[7] > 0.0 ? 0.95 : 0.75));
  float many = uOwn[0] == 0.0 ? 1.0 : exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.8 : 1.25));
  float lines = max(uOwn[1], 0.0), open = max(-uOwn[1], 0.0), strewn = max(uOwn[2], 0.0), arcs = max(-uOwn[2], 0.0), solid = sat(max(abs(uOwn[3]), max(uOwn[4], 0.0))), skin = max(-uOwn[4], 0.0), pale = max(uOwn[3], 0.0);
  vec3 bare = mix(vec3(0.4, 0.5, 0.65), uKind[0] * 0.8 + 0.1, rpAny), dim = mix(vec3(0.3, 0.42, 0.6), uKind[0] * 0.75 + 0.05, rpAny);
  vec3 col = vec3(0.0);
  float k = sat(uHits * 1.3);
  kH = sqrt(k); kC = sqrt(uCue);
  float px = 1.0 / uRes.y;
  if (uVar < 0.5) {
    RH = 0.12 + 0.5 * -log(max(k, 0.03));
    RC = 0.1 + 0.8 * -log(max(uCue, 0.03));
    float cell = uOwn[0] == 0.0 ? 0.06 : 0.06 / many, wide = 1.8, deep = 3.0;
    hitAt = vec2((uLoop - 0.5) * wide, 0.1 + deep * 0.62);
    cueAt = vec2(0.25, 1.0);
    hitAt.y -= 1.0 * rpAny;
    vec3 ro = vec3(0.1 * sin(uTime * 0.09), 0.5 + 0.03 * sin(uTime * 0.2), -0.6), ta = vec3(0.0, 0.0, 1.6);
    if (uOwn[6] != 0.0) ta.y += 0.42 * abs(uOwn[6]) * min(1.0 + uOwn[5], 1.0);
    if (uOwn[5] > 0.0) { ro = mix(ro, vec3(ro.x, 0.24, -0.35), uOwn[5]); ta = mix(ta, vec3(0.0, 0.06, 1.6), uOwn[5]); }
    if (uOwn[5] < 0.0) { ro = mix(ro, vec3(0.0, 2.15, 0.55), -uOwn[5]); ta = mix(ta, vec3(0.0, 0.0, 1.62), -uOwn[5]); }
    vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
    float f = 1.1;
    vec3 rd = normalize(fw * f + rt * p.x + up * p.y);
    // the light on the horizon, a little to the right, and its glow
    vec3 ld = normalize(vec3(0.24, 0.012, 1.0));
    vec2 lp = f * vec2(dot(ld, rt), dot(ld, up)) / dot(ld, fw);
    vec3 lightCol = mix(vec3(1.0, 0.86, 0.66), uKind[1] + 0.25, 0.35 * uPad) * (0.45 + 0.9 * uLevel);
    if (rpAny > 0.0) lightCol = mix(lightCol, (uKind[3] * 0.85 + 0.15) * (0.6 + 0.6 * uLevel), rpAny);
    float hy = f * dot(vec3(0, 0, 1), up) / dot(vec3(0, 0, 1), fw);   // where the horizon lies on the screen
    float lr = length((p - lp) * vec2(1.0, 1.6));
    if (p.y > hy - 0.004) {
      col += lightCol * (exp(-lr * lr * 2600.0) * 3.0 + exp(-lr * 26.0) * 0.16 + exp(-abs(p.y - hy) * 90.0) * exp(-abs(p.x - lp.x) * 4.0) * 0.08);
    }
    vec3 sky = vec3(0.0);
    if (uOwn[3] != 0.0) { sky = rpSky(p.y - hy); col = mix(col, sky + col * mix(1.0, 0.25, pale), abs(uOwn[3])); }
    if (uOwn[6] > 0.0) {
      vec2 dc = p - lp - vec2(-0.1, 0.08) * uOwn[6];
      float dr = length(dc) - 0.2 * uOwn[6];
      vec3 disc = mix(mix(lightCol, uKind[3] * 1.5, 0.5) * 1.15, uKind[3] * uKind[3] * 1.7, pale) * (0.75 + 0.25 * smoothstep(-0.2, 0.2, dc.y));
      if (p.y > hy - 0.004) col = mix(col, disc, smoothstep(0.002, -0.002, dr) * smoothstep(0.0, 0.1, uOwn[6])) + disc * 0.12 * uOwn[6] * exp(-max(dr, 0.0) * 9.0) * (1.0 - pale);
    }
    if (uOwn[6] < 0.0 && p.y > hy - 0.004) {
      for (int k = 0; k < 3; k++) {
        float fk = float(k), x = p.x * (1.5 + fk * 0.5) + fk * 7.3 + 0.1 * ro.x;
        float big = smoothstep(0.4, 1.0, noise(vec2(x * 1.9, fk * 3.0 + 1.5)) * 0.8 + 0.25 * noise(vec2(x * 4.3, fk)));
        float ht = -uOwn[6] * big * ((0.34 - 0.1 * fk) + 0.05 * noise(vec2(x * 11.0, fk)) + 0.02 * noise(vec2(x * 29.0, fk)));
        vec3 rock = mix(rpDeep(uKind[2]) * mix(0.4, 0.5, pale), sky, 0.5 - 0.2 * fk) + 0.02 * lightCol;
        col = mix(col, rock, smoothstep(0.0025, -0.0025, p.y - hy - ht) * step(0.0, p.y - hy + 0.004) * smoothstep(0.001, 0.006, ht));
      }
    }
    if (rd.y < -0.004) {
      float t = -ro.y / rd.y;
      vec3 q = ro + rd * t;
      vec3 under = vec3(0.0), comp = vec3(0.0);
      float A = 0.0;
      if (solid + skin > 0.0) {
        float a0 = exp(-t * mix(0.2, 0.14, skin)), glit = exp(-pow((p.x - lp.x) / (0.05 + 0.12 * max(uOwn[6], 0.0) + 0.3 * (hy - p.y)), 2.0));
        float r1, r2, h0 = sea(q.xz, r1, r2), ee = 0.012 + 0.01 * t, hx, hz;
        float shoal = smoothstep(0.35, 0.8, 0.75 * noise(q.xz * vec2(1.3, 1.9) + 4.0) + 0.3 * noise(q.xz * vec2(4.0, 6.0)));
        under = mix(mix(rpDeep(uKind[0]) * mix(0.25, 0.4, shoal), mix(rpDeep(uKind[0]) * 0.7 + 0.3, rpDeep(uKind[2]) * 0.6 + 0.5, shoal), pale) * (1.0 + 0.1 * h0), rpSky(0.02), 1.0 - a0) * max(abs(uOwn[3]), skin) + lightCol * glit * 0.16 * (1.0 - 0.6 * pale);
        if (skin > 0.0) {
          hx = sea(q.xz + vec2(ee, 0.0), r1, r2) - h0; hz = sea(q.xz + vec2(0.0, ee), r1, r2) - h0;
          vec4 m = piece(vec2(q.x / wide + 0.5, 1.0 - (q.z - 0.1) / deep));
          float loud = sat(m.a * (0.65 + 0.6 * uEnergy)) * smoothstep(1.0, 0.72, abs(q.x) / (0.5 * wide)) * smoothstep(0.0, 0.5, q.z - 0.05), chop = exp(-t * 0.35);
          vec2 fine = vec2(noise(q.xz * vec2(9.0, 22.0) + vec2(0.0, uTime * 0.5)), noise(q.xz * vec2(13.0, 31.0) - vec2(uTime * 0.4, 0.0))) - 0.5;
          vec3 n = normalize(vec3(-hx * 0.15 / ee + fine.x * 0.5 * chop, -hz * 0.17 / ee + fine.y * 0.7 * chop, 1.0));
          vec3 w = rpWater(n, 0.75 * pow(1.0 - sat(-rd.y), 3.0), m.a > 0.004 ? m.rgb / m.a : bare, loud, mix(rpSky(0.12 + 0.3 * n.y), rpDeep(uKind[0]) * 0.1 + rpDeep(uKind[1]) * 0.12, 1.0 - abs(uOwn[3])), lightCol * (0.25 + 1.6 * glit) * (1.0 - 0.5 * pale));
          under = mix(under, mix(w, rpSky(0.02), (1.0 - a0) * abs(uOwn[3])) * mix(a0, 1.0, abs(uOwn[3])) , skin);
        }
      }
      vec2 q2 = q.xz;
      int more = uOwn[7] > 0.0 || uOwn[5] > 0.0 ? 1 : 0;
      if (uOwn[7] > 0.0) for (int k = 0; k < 4; k++) { float a1, a2; q2.y = mix(q2.y, q.z - sea(q2, a1, a2) * (0.034 + 0.03 * uOwn[7]) * min(1.3, t) / ro.y, 0.75); }
      vec2 id0 = floor((q2 - vec2(0.0, rpBend(q.x))) / cell);
      if (skin < 1.0) for (int dz = -2 - more; dz <= 1 + (uOwn[7] > 0.0 ? more : 0); dz++) for (int dx = -1; dx <= 1; dx++) {
        if (dx != 0 && lines > 0.99) continue;
        vec2 id = id0 + vec2(float(dx), float(dz));
        vec2 c = (id + 0.5) * cell;
        if (rpAny > 0.0) {
          if (strewn > 0.0) c += (hash22(id + 3.0) - 0.5) * 0.85 * cell * strewn;
          float by = c.y;
          c.y = by + rpBend(c.x);
          if (lines > 0.0) { float cx = c.x; for (int k = 0; k < 3; k++) { vec3 v0 = vec3(c.x, 0.0, c.y) - ro; float d0 = max(dot(v0, fw), 0.15); c.x += (p.x * d0 / f - dot(v0, rt)) / max(rt.x, 0.5); c.y = by + rpBend(c.x); } c.x = mix(cx, c.x, lines); c.y = by + rpBend(c.x); }
        }
        vec3 v = vec3(c.x, 0.0, c.y) - ro;
        float depth = dot(v, fw);
        if (depth < 0.15) continue;
        if (abs(p.x - f * dot(v, rt) / depth) > f * cell * (0.82 + 0.5 * strewn) / depth + px) continue; // not this column: waves only move dots up and down
        float ringH, ringC;
        float h = sea(c, ringH, ringC);
        vec4 m = piece(vec2(c.x / wide + 0.5, 1.0 - (c.y - 0.1) / deep));
        float loud = sat(m.a * (0.65 + 0.6 * uEnergy)); loud *= smoothstep(0.0, 0.07, loud);
        if (rpAny > 0.0) loud *= mix(1.0, smoothstep(1.0, 0.72, abs(c.x) / (0.5 * wide)) * smoothstep(0.0, 0.5, c.y - 0.05), rpAny);
        float h1 = hash21(id), h2 = hash21(id + 17.0);
        if (lines > 0.0) { h1 = mix(h1, 0.5, lines); h2 = mix(h2, 0.5, lines); }
        h += loud * 0.5 * (1.0 - lines) * sin(uTime * (1.2 + h1) + h2 * TAU);        // sounding dots bob on their own
        v.y += h * (0.034 + 0.03 * max(uOwn[7], 0.0)) * min(1.0, 1.3 / depth);                    // far waves are drawn lower so that dots keep to their rows
        vec2 sp = f * vec2(dot(v, rt), dot(v, up)) / depth;
        float crest = sat(h * 0.6);
        float rr = 0.13 + 0.33 * sqrt(loud) + 0.2 * crest + 0.1 * sat(abs(ringH) + abs(ringC));
        if (strewn > 0.0) rr *= mix(1.0, 0.5 + 0.8 * h2, strewn);
        if (open + uOwn[0] * uOwn[0] > 0.0) rr += 0.06 * max(open, -uOwn[0]);
        rr *= 1.0 - 0.58 * lines; rr += 0.06 * lines * pale;
        rr += 0.1 * solid * (1.0 - lines);
        float rs = f * cell * rr / depth;
        float d = length(p - sp) - rs;
        if (open > 0.0) d = mix(d, abs(d + rs * 0.22) - max(rs * 0.2, 0.6 * px), open);
        float cover = smoothstep(px, -px, d) * min(1.0, rs * rs / (px * px));
        if (dx != 0) cover *= 1.0 - lines;
        vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.15 : bare;
        if (uOwn[4] > 0.0) hue = mix(hue, uKind[int(h2 * 3.99)], uOwn[4] * 0.8 * (1.0 - smoothstep(0.0, 0.35, m.a)));
        vec3 lit = dim * (0.035 + 0.2 * crest);    // the bare sea under the night
        lit += hue * loud * (0.5 + 1.2 * loud) * (0.7 + 0.6 * crest);
        if (lines > 0.0) lit *= 1.0 - 0.45 * lines * smoothstep(0.1, 0.7, loud * (0.5 + crest));
        // the light's path on the water: dots between us and it glint, most on the crests
        float path = exp(-pow((sp.x - lp.x) / (0.035 + 0.1 * max(uOwn[6], 0.0) + 0.3 * (hy - sp.y)), 2.0));
        lit += lightCol * path * (0.12 + 0.9 * crest * crest + 0.45 * (0.5 + 0.5 * sin(uTime * (1.0 + 2.0 * h1) + h2 * 40.0)));
        lit += uKind[4] * 1.5 * sat(ringH) + vec3(1.0, 0.85, 0.6) * 1.0 * sat(ringC);
        float fog = exp(-depth * 0.3);
        if (solid > 0.0) {
          vec3 body = rpBody(lit + 0.1 * dim * uOwn[4] * uOwn[4], hue, loud, crest, (p - sp) / max(rs, px), lightCol);
          body += rpDeep(uKind[2]) * lines * (0.3 + 0.6 * crest) * (1.0 - pale);
          body = mix(body, rpSky(0.02), (1.0 - exp(-depth * 0.15)) * abs(uOwn[3])) * mix(fog, 1.0, abs(uOwn[3]));
          body = mix(body, uKind[4] * 0.85, 0.85 * sat(abs(ringH) * 1.3) * abs(uOwn[3]));
          float sh = uOwn[4] > 0.0 ? uOwn[4] * exp(-max(length((p - sp - vec2(0.55, -0.75) * rs) * vec2(1.0, 1.7)) - rs * 0.7, 0.0) / max(rs, px) * 3.0) : 0.0;
          under *= 1.0 - 0.5 * sh * min(1.0, rs * rs / (px * px));
          comp += (1.0 - A) * cover * body; A += (1.0 - A) * cover;
        }
        col += lit * fog * cover;
        col += (hue * loud * loud * 0.5 + uKind[4] * sat(ringH) + vec3(1.0, 0.85, 0.6) * 0.8 * sat(ringC)) * fog * exp(-max(d, 0.0) / max(rs, px) * 2.2) * 0.2 * min(1.0, rs * rs / (px * px));
      }
      if (solid + skin > 0.0) {
        col = mix(mix(col, comp + (1.0 - A) * under, solid), under, skin);
        float rg = length(q.xz - hitAt) - RH;
        col = mix(col, uKind[4] * 0.9, 0.72 * kH * exp(-rg * rg * 13.0) * max(abs(uOwn[3]), skin));
      }
    }
    return screenOf(col * 1.25);
  }
  // b: straight down on a pond; the piece lies on its bed as dots, and rain falls where it sounds
  RH = 0.05 + 0.5 * -log(max(k, 0.03));
  RC = 0.05 + 0.8 * -log(max(uCue, 0.03));
  float asp = uRes.x / uRes.y;
  hitAt = vec2((uLoop - 0.5) * asp, 0.2);
  cueAt = vec2(0.12 * asp, 0.1);
  vec2 grad; vec3 tint;
  float far = 1.0;
  if (uOwn[5] > 0.0) { far = max(1.0 - 1.35 * uOwn[5] * p.y, 0.2); p /= far; }
  if (uOwn[5] < 0.0) { far = 1.0 - 1.1 * uOwn[5]; p /= far; }
  float h0 = pond(p, grad, tint);
  float rows = uOwn[0] == 0.0 ? 38.0 : 38.0 * many;
  vec2 g = (p - grad * 0.00028) * rows;                              // the water bends what lies under it
  if (arcs > 0.0) g.y -= arcs * 0.5 * g.x * g.x / rows;
  vec2 id = floor(g) + 0.5, fr = g - id;
  float gap = 9.0;
  vec2 qc = id / rows;
  if (rpAny > 0.0) {
    if (strewn > 0.0) {
      vec2 i0 = id, best = id; float d1 = 9.0, d2 = 9.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 n = i0 + vec2(float(i), float(j)), c = n + (hash22(n + 3.0) - 0.5) * 0.8 * strewn;
        float dn = length(g - c) - 0.22 * strewn * hash21(n + 71.0);
        if (dn < d1) { d2 = d1; d1 = dn; best = n; } else d2 = min(d2, dn);
      }
      id = best; gap = 0.5 * (d2 - d1);
      vec2 c = id + (hash22(id + 3.0) - 0.5) * 0.8 * strewn;
      fr = g - c; qc = c / rows;
    }
    if (lines > 0.0) { qc.x = mix(qc.x, p.x, lines); fr.x *= 1.0 - lines; }
    qc.y += arcs * 0.5 * qc.x * qc.x;
  }
  vec4 m = piece(pondUV(qc));
  float loud = sat(m.a * (0.65 + 0.6 * uEnergy)); loud *= smoothstep(0.0, 0.07, loud);
  vec2 gc; vec3 tc;
  float hc = pond(qc, gc, tc);
  float crest = sat(hc * 1.2), trough = sat(-hc * 1.2);
  float r = min(0.1 + 0.4 * sqrt(loud) + 0.3 * crest - 0.06 * trough, 0.56);
  if (uOwn[4] > 0.0) r = min(r + 0.14 * uOwn[4], 0.5 + 0.1 * strewn);
  if (strewn > 0.0) r *= mix(1.0, 0.75 + 0.5 * hash21(id + 71.0), strewn);
  if (uOwn[0] < 0.0 && strewn == 0.0) r = min(r, 0.56 + 0.08 * uOwn[0]);
  if (lines > 0.0) r = mix(r, min(r * 0.75, 0.42), lines);
  if (open > 0.0) r += 0.06 * open;
  float edge = rpAny > 0.0 ? rows * px * 1.1 / (uOwn[5] > 0.0 ? far * far : far) : rows * px * 1.1;
  float d = length(fr) - r;
  if (strewn > 0.0) d = max(d, 0.04 - gap);
  if (open > 0.0) d = mix(d, abs(d + r * 0.22) - r * 0.2, open);
  float cover = smoothstep(edge, -edge, d);
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.15 : bare;
  if (uOwn[4] > 0.0) hue = mix(hue, uKind[int(hash21(id + 13.0) * 3.99)], uOwn[4] * 0.8 * (1.0 - smoothstep(0.0, 0.35, m.a)));
  vec3 ringHue = tc / max(max(tc.r, max(tc.g, tc.b)), 1e-3);
  // a lamp low at the upper left: slopes that face it shine, slopes that turn away go dark
  float slope = dot(gc, normalize(vec2(-0.7, 0.7))) * 0.02;
  vec3 lit = dim * 0.06 + hue * loud * (0.45 + 1.1 * loud);
  lit *= (1.0 + 1.4 * crest - 0.65 * trough) * (1.0 + clamp(-slope, -0.5, 1.2));
  lit += ringHue * (crest * 0.8 + sat(-slope) * 0.6);
  lit += vec3(1.0, 0.96, 0.9) * pow(sat(-slope * 1.1), 3.0) * 0.9 * pow(sat(1.0 - length(fr / max(r, 0.01) - vec2(-0.3, 0.3)) * 1.3), 2.0);
  col = lit * cover;
  col += (hue * loud * loud * 0.4 + ringHue * crest * 0.5) * exp(-max(d, 0.0) * 6.0) * (1.0 - cover) * 0.5;
  if (rpAny > 0.0) {
    vec3 lamp = mix(vec3(1.0, 0.96, 0.9), uKind[3] * 0.8 + 0.25, 0.7) * (0.6 + 0.5 * uLevel), under = vec3(0.0);
    float mir = 0.0, ss = dot(grad, vec2(-0.7, 0.7)) * 0.02;
    if (uOwn[6] > 0.0) mir = uOwn[6] * smoothstep(0.012, -0.012, length(p - grad * 0.0016 - vec2(0.18, 0.04)) - 0.3 * uOwn[6]) * smoothstep(0.0, 0.1, uOwn[6]);
    under = mix(rpDeep(uKind[0]) * 0.28, rpDeep(uKind[0]) * 0.65 + 0.5, pale) * abs(uOwn[3]);
    under *= 1.0 + 0.3 * clamp(-ss, -1.0, 1.2) + 0.25 * noise(p * 2.2 + 3.0) - 0.12;
    under += mix(0.03, 0.06, pale) * ringTintOf(tint) * sat(-ss) * abs(uOwn[3]);
    if (skin > 0.0) {
      vec4 mw = piece(pondUV(p - grad * 0.0012));
      vec3 w = rpWater(normalize(vec3(-grad * 0.028, 1.0)), 0.12, mw.a > 0.004 ? mw.rgb / mw.a : bare, sat(mw.a * (0.65 + 0.6 * uEnergy)), rpDeep(uKind[1]) * mix(0.3, 0.7, abs(uOwn[3])) + 0.5 * pale, lamp);
      under = mix(under, w, skin);
    }
    under = mix(under, mix(under, (uKind[3] * uKind[3] + 0.12) * mix(0.95, 1.25, pale) * (0.82 + 0.3 * noise(p * 5.0 + 2.0)), 0.85) + 0.0, mir);
    vec3 body = rpBody(lit + 0.08 * dim, hue, loud, crest, fr / max(r, 0.02), lamp);
    float sh = max(uOwn[4], 0.0) * exp(-max(length(fr - vec2(0.2, -0.22)) - r * 0.8, 0.0) * 9.0);
    vec3 dots = mix(under * (1.0 - 0.5 * sh), body * mix(1.0, 1.25 * (1.0 - pale), 0.5 * mir), cover);
    dots += (hue * loud * loud * 0.4 + ringHue * crest * 0.5) * exp(-max(d, 0.0) * 6.0) * (1.0 - cover) * 0.3 * (1.0 - pale);
    if (solid == 0.0) col += under * (1.0 - cover) + lamp * mir * cover * 0.2;
    col = mix(mix(col, dots, solid), under, skin);
    if (solid + skin > 0.0) { float rg = length(p - hitAt) - RH; col = mix(col, uKind[4] * 0.9, mix(0.5, 0.9, pale) * kH * exp(-rg * rg * mix(160.0, 70.0, pale)) * max(abs(uOwn[3]), skin)); }
    if (uOwn[6] < 0.0) {
      // leaves afloat, one to a cell, each with its notch
      vec2 gp = (p + 0.006 * sin(uTime * 0.13) + grad * 0.00006) / 0.3 + vec2(0.0, 0.5 * mod(floor(p.x / 0.3), 2.0)), ip = floor(gp);
      float hp = hash21(ip + 5.0), rp = (0.17 + 0.26 * hp) * smoothstep(0.0, 0.3 + 0.7 * hp, -uOwn[6]) * step(0.3, hash21(ip + 61.0));
      vec2 fp = gp - ip - 0.5 - (hash22(ip + 9.0) - 0.5) * (0.96 - 2.0 * rp) * 0.6;
      vec2 fs = fp + vec2(-0.05, 0.06);
      float ap = atan(fp.y, fp.x + 1e-5) + hp * TAU + 0.1 * sin(uTime * 0.1 + hp * 9.0), lr = length(fp), no = smoothstep(0.0, 0.07, abs(mod(ap, TAU) - PI) / PI);
      float e2 = px / 0.3 * 1.3 / far, leaf = smoothstep(e2, -e2, lr - rp * (0.25 + 0.75 * no) * (0.97 + 0.03 * sin(ap * 9.0)));
      col *= 1.0 - 0.45 * step(0.02, rp) * smoothstep(0.05, -0.05, length(fs) - rp);
      vec3 gl = mix(rpDeep(uKind[2]), rpDeep(uKind[1]), 0.35 * hash21(ip + 23.0)) * mix(0.75, 1.0, pale);
      float vein = exp(-abs(sin(ap * 7.0)) * lr * 60.0);
      gl *= (0.65 + 0.35 * sat(0.5 + dot(fp, vec2(-1.2, 1.2)))) * (1.0 - 0.25 * exp(-lr * 9.0)) + 0.14 * vein;
      gl += lamp * 0.1 * smoothstep(rp * 0.8, rp, lr) * sat(dot(fp / max(lr, 1e-3), vec2(-0.7, 0.7)));
      col = mix(col, gl, leaf * step(0.02, rp));
    }
    if (uOwn[5] > 0.0) col = mix(col, rpSky(0.0) + dim * 0.01, smoothstep(0.75, 0.3, far) * 0.75);
  }
  return screenOf(col * 1.3);
}
