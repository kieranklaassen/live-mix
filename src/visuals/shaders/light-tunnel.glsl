// name: Light tunnel
// a: Lamp rings
// b: Veined
// what: A flight down a twisting tunnel of black glass whose lamps are the piece itself, wrapped round, with a light at the far end.
// follows: The piece lights the lamps (the floor is the front of the room), the spectrum lights the ribs ring by ring, a hit sends a ring of light away down the tunnel.
// own: 0 the section: 1 round and smooth, -1 a tall square gallery (b: deep folds); 1 1 many and small lamps (b: many fine folds and veins), -1 few and great; 2 the lamps: 1 round dots (b: veins of beads), -1 long strips (b: rings round the passage); 3 1 pale walls in an even light, -1 rough stone; 4 1 the roof is open to a sky, -1 a floor of water; 5 1 a straight way seen through a long lens, -1 one that winds; 6 1 heavy ribs, few and thick, -1 none; 7 the end: 1 a great disc of light in mist, -1 no light there; with any of them the end and the walls take the sounds' colours
const float SIDES = 8.0, RAD = 1.0, ACROSS = 4.0, ALONG = 4.0, LOOPLEN = 16.0;
vec2 path(float z) { return vec2(sin(z * 0.19) * 0.55 + sin(z * 0.071) * 0.6, cos(z * 0.153) * 0.4 + sin(z * 0.047) * 0.3) * mix(1.0, 1.5, uVar) * (1.0 - max(uOwn[5], 0.0) + 1.5 * max(-uOwn[5], 0.0)) * vec2(1.0, 1.0 - sat(-3.0 * uOwn[4])); }
float ltPale, ltRock, ltSky, ltWater, ltRib, ltDyed, ltUp; // how far each of its own numbers is turned
float gPulse, gCuePulse; // where the ring of light from a hit and from a cue is, along z
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }

// The sky over an open roof.
vec3 ltSkyOf(vec3 rd) {
  float u = sat(rd.y * 1.1 + 0.12);
  vec3 c = mix(uKind[1] * uKind[1] * 1.1, uKind[0] * uKind[0] * 0.6, smoothstep(0.0, 0.8, u)) * mix(0.35, 1.5, ltPale);
  vec2 g = rd.xy / (abs(rd.z) + 0.4) * 34.0, id = floor(g);
  float h = hash21(id);
  return c + (1.0 - ltPale) * 0.5 * step(0.94, h) * u * smoothstep(0.14, 0.0, length(fract(g) - 0.3 - 0.4 * hash22(id + 3.0)));
}
// The rib's height and how far along z it repeats.
float ltStep() { return exp2(ltRib); }
float ltBead(float zr) {
  float s = ltRib > 0.0 ? smoothstep(0.17, 0.07, zr * 0.5) : 0.0;
  return 0.02 * exp(-zr * zr * 900.0) * (1.0 - ltRib) * (1.0 - max(-uOwn[6], 0.0)) + 0.17 * ltRib * s;
}
// a: distance to the wall. w = (lamps across all the way round, lamps along), rib = distance to the nearest rib.
float wallA(vec3 p, out vec2 w, out float rib) {
  vec2 q = p.xy - path(p.z);
  if (ltUp < 1.0) q *= rot((p.z * 0.07 * (1.0 + 3.0 * max(-uOwn[5], 0.0)) + uTime * 0.02) * (1.0 - ltUp));
  float a = atan(q.x, q.y) / TAU * SIDES;
  float s = floor(a), la = a - s - 0.5;
  float r = length(q) * cos(la * TAU / SIDES);
  float d = RAD - r;
  float flat_ = tan(la * TAU / SIDES) / tan(PI / SIDES) * 0.5; // even steps across the flat panel
  float zr = abs(fract(p.z + 0.5) - 0.5);
  if (uOwn[0] > 0.0) d = mix(d, RAD - length(q), uOwn[0]);
  if (uOwn[0] < 0.0) {
    vec2 b = vec2(0.86, 1.08) - abs(q);
    d = mix(d, min(b.x, b.y), -uOwn[0]);
  }
  rib = zr;
  if (ltRib > 0.0) zr = abs(fract(p.z / ltStep() + 0.5) - 0.5) * ltStep();
  rib = zr;
  w = vec2((s + 0.5 + flat_) * ACROSS, p.z * ALONG);
  if (uOwn[0] < 0.0) {                             // on a flat wall the lamps stand level
    float flatW = abs(q.x) * 1.08 > abs(q.y) * 0.86 ? sign(q.x) * (2.0 - 1.3 * q.y) : (q.y > 0.0 ? q.x * 0.7 : sign(q.x) * 4.0 - q.x * 0.7);
    w.x = mix(w.x, flatW * ACROSS, -uOwn[0]);
  }
  if (uOwn[6] != 0.0) return d - ltBead(zr);
  return d - 0.02 * exp(-zr * zr * 900.0); // a rib is a low bead round the tunnel
}
// The light of the lamp at w: the piece at that place of the loop (along) and of the room (around; the floor is the front).
vec3 lampA(vec2 w, float z, float soft) {
  float more = uOwn[1] < 0.0 ? exp2(uOwn[1]) : exp2(uOwn[1]);
  if (uOwn[1] != 0.0) w *= more;
  vec2 id = floor(w), f = fract(w) - 0.5;
  float row = abs(id.x + 0.5) / (SIDES * ACROSS * 0.5);
  float n = ALONG * LOOPLEN;
  if (uOwn[1] != 0.0) { row /= more; n *= more; }
  vec4 m = piece(vec2((mod(id.y, n) + 0.5) / n, row));
  float loud = sat(m.a * (0.7 + 0.6 * uEnergy));
  float edge = abs(fract(w.y / ALONG + 0.5) - 0.5) * ALONG; // no lamp under a rib
  if (uOwn[6] != 0.0 || uOwn[1] != 0.0) {
    float zz = (id.y + 0.5) / (ALONG * more);
    edge = uOwn[6] < 0.0 || ltRib > 0.0 || more < 1.0 ? 9.0 : 1.0 + (abs(fract(zz + 0.5) - 0.5) - 0.06 - 0.5 / (ALONG * more)) * 30.0;
  }
  if (edge < 0.5) loud = 0.0;
  vec2 b = abs(f) - vec2(0.2, 0.36) * (0.35 + 0.65 * sqrt(loud));
  float dd = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.06;
  if (uOwn[2] > 0.0) dd = mix(dd, length(f) - 0.44 * (0.3 + 0.7 * sqrt(loud)), uOwn[2]);
  if (uOwn[2] < 0.0) dd = mix(dd, abs(f.x) - 0.16 * (0.25 + 0.75 * sqrt(loud)), -uOwn[2]);
  float mask = smoothstep(soft, -soft, dd) + soft * 0.6 * exp(-max(dd, 0.0) * 6.0);
  vec3 hue = rich(m.rgb / max(m.a, 0.001), 1.7);
  float now = exp(-pow((fract(id.y / n - uLoop + 0.5) - 0.5) * n * 0.5, 2.0)); // the place that is sounding now
  vec3 c = hue * (0.012 + loud * loud * (0.75 + 1.5 * now));
  c += rich(uKind[4], 1.6) * exp(-pow((z - gPulse) * 1.2, 2.0)) * uHits * 1.2;
  c += vec3(0.8, 0.9, 1.0) * exp(-pow((z - gCuePulse) * 0.8, 2.0)) * uCue * 1.2;
  return c * mask;
}
// The light of the rib nearest z: one band of the spectrum, low to high over sixteen ribs.
vec3 ribA(float z) {
  float x = mod(floor(ltRib > 0.0 ? z / ltStep() + 0.5 : z + 0.5), 16.0) / 15.0;
  float lv = band(x);
  vec3 hue = rich(kindColour(x * 4.0), 1.45);
  vec3 c = hue * (0.07 + 2.4 * lv * lv);
  c += (rich(uKind[4], 1.5) + 0.7) * exp(-pow((z - gPulse) * 1.2, 2.0)) * sqrt(uHits) * 4.0;
  c += vec3(1.0) * exp(-pow((z - gCuePulse) * 0.8, 2.0)) * sqrt(uCue) * 4.0;
  return c * (1.0 - 0.75 * max(max(ltPale, ltRock), max(-uOwn[6], 0.0))) * (1.0 - max(-uOwn[6], 0.0));
}

// b: a soft passage.
float wallB(vec3 p) {
  vec2 q = p.xy - path(p.z);
  float a = atan(q.x, q.y), z = p.z;
  float r = length(q);
  float bump = 0.2 * sin(a * 3.0 + z * 0.8 + 1.7 * sin(z * 0.37)) + 0.11 * sin(a * 5.0 - z * 1.9) + 0.07 * sin(z * 4.1 + a * 2.0) * sin(a * 7.0 + z);
  if (uOwn[0] > 0.0) bump *= 1.0 - 0.85 * uOwn[0];
  if (uOwn[0] < 0.0) bump = mix(bump, 0.42 * sin(a * 3.0 + 0.5 * z) + 0.2 * sin(a * 5.0 - 1.1 * z + sin(z * 0.5)), -uOwn[0]);
  if (uOwn[1] > 0.0) bump = mix(bump, 0.5 * bump + 0.11 * sin(a * 11.0 + 1.5 * sin(z * 0.6)) + 0.05 * sin(a * 22.0 + z), uOwn[1]);
  if (uOwn[1] < 0.0) bump = mix(bump, 0.26 * sin(a * 2.0 + z * 0.5 + sin(z * 0.3)) + 0.1 * sin(z * 1.1 + a), -uOwn[1]);
  if (ltRib > 0.0) bump = mix(bump, 0.4 * bump - 0.3 * pow(0.5 + 0.5 * cos(z * 3.0 + a), 4.0) + 0.1, ltRib);
  bump += 0.06 * uLow * sin(z * 1.4 - uTime * 1.3); // the low band breathes along the passage
  bump += 0.022 * sin(z * 9.0 + 2.5 * sin(a * 3.0 + z * 0.3)); // fine ribbing
  if (uOwn[6] < 0.0) bump += uOwn[6] * 0.022 * sin(z * 9.0 + 2.5 * sin(a * 3.0 + z * 0.3));
  return (1.05 + bump - r) * (0.62 - 0.17 * max(ltRib, max(-uOwn[0], max(uOwn[1], 0.0))));
}
// Veins on the wall, one family for each kind of sound, light running along them.
vec3 veinsB(vec3 p, float fine) {
  vec2 q = p.xy - path(p.z);
  float a = atan(q.x, q.y), z = p.z;
  vec3 c = vec3(0.0);
  float more = uOwn[1] == 0.0 ? 1.0 : exp2(uOwn[1]), thin = 90.0 * (uOwn[1] < 0.0 ? exp2(1.5 * uOwn[1]) : 1.0);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float lv = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits;
    float w = a * (2.0 + mod(fk, 3.0)) + fk * 1.3 + 1.6 * sin(z * (0.5 + 0.13 * fk) + fk * 2.1) + 0.5 * sin(z * 2.3 + a * 3.0 + fk);
    float line = abs(sin(w * 0.5 + 0.5 * z * (mod(fk, 2.0) - 0.5)));
    if (uOwn[1] > 0.0) line = mix(line, abs(sin(w * 1.5 + fk)), uOwn[1]);
    if (uOwn[2] < 0.0) line = mix(line, abs(sin(1.1 * z * (1.0 + 0.13 * fk) + fk * 1.3 + 0.35 * sin(a * 2.0 + fk))) * 1.4, -uOwn[2]);
    float run = 0.5 + 0.5 * sin(z * 1.7 - uTime * (1.1 + 0.2 * fk) + fk * 1.9);
    c += rich(uKind[k], 1.8) * (0.04 + 1.6 * lv * run * run) * (fine / (fine + line * line * thin)) * (uOwn[2] > 0.0 ? mix(1.0, 2.2 * smoothstep(0.1, 0.85, sin(z * 11.0 * more + fk * 2.0 + 2.0 * sin(a * 2.0))), uOwn[2] * smoothstep(1.5, 0.2, fine)) : 1.0);
  }
  c += vec3(1.0, 0.6, 0.45) * exp(-pow((z - gPulse) * 1.1, 2.0)) * uHits * 0.5;
  c += vec3(1.0, 0.85, 0.7) * exp(-pow((z - gCuePulse) * 0.8, 2.0)) * uCue * 0.5;
  return c;
}

float mapd(vec3 p) {
  vec2 w; float r;
  if (uVar > 0.5) return wallB(p);
  return wallA(p, w, r);
}
// A wall of another stuff than glass or flesh, at a place on it: pale, or of stone, or not there at all.
// was: as it is seen plain; glow: the coloured light there; tint: its own colour.
vec3 ltStuff(vec3 was, vec3 pos, vec3 n, vec3 rd, vec3 ld, vec3 glow, vec3 tint, vec3 endCol, float t, float joint) {
  vec3 c = was;
  float ao = sat(mapd(pos + n * 0.4) / 0.36), a2 = sat(mapd(pos + n * 0.12) / 0.11);
  ao *= 0.35 + 0.65 * a2;
  if (ltPale > 0.0) {
    float sky = 0.5 + 0.5 * n.y, g = noise(pos * 6.0);
    vec3 alb = mix(vec3(0.97, 0.95, 0.92), tint * (0.6 + 0.5 * ao), 0.55 + 0.45 * (1.0 - ao)) * (0.94 + 0.1 * g);
    float shade = 0.05 + 0.42 * sky * sky + 0.6 * sat(dot(n, ld)) + 0.5 * sat(0.8 * n.x - 0.1) + 0.16 * sat(dot(n, -rd));
    vec3 lit = alb * alb * shade * (1.9 + 0.3 * uLevel) * (0.24 + 0.76 * ao) * (1.0 - 0.35 * joint);
    float k = sat(max(glow.r, max(glow.g, glow.b)) * 1.3);
    c = mix(c, lit * (1.0 - 0.85 * k) + glow * 0.75, ltPale);
  }
  if (ltRock > 0.0) {
    vec3 s = pos * 2.6;
    float b0 = fbm(s), b1 = fbm(s + 0.12 * ld + vec3(0.0, 0.05, 0.0)), fine = noise(pos * 19.0);
    vec3 alb = (1.0 - 0.7 * joint) * (0.25 + 0.75 * ao) * tint * (0.3 + 0.8 * b0) * (0.7 + 0.5 * fine);
    float shade = 0.05 + 0.55 * sat(0.25 + 0.75 * dot(n, ld)) * sat(1.0 + 5.0 * (b0 - b1)) + 0.1 * sat(dot(n, -rd));
    c = mix(c, alb * (shade * (0.25 + endCol) + glow * 1.6) + glow * (uVar > 0.5 ? 0.65 : 0.22), ltRock);
  }
  return c;
}
// What the wall of a gives off at a place on it: the rib's line and its spill on the glass, and the lamps.
vec3 lightA(vec3 pos, float soft) {
  vec2 w; float rib;
  wallA(pos, w, rib);
  float line = smoothstep(0.02 + soft * 0.3, 0.008, rib);
  return ribA(pos.z) * (line + 0.1 * exp(-rib * 12.0)) + lampA(w, pos.z, soft);
}

vec3 render(vec2 p) {
  bool organic = uVar > 0.5;
  ltPale = max(uOwn[3], 0.0); ltRock = max(-uOwn[3], 0.0); ltSky = max(uOwn[4], 0.0); ltWater = max(-uOwn[4], 0.0); ltRib = max(uOwn[6], 0.0);
  ltUp = max(max(-uOwn[0], 0.0), max(ltSky, ltWater));
  ltDyed = sat(3.0 * (abs(uOwn[0]) + abs(uOwn[1]) + abs(uOwn[2]) + abs(uOwn[3]) + abs(uOwn[4]) + abs(uOwn[5]) + abs(uOwn[6]) + abs(uOwn[7])));
  float disc = max(uOwn[7], 0.0), shut = max(-uOwn[7], 0.0);
  float z0 = uTravel * 1.6;
  vec3 ro = vec3(path(z0), z0);
  vec3 ta = vec3(path(z0 + 2.2), z0 + 2.2);
  ro.xy = mix(ro.xy, ta.xy, 0.15);
  if (!organic) { ro.y -= 0.42; ta.y -= 0.2; }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec2 pr = rot(0.12 * sin(uTime * 0.11) * (1.0 - 0.8 * ltUp)) * p;
  vec3 rd = normalize(fw * (0.55 + 0.75 * max(uOwn[5], 0.0)) + rt * pr.x + up * pr.y);
  gPulse = z0 + 1.0 + (1.0 - uHits) * 13.0;
  gCuePulse = z0 + 1.0 + (1.0 - uCue) * 22.0;
  vec3 far = vec3(path(z0 + 30.0), z0 + 30.0);
  float toEnd = sat(dot(rd, normalize(far - ro)));

  float t = 0.05, d = 1.0;
  bool hit = false;
  for (int i = 0; i < 48; i++) {
    d = mapd(ro + rd * t);
    if (d < 0.003 * (1.0 + t)) { hit = true; break; }
    if (t > 30.0) break;
    t += d * 0.95;
  }
  if (t < 30.0) hit = true;
  bool water = false;
  if (ltWater > 0.0 && rd.y < 0.0) {               // the water lies level on the floor of it
    float tw = (-mix(1.5, organic ? 0.5 : 0.72, sat(3.0 * ltWater)) - ro.y) / rd.y;
    if (tw > 0.0 && tw < t) { t = tw; water = true; hit = true; }
  }
  vec3 pos = ro + rd * t;
  vec2 e = vec2(1.0, -1.0) * 0.004 * (1.0 + t * 0.3);
  vec3 n = normalize(e.xyy * mapd(pos + e.xyy) + e.yyx * mapd(pos + e.yyx) + e.yxy * mapd(pos + e.yxy) + e.xxx * mapd(pos + e.xxx));
  vec3 ld = normalize(far - pos);
  if (water) n = normalize(vec3(0.0, 1.0, 0.0) + (0.006 + 0.012 * uLow) * exp(-t * 0.12) * vec3(noise(pos.xz * vec2(4.0, 2.0) + uTime * 0.21) - 0.5, 0.0, noise(pos.xz * vec2(3.0, 2.5) - uTime * 0.17 + 9.0) - 0.5) * 6.0);
  float roof = 0.0;
  if (ltSky > 0.0) {
    float over = pos.y - path(pos.z).y;
    roof = ltSky * (organic ? smoothstep(0.0, 0.03 + 0.012 * t, over - 0.3 - 0.14 * sin(pos.z * 0.9 + sign(pos.x) * 1.2) - 0.16 * noise(pos.xz * 2.2)) : smoothstep(-0.4, -0.15, over));
  }
  float fres = pow(1.0 - sat(dot(n, -rd)), 3.0);
  vec3 col = vec3(0.0);
  if (organic) {
    vec3 endCol = mix(vec3(1.0, 0.5, 0.28), vec3(1.0, 0.72, 0.5), uTone) * (0.5 + 0.9 * uLevel + 0.4 * uSpace);
    if (ltDyed > 0.0) endCol = mix(endCol, mix(uKind[3] * uKind[3], uKind[1] * uKind[1], 0.35 - 0.2 * uTone) * (0.6 + 0.8 * uLevel + 0.3 * uSpace), ltDyed) * (1.0 - 0.85 * shut);
    if (hit) {
      float dif = sat(dot(n, ld));
      float spec = pow(sat(dot(reflect(rd, n), ld)), 22.0);
      vec3 flesh = mix(vec3(0.55, 0.04, 0.12), vec3(0.3, 0.05, 0.42), 0.5 + 0.5 * sin(pos.z * 0.4));
      if (ltDyed > 0.0) flesh = mix(flesh, mix(uKind[0] * uKind[0], uKind[1] * uKind[1], 0.5 + 0.5 * sin(pos.z * 0.4)) * 0.55, ltDyed);
      vec3 v = veinsB(pos, 0.1), vwide = veinsB(pos, 2.2);
      col = flesh * endCol * (0.012 + 0.5 * dif * dif);
      col += endCol * spec * 0.5 + endCol * fres * 0.05;
      col += (flesh + 0.25) * vwide * 0.55;     // the veins light the wall round them
      col += v * (0.5 + 0.5 * sat(dot(n, -rd)));
      // a hit: a band of the wall lights up and runs away down the passage
      float ring = exp(-pow((pos.z - gPulse) * 1.0, 2.0)) * uHits + exp(-pow((pos.z - gCuePulse) * 0.7, 2.0)) * uCue;
      col += (flesh * 1.6 + vec3(0.5, 0.2, 0.12)) * ring * (0.25 + 0.75 * fres + 0.6 * dif);
      vec3 tint = sqrt(flesh / 0.55);
      float form = max(abs(uOwn[0]), max(abs(uOwn[1]), ltRib));
      if (form > 0.0 && ltPale + ltRock < 1.0) {    // a little light of its own, so that its form is seen
        float ao = sat(mapd(pos + n * 0.4) / 0.36);
        col += form * flesh * (0.03 + 0.3 * ao * ao * ao) * (0.35 + 0.65 * sat(dot(n, normalize(vec3(-0.3, 0.8, 0.2)))) + dif) * exp(-t * 0.05);
      }
      if (ltPale > 0.0 || ltRock > 0.0) col = ltStuff(col, pos, n, rd, ld, v * 0.9 + vwide * 0.3 * (1.0 - 0.7 * ltPale) + uKind[4] * ring * 0.5, tint, endCol, t, 0.8 * smoothstep(0.15, 0.95, sin(pos.z * 17.0 + 6.0 * noise(pos * 0.9) + 2.0 * noise(pos * 4.0)) * (0.4 + 0.9 * noise(pos * 1.7 + 5.0))) * smoothstep(8.0, 1.0, t));
      if (water) {
        vec3 rr = reflect(rd, n);
        float tr = 0.05;
        for (int i = 0; i < 14; i++) { float dr = wallB(pos + rr * tr); if (dr < 0.01 || tr > 12.0) break; tr += dr; }
        vec3 p2 = pos + rr * tr, mir = veinsB(p2, 0.2) * (0.8 - 0.5 * ltPale) + endCol * 0.8 * pow(sat(dot(rr, ld)), 14.0);
        mir += mix(flesh * veinsB(p2, 2.2) * 0.6, vec3(0.5) * (0.4 + 0.6 * tint), ltPale);
        col = mix(mix(flesh * 0.1, tint * 0.5, 0.6 * ltPale), mir * exp(-tr * 0.1), 0.25 + 0.75 * fres) + uKind[4] * ring * 0.2;
      }
      if (roof > 0.0) col = mix(col, ltSkyOf(rd) + 0.14 * v * exp(-t * 0.3), roof);
    }
    float fog = 1.0 - exp(-t * 0.085 * (1.0 + 0.8 * disc) * (1.0 - 0.35 * ltPale));
    if (ltPale > 0.0) col = mix(col, endCol * 0.95 + 0.06, fog * fog * ltPale * 0.85 * (1.0 - roof));
    if (roof > 0.0) fog *= 1.0 - roof;
    col = col * (1.0 - fog) + endCol * fog * fog * 0.6 * pow(toEnd, 5.0);
    col += endCol * 0.9 * pow(toEnd, 40.0) * fog * (1.0 - 0.6 * ltPale);
  } else {
    vec3 endCol = mix(vec3(0.5, 0.72, 1.0), vec3(1.0, 0.84, 0.66), uTone) * (0.35 + 1.0 * uLevel + 0.3 * uSpace);
    if (ltDyed > 0.0) endCol = mix(endCol, mix(uKind[0] * uKind[0], uKind[3] * uKind[3], 0.5 + 0.4 * uTone) * (0.5 + 0.9 * uLevel + 0.3 * uSpace), ltDyed) * (1.0 - 0.85 * shut);
    if (hit) {
      col = lightA(pos, 0.03 + t * 0.012);
      // black glass: it mirrors what is across the tunnel
      vec3 rr = reflect(rd, n);
      float tr = 0.1, dr = 1.0;
      for (int i = 0; i < 14; i++) {
        dr = mapd(pos + rr * tr);
        if (dr < 0.01 || tr > 12.0) break;
        tr += dr;
      }
      vec3 mir = lightA(pos + rr * tr, 0.08 + tr * 0.03);
      mir += endCol * 2.0 * pow(sat(dot(rr, normalize(far - pos))), 50.0);
      float matte = water ? 0.0 : max(ltPale * 0.85, ltRock);
      col += mir * (0.07 + 0.75 * fres) * exp(-tr * 0.08) * (1.0 - matte);
      vec3 tint = mix(uKind[0], uKind[1], 0.35 + 0.3 * sin(pos.z * 0.3));
      if (water) {
        if (ltSky > 0.0) mir = mix(mir, ltSkyOf(rr), ltSky);
        col = mix(uKind[0] * uKind[0] * mix(0.03, 0.5, ltPale), mir * 1.4 * exp(-tr * 0.08) + ltPale * vec3(0.45) * (0.4 + 0.6 * tint), 0.2 + 0.8 * fres);
      } else if (ltPale > 0.0 || ltRock > 0.0) {
        vec2 w; float rib;
        wallA(pos, w, rib);
        vec4 m = piece(vec2(fract(w.y / (ALONG * LOOPLEN)), min(abs(w.x) / (SIDES * ACROSS * 0.5), 0.99)));
        vec2 wf = w * exp2(uOwn[1]);
        if (ltRock > 0.0) wf.x += 0.5 * mod(floor(wf.y), 2.0) * ltRock;
        vec2 je = 0.5 - abs(fract(wf) - 0.5);
        float jw = 0.03 + 0.016 * t, joint = smoothstep(0.03 + jw, 0.03 - 0.2 * jw, min(je.x, je.y)) * smoothstep(14.0, 2.0, t);
        col = ltStuff(col, pos, n, rd, ld, col, mix(tint, tint * tint, ltRock), endCol, t, joint) + m.rgb * m.rgb * (0.5 + m.a) * (ltRock * tint * 0.9 + ltPale * 0.1);
        col *= 1.0 - 0.35 * max(ltPale, ltRock) * smoothstep(0.1, 0.0, abs(rib - 0.2 * ltRib)) * step(0.01, ltRib);
      }
      if (roof > 0.0) {
        vec2 w; float rib;
        wallA(pos, w, rib);
        float bar = ltRib > 0.0 ? smoothstep(0.3, 0.2, rib) : smoothstep(0.03, 0.015, rib) * (1.0 - max(-uOwn[6], 0.0));
        col = mix(col, ltSkyOf(rd) + lampA(w, pos.z, 0.03 + t * 0.012), roof * (1.0 - bar));
      }
    }
    float clear = 1.0 - max(roof, ltPale);
    col *= mix(1.0, exp(-t * 0.075), clear);
    float haze = 1.0 - exp(-t * 0.06);
    if (disc > 0.0) haze = mix(haze, 1.0 - exp(-t * 0.1), disc);
    if (ltPale > 0.0) col = mix(col, endCol * 0.75 + 0.15, ltPale * (1.0 - roof) * haze * haze * 0.85);
    if (disc > 0.0) col = mix(col, endCol * 0.4, disc * haze * haze * (1.0 - roof) * (1.0 - ltPale) * 0.75);
    haze *= 1.0 - 0.7 * roof;
    col += endCol * haze * (1.4 * pow(toEnd, 90.0) + 0.25 * pow(toEnd, 12.0));
  }
  if (disc > 0.0) {
    vec3 sun = mix(uKind[3] * uKind[3], vec3(1.0, 0.96, 0.88), 0.35) * (0.8 + 0.6 * uLevel);
    float e = acos(min(toEnd, 1.0)), r = 0.3 / (1.0 + 0.6 * max(uOwn[5], 0.0)) + 0.02 * uLow;
    col = mix(col, sun, disc * smoothstep(4.0, 9.0, t) * (smoothstep(r + 0.012, r - 0.012, e) + 0.35 * exp(-max(e - r, 0.0) * 5.0) * step(r, e)));
  }
  return screenOf(col);
}
