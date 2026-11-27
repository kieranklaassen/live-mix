// name: Opening stars
// a: Carved plaster
// b: Under the dome
// what: A wall of white plaster cut two fingers deep into a net of woven straps and stars, seen at a slant, with the low sun falling on it through an arch out of sight and blue shade in the rest; or the same net inside a shallow dome, in rings that lessen toward a round of daylight, with one round of sun lying on the far side.
// follows: The mix opens one angle, and every star sharpens; Tone sets its middle, Space the depth of the cut. Pockets take the colours of the piece and the spectrum: great stars the drone, kites the pad, six points the phrase, edges the texture. Lows lower the sun, a hit runs as a deepening ring, a cue draws a blade of sun across. Keys and voice light the flowers.
// own: 0 1 a fine net of many stars, -1 one great star and its neighbours close up; 1 1 needle sharp stars with long rays, -1 blunt many sided rounds; 2 1 the straps bow out into petals and foils, -1 they bow in like thorns; 3 1 broad bands that leave small cells, -1 thin round wires; 4 1 cut right through with the sky behind it, -1 flat glazed tiles in the colours of the sounds; 5 1 polished metal by one lamp, -1 rough stone in the colour of the drone in open daylight; 6 1 a floor you glide over to the horizon (b: straight below the opening, turning), -1 faced squarely (b: the side of the vault); 7 1 sand, snow or moss in the colour of the texture has drifted over it, -1 the cells filled with still water
float spC, spS;      // cosine and sine of the one angle at which all lines meet
float spRin;         // how far the hollow corners of the great stars lie from their middles
float spDeep;        // how deep the cut is here
float spFine;        // 1 near, 0 where a pixel is wider than the fine work
float spOff;         // out of the cut: how far from the nearest strap
vec2 spIn;           // where in the one folded triangle we are
float spEdge;        // how much of the pixel belongs to a strap the ray just missed
float spW;           // half a strap
float spBow;         // how far a strap bows between its crossings
float spLift;        // 1, and less where the work lies flat
float spWear;        // how high the drift lies here
vec2 spDune;         // and how it slopes
float spRing;        // the ring of a hit here
float spSide;        // which side of a strap: over 0 toward its corner
vec3 spIs;           // in a great star, in a four corner, in a six point: over 0
const float SPA = 0.009;    // how far a strap lifts where it goes over, and dips where it goes under
// One strap in one corner of the triangle: e along a side from the corner and out from it, r the reach of the side's midpoint,
// k the corner's tangent, t2 the cosine and sine of the whole corner, way which strand lies on top.
float spStrap(vec2 e, float r, float k, vec2 t2, float way, float z) {
  if (e.y > e.x * k) { e = vec2(dot(t2, e), t2.y * e.x - t2.x * e.y); way = -way; }
  vec2 q = vec2(r - e.x, e.y);
  float d = abs(q.x * spC - q.y * spS), t = q.x * spS + q.y * spC;
  spSide = q.x * spC - q.y * spS;
  if (spBow != 0.0) {
    spSide = (spSide + spBow * t * t) / sqrt(1.0 + 4.0 * spBow * spBow * t * t);
    d = abs(spSide);
  }
  spOff = min(spOff, d - spW);
  float top = spFine * spLift * SPA * way * exp(-t * t * 600.0);
  float g = (d - 0.5 * spW) / 0.0035;
  top -= spFine * spLift * 0.006 * exp(-g * g);
  // a strap's face falls off a little to its edges
  top -= 0.16 * max(d - spW * 0.72, 0.0);
  if (uOwn[3] < 0.0) top -= -uOwn[3] * 0.9 * d * min(d / spW, 1.0);
  return max(d - spW + 0.12 * min(z, 0.0), z - top);
}
// The carved wall as a distance; z is 0 at its face.
float spCut(vec3 s) {
  const vec2 g = vec2(1.0, 1.7320508);
  vec2 a = mod(s.xy, g) - 0.5 * g, b = mod(s.xy - 0.5 * g, g) - 0.5 * g;
  vec2 h = dot(a, a) < dot(b, b) ? a : b;
  float way = h.x * h.y < 0.0 ? -1.0 : 1.0;
  h = abs(h);
  float k = 0.8660254 * h.y - 0.5 * h.x;
  if (k > 0.0) { h -= 2.0 * k * vec2(-0.5, 0.8660254); way = -way; }
  if (h.y < 0.0) { h.y = -h.y; way = -way; }
  spIn = h;
  spOff = 1.0;
  float d = spStrap(h, 0.3943376, 0.2679492, vec2(0.8660254, 0.5), way, s.z);
  spIs.x = spSide;
  d = min(d, spStrap(vec2(0.5 - h.x, h.y), 0.1056624, 1.0, vec2(0.0, 1.0), -way, s.z));
  spIs.y = spSide;
  d = min(d, spStrap(vec2(0.2886751 - h.y, 0.5 - h.x), 0.1830127, 0.5773503, vec2(0.5, 0.8660254), -way, s.z));
  spIs.z = spSide;
  // the floor of a pocket: a trench along the straps, a raised field inside it
  float fl = -spDeep * (1.0 - 0.42 * smoothstep(0.022, 0.034, spOff));
  // a flower of twelve petals on the field of each great star, and a button in it
  vec2 e = vec2(0.9659258 * h.x + 0.258819 * h.y, 0.258819 * h.x - 0.9659258 * h.y);
  float q = spRin * 0.8 - 0.05;
  vec2 el = vec2((e.x - 0.62 * q) / (0.4 * q), e.y / (0.14 * q));
  float pet = 1.0 - dot(el, el);
  float flower = (1.0 - max(uOwn[4], 0.0)) * (1.0 - min(max(-uOwn[7], 0.0) + (uVar < 0.5 ? max(uOwn[6], 0.0) : 0.0), 1.0));
  if (uOwn[4] > 0.0) fl = mix(fl, -spDeep, uOwn[4]);
  fl += flower * spFine * 0.45 * spDeep * smoothstep(0.0, 0.6, pet) * (1.0 - 0.35 * smoothstep(0.4, 1.0, pet));
  fl += flower * 0.5 * spDeep * (1.0 - smoothstep(0.11, 0.17, length(h) / q));
  if (uOwn[7] > 0.0) { float ov = max(0.02 - abs(fl - spWear), 0.0); fl = max(fl, spWear) + 0.25 * ov * ov / 0.02; }
  return min(d, (s.z - fl) * 0.8);
}
// Walks a ray down into the cut. w is how wide a pixel is here: spEdge says how much of it a strap just missed still covers.
vec3 spWalk(vec3 s, vec3 v, float w) {
  float t = 0.0, last = 0.0, near = 1.0;
  for (int i = 0; i < 12; i++) {
    float d = spCut(s + v * t);
    if (d > last && s.z + v.z * t > -0.03 && i > 0) near = min(near, last);
    last = d;
    t += d;
    if (d < 0.0008) break;
  }
  spEdge = sat(1.0 - near / w);
  return s + v * t;
}
vec3 spNormal(vec3 s, float e) {
  float d = spCut(s);
  return normalize(vec3(spCut(s + vec3(e, 0, 0)) - d, spCut(s + vec3(0, e, 0)) - d, spCut(s + vec3(0, 0, e)) - d) + vec3(0, 0, 1e-5));
}
// How much of a light in direction l comes down to s.
float spSun(vec3 s, vec3 l, float soft) {
  float t = 0.014, o = 1.0;
  for (int i = 0; i < 7; i++) {
    float d = spCut(s + l * t);
    o = min(o, 0.5 + 0.5 * d / (soft * t + 0.001));
    if (o < 0.02) break;
    t += max(d, 0.012);
    if (s.z + l.z * t > SPA) break;
  }
  return smoothstep(0.0, 1.0, sat(o));
}
// The colour that sounds in a pocket here: by the place in the piece, and by which shape it is.
vec3 spGlow(vec3 m) {
  float big = (1.0 - smoothstep(0.2, 0.34, length(spIn)));
  float six = (1.0 - smoothstep(0.1, 0.15, length(spIn - vec2(0.5, 0.2886751))));
  float four = (1.0 - smoothstep(0.06, 0.09, length(spIn - vec2(0.5, 0.0))));
  float kite = sat(1.0 - big - six - four);
  vec3 k = uKind[0] * big * uDrone + uKind[1] * kite * uPad + uKind[3] * six * uPhrase * 1.5;
  k += uKind[2] * (1.0 - smoothstep(0.012, 0.035, spOff)) * uTexture * 1.2;
  float heart = exp(-dot(spIn, spIn) * 90.0);
  return m * 1.5 + k * 0.85 + heart * (uKind[3] * uKeys * 1.6 + vec3(1.0, 0.7, 0.4) * uMic);
}
// Plaster under this light, its deep places stained by the colour g and throwing some of it back.
vec3 spPlaster(vec3 light, vec3 g, float deep, vec2 s) {
  float m = max(g.r, max(g.g, g.b));
  vec3 hue = pow(g / max(m, 0.001), vec3(2.6));
  float grit = noise(s * 60.0) * 0.6 + noise(s * 23.0) * 0.4;
  vec3 alb = vec3(0.95, 0.92, 0.87) * (0.94 + 0.1 * grit * spFine);
  float on = deep * (1.0 - exp(-m * 4.0));
  alb = mix(alb, alb * (0.1 + 0.9 * hue), 0.95 * on);
  return alb * (light + hue * on * (0.03 + 0.2 * uEnergy * m)) * 1.4;
}
// Sets how high the drift lies at w and how it slopes along tx and ty.
void spDrift(vec3 w, vec3 tx, vec3 ty) {
  float h = fbm(w) + 0.04 * noise(w * 9.0);
  spDune = (vec2(fbm(w + 0.04 * tx), fbm(w + 0.04 * ty)) - h) / 0.04;
  float up = smoothstep(0.62 - 0.25 * uOwn[7], 0.78 - 0.25 * uOwn[7], h);
  spWear = -0.2 + (0.2 + SPA + 0.02) * (1.0 - (1.0 - up) * (1.0 - up));
}
// What stands behind the net and is mirrored in it: h is how high one looks, a how near the sun.
vec3 spSky(float h, float a) {
  vec3 hi = uKind[0] * uKind[0], lo = uKind[1] * uKind[1];
  vec3 c = mix(lo * 1.35 + 0.05, hi * 0.9 + 0.02, smoothstep(-0.1, 0.75, h));
  a = max(a, 0.0);
  return c * (0.8 + 0.5 * uLevel) + uKind[3] * (0.3 * a * a * a + 0.6 * pow(a, 24.0));
}
// The same work of another stuff, or with another thing in its cells.
// was: the plaster there; w: the place on the wall; v from the eye; l to the light and lit how much of it arrives.
vec3 spStuff(vec3 was, vec3 light, vec3 g, float deep, float depth, vec3 s, vec3 n, vec3 v, vec3 l, float lit, float off, float foot, vec3 behind, vec3 sun) {
  vec3 c = was;
  float m = max(g.r, max(g.g, g.b));
  float cell = smoothstep(-0.2 * spW, 0.25 * spW + foot, off);
  vec3 r = reflect(v, n);
  float gl = sat(dot(r, l));
  if (uOwn[5] < 0.0) {
    float coarse = fbm(s.xy * vec2(5.0, 21.0)), grit = noise(s.xy * 70.0);
    vec3 alb = uKind[0] * uKind[0] * (0.5 + 0.55 * coarse + 0.3 * (grit - 0.5) * spFine) + 0.03;
    alb *= 1.0 + 0.25 * (noise(floor(s.xy * 1.7) + 0.5) - 0.5);
    vec3 hue = pow(g / max(m, 0.001), vec3(2.0));
    float on = deep * (1.0 - exp(-m * 4.0));
    c = mix(c, mix(alb, alb * 0.2 + 0.4 * hue, 0.9 * on) * (light * 1.35 + hue * on * (0.12 + 0.5 * m)), -uOwn[5]);
  }
  if (uOwn[5] > 0.0) {
    vec3 tint = uKind[0] * (0.3 + 0.7 * uKind[0]);
    float rub = noise(s.xy * vec2(90.0, 14.0)) * spFine;
    vec3 f = r; f.xy += 0.14 * (rub - 0.5);
    float e = smoothstep(-0.3, 0.9, f.y + 0.4 * f.x) * 0.5 + 0.8 * smoothstep(0.75, 0.97, dot(f, normalize(vec3(-0.55, 0.45, 0.7))));
    vec3 metal = tint * (light * 0.35 + 0.05 + e * (0.22 + 0.6 * (light.r + light.g + light.b)));
    metal += mix(tint, vec3(1.0), 0.5) * lit * (2.2 * pow(gl, 34.0) + 0.5 * pow(gl, 6.0));
    vec3 hue = g * g / max(m, 0.001);
    metal *= 1.0 - 0.75 * cell * depth;
    metal += hue * deep * (0.12 + 0.5 * m) * (0.4 + light);
    c = mix(c, metal, uOwn[5]);
  }
  if (uOwn[4] < 0.0) {
    float e = 0.003 + foot;
    float big = smoothstep(-e, e, spIs.x), four = smoothstep(-e, e, spIs.y), six = smoothstep(-e, e, spIs.z);
    vec3 k = mix(mix(mix(uKind[1], uKind[3], six), uKind[2], four), uKind[0], big);
    float q = length(spIn);
    if (spFine > 0.0) k = mix(k, uKind[3], big * spFine * (1.0 - smoothstep(0.07, 0.07 + e, q)));
    k = k * k * (0.8 + 0.4 * noise(s.xy * 9.0)) + 0.02;
    vec3 strap = vec3(0.86, 0.83, 0.76) * (0.92 + 0.1 * noise(s.xy * 30.0));
    vec3 tile = mix(strap, k, smoothstep(-e, e, off));
    float gr = off / (0.005 + 0.6 * foot);
    float edge = exp(-gr * gr);
    tile *= 1.0 - 0.6 * edge * spFine;
    vec3 nn = normalize(n + 0.06 * vec3(noise(s.xy * 14.0) - 0.5, noise(s.xy * 14.0 + 37.0) - 0.5, 0.0));
    float shine = sat(dot(reflect(v, nn), l));
    vec3 t = tile * (light * 1.15 + 0.05);
    t += (1.0 - edge) * lit * (0.5 * pow(shine, 60.0) + 0.12 * pow(shine, 8.0)) * vec3(1.0, 0.94, 0.84);
    t += (1.0 - edge) * 0.1 * sun * pow(1.0 - sat(-dot(v, nn)), 3.0);
    t += k * sat(m) * cell * (0.25 + 0.5 * light);
    c = mix(c, t, -uOwn[4]);
  }
  if (uOwn[7] > 0.0) {
    float on = smoothstep(0.012, -0.004, s.z - spWear) * smoothstep(-0.17, -0.1, spWear) * smoothstep(0.0, 0.25, uOwn[7]);
    vec3 dn = normalize(vec3(-spDune * 0.7 + 0.22 * spFine * (vec2(noise(s.xy * 41.0), noise(s.xy * 41.0 + 17.0)) - 0.5), 1.0));
    float face = sat(dot(dn, l)) / max(l.z, 0.2);
    vec3 heap = uKind[2] * (0.35 + 0.65 * uKind[2]) * (0.88 + 0.24 * noise(s.xy * 60.0) * spFine + 0.12 * noise(s.xy * 13.0));
    vec3 under = light * (0.6 + 0.6 * face) + 0.25 * m * uKind[2];
    c = mix(c, heap * under * 1.45 * (0.75 + 0.5 * fbm(s.xy * 3.0)), on);
  }
  if (uOwn[7] < 0.0) {
    float zw = -0.1 * spDeep, under = smoothstep(0.0, 0.012, zw - s.z) * -uOwn[7];
    vec2 wq = s.xy - v.xy / max(-v.z, 0.12) * max(zw - s.z, 0.0);
    float edge = exp(-max(off, 0.0) * 40.0);
    vec2 rip = spFine * 0.05 * vec2(noise(wq * 7.0 + uTime * 0.21) - noise(wq * 7.0 + vec2(0.3, 0.0) + uTime * 0.21), noise(wq * 7.0 + uTime * 0.21) - noise(wq * 7.0 + vec2(0.0, 0.3) + uTime * 0.21)) * (1.0 + 5.0 * uLow);
    vec3 wn = normalize(vec3(rip, 1.0));
    vec3 wr = reflect(v, wn);
    float fr = 0.3 + 0.7 * pow(1.0 - sat(-dot(v, wn)), 4.0);
    vec3 tint = mix(uKind[2], g / max(m, 0.001), sat(m * 2.0));
    vec3 water = c * 0.45 * tint + tint * tint * (0.04 + 0.5 * m) * (0.3 + light);
    water = mix(water, sun, fr);
    water += uKind[4] * spRing * 0.8;
    water += pow(sat(dot(wr, l)), 220.0) * 3.0 * sat(lit * 2.0) * vec3(1.0, 0.9, 0.72);
    c = mix(c, water, under);
  }
  if (uOwn[4] > 0.0) {
    float through = smoothstep(0.8, 0.96, depth) * uOwn[4];
    c *= 1.0 - 0.55 * uOwn[4];
    c += uOwn[4] * behind * 0.3 * sat(depth) * (1.0 - through) * smoothstep(0.35, 0.0, n.z + 0.25);
    vec3 hue = g * g / max(m, 0.001);
    c = mix(c, behind * (0.62 + 0.4 * spRing) + hue * (0.1 + 0.5 * m) / (1.0 + m) + uKind[4] * spRing * 0.3, through);
  }
  return c;
}
vec3 render(vec2 p) {
  bool dome = uVar > 0.5;
  float th = 0.8 + 0.16 * (uTone - 0.5) + 0.05 * sin(uTime * 0.05) + 0.34 * uLevel;
  th = clamp(th, 0.66, 1.13);
  if (uOwn[1] != 0.0) th = uOwn[1] > 0.0 ? mix(th, 1.22 + 0.12 * uLevel, uOwn[1]) : mix(th, 0.24 + 0.2 * uLevel, -uOwn[1]);
  spW = 0.025 * exp2(uOwn[3] * (uOwn[3] > 0.0 ? 1.15 : 1.3));
  spBow = uOwn[2] * (uOwn[2] > 0.0 ? 2.4 : 1.15);
  spLift = 1.0 - 0.8 * max(-uOwn[4], 0.0);
  spWear = -1.0; spDune = vec2(0.0); spRing = 0.0;
  float floorly = max(uOwn[6], 0.0), facing = max(-uOwn[6], 0.0), lamp = max(uOwn[5], 0.0), open = max(-uOwn[5], 0.0);
  float deepBy = uOwn[4] > 0.0 ? 1.0 + 0.35 * uOwn[4] : 1.0 + 0.86 * uOwn[4];
  bool other = uOwn[4] != 0.0 || uOwn[5] != 0.0 || uOwn[7] != 0.0;
  spC = cos(th); spS = sin(th);
  spRin = (0.3943376 - 0.1020614 / cos(th - 0.2617994) * spS) * 1.0352762;
  if (spBow != 0.0) {
    float qa = spBow * (spS - 0.2679492 * spC), qb = spC + 0.2679492 * spS;
    float tt = 2.0 * 0.1056624 / (qb + sqrt(max(qb * qb + 4.0 * qa * 0.1056624, 0.01)));
    spRin = max(0.3943376 - tt * spS + spBow * tt * tt * spC, 0.05) * 1.0352762;
  }
  spRin = max(spRin, 0.1);
  float px = 1.0 / uRes.y;
  vec3 light, s, n, glow;
  float deep, K;
  vec2 place; vec3 vv, ll, behind = vec3(0.0), sun = vec3(0.0); float arrive, offAt, footAt, depthAt, sky = 0.0;
  vec4 hole = vec4(0.0);
  if (!dome) {
    K = exp2(1.25 * uOwn[0]);
    float yaw = 0.62 + 0.03 * sin(uTime * 0.031);
    yaw *= 1.0 - facing;
    vec3 fw = normalize(vec3(sin(yaw), 0.2 * (1.0 - facing), -cos(yaw)));
    if (floorly > 0.0) fw = normalize(mix(fw, vec3(0.42, 0.85, -0.25), floorly));
    vec3 rt = normalize(cross(fw, vec3(0, 1.0 - floorly, floorly))), up = cross(rt, fw);
    vec3 v = normalize(fw * 1.3 + rt * p.x + up * p.y);
    vec3 ro = vec3(0.2 * sin(uTime * 0.017) + 0.2, -0.2, 1.55);
    ro.z -= 0.75 * floorly;
    float vz = max(-v.z, 0.08 - 0.055 * floorly);
    float t = (ro.z - SPA) / vz;
    float foot = t * px / 1.3 / vz * K;
    spFine = (1.0 - smoothstep(0.004, 0.016, foot));
    s = ro + v * t;
    vec2 slide = vec2(0.0, 0.05 * uTravel * floorly);
    if (uOwn[7] > 0.0) spDrift(vec3(s.xy + slide, 4.0), vec3(1, 0, 0), vec3(0, 1, 0));
    float hr = (length(s.xy - vec2(0.95, 0.12)) - 0.1 - 2.4 * (1.0 - uHits)) / 0.3;
    if (floorly > 0.0) hr = mix(hr, (length(s.xy - vec2(0.55, 0.9)) - 0.1 - 5.0 * (1.0 - uHits)) / 0.75, floorly);
    float ring = uHits * exp(-hr * hr);
    spDeep = 0.105 + 0.03 * uSpace + 0.04 * ring;
    spDeep *= deepBy; spRing = ring;
    if (uOwn[0] != 0.0 || floorly > 0.0) s.xy = s.xy * K + slide * K;
    s = spWalk(s, v, t * px / 1.3 * K);
    n = spNormal(s, max(0.002, 0.4 * foot));
    float off = spOff;
    place = s.xy;
    if (uOwn[0] != 0.0 || floorly > 0.0) place = s.xy / K - slide;
    float along = sat(place.x / 4.0 + 0.1);
    float room = sat(0.55 - place.y / 2.6);
    if (uOwn[6] != 0.0) {
      along = sat(mix(along, floorly > 0.0 ? 0.3 + place.x / 4.0 : 0.42 + place.x / 2.3, abs(uOwn[6])));
      room = sat(mix(room, floorly > 0.0 ? 0.95 - place.y / 4.0 : 0.34 - place.y / 1.35, abs(uOwn[6])));
    }
    vec3 gl = spGlow(piece(vec2(along, room)).rgb);
    float depth = sat(-s.z / spDeep) * (1.0 - spEdge);
    float el = 0.5 - 0.15 * uLow + 0.04 * sin(uTime * 0.023);
    vec3 l = normalize(vec3(0.72, 0.68, el));
    vec3 toLamp = vec3(1.0, 0.1, 0.55) + vec3(-0.5, 0.0, 0.0) * facing + vec3(0.0, 0.9, 0.1) * floorly - vec3(place, 0.0);
    if (lamp > 0.0) l = normalize(mix(l, normalize(toLamp), lamp));
    float lit = spSun(s + n * 0.003, l, 0.1) * sat(dot(n, l)) / l.z * 0.5;
    lit = mix(lit, 0.5, spEdge);
    float ao = mix(1.0, 0.25 + 0.75 * smoothstep(-0.005, 0.1, off), depth);
    // the sun comes through an arch out of sight: a bright field with a soft curved edge, the rest in shade
    vec2 a = place - vec2(1.3 - 0.9 * floorly, -0.65 + 0.9 * floorly) - 0.12 * vec2(cos(TAU * uLoop), sin(TAU * uLoop));
    a.x = abs(mod(a.x - 0.45 * a.y + 1.75, 3.5) - 1.75);
    float arch = length(vec2(a.x + 0.5, max(a.y, 0.0) * 1.1)) - 1.8;
    float pool = 1.0 - smoothstep(-0.1 - 3.0 * foot, 0.06 + 3.0 * foot, arch);
    if (facing > 0.0) pool = mix(pool, 1.0 - smoothstep(-0.02, 0.03, place.y + 0.62 * place.x - 0.02), facing * 0.999);
    if (open > 0.0) pool = mix(pool, 1.0, open);
    if (lamp > 0.0) pool = mix(pool, (0.75 + 0.5 * uLevel) * exp(-2.2 * dot(toLamp.xy, toLamp.xy) / (1.0 + 1.2 * floorly)), lamp);
    // a cue: a shaft of sun goes by
    float sh = place.x - 0.45 * place.y - 0.1 - 2.8 * (1.0 - uCue);
    pool = max(pool, uCue * (1.0 - smoothstep(0.2, 0.35, abs(sh))));
    // far along the wall the carving runs together into one tone
        float far = smoothstep(0.012, 0.05, foot);
    lit = mix(lit, 0.3, far); ao = mix(ao, 0.75, far); deep = depth * (1.0 - 0.5 * far);
    light = vec3(1.75, 1.3, 0.84) * lit * pool;
    light += vec3(0.23, 0.3, 0.42) * ao * (0.68 + 0.36 * n.y + 0.3 * n.x) * (1.0 - 0.75 * lamp);
    light += vec3(0.42, 0.24, 0.12) * depth * ao * pool * sat(0.6 - 0.6 * dot(n, l));
    glow = gl + kindColour(along * 4.0) * band(along) * 0.35; deep *= ao;
    light += uKind[4] * ring * (0.08 + 0.9 * deep);
    if (floorly > 0.0) light += uKind[4] * ring * 1.1 * floorly * (1.0 - far);
    vv = v; ll = l; arrive = lit * pool; offAt = off; footAt = foot; depthAt = depth;
    float toSun = dot(v, normalize(vec3(0.72, 0.68, 0.16)));
    if (uOwn[4] > 0.0) behind = spSky(mix(0.35 + 0.8 * p.y, v.z + 0.3, floorly), mix(1.0 - 1.1 * length(p - vec2(0.25, 0.05)), toSun, floorly));
    if (other) { vec3 r = reflect(v, vec3(0, 0, 1)); sun = spSky(mix(r.y * 0.6 + 0.3, r.z, floorly), dot(r, normalize(vec3(0.72, 0.68, 0.2)))); }
    if (floorly > 0.0) {
      sky = smoothstep(0.09, 0.0, -v.z) * floorly;
      behind = mix(behind, spSky(v.z * 1.6, toSun), sky);
    }
  } else {
    p.x -= 0.18 * (1.0 - smoothstep(0.6, 1.1, uRes.x * px)); // a tall picture has the opening in its middle
    if (floorly > 0.0) p.x = mix(p.x, p.x + 0.18 * (1.0 - smoothstep(0.6, 1.1, uRes.x * px)), floorly);
    vec3 fw = normalize(vec3(0.29, 1.0, -0.2));
    if (uOwn[6] != 0.0) fw = normalize(mix(fw, uOwn[6] > 0.0 ? vec3(0.0, 1.0, 0.0) : vec3(0.95, 0.42, -0.35), abs(uOwn[6])));
    vec3 rt = normalize(cross(fw, vec3(0.25, 0.9 * facing, 1.0 - 0.9 * facing))), up = cross(rt, fw);
    vec3 v = normalize(fw * 0.85 + rt * p.x + up * p.y);
    vec3 ro = vec3(-0.12, -0.2, 0.1);
    if (uOwn[6] != 0.0) ro = mix(ro, uOwn[6] > 0.0 ? vec3(0.0, -0.1, 0.0) : vec3(-0.45, -0.05, 0.15), abs(uOwn[6]));
    float b = dot(ro, v);
    float t = -b + sqrt(max(b * b - dot(ro, ro) + 1.0, 0.0));
    vec3 x = ro + v * t;
    float sn = length(x.xz) + 1e-4;
    vec3 ev = vec3(-x.z, 0, x.x) / sn, eu = vec3(x.x * x.y / sn, -sn, x.z * x.y / sn);
    float N = 12.0;
    const float OPEN = 0.16;
    float openC = cos(OPEN), openS = sin(OPEN);
    if (uOwn[0] != 0.0) N = floor(12.0 * exp2(uOwn[0] * 1.1) + 0.5);
    K = N / 12.0;
    if (uOwn[4] > 0.0 || floorly > 0.0) {
      float wide = (OPEN + 0.22 * floorly) * (1.0 - 0.6 * max(uOwn[4], 0.0));
      openC = cos(wide); openS = sin(wide);
    }
    vec2 uv = vec2(atan(x.z, x.x + 1e-5), log(sn / max(1.0 + x.y, 0.01))) * N / TAU;
    vec3 lv = vec3(dot(v, ev), dot(v, eu), -dot(v, x));
    float foot = t * px / 0.85 * N / (TAU * sn) / max(-lv.z, 0.2);
    spFine = (1.0 - smoothstep(0.004, 0.016, foot));
    float row = sat(-uv.y / 4.2);
    if (uOwn[0] != 0.0) row = sat(-uv.y / (4.2 * K));
    if (floorly > 0.0) uv.x += floorly * uTime * 0.012 * N;
    if (uOwn[7] > 0.0) spDrift(x * 2.2 + 5.0, ev, eu);
    float hr = (row * 4.2 - 1.0 - 3.6 * (1.0 - uHits)) / 0.4;
    float ring = uHits * exp(-hr * hr);
    spDeep = 0.1 + 0.03 * uSpace + 0.03 * ring;
    spDeep *= deepBy; spRing = ring;
    s = spWalk(vec3(uv, SPA), lv, t * px / 0.85 * N / (TAU * sn));
    n = spNormal(s, max(0.002, 0.4 * foot));
    float off = spOff, depth = sat(-s.z / spDeep) * (1.0 - spEdge);
    vec3 gl = spGlow(piece(vec2(fract(atan(x.x, x.z + 1e-5) / TAU + 0.5), 0.1 + 0.8 * row)).rgb);
    vec3 toward = vec3(0, 0.86, 0) - x;
    vec3 l = normalize(vec3(dot(toward, ev), dot(toward, eu), -dot(toward, x) + 0.12));
    // the round of sun that the opening throws on the far side
    vec3 sd = normalize(vec3(-0.8, 0.48 - 0.06 * uLow + 0.04 * cos(TAU * uLoop), 0.4 + 0.12 * sin(TAU * uLoop)));
    vec3 thr = x + sd * (openC - x.y) / sd.y;
    float spot = (1.0 - smoothstep(-0.03, 0.03, length(thr.xz) - 0.23));
    // a cue: a blade of sun goes over the vault
    float sh = dot(x.xz, vec2(0.95, 0.3)) + 0.5 - 1.3 * (1.0 - uCue);
    float blade = uCue * (1.0 - smoothstep(0.06, 0.16, abs(sh)));
    vec3 ls = vec3(dot(sd, ev), dot(sd, eu), -dot(sd, x));
    l = normalize(mix(l, ls, spot));
    if (uOwn[5] != 0.0) spot *= 1.0 - 0.7 * abs(uOwn[5]);
    float lit = spSun(s + n * 0.003, l, mix(0.25, 0.1, spot)) * sat(dot(n, l));
    lit = mix(lit, sat(l.z), spEdge);
    float ao = mix(1.0, 0.2 + 0.8 * smoothstep(-0.005, 0.1, off), depth);
        float d2 = dot(toward, toward);
    light = mix(vec3(0.75, 0.9, 1.1) * 0.5 / (0.4 + d2) * (0.92 + 0.55 * x.x), vec3(3.1, 2.25, 1.35), spot) * lit;
    if (open > 0.0) light += vec3(0.95, 0.9, 0.8) * open * lit * (1.0 - spot) * smoothstep(-1.1, 0.7, x.x + 0.5 * x.z);
    light += vec3(1.8, 1.3, 0.75) * blade * lit;
    light += vec3(0.12, 0.085, 0.068) * ao * (0.7 + 0.6 * n.y);
    light += vec3(0.34, 0.2, 0.09) * exp(-3.5 * dot(thr.xz, thr.xz)) * ao;
    glow = gl + kindColour(row * 4.0) * band(1.0 - row) * 0.35; deep = depth * ao;
    light += uKind[4] * ring * (0.05 + 1.0 * deep);
    // the opening: a rim, then the sky
    float o = (x.y > 0.0 ? sn : 2.0 - sn) / openS, oe = 4.0 * px;
    light = mix(light, vec3(0.9, 0.85, 0.8), (1.0 - smoothstep(1.3, 1.3 + oe, o)) * (0.75 + 0.2 * cos((o - 1.06) * 52.0)));
    light = mix(light, vec3(0.12, 0.09, 0.07), 1.0 - smoothstep(1.05 - oe, 1.05, o));
    light = mix(light, vec3(1.1, 1.5, 2.0) + 0.6 * noise(x.xz * 12.0 + uTime * 0.02), 1.0 - smoothstep(1.0 - oe * 2.0, 1.0, o));
    deep *= step(1.3, o);
    vv = lv; ll = l; arrive = lit * mix(0.5, 1.3, spot); offAt = off; footAt = foot; depthAt = depth; 
    if (uOwn[4] > 0.0) behind = spSky(0.1 + 0.9 * x.y, dot(x, normalize(vec3(0.55, 0.6, 0.45))));
    if (other) { vec3 r = reflect(lv, vec3(0, 0, 1)); sun = spSky(0.5 * r.y + 0.4, dot(r, l)); }
    if (floorly > 0.0) hole = vec4(spSky(0.15 + 0.9 * fbm(x.xz * 6.0 + uTime * 0.012), 0.7 + 0.6 * x.x + 0.3 * x.z) * 1.15, floorly * (1.0 - smoothstep(1.0 - oe * 2.0, 1.0, o)));
    sky = -(1.0 - smoothstep(1.3, 1.3 + oe, o));
  }
  vec3 c = spPlaster(light, glow, deep, s.xy);
  if (other) {
    vec3 of = spStuff(c, light, glow, deep, depthAt, s, n, vv, ll, arrive, offAt, footAt, behind, sun);
    c = sky < 0.0 ? mix(of, c, -sky) : of;
  }
  if (sky > 0.0) c = mix(c, behind, sky);
  if (hole.a > 0.0) c = mix(c, hole.rgb, hole.a);
  return screenOf(c);
}
