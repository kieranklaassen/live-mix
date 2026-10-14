#version 300 es
precision highp float;
// What every visual is given. All signals are 0 to 1 and already smooth.
uniform vec2 uRes;        // size in pixels
uniform float uTime;      // seconds, runs on evenly
uniform float uLoop;      // where the playhead is in the piece, 0 to 1
uniform float uTravel;    // distance travelled: grows all the time, faster when the music is fuller. Use it for forward motion.
uniform float uLevel;     // the whole mix
uniform float uLow, uMid, uHigh;                        // three bands of what is heard
uniform float uDrone, uPad, uTexture, uPhrase, uHits;   // each kind of sound; uHits is 1 on a hit or a cue and falls in about 0.6 s
uniform float uCue;       // the performer's cue: 1 when pressed, falls over about 1.2 s
uniform float uKeys, uMic; // notes played on the keys, and a voice at the microphone
uniform float uEnergy, uSpace, uTone; // the performer's three dials
uniform float uSize, uHue; // handled in the footer: do not use
uniform float uCalm, uPull, uArcMid, uArcWide; // the page's colour choice, handled in the footer: do not use
uniform float uVar;       // 0 is variation a, 1 is variation b
uniform float uBands[16]; // the spectrum, low to high
uniform vec3 uKind[5];    // the colours of drone, pad, texture, phrase, hit
uniform sampler2D uMap;   // the piece as it sounds now, see piece()
out vec4 fragColor;

#define PI 3.14159265
#define TAU 6.28318531
#define sat(x) clamp(x, 0.0, 1.0)

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p) { float n = hash21(p); return vec2(n, hash21(p + n + 17.3)); }
float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x), mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x), mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = rot(0.5) * p * 2.02 + 7.1; a *= 0.5; } return s; }
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 3.7; a *= 0.5; } return s; }
// A cosine palette: a + b * cos(TAU * (c * t + d)).
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(TAU * (c * t + d)); }
float smin(float a, float b, float k) { float h = sat(0.5 + 0.5 * (b - a) / k); return mix(b, a, h) - k * h * (1.0 - h); }
vec3 hueShift(vec3 c, float turn) {
  const vec3 k = vec3(0.57735);
  float a = turn * TAU, ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}
// The spectrum at x, 0 (lowest) to 1 (highest).
float band(float x) { float f = sat(x) * 15.0; int i = int(floor(f)); return mix(uBands[i], uBands[min(i + 1, 15)], fract(f)); }
// The piece as it sounds now. uv.x is the place in the loop (0 its start, 1 its end); uv.y is the room (0 the back, which the
// app draws at the top, 1 the front). rgb is the colour of the sounds there times how loud; a is how loud. Each stroke of the
// piece is a soft band across; it swells while it plays. Outside 0 to 1 there is nothing.
vec4 piece(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(uMap, uv);
}
// The colour of a kind of sound, blended along 0 drone, 1 pad, 2 texture, 3 phrase, 4 hit.
vec3 kindColour(float k) { k = clamp(k, 0.0, 4.0); int i = int(floor(k)); return mix(uKind[i], uKind[min(i + 1, 4)], fract(k)); }
// From light to what a screen shows: soft shoulder, then gamma.
vec3 screenOf(vec3 light) { light = max(light, 0.0); light = light * (1.0 + light * 0.18) / (1.0 + light); return pow(light, vec3(0.4545)); }
#line 1
