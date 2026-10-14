// name: Dusk
// a: Over water
// b: Ribbed glass
// what: The sky after sunset over still water: long soft bands of colour from a glow at the horizon up into blue-black, thin streaks of cloud lit from below, the last of the sun behind a far shore; or the sun still up, seen through ribbed glass that cuts the sky into slipped slices.
// follows: Each band is a kind of sound, as thick and bright as that sound is loud (texture lowest in amber, then the phrase in rose, the pads in violet, and the drone highest in deep teal); the low band swells the sun; a hit is a flare low along the horizon that lights the clouds from under; a cue sends a slow ring out from the sun.

float duLv[4];
vec3 duCol[4];
float duSunX, duSunE, duDisc;

float duStars(vec2 p) {
  vec2 g = p * 46.0, id = floor(g), f = fract(g) - 0.5;
  vec2 h = hash22(id);
  return pow(h.x, 18.0) * smoothstep(0.1, 0.0, length(f - (h - 0.5) * 0.7)) * (0.7 + 0.3 * sin(uTime * (0.6 + h.y) + h.y * 30.0));
}
// The bands of the sky at x across and e above the horizon, without cloud.
vec3 duAir(float x, float e) {
  float dx = x - duSunX;
  float ee = e + 0.06 * dx * dx; // the bands arch over the sun
  vec3 col = vec3(0.0);
  float c = 0.0, before = 0.0;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float w = 0.02 + (0.07 + 0.018 * fk) * duLv[k];
    c += (before + w) * 0.8;
    before = w;
    float d = (ee - c) / w;
    float side = exp(-dx * dx * (1.1 - 0.25 * fk)); // low bands keep close to where the sun went down
    // within a band the hue turns: warmer on its lower side, deeper on its upper
    vec3 hue = max(hueShift(duCol[k], -0.055 * clamp(d, -1.6, 1.6)), 0.0);
    col += hue * (exp(-d * d) + 0.22 * exp(-d * d * 0.2)) * (0.006 + 1.05 * duLv[k] * duLv[k] + 0.2 * duLv[k]) * side * exp(-c * 2.4);
  }
  // what is left of the day, low down, and the deep of the sky above
  col += vec3(0.55, 0.15, 0.04) * exp(-e / 0.03) * (0.04 + 0.22 * uLow) * exp(-dx * dx * 0.8);
  col += vec3(0.002, 0.005, 0.016) * smoothstep(0.7, 0.0, e) * (0.4 + 0.6 * uLevel);
  return col;
}
// The sun and the light round it.
vec3 duSun(float x, float e) {
  vec2 d = vec2((x - duSunX) * 0.62, e - duSunE);
  float r = 0.05 + 0.1 * uLow, dd = dot(d, d);
  vec3 col = vec3(1.0, 0.55, 0.16) * exp(-dd / (r * r)) * (0.35 + 2.2 * uLow);
  col += vec3(1.0, 0.2, 0.12) * exp(-sqrt(dd) / (r * 1.25)) * (0.06 + 0.5 * uLow);
  // the sun itself, when it is still up: hot above, red where it nears the water
  float disc = length(vec2(x - duSunX, e - duSunE));
  float R = 0.085 + 0.03 * uLow;
  col += mix(vec3(1.0, 0.16, 0.1), vec3(1.0, 0.82, 0.4), sat(0.5 + (e - duSunE) / (2.0 * R))) * smoothstep(R, R - 0.012, disc) * 1.6 * duDisc;
  // a cue: a slow ring going out from the sun
  float ring = 0.08 + 0.75 * (1.0 - uCue);
  col += vec3(1.0, 0.55, 0.35) * uCue * 0.6 * exp(-pow((disc - ring) / 0.035, 2.0)) * smoothstep(0.0, 0.05, 1.0 - uCue);
  return col;
}
// The whole view at a point of the screen: h is where the horizon lies.
vec3 duView(vec2 p, float h) {
  float x = p.x, e = p.y - h;
  float wet = step(e, 0.0);
  float d = abs(e);
  // still water: glass where no wind is, and long darker lanes that hold the sky a little higher up
  float pz = 1.0 / (d + 0.03);
  float lane = noise(vec2(x * 0.7 * pz * 0.2 + 3.0, pz * 1.9 + uTime * 0.03)) * 0.65 + 0.35 * noise(vec2(x * 2.0 * pz * 0.2, pz * 6.0 - uTime * 0.05));
  float glass = smoothstep(0.3, 0.66, lane);
  float up = mix(d, d * mix(1.7, 1.03, glass), wet);
  vec3 col = duAir(x, up) + duSun(x, up);
  // a hit: a flare low along the horizon
  float fx = 0.6 * sin(uTime * 0.13 + 1.0) - 0.1;
  float fd = x - fx;
  float flare = uHits * exp(-fd * fd / 0.09);
  float core = uHits * exp(-(fd * fd + up * up * 3.0) / 0.007);
  vec3 flareCol = mix(kindColour(4.0), vec3(1.0, 0.22, 0.12), 0.6);
  col += flareCol * flare * (1.3 * exp(-up / 0.035) + 0.3 * exp(-up / 0.12)) + (flareCol + vec3(0.5, 0.35, 0.2)) * core * 2.2;
  // thin cloud, a flat layer seen from under so it gathers into streaks toward the horizon
  float cz = 1.0 / (up + 0.045);
  vec2 cq = vec2(x * cz * 0.42 + uTime * 0.006, cz * 0.62);
  float cl = fbm(cq + vec2(0.0, uTravel * 0.004));
  float under = fbm(cq + vec2(0.0, uTravel * 0.004) + vec2(-clamp((x - duSunX) * 3.0, -1.0, 1.0) * 0.05, 0.11)); // the same cloud a little nearer the sun
  float show = smoothstep(0.0, 0.03, up) * smoothstep(0.62, 0.22, up);
  float body = smoothstep(0.52, 0.76, cl) * show;
  float edge = sat((cl - under) * 7.0 + 0.2) * smoothstep(0.44, 0.6, cl) * show; // the side of a cloud turned to the sun
  float dxs = x - duSunX;
  float lit = exp(-dxs * dxs * 1.3) * exp(-up * 5.5);
  col *= 1.0 - 0.8 * body;
  col += (vec3(1.0, 0.33, 0.2) * (0.1 + 1.6 * uLow) * lit + flareCol * flare * exp(-up * 14.0) * 1.2) * edge;
  // stars where the sky is dark
  col += vec3(0.7, 0.8, 1.0) * duStars(vec2(x, up) * rot(0.2)) * smoothstep(0.3, 0.6, up) * (1.0 - body) * (1.0 - wet) * 0.8;
  // the sun's road on the water: short bright dashes that thin out toward the eye
  float road = exp(-pow((x - duSunX) / (0.05 + 0.5 * d), 2.0)) * wet;
  float dash = smoothstep(0.62, 0.8, noise(vec2(x * 14.0 * pz * 0.12 + 5.0, pz * 9.0 - uTime * 0.2)));
  col += vec3(1.0, 0.55, 0.25) * road * dash * (0.1 + 1.2 * uLow) * exp(-d * 5.0) * (1.0 + 2.0 * duDisc);
  // the water takes less than the sky gives, and less still close by
  col *= mix(1.0, (0.78 - 1.0 * d) * mix(0.5, 1.0, glass), wet);
  // the far shore, and a little mist lying on the water before it
  float hill = 0.004 + 0.016 * noise(vec2(x * 2.3 + 4.0, 0.5)) * noise(vec2(x * 7.0 + 1.0, 3.5)) + 0.006 * noise(vec2(x * 31.0, 7.5));
  col *= mix(1.0, 0.04, smoothstep(hill + 0.002, hill - 0.002, e) * smoothstep(-hill * 0.5 - 0.004, -hill * 0.5, e));
  col += duCol[0] * (0.02 + 0.25 * duLv[0]) * exp(-pow((e + 0.012) / 0.006, 2.0)) * exp(-pow((x - duSunX) * 1.2, 2.0));
  return col;
}
vec3 render(vec2 p) {
  duLv[0] = uTexture; duLv[1] = uPhrase; duLv[2] = uPad; duLv[3] = uDrone;
  vec3 amber = uKind[2], violet = uKind[1], teal = uKind[0];
  duCol[0] = max(hueShift(max(mix(vec3(dot(amber, vec3(0.333))), amber, 1.9), 0.0), -0.03), 0.0) * vec3(1.25, 0.9, 0.7);
  duCol[1] = vec3(1.0, 0.2, 0.34); // the phrase is the rose between the amber and the violet
  duCol[2] = max(hueShift(max(mix(vec3(dot(violet, vec3(0.333))), violet, 1.9), 0.0), 0.025), 0.0) * vec3(0.85, 0.7, 0.95);
  duCol[3] = max(hueShift(max(mix(vec3(dot(teal, vec3(0.333))), teal, 2.0), 0.0), 0.045), 0.0) * 0.8;
  duSunX = 0.16 + 0.1 * sin(uTime * 0.021);
  vec3 col;
  if (uVar < 0.5) {
    duSunE = -0.03; duDisc = 0.0;
    col = duView(p, -0.2);
  } else {
    // ribbed glass: each rib is a long lens that turns its strip of the view about and slips it sideways
    duSunE = 0.13; duDisc = 1.0; duSunX = -0.1 + 0.1 * sin(uTime * 0.021);
    vec2 dir = vec2(cos(0.3), sin(0.3));
    float n = 15.0;
    float u = dot(p, dir) * n + uTime * 0.02;
    float id = floor(u), f = fract(u) - 0.5;
    float bend = f * (2.4 + 0.6 * sin(id * 1.7)) + 0.35 * sin(id * 2.4 + uTime * 0.11);
    vec2 q = p - dir * bend / n * 1.0;
    col = duView(q * 0.92, -0.17);
    float round_ = sqrt(max(1.0 - 4.0 * f * f, 0.0));
    col *= 0.62 + 0.5 * round_;
    col += col * 1.4 * smoothstep(0.1, 0.0, abs(f - 0.3)) * 0.35; // a line of shine down each rib
    col += vec3(0.02, 0.025, 0.035) * smoothstep(0.06, 0.0, abs(f + 0.36)) * (0.3 + uLevel);
  }
  col *= 1.0 - 0.3 * dot(p, p);
  // to the screen with the weight of film: colours stay deep, darks stay down
  vec3 c = screenOf(col);
  c = sat(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.3));
  return mix(c, c * c * (3.0 - 2.0 * c), 0.6);
}
