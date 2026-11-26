// name: Gold tiles
// a: Apse
// b: Sea floor
// what: The gold vault of a dark apse, set with small glass tiles no two at one angle, so that a lamp out of sight runs over it as a shimmer; a vine winds across it, with waves below and leaves round the arch; or a floor of white and blue-green stone under shallow water, a great flower in a ring, with nets of light passing over.
// follows: In the vault a flower opens in each curl of the vine where the piece sounds; on the floor, petals and rows of waves take its colours. The low band moves the lamp or the sunlight, the high band makes single gold tiles flare. A hit sends out a ring of flashes, a cue draws a second light slowly across. Keys light the flowers' hearts or the gold.
// One tile of a row: filled by gtCut.
vec2 gtMid;   // its middle, along the row and across the rows, in lengths of the wall
vec2 gtIn;    // where in it we are, -1 to 1 each way
vec3 gtRnd;   // three numbers of its own
float gtOn;   // 1 on the tile, 0 in the joint
float gtH = 0.0152; // how tall a row is
// Cuts a row into tiles of uneven width. u along (already in true length for this row), v across, px one pixel in the same length.
void gtCut(float u, float v, float px, float seed) {
  float j = floor(v / gtH), fv = fract(v / gtH) - 0.5;
  float wide = gtH * (0.92 + 0.3 * hash11(j + seed));
  float U = u / wide + hash11(j * 1.7 + seed) * 7.0;
  float i = floor(U), f = U - i;
  float e = 0.44 * (hash21(vec2(i, j + seed)) - 0.5) + 0.22;
  if (f < e) { i -= 1.0; }
  float l = i + 0.44 * (hash21(vec2(i, j + seed)) - 0.5) + 0.22, r = i + 1.0 + 0.44 * (hash21(vec2(i + 1.0, j + seed)) - 0.5) + 0.22;
  vec2 hlf = vec2(0.5 * (r - l) * wide, 0.5 * gtH);
  vec2 q = vec2((U - 0.5 * (l + r)) * wide, fv * gtH);
  vec2 h = hash22(vec2(i * 1.31 + 3.0, j * 1.17 + seed));
  gtRnd = vec3(h, hash21(vec2(j + 5.0 + seed, i)));
  gtMid = vec2(u - q.x, v - q.y);
  q += vec2(-q.y, q.x) * (h.x - 0.5) * 0.16;      // set a little crooked
  gtIn = q / hlf;
  vec2 b = abs(q) - hlf * (0.9 - 0.1 * h.y) + 0.0025;
  float d = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0) - 0.0025;
  gtOn = (1.0 - smoothstep(-0.7 * px, 0.7 * px, d));
}
// The colour of the sounds at a place of the piece, as glass that deep would have it.
vec3 gtDye(vec4 pc) {
  vec3 hue = pc.rgb / max(pc.a, 0.02);
  hue = clamp(mix(vec3(dot(hue, vec3(0.33))), hue, 1.4), 0.0, 1.0);
  return hue * hue * vec3(1.0, 0.8, 1.0);
}
// The same as a stone would have it: duller, and nearer the blue-green of the floor.
vec3 gtStain(vec4 pc, vec3 teal) { vec3 d = gtDye(pc); return mix(mix(vec3(dot(d, vec3(0.3, 0.5, 0.2))), d, 0.76), teal, 0.22); }
// A running wave: 1 on the wave, 0 on the ground above it. s along, v from -1 to 1 across.
float gtWave(float s, float v) {
  float c = fract(s) - 0.5;
  vec2 q = vec2(c * 2.2, v + 0.05);
  float r = length(q), a = atan(q.y, q.x + 1e-5) / TAU;
  float curl = fract(a - r * 0.95 + 0.2) < 0.5 ? 1.0 : 0.0;
  float under = step(v, -0.55 + 0.35 * sin(TAU * (s + 0.1)));
  return max(under, r < 0.8 ? curl : 0.0);
}
// ---------- a: the apse
// Light on one tile. n its own facing, vw towards the eye, P its place.
vec3 gtLamp(vec3 n, vec3 vw, vec3 P, vec3 lamp, vec3 body, vec3 sheen, float metal) {
  vec3 L = lamp - P; float d2 = dot(L, L); L /= sqrt(d2 + 1e-4);
  float fall = 0.9 / (0.1 + d2 * (0.45 + 1.1 * d2));
  vec3 H = normalize(L + vw + 1e-4);
  float nh = sat(dot(n, H)), n2 = nh * nh, n4 = n2 * n2, n16 = n4 * n4; n16 *= n16;
  float sharp = pow(nh, mix(70.0, 150.0, uTone));
  float spec = 0.04 * n4 + 0.75 * n16 * n4 + 4.6 * sharp;
  vec3 R = reflect(-vw, n);
  float win = sat(dot(R, vec3(-0.62, 0.36, -0.697)));
  win = pow(win, 22.0);
  float cand = sat(0.4 - 0.75 * R.y) * sat(0.6 - 0.8 * R.z);
  vec3 warm = vec3(1.0, 0.72, 0.4);
  vec3 c = warm * fall * spec * sheen * mix(0.22, 1.15, metal);
  c += body * warm * fall * sat(dot(n, L)) * mix(0.85, 0.07, metal);
  c += sheen * (vec3(0.5, 0.68, 1.0) * win * (0.4 + 0.6 * uMic) + vec3(1.0, 0.45, 0.16) * cand * 0.06) * mix(0.35, 1.0, metal);
  return c;
}
vec3 gtApse(vec2 p) {
  vec3 ro = vec3(-0.5, -0.4, -1.0), ta = vec3(0.3, 0.36, 0.6);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.12 + rt * (p.x * 0.993 + p.y * 0.12) + up * (p.y * 0.993 - p.x * 0.12));
  float t = max(-ro.z, 0.0) / max(rd.z, 0.05);
  vec3 P = ro + rd * t, N = vec3(0, 0, -1), T = vec3(1, 0, 0);
  float edge = P.y > 0.0 ? length(P.xy) - 1.0 : abs(P.x) - 1.0; // how far outside the mouth of the apse
  float zone = 0.0, u, v, az = 0.0, rim = abs(edge), su = 1.0;
  if (edge < 0.0) {
    float b = dot(ro, rd), c = dot(ro, ro) - 1.0;
    t = -b + sqrt(max(b * b - c, 0.0));
    P = ro + rd * t; N = -P; zone = 1.0;
    if (P.y < 0.0) {
      vec2 o = ro.xz, d = rd.xz; float aa = dot(d, d), bb = dot(o, d), cc = dot(o, o) - 1.0;
      t = (-bb + sqrt(max(bb * bb - aa * cc, 0.0))) / aa;
      P = ro + rd * t; N = vec3(-P.x, 0.0, -P.z); zone = 2.0;
    }
    az = atan(P.x, max(P.z, 1e-4));
    rim = max(P.z, 0.0);
    T = vec3(cos(az), 0.0, -sin(az));
  }
  vec3 V = -rd;
  float px = t / (1.12 * uRes.y) / max(dot(V, N), 0.3);
  float s = 0.0;
  if (zone > 0.5) {
    v = zone < 1.5 ? asin(clamp(P.y, -1.0, 1.0)) : P.y;
    v += 0.005 * sin(az * 7.0 + 1.5 * sin(az * 3.0 + v * 4.0)) * smoothstep(0.0, 0.15, v);
    su = zone < 1.5 ? max(cos((floor(v / gtH) + 0.5) * gtH), 0.02) : 1.0;
    u = az * su;
  } else {
    float r = P.y > 0.0 ? length(P.xy) : abs(P.x);
    v = r;
    su = (floor(v / gtH) + 0.5) * gtH;
    s = P.y > 0.0 ? atan(P.x, P.y + 1e-5) : sign(P.x) * (0.5 * PI - P.y / su);
    u = s * su;
    T = vec3(P.y, -P.x, 0.0); T = P.y > 0.0 ? T / max(length(T), 1e-3) : vec3(0, 1, 0);
  }
  gtCut(u, v, px, zone * 41.0);
  vec2 m = gtMid; vec3 h = gtRnd; float mu = m.x / su; // mu: the angle along
  vec3 B = cross(N, T);
  // what the tile is made of
  vec3 gold = mix(vec3(1.0, 0.66, 0.2), vec3(0.98, 0.8, 0.4), h.x);
  gold = mix(gold, vec3(0.85, 0.5, 0.22), smoothstep(0.8, 1.0, h.y) * 0.7);
  vec3 body = gold * 0.5, sheen = gold, own = vec3(0.0); float metal = 1.0;
  vec3 pale = vec3(0.9, 0.85, 0.74), blue = mix(vec3(0.02, 0.05, 0.16), vec3(0.03, 0.1, 0.24), h.x), red = vec3(0.5, 0.06, 0.03);
  if (zone < 0.5) {
    float e = m.y - 1.0;
    metal = 0.0; body = blue;
    if (e < 0.035) { float k = fract(mu * 14.0 + e * 12.0); body = k < 0.5 ? red : vec3(0.0); metal = k < 0.5 ? 0.0 : 1.0; }
    else if (e < 0.25) {
      // the garland: a stem that winds, leaves on either side, a fruit in each bend
      float y = (e - 0.142) / 0.107, q = mu * 5.2, c = fract(q) - 0.5, side = mod(floor(q), 2.0) * 2.0 - 1.0;
      float stem = y - 0.42 * sin(PI * q);
      vec3 leaf = mix(vec3(0.05, 0.26, 0.12), vec3(0.22, 0.42, 0.1), h.x);
      if (abs(stem) < 0.1) { body = vec3(0.4, 0.36, 0.1); }
      for (int k = 0; k < 2; k++) {
        vec2 l = vec2(c - (k == 0 ? 0.2 : -0.24), y + side * (k == 0 ? 0.3 : -0.1));
        l = rot(side * (k == 0 ? 0.6 : -0.8)) * (l * vec2(1.15, 0.6));
        float d = abs(l.y) * 2.2 + l.x * l.x * 5.5;
        if (d < 0.34) { body = abs(l.y) < 0.035 ? vec3(0.5, 0.6, 0.22) : leaf * (l.y > 0.0 ? 1.4 : 0.7); own = uKind[1] * uPad; }
      }
      float fr = length(vec2(c * 1.1, (y + side * 0.62) * 0.55));
      if (fr < 0.14) { body = fr < 0.06 ? vec3(0.9, 0.5, 0.15) : vec3(0.6, 0.13, 0.04); own = uKind[3] * uPhrase; }
    }
    else if (e < 0.268) body = pale;
    else if (e < 0.3) body = red;
    else { metal = 1.0; body = gold * 0.3; sheen = gold * 0.3; }
  } else if (zone > 1.5) {
    float y = (m.y + 0.13) / 0.1;
    if (m.y > -0.018) { body = red; metal = 0.0; }
    else if (m.y > -0.24 && abs(y) < 1.0) {
      float w = gtWave(mu * 3.4, y);
      metal = 0.0;
      body = w > 0.5 ? mix(vec3(0.02, 0.16, 0.24), vec3(0.05, 0.34, 0.36), sat(0.5 + 0.5 * y + 0.5 * h.x - 0.25)) : pale * (0.8 + 0.3 * h.x);
      own = w > 0.5 ? uKind[0] * uDrone : vec3(0.0);
    }
    else if (m.y > -0.25) body = red, metal = 0.0;
    else { 
      metal = step(0.93, h.z); body = mix(blue, gold * 0.3, metal); }
  }
  // a vine winds over the vault, and in each of its curls a flower opens where the piece sounds
  if (zone > 0.5 && zone < 1.5) {
    float k = clamp(floor((m.y - 0.02) / 0.45), 0.0, 2.0), yc = 0.245 + 0.45 * k, gap = 0.47 / max(cos(yc), 0.2);
    float q = mu / gap + 0.5 * mod(k, 2.0) + 0.5, id = floor(q), side = mod(id + k, 2.0) * 2.0 - 1.0;
    float cx = (id + 0.5 - 0.5 - 0.5 * mod(k, 2.0)) * gap;
    vec2 d = vec2((mu - cx) * su, m.y - yc);
    float r = length(d), a = atan(d.x, d.y * side + 1e-5) / TAU; // 0 where the curl leaves the stem
    vec4 pc = piece(vec2(cx / 2.5 + 0.5, 1.06 - yc * 0.75));
    float loud = sat(pc.a * (0.75 + 0.6 * uEnergy));
    vec3 hue = gtDye(pc);
    vec3 leaf = mix(vec3(0.01, 0.1, 0.08), vec3(0.06, 0.22, 0.09), h.x);
    float turn = fract(side * a), cr = 0.19 * (1.0 - 0.36 * turn);
    float vine = min(abs(r - cr), abs(d.y - side * 0.19 * cos(PI * d.x / (gap * su))));
    float lobe = abs(sin(PI * 7.0 * a));
    float on = 0.0;
    float out_ = (r - 0.2) / 0.06;
    if (out_ > 0.0 && lobe > 0.35 + 0.65 * out_ * out_) { on = 1.0; 
      vec4 pl = piece(vec2(mu / 2.5 + 0.5, 1.06 - m.y * 0.75));
      float lo = smoothstep(0.2, 0.7, pl.a); vec3 lh = gtDye(pl);
      body = leaf * (lobe > 0.9 ? 2.6 : 1.3);
      body = mix(body, lh * (lobe > 0.9 ? 1.3 : 0.6), lo * 0.85); own += lh * lo * 0.15; }
    if (vine < 0.0125) { on = 1.0; body = leaf * 0.8; }
    float rr = 0.028 + 0.105 * smoothstep(0.0, 0.85, loud), pet = rr * (0.74 + 0.26 * abs(cos(PI * 8.0 * a))), x = r / rr;
    float fl = (1.0 - smoothstep(-0.006, 0.006, r - pet));
    vec3 glass = mix(hue * 0.22, hue * 0.8, smoothstep(0.3, 0.5, x));
    glass = mix(glass, mix(pale, hue, 0.3), smoothstep(0.7, 0.78, x));
    glass = mix(vec3(0.4, 0.07, 0.04), glass, smoothstep(0.02, 0.2, loud));
    if (r < 0.018) { glass = vec3(0.9, 0.6, 0.15); own += glass * uKeys * 5.0; }
    body = mix(body, glass * (0.8 + 0.4 * h.y), fl); on = max(on, fl);
    metal *= 1.0 - on;
    own += hue * (fl * loud * 0.5 + 0.3 * loud * loud * exp(-r * r * 60.0));
    sheen = mix(sheen, hue * 1.3 + 0.1, 0.5 * loud * exp(-r * r * 50.0));
  }
  if (metal < 0.5) sheen = mix(vec3(0.5), body, 0.6);
  // how the tile is set, and its slightly rounded face
  float tilt = 0.34 * (1.0 - smoothstep(0.6, 2.0, px / gtH * 3.0));
  vec3 n = N + (T * (h.x - 0.5) + B * (h.y - 0.5)) * tilt + (T * gtIn.x + B * gtIn.y) * 0.035;
  n += vec3(0, 0, -1) * exp(-rim * rim * 900.0) * 0.25 * step(0.5, zone);   // the gold rolls over the edge of the mouth
  n = normalize(n);
  float tm = uTime;
  vec3 eye = ro + vec3(0.25 * sin(tm * 0.05), 0.1 * sin(tm * 0.037), 0.0);
  vec3 lamp = vec3(0.42 * sin(tm * 0.061 + 2.0), -0.05 + 0.16 * sin(tm * 0.083), -0.5 + 0.2 * sin(tm * 0.047));
  lamp += vec3(0.28, 0.14, 0.1) * uLow + vec3(0.0, 0.0, -0.25) * (uSpace - 0.5);
  vec3 vw = normalize(eye - P);
  vec3 c = gtLamp(n, vw, P, lamp, body, sheen, metal) * (0.85 + 0.55 * uLevel);
  // single tiles that flare and go
  float ph = h.z * TAU * 3.0 + tm * (0.35 + 0.4 * h.y);
  float fl = pow(0.5 + 0.5 * sin(ph), 26.0);
  c += sheen * fl * (0.06 + 1.5 * uHigh) * step(0.6, h.x) * mix(0.1, 0.8, metal) / (0.6 + 2.5 * dot(lamp - P, lamp - P));
  // a hit: a ring of flashes that opens over the wall
  vec3 ctr = normalize(vec3(0.35 * sin(tm * 0.09), 0.45 + 0.15 * sin(tm * 0.07), 0.8));
  float ring = (length(P - ctr) - 0.9 * (1.0 - uHits) - 0.1) * 7.5;
  c += mix(sheen, uKind[4], 0.4) * exp(-ring * ring) * uHits * (0.1 + 2.6 * h.z * h.z * h.z * h.z);
  // a cue: light drawn slowly across
  if (uCue > 0.004) c += gtLamp(n, vw, P, vec3(-1.0 + 2.0 * (1.0 - uCue), 0.25, -0.2), body, sheen, metal) * uCue * 1.7;
  c += own * (0.12 + 0.5 * uEnergy) * 0.5 * (0.6 + 0.8 * h.x);
  vec3 joint = vec3(0.02, 0.012, 0.008) + c * 0.06;
  c = mix(joint, c, gtOn);
  // the corner of the apse, and the dark of the nave
  c *= zone < 0.5 ? exp(-max(edge - 0.25, 0.0) * 2.5) : 1.0;
  c *= zone > 1.5 ? smoothstep(-1.1, -0.1, P.y) : 1.0;
  return screenOf(c * 1.3);
}
// ---------- b: the sea floor
// How the water stands over a place: its slope, and how strongly it draws the light together there.
vec3 gtWater(vec2 p, float t) {
  vec2 x = p, g; vec3 H;
  for (int k = 0; k < 3; k++) {
    g = vec2(0.0); H = vec3(0.0);
    float a = 0.4, f = 15.0;
    for (int i = 0; i < 6; i++) {
      float n = float(i); // six waves, each crossing the last
      vec2 d = vec2(cos(a), sin(a));
      float ph = dot(d, x) * f + t * (0.55 + 0.12 * n) + n * 1.9 + 1.4 * sin(dot(x, vec2(-d.y, d.x)) * f * 0.4 + t * 0.21 + n);
      g += d * cos(ph) / f;
      H += vec3(d.x * d.x, d.y * d.y, d.x * d.y) * sin(ph);
      a += 2.4; f *= 1.24;
    }
    x = p + g * 0.42;
  }
  float det = (1.0 + 0.42 * H.x) * (1.0 + 0.42 * H.y) - 0.176 * H.z * H.z;
  return vec3(g, 1.0 / (0.12 + abs(det)));
}
vec3 gtSea(vec2 p) {
  gtH = 0.0128;
  float t = uTime * 0.8;
  vec3 wa = gtWater(p, t);
  vec2 q = p + wa.xy * mix(0.032, 0.058, uSpace);
  const vec2 ctr = vec2(0.3, -0.1); const float edge = 0.62;
  vec2 rc = q - ctr;
  float R = length(rc), px = 1.0 / uRes.y, row;
  bool disc = R < edge;
  float u, v;
  if (disc) { v = R; row = (floor(v / gtH) + 0.5) * gtH; u = atan(rc.x, rc.y + 1e-5) * row; }
  else { v = q.y + 0.035 * sin(q.x * 5.0) + 0.3 * q.x; row = 1.0; u = q.x - 0.3 * q.y; }
  gtCut(u, v, px, disc ? 3.0 : 90.0);
  vec3 h = gtRnd;
  gtOn *= smoothstep(0.0, px * 1.5, abs(R - edge) - 0.001);
  // the stones
  vec3 white = mix(vec3(0.78, 0.8, 0.76), vec3(0.95, 0.92, 0.84), h.x), deep = mix(vec3(0.01, 0.06, 0.12), vec3(0.02, 0.11, 0.19), h.y);
  vec3 teal = mix(vec3(0.02, 0.27, 0.36), vec3(0.05, 0.38, 0.44), h.x), green = mix(vec3(0.2, 0.52, 0.48), vec3(0.36, 0.66, 0.6), h.y);
  vec3 gold = mix(vec3(1.0, 0.66, 0.2), vec3(0.98, 0.8, 0.4), h.x);
  vec3 body = white, own = vec3(0.0); float metal = 0.0;
  if (disc) {
    float r = gtMid.y, a = gtMid.x / row / TAU; // a: -0.5 to 0.5 round the disc
    if (r < 0.058) metal = 1.0;
    else if (r < 0.4) {
      // scales that grow outwards, each as loud as the piece is where it lies
      const float M = 16.0, K = 5.0; float lg = log(0.4 / 0.058) / K;
      float n = log(r / 0.058) / lg, k = floor(n), side = a * M + 0.5 * mod(k, 2.0);
      float w = (fract(side) - 0.5) * 2.0, b = n - k;
      if (b > 1.0 - 0.95 * w * w) { b -= 1.0; k += 1.0; side = a * M + 0.5 * mod(k, 2.0); w = (fract(side) - 0.5) * 2.0; }
      b = 1.0 - 0.95 * w * w - b;   // how deep inside its scale, 0 at the rim
      float ra = 0.058 * exp((k + 0.35) * lg), an = (floor(side) + 0.5 - 0.5 * mod(k, 2.0)) / M * TAU;
      vec4 pc = piece((ctr + ra * vec2(sin(an), cos(an))) * vec2(0.5618, -1.0) + 0.5);
      float loud = sat(pc.a * (0.75 + 0.6 * uEnergy)); vec3 hue = gtStain(pc, teal);
      vec3 heart = mix(mod(k, 2.0) < 0.5 ? teal : green, hue * 0.75, smoothstep(0.12, 0.5, loud));
      vec3 rim = mix(deep, hue * 0.2, 0.7 * smoothstep(0.2, 0.7, loud));
      body = mix(white, heart, smoothstep(0.42, 0.5, b));
      body = mix(body, mix(deep, hue * 0.3, loud), smoothstep(0.95, 1.0, b));
      body = mix(rim, body, smoothstep(0.16, 0.2, b));
      own = hue * loud * smoothstep(0.4, 0.5, b);
    }
    else if (r < 0.414) metal = 1.0;
    else if (r < 0.43) body = deep;
    else if (r < 0.58) { float w = gtWave(a * 13.0, (r - 0.505) / 0.075); body = mix(white, mix(deep, teal, sat((r - 0.45) / 0.09)), w); own = w * 0.7 * uKind[0] * uDrone * sat((r - 0.44) / 0.1); }
    else if (r < 0.592) body = deep;
    else if (r < 0.604) body = green;
    else metal = 1.0;
  } else {
    // water drawn in rows of waves: a thin line with nothing sounding, broad and coloured where the piece sounds
    const float gap = 0.0768;
    float k = floor(gtMid.y / gap), x = gtMid.x * 9.0 + 0.07 * k;
    float y = gtMid.y - (k + 0.5) * gap - 0.015 * sin(TAU * x);
    vec2 at = vec2(gtMid.x + 0.3 * q.y, q.y);
    vec4 pc = piece(at * vec2(0.5618, -1.0) + 0.5);
    float loud = sat(pc.a * (0.75 + 0.6 * uEnergy)); vec3 hue = gtStain(pc, teal);
    float dash = smoothstep(0.35, 0.45, abs(fract(x * 0.27 + 0.37 * k) - 0.5) * 2.0);
    float wide = max(0.0085 * dash, 0.026 * smoothstep(0.08, 0.6, loud));
    float on = (1.0 - smoothstep(-0.003, 0.003, abs(y) - wide));
    vec3 ink = mix(mix(teal, deep, step(y, -0.004)), hue * (y > 0.0 ? 0.85 : 0.35), smoothstep(0.08, 0.3, loud));
    body = mix(mix(body, green, 0.1 * h.z), ink, on); own = hue * loud * on;
  }
  if (metal > 0.5) body = gold * 0.6;
  body *= 0.85 + 0.25 * h.z;
  // the light through the water, in a net
  float net = wa.z * wa.z; net = net * mix(0.75, 1.25, uTone) / (3.2 + 0.5 * net);
  float shaft = smoothstep(-0.75, 0.55, p.x * 0.7 + p.y * 0.8 + 0.1 * sin(uTime * 0.05) + 0.2 * uLow);
  // a hit is a ring of brighter water; a cue a slow light going across
  vec2 drop = vec2(-0.3 + 0.2 * sin(uTime * 0.07), 0.05 + 0.15 * cos(uTime * 0.09));
  float ring = (length(p - drop) - 0.06 - 0.75 * (1.0 - uHits)) * 9.0, sw = (p.x + 0.4 * p.y + 1.0 - 2.0 * (1.0 - uCue)) * 2.6;
  ring = exp(-ring * ring) * uHits;
  float extra = ring + exp(-sw * sw) * uCue * 1.4;
  float light = (0.34 + 0.75 * net) * mix(0.2, 1.15, shaft) * (0.8 + 0.4 * uLevel + 0.15 * uMic) + extra * (0.6 + 0.7 * net);
  vec3 sun = vec3(1.0, 0.97, 0.82) * light + vec3(0.03, 0.12, 0.16);
  vec3 c = body * sun * (0.85 + 0.4 * (h.x - 0.5) + 0.14 * dot(gtIn, vec2(0.5, 0.6)));
  float fl = pow(0.5 + 0.5 * sin(h.z * 19.0 + uTime * (0.35 + 0.4 * h.y)), 20.0);
  c += gold * metal * (net * light * 0.9 + fl * (0.2 + 1.2 * uHigh) + (extra + uKeys) * h.z);
  c += mix(vec3(1.0, 0.85, 0.6), uKind[4], 0.3) * ring * h.z * h.z * h.z * 1.2;
  c += own * (0.05 + 0.25 * uEnergy) * (0.4 + net);
  vec3 joint = vec3(0.055, 0.05, 0.034) * sun + vec3(1.0, 0.68, 0.25) * net * net * light * 0.07;
  c = mix(joint, c, gtOn);
  c *= vec3(0.78, 1.0, 1.0);
  return screenOf(c * 2.1);
}
vec3 render(vec2 p) { return uVar < 0.5 ? gtApse(p) : gtSea(p); }
