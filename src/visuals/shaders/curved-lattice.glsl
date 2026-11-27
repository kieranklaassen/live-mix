// name: Curved lattice
// a: Light ribbons
// b: Gold bands
// what: A flight through an endless lattice of curved ribbons made of light, the near ones showing the far ones through them, the colour sliding as it goes deeper.
// follows: The low band makes the ribbons thicker, low, mid and high light them level by level, a hit sends a shell of light out ahead through the lattice.
// own: 0 1 a fine lattice of many small cells, -1 a few great ones; 1 1 straightened to a square scaffold, -1 closed up into whole curved walls; 2 1 wound round the way ahead like a rope, -1 grown crooked, no two cells alike; 3 1 pale: drawn on a bright ground (b: pale stone in white air), -1 a light at the far end and all else in silhouette before it; 4 1 drawn out long ahead, -1 drawn out sideways into layers; 5 1 swollen fat as bone, -1 thin as wire; 6 1 a clear hall is cut through the middle, -1 one ball of it hangs in the open; 7 1 hard drawn lines (b: polished and ringed across like wood), -1 soft smoke (b: wax that light comes through); with any of them set the colours are the sounds' own
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
vec3 gRo, clStretch, clMid;
float clMine, clFat, clWide, clS, clBall;   // clS: how many lattice lengths to one of the eye's
// The lattice is bent before it is looked at: wound round the way ahead, or crooked.
vec3 clBend(vec3 q) {
  if (uOwn[2] == 0.0) return q;
  float z = 0.2 * uOwn[2] * (q.z - gRo.z);
  vec2 w = sin(uOwn[2] > 0.0 ? vec2(z, z + 1.5708) : q.yz * vec2(0.73, 0.61) + vec2(q.x * 0.31, 2.1)), v = q.xy - vec2(1.5708, 0.0);
  q.xy = uOwn[2] > 0.0 ? vec2(1.5708, 0.0) + v.x * w.yx + v.y * vec2(-w.x, w.y) : q.xy - uOwn[2] * 0.75 * w;
  return q;
}
// Where there is any of it: over 0 outside.
float clWhere(vec3 p) {
  float r = length(uOwn[6] > 0.0 ? vec3(p.xy - vec2(1.5708, 0.0), 0.0) : (p - clMid) / clStretch);
  return uOwn[6] > 0.0 ? 3.0 * uOwn[6] - r : r - clBall;
}

// Where two curved walls cross there is a wire. The walls are a gyroid and the surface of cubes and necks.
// a: round wires, in render. b: the walls are given thickness, so the crossing is a flat band with sharp edges.
float mapd(vec3 p) {
  vec3 at = p;
  p = clBend(p);
  vec3 c = cos(p), q = p * 0.5 + vec3(1.0, 0.3, 2.0);
  float g1 = dot(sin(p), c.yzx), g2 = dot(sin(q), cos(q.zxy));
  float d = max(abs(g1) - 0.07 * clFat - 0.16 * uLow, abs(g2) - 0.3 * clWide) * 0.55;
  if (uOwn[1] > 0.0) { c = abs(c); c = max(c, c.yzx); d = mix(d, (min(c.x, min(c.y, c.z)) - 0.16 * clFat - 0.12 * uLow) * 0.8, uOwn[1]); }
  if (uOwn[6] != 0.0) d = max(d, clWhere(at));
  return max(d, 0.4 - length(at - gRo));
}

vec3 render(vec2 p) {
  bool gold = uVar > 0.5;
  float mine = abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7]);
  float pale = max(uOwn[3], 0.0), beyond = max(-uOwn[3], 0.0), ball = max(-uOwn[6], 0.0), hard = max(uOwn[7], 0.0), soft = max(-uOwn[7], 0.0);
  clMine = sat(5.0 * mine); clS = (uOwn[0] == 0.0 ? 1.0 : exp2(0.95 * uOwn[0])) * (1.0 + 1.2 * ball);
  clWide = (uOwn[1] < 0.0 ? 1.0 - 5.0 * uOwn[1] : 1.0) * (uOwn[5] == 0.0 ? 1.0 : mix(1.0, exp2(1.5 * uOwn[5]), 0.4)); clFat = uOwn[5] == 0.0 ? 1.0 : exp2((uOwn[5] > 0.0 ? 1.5 : 1.8) * uOwn[5]);
  clStretch = uOwn[4] == 0.0 ? vec3(1.0) : exp2(uOwn[4] * vec3(0.5, 0.35, -1.0));
  float z = uTravel * 1.5;
  vec3 ro = vec3(PI * 0.5 + 0.3 * sin(z * 0.31), 0.3 * cos(z * 0.23), z);
  gRo = ro;
  float ya = 0.35 * sin(uTime * 0.09), pa = 0.22 * sin(uTime * 0.07 + 1.0);
  vec3 fw = normalize(vec3(sin(ya), sin(pa), 1.0));
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec2 pr = rot(0.3 * sin(uTime * 0.05)) * p;
  vec3 rd = normalize(fw * 0.7 + rt * pr.x + up * pr.y), see = rd;
  clMid = ro + fw * 8.0 * clS * clStretch; clBall = 3.1 * clS / max(ball, 0.04);
  if (mine > 0.0) rd *= clS * clStretch;                 // in lattice lengths
  float clSlow = mine > 0.0 ? 1.0 / length(rd) : 1.0;     // and back
  vec3 paper = mix(uKind[3], vec3(1.0), 0.6) * (1.5 - 0.5 * length(p)), lamp = uKind[3];
  float shell = 1.5 + (1.0 - uHits) * 14.0, cueShell = 1.5 + (1.0 - uCue) * 22.0;

  if (ball > 0.0) { shell += 4.0 * ball; cueShell += 4.0 * ball; }
  if (!gold) {
    // a: the wires are light, not matter. The ray goes on through them and gathers what it passes, so wires seen
    // edge on are brightest and the far ones show through the near ones.
    vec3 acc = vec3(0.0);
    float t = 0.7 + 0.05 * hash21(gl_FragCoord.xy);
    if (ball > 0.0) t += 4.2 * ball;
    bool struck = uHits + uCue > 0.02;
    float thick = (0.05 + 0.15 * uLow) * clFat;
    const vec3 co = vec3(1.0, 0.2675, -0.5048), so = vec3(0.0, 0.9636, 0.8632); // cos and sin of the second wall's shift
    for (int i = 0; i < 52; i++) {
      vec3 at = ro + rd * t, q = clBend(at);
      vec3 s = sin(q), c = cos(q);
      float g1 = dot(s, c.yzx);
      vec3 c2 = c * co - s * so;
      float g2 = (c2.x + c2.y + c2.z) * 0.8;
      if (uOwn[1] < 0.0) g2 *= 1.0 + uOwn[1];
      float away = length(vec2(g1, g2));
      if (uOwn[1] > 0.0) { vec3 cc = c * c, m = cc + cc.yzx; away = mix(away, sqrt(min(m.x, min(m.y, m.z)) + 1e-6), uOwn[1]); }
      float a = abs(away - thick) * 0.5;
      if (mine > 0.0) a *= clSlow;
      float stp = max(a * 0.9, 0.035 + t * 0.008);
      float a1 = a * 60.0 * (1.0 + 1.6 * hard - 0.72 * soft) / (1.0 + t * 0.14), a2 = 1.0 / (1.0 + a * a * 90.0);
      float w = 1.0 / (1.0 + a1 * a1 * a1) + 0.06 * a2 * a2 * (1.0 - 0.8 * hard + 1.5 * soft);
      if (uOwn[5] > 0.0) w += 0.1 * uOwn[5] * step(away, thick);           // fat ones are full of light
      if (uOwn[6] != 0.0) w *= (1.0 - smoothstep(-0.25, 0.35, clWhere(at)));
      // colour slides with depth: teal near, through violet, to amber
      vec3 hue = vec3(0.5, 0.42, 0.52) + vec3(0.5, 0.4, 0.48) * cos(TAU * ((t * 0.07 + uLoop) * vec3(1.0, 0.9, 0.8) + vec3(0.52, 0.3, 0.12)));
      float way = abs(4.0 * fract(t * 0.045 + uLoop + 0.07 * s.y) - 2.0); vec3 own = mix(mix(uKind[0], uKind[1], sat(way)), uKind[3], sat(way - 1.0)); hue = mix(hue, own * own * 1.25, clMine);
      float h = fract(q.y / TAU * 0.5 + 0.5) * 2.0;   // the three bands, stacked by height
      float lv = mix(mix(uLow, uMid, sat(h)), uHigh, sat(h - 1.0));
      float e = 0.14 + 0.85 * uLevel + 1.7 * lv * lv;
      e += 2.0 * pale;
      float far = 1.0 / (1.0 + t * t * 0.016);
      float k = w * stp * far * far;
      if (ball > 0.0) k *= 1.0 + 4.0 * ball;
      acc += hue * (e * k);
      if (struck) {
        float s1 = (t - shell) * 1.3, s2 = (t - cueShell) * 1.0;
        acc += vec3(1.0, 0.8, 0.75) * (1.5 * k * (uHits / (1.0 + s1 * s1 * s1 * s1) + uCue / (1.0 + s2 * s2 * s2 * s2)));
      }
      t += stp;
      if (t > 20.0) break;
    }
    if (mine > 0.0) {
      vec3 light = acc * 2.6; float m = max(light.r, max(light.g, light.b)), r2 = dot(p, p);
      light += beyond * (lamp * lamp * (1.1 * exp(-r2 * 7.0) + 0.4 * exp(-r2 * 1.6)) * (0.55 + 0.7 * uLevel) * exp(-1.4 * m) + uKind[0] * uKind[0] * 0.15 - 0.25 * light);
      light = mix(light, paper * exp(-1.5 * (m * 1.22 - light)), pale);
      return screenOf(light);
    }
    return screenOf(acc * 2.6);
  }
  float t = 0.02, d = 1.0, glow = 0.0;
  if (ball > 0.0) t += 4.7 * ball;
  bool hit = false;
  for (int i = 0; i < 72; i++) {
    d = mapd(ro + rd * t);
    if (mine > 0.0) d *= clSlow;
    glow += exp(-d * 14.0) * min(d, 0.3) * exp(-t * 0.14);
    if (d < 0.002 * (1.0 + t)) { hit = true; break; }
    if (t > 26.0) break;
    t += d * 0.9;
  }
  if (pale > 0.0 && t < 26.0 && d < 0.1) hit = true;   // grazing: no dark creases in white air
  glow *= hit ? 0.06 : 0.2;
  vec3 pos = ro + rd * t;
  vec2 k = vec2(1.0, -1.0) * 0.003 * (1.0 + t * 0.25);
  vec3 n = normalize(k.xyy * mapd(pos + k.xyy) + k.yyx * mapd(pos + k.yyx) + k.yxy * mapd(pos + k.yxy) + k.xxx * mapd(pos + k.xxx) + (mine > 0.0 ? -see * 1e-9 : vec3(0.0)));
  if (mine > 0.0) { n = normalize(n * clStretch); rd = see; }
  float ndv = sat(dot(n, -rd)), fres = pow(1.0 - ndv, 2.5);
  float wave = uHits * exp(-pow((t - shell) * 1.1, 2.0)) + uCue * exp(-pow((t - cueShell) * 0.7, 2.0));
  vec3 col = vec3(0.0), stuff = col; float shade = 1.0;
  vec3 warm = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.78, 0.45), uTone);
  if (hit) {
    // a lamp flies ahead of us
    vec3 l = ro + fw * 3.2 + up * 0.5 - pos; if (mine > 0.0) l = (ro + (fw * (3.2 + 1.8 * ball) + up * (0.5 + 3.5 * ball) - rt * 2.5 * ball) * clS * clStretch - pos) / (clS * clStretch); float dist = length(l); l /= dist + 1e-4;
    float dif = sat(dot(n, l)), spec = pow(sat(dot(reflect(rd, n), l)), 24.0);
    float fall = (0.5 + 1.8 * uLevel) / (0.5 + dist * dist * 0.16);
    float ao = sat(0.3 + mapd(pos + n * 0.25) * 3.2);
    float lv = band(fract(pos.y / TAU * 0.5 + 0.5));
    vec3 metal = vec3(1.0, 0.68, 0.24), base = mix(uKind[0], uKind[1], 0.5 + 0.5 * sin(pos.y * 0.7 + 0.5 * sin(pos.z * 0.6)));
    if (mine > 0.0) {
      base = mix(base, uKind[2], 0.6 * smoothstep(0.3, 0.9, sin(pos.x * 0.8 + 1.0)));
      if (hard > 0.0) { vec3 bq = uOwn[2] != 0.0 ? clBend(pos) : pos; float rings = sin(26.0 * dot(sin(bq * 0.5 + vec3(1.0, 0.3, 2.0)), cos(bq.zxy * 0.5 + vec3(2.0, 1.0, 0.3))) + 1.5 * sin(dot(bq, vec3(1.3, 0.7, 0.9)))); base *= 1.0 - 0.5 * hard * smoothstep(-0.2, 0.9, rings) * sat(1.3 - 0.07 * t); }
      metal = mix(metal, base * base * 1.5, clMine); stuff = metal; shade = ao;
      warm = mix(warm, mix(uKind[3], vec3(1.0), 0.5) * 1.25, clMine);
    }
    col = metal * warm * fall * ao * (0.6 * dif * dif + 1.6 * spec);
    col += metal * warm * fres * ao * (0.05 + 0.5 * lv * lv);
    col += vec3(1.0, 0.75, 0.4) * wave * (0.03 + 0.5 * fres * fres + 0.5 * spec + 0.2 * dif) * ao;
  }
  if (mine > 0.0 && hit) {
    float ao = shade, side = 0.5 + 0.5 * n.y, lv = band(fract(pos.y / TAU * 0.5 + 0.5));
    vec3 b = stuff;
    col += b * ao * ao * (0.02 + 0.3 * lv * lv * clMine * (1.0 - 0.6 * pale));
    col = mix(col, col * 0.45 + mix(b, vec3(0.85), 0.35) * (0.12 + 0.88 * ao * ao) * (0.1 + 0.95 * pow(sat(0.5 + 0.5 * dot(n, vec3(-0.46, 0.74, -0.49))), 1.6)) * (0.75 + 0.25 * uLevel), pale);
    if (soft > 0.0) { // wax: light comes through where it is thin
      float thin = sat(0.55 - mapd(pos + rd * 0.3) * -2.2);
      col = mix(col, b * (0.16 + 0.5 * uLevel + 0.7 * lv * lv) * (0.35 + 1.5 * thin * thin) / (1.0 + 0.02 * t * t) + col * 0.35, soft);
    }
  }
  col *= exp(-t * 0.11 * (1.0 - 0.75 * ball));
  if (mine > 0.0) {
    float fog = hit ? 1.0 - exp(-t * (0.085 - 0.07 * ball)) : 1.0, r2 = dot(p, p);
    float white = 1.0 - exp(-t * t * 0.013); col = mix(col, col * (1.0 - white) + paper * white * (0.7 + 0.3 * white), pale);
    col = mix(col, col * 0.4 + fog * (lamp * lamp * (1.2 * exp(-r2 * 6.0) + 0.4 * exp(-r2 * 1.5)) * (0.55 + 0.7 * uLevel) + uKind[0] * uKind[0] * 0.12), beyond);
    col *= mix(vec3(1.0), uKind[4] * 0.9, sat(wave * pale * 0.9));
    glow *= 1.0 - 0.85 * pale; warm *= mix(vec3(1.0), uKind[4] / vec3(1.0, 0.5, 0.2) * vec3(0.8, 0.6, 0.4), clMine);
  }
  col += warm * vec3(1.0, 0.5, 0.2) * glow * (0.2 + 0.6 * uLevel + 1.2 * wave);
  return screenOf(col);
}
