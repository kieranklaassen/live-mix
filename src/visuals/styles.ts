/**
 * The styles a visual can be drawn in. Each is a shader in `shaders/<id>.glsl`, in two variations, and follows the
 * piece and the performer in its own way. The words here are the ones the list, the info view and the agent show.
 * The file opens each shader with the same words as comments; `styles.test.ts` holds the two together.
 *
 * An id is saved in pieces: it is never renamed and never given another picture.
 */

export type VisualGroupId = 'dots' | 'worlds' | 'gradients' | 'nature'

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
]

const stylesById = new Map(VISUAL_STYLES.map((style) => [style.id, style]))

/** The style of that id; undefined for a bend and for an id this build does not have. */
export function visualStyle(id: string): VisualStyle | undefined {
  return stylesById.get(id)
}
