import { type InstrumentSet } from './set'

// Laid out by what the breath does: called across a hill, spent once, going round,
// kept in paper, held low, tongued short, leaned into tune, turned like a tide,
// plucked from steel, or slept. Each direction is ten corners of five presets.

export const SET: InstrumentSet = {
  device: 'common-air',
  names: {
    reed: ['Brass', 'Cane', 'Steel', 'Paper'],
    pipe: ['Chest', 'Stopped', 'Open', 'Cone'],
    breath: ['Out', 'In', 'Both', 'Circular', 'Once'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    tabled: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Keys' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and a little wide',
    },
    warmth: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', dry, its warmth brought up',
    },
    shade: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry, its top in the shade',
    },
    thinned: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 220 } },
        { deviceId: 'stereo-widener', preset: 'Normal' },
      ],
      words: ', dry, thinned to its middle',
    },
    scooped: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow', params: { air: 2 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', dry, scooped out in the middle',
    },
    floor: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', dry, its floor deepened',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward' },
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6 } },
      ],
      words: ', dry and pushed forward',
    },
    wideair: {
      effects: [
        { deviceId: 'spread', preset: 'Wide pad' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and opened very wide',
    },
    ends: {
      effects: [
        { deviceId: 'spread', preset: 'Wide ends' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry, wide above and below',
    },
    held: {
      effects: [
        { deviceId: 'tamer', preset: 'Ringing tones', params: { depth: 0.7 } },
        { deviceId: 'spread', preset: 'Wide top' },
      ],
      words: ', dry, what rings out held down',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } }],
      words: ', in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.18 } }],
      words: ', in a tight chamber',
    },
    parlour: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.24 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', in a carpeted room',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.2 } }],
      words: ', on a short dull plate',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', narrow and dry',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: ', through a warm valve',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', through heavy iron, dry',
    },
    desk: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Console' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
      ],
      words: ', through an old desk and a short plate',
    },
    grit: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit', params: { mix: 0.24 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      ],
      words: ', with a little grit beside it',
    },
    tube: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8, outputDb: -4 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: ', leaning on a tube',
    },
    glued: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.1 } },
      ],
      words: ', pressed gently onto tape',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } }],
      words: ', on quarter inch tape',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.14 } }],
      words: ', on a cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', under a blanket of old tape',
    },
    wornthin: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', on tape worn thin',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0.03 } }],
      words: ', from a small loudspeaker in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0, output: 2 } }],
      words: ', from a little speaker under a pillow',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0.03 } }],
      words: ', from inside a cupboard',
    },
    platform: {
      effects: [
        { deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.3, noise: 0.05 } },
      ],
      words: ', over a horn on an empty platform',
    },
    woolly: {
      effects: [{ deviceId: 're-amp', preset: 'Dark and woolly', params: { noise: 0 } }],
      words: ', through a dark woolly loudspeaker',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
      words: ', set on a wooden board',
    },
    bottle: {
      effects: [
        { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', sounding in a bottle',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.4, air: 0.5 } }],
      words: ', held inside a shell',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: ', inside a clay pot',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6500 } },
      ],
      words: ', in a small tin',
    },
    imprinted: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.9 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', pressed into a round vowel',
    },
    tube2: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.9 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', pressed into a hollow tube',
    },
    papers: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.5 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a paper edge that buzzes',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { amount: 0.5, mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with loose shells rattling under it',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.3 } }],
      words: ', with one short slap of tape',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', doubled a shade late on either side',
    },
    second: {
      effects: [
        { deviceId: 'size', preset: 'Second player', params: { mix: 0.35 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: ', with another player a hair off beside it',
    },
    larger: {
      effects: [
        { deviceId: 'size', preset: 'Larger', params: { mix: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', in a body half again as large',
    },
    smaller: {
      effects: [
        { deviceId: 'size', preset: 'Smaller', params: { mix: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', in a body made small',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { static: 0.05, interference: 0.02 },
        },
      ],
      words: ', from a kitchen radio',
    },
    shortwave: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Night shortwave',
          params: { static: 0.1, interference: 0.04, fading: 0.4 },
        },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: ', over shortwave at night',
    },
    oldrecord: {
      effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.15, pops: 0.05 } }],
      words: ', on an old fast record',
    },
    pressing: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.12 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', on a new record',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Sampler', params: { mix: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
      ],
      words: ', as an early sampler kept it',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze', params: { mix: 0.8 } },
        { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.3 } },
      ],
      words: ', under a thin digital glaze',
    },
    stream: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', through a thin starved stream',
    },
    valveworn: {
      effects: [
        { deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.5, noise: 0.05 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', through a hot worn valve',
    },
    pane: {
      effects: [
        { deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.75 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', behind a thick pane',
    },
    blunt: {
      effects: [
        { deviceId: 'fog', preset: 'Short blur', params: { size: 45 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.14 } },
      ],
      words: ', with each attack blunted',
    },
    mist: {
      effects: [
        { deviceId: 'fog', preset: 'Morning mist' },
        { deviceId: 'ambient-eq', preset: 'Distant', params: { presence: -4, air: -4 } },
      ],
      words: ', in a morning mist',
    },
    airapart: {
      effects: [
        { deviceId: 'sift', preset: 'Wide air', params: { air: 4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', its air drawn out wide of its tone',
    },
    puffs: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air', params: { air: 3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with the starts softened into puffs',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails', params: { limit: 12 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with its ends brought up',
    },
    opened: {
      effects: [
        { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.5, output: -2 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its breath and overtones turned up',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door', params: { level: 0.5 } }],
      words: ', heard through a wall',
    },
    acrossroom: {
      effects: [{ deviceId: 'distance', preset: 'Across the room', params: { level: 0.5 } }],
      words: ', from across a room',
    },
    stairs: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { level: 0.5 } }],
      words: ', at the foot of a stone stair',
    },
    yard: {
      effects: [
        { deviceId: 'distance', preset: 'Open air', params: { level: 0.4, wander: 0.1 } },
        { deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } },
      ],
      words: ', out in an open yard',
    },
    shudder: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: ', shimmering in two bands',
    },
    throb: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.6 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.16 } },
      ],
      words: ', throbbing in an old amplifier',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', drifting from side to side',
    },
    tilting: {
      effects: [
        { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its low and high trading places',
    },
    whirl: {
      effects: [
        { deviceId: 'rotary', preset: 'Far shimmer', params: { mix: 0.8 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.14 } },
      ],
      words: ', in a fast rotary cabinet across the room',
    },
    drum: {
      effects: [
        { deviceId: 'rotary', preset: 'Dark drum' },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 3 } },
      ],
      words: ', through a dark turning drum',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', in a slow swirl on a plate',
    },
    hollowed: {
      effects: [
        { deviceId: 'phaser', preset: 'Negative notch', params: { mix: 0.45 } },
        { deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.3 } },
      ],
      words: ', with hollow notches moving through it',
    },
    twelve: {
      effects: [
        { deviceId: 'phaser', preset: 'Twelve stage cloud' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', in a wide cloud of notches',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.14 } },
      ],
      words: ', in a lush ensemble',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5, feedback: 10 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      ],
      words: ', swaying very slowly',
    },
    hollowswell: {
      effects: [
        { deviceId: 'chorus', preset: 'Hollow swell', params: { feedback: -40 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', in a hollow slow chorus',
    },
    sweep: {
      effects: [
        { deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: 20, mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a slow flange in a room',
    },
    singer: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 24 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a late singing vibrato',
    },
    bowhand: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', swaying a little the longer it is held',
    },
    lowpass: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Init',
          params: {
            type: 0,
            slope: 1,
            cutoffHz: 900,
            resonance: 1,
            lfoAmount: 45,
            lfoRateHz: 0.16,
          },
        },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', under a filter that opens and shuts',
    },
    touched: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Init',
          params: {
            type: 0,
            slope: 1,
            cutoffHz: 420,
            resonance: 1.4,
            envAmount: 60,
            envAttackMs: 60,
            envReleaseMs: 600,
          },
        },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', where a harder touch opens the filter',
    },
    notchy: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with one slow notch through it',
    },
    water: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water', params: { rate: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.18 } },
      ],
      words: ', its bands rising and falling like water',
    },
    undertow: {
      effects: [
        { deviceId: 'currents', preset: 'Undertow', params: { rate: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
      ],
      words: ', its low bands swelling under it',
    },
    facets: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', glittering in narrow bands',
    },
    broad: {
      effects: [
        { deviceId: 'glimmer', preset: 'Broad swells', params: { rate: 0.5, depth: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', swelling broadly, band by band',
    },
    lungs: {
      effects: [
        {
          deviceId: 'breath',
          preset: 'Calm breath',
          params: { in: 1.4, out: 1.9, hold: 0.2, rest: 0.2, air: 0.15 },
        },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with slow lungs around it',
    },
    clouds: {
      effects: [
        { deviceId: 'weather', preset: 'Passing clouds', params: { pace: 3 } },
        { deviceId: 'expanse', preset: 'Faint air' },
      ],
      words: ', with clouds passing over',
    },
    breeze: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2, pace: 2 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: ', out in a breeze',
    },
    surf: {
      effects: [
        {
          deviceId: 'weather',
          preset: 'Slow surf',
          params: { pace: 3, voice: 0.25, exposure: 0.6 },
        },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', with surf rolling through',
    },
    dapple: {
      effects: [
        { deviceId: 'weather', preset: 'Dappled shade', params: { exposure: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', under moving leaves',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.12 } },
      ],
      words: ', walking slowly round the head',
    },
    pendulum: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', on a wide slow swing',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Two close by', params: { birds: 5, mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', scattered like a small flock',
    },
    crowd: {
      effects: [
        { deviceId: 'murmuration', preset: 'Thick ensemble' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', as a thick crowd of itself',
    },
    softpulse: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb' },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.18 } },
      ],
      words: ', in a soft even pulse',
    },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave', params: { rate: 4, floor: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in two pulses that drift apart',
    },
    three: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Three a second' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
      ],
      words: ', its middle beating three times a second',
    },
    still: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', drifting a hair out of true',
    },
    beats: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Detuned', params: { fine: 2 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', beating a few hertz apart left and right',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats' }],
      words: ', with warm tape repeats',
    },
    heads: {
      effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.32 } }],
      words: ', repeated by three tape heads',
    },
    trail: {
      effects: [
        {
          deviceId: 'tape-echo',
          preset: 'Long dark trail',
          params: { time: 900, feedback: 0.6, mix: 0.35 },
        },
      ],
      words: ', with a long dark trail of tape',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.34 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', bouncing from side to side on tape',
    },
    clean: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 460, feedback: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with one clean echo behind it',
    },
    murky: {
      effects: [
        {
          deviceId: 'analog-delay',
          preset: 'Murky',
          params: { time: 700, feedback: 0.5, mix: 0.35 },
        },
      ],
      words: ', with murky late echoes',
    },
    drifting: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 520, mix: 0.34 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with echoes that slip out of tune',
    },
    pebble: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.32 } },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.14 } },
      ],
      words: ', skipping away like a pebble',
    },
    slowing: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.34 } }],
      words: ', its echoes slowing as they go',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.34 } }],
      words: ', with echoes scattered like stars',
    },
    farstar: {
      effects: [
        { deviceId: 'constellation', preset: 'One far star', params: { span: 1900, mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', and one far echo',
    },
    fan: {
      effects: [
        { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', unfolding from low to high',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.34 } }],
      words: ', with a breath of it backwards',
    },
    mirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1100, mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', turned backwards in slow swells',
    },
    answer: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.1, mix: 0.34 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', answered once by itself',
    },
    shadowed: {
      effects: [
        { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.7, mix: 0.34 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', followed by its own octave below',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.34 } }],
      words: ', half remembered a moment later',
    },
    weaving: {
      effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.34, feedback: 0.7 } }],
      words: ', laid over itself in two loops',
    },
    looped: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4, wear: 0.5 } }],
      words: ', on a worn loop of tape',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.32 } }],
      words: ', over a soft bed of what it just said',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
      words: ', in a dark hall',
    },
    brighthall: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.26 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, air: -2 } },
      ],
      words: ', in a bright hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.32 } }],
      words: ', down a vast nave',
    },
    under: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.32 } }],
      words: ', over a warm undertow of reverb',
    },
    faraway: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.6 } }],
      words: ', far away in a hall',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: ', across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.32 } }],
      words: ', in a dark cave',
    },
    brightair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.24 } }],
      words: ', in bright open air',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.3 } }],
      words: ', its hall arriving late',
    },
    breathing: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.36, breathRate: 0.4 } },
      ],
      words: ', in a hall that breathes',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }],
      words: ', on a medium plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
      words: ', on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.34 } }],
      words: ', on a dark plate',
    },
    sheen: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.16 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', with a faint far sheen',
    },
    cathedral: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.26 } }],
      words: ', in a cathedral',
    },
    darkether: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.34 } }],
      words: ', in a long dark room',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: ', in a wide open space',
    },
    thin: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.34 } }],
      words: ', under thin high air',
    },
    lowcath: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.36, decay: 14 } }],
      words: ', over a low endless cathedral',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.36 } }],
      words: ', down a narrow tunnel',
    },
    bloom: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.36, decay: 7 } }],
      words: ', blooming after itself',
    },
    seasick: {
      effects: [{ deviceId: 'expanse', preset: 'Seasick choir', params: { mix: 0.32, decay: 8 } }],
      words: ', in a space that will not hold still',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
      words: ', through two springs',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } }],
      words: ', through three long springs',
    },
    coil: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Dark late coil', params: { mix: 0.34 } }],
      words: ', through one dark coil, late',
    },
    ahs: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.34 } }],
      words: ', in a hall that sings ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.36, decay: 8 } }],
      words: ', in a low humming nave',
    },
    oos: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.34 } }],
      words: ', with an oo behind it',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.32 } }],
      words: ', in a small chapel',
    },
    whisper: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.34 } }],
      words: ', in a whispering room',
    },
    octbloom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.3 } }],
      words: ', its tail growing octaves',
    },
    winter: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.32, decay: 8 } },
      ],
      words: ', its tail sinking into winter',
    },
    glimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.22 } }],
      words: ', with a faint glimmer over it',
    },
    loft: {
      effects: [{ deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.32, decay: 8 } }],
      words: ', in an organ loft',
    },
    muffled: {
      effects: [{ deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.38, decay: 9 } }],
      words: ', before a muffled choir',
    },
    sinking: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.32, decay: 8 } }],
      words: ', over a tail that sinks an octave',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.34 } }],
      words: ', in a cavern of small echoes',
    },
    patter: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.32 } }],
      words: ', with its echoes pattering away',
    },
    mineshaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.34 } }],
      words: ', down a mine shaft',
    },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.36 } }],
      words: ', with its room drawn in backwards',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.36 } }],
      words: ', in a room that stops dead',
    },
    swellroom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } }],
      words: ', in a room that swells and closes',
    },
    lost: {
      effects: [
        { deviceId: 'distance', preset: 'Lost in the hall', params: { level: 0.5, decay: 6 } },
      ],
      words: ', lost at the end of a hall',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { level: 0.45 } }],
      words: ', from a far shore',
    },
    strings: {
      effects: [{ deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.4 } }],
      words: ', waking the strings of an open fifth',
    },
    sympathy: {
      effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { mix: 0.28 } }],
      words: ', with strings ringing softly in step',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.2, root: 0 } }],
      words: ', with a few bowls ringing beside it',
    },
    hanging: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.42 } }],
      words: ', hanging on as mist',
    },
    halo: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.34, highCut: 9000 } },
      ],
      words: ', in a thin bright halo',
    },
    darkwater: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.48 } }],
      words: ', dissolving into dark water',
    },
    whispers: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.7 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      ],
      words: ', smeared to a whisper',
    },
    cloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', in a soft cloud of grains',
    },
    rain: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with an octave of rain above',
    },
    lowtide: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.36 } },
        { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.16 } },
      ],
      words: ', over grains an octave below',
    },
    backroom: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Backwards room', params: { mix: 0.4 } }],
      words: ', its grains turned backwards',
    },
    crystals: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.28, tone: 4500 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: ', with crystals an octave up',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.34 } }],
      words: ', with embers falling under it',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { time: 800, mix: 0.34 } }],
      words: ', repeated in slow tiles',
    },
    sparks: {
      effects: [
        { deviceId: 'glints', preset: 'First light', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', throwing off a few sparks',
    },
    lateglints: {
      effects: [
        { deviceId: 'glints', preset: 'Late answers', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', with late answers overhead',
    },
    room2: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -46 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.24 } },
      ],
      words: ', in an empty room that hums',
    },
    closemic: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Close mic', params: { level: -50 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', close, with the air of the room',
    },
    sighs: {
      effects: [
        { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.36 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', with sighs that fall away',
    },
    mistup: {
      effects: [
        { deviceId: 'falling', preset: 'Rising mist', params: { mix: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.16 } },
      ],
      words: ', with a mist rising off it',
    },
    melting: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4, sag: -14 } }],
      words: ', its tail melting down',
    },
    wax: {
      effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.42 } }],
      words: ', running like wax',
    },
    shadow: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.28 } },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.16 } },
      ],
      words: ', with pure tones an octave over it',
    },
    onesine: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'One sine', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', traced by one pure tone',
    },
    sustain: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.42 } }],
      words: ', caught as slow strings',
    },
    afterglow: {
      effects: [
        { deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.42 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with a short afterglow',
    },
    halftime: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.4 } }],
      words: ', over a haze at half the pace',
    },
    subbed: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.3 } },
      ],
      words: ', with an octave put under it',
    },
    highhalo: {
      effects: [
        { deviceId: 'octaves', preset: 'Slow halo', params: { up1: 0.2, up2: 0.2, filter: 6000 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with slow octaves over it',
    },
    pedal: {
      effects: [
        { deviceId: 'stops', preset: 'Pedal under', params: { sub: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', over an organ pedal',
    },
    flutes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', doubled by breathy flute stops',
    },
    half: {
      effects: [
        { deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.32 } },
        { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.16 } },
      ],
      words: ', with a thin half speed shadow',
    },
    hazy: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3, decay: 4 } }],
      words: ', in a faint warm haze',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.34, decay: 4 } }],
      words: ', wrapped in wool',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant', params: { mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ", in a giant's chest",
    },
    chant: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Low chant', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', with its overtones chanting low',
    },
    whistler: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody', params: { mix: 0.3, root: 2 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', with a whistled overtone over it',
    },
    chimes: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', its overtones leaning toward chimes',
    },
    cluster: {
      effects: [
        { deviceId: 'warp', preset: 'Thin glow', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its overtones spread to a soft beat',
    },
    ringing: {
      effects: [
        { deviceId: 'ring', preset: 'Faint halo', params: { root: 2, mix: 0.16 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', with a faint ring on D',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.1 } }],
      words: ', just under water',
    },
    deepwater: {
      effects: [
        { deviceId: 'underwater', preset: 'Deep water', params: { bubbles: 0.1, depth: 0.7 } },
      ],
      words: ', deep under water',
    },
    wintry: {
      effects: [{ deviceId: 'seasons', preset: 'Deep winter', params: { grit: 0.3, mix: 0.8 } }],
      words: ', in deep winter',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.8 } }],
      words: ', in high summer',
    },
    evening: {
      effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { grit: 0.3, mix: 0.8 } }],
      words: ', in a long evening',
    },
    wornreel: {
      effects: [
        {
          deviceId: 'patina',
          preset: 'Quarter inch reel',
          params: { noise: 0.06, wear: 0.5, wobble: 0.4 },
        },
      ],
      words: ', on a worn reel',
    },
    station: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Far station',
          params: { static: 0.12, interference: 0.04, fading: 0.6 },
        },
      ],
      words: ', from a far station',
    },
    afterimage: {
      effects: [
        { deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.3, length: 1.6 } },
      ],
      words: ', leaving a faint afterimage',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', every note drawn in like a bow',
    },
    padded: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 1.4, mix: 0.36 } },
      ],
      words: ', with a soft pad growing behind',
    },
    cellos: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.4 } }],
      words: ', with dark strings growing behind',
    },
    howling: {
      effects: [
        { deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', feeding back softly in a room',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', the tones its chords share hanging on',
    },
    lattice: {
      effects: [
        { deviceId: 'lattice', preset: 'Octaves', params: { mix: 38 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', with octaves found above and below',
    },
    fillroom: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 12 } },
        { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } },
      ],
      words: ', pressed together in a room that swells',
    },
    winterheld: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -12, gain: 12 } },
        { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.32, decay: 8 } },
      ],
      words: ', pressed level, its tail sinking into winter',
    },
    cloudfed: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 9 } },
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', pressed into a soft cloud of grains',
    },
    heldback: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3.5 } },
        { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.34 } },
      ],
      words: ', pressed level, with a breath of it backwards',
    },
  },
  phrases: {
    treeline: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 62, gain: 0.7 },
        { atSec: 1.7, durSec: 0.5, note: 65, gain: 0.5 },
        { atSec: 2.2, durSec: 0.5, note: 67, gain: 0.55 },
        { atSec: 2.8, durSec: 2, note: 69, gain: 0.75 },
        { atSec: 5, durSec: 0.4, note: 67, gain: 0.5 },
        { atSec: 5.4, durSec: 2, note: 62, gain: 0.6 },
      ],
    },
    slopes: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 69, gain: 0.75 },
        { atSec: 1.5, durSec: 1.2, note: 72, gain: 0.6 },
        { atSec: 2.9, durSec: 1.5, note: 57, gain: 0.55 },
        { atSec: 4.5, durSec: 1.2, note: 64, gain: 0.65 },
        { atSec: 5.8, durSec: 1.5, note: 62, gain: 0.5 },
      ],
    },
    ney: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 67, gain: 0.6 },
        { atSec: 2.4, durSec: 0.18, note: 69, gain: 0.4 },
        { atSec: 2.6, durSec: 0.18, note: 67, gain: 0.4 },
        { atSec: 2.8, durSec: 1.6, note: 65, gain: 0.6 },
        { atSec: 4.5, durSec: 0.25, note: 64, gain: 0.45 },
        { atSec: 4.8, durSec: 0.25, note: 65, gain: 0.45 },
        { atSec: 5.1, durSec: 2.2, note: 62, gain: 0.65 },
      ],
    },
    shepherd: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 74, gain: 0.7 },
        { atSec: 1, durSec: 0.4, note: 72, gain: 0.5 },
        { atSec: 1.4, durSec: 0.4, note: 69, gain: 0.5 },
        { atSec: 1.9, durSec: 1.6, note: 67, gain: 0.65 },
        { atSec: 3.7, durSec: 0.4, note: 69, gain: 0.5 },
        { atSec: 4.1, durSec: 0.4, note: 72, gain: 0.55 },
        { atSec: 4.6, durSec: 2.6, note: 69, gain: 0.6 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 57, gain: 0.6 },
        { atSec: 0.6, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 2.9, durSec: 1.9, note: 59, gain: 0.55 },
        { atSec: 2.9, durSec: 1.9, note: 62, gain: 0.5 },
        { atSec: 4.9, durSec: 2.4, note: 57, gain: 0.6 },
        { atSec: 4.9, durSec: 2.4, note: 64, gain: 0.55 },
      ],
    },
    lullaby: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 48, gain: 0.5 },
        { atSec: 0.4, durSec: 0.8, note: 64, gain: 0.6 },
        { atSec: 1.2, durSec: 0.7, note: 67, gain: 0.5 },
        { atSec: 1.9, durSec: 1.4, note: 65, gain: 0.55 },
        { atSec: 2, durSec: 1.5, note: 53, gain: 0.45 },
        { atSec: 3.4, durSec: 0.6, note: 64, gain: 0.5 },
        { atSec: 4, durSec: 0.8, note: 55, gain: 0.5 },
        { atSec: 4.1, durSec: 0.7, note: 62, gain: 0.55 },
        { atSec: 4.9, durSec: 2.2, note: 60, gain: 0.6 },
        { atSec: 4.9, durSec: 2.2, note: 48, gain: 0.45 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 1.1, note: 69, gain: 0.5 },
        { atSec: 1.3, durSec: 1.1, note: 59, gain: 0.5 },
        { atSec: 1.3, durSec: 1.1, note: 67, gain: 0.5 },
        { atSec: 2.6, durSec: 1.6, note: 57, gain: 0.55 },
        { atSec: 2.6, durSec: 1.6, note: 65, gain: 0.5 },
        { atSec: 4.5, durSec: 2.4, note: 60, gain: 0.6 },
        { atSec: 4.5, durSec: 2.4, note: 64, gain: 0.5 },
      ],
    },
    hocket: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 57, gain: 0.7 },
        { atSec: 0.5, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 1, durSec: 0.3, note: 60, gain: 0.6 },
        { atSec: 1.5, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 2, durSec: 0.3, note: 59, gain: 0.6 },
        { atSec: 2.5, durSec: 0.3, note: 65, gain: 0.5 },
        { atSec: 3, durSec: 0.3, note: 57, gain: 0.65 },
        { atSec: 3.5, durSec: 0.8, note: 62, gain: 0.6 },
        { atSec: 4.6, durSec: 0.3, note: 57, gain: 0.6 },
        { atSec: 5.1, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 5.6, durSec: 1.4, note: 62, gain: 0.6 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 50, gain: 0.6 },
        { atSec: 0.45, durSec: 1.8, note: 57, gain: 0.5 },
        { atSec: 0.9, durSec: 1.8, note: 64, gain: 0.55 },
        { atSec: 1.35, durSec: 2, note: 69, gain: 0.6 },
        { atSec: 3, durSec: 2, note: 53, gain: 0.55 },
        { atSec: 3.45, durSec: 1.8, note: 57, gain: 0.5 },
        { atSec: 3.9, durSec: 1.8, note: 60, gain: 0.5 },
        { atSec: 4.35, durSec: 2.6, note: 67, gain: 0.6 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 57, gain: 0.7 },
        { atSec: 0.4, durSec: 0.25, note: 62, gain: 0.5 },
        { atSec: 0.8, durSec: 0.25, note: 64, gain: 0.5 },
        { atSec: 1.2, durSec: 0.25, note: 62, gain: 0.5 },
        { atSec: 1.6, durSec: 0.25, note: 57, gain: 0.7 },
        { atSec: 2, durSec: 0.25, note: 62, gain: 0.5 },
        { atSec: 2.4, durSec: 0.25, note: 65, gain: 0.55 },
        { atSec: 2.8, durSec: 0.25, note: 62, gain: 0.5 },
        { atSec: 3.2, durSec: 0.25, note: 55, gain: 0.7 },
        { atSec: 3.6, durSec: 0.25, note: 60, gain: 0.5 },
        { atSec: 4, durSec: 0.25, note: 64, gain: 0.5 },
        { atSec: 4.4, durSec: 0.25, note: 60, gain: 0.5 },
        { atSec: 4.8, durSec: 1.4, note: 57, gain: 0.7 },
        { atSec: 4.8, durSec: 1.4, note: 64, gain: 0.5 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 2.5, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 1.7, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 4.5, note: 65, gain: 0.55 },
        { atSec: 1.8, durSec: 2.7, note: 59, gain: 0.5 },
        { atSec: 2.6, durSec: 1.9, note: 43, gain: 0.55 },
        { atSec: 2.6, durSec: 1.9, note: 55, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 48, gain: 0.6 },
        { atSec: 4.6, durSec: 2.6, note: 55, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 60, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 64, gain: 0.55 },
      ],
    },
    gather: {
      notes: [
        { atSec: 0, durSec: 7, note: 45, gain: 0.55 },
        { atSec: 0.7, durSec: 6.3, note: 52, gain: 0.5 },
        { atSec: 1.4, durSec: 5.6, note: 57, gain: 0.5 },
        { atSec: 2.2, durSec: 4.8, note: 64, gain: 0.5 },
        { atSec: 3, durSec: 4, note: 67, gain: 0.5 },
        { atSec: 3.8, durSec: 3.2, note: 71, gain: 0.45 },
      ],
    },
    twochords: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 53, gain: 0.55 },
        { atSec: 0, durSec: 3.3, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 3.3, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 3.3, note: 67, gain: 0.55 },
        { atSec: 3.5, durSec: 3.6, note: 50, gain: 0.55 },
        { atSec: 3.5, durSec: 3.6, note: 60, gain: 0.5 },
        { atSec: 3.5, durSec: 3.6, note: 65, gain: 0.5 },
        { atSec: 3.5, durSec: 3.6, note: 69, gain: 0.5 },
      ],
    },
    middle: {
      notes: [
        { atSec: 0, durSec: 7, note: 48, gain: 0.55 },
        { atSec: 0, durSec: 7, note: 67, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 2.2, durSec: 2.2, note: 59, gain: 0.5 },
        { atSec: 4.4, durSec: 2.7, note: 57, gain: 0.5 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7, note: 38, gain: 0.6 },
        { atSec: 0, durSec: 7, note: 45, gain: 0.5 },
        { atSec: 1.6, durSec: 5.4, note: 57, gain: 0.4 },
        { atSec: 3.4, durSec: 3.6, note: 64, gain: 0.4 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 7, note: 31, gain: 0.6 },
        { atSec: 0, durSec: 7, note: 43, gain: 0.5 },
        { atSec: 2.4, durSec: 4.6, note: 50, gain: 0.45 },
      ],
    },
    overdrone: {
      notes: [
        { atSec: 0, durSec: 7, note: 45, gain: 0.5 },
        { atSec: 0, durSec: 7, note: 52, gain: 0.45 },
        { atSec: 0.8, durSec: 1.6, note: 64, gain: 0.55 },
        { atSec: 2.6, durSec: 1, note: 65, gain: 0.5 },
        { atSec: 3.7, durSec: 1.3, note: 62, gain: 0.5 },
        { atSec: 5.1, durSec: 2, note: 60, gain: 0.55 },
      ],
    },
    barge: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 38, gain: 0.75 },
        { atSec: 1.4, durSec: 0.8, note: 45, gain: 0.6 },
        { atSec: 2.3, durSec: 0.7, note: 43, gain: 0.6 },
        { atSec: 3.1, durSec: 0.9, note: 41, gain: 0.65 },
        { atSec: 4.2, durSec: 2.8, note: 36, gain: 0.75 },
      ],
    },
    cellar: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 36, gain: 0.75 },
        { atSec: 2.8, durSec: 1.6, note: 40, gain: 0.65 },
        { atSec: 4.6, durSec: 2.6, note: 38, gain: 0.7 },
      ],
    },
    tread: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 36, gain: 0.8 },
        { atSec: 0.6, durSec: 0.4, note: 36, gain: 0.5 },
        { atSec: 1.2, durSec: 0.4, note: 43, gain: 0.6 },
        { atSec: 1.8, durSec: 0.8, note: 41, gain: 0.65 },
        { atSec: 3, durSec: 0.4, note: 38, gain: 0.75 },
        { atSec: 3.6, durSec: 0.4, note: 38, gain: 0.5 },
        { atSec: 4.2, durSec: 0.4, note: 45, gain: 0.6 },
        { atSec: 4.8, durSec: 2, note: 43, gain: 0.65 },
      ],
    },
    tenor: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 45, gain: 0.65 },
        { atSec: 1.9, durSec: 0.8, note: 48, gain: 0.55 },
        { atSec: 2.8, durSec: 1.8, note: 50, gain: 0.6 },
        { atSec: 4.7, durSec: 0.8, note: 47, gain: 0.5 },
        { atSec: 5.6, durSec: 1.7, note: 45, gain: 0.65 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 81, gain: 0.5 },
        { atSec: 0.8, durSec: 0.4, note: 76, gain: 0.5 },
        { atSec: 1.6, durSec: 0.4, note: 72, gain: 0.55 },
        { atSec: 2.4, durSec: 0.4, note: 79, gain: 0.45 },
        { atSec: 3.5, durSec: 0.4, note: 69, gain: 0.55 },
        { atSec: 4.4, durSec: 0.4, note: 74, gain: 0.5 },
        { atSec: 5.6, durSec: 0.6, note: 67, gain: 0.55 },
      ],
    },
    chime: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 57, gain: 0.55 },
        { atSec: 0.06, durSec: 0.5, note: 64, gain: 0.5 },
        { atSec: 0.12, durSec: 0.5, note: 72, gain: 0.45 },
        { atSec: 2.2, durSec: 0.5, note: 53, gain: 0.5 },
        { atSec: 2.26, durSec: 0.5, note: 64, gain: 0.45 },
        { atSec: 2.32, durSec: 0.5, note: 69, gain: 0.4 },
        { atSec: 4.4, durSec: 0.8, note: 55, gain: 0.55 },
        { atSec: 4.46, durSec: 0.8, note: 62, gain: 0.5 },
        { atSec: 4.52, durSec: 0.8, note: 71, gain: 0.45 },
      ],
    },
    drip: {
      notes: [
        { atSec: 0, durSec: 0.15, note: 88, gain: 0.5 },
        { atSec: 1.1, durSec: 0.15, note: 81, gain: 0.5 },
        { atSec: 1.6, durSec: 0.15, note: 76, gain: 0.45 },
        { atSec: 3, durSec: 0.15, note: 84, gain: 0.5 },
        { atSec: 3.4, durSec: 0.15, note: 79, gain: 0.4 },
        { atSec: 5, durSec: 0.15, note: 72, gain: 0.55 },
        { atSec: 5.3, durSec: 0.15, note: 83, gain: 0.4 },
      ],
    },
    chantline: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.45 },
        { atSec: 0, durSec: 7, note: 57, gain: 0.4 },
        { atSec: 0.4, durSec: 1.2, note: 62, gain: 0.6 },
        { atSec: 1.7, durSec: 0.6, note: 64, gain: 0.5 },
        { atSec: 2.4, durSec: 1.6, note: 65, gain: 0.6 },
        { atSec: 4.2, durSec: 0.6, note: 64, gain: 0.5 },
        { atSec: 4.9, durSec: 2.2, note: 62, gain: 0.6 },
      ],
    },
    asleep: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 45, gain: 0.55 },
        { atSec: 0, durSec: 3.4, note: 52, gain: 0.5 },
        { atSec: 0, durSec: 3.4, note: 60, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.55 },
        { atSec: 3.6, durSec: 3.6, note: 53, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 57, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.45 },
      ],
    },
    single: { notes: [{ atSec: 0, durSec: 6.8, note: 57, gain: 0.7 }] },
    highhold: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 69, gain: 0.5 },
        { atSec: 1.4, durSec: 5.4, note: 76, gain: 0.4 },
        { atSec: 3, durSec: 3.8, note: 72, gain: 0.4 },
      ],
    },
    bourdon: {
      notes: [
        { atSec: 0, durSec: 7, note: 43, gain: 0.55 },
        { atSec: 0, durSec: 7, note: 50, gain: 0.5 },
        { atSec: 0.9, durSec: 2.2, note: 62, gain: 0.5 },
        { atSec: 3.2, durSec: 1.6, note: 60, gain: 0.45 },
        { atSec: 5, durSec: 2.1, note: 59, gain: 0.5 },
      ],
    },
    sway: {
      notes: [
        { atSec: 0, durSec: 3.1, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 3.1, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 3.1, note: 65, gain: 0.5 },
        { atSec: 3.4, durSec: 3.7, note: 55, gain: 0.55 },
        { atSec: 3.4, durSec: 3.7, note: 60, gain: 0.5 },
        { atSec: 3.4, durSec: 3.7, note: 64, gain: 0.5 },
      ],
    },
    vault: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 45, gain: 0.7 },
        { atSec: 2.4, durSec: 1.4, note: 48, gain: 0.6 },
        { atSec: 4, durSec: 0.9, note: 47, gain: 0.55 },
        { atSec: 5, durSec: 2.2, note: 43, gain: 0.7 },
      ],
    },
  },
  directions: [
    {
      id: 'mountain-mouth',
      name: 'Mountain mouth',
      category: 'wind',
      rows: `
Goat path at seven | Mountain mouth | attack=.06 volume=2.5 pipe=Open bite=1 body=.4 vowel=.7 cup=.6 lung=2.6 turn=.8 leak=.12 sag=60 chiff=.3 second=0 spread=0.4 share=0.15 lock=0.2 | valley 1.mix=.2 | treeline | Keen cane in an open pipe, pinched to an eh, each breath sliding down before the next
Cairn in low cloud | Mountain mouth | pipe=Open bite=.72 leak=.62 lung=8 turn=.9 attack=.5 second=.5 interval=12 beat=.3 cup=0 release=2.2 volume=2 spread=0.65 share=0.55 lock=0.4 chiff=0.4 | mist | ney | A dull cane reed with its octave, half breath, slow to speak
Snow bridge | - | reed=Cane cup=0 interval=19 breath=Once lung=9 turn=.5 starve=0 leak=.5 chiff=.15 attack=.35 release=2.6 sag=40 volume=3 pipe=Cone bite=.7 body=.7 second=.5 spread=1 share=0.3 lock=0.7 beat=0.9 | late | treeline | One breath for each key of cane in a cone, a twelfth over it, bending down as it goes
Larch ridge | Mountain mouth | pipe=Cone bite=.85 body=.6 lung=3.2 turn=.2 second=.4 interval=7 leak=.2 chiff=.7 attack=.03 cup=.15 sag=12 volume=6 spread=0.5 share=0.75 lock=0.85 beat=1.8 | yard 1.level=.8 | slopes | Cane in a cone with a fifth beside it, tongued hard
Bell wether | Mountain mouth | breath=Circular turn=.2 interval=-12 second=.7 beat=.6 vowel=.55 cup=.7 leak=.25 bite=.97 attack=.2 volume=4 lung=2 spread=0.25 share=0.45 lock=0.6 chiff=0.05 | clean | treeline | Cane on an open ah over its lower octave, breath going round every two seconds
Two sides of a gorge | - | reed=Brass pipe=Open bite=.62 body=.6 cup=.1 second=.8 interval=7 beat=0 breath=Both lung=1.8 turn=.3 starve=0 lock=.8 leak=.3 chiff=.4 attack=.05 release=.8 spread=1 volume=-2.5 share=0.3 | farstar | duet | Brass reeds a true fifth apart, two seconds out and two in
Mule train below | - | reed=Cane pipe=Chest bite=.93 body=.45 cup=.3 vowel=.4 second=.6 interval=5 beat=1.2 breath=Out lung=1.2 turn=.15 starve=.2 share=.5 leak=.15 chiff=.8 attack=.02 release=.3 volume=2 spread=1 lock=0.6 | repeats | hocket | Short cane calls on a wooden chest with a fourth that beats
Whey and smoke | Mountain mouth | reed=Paper bite=.8 pipe=Open second=.5 interval=4 beat=.5 breath=Both lung=2.6 turn=.6 leak=.1 cup=.2 attack=.12 release=1.2 sag=30 volume=-2.5 spread=0.5 share=0.45 lock=0.2 chiff=0.1 | warmth | sixths | Paper reeds with a true third above, breathing softly both ways
High hut lamp | - | reed=Brass pipe=Stopped bite=.5 body=.9 cup=.35 vowel=.2 second=.4 interval=9 beat=.4 breath=In lung=2.8 turn=.4 starve=0 leak=.4 chiff=.1 attack=.3 release=1.6 sag=0 volume=6 spread=0.25 share=0.15 lock=0.4 | darkether | ney | Round stopped brass with a sixth above, swelling on the breath in
Snowmelt | - | reed=Steel pipe=Stopped bite=.4 body=.8 cup=.2 vowel=.3 second=.6 interval=12 beat=1.6 breath=Both lung=1.1 turn=.2 starve=-.4 leak=.35 chiff=.3 attack=.03 release=.5 share=.6 volume=1 spread=0.4 lock=0.7 | fan | treeline | Muted steel in stopped pipes with an octave fluttering over it, short breaths
Jaw of the hill | - | reed=Steel pipe=Chest bite=.55 body=.2 vowel=.15 cup=1 second=0 breath=Both lung=.6 turn=.1 starve=0 leak=.08 chiff=1 attack=.012 release=.4 sag=0 spread=.2 volume=3 share=0.45 lock=0.4 | bare | hocket | A plucked steel tongue in cupped hands, its oo opening with each half second of breath
Speaking stone | Mountain mouth | pipe=Chest vowel=.5 cup=1 bite=.99 lung=.9 turn=.14 breath=Both leak=.15 chiff=.6 attack=.03 second=0 body=.3 sag=8 volume=5.5 spread=0.5 share=0.15 lock=0.7 | stairs | slopes | Cane cupped tight on an open ah, a word to each breath
Narrow ee of wind | - | reed=Brass pipe=Open bite=.58 vowel=.97 cup=.9 body=.5 second=.3 interval=12 beat=2 breath=Both lung=2 turn=.5 leak=.5 chiff=.2 attack=.15 release=.6 starve=0 volume=2 spread=0.25 lock=0.85 | chamber | ney | A thin breathy ee through hands round a brass reed
Charcoal burner | Mountain mouth | reed=Brass bite=.9 vowel=.08 cup=.85 lung=3 turn=.5 breath=Out interval=-12 second=.6 beat=.8 leak=.2 chiff=.3 body=.5 pipe=Cone attack=.09 volume=4 spread=0.4 share=0.3 lock=0.6 | darkhall | treeline | Dark brass shut in an oo with an octave under, breathing out
Rumour from the pass | - | reed=Paper pipe=Stopped bite=.95 vowel=.7 cup=.95 body=.4 second=.5 interval=7 beat=.9 breath=Both lung=1.4 turn=.35 leak=.06 chiff=.4 attack=.08 release=.5 spread=.6 volume=2 share=0.75 lock=0.2 | shortwave | slopes | Paper mouths an eh with a fifth inside it
Climbing too fast | Short of breath | reed=Cane pipe=Chest lung=.22 turn=.12 bite=.94 cup=.4 vowel=.45 leak=.25 interval=-5 second=.4 volume=2.5 spread=0.5 lock=0.6 | booth | treeline | Cane gasps four times a second with a fourth beneath it
Last hundred metres | Short of breath | pipe=Stopped bite=.6 body=.9 cup=.15 lung=.5 turn=.4 second=.3 interval=19 beat=.5 leak=.6 release=.4 volume=5 spread=0.25 lock=0.2 | brightair | slopes | Brass blows puff by puff, more air than tone, a twelfth far above
Stitch in the side | Short of breath | reed=Paper bite=.85 pipe=Open lung=.7 turn=.5 cup=.1 second=.7 interval=0 beat=5 leak=.05 sag=60 attack=.06 volume=1 spread=0.4 lock=0.4 | patter | ney | Paper breath that sags on every gasp, its second reed beating fast
Dog on the scree | Short of breath | reed=Steel pipe=Cone lung=.18 turn=.06 cup=.8 second=.2 interval=12 chiff=.9 share=.8 spread=1 leak=.12 volume=4 bite=.36 vowel=.6 lock=0.7 | pendulum | treeline | Steel panting hard behind cupped hands
Hands on knees | Short of breath | breath=Out lung=1.3 turn=.9 pipe=Chest bite=.75 cup=.75 vowel=.6 sag=45 interval=12 release=1.4 attack=.15 share=.6 volume=1.5 spread=1 lock=0.85 beat=1.4 | room2 | overdrone | Brass that lets go of each breath and waits before the next
Leaf between thumbs | Paper lullaby | pipe=Chest bite=1 cup=.3 vowel=.85 second=0 breath=Once lung=2.6 turn=.2 leak=.05 attack=.02 release=.2 body=.2 chiff=.45 volume=-3.5 spread=0.25 share=0.75 lock=0.7 | forward | shepherd | Paper squeezed bright and bare, one breath to each key
Alder bark | Row of bottles | second=.25 interval=12 leak=.28 chiff=.9 attack=.05 lung=3 breath=Out bite=.55 body=.7 cup=.15 volume=6 spread=0.4 share=0.45 lock=0.85 | board | treeline | Soft paper in a stopped pipe with a hard puff at each start
Seven hollow stems | Row of bottles | pipe=Open bite=.4 second=.6 interval=19 leak=.2 chiff=.35 attack=.08 breath=Both lung=2.2 turn=.8 starve=.8 body=1 release=1 spread=0.65 share=0.15 lock=0.6 beat=2.4 | summer | broken | Open pipes over paper reeds, each with its twelfth, the low ones first on the way out
Owl in the gully | Row of bottles | bite=.15 body=1 second=0 leak=.12 chiff=.3 attack=.2 breath=Once lung=6 turn=.8 cup=.6 vowel=.05 sag=35 release=.9 volume=4.5 spread=1 share=0.55 lock=0.2 | lattice | slopes | Nearly a flute, paper and stopped pipe in a closed oo, falling as it ends
Grass in a closed fist | Paper lullaby | reed=Paper bite=.9 pipe=Cone body=.9 cup=.5 vowel=1 second=.8 interval=0 beat=3.5 lung=1.2 turn=.25 leak=.1 attack=.03 chiff=.5 spread=.9 volume=-2.5 share=0.3 lock=0.4 | thinned | ney | Two papers beating in a cone, pinched to a narrow ee
Porch above the valley | - | reed=Brass pipe=Chest bite=.8 body=.3 cup=.5 vowel=.45 second=.5 interval=12 beat=.3 breath=Both lung=1.5 turn=.18 starve=.1 lock=.3 sag=30 leak=.12 chiff=.2 attack=.03 release=.3 spread=.4 volume=-2 share=0.15 | combo | sixths | Brass reeds on a small wooden chest, in and out, bending as they thin
Harmonica weather | - | reed=Brass pipe=Chest bite=.68 body=.5 cup=.85 vowel=.3 second=.8 interval=0 beat=1.8 breath=Both lung=2.1 turn=.3 sag=70 leak=.3 chiff=.05 attack=.08 release=.5 spread=.5 volume=-3.5 share=0.55 lock=0.4 | shadowed | slopes | Two brass reeds in close hands, sagging well flat as each breath ends
Rail halt, no train | Short of breath | lung=3.4 turn=.7 breath=Out pipe=Chest bite=.72 cup=.9 vowel=.55 sag=55 second=.6 interval=7 attack=.2 release=1.1 leak=.22 spread=1 lock=0.7 beat=0.8 volume=-1 | platform | treeline | Long falling brass breaths with a fifth beside them
Fence wire hums | - | reed=Steel pipe=Chest bite=.5 body=.6 cup=.45 vowel=.4 second=.7 interval=0 beat=1 breath=In lung=2.4 turn=.25 starve=.3 leak=.06 chiff=.15 attack=.4 release=1.5 sag=6 spread=1 volume=-0.5 share=0.75 lock=0.85 | stub | overdrone | Two steel reeds a hair apart, pulled in on each breath
Coffee in tin cups | Chiff keys | reed=Brass bite=.76 pipe=Chest body=.4 cup=.3 vowel=.6 second=.4 interval=12 lung=2.2 leak=.1 chiff=.6 release=.25 sag=20 volume=2.5 spread=0.25 share=0.45 lock=0.6 beat=1.2 | tin | hocket | Short brass breaths, tongued and soon gone
Wedding on the saddle | Wedding pipes | beat=2.6 chiff=.8 lung=9 starve=.3 cup=.3 vowel=.6 interval=12 sag=10 leak=.15 volume=6 spread=0.65 share=0.3 | yard 1.level=.8 | slopes | Loud cane cones with an octave beating over them, never out of breath
Two old shawms | Wedding pipes | interval=-5 beat=.5 second=.7 bite=.9 body=.5 lock=.8 cup=.5 vowel=.35 attack=.08 breath=Both lung=2.8 turn=.3 release=.7 volume=-1 spread=1 share=0.75 | answer | duet | Nasal cane with a true fourth beneath, turning over with the breath
Dust on the drovers | Wedding pipes | reed=Brass bite=.88 interval=7 beat=0 second=.5 breath=Out lung=2 turn=.2 sag=20 chiff=.3 cup=.1 spread=1 release=.5 share=.2 volume=0 | valve | treeline | Brass in cones with pure fifths, each breath falling away
Lead goat | Wedding pipes | reed=Paper second=.4 interval=24 beat=1 cup=.2 leak=.06 vowel=.75 breath=Both lung=1.3 turn=.15 attack=.04 volume=-1.5 bite=.93 spread=0.25 share=0.15 lock=0.4 | repeats 1.time=300 1.mix=.28 | slopes | Paper buzzing in a cone, a second reed two octaves over it, quick to turn over
Thistle and iron | Wedding pipes | reed=Steel body=.9 cup=.4 vowel=.15 interval=7 second=.3 beat=.3 share=1 lock=.1 chiff=.2 attack=.15 volume=5.5 spread=0.4 bite=.4 | twelve | treeline | Steel in cones, the fifths trembling with each other's tone
Icicle whistle | - | reed=Steel pipe=Open bite=.32 body=.95 cup=0 second=.5 interval=24 beat=.8 breath=Once lung=5 turn=.3 leak=.25 chiff=.6 attack=.03 release=3 sag=0 volume=4 share=0.45 lock=0.4 spread=.5 | sheen | shepherd | Soft steel in open pipes, two octaves above ringing on
Kestrel hangs | Morning reeds | breath=Circular lung=1.2 turn=.1 second=.6 interval=12 starve=0 attack=.3 release=1.8 leak=.3 cup=.3 volume=-2 spread=0.5 share=0.15 chiff=0.2 bite=.38 vowel=.55 | thin | highhold | Brass held high and still, the cheeks filling once a second
Needle of light | Wire swell | pipe=Stopped second=.2 interval=19 cup=.1 lung=2 turn=1.2 release=3.4 chiff=.5 spread=.5 volume=6 share=0.55 lock=0.85 bite=.45 body=.6 attack=.15 | glimmer | shepherd | Quiet stopped steel drawn in, a twelfth ringing above
Glacier mouth | Wire swell | pipe=Open body=1 interval=7 second=.9 lung=6.5 turn=2.6 attack=1.6 release=5 bite=.42 starve=.9 sag=25 volume=6 spread=1 share=0.6 lock=0.6 beat=1.1 | winterheld | suspend | Steel swells in open pipes on long breaths in, the low keys late | pad
Frost along the rail | Steel bells | pipe=Stopped cup=.5 vowel=.35 lung=4.5 chiff=.6 second=.6 interval=12 release=2.4 leak=.28 bite=.5 volume=5 spread=0.6 share=0.75 beat=0.9 | darkplate | shepherd | Steel tongues in stopped pipes, half bell and half breath | bell
Weather turns inward | - | reed=Cane pipe=Open bite=.8 body=.8 cup=.4 vowel=.25 second=.5 interval=-12 beat=.4 breath=In turn=1.4 starve=.6 leak=.4 chiff=0 release=2.4 sag=15 volume=3.5 lung=3.6 attack=.7 spread=0.7 lock=0.6 | under | suspend | Cane with an octave below, swelling through each long breath in | pad
Cowbells gone home | Wire swell | reed=Brass pipe=Chest bite=.55 cup=.6 vowel=.5 second=.8 interval=7 lung=3 turn=1 attack=.7 release=2 sag=40 leak=.35 volume=4.5 spread=0.25 share=0.3 lock=0.2 beat=1.8 | ahs | ney | Brass on an ah that grows with each breath in and lets go
Long shadow of the peak | Mountain mouth | breath=In turn=.8 bite=.75 pipe=Stopped vowel=.1 cup=.75 leak=.5 release=3 second=.6 interval=7 volume=-1 lung=2.6 attack=.4 starve=.7 spread=0.4 share=0.75 lock=0.4 chiff=0.4 | faraway | chantline | Dim stopped cane with a fifth, drawn in slowly, the top keys before the low
Rope over the edge | - | reed=Brass pipe=Cone bite=.62 body=.7 cup=.25 vowel=.3 second=.3 interval=2 beat=.2 breath=In lung=1.6 turn=.6 starve=0 sag=60 leak=.25 attack=.2 release=.8 lock=.1 volume=4 spread=0.65 share=0.45 chiff=0.2 | backwards | treeline | Brass in cones a tone apart, each breath in rising out of a deep sag
Hay barn, doors open | - | reed=Paper pipe=Chest bite=.75 body=.9 cup=.3 vowel=.4 second=.5 interval=12 beat=1.1 breath=In turn=1.8 starve=.4 leak=.08 chiff=0 release=1.4 spread=1 volume=-1.5 lung=2.8 share=0.15 lock=0.85 attack=.3 | swellroom | overdrone | Paper on a wooden chest draws a breath, lets it go and waits
Horn of hollow larch | Mountain mouth | pipe=Cone bite=.9 body=.8 cup=.6 vowel=.02 second=.5 interval=-12 beat=.1 lung=4.5 turn=.6 leak=.12 chiff=.2 attack=.18 release=1.4 sag=18 volume=0.5 share=0.75 | valley 1.mix=.36 1.decay=6 | vault | Cane deep in a cone, shut in an oo, its octave under | bass
Bear in the bilberries | - | reed=Cane pipe=Stopped bite=.97 body=.6 cup=.8 vowel=.3 second=.3 interval=0 beat=.7 breath=Both lung=1 turn=.3 leak=.3 chiff=.7 attack=.02 release=.35 spread=.2 sag=35 volume=-1.5 | shell | barge | Low cane grunts in and out through cupped hands | bass
Old snow under firs | - | reed=Paper pipe=Open bite=.6 body=.9 cup=.5 vowel=.15 second=.4 interval=7 beat=.2 breath=Out lung=5 turn=1 leak=.12 chiff=.1 attack=.4 release=1.6 sag=10 starve=.5 volume=1.5 share=0.15 | wool | cellar | Dark low paper with a fifth, breathed out slowly | bass
Boulder field at dusk | Circular drone | reed=Brass bite=.7 pipe=Stopped interval=-5 second=.6 lung=3 turn=.5 cup=.3 vowel=.2 leak=.35 attack=.3 starve=.7 volume=2 spread=0.95 share=0.55 chiff=0.1 | mineshaft | fifth | Stopped brass with a fourth beneath, sniffing and never stopping | drone
Ford at first frost | Reed bass | reed=Steel bite=.36 pipe=Open body=.9 breath=Both lung=1.6 turn=.2 cup=.2 second=.4 interval=12 leak=.2 chiff=.8 release=1.6 share=.6 volume=0 | pebble | tenor | Low soft steel, struck by the tongue and breathing both ways | bass
`,
    },
    {
      id: 'last-breath',
      name: 'Last breath',
      category: 'pad',
      rows: `
Lights out by rows | Last breath | lung=14 pipe=Open bite=.66 second=.4 interval=12 sag=30 leak=.3 attack=.6 release=3.5 cup=.2 volume=-1.5 spread=1 share=0.6 lock=0.2 beat=1.4 | hall | gather | Brass in open pipes on one long breath, the high keys going silent first
The theatre empties | Last breath | reed=Cane bite=.9 pipe=Chest lung=7 starve=1 sag=80 second=.6 interval=-12 attack=.2 release=1 share=.8 leak=.2 spread=0.6 lock=0.4 chiff=0.4 beat=1 | loft | suspend | Cane over its lower octave bends far down as the one breath goes
Down to the cellar stair | Last breath | pipe=Cone bite=.75 cup=.55 vowel=.2 lung=9 starve=.8 sag=20 lock=1 interval=7 beat=0 second=.8 leak=.15 attack=.9 volume=3 spread=0.9 share=0.3 | sinking | twochords | Brass fifths in cones that lock, thin and come loose as the air goes
Last seat by the window | Last breath | lung=5 turn=2.2 pipe=Stopped bite=.5 body=.85 cup=.1 second=.15 interval=19 leak=.5 attack=.35 release=1.6 sag=12 volume=1 spread=0.7 share=0.75 lock=0.85 chiff=0.5 | wideair | suspend | Round stopped brass holds for a second and then falls away from the top
Nobody at the bell | Last breath | reed=Steel bite=.38 pipe=Chest body=.8 lung=8 cup=.4 vowel=.3 second=.5 interval=12 sag=0 leak=.1 attack=.15 release=6 chiff=.4 spread=0.5 share=0.45 lock=0.6 beat=0.8 | darkhall | gather | Soft steel on one breath, its bars sounding on after the air is gone
Basement first | Last breath | starve=-1 lung=8 pipe=Open interval=12 second=.7 beat=1.4 sag=15 leak=.3 cup=.1 attack=.5 spread=1 bite=.8 volume=4 share=0.6 lock=0.85 chiff=0.5 | brighthall | twochords | The low keys starve first and leave brass octaves beating above
Roof still lit | Last breath | starve=-.8 reed=Cane pipe=Stopped bite=.85 lung=10 interval=7 second=.5 sag=45 leak=.4 cup=.5 vowel=.6 release=3 attack=.7 volume=-0.5 spread=0.9 share=0.75 lock=0.6 | clouds | gather | Hollow cane with a fifth on an open eh, emptied from below
Fog off the floor first | Last breath | starve=-.9 reed=Paper bite=.6 pipe=Open lung=6 leak=.1 cup=.3 vowel=.15 attack=.8 release=2 second=.3 interval=-12 sag=25 turn=1 volume=3.5 spread=0.7 share=0.45 lock=0.2 | mist | suspend | Soft paper over its lower octave goes silent from the bottom up
Ice from the keel | Last breath | starve=-1 reed=Steel bite=.45 pipe=Stopped body=.7 lung=4.5 interval=24 second=.4 sag=0 release=4 attack=.1 chiff=.7 leak=.2 volume=4.5 spread=0.5 share=0.6 lock=0.4 beat=1.2 | thin | twochords | Stopped steel with two octaves over it, the bass starved out first
Piano lid left open | Last breath | starve=-.6 pipe=Chest bite=.58 lung=3.2 share=.9 cup=.75 vowel=.75 second=.3 interval=4 beat=.2 sag=70 release=1.3 attack=.06 chiff=.5 volume=1 spread=0.45 lock=0.7 | parlour | broken | Each new key refills a brass chest whose low reeds tire first | keys
More wind than reed | Last breath | leak=1 bite=.55 pipe=Stopped body=1 lung=8 cup=0 second=0 sag=10 starve=.4 attack=1 release=2.5 turn=.8 volume=1 spread=0.9 share=0.45 lock=0.4 | open | suspend | Almost all breath, a stopped pipe holding a trace of brass in it
Dust in the bellows | Last breath | leak=.9 reed=Cane bite=.7 pipe=Chest body=.8 lung=5 cup=.4 vowel=.5 second=.4 interval=0 beat=2.2 attack=.3 sag=35 spread=1 volume=-0.5 share=0.6 lock=0.7 chiff=0.2 | wornthin | twochords | Leaky cane on its chest, two reeds beating under the hiss
Window seat draught | Last breath | reed=Paper bite=.5 pipe=Cone body=.7 lung=11 cup=.7 second=.2 interval=12 attack=1.6 release=3 sag=20 volume=2 spread=0.7 lock=0.85 vowel=.8 leak=.7 | nextdoor 1.level=.7 | single | Air through paper in a cone with a narrow vowel, thinning slowly | texture
Sash left on the latch | Last breath | leak=.75 reed=Steel bite=.3 pipe=Open body=1 lung=6.5 cup=.1 second=.5 interval=7 attack=.5 release=4 sag=5 starve=.9 volume=1.5 spread=1 share=0.6 lock=0.6 chiff=0.05 beat=1.1 | breeze | gather | Wind in open pipes with dim steel fifths inside it
Air after the hymn | Last breath | leak=.8 pipe=Open bite=.5 body=.9 lung=12 cup=.5 vowel=.4 second=.6 interval=-5 beat=.1 attack=1.2 release=2 sag=8 lock=.9 starve=.2 volume=-0.5 spread=0.6 share=0.75 | breathing | middle | Slow breath and round brass with a fourth under each key, held a long time
Sigh at the sink | Last breath | sag=90 pipe=Stopped bite=.7 cup=.6 vowel=.55 second=.3 attack=.05 release=.5 chiff=.3 volume=6 spread=1 share=0.55 lock=0.6 lung=2.2 leak=.25 | booth | hocket | A short stopped brass sigh for each key, bent down nearly a semitone | keys
Third night awake | Last breath | reed=Cane bite=.95 pipe=Chest lung=2.4 sag=75 cup=.8 vowel=.3 second=.5 interval=-12 beat=1 attack=.1 release=1.1 leak=.25 spread=.5 share=0.6 lock=0.2 chiff=0.1 | blanket | broken | Cane sighs in close hands over a low octave, drooping each time | keys
Letter folded again | Last breath | reed=Paper bite=.85 pipe=Chest lung=1.1 sag=50 cup=.2 second=.6 interval=12 attack=.02 release=.3 chiff=.7 leak=.05 spread=.7 volume=1 share=0.75 beat=0.9 | slap | ostinato | Quick paper sighs with an octave, gone in half a second | plucked
Small no, twice | Last breath | pipe=Cone bite=.8 lung=1.3 turn=.6 sag=60 cup=.9 vowel=.1 second=.2 interval=0 beat=.6 attack=.03 release=.4 chiff=.1 starve=0 leak=.1 volume=6 spread=0.6 share=0.45 lock=0.7 | acrossroom 1.level=1 | slopes | Nasal brass shut in an oo lets each key sink away at once | voice
Shoulders come down | Last breath | lung=3.4 turn=.3 sag=40 pipe=Open bite=.62 second=.8 interval=7 attack=.2 release=2 share=1 leak=.45 spread=1 volume=6 lock=0.85 chiff=0.5 beat=1.8 | sighs | sway | Brass fifths that exhale together, every new key taking air from the rest
Moth against the shade | Last breath | reed=Paper bite=.75 pipe=Open lung=3 second=.7 interval=19 beat=2.6 attack=.1 release=.8 leak=.05 sag=15 chiff=.4 cup=0 spread=1 volume=3 share=0.75 lock=0.7 | facets | broken | Fluttering paper with a twelfth that beats, one breath a key
Candle by the sickbed | Last breath | reed=Paper bite=.45 pipe=Stopped body=.6 lung=13 second=.2 interval=12 attack=1 release=2.6 leak=.03 cup=.45 vowel=.2 sag=35 starve=.7 volume=1 spread=1 share=0.45 lock=0.85 beat=.9 | wax | asleep | Very soft paper in stopped pipes burns down from the top
Curtain breathes once | Last breath | reed=Paper bite=.95 pipe=Chest body=.5 lung=4 turn=1.6 second=.5 interval=-12 beat=.3 attack=.6 release=1.2 leak=.08 cup=.6 vowel=.7 sag=10 volume=1 spread=0.6 share=0.6 lock=0.6 | swellroom | middle | Paper on an eh with a low octave holds, then lets go
Rice paper lantern | Last breath | reed=Paper bite=.65 pipe=Cone body=.5 lung=7 second=.9 interval=0 beat=.5 attack=.3 release=1.6 leak=.02 cup=.15 sag=0 lock=.9 spread=1 starve=-.4 volume=3.5 share=0.55 chiff=0.1 | hollowswell | gather | Two papers to a key in cones, steady in pitch as they fade
Feather on the step | Last breath | reed=Paper bite=.3 pipe=Open body=.4 lung=2.4 second=0 attack=.08 release=.6 leak=0 cup=0 sag=45 chiff=.2 spread=.6 starve=.3 volume=1.5 share=0.3 lock=0.4 | tabled | lullaby | Round soft paper without a hiss, a short falling breath to each key | keys
Last filament | Last breath | reed=Steel bite=.6 pipe=Chest body=.15 lung=5 cup=.75 vowel=.1 second=.7 interval=0 beat=.9 sag=0 leak=0 attack=.02 chiff=.8 release=3 spread=1 volume=2 share=0.6 lock=0.2 | shade | twochords | Two steel tongues beating in close hands, cooling as the breath ends
Wires after the tram | Last breath | reed=Steel bite=.52 pipe=Cone body=.8 lung=9 cup=.5 vowel=.35 second=.3 interval=-12 beat=.2 sag=12 leak=.08 attack=.8 release=5 starve=1 volume=2 spread=0.6 share=0.55 lock=0.4 | springs | gather | Steel in cones with a deep octave dies from the top key down
Cold kettle | Last breath | reed=Steel bite=.48 pipe=Stopped body=1 cup=.2 second=.6 interval=7 beat=1.2 sag=30 leak=.35 attack=.03 release=2 chiff=.5 starve=.2 volume=1.5 spread=0.3 share=0.3 lock=0.7 lung=3.6 | pot | broken | Hollow steel fifths that sag and ring on in their pipes | keys
Moon off the roof tin | Last breath | reed=Steel bite=.4 pipe=Open body=.7 lung=15 cup=.1 second=.8 interval=12 beat=.15 sag=0 leak=.1 attack=1.4 release=8 share=.1 lock=.9 spread=1 volume=2.5 | hanging | suspend | Slow soft steel with an octave each, locked and still as it fades
Razor grass | Last breath | reed=Steel bite=.68 pipe=Chest body=.5 lung=3.5 cup=.9 vowel=.5 second=.4 interval=5 beat=.3 sag=18 leak=.06 attack=.25 release=1 chiff=0 starve=-.5 volume=3 spread=0.5 share=0.45 lock=0.6 | held | chantline | Steel on a cupped ah with a fourth above each key
Reed bed in November | Last breath | reed=Cane bite=.97 pipe=Stopped body=.6 lung=6 second=.3 interval=12 beat=.6 sag=28 leak=.45 attack=.25 release=.8 cup=.1 starve=.6 chiff=.3 volume=0.5 spread=0.6 share=0.3 lock=0.85 | chamber | twochords | Edged cane in stopped pipes, stopping almost as soon as it is let go
Boathouse in the rain | Last breath | reed=Cane bite=.82 pipe=Open body=.9 lung=10 second=.7 interval=-12 sag=8 leak=.2 attack=.7 release=3 cup=.3 vowel=.2 starve=0 share=.2 spread=0.9 lock=0.6 beat=1 | halftime | asleep | Cane in open pipes with the octave below, all keys sinking alike
Half a word of hers | Last breath | reed=Cane bite=1 pipe=Chest body=.3 lung=3 second=0 sag=55 leak=.1 attack=.04 release=.5 cup=1 vowel=.62 starve=1 chiff=.6 spread=.3 volume=-0.5 share=0.45 lock=0.2 | whisper | broken | Bare cane spoken in close hands, each key a syllable that drops | voice
Osier basket | Last breath | reed=Cane bite=.9 pipe=Cone body=.7 lung=4.2 turn=1 second=.5 interval=16 sag=0 leak=.12 attack=.15 release=1 cup=.2 starve=-.3 lock=.8 spread=.9 volume=-1 share=0.15 chiff=0.4 beat=0.6 | reel | suspend | Cane cones with a tenth over each, held a little and let down straight
Bottom of the pond | Last breath | reed=Cane bite=.6 pipe=Stopped body=1 lung=12 second=.4 interval=7 beat=.1 sag=65 leak=.3 attack=1.5 release=2.4 cup=.7 vowel=.05 starve=.9 volume=-1 spread=1 share=0.55 lock=0.7 | deepwater | asleep | Round cane with a fifth in an oo, sinking far as the air runs out
Ah closing to oh | Last breath | cup=1 vowel=.5 pipe=Open bite=.85 lung=7 second=.5 interval=0 beat=.8 sag=20 leak=.15 attack=.4 release=1.5 starve=.3 volume=3 spread=1 share=0.45 lock=0.4 chiff=0.4 | chapel | duet | Brass mouths that close from ah toward oh as the breath falls | voice
Choir stall at four | Last breath | cup=.85 vowel=.28 reed=Cane bite=.92 pipe=Chest lung=9 second=.4 interval=12 beat=1.2 sag=10 leak=.1 attack=.9 release=2 starve=.6 lock=.8 volume=0.5 spread=0.5 share=0.15 | lungs | suspend | Cane on a rounded oh, every key with its octave, one breath long | voice
Narrow light, closing | Last breath | cup=.9 vowel=1 pipe=Stopped bite=.6 lung=5 second=.3 interval=19 beat=.3 sag=35 leak=.5 attack=.5 release=1.4 starve=.7 spread=.9 volume=-1 share=0.55 lock=0.85 chiff=0.5 | lowpass | gather | A breathy ee over stopped brass that closes as the lung empties
Mother tongue, far room | Last breath | cup=.95 vowel=.7 reed=Paper bite=.9 pipe=Open lung=4 second=.6 interval=-12 sag=48 leak=.08 attack=.12 release=.7 chiff=.5 starve=.1 spread=0.35 share=0.3 lock=0.6 beat=0.8 volume=5 | acrossroom 1.distance=.62 1.level=.9 | duet | Paper speaks an eh with a low voice under it, drooping | voice
Closed mouth hum | Last breath | cup=1 vowel=0 pipe=Cone bite=.5 lung=11 second=.5 interval=0 beat=.4 sag=12 leak=0 attack=1.2 release=2.2 starve=.5 lock=1 volume=3 spread=0.6 share=0.75 | darkplate | asleep | Round brass in cones hums behind shut lips, two reeds barely apart | voice
One long lungful | - | breath=Out lung=22 turn=1.5 bite=.76 body=.4 cup=.1 second=.7 interval=12 starve=.9 share=.6 sag=35 leak=.25 attack=.5 release=2 spread=1 pipe=Cone lock=0.6 chiff=0.05 beat=1.2 volume=-1 | plate | gather | Brass octaves on one long breath out, thin and bent by its end
Barge horn, then none | - | breath=Out reed=Cane bite=.94 pipe=Cone body=.7 lung=9 turn=3 cup=.4 vowel=.2 second=.6 interval=-12 beat=.3 starve=-.7 share=1 sag=25 leak=.1 attack=.15 release=1.2 volume=-1.5 spread=0.5 lock=0.2 chiff=0.1 | tunnel | twochords | Strong cane over an octave below falls away over three seconds and stops
Unanswered | - | breath=Out reed=Paper lung=6 turn=2.5 cup=.5 vowel=.45 second=.4 interval=7 starve=.5 share=.3 sag=50 attack=.8 release=1 pipe=Chest body=.6 leak=.02 bite=.95 spread=1 lock=0.4 beat=1.1 | murky | asleep | Bright paper fifths on a box run down, wait a long while and begin again
The oars are shipped | - | breath=Out pipe=Open bite=.6 body=.8 lung=5 turn=1.8 cup=.3 vowel=.3 second=.5 interval=9 starve=.7 sag=10 leak=.5 attack=1 release=3 chiff=0 lock=.2 volume=2 spread=0.6 share=0.45 beat=0.8 | surf | suspend | Brass with a sixth above breathes out, rests, and breathes out again
Two keys left in it | - | breath=Out reed=Steel bite=.5 pipe=Chest body=.6 turn=.5 cup=.6 vowel=.25 second=.2 interval=12 beat=.1 starve=1 share=.9 sag=0 leak=.1 attack=.3 release=3.5 volume=1.5 spread=0.9 lock=0.85 chiff=0.5 lung=30 | scooped | gather | Steel on a wooden chest whose upper keys give out as more are pressed
Grindstone at rest | Last breath | reed=Brass bite=.9 pipe=Chest body=.2 lung=6 interval=0 second=1 beat=4 sag=5 leak=.05 attack=.1 release=1 lock=.2 cup=0 starve=.2 share=.6 spread=0.5 chiff=0.2 | valveworn | twochords | Bare brass pairs that beat four times a second until the breath is spent
Ferry rope goes slack | Last breath | interval=-12 second=1 beat=.8 pipe=Cone bite=.6 body=.6 cup=.35 vowel=.1 lung=8 sag=90 leak=.15 attack=.3 starve=0 share=.5 release=1.4 volume=-2 spread=1 lock=0.85 chiff=0.5 | coil | asleep | Brass and the octave under it go down together almost a semitone
Wheel off its axle | Last breath | reed=Cane bite=.88 pipe=Chest lung=5 interval=14 second=.6 beat=5 sag=60 leak=.2 attack=.08 starve=-.2 share=.8 cup=.2 release=.7 spread=1 volume=0.5 lock=0.6 chiff=0.05 | drifting | broken | Cane with a ninth that beats fast and slides off its pitch
Standing at the grave | Last breath | pipe=Stopped bite=.55 body=.75 interval=-7 second=.7 beat=.1 lock=1 lung=16 sag=6 leak=.35 attack=1.3 starve=.4 cup=.3 vowel=.15 release=3 spread=0.9 share=0.55 volume=-1 | monks | asleep | Stopped brass with a true fifth under each key, one very slow breath
Turf smoke, straight up | Last breath | reed=Paper bite=.55 pipe=Open body=.9 interval=24 second=.5 lung=9 sag=4 leak=.15 attack=.7 starve=-.8 share=.7 cup=0 release=2.4 turn=1.4 volume=4 spread=0.7 lock=0.4 beat=1.8 | mistup | suspend | Paper in open pipes, two octaves over each key left hanging highest
`,
    },
    {
      id: 'circular-drone',
      name: 'Circular drone',
      category: 'drone',
      rows: `
Goatskin under the arm | Circular drone | lung=9 bite=1 body=.7 cup=.2 vowel=.4 interval=-12 second=.9 starve=0 attack=.3 leak=.08 sag=6 chiff=.3 volume=6 spread=0.45 share=0.15 beat=0.6 | yard | overdrone | Bright cane in cones with the octave beneath, a drone that never stops for breath
Barn floor, sieves out | Circular drone | pipe=Chest bite=.97 body=.3 lung=1.4 turn=.4 cup=.3 interval=-5 second=.7 beat=.1 lock=1 share=.8 attack=.1 spread=.6 chiff=0.4 | grit | bourdon | Buzzing cane over a true fourth below, catching air every second and a half
Snail shell march | Circular drone | reed=Brass bite=.86 body=.9 lung=5 interval=7 second=1 beat=0 cup=.1 vowel=.6 share=.6 sag=0 attack=.6 release=1 volume=-5 spread=0.95 | howling | fifth | Brass in cones and the fifths over them, locked hard
Tar and pitch pine | Circular drone | bite=.9 pipe=Stopped body=.6 interval=-12 second=1 cup=.5 vowel=.15 lung=12 leak=.3 share=.2 attack=1.2 volume=1 beat=.3 spread=0.3 | darkplate | bourdon | Cane in stopped pipes, its lower octave heaving slowly against it
Lanterns on the dyke | Circular drone | reed=Paper bite=1 body=.5 cup=.35 vowel=.55 interval=-12 second=.6 beat=1.6 lung=3 turn=1 leak=.02 share=.5 starve=.6 attack=.5 volume=-1.5 spread=0.6 chiff=0.05 | ahs | overdrone | Paper squeezed to a buzz over its low octave, fluttering in a cone
Sun on the far bank | - | breath=Circular pipe=Open body=.8 cup=.05 beat=.2 turn=1 starve=.3 lock=.9 leak=.2 attack=2 release=4 sag=0 spread=1 reed=Cane bite=.75 interval=9 lung=6 second=.7 share=0.3 | open | gather | Mellow cane in open pipes with a sixth over each key, opening over two seconds | pad
Grain lift at idle | - | breath=Circular reed=Brass bite=.74 pipe=Chest body=.8 cup=.4 vowel=.2 second=.9 interval=0 lung=8 turn=.3 starve=0 lock=.3 leak=.1 attack=.7 release=2 share=.7 spread=.4 volume=-1 beat=2.4 | beats | fifth | Pairs of brass reeds on a wooden chest swell together every two seconds
Amber in the sluice | - | breath=Circular reed=Brass bite=.5 pipe=Stopped body=.6 cup=.3 vowel=.5 second=.7 interval=19 beat=.3 lung=25 turn=2.4 starve=.5 lock=.7 leak=.45 attack=1.4 release=3 volume=5.5 spread=0.3 share=0.45 | water | overdrone | Quiet stopped brass under a twelfth, with air moving round it
Warm rails | - | breath=Circular reed=Brass bite=.82 pipe=Cone body=.4 cup=.7 vowel=.35 second=.5 interval=16 beat=.9 lung=4 turn=.6 starve=.2 lock=.6 leak=.05 attack=.4 release=1.6 sag=25 volume=5.5 spread=0.6 share=0.15 chiff=0.4 | swirl | sway | Brass cones shaded by hands, a tenth over each key
Oven door ajar | - | breath=Circular reed=Brass bite=.68 pipe=Open body=1 cup=.2 vowel=.1 second=.4 interval=-12 beat=.15 lung=6 turn=3 starve=.8 lock=1 leak=.3 attack=1 release=2.4 share=1 sag=40 volume=3 spread=0.45 | hazy | bourdon | Full open brass whose breath dips long and deep, the low reeds coming back first
Cheeks like bellows | - | breath=Circular reed=Cane bite=.96 pipe=Cone body=.5 cup=.9 vowel=.45 second=.5 interval=0 lung=.3 turn=.3 starve=0 lock=.5 leak=.1 attack=.02 release=.3 chiff=.6 share=.9 spread=0.95 beat=0.8 | bare | fifth | Cane whose breath dips three times a second in tight hands
Pump at the wellhead | - | breath=Circular reed=Brass bite=.7 pipe=Chest body=.6 cup=.6 vowel=.8 second=.8 interval=-12 lung=.55 turn=.6 starve=.6 lock=.4 leak=.4 attack=.05 release=.6 sag=45 volume=-1.5 spread=0.3 share=0.15 chiff=0.2 beat=0.6 | mineshaft | fifth | Brass over its low octave dips and sags twice a second
Slow piston | - | breath=Circular reed=Steel bite=.44 pipe=Open body=.7 cup=.5 vowel=.15 second=.5 interval=7 beat=.1 lung=.9 turn=1 starve=.7 lock=.8 leak=.12 attack=.15 release=1 share=.5 volume=4 spread=0.6 chiff=0.5 | combo | bourdon | Dull steel fifths that gulp air once a second
Boiler of the old ferry | - | breath=Circular reed=Paper bite=.9 pipe=Stopped body=.9 cup=.3 vowel=.3 second=.6 interval=-12 lung=.4 turn=.5 starve=.3 lock=.2 leak=.2 attack=.06 release=.5 sag=20 volume=0 spread=0.45 share=0.3 chiff=0.05 beat=0.8 | drum | bourdon | Low hollow paper chugging softly in a stopped pipe
Millrace by moon | - | breath=Circular reed=Brass bite=.55 pipe=Open body=.8 cup=.1 second=1 interval=24 beat=2 lung=.22 turn=.12 starve=-.6 lock=.3 leak=.5 attack=.1 release=1 spread=1 volume=6 share=0.75 chiff=0.1 | facets | highhold | Breathy open brass, two octaves at once, rippling four times a second | texture
Pylons in frost | Locked fifths | reed=Steel bite=.5 pipe=Chest body=.4 cup=.4 vowel=.2 interval=7 second=.6 beat=.2 lung=14 starve=0 sag=0 attack=1.4 release=5 leak=.05 volume=-1 spread=0.3 share=0.55 | shade | bourdon | Thin steel fifths standing nearly still on a wooden chest
Singing cable | Locked fifths | reed=Steel bite=.42 pipe=Stopped body=.9 cup=.2 interval=12 second=.8 beat=.5 lung=6 turn=1.2 starve=.6 sag=8 attack=.8 release=3 share=.5 volume=5 spread=0.6 | strings | overdrone | Hollow steel with the octave over it, slowly beating
Knife drawer, breathing | Locked fifths | reed=Steel bite=.62 pipe=Cone body=.6 cup=.8 vowel=.4 interval=-12 second=.7 beat=1.1 lung=2 turn=.4 starve=.3 lock=.3 attack=.3 release=2 leak=.1 volume=0.5 spread=0.45 share=0.75 chiff=0.4 | hollowed | fifth | Edged steel cones on a cupped ah over a deep octave
Weathervane seized | Locked fifths | reed=Steel bite=.55 pipe=Open body=.95 cup=.1 interval=5 second=.9 beat=0 lung=22 starve=.2 sag=0 attack=2.2 release=6 leak=.2 spread=1 volume=-1 share=0.45 | wintry | gather | Steel in open pipes, a true fourth over each key, very slow to bloom | pad
Substation at dawn | Circular drone | reed=Steel bite=.66 pipe=Chest body=.1 cup=.95 vowel=.05 interval=0 second=1 beat=.3 lung=10 attack=1 leak=0 share=1 spread=.3 volume=5 | nextdoor | deep | Two bare steel reeds per key, shut in an oo, trembling together
Points frozen over | - | breath=Circular reed=Paper bite=.4 pipe=Open body=.9 cup=0 second=.4 interval=12 lung=7 turn=1.6 starve=.2 leak=.5 attack=1.8 release=3 sag=10 chiff=0 volume=3 lock=0.7 beat=0.9 spread=.5 | pane | single | Mostly breath through open pipes, a pale paper octave inside it | texture
Breath on the mirror | - | breath=Circular reed=Paper bite=.6 pipe=Stopped body=.7 cup=.6 second=.2 interval=7 beat=.3 lung=3.4 turn=2 starve=.5 leak=.3 attack=.9 release=1.5 sag=30 chiff=0 volume=6 vowel=.28 spread=0.45 share=0.45 lock=0.85 | closemic | overdrone | Close soft paper in a half shut oh, drawing air for a long second
Sleeping pigeons | - | breath=Circular reed=Paper bite=.8 pipe=Chest body=.8 cup=.8 second=.7 interval=-12 beat=2.4 lung=1.1 turn=.5 starve=-.3 leak=.05 attack=.2 release=.6 sag=15 spread=.7 vowel=.5 share=0.15 lock=0.6 chiff=0.05 | board | twochords | Fluttering paper coos over a low octave on an open ah
Cotton mill, Sunday | - | breath=Circular reed=Paper bite=.95 pipe=Cone body=.8 cup=.2 vowel=.8 second=.9 interval=0 beat=.9 lung=15 turn=.3 starve=.1 leak=0 attack=.6 release=2 sag=0 lock=.9 volume=1.5 spread=0.9 share=0.55 | ensemble | gather | Two paper reeds in every cone, dry of breath and steady | pad
Marsh under ice | - | breath=Circular reed=Paper bite=.5 pipe=Open body=1 cup=.5 vowel=.05 second=.6 interval=-5 beat=.1 lung=11 turn=1 starve=.9 leak=.15 attack=1.3 release=2.8 sag=55 chiff=.1 volume=-1 spread=0.3 share=0.6 | darkwater | fifth | Dim paper over a fourth below, its pitch giving way whenever the air dips
Brick arch at noon | Circular drone | reed=Brass bite=.95 body=.2 cup=1 vowel=.3 interval=0 second=.6 beat=.2 lung=7 starve=.1 attack=.5 pipe=Chest leak=.02 spread=0.45 share=0.15 chiff=0.1 | chant | bourdon | Bright brass on one chest, held in close hands around an oh
Slow turn of the vowel | Circular drone | bite=.98 cup=1 vowel=.75 lung=1.8 turn=1.4 second=.4 interval=7 body=.4 leak=.05 sag=0 attack=.4 spread=0.7 share=0.55 chiff=0.4 beat=1.8 volume=-1.5 | notchy | overdrone | Cane on a bright eh that darkens with each catch of air
Eyes half shut | Circular drone | reed=Steel bite=.6 cup=1 vowel=.02 pipe=Open body=.6 second=.5 interval=12 beat=.1 lung=12 starve=.4 attack=1.8 release=4 leak=.08 volume=4 spread=0.95 share=0.3 | deepsea | fifth | Steel made dark in shut hands, an octave barely showing
Wordless, then not | Circular drone | reed=Paper bite=1 cup=.95 vowel=.5 pipe=Chest body=.4 second=.8 interval=-12 lung=2.6 turn=.8 starve=-.5 leak=.03 attack=.25 volume=-1.5 spread=0.5 share=0.75 chiff=0.5 beat=0.8 | oos | chantline | Paper on a wide ah over a low octave, taking air at the nose | voice
Hum of the hive box | Circular drone | reed=Brass bite=.8 cup=.9 vowel=.98 pipe=Chest body=.9 second=.7 interval=12 beat=3.4 lung=4.5 turn=.2 starve=0 share=1 lock=.1 attack=.2 volume=-1.5 spread=0.6 chiff=0.05 | papers | bourdon | Brass on a box, narrowed to an ee, its octaves beating fast
Two clocks disagree | - | breath=Circular reed=Brass bite=.76 pipe=Cone body=.3 cup=.15 second=1 interval=0 beat=1.3 lung=6 turn=.5 starve=0 lock=0 leak=.05 attack=.3 release=1.5 sag=0 spread=1 share=.2 volume=-1.5 chiff=0.5 | wideair | single | Pairs of brass reeds beating once and a bit each second, never pulled in
Slow argument of thirds | - | breath=Circular reed=Cane bite=.92 pipe=Open body=.6 cup=.2 second=.7 interval=3 beat=.4 lung=10 turn=.8 starve=.2 lock=1 leak=.2 attack=.7 release=2 sag=10 volume=-1.5 spread=0.9 share=0.75 | sustain | gather | Cane with a true minor third on each key, the whole chord settling | pad
Sixth of the evening | - | breath=Circular reed=Brass bite=.64 pipe=Stopped body=.7 cup=.4 vowel=.6 second=.8 interval=9 beat=.2 lung=4 turn=1.2 starve=.5 lock=.8 leak=.35 attack=1 release=2 sag=20 volume=3 spread=0.3 share=0.45 | evening | middle | Breathy stopped brass and a sixth above, dipping every four seconds
Skerry at low tide | - | breath=Circular reed=Cane bite=.95 pipe=Chest body=.7 cup=.3 vowel=.4 second=.5 interval=14 beat=.7 lung=2.2 turn=1 starve=.8 lock=.4 leak=.1 attack=.4 release=1.2 share=.8 volume=0 spread=0.6 chiff=0.4 | surf | fifth | Cane on its chest with a ninth over each key, emptied and filled every two seconds
Iron and oak | - | breath=Circular reed=Steel bite=.56 pipe=Chest body=.95 cup=.3 vowel=.3 second=.6 interval=-7 lung=7 turn=.4 starve=0 lock=.6 leak=.05 attack=.5 release=3 sag=0 share=.4 beat=.33 spread=0.45 chiff=0.2 | woolly | bourdon | Steel on heavy wood with a fifth below, beating once a second
Wheel of five lamps | - | breath=Circular reed=Brass bite=.72 pipe=Open body=.5 cup=.1 second=.5 interval=12 lung=2.4 turn=2.4 starve=1 share=.7 lock=.3 leak=.25 attack=.25 release=1.8 sag=30 spread=1 volume=4.5 chiff=0.4 beat=2.4 | circle | gather | Brass that loses its high keys at every dip and opens them again in turn | pad
Upside down river | - | breath=Circular reed=Cane bite=.9 pipe=Stopped body=.8 cup=.1 second=.4 interval=19 beat=.2 lung=3.6 turn=3 starve=-1 share=.9 lock=.5 leak=.3 attack=.4 release=2 sag=20 volume=2 spread=0.7 chiff=0.2 | undertow | gather | Hollow cane with twelfths whose lowest key is always last to come back | pad
Nobody leads | - | breath=Circular reed=Steel bite=.47 pipe=Open body=.6 cup=.2 second=.7 interval=0 lung=1.5 turn=1.5 starve=.9 share=1 lock=.2 leak=.15 attack=.5 release=3 sag=8 spread=1 volume=6 chiff=0.5 beat=1.6 | weave | twochords | Steel pairs that trade places with each gulp of shared air | pad
Round table, one cup | - | breath=Circular reed=Paper bite=.85 pipe=Chest body=.6 cup=.5 vowel=.5 second=.6 interval=7 lung=2 turn=1.8 starve=-.9 share=.8 lock=.6 leak=.08 attack=.3 release=1 sag=25 volume=-1 spread=0.55 chiff=0.05 beat=1.2 | afterglow | suspend | Paper fifths passing one breath down the chord, top keys first | organ
Carousel, power off | - | breath=Circular reed=Brass bite=.88 pipe=Chest body=.5 cup=0 second=.9 interval=12 beat=4 lung=3 turn=1 starve=.6 share=.4 lock=.2 leak=.05 attack=.08 release=.7 sag=65 spread=1 volume=0 chiff=0.1 | whirl | twochords | Bright brass octaves beating quickly and giving way with each dip of air | organ
Culvert, knee deep | Circular drone | reed=Cane bite=.8 pipe=Stopped body=1 cup=.2 vowel=.2 interval=-12 second=.5 lung=14 leak=.5 attack=1 sag=15 starve=.6 volume=0 spread=0.3 share=0.55 beat=1 | cavern | bourdon | Hollow low cane and its octave below, air rushing in the pipe
Peat cutter's noon | Circular drone | reed=Brass bite=.45 pipe=Stopped body=.9 cup=.1 interval=7 second=.3 beat=.2 lung=8 turn=.6 leak=.6 attack=.6 release=1 starve=.1 spread=0.6 share=0.3 | valveworn | fifth | Dull stopped brass, more air in it than tone, a fifth inside
Hull against the pier | Circular drone | reed=Paper bite=.7 pipe=Stopped body=.8 cup=.4 vowel=.1 interval=-12 second=.8 beat=.25 lung=5 turn=2 leak=.1 attack=.8 sag=70 starve=.2 volume=1 spread=0.45 share=0.75 | still | bourdon | Soft stopped paper over its octave, leaning flat at every slow dip
Grate in the pavement | Circular drone | reed=Steel bite=.36 pipe=Stopped body=.6 cup=.6 vowel=.25 interval=-12 second=.9 lung=3 turn=.3 leak=.25 attack=.4 release=2 share=.9 volume=0.5 spread=0.7 chiff=0.2 beat=1 | subbed | bourdon | Muted steel in stopped pipes on a closed oh, deep and slightly rough
Bilge water at midnight | Reed bass | release=3 leak=.2 chiff=0 reed=Cane pipe=Cone bite=.75 body=.7 vowel=.02 cup=.9 second=.7 interval=-5 lung=2.4 turn=1 share=.7 beat=.2 attack=.4 sag=20 spread=0.95 lock=0.85 | drum | fifth | Low cane in cones, shut in an oo over a fourth, dipping every two seconds
Halo of midges | - | breath=Circular reed=Steel pipe=Open body=.5 cup=.1 second=.8 interval=24 beat=3 lung=1.3 turn=.3 starve=-.5 lock=.2 attack=.6 release=4 sag=0 spread=1 volume=6 share=0.75 bite=.22 leak=.2 | thin | highhold | Fine steel with two octaves fluttering over it, catching air all the time | texture
White noon | Morning reeds | breath=Circular lung=9 turn=.4 starve=.2 attack=1.2 release=2.5 leak=.35 pipe=Open volume=0.5 reed=Steel interval=7 spread=1 share=0.45 lock=0.85 second=.4 bite=.22 | brightair | highhold | Steel in open pipes with clear fifths, breath going round unseen | pad
Gulls asleep on wind | - | breath=Circular reed=Paper pipe=Open body=.7 cup=.3 second=.6 interval=19 beat=1.2 lung=4.6 turn=1 starve=-.8 leak=.12 attack=1 release=2 sag=35 spread=1 volume=6 share=0.15 lock=0.6 bite=.55 vowel=.8 | seasick | highhold | High paper with beating twelfths on a narrow vowel
Frost ferns on glass | - | breath=Circular reed=Cane bite=.85 pipe=Open body=.9 cup=0 second=.7 interval=16 beat=.3 lung=13 turn=2 starve=-.3 lock=1 leak=.3 attack=1.6 release=2 sag=0 spread=.9 volume=-2 share=0.55 | highhalo | highhold | Cane in open pipes, a pure tenth over each key, settling into tune | pad
The last bright wire | - | breath=Circular reed=Steel pipe=Stopped cup=.5 vowel=.65 second=.4 interval=7 beat=.2 lung=20 turn=.5 starve=0 lock=.9 leak=.04 attack=2.4 release=6 sag=0 spread=.5 volume=1.5 share=0.3 bite=.4 body=.5 | glimmer | highhold | A thread of steel and its fifth, drawn out of nothing over two seconds
`,
    },
    {
      id: 'paper-lullaby',
      name: 'Paper lullaby',
      category: 'keys',
      rows: `
Cot by the stove | Paper lullaby | lung=9 turn=1 attack=.06 chiff=.3 release=.9 second=.2 interval=12 cup=.3 vowel=.4 leak=.05 sag=6 volume=-3.5 spread=0.45 share=0.15 lock=0.2 beat=.9 | parlour | sixths | Soft paper keys on a wooden chest, hardly any air in them
Wool sock on the hammer | Paper lullaby | bite=.3 body=.9 cup=.1 second=0 attack=.03 release=.5 lung=12 chiff=.05 leak=0 sag=0 breath=Out spread=.3 share=0.55 lock=0.4 | warmth | broken | Round paper on a deep chest, plain as a flute, long in breath
Two spoons of honey | Paper lullaby | bite=.75 body=.5 interval=4 second=.6 beat=.2 cup=.5 vowel=.3 attack=.08 release=1.2 lung=7 lock=.9 leak=.08 sag=14 volume=-3.5 spread=0.3 share=0.3 chiff=0.2 | reel | sixths | Warm paper with a true third beside every key, in cupped hands
Nightlight, low | Paper lullaby | pipe=Stopped body=.6 bite=.45 interval=19 second=.3 beat=.1 attack=.12 release=1.6 lung=5 turn=2 leak=.15 cup=.2 sag=25 volume=3.5 spread=1 share=0.75 lock=0.85 chiff=0.5 | bed | broken | Hollow paper under a faint twelfth, breathing both ways
Hem of the quilt | Paper lullaby | pipe=Cone body=.4 bite=.8 cup=.7 vowel=.2 interval=-12 second=.5 attack=.05 release=.4 lung=3.4 turn=.8 chiff=.5 leak=.03 volume=-1 spread=0.6 share=0.45 lock=0.6 beat=0.8 | blanket | lullaby | Close nasal paper over a low octave, quick to stop
Tin horse turns | Paper lullaby | pipe=Chest bite=1 body=.3 cup=.1 interval=24 second=.7 beat=1.4 attack=.02 release=.3 lung=2 turn=.3 chiff=.6 leak=.02 spread=.9 volume=-0.5 share=0.3 lock=0.85 | smaller | ostinato | Bright pinched paper with two octaves chirping over it
Paper theatre | Paper lullaby | pipe=Cone bite=.9 body=.7 cup=.4 vowel=.75 interval=12 second=.8 beat=2.2 attack=.03 release=.25 lung=1.6 turn=.2 chiff=.4 sag=40 volume=-1 spread=0.3 share=0.75 lock=0.6 | sampler | hocket | Buzzing paper cones and their octaves speak like small puppets
Wind up hen | Plucked tongues | reed=Paper bite=.95 pipe=Chest body=.2 cup=.6 vowel=.85 lung=.6 interval=12 second=.4 release=.12 share=.3 volume=-2 spread=0.7 beat=1.4 | tin | hocket | Tiny paper clucks on a narrow vowel | plucked
Snow globe, shaken | Paper lullaby | pipe=Open bite=.85 body=.9 interval=19 second=1 beat=3 attack=.04 release=1 lung=4 turn=.6 cup=0 leak=.1 spread=1 share=0.15 lock=0.4 chiff=0.4 volume=-4.5 | crystals | broken | Open paper twelfths beating three times a second
Cardboard crown | Paper lullaby | pipe=Chest bite=.7 body=1 interval=7 second=.5 beat=.8 attack=.015 release=.2 lung=3 breath=Out chiff=.9 leak=.1 sag=20 starve=.2 volume=-6 spread=0.45 share=0.55 lock=0.7 | cassette | ostinato | Blunt paper fifths with a puff on each key, stopping short
Rocker on bare boards | Paper lullaby | lung=.9 turn=.5 attack=.1 release=.5 bite=.65 interval=-12 second=.3 beat=.4 pipe=Chest body=.7 cup=.4 vowel=.5 sag=12 volume=-2 spread=0.3 share=0.45 lock=0.4 chiff=0.4 | board | lullaby | Paper rocks between breath out and breath in, a second each way
Slow swing in a tree | Paper lullaby | lung=1.6 turn=1.2 attack=.2 release=1 pipe=Open bite=.5 body=.8 interval=12 second=.6 starve=.8 leak=.12 spread=1 cup=.1 volume=3 share=0.15 lock=0.7 chiff=0.2 beat=2.4 | pendulum | broken | Open paper swings out and in, the order of its keys turned over each way
Boat for one | Paper lullaby | lung=2.2 turn=.8 attack=.15 release=1.4 pipe=Stopped bite=.7 body=1 interval=5 second=.5 beat=.3 sag=35 leak=.06 breath=In volume=5.5 spread=0.6 share=0.55 lock=0.85 chiff=0.5 | water | lullaby | Stopped paper and a fourth, rising with each breath in
Half past a yawn | Paper lullaby | lung=2.8 turn=2.6 attack=.4 release=2 pipe=Chest bite=.8 body=.5 cup=.9 interval=0 second=.7 beat=.7 sag=60 leak=.1 volume=-5 vowel=.5 spread=0.35 share=0.3 lock=0.6 chiff=0.05 | oos | twochords | Paper on a wide ah that sinks, shuts and opens again in another order | voice
Pendulum stopped by hand | Paper lullaby | lung=.5 turn=.25 attack=.05 release=.2 pipe=Cone bite=.6 body=.5 cup=.2 interval=12 second=.2 beat=.1 starve=-.5 share=.6 chiff=.2 leak=.2 volume=-1 spread=0.7 lock=0.2 | booth | lullaby | Quick paper rocking, twice a second, its keys catching at different times
Told in a whisper | Paper lullaby | cup=1 vowel=.45 bite=.9 body=.3 pipe=Chest attack=.04 release=.3 lung=1.2 turn=.2 chiff=.7 leak=.25 second=.2 interval=12 volume=-4.5 spread=0.5 lock=0.6 | whisper | lullaby | Paper whispered through close hands, a syllable to a breath | voice
Grandmother's oh | Paper lullaby | cup=.9 vowel=.24 bite=.95 body=.6 pipe=Open attack=.2 release=.8 lung=3.6 second=.5 interval=-12 beat=1.1 leak=.06 sag=18 volume=-1.5 spread=0.25 share=0.3 lock=0.2 chiff=0.1 | chapel | duet | Paper rounded to an oh over a slow low octave | voice
Shush, the stairs creak | Paper lullaby | cup=.6 vowel=1 bite=.4 body=.8 pipe=Stopped attack=.1 release=.6 lung=1.8 turn=.6 leak=.8 second=0 chiff=.5 spread=.9 volume=6 share=0.75 lock=0.4 | nextdoor 1.level=1 | broken | Nearly all breath, a thin ee of paper shushing in a stopped pipe | texture
Under the covers | Paper lullaby | cup=.95 vowel=.05 bite=.85 body=.5 pipe=Cone attack=.08 release=.5 lung=5 second=.6 interval=0 sag=8 breath=Out leak=.02 volume=-5.5 spread=0.7 share=0.45 lock=0.7 chiff=0.2 beat=0.8 | pillow | lullaby | Paper shut in an oo, two reeds to a key
Eh, said the cat | Paper lullaby | cup=.85 vowel=.74 bite=1 body=.5 pipe=Chest attack=.06 release=.4 lung=.7 turn=.5 second=.4 interval=7 beat=.5 sag=75 leak=.03 chiff=.1 volume=2 spread=0.3 share=0.15 lock=0.85 | second | slopes | Pinched paper mews on an eh, sagging as each breath ends
Torn along the fold | Plucked tongues | reed=Paper bite=.6 pipe=Open body=.9 lung=1.2 interval=12 second=.3 beat=.2 release=.3 cup=0 share=.4 leak=.1 spread=1 volume=3 | dotted | ostinato | Paper plucked in open pipes, gone in a blink | plucked
Pressed flower | Plucked tongues | reed=Paper bite=.45 pipe=Stopped body=.9 lung=2.6 interval=19 second=.5 release=.8 cup=.2 leak=.2 sag=30 chiff=.6 volume=6 spread=0.5 beat=1.2 | pebble | broken | Hollow soft paper plucks with a twelfth, drooping | plucked
Origami crane | Plucked tongues | reed=Paper pipe=Cone body=.3 lung=.8 interval=7 second=.6 beat=1.2 release=.2 cup=.1 leak=0 share=.9 spread=1 starve=0 volume=3.5 bite=.75 | stars | ostinato | Crisp little paper cones with fifths, each taking air from the last | plucked
Desk blotter | Plucked tongues | reed=Paper bite=.2 pipe=Chest body=1 lung=3.6 interval=-12 second=.4 beat=.1 release=.4 cup=.5 vowel=.15 chiff=.4 leak=.05 spread=0.3 | woolly | broken | Very round paper plucks over a low octave, soaked dark | plucked
Confetti in the gutter | Plucked tongues | reed=Paper bite=.8 pipe=Chest body=.5 lung=.35 interval=24 second=.8 beat=2 release=.1 cup=.3 vowel=.7 leak=.3 spread=1 volume=-2 | patter | hocket | Specks of paper breath with two octaves over them | plucked
Nursery organ | - | reed=Paper bite=.8 interval=12 breath=Circular lung=8 turn=.4 starve=.1 lock=.8 leak=.04 release=.35 sag=0 volume=-2 pipe=Chest body=.6 vowel=.75 cup=.5 second=.7 beat=2.4 chiff=.6 attack=.03 spread=0.55 | stub | suspend | Small paper reeds on a box, octaves trembling over them on an even breath | organ
Barrel, one cracked pin | - | reed=Paper pipe=Cone body=.4 cup=.2 vowel=.4 second=.9 interval=7 beat=1.8 breath=Circular lung=1.2 turn=.3 starve=-.3 lock=.2 leak=.05 chiff=.6 attack=.02 release=.2 sag=45 spread=.6 bite=.75 | pressing | ostinato | Paper cones with rough fifths, wavering once a second | organ
Chapel of three pews | - | reed=Paper pipe=Stopped bite=.7 body=.9 cup=.1 second=.6 interval=0 beat=.9 breath=Circular lung=15 turn=.5 starve=.2 lock=.7 leak=.1 chiff=.5 attack=.09 release=.9 sag=0 spread=1 volume=4 share=0.3 | chapel | suspend | Stopped paper pairs beating slowly, chiffed at the start | organ
Flutes for the dolls | - | reed=Paper pipe=Open bite=.25 body=.7 cup=.05 second=.5 interval=24 beat=.2 breath=Circular lung=6 turn=.3 starve=0 lock=.5 leak=.06 chiff=.7 attack=.03 release=.5 sag=0 spread=.7 volume=3 share=0.75 | lateglints | lullaby | Pale round paper flutes and a second rank two octaves up | organ
Fair seen from upstairs | - | reed=Paper pipe=Chest bite=.9 body=.7 cup=.3 vowel=.5 second=1 interval=16 beat=1 breath=Circular lung=4 turn=1 starve=.4 lock=.4 leak=.02 chiff=.2 attack=.06 release=.6 sag=30 spread=.8 volume=6 share=0.45 | farshore | sway | Paper with a tenth on each key, dipping every four seconds | organ
Cellar door lullaby | Paper lullaby | pipe=Chest bite=.9 body=.6 cup=.5 vowel=.15 interval=-12 second=1 beat=.3 attack=.1 release=.6 lung=4 turn=.6 sag=20 leak=.05 spread=.2 share=0.3 chiff=0.5 | iron | tenor | Low paper and the octave under it, dark in the hands | bass
Bear's own cradle | Paper lullaby | pipe=Cone bite=.75 body=.8 cup=.3 vowel=.1 interval=-5 second=.7 beat=.2 attack=.2 release=1 lung=6 breath=Out sag=45 leak=.1 spread=.3 volume=-5 share=0.75 chiff=0.05 | giant | cellar | Deep paper cones with a fourth below, falling away | bass
Coal scuttle, set down | Plucked tongues | reed=Paper bite=.8 pipe=Cone body=.6 lung=1.6 interval=-12 second=.7 beat=.2 release=.3 cup=.6 vowel=.2 leak=.05 sag=10 spread=.1 volume=0.5 | cupboard | tread | Short low paper in cones over a deeper octave | bass
Attic floor | Paper lullaby | pipe=Stopped bite=.8 body=.8 cup=0 interval=0 second=.5 beat=.6 attack=.03 release=.4 lung=2.4 turn=.4 chiff=.8 sag=5 leak=.2 spread=.4 starve=0 volume=-3 share=0.15 | floor | barge | Low stopped paper, puffed at each step, its two reeds nearly one | bass
Lidded well | Paper lullaby | pipe=Stopped bite=.5 body=1 cup=.8 vowel=0 interval=-12 second=.6 beat=.15 attack=.4 release=1.8 lung=8 turn=1.6 sag=15 leak=.1 share=.8 volume=-3 chiff=0.2 | coil | vault | Very soft low paper in an oo, two octaves breathing as one | bass
Skimmed moon | Paper lullaby | pipe=Open bite=.6 body=.9 cup=0 interval=12 second=.8 beat=.2 attack=1.2 release=3 lung=8 turn=2.4 starve=.7 lock=1 leak=.08 spread=1 chiff=0 volume=-1.5 share=0.45 | hall | suspend | Slow open paper octaves that lean into tune, then turn over key by key | pad
Lace at the pane | Paper lullaby | pipe=Chest bite=.85 body=.4 cup=.2 vowel=.6 interval=0 second=1 beat=1.6 attack=.8 release=1.6 lung=4 turn=1.4 starve=-.7 leak=.02 spread=1 chiff=0 volume=-2 share=0.15 lock=0.7 | sweep | gather | Paper pairs in a slow shimmer, top keys first on the breath out | pad
Field of barley, white | Paper lullaby | pipe=Stopped body=.7 cup=.3 vowel=.3 interval=7 second=.4 release=2.4 turn=1.8 breath=In leak=.4 sag=20 chiff=0 volume=6 lung=3 attack=.8 bite=.55 spread=0.5 share=0.55 lock=0.85 beat=1.1 | cloudfed | twochords | Breathy stopped paper gathers on each breath in, a fifth inside | pad
Sleep comes by canal | Paper lullaby | pipe=Cone bite=.7 body=.9 cup=.8 vowel=.4 interval=-12 second=.5 attack=.6 release=2 lung=3 turn=2.8 share=.8 sag=50 leak=.06 volume=-5 spread=1 lock=0.6 beat=0.8 | darkhall | asleep | Nasal paper and low octaves sag, go under, and surface in a new order | pad
Mobile above the crib | Paper lullaby | pipe=Open bite=.9 body=.6 cup=.1 interval=19 second=.7 beat=.8 attack=.5 release=2.6 lung=2 turn=1 starve=1 share=1 leak=.05 spread=1 volume=6 lock=0.2 chiff=0.1 | circle | gather | Bright paper twelfths that take turns as the one breath comes and goes | pad
Cane chair by the bed | Paper lullaby | reed=Cane bite=.7 pipe=Chest body=.6 attack=.05 release=.6 lung=7 interval=12 second=.3 cup=.5 vowel=.45 sag=8 leak=.1 volume=-2 spread=1 share=0.55 lock=0.6 chiff=0.05 | glued | sixths | Rounded cane on the chest, an octave faintly beside it
Brass hinge, oiled | Paper lullaby | reed=Brass bite=.42 pipe=Open body=.7 attack=.04 release=1.1 lung=5 interval=0 second=.5 beat=.5 cup=.3 vowel=.25 sag=10 leak=.1 turn=.6 volume=-2.5 spread=0.6 share=0.3 lock=0.2 chiff=0.1 | bowhand | lullaby | Brass held back to a round soft tone, two reeds close together
Dentist's fish tank | Paper lullaby | reed=Steel bite=.2 pipe=Stopped body=.9 attack=.06 release=2.6 lung=4 interval=12 second=.4 cup=.6 vowel=.2 sag=0 leak=.15 volume=-5 spread=0.45 share=0.75 lock=0.4 chiff=0.4 beat=1.8 | shallows | broken | Steel turned almost to a flute in stopped pipes, ringing on
Clock with felt feet | Chiff keys | reed=Brass bite=.35 pipe=Stopped body=.8 lung=3.4 release=.8 chiff=.5 second=.3 interval=19 cup=.3 vowel=.3 leak=.2 sag=15 volume=2.5 spread=0.7 share=0.45 lock=0.7 | puffs | lullaby | Round stopped brass with a faint twelfth, one short breath a key
Rag doll, one eye | Chiff keys | reed=Cane bite=.8 pipe=Chest body=.9 lung=2 release=.3 chiff=.3 second=.5 interval=-12 beat=.4 cup=.8 vowel=.15 leak=.05 sag=55 spread=.4 volume=-2.5 share=0.15 lock=0.85 | wornreel | broken | Cane muffled in hands over a low octave, drooping on each key
Dream with a staircase | Paper lullaby | pipe=Open bite=.7 attack=.1 release=1.4 lung=3 turn=.8 interval=14 second=.6 cup=.1 leak=.08 sag=30 starve=-.6 volume=0 spread=0.6 share=0.75 lock=0.7 chiff=0.2 beat=1.4 | highhalo | broken | Paper with a ninth hovering over every key
Train through the pillow | Paper lullaby | pipe=Chest bite=.55 attack=.08 release=.7 lung=1.1 turn=.15 interval=-12 second=.4 cup=.7 vowel=.35 share=.7 leak=.15 sag=10 volume=-3 spread=0.45 lock=0.85 chiff=0.5 beat=0.8 | softpulse | lullaby | Dim paper breathing quickly over a low octave
Song learned backwards | Paper lullaby | pipe=Cone bite=.85 body=.6 attack=.25 release=1.6 lung=4 turn=.5 breath=In interval=7 second=.8 cup=.15 leak=.04 sag=0 volume=6 spread=0.7 share=0.15 lock=0.6 chiff=0.05 beat=0.8 | mirror | lullaby | Paper fifths in cones, growing as they are drawn in
Clocks go back tonight | Paper lullaby | pipe=Stopped bite=.9 body=.5 attack=.03 release=.5 lung=9 breath=Out interval=12 second=.1 chiff=.6 cup=.05 leak=.12 sag=4 starve=.1 volume=5 spread=0.3 share=0.55 lock=0.2 | half | lullaby | Plain hollow paper keys, the octave only a tint
Combs in a cigar box | Paper lullaby | reed=Steel pipe=Chest bite=.3 body=.5 attack=.015 release=1.8 breath=Once lung=2.4 turn=.1 interval=24 second=.5 chiff=.8 cup=.4 vowel=.4 leak=0 sag=0 volume=0.5 spread=0.35 share=0.3 beat=1.2 | recall | lullaby | Soft steel tongues on wood with two octaves over them, plucked | bell
`,
    },
    {
      id: 'reed-bass',
      name: 'Reed bass',
      category: 'bass',
      rows: `
Lock keeper's boots | Reed bass | bite=.8 body=.7 cup=.3 second=.6 chiff=.7 attack=.012 release=.15 leak=.05 vowel=.3 spread=.1 share=0.15 | iron | tread | Hard spoken brass in a cone with its octave under, stopping dead
Coal, forty sacks | Reed bass | pipe=Chest bite=.9 body=.3 cup=.6 interval=0 second=.9 beat=.8 chiff=.5 sag=25 breath=Once lung=3 release=.3 share=.5 | grit | barge | Bare brass pairs on wood, each note sagging as it spends its breath
Tug and tow | Reed bass | bite=.6 body=.9 cup=.15 vowel=.5 interval=-12 second=1 beat=.4 attack=.06 release=.7 lung=6 turn=.4 chiff=.2 volume=-2 share=0.3 | parlour | barge | Full brass cones with a heavy octave under, a small dip every six seconds
Sluice gate, half up | Reed bass | pipe=Open bite=.72 body=.8 cup=.1 interval=7 second=.5 beat=.1 attack=.03 release=.4 leak=.3 breath=Out lung=2 turn=.1 sag=12 spread=.5 | desk | tread | Open brass with a fifth over it, losing strength through each breath
Drayhorse | Reed bass | bite=.52 cup=.8 vowel=.35 interval=-12 second=.4 beat=.2 attack=.02 release=.35 chiff=.9 sag=40 breath=Once lung=5 turn=1 body=.6 share=0.45 | glued | barge | Brass in cupped hands, a thick puff and then a slow droop
Drainpipe in March | Reed bass | pipe=Stopped bite=.58 body=1 cup=0 second=.3 interval=-12 beat=.1 leak=.4 chiff=.6 attack=.04 release=.3 lung=8 volume=-0.5 share=0.3 | bare | tenor | Hollow stopped brass, breathy, an octave faint beneath it
Rain butt | Reed bass | reed=Cane pipe=Stopped bite=.88 body=.9 interval=19 second=.2 beat=.3 chiff=1 attack=.012 release=.2 breath=Once lung=1.6 cup=.2 leak=.2 spread=0.3 share=0.75 | pot | tread | Stopped cane knocked by the tongue, over in half a second | plucked
Lead and lime | Reed bass | pipe=Stopped bite=.45 body=.6 cup=.5 vowel=.1 interval=-7 second=.6 beat=.1 lock=.8 attack=.15 release=.8 leak=.15 lung=12 share=0.45 | narrow | cellar | Dark stopped brass and the fifth under it, even and held
Standing in the font | Reed bass | reed=Paper pipe=Stopped bite=.9 body=.8 interval=-12 second=.5 beat=.5 chiff=.3 attack=.1 release=.9 breath=Out lung=5 turn=.5 leak=.1 cup=.3 vowel=.4 volume=5.5 share=0.15 | stairs | vault | Low stopped paper over its octave, let down with each breath out
Empty cistern | Reed bass | reed=Steel pipe=Stopped bite=.35 body=1 interval=-12 second=.8 beat=.3 chiff=.4 attack=.05 release=1.6 lung=3 turn=.2 leak=.2 cup=0 spread=.6 share=0.55 volume=-2.5 | mineshaft | barge | Muffled steel filling a stopped pipe, its octave humming below
Bull reed | Reed bass | reed=Cane bite=1 body=.4 second=.5 chiff=.6 attack=.02 release=.2 leak=.05 interval=7 vowel=.8 cup=.7 beat=1 share=0.45 | tube | tread | Full edge of cane in a cone, a fifth bellowing over it
Gravel in the throat | Reed bass | reed=Cane pipe=Chest bite=.97 body=.2 cup=.9 vowel=.28 interval=0 second=.8 beat=3 share=.9 lock=.1 attack=.05 release=.4 leak=.1 sag=20 | combo | barge | Two cane reeds quarrel three times a second behind close hands
Ox road | Reed bass | reed=Cane pipe=Open bite=.9 body=.9 interval=-5 second=.6 beat=.1 chiff=.3 attack=.08 release=.5 breath=Both lung=1.4 turn=.15 leak=.2 sag=8 share=0.55 | reel | tenor | Cane in open pipes with a fourth beneath, pushed and pulled
Tanner's yard | Reed bass | reed=Cane pipe=Stopped bite=.98 body=.4 cup=.7 vowel=.15 interval=12 second=.4 beat=1 chiff=.8 attack=.012 release=.25 leak=.35 breath=Once lung=4 volume=0 share=0.3 | cupboard | barge | Raw stopped cane shut in an oh, an octave rasping on top
Hog wind | Reed bass | reed=Cane bite=.8 body=.9 cup=.4 vowel=.02 interval=-12 second=1 beat=.2 chiff=0 attack=.5 release=1.2 breath=In lung=2 turn=.2 sag=10 leak=.25 share=0.75 | under | vault | Dull cane and its octave drawn in slowly under every note
Felt boots on ice | Reed bass | reed=Paper cup=.2 beat=.1 attack=.03 release=.25 sag=0 lung=14 pipe=Stopped second=.35 interval=19 chiff=.7 share=0.55 bite=.7 leak=.3 body=.65 volume=3 | warmth | tread | Paper in stopped pipes, a soft breathy step with a twelfth in it
Sack of meal | Reed bass | reed=Paper pipe=Open bite=.7 body=.7 cup=.6 vowel=.2 interval=0 second=.6 beat=.4 chiff=.8 attack=.012 release=.2 leak=.2 breath=Once lung=2.6 sag=30 volume=1.5 share=0.3 | closemic | tread | A thud of paper breath in a closed oh, giving way as it lands
Peat smoke low | Reed bass | reed=Paper pipe=Cone bite=.85 body=.6 cup=.1 interval=-12 second=.9 chiff=.1 attack=.2 release=.8 leak=.05 breath=Both lung=3 turn=.6 sag=15 beat=.5 share=0.75 | wool | vault | Slightly buzzing paper cones over an octave that beats once a second
Nap of the velvet | Reed bass | reed=Paper bite=.5 cup=.4 vowel=.6 interval=7 beat=.2 chiff=.1 release=.6 leak=.1 share=.6 sag=5 volume=0.5 pipe=Open body=.8 breath=In lung=1.8 turn=.5 attack=.3 second=.5 | blanket | tenor | Soft open paper swelling under each note, a fifth somewhere inside it
Under the ferry deck | Reed bass | reed=Paper pipe=Open bite=.6 body=.8 cup=.1 interval=-12 second=.7 beat=.08 chiff=0 attack=.6 release=2 leak=.15 lung=10 turn=2 sag=20 volume=-1.5 spread=0.95 share=0.15 lock=0.85 | deepwater | bourdon | Slow paper and its octave, hardly moving | drone
Buoy chain | Plucked tongues | reed=Steel pipe=Chest bite=.5 body=.4 cup=.3 vowel=.2 lung=2.6 interval=-12 second=.6 beat=.3 release=1.2 leak=0 spread=.3 sag=0 | forward | barge | Plucked steel tongues over a deep octave, the bars ringing | plucked
Girder, flat of the hand | Plucked tongues | reed=Steel pipe=Cone bite=.6 body=.7 cup=.6 vowel=.1 lung=1.2 interval=0 second=.8 beat=.6 release=.5 share=.2 leak=.05 spread=.2 volume=4.5 | cupboard | tread | Short thick steel twangs, two reeds beating in a cone | plucked
Long spring | Plucked tongues | reed=Steel pipe=Stopped bite=.42 body=.8 cup=.1 lung=4 interval=7 second=.4 release=3 leak=.1 spread=.6 sag=8 chiff=.7 volume=2 beat=1.1 | spring | cellar | Hollow steel struck low, a fifth ringing above for a long while | plucked
Rail saw | Reed bass | reed=Steel bite=.7 body=.5 cup=.85 vowel=.3 interval=-12 second=.5 beat=.5 chiff=.3 attack=.04 release=.4 leak=.05 share=.7 sag=6 volume=2.5 | woolly | tread | Steel with its edge on, darkened by hands and cone
Anvil wrapped in hide | Plucked tongues | reed=Steel pipe=Open bite=.25 body=1 cup=.4 vowel=.4 lung=3 interval=12 second=.7 beat=.2 release=2 leak=.15 spread=.4 sag=0 volume=4.5 | larger | barge | Round steel plucks in open pipes, with more body than edge | plucked
Two men on a saw | Reed bass | breath=Both lung=.4 turn=.15 attack=.05 release=.3 bite=.72 cup=.4 vowel=.5 second=.6 sag=15 leak=.2 chiff=.4 spread=0.45 share=0.15 lock=0.2 beat=0.9 volume=-3.5 | booth | fifth | Brass over its octave, pushed and pulled better than twice a second | drone
Pump below decks | Reed bass | breath=In lung=.5 turn=.2 attack=.1 release=.2 pipe=Stopped bite=.6 body=.8 second=.4 sag=30 leak=.4 chiff=.1 cup=.2 volume=-2 spread=0.7 share=0.55 lock=0.4 beat=0.6 | room2 | bourdon | Stopped brass sucked in twice a second and let go | drone
Sleeping engine | Reed bass | breath=Out lung=.8 turn=.5 attack=.15 release=.5 reed=Paper bite=.95 cup=.6 vowel=.25 second=.8 interval=-12 sag=45 leak=.1 pipe=Chest volume=-1.5 spread=0.95 share=0.3 lock=0.7 beat=0.8 | nextdoor 1.level=.7 | bourdon | Low paper snores on its chest, sinking with every breath | drone
Treadle loom | Reed bass | breath=Both lung=.25 attack=.02 release=.15 reed=Cane bite=.96 pipe=Open body=.6 second=.3 interval=7 chiff=.9 share=.5 leak=.1 sag=0 turn=.03 | slap | barge | Cane tongued afresh four times a second as the breath turns
Shed door, no latch | Reed bass | breath=In lung=1.6 turn=1.2 attack=.3 release=.8 pipe=Chest bite=.8 cup=.5 vowel=.15 second=.7 interval=-5 sag=60 leak=.15 starve=0 share=0.45 | tails | cellar | Brass groans up out of a long sag and over a fourth, then swings shut
Fifth under the nave | Reed bass | pipe=Open bite=.6 body=.9 interval=-5 second=.8 beat=0 lock=1 attack=.25 release=1.4 lung=20 cup=0 leak=.2 chiff=.2 spread=1 share=0.3 | cathedral | fifth | Open brass over a pure fourth, quite still | organ
Ground bass, gaslit | Reed bass | pipe=Stopped bite=.68 body=.5 interval=7 second=.7 beat=.3 lock=.8 attack=.04 release=.4 lung=9 cup=.3 vowel=.25 leak=.1 chiff=.5 volume=2 share=0.75 | longplate | tenor | Stopped brass with its fifth, clear at the front
Keel and kelson | Reed bass | reed=Cane pipe=Cone bite=.85 body=.8 interval=-7 second=.5 beat=.05 lock=.9 attack=.1 release=.6 lung=13 cup=.5 vowel=.08 leak=.1 share=.4 volume=1.5 | cellos | cellar | Dark cane with a fifth below, two reeds in one hull
Third rail, warm | Reed bass | pipe=Chest bite=.55 body=.6 interval=4 second=.5 beat=.2 lock=1 attack=.02 release=.3 lung=5 breath=Out cup=.2 leak=.05 chiff=.4 sag=20 volume=1 spread=0.6 share=0.15 | tabled | tenor | Mellow brass on wood with a pure third, plain and near | keys
Ship's bell frame | Reed bass | reed=Steel pipe=Open bite=.4 body=.9 interval=-12 second=1 beat=.15 lock=.6 attack=.3 release=3 lung=15 turn=.4 cup=.3 vowel=.2 leak=.1 sag=0 spread=0.45 share=0.55 | tunnel | bourdon | Soft low steel and its octave hold like a plate of iron | drone
Pedal stop, wet stone | Reed bass | pipe=Open bite=.42 body=1 interval=-12 second=.7 beat=.1 attack=.12 release=.8 lung=18 cup=0 leak=.1 chiff=.3 spread=.6 share=0.45 | nave | vault | Round full brass in open pipes with the octave under, even | organ
Trapdoor organ | Reed bass | pipe=Cone bite=.75 body=.8 interval=12 second=.6 attack=.03 release=.25 lung=7 cup=.1 leak=.05 chiff=.6 spread=.8 sag=5 volume=-0.5 share=0.15 lock=0.7 beat=2.4 | brighthall | tread | Firm brass cones and an octave over them, tongued | organ
Vault door, shut slowly | Reed bass | reed=Cane pipe=Stopped bite=.7 body=1 interval=-12 second=.9 beat=.1 attack=.9 release=2.5 breath=Out lung=8 turn=1.5 cup=.6 vowel=.05 leak=.2 sag=25 volume=-5.5 spread=0.6 share=0.55 lock=0.85 | darkhall | bourdon | Hollow cane in an oo over its octave falls slowly away | drone
Plumb bob | Reed bass | pipe=Stopped bite=.3 body=.9 interval=0 second=.4 beat=.12 attack=.2 release=.6 lung=25 cup=.2 leak=.05 chiff=.1 spread=0 sag=0 share=0.3 volume=1 | subbed | vault | Nearly a pure tone of stopped brass in the very middle
Low choir of pipes | Reed bass | reed=Brass pipe=Open bite=.66 body=.7 interval=19 second=.5 beat=.4 attack=.4 release=1.6 breath=Both lung=4 turn=1 cup=.4 vowel=.45 leak=.3 sag=12 spread=1 volume=-2 share=0.75 lock=0.2 | monks | deep | Open brass with twelfths, turning over slowly | drone
Om at the pump house | Reed bass | cup=1 vowel=.2 bite=.85 body=.3 pipe=Chest interval=0 second=.5 attack=.15 release=.8 lung=6 breath=Out turn=.3 leak=.05 sag=10 spread=0.3 share=0.55 lock=0.6 beat=0.8 | chant | fifth | Brass held to a closed oh in tight hands, one long breath to a note | drone
Yawning shed | Reed bass | cup=.9 vowel=.5 breath=In bite=.8 lung=1.5 turn=.6 pipe=Cone interval=-12 second=.6 attack=.2 release=.5 leak=.2 sag=50 chiff=0 volume=5 share=0.3 | acrossroom | barge | Brass yawns on an ah, drawn up out of its sag, octave and all
Frog at the weir | Plucked tongues | reed=Cane bite=1 cup=1 vowel=.35 pipe=Chest body=.3 lung=.7 interval=0 second=.7 beat=2 release=.15 leak=.05 spread=.2 volume=2 | bottle | tread | Low cane croaks, half a second each, in cupped hands | plucked
Prior with a cold | Reed bass | reed=Paper cup=.95 bite=.9 pipe=Stopped body=.5 interval=-12 second=.7 attack=.1 release=.6 breath=Both lung=2.2 turn=.4 leak=.25 sag=20 volume=3.5 vowel=.05 spread=0.6 share=0.45 lock=0.7 beat=0.8 | chapel | chantline | Stuffed paper in an oo over a lower octave, breathing audibly | voice
Wah of the crane | Reed bass | cup=.8 vowel=.85 reed=Steel bite=.5 pipe=Open body=.5 interval=-12 second=.5 beat=.4 attack=.03 release=.8 breath=Once lung=2.4 sag=10 leak=.05 chiff=.6 share=0.15 | touched | barge | Steel on a narrow vowel over its low octave, closing as it spends itself
Echo sounding | Reed bass | pipe=Stopped bite=.5 body=.8 second=.4 chiff=.8 attack=.02 release=.2 breath=Once lung=1.4 leak=.15 cup=.1 share=0.75 | trail | barge | Short stopped brass thumps
Night goods, long | Reed bass | bite=.66 cup=.6 vowel=.4 attack=.2 release=1 breath=Both lung=2.6 turn=.5 interval=7 second=.6 sag=30 share=.6 leak=.2 volume=1.5 | drifting | tenor | Brass cones and fifths heave in and out
Trawl door | Reed bass | reed=Cane bite=.94 pipe=Chest body=.6 cup=.4 interval=-12 second=.7 beat=1.4 attack=.03 release=.4 breath=Out lung=3 sag=55 leak=.15 share=0.15 | shells | tread | Cane on its chest over an octave, sagging at the end of each breath
Reservoir, full moon | Reed bass | reed=Paper bite=.5 pipe=Open body=1 interval=24 second=.3 beat=.1 attack=.4 release=2 breath=Both lung=5 turn=1.2 leak=.15 cup=.1 sag=8 share=0.55 volume=-1.5 | shadow | cellar | Low open paper, two octaves faint above it, breathing out and in
Subsidence | Reed bass | reed=Brass bite=.6 pipe=Cone body=.6 interval=-12 second=1 beat=.3 attack=.08 release=1.2 breath=Once lung=9 turn=.4 sag=90 leak=.1 cup=.2 starve=.4 volume=-2 share=0.3 | lowtide | vault | Brass and its octave sink together almost a semitone
`,
    },
    {
      id: 'chiff-keys',
      name: 'Chiff keys',
      category: 'keys',
      rows: `
Walnut action | Chiff keys | pipe=Chest bite=.9 body=.8 lung=5 release=.35 chiff=.6 leak=.08 second=.2 interval=12 beat=.2 sag=4 volume=-4 spread=0.45 share=0.15 lock=0.2 | bare | broken | Cane on a walnut chest, a firm puff and a short stop
Schoolroom, chalk dust | Chiff keys | bite=.98 body=.5 lung=3 release=.2 chiff=1 leak=.3 second=.4 interval=0 sag=25 cup=.2 vowel=.5 volume=-2 pipe=Cone beat=3 spread=0.7 share=0.55 lock=0.4 | desk | ostinato | Reedy cane pairs in cones with a hard tongue, a little sour as they end
Upright in the hallway | Chiff keys | release=.8 chiff=.4 leak=.1 share=.6 sag=10 volume=6 reed=Brass pipe=Stopped bite=.9 body=.5 second=.6 interval=-12 lung=3.4 spread=0.3 lock=0.7 beat=1 | doubled | lullaby | Stopped brass with its lower octave, each key dimming the last
Sanded edge | Chiff keys | pipe=Cone body=.9 lung=4 release=.5 chiff=.7 leak=.05 second=.3 interval=7 beat=.3 sag=0 volume=-3.5 bite=.6 cup=.85 vowel=.2 spread=1 share=0.75 lock=0.85 | glued | broken | Cane cones with a fifth, rounded to an oh by cupped hands
Blackboard bright | Chiff keys | pipe=Stopped bite=1 body=.4 lung=2 release=.15 chiff=.8 leak=.2 second=.2 interval=19 beat=.8 sag=15 spread=1 volume=0 share=0.45 | ends | hocket | Dry edged cane in stopped pipes, barely a second long | plucked
Parlour with the rug up | Chiff keys | reed=Brass bite=.7 pipe=Chest body=.6 lung=6 release=.4 chiff=.5 second=.5 interval=12 beat=.6 leak=.06 cup=.1 sag=12 turn=.3 volume=-1 spread=0.7 share=0.3 lock=0.85 | parlour | sixths | Brass on its chest with an octave, spoken plainly
Piano tuner's lunch | Chiff keys | reed=Brass bite=.6 pipe=Open body=.5 lung=9 release=1.4 chiff=.3 second=.8 interval=0 beat=.9 leak=.1 cup=.2 vowel=.3 lock=.2 volume=3 spread=0.3 share=0.75 | ensemble | broken | Paired brass that beats slowly and rings a while after the key
Copper pan keys | Chiff keys | reed=Brass bite=.85 pipe=Cone body=.4 lung=2.6 release=.3 chiff=.8 second=.3 interval=7 beat=.1 leak=.04 cup=.3 vowel=.6 sag=20 volume=2 spread=1 share=0.45 | tin | ostinato | Bright brass cones with a clean fifth, struck and dropped
Seed merchant's ledger | Chiff keys | reed=Brass bite=.48 pipe=Stopped body=.8 lung=4 release=.6 chiff=.4 second=.4 interval=4 beat=.2 leak=.25 cup=.3 sag=8 lock=.9 volume=-2.5 spread=0.6 share=0.15 | blunt | broken | Dull stopped brass with a true third beside it
Lamp room at noon | Chiff keys | reed=Brass bite=.9 pipe=Chest body=.2 lung=1.5 release=.2 chiff=.2 second=.9 interval=12 beat=2.4 leak=0 cup=0 sag=35 spread=1 volume=4.5 share=0.55 lock=0.7 | tabled | hocket | Bare brass octaves, quick and beating, bending down as they go
Recorder cupboard | Chiff keys | body=1 lung=6 release=.4 chiff=1 interval=24 sag=2 volume=5 reed=Paper pipe=Stopped bite=.55 second=.35 beat=1.2 leak=.6 spread=0.3 share=0.45 lock=0.4 | booth | lullaby | Stopped paper, all puff at the front, two octaves whistling over it
Whistle in a milk bottle | Chiff keys | reed=Paper bite=.3 pipe=Open body=1 lung=2.4 release=.25 chiff=.9 leak=.2 second=.2 interval=12 sag=10 spread=.5 volume=1.5 share=0.15 | bottle | hocket | Round paper puffs, short and full of air | plucked
Willow cut in April | Chiff keys | reed=Brass bite=.4 pipe=Open body=.95 lung=5 release=.9 chiff=.7 leak=.3 second=.4 interval=7 beat=.2 cup=0 sag=5 spread=0.6 share=0.55 lock=0.85 volume=3 | yard 1.level=.9 | sixths | Soft brass in open pipes, a fifth over each, green and airy
Glass of cold tea | Chiff keys | reed=Steel bite=.3 pipe=Open body=.9 lung=3 release=1.6 chiff=.6 leak=.2 second=.5 interval=12 cup=0 sag=0 spread=0.45 share=0.3 lock=0.6 beat=0.9 volume=-5.5 | tails | lullaby | Pale steel in open pipes with an octave, ringing after the puff
Straw through the fence | Chiff keys | bite=.92 pipe=Open body=.6 lung=1.8 release=.15 chiff=.5 leak=.5 second=.7 interval=0 beat=3 sag=40 cup=.5 volume=5 vowel=.75 spread=0.7 share=0.75 lock=0.2 | patter | ostinato | Two thin breathy canes beating on an eh, soon gone
Tines under glass | Steel bells | pipe=Open bite=.4 body=.6 lung=4 release=1 chiff=.5 second=.2 interval=12 cup=.3 vowel=.35 leak=.02 volume=3.5 spread=1 share=0.55 lock=0.6 | throb | broken | Struck steel with a mellow pipe around it | keys
Cutlery in felt | Steel bells | pipe=Chest bite=.32 body=.6 lung=2.4 release=.4 chiff=.6 second=.3 interval=7 beat=.3 cup=.6 vowel=.2 leak=0 volume=-3.5 spread=0.6 share=0.3 lock=0.2 | warmth | lullaby | Short dark steel with a fifth, damped when let go | keys
Night shift vending | Steel bells | pipe=Stopped bite=.5 body=.8 lung=5 release=1.4 chiff=.3 second=.5 interval=0 beat=1.6 cup=.2 leak=.1 volume=6 spread=0.45 share=0.75 lock=0.4 | shudder | sixths | Hollow steel pairs with a slow beat inside them | keys
Coins on the bar | Steel bells | pipe=Cone bite=.55 body=.5 lung=1.6 release=.5 chiff=.8 second=.4 interval=16 cup=.5 vowel=.5 leak=0 spread=.6 volume=3.5 share=0.45 lock=0.7 beat=0.8 | slap | ostinato | Short bright steel cones, a tenth above each | keys
Ice in the gutter pipe | Steel bells | pipe=Stopped bite=.28 body=1 lung=6 release=2.4 chiff=.4 second=.6 interval=12 cup=.1 leak=.15 sag=8 volume=-0.5 spread=0.3 share=0.15 lock=0.85 beat=1.4 | facets | lullaby | Very soft steel in stopped pipes, an octave gleaming over it | keys
Puffball step | Row of bottles | breath=Once lung=1.8 chiff=1 attack=.012 release=.2 leak=.25 second=.2 bite=.3 volume=6 spread=0.6 share=0.75 | tabled | hocket | Fat paper puffs in stopped pipes, a faint fifth above | plucked
Post office stamp | Row of bottles | breath=Once lung=.7 chiff=.8 attack=.012 release=.12 pipe=Chest body=.7 second=.5 interval=12 volume=-5 spread=0.5 share=0.45 beat=2.4 leak=.3 bite=.5 | reversed | ostinato | Dabs of paper breath on wood, an octave inside | plucked
Pumice and soap | Row of bottles | breath=Once lung=3.4 chiff=.5 attack=.03 release=.7 pipe=Open bite=.5 body=.8 leak=.6 second=.3 interval=19 volume=5 spread=0.7 share=0.15 lock=0.6 | airapart | broken | Airy paper in open pipes with a twelfth, more breath than key
Bee in a foxglove | Row of bottles | breath=Once lung=1.2 chiff=.4 attack=.04 release=.2 pipe=Cone bite=.95 body=.6 leak=.02 second=.8 interval=0 beat=4 cup=.4 vowel=.5 spread=0.3 share=0.55 | imprinted | ostinato | Paper pairs buzz in a cone for a moment each | plucked
Slippered feet | Row of bottles | breath=Once lung=2.6 turn=.6 chiff=.7 attack=.02 release=.3 bite=.2 body=.6 cup=.6 vowel=.1 leak=.1 second=.4 interval=-12 sag=20 volume=4 spread=1 share=0.3 lock=0.4 | pillow | lullaby | Round paper with a low octave, padded and dark | keys
Hollow log, wet mallet | Plucked tongues | reed=Cane bite=.85 pipe=Stopped body=1 lung=1.2 interval=19 second=.15 release=.2 cup=0 leak=.15 share=.1 sag=0 volume=-1 spread=0.45 lock=0.2 | bare | ostinato | Hollow knocks of cane in stopped pipes
Rice boiling over | Plucked tongues | reed=Cane bite=.7 pipe=Stopped body=.8 lung=.5 interval=12 second=.4 beat=.5 release=.1 cup=.2 leak=.5 spread=1 share=.3 volume=3 lock=0.4 | weave | hocket | Very short airy cane pops with an octave
Copse after rain | Plucked tongues | reed=Brass bite=.5 pipe=Stopped body=1 lung=2.4 interval=7 second=.3 beat=.1 release=1 cup=0 leak=.3 sag=15 chiff=.7 volume=2 spread=0.3 lock=0.7 | dapple | broken | Round stopped brass plucks, a fifth dripping off each
Clay marbles | Plucked tongues | reed=Paper bite=.7 pipe=Stopped body=.9 lung=1.6 interval=0 second=.6 beat=.6 release=.25 cup=.1 leak=.1 sag=25 spread=.9 volume=6 lock=0.85 | pot | ostinato | Paper knocked in stopped pipes, each falling a little flat
Nail in a plank | Plucked tongues | reed=Steel bite=.35 pipe=Chest body=.8 lung=.9 interval=12 second=.3 beat=.3 release=.3 cup=.3 vowel=.35 leak=0 sag=0 spread=.3 volume=1.5 lock=0.6 | board | ostinato | Short blunt steel on heavy wood
Clerks, all in a row | Chiff keys | reed=Brass bite=.8 pipe=Chest body=.5 lung=.45 release=.12 chiff=1 second=.3 interval=12 leak=.2 cup=.4 vowel=.6 spread=.8 volume=2 share=0.3 | gated | ostinato | Clipped brass syllables, all tongue | plucked
Ticket clerk | Chiff keys | reed=Cane bite=.95 pipe=Chest body=.4 lung=.7 release=.1 chiff=.7 second=.6 interval=-12 leak=.05 cup=.9 vowel=.4 share=.7 volume=3 spread=0.3 beat=0.8 | kitchen | hocket | Short nasal cane over a low octave, muttered | plucked
Skipping rope | Chiff keys | bite=.8 body=.7 release=.2 chiff=.6 interval=7 spread=1 volume=1 reed=Brass pipe=Cone breath=Both lung=.32 turn=.05 second=.5 leak=.1 starve=.1 share=0.45 lock=0.2 beat=1.2 | dotted | broken | Light brass fifths that skip out and in three times a second under a held key
Pebbles on the quay | Chiff keys | reed=Steel bite=.5 pipe=Cone body=.8 lung=.6 release=.4 chiff=.9 second=.2 interval=24 cup=.6 vowel=.3 leak=.05 volume=6 spread=0.6 share=0.15 | slowing | hocket | Dull steel ticks in cones | plucked
Two thimbles | Chiff keys | reed=Brass bite=.55 pipe=Stopped body=.7 lung=1 release=.3 chiff=.8 second=.9 interval=12 beat=1.2 leak=.1 sag=30 share=.5 volume=1.5 spread=0.5 | tube2 | ostinato | Stopped brass and its octave tapped out together | plucked
Keys that tire | Chiff keys | breath=Out lung=2.2 turn=.4 pipe=Chest reed=Brass bite=.78 sag=45 release=.5 second=.4 interval=7 share=.8 starve=.5 attack=.03 chiff=.5 leak=.15 volume=-3 spread=0.3 lock=0.4 | looped | suspend | Brass that weakens under a held chord and snatches a new breath
Four fingers, one breath | Chiff keys | breath=Both lung=1.1 turn=.15 pipe=Open bite=.9 sag=10 release=.6 second=.5 interval=12 starve=.8 share=.5 chiff=.8 attack=.02 leak=.2 volume=-1 spread=1 lock=0.7 | fan | twochords | Cane retongued at every turn of the breath, the low keys first going out
Held by a thread | Chiff keys | breath=In lung=3 turn=.3 reed=Steel pipe=Stopped bite=.45 body=.8 release=1.6 second=.3 interval=19 chiff=.3 attack=.08 leak=.15 sag=0 volume=3.5 spread=0.6 share=0.55 lock=0.85 | bowhand | lullaby | Quiet steel that grows as it is held
Accordion in the attic | Chiff keys | breath=Both lung=3.6 turn=.2 body=.4 release=.15 second=.8 interval=0 chiff=.1 attack=.03 sag=15 lock=.1 reed=Steel pipe=Cone bite=.75 beat=4.2 leak=.02 spread=0.45 volume=-3 | combo | sway | Two sharp steel reeds to a key in cones, beating four times a second, in and out
Grace note house | Chiff keys | breath=Circular lung=5 reed=Cane bite=.92 body=.6 release=.2 second=.4 chiff=1 attack=.015 sag=30 leak=.1 cup=.2 volume=1.5 pipe=Stopped interval=9 spread=0.7 share=0.75 | second | hocket | Cane with a scoop into every key and a sixth over it, never out of air
Two octaves of linen | Chiff keys | reed=Brass bite=.55 pipe=Open body=.7 interval=24 second=.8 lung=7 release=1.2 chiff=.5 leak=.15 cup=0 sag=0 volume=2 share=0.55 lock=0.6 beat=1.1 spread=.6 | sheen | middle | Soft brass with a bright rank two octaves over it
Tenths at the window | Chiff keys | bite=.93 pipe=Chest body=.7 interval=16 second=.7 beat=.2 lock=1 lung=6 release=.6 chiff=.4 leak=.05 cup=.3 vowel=.3 sag=5 volume=0.5 spread=0.6 share=0.3 | weaving | lullaby | Warm cane with a pure tenth above each key
Organ grinder's nephew | Chiff keys | reed=Paper bite=.92 pipe=Stopped body=.5 interval=12 second=1 beat=1 lung=4 release=.2 chiff=.7 leak=.08 sag=20 breath=Circular share=.4 volume=4.5 spread=0.45 lock=0.4 | pressing | ostinato | Stopped paper with equal octaves on a breath that goes round and round
Sixth bell of the watch | Chiff keys | reed=Steel interval=9 second=.6 release=2 chiff=.8 leak=.05 sag=0 volume=1.5 bite=.6 beat=2.4 lung=1.6 spread=0.6 share=0.45 pipe=Cone cup=.6 vowel=.8 body=.5 | chimes | broken | Hard little steel in a cone, a sixth beating over it | bell
Tiptoe past the study | Chiff keys | reed=Brass bite=.65 pipe=Cone body=.5 interval=14 second=.5 lung=3.4 release=.7 chiff=.6 leak=.05 sag=14 cup=.4 vowel=.4 volume=-1.5 spread=0.3 share=0.15 lock=0.85 beat=0.9 | hazy | broken | Brass cones with a quiet ninth over each key
Answering machine, 3am | Chiff keys | bite=.7 body=.5 lung=2 release=.4 chiff=.7 leak=.15 sag=20 volume=-1 reed=Paper pipe=Cone cup=.9 vowel=.6 second=.5 interval=7 spread=0.6 share=0.75 lock=0.7 | cassette | slopes | Paper half spoken over a fifth, short of breath
Spoons in the sink | Chiff keys | reed=Steel bite=.48 pipe=Stopped body=.6 lung=1.8 release=1.2 chiff=.9 second=.7 interval=12 beat=.8 leak=.05 sag=0 volume=5.5 spread=0.5 share=0.45 | heads | hocket | Hollow steel taps with an octave | plucked
Across the courtyard | Chiff keys | pipe=Stopped bite=.85 body=.9 lung=3 release=.5 chiff=.8 second=.4 interval=7 beat=.3 leak=.3 sag=10 volume=3 spread=0.7 share=0.15 lock=0.6 | clean 1.mix=.45 | hocket | Hollow cane fifths, well tongued
Dry leaves, dry keys | Chiff keys | reed=Paper bite=.75 pipe=Chest body=.6 lung=1.4 release=.2 chiff=.9 second=.6 interval=0 beat=1.8 leak=.1 spread=1 sag=15 volume=-0.5 share=0.55 | backwards | ostinato | Crumpled paper pairs, puffed and gone | plucked
Rooms opening on rooms | Chiff keys | reed=Brass bite=.6 pipe=Open body=.8 lung=5 release=1.8 chiff=.6 second=.6 interval=7 beat=.1 leak=.2 sag=0 lock=.9 volume=1 spread=1 share=0.3 | tiles | broken | Open brass with a true fifth over each key
`,
    },
    {
      id: 'locked-fifths',
      name: 'Locked fifths',
      category: 'organ',
      rows: `
West door, rain outside | Locked fifths | pipe=Open bite=.7 body=.9 lung=16 starve=0 share=.3 attack=.25 release=1.6 leak=.15 chiff=.5 spread=0.55 | cathedral | suspend | Full open brass with a true fifth on every key, soon leaning into tune
Three stops drawn | Locked fifths | pipe=Stopped bite=.6 body=.8 interval=12 second=.6 beat=.6 lock=.8 attack=.08 release=.5 leak=.2 chiff=.7 sag=0 volume=-1.5 spread=1 share=0.55 | chapel | middle | Stopped brass and octaves with a good chiff, the chord's beats drawing to a halt
Mason's plumb line | Locked fifths | pipe=Chest bite=.88 body=.6 share=.2 attack=.04 release=.3 second=.7 lung=8 turn=.2 spread=.4 leak=.05 chiff=.2 | booth | chantline | Bright brass fifths on a wooden chest, close and square
Dust in a sunbeam | Locked fifths | pipe=Open bite=.5 body=1 interval=19 second=.5 starve=.5 attack=1.2 release=3 leak=.35 lung=12 turn=2 spread=1 volume=3 | summer | gather | Soft open brass under pure twelfths, breath drifting through them | pad
Vestry stove | Locked fifths | pipe=Cone bite=.66 body=.7 cup=.6 vowel=.3 second=1 share=.6 attack=.15 release=.8 lung=5 turn=.6 sag=20 leak=.1 spread=0.9 chiff=0.05 | warmth | twochords | Brass cones and equal fifths, shaded by hands, dipping a little
Pure third, at last | Locked fifths | interval=4 second=.8 pipe=Open bite=.75 lock=1 attack=.3 release=1.4 lung=20 starve=0 leak=.15 cup=0 sag=0 volume=-3 spread=1 share=0.3 chiff=0.5 | brighthall | sway | Open brass with a just third over each key, the chord walking into tune
Minor, and still | Locked fifths | interval=3 second=.7 reed=Cane pipe=Chest bite=.93 body=.5 lock=1 attack=.5 release=1.2 share=.4 leak=.1 cup=.3 vowel=.4 volume=-3.5 spread=0.7 chiff=0.05 | darkhall | chantline | Cane with a just minor third, its beating stilled
Hexachord | Locked fifths | interval=9 second=.6 pipe=Stopped bite=.68 body=.7 lock=.9 beat=.3 attack=.2 release=.8 leak=.3 chiff=.4 spread=1 volume=2 share=0.45 | panned | suspend | Stopped brass with a sixth above, hollow and pure
Tenth over the river | Locked fifths | interval=16 second=.7 reed=Paper bite=.8 body=.8 attack=.1 release=.7 lung=14 sag=0 chiff=.6 volume=-7.5 pipe=Cone cup=.6 vowel=.65 leak=.1 spread=0.9 share=0.15 | under | twochords | Paper cones on an eh with a wide pure tenth above each key
Natural seventh | Locked fifths | interval=10 second=.6 pipe=Cone bite=.72 body=.6 attack=.6 release=1.6 share=.9 lock=.7 cup=.4 vowel=.2 lung=9 leak=.05 volume=1.5 spread=0.45 beat=1.8 | whistler | fifth | Brass cones with a wide minor seventh, trembling against each other | drone
Slower, slower, still | Locked fifths | interval=0 second=1 beat=1.6 lock=1 share=.7 pipe=Chest bite=.8 body=.4 attack=.2 release=1 leak=.05 spread=.8 chiff=0.4 volume=-3.5 | common | twochords | Brass pairs that beat while the chord beneath them locks and brightens
Loosened by thin air | Locked fifths | breath=Out lung=6 turn=.6 interval=7 beat=.4 lock=.9 starve=.4 sag=35 pipe=Open bite=.78 attack=.2 leak=.2 release=1 volume=-5.5 spread=0.4 share=0.15 chiff=0.2 | late | suspend | Brass fifths in tune at the top of each breath, coming loose at the bottom
Two tempers | Locked fifths | interval=12 second=.9 beat=3 lock=.3 share=.2 reed=Cane pipe=Open bite=.95 attack=.06 release=.6 leak=.1 spread=1 chiff=.5 volume=0.5 | beats | chantline | Cane with octaves beating three times a second, only half pulled in
Tuning day, side chapel | Locked fifths | interval=7 second=.5 lock=.5 reed=Steel pipe=Stopped bite=.4 body=.9 attack=.15 release=1.2 leak=.2 chiff=.3 sag=0 volume=-3.5 beat=.45 spread=0.55 share=0.3 | sympathy | twochords | Muted steel fifths a beat a second out of true
A hair above | Locked fifths | interval=0 second=.8 beat=.25 lock=.7 reed=Paper pipe=Stopped bite=.85 body=.6 attack=.4 release=1 leak=.1 cup=.2 sag=0 spread=1 volume=6 share=0.75 chiff=0.1 | wideair | gather | Two stopped paper reeds a key, four seconds to each slow beat
Snarl in a suitcase | Locked fifths | reed=Cane pipe=Chest bite=1 body=.2 interval=12 second=.4 beat=.5 attack=.015 release=.15 chiff=.6 share=.3 lung=10 cup=.2 vowel=.6 volume=-1.5 spread=0.4 | tabled | ostinato | Snarling cane with a quick tongue, small and near
Toll house | Locked fifths | reed=Cane pipe=Cone bite=.97 body=.7 interval=7 second=.7 attack=.05 release=.4 chiff=.4 lung=7 share=.6 cup=0 leak=.05 spread=0.9 | platform | sway | Cane cones with pure fifths, as a loud public thing
Wax on the reed tongue | Locked fifths | reed=Cane pipe=Stopped bite=.78 body=.9 second=.7 beat=.2 attack=.12 release=.6 leak=.3 chiff=.8 cup=.2 volume=0 interval=24 spread=0.45 share=0.75 | chamber | sixths | Round hollow cane, two octaves faint over it, and a soft puff | keys
Black keys of bog oak | Locked fifths | reed=Cane pipe=Chest bite=.9 body=.9 interval=-12 second=.8 beat=.3 attack=.2 release=.8 cup=.6 vowel=.15 share=.8 sag=12 leak=.1 volume=-2 spread=1 chiff=0.2 | padded | asleep | Dark cane over its lower octave, the keys leaning on each other
Fire in the oast house | Locked fifths | reed=Cane pipe=Open bite=.94 body=.5 interval=19 second=.8 attack=.5 release=1.4 leak=.2 lung=4 turn=1 sag=25 starve=.5 volume=2.5 spread=0.7 share=0.15 chiff=0.5 | swirl | suspend | Edged cane with twelfths, thinning every four seconds
Mixture of tin and frost | Locked fifths | reed=Steel pipe=Open bite=.48 body=.9 interval=19 second=.8 attack=.2 release=2.5 sag=0 leak=.15 cup=.1 lung=18 starve=0 volume=2 share=0.75 chiff=0.2 spread=.5 | sheen | suspend | Steel in open pipes with pure twelfths over them
Skate on black ice | Locked fifths | reed=Steel pipe=Chest bite=.55 body=.3 interval=24 second=.5 beat=.4 attack=.6 release=4 sag=0 leak=.03 cup=.5 vowel=.35 volume=0.5 spread=1 share=0.45 | thin | gather | Thin steel and its second octave, held close | pad
Wire cloister | Locked fifths | reed=Steel pipe=Stopped bite=.5 body=1 interval=12 second=.9 beat=.15 attack=1 release=3.5 sag=5 leak=.25 cup=.3 vowel=.2 starve=.3 volume=-0.5 spread=1 share=0.15 | nave | chantline | Hollow steel octaves opening slowly
Needle and compass | Locked fifths | reed=Steel pipe=Cone bite=.45 body=.6 interval=7 second=.9 attack=.03 release=.8 sag=0 leak=.04 cup=.75 vowel=.28 chiff=.7 share=.3 volume=-0.5 spread=0.7 | shade | chantline | Struck steel fifths on a rounded oh
Aurora, switched off | Locked fifths | reed=Steel pipe=Open bite=.35 body=.7 interval=16 second=.7 attack=2 release=6 sag=10 leak=.4 cup=0 lung=8 turn=3 share=1 starve=.7 volume=6 spread=0.7 | octbloom | gather | Airy steel and tenths, the whole chord sharing a slow dip | pad
Flue stops, feast day | Locked fifths | reed=Paper pipe=Open bite=.7 body=.9 interval=12 second=.8 attack=.06 release=.5 leak=.05 chiff=.7 sag=0 cup=0 lung=20 starve=0 volume=-3 spread=0.55 share=0.15 | flutes | suspend | Firm paper flutes with octaves
House organ, shutters in | Locked fifths | reed=Paper pipe=Stopped interval=19 second=.4 attack=.1 release=.6 sag=5 vowel=.15 spread=.5 volume=6 bite=.8 cup=.2 leak=.05 body=.55 chiff=.3 share=0.55 | pedal | lullaby | Stopped paper with its twelfths just audible
Choir organ, left behind | Locked fifths | reed=Paper pipe=Cone bite=.9 body=.7 interval=7 second=.7 attack=.15 release=.9 leak=.02 sag=30 cup=.3 vowel=.45 lung=5 turn=1.4 starve=-.6 volume=-0.5 spread=0.7 share=0.3 chiff=0.2 | wornthin | twochords | Papery cones and fifths, the breath going round them from the top key down
Human stop, cracked | Locked fifths | reed=Paper bite=.97 body=.5 interval=0 second=1 attack=.08 release=.5 leak=.05 cup=.8 vowel=.5 lock=.2 sag=10 volume=-1.5 pipe=Cone beat=6.8 spread=0.5 share=0.75 chiff=0.5 | oos | chantline | Paper pairs on an ah, shaking nearly seven times a second | voice
Lead pipe, gilded | Locked fifths | reed=Paper pipe=Stopped bite=.3 body=1 interval=12 second=.5 attack=.2 release=.7 leak=.3 chiff=1 sag=0 cup=.1 spread=.9 volume=5 share=0.45 | late | suspend | Round breathy stopped paper with a strong spit at the front
Sixteen foot | Locked fifths | interval=-12 second=.9 pipe=Open bite=.6 body=.9 attack=.3 release=1.4 share=.3 cup=.1 leak=.15 lung=14 sag=0 spread=1 chiff=0.5 | nave | asleep | Broad open brass with its suboctave, steady
Thunder in the crypt | Locked fifths | interval=-5 second=.9 pipe=Chest bite=.75 body=.8 attack=.15 release=.8 share=1 cup=.4 vowel=.15 leak=.05 lung=6 spread=0.95 chiff=0.05 | iron | bourdon | Low brass over pure fourths, rough with the air they share | drone
Under the chancel | Locked fifths | interval=-7 second=.8 reed=Cane attack=.6 release=1.6 leak=.3 starve=.6 sag=15 volume=-2 spread=0.4 share=0.45 pipe=Cone bite=.8 cup=.7 vowel=.1 body=.6 | cavern | asleep | Dark cane in cones with the fifth under it, the air reaching low keys first
Bellows boy nodding | Locked fifths | interval=-12 second=.7 breath=Both lung=4 turn=1 starve=.7 sag=50 pipe=Cone bite=.7 attack=.4 release=1 leak=.2 share=.7 volume=-0.5 spread=0.9 chiff=0.4 | nextdoor 1.level=.7 | asleep | Brass and its low octave droop between one stroke of the bellows and the next
Slab of slate | Locked fifths | interval=7 second=.5 reed=Steel pipe=Chest bite=.38 body=1 attack=.1 release=2 cup=.5 vowel=.1 leak=.05 chiff=.5 sag=0 spread=.3 volume=1 share=0.55 | floor | bourdon | Dark low steel fifths on heavy wood
Fourths like gateposts | Locked fifths | interval=5 second=.9 pipe=Stopped bite=.72 body=.6 attack=.1 release=.6 leak=.2 chiff=.5 cup=.2 lung=10 spread=1 volume=6 share=0.45 | yard 1.level=.85 | chantline | Stopped brass in parallel pure fourths
Hung from a beam | Locked fifths | interval=-5 second=.6 pipe=Open bite=.66 body=.8 attack=.8 release=2.4 leak=.25 starve=-.7 share=.5 lung=18 sag=8 volume=2.5 spread=0.7 | valley | gather | Open brass over fourths, opening from the top key down | pad
Quarry echo organ | Locked fifths | interval=7 second=.8 reed=Cane pipe=Cone bite=.92 attack=.04 release=.25 chiff=.7 lung=5 cup=.2 vowel=.7 leak=.05 volume=6 spread=0.6 share=0.55 | patter | hocket | Short cane fifths, hard edged | plucked
Open strings in brass | Locked fifths | interval=7 second=1 breath=In turn=.3 pipe=Chest bite=.82 release=1 leak=.1 cup=.1 sag=10 spread=0.7 share=0.3 chiff=0.05 attack=.15 lung=2.8 | bowed | suspend | Brass fifths that only swell, fuller the longer they are drawn | string
Two fifths make a ninth | Locked fifths | interval=14 second=.7 pipe=Open bite=.7 body=.6 attack=.3 release=1.8 leak=.2 lock=.8 share=.4 sag=0 cup=.1 spread=1 volume=-2.5 chiff=0.1 | nave | fifth | Open brass with a true ninth standing over each key | drone
Trembling floor | Locked fifths | share=1 lock=.6 interval=12 second=.9 reed=Brass pipe=Chest bite=.9 body=.3 attack=.1 release=.6 cup=.3 vowel=.3 lung=9 sag=0 spread=0.4 chiff=0.05 beat=1.4 | tube | twochords | Brass octaves rough with sum and difference tones
Swarm in the pipe loft | Locked fifths | share=1 lock=.2 interval=0 second=.9 beat=2.2 reed=Cane pipe=Cone bite=.9 body=.5 attack=.3 release=.7 cup=.4 vowel=.5 leak=.1 volume=-3 spread=0.9 chiff=0.1 | loft | suspend | Crowded cane pairs, beating and pressing on one another
Storm lamp held close | Locked fifths | share=.9 interval=7 reed=Steel pipe=Cone bite=.6 body=.8 attack=.25 release=1.6 cup=.85 vowel=.22 lung=4 turn=.8 sag=20 volume=-3 spread=0.45 chiff=0.4 | tube | fifth | Steel fifths growling softly behind shut hands | drone
Hoarse hosanna | Locked fifths | share=.9 interval=12 second=.6 beat=1 reed=Paper pipe=Open bite=1 body=.5 attack=.15 release=.5 leak=.2 cup=.5 vowel=.6 sag=15 volume=2.5 spread=0.6 chiff=0.2 | ahs | suspend | Paper forced to its brightest on an eh, octaves shaking | voice
Engine of hymns | Locked fifths | share=1 interval=-12 second=.5 reed=Brass pipe=Stopped bite=.85 body=.5 attack=.06 release=.4 lung=1.2 turn=.4 starve=.3 chiff=.4 volume=3 spread=0.7 | three | twochords | Stopped brass over low octaves, tugged by every breath
Waiting for the last key | Locked fifths | attack=2.4 release=5 pipe=Open bite=.6 interval=12 second=.7 starve=1 share=.8 sag=20 lung=10 turn=2 leak=.25 spread=1 volume=5 | open | gather | Brass octaves so slow to open that the chord arrives low key by low key | pad
Cloth over the altar | Locked fifths | attack=1.6 release=3 pipe=Stopped bite=.45 body=.8 interval=7 second=.6 share=.2 cup=.5 vowel=.1 leak=.3 lung=22 volume=-2.5 spread=1 | muffled | suspend | Dull stopped brass fifths veiled in an oo | pad
Every saint at once | Locked fifths | attack=.8 release=2.5 reed=Cane pipe=Open bite=.88 interval=19 second=.6 starve=0 share=.5 leak=.2 cup=.5 vowel=.55 sag=0 volume=-2 spread=0.6 | muffled 1.mix=.3 1.tone=2400 | middle | Cane on an open ah with pure twelfths | pad
Organ pipes under snow | Locked fifths | attack=1.2 release=4 reed=Paper bite=.5 interval=24 second=.6 starve=-.5 share=.3 cup=0 sag=0 spread=1 pipe=Stopped leak=.4 body=.8 volume=6 | glimmer | gather | Pale stopped paper and fifteenths, half breath, high keys before low | pad
Stillness with a seam | Locked fifths | attack=1 release=3 reed=Brass pipe=Chest bite=.62 interval=2 second=.5 beat=.3 lock=1 share=.6 cup=.3 vowel=.3 leak=.1 lung=14 spread=0.3 | hanging | fifth | Mellow brass with a whole tone rubbing inside each locked key | drone
`,
    },
    {
      id: 'breath-tide',
      name: 'Breath tide',
      category: 'pad',
      rows: `
Estuary at slack water | Breath tide | lung=5 turn=1.6 starve=.8 attack=.5 release=2 pipe=Open bite=.6 leak=.3 second=.5 cup=.1 spread=1 interval=-12 share=0.15 lock=0.2 chiff=0.1 body=0.5 | bloom | suspend | Round brass over its lower octave, out and in, slow and full
Moored side by side | - | second=.8 interval=0 pipe=Cone bite=.66 body=.6 cup=.4 vowel=.25 lung=2.6 turn=.8 sag=20 share=.6 attack=.25 release=1 volume=2.5 spread=0.6 lock=0.4 chiff=0.4 beat=2.4 | ensemble | sway | Pairs of brass in cones knock gently together as the breath turns
Harbour bar crossing | Breath tide | lung=1.9 turn=.5 starve=-.6 pipe=Chest bite=.8 body=.5 interval=7 second=.7 share=.9 sag=40 attack=.12 chiff=.5 spread=0.9 lock=0.7 cup=0.3 beat=0.8 | desk | gather | Brass fifths heave in short swells, the top keys catching first on the way out
Mudflats shining | Breath tide | lung=8 turn=2.6 starve=.5 pipe=Stopped bite=.5 body=.9 interval=19 second=.4 leak=.5 attack=1 release=3 cup=0 sag=6 spread=0.7 share=0.75 lock=0.85 | open | suspend | Wide shallow stopped brass, a twelfth faint over it
Rope ferry | - | pipe=Open bite=.72 body=.8 interval=-12 second=.6 beat=.3 lung=3 turn=.3 starve=.3 lock=.9 sag=5 cup=.2 leak=.15 attack=.15 release=.7 spread=0.5 share=0.45 chiff=0.05 | reel | twochords | Brass and its lower octave pulled across and back in long strokes
Tide under pack ice | Breath tide | reed=Steel bite=.42 pipe=Open body=.9 lung=5 turn=2.2 starve=.7 attack=.8 release=5 sag=10 leak=.2 second=.7 cup=.1 volume=-1 spread=0.6 share=0.3 lock=0.85 | winter | suspend | Dim steel in open pipes drags out and in
Shingle drawn back | Breath tide | reed=Steel bite=.6 pipe=Chest body=.5 lung=2 turn=1 starve=-.8 interval=0 second=.9 beat=1.4 attack=.4 release=2.4 leak=.1 cup=.4 vowel=.45 volume=4.5 spread=0.9 share=0.75 lock=0.6 chiff=0.05 | hollowed | gather | Steel pairs on wood raked out and in, high keys leading the breath out
Wind off the turbines | Breath tide | reed=Steel bite=.5 pipe=Stopped body=.8 lung=3.4 turn=1.5 starve=.4 interval=-12 second=.5 beat=.2 attack=.6 release=3 leak=.4 sag=0 spread=0.7 share=0.45 lock=0.2 cup=0.5 volume=-0.5 | broad | sway | Hollow steel over low octaves turns over like slow blades
Silver at low water | Breath tide | reed=Steel bite=.36 pipe=Open body=.6 lung=1.3 turn=.5 starve=.2 interval=24 second=.6 attack=.2 release=4 cup=.2 leak=.15 spread=1 volume=0 share=0.15 lock=0.4 chiff=0.4 beat=1.2 | facets | gather | Fine steel with two octaves over it, quick small waves | texture
Anchor chain taut | Breath tide | reed=Steel bite=.64 pipe=Cone body=.6 lung=4 turn=.4 share=1 lock=.2 interval=7 second=.7 cup=.7 vowel=.2 attack=.3 release=2 sag=15 volume=-2 spread=0.45 chiff=0.2 | valve | bourdon | Steel fifths strain and slacken behind cupped hands | drone
Fog bell, muffled | Breath tide | reed=Paper bite=.5 pipe=Stopped body=.9 lung=3 turn=1.8 leak=.2 interval=12 second=.4 attack=.7 release=1.6 cup=.4 vowel=.1 starve=.5 volume=6 spread=0.9 share=0.45 lock=0.4 | mist | asleep | Stopped paper in an oo, seeping out and in
Laundry on the line | Breath tide | reed=Paper bite=.9 pipe=Chest body=.4 lung=1.4 turn=.6 leak=.1 interval=7 second=.8 attack=.15 release=.7 spread=1 starve=-.4 share=0.15 lock=0.7 chiff=0.2 cup=0 beat=1.1 | breeze | sway | Bright flapping paper fifths, filled and emptied again
Sand moving on sand | Breath tide | reed=Paper bite=.4 pipe=Open body=1 lung=4.4 turn=2.4 leak=.8 second=.3 interval=19 attack=1.2 release=2 sag=20 chiff=0 volume=3 spread=0.7 share=0.55 lock=0.85 cup=0.2 | surf | single | Breath first and last, a thread of paper tone in open pipes | texture
Slow hand clapping | Breath tide | reed=Paper bite=1 pipe=Cone body=.5 lung=2.4 turn=1.2 leak=.05 interval=0 second=1 beat=2.8 attack=.3 release=1 cup=.3 vowel=.55 sag=45 spread=1 share=0.3 lock=0.6 chiff=0.05 | crowd | twochords | Buzzing paper pairs swell, sag and turn over
White sheets, open sash | Breath tide | reed=Paper bite=.65 pipe=Open body=.7 lung=6 turn=1 leak=.1 interval=24 second=.5 attack=.9 release=2.6 lock=1 starve=.8 sag=0 volume=5 spread=0.6 share=0.75 cup=0.1 | sheen | gather | Clean paper with high octaves filling from the bottom
Osprey flats | Breath tide | reed=Cane bite=.88 pipe=Open body=.8 lung=4 turn=1 interval=12 second=.5 starve=.6 attack=.4 release=1.4 cup=.1 leak=.3 spread=0.7 share=0.55 lock=0.6 chiff=0.05 | valley | suspend | Open cane with octaves, each breath wide and unhurried
Punt pole, pause | Breath tide | reed=Cane bite=.95 pipe=Stopped body=.5 lung=1.5 turn=1.4 interval=-5 second=.6 beat=.2 starve=.3 attack=.2 release=.6 chiff=.5 leak=.2 volume=-0.5 spread=0.5 share=0.3 lock=0.2 cup=0.3 | puffs | twochords | Stopped cane over a fourth, with a wait at every turn
Heron lifts | Breath tide | reed=Cane bite=.98 pipe=Cone body=.7 lung=2.8 turn=.7 interval=7 second=.9 starve=-1 share=.7 attack=.3 release=.9 cup=.3 vowel=.6 volume=5 spread=1 lock=0.4 chiff=0.4 beat=0.9 | pendulum | gather | Nasal cane fifths whose lowest keys are the last to rise going out
Reed cutters at four | Breath tide | reed=Cane bite=.92 pipe=Chest body=.8 lung=3.2 turn=.4 interval=0 second=.7 beat=3 starve=0 attack=.1 release=.5 sag=25 leak=.1 spread=0.6 share=0.45 lock=0.7 chiff=0.2 cup=0.5 | board | suspend | Two canes to a key, beating quickly, pushed and pulled like a saw
Brown water, brown sky | Breath tide | reed=Cane bite=.7 pipe=Stopped body=1 lung=7 turn=3 interval=-12 second=.8 starve=.5 attack=1.4 release=2 sag=10 leak=.3 cup=.5 vowel=.15 spread=0.9 share=0.15 lock=0.85 beat=0.6 | under | asleep | Dull hollow cane over its low octave, with a near silence at each turn
Drawn by the moon | - | breath=In turn=1 pipe=Open bite=.68 starve=.5 release=3 second=.6 interval=7 beat=.1 sag=5 leak=.25 spread=1 lock=.9 lung=3 attack=.6 volume=3.5 share=0.75 body=1 cup=0.1 | breathing | suspend | Brass fifths that only ever swell, let go, and swell again
Pulling the curtain | - | breath=In lung=2 turn=.3 reed=Cane pipe=Chest bite=.94 starve=0 attack=.3 release=.8 second=.5 interval=12 sag=15 cup=.3 vowel=.5 volume=-1 spread=1 share=0.45 lock=0.85 chiff=0.5 body=0.5 beat=1.4 | backroom | sway | Cane on wood hauled upward every two seconds
Up the beach, no further | - | breath=In lung=3 turn=2 reed=Paper pipe=Cone bite=.75 starve=-.5 attack=.6 release=1.4 second=.8 interval=-12 leak=.05 sag=30 volume=1 spread=0.6 share=0.15 lock=0.6 body=0.9 cup=0 beat=1 | wax | asleep | Paper cones over a low octave reach up, lose hold and slip
Gathering skirts | - | breath=In lung=1.1 turn=.6 reed=Brass pipe=Chest bite=.85 body=.4 starve=.8 attack=.2 release=1 second=.7 interval=0 beat=1 share=.5 chiff=.3 spread=1 volume=6 lock=0.2 cup=0.2 | dotted | gather | Short brass swells, one each second, gathering key by key
Wave that stays up | - | breath=In lung=9 turn=.5 reed=Steel pipe=Stopped bite=.44 body=.9 starve=.6 attack=2 release=4 second=.5 interval=12 beat=.2 leak=.3 sag=0 volume=6 spread=0.7 share=0.3 lock=0.4 cup=0.3 | fillroom | suspend | Hollow steel slowly filling for as long as the breath is drawn
Pulse of a harbour light | - | lung=.8 turn=.4 bite=.64 starve=.3 attack=.05 release=1 second=.5 beat=.3 share=.5 leak=.2 sag=0 spread=1 volume=0 pipe=Cone interval=16 chiff=0.1 body=0.5 cup=0 | late | twochords | Brass cones with a tenth, breathing in and out in quick even seconds
Small boats nodding | - | lung=1.2 turn=.9 reed=Paper pipe=Stopped bite=.75 starve=.9 attack=.08 release=.5 second=.3 interval=7 beat=.4 share=.9 leak=.1 chiff=.4 volume=5 spread=0.6 lock=0.4 body=0.9 cup=0.2 | water | gather | Stopped paper rocks, its keys a little apart
Heartbeats, four of them | - | lung=.45 turn=.3 reed=Brass pipe=Chest bite=.58 body=.7 cup=.6 vowel=.2 starve=.6 attack=.03 release=.3 second=.4 interval=-12 chiff=.4 sag=25 spread=0.9 share=0.3 lock=0.7 beat=0.6 | drum | asleep | Muffled brass thumps of breath, out and in, over a low octave
Nervous shoal | - | lung=.3 turn=.1 reed=Steel pipe=Open bite=.38 starve=-.7 attack=.04 release=1.4 second=.7 interval=19 beat=2 share=.8 leak=.2 spread=1 sag=0 volume=5.5 lock=0.85 chiff=0.5 body=0.75 cup=0.1 | flock | gather | Steel with twelfths flickering as the breath turns over three times a second | texture
Paddle wheel | - | lung=.6 turn=.5 reed=Cane pipe=Cone bite=.96 starve=.5 attack=.03 release=.25 second=.6 interval=-5 beat=.5 share=.6 chiff=.7 sag=10 cup=.2 volume=1 spread=0.5 lock=0.6 body=1 | throb | twochords | Cane cones over fourths slap the water better than once a second
One breath an hour | - | lung=20 turn=3 pipe=Open bite=.62 starve=1 share=1 release=6 second=.5 interval=12 beat=.1 sag=45 leak=.35 spread=1 lock=1 volume=1 body=0.9 cup=0.3 attack=3 | nave | gather | Enormous slow brass that drains away while it is still opening
Continental shelf | - | lung=14 turn=2 reed=Cane pipe=Stopped bite=.65 body=1 starve=.4 attack=1.8 release=3 second=.7 interval=-12 sag=15 leak=.3 cup=.4 vowel=.1 spread=0.9 share=0.75 lock=0.6 beat=0.8 | lowcath | asleep | Deep stopped cane and octave, one long fall
Whole chord exhales | - | breath=Out lung=7 turn=1.2 pipe=Chest bite=.78 body=.5 starve=.7 share=.5 attack=.4 release=2.4 second=.8 interval=7 beat=.3 sag=60 leak=.2 spread=0.7 lock=0.2 chiff=0.1 cup=0.5 | faraway | gather | Brass fifths bend and darken as one breath leaves them
Glacier calves | - | lung=10 turn=.6 reed=Steel pipe=Cone bite=.55 starve=-.9 share=.9 attack=1.2 release=5 second=.6 interval=0 cup=.6 vowel=.15 sag=30 leak=.05 volume=-0.5 spread=0.5 lock=0.4 body=1 beat=1.1 | darkether | suspend | Heavy steel pairs whose low keys give way long before the high
Dew point | - | lung=12 turn=1.6 reed=Paper pipe=Open bite=.45 starve=.2 share=.2 attack=2 release=3 second=.6 interval=16 beat=.15 sag=0 leak=.2 lock=1 chiff=0 spread=1 body=0.5 cup=0.2 | halo | gather | Soft paper with tenths condensing out of plain air
First come, first breath | - | starve=1 share=1 lung=3 turn=2 pipe=Chest bite=.76 attack=.15 release=1.6 second=.4 interval=12 sag=20 leak=.15 spread=1 chiff=.4 volume=4 lock=0.4 body=0.35 cup=0.5 beat=0.9 | circle | gather | Brass that gives its lowest key all the air, then lets it go and favours the rest
Last to the table | - | starve=-1 share=1 lung=3.6 turn=1.4 reed=Cane pipe=Open bite=.9 attack=.3 release=1 second=.6 interval=7 sag=35 leak=.2 cup=.1 volume=-1 spread=0.7 lock=0.7 chiff=0.2 body=0.75 beat=1.8 | recall | suspend | Cane that starves from the bottom, the melody outliving its bass
Queue at the well | - | starve=.9 share=.8 lung=1.6 turn=1 reed=Paper pipe=Chest bite=.8 attack=.2 release=.8 second=.5 interval=-12 sag=15 leak=.1 cup=.6 vowel=.4 spread=0.5 lock=0.85 chiff=0.5 body=1 beat=1 | closemic | gather | Close paper voices taking turns at the one breath
Equal shares | - | starve=0 share=0 lung=4 turn=1 reed=Brass pipe=Stopped bite=.7 attack=.3 release=1.2 second=.6 interval=9 beat=.3 sag=0 leak=.3 lock=.5 spread=.7 chiff=0.05 body=0.5 cup=0.3 | lungs | middle | Stopped brass with sixths, all keys breathing exactly together
Elbows out | - | starve=.6 share=1 lock=0 lung=2.2 turn=.8 reed=Steel pipe=Stopped bite=.52 release=1.8 second=.8 interval=0 beat=2.4 sag=10 leak=.2 attack=.2 chiff=.2 spread=.7 volume=1.5 body=0.9 cup=0.1 | weave | sway | Hollow steel pairs jostling for air and for pitch
Vowel of the sea cave | - | cup=.95 vowel=.35 pipe=Open bite=.85 lung=3.4 turn=1.2 starve=.4 attack=.5 release=2 second=.6 interval=12 beat=.8 leak=.3 sag=15 spread=0.5 share=0.55 lock=0.6 chiff=0.05 body=0.75 | cave | chantline | Brass that opens toward ah on each breath and shuts again | voice
Tide talk | - | cup=1 vowel=.6 reed=Cane pipe=Chest bite=.98 lung=1.5 turn=.5 starve=.3 attack=.1 release=.6 second=.4 interval=-12 leak=.15 sag=20 spread=.5 share=0.3 lock=0.2 chiff=0.1 body=1 beat=0.6 | stream | asleep | Cane mouths an eh and an ah, out and in, over low octaves | voice
Mermaid, off duty | - | cup=.9 vowel=.1 reed=Paper pipe=Open bite=.9 lung=2.8 turn=1.6 starve=-.5 attack=.4 release=1.4 second=.7 interval=7 leak=.06 sag=40 spread=0.35 share=0.75 lock=0.4 chiff=0.4 body=0.5 beat=0.8 | shallows | duet | Paper in an oo with fifths, bending under at the end of each breath | voice
Wide open ee | - | cup=.85 vowel=.95 reed=Brass pipe=Stopped bite=.75 lung=4 turn=.8 starve=.2 attack=.6 release=1.6 second=.5 interval=19 leak=.4 sag=5 spread=1 volume=0 share=0.45 lock=0.7 body=0.9 beat=1.2 | whispers | gather | Breathy stopped brass narrowed to an ee
Hold your tongue | - | vowel=0 reed=Steel pipe=Cone lung=2 turn=.7 starve=.5 attack=.3 release=2.4 second=.5 interval=0 beat=.6 leak=.03 sag=10 share=.7 lock=0.85 chiff=0.5 body=0.35 bite=.85 spread=.5 cup=.88 volume=5 | forward | chantline | Steel shut up in an oo, its edge showing only at the height of a breath
Rock pool, zoomed in | - | lung=2.4 turn=1.4 pipe=Stopped bite=.8 starve=.7 attack=.1 release=1.2 second=.6 interval=19 beat=1 leak=.3 chiff=.6 spread=1 volume=-0.5 share=0.75 lock=0.7 body=1 cup=0.1 | cloud | gather | Stopped brass and twelfths, a small puff at each turn
Flood gate on a timer | - | lung=1.8 turn=.4 reed=Steel pipe=Chest bite=.56 starve=.3 attack=.2 release=1.5 second=.4 interval=12 cup=.5 vowel=.3 leak=.05 volume=-0.5 spread=1 share=0.45 lock=0.85 chiff=0.5 body=0.5 beat=1.1 | glaze | sway | Cool steel swells, evenly timed
Kelp, slowly | - | lung=5 turn=1.8 reed=Cane pipe=Cone bite=.8 starve=.4 attack=.8 release=1.6 second=.8 interval=5 beat=.3 cup=.6 vowel=.25 sag=50 leak=.1 spread=0.6 share=0.15 body=0.9 | deepwater | sway | Shaded cane cones and fourths lean flat at each turn
Tide tables, page nine | - | lung=3 turn=.6 reed=Paper pipe=Open bite=.85 starve=-.3 attack=.3 release=1 second=.5 interval=4 beat=.2 lock=1 leak=.06 sag=0 spread=0.9 share=0.55 chiff=0.1 body=0.35 cup=0.2 | oldrecord | sway | Paper with just thirds, out and in by the clock
Everything leaves wet | - | lung=2.6 turn=2.4 reed=Brass pipe=Open starve=.8 attack=.4 release=4 second=.7 beat=.6 leak=.4 sag=25 spread=1 volume=3.5 interval=5 body=.95 cup=0 bite=.75 share=0.3 lock=0.4 chiff=0.4 | melting | gather | Open brass over which a fourth hangs, with a long stop between breaths
`,
    },
    {
      id: 'steel-bells',
      name: 'Steel bells',
      category: 'bell',
      rows: `
Door of the bindery | Steel bells | bite=.5 body=.5 lung=4 second=.2 interval=12 beat=.4 release=1.8 chiff=.7 cup=.1 leak=0 volume=1 spread=1 share=0.15 | afterglow | chime | Plucked steel on a wooden chest, an octave thin above it
Keys on a nail | Steel bells | second=.5 release=.6 chiff=1 spread=1 leak=.02 volume=5.5 pipe=Cone bite=.45 body=.5 vowel=.5 cup=.7 interval=10 beat=3 lung=2.4 share=0.55 | bare | peal | Cupped steel with a small seventh jangling in it, gone in a second
Glockenspiel of rust | Steel bells | bite=.42 body=.9 lung=2.6 second=.6 interval=7 beat=.7 release=1 chiff=.8 cup=.4 vowel=.4 sag=20 spread=0.75 share=0.3 volume=-4.5 | wornreel | chime | Dulled steel with a fifth that beats, bending as it dies
Shop till, long closed | Steel bells | bite=.55 body=.35 lung=6 second=.4 interval=24 beat=.3 release=3.5 chiff=.6 cup=0 share=.6 volume=-2.5 spread=0.35 | oldrecord | broken | Clear steel under two octaves, each note sharing its air with the next
Pin in a chimney | Steel bells | bite=.36 body=.7 lung=3 second=.8 interval=0 beat=.9 release=2 chiff=.9 cup=.6 vowel=.2 leak=.05 volume=4 spread=0.9 share=0.45 | cupboard | peal | Dark steel pairs beating once a second
Frost on harebells | Steel bells | lung=3.6 second=.7 release=4 chiff=.8 leak=.1 spread=1 volume=1.5 pipe=Chest body=.9 bite=.25 cup=.5 interval=14 beat=.8 share=0.3 vowel=.5 | brightair | peal | Very round steel on wood, a ninth glinting above, held in an ah
Thin ice, small stones | Steel bells | pipe=Open body=.7 lung=1.6 second=.4 interval=12 beat=1.4 release=2.4 chiff=1 cup=0 leak=.2 spread=.8 volume=5.5 share=0.75 bite=.35 | stars | peal | Quick open steel with a puff and an octave that flutters
Window of the dairy | Steel bells | pipe=Open bite=.25 body=1 lung=5 second=.5 interval=7 beat=.2 release=3 chiff=.4 cup=.2 leak=.3 sag=6 volume=5.5 spread=0.35 share=0.45 | lateglints | chime | Almost a flute of steel with a fifth, rounded and airy
Cut glass, held to ear | Steel bells | pipe=Open bite=.58 body=.5 lung=2.2 second=.9 interval=19 release=5 chiff=.6 cup=.5 vowel=.5 leak=0 volume=6 spread=0.9 share=0.15 beat=0.9 | shell | peal | Steel and an equal twelfth, shaped by hands and left ringing
Dew line | Steel bells | pipe=Open bite=.4 body=.8 lung=7 second=.3 interval=16 beat=.1 lock=1 release=2 chiff=.5 cup=.1 leak=.15 share=.5 volume=6 spread=1 | rain | chime | Open steel with a tenth over each note, settling into tune
Under a bell of glass | Steel bells | pipe=Stopped bite=.45 body=.9 lung=4 second=.4 interval=12 release=2.6 chiff=.7 cup=.1 leak=.1 volume=6 spread=0.75 share=0.45 beat=1.8 | pane | chime | Hollow steel with an octave, its odd tones in front
Cistern drip, counted | Steel bells | pipe=Stopped bite=.3 body=1 lung=1.2 second=.2 interval=19 beat=.4 release=1.4 chiff=.9 cup=0 leak=.25 volume=6 spread=0.35 share=0.15 | cavern | peal | Short round drops of stopped steel
Third temple, third step | Steel bells | pipe=Stopped bite=.55 body=.7 lung=6 second=.6 interval=-5 beat=.5 release=5 chiff=.5 cup=.3 vowel=.2 leak=.05 volume=0 spread=0.9 share=0.55 | nave | chime | Stopped steel with a fourth beneath, slow to die
Abbot's supper gong | Steel bells | pipe=Stopped bite=.38 body=.9 lung=8 second=.8 interval=-12 beat=.4 release=6 chiff=.6 cup=.4 vowel=.1 sag=12 spread=.5 volume=-2.5 share=0.3 | darkhall | vault | Deep hollow steel and its octave below, beating slowly
Snow off a wire | Steel bells | pipe=Stopped bite=.48 body=.8 lung=2 second=.5 interval=24 beat=1.8 release=2 chiff=.8 cup=0 leak=.35 spread=1 volume=6 | crystals | drip | Breathy stopped steel, its second octave trembling
Thumb on cold tines | Plucked tongues | reed=Steel bite=.45 lung=1.5 second=.3 release=.7 leak=0 share=.4 volume=1 pipe=Cone interval=14 beat=1.5 vowel=.7 cup=.6 body=.3 spread=0.7 | board | ostinato | Short steel plucks through a narrow eh, a ninth shaking in them | plucked
Gourd with three shells | Plucked tongues | reed=Steel pipe=Stopped bite=.4 body=.9 lung=1 interval=7 second=.5 release=.4 cup=.5 vowel=.3 leak=.05 volume=6 spread=0.6 beat=1.4 | shells | ostinato | Short hollow steel with fifths | plucked
Comb across the thumb | Plucked tongues | reed=Steel pipe=Chest lung=.6 beat=.4 release=.3 cup=.4 vowel=.6 leak=0 spread=1 volume=2 body=.2 interval=19 bite=.3 second=.3 | smaller | ostinato | Tiny thin steel ticks, high and clean | plucked
Sardine tin ballad | Plucked tongues | reed=Steel pipe=Cone bite=.5 body=.8 interval=0 second=.9 beat=1.4 release=.9 cup=.6 vowel=.45 leak=.02 sag=15 volume=3 spread=1 breath=Both lung=.6 turn=.15 | tin | lullaby | Twangy steel pairs in cones, rocked in and out more than once a second | keys
Rake teeth | Plucked tongues | reed=Steel pipe=Open bite=.3 body=.8 lung=1.2 interval=-12 second=.7 beat=.3 release=1 cup=.2 leak=.1 share=.8 volume=6 spread=0.3 | slap | broken | Rounded steel with an octave below, each pluck stealing from the last | plucked
Brass doorplate | Steel bells | reed=Brass bite=.6 pipe=Chest body=.6 lung=2.2 second=.5 interval=19 beat=.8 release=1.2 chiff=1 cup=.1 sag=10 leak=.05 volume=1 spread=0.9 share=0.75 | opened | chime | Struck brass with a twelfth, warm and soon quiet
Lantern glass, tapped | Steel bells | reed=Brass bite=.42 pipe=Open body=.9 lung=3.4 second=.8 interval=24 beat=.4 release=2.4 chiff=.8 cup=0 leak=.15 volume=5 spread=1 share=0.45 | rain | peal | Round brass in open pipes with a bright second octave
Clock of dry wood | Steel bells | reed=Cane bite=.85 pipe=Stopped body=1 lung=1 second=.4 interval=19 release=.3 chiff=1 cup=0 leak=.1 sag=0 volume=2 spread=1 share=0.15 beat=2.4 | patter | hocket | Hollow cane knocks with a twelfth | plucked
Paper bell in a shrine | Steel bells | reed=Paper bite=.7 pipe=Open body=.8 lung=2.4 second=.6 interval=12 beat=1.2 release=1 chiff=.9 cup=.1 leak=.15 spread=1 volume=1 share=0.55 | brightair | chime | Puffs of open paper with octaves, more breath than metal
Copper under water | Steel bells | reed=Brass bite=.5 lung=5 second=.7 beat=.5 release=3 chiff=.6 sag=35 volume=-1.5 pipe=Chest body=.9 interval=4 cup=.7 vowel=.2 spread=0.35 share=0.3 | shallows | chime | Dark brass struck on its chest with a true third, sinking in pitch as it rings
Bell that inhales | Wire swell | pipe=Open body=.7 lung=2.2 turn=.5 attack=.06 second=.5 interval=19 beat=.3 release=3 bite=.62 leak=.05 chiff=.7 volume=6 spread=1 share=0.15 | heldback | chime | Steel struck and then drawn in, louder the longer it is held
Two strikes, one breath | - | reed=Steel breath=Both lung=1 turn=.4 pipe=Chest body=.5 chiff=1 attack=.015 release=2 second=.4 interval=12 cup=.2 leak=.05 sag=0 starve=.3 share=.3 spread=.9 volume=-1 beat=0.8 bite=.42 | fan | twochords | Steel bells struck again at every turn of the breath
Tower in fog, hourly | - | reed=Steel breath=Out lung=2.6 turn=.3 pipe=Stopped bite=.4 body=.9 chiff=.9 attack=.02 release=4 second=.7 interval=7 cup=.3 vowel=.2 leak=.15 sag=10 starve=-.5 share=.6 spread=0.75 beat=1.2 volume=5 | farshore 1.level=.8 | asleep | Hollow steel fifths that fall away, catch air and toll again
Ringers changing hands | - | reed=Steel breath=Circular lung=.6 turn=.5 pipe=Open bite=.46 body=.7 chiff=.8 attack=.02 release=2.6 second=.5 interval=12 beat=1 cup=.1 leak=.1 sag=0 starve=1 share=1 spread=1 volume=1.5 | pendulum | gather | Open steel and octaves pulsing as the keys trade one breath
Handbell choir, seated | - | reed=Steel breath=Out lung=1.4 turn=1 pipe=Chest bite=.42 body=.8 chiff=1 attack=.012 release=1.6 second=.6 interval=24 cup=.3 vowel=.5 leak=0 sag=0 starve=.6 share=.4 spread=1 volume=1 beat=1.1 | chapel | gather | Soft steel and fifteenths that stop and ring again a moment later
Hull plate, struck wet | Steel bells | pipe=Chest bite=.6 body=.8 lung=5 second=.9 interval=-12 beat=.9 release=5 chiff=1 cup=.7 vowel=.1 spread=.6 volume=0 share=0.3 | larger | barge | Heavy low steel over its octave, closed in by hands
Crypt gate | Steel bells | pipe=Cone bite=.52 body=.7 lung=7 second=.6 interval=-7 release=4 chiff=.7 cup=.5 vowel=.3 share=.8 leak=.05 volume=2.5 spread=0.75 beat=0.9 | cave | cellar | Steel in cones with a fifth below, rough where two keys meet
Iron stair, fourth floor | Steel bells | pipe=Stopped bite=.5 body=.6 lung=2.2 second=.5 interval=-12 beat=.4 release=1.4 chiff=1 cup=.4 vowel=.35 leak=.1 spread=.3 volume=6 share=0.45 | stairs 1.level=.9 | tread | Hollow low clanks of steel, quick to fade
Temple bar, felt striker | Steel bells | pipe=Open bite=.28 body=1 lung=9 second=.5 interval=-5 beat=.1 release=7 chiff=.5 cup=.2 leak=.1 sag=4 lock=1 volume=0.5 spread=0.9 share=0.15 | lowcath | asleep | Round low steel above a fourth, very long
Boiler plate angelus | Steel bells | pipe=Chest bite=.46 body=1 lung=4 second=1 interval=0 beat=2.6 release=3 chiff=.9 cup=.5 vowel=.2 sag=25 volume=2 spread=1 share=0.55 | throb | tenor | Two thick steels to a key, beating fast and sagging
Cracked in the casting | Steel bells | interval=6 cup=.3 vowel=.4 leak=.02 chiff=.5 spread=0.75 share=0.45 pipe=Stopped body=.6 bite=.6 beat=4 second=.9 release=3 lung=4 volume=6 | ringing | chime | Edged steel in a stopped pipe with a tritone shivering in it
Minor bell, major day | Steel bells | pipe=Open bite=.45 body=.7 lung=4.5 second=.7 interval=15 release=3 chiff=.7 cup=.1 leak=.1 sag=0 volume=4 spread=0.35 share=0.15 beat=1.8 | cluster | chime | Open steel with a minor tenth hanging over every note
Ninth of nine | Steel bells | pipe=Stopped bite=.42 body=.8 lung=3 second=.6 interval=14 beat=.8 release=2.4 chiff=.8 cup=.2 leak=.2 spread=1 volume=2 share=0.55 | chimes | chime | Hollow steel with a ninth over each stroke
Bell and its neighbour | Steel bells | pipe=Cone body=.5 lung=3.4 second=.9 interval=2 beat=.4 release=2 chiff=.8 cup=.6 vowel=.5 leak=0 bite=.34 volume=0 spread=1 share=0.3 | still | peal | Steel cones a whole tone apart, rubbing gently
Seventh hour | Steel bells | pipe=Chest bite=.34 body=.9 lung=5 second=.6 interval=10 release=3.6 chiff=.6 cup=.4 vowel=.25 sag=8 volume=-2 spread=0.6 share=0.75 beat=1.4 | bowls | broken | Soft dark steel with a minor seventh above
Wah bell | Steel bells | pipe=Open bite=.55 body=.4 lung=2 second=.3 interval=12 cup=1 vowel=.55 release=1.6 chiff=.9 leak=0 sag=10 volume=6 spread=0.35 share=0.55 | touched | chime | Steel cupped on an ah that closes as it dies
Little oo of metal | Steel bells | pipe=Stopped bite=.5 body=.6 lung=3 second=.5 interval=7 beat=.2 cup=.95 vowel=.02 release=2 chiff=.8 leak=.05 volume=6 spread=0.9 share=0.3 | oos | drip | Steel rounded to an oo in stopped pipes
Spoken by cutlery | Steel bells | pipe=Chest body=.3 lung=1 second=.4 interval=0 beat=1.8 release=.6 chiff=1 share=.6 volume=6 spread=0.5 bite=.48 cup=.85 vowel=.7 | imprinted | hocket | Short steel syllables on an eh | plucked
Saint's tooth | Steel bells | pipe=Cone body=.7 lung=5 second=.6 interval=19 release=3 chiff=.6 leak=.02 spread=1 bite=.36 vowel=.9 cup=.6 volume=3 share=0.45 beat=2.4 | sparks | chime | Thin steel with a twelfth, pinched to an ee
Jaw bell | Steel bells | pipe=Chest bite=.64 body=.2 lung=1.6 second=.7 interval=-12 cup=.95 vowel=.35 release=.8 chiff=1 leak=0 spread=.2 volume=-4 share=0.15 beat=0.6 | iron | tread | Low steel twang behind a shut jaw, its octave under | plucked
Bells heard through milk | Steel bells | pipe=Stopped bite=.32 body=.9 lung=4 second=.5 interval=12 beat=.3 release=4 chiff=.4 cup=.5 vowel=.15 leak=.1 volume=-3.5 spread=0.9 share=0.75 | darkwater | chime | Muted steel with octaves
Cooling embers, ringing | Steel bells | pipe=Chest body=.5 lung=3 second=.6 interval=12 beat=.9 release=2.4 chiff=.8 cup=.1 sag=20 volume=4.5 spread=1 share=0.45 bite=.38 | embers | peal | Steel and octaves, sagging as they cool
Radio mast in sleet | Steel bells | pipe=Open bite=.55 body=.5 lung=1.8 second=.7 interval=24 beat=2.6 release=1.6 chiff=1 cup=.3 vowel=.6 leak=.1 spread=1 volume=5 share=0.15 | station | chime | Bright wavering steel
Bells, a century on | Steel bells | pipe=Open bite=.3 body=.8 lung=6 second=.6 interval=7 beat=.1 release=8 chiff=.5 cup=0 leak=.1 lock=1 volume=0 spread=0.75 share=0.55 | hanging | chime | Gentle steel fifths with eight seconds of ring left in them
Slow bell lost at sea | Steel bells | pipe=Stopped bite=.46 body=.8 lung=8 second=.8 interval=-12 release=5 chiff=.7 cup=.3 vowel=.3 sag=30 leak=.2 volume=1.5 spread=0.35 share=0.3 beat=0.8 | drifting | vault | Deep stopped steel, bending as it goes
`,
    },
    {
      id: 'five-sleepers',
      name: 'Five sleepers',
      category: 'voice',
      rows: `
Night ward, one lamp | Five sleepers | lung=3 turn=2 starve=-.5 sag=60 cup=.8 vowel=.5 interval=12 second=.4 attack=.5 volume=2 spread=0.35 share=0.15 lock=0.2 chiff=0.1 beat=1.1 | lungs | asleep | Brass asleep on an ah, the top bed stirring first on every breath
Brothers in one bed | Five sleepers | interval=0 second=1 beat=1.6 lung=2.2 turn=1 sag=40 pipe=Chest bite=.75 cup=.6 vowel=.3 attack=.2 release=1 starve=.2 share=.8 volume=-0.5 spread=0.6 lock=0.4 chiff=0.4 | booth | sway | Two brass breathers to each key, close and a little rough
Guard asleep on duty | Five sleepers | breath=Out lung=5 turn=3 sag=90 pipe=Cone bite=.6 cup=1 vowel=.25 second=.3 interval=-12 attack=.4 release=1.2 starve=.9 leak=.1 volume=3.5 spread=1 share=0.6 lock=0.7 chiff=0.2 | stairs | asleep | Brass sinks nearly a semitone on a long oh, then nothing for a while
Dormitory in March | Five sleepers | breath=Both lung=1.6 turn=.8 sag=30 pipe=Open bite=.7 cup=.7 vowel=.65 second=.7 interval=7 starve=-.9 spread=1 leak=.5 attack=.3 volume=6 share=0.75 lock=0.85 chiff=0.5 beat=0.9 | acrossroom 1.level=.75 | gather | Airy brass and fifths turning over in their beds | pad
Feet out of the blanket | Five sleepers | lung=2.6 turn=1.4 sag=15 pipe=Stopped bite=.5 body=.9 cup=.4 vowel=.9 second=.5 interval=19 attack=.8 release=2.4 leak=.6 volume=-0.5 spread=0.5 share=0.45 lock=0.6 beat=1.8 | blanket | suspend | Cool breathy stopped brass, an ee in the hands and a twelfth overhead | pad
Paper sleepers | Five sleepers | reed=Paper bite=.9 pipe=Chest body=.6 lung=2.4 turn=1.6 sag=70 cup=.9 vowel=.45 second=.6 interval=0 beat=.8 leak=.08 attack=.3 spread=0.6 share=0.3 lock=0.85 chiff=0.5 | parlour | asleep | Paper voices on a rounded ah, sagging and waking
Dream of folded gulls | Five sleepers | reed=Paper bite=.7 pipe=Open body=.8 breath=In lung=3.6 turn=1 sag=20 cup=.6 second=.5 interval=12 beat=.3 leak=.15 attack=.9 starve=.6 release=2 volume=4 vowel=.04 spread=0.9 share=0.75 lock=0.6 | glimmer | gather | Soft paper oohs that swell on the breath in | pad
Page turner nods | Five sleepers | reed=Paper bite=1 pipe=Cone body=.4 lung=1.2 turn=.7 sag=85 cup=.95 vowel=.72 second=.4 interval=-12 leak=.03 attack=.12 chiff=.4 share=.6 volume=-1.5 spread=0.5 lock=0.2 beat=1 | oldrecord | twochords | Buzzing paper mouths an eh and slumps with each breath
Lullaby, the singer gone | Five sleepers | reed=Paper bite=.55 pipe=Stopped body=.8 breath=Circular lung=4 turn=2 sag=10 cup=.8 vowel=.08 second=.3 interval=7 beat=.2 leak=.2 attack=.6 release=1.6 volume=6 spread=0.25 share=0.15 | halftime | chantline | Hollow paper hums an oo with a fifth, never quite stopping
Tissue over the mouth | Five sleepers | reed=Paper bite=.95 pipe=Chest body=.3 breath=Both lung=.8 turn=.3 sag=25 cup=.7 vowel=.6 second=.8 interval=12 beat=2 leak=.2 attack=.04 release=.4 volume=-2.5 spread=0.35 lock=0.7 chiff=0.2 | closemic | slopes | Fluttering paper breath, quick and near, its octave trembling
Uncle on the bench | Five sleepers | reed=Cane bite=.98 pipe=Chest body=.4 breath=In lung=2 turn=1.4 sag=35 cup=.8 vowel=.3 second=.6 interval=-12 beat=.6 attack=.2 leak=.2 release=.6 volume=6 share=0.45 chiff=0.4 | acrossroom | vault | Cane snores in, an octave deep, and lets go | bass
Bear under the stairs | Five sleepers | reed=Cane bite=.9 pipe=Cone body=.8 breath=Both lung=2.8 turn=1.2 sag=20 cup=.9 vowel=.1 second=.7 interval=-12 attack=.4 leak=.1 share=.8 volume=-2 spread=0.5 lock=0.7 chiff=0.2 beat=0.6 | mineshaft | asleep | Big dark cane in an oo, two octaves wide
Third class carriage | Five sleepers | reed=Cane bite=.95 pipe=Stopped body=.6 breath=Out lung=1.8 turn=.6 sag=50 cup=.6 vowel=.5 second=.5 interval=0 beat=2.6 starve=.5 share=1 leak=.3 attack=.15 release=.5 volume=2 spread=0.25 lock=0.85 chiff=0.5 | softpulse | sway | Cane pairs snore out of step in stopped pipes
Old dog, fireside | Five sleepers | reed=Cane bite=.88 pipe=Open body=.7 breath=Both lung=1 turn=.8 sag=10 cup=.7 vowel=.4 second=.3 interval=-5 beat=.2 attack=.1 leak=.5 release=.4 chiff=.3 spread=0.35 share=0.3 lock=0.6 | warmth | asleep | Cane breathes out and in by turns, over a soft fourth
Father, mid sentence | Five sleepers | reed=Cane bite=1 pipe=Chest body=.5 breath=Once lung=4 turn=1 sag=60 cup=1 vowel=.7 second=.4 interval=-12 attack=.08 release=.8 leak=.1 volume=-2.5 spread=0.6 share=0.75 lock=0.2 chiff=0.1 beat=0.8 | valveworn | slopes | Cane starts on a clear eh over its octave and drifts off
Wire dreams | Five sleepers | reed=Steel bite=.5 pipe=Open body=.7 lung=3.4 turn=2 sag=40 cup=.8 vowel=.35 second=.5 interval=12 attack=.8 release=4 leak=.1 volume=-1 spread=0.5 share=0.55 lock=0.6 beat=1.2 | seasick | suspend | Steel behind hands opens, bends and goes under again
Telephone left off | Five sleepers | reed=Steel bite=.55 pipe=Chest body=.3 breath=Circular lung=2 turn=.6 sag=15 cup=.95 second=.8 interval=3 beat=.5 attack=.3 release=1.5 leak=0 spread=.2 volume=-0.5 vowel=.5 share=0.3 lock=0.2 chiff=0.1 | kitchen | overdrone | Steel hums an ah with a minor third beside it | drone
Braces on the pillow | Five sleepers | reed=Steel bite=.6 pipe=Cone body=.6 lung=1.5 turn=.6 sag=20 cup=1 vowel=.05 second=.4 interval=7 attack=.1 release=2 share=.7 chiff=.5 volume=-1.5 spread=0.35 lock=0.4 beat=1.1 | pillow | asleep | Steel shut tight in an oo, a fifth gritted under it
Moonlit aluminium | Five sleepers | reed=Steel bite=.36 pipe=Stopped body=.9 breath=In turn=1.6 sag=0 cup=.6 vowel=.8 second=.7 interval=19 beat=.8 release=5 leak=.25 lung=2.8 attack=.8 volume=6 starve=.7 spread=0.6 share=0.45 lock=0.7 | bloom | gather | Pale hollow steel breathes in on an eh, high keys before low | pad
Nurse with a tuning fork | Five sleepers | reed=Steel bite=.42 pipe=Open body=.5 breath=Once lung=5 turn=.4 sag=8 cup=.7 vowel=.5 second=.3 interval=24 beat=.2 attack=.1 release=3 chiff=.6 leak=.05 volume=3.5 spread=1 share=0.15 lock=0.85 | onesine | slopes | One steel ah for each key with a far octave over it
Choir practising breath | Five sleepers | sag=0 lock=1 pipe=Open bite=.85 cup=.9 vowel=.5 lung=6 turn=.6 second=.6 interval=12 beat=.4 attack=.3 release=1.4 starve=0 share=.3 leak=.15 volume=-5 spread=0.25 chiff=0.2 | cathedral | middle | Brass sings a steady ah with octaves, every key breathing together
Sopranos by the door | Five sleepers | sag=6 pipe=Chest bite=.8 cup=.95 lung=4 turn=.4 second=.8 interval=19 beat=1.5 attack=.2 release=1 starve=-.4 leak=.1 spread=1 volume=1.5 vowel=.5 share=0.45 lock=0.85 chiff=0.5 | brighthall | highhold | Bright brass ahs under high beating twelfths
Basses, standing | Five sleepers | sag=10 reed=Cane pipe=Cone bite=.92 cup=.85 vowel=.22 lung=8 turn=.8 second=.9 interval=-12 beat=.3 attack=.35 release=1 starve=.3 lock=1 leak=.05 spread=0.6 share=0.15 chiff=0.05 | monks | asleep | Cane on a deep oh with octaves beneath, in tune and in line
Boys' treble, whispering | Five sleepers | sag=12 reed=Paper pipe=Stopped bite=.85 cup=.8 lung=2 turn=.5 second=.4 interval=12 beat=.8 attack=.06 release=.5 chiff=.6 leak=.2 volume=6 vowel=.75 spread=1 share=0.55 lock=0.2 | whisper | slopes | Small hollow paper voices on an eh, tongued
Three sisters, one oh | Five sleepers | sag=20 reed=Brass pipe=Stopped bite=.75 cup=1 vowel=.28 lung=3 turn=.3 second=1 interval=4 beat=.3 lock=1 attack=.15 release=.8 leak=.2 share=.5 volume=5.5 spread=0.5 chiff=0.4 | stub | duet | Stopped brass locked in just thirds on one oh
Hum behind the teeth | Five sleepers | cup=1 vowel=0 reed=Brass pipe=Chest bite=.65 body=.8 breath=Circular lung=7 second=.5 interval=0 sag=5 attack=.4 release=1.2 leak=0 volume=-0.5 spread=0.35 share=0.15 lock=0.2 chiff=0.1 beat=0.9 | nextdoor 1.level=.75 | chantline | Two brass reeds hum in an oo with no breath heard
Kitchen hum, drying up | Five sleepers | cup=.9 vowel=.12 reed=Cane pipe=Open bite=.9 breath=Out lung=3 turn=.2 second=.2 interval=12 sag=25 attack=.08 release=.4 leak=.1 starve=0 spread=0.6 share=0.55 lock=0.4 chiff=0.4 | kitchen | slopes | A lone cane hum, one breath after another
Humming through a wall | Five sleepers | cup=.95 vowel=.03 reed=Paper pipe=Cone bite=.8 breath=Both lung=3.4 turn=.8 second=.6 interval=-12 sag=15 attack=.3 release=1 leak=.05 volume=2 share=0.3 lock=0.7 chiff=0.2 beat=1 spread=.5 | pane | duet | Closed paper hum with an octave under it
Beehive in the gable | Five sleepers | cup=.85 vowel=.18 reed=Brass pipe=Cone bite=.9 breath=Circular lung=3 turn=.5 second=.9 interval=0 sag=0 attack=.3 release=.8 share=1 lock=.1 leak=.02 volume=6 spread=0.3 chiff=0.5 beat=7 | swirl | bourdon | Brass pairs hum fast against each other, seven beats a second | drone
Fridge in the dark | Five sleepers | cup=1 reed=Steel pipe=Stopped bite=.5 body=.8 breath=Circular lung=11 second=.7 interval=-12 sag=0 attack=1 release=2 leak=.05 volume=3 beat=.06 vowel=.06 spread=0.6 share=0.45 lock=0.6 | room2 | fifth | Cold hollow steel on an oo, its low octave beating once in eight seconds | drone
Gasp and settle | Five sleepers | breath=In lung=1.2 turn=2 pipe=Open bite=.8 cup=.7 vowel=.55 second=.5 interval=12 beat=1 sag=50 attack=.1 release=1.6 leak=.45 chiff=.5 volume=5.5 spread=0.6 share=0.3 lock=0.85 | late | suspend | Brass draws a short breath in, then waits
First warm night | Five sleepers | breath=In lung=3 turn=1.2 pipe=Stopped bite=.6 cup=.5 vowel=.4 second=.4 interval=7 sag=10 release=2.4 starve=.8 spread=0.9 share=0.75 lock=0.6 beat=1.4 leak=.5 attack=.4 volume=6 | dapple | twochords | Half air and half stopped brass, a fifth in each breath in | pad
Yawn passed down the row | Five sleepers | breath=In lung=2.4 turn=.6 reed=Cane pipe=Chest bite=.95 cup=1 vowel=.45 second=.3 interval=-12 sag=80 share=1 attack=.3 release=.8 leak=.15 volume=6 starve=-1 spread=0.5 lock=0.2 chiff=0.1 | tilting | gather | Cane yawns on an ah from the lowest key to the highest
Breath before bad news | Five sleepers | breath=In turn=.4 reed=Steel pipe=Cone bite=.5 cup=.8 vowel=.2 second=.6 interval=2 beat=.3 sag=5 release=3 share=.9 leak=.1 lung=3.2 attack=.8 volume=6 spread=0.5 lock=0.4 | swellroom | asleep | Steel held in an oh grows into whole tones that press on each other | pad
Reading glasses rise | Five sleepers | breath=In lung=1.6 turn=.9 reed=Paper pipe=Chest bite=.75 cup=.5 vowel=.3 second=.7 interval=12 sag=20 attack=.2 release=.9 leak=.15 starve=-.6 volume=1 spread=0.45 share=0.55 lock=0.7 chiff=0.2 beat=2.4 | afterimage | lullaby | Paper swells and rests, swells and rests | keys
Only the pillow hears | Five sleepers | breath=Both leak=1 bite=.4 pipe=Stopped body=.9 cup=.8 vowel=.3 lung=2.4 turn=1.4 second=0 sag=10 attack=.5 release=1.2 volume=5.5 spread=0.6 share=0.45 lock=0.4 chiff=0.4 | closemic | single | Slow breath in and out of a stopped pipe, the brass nearly lost | texture
Curtains and lungs | Five sleepers | leak=.85 reed=Paper bite=.6 pipe=Open body=1 cup=.2 vowel=.5 lung=3 turn=1 second=.4 interval=19 attack=.4 release=2 spread=1 volume=2.5 share=0.15 lock=0.7 chiff=0.2 beat=0.8 | breeze | sway | Wide airy paper, a twelfth glinting inside each breath | texture
Snow on the skylight | Five sleepers | leak=.9 reed=Steel bite=.3 pipe=Open body=.9 cup=0 lung=4 turn=2 second=.6 interval=24 attack=1 release=5 sag=0 spread=1 volume=4.5 share=0.55 lock=0.85 beat=1.2 | whispers | gather | Breath over faint steel octaves, soft as static | texture
Sleep mask, seaside | Five sleepers | leak=.75 reed=Cane bite=.85 pipe=Stopped body=.8 cup=.95 lung=1.8 turn=1 second=.3 interval=7 sag=30 attack=.2 release=.7 volume=3.5 vowel=.5 spread=1 share=0.3 lock=0.6 chiff=0.05 | surf | asleep | Hissing cane on an ah with a dull fifth, breath after breath | texture
Draughty prayer | Five sleepers | leak=.7 bite=.7 pipe=Chest body=.7 cup=.6 vowel=.2 breath=Circular lung=1.5 turn=1.5 second=.5 interval=-12 starve=.8 sag=25 attack=.2 volume=-1 spread=0.6 share=0.75 chiff=0.1 beat=0.8 | tunnel | chantline | Leaky brass over low octaves that dips and never quite stops
Sleepwalker's tune | Five sleepers | lung=4 turn=.4 sag=45 starve=0 pipe=Stopped bite=.75 cup=.8 vowel=.4 second=.2 interval=12 beat=.3 attack=.12 release=1 leak=.3 volume=2 spread=0.5 share=0.55 lock=0.6 chiff=0.05 | singer | ney | A single stopped brass voice that slides a little flat on each breath
Alto from the stairwell | Five sleepers | reed=Cane bite=.97 pipe=Open body=.5 lung=3 turn=.3 breath=Out sag=15 cup=.9 vowel=.48 second=0 attack=.1 release=.7 leak=.15 chiff=.2 volume=6 spread=0.25 share=0.3 lock=0.2 | stairs 1.level=.8 | treeline | Plain cane on a clear ah, nothing beside it
Milk teeth | Five sleepers | reed=Paper bite=1 pipe=Chest body=.3 lung=1 turn=.2 sag=10 cup=1 vowel=.9 second=.5 interval=12 beat=.6 attack=.03 release=.25 chiff=.8 leak=.05 volume=0 spread=0.35 share=0.75 lock=0.4 | smaller | shepherd | A small pinched paper voice, all ee
Tenor in the bath | Five sleepers | reed=Brass bite=.88 pipe=Cone body=.6 lung=5 turn=.5 breath=Both sag=8 cup=.85 vowel=.52 second=.6 interval=0 beat=1.2 attack=.15 release=.8 leak=.05 volume=2.5 spread=0.6 share=0.45 lock=0.7 chiff=0.2 | chapel 1.mix=.45 | tenor | Full brass on an open ah, doubled and beating
Old song, half the words | Five sleepers | reed=Steel bite=.48 pipe=Chest body=.5 lung=2 turn=.7 breath=Once sag=30 cup=.95 vowel=.7 second=.4 interval=-12 attack=.05 release=1.4 chiff=.4 leak=.05 volume=6 spread=1 share=0.15 lock=0.85 beat=0.9 | shortwave | slopes | Steel speaks an eh over a low octave and forgets the rest
Hospital roof, asleep | Five sleepers | lung=6 turn=3 starve=.7 sag=55 pipe=Open bite=.65 cup=.6 vowel=.3 second=.8 interval=7 beat=.3 attack=1.4 release=4 spread=1 leak=.4 volume=6 share=0.75 lock=0.7 | lost 1.level=1 | gather | Slow brass and fifths surface one by one and sink | pad
Monks, third watch | Five sleepers | reed=Cane bite=.85 pipe=Chest lung=7 turn=1.5 starve=.4 sag=20 cup=1 vowel=.2 second=.6 interval=-5 beat=.2 lock=1 attack=.6 release=2 spread=0.35 share=0.45 | chant | asleep | Cane on a low oh over fourths, locked and patient
Tulips on the ninth day | Five sleepers | reed=Paper bite=.8 pipe=Open lung=3 turn=2 sag=75 cup=.7 vowel=.4 second=.7 interval=16 attack=.5 release=2 starve=-.4 leak=.1 volume=-1 spread=0.6 share=0.15 lock=0.6 chiff=0.05 beat=0.6 | melting | twochords | Paper with tenths over it wilts at the end of each breath | pad
Village before the dam | Five sleepers | reed=Brass bite=.7 pipe=Stopped lung=4.5 turn=2 sag=35 cup=.9 second=.5 interval=-12 attack=.9 release=3 starve=.9 leak=.4 volume=0 vowel=.22 spread=1 share=0.55 lock=0.2 beat=0.8 | deepwater | asleep | Stopped brass on an oh over low octaves, rising to the surface key by key
Last one awake | Five sleepers | reed=Steel bite=.4 pipe=Open lung=2.4 turn=2.6 sag=12 cup=.5 vowel=.55 second=.4 interval=12 attack=.3 release=6 starve=-1 share=1 leak=.2 volume=6 spread=0.5 lock=0.4 chiff=0.4 beat=2.4 | farstar | highhold | Thin steel that keeps the highest key for itself
`,
    },
  ],
}
