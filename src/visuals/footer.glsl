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
  p /= 0.5 + uSize;
  vec3 c = grade(hueShift(max(render(p), 0.0), uHue));
  c += (hash21(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 255.0; // a little noise against banding
  fragColor = vec4(sat(c), 1.0);
}
