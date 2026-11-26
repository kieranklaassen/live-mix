// name: Rose window
// a: Rose
// b: Tall lights
// what: A great round window of coloured glass seen from the aisle, deep in carved stone and half behind a dark pier, hundreds of small pieces held in lead with daylight moving behind; or five tall lights in the end wall of a dark room, their colours thrown long and soft across the floor and up the side wall.
// follows: Each kind of sound lights its petals, or its tall light; low to high the bands glow from the middle out, or from the sill up; each piece brightens with its own place in the piece. A hit runs out along one petal, or down one light; a cue lets the full sun through one wedge, or one light. The sun shifts with the loop; keys and voice light the roundels' eyes.
// A soft step that may also run downward.
float rwStep(float a, float b, float x) { x = sat((x - a) / (b - a)); return x * x * (3.0 - 2.0 * x); }
const float rwSa = TAU / 10.0; // one petal of the rose
float rwKindAt[5], rwGain;     // how loud each kind is (the hit apart), how strongly the glass answers
vec3 rwPot[5];                 // each kind's colour as glass
// The piece at hand: how far in from its lead, its number, place and colour.
float rwLead, rwId; vec2 rwSite; vec3 rwTint;

const vec3 rwBlue = vec3(0.012, 0.055, 0.42), rwRuby = vec3(0.46, 0.008, 0.02), rwHorn = vec3(0.66, 0.66, 0.5), rwGold = vec3(0.72, 0.33, 0.03), rwCool = vec3(0.0064, 0.0056, 0.0054);

void rwSetUp() {
  rwKindAt = float[5](uDrone, uPad, uTexture, uPhrase, 0.0);
  for (int k = 0; k < 5; k++) {
    vec3 c = uKind[k]; c /= max(max(c.r, max(c.g, c.b)), 0.05); c *= c * c;
    rwPot[k] = c * 0.42 / (0.4 + 0.75 * dot(c, vec3(0.3, 0.5, 0.2)));
  }
  rwGain = 0.6 + 0.9 * uEnergy;
}
// Glass cut freely: how far in from the lead, and its middle.
void rwCut(vec2 p, float sc) {
  vec2 q = p * sc, g = floor(q - 0.5), f = q - g, b1 = vec2(0.0), b2 = vec2(9.0);
  float d1 = 9.0, d2 = 9.0;
  for (int j = 0; j < 4; j++) {
    vec2 o = vec2(j & 1, j >> 1), c = o + 0.5 + 0.62 * (hash22(g + o) - 0.5) - f;
    float d = dot(c, c);
    if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = c; } else if (d < d2) { d2 = d; b2 = c; }
  }
  rwLead = (d2 - d1) / (2.0 * max(length(b2 - b1), 0.05)) / sc;
  rwSite = (q + b1) / sc;
  rwId = hash21(floor(q + b1) + 3.7);
}
// A roundel: an eye (0), n pieces about it (1), a ring of pearls (2).
float rwRoundel(vec2 l, float big, float n, float seed) {
  float r = length(l) / big, ring = step(0.32, r) + step(0.82, r);
  float s = TAU / (ring > 1.5 ? 3.0 * n : n), a = atan(l.y, l.x + 1e-5) + seed, i = floor(a / s), f = a - (i + 0.5) * s;
  rwLead = min(min(abs(r - 0.32), abs(r - 0.82)), 1.0 - r) * big;
  if (ring > 0.5) rwLead = min(rwLead, r * big * sin(0.5 * s - abs(f)));
  rwId = fract(hash11(seed + ring * (i + 2.3)) * 7.3);
  return ring;
}
vec3 rwParts(float ring, vec3 eye, vec3 body) { return ring < 0.5 ? eye : ring > 1.5 ? rwHorn * 0.5 : body; }
float rwTurned(float lv) { return 0.9 * rwStep(0.0, 0.2, lv - rwId); } // pieces that have taken their kind's colour
// What is in the glass: streaks, seeds, thick and thin, dirt along the lead.
vec3 rwPotMetal(vec2 p, float px) {
  vec2 u = rot(rwId * 40.0) * p;
  float st = noise(u * vec2(130.0, 17.0) + rwId * 50.0), wd = noise(u * vec2(34.0, 26.0) + rwId * 20.0);
  u *= vec2(85.0, 60.0); float sh = hash21(floor(u) + rwId), own = fract(rwId * 13.7);
  float seed = rwStep(0.3, 0.12, length(fract(u) - 0.35 - 0.3 * vec2(sh, fract(sh * 37.0)))) * step(0.8, sh) * sat(1.6 - px * 400.0);
  vec3 c = pow(rwTint + 0.004, vec3(1.4 - 0.7 * wd - 0.5 * st + 0.5 * rwId)) * (0.4 + 1.25 * own * own) * (1.0 + 0.5 * seed);
  c = mix(c, c.grb, 0.16 * fract(rwId * 31.0));
  return c * mix(0.3, 1.0, rwStep(0.0, 0.012, rwLead + 0.004 * (wd - 0.5)));
}

// ---- a: the rose ----
// The openings: how far outside the nearest, and which (0 eye, 1 petal, 2 between petals, 3 outer rounds, 4 rim).
vec2 rwPolar(vec2 ra, float n, float off) { float s = TAU / n, a = mod(ra.y + off + 0.5 * s, s) - 0.5 * s; return ra.x * vec2(cos(a), sin(a)); }
vec2 rwOpen(vec2 p) {
  float r = length(p); vec2 ra = vec2(r, atan(p.y, p.x + 1e-5));
  if (r < 0.215) { vec2 e = rwPolar(ra, 5.0, 0.3); return vec2(min(length(e - vec2(0.108, 0.0)) - 0.068, r - 0.095), 0.0); }
  if (r < 0.714) {
    vec2 q = rwPolar(ra, 10.0, 0.0); q.y = abs(q.y);
    float side = q.x * sin(0.5 * rwSa) - q.y * cos(0.5 * rwSa);
    float pet = max(max(0.014 - side, 0.232 - r), q.x - 0.5);
    pet = min(pet, min(length(q - vec2(0.562, 0.0)) - 0.094, length(q - vec2(0.495, 0.06)) - 0.084));
    vec2 s = rwPolar(ra, 10.0, 0.5 * rwSa);
    float sp = length(s - vec2(0.645, 0.0)) - 0.059;
    return sp < pet ? vec2(sp, 2.0) : vec2(pet, 1.0);
  }
  vec2 o = rwPolar(ra, 20.0, 0.25 * rwSa);
  o = abs(o - vec2(0.838, 0.0)); if (o.y > o.x) o = o.yx;
  float ro = min(length(o - vec2(0.056, 0.0)) - 0.058, length(o) - 0.07);
  vec2 t = rwPolar(ra, 20.0, 0.0);
  float ti = length(t - vec2(0.96, 0.0)) - 0.03;
  return ti < ro ? vec2(ti, 4.0) : vec2(ro, 3.0);
}
// The sun at a place behind the glass, and the sky about it.
float rwDay(vec2 p, vec2 sun, float tight) {
  sun = p - sun;
  return 0.38 + 0.38 * noise(p * 1.2 + vec2(uTime * 0.013, 3.0)) + 0.1 * p.y + (0.6 + 1.2 * uLevel) * exp(-dot(sun, sun) * tight);
}
float rwRoseDay(vec2 p) { return 1.1 * rwDay(p, vec2(0.25 + 0.3 * sin(TAU * uLoop), 0.12 + 0.2 * cos(TAU * uLoop)), 4.0); }
// How loud kind k is; far is how near a hit has come, along its one petal or light.
float rwLoud(int k, bool hit, float far) {
  return hit ? uHits * (1.5 * exp(-far * far * 14.0) + 0.5) : rwKindAt[k];
}
float rwPetal(int k, float r) { return rwLoud(k % 5, k == 9, r - 1.15 * (1.0 - uHits)); }
float rwWedge(float a) { float d = abs(mod(a + 2.1 - 0.25 * uCue + PI, TAU) - PI); return uCue * rwStep(0.62, 0.3, d); }
// Lead between the pieces, iron between the panels.
vec3 rwLeaded(vec3 g, float iron, float px) {
  float lead = max(rwStep(0.0021 + px * 0.8, 0.0021 - px * 0.8, rwLead), rwStep(0.0045 + px, 0.0045 - px, iron));
  return mix(g, g * 0.07 + 0.002, lead);
}
// How bright a piece is: its kind, its band, its own place; the eyes also by keys and voice.
float rwLit(float lv, float bandAt, float own, float eye) {
  return 0.55 + rwGain * (1.5 * lv * (0.45 + 0.8 * rwId) + 0.9 * band(bandAt) * (0.3 + fract(rwId * 3.0)) + own * (0.4 + fract(rwId * 5.3))) + 1.6 * (uKeys + uMic) * step(eye, 0.5);
}
vec3 rwRoseGlass(vec2 p, float px) {
  vec2 o = rwOpen(p), ra = vec2(length(p), atan(p.y, p.x + 1e-5));
  float d = -o.x, r = ra.x, petal = mod(floor(ra.y / rwSa + 0.5) + 10.0, 10.0), odd = mod(floor(o.y < 0.5 ? ra.y * 8.0 / TAU : ra.y / (0.5 * rwSa) + 1.0), 2.0), ring = 1.0, lr;
  int kind = int(petal) % 5, w = int(o.y);
  vec3 own = rwPot[kind], body = mix(rwRuby, rwBlue * 1.3, odd), eye = rwGold;
  rwSite = p;
  // a roundel in the opening (its place, its size), or free pieces about it
  vec2 m = w == 0 ? vec2(0.0, 0.09) : w == 2 ? vec2(0.645, 0.06) : w == 3 ? vec2(0.838, 0.06) : w == 4 ? vec2(0.96, 0.09) : r > 0.489 ? vec2(0.556, 0.066) : r > 0.387 ? vec2(0.438, 0.051) : vec2(0.346, 0.04);
  vec2 l = w == 0 ? p : rwPolar(ra, w > 2 ? 20.0 : 10.0, w == 3 ? 0.25 * rwSa : w == 2 ? 0.5 * rwSa : 0.0) - vec2(m.x, 0.0);
  if (w == 1) body = mix(rwRuby, own, step(0.5, fract(petal * 0.5 + m.x * 5.0)));
  if (w == 3) eye = mix(own, rwGold, 0.5);
  lr = length(l);
  if (lr < m.y) { ring = rwRoundel(l, m.y, 8.0, float(w > 0) * petal + m.x * 10.0); rwTint = rwParts(ring, eye, body); if (w == 1) rwSite = m.x * vec2(cos(petal * rwSa), sin(petal * rwSa)); if (w == 0) { petal = 0.0; if (ring < 0.5) rwSite = vec2(0.02, 0.0); else petal = mod(floor(floor(ra.y * 8.0 / TAU) * 1.25 + 11.1), 10.0); } }
  else {
    rwCut(p, 32.0); rwLead = min(rwLead, lr - m.y);
    rwTint = mix(mix(w == 3 ? mix(rwBlue * 1.2, rwRuby, odd) : rwBlue, own * 0.8, rwTurned(0.06 + 0.8 * rwKindAt[kind])), rwRuby, step(0.86, fract(rwId * 9.0)));
  }
  if (d < 0.011) { rwId = 0.5; rwTint = rwBlue * 0.6; rwLead = min(d, 0.011 - d); }
  else rwLead = min(rwLead, d - 0.011);
  rwLead = max(rwLead, 0.0);
  r = length(rwSite); float a = atan(rwSite.y, rwSite.x + 1e-5);
  vec4 s = piece(vec2(fract(a / TAU + 0.45), 0.08 + 0.84 * sat(r)));
  vec3 g = rwPotMetal(p, px) * (rwLit(rwPetal(int(petal), r), r * 0.95, s.a, ring) + 3.2 * rwWedge(a)) * rwRoseDay(p) + 0.1 * s.rgb * rwGain * rwTint;
  return rwLeaded(g, w == 1 ? min(abs(ra.x - 0.392), abs(ra.x - 0.494)) : 1.0, px);
}
// What glass of kind i throws on stone.
vec3 rwNear(int i, float lv) { return mix(rwBlue * 0.5, rwPot[i], 0.45) * (0.3 + rwGain * lv); }
vec3 rwHalo(float a) { // the rose, by the angle
  float f = mod(a / rwSa + 10.0, 10.0); int i = int(f) % 10, j = (i + 1) % 10;
  vec3 h = mix(rwNear(i % 5, rwPetal(i, 0.9)), rwNear(j % 5, rwPetal(j, 0.9)), rwStep(0.0, 1.0, fract(f)));
  h = mix(h, dot(h, vec3(0.3, 0.5, 0.2)) * vec3(0.75, 0.85, 1.35), 0.4);
  return (h + vec3(0.8, 0.5, 0.2) * rwWedge(a)) * (0.5 + 0.5 * uLevel);
}
vec3 rwSight(float yaw, float f, vec2 p) { float c = cos(yaw), n = sin(yaw); return vec3(n * f + c * p.x, p.y, n * p.x - c * f); }
float rwStone(vec2 p) { return 0.72 + 0.35 * noise(p * 9.0) + 0.22 * (noise(p * 47.0) - 0.5); }
// A wall or floor laid in courses: blocks a little different, thin joints.
float rwCourse(vec2 p, vec2 sc, float wide) {
  vec2 b = p * sc + 0.2; float row = floor(b.y); b.x += 0.5 * mod(row, 2.0) + 0.3 * hash11(row);
  vec2 f = min(fract(b), 1.0 - fract(b)) / sc;
  return rwStone(p) * (0.75 + 0.5 * hash21(floor(b) + 3.0)) * (1.0 - 0.6 * sat(0.02 / (wide + 0.004)) * rwStep(0.004 + wide, 0.001, min(f.x, f.y)));
}
vec3 rwRose(vec2 p) {
  // the wall is z = 0, the rose one unit about its middle, the eye low and to the left
  vec3 eye = vec3(-2.2, -1.5, 2.6);
  vec3 dir = rwSight(0.702, 2.25, p + vec2(-0.13, 0.713));
  vec2 sl = dir.xy / -dir.z; // sideways for each step into the wall
  vec2 p0 = eye.xy + sl * (eye.z - 0.2); // where the sight meets the wall
  float px = 1.25 / uRes.y * eye.z / -dir.z;
  vec3 col = vec3(0.0);
  vec2 fill = normalize(vec2(-0.8, 0.5)); // a little light from the far side
  vec2 q = p0 + 0.2 * sl;
  vec3 halo = rwHalo(atan(q.y, q.x + 1e-5));
  vec3 cool = rwCool * (0.8 + 0.5 * uLevel);
  // steps of stone going in to the window
  float R[3] = float[3](1.2, 1.12, 1.045), Z[4] = float[4](0.0, 0.07, 0.13, 0.2);
  int hit = -1; bool face = false;
  for (int i = 0; i < 3; i++) {
    q = p0 + sl * Z[i];
    if (length(q) > R[i]) { hit = i; face = true; break; }
    vec2 n = p0 + sl * Z[i + 1];
    if (length(n) > R[i]) { hit = i; q = n; break; }
  }
  if (hit == 0 && face) {
    float e = length(q) - 1.2, st = rwCourse(q, vec2(2.2, 4.4), px);
    col = st * (cool * (0.5 - 0.2 * q.x) * (0.4 + exp(-e * 1.2)) + 0.045 * halo * exp(-e * 3.5));
  } else if (hit >= 0) {
    float r = length(q);
    if (face) {
      float f = sat((R[hit - 1] - r) / (R[hit - 1] - R[hit])), tilt = 2.0 * f - 1.0; // a roll moulding on each step
      col = rwStone(q) * (cool * (0.8 + 1.6 * max(dot(q, fill) * -tilt, 0.0)) + halo * (0.015 + 0.12 * rwStep(0.1, 1.0, tilt) * float(hit)));
      col *= 0.35 + 0.65 * rwStep(0.0, 0.25, f);
    } else {
      r = float(hit + 1) / 3.0;
      col = rwStone(q * vec2(1.0, 3.0)) * halo * (0.06 + 0.3 * r * r) + cool * 0.4;
    }
  } else {
    // the tracery, and the glass at the back of it
    q = p0 + sl * 0.2;
    vec2 o = rwOpen(q);
    const float deep = 0.05; float ll = length(sl);
    float edge = rwStep(-px, px, o.x);
    if (edge < 1.0) {
      // the side of the opening, or the glass
      float t = 0.0, a = o.x; bool side = false;
      for (int i = 0; i < 6; i++) { t += max(-a, 0.002) / ll; if (t > deep) break; a = rwOpen(q + sl * t).x; if (a > -0.001) { side = true; break; } }
      float back = rwOpen(q + sl * deep).x, stone = side && (back < -px || t < 0.8 * deep) ? 1.0 : rwStep(-px, px, back);
      t = min(t, deep);
      vec2 h = q + sl * t;
      col = rwRoseGlass(stone > 0.5 ? h - sl / ll * 0.03 : q + sl * deep, px);
      t /= deep;
      if (stone > 0.0) col = mix(col, rwStone(h * 3.0) * (cool * 0.5 + (0.6 * halo + 0.25 * col) * (0.15 + 0.85 * t * t)), stone);
    }
    if (edge > 0.0) {
      float ch = rwStep(0.022, 0.0, o.x) * sat((o.x - rwOpen(q + 0.004 * fill).x) / 0.004);
      col = mix(col, rwStone(q * 2.0) * (cool * (0.55 + 2.2 * ch) + halo * (0.015 + 0.11 * exp(-max(o.x, 0.0) * 70.0) * rwStep(0.0, 0.03, abs(length(q) - 0.714)))), edge);
    }
  }
  // the pier in front: a bundle of shafts, dark, its edges taking colour
  float x = p.x + 0.23, pw = 1.2 / uRes.y, rg = rwStep(0.016, 0.008, abs(p.y + 0.3));
  if (abs(x) < 0.13) {
    float best = -1.0, nx = 0.0, ax = abs(x), cover = rwStep(0.09 + pw, 0.09 - pw, ax);
    for (int k = 0; k < 3; k++) {
      float C = 0.044 * float(k), w = (k == 0 ? 0.044 : k == 1 ? 0.026 : 0.021) + 0.007 * rg, dx = (ax - C) / w, z = w * sqrt(max(1.0 - dx * dx, 0.0)) - C * 0.35;
      if (abs(dx) < 1.0 && z > best) { best = z; nx = dx * sign(x); }
      cover = max(cover, rwStep(w + pw, w - pw, ax - C));
    }
    float rim = rwStep(0.35, 1.0, abs(nx)) * step(0.0, nx * x + 0.0008) * sat(ax / 0.1), joint = (0.5 - abs(fract(p.y * 4.3 + 0.1) - 0.5)) / 4.3;
    float st = rwStone(vec2(x * 6.0 + nx, p.y * 6.0)) * (1.0 - 0.4 * rwStep(0.003, 0.001, joint));
    vec3 pc = st * (cool * (0.25 + 1.1 * sat(-nx * 0.8 + 0.25)) + halo * rim * rim * 0.9 * exp(-max(length(p0) - 1.0, 0.0) * 2.0));
    col = mix(col, pc, cover);
  }
  // light hanging in the air before the glass
  col += halo * (0.015 + 0.03 * uSpace) * rwRoseDay(p0) * exp(-max(length(p0) - 0.7, 0.0) * 2.2);
  return col;
}

// ---- b: five tall lights ----
const float twHalf = 0.165, twSill = 0.5;
float twSpring(float i) { return 2.3 + 0.17 * (2.0 - abs(i - 2.0)); }
// How far outside the nearest light's opening, less than 0 inside.
float twOpen(vec2 p, float i) {
  float x = abs(p.x - (i - 2.0) * 0.5), y = p.y - twSpring(i);
  return max(y > 0.0 ? length(vec2(x + twHalf, y)) - 2.0 * twHalf : x - twHalf, twSill - p.y);
}
float twOf(float x) { return clamp(floor(x / 0.5 + 2.5), 0.0, 4.0); }
float twLoud(int k, float y) { return rwLoud(k, k == 4, 0.4 * (y - twSill) - uHits); }
float twCue(float x) { float d = (x + 0.5) * 2.2; return 3.6 * uCue * exp(-d * d * d * d); }
const float twPanel = 0.31; // from one iron bar to the next
// Which light p is in, how loud, lozenge or roundel, how far from the iron, its colours.
float twI, twLv, twOdd, twLoz, twBar; vec2 twL; vec3 twOwn, twRound;
void twPlace(vec2 p) {
  twI = twOf(p.x); int k = int(twI); twLv = twLoud(k, p.y); twOwn = rwPot[k];
  float v = (p.y - twSill) / twPanel, j = floor(v); v -= j + 0.5;
  twL = vec2(p.x - (twI - 2.0) * 0.5, v * twPanel); twOdd = mod(twI + j, 2.0);
  twLoz = (1.0 - abs(twL.x) / 0.115 - abs(twL.y) / 0.15) * 0.09; twBar = (0.5 - abs(v)) * twPanel;
  twRound = mix(rwRuby, twOwn, mod(j, 4.0) < 2.0 ? 1.0 : 0.8 * rwStep(0.1, 0.8, twLv));
}
vec3 twLit(vec2 p, float eye) {
  float m = piece(vec2(sat(0.02 + 0.4 * (p.y - twSill)), 0.1 + 0.2 * twI)).a;
  return vec3(rwLit(twLv, (p.y - twSill) / 2.4, m, eye) + twCue(p.x)) * rwDay(p, vec2(-0.35, 1.9), 1.1);
}
// One light: roundels and lozenges by turns on pale quarries.
vec3 twGlass(vec2 p, float px) {
  twPlace(p);
  float d = -twOpen(p, twI), in_ = 1.0, r = 0.118 - length(twL);
  if (d < 0.016) { rwId = 0.6; rwTint = rwHorn * 0.5; rwLead = min(d, 0.016 - d); }
  else if (twOdd < 0.5 && r > 0.0) { in_ = rwRoundel(twL, 0.118, 8.0, twI * 9.0 + floor(p.y / twPanel)); rwTint = rwParts(in_, rwGold, twRound); }
  else if (twOdd > 0.5 && twLoz > 0.0) {
    rwCut(p, 30.0); rwLead = min(rwLead, twLoz);
    rwTint = mix(mix(rwBlue, twOwn, rwTurned(0.1 + 0.9 * twLv)), rwRuby, step(0.8, fract(rwId * 9.0)));
  } else {
    // pale quarries, set corner up
    vec2 q = vec2(twL.x * 1.25 + p.y, p.y - twL.x * 1.25) * 15.0, f = 0.5 - abs(fract(q) - 0.5);
    rwId = hash21(floor(q) + twI * 13.0); rwLead = min(min(f.x, f.y) / 24.0, twOdd < 0.5 ? -r : -twLoz);
    rwTint = mix(mix(rwHorn * vec3(0.3, 0.36, 0.34), rwBlue * 0.9, step(0.72, rwId)), twOwn * 0.8, 0.85 * rwStep(0.0, 0.3, 0.75 * twLv - fract(rwId * 5.0)));
  }
  if (d >= 0.016) rwLead = min(rwLead, d - 0.016);
  rwLead = max(rwLead, 0.0);
  return rwLeaded(rwPotMetal(p, px) * twLit(p, in_), twBar, px);
}
// The same light as it falls on stone, out of focus by b.
vec3 twThrown(vec2 p, float b) {
  float m = rwStep(b, -b, twOpen(p, twOf(p.x)));
  if (m <= 0.0) return vec3(0.0);
  twPlace(p);
  float n = noise(p * 13.0), n2 = noise(p * 29.0);
  vec3 c = mix(mix(rwHorn * vec3(0.3, 0.36, 0.34), rwBlue, 0.2 + 0.5 * n2), twOwn * 0.7, 0.15 + 0.5 * twLv);
  if (twOdd < 0.5) {
    float r = length(twL);
    c = mix(mix(c, twRound, rwStep(0.118 + b, 0.118 - b, r)), rwGold, rwStep(0.04 + b, 0.04 - b, r));
    r = (r - 0.118) / b; c *= 1.0 - 0.45 * exp(-r * r);
  } else c = mix(c, mix(mix(rwBlue, rwRuby, rwStep(0.35, 0.75, n)), twOwn, 0.1 + 0.7 * twLv), rwStep(-b, b, twLoz));
  rwId = 0.5;
  return c * m * (0.6 + 0.8 * n2) * (1.0 - 0.5 * rwStep(0.008 + b, 0.0, twBar)) * twLit(p, 1.0);
}
vec3 twGlow(float x) { // the lights near this x, for the stone about them
  float f = clamp(x * 2.0 + 2.0, 0.0, 4.0); int i = int(min(f, 3.0));
  return mix(rwNear(i, twLoud(i, 1.5)), rwNear(i + 1, twLoud(i + 1, 1.5)), f - float(i)) * exp(-max(abs(x) - 1.1, 0.0) * 1.5) + 0.06 * twCue(x);
}
vec3 twRoom(vec2 p) {
  vec2 sun = vec2(0.36 + 0.035 * sin(TAU * uLoop) + 0.06 * sin(uTime * 0.021), -0.62 - 0.025 * cos(TAU * uLoop));
  vec3 eye = vec3(0.95, 1.15, 5.0);
  vec3 dir = rwSight(0.1, 1.17, p - vec2(0.2, 0.06));
  vec3 cool = rwCool * (0.8 + 0.5 * uLevel);
  const float side = 2.15, front = 0.15;
  float tw = dir.z < -0.001 ? (front - eye.z) / dir.z : 1e4;
  float tf = dir.y < -0.001 ? -eye.y / dir.y : 1e4;
  float ts = dir.x > 0.001 ? (side - eye.x) / dir.x : 1e4;
  float t = min(tw, min(tf, ts));
  vec3 x = eye + dir * t, col;
  float px = 1.25 / uRes.y * eye.z / max(-dir.z, 0.2);
  if (t == tw) {
    float i = twOf(x.x), o = twOpen(x.xy, i) - 0.062;
    vec2 sl = dir.xy / -dir.z * front;
    if (o < 0.0) {
      vec2 h = x.xy + sl; float g = twOpen(h, i);
      if (g < 0.0) col = twGlass(h, px);
      else col = rwStone(h * 3.0) * (cool + twGlow(x.x) * 0.35 * exp(-g * 24.0)); // the splayed stone about each light
      col *= 0.5 + 0.5 * rwStep(0.0, 0.012, -o);
    } else {
      float roll = rwStep(0.03, 0.018, abs(o - 0.03)), st = rwCourse(x.xy, vec2(1.5, 3.1), px);
      col = st * (cool * (0.25 + 0.8 * roll + exp(-o * 1.6)) + (0.035 * exp(-o * 5.0) + 0.02 * roll) * twGlow(x.x));
    }
  } else {
    bool flr = t == tf;
    float foot = t * 1.2 / uRes.y / max(flr ? -dir.y : dir.x, 0.1);
    float st = flr ? rwCourse(x.xz, vec2(1.25), foot) : rwCourse(x.zy, vec2(1.5, 3.1), foot);
    vec3 th = twThrown(x.xy - sun * x.z, 0.007 + 0.011 * x.z);
    col = st * (cool * exp(-x.z * 0.2 - x.y * 0.7) + th * (0.07 + 0.5 * th) * (flr ? 0.85 : 0.65) * (0.5 + 0.5 * uLevel) + twGlow(x.x) * 0.03 * exp(-x.z * 0.5));
    col *= 1.0 - 0.6 * rwStep(0.1, 0.0, flr ? min(x.z - front, side - x.x) : min(x.y, x.z - front));
  }
  // dusty air: how far the sight goes through each beam
  vec2 w0 = eye.xy - sun * eye.z, w1 = dir.xy - sun * dir.z;
  w1 += step(abs(w1), vec2(1e-3)) * 3e-3;
  vec2 ty = (vec2(twSill, 2.6) - w0.y) / w1.y;
  for (int k = 0; k < 5; k++) {
    vec2 tx = (vec2(-twHalf, twHalf) + (float(k) - 2.0) * 0.5 - w0.x) / w1.x;
    float l = max(min(min(max(tx.x, tx.y), max(ty.x, ty.y)), t) - max(max(min(tx.x, tx.y), min(ty.x, ty.y)), 0.0), 0.0);
    col += mix(vec3(0.1, 0.13, 0.2), rwPot[k], 0.5) * l * l / (l + 0.6) * (0.25 + rwGain * twLoud(k, 1.5) + twCue(0.5 * float(k) - 1.0)) * (0.008 + 0.02 * uSpace) * (0.4 + uLevel);
  }
  return col;
}
vec3 render(vec2 p) {
  rwSetUp();
  vec3 c = uVar < 0.5 ? rwRose(p) : twRoom(p);
  c = min(screenOf(c * (2.3 + 0.8 * uTone)), 1.0);
  return mix(c, c * c * (3.0 - 2.0 * c), 0.65);
}
