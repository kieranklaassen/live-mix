/**
 * The styles a visual can be drawn in. Each is a shader in `shaders/<id>.glsl`, in two variations, and follows the
 * piece and the performer in its own way. The words here are the ones the list, the info view and the agent show.
 * The file opens each shader with the same words as comments; `styles.test.ts` holds the two together.
 *
 * An id is saved in pieces: it is never renamed and never given another picture.
 */

export type VisualGroupId =
  | 'dots'
  | 'worlds'
  | 'gradients'
  | 'nature'
  | 'paint'
  | 'made'
  | 'light'
  | 'form'
  | 'rule'
  | 'backplates'

export interface VisualStyle {
  id: string
  name: string
  group: VisualGroupId
  /** What its two variations are called: a, then b. */
  variations: readonly [string, string]
  /** What the picture is. */
  what: string
  /** What in the music it follows. */
  follows: string
}

/** The groups, in the order the list shows them. */
export const VISUAL_GROUPS: readonly { id: VisualGroupId; name: string }[] = [
  { id: 'dots', name: 'Dots' },
  { id: 'worlds', name: 'Worlds' },
  { id: 'gradients', name: 'Gradients' },
  { id: 'nature', name: 'Earth and sky' },
  { id: 'paint', name: 'Paint and ink' },
  { id: 'made', name: 'Cloth, paper, glass' },
  { id: 'light', name: 'Light and shadow' },
  { id: 'form', name: 'Shapes and rooms' },
  { id: 'rule', name: 'Lines and patterns' },
  { id: 'backplates', name: 'Backplates' },
]

export const VISUAL_STYLES: readonly VisualStyle[] = [
  {
    id: 'dot-screen',
    name: 'Dot screen',
    group: 'dots',
    variations: ['Flat', 'Staggered, glowing'],
    what: 'The piece as a wall of dots, flat on. Across is the loop, down is the room; a dot is as big as the sound there.',
    follows:
      'Each stroke of the piece swells as it plays; a cue leaves a spreading spot; Glow makes every dot bigger.',
  },
  {
    id: 'dot-wall',
    name: 'Dot wall',
    group: 'dots',
    variations: ['Facing', 'Along the wall'],
    what: 'The piece as a wall of glass bulbs over a wet dark floor: across is the loop, up is the room, and the view glides along with the place now playing.',
    follows:
      'Loudness in the piece swells each bulb and pushes it out of the wall, furthest at the playing place; a hit or cue sends a ring of bulbs out across the wall.',
  },
  {
    id: 'dot-land',
    name: 'Dot land',
    group: 'dots',
    variations: ['Plain', 'Twin plains'],
    what: 'The piece laid out as a plain of lamps on stems over black glass, flown over toward a glow at the horizon; the crest of tall lamps just ahead is what sounds now.',
    follows:
      'The flight keeps pace with the loop; loudness swells and lifts each lamp, highest at the playing line, where the spectrum shapes the crest; a hit or cue sends a ring out over the plain.',
  },
  {
    id: 'dot-globe',
    name: 'Dot globe',
    group: 'dots',
    variations: ['Globe', 'Dome'],
    what: 'The piece wrapped round a dark globe in lamps: round it is the loop, pole to pole is the room, and it turns so that what sounds now faces you.',
    follows:
      'The turning keeps pace with the loop; loudness swells each lamp and lifts it off the surface, most at the playing place; a hit or cue sends a ring round the globe; the rim takes the colour of what sounds.',
  },
  {
    id: 'dot-tunnel',
    name: 'Dot tunnel',
    group: 'dots',
    variations: ['Round', 'Square duct'],
    what: 'A flight down a tunnel whose wall is the piece in lamps: round it is the room, along it is the loop over and over, and the place now playing is a hoop of light the flight overtakes.',
    follows:
      'The flight speeds up as the music fills; loudness swells each lamp and leans it into the tunnel, most at the playing place; a hit or cue throws a hoop of light away down the tunnel.',
  },
  {
    id: 'dot-lattice',
    name: 'Dot lattice',
    group: 'dots',
    variations: ['Points', 'Rods'],
    what: 'A flight through lamps hung in a lattice that fills space, with the piece laid through it across and along and echoed on the levels above and below, the far lamps sinking into fog.',
    follows:
      'Loudness lights and swells the lamps; lows send slow wide waves of light through, mids quicker ones, highs make single lamps sparkle; a hit or cue sends a shell of light out from the middle.',
  },
  {
    id: 'pin-relief',
    name: 'Pin relief',
    group: 'dots',
    variations: ['Ivory pins', 'Glass beads'],
    what: 'The piece pressed into a bed of pins seen from above at a slant, across the loop and away into the room, where a hard low light picks out each pin that stands up and throws its shadow on the next.',
    follows:
      "Loudness raises the pins, highest at the place now playing, which the view glides along with; the piece's colours fill the shadows; a hit or cue presses a ripple out through the bed.",
  },
  {
    id: 'press',
    name: 'Press',
    group: 'dots',
    variations: ['One screen', 'Three plates'],
    what: 'A slow liquid body wearing the piece as its skin, lit from the side and printed in dots: the brighter the body, the fatter the dot.',
    follows:
      'The low band swells and folds the body, each kind of sound lights its own lamp, the piece colours the skin, a hit kicks a ring across it and knocks the plates out of line.',
  },
  {
    id: 'melt',
    name: 'Melt',
    group: 'dots',
    variations: ['Mercury table', 'Wax wall'],
    what: 'The piece as beads of liquid metal on a dark table, the loop across and the room going away from you; where it is loud the beads swell and run together into pools.',
    follows:
      "The piece sets each bead's size and colour, a crest stands where the loop is now, the low band deepens the swell, a hit sends a ring through that makes beads jump and join.",
  },
  {
    id: 'moire',
    name: 'Moire',
    group: 'dots',
    variations: ['Dot sheets', 'Ring sheets'],
    what: 'Three round sheets of fine dots hang in the dark, leaning and crossing; where two overlap their dots fall in and out of step, and great slow figures of light open there.',
    follows:
      'Travel turns and slides the sheets, the low band stretches one so the figures swell, each kind of sound lights its own overlap, a hit sends a ring through one sheet and a cue twists another.',
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    group: 'dots',
    variations: ['Seed dome', 'Funnel'],
    what: 'The piece set out as the seeds of a sunflower head: once round is the loop, from the middle to the rim is the room from back to front, and a seed is as big and bright as the sound there.',
    follows:
      'The head turns once a loop so that now is always nearest you, the piece sizes and colours the seeds, the low band sends a swell outward, a hit runs a ring from the middle to the rim.',
  },
  {
    id: 'ripples',
    name: 'Ripples',
    group: 'dots',
    variations: ['Sea of dots', 'Rain pond'],
    what: 'A sea of dots at night under one low light on the horizon; the piece lies on the water, the loop across and the room going away, and rings spread through it.',
    follows:
      'The piece sizes and colours the dots, the low band raises the swell, every hit or cue drops a ring that travels out and lifts and lights the dots on its crest.',
  },
  {
    id: 'bead-curtain',
    name: 'Bead curtain',
    group: 'dots',
    variations: ['Hanging', 'Falling'],
    what: 'Strings of glass beads hang in rows one behind another, each string a band of the sound; light runs down a string as far as its band is loud.',
    follows:
      'Each band lights its strings from the top down, low bands teal through violet and rose to high bands amber; travel drifts you past the rows, a hit sends a shell of red light out through them and a gust along them, a cue drops a line of light down every string.',
  },
  {
    id: 'sand-figures',
    name: 'Sand figures',
    group: 'dots',
    variations: ['Brass plate', 'Water drum'],
    what: 'Fine pale sand on a square brass plate clamped at its middle, gathered by the sound into stars, loops and knots, every grain with its size and shadow under a low lamp, the figure sliding slowly into the next; or a round dish of water over black, standing in rings and petals with silver light along them.',
    follows:
      'Loudness draws the sand into sharp lines and raises the water; with nothing sounding the sand lies loose and the water faint. The bands lean on which figure stands. Each kind lights one side, the piece tints what swings, a hit throws up grains or sends out a ring, a cue shakes the figure loose until it settles. Keys brighten the far side, a voice the swing.',
  },
  {
    id: 'soft-city',
    name: 'Soft city',
    group: 'dots',
    variations: ['Avenue', 'Rain on glass'],
    what: 'A wet avenue at dusk seen from the front of a tram with the lens wide open: lamps, windows, cars and signals are six-sided discs of light that overlap and slide apart, doubled in the road, with somebody under an umbrella; or the same city through a rainy side window, where each drop holds it small, sharp and upside down.',
    follows:
      'Each disc has a kind of sound or a band, and lights up with it; the piece hangs along the houses, what comes next further off (across the window in the other). Low opens the lens, so discs grow; high twinkles. A hit is one tail light passing; a cue lights every rim while the focus is pulled and let back; keys and voice light the green ones.',
  },
  {
    id: 'urchins',
    name: 'Urchin shells',
    group: 'dots',
    variations: ['On sand', 'Lit inside'],
    what: 'Five bare sea-urchin shells lie on pale sand in low side light, dusty violet, olive, rose and cream, their rows of round knobs running from fat at the girth to dust at the crown, one hollow side up. Or one broken shell from inside, its wall glowing, daylight coming through every pore and falling as dots on the sand.',
    follows:
      'Each kind is one shell, or a fifth of the wall (texture also the violet bands): knobs swell and take its colour from the girth up, or its pores do. The spectrum runs up the rows. A hit sends a ring up the shells; a cue brings the light lower and warmer and back. The piece tints the sand, high notes and keys wink in its grains, the loop swings the sun.',
  },
  {
    id: 'dabs',
    name: 'Dabs',
    group: 'dots',
    variations: ['Quay', 'Orchard'],
    what: 'A still harbour at a late hour, painted on pale board in small separate dabs of unmixed colour: two masts and a dark hull moored at the right, its image in the water, houses and a light tower far off; or an orchard on a slope, round trees with a ladder, blue and violet shadows lying down the grass.',
    follows:
      'Each kind dyes and fattens the dabs of its part: pads the sky, drones the boats or the shadows, textures the water or the grass, phrases the gleam or the leaves. Bands lift the light and the piece colours water and grass. A hit pales the dabs in one soft circle, a cue sends a gleam over. The loop leans from cool to warm; keys brighten odd dabs.',
  },
  {
    id: 'seed-heads',
    name: 'Seed heads',
    group: 'dots',
    variations: ['Clock', 'In the wind'],
    what: 'One dandelion clock very near with the low sun behind it, every parasol a star of fine hairs, the far side seen through the near and three more heads lost in the soft green meadow; or a head half bare at dusk, its seeds carried off over a dark field past a blurred sun, some sharp, some out of focus.',
    follows:
      'The bands brighten the parasols from base to crown; the piece lies over the head in its colours. Each kind has a head, or sky, horizon, sun and seeds of its own. A hit lets five seeds go and sends a ring of light over the head; a cue is a breath across the head, or wind over the grass. Low sounds sway the stem; keys make single parasols shine.',
  },
  {
    id: 'star-wheel',
    name: 'Star wheel',
    group: 'dots',
    variations: ['Spiral', 'Pole trails'],
    what: 'A galaxy seen at a slant, its disc cut by the frame: two arms of countless small stars with pink knots and brown dust round a warm old core, and a few nearer stars in front; or a long exposure of the night sky, the stars drawn out into arcs round the pole over misty ridges and one dark tree with a small lamp at its foot.',
    follows:
      "Stars brighten in the piece's colours where it sounds: round the disc is the loop and outward the room, or across and up the sky. The drone warms the core or the horizon; high sounds twinkle; the arcs grow longer and shorter with the loop; a hit is one new star or a meteor, a cue a wave of light that runs round; the keys light a few more stars, or the lamp.",
  },
  {
    id: 'bubble-raft',
    name: 'Bubble raft',
    group: 'dots',
    variations: ['From above', 'Low window'],
    what: 'Thousands of equal soap bubbles on pale water, seen from straight above: they pack into a few great grains, each a crystal with rows of its own, parted by crooked seams of open water, with a bubble missing here and there; or the same raft seen low toward a bright window, near bubbles as glass domes, far ones a silver sheet.',
    follows:
      'Where the piece sounds, the windows in the bubbles widen and their films take its colour. Each kind darkens or lightens its own grains. The spectrum, left to right, brightens the light the bubbles gather. The seams creep with the music. A hit makes one row slip by a bubble; a cue tilts the light and the grains flash in turn. Keys catch here and there.',
  },
  {
    id: 'three-inks',
    name: 'Three inks',
    group: 'dots',
    variations: ['Fruit and moons', 'Far coast'],
    what: 'A poster in blue, red and yellow ink, each plate a little out of line and all its shading made of coarse grain. A bowl of plain round fruit on a striped cloth under a moon, with half a melon and two cherries, on much bare paper; or a low sun over a far coast, ridges fading into haze, and its red bars on a striped sea.',
    follows:
      'The drone thickens the blue, phrases the red, pads and textures the yellow. The spectrum fills the stripes; the piece is dusted between them in red. The low loosens the plates. A hit bursts in grain at the cherries or the lamp. A cue reprints the sheet from the top, inks moved round. Keys swell the pips or widen the bars; a voice fills the moon or halo.',
  },
  {
    id: 'lake-ice',
    name: 'Lake ice',
    group: 'dots',
    variations: ['Bubble stacks', 'Skate marks'],
    what: 'Clear bottle-green lake ice looked down into, with stacks of flat white bubbles frozen one under another, cracks that are pale walls going down, fine pearls, and dry snow drifted over one side; or grey evening ice from higher up, crossed by long skate strokes of fine white powder, one lantern low over it and a reed edge.',
    follows:
      'Each kind swells and whitens the bubbles at its own depth, or its own strokes; the piece says which stacks are full, or where powder is bright. The mix is the daylight or the lamp, bands brighten single bubbles or strokes. A hit runs a hairline crack or throws powder; a cue lights one long crack, or the lamp and one stroke. The loop skates a circle.',
  },
  {
    id: 'black-hole',
    name: 'Black hole',
    group: 'worlds',
    variations: ['Disc', 'Bent ring'],
    what: 'A black hole with the piece wound round it as a disc of glowing matter, its far side bent up over the top by gravity; or the hole alone, bending five coloured lights behind it into a ring.',
    follows:
      'The disc is one turn of the loop with what plays now at the front, each sound an arc as bright as it is loud; the mix heats the inner edge; a hit sends a ring of heat out through the disc and a cue throws a flare round it; in the ring each light is one kind of sound, as bright as it is loud.',
  },
  {
    id: 'curtains',
    name: 'Curtains',
    group: 'worlds',
    variations: ['Night sky', 'Under water'],
    what: 'Curtains of light hanging over a dark shore and mirrored in still water, one curtain for each part of the spectrum; or the same light seen from under the sea, falling in rays through the surface.',
    follows:
      'Each band of the spectrum raises and brightens its own curtain, low nearest; a hit flares one stretch of a curtain; a cue runs a surge of light from left to right; under water the spectrum lies across the surface, the fuller the music the deeper the rays reach, and a hit drops a ring of light.',
  },
  {
    id: 'night-sea',
    name: 'Night sea',
    group: 'worlds',
    variations: ['Moonlit', 'Heavy sea'],
    what: 'A dark sea under the moon with the piece glowing beneath the waves, far sounds far out and near sounds close; or the same sea as heavy liquid metal under a sky lit in the colours of the sounds.',
    follows:
      'The low band raises the swell and the high band puts sparkle on it; each sound glows under the water where it sits in the piece; a hit is lightning on the horizon; over the metal each kind of sound is a pillar of light as tall as it is loud, and a hit drops a ring into the sea.',
  },
  {
    id: 'grid-land',
    name: 'Grid land',
    group: 'worlds',
    variations: ['Low flight', 'Contour map'],
    what: 'A low flight down a valley toward a setting sun, the hills on either side drawn in glowing lines and standing as tall as the spectrum is loud; or the piece itself as a land of contour lines seen from above, rolling toward you as the loop plays.',
    follows:
      'Each band of the spectrum raises its own ridge, low notes nearest the middle; the sun swells gently with the low band; a hit sends a line of light down the valley; in the contour map each sound is a hill in its own colour where it sits in the piece.',
  },
  {
    id: 'silk',
    name: 'Silk',
    group: 'worlds',
    variations: ['Dark satin', 'Falling ink'],
    what: 'A sheet of black satin moving in slow wind, dyed with the piece so each sound is a band of its own colour that swells as it plays; or the sounds as coloured ink falling and curling through dark water.',
    follows:
      'The fuller the music the deeper the folds; each sound lights its own colour where it sits in the piece; a hit sends a ripple out through the cloth, a cue sends a gust across it; in the water each kind of sound pours its own ink.',
  },
  {
    id: 'lit-cloud',
    name: 'Lit cloud',
    group: 'worlds',
    variations: ['Deep space', 'Window light'],
    what: 'A slow flight through glowing cloud among stars, each cloud lit in the colour of one kind of sound; or a dark smoky room where the piece is a window of coloured glass, throwing its shafts of light down through the smoke to the floor.',
    follows:
      'Each kind of sound lights its own cloud as far as it is loud; a hit is lightning deep in the cloud, a cue a ring of light spreading through it; in the room each sound is a pane that brightens as it plays, and the smoke thickens with the mix.',
  },
  {
    id: 'liquid-metal',
    name: 'Liquid metal',
    group: 'worlds',
    variations: ['Mirror drops', 'Soap film'],
    what: "Five drops of liquid metal drift, touch and run together over a floor that is the piece, each mirroring tall bars of light in the piece's colours.",
    follows:
      'Each kind of sound is one drop, as big as it is loud, and one bar of light, as bright; a hit sends a shiver across the surface, a cue pushes the drops apart.',
  },
  {
    id: 'light-tunnel',
    name: 'Light tunnel',
    group: 'worlds',
    variations: ['Lamp rings', 'Veined'],
    what: 'A flight down a twisting tunnel of black glass whose lamps are the piece itself, wrapped round, with a light at the far end.',
    follows:
      'The piece lights the lamps (the floor is the front of the room), the spectrum lights the ribs ring by ring, a hit sends a ring of light away down the tunnel.',
  },
  {
    id: 'curved-lattice',
    name: 'Curved lattice',
    group: 'worlds',
    variations: ['Light ribbons', 'Gold bands'],
    what: 'A flight through an endless lattice of curved ribbons made of light, the near ones showing the far ones through them, the colour sliding as it goes deeper.',
    follows:
      'The low band makes the ribbons thicker, low, mid and high light them level by level, a hit sends a shell of light out ahead through the lattice.',
  },
  {
    id: 'folded-stone',
    name: 'Folded stone',
    group: 'worlds',
    variations: ['Lantern', 'Crystal city'],
    what: 'A block of stone folded and pierced over and over until it is lace, turning slowly in the dark with a light burning inside it.',
    follows:
      'The tone dial and the place in the loop change the angle of the fold, the level feeds the light inside, the spectrum lights the windows, a hit sends a shell of light out from the middle.',
  },
  {
    id: 'night-city',
    name: 'Night city',
    group: 'worlds',
    variations: ['Towers', 'Basalt'],
    what: 'The spectrum as a city at night, low notes on the left and high on the right, flown over low, its lit windows and roof lines mirrored in a wet avenue.',
    follows:
      'Each tower is as tall as its band is loud and lights more windows as it rises; travel is the flight; a hit sends a ring of light out across the city from under you.',
  },
  {
    id: 'star',
    name: 'Star',
    group: 'worlds',
    variations: ['Burning', 'Eclipse'],
    what: 'One star turning in the dark: a ball of fire pushed out of shape by the sound, with a corona streaming off it.',
    follows:
      'The low band swells it, each kind of sound raises its own region in its own colour, the high band raises tongues of flame and lengthens the rays, a hit throws a loop of fire off the limb.',
  },
  {
    id: 'river-lanterns',
    name: 'River lanterns',
    group: 'worlds',
    variations: ['Downstream', 'From the bridge'],
    what: 'A wide dark river at night: small square paper lanterns drift away from you past low hills, each with a long wavering reflection, the near ones with slats and a raft, the far ones a bending string of points; or the same lanterns seen from a bridge, open at the top, passing between wet stones in rings of their own light.',
    follows:
      'Every lantern carries one kind of sound and warms as it plays; where the piece is loud more are lit, across for the loop and away for the room. Low swells the water and rocks them, high glints. A hit drops a ring that tips the nearest, a cue lights all, near to far. Keys brighten some, a voice spreads their light. The current follows the music.',
  },
  {
    id: 'block-garden',
    name: 'Block garden',
    group: 'worlds',
    variations: ['Little town', 'Shelf of houses'],
    what: 'A little town of painted wooden blocks on a pale table in morning light from a window: houses, round towers, arches, trees and street lamps with long soft shadows, the paint rubbed off at the edges; or the same blocks seen level, standing along two shelves with the sun coming in from the side.',
    follows:
      'Houses rise where the piece sounds and their windows light with their own kind of sound; a row of round towers stands as high as the bands; a hit lights one tower, a cue lights lamps and windows street by street, or house by house along the shelf; the loop swings the sun and the shadows; keys and voice colour the trees and light windows.',
  },
  {
    id: 'banded-planet',
    name: 'Banded planet',
    group: 'worlds',
    variations: ['Storm belts', 'Thin rim'],
    what: 'Close over a banded giant: belts of cream, rust and slate with curled edges, a great oval storm, the soft line where night begins, and rings seen edge on with their shadow across the clouds; or only its dark edge against the stars, under a thin skin of orange and blue air, with a small half moon just risen.',
    follows:
      'The low sounds lie in the southern belts, the high ones in the northern: each is roughened and lit by its own. The kinds tint belts, and strokes of the piece stain the clouds or glow through the night side. A hit is a pale storm or lightning; a cue sends a moon and its shadow across, or the sun breaks over the edge. The loop sways the sun.',
  },
  {
    id: 'crystal-hall',
    name: 'Crystal hall',
    group: 'worlds',
    variations: ['Great beams', 'Geode'],
    what: 'A hot dark cave of crystal beams thick as trees, leaning from wall to wall over rust-brown rock, milky and veiled inside, lit from behind by a hidden lamp; far in, one small figure by a small warm light. Or the mouth of a geode close up: a grey rind round a hollow of short pointed crystals, smoke to violet to clear.',
    follows:
      'Each kind of sound lights one beam from its foot, the spectrum climbs the beams as faint planes, the low band feeds the small far light; a hit lights the crystal point at the right, a cue swings the hidden lamp behind the beams and back, keys light the small tip. In the geode each kind lights a quarter, a hit flares one cluster, a cue swings the lamp across.',
  },
  {
    id: 'moonscape',
    name: 'Moonscape',
    group: 'worlds',
    variations: ['Raking sun', 'Earth-lit'],
    what: 'A cratered plain from low overhead under a sun low on the ground: rims bright, floors lost in black, night coming in from the left, and a far mountain with only its face lit; or the same ground from standing height at night, in soft blue light from a globe out of sight, with stars, and the last sun gold on the hilltops.',
    follows:
      'Each kind of sound glows in its own craters; the piece tints the ground where it lies. The spectrum lights the rims, low notes near and high ones far. High sounds raise dust at the horizon, low ones lift shadows. A hit throws up a plume, a cue runs light along the edge of the world. Keys glint in dust, a voice lights the peaks. The loop sways the shadows.',
  },
  {
    id: 'small-world',
    name: 'Small world',
    group: 'worlds',
    variations: ['Round moor', 'Round sky'],
    what: 'A small ball of moorland hangs in a wide pale morning sky: heather, a track, pools and a white house, with trees and stones pointing outward all round it like pins, and it rolls without hurry; or the world is inside out, the moor fills the frame, trees lean in from every side and the sky is a round pool of light in the middle.',
    follows:
      'The piece lies round the land and a patch of sun goes round with the loop. Drones raise the middle hills, pads fill the pools, textures colour the heather, phrases the leaves; trees grow where it is loud. Bands are the far hills, level the sun. A hit sends up birds where the loop is, a cue sends wind right round. Keys open flowers, a voice lights the lamp.',
  },
  {
    id: 'colour-field',
    name: 'Colour field',
    group: 'gradients',
    variations: ['Fog', 'Coarse print'],
    what: 'The piece laid on wet ground as light under a low fog, looked across from the front of the room to the back: each sound a bank of glowing colour, the far ones small on the horizon, all of them drawn out long in the wet floor; or the same field flat on, made only of grain, like a photograph printed coarse.',
    follows:
      'Each stroke of the piece glows in its colour and swells as it plays, melting into its neighbours; the place now playing is a seam of light drifting across, and a hit flares along it; a cue blooms where it fell; in the print the grain is as dense as the field is bright.',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    group: 'gradients',
    variations: ['Over water', 'Ribbed glass'],
    what: 'The sky after sunset over still water: long soft bands of colour from a glow at the horizon up into blue-black, thin streaks of cloud lit from below, the last of the sun behind a far shore; or the sun still up, seen through ribbed glass that cuts the sky into slipped slices.',
    follows:
      'Each band is a kind of sound, as thick and bright as that sound is loud (texture lowest in amber, then the phrase in rose, the pads in violet, and the drone highest in deep teal); the low band swells the sun; a hit is a flare low along the horizon that lights the clouds from under; a cue sends a slow ring out from the sun.',
  },
  {
    id: 'soft-lights',
    name: 'Soft lights',
    group: 'gradients',
    variations: ['Frosted glass', 'Cut gels'],
    what: 'A few great soft lights drifting behind a pane of frosted glass, some close against it and some far back, melting into one another where they cross; or the same lights as sharp cut discs and half discs of coloured gel, each filled with a gradient and laid one over another with soft shadows between.',
    follows:
      'One light for each kind of sound, as large and bright as that sound is loud; a hit sends a ring of brightness out through the red one and a cue a wider ring through the violet; the gels grow, turn and slide with the same sounds.',
  },
  {
    id: 'still-life',
    name: 'Still life',
    group: 'gradients',
    variations: ['Low sun', 'Stipple'],
    what: 'Five matte balls stand on a plain before a half-sunk glowing disc, in low soft light with long shadows, like a still life on film.',
    follows:
      'Each kind of sound is one ball, as large as it is loud; the disc is the piece at this place in the loop, and the light swings round with the loop; a hit lights the small ball from inside, a cue sends a ring over the plain.',
  },
  {
    id: 'ribbons',
    name: 'Ribbons',
    group: 'gradients',
    variations: ['Hanging cloth', 'Standing glass'],
    what: 'Five wide ribbons of thin coloured cloth hang and turn slowly in the dark, one behind another, their colours mixing where they cross and each throwing a soft shadow on those behind.',
    follows:
      'Each kind of sound is one ribbon, as wide and bright as it is loud; the place in the loop slides the colours along them; a hit sends a fold running down the front ribbon, a cue down all of them.',
  },
  {
    id: 'prism',
    name: 'Prism',
    group: 'gradients',
    variations: ['Beam', 'Thin films'],
    what: 'A beam of white light crosses a dark room into a block of glass and comes out as a wide fan of colour that hangs in the air and climbs the far wall in long soft bands.',
    follows:
      'The fan is as wide as the music is full; each kind of sound brightens its own part of the spectrum; a hit sends a pulse of brightness along the beam, through the glass and out across the fan.',
  },
  {
    id: 'slow-lumen',
    name: 'Slow lumen',
    group: 'gradients',
    variations: ['Unfolding', 'Turning over'],
    what: 'Veils of silver and coloured light unfold in the dark out of threads, turn inside themselves and drift: where a sheet folds back it gathers into a bright edge, where it faces us it is gauze; or one sheet alone to the right, first a thread, then turning its face, then fading as the next thread comes.',
    follows:
      'Each kind of sound is a veil that brightens and widens, or in the second picture a length of the one sheet; the low opens it; the piece is dyed in; a hit runs a glint along the folds, a cue opens a veil wide; keys light the phrase veil or the foot of the sheet, a voice the folds; fuller music carries them on faster.',
  },
  {
    id: 'closed-eyes',
    name: 'Closed eyes',
    group: 'gradients',
    variations: ['Toward the sun', 'Pressed'],
    what: "The warm red of shut lids turned to the sun, darker under the upper lid, with the eye's own branching vessels coming and going and a few clear threads sinking through; or the eye pressed in the dark, where soft beads, checkers, spirals and fans glow on plum, finest at the middle, and turn inside out.",
    follows:
      'Fuller music is more sun, or brings the forms in from the edge. The drone warms the red or lights the rings, the pad shows the vessels or the spiral, texture the grain or the checks, a phrase the threads or the fan. The piece blushes through. A hit leaves an afterimage; a cue is a hand before the sun, or light round the fingertip. Keys are sparks.',
  },
  {
    id: 'light-doorway',
    name: 'Light doorway',
    group: 'gradients',
    variations: ['Door ajar', 'Light well'],
    what: 'A dim bare room with a tall door standing ajar: the next room is never seen, only its coloured light, upright in the gap and lying in soft fans over the floorboards; or the foot of a high plain shaft with a small dark doorway, where light from an opening out of sight grades down the walls to dusk.',
    follows:
      'Drone, pads, texture and phrase are each a lamp in the next room with a fan of its own on the floor, or each a wall of the shaft; a hit lays down one more fan and lights the door frame, or runs down a corner; a cue lets a second veil of light in; the low band swells the dusk; the loop turns the colours a little; keys light the knob or the doorway.',
  },
  {
    id: 'white-fog',
    name: 'White fog',
    group: 'gradients',
    variations: ['Snow field', 'Bare trees'],
    what: 'A white field with no horizon and the few things the fog lets be seen: a line of posts walking off, a hut under snow, one bare tree with a crow on its bough, a far row of firs; or pruned apple trees on a slope, row behind row into pale nothing, a ladder leaning in the near one and five red apples nobody picked.',
    follows:
      "Each kind clears the fog at its own depth: drone the firs or far rows, pad the fence or middle rows, texture the hut or second row, phrase the near tree. The level dims the light, low lifts ground mist, the bands set the firs' heights, the loop walks a thin place by. A hit drops snow and lifts the crow, a cue opens a clear lane, keys warm window or apples.",
  },
  {
    id: 'colour-wheels',
    name: 'Colour wheels',
    group: 'gradients',
    variations: ['Discs', 'Half rounds'],
    what: 'Great painted wheels, ringed and quartered, cross one another on canvas; wherever one cuts another the rings slip half a step and the colours change places, so a red answers a green across the break. Or half rounds and quarter rounds in slanting rows, large and small, each band a short gradient laid with a dry brush.',
    follows:
      'Each wheel or row is a kind of sound, and the colour clears from the hubs outward as it sounds; the bands lighten the rings, the piece glazes them, the loop rocks the great wheel and the rows. A hit lights a ring and turns it a notch, or runs along a band; a cue passes one colour round every wheel or from fan to fan. Keys and the voice wake small parts.',
  },
  {
    id: 'breath-pane',
    name: 'Breath pane',
    group: 'gradients',
    variations: ['Misted', 'Greenhouse'],
    what: 'A misted window, pale grey and wet, and behind it an evening garden: a house with lit windows, a lamp, a string of lights, one tree. Where sounds are the mist is wiped away in arcs, and drops run down in crooked clean tracks; or a steamed greenhouse pane with dark leaves pressed on it, sharp where they touch and lost behind.',
    follows:
      'The mist is wiped where the piece sounds and comes back as it fades. Drone lights the lamp, bands the string of lights or far spots, texture and keys add beads, the phrase draws a finger line with the loop; in the greenhouse each held kind presses its leaf. A hit is a round touch and one falling drop, a cue or a voice breathes mist, travel brings headlights.',
  },
  {
    id: 'sun-halos',
    name: 'Sun halos',
    group: 'gradients',
    variations: ['Ice haze', 'Moon ring'],
    what: 'A wide pale winter sky through thin ice haze, over snowed stubble and a row of poplars: a veiled low sun in a ring, red-brown on its inner edge, with a false sun each side, an arc touching the top and a faint level band; or a small moon behind lace cloud in close pastel rings, inside one wide thin ring over snow and firs.',
    follows:
      'By day drone is the ring, pads the false suns, phrase the upper arc, texture the level band, a hit a pillar of ice dust, a cue the arcs above. By night drone is the wide ring, pads and texture the inner rings, phrase the mock moons, a hit a ring running out, a cue the wide ring. Low thickens the cloud, bands light it, highs add glitter or stars, keys glints.',
  },
  {
    id: 'scraped-wax',
    name: 'Scraped wax',
    group: 'gradients',
    variations: ['Slow edge', 'Under black'],
    what: 'Coloured waxes laid warm in many coats and pulled back by one long blade: pale, red, honey and blue smears with cords, skips and islands, like land seen from a train, to a rolled edge where the dark coat still stands; or the bright coats lie under black wax, and slanting hatch scratched above and below one line lets them shine.',
    follows:
      'Drone brings up the blue coat low down, texture the honey, phrase the green, pad the mauve above. The piece stains the wax where it lies; bands open skips or hatching along the height. A hit is a fresh nick or scratches, a cue a gleam along the edge or line, the loop moves it. Highs sharpen scratches, keys gleam, a voice warms, Tone hardens, Space widens it.',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    group: 'nature',
    variations: ['Long grass', 'Still water'],
    what: 'A field of long grass in the last light, seen from low among the blades, the piece lying in it as drifts of glowing seed heads: far sounds far off, near sounds close; or reeds standing in still water at dusk, mirrored, with mist.',
    follows:
      'The low band is the wind that leans the grass, each sound lights the seed heads where it sits in the piece, the high band glints on the blade edges, the mix brings out the fireflies, a hit or cue sends one wave of wind across the field and lifts a cloud of sparks (over the water it also drops a ring).',
  },
  {
    id: 'flowers',
    name: 'Flowers',
    group: 'nature',
    variations: ['Flower field', 'One bloom'],
    what: 'A meadow of flowers seen at a slant in evening light, the piece lying on the ground as drifts of flowers in its colours, each one open as far as its sound is loud; or one great flower seen close, a ring of petals for each kind of sound.',
    follows:
      'Each flower opens with the sound where it grows (across is the loop, far is the back of the room), the low band sways them, the mix warms the light, a hit or cue opens a ring of flowers that spreads outward; on the one bloom each ring of petals opens with its own kind of sound and a hit sends a ring of light out through them.',
  },
  {
    id: 'canopy',
    name: 'Canopy',
    group: 'nature',
    variations: ['Looking up', 'Forest floor'],
    what: 'Looking up through the leaves of a tree toward the evening sky, layer over layer of leaves moving in the wind, the sun coming through them in soft shafts and drifting discs; or the forest floor, ferns and moss in mist, with shafts of light slanting down between dark trunks.',
    follows:
      'The mix is how much sun comes through, the low band sways the branches, the high band flickers the small leaves, each kind of sound lights one layer of leaves in its colour (on the forest floor, one shaft of light), a hit lets one bright shaft through for a moment.',
  },
  {
    id: 'hills',
    name: 'Hills',
    group: 'nature',
    variations: ['Dawn mist', 'Dunes'],
    what: 'Ranges of hills one behind another at dawn with mist lying in the valleys, the far ones pale and the near ones dark; or dunes of sand in low side light with wind lifting a veil of sand from the crests.',
    follows:
      "Each range is one kind of sound: it rises a little and its mist glows in that colour as the sound plays; the low band is the breathing of the mist; the sun's glow follows the mix; a hit is a bloom of light in one valley and a cue runs light along another; on the dunes each ridge is a kind of sound, the low band is the wind and a hit is a gust.",
  },
  {
    id: 'clouds',
    name: 'Clouds',
    group: 'nature',
    variations: ['Heaps', 'Rain'],
    what: "A wide calm sky of great soft heaps of cloud drifting over a low strip of land, lit from one side by a low sun; or rain coming over open land from a dark bank, grey veils slanting down with light under the cloud's edge.",
    follows:
      'The mix is how much cloud there is and the low band swells the heaps; each kind of sound tints the light on one bank of cloud; the tone dial moves the day from blue afternoon to rose evening; a hit or a cue is a slow shaft of sun breaking through; in the rain each veil is one kind of sound and the bank comes lower as the music fills.',
  },
  {
    id: 'pond',
    name: 'Pond',
    group: 'nature',
    variations: ['Lilies', 'Stream'],
    what: 'Still water seen from above at a slant, with lily leaves and flowers floating where the piece sounds, trees and sky mirrored between them and light moving on the shallow bottom; or a clear stream over round stones with leaves carried past on top.',
    follows:
      'The piece lies on the water (across is the loop, away from you is the room): leaves gather and flowers open where its strokes are, in their colours; a hit or a cue drops a ring that rocks the leaves and breaks the reflection; the high band puts glints on the ripples.',
  },
  {
    id: 'leaf',
    name: 'Leaf',
    group: 'nature',
    variations: ['Backlit', 'Wing'],
    what: 'One leaf seen very close with the sun behind it: the mid-rib, the side veins, the fine net and the glowing cells between, and drops of dew that each hold a tiny upside-down picture of the sky; or the wing of a dragonfly, dark glass cells in a gold net.',
    follows:
      'Light runs along the mid-rib with the low band, out along the side veins with the middle and through the fine net with the high; the fields between the veins take the colours of the sounds there; a hit makes the dewdrops shiver and flash; the fuller the mix the more sun comes through.',
  },
  {
    id: 'growth',
    name: 'Growth',
    group: 'nature',
    variations: ['Rings', 'Delta'],
    what: "The cut face of a trunk under a low light: each turn of the loop lays one more ring round the rim, thick and warm where the piece is loud, so the wood is the piece's own record; or a river delta seen from the air at dusk, its channels branching away toward the sea.",
    follows:
      'Once round the trunk is the loop and the rim grows where the music is now; ring after ring steps through the room from back to front; a sounding stroke makes its rings glow; a hit throws a shoot from the growing tip and a cue sends a swell in through the rings. In the delta the sounds flow out from the source at your feet, a hit runs a bright pulse down the channels, and the fuller the mix the further the water reaches.',
  },
  {
    id: 'flock',
    name: 'Flock',
    group: 'nature',
    variations: ['Evening birds', 'Fireflies'],
    what: 'A great flock of small birds at dusk, thousands of dark points turning together as one folding cloud over low land and a few trees; or fireflies drifting over a dark meadow at night, a few near and soft, many far and small.',
    follows:
      'Each kind of sound gathers birds in its own part of the sky and warms the sky there in its colour; the fuller the mix the more birds and the tighter the cloud; the low band sends slow waves through it, the high band is the shimmer of wings; a hit or cue turns the whole flock at once, so a dark wave runs through it. At night each firefly belongs to one kind of sound and glows with it, and a hit runs a flash across the meadow.',
  },
  {
    id: 'fish-sky',
    name: "Fish's sky",
    group: 'nature',
    variations: ['Open water', 'Under ice'],
    what: 'Lying on the bottom of a lake and looking up: the world squeezed into one bright round window, trees, reeds and a wading bird leaning in from its rim, lily pads and weed in the dark green water about it; or the same window frozen over, milky, with white cracks, stacked flat bubbles and one clear round hole.',
    follows:
      'Once round the rim is the loop: trees, reeds and bubbles grow and take colour where the piece is loud. Drone swells the water or lights the deep ice, pad the sky, texture brings ripples and silt, a phrase sends birds, tints leaves or cracks, the spectrum shivers the rim or lights the cracks; a hit drops one ring, a cue passes a shadow over, keys rain.',
  },
  {
    id: 'lava-field',
    name: 'Lava field',
    group: 'nature',
    variations: ['Crust', 'Shore'],
    what: 'Cooling lava seen from a low height at dusk: plates of black, rope-wrinkled crust drift and part over red and orange seams, and an open channel winds through them carrying rafts; or a dark slope at night where five red fingers run down into the sea, each raising steam lit from below, their light broken on the water.',
    follows:
      "The low band widens the seams and fingers; on the crust the piece heats its own place, high sounds throw sparks and keys brighten the sheen; on the shore each kind of sound feeds its own finger and steam, highs glint on the sea and keys light surf and stars; a hit cracks a plate or bursts at one finger's foot; a cue sends a bright surge down the flow.",
  },
  {
    id: 'drifters',
    name: 'Drifters',
    group: 'nature',
    variations: ['Night water', 'Drawn plate'],
    what: 'Jellyfish in black-blue water lit from above: a striped one with ruffled arms, a moon bell, a glass bell, a small red one, and one so near that half of it is out of the picture, with far ones and crumbs drifting; or the same animals on cream paper in pen and pale wash, set out in order over a row of young ones.',
    follows:
      "Each kind of sound is one animal: it lights, or takes on colour, and strokes harder. Lows widen the bells, highs light beads on the tentacles, a hit runs down an arm, a cue turns the light. The far or young ones show the piece; travel lets all rise and sink. Keys play the glass bell, a voice the pad's; Tone warms the lamp, Space widens the tails.",
  },
  {
    id: 'agate',
    name: 'Agate',
    group: 'nature',
    variations: ['Slice', 'Landscape stone'],
    what: 'A polished slice of agate with a lamp behind it on a pale table: fine bands from smoke to honey to blue, small eyes by the dark rind, a hollow lined with violet crystals off the middle; or a slab that looks like a far country: banded hills, level water, a ringed pale sky, black mineral ferns and healed cracks.',
    follows:
      'The piece lies in the bands from rim to heart, as does the spectrum; the pass of the loop lights them going inward. A hit sparks one crystal and sends a ring out; a cue moves the lamp. In the slab the hills hold the piece, the ferns spread with the sounds, the spectrum is the rings of the sky, a hit runs up the cracks, a cue opens the sky.',
  },
  {
    id: 'crossed-light',
    name: 'Crossed light',
    group: 'nature',
    variations: ['Growing fans', 'Needle field'],
    what: 'A thin film of crystals seen between two crossed polarisers: fans of fine needles have grown from their seeds until they met along straight seams, with soft dark arms crossing at each seed, in steel grey, white and straw; or coarse blades lying in sheaves, tight at the waist and spread at both ends, with wide black between them.',
    follows:
      'The polarisers turn with the loop and the dark arms sweep. Each fan or sheaf is of one kind and, with the piece at its place, goes from steel to straw and brighter as it swells. Low slides the thickness, the bands zone the fans or thicken the blades, texture frays them. A hit grows a fan, or runs light along the great sheaf; a cue lights its seams or edges.',
  },
  {
    id: 'sea-overhead',
    name: 'Sea overhead',
    group: 'nature',
    variations: ['Noon', 'Long evening'],
    what: "A plain of pale sand at noon under a ceiling that is the sea: it hangs a few storeys up, upside down, aquamarine, its slow crests pointing down and its net of light sliding over the sand, where one small figure in a red coat stands; or a long evening, teal and rose, a low sun under the sea's far edge, and a gull on a lone post.",
    follows:
      'A drone lowers the sea, lows swell it, highs ripple it. The piece lies in the water as drifts of colour that tint the sand below. Pad lights the horizon, texture blows sand, a phrase lets one swell hang low. A hit sends a drop falling up, a cue lets down a turning column; keys are droplets, a voice lights one patch of sand; the music carries the sea over.',
  },
  {
    id: 'below-the-line',
    name: 'Below the line',
    group: 'nature',
    variations: ['Split view', 'From beneath'],
    what: 'A still waterline near the top: over it a pale sky and one small white peak, under it the great body of the ice, white at the shoulders, hollowed and fluted, fading into grey-green water; or we look up from below at a bright rippled ceiling of water with the ice as one huge dark shape in it, its thin edges lit turquoise.',
    follows:
      'The drone is how far down the ice reaches, pad and voice its inner glow; texture lets fine bubbles go, phrase draws light along the flutes, which the bands carve; the piece tints the ice where it lies, loudness clears the water. A hit runs down two cracks with a puff of bubbles; a cue rolls a swell of light. The loop swings the sun; keys release bubbles.',
  },
  {
    id: 'snow-letter',
    name: 'Sky letter',
    group: 'nature',
    variations: ['One crystal', 'Fallen snow'],
    what: 'One six-armed ice crystal on dove grey glass, lit from one side: bevelled plates, fern branches, hair-fine ribs and small bubbles at its heart, what has not played yet only a ghost; or crystals of all sizes lying on blue-white snow, one sharp, the others out of focus.',
    follows:
      'From the heart outward is the loop: plates where the front of the room sounds, ferns where the back does. Drone, pad, texture and phrase each stain a part of it, or a crystal of their own; bands draw its rings. A hit sends one gleam out, a cue turns the lamp, low tips it, keys light the tips of its branches, a voice its heart.',
  },
  {
    id: 'glowing-shore',
    name: 'Glowing shore',
    group: 'nature',
    variations: ['Night tide', 'Wading'],
    what: 'A night beach under stars and a low headland: waves come in slanting out of a black sea, fall in cold blue living light, run up the dark sand as lace and leave sparks in the wash; or straight down into ankle-deep water, where the wake of someone who waded by curls in glowing threads over rippled sand, a foam edge beside it.',
    follows:
      'The swell keeps its own slow time. Each kind lights its own stretch of shore, or strand of the wake; the bands light the length of it, the piece its places. High and keys add sparks. A voice lights the far line, or the foam edge. A hit is a splash or a bright stir; a cue lights one whole wave from end to end, or runs up the wake. Music carries the wake on.',
  },
  {
    id: 'frost',
    name: 'Frost',
    group: 'nature',
    variations: ['Window', 'Grass'],
    what: 'Frost on a window before dawn: stiff feathers of ice with barbs on their barbs grow in from the edges, and through the clear glass that is left a blue garden and a far lamp show out of focus; or frosted grass against the low sun, white needles all along each blade and round the rim of one brown leaf.',
    follows:
      'The feathers, or the needles, grow and draw back once in the loop. Each kind of sound lights its own feathers or blades, and the piece lies along them from foot to tip. Low warms the lamp or the sun, a cue more so; high and keys bring glints. A hit runs one fine crack over the glass, or a light up the blades. In the grass the bands light far grains of frost.',
  },
  {
    id: 'far-storm',
    name: 'Far storm',
    group: 'nature',
    variations: ['Over the plain', 'Over the tops'],
    what: 'Night over a wide dark plain: far off a thunderhead stands in faint moonlight, lit softly from inside, its anvil drawn out across the stars, rain under it and one lamp on a thin road; or the same weather from high above, a floor of cloud tops out to the curved edge of the world, with lights blooming under it.',
    follows:
      'Each kind of sound is a glow of its own inside the cloud, brighter as it sounds; the low end swells the towers, the high end shimmers in the rain and on the tops; a hit is a branching glow deep inside that spreads and fades, a cue lights the anvil or the far tops slowly; keys brighten windows and stars, a voice the lamp or the rim of air.',
  },
  {
    id: 'drip-cave',
    name: 'Drip cave',
    group: 'nature',
    variations: ['Straw ceiling', 'Backlit drapery'],
    what: 'A low pale cave hung with hundreds of thin white straws of stone, each with a drop at its tip, all doubled in a pool so still that only a thread of light parts roof from mirror, a lamp burning behind the columns; or one folded sheet of stone lit from behind, banded cream, rust and amber, its toothed hem tipped with drops.',
    follows:
      'Each straw has its place in the piece and its drop swells and shines with what sounds there. Each kind is a lamp among the columns, or a band of the sheet. Lows and the mix widen the light; in the sheet the spectrum fills the drops. A hit lets a drop fall and a ring open, or light run to the hem; a cue swings the lamp and every shadow. Keys glint.',
  },
  {
    id: 'snowfall',
    name: 'Snowfall',
    group: 'nature',
    variations: ['Street lamp', 'Pine wood'],
    what: 'A lane on a winter evening under one street lamp, its cone of light full of falling flakes near and far, snow on the roofs, the wall and a bare tree, old wheel tracks and steps; or a pine wood on a grey day, dark trunks rank behind rank, loaded boughs with two small bright birds, young firs, a pale sun and one line of steps.',
    follows:
      'The mix is how thick it snows, the low band leans it, the piece tints the flakes where it sounds. Drone is the lamp, pad, texture and phrase the windows; in the wood each kind tints the air at its own depth and phrase the birds. A hit shakes snow off a limb, a cue lifts the lamp or the sun, the loop deepens the drifts.',
  },
  {
    id: 'worn-passage',
    name: 'Worn passage',
    group: 'nature',
    variations: ['Desert slot', 'Melt hall'],
    what: 'Between two leaning walls of sandstone that flow past each other in beds of apricot and rust, violet where the light fails, with a crooked strip of sky high up and pale sand at the foot; or a hall melted through a glacier, its blue walls cupped all over and letting the day in, a stream running out of the light.',
    follows:
      'The piece is written up the walls bed by bed and the playhead climbs it; drone parts the walls, pad warms the light, phrase lights one seam, texture sifts sand or lets drops fall, the bands brighten their own beds or lengths of ice, keys glint. A hit stands a shaft of sun in the passage, a cue floods it from far to near, and the music walks us on.',
  },
  {
    id: 'floated-ink',
    name: 'Floating ink',
    group: 'paint',
    variations: ['Breath rings', 'Drawn comb'],
    what: 'A pale basin of water seen from above, black and grey ink floating on it in nests of hair-thin rings, bent like a fingerprint, pushing one another aside and throwing a faint shadow on the bottom; or a full bath of coloured stones, raked and drawn by a comb into scallops, with one swirl and a sheet of wet paper at the side.',
    follows:
      "Rings hold the piece from the heart, now, outward, darker where it sounds; drone, pad, phrase each swell a nest, texture clear drops, the low band bends all. In the bath, stones swell with the piece and the spectrum; a kind's colour deepens as it sounds. A hit sets one fresh drop. A cue draws one stroke under a passing light. Space thins ink, keys tint.",
  },
  {
    id: 'long-scroll',
    name: 'Long scroll',
    group: 'paint',
    variations: ['Handscroll', 'Folding screen'],
    what: 'A paper scroll lies open on a pale table between two thick rolls; on it a mountain river in a few tones of ink, its mist left as bare paper; or a folding screen of six leaves stands zigzag on a dark floor, dull gold in squares, and the river runs over the folds in blue, green and ink, one leaf in light and the next in shade.',
    follows:
      'The loop winds the scroll out and back, one roll thins as the other fattens, or moves the lamp. Drones darken the far ridges, pads let the mist in, texture the reeds, phrases ink the branch and its blossom, bands raise the peaks. The piece tints the paper. A hit drops ink on the rocks, a cue lays a wet stroke, keys darken the birds, a voice warms the light.',
  },
  {
    id: 'scraped-black',
    name: 'Scraped black',
    group: 'paint',
    variations: ['Lone shell', 'Unlit stair'],
    what: "A plate worked to a velvet black, and every light scraped back out of its burr by hand: one snail shell on a faint ledge, a bright window on its shoulder, its mouth dark; or six worn stair treads that climb from the lower left into the black, each a soft lit lip, inside the pale line of the plate's edge.",
    follows:
      'Drone burnishes the ground; pad widens the greys; texture roughens the burr; a phrase lifts the dark edge, or lights the stair tread by tread. The piece lies on ledge or treads, the bands are sixteen scrapes, the loop turns the light. A hit is a burnished stroke that fills in; a cue opens the highlight or a light above; keys are pins, a voice lifts the dark.',
  },
  {
    id: 'floating-signs',
    name: 'Floating signs',
    group: 'paint',
    variations: ['Washed blue', 'Night ground'],
    what: 'Seven small painted signs - pebble, hook, fork, seed, coil, comb and split ring - float on a scrubbed, washed-blue ground, each tied by a thread to one slack cord, with runs of thin colour below it; or the same signs in bone and pigment on rubbed dark earth, set another way, with lit knots where the threads are tied.',
    follows:
      'Drone swells the pebble, pad the hook, texture the fork, phrase the seed, middle tones and keys the coil; the bands are the teeth of the comb. A bead on the cord is now; below it each run is as long as the piece is loud there. A hit fills the split ring and drops a bead, a voice thickens its paint, a cue soaks the cord and tugs it so the signs bob.',
  },
  {
    id: 'thick-paint',
    name: 'Thick paint',
    group: 'paint',
    variations: ['Ploughed slope', 'Sea grass'],
    what: 'Furrows climb a ploughed slope to a dark hedge under a pale windy sky, all of it in short thick strokes of paint whose ridges catch the light; or dune grass bending before a strip of surf and a grey sky, laid in the same thick paint. Now and then a new stroke is put down.',
    follows:
      "Low notes draw every stroke longer. Drone colours the furrows' hollows or the sea, pad the sky, texture the hedge or the grass, phrase the young green or single blades; a louder kind lays more new strokes on its ground. Highs glint on the ridges, a hit is one bright stroke, a cue a gust of light across the land, keys and voice warm the sky.",
  },
  {
    id: 'thrown-lines',
    name: 'Thrown lines',
    group: 'paint',
    variations: ['Flung', 'Swung can'],
    what: 'About a dozen strands of wet enamel flung from the lower right across raw linen, looping, thinning and parting into drops where the throw dies, with most of the cloth left bare; or pale paint run from a pierced can on a cord, laid in closing ellipses over a black board.',
    follows:
      'Each kind of sound swells its own strands; in the linen the low band swells the black, and the whole mix the white in both. The piece says where the paint lies thickest; the wet gloss runs on with the loop. A hit throws a spatter, a cue one long new skein; keys add drops, a voice swells the white.',
  },
  {
    id: 'poured-veils',
    name: 'Poured veils',
    group: 'paint',
    variations: ['Veils', 'Dried pools'],
    what: 'Thin paint poured on raw cotton from the upper left: veils fan out, fall, dry with darker rims and run on in tongues, the many layers going bronze where they lie over one another, the right of the cloth bare; or the cloth lay flat and four puddles dried into nested tide rims, one over another.',
    follows:
      'Drone, pad, texture and phrase each have a veil or puddle that spreads and deepens as it sounds; the spectrum sets how far tongues run, or how dark rims are; the piece opens its colours in the paint. A hit lets one run down, or one drop fall; a cue sends a wet sheen across. Keys wet the lips, a voice widens the halo, Tone darkens rims, Space softens edges.',
  },
  {
    id: 'small-squares',
    name: 'Small squares',
    group: 'paint',
    variations: ['Watercolour', 'Sandbanks'],
    what: 'A hand-ruled net of uneven squares and oblongs on rough paper, each a watercolour wash with its own dried edge, stepping from dark blue and wine at the edges to pale yellow near the middle; or long sandbanks at low tide seen from the air, with bare paper channels between them running into one winding creek.',
    follows:
      'Each stroke of the piece stains the washes where it lies with its own colour; each band deepens its row and parts the light squares from the dark; a soft light goes with the playhead; a hit pales the washes under one soft circle there, and a cue sends a warm step out from it. A drone deepens the low rows, a voice clears the middle, keys darken the edges.',
  },
  {
    id: 'sun-prints',
    name: 'Sun prints',
    group: 'paint',
    variations: ['Ferns', 'Seaweed'],
    what: 'Plants laid on paper brushed with sun-sensitive blue: two fern fronds crossing, oats, a head of tiny flowers and thin petals, white where they lay close, soft where they lifted, paler where they overlap; or seaweeds on the same blue: a ruffled blade, forked ribbons and weeds that branch out to hair.',
    follows:
      'Each kind is a plant that presses closer, whiter and sharper as it sounds and lifts to a soft blur after; the spectrum climbs the fronds. A fuller mix deepens the blue, the piece stains it faintly, the loop sends a band of sun across. A hit lays a petal or two, a cue runs water down the sheet. Keys whiten the flowers and hairs; a voice lifts the oats.',
  },
  {
    id: 'wood-print',
    name: 'Wood print',
    group: 'paint',
    variations: ['Evening sea', 'Rain on terraces'],
    what: 'A colour woodcut on a paper sheet: a bay at evening under a pale moon, islands, a pine branch across one corner, and a boat with a square sail; or rice fields in steps round a hill under ruled rain, the sky wiped dark at the top, a lit house at the head of one path and someone walking up it under a red umbrella.',
    follows:
      'Each block is a kind, fuller as it sounds: sea, sky, pine and islands, or banks, sky, rain and water. The low band rolls the waves or lifts the mist; a hit is a gust at sea or a passing shower, a cue inks the sky again. A paler stretch of water or field goes with the playhead; boat and walker go slowly on; keys light the window or lantern.',
  },
  {
    id: 'torn-wall',
    name: 'Torn wall',
    group: 'paint',
    variations: ['Many sheets', 'Whitewashed'],
    what: 'An old street wall in hard noon sun, pasted with years of plain coloured sheets and torn: ochre, oxblood, sea green, plum, cream and black, a white paper lip on every rip, a few flaps hanging over their own shadows; or the whole wall limewashed, faint prints showing through, torn open in three deep bright places.',
    follows:
      'Each kind of sound is one layer of paper: the louder it is, the wider its rips open, and silence narrows them; where the piece sounds, they widen too. A hit sends a torn scrap flying and pulls the red rips, a cue peels back a corner and lets it fall. Lows and the voice lift the flaps, highs fray the lips, the bands raise wrinkles, keys swell the dots.',
  },
  {
    id: 'house-brush',
    name: 'House brush',
    group: 'paint',
    variations: ['Five bars', 'Crossed'],
    what: 'Five great strokes of house paint on warm white primed canvas, dry at their ragged ends, with bristle gaps, ridges that catch a window, flecks and drips: two upright, two level and a short slash, with much of the canvas bare; or five that cross in a knot low on the left, one of them whitewash dragged grey through wet black.',
    follows:
      'Each kind is a stroke: drone the widest, pad, texture the driest, phrase, hits the slash. Loudness and the piece load it fuller, blacker and longer. The spectrum fills sixteen bundles of bristle. A hit wets the slash and throws flecks; a cue floods all five with gloss. The loop slides the sheen, beads run down the drips, a voice warms the window light.',
  },
  {
    id: 'cut-paper',
    name: 'Cut paper shapes',
    group: 'paint',
    variations: ['With its hole', 'Folded cut'],
    what: 'Sheets brushed with gouache laid edge to edge, each with holes snipped by big scissors; the shapes that came out are pinned on the next panel, and a painted sheet shows through the holes; or one red sheet, folded, cut and opened off centre on a pale wall, its half leaves turned back on their hinges, three pods pinned beside it.',
    follows:
      'Each kind has its own paint: as it sounds the colour deepens, and its shapes sway, grow and lift on their pins, or its flaps open wider. The piece shows through the holes as brush strokes. The mix warms the plain panels and the window light; a voice lifts the paper; a hit lifts one flap, a cue brightens a row; keys light the pins; space deepens the shadows.',
  },
  {
    id: 'facets',
    name: 'Facets',
    group: 'paint',
    variations: ['Tabletop', 'Window and stair'],
    what: 'A still life taken apart on a tipped table: a guitar, a green bottle, a glass and a bowl of three fruits, each seen from several sides at once in ochre, grey and green planes that are full at one edge and fade to nothing, under broken pencil lines; or an open window and a stair, seen from the side, from above and from in front.',
    follows:
      'Drone, pad, texture and phrase each slide their own family of planes and glaze them with their colour; the piece tints scattered dabs where its sounds lie; the spectrum stipples the lit facets; a hit opens one pale plane; a cue slides the shading off its edges while a light crosses. Keys light the guitar strings, a voice the window or the bottle.',
  },
  {
    id: 'moon-jar',
    name: 'One jar',
    group: 'made',
    variations: ['On the sill', 'Night side'],
    what: 'A big round white porcelain jar in the Korean way, a little lopsided, stands on a pale wooden shelf in morning light; the window lies slanting on the plaster and the jar throws one long soft shadow across it. Or, closer, a jar in the Chinese oil-spot glaze, iron black flecked with silver, the window bent small in its shoulder.',
    follows:
      "The drone deepens the shadows, the pad warms the glaze, texture lifts crackle or silver, the phrase sends a light round the shoulder, the bands are throwing rings. The piece tints the window's light, and the loop swings the sun. A hit is a ring of light sinking from lip to foot; a cue opens the window wider; keys glow from the mouth, a voice fills the room.",
  },
  {
    id: 'gold-on-black',
    name: 'Gold on black',
    group: 'made',
    variations: ['Autumn grass', 'Moon and shell'],
    what: 'Black lacquer with gold powder sieved onto it: long grasses bend across a corner with plumes, small round leaves and dew of shell, over a bank of dust that thins to nothing, and the gloss mirrors a window; or a large moon cut from plates of shell over swells in fine gold lines, with chips of shell for its light on the water.',
    follows:
      'Dust gathers where the piece sounds. Each kind has its own grasses, or its own swells, and they light up in its tint of gold while it plays; low bends the grass and lifts the swells; high and the keys stir the shell, a voice warms the moon; a hit drops a pinch of powder, a cue draws a band of light across; the lamp drifts and the gold gleams.',
  },
  {
    id: 'gold-tiles',
    name: 'Gold tiles',
    group: 'made',
    variations: ['Apse', 'Sea floor'],
    what: 'The gold vault of a dark apse, set with small glass tiles no two at one angle, so that a lamp out of sight runs over it as a shimmer; a vine winds across it, with waves below and leaves round the arch; or a floor of white and blue-green stone under shallow water, a great flower in a ring, with nets of light passing over.',
    follows:
      "In the vault a flower opens in each curl of the vine where the piece sounds; on the floor, petals and rows of waves take its colours. The low band moves the lamp or the sunlight, the high band makes single gold tiles flare. A hit sends out a ring of flashes, a cue draws a second light slowly across. Keys light the flowers' hearts or the gold.",
  },
  {
    id: 'knit-and-ravel',
    name: 'Knit and ravel',
    group: 'made',
    variations: ['On the needles', 'Coming undone'],
    what: 'Cream wool in stocking stitch hung from a pale wooden needle in slanting window light, with one cable and a loose strand running off along a warm wall; or the same cloth pulled undone from a dip in its edge, its freed yarn rising in crimped waves and lying loose above the rows that wait.',
    follows:
      'Rows are the loop, stitches the room: sounds dye the wool there and loud places stand out in bumps. Drone thickens the yarn, pad slackens it, texture raises fuzz, phrase swells the cable or tints the pulled strand, the bands draw rows up, keys add slubs. A hit runs along the edge in colour; a cue drops a stitch that ladders and is picked up.',
  },
  {
    id: 'loom-draft',
    name: 'Shed and shuttle',
    group: 'made',
    variations: ['Linen', 'Point paper'],
    what: "Cream cloth on a loom in window light, every thread lying over or under its neighbour; above the last pick the bare warp hangs taut over a grey board, a stick through it, and a wooden shuttle lies beside; or the weaver's plan on ruled paper: threading above, treadling at the side and the pattern in small squares of ink.",
    follows:
      'The cloth is what was just heard, read down from the playhead: where the piece sounds, plain weave turns to twill and takes its dye; or a ruler reads down the plan. Kinds tint their warps or treadles, bands lift the warp or redden the threading, highs shine on thread. A hit opens the shed or wets a few squares; a cue throws a weft or lays a wash.',
  },
  {
    id: 'star-plaster',
    name: 'Opening stars',
    group: 'made',
    variations: ['Carved plaster', 'Under the dome'],
    what: 'A wall of white plaster cut two fingers deep into a net of woven straps and stars, seen at a slant, with the low sun falling on it through an arch out of sight and blue shade in the rest; or the same net inside a shallow dome, in rings that lessen toward a round of daylight, with one round of sun lying on the far side.',
    follows:
      'The mix opens one angle, and every star sharpens; Tone sets its middle, Space the depth of the cut. Pockets take the colours of the piece and the spectrum: great stars the drone, kites the pad, six points the phrase, edges the texture. Lows lower the sun, a hit runs as a deepening ring, a cue draws a blade of sun across. Keys and voice light the flowers.',
  },
  {
    id: 'marble',
    name: 'Marble',
    group: 'made',
    variations: ['Twisted canes', 'Flower weight'],
    what: 'One glass marble hugely enlarged on white paper in window light: five ribbons of coloured glass twist round a white netted core, and sun comes through it as a patch of colours in its shadow; or a low clear dome close by, rings of cut flower canes under the thick glass, on a blue foot with white threads.',
    follows:
      "Each kind of sound is a ribbon, or a ring of flowers: louder is wider and deeper, and the piece tints it. Bands are the fine white threads. Travel turns the glass, the loop passes as a light, drone slides the window's reflection. A hit lights a bubble and the sun through the glass, a cue rolls or turns the glass and back, keys make canes glint.",
  },
  {
    id: 'strip-quilt',
    name: 'Strip quilt',
    group: 'made',
    variations: ['On the bed', 'On the line'],
    what: 'A quilt pieced by eye from worn denim, red, mustard and cream, its strips nearly lining up, sewn over in fans; it lies on a bed in the low light of a window; or another hangs pegged to a line over a mown field, stirring in the wind with the sun coming through the cloth.',
    follows:
      "Each strip stands for a place in the piece: washed pale at rest, it takes back its colour and some of the sound's own as that place sounds. Bands plump and deepen the rows. A hit brightens and puckers one block; a cue sends a slow lit swell along the cloth. The loop gleams along the stitches, keys too. The mix stirs the wind.",
  },
  {
    id: 'folded-indigo',
    name: 'Folded dye',
    group: 'made',
    variations: ['Clamped triangles', 'Stitched rings'],
    what: 'A white cotton sheet opened after dyeing: it was folded to a triangle and clamped, so feathered indigo stars and bands repeat over it round white hearts, its creases catching a low light; or a sheet bound and stitched, then let down into the vat: one large pleated disc of rings, small ones beside it, rows of dots around it.',
    follows:
      'Drone and pad soak in from their own folds, or climb the sheet. Texture and voice fray the edges; phrase and keys draw rings or fill the dots. Sixteen bands set the feathers along each fold, or the rings from the middle out. A hit drops dye that spreads and fades; a cue eases the folds and deepens their shadows. The piece darkens the cloth in its places.',
  },
  {
    id: 'rib-lantern',
    name: 'Rib lantern',
    group: 'made',
    variations: ['White room', 'Only lamp'],
    what: 'A huge squashed moon of a paper lantern, thin paper over uneven bamboo ribs, hangs in a pale plaster corner in daylight, hardly lit, its soft shadow bent over two walls. Or a dark boarded room where the only lamp is a tall paper lantern pinched at the waist, its ribs thrown as wide rings of shade over walls, ceiling and floor.',
    follows:
      'The level is the lamp. The drone widens its glow, the pad warms it, texture brings up the fibres, the phrase is a small light gliding behind the paper; the low end fills the paper between its ribs. Sixteen gaps hold the bands, the piece tints the paper, the loop carries the lamp round. A hit taps it and a ring of light runs; a cue turns it full up.',
  },
  {
    id: 'knotted-cords',
    name: 'Knotted cords',
    group: 'made',
    variations: ['Fanned', 'Hung straight'],
    what: 'A twisted cord slung across a sunlit plaster wall, and from it some thirty cotton cords in undyed, rust, indigo and brown, fanned out like a half-opened skirt, knotted at different heights, each with a blue shadow beside it; or cords longer than the picture hung straight from a pole on a clay wall, thin side cords tied to some.',
    follows:
      'Left to right is the piece, top to bottom the room: where it is loud a knot is tied, fat and dyed with that sound. Drone swings them all, pad and texture sway neighbours, phrases tip some cords or the side cords, bands stir each in order. A hit plucks and lights the cord at the playhead; a cue runs down the row. Keys light knots, travel moves the sun.',
  },
  {
    id: 'stand-up-page',
    name: 'Stand-up page',
    group: 'made',
    variations: ['Garden', 'Towers of paper'],
    what: 'A book of thick white card lies open under one lamp on a pale table, and out of its fold rise sheets one behind another: grass, reeds, waves, leaves, arches, a sun and a row of trees, each throwing its shadow on the next; or a single white page folded upright, with stairs and towers of boxes cut and pushed out of it.',
    follows:
      'Each kind has its own sheet, or its own tower: quiet lies in the page, loud stands up. The phrase slides the sun on its arc, the spectrum cuts the tops of the trees or the page, and the piece tints the page. A hit lights the front sheet or the small house, a cue lifts all once, keys light reeds or windows, and as the loop ends a leaf turns over all.',
  },
  {
    id: 'paper-wheels',
    name: 'Paper wheels',
    group: 'made',
    variations: ['Stacked discs', 'Nested frames'],
    what: 'Seven wheels of heavy rag paper, scalloped, slotted and hand-washed, on one brass pin over the page of an open book; through slots that happen to line up one sees a vermilion ground, a sliver or a whole wedge. Or seven square frames turned against each other, a well of stepped paper corners with slits down to the same red.',
    follows:
      'The sheets turn at 1 to 7 parts of one long period and all agree about every nine minutes, when the red opens. Each kind of sound lifts its own sheet and deepens its wash, the bands open sixteen windows, the piece tints the printed border, a hit sends light out over the cut edges, a cue spreads the pile, the thread is the hand of the loop.',
  },
  {
    id: 'small-suns',
    name: 'Small suns',
    group: 'light',
    variations: ['On the wall', 'On white cloth'],
    what: 'A limewashed wall in leaf shade, scattered with round images of the sun, wide pale ones and small sharp ones, all rocking together; over some ten minutes a bite creeps into every one until all are crescents, at times thin rings, then they fill; or the same suns falling on white sheets pegged to a line, bending over the folds.',
    follows:
      'Drones open the wide faint suns, pads the next, texture the crowds of small ones, keys the smallest; the piece opens and tints those where it sounds, and the phrase is one bright wandering sun. Bands light them by size. Low is the wind. A hit shuts a branch across as a dark wave; a cue bares every gap. The loop leans the light; travel moves the eclipse.',
  },
  {
    id: 'paper-screen',
    name: 'Paper screen',
    group: 'light',
    variations: ['Leaf shadow', 'Lamp within'],
    what: 'A sliding screen of fibrous paper in a dark lattice, with the sun behind it: bamboo close by lies sharp on the paper, stalks and leaves further off are soft, and a bare branch reaches in; or night, the lamp inside, a jug with a budding branch and a steaming bowl vague behind the paper, and black leaves before it.',
    follows:
      'The phrase brings the bamboo, or the branch, close and sharp, pads the soft leaves or the jug, drones the far stalks or a low ember glow. Texture brings up fibre and steam; low is wind, the level sun or lamp. The piece tints the panes. A hit is a bird and its branch dips, or a moth; a cue is a cloud, or someone passing; the loop slants the sun.',
  },
  {
    id: 'rose-window',
    name: 'Rose window',
    group: 'light',
    variations: ['Rose', 'Tall lights'],
    what: 'A great round window of coloured glass seen from the aisle, deep in carved stone and half behind a dark pier, hundreds of small pieces held in lead with daylight moving behind; or five tall lights in the end wall of a dark room, their colours thrown long and soft across the floor and up the side wall.',
    follows:
      "Each kind of sound lights its petals, or its tall light; low to high the bands glow from the middle out, or from the sill up; each piece brightens with its own place in the piece. A hit runs out along one petal, or down one light; a cue lets the full sun through one wedge, or one light. The sun shifts with the loop; keys and voice light the roundels' eyes.",
  },
  {
    id: 'scratched-film',
    name: 'Scratched film',
    group: 'light',
    variations: ['Scratches', 'Clear leader'],
    what: 'A strip of black film on a lamp, scratched by hand: many-toothed cuts that spread, cross and run together, a looping scribble, hatching, dust, sound marks along the edge, each pose held and melted into the next; or clear film with pools of blue dye and one drag of an orange brush, dried to dark rims and crystals.',
    follows:
      'Drone, pad, texture and phrase are each a cut, or a dye, crystals and drops, that grow with their sound and with the piece there. The bands make the sound marks. A hit is a burst of scratches or a thrown blot, a cue a wipe of wet colour. The lit gate goes along with the loop. Keys add loops or drops, a voice shakes the thin line.',
  },
  {
    id: 'candlelight',
    name: 'Candlelight',
    group: 'light',
    variations: ['One flame', 'Many steps'],
    what: 'A candle burns behind a plain bowl in a deep niche, out of sight but for its tip: its light goes up the wall, through a glass of water and along the edge of the table, and the rest is lost in brown dark; or dozens of small candles stand on stone steps that climb into the dark, each with its own halo.',
    follows:
      'The mix is the height of the flame and how far it reaches; each kind of sound colours what the light touches: bowl, linen, wall, glass, smoke, or its own candles on the steps. A hit bends the flame and lights its smoke, or is a breath across the steps; a cue brightens the whole niche, or is a glow that climbs the stairs; the keys make it flicker.',
  },
  {
    id: 'oil-slide',
    name: 'Oil slide',
    group: 'light',
    variations: ['Dye and oil', 'Cells'],
    what: 'Fat cells of clear coloured oil pressed between two round glasses and thrown on a wall, bright at their rims, joining and parting in dark red and violet ink, soft towards the edge of the beam; or a foam of unlike cells in two dyes, some with a yolk of another, shrinking and darkening as it drains downward.',
    follows:
      'Low rocks the glass. Drone, pad, texture and phrase each have a dye that takes more room as they sound. The bands swell the small bubbles and make the foam pulse. The whole mix brightens the lamp. A hit is a tap: a red cell shows, a ring runs out, and it bursts into droplets. A cue tips the glass and lifts the lamp. Keys and a voice do a little too.',
  },
  {
    id: 'burnt-gate',
    name: 'Burnt gate',
    group: 'light',
    variations: ['Through the heat', 'Melted sheet'],
    what: 'A frame of old amber and rose film has stopped in the gate and burns: gold halos, bubbles, black crusts, and holes where the bare lamp comes through; or a creased sheet of white plastic before a grey wall melts from the heat behind it, its holes sagging into drops with glossy, charred rims, torn films and threads.',
    follows:
      'Strokes burn where they lie, more as they sound; pads open two big holes, a phrase a line; the drone browns the border or the foot. Texture boils the film or blisters the sheet; bands swell bubbles or the heat. The loop carries the heat; a hit burns at the playing place, a cue in the middle; keys prick pinholes, a voice lights rims or folds.',
  },
  {
    id: 'last-sparkler',
    name: 'Last sparkler',
    group: 'light',
    variations: ['Pine needles', 'Willow'],
    what: 'A warm near-black night, a twisted paper string, and one small molten drop that throws thin branching sparks like pine needles over a wooden rail; or the later, heavier drop over dark water, its long soft threads bowing down like willow, each ending in a tiny fork, all seen again in the ripples.',
    follows:
      'The mix is the size and heat of the drop, the low band draws it down; bands and kinds each feed sparks of their own, and kinds tint night and smoke. The piece lies along the rail or the water. A hit throws a burst, a cue shakes the drop and opens a ring of fine sparks. Highs and keys feed a crown of short sparks, a voice the heat; the loop swells the fire.',
  },
  {
    id: 'pierced-drum',
    name: 'Pierced drum',
    group: 'light',
    variations: ['Round holes', 'Slots and combs'],
    what: 'A pale empty room at night and in it a dark pierced drum on a spindle, its lamps inside: fields of discs, rings of small ones, pinholes and a few like waxing moons slide over floor, walls and ceiling, long where they rake a wall; or a drum hung on a cord, whose slots and combs throw leaning bars that bend at the corners.',
    follows:
      'Drone, pad, texture and phrase are each a lamp with a piercing of its own, as bright as it sounds; the spectrum opens the holes from floor to ceiling; the two drums turn against each other as the music goes; low notes lift the spill on the walls, highs and keys light the pinholes, a hit sends a hoop of light out over the room, a cue tips the drum once.',
  },
  {
    id: 'upside-room',
    name: 'Upside room',
    group: 'light',
    variations: ['Plaster wall', 'Attic'],
    what: 'A closed room turned into a camera: the day outside lies upside down across a plaster wall, its rail and a door left ajar, with clouds low down, poplars and roofs hanging from above and a canal along the ceiling; or over the boards, rafters and stacked crates of an attic, where the hills hang from the roof.',
    follows:
      'Drone brightens the sky that lies low, pad thickens and tints the clouds, texture stirs the trees, phrase and keys light the windows, bands lean the sixteen poplars, the piece tints the fields. Louder is brighter and softer. A hit is a bird in a flash of light; a cue lets white daylight in by the door or a shutter. The loop moves the sun up and down.',
  },
  {
    id: 'wave-machine',
    name: 'Wave machine',
    group: 'light',
    variations: ['From the stalls', 'From the wings'],
    what: 'A small painted stage behind a dark arch: five twisted rollers of slate canvas with foam painted on their crests turn one behind another and read as sea, under board clouds and a painted moon, lit by candle shades and one cold lamp; or the same machine seen from the wings, with its bench, sawn ends, cranks and ropes.',
    follows:
      'Each kind of sound is one roller, drones at the back, hits at the front: it takes their colour and its screw deepens as it sounds. Fuller music turns them faster, the low band lifts them. The footlights are the mix, low to high from left to right. A hit lets down a gilt lightning, a cue lifts the moon; keys whiten the foam, a voice lights the clouds.',
  },
  {
    id: 'daylight-smoke',
    name: 'Daylight smoke',
    group: 'light',
    variations: ['Smoke flowers', 'Weeping lines'],
    what: 'Noon fireworks, painted in smoke on a pale paper sky, with only the tip of one pole below: round flowers of lumpy petals in chalk red, indigo, saffron and bottle green, lit from the upper left, the old ones only stains; or long weeping lines of two colours that fall from a burst, kink in the wind and thin out.',
    follows:
      'Where the piece sounds a shell opens as the loop gets there, in its colours, and frays to a stain. Drone leans it like wind, pad warms the sky, texture frays, phrase and voice thicken the thread; low, mid and high stretch petals and lines. A hit is a white-hearted flower at the playing place, a cue one great shell, keys dots. Tone sharpens, Space widens.',
  },
  {
    id: 'five-shadows',
    name: 'Coloured shadows',
    group: 'light',
    variations: ['Hung branch', 'Cut card'],
    what: "A white wall lit by five lamps of five colours that together make white. A bare branch hangs before it, only its tip in the frame, and throws five shadows, each in the colour its lamp's absence leaves, darker where they cross; or hoops, combs and a disc of cut card on threads, whose shadows cross in hard interlaced fans.",
    follows:
      'Each kind of sound is a lamp: as it sounds its own shadow deepens and sharpens and its light fills the others. Low draws things nearer the wall, texture and high stir the twigs, the mix deepens the colours. A hit flares one lamp and swings its shadow; a cue clears every edge and sways what hangs. The loop walks the lamps, Space spreads them, Tone sharpens.',
  },
  {
    id: 'bent-tubes',
    name: 'Bent tubes',
    group: 'light',
    variations: ['Wall drawing', 'By day'],
    what: 'One line of bent glass tube - a wave, a big loop, a leaf with its veins, a flourish - clipped to bare concrete, mostly grey and unlit until its gas glows and the colour falls on the wall; or a tangle of thin clear tube hung from two wires in a white workshop, window sun on the wall, a few lengths lit pale.',
    follows:
      'Drone is the loop, pad the wave, texture the leaf, phrase its veins, with keys and voice; by day each has a length of the tangle. Each glows as loud as it sounds, stronger where the piece is loud along the line, with a bright place at now. Bands brighten a bead in each tube. A hit lights the flourish or the inner ring; a cue runs along the whole line.',
  },
  {
    id: 'haze-beams',
    name: 'Haze beams',
    group: 'light',
    variations: ['Pale hall', 'Sheet'],
    what: "An empty pale hall with a row of square piers: a few wide soft beams slant in from the left through slow haze and dust, cut by the piers, and lie as pools on the floor and the far wall; or the hall at night, crossed by flat sheets of light seen nearly edge-on, slices of drifting smoke shining in them, the piers' shadows across.",
    follows:
      'Drone, pads, texture and phrase are each a beam or a sheet of their own, opening and brightening as they sound; a hit lights one more and dies; a cue widens them all and fills the haze; the low band thickens the haze, the bands light it from floor to roof by day, highs and keys bring out dust or fine smoke; a voice mists the hall or lifts the night walls.',
  },
  {
    id: 'humming-rods',
    name: 'Humming rods',
    group: 'form',
    variations: ['Five rods', 'One long wire'],
    what: 'Five steel rods stand on plain plinths before a plaster wall, shaken so fast that each is a vase of blur: pinched at its still places, bellied between, bright at both outlines, its soft shadow behind it; or one long wire runs across a dark room under a single wall lamp and swings into long bellies and bright knots.',
    follows:
      'Each kind of sound is one rod, or one set of bellies on the wire: the louder, the wider. The drone has few still places, texture many; keys add one to the phrase. The bands are the inner outlines, low notes soften shadows, the loop moves the lamp. A hit whips the shortest rod or runs along the wire; a cue swells and brightens.',
  },
  {
    id: 'turning-rooms',
    name: 'Turning rooms',
    group: 'form',
    variations: ['Grey rooms', 'Open ceilings'],
    what: 'Grey rooms open one into the next, each turned a quarter on its side: a panelled door and a chair stand on this floor, then on what is our wall, then overhead, and a window lays its patch of light in each; or bare white rooms with arched openings and no ceiling, where sun falls past joists and pale sky looks in from four sides.',
    follows:
      'Each room is a later moment of the loop, its patch of light in strips coloured by what plays there. The drone warms the near room, pads widen the patches or bring clouds, texture is dust or leaf shade, a phrase opens the doors or thins the joists, bands light the panes; a hit lights a room ahead, a cue runs from near to far, keys touch the floor.',
  },
  {
    id: 'iron-filings',
    name: 'Iron filings',
    group: 'form',
    variations: ['Filings', 'Spiked fluid'],
    what: 'Thousands of iron needles on white paper over hidden magnets: they lie in chains along the pull, stand up thick and black at the poles and throw small shadows; or a pool of black magnetic fluid in a white dish that swells and rises into crowns of glossy spikes.',
    follows:
      'Drone, pad, texture and phrase are each a pole that grows stronger as it sounds, its colour showing through the paper or from a lamp; keys and a voice add to it. High sound sharpens the points. A hit sends a ring of knocked needles or spikes outward; a cue turns one pole round, or lets the crowns sink and rise. The poles drift over minutes.',
  },
  {
    id: 'balance',
    name: 'Balance',
    group: 'form',
    variations: ['Found plates', 'Straw frames'],
    what: 'A hanging tree of found things on straight rods and thread, slate, oyster shell, birch bark, a brass offcut, a mussel, a pot shard, a pebble and sea glass, turning in window light with one soft shadow each on a plaster wall; or a few gold straw frames on threads against an evening sky, lit from behind.',
    follows:
      "Each kind of sound is one thing or one frame: as it sounds it turns, takes a little of its colour and, among the plates, weighs its rod down. Low, mid and high, keys and voice turn or light the small ones. A hit rocks the shard's rod, or runs down the great frame as light; a cue breathes through the whole tree. The loop moves the light.",
  },
  {
    id: 'empty-square',
    name: 'Empty square',
    group: 'form',
    variations: ['Paved plain', 'Wide steps'],
    what: 'A sunlit square of pale stone seen from a high window, with nothing standing in it, and across it the long blue shadows of things that are not there: an arch, a tall vase, a ladder, a flag, a ball on a rod; or a wide flight of shallow steps that the same shadows climb in zigzags.',
    follows:
      'Each kind of sound is one shadow that darkens and grows as it plays: drone the arch, pad and voice the vase, texture the flag, phrase the ladder, whose rungs thicken with the piece; a hit shows the ball and bounces it. The loop is the sun and swings them all. The spectrum is sixteen railings, keys are birds, travel moves thin cloud, a cue one big cloud.',
  },
  {
    id: 'glass-skeletons',
    name: 'Glass skeletons',
    group: 'form',
    variations: ['Turning lattice', 'Scattered sand'],
    what: 'A ball of glass lattice, six-sided windows with twelve five-sided among them, turns slowly with a smaller ball inside it and twelve long needles, under one lamp on deep blue-grey; or many small glass shells of seven builds, balls, plates, bells, stars and boats, lie like sand on a pale grey slide, some out of focus.',
    follows:
      'The bands open the windows; the drone lights the inner ball, the phrase lengthens the needles, the piece colours the edges of the bars; a hit sends a ring of light round the shell, a cue swings the lamp round. On the slide each kind has shells of its own, which come into focus and take its colour, and the piece tints what lies at its place.',
  },
  {
    id: 'belted-air',
    name: 'Belted air',
    group: 'form',
    variations: ['Standing', 'Squeezed between walls'],
    what: 'A great soft body of ochre sailcloth, blown tight and wider at one shoulder, stands in a pale studio, tied by five coloured belts, each at its own tilt, with a buckle and a slack end. Or the same body fills a gap between two plain walls under a low ceiling, pressed flat where they hold it and swelling out toward us.',
    follows:
      "Each kind of sound draws in its own belt and the cloth bulges beside it. Loudness and the drone fill it, lows are its breath, texture deepens the creases, the phrase twists it. Bands dimple the tufts, keys light the buttons, a voice the room. A hit flares and snaps one belt, a cue pulls all five. The piece runs in the belts' stripes; the loop sways the sun.",
  },
  {
    id: 'strung-form',
    name: 'Strung form',
    group: 'form',
    variations: ['Brass hoops', 'Crossed bars'],
    what: 'Two tilted brass hoops on posts, strung with silk, stand on a round linen-white plinth in window light; the straight threads twist into a waisted skin, and the shadow of every one lies on the wall. Or two dark bars tipped with brass, crossed in bright fog, the threads between them drawing one long curve.',
    follows:
      "The drone and the tone dial twist the form. Each sheet is two kinds, dyed as deep as they are loud; the piece tints threads where it sounds. Sixteen bands blur sixteen groups. The phrase and the keys run glints, a hit plucks a group and sends its colour down, a cue passes light and turns the form. The playhead is a small light, low notes move the window's.",
  },
  {
    id: 'spinning-tops',
    name: 'Spinning tops',
    group: 'form',
    variations: ['On the table', 'On the rail'],
    what: 'Five painted wooden tops of unlike shape, a saucer, a pear, three tiers, a spindle and an acorn, turn and lean on pale boards in a low window light, with long shadows; or turned bobbins roll slowly along a wooden rail before a blue-green wall where the same window falls.',
    follows:
      "Each kind of sound is one form: as it sounds its top stands up straighter or its bobbin draws apart, its paint deepens and its colour falls nearby. The bands light the inlaid rings, low notes the window, keys the knobs. A hit lights the small one and runs over the boards or along the rail; a cue leans them all. The rail's inlay shows the piece.",
  },
  {
    id: 'thousand-cells',
    name: 'Thousand cells',
    group: 'form',
    variations: ['Great cell kite', 'Long train'],
    what: 'A great kite of some two hundred small four-cornered cells in thin rust-red silk hangs tilted in a pale sky, the light coming through so that single cells glow and layered ones go deep; or a train of sixty round painted paper kites on one line, large at lower left, curving up and away over the flats until the last are specks.',
    follows:
      'The mix opens the great kite wider, the low band tilts it, each kind of sound dyes its tier; a hit runs through the silk from the near corner, a cue is a gust that swings it. In the train each kite is a moment of the loop: its marks fill as the piece does there, in its colours, and the one playing turns to face you; hits and cues run up the line as light.',
  },
  {
    id: 'spilled-strips',
    name: 'Spilled strips',
    group: 'form',
    variations: ['On the board', 'On edge'],
    what: 'A dozen strips of veneer, felt, slate and card lie spilled towards one corner of an old painted board, each with its shadow on what lies under it, much of the board left bare; or the same strips stand on edge, some bent, seen from above in low sun, their long shadows running over the board, tinted where the sun comes through.',
    follows:
      'Drone, pad, texture and phrase each have their own strips, which lengthen, rise and take its colour; card shows the piece along its length. Bands stretch the slivers, keys too. The low raises the pile, or the walls. A hit kicks a red strip and throws a bar of light, a cue warms the light and lengthens every shadow; a voice brightens the bare board.',
  },
  {
    id: 'slow-cadence',
    name: 'Coming round',
    group: 'rule',
    variations: ['Beads on paper', 'Fine arms'],
    what: 'Ninety beads of ink on a warm white sheet, small at the heart and fat at the rim, scattered like seed until they gather on threads into five arms, three, a pair of facing curves, one long curl, and come apart again; or each bead is the pearl at the tip of a hair-fine bent arm, pale on charcoal, opening and folding like fans.',
    follows:
      'Fuller music brings the next gathering sooner. Heart to rim the beads are the low to the high bands, each as large as its band is loud, and wet and coloured by what the piece sounds at its row. A hit swells them from the heart outward, and a cue darkens them or lights the arms, dot by dot; low sound spreads the rows; the keys pick out a few beads.',
  },
  {
    id: 'beam-figures',
    name: 'Beam figures',
    group: 'rule',
    variations: ['Screen', 'Long trace'],
    what: 'The round glass of a measuring tube, its etched scale, and on it a thin green-white beam swept so fast to and fro that it draws folded ribbons of wire mesh, with an amber afterglow where they just were; or no tube at all: one long ribbon of fine lines hangs in black, looping and turning, bright where the beam is slow.',
    follows:
      'The pad and the phrase fold the figure, the drone and the lows widen it, texture and highs add threads, the piece tints them. On the long trace each kind has its own stretch, which opens and takes its colour, and each line is a band. A hit runs along the trace as a bright spot, a cue opens it wide; keys light the scale or the edges, a voice warms it.',
  },
  {
    id: 'touching-circles',
    name: 'Touching circles',
    group: 'rule',
    variations: ['Painted board', 'Ink lines'],
    what: 'Weathered cedar planks painted with circles that all touch: a great ring holds a few, the gaps hold smaller ones, down to seeds, in chalk white, oxide red and indigo worn back to the wood; or the same family in double ink lines on an old folded sheet, standing on a ruled line, each with the prick of the compass at its middle.',
    follows:
      'The family slides with the music, big circles shrinking as seeds open; the loop rocks it. Each circle reads the piece at its place: loud ones take full paint or a wash. The bands, low to high, fill great to small; drone weighs the ring or the lines, texture the grain, phrases mark the touching points. A hit repaints one, a cue runs through the sizes.',
  },
  {
    id: 'one-spiral',
    name: 'One spiral',
    group: 'rule',
    variations: ['Engraved', 'Loose hand'],
    what: 'One black line winds out from a point on white paper, and only by growing thicker and thinner it makes an egg on a cloth, a rolling wave, a knot, each turning into the next over minutes with its own shadow; or the same line by a loose hand in brown ink, wandering, running dry and dipped again, the form half there.',
    follows:
      "Loudness takes the line from nearly even to full relief. The drone lifts the wave, pads soften the light, texture roughens the line's edge, a phrase sends a ripple outward. A hit is a coloured blot running out from the middle, a cue slides the line round a whole turn. The spectrum weights its rings, the loop swings the light, keys drop beads.",
  },
  {
    id: 'slow-stripes',
    name: 'Slow stripes',
    group: 'rule',
    variations: ['Leaning waves', 'Folded cloth'],
    what: 'Broad soft stripes of grey, brick and sea blue on pale paper, swelling and thinning so that the flat sheet seems to roll in slow leaning waves; or the stripes of a hanging cloth, broad and fine by turns, parting and crowding as long folds lean across it and slowly pass.',
    follows:
      'Low sound deepens the waves and folds. Each sound dyes and swells the stripes where it lies in the piece; the bands heard set their widths. Pads make them breathe more, textures open fine lines, the melody widens the warm stripes, keys the blue. A hit is a narrow pinch that runs across, a cue a wide one. Tone adds stripes, space opens the waves.',
  },
  {
    id: 'smoke-streams',
    name: 'Smoke streams',
    group: 'rule',
    variations: ['Five bodies', 'Broken wake'],
    what: 'Fine silver threads of smoke fall side by side through a black box and part round five unseen round bodies: pressed bright at their sides, closing again below, the smoke that touched a body carrying its colour down; or the threads cross the box past one body and, behind it, roll up into slow curls to either side.',
    follows:
      'Each kind of sound is a body, larger and more coloured the louder it is; in the wake it is a curl, wound tighter, and the body grows with the whole mix. Bands brighten their own threads, the low end sways them, puffs travel along. A hit sends a bright front down all threads, a cue moves a body across the stream, keys make threads tremble, a voice lays haze.',
  },
  {
    id: 'ember-trail',
    name: 'Ember trail',
    group: 'rule',
    variations: ['Powder maze', 'Hung coil'],
    what: 'Seen from above, a tray of white ash with a combed edge and a winding line of brown incense powder: behind one small ember it has burned to pale ash, far ahead it is laid again, and a thread of smoke leans away; or great coils of incense hung in rows under a smoky ceiling, each with a red point, pale ash and a slip of paper.',
    follows:
      'An ember burns on with the loop; powder and coils are thick and coloured where the piece is loud. Drone brightens embers, and each hung one answers a kind of sound; pad widens smoke, phrase curls it, bands sway it, texture roughens ash, keys spark or light the slips. A hit flares embers and drops ash; a cue glows along old ash, or from near coils to far.',
  },
  {
    id: 'worn-floor',
    name: 'Worn floor',
    group: 'rule',
    variations: ['Dry stone', 'Rained on'],
    what: 'An old floor of ivory, rose and dark green marble lozenges that read as boxes standing up or sinking in, seen at a slant, chipped, veined and trodden hollow, low window light in one long bar across it; or the same stones in a yard after rain, from straight above, hollow ones holding sky and bare branches, a few leaves fallen.',
    follows:
      'The drone warms the rose stones, the pad the ivory, texture the green, in their veins too; a melody lights veins and leaves; the piece polishes the floor or tints the sky. Lows deepen the hollows or raise the water. A hit lights one box, in the rain with a drop. A cue moves the sun across and back, the loop a little. Keys glint, a voice warms, Tone sharpens.',
  },
  {
    id: 'finish-strip',
    name: 'Finish strip',
    group: 'rule',
    variations: ['Things passing', 'Once round'],
    what: 'A long photograph taken through a slit, time laid out sideways on white paper: a high bicycle with bent spokes, birds, cloth on poles and turning leaves over streaks of ground that never moved. Or the painted skin of a round clay pot unrolled: wading birds, reeds, spirals and hatching between two dark rims.',
    follows:
      'Across is the loop: each stroke is a sheaf of streaks, or darker paint. Drones darken and stretch the bicycle or fill the spirals, pads the cloth or reeds, texture the leaves or hatching, phrases the birds. Bands are ground streaks or turned lines. A hit is a needle at the playhead; a cue widens the middle; Tone sharpens, Space pales, keys darken the scale.',
  },
  {
    id: 'shrinking-tiles',
    name: 'Shrinking tiles',
    group: 'rule',
    variations: ['Cut leaves round', 'Glass cap'],
    what: 'A round of pale paper cut into curved leaves over a dark green sheet, large in the middle and smaller and smaller towards a rim they never reach; the frame cuts the round; or a cap of clear glass cased in cobalt on a table, the same leaves cut through the colour, their shadows seen through the glass.',
    follows:
      'All of it slides slowly through itself, faster as the music fills, and sways with the loop. Drone and pad ink the two sorts of dark leaf, the piece inks those at its place, texture and phrase tint the light ones. The bands light rings towards the rim. A hit colours a few leaves, a cue sends a ring of shade to the rim, keys gild the veins.',
  },
  {
    id: 'table',
    name: 'Table',
    group: 'backplates',
    variations: ['Wood', 'Cloth'],
    what: 'A table seen from straight above, to lay gear on: dark boards under one warm lamp, or the same table under a woven cloth. It stays quiet on purpose, so that what lies on it is what is looked at.',
    follows:
      'The lamp breathes with the mix and takes a little of the colour of what sounds; the piece glows along the far edge of the table, brightest at the place now playing; a hit or a cue sends one soft ring of light out from under the lamp; Glow turns the lamp up.',
  },
]

const stylesById = new Map(VISUAL_STYLES.map((style) => [style.id, style]))

/** The style of that id; undefined for a bend and for an id this build does not have. */
export function visualStyle(id: string): VisualStyle | undefined {
  return stylesById.get(id)
}
