// name: Light tunnel
// a: Lamp rings
// b: Veined
// what: A flight down a twisting tunnel of black glass whose lamps are the piece itself, wrapped round, with a light at the far end.
// follows: The piece lights the lamps (the floor is the front of the room), the spectrum lights the ribs ring by ring, a hit sends a ring of light away down the tunnel.
const float SIDES = 8.0, RAD = 1.0, ACROSS = 4.0, ALONG = 4.0, LOOPLEN = 16.0;
vec2 path(float z) { return vec2(sin(z * 0.19) * 0.55 + sin(z * 0.071) * 0.6, cos(z * 0.153) * 0.4 + sin(z * 0.047) * 0.3) * mix(1.0, 1.5, uVar); }
float gPulse, gCuePulse; // where the ring of light from a hit and from a cue is, along z
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }

// a: distance to the wall. w = (lamps across all the way round, lamps along), rib = distance to the nearest rib.
float wallA(vec3 p, out vec2 w, out float rib) {
  vec2 q = p.xy - path(p.z);
  q *= rot(p.z * 0.07 + uTime * 0.02);
  float a = atan(q.x, q.y) / TAU * SIDES;
  float s = floor(a), la = a - s - 0.5;
  float r = length(q) * cos(la * TAU / SIDES);
  float d = RAD - r;
  float flat_ = tan(la * TAU / SIDES) / tan(PI / SIDES) * 0.5; // even steps across the flat panel
  float zr = abs(fract(p.z + 0.5) - 0.5);
  rib = zr;
  w = vec2((s + 0.5 + flat_) * ACROSS, p.z * ALONG);
  return d - 0.02 * exp(-zr * zr * 900.0); // a rib is a low bead round the tunnel
}
// The light of the lamp at w: the piece at that place of the loop (along) and of the room (around; the floor is the front).
vec3 lampA(vec2 w, float z, float soft) {
  vec2 id = floor(w), f = fract(w) - 0.5;
  float row = abs(id.x + 0.5) / (SIDES * ACROSS * 0.5);
  float n = ALONG * LOOPLEN;
  vec4 m = piece(vec2((mod(id.y, n) + 0.5) / n, row));
  float loud = sat(m.a * (0.7 + 0.6 * uEnergy));
  float edge = abs(fract(w.y / ALONG + 0.5) - 0.5) * ALONG; // no lamp under a rib
  if (edge < 0.5) loud = 0.0;
  vec2 b = abs(f) - vec2(0.2, 0.36) * (0.35 + 0.65 * sqrt(loud));
  float dd = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.06;
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
  float x = mod(floor(z + 0.5), 16.0) / 15.0;
  float lv = band(x);
  vec3 hue = rich(kindColour(x * 4.0), 1.45);
  vec3 c = hue * (0.07 + 2.4 * lv * lv);
  c += (rich(uKind[4], 1.5) + 0.7) * exp(-pow((z - gPulse) * 1.2, 2.0)) * sqrt(uHits) * 4.0;
  c += vec3(1.0) * exp(-pow((z - gCuePulse) * 0.8, 2.0)) * sqrt(uCue) * 4.0;
  return c;
}

// b: a soft passage.
float wallB(vec3 p) {
  vec2 q = p.xy - path(p.z);
  float a = atan(q.x, q.y), z = p.z;
  float r = length(q);
  float bump = 0.2 * sin(a * 3.0 + z * 0.8 + 1.7 * sin(z * 0.37)) + 0.11 * sin(a * 5.0 - z * 1.9) + 0.07 * sin(z * 4.1 + a * 2.0) * sin(a * 7.0 + z);
  bump += 0.06 * uLow * sin(z * 1.4 - uTime * 1.3); // the low band breathes along the passage
  bump += 0.022 * sin(z * 9.0 + 2.5 * sin(a * 3.0 + z * 0.3)); // fine ribbing
  return (1.05 + bump - r) * 0.62;
}
// Veins on the wall, one family for each kind of sound, light running along them.
vec3 veinsB(vec3 p, float fine) {
  vec2 q = p.xy - path(p.z);
  float a = atan(q.x, q.y), z = p.z;
  vec3 c = vec3(0.0);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float lv = k == 0 ? uDrone : k == 1 ? uPad : k == 2 ? uTexture : k == 3 ? uPhrase : uHits;
    float w = a * (2.0 + mod(fk, 3.0)) + fk * 1.3 + 1.6 * sin(z * (0.5 + 0.13 * fk) + fk * 2.1) + 0.5 * sin(z * 2.3 + a * 3.0 + fk);
    float line = abs(sin(w * 0.5 + 0.5 * z * (mod(fk, 2.0) - 0.5)));
    float run = 0.5 + 0.5 * sin(z * 1.7 - uTime * (1.1 + 0.2 * fk) + fk * 1.9);
    c += rich(uKind[k], 1.8) * (0.04 + 1.6 * lv * run * run) * (fine / (fine + line * line * 90.0));
  }
  c += vec3(1.0, 0.6, 0.45) * exp(-pow((z - gPulse) * 1.1, 2.0)) * uHits * 0.5;
  c += vec3(1.0, 0.85, 0.7) * exp(-pow((z - gCuePulse) * 0.8, 2.0)) * uCue * 0.5;
  return c;
}

float mapd(vec3 p) {
  if (uVar > 0.5) return wallB(p);
  vec2 w; float r; return wallA(p, w, r);
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
  float z0 = uTravel * 1.6;
  vec3 ro = vec3(path(z0), z0);
  vec3 ta = vec3(path(z0 + 2.2), z0 + 2.2);
  ro.xy = mix(ro.xy, ta.xy, 0.15);
  if (!organic) { ro.y -= 0.42; ta.y -= 0.2; }
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec2 pr = rot(0.12 * sin(uTime * 0.11)) * p;
  vec3 rd = normalize(fw * 0.55 + rt * pr.x + up * pr.y);
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
  vec3 pos = ro + rd * t;
  vec2 e = vec2(1.0, -1.0) * 0.004 * (1.0 + t * 0.3);
  vec3 n = normalize(e.xyy * mapd(pos + e.xyy) + e.yyx * mapd(pos + e.yyx) + e.yxy * mapd(pos + e.yxy) + e.xxx * mapd(pos + e.xxx));
  vec3 ld = normalize(far - pos);
  float fres = pow(1.0 - sat(dot(n, -rd)), 3.0);
  vec3 col = vec3(0.0);
  if (organic) {
    vec3 endCol = mix(vec3(1.0, 0.5, 0.28), vec3(1.0, 0.72, 0.5), uTone) * (0.5 + 0.9 * uLevel + 0.4 * uSpace);
    if (hit) {
      float dif = sat(dot(n, ld));
      float spec = pow(sat(dot(reflect(rd, n), ld)), 22.0);
      vec3 flesh = mix(vec3(0.55, 0.04, 0.12), vec3(0.3, 0.05, 0.42), 0.5 + 0.5 * sin(pos.z * 0.4));
      vec3 v = veinsB(pos, 0.1), vwide = veinsB(pos, 2.2);
      col = flesh * endCol * (0.012 + 0.5 * dif * dif);
      col += endCol * spec * 0.5 + endCol * fres * 0.05;
      col += (flesh + 0.25) * vwide * 0.55;     // the veins light the wall round them
      col += v * (0.5 + 0.5 * sat(dot(n, -rd)));
      // a hit: a band of the wall lights up and runs away down the passage
      float ring = exp(-pow((pos.z - gPulse) * 1.0, 2.0)) * uHits + exp(-pow((pos.z - gCuePulse) * 0.7, 2.0)) * uCue;
      col += (flesh * 1.6 + vec3(0.5, 0.2, 0.12)) * ring * (0.25 + 0.75 * fres + 0.6 * dif);
    }
    float fog = 1.0 - exp(-t * 0.085);
    col = col * (1.0 - fog) + endCol * fog * fog * 0.6 * pow(toEnd, 5.0);
    col += endCol * 0.9 * pow(toEnd, 40.0) * fog;
  } else {
    vec3 endCol = mix(vec3(0.5, 0.72, 1.0), vec3(1.0, 0.84, 0.66), uTone) * (0.35 + 1.0 * uLevel + 0.3 * uSpace);
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
      col += mir * (0.07 + 0.75 * fres) * exp(-tr * 0.08);
    }
    col *= exp(-t * 0.075);
    float haze = 1.0 - exp(-t * 0.06);
    col += endCol * haze * (1.4 * pow(toEnd, 90.0) + 0.25 * pow(toEnd, 12.0));
  }
  return screenOf(col);
}
