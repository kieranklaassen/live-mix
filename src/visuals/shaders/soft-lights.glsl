// name: Soft lights
// a: Frosted glass
// b: Cut gels
// what: A few great soft lights drifting behind a pane of frosted glass, some close against it and some far back, melting into one another where they cross; or the same lights as sharp cut discs and half discs of coloured gel, each filled with a gradient and laid one over another with soft shadows between.
// follows: One light for each kind of sound, as large and bright as that sound is loud; a hit sends a ring of brightness out through the red one and a cue a wider ring through the violet; the gels grow, turn and slide with the same sounds.

float meLv[5];
const float meDepth[5] = float[5](0.8, 0.55, 0.32, 0.1, 0.45); // how far behind the glass each light hangs
// A kind's colour made pure, then turned toward a neighbouring hue: warm is 1 for its lighter neighbour (teal to
// sea green, amber to yellow, violet to pink), -1 for its deeper one (teal to blue, amber to red, violet to indigo).
vec3 meHue(int k, float warm) {
  vec3 c = uKind[k];
  c = max(mix(vec3(dot(c, vec3(0.3333))), c, 1.9), 0.0);
  float way = (k == 0 || k == 3) ? -1.0 : (k == 4 ? 0.45 : 1.0);
  if (k == 4) c *= vec3(1.0, 0.55, 0.8); // the hit is a rose red, not an orange
  return max(hueShift(c, way * warm * 0.05), 0.0);
}
// Where a light is: each wanders slowly on its own path. depth is how far behind the glass (0 against it, 1 far back).
vec2 meAt(int k, float depth) {
  float fk = float(k), t = uTime * 0.045 + uTravel * 0.012;
  vec2 home = vec2(-0.46 + 0.24 * fk + 0.1 * sin(fk * 2.4), 0.16 * sin(fk * 1.9 + 0.6) - 0.02);
  vec2 wander = vec2(sin(t * (1.0 + 0.23 * fk) + fk * 2.1), cos(t * (0.8 + 0.17 * fk) + fk * 1.3)) * vec2(0.2, 0.12);
  vec2 sway = vec2(sin(uTime * 0.08), cos(uTime * 0.063)) * 0.07 * depth; // the eye moves: what is far slides more behind the pane
  return home + wander + sway;
}
vec3 meFrosted(vec2 p) {
  // the frost: every point of the pane throws the light a little aside, and the pane itself is not quite flat
  vec2 px = gl_FragCoord.xy;
  vec2 scatter = (vec2(hash21(px), hash21(px + 71.3)) - 0.5);
  vec2 wave = vec2(noise(p * 7.0 + 3.0), noise(p * 7.0 + 19.0)) - 0.5;
  vec2 ripple = vec2(noise(p * 19.0 + 40.0), noise(p * 19.0 + 71.0)) - 0.5; // the small unevenness of the glass
  vec3 col = vec3(0.0);
  for (int k = 0; k < 5; k++) {
    float depth = meDepth[k];
    float lv = meLv[k];
    vec2 c = meAt(k, depth);
    vec2 q = p + wave * 0.03 + ripple * 0.014 + scatter * (0.012 + 0.07 * depth) - c;
    q.x *= 0.82;
    float r = (0.1 + 0.2 * lv) * (0.8 + 0.8 * depth);
    float d = length(q) / r;
    float soft = mix(2.2, 1.0, depth); // close to the glass a light keeps an edge; far back it is all bloom
    float body = exp(-pow(d, 2.0 * soft));
    float bloom = exp(-d * d * 0.32);
    vec3 hot = meHue(k, 1.0), own = meHue(k, 0.0), deep = meHue(k, -2.0);
    vec3 light = mix(deep * 0.5, mix(own, hot + 0.06, body * body), body) * body + deep * bloom * 0.07;
    float power = 0.012 + 1.5 * lv * lv + 0.3 * lv;
    col += light * power;
    // a ring of brightness going out through a light
    float go = k == 4 ? uHits : (k == 1 ? uCue : 0.0);
    float ring = (1.0 - go) * (k == 4 ? 2.2 : 3.2);
    col += (hot + 0.15) * go * 1.0 * exp(-pow((d - ring) / 0.3, 2.0)) * smoothstep(0.0, 0.25, 1.0 - go);
  }
  // the face of the glass: a soft sheen across it, streaked where it was last wiped, and the dim shape of a window behind the eye
  float grainy = 0.7 + 0.6 * hash21(px * 0.7 + 3.0);
  vec2 arc = p - vec2(0.9, -1.3);
  float wiped = noise(vec2(length(arc) * 130.0, atan(arc.y, arc.x) * 5.0)) * 0.6 + 0.4 * noise(vec2(length(arc) * 41.0, atan(arc.y, arc.x) * 2.0 + 9.0));
  float sheen = exp(-pow((p.x * 0.6 + p.y + 0.12 + 0.06 * sin(uTime * 0.05) + wave.x * 0.12) / 0.17, 2.0));
  vec2 w = (p - vec2(-0.5 + 0.03 * sin(uTime * 0.08), 0.19)) * rot(-0.1) + wave * 0.05 + ripple * 0.02;
  float pane = smoothstep(0.17, 0.1, abs(w.x)) * smoothstep(0.2, 0.13, abs(w.y)) * (0.4 + 0.6 * smoothstep(0.0, 0.018, abs(w.x)) * smoothstep(0.0, 0.018, abs(w.y - 0.02)));
  col += vec3(0.55, 0.66, 0.82) * (0.05 * sheen + 0.035 * pane) * (0.35 + 1.3 * wiped * wiped) * grainy * (0.35 + uLevel);
  col *= 0.9 + 0.2 * hash21(px + 5.0); // frost takes a little, unevenly
  return col;
}

// One gel: a disc, or a half disc when cut is 1. Gives how much of it covers this point; rim is its cut edge.
float meGel(vec2 q, float r, float cut, float turn, float soft, out float rim, out float dd) {
  float d = length(q) - r;
  float h = dot(q, vec2(cos(turn), sin(turn))); // the straight cut
  dd = mix(d, max(d, -h), cut);
  float aa = 1.5 / uRes.y + soft;
  rim = smoothstep(0.007 + aa, 0.0, abs(dd + 0.003));
  return smoothstep(aa, -aa, dd);
}
vec3 meGels(vec2 p) {
  vec3 col = vec3(0.0);
  float t = uTime * 0.05 + uTravel * 0.015;
  // the lamp behind them all
  vec2 lamp = vec2(0.05 + 0.12 * sin(uTime * 0.04), 0.02 + 0.06 * cos(uTime * 0.05));
  float lit = 0.3 + 1.1 * exp(-dot(p - lamp, p - lamp) / 0.16);
  vec2 homes[5] = vec2[5](vec2(-0.36, -0.04), vec2(-0.06, 0.05), vec2(0.27, -0.1), vec2(0.1, 0.16), vec2(0.5, 0.12));
  float sizes[5] = float[5](0.4, 0.43, 0.33, 0.25, 0.22);
  for (int k = 0; k < 5; k++) {
    float fk = float(k), lv = meLv[k];
    vec2 c = homes[k] + vec2(sin(t * (0.9 + 0.2 * fk) + fk * 1.7), cos(t * (0.7 + 0.15 * fk) + fk * 0.9)) * vec2(0.1, 0.06);
    c += vec2(sin(uTime * 0.08), cos(uTime * 0.063)) * 0.012 * (fk - 2.0); // upper layers slide over lower as the eye moves
    float r = sizes[k] * (0.55 + 0.75 * lv);
    float cut = mod(fk, 2.0);
    float turn = fk * 2.3 + 0.6 + t * (cut > 0.5 ? 0.8 : 0.25);
    float rim, dd;
    // the shadow this gel lays on those under it
    float lift = 0.02 + 0.014 * fk;
    float shade = meGel(p - c - vec2(lift, -lift * 1.3), r, cut, turn, 0.022 + 0.012 * fk, rim, dd);
    col *= 1.0 - 0.78 * shade;
    float cover = meGel(p - c, r, cut, turn, 0.0012 * (4.0 - fk), rim, dd); // those furthest back are a touch softer
    // its fill: a gradient across it, from a hot side through its own colour down to the dark of the next hue
    vec2 g = vec2(cos(turn + 0.7), sin(turn + 0.7));
    float along = sat(0.5 + 0.5 * dot(p - c, g) / r);
    vec3 fill = mix(meHue(k, -1.6) * 0.03, meHue(k, -0.4) * 0.7, smoothstep(0.05, 0.75, along));
    fill = mix(fill, meHue(k, 1.0) * 1.2 + vec3(0.12, 0.09, 0.06), smoothstep(0.68, 1.0, along));
    float bright = (0.02 + 0.8 * lv * lv + 0.3 * lv) * lit;
    // a ring of brightness through the gel
    float go = k == 4 ? uHits : (k == 1 ? uCue : 0.0);
    float ring = (1.0 - go) * r * 1.25;
    float flash = go * exp(-pow((length(p - c) - ring) / (0.02 + 0.09 * r), 2.0));
    // what lies under is seen through this gel, taking its colour; the gel adds its own light
    vec3 tint = meHue(k, 0.0);
    tint /= max(max(tint.r, tint.g), max(tint.b, 0.2));
    vec3 under = col * mix(vec3(1.0), tint * 0.5 + 0.42, cover);
    col = under + (fill * bright + (meHue(k, 1.0) + 0.2) * flash * 0.8) * cover;
    col += (meHue(k, 1.0) + 0.15) * rim * cover * (0.03 + 0.2 * lv) * lit;
    col += meHue(k, 0.3) * bright * 0.16 * exp(-max(dd, 0.0) / 0.045) * (1.0 - cover); // light spilling past its edge
  }
  return col;
}
// To the screen with the weight of film: colours stay deep as they brighten, darks stay down.
vec3 meFilm(vec3 light) {
  vec3 c = screenOf(light);
  c = mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.35);
  c = sat(c);
  return mix(c, c * c * (3.0 - 2.0 * c), 0.55);
}
vec3 render(vec2 p) {
  meLv[0] = uDrone; meLv[1] = uPad; meLv[2] = uTexture; meLv[3] = uPhrase; meLv[4] = uHits;
  vec3 col = uVar > 0.5 ? meGels(p) : meFrosted(p);
  col *= 1.0 - 0.3 * dot(p, p);
  return meFilm(col);
}
