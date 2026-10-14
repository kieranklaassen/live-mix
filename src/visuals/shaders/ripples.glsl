// name: Ripples
// a: Sea of dots
// b: Rain pond
// what: A sea of dots at night under one low light on the horizon; the piece lies on the water, the loop across and the room going away, and rings spread through it.
// follows: The piece sizes and colours the dots, the low band raises the swell, every hit or cue drops a ring that travels out and lifts and lights the dots on its crest.
float kH, kC, RH, RC;      // how strong the rings of a hit and of a cue are, and how far they have got
vec2 hitAt, cueAt;
// The water's height at a place on the sea (x across, y away), and how much of it is each ring.
float sea(vec2 c, out float ringH, out float ringC) {
  float T = uTravel;
  float h = (0.22 + 0.78 * uLow) * (0.6 * sin(c.x * 2.3 + c.y * 3.1 - T * 1.4) + 0.4 * sin(c.y * 5.6 - c.x * 1.7 - T * 1.0 + 1.7));
  float d = length(c - hitAt) - RH;
  ringH = kH * exp(-d * d * 26.0) * cos(d * 20.0);
  d = length(c - cueAt) - RC;
  ringC = kC * exp(-d * d * 14.0) * cos(d * 15.0);
  return h + 1.7 * ringH + 1.9 * ringC;
}
// The pond from above: rain rings, each where the piece sounds. Gives the height, which way it slopes, and the rings' colour.
const float G = 0.36, TP = 3.0;
vec2 pondUV(vec2 q) { return vec2(q.x / (uRes.x / uRes.y) + 0.5, 0.5 - q.y); }
float pond(vec2 q, out vec2 grad, out vec3 tint) {
  float h = 0.0; grad = vec2(0.0); tint = vec3(0.0);
  vec2 gid = floor(q / G);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cid = gid + vec2(float(i), float(j));
    float tt = uTime + hash21(cid) * TP * 7.0;
    float n = floor(tt / TP), life = tt / TP - n;
    vec2 o = (cid + 0.15 + 0.7 * hash22(cid + n * 7.31)) * G;
    vec4 m = piece(pondUV(o));
    float a = 0.2 + 0.3 * uLevel + 1.0 * sat(m.a);        // a drizzle everywhere, rain where the piece sounds
    vec2 v = q - o;
    float dist = length(v) + 1e-4, d = dist - 0.84 * G * life;
    float env = a * (1.0 - life) * (1.0 - life) * smoothstep(0.0, 0.12, life);
    float e = exp(-d * d * 220.0), cs = cos(d * 52.0), sn = sin(d * 52.0);
    float w = env * e * cs;
    h += w;
    grad += env * e * (-440.0 * d * cs - 52.0 * sn) * v / dist;
    tint += mix(vec3(0.5, 0.65, 0.8), m.rgb / max(m.a, 1e-3), smoothstep(0.03, 0.12, m.a)) * abs(env * e);
  }
  // a hit or a cue drops one big ring that crosses the whole pond
  vec2 v = q - hitAt; float dist = length(v) + 1e-4, d = dist - RH;
  float e = kH * 1.5 * exp(-d * d * 120.0), cs = cos(d * 40.0);
  h += e * cs; grad += e * (-240.0 * d * cs - 40.0 * sin(d * 40.0)) * v / dist; tint += uKind[4] * 1.4 * e;
  v = q - cueAt; dist = length(v) + 1e-4; d = dist - RC;
  e = kC * 1.6 * exp(-d * d * 70.0); cs = cos(d * 30.0);
  h += e * cs; grad += e * (-140.0 * d * cs - 30.0 * sin(d * 30.0)) * v / dist; tint += vec3(1.0, 0.85, 0.6) * 1.2 * e;
  return h;
}
vec3 render(vec2 p) {
  vec3 col = vec3(0.0);
  float k = sat(uHits * 1.3);
  kH = sqrt(k); kC = sqrt(uCue);
  float px = 1.0 / uRes.y;
  if (uVar < 0.5) {
    RH = 0.12 + 0.5 * -log(max(k, 0.03));
    RC = 0.1 + 0.8 * -log(max(uCue, 0.03));
    float cell = 0.06, wide = 1.8, deep = 3.0;
    hitAt = vec2((uLoop - 0.5) * wide, 0.1 + deep * 0.62);
    cueAt = vec2(0.25, 1.0);
    vec3 ro = vec3(0.1 * sin(uTime * 0.09), 0.5 + 0.03 * sin(uTime * 0.2), -0.6), ta = vec3(0.0, 0.0, 1.6);
    vec3 fw = normalize(ta - ro), rt = normalize(cross(vec3(0, 1, 0), fw)), up = cross(fw, rt);
    float f = 1.1;
    vec3 rd = normalize(fw * f + rt * p.x + up * p.y);
    // the light on the horizon, a little to the right, and its glow
    vec3 ld = normalize(vec3(0.24, 0.012, 1.0));
    vec2 lp = f * vec2(dot(ld, rt), dot(ld, up)) / dot(ld, fw);
    vec3 lightCol = mix(vec3(1.0, 0.86, 0.66), uKind[1] + 0.25, 0.35 * uPad) * (0.45 + 0.9 * uLevel);
    float hy = f * dot(vec3(0, 0, 1), up) / dot(vec3(0, 0, 1), fw);   // where the horizon lies on the screen
    float lr = length((p - lp) * vec2(1.0, 1.6));
    if (p.y > hy - 0.004) {
      col += lightCol * (exp(-lr * lr * 2600.0) * 3.0 + exp(-lr * 26.0) * 0.16 + exp(-abs(p.y - hy) * 90.0) * exp(-abs(p.x - lp.x) * 4.0) * 0.08);
    }
    if (rd.y < -0.004) {
      float t = -ro.y / rd.y;
      vec3 q = ro + rd * t;
      vec2 id0 = floor(q.xz / cell);
      for (int dz = -2; dz <= 1; dz++) for (int dx = -1; dx <= 1; dx++) {
        vec2 id = id0 + vec2(float(dx), float(dz));
        vec2 c = (id + 0.5) * cell;
        vec3 v = vec3(c.x, 0.0, c.y) - ro;
        float depth = dot(v, fw);
        if (depth < 0.15) continue;
        if (abs(p.x - f * dot(v, rt) / depth) > f * cell * 0.82 / depth + px) continue; // not this column: waves only move dots up and down
        float ringH, ringC;
        float h = sea(c, ringH, ringC);
        vec4 m = piece(vec2(c.x / wide + 0.5, 1.0 - (c.y - 0.1) / deep));
        float loud = sat(m.a * (0.65 + 0.6 * uEnergy)); loud *= smoothstep(0.0, 0.07, loud);
        float h1 = hash21(id), h2 = hash21(id + 17.0);
        h += loud * 0.5 * sin(uTime * (1.2 + h1) + h2 * TAU);        // sounding dots bob on their own
        v.y += h * 0.034 * min(1.0, 1.3 / depth);                    // far waves are drawn lower so that dots keep to their rows
        vec2 sp = f * vec2(dot(v, rt), dot(v, up)) / depth;
        float crest = sat(h * 0.6);
        float rr = 0.13 + 0.33 * sqrt(loud) + 0.2 * crest + 0.1 * sat(abs(ringH) + abs(ringC));
        float rs = f * cell * rr / depth;
        float d = length(p - sp) - rs;
        float cover = smoothstep(px, -px, d) * min(1.0, rs * rs / (px * px));
        vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.15 : vec3(0.4, 0.5, 0.65);
        vec3 lit = vec3(0.3, 0.42, 0.6) * (0.035 + 0.2 * crest);    // the bare sea under the night
        lit += hue * loud * (0.5 + 1.2 * loud) * (0.7 + 0.6 * crest);
        // the light's path on the water: dots between us and it glint, most on the crests
        float path = exp(-pow((sp.x - lp.x) / (0.035 + 0.3 * (hy - sp.y)), 2.0));
        lit += lightCol * path * (0.12 + 0.9 * crest * crest + 0.45 * (0.5 + 0.5 * sin(uTime * (1.0 + 2.0 * h1) + h2 * 40.0)));
        lit += uKind[4] * 1.5 * sat(ringH) + vec3(1.0, 0.85, 0.6) * 1.0 * sat(ringC);
        float fog = exp(-depth * 0.3);
        col += lit * fog * cover;
        col += (hue * loud * loud * 0.5 + uKind[4] * sat(ringH) + vec3(1.0, 0.85, 0.6) * 0.8 * sat(ringC)) * fog * exp(-max(d, 0.0) / max(rs, px) * 2.2) * 0.2 * min(1.0, rs * rs / (px * px));
      }
    }
    return screenOf(col * 1.25);
  }
  // b: straight down on a pond; the piece lies on its bed as dots, and rain falls where it sounds
  RH = 0.05 + 0.5 * -log(max(k, 0.03));
  RC = 0.05 + 0.8 * -log(max(uCue, 0.03));
  float asp = uRes.x / uRes.y;
  hitAt = vec2((uLoop - 0.5) * asp, 0.2);
  cueAt = vec2(0.12 * asp, 0.1);
  vec2 grad; vec3 tint;
  float h0 = pond(p, grad, tint);
  float rows = 38.0;
  vec2 g = (p - grad * 0.00028) * rows;                              // the water bends what lies under it
  vec2 id = floor(g) + 0.5, fr = g - id;
  vec2 qc = id / rows;
  vec4 m = piece(pondUV(qc));
  float loud = sat(m.a * (0.65 + 0.6 * uEnergy)); loud *= smoothstep(0.0, 0.07, loud);
  vec2 gc; vec3 tc;
  float hc = pond(qc, gc, tc);
  float crest = sat(hc * 1.2), trough = sat(-hc * 1.2);
  float r = min(0.1 + 0.4 * sqrt(loud) + 0.3 * crest - 0.06 * trough, 0.56);
  float edge = rows * px * 1.1;
  float d = length(fr) - r;
  float cover = smoothstep(edge, -edge, d);
  vec3 hue = m.a > 0.004 ? pow(m.rgb / m.a, vec3(1.3)) * 1.15 : vec3(0.4, 0.5, 0.65);
  vec3 ringHue = tc / max(max(tc.r, max(tc.g, tc.b)), 1e-3);
  // a lamp low at the upper left: slopes that face it shine, slopes that turn away go dark
  float slope = dot(gc, normalize(vec2(-0.7, 0.7))) * 0.02;
  vec3 lit = vec3(0.3, 0.42, 0.6) * 0.06 + hue * loud * (0.45 + 1.1 * loud);
  lit *= (1.0 + 1.4 * crest - 0.65 * trough) * (1.0 + clamp(-slope, -0.5, 1.2));
  lit += ringHue * (crest * 0.8 + sat(-slope) * 0.6);
  lit += vec3(1.0, 0.96, 0.9) * pow(sat(-slope * 1.1), 3.0) * 0.9 * pow(sat(1.0 - length(fr / max(r, 0.01) - vec2(-0.3, 0.3)) * 1.3), 2.0);
  col = lit * cover;
  col += (hue * loud * loud * 0.4 + ringHue * crest * 0.5) * exp(-max(d, 0.0) * 6.0) * (1.0 - cover) * 0.5;
  return screenOf(col * 1.3);
}
