// name: Dot lattice
// a: Points
// b: Rods
// what: A flight through lamps hung in a lattice that fills space, with the piece laid through it across and along and echoed on the levels above and below, the far lamps sinking into fog.
// follows: Loudness lights and swells the lamps; lows send slow wide waves of light through, mids quicker ones, highs make single lamps sparkle; a hit or cue sends a shell of light out from the middle.
const vec3 PERIOD = vec3(32.0, 8.0, 48.0); // the lattice repeats: the room there and back across, eight levels up, one turn of the loop along

vec3 tone(vec3 c) { c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); c *= (1.0 + l * 0.1) / (1.0 + l); c = mix(c, vec3(l / (1.0 + l)), sat(l * 0.12 - 0.1)); return pow(c, vec3(0.4545)); }
float bump(float x) { x = sat(1.0 - x * x); return x * x; }
float wave(float x) { x = abs(fract(x) - 0.5) * 2.0; return x * x * (3.0 - 2.0 * x); } // a smooth wave, 0 to 1, once for each 1 of x

vec3 gMid; // where a hit's shell starts

// The light of the lamp in one cell (rgb), and how big it is (a).
vec4 lampAt(vec3 id) {
  vec3 c = id + 0.5;
  vec3 w = mod(c, PERIOD);
  float level = w.y - 4.0;                           // levels above and below the middle one
  float echo = 1.0 / (1.0 + 0.35 * level * level);   // the piece is strongest on the middle level, fainter away from it
  vec2 uv = vec2(fract(w.z / PERIOD.z - level * 0.03), abs(w.x / 16.0 - 1.0));
  vec4 m = piece(uv);
  float loud = sat(m.a * (0.6 + 0.6 * uEnergy)) * (0.3 + 0.7 * echo);
  vec3 hue = m.rgb / max(m.a, 0.001);
  hue = max(mix(vec3(dot(hue, vec3(0.3333))), hue, 1.9), 0.0);
  float dz = (fract(uv.x - uLoop + 0.5) - 0.5) * PERIOD.z;
  float head = bump(dz * 0.35);
  vec3 light = hue * loud * (0.75 + 1.3 * head);
  // lows: one slow wide wave. mids: a quicker, shorter one across it.
  vec3 k = w / PERIOD;
  float lo = wave(k.x + k.z * 2.0 - uTime * 0.09);
  float mi = wave(k.x * 3.0 + k.y - k.z * 3.0 - uTime * 0.2);
  lo *= lo; mi *= mi;
  light += uKind[0] * uLow * lo * lo * 0.3 + mix(uKind[1], uKind[2], wave(k.z + 0.3)) * uMid * mi * mi * mi * 0.3;
  // highs: single lamps sparkle
  float h = hash31(w);
  float tw = wave(uTime * (0.3 + 0.5 * h) + h * 9.0);
  tw *= tw; tw *= tw;
  light += vec3(1.0, 0.9, 0.75) * uHigh * tw * tw * step(0.75, fract(h * 7.3)) * 1.6;
  // a hit: a shell of light going out from the middle
  if (uHits > 0.01) {
    float dist = length(c - gMid);
    float sh = uHits * bump((dist - 0.5 - (1.0 - uHits) * 12.0) * 1.3) + 0.7 * uCue * bump((dist - 0.5 - (1.0 - uCue) * 17.0) * 0.9);
    vec3 red = max(mix(vec3(dot(uKind[4], vec3(0.3333))), uKind[4], 1.8), 0.0);
    light += mix(red, vec3(1.0, 0.9, 0.8), 0.3) * sh * 1.6;
  }
  light += vec3(0.012, 0.018, 0.03);
  float big = max(light.r, max(light.g, light.b));
  return vec4(light, 0.014 + 0.09 * sqrt(sat(big * 0.8)));
}

// How near a ray passes a short rod from a to b; t is where along the ray.
float rodDist(vec3 ro, vec3 rd, vec3 a, vec3 b, out float t) {
  vec3 ba = b - a, oa = ro - a;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float s = clamp((baoa - rdoa * bard) / max(baba - bard * bard, 1e-5), 0.0, 1.0);
  vec3 q = a + ba * s;
  t = dot(q - ro, rd);
  return length(ro + rd * t - q);
}

// One lamp, as a soft point or rod of light dd from the ray at t along it, laid over what is already there.
void lay(vec4 L, float r, float dd, float t, inout vec3 col, inout float alpha) {
  float fog = exp(-t * 0.17) * step(0.05, t);
  float w = 0.006 + t * 1.2 / uRes.y + 0.012 * abs(t - 5.0) / (1.0 + 0.4 * t); // far lamps are softer, and so are the ones at your shoulder
  float cov = smoothstep(r + w, max(r - w, 0.0) - 1e-4, dd) * min(1.0, 2.0 * r * r / (w * w));
  float core = sat(1.0 - dd / (r + w));
  col += (1.0 - alpha) * cov * L.rgb * (0.5 + 1.6 * core * core) * fog * 1.5;
  alpha += (1.0 - alpha) * cov * 0.9 * step(0.05, t);
  float g = sat(1.0 - (dd - r) / (0.02 + 1.6 * r));
  col += (1.0 - alpha) * L.rgb * g * g * g * 0.3 * fog;
}

vec3 points(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd, id = floor(ro), stp = sign(rd);
  vec3 tMax = (id + max(stp, 0.0) - ro) * inv, tDel = abs(inv);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 24; i++) {
    vec3 oc = id + 0.5 - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca;
    if (d2 < 0.085) {
      vec4 L = lampAt(id);
      lay(L, L.a, sqrt(max(d2, 0.0)), tca, col, alpha);
      if (alpha > 0.98) break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { tMax.x += tDel.x; id.x += stp.x; }
    else if (tMax.y < tMax.z) { tMax.y += tDel.y; id.y += stp.y; }
    else { tMax.z += tDel.z; id.z += stp.z; }
  }
  return col;
}

// The same lattice with a rod in place of each point, turned by a slow wave that runs through the lattice.
vec3 rods(vec3 ro, vec3 rd) {
  vec3 inv = 1.0 / rd, id = floor(ro), stp = sign(rd);
  vec3 tMax = (id + max(stp, 0.0) - ro) * inv, tDel = abs(inv);
  vec3 col = vec3(0.0); float alpha = 0.0;
  for (int i = 0; i < 24; i++) {
    vec3 oc = id + 0.5 - ro; float tca = dot(oc, rd), d2 = dot(oc, oc) - tca * tca;
    if (d2 < 0.2 && tca > -0.5) {
      vec4 L = lampAt(id);
      vec3 k = mod(id + 0.5, PERIOD) / PERIOD;
      float a = (k.z * 2.0 + k.x) * TAU + uTime * 0.17, b = 0.7 * (wave(k.y + k.z * 3.0 - uTime * 0.02) * 2.0 - 1.0);
      vec3 ax = vec3(cos(a) * cos(b), sin(b), sin(a) * cos(b)) * (0.1 + 2.2 * L.a);
      float t, dd = rodDist(ro, rd, id + 0.5 - ax, id + 0.5 + ax, t);
      lay(L, 0.01 + L.a * 0.3, dd, t, col, alpha);
      if (alpha > 0.98) break;
    }
    if (tMax.x < tMax.y && tMax.x < tMax.z) { tMax.x += tDel.x; id.x += stp.x; }
    else if (tMax.y < tMax.z) { tMax.y += tDel.y; id.y += stp.y; }
    else { tMax.z += tDel.z; id.z += stp.z; }
  }
  return col;
}

vec3 render(vec2 p) {
  vec3 fly = normalize(vec3(0.26, 0.11, 1.0));
  vec3 ro = mod(fly * uTravel * 3.2 + vec3(0.5, 4.3, 0.0), PERIOD);
  // look along the flight, wandering a little, rolling slowly
  vec3 fw = normalize(fly + vec3(0.32 * sin(uTime * 0.07), 0.2 * sin(uTime * 0.053 + 1.0), 0.0));
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  p = rot(0.25 * sin(uTime * 0.041)) * p;
  vec3 rd = normalize(fw * 0.8 + rt * p.x + up * p.y);
  rd += step(abs(rd), vec3(1e-4)) * 2e-4;
  gMid = ro + fw * 8.0;
  vec3 col;
  if (uVar < 0.5) col = points(ro, rd); else col = rods(ro, rd);
  return tone(col * 1.2);
}
