// name: Folded stone
// a: Lantern
// b: Crystal city
// what: A block of stone folded and pierced over and over until it is lace, turning slowly in the dark with a light burning inside it.
// follows: The tone dial and the place in the loop change the angle of the fold, the level feeds the light inside, the spectrum lights the windows, a hit sends a shell of light out from the middle.
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
mat2 gR1, gR2;
float gTrap; // how near the folds came to an edge: the lit seams

// Fold into one corner, turn a little, treble, pierce: four times over. What is left is a box.
// a is one block; b repeats it without end, so its holes join into streets.
float mapd(vec3 p) {
  if (uVar > 0.5) p = mod(p + 1.0, 2.0) - 1.0;
  float s = 1.0;
  gTrap = 9.0;
  for (int i = 0; i < 4; i++) {
    p = abs(p);
    if (p.x < p.y) p.xy = p.yx;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    p.xy = gR1 * p.xy;
    p.yz = gR2 * p.yz;
    p = p * 3.0 - 2.0;
    if (p.z < -1.0) p.z += 2.0;
    s *= 3.0;
    gTrap = min(gTrap, abs(abs(p.x) - 1.0) + abs(abs(p.y) - 1.0));
  }
  vec3 b = abs(p) - 1.0;
  return (length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0)) / s;
}
vec3 normalAt(vec3 p, float e) {
  vec2 k = vec2(1.0, -1.0) * e;
  return normalize(k.xyy * mapd(p + k.xyy) + k.yyx * mapd(p + k.yyx) + k.yxy * mapd(p + k.yxy) + k.xxx * mapd(p + k.xxx));
}
// Windows on a wall: a grid of small panes, some lit, each in the colour of a kind of sound and as bright as its band.
vec3 windows(vec3 pos, vec3 n, float size) {
  vec3 an = abs(n);
  vec2 uv = an.x > an.y && an.x > an.z ? pos.yz : an.y > an.z ? pos.xz : pos.xy;
  uv *= size;
  vec2 id = floor(uv), f = fract(uv) - 0.5;
  float h = hash21(id + 3.7), h2 = hash21(id * 1.7 + 11.0);
  float pane = smoothstep(0.34, 0.26, abs(f.x)) * smoothstep(0.4, 0.32, abs(f.y));
  float on = smoothstep(0.0, 0.06, 0.16 + 0.3 * uLevel - h);
  // which band a window follows goes by where it is: the city lights up district by district
  float zone = fract(floor(dot(pos, vec3(0.6, 0.9, 1.5))) / 8.0 + 0.16 * h2);
  float lv = band(zone);
  return rich(kindColour(zone * 4.0), 1.8) * pane * on * (0.04 + 2.4 * lv * lv) * (0.5 + 0.5 * h2);
}

vec3 render(vec2 p) {
  bool city = uVar > 0.5;
  float ang = city ? 0.02 + 0.06 * uTone + 0.015 * sin(uLoop * TAU) : 0.015 + 0.07 * uTone + 0.02 * sin(uLoop * TAU);
  gR1 = rot(ang); gR2 = rot((city ? 0.03 : 0.035) * cos(uLoop * TAU));
  vec3 col = vec3(0.0);
  if (!city) {
    float a = uTime * 0.07 + uTravel * 0.04;
    vec3 ro = vec3(sin(a) * 3.3, 1.3 + 0.5 * sin(a * 0.43), cos(a) * 3.3);
    vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
    vec3 rd = normalize(fw * 1.45 + rt * p.x + up * p.y);
    float bq = dot(ro, rd), disc = bq * bq - dot(ro, ro) + 3.4;
    if (disc < 0.0) return col;
    float t = max(-bq - sqrt(disc), 0.0), tmax = -bq + sqrt(disc), d = 1.0, glow = 0.0, steps = 0.0;
    bool hit = false;
    for (int i = 0; i < 64; i++) {
      vec3 q = ro + rd * t;
      d = mapd(q);
      if (d < 0.0015 * t) { hit = true; break; }
      if (t > tmax) break;
      float stp = d * 0.92;
      glow += stp * exp(-dot(q, q) * 5.0);   // the light in the middle, seen through the holes
      t += stp; steps += 1.0;
    }
    vec3 core = mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.78, 0.5), uTone);
    float power = 0.3 + 1.5 * uLevel + 0.5 * uLow;
    if (hit) {
      vec3 pos = ro + rd * t, n = normalAt(pos, 0.0025);
      mapd(pos); float seam = exp(-gTrap * 7.0);
      float r = length(pos), ao = exp(-steps * 0.03);
      vec3 toCore = -pos / r;
      float inward = sat(dot(n, toCore));
      float shell = exp(-pow((r - 0.2 - (1.0 - uHits) * 1.7) * 5.0, 2.0)) * uHits + exp(-pow((r - 0.2 - (1.0 - uCue) * 1.9) * 3.5, 2.0)) * uCue;
      float heat = inward * power * 0.8 / (0.15 + r * r * r) * ao;                         // lit from inside
      col = mix(vec3(0.9, 0.16, 0.04), core, sat(heat * 0.7)) * heat * 0.75;
      col += vec3(0.12, 0.26, 0.7) * (0.006 + 0.05 * sat(dot(n, normalize(vec3(-0.5, 0.8, 0.2))))) * ao; // a cold light outside
      col += vec3(0.2, 0.4, 1.0) * pow(1.0 - sat(dot(n, -rd)), 3.0) * 0.05;
      col += windows(pos, n, 13.5) * ao * 0.8;
      col += core * seam * (0.03 + 0.25 * uHigh) * ao;
      col += (core + vec3(0.4, 0.3, 0.3)) * shell * (0.04 + 1.6 * seam + 0.7 * inward);
    }
    col += core * glow * power * 1.6;
  } else {
    float z = uTravel * 0.3;
    vec3 ro = vec3(0.1 * sin(z * 0.7), 0.06 * sin(z * 0.9 + 1.0), z);
    vec3 fw = normalize(vec3(0.3 * sin(uTime * 0.06), 0.16 * sin(uTime * 0.045 + 2.0), 1.0));
    vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
    vec2 pr = rot(0.15 * sin(uTime * 0.04)) * p;
    vec3 rd = normalize(fw * 0.62 + rt * pr.x + up * pr.y);
    float t = 0.01, d = 1.0, steps = 0.0;
    bool hit = false;
    for (int i = 0; i < 72; i++) {
      d = mapd(ro + rd * t);
      if (d < 0.001 * (1.0 + t * 3.0)) { hit = true; break; }
      if (t > 9.0) break;
      t += d * 0.92; steps += 1.0;
    }
    float shell = exp(-pow((t - 0.3 - (1.0 - uHits) * 5.0) * 3.5, 2.0)) * uHits + exp(-pow((t - 0.3 - (1.0 - uCue) * 7.0) * 2.5, 2.0)) * uCue;
    vec3 endCol = mix(vec3(0.45, 0.65, 1.0), vec3(1.0, 0.75, 0.55), uTone);
    if (hit) {
      vec3 pos = ro + rd * t, n = normalAt(pos, 0.0012 * (1.0 + t));
      mapd(pos); float seam = exp(-gTrap * 9.0);
      float ao = exp(-steps * 0.035);
      float fres = pow(1.0 - sat(dot(n, -rd)), 3.0);
      vec3 l = normalize(vec3(0.0, 0.25, 1.0));     // the light at the end of the street
      float dif = sat(dot(n, -l)) * 0.0 + sat(dot(n, vec3(0.0, 1.0, 0.0))) * 0.5 + 0.5 * sat(-n.z);
      vec3 ice = mix(vec3(0.12, 0.3, 0.75), vec3(0.5, 0.35, 0.95), 0.5 + 0.5 * sin(pos.z * 0.8 + pos.y * 2.0));
      float streak = pow(sat(dot(reflect(rd, n), l)), 6.0);
      col = ice * (0.004 + 0.04 * dif) * ao * (0.35 + 1.0 * uLevel);
      col += ice * fres * 0.04 * ao * (0.4 + uLevel);
      col += mix(endCol, ice, 0.5) * streak * 0.16 * ao * (0.3 + uLevel);
      col += windows(pos, n, 27.0) * ao * 1.5 / (1.0 + t * t * 0.5);
      col += ice * seam * (0.05 + 0.4 * uHigh) * ao;
      col += vec3(0.75, 0.85, 1.0) * shell * (0.02 + 0.8 * seam + 0.2 * fres);
    }
    col *= exp(-t * 0.36);
    float toEnd = sat(dot(rd, vec3(0.0, 0.0, 1.0)));
    col += endCol * (0.3 + 1.0 * uLevel) * (1.0 - exp(-t * 0.3)) * (pow(toEnd, 1500.0) * 2.0 + pow(toEnd, 80.0) * 0.14);
  }
  return screenOf(col);
}
