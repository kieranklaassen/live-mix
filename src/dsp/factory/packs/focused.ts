// The packs about one thing in music, by their shelves: their names, so a host
// can list them. Their presets are fetched with the rest (./index).

import { type FactoryPack } from '../types'

export const FOCUSED_PACKS: readonly Pick<FactoryPack, 'id' | 'name' | 'description' | 'shelf'>[] =
  [
    {
      id: 'colour-note',
      name: 'The Colour Note',
      description:
        'A chord that needs one note from outside the key, and the voices that make it glow: pianos, strings, organ and bass.',
      shelf: 'harmony',
    },
    {
      id: 'mirror-of-d',
      name: 'The Mirror of D',
      description:
        'The white keys read the same up and down from D. Voices that open and close by equal steps either side of it, with a centre that holds still.',
      shelf: 'harmony',
    },
    {
      id: 'bells-held-open',
      name: 'Bells Held Open',
      description:
        'A bell is struck and other players step in on its partials, minor third and all, and hold the chord the metal began.',
      shelf: 'harmony',
    },
    {
      id: 'reeds-never-stop',
      name: 'Reeds That Never Stop',
      description:
        'Mouth-organ chords that breathe in and out without a gap: reeds, bellows and pipes where one voice always leads the others in.',
      shelf: 'harmony',
    },
    {
      id: 'suspension-chains',
      name: 'Suspension Chains',
      description:
        'A note is tied over, becomes a dissonance, leans and sinks: voices that swell into the clash and soften out of it, in chains.',
      shelf: 'harmony',
    },
    {
      id: 'hexatonic-poles',
      name: 'Hexatonic Poles',
      description:
        'Major and minor chords that share no note and change by half steps in every voice: smooth pads that turn without a seam.',
      shelf: 'harmony',
    },
    {
      id: 'falling-fifths',
      name: 'Falling Fifths',
      description:
        'Patterns that fall by fifths and by thirds and land a step lower each time: clear voices that keep their lines apart on the way down.',
      shelf: 'harmony',
    },
    {
      id: 'one-note-many-names',
      name: 'One Note, Many Names',
      description:
        'A high note is held while the root moves under it through pure intervals, so it is in turn fifth, third, seventh and eleventh.',
      shelf: 'harmony',
    },
    {
      id: 'falling-inner-line',
      name: 'Falling Inner Line',
      description:
        'One voice inside a held chord walks down by half steps while the rest stay: pianos that let the middle sing, strings and basses that darken it.',
      shelf: 'harmony',
    },
    {
      id: 'one-note-twelve-floors',
      name: 'One Note, Twelve Floors',
      description:
        'One held note asked to be twelve things: dark for a root, warm for a third, bright for a seventh, as the floor under it moves.',
      shelf: 'harmony',
    },
    {
      id: 'borrowed-light',
      name: 'Borrowed Light',
      description:
        'Chords borrowed from the parallel minor, and the plain ones round them: every voice comes lit and in shade, so the change of mode is a change of light.',
      shelf: 'harmony',
    },
    {
      id: 'rootless-over-pedal',
      name: 'Rootless over Pedal',
      description:
        'A pedal that never moves and chords above it that leave their own roots out: deep drones, and keys thin enough to float on them.',
      shelf: 'harmony',
    },
    {
      id: 'harmonic-twins',
      name: 'Harmonic Twins',
      description:
        'One chord stacked up the harmonic series and its twin hung down the subharmonic one: bright fused voices, and dark ones with the weight on top.',
      shelf: 'harmony',
    },
    {
      id: 'keys-come-round',
      name: 'Keys That Come Round',
      description:
        'Scales that come back to themselves after a whole step or a minor third: colours in glass, wood, wind and brass for harmony without a home.',
      shelf: 'harmony',
    },
    {
      id: 'axis-twins',
      name: 'Axis Twins',
      description:
        'Every sound has its reflection: what is warm, slow and left in one is cold, quick and right in the other, as minor mirrors major across an axis.',
      shelf: 'harmony',
    },
    {
      id: 'undecided-third',
      name: 'The Undecided Third',
      description:
        'A fifth that stands still and a third that drifts between minor and major without ever settling: one slow voice against a firm frame.',
      shelf: 'harmony',
    },
    {
      id: 'seconds-as-home',
      name: 'Seconds Held as Home',
      description:
        'Two voices a second apart and no wish to resolve: close, plain throat and reed tones where the beating is the rest.',
      shelf: 'harmony',
    },
    {
      id: 'table-song-thirds',
      name: 'Table Song Thirds',
      description:
        'Three-part singing over a table, thirds between minor and major, fifths wide and true: chest voices and what sounds like them.',
      shelf: 'harmony',
    },
    {
      id: 'three-pedals',
      name: 'Three Pedals',
      description:
        'Pedal steel with each pedal as a voice: pressed late, slowly or not all the way, with the strings that ring on while one of them moves.',
      shelf: 'harmony',
    },
    {
      id: 'lament-grounds',
      name: 'Lament Grounds',
      description:
        'A bass that steps down a fourth and begins again, as laments have for four hundred years, with what may be laid over it.',
      shelf: 'harmony',
    },
    {
      id: 'dominant-ladders',
      name: 'Dominant Ladders',
      description:
        'Guide tones that fall by half steps over roots that fall by fifths: swelling voices for the thirds and sevenths, steady ones for the ground.',
      shelf: 'harmony',
    },
    {
      id: 'cadence-cards',
      name: 'Cadence Cards',
      description:
        'How a phrase ends: full, plagal, half, deceptive. Voices for the last two chords, from a door that closes to a nave that will not.',
      shelf: 'harmony',
    },
    {
      id: 'chord-shed',
      name: 'Chord Shed',
      description:
        'A full chord that lets its notes go one at a time until a single voice is left holding: releases staggered from quick to very long.',
      shelf: 'harmony',
    },
    {
      id: 'twenty-eight-slashes',
      name: 'Twenty-Eight Slashes',
      description:
        'Seven triads over the four basses they do not own: upper voices in close and open spacing, and low voices that stay out of the way.',
      shelf: 'harmony',
    },
    {
      id: 'dispersed-parts',
      name: 'Dispersed Parts',
      description:
        'Open-throated parts spread wide, equally loud, with the tune in the tenor: four-square singing in choirs, horns, organs and reeds.',
      shelf: 'harmony',
    },
    {
      id: 'slackened-strings',
      name: 'Slackened Strings',
      description:
        'Guitars and their cousins let down to open chords: the rooms that five slack tunings make, under a thumb, a nail, a bar or a brush.',
      shelf: 'harmony',
    },
    {
      id: 'walk-up-amens',
      name: 'Walk-Up Amens',
      description:
        'The bass walks up to the fourth, a diminished chord passes, and the amen settles: organ, piano, choir and bass, from quick to very slow.',
      shelf: 'harmony',
    },
    {
      id: 'white-key-planing',
      name: 'White Key Planing',
      description:
        'Chords that slide in parallel along the white keys with no attack to break the slide: winds, strings and voices with a colour that stays put.',
      shelf: 'harmony',
    },
    {
      id: 'stacked-fourths',
      name: 'Stacked Fourths',
      description:
        'Chords built in fourths, with no third to make them glad or sorry: hollow, even voices that stay apart when they are stacked.',
      shelf: 'harmony',
    },
    {
      id: 'slow-waltz-sevenths',
      name: 'Slow Waltz Sevenths',
      description:
        'A low note, a chord and a late tune, three in a bar and no hurry: soft sevenths on keys, harp, guitar and flute.',
      shelf: 'harmony',
    },
    {
      id: 'one-line-choirs',
      name: 'One-Line Choirs',
      description:
        'One played line and its reflections round a centre: six voices from a single finger, as a fan, a canon or a chord that closes again.',
      shelf: 'harmony',
    },
    {
      id: 'over-a-played-bass',
      name: 'Over a Played Bass',
      description:
        'A finger plays the bass and the upper voices follow by the old keyboard rule, moving as little as they can.',
      shelf: 'harmony',
    },
    {
      id: 'many-rooms-one-spine',
      name: 'One Spine, Many Rooms',
      description:
        'A held key runs eight chords, and each sound plays one role of them or several: sounds on one spine fit each other.',
      shelf: 'harmony',
    },
    {
      id: 'one-voice-moves',
      name: 'One Voice Moves',
      description:
        'A chord that changes one note and keeps two, again and again, so each chord melts into the next and the key is left behind or kept.',
      shelf: 'harmony',
    },
    {
      id: 'unmeasured-preludes',
      name: 'Unmeasured Preludes',
      description:
        'Chords rolled and left to ring under one long slur, with no bar lines: plucked and struck strings held by pedal, hand and room.',
      shelf: 'melody',
    },
    {
      id: 'ragas-on-white-keys',
      name: 'Ragas on White Keys',
      description:
        'Seven modes over a plucked drone, each with its strong note and its way up and down: voices that slide, shake and swell on that note.',
      shelf: 'melody',
    },
    {
      id: 'one-line-six-players',
      name: 'One Line, Six Players',
      description:
        'A single line passed from player to player every few notes: matched voices that hand it over without a step.',
      shelf: 'melody',
    },
    {
      id: 'interlocking-pairs',
      name: 'Interlocking Pairs',
      description:
        'Two players share one fast line, each playing every other note: pairs of leading and following voices on wood, steel, string and bell.',
      shelf: 'melody',
    },
    {
      id: 'paths-of-a-maqam',
      name: 'Paths of a Maqam',
      description:
        'A melody finds its way through a mode with steps between the keys: plucked, blown and bowed voices that slide and lean into them.',
      shelf: 'melody',
    },
    {
      id: 'calls-across-valley',
      name: 'Calls Across a Valley',
      description:
        'A call, and the same call from the far side, later and duller and a hair flat: near and far voices for horns, throats and reeds.',
      shelf: 'melody',
    },
    {
      id: 'songs-in-bowl-tuning',
      name: 'Songs in Bowl Tuning',
      description:
        'Struck bowls and bars with their partials laid where the scale lies, so five notes that belong to no keyboard ring true.',
      shelf: 'melody',
    },
    {
      id: 'bass-nobody-plays',
      name: 'The Bass Nobody Plays',
      description:
        'Two high pure tones close enough that the ear supplies a low third: clean voices, drive and distance set for the note that is not played.',
      shelf: 'melody',
    },
    {
      id: 'missing-tonic',
      name: 'The Missing Tonic',
      description:
        'Evening melodies that circle the home note and will not say it, while the drone holds what they leave out.',
      shelf: 'melody',
    },
    {
      id: 'thrush-ladder',
      name: 'Thrush Ladder',
      description:
        'A long whistled note and a ladder of pure intervals above it, as a woodland thrush sings: glassy voices at sixteen depths of forest.',
      shelf: 'melody',
    },
    {
      id: 'only-the-harmonics',
      name: 'Only the Harmonics',
      description:
        'Strings touched and never stopped: which partial, which string, how light the finger, on bows, harp, guitar and wind.',
      shelf: 'melody',
    },
    {
      id: 'any-two-fit',
      name: 'Any Two Fit',
      description:
        'Lines made so any two sound well together: eight players, each in a register of its own, dry enough to stack and soft enough to lie under.',
      shelf: 'melody',
    },
    {
      id: 'mensuration-canons',
      name: 'Mensuration Canons',
      description:
        'One tune at three speeds at once: short, middling and very long voices that belong together when the tune meets itself.',
      shelf: 'melody',
    },
    {
      id: 'melody-of-holes',
      name: 'Melody of Holes',
      description:
        'A held cluster from which one note at a time is taken away, so the gaps make the tune: pads that close exactly when a key comes up.',
      shelf: 'melody',
    },
    {
      id: 'twelve-notes-two-modes',
      name: 'Twelve Notes, Two Modes',
      description:
        'A bright mode going up and its dark mirror coming down, all twelve notes between them: pairs of one voice in two lights.',
      shelf: 'melody',
    },
    {
      id: 'one-tune-three-drones',
      name: 'One Tune, Three Drones',
      description:
        'The same tune over three different drones means three different things: drones, and the voices that take their colour from them.',
      shelf: 'melody',
    },
    {
      id: 'questions-and-answers',
      name: 'Questions and Answers',
      description:
        'A phrase that leans forward and one that sits back: paired voices on harp, guitar, flute, piano and zither.',
      shelf: 'melody',
    },
    {
      id: 'one-breath-each',
      name: 'One Breath Each',
      description:
        'A phrase lasts as long as a breath: how a blown note opens, colours under a half-covered hole, and ends when the air does.',
      shelf: 'melody',
    },
    {
      id: 'same-fingers-twelfth-up',
      name: 'Same Fingers, Twelfth Up',
      description:
        'One tube, two registers a twelfth apart: the dark low notes and the clear high ones of reeds, pipes and voices, in pairs.',
      shelf: 'melody',
    },
    {
      id: 'rounds-that-agree',
      name: 'Rounds That Agree',
      description:
        'A tune that fits itself however late it enters: matched voices at three distances on flute, strings, piano, harp and mallets.',
      shelf: 'melody',
    },
    {
      id: 'long-arch-melodies',
      name: 'Long Arch Melodies',
      description:
        'One phrase that climbs to a single height and takes as long coming down: solo voices that brighten as they rise.',
      shelf: 'melody',
    },
    {
      id: 'blue-thirds',
      name: 'Blue Thirds',
      description:
        'A third reached from below and left a little flat: steel, reed, horn and keys that can lean, slowly or all at once.',
      shelf: 'melody',
    },
    {
      id: 'lines-and-reflections',
      name: 'Lines and Reflections',
      description:
        'What is played and the same turned upside down: together, in answer, a moment later, or the reflection alone.',
      shelf: 'melody',
    },
    {
      id: 'companions-by-rule',
      name: 'Companions by Rule',
      description:
        'A line and a second voice that keeps to a rule: the near notes of one triad, thirds, sixths, bare fifths, or three voices in old parallel style.',
      shelf: 'melody',
    },
    {
      id: 'up-one-way-down-another',
      name: 'Up One Way, Down Another',
      description:
        'Slow melodies that climb by one road and come down by another, rest on their home note and leave silence between phrases.',
      shelf: 'melody',
    },
    {
      id: 'handstroke-gap',
      name: 'The Handstroke Gap',
      description:
        'Bells in rounds and changes, with the breath that is left after every other row: rings of tower, hand, glass and bar.',
      shelf: 'time',
    },
    {
      id: 'scales-played-as-time',
      name: 'Scales Played as Time',
      description:
        'The steps of a mode used as a rhythm, long where the step is wide: struck voices, darker when long and brighter when short.',
      shelf: 'time',
    },
    {
      id: 'every-meter',
      name: 'Every Meter',
      description:
        'Fives, sevens and nines that keep their accent: quiet kits, bass and keys for loops that do not come out even.',
      shelf: 'time',
    },
    {
      id: 'forty-eight-pulses',
      name: 'Forty-Eight Pulses',
      description:
        'Plucked metal with its buzz, its board and its gourd, in parts that fit a cycle of forty-eight: leading, following, high and low.',
      shelf: 'time',
    },
    {
      id: 'prime-lengths',
      name: 'Prime Lengths',
      description:
        'Ten players each hold one note for a prime number of seconds, so the chord is never twice the same: held voices at ten distances.',
      shelf: 'time',
    },
    {
      id: 'seven-orbits',
      name: 'Seven Orbits',
      description:
        'Seven voices that come round at the ratios of seven orbits, from very high and quick to very low and slow.',
      shelf: 'time',
    },
    {
      id: 'comma-home',
      name: 'Comma Down, Comma Home',
      description:
        'Pure chords that let the pitch sink a comma and find the way back: voices without any vibrato, still enough for a comma to be heard.',
      shelf: 'time',
    },
    {
      id: 'rhythm-without-attacks',
      name: 'Rhythm without Attacks',
      description:
        'Nothing is struck: tones a few hertz apart beat against each other, and the beating is the pulse.',
      shelf: 'time',
    },
    {
      id: 'rhythm-of-a-chord',
      name: 'The Rhythm of a Chord',
      description:
        'Each note of a chord pulses at the speed of its own ratio, so three against four is also a fourth: voices that decay with their pulse.',
      shelf: 'time',
    },
    {
      id: 'slower-and-fuller',
      name: 'Slower and Fuller',
      description:
        'One slow skeleton melody and players who fill it in at twice, four and eight times the speed: bronze, bar, pan, glass and string.',
      shelf: 'time',
    },
    {
      id: 'isorhythm-wheels',
      name: 'Isorhythm Wheels',
      description:
        'A rhythm of one length and a row of notes of another, so each turn puts a new note on the beat: attacks and decays cut to fit.',
      shelf: 'time',
    },
    {
      id: 'slow-phase-slip',
      name: 'Slow Phase Slip',
      description:
        'Two copies of one pattern drift apart and come back: twin struck voices a hair different in colour and place.',
      shelf: 'time',
    },
    {
      id: 'four-against-five',
      name: 'Four Against Five',
      description:
        'A layer in fours and a layer in fives that meet once a bar, set apart by brightness, side and length of ring.',
      shelf: 'time',
    },
    {
      id: 'passacaglia-layers',
      name: 'Passacaglia in Layers',
      description:
        'Eight bars of bass that go round while the weight above them grows: five players from a bare ground to a descant.',
      shelf: 'time',
    },
    {
      id: 'crooked-three',
      name: 'The Crooked Three',
      description:
        'A dance in three whose second beat comes early: fiddles with their under-strings ringing, stopped and open, near and far.',
      shelf: 'time',
    },
    {
      id: 'sapphic-hours',
      name: 'Sapphic Hours',
      description:
        'Old verse metres of longs and shorts set to plucked and struck strings, so the metre is in the tone as well as the time.',
      shelf: 'time',
    },
    {
      id: 'thumb-keeps-four',
      name: 'The Thumb Keeps Four',
      description:
        'A thumb that never misses a beat and fingers that come between: two hands of one player on guitars, thumb pianos and strings.',
      shelf: 'time',
    },
    {
      id: 'cradle-rockings',
      name: 'Cradle Rockings',
      description:
        'Two chords rocked to and fro, slower and softer until someone sleeps: piano, mallets, harp, choir and bells.',
      shelf: 'time',
    },
    {
      id: 'never-breathe-together',
      name: 'Never Breathe Together',
      description:
        'A held chord as a section of players who each run out of air and never at the same moment, so it lasts and is never twice the same.',
      shelf: 'time',
    },
    {
      id: 'first-words',
      name: 'First Words',
      description:
        'Nineteen instruments the packs had no presets for, each taught its first few words by one rule only it can keep.',
      shelf: 'hands',
    },
    {
      id: 'only-the-tail',
      name: 'Only the Tail',
      description:
        'What is left after the key comes up: strings in sympathy, halls, metal and breath, with the strike turned down to nothing.',
      shelf: 'hands',
    },
    {
      id: 'sixteen-harp-pedals',
      name: 'Sixteen Harp Pedals',
      description:
        'Harp in all its pedal settings: low, middle and high on the string, nail and fingertip, damped and left to ring.',
      shelf: 'hands',
    },
    {
      id: 'ninths-for-octaves',
      name: 'Ninths for Octaves',
      description:
        'Bars and bells whose octaves are stretched or pinched until a ninth sounds like home: five sizes of octave, five mallets.',
      shelf: 'hands',
    },
    {
      id: 'between-the-keys',
      name: 'Between the Keys',
      description:
        'Melodies on the natural harmonics, where the eleventh lies between two keys: mouth, drone, bow, wind and reed.',
      shelf: 'hands',
    },
    {
      id: 'buried-jar',
      name: 'Buried Jar',
      description:
        'Water falling into a jar under the gravel: drops, shells, clay and the bamboo that knocks, wet and dry.',
      shelf: 'hands',
    },
    {
      id: 'thirteen-nodes',
      name: 'Thirteen Nodes',
      description:
        'A silk-strung zither with thirteen marked places to touch it: open tones, harmonics and slides that are mostly breath.',
      shelf: 'hands',
    },
    {
      id: 'ornament-book',
      name: 'The Ornament Book',
      description:
        'Grace notes, mordents, slides, shakes, turns and crushed notes: the ways a note can begin, for players who decorate.',
      shelf: 'hands',
    },
    {
      id: 'paired-bronze',
      name: 'Paired Bronze',
      description:
        'Bronze tuned in pairs a few hertz apart so every note shimmers at one rate: five rates in five sizes of hall.',
      shelf: 'hands',
    },
    {
      id: 'only-the-attack',
      name: 'Only the Attack',
      description:
        'The first forty milliseconds and no more: hammers, keys, tongues, nails and bow hair, dry or in a room that keeps the rest.',
      shelf: 'hands',
    },
    {
      id: 'whispered-pairs',
      name: 'Whispered Pairs',
      description:
        'Two strings brushed one after the other for each note: how far apart, how fast, how alike, on plucked and struck pairs.',
      shelf: 'hands',
    },
    {
      id: 'bands-of-one',
      name: 'Bands of One',
      description:
        'A whole group made of one instrument: floor, pad, line, pulse, sparkle, bass, breath and ending, for each of twelve.',
      shelf: 'hands',
    },
    {
      id: 'from-nothing',
      name: 'From Nothing',
      description:
        'Notes with no beginning: attacks taken away by swell, bow, breath, feedback or playing backwards, on fifteen players.',
      shelf: 'hands',
    },
    {
      id: 'open-string-quartet',
      name: 'Open String Quartet',
      description:
        'Four bowed players: open strings, mutes, bow by the bridge, bow over the fingerboard, harmonics and plucks, near and in a hall.',
      shelf: 'hands',
    },
    {
      id: 'left-hands',
      name: 'Left Hands',
      description:
        'Only the accompanying hand: tenths, rocking fifths, broken chords, and how soft the bass and how short the chord are.',
      shelf: 'hands',
    },
    {
      id: 'una-corda-family',
      name: 'Una Corda Family',
      description:
        'Keyboards with the soft pedal down: two strings or three, felt in or out, magnets and bolts, lid open or shut.',
      shelf: 'hands',
    },
    {
      id: 'ten-ways-to-bow',
      name: 'Ten Ways to Bow It',
      description:
        'Long, short, thrown, trembling, whispered, pressed: ten manners of the bow in a large section and in a small one.',
      shelf: 'hands',
    },
  ]
