// name: Bead curtain
// a: Hanging
// b: Falling
// what: Strings of glass beads hang in rows one behind another, each string a band of the sound; light runs down a string as far as its band is loud.
// follows: Each band lights its strings from the top down, low bands teal through violet and rose to high bands amber; travel drifts you past the rows, a hit sends a shell of red light out through them and a gust along them, a cue drops a line of light down every string.
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
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
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
    float fog = exp(-(z - 1.0) * 0.55);
    float blur = l == 3 ? 0.5 : (l == 0 ? 0.1 : 0.0);                               // the row nearest us is out of focus
    float shift = fl * 3.71;
    vec2 w = vec2(p.x * z + camX + shift, p.y * z + camY);
    float sp = 0.2;                                                                 // from string to string
    float id = floor(w.x / sp);
    float h1 = hash11(id + fl * 57.0), h2 = hash11(id * 1.37 + fl * 91.0 + 3.0);
    float tri = abs(fract((id + fl * 4.0) / 26.0) * 2.0 - 1.0);                     // the bands run low to high and back along a row
    float level = band(tri) * (0.3 + 0.7 * uEnergy);
    vec3 tint = bandTint(tri);
    float top = 0.56 * z;
    float bsp = 0.082, br = 0.034;
    float pxw = px * z;                                                             // one pixel, in this row's own measure
    float soft = max(blur, pxw / br * 1.2);
    float dimmer = 1.0 / (1.0 + blur * 2.5);
    vec3 layer = vec3(0.0); float covered = 0.0;
    if (uVar < 0.5) {
      float len = (0.5 + 0.62 * h1) * z;                                            // every string its own length
      float last = floor(len / bsp);
      float jf = (top - w.y) / bsp, j0 = floor(jf);
      float side = fract(jf) > 0.5 ? 1.0 : -1.0;
      float gust = k * exp(-pow(p.x - (1.6 * (1.0 - k) - 0.8), 2.0) * 7.0);         // a hit sends a gust along the row
      float reach = level * last * 1.25;
      float cxMid = (id + 0.5) * sp;
      if (abs(w.x - cxMid) > 0.042 + br * (1.3 * (1.0 + soft) + 1.3)) continue;      // nowhere near this string
      for (int e = 0; e < 2; e++) {                                                 // this bead and the next one toward us on the string
        float j = j0 + (e == 0 ? 0.0 : side);
        if (j > last || j < 0.0) continue;
        float by = top - (j + 0.5) * bsp;
        float hang = (top - by) / z;
        float sway = (0.02 + 0.03 * uLow + 0.06 * gust) * hang * sin(uTime * (0.6 + 0.4 * h2) + h2 * TAU + hang * 2.2);
        float cx = cxMid + clamp(sway, -0.042, 0.042);
        float weight = j == last ? 1.3 : 1.0;                                       // a heavier bead ends each string
        vec2 o = vec2(w.x - cx, w.y - by) / (br * weight);
        // light runs down from the top as far as the band is loud, brightest at its leading bead
        float lit = smoothstep(reach + 0.5, reach - 0.5, j) * (0.25 + 0.75 * exp(-(reach - j) * 0.3)) * smoothstep(0.03, 0.12, level);
        float cueL = uCue * exp(-pow((hang - cueY) * 14.0, 2.0));                  // a cue drops a line of light down every string
        vec3 at = vec3(cx - camX - shift, by - camY, z) - centre;
        float shell = k * exp(-pow((length(at) - shellR) * 4.5, 2.0));             // a hit's shell of light passes through the rows
        vec3 tn = mix(tint, uKind[4] * 1.4, sat(shell * 1.2));
        tn = mix(tn, vec3(1.0, 0.9, 0.7), sat(cueL));
        lit += shell * 1.2 + cueL * 0.9;
        float r = length(o);
        float cover = smoothstep(1.0 + soft, 1.0 - soft, r) * dimmer;
        vec3 c = bead(o / (1.0 + soft), lit, tn);
        if (blur > 0.3) c = mix(c, tn * (0.006 + lit * 0.8), 0.65);                 // out of focus a bead is nearly a plain disc
        layer += c * cover + tn * lit * 0.22 * exp(-max(r - 1.0, 0.0) * 3.2) * (1.0 - cover) * dimmer; // and a little glow round a lit bead
        covered = max(covered, cover);
        if (e == 0) layer += tn * smoothstep(pxw * 1.2 + 0.002, 0.0, abs(w.x - cx)) * step(j, last - 0.5) * (0.012 + 0.05 * lit) * (1.0 - cover); // the thread
      }
    } else {
      // b: no strings: the beads fall as rain, each column a band; louder bands fall as longer, brighter streaks
      float fall = uTravel * (0.5 + 0.5 * h1) * 0.8 + uTime * 0.1;
      float period = 0.5 + 0.45 * h2;
      float y = (w.y + fall) / period + h2 * 7.0;
      float n = floor(y), fy = (y - n) * period;                                    // how far above this drop's head we are
      float hn = hash11(n * 3.1 + id * 0.77 + fl * 13.0);
      float cx = (id + 0.5) * sp + (hn - 0.5) * 0.09;
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
      float softb = min(soft, 0.3);
      vec2 o = vec2(w.x - cx, br - fy) / (br * 0.85);
      float r = length(o);
      float cover = smoothstep(1.0 + softb, 1.0 - softb, r) * dimmer;
      vec3 c = bead(o / (1.0 + softb), lit, tn);
      // the streak above it: a thin line of the same light, fading upward
      float along = sat((fy - br) / streak);
      float wid = br * 0.32 * (1.0 + blur);
      float tail = smoothstep(wid + pxw, wid - pxw, abs(w.x - cx)) * step(br, fy) * pow(1.0 - along, 1.6);
      layer = c * cover + tn * tail * lit * 0.6 * dimmer * (1.0 - cover);
      layer += tn * lit * 0.25 * exp(-max(r - 1.0, 0.0) * 3.5) * (1.0 - cover) * dimmer * smoothstep(0.0, 0.03, min(fy, period - fy));
      covered = cover;
    }
    col = col * (1.0 - covered * 0.92) + layer * fog;
  }
  return screenOf(col * 1.3);
}
