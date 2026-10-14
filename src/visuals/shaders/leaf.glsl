// name: Leaf
// a: Backlit
// b: Wing
// what: One leaf seen very close with the sun behind it: the mid-rib, the side veins, the fine net and the glowing cells between, and drops of dew that each hold a tiny upside-down picture of the sky; or the wing of a dragonfly, dark glass cells in a gold net.
// follows: Light runs along the mid-rib with the low band, out along the side veins with the middle and through the fine net with the high; the fields between the veins take the colours of the sounds there; a hit makes the dewdrops shiver and flash; the fuller the mix the more sun comes through.

// A net of cells: how far to the nearest wall, the middle of the cell, and a number of its own.
float lfNet(vec2 x, out vec2 centre, out float id) {
  vec2 n = floor(x), f = fract(x);
  vec2 m1 = vec2(8.0), m2 = vec2(8.0);
  float d1 = 64.0, d2 = 64.0;
  id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(n + g);
    vec2 r = g + 0.12 + 0.76 * o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; m2 = m1; d1 = d; m1 = r; id = fract(o.x * 7.3 + o.y * 3.7); }
    else if (d < d2) { d2 = d; m2 = r; }
  }
  centre = x + m1;
  return dot(0.5 * (m1 + m2), normalize(m2 - m1));
}
// Small six-sided cells: how far to the wall (0 to 0.5) and a number for the cell.
float lfHex(vec2 x, out float id) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec2 a = mod(x, s) - 0.5 * s, b = mod(x - 0.5 * s, s) - 0.5 * s;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  id = hash21(floor((x - g) / (0.5 * s) + 0.5));
  g = abs(g);
  return 0.5 - max(dot(g, s * 0.5), g.x);
}
// A line of half width w seen through a blur of s: wider and fainter the softer it is.
float lfLine(float d, float w, float s) { return smoothstep(w + s, w - s, d) * w / (w + 0.8 * max(s - w, 0.0)); }
// The outline of a wing: how far inside its edge, and w, 0 at the trailing edge to 1 at the leading.
float lfWingShape(vec2 q, out float w, out float across) {
  const float tipU = 0.8;
  float taper = sqrt(sat(1.0 - pow(max(q.x - 0.05, 0.0) / (tipU - 0.05), 2.4)));
  float rootw = 1.0 + 0.2 * min(q.x, 0.0);
  float vc = 0.07 - 0.05 * q.x;
  float top = vc + 0.17 * taper * rootw, bot = vc - 0.31 * taper * rootw;
  across = max(top - bot, 1e-3);
  w = (q.y - bot) / across;
  return min(min(top - q.y, q.y - bot), (tipU - q.x) * 0.6);
}

// one drop of dew: where it sits on the leaf and how big it is; the nearest one to this place is kept
#define LF_TRY(I, X, Y, R) ci = vec2(X, Y) * squash + shift; dd = length(q - ci) / (R * small); if (dd < best) { best = dd; fi = I; c = ci; r = R * small; }
// Dew: each drop is a little lens. q is the place on the leaf, sun where the light is, col what lies under.
vec3 lfDew(vec2 q, vec3 col, vec2 sun, float px, vec2 squash, vec2 shift, float small, float bright) {
  float best = 1e3, fi = 0.0;
  vec2 c = vec2(0.0);
  float r = 1.0;
  vec2 ci;
  float dd;
  LF_TRY(0.0, -0.40, 0.21, 0.066)
  LF_TRY(1.0, 0.20, -0.15, 0.092)
  LF_TRY(2.0, 0.50, 0.24, 0.042)
  LF_TRY(3.0, -0.13, -0.36, 0.036)
  LF_TRY(4.0, 0.64, -0.06, 0.030)
  LF_TRY(5.0, -0.72, -0.12, 0.048)
  LF_TRY(6.0, 0.03, 0.38, 0.027)
  float own = hash11(fi * 3.3 + 1.0);
  // a hit shakes some drops hard and the rest a little; a cue runs along the leaf from one end to the other
  float kick = sat(uHits * (0.3 + 0.7 * step(0.45, own)) + uCue * exp(-pow((c.x * 0.6 + 0.5 - (1.0 - uCue) * 1.4) * 3.0, 2.0)));
  vec2 dq = (q - c) / r;
  float wob = 1.0 + kick * 0.10 * sin(atan(dq.y, dq.x) * 3.0 + fi) * sin(uTime * 14.0 + fi * 2.0);
  vec2 e = dq / wob;
  float d = length(e);
  vec2 ld = normalize(sun - c);
  float a = dot(e, -ld), b = dot(e, vec2(-ld.y, ld.x));
  // the picture in the drop, upside down: the leaf and a line of far trees on the side of the sun, the sky and the sun on the far side
  float bulge = 1.0 + 0.5 * d * d;
  float pa = a * bulge, pb = b * bulge;
  float hz = pa + 0.06 - 0.05 * sin(pb * 7.0 + fi * 2.0) * sin(pb * 3.1 + fi);
  vec3 sky = mix(vec3(1.0, 0.76, 0.3), vec3(0.16, 0.45, 0.5), sat(pa * 1.2)) * (0.3 + 0.6 * bright);
  float sd = length(vec2(pa - 0.2, pb + 0.14));
  sky += vec3(1.0, 0.95, 0.8) * (1.6 * smoothstep(0.13, 0.08, sd) + 0.7 * exp(-sd * 5.0)) * (0.5 + bright + 3.0 * kick);
  sky += mix(vec3(1.0, 0.9, 0.7), uKind[4] * 2.0, 0.5) * kick * 1.5 * exp(-sd * 2.5);
  vec3 ground = mix(col * 0.25 + vec3(0.004, 0.02, 0.01), col * 0.7 + vec3(0.02, 0.035, 0.03) * bright, smoothstep(0.0, -0.3, hz));
  vec3 pic = mix(sky, ground, smoothstep(0.07, -0.07, hz));
  pic *= 0.45 + 0.55 * sqrt(sat(1.0 - d * d));                                   // the edge of the drop is dark
  pic += vec3(1.0, 0.9, 0.55) * pow(sat(a), 2.0) * smoothstep(0.5, 0.97, d) * (0.3 + 0.6 * bright); // a bright crescent on the far side
  pic += vec3(0.85, 1.0, 1.0) * 0.6 * smoothstep(0.17, 0.07, length((e - vec2(-0.38, 0.42)) * vec2(1.0, 1.4)));
  pic += vec3(0.7, 0.85, 0.8) * 0.12 * (0.4 + bright) * smoothstep(0.75, 0.98, d);                // the thin lit rim all round
  float inside = smoothstep(1.0, 1.0 - 2.5 * px / r, d);
  float shade = exp(-pow(length(dq + ld * 0.3) / 1.2, 4.0));                      // its soft shadow, away from the light
  float halo = kick * exp(-max(d - 1.0, 0.0) * 3.5);
  col = col * (1.0 - 0.5 * shade * (1.0 - inside)) + mix(vec3(1.0, 0.9, 0.6), uKind[4] * 1.6, 0.6) * halo * 0.35 * (1.0 - inside);
  return mix(col, pic, inside);
}
// Far lights out of focus, behind everything.
vec3 lfBokeh(vec2 p, vec3 warm, vec3 cool) {
  vec2 g = (p + vec2(0.006 * uTime, 0.0)) * 3.4, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id);
  float r = 0.14 + 0.24 * h.y;
  float d = length(f - (h - 0.5) * 0.5);
  float disc = smoothstep(r, r * 0.55, d) * (0.7 + 0.3 * smoothstep(r * 0.4, r, d));
  return mix(warm, cool, h.x) * disc * step(0.5, fract(h.y * 5.3 + h.x)) * (0.5 + 0.5 * sin(uTime * 0.3 + h.x * 30.0));
}

vec3 render(vec2 p) {
  float t = uTime, tr = uTravel;
  bool wing = uVar > 0.5;
  float lvl = 0.25 + 0.95 * smoothstep(0.3, 1.0, uLevel);
  vec3 gold = vec3(1.0, 0.8, 0.34);
  vec2 q, uv, sun, netX;
  float px, sharp, soft, edge, netS, lift;
  float hw = 1.0, av = 0.0, sd = 1.0, sn = 0.0, k0 = 0.0, along = 0.0, dSide = 1.0; // the leaf
  float w = 0.0, across = 1.0, rr = 1.0;                                             // the wing
  const float N = 4.0;
  const vec2 pole = vec2(0.1, -0.5);
  if (!wing) {
    q = p - vec2(0.02 * sin(t * 0.13), 0.014 * sin(t * 0.17 + 1.0));
    lift = 0.12 + 0.07 * sin(t * 0.21) + 0.04 * sin(t * 0.34 + 2.0);              // the far end rises and falls in the wind
    q /= 1.0 + lift * dot(q, vec2(cos(0.48), sin(0.48)));
    q = rot(0.48 + 0.03 * sin(t * 0.11)) * q * 1.12;
    uv = vec2(q.x, q.y - 0.09 * q.x * q.x + 0.03);
    px = 1.6 / uRes.y;
    sharp = exp(-pow((uv.x - 0.1 - 0.25 * sin(t * 0.08)) / 0.8, 2.0));            // only a band across the leaf is in focus
    soft = px + 0.011 * (1.0 - sharp);
    hw = 0.7 * sqrt(max(1.0 - pow((uv.x + 0.2) / 1.9, 2.0), 0.0));
    av = abs(uv.y); sd = uv.y < 0.0 ? -1.0 : 1.0;
    float s = uv.x - 0.75 * av - 1.1 * av * av;                                   // the same all along one side vein
    sn = s * N + (sd > 0.0 ? 0.5 : 0.0);
    k0 = floor(sn);
    along = sn - k0 - 0.5 - (hash21(vec2(k0, sd * 7.0 + 11.0)) - 0.5) * 0.36;
    dSide = abs(along) / (N * length(vec2(1.0, 0.75 + 2.2 * av)));
    edge = hw + 0.022 * (1.0 - smoothstep(0.0, 0.5, abs(along))) - av;            // a small tooth where each vein ends
    netX = (uv + 0.012 * vec2(noise(uv * 9.0), noise(uv * 9.0 + 31.0))) * 23.0;
    netS = 1.0 / 23.0;
    sun = vec2(0.24 + 0.06 * sin(t * 0.05), 0.15);
  } else {
    q = p - vec2(0.02 * sin(t * 0.12), 0.012 * sin(t * 0.19 + 2.0));
    lift = 0.1 + 0.08 * sin(t * 0.23) + 0.04 * sin(t * 0.37 + 1.0);
    q /= 1.0 + lift * dot(q, vec2(sin(0.3), cos(0.3)));
    q = rot(-0.3 + 0.025 * sin(t * 0.1)) * q * 0.8 + vec2(0.1, 0.02);
    uv = q;
    px = 1.2 / uRes.y;
    sharp = exp(-pow((q.x + 0.05 - 0.2 * sin(t * 0.08)) / 0.85, 2.0));
    soft = px + 0.006 * (1.0 - sharp);
    edge = lfWingShape(q, w, across);
    vec2 rel = q - pole;
    rr = length(rel);
    netX = vec2(log(rr), atan(rel.y, rel.x)) * 15.0;                              // cells small along the trailing edge, larger toward the front
    netS = rr / 15.0;
    sun = vec2(0.9, 0.75);
  }
  vec2 c1; float id1;
  float e1 = lfNet(netX, c1, id1) * netS;

  vec3 col;
  float bright;
  if (!wing) {
    c1 /= 23.0;
    float id2;
    float e2 = lfHex(netX * 3.6, id2);
    // the piece: out from the mid-rib is the loop, from the stalk to the tip is the room
    float cav = abs(c1.y), cs = c1.x - 0.75 * cav - 1.1 * cav * cav;
    vec4 m = piece(vec2(0.02 + 0.96 * sat(cav / 0.62), sat((cs + 1.7) / 2.6)));
    vec3 hue = pow(m.rgb / max(m.a, 0.001), vec3(1.5)) * 1.5;

    // the light behind
    float ds = length(uv - sun);
    float glow = exp(-ds * ds * 4.5), wide = exp(-ds * 1.7);
    float dap = smoothstep(0.3, 0.72, noise(uv * 2.1 + vec2(t * 0.05, -t * 0.03))); // the soft shadows of other leaves
    float light = (0.03 + 0.5 * wide * wide * (0.4 + 0.6 * lvl) + 0.12 * wide * lvl + 1.5 * glow * lvl) * mix(0.3, 1.0, dap);
    bright = lvl * (0.4 + 0.6 * dap);

    vec3 green = mix(vec3(0.008, 0.17, 0.035), vec3(0.2, 0.6, 0.02), id1 * 0.5 + 0.5 * id2);
    green = mix(green, vec3(1.0, 0.62, 0.06), sat(glow * 0.85 + 0.25 * id2 * wide));
    float cell = mix(1.0, (0.55 + 0.6 * smoothstep(0.0, 0.14, e2)) * (0.75 + 0.5 * id2), sharp);
    col = green * light * cell * (0.85 + 0.3 * id1) * 1.7;
    float lum = dot(col, vec3(0.3, 0.6, 0.1));
    col = mix(col, hue * (lum * 1.6 + 0.015), 0.5 * sat(m.a * 1.3));
    col += hue * m.a * m.a * 0.12 * smoothstep(0.0, 0.01, e1) * (0.3 + light);

    // veins, finest first
    vec3 pale = vec3(0.6, 0.95, 0.2);
    float mNet = lfLine(e1, 0.0011, soft);
    col *= 1.0 - 0.25 * smoothstep(0.006, 0.0011, e1) * sharp;
    col = mix(col, pale * light * 1.1, mNet * 0.55);
    float ks = k0 - (along < 0.0 ? 1.0 : 0.0);                                    // which field between two side veins
    float d3 = abs(fract(av * 8.0 + hash11(ks + sd * 3.0) + 0.12 * sin(sn * TAU)) - 0.5) / 8.0;
    float m3 = lfLine(d3, 0.0014, soft);
    col *= 1.0 - 0.2 * smoothstep(0.007, 0.0014, d3) * sharp;
    col = mix(col, pale * light * 1.1, m3 * 0.5);
    col += mix(gold, uKind[2] * 1.6, 0.6) * uHigh * max(mNet, m3) * (0.2 + 1.3 * noise(uv * 5.0 + vec2(tr * 0.7, 0.0))) * 0.7;

    float wSide = 0.0015 + 0.006 * sat(1.0 - av / max(hw, 0.05));
    float mSide = lfLine(dSide, wSide, soft);
    col *= 1.0 - 0.35 * smoothstep(wSide * 4.0 + soft, wSide, dSide);
    col = mix(col, pale * light * 1.4, mSide);
    float pv = pow(0.5 + 0.5 * sin(av * 12.0 - tr * 2.6 + k0 * 2.1), 3.0);
    col += mix(gold, mix(uKind[1], uKind[3], hash11(k0 + sd)) * 1.7, 0.65) * uMid * pv * (mSide + 0.35 * exp(-dSide / 0.012)) * 0.6;

    float wMid = 0.005 + 0.016 * sat(1.0 - (uv.x + 1.0) / 2.4);
    float mMid = lfLine(av, wMid, soft);
    col *= 1.0 - 0.4 * smoothstep(wMid * 3.5 + soft, wMid, av);
    col = mix(col, pale * light * 1.6 * (0.75 + 0.25 * smoothstep(wMid, 0.0, av)), mMid);
    float pm = pow(0.5 + 0.5 * sin(uv.x * 5.0 - tr * 2.0), 3.0);
    col += mix(gold, uKind[0] * 1.7, 0.6) * (0.04 + 0.9 * uLow * pm) * (mMid + 0.45 * exp(-av / 0.03));

    // a cool sheen on the near skin, moving as the leaf lifts
    col += vec3(0.2, 0.4, 0.45) * 0.05 * exp(-pow((uv.x * 0.5 + uv.y - 0.2 + 3.0 * (lift - 0.12)) * 2.4, 2.0));
    col += gold * light * 0.5 * exp(-max(edge, 0.0) / 0.006);                     // the lit edge of the leaf
  } else {
    c1 /= 15.0;
    vec2 cc = pole + exp(c1.x) * vec2(cos(c1.y), sin(c1.y));
    float cw = (cc.y - (q.y - w * across)) / across;
    // along the leading edge, a ladder of long cells
    float lad = step(0.86, w);
    float lu = q.x * 18.0 + 0.3 * sin(q.x * 5.0);
    float lk = floor(lu);
    float eLad = min((0.5 - abs(fract(lu - (hash11(lk) - 0.5) * 0.3) - 0.5)) / 18.0, min(abs(w - 0.86), abs(1.0 - w)) * across);
    float cellEdge = mix(e1, eLad, lad);
    float cid = mix(id1, hash11(lk * 1.7 + 4.0), lad);
    vec2 at = mix(vec2(cc.x, cw), vec2((lk + 0.5) / 18.0, 0.93), lad);

    // the piece: along the wing is the loop, from the leading edge to the trailing is the room
    vec4 m = piece(vec2(sat((at.x + 0.85) / 1.6), sat(1.0 - at.y)));
    vec3 hue = pow(m.rgb / max(m.a, 0.001), vec3(1.3)) * 1.3;
    float loud = sat(m.a * (0.7 + 0.6 * uEnergy));

    // the long veins fan out from the root and end on the trailing edge
    float fan = w + 0.3 * (q.x + 1.0) * (1.0 - w);
    float eLong = abs(fract(fan * 5.0 + 0.5) - 0.5) / 5.0 * across / max(1.0 - 0.3 * (q.x + 1.0), 0.2) * (1.0 - lad) + lad;
    eLong = min(eLong, abs(w - 0.86) * across);

    // the skin of each cell: a film of oil colours, lit where a band of sky is mirrored in it
    float film = cid * 0.14 + 1.3 * noise(q * 2.6) + w * 0.9 + q.x * 0.5 + lift * 4.0 + t * 0.02;
    vec3 oil = pal(film, vec3(0.5, 0.45, 0.55), vec3(0.45, 0.4, 0.45), vec3(1.0), vec3(0.0, 0.35, 0.6));
    float band = exp(-pow((q.x * 0.8 + q.y * 0.6 - 0.7 * sin(t * 0.115) + (cid - 0.5) * 0.35) / 0.22, 2.0));
    float inner = smoothstep(0.0, 0.016, cellEdge);
    col = oil * (0.008 + 0.16 * band * lvl) * (0.5 + 0.5 * inner) * (0.4 + 1.2 * cid);
    col += hue * mix(vec3(1.0), oil * 1.6, 0.4) * loud * (0.15 + 1.3 * loud) * (0.4 + 0.6 * inner) * (0.55 + 0.45 * cid);
    col += oil * uHigh * 0.25 * pow(noise(q * 14.0 + vec2(tr * 0.8, cid * 9.0)), 3.0);
    bright = lvl * 0.7;

    // the net of veins: gold where the light catches it
    float lit = 0.07 + 0.5 * band * lvl + 0.5 * loud;
    float mNet = lfLine(cellEdge, 0.0011, soft);
    vec3 vein = gold * lit * 0.5 + mix(gold, uKind[2] * 1.5, 0.5) * uHigh * 0.5 * noise(q * 6.0 + vec2(tr * 0.6, 0.0));
    col = mix(col, vein, mNet);
    float mLong = lfLine(eLong, 0.0024, soft);
    float pl = pow(0.5 + 0.5 * sin(q.x * 9.0 - tr * 2.4 + floor(fan * 5.0 + 0.5) * 1.9), 3.0);
    vec3 vlong = gold * lit * 0.6 + mix(gold, mix(uKind[1], uKind[3], fract(fan * 2.5)) * 1.7, 0.65) * uMid * pl * 1.2;
    col = mix(col, vlong, mLong);
    col += vlong * 0.25 * exp(-eLong / 0.01) * uMid * pl;
    float eFront = (1.0 - w) * across;
    float mFront = lfLine(eFront, 0.006, soft);
    float pf = pow(0.5 + 0.5 * sin(q.x * 5.0 - tr * 2.0), 3.0);
    vec3 vfront = gold * (0.1 + lit * 0.9) + mix(gold, uKind[0] * 1.7, 0.6) * (0.05 + 1.3 * uLow * pf);
    col = mix(col, vfront, mFront);
    col += vfront * 0.3 * exp(-eFront / 0.03) * uLow * pf;
    // the dark mark near the tip takes the hit
    float mark = smoothstep(0.0, 0.008, min(min(q.x - 0.44, 0.57 - q.x), (w - 0.86) * across));
    col = mix(col, vec3(0.25, 0.1, 0.03) * (0.3 + lit) + uKind[4] * 1.6 * sat(uHits + 0.7 * uCue), mark * 0.9);
    col += gold * 0.2 * lit * exp(-max(edge, 0.0) / 0.004);
  }
  col = lfDew(uv, col, sun, px, wing ? vec2(1.05, 0.5) : vec2(1.0), wing ? vec2(0.0, 0.05) : vec2(0.0), wing ? 0.55 : 1.0, bright);

  // what lies behind: the dark garden, far lights out of focus, and behind the wing its other wing
  vec3 back = wing ? lfBokeh(p, vec3(0.3, 0.2, 0.06), vec3(0.03, 0.12, 0.14)) * (0.03 + 0.08 * uLevel)
                   : vec3(0.004, 0.012, 0.007) + lfBokeh(p, vec3(0.5, 0.36, 0.08), vec3(0.06, 0.25, 0.1)) * (0.1 + 0.25 * uLevel);
  if (wing) {
    vec2 q2 = rot(-0.72 + 0.03 * sin(t * 0.09)) * (p - vec2(-0.25, 0.1)) * 0.8 + vec2(-0.25, 0.0);
    float w2, across2;
    float edge2 = lfWingShape(q2, w2, across2);
    float fan2 = w2 + 0.3 * (q2.x + 1.0) * (1.0 - w2);
    float lines = pow(abs(cos(fan2 * 5.0 * PI)), 6.0) * (1.0 - smoothstep(0.8, 0.9, w2)) + smoothstep(0.84, 0.99, w2);
    vec3 film2 = pal(w2 * 0.9 + q2.x * 0.5 + lift * 4.0, vec3(0.5, 0.45, 0.55), vec3(0.45, 0.4, 0.45), vec3(1.0), vec3(0.0, 0.35, 0.6));
    vec3 hind = (film2 * 0.012 + gold * 0.04 * lines) * (0.5 + lvl);
    back += hind * smoothstep(-0.01, 0.03, edge2);
    col += hind * 0.5 * smoothstep(-0.01, 0.03, edge2);
  }
  col = mix(back, col, smoothstep(-soft, soft, edge));
  col *= 1.0 - 0.45 * dot(p, p);
  col = max(mix(vec3(dot(col, vec3(0.3, 0.6, 0.1))), col, 1.2), 0.0);
  return screenOf(col * 1.3);
}
