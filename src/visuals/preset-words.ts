// What every preset is called and what is seen in it: its id, its variation and its sentence, under its style.
//
// Written by `scripts/gen-visual-presets.mjs`, from the files of `presets/`.

export const PRESET_WORDS: Readonly<
  Record<string, readonly (readonly [id: string, variation: 0 | 1, what: string])[]>
> = {
  agate: [
    [
      'amethyst-on-black',
      0,
      'A round stone crowded with violet crystals glows on a black table, its rim a thin warm line.',
    ],
    [
      'six-shore-pebbles',
      0,
      'Six small ringed stones in sea blue and cream lie apart on a table of pale driftwood.',
    ],
    [
      'cut-through-onyx',
      0,
      'Level beds of black, bone and umber run straight across, close enough to fill the eye.',
    ],
    [
      'ocean-stone-eyes',
      0,
      'Ringed eyes of teal, cream and rust crowd the whole face of a polished stone.',
    ],
    [
      'gold-mended-indigo',
      0,
      'A round plate of deep blue stone has been broken and put together again with gold.',
    ],
    [
      'stirred-fire-opal',
      0,
      'Bands of ember red and honey fold over one another like stirred syrup, always moving on.',
    ],
    [
      'moon-on-slate-water',
      1,
      'One white moon hangs in ringed dark stone, and a path of it lies on the level water.',
    ],
    [
      'drowned-rose-peaks',
      1,
      'Sharp banded peaks stand out of a wide calm sea at dawn, rose above and violet below.',
    ],
    [
      'wide-jade-shallows',
      1,
      'A pale level sea lies wide and empty under a ringed green sky, one dark shore in front.',
    ],
    [
      'fern-thicket-ochre',
      1,
      'Tall black mineral ferns crowd dry ochre hills that fold over under a yellow sky.',
    ],
  ],
  balance: [
    [
      'leaves-on-long-threads',
      0,
      'Pressed leaves in rust and ochre hang each on its own thread where sun falls through a tree.',
    ],
    [
      'coloured-glass-by-a-lamp',
      0,
      'Clear discs of blue, amber and rose throw long coloured shadows over a warm lamplit wall.',
    ],
    [
      'cellar-by-lamplight',
      0,
      'Three old things hang by a low lamp in a cellar where the plaster has come off the brick.',
    ],
    [
      'iron-rings-at-noon',
      0,
      'Thin iron rings hang one beneath another on a single string against a bare white wall.',
    ],
    [
      'kelp-in-green-shallows',
      0,
      'Strands of kelp blades sway in green water, broken light moving over the bottom behind them.',
    ],
    [
      'panes-in-mountain-wind',
      1,
      'Coloured panes on long threads blow aside in a pale sky before ranges of grey peaks.',
    ],
    [
      'lamps-over-the-bay',
      1,
      'A row of lit frames hangs over dark water, each glowing in its own colour.',
    ],
    [
      'frost-spindles',
      1,
      'Tall thin spindles of wire with a bead of frost at each joint stand in a starry night.',
    ],
    ['red-disc-and-two-frames', 1, 'Two large frames hang before a flat red sun on pale paper.'],
    [
      'glass-drops-in-a-low-sun',
      1,
      'Drops of pale blue glass hang one under another before a great low sun and red evening mountains.',
    ],
  ],
  'banded-planet': [
    [
      'wide-straw-rings',
      0,
      'A small straw coloured globe floats inside broad open rings in the black.',
    ],
    [
      'sepia-planet-plate',
      0,
      'A globe of many fine bands printed in brown ink on old cream paper, with a row of moons.',
    ],
    [
      'eye-of-a-rust-storm',
      0,
      'One vast rust red storm turns among curling belts of cream and brown.',
    ],
    [
      'cracked-ice-moon',
      0,
      'A pale shell of ice, run over by fine brown cracks, lit almost from in front.',
    ],
    [
      'rain-on-a-blue-world',
      0,
      'White cloud lies torn along the belts of a world of deep sea and green land.',
    ],
    [
      'marbled-jade',
      0,
      'Green, cream and black run through each other like veins in polished stone, close up.',
    ],
    [
      'gold-ring-of-a-hidden-sun',
      1,
      'A dark globe covers its sun, and only a thin gold ring of air shines round it.',
    ],
    [
      'green-veils-at-the-pole',
      1,
      'Curtains of green and rose light stand along the dark edge of a sleeping world.',
    ],
    [
      'ring-arch-in-pink-haze',
      1,
      'A great pale arch of rings stands in a rose sky over long plum and cream bands of cloud.',
    ],
    [
      'seven-moons-rising',
      1,
      'Half moons of every size hang in an arc over a blue edge, before clouds of stars.',
    ],
  ],
  'bead-curtain': [
    [
      'amber-beads-on-linen',
      0,
      'A few strings of large clear amber beads hang before a sunlit linen wall.',
    ],
    [
      'pearl-doorway',
      0,
      'Strings of pearls part in an arch, and a blue and rose evening shows through.',
    ],
    [
      'lustre-of-cut-drops',
      0,
      'Cut glass drops hang in a deep point like a lamp, gold where the light runs down them.',
    ],
    [
      'bladder-weed',
      0,
      'Strands of weed with round floats wave in green water, every float another size.',
    ],
    [
      'jet-fringe-on-white',
      0,
      'A fringe of thin black tubes hangs to a point before a plain white wall.',
    ],
    [
      'beadwork-panel',
      0,
      'Thousands of small beads in brick, indigo and ochre sit close and draw the piece as a picture.',
    ],
    [
      'rain-into-a-grey-lake',
      1,
      'Fine rain falls out of a grey evening and opens rings on still water.',
    ],
    [
      'bubbles-in-cider',
      1,
      'Thin round bubbles of every size drift up through clear golden cider.',
    ],
    [
      'red-berries-at-blue-dusk',
      1,
      'Red and white berries of every size fall slowly through a blue winter dusk.',
    ],
    [
      'sparks-off-a-grindstone',
      1,
      'Orange sparks of every size stream aside through the dim red and brown light of a smithy.',
    ],
  ],
  'beam-figures': [
    [
      'blueprint-of-a-knot',
      0,
      'White lines lay out a four lobed knot on a sheet of deep blue drawing paper.',
    ],
    [
      'night-shift-gauges',
      0,
      'Rows of small round glasses glow in the dark, each with its own knot of amber or green light.',
    ],
    [
      'porcelain-pulse-dial',
      0,
      'A white enamel instrument with two knobs, a few thick strokes of teal ink on its round face.',
    ],
    [
      'paprika-veil',
      0,
      'A broad veil of saffron and rose folds over itself before a hot brick red wall.',
    ],
    [
      'hoop-over-black-water',
      0,
      'A hoop of white light, bright at one side and faint at the other, hangs over black water.',
    ],
    [
      'festoons-of-brown-ribbon',
      1,
      'Rows of thin brown ribbon loop in scallops, light and dark by turns, across old buff paper.',
    ],
    [
      'kelp-frond-light',
      1,
      'Long fronds hang upright side by side in green shallows with the sun coming through them.',
    ],
    [
      'tissue-paper-peony',
      1,
      'A round flower of thin pink tissue, its petals darker where one lies over another.',
    ],
    [
      'rose-silk-over-water',
      1,
      'A broad sheet of rose and cream silk stands over still water and is mirrored in it.',
    ],
    [
      'wind-over-a-crest',
      1,
      'Fine pale threads stream up and over an unseen ridge under a violet evening.',
    ],
  ],
  'below-the-line': [
    [
      'milk-fjord-morning',
      0,
      'A row of small white peaks stands in pale turquoise water, with long blue ice hanging below.',
    ],
    [
      'lone-floe-at-moonset',
      0,
      'One small lump of ice, faintly lit from within, under a low moon in a wide black sea.',
    ],
    [
      'sandstone-sea-stack',
      0,
      'A tall rock of red and cream layers rises from a warm green sea under a wide sky.',
    ],
    [
      'slate-slabs-underwater',
      0,
      'Broken plates of grey slate lie stacked deep under the surface in slanting green light.',
    ],
    [
      'rose-jelly-bell',
      0,
      'A round rose bell of clear flesh hangs in dark blue water and trails its long threads.',
    ],
    [
      'pack-ice-from-below',
      1,
      'Broken floes float close together on a bright rippled ceiling of water, seen from beneath.',
    ],
    [
      'amber-drop-in-resin',
      1,
      'A great rounded drop of clear amber hangs in honey light with a slow gleam above it.',
    ],
    [
      'boulder-under-lake-crust',
      1,
      'From under a frozen lake the snow light comes through cracked ice past a dark boulder.',
    ],
    [
      'hanging-root-garden',
      1,
      'A green rock hangs from the surface over dark water, trailing pale green roots that move with the water.',
    ],
    [
      'lens-under-lake-snow',
      0,
      'A broad blue lens of clear ice hangs in dim water under a lake lidded with snow.',
    ],
  ],
  'belted-air': [
    [
      'gourd-in-stubble',
      0,
      'One great ribbed gourd, tied with thin cords, lies on a straw field under an evening sky.',
    ],
    [
      'silver-parcel-by-lamp',
      0,
      'A square parcel of crumpled silver foil gleams beside a single low lamp in a dark room.',
    ],
    [
      'lantern-above-a-floor',
      0,
      'A ribbed paper lantern hangs over a dark floor and lights it from within.',
    ],
    [
      'wool-bales-in-snow',
      0,
      'A row of square woollen bales stands strapped on blue snow before a pale winter sky.',
    ],
    [
      'striped-balloon-over-dunes',
      0,
      'A tall balloon striped in teal and cream floats just over rose sand under a clear sky.',
    ],
    [
      'moss-hummock-at-dusk',
      0,
      'A low mound of green moss, drawn into lumps by thin roots, lies in the last warm light.',
    ],
    [
      'linen-in-a-niche',
      1,
      'Broad white bandages hold a bundle of white linen in a white niche, all light and shadow.',
    ],
    [
      'indigo-in-clay-alcoves',
      1,
      'Bundles of indigo cloth fill a long row of alcoves in a red clay wall.',
    ],
    [
      'red-plush-seen-close',
      1,
      'Deep red plush, seen close, swells between its narrow gold straps in the light of one low lamp.',
    ],
    [
      'copper-bale-in-a-recess',
      1,
      'A bale of polished copper lies pressed into a low recess, strapped in grey and verdigris.',
    ],
  ],
  'bent-tubes': [
    [
      'croziers-by-the-pond',
      0,
      'Curled fern stems glow green over still dark water after the sun has gone.',
    ],
    [
      'white-stitch-on-indigo',
      0,
      'Rings of white running stitch cover a deep indigo cloth, row upon row.',
    ],
    [
      'coiled-straw-hive',
      0,
      'Rope upon rope of golden straw is wound up into a round hive on a grey stone slab.',
    ],
    [
      'pier-bulbs-at-closing',
      0,
      'Strings of round warm bulbs hang over a black tide that gives each of them back.',
    ],
    [
      'boiled-sugar-loops',
      0,
      'Fat soft lines of sugar, rose, lemon and mint, lie bent on a white slab.',
    ],
    [
      'gilt-scrolls-on-crimson',
      0,
      'Curled gold lines are drawn over and over on a deep red wall, facing one another.',
    ],
    [
      'loops-under-a-night-tree',
      1,
      'Moonlight comes through leaves onto a wall where thin loops of glass hang, a few of them lit.',
    ],
    [
      'washhouse-copper-pipe',
      1,
      'One copper pipe goes up and down an ochre wall in the striped sun of a shutter.',
    ],
    [
      'undyed-wool-by-a-window',
      1,
      'A loose hank of cream and grey wool hangs on a slate blue wall in the square sun of a window.',
    ],
    [
      'jelly-chains',
      1,
      'Chains of small clear bells sway in deep blue water, and some of them shine.',
    ],
  ],
  'black-hole': [
    [
      'butter-giant-and-rings',
      0,
      'A great pale yellow planet hangs in black with its flat rings and their shadow across it.',
    ],
    [
      'ink-turned-in-milk',
      0,
      'Two arms of brown ink wind round a black drop on a white ground, seen from above.',
    ],
    [
      'seen-from-the-rim',
      0,
      'The disc is one thin bright line, and the far side of it stands round the hole as a ring.',
    ],
    [
      'belt-of-a-broken-moon',
      0,
      'Round stones of every size drift about a dark ball, each lit from the left.',
    ],
    [
      'rose-cloud-fountain',
      0,
      'A thin bright fountain stands up out of the disc before great clouds of rose and teal.',
    ],
    [
      'drop-on-dotted-paper',
      1,
      'A clear drop lies on white paper printed with small dots and bends them round its edge.',
    ],
    [
      'one-long-exposure',
      1,
      'Stars draw long silver arcs across the night and bend aside for something dark.',
    ],
    [
      'banded-white-bowl',
      1,
      'Thin rings of plum, rust and ochre are painted round the black well of a white bowl.',
    ],
    [
      'striped-evening-eclipse',
      1,
      'A black round stands before broad bands of evening colour and bends them about itself.',
    ],
    [
      'glass-bead-in-cloud',
      1,
      'A clear glass ball hangs in drifting rose and grey cloud and gathers all of it inside.',
    ],
  ],
  'block-garden': [
    [
      'lantern-raft-town',
      0,
      'A little town of paper houses glows from inside on deep blue water at night.',
    ],
    [
      'first-snow-in-the-pines',
      0,
      'Firs and a few tall towers stand in new snow at dusk, and the small lamps are lit.',
    ],
    [
      'clay-roofs-without-end',
      0,
      'Flat clay blocks lie wall to wall like a desert town, lit from low on one side.',
    ],
    [
      'towers-over-the-fog',
      0,
      'Tall narrow houses with lit windows stand up out of a rose evening fog.',
    ],
    [
      'street-plan-in-ink',
      0,
      'Every house is drawn in thin ink on cream paper, seen from straight above.',
    ],
    [
      'far-sheds-on-a-dune',
      0,
      'A few small sheds stand far apart on warm sand and throw shadows many times their length.',
    ],
    [
      'shop-shelf-after-closing',
      1,
      'Two crowded shelves of small houses stand in the dark with their windows still lit.',
    ],
    [
      'felt-trees-in-a-row',
      1,
      'Round and pointed trees in rose, sage and straw stand along one pale green shelf.',
    ],
    [
      'white-plaster-models',
      1,
      'Tall plain white models stand in ranks in soft light, all shadow and no colour.',
    ],
    [
      'spilled-on-the-red-board',
      1,
      'Blocks of every size stand about at all angles on boards before a brick red wall.',
    ],
  ],
  'breath-pane': [
    [
      'last-bus-window',
      0,
      'Rain runs slantwise over a dark bus window, and the lit windows of a town go slowly by.',
    ],
    [
      'ice-flower-sash',
      0,
      'Feathers of ice cover an old white window, with a snowed-in cabin in the melted places.',
    ],
    [
      'ferry-porthole',
      0,
      'Through one round port a still sound, far peaks and a thin line of harbour lights.',
    ],
    [
      'front-door-ribs',
      0,
      'The evening garden in tall amber stripes, seen through the ribbed glass of a front door.',
    ],
    [
      'fingertip-dots',
      0,
      'Someone has dabbed the white mist away dot by dot, and dark peaks show in every dot.',
    ],
    [
      'coral-fjord-in-drops',
      0,
      'Great clear drops hang before a coral evening fjord, and each holds its dark peaks upside down.',
    ],
    [
      'bamboo-behind-silk',
      1,
      'Thin blades stand dark and pale, some sharp and some lost, behind a bright white pane.',
    ],
    [
      'drops-on-a-great-leaf',
      1,
      'A few huge clear drops hang before broad wet leaves, each holding the whole garden.',
    ],
    [
      'house-of-glowing-leaves',
      1,
      'In a dim blue glass house the leaves carry their own light along every rim and vein.',
    ],
    [
      'wiped-russet-beech',
      1,
      'Long straight strokes of a cloth lay bare leaves of rust, plum and ochre on tan.',
    ],
  ],
  'bubble-raft': [
    [
      'raspberry-froth',
      0,
      'A thick pink froth pressed into cells, its walls dark berry, light caught in each.',
    ],
    [
      'pearls-on-grey-silk',
      0,
      'A few large pale pearls lie apart on smooth grey cloth, each with its small soft shadow.',
    ],
    [
      'moon-made-of-beads',
      0,
      'A ball covered all over in close beads, one colour to a country, turns slowly in the dark.',
    ],
    [
      'red-rice-and-black',
      0,
      'Long grains of red, black and straw lie in short rows that turn from patch to patch.',
    ],
    [
      'duckweed-ditch',
      0,
      'Flat round leaves of duckweed, pale and deep green, crowd the dark water of a ditch.',
    ],
    [
      'one-raft-on-blue',
      0,
      'A single island of clear bubbles lies quite still in the middle of a wide blue water.',
    ],
    [
      'full-moon-domes',
      1,
      'Glass domes to the edge of the world, each holding a thin cut of the full moon.',
    ],
    [
      'shingle-at-low-sun',
      1,
      'Round stones of rust, sand and slate run down to the sea, all lit by a low sun.',
    ],
    [
      'pads-at-first-light',
      1,
      'Thin round pads lie apart on milky water in a pale green and rose morning.',
    ],
    [
      'tray-of-glass-marbles',
      1,
      'Great glass marbles of teal, plum and amber stand side by side, seen from close above.',
    ],
  ],
  'burnt-gate': [
    [
      'strip-of-small-frames',
      0,
      'Rows of little frames, faded to rose, cream and sea blue, and the light eats holes in them.',
    ],
    [
      'letter-from-the-grate',
      0,
      'A pale sheet of paper smoulders, its holes ringed in fire and the night behind them.',
    ],
    [
      'moss-cays-from-above',
      0,
      'Soft green islands with low scalloped shores lie in a shallow teal sea, seen from high up.',
    ],
    [
      'stubble-fire-by-night',
      0,
      'Thin crooked lines of fire crawl over a black field, brightest where the wind finds them.',
    ],
    [
      'wells-of-cut-card',
      0,
      'Round wells cut through layer on layer of coloured card, each step lower in shadow.',
    ],
    [
      'ice-cave-curtain',
      1,
      'Long pale blue folds of ice hang down, their openings rimmed with frost, night behind them.',
    ],
    [
      'oilskin-at-daybreak',
      1,
      'A wet black oilskin full of holes, and through them the peach and blue of the first light.',
    ],
    [
      'sky-pools-in-clay',
      1,
      'A red clay bed has dried and cracked all over, and the last round pools hold the sky.',
    ],
    [
      'slashed-red-curtain',
      1,
      'A heavy red curtain in deep folds, cut through in long slits that let the grey in.',
    ],
    [
      'crags-in-a-cloud-sea',
      1,
      'Dark wet crags stand out of a pale sea of cloud that goes slowly up and over them.',
    ],
  ],
  candlelight: [
    [
      'limewashed-alcove',
      0,
      'Morning comes into a white alcove where one bowl stands and a small flame still burns behind it.',
    ],
    [
      'bottles-along-a-shelf',
      0,
      'A row of tall bottles stands on a low wide shelf with one flame burning among them.',
    ],
    [
      'cairn-in-black-water',
      0,
      'Three stones stand on one another in still water, and a hidden flame lights them from behind.',
    ],
    [
      'sill-over-the-hills',
      0,
      'One bowl and a thin taper at the edge of black water, with blue hills and a pale moon behind.',
    ],
    [
      'table-from-the-ladder',
      0,
      'The bowl, the pear and the glass seen from high up, the candle standing at the front of the cloth.',
    ],
    [
      'paper-globes-afloat',
      1,
      'Paper lanterns drift on a wide black lake under a dusk sky, each with its light in the water.',
    ],
    [
      'snow-steps-at-noon',
      1,
      'A few candles burn on broad white steps of snow in flat grey daylight.',
    ],
    [
      'ranks-in-blue-shallows',
      1,
      'Candles stand in straight ranks in shallow water and go pale one behind another in blue fog.',
    ],
    [
      'reed-tapers-far-down',
      1,
      'Seen from high above, hundreds of thin tapers crowd the dark floor like reeds.',
    ],
    [
      'cliff-of-small-flames',
      1,
      'A steep wall of red stone ledges goes up out of sight, crowded with small flames.',
    ],
  ],
  canopy: [
    [
      'cherry-bough-noon',
      0,
      'Pink blossom hangs along a dark bough over a pale noon sky, and single petals drift down.',
    ],
    [
      'pine-ring-moon',
      0,
      'Tall pines stand all round and run together toward a full moon among small stars.',
    ],
    [
      'ginkgo-letting-go',
      0,
      'Grey trunks run up into a bright sky, and round yellow leaves thin out and come down.',
    ],
    [
      'great-fig-leaves',
      0,
      'A few huge green leaves hang close overhead, cut like paper against a warm sky.',
    ],
    [
      'white-line-boughs',
      0,
      'Long leaves drawn in fine white lines hang from above over an empty moonlit dark.',
    ],
    [
      'cypress-swamp-morning',
      1,
      'Great dark trunks stand in still teal water, and pale morning light slants down to it.',
    ],
    [
      'beeches-in-white-fog',
      1,
      'Grey trunks fade rank behind rank into white fog with a pale sun in it.',
    ],
    [
      'blue-snow-slope',
      1,
      'Firs stand on a steep slope deep in snow under a cold moonlit haze, and it snows.',
    ],
    [
      'crooked-wood-sundown',
      1,
      'Twisted trunks lean every way in deep red evening light while dry leaves blow down.',
    ],
    [
      'reed-bed-etching',
      1,
      'Tall reeds and trunks are drawn in dark strokes on warm paper, hatched along the ground.',
    ],
  ],
  'closed-eyes': [
    [
      'bare-orchard-in-mist',
      0,
      'Leafless trees stand in ink on a pale morning, their smallest twigs lost in white mist.',
    ],
    [
      'beech-wood-dapple',
      0,
      'Round spots of sun fall through leaves and lie over one another, green and gold.',
    ],
    [
      'red-moon-in-twigs',
      0,
      'A great rosy moon hangs in a red night behind one bare black branch and its twigs.',
    ],
    [
      'sun-of-glass-beads',
      0,
      'A hot sun and its rays laid in rows of round beads, gold at the middle and deep teal outside.',
    ],
    [
      'iris-of-a-giant',
      0,
      'A huge blue eye, its iris woven of fine fibres round a black pupil, turned a little to the light.',
    ],
    [
      'lids-before-sunrise',
      0,
      'Between two dark lids a long slit opens on warm light, the lashes black along its edges.',
    ],
    ['sandstone-whorl', 1, 'Coils and bosses cut deep in warm sandstone, lit low from one side.'],
    [
      'indigo-resist-cloth',
      1,
      'White dots, petals and stripes left by wax on a length of cotton dyed deep indigo.',
    ],
    [
      'dust-round-two-magnets',
      1,
      'Chains and rings of black dust curl round two dark poles on a sheet of white paper.',
    ],
    [
      'ring-round-a-hidden-sun',
      1,
      'A black disc wears a soft ring of light, and long pale spokes go out from it into blue dark.',
    ],
  ],
  clouds: [
    [
      'fleece-over-hayfields',
      0,
      'Small white clouds float in rows over pale fields on a bright blue summer noon.',
    ],
    [
      'lens-on-the-summit',
      0,
      'Smooth plates of cloud lie stacked over snow peaks, under a high sun in a mauve sky.',
    ],
    [
      'cloud-floor-at-sunrise',
      0,
      'From high above: heaps of cloud lie close together, level to a small white sun.',
    ],
    [
      'anvil-over-lava',
      0,
      'One huge black cloud stands in a starry night, its belly lit red from the ground.',
    ],
    [
      'mackerel-sky-twice',
      0,
      'Rows of small rippled clouds go away overhead in gold and rose, and again in still water.',
    ],
    [
      'thunderhead-in-ink',
      0,
      'A great summer cloud over water, drawn on cream paper in lines of black ink.',
    ],
    [
      'low-disc-on-the-marsh',
      1,
      'A great orange sun stands low under a dark bank, half of it in the still water of a marsh.',
    ],
    [
      'pouches-over-dry-sand',
      1,
      'Heavy pouches of cloud hang in rows over bare red sand, lit from under their edge.',
    ],
    [
      'fir-shore-in-fog',
      1,
      'A line of dark firs stands at the edge of a lake, and everything behind them is pale fog.',
    ],
    [
      'squall-of-cut-paper',
      1,
      'Thin strips of rain slant under banks of cloud over a lake, laid in flat teal, slate and cream.',
    ],
  ],
  'colour-field': [
    [
      'ink-wash-valleys',
      0,
      'Grey ridges stand one behind another, each with pale mist lying at its foot.',
    ],
    [
      'amber-larch-trunks',
      0,
      'Tall dark trunks stand close together in a fog the colour of resin.',
    ],
    ['shore-under-a-giant', 0, 'Round stones lie in shallow water under a vast banded planet.'],
    [
      'paper-lamps-let-go',
      0,
      'Round paper lamps rise slowly from black water into an amber night.',
    ],
    ['rain-shafts-at-sea', 0, 'Grey shafts of rain stand under a low sky over a level pewter sea.'],
    [
      'sun-on-cloud-hills',
      0,
      'A small sun stands low over heaped rose and slate clouds, seen from just above them.',
    ],
    [
      'glass-bead-ball',
      1,
      'A ball of glass beads in wine, gold and grey green holds one side to a lamp.',
    ],
    ['cream-in-black-tea', 1, 'A pale cloud turns and spreads through dark amber liquid.'],
    [
      'indigo-cloth-lengths',
      1,
      'Six lengths of stitched cloth hang side by side in blues and bone.',
    ],
    ['cedar-log-end', 1, 'The rings of a sawn log in red and honey brown, on bare pale ground.'],
  ],
  'colour-wheels': [
    [
      'walnut-bowls-in-a-row',
      0,
      'Turned wooden bowls stand in a row by size, their rings catching one low light.',
    ],
    [
      'compass-drawing',
      0,
      'Circles drawn in ink cross on pale paper and fill with thin blue and sepia washes.',
    ],
    [
      'rings-of-a-dark-planet',
      0,
      'Thin gold and slate rings glow round one dark middle, with small moons far off.',
    ],
    ['paper-windmills', 0, 'Paper windmills in brick, cream and blue turn apart on a pale wall.'],
    [
      'rings-cut-in-slate',
      0,
      'Broad rings cut deep into blue grey slate cross one another in raking light.',
    ],
    [
      'leaded-lantern',
      0,
      'Petals of amber, rose and bottle green glass in black lead round one lamp.',
    ],
    [
      'clay-ridge-tiles',
      1,
      'Great half round clay tiles in rust and sand, worn and lit from one side.',
    ],
    [
      'cut-shell-rosette',
      1,
      'Half rounds of shell pink, cream and sea grey lie bent about one middle.',
    ],
    [
      'paper-fans-by-lamplight',
      1,
      'Pleated fans of red and gold glow one after another in the dark.',
    ],
    [
      'white-plaster-panels',
      1,
      'Half panels with round corners moulded in white plaster, rib within rib, row upon row.',
    ],
  ],
  'crossed-light': [
    [
      'frost-on-a-dusk-pane',
      0,
      'Six armed stars of frost stand open on a window that is still blue outside.',
    ],
    [
      'gathered-rose-silk',
      0,
      'Rose and bronze silk is gathered at one point, its fine folds holding a long sheen.',
    ],
    ['malachite-slab', 0, 'Rings of light and dark green crowd a polished slab of stone.'],
    [
      'pressed-burr-heads',
      0,
      'Burrs and seed heads lie apart on cream paper, printed in fine brown lines.',
    ],
    ['lake-ice-at-evening', 0, 'A floor of grey ice flowers runs out to a thin rose light.'],
    [
      'salt-under-the-lens',
      0,
      'A round eyepiece is crowded with wheels of crystal in straw, rose and pale green.',
    ],
    [
      'banded-quills-on-paper',
      1,
      'Sheaves of quills banded black and bone lie on warm paper, paler ones out of focus behind.',
    ],
    [
      'eelgrass-in-green-water',
      1,
      'Long curled blades sway in green water with the light behind them.',
    ],
    ['brass-thistle-burst', 1, 'Brass spines burst wide from a few dark hearts.'],
    [
      'selenite-cave-floor',
      1,
      'Broad pale blades of crystal lie across one another in a warm dark cave.',
    ],
  ],
  'crystal-hall': [
    [
      'selenite-playa-noon',
      0,
      'A few huge pale blades stand in white sand under a wide clear sky, a person small among them.',
    ],
    [
      'drowned-mine-gallery',
      0,
      'Vast beams lean over black still water that holds them upside down.',
    ],
    ['icicle-grotto', 0, 'Long blue icicles hang and stand close together in a cave of pale ice.'],
    [
      'rose-tourmaline-spray',
      0,
      'A spray of rose and green glass opens from one root on pale stone.',
    ],
    [
      'lamp-spire-lagoon',
      0,
      'Thin lit spires stand in a black lagoon under a violet night, doubled in the still water.',
    ],
    [
      'toppled-obelisk-dusk',
      0,
      'Great bars of blue and straw glass stand and lie across a bare hilltop, a low sun behind them.',
    ],
    ['citrine-seam', 1, 'A narrow crack in pale banded stone is full of amber crystals.'],
    [
      'celestite-pockets',
      1,
      'Three round pockets and a small one in pale limestone, full of crystals of clear blue.',
    ],
    [
      'scolecite-pincushion',
      1,
      'Fine white needles stand out of the black on every side and point at the middle.',
    ],
    [
      'malachite-scales',
      1,
      'Dull green points stand in even rows and close up like the scales of a fruit.',
    ],
  ],
  curtains: [
    [
      'graphite-squall',
      0,
      'Grey shafts of rain stand in ranks before a pale sky and lie in the flat water below.',
    ],
    [
      'lantern-frost-pillars',
      0,
      'Single pillars of warm and cold light stand straight up over a snowfield in still air.',
    ],
    [
      'one-green-veil',
      0,
      'One slow veil of pale green folds over black peaks and lies in the lake below them.',
    ],
    [
      'corona-overhead',
      0,
      'Looking straight up, rose and violet rays close round one dark patch full of stars.',
    ],
    [
      'dyed-silk-noon',
      0,
      'Broad cloths of rose and indigo hang one behind the other before a pale noon sky.',
    ],
    [
      'kelp-alley',
      1,
      'Tall kelp stands dark against green light that comes down between the leaves.',
    ],
    [
      'limestone-sinkhole',
      1,
      'One great shaft of daylight falls through a round hole into black water over pale sand.',
    ],
    [
      'lagoon-shallows-noon',
      1,
      'Bright turquoise shallows, a net of white light on the sand below.',
    ],
    [
      'under-pack-ice',
      1,
      'From under the ice, light comes in only by the cracks between grey white plates.',
    ],
    [
      'plankton-dusk',
      1,
      'Countless motes hang in a violet sea, the last light slanting in from one side.',
    ],
  ],
  'curved-lattice': [
    [
      'dry-bone-marrow',
      1,
      'Close up inside a pale bone, its smooth struts and round hollows going off into white light.',
    ],
    [
      'scaffold-in-fog',
      1,
      'Square dark beams of an endless scaffold stand against one weak light far off in the fog.',
    ],
    [
      'pearwood-knot',
      1,
      'Polished bands of warm wood wind round the way ahead, ringed dark across the grain.',
    ],
    [
      'jade-puzzle-ball',
      1,
      'One carved ball of green stone, hollow through and through, turns slowly in the dark.',
    ],
    [
      'wet-red-gallery',
      1,
      'Closed curved walls of wet red clay run ahead into the dark, with round openings.',
    ],
    [
      'ink-vein-sheet',
      0,
      'Fine blue ink lines branch over white paper, the near ones dark and the far ones pale.',
    ],
    [
      'nautilus-inner-wall',
      0,
      'Thin nacre walls curl around a small dark opening, rose and sea green and milky.',
    ],
    [
      'kite-string-nebula',
      0,
      'Hair thin strands of cold light run out long ahead and meet at one point in the black.',
    ],
    [
      'thistle-ball-on-linen',
      0,
      'A loose ball of rust red threads hangs alone before pale linen, darkest where they cross.',
    ],
    [
      'greenhouse-ribs-dawn',
      0,
      'Straight ribs of pale light cross and recede, with a low yellow sun behind them.',
    ],
  ],
  'cut-paper': [
    [
      'carved-white-sheets',
      0,
      'White paper cut down and built up in steps, nothing but shadow to tell the sheets apart.',
    ],
    [
      'pressed-seaweed-page',
      0,
      'Fronds of olive, wine and rust seaweed lie loose on cream album paper and sway a little.',
    ],
    [
      'pricked-night-sheets',
      0,
      'Dark blue sheets pricked full of small holes, with a lamp somewhere behind them.',
    ],
    [
      'painted-cart-wheel',
      0,
      'Sheets of ochre, brick and cream laid round and round a hub, each with its leaf cut out.',
    ],
    [
      'copper-pit-terraces',
      0,
      'Close above great pits cut down in terraces of rust and green, with a low sun across them.',
    ],
    [
      'seed-merchant-drawers',
      0,
      'Rows of little trays of round seeds and beans, brick, black, cream and butter yellow.',
    ],
    [
      'cut-snow-star',
      1,
      'One white star, folded six times and cut, hangs on a wall of deep winter blue.',
    ],
    [
      'lantern-at-the-gate',
      1,
      'A dark paper lantern with its lamp lit, the warm light standing in every cut.',
    ],
    [
      'screens-before-the-bay',
      1,
      'Tall cut screens of sage, brick and teal stand in a row, bright sky and sea behind them.',
    ],
    [
      'festival-paper-flags',
      1,
      'Many small cut flags in pink, teal, saffron and green hang in rows and stir.',
    ],
  ],
  dabs: [
    [
      'moon-over-the-mole',
      0,
      'A round moon in wide pale rings over an empty bay, the tower lamp lit beside it.',
    ],
    [
      'squall-past-the-mole',
      0,
      'Grey green seas run in long rows with white crests under heaped and torn cloud.',
    ],
    [
      'harbour-in-dry-ink',
      0,
      'A crowd of masts and dark hulls in thousands of dark points of ink on cream board.',
    ],
    [
      'pools-under-a-green-sun',
      0,
      'A green sun stands in rings over violet flats where the tide has left rose pools.',
    ],
    [
      'glazed-quay-tiles',
      0,
      'A boat at the quay laid in small square tiles of terracotta, cream and sea green.',
    ],
    [
      'lantern-under-one-tree',
      1,
      'Night on a bare slope, one tree left on it and a lantern lit among its leaves.',
    ],
    [
      'snow-on-the-pear-slope',
      1,
      'Flakes fall past a near dark tree on a white slope, the far trees nearly gone.',
    ],
    [
      'lavender-to-the-poplars',
      1,
      'Long rows of lavender run up to a line of tall poplars in slanting strokes of noon.',
    ],
    [
      'orchard-under-water',
      1,
      'Mist at first light, and round trees standing to the knee in water that holds them.',
    ],
    [
      'almond-before-the-rain',
      1,
      'One pink tree in full flower on a green slope, heaped blue grey cloud behind it.',
    ],
  ],
  'daylight-smoke': [
    [
      'indigo-drops-in-milk',
      0,
      'Drops of indigo and rust ink sink through milk, each with its tail still hanging above.',
    ],
    [
      'seed-clocks-at-evening',
      0,
      'Round seed heads of thin rays stand on tall stems before a low pale sun.',
    ],
    [
      'shells-over-a-reservoir',
      0,
      'Great cream and blue flowers open among stars above black still water, and again in it.',
    ],
    [
      'one-bloom-of-umber-dust',
      0,
      'A single great flower of brown dust opens grain by grain on bare paper, and blows thin.',
    ],
    [
      'wheels-of-far-suns',
      0,
      'Spirals of violet, teal and dusty gold wind slowly round their hearts among small stars.',
    ],
    [
      'white-heaps-over-downs',
      0,
      'Heaps of white cloud stand up beside a pale sun in a blue sky, over four lines of green hills.',
    ],
    [
      'willows-by-the-weir',
      1,
      'Fine green willows hang their lines over pale water that holds them upside down.',
    ],
    [
      'vent-fountains-at-night',
      1,
      'Orange lines are thrown up from vents behind black hills and hang there, cooling.',
    ],
    [
      'bell-jelly-in-blue-dark',
      1,
      'One great jelly hangs in dark blue water, its thick lit arms trailing and curling.',
    ],
    [
      'kelp-under-a-white-sun',
      1,
      'Olive and teal kelp rises and curls in green water, a white sun shining down through it.',
    ],
  ],
  'dot-globe': [
    [
      'dandelion-clock',
      0,
      'A hollow seed head of fine pale stems, each tipped with a soft seed, in evening green.',
    ],
    [
      'violet-spined-urchin',
      0,
      'A squat sea urchin, violet and rose spines all round it, hangs over pale dry sand.',
    ],
    [
      'ochre-ringed-planet',
      0,
      'A banded ochre planet, half in the dark, tilted inside a wide flat ring.',
    ],
    [
      'grey-moonlet',
      0,
      'The lit edge of a small grey moon fills the corner, rough with boulders, the rest is black.',
    ],
    ['artichoke-bud', 0, 'A tall bud of overlapping grey green scales with violet at their edges.'],
    ['pond-frogspawn', 0, 'A soft ball of clear jelly eggs hangs in bright pond water.'],
    [
      'summit-star-dome',
      1,
      'Straight up from a cold summit, stars of every size wheel about the black crown of the sky.',
    ],
    [
      'lantern-lake',
      1,
      'Paper lanterns hang over still water and lie mirrored in it under a violet dusk.',
    ],
    [
      'shell-grotto',
      1,
      'A low ribbed vault lined with cockle shells, rose and cream, lit from one side.',
    ],
    [
      'igloo-at-daybreak',
      1,
      'Great rounded blocks of blue ice close overhead, the first warm light coming through them.',
    ],
  ],
  'dot-land': [
    [
      'sunrise-lily-pads',
      0,
      'Round pads, green and a few rose, lie apart on still blue green water seen from above.',
    ],
    [
      'ripe-barley-close',
      0,
      'Ripe barley stands close and tall, gold and white, leaning a little in a warm haze.',
    ],
    [
      'orchard-under-snow',
      0,
      'Bare round trees stand in long rows in deep snow, their blue shadows beside them.',
    ],
    ['cypress-ridge-dusk', 0, 'Tall dark trees on rolling ridges stand in front of a low red sun.'],
    [
      'squid-boat-lamps',
      0,
      'Amber, white and blue lamps lie scattered over dark blue water under a faint moon.',
    ],
    [
      'balloon-race-morning',
      0,
      'Round balloons in brick, blue and straw hang at every height over a wet meadow.',
    ],
    [
      'kelp-between-tides',
      1,
      'Green kelp sways up from the sea floor and down from its own mirror in the surface.',
    ],
    [
      'toadstool-cellar',
      1,
      'Cream and red toadstools on thick stalks stand on the floor and hang from the roof of a dim cellar.',
    ],
    [
      'plankton-layer',
      1,
      'Small round lives drift at every depth of blue water, each with a bright edge.',
    ],
    [
      'chalk-plains-noon',
      1,
      'Two white plains face each other, with small coloured stones laid out along both.',
    ],
  ],
  'dot-lattice': [
    [
      'clay-bead-strings',
      0,
      'Long strings of clay beads, buff, rose and mauve, hang far apart before a dusky wall.',
    ],
    [
      'balls-and-rods',
      0,
      'A model of a crystal, blue and ivory balls held apart by thin rods, in white light.',
    ],
    [
      'up-through-snowfall',
      0,
      'Large soft flakes sink past on every side in slate blue winter dusk.',
    ],
    [
      'pier-bubbles',
      0,
      'Clear bubbles hang in green sea water, with daylight coming down from far above.',
    ],
    [
      'wet-windscreen-lights',
      0,
      'The lights of a town out of focus, soft round discs of amber and red in the dark.',
    ],
    [
      'rose-petals-steeping',
      0,
      'Flat rose and cream petals lie level at every depth of pink water, with light from above.',
    ],
    [
      'streetlight-rain',
      1,
      'Fine straight rain falls through amber light, each drop a bright upright line.',
    ],
    ['bamboo-in-mist', 1, 'Thick and thin stalks of green bamboo stand upright in bright mist.'],
    [
      'filings-on-paper',
      1,
      'Fine black filings on white paper stand along the bends of an unseen field.',
    ],
    [
      'timber-float',
      1,
      'Stacked logs of pine and alder lie all one way in level rows, warm in a low sun.',
    ],
  ],
  'dot-screen': [
    [
      'printed-moonrise',
      0,
      'A great moon over calm water, printed in fine ink dots on soft cream paper.',
    ],
    [
      'combed-sand-lines',
      0,
      'Long raked lines of warm sand bend in slow waves and cast thin shadows in low light.',
    ],
    [
      'poppy-slope',
      0,
      'Red and coral poppies crowd a green slope that fades away into a pale misty sky.',
    ],
    [
      'rain-rings-on-a-fell-tarn',
      0,
      'Round rings of rain open and cross on dark water that runs away into grey mist.',
    ],
    [
      'pearls-on-plum-velvet',
      0,
      'Loose pearls of cream, rose and smoke lie on dark plum velvet under one lamp.',
    ],
    [
      'lamplit-reed-blind',
      1,
      'Round upright reeds of honey brown hang as a blind with evening lamps behind them.',
    ],
    [
      'indigo-curtain-on-a-pole',
      1,
      'White dots left undyed on deep indigo cotton that hangs and sways in wide folds.',
    ],
    [
      'cross-stitched-ridges',
      1,
      'Blue and pine green ridges in mist, worked in small square stitches on cream linen.',
    ],
    ['tessera-sun', 1, 'A gold sun stands over a blue sea, all of it laid in small square stones.'],
    [
      'darkfield-diatoms',
      1,
      'Scalloped shells of glass glow green, amber and blue in the black field of a microscope.',
    ],
  ],
  'dot-tunnel': [
    [
      'stones-in-a-snow-cutting',
      0,
      'A wide hollow of snow runs away under a flat white sky, with smooth grey stones lying in it.',
    ],
    [
      'coral-gullet',
      0,
      'Rose and salmon beads line a soft throat that swells and narrows toward a warm light.',
    ],
    [
      'fuchsia-strings-by-night',
      0,
      'Five strings of fuchsia, violet and leaf green beads wind away into an empty black garden.',
    ],
    [
      'lanterns-on-the-paddy',
      0,
      'Amber lamps stand over a wide dark field that runs to a pale amber strip of evening sky.',
    ],
    [
      'green-breaker-barrel',
      0,
      'Smooth hoops of sea green water curl one inside another toward the bright mouth of a wave.',
    ],
    [
      'brass-rivet-gallery',
      1,
      'Great domes of old brass and copper stud the walls of a dark square gallery.',
    ],
    [
      'bubbles-in-the-lock',
      1,
      'Clear bubbles of every size hang in the green dark water of a narrow canal lock.',
    ],
    [
      'post-lane-to-a-low-sun',
      1,
      'Dark red posts stand close on both sides of a lane that runs straight to a low sun.',
    ],
    [
      'plum-and-damson-store',
      1,
      'Fat blue plums and yellow ones lie along the white walls of a cold room.',
    ],
    [
      'night-train-going-by',
      1,
      'Rows of long gold lights draw past close by in the dark, like the side of a night train.',
    ],
  ],
  'dot-wall': [
    [
      'bulb-fields-in-bloom',
      0,
      'Rows of red, yellow and rose tulip heads run over a flat field to a pale spring sky.',
    ],
    [
      'glass-floats-at-low-water',
      0,
      'Clear glass floats of sea green hang above still water that holds the last of the light.',
    ],
    [
      'bamboo-fence-in-rain',
      0,
      'Wet green poles stand side by side behind a flooded path on a grey day.',
    ],
    [
      'breached-sea-wall',
      0,
      'Round stones of rust and slate are left on a broken wall, with a red evening in its gaps.',
    ],
    [
      'rowan-berries-in-frost',
      0,
      'A few fat red and orange berries are set close before the eye on a white wall.',
    ],
    [
      'blue-shutter-slats',
      0,
      'Round slats of faded island blue run across a whitewashed wall, each with its shadow.',
    ],
    [
      'shingle-bar-in-sea-light',
      1,
      'Round stones of slate, rust and bone bank up in a bar of shingle under a white sea sky.',
    ],
    [
      'sequin-stage-curtain',
      1,
      'Round beads of wine red and gold hang in deep folds over a black floor.',
    ],
    [
      'night-swell-off-the-cape',
      1,
      'Cold round lights ride long swells that roll under a thin line of moonlit sky.',
    ],
    [
      'frogspawn-by-torchlight',
      1,
      'Clear round eggs crowd together in dark pond water, each with a bright rim.',
    ],
  ],
  drifters: [
    [
      'lagoon-sand-shadows',
      0,
      'Round jellyfish seen from above glide over rippled sand under green water, each with its shadow.',
    ],
    [
      'lantern-bell-procession',
      0,
      'Tall bells as solid as paper lanterns rise in a crowd through plum dark water.',
    ],
    [
      'old-rust-mane',
      0,
      'One huge rust red jellyfish hangs alone in black water, its torn ruffles falling out of the picture.',
    ],
    [
      'overturned-tulip-bed',
      0,
      'Jellyfish turned upside down stand like cut tulips over a grey green floor.',
    ],
    [
      'harebell-in-lampblack',
      1,
      'One great bell with its hem cut like a flower, built up on white card from dots of black alone.',
    ],
    [
      'counted-sparks-below',
      0,
      'Wheels made only of rows of cold blue points stand in the black, like stars somebody has counted.',
    ],
    [
      'kites-over-ochre-dust',
      0,
      'Flat bells stream sideways through a tan wind like a flock of kites with ragged tails.',
    ],
    [
      'bell-blueprint',
      1,
      'White ink on a deep blue sheet: five animals set out in a row as if to be built.',
    ],
    [
      'cabinet-of-young-stars',
      1,
      'A whole sheet of tiny star shaped young, hardly two alike, laid in even rows on dark brown cloth.',
    ],
    [
      'red-disc-on-sea-wash',
      1,
      'A great brick red disc with its rays, painted flat on a sheet washed from sea green to sand.',
    ],
  ],
  'drip-cave': [
    [
      'sea-arch-pillars',
      0,
      'Stout pillars of sandstone stand dark against noon at the mouth of a cave the sea runs into.',
    ],
    [
      'glow-worm-snares',
      0,
      'Beaded threads of sea green light hang by hundreds from a roof that cannot be seen.',
    ],
    [
      'mangrove-at-slack-water',
      0,
      'Roots wander down out of a low dark roof toward their own doubles in green and silent water.',
    ],
    [
      'colonnade-in-steam',
      0,
      'Grey columns stand on a bare floor in warm steam, each row fainter than the one before it.',
    ],
    [
      'spires-of-a-peach-town',
      0,
      'The cave is turned over: its icicles are spires of a town that goes on for ever under a peach sky.',
    ],
    [
      'frozen-weir',
      1,
      'A weir has frozen as it fell: pleated blue ice with long teeth before a white sky.',
    ],
    [
      'madder-red-pleats',
      1,
      'A whole wall of stone hangs in close red pleats, lit from the side like heavy cloth.',
    ],
    [
      'slit-jade-hangings',
      1,
      'Strips of green stone as thin as leaves hang apart with a light far behind them.',
    ],
    [
      'wall-of-a-dry-wash',
      1,
      'Thin beds of plum, rose and pale stone run along the bent wall of a dry gorge in low light.',
    ],
    [
      'pierced-brass-pelmet',
      1,
      'A lamp shines through a thousand round holes in a hanging sheet, parted in the middle.',
    ],
  ],
  dusk: [
    [
      'ridges-folded-in-haze',
      0,
      'Five blue ridges stand one behind another with haze lying between, under a peach evening.',
    ],
    [
      'red-sun-of-cut-paper',
      0,
      'A great vermilion sun stands in a sky cut from sheets of paper, over a dark ruffled sea.',
    ],
    [
      'green-veils-over-ridges',
      0,
      'Tall veils of green light hang down to ridge behind dark ridge, with a thin moon among them.',
    ],
    [
      'cloud-floor-at-six',
      0,
      'From above the weather a floor of cloud runs out white and apricot to the morning.',
    ],
    [
      'reeds-and-a-nail-moon',
      0,
      'Reeds stand black at the edge of a still lake with a moon no wider than a nail paring.',
    ],
    [
      'lights-let-out-on-the-ebb',
      0,
      'Small warm lights drift up from a bay at night and come down again in the water.',
    ],
    [
      'evening-in-bottle-ends',
      1,
      'A window made of round bottle ends, with a piece of the evening upside down in each.',
    ],
    [
      'four-tall-panes-west',
      1,
      'Broad panes cut a sun and its hills into long slices of plum, rose and clay.',
    ],
    [
      'frost-on-the-west-door',
      1,
      'A pale winter afternoon seen through a ribbed glass door, snow hills one behind another.',
    ],
    [
      'reeds-before-pale-sequins',
      1,
      'Reeds stand black before a pale evening made all of round dots, cream where the sun is low.',
    ],
  ],
  'ember-trail': [
    [
      'blossom-on-a-round-tray',
      0,
      'Three embers turn in a wreath of powder while plum petals lie fallen on the pale ash.',
    ],
    [
      'lava-creek-at-dusk',
      0,
      'A slow creek of fire winds over a wide dark plain and goes on glowing far behind its head.',
    ],
    [
      'hedges-from-a-balloon',
      0,
      'Clipped green hedges cover the lawns in mazes, with long evening shadows between them.',
    ],
    [
      'raked-gravel-court',
      0,
      'White gravel is raked in quiet lines round a row of stones, and almost nothing moves.',
    ],
    [
      'canals-of-a-ring-town',
      0,
      'Dark canals run ring within ring through rose sandstone, a lamp afloat in every quarter.',
    ],
    [
      'black-spirals-overhead',
      1,
      'Flat black spirals hang against a blank white noon, seen from straight underneath.',
    ],
    [
      'drift-of-glass-bells',
      1,
      'Bells of thin bright glass thread trail long ribbons as they hang in clear blue water.',
    ],
    [
      'lamps-under-the-eaves',
      1,
      'Round paper lamps in amber and rose hang row behind row in the dark.',
    ],
    [
      'wire-firs-in-snow-light',
      1,
      'Tall thin spires like firs stand in white fog, each further one paler.',
    ],
    [
      'beaded-parasols',
      1,
      'Great parasols strung of clay red beads hang close under a roof of glass panes.',
    ],
  ],
  'empty-square': [
    [
      'arcade-with-no-building',
      0,
      'By moonlight a long row of arches lies in shadow on a bare blue square, with nothing above it.',
    ],
    [
      'kite-string-on-a-white-dune',
      0,
      'A wheel, a bell and a kite leave their shapes on white sand under a wide blue sky.',
    ],
    [
      'fig-court-at-noon',
      0,
      'A fig tree, reeds, a stem and one leaf lie in shade on a worn court of warm clay.',
    ],
    [
      'glass-wheel-on-pale-stone',
      0,
      'A great wheel of coloured glass lets its teal, plum and honey light lie on the floor.',
    ],
    [
      'chessmen-gone-home',
      0,
      'Long evening shadows lie over a floor of dark green and cream squares, and nobody is there.',
    ],
    [
      'great-gate-in-ink',
      0,
      'One vast gate and the neck of a jar are drawn in pen strokes across a sheet of pale stone.',
    ],
    [
      'tree-shade-on-snow-steps',
      1,
      'A tree, a leaf and reeds that are nowhere throw soft blue shadows up a stair deep in snow.',
    ],
    [
      'bus-stop-stair-after-rain',
      1,
      'Puddles stand on grey steps and hold a soft white sky, with an arch and a jar dim in it.',
    ],
    [
      'cycle-race-long-over',
      1,
      'A row of wheels and bells rolls its shade down warm terraces as the sun goes.',
    ],
    [
      'cobalt-tile-stair',
      1,
      'A stair is tiled in cobalt and white, and a bell, a wheel and a screw throw warm glass light.',
    ],
  ],
  facets: [
    [
      'pencil-guitar-on-bare-paper',
      0,
      'A guitar, a bottle and a bowl are only drawn, in broken pencil on a nearly empty sheet.',
    ],
    [
      'tavern-floor-in-small-stones',
      0,
      'Guitar, bottle and fruit are set in square stones of brick, blue and cream, worn at the joints.',
    ],
    [
      'supper-by-a-low-lamp',
      0,
      'A guitar, a bottle and three fruits stand whole in the dark, warm on the one side a lamp reaches.',
    ],
    [
      'wine-cellar-in-leaded-glass',
      0,
      'The still life is a window of wine red, bottle green and amber glass in broad black leads.',
    ],
    [
      'siesta-in-cut-paper',
      0,
      'Coral, teal and cream sheets are cut in long curves and laid one over another on white.',
    ],
    [
      'stairwell-in-turned-rings',
      1,
      'A grey stair is cut in rings like a tree, and each ring has turned a little by itself.',
    ],
    [
      'attic-stair-at-four',
      1,
      'The panes of a window lie warm across a dim wooden stair, whole and quiet.',
    ],
    [
      'chalked-plan-of-a-stair',
      1,
      'Window, rail and steps are white chalk on a deep blue board, ruled and half rubbed away.',
    ],
    [
      'seafront-stair-in-dots',
      1,
      'Round dots of sea green, sand and rose build an open window and a bright stair by the shore.',
    ],
    [
      'copper-steps-after-dark',
      1,
      'Copper steps and a blue fan of treads are cut from smooth sheets and laid over black.',
    ],
  ],
  'far-storm': [
    [
      'heaps-over-barley',
      0,
      'White summer clouds stand in a row above ripe barley, feet in shadow, tops in sun.',
    ],
    [
      'anvil-at-lamp-lighting',
      0,
      'The sun is down behind a thunderhead and its burning edges lie doubled in a lake.',
    ],
    [
      'ash-from-the-cone',
      0,
      'A column of ash climbs out of a mountain, red at its root, with bare dark rock below.',
    ],
    [
      'spout-on-grey-water',
      0,
      'A thin spout hangs from a near cloud and touches a flat sea the grey of pewter.',
    ],
    [
      'low-bank-through-rain',
      0,
      'Slanting veils of rain drift across a low dark bank and the water under it.',
    ],
    [
      'small-storm-north',
      0,
      'One small storm flickers low on the plain beneath tall green and violet curtains of light.',
    ],
    [
      'noon-through-the-gaps',
      1,
      'Far below the white tops, the floor of cloud opens on a wide blue sea at midday.',
    ],
    [
      'stone-islands-at-dawn',
      1,
      'Bare peaks stand like islands out of a level rose fog in the first light.',
    ],
    [
      'banded-ochre-world',
      1,
      'A small round world turns under streaks of ochre, rust and cream gas.',
    ],
    ['pewter-swells', 1, 'Long still swells of cloud run silver and black under a huge pale moon.'],
  ],
  'finish-strip': [
    [
      'lamplit-spokes',
      0,
      'One great wheel rolls by in the dark, its bent spokes caught in warm lamplight.',
    ],
    [
      'terns-past-a-red-sun',
      0,
      'Long ink dark birds and a few leaves cross a round red sun on straw coloured paper.',
    ],
    [
      'harbour-bunting',
      0,
      'Bright flags stream from their poles over broad swaying bands of sea and quay.',
    ],
    [
      'lantern-with-swallows',
      0,
      'A round paper lantern stands lit in a dark room, swallows circling on its skin.',
    ],
    [
      'wheelwright-blueprint',
      0,
      'Rows of small bicycles drawn in fine white line on deep blue drafting paper.',
    ],
    [
      'red-clay-fish-jar',
      1,
      'A round jar of red clay stands alone, dark fish swimming in a ring about its belly.',
    ],
    ['reed-bed-moonrise', 1, 'A thicket of pale reeds stands in blue dark before a huge low moon.'],
    [
      'bath-floor-fishes',
      1,
      'Broad fish on an old bath floor, laid in small stones of sea green, cream and rust.',
    ],
    [
      'crane-dance-blanket',
      1,
      'Pale cranes and straw reeds woven into a dark blanket banded in rust and ochre.',
    ],
    [
      'cobalt-brush-jar',
      1,
      'Wading birds and reeds brushed in running cobalt line on cold white glaze.',
    ],
  ],
  'fish-sky': [
    [
      'sandbar-at-noon',
      0,
      'From pale rippled sand under clear warm water, a shoal turns slowly before an empty bright sky.',
    ],
    [
      'alder-swamp-evening',
      0,
      'Black peat water, tall alders closing over, and the last copper light left in the gap.',
    ],
    [
      'moon-down-the-well',
      0,
      'Far up, one small round of night sky with a moon in it, and black water all about.',
    ],
    [
      'shower-on-the-mill-race',
      0,
      'Rain rings spread across a white sky and the near black water beside it.',
    ],
    [
      'under-the-lotus-leaves',
      0,
      'A roof of round leaves seen from beneath, green and gold where the sun comes through.',
    ],
    [
      'evening-swell-overhead',
      0,
      'A heavy swell has broken the sky into drifting islands of rose and violet light.',
    ],
    [
      'black-ice-at-sundown',
      1,
      'Ice as clear as glass, crowded with flat white bubbles, over a sky of peach and slate blue.',
    ],
    [
      'ice-floes-from-below',
      1,
      'White floes fitted loosely together, thin dark water between them, bright turquoise at their edges.',
    ],
    [
      'jellies-under-the-shelf',
      1,
      'Pale jellyfish rise through violet dark toward the faint glow of night ice.',
    ],
    [
      'perch-in-brown-ice',
      1,
      'Perch circle in tea brown water beneath clear ice, and shafts of olive light fall past bare alders.',
    ],
  ],
  'five-shadows': [
    [
      'fig-leaves-on-linen',
      0,
      'Broad leaves throw soft olive and ochre shadows on a hanging linen curtain.',
    ],
    [
      'plum-blossom-after-dark',
      0,
      'Blossoming twigs burn in rose, cream and dusk blue on a black wall.',
    ],
    [
      'barley-in-the-west-wind',
      0,
      'Ears of barley lean all one way before an amber wall and their shadows cross.',
    ],
    [
      'eelgrass-bed',
      0,
      'Broad blades of sea grass sway on green sand under a moving net of light.',
    ],
    [
      'bough-shade-on-snow',
      0,
      'The shade of a bare bough runs toward us over snow, long, blue and crossed.',
    ],
    [
      'strung-shell-discs',
      1,
      'Thin discs turn on threads in the dark and let through pale sea colours.',
    ],
    [
      'lattice-on-the-boards',
      1,
      'A lattice window throws its bars far over a warm floor at the end of the day.',
    ],
    [
      'two-hoops-in-fog',
      1,
      'Two great hoops and a disc hang far from a pale wall, all grey and soft.',
    ],
    [
      'pencilled-bubbles',
      1,
      'Rounds and crescents drawn in five coloured pencils cross on cream paper.',
    ],
    [
      'reeds-in-glass-beads',
      0,
      'Reeds of teal, plum and amber light stand up out of a dark wall of round glass beads.',
    ],
  ],
  'floated-ink': [
    [
      'thumb-mark-in-clay',
      0,
      'One great fingerprint is pressed in red clay, its ridges lit from the side.',
    ],
    [
      'belts-of-a-cold-giant',
      0,
      'A banded planet of cream, slate blue and rust hangs in black, half of it in night.',
    ],
    [
      'atoll-of-cut-paper',
      0,
      'Sheets of sand, foam and lagoon blue are laid ring in ring like a chart of three islands.',
    ],
    ['rice-grains-on-indigo', 0, 'Rings of white grains lie in wide rounds on deep indigo.'],
    ['walnut-plank', 0, 'Dark grain runs along a brown plank and bends round two long knots.'],
    [
      'rings-to-the-far-bank',
      0,
      'A few wide rings spread over a still grey lake that goes away into pale warm mist.',
    ],
    [
      'glazed-drops-on-slate',
      1,
      'Round drops of wet glaze in moss, plum and honey sit high on a black slab.',
    ],
    [
      'quail-egg-on-paper',
      1,
      'A round cream egg, speckled and blotted with umber, rests in soft light on pale paper.',
    ],
    [
      'crimson-endpaper',
      1,
      'Crimson, navy and old gold are combed into scallops round one slow curl.',
    ],
    [
      'oil-in-the-dry-dock',
      1,
      'A slow whirl of petrol blue, violet and brass turns on black water.',
    ],
  ],
  'floating-signs': [
    [
      'kites-off-the-spit',
      0,
      'Red, cream and navy kites lean on the wind in a pale washed sky, their tails streaming.',
    ],
    [
      'moons-over-the-mere',
      0,
      'Moons in their phases stand over still slate water, and the water holds them all.',
    ],
    [
      'penmanship-sampler',
      0,
      'Seven signs are written in brown ink above one long line on cream paper.',
    ],
    [
      'fired-clay-tokens',
      0,
      'Three great glazed shapes of clay lie on pale plaster and throw soft shadows.',
    ],
    [
      'dyers-drying-line',
      0,
      'Madder, weld and woad run down in long wet stripes below a cord of dyed rounds.',
    ],
    [
      'float-lamps-at-the-jetty',
      1,
      'Round lamps of amber, rose and green glow on their threads in the black harbour air.',
    ],
    [
      'fringed-madder-hanging',
      1,
      'Seven bone signs stand in a row on red cloth, long stripes of ochre and cream below.',
    ],
    [
      'kites-chalked-on-slate',
      1,
      'A crowd of kites is drawn in white and coloured chalk on a dark school slate.',
    ],
    [
      'brass-charms-on-baize',
      1,
      'Raised charms of bone, brass and green enamel lie shining on deep green cloth.',
    ],
    [
      'pinheads-at-pink-tide',
      1,
      'Dark signs and a crowd of round pinheads stand over rose water that mirrors them.',
    ],
  ],
  flock: [
    [
      'geese-over-fog-water',
      0,
      'Skeins of geese cross a white winter sky above firs and still, pale water.',
    ],
    [
      'herring-wheel',
      0,
      'A great ring of herring turns in green water, flanks flashing under the light above.',
    ],
    [
      'bat-canyon-moonrise',
      0,
      'Bats pour up from the foot of bare violet hills into the light of a wide moon.',
    ],
    [
      'ring-of-a-copper-moon',
      0,
      'Dark dust of wings circles a huge copper moon over bare red peaks.',
    ],
    [
      'beech-leaf-fall',
      0,
      'Rust brown leaves, a few of them close by, come down through tan haze before far hills.',
    ],
    ['snow-in-the-firs', 1, 'Snow sinks in soft flakes past dark firs on a blue winter night.'],
    [
      'lamps-let-go',
      1,
      'Paper lanterns rise one after another from a black lake and stand doubled in it.',
    ],
    [
      'pollen-over-hay',
      1,
      'Pale grains of pollen lift off a hay meadow into the gold of late afternoon.',
    ],
    [
      'acacia-full-of-sparks',
      1,
      'Every spark of the night has gathered in the crown of one great tree.',
    ],
    [
      'harbour-lamp-strings',
      1,
      'Strings of coloured lamps hang over black harbour water and lie trembling in it.',
    ],
  ],
  flowers: [
    [
      'tulip-rows-by-the-dyke',
      0,
      'Rows of red, cream and yellow flowers run off under a wide pale sky.',
    ],
    [
      'lilies-on-green-water',
      0,
      'White and shell pink lilies lie open on still green water among their round leaves.',
    ],
    [
      'crocus-through-snow',
      0,
      'Violet and saffron crocuses stand in small clumps in old white snow.',
    ],
    [
      'meadow-from-a-kite',
      0,
      'Straight down on a June meadow, its small heads red, white, straw and cornflower blue.',
    ],
    [
      'white-asters-at-moonrise',
      0,
      'Clear white asters hold their own blue light on a dark plain under a low moon.',
    ],
    ['thistle-in-sea-fog', 1, 'One violet thistle head stands on its stem, all alone in pale fog.'],
    [
      'lotus-at-first-light',
      1,
      'A rose and cream lotus opens its cup above the rings it makes in green water.',
    ],
    [
      'dahlia-plate-by-xray',
      1,
      'A dahlia seen right through, petal behind petal, grey white on black.',
    ],
    [
      'carnation-heart',
      1,
      'Deep in a carnation, coral and wine red petals crowd with torn ruffled edges.',
    ],
    [
      'pinwheel-in-brown-ink',
      1,
      'A turning flower drawn line by line in brown ink on cream paper, lightly washed.',
    ],
  ],
  'folded-indigo': [
    ['persimmon-fan', 0, 'Rust and ochre stars spread like a fan over crumpled cream paper.'],
    [
      'paste-stars-on-night',
      0,
      'A lattice of small pale stars, kept white by paste, stands out of a deep blue night cloth.',
    ],
    [
      'farmhand-mended-coat',
      0,
      'Scraps of faded and deep blue cloth pieced together with running stitches.',
    ],
    [
      'moss-through-linen',
      0,
      'One great blot of moss green bleeds slowly out along the folds of wet linen.',
    ],
    [
      'madder-curtain',
      0,
      'A madder red curtain hangs in deep folds, its long dyed pleats running down it.',
    ],
    ['onion-skin-whorl', 1, 'One huge golden disc, its pleats whirling round from the middle.'],
    [
      'market-day-dots',
      1,
      'Small tied dots, row behind row, on a coral red cloth laid out flat and going away.',
    ],
    [
      'bleached-walnut-wheels',
      1,
      'Dark wheels stay where bleach has run pale over a walnut cloth that goes away from you.',
    ],
    [
      'stitched-kelp-squares',
      1,
      'A sea green square within squares, stitched all over in crosses of pale thread.',
    ],
    [
      'mussel-shell-silk',
      1,
      'Violet and grey silk falls in soft folds, four pale whorls tied and dyed into it.',
    ],
  ],
  'folded-stone': [
    [
      'carved-puzzle-ball',
      0,
      'A ball of old bone carved hollow, set down on cream paper in the light of a window.',
    ],
    [
      'red-mesa-keep',
      0,
      'A fort of layered red rock stands worn and open on the sand under a rose evening sky.',
    ],
    [
      'ring-of-broken-masonry',
      0,
      'The last black pieces of a wall float in a wide ring before a great pale blue moon.',
    ],
    [
      'tower-on-the-lake',
      0,
      'A slender tower with every window lit stands in black water and is held upside down in it.',
    ],
    [
      'barnacled-block',
      0,
      'A great block overgrown with small stepped shells of blue, chalk and orange on a pale beach.',
    ],
    [
      'snowed-in-storeys',
      1,
      'Snow lies on every ledge of a deep courtyard while a few yellow windows still burn.',
    ],
    [
      'slot-of-warm-rock',
      1,
      'Walls of sand and rust coloured rock close round, with a small sun at the far end.',
    ],
    [
      'hills-full-of-windows',
      1,
      'Every house on the dark hills has its windows lit, up to where a dim red moon looks over.',
    ],
    [
      'mossed-cobble-gully',
      1,
      'Round stones are stacked without mortar down a long gully, mossy below and pale above.',
    ],
    [
      'terraces-at-noon',
      1,
      'White flat roofs step over the hills to the haze, cut by deep cool lanes.',
    ],
  ],
  frost: [
    [
      'snow-star-under-glass',
      0,
      'One great snow crystal of many arms lies on deep blue, white at its heart and finely barbed.',
    ],
    [
      'bracken-in-sun',
      0,
      'Young green fern stands thick along a bank with bright hazy daylight behind it.',
    ],
    [
      'ink-plumes-on-cream',
      0,
      'Black plumes as from a brush lean in over plain cream paper, with much of it left bare.',
    ],
    [
      'tram-stop-in-sleet',
      0,
      'Round red, amber and green lights of a street hang behind a pane rimmed with ice as snow goes by.',
    ],
    [
      'copper-fronds-at-dusk',
      0,
      'Great rust and copper fronds cross before the last orange light over a black wood.',
    ],
    [
      'reeds-in-first-snow',
      1,
      'Straight grey reeds stand along white water while the first soft flakes come down.',
    ],
    [
      'barley-beards-at-sundown',
      1,
      'Long bearded barley leans one way in the wind with a low sun of gold behind it.',
    ],
    [
      'thorns-before-thunder',
      1,
      'Black thorny stems cross each other against a sulphur yellow sky before a storm.',
    ],
    [
      'bubbles-in-a-still-pond',
      1,
      'Broad smooth blue green leaves arch in dark water and round air bubbles hang among them.',
    ],
    [
      'red-vines-hang-down',
      1,
      'Broad red tongues of leaf curl down from above into pale sea green light.',
    ],
  ],
  'glass-skeletons': [
    [
      'lamp-of-leaded-panes',
      0,
      'A round lamp of small panes in amber, plum and green hangs lit in a dark room.',
    ],
    [
      'urchin-shell-on-sand',
      0,
      'One great empty urchin shell, mauve and full of round holes, lies close up on warm bright sand.',
    ],
    [
      'lattice-across-fog-light',
      0,
      'The dark bars of a huge broken lattice turn before a white lamp in sea fog.',
    ],
    [
      'pollen-in-a-green-shaft',
      0,
      'A crowd of small spined golden grains sinks slowly through deep green light.',
    ],
    [
      'plate-nine-engraved',
      0,
      'An old engraving of one spined shell, cut in dark brown on cream paper.',
    ],
    [
      'torn-brass-cage',
      0,
      'A huge cage of brass with its side torn open turns before indigo, a blue light inside it.',
    ],
    [
      'cracked-husks-lit-amber',
      1,
      'A few great broken husks of lattice hang in brown dark, each lit amber from within.',
    ],
    [
      'tray-of-chalk-buttons',
      1,
      'Round, starred and toothed buttons of coloured chalk lie in rows on straw paper.',
    ],
    [
      'burrs-on-apricot',
      1,
      'A few great black burrs and stars lie close up against a warm apricot glow.',
    ],
    [
      'glow-eggs-sinking',
      1,
      'Long pale eggs and needles, each with its own small light, sink through blue water.',
    ],
  ],
  'glowing-shore': [
    [
      'sandbar-from-the-cliff',
      0,
      'Clear turquoise water folds white over a pale sandbar at noon, seen from high above.',
    ],
    [
      'lava-meets-tide',
      0,
      'Waves of dull red fire break in a black cove under tall cliffs of cooled stone.',
    ],
    [
      'pancake-ice-morning',
      0,
      'White floes crowd a winter bay at first light, blue and peach colour lying over them.',
    ],
    [
      'full-moon-breakers',
      0,
      'Great white breakers come straight in from the dark under a huge pale moon.',
    ],
    [
      'sun-on-the-flats',
      0,
      'A low sun stands over a flat wet shore, the ripples barely lifting in its colour.',
    ],
    [
      'plankton-whirl',
      1,
      'Points of living light turn in one great whirl on black water, like far stars.',
    ],
    [
      'ankle-deep-noon',
      1,
      'Nets of sunlight slide over pale rippled sand, with a soft curl of stirred silt.',
    ],
    [
      'rose-silt-unrolling',
      1,
      'Broad scrolls of rose silt unroll over dark ribbed sand, pale grains caught in their folds.',
    ],
    ['cuttle-ink', 1, 'Dark ink unrolls in slow curls through milk white water.'],
    [
      'first-snow-on-ice',
      1,
      'Snow falls on grey plates of ice, and a cold blue light comes up through the cracks.',
    ],
  ],
  'gold-on-black': [
    [
      'ink-reeds-on-gold-leaf',
      0,
      'A few dark reeds stand upright against squares of warm gold leaf, with a little dust of ink.',
    ],
    [
      'vermilion-box-lid',
      0,
      'Gold clouds with scalloped edges lie over broad gold leaves on a deep red lid.',
    ],
    [
      'shell-blades-in-the-deep',
      0,
      'Broad blades cut from shell shift green and rose in water as dark as a well.',
    ],
    [
      'rain-over-the-millet',
      0,
      'Fine gold rain slants across bowed ears of millet on a night blue ground.',
    ],
    [
      'one-stem-and-the-moon',
      0,
      'A single gold stem and its plume lean across a great moon of shell on black lacquer.',
    ],
    [
      'brushed-mountains-at-dawn',
      1,
      'Ranges of mountains drawn in brown lines climb a sheet of pale rose paper.',
    ],
    [
      'calm-strait-crescent',
      1,
      'A thin crescent of shell hangs over a low flat sea of fine gold lines.',
    ],
    [
      'petals-on-a-green-river',
      1,
      'Pale petals fall over a swelling river drawn in bold gold lines on dark green.',
    ],
    [
      'beaded-dunes',
      1,
      'Dunes set bead by bead in copper and gold roll under a small half hidden moon.',
    ],
    [
      'moon-among-gold-clouds',
      1,
      'A huge moon of shell stands between banks of gold cloud over a low swell.',
    ],
  ],
  'gold-tiles': [
    [
      'star-tiles-on-indigo',
      0,
      'Small wreaths of flowers wind over an indigo vault where single gold tiles stand as stars.',
    ],
    [
      'alabaster-rose-niche',
      0,
      'Roses of pink and sage bloom on a pale stone niche in even daylight.',
    ],
    [
      'flooded-niche-at-night',
      0,
      'A golden niche stands far off in the dark and hangs upside down in still water.',
    ],
    [
      'glass-dome-backlit',
      0,
      'Large panes of amber, rose and sea coloured glass glow with the day behind them.',
    ],
    [
      'flame-stitch-arch',
      0,
      'Pointed bands of clay, ochre and slate climb the arch ring over ring like stitching.',
    ],
    [
      'black-pebble-court',
      1,
      'A flower of white pebbles is set in a court of black ones, under one low lamp.',
    ],
    [
      'lamplit-glass-rings',
      1,
      'Rings of amber and sea green glass run away over a black floor with lamps burning under it.',
    ],
    [
      'floor-under-silt',
      1,
      'An old jade and grey floor runs off under sunlit water, much of it gone to pale silt.',
    ],
    [
      'coral-roses-in-the-pool',
      1,
      'Rows of small round roses lie on an ivory and coral floor under bright clear water.',
    ],
    [
      'broken-plate-sea',
      1,
      'Blue and white shards of broken plates are laid loose in rows of waves, dry in the sun.',
    ],
  ],
  'grid-land': [
    [
      'slate-fjord-before-day',
      0,
      'Still water lies between dark slate slopes and mirrors a pale sun that has only just come up.',
    ],
    [
      'wind-written-dunes',
      0,
      'Long ochre dunes with fine ripples across them roll on toward a great hazy sun.',
    ],
    [
      'pen-drawn-peaks',
      0,
      'Sharp peaks stand row behind row in fine ink on white paper under an empty sky.',
    ],
    [
      'lamp-dots-on-a-flat',
      0,
      'Small lights lie far out over a wide black plain under a thin moon.',
    ],
    [
      'mesa-after-heat',
      0,
      'Flat topped cliffs of rust and rose stand in steps on both sides of a wide valley floor.',
    ],
    [
      'island-chart-in-ink',
      1,
      'An old sea chart from straight above: pale islands with inked height lines in a soft blue sea.',
    ],
    [
      'rice-steps-in-flood',
      1,
      'Green hills are cut in steps all the way down to still water that holds the sky.',
    ],
    [
      'summits-over-cloud',
      1,
      'Cold blue summits stand apart out of a pale floor of cloud, with rings of snow on their sides.',
    ],
    [
      'plum-sand-in-ribs',
      1,
      'Plum and rose dunes curl one over the next, ribbed by the wind, seen from above.',
    ],
    [
      'white-thread-ridges',
      1,
      'White threads lie across black ridges one behind another, low and close, under a small moon.',
    ],
  ],
  growth: [
    [
      'birch-round-on-paper',
      0,
      'A pale round of birch seen from straight above on white, its few rings drawn in soft ink.',
    ],
    [
      'agate-slice',
      0,
      'A polished slice of agate with two hearts, banded in smoke blue, milk and rust.',
    ],
    [
      'terraced-open-mine',
      0,
      'A great pit of red earth goes down in rings, its ledges lit from one side.',
    ],
    ['night-rose-lines', 0, 'The petals of a dark rose drawn in thin lines of their own light.'],
    [
      'tea-rows-round-a-knoll',
      0,
      'Rows of clipped green bushes bend in wide arcs round a low knoll, far over to the left.',
    ],
    [
      'moss-on-a-round-hill',
      0,
      'A round hill climbs in stone ledges with moss and lichen coming up over them in soft grey light.',
    ],
    [
      'ice-fan-from-the-air',
      1,
      'A frozen river mouth from high up, dark blue cracked ice between smooth banks of snow.',
    ],
    [
      'cracked-lake-floor',
      1,
      'The floor of a dry lake in clay plates under a dusty sky, with mountains at its far end.',
    ],
    ['bright-shallows', 1, 'Turquoise channels wind in wide bends through white sand in full day.'],
    [
      'vein-map-in-the-dark',
      1,
      'Fine veins of copper and violet branch over black, seen from above.',
    ],
  ],
  'haze-beams': [
    [
      'pine-trunks-at-six',
      0,
      'Early sun comes in fine rays between pine trunks, with white mist lying on the forest floor.',
    ],
    [
      'cistern-under-the-court',
      0,
      'Shafts of daylight fall through a stone vault and stand doubled in black still water.',
    ],
    ['flour-loft', 0, 'Ochre beams full of flour dust cross an old painted loft, seen looking up.'],
    [
      'bare-poles-in-snow',
      0,
      'Low sun comes in fine peach rays through bare trunks and lies in spots on lilac white snow.',
    ],
    [
      'searchlights-on-a-bay',
      0,
      'Pale beams stand up out of a dark bay into the cold air and stand again in the water.',
    ],
    [
      'sun-lace-in-a-rose-vault',
      0,
      'Sun falls through a pierced rose vault and lies in rounds of lace on a terracotta floor.',
    ],
    [
      'green-veils-on-a-tarn',
      1,
      'Upright veils of green and violet light hang over black water and mirror in it.',
    ],
    [
      'tinted-glass-at-noon',
      1,
      'Sheets of pale tinted light float through a white room in full day.',
    ],
    [
      'lamp-blades-in-the-mine',
      1,
      'Copper blades of light cut through the dust of a rough rock tunnel.',
    ],
    [
      'smoke-from-the-rafters',
      1,
      'Amber smoke turns slowly in wide layers of light far below, with everything else black.',
    ],
  ],
  hills: [
    [
      'tarn-under-the-pikes',
      0,
      'Sharp grey peaks with old snow in their gullies stand in a cold clear lake at noon.',
    ],
    [
      'buttes-at-a-red-sundown',
      0,
      'Flat topped rocks stand one behind another before a huge red sun in the dust.',
    ],
    [
      'pen-and-wash-downs',
      0,
      'Many low downs drawn in brown ink on cream paper, each hollow hatched by hand.',
    ],
    [
      'firs-above-a-white-sea',
      0,
      'Wooded tops rise like islands from a level sea of mist under a great full moon.',
    ],
    [
      'heather-under-a-squall',
      0,
      'A few great hills purple with heather lie under a grey lid of cloud with rain far off.',
    ],
    [
      'drifts-in-starlight',
      1,
      'A few long drifts of snow lie blue and still under a sky thick with stars.',
    ],
    [
      'ochre-ribs-in-ground-fog',
      1,
      'Seen from high up, winding ribs of ochre and rose sand stand out of pale level fog.',
    ],
    [
      'olives-on-red-earth',
      1,
      'Round grey green olive trees dot the red slopes row on row in hard noon light.',
    ],
    [
      'dunes-of-a-copper-moon',
      1,
      'Small teal dunes run to the edge of a strange world under an enormous copper moon.',
    ],
    [
      'lavender-and-flax-fields',
      1,
      'Rolling fields of lavender, flax and wheat are sewn together in rows at noon.',
    ],
  ],
  'house-brush': [
    [
      'canes-in-thin-ink',
      0,
      'Slender canes stand side by side in thin green grey ink, some pale as if in mist.',
    ],
    [
      'barn-boards-in-oxide',
      0,
      'Broad strokes of oxide red and ochre lie one over another on weathered boards.',
    ],
    [
      'gilt-reeds-on-lacquer',
      0,
      'Thin reeds of gold lean together on black lacquer, each drawn out to a point.',
    ],
    [
      'tide-flats-in-wash',
      0,
      'Wide washes of grey blue and sand lie level on wet paper and run into each other.',
    ],
    [
      'sedge-bent-by-a-gust',
      0,
      'Long green blades and one of tan sweep round across each other on pale bare canvas.',
    ],
    [
      'ring-in-one-breath',
      1,
      'A great black turn of a dry brush, a whitewashed one across it and much bare canvas.',
    ],
    [
      'windfall-under-a-maple',
      1,
      'Leaves of rust, wine and gold have fallen across one another and throw small shadows.',
    ],
    [
      'cut-papers-on-a-deal-table',
      1,
      'Flat strips of coloured paper cross on a bare wooden table top, each a little raised.',
    ],
    [
      'dyed-hanks-in-the-dark',
      1,
      'Soft hanks of dyed wool in amber, rust and sea blue hang side by side in the dark.',
    ],
    [
      'chalk-hoops-on-slate',
      1,
      'Hoops of dry white and blue chalk overlap on a dark school slate.',
    ],
  ],
  'humming-rods': [
    [
      'tinted-vases-at-noon',
      0,
      'Three tall vases of thin tinted glass stand in a white room, their shadows pale behind them.',
    ],
    [
      'flames-on-a-black-mere',
      0,
      'Soft amber flames float near and far on black water, each above its own reflection.',
    ],
    [
      'black-cairns-at-slack-water',
      0,
      'Towers of dark balanced stones stand in silver water, black against a cold bank of light.',
    ],
    [
      'turned-spindles-in-walnut',
      0,
      'Turned spindles of brown wood stand on blocks in a warm room, ringed and polished.',
    ],
    [
      'paper-lamps-over-a-ferry-slip',
      0,
      'Ribbed lamps of red, amber and blue hang on long cords before a dark blue evening.',
    ],
    [
      'telegraph-lines-in-a-red-west',
      1,
      'Dark humming lines run off over a flat black country into a deep red evening sky.',
    ],
    [
      'pebbles-threaded-on-flax',
      1,
      'Flat sea pebbles hang threaded on one level cord in front of a bare whitewashed wall.',
    ],
    [
      'eel-traps-in-peat-water',
      1,
      'Long wicker traps hang open in dark brown water, woven of split willow and lit from above.',
    ],
    [
      'salp-chain-rising',
      1,
      'A chain of clear glowing bodies climbs through a black blue depth, joined end to end.',
    ],
    [
      'turret-shell-on-a-sill',
      1,
      'One long ridged shell lies close to the eye, shell pink and ochre against a sandy wall.',
    ],
  ],
  'iron-filings': [
    [
      'asters-on-grey-felt',
      0,
      'Great asters of wine, rose and ochre lie open on dark grey felt, petal over petal.',
    ],
    [
      'spiral-nebulae-plate',
      0,
      'Whirlpools of fine points turn against each other in the dark, blue and faintly rose.',
    ],
    [
      'beaded-globe-on-clay',
      0,
      'A ball set all round with painted beads that run from pole to pole, on warm clay.',
    ],
    [
      'marram-laid-by-wind',
      0,
      'Pale dune grass lies combed and whorled to the edge of a sea mist.',
    ],
    [
      'poppy-seed-on-dough',
      0,
      'Dark seeds strewn on pale dough have settled into rings round a row of hidden hollows.',
    ],
    [
      'skerries-at-moonset',
      1,
      'A line of sharp wet rocks shines out of a dark rippled sea under a cold sky.',
    ],
    [
      'anemones-in-a-rock-pool',
      1,
      'Round heads of coral, plum and green crowd in a grey stone bowl, seen from straight above.',
    ],
    [
      'gilt-spires-by-lamplight',
      1,
      'A crowded town of needle thin gold spires rises from a dark bowl.',
    ],
    [
      'ink-beads-in-a-saucer',
      1,
      'Separate beads of blue black ink stand up in points in a plain white saucer.',
    ],
    [
      'hoodoos-in-noon-haze',
      1,
      'Smooth red and ochre pillars rise from a bare plain that goes pale in the heat.',
    ],
  ],
  'knit-and-ravel': [
    [
      'knitted-fields-at-dawn',
      0,
      'Striped fields of wool in sage, straw and rust roll away to a rose and lilac sky.',
    ],
    [
      'mail-shirt-in-a-dark-hall',
      0,
      'A shirt of fine bright rings hangs in the dark, steel with a little brass in it.',
    ],
    [
      'rope-carved-column',
      0,
      'A round column of grey stone, carved all the way up in twisted ropes, stands in open light.',
    ],
    [
      'lace-in-a-bright-window',
      0,
      'A thin dark lace hangs in a window, and the pale morning comes through every hole.',
    ],
    [
      'undone-beside-the-stove',
      1,
      'A brown shawl comes undone in the light of one low fire, and the rest is dark.',
    ],
    [
      'herring-fleet-jersey',
      1,
      'Navy, rust and cream worked in diamonds, so close that every stitch is seen.',
    ],
    [
      'fringe-in-green-water',
      1,
      'Ribbed cloth hangs from above and its loose ends sway below it in green water.',
    ],
    [
      'stray-thread-over-snow',
      1,
      'White knitted ground goes off to a pale sky where one loose thread lies like cloud.',
    ],
    [
      'copper-sleeve-and-coil',
      1,
      'A sleeve of knitted copper wire stands before a green wall, its loose wire coiling round it.',
    ],
    ['one-red-thread', 1, 'A single crimped red thread lies in slow loops on clean pale paper.'],
  ],
  'knotted-cords': [
    [
      'straw-sun-on-a-red-wall',
      0,
      'A sun plaited of straw turns slowly on a dark red wall, its knotted rays long and short.',
    ],
    [
      'rushes-in-morning-vapour',
      0,
      'Green rushes spread up from one tuft, and a paler tuft stands behind them in the vapour.',
    ],
    [
      'auburn-hair-let-down',
      0,
      'Fine copper strands sweep round in one long curl out of the dark, lit from the left.',
    ],
    [
      'bead-collar-on-indigo',
      0,
      'A collar of round coral, sand and sky coloured beads lies spread on deep indigo cloth.',
    ],
    [
      'mooring-ropes-on-chalk',
      0,
      'Heavy bleached ropes lie fanned on white chalk, each with one clean shadow.',
    ],
    [
      'dew-on-strings-before-day',
      1,
      'Round drops of clear water hang on threads of glass in front of a blue dark.',
    ],
    [
      'barley-sheaf-bound',
      1,
      'Long gold stalks are drawn together at the waist and spread again under a pale sky.',
    ],
    [
      'wrack-in-a-tide-race',
      1,
      'Long weed in amber, olive and sea green streams to one side in dark water.',
    ],
    [
      'tassels-in-the-stage-box',
      1,
      'A waving hem of gold and crimson tassels hangs from its rail before deep red plush.',
    ],
    [
      'bronze-cables-on-sea-green',
      1,
      'Great bronze cables hang from out of sight and draw together a little before a sea green wall.',
    ],
  ],
  'lake-ice': [
    [
      'leaves-under-brown-ice',
      0,
      'Rust, ochre and plum leaves lie frozen at every depth of a tea brown woodland pool.',
    ],
    [
      'turquoise-blocks-at-sunup',
      0,
      'The ice has split into tall clear blocks of turquoise, and a low gold sun comes through them.',
    ],
    [
      'rime-stars-on-black-water',
      0,
      'Six armed frost stars of every size stand white on water that is almost black.',
    ],
    [
      'swept-hole-in-the-snow',
      0,
      'A window has been swept in the snow, and stacks of bubbles stand under it in a low sun.',
    ],
    [
      'school-rings-at-noon',
      1,
      'Rings within rings are cut in pale noon ice, seen from straight above.',
    ],
    [
      'race-lanes-at-red-dusk',
      1,
      'Long straight lanes run over the lake to a pale sun on the far hills, under a red sky.',
    ],
    [
      'carp-in-a-winter-pond',
      0,
      'Orange and white carp glide slowly under a dark sheet of clear ice.',
    ],
    [
      'red-leaves-in-milk-ice',
      0,
      'A few great red leaves hang one under another in ice as pale and still as milk.',
    ],
    [
      'moon-through-the-rushes',
      1,
      'A moon lays its path over blue ice behind a thick stand of rushes.',
    ],
    [
      'lantern-over-white-bubbles',
      1,
      'One lantern stands over black ice full of flat white bubbles, rank behind rank.',
    ],
  ],
  'last-sparkler': [
    [
      'one-ember-over-snow',
      0,
      'A single glowing drop hangs over a drift of blue snow and warms a small patch of it.',
    ],
    [
      'ink-sparks-on-rice-paper',
      0,
      'A red drop throws a round burst of sparks, drawn in black ink on pale paper.',
    ],
    [
      'sparks-in-a-bamboo-grove',
      0,
      'Jade stems of bamboo stand all round the fire and are lit on the side that faces it.',
    ],
    [
      'willow-fire-before-the-moon',
      1,
      'Long threads of fire bow down before a huge ivory moon, all of it doubled in the lake.',
    ],
    [
      'plum-blossom-fire',
      0,
      'Every spark opens into a five petalled blossom under a rose and violet evening.',
    ],
    [
      'rope-of-fire-on-the-river',
      1,
      'Gold threads fall all along a rope hung over the river and go out in the water.',
    ],
    [
      'fireflies-over-tall-grass',
      1,
      'Soft round lights drift out over seeding grass in a green blue summer night.',
    ],
    [
      'nine-strings-at-the-eaves',
      0,
      'Nine drops on nine paper strings burn side by side, some near and some far off.',
    ],
    [
      'chandelier-over-a-green-cove',
      1,
      'A pale drop over still green water holds up thin arms, each with a round light at its tip.',
    ],
    [
      'ember-among-winter-birches',
      0,
      'Pale trunks stand in snow in flat white daylight, with one small red drop between them.',
    ],
  ],
  'lava-field': [
    [
      'basalt-columns-from-above',
      0,
      'The tops of six sided basalt columns fit together, with green sea water between them.',
    ],
    [
      'fresh-ash-on-red-seams',
      0,
      'White ash lies on every plate, and only the thin seams between them still glow red.',
    ],
    [
      'obsidian-under-a-blue-hour',
      0,
      'Great plates of black glass seen from above hold a blue evening, with fire in every gap.',
    ],
    [
      'last-rafts-on-the-melt',
      0,
      'Nearly everything is molten gold, and small dark rafts of crust turn on it as they go.',
    ],
    [
      'teal-fire-of-a-far-moon',
      0,
      'On a violet plain teal light runs in the cracks, out to low hills and a pale near planet.',
    ],
    [
      'cone-above-a-still-strait',
      1,
      'A steep cone stands on its own island, red threads down its sides and itself in the water.',
    ],
    [
      'white-falls-to-a-dark-beach',
      1,
      'Five white falls come down green cliffs into a grey morning sea.',
    ],
    [
      'ash-cone-at-first-light',
      1,
      'One broad stream of fire and a few thin ones run down a cone of pale ash to a grey sea.',
    ],
    [
      'blue-sulphur-shore',
      1,
      'Blue and violet fire runs in broad sheets down a dark slope to a rough black sea.',
    ],
    [
      'plume-in-a-rose-morning',
      1,
      'A huge soft plume stands over a low coast in a rose and cream morning.',
    ],
  ],
  leaf: [
    [
      'leaf-pressed-in-an-old-book',
      0,
      'One russet leaf lies whole on a cream page, dry and eaten through in places.',
    ],
    [
      'water-lily-on-tea-water',
      0,
      'Seven pale rose petals lie open round one heart on water as brown as tea.',
    ],
    [
      'bracken-at-the-wood-edge',
      0,
      'A fern stands lit from behind before the dim green of many others.',
    ],
    [
      'poplar-skeleton-on-ice',
      0,
      'Only the veins of a leaf are left, a dark lace lying on pale blue ice.',
    ],
    [
      'prayer-plant-at-dusk',
      0,
      'Dark feathers and rose veins are marked on a thick leaf in the last of the light.',
    ],
    [
      'osier-leaf-hung-with-dew',
      0,
      'One long narrow leaf stands beaded with dew before the blue dark of others at dawn.',
    ],
    [
      'damselfly-over-the-sluice',
      1,
      'A damselfly hangs in the air with all four long wings open before dim reeds.',
    ],
    [
      'eyed-wing-on-the-buddleia',
      1,
      'A broad brown wing with bands of ochre and one blue eye, every scale lit from the front.',
    ],
    [
      'leaded-summer-pane',
      1,
      'A few great panes of amber, sea green and old pale glass, each held in a dark line.',
    ],
    [
      'cicada-wing-on-linen',
      1,
      'One clear wing with fine close ribs lies on undyed cloth and casts a soft shadow.',
    ],
  ],
  'light-doorway': [
    [
      'duck-egg-bedroom',
      0,
      'A bare bedroom painted pale blue by day, sun in the panes of its tall glass door.',
    ],
    [
      'door-standing-in-dunes',
      0,
      'A door stands by itself on rippled sand at daybreak, and lets another light through.',
    ],
    ['flooded-loggia', 0, 'A row of tall openings stands along black water and lies in it again.'],
    [
      'moon-gate-and-pool',
      0,
      'A great round gate in a stone wall closes into a full ring in the still pool before it.',
    ],
    ['shutters-in-the-heat', 0, 'Slats of afternoon light lie over the boards of a dark hot room.'],
    [
      'thread-beside-a-landing-door',
      0,
      'A door is all but shut, and one thread of light stands in the dark.',
    ],
    [
      'bottom-of-the-draw-well',
      1,
      'Straight up a deep shaft of rough blocks the light stands square and far away.',
    ],
    [
      'lime-courtyard-first-stars',
      1,
      'Low walls stand round a still basin, with one round-headed door and the first stars over it.',
    ],
    [
      'clay-granary-noon',
      1,
      'Four dark doors stand in an ochre wall at noon, and panes of sun lie across the corner.',
    ],
    [
      'slatted-tower-dust',
      1,
      'One slanting beam comes down through slats into the dusty dark of a tall shaft.',
    ],
  ],
  'light-tunnel': [
    [
      'swimming-bath-corridor',
      0,
      'A long white corridor set with coloured tiles runs away to a bright square at its end.',
    ],
    [
      'lamp-arbour-at-nightfall',
      0,
      'Round lamps hang on the bare hoops of an arbour under a deep blue evening.',
    ],
    [
      'brick-kiln-flue',
      0,
      'A round flue of rough burnt clay, its thick ribs lit by a furnace mouth far down.',
    ],
    [
      'culvert-under-the-town',
      0,
      'Cold strips of light run along a round culvert and lie again in its black water.',
    ],
    [
      'winding-tiled-outfall',
      0,
      'Lines of rose, sand and teal run along a round tiled pipe and wind with it out of sight.',
    ],
    [
      'crevasse-from-within',
      1,
      'Pale blue walls of ice lean together, with a strip of cold sky left open between them.',
    ],
    [
      'under-the-gills',
      1,
      'Cream gills stand close all round, as under a mushroom, with fine bright threads over them.',
    ],
    [
      'sea-cave-plankton',
      1,
      'Cold light creeps along the folded rock of a sea cave, over the still water on its floor.',
    ],
    ['whelk-stair', 1, 'Rose and cream whorls wind inward step by step, as inside a shell.'],
    [
      'cooling-lava-pipe',
      1,
      'A dark pipe of cooling lava with a few broad cracks of fire still running through it.',
    ],
  ],
  'liquid-metal': [
    [
      'drops-above-a-fjord',
      0,
      'Heavy silver drops hang over still blue water with low hills behind, before the sun is warm.',
    ],
    [
      'bisque-rings',
      0,
      'Unglazed rings of pale clay float linked and loose above a chalk white floor.',
    ],
    [
      'gilt-bangles-on-baize',
      0,
      'Gold bangles and one of dark green turn slowly over green baize, seen from above.',
    ],
    [
      'tar-drops-standing',
      0,
      'Tall drops of black tar stand in a pale room, with small shining beads strewn round them.',
    ],
    [
      'ice-on-cobalt-linen',
      0,
      'Clear blocks of ice lie on deep blue cloth, seen from above, a little colour caught in each.',
    ],
    [
      'thrown-pots-stacked',
      0,
      'Ribbed pots of terracotta stand one on another in the low light of a workshop.',
    ],
    [
      'bubble-over-the-estuary',
      1,
      'One great bubble drifts over an estuary at evening, the hills seen through its skin.',
    ],
    [
      'sea-gooseberries',
      1,
      'Clear long ribbed bodies hang in black water, each with a cold shimmer along its edge.',
    ],
    [
      'pearls-let-fall',
      1,
      'Loose pearls of every size hang in a slate blue room, rose and green in their shine.',
    ],
    [
      'flat-bubbles-on-coral',
      1,
      'Wide flat bubbles hover over a coral floor, their thin skins catching gold and violet.',
    ],
  ],
  'lit-cloud': [
    [
      'fair-weather-heap',
      0,
      'White cloud heaps up in great soft heads against the deep blue of a fine day.',
    ],
    [
      'cut-card-sunset',
      0,
      'Clouds like cut card in coral, plum and teal lie over one another before a low round sun.',
    ],
    [
      'sunup-over-a-fog-valley',
      0,
      'A pale gold sun stands over banks of fog, a far ridge and the tips of firs before them.',
    ],
    [
      'moon-on-cloud-wool',
      0,
      'A full moon stands over a floor of cloud that runs to the edge of the night.',
    ],
    [
      'pillars-round-a-young-sun',
      0,
      'Tall pillars of rose and amber dust stand in black space, lit from inside by new stars.',
    ],
    [
      'veil-of-a-spent-star',
      0,
      'Combed veils of jade and copper gas spread across the whole dark, fine as hair.',
    ],
    [
      'old-turbine-hall',
      1,
      'Tall arched windows throw long blades of amber and steel light down a smoky hall of pillars.',
    ],
    [
      'mill-attic-round-window',
      1,
      'One round window in a limewashed attic drops a soft wheel of colour on the boards.',
    ],
    [
      'tank-glass-at-closing',
      1,
      'A few great panes of green and blue water glow in a dark hall with a wet floor.',
    ],
    [
      'hayloft-chaff',
      1,
      'Low sun slants through the panes of a brown loft and lights the chaff that hangs in the air.',
    ],
  ],
  'long-scroll': [
    [
      'gorge-in-wet-ink',
      0,
      'Tall crags run and blur in wet grey ink over a wide water, on a pale sheet seen from above.',
    ],
    [
      'gold-line-on-night-blue',
      0,
      'A narrow strip of night blue paper, its river drawn in gold, lies open under a lamp.',
    ],
    [
      'snow-along-the-towpath',
      0,
      'White hills and slow flakes are painted on grey paper unrolled on a straw mat.',
    ],
    [
      'pilot-chart-of-inlets',
      0,
      'A coast of small peaks is hatched in fine pen over a wide pale water, seen from above.',
    ],
    [
      'red-leaf-ford',
      0,
      'Rust red trees and drifting leaves run away from the eye on a long low sheet of paper.',
    ],
    [
      'sun-over-ochre-silk',
      0,
      'A red sun comes by over low dunes on silk dyed ochre, laid out on a dark green mat.',
    ],
    [
      'screen-in-a-white-room',
      1,
      'A long low screen of snowy peaks stands almost flat against the wall of a bright room.',
    ],
    [
      'cinnabar-leaves',
      1,
      'A screen of deep red leaves goes back in sharp folds, a pale sun over its dark hills.',
    ],
    [
      'tall-leaves-of-a-strait',
      1,
      'Six tall leaves hold a moon, sheer peaks and a wide shining strait, pale on deep blue.',
    ],
    [
      'persimmon-hills-up-close',
      1,
      'Gold leaves seen near, persimmon red trees by a blue water and petals coming down.',
    ],
  ],
  'loom-draft': [
    [
      'cane-mat-in-leaf-shade',
      0,
      'A broad mat of split cane lies on red earth while the shade of slim leaves moves over it.',
    ],
    [
      'hearth-rug-knots',
      0,
      'A deep rug of madder, blue and ochre wool, the window laid across its knots.',
    ],
    [
      'muslin-over-a-bright-door',
      0,
      'White muslin hangs in slow folds before an open door, and the noon comes through every thread.',
    ],
    [
      'cords-across-a-snowfield',
      0,
      'Dark cords run out over bright snow until they are lost in the cold air.',
    ],
    [
      'herring-net-adrift',
      0,
      'A slack old net hangs open in dark green water, lit from somewhere far above.',
    ],
    [
      'gilt-wire-brocade',
      0,
      'Gold and copper wire crosses in slanting figures on black, and only one lamp finds it.',
    ],
    [
      'bead-panel-on-jet',
      1,
      'Round glass beads in amber, rose, jade and cream stand in squares among black ones.',
    ],
    [
      'red-thread-sampler',
      1,
      'One red thread is crossed over and over into rings and hooks on pale open linen.',
    ],
    [
      'ring-roads-by-night',
      1,
      'The lamps of a wide town lie below in rings and lanes, thinning out toward the dark.',
    ],
    [
      'cobalt-court-in-shade',
      1,
      'A court paved in cobalt and cream runs away from you with leaf shade across it.',
    ],
  ],
  marble: [
    [
      'won-at-the-school-wall',
      0,
      'A handful of glass marbles lies scattered on warm sandy ground in the last sun of the day.',
    ],
    [
      'jasper-globe-on-lacquer',
      0,
      'A globe of banded red and cream stone stands on black lacquer, its likeness dim beneath it.',
    ],
    [
      'bubbles-come-to-rest',
      0,
      'Thin bubbles have come to rest on cold blue slate, oil colours sliding along their rims.',
    ],
    [
      'ink-let-into-the-ball',
      0,
      'Blue black ink curls through one clear ball on white paper, seen from right above.',
    ],
    [
      'bottle-green-row',
      0,
      'Heavy balls of green bottle glass are lined up and throw their green light before them.',
    ],
    [
      'lace-ball-by-moonlight',
      0,
      'White threads wind through a clear ball on a dark blue table with only the moon on it.',
    ],
    [
      'seeds-in-a-dark-dome',
      1,
      'Small pale seeds hang in rings inside a dark dome of glass, mirrored in black beneath.',
    ],
    [
      'painted-bowls-turned-over',
      1,
      'Round bowls painted with plum and cream flowers stand upside down in a row to dry on sand.',
    ],
    [
      'cut-flowers-on-sage-paper',
      1,
      'Great cut flowers of cream and peach glass lie in one round weight on sage green paper.',
    ],
    [
      'tortoise-in-amber',
      1,
      'Melted brown and honey patterns run together under a thick dome of amber glass.',
    ],
  ],
  meadow: [
    [
      'poppies-at-the-fence-line',
      0,
      'Red poppies with a few pale ones among them cover a green field under a wide noon sky.',
    ],
    [
      'stubble-after-first-snow',
      0,
      'Short stubble stands in rows through fresh snow, the last light rose along the far trees.',
    ],
    [
      'violet-rows-under-the-range',
      0,
      'Violet ears on thin stems run in long rows toward a range of mountains at sundown.',
    ],
    [
      'sword-leaves-on-rust-ground',
      0,
      'Broad leaves of bronze and green stand on rust red ground before a huge pale world.',
    ],
    [
      'bamboo-inside-a-cloud',
      0,
      'A few tall stems stand still and go pale one behind another in white cloud.',
    ],
    [
      'barley-ready-to-cut',
      0,
      'Ripe barley stands gold all the way to the far hills with the evening sun low behind it.',
    ],
    [
      'green-ears-in-the-paddy',
      1,
      'Rice in green ear stands in flooded ground that holds the sky, with grey hills behind.',
    ],
    [
      'bulrush-ice-at-midnight',
      1,
      'Bulrushes stand white in the ice of a mere while slow flakes come down past the stars.',
    ],
    [
      'yellow-flags-in-the-dyke',
      1,
      'Tall yellow flowers stand in still water under a blue morning and look down at themselves.',
    ],
    [
      'copper-reeds-and-a-low-world',
      1,
      'Copper coloured reeds line a dark red lake with a great pale world rising out of it.',
    ],
  ],
  melt: [
    [
      'quicksilver-on-paper',
      0,
      'A few heavy pools of liquid metal lie scattered on white paper, seen from straight above.',
    ],
    [
      'flood-plain-stones',
      0,
      'Round river stones of rust, ochre and grey lie crowded on damp brown sand.',
    ],
    [
      'rose-wet-sand',
      0,
      'The tide has gone out and long strips of water shine rose and cream on the dark sand.',
    ],
    [
      'dyers-vats',
      0,
      'Vats of madder, indigo and saffron dye crowd a clay yard, seen from the roof above.',
    ],
    [
      'rust-spring-pools',
      0,
      'Deep turquoise pools stand ringed in a bare rust red ground, as on another planet.',
    ],
    [
      'window-rain-at-night',
      1,
      'Clear drops slide down a black pane, each holding a little of the street behind it.',
    ],
    [
      'dark-honey-comb',
      1,
      'A wall of comb, its thin wax rims lit from behind and dark honey lying in the cells.',
    ],
    [
      'bathhouse-tiles',
      1,
      'A long wall of small glazed tiles in sea green, cream and brick, set in pale mortar.',
    ],
    [
      'stained-cells',
      1,
      'Round cells with violet walls float apart in a pale bright field under a lens.',
    ],
    [
      'red-wax-runs',
      1,
      'Deep red wax has run down a wall in long thin streams, glowing at their edges.',
    ],
  ],
  moire: [
    [
      'watered-silk-gown',
      0,
      'Sage green ribbed silk hangs in folds, and its watered figure slides along the ribs.',
    ],
    [
      'dyed-gauzes-on-a-wall',
      0,
      'Gauzes dyed indigo, saffron and rose hang in folds on a white wall and cross each other.',
    ],
    [
      'pricked-globes',
      0,
      'Three dark globes pricked with rows of cold light go away one behind another.',
    ],
    [
      'new-ice-on-black-water',
      0,
      'Round plates of new ice crowd a black sea, and slow pools of light open among them.',
    ],
    [
      'sieve-by-the-oven-door',
      0,
      'A great pierced sieve leans close, with the low red of an oven coming through its holes.',
    ],
    [
      'drips-in-a-cistern',
      1,
      'Three drips widen over still green water and their rings cross out to the far dark.',
    ],
    [
      'spore-prints',
      1,
      'The gills of three caps have printed themselves in brown and violet dust on white paper.',
    ],
    [
      'lathe-turned-brass-lids',
      1,
      'Domed lids of dull brass lie one on another, ringed by the lathe, under a single lamp.',
    ],
    [
      'beaded-table-mats',
      1,
      'Round mats of red, blue and ochre beads lie half over one another on a scrubbed table.',
    ],
    [
      'whelk-turns-at-low-sun',
      1,
      'A great pierced shell turns close in the corner, with a coral sun low behind its windings.',
    ],
  ],
  'moon-jar': [
    [
      'plum-bough-in-grey-green',
      0,
      'A slim grey green bottle holds one flowering plum bough in an even white light.',
    ],
    [
      'soy-jars-in-a-cold-yard',
      0,
      'Big dark brown jars stand in a row on a snowy ledge, with a pale sea and hills behind them.',
    ],
    [
      'oil-jar-above-a-bay',
      0,
      'A tall bare clay oil jar stands on a warm wall high over a blue bay at noon.',
    ],
    [
      'spotted-crocks',
      0,
      'Three white crocks painted with fat blue dots stand together before an ochre wall.',
    ],
    [
      'melon-jar-by-rushlight',
      0,
      'A lobed jar stands in a dark room, its ribs picked out by one low warm light.',
    ],
    [
      'oxblood-flask',
      1,
      'A long necked flask in a wet blood red glaze stands on black lacquer by a dark wall.',
    ],
    [
      'dune-grass-in-a-salt-crock',
      1,
      'A wide mouthed crock of sandy clay holds dry grasses that bend before a sand pink wall.',
    ],
    [
      'three-salt-white-bottles',
      1,
      'Three white glazed bottles of three sizes stand close before a wall of dark sea green.',
    ],
    [
      'gourd-pot-on-a-far-shore',
      1,
      'A low lobed pot in sea green glaze stands by a rose coloured sea of another world.',
    ],
    [
      'oil-spots-seen-close',
      1,
      'The dark shoulder of a glazed jar fills the sight, its pale spots like a field of stars.',
    ],
  ],
  moonscape: [
    [
      'ring-atolls-from-the-air',
      0,
      'White rings of land stand in a warm green sea under a pale noon sky, seen from high up.',
    ],
    [
      'cinder-cones-in-dust',
      0,
      'Rust red cones stand about a dusty plain, and table mountains fade into an ochre sky.',
    ],
    [
      'ice-moon-of-a-ringed-giant',
      0,
      'A blue white plain of old ice lies under a great banded planet and its rings.',
    ],
    [
      'pocked-crust-from-orbit',
      0,
      'A grey crust pocked all over slides past far below, half of it gone into night.',
    ],
    [
      'gypsum-dunes-facing-the-sun',
      0,
      'Long white dunes with lavender hollows run away to a low pale sun.',
    ],
    [
      'horn-peaks-at-last-sun',
      1,
      'Tall sharp peaks stand brown in a rose haze, and the sun goes down between them.',
    ],
    [
      'soda-wells-in-cream-rock',
      1,
      'Shallow green water lies in the hollows of a cream desert, with table mountains behind.',
    ],
    [
      'snow-mounds-at-noon',
      1,
      'Round mounds of snow crowd a white plain under a clear pale blue sky.',
    ],
    [
      'acid-pools-in-violet-crust',
      1,
      'Bright yellow green pools lie in a violet crust, with a swollen planet low behind.',
    ],
    [
      'crater-tarns-by-low-sun',
      1,
      'Still water stands between bare rims and carries the track of a small low sun.',
    ],
  ],
  'night-city': [
    [
      'lime-washed-quarter',
      0,
      'Low houses washed white and rose crowd a blue harbour canal on a clear day.',
    ],
    [
      'lit-panes-in-snowfall',
      0,
      'Steep roofs of a small town under snow, yellow panes alight and flakes coming down.',
    ],
    [
      'glass-silos-in-river-mist',
      0,
      'Round silos of lit green glass stand up to the waist in mist off a night river.',
    ],
    [
      'paper-walls-on-the-water',
      0,
      'Houses with walls of lit paper lean over a still black canal and lie in it again.',
    ],
    [
      'surveyors-ink-streets',
      0,
      'A quarter drawn in thin ink on cream paper from high up, washed here and there with colour.',
    ],
    [
      'spires-in-cloud-milk',
      0,
      'Needle towers stand up out of rose morning cloud on either side of one pale avenue.',
    ],
    [
      'causeway-in-green-swell',
      1,
      'Grey six sided stones step out into a green sea that breaks white round each of them.',
    ],
    [
      'quartz-lit-from-within',
      1,
      'Long six sided crystals crowd a cave, pale rose and smoke, each with a light in it.',
    ],
    [
      'glazed-hexagon-floor',
      1,
      'A floor of six sided tiles in ochre, green and cream glaze, some a little raised, in side light.',
    ],
    [
      'columns-under-a-second-sun',
      1,
      'A road of six sided columns runs to the sun of another world, huge and pale in red haze.',
    ],
  ],
  'night-sea': [
    [
      'far-town-over-black-water',
      0,
      'The lamps of a town under its hills hang doubled in a bay with no wind on it.',
    ],
    [
      'floes-and-a-low-apricot-disc',
      0,
      'Broad plates of ice lie still on slate water before a sun that does not quite set.',
    ],
    [
      'sand-ribs-under-clear-tide',
      0,
      'Sunlight nets the ribbed sand under a fathom of pale green tide, seen from a mast.',
    ],
    [
      'blue-seas-and-white-heaps',
      0,
      'Long blue seas come in with white backs under heaped clouds on a bright windy day.',
    ],
    [
      'sea-arm-between-rose-cliffs',
      0,
      'Cliffs stand in rows down a long arm of the sea at the last pink of the day.',
    ],
    [
      'dunes-left-by-an-old-ocean',
      0,
      'Where a sea was, dunes of rose sand roll away to a pale dawn with the last stars over it.',
    ],
    [
      'round-lamps-in-slow-rain',
      1,
      'Four round lamps in plum, rose, amber and cream hang over a dark water pricked with rain.',
    ],
    [
      'pen-ruled-swell',
      1,
      'A swell ruled in ink, line behind line, on warm paper with four pale washes over it.',
    ],
    [
      'sea-of-counted-points',
      1,
      'The whole sea is points of light in rows, teal near by and gold where the lights fall.',
    ],
    [
      'wires-of-light-after-sundown',
      1,
      'Fine upright wires of light, tall and short, stand along the sea in the last of the dusk.',
    ],
  ],
  'oil-slide': [
    [
      'culture-dish-on-white',
      0,
      'A small round dish on a white table, a few soft cells of sage, rose and straw in clear water.',
    ],
    [
      'amber-lifting-in-a-jar',
      0,
      'Great slow bodies of amber and honey lift through dark brown oil, lit from behind.',
    ],
    [
      'broken-enamel-on-black',
      0,
      'Straight edged pieces of teal, coral, ochre and cream enamel lie loose on black.',
    ],
    [
      'combed-dye-on-paper',
      0,
      'Slips of blue, plum and ochre dye drawn out long and combed over wet white paper.',
    ],
    [
      'twisted-lozenge',
      0,
      'A round sweet of rose, cream and caramel wound into one slow coil on a plum cloth.',
    ],
    [
      'suds-in-pencil-and-wash',
      1,
      'A raft of suds drawn in fine grey line on white, each cell washed thin in rose, blue or lemon.',
    ],
    [
      'pond-cells-on-dark-ground',
      1,
      'Cells of pond weed lit from the side on black, their walls green and ice blue.',
    ],
    [
      'banded-shore-pebbles',
      1,
      'Great smooth pebbles ringed in slate, rust and bone lie close together on pale sand.',
    ],
    [
      'elvers-in-an-eddy',
      1,
      'Pale green slips with amber hearts turn together in one great eddy of cold dark water.',
    ],
    [
      'tessellated-umber-hide',
      1,
      'Straight sided plates of umber and tan, each a little raised, over dark seams.',
    ],
  ],
  'one-spiral': [
    [
      'hemp-laid-in-a-star',
      0,
      'Thick hemp rope is laid down in one star of six blunt points, its strands lit from one side.',
    ],
    [
      'one-line-over-the-range',
      0,
      'A single pale line climbs over steep mountains by night, all the way to the far edge of the land.',
    ],
    [
      'walled-town-of-clay',
      0,
      'One square wall of rose clay winds inward to a court, its sunny faces lit and its lanes dark.',
    ],
    [
      'stippled-shingle',
      0,
      'Smooth pebbles drawn with nothing but dots of slate grey ink on white paper, wound from the middle out.',
    ],
    [
      'sinkhole-in-green-water',
      0,
      'Green water turns round a dark eye, white foam riding the line down and black shadow beneath.',
    ],
    [
      'chalked-egg',
      0,
      'An egg on a bare table, drawn on sage green paper in black ink and white chalk.',
    ],
    [
      'passion-flower-in-wash',
      1,
      'A loose pen draws an open flower, with violet and green washes spreading under the line.',
    ],
    [
      'surf-rings-round-a-rock',
      1,
      'A rock stands off a pale beach and the pen goes round and round it as the surf does.',
    ],
    [
      'brass-pins-on-black-felt',
      1,
      'Rows of brass pin heads wind out over black felt in six lobes, bright where a form rises.',
    ],
    [
      'braided-rag-rug',
      1,
      'Braids of madder, indigo and cream cloth wound into an oval rug on a pale floor.',
    ],
  ],
  'paper-screen': [
    [
      'round-window-fig-shade',
      0,
      'A round window in a lime washed wall, its paper full of the shade of broad leaves at noon.',
    ],
    [
      'gilt-leaves-unfolded',
      0,
      'A gilded folding screen stands open, dark green ridges along it under a great pale disc.',
    ],
    [
      'snow-behind-cracked-panes',
      0,
      'Paper set in a lattice broken like ice, and the soft shadows of big flakes going down behind it.',
    ],
    [
      'slatted-marsh-hut',
      0,
      'Thin upright slats, and behind them reeds standing thick in the green light of a marsh.',
    ],
    [
      'harlequin-sunroom',
      0,
      'Diamonds of coloured paper, brick, teal, straw and rose, with a vine climbing in the sun behind.',
    ],
    [
      'long-white-corridor',
      0,
      'A long wall of white paper runs off down a passage, the grey shade of one leafy bough on it.',
    ],
    [
      'lit-hole-in-a-blizzard',
      1,
      'One round window burns orange in a wide blue wall at night, flakes going down against its lamp.',
    ],
    [
      'arbour-of-black-leaves',
      1,
      'Heavy leaves hang black before a deep red paper wall with a lamp low behind it.',
    ],
    [
      'jewel-box-folding-screen',
      1,
      'A folding screen of tiny panes in plum, sea blue, amber and leaf green, lit from within.',
    ],
    [
      'tall-bottle-and-full-moon',
      1,
      'A tall bottle with one bough stands against a full moon over blue hills, on wide sheets of paper.',
    ],
  ],
  'paper-wheels': [
    [
      'rice-paper-lotus-on-ink',
      0,
      'A many petalled flower cut from rose and ivory paper lies open on a black table.',
    ],
    [
      'clock-train-unboxed',
      0,
      'Brushed brass and steel wheels of many sizes lie about on brown baize, each turning in its time.',
    ],
    [
      'lace-mat-on-rose-linen',
      0,
      'Layers of white paper lace lie one on another over dusty rose linen.',
    ],
    [
      'sugar-roses-in-a-tray',
      0,
      'Rows of little sugar roses, peach, pistachio and cream, set out on a pale green tray.',
    ],
    [
      'one-disc-passing-over',
      0,
      'Thin grey and blue discs, each smaller, slide across one another on black like a moon going by.',
    ],
    [
      'tiers-of-a-dry-fountain',
      0,
      'Scalloped stone basins rise one above another from a mossy court, seen from low down.',
    ],
    [
      'nest-of-pearwood-frames',
      1,
      'Eight cornered frames of walnut, pear and rosewood nest one inside another on dark baize.',
    ],
    [
      'down-a-copper-shaft',
      1,
      'Square copper frames, some gone green, step down into the dark to one small red floor.',
    ],
    [
      'glass-rings-in-a-pile',
      1,
      'Rings of clear glass, sea green, blue, sand and smoke, stand piled one on another on pale linen.',
    ],
    [
      'white-courtyards-on-ochre',
      1,
      'From high above, white houses round their courtyards stand in rows on ochre earth.',
    ],
  ],
  'pierced-drum': [
    [
      'lamp-set-down-on-snow',
      0,
      'A tin lamp stands in the open on blue snow, and its warm rounds lie in a wheel about it.',
    ],
    [
      'stars-from-a-brass-globe',
      0,
      'A pierced brass globe hangs its thousand pricks of light over the inside of a blue dome.',
    ],
    [
      'cut-leaves-on-plaster',
      0,
      'By day the stains of cut leaves in sage, moss and rust go slowly over white plaster.',
    ],
    [
      'smoked-tin-lantern',
      0,
      'Amber spokes stand in the smoke all round a black lantern with a few great holes.',
    ],
    [
      'discs-sinking-down-a-drape',
      0,
      'Soft grey discs of light sink one after the other down a great round drape.',
    ],
    [
      'reed-comb-at-noon',
      1,
      'A bronze globe throws bent bars of ochre and reed colour over a pale round room by day.',
    ],
    [
      'slatted-lamp-over-a-tarn',
      1,
      'A slatted lamp hangs low under the stars and rays its bars of light out over a black tarn.',
    ],
    [
      'spoked-lamp-on-red-sand',
      1,
      'From above, a lamp on red sand throws long spokes of cream and rose out into the dark.',
    ],
    [
      'chalk-ribs-in-a-vault',
      1,
      'Thin white outlines of great bars curve over the inside of a slate blue vault.',
    ],
    [
      'rice-lights-on-velvet',
      1,
      'Grains of rose and apricot light lie in drifts on hung crimson velvet.',
    ],
  ],
  'pin-relief': [
    [
      'spruce-spires-at-dawn',
      0,
      'A wood of dark spires stands close on a slope, with the pale morning behind it.',
    ],
    [
      'white-town-at-siesta',
      0,
      'White blocks of a hill town stand close together in hard sun, their shadows blue.',
    ],
    [
      'marram-quills-in-wind',
      0,
      'Looking down on straw coloured quills that stand up out of pale sand and swell in long waves.',
    ],
    [
      'steel-rods-before-rain',
      0,
      'A few great polished rods hold a slate sky in their tops, cold and bare.',
    ],
    [
      'lit-blocks-from-a-night-plane',
      0,
      'Seen from straight above, a city of square roofs glows in amber, rose and blue.',
    ],
    [
      'terraces-cut-in-clay',
      0,
      'Walls of red clay run in rows across a field, with hollows pressed deep into them.',
    ],
    [
      'dew-strewn-on-a-green-leaf',
      1,
      'Drops of every size lie strewn on a green leaf and gather its light, from right above.',
    ],
    [
      'paper-lentil-lamps',
      1,
      'Great flat lamps lie in rows on the dark and glow in vermilion, plum and honey.',
    ],
    [
      'pearls-on-a-moonlit-swell',
      1,
      'A sea made of grey pearls rises and falls in long swells under a hidden moon.',
    ],
    [
      'copper-eggs-aloft',
      1,
      'Tall copper eggs lift off their bed where it sounds and hang there, mirroring the dusk.',
    ],
  ],
  pond: [
    [
      'red-carp-in-jade-shallows',
      0,
      'From straight above, red and white carp go round in clear jade water over pale sand.',
    ],
    [
      'lilies-awake-under-the-moon',
      0,
      'A few great white lilies stand open on black water beside the broken light of the moon.',
    ],
    [
      'frogbit-closing-over',
      0,
      'Small round leaves in every green have all but closed over a ditch on a bright day.',
    ],
    [
      'leaves-held-in-a-millpond',
      0,
      'Russet leaves lie frozen into blue ice, with white cracks and drifts of frost across them.',
    ],
    [
      'willow-leaves-in-brush-line',
      0,
      'Narrow leaves and ripples are drawn in thin ink lines on warm paper.',
    ],
    [
      'scarlet-stars-on-a-black-mere',
      0,
      'Scarlet and gold star leaves lie spread on black water with the last light far behind.',
    ],
    [
      'rain-on-a-slate-beck',
      1,
      'Rain rings over flat grey stones in a beck, seen from above, everything slate and silver.',
    ],
    [
      'petals-down-a-sand-brook',
      1,
      'Round pink petals drift down a shallow brook of pale sand in full spring light.',
    ],
    [
      'glowing-carp-by-violet-boulders',
      1,
      'In a brook of another world pale green carp pass between violet boulders by night.',
    ],
    [
      'larch-needles-on-an-amber-burn',
      1,
      'Gold needles ride a brown burn toward the far bank in late light.',
    ],
  ],
  'poured-veils': [
    [
      'six-lengths-of-awning',
      0,
      'Six broad lengths of brick, ochre, sea green and plum paint hang side by side on white cotton.',
    ],
    [
      'peony-opened-in-the-dark',
      0,
      'One great flower of pale paint, cream and old rose, opens on black cloth.',
    ],
    [
      'threads-of-green-rain',
      0,
      'Long threads of green, grey and straw paint run straight down black cloth like rain at night.',
    ],
    [
      'waterfall-in-thin-ink',
      0,
      'Grey ink outlines swell over a ledge and fall on in long thin runs down bare paper.',
    ],
    [
      'grasses-in-stipple',
      0,
      'Grass blades in fine dots of umber and moss stand up from the foot of a cream page.',
    ],
    [
      'moon-ringed-like-a-tree',
      1,
      'One perfect disc of rings inside rings glows faintly silver and blue in the dark.',
    ],
    [
      'tea-cup-rings',
      1,
      'Small round stains of tea and walnut lie about a pale sheet, many of them and all alike.',
    ],
    [
      'skerries-on-a-painted-chart',
      1,
      'Ragged islands of sand, moss and rust are broken into a deep blue sea, as on an old map.',
    ],
    [
      'four-glazes-in-one-pool',
      1,
      'Four wet glazes, blue, plum, straw and moss, lie one inside the other in a thick pool on pale cloth.',
    ],
    [
      'first-drops-on-the-mill-pond',
      1,
      'Rings from the first drops of rain spread one through another on a dusk blue mill pond.',
    ],
  ],
  press: [
    [
      'hachures-on-a-county-map',
      0,
      'Brown engraved lines swell and thin over rolling hills on old cream paper.',
    ],
    [
      'orange-sun-over-furrows',
      0,
      'A great orange sun stands behind dark hills, all of it printed in round dots.',
    ],
    [
      'brambles-in-plum-ink',
      1,
      'A heap of round berries in plum and wine ink fills a pale page, each shaded in three plates of dots.',
    ],
    [
      'village-lights-on-the-fell',
      0,
      'Warm lights, large and small, are strewn over dark hills at night and thin out far away.',
    ],
    [
      'quoit-in-a-coiled-line',
      0,
      'One iron ring stands on white paper, drawn with a single coiled line that swells in the shade.',
    ],
    [
      'foam-rings-on-a-green-swell',
      0,
      'A long green swell, drawn all in open rings of foam, rolls toward you under a black sky.',
    ],
    [
      'pear-in-three-inks',
      1,
      'One ripe pear is printed in yellow, red and blue dots that do not quite meet, on white paper.',
    ],
    [
      'twist-of-rose-silk',
      0,
      'A twist of rose silk, drawn in fine lines that swell in the light, stands shining in the dark.',
    ],
    [
      'moon-in-blown-sand',
      1,
      'A smooth bare globe is made of grey grains of every size, strewn as wind leaves them.',
    ],
    [
      'ring-stone-before-a-jade-moon',
      1,
      'A dark worn ring of stone stands before a wide jade green moon, with the light through its eye.',
    ],
  ],
  prism: [
    [
      'stripes-on-studio-plaster',
      0,
      'A low block of glass on a white floor throws flat stripes of colour up a pale plaster wall.',
    ],
    [
      'glass-star-from-the-rafters',
      0,
      'From high above, one small block of glass throws long rays of straw and rose all round it.',
    ],
    [
      'colours-spilt-on-a-white-floor',
      0,
      'From above, a small block of glass spills sea green, rose and honey all over a white floor.',
    ],
    [
      'ice-pillar-by-lamplight',
      0,
      'A tall pillar of ice stands close before you, cold blue light bent and caught inside it.',
    ],
    [
      'three-blocks-in-plum-dusk',
      0,
      'Three blocks of glass stand in a row in a plum coloured room, their fans crossing in smoke.',
    ],
    [
      'moss-green-curtain-of-dots',
      0,
      'A tall curtain of moss and sea green light hangs over nothing, made of small round dots.',
    ],
    [
      'glass-petals-on-linen',
      1,
      'Clear coloured panes lie round a middle like petals on pale linen, darker where they cross.',
    ],
    [
      'paint-chips-fanned-out',
      1,
      'Twelve long strips of flat colour, clay, ochre, sage and slate, are fanned out on a pale table.',
    ],
    [
      'beetle-shell-discs',
      1,
      'A dark spiral stair of round plates shines in fine green and bronze lines like a beetle.',
    ],
    [
      'petrol-on-wet-stone-steps',
      1,
      'Black stone steps lie wet at dusk with a film of petrol on them in bands of violet, teal and gold.',
    ],
  ],
  'rib-lantern': [
    [
      'paper-moon-on-a-snowfield',
      0,
      'A pale lantern hangs low over grey blue snow at dusk and lays rings of light on it.',
    ],
    [
      'sieve-lamp-in-an-attic',
      1,
      'A brass lamp drilled full of holes throws a night of round stars over bare attic boards.',
    ],
    [
      'persimmon-silk-drum',
      0,
      'A drum of persimmon silk pleated over upright ribs fills a deep plum room.',
    ],
    [
      'lamps-set-on-the-canal',
      0,
      'Small lanterns drift over a black canal, each with its own long light under it.',
    ],
    [
      'bare-hoops-in-a-studio',
      1,
      'A tall lantern stripped of its paper stands in a white room, only hoops and air.',
    ],
    [
      'gourd-lamp-from-the-rafters',
      1,
      'Seen from the rafters, a ribbed gourd of light throws a wheel of long rays over the floor.',
    ],
    [
      'disc-over-ochre-dunes',
      0,
      'A flat lit disc stands in a green evening over the dunes of some other world.',
    ],
    [
      'indigo-shopfront-drums',
      0,
      'Rows of paper drums hang close before a shop at night, blue, cream and one red.',
    ],
    [
      'under-the-honey-hive',
      0,
      'From right beneath, a hive of fine amber hoops narrows to its bright round mouth.',
    ],
    [
      'lattice-posts-in-fog',
      1,
      'Slim lattice lamps stand about a pale green marsh and go paler into the fog.',
    ],
  ],
  ribbons: [
    [
      'banners-on-limewash',
      0,
      'Five plain dyed lengths hang straight against a white wall, each with its soft shadow.',
    ],
    [
      'oarweed-in-the-cove',
      0,
      'Long pointed blades of weed stand and lean in deep green water, olive, teal and straw.',
    ],
    [
      'shavings-off-the-lathe',
      0,
      'Bright coils of brass and copper curl through a black workshop and catch one window.',
    ],
    [
      'runners-over-the-sand',
      0,
      'Striped and chequered runners are rolled out over pale sand, off to where it ends.',
    ],
    [
      'warp-on-the-loom',
      0,
      'Flax threads hang in their hundreds in the dark, lit along their length from one side.',
    ],
    [
      'pennants-before-a-gale',
      0,
      'Narrow pennants of red, white and ink blue stream sideways under a slate sky.',
    ],
    [
      'leaded-panes-at-supper',
      1,
      'A folding screen of small leaded panes glows plum, amber and green from a lit room.',
    ],
    [
      'sea-glass-rounds',
      1,
      'Big rounds of reeded glass, aqua, milk and olive, stand on a pale floor that mirrors them.',
    ],
    [
      'spires-of-a-blue-town',
      1,
      'From the floor, rows of thin glass spires rise violet and cold blue into a night haze.',
    ],
    [
      'rain-down-the-greenhouse',
      1,
      'Rain wanders down clear greenhouse panes, with blurred leaf green and straw behind.',
    ],
  ],
  ripples: [
    [
      'oyster-beds-at-sunrise',
      0,
      'A huge orange sun stands on the rim of a pale sea, and the water is a field of round shells.',
    ],
    [
      'ruled-swell-by-moonlight',
      0,
      'A long black swell ruled in fine silver lines rolls in under one full moon.',
    ],
    [
      'islands-of-the-inland-sea',
      0,
      'Blue islands lie one behind another on still water under an amber evening sky.',
    ],
    [
      'buoys-off-the-mole',
      0,
      'Great round buoys of red, cream and teal lie close packed on dark green water.',
    ],
    [
      'bay-from-a-gull',
      0,
      'Seen from the air, rows of small breakers bend round a pale sandy bay.',
    ],
    [
      'leaves-on-the-carp-pond',
      1,
      'Round notched leaves lie on dark green water, and rain rings spread between them.',
    ],
    [
      'moon-fallen-in-the-cistern',
      1,
      'A full cream moon lies in dark water and is broken by each drop.',
    ],
    [
      'drizzle-on-chalk-water',
      1,
      'Fine grey drizzle dots milky water with small open rings as far as it goes.',
    ],
    [
      'pebbles-under-the-ford',
      1,
      'Round pebbles of rust, plum and sand lie close under a clear shallow stream.',
    ],
    [
      'combed-court-after-rain',
      1,
      'Fine combed lines bend in wide arcs over pale sand and part round each wet ring.',
    ],
  ],
  'river-lanterns': [
    [
      'hundred-rising-lamps',
      0,
      'Paper lamps climb from the far shore into a deep blue night and shiver in the sea below.',
    ],
    [
      'lamps-on-new-snow',
      0,
      'A great many small amber lamps stand about on blue moonlit snow, seen from high up.',
    ],
    [
      'coral-globes-at-daybreak',
      0,
      'A few coral and cream globes float on water as still and pale as milk, hills in mist behind.',
    ],
    [
      'lily-lamps-and-moon',
      0,
      'White and rose lilies with a flame in each lie open among pads and reeds, the moon among them.',
    ],
    [
      'ranks-through-the-gorge',
      0,
      'Red lamps in straight ranks go up a rough river between black walls of rock.',
    ],
    [
      'boxes-over-clear-pebbles',
      1,
      'In full day paper boxes drift over sunlit shallows, every pebble of the bed in sight.',
    ],
    [
      'rain-among-red-globes',
      1,
      'Great red globes ride dark rough water in the rain, close by and low.',
    ],
    [
      'jade-basin-lilies',
      1,
      'A green basin from straight above, thick with round pads and small burning lilies.',
    ],
    [
      'vermilion-on-white-garden',
      1,
      'Vermilion globes stand in rows between snowed stones on a white winter garden.',
    ],
    [
      'one-file-past-boulders',
      1,
      'A thin file of small silver lamps threads still black water between two huge stones.',
    ],
  ],
  'rose-window': [
    [
      'limewashed-wheel',
      0,
      'A wheel of sixteen petals in indigo, ochre and brick stands straight before us in a white wall.',
    ],
    [
      'sky-in-the-tracery',
      0,
      'Most of the glass has fallen, and drifting cloud fills the holes of the old grey stone.',
    ],
    [
      'cobalt-slab-flower',
      0,
      'Six broad petals of thick cobalt and sea blue slabs glow in heavy black stone.',
    ],
    [
      'garnet-by-lamplight',
      0,
      'Rounds of garnet and amber glass burn low over stone warmed by lamps on the floor.',
    ],
    [
      'silver-spokes',
      0,
      'A great cold wheel of clear glass and eighteen pointed spokes rises steeply over us.',
    ],
    [
      'clear-winter-lights',
      1,
      'Pointed lights of clear glass fill a white wall, all snow light and pale grey lead.',
    ],
    [
      'lozenges-on-the-flagstones',
      1,
      'From high at the back, rust, gold and teal lozenges lie thrown in long rows over a dark floor.',
    ],
    [
      'amber-arrow-slits',
      1,
      'Five thin slits of amber glass cut a black wall and lay five thin strips on the floor.',
    ],
    [
      'drowned-portholes',
      1,
      'Columns of round lights in coral and sea green waver as if the hall lay under water.',
    ],
    [
      'vine-shade-hall',
      1,
      'Vine leaves hang behind green and gold windows and dapple the floor of a pale summer room.',
    ],
  ],
  'sand-figures': [
    [
      'charcoal-on-porcelain',
      0,
      'Charcoal dust gathers into rings and petals on a round white plate seen from straight above.',
    ],
    [
      'dunes-from-a-low-kite',
      0,
      'Heaped bands of ochre sand wander away over dark red ground to the edge of sight.',
    ],
    [
      'lit-seams-of-the-reef',
      0,
      'Winding seams of sea green and coral light burn softly in a black sea bed.',
    ],
    [
      'pencil-survey-sheet',
      0,
      'Thin sepia contour lines wind over a sheet of warm paper, as on a survey of hills.',
    ],
    [
      'pearls-on-indigo-lacquer',
      0,
      'Great pearls lie heaped in a ring and a cross on a board of indigo lacquer, seen along it.',
    ],
    [
      'rose-in-milk',
      1,
      'A dish of milk swells into slow round petals, rose and honey lying faintly in its hollows.',
    ],
    [
      'copper-oil-swell',
      1,
      'A shoreless sea of copper oil rolls off in long bent folds under a low lamp.',
    ],
    [
      'drops-on-waxed-paper',
      1,
      'Round drops large and small cover pale waxed paper in a wide pattern, each with its glint.',
    ],
    [
      'mallow-leaded-tray',
      1,
      'A square tray glows mallow, plum and amber between dark threads where the water stands still.',
    ],
    [
      'one-bell-in-slate-water',
      1,
      'Wide rings stand all the way out over slate grey water, as after a single bell.',
    ],
  ],
  'scraped-black': [
    [
      'ram-horn-in-chalk',
      0,
      'A ribbed coil of old stone lies on white chalk, its shadow soft and grey beside it.',
    ],
    [
      'periwinkle-tray',
      0,
      'Rows of small painted shells in rust, olive and slate lie on cream card, each with its shadow.',
    ],
    [
      'whelk-at-low-water',
      0,
      'A tall shell stands dark against a great red sun, and both lie again in still water.',
    ],
    [
      'thorned-lamp-shell',
      0,
      'A shell set with thorns glows from within like a lamp and warms the dark shelf under it.',
    ],
    [
      'nautilus-under-the-graver',
      0,
      'A shell sawn through shows room after curved room, cut in fine lines in the blue dark.',
    ],
    [
      'theatre-seats-in-moonlight',
      1,
      'Wide curved rows of stone seats lie under snow in blue moonlight, with nobody there.',
    ],
    [
      'steps-down-to-green-water',
      1,
      'Worn stone steps come down into still green water, which holds the last of them upside down.',
    ],
    [
      'down-the-lighthouse-stair',
      1,
      'A winding stair drops away below, each tread a fan of scraped light round a black well.',
    ],
    [
      'slabs-in-white-air',
      1,
      'Six thin slabs float upward through white air, in rose, sand and sage, over their own soft shade.',
    ],
    [
      'painted-quarry-blocks',
      1,
      'Blocks of ochre, brick and teal stone lie slid apart up a hill, inked in flat colour.',
    ],
  ],
  'scraped-wax': [
    [
      'dawn-swept-round-a-hill',
      0,
      'Cream, rose and brick red wax swept in wide arcs over one round dark blue hill.',
    ],
    [
      'sealing-wax-run-down',
      0,
      'Vermilion, wine and rose wax pulled straight down in long soft runs from a dark edge.',
    ],
    [
      'shoals-through-a-porthole',
      0,
      'Through one round window in black wax, green and turquoise shoals lie in strips.',
    ],
    [
      'estuary-before-dark',
      0,
      'Wet flats of lilac, slate and one gold channel run away to a pale evening sky.',
    ],
    [
      'crayon-tablets',
      0,
      'Eight small tablets of bright scraped crayon stand in two rows on a white board.',
    ],
    [
      'heaved-jasper-cliff',
      0,
      'Bands of rust, cream and grey green stone stand heaved up and folded in a tall cliff.',
    ],
    [
      'sunflower-scratched-in-blue',
      1,
      'A ring of gold and orange strokes stands like petals, scratched out of deep blue wax.',
    ],
    [
      'sedge-through-snow-crust',
      1,
      'A few brown and olive stalks lean out of white ground, long and thin, with nothing behind.',
    ],
    [
      'stubble-rows-by-lantern',
      1,
      'Long cut straw stands bright in a low amber light, row behind row, back into the night.',
    ],
    [
      'basket-weave-ridges',
      1,
      'Green and plum hatching crosses over two steep ridges, their crests white, in oxblood wax.',
    ],
  ],
  'scratched-film': [
    [
      'chalk-disc-behind-ranges',
      0,
      'A round of chalk white light stands behind jagged scratched ranges, which turn dark across it.',
    ],
    [
      'loose-curl-of-clear-film',
      0,
      'A loose curl of clear film lies on a grey table, with calm rust and blue lines of ink along it.',
    ],
    [
      'blistered-amber-strip',
      0,
      'A deep red strip has burnt through to the lamp in places, with amber blisters round each hole.',
    ],
    [
      'lit-carriages-going-away',
      0,
      'Bright windows in a row and thin rails of light run off to the right through a blue night.',
    ],
    [
      'proof-sheet-of-squalls',
      0,
      'Strips of small frames lie one under another on cream film, each a squall of sepia ink.',
    ],
    [
      'pond-drops-in-darkfield',
      1,
      'Drops of turquoise and gold light of every size hang apart on black, with one mauve thread.',
    ],
    [
      'frost-flowers-on-a-slide',
      1,
      'Great fans of blue crystals have grown over the whole of a glass slide, edge to edge.',
    ],
    [
      'one-pool-of-madder',
      1,
      'One great pool of madder red dries on white film, its rim drawn dark and smooth.',
    ],
    [
      'sheet-of-small-petals',
      1,
      'Loose petals in rose and coral ink lie scattered in small pale frames, in rows on one dark sheet.',
    ],
    [
      'magic-lantern-wheel',
      1,
      'A wheel of painted glass glows in the dark, its pictures melting one into the next.',
    ],
  ],
  'sea-overhead': [
    [
      'a-sail-hung-upside-down',
      0,
      'A small blue sail floats upside down on a peach sea, and the wet flats below show it again.',
    ],
    [
      'waiting-under-floes',
      0,
      'A crowd in grey coats and one red stands under a ceiling of broken ice, with light in every seam.',
    ],
    [
      'pier-lamps-under-swell',
      1,
      'Two rows of posts with lamps walk off over black water, under a night sea whose crests glow.',
    ],
    [
      'gorge-cut-in-copper',
      0,
      'An old print in fine lines: rock walls, one small figure, and waves for a sky.',
    ],
    [
      'dunes-for-a-ceiling',
      1,
      'A desert hangs head down over another desert, rust over rose, with a low light in the gap.',
    ],
    [
      'straight-up-into-jade',
      0,
      'The head thrown back, and nothing to see but green water with the sun behind it.',
    ],
    [
      'rain-going-home',
      1,
      'Grey weather at the old breakwater, and the rain rising in threads to the sea it came from.',
    ],
    [
      'net-light-on-apricot',
      0,
      'Seen from high up: warm sand, tide pools, and the net of light sliding over the people on it.',
    ],
    [
      'plum-shelf-over-wheat',
      1,
      'One great plum fold of water ends in the air, and past it a wide gold evening is open.',
    ],
    [
      'lanterns-on-a-ravine-floor',
      0,
      'Night between black walls: a few people with lanterns on the bottom, and the shining sea for a roof.',
    ],
  ],
  'seed-heads': [
    [
      'goatsbeard-on-a-flyleaf',
      0,
      'One great head of few parasols, every ray drawn in brown ink on the blank page of a book.',
    ],
    [
      'hoar-on-a-hundred-rays',
      0,
      'A head so near it rises like a cold planet, each ray hung with drops under a winter moon.',
    ],
    [
      'cotton-tufts-on-the-fen',
      0,
      'White tufts stand far off into a pale green morning, and the still bog water holds them again.',
    ],
    [
      'allium-after-a-shower',
      0,
      'A globe of small violet stars, wet and bright, against a green border gone soft.',
    ],
    [
      'pollen-grain-enlarged',
      0,
      'One grain under the lens, set all over with amber beads that hold the light.',
    ],
    ['thistle-in-a-red-disc', 1, 'A shut thistle on its scaly bulb, black before a huge red sun.'],
    [
      'down-over-a-still-mere',
      1,
      'Seeds drift across the stars, and the moon and the half bare head lie again in black water.',
    ],
    [
      'last-seeds-on-white-sky',
      1,
      'A white sky, a bare stalk, and every seed it had drawn fine and dark on the wind.',
    ],
    [
      'parachutes-in-green-deep',
      1,
      'Broad soft umbrellas hang in deep green water, coral at the rim, sinking past a low cushion.',
    ],
    [
      'reeds-before-a-gold-sun',
      0,
      'Tall woolly spindles stand in a gold evening, a big low sun behind and fluff on the air.',
    ],
  ],
  'shrinking-tiles': [
    [
      'leaded-leaf-transom',
      0,
      'A long band of leaves in amber, green and smoke glass, leaded in black, with evening behind.',
    ],
    [
      'plaster-leaf-ceiling',
      0,
      'White plaster leaves stand well off a white ground and say everything with their shadows.',
    ],
    [
      'oak-mould-to-the-root',
      0,
      'Lobed leaves in rust, ochre and olive lie one in another and crumble small to a dark edge.',
    ],
    [
      'cut-lace-at-first-stars',
      0,
      'A small round of cut paper hangs in the evening, the thin moon beside it, stars in its holes.',
    ],
    [
      'whirl-of-leaves-in-sepia',
      0,
      'A round of leaves drawn in brown pen on cream, all of it whirled like water round a drain.',
    ],
    [
      'indigo-cloth-with-wax-dots',
      0,
      'Straight cut patches of indigo and white, every one filled with rows of round wax dots.',
    ],
    [
      'leaf-lamp-by-the-bed',
      1,
      'A low dome of leaded leaves lit from within, rose and honey, its light lying on a dark table.',
    ],
    [
      'glazed-tureen-lid',
      1,
      'A round lid seen from straight above, its leaves moulded and glazed in green, cream and blue.',
    ],
    [
      'swirled-marble-on-felt',
      1,
      'One small glass ball on green felt, its leaves wound round and round as the twist in a marble.',
    ],
    [
      'plated-hill-of-a-moon',
      1,
      'A clear hill cut in rings stands at dusk on some other world, its neighbour hanging in the sky.',
    ],
  ],
  silk: [
    [
      'sheets-thrown-back',
      0,
      'A white sheet lies as it was thrown back, creased and soft in the first daylight.',
    ],
    [
      'carmine-cloth-rose',
      0,
      'A length of carmine cloth is wound in on itself until it opens like a rose.',
    ],
    [
      'foil-of-a-sweet',
      0,
      'Gold foil smoothed out again by a thumb, every crease catching the lamp.',
    ],
    [
      'voile-at-a-garden-window',
      0,
      'A thin pale curtain hangs in soft folds with the green light of a garden coming through.',
    ],
    [
      'satin-sea-by-moon',
      0,
      'Long dark swells of satin come in one behind the other, silver along their backs.',
    ],
    [
      'walnut-ink-let-into-water',
      1,
      'Brown ink hangs in clear water in slow veils, darkest where they lie over each other.',
    ],
    [
      'warm-oil-rising',
      1,
      'Round drops of amber and rose oil rise through dark plum water and run together.',
    ],
    [
      'ink-rain-past-the-moon',
      1,
      'Fine dark threads fall straight down in front of one round pale moon.',
    ],
    [
      'river-drawn-in-currents',
      1,
      'The currents of a wide river are drawn on paper in fine blue and rust lines.',
    ],
    [
      'silt-meeting-the-tide',
      1,
      'Beds of ochre silt slide in over green sea water and fold where they meet.',
    ],
  ],
  'slow-cadence': [
    [
      'pearls-coiled-on-black',
      0,
      'One long string of pearls lies coiled on black cloth, smallest at its heart.',
    ],
    [
      'petals-on-bottle-green',
      0,
      'Coral, rose and orange petals lie in turning rows on a deep green ground.',
    ],
    [
      'tesserae-of-a-round-pool',
      0,
      'Small square stones in sea blues and sand are laid in rings round a pool floor.',
    ],
    [
      'glass-pins-in-a-cushion',
      0,
      'A round crimson cushion is stuck with rows of glass headed pins and stands on a pale table.',
    ],
    [
      'tea-lights-round-a-fountain',
      0,
      'Rings of small flames float on black water, the nearest large and the far ones fine.',
    ],
    [
      'cast-net-over-cobalt',
      0,
      'A round net knotted of pale rings opens wide over deep blue water.',
    ],
    [
      'thistle-clock-on-the-sky',
      1,
      'Straight white threads stand out from one point against a soft blue sky, each with its seed.',
    ],
    [
      'agave-in-dry-ground',
      1,
      'The broad grey green blades of an agave spread from its heart over pale dry earth.',
    ],
    [
      'far-galaxy-leaning',
      1,
      'A leaning wheel of fine pale points with a gold heart turns slowly in deep blue.',
    ],
    [
      'snakelocks-anemone',
      1,
      'Green arms with violet tips open round the dark mouth of an anemone in a pool.',
    ],
  ],
  'slow-lumen': [
    [
      'flag-iris-on-cream',
      0,
      'The violet and yellow petals of one iris open from their stem on cream paper.',
    ],
    [
      'dawn-mist-on-a-loch',
      0,
      'Rose and grey mist lies in bands over a still loch that holds it all again.',
    ],
    [
      'brush-ribbon-black-and-red',
      0,
      'Long ribbons of black ink and one of red run over white paper.',
    ],
    [
      'pollen-let-go-at-dusk',
      0,
      'Clouds of gold grains drift and fold over each other in the last light.',
    ],
    [
      'gossamer-over-stubble',
      0,
      'Single threads of spider silk lie along a pale morning, waving a little.',
    ],
    [
      'comb-jelly-in-blue',
      0,
      'Long faint arms of a comb jelly trail down through clear blue water.',
    ],
    ['flamed-tulip', 1, 'One tulip flamed in red and yellow stands against a deep green dark.'],
    [
      'whale-breath-at-blue-dusk',
      1,
      'The breath of a whale stands white over still water, which holds it upside down.',
    ],
    ['heron-plume', 1, 'A long grey blue plume of fine barbs lies on paper.'],
    [
      'scarf-across-a-dark-room',
      1,
      'A shot silk scarf in plum, teal and copper floats across a dark room.',
    ],
  ],
  'slow-stripes': [
    [
      'contour-sheet-of-a-moor',
      0,
      'Fine brown lines close round hills and hollows, as on a walking map of a wide moor.',
    ],
    [
      'beet-rows-under-rime',
      1,
      'Frozen furrows run away under a pale rose sky to where the land ends.',
    ],
    [
      'ripple-tank',
      0,
      'Rings of cold light widen in a black tank of water and bend where the waves cross.',
    ],
    [
      'gorge-of-cut-card',
      1,
      'Layers of rust, coral and cream card step down into a winding gorge.',
    ],
    [
      'tent-roof-from-the-sawdust',
      1,
      'Faded red, ochre and cream canvas spreads in broad strips from one pole overhead.',
    ],
    [
      'lettuce-rows-at-noon',
      1,
      'Round heads of lettuce, green and wine red, stand in rows on dark earth to the horizon.',
    ],
    [
      'saddle-blanket',
      0,
      'A thick woven blanket in madder, ochre and teal goes back and forth in sharp points.',
    ],
    ['zebra-flank', 1, 'Black stripes branch and close over a white flank that slowly breathes.'],
    [
      'moon-track-on-a-slow-swell',
      0,
      'Lines of moonlight ride a long slow swell out to a dim horizon.',
    ],
    [
      'jet-and-pearl-bead-fan',
      0,
      'Rows of small beads in dove grey, copper and ivory spread as a fan out of the dark.',
    ],
  ],
  'small-squares': [
    [
      'flats-across-the-yard',
      0,
      'Lit windows in amber, rose and dim blue, row on row, in a wall gone black.',
    ],
    [
      'celadon-splashback',
      0,
      'Small glazed tiles in every depth of one grey green, with light on their worn edges.',
    ],
    [
      'stool-top-in-felt',
      0,
      'Patches of plum, mustard and moss felt, stitched in rounds about a small bare middle.',
    ],
    [
      'confetti-on-wet-stone',
      0,
      'The last bright scraps of paper lie turned every way on dark grey paving.',
    ],
    [
      'quilt-on-the-unmade-bed',
      0,
      'A patchwork of navy, cream and a little old red lies rumpled in low window light.',
    ],
    [
      'rose-tiled-esplanade',
      0,
      'Old paving washed in rose, lilac and sand runs out flat to a pale far sky.',
    ],
    [
      'ice-breaking-from-the-masthead',
      1,
      'White and blue plates of ice split into shards over deep black water.',
    ],
    [
      'pebbles-below-the-weir',
      1,
      'Rounded stones in slate, rust and cream lie in bands as the water left them.',
    ],
    [
      'onion-cells-in-violet-stain',
      1,
      'The long cells of an onion skin lie side by side, each drawn round in violet stain.',
    ],
    [
      'paddies-holding-the-dusk',
      1,
      'Curved flooded fields keep the last apricot and green of the sky between black banks.',
    ],
  ],
  'small-suns': [
    [
      'beech-floor-in-new-leaf',
      0,
      'Yellow green light lies in pools on a wood floor that runs back among dark trunks.',
    ],
    [
      'bitten-suns-on-paving',
      0,
      'Every spot of sun on the grey paving has become a thin crescent, all turned one way.',
    ],
    [
      'last-panes-on-the-stairwall',
      0,
      'Late orange light through small windows lies askew on a plum dark wall.',
    ],
    [
      'quay-lights-gone-soft',
      0,
      'Amber, coral and green lamps of a far quay swell into soft round discs on black.',
    ],
    [
      'evening-slant-on-a-sea-wall',
      0,
      'A low sun lays long strokes of honey light aslant over the blocks of an old wall.',
    ],
    [
      'sun-through-a-pierced-vault',
      0,
      'Round spots of sun from a pierced roof lie row on row over a red tiled floor.',
    ],
    [
      'blossom-fall-over-plum-silk',
      1,
      'Rose light comes down slowly, as petals do, over a hanging of plum watered silk.',
    ],
    [
      'kerchiefs-in-the-pear-tree',
      1,
      'A few small white kerchiefs hang on a line before a bright green blur of orchard.',
    ],
    [
      'vine-shadow-on-the-sheets',
      1,
      'The round shadows of grapes and leaves lie blue on cream sheets in full sun.',
    ],
    [
      'rings-on-a-velvet-drop',
      1,
      'Rings of sea green light drift over the folds of a black velvet curtain.',
    ],
  ],
  'small-world': [
    [
      'two-trees-on-a-snowball',
      0,
      'A tiny white ball hangs in pale grey air with a pine and a thorn on it, and snow falls in toward it.',
    ],
    [
      'roofs-all-the-way-round',
      0,
      'A small round town of clay roofs and pale towers points outward on every side of its square.',
    ],
    [
      'ball-of-alps',
      0,
      'White peaks stand out all round a small dark ball of firs under a clear cold sky.',
    ],
    [
      'islets-under-a-full-moon',
      0,
      'A dark sea curves away below the stars with small wooded islets on it, and the moon is up.',
    ],
    [
      'toadstool-moon',
      0,
      'Smooth ochre and rose caps crowd a small plum coloured moon in a deep green sky.',
    ],
    [
      'engraved-orb',
      0,
      'A wooded globe with sharp peaks is drawn in rings of dark ink on warm paper.',
    ],
    [
      'lit-windows-round-a-yard',
      1,
      'Seen from the floor of a court, tall houses lean in with lit windows round a disc of stars.',
    ],
    [
      'floor-of-the-fir-wood',
      1,
      'Firs stand close all round and lean in over a pale hole of morning sky.',
    ],
    [
      'dune-hollow-at-sundown',
      1,
      'Rippled red sand closes in from every side on a round of burning evening sky.',
    ],
    [
      'umbrella-pines-round-a-lagoon',
      1,
      'Shallow green water rings a wide bright sky, with small sandy islands leaning in over it.',
    ],
  ],
  'smoke-streams': [
    [
      'five-stones-in-combed-sand',
      0,
      'Pale sand is combed in even ridges that part and close again round five mossy stones.',
    ],
    [
      'long-hair-round-a-black-moon',
      0,
      'Hair fine ink lines fall down a sheet of warm paper and part round one great black disc.',
    ],
    [
      'rain-past-paper-moons',
      0,
      'Drops of light run down a deep blue night and slide round five softly glowing moons.',
    ],
    [
      'knots-in-a-cedar-plank',
      0,
      'The warm grain of a plank runs in bands of russet and honey round its dark knots.',
    ],
    [
      'pools-left-by-the-ebb',
      0,
      'Ridged wet sand runs away to a rose horizon, with still pools lying along it.',
    ],
    [
      'snowed-furrows-and-boulders',
      0,
      'Snow lies in the curved furrows of a brown field that bends round a row of five boulders.',
    ],
    [
      'weed-combed-by-the-current',
      1,
      'Broad soft fronds of brown and green lean and sway in slow green water.',
    ],
    [
      'combed-marbling-bath',
      1,
      'Bands of madder, indigo, ochre and cream paint are drawn out and wound into tight curls.',
    ],
    [
      'boulder-in-a-green-river',
      1,
      'A grey boulder stands in clear green water that folds and curls away behind it.',
    ],
    [
      'wind-map-of-an-island',
      1,
      'Strings of blue dots blow across a pale chart and eddy behind one small round island.',
    ],
  ],
  'snow-letter': [
    [
      'sun-animal-in-a-water-drop',
      0,
      'A clear round creature with twelve feathered rays hangs lit in black water.',
    ],
    [
      'gilt-star-on-green-felt',
      0,
      'A ten armed star of worked gold lies on dark green felt under one lamp.',
    ],
    [
      'ginger-stars-on-a-floured-board',
      0,
      'Ginger and sugar biscuits with five round arms lie in rows on a pale floured board.',
    ],
    [
      'white-stars-on-blue-oilcloth',
      0,
      'White and straw coloured stars in close rows, each a little different, on deep blue cloth.',
    ],
    [
      'white-clematis-on-slate',
      0,
      'A flower with eight pale violet petals lies open on a slab of dark slate.',
    ],
    [
      'glass-stars-hung-in-a-ring',
      0,
      'A star of coloured glass hangs before apricot cloth with little ones in a ring round it.',
    ],
    [
      'flakes-past-a-street-lamp',
      1,
      'Flakes of every size drift down out of a dark blue night through warm lamplight.',
    ],
    [
      'sea-stars-on-wet-sand',
      1,
      'Orange and violet sea stars lie where the tide left them, each in its own film of water.',
    ],
    ['one-flake-on-red-flannel', 1, 'A single furred white flake has settled on deep red flannel.'],
    [
      'chalk-stars-on-a-blackboard',
      1,
      'Stars with eight arms stand in white outline on a rough blue black board, seen aslant.',
    ],
  ],
  snowfall: [
    [
      'plum-petals-in-the-lane',
      0,
      'Pink petals turn over in a pale morning above a lane of moss, thatch and old stone.',
    ],
    [
      'thaw-rain-by-lamplight',
      0,
      'Long rain falls between tall houses, and every lamp of the street stands on its head in the water.',
    ],
    [
      'roofs-from-an-attic',
      0,
      'A snowed-in village at blue dusk, its roofs and lit windows seen from a high window.',
    ],
    [
      'one-lamp-on-the-moor',
      0,
      'A single lamp stands in an empty white field, and a few large flakes come slowly down.',
    ],
    ['sparks-over-thatch', 0, 'Sparks climb over dark thatched roofs towards a great red moon.'],
    [
      'birch-gold-coming-down',
      1,
      'Yellow leaves drop through a bright birch wood onto a floor already deep in gold.',
    ],
    [
      'canes-in-warm-rain',
      1,
      'Green canes crowd up into mist while warm rain comes straight down between them.',
    ],
    [
      'three-giants-by-moonlight',
      1,
      'A few enormous trunks stand black before a low blue moon in deep snow.',
    ],
    [
      'alders-in-the-flood',
      1,
      'Slim alders stand in still water at a rose dawn and are drawn twice.',
    ],
    [
      'marine-snow-in-the-weed',
      1,
      'Great green fronds sway in pale sea light while white specks sink slowly past them.',
    ],
  ],
  'soft-city': [
    [
      'night-fleet-from-the-headland',
      0,
      'Boats lie far out with their lamps lit, small sharp points on a wide sea under the moon.',
    ],
    [
      'paper-lamps-on-the-canal',
      0,
      'Square paper lamps let go of their posts and rise, and the canal holds each one again.',
    ],
    [
      'milky-morning-on-the-tramline',
      0,
      'A pale wet morning: the street lights are faint washes of colour and one figure goes ahead.',
    ],
    [
      'first-flakes-on-the-boulevard',
      0,
      'Great flakes sink before the lens over a snowy road with a few blurred lamps far along it.',
    ],
    [
      'between-the-glass-towers',
      0,
      'Hollow rings of light hang in a deep street of towers, each wall a grid of lit panes.',
    ],
    [
      'umbrellas-after-the-opera',
      0,
      'A crowd goes home under umbrellas along a wet street of crimson and amber light.',
    ],
    [
      'orangery-pane-at-noon',
      1,
      'Bright fine beads of water cover a pane, with soft greens and oranges behind it.',
    ],
    [
      'last-ferry-lights-ashore',
      1,
      'One low row of harbour lights lies on black water under a moon, the window dry.',
    ],
    [
      'great-drops-on-grey-silk',
      1,
      'A few great drops on a grey pane each hold the street small and upside down.',
    ],
    [
      'shop-windows-through-the-rain',
      1,
      'Rain runs in long drops down the glass, and beyond it square shop windows glow at dusk.',
    ],
  ],
  'soft-lights': [
    [
      'apricot-wax-in-the-den',
      0,
      'Warm lumps of apricot wax part, rise and run together before a wall the colour of plums.',
    ],
    [
      'coloured-cups-behind-reeds',
      1,
      'Blue, coral and honey shapes like cups stand cut into slivers behind white reeded glass.',
    ],
    [
      'two-moons-on-a-tarn',
      0,
      'Two pale moons hang over black water that holds them both, a little shaken.',
    ],
    [
      'lichen-veils-over-ice',
      0,
      'Tall veils of lichen green and violet smoke hang over flat ice and stand in it again.',
    ],
    [
      'glass-brick-stairwell',
      0,
      'A wall of glass bricks, some blue and some amber, with a lamp moving behind it.',
    ],
    [
      'mallow-leaves-on-linen',
      0,
      'The shadow of leaves moves on pale cloth where two soft stains of green and rose have spread.',
    ],
    [
      'tinted-discs-on-a-lightbox',
      1,
      'Cut discs of red, blue and yellow film lie one over another on a white lightbox.',
    ],
    [
      'copper-hoops-in-lampblack',
      1,
      'Broken copper hoops turn slowly one inside another in the dark.',
    ],
    [
      'banners-over-a-brown-river',
      1,
      'Five long banners of dyed cloth stand before a clay wall, and brown water shakes their colours.',
    ],
    [
      'orbits-chalked-on-blue',
      1,
      'Circles and half circles drawn in chalk go round one another on a dark blue board.',
    ],
  ],
  'spilled-strips': [
    [
      'bamboo-leaves-on-a-tank',
      0,
      'Long yellow and green leaves float on a dark green tank, their shadows on the floor below.',
    ],
    [
      'duckboards-over-grey-water',
      0,
      'Bleached boards and one red one run side by side out over rippled grey water.',
    ],
    [
      'stained-slips-crossed',
      0,
      'Slips of rose, olive and blue glass lie crossed on white, their colours adding up where they lap.',
    ],
    [
      'straws-on-crimson-cloth',
      0,
      'Thin gold straws are thrown in all directions over a crimson cloth.',
    ],
    [
      'shavings-under-the-plane',
      0,
      'Pale curls of planed wood lie heaped on a dark bench among crumbs.',
    ],
    [
      'lit-rods-round-a-hub',
      0,
      'Rods of amber, white and blue light stand out from one point in the dark.',
    ],
    [
      'becalmed-sails',
      1,
      'White and rust sails stand on a flat green bay, each with its long shadow on the water.',
    ],
    [
      'snow-fences-at-dusk',
      1,
      'Low fences zigzag over blue snow, and the last sun draws their shadows right across.',
    ],
    [
      'ring-of-sawn-ice',
      1,
      'Clear blue sheets of sawn ice stand in a ring on blue snow, each throwing a tinted shadow.',
    ],
    [
      'red-canyon-walls',
      1,
      'Wall behind wall of red, ochre and grey rock winds across pale sand, seen from the air.',
    ],
  ],
  'spinning-tops': [
    [
      'raked-court-at-evening',
      0,
      'Grey stone tops stand in pale gravel raked in rings round every one of them.',
    ],
    [
      'squash-stall-from-above',
      0,
      'A crowd of fluted squashes, orange, cream and green, on blue and white tiles seen from above.',
    ],
    [
      'one-tiered-tower',
      0,
      'One tall tower of four-sided tiers leans on ringed sand under an apricot sky, a small one by it.',
    ],
    [
      'brass-on-black-glass',
      0,
      'Turned brass and copper tops stand on black glass that holds them upside down.',
    ],
    [
      'paper-lamps-on-the-lake',
      0,
      'Round paper lamps in rose and amber are set down on a still black lake.',
    ],
    [
      'china-plates-on-linen',
      0,
      'Round plates ringed in fine blue turn on pale linen, seen from above in clear morning light.',
    ],
    [
      'flower-wheels-on-limewash',
      1,
      'Scalloped wheels of clay, sage and straw roll along a sill before a bright limewashed wall.',
    ],
    [
      'silver-reels-on-plum-velvet',
      1,
      'Long silver reels roll before a heavy plum curtain, the folds bent in their sides.',
    ],
    [
      'eight-sided-lamp-rolling',
      1,
      'One great eight-sided lamp of sea green panes rolls along a rail through the dark.',
    ],
    [
      'cotton-reels-by-the-linen-curtain',
      1,
      'Long reels in striped thread crowd a pale rail that runs away past a linen curtain in daylight.',
    ],
  ],
  'stand-up-page': [
    [
      'card-ridges-before-sunup',
      0,
      'Ridge behind ridge of slate blue card fades into a peach haze, a paper sun coming up between.',
    ],
    [
      'card-gables-lit-from-behind',
      0,
      'A town of card gables climbs out of the dark to a paper sun, with one lamp behind it all.',
    ],
    [
      'knot-garden-in-green-card',
      0,
      'Hedges, arches and grasses of green card stand round a gold sun on warm paper, seen from above.',
    ],
    [
      'white-paper-wood-at-sundown',
      0,
      'A wood cut from white card stands on blue cloth in low winter sun.',
    ],
    ['seaweed-theatre', 0, 'Tall fronds of green and rust paper stand rank on rank in lit water.'],
    [
      'printed-nursery-meadow',
      0,
      'Broad leaves and waves in striped and dotted paper stand on a black table.',
    ],
    [
      'clay-stair-village',
      1,
      'Broad flights of clay coloured steps stand in low sun on a floor that runs out of sight.',
    ],
    [
      'lit-towers-in-ground-fog',
      1,
      'Paper towers with every window lit stand in blue dusk, fog about their feet.',
    ],
    [
      'gilt-pinnacles-on-black',
      1,
      'Thin gilt towers stand before a black page cut in peaks, a small red house at their feet.',
    ],
    [
      'striped-houses-on-green-cloth',
      1,
      'Blocks of mint, coral, ochre and blue striped paper stand on a dotted page laid on green cloth.',
    ],
  ],
  star: [
    [
      'cinder-with-lit-cracks',
      0,
      'A black cinder fills half the picture, and the fire inside it shows red through every crack.',
    ],
    [
      'pearl-before-grey-silk',
      0,
      'One large pearl hangs in soft daylight before a pale ground, with a faint round of light about it.',
    ],
    [
      'red-disc-on-a-cold-sea',
      0,
      'A banded red star stands half sunk in a dusk sea, and its broken image lies toward you.',
    ],
    [
      'three-suns-in-amber-dust',
      0,
      'A great banded amber sun and two small ones that circle it burn through a haze of brown dust.',
    ],
    [
      'ochre-giant-in-its-girdle',
      0,
      'A great banded ball of ochre and cream wears a broad flat girdle of dust, lit from one side.',
    ],
    [
      'ball-of-dyed-wool',
      0,
      'A ball wound of yellow, madder and indigo wool turns slowly on a ground of unbleached cloth.',
    ],
    [
      'sickle-over-violet-hills',
      1,
      'A sickle of gold is all that is left of the sun, low over violet hills with mist between them.',
    ],
    [
      'needle-crown-in-white',
      1,
      'Needles of white light stand out from a thin bright ring, and the middle is black as a well.',
    ],
    [
      'shells-of-a-spent-star',
      1,
      'Three ragged shells of gas, sea green, rose and rust, drift out from a small dark heart.',
    ],
    [
      'corona-of-punched-holes',
      1,
      'A crescent and its corona are pricked in gold dots on black card, with two wide rings of them.',
    ],
  ],
  'star-plaster': [
    [
      'lattice-before-a-dust-sky',
      0,
      'A dark cut screen stands before an apricot sky, its stars full of light and its straps in shade.',
    ],
    [
      'flooded-star-court',
      0,
      'A stone floor of cut stars lies full of still water and mirrors a rose dusk to the horizon.',
    ],
    [
      'brass-door-by-one-lamp',
      0,
      'Broad bands of rubbed brass catch one lamp, with pale green enamel deep in the cells.',
    ],
    [
      'cobalt-kiln-tiles',
      0,
      'A wall of glazed tiles, cobalt and turquoise with ochre hearts, set flat between white lines.',
    ],
    [
      'sand-over-a-star-floor',
      0,
      'Pale dunes have crept over a carved floor, and stars of it show between them at noon.',
    ],
    [
      'white-folded-rosette',
      0,
      'One great rosette of white lies close up in soft light, its petals hardly darker than its ground.',
    ],
    [
      'bathhouse-roof-stars',
      1,
      'A dark vault is pierced with stars, and the day stands white and green in every one.',
    ],
    [
      'lapis-kiosk-ceiling',
      1,
      'Straight overhead a ceiling of lapis and gold turns slowly about a wide round of sky.',
    ],
    [
      'moss-in-a-roofless-hall',
      1,
      'Deep green moss has grown over the side of a grey vault and leaves a few carved flowers bare.',
    ],
    [
      'sea-drifter-shell',
      1,
      'From inside a shell of thin glass wires, round windows open on green water.',
    ],
  ],
  'star-wheel': [
    [
      'spiral-in-sepia-ink',
      0,
      'A spiral of stars is drawn from straight above in brown ink, dot by dot, on a cream plate.',
    ],
    [
      'thin-wheel-from-its-rim',
      0,
      'One thin blade of blue stars lies across an empty sky, with a small pale light at its middle.',
    ],
    [
      'rose-ring-with-no-heart',
      0,
      'A wide ring of soft stars, rose and old gold, goes round a middle that is quite dark.',
    ],
    [
      'foam-eddy-from-the-air',
      0,
      'White foam winds into the eye of a great eddy on green water, as a bird would see it.',
    ],
    [
      'brushed-wheel-of-straw',
      0,
      'Short dabs of straw gold and slate blue go round and round a pale sun, laid on with a brush.',
    ],
    [
      'tarn-with-the-sky-in-it',
      1,
      'Whole circles of starlight stand over a black tarn, and the still water closes them below.',
    ],
    [
      'peaks-in-washed-ink',
      1,
      'Fine rings of ink go round over snow peaks, washed in grey on a sheet of pale paper.',
    ],
    [
      'firs-under-a-green-veil',
      1,
      'A wood of firs stands black before a green sky, and long arcs come down from high overhead.',
    ],
    [
      'wind-combed-dusk',
      1,
      'The stars of a plum dusk are combed into long waving strokes over low hills and one bare tree.',
    ],
    [
      'cloud-sea-before-first-light',
      1,
      'Small stars stand over a sea of rose cloud, and one tree and a few peaks come up out of it.',
    ],
  ],
  'still-life': [
    [
      'chalky-jugs-on-a-shelf',
      0,
      'Unglazed jugs and bottles stand close in a row before a pale plaster wall.',
    ],
    [
      'cairn-in-a-still-tarn',
      0,
      'Flat stones are piled one on another in mirror-still water, with a small moon beside them.',
    ],
    [
      'jars-the-dune-gave-back',
      0,
      'Old clay jars stand sunk in rippled sand before a great low sun in copper air.',
    ],
    [
      'physic-bottles-in-the-sun',
      0,
      'Bottles of clear coloured glass stand about a white sill and stain it with their shadows.',
    ],
    [
      'plaster-town-at-noon',
      0,
      'Plain plaster blocks stand like a small town in hard sun, seen from a hill.',
    ],
    [
      'one-bubble-over-ink',
      0,
      'A great clear bubble rests on black water, with a few drops of glass round it.',
    ],
    [
      'quarry-blocks-in-ink',
      1,
      'Cut blocks of stone before a tall arch, put down in fine dots of brown ink on cream paper.',
    ],
    [
      'sloes-on-newsprint',
      1,
      'A few dark berries seen from above, each a swarm of blue and plum dots on grey paper.',
    ],
    [
      'woodcut-quay-by-night',
      1,
      'Bottles stand at the edge of black water under a moon, all cut in level lines of pale blue.',
    ],
    [
      'giant-of-the-dust-belt',
      1,
      'A huge dim globe rises over a plain of cold dust, with its small moons set down before it.',
    ],
  ],
  'strip-quilt': [
    [
      'allotments-from-a-kite',
      0,
      'Beds of beans, barley and bare earth lie cut by dark paths, seen from straight above.',
    ],
    [
      'hexagons-by-a-night-lamp',
      0,
      'A quilt of hexagons lies in the round warm light of one lamp, the rest of the room dark.',
    ],
    [
      'satin-triangles-on-a-cold-morning',
      0,
      'Great triangles of grey, blue and mauve satin meet in stars, plump and cool in white light.',
    ],
    [
      'indigo-mended-futon',
      0,
      'A worn indigo cover is mended all over in stepped white stitches and thrown in soft folds.',
    ],
    [
      'clay-tiles-in-a-larder',
      0,
      'Six-sided tiles of rose, ochre and grey clay lie in wide grey joints on a larder floor.',
    ],
    [
      'ramie-in-a-doorway',
      1,
      'A great cloth of sheer ramie scraps hangs close, the field and the sky seen faintly through it.',
    ],
    [
      'wash-day-over-the-wheat',
      1,
      'Quilt after quilt hangs along one long line over a wide gold field.',
    ],
    [
      'pinwheels-in-a-gale',
      1,
      'A bold quilt of turning triangles flies out from its line in a hard wind.',
    ],
    [
      'red-work-in-first-flakes',
      1,
      'A quilt of two cloths, madder red and white, hangs stiff over new snow as more comes down.',
    ],
    [
      'scraps-hung-out-by-moon',
      1,
      'Loose scraps of silk hang one by one in the air under a moon, with dark between them.',
    ],
  ],
  'strung-form': [
    [
      'eel-trap-on-the-strand',
      0,
      'A trap of dark withies lies on its side on pale wet sand, with the open sky behind it.',
    ],
    [
      'rosette-of-lit-threads',
      0,
      'Threads of soft light cross between two rings in the dark and draw a rose with an open middle.',
    ],
    [
      'bell-tent-of-dew',
      0,
      'A tent of threads hung all over with drops stands on open ground at a rosy daybreak.',
    ],
    [
      'silk-goblets-on-show',
      0,
      'Cups of sheer dyed silk stand on white drums in a row along a quiet grey wall.',
    ],
    [
      'rope-hourglass-at-sundown',
      0,
      'Thick ropes twist into an hourglass on a bare plain, seen from low down against a violet and peach sky.',
    ],
    [
      'night-loom-in-lamplight',
      1,
      'Two dark posts hold a crossing warp of fine threads that glow amber in an unlit room.',
    ],
    [
      'sheer-sails-at-low-water',
      1,
      'A row of sheer sails, blue above and sand below, leans on a bare sand flat under a wide sky.',
    ],
    [
      'ink-fan-on-fog',
      1,
      'A fan of black threads opens right across white fog, as if ruled with a pen.',
    ],
    [
      'cables-of-a-lost-bridge',
      1,
      'Great cables sweep up into green river fog from two leaning masts, seen from the water.',
    ],
    [
      'star-chart-on-a-frame',
      1,
      'Small bright beads hang on wires between two bars in the dark, like stars on an old chart.',
    ],
  ],
  'sun-halos': [
    [
      'ringed-sun-over-a-fjord',
      0,
      'Snow peaks stand round still water, and the ring of the low sun lies in it a second time.',
    ],
    [
      'washed-rings-on-white',
      0,
      'Thin rings of rust, teal and violet wash lie round a small red sun on white paper.',
    ],
    [
      'three-suns-over-rust-dunes',
      0,
      'Three ringed suns hang over bare rust dunes in an apricot sky, on no world of ours.',
    ],
    [
      'copperplate-sun-dogs',
      0,
      'An old plate of a winter sun and its false suns, cut in fine brown lines on cream paper.',
    ],
    [
      'ringed-sun-through-reeds',
      0,
      'Tall dry reeds stand black before a low gold sun in a tight ring, at the end of a still day.',
    ],
    [
      'soft-flakes-at-moonrise',
      1,
      'Large soft flakes sink past a ringed moon onto a wide snow field with black firs at its edge.',
    ],
    [
      'ringed-giant-over-a-tarn',
      1,
      'A huge clay coloured world hangs in its ring of light over dark peaks and the teal water below them.',
    ],
    [
      'barred-cloud-on-a-still-lake',
      1,
      'Long bars of cloud run past a ringed moon in the last rose light, and the lake carries them back.',
    ],
    [
      'pricked-moon-chart',
      1,
      'A moon and its rings set in fine cream dots on black, like light through a pricked card.',
    ],
    [
      'day-moon-between-firs',
      1,
      'A faint ringed moon stands in the white morning between tall firs washed in grey.',
    ],
  ],
  'sun-prints': [
    [
      'rust-bracken-on-blotter',
      0,
      'Broad fronds of bracken in rust, ochre and olive, laid to dry on a pale sheet of blotter.',
    ],
    [
      'moon-laid-behind-oats',
      0,
      'Oats and flower heads stand white against a great pale moon on a sheet of plum dye.',
    ],
    [
      'lone-frond-on-a-green-disc',
      0,
      'A single fern frond crosses a round coat of deep bottle green brushed on bare paper.',
    ],
    [
      'sprigged-madder-cotton',
      0,
      'Small white sprigs of fern and flower lie scattered over cotton dyed a warm madder red.',
    ],
    [
      'oats-on-torn-paper-hills',
      0,
      'Long hills of torn paper go back in paler and paler gold behind tall oats and flower heads.',
    ],
    [
      'chalked-ribbons-of-weed',
      1,
      'Only the edges and veins of kelp and forked weed, drawn thin and white on near black.',
    ],
    [
      'red-weeds-floated-on-paper',
      1,
      'Rose, wine and olive seaweeds, fine as hair, floated out flat on a clean white sheet.',
    ],
    [
      'kelp-print-left-in-rain',
      1,
      'A print of kelp left out wet: turquoise has run down the sheet and the weed sways in it.',
    ],
    [
      'weed-kept-in-a-sea-chart',
      1,
      'One forked weed, printed brown long ago on a sheet now creased, spotted and worn at the folds.',
    ],
    [
      'kelp-across-a-low-moon',
      1,
      'A blade of kelp and branching weeds sway in deep green over the pale round of a moon.',
    ],
  ],
  sunflower: [
    [
      'dark-dahlia-by-a-lamp',
      0,
      'A dahlia as dark as wine, all its petals laid over one another, lit by one lamp from the left.',
    ],
    [
      'coneflower-with-its-skirt-down',
      0,
      'A tall cone of burnt orange scales on pale paper, its rose petals hanging down all round it.',
    ],
    [
      'august-head-against-dusk',
      0,
      'A whole sunflower leans out of a deep blue dusk, its ray petals warm and its seeds brown.',
    ],
    [
      'dew-on-a-fallen-plum',
      0,
      'One dark plum set all over with clear drops, each with the pale morning caught in it.',
    ],
    [
      'lotus-pod-from-above',
      0,
      'A grey green lotus pod seen from above, a round dark seed at the bottom of each open cell.',
    ],
    [
      'ice-beads-up-a-shaft',
      1,
      'Rings of clear ice beads climb the inside of a narrow shaft toward a round of white daylight.',
    ],
    [
      'poppy-seed-in-a-china-bowl',
      1,
      'Blue black seeds turn in five arms round the inside of a wide white china bowl.',
    ],
    [
      'inside-a-magnolia',
      1,
      'Pale rose petals overlap all the way down into a flower, warm light caught at the bottom.',
    ],
    [
      'paper-wasps-old-comb',
      1,
      'Brown papery cells sweep round and away, some of them still holding a little amber light.',
    ],
    [
      'salmon-roe-in-a-dark-cup',
      1,
      'Clear orange roe lines the inside of a dark cup, a point of light in every egg.',
    ],
  ],
  table: [
    [
      'wood-block-lane',
      0,
      'A lane paved with sawn log ends runs off into the dark, wet under lamps and leaves.',
    ],
    [
      'five-cups-on-slate',
      0,
      'Five glazed cups stand far apart on a black veined slab, each lit by the tea in it.',
    ],
    [
      'drawing-room-noon',
      0,
      'Window light lies in six panes across a chevron floor of honey coloured oak.',
    ],
    [
      'painted-boat-boards',
      0,
      'Boards from old boats, their blue, red and cream paint flaking down to the bare wood.',
    ],
    [
      'picnic-cloth-under-a-lime',
      1,
      'A red and cream checked cloth runs away from you, coins of sun lying on it through leaves.',
    ],
    [
      'dye-soaking-into-linen',
      1,
      'Rust, ochre and sea blue soak outward through creased white linen wherever the piece sounds.',
    ],
    [
      'orchard-quilt',
      1,
      'A patchwork quilt in brick, mustard and slate blue spreads away over a wide bed.',
    ],
    [
      'unmade-silk-bed',
      1,
      'Wine red silk in narrow stripes lies thrown back, deep creased in the first window light.',
    ],
    [
      'moss-with-springs',
      1,
      'Five stone rimmed springs shine up out of deep rolling moss, as if seen from a low branch.',
    ],
    [
      'beads-on-indigo',
      1,
      'Glass beads are sewn in even rows on dark indigo felt, and the song lights them.',
    ],
  ],
  'thick-paint': [
    [
      'lavender-rows',
      0,
      'Rows of lavender run straight up to one point on the hill under a pale summer sky.',
    ],
    [
      'snowed-in-terraces',
      0,
      'Snow lies on the terraces of a hill, blue in every hollow, under a low white sky.',
    ],
    [
      'red-clay-peak',
      0,
      'A peak of red clay built of square dabs stands against a thin turquoise sky.',
    ],
    [
      'poplars-in-slant-rain',
      0,
      'A line of tall dark poplars stands in long slanting rain over wet grey green fields.',
    ],
    [
      'stubble-at-sundown',
      0,
      'Cut stubble glows in separate orange strokes on black, a huge sun going down behind.',
    ],
    [
      'moon-road-on-sand',
      1,
      'A moon and small stars in a rolling blue night, and the moon lays its road over the wet shore.',
    ],
    [
      'reeds-before-the-sun',
      1,
      'Dark upright reeds stand before grey water, and a red sun goes down on the far side of it.',
    ],
    [
      'spring-tide-gale',
      1,
      'Great slabs of slate and bottle green: the sea runs high up the shore and the sky turns over it.',
    ],
    [
      'pink-brine-lagoon',
      1,
      'A flat lagoon of rose pink brine lies under a mint sky, all in small square dabs.',
    ],
    [
      'ripe-barley-wall',
      1,
      'Ripe barley stands higher than your head, a strip of deep blue sky left at the top.',
    ],
  ],
  'thousand-cells': [
    [
      'lit-wing-over-a-reservoir',
      0,
      'A wing of silk cells, each lit from inside, hangs over black water that holds it too.',
    ],
    [
      'kite-pyramid-at-sunup',
      0,
      'A whole pyramid of little rust silk sails stands in front of a huge rising sun.',
    ],
    [
      'spars-drawn-in-ink',
      0,
      'Only the spars of the great kite, drawn fine and dark on cream paper, no silk on them.',
    ],
    [
      'torn-silk-in-the-hills',
      0,
      'A kite with half its silk blown away drifts over ranges of hills drowned in mist.',
    ],
    [
      'turning-coin-cloud',
      0,
      'Round gold and copper discs in ranks turn slowly and on and on in a deep green dark.',
    ],
    [
      'blossom-garland',
      1,
      'A garland of paper blossoms in rose, cream and leaf green bends over the flats in one arch.',
    ],
    [
      'paper-moons-on-a-lake',
      1,
      'A few white paper moons, lit from inside, rise on one thread from a lake at night.',
    ],
    [
      'plumed-line-at-dusk',
      1,
      'Close ranks of red and ochre kites, each in a collar of plumes, pass before a low sun.',
    ],
    [
      'four-corners-at-nightfall',
      1,
      'A handful of four cornered kites glows far apart over dark hills in the last blue light.',
    ],
    [
      'wheels-up-a-thread',
      1,
      'Discs in blue, rust and ochre turn like wheels as they climb a thread up a sheet of plain paper.',
    ],
  ],
  'three-inks': [
    [
      'anemones-on-black-stock',
      0,
      'Pale anemones stand in a narrow cup, printed in chalky inks on black paper.',
    ],
    [
      'picnic-seen-by-a-magpie',
      0,
      'A checked cloth from straight above, with plates, a melon and a plum laid out on it.',
    ],
    [
      'one-quince-in-indigo',
      0,
      'A single quince on a low table under a thin moon, with bare paper all around it.',
    ],
    [
      'uncut-seed-packets',
      0,
      'Nine little fruit labels on one sheet, each printed flat with its inks in another order.',
    ],
    [
      'cut-glass-at-sundown',
      0,
      'Faceted fruit and a faceted dish in coarse dots on paper rolled from rose to apricot.',
    ],
    [
      'gables-in-slanting-rain',
      1,
      'Rain slants in blue strokes over a harbour town of steep red and yellow gables.',
    ],
    [
      'peaks-in-a-cold-tarn',
      1,
      'Steep snow sided peaks stand twice, once in the air and once in still water.',
    ],
    [
      'sown-valley-from-the-ridge',
      1,
      'Fields of green, rust and straw run away in striped patches to a low sun.',
    ],
    [
      'harbour-light-alone',
      1,
      'A lighthouse on its rock, one huge low moon, and black still water under both.',
    ],
    [
      'rays-behind-the-headlands',
      1,
      'Broad rays fan from a low sun over the far hills, flat and bold as a travel bill.',
    ],
  ],
  'thrown-lines': [
    [
      'kelp-left-by-the-ebb',
      0,
      'Long rust and black green straps of weed lie in one tangled heap on damp sand.',
    ],
    [
      'whirled-brand-at-midsummer',
      0,
      'Sparks fly off a burning brand swung in a circle in the dark.',
    ],
    [
      'straw-on-a-trodden-yard',
      0,
      'Straight gold straws, and a few gone black, lie across one another on dusty earth.',
    ],
    [
      'one-long-flourish',
      0,
      'Strokes of black ink from a broad pen run together and loop across a wide pale sheet.',
    ],
    [
      'silks-over-a-hung-cloth',
      0,
      'Skeins of coloured silk run over the deep folds of a dark blue hanging.',
    ],
    [
      'skate-marks-at-first-light',
      1,
      'Rings and returns are cut fine into pale blue ice, seen low across the pond.',
    ],
    [
      'beetle-from-a-folded-sheet',
      1,
      'Wet ink folded in half and opened again has made a wide winged beetle.',
    ],
    [
      'dust-round-a-young-sun',
      1,
      'Rings of lit dust turn about one empty middle, seen from just above their plane.',
    ],
    [
      'ball-of-waxed-twine',
      1,
      'A ball wound round and round with pale twine stands in soft light on a bare table.',
    ],
    ['slip-trailed-on-red-clay', 1, 'Thick cream slip runs in wide rounds over a red clay dish.'],
  ],
  'torn-wall': [
    [
      'far-range-in-handmade-paper',
      0,
      'Torn sheets of blue and violet stand one behind another as hills under a peach sky.',
    ],
    [
      'letters-burnt-through',
      0,
      'A fire has eaten one round hole through a bundle of cream letters, sheet by sheet.',
    ],
    [
      'white-card-well',
      0,
      'Thick white card is cut away in rings, each lower than the last, in plain daylight.',
    ],
    [
      'sunset-through-blackout-paper',
      1,
      'Rips in black paper over a window let in the low sun and the last orange of the evening.',
    ],
    [
      'lichen-on-the-north-gable',
      1,
      'Grey and sulphur lichen spreads over an old limewashed wall and into its broken places.',
    ],
    [
      'fig-shade-on-limewash',
      1,
      'The moving shade of a fig tree lies over a warm white wall with one deep tear in it.',
    ],
    [
      'ticket-wall-under-the-lamp',
      0,
      'Hundreds of small pasted tickets hang ragged in the pool of one street lamp.',
    ],
    [
      'bark-of-an-old-birch',
      1,
      'White birch bark split across in long dark eyes, with tan and brown layers curling under it.',
    ],
    [
      'floes-over-black-water',
      1,
      'White ice has split into long floes, with blue edges and black water showing between.',
    ],
    [
      'cut-card-at-high-noon',
      0,
      'Great clean cut shapes of persimmon, teal and mustard card throw hard shadows.',
    ],
  ],
  'touching-circles': [
    [
      'bubbles-in-a-black-basin',
      0,
      'Great clear bubbles press together on black water, each with a window of light on its shoulder.',
    ],
    [
      'whorled-stone-moon',
      0,
      'A small pale moon grown all over with rings within rings turns slowly in the dark.',
    ],
    [
      'cobalt-plates-on-limewash',
      0,
      'Blue and white plates hang edge to edge on a bright limewashed wall.',
    ],
    [
      'pads-on-bottle-green',
      0,
      'Round pads lie rim to rim over dark green water, out into a grey evening mist.',
    ],
    [
      'stack-of-larch-butts',
      0,
      'The sawn ends of a timber stack, ring inside ring, thick butts and thin poles wedged together.',
    ],
    [
      'stitched-thread-ball',
      0,
      'A ball wound with thread and stitched all over in flowers, set down on pale linen.',
    ],
    [
      'jelly-discs-in-a-lens',
      1,
      'Clear discs with small clear discs in them glow in the round dark field of a lens.',
    ],
    [
      'pebbles-in-a-round-tray',
      1,
      'Smooth river pebbles, slate, bone and moss, fill a round tray, with grit in every gap.',
    ],
    [
      'cut-stones-on-ledges',
      1,
      'Cut stones of garnet, coral and pale sea green stand in rows on narrow ledges in the dark.',
    ],
    [
      'sink-pools-under-violet',
      1,
      'Round pools sunk in a pale crust go away to a violet horizon, as on another world.',
    ],
  ],
  'turning-rooms': [
    [
      'dune-in-the-mine-office',
      0,
      'A dune has blown into painted rooms long left, and stands against one wall after another.',
    ],
    [
      'round-gates-in-white-plaster',
      0,
      'Round gates stand one behind the other in bare white rooms, with only daylight in them.',
    ],
    [
      'ballroom-under-flood',
      0,
      'A long rose hall stands in still water at sundown, its doorways doubled in the floor.',
    ],
    [
      'doors-left-open-at-night',
      0,
      'A blue room by night, and through its open door a lamplit room lying on its side.',
    ],
    [
      'stage-flats-in-madder',
      0,
      'Painted frames of madder, ink and straw stand close behind each other, each tipped a little more.',
    ],
    [
      'cistern-courts-by-starlight',
      1,
      'Courts of heavy blocks hold black water under the stars, with a warm lamp in some of them.',
    ],
    [
      'paper-walls-lit-within',
      1,
      'Walls of paper on a dark lattice glow from behind, room after level room, under a night sky.',
    ],
    [
      'clay-steps-to-the-sky',
      1,
      'Red clay courts with a flight of steps against the wall, going up toward open evening air.',
    ],
    [
      'snow-in-a-roofless-barn',
      1,
      'Snow lies banked in a green room open to the sky, and stands on end in the rooms beyond.',
    ],
    [
      'mint-and-lilac-portholes',
      1,
      'Thin walls of mint, lilac and apricot, each with a round hole, turn away like a shell.',
    ],
  ],
  'upside-room': [
    [
      'fleet-on-a-ceiling-of-boards',
      0,
      'The room is turned over, so the sails stand upright on the wall and the floor boards hang above.',
    ],
    [
      'alps-in-an-empty-hall',
      0,
      'Snow peaks hang head down on the wall of a great bare hall, and stand upright in its wet floor.',
    ],
    [
      'moon-in-a-shut-parlour',
      0,
      'A full moon and a few lit windows from outside lie upside down in a small dark parlour.',
    ],
    [
      'city-lamps-over-a-wet-floor',
      0,
      'A city hangs head down with its windows lit, and stands up again in water on the floor.',
    ],
    [
      'plaster-globes-at-midday',
      0,
      'Plaster globes stand in a bright room, each carrying blue sky below and white cloud above.',
    ],
    [
      'pleated-loft-in-rose',
      1,
      'Pale cloth hangs in pleats all round a loft and takes the sky in folds of rose and sea green.',
    ],
    [
      'one-day-by-many-pinholes',
      0,
      'The day comes in by many small holes, and from each a little picture hangs in the dark room.',
    ],
    [
      'gold-poplars-in-a-barn',
      1,
      'Poplars in autumn gold hang head down round the end of an empty barn, above a blue floor.',
    ],
    [
      'green-sun-among-crates',
      1,
      'A day from some other world, violet land under a green sky, falls on crates and pale balls.',
    ],
    [
      'spring-tide-under-the-ridge',
      1,
      'Moonlit sea water stands on the boards of a great loft, with a path of light on it.',
    ],
  ],
  urchins: [
    [
      'pencil-spines-on-a-reef-flat',
      0,
      'Living urchins hold out thick blunt spines in clear shallow water, nets of light crossing them.',
    ],
    [
      'paper-lamps-on-a-black-beach',
      0,
      'On a black beach at night dozens of small shells are lit from within like paper lamps.',
    ],
    [
      'sand-dollars-on-plaster',
      0,
      'Flat bleached shells lie on white plaster, seen from straight above in an even light.',
    ],
    [
      'black-glaze-on-white',
      0,
      'One great shell in black glaze stands alone on a white floor, a window shining on every knob.',
    ],
    [
      'domes-under-the-dune',
      0,
      'Plum, clay and cream shells stand half buried in rippled sand, small ones dotted to the skyline.',
    ],
    [
      'gourds-at-the-roadside',
      0,
      'Smooth tall gourds of blue, plum, orange and moss green crowd the dust beside a road.',
    ],
    [
      'under-a-pierced-dome',
      1,
      'From inside, a dark dome is pierced by rows of round windows that run up to one white eye.',
    ],
    [
      'celadon-bowl-in-snow',
      1,
      'A broken celadon bowl stands in snow at noon, daylight coming through its seams in beads.',
    ],
    [
      'clay-lantern-by-night',
      1,
      'A lamp burns inside a tall pierced shell and throws its windows out over the dark ground.',
    ],
    [
      'drowned-violet-canopy',
      1,
      'A low violet canopy stands on the floor of a green lagoon, light falling through in spokes.',
    ],
  ],
  'wave-machine': [
    [
      'theatre-cut-from-card',
      0,
      'The whole stage, sea, clouds and arch, is bare white card with the footlights warming its foot.',
    ],
    [
      'hayfields-rolled-by-hand',
      0,
      'Fat slow hills of cut hay and clover turn under a wide morning sky of peach and blue.',
    ],
    [
      'red-silk-from-the-gallery',
      0,
      'From the top gallery the sea is red and plum silk heaped in a steep bank behind the lights.',
    ],
    [
      'barley-sugar-proscenium',
      0,
      'Sticks of barley sugar in amber, rose and lemon turn in close rows behind the candle shades.',
    ],
    [
      'tin-waves-under-a-great-moon',
      0,
      'The footlights are out: thin tin waves lie level under one enormous painted moon.',
    ],
    [
      'violet-blades-before-a-second-sun',
      0,
      'Violet and teal blades cut a level sea on some other world, a swollen sun behind them.',
    ],
    [
      'bolts-in-the-dye-loft',
      1,
      'Looking down from the beams on five bolts of dyed cloth lying side by side in daylight.',
    ],
    [
      'sawn-ends-at-first-light',
      1,
      'Great fat rollers of plum, sage and sand lie in a misty row, a rosy dawn behind their sawn ends.',
    ],
    [
      'rope-walk-in-the-snow',
      1,
      'By moonlight five tight grey ropes are twisted in the dark while torn paper snows down.',
    ],
    [
      'plaster-screws-at-noon',
      1,
      'Five white plaster screws with thin blades stand on a pale bench in plain morning light.',
    ],
  ],
  'white-fog': [
    [
      'pear-tree-before-thunder',
      0,
      'A great pear tree in white flower stands alone against a dark gold sky, letting petals go.',
    ],
    [
      'lit-window-below-the-firs',
      0,
      'Deep in a winter night one window burns in a snowed up hut beneath a wall of tall firs.',
    ],
    [
      'flood-meadow-at-sundown',
      0,
      'The meadow is under still water that holds a rose and amber sky as a flock goes over.',
    ],
    [
      'ploughland-under-far-peaks',
      0,
      'Clear autumn air: dark furrows run to a rust red tree and to mountains with the first snow.',
    ],
    [
      'rime-wind-on-the-wire',
      0,
      'Everything is white with rime and bent one way by the wind before a slate sky.',
    ],
    [
      'olive-rows-on-red-earth',
      1,
      'Silver green trees stand in rows on ploughed red earth, seen from a roof with bare hills behind.',
    ],
    [
      'ladder-against-the-sun',
      1,
      'One pruned tree with a ladder and a few apples, the sun just over its crown.',
    ],
    [
      'moonrise-over-a-drowned-orchard',
      1,
      'Pale orchard trees stand in black flood water under a full moon, each above its own image.',
    ],
    [
      'almond-rows-in-flower',
      1,
      'Almond trees in rose and white flower stand on green furrows under lilac hills, dropping petals.',
    ],
    [
      'red-boughs-under-a-green-sky',
      1,
      'Bare coral red trees lean in the wind of some other world, dark birds crossing its green sky.',
    ],
  ],
  'wood-print': [
    [
      'snow-on-the-ferry-pine',
      0,
      'A pine bough thick with snow close overhead, still plum grey water, one boat on its way across.',
    ],
    [
      'heaped-seas-at-sun-up',
      0,
      'A red sun half up behind ranks of indigo swells with white broken crests, and nobody out.',
    ],
    [
      'first-light-on-the-cone',
      0,
      'A single snow cone and its upside down twin in a lake as pale as the paper, and a rose sky.',
    ],
    [
      'blossom-on-a-round-fan',
      0,
      'A round print on bare paper: boughs in full blossom, petals over jade water, a square sail below.',
    ],
    [
      'stone-pillars-knife-cut',
      0,
      'Tall pillars of rock over a river, a boat among them, all one black block cut with white lines.',
    ],
    [
      'herring-sails-coming-home',
      0,
      'Buff and rust sails ride one behind another over long pale swells edged with white.',
    ],
    [
      'hamlet-at-lamp-hour',
      1,
      'Snow coming down at nightfall on a hillside of small houses, every window lit.',
    ],
    [
      'millet-steps-at-harvest',
      1,
      'A hill of ripe narrow terraces in gold and rust against an enormous vermilion sun.',
    ],
    [
      'one-umbrella-hung-in-silk',
      1,
      'A narrow hanging print of hard rain in blues only, mounted on dark patterned cloth.',
    ],
    [
      'broad-paddies-in-jade-drizzle',
      1,
      'A few wide flooded fields at the foot of the sheet and rock towers fading into thin green rain.',
    ],
  ],
  'worn-floor': [
    [
      'sand-in-the-ballroom',
      0,
      'Fine rippled sand has drifted over a chequered floor, and a few black and white squares still show.',
    ],
    [
      'lattice-on-turquoise-glaze',
      0,
      'Small glazed tiles of turquoise, cobalt and chalk from straight above, barred by a lattice of sun.',
    ],
    [
      'ballroom-before-anyone-comes',
      0,
      'Black and white squares run away from a low eye into the dark, one gleam of a far window on them.',
    ],
    [
      'kitchen-brick-in-herringbone',
      0,
      'Worn red and ochre bricks in herringbone with moss in the joints and late sun lying across them.',
    ],
    [
      'cobbled-ramp-to-the-harbour',
      0,
      'Split blue grey cobbles stand up with a little moss between them, and late sun lies across the ramp.',
    ],
    [
      'threshing-circle-at-noon',
      0,
      'A pale round of wedge stones laid in rings, seen from straight above in even white light.',
    ],
    [
      'stepping-slabs-in-deep-moss',
      1,
      'A few broad broken slabs lie far apart in thick green moss, with yellow leaves come down on them.',
    ],
    [
      'snow-on-the-well-yard',
      1,
      'New snow over rings of stone round a middle, melted through in places where water shows the sky.',
    ],
    [
      'moon-between-the-flags',
      1,
      'Night in a paved yard: the rain left in the stones holds a full moon, stars and bare twigs.',
    ],
    [
      'sunken-court-in-clear-water',
      1,
      'Small blue and white tiles waver under clear water, with nets of light moving over them.',
    ],
  ],
  'worn-passage': [
    [
      'chalk-cutting-after-rain',
      0,
      'Broad white walls of chalk stand back from a floor of still water that holds the whole sky.',
    ],
    [
      'star-strip-from-the-crack',
      0,
      'Black walls lean over you under a strip of stars, and thin seams of ore glow along them.',
    ],
    [
      'red-bridges-over-the-wash',
      0,
      'Arches of rust red rock cross a wide dry wash, one behind another, under a cream sky.',
    ],
    [
      'verdigris-ledges-and-a-pool',
      0,
      'A stepped gorge of green and tan ledges goes down to a pool that doubles every shelf of it.',
    ],
    [
      'rib-rock-in-sea-fog',
      0,
      'Upright grey ribs of rock stand one behind another up into white fog, over a track of round stones.',
    ],
    [
      'rose-salt-pillars',
      1,
      'A low hall of rose salt held up by waisted pillars, with a floor of drifted white grains.',
    ],
    [
      'crevasse-with-snow-in-it',
      1,
      'Blue ice opens overhead to a slit of white day, and the snow that fell through lies along the floor.',
    ],
    [
      'lode-seams-in-a-flooded-adit',
      1,
      'In a drowned mine thin seams of metal glow blue green and dull gold, and the black water repeats them.',
    ],
    [
      'under-the-whale-ribs',
      1,
      'A long straight hall of bone pale ribs, arch after arch over a smooth pale floor to the light.',
    ],
    [
      'honey-shelves-and-a-stream',
      1,
      'A wide hall of honey gold rock cut into shelves, and a brown stream winding out of the light.',
    ],
  ],
}
