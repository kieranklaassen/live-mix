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
  'alley-sun': [
    [
      'where-the-gorge-lets-the-sun-in',
      0,
      'Slanting sun falls through dust between two folded walls of rust red stone onto a floor of sand.',
    ],
    [
      'reed-roof-over-the-spice-lane',
      0,
      'Gold light comes down through a roof of reeds in thin bars and lies in stripes along a broad lane.',
    ],
    [
      'whitewashed-arches-at-noon',
      0,
      'White arches stand one behind another down a lane with blue shutters, full of pale noon haze.',
    ],
    [
      'signs-lit-down-a-rain-wet-lane',
      0,
      'A broad lane on a wet blue night, bulbs burning under the signs, the moon lying on the stones.',
    ],
    [
      'cloths-from-the-upper-window',
      0,
      'Seen from a high window, dyed cloths hang over a broad lane with the sun slanting between them.',
    ],
    [
      'wisteria-down-the-wash-steps',
      1,
      'Ivy covers both walls and lilac blossom hangs over a stair that climbs into soft white light.',
    ],
    [
      'snow-coming-down-on-the-long-stair',
      1,
      'Flakes drift past a steep grey stair between tall houses, every tread lipped with snow.',
    ],
    [
      'under-the-room-that-bridges-the-stair',
      1,
      'A room with one window bridges a brick stair, and a cat sits below in the copper evening sun.',
    ],
    [
      'steps-cut-in-blue-ice',
      1,
      'A stair hewn down into a crevasse, its folded walls pale blue, white daylight at the top.',
    ],
    [
      'a-cat-awake-by-moonlight',
      1,
      'A broad stair on a clear blue night, one step and one cat in the moon, lamps in the windows.',
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
  'ball-stairs': [
    [
      'chalk-marbles-let-go-at-noon',
      0,
      'Seen from high up, a slide of chalk white marbles finds its way down bare white steps.',
    ],
    [
      'oranges-loose-above-the-harbour',
      0,
      'A hillside stair under a late warm sky, and a whole harvest of oranges rolling down it.',
    ],
    [
      'paper-moons-coming-down-to-bed',
      0,
      'In a house at night great paper globes, lit from inside, come slowly down the stair together.',
    ],
    [
      'sea-cobbles-on-the-tower-stair',
      0,
      'Round grey sea stones lie heaped down an open tower stair, one pale ball on top, the sea beyond.',
    ],
    [
      'plums-under-one-stair-lamp',
      0,
      'Dark plums and a few yellow ones lie in the circle of a single lamp on a black green stair.',
    ],
    [
      'floating-lights-on-the-roof-bath',
      1,
      'A bath on a roof at night, brimming with small blue and amber lights, under a sky of stars.',
    ],
    [
      'sugared-almonds-by-the-kilo',
      1,
      'From high above, a white bath full of tiny sweets in bands of pink, cream, mint and lilac.',
    ],
    [
      'boulders-in-the-drained-bath',
      1,
      'A rose plaster bathing hall at sundown, its empty basin half filled with great worn stones.',
    ],
    [
      'cherries-for-the-night-watchman',
      1,
      'In a shut black hall one lamp falls on a bath of dark red cherries and the ring among them.',
    ],
    [
      'trout-roe-seen-large',
      1,
      'So near that each egg fills a hand: round amber and coral beads, each lit from inside.',
    ],
  ],
  'balloon-morning': [
    [
      'frontispiece-of-a-first-flight',
      0,
      'An engraving from below: striped balloons over a low misty valley, all of it lines of ink on cream.',
    ],
    [
      'silk-lamps-waiting-for-the-sun',
      0,
      'Before dawn a crowd of plain silk balloons glows gold and rose over dark blue mist, under stars.',
    ],
    [
      'red-canopy-among-rock-needles',
      0,
      'A great red and cream balloon drifts among needles of stone that stand out of rows of orange dunes.',
    ],
    [
      'two-balloons-and-a-glass-sea',
      0,
      'Nothing but pale blue air and flat water, and two white balloons with bands of blue upon them.',
    ],
    [
      'checked-silk-over-white-fields',
      0,
      'Black and cream checked balloons hang over a winter plain where the poplars stand pale with frost.',
    ],
    [
      'round-shadow-among-the-skerries',
      1,
      'Straight down on striped fields broken into coves and islets, in shoals of turquoise and deep blue.',
    ],
    [
      'long-shadow-on-the-great-dunes',
      1,
      'Seen from a basket low over a desert, rippled apricot dunes with dark lee sides, and one long shadow.',
    ],
    [
      'ring-of-colour-on-the-cloud-top',
      1,
      'White cloud closes over snowy fields, and on it lies a round shadow in a pale ring of colours.',
    ],
    [
      'russet-terraces-from-the-basket',
      1,
      'High over autumn hills, terraces of rust, gold and wine curl round every slope by a thread of river.',
    ],
    [
      'a-fleet-by-night-over-farms',
      1,
      'In the dark the glow of many balloons lies on blue fields and a lake, with lamps lit in the farmyards.',
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
  'beaded-rings': [
    [
      'last-lamp-in-the-bead-shop',
      0,
      'Strings of jet, coral and bone sweep close past in the dark, and low lamplight glows behind them.',
    ],
    [
      'orb-web-strung-with-dew',
      0,
      'Fine threads wheel round one open eye, set with far apart drops, in the white of a fogged morning.',
    ],
    [
      'spice-seller-counts-her-strings',
      0,
      'Saffron, paprika and indigo lentils of clay crowd the strings round a small bright doorway.',
    ],
    [
      'great-floats-on-a-mooring-rope',
      0,
      'Huge sea green and navy glass balls ring a small bright eye, seen from above in blue water haze.',
    ],
    [
      'loose-planets-round-a-knot',
      0,
      'A ring of plum and rose spheres stands round a small far tangle of strings in violet dusk.',
    ],
    [
      'jet-necklace-on-a-starched-cloth',
      1,
      'Black and bone beads that touch lie as one great knotted ring on clean white, a few coral among them.',
    ],
    [
      'green-glaze-on-a-clay-wall',
      1,
      'One thick hank of sea green beads leans across a terracotta wall in late sun.',
    ],
    [
      'coral-wreath-on-a-blue-shutter',
      1,
      'Flat strings of coral and cream lentils wind about an open eye before painted blue boards.',
    ],
    [
      'sleet-along-the-larch-twigs',
      1,
      'Bare dark threads fan out from the left with a few cold drops on each, under a slate sky.',
    ],
    [
      'chalk-worlds-strung-on-one-cord',
      1,
      'Enormous chalk white and coal black spheres crowd one cord in the dark and dwindle to small ones.',
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
  'beam-shadows': [
    [
      'noon-on-the-whitewashed-side',
      0,
      'A white wall stands square ahead, and every long peg in it throws one slanting line of shade.',
    ],
    [
      'rains-have-reached-the-barn',
      0,
      'From far over still brown water, a long low barn and its ladder hang upside down in an amber evening.',
    ],
    [
      'porter-asleep-with-the-lamp-lit',
      0,
      'By moonlight the long wall is blue and nearly bare, and only its small door is warm inside.',
    ],
    [
      'snow-on-the-painted-keep',
      0,
      'Snow caps a red keep and lies at its foot, above a band of painted teeth and rows of crowded beams.',
    ],
    [
      'pegs-for-climbing-plasterers',
      0,
      'Close under streaked ochre plaster, thick pale beam ends throw leaning shadows in raking light.',
    ],
    [
      'seed-pods-on-a-sulphur-plain',
      1,
      'Slim capped towers stand far apart on yellow ground under an olive sky on some other world.',
    ],
    [
      'moon-poured-between-the-stores',
      1,
      'The lane is under black water at night, and pale painted jars and straw hats double in it.',
    ],
    [
      'chalk-jars-in-wide-straw-brims',
      1,
      'White jars painted high with black teeth stand about a bright yard, half in the shade of wide straw.',
    ],
    [
      'roofs-from-the-drying-terrace',
      1,
      'Thatched cones fill the view from above in a red sunset, dark lanes of shade between them.',
    ],
    [
      'barley-kept-dry-till-thaw',
      1,
      'A small huddle of stores under white caps stands alone in a wide field of moonlit snow.',
    ],
  ],
  'beetle-drawer': [
    [
      'fog-drinkers-on-a-dune',
      0,
      'Broad dark beetles stand every which way over pale rippled sand, the far ones lost in early mist.',
    ],
    [
      'owl-moths-by-the-desk-lamp',
      0,
      'Moths with eyes on their wings lie pinned on green paper, warm lamplight going off into dark.',
    ],
    [
      'speckled-eggs-on-white-card',
      0,
      'Blue, buff and olive eggs, each one freckled its own way, lie in straight rows on bright card.',
    ],
    [
      'leaf-beetles-come-out-to-feed',
      0,
      'Scores of small bright beetles wander in every direction over the ribs of one big green leaf.',
    ],
    [
      'jewel-beetles-on-blue-black',
      0,
      'Row on straight row of small jewel beetles shines rose, gold and sea green out of a dark drawer.',
    ],
    [
      'seed-pearls-along-a-blue-back',
      1,
      'A deep blue wing case set all over with round pearls, some of them lit, the window far behind.',
    ],
    [
      'copper-scales-among-leaves',
      1,
      'Scale over copper scale runs down a long narrow back, with leaves in soft green light behind.',
    ],
    [
      'one-rose-shell-in-a-white-room',
      1,
      'A single smooth back goes from coral to rose, a line of hairs down its middle, in a pale quiet room.',
    ],
    [
      'an-ember-kept-in-every-bowl',
      1,
      'So near that a few wide pits fill the view, each a dark polished bowl with fire at the bottom.',
    ],
    [
      'ribbed-back-before-the-dunes',
      1,
      'A long ribbed back, copper and violet black, crosses the foreground; behind it a dune and a white sun.',
    ],
  ],
  'before-curtain': [
    [
      'apricot-light-along-the-boards',
      0,
      'The hem stands knee high and a flood of apricot and rose light runs out from under it over the boards.',
    ],
    [
      'swept-aside-for-the-evening',
      0,
      'Bone coloured velvet is swept to both sides and lets in a burning evening sky with a tree going by.',
    ],
    [
      'stage-moons-in-mint-gauze',
      0,
      'A thin green gauze hangs in soft pleats and lamps stand in it like moons, over a floor of water.',
    ],
    [
      'lying-under-the-striped-drop',
      0,
      'From low down, black and gold stripes run up together past one round light into the dark.',
    ],
    [
      'snow-blown-in-under-the-hem',
      0,
      'White cloth hangs over a white drift, flakes coming down slowly and blue light under the fringe.',
    ],
    [
      'sail-past-the-blue-silk',
      1,
      'Midnight blue silk frames a moonlit sea of still water, one small sail crossing under a pale moon.',
    ],
    [
      'deckchair-stripes-drawn-up-high',
      1,
      'Red and cream striped swags are drawn right up, a wide clear sky and a boat on flat water below.',
    ],
    [
      'one-great-fold-of-cream',
      1,
      'Very near, a few huge swags of cream silk fill the picture fold under fold, gold cord between them.',
    ],
    [
      'rose-tent-in-the-firs',
      1,
      'Rose red drapes fall to the snow on both sides and at their end stands a small dark forest at dusk.',
    ],
    [
      'lilac-veils-let-down',
      1,
      'Sheer lilac veils sweep down in wide loops, one through another, before snow and a line of firs.',
    ],
  ],
  'behind-the-fall': [
    [
      'smugglers-mouth-at-sundown',
      0,
      'Out of a round hole in the rock, through thin water, a low red sun lays its road on the sea.',
    ],
    [
      'organ-pipes-in-hard-frost',
      0,
      'Hung basalt columns, rimed white, frame a pale blue fall and a valley under snow.',
    ],
    [
      'cedars-through-falling-water',
      0,
      'The water fills the view, and behind it ranks of tall trunks go off into green lit air.',
    ],
    [
      'lamp-left-on-across-the-gorge',
      0,
      'From deep in the dark hollow one small lit window shows through the blue night water.',
    ],
    [
      'dry-month-in-a-red-alcove',
      0,
      'A few last threads of water fall past a rust red alcove and a valley gone to straw and copper.',
    ],
    [
      'five-threads-off-the-table-mountain',
      1,
      'One long level wall of rust red rock stands out of cream cloud, and five thin falls hang down it.',
    ],
    [
      'islands-that-rain-on-the-cloud',
      1,
      'Five torn islands hang in a peach evening and let their water down into the cloud below.',
    ],
    [
      'rowing-lake-under-the-crags',
      1,
      'The falls come down to a still green lake that holds the cliffs upside down, every pine sharp.',
    ],
    [
      'hut-keeper-in-deep-snow',
      1,
      'Close by, a hut with a lit window sits in blue snow under columns of basalt and frozen falls.',
    ],
    [
      'peaks-above-a-paper-sea',
      1,
      'Grey heads of rock with their falls stand out of a wide blank mist, a hut dark below them.',
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
  'between-tides': [
    [
      'lit-gables-above-the-slipway',
      0,
      'At night the houses stand along both walls with their windows lit, boats and lamps doubled below.',
    ],
    [
      'keels-on-silver-ribs',
      0,
      'The harbour is dry and three boats lean on ribbed mud that a low sun ahead turns to beaten silver.',
    ],
    [
      'hulls-held-in-the-floes',
      0,
      'Plates of ice have closed round snowy boats on an open sea, rose light on them and blue between.',
    ],
    [
      'skiffs-on-green-glass',
      0,
      'No wall and no quay: small boats float on clear green shallows under blue sky, an islet far out.',
    ],
    [
      'one-bow-out-of-the-sea-fret',
      0,
      'Before sunrise the fog has taken the harbour walls; one near boat stands out of it on milky water.',
    ],
    [
      'stumps-of-the-burnt-pier',
      1,
      'Black broken posts are all that stand in a rose and apricot sea, the evening sun behind them.',
    ],
    [
      'icicles-under-the-planking',
      1,
      'Icicles hang from every beam and the posts stand sleeved in frost among slow plates of ice.',
    ],
    [
      'stakes-in-milk-water',
      1,
      'A few thin leaning stakes stand in water as pale as the sky, their doubles under them.',
    ],
    [
      'noon-bars-on-coral-sand',
      1,
      'Beside the pier at noon, hard bars of sun lie on the white sand in its shade and a clear sea begins.',
    ],
    [
      'pier-lamps-after-the-last-tram',
      1,
      'From the beach beside it, the pier goes out into a blue night with a row of small lamps on its rail.',
    ],
  ],
  'big-sleepers': [
    [
      'glow-worms-in-a-winter-coat',
      0,
      'A moonlit night, and all over a huge dark sleeping back small lights breathe in the long hair.',
    ],
    [
      'badger-as-wide-as-the-parish',
      0,
      'So close it fills the view: a shaggy flank in broad stripes of black, cream and rust, in plain day.',
    ],
    [
      'asleep-above-the-weather',
      0,
      'Far off in a rose dawn a smooth round back rises out of heaped cloud, with a thread of smoke beside.',
    ],
    [
      'snowed-in-from-ear-to-tail',
      0,
      'Nearly no colour: white hair under a lead grey sky, every lock drawn fine, the croft half lost.',
    ],
    [
      'old-one-under-the-sand-wind',
      0,
      'Orange dunes have blown over a lean red sleeper till only its knobbed spine and shoulder stand out.',
    ],
    [
      'sound-asleep-through-the-gale',
      1,
      'A striped black and white giant lies in a steep dark sea under storm cloud, the light going round.',
    ],
    [
      'freckles-of-light-in-the-bay',
      1,
      'From a gull at night: a sleek curled body on black water, freckled all along with blue and rose light.',
    ],
    [
      'moored-in-a-field-of-cloud',
      1,
      'At a golden dawn a lean sleeper with a knobbed spine lies on level cloud, its small boats afloat there too.',
    ],
    [
      'clay-giant-in-the-dune-harbour',
      1,
      'The sea has gone to sand, and a banded clay red giant lies round a dry harbour and its stranded boats.',
    ],
    [
      'windows-under-a-snowy-back',
      1,
      'Snow lies all along a huge curled back by blue moonlight, with a row of lit windows in its lee.',
    ],
  ],
  'bitten-bark': [
    [
      'bark-moon-over-the-reeds',
      0,
      'A round of bark bitten in rings hangs on a thread before a lake at sunset, reeds along the shore.',
    ],
    [
      'red-bark-with-a-lamp-behind',
      0,
      'In a dark room a lamp stands close behind deep red bark, and every bite is a point of warm light.',
    ],
    [
      'bitten-scraps-strung-in-a-window',
      0,
      'A score of small squares of bark hang in strings against a white frosted window, each with its figure.',
    ],
    [
      'pale-sheet-before-a-summer-wood',
      0,
      'A great sheet of cream coloured bark, half folded, stands before a wood in full green leaf.',
    ],
    [
      'one-star-kept-till-morning',
      0,
      'A single scrap with one bitten star stands small on the sill of a window full of moonlit trees.',
    ],
    [
      'scraps-adrift-on-evening-water',
      1,
      'Seen from above, small bitten squares float apart on dark rippled water, rose in the last sun.',
    ],
    [
      'round-lid-left-on-the-moss',
      1,
      'A round of red bark, ringed with leaves and stars, lies in late sun and twig shadow on deep moss.',
    ],
    [
      'unrolled-on-the-cabin-boards',
      1,
      'A broad white strip, still half in its roll, lies on old dark boards at the edge of a pool of lamplight.',
    ],
    [
      'dark-bark-in-moonlit-snow',
      1,
      'Dark bark lies steeply down across blue moonlit snow to its roll, with a few flakes coming down.',
    ],
    [
      'close-along-a-sundown-strip',
      1,
      'Near enough to see each hollow: dark red bark in the last low sun on violet snow, branch shadows over it.',
    ],
  ],
  'black-crowd': [
    [
      'up-early-to-see-the-sun',
      0,
      'A black crowd on a rose shore watches a huge red sun come out of the sea behind small sails.',
    ],
    [
      'lit-gables-round-the-rink',
      0,
      'Dark gabled houses with warm windows stand over blue night ice where a few people skate.',
    ],
    [
      'everybody-out-on-the-ice',
      0,
      'Seen from a height, people in coloured coats are strewn in twos and threes over pale ice.',
    ],
    [
      'way-left-open-to-the-moon',
      0,
      'Two black crowds leave an empty path between them down to a night sea and a half risen moon.',
    ],
    [
      'lost-the-others-in-the-fog',
      0,
      'A few tall hats stand close by on bare paper, and all that lay behind them thins to lines.',
    ],
    [
      'under-the-side-of-the-liner',
      1,
      'A black wall of hull pricked with lit portholes towers over tall hats on a night quay.',
    ],
    [
      'last-smoke-of-the-mail-boat',
      1,
      'The ferry is a speck far out on green lined water, and a few people are left on the quay.',
    ],
    [
      'white-plumes-in-a-cloudburst',
      1,
      'Close among pale faces, plumes and muffs in a black crowd, with the rain slanting over them all.',
    ],
    [
      'two-crowds-and-the-red-quay',
      1,
      'From high up, people wait on both sides and leave the red stones of the quay bare between them.',
    ],
    [
      'chalk-figures-on-a-slate-sea',
      1,
      'As if chalked on slate, pale figures stand about a dark quay with a ship in thin white lines beyond.',
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
  'blanket-country': [
    [
      'quilt-of-a-hundred-counties',
      0,
      'From high up in morning light, hill after hill sewn from patches: checks, stripes, spots and triangles.',
    ],
    [
      'lit-windows-in-the-felt-hills',
      0,
      'On a blue night hills of felt with small firs hold a few lit houses, a big moon over far folds.',
    ],
    [
      'oatmeal-jersey-downs',
      0,
      'A bare country knitted all in thick undyed wool, with no house and no water, a moon over far folds.',
    ],
    [
      'satin-fjord-before-supper',
      0,
      'A wide satin water bends between steep plum and rust hills, under an apricot sky with a low moon.',
    ],
    [
      'a-week-of-snow-on-the-eiderdown',
      0,
      'White felt hills in plain daylight, dark green firs all over them and one wooden house.',
    ],
    [
      'half-past-six-on-striped-ticking',
      1,
      'Close among high pillows in blue and cream ticking, the first pale sun on them and nobody up.',
    ],
    [
      'lamplit-fleet-on-dark-linen',
      1,
      'Under moon and stars three toy boats carry lanterns over ridges of dark blue linen.',
    ],
    [
      'patch-cushions-in-the-sun-room',
      1,
      'A heap of cushions pieced from ochre, teal, rose and brick, in warm flat afternoon light.',
    ],
    [
      'pillow-peaks-and-a-far-moon',
      1,
      'White pillows stand as peaks from far off, firs on their passes, a great moon in a night of stars.',
    ],
    [
      'heap-of-jerseys-by-the-stove',
      1,
      'Thick knitted cushions in brick, wine, mustard and grey piled near, in the red light of a stove.',
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
  'blue-column': [
    [
      'lamps-let-down-at-noon',
      0,
      'In pale noon water, round chambers hang on long lines at many depths with their lamps pointed down.',
    ],
    [
      'great-jelly-in-a-rose-dusk',
      0,
      'A jelly far larger than the chamber that lights it trails its threads through wine coloured water.',
    ],
    [
      'ribs-laid-out-in-the-deep',
      0,
      'A lamp finds the pale ribs of something long dead, laid out in a row in the black water.',
    ],
    [
      'smokers-on-the-rift-floor',
      0,
      'Tall chimneys on the bottom breathe rust red smoke, and a small chamber points its lamp down among them.',
    ],
    [
      'round-window-in-peat-water',
      0,
      'Close by, one round chamber hangs in clear brown water and points its lamp straight down.',
    ],
    [
      'blue-eye-in-the-white-flats',
      1,
      'From high above, one round hole looks up out of white sand that the sun has netted over.',
    ],
    [
      'stack-left-in-a-ring',
      1,
      'A round stack of rose sand stands in the middle of a hole, and sand falls off both its rims.',
    ],
    [
      'holes-in-a-moonlit-seabed',
      1,
      'Cold grey sand is holed in half a dozen places, each hole black inside under a dim moon.',
    ],
    [
      'eelgrass-round-the-old-well',
      1,
      'A dark meadow of eelgrass leans in green light round the bare lip of a deep round well.',
    ],
    [
      'lit-from-under-black-sand',
      1,
      'Amber light wells up out of a wide hole in black sand, and a diver hangs dark against it.',
    ],
  ],
  'bone-nave': [
    [
      'bleached-ribs-above-the-tideline',
      0,
      'White bones stand wide in pale sand at noon, their thin shadows lying to one side.',
    ],
    [
      'lamp-on-the-brine-lake',
      0,
      'An amber lamp lights tall ribs that stand in black water and hang upside down in it.',
    ],
    [
      'red-weed-in-the-green-lagoon',
      0,
      'Low wide ribs overgrown with red and orange weed, a bright green lagoon all round them.',
    ],
    [
      'ribs-under-a-winter-moon',
      0,
      'Snow lies blue round narrow dark ribs, flakes going by, a few stars over the far hills.',
    ],
    [
      'toppled-ribs-on-red-clay',
      0,
      'A broken row of old bones stands askew on red ground, the sky violet above and peach below.',
    ],
    [
      'fish-bones-by-one-candle',
      0,
      'Needle thin ribs close together, lit warm along one side and lost in black beyond.',
    ],
    [
      'lamps-in-the-flooded-gallery',
      1,
      'Night in a flooded hall: lamps along the foot of a blue wall, white bones over still water.',
    ],
    [
      'ivy-in-the-roofless-museum',
      1,
      'The roof has gone and the walls are broken; green bones stand on poles in evening sun.',
    ],
    [
      'rib-shadows-on-ochre-plaster',
      1,
      'Close to a sunlit ochre wall, where the shadow of every rib lies soft and long.',
    ],
    [
      'black-whale-on-a-polished-floor',
      1,
      'A black skeleton hangs in a rose walled hall, a visitor and a bench doubled in the floor.',
    ],
  ],
  'book-organ': [
    [
      'lace-bridge-over-green-water',
      0,
      'The card stands by itself in one high arch, and the sun through it lies in bright tiles on green water.',
    ],
    [
      'red-pleats-standing-in-sand',
      0,
      'A brick red card stands in upright pleats across rippled sand, low sun lighting every other side.',
    ],
    [
      'snow-melting-off-the-red-bench',
      0,
      'Snow is melting off an oxblood bench, and the brass keys play a slate blue card in clear cold light.',
    ],
    [
      'keys-from-above-by-lantern',
      0,
      'From high above at night, a lantern picks out the gold of the keys and card on an oxblood bench.',
    ],
    [
      'red-arch-over-new-snow',
      0,
      'A brick red card stands in one arch over smooth white snow, its slots of sun lying in a grey shadow.',
    ],
    [
      'stone-columns-at-low-tide',
      1,
      'Six sided columns of blue black stone stand in broken ranks before a gold low sun, their feet in water.',
    ],
    [
      'harbour-town-of-a-hundred-spires',
      1,
      'On a blue night narrow towers crowd a harbour under a moon, windows lit and lying in the water.',
    ],
    [
      'red-pillars-in-drifted-sand',
      1,
      'A few great red pillars, cut off almost level, stand in drifts of sand against a wide warm sky.',
    ],
    [
      'powder-blue-front-at-noon',
      1,
      'The whole front from square before it, powder blue and cream in clear white light, drums at rest.',
    ],
    [
      'oxblood-front-with-the-bulbs-lit',
      1,
      'Close along an oxblood front after dark, warm bulbs on the arch light a hundred fine gold pipes.',
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
  'brushed-sand': [
    [
      'bare-alder-on-a-mud-islet',
      0,
      'A leafless tree stands on its islet in water swept nearly clear, under a pale apricot dawn.',
    ],
    [
      'eel-hut-with-one-lamp',
      0,
      'A hut on stilts with a lit window and a landing, over black water under a small round moon.',
    ],
    [
      'heron-bowed-over-meltwater',
      0,
      'Close to the bird, its neck let down, black fine sand on a cold blue glass and a bare shore.',
    ],
    [
      'peaks-behind-an-empty-mere',
      0,
      'Far mountains under a wide moon, and a bare sheet of water with nobody standing in it.',
    ],
    [
      'rushes-in-a-brick-red-downpour',
      0,
      'Tall thick rushes fill the glass, and coarse red sand is struck through by slanting rain.',
    ],
    [
      'late-snow-on-the-bird-bank',
      0,
      'Fingertip snow comes down past a heron with its neck high, and the bank lies white.',
    ],
    [
      'light-tower-just-before-sunrise',
      1,
      'A banded tower on its rock throws its last beams past a rose dawn, with a few houses along the quay.',
    ],
    [
      'whitewashed-hill-above-an-empty-harbour',
      1,
      'A whole hill of bare white houses, long torn clouds in a dark blue sky, and no sail on the water.',
    ],
    [
      'night-steamer-with-every-cabin-lit',
      1,
      'A long steamer with rows of lit portholes lies under its own smoke on an ember glass.',
    ],
    [
      'snow-up-the-harbour-stairs',
      1,
      'Snow falls on a hill of thick white roofs and on the dark stairs, with a bright gap over the sea.',
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
  'button-sea': [
    [
      'harvest-moon-half-sunk',
      0,
      'A huge amber button of a moon sinks behind a plum sea, and the felt boat crosses before it.',
    ],
    [
      'milk-calm-before-breakfast',
      0,
      'Rows of bleached bone buttons lie flat and pale under a moon and a wide sky of cream felt.',
    ],
    [
      'strung-for-the-midway',
      0,
      'Dyed buttons hang on threads from the top of a violet night over a low dark sea.',
    ],
    [
      'greatcoats-in-a-gale',
      0,
      'Great pewter buttons heave in a black swell that fills nearly all of the cloth.',
    ],
    [
      'saxifrage-on-a-wet-slope',
      0,
      'Petalled buttons crowd a hillside to the top of the picture, butter, rose, cream and gentian blue.',
    ],
    [
      'caramels-out-of-the-jar',
      1,
      'Square toffee, cream and treacle pieces tumble over a worn white table in a low honey sun.',
    ],
    [
      'iced-biscuits-in-rounds',
      1,
      'Petal biscuits in rose, lemon and white icing lie ring within ring on a mint green woven cloth.',
    ],
    [
      'dance-floor-after-carnival',
      1,
      'Hundreds of small dyed discs seen from straight above, left lying on a brown floor under one lamp.',
    ],
    [
      'brass-for-the-bandsmen',
      1,
      'Big polished brass buttons roll in a thin trail over old dark boards under one lamp.',
    ],
    [
      'spilt-under-the-skylight',
      1,
      'From high up a small tin has burst over dark blue boards, its white buttons gone everywhere.',
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
  'car-wash': [
    [
      'shop-panes-soaped-for-the-night',
      0,
      'The panes of a closed shop are daubed with pale soap, and street lamps shine blurred behind them.',
    ],
    [
      'sheets-going-round-in-the-drum',
      0,
      'Behind a round steel door, swirls of mint, white and coral suds lean over and turn slowly.',
    ],
    [
      'great-bubbles-over-a-peach-bay',
      0,
      'Strings of coral and lilac bubbles slide down the glass before a low sun on pale water.',
    ],
    [
      'snowed-in-behind-the-wheel',
      0,
      'The whole windscreen is packed with fine white froth, and grey daylight only just comes through.',
    ],
    [
      'blue-felts-closing-on-the-lamps',
      0,
      'Half the glass is under heavy blue felts, and violet and orange foam is dragged along their edge.',
    ],
    [
      'cab-rank-in-a-downpour',
      1,
      'Rain stands all over the windscreen and every lamp of the street is a soft round light in it.',
    ],
    [
      'porthole-off-a-cold-headland',
      1,
      'Through a dark bolted rim, spray on the glass and a pale sun low over grey green water.',
    ],
    [
      'palm-house-panes-at-seven',
      1,
      'Fine dew beads a wall of green framed panes, with pale morning light coming in from outside.',
    ],
    [
      'last-few-drops-at-dusk',
      1,
      'A few long drops are driven up dry glass while a wide door stands open on an amber sky.',
    ],
    [
      'harbour-sun-held-in-drops',
      1,
      'Great clear drops stand on the glass, each with a bright rim, before a low sun and blue water.',
    ],
  ],
  'card-hills': [
    [
      'long-swell-in-white-card',
      0,
      'White card rolls by in long stepped ridges, a slow sea of paper in the blue of early morning.',
    ],
    [
      'cinder-cone-rusted-at-the-rim',
      0,
      'On a pale table rings of charcoal sheet climb, going rust red, to a rim with one small house, then a crater.',
    ],
    [
      'green-to-brick-by-the-sheet',
      0,
      'A survey model seen from above, dyed by its height from river green through ochre to brick red.',
    ],
    [
      'lamp-inside-the-round-hill',
      0,
      'In a dark room a round hill of card is lit from within, every cut edge a thin line of gold.',
    ],
    [
      'brown-board-under-the-copse',
      0,
      'Thick brown board climbs in a few heavy steps into a wood of dried flowers, low red sun on their cuts.',
    ],
    [
      'melt-pools-in-pale-lime',
      1,
      'Many round pools of clear ice blue lie between hillocks of pale wood in a high white noon.',
    ],
    [
      'straight-down-into-amber',
      1,
      'From right above, sheets of walnut step down like rings of a tree into a well of glowing amber.',
    ],
    [
      'lit-river-through-black-board',
      1,
      'A river winds away through a dark gorge of sheets whose edges shine in teal and rose from inside.',
    ],
    [
      'islet-in-a-dyed-lagoon',
      1,
      'A small stepped island stands in a lagoon of deep blue and mint, its shores dyed coral and cream.',
    ],
    [
      'evening-window-on-the-long-lake',
      1,
      'The last light lays a peach window in panes on a long clear lake, dark steps of wood down its shores.',
    ],
  ],
  'cast-net': [
    [
      'thrown-among-the-stone-towers',
      0,
      'Steep towers of grey rock stand in morning mist, and a wide ring of net hangs open before them.',
    ],
    [
      'ring-laid-on-lotus-water',
      0,
      'From straight above, a round net opens beside a slim boat on dark water crowded with green pads.',
    ],
    [
      'down-through-the-green-light',
      0,
      'Under the water, a bell of net sinks on its line through long rays, and fish turn away below it.',
    ],
    [
      'fleet-out-before-a-red-sun',
      0,
      'Many small boats on red morning water, all throwing, with one great ring of mesh across the sun.',
    ],
    [
      'bell-of-mesh-by-moonlight',
      0,
      'Very near, a bell of net hangs before the moon over blue black water strewn with dark pads.',
    ],
    [
      'poled-cloths-under-a-squall',
      1,
      'Taut square nets on bent poles stand along a slate grey shore while a storm comes over.',
    ],
    [
      'heron-waiting-in-the-sedge',
      1,
      'Tall sedge and round pads fill the shallows at gold evening, with one net high beyond them.',
    ],
    [
      'square-cloths-over-jade-shallows',
      1,
      'Seen from a height, square nets lie spread like kites over pale jade water with light on it.',
    ],
    [
      'lifted-past-the-perch',
      1,
      'Under brown evening water, a great square net on its bent poles comes up round a few slow fish.',
    ],
    [
      'violet-crags-behind-a-lifted-net',
      1,
      'At dusk violet crags rise straight from still water behind a great net just lifted and dripping.',
    ],
  ],
  'chair-ride': [
    [
      'straight-up-the-striped-mast',
      0,
      'Looking straight up the mast at noon, the painted crown is a wheel and the chains its long spokes.',
    ],
    [
      'seats-taken-by-the-snow',
      0,
      'A red and cream ride with only a chair here and there turns in thick falling snow above white roofs.',
    ],
    [
      'flying-level-into-the-sunset',
      0,
      'High up beside the ride at sundown, slatted chairs go by at eye level against an apricot sky.',
    ],
    [
      'black-and-gold-above-the-roofs',
      0,
      'At night a black and gold crown turns over a town, rows of small windows lit along the bottom.',
    ],
    [
      'hill-fair-before-the-hail',
      0,
      'Grey storm light on the ride and on sharp snowy peaks, the flags and the long chains all blown about.',
    ],
    [
      'two-rides-joined-at-the-waterline',
      1,
      'The meadow lies under still violet water and the lit ride stands on its own image, root to root.',
    ],
    [
      'three-rides-on-the-heath-road',
      1,
      'In green black night three lit rides stand one behind another by a muddy track with puddles.',
    ],
    [
      'red-bulbs-near-the-tents',
      1,
      'Close by, red lamps and chairs flung out flat make one wide burning hoop over black tents.',
    ],
    [
      'tested-at-dawn-in-ski-country',
      1,
      'A pale pink morning on deep snow and high peaks, the little ride lit with no one there yet.',
    ],
    [
      'cold-lamps-before-the-tenements',
      1,
      'Close by, ice white bulbs throw a cold light over wet ground and along a row of lit town houses.',
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
  colony: [
    [
      'moonlit-ring-round-a-frozen-pool',
      0,
      'The crowd stands in one wide ring about a dark pool of ice, on blue snow under a small moon.',
    ],
    [
      'raft-of-birds-on-ink-water',
      0,
      'A small crowd rides a raft of ice through open black water, with pale floes drifting about it.',
    ],
    [
      'grey-chicks-face-to-the-wind',
      0,
      'Downy grey chicks with white cheeks stand big and near on the snow, their long shadows beside them.',
    ],
    [
      'four-columns-over-blue-glass-ice',
      0,
      'Seen from high above, long winding columns of birds cross a floor of cracked turquoise ice.',
    ],
    [
      'rookery-below-the-black-peaks',
      0,
      'A crowd of gold throated birds on snow and bare stones, under dark jagged mountains and a clear sky.',
    ],
    [
      'last-walkers-home-at-sundown',
      0,
      'A few birds walk in over rosy snow, each with a long violet shadow, and a low sun hangs by the berg.',
    ],
    [
      'scarlet-wheel-above-a-tar-lake',
      1,
      'Scarlet birds fly round in one slow ring over black green water threaded with white crust.',
    ],
    [
      'arrowheads-over-cracked-salt',
      1,
      'White birds pass in arrowheads above a dry pan of rose salt broken into great pale polygons.',
    ],
    [
      'egrets-over-the-reed-islets',
      1,
      'White birds fly and wade among round islets of dark green reeds, each with a straw yellow rim.',
    ],
    [
      'white-birds-over-a-moonlit-lake',
      1,
      'White birds cross from right to left above blue shallows and pale salt lines, their shadows sharp in moonlight.',
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
  'coral-spawn': [
    [
      'antler-thicket-at-midday',
      0,
      'Tall branching corals stand apart in bright turquoise water, cream beads rising among them.',
    ],
    [
      'brain-corals-by-hand-lamp',
      0,
      'A lone lamp warms a heap of great round corals in black water, orange beads waiting in the grooves.',
    ],
    [
      'glass-eggs-in-pale-water',
      0,
      'Great clear eggs, each with its dark seed, drift up through water the colour of milk.',
    ],
    [
      'spawn-smoke-from-tall-spires',
      0,
      'Spawn streams like smoke from tall coral towers in deep green surging water.',
    ],
    [
      'under-the-roof-of-a-red-tide',
      0,
      'Close beneath the surface in wine dark water, cream and red beads rising past dark branches.',
    ],
    [
      'cold-light-seen-from-the-mast',
      1,
      'Looking down at night on black water where cold blue light lies in slow curling bands.',
    ],
    [
      'limestone-towers-in-a-green-bloom',
      1,
      'Tall rocks stand in a pale noon sea and bright green beads wind between them in ribbons.',
    ],
    [
      'rose-thread-on-milk-water',
      1,
      'Looking down on still pale water, where a narrow road of rose beads turns and goes.',
    ],
    [
      'amber-roe-before-the-dark',
      1,
      'Large amber eggs float on red slicks in an open violet sea, the last pink light behind them.',
    ],
    [
      'crimson-roads-to-the-sea-stacks',
      1,
      'Straight roads of red beads run in toward tall dark rocks and a burning evening.',
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
  'dew-web': [
    [
      'gate-with-a-wheel-in-every-gap',
      0,
      'A dark field gate against a rose sunrise, and in each of its gaps a whole web hung with drops.',
    ],
    [
      'every-thread-furred-with-frost',
      0,
      'A whole wheel seen square on, each thread of it thick and white with frost against grey blue air.',
    ],
    [
      'strung-beads-in-a-night-wood',
      0,
      'Between black trunks in moonlight, rings of small glass beads glow garnet, gold, sea green and slate.',
    ],
    [
      'torn-sail-in-a-green-copse',
      0,
      'A torn wheel turned far aside, half its threads gone, the sun in its middle and green trunks soft behind.',
    ],
    [
      'heavy-drops-across-an-orange-sun',
      0,
      'Very close, heavy drops hang in loops round a low orange sun, the morning upside down in each.',
    ],
    [
      'gorse-out-in-a-bright-sea-mist',
      1,
      'The gorse is out in yellow all over the slope in bright mist, with one wheel hung before the sun.',
    ],
    [
      'moor-gone-white-overnight',
      1,
      'A level moor of hoar frost lies in cold blue fog, with one small web hung before a white sun.',
    ],
    [
      'pinewood-floor-in-moonlight',
      1,
      'Straight black trunks stand in blue mist before the moon, and white webs shine low between them.',
    ],
    [
      'wheels-all-over-the-red-sky',
      1,
      'Dark wheels hang at every height from tall dry stems across a whole red and orange sunrise.',
    ],
    [
      'ling-in-flower-by-a-big-moon',
      1,
      'Purple heather runs down to the right under a large pale moon, and webs lie over it in dozens.',
    ],
  ],
  'domino-run': [
    [
      'grey-stones-on-a-snow-plain',
      0,
      'Great grey stones stand and fall in a ring on open snow, bare hills far behind them.',
    ],
    [
      'lacquer-tiles-on-black-water',
      0,
      'Red and gold tiles stand in a coil on still dark water with their likeness under them.',
    ],
    [
      'indigo-meander-from-the-ceiling',
      0,
      'Seen from straight above, a line of blue and bone slabs folds back and forth on a white floor.',
    ],
    [
      'ragged-slates-at-moonrise',
      0,
      'Uneven slates in rows by moonlight, bare hills behind and dark ground all round.',
    ],
    [
      'red-planks-growing-in-the-desert',
      0,
      'Thin tall planks, small in front and greater inward, throw long shade on orange sand.',
    ],
    [
      'whitewashed-stair-above-the-sea',
      1,
      'A steep pale wall climbs past a bright blue sea, yellow and blue slabs along its top.',
    ],
    [
      'planks-before-the-far-ridges',
      1,
      'Tall thin planks, each longer than the last, on a level wall before ridge on ridge of haze.',
    ],
    [
      'snow-lane-under-the-wall',
      1,
      'Snow by night on a stepped wall and the lawns below, a lane running off to bare trees and hills.',
    ],
    [
      'maple-week-on-the-brick-wall',
      1,
      'Orange trees behind a red brick wall where slabs of every height lean in warm light.',
    ],
    [
      'great-blocks-against-the-clouds',
      1,
      'From down on the ground, squat blocks of teal, brick and cream tilt along a wall under a wide sky.',
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
  'dove-tower': [
    [
      'moon-through-the-fallen-wall',
      0,
      'The far side of a dark tower has come down, and a full moon and stars stand in the gap.',
    ],
    [
      'white-doves-in-every-arch',
      0,
      'A whitewashed wall curving away in the sun, with a white dove sitting in nearly every arch.',
    ],
    [
      'rainwater-in-an-ivied-silo',
      0,
      'Still water has filled the floor of an overgrown round hall and holds the light from above.',
    ],
    [
      'one-hole-in-the-red-beehive',
      0,
      'A red clay vault drawn in to one small hole, whose beam falls on alcoves big enough to sleep in.',
    ],
    [
      'rime-on-the-open-loft',
      0,
      'Every ledge of a roofless tower furred with frost, under a wide disc of pale winter sky.',
    ],
    [
      'alone-on-the-flooded-melons',
      1,
      'A single tower stands in still water at sundown with its own picture hanging beneath it.',
    ],
    [
      'cone-town-with-its-lamps-in',
      1,
      'A crowd of tapering mud towers at night, a small warm light in every hole.',
    ],
    [
      'snow-on-the-threshing-plain',
      1,
      'From a kite over white furrows, broad red towers stand about under a grey winter sky.',
    ],
    [
      'stumps-in-the-blown-sand',
      1,
      'Broken red towers worn down to their shoulders among rippled dunes, under a long hazy sky.',
    ],
    [
      'low-in-the-yellow-flowers',
      1,
      'Low among vines in leaf and bloom, a lime white tower in late sun and a great wheel of birds.',
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
  'drowned-columns': [
    [
      'brick-tank-below-the-pump-house',
      0,
      'Square brick piers in a straight avenue, a low red vault, and one lamp coming up the rust water.',
    ],
    [
      'pillars-of-a-town-the-sea-took',
      0,
      'Nothing is left but columns in a flat sea at dawn, peach low down and blue above, and a small boat.',
    ],
    [
      'moonlight-under-the-harbour-arches',
      0,
      'Thin square posts stand in moonlit water under low vaults, and a boat with a cold lamp slips by.',
    ],
    [
      'boat-left-dry-in-the-cistern',
      0,
      'The water has gone; sand has blown in between fat piers, and the boat sits on it with its lamp lit.',
    ],
    [
      'milk-fog-in-the-lower-hall',
      0,
      'Pale fog has come in over the water; the columns are grey strokes, and one lamp is a warm blur.',
    ],
    [
      'lily-tank-from-the-gallery',
      1,
      'From a balcony near the capitals: round leaves and lit flowers float between the feet of columns.',
    ],
    [
      'snow-where-the-roof-used-to-be',
      1,
      'Rose light at dawn on smooth snow, columns that hold up nothing, and one tree still in leaf on its stones.',
    ],
    [
      'sea-baths-in-white-marble',
      1,
      'Clear turquoise water in a straight white hall, with noon standing on an island at its end.',
    ],
    [
      'red-arches-still-up-at-sundown',
      1,
      'A few arches stand on red columns against an ember sky, with a lone tree on the stones between.',
    ],
    [
      'stone-reeds-in-honey-light',
      1,
      'A very tall hall on posts as thin as reeds, with one leaning beam of light standing on the tree.',
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
  'dust-wall': [
    [
      'snow-squall-at-the-windbreak',
      0,
      'A white wall of blown snow stands right across the fields, and a bent row of trees waits before it.',
    ],
    [
      'poles-between-two-red-storms',
      0,
      'Crimson storms tower left and right, and poles file between them through water that holds the evening.',
    ],
    [
      'an-hour-off-by-moonlight',
      0,
      'Far down a cold blue plain the wall is no more than a low bank, and two small lamps hurry from it.',
    ],
    [
      'plough-land-rising-off-the-wheat',
      0,
      'Soot dark soil boils up right across the sky over bright young wheat, and a white van runs from it.',
    ],
    [
      'spore-front-on-a-lilac-world',
      0,
      'Smooth violet billows roll along a whole horizon under a pale mint and grey sky, doubled in still water.',
    ],
    [
      'one-ash-in-flour-white-wind',
      1,
      'A single bare tree leans in thick pale air, and behind it the sun is only a faint disc.',
    ],
    [
      'ridges-under-a-smoked-moon',
      1,
      'A dim moon over slate ridges cut one behind another, and one wind-bent tree on the nearest.',
    ],
    [
      'whirlwinds-walking-the-stock-pond',
      1,
      'Four tall grey green funnels of dust sway over flat water, and each one stands on its own likeness.',
    ],
    [
      'grit-in-the-pump-house-hinges',
      1,
      'Close by a gate and a high tank, streaks of sand drive past in rust red light.',
    ],
    [
      'peach-light-on-the-flooded-paddock',
      1,
      'Floodwater stands up to a far gate, and mauve and peach ridges and a broad sun lie doubled in it.',
    ],
  ],
  'dyers-bank': [
    [
      'madder-bolts-bleaching-on-snow',
      0,
      'Long reds and yellows laid out on a white bank, seen from a hill above a cold river.',
    ],
    [
      'silks-rinsing-in-the-shallows',
      0,
      'The river has come up over the stones and every length of silk swims in the current.',
    ],
    [
      'lengths-that-kept-the-daylight',
      0,
      'Night on a black mud flat, where blue and white cloths lift in the wind and shine by themselves.',
    ],
    [
      'spotted-lengths-down-the-meadow',
      0,
      'Narrow cloths printed with spots, bars and lozenges run side by side straight down the grass.',
    ],
    [
      'wide-sails-let-up-at-dusk',
      0,
      'Broad red and amber cloths rear off the brown mud in a pink evening and throw long shadows.',
    ],
    [
      'ochre-pools-from-a-kite',
      1,
      'Pools of red and yellow earth with wandering rims, seen flat from far above in soft light.',
    ],
    [
      'paint-pots-set-out-in-rows',
      1,
      'Small pots all of one size stand in straight rows before a blue wall at noon.',
    ],
    [
      'dye-that-shines-by-night',
      1,
      'In a black yard each great vat holds a pool of coloured light that brightens as it sounds.',
    ],
    ['snow-on-every-rim', 1, 'White rings on white paving, and in each ring a deep still blue.'],
    [
      'roof-edge-over-the-last-sun',
      1,
      'Low across huge earthen vats brimming with rust and gold, all but a bar of them in shadow.',
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
  'endless-shelves': [
    [
      'sweet-jars-round-a-white-well',
      0,
      'Coral, yellow and green jars stand all round a bright five-sided well, gallery under gallery.',
    ],
    [
      'water-risen-in-the-stair',
      0,
      'A deep well of books at night has filled with still blue water that holds every lamp twice.',
    ],
    [
      'scroll-pit-in-red-clay',
      0,
      'A wide clay pit lined with rolled scrolls, a warm haze lying where its floor should be.',
    ],
    [
      'record-hall-gone-to-leaf',
      0,
      'Green leaves have grown over the galleries of an old store, and pale mist fills the drop.',
    ],
    [
      'red-lamps-down-a-bare-drop',
      0,
      'Five strings of red lamps fall away past black, nearly empty shelves to a point with no floor.',
    ],
    [
      'lit-jars-over-black-water',
      1,
      'Jars of amber, jade and rose light line a dark flooded aisle and shine again in the water.',
    ],
    [
      'frosted-creeper-in-an-empty-hall',
      1,
      'White frosted creeper hangs over the bare shelves of a long hall and drifts across its floor.',
    ],
    [
      'map-rolls-seen-from-a-ladder',
      1,
      'From high on a ladder, two walls packed with rolled maps run off in honey coloured light.',
    ],
    [
      'vellum-canyon-by-moonlight',
      1,
      'A narrow aisle of great pale volumes in blue night light, its far door a bright pin.',
    ],
    [
      'rust-leaves-in-the-reading-lane',
      1,
      'A creeper gone rust and gold hangs over both walls of books, a warm door of light far off.',
    ],
  ],
  'eye-crater': [
    [
      'long-pool-under-a-lid-of-ice',
      0,
      'A long narrow pool lies under a cracked pale lid, and snow rests on every rope of its walls.',
    ],
    [
      'smelter-lake-after-dark',
      0,
      'A lake of drifting fire seen from overhead lights the inner wall of a charred black crater.',
    ],
    [
      'rice-steps-round-a-star-pool',
      0,
      'From overhead, level wet fields go up in rings about a dark pool with five bays.',
    ],
    [
      'agave-with-a-drop-in-its-heart',
      0,
      'Great green leaves with gold tips lie over one another in rows about one small dark drop of water.',
    ],
    [
      'brimful-well-of-ink',
      0,
      'Low by the edge of a flooded pool at night, nearly all of it black water with one grey light.',
    ],
    [
      'roots-running-out-to-red-dusk',
      1,
      'Fat smooth roots spread down a warm slope from the black pool, in the last red light.',
    ],
    [
      'sponge-wall-round-a-dark-hole',
      1,
      'Land the colour of shell, eaten into deep hollows, comes down on all sides to a round hole of dark water.',
    ],
    [
      'turquoise-steps-below-a-milky-spring',
      1,
      'Pale curved rims of stone hold level sheets of turquoise water, step below step from a milky pool.',
    ],
    [
      'ember-flower-with-black-petals',
      1,
      'Charred petals open in rows about a heart of fire, seen whole from high above at night.',
    ],
    [
      'iced-over-crater-in-full-moonlight',
      1,
      'A wide round lid of cracked blue ice, and smooth fat roots of rock run off from it deep in snow.',
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
  'false-journey': [
    [
      'porthole-on-the-sawn-waves',
      0,
      'Through a round cabin window, sails on a painted sea and wooden waves rocking on their belt.',
    ],
    [
      'window-seat-past-red-tables',
      0,
      'Close at the open window, flat topped red hills, palms and cactus roll by at sundown.',
    ],
    [
      'night-compartment-by-paper-moon',
      0,
      'Far back in a lamplit seat, a small window on a painted moon and one lit hut after another.',
    ],
    [
      'scissored-hills-in-plum-and-mustard',
      0,
      'Every hill, tree and hut is cut from plain coloured paper, and the carriage is too.',
    ],
    [
      'white-lake-lost-in-the-mist',
      0,
      'At the window a pale canvas of ice and bare birches can just be made out through fog.',
    ],
    [
      'harbour-wound-on-rollers',
      1,
      'From the roof beams, belts of sea and sawn surf run away beside a canvas full of sails.',
    ],
    [
      'cactus-belt-from-the-floorboards',
      1,
      'Eye at the boards of the hall in a red evening, a desert of cloth and cactus coming round its drums.',
    ],
    [
      'footlights-when-the-hall-is-shut',
      1,
      'Night through the glass roof, and only the low lamps under the scenery are still burning.',
    ],
    [
      'cloth-left-half-painted',
      1,
      'A linen canvas with only a thin wash of peaks, water and yellow birches, beside bare board drums.',
    ],
    [
      'teal-tissue-alps-on-a-roller',
      1,
      'Close by a great turning cloth of cut paper: teal peaks, a white lake and mustard fields.',
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
  fizz: [
    [
      'cordials-along-the-garden-bench',
      0,
      'A row of tall glasses, each of another colour, and their shadows all run into one net of light.',
    ],
    [
      'gold-bubbles-before-one-lamp',
      0,
      'Close on a slim glass in the dark, lit from behind, its chains of bubbles climbing like seed pearls.',
    ],
    [
      'sloes-under-the-string-of-lamps',
      0,
      'A wide low glass of dark berries on a blue night table, with lamps hung in the trees.',
    ],
    [
      'blood-orange-on-a-checked-cloth',
      0,
      'A squat red drink on blue checks, with a flat bright sea beyond the table.',
    ],
    [
      'amber-light-spilt-over-the-boards',
      0,
      'The foot of a glass of tea with lime, its long violet shadow full of amber threads of light.',
    ],
    [
      'cherries-against-an-open-sky',
      1,
      'Straight up through clear water, a ring of pale sky crowded with round red fruit.',
    ],
    [
      'pearls-let-go-in-the-dark',
      1,
      'In near darkness small lit beads stream inward, past floating pearls, to one dim round of light.',
    ],
    [
      'ruby-rings-in-cut-crystal',
      1,
      'Seen from within, lozenges of cut glass wind red and gold round a small bright mouth.',
    ],
    [
      'far-daylight-up-a-blue-bottle',
      1,
      'A deep narrow well of blue, with a coin of daylight far off at the end of it.',
    ],
    [
      'cut-citrus-crowding-the-rim',
      1,
      'Great wheels of orange, lime and lemon lie overhead in soft white daylight.',
    ],
  ],
  'flip-discs': [
    [
      'red-board-standing-in-the-snow',
      0,
      'A long red board with white plates stands on two legs in open snow, and one traveller waits under it.',
    ],
    [
      'ferry-hall-ankle-deep-in-tide',
      0,
      'A flooded hall at blue night, and its wide lamp-lit board lies doubled in the still water on the floor.',
    ],
    [
      'brass-leaves-up-a-lift-shaft',
      0,
      'A tall tower of slim brass plates hangs in a grey stone hall, and low sun comes in by tall narrow windows.',
    ],
    [
      'bath-house-before-anyone-comes',
      0,
      'A pale hall with broad square panes and a mint board of big shutters, seen from far back over the tiles.',
    ],
    [
      'signal-mast-on-a-violet-plain',
      0,
      'Under a small moon a lone tower of dim plates stands on bare ground, with one tiny watcher beside it.',
    ],
    [
      'coins-under-the-arcade-roof',
      1,
      'Overhead a whole ceiling of gold plates hangs and turns, and evening windows glow along its far edge.',
    ],
    [
      'tea-bowls-drying-in-trays',
      1,
      'Straight down on rows of wide green lids and pale ones, each tipped a little on its own pin.',
    ],
    [
      'dark-quay-beside-a-wall-of-scales',
      1,
      'A wall of black and blue plates runs away beside us on a wet night, with round lamps far out of focus.',
    ],
    [
      'pinecone-hillside-at-sunup',
      1,
      'Oval copper plates lie in close rows like scales up a slope, and the sun comes over dark hills behind.',
    ],
    [
      'enamel-tiles-of-a-river-delta',
      1,
      'From high over a board of countless small square shutters, red islands drift through pale blue water.',
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
  'flung-iron': [
    [
      'iron-thrown-into-the-walnut-tree',
      0,
      'At dusk on wet ground a bare walnut tree throws back fans of gold beads, and the puddles shine with them.',
    ],
    [
      'silver-pouring-over-the-round-gate',
      0,
      'White metal breaks on a ring of cut stone and streams down past a round opening with the moon in it.',
    ],
    [
      'rust-inked-on-a-snow-noon',
      0,
      'At white noon the long grey wall is bare, and the thrown iron is drawn on the air in strokes of rust.',
    ],
    [
      'fort-by-itself-on-the-red-plain',
      0,
      'Far across bare red ground one small fire is thrown at a fort, and the dusk behind it is bigger than both.',
    ],
    [
      'verdigris-beads-off-the-battlement',
      0,
      'Close under the battlement copper bursts into round beads of jade, coral and cream that shower down the wall.',
    ],
    [
      'fire-leaking-into-a-sea-cave',
      1,
      'Threads of fire drip between teeth of rock in a flooded cave, and the water underneath gives them all back.',
    ],
    [
      'burning-cloud-over-the-saltmarsh',
      1,
      'A long cloud lit from within rains slanting fire on wide open water, with low hills and a red sun beyond.',
    ],
    [
      'white-metal-sleet-in-the-yard',
      1,
      'A gale blows the dripping metal flat across a snowed yard, all silver and blue under an icy moon.',
    ],
    [
      'straw-rain-over-grey-hills',
      1,
      'Long drops the colour of straw slant down a pale morning sky onto grey hills along the bottom edge.',
    ],
    [
      'pink-drops-through-the-willow',
      1,
      'Close under a green roof of willow, round drops of rose and cream sink slowly past the hanging boughs.',
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
  'glass-brick': [
    [
      'fern-house-seen-from-the-baths',
      0,
      'Broad dark leaves stand before a wide wall of great blocks, full of lawn green and noon light.',
    ],
    [
      'ice-white-drum-in-the-wash-house',
      0,
      'A round white drum of small milky blocks stands in snow light, with an enamel basin and a folded towel.',
    ],
    [
      'bottle-ends-over-warm-water',
      0,
      'Row over row of round lenses hold a low orange evening, and all of it wavers again in the pool below.',
    ],
    [
      'gemstone-drum-in-blue-hours',
      0,
      'A tight round drum of great faceted blocks stands in a dark room, and blue and violet light breaks in every point.',
    ],
    [
      'pillar-of-boiled-sweets',
      0,
      'One stout round pillar of red, amber and green blocks stands by itself in still dark water.',
    ],
    [
      'footbridge-inside-the-lido-at-dawn',
      1,
      'A level dark gallery crosses a wall of rose, peach and cloud blue panes, and water lies still under it.',
    ],
    [
      'foundry-town-through-round-panes',
      1,
      'A stair climbs to the right before rows of great round lenses, each one full of furnace red and gold.',
    ],
    [
      'sleeping-block-behind-beads-of-glass',
      1,
      'Nothing but a round wall of countless small panes, with late teal, plum and gold windows strung through it.',
    ],
    [
      'night-lilies-in-the-winter-garden',
      1,
      'Long leaves wait in the dark before a green wall of cut blocks, where a few far lamps are broken small.',
    ],
    [
      'stair-inside-a-paper-lantern',
      1,
      'Black steps and one thin rail cross a soft milk-white wall that glows like paper with a light behind it.',
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
  'grain-yard': [
    [
      'dyers-powders-from-above',
      0,
      'Fine pigment lies petalled on a full roof seen from above: madder, weld, woad, saffron, chalk.',
    ],
    [
      'apricots-on-limewash',
      0,
      'Two great round mats of drying fruit, orange and plum, on a bare white roof at noon.',
    ],
    [
      'rice-rafts-after-moonrise',
      0,
      'Pale round rafts of rice lie on a flooded tank that holds the last grey light of the sky.',
    ],
    [
      'seaweed-frames-on-red-earth',
      0,
      'Square frames of dark weed stand in rows on brick red ground, every furrow drawn straight.',
    ],
    [
      'peppers-at-the-hour-of-smoke',
      0,
      'From low on the roof the mats run away to a red evening, hot peppers and plums in long shade.',
    ],
    [
      'threshing-hill-above-the-haze',
      1,
      'One high arc of grain thrown against a wide pale morning, the hills behind it thin as paper.',
    ],
    [
      'one-shaft-in-the-shut-barn',
      1,
      'A thin gold fall of seed crosses a single shaft of light in a barn that is otherwise black.',
    ],
    [
      'two-sieves-of-ground-chalk',
      1,
      'From left and right white meal is flung together before a white wall until the air is milk.',
    ],
    [
      'poppy-seed-mountain',
      1,
      'A dark hill of seed grows before a whitewashed wall by the light of the moon.',
    ],
    [
      'husk-fire-over-the-plain',
      1,
      'Two baskets flung against a crimson sky, the pale chaff between them bright as ash over a fire.',
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
  'groaning-wheels': [
    [
      'one-wheel-before-the-moon',
      0,
      'A whole black wheel stands in open water by night, and its drops fall past a low cold moon.',
    ],
    [
      'dyed-cloth-raised-with-the-river',
      0,
      'Cloths of madder, saffron and blue fill a great wheel and glow with the red sun behind them.',
    ],
    [
      'deep-among-mossed-spokes',
      0,
      'Thick mossed beams cross close by in soft green air, with white water falling down one side.',
    ],
    [
      'burning-wheel-in-the-gorge',
      0,
      'Between black walls of rock each bucket of a tall wheel burns and pours embers into the river.',
    ],
    [
      'six-broad-planks-under-snow',
      0,
      'A wheel of a few broad beams carries snow on every edge above grey water and a white sky.',
    ],
    [
      'wheel-after-wheel-down-the-race',
      1,
      'A row of like wheels goes off along a long wall at red dusk, each one over its own reflection.',
    ],
    [
      'trestles-out-in-white-mist',
      1,
      'Three wheels stand over their reflections on open water in pale mist, with one white sun behind.',
    ],
    [
      'blue-noon-under-the-channel',
      1,
      'White water runs down a warm stone wall on arches beside a wheel, under a clear blue noon.',
    ],
    [
      'lamps-turning-over-still-water',
      1,
      'On a dark wide river three wheels turn with a lamp at each bucket, doubled in the water.',
    ],
    [
      'sail-wheels-at-the-wide-ford',
      1,
      'A great wheel filled with rose, ochre and sea green cloth turns by day, a smaller one beyond it.',
    ],
  ],
  'grown-stairs': [
    [
      'rice-ponds-round-an-old-keep',
      0,
      'Square ponds without number lie in stepped banks out into a soft haze, and one dark keep stands among them.',
    ],
    [
      'courtyards-lit-after-curfew',
      0,
      'Over a whole roofless town at night every square yard holds its own low amber light.',
    ],
    [
      'moss-in-a-sunken-ball-court',
      0,
      'Straight down into stepped stone courts, deep green moss lying on every ledge and lit at the bottom.',
    ],
    [
      'beetle-wing-stairs-close-to',
      0,
      'Close in, deep terraces of violet, green blue and gold metal go down one inside another.',
    ],
    [
      'white-quarry-the-morning-after',
      0,
      'Seen low across its top, one great silver pit stands in fresh snow, every step with a white cover.',
    ],
    [
      'five-pink-salts-in-a-pile',
      1,
      'Rose cubes of salt stand one on another before a dusky wall, and draw a long ladder of light on dark stone.',
    ],
    [
      'chalk-frames-on-a-blackboard-floor',
      1,
      'From straight above clear cubes on black slate throw square after square of thin white light.',
    ],
    [
      'one-blue-lamp-of-ice',
      1,
      'A single blue cube of ice stands alone by night and throws a square maze of cold light on black ground.',
    ],
    [
      'amber-crates-grown-with-lichen',
      1,
      'Close before great honey coloured blocks on dark ground, yellow green growth lies along every step.',
    ],
    [
      'glass-houses-on-a-bare-table',
      1,
      'Small and far on an empty grey table, a handful of clear houses stand in one square of sun.',
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
  'half-made-world': [
    [
      'star-ball-hung-in-the-dark',
      0,
      'A dark blue ball printed with gold stars and their lines floats alone in an unlit room.',
    ],
    [
      'shop-with-every-size-of-ball',
      0,
      'By lamplight one brown ball stands before three shelves crowded with small finished ones.',
    ],
    [
      'rolls-still-to-be-pasted-down',
      0,
      'Very near, scrolls of paper wait along the equator over a bare white plaster half, dark behind.',
    ],
    [
      'ball-in-combed-marbled-paper',
      0,
      'Half a ball is dressed in combed stripes of teal, rust and cream before a dark wall.',
    ],
    [
      'island-coast-under-a-lens',
      0,
      'So close that only the print is seen: hatched shores, small hills and islands on old stained paper.',
    ],
    [
      'twelve-petals-on-wine-cloth',
      1,
      'The twelve leaves lie round one pole like the petals of a flower on deep wine red cloth.',
    ],
    [
      'fan-of-midnight-blue-leaves',
      1,
      'A fan of blue leaves sown with pale stars opens over dark cloth, their tips curled to the light.',
    ],
    [
      'strewn-by-an-open-window',
      1,
      'A draught has thrown the pale leaves this way and that over bright linen, with their shadows under them.',
    ],
    [
      'marbled-leaves-laid-out-to-dry',
      1,
      'Close by, leaves combed in ochre, rose and green lie side by side on sage cloth like ties.',
    ],
    [
      'sea-sheets-curling-in-lamplight',
      1,
      'Close by, brown sea charts lift their long tips to the lamp and throw curled shadows on dark cloth.',
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
  'hedge-maze': [
    [
      'mud-walls-of-a-dry-town-plan',
      0,
      'A squared labyrinth of bare clay walls on a pale dry morning, its lanes empty and one lamp still lit.',
    ],
    [
      'still-water-between-the-yews',
      0,
      'The lanes are flooded: high round hedges stand in still violet water under a rose dawn.',
    ],
    [
      'thumbprint-in-clipped-box',
      0,
      'From high over it: many thin winding rows of box in pale mist, like the whorl of a thumb.',
    ],
    [
      'lantern-walk-in-deep-snow',
      0,
      'A blue winter night low over snowed hedges, with one small lantern going round to the pavilion.',
    ],
    [
      'copper-beech-over-the-brim',
      0,
      'Fog fills the lanes to the top, so only copper backs of hedges and round heads lie on the white.',
    ],
    [
      'spires-down-to-the-fountain',
      1,
      'Two straight ranks of dark pointed yews lead the eye down a still canal to one tall jet at rose dusk.',
    ],
    [
      'marble-men-on-the-mown-squares',
      1,
      'Giant turned shapes of white marble stand far apart on striped lawn, like a game left at noon.',
    ],
    [
      'egg-trees-in-a-mirror-court',
      1,
      'Rust red trees clipped to eggs stand in a sheet of water that covers the court from edge to edge.',
    ],
    [
      'frost-giants-by-starlight',
      1,
      'Looking up at huge frosted yews on a moonlit lawn of snow, each faintly lit by its own sound.',
    ],
    [
      'ochre-needles-on-a-red-plain',
      1,
      'Banded needles of ochre stone throw long shadows on rust sand, under a pale sky with a row of jets.',
    ],
  ],
  'hide-shadows': [
    [
      'carp-passing-under-the-ferry',
      0,
      'On a cloth dyed lilac, sand and sea blue a great pierced fish swims among small ones, the boat high over it.',
    ],
    [
      'deer-wading-as-the-lamp-dies',
      0,
      'Four deer follow each other through low water under a string of herons, all black against a dying red lamp.',
    ],
    [
      'plum-blossom-in-a-hoop-of-paper',
      0,
      'A round of pale paper in a black room, and on it one wide tree in rose blossom leans over a scaled hill.',
    ],
    [
      'puppet-night-from-the-last-row',
      0,
      'From far back in the dark the dyed cloth is one small bright window, green below and plum red above.',
    ],
    [
      'ferry-below-the-bare-peaks',
      0,
      'Only a bare winter tree, a black boat and steep peaks on a cold white cloth, with no beast in sight.',
    ],
    [
      'stags-marching-down-the-sheet',
      1,
      'In cold blue morning light honey coloured deer are marched along on sticks, red winged herons over them.',
    ],
    [
      'moon-well-with-slow-fish',
      1,
      'A cool round of light in the dark holds a great fish and small ones, the boat above and weed at the side.',
    ],
    [
      'giant-hart-beside-embers',
      1,
      'Close by a low red lamp a hart as tall as the sheet stands over the water with its antlers in the light.',
    ],
    [
      'dyed-sheet-on-a-summer-evening',
      1,
      'Seen from back among the trees, sheet and players hang in bands of teal, rose and marigold dye.',
    ],
    [
      'one-long-boat-on-a-milk-white-sheet',
      1,
      'One stained boat rides pierced waves, oars and all, and soft heads of the audience show through the cotton.',
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
  'hot-gather': [
    [
      'cold-bottles-on-the-day-shelves',
      0,
      'A pale blue shop by day, shelves of blue and grey glass behind a long bottle still soft on its pipe.',
    ],
    [
      'red-bowl-at-the-furnace-door',
      0,
      'From across a red room, the furnace stands open and bright and a wide ruby bowl turns before it.',
    ],
    [
      'glass-blown-under-winter-stars',
      0,
      'The shop has lost its walls: hot glass on its pipe, pale bare ground, far hills, a moon and many stars.',
    ],
    [
      'ribbed-gourd-in-the-dark',
      0,
      'Very near, a twisted and ribbed gourd of amber glass fills the dark and lights nothing but itself.',
    ],
    [
      'three-bulbs-hung-to-cool',
      0,
      'A chain of three rose and violet bulbs hangs straight down against a pale bare wall.',
    ],
    [
      'thread-over-the-ebb-flats',
      1,
      'On a wet shore at a red sundown two people draw a glowing thread, and the sand holds all of it twice.',
    ],
    [
      'harp-of-threads-before-a-red-evening',
      1,
      'Great windows full of a red evening, and five coloured threads of glass hung between two figures.',
    ],
    [
      'fire-beads-strung-after-hours',
      1,
      'One worker stands near in a black hall, holding a string of beads of fire that runs off to the right.',
    ],
    [
      'far-end-of-the-cobalt-hall',
      1,
      'Seen from a long way off in a blue hall, two tiny figures and one taut line of light on the wet floor.',
    ],
    [
      'roofless-hall-in-green-dusk',
      1,
      'The hall has lost its roof and half its wall, and a thread of beads hangs deep before the green dusk.',
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
  'hundred-compasses': [
    [
      'a-coast-chart-and-a-few-needles',
      0,
      'From above, a pale chart of coasts and depths with a handful of flat brass compasses left lying on it.',
    ],
    [
      'iron-drums-waiting-by-lamplight',
      0,
      'A crowd of tall black iron drums under one warm lamp, a pale needle turning in the well of each.',
    ],
    [
      'lit-dials-on-the-night-plain',
      0,
      'Hundreds of small dials lit from within reach to a black horizon, green and amber like a low town.',
    ],
    [
      'brass-coins-sunk-in-dune-sand',
      0,
      'Low evening sun over rippled sand, and small flat compasses lying in it as if dropped by a caravan.',
    ],
    [
      'white-drums-in-new-snow',
      0,
      'On bare snow from high up, tall white porcelain compasses in straight rows, every needle red.',
    ],
    [
      'paper-sails-over-a-drowned-chart',
      1,
      'Little boats of cork with paper sails drift over the coasts painted on the floor of a clear basin.',
    ],
    [
      'red-floats-left-in-a-snow-pool',
      1,
      'A round pool in clean snow seen from straight above, with a few red floats far apart on pale water.',
    ],
    [
      'pin-heads-burning-over-black-water',
      1,
      'In a dark room some fifty lights stand on pins in a black basin, and the water holds each a second time.',
    ],
    [
      'round-leaves-in-the-oasis-pool',
      1,
      'Close over a warm evening pool in the sand, wide round leaves lie on the water, a short stalk on each.',
    ],
    [
      'great-corks-close-to-the-eye',
      1,
      'Low evening sun in a white basin, and a few great corks near the eye, a needle with a round head on each.',
    ],
  ],
  'indoor-tide': [
    [
      'birches-standing-in-the-parlour',
      0,
      'In a green room with no roof birch trunks stand in clear still water and go on up into the open sky.',
    ],
    [
      'last-lamps-along-the-sea-gallery',
      0,
      'A long gallery at night, lamp after lamp above a black mirror of sea, with a dark horizon in every doorway.',
    ],
    [
      'turquoise-lapping-at-a-tiled-loggia',
      0,
      'Noon comes through three white arches and lively turquoise water slides over black and white tiles.',
    ],
    [
      'dinner-laid-in-a-roofless-dusk',
      0,
      'The roof has gone and the walls are broken, yet the table is still set, and an orange sun hangs over it all.',
    ],
    [
      'chairs-wading-after-midnight',
      0,
      'One white lamp burns over a table at night, and dark water has risen past the seats of its three chairs.',
    ],
    [
      'red-runner-under-the-evening-flood',
      1,
      'A river comes down a red carpeted stair in a rose hall at sunset and stands three steps deep at its foot.',
    ],
    [
      'stair-that-climbs-out-to-the-stars',
      1,
      'Above a dark wooden stair there is no house left, only a torn wall, a great moon and all the stars.',
    ],
    [
      'green-ballroom-with-the-sea-let-in',
      1,
      'In a high dark green hall the sea stands in two bright arches and has come in over the checkered dance floor.',
    ],
    [
      'low-sun-on-the-birch-landing',
      1,
      'Birch trunks stand in still water before a deep green wall, and the evening runs gold down the stair.',
    ],
    [
      'honey-evening-below-the-flight',
      1,
      'Through one tall arch beneath the stair the low sun gilds the open sea and a still brown floor of water.',
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
  'jelly-palace': [
    [
      'quince-dome-by-a-night-light',
      0,
      'One amber jelly glows alone on a black polished table, with its own light lying before it.',
    ],
    [
      'ice-fort-the-tide-forgot',
      0,
      'Clear cold towers of violet and mint stand on pale rippled ground before a grey ridge and a white sun.',
    ],
    [
      'stepped-keep-in-the-red-desert',
      0,
      'A square jelly keep of garnet and amber stands on wide rippled red sand, its coloured shadow before it.',
    ],
    [
      'rosewater-creams-for-a-wedding',
      0,
      'Smooth milky jellies in rose, cream and white stand on a white cloth, seen from a little above.',
    ],
    [
      'greengage-spires-at-lamplight',
      0,
      'Tall twisted towers of deep green jelly rise close by in a dark room beside one tall lit window.',
    ],
    [
      'five-sweets-in-one-glass',
      1,
      'Level layers of plum, coral, butter and mint lie one on another, with small fruit set in them.',
    ],
    [
      'cosmos-flowers-set-in-clear-ice',
      1,
      'Pale pink and white flowers with gold eyes hang in a clear cold jelly full of morning light.',
    ],
    [
      'pearls-in-smoky-tea',
      1,
      'Brown, plum and cream pearls of many sizes hang in dark tea that one low lamp shines through.',
    ],
    [
      'sea-mouth-in-a-lime-cavern',
      1,
      'From inside green jelly a scalloped mouth opens on a bright sea with headlands and a white sun.',
    ],
    [
      'gentian-ballroom-with-loose-beads',
      1,
      'A wide ribbed hall of deep blue and violet jelly, its floor lit from the right, small beads hanging in it.',
    ],
  ],
  juggled: [
    [
      'snowed-in-and-still-juggling',
      0,
      'A blue hour of snow: a wall capped white runs off to a great bare tree, big balls going up behind it.',
    ],
    [
      'peach-balls-before-the-low-sun',
      0,
      'A huge red sun is going down behind an earth wall, and balls cross its face in wide low arcs.',
    ],
    [
      'hoops-over-the-mountain-terrace',
      0,
      'Painted hoops rise and fall over a low blue wall, with ranks of hazy mountains standing behind.',
    ],
    [
      'silver-pellets-under-a-full-moon',
      0,
      'Behind a tall wall at night many small silver balls climb in narrow arcs across an enormous moon.',
    ],
    [
      'nothing-but-balls-and-summer-air',
      0,
      'Looking up into a wide pale sky, a few painted balls hang near and large, with dotted trails.',
    ],
    [
      'milk-balls-in-the-blue-ice-hole',
      1,
      'Down a smooth hole in veined blue ice, white balls rise round a cold lamp and drop away again.',
    ],
    [
      'from-the-bottom-of-the-dry-well',
      1,
      'Looking up a well of coloured bricks to a round of bright cloud, small painted balls tossed up to it.',
    ],
    [
      'painted-tiles-all-the-way-down',
      1,
      'A square shaft by day lined with blue, green and rust tiles, and bright balls leaping in it.',
    ],
    [
      'smoke-rings-in-the-white-chimney',
      1,
      'In a whitewashed chimney great soft rings of pale smoke swim up very near the eye and fall back.',
    ],
    [
      'brass-hoops-in-a-square-shaft',
      1,
      'A square brick shaft on its corner, a lamp far down at the left, and brass hoops thrown up from it.',
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
  'lifted-roofs': [
    [
      'one-coloured-hem-in-ink',
      0,
      'The house is drawn in ink on pale paper, and one robe lies out from its blind in full colour.',
    ],
    [
      'whole-palace-in-gold-line',
      0,
      'From very high, house after house is ruled in fine gold line on blue black, cloud lying between.',
    ],
    [
      'on-posts-in-a-lily-lake',
      0,
      'A long veranda runs out over blue water thick with round green leaves and a few pale flowers.',
    ],
    [
      'long-houses-under-gold-cloud',
      0,
      'Between banks of worn gold leaf, houses of open lit rooms slant one behind another with a stream past each.',
    ],
    [
      'bark-roofs-in-a-red-autumn',
      0,
      'Brown bark roofs lie over most of the rooms, and red leaves have blown up against the boards.',
    ],
    [
      'plum-out-after-the-thaw',
      1,
      'A plum in pink flower leans over pale spring grass, a brim full blue stream and the ends of two planks.',
    ],
    [
      'snow-all-along-the-ridge',
      1,
      'Snowed roofs lie over a house in deep blue night, and one lit room is left open between them.',
    ],
    [
      'maple-dropping-on-the-stream',
      1,
      'A maple at full red lets its leaves down over ochre ground, a blue stream and the zigzag planks.',
    ],
    [
      'four-planks-over-black-water',
      1,
      'Close by, four snowed planks cross water that is nearly black, with round leaves lying on it.',
    ],
    [
      'one-bent-branch-on-rice-paper',
      1,
      'A crooked plum stands alone in ink on pale paper, a few red buds on it and faint stains behind.',
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
  'living-skin': [
    [
      'looked-at-by-lamplight',
      0,
      'A gold lidded eye as wide as the picture, its dark slot turned to a warm lamp, dots all round it.',
    ],
    [
      'zebra-coat-for-a-rival',
      0,
      'The whole long flank in white and ink blue waves that run back to the tail, in bright clear water.',
    ],
    [
      'sparks-worn-in-the-skin',
      0,
      'In black water the animal is only its own lights, blue and gold points along a side barely there.',
    ],
    [
      'flank-on-a-cream-plate',
      0,
      'The head and side drawn in ink with fine hatching and a wash of brown, on a sheet of cream paper.',
    ],
    [
      'rose-inks-opened-wide',
      0,
      'Nothing but skin: big soft discs of rose, plum and yellow open and close over mother of pearl.',
    ],
    [
      'five-over-white-sand',
      1,
      'Five pale swimmers hang in step over bare rippled sand, in sunlit shallows as green as glass.',
    ],
    [
      'upright-over-the-drop',
      1,
      'One animal stands on its tail in deep blue open water, the sea floor only a dark edge far below.',
    ],
    [
      'passing-for-a-cobble',
      1,
      'Very near and nearly hidden: brown patches and pale ones break it up like the big stones it rests over.',
    ],
    [
      'four-lanterns-with-fins',
      1,
      'Four swimmers with amber bands that shine by themselves cross a black bay over stones and sand.',
    ],
    [
      'plum-stripes-in-the-red-weed',
      1,
      'A plum and cream striped swimmer far off over rose coloured shingle, red weed standing at the side.',
    ],
  ],
  'long-dancer': [
    [
      'indigo-rope-on-a-snowed-square',
      0,
      'From the roofs a thin body of indigo cloth loops over clean snow, its bearers small and dark under it.',
    ],
    [
      'finned-cloth-above-the-cloud-floor',
      0,
      'Nobody carries it: a hooped red body with a gold fin swims in loops over a bright morning floor of cloud.',
    ],
    [
      'painted-scales-at-the-inn-doors',
      0,
      'Low and near at night, a thick body of rust, gold and teal scales shoulders past the lit inn doors.',
    ],
    [
      'red-bolster-through-the-noon-yard',
      0,
      'Bare sand under a white noon, plaster walls, and a great red bolster of cloth thrown into loops.',
    ],
    [
      'thin-line-of-silk-over-night-cloud',
      0,
      'From high above, a narrow line of silk curls through the night over broken cloud and blue dark.',
    ],
    [
      'lamp-eel-over-the-moonlit-lake',
      1,
      'A long eel of white lamps floats with no bearers over black water, a full moon and hills beyond.',
    ],
    [
      'paper-flowers-on-a-white-morning',
      1,
      'By a misty white day the body is pale paper sewn with red and ochre flowers, its bearers grey below.',
    ],
    [
      'red-hoops-in-the-warm-fog',
      1,
      'Very near in red fog, hoop after hoop of small red lamps arches overhead with the bearers as shadows.',
    ],
    [
      'great-globes-over-a-flooded-street',
      1,
      'In blue evening a chain of large amber globes crosses a flooded street, and lies again in the water.',
    ],
    [
      'seed-lamps-in-a-golden-fog',
      1,
      'A thin thread of small lamps winds over its bearers in brown and gold fog, and lies again in still water.',
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
  'mirror-column': [
    [
      'ink-peaks-round-a-post',
      0,
      'Grey ink spreads in rings over white paper and stands up in dark steel as peaks and a red sun.',
    ],
    [
      'poppy-swept-onto-brown-paper',
      0,
      'Scarlet petals swept wide over wrapping paper close up as one tall poppy in a copper pot.',
    ],
    [
      'bare-pear-after-the-blizzard',
      0,
      'From low along a moonlit sheet of snow blue, one bare tree stands in a tall cold pillar.',
    ],
    [
      'chalk-ranges-on-a-school-slate',
      0,
      'From high over black slate, rings of chalk hills run round a low tin and a lemon moon is in it.',
    ],
    [
      'orchard-in-a-tea-caddy',
      0,
      'On a wide white sheet a rust coloured smear turns into an orchard in a short copper tin.',
    ],
    [
      'dahlia-let-down-a-funnel',
      1,
      'A rose red dahlia fills the sheet, and the cone at its heart gathers every petal again.',
    ],
    [
      'counters-set-out-in-circles',
      1,
      'Rounds of blue, sand and coral counters on white paper, shrunk and turned about in the cone.',
    ],
    [
      'carp-round-a-blue-peak',
      1,
      'A steep mirror leans out of a moonlit pond with one fish going round its foot.',
    ],
    [
      'night-fair-on-a-slate',
      1,
      'Rings of amber, rose and jade dots on black slate wheel round a copper cone seen from its side.',
    ],
    [
      'ochre-leaves-and-a-far-pond',
      1,
      'A small green pond edged with ochre and navy leaves lies far down on a red table at evening.',
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
  'moon-terrace': [
    [
      'kite-day-over-a-mustard-sky',
      0,
      'Seven paper kites hang on their threads in a clear yellow sky above a long garden and a small white house.',
    ],
    [
      'old-fig-tree-at-the-tank',
      0,
      'A huge fig with hanging roots and orange fruit fills the cream paper beside one small pavilion.',
    ],
    [
      'gold-seamed-cloud-on-lapis',
      0,
      'Rolled black cloud fills nearly all the sheet, every seam drawn in gold on a deep lapis ground.',
    ],
    [
      'rose-crags-behind-the-court',
      0,
      'Heaped rocks in rose, mauve and ochre climb behind a white house and a dry garden, in a warm dusk.',
    ],
    [
      'downpour-from-the-red-balcony',
      0,
      'Cloud and fine rain over slate green, seen past a scalloped red stone arch and a pierced rail.',
    ],
    [
      'grey-dawn-among-the-lotus',
      1,
      'Close over the water, broad leaves and pink lotus lie on pearl grey before the sun is up.',
    ],
    [
      'rockets-for-the-lamp-night',
      1,
      'Flowers of gold fire open and sink over a blue black lake, and the water gives them back.',
    ],
    [
      'copper-moon-through-a-dark-arch',
      1,
      'A huge copper moon over a red brown lake, framed by a black arch pricked with gold.',
    ],
    [
      'one-tree-on-the-silver-water',
      1,
      'A single dark tree on a low island under a pin of a moon, with one lamp boat on the wide lake.',
    ],
    [
      'bone-paper-lake-and-violet-rocks',
      1,
      'A pale sheet of bone coloured paper with a far white house, violet rocks and all the boats out.',
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
  'moss-walker': [
    [
      'small-herd-under-the-toadstools',
      0,
      'Spotted toadstools stand tall as trees in a green sunlit wood while small grey walkers pass below them.',
    ],
    [
      'calves-in-file-before-the-moon',
      0,
      'A whole file of the small fat beasts goes by on a low hill, with a huge pale moon standing behind them.',
    ],
    [
      'tucked-up-in-a-hard-frost',
      0,
      'One walker has drawn its legs in and sleeps as a pale cushion in white fog among a few frosted leaves.',
    ],
    [
      'standing-up-to-a-copper-sun',
      0,
      'On a bare rust hill a broad plated beast rears up, all its folds dark before a sun as tall as itself.',
    ],
    [
      'face-to-face-under-the-drops',
      0,
      'Close by in a wet thicket a blunt wrinkled face turns to us between leaf sails and great round drops.',
    ],
    [
      'barefoot-over-rock-salt',
      1,
      'A rosy beast treads a pale floor heaped with stepped crystals of salt, white and shell pink to the edge.',
    ],
    [
      'blue-hide-seen-from-the-air',
      1,
      'From overhead one great beast lies on an empty dark floor, drawn only by the cold blue light along its rims.',
    ],
    [
      'small-giants-on-a-printed-plate',
      1,
      'On warm old paper a file of little walkers crosses a field of pierced shells, all in brown and grey ink.',
    ],
    [
      'plated-beast-among-glass-wheels',
      1,
      'A honey coloured plated beast wades through jade wheels of glass in a blue dusk, a green moon behind it.',
    ],
    [
      'bronze-flank-close-to',
      1,
      'So near that its folds fill the picture, a bronze flank slides by with a few dark shells at its feet.',
    ],
  ],
  'mountain-shadow': [
    [
      'volcano-shade-over-the-isles',
      0,
      'From a volcano at sunrise, its wide blue shadow runs off to the right over a pale sea full of islands.',
    ],
    [
      'table-lands-under-a-spear',
      0,
      'Flat topped red tables with banded cliffs go off to the sky, one narrow spear of shade across them.',
    ],
    [
      'full-moon-behind-the-summit',
      0,
      'Far back under a huge sky of stars: two small climbers, and the faint triangle their peak lays on cloud.',
    ],
    [
      'ranges-torn-from-coloured-card',
      0,
      'Plum, ochre and green ridges of grained card stand one behind another, a clean blue cone laid over.',
    ],
    [
      'larch-hills-before-breakfast',
      0,
      'Near above low hills in gold and green woods, mist lying between them and one slim shadow across all.',
    ],
    [
      'reservoir-without-a-breath',
      1,
      'A wall of white peaks on a clear cold morning, and the whole of it again in still water below.',
    ],
    [
      'stage-of-red-buttes',
      1,
      'Near to square red buttes with one finger of stone, the last orange light on them and mist below.',
    ],
    [
      'hut-above-the-fog-at-night',
      1,
      'A lit hut and its string of lamps above a valley of fog, with two moonlit peaks and stars behind.',
    ],
    [
      'folded-card-alps',
      1,
      'A rose peak, violet walls and a blue sky in flat grained card, with a sheet of dark water before them.',
    ],
    [
      'october-larch-under-the-wall',
      1,
      'Gold larches cover every lower slope below a steep grey wall with the late sun on its spires.',
    ],
  ],
  'music-box-town': [
    [
      'white-harbour-rolls-into-the-tide',
      0,
      'A white town with blue and red roofs turns down a white barrel into a bright sea, under a pale high sky.',
    ],
    [
      'larches-turning-gold-on-iron',
      0,
      'Gold and rust coloured larches stand in ranks on a dark iron barrel, in slanting October light.',
    ],
    [
      'every-house-a-lit-parcel',
      0,
      'In a black room the houses are ribbed paper lit from within, going round like goods on a belt.',
    ],
    [
      'low-farms-on-a-ploughed-roller',
      0,
      'Small farms stand among squares of stubble, plough and clover that are wrapped round the barrel.',
    ],
    [
      'snow-packed-between-the-chimes',
      0,
      'Blue dusk on thick snow: roofs, ground and streets all white, with yellow windows under the eaves.',
    ],
    [
      'thin-spires-on-a-black-dial',
      1,
      'Hundreds of steep dark spires crowd a black iron disc at night, with rows of small gold windows.',
    ],
    [
      'enamel-plate-with-a-few-flat-roofs',
      1,
      'Seen from above, small flat houses cast short shadows on a bright white plate among white wheels.',
    ],
    [
      'wheel-islands-off-a-round-coast',
      1,
      'The whole town is a green island in a jade sea, and five small toothed islands turn beside it.',
    ],
    [
      'seven-crops-sown-in-a-ring',
      1,
      'From high above, plots of lavender, rape, flax and vines lie round a disc with few houses on them.',
    ],
    [
      'striped-tents-of-a-clockwork-fair',
      1,
      'Close to the rim, pointed tents in madder, cream and sea blue go by on the brass like a parade.',
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
  'night-landing': [
    [
      'harvest-country-at-first-light',
      0,
      'Fields of wheat, plough and pasture lie below in early light, and the street lamps still burn.',
    ],
    [
      'snow-plain-under-green-curtains',
      0,
      'Green light hangs in folds over a blue plain of snow where only a few white villages are lit.',
    ],
    [
      'herders-fires-on-the-dry-steppe',
      0,
      'Hardly a road: hundreds of separate fires lie on black ground under a sky full of stars.',
    ],
    [
      'round-towns-at-the-rose-hour',
      0,
      'Every quarter is laid out in rings of lamps about a middle, under a wide violet and rose evening.',
    ],
    [
      'cloud-lit-from-the-streets-below',
      0,
      'From high up the city is a white glow in torn cloud, with dark holes of open country.',
    ],
    [
      'lamps-left-on-into-a-still-dawn',
      1,
      'A grey boat lies on pale blue water under a cream sky, its lamps still burning in the early light.',
    ],
    [
      'a-turning-light-on-the-outer-rock',
      1,
      'A lighthouse on a black rock sweeps two long beams round over the sea at violet dusk.',
    ],
    [
      'rust-red-sail-and-amber-lamps',
      1,
      'Close by, a battened red sail stands lit from its own lamps on black water, others far behind it.',
    ],
    [
      'boats-in-pack-ice-with-the-sky-alight',
      1,
      'Green and rose curtains stand over a frozen sea, and their light lies along the floes and the water.',
    ],
    [
      'the-whole-fleet-and-its-pillars',
      1,
      'At blue dusk, seen from high up, boats past counting stand under tall pillars of their own pale light.',
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
  'oiled-umbrellas': [
    [
      'one-left-glowing-in-the-snow',
      0,
      'A single paper umbrella stands lit from inside on blue night snow before a dark wood.',
    ],
    [
      'dyers-yard-from-the-gable',
      0,
      'Seen from above, deep red, orange and green umbrellas with dark rings stand about on white snow.',
    ],
    [
      'striped-ones-adrift-on-a-lido',
      0,
      'Broad striped umbrellas float on still green water, each with its own likeness under it.',
    ],
    [
      'let-go-over-the-downs-at-dusk',
      0,
      'Umbrellas ride the last sun, large and small, above long violet hills going off into haze.',
    ],
    [
      'sedge-hats-on-the-threshing-floor',
      0,
      'Steep cones of straw ringed with brown stand close by on dry earth, in dust and low sun.',
    ],
    [
      'alley-roofed-for-the-lamp-fair',
      1,
      'On our backs in a night alley, rows on rows of lit umbrellas hang on wires against a blue sky.',
    ],
    [
      'left-on-a-hook-for-forty-years',
      1,
      'Scraps of gold and rose paper still cling to the bare ribs of old umbrellas, and blue sky comes through.',
    ],
    [
      'white-wheel-under-a-snow-sky',
      1,
      'One great white paper wheel of fine ribs, snow lying grey on it, in an empty pale sky.',
    ],
    [
      'bullseyes-in-oxblood-and-ink',
      1,
      'Close under three umbrellas of oxblood paper with broad dark rings, at night, a lamp in each hub.',
    ],
    [
      'three-parasols-from-the-hot-sand',
      1,
      'Far up in a blue noon three broad striped parasols lean together on their long poles.',
    ],
  ],
  'old-courses': [
    [
      'every-bed-the-river-ever-had',
      0,
      'A survey sheet from above: each bed of a river washed in its own colour, pen lines between, on cream paper.',
    ],
    [
      'bunds-full-of-evening',
      0,
      'Hundreds of small flooded fields between green banks hold a violet sky, gold where the low sun lies on them.',
    ],
    [
      'slow-fire-across-the-ash',
      0,
      'A river of molten rock loops through black land at night, its older beds still dull red in the dark.',
    ],
    [
      'poplar-tops-above-the-fret',
      0,
      'Mist fills the valley like a white sea under blue sky, only the russet tops of trees in rows stand out.',
    ],
    [
      'dry-channels-in-red-ground',
      0,
      'High noon over a red plain with hardly a tree: one thin river, pale sand, the combed marks of dead channels.',
    ],
    [
      'flood-through-the-alder-fen',
      0,
      'Dark trees stand to their knees in silver water under a full moon, the river almost lost in the flood.',
    ],
    [
      'willow-let-down-over-the-pool',
      1,
      'Long green leaf hangs over open spring water, a round island of young willow in the middle of it.',
    ],
    [
      'lavender-rings-round-a-dew-pond',
      1,
      'Low round bushes of violet, rose and grey stand in curved rows about a small pond in short grass.',
    ],
    [
      'poplars-doubled-in-a-red-mere',
      1,
      'Tall thin trees ring a brimming lake at the end of the day, dark upside down in the red water.',
    ],
    [
      'one-fox-went-by-in-the-rime',
      1,
      'Trees white with rime stand round a frozen pool under a pale blue sky, one line of prints across the ice.',
    ],
  ],
  'one-sided-road': [
    [
      'bus-through-the-drifts',
      0,
      'Great white roofs and a ploughed lane on a small ring of deep snow, the sky pale as milk.',
    ],
    [
      'wheat-ring-from-a-high-kite',
      0,
      'From far above, a round of ripe amber strips in blue air, its few great poplars gold and leaning out.',
    ],
    [
      'poplar-dyke-seen-end-on',
      0,
      'One thin edge of earth leans across pale air, poplars rising from it and hanging below.',
    ],
    [
      'thrown-lane-over-the-firth',
      0,
      'A strip of farms rolls over three times above a wide evening sea with the sun along it.',
    ],
    [
      'homestead-beside-a-dead-moon',
      0,
      'Houses and poplars ride a slim hoop of bare fields through black space, a pitted moon behind.',
    ],
    [
      'ice-on-the-long-lock',
      1,
      'A frozen canal winds twice round on slim white arches, barges held fast in a colourless noon.',
    ],
    [
      'moss-creeping-up-the-viaduct',
      1,
      'From close by, tall walls furred green stand in forest wet with one brown barge at their foot.',
    ],
    [
      'black-sluice-under-a-near-moon',
      1,
      'Two coils of dark water strung with small lamps hang in starry black beside a grey moon.',
    ],
    [
      'five-loops-in-a-clear-bay',
      1,
      'A knot of five blue waterways opens like a flower over a bright bay on a clear morning.',
    ],
    [
      'brick-weir-in-a-furnace-sky',
      1,
      'A great brick drum of a canal winds up against an orange sky, its lamps lit and its water red.',
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
  'packed-sand': [
    [
      'camels-round-the-belly',
      0,
      'A pointed flask of dyed sand: camels in file along a dune, palms beside them, a red evening sky.',
    ],
    [
      'zigzags-set-with-a-wire',
      0,
      'A square bottle packed with rows of diamonds, zigzags and checks in navy, brick and cream, on a blue wall.',
    ],
    [
      'souvenirs-on-the-sill',
      0,
      'A row of small bottles of many shapes on a wooden sill, each filled with bands of its own bright sands.',
    ],
    [
      'moon-over-a-lake-of-grains',
      0,
      'A wide picture laid in sand: steep peaks and dark trees by a lake, a moon and stars in deep blue grains.',
    ],
    [
      'one-sail-before-breakfast',
      0,
      'One sail on a flat teal sea laid grain by grain, the sky above it peach below and pale grey higher up.',
    ],
    [
      'an-hour-of-red-sand',
      1,
      'An hourglass in dark wood: red and ochre sand sinks through its neck onto small striped hills.',
    ],
    [
      'round-pane-on-a-chalk-wall',
      1,
      'A round glass in a dark ring on a pale wall, inside it green and white peaks that fell through water.',
    ],
    [
      'swells-laid-down-in-teal',
      1,
      'Long round swells of teal, cream and navy sand, skin over skin, lie half way up the glass in clear water.',
    ],
    [
      'stepped-towers-at-red-sundown',
      1,
      'Hills of sand that stand in steps like old brick towers, black, cream and rust against an orange sky.',
    ],
    [
      'every-grain-of-the-snow-range',
      1,
      'Seen so near that each grain shows: white and black slopes under a big cold moon in blue water.',
    ],
  ],
  'painted-grotto': [
    [
      'gauze-bells-in-a-dark-tank',
      0,
      'Five jellyfish of lit gauze, rose, violet and pale green, pulse in dark blue water before thin rays.',
    ],
    [
      'silver-ring-among-drowned-arches',
      0,
      'Small silver fish go round in a ring before a sunk arcade in teal water, a gold sun in one of its arches.',
    ],
    [
      'one-veil-tail-in-morning-water',
      0,
      'One great red fish with long veils hangs in pale green water, rays of morning light falling past it.',
    ],
    [
      'slim-carp-by-ember-light',
      0,
      'Five slim red fish pass before brick arches and an open clam, lit by one low lamp like a fire.',
    ],
    [
      'bait-ball-under-the-open-sun',
      0,
      'Small bright fish wheel in one ring in open blue water, the light of noon streaming down through them.',
    ],
    [
      'sea-cranked-by-hand',
      1,
      'Rows of painted waves with white edges rock behind one another, a yellow paper sun low over them.',
    ],
    [
      'cut-firs-and-a-low-winter-sun',
      1,
      'Row behind row of green firs cut from board stand before a big coral sun and its painted rays.',
    ],
    [
      'cardboard-town-at-lamp-lighting',
      1,
      'Small gabled houses of painted card stand in five rows, their windows yellow under a hung moon.',
    ],
    [
      'thunderheads-of-peach-wool',
      1,
      'Tall heaps of cotton wool, peach above and violet below, crowd the rails before a yellow sun and its rays.',
    ],
    [
      'tin-stars-over-cloud-shelves',
      1,
      'A crescent of painted board and tin stars on threads hang over flat shelves of grey and plum cloud.',
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
  parasols: [
    [
      'thatch-shades-in-a-brick-red-cove',
      0,
      'Ragged straw roofs on poles lean over red sand while the sun goes down behind you.',
    ],
    [
      'supper-cloths-in-the-spring-tide',
      0,
      'White parasols stand up to their poles in clear green water and look at themselves.',
    ],
    [
      'a-lamp-under-every-shade',
      0,
      'Night on black sand, and under each low parasol somebody has hung a light.',
    ],
    [
      'garden-fete-from-a-tethered-balloon',
      0,
      'Bright halved rounds set out on a lawn, ring inside ring, by a grey green lake.',
    ],
    [
      'evening-tide-among-the-last-shades',
      0,
      'A thin clear tide creeps over gold sand round the parasols that nobody took in, late in the day.',
    ],
    [
      'bone-buttons-on-lava-sand',
      0,
      'Flat white rounds on a black beach straight below, with one green edge of sea.',
    ],
    [
      'first-snow-over-the-christmas-stalls',
      1,
      'Square roofs under blue snow on a winter evening, each melted open round the lamp below its peak.',
    ],
    [
      'melon-sellers-under-noon-cloth',
      1,
      'Midday in a warm square from a high window: striped peaks of cloth and hard short shade.',
    ],
    [
      'stalls-left-after-a-cloudburst',
      1,
      'The square has emptied; wet stones hold the light of the few stalls that stayed.',
    ],
    [
      'amber-rings-of-the-horse-fair',
      1,
      'Pointed tents set in wide circles on a black field, each ring with a light of its own.',
    ],
  ],
  'passed-along': [
    [
      'beacons-answered-over-the-pass',
      0,
      'A fire in an iron basket on a tower, and fire after fire answering it along dark hills under a moon.',
    ],
    [
      'flag-masts-above-the-barley',
      0,
      'Striped and spotted flags on two strings, a long red pennant, pale harvest hills and more masts behind.',
    ],
    [
      'message-across-the-red-buttes',
      0,
      'Flat topped rocks in red and cream layers, one behind another with dust between, jointed arms on their tops.',
    ],
    [
      'skerry-arms-on-a-clear-day',
      0,
      'Green skerries in a pale blue sea, a jointed arm on each, the nearest on a stone tower, the sun on the water.',
    ],
    [
      'slats-and-nothing-else-in-fog',
      0,
      'Near black slatted arms against white fog, the tower cut off below, a faint arm and the sun behind.',
    ],
    [
      'all-sail-under-a-harvest-moon',
      1,
      'Ships under full amber sail cross before a great pale gold moon, its light broken on black water.',
    ],
    [
      'night-fishers-below-the-cliffs',
      1,
      'Low boats, each with one lamp on a pole and one standing figure, on black water between blue cliffs.',
    ],
    [
      'regatta-before-the-wind-comes',
      1,
      'Pale coral and cream sails stand in a bright haze over ruffled water, the near ones very large.',
    ],
    [
      'rowing-home-on-a-red-sea',
      1,
      'A huge gold sun low over a still red sea, and one low boat with a standing rower, dark before it.',
    ],
    [
      'wintering-under-snow-cliffs',
      1,
      'A ship lies bare masted in a blue bay with more behind her, snow on the cliffs round it, lamps on the water.',
    ],
  ],
  'pecking-hens': [
    [
      'chicks-on-the-breakfast-check',
      0,
      'Round chicks stand about a painted board on a checked cloth, seen from over the table.',
    ],
    [
      'one-goose-over-the-lily-pond',
      0,
      'A single tall goose on her wooden plate, and the ball going round above dark water.',
    ],
    [
      'lacquer-peacocks-by-one-lamp',
      0,
      'Black and gold birds with wheels for tails, gathered in the small light of a lamp.',
    ],
    [
      'lime-wood-flock-at-eye-level',
      0,
      'Unpainted birds cut from pale wood, seen so near and low that they stand like statues.',
    ],
    [
      'seven-round-the-plate-from-the-rafters',
      0,
      'Straight down on a blue floor: a round board like a clock and seven birds for its hours.',
    ],
    [
      'crows-on-a-glowing-drum',
      0,
      'The board is lit from within and the birds on it are black, pecking at their own light.',
    ],
    [
      'wheel-tails-before-blue-ranges',
      1,
      'Four birds spread their tails on a sill, and behind them the hills go back for miles.',
    ],
    [
      'paper-screen-geese',
      1,
      'Black geese on crossed sticks bow to each other before a screen of lit paper.',
    ],
    [
      'tiled-dairy-on-a-clear-morning',
      1,
      'Plump chicks close to the eye against blue and white tiles, with the window light on them.',
    ],
    [
      'two-up-late-under-a-faint-moon',
      1,
      'By the last of the lamp two long necked birds lean together on a sill, with black hills behind.',
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
  'pollen-fur': [
    [
      'ruff-of-a-white-night-moth',
      0,
      'Deep white plumes stand rank behind rank in blue moonlight, with hardly a grain caught among them.',
    ],
    [
      'spiked-sun-in-a-fox-red-coat',
      0,
      'One huge spiked grain hangs close by like a sun among fox red hairs, and everything round it glows.',
    ],
    [
      'feather-star-with-drifting-eggs',
      0,
      'In green water at dusk a feathered star spreads its arms from one tuft while coral and cream eggs drift past.',
    ],
    [
      'dark-hairs-on-a-collectors-card',
      0,
      'A few bare dark hairs and one smooth grain are laid on cream card, as plain as a drawing in ink.',
    ],
    [
      'spring-gale-across-the-pelt',
      0,
      'In white noon light the pale green coat is blown flat and a crowd of round grains is carried over it.',
    ],
    [
      'scarlet-cup-with-the-guest-arriving',
      1,
      'Deep between scarlet petals the heavy stamen heads are thick with spiked gold as a striped guest comes in.',
    ],
    [
      'bell-flower-hung-in-violet-dusk',
      1,
      'From the roof of a hanging flower bowed stamens reach down into dusk among soft violet and rose lights.',
    ],
    [
      'ray-petals-in-a-herbal',
      1,
      'On the pale page of a plant book a flower opens its many narrow yellow rays round thick brown stamens.',
    ],
    [
      'white-guest-in-the-blue-hour',
      1,
      'In clear blue moonlight pale short petals open, and a white guest striped with black comes to gold pods.',
    ],
    [
      'lights-across-the-bay-at-dusk',
      1,
      'Close by, a stamen head with one great spiked grain; behind it soft round lights float on a grey blue dusk.',
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
  'quick-garden': [
    [
      'bean-poles-in-late-gold',
      0,
      'Five hazel poles lean together in gold evening light, beans in flower winding up to the knot.',
    ],
    [
      'seedlings-before-a-full-moon',
      0,
      'Thin stems and narrow leaves stand black on a huge pale moon in a blue night.',
    ],
    [
      'red-flowers-against-a-lime-wall',
      0,
      'Five clay pots stand against a white wall in hard sun, round leaves and red flowers climbing.',
    ],
    [
      'the-allotment-after-the-flood',
      0,
      'Withered vines against a rose wall stand over still grey water that holds them upside down.',
    ],
    [
      'vines-let-down-a-well',
      0,
      'Broad wet leaves and blue flowers hang down close by out of the black, thick as a curtain.',
    ],
    [
      'forced-flowers-on-the-black-piano',
      1,
      'Five full flower heads in their glasses by night, mirrored in a black lacquered lid.',
    ],
    [
      'clay-pots-at-the-orchard-window',
      1,
      'Round white and yellow heads open in old clay pots before a window full of spring green.',
    ],
    [
      'fern-frost-and-one-green-shoot',
      1,
      'White frost ferns fill a cold pane, two glasses stand empty, and one bulb puts up a green shoot.',
    ],
    [
      'leaded-window-of-the-seed-merchant',
      1,
      'A thicket of tall leaves and purple heads crowds a window of small leaded panes on a grey lilac day.',
    ],
    [
      'water-glasses-and-a-winter-sun',
      1,
      'A huge orange sun hangs in a frosted window and the bulbs stand black before it, their water glowing.',
    ],
  ],
  'reed-hall': [
    [
      'tide-let-into-the-long-house',
      0,
      'Water stands across the whole floor and doubles the arches into rings, a white sun at the open end.',
    ],
    [
      'ribs-raised-before-the-mats',
      0,
      'A hall half built: bare tall bows of reed in full noon, pale sky between them, shade on the floor.',
    ],
    [
      'on-my-back-under-the-bows',
      0,
      'Looking straight up from the floor, great bundles cross a deep blue night between bare lengths of reed.',
    ],
    [
      'three-pots-on-the-night-hearth',
      0,
      'Low by the floor, embers light three pots and the bundles over them, moonlight in the lattice.',
    ],
    [
      'bleached-bows-above-a-bright-lake',
      0,
      'Low grey bows span a wide pale floor from close overhead, bright water glinting at the far end.',
    ],
    [
      'full-moon-made-of-lattice',
      1,
      'Straight on, the lit end of the hall and its image in black water close into one gold round.',
    ],
    [
      'long-house-in-a-ground-blizzard',
      1,
      'A low hall lies under snow on white ice, flakes drifting by and the sun a small pale coin.',
    ],
    [
      'bare-hoops-over-rose-water',
      1,
      'Only the tall hoops of a hall stand in a rose evening, their images making a chain of rings.',
    ],
    [
      'hall-behind-hall-in-saffron-haze',
      1,
      'Halls of reed lie one behind another in thick yellow haze, a boat going by between them.',
    ],
    [
      'poling-home-through-rushes',
      1,
      'Close by, tall plumed rushes and a dark boat at green dusk, the hall only a shape far behind.',
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
  'ribbon-pole': [
    [
      'linen-wheel-on-new-snow',
      0,
      'Undyed ribbons turn like the petals of one great flower over a field of snow.',
    ],
    [
      'paper-lamps-round-the-pole-at-nightfall',
      0,
      'Strings of lit globes come down from a wreath to a ring of walkers on the dark grass.',
    ],
    [
      'red-thread-on-a-raked-court',
      0,
      'Thin red and white cords drawn straight as rays over bare sand at midday.',
    ],
    [
      'four-long-banners-at-low-sun',
      0,
      'Only four dancers hold broad cloths and lean back on them while the shadows grow.',
    ],
    [
      'harvest-tent-on-the-stubble',
      0,
      'Ribbons let down all round the pole make a tent of colour on a field of cut straw.',
    ],
    [
      'silver-cords-over-blue-snow',
      0,
      'By moonlight a few white walkers draw thin shining cords round a pole on the snow.',
    ],
    [
      'cloth-willow-in-a-white-sky',
      1,
      'Pale lengths of cloth hang from the top of the pole like branches under thin cloud.',
    ],
    [
      'rays-of-red-and-white',
      1,
      'Narrow straight ribbons, red then white, from one knot out into a hard blue day.',
    ],
    [
      'globes-let-up-into-the-dark',
      1,
      'Paper globes on strings, small at the pole and as large as moons where they pass overhead.',
    ],
    [
      'under-a-plait-like-a-trunk',
      1,
      'A braid as thick as a tree comes down before a burning evening and lets a few cloths go.',
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
  'ring-rubble': [
    [
      'last-amber-edge-of-the-giant',
      0,
      'Only a thin amber rim of the planet is lit, and the boulders before it are black against its glow.',
    ],
    [
      'broken-crystal-by-starlight',
      0,
      'Cut blue green crystals drift along a sharp line before a cloud of stars and one small crescent.',
    ],
    [
      'pearls-loose-in-a-bright-sky',
      0,
      'Smooth cream and rose pearls of every size float along a thin line in a rose grey morning sky.',
    ],
    [
      'glazed-stones-and-a-painted-giant',
      0,
      'A planet banded in teal, ochre and brick fills half the sky, and the stones before it are as bright.',
    ],
    [
      'rust-scree-hung-in-lit-dust',
      0,
      'A steep slope of red rock crosses the picture in thick glowing dust, under a wall of warm light.',
    ],
    [
      'pale-floes-parted-by-a-black-lead',
      1,
      'The sheet is cracked into white plates of ice that run to a bright edge, with one black way through.',
    ],
    [
      'beadwork-round-a-sleeping-planet',
      1,
      'Row on row of dark lustred beads curve away to a planet in its own night, under a cloud of stars.',
    ],
    [
      'scalloped-gorge-in-red-gravel',
      1,
      'A wide black lane with deep curled edges runs through grooves of rust and ochre at a low sun.',
    ],
    [
      'jade-and-plum-grooves-from-above',
      1,
      'High over the sheet, broad grooves of jade, plum, cream and coral bend away side by side like cloth.',
    ],
    [
      'ice-roof-over-a-pale-blue-deep',
      1,
      'The sheet hangs overhead like a combed ceiling of ice, and under it is nothing but pale blue light.',
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
  'river-plates': [
    [
      'tiles-behind-a-farm-stove',
      0,
      'A whole wall of white tiles, each a little askew, with one plum coloured valley painted across all of them.',
    ],
    [
      'one-red-dish-by-the-lamp',
      0,
      'A single scalloped dish painted in iron red leans on dark boards, half of it lost beyond the lamplight.',
    ],
    [
      'bathhouse-wall-of-scale-waves',
      0,
      'Square tiles in green and white carry a sea of ringed waves, and one bare moon over it.',
    ],
    [
      'celadon-octagons-in-the-rain',
      0,
      'Eight sided jade tiles with squares of bare plaster between them, and rain over a river in smoky blue.',
    ],
    [
      'petal-dishes-for-a-spring-table',
      0,
      'Scalloped dishes stand close in a limewashed rack, painted with rose hills, a sage river and olive reeds.',
    ],
    [
      'ginger-jars-on-a-winter-sill',
      1,
      'Lidded jars of three heights stand in bright snow light, white hills round every one of them.',
    ],
    [
      'moons-inside-a-wave-bowl',
      1,
      'One looks down into a wide bowl where ringed waves fill the bottom and six walls, under bare moons.',
    ],
    [
      'black-jar-with-gilded-hills',
      1,
      'A black jar with a wavy gilded collar stands by a red clay wall, its ridges and its strait in dull gold.',
    ],
    [
      'vermilion-cliffs-an-inch-away',
      1,
      'So near the glaze that the brush shows, red cliffs with bare tops stand over a wide pale strait.',
    ],
    [
      'flat-sided-jar-in-green-rain',
      1,
      'Rain drives across a jar of twelve flat sides, its copper green river risen over the banks by lamplight.',
    ],
  ],
  'rolled-show': [
    [
      'paper-waves-round-a-lighthouse',
      0,
      'Close to the paper: scallops of blue tissue sea roll by under a moon, a ship, a light on a rock.',
    ],
    [
      'lit-box-far-out-in-snow',
      0,
      'Small under the stars, the lit paper window and a few bales stand alone in a field of blue snow.',
    ],
    [
      'round-pane-of-red-maple-hills',
      0,
      'In a warm lit barn a round paper window shows red hills and one great tree still in leaf.',
    ],
    [
      'black-firs-on-bare-paper',
      0,
      'Cut black firs stand right before bare cream paper, grey peaks and a pale moon far behind them.',
    ],
    [
      'the-last-town-on-the-scroll',
      0,
      'A whole old town goes by in cut card, tower behind tower, every window lit, under coloured tissue.',
    ],
    [
      'paper-sea-under-real-stars',
      1,
      'Out in a night meadow the bulb hangs like a sun over rows of cut waves, a ship sailing to it.',
    ],
    [
      'rooftops-turned-from-behind',
      1,
      'From behind the box, black roofs and lit windows pass close before the bulb in cold blue light.',
    ],
    [
      'rollers-set-up-in-a-hayfield',
      1,
      'Out of doors in broad daylight: two rollers and a pale sheet in cut grass, flat country on it.',
    ],
    [
      'blue-winter-through-a-knot-hole',
      1,
      'A round hole in warm boards opens on pale blue hills, a fence and dry reeds, the bulb hung before it.',
    ],
    [
      'fox-on-the-rose-hill-road',
      1,
      'A pale road winds up a rose hill past one tree in leaf and a fox, the bulb burning low beside it.',
    ],
  ],
  'roost-rings': [
    [
      'flamingos-over-a-soda-crater',
      0,
      'Pink birds in wide rings over a round shore of white and ochre that holds a milky green lake.',
    ],
    [
      'wader-count-inked-by-hand',
      0,
      'A cream survey sheet from far above, its heights in thin lines, small rings of birds in four inks.',
    ],
    [
      'starlings-low-across-the-levels',
      0,
      'From close to the ground, black flocks stream over a red evening fen with its ditches shining.',
    ],
    [
      'ember-moths-on-a-black-delta',
      0,
      'Glowing specks rise in broken rings over a delta at night, its many channels a little less dark.',
    ],
    [
      'one-heronry-in-cold-mountains',
      0,
      'A single slow ring of grey birds hangs over blue snow ranges and a long inlet, the air quite still.',
    ],
    [
      'eye-of-a-white-cyclone',
      1,
      'From overhead at night, pale grains wind in two great arms round a black and open eye.',
    ],
    [
      'iron-dust-round-a-dead-crater',
      1,
      'Two fronts of dark red dust cross the broken rim of an old crater on an orange planet.',
    ],
    [
      'showers-among-the-skerries',
      1,
      'A blue sea with pale islands, dark showers trailing over it and a green shore under a white horizon.',
    ],
    [
      'hail-on-the-sheep-fells',
      1,
      'Big white stones fall in a tight bow on steep green hills, a dark inlet lying under them.',
    ],
    [
      'squall-line-on-a-night-chart',
      1,
      'White lines on deep blue: a coast drawn by its heights, a straight squall crossing in open circles.',
    ],
  ],
  'root-bridge': [
    [
      'root-crossing-over-the-cloud-floor',
      0,
      'One hanging bridge comes out of nothing above a white floor of cloud, sharp peaks and a low sun.',
    ],
    [
      'red-canyon-with-a-green-pool',
      0,
      'Old thick roots hang across a canyon of banded red stone in clear dry light, green water below.',
    ],
    [
      'red-forest-round-the-old-roots',
      0,
      'Every tree in the gorge is in rose red leaf, the old bridge sagging close by, shaggy with long hair.',
    ],
    [
      'crossing-in-the-first-heavy-snow',
      0,
      'Slow flakes fall through a white forest, a red umbrella halfway over on an old shaggy root bridge.',
    ],
    [
      'seven-bridges-by-one-moon',
      0,
      'Bridge behind bridge hangs across a deep blue gorge under a round moon, hair roots on the nearest.',
    ],
    [
      'causeway-to-the-morning-peaks',
      1,
      'A plaited path with no roof runs out over sunlit cloud toward blue peaks and a pale round sun.',
    ],
    [
      'woven-burrow-ending-in-dusk',
      1,
      'Roots close wholly round the path, a dark woven burrow with a disc of gold light at the far end.',
    ],
    [
      'snowlight-through-a-ribbed-hall',
      1,
      'A wide hall of black ribs and white frosted stones, snow falling thick between them.',
    ],
    [
      'bare-way-between-the-painted-cliffs',
      1,
      'An open plait of roots and flat stones leads over turquoise water between banded cliffs.',
    ],
    [
      'glow-in-the-midnight-ribs',
      1,
      'Deep night inside the hall of old roots, violet and teal light on the ribs, a moon at the end.',
    ],
  ],
  'roped-pines': [
    [
      'lit-tents-over-a-black-pond',
      0,
      'By moonlight every cone is closed with cloth and glows amber, plum and teal, twice over in the water.',
    ],
    [
      'petals-down-on-the-spring-pond',
      0,
      'Low wide trees stand in rose bloom on green banks, and petals drift down to a blue pond.',
    ],
    [
      'bare-boughs-in-driven-snow',
      0,
      'Only limbs and twigs under the ropes, seen close, all grey in hard snow going by aslant.',
    ],
    [
      'half-frozen-pond-at-blue-noon',
      0,
      'Tall narrow pines heaped with snow stand over a dark pond with rafts of white ice, under a blue sky.',
    ],
    [
      'lamps-hung-for-the-last-warm-evening',
      0,
      'Strings of small lamps go down every rope on a red autumn evening, with leaves coming down.',
    ],
    [
      'lamps-strung-up-into-the-dark',
      1,
      'Looking up on a blue night, rows of small coloured lamps climb the ropes to the tip of the pole.',
    ],
    [
      'under-the-patched-cloth-at-noon',
      1,
      'Sun comes through wedges of brick, mustard, indigo and cream cloth behind a bare black tree.',
    ],
    [
      'white-bloom-on-a-spring-sky',
      1,
      'Overhead thick clouds of white blossom hang on dark limbs before a clean blue sky.',
    ],
    [
      'tip-of-the-pole-in-white-fog',
      1,
      'Very near the top: a few grey plates of needles and pale ropes that go out into nothing.',
    ],
    [
      'bare-twigs-on-a-copper-evening',
      1,
      'The tree is all limbs and fine twigs, black on a copper sky, and the ropes meet high in a corner.',
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
  'row-of-weights': [
    [
      'iron-shot-over-fresh-snow',
      0,
      'Black iron balls hang from a long beam over a field of snow, and their shadows follow them.',
    ],
    [
      'gourds-under-a-desert-beam',
      0,
      'A few great pale gourds swing under a beam in the open, their shadows crossing the red ground.',
    ],
    [
      'copper-drops-in-a-slatted-barn',
      0,
      'Evening comes through a barn wall in slits, and a file of copper drops hangs in the stripes.',
    ],
    [
      'three-moons-in-a-blue-corridor',
      0,
      'From high in an empty hall by moonlight: a few great dark globes over boards as still as water.',
    ],
    [
      'shadows-on-rose-plaster',
      0,
      'Chalk white weights hang along a rose wall, and their shadows swing in its bright patches of sun.',
    ],
    [
      'gongs-in-a-slate-gallery',
      0,
      'Flat dark gongs float in steps down a slate gallery, under one long window full of white sky.',
    ],
    [
      'lamps-let-down-to-a-loch',
      1,
      'A garland of lamps on long cords dips to still black water, a moon and its double beside it.',
    ],
    [
      'paper-moons-in-the-palm-house',
      1,
      'Paper globes hang in a glass house at first light, the shrubs outside it dark against the sky.',
    ],
    [
      'amber-drops-down-a-red-saloon',
      1,
      'A close file of long amber drops goes away down a deep red room, swaying almost as one.',
    ],
    [
      'bulbs-across-a-green-tank-hall',
      1,
      'Seven great clear bulbs hang near across a green black hall, each with a thread of light in it.',
    ],
  ],
  'sail-caravan': [
    [
      'wheels-through-a-skin-of-rain',
      0,
      'A wide pan under a finger of rain water: pale sails roll far off on their own reflections.',
    ],
    [
      'under-the-rust-brown-mainsail',
      0,
      'One patched sail of rust, plum and ochre cloth fills the sky, the dusk sun burning through it.',
    ],
    [
      'black-gravel-below-the-mesas',
      0,
      'A lone patched square sail lights the black gravel, flat-topped rocks behind on a windy blue day.',
    ],
    [
      'six-tents-rolling-in-a-dust-wind',
      0,
      'Six pointed sails abreast, faint as paper cut-outs in an ochre wind of dust.',
    ],
    [
      'carts-counted-from-a-kite',
      0,
      'From high over cracked red clay, carts with dyed sails wind away in one long bend.',
    ],
    [
      'fir-shore-on-a-pewter-day',
      1,
      'One gaff sail on a white bay, and black firs along the shore that fade into snow light.',
    ],
    [
      'regatta-under-the-white-peaks',
      1,
      'Six boats run level over rose coloured ice, a wall of snow mountains catching the last sun.',
    ],
    [
      'bottle-green-ice-from-the-masthead',
      1,
      'From a masthead by night: clear green ice cut with white cracks, and square sails down in it.',
    ],
    [
      'lost-in-the-frost-smoke',
      1,
      'Four thin sails fade into pale blue frost smoke, a low gold sun laying its track on the ice.',
    ],
    [
      'lantern-at-the-foot-of-a-plum-sail',
      1,
      'A lantern glows at the foot of one great sail banded plum and peach, stars and small boats past it.',
    ],
  ],
  'salt-steps': [
    [
      'dye-pits-above-the-tannery',
      0,
      'Great hand-built vats of madder, indigo, weld and chalk step up a hill, each rim stained by its own.',
    ],
    [
      'seedling-steps-brim-full',
      0,
      'Green banked terraces curl round a wet valley and hold the morning sky, haze lying in the bend.',
    ],
    [
      'cinder-cone-with-ember-basins',
      0,
      'Black rock steps hold pools that burn orange and crimson from inside, night all round them.',
    ],
    [
      'ruled-pans-at-white-noon',
      0,
      'Straight narrow pans run up the slope like ruled paper, nearly all of them dry and blinding white.',
    ],
    [
      'moon-in-four-hundred-basins',
      0,
      'Seen from above by moonlight, hundreds of small jade basins lie in silver lace down the hillside.',
    ],
    [
      'heaps-of-ground-colour-for-sale',
      1,
      'Cones of ochre, indigo, rose and moss stand on both sides of a pale way with a mill at its end.',
    ],
    [
      'needles-in-the-standing-flood',
      1,
      'Tall thin white peaks stand scattered in still jade water, each on its own reflection, no one near.',
    ],
    [
      'slag-hills-after-the-night-shift',
      1,
      'Steep black heaps veined with red and gold stand on both sides of dark water under a dim sky.',
    ],
    [
      'small-mounds-on-a-white-lake',
      1,
      'From high up, low soft mounds lie about on a bare white crust under an almost white sky.',
    ],
    [
      'rose-peaks-before-the-rain',
      1,
      'Huge pink heaps stand up out of wine red water at evening, violet and orange cloud behind.',
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
  'seen-through': [
    [
      'spire-shells-in-a-tray',
      0,
      'Nine tall turret shells stand side by side on white, rose, sage and slate, their stairs showing.',
    ],
    [
      'urchins-glowing-on-black-film',
      0,
      'Round urchin shells lie over one another on black film, pale blue, every row of pores a thread.',
    ],
    [
      'the-coil-in-a-honey-window',
      0,
      'A shell of many tight turns fills an amber pane with the low sun behind it, dark to the heart.',
    ],
    [
      'many-films-of-one-shell',
      0,
      'One wide open shell is taken on many films laid together on the light box, some printed black.',
    ],
    [
      'one-drawn-horn-above-its-double',
      0,
      'A single open shell in bare pen line rests on still water, its lines broken in the ripples.',
    ],
    [
      'wide-open-blooms-before-the-lamp',
      1,
      'Flowers turned full to us, ring on ring of rose and amber petals, lie against a pale sheet of light.',
    ],
    [
      'bracken-uncurling-in-first-light',
      1,
      'Fern fronds lean together, each tip still a tight curl, green against a soft gold glow.',
    ],
    [
      'night-tulips-at-a-black-pool',
      1,
      'Pale slim tulips stand white on black at the edge of a pool that gives them back broken.',
    ],
    [
      'bulbs-lifted-and-laid-on-mint',
      1,
      'A row of small flowers with leaf, bulb and root, printed in violet and orange on mint.',
    ],
    [
      'seed-pods-printed-white-on-blue',
      1,
      'The petals are gone: a few seed pods stand close up, seeds in rows, pale on a deep blue sheet.',
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
  'sleeper-berth': [
    [
      'forehead-to-the-cold-glass',
      0,
      'The face at the window: a silver sea under a full moon runs beside the line all night.',
    ],
    [
      'enamel-cabin-at-snow-light',
      0,
      'A small cabin of cream enamel in the first pink daylight, snow falling past and lying on the sill.',
    ],
    [
      'louvre-bars-over-green-hide',
      0,
      'Moonlight comes through a shutter in hard bars and bends over a wall of green buttoned leather.',
    ],
    [
      'glass-car-over-the-high-pass',
      0,
      'A bed under a roof of panes: snow mountains fill the glass from wall to wall, and firs rush past.',
    ],
    [
      'copper-sunrise-beside-the-berth',
      0,
      'A low sun over the sea fills a wide window, and the wood, the blanket and the net turn to copper.',
    ],
    [
      'plush-runner-at-knee-height',
      1,
      'A child looks down a red dotted runner between green leather walls to one amber lamp at the end.',
    ],
    [
      'breakfast-side-of-the-bay',
      1,
      'Wide panes turned to a pink bay at sunrise, its road of light lying over cream walls.',
    ],
    [
      'dome-car-in-a-blizzard',
      1,
      'Snow whirls over the whole glass vault of a corridor and drifts up against its windows.',
    ],
    [
      'ochre-noon-through-louvres',
      1,
      'A hot day through louvres: rungs of sun climb the wall and the carpet of an empty corridor.',
    ],
    [
      'slow-train-through-grey-firs',
      1,
      'Wide panes full of blue mist: grey firs pass one after another, snow ridges and now and then a lamp.',
    ],
  ],
  'slice-of-country': [
    [
      'a-shaving-of-snowed-farmland',
      0,
      'A thin shaving of a snowed valley, small houses and bare hedges on it, hung over blue dusk paper.',
    ],
    [
      'harbour-town-on-a-long-cut',
      0,
      'A long straight cut through a bay: small houses round blue water, rust and ochre beds below.',
    ],
    [
      'rust-dunes-down-to-the-bedrock',
      0,
      'A slim deep column of rust and plum beds under dunes and craters, on red clay paper.',
    ],
    [
      'night-wedge-of-a-mountain',
      0,
      'One narrow wedge of a high mountain hangs by night, its farm windows lit, its beds bent double.',
    ],
    [
      'october-from-the-buzzard',
      0,
      'Looking nearly straight down on gold fields and rust woods round a looped river.',
    ],
    [
      'crumpled-beds-close-to',
      0,
      'Nose to the cut: teal, coral, cream and ink beds crumpled like cloth and broken by one fault.',
    ],
    [
      'hot-spring-under-pale-stone',
      1,
      'A cone of pale stone in a shallow sea, a turquoise cave of water underneath and steam above.',
    ],
    [
      'green-island-down-to-its-root',
      1,
      'A green island in a shallow sea on a slab of folded grey beds, its red root still warm below.',
    ],
    [
      'red-streams-off-a-night-cone',
      1,
      'Night from high up: red streams find their way down a cone, the chamber glowing in its cut side.',
    ],
    [
      'snow-cone-with-a-small-hot-root',
      1,
      'A slim block out of a snow field: a steep white cone, level grey beds and a little coral heart.',
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
  'stage-ghost': [
    [
      'tall-clock-in-the-snowfield',
      0,
      'A table, a tall clock and a pale bare tree stand out in a blue snowfield under low hills.',
    ],
    [
      'lilac-on-the-empty-boards',
      0,
      'One great jar of lilac glows on empty boards before black drapes, warm as gaslight.',
    ],
    [
      'aviary-above-the-rose-parlour',
      0,
      'In an emptied rose parlour great pale cages hang at every height about a bare tree and one jar of lilac.',
    ],
    [
      'white-orchard-in-the-ballroom',
      0,
      'Pale trees in leaf stand in ranks on a dark ballroom floor at night, blue to their very tips.',
    ],
    [
      'bare-tree-in-brown-ink',
      0,
      'On cream paper a bare tree, a cage and a jar of flowers are drawn in brown ink.',
    ],
    [
      'supper-left-in-red-country',
      0,
      'Pale weeping trees stand about a table, a chair and a tall clock in wide red country at dusk.',
    ],
    [
      'lamp-beams-in-the-velvet-pit',
      1,
      'Down in a velvet pit the white tree lies slantwise between lamps and sends its light up.',
    ],
    [
      'theatre-cut-in-half-on-paper',
      1,
      'A whole theatre is cut through on pale paper, its stage, pit and glass drawn in blue ink.',
    ],
    [
      'glass-stood-up-in-green-gloom',
      1,
      'The glass stands almost upright, and in green gloom behind it a tree and many cages wait.',
    ],
    [
      'little-stage-in-full-gaslight',
      1,
      'On a small gaslit stage papered in green, a tree, a cage and a lilac stand that are really in the pit.',
    ],
  ],
  'stained-sand': [
    [
      'amber-swells-among-red-dunes',
      0,
      'Wave behind wave of amber and wine glass stands in red sand, two clear rounds over them, dunes behind.',
    ],
    [
      'glass-leaves-in-white-fog',
      0,
      'A wood of green leaves of glass stands in pale sand, and the far ones are lost in a white sea fog.',
    ],
    [
      'hoops-of-moonlight-on-black-sand',
      0,
      'Clear hoops and rounds with bright rims wind away over black wet sand, and the moon is all the light.',
    ],
    [
      'striped-street-seen-from-the-wall',
      0,
      'From high up, slabs, spires and combs banded with cream make a toy street, its shadows striped too.',
    ],
    [
      'one-butter-round-and-two-rings',
      0,
      'Only a butter yellow round, two rings and a ball stand on a great pale sand, with dunes beyond.',
    ],
    [
      'giants-in-the-pool-at-daybreak',
      1,
      'Enormous sheets of rose, sea green and honey glass stand over the eye in a still pool at daybreak.',
    ],
    [
      'lit-slabs-down-a-drowned-street',
      1,
      'Two rows of amber and blue slabs stand in black water at night with a moon low between them.',
    ],
    [
      'blue-swells-run-in-with-the-tide',
      1,
      'Swells of blue glass stand in a running tide laced with foam, two blue rounds rising out of them.',
    ],
    [
      'three-red-leaves-on-a-lilac-flood',
      1,
      'Three tall red leaves stand in a lilac flood, doubled in it, with a low sun and hills along its far side.',
    ],
    [
      'long-hoops-of-shade-after-the-ebb',
      1,
      'From above, rounds, rings and half rounds stand on dry sand and lay long stripes of colour toward the eye.',
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
  'steam-line': [
    [
      'noon-train-across-the-rice-green',
      0,
      'A dark train on a tall trestle crosses green flats and bright pools under a clear day sky.',
    ],
    [
      'late-train-under-the-white-peaks',
      0,
      'Below huge snow peaks at dusk a short lit train crosses a lake, its windows broken on the water.',
    ],
    [
      'stone-arches-in-a-salmon-dawn',
      0,
      'Tall stone arches stand in salmon mist at dawn, and the train that crosses them trails its steam.',
    ],
    [
      'iron-bows-above-the-spring-flood',
      0,
      'Close to the train at night, iron bows leap over its amber windows and over the flood beneath it.',
    ],
    [
      'stubble-smoke-and-a-harvest-train',
      0,
      'Close to a harvest train on its low line: straw coloured fields, a pale river and steam lying down behind.',
    ],
    [
      'wet-rails-out-across-a-lagoon',
      1,
      'Wet rails on a low bank swing out over a blue green lagoon, the sun on the water and roofs on its far side.',
    ],
    [
      'steam-let-off-under-the-great-glass',
      1,
      'Inside a vast train hall, light comes down through sooty glass onto white steam, arches and wet rails.',
    ],
    [
      'thirty-rails-under-new-snow',
      1,
      'From high up, many rails fan out over clean new snow, with red signal lamps and a little steam below.',
    ],
    [
      'two-red-lamps-above-a-brown-cutting',
      1,
      'Near red signal lamps at sundown, with steam below them, roofs behind and rails bending off between banks.',
    ],
    [
      'fine-lattice-over-a-moonlit-sound',
      1,
      'Through a fine iron lattice at night, a moon path lies on the sound and a lit train runs out along it.',
    ],
  ],
  'steep-balconies': [
    [
      'slot-of-sky-between-white-hives',
      0,
      'Straight up between chalk white walls thick with small round balconies, to a long slot of pale blue sky.',
    ],
    [
      'galleries-painted-for-the-feast',
      0,
      'Long galleries in plum, ochre and sea green run down a court to its end, big washing across the top.',
    ],
    [
      'snow-on-every-rail-of-the-well',
      0,
      'From the foot of a narrow well of houses, snow on every rail and ledge, and a thread of white sky.',
    ],
    [
      'lamps-going-on-up-the-brick-shaft',
      0,
      'At night the lit windows climb two brick fronts to a strip of dark blue sky straight overhead.',
    ],
    [
      'roses-over-every-rail-at-sundown',
      0,
      'Leaves and roses spill over the rails of a wide court, its walls gone apricot and pink at sundown.',
    ],
    [
      'creepers-in-a-lane-too-deep-for-sun',
      0,
      'Creepers hang from the rails of a narrow lane on a grey day, up to a pale house and a strip of white sky.',
    ],
    [
      'a-pool-where-the-yard-should-be',
      1,
      'Clear green water fills a yard of white houses, a small round garden in it and a raft of oranges.',
    ],
    [
      'fruit-cart-left-out-in-new-snow',
      1,
      'Close over a snowy court, a cart of fruit, a tree capped with snow and long blue shadows on white.',
    ],
    [
      'supper-lit-along-the-galleries',
      1,
      'From above on a blue night, long galleries cross the lit windows and a lamp shines on the round bed.',
    ],
    [
      'washing-hung-out-above-rose-roofs',
      1,
      'Over a court crossed with washing, rose and cream roofs reach one behind another into a hazy morning.',
    ],
  ],
  'step-well': [
    [
      'a-kite-over-the-white-tank',
      0,
      'From straight above, square within square of white stairs goes down to a small green pool.',
    ],
    [
      'glazed-court-turned-cornerwise',
      0,
      'Seen from above and turned to a diamond, tiers glazed teal, ochre, plum and cream ring the water.',
    ],
    [
      'moon-kept-at-the-bottom',
      0,
      'On a black night the pool far down gives off a pale blue light that climbs the lowest stairs.',
    ],
    [
      'last-water-in-a-red-quarry',
      0,
      'Down by what little water is left, two walls of red stairs meet in a corner and climb to a copper sky.',
    ],
    [
      'first-snow-on-the-bathing-steps',
      0,
      'A wide shallow pit filled high with grey green water, every step of it lined with snow.',
    ],
    [
      'noon-seen-from-the-cool-side',
      1,
      'From the shade of a gallery, between dark pillars, stairs blaze white across still green water.',
    ],
    [
      'lamps-along-the-water-galleries',
      1,
      'Close before storeys of dark arches on a blue night, lamps in the bays and again in the water.',
    ],
    [
      'moss-along-every-tread',
      1,
      'Pale green stairs edged with moss climb from dark water, seen between two pillars of a gallery.',
    ],
    [
      'turquoise-glow-through-the-arches',
      1,
      'At night the water shines turquoise and lights dark pillars from below, stairs rising beyond.',
    ],
    [
      'indigo-tiles-by-the-low-sun',
      1,
      'Galleries tiled in indigo, white and saffron stand in green water by low steps, under a pale rose sky.',
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
  'storm-eye': [
    [
      'towns-lit-under-a-moonlit-gale',
      0,
      'A grey blue wheel of cloud crosses a dark coast by night, and strings of amber towns show between its arms.',
    ],
    [
      'twin-gyres-over-a-jade-sea',
      0,
      'Two white wheels of cloud have met over deep green water and turn slowly about each other.',
    ],
    [
      'ochre-moon-with-a-single-eye',
      0,
      'A whole small world hangs in black space, half of it in shade, and one dust storm looks out of its lit side.',
    ],
    [
      'white-crater-straight-below',
      0,
      'From straight overhead one unbroken sheet of pale cloud winds down into a great round blue hole.',
    ],
    [
      'soot-wheel-on-a-milk-ocean',
      0,
      'Charcoal cloud is wound as tight as a spring over a pale sea, drawn almost in black and white.',
    ],
    [
      'polar-low-over-cracked-floes',
      0,
      'A small torn storm, rose on its lit side, drags thin arms along the edge of a world of broken ice.',
    ],
    [
      'sun-in-the-gate-of-the-storm',
      1,
      'The ring of cloud has broken on one side, and a low red sun stands in the gap and lies on the sea.',
    ],
    [
      'one-gull-over-the-mossy-crag',
      1,
      'A dark rock with green on its shoulders stands in glassy water, white cloud heaped all round, one bird above.',
    ],
    [
      'stars-down-a-well-of-cloud',
      1,
      'Night on the floor of the eye: smooth dark shelves close round, and a moon and a few stars stand in the hole.',
    ],
    [
      'pan-ice-beneath-a-chalk-wall',
      1,
      'Round plates of ice fill the still water to the foot of a pale wall, everything white, grey and faint blue.',
    ],
  ],
  'straw-walkers': [
    [
      'rush-cloaks-at-low-water',
      0,
      'Tall walkers of green rushes wade over a grey gold flat, each above a long reflection of itself.',
    ],
    [
      'one-left-out-under-the-moon',
      0,
      'A single round stack stands on a moonlit field, its open straw edged in silver, four others tiny far off.',
    ],
    [
      'five-abreast-in-a-white-out',
      0,
      'Five thin walkers come side by side out of thick falling snow, nearly all of them the colour of the sky.',
    ],
    [
      'bracken-men-over-the-stubble',
      0,
      'Great round stacks of rust red bracken go off in file over the cut rows towards a low sun.',
    ],
    [
      'wound-figures-on-plum-cloth',
      0,
      'Five figures wound round like rope stand on a plain plum ground: ochre, sage, clay, bone and plum.',
    ],
    [
      'linen-coats-out-in-first-snow',
      1,
      'Four tall coats of bleached strips turn in falling snow on slate blue ground, a fifth gone nearly blue.',
    ],
    [
      'one-skirt-opened-on-ochre',
      1,
      'A single dancer of brick red strips whirls on a bare ochre ground, the coat flung out as wide as a bell.',
    ],
    [
      'ragged-elders-below-a-lit-window',
      1,
      'Broad figures in rags wound tight stand in a dark yard, a window the one warm thing in the night.',
    ],
    [
      'dyed-tops-in-a-threshing-yard',
      1,
      'From a loft one looks down on five round coats of every dye, spun out over trampled golden straw.',
    ],
    [
      'five-wading-a-flooded-lane',
      1,
      'Five ragged coats in a row stand up to the ankle in rose water, and each hangs head down below itself.',
    ],
  ],
  'street-carpet': [
    [
      'paper-lamps-over-tall-houses',
      0,
      'A deep street by night with round paper lamps strung from wall to wall, and a dark carpet under their glow.',
    ],
    [
      'one-long-rug-across-the-plateau',
      0,
      'The houses are gone: a bright woven-looking strip runs over dry grass straight towards a single blue mountain.',
    ],
    [
      'swept-clear-after-the-first-snow',
      0,
      'White roofs and a white street at dawn, and down the middle the carpet has been brushed clean again.',
    ],
    [
      'red-dust-from-door-to-door',
      0,
      'Close to the ground, a hot red and orange carpet fills the lane as the last sun comes over the roofs.',
    ],
    [
      'limewash-street-in-thin-fog',
      0,
      'White walls on both sides, and a pale carpet of round rose medallions running straight into the fog.',
    ],
    [
      'puddles-the-morning-of-the-feast',
      0,
      'Rain has just gone through; the dark stones hold pieces of the sky on both sides of a narrow soaked carpet.',
    ],
    [
      'little-glass-flames-either-side',
      1,
      'Seen from above in the dark, two rows of small lights run along a pale carpet of dark rounds, hardly trodden.',
    ],
    [
      'footprints-through-dyed-snow',
      1,
      'Snow fell on the colours in the night, and where people have walked the rose and rust red come through.',
    ],
    [
      'scarlet-dust-on-black-setts',
      1,
      'Nearly all of the carpet has been walked away; what is left is a red bloom between black stones.',
    ],
    [
      'rain-pools-round-cream-medallions',
      1,
      'Evening after rain: pools of pale sky lie on the stones beside a slanting cream carpet of round medallions.',
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
  'sugar-hills': [
    [
      'meringue-peaks-at-first-sun',
      0,
      'White whipped peaks stand like far mountains in a mauve dawn, warm on the side of the first sun.',
    ],
    [
      'cocoa-moulds-by-one-lamp',
      0,
      'Fluted cakes of dark cocoa run with gloss on a dark tray in the light of one warm lamp.',
    ],
    [
      'iced-rings-adrift-in-the-dark',
      0,
      'Iced rings and one red cherry hang in black space among grains of sugar, like small worlds.',
    ],
    [
      'islands-in-rose-syrup',
      0,
      'Low iced islands lie in a still rose syrup at evening, each with its own likeness under it.',
    ],
    [
      'striped-buns-on-a-checked-cloth',
      0,
      'From above, buns combed with white stand on a checked cloth in the bright blue of a morning.',
    ],
    [
      'one-long-drip-of-caramel',
      0,
      'Seen from a crumb away, one long drip of caramel hangs down the brown side of a bun.',
    ],
    [
      'shelf-upon-shelf-in-the-cellar',
      1,
      'In a boarded cellar jars stand shelf over shelf, and the sweets in them glow of themselves.',
    ],
    [
      'great-jar-before-the-bay',
      1,
      'One great jar of sea coloured sweets stands in an open window, the sun low on the bay behind.',
    ],
    [
      'slim-jars-against-a-morning-bay',
      1,
      'Slim jars of blue and white sweets stand on glass shelves, the first sun over the bay between them.',
    ],
    [
      'plum-balls-and-a-night-street',
      1,
      'Great plum and bottle green balls crowd their jars, a lit window in the blue street behind them.',
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
  'sun-yard': [
    [
      'two-moons-over-the-great-stair',
      0,
      'Under two moons a great stair and its ring stand half drifted over with cold blue sand.',
    ],
    [
      'white-stair-straight-up',
      0,
      'Seen straight on, a whitewashed stair climbs out of the yard into deep noon blue, a ring at each hand.',
    ],
    [
      'ivy-up-the-great-stair',
      0,
      'Ivy has the wall and grass has the yard, and cypresses stand in green haze beyond the ring.',
    ],
    [
      'snow-on-the-hour-steps',
      0,
      'From high over the yard, fresh snow lies on the paving and the steps, and the shade on it is blue.',
    ],
    [
      'brass-arc-by-the-dark-wall',
      0,
      'Close by, a quarter ring of brass curves up by a wall of black stone in the last red sun.',
    ],
    [
      'drowned-stair-in-the-first-mist',
      0,
      'A tall stair and its rings stand in still water and hang doubled in it, trees far off in the mist.',
    ],
    [
      'bowl-brimming-at-sundown',
      1,
      'Still water fills the bowl to its marks and lies over the yard, holding a whole red sunset.',
    ],
    [
      'down-in-the-chequered-bowl',
      1,
      'Inside the bowl by moonlight, its ruled and chequered slope goes up to a strip of deep sky.',
    ],
    [
      'one-round-eye-in-the-grass',
      1,
      'From above, one chequered bowl of marble lies in rough grass like an eye, half lit and half in shade.',
    ],
    [
      'sundial-far-out-on-red-sand',
      1,
      'Far out on rippled red sand a bowl and its stair stand small and alone under a pale high sky.',
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
  'thin-air': [
    [
      'crown-over-a-rust-desert',
      0,
      'From straight above a disc of blue and cream gores drifts over bare rust ground, small pale ones round it.',
    ],
    [
      'bunch-let-go-into-the-dark',
      0,
      'Nineteen small balloons on one knot of strings have risen to where the sky is black, over the curved sea.',
    ],
    [
      'striped-fruit-in-broad-day',
      0,
      'A squat lobed balloon of cream and brick gores hangs in a pale blue day over a white floor of cloud.',
    ],
    [
      'smoke-film-under-green-curtains',
      0,
      'A black bag of film, far off and slack, hangs among hanging green light over towns lit on the night side.',
    ],
    [
      'gold-bag-across-the-sunset-line',
      0,
      'So near that its crown is out of sight, a gold film fills the left of a plum sky over clouds lit from under.',
    ],
    [
      'launch-below-the-pale-teeth',
      1,
      'A low black bubble and its limp black train lie before a wall of sharp white peaks under deep blue.',
    ],
    [
      'red-bag-on-a-white-noon',
      1,
      'One red balloon, squat and gored, climbs off its long red train, alone on snow and sky of pale blue white.',
    ],
    [
      'party-tethered-on-red-clay',
      1,
      'A bunch of small round balloons strains on its strings over bare clay at sunrise, three people by the box.',
    ],
    [
      'seven-sent-up-through-sea-mist',
      1,
      'A balloon of white and sea green gores stands out of level mist at sunrise, and seven are up already.',
    ],
    [
      'lamp-watch-on-a-polar-night',
      1,
      'One red lamp and a pale slack bubble keep watch on dark snow, green light moving over peaks and stars.',
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
  'tiny-crowd': [
    [
      'skaters-out-before-the-thaw',
      0,
      'Little people skate on a great blue green lake of scratched ice, red barns and bare trees on its far shore.',
    ],
    [
      'tulip-beds-on-a-blowing-day',
      0,
      'Beds in flower run straight to the sky in rose, gold, cream and wine, with specks of people on the paths.',
    ],
    [
      'umbrellas-out-on-the-black-flats',
      0,
      'Close by on black wet flats everybody walks under a rust, cream, yellow or sage umbrella.',
    ],
    [
      'fair-on-the-black-sands-by-night',
      0,
      'On black sand at night striped tents glow from inside and lanterns move between them to the sea.',
    ],
    [
      'last-gatherers-on-a-flooding-shore',
      0,
      'A red sky lies on the tide as it floods the flats, and a few last people walk in along the spits.',
    ],
    [
      'market-tents-on-a-straw-hill',
      1,
      'Striped tents stand all over a round straw yellow hill under a hard blue sky, a town along its top.',
    ],
    [
      'torches-down-the-hill-from-the-old-town',
      1,
      'Hundreds of torches come down a blue night hill from a town with its windows lit along the top.',
    ],
    [
      'sledges-home-under-pink-peaks',
      1,
      'A hollow of violet snow under peaks gone pink, the last few sledges on it and a long line going home.',
    ],
    [
      'green-alp-on-an-umbrella-day',
      1,
      'The snow is all but gone from a green slope below the peaks, and it is dotted with bright umbrellas.',
    ],
    [
      'one-hut-above-the-untrodden-snow',
      1,
      'A bare white hill in fog, grey firs, one hut smoking on its crest and a single line of people climbing.',
    ],
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
  'toy-railway': [
    [
      'lit-coaches-under-steep-snow',
      0,
      'On a blue night the small train goes round below steep snowed mountains, every window of it warm.',
    ],
    [
      'white-card-cut-in-contours',
      0,
      'A model not painted yet: hills of stacked white card, white trees, a white train, all in raking light.',
    ],
    [
      'flat-topped-rocks-from-the-rafters',
      0,
      'From up among the roof beams one sees banded tables of rock, bare yellow ground and the figure of eight.',
    ],
    [
      'islands-of-layered-paper',
      0,
      'Round islands of stacked coral, cream and teal paper stand in a painted sea that has no far shore.',
    ],
    [
      'one-lamp-over-the-branch-line',
      0,
      'All the room is dark but one round of lamplight, and the train comes into it past tall mossy trees.',
    ],
    [
      'footplate-over-a-misty-fen',
      1,
      'From the engine the rails run to a small bridge between green mounds and fen pools, into a pale grey mist.',
    ],
    [
      'rail-height-in-red-harvest-light',
      1,
      'With the eye down between the rails the dry ground glows, and steep ochre hills shut off a red sky.',
    ],
    [
      'looking-back-over-the-coaches',
      1,
      'Behind the roofs of the coaches a tunnel, a station and snowed hills draw off under a pale blue dusk.',
    ],
    [
      'headlamp-over-the-night-crossing',
      1,
      'The engine lamp lights the crossing and a short way of sleepers, with one lit station in the black beyond.',
    ],
    [
      'causeway-to-a-candied-coast',
      1,
      'From the engine the line crosses painted water to shores stepped in pistachio, rose, cream and plum.',
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
  'umbrella-square': [
    [
      'white-pawns-in-the-noon-court',
      0,
      'White sunshades stand evenly over a dark and cream chequered court, each beside its own round shade.',
    ],
    [
      'slack-tide-below-the-hotel',
      0,
      'Striped parasols in coral, navy and sand are carried along a hot beach while surf laces the corner.',
    ],
    [
      'a-dozen-callers-since-it-snowed',
      0,
      'A white square with a dozen umbrellas in it, the tram rails two grey strokes under the snow.',
    ],
    [
      'the-whole-stadium-walks-home-wet',
      0,
      'In blue dusk the square is packed edge to edge with dark bell umbrellas, all shining with rain.',
    ],
    [
      'pilgrims-over-apricot-sand',
      0,
      'A thin line of rose, ochre and wine coloured shades goes over bare rippled sand at sunrise.',
    ],
    [
      'snow-round-the-chestnut-seller',
      1,
      'A hushed ring of snowed-on umbrellas stands in amber shop light about one red one.',
    ],
    [
      'masked-dancers-on-plum-tiles',
      1,
      'Jewel coloured shades in wine, teal and gold crowd a plum and rose chequered floor by night.',
    ],
    [
      'pale-shades-under-cold-arc-light',
      1,
      'White umbrellas crowd silver on black wet stone round a gap where one dark red one waits.',
    ],
    [
      'paper-tops-round-a-shingle-fire',
      1,
      'Cream and vermilion shades gather in firelight on dark sand while the night sea comes up behind.',
    ],
    [
      'toadstools-about-a-scarlet-cap',
      1,
      'Brown, fawn and red domes like mushrooms press round one tall scarlet cap alone in a mossy glade.',
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
  'vapour-tracks': [
    [
      'high-trails-over-the-last-ridge',
      0,
      'White trails cross and come apart high over dark hills while the sky burns down behind them.',
    ],
    [
      'ink-let-into-warm-milk',
      0,
      'Threads of rust and brown ink spread and sink in a shallow bath of warm milk, seen from over it.',
    ],
    [
      'smoke-stems-in-an-ember-room',
      0,
      'Thin smokes stand up from a glowing floor and lean like grass at the bottom of a hearth.',
    ],
    [
      'coils-asleep-in-cold-mist',
      0,
      'A long curl or two turn in on themselves on a wide blue floor and fade.',
    ],
    [
      'struck-from-one-spark',
      0,
      'Every line leaps from one point on a black floor, each sound in a colour of its own.',
    ],
    [
      'sheet-of-night-plates',
      1,
      'Rows of small blue black plates, each with its own pair of curls in coloured beads.',
    ],
    [
      'copper-dish-at-the-eyepiece',
      1,
      'A round window in the dark, and in it wide copper coils winding slowly shut.',
    ],
    [
      'spirals-pressed-in-wet-clay',
      1,
      'Smooth grooves drawn in a warm slab and lit from one side, with two curls close to the eye.',
    ],
    [
      'stained-slide-on-a-black-bench',
      1,
      'A slide crowded with slanting threads in five dyes, lying whole on a dark table.',
    ],
    [
      'fan-thrown-over-a-blue-plate',
      1,
      'Fine dark lines open like a fan from the foot of a clear blue sheet.',
    ],
  ],
  'walking-village': [
    [
      'glasshouses-wading-home',
      0,
      'Five lit glasshouses full of leaves walk in a row through still black water under a clear night.',
    ],
    [
      'straw-domes-on-ribbed-sand',
      0,
      'Round straw huts trudge on short legs over pale dry sand in a flat white morning.',
    ],
    [
      'one-loft-crossing-the-sun',
      0,
      'A single tall narrow loft strides on long legs across a huge low disc of sun.',
    ],
    [
      'herd-below-the-snow-peaks',
      0,
      'A near shed and its herd wade by at the foot of sharp white peaks, over still meltwater.',
    ],
    [
      'long-barns-in-a-sea-fret',
      0,
      'Low long barns on stout legs come out of white fog and go back into it, window first.',
    ],
    [
      'shins-against-a-rust-sky',
      1,
      'From down in the mud only very long black legs are seen, crossing a burning red evening.',
    ],
    [
      'lone-hut-before-a-pocked-moon',
      1,
      'One lantern lit hut goes slowly across a vast silver moon risen straight out of the flat.',
    ],
    [
      'fernery-squatting-in-the-marsh',
      1,
      'A great glass fernery squats knee deep close by, green gold light spilling down on the water.',
    ],
    [
      'beehives-past-the-crags-at-night',
      1,
      'A file of straw beehives walks dry sand at nightfall, mauve crags and cold stars behind them.',
    ],
    [
      'towers-on-the-drowned-road',
      1,
      'Tall timber towers wade a still flood at first light, window and legs doubled under them.',
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
  'wax-loaf': [
    [
      'lantern-log-in-a-dark-kitchen',
      0,
      'A round log of wax glows from within on a dark bench, its cut end one great amber flower.',
    ],
    [
      'painted-headland-at-low-water',
      0,
      'A long wax headland runs out over a still grey sea, its painted end standing upside down in the water.',
    ],
    [
      'spring-hills-in-the-loaf',
      0,
      'Close to, the cut face is a country of green and yellow hills, a river and a ringed sun.',
    ],
    [
      'blue-flowers-under-snow-sky',
      0,
      'From high above, a pale round log and its slices lie on the bench, each a blue flower in white.',
    ],
    [
      'many-small-eyes-at-dusk',
      0,
      'In low red light a wide cut face glows, folded into mirrored eyes, leaves and rolls of plum and rust.',
    ],
    [
      'glowing-cards-stood-in-the-dark',
      1,
      'Thin slices stand up one behind the other in the dark, each lit through like coloured glass.',
    ],
    [
      'painted-floor-of-wax-tiles',
      1,
      'From above, slices lie apart in two rows on white like floor tiles, terracotta and deep sea green.',
    ],
    [
      'coins-of-violet-on-bright-paper',
      1,
      'Round slices lie over one another like coins on bright paper, a gold and violet flower in every one.',
    ],
    [
      'one-evening-told-in-slices',
      1,
      'Wide slices fan away across a dark table, the same hills and low sun a moment later in each.',
    ],
    [
      'great-eye-in-black-and-bone',
      1,
      'Seen close, one huge ringed eye of bone white looks up from a slab of black wax.',
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
  'wire-cabins': [
    [
      'ferry-cars-across-the-still-sound',
      0,
      'Round cars in soft colours ride over flat water, and each one hangs upside down again beneath itself.',
    ],
    [
      'trams-above-the-steaming-ridges',
      0,
      'After rain, one wooded ridge stands behind another with mist between, and long trams pass over them all.',
    ],
    [
      'last-car-before-a-huge-moon',
      0,
      'A single dark car slides across the face of a moon risen between stone needles over blue cloud.',
    ],
    [
      'two-lines-meet-over-red-cloud',
      0,
      'Two cables cross above heaped evening cloud, and close strings of cars pass each other all the way along.',
    ],
    [
      'one-car-in-a-white-nowhere',
      0,
      'A car hangs close by in white fog, a lattice mast wades in it, and round hills stand grey behind.',
    ],
    [
      'cars-home-over-the-steep-town',
      1,
      'A hillside of small houses with lamps in their windows, and the cars coming up over the roofs like lit rooms.',
    ],
    [
      'ink-firs-under-the-school-line',
      1,
      'A white winter noon with thick black firs on blank snow, and a short line of cars strung over it.',
    ],
    [
      'larches-turned-below-the-wire',
      1,
      'Gold larches and a few dark firs stand over brown grass, and grey spires close the valley under a clear day.',
    ],
    [
      'green-curtain-over-the-top-station',
      1,
      'Folds of green and violet light hang over bare hills, and a lone car crawls up towards the lit hut.',
    ],
    [
      'violet-dusk-with-a-milk-moon',
      1,
      'Round cars come down two wires through plum coloured mist while a great pale moon stands on the peaks.',
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
  'woven-walls': [
    [
      'five-speckled-eggs-in-new-cane',
      0,
      'Five great eggs lie on the coiled floor of a wide basket, with the sun coming through in stripes over them.',
    ],
    [
      'rain-kept-in-a-moonlit-creel',
      0,
      'Night water stands on the floor of a low basket and holds the moon and the thin uprights upside down.',
    ],
    [
      'roof-of-a-bark-beehive',
      0,
      'Inside a dark dome of broad black strands the day comes in as hundreds of small bright chinks.',
    ],
    [
      'slant-laths-against-a-fired-sky',
      0,
      'The wall is an open lattice of slanting strands, almost black, with a red evening burning through every gap.',
    ],
    [
      'crown-of-a-straw-hat-from-within',
      0,
      'Very fine pale straw, wound close and wide as a bowl, seen from above in soft white light.',
    ],
    [
      'hauled-dry-below-the-dunes',
      1,
      'A long trap lies dry on the stones; between its bars are sky, cloud and sand, and the mouth looks to the land.',
    ],
    [
      'net-floats-in-aquamarine',
      1,
      'Glass balls in soft blues, some still in their cord, hang among fish in clear water inside a wide trap.',
    ],
    [
      'bars-rotted-in-a-peat-burn',
      1,
      'An old trap in red brown water, half its bars gone, so that the stones of the bed show and fish go in and out.',
    ],
    [
      'white-mesh-in-chalk-water',
      1,
      'Peeled white rods cross in diamonds round a wide bright mouth, in milky blue water with pale fish.',
    ],
    [
      'one-light-at-the-end-of-the-creel',
      1,
      'Broad dark bars run together by night to one far small opening, and a single hoop catches the light.',
    ],
  ],
}
