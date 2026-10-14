// name: Star
// a: Burning
// b: Eclipse
// what: One star turning in the dark: a ball of fire pushed out of shape by the sound, with a corona streaming off it.
// follows: The low band swells it, each kind of sound raises its own region in its own colour, the high band raises tongues of flame and lengthens the rays, a hit throws a loop of fire off the limb.
vec3 rich(vec3 c, float k) { return max(mix(vec3(dot(c, vec3(0.33))), c, k), 0.0); }
float gR; mat3 gSpin; float gLv[5];
vec3 spot(int k) { float f = float(k); return normalize(vec3(cos(f * 2.4 + 0.5), 0.55 * sin(f * 1.7 + 0.3), sin(f * 2.4 + 0.5))); }

// How far the surface stands out in the direction d (already turned with the star).
float lift(vec3 d) {
  // low sound makes slow swells, the middle makes ripples, high sound raises tongues of flame
  float h = (0.05 + 0.1 * uLow) * (noise(d * 1.9 + vec3(0.0, uTime * 0.06, 0.0)) - 0.5);
  float n2 = noise(d * 6.0 + vec3(3.0, -uTime * 0.1, 1.0));
  h += (0.02 + 0.06 * uMid) * (n2 - 0.5);
  n2 *= n2;
  h += uHigh * 0.2 * n2 * n2;
  for (int k = 0; k < 5; k++) { float a = max(dot(d, spot(k)), 0.0); a *= a; a *= a; h += 0.1 * gLv[k] * a * a; }
  return h;
}
float map(vec3 p) { float r = length(p); return (r - gR - lift(gSpin * (p / r))) * 0.5; }

// Fire in a given colour: dark and deep where it is cool, the colour itself, then towards white where it is hottest.
vec3 fire(float x, vec3 hue) {
  x = sat(x);
  return x < 0.6 ? mix(hue * hue * 0.22, hue, x / 0.6) : mix(hue, mix(hue, vec3(1.0, 0.95, 0.85), 0.7), (x - 0.6) / 0.4);
}
// The colour of the star in a direction: each kind of sound colours the part of the star round its own place, as far as it is loud.
vec3 hueAt(vec3 d) {
  vec3 c = mix(vec3(1.0, 0.3, 0.04), vec3(1.0, 0.55, 0.2), uTone) * 0.12; float sum = 0.12;
  for (int k = 0; k < 5; k++) { float a = max(dot(d, spot(k)), 0.0); float w = gLv[k] * (0.02 + a * a * a); c += rich(uKind[k], 1.8) * w; sum += w; }
  return rich(c / sum, 1.5);
}

vec3 render(vec2 p) {
  bool eclipse = uVar > 0.5;
  gLv = float[5](uDrone, uPad, uTexture, uPhrase, uHits);
  gR = eclipse ? 0.62 : 0.6 + 0.2 * uLow + 0.03 * sin(uTime * 0.5);
  float sa = uTime * 0.05 + uTravel * 0.03;
  gSpin = mat3(cos(sa), 0.0, sin(sa), 0.0, 1.0, 0.0, -sin(sa), 0.0, cos(sa));
  vec3 ro = vec3(0.0, 0.25 * sin(uTime * 0.04), -3.4);
  vec3 fw = normalize(vec3(0.12 * sin(uTime * 0.05), 0.0, 0.0) - ro), rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.5 + rt * p.x + up * p.y);

  // the nearest the ray comes to the middle: the corona is drawn from that
  float tc = -dot(ro, rd);
  vec3 pc = ro + rd * tc;
  float b = length(pc);
  vec3 dir = gSpin * (pc / max(b, 1e-4));
  vec3 mixc = hueAt(dir);

  vec3 col = vec3(0.0);
  float tHit = 1e9;
  if (!eclipse) {
    float bound = gR + 0.42;
    float disc = bound * bound - b * b;
    if (disc > 0.0) {
      float t = tc - sqrt(disc), tEnd = tc + sqrt(disc), d = 1.0;
      for (int i = 0; i < 36; i++) {
        d = map(ro + rd * t);
        if (d < 0.003) { tHit = t; break; }
        t += d;
        if (t > tEnd) break;
      }
      if (d < 0.02 && tHit > 1e8) tHit = t;
    }
    if (tHit < 1e8) {
      vec3 pos = ro + rd * tHit;
      vec2 e = vec2(1.0, -1.0) * 0.006;
      vec3 n = normalize(e.xyy * map(pos + e.xyy) + e.yyx * map(pos + e.yyx) + e.yxy * map(pos + e.yxy) + e.xxx * map(pos + e.xxx));
      vec3 d3 = gSpin * normalize(pos);
      float h = length(pos) - gR;
      // boiling fire: bright cells with dark lanes between, hotter where the surface stands out
      vec3 w3 = d3 * 4.2 + vec3(0.0, uTime * 0.09, 0.0);
      float cells = fbm(w3 + 1.3 * noise(d3 * 2.7 - vec3(uTime * 0.05)));
      float lanes = abs(noise(d3 * 9.0 + vec3(uTime * 0.12, 0.0, 0.0)) - 0.5) * 2.0;
      float mu = sat(dot(n, -rd));
      float heat = 2.3 * (cells - 0.27) * (0.3 + 0.7 * lanes) + 1.5 * max(h, -0.02) + 0.05 + 0.25 * uLevel;
      vec3 hue = hueAt(d3);
      col = fire(heat, hue) * (0.45 + 0.9 * heat) * (0.6 + 0.4 * pow(mu, 0.5));
      col += hue * pow(1.0 - mu, 2.5) * 0.35; // the limb glows
    }
  }
  // corona: falls off from the limb, streaked by where the ray passes
  float out_ = max(b - gR * (eclipse ? 1.0 : 0.96), 0.0);
  float s1 = noise(dir * 3.2 + vec3(0.0, uTime * 0.05, 0.0)), s2 = noise(dir * 11.0 + vec3(uTime * 0.07, 0.0, 2.0));
  float reach = (eclipse ? 0.2 + 0.28 * uLevel + 0.22 * uHigh : 0.07 + 0.2 * uLevel + 0.2 * uHigh);
  float rays = (0.35 + 1.3 * s1 * s1) * (0.55 + 0.9 * s2 * s2);
  float cor = exp(-out_ / (reach * (0.35 + 0.9 * s1))) * rays / (1.0 + out_ * out_ * 6.0) + (eclipse ? 0.5 : 1.3) * exp(-out_ * 14.0);
  vec3 corCol = eclipse ? mix(vec3(0.85, 0.9, 1.0), mixc, 0.55) : mix(mixc, vec3(1.0, 0.9, 0.8), 0.2);
  float behind = tHit < 1e8 ? 0.0 : 1.0;
  if (eclipse) behind = smoothstep(gR - 0.004, gR + 0.004, b);
  col += corCol * cor * behind * (eclipse ? 0.55 + 1.1 * uLevel : 0.3 + 0.8 * uLevel);

  // a hit: a loop of fire thrown off the limb, growing as it fades; a cue throws a bigger one from the other side
  for (int k = 0; k < 2; k++) {
    float amt = k == 0 ? uHits : uCue;
    if (amt < 0.01) continue;
    float a = uTime * 0.03 + (k == 0 ? 0.9 : 3.6);
    vec3 radial = rt * cos(a) + up * sin(a), side = -rt * sin(a) + up * cos(a);
    float grow = 1.0 - amt;
    float rf = 0.1 + (k == 0 ? 0.42 : 0.7) * grow;
    vec3 cc = radial * (gR + rf * 0.55);
    float tp = dot(cc - ro, fw) / dot(rd, fw);
    vec3 q = ro + rd * tp - cc;
    float x = dot(q, side), y = dot(q, radial);
    float ring = abs(length(vec2(x * (1.0 + 0.5 * grow), y)) - rf);
    float lit = (0.35 + 0.65 * noise(vec2(atan(x, y) * 3.0, uTime * 0.3 + float(k) * 7.0))) * exp(-ring * (19.0 - 9.0 * grow)) * smoothstep(gR - 0.05, gR + 0.05, b) * (tp < tHit ? 1.0 : 0.0);
    col += (rich(uKind[4], 1.5) + vec3(0.8, 0.5, 0.3)) * lit * sqrt(amt) * 2.2;
    col += vec3(1.0, 0.9, 0.8) * exp(-length(pc - radial * gR) * 9.0) * amt * 1.2 * (eclipse ? behind : 1.0);   // the flash where it left
  }
  if (eclipse) {
    // the dark body in front: just enough light on it to see that it is a ball
    if (b < gR) {
      vec3 n = normalize(pc - rd * sqrt(gR * gR - b * b));
      col += vec3(0.05, 0.08, 0.14) * (0.02 + 0.1 * pow(1.0 - sat(dot(n, -rd)), 3.0)) * (0.6 + 0.4 * noise(n * 6.0));
    }
  }
  return screenOf(col);
}
