// name: Crystal hall
// a: Great beams
// b: Geode
// what: A hot dark cave of crystal beams thick as trees, leaning from wall to wall over rust-brown rock, milky and veiled inside, lit from behind by a hidden lamp; far in, one small figure by a small warm light. Or the mouth of a geode close up: a grey rind round a hollow of short pointed crystals, smoke to violet to clear.
// follows: Each kind of sound lights one beam from its foot, the spectrum climbs the beams as faint planes, the low band feeds the small far light; a hit lights the crystal point at the right, a cue swings the hidden lamp behind the beams and back, keys light the small tip. In the geode each kind lights a quarter, a hit flares one cluster, a cue swings the lamp across.
// own: 0 1 many slender crystals, -1 a few great ones; 1 a: 1 upright columns, -1 a burst from one root; b: the mouth: 1 a narrow crack, -1 several round holes; 2 1 spires and needles, -1 flat slabs (b: blunt); 3 the rock: 1 pale as chalk (b: banded), -1 black and wet; 4 1 daylight, -1 only their own light; 5 1 a: still water below that mirrors, -1 one low lamp on the right (b: 1 lit from within); 6 a: 1 open ground and sky, -1 seen from above; b: 1 giants among stubble, -1 alike in even rows; 7 1 deep glass in the sounds' colours, -1 dull stone in them
const int chN = 10;
// The beams: two faces, middle and half length, half widths and slant.
#define CH_LONG(F) CH_L1(F) CH_L2(F)
#define CH_L1(F)  \
F(0.0, vec3(-.689, -.046, -.724), vec3(-.694, -.719, .016), vec4(-7.522, -1.062, 7.007, 11.129), vec4(.86, .74, .98, 0.0))  \
F(1.0, vec3(.291, -.837, .463), vec3(.598, -.649, -.47), vec4(3.686, -7.642, 2.565, 14.976), vec4(.66, .8, .6, 0.0))  \
F(2.0, vec3(-.636, .045, -.771), vec3(-.947, -.3, .115), vec4(-4.165, 5.831, 6.734, 6.311), vec4(.5, .4, .46, 0.0))  \
F(3.0, vec3(-.419, -.157, .894), vec3(.546, -.375, .75), vec4(6.642, 11.689, 7.984, 6.962), vec4(.52, .62, .5, 0.0))
#define CH_L2(F)  \
F(5.0, vec3(-.019, -.776, .63), vec3(-.32, -.893, -.317), vec4(9.761, -3.712, -4.362, 11.037), vec4(.46, .4, .52, 0.0))  \
F(6.0, vec3(-.576, -.392, -.717), vec3(-.588, -.783, .203), vec4(-13.808, 3.889, 8.891, 8.844), vec4(.42, .5, .44, 0.0))  \
F(7.0, vec3(-.145, -.473, .869), vec3(.417, -.895, .158), vec4(3.511, -2.786, 2.18, 5.17), vec4(.5, .46, .56, 0.0))  \
F(8.0, vec3(.076, -.475, .877), vec3(.751, -.641, .158), vec4(12.026, -4.285, 5.924, 7.03), vec4(.4, .46, .36, 0.0))
#define CH_TIPS(F) CH_T1(F) CH_T2(F)
#define CH_T1(F) F(4.0, vec3(.565, -.522, -.639), vec3(.492, -.811, .316), vec4(-3.788, 3.53, -12.836, 7.734), vec4(.34, .28, .38, 1.5))
#define CH_T2(F) F(9.0, vec3(.878, -.311, .363), vec3(.691, -.377, -.617), vec4(1.106, -4.664, -3.681, 1.12), vec4(.26, .22, .3, .9))
vec3 chA[chN], chB[chN], chX[chN]; vec4 chC[chN], chW[chN];
vec2 chK[chN];
const float CHDAY = max(uOwn[4], 0.0), CHOWN = max(-uOwn[4], 0.0), CHWET = max(uOwn[5], 0.0), CHLOW = max(-uOwn[5], 0.0), CHGEM = max(uOwn[7], 0.0), CHDULL = max(-uOwn[7], 0.0);
const float CHOP = max(uOwn[6], 0.0), CHHIGH = max(-uOwn[6], 0.0), CHOPEN = 1.0 + 3.0 * CHOP; // in the hall alone
const float CHCELL = .165 * exp2(-.85 * uOwn[0]), CHUP = exp2(-.5 * uOwn[0] + .35 * min(uOwn[2], 0.0)), CHSL = .42 * exp2(-uOwn[2] * (uOwn[2] > 0.0 ? 1.1 : .6));
const float CHBALL = max(1.0 - (.384 + .3 * CHOP) * CHUP, .12);
const bool CHUED = CHGEM > 0.0 || CHDULL > 0.0 || CHOWN > 0.0 || CHDAY > 0.0;
const bool CHFILL = CHDAY > 0.0 || CHOP > 0.0;
const vec3 CHDUST = vec3(.5, .27, .15) + vec3(.35, .58, .7) * max(uOwn[3], 0.0);
const bool CHMOVED = uOwn[0] != 0.0 || uOwn[1] != 0.0 || uOwn[2] != 0.0;
const int CHM = uOwn[0] < -.79 ? 5 : 10;
vec3 chKey, chFar, chKeyC, chFarC;
bool chGeo;
const float chG = 4.5;

vec4 chNoiseD(vec3 p) {
vec3 i = floor(p), f = p - i, d = 6.0 * f * (1.0 - f); f = f * f * (3.0 - 2.0 * f);
uvec3 k = uvec3(ivec3(i)) * uvec3(1597334677u, 3812015801u, 2798796415u);
uint n = k.x + k.y + k.z;
uvec4 a = uvec4(0u, 1597334677u, 3812015801u, 1114383182u) + n, b = a + 2798796415u;
a = (a ^ (a >> 15)) * 742121581u; b = (b ^ (b >> 15)) * 742121581u;
vec4 A = vec4(ivec4(a >> 8)), B = vec4(ivec4(b >> 8)) - A, h = A + B * f.z;
vec2 g = mix(h.xz, h.yw, f.x), z = mix(B.xz, B.yw, f.x);
return vec4(mix(g.x, g.y, f.y), d * vec3(mix(h.y - h.x, h.w - h.z, f.y), g.y - g.x, mix(z.x, z.y, f.y))) * 5.9604645e-8;
}
float chNoise(vec3 p) { return chNoiseD(p).x; }
// Where a ray goes into three pairs of faces and comes out again.
vec2 chSpan(vec3 o, vec3 d, vec3 w) {
vec3 m = 1.0 / (d + 1.3e-6), k = abs(m) * w, c = m * o, a = -c - k, b = k - c;
return vec2(max(a.x, max(a.y, a.z)), min(b.x, min(b.y, b.z)));
}
// The same, the faces leaning together.
vec2 chSix(vec3 f, vec3 g, vec3 o, vec3 d) {
vec3 a = d + g + 1.3e-6, b = d - g + 1.3e-6, u = -(o + f) / a, v = (f - o) / b;
bvec3 A = greaterThanEqual(a, vec3(0.0)), B = greaterThanEqual(b, vec3(0.0));
vec3 e = max(mix(u, vec3(-99.0), A), mix(v, vec3(-99.0), B)), x = min(mix(vec3(99.0), u, A), mix(vec3(99.0), v, B));
return vec2(max(e.x, max(e.y, e.z)), min(x.x, min(x.y, x.z)));
}
// The same, cut to a point at the end.
vec2 chPoint(vec2 r, vec3 o, vec3 d, vec3 u, vec3 n, vec4 c, float s) {
vec3 x = cross(u, n) * 1.1547, g = .7 * u - .6 * (n - .5 * u) * 1.1547;
float O = dot(o, x) - c.z, D = dot(d, x), oy = dot(o, u) - c.x, oz = (dot(o, n) - c.y - .5 * oy) * 1.1547;
vec2 o2 = vec2(O + s * oy, O - s * (.7 * oy - .6 * oz)), d2 = vec2(D + s * dot(d, u), D - s * dot(d, g)) + 1.3e-6;
vec2 m = 1.0 / d2, k = abs(m) * c.w, a = -m * o2 - k, b = k - m * o2;
return vec2(max(r.x, max(a.x, a.y)), min(r.y, min(b.x, b.y)));
}
// The rock.
float chRock(vec3 q, out vec3 slope) {
vec4 n = chNoiseD(q * (chGeo ? .8 : .62));
vec3 er = vec3(10.5, 5.8, 15.5) * CHOPEN, e = (q - vec3(0.0, 1.0, 9.0)) / er, g = e / er;
float l = length(e), m = 1.0 / (length(g) + 1e-4), d = (1.0 - l) * l * m, pb = .022 / (CHOPEN * CHOPEN), f = q.y + 2.75 - pb * q.x * q.x, h = sat(.5 + .2 * (d - f));
slope = chGeo ? vec3(0.0, 0.0, -1.0) - .32 * n.yzw : mix(-g * m, vec3(-2.0 * pb * q.x, 1.0, 0.0), h) - 1.2 * n.yzw;
return chGeo ? .5 - q.z - .4 * n.x : mix(d, f, h) - 2.5 * h * (1.0 - h) - 1.94 * (n.x - .42);
}
vec3 chEnv(vec3 q, vec3 d) {
vec3 l1 = chKey - q, l2 = chFar - q;
float s1 = dot(l1, l1), s2 = dot(l2, l2), a = max(dot(d, l2), 0.0), b = max(dot(d, l1), 0.0);
a = a * a / s2; b = b * b / s1; float b4 = b * b * b * b;
return chFarC * (.02 + .2 * a + a * a * a) / (6.0 + s2) + chKeyC * (.01 + .15 * b + 2.0 * b4 * b4 * b4) / (6.0 + s1) + vec3(.020, .020, .024) * (1.1 + d.y);
}
float chAir(vec3 ro, vec3 rd, float t, vec3 l) {
vec3 o = l - ro; float b = dot(o, rd), h = sqrt(max(dot(o, o) - b * b, .004)), u = t - b;
return (u / (.64 * h + abs(u)) + b / (.64 * h + abs(b))) * 1.57 / h;
}
// One ray through every beam.
#define CH_TAKE(I) th += max(0.0, min(s.y, len) - max(s.x, .02)); h = vec3(s.x + 1e4 * (step(s.y, s.x) + step(s.x, .1)), s.y - s.x, I); n = step(h.x, b1.x); b2 = mix(mix(b2, h, step(h.x, b2.x)), b1, n); b1 = mix(b1, h, n);
#define CH_MEET(A, B, C, W) f = vec2(dot(o, A), dot(o, B)) - C.xy; g = vec2(dot(d, A), dot(d, B)); s = chSpan(vec3(f, f.x - f.y), vec3(g, g.x - g.y), W.xyz);
#define CH_BEAM(I, A, B, C, W) CH_MEET(A, B, C, W) CH_TAKE(I)
#define CH_TIP(I, A, B, C, W) CH_MEET(A, B, C, W) s = chPoint(s, o, d, A, B, C, W.w); CH_TAKE(I)
#define CH_PUT(I, A, B, C, W) chA[int(I)] = A; chB[int(I)] = B; chC[int(I)] = C; chW[int(I)] = W;
float chMouth(vec2 m) {
vec2 u = m / (length(m) + 1e-4);
float d = length(m) - .87;
if (uOwn[1] > 0.0) { vec2 c = mat2(.814, -.581, .581, .814) * m; d = (length(c * vec2(1.0 - .1 * uOwn[1], 1.0 + 3.4 * uOwn[1])) - .87) / (1.0 + 1.3 * uOwn[1]); }
if (uOwn[1] < 0.0) d = mix(d, min(min(length(m - vec2(-.38, .1)) - .36, length(m - vec2(.42, .28)) - .27), min(length(m - vec2(.22, -.4)) - .2, length(m - vec2(.72, -.12)) - .1)), -uOwn[1]);
return d + .06 * u.x * (4.0 * u.x * u.x - 3.0) + .04 * u.y * u.x + .1 * abs(fract(m.x * 2.0 + .6 * m.y) - .5) * abs(fract(m.y * 2.7 - .4 * m.x) - .5);
}
// One crystal of the geode.
float chTooth(vec2 id, out vec3 tip, out vec3 ax, out vec3 e1) {
float k = hash21(id + 5.0); vec4 h = fract(k * vec4(17.3, 91.7, 53.9, 233.1));
if (uOwn[6] < 0.0) { h = mix(h, vec4(.5), -uOwn[6]); k = mix(k, .6, -uOwn[6]); }
vec4 g = (id.xyxy + vec4(.15, .15, .3, .3) + vec4(.7, .7, .4, .4) * h) * CHCELL;
float high = .24 + .17 * k * k + .08 * step(.88, h.x);
if (uOwn[6] > 0.0) high = mix(high, .1 + .62 * smoothstep(.62, 1.0, k), uOwn[6]);
high *= CHUP;
vec2 r = min(vec2(dot(g.xy, g.xy), dot(g.zw, g.zw)), 3.0), c = sqrt(1.0 - .25 * r);
vec3 b = vec3(g.xy * c.x, 1.0 - .5 * r.x);
tip = vec3(g.zw * c.y, 1.0 - .5 * r.y) * (1.0 - high * (1.1 - smoothstep(1.8, 2.2, r.x))) - b;
float tall = length(tip);
ax = tip / tall; tip += b;
e1 = normalize(cross(ax, vec3(h.xy - .5, .7)));
return tall;
}

// The beams in another order than the plain one, each worked out from its number before anything is drawn.
const float CHSP = max(uOwn[2], 0.0), CHW = abs(uOwn[1]), CHOS = smoothstep(0.0, .4, CHOP);
const vec3 CHWIDE = (1.0 - .22 * CHW) * (1.0 - .3 * CHSP) * (vec3(1.0) + vec3(-.72, .35, .35) * max(-uOwn[2], 0.0)) * (1.0 - .45 * max(uOwn[0], 0.0));
#define CH_ARR(I, A, B, C, W) const vec4 aH = fract(I * vec4(.618, .381, .755, .569) + vec4(.13, .4, .2, .7)); \
const float aS = sin(I * 2.4 + .5), aG = step(I, 3.5), aN = uOwn[1] > 0.0 ? (1.0 - CHOS) * CHSP * step(aH.w, .5) : 0.0, \
aI = uOwn[1] > 0.0 ? mix(mix(8.0, 3.6 + 1.6 * aH.z, CHSP), 1.6 + 3.6 * aH.z * aH.z + .8 * aG, CHOS) : 1.6 + 1.5 * aH.z + 1.1 * aG, aL = mix(C.w, aI, CHW); \
const vec3 aX = cross(A, B) * 1.1547, a0 = uOwn[1] > 0.0 ? vec3(.2 * aH.x - .1, 1.0, .16 * aH.y - .08) : vec3(aS * (.5 + .7 * aH.x), .35 + .75 * aH.y, .4 * fract(I * .382) - .4), \
a1 = a0 * inversesqrt(dot(a0, a0)) * (dot(aX, a0) < 0.0 ? -1.0 : 1.0), \
aP = uOwn[1] > 0.0 ? vec3((6.2 + 2.0 * aH.w) * aS, mix(mix(1.5, aI * .92 - 3.1, max(CHSP, CHOS)), 6.6 - aI, aN), 4.6 + mod(I * 3.885, 10.5)) : vec3(.1, -2.6, 9.6) + a1 * (a1.y < 0.0 ? -.95 : .95) * aI, \
a2 = A - a1 * dot(A, a1) * CHW, aU = a2 * inversesqrt(dot(a2, a2) + 1e-6), aB = mix(B, .5 * aU + .866 * cross(a1, aU), CHW), \
aC = mix(C.xyz, vec3(dot(aP, aU), dot(aP, aB), dot(aP, mix(aX, a1, CHW))), CHW), aT = cross(aU, aB) * 1.1547; \
const vec2 aK = vec2(.98 * CHSP * mix(1.0, (a1.y < 0.0 ? -1.0 : 1.0) * (1.0 - 2.0 * aN), max(CHW, CHOS)) / aL, W.w > 0.0 ? aL : aL / max(min(5.0 * CHW, 1.0), .2)); \
const vec4 aW = vec4(W.xyz * CHWIDE * (I < 4.5 ? 1.0 - .55 * min(uOwn[0], 0.0) : max(1.0 + 1.25 * min(uOwn[0], 0.0), 0.0)), W.w > 0.0 ? W.w : 1.1);
#define CH_SET(I, A, B, C, W) { CH_ARR(I, A, B, C, W) chA[int(I)] = aU; chB[int(I)] = aB; chX[int(I)] = aT; chC[int(I)] = vec4(aC, aL); chW[int(I)] = aW; chK[int(I)] = aK; }
#define CH_HEW(I, A, B, C, W) { CH_ARR(I, A, B, C, W) \
f = vec2(dot(o, aU), dot(o, aB)) - aC.xy; g = vec2(dot(d, aU), dot(d, aB)); \
float O = dot(o, aT) - aC.z, D = dot(d, aT); \
s = chSpan(vec3(f, f.x - f.y), vec3(g, g.x - g.y), aW.xyz); \
vec2 o2 = vec2(O + aW.w * f.x, O + aW.w * (.69282 * f.y - 1.04641 * f.x)), m = 1.0 / (vec2(D + aW.w * g.x, D + aW.w * (.69282 * g.y - 1.04641 * g.x)) + 1.3e-6), e = abs(m) * aK.y; \
o2 *= -m; s = vec2(max(s.x, max(o2.x - e.x, o2.y - e.y)), min(s.y, min(o2.x + e.x, o2.y + e.y))); \
CH_TAKE(I) }
float chMarch(vec3 ro, vec3 rd, float tw, out vec3 slope) {
vec3 er = vec3(9.2, 4.5, 14.1) * CHOPEN, eo = (ro - vec3(0.0, 1.0, 9.0)) / er, ed = rd / er;
float ea = dot(ed, ed), eb = dot(eo, ed), ec = dot(eo, eo) - 1.0, tR;
tR = (sqrt(max(eb * eb - ea * ec, 0.0)) - eb) / ea;
if (rd.y < -.01) tR = min(tR, (-1.4 - ro.y) / rd.y);
for (int k = 0; k < 6; k++) { float d = chRock(ro + rd * tR, slope); if (abs(d) < .003 * tR || chGeo || tR > 45.0 || (CHWET > 0.0 && d > 0.0 && tR > tw)) break; tR += d / clamp(-dot(slope, rd), .5, 1.0); }
return tR;
}
vec3 chSky(vec3 d) {
float s = sat(d.y * 1.5);
vec3 c = mix(mix(uKind[3], vec3(1.0), .3), uKind[0], 1.0 - (1.0 - s) * (1.0 - s));
return c * c * (.55 + .75 * CHDAY - .45 * CHOWN) * (.8 + .3 * uLevel);
}
vec3 chFill(vec3 n, float open) { return (CHDAY + .5 * open) * mix(vec3(.8), chSky(n), .4 + .4 * open) * (.45 + .32 * n.y); }

vec3 render(vec2 p) {
chGeo = uVar > .5;
if (CHMOVED && !chGeo) { CH_L1(CH_SET) CH_T1(CH_SET) if (CHM > 5) { CH_L2(CH_SET) CH_T2(CH_SET) } }
else { CH_LONG(CH_PUT) CH_TIPS(CH_PUT) }
bool moved = CHMOVED && !chGeo;
float open = chGeo ? 0.0 : CHOP, mirror = 1.0;
float tv = uTravel * .03, cp = 4.0 * uCue * (1.0 - uCue), sway = sin(uTime * .05), tR; vec2 wander = sin(uTime * vec2(.31, .23));
vec3 ro = vec3(.35 * sin(tv), .12 * sin(tv * .7 + 1.0), .4 * sin(tv * .43)), rd = vec3(p.x - .03 * sin(tv), p.y + .03, 1.0);
chKeyC = mix(vec3(1.0, .95, .86), vec3(.8, .95, 1.15), uTone) * (46.0 + 18.0 * uLevel + 16.0 * uCue);
chFarC = vec3(1.0, .56, .22) * (8.0 + 12.0 * uLow + 3.0 * uMic);
chKey = vec3(-.9 + .5 * sway, 2.5, 14.6) + cp * vec3(4.0, -1.2, 0.0); chFar = vec3(-3.25, -1.5, 14.6);
if (chGeo) {
ro = chG * vec3(.2 + .1 * sin(tv), .14 + .05 * sin(tv * .7), -2.1);
rd = vec3((p.x + .2) / 1.6 - ro.x / chG / 2.3, (p.y + .07) / 1.2 - ro.y / chG / 2.3, 1.0);
chKey = vec3(-4.6 + .5 * sway, 4.6, -3.4) + cp * vec3(8.0, 1.0, 0.0); chKeyC *= 1.15; chFar = vec3(1.6, -1.2, 4.4); chFarC *= .25;
}
if (uOwn[4] != 0.0) {
chKey = mix(chKey, chGeo ? vec3(-3.0 + .5 * sway, 6.5, -7.0) : vec3(-5.0 + .8 * sway, 10.0, 5.0), CHDAY) ;
chKeyC *= (1.0 + CHDAY * (chGeo ? 2.2 : 2.6)) * (1.0 - .9 * CHOWN); chFarC *= 1.0 - .85 * CHOWN;
}
if (CHWET > 0.0 && chGeo) { chKey = mix(chKey, vec3(.8 + .6 * sway, .3, 3.1) + cp * vec3(1.2, .5, 0.0), CHWET); chKeyC *= 1.0 - .86 * CHWET; }
if (CHMOVED && moved) chFarC *= 1.0 + 2.5 * uHits;
if (CHLOW > 0.0) chKey = mix(chKey, chGeo ? vec3(6.2 + sway, -1.5, -1.6) : vec3(4.6 + .6 * sway, -1.6, 6.0), CHLOW); 
if (CHHIGH > 0.0 && !chGeo) { ro += CHHIGH * vec3(0.0, 3.4, 2.6); rd.yz = rot(-.95 * CHHIGH) * rd.yz; }
rd = normalize(rd);
vec3 slope; float tw = 1e4;
if (CHWET > 0.0 && !chGeo && rd.y < -1e-3) tw = (mix(-4.2, -1.75, CHWET) - ro.y) / rd.y;
tR = chMarch(ro, rd, tw, slope);
float tFull = tR; tR = min(tR, tw);
// what is seen, then from there to the lamp
float n, cov = 1.0, len = 1e4; vec3 h, b1 = vec3(9e3, 0.0, 0.0), b2 = b1; vec2 s, f, g;
float T0 = tR, T1 = tR, th = 0.0; int B0 = -1, B1 = -1; vec2 I0 = vec2(0.0), I1 = I0;
for (int k = 0; k < 2 && !chGeo; k++) {
vec3 o = ro, d = rd; th = 0.0;
if (k > 0) { o = ro + rd * (T0 - (B0 < 0 ? .08 : 0.0)); d = chKey - o; len = length(d); d /= len; }
if (CHSP > 0.0) for (int i = 0; i < (k > 0 ? 5 : CHM); i++) {
 vec4 W = chW[i], C = chC[i]; vec3 A = chA[i], B = chB[i], x = chX[i]; vec2 K = chK[i];
 f = vec2(dot(o, A), dot(o, B)) - C.xy; g = vec2(dot(d, A), dot(d, B));
 float O = dot(o, x) - C.z, D = dot(d, x);
 s = chSix(vec3(f, f.x - f.y), vec3(g, g.x - g.y), W.xyz * (K.x * O - 1.0), W.xyz * (K.x * D));
 vec2 o2 = vec2(O + W.w * f.x, O + W.w * (.69282 * f.y - 1.04641 * f.x)), m = 1.0 / (vec2(D + W.w * g.x, D + W.w * (.69282 * g.y - 1.04641 * g.x)) + 1.3e-6), e = abs(m) * K.y;
 o2 *= -m; s = vec2(max(s.x, max(o2.x - e.x, o2.y - e.y)), min(s.y, min(o2.x + e.x, o2.y + e.y)));
 CH_TAKE(float(i))
}
else if (CHMOVED) { CH_L1(CH_HEW) CH_T1(CH_HEW) if (CHM > 5 && k == 0) { CH_L2(CH_HEW) CH_T2(CH_HEW) } }
else { CH_LONG(CH_BEAM) CH_TIPS(CH_TIP) }
if (CHWET > 0.0) {
bool turn = k == 0 && tw < tFull && b1.x >= tR;
if (turn) {
 ro += rd * tw; tR = tw;
 vec4 rp = chNoiseD(vec3(ro.xz * vec2(2.0, 4.0), uTime * .13)) * .013;
 mirror = .16 + .84 * (1.0 + rd.y) * (1.0 + rd.y) * (1.0 + rd.y);
 rd = normalize(vec3(rd.x, -rd.y, rd.z) + vec3(rp.y, 0.0, rp.w)); rd.y = max(rd.y, .01);
 ro.y += .02; tw = 1e4; tR = chMarch(ro, rd, tw, slope); T0 = T1 = tR; b1 = vec3(9e3, 0.0, 0.0); b2 = b1;
 k = -1; continue;
}
}
if (k == 0) {
 if (b1.x < tR) { T0 = b1.x; B0 = int(b1.z); cov = sat(b1.y * uRes.y / (1.6 * T0)); }
 if (b2.x < tR) { T1 = b2.x; B1 = int(b2.z); }
 b1 = b2 = vec3(-1.0);
}
}
// the geode
for (int z = 0; z < 1 && chGeo; z++) {
vec3 rg = ro / chG;
float tm = -rg.z / rd.z, b = dot(rg, rd), inside = chMouth(rg.xy + rd.xy * tm);
// to the wall, four cells round each step
float bb = b * b - dot(rg, rg), tA = max(tm, sqrt(max(bb + (CHUP == 1.0 && uOwn[6] <= 0.0 ? .38 : CHBALL * CHBALL), 0.0)) - b), rim = tm * .8 / uRes.y; tR = sqrt(max(bb + .96, 0.0)) - b;
T0 = tm * chG; B0 = B1 = -2; cov = 1.0; th = 0.0; b1 = b2 = vec3(9e3, 0.0, 0.0);
vec2 was = vec2(99.0);
for (int m = 0; m < 4; m++) {
 vec3 w = normalize(rg + rd * mix(tA, tR, float(m) * .32 + .02));
 vec2 c0 = floor(w.xy * inversesqrt(max(.5 + .5 * w.z, .1)) / CHCELL - .5);
 if (inside > rim || b1.x < mix(tA, tR, float(m) * .32 - .2)) break;
 if (c0 == was) continue;
 was = c0;
 for (int k = 0; k < 4; k++) {
 vec2 id = c0 + vec2(k & 1, k >> 1);
 vec3 tip, ax, e1; chTooth(id, tip, ax, e1);
 vec3 e2 = cross(ax, e1), o = rg - tip;
 vec3 ol = vec3(dot(o, e1), dot(o, e2), dot(o, ax) * CHSL), dl = vec3(dot(rd, e1), dot(rd, e2), dot(rd, ax) * CHSL);
 vec3 a = vec3(ol.x, .5 * ol.x + .866 * ol.y, .5 * ol.x - .866 * ol.y), v = vec3(dl.x, .5 * dl.x + .866 * dl.y, .5 * dl.x - .866 * dl.y);
 vec3 d1 = v + dl.z + 1.3e-6, d2 = dl.z - v + 1.3e-6, u1 = -(a + ol.z) / d1, u2 = (a - ol.z) / d2;
 vec3 e = max(mix(u1, vec3(-9.0), step(0.0, d1)), mix(u2, vec3(-9.0), step(0.0, d2))), x = min(mix(vec3(9.0), u1, step(0.0, d1)), mix(vec3(9.0), u2, step(0.0, d2)));
 float tn = max(e.x, max(e.y, e.z)), tf = min(x.x, min(x.y, x.z)), nm = id.x + 32.0 + 64.0 * (id.y + 32.0);
 h = vec3(tn + 1e4 * (step(tf, tn) + step(tn, tm - .1) + float(nm == b1.z)), tf - tn, nm); n = step(h.x, b1.x);
 b2 = mix(mix(b2, h, step(h.x, b2.x)), b1, n); b1 = mix(b1, h, n);
 }
}
if (inside < rim) {
 I0 = vec2(mod(b1.z, 64.0), floor(b1.z / 64.0)) - 32.0; I1 = vec2(mod(b2.z, 64.0), floor(b2.z / 64.0)) - 32.0;
 T0 = min(b1.x, tR) * chG; T1 = min(b2.x, tR) * chG; B0 = b1.x < tR ? 0 : -3; B1 = b2.x < tR ? 0 : -3;
 cov = B0 < 0 ? 1.0 : sat(b1.y * uRes.y / (1.6 * b1.x));
 if (inside > -rim) { T1 = T0; B1 = B0; I1 = I0; T0 = tm * chG; B0 = -2; cov = .5 + .5 * inside / rim; }
}
}
if (cov > .8) cov = 1.0;
vec3 col = vec3(0.0);
for (int k = 0; k < 2; k++) {
int bk = k == 0 ? B0 : B1;
float t = k == 0 ? T0 : T1, px = t / uRes.y, rk, e, e2, far, face, face2, big, along; int i = max(bk, 0);
vec3 q = ro + rd * t, n, n2, sd, O, O2, ri, q2, c, tint = vec3(1.0), glow = vec3(0.0); bool glass = bk >= 0;
rk = chRock(q, slope);
vec3 v1 = chKey - q, v2 = chFar - q, l1 = normalize(v1), l2 = normalize(v2);
vec3 u = chA[i], nb = chB[i], v = (nb - .5 * u) * 1.1547, x = cross(u, v); vec4 C = chC[i], W = chW[i];
float lip = 0.0, kk = float(i), slant = chGeo ? CHSL : 0.0, tall = 1.0, seed = float(i);
if (chGeo) {
 vec3 tip, e1; tall = chTooth(k == 0 ? I0 : I1, tip, x, e1) * chG; tip *= chG;
 u = e1; v = cross(x, u); nb = .5 * u + .866 * v; C = vec4(dot(tip, u), dot(tip, nb), dot(tip, x), 1.0);
 W = vec4(vec3(CHSL * (C.z - dot(q, x))), 0.0); seed = fract(tall * 137.0) * 9.0;
 kk = step(1.0, tip.x + seed * .3) + 2.0 * step(-1.0, tip.y - seed * .3);
 tint = mix(mix(vec3(.26, .19, .15), vec3(.30, .11, .56), smoothstep(-.9, -.35, tip.x / chG)), vec3(.9, .92, .95), smoothstep(.15, .8, tip.x / chG + .2 * (seed / 9.0 - .5)));
 vec3 lc = q + (chKey - q) * q.z / max(q.z - chKey.z, .1);
 lip = chMouth((glass ? lc.xy : q.xy) / chG);
 th = glass ? 4.0 * smoothstep(-.1, .06, lip) * (1.0 - CHWET) : 0.0;
}
if (CHMOVED && moved) {
 float ox = dot(q, x) - C.z;
 slant = chK[i].x * dot(W.xyz, vec3(.333)); W.xyz *= max(1.0 - chK[i].x * ox, .03); kk = i == 9 ? 4.0 : kk; 
}
O = vec3(dot(q, x) - C.z, dot(q, u) - C.x, 0.0); float z1 = dot(q, nb) - C.y; O.z = (z1 - .5 * O.y) * 1.1547;
vec3 f3 = vec3(O.y, z1, O.y - z1), d3 = W.xyz - abs(f3);
vec2 g2 = vec2(O.x + W.w * O.y, O.x - W.w * (.7 * O.y - .6 * O.z)), h2 = W.w > 0.0 ? ((moved ? chK[i].y : C.w) - abs(g2)) * inversesqrt(1.0 + W.w * W.w) : vec2(9.0);
float mn = min(min(d3.x, min(d3.y, d3.z)), min(h2.x, h2.y));
vec3 m3 = step(d3, vec3(mn)), sg = sign(f3); vec2 m2 = step(h2, vec2(mn)), sh2 = sign(g2);
n = m3.x * sg.x * u + m3.y * sg.y * nb + m3.z * sg.z * (u - nb) + m2.x * sh2.x * (x + W.w * u) + m2.y * sh2.y * (x - W.w * (.7 * u - .6 * v));
face = dot(m3, vec3(1.0, 2.0, 3.0) + 2.5 * sg) + dot(m2, vec2(9.0, 11.0));
d3 += 9.0 * m3; h2 += 9.0 * m2; e = min(min(d3.x, min(d3.y, d3.z)), min(h2.x, h2.y));
big = max(W.x, W.y); along = chGeo ? sat(1.0 + O.x / tall) : sat(.5 + .5 * O.x / C.w);
n = normalize(n + slant * x + 1e-5);
if (!glass) n = -rd;
ri = refract(rd, n, .66);
vec3 dl = vec3(dot(ri, u), dot(ri, nb), 0.0); dl.z = dl.x - dl.y; dl += 1.3e-6;
vec3 ex = (W.xyz * sign(dl) - f3) / dl;
far = max(min(ex.x, min(ex.y, ex.z)), 0.0);
m3 = step(ex, vec3(far)); sg = sign(dl);
n2 = normalize(m3.x * sg.x * u + m3.y * sg.y * nb + m3.z * sg.z * (u - nb) + slant * x + 1e-5);
face2 = dot(m3, vec3(1.3, 2.1, 5.7));
e2 = .5 * (min(max(ex.x, ex.y), min(max(ex.y, ex.z), max(ex.x, ex.z))) - far);
sd = cross(n, x);
q2 = q + ri * far; O2 = O + far * vec3(dot(ri, x), dl.x, (dl.y - .5 * dl.x) * 1.1547);
vec3 hue = uKind[int(min(mod(kk, 5.0), 4.0))];
if (CHUED && chGeo) hue = mix(mix(uKind[0], uKind[1], smoothstep(-.9, -.2, q.x / chG)), uKind[3], smoothstep(.1, .8, q.x / chG + .05 * (seed - 4.0)));
tint = mix(vec3(.75, .72, .74), tint, smoothstep(.1, .8, along));
if (CHGEM > 0.0) tint = mix(tint, hue * hue * 1.5, CHGEM);
float bi = float(i), al = mix(along, 1.0 - along, float(i == 4));
float lv = dot(vec4(equal(vec4(kk), vec4(0.0, 1.0, 2.0, 3.0))), vec4(uDrone, uPad, uTexture, uPhrase)) + .7 * uHits * float(kk == 4.0);
if (CHMOVED && moved) lv += .5 * uHits;
float gp = (fract(al * 9.0 - uTravel * .08 + bi * .37) - .5) * 14.0, fo = 1.0 / (1.0 + al * (2.2 + 4.0 * al * al)), hp = dot(q.xy - 1.6 * wander, q.xy - 1.6 * wander);
gp = 1.0 / (1.0 + gp * gp);
glow = uKind[int(min(kk, 4.0))] * (lv * fo * (5.5 * fo * fo + .08) + band(chGeo ? seed / 9.0 : al) * mix(gp * gp, .2, float(chGeo)) * (.15 + lv) * fo) * (.5 + 1.1 * uEnergy) * step(kk, 4.5);
glow = chGeo ? glow * (.5 + 3.0 * tint) + (uKind[4] + .3) * uHits * 2.0 / (1.0 + hp * (1.4 + 2.0 * hp)) : glow;
glow += uKind[3] * uKeys * smoothstep(.35, 1.0, along) * (chGeo ? step(6.5, seed) : step(8.5, bi));
if (CHDAY > 0.0) glow *= 1.0 + 2.2 * CHDAY;
if (CHOWN > 0.0) glow = glow * (1.0 + 1.6 * CHOWN) + CHOWN * hue * hue * (.5 + 1.4 * lv) * (.3 + .9 * fo);
float st = 4.0 / (.25 + big);
vec3 qr = q + vec3(.6, -.5, .4) * q.yxx;
vec3 N = vec3(0.0, chNoise(qr * 8.1), chNoise(glass ? vec3(dot(q, sd) * 35.0, O.x * 1.2, face * 9.0) : qr * (chGeo ? 6.0 : 23.0)));
vec4 D1 = chNoiseD(glass ? mix(O, O2, .12) * vec3(.5, st, st) + seed * 11.0 : qr * 1.7), D2 = chNoiseD(glass ? mix(O, O2, .6) * vec3(.5, st, st) + seed * 11.0 : qr * 4.3);
vec2 A = vec2(D1.x, D2.x); N.x = A.y;
float a1 = 1.0 / (1.0 + dot(v1, v1)), a2 = 1.0 / (1.0 + dot(v2, v2));
rk = chGeo ? along * .9 - .1 : rk;
if (glass) {
 float fine = (N.z - .5) * sat(.015 / px), cw = .012 + .07 * big * smoothstep(.55, .85, N.y), w = max(cw, 1.5 * px);
 float chip = (1.0 - smoothstep(.4 * w, w, e)) * min(1.0, cw / w), cloud = .5 * (A.x + A.y) * (chGeo ? .6 : 1.0);
 vec3 nn = normalize(n + sd * .26 * fine + chip * (N.yzx - .5) * 1.3);
 vec2 sh = abs(fract(vec2(.55, .45) * O.x + vec2(.5, .9) * O.y - vec2(.4, .1) * O.z + vec2(.1, .43) + .3 * seed) - .5);
 float veil = dot((1.0 - smoothstep(vec2(0.0), vec2(.09), sh)) * smoothstep(vec2(.4), vec2(.7), A) * .7 + .42 * smoothstep(vec2(.55), vec2(.8), A), vec2(1.0));
 float fw = sat(dot(rd, l1)); fw *= fw * fw;
 float tk = chGeo ? 1.1 + 1.2 * cloud : .5 + .9 * cloud, frost = (chGeo ? .5 : .25) + .3 * cloud + .6 * chip;
 vec3 L1 = chKeyC * a1 * exp(-tk * th), L2 = chFarC * vec3(1.0, .9, .8) * a2 / (1.0 + tk * far * (.5 + .2 * tk * far));
 vec3 milk = mix(chGeo ? vec3(.6, .64, .62) : vec3(.52, .60, .58), vec3(.90, .83, .72), smoothstep(.1, .8, cloud)) * tint;
 c = milk * (L1 * (frost * sat(dot(nn, l1)) + (chGeo ? .03 : .14 + 2.4 * fw * fw) + .35 * veil) + L2 * (frost * sat(dot(nn, l2)) + .2 + .35 * veil));
 c += milk * vec3(.8, .95, 1.1) * ((chGeo ? .02 : .11) + .04 * uLevel) * sat(.1 + dot(nn, vec3(-.62, .62, -.48))) * (.4 + cloud);
 vec3 back = chEnv(q2, reflect(ri, -n2)) * (.6 + fract(face2 * 3.1 + seed * .37));
 back += (L1 + L2) * .16 * (1.0 - smoothstep(0.0, .05 + px, e2));
 if (CHGEM > 0.0) { c *= 1.0 - .45 * CHGEM; back = back * (1.0 + 3.0 * CHGEM) + CHGEM * .5 * (L1 + L2) * (.25 + fract(face2 * 3.1 + seed)); }
 c += back * tint / (1.0 + far * (.5 + cloud) * (1.0 + far));
 c += glow * (.1 + .7 * cloud * cloud + .9 * veil + .4 * chip);
 vec3 fill = vec3(0.0);
 if (CHDAY > 0.0) c *= mix(vec3(1.0), hue * 1.3, CHDAY * sat(fo * lv));
 if (CHFILL) { fill = chFill(nn, open); c += fill * milk * (.45 + .6 * cloud) * (1.0 - .5 * CHGEM); }
 if (CHDULL > 0.0) {
 c = mix(c, hue * (.45 + .5 * cloud + .3 * fine) * (1.0 + chip) * ((L1 + chKeyC * a1 * .25) * (.1 + .9 * sat(dot(nn, l1))) * .9 + L2 * (.12 + sat(dot(nn, l2))) + fill + .02) + glow * .35, CHDULL);
 }
 float fr = 1.0 - sat(-dot(rd, nn)); fr *= fr;
 c += chEnv(q, reflect(rd, nn)) * ((chGeo ? .35 : .08) + 1.4 * fr * fr) * (1.0 - .6 * CHDULL);
 if (CHOP > 0.0 && !chGeo) c += open * chSky(reflect(rd, nn)) * (.04 + .5 * fr * fr) * (1.0 - .7 * CHDULL);
 float dust = max(1.0 - smoothstep(.05, .55, rk + .35 * (N.y - .5)), .5 * smoothstep(.5, .75, N.x) * sat(n.y));
 c *= mix(vec3(1.0), CHDUST, dust) * smoothstep(-.05, .4, rk);
} else {
 n = normalize(slope / (length(slope) + 1e-4) - (D1.yzw * .7 + D2.yzw * .6) * (chGeo ? .35 : 1.0) + (N - .5) * .5 * (chGeo ? .4 : 1.0));
 vec3 alb = mix(vec3(.042, .016, .008), vec3(.075, .031, .014), N.y) * (.6 + .5 * A.x + .4 * N.z);
 if (chGeo) {
 alb = bk < -2 ? vec3(.05, .04, .06) * (.3 + N.z) : mix(vec3(.34, .33, .34), vec3(.085, .08, .076) * (.8 + .5 * N.x + .6 * N.z), smoothstep(.02, .07, lip + .05 * (N.y - .5)));
 }
 if (uOwn[3] > 0.0) {
 vec3 chalk = vec3(.5, .47, .44) * (.72 + .3 * A.x + .2 * N.z);
 if (chGeo && bk > -3) { float bd = lip + .02 * (A.x - .5); chalk *= mix(vec3(1.0), mix(vec3(.32), uKind[2], .45) * 1.3, (.5 + .5 * sin(bd * 95.0 + 2.5 * sin(bd * 31.0))) * smoothstep(.75, 0.0, bd)); }
 alb = mix(alb, chalk, uOwn[3] * (bk < -2 ? .5 : 1.0));
 }
 float gleam = 0.0;
 if (uOwn[3] < 0.0) { alb = mix(alb, vec3(.011, .012, .014) * (.6 + N.z), -uOwn[3]); gleam = sat(dot(reflect(rd, n), l1)); gleam *= gleam; gleam = -.16 * uOwn[3] * gleam * gleam * gleam * gleam; }
 c = alb * (chKeyC * a1 * (chGeo ? 1.0 : min(50.0 * a1, 1.6)) * exp(-1.5 * th) * sat(.08 + .92 * dot(n, l1)) + chFarC * a2 * sat(.1 + .9 * dot(n, l2)) * 5.0 / (1.0 + 2.0 * a2) + .01);
 if (CHFILL) c += alb * chFill(n, open);
 if (uOwn[3] < 0.0) c += gleam * chKeyC * a1;
}
c /= 1.0 + .03 * (.6 + .8 * uSpace) * t * (1.0 + .015 * t);
if (CHOP > 0.0 && !chGeo) c = mix(c, chSky(rd), open * (1.0 - exp(-t * t * .0011)));
col += c * (k == 0 ? cov : 1.0 - cov);
if (cov > .95) break;
}
float tEnd = cov > .5 ? T0 : T1, haze = .6 + .8 * uSpace;
if (!chGeo) {
col += chFarC * chAir(ro, rd, tEnd, chFar) * .0045 * haze + chKeyC * chAir(ro, rd, tEnd, chKey) * .0006 * haze;
float fz = 14.0 - ro.z; vec2 fp = ro.xy + rd.xy / rd.z * fz - vec2(-2.65, -1.7);
if (tEnd * rd.z > fz && max(abs(fp.x), abs(fp.y)) < .8) {
 float fd = min(min(length(fp - vec2(.015, .55)) - .085, .12 * length(vec2(fp.x, fp.y - .18) / vec2(.13, .32)) - .12), max(abs(abs(fp.x + .01) - .055) - .042, abs(fp.y + .2) - .3));
 col *= .2 + .8 * smoothstep(-.5, .5, fd * uRes.y / fz);
}
}
if (CHWET > 0.0 && mirror < 1.0) col = mix(uKind[0] * uKind[0] * .02, col, mirror);
return screenOf(col * 1.6);
}
