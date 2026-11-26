// The world the style is drawn in (`world.ts`): where the eye stands, then what is done to the colours it drew. With no world
// nothing here is done.
uniform float uWorld;                    // 1 where there is a world
uniform vec4 uStand;                     // turned by (radians), across, up, near
uniform vec3 uBend;                      // fold, bow, wave
uniform vec3 uTones[3];                  // what darks, middles and lights are pulled to
uniform float uToned, uMistFrom, uEdge;
uniform vec4 uTouch;                     // light, contrast, vividness, flip
uniform vec4 uMist;                      // the mist's colour, and how thick
vec2 worldStand(vec2 p) {
  p = rot(uStand.x) * p;
  if (uBend.x > 1.5) {                   // folded round the middle into equal parts
    float part = TAU / uBend.x, r = length(p), a = r > 1e-5 ? atan(p.y, p.x) : 0.0;
    a = abs(mod(a, part) - 0.5 * part);
    p = r * vec2(cos(a), sin(a));
  }
  p *= max(0.2, 1.0 + 0.55 * uBend.y * dot(p, p));
  p += 0.02 * uBend.z * vec2(sin(p.y * 9.0 + uTime * 0.53) + 0.6 * sin(p.y * 21.0 - uTime * 0.71), sin(p.x * 8.0 - uTime * 0.47) + 0.6 * sin(p.x * 19.0 + uTime * 0.67));
  return p / uStand.w + uStand.yz;
}
float worldLight(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 worldColour(vec3 c, vec2 p) {
  c = min(c, 4.0) * exp2(1.5 * uTouch.x);
  c = max(mix(vec3(0.42), c, 1.0 + (uTouch.y < 0.0 ? 0.7 : 1.1) * uTouch.y), 0.0);
  float l = worldLight(c);
  if (uTouch.w > 0.0) { c = max(c + uTouch.w * (1.0 - 2.0 * min(l, 1.0)), 0.0); l = worldLight(c); }
  if (uToned > 0.0) {
    float t = sat(l);
    vec3 pulled = t < 0.5 ? mix(uTones[0], uTones[1], smoothstep(0.0, 0.5, t)) : mix(uTones[1], uTones[2], smoothstep(0.5, 1.0, t));
    c = mix(c, pulled, uToned);
  }
  c = max(mix(vec3(worldLight(c)), c, 1.0 + (uTouch.z < 0.0 ? 1.0 : 1.2) * uTouch.z), 0.0);
  if (uMist.w > 0.0) {
    float low = sat(0.5 + p.y), here = uMistFrom < 0.0 ? mix(1.0, 1.0 - low, -uMistFrom) : mix(1.0, low, uMistFrom);
    c = mix(c, uMist.rgb, sat(uMist.w * mix(1.0, 1.4 * here, abs(uMistFrom))));
  }
  return c * (1.0 - uEdge * smoothstep(0.3, 1.05, length(p * vec2(0.8, 1.1))));
}
// The page's colour choice lies over every visual alike. uCalm takes the vividness down (1 is black and white); uPull folds
// the whole colour wheel onto one arc of it, uArcMid its middle and uArcWide half its width, so every colour lands in that
// family and still differs from its neighbours.
vec3 gradeToHsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 q = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 r = mix(vec4(q.xyw, c.r), vec4(c.r, q.yzx), step(q.x, c.r));
  float d = r.x - min(r.w, r.y);
  return vec3(abs(r.z + (r.w - r.y) / (6.0 * d + 1e-6)), d / (r.x + 1e-6), r.x);
}
vec3 gradeToRgb(vec3 c) {
  vec3 q = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(q - 1.0, 0.0, 1.0), c.y);
}
vec3 grade(vec3 c) {
  if (uCalm <= 0.0 && uPull <= 0.0) return c;
  vec3 h = gradeToHsv(c);
  vec3 pulled = gradeToRgb(vec3(fract(uArcMid + uArcWide * sin(TAU * (h.x - 0.32))), h.y * 0.9, h.z));
  c = mix(c, pulled, uPull);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(l), uCalm);                         // less vivid
  float soft = min(uCalm, 0.5);
  return c * (1.0 - 0.2 * soft) + 0.024 * soft;       // and a little softer: lights down, darks lifted a touch
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y; // the middle is 0, the height runs from -0.5 to 0.5
  vec2 at = p;
  p /= 0.5 + uSize;
  if (uWorld > 0.5) p = worldStand(p);
  vec3 c = max(render(p), 0.0);
  if (uWorld > 0.5) c = worldColour(c, at);
  c = grade(hueShift(c, uHue));
  c += (hash21(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 255.0; // a little noise against banding
  fragColor = vec4(sat(c), 1.0);
}
