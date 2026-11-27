// name: Sail caravan
// a: Salt crossing
// b: Ice boats
// what: A white salt plain cracked into six-sided plates, and a caravan of carts under patched sails, the nearest so near that the late sun glows through its cloth, and far ahead one small blue sail; or night on a frozen lake: ice boats under tall pale sails, stars and moonlight in black ice, the white scratches of their runners.
// follows: Each kind has a sail: its level fills the cloth and lights it in its colour. Drone lengthens shadows and mirage, pad is the sun or moon behind, texture blows salt or frost, phrase passes a gust along. A hit lights one sail, a cue leans them all and runs light over them. Bands are battens, the piece is the patches, loop moves the blue sail, keys glint.
// own: 0 white noon at -1, red dusk at 1 (b: winter day, rose dusk); 1 red clay at -1, black gravel at 1 (b: snow on the ice, clear green ice); 2 pointed sails at -1, broad square ones at 1 (b: gaff sails, square heads); 3 only the nearest and the blue one at -1, all six abreast at 1; 4 an eye near the ground at -1, high above at 1; 5 a cloudy sky at -1, blowing salt or frost at 1

#define scZ smoothstep
float scPx, scQ, scFx, scHz, scE, scHa, scNt, scTn, scAl, scFl, scLv, scGu, scS, scSd, scW, scPan, scRo, scSpan;
vec2 scAt[6], scSun, scUv, scT, scC, scH, scP;
vec3 scTop, scLow, scLit, scSh, scGl, scDk, scMs, scKc, scDyA, scDyB, scDyC;
int scK;
bool scB;

// A colour of the hour: in the middle, at -1, at 1.
vec3 scPk(vec3 m, vec3 a, vec3 b) { return mix(m, uOwn[0] < 0. ? a : b, abs(uOwn[0])); }
int scKind(int k) { return k == 1 ? 4 : k == 2 ? 0 : k == 3 ? 3 : k == 4 ? 2 : 1; }
vec3 scHue(int k) { vec3 c = uKind[scKind(k)]; return c/max(max(c.r, max(c.g, c.b)), .15); }
float scLe(int k) { return k == 1 ? uHits : k == 2 ? uDrone : k == 3 ? uPhrase : k == 4 ? uTexture : k == 5 ? uLevel*.6 : uPad; }
float scOn(int k) { return k == 0 || k == 5 ? 1. : sat(1.+min(uOwn[3], 0.)*(1.6 - .16*float(k))); }
// 1 at 0, falling to 0 at a.
float scNr(float a, float x) { return 1. - scZ(0., a, x); }
float scLn(vec2 q, vec2 a, vec2 b) { vec2 v = b - a, u = q - a; return length(u - v*sat(dot(u, v)/dot(v, v))); }
// Inside an edge, scQ being a pixel here; and a thin line, never thinner than a pixel but paler.
float scIn(float d) { return sat(.5 - d/scQ); }
vec3 scMist(vec3 c) { return mix(c, scMs, scTn); }
void scPut(inout vec3 col, vec3 c, float d) { col = mix(col, c, scIn(d)); }
float scTh(float d, float w, float px) { return sat(.5 - (d - max(w, .5*px))/px)*min(1., 2.*w/px); }
float scTh(float d, float w) { return scTh(d, w, scQ); }
// Soft noise that repeats every 64 across, for what drifts for hours.
float scDrift(vec2 p) {
	vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
	float a = mod(i.x, 64.), b = mod(i.x+1., 64.);
	return mix(mix(hash21(vec2(a, i.y)), hash21(vec2(b, i.y)), f.x), mix(hash21(vec2(a, i.y+1.)), hash21(vec2(b, i.y+1.)), f.x), f.y);
}

// Where q is on the sail (scUv: luff to leech, foot to head); gives how far outside it.
float scCloth(vec2 q) {
	float u = sat((q.x - scT.x)/(scC.x - scT.x)), v = .5, w = .5, h = 1., k;
	for (int i = 0; i < 2; i++) {
		float a = mix(scT.y, scC.y, u);
		h = mix(scH.y, scP.y, u) - a;
		v = clamp((q.y - .3*scFl*u*(1. - u)*(.15+v) - a)/h, -.3, 1.3);
		k = sat(4.*v*(1. - v));
		float l = mix(scT.x, scH.x, v) - .02*k*scFl;
		w = max(mix(scC.x, scP.x, v)+scRo*k - l, .03);
		u = clamp((q.x - l)/w, -.3, 1.3);
	}
	float f = fract(v*scPan), bite = f*(1. - f)*(.112 - .08*uVar)*(1.3 - .8*scFl);
	scUv = vec2(u, v); scW = w; scSpan = h;
	return max(max(-u*w+.5*bite, (u - 1.)*w+bite), max(-v, v - 1.)*h);
}
// The dyed patchwork at scUv: rgb its colour, a how thick it is (seams and patches let less light through).
vec4 scDye() {
	float row = floor(sat(scUv.y)*scPan*.999), r1 = fract(row*.618+scSd*.37), n = 2.6+1.6*r1, cu = scUv.x*n+r1*7.;
	float t = hash21(vec2(floor(cu)*(1. - uVar)+scSd*7., row+scSd*3.)), e = min(fract(cu), 1. - fract(cu))/n*scW;
	vec3 c = mix(mix(scDyA, scDyB, scZ(.38, .42, t)), scDyC, scZ(.62, .66, t));
	c *= .86+.28*fract(t*91.7);
	float thick = .45*scTh(e, .0035)*(1. - uVar);
	// what is sewn on over it
	vec2 z = vec2(2.3, 3.6), g = scUv*z+vec2(1.7, .9)*scSd, f = fract(g) - .5, hh = hash22(floor(g)+scSd*5.);
	f -= (hh - .5)*.2; f += vec2(-f.y, f.x)*(hh.x - .5)*.3;
	vec2 ab = (abs(f) - .17 - .17*hh.yx)/z*vec2(scW, scSpan);
	float d = max(ab.x, ab.y), here = step(.42, hh.y)*step(uVar, .5), on = scIn(d)*here;
	c = mix(c, mix(scDyC, scDyB, step(.5, hh.x))*(.8+.35*hh.x), on*.85);
	thick += on*.22+here*.5*scTh(abs(d), .0022);
	float dash = scZ(.25, .4, abs(fract((ab.x > ab.y ? f.y*scSpan/z.y : f.x*scW/z.x)*46.) - .5));
	return vec4(c, thick+here*.7*scTh(abs(d+.011), .0016)*dash*(1. - scZ(.002, .006, scQ)));
}

// Six-sided plates at g: x how far from the edge, y a pixel there, z the plate's own number, w how its rim faces the light.
vec4 scPlates(vec2 g, vec2 ft, vec2 off, vec2 toSun) {
	vec2 w = mod(off, 64.), base = floor(vec2(g.x - g.y*.57735, g.y*1.1547)+w+.5), A = vec2(9.), B = A, ia = vec2(0.);
	float da = 1e3, db = 1e3;
	for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
		vec2 c = base+vec2(i, j), id = mod(c, 64.), l = c - w;
		vec2 r = vec2(l.x+.5*l.y, l.y*.866)+(hash22(id+.5) - .5)*.5 - g;
		float d = dot(r, r);
		if (d < da) { db = da; B = A; da = d; A = r; ia = id; } else if (d < db) { db = d; B = r; }
	}
	vec2 n = normalize(B - A+1e-5);
	return vec4(max(dot(.5*(A+B), n), 0.), dot(abs(n), ft), hash21(ia+7.3), dot(n, toSun));
}

vec3 scSky(vec2 p) {
	float y = p.y - scHz, r = length((p - scSun)*vec2(.8, 1.)), o5 = uOwn[5], cloudy = max(-o5, 0.);
	vec3 c = mix(scLow, scTop, sat(y*(2.1 - 1.15*y)));
	vec2 q = vec2(p.x*.9 - p.y*1.6, p.y*7.+p.x*1.2)+vec2(mod(uTime*.004, 64.), 4.);
	float n = scDrift(q)*.62+scDrift(q*vec2(3., 3.4)+9.)*.38;
	float cl = scZ(.48 - .25*cloudy, .85 - .2*cloudy, n)*scZ(.02, .2, y);
	c = mix(c, mix(scLow, scGl, .3), cl*min((.55 - .35*scNt)*(.7+.3*uHigh)*(1.+.9*cloudy), .95));
	c += scGl*((.2+.18*uPad*(.4+uEnergy)+.3*uCue+.2*uMic)*exp(-r*3.2)+.16*exp(-r*r*60.))*(1. - .55*scNt)*(1. - .4*max(o5, 0.))*(scB ? 1. - .55*max(-uOwn[0], 0.) : 1. - .45*max(uOwn[0], 0.));
	if (scB) { // stars
		vec2 g = p*31., f = fract(g) - .5, h = hash22(floor(g)+3.);
		float m = fract(h.x*91.7+h.y*37.), st = scNr(.02+.07*m*m+scPx*27., length(f - (h.yx - .5)*.8))*step(.72, h.x)*(.15+m*m*m);
		c += vec3(.8, .88, 1.)*st*scNt*scNt*scNt*scZ(0., .16, y)*(1. - cloudy*cl)*(.75+.25*sin(uTime*(.4+h.x)+h.y*40.))*sat(1. - o5);
	}
	return c;
}

// The sail in its light: p in the picture, q beside the mast.
void scSail(inout vec3 col, vec2 p, vec2 q) {
	float d = scCloth(q);
	if (d < scQ+.012) {
		vec2 uv = scUv;
		vec4 dye = vec4(scDyA, 0.), m = vec4(0.);
		if (scS > .05) dye = scDye();
		float f = fract(uv.y*scPan), nb = floor(uv.y*scPan+.5), bd = abs(uv.y*scPan - nb)/scPan*scSpan;
		// folds when it hangs, panels and belly when it fills
		float slack = (1. - scFl)*(1. - .5*uVar), mid = uv.x - .42;
		float fold = noise(vec2(uv.x*11.+uv.y*3.+.6*scFl, uv.y*2.2+scSd)) - .5;
		fold += .2*sin(uv.x*34.+uv.y*9.+fold*7.+scSd);
		float panel = (f - .5)*(.2+.5*scFl)+.12*fold;
		float belly = scB ? .35 - 1.35*uv.x+.7*uv.x*uv.x : -1.2*scFl*mid*abs(mid);
		float shade = 1.+.75*slack*fold+.5*panel+belly;
		vec3 alb = dye.rgb;
		// the piece is the patchwork
		if (scS > .1) m = piece(sat(mix(vec2((floor(uv.x*5.)+.5)/5., 1. - (floor(uv.y*scPan)+.5)/scPan), vec2(uv.x, 1. - uv.y), uVar)));
		float grey = dot(alb, vec3(.4));
		alb = mix(alb, m.rgb/max(m.a, .08)*(.45+.6*grey), m.a*(scB ? .35 : .5)*scZ(.1, .4, scS));
		alb = mix(alb, (.35+.65*grey)*scKc, sat(scLv)*(scB ? .25 : scK == 0 ? .26 : .5));
		// the light through it
		vec2 to = (p - scSun)*vec2(1., .85);
		float rr = dot(to, to), near = exp(-rr*16.), core = near*near*near; core *= core*near;
		float thin = 1./(1.+dye.a*(1.+.8*dye.a));
		float thru = (.62+.4/(1.+3.*rr)+1.1*near*(.8+.5*uPad)+(1. - uVar)*2.2*core*(.7+.6*uPad))*(1.+.4*scLv*(.4+uEnergy));
		thru *= (1.+.4*scGu)*(1.+1.1*uCue*scNr(.45, abs(uv.y - 1.2+1.3*(1. - uCue))));
		if (scK == 1) thru *= 1.+.6*uHits;
		vec3 c = alb*(scGl*thru*thin*mix(.78, .85, scNt)+mix(scSh, scLit, .3*scNt)*.34)*shade;
		// in b a lantern at the foot, its sound's colour
		if (scB) c += mix(vec3(1., .72, .42), scKc, .75*sat(scLv*1.5))*alb*exp(-length(vec2((uv.x - .35)*scW, uv.y*scSpan))*2.8)*(.1+.75*scLv*(.5+uEnergy))*(1. - .5*abs(panel));
		float top = max(c.r, max(c.g, c.b));
		c *= mix(1., (1. - exp(-1.55*top))/max(top, .02)*1.08, .85);
		c = mix(c, scGl, .4*core*(1. - uVar)*thin);
		// the mast shows through, dark
		c *= 1. - .45*scTh(abs(q.x+.05 - .03*q.y), .011);
		// battens, sixteen between the two nearest
		if (nb > .5 && nb < scPan - .5) {
			float lit = scK < 2 ? uBands[clamp(int(nb) - 1+scK*8, 0, 15)] : uLevel*.5;
			c *= 1. - .3*scNr(.02, bd)*step(f, .5);
			c = mix(c, mix(scDk*1.25, scGl*.95, .18+.75*lit*(.4+.6*uEnergy)), scTh(bd, scB ? .0035 : .0062));
		}
		c = mix(c, scDk, .5*scTh(abs(d+.003), .003));
		scPut(col, scMist(c), d);
		// yard and boom
		col = mix(col, scMist(scDk), scTh(min(abs(uv.y - 1.), abs(uv.y))*scSpan, scB ? .006 : .009)*step(abs(uv.x - .5), .5));
	}
}

// A wheel: rim, spokes of one fixed softness, and hub.
float scWheel(vec2 q, float r, float turn) {
	float l = length(q), k = atan(q.y, q.x+1e-6)+turn+fract(uTravel*.12/(TAU*r))*TAU;
	float spoke = abs(fract(k*1.59155) - .5)*l*.62832 - .004;
	return max(max(scIn(abs(l - r+.007) - .0085), scIn(l - .024)), sat(.5 - max(spoke, l - r)/(scQ+.003))*.95);
}
// A cart: q from the ground under its mast, one length high.
void scCart(inout vec3 col, vec2 q) {
	vec3 dk = scMist(scDk), rim = scMist(mix(scDk, scGl, .5));
	vec4 w = q.x < .04 ? vec4(-.2, .135, .098, 1.) : vec4(.33, .155, .12, 1.);
	col = mix(col, mix(dk, scMs, .14), scWheel(q - w.xy, w.z, w.w));
	if (q.x < -.45) { // the jar on its rope
		vec2 j = rot(.09*sin(uTime*.7+scSd))*(q - vec2(-.535, .245));
		col = mix(col, dk, scTh(scLn(j, vec2(0.), vec2(0., -.07)), .0026));
		scPut(col, mix(dk, rim, .5*scNr(.016, abs(j.x+.018))*step(j.y, -.07)), min(length((j+vec2(0., .108))*vec2(1., .82)) - .034, max(abs(j.x) - .012, abs(j.y+.07) - .012)));
	}
	// the hull of planks, with a beam at each end
	float x = q.x - .02, top = .165+.32*x*x*(x < 0. ? 1.5 : .9), bot = .085+.42*x*x;
	float hull = max(max(q.y - top, bot - q.y), abs(x) - .4 - (q.y - bot)*(x < 0. ? .88 : .33));
	vec3 c = mix(mix(dk, rim, .05+.16*noise(vec2(q.x*9., q.y*120.))), dk*.6, .7*scZ(.4, .5, abs(fract((q.y - bot)/max(top - bot, .01)*3.) - .5)));
	scPut(col, mix(c, rim, .75*scTh(abs(q.y - top+.004), .0045)), hull);
	scPut(col, dk, scLn(vec2(abs(q.x), q.y), vec2(.3, .2), vec2(.56, .25)) - .006);
	// bundles and somebody in a wide hat
	float b = min(length((q - vec2(.17, .2))*vec2(.75, 1.)) - .045, length(q - vec2(.08, .2)) - .04);
	scPut(col, mix(dk*1.4, rim, .55*scZ(.205, .24, q.y)), min(b, max(abs(q.x+.2) - .055, abs(q.y - .205) - .035)));
	float man = min(max(length((q - vec2(.385, .2))*vec2(1.35, .8)) - .052, .19 - q.y), length(q - vec2(.378, .265)) - .019), hat = q.y - .275;
	scPut(col, mix(dk, rim, .35*scZ(0., .05, .385 - q.x)), man);
	scPut(col, mix(dk*1.3, rim, .8*scZ(.01, .03, hat)), max(abs(q.x - .378)*.5+hat - .03, -hat));
	w = q.x < 0. ? vec4(-.27, .1, .105, 0.) : vec4(.27, .125, .13, 0.);
	col = mix(col, mix(dk*.8, rim, .12), scWheel(q - w.xy, w.z, w.w));
}
// An ice boat: a long thin hull on a cross plank and three runners.
void scBoat(inout vec3 col, vec2 q) {
	vec3 dk = scMist(scDk), rim = scMist(mix(scDk, scLit, .7));
	q.y += .05*q.x;
	float x = q.x - .03, r = min(scLn(q, vec2(.17, .05), vec2(-.06, .15)) - .009, scLn(q, vec2(-.14, .118), vec2(0., .112)) - .006);
	scPut(col, mix(dk, rim, .45), r);
	float hull = max(abs(q.y - .1 - .03*x*x) - .036*sqrt(max(1. - x*x*2.5, 0.)), abs(x) - .63);
	scPut(col, mix(dk, rim, .85*scZ(-.01, .03, q.y - .1)+.08), hull);
	r = min(scLn(q, vec2(-.53, .02), vec2(-.54, .1)) - .006, scLn(q, vec2(-.6, .012), vec2(-.47, .01)) - .009);
	r = min(min(r, scLn(q, vec2(.17, .015), vec2(.17, .05)) - .008), scLn(q, vec2(.07, .01), vec2(.28, .012)) - .011);
	scPut(col, mix(dk, rim, .6*scZ(0., .014, q.y)), r);
	float man = min(length((q - vec2(.36, .145))*vec2(.5, 1.)) - .03, length(q - vec2(.3, .175)) - .022);
	scPut(col, mix(dk, rim, .1), man);
}
// What stands and is stretched: mast, stays, the fan of sheets.
void scRig(inout vec3 col, vec2 t) {
	vec3 dk = scMist(scDk), wire = scB ? scMist(mix(scDk, scLit, .5)) : dk;
	col = mix(col, dk, scTh(scLn(t, vec2(-.044, scB ? .12 : .18), vec2(-.01, scB ? 1.56 : 1.14)), .011*(1.25 - .5*t.y)));
	col = mix(col, wire, .7*scTh(scLn(t, vec2(-.012, scB ? 1.4 : 1.12), scB ? vec2(-.5, .12) : vec2(-.55, .25)), .0016));
	for (int i = 0; i < (t.x > .2 && scS > .07 && !scB ? 4 : 0); i++) {
		float v = .16+.22*float(i);
		col = mix(col, dk, .75*scTh(scLn(t, mix(scC, scP, v)+vec2(scRo*4.*v*(1. - v), 0.), vec2(.56, .23)), .0014));
	}
}
// The corners of a sail: tack, clew, throat, peak.
void scForm() {
	float lo = max(-uOwn[2], 0.), hi = max(uOwn[2], 0.);
	scT = scB ? vec2(-.03, .22) : vec2(-.25 - .11*hi, .29);
	scC = scB ? vec2(.5+.1*lo - .08*hi, .2) : vec2(.41+.05*lo, .26);
	scH = scB ? mix(mix(vec2(-.01, 1.5), vec2(0., .9), lo), vec2(-.04, 1.4), hi) : mix(mix(vec2(-.2, .88), vec2(-.04, 1.12), lo), vec2(-.34, 1.06), hi);
	scP = scB ? mix(mix(vec2(.03, 1.56), vec2(.36, 1.25), lo), vec2(.3, 1.4), hi) : mix(mix(vec2(.21, 1.14), vec2(0., 1.2), lo), vec2(.36, 1.08), hi);
	scPan = scB ? 9. : 7.; scRo = scB ? .05 : .065 - .045*hi;
}
// Takes boat k in hand.
void scTake(int k) {
	float fk = float(k), w = sin(uTime*.5 - fk*1.15), far = max(1. - 1.6*scAt[k].y, 0.);
	scK = k; scS = scAt[k].y; scSd = 1.7+fk*2.3;
	scLv = scLe(k); scKc = scHue(k); scAl = scOn(k);
	scGu = uPhrase*(.5+.5*w)*(.5+.5*w);
	scFl = sat((scB ? .7 : .24)+.65*(k == 1 ? 4.*uHits*(1. - uHits) : scLv)+.06*w+.2*scGu+.5*uCue*(1. - uCue));
	scTn = sat(scHa*far*far*far)*(k == 5 ? .4 : 1.);
	vec3 rust = vec3(.72, .3, .16), bone = vec3(.93, .83, .66), slate = vec3(.38, .42, .52), ochre = vec3(.86, .56, .24);
	scDyA = k == 1 || k == 4 ? bone : k == 2 ? slate : k == 3 ? ochre : rust;
	scDyB = k == 1 ? vec3(.84, .68, .5) : k == 2 ? vec3(.5, .5, .56) : k > 2 ? rust : ochre;
	scDyC = k == 0 ? bone : k == 2 ? rust : slate;
	if (scB) { scDyA = vec3(.83, .86, .9); scDyB = scDyA*.96; scDyC = scDyA*1.04; }
	if (k == 5) { scDyA = scDyB = scDyC = scB ? vec3(.3, .5, 1.) : vec3(.06, .22, .78); scKc = vec3(.2, .4, 1.); }
}

// The plain: salt and shadows, or ice that mirrors sky.
vec3 scGround(vec2 p, vec3 sky) {
	float s = max((scHz - p.y)/scE, .004), fz = 1.1*scPx/(s*s*scE), fx = scPx/s, o1 = uOwn[1], hi = max(o1, 0.), lo = max(-o1, 0.);
	vec2 g = vec2(p.x/s, 1.1/s), dir = vec2(1., scB ? -.5 : -.25);
	float far = exp(-s*7.), scale = scB ? .42 : 2.7, moved = uTravel*(scB ? .2 : .12), road = (p.x - scSun.x)/(scB ? .02+.1*s : .13+.35*s);
	road = exp(-road*road);
	vec4 pl = scPlates(g*scale, vec2(fx, fz)*scale, -vec2(dir.x - dir.y*.57735, dir.y*1.1547)*scale*moved, normalize(vec2(scSun.x/1.1, 1.)));
	moved = mod(moved, 512.);
	float seam = min(min(moved, 512. - moved)*.3, 1.);
	vec2 gm = g - dir*moved;
	vec3 c = vec3(0.);
	if (!scB) {
		float wr = .055, e = scNr(wr+pl.y, pl.x)*min(1., 1.6*wr/(pl.y+1e-4));
		c = mix(scLit, scSh, .24+.2*(pl.z - .5)+.12*scZ(0., .5, pl.x)*(1. - far));
		c = mix(c, mix(scLit, scGl, .25)*1.04, e*sat(.25 - pl.w*.9)*.8);
		c = mix(c, scSh*.86, e*sat(pl.w*.9+.1)*.75);
		c = mix(c, scLit*1.06, scTh(pl.x, .009, pl.y)*.7);
		c += scGl*road*(.1+.12*uLevel)*(.6+.5*pl.z);
		// shadows, with the colour of each sail in them
		float len = (1.35+1.1*uDrone)*(1.+uOwn[0]*(uOwn[0] < 0. ? .55 : .6));
		int hit[5] = int[5](0, 0, 0, 0, 0), n = 0, i = 0;
		for (int k = 4; k >= 0; k--) {
			vec2 a = scAt[k];
			float h = (1.1/a.y - g.y)/len;
			if (h > -.02 && h < 1.25 && abs(g.x - a.x/a.y+scSun.x/1.1*h*len) < .6) { hit[n] = k; n++; }
		}
		do {
			if (i < n) {
				scTake(hit[i]);
				vec2 a = scAt[scK];
				float h = (1.1/a.y - g.y)/len, x = g.x - a.x/a.y+scSun.x/1.1*h*len, soft = fx+fz/len*.5+.012+.03*h;
				vec2 q = vec2(x, h);
				float body = max(max(abs(x - .02) - .46, abs(h - .12 - .3*x*x) - .045), -h);
				body = min(body, abs(x < 0. ? length(q - vec2(-.27, .1)) - .1 : length(q - vec2(.27, .125)) - .12) - .01);
				float sl = sat(.5 - scCloth(q)/soft);
				vec3 dye = mix(mix(scDyA, scDyB, .5+.5*sin(scUv.y*16.+scUv.x*5.+scSd)), scKc*.8, .4*scLv);
				c = mix(c, c*mix(vec3(1.), dye, .85)*.9+scGl*dye*(.17+.2*scLv), sl*.85*scAl*(1. - .3*h));
				c = mix(c, c*scSh*.74, max(sat(.5 - body/soft), scTh(abs(x+.045), .012, soft))*(1. - .7*sl)*.8*scAl);
			}
			i++;
		} while (i < n);
	}
	if (scB) {
		float dp = scZ(.1, 1.3, s), gr = mix(.5, noise(gm*vec2(5., 3.)), seam), brk = mix(.5, noise(gm*vec2(14., 9.))*.6+noise(gm*vec2(41., 21.))*.4, seam);
		c = mix(sky*mix(.8, .32, dp), scSh, .25+.4*dp);
		c = mix(c, mix(scSh, vec3(.02, .3, .32)*(.25+.75*dot(scLit, vec3(.33))), .8), .75*hi*(.4+.6*dp));
		// cracks that go down, and old snow lying on it
		float ck = abs(pl.x+.03*(gr - .5));
		c += scLit*(.14+.4*hi)*scTh(ck, .0015+.005*pl.z*pl.z, pl.y)*scZ(.3, .6, pl.z+hi);
		c += scLit*(.035+.1*hi)*scNr(.16, ck)*pl.z;
		float snow = scZ(.62 - .75*lo, .95 - .75*lo, mix(.5, noise(gm*vec2(.9, 1.7)+3.), seam)*.7+gr*.3);
		c = mix(c, mix(scSh, scLit, .45+.2*gr)*(1. - .28*scNt)+scGl*road*.25, snow*(.35+.5*lo));
		c += scGl*road*(.16+.6*scZ(.35, .75, brk))*(.5+.4*uPad+.5*uCue)*(1. - .6*snow);
		// the scratches of the runners, behind each boat and away past us
		for (int k = 4; k >= 0; k--) {
			vec2 a = scAt[k], h = normalize(vec2(1., .5+.12*float(k)));
			vec2 v = g - vec2(a.x, 1.1)/a.y;
			float R = 4.6+1.5*float(k), lv = scLe(k), back = -dot(v, h);
			v -= R*vec2(h.y, -h.x);
			float l = length(v), rd = abs(l - R);
			float m = scTh(min(rd, abs(rd - .15)), .0075, dot(abs(v), vec2(fx, fz))/max(l, .01))*scZ(-.05, .1, back)/(1.+.13*max(back, 0.))*scOn(k);
			float run = uCue*scNr(.6, abs(back - 5.*(1. - uCue)))+(k == 1 ? uHits*scNr(.5, abs(back - 3.*(1. - uHits))) : 0.);
			c += mix(scLit, scLit*scHue(k), .5*sat(lv))*m*(.36+.45*lv*(.5+uEnergy)+.9*run)*(1.+1.5*road)*(.55+.75*gr);
		}
	}
	// keys are crystals that catch the light
	vec2 kg = gm*vec2(13., 8.);
	float kh = hash21(mod(floor(kg), 64.)+.7);
	c += scGl*step(.86, kh)*scNr(.3, length((fract(kg) - .5)*vec2(1., .8)))*(.1+1.8*uKeys)*scZ(.25, .8, s)*(.5+.5*sin(uTime*(.5+kh)+kh*90.));
	// mirage
	c = mix(c, mix(mix(scLow, scTop, .62), scMs, scNt), exp((p.y - scHz)*mix(38., 18., uDrone))*(.85 - .5*scNt));
	return mix(c, scMs, sat(scHa*far*.55));
}

vec3 render(vec2 p) {
	scB = uVar > .5;
	float o4 = uOwn[4], o5 = uOwn[5], hz0 = scB ? 0. : -.1;
	scPx = 1.15/uRes.y; scFx = clamp(uRes.x/uRes.y/1.778, .5, 1.2);
	scHz = hz0+(o4 < 0. ? .17 : .27)*o4;
	scE = (scHz+(scB ? .31 : .37))/(scB ? .62 : .86);
	// the hour: evening, noon and dusk on the salt; night, day and dusk on the ice
	if (!scB) {
		scTop = scPk(vec3(.5, .55, .74), vec3(.3, .55, .8), vec3(.17, .12, .25));
		scLow = scPk(vec3(.95, .86, .83), vec3(.86, .92, .95), vec3(.86, .36, .22));
		scGl = scPk(vec3(1., .83, .56), vec3(1., .96, .86), vec3(1., .5, .2));
		float o1 = uOwn[1];
		scLit = scPk(vec3(.95, .92, .92), vec3(.98, .98, .96), vec3(.66, .42, .42))*mix(vec3(1.), o1 < 0. ? vec3(.86, .56, .42) : vec3(.36, .36, .4), abs(o1));
		scSh = scPk(vec3(.68, .64, .78), vec3(.64, .72, .82), vec3(.3, .2, .32))*mix(vec3(1.), o1 < 0. ? vec3(.62, .38, .33) : vec3(.32, .33, .4), abs(o1));
		scDk = scPk(vec3(.16, .115, .14), vec3(.2, .17, .16), vec3(.06, .035, .06));
		scSun = vec2(.46*scFx, .12+(scHz - hz0)*.6);
		scNt = 0.;
	} else {
		scTop = scPk(vec3(.014, .024, .06), vec3(.5, .58, .68), vec3(.17, .15, .33));
		scLow = scPk(vec3(.09, .15, .25), vec3(.88, .88, .88), vec3(.86, .46, .42));
		scGl = scPk(vec3(.82, .88, 1.), vec3(1., .96, .9), vec3(1., .74, .6));
		scLit = scPk(vec3(.72, .8, .92), vec3(.95, .96, .97), vec3(.95, .78, .78));
		scSh = scPk(vec3(.012, .03, .05), vec3(.3, .4, .46), vec3(.12, .09, .18));
		scDk = scPk(vec3(.012, .016, .03), vec3(.12, .13, .16), vec3(.05, .035, .06));
		scSun = vec2(.5*scFx, .3+(scHz - hz0)*.5);
		scNt = 1. - abs(uOwn[0])*(uOwn[0] < 0. ? 1. : .6);
	}
	scMs = mix(scLow, scTop, .33);
	scHa = (.55+.35*uDrone)*(.7+.6*uSpace)*(1.+.8*max(o5, 0.)+.3*uLow);
	scGl *= 1.+.12*(uTone - .5);
	// the boats, near to far: across the picture, and how large a length of one is there
	scAt = vec2[6](vec2(.48+.4*max(.9 - scFx, 0.), .86), vec2(-.17, .39), vec2(-.475, .215), vec2(-.335, .12), vec2(-.61, .084), vec2(-.755, .06));
	if (scB) scAt = vec2[6](vec2(-.43, .62), vec2(.1, .31), vec2(.375, .18), vec2(.66, .12), vec2(.25, .088), vec2(.77, .055));
	for (int k = 0; k < 6; k++) scAt[k] = mix(scAt[k], vec2((scB ? -1. : 1.)*(.68 - .285*float(k)), .32 - .02*float(k)), max(uOwn[3], 0.))*vec2(scFx, 1.);
	scAt[5].x += .025*sin(TAU*uLoop);
	scForm();
	bool under = p.y < scHz;
	vec3 col = vec3(0.), sky = vec3(0.);
	if (!under || scB) sky = scSky(under ? vec2(p.x, 2.*scHz - p.y) : p);
	if (!under) {
		col = sky;
		float y = p.y - scHz;
		// hills float in the mirage
		if (y < .09) {
			float n = noise(vec2(p.x*3.+7., 1.))*.65+noise(vec2(p.x*11.+3., 5.))*.35, hl = .055*scZ(.42, .8, n)+.02*n*n, lift = scB ? 0. : .005+.004*uDrone;
			col = mix(col, mix(mix(scTop, scSh, .5), scLow, scB ? .15 : .5), .7*sat(.5 - max(y - lift - hl, lift*scZ(.002, .02, hl) - y)/scPx));
		}
		if (scB) {
			vec2 m = p - scSun;
			col += scGl*.2*exp(-dot(m, m)*260.)*scNt;
			col = mix(col, scGl*1.02, sat(.5 - (length(m) - .027)/scPx)*(.5+.5*scNt));
			// lamps on the shore, where people live
			float gx = p.x*34., h = hash11(floor(gx)+5.), town = scZ(.45, .75, noise(vec2(p.x*2.6+1.3, 8.)));
			vec2 lq = vec2((fract(gx) - .5 - (h - .5)*.6)/34., y - .005 - .012*fract(h*7.));
			vec4 pm = piece(vec2(sat(.5+p.x*.5), .2+.6*h));
			col += mix(vec3(1., .66, .3), pm.rgb/max(pm.a, .1), pm.a*.6)*exp(-dot(lq, lq)*(90000./(1.+2.*pm.a)))*sat(town+.25 - fract(h*13.))*(.7+1.5*pm.a)*(.3+.7*scNt);
		}
	}
	if (under) col = scGround(p, sky);
	// the caravan, far to near: hull, rig, sail
	float cueUp = uCue*(1. - uCue);
	vec2 o = scB ? vec2(.12, .02) : vec2(-.04, .16), luff = (scH - scT)/(scH.y - scT.y), leech = (scP - scC)/(scP.y - scC.y);
	mat2 turn = rot(scB ? .1+.5*cueUp : .8*cueUp);
	int at[6] = int[6](0, 0, 0, 0, 0, 0), n = 0, i = 0;
	for (int k = 5; k >= 0; k--) {
		vec2 q = vec2(p.x - scAt[k].x, p.y - scHz)/scAt[k].y+vec2(0., scE);
		if (scB) q = vec2(-q.x, q.y < 0. ? -1.5*q.y : q.y);
		vec2 t = turn*(q - o)+o;
		float y = t.y - scT.y;
		bool hull = abs(q.x) < .62 && q.y > -.02 && q.y < .32;
		bool rig = t.y > .1 && t.y < (scB ? 1.7 : 1.24) && t.x > min(scT.x+luff.x*y - .06, (scB ? .38*y - .5 : .6*y - .58)) && t.x < max(scC.x+leech.x*y+scRo+.04, .6 - y*(scB ? 1. : .45));
		if (hull || rig) { at[n] = k; n++; }
	}
	do { // the only ones that reach here
		if (i < n) {
			scTake(at[i]);
			float low = 1.;
			vec2 q = vec2(p.x - scAt[scK].x, p.y - scHz)/scS+vec2(0., scE);
			scQ = scPx/scS;
			if (scB) {
				q.x = -q.x;
				if (q.y < 0.) { low = .5*(1. - .7*max(-uOwn[1], 0.))*(1. - scZ(0., 1.1, -q.y)); q.y = -q.y; scQ *= 1.+3.*q.y; q.x += .02*sin(q.y*50.+3.*sin(q.x*9.))*sat(q.y*4.); }
			}
			vec2 t = turn*(q - o)+o;
			vec3 keep = col;
			if (scB) scBoat(col, q); else scCart(col, q);
			scRig(col, t);
			scSail(col, p, t);
			col = mix(keep, col, scAl*low);
		}
		i++;
	} while (i < n);
	// blown salt or frost
	float low = exp(-abs(p.y - scHz+.14)*5.)*(.1+.7*uTexture+.8*max(o5, 0.));
	if (low > .045) {
		float st = scDrift(vec2(p.x*2.2+mod(uTime*.22, 64.), p.y*26.))*(.4+.6*scDrift(vec2(p.x*6.+mod(uTime*.5, 64.), p.y*60.+p.x*4.)));
		col = mix(col, mix(scLit, scLow, .4), sat(low*scZ(.25, .7, st))*(.6 - .3*scNt)*scZ(.045, .12, low));
	}
	col = mix(col, mix(scMs, scLit, .3*scNt), max(o5, 0.)*.6*exp(-abs(p.y - scHz)*2.5));
	return sat(col);
}
