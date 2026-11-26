// name: Scraped black
// a: Lone shell
// b: Unlit stair
// what: A plate worked to a velvet black, and every light scraped back out of its burr by hand: one snail shell on a faint ledge, a bright window on its shoulder, its mouth dark; or six worn stair treads that climb from the lower left into the black, each a soft lit lip, inside the pale line of the plate's edge.
// follows: Drone burnishes the ground; pad widens the greys; texture roughens the burr; a phrase lifts the dark edge, or lights the stair tread by tread. The piece lies on ledge or treads, the bands are sixteen scrapes, the loop turns the light. A hit is a burnished stroke that fills in; a cue opens the highlight or a light above; keys are pins, a voice lifts the dark.
const float sbK = 0.1063;                             // how fast the shell grows with its turning
const vec3 sbT = vec3(0.6, 0.84, 0.455);              // its tube at the mouth: out from the axis, down from the tip, radius
const float sbD = 0.95, sbH = 0.5, sbW = 1.4;         // a tread's depth and height, and half the stair's width
vec3 sbL;                                             // towards the light
float sbHalf, sbPx, sbGain, sbGap;                    // half the picture's width, a pixel, how strongly things answer, the groove between whorls

float sbBell(float x) { return exp(-x * x); }
// The burr a rocker raised, 0 to 1: four passes of fine teeth at four angles, fixed to the screen.
float sbBurr(vec2 fc) {
  vec2 q = fc / max(1.0, uRes.y / 760.0);
  float h = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 c = rot(0.31 + 0.785 * float(i)) * q;
    h += noise(c * vec2(0.25, 1.27) + 31.7 * float(i));
  }
  return smoothstep(1.1, 2.9, h);
}
// One stroke of the burnisher from a to b: a lens of light with the tool's own streaks in it.
float sbStroke(vec2 p, vec2 a, vec2 b, float wide) {
  vec2 d = b - a; float l2 = dot(d, d), t = dot(p - a, d) / l2;
  float off = dot(p - a, vec2(-d.y, d.x)) / sqrt(l2) + wide * 1.2 * t * (1.0 - t);
  float w = wide * sqrt(max(4.0 * t * (1.0 - t), 0.0));
  return (1.0 - smoothstep(w * 0.35 - sbPx, w + sbPx, abs(off))) * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.5, 1.0, t)) * (0.72 + 0.28 * noise(vec2(t * 5.0, off / wide * 5.0)));
}

// Towards the shell: distance; how far along the spiral (over 0.5: 1 the mouth, 2 the lip); the place across the tube.
vec4 sbShell(vec3 q) {
  float r = length(q.xz) + 1e-5, th = atan(-q.z, q.x + 1e-5), cap = th > 0.0 ? -1.0 : 0.0;
  float f = floor(log(max(length(vec2(r, q.y)), 0.003) / length(sbT.xy)) / (TAU * sbK) - th / TAU);
  vec4 best = vec4(1e3, 0.0, 0.0, 0.0);
  sbGap = 1e3;
  for (int i = 0; i < 2; i++) {
    float n = min(f + float(i), cap), ph = th + TAU * n, s = exp(sbK * ph);
    vec2 c = vec2(r - sbT.x * s, (q.y + sbT.y * s) * 0.88);
    float d = length(c) - sbT.z * s;
    if (i == 1 && n > f) sbGap = abs(d - best.x) / s;
    if (d < best.x) best = vec4(d, ph, c / (sbT.z * s));
  }
  // the mouth: a dark plate across the end of the tube, and the lip round it
  vec2 m = vec2(q.x - sbT.x, (q.y + sbT.y) * 0.88);
  float e = length(m) - sbT.z;
  float plate = length(vec2(max(e, 0.0), q.z)) - 0.012, lip = length(vec2(e - 0.02, q.z + 0.012)) - 0.034;
  if (plate < best.x) best = vec4(plate, 1.0, m / sbT.z);
  if (lip < best.x) best = vec4(lip, 2.0, m / sbT.z);
  return best;
}

// a: one shell on a ledge. Returns how much burr is gone, 0 to 1.
float sbLone(vec2 p) {
  float fit = min(1.0, sbHalf / 0.42), size = 0.235 * (0.3 + 0.7 * fit);
  vec2 c = vec2(0.2 * sat((sbHalf - 0.2) / 0.6), -0.13), u = (p - c) / size;
  float floorY = c.y - 0.5 * size, front = floorY - 0.1 + 0.003 * sin(p.x * 4.0 + 1.0) + 0.002 * sin(p.x * 11.0);
  float open = uCue;
  // the wall behind: a little lighter past the shell's dark side
  vec2 w = (p - c - vec2(0.2, 0.1)) / (vec2(0.42, 0.3) * (0.85 + 0.4 * uSpace));
  float tone = (0.05 + 0.1 * uDrone + 0.08 * open) * exp(-dot(w, w)) * (0.8 + 0.4 * noise(rot(0.7) * p * vec2(4.0, 30.0) + uTravel * 0.012));
  // the ledge
  float on = (1.0 - smoothstep(floorY - 0.04, floorY + 0.06, p.y)) * smoothstep(front - sbPx, front + sbPx, p.y);
  float pool = sbBell((p.x - c.x + 0.06) / (0.4 + 0.25 * uSpace));
  float m = sat(piece(vec2(0.5 + p.x / 1.75, sat(0.9 - (p.y - front) / 0.14))).a) * (1.0 - smoothstep(0.6, 0.87, abs(p.x))) * sbGain;
  float led = pool * (0.1 + 0.2 * uDrone) + 0.24 * m * (0.35 + 0.65 * pool);
  led *= 0.75 + 0.5 * noise(p * vec2(9.0, 120.0));
  vec2 sh = (u - vec2(0.42, -0.58)) / vec2(0.95, 0.14);
  led *= 1.0 - 0.96 * exp(-dot(sh, sh) * dot(sh, sh));
  tone = mix(tone, led, on);
  tone += sbBell((p.y - front) / 0.0028) * (pool * pool * (0.14 + 0.2 * uDrone) + 0.2 * m);
  tone *= 0.15 + 0.85 * smoothstep(front - 0.05, front, p.y);
  // a hit: one stroke of the burnisher along the ledge, which fills in again, and its light on what stands near
  vec2 sa = vec2(c.x - 0.72 * fit, front + 0.038), sb = vec2(c.x - 0.2 * fit, front + 0.06);
  vec2 sg = (p - mix(sa, sb, 0.5)) / vec2(0.3, 0.07);
  tone += uHits * (0.8 * sbStroke(p, sa, sb, 0.022) + 0.16 * exp(-dot(sg, sg)) * step(front, p.y));
  // the shell
  mat2 lean = rot(0.25), tilt = rot(-0.7), turn = rot(-0.27);
  float t = 1.7, hit = 0.0;
  vec2 bd = u - vec2(0.15, 0.1);
  bool near = dot(bd, bd) < 1.25;
  vec3 q = vec3(0.0);
  vec4 h = vec4(0.0);
  for (int i = 0; i < 44 && near; i++) {
    q = vec3(u, t - 3.0);
    q.xy = lean * q.xy; q.yz = tilt * q.yz; q.xz = turn * q.xz; q.y -= 0.62;
    h = sbShell(q);
    if (h.x < 0.004) { hit = 1.0; break; }
    t += h.x * 0.8;
    if (t > 4.6) break;
  }
  float gap = sbGap, shade = 1.0;
  vec3 n = vec3(0.0), L = sbL;
  L.xy = lean * L.xy; L.yz = tilt * L.yz; L.xz = turn * L.xz;
  for (int i = 0; i < 4 && hit > 0.5; i++) {
    vec3 e = 0.012 * (vec3(float(((i + 3) >> 1) & 1), float((i >> 1) & 1), float(i & 1)) * 2.0 - 1.0);
    n += e * sbShell(q + e).x;
  }
  float st = 0.06;
  for (int i = 0; i < 9 && hit > 0.5; i++) { float d = sbShell(q + L * st).x; shade = min(shade, sat(0.5 + 5.0 * d / st)); st += max(d, 0.07); }
  if (hit > 0.5) {
    n /= max(length(n), 1e-5);
    n.xz = n.xz * turn; n.yz = n.yz * tilt; n.xy = n.xy * lean; // back to the room
    float l = dot(n, sbL), wrap = 0.08 + 0.36 * uPad;
    float lit = pow(sat((l + wrap) / (1.0 + wrap)), 2.1) * mix(0.25, 1.0, shade);
    float edge = pow(1.0 - sat(-n.z), 2.5);
    if (h.y < 0.5) {
      float ang = atan(h.w, h.z + 1e-5), s = exp(sbK * h.y), across = sat((ang + 1.1) / 2.6);
      // what the shell grew: lines along its mouth's shape, darker turns of colour along the spiral
      float grow = noise(vec2(h.y * 9.0, ang * 1.5)) * 0.6 + noise(vec2(h.y * 34.0, ang * 2.5)) * 0.4;
      float belt = sbBell((ang - 0.75) / 0.12) + sbBell((ang - 0.2) / 0.16) * 0.8 + sbBell((ang + 0.35) / 0.1) * 0.6;
      lit *= (0.72 + 0.5 * grow) * (1.0 - 0.45 * sat(belt) * (0.75 + 0.5 * grow));
      // sixteen threads, each scraped as deep as its band
      float th = across * 16.0, thread = sbBell((fract(th) - 0.5) / 0.2) * smoothstep(0.25, 0.5, s);
      lit += thread * band(across) * sbGain * 0.6 * (0.14 + lit);
      // the keys: pins of light along the threads
      vec2 pin = vec2(fract(h.y * 2.2) - 0.5, fract(th) - 0.5), pc = vec2(floor(h.y * 2.2), floor(th));
      lit += uKeys * step(0.62, hash21(pc + 60.0)) * exp(-dot(pin * vec2(0.8, 1.0), pin * vec2(0.8, 1.0)) * 40.0) * smoothstep(0.3, 0.6, s) * (0.4 + lit) * 2.0;
      lit *= 0.35 + 0.65 * smoothstep(0.0, 0.3, gap);
      tone = 0.02 + 1.2 * lit / (1.0 + 0.2 * uPad * lit + 0.12 * lit);
    } else if (h.y < 1.5) {
      float r = length(h.zw);
      tone = 0.012 + (0.2 + 0.4 * uMic) * smoothstep(0.45, 1.05, r) * sat(dot(h.zw, vec2(0.85, -0.5)));
    } else tone = 0.07 + (0.06 + 0.5 * uPhrase) * pow(sat(dot(n, vec3(0.5, -0.7, -0.5))), 3.0) + 1.1 * lit;
    // the burnished window on the shoulder; a cue opens it
    float sp = sat(dot(reflect(vec3(0.0, 0.0, 1.0), n), normalize(vec3(-0.42 + 0.1 * sin(TAU * uLoop) + 0.07 * sin(uTime * 0.07), 0.62, -0.66))));
    if (h.y < 0.5) tone += (smoothstep(0.91 - 0.14 * open, 0.985 - 0.05 * open, sp) * 0.7 + 0.3 * pow(sp, 12.0)) * (0.75 + 0.25 * uLevel) * (0.6 + 0.4 * smoothstep(0.0, 0.2, gap));
    tone += uHits * 0.5 * pow(sat(dot(n, vec3(-0.72, -0.65, -0.25))), 1.5) * (h.y < 0.5 ? 1.0 : 0.3);
    // light thrown back on the dark side
    tone += edge * sat(dot(n, vec3(0.75, -0.5, -0.1)) + 0.15) * (0.06 + 0.6 * uPhrase);
  }
  return tone;
}

// b: six worn treads
float sbWear(float x) { return 0.11 * sbBell((x - 0.1) / 0.62) + 0.004 * sin(x * 5.0 + 1.0); }
float sbStair(vec2 p) {
  float fit = min(1.0, sbHalf / 0.6);
  p = (p + vec2(0.02 - 0.28 * (1.0 - fit), -0.035 + 0.16 * (1.0 - fit))) / (0.2 + 0.8 * fit);
  vec3 ro = vec3(3.1, 2.2, -3.5), ta = vec3(0.36, 1.42, 2.0);
  vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0.0, 1.0, 0.0), f)), up = cross(f, r);
  vec3 rd = normalize(f * 1.5 + r * p.x + up * p.y);
  float best = 1e4, s = 0.0, x = 0.0, k = 0.0, kind = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i), z0 = fi * sbD, y1 = (fi + 1.0) * sbH;
    float t = (z0 - ro.z) / rd.z; vec3 q = ro + rd * t;
    float y = q.y - y1 + sbWear(q.x);
    if (t < best && abs(q.x) < sbW && y < 0.0 && y > -sbH - 0.13) { best = t; s = y; x = q.x; k = fi; kind = 1.0; }
    // a ray that clears the lip and falls lands on the tread, worn as deep as its lip was there
    if (y >= 0.0 && rd.y < -1e-4) {
      t = (y1 - sbWear(q.x) - ro.y) / rd.y; q = ro + rd * t;
      if (t < best && abs(q.x) < sbW && q.z < z0 + sbD) { best = t; s = max(q.z - z0, 0.0); x = q.x; k = fi; kind = 2.0; }
    }
  }
  // the near end of the stair
  float te = (sbW - ro.x) / (abs(rd.x) < 1e-5 ? 1e-5 : rd.x); vec3 e = ro + rd * te;
  float ke = clamp(floor(e.z / sbD), 0.0, 5.0);
  bool side = te > 0.0 && te < best && e.z > 0.0 && e.z < 6.0 * sbD && e.y < (ke + 1.0) * sbH - sbWear(sbW);
  float tone = 0.0, wide = 1.0 + 1.3 * uPad;
  if (side) { kind = 0.0; tone = 0.03 * exp(-ke * 0.5) * noise(e.zy * vec2(6.0, 9.0)); }
  if (kind > 0.5) {
    float mid = x - 0.1 + 0.16 * sin(TAU * uLoop) + 0.14 * sin(uTime * 0.07), chip = noise(vec2(x * 9.0, k * 5.0 + s * 8.0)), far = pow(0.62 + 0.22 * uSpace, k);
    float pool = sbBell(mid / 0.8);
    float gain = 0.95 * far + 0.6 * smoothstep(k / 6.0 - 0.1, k / 6.0 + 0.3, uPhrase);
    gain += 0.5 * uCue * k / 5.0;
    float lip = kind > 1.5 ? exp(-s / (0.07 + 0.02 * k)) : exp(s / ((0.04 + 0.01 * k) * (0.6 + 0.8 * chip)));
    float soft = kind > 1.5 ? exp(-s / (0.26 * wide)) : 0.75 * exp(s / (0.1 * wide));
    tone = gain * (0.55 * lip * (0.12 + pool) + 0.4 * soft * pool * (0.7 + 0.6 * chip));
    // what the dark still lets through: treads a little, risers less
    tone += (kind > 1.5 ? 0.07 : 0.035) * sbBell(mid / 1.3) * far * (0.5 + chip) * (1.0 + 1.5 * uDrone);
    float along = x / (2.0 * sbW) + 0.5, cut = fract(along * 16.0) - 0.5;
    if (kind > 1.5) {
      // sixteen scrapes across each tread, as deep as their bands, and the piece: its loop along a tread, its room up the stair
      tone += sbBell((cut + 0.3 * (chip - 0.5)) / 0.2) * exp(-s / 0.3) * band(along) * 0.3 * sbGain * far;
      tone += sat(piece(vec2(along, (k + 0.5) / 6.0)).a) * exp(-s / 0.4) * (0.6 + 0.6 * chip) * 0.3 * sbGain * (0.4 + 0.6 * far);
    } else if (k == 1.0) tone += uHits * 0.9 * sbStroke(vec2(x, s), vec2(-0.95, -0.33), vec2(0.9, -0.23), 0.09) + uHits * 0.2 * sbBell(x / 0.9) * sbBell((s + 0.28) / 0.22);
    if (k == 0.0 && kind > 1.5) tone += uHits * 0.4 * exp((s - sbD) / 0.45) * sbBell(x / 0.9);
    tone += uKeys * step(0.5, hash21(vec2(floor(along * 16.0), k))) * exp(-cut * cut * 90.0 - s * s * 1500.0) * 0.9;
  } else if (!side) {
    // past the last tread, a light that a cue and a voice let in
    vec2 w = (p - vec2(0.31, 0.36)) / vec2(0.2, 0.28);
    tone += (0.3 * uCue + 0.12 * uMic + 0.04 * uDrone) * exp(-dot(w, w));
  }
  return tone;
}

vec3 render(vec2 p) {
  sbPx = 1.0 / uRes.y; sbHalf = 0.5 * uRes.x / uRes.y; sbGain = 0.5 + uEnergy;
  sbL = normalize(vec3(-0.72 + 0.14 * sin(TAU * uLoop) + 0.1 * sin(uTime * 0.07), 0.62, -0.36));
  vec2 at = p + (hash22(gl_FragCoord.xy) - 0.5) * 1.4 * sbPx; // every edge breaks into burr
  float tone = sat(uVar < 0.5 ? sbLone(at) : sbStair(at));
  float b = sbBurr(gl_FragCoord.xy);
  float rough = 0.26 + 0.2 * uTexture + 0.16 * (uTone - 0.5);
  float white = sat(tone + (0.5 - b) * rough * 4.0 * tone * (1.0 - tone) * (0.5 + 0.5 * smoothstep(0.05, 0.4, tone)));
  vec3 ink = vec3(0.03, 0.028, 0.027) + 0.05 * (1.0 - b) * (0.7 + 0.6 * noise(rot(0.6) * p * vec2(3.0, 24.0) + uTravel * 0.01));
  vec3 col = mix(ink, vec3(0.94, 0.915, 0.87), white);
  // a breath of what sounds in the half-tones
  vec3 hue = 0.15 + uKind[0] * uDrone + uKind[1] * uPad + uKind[2] * uTexture + uKind[3] * uPhrase;
  col *= mix(vec3(1.0), hue / max(dot(hue, vec3(0.3, 0.59, 0.11)), 0.05), 0.09 * white * (1.0 - white) * 4.0);
  // the plate's edge
  vec2 b2 = abs(p) - vec2(sbHalf - 0.03, 0.47);
  float ed = max(b2.x, b2.y) + 0.002 * (noise(p * 9.0) - 0.5);
  col = mix(col, vec3(0.05, 0.048, 0.046), uVar * smoothstep(-sbPx, sbPx, ed));
  return mix(col, vec3(0.94, 0.915, 0.87), uVar * 0.42 * (1.0 - smoothstep(0.003 - sbPx, 0.003 + sbPx, abs(ed))) * (0.5 + 0.5 * noise(p * 14.0)));
}
