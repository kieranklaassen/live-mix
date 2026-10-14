// name: Growth
// a: Rings
// b: Delta
// what: The cut face of a trunk under a low light: each turn of the loop lays one more ring round the rim, thick and warm where the piece is loud, so the wood is the piece's own record; or a river delta seen from the air at dusk, its channels branching away toward the sea.
// follows: Once round the trunk is the loop and the rim grows where the music is now; ring after ring steps through the room from back to front; a sounding stroke makes its rings glow; a hit throws a shoot from the growing tip and a cue sends a swell in through the rings. In the delta the sounds flow out from the source at your feet, a hit runs a bright pulse down the channels, and the fuller the mix the further the water reaches.

const float GR_G = 0.12;    // how much smaller each ring is than the one outside it
const float GR_R0 = 0.8;    // the rim, where the newest wood is
float grSq(float x) { return x * x; }

// How many rings in from the growing rim a place is (below 0 the wood is not grown yet); d is how long ago,
// in loops, the growing tip went by; a01 is the place in the loop; r how far from the heart.
float grRing(vec2 Q, out float d, out float a01, out float r) {
  r = length(Q);
  vec2 rh = Q / max(r, 1e-4);
  a01 = fract(atan(Q.y, Q.x) / TAU + 0.25);
  float x = -log(max(r, 1e-4) / GR_R0) / GR_G;
  x += 0.5 * (noise(rh * 1.7 + 3.0) - 0.5) + 0.5 * (noise(Q * 2.3 + 11.0) - 0.5) * smoothstep(0.0, 4.0, x); // the trunk is not quite round
  float born = uTime / 16.0 - x;                                         // some years the tree grew fast and some slow
  x += 0.2 * sin(born * 2.31 + 2.0 * sin(a01 * TAU)) + 0.25 * sin(born * 0.83 + 1.0 + sin(a01 * TAU * 2.0 + 1.0));
  d = fract(uLoop - a01);
  return x - d;
}
// The dense band of a ring stands proud: fr is 0 at the ring's outer edge and 1 at its inner; loud rings have a wide band.
float grBand(float fr, float l) {
  float wl = 0.3 + 0.55 * l;
  return smoothstep(0.0, 0.12, fr) * smoothstep(wl, wl * 0.3, fr);
}
float grHeight(float xr, float l) { float fr = fract(xr); return (0.65 * grBand(fr, l) * (0.3 + 0.7 * l) + 0.35 * (1.0 - fr) * (1.0 - fr) + 0.05 * sin(fr * 25.0)) * step(0.0, xr); }
vec3 grNow() { // the colour of what sounds this moment
  vec3 c = uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase + uKind[4] * uHits;
  return c / max(uDrone + uPad + uTexture + uPhrase + uHits, 0.3);
}

vec3 grRings(vec2 p) {
  // low over the near rim, looking across the wood
  vec3 ro = vec3(0.0, 0.62, -0.82);
  vec3 f = normalize(vec3(0.0, -0.62, 0.75));
  vec3 up = vec3(0.0, f.z, -f.y);
  vec3 rd = normalize(f * 0.85 + p.x * vec3(1.0, 0.0, 0.0) + p.y * up);
  if (rd.y > -0.03) return vec3(0.0);
  float tHit = -ro.y / rd.y;
  vec2 P = (ro + rd * tHit).xz;
  float foot = tHit * tHit / (ro.y * 0.85 * uRes.y);                            // the wood one pixel covers, looking across it
  vec2 Q = P - vec2(0.05 + 0.02 * sin(uTime * 0.07), 0.03 * cos(uTime * 0.05));
  float d, a01, r, d1, a1, r1;
  float xr = grRing(Q, d, a01, r);
  vec2 rh = Q / max(r, 1e-4);
  float pitch = GR_G * max(r, 0.04);                                     // the width of a ring here
  float n = floor(xr), fr = xr - n;
  float born = uTime / 16.0 - d - n;                                     // when this ring was laid, in loops: it runs on along the spiral
  float cyc = fract(born / 12.0);
  float row = mix(0.05, 0.95, 1.0 - abs(cyc * 2.0 - 1.0));               // turn by turn the rings go through the room and back
  vec4 m = piece(vec2(a01, row));
  float join = min(a01, 1.0 - a01);
  if (join < 0.02) m = mix(0.5 * (piece(vec2(0.004, row)) + piece(vec2(0.996, row))), m, smoothstep(0.0, 0.02, join));
  float l = sat(m.a * 2.2);
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.2 : vec3(0.6, 0.45, 0.3);
  float live = smoothstep(0.35, 1.0, m.a);

  // relief and a low lamp on the far left
  float fine = smoothstep(1.2, 4.0, pitch / foot);                       // near the heart and far off the rings melt together
  vec3 L = normalize(vec3(-0.72, 0.3, 0.5));
  float e = 0.07 * pitch + foot * 0.5;
  float h0 = grHeight(xr, l);
  float ha = grHeight(grRing(Q + vec2(e, 0.0), d1, a1, r1), l), hb = grHeight(grRing(Q + vec2(0.0, e), d1, a1, r1), l);
  float hs = grHeight(grRing(Q + normalize(L.xz) * 0.3 * pitch, d1, a1, r1), l);
  float k = 0.3 * pitch / e * fine;
  vec3 nrm = normalize(vec3(-(ha - h0) * k, 1.0, -(hb - h0) * k));
  float shade = 1.0 - 0.8 * sat((hs - h0) * 2.5) * fine;
  float dif = sat(dot(nrm, L)) / L.y * shade;
  float spec = pow(sat(dot(nrm, normalize(L - rd))), 24.0) * shade;
  float pool = exp(-dot(P - vec2(-0.4, 0.05), P - vec2(-0.4, 0.05)) * 1.5);

  // the wood
  float heart = smoothstep(0.0, 0.8, r / GR_R0);
  vec3 early = mix(vec3(0.16, 0.055, 0.025), vec3(0.34, 0.165, 0.055), heart);
  vec3 dense = mix(vec3(0.04, 0.014, 0.008), vec3(0.085, 0.03, 0.012), heart);
  float late = grBand(fr, l);
  float lateS = late * fine + 0.35 * (1.0 - fine);
  float grainD = mix(0.4, max(late, pow(1.0 - fr, 2.5)) * 0.85 + 0.15 * (0.5 + 0.5 * sin(fr * 25.0)) * (1.0 - fr), fine); // each ring darkens outward, then the next begins pale
  vec3 wood = mix(early, dense, grainD);
  wood *= 0.75 + 0.5 * noise(Q * 3.1 + 5.0);
  wood = mix(wood, hue * (0.25 + 0.4 * l), lateS * sat(l * 1.4) * 0.85);     // each ring keeps the colour of what it heard
  wood *= 0.74 + 0.5 * noise(rh * 46.0 + xr * 0.2);                       // the rays of the wood
  wood *= 0.88 + 0.24 * noise(Q * 70.0);
  float ck = min(abs(fract(a01 - 0.37 + 0.012 * sin(xr * 2.0)) - 0.5), abs(fract(a01 - 0.83 + 0.008 * sin(xr * 3.1 + 1.0)) - 0.5)) * TAU * r;
  wood *= 1.0 - 0.8 * sat(1.0 - ck / (0.003 + 0.014 * r)) * smoothstep(0.8, 0.3, r / GR_R0); // two drying cracks from the heart

  vec3 col = wood * vec3(1.0, 0.82, 0.58) * (0.03 + pool * (0.06 + 1.5 * dif));
  col += vec3(1.0, 0.8, 0.55) * spec * 0.3 * pool;
  // what sounds now glows from inside its rings, and warms the wood beside them
  col += hue * hue * live * lateS * (0.3 + 0.7 * heart) * 1.5;
  col += hue * live * 0.14 * (1.0 - lateS) * heart;
  float wave = uCue * exp(-grSq((xr - (1.0 - uCue) * 12.0) / 1.3));       // a cue sends a swell in from the rim
  col += mix(vec3(1.0, 0.7, 0.4), uKind[4] * uKind[4] * 2.5, 0.6) * wave * (0.08 + 0.5 * late);
  // the living layer under the bark: the newest ring, brightest at the growing tip
  vec3 now = grNow();
  float tip = 0.07 * exp(-d * 5.0) + exp(-d * 45.0);
  float newest = step(n, 0.5);
  col += mix(vec3(0.4, 0.7, 0.12), now * now * 2.4, 0.65) * newest * (0.03 + 0.5 * tip * (0.3 + 0.7 * uLevel)) * (0.05 + exp(-fr * 7.0)) * (0.6 + 0.8 * noise(rh * 46.0 + xr * 0.2));   // it shows along the rim, not as a wash over the wood
  col += now * exp(-min(d, 1.0 - d) * 260.0) * exp(-max(xr - 0.5, 0.0) * 1.1) * 0.5;     // the join where new wood meets old: a thin bright line in from the tip

  // bark, and nothing beyond it
  float bx = -xr;
  float bark = smoothstep(1.55, 1.4, bx + 0.6 * noise(rh * 17.0) + 0.25 * noise(rh * 60.0));
  float bn = 0.6 * noise(vec2(a01 * 110.0, bx * 1.5)) + 0.4 * noise(Q * 40.0);
  float moss = smoothstep(0.5, 0.75, noise(Q * 13.0 + 7.0)) * (0.5 + 0.5 * noise(Q * 60.0));
  vec3 barkCol = mix(vec3(0.16, 0.085, 0.05) * (0.05 + 2.0 * bn * bn * bn), vec3(0.1, 0.24, 0.05) * (0.3 + bn), moss) * (0.05 + (0.3 + 1.2 * pool) * sat(0.35 + 0.9 * dot(rh, normalize(L.xz)))) * smoothstep(-0.1, 0.4, bx);
  barkCol += mix(vec3(0.5, 0.75, 0.2), now * 1.5, 0.6) * exp(-max(bx, 0.0) * 22.0) * (0.03 + 0.5 * tip);
  col = mix(barkCol * bark, col, smoothstep(-0.03, 0.03, xr));
  // a hit throws a shoot from the growing tip: a stem that ends in a curl, unrolling as it comes
  float ta = (uLoop - 0.25) * TAU;
  vec2 tdir = vec2(cos(ta), sin(ta));
  vec2 tq = Q - tdir * GR_R0;
  float out_ = dot(tq, tdir), side = dot(tq, vec2(-tdir.y, tdir.x));
  float grow = sat(uHits * 1.4 + 0.8 * uCue);
  float len = 0.03 + 0.13 * grow;
  float stem = smoothstep(0.008, 0.002, abs(side - 0.25 * out_ * out_ / len)) * step(0.0, out_) * step(out_, len);
  vec2 cv = vec2(out_ - len, side - 0.25 * len - 0.035);                 // the middle of the curl
  float cr = length(cv), ca = atan(cv.y, cv.x);
  float arm = abs(fract(cr / 0.022 - ca / TAU + 0.25 + 0.8 * grow) - 0.5) * 0.022;
  float curl = smoothstep(0.006, 0.002, arm) * smoothstep(0.037, 0.03, cr);
  vec3 shootCol = mix(vec3(0.45, 0.9, 0.25), uKind[4] * 1.6, 0.4);
  col += shootCol * (max(stem, curl) * 1.5 + 0.45 * exp(-dot(tq, tq) / 0.01)) * grow;
  return col * 1.15 * exp(-max(tHit - 1.0, 0.0) * 0.35);
}

// The dusk sky: orange at the horizon, plum above it, then deep blue.
vec3 grSky(float y, float toSun) {
  vec3 c = mix(vec3(0.85, 0.33, 0.07), vec3(0.42, 0.12, 0.2), smoothstep(0.0, 0.08, y));
  c = mix(c, vec3(0.09, 0.06, 0.2), smoothstep(0.04, 0.2, y));
  c = mix(c, vec3(0.01, 0.025, 0.08), smoothstep(0.14, 0.5, y));
  return c * (0.25 + 0.75 * toSun) + vec3(1.0, 0.72, 0.36) * pow(toSun, 6.0) * exp(-y * 14.0) * 1.1;
}
// The land of the delta: below 1 is water, above it sand rising to the bars between the channels.
float grFoot;
float grLand(vec2 P, float reach) {
  vec2 rel = P - vec2(0.0, -2.5);
  float rad = length(rel), ang = atan(rel.x, rel.y);
  float fan = smoothstep(1.0, 0.45, abs(ang)) * smoothstep(reach + 2.0, reach - 2.0, rad);   // channels thin out at the sides and at the front of the growth
  float t = uTime * 0.006;
  vec2 c = vec2(ang * 6.0, rad * 0.55);
  c += 0.4 * vec2(sin(c.y * 1.7 + 0.6 * sin(c.x * 1.3)), sin(c.x * 1.9 + 0.7 * sin(c.y * 1.1) + 2.0));  // so the lattice of the noise does not show
  float w1 = abs(noise(c + vec2(3.7, -t)) - 0.5) * 2.0;
  float w2 = abs(noise(rot(0.5) * c * 2.6 + vec2(17.1, -t * 1.6)) - 0.5) * 2.0;
  float w3 = abs(noise(rot(1.1) * c * 6.4 + vec2(41.3, -t * 2.4)) - 0.5) * 2.0;
  float g2 = smoothstep(4.5, 7.5, rad) * smoothstep(0.2, 0.05, grFoot), g3 = smoothstep(7.0, 11.0, rad) * smoothstep(0.07, 0.02, grFoot);
  float thin = 0.04 * (1.0 - fan);                                          // so no hair-thin channels are left where the water gives out
  float h = (w1 + thin) / (0.2 * fan + 1e-3);
  h = min(h, (w2 + thin + 0.04 * (1.0 - g2)) / (0.17 * fan * g2 + 1e-3));
  h = min(h, (w3 + thin + 0.04 * (1.0 - g3)) / (0.14 * fan * g3 + 1e-3));
  return h;
}
vec3 grDelta(vec2 p) {
  vec3 rd = normalize(vec3(p.x, p.y, 1.3));
  rd.yz = rot(-0.22) * rd.yz;
  vec3 sun = normalize(vec3(0.3, 0.03, 1.0));
  float toSun = sat(dot(normalize(vec2(rd.x, rd.z)), normalize(sun.xz)));
  toSun = pow(toSun, 5.0);
  float dusk = 0.4 + 0.5 * smoothstep(0.3, 1.0, uLevel);
  if (rd.y > 0.0) {
    vec3 sk = grSky(rd.y, toSun);
    float cl = noise(vec2(rd.x * 2.5 + uTime * 0.004, rd.y * 34.0)) * noise(vec2(rd.x * 7.0 + 3.0, rd.y * 60.0 + 5.0));
    cl = smoothstep(0.22, 0.5, cl) * smoothstep(0.0, 0.05, rd.y);
    sk = mix(sk, sk * 0.55 + vec3(0.9, 0.35, 0.12) * 0.25 * toSun * exp(-rd.y * 9.0), cl);  // thin bars of cloud, lit from below
    return sk * dusk;
  }
  float t = 1.6 / -rd.y;
  vec2 P = rd.xz * t + vec2(0.15 * sin(uTime * 0.05), 0.0);
  float reach = 8.5 + 8.0 * smoothstep(0.3, 1.0, uLevel) + 2.0 * uCue;
  float foot = t * t / (1.6 * 1.3 * uRes.y);            // how much ground one pixel covers, looking far off
  float e = max(0.012, foot * 0.6);
  grFoot = foot;
  float h = grLand(P, reach), hx = grLand(P + vec2(e, 0.0), reach), hz = grLand(P + vec2(0.0, e), reach);
  float sea = smoothstep(15.0, 22.0, P.y);
  float soften = 0.2 + 4.0 * foot;
  float water = max(smoothstep(1.0 + soften, 1.0 - soften, h), sea);
  vec2 rel = P - vec2(0.0, -2.5);
  float rad = length(rel), ang = atan(rel.x, rel.y);

  // the sounds flow out from the source: the further down the channels, the longer ago
  float s = sat((rad - 4.0) / 14.0);
  s = sqrt(s);
  vec4 m = piece(vec2(fract(uLoop - s * 0.97), sat(0.5 + ang * 0.75)));
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.4)) * 1.3 : vec3(0.5);
  float l = sat(m.a * 1.6) * smoothstep(1.0, 0.7, s);
  float kick = sat(uHits * 1.3);
  float pulse = kick * exp(-grSq((rad - 4.0 - (1.0 - kick) * 9.0) / (0.3 + 0.05 * rad)));

  // sand: black, with the low sun on the banks that face it
  vec3 nrm = normalize(vec3(-(min(hx, 2.6) - min(h, 2.6)), e * 5.0, -(min(hz, 2.6) - min(h, 2.6))));
  float bank = sat(dot(nrm.xz, normalize(sun.xz)) * 2.2);
  float wet = smoothstep(5.0, 1.0, h);
  vec3 sand = vec3(0.012, 0.011, 0.014) * (0.4 + 0.8 * noise(P * 9.0) * smoothstep(0.08, 0.01, foot));
  sand += vec3(1.0, 0.5, 0.22) * bank * 0.1 * smoothstep(1.9, 1.15, h) * (0.3 + 0.7 * toSun) * dusk + vec3(0.02, 0.016, 0.03) * wet * dusk;
  // water: a mirror for the sky, and it carries the colours of the piece
  float rip = mix(0.5, noise(vec2(ang * 70.0, rad * 2.5 - uTravel * 0.6)), smoothstep(0.25, 0.03, foot));              // the water runs outward
  vec3 mirror = grSky(-rd.y * (0.45 + 0.3 * rip), toSun) * dusk;
  mirror += vec3(1.0, 0.75, 0.4) * toSun * toSun * rip * rip * rip * exp(rd.y * 6.0) * (0.5 + 1.2 * uHigh);
  mirror *= 0.9 + 0.2 * noise(vec2(p.x * 5.0 + uTime * 0.01, log(t) * 16.0 - uTime * 0.02)) * sea;   // long slow swells out at sea
  vec3 wat = mirror * (0.5 + 0.5 * exp(rd.y * 4.0)) * (0.45 + 0.55 * smoothstep(1.1, 0.3, h)) * (0.8 + 0.4 * rip);
  wat += hue * hue * l * (0.3 + 1.3 * l) * (1.0 - 0.7 * sea) * (0.35 + 0.65 * smoothstep(1.2, 0.2, h)) * (0.7 + 0.6 * rip);
  wat += mix(vec3(1.0, 0.7, 0.4), uKind[4] * uKind[4] * 2.5, 0.6) * pulse * (0.5 + 0.6 * rip);
  vec3 col = mix(sand, wat, water);
  col += hue * l * l * 0.1 * smoothstep(7.0, 1.0, h) * (1.0 - water);                          // the glow of the water on its banks
  // haze toward the horizon
  float haze = 1.0 - exp(-t * 0.006);
  col = mix(col, grSky(0.0, toSun) * dusk * 0.7, haze * haze);
  return col;
}

vec3 render(vec2 p) {
  if (uVar < 0.5) return screenOf(grRings(p));
  return screenOf(grDelta(p));
}
