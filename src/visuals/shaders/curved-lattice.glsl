// name: Curved lattice
// a: Light ribbons
// b: Gold bands
// what: A flight through an endless lattice of curved ribbons made of light, the near ones showing the far ones through them, the colour sliding as it goes deeper.
// follows: The low band makes the ribbons thicker, low, mid and high light them level by level, a hit sends a shell of light out ahead through the lattice.
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
vec3 gRo;

// Where two curved walls cross there is a wire. The walls are a gyroid and the surface of cubes and necks.
// a: round wires. b: the walls are given thickness, so the crossing is a flat band with sharp edges.
float mapd(vec3 p) {
  float g1 = dot(sin(p), cos(p.yzx)), d;
  if (uVar < 0.5) {
    vec3 c = cos(p + vec3(0.0, 1.3, 2.1));
    float g2 = (c.x + c.y + c.z) * 0.8;
    d = (length(vec2(g1, g2)) - 0.05 - 0.15 * uLow) * 0.5;
  } else {
    vec3 q = p * 0.5 + vec3(1.0, 0.3, 2.0);
    float g2 = dot(sin(q), cos(q.zxy));
    d = max(abs(g1) - 0.07 - 0.16 * uLow, abs(g2) - 0.3) * 0.55;
  }
  return max(d, 0.4 - length(p - gRo));
}

vec3 render(vec2 p) {
  bool gold = uVar > 0.5;
  float z = uTravel * 1.5;
  vec3 ro = vec3(PI * 0.5 + 0.3 * sin(z * 0.31), 0.3 * cos(z * 0.23), z);
  gRo = ro;
  float ya = 0.35 * sin(uTime * 0.09), pa = 0.22 * sin(uTime * 0.07 + 1.0);
  vec3 fw = normalize(vec3(sin(ya), sin(pa), 1.0));
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec2 pr = rot(0.3 * sin(uTime * 0.05)) * p;
  vec3 rd = normalize(fw * 0.7 + rt * pr.x + up * pr.y);
  float shell = 1.5 + (1.0 - uHits) * 14.0, cueShell = 1.5 + (1.0 - uCue) * 22.0;

  if (!gold) {
    // a: the wires are light, not matter. The ray goes on through them and gathers what it passes, so wires seen
    // edge on are brightest and the far ones show through the near ones.
    vec3 acc = vec3(0.0);
    float t = 0.7 + 0.05 * hash21(gl_FragCoord.xy);
    bool struck = uHits + uCue > 0.02;
    float thick = 0.05 + 0.15 * uLow;
    const vec3 co = vec3(1.0, 0.2675, -0.5048), so = vec3(0.0, 0.9636, 0.8632); // cos and sin of the second wall's shift
    for (int i = 0; i < 52; i++) {
      vec3 q = ro + rd * t;
      vec3 s = sin(q), c = cos(q);
      float g1 = dot(s, c.yzx);
      vec3 c2 = c * co - s * so;
      float g2 = (c2.x + c2.y + c2.z) * 0.8;
      float a = abs(length(vec2(g1, g2)) - thick) * 0.5;
      float stp = max(a * 0.9, 0.035 + t * 0.008);
      float a1 = a * 60.0 / (1.0 + t * 0.14), a2 = 1.0 / (1.0 + a * a * 90.0);
      float w = 1.0 / (1.0 + a1 * a1 * a1) + 0.06 * a2 * a2;
      // colour slides with depth: teal near, through violet, to amber
      vec3 hue = vec3(0.5, 0.42, 0.52) + vec3(0.5, 0.4, 0.48) * cos(TAU * ((t * 0.07 + uLoop) * vec3(1.0, 0.9, 0.8) + vec3(0.52, 0.3, 0.12)));
      float h = fract(q.y / TAU * 0.5 + 0.5) * 2.0;   // the three bands, stacked by height
      float lv = mix(mix(uLow, uMid, sat(h)), uHigh, sat(h - 1.0));
      float e = 0.14 + 0.85 * uLevel + 1.7 * lv * lv;
      float far = 1.0 / (1.0 + t * t * 0.016);
      float k = w * stp * far * far;
      acc += hue * (e * k);
      if (struck) {
        float s1 = (t - shell) * 1.3, s2 = (t - cueShell) * 1.0;
        acc += vec3(1.0, 0.8, 0.75) * (1.5 * k * (uHits / (1.0 + s1 * s1 * s1 * s1) + uCue / (1.0 + s2 * s2 * s2 * s2)));
      }
      t += stp;
      if (t > 20.0) break;
    }
    return screenOf(acc * 2.6);
  }
  float t = 0.02, d = 1.0, glow = 0.0;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    d = mapd(ro + rd * t);
    glow += exp(-d * 14.0) * min(d, 0.3) * exp(-t * 0.14);
    if (d < 0.002 * (1.0 + t)) { hit = true; break; }
    if (t > 26.0) break;
    t += d * 0.9;
  }
  glow *= hit ? 0.06 : 0.2;
  vec3 pos = ro + rd * t;
  vec2 k = vec2(1.0, -1.0) * 0.003 * (1.0 + t * 0.25);
  vec3 n = normalize(k.xyy * mapd(pos + k.xyy) + k.yyx * mapd(pos + k.yyx) + k.yxy * mapd(pos + k.yxy) + k.xxx * mapd(pos + k.xxx));
  float ndv = sat(dot(n, -rd)), fres = pow(1.0 - ndv, 2.5);
  float wave = uHits * exp(-pow((t - shell) * 1.1, 2.0)) + uCue * exp(-pow((t - cueShell) * 0.7, 2.0));
  vec3 col = vec3(0.0);
  vec3 warm = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.78, 0.45), uTone);
  if (hit) {
    // a lamp flies ahead of us
    vec3 l = ro + fw * 3.2 + up * 0.5 - pos; float dist = length(l); l /= dist;
    float dif = sat(dot(n, l)), spec = pow(sat(dot(reflect(rd, n), l)), 24.0);
    float fall = (0.5 + 1.8 * uLevel) / (0.5 + dist * dist * 0.16);
    float ao = sat(0.3 + mapd(pos + n * 0.25) * 3.2);
    float lv = band(fract(pos.y / TAU * 0.5 + 0.5));
    vec3 metal = vec3(1.0, 0.68, 0.24);
    col = metal * warm * fall * ao * (0.6 * dif * dif + 1.6 * spec);
    col += metal * warm * fres * ao * (0.05 + 0.5 * lv * lv);
    col += vec3(1.0, 0.75, 0.4) * wave * (0.03 + 0.5 * fres * fres + 0.5 * spec + 0.2 * dif) * ao;
  }
  col *= exp(-t * 0.11);
  col += warm * vec3(1.0, 0.5, 0.2) * glow * (0.2 + 0.6 * uLevel + 1.2 * wave);
  return screenOf(col);
}
