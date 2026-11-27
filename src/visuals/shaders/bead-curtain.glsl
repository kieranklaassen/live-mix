// name: Bead curtain
// a: Hanging
// b: Falling
// what: Strings of glass beads hang in rows one behind another, each string a band of the sound; light runs down a string as far as its band is loud.
// follows: Each band lights its strings from the top down, low bands teal through violet and rose to high bands amber; travel drifts you past the rows, a hit sends a shell of red light out through them and a gust along them, a cue drops a line of light down every string.
// own: 0 1 many fine beads on close strings, -1 a few great ones; 1 1 long tubes, -1 cut lozenges with facets; 2 1 an arch, short in the middle and long at the sides (b: rain at the sides only), -1 long in the middle like a hanging lamp (b: rain into still water, with rings); 3 1 a pale lit ground, -1 an evening sky in the colours of the drone and the pad; 4 1 pearls, lit from one side, -1 rings, only their rims; 5 1 one sharp row alone, -1 rows going far away; 6 1 blown aside, -1 waving like weed (b: rising as bubbles); 7 1 every size, strewn, with gaps, -1 each bead shows the piece at its place, as a picture; any of them takes the kinds' colours
// One bead as a ball of glass. o is where we are on it (its edge at 1), lit how much it glows, tint its colour.
vec3 bead(vec2 o, float lit, vec3 tint) {
  float d2 = dot(o, o);
  if (d2 > 1.0) return vec3(0.0);
  float nz = sqrt(1.0 - d2);
  vec3 n = vec3(o, nz);
  float rim = pow(1.0 - nz, 2.0);
  float spec = pow(sat(dot(n, normalize(vec3(-0.45, 0.55, 0.7)))), 26.0);
  float under = pow(sat(dot(n, normalize(vec3(0.3, -0.6, 0.74)))), 6.0);          // light gathered at the far side of the glass
  vec3 c = (tint * 0.5 + vec3(0.2, 0.25, 0.35)) * (0.0015 + 0.02 * rim) + vec3(0.9, 0.95, 1.0) * spec * (0.035 + 0.6 * lit);
  c += tint * lit * (0.3 + 0.55 * nz * nz + 1.3 * under) + vec3(1.0) * lit * lit * 0.3 * nz * nz * nz;
  return c;
}
// Low bands teal, then violet, rose, and amber at the top.
vec3 bandTint(float x) {
  vec3 a = vec3(0.16, 0.8, 0.86), b = vec3(0.52, 0.36, 1.0), c = vec3(1.0, 0.36, 0.56), d = vec3(1.0, 0.72, 0.26);
  x = sat(x) * 3.0;
  return x < 1.0 ? mix(a, b, x) : (x < 2.0 ? mix(b, c, x - 1.0) : mix(c, d, x - 2.0));
}
float bcUp(float x) { return max(x, 0.0); }
// What lies behind the strings: a pale wall with light on it, or an evening sky.
vec3 bcGround(vec2 p) {
  vec3 c = vec3(0.0);
  if (uOwn[3] > 0.0) {
    vec2 v = p - vec2(-0.45, 0.2);
    float weave = 0.965 + 0.035 * noise(vec2(p.x * 160.0, p.y * 7.0)) + 0.03 * noise(vec2(p.x * 7.0, p.y * 2.0));
    c = uOwn[3] * mix(vec3(1.05, 1.0, 0.92), uKind[1] * uKind[1] * 1.5, 0.65) * weave * (0.62 + 0.75 * exp(-dot(v, v) * 1.1)) * (0.95 + 0.12 * uLevel);
  }
  if (uOwn[3] < 0.0) {
    float y = p.y + 0.5, haze = noise(vec2(p.x * 1.6 + uTime * 0.01, p.y * 5.0)) * 0.6 + 0.4 * noise(vec2(p.x * 4.0 - uTime * 0.013, p.y * 11.0));
    vec3 low = uKind[1] * uKind[1], high = uKind[0] * uKind[0];
    c = mix(low * (0.75 + 0.3 * uLevel), high * 0.35, smoothstep(0.05, 0.75, y + 0.22 * (haze - 0.5)));
    c = mix(c, high * 0.07, smoothstep(0.5, 1.15, y));
    vec2 v = (p - vec2(0.25, -0.3)) * vec2(0.8, 1.3);
    c += uKind[3] * uKind[3] * 0.55 * exp(-dot(v, v) * 7.0) * (0.7 + 0.5 * uLevel);
    c *= -uOwn[3];
  }
  return c;
}
// A bead of another stuff on a ground of its own: clear glass with the ground seen through it, or pearl.
vec3 bcBody(vec2 o, float lit, vec3 tint, vec3 under) {
  float d2 = min(dot(o, o), 1.0), nz = sqrt(1.0 - d2);
  vec3 n = vec3(o, nz);
  vec3 sun = vec3(-0.46, 0.56, 0.69);
  float rim = (1.0 - nz) * (1.0 - nz), spec = pow(sat(dot(n, normalize(vec3(-0.23, 0.28, 0.93)))), 60.0), glow = sat(lit);
  vec3 deep = tint;
  float far = pow(sat(dot(n, vec3(0.42, -0.6, 0.68))), 4.0);
  vec3 glass = under * mix(vec3(0.94), 0.04 + 1.1 * deep, 0.62 + 0.38 * glow) * (1.0 - 0.9 * smoothstep(0.45, 1.0, d2) * (0.75 - 0.45 * o.y)) + deep * far * (0.35 + 1.3 * glow) + deep * glow * 0.35 * nz + vec3(1.0, 0.97, 0.92) * spec * 1.1;
  vec3 pearl = mix(vec3(0.6, 0.57, 0.53), deep, 0.8 + 0.2 * glow) * (0.07 + 1.0 * sat(dot(n, sun) * 0.75 + 0.25)) * (0.75 + 0.8 * glow);
  pearl += (0.25 + 0.4 * tint) * 0.35 * rim + 0.12 * vec3(0.9, 0.7, 0.8) * smoothstep(0.3, 0.8, d2) * sat(dot(n, sun)) + spec * 0.75 + deep * glow * 0.3;
  return mix(glass, pearl, bcUp(uOwn[4]));
}
// The edge of a bead, 1 at its rim: round, a long tube, or a cut lozenge.
float bcEdge(vec2 o) {
  float l = length(o);
  if (uOwn[1] > 0.0) { vec2 q = o * o; q *= q; l = mix(l, pow(q.x + q.y + 1e-9, 0.25), uOwn[1]); }
  if (uOwn[1] < 0.0) l = mix(l, (abs(o.x) * 1.12 + abs(o.y) * 0.82) * 0.94, -uOwn[1]);
  return l;
}
// Still water below the rain, with a ring where each drop has gone in.
vec3 bcLake(vec2 p, vec3 under, float lake) {
  float depth = mix(1.4, 0.36, lake), sky = -0.05;
  if (p.y > sky - 0.004) return under;
  float z = depth / max(sky - p.y + 0.02, 0.02), far = exp(-(z - 0.8) * 0.32);
  vec2 w = vec2(p.x * z + 0.4 * sin(uTime * 0.07) + uTravel * 0.035, z * 1.6);
  vec3 mirror = bcGround(vec2(p.x, 2.0 * sky - p.y));
  vec3 c = mirror * 0.75 + uKind[0] * uKind[0] * 0.035;
  float glint = 0.0;
  vec3 stain = vec3(0.0);
  for (int j = 0; j < 3; j++) {
    float f = float(j), per = 0.62 + 0.2 * f;
    vec2 q = w / per + f * 7.3, id = floor(q), h = hash22(id + 13.0 * f);
    float t = fract(uTime * (0.16 + 0.1 * h.x) + h.y), a = band(hash21(id + 3.7 * f));
    vec2 v = (q - id - 0.5 - 0.3 * (h - 0.5));
    float d = length(v), ring = (d - 0.3 * t) * 26.0 / (1.0 + 2.0 * t);
    float wave = exp(-ring * ring * 0.6) * (1.0 - t) * (1.0 - t) * smoothstep(0.0, 0.06, t) * (0.25 + 1.1 * a);
    glint += wave * (0.55 + 0.45 * v.y / max(d, 1e-3));
    stain += wave * kindColour(hash21(id + 3.7 * f) * 4.0);
  }
  float k = uHits * exp(-pow((length(vec2(p.x - 0.1, (p.y + 0.25) * 2.6)) - 0.75 * (1.0 - uHits)) * 9.0, 2.0));
  c = c * (1.0 + 0.8 * glint * far * bcUp(uOwn[3])) + stain * far * 0.55 + k * uKind[4] * 0.5;
  c = mix(under, c, smoothstep(0.0, 0.05, sky - p.y) * min(1.0, 4.0 * lake));
  return c;
}
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  float any = min(1.0, 2.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
  float m = exp2(uOwn[0] * (uOwn[0] > 0.0 ? 0.9 : 1.25)), kept = max(abs(uOwn[3]), abs(uOwn[4])), paint = bcUp(-uOwn[7]), strewn = bcUp(uOwn[7]), hole = bcUp(-uOwn[4]);
  float tall = 1.0 + 2.3 * bcUp(uOwn[1]) + 0.3 * bcUp(-uOwn[1]), thin = 1.0 - 0.42 * bcUp(uOwn[1]) - 0.1 * bcUp(-uOwn[1]);
  bool b = uVar > 0.5;
  float k0 = sat(uHits * 1.3);
  vec2 at0 = p;
  if (uOwn[3] != 0.0) col = bcGround(p);
  float lake = b ? bcUp(-uOwn[2]) : 0.0;
  if (lake > 0.0) col = bcLake(p, col, lake);
  if (uOwn[3] != 0.0) {                                                             // a hit's ring of light goes out over it
    float ring = (length(p - vec2(0.08, 0.03)) - 0.1 - 0.75 * (1.0 - k0)) * 5.0;
    ring = k0 * exp(-ring * ring);
    col = mix(col * (1.0 - 0.5 * ring * (1.0 - uKind[4] * uKind[4])), col + uKind[4] * uKind[4] * 0.45 * ring, bcUp(-uOwn[3]));
  }
  vec3 ground = col;
  if (uOwn[6] > 0.0) p.x -= uOwn[6] * ((0.56 - p.y) * (0.42 + 0.06 * sin(uTime * 0.23)) + 0.035 * sin(p.y * 5.0 + uTime * 0.6));
  if (uOwn[6] < 0.0) p.x -= uOwn[6] * (b ? 0.4 : 1.0) * (0.56 - p.y) * (0.07 * sin(p.y * 6.0 + p.x * 1.5 + uTime * 0.33) + 0.04 * sin(p.y * 11.0 - uTime * 0.21));
  float k = sat(uHits * 1.3);
  float shellR = 0.15 + 0.75 * -log(max(k, 0.03));                                  // a hit's shell of light, growing
  float px = 1.0 / uRes.y;
  float camX = 0.4 * sin(uTime * 0.07) + uTravel * 0.035, camY = 0.03 * sin(uTime * 0.11);
  vec3 centre = vec3(0.15, 0.05, 1.8);                                              // where a hit's shell starts
  float cueY = (1.0 - uCue) * 1.2;
  const int LAYERS = 4;
  for (int l = 0; l < LAYERS; l++) {
    float fl = float(l);
    float z = 2.7 - fl * 0.6 + (l == 3 ? 0.15 : 0.0);                               // far rows first: 2.7, 2.1, 1.5, 1.05
    float shown = 1.0;
    if (uOwn[5] > 0.0) { z = mix(z, 1.2, uOwn[5]); if (l < 3) shown = 1.0 - uOwn[5]; if (shown < 0.004) continue; }
    if (uOwn[5] < 0.0) z = 1.0 + (z - 1.0) * (1.0 - 1.9 * uOwn[5]);
    float fog = exp(-(z - 1.0) * 0.55);
    float blur = l == 3 ? 0.5 : (l == 0 ? 0.1 : 0.0);
    if (uOwn[5] > 0.0) blur *= 1.0 - uOwn[5];                                        // the row nearest us is out of focus
    float shift = fl * 3.71;
    vec2 w = vec2(p.x * z + camX + shift, p.y * z + camY);
    float sp = 0.2 / m;                                                               // from string to string
    float id = floor(w.x / sp);
    float h1 = hash11(id + fl * 57.0), h2 = hash11(id * 1.37 + fl * 91.0 + 3.0);
    float tri = abs(fract((id + fl * 4.0) / (26.0 * m)) * 2.0 - 1.0);                     // the bands run low to high and back along a row
    float level = band(tri) * (0.3 + 0.7 * uEnergy);
    vec3 tint = bandTint(tri);
    if (any > 0.0) { vec3 kc = kindColour(tri * 4.0); tint = mix(tint, kc * kc * 1.25, any); }
    float top = 0.56 * z;
    float bsp = 0.082 / m, br = 0.034 / m;
    float pxw = px * z;                                                             // one pixel, in this row's own measure
    float wide = 0.042 / m, mid0 = (id + 0.5) * sp;
    float soft = max(blur, pxw / br * 1.2);
    float dimmer = 1.0 / (1.0 + blur * 2.5);
    vec3 layer = vec3(0.0); float covered = 0.0;
    vec3 body = vec3(0.0); float has = 0.0, shade = 0.0;                            // the same beads of another stuff, when the world has one
    float side0 = (mid0 - camX - shift) / z, arch = 1.0;                             // where the string hangs in the picture
    if (uOwn[2] > 0.0) arch = mix(1.0, smoothstep(0.02, 0.75, abs(side0)) * 1.15 + 0.1, uOwn[2]);
    if (uOwn[2] < 0.0 && !b) arch = mix(1.0, 1.25 * exp(-side0 * side0 * 5.0) + 0.02, -uOwn[2]);
    if (uVar < 0.5) {
      float len = (0.5 + 0.62 * h1) * z;
      if (uOwn[2] != 0.0) len *= arch * mix(1.0, 1.0 / (0.6 + 0.62 * h1), 0.7 * abs(uOwn[2]));
      if (paint > 0.0) len = mix(len, 1.15 * z, paint);
      bsp *= tall;                                            // every string its own length
      float last = floor(len / bsp);
      if (any > 0.0 && last < 0.5) continue;
      float jf = (top - w.y) / bsp, j0 = floor(jf);
      float side = fract(jf) > 0.5 ? 1.0 : -1.0;
      float gust = k * exp(-pow(p.x - (1.6 * (1.0 - k) - 0.8), 2.0) * 7.0);         // a hit sends a gust along the row
      float reach = level * last * 1.25;
      float cxMid = (id + 0.5) * sp;
      if (abs(w.x - cxMid) > wide + br * (1.3 * (1.0 + soft) + 1.3)) continue;      // nowhere near this string
      for (int e = 0; e < 2; e++) {                                                 // this bead and the next one toward us on the string
        float j = j0 + (e == 0 ? 0.0 : side);
        if (j > last || j < 0.0) continue;
        float hb = strewn > 0.0 ? hash21(vec2(j * 1.7 + 3.0, id * 0.31 + fl * 17.0)) : 0.5, sized = 1.0;
        if (strewn > 0.0) { sized = mix(1.0, 0.35 + 1.05 * hb, strewn); if (fract(hb * 37.7) < 0.3 * strewn) continue; }
        float by = top - (j + 0.5) * bsp;
        float hang = (top - by) / z;
        float sway = (0.02 + 0.03 * uLow + 0.06 * gust) * hang * sin(uTime * (0.6 + 0.4 * h2) + h2 * TAU + hang * 2.2);
        float cx = cxMid + clamp(sway, -0.042, 0.042);
        if (any > 0.0) cx = cxMid + clamp(sway, -wide, wide) + strewn * 0.6 * br * (fract(hb * 91.3) - 0.5);
        float weight = j == last ? 1.3 : 1.0;                                       // a heavier bead ends each string
        vec2 o = vec2(w.x - cx, w.y - by) / (br * weight);
        if (any > 0.0) o /= vec2(thin, tall) * sized;
        // light runs down from the top as far as the band is loud, brightest at its leading bead
        float lit = smoothstep(reach + 0.5, reach - 0.5, j) * (0.25 + 0.75 * exp(-(reach - j) * 0.3)) * smoothstep(0.03, 0.12, level);
        vec3 tp = tint;
        if (paint > 0.0) {
          vec4 pc = piece(vec2((cx - camX - shift) / z / 1.78 + 0.5, 0.5 - (by - camY) / z));
          lit = mix(lit, 1.25 * pc.a, paint); tp = mix(tint, pc.a > 0.004 ? pc.rgb * pc.rgb / (pc.a * pc.a) * 1.25 : uKind[1] * uKind[1] * (0.6 + 0.6 * h1), paint);
        }
        float cueL = uCue * exp(-pow((hang - cueY) * 14.0, 2.0));                  // a cue drops a line of light down every string
        vec3 at = vec3(cx - camX - shift, by - camY, z) - centre;
        float shell = k * exp(-pow((length(at) - shellR) * 4.5, 2.0));             // a hit's shell of light passes through the rows
        vec3 tn = mix(tp, uKind[4] * 1.4, sat(shell * 1.2));
        tn = mix(tn, vec3(1.0, 0.9, 0.7), sat(cueL));
        lit += shell * 1.2 + cueL * 0.9;
        float r = length(o);
        if (uOwn[1] != 0.0) { float e1 = bcEdge(o); o *= e1 / max(r, 1e-4); r = e1; }
        float cover = smoothstep(1.0 + soft, 1.0 - soft, r) * dimmer;
        if (hole > 0.0) cover *= 1.0 - hole * smoothstep(0.78 + soft, 0.78 - soft, r) * 0.94;
        vec3 c = bead(o / (1.0 + soft), lit, tn);
        if (uOwn[1] < 0.0) c *= mix(1.0, 0.55 + 0.55 * step(0.0, o.y - o.x * 0.2) + 0.35 * step(o.x, 0.0), -uOwn[1]);
        if (hole > 0.0) c = mix(c, tn * (0.07 + lit) * (0.5 + 0.8 * sat(0.5 - 0.4 * o.x + 0.5 * o.y)), hole);
        if (kept > 0.0) {
          vec3 bo = bcBody(o / (1.0 + soft), lit, tn, col);
          if (uOwn[1] < 0.0) bo *= mix(1.0, 0.62 + 0.4 * step(0.0, o.y - o.x * 0.2) + 0.3 * step(o.x, 0.0), -uOwn[1]);
          if (hole > 0.0) bo = mix(bo, mix(vec3(0.03), 0.02 + tn * 0.6, sat(lit * 1.5)) + (1.0 - bcUp(uOwn[3])) * tn * (0.1 + lit), hole);
          body = mix(body, bo, has > 0.0 ? cover : 1.0); has = max(has, cover);
          shade = max(shade, exp(-max(r - 0.8, 0.0) * 2.2) * (0.5 + 0.5 * sat(0.5 + o.x * 0.3 - o.y * 0.4)));
        }
        if (blur > 0.3) c = mix(c, tn * (0.006 + lit * 0.8), 0.65);                 // out of focus a bead is nearly a plain disc
        layer += c * cover + tn * lit * 0.22 * exp(-max(r - 1.0, 0.0) * 3.2) * (1.0 - cover) * dimmer * (1.0 - 0.8 * abs(uOwn[2])); // and a little glow round a lit bead
        covered = max(covered, cover);
        if (e == 0) layer += tn * smoothstep(pxw * 1.2 + 0.002 / m, 0.0, abs(w.x - cx)) * step(j, last - 0.5) * (0.012 + 0.05 * lit) * (1.0 - cover); // the thread
      }
    } else {
      // b: no strings: the beads fall as rain, each column a band; louder bands fall as longer, brighter streaks
      float fall = uTravel * (0.5 + 0.5 * h1) * 0.8 + uTime * 0.1;
      if (uOwn[6] < 0.0) fall *= 1.0 + 1.7 * uOwn[6];
      float period = 0.5 + 0.45 * h2;
      if (uOwn[0] != 0.0) period /= sqrt(m);
      float y = (w.y + fall) / period + h2 * 7.0;
      float n = floor(y), fy = (y - n) * period;                                    // how far above this drop's head we are
      float hn = hash11(n * 3.1 + id * 0.77 + fl * 13.0);
      float cx = (id + 0.5) * sp + (hn - 0.5) * 0.09 / m;
      if (abs(w.x - cx) > br * (2.3 + soft)) continue;                              // nowhere near this column
      float hy = w.y - fy + br;                                                     // the head's height
      vec3 at = vec3(cx - camX - shift, hy - camY, z) - centre;
      float shell = k * exp(-pow((length(at) - shellR) * 4.5, 2.0));
      float cueL = uCue * exp(-pow(((top - hy) / z - cueY) * 10.0, 2.0));
      vec3 tn = mix(tint, uKind[4] * 1.4, sat(shell * 1.2));
      tn = mix(tn, vec3(1.0, 0.9, 0.7), sat(cueL));
      float loud = level * smoothstep(0.03, 0.12, level);
      float lit = 0.05 + 1.2 * loud + shell * 1.3 + cueL;
      float streak = min((0.05 + 0.75 * loud + 0.3 * shell) * (0.6 + 0.6 * hn), period - 2.5 * br);
      if (lake > 0.0) { shown *= smoothstep(0.0, 0.045 * z, w.y - camY + mix(1.4, 0.36, lake) - 0.06 * (hn - 0.5)); if (shown < 0.004) continue; }
      float softb = min(soft, 0.3);
      if (paint > 0.0) {
        vec4 pc = piece(vec2((cx - camX - shift) / z / 1.78 + 0.5, 0.5 - (hy - camY) / z));
        lit = mix(lit, 0.04 + 1.25 * pc.a + cueL + shell, paint); tn = mix(tn, pc.a > 0.004 ? pc.rgb * pc.rgb / (pc.a * pc.a) * 1.25 : uKind[1] * uKind[1] * (0.6 + 0.6 * h1), paint * (1.0 - sat(shell + cueL)));
      }
      float sized = 1.0;
      if (strewn > 0.0) sized = mix(1.0, 0.25 + 1.5 * fract(hn * 37.7) * fract(hn * 37.7), strewn);
      if (strewn > 0.0) streak *= 1.0 - 0.75 * strewn;
      if (uOwn[2] != 0.0) { sized *= smoothstep(0.12, 0.5, arch + 0.25 * (fract(hn * 91.3) - 0.5)); if (sized < 0.01) continue; }
      if (strewn > 0.0 && fract(hn * 17.3 + h2) < 0.25 * strewn) continue;
      if (uOwn[6] < 0.0) streak = max(streak * (1.0 + uOwn[6]), 1e-3);
      vec2 o = vec2(w.x - cx, br - fy) / (br * 0.85);
      if (any > 0.0) o = vec2(w.x - cx, br * tall * max(sized, 1.0) - fy) / (br * 0.85 * vec2(thin, tall) * sized);
      float r = length(o);
      if (uOwn[1] != 0.0) { float e1 = bcEdge(o); o *= e1 / max(r, 1e-4); r = e1; }
      float cover = smoothstep(1.0 + softb, 1.0 - softb, r) * dimmer;
      if (hole > 0.0) cover *= 1.0 - hole * smoothstep(0.8 + softb * 0.5, 0.8 - softb * 0.5, r) * 0.94;
      vec3 c = bead(o / (1.0 + softb), lit, tn);
      if (uOwn[1] < 0.0) c *= mix(1.0, 0.55 + 0.55 * step(0.0, o.y - o.x * 0.2) + 0.35 * step(o.x, 0.0), -uOwn[1]);
      if (hole > 0.0) c = mix(c, tn * (0.07 + lit) * (0.5 + 0.8 * sat(0.5 - 0.4 * o.x + 0.5 * o.y)), hole);
      // the streak above it: a thin line of the same light, fading upward
      float along = sat((fy - br) / streak);
      float wid = br * 0.32 * (1.0 + blur);
      float tail = smoothstep(wid + pxw, wid - pxw, abs(w.x - cx)) * step(br, fy) * pow(1.0 - along, 1.6);
      if (any > 0.0) tail *= min(sized, 1.0) * (1.0 - strewn * 0.9) * smoothstep(br, br * 1.9, fy) * thin;
      if (kept > 0.0) {
        body = bcBody(o / (1.0 + softb), lit, tn, col);
        if (uOwn[1] < 0.0) body *= mix(1.0, 0.62 + 0.4 * step(0.0, o.y - o.x * 0.2) + 0.3 * step(o.x, 0.0), -uOwn[1]);
        if (hole > 0.0) body = mix(body, mix(vec3(0.03), 0.02 + tn * 0.6, sat(lit * 1.5)) + (1.0 - bcUp(uOwn[3])) * tn * (0.1 + lit), hole);
        has = max(cover, tail * 0.75 * sat(lit) * dimmer);
        body = mix(mix(tn * (0.3 + 0.7 * lit), tn * lit, 1.0 - bcUp(uOwn[3])), body, sat(cover * 1.5));
        shade = exp(-max(r - 0.8, 0.0) * 2.2) * 0.6;
      }
      layer = c * cover + tn * tail * lit * 0.6 * dimmer * (1.0 - cover);
      layer += tn * lit * 0.25 * exp(-max(r - 1.0, 0.0) * 3.5) * (1.0 - cover) * dimmer * smoothstep(0.0, 0.03, min(fy, period - fy));
      covered = cover;
    }
    if (kept > 0.0) {
      vec3 was = col * (1.0 - covered * 0.92 * shown) + layer * fog * shown;
      float pale = bcUp(uOwn[3]);
      vec3 to = col * (1.0 - 0.5 * shade * shown * max(pale, 0.4));
      float away = 1.0 - exp(-(z - 1.0) * (0.4 - 0.08 * pale));                      // the far rows sink into the ground
      to = mix(to, mix(body, uOwn[3] == 0.0 ? body * fog : ground, away * 0.8), has * shown);
      to += (layer * fog * (1.0 - has)) * (1.0 - pale) * 0.8 * shown;
      col = mix(was, to, kept);
    } else col = col * (1.0 - covered * 0.92 * shown) + layer * fog * shown;
  }
  return screenOf(col * 1.3);
}
